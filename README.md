# ai-rules

`ai-rules` is a local-first instruction layer for AI coding agents. It stores reusable coding rules outside the model context, selects only the rules relevant to one task, and launches supported tools with a compact rule contract.

## Quick start

```sh
npm install -g ai-rules
cd your-project
ai-rules setup
ai-rules run "Implement data loading in src/components/UserCard.tsx"
```

Or in OpenCode:

```sh
ai-rules setup
opencode
/airules Implement data loading in src/components/UserCard.tsx
```

## Commands

```sh
ai-rules setup
ai-rules run "your coding task"
ai-rules promote --yes "review comment to keep"
ai-rules doctor
```

Shortcut:

```sh
ai-rules "your coding task"
```

## What setup does

`ai-rules setup` is the only command you need to get started. It:

- creates personal and repo rule folders
- adds starter example rules if the repo has none yet
- detects installed coding tools
- installs the native OpenCode `/airules` command when OpenCode is available

Optional flags:

```sh
ai-rules setup --global
ai-rules setup --with-examples
ai-rules setup --force
```

## Promote review feedback

Turn a review comment into a reusable rule:

```sh
ai-rules promote --yes "React components should not fetch directly; use the project data hook instead"
```

Use `--repo` or `--personal` to override the default save location.

## Advanced / debug

Power-user commands are hidden under `debug`:

```sh
ai-rules debug compile "task"
ai-rules debug select "task"
ai-rules debug install opencode
```

Legacy wrappers still work:

```sh
smart-opencode "task"
smart-claude "task"
smart-codex "task"
smart-pi "task"
```

## Rule Locations

- Personal rules: `~/.config/ai-rules/rules/`
- Repo rules: `.ai-rules/rules/`
- Personal conflict overrides: `~/.config/ai-rules/overrides.yaml`

Rules are Markdown files with YAML frontmatter and `Trigger`, `Rule`, `Prefer`, `Rationale`, and optional `Example` sections.
