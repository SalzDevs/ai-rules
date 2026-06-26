import { resolveAiRulesCommand } from "./bin-path.js";
import { piIntegration, renderPiExtension } from "./integrations/pi.js";
import type { IntegrationInstallScope } from "./integrations/types.js";

export type PiInstallScope = IntegrationInstallScope;

export interface InstallPiOptions {
  cwd: string;
  scope: PiInstallScope;
  budget: number;
  force: boolean;
  aiRulesCommand?: string;
}

export { renderPiExtension };

export async function installPiExtension(options: InstallPiOptions): Promise<string> {
  return piIntegration.install({
    cwd: options.cwd,
    scope: options.scope,
    budget: options.budget,
    force: options.force,
    aiRulesCommand: options.aiRulesCommand ?? (await resolveAiRulesCommand()),
  });
}

export async function piExtensionInstalled(cwd: string, global: boolean): Promise<string | undefined> {
  return piIntegration.findInstalled(cwd, global);
}
