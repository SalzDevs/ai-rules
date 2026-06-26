# ai-rules demo video

Remotion project that renders a terminal-style demo from the real OpenCode session transcript.

## Commands

```bash
npm run studio    # preview in Remotion Studio
npm run render    # write ../docs/demo.mp4
npm run still     # write ../docs/demo-poster.png
```

From the repo root:

```bash
npm run video          # refresh transcript + render mp4
npm run video:studio   # open Remotion Studio
```

## Source material

- Interview dialogue: exported OpenCode session (`docs/demo-project/create-rule-session.json`)
- `/airules` contract: live `ai-rules debug compile` output
- Script: `src/demo-script.ts` (edit lines, timing, and colors here)

## Output

- `docs/demo.mp4` — 1920×1080, ~60s
- `docs/demo-poster.png` — intro frame for README poster
