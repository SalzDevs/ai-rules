import { DEFAULT_TOKEN_BUDGET } from "./compile-contract.js";
import { resolveAiRulesCommand } from "./bin-path.js";
import { selectIntegrations } from "./integrations/registry.js";
import type { IntegrationInstallScope } from "./integrations/types.js";
import { defaultPersonalRulesDir, repoRulesDir, rulesSubdir } from "./paths.js";
import { ensureDir } from "./preflight.js";
import { countRepoRules, installStarterRules } from "./starter-rules.js";
import { detectAvailableTools } from "./tools.js";

export type { IntegrationInstallScope } from "./integrations/types.js";

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

  for (const integration of selectIntegrations(options.tool)) {
    const artifactPath = await integration.install({
      cwd: options.cwd,
      scope,
      budget: DEFAULT_TOKEN_BUDGET,
      force: options.force,
      aiRulesCommand,
      commandName: "airules",
    });
    integrations.push(`${integration.setupLabel} -> ${artifactPath}`);
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
  );

  return lines.join("\n");
}
