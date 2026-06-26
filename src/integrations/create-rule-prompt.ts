import { defaultPersonalRulesDir, rulesSubdir } from "../paths.js";

export function personalRulesDirPath(): string {
  return rulesSubdir(defaultPersonalRulesDir());
}

export function renderCreateRulePrompt(options: { seed?: string } = {}): string {
  const rulesDir = personalRulesDirPath();
  const lines = [
    "# ai-rules: create a personal rule",
    "",
    "Conduct a rule-creation interview in this session. Ask **one question at a time**.",
    "Do not write the file until the user confirms the preview.",
    "",
    `## Save location`,
    `Write the finished rule to: \`${rulesDir}/<id>.md\``,
    "Create the directory if it does not exist.",
    "",
    "## Required file format",
    "Markdown with YAML frontmatter and these sections: Trigger, Rule, Prefer, Rationale, Example.",
    "",
    "```markdown",
    "---",
    "id: example.rule-id",
    "status: active",
    "layer: personal",
    "severity: medium",
    "scope:",
    "  languages: []",
    "  frameworks: []",
    "  globs: [\"**/*\"]",
    "  taskKinds: [feature, refactor]",
    "triggers:",
    "  keywords: [keyword1, keyword2]",
    "conflictsWith: []",
    "includeExample: never",
    "---",
    "",
    "## Trigger",
    "When ...",
    "",
    "## Rule",
    "...",
    "",
    "## Prefer",
    "...",
    "",
    "## Rationale",
    "...",
    "",
    "## Example",
    "",
    "```",
    "",
    "Fixed values: `layer: personal`, `status: active`. Use `includeExample: when-needed` only if Example is non-empty.",
    "",
    "## Interview (in order)",
    "1. What should the agent avoid or always do?",
    "2. What should it do instead?",
    "3. When does this apply? (plain language for Trigger)",
    "4. Why does this matter? (Rationale — infer briefly if the user skips)",
    "5. File path patterns (globs — default `[\"**/*\"]`, narrow when obvious)",
    "6. Languages and frameworks (optional — comma-separated)",
    "7. Task types: feature, fix, refactor, test, docs, review, chore (default: feature, refactor)",
    "8. Trigger keywords that should surface this rule in task text",
    "9. Severity: low, medium, or high (default medium; use high for hard must-not-violate rules)",
    "10. Rule id slug (suggest from the rule; lowercase with dots or hyphens)",
    "11. Bad vs good example? (optional)",
    "",
    "Skip or combine questions when the user already answered them. If a seed is provided below, use it and only ask what is still missing.",
    "",
    "## When finished",
    "1. Show the full Markdown preview.",
    "2. Ask: Save, Edit, or Cancel.",
    "3. On Save: write exactly one file to the save location. If `<id>.md` exists, ask before overwriting.",
    "4. Confirm the saved path and suggest testing with: `ai-rules debug select \"example task matching this rule\"`.",
  ];

  if (options.seed?.trim()) {
    lines.push("", "## Seed from user", options.seed.trim());
  }

  return lines.join("\n");
}

export function renderOpenCodeCreateRuleCommand(): string {
  return ["---", "description: Interview and create a personal ai-rules rule", "---", "", renderCreateRulePrompt(), "", "## Seed from user", "$ARGUMENTS", ""].join(
    "\n",
  );
}
