import { minimatch } from "minimatch";
import { loadOverrides, loadRules } from "./rule-files.js";
import { preflight } from "./preflight.js";
import type { ConflictOverride, Rule, RuleConflict, RuleMatch, SelectionInput, SelectionResult } from "./types.js";

const severityScore = {
  low: 5,
  medium: 15,
  high: 30,
} as const;

export async function selectForTask(input: SelectionInput): Promise<SelectionResult> {
  const [rules, overrides, context] = await Promise.all([
    loadRules(input.cwd),
    loadOverrides(input.cwd),
    preflight(input.task, input.cwd),
  ]);

  const ranked = rules
    .map((rule) => scoreRule(rule, input.task, context))
    .filter((match) => match.score >= 20)
    .sort((a, b) => b.score - a.score || a.estimatedTokens - b.estimatedTokens || a.rule.metadata.id.localeCompare(b.rule.metadata.id));

  const { selected, omitted } = fitTokenBudget(ranked, input.tokenBudget);
  const overridden = applyOverrides(selected, overrides);
  const conflicts = detectConflicts(overridden.selected, overrides);

  return {
    context,
    selected: overridden.selected,
    omitted: [...omitted, ...overridden.omitted],
    conflicts,
    overrides,
  };
}

function scoreRule(rule: Rule, task: string, context: SelectionResult["context"]): RuleMatch {
  const reasons: string[] = [];
  let score = severityScore[rule.metadata.severity];

  if (rule.metadata.layer === "repo") {
    score += 5;
    reasons.push("repo rule");
  }

  const languageMatches = overlap(rule.metadata.scope.languages, context.languages);
  if (languageMatches > 0) {
    score += 20 + languageMatches * 3;
    reasons.push("language");
  } else if (rule.metadata.scope.languages.length > 0) {
    score -= 12;
  }

  const frameworkMatches = overlap(rule.metadata.scope.frameworks, context.frameworks);
  if (frameworkMatches > 0) {
    score += 20 + frameworkMatches * 4;
    reasons.push("framework");
  } else if (rule.metadata.scope.frameworks.length > 0) {
    score -= 10;
  }

  const taskKindMatches = overlap(rule.metadata.scope.taskKinds, context.taskKinds);
  if (taskKindMatches > 0) {
    score += 15 + taskKindMatches * 3;
    reasons.push("task kind");
  } else if (rule.metadata.scope.taskKinds.length > 0) {
    score -= 8;
  }

  const globMatches = countGlobMatches(rule, context.mentionedPaths);
  if (globMatches > 0) {
    score += 25 + globMatches * 5;
    reasons.push("mentioned path");
  } else if (rule.metadata.scope.globs.length > 0 && context.mentionedPaths.length > 0) {
    score -= 100;
  }

  const keywordMatches = countKeywordMatches(rule.metadata.triggers.keywords, task);
  if (keywordMatches > 0) {
    score += Math.min(30, keywordMatches * 10);
    reasons.push("trigger keyword");
  }

  const specificity =
    rule.metadata.scope.languages.length +
    rule.metadata.scope.frameworks.length +
    rule.metadata.scope.globs.length +
    rule.metadata.scope.taskKinds.length;
  score += Math.min(12, specificity * 2);

  return {
    rule,
    score,
    reasons,
    estimatedTokens: estimateRuleTokens(rule),
  };
}

function fitTokenBudget(matches: RuleMatch[], tokenBudget: number): { selected: RuleMatch[]; omitted: RuleMatch[] } {
  const selected: RuleMatch[] = [];
  const omitted: RuleMatch[] = [];
  let spent = 0;

  for (const match of matches) {
    if (spent + match.estimatedTokens <= tokenBudget) {
      selected.push(match);
      spent += match.estimatedTokens;
    } else {
      omitted.push(match);
    }
  }

  return { selected, omitted };
}

