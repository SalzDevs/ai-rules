import { ensureDir } from "./preflight.js";
import { defaultPersonalRulesDir, repoRulesDir, rulesSubdir } from "./paths.js";
import { installOpenCodeCommand, type OpenCodeInstallScope } from "./opencode.js";
import { promoteRule } from "./promote.js";
import { closePrompts, readStdinIfAvailable } from "./prompt.js";
import { prepareTask } from "./run.js";
import { selectForTask } from "./selector.js";
import type { RuleLayer } from "./types.js";

interface ParsedArgs {
  command: string;
  positional: string[];
  flags: Map<string, string | boolean>;
}

const booleanFlags = new Set(["repo", "personal", "global", "force", "draft-prompt", "no-resolve-conflicts"]);

export async function runAiRulesCli(argv: string[], cwd = process.cwd()): Promise<number> {
  const parsed = parseArgs(argv);

  try {
    switch (parsed.command) {
      case "compile": {
        const task = await readTask(parsed.positional);
        const prepared = await prepareTask(task, cwd, readBudget(parsed), !parsed.flags.has("no-resolve-conflicts"));
        console.log(prepared.pack.text);
        return 0;
      }
      case "select": {
        const task = await readTask(parsed.positional);
        const selection = await selectForTask({ task, cwd, tokenBudget: readBudget(parsed) });
        console.log(JSON.stringify(selection, null, 2));
        return 0;
      }
      case "promote": {
        const filePath = await promoteRule({
          cwd,
          comment: parsed.positional.join(" "),
          layer: readLayer(parsed),
          printDraftPrompt: Boolean(parsed.flags.get("draft-prompt")),
        });
        console.log(filePath);
        return 0;
      }
      case "init": {
        await ensureDir(rulesSubdir(defaultPersonalRulesDir()));
        await ensureDir(rulesSubdir(repoRulesDir(cwd)));
        console.log(`Initialized ${rulesSubdir(repoRulesDir(cwd))}`);
        return 0;
      }
      case "install": {
        if (parsed.positional[0] !== "opencode") {
          throw new Error("Only `ai-rules install opencode` is supported.");
        }

        const commandPath = await installOpenCodeCommand({
          cwd,
          scope: readOpenCodeInstallScope(parsed),
          commandName: readStringFlag(parsed, "name", "airules"),
          budget: readBudget(parsed),
          force: Boolean(parsed.flags.get("force")),
        });
        console.log(`Installed OpenCode command: ${commandPath}`);
        return 0;
      }
      case "help":
      case "--help":
      case "-h":
      case "":
        printHelp();
        return 0;
      default:
        throw new Error(`Unknown command: ${parsed.command}`);
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  } finally {
    closePrompts();
  }
}

function parseArgs(argv: string[]): ParsedArgs {
  const [command = "", ...rest] = argv;
  const positional: string[] = [];
  const flags = new Map<string, string | boolean>();

  for (let index = 0; index < rest.length; index += 1) {
    const arg = rest[index];
    if (!arg.startsWith("--")) {
      positional.push(arg);
      continue;
    }

    const [name, inlineValue] = arg.slice(2).split("=", 2);
    if (inlineValue !== undefined) {
      flags.set(name, inlineValue);
      continue;
    }

    if (booleanFlags.has(name)) {
      flags.set(name, true);
      continue;
    }

    const next = rest[index + 1];
    if (next && !next.startsWith("--")) {
      flags.set(name, next);
      index += 1;
    } else {
      flags.set(name, true);
    }
  }

  return { command, positional, flags };
}

async function readTask(positional: string[]): Promise<string> {
  const fromArgs = positional.join(" ").trim();
  if (fromArgs) {
    return fromArgs;
  }

  const stdin = await readStdinIfAvailable();
  if (stdin) {
    return stdin;
  }

  throw new Error("A task is required.");
}

function readBudget(parsed: ParsedArgs): number {
  const raw = parsed.flags.get("budget");
  if (typeof raw !== "string") {
    return 800;
  }

  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) && value > 0 ? value : 800;
}

function readLayer(parsed: ParsedArgs): RuleLayer | undefined {
  if (parsed.flags.has("repo")) {
    return "repo";
  }
  if (parsed.flags.has("personal")) {
    return "personal";
  }
  return undefined;
}

function printHelp(): void {
  console.log(`ai-rules

Commands:
  ai-rules compile [--budget 800] "task"   Print a compact rule contract
  ai-rules select [--budget 800] "task"    Print selected rules as JSON
  ai-rules promote [--repo|--personal]     Promote a review comment into a rule
  ai-rules promote --draft-prompt "comment" Print an AI drafting prompt
  ai-rules init                            Create personal and repo rule folders
  ai-rules install opencode [--repo|--global] [--name airules] [--force]
                                             Install native OpenCode /airules command

Wrappers:
  smart-codex "task"
  smart-claude "task"
  smart-opencode "task"
  smart-pi "task"
`);
}

function readOpenCodeInstallScope(parsed: ParsedArgs): OpenCodeInstallScope {
  return parsed.flags.has("global") ? "global" : "repo";
}

function readStringFlag(parsed: ParsedArgs, name: string, fallback: string): string {
  const value = parsed.flags.get(name);
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}
