import React from "react";
import { AbsoluteFill, Easing, Sequence, interpolate, useCurrentFrame } from "remotion";
import { loadFont as loadCaveat } from "@remotion/google-fonts/Caveat";
import { FONT, MONO } from "./overlays";
import { C, Clip, HL, INOUT, OUT, lerp, rnd } from "./hl3";

// Cenas do 1D ("de onde veio a ideia": conversa com o Claude, Ruptura, Clive Wearing), 2026-10-01.
// Tempos das props em QUADROS relativos à cena (o registry converte `at`, `...At`, `dur`).

const { fontFamily: HAND } = loadCaveat();
const E = (e: (t: number) => number) => ({ ...C, easing: e });
const mono = (size: number, color = HL.dim, ls = 4): React.CSSProperties => ({ fontFamily: MONO, fontSize: size, letterSpacing: ls, textTransform: "uppercase", color });
// vidro: o desfoque do fundo fica numa camada PRÓPRIA atrás do conteúdo (<Frost />, primeiro filho de cada
// cartão). Com o backdrop-filter no próprio cartão, o texto ia junto para a camada desfocada (letras embaçadas)
// e às vezes aparecia um risco que vinha e sumia com as estrelas passando por trás.
const glass = (glow = 0): React.CSSProperties => ({
  background: `linear-gradient(160deg, rgba(255,255,255,${0.1 + 0.08 * glow}) 0%, rgba(255,255,255,0.025) 55%, rgba(107,63,212,${0.08 + 0.12 * glow}) 100%)`,
  border: `1px solid rgba(255,255,255,${0.16 + 0.3 * glow})`,
  boxShadow: `inset 0 1px 0 rgba(255,255,255,0.14), 0 40px 100px rgba(0,0,0,0.55), 0 0 ${60 * glow}px rgba(159,216,255,${0.3 * glow})`,
  borderRadius: 24,
});
// Vidro em TRÊS camadas irmãs (desfoque · pele · conteúdo), cada uma com a própria opacidade `a`.
// O navegador desliga o backdrop-filter quando um ANCESTRAL tem opacidade < 1: com o fade na cena ou no cartão,
// o vidro perdia o desfoque de repente (ficava "mais branco") e sumia seco. Por isso o cartão em si nunca tem
// opacidade; o fade vai em cada camada, e o texto fica fora da camada desfocada (letras nítidas).
const Glass: React.FC<{ glow?: number; a: number; pad?: string; radius?: number; borderColor?: string; borderStyle?: string; children?: React.ReactNode }> = ({ glow = 0, a, pad, radius = 24, borderColor, borderStyle, children }) => (
  <>
    <div style={{ position: "absolute", inset: 0, borderRadius: radius, backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", opacity: a, pointerEvents: "none" }} />
    <div style={{ position: "absolute", inset: 0, ...glass(glow), borderRadius: radius, ...(borderColor ? { borderColor } : {}), ...(borderStyle ? { borderStyle } : {}), opacity: a, pointerEvents: "none" }} />
    <div style={{ position: "absolute", inset: 0, padding: pad, boxSizing: "border-box", opacity: a }}>{children}</div>
  </>
);
const fadeLife = (f: number, life: number, a = 12, b = 12) => Math.min(lerp(f, 0, a, 0, 1, OUT), lerp(f, life - b, life, 1, 0));
const typed = (text: string, f: number, at: number, cps = 1.2) => text.slice(0, Math.max(0, Math.floor((f - at) / cps)));
const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+=<>/";
const scramble = (target: string, p: number, seed: number, f: number) =>
  target
    .split("")
    .map((ch, i) => (ch === " " || p * target.length > i ? ch : GLYPHS[Math.floor(rnd(i * 13 + Math.floor(f / 2) + seed) * GLYPHS.length)]))
    .join("");

// texto que se desfaz em partículas: cada letra sobe, se espalha e apaga a partir de `at`
const Dissolve: React.FC<{ text: string; at: number; seed: number; style?: React.CSSProperties }> = ({ text, at, seed, style }) => {
  const f = useCurrentFrame();
  return (
    <span style={style}>
      {text.split("").map((ch, i) => {
        const d = Math.max(0, f - at - rnd(seed + i) * 14);
        const p = Math.min(1, d / 26);
        const dx = (rnd(seed + i * 7) - 0.5) * 140 * p;
        const dy = -(20 + rnd(seed + i * 3) * 90) * p;
        return (
          <span key={i} style={{ display: "inline-block", whiteSpace: "pre", opacity: 1 - p, transform: `translate(${dx}px, ${dy}px)`, filter: p > 0 ? `blur(${p * 6}px)` : undefined }}>
            {ch}
          </span>
        );
      })}
    </span>
  );
};

type Line = { text: string; at: number };

// ---------------------------------------------------------------------------------------------
// "Isso não começou com Half-Life": o logo (λ dentro do anel) chega com o impacto e ocupa a tela;
// em `breakAt` ("não começou") ele sai deslizando para o lado, rápido, com rastro (whoosh no som).
// ---------------------------------------------------------------------------------------------
const LOGO = 900; // lado do quadro do logo
const LambdaLogo: React.FC<{ glow: number }> = ({ glow }) => (
  <svg width={LOGO} height={LOGO} viewBox="0 0 900 900" style={{ position: "absolute", inset: 0, overflow: "visible" }}>
    <defs>
      <filter id="lglow" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation={10 + 14 * glow} result="b" />
        <feMerge>
          <feMergeNode in="b" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    <g filter="url(#lglow)" fill="none" stroke={HL.orange} strokeLinecap="butt" strokeLinejoin="round">
      <circle cx={450} cy={450} r={400} strokeWidth={30} />
      {/* λ: perna longa com o gancho em cima, perna curta saindo do meio */}
      <path d="M 250 205 L 330 205 Q 372 205 392 250 L 610 712 L 690 712" strokeWidth={62} />
      <path d="M 452 380 L 300 712" strokeWidth={62} />
    </g>
  </svg>
);

export const HLLambdaOut: React.FC<{ life: number; breakAt?: number; exitAt?: number; words?: Line[]; label?: string }> = ({ life, breakAt = 50, exitAt, words = [], label = "Half-Life" }) => {
  // `words`: o texto que entra ao lado do logo, palavra por palavra ("não começou com" + λ);
  // `breakAt`: na palavra "Half-Life" texto e logo saem juntos para a esquerda (whoosh no som)
  const f = useCurrentFrame();
  const o = interpolate(f, [life - 10, life], [1, 0], C);
  const slam = interpolate(f, [0, 12], [1.35, 1], { ...C, easing: Easing.out(Easing.cubic) });
  const t0 = words.length ? words[0].at : 1e9;
  const side = lerp(f, t0 - 2, t0 + 12, 0, 1, E(Easing.inOut(Easing.cubic))); // logo abre espaço para o texto
  const OUT_AT0 = exitAt ?? breakAt + 9;
  // depois do impacto ele vai encolhendo devagar (perceptível) até abrir espaço para o texto
  const shrink = lerp(f, 12, t0, 1, 0.84, E(Easing.inOut(Easing.sin)));
  const scale = slam * (shrink * (1 - side) + 0.66 * side) * (1 - lerp(f, t0 + 12, OUT_AT0, 0, 0.04, C));
  const cx = 960 + 430 * side;
  const glow = lerp(f, 0, 10, 1, 0.55, OUT);
  // em "Half-Life" o nome aparece embaixo do λ; logo depois os dois (e o texto) saem juntos
  const nameP = lerp(f, breakAt, breakAt + 6, 0, 1, OUT);
  const OUT_AT = exitAt ?? breakAt + 9;
  const go = interpolate(f, [OUT_AT, OUT_AT + 20], [0, 1], { ...C, easing: Easing.in(Easing.cubic) });
  const x = -2700 * go;
  const v = go > 0 && go < 1 ? Math.min(1, go * 2.2) : 0;
  const sk = 10 * v;
  const logoLeft = cx - (LOGO * scale) / 2;
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <div style={{ position: "absolute", left: cx - 800 + x * 0.6, top: 540 - 800, width: 1600, height: 1600, borderRadius: "50%", background: "radial-gradient(closest-side, rgba(255,138,31,0.22), rgba(255,138,31,0))", opacity: 0.85 * (1 - go) }} />
      {/* rastro na saída */}
      {v > 0
        ? [0.06, 0.12, 0.2].map((g, i) => (
            <div key={i} style={{ position: "absolute", left: cx - LOGO / 2 + x + 2700 * g * v, top: 540 - LOGO / 2, width: LOGO, height: LOGO, transform: `scale(${scale}) skewX(${sk}deg)`, opacity: 0.3 - i * 0.08, filter: `blur(${10 + i * 8}px)` }}>
              <LambdaLogo glow={0.6} />
            </div>
          ))
        : null}
      <div style={{ position: "absolute", left: cx - LOGO / 2 + x, top: 540 - LOGO / 2, width: LOGO, height: LOGO, transform: `scale(${scale}) skewX(${sk}deg)`, filter: v > 0 ? `blur(${v * 6}px)` : undefined }}>
        <LambdaLogo glow={glow} />
      </div>
      {/* "não começou com" — termina encostado no logo */}
      <div style={{ position: "absolute", right: 1920 - logoLeft + 40 - x, top: 0, bottom: 0, display: "flex", alignItems: "center", gap: 26, transform: `skewX(${sk}deg)`, filter: v > 0 ? `blur(${v * 6}px)` : undefined }}>
        {words.map((w, i) => {
          const p = lerp(f, w.at, w.at + 9, 0, 1, OUT);
          return (
            <span key={i} style={{ fontFamily: FONT, fontWeight: 800, fontSize: 118, letterSpacing: -3, color: HL.text, opacity: p, transform: `translateY(${(1 - p) * 30}px)`, filter: p < 1 ? `blur(${(1 - p) * 8}px)` : undefined, textShadow: "0 10px 50px rgba(0,0,0,0.7)", whiteSpace: "pre" }}>
              {w.text}
            </span>
          );
        })}
      </div>
      <div style={{ position: "absolute", left: cx - 600 + x, width: 1200, top: 540 + 420 * scale + 26, textAlign: "center", ...mono(34, HL.text, 20), opacity: nameP, transform: `translateY(${(1 - nameP) * 14}px) skewX(${sk}deg)`, filter: v > 0 ? `blur(${v * 6}px)` : undefined, textShadow: "0 0 24px rgba(255,138,31,0.6)" }}>{label}</div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// A CONVERSA: janela de chat em vidro (pergunta digitada, resposta decodifica "memória de porquês");
// depois o chat sobe e nascem duas colunas, O QUÊ (o código) e POR QUÊ (o raciocínio). Em `closeAt`
// a conversa termina (janela fecha), o código continua aceso e em `goneAt` o porquê vira partícula.
// ---------------------------------------------------------------------------------------------
export const HLChatWhy: React.FC<{
  life: number;
  nameAt?: number;
  askAt?: number;
  ask?: string;
  toolAt?: number;
  answerAt?: number;
  termAt?: number;
  ideaAt?: number;
  what?: Line[];
  why?: Line[];
  closeAt?: number;
  keepAt?: number;
  reasonAt?: number;
  goneAt?: number;
}> = ({
  life,
  nameAt = 20,
  askAt = 30,
  ask = "o que você construiria, se pudesse escolher qualquer coisa?",
  toolAt = 200,
  answerAt = 240,
  termAt = 300,
  ideaAt = 340,
  what = [],
  why = [],
  closeAt = 700,
  keepAt = 720,
  reasonAt = 760,
  goneAt = 800,
}) => {
  const f = useCurrentFrame();
  const o = fadeLife(f, life, 14, 22); // saída longa: some junto, por cima do plano seguinte que já nasce embaixo
  const enter = lerp(f, 0, 26, 0, 1, OUT);
  const up = lerp(f, ideaAt, ideaAt + 26, 0, 1, E(Easing.inOut(Easing.cubic)));
  const close = lerp(f, closeAt, closeAt + 16, 0, 1, E(Easing.in(Easing.cubic)));
  const term = lerp(f, termAt, termAt + 40, 0, 1, C);
  const keep = lerp(f, keepAt, keepAt + 14, 0, 1, OUT);
  const reason = lerp(f, reasonAt, reasonAt + 10, 0, 1, OUT) * (1 - lerp(f, goneAt, goneAt + 20, 0, 1, C));
  const cols = lerp(f, ideaAt + 10, ideaAt + 34, 0, 1, OUT);
  const answer = "uma memória de porquês.";
  const ap = lerp(f, answerAt, termAt + 30, 0, 1, C);
  const chatW = 1040;
  return (
    <AbsoluteFill style={{ perspective: 1600 }}>
      {/* janela de chat */}
      <div
        style={{
          position: "absolute",
          left: 960 - chatW / 2,
          top: 210 - up * 190,
          width: chatW,
          height: 560,
          borderRadius: 24,
          transformOrigin: "50% 0%",
          transform: `translateZ(${(1 - enter) * -600}px) rotateX(${(1 - enter) * 14}deg) rotateY(${-6 + enter * 4}deg) scale(${1 - up * 0.42}) scaleY(${1 - close * 0.96})`,
          overflow: "hidden",
        }}
      >
        <Glass glow={0.15} a={o * enter * (1 - close)} pad="28px 40px">
        <div style={{ display: "flex", alignItems: "center", gap: 14, opacity: lerp(f, nameAt, nameAt + 12, 0, 1, OUT) }}>
          <div style={{ width: 14, height: 14, borderRadius: 7, background: HL.orange, boxShadow: `0 0 18px ${HL.orange}` }} />
          <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 30, color: HL.text }}>Claude</div>
          <div style={{ marginLeft: "auto", ...mono(18, HL.ice, 4), padding: "6px 14px", borderRadius: 999, border: "1px solid rgba(159,216,255,0.45)", opacity: lerp(f, toolAt, toolAt + 12, 0, 1, OUT), transform: `scale(${lerp(f, toolAt, toolAt + 12, 0.8, 1, E(Easing.out(Easing.back(2))))})` }}>Claude Code</div>
        </div>
        <div style={{ height: 1, background: "rgba(255,255,255,0.12)", margin: "22px 0 30px" }} />
        {f >= askAt ? (
          <div style={{ marginLeft: "auto", width: "fit-content", maxWidth: 760, padding: "20px 28px", borderRadius: 22, borderBottomRightRadius: 6, background: "rgba(159,216,255,0.14)", border: "1px solid rgba(159,216,255,0.3)", fontFamily: FONT, fontSize: 34, color: HL.text, lineHeight: 1.3 }}>
            {typed(ask, f, askAt, 1.0)}
            <span style={{ opacity: f < askAt + ask.length * 1.0 && Math.floor(f / 8) % 2 ? 1 : 0 }}>▍</span>
          </div>
        ) : null}
        {f >= answerAt ? (
          <div style={{ marginTop: 34, maxWidth: 820, fontFamily: FONT, fontSize: 52, fontWeight: 700, color: HL.text, letterSpacing: -1 }}>
            <span style={{ ...mono(18, HL.dim, 4), display: "block", marginBottom: 12 }}>resposta</span>
            {(() => {
              const s = scramble(answer, ap, 3, f);
              const i0 = answer.indexOf("memória");
              return (
                <>
                  {s.slice(0, i0)}
                  <span style={{ color: term > 0 ? HL.orange : HL.text, textShadow: `0 0 ${36 * term}px rgba(255,138,31,0.7)` }}>{s.slice(i0, -1)}</span>
                  {s.slice(-1)}
                </>
              );
            })()}
          </div>
        ) : null}
        </Glass>
      </div>
      {/* "conversa encerrada" no lugar da janela */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 120, textAlign: "center", ...mono(22, "rgba(242,240,247,0.55)", 10), opacity: o * lerp(f, closeAt + 10, closeAt + 22, 0, 1, OUT) * (1 - lerp(f, life - 14, life, 0, 1, C)) }}>conversa encerrada</div>
      {/* as duas colunas */}
      {[
        { title: "o quê", sub: "o que foi feito", lines: what, color: HL.ice, x: 960 - 20 - 760, lit: keep },
        { title: "por quê", sub: "o raciocínio", lines: why, color: HL.orange, x: 960 + 20, lit: reason },
      ].map((c, k) => (
        <div
          key={k}
          style={{
            position: "absolute",
            left: c.x,
            top: 560,
            width: 760,
            height: 400,
            transform: `translateY(${(1 - cols) * 60}px)`,
          }}
        >
          <Glass glow={0.1 + 0.6 * c.lit} a={o * cols} pad="30px 38px" borderColor={c.lit > 0.01 ? `rgba(${k ? "255,138,31" : "159,216,255"},${0.25 + 0.5 * c.lit})` : undefined}>
          <div style={{ ...mono(22, c.color, 8) }}>{c.title}</div>
          <div style={{ ...mono(16, HL.dim, 3), marginTop: 6 }}>{c.sub}</div>
          <div style={{ marginTop: 26 }}>
            {c.lines.map((l, i) =>
              f >= l.at ? (
                <div key={i} style={{ fontFamily: MONO, fontSize: 25, color: HL.text, marginBottom: 16, opacity: lerp(f, l.at, l.at + 8, 0, 1, OUT), transform: `translateX(${lerp(f, l.at, l.at + 10, 18, 0, OUT)}px)` }}>
                  {k === 1 ? <Dissolve text={"→ " + l.text} at={goneAt + i * 5} seed={i * 50 + 7} /> : <span style={{ color: HL.ice }}>✓ </span>}
                  {k === 0 ? l.text : null}
                </div>
              ) : null,
            )}
          </div>
          {k === 1 ? (
            <div style={{ position: "absolute", left: 38, bottom: 30, ...mono(18, "rgba(255,138,31,0.85)", 6), opacity: lerp(f, goneAt + 24, goneAt + 40, 0, 1, OUT) }}>perdido</div>
          ) : (
            <div style={{ position: "absolute", left: 38, bottom: 30, ...mono(18, "rgba(159,216,255,0.85)", 6), opacity: keep }}>continua existindo</div>
          )}
          </Glass>
        </div>
      ))}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// VERSÕES DA MESMA PESSOA: dois planos lado a lado, a divisória de luz entra pela direita até o meio.
// Embaixo, em `bodyAt`, "mesmo corpo" e as capacidades que continuam (chips, cada um na palavra).
// ---------------------------------------------------------------------------------------------
export const HLSplitVersions: React.FC<{
  life: number;
  left: { src: string; from: number; pos?: number };
  right: { src: string; from: number; pos?: number };
  labelL?: string;
  labelR?: string;
  bodyAt?: number;
  body?: string;
  chips?: Line[];
  credit?: string;
}> = ({ life, left, right, labelL = "versão A", labelR = "versão B", bodyAt = 1e9, body = "mesmo corpo", chips = [], credit }) => {
  const f = useCurrentFrame();
  const s = lerp(f, 0, 16, 0, 1, E(Easing.inOut(Easing.cubic)));
  const split = 1920 - s * 960;
  const push = 1.03 + lerp(f, 0, life, 0, 0.05, C);
  const lab = (x: number, text: string, o: number, align: "left" | "right") => (
    <div style={{ position: "absolute", top: 64, [align]: x, ...mono(20, HL.orange, 8), opacity: o, textShadow: "0 4px 20px rgba(0,0,0,0.8)" }}>{text}</div>
  );
  const b = lerp(f, bodyAt, bodyAt + 12, 0, 1, OUT);
  return (
    <AbsoluteFill>
      {/* cada lado mostra o SEU plano centralizado (rosto inteiro), não a metade do quadro */}
      <div style={{ position: "absolute", left: 0, top: 0, width: split, height: 1080, overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", transform: `scale(${push})` }}>
          <Clip src={left.src} from={left.from} style={{ objectPosition: `${left.pos ?? 50}% 50%` }} />
        </div>
      </div>
      <div style={{ position: "absolute", left: split, top: 0, width: Math.max(1, 1920 - split), height: 1080, overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", transform: `scale(${push})` }}>
          <Clip src={right.src} from={right.from} style={{ objectPosition: `${right.pos ?? 50}% 50%` }} />
        </div>
      </div>
      <div style={{ position: "absolute", left: split - 2, top: 0, width: 4, height: 1080, background: "linear-gradient(rgba(159,216,255,0), #eaf6ff 20%, #eaf6ff 80%, rgba(159,216,255,0))", boxShadow: "0 0 30px 6px rgba(159,216,255,0.55)", opacity: s > 0.02 ? 1 : 0 }} />
      <AbsoluteFill style={{ background: "linear-gradient(0deg, rgba(5,4,10,0.72), rgba(5,4,10,0) 38%)", pointerEvents: "none" }} />
      {lab(60, labelL, lerp(f, 4, 16, 0, 1, OUT), "left")}
      {lab(60, labelR, s, "right")}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 150, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 76, letterSpacing: -2, color: HL.text, opacity: b, transform: `translateY(${(1 - b) * 20}px)`, textShadow: "0 8px 40px rgba(0,0,0,0.85)" }}>{body}</div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 86, display: "flex", justifyContent: "center", gap: 18 }}>
        {chips.map((c, i) => {
          const p = lerp(f, c.at, c.at + 10, 0, 1, E(Easing.out(Easing.back(1.8))));
          return (
            <div key={i} style={{ ...mono(20, HL.ice, 4), padding: "8px 18px", borderRadius: 999, border: "1px solid rgba(159,216,255,0.5)", background: "rgba(5,4,10,0.55)", opacity: Math.min(1, p), transform: `scale(${0.7 + 0.3 * p})` }}>
              {c.text}
            </div>
          );
        })}
      </div>
      {credit ? <div style={{ position: "absolute", right: 44, bottom: 34, fontFamily: MONO, fontSize: 15, letterSpacing: 2, color: "rgba(242,240,247,0.45)" }}>{credit}</div> : null}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// CADA CONVERSA É UMA PORTA: a conversa (balões) vira a face de uma porta; a porta abre (3D) e do
// outro lado está a mesma janela, nova e vazia; os "mesmos" acendem um a um; em `emptyAt` fica claro
// que o histórico não veio; em `backAt` a porta anterior, com a conversa, recua para o escuro.
// ---------------------------------------------------------------------------------------------
export const HLDoors: React.FC<{
  life: number;
  doorAt?: number;
  openAt?: number;
  otherAt?: number;
  tags?: Line[];
  emptyAt?: number;
  backAt?: number;
}> = ({ life, doorAt = 100, openAt = 140, otherAt = 170, tags = [], emptyAt = 400, backAt = 460 }) => {
  const f = useCurrentFrame();
  const o = fadeLife(f, life, 14, 12);
  const enter = lerp(f, 0, 24, 0, 1, OUT);
  const door = lerp(f, doorAt, doorAt + 22, 0, 1, E(Easing.inOut(Easing.cubic)));
  const open = lerp(f, openAt, openAt + 30, 0, 1, E(Easing.inOut(Easing.cubic)));
  const back = lerp(f, backAt, backAt + 34, 0, 1, E(Easing.inOut(Easing.cubic)));
  const other = lerp(f, otherAt - 10, otherAt + 14, 0, 1, OUT);
  const empty = lerp(f, emptyAt, emptyAt + 14, 0, 1, OUT);
  // a janela da conversa (1040x600) vira a porta (520x820)
  const w = 1040 - 520 * door;
  const h = 600 + 220 * door;
  const bubbles = [
    { me: true, w: 0.62 },
    { me: false, w: 0.78 },
    { me: true, w: 0.46 },
    { me: false, w: 0.7 },
  ];
  const Bubbles: React.FC<{ scale: number }> = ({ scale }) => (
    <div style={{ padding: 26 * scale }}>
      {bubbles.map((b, i) => (
        <div key={i} style={{ height: 34 * scale, width: `${b.w * 100}%`, marginLeft: b.me ? "auto" : 0, marginBottom: 18 * scale, borderRadius: 14 * scale, background: b.me ? "rgba(159,216,255,0.22)" : "rgba(255,255,255,0.12)", border: `1px solid ${b.me ? "rgba(159,216,255,0.35)" : "rgba(255,255,255,0.16)"}` }} />
      ))}
    </div>
  );
  return (
    <AbsoluteFill style={{ perspective: 1700 }}>
      {/* do outro lado: a mesma janela, nova */}
      <div
        style={{
          position: "absolute",
          left: 960 - 260 + back * 300,
          top: 540 - 410,
          width: 520,
          height: 820,
          transform: `translateZ(${-60 + back * 80}px)`,
        }}
      >
        <Glass glow={0.35 * other} a={o * other} pad="26px 28px">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 12, height: 12, borderRadius: 6, background: HL.orange, boxShadow: `0 0 14px ${HL.orange}` }} />
          <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 26, color: HL.text }}>nova conversa</div>
        </div>
        <div style={{ height: 1, background: "rgba(255,255,255,0.12)", margin: "18px 0" }} />
        {/* histórico: só contorno tracejado, vazio */}
        <div style={{ position: "relative", height: 560 }}>
          {bubbles.map((b, i) => (
            <div key={i} style={{ height: 34, width: `${b.w * 100}%`, marginLeft: b.me ? "auto" : 0, marginBottom: 18, borderRadius: 14, border: "1px dashed rgba(242,240,247,0.25)", opacity: empty * 0.9 }} />
          ))}
          <div style={{ position: "absolute", left: 0, right: 0, top: 290, textAlign: "center", ...mono(18, "rgba(255,138,31,0.9)", 5), opacity: empty }}>sem a conversa anterior</div>
        </div>
        </Glass>
      </div>
      {/* os "mesmos" */}
      <div style={{ position: "absolute", left: 960 + 300 + back * 300, top: 330, width: 380 }}>
        {tags.map((t, i) => {
          const p = lerp(f, t.at, t.at + 10, 0, 1, OUT);
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22, opacity: o * p * (1 - back * 0.6), transform: `translateX(${(1 - p) * 30}px)` }}>
              <div style={{ width: 28, height: 28, borderRadius: 14, border: `1.5px solid ${HL.ice}`, display: "flex", alignItems: "center", justifyContent: "center", color: HL.ice, fontSize: 16 }}>✓</div>
              <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 32, color: HL.text }}>{t.text}</div>
            </div>
          );
        })}
      </div>
      {/* a conversa / a porta (gira na dobradiça esquerda e, no fim, recua para o escuro) */}
      <div
        style={{
          position: "absolute",
          left: 960 - w / 2 - back * 520,
          top: 540 - h / 2,
          width: w,
          height: h,
          transformOrigin: "left center",
          transform: `translateZ(${(1 - enter) * -500 - back * 700}px) rotateY(${-104 * open * (1 - 0.55 * back)}deg)`,
          borderRadius: 24 - 12 * door,
          overflow: "hidden",
        }}
      >
        <Glass glow={0.18} a={o * enter * (1 - 0.65 * back)} radius={24 - 12 * door}>
        <div style={{ position: "absolute", left: 26, top: 22, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 12, height: 12, borderRadius: 6, background: HL.ice }} />
          <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 26, color: HL.text }}>conversa</div>
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 70 }}>
          <Bubbles scale={1} />
        </div>
        {/* moldura e maçaneta da porta */}
        <div style={{ position: "absolute", inset: 14, borderRadius: 14, border: "2px solid rgba(242,240,247,0.25)", opacity: door }} />
        <div style={{ position: "absolute", right: 34, top: "52%", width: 16, height: 70, borderRadius: 8, background: "linear-gradient(90deg, #cfd6e6, #7d8496)", opacity: door, boxShadow: "0 0 12px rgba(0,0,0,0.6)" }} />
        </Glass>
      </div>
      <div style={{ position: "absolute", left: 960 - 520 - 300, top: 920, width: 600, textAlign: "center", ...mono(20, "rgba(242,240,247,0.7)", 8), opacity: o * lerp(f, backAt + 16, backAt + 30, 0, 1, OUT) }}>porta anterior</div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// O DIÁRIO DO CLIVE: página escura, cada linha escrita à mão na palavra, riscada e reescrita.
