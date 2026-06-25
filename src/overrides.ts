import fs from "node:fs/promises";
import YAML from "yaml";
import { defaultPersonalRulesDir, overridesFile } from "./paths.js";
import { ensureDir } from "./preflight.js";
import { loadOverrides } from "./rule-files.js";
import type { ConflictOverride, RuleConflict } from "./types.js";

export async function savePersonalOverride(cwd: string, conflict: RuleConflict, preferRuleId: string): Promise<ConflictOverride> {
  return saveOverride(cwd, {
    id: `override.${Date.now()}`,
    ruleIds: conflict.ruleIds,
    decision: "prefer-rule",
    preferRuleId,
    reason: `Resolved selected-rule conflict: ${conflict.reason}`,
    createdAt: new Date().toISOString(),
  });
}

export async function savePersonalOmitOverride(cwd: string, conflict: RuleConflict): Promise<ConflictOverride> {
  return saveOverride(cwd, {
    id: `override.${Date.now()}`,
    ruleIds: conflict.ruleIds,
    decision: "omit-rules",
    reason: `Omitted conflicting selected rules: ${conflict.reason}`,
    createdAt: new Date().toISOString(),
  });
}

async function saveOverride(cwd: string, override: ConflictOverride): Promise<ConflictOverride> {
  const baseDir = defaultPersonalRulesDir();
  await ensureDir(baseDir);

  const existing = await loadOverrides(cwd);
  const personalFile = overridesFile(baseDir);
  const personalExisting = existing.filter((item) => item.id.startsWith("override."));

  await fs.writeFile(personalFile, YAML.stringify([...personalExisting, override]), "utf8");
  return override;
}
