import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { FONT } from "./overlays";
import { ZALE } from "./theme";
import { Handle, SEAM, StageBg } from "./palco";

// LAYOUT VIVO (pedido do usuário em 2026-09-28: "edição mais dinâmica, inovar"). A divisão da tela muda com a fala:
//   split = palco em cima, apresentador embaixo (o Palco de sempre)
//   full  = apresentador em tela cheia; as cenas desenham POR CIMA dele, sem fundo (tipografia cinética)
//   pip   = a cena ocupa a tela (palco ampliado e centralizado) e o apresentador vira uma bolha redonda no canto
// `layouts` do edit.json: [{start, end, mode}] em segundos; fora deles é split. A troca leva ~0,4 s, centrada na
// borda do trecho, então dois trechos colados passam direto de um modo ao outro.
export type LayoutMode = "split" | "full" | "pip";
export type LayoutSeg = { start: number; end: number; mode: Exclude<LayoutMode, "split"> };

type Geo = { px: number; py: number; pw: number; ph: number; pr: number; il: number; it: number; is: number; zoomK: number; bg: number; sy: number; ss: number; capY: number };
const BUBBLE = 340;
const geoOf = (mode: LayoutMode, fitTop: number): Geo => {
  if (mode === "full") return { px: 0, py: 0, pw: 1080, ph: 1920, pr: 0, il: 0, it: 0, is: 1, zoomK: 1, bg: 0, sy: 0, ss: 1, capY: 1440 };
  if (mode === "pip") {
    const s = 0.55;
    // rosto no centro da bolha (cabeça da gravação ~ y fitTop+420); `it` é em pixels da gravação (vezes `is` na tela)
    const cy = fitTop + 420;
    return { px: 700, py: 1480, pw: BUBBLE, ph: BUBBLE, pr: BUBBLE / 2, il: BUBBLE / 2 - 540 * s, it: BUBBLE / (2 * s) - cy, is: s, zoomK: 0, bg: 1, sy: 250, ss: 1.12, capY: 1400 };
  }
  return { px: 0, py: SEAM, pw: 1080, ph: 1920 - SEAM, pr: 0, il: 0, it: -fitTop, is: 1, zoomK: 1, bg: 1, sy: 0, ss: 1, capY: SEAM };
};
const mix = (a: Geo, b: Geo, w: number): Geo => {
  const o = { ...a };
  for (const k of Object.keys(a) as (keyof Geo)[]) o[k] = a[k] + (b[k] - a[k]) * w;
  return o;
};

// peso de cada trecho no quadro `t` (s): sobe de start-0,2 a start+0,2 e desce de end-0,2 a end+0,2
const HALF = 0.2;
export const layoutAt = (segs: LayoutSeg[] | undefined, t: number, fitTop: number) => {
  const split = geoOf("split", fitTop);
  let g = split;
  let top: LayoutMode = "split";
  let wTop = 0;
  for (const s of segs ?? []) {
    const e = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const, easing: Easing.inOut(Easing.cubic) };
    const w = Math.min(interpolate(t, [s.start - HALF, s.start + HALF], [0, 1], e), interpolate(t, [s.end - HALF, s.end + HALF], [1, 0], e));
    if (w <= 0) continue;
    g = mix(g, geoOf(s.mode, fitTop), w);
    if (w > wTop) {
      wTop = w;
      top = s.mode;
    }
  }
  return { g, mode: wTop > 0.5 ? top : ("split" as LayoutMode) };
};

export const LiveLayout: React.FC<{
  me: React.ReactNode;
  meBg?: React.ReactNode; // aceito para ter a mesma assinatura do PalcoLayout (sem uso: o vídeo sempre ocupa a largura toda)
  fit?: { scale: number; top: number };
  zoom?: number;
  handle?: string;
  layouts?: LayoutSeg[];
  fps: number;
  children?: React.ReactNode;
}> = ({ me, fit, zoom = 1, handle, layouts, fps, children }) => {
  const f = useCurrentFrame();
  const fitTop = fit?.top ?? 0;
  const { g, mode } = layoutAt(layouts, f / fps, fitTop);
  const z = 1 + (zoom - 1) * g.zoomK;
  const presenter = (
    <div
      style={{
        position: "absolute",
        left: g.px,
        top: g.py,
        width: g.pw,
        height: g.ph,
        borderRadius: g.pr,
        overflow: "hidden",
        zIndex: mode === "pip" ? 5 : 1,
        boxShadow: g.pr > 4 ? `0 0 0 ${Math.min(8, g.pr / 20)}px ${ZALE.white}, 0 20px 50px rgba(0,0,0,0.6)` : "0 0 60px rgba(0,0,0,0.6)",
      }}
    >
      <div style={{ position: "absolute", left: g.il, top: g.it * g.is, width: 1080 * g.is, height: 1920 * g.is, transform: `scale(${z})`, transformOrigin: `50% ${((fitTop + 420) / 1920) * 100}%` }}>{me}</div>
    </div>
  );
  return (
    <AbsoluteFill style={{ background: ZALE.ink, fontFamily: FONT }}>
      <AbsoluteFill style={{ opacity: g.bg }}>
        <StageBg h={SEAM + (1920 - SEAM) * Math.min(1, g.sy / 250)} />
      </AbsoluteFill>
      {presenter}
      <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: SEAM, zIndex: 3, overflow: g.ss > 1.001 || g.bg < 0.999 ? "visible" : "hidden", transformOrigin: "50% 0%", transform: `translate3d(0, ${g.sy}px, 0) scale(${g.ss})` }}>
        {handle ? <div style={{ opacity: 1 - Math.min(1, g.sy / 120) }}><Handle handle={handle} /></div> : null}
        {children}
      </div>
    </AbsoluteFill>
  );
};

// altura da legenda no quadro atual (acompanha o layout)
export const useCaptionY = (layouts: LayoutSeg[] | undefined, fps: number, fitTop: number, base: number) => {
  const f = useCurrentFrame();
  if (!layouts?.length) return base;
  const { g } = layoutAt(layouts, f / fps, fitTop);
  return base + (g.capY - SEAM);
};
