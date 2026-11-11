import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont as loadPixel } from "@remotion/google-fonts/Silkscreen";

const { fontFamily: PIXEL } = loadPixel("normal", { weights: ["700"], subsets: ["latin", "latin-ext"] });

// Legenda pixelada (captions.style = "pixel"), dos vídeos de curiosidade em 3D cartunizado (ref. @arturbuilder):
// UMA palavra por vez (palavra de até 2 letras gruda na seguinte), fonte de pixel amarela com contorno preto grosso,
// entra com um pulinho. Palavras de `hot` em vermelho.
type W = { word: string; start: number; end: number };
const clean = (s: string) => s.replace(/[.,;:"“”…]/g, "").trim();

export const PixelCaptions: React.FC<{ words: W[]; hot?: string[]; y?: number; size?: number; color?: string; hotColor?: string }> = ({
  words,
  hot = [],
  y = 1360,
  size = 96,
  color = "#ffd400",
  hotColor = "#ff4b4b",
}) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  const hotSet = new Set(hot.map((h) => h.toLowerCase()));
  const groups: { text: string; start: number; end: number; hot: boolean }[] = [];
  let pend: W[] = [];
  for (const w of words) {
    pend.push(w);
    if (clean(w.word).length <= 2 && pend.length < 3) continue;
    groups.push({ text: pend.map((p) => clean(p.word)).join(" "), start: pend[0].start, end: w.end, hot: pend.some((p) => hotSet.has(clean(p.word).toLowerCase())) });
    pend = [];
  }
  if (pend.length) groups.push({ text: pend.map((p) => clean(p.word)).join(" "), start: pend[0].start, end: pend[pend.length - 1].end, hot: false });
  let k = -1;
  for (let i = 0; i < groups.length; i++) {
    const next = i + 1 < groups.length ? groups[i + 1].start : Infinity;
    if (t >= groups[i].start - 0.03 && t < Math.min(next - 0.03, groups[i].end + 0.5)) k = i;
  }
  if (k < 0) return null;
  const g = groups[k];
  const lf = Math.round((t - g.start) * fps);
  const s = interpolate(lf, [0, 2, 4], [1.25, 0.95, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const up = interpolate(lf, [0, 3], [14, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  // Silkscreen ~0,8 em por letra: cabe ~11 letras em 960 px no tamanho cheio
  const fs = size * Math.min(1, 11 / g.text.length);
  return (
    <div style={{ position: "absolute", left: 40, right: 40, top: y - fs / 2 + up, textAlign: "center", pointerEvents: "none", transform: `scale(${s})` }}>
      <span style={{ fontFamily: PIXEL, fontWeight: 700, fontSize: fs, lineHeight: 1, color: g.hot ? hotColor : color, WebkitTextStroke: `${Math.round(fs / 6)}px #000`, paintOrder: "stroke fill", letterSpacing: 2, textTransform: "uppercase", filter: "drop-shadow(0 6px 0 #000)" }}>
        {g.text}
      </span>
    </div>
  );
};
