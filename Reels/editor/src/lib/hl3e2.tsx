import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { loadFont as loadCaveat } from "@remotion/google-fonts/Caveat";
import { FONT, MONO } from "./overlays";
import { C, Clip, HL, OUT, lerp, rnd } from "./hl3";

// Cenas do 1D, 2ª rodada (2026-10-01): caderno de papel com esboços, "Mas, espera." congelando o vídeo,
// e o fim de bloco escurecendo até o impacto. Tempos em QUADROS relativos à cena.

const { fontFamily: HAND } = loadCaveat();
const E = (e: (t: number) => number) => ({ ...C, easing: e });
const typed = (text: string, f: number, at: number, cps = 0.9) => text.slice(0, Math.max(0, Math.floor((f - at) / cps)));
const fadeLife = (f: number, life: number, a = 12, b = 12) => Math.min(lerp(f, 0, a, 0, 1, OUT), lerp(f, life - b, life, 1, 0));

// ---------------------------------------------------------------------------------------------
// CADERNO DE PAPEL COM ESBOÇOS: cada linha escrita à mão na palavra e, ao lado, um desenho a caneta
// sendo traçado (porta entreaberta · silhueta diante do espelho · peças que não se encaixam).
// `markAt`: círculo vermelho à mão em volta de tudo ("anota bem").
// ---------------------------------------------------------------------------------------------
const INK = "#1c2a6e";
type Stroke = { d: string; len: number; dashed?: boolean };
const SKETCH: Record<string, Stroke[]> = {
  door: [
    { d: "M 20 150 L 20 10 L 110 10 L 110 150", len: 380 },
    { d: "M 20 10 L 72 32 L 72 166 L 20 150", len: 380 },
    { d: "M 62 92 m -4 0 a 4 4 0 1 0 8 0 a 4 4 0 1 0 -8 0", len: 30 },
    { d: "M 112 40 L 152 28 M 112 82 L 158 82 M 112 124 L 152 136", len: 140 },
    { d: "M 4 152 L 164 152", len: 160 },
  ],
  mirror: [
    // silhueta (sem rosto) diante do espelho; o reflexo é tracejado
    { d: "M 40 40 m -16 0 a 16 16 0 1 0 32 0 a 16 16 0 1 0 -32 0 M 40 58 C 18 64 14 100 18 150 M 40 58 C 62 64 66 100 62 150", len: 360 },
    { d: "M 92 14 L 150 14 L 150 160 L 92 160 Z", len: 420 },
    { d: "M 121 40 m -14 0 a 14 14 0 1 0 28 0 a 14 14 0 1 0 -28 0 M 121 56 C 103 62 100 96 103 140 M 121 56 C 139 62 142 96 139 140", len: 320, dashed: true },
    { d: "M 100 24 L 112 36 M 132 120 L 142 130", len: 40 },
  ],
  puzzle: [
    { d: "M 10 50 L 50 50 C 46 36 66 36 62 50 L 70 50 L 70 85 C 84 81 84 101 70 97 L 70 130 L 10 130 Z", len: 420 },
    { d: "M 96 50 L 150 50 L 150 130 L 96 130 L 96 99 C 110 103 110 79 96 83 Z", len: 380 },
    { d: "M 76 66 L 90 66 M 76 114 L 90 114", len: 40 },
  ],
};
const Sketch: React.FC<{ kind: string; at: number; f: number }> = ({ kind, at, f }) => (
  <svg width={170} height={170} viewBox="0 0 170 170" style={{ overflow: "visible" }}>
    {(SKETCH[kind] ?? []).map((p, i) => {
      const p0 = at + i * 9;
      const k = lerp(f, p0, p0 + 14, 0, 1, OUT);
      return p.dashed ? (
        <path key={i} d={p.d} fill="none" stroke={INK} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="6 7" opacity={k} />
      ) : (
        <path key={i} d={p.d} fill="none" stroke={INK} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={p.len} strokeDashoffset={p.len - p.len * k} />
      );
    })}
  </svg>
);

