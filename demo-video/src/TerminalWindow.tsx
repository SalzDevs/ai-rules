import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import type { DemoLine } from "./demo-script";
import { theme } from "./theme";

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

function prefix(kind: DemoLine["kind"]): { label: string; color: string } {
  switch (kind) {
    case "command":
      return { label: "$ ", color: theme.green };
    case "section":
      return { label: "> ", color: theme.cyan };
    case "chat-user":
      return { label: "you> ", color: theme.cyan };
    case "chat-agent":
      return { label: "agent> ", color: theme.purple };
    default:
      return { label: "", color: theme.text };
  }
}

function LineRow({
  line,
  startFrame,
  frame,
}: {
  line: DemoLine;
  startFrame: number;
  frame: number;
}) {
  const elapsed = Math.max(0, frame - startFrame);
  const duration = lineDuration(line);
  if (elapsed > duration + 5 && line.kind === "blank") return null;
  if (frame < startFrame) return null;

  const speed = line.typingSpeed ?? 2;
  const isTyped =
    line.kind === "command" || line.kind === "chat-user" || line.kind === "section";
  const charsVisible = isTyped
    ? Math.min(line.text.length, Math.floor(elapsed / speed))
    : line.kind === "chat-agent"
      ? Math.min(line.text.length, Math.floor(elapsed / 1.2))
      : line.text.length;

  const opacity = isTyped
    ? 1
    : interpolate(elapsed, [0, 10], [0, 1], { extrapolateRight: "clamp" });

  const { label, color: prefixColor } = prefix(line.kind);
  const textColor = line.color ?? (line.kind === "output" ? theme.muted : theme.text);

  if (line.kind === "highlight") {
    const boxOpacity = interpolate(elapsed, [0, 15], [0, 1], { extrapolateRight: "clamp" });
    return (
      <div
        style={{
          marginTop: 8,
          marginBottom: 8,
          padding: "14px 16px",
          borderRadius: 8,
          border: `1px solid ${theme.blue}`,
          background: "rgba(96, 165, 250, 0.08)",
          opacity: boxOpacity,
          color: theme.text,
          fontSize: 22,
          lineHeight: 1.45,
        }}
      >
        {line.text}
      </div>
    );
  }

  if (line.kind === "blank") return <div style={{ height: 12 }} />;

  const showCursor =
    isTyped && charsVisible < line.text.length && elapsed < duration - 5;

  return (
    <div
      style={{
        display: "flex",
        gap: 0,
        marginBottom: 6,
        opacity,
        fontSize: line.kind === "section" ? 24 : 21,
        lineHeight: 1.45,
        fontFamily: theme.font,
      }}
    >
      {label ? (
        <span style={{ color: prefixColor, flexShrink: 0, fontWeight: 600 }}>{label}</span>
      ) : null}
      <span style={{ color: textColor, whiteSpace: "pre-wrap" }}>
        {line.text.slice(0, charsVisible)}
        {showCursor ? (
          <span style={{ color: theme.green, opacity: Math.floor(elapsed / 8) % 2 ? 1 : 0 }}>▍</span>
        ) : null}
      </span>
    </div>
  );
}

export const TerminalWindow: React.FC<{ lines: DemoLine[]; title: string }> = ({ lines, title }) => {
  const frame = useCurrentFrame();
  let cursor = 0;
  const starts = lines.map((line) => {
    const start = cursor;
    cursor += lineDuration(line);
    return start;
  });

  const scrollOffset = interpolate(
    frame,
    [0, cursor],
    [0, Math.max(0, lines.length * 28 - 520)],
    { extrapolateRight: "clamp" },
  );

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 1500,
        margin: "0 auto",
        borderRadius: 14,
        overflow: "hidden",
        border: `1px solid ${theme.border}`,
        boxShadow: "0 24px 80px rgba(0,0,0,0.55)",
        fontFamily: theme.font,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "14px 18px",
          background: theme.titleBar,
          borderBottom: `1px solid ${theme.border}`,
        }}
      >
        <div style={{ width: 12, height: 12, borderRadius: "50%", background: theme.red }} />
        <div style={{ width: 12, height: 12, borderRadius: "50%", background: theme.yellow }} />
        <div style={{ width: 12, height: 12, borderRadius: "50%", background: theme.green }} />
        <span style={{ marginLeft: 12, color: theme.muted, fontSize: 18 }}>{title}</span>
      </div>
      <div
        style={{
          background: theme.panel,
          padding: "28px 32px",
          height: 580,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div style={{ transform: `translateY(-${scrollOffset}px)` }}>
          {lines.map((line, index) => (
            <LineRow key={index} line={line} startFrame={starts[index]} frame={frame} />
          ))}
        </div>
      </div>
    </div>
  );
};
