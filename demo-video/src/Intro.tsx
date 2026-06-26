import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "./theme";

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({ frame, fps, config: { damping: 18, stiffness: 120 } });
  const subtitleOpacity = interpolate(frame, [20, 40], [0, 1], { extrapolateRight: "clamp" });
  const taglineOpacity = interpolate(frame, [35, 55], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 50% 20%, #1a1a2e 0%, ${theme.bg} 55%)`,
        justifyContent: "center",
        alignItems: "center",
        fontFamily: theme.sans,
      }}
    >
      <div style={{ textAlign: "center", transform: `scale(${titleSpring})` }}>
        <div
          style={{
            fontSize: 88,
            fontWeight: 700,
            letterSpacing: -2,
            color: theme.accent,
            marginBottom: 16,
          }}
        >
          ai-rules
        </div>
        <div
          style={{
            fontSize: 36,
            fontWeight: 500,
            color: theme.text,
            opacity: subtitleOpacity,
            marginBottom: 24,
          }}
        >
          You rule your AI — not the other way around.
        </div>
        <div
          style={{
            fontSize: 24,
            color: theme.muted,
            opacity: taglineOpacity,
          }}
        >
          Personal coding rules for Pi & OpenCode
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        background: theme.bg,
        justifyContent: "center",
        alignItems: "center",
        fontFamily: theme.sans,
        opacity,
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48, fontWeight: 600, color: theme.accent, marginBottom: 16 }}>
          Define once. Select per task. Run under your rules.
        </div>
        <div style={{ fontSize: 28, color: theme.blue }}>github.com/SalzDevs/ai-rules</div>
      </div>
    </AbsoluteFill>
  );
};
