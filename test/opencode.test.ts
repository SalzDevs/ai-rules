import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { runAiRulesCli } from "../src/cli.js";
import { installOpenCodeCommand, renderOpenCodeCommand } from "../src/opencode.js";
import { promoteRule } from "../src/promote.js";
import { runSetup } from "../src/setup.js";
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

test("setup creates folders, starter rules, and OpenCode integration", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "ai-rules-setup-"));
  process.env.XDG_CONFIG_HOME = path.join(root, ".config");
  await fs.mkdir(path.join(root, ".git"));

  const result = await runSetup({
    cwd: root,
    global: false,
    withExamples: true,
    force: false,
  });

  assert.ok(result.starterRules.length >= 3);
  assert.match(result.integrations.join("\n"), /OpenCode \/airules command/);
  await fs.access(path.join(root, ".ai-rules", "rules", "ts.react.no-inline-fetch.md"));
});

test("promote --yes saves a rule without prompts", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "ai-rules-promote-"));
  process.env.XDG_CONFIG_HOME = path.join(root, ".config");
  await fs.mkdir(path.join(root, ".git"));

  const filePath = await promoteRule({
    cwd: root,
    comment: "React components should not fetch directly",
    yes: true,
  });

  const content = await fs.readFile(filePath, "utf8");
  assert.match(content, /React components should not fetch directly/);
  assert.match(filePath, /\.ai-rules\/rules\//);
});

test("bare task argument is treated as run with dry-run", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "ai-rules-cli-"));
  process.env.XDG_CONFIG_HOME = path.join(root, ".config");
  await fs.mkdir(path.join(root, ".git"));

  const code = await runAiRulesCli(["Implement a TypeScript feature", "--dry-run"], root);
  assert.equal(code, 0);
});

test("resolveTool rejects unknown explicit tool", async () => {
  await assert.rejects(() => resolveTool("unknown-tool"), /Unknown tool/);
});
