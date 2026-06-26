import path from "node:path";
import { buildIntegrationCompileShell } from "../compile-contract.js";
import { pathExists } from "../file-system.js";
import { defaultPiAgentDir } from "../paths.js";
import { installIntegrationFile } from "./install.js";
import type { AgentIntegration, IntegrationInstallContext } from "./types.js";

export function renderPiExtension(options: { aiRulesCommand: string; budget: number }): string {
  const compileShell = buildIntegrationCompileShell(options.aiRulesCommand, options.budget);

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

function extensionDir(cwd: string, scope: IntegrationInstallContext["scope"]): string {
  return scope === "repo" ? path.join(cwd, ".pi", "extensions") : path.join(defaultPiAgentDir(), "extensions");
}

function installedExtensionPath(cwd: string, global: boolean): string {
  return global ? path.join(defaultPiAgentDir(), "extensions", "ai-rules.ts") : path.join(cwd, ".pi", "extensions", "ai-rules.ts");
}

export const piIntegration: AgentIntegration = {
  id: "pi",
  setupLabel: "Pi /airules extension",
  doctorName: "Pi integration",
  relatedTool: "pi",

  async install(context) {
    return installIntegrationFile({
      targetDir: extensionDir(context.cwd, context.scope),
      filename: "ai-rules.ts",
      content: renderPiExtension({
        aiRulesCommand: context.aiRulesCommand,
        budget: context.budget,
      }),
      force: context.force,
    });
  },

  async findInstalled(cwd, global) {
    const extensionPath = installedExtensionPath(cwd, global);
    return (await pathExists(extensionPath)) ? extensionPath : undefined;
  },
};
