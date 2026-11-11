import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { MONO } from "./overlays";
import { C, lerp, rnd } from "./hl3";

// Virada 1D → 2A (2026-10-01): fenda Xen com a sombra do G-Man saindo, e o título de bloco "Gameplay".
// Tempos em QUADROS relativos à cena.

// ---------------------------------------------------------------------------------------------
// FENDA + G-MAN (lane 2, no escuro): fio de luz com bordas irregulares e filamentos elétricos; alarga,
// abre em forma de olho e a SILHUETA de terno com a maleta (sem rosto: só o recorte, com a luz da fenda
// contornando) atravessa a borda, como no logo do Portal 2. Em `hitAt` a fenda rasga a tela em flash.
// ---------------------------------------------------------------------------------------------
const GMAN =
  // cabeça, pescoço, paletó, braços, pernas em passo, sapatos (caixa 200x520)
  "M100 18 C116 18 127 32 127 52 C127 72 115 86 100 86 C85 86 73 72 73 52 C73 32 84 18 100 18 Z " +
  "M90 84 L110 84 L112 100 L88 100 Z " +
  "M56 104 C70 96 130 96 144 104 L150 150 L132 272 L68 272 L50 150 Z " +
  "M50 110 C44 150 42 210 44 266 L60 268 C62 220 66 170 70 128 Z " +
  "M150 110 C158 150 162 205 160 262 L144 264 C142 220 138 170 132 128 Z " +
  "M72 270 L98 270 L86 400 L74 504 L56 504 L62 400 Z " +
  "M102 270 L128 270 L136 390 L150 500 L132 504 L116 400 Z " +
  "M50 500 L80 500 L82 512 L44 512 Z M128 498 L158 498 L164 510 L128 510 Z " +
  // maleta na mão direita, com a alça
  "M146 262 L206 262 L208 312 L144 312 Z M164 262 L164 252 L188 252 L188 262 L182 262 L182 257 L170 257 L170 262 Z";

