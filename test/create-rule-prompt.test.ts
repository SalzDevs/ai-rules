import assert from "node:assert/strict";
import test from "node:test";
import { renderCreateRulePrompt, renderOpenCodeCreateRuleCommand } from "../src/integrations/create-rule-prompt.js";
import { renderOpenCodeCommand } from "../src/integrations/opencode.js";
import { renderPiExtension } from "../src/integrations/pi.js";

test("renderCreateRulePrompt includes interview flow and personal save path", () => {
  const prompt = renderCreateRulePrompt({ seed: "no fetch in React components" });

  assert.match(prompt, /create a personal rule/);
  assert.match(prompt, /Ask \*\*one question at a time\*\*/);
  assert.match(prompt, /Every interview step is MCQ/);
  assert.match(prompt, /question` tool/);
  assert.match(prompt, /### 1\. Rule intent \(MCQ\)/);
  assert.match(prompt, /### 8\. Trigger keywords \(MCQ\)/);
  assert.match(prompt, /Other \(type your own\)/);
  assert.match(prompt, /### 9\. Severity \(MCQ\)/);
  assert.match(prompt, /Use the `question` tool: Save/);
  assert.match(prompt, /layer: personal/);
  assert.match(prompt, /Write the finished rule to:/);
  assert.match(prompt, /Seed from user/);
  assert.match(prompt, /no fetch in React components/);
});

test("renderOpenCodeCreateRuleCommand includes seed placeholder", () => {
  const command = renderOpenCodeCreateRuleCommand();

  assert.match(command, /description: Interview and create a personal ai-rules rule/);
  assert.match(command, /\$ARGUMENTS/);
  assert.match(command, /one question at a time/i);
});

test("Pi extension registers create-rule command", () => {
  const extension = renderPiExtension({ aiRulesCommand: "ai-rules", budget: 800 });

  assert.match(extension, /pi\.registerCommand\("create-rule"/);
  assert.match(extension, /pi\.registerTool\(\{/);
  assert.match(extension, /name: "question"/);
  assert.match(extension, /Interview and create a personal ai-rules rule/);
  assert.match(extension, /CREATE_RULE_PROMPT/);
});

test("OpenCode airules command unchanged", () => {
  const command = renderOpenCodeCommand({ aiRulesCommand: "ai-rules", budget: 800 });
  assert.match(command, /debug compile --budget 800 --no-resolve-conflicts/);
});
