import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { installOpenCodeCommand, renderOpenCodeCommand } from "../src/opencode.js";

test("renders an OpenCode command that injects ai-rules output from arguments", () => {
  const command = renderOpenCodeCommand({
    aiRulesCommand: "ai-rules",
    budget: 500,
  });

  assert.match(command, /description: Run a task with ai-rules selected coding instructions/);
  assert.match(command, /cat <<'AI_RULES_TASK' \| ai-rules compile --budget 500 --no-resolve-conflicts/);
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
  assert.match(command, /ai-rules compile --budget 800 --no-resolve-conflicts/);
});

test("refuses to overwrite an OpenCode command without force", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "ai-rules-opencode-"));
  await installOpenCodeCommand({
    cwd: root,
    scope: "repo",
    commandName: "airules",
    budget: 800,
    force: false,
    aiRulesCommand: "ai-rules",
  });

  await assert.rejects(
    () =>
      installOpenCodeCommand({
        cwd: root,
        scope: "repo",
        commandName: "airules",
        budget: 800,
        force: false,
        aiRulesCommand: "ai-rules",
      }),
    /already exists/,
  );
});
