import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { runAiRulesCli } from "../src/cli.js";
import { installPiExtension, renderPiExtension } from "../src/pi.js";
import { runSetup } from "../src/setup.js";

test("renders a Pi extension that registers /airules", () => {
  const extension = renderPiExtension({
    aiRulesCommand: "ai-rules",
    budget: 500,
  });

  assert.match(extension, /pi\.registerCommand\("airules"/);
  assert.match(extension, /Run a task with ai-rules selected coding instructions/);
  assert.match(extension, /COMPILE_SHELL = "ai-rules debug compile --budget 500 --no-resolve-conflicts/);
  assert.match(extension, /\$@/);
  assert.match(extension, /pi\.registerCommand\("create-rule"/);
  assert.match(extension, /ctx\.sendUserMessage/);
});

test("installs a repo-local Pi extension", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "ai-rules-pi-"));
  const extensionPath = await installPiExtension({
    cwd: root,
    scope: "repo",
    budget: 800,
    force: false,
    aiRulesCommand: "ai-rules",
  });
  const extension = await fs.readFile(extensionPath, "utf8");

  assert.equal(extensionPath, path.join(root, ".pi", "extensions", "ai-rules.ts"));
  assert.match(extension, /COMPILE_SHELL = "ai-rules debug compile --budget 800 --no-resolve-conflicts/);
});

test("setup installs Pi integration alongside OpenCode", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "ai-rules-setup-pi-"));
  process.env.XDG_CONFIG_HOME = path.join(root, ".config");
  await fs.mkdir(path.join(root, ".git"));

  const result = await runSetup({
    cwd: root,
    global: false,
    force: false,
  });

  assert.match(result.integrations.join("\n"), /OpenCode \/airules and \/create-rule/);
  assert.match(result.integrations.join("\n"), /Pi \/airules and \/create-rule/);
  await fs.access(path.join(root, ".pi", "extensions", "ai-rules.ts"));
});

test("debug install pi writes the extension file", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "ai-rules-debug-pi-"));
  const code = await runAiRulesCli(["debug", "install", "pi", "--force"], root);

  assert.equal(code, 0);
  await fs.access(path.join(root, ".pi", "extensions", "ai-rules.ts"));
});

test("setup --tool pi installs only Pi integration", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "ai-rules-setup-pi-only-"));
  process.env.XDG_CONFIG_HOME = path.join(root, ".config");
  await fs.mkdir(path.join(root, ".git"));

  const result = await runSetup({
    cwd: root,
    global: false,
    force: false,
    tool: "pi",
  });

  assert.doesNotMatch(result.integrations.join("\n"), /OpenCode/);
  assert.match(result.integrations.join("\n"), /Pi \/airules and \/create-rule/);
});
