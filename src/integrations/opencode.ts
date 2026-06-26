import path from "node:path";
import { buildIntegrationCompileInvocation } from "../compile-contract.js";
import { pathExists } from "../file-system.js";
import { defaultOpenCodeConfigDir } from "../paths.js";
import { installIntegrationFile } from "./install.js";
import type { AgentIntegration, IntegrationInstallContext } from "./types.js";

export function renderOpenCodeCommand(options: { aiRulesCommand: string; budget: number }): string {
  const compileInvocation = buildIntegrationCompileInvocation(options.aiRulesCommand, options.budget);

  return [
    "---",
    "description: Run a task with ai-rules selected coding instructions",
    "---",
    "",
    "!`cat <<'AI_RULES_TASK' | " + compileInvocation,
    "$ARGUMENTS",
    "AI_RULES_TASK`",
    "",
    "## User Task",
    "$ARGUMENTS",
    "",
  ].join("\n");
}

function commandDir(cwd: string, scope: IntegrationInstallContext["scope"]): string {
  return scope === "repo" ? path.join(cwd, ".opencode", "commands") : path.join(defaultOpenCodeConfigDir(), "commands");
}

function installedCommandPath(cwd: string, global: boolean): string {
  return global
    ? path.join(defaultOpenCodeConfigDir(), "commands", "airules.md")
    : path.join(cwd, ".opencode", "commands", "airules.md");
}

function sanitizeCommandName(commandName: string): string {
  const sanitized = commandName.trim().replace(/^\//, "").replace(/[^a-zA-Z0-9._-]/g, "-");
  if (!sanitized) {
    throw new Error("OpenCode command name cannot be empty.");
  }

  return sanitized;
}

export const opencodeIntegration: AgentIntegration = {
  id: "opencode",
  setupLabel: "OpenCode /airules command",
  doctorName: "OpenCode integration",
  relatedTool: "opencode",

  async install(context) {
    const filename = `${sanitizeCommandName(context.commandName ?? "airules")}.md`;
    return installIntegrationFile({
      targetDir: commandDir(context.cwd, context.scope),
      filename,
      content: renderOpenCodeCommand({
        aiRulesCommand: context.aiRulesCommand,
        budget: context.budget,
      }),
      force: context.force,
    });
  },

  async findInstalled(cwd, global) {
    const commandPath = installedCommandPath(cwd, global);
    return (await pathExists(commandPath)) ? commandPath : undefined;
  },
};
