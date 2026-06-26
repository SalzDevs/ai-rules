import React from "react";
import { Composition } from "remotion";
import { AiRulesDemo } from "./AiRulesDemo";
import { totalDuration } from "./demo-script";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="AiRulesDemo"
        component={AiRulesDemo}
        durationInFrames={totalDuration}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
