import React from "react";
import { AbsoluteFill, Easing, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import spec from "./segments.json";
import wordsRaw from "./words.json";
import { Big, FONT, Word } from "../../lib/overlays";
import { CARD_X, CARD_Y, QuoteCard, ReelCaptions, Sfx, StrikeBig } from "../../lib/reel-overlays";
import { Push, TakesVideo, makeAt, makeTimeline, useZoom } from "../../lib/timeline";
import { Cutaway, KeywordCta, TitleTop } from "../../lib/cenas-basicas";
import { ZALE } from "../../lib/theme";

// Vídeo de TESTE do pipeline (voz sintética). Todos os tempos são segundos
// da gravação original; tl.E() converte para frames da edição.
const tl = makeTimeline(spec);
export const DURATION = tl.DURATION;
const At = makeAt(tl);
const SRC = "videos/teste/ig1080.mp4";

const SNAPS: [number, number][] = [
  [11.82, 1.0], [18.7, 1.1], [25.46, 1.0], [30.0, 1.1], [37.28, 1.0], [41.6, 1.1], [51.04, 1.0], [53.44, 1.12], [55.5, 1.0],
];
const PUSHES: Push[] = [
  { at: 20.5, z: 1.1, up: 10, until: 21.7 }, // "ela não volta"
  { at: 54.0, z: 1.12, up: 12, until: 55.4, down: 8 }, // "é condução"
];

// Animação vetorial da troca de tela: etiqueta de preço que tenta descer e trava.
const PriceNoDiscount: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const drop = interpolate(f, [6, 20], [0, 60], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const back = spring({ frame: f - 26, fps, config: { damping: 10, stiffness: 180 } });
  const x = spring({ frame: f - 30, fps, config: { damping: 12, stiffness: 200 } });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", fontFamily: FONT }}>
      <svg width={620} height={620} viewBox="0 0 620 620" style={{ transform: `translateY(${drop * (1 - back)}px)` }}>
        <path d="M120 170 L360 170 L520 310 L360 450 L120 450 Z" fill={ZALE.white} />
        <circle cx={185} cy={310} r={26} fill={ZALE.ink} />
        <text x={330} y={335} textAnchor="middle" fontSize={92} fontWeight={800} fill={ZALE.ink}>R$</text>
        <g opacity={x} transform={`translate(310 310) scale(${0.6 + 0.4 * x}) translate(-310 -310)`}>
          <line x1={430} y1={60} x2={560} y2={190} stroke={ZALE.red} strokeWidth={28} strokeLinecap="round" />
          <line x1={560} y1={60} x2={430} y2={190} stroke={ZALE.red} strokeWidth={28} strokeLinecap="round" />
        </g>
      </svg>
      <div style={{ color: ZALE.white, fontSize: 70, fontWeight: 800, marginTop: 10, opacity: x }}>
        não baixa o <span style={{ color: ZALE.redBright }}>preço</span>
      </div>
    </AbsoluteFill>
  );
};

export const Teste: React.FC = () => {
  const zoom = useZoom(tl, SNAPS, PUSHES);
  return (
    <AbsoluteFill style={{ background: "#000", fontFamily: FONT }}>
      <AbsoluteFill style={{ transform: `scale(${zoom})`, transformOrigin: "50% 29%" }}>
        <TakesVideo tl={tl} src={SRC} />
      </AbsoluteFill>
      {SNAPS.slice(1).map(([t]) => (
        <Sfx key={t} at={tl.E(t)} src="tap.wav" vol={0.22} />
      ))}

      {/* gancho escrito, primeiros segundos */}
      <At from={11.82} to={16.6} name="título">
        <TitleTop life={tl.life(11.82, 16.6)} text="O que falar quando a paciente diz “vou pensar”" highlight="“vou pensar”" />
      </At>

      {/* a resposta errada, riscada */}
      <At from={16.0} to={19.6} name="fica à vontade">
        <StrikeBig life={tl.life(16.0, 19.6)} text="fica à vontade" strikeAt={tl.rel(18.72, 16.0)} />
      </At>
      <Sfx at={tl.E(18.72)} src="whoosh.wav" vol={0.3} />

      {/* a virada */}
      <At from={28.5} to={32.4} name="não é não">
        <Big life={tl.life(28.5, 32.4)} x={CARD_X} y={CARD_Y} text="não é um não" sub="é uma dúvida que ela não falou" size={92} />
      </At>

      {/* troca de tela: animação vetorial */}
      <At from={38.3} to={41.2} name="cutaway preço">
        <Cutaway life={tl.life(38.3, 41.2)}>
          <PriceNoDiscount />
        </Cutaway>
      </At>
      <Sfx at={tl.E(38.3)} src="whoosh.wav" vol={0.3} />

      {/* a pergunta certa */}
      <At from={41.6} to={46.82} name="pergunta">
        <QuoteCard
          life={tl.life(41.6, 46.82)}
          header="pergunte"
          lines={[
            { text: "o que te deixou em dúvida?", at: tl.rel(43.4, 41.6) },
            { text: "o investimento ou o plano?", at: tl.rel(44.82, 41.6), big: true },
          ]}
        />
      </At>
      <Sfx at={tl.E(44.82)} src="thud.wav" vol={0.45} />

      <At from={54.06} to={55.5} name="condução">
        <Big life={tl.life(54.06, 55.5)} x={CARD_X} y={CARD_Y} text="condução" size={110} accent={ZALE.redBright} />
      </At>

      {/* CTA palavra-chave até o fim */}
      <Sequence from={tl.E(55.58)} durationInFrames={tl.DURATION - tl.E(55.58)} layout="none" name="CTA">
        <KeywordCta life={tl.DURATION - tl.E(55.58)} keyword="PENSAR" after="e receba as 3 frases no direct" />
      </Sequence>
      <Sfx at={tl.E(56.38)} src="pop.wav" vol={0.35} />

      <ReelCaptions words={wordsRaw as Word[]} />
    </AbsoluteFill>
  );
};
