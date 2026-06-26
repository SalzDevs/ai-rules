import os from "node:os";
import path from "node:path";

export const repoRulesDirName = ".ai-rules";

export function defaultPersonalRulesDir(): string {
  const xdgConfig = process.env.XDG_CONFIG_HOME;
  return path.join(xdgConfig && xdgConfig.length > 0 ? xdgConfig : path.join(os.homedir(), ".config"), "ai-rules");
}

export function defaultOpenCodeConfigDir(): string {
  const xdgConfig = process.env.XDG_CONFIG_HOME;
  return path.join(xdgConfig && xdgConfig.length > 0 ? xdgConfig : path.join(os.homedir(), ".config"), "opencode");
}

export function defaultPiAgentDir(): string {
  return path.join(os.homedir(), ".pi", "agent");
}

export function repoRulesDir(cwd: string): string {
  return path.join(cwd, repoRulesDirName);
}

export function rulesSubdir(baseDir: string): string {
  return path.join(baseDir, "rules");
}

export function overridesFile(baseDir: string): string {
  return path.join(baseDir, "overrides.yaml");
}
