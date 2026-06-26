import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_TOKEN_BUDGET,
  buildCompileSubcommand,
  buildIntegrationCompileInvocation,
  buildIntegrationCompileShell,
  parseTokenBudget,
} from "../src/compile-contract.js";

test("parseTokenBudget defaults and validates", () => {
  assert.equal(parseTokenBudget(undefined), DEFAULT_TOKEN_BUDGET);
  assert.equal(parseTokenBudget("500"), 500);
  assert.equal(parseTokenBudget("bad", 400), 400);
});

test("buildCompileSubcommand encodes conflict policy", () => {
  assert.equal(
    buildCompileSubcommand({ budget: 500, resolveConflicts: false }),
    "debug compile --budget 500 --no-resolve-conflicts",
  );
  assert.equal(buildCompileSubcommand({ budget: 500, resolveConflicts: true }), "debug compile --budget 500");
});

test("integration compile builders stay aligned", () => {
  assert.equal(
    buildIntegrationCompileInvocation("ai-rules", 800),
    "ai-rules debug compile --budget 800 --no-resolve-conflicts",
  );
  assert.equal(
    buildIntegrationCompileShell("npx --yes ai-rules", 600),
    'npx --yes ai-rules debug compile --budget 600 --no-resolve-conflicts "$@"',
  );
});