function applyOverrides(
  selected: RuleMatch[],
  overrides: ConflictOverride[],
): { selected: RuleMatch[]; omitted: RuleMatch[] } {
  const omitted: RuleMatch[] = [];
  let current = [...selected];

  for (const override of overrides) {
    const selectedIds = new Set(current.map((match) => match.rule.metadata.id));
    if (!override.ruleIds.every((ruleId) => selectedIds.has(ruleId))) {
      continue;
    }

    if (override.decision === "omit-rules") {
      const omittedNow = current.filter((match) => override.ruleIds.includes(match.rule.metadata.id));
      omitted.push(...omittedNow);
      current = current.filter((match) => !override.ruleIds.includes(match.rule.metadata.id));
      continue;
    }

    if (override.preferRuleId) {
      const omittedNow = current.filter(
        (match) => override.ruleIds.includes(match.rule.metadata.id) && match.rule.metadata.id !== override.preferRuleId,
      );
      omitted.push(...omittedNow);
      current = current.filter(
        (match) => !override.ruleIds.includes(match.rule.metadata.id) || match.rule.metadata.id === override.preferRuleId,
      );
    }
  }

  return { selected: current, omitted };
}

function detectConflicts(selected: RuleMatch[], overrides: ConflictOverride[]): RuleConflict[] {
  const conflicts: RuleConflict[] = [];

  for (let leftIndex = 0; leftIndex < selected.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < selected.length; rightIndex += 1) {
      const left = selected[leftIndex].rule;
      const right = selected[rightIndex].rule;
      const explicit = left.metadata.conflictsWith.includes(right.metadata.id) || right.metadata.conflictsWith.includes(left.metadata.id);
      const implicit = scopesOverlap(left, right) && patternsOppose(left, right);

      if (explicit || implicit) {
        const ruleIds = [left.metadata.id, right.metadata.id].sort();
        conflicts.push({
          ruleIds,
          reason: explicit ? "Rules explicitly declare a conflict." : "Rules have overlapping scope and opposing guidance.",
          override: overrides.find((override) => sameSet(override.ruleIds, ruleIds)),
        });
      }
    }
  }

  return conflicts.filter((conflict) => conflict.override === undefined);
}

function overlap<T>(left: T[], right: T[]): number {
  if (left.length === 0 || right.length === 0) {
    return 0;
  }

  const rightSet = new Set(right);
  return left.filter((item) => rightSet.has(item)).length;
}

function countGlobMatches(rule: Rule, mentionedPaths: string[]): number {
  if (rule.metadata.scope.globs.length === 0 || mentionedPaths.length === 0) {
    return 0;
  }

  return rule.metadata.scope.globs.reduce(
    (count, glob) => count + mentionedPaths.filter((mentionedPath) => minimatch(mentionedPath, glob)).length,
    0,
  );
}

function countKeywordMatches(keywords: string[], task: string): number {
  const lowerTask = task.toLowerCase();
  return keywords.filter((keyword) => lowerTask.includes(keyword.toLowerCase())).length;
}

function estimateRuleTokens(rule: Rule): number {
  const text = [rule.metadata.id, rule.body.rule, rule.body.prefer, rule.body.example ?? ""].join(" ");
  return Math.max(30, Math.ceil(text.split(/\s+/).filter(Boolean).length * 1.35));
}

function scopesOverlap(left: Rule, right: Rule): boolean {
  return (
    dimensionsOverlap(left.metadata.scope.languages, right.metadata.scope.languages) &&
    dimensionsOverlap(left.metadata.scope.frameworks, right.metadata.scope.frameworks) &&
    dimensionsOverlap(left.metadata.scope.taskKinds, right.metadata.scope.taskKinds) &&
    globsOverlap(left.metadata.scope.globs, right.metadata.scope.globs)
  );
}

function dimensionsOverlap<T>(left: T[], right: T[]): boolean {
  return left.length === 0 || right.length === 0 || overlap(left, right) > 0;
}

function globsOverlap(left: string[], right: string[]): boolean {
  if (left.length === 0 || right.length === 0) {
    return true;
  }

  return left.some((leftGlob) => right.some((rightGlob) => leftGlob === rightGlob || leftGlob.includes(rightGlob) || rightGlob.includes(leftGlob)));
}

function patternsOppose(left: Rule, right: Rule): boolean {
  return containsMeaningfulPhrase(left.body.rule, right.body.prefer) || containsMeaningfulPhrase(right.body.rule, left.body.prefer);
}

function containsMeaningfulPhrase(text: string, phrase: string): boolean {
  const normalizedText = normalize(text);
  const normalizedPhrase = normalize(phrase);
  const words = normalizedPhrase.split(" ").filter((word) => word.length > 3);
  const sampledPhrase = words.slice(0, 6).join(" ");

  return sampledPhrase.length > 12 && normalizedText.includes(sampledPhrase);
}

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function sameSet(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((item) => right.includes(item));
}
