import fs from "node:fs/promises";
import path from "node:path";
import { resolveAiRulesCommand } from "./bin-path.js";
import { pathExists } from "./file-system.js";
import { defaultOpenCodeConfigDir } from "./paths.js";
import { ensureDir } from "./preflight.js";

export type OpenCodeInstallScope = "repo" | "global";

export interface InstallOpenCodeOptions {
  cwd: string;
  scope: OpenCodeInstallScope;
  commandName: string;
  budget: number;
  force: boolean;
  aiRulesCommand?: string;
}

export async function installOpenCodeCommand(options: InstallOpenCodeOptions): Promise<string> {
  const commandDir =
    options.scope === "repo"
      ? path.join(options.cwd, ".opencode", "commands")
      : path.join(defaultOpenCodeConfigDir(), "commands");
  await ensureDir(commandDir);

  const commandPath = path.join(commandDir, `${sanitizeCommandName(options.commandName)}.md`);
  if (!options.force && (await pathExists(commandPath))) {
    throw new Error(`${commandPath} already exists. Re-run with --force to overwrite it.`);
  }

  await fs.writeFile(
    commandPath,
    renderOpenCodeCommand({
      aiRulesCommand: options.aiRulesCommand ?? (await resolveAiRulesCommand()),
      budget: options.budget,
    }),
    "utf8",
  );

  return commandPath;
}

export function renderOpenCodeCommand(options: { aiRulesCommand: string; budget: number }): string {
  return [
    "---",
    "description: Run a task with ai-rules selected coding instructions",
    "---",
    "",
    "!`cat <<'AI_RULES_TASK' | " + options.aiRulesCommand + ` debug compile --budget ${options.budget} --no-resolve-conflicts`,
    "$ARGUMENTS",
    "AI_RULES_TASK`",
    "",
    "## User Task",
    "$ARGUMENTS",
    "",
  ].join("\n");
}

function sanitizeCommandName(commandName: string): string {
  const sanitized = commandName.trim().replace(/^\//, "").replace(/[^a-zA-Z0-9._-]/g, "-");
  if (!sanitized) {
    throw new Error("OpenCode command name cannot be empty.");
  }

  return sanitized;
}

