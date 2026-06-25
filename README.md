# ai-rules

`ai-rules` is a local-first instruction layer for AI coding agents. It stores reusable coding rules outside the model context, selects only the rules relevant to one task, and launches supported tools with a compact rule contract.

## Commands

```sh
ai-rules init
ai-rules compile "Implement data loading in src/components/UserCard.tsx"
ai-rules select "Implement data loading in src/components/UserCard.tsx"
ai-rules promote
```

## Wrappers

```sh
smart-codex "task"
smart-claude "task"
smart-opencode "task"
smart-pi "task"
```

Use `--dry-run` on wrappers to inspect the exact prompt before launching the underlying tool.

## Rule Locations

- Personal rules: `~/.config/ai-rules/rules/`
- Repo rules: `.ai-rules/rules/`
- Personal conflict overrides: `~/.config/ai-rules/overrides.yaml`

Rules are Markdown files with YAML frontmatter and `Trigger`, `Rule`, `Prefer`, `Rationale`, and optional `Example` sections.
