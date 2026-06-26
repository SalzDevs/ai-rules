import { opencodeIntegration } from "./opencode.js";
import { piIntegration } from "./pi.js";
import type { AgentIntegration, IntegrationId } from "./types.js";

export type { AgentIntegration, IntegrationId, IntegrationInstallContext, IntegrationInstallScope } from "./types.js";

export const agentIntegrations: AgentIntegration[] = [opencodeIntegration, piIntegration];

export function selectIntegrations(toolFilter?: string): AgentIntegration[] {
  if (!toolFilter) {
    return agentIntegrations;
  }

  return agentIntegrations.filter((integration) => integration.id === toolFilter);
}

export function getIntegration(id: string): AgentIntegration | undefined {
  return agentIntegrations.find((integration) => integration.id === id);
}
