<div align="center">

# ai-rules

### You rule your AI — not the other way around.

**Local-first coding rules for [Pi](https://github.com/earendil-works/pi) and [OpenCode](https://opencode.ai).**  
Define standards once → select what fits each task → run the agent under a contract you own.

<br />

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen)
![Status](https://img.shields.io/badge/status-early%20beta-orange)

</div>

<br />

```bash
/create-rule no fetch in React components
/airules Add UserCard data loading
```

<br />

---

## Quickstart

```bash
npx @therealsalzdevs/ai-rules setup
```

In Pi or OpenCode:

```bash
/create-rule
/airules Implement data loading in src/components/UserCard.tsx
```

From the terminal:

```bash
ai-rules run "Implement data loading in src/components/UserCard.tsx"
ai-rules doctor
```

<details>
<summary><strong>Install globally</strong></summary>

```bash
npm install -g @therealsalzdevs/ai-rules
ai-rules setup              # repo-local integrations
ai-rules setup --global     # user-wide integrations
ai-rules setup --force      # overwrite existing integration files
```

</details>

<br />

## How it works

```text
       Developer Task
              │
              ▼
         ┌─────────┐
         │ ai-rules │
         └────┬────┘
              │
              ▼
       Rule Selection          ← keywords · globs · scope · task kind
              │
              ▼
   Compiled Rule Contract     ← compact prompt, token-budgeted
              │
              ▼
      AI Coding Agent          ← Pi or OpenCode
```

Your rules live in `~/.config/ai-rules/rules/`. They stay **outside** the model context until a task needs them.

<details>
<summary><strong>Full compile output</strong></summary>

```text
## AI Rules Contract

### Core
- Follow the selected rule contract below when writing code for this task.
- If selected rules conflict, stop and ask before choosing a pattern.
- Do not invent project standards that are not in the selected rules or visible code.

### Selected Rules
- react.no-fetch-in-components

### Mandatory Instructions
- [react.no-fetch-in-components] Do not call `fetch` (or similar IO) directly inside components. Prefer: Use a dedicated data layer — hooks, loaders, or server components — and keep components presentational.

### Examples
Rule react.no-fetch-in-components:
// avoid: fetch inside the component body
    // prefer: a hook or loader the component consumes

## User Task
Add UserCard data loading
```

</details>

<br />

## Why ai-rules exists

> [!IMPORTANT]
> Coding agents ship with defaults you never wrote. `ai-rules` makes **your** standards explicit, local, and task-scoped.

| Problem | What ai-rules does |
| --- | --- |
| You repeat the same instructions every session | Rules persist as Markdown in `~/.config/ai-rules/rules/` |
| Every prompt gets the full rulebook | Selects by keywords, globs, language, framework, and task kind |
| Standards vanish when the chat ends | `/create-rule` writes a file; `/airules` applies it to real work |

The agent should work under constraints **you** chose — not implicit model defaults.

<br />

## Example rule

**`react.no-fetch-in-components`**

| | |
| --- | --- |
| **When** | Adding or changing data loading in React components |
| **Enforces** | No `fetch` or similar IO inside component bodies |
| **Why** | IO belongs in hooks, loaders, or server layers — easier to test and reuse |

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

<br />

---

<br />

<details>
<summary><strong>CLI reference</strong></summary>

| Command | Description |
| --- | --- |
| `ai-rules setup` | Create rule folder + install Pi/OpenCode integrations |
| `ai-rules run "task"` | Select rules, compile contract, launch agent |
| `ai-rules doctor` | Check rules, tools, and integrations |
| `ai-rules "task"` | Shortcut for `ai-rules run "task"` |

**Setup flags:** `--global` · `--force` · `--tool pi|opencode`

**Harness commands** (installed by setup):

| Command | Description |
| --- | --- |
| `/create-rule` | Interview → preview → save a personal rule |
| `/create-rule <seed>` | Start with a short seed phrase |
| `/airules <task>` | Compile selected rules + run in harness |

**Paths**

- Rules: `~/.config/ai-rules/rules/*.md`
- Conflict overrides: `~/.config/ai-rules/overrides.yaml`

Rule format: Markdown + YAML frontmatter with `Trigger`, `Rule`, `Prefer`, `Rationale`, and optional `Example`.

</details>

<details>
<summary><strong>Debug &amp; legacy</strong></summary>

Inspect without launching an agent:

```bash
ai-rules debug select "your task"
ai-rules debug compile "your task"
ai-rules debug install opencode
ai-rules debug install pi
```

Legacy wrappers: `smart-opencode` · `smart-pi`

</details>

<details>
<summary><strong>Development</strong></summary>

Requires Node.js 20+.

```bash
git clone https://github.com/SalzDevs/ai-rules.git
cd ai-rules
npm install
npm test
npm run build
npm pack
```

</details>

<br />

<div align="center">

**Early beta** · personal rules only · Pi & OpenCode

</div>
