import { spawn } from "node:child_process";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export type ToolName = "opencode" | "pi";

const defaultCommands: Record<ToolName, string> = {
  opencode: "opencode",
  pi: "pi",
};

const envNames: Record<ToolName, string> = {
  opencode: "AI_RULES_OPENCODE_CMD",
  pi: "AI_RULES_PI_CMD",
};

const toolPriority: ToolName[] = ["opencode", "pi"];

export function resolveToolCommand(tool: ToolName): string {
  return process.env[envNames[tool]] ?? defaultCommands[tool];
}

export async function commandExists(command: string): Promise<boolean> {
  return (await resolveCommandPath(command)) !== undefined;
}

export async function resolveCommandPath(command: string): Promise<string | undefined> {
  const binary = command.split(/\s+/)[0];
  try {
    const { stdout } = await execFileAsync("which", [binary]);
    const resolved = stdout.trim();
    return resolved.length > 0 ? resolved : undefined;
  } catch {
    return undefined;
  }
}

export async function detectAvailableTools(): Promise<ToolName[]> {
  const available: ToolName[] = [];

  for (const tool of toolPriority) {
    if (await commandExists(resolveToolCommand(tool))) {
      available.push(tool);
    }
  }

  return available;
}

export async function resolveTool(explicit?: string): Promise<ToolName> {
  if (explicit) {
    const tool = explicit as ToolName;
    if (!toolPriority.includes(tool)) {
      throw new Error(`Unknown tool: ${explicit}. Expected one of: ${toolPriority.join(", ")}.`);
    }

    if (!(await commandExists(resolveToolCommand(tool)))) {
      throw new Error(`Tool "${tool}" is not installed or not on PATH.`);
    }

    return tool;
  }

  const fromEnv = process.env.AI_RULES_TOOL as ToolName | undefined;
  if (fromEnv && toolPriority.includes(fromEnv) && (await commandExists(resolveToolCommand(fromEnv)))) {
    return fromEnv;
  }

  const available = await detectAvailableTools();
  if (available.length === 0) {
    throw new Error("No supported coding tool found. Install opencode or pi.");
  }

  return available[0];
}

export async function launchTool(tool: ToolName, prompt: string): Promise<number> {
  const command = resolveToolCommand(tool);
  const child = spawn(command, [prompt], {
    stdio: "inherit",
    shell: false,
  });

  return new Promise((resolve, reject) => {
    child.on("error", reject);
    child.on("exit", (code) => resolve(code ?? 1));
  });
}
