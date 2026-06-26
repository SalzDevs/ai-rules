import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { introDuration, outroDuration, terminalDuration, terminalLines } from "./demo-script";
import { Intro, Outro } from "./Intro";
import { TerminalWindow } from "./TerminalWindow";
import { theme } from "./theme";

export const AiRulesDemo: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: theme.bg }}>
      <Sequence durationInFrames={introDuration}>
        <Intro />
      </Sequence>
      <Sequence from={introDuration} durationInFrames={terminalDuration}>
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
            padding: 80,
            background: `radial-gradient(circle at 50% 0%, #14141f 0%, ${theme.bg} 50%)`,
          }}
        >
          <TerminalWindow lines={terminalLines} title="opencode — my-app" />
        </AbsoluteFill>
      </Sequence>
      <Sequence from={introDuration + terminalDuration} durationInFrames={outroDuration}>
        <Outro />
      </Sequence>
    </AbsoluteFill>
  );
};
