import { spawn } from "node:child_process";

export type ToolName = "opencode" | "pi";

const defaultCommands: Record<ToolName, string> = {
  opencode: "opencode",
  pi: "pi",
};

const envNames: Record<ToolName, string> = {
  opencode: "AI_RULES_OPENCODE_CMD",
  pi: "AI_RULES_PI_CMD",
};

export async function launchTool(tool: ToolName, prompt: string): Promise<number> {
  const command = process.env[envNames[tool]] ?? defaultCommands[tool];
  const child = spawn(command, [prompt], {
    stdio: "inherit",
    shell: false,
  });

  return new Promise((resolve, reject) => {
    child.on("error", reject);
    child.on("exit", (code) => resolve(code ?? 1));
  });
}
