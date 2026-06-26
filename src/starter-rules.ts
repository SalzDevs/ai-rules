import fs from "node:fs/promises";
import path from "node:path";
import { pathExists } from "./file-system.js";
import { repoRulesDir, rulesSubdir } from "./paths.js";
import { ensureDir } from "./preflight.js";

interface StarterRule {
  filename: string;
  content: string;
}

const starterRules: StarterRule[] = [
  {
    filename: "ts.react.no-inline-fetch.md",
    content: `---
id: ts.react.no-inline-fetch
status: active
layer: repo
severity: high
scope:
  languages: [typescript]
  frameworks: [react]
  globs: ["src/**/*.tsx"]
  taskKinds: [feature, refactor]
triggers:
  keywords: [fetch, component, react, useEffect]
conflictsWith: []
includeExample: when-needed
---

## Trigger
When writing React UI components that need server data.

## Rule
Do not perform raw fetch calls directly inside presentational components.

## Prefer
Use the project data-loading hook or service layer.

## Rationale
Keeps UI components testable and preserves the existing data boundary.

## Example
Bad: useEffect(() => fetch('/api')). Good: useUserData().
`,
  },
  {
    filename: "general.match-existing-patterns.md",
    content: `---
id: general.match-existing-patterns
status: active
layer: repo
severity: medium
scope:
  languages: []
  frameworks: []
  globs: ["**/*"]
  taskKinds: [feature, fix, refactor]
triggers:
  keywords: [implement, add, create, refactor]
conflictsWith: []
includeExample: never
---

## Trigger
When adding or changing code in an existing area of the repository.

## Rule
Do not introduce a new pattern when a nearby established pattern already exists.

## Prefer
Match the conventions, naming, and structure already used in the surrounding files.

## Rationale
Consistency makes generated code easier to review and maintain.

## Example

`,
  },
  {
    filename: "general.minimal-diff.md",
    content: `---
id: general.minimal-diff
status: active
layer: repo
severity: medium
scope:
  languages: []
  frameworks: []
  globs: ["**/*"]
  taskKinds: [feature, fix, refactor, chore]
triggers:
  keywords: [fix, change, update, implement]
conflictsWith: []
includeExample: never
---

## Trigger
When making requested code changes.

## Rule
Keep the diff focused on the requested task.

## Prefer
Avoid unrelated refactors, renames, or formatting-only changes unless explicitly requested.

## Rationale
Smaller diffs are easier to review and reduce the chance of regressions.

## Example

`,
  },
];

export async function installStarterRules(cwd: string, force = false): Promise<string[]> {
  const rulesDir = rulesSubdir(repoRulesDir(cwd));
  await ensureDir(rulesDir);

  const created: string[] = [];
  for (const rule of starterRules) {
    const filePath = path.join(rulesDir, rule.filename);
    if (!force && (await pathExists(filePath))) {
      continue;
    }

    await fs.writeFile(filePath, rule.content, "utf8");
    created.push(filePath);
  }

  return created;
}

export async function countRepoRules(cwd: string): Promise<number> {
  const rulesDir = rulesSubdir(repoRulesDir(cwd));
  if (!(await pathExists(rulesDir))) {
    return 0;
  }

  const entries = await fs.readdir(rulesDir);
  return entries.filter((entry) => entry.endsWith(".md")).length;
}
