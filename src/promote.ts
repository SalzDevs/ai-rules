import fs from "node:fs/promises";
import path from "node:path";
import YAML from "yaml";
import { defaultPersonalRulesDir, repoRulesDir, rulesSubdir } from "./paths.js";
import { ask, askChoice, readStdinIfAvailable } from "./prompt.js";
import { ensureDir } from "./preflight.js";
import type { RuleLayer, Severity, TaskKind } from "./types.js";

interface PromoteOptions {
  cwd: string;
  comment?: string;
  layer?: RuleLayer;
  printDraftPrompt?: boolean;
  yes?: boolean;
}

const taskKinds: TaskKind[] = ["feature", "fix", "refactor", "test", "docs", "review", "chore"];

export async function promoteRule(options: PromoteOptions): Promise<string> {
  const stdin = options.comment ? "" : await readStdinIfAvailable();
  const comment = (options.comment ?? stdin).trim() || (await ask("Paste the review comment"));
  if (!comment) {
    throw new Error("A review comment is required to promote a rule.");
  }

  if (options.printDraftPrompt) {
    return buildDraftingPrompt(comment);
  }

  const draft = draftFromComment(comment);

  if (options.yes) {
    const layer = options.layer ?? (await defaultLayer(options.cwd));
    return savePromotedRule(options.cwd, {
      id: draft.id,
      layer,
      severity: draft.severity,
      languages: draft.languages,
      frameworks: draft.frameworks,
      globs: draft.globs,
      taskKinds: draft.taskKinds,
      keywords: draft.keywords,
      trigger: draft.trigger,
      rule: draft.rule,
      prefer: draft.prefer,
      rationale: draft.rationale,
      example: "",
    });
  }

  const layer = options.layer ?? (await askChoice("Where should this rule live?", ["personal", "repo"], "repo")) as RuleLayer;
  const id = await ask("Rule id", draft.id);
  const severity = (await askChoice("Severity", ["low", "medium", "high"], draft.severity)) as Severity;
  const languages = splitCsv(await ask("Languages, comma-separated", draft.languages.join(", ")));
  const frameworks = splitCsv(await ask("Frameworks, comma-separated", draft.frameworks.join(", ")));
  const globs = splitCsv(await ask("File globs, comma-separated", draft.globs.join(", ")));
  const selectedTaskKinds = splitCsv(await ask("Task kinds, comma-separated", draft.taskKinds.join(", "))).filter((kind): kind is TaskKind =>
    taskKinds.includes(kind as TaskKind),
  );
  const keywords = splitCsv(await ask("Trigger keywords, comma-separated", draft.keywords.join(", ")));
  const trigger = await ask("Trigger", draft.trigger);
  const rule = await ask("Forbidden or mandatory rule", draft.rule);
  const prefer = await ask("Preferred pattern", draft.prefer);
  const rationale = await ask("Rationale", draft.rationale);
  const example = await ask("Example, optional", "");

  return savePromotedRule(options.cwd, {
    id,
    layer,
    severity,
    languages,
    frameworks,
    globs,
    taskKinds: selectedTaskKinds,
    keywords,
    trigger,
    rule,
    prefer,
    rationale,
    example,
  });
}

interface SavedRuleInput {
  id: string;
  layer: RuleLayer;
  severity: Severity;
  languages: string[];
  frameworks: string[];
  globs: string[];
  taskKinds: TaskKind[];
  keywords: string[];
  trigger: string;
  rule: string;
  prefer: string;
  rationale: string;
  example: string;
}

async function savePromotedRule(cwd: string, input: SavedRuleInput): Promise<string> {

  const baseDir = input.layer === "repo" ? repoRulesDir(cwd) : defaultPersonalRulesDir();
  const rulesDir = rulesSubdir(baseDir);
  await ensureDir(rulesDir);

  const filePath = await uniqueRulePath(rulesDir, input.id);
  const frontmatter = YAML.stringify({
    id: input.id,
    status: "active",
    layer: input.layer,
    severity: input.severity,
    scope: {
      languages: input.languages,
      frameworks: input.frameworks,
      globs: input.globs,
      taskKinds: input.taskKinds,
    },
    triggers: {
      keywords: input.keywords,
    },
    conflictsWith: [],
    includeExample: input.example ? "when-needed" : "never",
    createdAt: new Date().toISOString(),
  });

  const body = [
    "---",
    frontmatter.trim(),
    "---",
    "",
    "## Trigger",
    input.trigger,
    "",
    "## Rule",
    input.rule,
    "",
    "## Prefer",
    input.prefer,
    "",
    "## Rationale",
    input.rationale,
    "",
    "## Example",
    input.example,
    "",
  ].join("\n");

  await fs.writeFile(filePath, body, "utf8");
  return filePath;
}

async function defaultLayer(cwd: string): Promise<RuleLayer> {
  try {
    await fs.access(path.join(cwd, ".git"));
    return "repo";
  } catch {
    return "personal";
  }
}

function draftFromComment(comment: string) {
  const words = comment
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .split(/\s+/)
    .filter((word) => word.length > 3)
    .slice(0, 6);
  const id = `rule.${words.join("-") || "promoted-review-comment"}`;

  return {
    id,
    severity: "medium" as Severity,
    languages: inferLanguages(comment),
    frameworks: inferFrameworks(comment),
    globs: ["**/*"],
    taskKinds: inferTaskKinds(comment),
    keywords: words.slice(0, 5),
    trigger: `When ${comment}`,
    rule: comment,
    prefer: "Use the preferred local pattern already established in the surrounding code.",
    rationale: "This captures a repeated review finding so future AI-written code avoids the same issue.",
  };
}

function inferLanguages(comment: string): string[] {
  const lower = comment.toLowerCase();
  if (/\btypescript|tsx|ts\b/.test(lower)) {
    return ["typescript"];
  }
  if (/\bjavascript|jsx|js\b/.test(lower)) {
    return ["javascript"];
  }
  if (/\bpython|py\b/.test(lower)) {
    return ["python"];
  }
  return [];
}

function inferFrameworks(comment: string): string[] {
  const lower = comment.toLowerCase();
  return ["react", "next", "vue", "svelte", "express", "fastify"].filter((framework) => lower.includes(framework));
}

function inferTaskKinds(comment: string): TaskKind[] {
  const lower = comment.toLowerCase();
  if (lower.includes("test")) {
    return ["test"];
  }
  if (lower.includes("refactor")) {
    return ["refactor"];
  }
  if (lower.includes("bug") || lower.includes("fix")) {
    return ["fix"];
  }
  return ["feature", "refactor"];
}

function splitCsv(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

async function uniqueRulePath(rulesDir: string, id: string): Promise<string> {
  const safeId = id.replace(/[^a-zA-Z0-9._-]/g, "-");
  let candidate = path.join(rulesDir, `${safeId}.md`);
  let index = 2;

  while (await exists(candidate)) {
    candidate = path.join(rulesDir, `${safeId}-${index}.md`);
    index += 1;
  }

  return candidate;
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function buildDraftingPrompt(comment: string): string {
  return [
    "Turn this review comment into one precise ai-rules rule.",
    "Return: trigger, rule, prefer, rationale, severity, languages, frameworks, globs, taskKinds, keywords.",
    "Keep it scoped. Do not make it global unless the comment clearly applies globally.",
    "",
    "Review comment:",
    comment,
  ].join("\n");
}
