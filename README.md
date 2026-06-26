# ai-rules

**You rule your AI — not the other way around.**

Coding agents come with hidden defaults: generic style, one-size-fits-all patterns, instructions you never wrote and can't reuse. `ai-rules` puts you back in charge. Your standards live locally, outside the model context. You define them once, select only what fits each task, and the agent runs under a compact rule contract — not whatever the model felt like that day.

- **Your rules, your machine** — personal Markdown in `~/.config/ai-rules/rules/`
- **Task-scoped** — only relevant rules enter the prompt
- **Harness-native** — create rules with `/create-rule`, run tasks with `/airules` in Pi or OpenCode

> Early beta. Personal rules for [Pi](https://github.com/earendil-works/pi) and [OpenCode](https://opencode.ai) today.

## Quick start

**1. Setup**

```sh
cd your-project
npx ai-rules setup
```

**2. Create your first rule** (in Pi or OpenCode)

```sh
/create-rule
/create-rule no fetch directly inside React components
```

**3. Run a task**

In Pi or OpenCode:

```sh
/airules Implement data loading in src/components/UserCard.tsx
```

Or from the CLI (after you have at least one rule):

```sh
npx ai-rules run "Implement data loading in src/components/UserCard.tsx"
```

Install globally once if you prefer:

```sh
npm install -g ai-rules
ai-rules setup
```

### Pi

```sh
npx ai-rules setup
pi
/create-rule
/airules Implement data loading in src/components/UserCard.tsx
```

### OpenCode

```sh
npx ai-rules setup
opencode
/create-rule
/airules Implement data loading in src/components/UserCard.tsx
```

## Commands

```sh
ai-rules setup
ai-rules run "your coding task"
ai-rules doctor
```

Shortcut:

```sh
ai-rules "your coding task"
```

## What setup does

`ai-rules setup` is the only command you need to get started. It:

- creates your personal rule folder
- detects installed coding tools
- installs the native OpenCode `/airules` and `/create-rule` commands
- installs the native Pi `/airules` and `/create-rule` extension

Optional flags:

```sh
ai-rules setup --global
ai-rules setup --force
```

Create your first rule in Pi or OpenCode (step 2 above), then run tasks with `/airules` or `ai-rules run "your task"`.

## Advanced / debug

Power-user commands are hidden under `debug`:

```sh
ai-rules debug compile "task"
ai-rules debug select "task"
ai-rules debug install opencode
ai-rules debug install pi
```

Legacy wrappers still work:

```sh
smart-opencode "task"
smart-pi "task"
```

## Rule Locations

- Personal rules: `~/.config/ai-rules/rules/`
- Personal conflict overrides: `~/.config/ai-rules/overrides.yaml`

Rules are Markdown files with YAML frontmatter and `Trigger`, `Rule`, `Prefer`, `Rationale`, and optional `Example` sections.

## Publish / develop

```sh
npm test
npm run build
npm pack
npx ./ai-rules-0.2.0.tgz setup
```

To publish:

```sh
npm publish
```
