import React from "react";
import { continueRender, delayRender, Easing, interpolate, staticFile, useCurrentFrame } from "remotion";
import { FONT } from "./overlays";

// Legenda do estilo "ad" (captions.style = "ad" no edit.json) e as cores e a fonte serifada que ela usa.
// Faz parte do motor: o EditRenderer usa direto. As cenas de anúncio (cenas-anuncio.tsx) importam daqui.

const fontHandle = delayRender("Bodoni Moda");
const bodoni = new FontFace("Bodoni Moda", `url('${staticFile("fonts/bodoni-moda-italic-latin.woff2")}') format('woff2')`, { style: "italic" });
bodoni
  .load()
  .then((f) => {
    document.fonts.add(f);
    continueRender(fontHandle);
  })
  .catch(() => continueRender(fontHandle));

export const SERIF = "'Bodoni Moda', 'Didot', Georgia, serif";
export const AD = {
  bg0: "#140f0d",
  bg1: "#2a1e1a",
  skin: "#E8C8B8",
  champagne: "#F4E7DD",
  mute: "rgba(244,231,221,0.62)",
  line: "rgba(244,231,221,0.16)",
  glass: "rgba(255,244,236,0.07)",
  red: "#D82810",
};
const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
const eout = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });

// ---------- legenda de anúncio (substitui a SeamCaptions quando captions.style = "ad") ----------
type AdWord = { word: string; start: number; end: number };
export const AdCaptions: React.FC<{ words: AdWord[]; hot?: string[]; y?: number; size?: number; groupSize?: number; fps: number; variant?: string }> = ({ words, hot = [], y = 1590, size = 70, groupSize = 3, fps, variant = "serif" }) => {
  if (variant === "none") return null;
  if (variant !== "serif") return <AdCaptionsAlt words={words} y={y} size={size} groupSize={groupSize} fps={fps} variant={variant} />;
  const f = useCurrentFrame();
  const t = f / fps;
  const groups: AdWord[][] = [];
  let cur: AdWord[] = [];
  for (const w of words) {
    cur.push(w);
    if (cur.length >= groupSize || /[.?!,:]$/.test(w.word.trim())) {
      groups.push(cur);
      cur = [];
    }
  }
  if (cur.length) groups.push(cur);
  const win = groups.map((g, k) => {
    const s0 = g[0].start - 0.04;
    const next = k + 1 < groups.length ? groups[k + 1][0].start - 0.04 : Infinity;
    return [s0, Math.min(g[g.length - 1].end + 0.3, next)] as const;
  });
  const gi = win.findIndex(([a, b]) => t >= a && t < b);
  if (gi < 0) return null;
  const g = groups[gi];
  const k = eout(t * fps, win[gi][0] * fps, win[gi][0] * fps + 5);
  const hotSet = new Set(hot);
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: y - size * 0.6, display: "flex", justifyContent: "center", flexWrap: "wrap", columnGap: size * 0.26, opacity: k, transform: `translate3d(0, ${((1 - k) * 18).toFixed(2)}px, 0)`, filter: `blur(${((1 - k) * 6).toFixed(2)}px)` }}>
      {g.map((w, i) => {
        const clean = w.word.replace(/[.,!?;:"“”]/g, "");
        const isHot = hotSet.has(clean);
        const on = t >= w.start - 0.02;
        const now = on && t < w.end + 0.05;
        const pop = now ? 1 + 0.07 * (1 - eout(t * fps, w.start * fps, w.start * fps + 5)) : 1;
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              fontFamily: isHot ? SERIF : FONT,
              fontStyle: isHot ? "italic" : "normal",
              fontWeight: isHot ? 600 : 800,
              fontSize: isHot ? size * 1.12 : size,
              letterSpacing: isHot ? -0.5 : -1.2,
              lineHeight: 1.12,
              color: now ? AD.skin : on ? "#ffffff" : "rgba(255,255,255,0.5)",
              transform: `scale(${pop.toFixed(3)})`,
              textShadow: "0 4px 22px rgba(0,0,0,0.75), 0 2px 4px rgba(0,0,0,0.85)",
            }}
          >
            {w.word.trim()}
          </span>
        );
      })}
    </div>
  );
};

