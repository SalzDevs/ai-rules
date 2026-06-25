import { prepareTask } from "./run.js";
import { closePrompts } from "./prompt.js";
import { launchTool, type ToolName } from "./tool-adapters.js";

export async function runWrapper(tool: ToolName, argv: string[], cwd = process.cwd()): Promise<number> {
  const { task, dryRun, budget } = parseWrapperArgs(argv);
  if (!task) {
    console.error(`A task is required. Example: smart-${tool} "implement the feature"`);
    return 1;
  }

  try {
    const prepared = await prepareTask(task, cwd, budget, true);
    if (dryRun) {
      console.log(prepared.prompt);
      return 0;
    }

    return await launchTool(tool, prepared.prompt);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  } finally {
    closePrompts();
  }
}

function parseWrapperArgs(argv: string[]): { task: string; dryRun: boolean; budget: number } {
  let dryRun = false;
  let budget = 800;
  const positional: string[] = [];

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--dry-run") {
      dryRun = true;
      continue;
    }
    if (arg === "--budget") {
      const value = Number.parseInt(argv[index + 1] ?? "", 10);
      if (Number.isFinite(value) && value > 0) {
        budget = value;
      }
      index += 1;
      continue;
    }
    if (arg.startsWith("--budget=")) {
      const value = Number.parseInt(arg.slice("--budget=".length), 10);
      if (Number.isFinite(value) && value > 0) {
        budget = value;
      }
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
