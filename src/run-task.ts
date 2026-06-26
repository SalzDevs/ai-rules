import { DEFAULT_TOKEN_BUDGET } from "./compile-contract.js";
import { prepareTask } from "./run.js";
import { closePrompts } from "./prompt.js";
import { launchTool, resolveTool, detectAvailableTools, type ToolName } from "./tools.js";

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
    const prepared = await prepareTask(task, cwd, budget, true);

    if (dryRun) {
      const tool = await resolveToolForDryRun(options.tool);
      console.log(formatDryRunOutput(tool, prepared.prompt));
      return 0;
    }

    const tool = await resolveTool(options.tool);
    return await launchTool(tool, prepared.prompt);
  } finally {
    closePrompts();
  }
}

function formatDryRunOutput(tool: ToolName, prompt: string): string {
  return [`Tool: ${tool}`, "", prompt].join("\n");
}

async function resolveToolForDryRun(explicit?: string): Promise<ToolName> {
  if (explicit) {
    return resolveTool(explicit);
  }

  const available = await detectAvailableTools();
  return available[0] ?? "opencode";
}
