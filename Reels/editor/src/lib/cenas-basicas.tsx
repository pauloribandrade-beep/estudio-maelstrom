import React from "react";
import { AbsoluteFill, Easing, Img, OffthreadVideo, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { FONT } from "./overlays";
import { SAFE, ZALE } from "./theme";

// Componentes básicos (título, corte, notícia, CTA, tela dividida, legenda). Todos recebem `life` (frames de vida dentro
// da sua Sequence) e entram/saem sozinhos.

const env = (t: number, life: number, fps: number, outDur = 8) => {
  const enter = spring({ frame: t, fps, config: { damping: 15, stiffness: 170, mass: 0.7 } });
  const exit = interpolate(t, [life - outDur, life], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.cubic) });
  return { enter, a: t < 0 ? 0 : Math.min(enter, exit) };
};

// Título na tela dos primeiros segundos (o gancho escrito do método).
// Branco, forte, com a palavra-chave opcional sublinhada em vermelho.
export const TitleTop: React.FC<{ life: number; text: string; highlight?: string; y?: number; size?: number }> = ({
  life,
  text,
  highlight,
  y = SAFE.top + 40,
  size = 64,
}) => {
  const t = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { enter, a } = env(t, life, fps);
  const parts = highlight && text.includes(highlight) ? text.split(highlight) : [text];
  return (
    <div style={{ position: "absolute", left: SAFE.x0, right: 1080 - SAFE.x1, top: y, display: "flex", justifyContent: "center", opacity: a, transform: `translateY(${(1 - enter) * -24}px)` }}>
      <div
        style={{
          fontFamily: FONT,
          fontSize: size,
          fontWeight: 800,
          lineHeight: 1.12,
          letterSpacing: -1,
          color: ZALE.white,
          textAlign: "center",
          background: "rgba(20,20,20,0.82)",
          padding: "18px 28px",
          borderRadius: 22,
          boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
        }}
      >
        {parts.length === 2 ? (
          <>
            {parts[0]}
            <span style={{ boxShadow: `inset 0 -0.22em 0 ${ZALE.red}` }}>{highlight}</span>
            {parts[1]}
          </>
        ) : (
          text
        )}
      </div>
    </div>
  );
};

// A tela troca de você para outra coisa (foto, vídeo, animação) e volta.
// O áudio da sua fala continua por baixo. Entrada: corte seco com leve zoom
// (padrão) ou deslize. Imagens paradas ganham Ken Burns para nunca ficar
// estáticas (regra dos 5 s).
export const Cutaway: React.FC<{
  life: number;
  img?: string;
  video?: string;
  videoFrom?: number;
  children?: React.ReactNode;
  enter?: "cut" | "slide";
  kenBurns?: number;
  bg?: string;
  caption?: string;
}> = ({ life, img, video, videoFrom = 0, children, enter = "cut", kenBurns = 1.08, bg = ZALE.ink, caption }) => {
  const t = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inP = enter === "slide" ? spring({ frame: t, fps, config: { damping: 18, stiffness: 180 } }) : 1;
  const outA = interpolate(t, [life - 3, life], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const kb = interpolate(t, [0, life], [1, kenBurns], { extrapolateRight: "clamp" });
  const pop = enter === "cut" ? interpolate(t, [0, 6], [1.06, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }) : 1;
  return (
    <AbsoluteFill style={{ background: bg, opacity: outA, transform: `translateY(${(1 - inP) * 1920}px)` }}>
      <AbsoluteFill style={{ transform: `scale(${kb * pop})` }}>
        {img ? <Img src={staticFile(img)} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : null}
        {video ? <OffthreadVideo src={staticFile(video)} startFrom={Math.round(videoFrom * fps)} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : null}
        {children}
      </AbsoluteFill>
      {caption ? (
        <div style={{ position: "absolute", left: SAFE.x0, top: SAFE.top + 30, fontFamily: FONT, fontSize: 28, fontWeight: 600, color: ZALE.mute }}>{caption}</div>
      ) : null}
    </AbsoluteFill>
  );
};

// Card de manchete para hype: fonte + data + título. Genérico de propósito,
// não imita a identidade visual de nenhum veículo.
export const NewsCard: React.FC<{ life: number; source: string; date?: string; headline: string; x?: number; y?: number; w?: number }> = ({
  life,
  source,
  date,
  headline,
  x = SAFE.x0,
  y = 990,
  w = 870,
}) => {
  const t = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { enter, a } = env(t, life, fps);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        boxSizing: "border-box",
        background: ZALE.white,
        color: ZALE.ink,
        borderRadius: 22,
        padding: "26px 30px",
        fontFamily: FONT,
        boxShadow: "0 30px 80px rgba(0,0,0,0.35)",
        borderLeft: `10px solid ${ZALE.red}`,
        opacity: a,
        transform: `translateY(${(1 - enter) * 40}px) rotate(${(1 - enter) * -2}deg)`,
      }}
    >
      <div style={{ fontSize: 26, fontWeight: 700, color: ZALE.red, textTransform: "uppercase", letterSpacing: 1 }}>
        {source}
        {date ? <span style={{ color: "#6E6E6E", fontWeight: 500, textTransform: "none", marginLeft: 14 }}>{date}</span> : null}
      </div>
      <div style={{ fontSize: 48, fontWeight: 800, lineHeight: 1.12, letterSpacing: -0.8, marginTop: 10 }}>{headline}</div>
    </div>
  );
};