// Variantes de legenda para escolha do usuário (2026-10-07):
//  "destaque" = branco em caixa alta, a palavra da vez numa pílula cor de pele (estilo anúncio/CapCut)
//  "minimal"  = frase curta, semibold, sem cor, sombra suave (estilo Apple)
//  "cartao"   = cartão claro arredondado com texto escuro (estilo legenda do iOS)
const AdCaptionsAlt: React.FC<{ words: AdWord[]; y: number; size: number; groupSize: number; fps: number; variant: string }> = ({ words, y, size, groupSize, fps, variant }) => {
  const f = useCurrentFrame();
  const t = f / fps;
  const gs = variant === "minimal" ? Math.max(groupSize, 5) : groupSize;
  const groups: AdWord[][] = [];
  let cur: AdWord[] = [];
  for (const w of words) {
    cur.push(w);
    if (cur.length >= gs || /[.?!,:]$/.test(w.word.trim())) {
      groups.push(cur);
      cur = [];
    }
  }
  if (cur.length) groups.push(cur);
  const win = groups.map((g, k) => {
    const next = k + 1 < groups.length ? groups[k + 1][0].start - 0.04 : Infinity;
    return [g[0].start - 0.04, Math.min(g[g.length - 1].end + 0.3, next)] as const;
  });
  const gi = win.findIndex(([a, b]) => t >= a && t < b);
  if (gi < 0) return null;
  const g = groups[gi];
  const k = eout(t * fps, win[gi][0] * fps, win[gi][0] * fps + 4);
  if (variant === "destaque") {
    const s = size * 0.95;
    return (
      <div style={{ position: "absolute", left: 50, right: 50, top: y - s * 0.6, display: "flex", justifyContent: "center", flexWrap: "wrap", columnGap: s * 0.18, opacity: k, transform: `scale(${(0.94 + 0.06 * k).toFixed(3)})` }}>
        {g.map((w, i) => {
          const now = t >= w.start - 0.02 && t < w.end + 0.05;
          return (
            <span key={i} style={{ display: "inline-block", padding: `${s * 0.04}px ${s * 0.16}px`, borderRadius: s * 0.2, background: now ? AD.skin : "transparent", color: now ? AD.bg0 : "#fff", fontFamily: FONT, fontWeight: 900, fontSize: s, letterSpacing: -0.5, textTransform: "uppercase", textShadow: now ? "none" : "0 3px 14px rgba(0,0,0,0.8), 0 2px 3px rgba(0,0,0,0.9)" }}>
              {w.word.trim()}
            </span>
          );
        })}
      </div>
    );
  }
  if (variant === "cartao") {
    return (
      <div style={{ position: "absolute", left: 0, right: 0, top: y - size * 0.7, display: "flex", justifyContent: "center", opacity: k, transform: `translate3d(0, ${((1 - k) * 12).toFixed(1)}px, 0)` }}>
        <div style={{ maxWidth: 940, padding: `${size * 0.22}px ${size * 0.45}px`, borderRadius: size * 0.42, background: "rgba(248,240,234,0.94)", boxShadow: "0 14px 40px rgba(0,0,0,0.35)", display: "flex", flexWrap: "wrap", justifyContent: "center", columnGap: size * 0.24 }}>
          {g.map((w, i) => {
            const on = t >= w.start - 0.02;
            return (
              <span key={i} style={{ fontFamily: FONT, fontWeight: 700, fontSize: size * 0.82, letterSpacing: -0.6, color: on ? AD.bg0 : "rgba(20,15,13,0.35)" }}>
                {w.word.trim()}
              </span>
            );
          })}
        </div>
      </div>
    );
  }
  // minimal
  return (
    <div style={{ position: "absolute", left: 80, right: 80, top: y - size * 0.4, display: "flex", justifyContent: "center", flexWrap: "wrap", columnGap: size * 0.2, opacity: k }}>
      {g.map((w, i) => (
        <span key={i} style={{ fontFamily: FONT, fontWeight: 600, fontSize: size * 0.72, letterSpacing: -0.4, color: "#fff", opacity: t >= w.start - 0.02 ? 1 : 0.55, textShadow: "0 2px 16px rgba(0,0,0,0.7), 0 1px 2px rgba(0,0,0,0.8)" }}>
          {w.word.trim()}
        </span>
      ))}
    </div>
  );
};
