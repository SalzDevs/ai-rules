# ai-rules

`ai-rules` is a local-first instruction layer for AI coding agents. It stores reusable coding rules outside the model context, selects only the rules relevant to one task, and launches supported tools with a compact rule contract.

## Quick start

No install required:

```sh
cd your-project
npx ai-rules setup
npx ai-rules run "Implement data loading in src/components/UserCard.tsx"
```

Or install globally once:

```sh
npm install -g ai-rules
ai-rules setup
ai-rules run "Implement data loading in src/components/UserCard.tsx"
```

Or in OpenCode:

```sh
npx ai-rules setup
opencode
/airules Implement data loading in src/components/UserCard.tsx
```

Or in Pi:

```sh
npx ai-rules setup
pi
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
- installs the native OpenCode `/airules` command
- installs the native Pi `/airules` extension

Optional flags:

```sh
ai-rules setup --global
ai-rules setup --force
```

Add your own rules as Markdown files in `~/.config/ai-rules/rules/` before running tasks.

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
