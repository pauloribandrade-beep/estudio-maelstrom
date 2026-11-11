import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont as loadAnton } from "@remotion/google-fonts/Anton";

const { fontFamily: ANTON } = loadAnton();

// Cenas de "edit" de música (cortes na batida, tela cheia).
// Flash: clarão branco na batida, cobrindo a tela inteira (1080x1920). No layout "full" o contêiner
// das cenas tem só a altura do palco (980) com overflow visível, por isso a altura fixa aqui.
// `len` em quadros (a chave `dur` o registry converteria de segundos)
export const Flash: React.FC<{ life: number; peak?: number; len?: number; color?: string }> = ({ peak = 0.85, len = 7, color = "#fff" }) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [0, 1, len], [peak, peak, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  if (o <= 0.001) return null;
  return <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, background: color, opacity: o, pointerEvents: "none" }} />;
};

// Legenda de edit (captions.style = "edit"): UMA palavra por vez (palavra curta gruda na seguinte),
// fonte condensada pesada, contorno preto grosso, entra com soco (escala 1.7 -> 1 com quique) e
// inclinação própria. Palavras de `hot`: maiores, coloridas e tremendo enquanto ficam na tela.
type W = { word: string; start: number; end: number };
const clean = (s: string) => s.replace(/[.,!?;:"“”…]/g, "").trim();
const rnd = (i: number) => {
  const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

export const EditCaptions: React.FC<{ words: W[]; hot?: string[]; y?: number; size?: number; color?: string; hotColor?: string }> = ({
  words,
  hot = [],
  y = 1250,
  size = 150,
  color = "#ffffff",
  hotColor = "#ffe100",
}) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  // grupos: palavra de até 2 letras ("se", "o", "é", "no") vai junto com a seguinte
  const groups: { text: string; start: number; end: number; hot: boolean }[] = [];
  const hotSet = new Set(hot.map((h) => h.toLowerCase()));
  let pend: W[] = [];
  for (const w of words) {
    pend.push(w);
    const c = clean(w.word);
    if (c.length <= 2 && pend.length < 3) continue;
    const text = pend.map((p) => clean(p.word)).join(" ");
    groups.push({ text, start: pend[0].start, end: w.end, hot: pend.some((p) => hotSet.has(clean(p.word).toLowerCase())) });
    pend = [];
  }
  if (pend.length) groups.push({ text: pend.map((p) => clean(p.word)).join(" "), start: pend[0].start, end: pend[pend.length - 1].end, hot: false });
  let k = -1;
  for (let i = 0; i < groups.length; i++) {
    const next = i + 1 < groups.length ? groups[i + 1].start : Infinity;
    // fica até a próxima entrar (no máximo 0,6 s depois de dita)
    if (t >= groups[i].start - 0.03 && t < Math.min(next - 0.03, groups[i].end + 0.6)) k = i;
  }
  if (k < 0) return null;
  const g = groups[k];
  const lf = Math.round((t - g.start) * fps);
  const pop = interpolate(lf, [0, 3, 5, 7], [1.75, 0.92, 1.04, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const rot = (rnd(k) - 0.5) * 9;
  const shake = g.hot ? { x: Math.sin(f * 2.3) * 7 + Math.sin(f * 5.1) * 4, y: Math.cos(f * 2.9) * 6 } : { x: 0, y: 0 };
  // Anton ~0,5 em por letra: cabe ~13 letras em 1000 px no tamanho cheio; acima disso encolhe
  const fs = (g.hot ? size * 1.28 : size) * Math.min(1, (g.hot ? 10 : 13) / g.text.length);
  const fill = g.hot ? hotColor : color;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        width: 1080,
        top: y - fs * 0.6,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          fontFamily: ANTON,
          fontSize: Math.max(90, fs),
          lineHeight: 1,
          textTransform: "uppercase",
          letterSpacing: 2,
          color: fill,
          WebkitTextStroke: `${Math.round(fs * 0.1)}px #000`,
          paintOrder: "stroke fill",
          textShadow: `0 10px 0 #000, 0 0 40px rgba(0,0,0,0.65)${g.hot ? `, 0 0 50px ${hotColor}66` : ""}`,
          transform: `translate(${shake.x}px, ${shake.y}px) rotate(${rot.toFixed(2)}deg) scale(${pop})`,
          whiteSpace: "nowrap",
          maxWidth: 1000,
          textAlign: "center",
        }}
      >
        {g.text}
      </div>
    </div>
  );
};
