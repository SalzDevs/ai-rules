import path from "node:path";
import { resolveAiRulesCommand } from "./bin-path.js";
import { pathExists } from "./file-system.js";
import { installOpenCodeCommand, type OpenCodeInstallScope } from "./opencode.js";
import { installPiExtension, type PiInstallScope } from "./pi.js";
import { defaultOpenCodeConfigDir, defaultPersonalRulesDir, repoRulesDir, rulesSubdir } from "./paths.js";
import { ensureDir } from "./preflight.js";
import { countRepoRules, installStarterRules } from "./starter-rules.js";
import { detectAvailableTools } from "./tools.js";

export type IntegrationInstallScope = OpenCodeInstallScope | PiInstallScope;

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
  const scope: IntegrationInstallScope = options.global ? "global" : "repo";
  const aiRulesCommand = await resolveAiRulesCommand();

  if (shouldInstallIntegration(options.tool, "opencode")) {
    const commandPath = await installOpenCodeCommand({
      cwd: options.cwd,
      scope,
      commandName: "airules",
      budget: 800,
      force: options.force,
      aiRulesCommand,
    });
    integrations.push(`OpenCode /airules command -> ${commandPath}`);
  }

  if (shouldInstallIntegration(options.tool, "pi")) {
    const extensionPath = await installPiExtension({
      cwd: options.cwd,
      scope,
      budget: 800,
      force: options.force,
      aiRulesCommand,
    });
    integrations.push(`Pi /airules extension -> ${extensionPath}`);
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
    "3. In Pi: /airules your coding task",
    '4. ai-rules promote --yes "review comment to keep"',
  );

  return lines.join("\n");
}

export async function openCodeCommandInstalled(cwd: string, global: boolean): Promise<string | undefined> {
  const commandPath = global
    ? path.join(defaultOpenCodeConfigDir(), "commands", "airules.md")
    : path.join(cwd, ".opencode", "commands", "airules.md");

  return (await pathExists(commandPath)) ? commandPath : undefined;
}

function shouldInstallIntegration(explicitTool: string | undefined, integration: "opencode" | "pi"): boolean {
  if (!explicitTool) {
    return true;
  }

  return explicitTool === integration;
}