export const HLRiftGman: React.FC<{ life: number; hitAt: number }> = ({ life, hitAt }) => {
  const f = useCurrentFrame();
  void life;
  const after = f - hitAt;
  const grow = interpolate(f, [0, hitAt * 0.45], [0, 1], { ...C, easing: Easing.out(Easing.cubic) }); // o fio cresce
  const widen = interpolate(f, [hitAt * 0.45, hitAt * 0.68], [0, 1], { ...C, easing: Easing.inOut(Easing.cubic) }); // abre em olho
  const walk = interpolate(f, [hitAt * 0.6, hitAt - 4], [0, 1], { ...C, easing: Easing.out(Easing.quad) }); // a silhueta sai
  const tear = after >= 0 ? interpolate(after, [0, 9], [0, 1], { ...C, easing: Easing.out(Easing.cubic) }) : 0;
  const fade = after >= 0 ? interpolate(after, [5, 24], [1, 0], C) : 1;
  const flick = 0.85 + 0.15 * Math.sin(f * 1.9) * Math.sin(f * 0.61);
  const H = 120 + 760 * grow;
  const W = 6 + 230 * widen;
  const cx = 960;
  const top = 540 - H / 2;
  const seed = Math.floor(f / 2); // borda e filamentos mudam a cada 2 quadros
  const N = 18;
  const pts = (side: number) =>
    Array.from({ length: N + 1 }).map((_, i) => {
      const t = i / N;
      const lens = Math.sin(t * Math.PI);
      const j = (rnd(seed * 31 + i * 7 + (side > 0 ? 3 : 0)) - 0.5) * (4 + 10 * widen);
      return [cx + side * (W / 2) * lens + j, top + t * H] as const;
    });
  const right = pts(1);
  const left = pts(-1).reverse();
  const lensPath = "M " + [...right, ...left].map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(" L ") + " Z";
  const fil = Array.from({ length: 7 }).map((_, k) => {
    const t = 0.12 + rnd(seed * 5 + k) * 0.76;
    const side = rnd(seed * 9 + k) > 0.5 ? 1 : -1;
    let px = cx + side * (W / 2) * Math.sin(t * Math.PI);
    let py = top + t * H;
    let d = `M ${px.toFixed(1)} ${py.toFixed(1)}`;
    for (let s = 0; s < 4; s++) {
      px += side * (8 + rnd(seed + k * 13 + s) * 26);
      py += (rnd(seed + k * 17 + s) - 0.5) * 34;
      d += ` L ${px.toFixed(1)} ${py.toFixed(1)}`;
    }
    return d;
  });
  // a silhueta entra "de dentro" da fenda e atravessa a borda direita; o que ainda está atrás da borda não aparece
  const gx = cx - 70 + 200 * walk;
  const gTop = 540 - 250;
  const edgeX = cx + (W / 2) * 0.92;
  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity: fade }}>
      <div style={{ position: "absolute", left: cx - 600, top: 540 - 600, width: 1200, height: 1200, borderRadius: "50%", background: "radial-gradient(closest-side, rgba(95,224,196,0.25), rgba(95,224,196,0))", opacity: (0.4 + 0.6 * grow) * flick }} />
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <defs>
          <radialGradient id="riftcore" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="45%" stopColor="#d8fff4" />
            <stop offset="100%" stopColor="#5fe0c4" />
          </radialGradient>
          <filter id="riftglow" x="-80%" y="-20%" width="260%" height="140%">
            <feGaussianBlur stdDeviation={10 + 10 * widen} result="g" />
            <feMerge>
              <feMergeNode in="g" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path d={lensPath} fill="url(#riftcore)" opacity={(0.55 + 0.45 * grow) * flick} filter="url(#riftglow)" />
        {fil.map((d, k) => (
          <path key={k} d={d} fill="none" stroke="#c9fff0" strokeWidth={1.6} opacity={grow * (0.35 + 0.5 * rnd(seed + k))} style={{ filter: "drop-shadow(0 0 6px #5fe0c4)" }} />
        ))}
      </svg>
      {walk > 0 ? (
        <div style={{ position: "absolute", inset: 0, clipPath: `inset(0 0 0 ${edgeX}px)` }}>
          <svg
            width={220}
            height={520}
            viewBox="0 0 220 520"
            style={{ position: "absolute", left: gx - 100, top: gTop, overflow: "visible", filter: "drop-shadow(-3px 0 2px rgba(200,255,240,0.9)) drop-shadow(-12px 0 20px rgba(95,224,196,0.6))" }}
          >
            <path d={GMAN} fill="#04030a" />
          </svg>
        </div>
      ) : null}
      {after >= 0 ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 540 - 20 - 560 * tear,
            height: 40 + 1120 * tear,
            background: "linear-gradient(180deg, rgba(220,255,245,0), #f2fffb 25%, #f2fffb 75%, rgba(220,255,245,0))",
            opacity: 1 - interpolate(after, [6, 20], [0, 1], C),
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// TÍTULO DE BLOCO "Gameplay": decodifica letra a letra, brilho verde-azulado da fenda, linha de varredura
// e cantoneiras de HUD se desenhando em volta.
// ---------------------------------------------------------------------------------------------
const GL = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+=<>/λ";
export const HLTitleDecode: React.FC<{ life: number; title?: string; sub?: string; decodeDur?: number }> = ({ life, title = "Gameplay", sub = "", decodeDur = 34 }) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [0, 6, life - 12, life], [0, 1, 1, 0], C);
  const p = interpolate(f, [4, 4 + decodeDur], [0, 1], { ...C, easing: Easing.out(Easing.quad) });
  const txt = title
    .split("")
    .map((ch, i) => (p * title.length > i + 0.5 ? ch : GL[Math.floor(rnd(i * 17 + Math.floor(f / 2)) * GL.length)]))
    .join("");
  const br = interpolate(f, [10, 34], [0, 1], { ...C, easing: Easing.out(Easing.cubic) });
  const scan = interpolate(f % 70, [0, 70], [-0.1, 1.1]);
  const push = 1 + lerp(f, 0, life, 0, 0.05, C);
  const BW = 1180;
  const BH = 300;
  const L = 60 * br;
  const corner = (x: number, y: number, sx: number, sy: number) => <path d={`M ${x} ${y + sy * L} L ${x} ${y} L ${x + sx * L} ${y}`} fill="none" stroke="#7ef0d4" strokeWidth={3} opacity={0.9} />;
  return (
    <AbsoluteFill style={{ opacity: o, alignItems: "center", justifyContent: "center", transform: `scale(${push})` }}>
      <div style={{ position: "absolute", width: 1500, height: 700, borderRadius: "50%", background: "radial-gradient(closest-side, rgba(60,200,170,0.22), rgba(60,200,170,0))" }} />
      <svg width={BW} height={BH} viewBox={`0 0 ${BW} ${BH}`} style={{ position: "absolute", overflow: "visible" }}>
        {corner(0, 0, 1, 1)}
        {corner(BW, 0, -1, 1)}
        {corner(0, BH, 1, -1)}
        {corner(BW, BH, -1, -1)}
        <line x1={0} x2={BW} y1={BH * scan} y2={BH * scan} stroke="#7ef0d4" strokeWidth={1.5} opacity={0.35 * br} />
      </svg>
      <div style={{ position: "relative", fontFamily: MONO, fontWeight: 700, fontSize: 168, letterSpacing: 18, color: "#eafff8", textShadow: "0 0 24px rgba(126,240,212,0.8), 0 0 70px rgba(60,200,170,0.5)", textTransform: "uppercase" }}>{txt}</div>
      {sub ? <div style={{ position: "absolute", top: 540 + BH / 2 + 26, fontFamily: MONO, fontSize: 22, letterSpacing: 12, color: "rgba(126,240,212,0.8)", textTransform: "uppercase", opacity: br }}>{sub}</div> : null}
    </AbsoluteFill>
  );
};
