import React from "react";
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont as loadFredoka } from "@remotion/google-fonts/Fredoka";

const { fontFamily: FREDOKA } = loadFredoka("normal", { weights: ["600"], subsets: ["latin", "latin-ext"] });

// Legenda no estilo do canal Laestro (captions.style = "laestro"), dos Shorts de meme de Deadlock (28/10):
// pedaços de até 3 palavras no meio da tela, fonte arredondada amarela com contorno marrom, palavras de `hot`
// em CAIXA ALTA e comentário entre parênteses (`notes`) em letra menor embaixo. Nas tomadas em "card"
// (fundo cinza com a foto pequena) a legenda sobe para cima da foto (`cardSpans`).
type W = { word: string; start: number; end: number };
type Note = { start: number; end: number; text: string };
const core = (s: string) => s.replace(/[^\wÀ-ú]/g, "").toLowerCase();

export const LaestroCaptions: React.FC<{
  words: W[];
  hot?: string[];
  notes?: Note[];
  cardSpans?: [number, number][];
  y?: number;
  cardY?: number;
  size?: number;
  // margens laterais (TikTok: a coluna de curtir/comentar ocupa ~150 px à direita)
  padL?: number;
  padR?: number;
  // "gta" (GTA 6 no PC v3, 11/11): legenda de jogo do GTA — branca com sombra, destaque em amarelo, sem caixa alta
  variant?: string;
}> = ({ words, hot = [], notes = [], cardSpans = [], y = 960, cardY = 560, size = 66, padL = 60, padR = 60, variant }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  const hotSet = new Set(hot.map((h) => core(h)));
  const groups: { ws: W[]; start: number; end: number }[] = [];
  let pend: W[] = [];
  const flush = () => {
    if (pend.length) groups.push({ ws: pend, start: pend[0].start, end: pend[pend.length - 1].end });
    pend = [];
  };
  for (const w of words) {
    pend.push(w);
    const len = pend.map((p) => p.word).join(" ").length;
    if (/[.,;:?!…]$/.test(w.word) || pend.length >= 3 || len >= 18) flush();
  }
  flush();
  // cada pedaço fica até o próximo começar (ou até 0,2 s depois de acabar: nas transições sem fala a legenda não fica por cima do meme)
  const g = groups.findIndex((gr, i) => t >= gr.start - 0.03 && t < Math.min(groups[i + 1]?.start ?? Infinity, gr.end + 0.2));
  const inCard = cardSpans.some(([a, b]) => t >= a && t < b);
  const yy = inCard ? cardY : y;
  const note = notes.find((n) => t >= n.start && t < n.end);
  const stroke: React.CSSProperties = {
    fontFamily: FREDOKA,
    fontWeight: 600,
    color: "#ffc425",
    WebkitTextStroke: `${Math.round(size * 0.16)}px #5b2f00`,
    paintOrder: "stroke fill",
    textShadow: "0 5px 0 #3a1d00, 0 0 18px rgba(0,0,0,0.35)",
    lineHeight: 1.05,
  };
  const gta = variant === "gta";
  if (gta) {
    Object.assign(stroke, { fontFamily: "'Arial', 'Helvetica Neue', sans-serif", fontWeight: 800, color: "#f4f4f4", WebkitTextStroke: `${Math.round(size * 0.07)}px #000`, textShadow: "0 3px 0 #000, 0 0 14px rgba(0,0,0,0.85)" });
  }
  if (g < 0 && !note) return null;
  const gr = groups[g];
  const pop = gr ? interpolate(t - gr.start, [-0.03, 0.09], [0.86, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.back(2)) }) : 1;
  return (
    <div style={{ position: "absolute", left: padL, right: padR, top: yy, transform: "translateY(-50%)", textAlign: "center" }}>
      {gr ? (
        <div style={{ ...stroke, fontSize: size, transform: `scale(${pop})` }}>
          {gr.ws.map((w, i) => {
            const hotW = hotSet.has(core(w.word));
            return (
              <span key={i} style={hotW ? (gta ? { color: "#f2c94c" } : { letterSpacing: 1 }) : undefined}>
                {i ? " " : ""}
                {(hotW && !gta ? w.word.toUpperCase() : w.word).replace(/[.,;:]$/, "")}
              </span>
            );
          })}
        </div>
      ) : null}
      {note ? <div style={{ ...stroke, fontSize: size * 0.6, color: "#fff4d6", WebkitTextStroke: `${Math.round(size * 0.1)}px #3a1d00`, marginTop: 6 }}>{note.text}</div> : null}
    </div>
  );
};
