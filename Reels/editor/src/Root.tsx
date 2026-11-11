import React from "react";
import { Composition } from "remotion";
import "./lib/fonts";
import { FPS, H, W } from "./lib/theme";
import { DURATION as TESTE_DUR, Teste } from "./videos/teste/Video";
import { SPLIT_DURATION, SplitTeste } from "./videos/teste/Split";
import { PALCO_DURATION, PalcoTeste } from "./videos/teste/Palco";
import { VITRINE_DURATION, Vitrine } from "./videos/vitrine/Vitrine";
import { AUDICAO_DURATION, Audicao } from "./videos/audicao/Audicao";
import { PersonagensTeste } from "./videos/_teste/Personagens";

// Um <Composition> por vídeo. Ao criar um vídeo novo: src/videos/<slug>/Video.tsx
// e uma linha aqui.
export const Root: React.FC = () => (
  <>
    <Composition id="PersonagensTeste" component={PersonagensTeste} durationInFrames={60} fps={FPS} width={W} height={H} />
    <Composition id="Teste" component={Teste} durationInFrames={TESTE_DUR} fps={FPS} width={W} height={H} />
    <Composition id="Audicao" component={Audicao} durationInFrames={AUDICAO_DURATION} fps={FPS} width={W} height={H} />
    <Composition id="Vitrine" component={Vitrine} durationInFrames={VITRINE_DURATION} fps={FPS} width={W} height={H} />
    <Composition id="PalcoTeste" component={PalcoTeste} durationInFrames={PALCO_DURATION} fps={FPS} width={W} height={H} />
    <Composition id="SplitTeste" component={SplitTeste} durationInFrames={SPLIT_DURATION} fps={FPS} width={W} height={H} />
  </>
);