export const HLSketchbook: React.FC<{ life: number; title?: string; lines: { text: string; at: number; sketch?: string }[]; markAt?: number }> = ({ life, title = "caderno aberto", lines, markAt = 1e9 }) => {
  const f = useCurrentFrame();
  const o = fadeLife(f, life, 14, 12);
  const e = lerp(f, 0, 22, 0, 1, OUT);
  const mk = lerp(f, markAt, markAt + 18, 0, 1, OUT);
  return (
    <AbsoluteFill style={{ opacity: o, perspective: 1500 }}>
      <div
        style={{
          position: "absolute",
          left: 960 - 700,
          top: 90,
          width: 1400,
          height: 900,
          borderRadius: 18,
          background: "linear-gradient(170deg, #eee6d2 0%, #e2d8bf 100%)",
          boxShadow: "0 50px 140px rgba(0,0,0,0.7), inset 0 0 120px rgba(120,90,40,0.25)",
          transform: `translateZ(${(1 - e) * -500}px) rotateX(${8 + (1 - e) * 14}deg) rotateZ(1deg) scale(${1 + lerp(f, 0, life, 0, 0.03, C)})`,
          overflow: "hidden",
        }}
      >
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} style={{ position: "absolute", left: 0, right: 0, top: 110 + i * 85, height: 1, background: "rgba(60,80,140,0.2)" }} />
        ))}
        <div style={{ position: "absolute", left: 120, top: 0, bottom: 0, width: 2, background: "rgba(190,60,60,0.35)" }} />
        <div style={{ position: "absolute", left: 150, top: 30, fontFamily: HAND, fontSize: 58, color: "#b3121b" }}>{title}</div>
        {lines.map((l, i) =>
          f >= l.at ? (
            <div key={i} style={{ position: "absolute", left: 150, top: 140 + i * 240, right: 60, height: 220, display: "flex", alignItems: "center", gap: 50 }}>
              <div style={{ width: 240, display: "flex", justifyContent: "center", transform: "scale(1.3)" }}>{l.sketch ? <Sketch kind={l.sketch} at={l.at} f={f} /> : null}</div>
              <div style={{ fontFamily: HAND, fontSize: 98, color: INK, lineHeight: 1 }}>{typed(l.text, f, l.at)}</div>
            </div>
          ) : null,
        )}
        <svg width={1400} height={900} viewBox="0 0 1400 900" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <path d="M 1230 170 C 1340 330 1310 770 900 860 C 500 905 150 860 125 600 C 95 330 260 120 700 112 C 1000 104 1180 140 1255 220" fill="none" stroke="#b3121b" strokeWidth={7} strokeLinecap="round" strokeDasharray="3700" strokeDashoffset={3700 - 3700 * mk} opacity={mk > 0 ? 0.9 : 0} />
        </svg>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// "MAS, ESPERA.": o trailer da "história" vai aproximando e escurecendo nas bordas (build-up); em
