# ai-rules

**You rule your AI — not the other way around.**

Coding agents ship with implicit defaults: generic style, one-size-fits-all patterns, instructions buried in context you never wrote and cannot reuse. `ai-rules` is a local-first instruction layer that puts your standards back in your hands. You define rules once, select only what fits each task, and run [Pi](https://github.com/earendil-works/pi) or [OpenCode](https://opencode.ai) under a compact rule contract.

Rules live on your machine — outside the model context — so they persist across sessions, stay inspectable, and do not bloat every prompt.

> [!NOTE]
> Early beta. Personal rules only. Supported agents: Pi and OpenCode.

## Quickstart

1. Run setup from your project:

```bash
npx ai-rules setup
```

2. Create your first rule in Pi or OpenCode:

```bash
/create-rule
/create-rule no fetch directly inside React components
```

3. Run a task with your rules applied:

```bash
/airules Implement data loading in src/components/UserCard.tsx
```

Or from the CLI (after you have at least one active rule):

```bash
ai-rules run "Implement data loading in src/components/UserCard.tsx"
```

4. Check everything is wired up:

```bash
ai-rules doctor
```

Install globally if you prefer:

```bash
npm install -g ai-rules
ai-rules setup
```

Use `ai-rules setup --global` to install harness integrations in your user config instead of the current repo. Use `--force` to overwrite existing integration files.

## Why ai-rules Exists

I built this to fix failure modes I kept hitting with coding agents — not to add another abstraction layer on top of them.

### #1: The Agent Did Not Follow My Standards

**The problem.** You care about how code is written in *your* codebase: minimal diffs, no fetch in components, naming conventions you have refined over years. The agent does not know any of that unless you repeat it every session — or bury it in a system prompt you cannot reuse.

**The fix.** Store standards as personal rule files in `~/.config/ai-rules/rules/`. Each rule is Markdown with YAML frontmatter: triggers, scope, severity, and the instruction itself. They are yours. Edit them directly, version them, and carry them across projects.

### #2: Every Task Got the Full Rulebook

**The problem.** Dumping all your preferences into every prompt wastes context and dilutes what matters. A refactor task should not load rules about API design. A React task should not load Python conventions.

**The fix.** `ai-rules` selects only the rules relevant to the task — matched by keywords, file paths, languages, frameworks, and task kind — then compiles a compact contract. The agent sees what applies *now*, not everything you have ever decided.

### #3: I Did Not Own the Defaults

**The problem.** When rules only exist inside a chat, the model effectively sets the standard. You cannot inspect what was applied, diff it, or improve it over time.

**The fix.** Create and refine rules in the harness with `/create-rule`. The agent runs a structured interview (with selectable options for common choices), shows a preview, and writes a file you control. Then `/airules` or `ai-rules run` applies that library to real work.

### Summary

Software engineering is about constraints you choose deliberately. `ai-rules` makes those constraints explicit, local, and task-scoped — so the agent works under your standards, not the other way around.

## Reference

### CLI

| Command | Description |
| --- | --- |
| `ai-rules setup` | Create your personal rule folder and install Pi/OpenCode integrations |
| `ai-rules run "task"` | Select rules, compile a contract, and launch Pi or OpenCode |
| `ai-rules doctor` | Check rule folder, rule count, detected tools, and integrations |
| `ai-rules "task"` | Shortcut for `ai-rules run "task"` |

Setup flags: `--global`, `--force`, `--tool pi|opencode`.

### Harness commands

Installed by `ai-rules setup` into `.pi/extensions/ai-rules.ts` (Pi) and `.opencode/commands/` (OpenCode).

| Command | Description |
| --- | --- |
| `/create-rule` | Interview and write a personal rule file |
| `/create-rule <seed>` | Start the interview with a short seed (e.g. a convention you want to encode) |
| `/airules <task>` | Compile selected rules for the task and run it in the harness |

### Rule files

**Location**

- Rules: `~/.config/ai-rules/rules/*.md`
- Conflict overrides: `~/.config/ai-rules/overrides.yaml`

**Format**

Markdown with YAML frontmatter and these sections: `Trigger`, `Rule`, `Prefer`, `Rationale`, and optional `Example`.

```markdown
---
id: react.no-fetch-in-components
status: active
layer: personal
severity: high
scope:
  languages: [typescript]
  frameworks: [react]
  globs: ["**/*.{tsx,jsx}"]
  taskKinds: [feature, refactor]
triggers:
  keywords: [fetch, react, component, data loading]
conflictsWith: []
includeExample: when-needed
---

## Trigger
When adding or changing data loading in React components.

## Rule
Do not call `fetch` (or similar IO) directly inside components.

## Prefer
Use a dedicated data layer — hooks, loaders, or server components — and keep components presentational.

## Rationale
Colocated fetch logic is hard to test, cache, and reuse across routes.

## Example

    // avoid: fetch inside the component body
    // prefer: a hook or loader the component consumes
```

### Debug commands

For inspecting selection and compiled output without launching an agent:

```bash
ai-rules debug select "your task"
ai-rules debug compile "your task"
ai-rules debug install opencode
ai-rules debug install pi
```

Legacy wrappers `smart-opencode` and `smart-pi` still work.

## Develop

```bash
npm test
npm run build
npm pack
```

Requires Node.js 20+.
