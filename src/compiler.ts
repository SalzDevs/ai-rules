import type { CompiledRulePack, RuleMatch, SelectionResult } from "./types.js";

const behaviorCore = [
  "Follow the selected rule contract below when writing code for this task.",
  "If selected rules conflict, stop and ask before choosing a pattern.",
  "Do not invent project standards that are not in the selected rules or visible code.",
];

export function compileRulePack(selection: SelectionResult): CompiledRulePack {
  const instructions = selection.selected.map(formatInstruction);
  const examples = selection.selected
    .filter(shouldIncludeExample)
    .filter((match) => match.rule.body.example)
    .map((match) => ({
      ruleId: match.rule.metadata.id,
      text: match.rule.body.example as string,
    }));

  const text = renderRulePack({
    core: behaviorCore,
    ruleIds: selection.selected.map((match) => match.rule.metadata.id),
    instructions,
    examples,
    conflicts: selection.conflicts,
    estimatedTokens: 0,
    text: "",
  });

  return {
    core: behaviorCore,
    ruleIds: selection.selected.map((match) => match.rule.metadata.id),
    instructions,
    examples,
    conflicts: selection.conflicts,
    text,
    estimatedTokens: estimateTokens(text),
  };
}

export function prefixTaskWithRulePack(task: string, pack: CompiledRulePack): string {
  return `${pack.text}\n\n## User Task\n${task}`;
}

function renderRulePack(pack: Omit<CompiledRulePack, "text"> & { text: string }): string {
  const lines = [
    "## AI Rules Contract",
    "",
    "### Core",
    ...pack.core.map((item) => `- ${item}`),
    "",
  ];

  if (pack.ruleIds.length === 0) {
    lines.push("### Selected Rules", "- No high-confidence specialized rules matched this task.", "");
  } else {
    lines.push("### Selected Rules", ...pack.ruleIds.map((ruleId) => `- ${ruleId}`), "", "### Mandatory Instructions");
    lines.push(...pack.instructions.map((instruction) => `- ${instruction}`), "");
  }

  if (pack.examples.length > 0) {
    lines.push("### Examples");
    for (const example of pack.examples) {
      lines.push(`Rule ${example.ruleId}:`, example.text, "");
    }
  }

  return lines.join("\n").trim();
}

function formatInstruction(match: RuleMatch): string {
  const { metadata, body } = match.rule;
  return `[${metadata.id}] ${body.rule} Prefer: ${body.prefer}`;
}

function shouldIncludeExample(match: RuleMatch): boolean {
  const include = match.rule.metadata.includeExample ?? "when-needed";
  if (include === "always") {
    return true;
  }
  if (include === "never") {
    return false;
  }

  return match.rule.metadata.severity === "high";
}

function estimateTokens(text: string): number {
  return Math.ceil(text.split(/\s+/).filter(Boolean).length * 1.35);
}
