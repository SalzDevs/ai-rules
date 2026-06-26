import type { ToolName } from "../tools.js";

export type IntegrationInstallScope = "repo" | "global";
export type IntegrationId = "opencode" | "pi";

export interface IntegrationInstallContext {
  cwd: string;
  scope: IntegrationInstallScope;
  budget: number;
  force: boolean;
  aiRulesCommand: string;
  commandName?: string;
}

export interface AgentIntegration {
  id: IntegrationId;
  setupLabel: string;
  doctorName: string;
  relatedTool: ToolName;
  install(context: IntegrationInstallContext): Promise<string>;
  findInstalled(cwd: string, global: boolean): Promise<string | undefined>;
}