// `noteAt`: anotação "o anterior estava mentindo" apontando para as linhas riscadas.
// `forgetAt`: as linhas de cima borram (ele não lembra de ter escrito).
// ---------------------------------------------------------------------------------------------
export const HLDiary: React.FC<{
  life: number;
  title?: string;
  lines: { time: string; text: string; at: number; strikeAt?: number; hot?: boolean }[];
  noteAt?: number;
  note?: string;
  forgetAt?: number;
}> = ({ life, title = "diário · Clive Wearing", lines, noteAt = 1e9, note = "o anterior estava mentindo", forgetAt = 1e9 }) => {
  const f = useCurrentFrame();
  const o = fadeLife(f, life, 14, 12);
  const e = lerp(f, 0, 22, 0, 1, OUT);
  const forget = lerp(f, forgetAt, forgetAt + 24, 0, 1, C);
  const n = lerp(f, noteAt, noteAt + 14, 0, 1, OUT);
  return (
    <AbsoluteFill style={{ opacity: o, perspective: 1500 }}>
      <div
        style={{
          position: "absolute",
          left: 960 - 680,
          top: 120,
          width: 1360,
          height: 840,
          borderRadius: 18,
          background: "linear-gradient(170deg, #eee6d2 0%, #e2d8bf 100%)",
          boxShadow: "0 50px 140px rgba(0,0,0,0.7), inset 0 0 120px rgba(120,90,40,0.25)",
          transform: `translateZ(${(1 - e) * -500}px) rotateX(${8 + (1 - e) * 14}deg) rotateZ(-1.2deg) scale(${1 + lerp(f, 0, life, 0, 0.03, C)})`,
          overflow: "hidden",
        }}
      >
        {/* pautas */}
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} style={{ position: "absolute", left: 0, right: 0, top: 120 + i * 95, height: 1, background: "rgba(60,80,140,0.22)" }} />
        ))}
        <div style={{ position: "absolute", left: 150, top: 0, bottom: 0, width: 2, background: "rgba(190,60,60,0.35)" }} />
        <div style={{ position: "absolute", left: 180, top: 52, fontFamily: MONO, fontSize: 18, letterSpacing: 6, textTransform: "uppercase", color: "rgba(40,40,60,0.55)" }}>{title}</div>
        {lines.map((l, i) => {
          if (f < l.at) return null;
          const t = typed(l.text, f, l.at, 0.9);
          const s = l.strikeAt !== undefined ? lerp(f, l.strikeAt, l.strikeAt + 10, 0, 1, OUT) : 0;
          const blur = l.hot ? 0 : forget;
          return (
            <div key={i} style={{ position: "absolute", left: 50, top: 130 + i * 170, right: 60, display: "flex", alignItems: "baseline", gap: 30, filter: blur > 0 ? `blur(${blur * 5}px)` : undefined, opacity: 1 - blur * 0.55 }}>
              <div style={{ width: 90, fontFamily: HAND, fontSize: 52, color: "rgba(30,40,90,0.75)" }}>{l.time}</div>
              <div style={{ position: "relative", fontFamily: HAND, fontSize: l.hot ? 104 : 86, fontWeight: l.hot ? 700 : 500, color: l.hot ? "#1c2470" : "rgba(30,40,90,0.9)", lineHeight: 1.05 }}>
                {t}
                {s > 0 ? <div style={{ position: "absolute", left: -8, top: "52%", height: 6, width: `calc(${s * 100}% + 16px)`, background: "rgba(30,40,90,0.85)", borderRadius: 3, transform: "rotate(-1.5deg)" }} /> : null}
                {s > 0 ? <div style={{ position: "absolute", left: -8, top: "62%", height: 5, width: `calc(${s * 100}% + 16px)`, background: "rgba(30,40,90,0.8)", borderRadius: 3, transform: "rotate(1deg)" }} /> : null}
              </div>
            </div>
          );
        })}
        {/* a anotação dele, à mão, em vermelho, apontando para as linhas riscadas */}
        {f >= noteAt ? (
          <div style={{ position: "absolute", left: 170, top: 715, display: "flex", alignItems: "center", gap: 18 }}>
            <svg width={70} height={80} viewBox="0 0 70 80" style={{ overflow: "visible" }}>
              <path d="M 12 74 C 20 50 30 28 42 8 M 42 8 L 28 13 M 42 8 L 44 23" fill="none" stroke="#b3121b" strokeWidth={6} strokeLinecap="round" strokeDasharray="100" strokeDashoffset={100 - 100 * n} />
            </svg>
            <div style={{ fontFamily: HAND, fontSize: 96, fontWeight: 700, color: "#b3121b", transform: "rotate(-2deg)", lineHeight: 1 }}>{typed(note, f, noteAt + 5, 0.8)}</div>
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// PERGUNTA EM CAMADAS: itens pequenos em mono acendem (o que continua), um deles falha (a memória)
// e a pergunta grande entra em `qAt`. Termina com o espaço "parado" (vinheta) no fim da frase.
// ---------------------------------------------------------------------------------------------
// ícones animados dos cartões (SVG 120x120)
const QIcon: React.FC<{ kind?: string; f: number; fail: number }> = ({ kind, f, fail }) => {
  const st = { fill: "none", stroke: fail > 0 ? HL.orange : HL.ice, strokeWidth: 5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (kind === "pulse") {
    // batimento correndo: linha de ECG que se desenha em loop
    const ph = (f % 45) / 45;
    return (
      <svg width={150} height={120} viewBox="0 0 150 120">
        <path d="M 0 64 L 40 64 L 52 40 L 64 92 L 78 20 L 90 64 L 150 64" {...st} strokeDasharray="260" strokeDashoffset={260 - 260 * Math.min(1, ph * 1.4)} style={{ filter: `drop-shadow(0 0 8px ${HL.ice})` }} />
      </svg>
    );
  }
  if (kind === "gear") {
    const teeth = Array.from({ length: 8 }).map((_, i) => {
      const a = (i / 8) * Math.PI * 2;
      return <rect key={i} x={56} y={10} width={8} height={18} rx={2} fill={st.stroke} transform={`rotate(${(a * 180) / Math.PI} 60 60)`} />;
    });
    return (
      <svg width={120} height={120} viewBox="0 0 120 120" style={{ transform: `rotate(${f * 3}deg)` }}>
        {teeth}
        <circle cx={60} cy={60} r={30} {...st} />
        <circle cx={60} cy={60} r={10} {...st} />
      </svg>
    );
  }
  if (kind === "heart") {
    const beat = 1 + 0.12 * Math.max(0, Math.sin(((f % 30) / 30) * Math.PI * 2)) ** 3;
    return (
      <svg width={120} height={120} viewBox="0 0 120 120" style={{ transform: `scale(${beat})`, filter: `drop-shadow(0 0 ${8 + 10 * (beat - 1) * 8}px rgba(255,120,120,0.6))` }}>
        <path d="M 60 100 C 20 72 12 50 22 34 C 32 18 52 20 60 38 C 68 20 88 18 98 34 C 108 50 100 72 60 100 Z" fill="rgba(255,110,110,0.18)" stroke="#ff8f8f" strokeWidth={5} strokeLinejoin="round" />
      </svg>
    );
  }
  // memórias: fita de filme correndo; na falha, os quadros somem um a um e a fita se rasga
  const run = (f * 2) % 34;
  return (
    <svg width={170} height={120} viewBox="0 0 170 120">
      <rect x={5} y={25} width={160} height={70} rx={6} {...st} strokeDasharray={fail > 0.3 ? "10 9" : undefined} opacity={1 - fail * 0.4} />
      {Array.from({ length: 6 }).map((_, i) => {
        const x = 10 + ((i * 34 - run + 204) % 204) - 17;
        const gone = fail > 0 && rnd(i + 3) < fail;
        return x > 4 && x < 140 ? <rect key={i} x={x} y={37} width={24} height={46} rx={3} fill={gone ? "none" : "rgba(159,216,255,0.28)"} stroke={st.stroke} strokeWidth={2} opacity={gone ? 0.25 : 1} /> : null;
      })}
      {Array.from({ length: 9 }).map((_, i) => (
        <rect key={`h${i}`} x={12 + i * 17} y={28} width={7} height={5} fill={st.stroke} opacity={0.7} />
      ))}
    </svg>
  );
};

export const HLSameQuestion: React.FC<{ life: number; items: { text: string; at: number; fail?: boolean; kind?: string }[]; q: string; qAt: number; holdAt?: number }> = ({ life, items, q, qAt, holdAt = 1e9 }) => {
  const f = useCurrentFrame();
  const o = fadeLife(f, life, 12, 12);
  const qp = lerp(f, qAt, qAt + 16, 0, 1, OUT);
  const hold = lerp(f, holdAt, holdAt + 20, 0, 1, INOUT);
  const recede = lerp(f, qAt - 4, qAt + 14, 0, 1, E(Easing.inOut(Easing.cubic))); // cartões sobem e diminuem para a pergunta entrar
  const words = q.split(" ");
  const CW = 340;
  const gap = 40;
  const total = items.length * CW + (items.length - 1) * gap;
  return (
    <AbsoluteFill style={{ perspective: 1600 }}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, rgba(5,4,10,0) 30%, rgba(5,4,10,0.85) 100%)", opacity: o * hold }} />
      <div style={{ position: "absolute", left: 960 - total / 2, top: 300 - recede * 190, width: total, height: 360, display: "flex", gap, transform: `scale(${1 - 0.28 * recede})`, transformOrigin: "50% 0%" }}>
        {items.map((it, i) => {
          const p = lerp(f, it.at, it.at + 12, 0, 1, E(Easing.out(Easing.back(1.6))));
          const fail = it.fail ? lerp(f, it.at + 8, it.at + 30, 0, 1, C) : 0;
          const jit = it.fail && fail > 0 && fail < 1 ? (rnd(f) - 0.5) * 10 : 0;
          const lit = !it.fail ? lerp(f, it.at, it.at + 8, 0, 1, OUT) : 0;
          return (
            <div
              key={i}
              style={{
                width: CW,
                height: 340,
                position: "relative",
                flexShrink: 0,
                transform: `translate(${jit}px, ${(1 - Math.min(1, p)) * 60}px) rotateY(${(i - (items.length - 1) / 2) * -6}deg)`,
              }}
            >
              <Glass glow={0.25 * lit} a={o * Math.max(0, Math.min(1, p)) * (1 - fail * 0.35)} borderColor={it.fail ? `rgba(255,138,31,${0.3 + 0.5 * fail})` : undefined} borderStyle={it.fail && fail > 0.3 ? "dashed" : undefined}>
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 22 }}>
              {/* blip: anel de luz que abre quando o cartão acende */}
              {f >= it.at ? (
                <div style={{ position: "absolute", left: CW / 2 - 220 * (0.2 + 0.8 * lerp(f, it.at, it.at + 16, 0, 1, OUT)), top: 170 - 220 * (0.2 + 0.8 * lerp(f, it.at, it.at + 16, 0, 1, OUT)), width: 440 * (0.2 + 0.8 * lerp(f, it.at, it.at + 16, 0, 1, OUT)), height: 440 * (0.2 + 0.8 * lerp(f, it.at, it.at + 16, 0, 1, OUT)), borderRadius: "50%", border: `2px solid ${it.fail ? HL.orange : HL.ice}`, opacity: 0.85 * (1 - lerp(f, it.at, it.at + 16, 0, 1, C)), pointerEvents: "none" }} />
              ) : null}
              <div style={{ transform: "scale(1.35)", height: 150, display: "flex", alignItems: "center" }}>
                <QIcon kind={it.kind} f={f - it.at} fail={fail} />
              </div>
              <div style={{ ...mono(26, it.fail ? HL.orange : HL.text, 4), textAlign: "center", padding: "0 18px" }}>{it.fail ? scramble(it.text, 1 - fail * 0.8, i * 31, f) : it.text}</div>
              </div>
              </Glass>
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", left: 960 - 650, top: 560 - 300, width: 1300, height: 600, borderRadius: "50%", background: "radial-gradient(closest-side, rgba(107,63,212,0.3), rgba(107,63,212,0))", opacity: o * qp }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 560, textAlign: "center", opacity: o }}>
        <div style={{ display: "inline-block", maxWidth: 1500, fontFamily: FONT, fontWeight: 800, fontSize: 96, lineHeight: 1.08, letterSpacing: -2, color: HL.text }}>
          {words.map((w, i) => {
            const p = lerp(f, qAt + i * 3, qAt + i * 3 + 12, 0, 1, OUT);
            return (
              <span key={i} style={{ display: "inline-block", whiteSpace: "pre", opacity: p, transform: `translateY(${(1 - p) * 24}px)`, filter: p < 1 ? `blur(${(1 - p) * 8}px)` : undefined }}>
                {w + (i < words.length - 1 ? " " : "")}
              </span>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

void Sequence;
void interpolate;

// ---------------------------------------------------------------------------------------------
// BUILD-UP + IMPACTO (por cima de duas cenas, lane 1): luz cresce no centro, rastros convergem e as
// bordas escurecem até `hitAt`; no impacto, flash branco curto e uma onda de choque que abre a cena nova.
// ---------------------------------------------------------------------------------------------
export const HLBuildHit: React.FC<{ life: number; hitAt?: number; tint?: "fogo" | "xen" }> = ({ life, hitAt = 60, tint = "fogo" }) => {
  // `tint`: "fogo" (laranja, virada 1C→1D) ou "xen" (verde-azulado de portal, virada 1D→2A)
  const X = tint === "xen";
  const RGB = X ? "120,255,214" : "255,214,170";
  const CORE = X ? "radial-gradient(closest-side, rgba(225,255,246,0.95), rgba(90,230,200,0.5) 35%, rgba(40,160,255,0) 70%)" : "radial-gradient(closest-side, rgba(255,240,220,0.95), rgba(255,170,90,0.45) 35%, rgba(255,138,31,0) 70%)";
  const f = useCurrentFrame();
  const b = interpolate(f, [0, hitAt], [0, 1], { ...C, easing: Easing.in(Easing.cubic) }); // build
  const after = Math.max(0, f - hitAt);
  const flash = f < hitAt ? interpolate(f, [hitAt - 3, hitAt], [0, 0.9], C) : interpolate(after, [0, 2, 16], [1, 0.85, 0], C);
  const ring = interpolate(after, [0, 26], [0, 1], { ...C, easing: Easing.out(Easing.cubic) });
  const vig = f < hitAt ? b : interpolate(after, [0, 10], [1, 0], C);
  const out = interpolate(f, [life - 8, life], [1, 0], C);
  const N = 46;
  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity: out }}>
      {/* bordas escurecem (o mundo afunila para o centro) */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, rgba(5,4,10,0) 25%, rgba(5,4,10,0.92) 85%)", opacity: vig }} />
      {/* rastros convergindo */}
      {f < hitAt + 4
        ? Array.from({ length: N }).map((_, i) => {
            const ang = (i / N) * Math.PI * 2 + rnd(i) * 0.3;
            const ph = (f * (0.02 + 0.05 * b) + rnd(i + 3)) % 1; // anda de fora para dentro, cada vez mais rápido
            const r1 = 1150 * (1 - ph);
            const len = 60 + 260 * b;
            const x = 960 + Math.cos(ang) * r1;
            const y = 540 + Math.sin(ang) * r1;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: x,
                  top: y,
                  width: len,
                  height: 2 + 2 * b,
                  transformOrigin: "0 50%",
                  transform: `rotate(${(ang * 180) / Math.PI}deg)`,
                  background: `linear-gradient(90deg, rgba(${RGB},${0.7 * b}), rgba(${RGB},0))`,
                  opacity: b * Math.min(1, ph * 3),
                }}
              />
            );
          })
        : null}
      {/* núcleo de luz */}
      <div style={{ position: "absolute", left: 960 - 500, top: 540 - 500, width: 1000, height: 1000, borderRadius: "50%", background: CORE, transform: `scale(${0.05 + 0.75 * b * b + 1.6 * ring})`, opacity: f < hitAt ? b : 1 - ring }} />
      {X && f < hitAt
        ? [0, 1, 2].map((k) => {
            const r = 120 + k * 70 + 40 * Math.sin(f / 9 + k);
            return <div key={`p${k}`} style={{ position: "absolute", left: 960 - r, top: 540 - r, width: 2 * r, height: 2 * r, borderRadius: "50%", border: `${2 + 2 * b}px solid rgba(${RGB},${0.55 * b})`, borderLeftColor: "transparent", borderBottomColor: k % 2 ? "transparent" : `rgba(${RGB},${0.3 * b})`, transform: `rotate(${(k % 2 ? -1 : 1) * f * (4 + 6 * b) + k * 40}deg) scale(${1 - 0.5 * b * b})`, boxShadow: `0 0 ${30 * b}px rgba(${RGB},${0.4 * b})` }} />;
          })
        : null}
      {/* onda de choque */}
      {after > 0 ? (
        <div style={{ position: "absolute", left: 960 - 1200 * ring, top: 540 - 1200 * ring, width: 2400 * ring, height: 2400 * ring, borderRadius: "50%", border: `${10 * (1 - ring) + 1}px solid rgba(${RGB},${0.85 * (1 - ring)})`, boxShadow: `0 0 80px rgba(${RGB},${0.5 * (1 - ring)})` }} />
      ) : null}
      <AbsoluteFill style={{ background: "#fff8ef", opacity: flash }} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// FRASE COM IMPACTO (lane 1, por cima do plano): "Mas por que" entra em `leadAt`; a palavra forte
// bate enorme em `slamAt` (tremida, flash, onda de choque); o plano de baixo escurece enquanto dura.
// ---------------------------------------------------------------------------------------------
export const HLSlamWord: React.FC<{ life: number; lead?: string; leadAt?: number; word: string; slamAt: number }> = ({ life, lead = "", leadAt = 0, word, slamAt }) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [life - 8, life], [1, 0], C);
  const dim = lerp(f, leadAt, leadAt + 8, 0, 0.62, OUT);
  const lp = lerp(f, leadAt, leadAt + 8, 0, 1, OUT);
  const hit = f >= slamAt;
  const s = interpolate(f, [slamAt, slamAt + 7], [2.4, 1], { ...C, easing: Easing.out(Easing.cubic) });
  const wp = hit ? 1 : 0;
  const shake = hit && f < slamAt + 14 ? (1 - (f - slamAt) / 14) * 22 : 0;
  const sx = shake ? (rnd(f * 7) - 0.5) * shake : 0;
  const sy = shake ? (rnd(f * 13) - 0.5) * shake : 0;
  const flash = interpolate(f, [slamAt, slamAt + 1, slamAt + 10], [0.75, 0.5, 0], C);
  const ring = lerp(f, slamAt, slamAt + 20, 0, 1, OUT);
  const push = 1 + lerp(f, slamAt + 7, life, 0, 0.06, C);
  return (
    <AbsoluteFill style={{ opacity: o, pointerEvents: "none", transform: `translate(${sx}px, ${sy}px)` }}>
      <AbsoluteFill style={{ background: `rgba(5,4,10,${dim})` }} />
      {hit ? <div style={{ position: "absolute", left: 960 - 1200 * ring, top: 600 - 1200 * ring, width: 2400 * ring, height: 2400 * ring, borderRadius: "50%", border: `${10 * (1 - ring) + 1}px solid rgba(255,190,140,${0.8 * (1 - ring)})` }} /> : null}
      <div style={{ position: "absolute", left: 0, right: 0, top: 300, textAlign: "center", fontFamily: FONT, fontWeight: 700, fontSize: 84, letterSpacing: -1, color: "rgba(242,240,247,0.9)", opacity: lp, transform: `translateY(${(1 - lp) * 20}px)`, textShadow: "0 8px 40px rgba(0,0,0,0.8)" }}>{lead}</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 410, textAlign: "center", fontFamily: FONT, fontWeight: 900, fontSize: 250, letterSpacing: -8, lineHeight: 1, color: HL.orange, opacity: wp, transform: `scale(${s * push})`, textShadow: "0 0 80px rgba(255,138,31,0.65), 0 14px 60px rgba(0,0,0,0.85)" }}>{word}</div>
      <AbsoluteFill style={{ background: "#fff3e2", opacity: hit ? flash : 0 }} />
    </AbsoluteFill>
  );
};
