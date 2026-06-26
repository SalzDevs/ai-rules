import { DEFAULT_TOKEN_BUDGET } from "./compile-contract.js";
import { resolveAiRulesCommand } from "./bin-path.js";
import { selectIntegrations } from "./integrations/registry.js";
import type { IntegrationInstallScope } from "./integrations/types.js";
import { defaultPersonalRulesDir, rulesSubdir } from "./paths.js";
import { ensureDir } from "./preflight.js";
import { detectAvailableTools } from "./tools.js";

export type { IntegrationInstallScope } from "./integrations/types.js";

export interface SetupOptions {
  cwd: string;
  global: boolean;
  force: boolean;
  tool?: string;
}

export interface SetupResult {
  personalRulesDir: string;
  availableTools: string[];
  integrations: string[];
}

export async function runSetup(options: SetupOptions): Promise<SetupResult> {
  const personalRulesDir = rulesSubdir(defaultPersonalRulesDir());

  await ensureDir(personalRulesDir);

  const availableTools = await detectAvailableTools();
  const integrations: string[] = [];
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
    availableTools,
    integrations,
  };
}

export function formatSetupSummary(result: SetupResult): string {
  const lines = [
    "ai-rules is ready.",
    "",
    "Rule folder:",
    `- personal: ${result.personalRulesDir}`,
    "",
    `Detected tools: ${result.availableTools.length > 0 ? result.availableTools.join(", ") : "none"}`,
  ];

  if (result.integrations.length > 0) {
    lines.push("", "Integrations:", ...result.integrations.map((item) => `- ${item}`));
  }

  lines.push(
    "",
    "Next steps:",
    "1. In Pi or OpenCode: /create-rule (optionally add a short seed, e.g. /create-rule no fetch in React components)",
    '2. ai-rules run "your coding task"',
    "3. In OpenCode: /airules your coding task",
    "4. In Pi: /airules your coding task",
  );

  return lines.join("\n");
}
