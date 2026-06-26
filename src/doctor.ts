import { pathExists } from "./file-system.js";
import { defaultPersonalRulesDir, repoRulesDir, rulesSubdir } from "./paths.js";
import { piExtensionInstalled } from "./pi.js";
import { openCodeCommandInstalled } from "./setup.js";
import { countRepoRules } from "./starter-rules.js";
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

  const ruleCount = await countRepoRules(cwd);
  checks.push({
    name: "repo rule count",
    status: ruleCount > 0 ? "ok" : "warn",
    detail: ruleCount > 0 ? `${ruleCount} active repo rules` : 'No repo rules yet. Run ai-rules promote --yes "..."',
  });

  const tools = await detectAvailableTools();
  checks.push({
    name: "coding tools",
    status: tools.length > 0 ? "ok" : "fail",
    detail: tools.length > 0 ? tools.join(", ") : "No supported coding tool found on PATH",
  });

  const localOpenCode = await openCodeCommandInstalled(cwd, false);
  const globalOpenCode = await openCodeCommandInstalled(cwd, true);
  if (localOpenCode || globalOpenCode) {
    checks.push({
      name: "OpenCode integration",
      status: "ok",
      detail: localOpenCode ?? globalOpenCode ?? "",
    });
  } else if (tools.includes("opencode")) {
    checks.push({
      name: "OpenCode integration",
      status: "warn",
      detail: "OpenCode is installed but /airules is missing. Run `ai-rules setup`.",
    });
  }

  const localPi = await piExtensionInstalled(cwd, false);
  const globalPi = await piExtensionInstalled(cwd, true);
  if (localPi || globalPi) {
    checks.push({
      name: "Pi integration",
      status: "ok",
      detail: localPi ?? globalPi ?? "",
    });
  } else if (tools.includes("pi")) {
    checks.push({
      name: "Pi integration",
      status: "warn",
      detail: "Pi is installed but /airules extension is missing. Run `ai-rules setup`.",
    });
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
