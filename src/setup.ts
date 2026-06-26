import path from "node:path";
import { resolveAiRulesCommand } from "./bin-path.js";
import { pathExists } from "./file-system.js";
import { installOpenCodeCommand, type OpenCodeInstallScope } from "./opencode.js";
import { defaultPersonalRulesDir, defaultOpenCodeConfigDir, repoRulesDir, rulesSubdir } from "./paths.js";
import { ensureDir } from "./preflight.js";
import { countRepoRules, installStarterRules } from "./starter-rules.js";
import { detectAvailableTools } from "./tools.js";

export interface SetupOptions {
  cwd: string;
  global: boolean;
  withExamples: boolean;
  force: boolean;
  tool?: string;
}

export interface SetupResult {
  personalRulesDir: string;
  repoRulesDir: string;
  availableTools: string[];
  starterRules: string[];
  integrations: string[];
}

export async function runSetup(options: SetupOptions): Promise<SetupResult> {
  const personalRulesDir = rulesSubdir(defaultPersonalRulesDir());
  const repoRules = rulesSubdir(repoRulesDir(options.cwd));

  await ensureDir(personalRulesDir);
  await ensureDir(repoRules);

  const availableTools = await detectAvailableTools();
  const integrations: string[] = [];
  const shouldInstallExamples = options.withExamples || (await countRepoRules(options.cwd)) === 0;
  const starterRules = shouldInstallExamples ? await installStarterRules(options.cwd, options.force) : [];

  const installOpenCode = options.tool ? options.tool === "opencode" : true;
  if (installOpenCode) {
    const scope: OpenCodeInstallScope = options.global ? "global" : "repo";
    const commandPath = await installOpenCodeCommand({
      cwd: options.cwd,
      scope,
      commandName: "airules",
      budget: 800,
      force: options.force,
      aiRulesCommand: await resolveAiRulesCommand(),
    });
    integrations.push(`OpenCode /airules command -> ${commandPath}`);
  }

  return {
    personalRulesDir,
    repoRulesDir: repoRules,
    availableTools,
    starterRules,
    integrations,
  };
}

export function formatSetupSummary(result: SetupResult): string {
  const lines = [
    "ai-rules is ready.",
    "",
    "Rule folders:",
    `- personal: ${result.personalRulesDir}`,
    `- repo: ${result.repoRulesDir}`,
    "",
    `Detected tools: ${result.availableTools.length > 0 ? result.availableTools.join(", ") : "none"}`,
  ];

  if (result.starterRules.length > 0) {
    lines.push("", "Starter rules:", ...result.starterRules.map((file) => `- ${file}`));
  }

  if (result.integrations.length > 0) {
    lines.push("", "Integrations:", ...result.integrations.map((item) => `- ${item}`));
  }

  lines.push(
    "",
    "Next steps:",
    '1. ai-rules run "your coding task"',
    "2. In OpenCode: /airules your coding task",
    '3. ai-rules promote --yes "review comment to keep"',
  );

  return lines.join("\n");
}

export async function openCodeCommandInstalled(cwd: string, global: boolean): Promise<string | undefined> {
  const commandPath = global
    ? path.join(defaultOpenCodeConfigDir(), "commands", "airules.md")
    : path.join(cwd, ".opencode", "commands", "airules.md");

  return (await pathExists(commandPath)) ? commandPath : undefined;
}
