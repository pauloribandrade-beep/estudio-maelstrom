import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import spec from "./segments.json";
import wordsRaw from "./words.json";
import { FONT, Word } from "../../lib/overlays";
import { ReelCaptions } from "../../lib/reel-overlays";
import { TakesVideo, makeAt, makeTimeline, useZoom } from "../../lib/timeline";
import { SplitScreen, TitleTop } from "../../lib/cenas-basicas";

// TESTE da tela dividida, jeito 1: viral com áudio nos primeiros segundos,
// você embaixo; depois sai da divisão e fica só você.
const tl = makeTimeline(spec);
export const SPLIT_DURATION = tl.DURATION;
const At = makeAt(tl);
const SRC = "videos/teste/ig1080.mp4";
const SPLIT_END = 18.7; // segundo original em que a divisão acaba

export const SplitTeste: React.FC = () => {
  const zoom = useZoom(tl, [[11.82, 1.0], [18.7, 1.1], [25.46, 1.0]], []);
  const splitFrames = tl.E(SPLIT_END);
  return (
    <AbsoluteFill style={{ background: "#000", fontFamily: FONT }}>
      {/* a cópia em tela cheia leva o áudio e fica coberta pela divisão no começo */}
      <AbsoluteFill style={{ transform: `scale(${zoom})`, transformOrigin: "50% 29%" }}>
        <TakesVideo tl={tl} src={SRC} />
      </AbsoluteFill>
      <Sequence from={0} durationInFrames={splitFrames} layout="none" name="tela dividida">
        <SplitScreen
          viral="videos/teste/viral1080.mp4"
          viralVolume={0.6}
          me={<TakesVideo tl={tl} src={SRC} muted style={{ objectPosition: "50% 30%" }} />}
        />
      </Sequence>
      <At from={11.82} to={18.6} name="título">
        <TitleTop life={tl.life(11.82, 18.6)} text="Isso é atendimento ou é espantar paciente?" highlight="espantar paciente" y={1000} size={54} />
      </At>
      <ReelCaptions words={wordsRaw as Word[]} />
    </AbsoluteFill>
  );
};
