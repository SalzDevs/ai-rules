import { agentIntegrations } from "./integrations/registry.js";
import { defaultPersonalRulesDir, repoRulesDir, rulesSubdir } from "./paths.js";
import { pathExists } from "./file-system.js";
import { countActiveRules } from "./rule-files.js";
import { detectAvailableTools } from "./tools.js";

export interface DoctorResult {
  ok: boolean;
  checks: Array<{ name: string; status: "ok" | "warn" | "fail"; detail: string }>;
}

export async function runDoctor(cwd: string): Promise<DoctorResult> {
  const checks: DoctorResult["checks"] = [];

  const personalRules = rulesSubdir(defaultPersonalRulesDir());
  if (await pathExists(personalRules)) {
    checks.push({ name: "personal rules", status: "ok", detail: personalRules });
  } else {
    checks.push({ name: "personal rules", status: "warn", detail: "Missing. Run `ai-rules setup`." });
  }

  const repoRules = rulesSubdir(repoRulesDir(cwd));
  if (await pathExists(repoRules)) {
    checks.push({ name: "repo rules", status: "ok", detail: repoRules });
  } else {
    checks.push({ name: "repo rules", status: "warn", detail: "Missing. Run `ai-rules setup`." });
  }

  const ruleCount = await countActiveRules(cwd);
  checks.push({
    name: "rule count",
    status: ruleCount > 0 ? "ok" : "warn",
    detail:
      ruleCount > 0
        ? `${ruleCount} active rules`
        : "No active rules yet. Add Markdown files to .ai-rules/rules/ or ~/.config/ai-rules/rules/",
  });

  const tools = await detectAvailableTools();
  checks.push({
    name: "coding tools",
    status: tools.length > 0 ? "ok" : "fail",
    detail: tools.length > 0 ? tools.join(", ") : "No supported coding tool found on PATH",
  });

  for (const integration of agentIntegrations) {
    const local = await integration.findInstalled(cwd, false);
    const global = await integration.findInstalled(cwd, true);

    if (local || global) {
      checks.push({
        name: integration.doctorName,
        status: "ok",
        detail: local ?? global ?? "",
      });
      continue;
    }

    if (tools.includes(integration.relatedTool)) {
      checks.push({
        name: integration.doctorName,
        status: "warn",
        detail: `${integration.relatedTool} is installed but /airules is missing. Run \`ai-rules setup\`.`,
      });
    }
  }

  const ok = !checks.some((check) => check.status === "fail");
  return { ok, checks };
}

export function formatDoctorSummary(result: DoctorResult): string {
  const lines = result.checks.map((check) => {
    const label = check.status.toUpperCase();
    return `[${label}] ${check.name}: ${check.detail}`;
  });

  lines.push("", result.ok ? "Ready to use ai-rules." : "Fix the failed checks above.");
  return lines.join("\n");
}
