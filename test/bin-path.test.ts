import assert from "node:assert/strict";
import test from "node:test";
import { isLocalDevInstall, isStableGlobalInstall, resolveAiRulesCommand } from "../src/bin-path.js";

test("detects local dev install paths", () => {
  assert.equal(
    isLocalDevInstall("/Users/dev/ai-rules/dist/bin/ai-rules.js"),
    true,
  );
  assert.equal(
    isLocalDevInstall("/Users/dev/.npm/_npx/abc/node_modules/ai-rules/dist/bin/ai-rules.js"),
    false,
  );
});

test("treats npx shims as unstable installs", () => {
  assert.equal(
    isStableGlobalInstall("/Users/dev/.npm/_npx/abc/bin/ai-rules"),
    false,
  );
  assert.equal(
    isStableGlobalInstall("/opt/homebrew/bin/ai-rules"),
    true,
  );
});

test("defaults to npx command when no stable global install exists", async () => {
  const original = process.env.AI_RULES_BIN;
  delete process.env.AI_RULES_BIN;

  try {
    const command = await resolveAiRulesCommand();
    assert.match(command, /^(ai-rules|npx --yes ai-rules)$/);
  } finally {
    if (original === undefined) {
      delete process.env.AI_RULES_BIN;
    } else {
      process.env.AI_RULES_BIN = original;
    }
  }
});

test("uses AI_RULES_BIN override when set", async () => {
  const original = process.env.AI_RULES_BIN;
  process.env.AI_RULES_BIN = "custom-ai-rules";

  try {
    assert.equal(await resolveAiRulesCommand(), "custom-ai-rules");
  } finally {
    if (original === undefined) {
      delete process.env.AI_RULES_BIN;
    } else {
      process.env.AI_RULES_BIN = original;
    }
  }
});
