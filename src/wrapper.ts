import { DEFAULT_TOKEN_BUDGET, parseTokenBudget } from "./compile-contract.js";
import { runTask } from "./run-task.js";
import type { ToolName } from "./tools.js";

export async function runWrapper(tool: ToolName, argv: string[], cwd = process.cwd()): Promise<number> {
  const { task, dryRun, budget } = parseWrapperArgs(argv);
  return runTask({
    task,
    cwd,
    tool,
    dryRun,
    budget,
  });
}

function parseWrapperArgs(argv: string[]): { task: string; dryRun: boolean; budget: number } {
  let dryRun = false;
  let budget = DEFAULT_TOKEN_BUDGET;
  const positional: string[] = [];

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--dry-run") {
      dryRun = true;
      continue;
    }
    if (arg === "--budget") {
      budget = parseTokenBudget(argv[index + 1], budget);
      index += 1;
      continue;
    }
    if (arg.startsWith("--budget=")) {
      budget = parseTokenBudget(arg.slice("--budget=".length), budget);
      continue;
    }

    positional.push(arg);
  }

  return {
    task: positional.join(" ").trim(),
    dryRun,
    budget,
  };
}
