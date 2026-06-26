import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { compileRulePack } from "../src/compiler.js";
import { prepareTask } from "../src/run.js";
import { selectForTask } from "../src/selector.js";

test("prepareTask fails when no rules exist", async () => {
  const fixture = await createFixture();
  await assert.rejects(() => prepareTask("Implement a small TypeScript feature", fixture.cwd, 800, false), /No active rules found/);
});

test("selector matches scoped repo rules and includes high-risk examples", async () => {
  const fixture = await createFixture();
  await writeRule(
    fixture.cwd,
    "ts.react.no-inline-fetch-in-components",
    "high",
    ["typescript"],
    ["react"],
    ["src/**/*.tsx"],
    ["feature", "refactor"],
    ["fetch", "component", "useEffect"],
    "Do not perform raw fetch calls directly inside presentational components.",
    "Use the project data-loading hook or service layer.",
    "Bad: useEffect(() => fetch('/api')). Good: useUserData().",
  );

  const result = await selectForTask({
    task: "Implement data fetching in src/components/UserCard.tsx using React",
    cwd: fixture.cwd,
    tokenBudget: 800,
  });
  const pack = compileRulePack(result);

  assert.deepEqual(pack.ruleIds, ["ts.react.no-inline-fetch-in-components"]);
  assert.match(pack.text, /Do not perform raw fetch calls/);
  assert.match(pack.text, /Bad: useEffect/);
});

test("selector reports explicit conflicts between selected rules", async () => {
  const fixture = await createFixture();
  await writeRule(
    fixture.cwd,
    "ts.services.no-singletons",
    "high",
    ["typescript"],
    [],
    ["src/**/*.ts"],
    ["feature"],
    ["service"],
    "Do not introduce singleton service instances.",
    "Use dependency injection.",
    undefined,
    ["ts.services.prefer-singletons"],
  );
  await writeRule(
    fixture.cwd,
    "ts.services.prefer-singletons",
    "high",
    ["typescript"],
    [],
    ["src/**/*.ts"],
    ["feature"],
    ["service"],
    "Do not wire services through dependency injection.",
    "Use singleton service instances.",
  );

  const result = await selectForTask({
    task: "Add a TypeScript service in src/services/user.ts",
    cwd: fixture.cwd,
    tokenBudget: 800,
  });

  assert.equal(result.conflicts.length, 1);
  assert.deepEqual(result.conflicts[0].ruleIds, ["ts.services.no-singletons", "ts.services.prefer-singletons"]);
});

test("path-scoped rules do not match unrelated mentioned files", async () => {
  const fixture = await createFixture();
  await writeRule(
    fixture.cwd,
    "ts.services.no-singletons",
    "high",
    ["typescript"],
    [],
    ["src/**/*.ts"],
    ["feature"],
    ["service"],
    "Do not introduce singleton service instances.",
    "Use dependency injection.",
  );

  const result = await selectForTask({
    task: "Add React fetch support in src/components/UserCard.tsx",
    cwd: fixture.cwd,
    tokenBudget: 800,
  });

  assert.deepEqual(result.selected.map((match) => match.rule.metadata.id), []);
});

async function createFixture(): Promise<{ cwd: string }> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "ai-rules-test-"));
  process.env.XDG_CONFIG_HOME = path.join(root, ".config");
  await fs.mkdir(path.join(root, ".git"));
  await fs.mkdir(path.join(root, ".ai-rules", "rules"), { recursive: true });
  await fs.writeFile(
    path.join(root, "package.json"),
    JSON.stringify({ dependencies: { react: "latest" }, devDependencies: { typescript: "latest" } }),
  );

  return { cwd: root };
}

async function writeRule(
  cwd: string,
  id: string,
  severity: "low" | "medium" | "high",
  languages: string[],
  frameworks: string[],
  globs: string[],
  taskKinds: string[],
  keywords: string[],
  rule: string,
  prefer: string,
  example?: string,
  conflictsWith: string[] = [],
): Promise<void> {
  const file = path.join(cwd, ".ai-rules", "rules", `${id}.md`);
  await fs.writeFile(
    file,
    [
      "---",
      `id: ${id}`,
      "status: active",
      "layer: repo",
      `severity: ${severity}`,
      "scope:",
      `  languages: [${languages.join(", ")}]`,
      `  frameworks: [${frameworks.join(", ")}]`,
      `  globs: [${globs.map((glob) => `"${glob}"`).join(", ")}]`,
      `  taskKinds: [${taskKinds.join(", ")}]`,
      "triggers:",
      `  keywords: [${keywords.join(", ")}]`,
      `conflictsWith: [${conflictsWith.join(", ")}]`,
      "includeExample: when-needed",
      "---",
      "",
      "## Trigger",
      "When the task matches this rule scope.",
      "",
      "## Rule",
      rule,
      "",
      "## Prefer",
      prefer,
      "",
      "## Rationale",
      "Keeps generated code aligned with project expectations.",
      "",
      "## Example",
      example ?? "",
      "",
    ].join("\n"),
  );
}
