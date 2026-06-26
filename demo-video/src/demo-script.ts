export type LineKind = "command" | "output" | "chat-user" | "chat-agent" | "section" | "blank" | "highlight";

export type DemoLine = {
  kind: LineKind;
  text: string;
  color?: string;
  pauseAfter?: number;
  typingSpeed?: number;
};

export const FPS = 30;

export const introDuration = 4 * FPS;

export const outroDuration = 3 * FPS;

/** Real transcript content — abbreviated for ~45s terminal section */
export const terminalLines: DemoLine[] = [
  { kind: "command", text: "cd my-app", pauseAfter: 8 },
  { kind: "command", text: "npx ai-rules setup", pauseAfter: 12 },
  { kind: "output", text: "ai-rules is ready.", color: "#4ade80" },
  { kind: "output", text: "Rule folder: ~/.config/ai-rules/rules", pauseAfter: 6 },
  { kind: "output", text: "Detected tools: opencode, pi", pauseAfter: 6 },
  { kind: "output", text: "Installed: /airules and /create-rule", pauseAfter: 14 },
  { kind: "blank", text: "", pauseAfter: 10 },
  { kind: "command", text: "opencode", pauseAfter: 16 },
  { kind: "section", text: "/create-rule no fetch directly inside React components", pauseAfter: 20 },
  {
    kind: "chat-agent",
    text: 'Seed detected: "no fetch directly inside React components". Question 1: What should the agent avoid?',
    pauseAfter: 18,
  },
  { kind: "chat-user", text: "avoid calling fetch directly in React components", pauseAfter: 14 },
  { kind: "chat-agent", text: "Question 2: What should it do instead?", pauseAfter: 12 },
  { kind: "chat-user", text: "use a custom hook", pauseAfter: 14 },
  { kind: "chat-agent", text: "Suggested id: react.no-direct-fetch. Preview ready. Save, Edit, or Cancel?", pauseAfter: 16 },
  { kind: "chat-user", text: "save", pauseAfter: 10 },
  {
    kind: "chat-agent",
    text: "Saved to ~/.config/ai-rules/rules/react.no-direct-fetch.md",
    color: "#4ade80",
    pauseAfter: 20,
  },
  { kind: "blank", text: "", pauseAfter: 8 },
  { kind: "section", text: "/airules Add UserCard data loading", pauseAfter: 18 },
  { kind: "output", text: "## AI Rules Contract", color: "#60a5fa", pauseAfter: 8 },
  { kind: "output", text: "Selected: react.no-direct-fetch", pauseAfter: 8 },
  {
    kind: "highlight",
    text: "Do not call fetch directly inside React components. Use a custom hook.",
    pauseAfter: 24,
  },
  { kind: "output", text: "## User Task: Add UserCard data loading", color: "#60a5fa", pauseAfter: 30 },
];

function lineDuration(line: DemoLine): number {
  const pause = line.pauseAfter ?? 10;
  const speed = line.typingSpeed ?? 2;
  switch (line.kind) {
    case "command":
    case "chat-user":
      return line.text.length * speed + pause;
    case "chat-agent":
      return Math.min(line.text.length * 1.2, 120) + pause;
    case "section":
      return line.text.length * 2 + pause;
    case "highlight":
      return 40 + pause;
    case "blank":
      return pause;
    default:
      return 14 + pause;
  }
}

export function computeTerminalDuration(lines: DemoLine[]): number {
  return lines.reduce((total, line) => total + lineDuration(line), 0);
}

export const terminalDuration = computeTerminalDuration(terminalLines);

export const totalDuration = introDuration + terminalDuration + outroDuration;
