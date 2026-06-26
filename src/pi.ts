import fs from "node:fs/promises";
import path from "node:path";
import { resolveAiRulesCommand } from "./bin-path.js";
import { pathExists } from "./file-system.js";
import { defaultPiAgentDir } from "./paths.js";
import { ensureDir } from "./preflight.js";

export type PiInstallScope = "repo" | "global";

export interface InstallPiOptions {
  cwd: string;
  scope: PiInstallScope;
  budget: number;
  force: boolean;
  aiRulesCommand?: string;
}

export async function installPiExtension(options: InstallPiOptions): Promise<string> {
  const extensionDir =
    options.scope === "repo" ? path.join(options.cwd, ".pi", "extensions") : path.join(defaultPiAgentDir(), "extensions");
  await ensureDir(extensionDir);

  const extensionPath = path.join(extensionDir, "ai-rules.ts");
  if (!options.force && (await pathExists(extensionPath))) {
    throw new Error(`${extensionPath} already exists. Re-run with --force to overwrite it.`);
  }

  await fs.writeFile(
    extensionPath,
    renderPiExtension({
      aiRulesCommand: options.aiRulesCommand ?? (await resolveAiRulesCommand()),
      budget: options.budget,
    }),
    "utf8",
  );

  return extensionPath;
}

export function renderPiExtension(options: { aiRulesCommand: string; budget: number }): string {
  const compileShell = `${options.aiRulesCommand} debug compile --budget ${options.budget} --no-resolve-conflicts "$@"`;

  return `import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const COMPILE_SHELL = ${JSON.stringify(compileShell)};

export default function (pi: ExtensionAPI) {
  pi.registerCommand("airules", {
    description: "Run a task with ai-rules selected coding instructions",
    handler: async (args, ctx) => {
      const task = args.trim();
      if (!task) {
        ctx.ui.notify("Usage: /airules your coding task", "warning");
        return;
      }

      try {
        const result = await pi.exec("sh", ["-c", COMPILE_SHELL, "_", task], {
          cwd: process.cwd(),
        });

        if (result.code !== 0) {
          const message = result.stderr?.trim() || result.stdout?.trim() || "ai-rules compile failed";
          ctx.ui.notify(message, "error");
          return;
        }

        const prompt = \`\${result.stdout.trim()}\\n\\n## User Task\\n\${task}\`;
        await ctx.sendUserMessage(prompt);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        ctx.ui.notify(message, "error");
      }
    },
  });
}
`;
}

export async function piExtensionInstalled(cwd: string, global: boolean): Promise<string | undefined> {
  const extensionPath = global
    ? path.join(defaultPiAgentDir(), "extensions", "ai-rules.ts")
    : path.join(cwd, ".pi", "extensions", "ai-rules.ts");

  return (await pathExists(extensionPath)) ? extensionPath : undefined;
}