// `freezeAt` a imagem congela como vídeo pausado (sem cor, ícone de pausa, tremida, impacto);
// em `backAt` o quadro congelado recua para o espaço.
// ---------------------------------------------------------------------------------------------
export const HLFreezeWait: React.FC<{
  life: number;
  src: string;
  from: number;
  rate?: number;
  titleAt?: number;
  title?: string;
  freezeAt: number;
  word?: string;
  subAt?: number;
  sub?: string;
  backAt?: number;
  backEndAt?: number;
  still?: string;
  intro?: boolean;
  knows?: { w: string; at: number }[];
}> = ({ life, src, from, rate = 1, titleAt = 1e9, title = "a história", freezeAt, word = "espera.", subAt = 1e9, sub = "antes, algumas coisas", backAt = 1e9, backEndAt, still, intro = false, knows = [] }) => {
  const f = useCurrentFrame();
  const o0 = interpolate(f, [life - 10, life], [1, 0], C);
  const frozen = f >= freezeAt;
  const build = lerp(f, 0, freezeAt, 0, 1, E(Easing.in(Easing.quad)));
  const zoom = 1.02 + 0.24 * build;
  const desat = lerp(f, freezeAt, freezeAt + 6, 0, 1, OUT);
  const shake = frozen && f < freezeAt + 10 ? (1 - (f - freezeAt) / 10) * 16 : 0;
  const sx = shake ? (rnd(f * 5) - 0.5) * shake : 0;
  // se desfaz devagar: recua, perde o foco e some até `backEndAt` (o plano seguinte nasce por baixo)
  const back = lerp(f, backAt, backEndAt ?? backAt + 24, 0, 1, E(Easing.inOut(Easing.sin)));
  const bEnd = backEndAt ?? backAt + 24;
  const o = o0 * (1 - lerp(f, backAt + (bEnd - backAt) * 0.45, bEnd, 0, 1, C)); // some na segunda metade do recuo
  const tp = lerp(f, titleAt, titleAt + 12, 0, 1, OUT) * (1 - lerp(f, freezeAt, freezeAt + 4, 0, 1, C));
  const wp = interpolate(f, [freezeAt, freezeAt + 6], [1.6, 1], { ...C, easing: Easing.out(Easing.cubic) });
  const sp = lerp(f, subAt, subAt + 12, 0, 1, OUT);
  const flash = interpolate(f, [freezeAt, freezeAt + 1, freezeAt + 9], [0.6, 0.4, 0], C);
  const vig = build * 0.75;
  // entrada (opcional): a cidade nasce do escuro, vindo de perto e desfocada (sem corte seco do plano anterior)
  const inn = intro ? lerp(f, 0, 16, 0, 1, OUT) : 1;
  // "eu sei, eu sei, eu sei": cada um entra NA palavra, o anterior recua e apaga; somem antes do título
  const kEnd = knows.length ? Math.min(titleAt, knows[knows.length - 1].at + 40) : 0;
  return (
    <AbsoluteFill style={{ opacity: o * inn, perspective: 1600, filter: inn < 1 ? `blur(${(1 - inn) * 14}px) brightness(${0.4 + 0.6 * inn})` : undefined, transform: inn < 1 ? `scale(${1 + 0.12 * (1 - inn)})` : undefined }}>
      <AbsoluteFill
        style={{
          transform: `translate(${sx}px, 0) translateZ(${-900 * back}px) rotateY(${18 * back}deg) scale(${1 - 0.25 * back})`,
          borderRadius: 30 * back,
          overflow: "hidden",
          boxShadow: back > 0 ? "0 40px 120px rgba(0,0,0,0.6)" : undefined,
          filter: `grayscale(${desat}) brightness(${1 - 0.35 * desat}) contrast(${1 + 0.15 * desat}) blur(${back * 10}px)`,
        }}
      >
        <AbsoluteFill style={{ transform: `scale(${zoom})` }}>
          {/* congelado = imagem fixa do quadro (o <Freeze> em volta do vídeo travava a prévia ao saltar para cá) */}
          {frozen && still ? <Img src={staticFile(still)} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Clip src={src} from={from} rate={rate} />}
        </AbsoluteFill>
        <AbsoluteFill style={{ background: `radial-gradient(ellipse at center, rgba(5,4,10,0) 40%, rgba(5,4,10,${vig}) 100%)` }} />
        {frozen ? <AbsoluteFill style={{ backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0 2px, rgba(0,0,0,0) 2px 5px)", opacity: desat }} /> : null}
      </AbsoluteFill>
      {knows.map((k, i) => {
        if (f < k.at) return null;
        const p = lerp(f, k.at, k.at + 8, 0, 1, OUT);
        const newer = knows.filter((q, j) => j > i && f >= q.at).length;
        const out = lerp(f, kEnd - 8, kEnd, 1, 0, C);
        return (
          <div key={i} style={{ position: "absolute", left: 110, top: 330 + i * 120, fontFamily: FONT, fontWeight: 800, fontSize: 104, letterSpacing: -3, color: HL.text, opacity: p * out * (newer ? 0.32 : 1), transform: `translateX(${(1 - p) * -40}px) scale(${1 + (1 - p) * 0.25})`, transformOrigin: "0 50%", textShadow: "0 10px 60px rgba(0,0,0,0.8)" }}>
            {k.w}
          </div>
        );
      })}
      <div style={{ position: "absolute", left: 110, bottom: 140, fontFamily: FONT, fontWeight: 800, fontSize: 112, letterSpacing: -4, color: HL.text, opacity: tp, transform: `translateY(${(1 - tp) * 30}px)`, textShadow: "0 10px 60px rgba(0,0,0,0.75)" }}>{title}</div>
      {frozen ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 300, display: "flex", flexDirection: "column", alignItems: "center", gap: 34, opacity: 1 - back, transform: `scale(${wp})` }}>
          <div style={{ display: "flex", gap: 36 }}>
            <div style={{ width: 56, height: 190, borderRadius: 10, background: HL.text, boxShadow: "0 0 50px rgba(255,255,255,0.4)" }} />
            <div style={{ width: 56, height: 190, borderRadius: 10, background: HL.text, boxShadow: "0 0 50px rgba(255,255,255,0.4)" }} />
          </div>
          <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 130, letterSpacing: -4, color: HL.text, textShadow: "0 10px 60px rgba(0,0,0,0.8)" }}>{word}</div>
          <div style={{ fontFamily: MONO, fontSize: 28, letterSpacing: 10, textTransform: "uppercase", color: HL.orange, opacity: sp }}>{sub}</div>
        </div>
      ) : null}
      <AbsoluteFill style={{ background: "#fff3e2", opacity: frozen ? flash : 0, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// FIM DE BLOCO (lane 1): a tela escurece devagar a partir de `darkAt`; em `hitAt` flash curto,
// onda de choque e fica preto (gancho para a próxima parte).
// ---------------------------------------------------------------------------------------------
export const HLDarkHit: React.FC<{ life: number; darkAt?: number; darkEndAt?: number; hitAt: number; clearAt?: number }> = ({ life, darkAt = 0, darkEndAt, hitAt, clearAt }) => {
  // `clearAt`: depois do impacto o preto se abre (revela o bloco seguinte) até o fim da cena
  const f = useCurrentFrame();
  const clear = clearAt !== undefined ? lerp(f, Math.max(clearAt, hitAt), life, 0, 1, OUT) : 0; // nunca abre antes do golpe (senão o jogo de trás aparece)
  const dark = lerp(f, darkAt, darkEndAt ?? hitAt, 0, 1, E(Easing.inOut(Easing.quad))); // fecha TOTAL (o gameplay não pode vazar)
  const after = f - hitAt;
  const flash = after >= 0 ? interpolate(after, [0, 1, 10], [0.85, 0.6, 0], C) : 0;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill style={{ background: "#05040a", opacity: (after >= 0 ? 1 : dark) * (1 - clear) }} />
      <AbsoluteFill style={{ background: "#fff3e2", opacity: flash }} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// FENDA (lane 2, no escuro): uma linha vertical de luz verde-azulada nasce no centro, tremula e alarga
// devagar, com partículas finas sendo puxadas para ela; em `hitAt` ela se ABRE (rasga a tela em flash)
// e some. Sem anéis nem raios em volta.
// ---------------------------------------------------------------------------------------------
export const HLRiftHit: React.FC<{ life: number; hitAt: number }> = ({ life, hitAt }) => {
  const f = useCurrentFrame();
  void life;
  const b = interpolate(f, [0, hitAt], [0, 1], { ...C, easing: Easing.in(Easing.cubic) });
  const after = f - hitAt;
  const open = after >= 0 ? interpolate(after, [0, 8], [0, 1], { ...C, easing: Easing.out(Easing.cubic) }) : 0;
  const fade = after >= 0 ? interpolate(after, [4, 22], [1, 0], C) : 1;
  const flick = 0.82 + 0.18 * Math.sin(f * 1.7) * Math.sin(f * 0.53);
  const w = 2 + 26 * b * b + 2100 * open; // largura da fenda
  const h = 160 + 900 * b + 300 * open;
  const glow = 0.35 + 0.65 * b;
  const motes = Array.from({ length: 34 }).map((_, k) => {
    const side = k % 2 ? 1 : -1;
    const ph = (f * (0.008 + 0.022 * b) + rnd(k + 5)) % 1; // anda para a fenda
    const x0 = 960 + side * (180 + rnd(k + 9) * 620);
    const y = 540 + (rnd(k + 13) - 0.5) * 760 * (1 - 0.4 * ph);
    const x = x0 + (960 - x0) * ph;
    return { x, y, o: b * Math.sin(ph * Math.PI) * 0.9, s: 1.5 + rnd(k + 17) * 2.5 };
  });
  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity: fade }}>
      {after < 0
        ? motes.map((p, k) => <div key={k} style={{ position: "absolute", left: p.x, top: p.y, width: p.s, height: p.s, borderRadius: "50%", background: "#aaffe6", boxShadow: "0 0 8px #5fe0c4", opacity: p.o }} />)
        : null}
      {/* brilho difuso em volta */}
      <div style={{ position: "absolute", left: 960 - 520, top: 540 - 520, width: 1040, height: 1040, borderRadius: "50%", background: "radial-gradient(closest-side, rgba(95,224,196,0.28), rgba(95,224,196,0))", opacity: glow * flick * (1 - open) }} />
      {/* a fenda */}
      <div
        style={{
          position: "absolute",
          left: 960 - w / 2,
          top: 540 - h / 2,
          width: w,
          height: h,
          borderRadius: open > 0 ? 0 : w,
          background: open > 0 ? "linear-gradient(90deg, rgba(200,255,240,0), #f2fffb 30%, #f2fffb 70%, rgba(200,255,240,0))" : "linear-gradient(180deg, rgba(170,255,230,0) 0%, #e9fff8 30%, #e9fff8 70%, rgba(170,255,230,0) 100%)",
          boxShadow: `0 0 ${30 + 60 * b}px ${8 + 20 * b}px rgba(95,224,196,${0.55 * flick}), 0 0 ${140 * b}px ${30 * b}px rgba(60,170,255,${0.3 * b})`,
          opacity: Math.min(1, 0.4 + b) * flick,
        }}
      />
    </AbsoluteFill>
  );
};
