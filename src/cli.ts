import { formatDoctorSummary, runDoctor } from "./doctor.js";
import { installOpenCodeCommand, type OpenCodeInstallScope } from "./opencode.js";
import { ensureDir } from "./preflight.js";
import { defaultPersonalRulesDir, repoRulesDir, rulesSubdir } from "./paths.js";
import { promoteRule } from "./promote.js";
import { closePrompts, readStdinIfAvailable } from "./prompt.js";
import { prepareTask } from "./run.js";
import { runTask } from "./run-task.js";
import { formatSetupSummary, runSetup } from "./setup.js";
import { selectForTask } from "./selector.js";
import type { RuleLayer } from "./types.js";

interface ParsedArgs {
  command: string;
  positional: string[];
  flags: Map<string, string | boolean>;
}

const booleanFlags = new Set([
  "repo",
  "personal",
  "global",
  "force",
  "draft-prompt",
  "no-resolve-conflicts",
  "with-examples",
  "yes",
  "dry-run",
]);

const knownCommands = new Set([
  "setup",
  "run",
  "promote",
  "doctor",
  "debug",
  "help",
  "--help",
  "-h",
  "",
]);

export async function runAiRulesCli(argv: string[], cwd = process.cwd()): Promise<number> {
  let parsed = parseArgs(argv);
  parsed = normalizeCommand(parsed);

  try {
    switch (parsed.command) {
      case "setup":
        return handleSetup(parsed, cwd);
      case "run":
        return handleRun(parsed, cwd);
      case "promote":
        return handlePromote(parsed, cwd);
      case "doctor":
        return handleDoctor(cwd);
      case "debug":
        return handleDebug(parsed, cwd);
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

function normalizeCommand(parsed: ParsedArgs): ParsedArgs {
  if (parsed.command && !knownCommands.has(parsed.command)) {
    return {
      command: "run",
      positional: [parsed.command, ...parsed.positional],
      flags: parsed.flags,
    };
  }

  return parsed;
}

async function handleSetup(parsed: ParsedArgs, cwd: string): Promise<number> {
  const result = await runSetup({
    cwd,
    global: Boolean(parsed.flags.get("global")),
    withExamples: Boolean(parsed.flags.get("with-examples")),
    force: Boolean(parsed.flags.get("force")),
    tool: readOptionalString(parsed, "tool"),
  });
  console.log(formatSetupSummary(result));
  return 0;
}

async function handleRun(parsed: ParsedArgs, cwd: string): Promise<number> {
  const task = await readTask(parsed.positional);
  return runTask({
    task,
    cwd,
    tool: readOptionalString(parsed, "tool"),
    dryRun: Boolean(parsed.flags.get("dry-run")),
    budget: readBudget(parsed),
  });
}

async function handlePromote(parsed: ParsedArgs, cwd: string): Promise<number> {
  const filePath = await promoteRule({
    cwd,
    comment: parsed.positional.join(" "),
    layer: readLayer(parsed),
    printDraftPrompt: Boolean(parsed.flags.get("draft-prompt")),
    yes: Boolean(parsed.flags.get("yes")),
  });

  if (Boolean(parsed.flags.get("draft-prompt"))) {
    console.log(filePath);
  } else {
    console.log(`Saved rule: ${filePath}`);
  }

  return 0;
}

async function handleDoctor(cwd: string): Promise<number> {
  const result = await runDoctor(cwd);
  console.log(formatDoctorSummary(result));
  return result.ok ? 0 : 1;
}

async function handleDebug(parsed: ParsedArgs, cwd: string): Promise<number> {
  const [subcommand = "", ...rest] = parsed.positional;

  switch (subcommand) {
    case "compile": {
      const task = await readTask(rest);
      const prepared = await prepareTask(task, cwd, readBudget(parsed), !parsed.flags.has("no-resolve-conflicts"));
      console.log(prepared.pack.text);
      return 0;
    }
    case "select": {
      const task = await readTask(rest);
      const selection = await selectForTask({ task, cwd, tokenBudget: readBudget(parsed) });
      console.log(JSON.stringify(selection, null, 2));
      return 0;
    }
    case "init": {
      await ensureDir(rulesSubdir(defaultPersonalRulesDir()));
      await ensureDir(rulesSubdir(repoRulesDir(cwd)));
      console.log(`Initialized ${rulesSubdir(repoRulesDir(cwd))}`);
      return 0;
    }
    case "install": {
      if (rest[0] !== "opencode") {
        throw new Error("Only `ai-rules debug install opencode` is supported.");
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
    default:
      printDebugHelp();
      return subcommand ? 1 : 0;
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

function readOpenCodeInstallScope(parsed: ParsedArgs): OpenCodeInstallScope {
  return parsed.flags.has("global") ? "global" : "repo";
}

function readStringFlag(parsed: ParsedArgs, name: string, fallback: string): string {
  const value = parsed.flags.get(name);
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function readOptionalString(parsed: ParsedArgs, name: string): string | undefined {
  const value = parsed.flags.get(name);
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function printHelp(): void {
  console.log(`ai-rules

Getting started:
  ai-rules setup
  ai-rules run "your coding task"
  ai-rules promote --yes "review comment to keep"
  ai-rules doctor

OpenCode:
  ai-rules setup
  opencode
  /airules your coding task

Shortcuts:
  ai-rules "your coding task"          Same as ai-rules run "your coding task"

Advanced:
  ai-rules debug compile "task"
  ai-rules debug select "task"
  ai-rules debug install opencode
`);
}

function printDebugHelp(): void {
  console.log(`ai-rules debug

Commands:
  ai-rules debug compile [--budget 800] [--no-resolve-conflicts] "task"
  ai-rules debug select [--budget 800] "task"
  ai-rules debug init
  ai-rules debug install opencode [--repo|--global] [--name airules] [--force]
`);
}
