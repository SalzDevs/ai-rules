import { spawn } from "node:child_process";

export type ToolName = "codex" | "claude" | "opencode" | "pi";

const defaultCommands: Record<ToolName, string> = {
  codex: "codex",
  claude: "claude",
  opencode: "opencode",
  pi: "pi",
};

const envNames: Record<ToolName, string> = {
  codex: "AI_RULES_CODEX_CMD",
  claude: "AI_RULES_CLAUDE_CMD",
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
