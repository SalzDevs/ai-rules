import path from "node:path";
import { buildIntegrationCompileShell } from "../compile-contract.js";
import { pathExists } from "../file-system.js";
import { defaultPiAgentDir } from "../paths.js";
import { renderCreateRulePrompt } from "./create-rule-prompt.js";
import { installIntegrationFile } from "./install.js";
import type { AgentIntegration, IntegrationInstallContext } from "./types.js";

export function renderPiExtension(options: { aiRulesCommand: string; budget: number }): string {
  const compileShell = buildIntegrationCompileShell(options.aiRulesCommand, options.budget);
  const createRulePrompt = renderCreateRulePrompt();

  return `import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "@sinclair/typebox";

const COMPILE_SHELL = ${JSON.stringify(compileShell)};
const CREATE_RULE_PROMPT = ${JSON.stringify(createRulePrompt)};

export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: "question",
    label: "Question",
    description:
      "Ask the user a question with selectable options. Use for every /create-rule MCQ step (one question per call).",
    parameters: Type.Object({
      questions: Type.Array(
        Type.Object({
          header: Type.String({ description: "Very short label (max 30 chars)" }),
          question: Type.String({ description: "Complete question text" }),
          options: Type.Array(
            Type.Object({
              label: Type.String({ description: "Display text (concise)" }),
              description: Type.Optional(Type.String({ description: "Optional explanation" })),
            }),
          ),
          multiple: Type.Optional(Type.Boolean({ description: "Allow multiple selections" })),
        }),
        { minItems: 1, maxItems: 1, description: "Ask exactly one question per call" },
      ),
    }),
    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      if (!ctx.hasUI) {
        return {
          content: [{ type: "text", text: "Error: question tool requires interactive UI" }],
          details: { answers: [] },
        };
      }

      const q = params.questions[0];
      const labels = q.options.map((o) => o.label);
      if (!labels.some((l) => /other/i.test(l))) {
        labels.push("Other (type your own)");
      }

      const prompt = q.header ? \`\${q.header}: \${q.question}\` : q.question;

      if (q.multiple) {
        const picked: string[] = [];
        let done = false;
        while (!done) {
          const remaining = labels.filter((l) => !picked.includes(l));
          const choice = await ctx.ui.select(
            picked.length ? \`\${prompt}\\nSelected: \${picked.join(", ")}\` : prompt,
            [...remaining, "Done selecting"],
          );
          if (!choice || choice === "Done selecting") {
            done = true;
          } else if (/other/i.test(choice)) {
            const custom = await ctx.ui.input("Your answer (comma-separated for multiple):", "");
            if (custom?.trim()) {
              picked.push(...custom.split(",").map((s) => s.trim()).filter(Boolean));
            }
            done = true;
          } else {
            picked.push(choice);
          }
        }
        const answer = picked.length ? picked : ["Unanswered"];
        return {
          content: [{ type: "text", text: \`User selected: \${answer.join(", ")}\` }],
          details: { answers: [answer] },
        };
      }

      const choice = await ctx.ui.select(prompt, labels);
      if (!choice) {
        return {
          content: [{ type: "text", text: "User cancelled the question" }],
          details: { answers: [[]] },
        };
      }

      if (/other/i.test(choice)) {
        const custom = await ctx.ui.input("Your answer:", "");
        const answer = custom?.trim() ? [custom.trim()] : ["Unanswered"];
        return {
          content: [{ type: "text", text: \`User wrote: \${answer[0]}\` }],
          details: { answers: [answer] },
        };
      }

      return {
        content: [{ type: "text", text: \`User selected: \${choice}\` }],
        details: { answers: [[choice]] },
      };
    },
  });

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

  pi.registerCommand("create-rule", {
    description: "Interview and create a personal ai-rules rule",
    handler: async (args, ctx) => {
      const seed = args.trim();
      const prompt = seed ? \`\${CREATE_RULE_PROMPT}\\n\\n## Seed from user\\n\${seed}\` : CREATE_RULE_PROMPT;
      await ctx.sendUserMessage(prompt);
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
  setupLabel: "Pi /airules and /create-rule extension",
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
