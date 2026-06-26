export const DEFAULT_TOKEN_BUDGET = 800;

export function parseTokenBudget(raw: string | undefined, fallback = DEFAULT_TOKEN_BUDGET): number {
  if (!raw) {
    return fallback;
  }

  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export function buildCompileSubcommand(options: { budget?: number; resolveConflicts: boolean }): string {
  const budget = options.budget ?? DEFAULT_TOKEN_BUDGET;
  const parts = ["debug", "compile", "--budget", String(budget)];

  if (!options.resolveConflicts) {
    parts.push("--no-resolve-conflicts");
  }

  return parts.join(" ");
}

export function buildIntegrationCompileInvocation(aiRulesCommand: string, budget?: number): string {
  return `${aiRulesCommand} ${buildCompileSubcommand({ budget, resolveConflicts: false })}`;
}

export function buildIntegrationCompileShell(aiRulesCommand: string, budget?: number): string {
  return `${buildIntegrationCompileInvocation(aiRulesCommand, budget)} "$@"`;
}
