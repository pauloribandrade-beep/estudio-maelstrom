import React from "react";
import { createRoot } from "react-dom/client";
import { Thumbnail } from "@remotion/player";
import { HL14SnowFlat } from "../src/lib/hl3r29";
// amostras de linguagem visual sobre o mesmo quadro: ?v=a|b|c&f=420&w=780
// o primeiro #ink do documento vence, então cada amostra redefine o tratamento dos personagens aqui em cima
const q = new URLSearchParams(location.search);
const f = Number(q.get("f") ?? 420), v = q.get("v") ?? "a", W = Number(q.get("w") ?? 780), H = W * 0.5625;
const fr = (o: Record<string, number>) => Object.fromEntries(Object.entries(o).map(([k, x]) => [k, k === "mode" ? x : Math.round(x * 30)]));
const props = { ...fr({ portalAt: 0, lastAt: 5.607, throughAt: 8.014, dogAt: 9.493, talkAt: 10.659, knowsAt: 21.614, hugAt: 27.047, aloneAt: 30.134, foldAt: 33.473, greenAt: 42.593, lightAt: 48.086, vanishAt: 51.044, mode: 1 }), life: 1584 };

const Filters: React.FC = () => (
  <svg width={0} height={0} style={{ position: "absolute" }}>
    <defs>
      {v === "a" ? (
        // A: contraluz. Personagem vira massa escura com a borda acesa pela luz do céu
        <filter id="ink" x="-20%" y="-20%" width="140%" height="140%">
          <feFlood floodColor="#0b1116" />
          <feComposite in2="SourceAlpha" operator="in" result="body" />
          <feOffset in="SourceAlpha" dx={-3} dy={-2} result="sh" />
          <feComposite in="SourceAlpha" in2="sh" operator="out" result="rimA" />
          <feFlood floodColor="#cfe9ff" />
          <feComposite in2="rimA" operator="in" result="rim" />
          <feMerge><feMergeNode in="body" /><feMergeNode in="rim" /></feMerge>
        </filter>
      ) : v === "b" ? (
        // B: graphic novel. Contorno grosso e sombra dura: tudo abaixo de um tom vira tinta preta
        <filter id="ink" x="-20%" y="-20%" width="140%" height="140%">
          <feColorMatrix in="SourceGraphic" type="luminanceToAlpha" result="lum" />
          <feComponentTransfer in="SourceGraphic" result="post">
            <feFuncR type="discrete" tableValues="0.04 0.42 0.95" />
            <feFuncG type="discrete" tableValues="0.04 0.40 0.92" />
            <feFuncB type="discrete" tableValues="0.06 0.42 0.88" />
          </feComponentTransfer>
          <feMorphology in="SourceAlpha" operator="dilate" radius={4.5} result="fat" />
          <feFlood floodColor="#07090c" />
          <feComposite in2="fat" operator="in" result="line" />
          <feMerge><feMergeNode in="line" /><feMergeNode in="post" /></feMerge>
        </filter>
      ) : (
        // C: pintado. Sem contorno, borda de pincel e volume com luz vinda de cima
        <filter id="ink" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={3} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={4} xChannelSelector="R" yChannelSelector="G" result="brush" />
          <feGaussianBlur in="SourceAlpha" stdDeviation={6} result="b" />
          <feOffset in="b" dx={5} dy={7} result="bo" />
          <feComposite in="SourceAlpha" in2="bo" operator="out" result="litA" />
          <feFlood floodColor="#fff3dc" floodOpacity={0.5} />
          <feComposite in2="litA" operator="in" result="lit" />
          <feComposite in="brush" in2="SourceAlpha" operator="in" result="body" />
          <feMerge><feMergeNode in="body" /><feMergeNode in="lit" /></feMerge>
        </filter>
      )}
      {/* tratamento do quadro inteiro */}
      <filter id="gradeB" colorInterpolationFilters="sRGB">
        <feColorMatrix type="matrix" values="0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0 0 0 1 0" result="g" />
        <feComponentTransfer in="g" result="p">
          <feFuncR type="discrete" tableValues="0.05 0.20 0.55 0.93" />
          <feFuncG type="discrete" tableValues="0.06 0.26 0.62 0.93" />
          <feFuncB type="discrete" tableValues="0.09 0.34 0.70 0.90" />
        </feComponentTransfer>
        {/* o vermelho/laranja sobrevive como cor de destaque */}
        <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  2.4 -1.6 -1.6 0 -0.35" result="red" />
        <feComposite in="red" in2="p" operator="over" />
      </filter>
      <filter id="gradeC" colorInterpolationFilters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves={3} seed={9} result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale={10} xChannelSelector="R" yChannelSelector="B" result="d" />
        <feGaussianBlur in="d" stdDeviation={0.8} />
      </filter>
      <pattern id="dots" width={5} height={5} patternUnits="userSpaceOnUse"><circle cx={2.5} cy={2.5} r={1.1} fill="#000" /></pattern>
    </defs>
  </svg>
);

const scene = <Thumbnail component={HL14SnowFlat} inputProps={props} compositionWidth={1920} compositionHeight={1080} durationInFrames={3000} fps={30} frameToDisplay={f} style={{ width: W, height: H }} />;
const box: React.CSSProperties = { position: "relative", width: W, height: H, overflow: "hidden" };
const over = (s: React.CSSProperties) => <div style={{ position: "absolute", inset: 0, pointerEvents: "none", ...s }} />;

const A = () => (
  <div style={box}>
    <div style={{ filter: "brightness(0.62) saturate(0.7) contrast(1.15) hue-rotate(-8deg)" }}>{scene}</div>
    {/* céu de crepúsculo polar e o chão que reflete a luz por trás deles */}
    {over({ background: "linear-gradient(180deg, rgba(36,58,92,.75) 0%, rgba(120,160,190,.15) 45%, rgba(0,0,0,0) 60%, rgba(4,8,14,.55) 100%)", mixBlendMode: "multiply" })}
    {over({ background: "radial-gradient(60% 40% at 52% 40%, rgba(190,235,255,.55), rgba(190,235,255,0) 70%)", mixBlendMode: "screen" })}
    {over({ background: "radial-gradient(120% 90% at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,.6) 100%)" })}
  </div>
);
const B = () => (
  <div style={box}>
    <div style={{ filter: "url(#gradeB) contrast(1.1)" }}>{scene}</div>
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, mixBlendMode: "multiply", opacity: 0.22 }}><rect width={W} height={H} fill="url(#dots)" /></svg>
    {over({ boxShadow: `inset 0 0 0 ${W * 0.012}px #0a0c10` })}
  </div>
);
const C = () => (
  <div style={box}>
    <div style={{ filter: "url(#gradeC) saturate(0.85) sepia(0.18) contrast(0.95)" }}>{scene}</div>
    {over({ background: "linear-gradient(180deg, rgba(255,214,170,.18), rgba(120,150,190,.10) 50%, rgba(30,40,60,.35))", mixBlendMode: "soft-light" })}
    {over({ background: "radial-gradient(40% 35% at 50% 42%, rgba(255,236,200,.35), rgba(255,236,200,0) 70%)", mixBlendMode: "screen" })}
    {over({ background: "radial-gradient(110% 85% at 50% 45%, rgba(0,0,0,0) 60%, rgba(10,12,20,.5) 100%)" })}
  </div>
);

createRoot(document.getElementById("r")!).render(<><Filters />{v === "a" ? <A /> : v === "b" ? <B /> : <C />}</>);
