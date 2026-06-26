import path from "node:path";
import { commandExists, resolveCommandPath } from "./tools.js";

export async function resolveAiRulesCommand(): Promise<string> {
  if (process.env.AI_RULES_BIN) {
    return process.env.AI_RULES_BIN;
  }

  const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
  if (invokedPath && isLocalDevInstall(invokedPath)) {
    return `${shellQuote(process.execPath)} ${shellQuote(invokedPath)}`;
  }

  if (await commandExists("ai-rules")) {
    const commandPath = await resolveCommandPath("ai-rules");
    if (commandPath && isStableGlobalInstall(commandPath)) {
      return "ai-rules";
    }
  }

  return "npx --yes ai-rules";
}

export function isLocalDevInstall(invokedPath: string): boolean {
  const normalized = path.resolve(invokedPath);
  if (normalized.includes(`${path.sep}node_modules${path.sep}`)) {
    return false;
  }

  return normalized.includes(`${path.sep}ai-rules${path.sep}dist${path.sep}bin${path.sep}`);
}

export function isStableGlobalInstall(commandPath: string): boolean {
  const normalized = path.resolve(commandPath);
  return !normalized.includes("_npx") && !normalized.includes(`${path.sep}.npm${path.sep}_npx${path.sep}`);
}

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, "'\\''")}'`;
}