// CTA de palavra-chave (automação do direct): "Comenta PENSAR".
export const KeywordCta: React.FC<{ life: number; before?: string; keyword: string; after?: string; y?: number }> = ({
  life,
  before = "Comenta",
  keyword,
  after,
  y = 990,
}) => {
  const t = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { enter, a } = env(t, life, fps);
  const kw = spring({ frame: t - 8, fps, config: { damping: 9, stiffness: 200, mass: 0.6 } });
  return (
    <div style={{ position: "absolute", left: SAFE.x0, width: 870, top: y, display: "flex", flexDirection: "column", alignItems: "center", gap: 14, fontFamily: FONT, opacity: a, transform: `translateY(${(1 - enter) * 30}px)` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 20, background: ZALE.cardDark, borderRadius: 26, padding: "22px 30px", boxShadow: "0 30px 80px rgba(0,0,0,0.35)" }}>
        <span style={{ fontSize: 52, fontWeight: 700, color: ZALE.white }}>{before}</span>
        <span style={{ fontSize: 60, fontWeight: 800, color: ZALE.white, background: ZALE.red, borderRadius: 16, padding: "4px 22px", transform: `scale(${0.7 + 0.3 * kw})`, display: "inline-block" }}>
          {keyword}
        </span>
      </div>
      {after ? <div style={{ fontSize: 32, fontWeight: 600, color: ZALE.white, background: "rgba(20,20,20,0.7)", borderRadius: 14, padding: "8px 18px" }}>{after}</div> : null}
    </div>
  );
};

// Tela dividida: o vídeo viral em cima (topH px), você embaixo, título na
// faixa do meio. `me` é o conteúdo de baixo: <TakesVideo tl={tl} src=...
// style={{ objectPosition: "50% 30%" }} /> para centrar o rosto no recorte.
export const SplitScreen: React.FC<{
  viral: string;
  viralFrom?: number;
  viralVolume?: number | ((f: number) => number);
  topH?: number;
  me: React.ReactNode;
}> = ({ viral, viralFrom = 0, viralVolume = 0, topH = 1080, me }) => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: ZALE.ink }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: topH, overflow: "hidden" }}>
        <OffthreadVideo src={staticFile(viral)} startFrom={Math.round(viralFrom * fps)} volume={viralVolume} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
      <div style={{ position: "absolute", left: 0, top: topH, width: 1080, height: 1920 - topH, overflow: "hidden" }}>
        {me}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: topH - 3, height: 6, background: ZALE.red }} />
    </AbsoluteFill>
  );
};

// Legenda DISCRETA (pedido do usuário): embaixo, texto branco médio, sem caixa
// colorida; sombra suave para ler em qualquer fundo. Já faladas em branco,
// próximas em branco translúcido. Até 4 palavras ou até a pontuação.
export const SubtleCaptions: React.FC<{ words: { word: string; start: number; end: number }[]; bottom?: number; size?: number; groupSize?: number }> = ({
  words,
  bottom = 470,
  size = 50,
  groupSize = 4,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const groups: (typeof words)[] = [];
  let cur: typeof words = [];
  for (const w of words) {
    cur.push(w);
    if (cur.length >= groupSize || /[.?!,]$/.test(w.word.trim())) {
      groups.push(cur);
      cur = [];
    }
  }
  if (cur.length) groups.push(cur);
  const g = groups.find((gr) => t >= gr[0].start - 0.05 && t < gr[gr.length - 1].end + 0.3);
  if (!g) return null;
  const a = interpolate(t, [g[0].start - 0.05, g[0].start + 0.06], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", left: SAFE.x0, right: 1080 - SAFE.x1 - 60, bottom, display: "flex", justifyContent: "center", opacity: a }}>
      <div style={{ fontFamily: FONT, fontSize: size, fontWeight: 700, lineHeight: 1.2, textAlign: "center", letterSpacing: -0.3, textShadow: "0 2px 10px rgba(0,0,0,0.75), 0 0 2px rgba(0,0,0,0.9)" }}>
        {g.map((w, i) => (
          <span key={i} style={{ color: t >= w.start - 0.02 ? "#fff" : "rgba(255,255,255,0.6)" }}>
            {w.word.trim()}
            {i < g.length - 1 ? " " : ""}
          </span>
        ))}
      </div>
    </div>
  );
};

// Título no CENTRO da tela nos primeiros segundos (o gancho escrito).
export const TitleCenter: React.FC<{ life: number; text: string; highlight?: string; y?: number; size?: number }> = ({ life, text, highlight, y = 880, size = 76 }) => {
  const t = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { enter, a } = env(t, life, fps, 10);
  const parts = highlight && text.includes(highlight) ? text.split(highlight) : [text];
  return (
    <div style={{ position: "absolute", left: 70, right: 70, top: y, transform: `translateY(-50%) scale(${0.92 + 0.08 * enter})`, opacity: a, display: "flex", justifyContent: "center" }}>
      <div style={{ fontFamily: FONT, fontSize: size, fontWeight: 900, lineHeight: 1.08, letterSpacing: -1.5, color: ZALE.white, textAlign: "center", background: "rgba(20,20,20,0.78)", padding: "22px 34px", borderRadius: 26, boxShadow: "0 16px 50px rgba(0,0,0,0.45)" }}>
        {parts.length === 2 ? (
          <>
            {parts[0]}
            <span style={{ color: ZALE.redBright }}>{highlight}</span>
            {parts[1]}
          </>
        ) : (
          text
        )}
      </div>
    </div>
  );
};
