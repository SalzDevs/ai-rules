import { resolveAiRulesCommand } from "./bin-path.js";
import { opencodeIntegration, renderOpenCodeCommand } from "./integrations/opencode.js";
import type { IntegrationInstallScope } from "./integrations/types.js";

export type OpenCodeInstallScope = IntegrationInstallScope;

export interface InstallOpenCodeOptions {
  cwd: string;
  scope: OpenCodeInstallScope;
  commandName: string;
  budget: number;
  force: boolean;
  aiRulesCommand?: string;
}

export { renderOpenCodeCommand };

export async function installOpenCodeCommand(options: InstallOpenCodeOptions): Promise<string> {
  return opencodeIntegration.install({
    cwd: options.cwd,
    scope: options.scope,
    budget: options.budget,
    force: options.force,
    aiRulesCommand: options.aiRulesCommand ?? (await resolveAiRulesCommand()),
    commandName: options.commandName,
  });
}

export async function openCodeCommandInstalled(cwd: string, global: boolean): Promise<string | undefined> {
  return opencodeIntegration.findInstalled(cwd, global);
}
