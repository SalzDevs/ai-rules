import { DEFAULT_TOKEN_BUDGET } from "./compile-contract.js";
import { prepareTask } from "./run.js";
import { closePrompts } from "./prompt.js";
import { launchTool, resolveTool, type ToolName } from "./tools.js";

export interface RunTaskOptions {
  task: string;
  cwd: string;
  tool?: string;
  dryRun?: boolean;
  budget?: number;
}

export async function runTask(options: RunTaskOptions): Promise<number> {
  const { task, cwd, dryRun = false, budget = DEFAULT_TOKEN_BUDGET } = options;

  if (!task.trim()) {
    throw new Error('A task is required. Example: ai-rules run "implement the feature"');
  }

  try {
    const tool = await resolveTool(options.tool);
    const prepared = await prepareTask(task, cwd, budget, true);

    if (dryRun) {
      console.log(formatDryRunOutput(tool, prepared.prompt));
      return 0;
    }

    return await launchTool(tool, prepared.prompt);
  } finally {
    closePrompts();
  }
}

function formatDryRunOutput(tool: ToolName, prompt: string): string {
  return [`Tool: ${tool}`, "", prompt].join("\n");
}
