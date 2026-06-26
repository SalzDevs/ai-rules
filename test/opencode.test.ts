import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { runAiRulesCli } from "../src/cli.js";
import { installOpenCodeCommand, renderOpenCodeCommand } from "../src/opencode.js";
import { runSetup } from "../src/setup.js";
import { defaultPersonalRulesDir, rulesSubdir } from "../src/paths.js";
import { resolveTool } from "../src/tools.js";

test("renders an OpenCode command that injects ai-rules debug compile output", () => {
  const command = renderOpenCodeCommand({
    aiRulesCommand: "ai-rules",
    budget: 500,
  });

  assert.match(command, /description: Run a task with ai-rules selected coding instructions/);
  assert.match(command, /cat <<'AI_RULES_TASK' \| ai-rules debug compile --budget 500 --no-resolve-conflicts/);
  assert.match(command, /\$ARGUMENTS/);
  assert.match(command, /## User Task/);
});

test("installs a repo-local OpenCode slash command", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "ai-rules-opencode-"));
  const commandPath = await installOpenCodeCommand({
    cwd: root,
    scope: "repo",
    commandName: "airules",
    budget: 800,
    force: false,
    aiRulesCommand: "ai-rules",
  });
  const command = await fs.readFile(commandPath, "utf8");

  assert.equal(commandPath, path.join(root, ".opencode", "commands", "airules.md"));
  assert.match(command, /ai-rules debug compile --budget 800 --no-resolve-conflicts/);
});

test("setup creates personal rule folder and integrations", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "ai-rules-setup-"));
  process.env.XDG_CONFIG_HOME = path.join(root, ".config");
  await fs.mkdir(path.join(root, ".git"));

  const result = await runSetup({
    cwd: root,
    global: false,
    force: false,
  });

  assert.match(result.integrations.join("\n"), /OpenCode \/airules command/);
  assert.match(result.integrations.join("\n"), /Pi \/airules extension/);
  assert.equal(result.personalRulesDir, rulesSubdir(defaultPersonalRulesDir()));
  const ruleEntries = await fs.readdir(result.personalRulesDir);
  assert.equal(ruleEntries.length, 0);
});

test("run fails when no rules exist", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "ai-rules-cli-"));
  process.env.XDG_CONFIG_HOME = path.join(root, ".config");
  await fs.mkdir(path.join(root, ".git"));
  await runSetup({ cwd: root, global: false, force: false });

  const code = await runAiRulesCli(["run", "Implement a TypeScript feature", "--dry-run"], root);
  assert.equal(code, 1);
});

test("bare task argument is treated as run with dry-run when rules exist", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "ai-rules-cli-"));
  process.env.XDG_CONFIG_HOME = path.join(root, ".config");
  await fs.mkdir(path.join(root, ".git"));
  await runSetup({ cwd: root, global: false, force: false });
  await writeMinimalRule(root);

  const code = await runAiRulesCli(["Implement a TypeScript feature", "--dry-run"], root);
  assert.equal(code, 0);
});

test("resolveTool rejects unknown explicit tool", async () => {
  await assert.rejects(() => resolveTool("unknown-tool"), /Unknown tool/);
});

async function writeMinimalRule(_cwd: string): Promise<void> {
  const file = path.join(rulesSubdir(defaultPersonalRulesDir()), "general.minimal-diff.md");
  await fs.writeFile(
    file,
    `---
id: general.minimal-diff
status: active
layer: personal
severity: medium
scope:
  languages: []
  frameworks: []
  globs: ["**/*"]
  taskKinds: [feature]
triggers:
  keywords: [implement]
conflictsWith: []
includeExample: never
---

## Trigger
When making requested code changes.

## Rule
Keep the diff focused on the requested task.

## Prefer
Avoid unrelated refactors unless explicitly requested.

## Rationale
Smaller diffs are easier to review.

## Example

`,
    "utf8",
  );
}
