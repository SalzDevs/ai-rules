# ai-rules

`ai-rules` is a local-first instruction layer for AI coding agents. It stores reusable coding rules outside the model context, selects only the rules relevant to one task, and launches supported tools with a compact rule contract.

## Commands

```sh
ai-rules init
ai-rules compile "Implement data loading in src/components/UserCard.tsx"
ai-rules select "Implement data loading in src/components/UserCard.tsx"
ai-rules promote
ai-rules install opencode
```

## Wrappers

```sh
smart-codex "task"
smart-claude "task"
smart-opencode "task"
smart-pi "task"
```

Use `--dry-run` on wrappers to inspect the exact prompt before launching the underlying tool.

## Native OpenCode Command

Install the project-local OpenCode slash command:

```sh
ai-rules install opencode
```

This creates `.opencode/commands/airules.md`. In OpenCode, run:

```sh
/airules Implement data loading in src/components/UserCard.tsx
```

OpenCode will inject the compact `ai-rules` contract for that task using its native shell-output command template. Use `--global` to install the command into `~/.config/opencode/commands/` instead.

## Rule Locations

- Personal rules: `~/.config/ai-rules/rules/`
- Repo rules: `.ai-rules/rules/`
- Personal conflict overrides: `~/.config/ai-rules/overrides.yaml`

Rules are Markdown files with YAML frontmatter and `Trigger`, `Rule`, `Prefer`, `Rationale`, and optional `Example` sections.
