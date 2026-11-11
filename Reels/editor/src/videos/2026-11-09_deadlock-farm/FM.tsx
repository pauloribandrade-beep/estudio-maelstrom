import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, Loop, OffthreadVideo, random, Sequence, staticFile, useCurrentFrame } from "remotion";
import { DLMapa } from "../../lib/dlmapa";
import { loadFont as loadAnton } from "@remotion/google-fonts/Anton";
import { loadFont as loadBody } from "@remotion/google-fonts/NunitoSans";
import { loadFont as loadHand } from "@remotion/google-fonts/Caveat";
import CL from "../2026-11-06_deadlock-magia/clips.json";
import LITE from "../2026-11-06_deadlock-magia/clips_lite.json";
import { LiteCtx } from "../../lib/sfx-ctx";

// Básicos do Deadlock Ep. 2 "alma/farm" (09/11/2026). Mesma linguagem do "objetivos do mapa": Linguagem do Magia v2, que ele aprovou: material REAL (arte oficial da deadlock.wiki,
// gameplay da Valve sem HUD), identidade do próprio jogo (pôster creme com meio-tom, verde-petróleo, almas azul-água,
// carimbo de tinta). O mapa é desenhado em código com os ícones oficiais para as rotas e os objetivos acenderem na palavra.
// Zona segura do TikTok: conteúdo entre y 180 e 1290; nada importante à direita de 930 entre y 700 e 1550; legenda em 1370.
// Props terminadas em At chegam em QUADROS relativos ao início da cena (o registry converte).

const { fontFamily: POSTER } = loadAnton("normal", { weights: ["400"], subsets: ["latin", "latin-ext"] });
const { fontFamily: BODY } = loadBody("normal", { weights: ["700", "800", "900"], subsets: ["latin", "latin-ext"] });
const { fontFamily: HAND } = loadHand("normal", { weights: ["700"], subsets: ["latin", "latin-ext"] });

const R = "videos/2026-11-06_deadlock-magia_R/"; // gameplay e logos do Magia (LoL, Dota, CS, Rivals, Deadlock)
const DLR = "videos/2026-11-06_deadlock-ranked_R/dl/";
const mg = (n: string) => staticFile(`${R}mg/${n}`);
const dl = (n: string) => staticFile(`${DLR}${n}`);
const FPS = 30;
const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
const ease = (f: number, a: number, n = 10) => interpolate(f, [a, a + n], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
const back = (f: number, a: number, n = 10, s = 1.8) => interpolate(f - a, [0, n], [0, 1], { ...clamp, easing: Easing.out(Easing.back(s)) });
const fl = (f: number, a: number, b: number, pk: number) => (f < a ? 0 : interpolate(f, [a, b], [pk, 0], clamp));
const shake = (f: number, at: number, amp = 14, n = 9, seed = "s") => {
  const k = f - at;
  if (k < 0 || k > n) return { x: 0, y: 0, r: 0 };
  const d = amp * (1 - k / n) ** 2;
  return { x: (random(`${seed}x${k}`) - 0.5) * 2 * d, y: (random(`${seed}y${k}`) - 0.5) * 2 * d, r: (random(`${seed}r${k}`) - 0.5) * d * 0.12 };
};
const punchZ = (f: number, ts: number[] = [], amp = 0.1, n = 9) => ts.reduce((z, t) => (f >= t && f < t + n ? z + amp * (1 - (f - t) / n) ** 2 : z), 0);

const INK = "#0b1412";
const TEAL = "#123b35";
const CREAM = "#f4e7cb";
const SOUL = "#5ff2d6";
const AMBER = "#f2a13a";
const SAPPH = "#5aa9ff";
const STAMP = "#d8452f";

// ---------- texturas ----------
const Grain: React.FC<{ o?: number }> = ({ o = 0.08 }) => {
  const f = useCurrentFrame();
  const seed = Math.floor(f / 2) % 9;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: o, mixBlendMode: "overlay", pointerEvents: "none" }}>
      <filter id={`ogr${seed}`}>
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={seed} />
        <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1.4 -0.2" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#ogr${seed})`} />
    </svg>
  );
};
const Vignette: React.FC<{ o?: number }> = ({ o = 0.75 }) => (
  <AbsoluteFill style={{ background: `radial-gradient(ellipse 85% 70% at 50% 40%, rgba(0,0,0,0) 45%, rgba(0,0,0,${o}) 100%)`, pointerEvents: "none" }} />
);
const Halftone: React.FC<{ c?: string; o?: number; size?: number }> = ({ c = "#000", o = 0.16, size = 14 }) => (
  <div style={{ position: "absolute", inset: 0, opacity: o, backgroundImage: `radial-gradient(${c} 28%, transparent 30%)`, backgroundSize: `${size}px ${size}px`, pointerEvents: "none" }} />
);
const Souls: React.FC<{ n?: number; o?: number; c?: string; speed?: number }> = ({ n = 18, o = 1, c = SOUL, speed = 1 }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ opacity: o, pointerEvents: "none" }}>
      {Array.from({ length: n }).map((_, i) => {
        const x = random(`ox${i}`) * 1080;
        const sp = (1.4 + random(`ov${i}`) * 2.6) * speed;
        const y = 1980 - ((f * sp + random(`oy${i}`) * 1980) % 2100);
        const s = 6 + random(`os${i}`) * 14;
        const wob = Math.sin((f + i * 20) / 18) * 18;
        return <div key={i} style={{ position: "absolute", left: x + wob, top: y, width: s, height: s, borderRadius: "50%", background: c, boxShadow: `0 0 ${s * 2}px ${s * 0.6}px ${c}`, opacity: 0.35 + random(`oo${i}`) * 0.5 }} />;
      })}
    </AbsoluteFill>
  );
};
const Fog: React.FC<{ c?: string; o?: number }> = ({ c = TEAL, o = 1 }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ opacity: o, pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: -300 + Math.sin(f / 60) * 80, top: 1000, width: 1700, height: 900, background: `radial-gradient(ellipse at 50% 50%, ${c}cc 0%, rgba(0,0,0,0) 65%)`, filter: "blur(30px)" }} />
      <div style={{ position: "absolute", left: -200 - Math.sin(f / 75) * 90, top: -200, width: 1500, height: 800, background: `radial-gradient(ellipse at 50% 50%, ${c}88 0%, rgba(0,0,0,0) 65%)`, filter: "blur(30px)" }} />
    </AbsoluteFill>
  );
};
// fundo de papel escuro do jogo (verde-petróleo com meio-tom e grão)
const Paper: React.FC<{ tint?: string; children?: React.ReactNode }> = ({ tint = TEAL, children }) => (
  <AbsoluteFill style={{ background: `radial-gradient(ellipse 90% 70% at 50% 35%, ${tint} 0%, ${INK} 75%)`, overflow: "hidden" }}>
    <Halftone c="#000" o={0.22} size={12} />
    <Fog />
    {children}
    <Vignette o={0.7} />
    <Grain />
  </AbsoluteFill>
);

// ---------- gameplay ----------
const Clip: React.FC<{ clip: string; ss?: number; rate?: number; life: number; pos?: string; style?: React.CSSProperties }> = ({ clip, ss = 0, rate = 1, life, pos = "50% 50%", style }) => {
  const len = (CL as Record<string, number>)[clip] ?? 3;
  const loopF = Math.max(1, Math.floor(((len - ss) / rate) * FPS) - 1);
  const lite = React.useContext(LiteCtx);
  const v = <OffthreadVideo src={staticFile(`${R}${lite && (LITE as string[]).includes(clip) ? "clips_lite" : "clips"}/${clip}.mp4`)} muted startFrom={Math.round(ss * FPS)} playbackRate={rate} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: pos, ...style }} />;
  return life > loopF ? <Loop durationInFrames={loopF}>{v}</Loop> : v;
};

// ---------- carimbo de tinta ----------
const Stamp: React.FC<{ text: string; at: number; size?: number; rot?: number; c?: string; sub?: string }> = ({ text, at, size = 92, rot = -7, c = STAMP, sub }) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  const s = interpolate(f, [at, at + 5], [2.3, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  const sh = shake(f, at + 5, 12, 8, `st${text}`);
  return (
    <div style={{ transform: `translate(${sh.x}px, ${sh.y}px) rotate(${rot}deg) scale(${s})`, opacity: interpolate(f, [at, at + 2], [0, 0.95], clamp) }}>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <filter id="orough">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="4" />
          <feDisplacementMap in="SourceGraphic" scale="7" />
        </filter>
      </svg>
      <div style={{ filter: "url(#orough)" }}>
        <div style={{ border: `9px solid ${c}`, borderRadius: 12, padding: "10px 34px 14px", textAlign: "center", color: c, background: "rgba(0,0,0,0.15)" }}>
          <div style={{ fontFamily: POSTER, fontSize: size, lineHeight: 1.02, letterSpacing: 3, whiteSpace: "nowrap", textTransform: "uppercase" }}>{text}</div>
          {sub ? <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: size * 0.34, letterSpacing: 6, marginTop: 2 }}>{sub}</div> : null}
        </div>
      </div>
    </div>
  );
};

// anotação à mão (Caveat) que se escreve da esquerda pra direita
const Hand: React.FC<{ at: number; x: number; y: number; size?: number; c?: string; rot?: number; children: string; w?: number; center?: boolean }> = ({ at, x, y, size = 64, c = CREAM, rot = -4, children, w = 900, center }) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  const p = interpolate(f, [at, at + Math.max(8, children.length * 1.1)], [0, 100], clamp);
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, transform: `rotate(${rot}deg)`, textAlign: center ? "center" : "left", fontFamily: HAND, fontWeight: 700, fontSize: size, color: c, lineHeight: 1,
      clipPath: center ? `inset(0 ${(100 - p) / 2}% 0 ${(100 - p) / 2}%)` : `inset(0 ${100 - p}% 0 0)`, textShadow: "0 4px 16px rgba(0,0,0,0.85)" }}>{children}</div>
  );
};

// título de pôster (Anton creme) que bate
const Title: React.FC<{ at: number; y: number; size?: number; c?: string; children: React.ReactNode; sub?: string }> = ({ at, y, size = 120, c = CREAM, children, sub }) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  const s = interpolate(f, [at, at + 5], [1.8, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  const sh = shake(f, at + 5, 10, 8, `t${y}`);
  return (
    <div style={{ position: "absolute", left: 40, right: 40, top: y, textAlign: "center", transform: `translate(${sh.x}px, ${sh.y}px) scale(${s})`, opacity: interpolate(f, [at, at + 2], [0, 1], clamp) }}>
      <div style={{ fontFamily: POSTER, fontSize: size, color: c, letterSpacing: 2, lineHeight: 1, textShadow: "0 8px 30px rgba(0,0,0,0.85)" }}>{children}</div>
      {sub ? <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: size * 0.24, color: SOUL, letterSpacing: 8, marginTop: 10 }}>{sub}</div> : null}
    </div>
  );
};


// fundo de gameplay desfocado e escuro (para as telas de interface)
const BgClip: React.FC<{ clip: string; ss?: number; life: number; dim?: number; blur?: number }> = ({ clip, ss, life, dim = 0.35, blur = 8 }) => (
  <AbsoluteFill style={{ transform: "scale(1.12)", filter: `blur(${blur}px) brightness(${dim})` }}>
    <Clip clip={clip} ss={ss} life={life} />
  </AbsoluteFill>
);
const Flash: React.FC<{ f: number; ts: number[]; pk?: number }> = ({ f, ts, pk = 0.4 }) => (
  <AbsoluteFill style={{ background: "#fff", opacity: ts.reduce((a, t) => a + fl(f, t, t + 5, pk), 0), pointerEvents: "none" }} />
);


const OBR = "videos/2026-11-07_deadlock-objetivos_R/ob/";
const ob = (n: string) => staticFile(`${OBR}${n}`);
const GREEN = "#6dff8a";
const ORANGE = "#ff9a3c";
const GHOST = "#b58cff";

// ---------- peças ----------
const Orb: React.FC<{ c?: string; s?: number; x: number; y: number; o?: number; pulse?: number }> = ({ c = SOUL, s = 90, x, y, o = 1, pulse = 0 }) => {
  const f = useCurrentFrame();
  const k = 1 + pulse * 0.08 * Math.sin(f / 4);
  return (
    <div style={{ position: "absolute", left: x - s / 2, top: y - s / 2, width: s, height: s, borderRadius: "50%", opacity: o, transform: `scale(${k})`,
      background: `radial-gradient(circle at 35% 30%, #ffffff 0%, ${c} 38%, ${c}66 70%, rgba(0,0,0,0) 72%)`, boxShadow: `0 0 ${s * 0.6}px ${s * 0.25}px ${c}88` }} />
  );
};
const Panel: React.FC<{ x: number; y: number; w: number; h?: number; c?: string; children?: React.ReactNode; style?: React.CSSProperties }> = ({ x, y, w, h, c = CREAM, children, style }) => (
  <div style={{ position: "absolute", left: x, top: y, width: w, height: h, background: "rgba(8,14,14,0.9)", border: `4px solid ${c}`, borderRadius: 22, boxShadow: "0 20px 50px rgba(0,0,0,0.6)", ...style }}>{children}</div>
);
const Big: React.FC<{ children: React.ReactNode; size?: number; c?: string; style?: React.CSSProperties }> = ({ children, size = 80, c = CREAM, style }) => (
  <div style={{ fontFamily: POSTER, fontSize: size, color: c, lineHeight: 1, letterSpacing: 1.5, ...style }}>{children}</div>
);
const Sub: React.FC<{ children: React.ReactNode; size?: number; c?: string; style?: React.CSSProperties }> = ({ children, size = 30, c = SOUL, style }) => (
  <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: size, color: c, letterSpacing: 5, ...style }}>{children}</div>
);
const num = (n: number) => Math.round(n).toLocaleString("pt-BR");
const Check: React.FC<{ at: number; ok?: boolean; s?: number }> = ({ at, ok = true, s = 64 }) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  return (
    <div style={{ width: s, height: s, borderRadius: "50%", background: ok ? GREEN : STAMP, color: INK, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: BODY, fontWeight: 900,
      fontSize: s * 0.62, transform: `scale(${back(f, at, 8, 2.2)})`, flexShrink: 0 }}>{ok ? "✓" : "✕"}</div>
  );
};

// ========== 1) gancho: o placar de almas do inimigo dispara, o seu fica parado… e no "nunca mais" o seu passa ==========
export const FMHook: React.FC<{ life: number; flipAt?: number; passAt?: number; promAt?: number }> = ({ life, flipAt = 30, passAt = 110, promAt = 140 }) => {
  const f = useCurrentFrame();
  const en = (k: number) => 6200 + k * 38;
  const enemy = en(f);
  const y0 = 2400 + flipAt * 4;
  const you = f < flipAt ? 2400 + f * 4 : f < passAt ? interpolate(f, [flipAt, passAt], [y0, en(passAt)], { ...clamp, easing: Easing.in(Easing.quad) }) : en(f) + (f - passAt) * 120;
  const lead = f >= passAt;
  const z = 1.05 + punchZ(f, [flipAt, passAt], 0.08, 10);
  const row = (name: string, v: number, c: string, y: number, top: boolean) => (
    <div style={{ position: "absolute", left: 80, top: y, width: 920, display: "flex", alignItems: "center", gap: 26, transition: "none" }}>
      <Orb c={c} s={96} x={48} y={48} pulse={top ? 1 : 0} />
      <div style={{ marginLeft: 110 }}>
        <Sub c={c} size={28}>{name}</Sub>
        <Big size={130} c={top ? CREAM : `${CREAM}99`}>{num(v)}</Big>
      </div>
      {top ? <div style={{ marginLeft: "auto", fontFamily: POSTER, fontSize: 64, color: c }}>▲</div> : null}
    </div>
  );
  const ySwap = interpolate(f, [passAt, passAt + 12], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${z})` }}><BgClip clip="raw" ss={60} life={life} dim={0.32} blur={5} /></AbsoluteFill>
      <Halftone o={0.2} />
      <Sub c={CREAM} size={30} style={{ position: "absolute", top: 230, left: 0, right: 0, textAlign: "center" }}>ALMAS DA PARTIDA · 18:00</Sub>
      {row("INIMIGO", enemy, ORANGE, 380 + ySwap * 300, !lead)}
      {row("VOCÊ", you, GREEN, 680 - ySwap * 300, lead)}
      {f >= promAt ? <Hand at={promAt} x={90} y={1060} size={84} c={SOUL} rot={-4} w={900} center>eu te prometo.</Hand> : null}
      <Grain />
      <Flash f={f} ts={[0, passAt]} pk={0.35} />
    </AbsoluteFill>
  );
};

// ========== 2) a série: EP 1 objetivos (feito) → EP 2 alma acende ==========
export const FMSeries: React.FC<{ life: number; ep1At?: number; ep2At?: number }> = ({ life, ep1At = 90, ep2At = 180 }) => {
  const f = useCurrentFrame();
  const card = (i: number, at: number, title: string, img: string, done: boolean, lit: boolean) => (
    <div style={{ position: "absolute", left: 90 + i * 460, top: 520, width: 420, height: 560, borderRadius: 26, overflow: "hidden", border: `6px solid ${lit ? SOUL : `${CREAM}88`}`,
      background: INK, transform: `translateY(${(1 - back(f, at, 12, 1.4)) * 400}px) rotate(${i ? 3 : -3}deg) scale(${lit ? 1.04 : 0.96})`, boxShadow: lit ? `0 0 50px ${SOUL}88` : "0 20px 40px rgba(0,0,0,0.6)", opacity: f >= at ? 1 : 0 }}>
      <Img src={img} style={{ width: "100%", height: 340, objectFit: "cover", filter: lit ? "none" : "grayscale(0.4) brightness(0.8)" }} />
      <div style={{ padding: "18px 24px" }}>
        <Sub size={26} c={lit ? SOUL : `${CREAM}aa`}>EPISÓDIO {i + 1}</Sub>
        <Big size={70}>{title}</Big>
      </div>
      {done ? <div style={{ position: "absolute", right: 18, top: 18 }}><Check at={at + 8} /></div> : null}
    </div>
  );
  return (
    <AbsoluteFill style={{ background: INK, overflow: "hidden" }}>
      <BgClip clip="k4" ss={40} life={life} dim={0.28} />
      <Halftone o={0.2} />
      <Title at={2} y={230} size={96} c={CREAM} sub="A SÉRIE">BÁSICOS DO DEADLOCK</Title>
      {card(0, Math.min(ep1At, 6), "OBJETIVOS", ob("Map_colored.png"), true, false)}
      {f >= ep2At - 30 ? card(1, ep2At - 30, "ALMA", ob("Patron_VisualNovel_Art.png"), false, f >= ep2At) : null}
      {f >= ep2At ? <Souls n={22} o={0.8} /> : null}
      <Grain />
      <Flash f={f} ts={[ep2At]} pk={0.3} />
    </AbsoluteFill>
  );
};

// ========== 3) alma = duas coisas: dinheiro da loja + o seu nível ==========
export const FMTwo: React.FC<{ life: number; shopAt?: number; lvlAt?: number }> = ({ life, shopAt = 60, lvlAt = 120 }) => {
  const f = useCurrentFrame();
  const side = (x: number, at: number, icon: React.ReactNode, t: string, s: string, c: string) =>
    f < at ? null : (
      <Panel x={x} y={560} w={430} h={520} c={c} style={{ transform: `scale(${back(f, at, 12, 1.5)})`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 22 }}>
        {icon}
        <Big size={86} c={CREAM}>{t}</Big>
        <Sub c={c} size={26}>{s}</Sub>
      </Panel>
    );
  const coin = (
    <svg width={190} height={190} viewBox="0 0 100 100">
      <circle cx={50} cy={50} r={44} fill={AMBER} stroke="#7a4a10" strokeWidth={6} />
      <circle cx={50} cy={50} r={30} fill="none" stroke="#fff6" strokeWidth={4} />
      <text x={50} y={64} textAnchor="middle" fontFamily={POSTER} fontSize={40} fill="#5a3408">$</text>
    </svg>
  );
  const lvl = (
    <svg width={190} height={190} viewBox="0 0 100 100">
      <polygon points="50,6 92,30 92,70 50,94 8,70 8,30" fill={TEAL} stroke={SOUL} strokeWidth={5} />
      <path d="M50 26 L72 52 H58 V74 H42 V52 H28 Z" fill={SOUL} />
    </svg>
  );
  return (
    <AbsoluteFill style={{ background: INK, overflow: "hidden" }}>
      <BgClip clip="raw" ss={100} life={life} dim={0.25} />
      <Halftone o={0.2} />
      <Title at={2} y={240} size={100} c={CREAM}>ALMA É 2 COISAS</Title>
      <Orb x={540} y={430} s={110} c={SOUL} pulse={1} />
      {side(80, shopAt, coin, "DINHEIRO", "DA LOJA", AMBER)}
      {side(570, lvlAt, lvl, "NÍVEL", "DO SEU HERÓI", SOUL)}
      <Grain />
      <Flash f={f} ts={[shopAt, lvlAt]} pk={0.25} />
    </AbsoluteFill>
  );
};

// ========== 4) cada alma sobe arma · habilidade · vida (sem comprar nada) → 3.800 = ultimate ==========
export const FMBoons: React.FC<{ life: number; armAt?: number; spAt?: number; hpAt?: number; freeAt?: number; ultAt?: number; unlockAt?: number }> = ({
  life, armAt = 60, spAt = 120, hpAt = 160, freeAt = 190, ultAt = 240, unlockAt = 330,
}) => {
  const f = useCurrentFrame();
  const bars = [
    { t: "DANO DA ARMA", c: ORANGE, at: armAt },
    { t: "PODER DA HABILIDADE", c: GHOST, at: spAt },
    { t: "VIDA", c: GREEN, at: hpAt },
  ];
  const phase2 = f >= ultAt;
  const souls = interpolate(f, [ultAt, unlockAt - 4], [1200, 3800], { ...clamp, easing: Easing.out(Easing.cubic) });
  const unlocked = f >= unlockAt;
  return (
    <AbsoluteFill style={{ background: INK, overflow: "hidden" }}>
      <BgClip clip="raw" ss={180} life={life} dim={0.25} />
      <Halftone o={0.2} />
      {!phase2 ? (
        <>
          <Title at={2} y={220} size={84} c={CREAM} sub="CADA ALMA QUE VOCÊ JUNTA">O HERÓI SOBE</Title>
          {bars.map((b, i) => {
            const p = interpolate(f, [b.at, b.at + 20], [0.25, 0.85], { ...clamp, easing: Easing.out(Easing.cubic) });
            return (
              <div key={b.t} style={{ position: "absolute", left: 90, top: 520 + i * 190, width: 900 }}>
                <Sub c={b.c} size={30}>{b.t}</Sub>
                <div style={{ marginTop: 12, height: 64, borderRadius: 14, background: "rgba(255,255,255,0.08)", border: `3px solid ${CREAM}44`, overflow: "hidden" }}>
                  <div style={{ width: `${p * 100}%`, height: "100%", background: `linear-gradient(90deg, ${b.c}88, ${b.c})`, boxShadow: f >= b.at && f < b.at + 20 ? `0 0 30px ${b.c}` : "none" }} />
                </div>
                {f >= b.at ? <div style={{ position: "absolute", right: 10, top: 0, fontFamily: POSTER, fontSize: 44, color: b.c, transform: `scale(${back(f, b.at, 8, 2)})` }}>▲</div> : null}
              </div>
            );
          })}
          {f >= freeAt ? (
            <div style={{ position: "absolute", left: 0, right: 0, top: 1110, display: "flex", justifyContent: "center" }}>
              <Stamp text="SEM COMPRAR NADA" at={freeAt} size={70} rot={-4} c={SOUL} />
            </div>
          ) : null}
        </>
      ) : (
        <>
          <div style={{ position: "absolute", left: 0, right: 0, top: 300, textAlign: "center" }}>
            <Sub c={CREAM} size={32}>ALMAS</Sub>
            <Big size={240} c={unlocked ? SOUL : CREAM} style={{ textShadow: unlocked ? `0 0 40px ${SOUL}` : "none" }}>{num(souls)}</Big>
          </div>
          <div style={{ position: "absolute", left: 540 - 170, top: 700, width: 340, height: 340, borderRadius: 40, border: `8px solid ${unlocked ? SOUL : `${CREAM}55`}`, background: unlocked ? `${TEAL}` : "rgba(0,0,0,0.5)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", transform: `scale(${unlocked ? 1 + punchZ(f, [unlockAt], 0.2, 10) : 0.95})`, boxShadow: unlocked ? `0 0 70px ${SOUL}` : "none" }}>
            <div style={{ fontSize: 120, filter: unlocked ? "none" : "grayscale(1) brightness(0.6)" }}>{unlocked ? "⚡" : "🔒"}</div>
            <Big size={56} c={unlocked ? CREAM : `${CREAM}88`}>ULTIMATE</Big>
          </div>
          {unlocked ? (
            <div style={{ position: "absolute", left: 0, right: 0, top: 1110, display: "flex", justifyContent: "center" }}>
              <Stamp text="LIBERADA" at={unlockAt + 2} size={80} rot={-5} c={SOUL} />
            </div>
          ) : null}
        </>
      )}
      <Grain />
      <Flash f={f} ts={[ultAt, unlockAt]} pk={0.3} />
    </AbsoluteFill>
  );
};

// ========== 5) atrás em alma = atrás em item E herói mais fraco ==========
export const FMWeak: React.FC<{ life: number; itemsAt?: number; weakAt?: number }> = ({ life, itemsAt = 70, weakAt = 130 }) => {
  const f = useCurrentFrame();
  const shrink = ease(f, weakAt, 16);
  const col = (x: number, name: string, img: string, souls: string, c: string, items: number, weak: boolean) => (
    <div style={{ position: "absolute", left: x, top: 440, width: 420, textAlign: "center" }}>
      <Img src={img} style={{ width: 300, height: 400, objectFit: "cover", borderRadius: 20, border: `5px solid ${c}`, transform: `scale(${weak ? 1 - shrink * 0.22 : 1 + shrink * 0.05})`,
        filter: weak ? `grayscale(${shrink * 0.8}) brightness(${1 - shrink * 0.35})` : "none" }} />
      <Sub c={c} size={28} style={{ marginTop: 14 }}>{name}</Sub>
      <Big size={64}>{souls}</Big>
      {f >= itemsAt ? (
        <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 14 }}>
          {Array.from({ length: 6 }).map((_, k) => (
            <div key={k} style={{ width: 52, height: 52, borderRadius: 10, border: `3px solid ${k < items ? c : `${CREAM}33`}`, background: k < items ? `${c}55` : "rgba(0,0,0,0.4)",
              transform: `scale(${back(f, itemsAt + k * 2, 6, 2)})` }} />
          ))}
        </div>
      ) : null}
    </div>
  );
  return (
    <AbsoluteFill style={{ background: INK, overflow: "hidden" }}>
      <BgClip clip="k4" ss={150} life={life} dim={0.25} />
      <Halftone o={0.2} />
      <Title at={2} y={220} size={84} c={CREAM}>QUEM TÁ ATRÁS EM ALMA…</Title>
      {col(80, "VOCÊ", dl("Mo_Krill_card.png"), "9.800", GREEN, 2, true)}
      {col(580, "INIMIGO", dl("Rat_King_card.png"), "18.400", ORANGE, 6, false)}
      {f >= weakAt ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 1150, display: "flex", justifyContent: "center" }}>
          <Stamp text="HERÓI MAIS FRACO" at={weakAt + 4} size={80} rot={-5} />
        </div>
      ) : null}
      <Grain />
      <Flash f={f} ts={[weakAt]} pk={0.25} />
    </AbsoluteFill>
  );
};

// ========== 6) a bolinha: tropa morre → metade da alma sobe numa bolinha → verde é sua: um tiro confirma ==========
export const FMOrb: React.FC<{ life: number; dieAt?: number; halfAt?: number; greenAt?: number; shotAt?: number; timeAt?: number }> = ({
  life, dieAt = 100, halfAt = 140, greenAt = 200, shotAt = 290, timeAt = 380,
}) => {
  const f = useCurrentFrame();
  const dead = f >= dieAt;
  const rise = ease(f, dieAt + 4, 18);
  const orbY = 820 - rise * 260;
  const hit = f >= shotAt + 6;
  const fly = ease(f, shotAt + 6, 14);
  const tAfter = f >= timeAt;
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${1.08 + punchZ(f, [dieAt, shotAt + 6], 0.06, 9)})` }}>
        <BgClip clip="raw" ss={20} life={life} dim={0.3} blur={6} />
      </AbsoluteFill>
      <Vignette o={0.6} />
      <Title at={2} y={220} size={78} c={CREAM}>A BOLINHA DA TROPA</Title>
      {/* a tropa (marcador) */}
      <div style={{ position: "absolute", left: 540 - 70, top: 860, width: 140, height: 140, borderRadius: 24, background: dead ? "#333" : "#3a6fb0", border: `5px solid ${CREAM}`,
        transform: `rotate(${dead ? 80 * ease(f, dieAt, 8) : 0}deg)`, opacity: dead ? 1 - ease(f, dieAt + 10, 14) : 1, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: BODY, fontWeight: 900, fontSize: 28, color: CREAM }}>TROPA</div>
      {dead ? (
        <>
          {/* metade no chão */}
          <Orb x={430} y={1010} s={70} c={f >= greenAt ? GREEN : CREAM} o={ease(f, dieAt + 4, 8)} />
          {f >= halfAt ? <Hand at={halfAt} x={120} y={1060} size={52} c={CREAM} rot={-3} w={420}>metade no chão</Hand> : null}
          {/* metade que sobe */}
          {!hit || fly < 1 ? (
            <Orb x={540 + fly * 440} y={orbY - fly * 300} s={130 - fly * 80} c={f >= greenAt ? GREEN : CREAM} pulse={1} />
          ) : null}
          {f >= halfAt ? (
            <div style={{ position: "absolute", left: 640, top: 470, transform: `scale(${back(f, halfAt, 8, 2)})` }}>
              <Panel x={0} y={0} w={300} c={f >= greenAt ? GREEN : CREAM} style={{ position: "relative", padding: "14px 20px", textAlign: "center" }}>
                <Big size={64}>50%</Big>
                <Sub size={22} c={f >= greenAt ? GREEN : CREAM}>{f >= greenAt ? "VERDE = SUA" : "DA ALMA"}</Sub>
              </Panel>
            </div>
          ) : null}
        </>
      ) : null}
      {/* mira e tiro */}
      {f >= shotAt - 14 && f < shotAt + 20 ? (
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
          <g transform={`translate(${interpolate(f, [shotAt - 14, shotAt], [300, 540], clamp)}, ${interpolate(f, [shotAt - 14, shotAt], [1200, orbY], clamp)})`}>
            <circle r={60} fill="none" stroke={CREAM} strokeWidth={5} />
            <path d="M-90 0 H-40 M40 0 H90 M0 -90 V-40 M0 40 V90" stroke={CREAM} strokeWidth={5} />
          </g>
          {f >= shotAt && f < shotAt + 6 ? <line x1={540} y1={1900} x2={540} y2={orbY} stroke="#fff6c0" strokeWidth={8} /> : null}
        </svg>
      ) : null}
      {hit ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 1120, display: "flex", justifyContent: "center" }}>
          <Stamp text="CONFIRMADA" at={shotAt + 6} size={80} rot={-4} c={GREEN} sub="UM TIRO SÓ" />
        </div>
      ) : null}
      {tAfter ? <Hand at={timeAt} x={90} y={380} size={56} c={CREAM} rot={-3} w={900} center>…ou espera o tempo acabar</Hand> : null}
      <Grain o={0.07} />
      <Flash f={f} ts={[dieAt, shotAt + 6]} pk={0.3} />
    </AbsoluteFill>
  );
};

// ========== 7) negar: o inimigo atira na SUA bolinha (já existia no Dota) ==========
export const FMDeny: React.FC<{ life: number; enemyAt?: number; denyAt?: number; dotaAt?: number; mastAt?: number }> = ({ life, enemyAt = 60, denyAt = 220, dotaAt = 300, mastAt = 450 }) => {
  const f = useCurrentFrame();
  const shot = f >= enemyAt + 40;
  const gone = ease(f, enemyAt + 44, 10);
  const dota = f >= dotaAt;
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${1.08 + punchZ(f, [enemyAt + 44], 0.07, 9)})` }}>
        <BgClip clip="raw" ss={70} life={life} dim={0.3} blur={6} />
      </AbsoluteFill>
      <Vignette o={0.6} />
      {!dota ? <Title at={2} y={220} size={78} c={CREAM}>SE VOCÊ NÃO ATIRAR…</Title> : null}
      {!dota ? (
        <>
          <Orb x={540} y={720} s={150 * (1 - gone)} c={GREEN} pulse={1} o={1 - gone} />
          {shot ? (
            <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
              {f < enemyAt + 48 ? <line x1={1060} y1={300} x2={540} y2={720} stroke={ORANGE} strokeWidth={9} /> : null}
              {Array.from({ length: 10 }).map((_, i) => {
                const a = (i / 10) * Math.PI * 2, r = 30 + gone * 160;
                return <circle key={i} cx={540 + Math.cos(a) * r} cy={720 + Math.sin(a) * r} r={10 * (1 - gone)} fill={GREEN} />;
              })}
            </svg>
          ) : null}
          {f >= enemyAt && !shot ? (
            <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
              <g transform={`translate(${interpolate(f, [enemyAt, enemyAt + 38], [900, 540], clamp)}, ${interpolate(f, [enemyAt, enemyAt + 38], [400, 720], clamp)})`}>
                <circle r={70} fill="none" stroke={ORANGE} strokeWidth={6} />
                <path d="M-100 0 H-46 M46 0 H100 M0 -100 V-46 M0 46 V100" stroke={ORANGE} strokeWidth={6} />
              </g>
              <text x={900} y={360} fill={ORANGE} fontFamily={BODY} fontWeight={900} fontSize={30} letterSpacing={4}>INIMIGO</text>
            </svg>
          ) : null}
          {f >= enemyAt + 44 ? (
            <div style={{ position: "absolute", left: 0, right: 0, top: 960, display: "flex", justifyContent: "center" }}>
              <Stamp text="ROUBADA" at={enemyAt + 44} size={90} rot={-6} />
            </div>
          ) : null}
          {f >= denyAt ? (
            <div style={{ position: "absolute", left: 0, right: 0, top: 1150, display: "flex", justifyContent: "center" }}>
              <Stamp text="NEGOU SEU FARM" at={denyAt} size={64} rot={4} c={ORANGE} />
            </div>
          ) : null}
        </>
      ) : (
        <>
          <div style={{ position: "absolute", left: 90, top: 300, width: 900, transform: `scale(${interpolate(f, [dotaAt, dotaAt + 6], [1.8, 1], clamp)})`, display: "flex", flexDirection: "column", alignItems: "center", gap: 30 }}>
            <Img src={mg("dota_logo.png")} style={{ width: 760, height: 200, objectFit: "contain" }} />
            <Big size={110} c={SOUL}>↓</Big>
            <Img src={mg("dl_logo.png")} style={{ width: 760, height: 200, objectFit: "contain", opacity: ease(f, dotaAt + 20, 10) }} />
          </div>
          <Sub c={CREAM} size={40} style={{ position: "absolute", left: 0, right: 0, top: 880, textAlign: "center" }}>JÁ EXISTIA NO DOTA</Sub>
          {f >= mastAt ? <Hand at={mastAt} x={90} y={1000} size={62} c={SOUL} rot={-3} w={900} center>(eu ainda tô masterizando)</Hand> : null}
        </>
      )}
      <Grain o={0.07} />
      <Flash f={f} ts={[enemyAt + 44, dotaAt]} pk={0.3} />
    </AbsoluteFill>
  );
};

// ========== 8) as 2 regras da lane: garante a sua (verde) · rouba a dele (laranja) ==========
export const FMRules: React.FC<{ life: number; mineAt?: number; theirAt?: number; impAt?: number; a1At?: number; a2At?: number; a3At?: number }> = ({
  life, mineAt = 40, theirAt = 280, impAt = 370, a1At = 420, a2At = 440, a3At = 470,
}) => {
  const f = useCurrentFrame();
  const rule = (y: number, at: number, c: string, t: string, s: string) =>
    f < at ? null : (
      <Panel x={70} y={y} w={940} h={220} c={c} style={{ display: "flex", alignItems: "center", gap: 34, padding: "0 40px", transform: `translateX(${(1 - back(f, at, 12, 1.4)) * -600}px)` }}>
        <div style={{ position: "relative", width: 130, height: 130 }}><Orb x={65} y={65} s={110} c={c} pulse={1} /></div>
        <div>
          <Big size={78}>{t}</Big>
          <Sub c={c} size={26}>{s}</Sub>
        </div>
      </Panel>
    );
  const tri = ["ALMA", "NÍVEL", "ITENS"];
  const triAt = [a1At, a2At, a3At];
  return (
    <AbsoluteFill style={{ background: INK, overflow: "hidden" }}>
      <BgClip clip="raw" ss={20} life={life} dim={0.25} />
      <Halftone o={0.2} />
      <Title at={2} y={220} size={86} c={CREAM}>NA LANE, APRENDE:</Title>
      {rule(430, mineAt, GREEN, "GARANTE A SUA", "ATIRA NA SUA BOLINHA VERDE")}
      {rule(690, theirAt, ORANGE, "ROUBA A DELE", "ATIRA NA BOLINHA LARANJA")}
      {f >= impAt ? (
        <div style={{ position: "absolute", left: 70, right: 70, top: 980, display: "flex", justifyContent: "center", gap: 26 }}>
          {tri.map((t, i) =>
            f >= triAt[i] ? (
              <div key={t} style={{ padding: "12px 30px", borderRadius: 14, background: SOUL, color: INK, fontFamily: POSTER, fontSize: 64, transform: `scale(${back(f, triAt[i], 8, 2)})` }}>{t} ▲</div>
            ) : null,
          )}
        </div>
      ) : null}
      <Grain />
      <Flash f={f} ts={[mineAt, theirAt]} pk={0.2} />
    </AbsoluteFill>
  );
};

// ========== 9) dupla rende (54% + 54% = 108%) · trio desperdiça (36%) ==========
export const FMShare: React.FC<{ life: number; duoAt?: number; p54At?: number; p108At?: number; soloAt?: number; trioAt?: number; p36At?: number; wasteAt?: number }> = ({
  life, duoAt = 90, p54At = 300, p108At = 390, soloAt = 560, trioAt = 600, p36At = 730, wasteAt = 850,
}) => {
  const f = useCurrentFrame();
  const trio = f >= trioAt;
  const n = trio ? 3 : f >= duoAt ? 2 : 1;
  const pct = trio ? 36 : 54;
  const heroes = Array.from({ length: n }).map((_, i) => i);
  const showPct = trio ? f >= p36At : f >= p54At;
  const total = trio ? 108 : 108;
  return (
    <AbsoluteFill style={{ background: INK, overflow: "hidden" }}>
      <BgClip clip="raw" ss={120} life={life} dim={0.25} />
      <Halftone o={0.2} />
      <Title at={2} y={220} size={80} c={CREAM} sub="POUCA GENTE SABE">QUANTOS NA LANE?</Title>
      {/* a tropa no meio com a alma */}
      <Orb x={540} y={560} s={120} c={GREEN} pulse={1} />
      <Sub c={CREAM} size={26} style={{ position: "absolute", left: 0, right: 0, top: 640, textAlign: "center" }}>ALMA DE 1 TROPA</Sub>
      {heroes.map((i) => {
        const x = n === 1 ? 540 : n === 2 ? 340 + i * 400 : 220 + i * 320;
        const at = i === 0 ? 0 : i === 1 ? duoAt : trioAt;
        return (
          <div key={i} style={{ position: "absolute", left: x - 130, top: 760, width: 260, textAlign: "center", transform: `scale(${back(f, at, 10, 1.6)})` }}>
            <svg width={120} height={120} viewBox="0 0 60 60" style={{ display: "block", margin: "0 auto" }}>
              <circle cx={30} cy={20} r={12} fill={trio ? ORANGE : GREEN} /><path d="M6 58 C8 36 52 36 54 58 Z" fill={trio ? ORANGE : GREEN} />
            </svg>
            {showPct ? <Big size={92} c={trio ? ORANGE : GREEN} style={{ transform: `scale(${back(f, trio ? p36At : p54At, 8, 2)})` }}>{pct}%</Big> : null}
            <svg width={260} height={10} style={{ display: "block" }} />
          </div>
        );
      })}
      {/* a soma */}
      {!trio && f >= p108At ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 1060, textAlign: "center", transform: `scale(${back(f, p108At, 10, 2)})` }}>
          <Big size={110} c={GREEN}>= {total}%</Big>
          {f >= soloAt - 60 ? <Sub c={CREAM} size={28}>RENDE MAIS QUE SOZINHO</Sub> : null}
        </div>
      ) : null}
      {trio && f >= wasteAt ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 1080, display: "flex", justifyContent: "center" }}>
          <Stamp text="ALMA JOGADA FORA" at={wasteAt} size={80} rot={-5} />
        </div>
      ) : null}
      <Grain />
      <Flash f={f} ts={[duoAt, trioAt]} pk={0.2} />
    </AbsoluteFill>
  );
};

// ========== 10) a pegadinha: alma ASSOMBRADA (jungle · caixa · máquina) ==========
export const FMHaunted: React.FC<{ life: number; trickAt?: number; jgAt?: number; boxAt?: number; macAt?: number; ghostAt?: number; cntAt?: number; lvlAt?: number; notAt?: number }> = ({
  life, trickAt = 10, jgAt = 140, boxAt = 160, macAt = 180, ghostAt = 270, cntAt = 330, lvlAt = 380, notAt = 420,
}) => {
  const f = useCurrentFrame();
  const src = [
    { t: "JUNGLE", img: ob("Guardian.png"), at: jgAt },
    { t: "CAIXA", img: "", at: boxAt },
    { t: "MÁQUINA", img: "", at: macAt },
  ];
  const ghost = f >= ghostAt;
  return (
    <AbsoluteFill style={{ background: INK, overflow: "hidden" }}>
      <BgClip clip="raw" ss={150} life={life} dim={0.22} />
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 60% 45% at 50% 50%, ${GHOST}${ghost ? "44" : "00"} 0%, rgba(0,0,0,0) 70%)` }} />
      <Halftone o={0.2} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 200, display: "flex", justifyContent: "center" }}>
        <Stamp text="PEGADINHA" at={trickAt} size={90} rot={-4} c={AMBER} />
      </div>
      {!ghost
        ? src.map((s, i) =>
            f < s.at ? null : (
              <Panel key={s.t} x={70 + i * 320} y={520} w={300} h={300} c={GHOST} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, transform: `scale(${back(f, s.at, 10, 1.8)})` }}>
                <div style={{ fontSize: 96 }}>{i === 0 ? "🌲" : i === 1 ? "📦" : "⚙️"}</div>
                <Big size={52}>{s.t}</Big>
              </Panel>
            ),
          )
        : null}
      {ghost ? (
        <>
          <div style={{ position: "absolute", left: 540 - 120, top: 470, width: 240, height: 300, transform: `translateY(${Math.sin(f / 9) * 14}px) scale(${back(f, ghostAt, 12, 1.6)})` }}>
            <svg width={240} height={300} viewBox="0 0 120 150">
              <path d="M60 6 C30 6 14 30 14 60 V138 L28 126 L42 140 L60 126 L78 140 L92 126 L106 138 V60 C106 30 90 6 60 6 Z" fill={`${GHOST}cc`} stroke="#fff" strokeWidth={3} style={{ filter: `drop-shadow(0 0 24px ${GHOST})` }} />
              
            </svg>
          </div>
          <Big size={96} c={GHOST} style={{ position: "absolute", left: 0, right: 0, top: 800, textAlign: "center", textShadow: `0 0 30px ${GHOST}` }}>ALMA ASSOMBRADA</Big>
          <div style={{ position: "absolute", left: 120, right: 120, top: 940, display: "flex", justifyContent: "center", gap: 24 }}>
            {[{ t: "CONTADOR", at: cntAt }, { t: "NÍVEL", at: lvlAt }].map((x) =>
              f >= x.at ? (
                <div key={x.t} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 22px", borderRadius: 14, background: "rgba(8,14,14,0.9)", border: `3px solid ${GREEN}`, transform: `scale(${back(f, x.at, 8, 2)})` }}>
                  <Check at={x.at} s={44} />
                  <Big size={44}>{x.t}</Big>
                </div>
              ) : null,
            )}
          </div>
          {f >= notAt ? (
            <div style={{ position: "absolute", left: 0, right: 0, top: 1090, display: "flex", justifyContent: "center" }}>
              <Stamp text="AINDA NÃO É SUA" at={notAt} size={78} rot={-4} />
            </div>
          ) : null}
        </>
      ) : null}
      <Grain />
      <Flash f={f} ts={[ghostAt]} pk={0.3} />
    </AbsoluteFill>
  );
};

// ========== 11) assombrada vira segura aos pouquinhos · patch 30/10 −25% · time atrás +50% ==========
export const FMSecure: React.FC<{ life: number; dripAt?: number; moreAt?: number; slowAt?: number; patchAt?: number; behindAt?: number }> = ({
  life, dripAt = 20, moreAt = 130, slowAt = 270, patchAt = 400, behindAt = 520,
}) => {
  const f = useCurrentFrame();
  const rate = f < moreAt ? 1 : f < patchAt ? 1.8 : f < behindAt ? 1.35 : 2.4;
  const prog = Math.min(1, (Math.max(0, f - dripAt) * 0.0006) * rate + (f > moreAt ? 0.08 : 0));
  const H = 520;
  return (
    <AbsoluteFill style={{ background: INK, overflow: "hidden" }}>
      <BgClip clip="raw" ss={170} life={life} dim={0.22} />
      <Halftone o={0.2} />
      <Title at={2} y={210} size={78} c={CREAM} sub="UM POUCO A CADA SEGUNDO">ASSOMBRADA → SEGURA</Title>
      {/* dois potes */}
      {[
        { x: 120, c: GHOST, t: "ASSOMBRADA", v: 1 - prog },
        { x: 640, c: GREEN, t: "SEGURA", v: prog },
      ].map((p) => (
        <div key={p.t} style={{ position: "absolute", left: p.x, top: 460, width: 320 }}>
          <div style={{ position: "relative", width: 320, height: H, borderRadius: 30, border: `6px solid ${p.c}`, overflow: "hidden", background: "rgba(0,0,0,0.5)" }}>
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: `${p.v * 100}%`, background: `linear-gradient(180deg, ${p.c}, ${p.c}66)` }} />
          </div>
          <Sub c={p.c} size={28} style={{ textAlign: "center", marginTop: 12 }}>{p.t}</Sub>
        </div>
      ))}
      {/* gotas passando */}
      {Array.from({ length: 4 }).map((_, i) => {
        const t = ((f - dripAt) * 0.03 * rate + i / 4) % 1;
        return f >= dripAt ? <Orb key={i} x={460 + t * 160} y={700 - Math.sin(t * Math.PI) * 90} s={36} c={t < 0.5 ? GHOST : GREEN} /> : null;
      })}
      {f >= slowAt && f < patchAt ? <Hand at={slowAt} x={90} y={1080} size={64} c={CREAM} rot={-3} w={900} center>…mas é devagar</Hand> : null}
      {f >= patchAt && f < behindAt ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 1060, display: "flex", justifyContent: "center" }}>
          <Stamp text="PATCH 30/10: −25%" at={patchAt} size={70} rot={-4} sub="MAIS LENTO" />
        </div>
      ) : null}
      {f >= behindAt ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 1060, display: "flex", justifyContent: "center" }}>
          <Stamp text="TIME ATRÁS: +50%" at={behindAt} size={70} rot={4} c={GREEN} sub="MAIS RÁPIDO" />
        </div>
      ) : null}
      <Grain />
      <Flash f={f} ts={[patchAt, behindAt]} pk={0.2} />
    </AbsoluteFill>
  );
};

// ========== 12) morreu com alma assombrada: pouca some · muita cai num SACO de alma (soco forte, 3 min) ==========
export const FMDeath: React.FC<{ life: number; dieAt?: number; twoAt?: number; poofAt?: number; bagAt?: number; punchAt?: number; enemyAt?: number; timerAt?: number; runAt?: number }> = ({
  life, dieAt = 10, twoAt = 100, poofAt = 170, bagAt = 290, punchAt = 460, enemyAt = 500, timerAt = 690, runAt = 800,
}) => {
  const f = useCurrentFrame();
  const phaseBag = f >= bagAt - 60;
  const grabbed = f >= enemyAt + 10 && f < timerAt - 8;
  const tLeft = Math.max(0, 180 - Math.max(0, f - timerAt) * 2);
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${1.06 + punchZ(f, [dieAt, punchAt], 0.07, 10)})`, filter: `grayscale(${f >= dieAt ? 0.8 : 0}) brightness(0.4)` }}>
        <Clip clip="k4" ss={100} life={life} />
      </AbsoluteFill>
      <Vignette o={0.6} />
      <Title at={dieAt} y={210} size={84} c={STAMP} sub="ANTES DA ALMA FICAR SEGURA">VOCÊ MORREU</Title>
      {!phaseBag ? (
        <div style={{ position: "absolute", left: 70, right: 70, top: 520, display: "flex", gap: 30 }}>
          {f >= twoAt ? (
            <Panel x={0} y={0} w={440} h={520} c={GHOST} style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18, transform: `scale(${back(f, twoAt, 10, 1.6)})` }}>
              <Sub c={GHOST} size={28}>POUQUINHA ALMA</Sub>
              <div style={{ position: "relative", width: 160, height: 160 }}>
                <Orb x={80} y={80} s={110} c={GHOST} o={1 - ease(f, poofAt, 10)} />
              </div>
              {f >= poofAt ? <Big size={70} c={STAMP}>SOME</Big> : null}
            </Panel>
          ) : null}
          {f >= twoAt + 8 ? (
            <Panel x={0} y={0} w={440} h={520} c={AMBER} style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18, transform: `scale(${back(f, twoAt + 8, 10, 1.6)})` }}>
              <Sub c={AMBER} size={28}>MUITA ALMA</Sub>
              <div style={{ fontSize: 120 }}>💰</div>
              <Big size={56}>SACO NO CHÃO</Big>
            </Panel>
          ) : null}
        </div>
      ) : (
        <>
          {/* o saco no chão, onde você morreu */}
          {!grabbed ? (
            <div style={{ position: "absolute", left: 540 - 140, top: 640, width: 280, height: 280, transform: `scale(${back(f, bagAt - 60, 12, 1.5) * (f >= punchAt && f < punchAt + 5 ? 0.85 : 1)}) translateY(${Math.sin(f / 10) * 8}px)` }}>
              <svg width={280} height={280} viewBox="0 0 100 100">
                <path d="M30 30 C20 50 14 90 50 92 C86 90 80 50 70 30 Z" fill={GHOST} stroke="#fff" strokeWidth={3} />
                <path d="M34 30 Q50 18 66 30" fill="none" stroke="#fff" strokeWidth={4} />
                <circle cx={50} cy={62} r={14} fill={SOUL} opacity={0.8} />
              </svg>
            </div>
          ) : null}
          {f >= punchAt && f < enemyAt ? <Big size={90} c={CREAM} style={{ position: "absolute", left: 0, right: 0, top: 960, textAlign: "center" }}>SOCO FORTE PEGA</Big> : null}
          {f >= enemyAt && f < timerAt ? (
            <div style={{ position: "absolute", left: 0, right: 0, top: 940, display: "flex", justifyContent: "center" }}>
              <Stamp text="ATÉ O INIMIGO" at={enemyAt} size={80} rot={-5} c={ORANGE} />
            </div>
          ) : null}
          {f >= timerAt ? (
            <div style={{ position: "absolute", left: 0, right: 0, top: 460, textAlign: "center", transform: `scale(${back(f, timerAt, 10, 1.8)})` }}>
              <Big size={120} c={AMBER}>⏱ {Math.floor(tLeft / 60)}:{String(tLeft % 60).padStart(2, "0")}</Big>
            </div>
          ) : null}
          {f >= runAt ? <Hand at={runAt} x={90} y={1130} size={64} c={GREEN} rot={-3} w={900} center>aliado morreu? corre buscar!</Hand> : null}
        </>
      )}
      <Grain o={0.07} />
      <Flash f={f} ts={[dieAt, punchAt, enemyAt]} pk={0.3} />
    </AbsoluteFill>
  );
};

// ========== 13) o nível você não perde ==========
export const FMLevel: React.FC<{ life: number; keepAt?: number }> = ({ life, keepAt = 150 }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: INK, overflow: "hidden" }}>
      <BgClip clip="k4" ss={60} life={life} dim={0.25} />
      <Halftone o={0.2} />
      <div style={{ position: "absolute", left: 540 - 200, top: 460, width: 400, height: 400, transform: `scale(${back(f, 2, 12, 1.5)})` }}>
        <svg width={400} height={400} viewBox="0 0 100 100">
          <polygon points="50,4 94,28 94,72 50,96 6,72 6,28" fill={TEAL} stroke={SOUL} strokeWidth={4} />
          <text x={50} y={46} textAnchor="middle" fontFamily={BODY} fontWeight={900} fontSize={10} fill={SOUL} letterSpacing={2}>NÍVEL</text>
          <text x={50} y={74} textAnchor="middle" fontFamily={POSTER} fontSize={30} fill={CREAM}>23</text>
        </svg>
      </div>
      <Title at={2} y={230} size={80} c={CREAM}>E O NÍVEL?</Title>
      {f >= keepAt ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 960, display: "flex", justifyContent: "center" }}>
          <Stamp text="ESSE VOCÊ NÃO PERDE" at={keepAt} size={74} rot={-4} c={GREEN} />
        </div>
      ) : null}
      <Grain />
    </AbsoluteFill>
  );
};

// ========== 14) a loja gasta a SEGURA primeiro: item barato não salva; compra o do valor mais perto ==========
export const FMShop: React.FC<{ life: number; prioAt?: number; allAt?: number; cheapAt?: number; bestAt?: number }> = ({ life, prioAt = 150, allAt = 280, cheapAt = 400, bestAt = 520 }) => {
  const f = useCurrentFrame();
  const SAFE = 3000, HAUNT = 2400;
  const buyCheap = f >= cheapAt + 10 && f < bestAt;
  const buyBest = f >= bestAt + 30;
  const spent = buyBest ? 5200 : buyCheap ? 800 : 0;
  const safeLeft = Math.max(0, SAFE - spent);
  const hauntLeft = Math.max(0, HAUNT - Math.max(0, spent - SAFE));
  const item = (x: number, at: number, name: string, price: number, c: string, on: boolean) =>
    f < at ? null : (
      <Panel x={x} y={830} w={440} h={250} c={on ? c : `${CREAM}66`} style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 8, transform: `scale(${back(f, at, 10, 1.5) * (on && f < at + 40 ? 1.04 : 1)})` }}>
        <Big size={54}>{name}</Big>
        <Big size={60} c={AMBER}>{num(price)}</Big>
      </Panel>
    );
  return (
    <AbsoluteFill style={{ background: INK, overflow: "hidden" }}>
      <BgClip clip="raw" ss={260} life={life} dim={0.22} />
      <Halftone o={0.2} />
      <Title at={2} y={210} size={80} c={CREAM} sub="CURIOSITY SHOP">A LOJA GASTA PRIMEIRO…</Title>
      {/* carteira */}
      <div style={{ position: "absolute", left: 70, top: 420, width: 940, display: "flex", gap: 24 }}>
        {[
          { t: "SEGURA", v: safeLeft, c: GREEN, first: true },
          { t: "ASSOMBRADA", v: hauntLeft, c: GHOST, first: false },
        ].map((w) => (
          <div key={w.t} style={{ flex: 1, padding: "22px 26px", borderRadius: 20, background: "rgba(8,14,14,0.9)", border: `4px solid ${w.c}`, boxShadow: w.first && f >= prioAt ? `0 0 34px ${w.c}88` : "none" }}>
            <Sub c={w.c} size={26}>{w.t}{w.first && f >= prioAt ? " · 1º" : ""}</Sub>
            <Big size={96}>{num(w.v)}</Big>
          </div>
        ))}
      </div>
      {item(70, cheapAt - 10, "ITEM BARATO", 800, STAMP, buyCheap)}
      {item(570, bestAt - 10, "ITEM CERTO", 5200, GREEN, buyBest)}
      {f >= allAt && f < cheapAt ? <Hand at={allAt} x={90} y={700} size={56} c={CREAM} rot={-3} w={900} center>a assombrada só sai se você gastar TUDO</Hand> : null}
      {buyCheap ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 1130, display: "flex", justifyContent: "center" }}>
          <Stamp text="NÃO SALVA NADA" at={cheapAt + 10} size={70} rot={-4} />
        </div>
      ) : null}
      {buyBest ? <Hand at={bestAt + 30} x={90} y={1140} size={60} c={GREEN} rot={-3} w={900} center>valor mais perto do que você tem ✓</Hand> : null}
      <Grain />
      <Flash f={f} ts={[cheapAt + 10, bestAt + 30]} pk={0.2} />
    </AbsoluteFill>
  );
};

// ========== 15) Urna: regras da entrega (sem parry, sem tirolesa, sem buraco) → andando ou dash ==========
export const FMUrnRules: React.FC<{ life: number; parryAt?: number; zipAt?: number; ventAt?: number; walkAt?: number; dashAt?: number }> = ({
  life, parryAt = 120, zipAt = 170, ventAt = 240, walkAt = 450, dashAt = 500,
}) => {
  const f = useCurrentFrame();
  const rows = [
    { t: "PARRY", at: parryAt, ok: false },
    { t: "TIROLESA", at: zipAt, ok: false },
    { t: "BURACO / ESGOTO", at: ventAt, ok: false },
    { t: "ANDANDO", at: walkAt, ok: true },
    { t: "DASH", at: dashAt, ok: true },
  ];
  return (
    <AbsoluteFill style={{ background: INK, overflow: "hidden" }}>
      <BgClip clip="raw" ss={280} life={life} dim={0.22} />
      <Halftone o={0.2} />
      <Title at={2} y={210} size={84} c={CREAM} sub="PRA ENTREGAR COM SEGURANÇA">COM A URNA NA MÃO</Title>
      {rows.map((r, i) =>
        f < r.at ? null : (
          <div key={r.t} style={{ position: "absolute", left: 110, top: 430 + i * 150, width: 860, height: 120, display: "flex", alignItems: "center", gap: 26, padding: "0 30px", borderRadius: 18,
            background: "rgba(8,14,14,0.9)", border: `4px solid ${r.ok ? GREEN : STAMP}`, transform: `translateX(${(1 - back(f, r.at, 10, 1.4)) * -500}px)` }}>
            <Check at={r.at + 3} ok={r.ok} s={70} />
            <Big size={64} c={r.ok ? CREAM : `${CREAM}cc`} style={{ textDecoration: r.ok ? "none" : "line-through", textDecorationColor: STAMP }}>{r.t}</Big>
          </div>
        ),
      )}
      <Grain />
    </AbsoluteFill>
  );
};

// ========== 16) LoL decide aos 15 min · Deadlock te paga pra voltar (+30%) → empata ==========
export const FMComeback: React.FC<{ life: number; lolAt?: number; minAt?: number; payAt?: number; p30At?: number; s1At?: number; s2At?: number; s3At?: number; eqAt?: number }> = ({
  life, lolAt = 190, minAt = 300, payAt = 470, p30At = 560, s1At = 650, s2At = 680, s3At = 720, eqAt = 950,
}) => {
  const f = useCurrentFrame();
  const dl_ = f >= payAt;
  const gap = interpolate(f, [p30At, eqAt], [0.62, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  return (
    <AbsoluteFill style={{ background: INK, overflow: "hidden" }}>
      <BgClip clip={dl_ ? "raw" : "lol_b"} ss={dl_ ? 300 : 120} life={life} dim={0.25} />
      <Halftone o={0.2} />
      {!dl_ ? (
        <>
          <Title at={2} y={220} size={80} c={CREAM}>POUCA GENTE SABE</Title>
          {f >= lolAt ? (
            <div style={{ position: "absolute", left: 140, top: 480, width: 800, transform: `scale(${interpolate(f, [lolAt, lolAt + 6], [1.6, 1], clamp)})` }}>
              <Img src={mg("lol_logo.png")} style={{ width: 800, height: 360, objectFit: "contain" }} />
            </div>
          ) : null}
          {f >= minAt ? (
            <div style={{ position: "absolute", left: 0, right: 0, top: 920, display: "flex", justifyContent: "center" }}>
              <Stamp text="DECIDIDO AOS 15 MIN" at={minAt} size={70} rot={-4} />
            </div>
          ) : null}
        </>
      ) : (
        <>
          <div style={{ position: "absolute", left: 190, top: 220, width: 700, transform: `scale(${interpolate(f, [payAt, payAt + 6], [1.6, 1], clamp)})` }}>
            <Img src={mg("dl_logo.png")} style={{ width: 700, height: 180, objectFit: "contain" }} />
          </div>
          <Big size={86} c={SOUL} style={{ position: "absolute", left: 0, right: 0, top: 420, textAlign: "center" }}>TE PAGA PRA VOLTAR</Big>
          {f >= p30At ? (
            <>
              <div style={{ position: "absolute", left: 0, right: 0, top: 560, textAlign: "center", transform: `scale(${back(f, p30At, 10, 2)})` }}>
                <Big size={160} c={GREEN}>+30%</Big>
              </div>
              <div style={{ position: "absolute", left: 120, right: 120, top: 760, display: "flex", justifyContent: "center", gap: 18 }}>
                {[
                  { t: "BAÚ", at: s1At },
                  { t: "FARM", at: s2At },
                  { t: "JUNGLE", at: s3At },
                ].map((x) => (f >= x.at ? <div key={x.t} style={{ padding: "8px 24px", borderRadius: 12, border: `3px solid ${GREEN}`, background: "rgba(8,14,14,0.9)", fontFamily: POSTER, fontSize: 50, color: CREAM, transform: `scale(${back(f, x.at, 8, 2)})` }}>{x.t}</div> : null))}
              </div>
              {/* barras: você encostando */}
              {[
                { t: "INIMIGO", v: 1, c: ORANGE },
                { t: "VOCÊ", v: gap, c: GREEN },
              ].map((b, i) => (
                <div key={b.t} style={{ position: "absolute", left: 110, top: 920 + i * 110, width: 860 }}>
                  <Sub c={b.c} size={24}>{b.t}</Sub>
                  <div style={{ height: 50, borderRadius: 12, background: "rgba(255,255,255,0.08)", overflow: "hidden", marginTop: 6 }}>
                    <div style={{ width: `${b.v * 100}%`, height: "100%", background: b.c }} />
                  </div>
                </div>
              ))}
            </>
          ) : null}
        </>
      )}
      <Grain />
      <Flash f={f} ts={[lolAt, payAt]} pk={0.25} />
    </AbsoluteFill>
  );
};

// ========== 17) atrás? prioridade: farm de minion · farm de alma · NÃO MORRER ==========
export const FMPriority: React.FC<{ life: number; m1At?: number; m2At?: number; m3At?: number; awayAt?: number }> = ({ life, m1At = 220, m2At = 260, m3At = 310, awayAt = 450 }) => {
  const f = useCurrentFrame();
  const rows = [
    { t: "FARM DE MINION", at: m1At, c: GREEN },
    { t: "FARM DE ALMA", at: m2At, c: SOUL },
    { t: "NÃO MORRER", at: m3At, c: STAMP },
  ];
  return (
    <AbsoluteFill style={{ background: INK, overflow: "hidden" }}>
      <BgClip clip="k4" ss={200} life={life} dim={0.22} />
      <Halftone o={0.2} />
      <Title at={2} y={220} size={84} c={CREAM} sub="O TIME PERDENDO TEM VANTAGEM">TÁ ATRÁS? PRIORIZA</Title>
      {rows.map((r, i) =>
        f < r.at ? null : (
          <div key={r.t} style={{ position: "absolute", left: 110, top: 470 + i * 190, width: 860, height: 150, display: "flex", alignItems: "center", gap: 30, padding: "0 34px", borderRadius: 20,
            background: "rgba(8,14,14,0.92)", border: `5px solid ${r.c}`, transform: `scale(${back(f, r.at, 10, 1.6)})` }}>
            <Big size={90} c={r.c}>{i + 1}</Big>
            <Big size={76}>{r.t}</Big>
          </div>
        ),
      )}
      {f >= awayAt ? <Hand at={awayAt} x={90} y={1080} size={58} c={CREAM} rot={-3} w={900} center>morto = alma que você não pega</Hand> : null}
      <Grain />
    </AbsoluteFill>
  );
};

// ========== 18) resumo ==========
export const FMRecap: React.FC<{ life: number; r1At?: number; r2At?: number; r3At?: number; r4At?: number; r5At?: number; r6At?: number; r7At?: number }> = ({
  life, r1At = 30, r2At = 120, r3At = 210, r4At = 280, r5At = 340, r6At = 420, r7At = 660,
}) => {
  const f = useCurrentFrame();
  const R = [
    { t: "VERDE: CONFIRMA", c: GREEN, at: r1At },
    { t: "LARANJA: NEGA", c: ORANGE, at: r2At },
    { t: "DUPLA RENDE", c: GREEN, at: r3At },
    { t: "TRIO TIRA", c: STAMP, at: r4At },
    { t: "JUNGLE: SÓ QUANDO SEGURA", c: GHOST, at: r5At },
    { t: "SACO NO CHÃO: VAI BUSCAR", c: AMBER, at: r6At },
    { t: "URNA: COM O TIME", c: SOUL, at: r7At },
  ];
  return (
    <AbsoluteFill style={{ background: INK, overflow: "hidden" }}>
      <BgClip clip="raw" ss={30} life={life} dim={0.22} />
      <Halftone o={0.2} />
      <Title at={2} y={200} size={90} c={CREAM}>RESUMINDO</Title>
      {R.map((r, i) =>
        f < r.at ? null : (
          <div key={r.t} style={{ position: "absolute", left: 90, top: 340 + i * 128, width: 900, height: 104, display: "flex", alignItems: "center", gap: 22, padding: "0 26px", borderRadius: 16,
            background: "rgba(8,14,14,0.92)", border: `4px solid ${r.c}`, transform: `translateX(${(1 - back(f, r.at, 10, 1.4)) * -500}px)` }}>
            <Check at={r.at + 3} s={56} />
            <Big size={52}>{r.t}</Big>
          </div>
        ),
      )}
      <Grain />
    </AbsoluteFill>
  );
};

// ========== 19) próximo episódio: itens e build pra counterar (cura, ult do Seven, ult da enfermeira) ==========
export const FMNext: React.FC<{ life: number; buildAt?: number; healAt?: number; sevenAt?: number; nurseAt?: number }> = ({ life, buildAt = 200, healAt = 370, sevenAt = 450, nurseAt = 510 }) => {
  const f = useCurrentFrame();
  const threats = [
    { t: "MUITA CURA", at: healAt, c: GREEN },
    { t: "ULT DO SEVEN", at: sevenAt, c: SAPPH },
    { t: "ULT DA ENFERMEIRA", at: nurseAt, c: GHOST },
  ];
  return (
    <AbsoluteFill style={{ background: INK, overflow: "hidden" }}>
      <BgClip clip="k4" ss={220} life={life} dim={0.22} />
      <Halftone o={0.2} />
      <Panel x={110} y={230} w={860} h={330} c={SOUL} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, transform: `scale(${back(f, 2, 12, 1.4)})` }}>
        <Sub size={30}>PRÓXIMO EPISÓDIO · 3</Sub>
        <Big size={120}>ITENS</Big>
        {f >= buildAt ? <Sub c={CREAM} size={30}>A BUILD PRA COUNTERAR</Sub> : null}
      </Panel>
      {threats.map((x, i) =>
        f < x.at ? null : (
          <div key={x.t} style={{ position: "absolute", left: 150, top: 640 + i * 150, width: 780, height: 120, display: "flex", alignItems: "center", gap: 24, padding: "0 30px", borderRadius: 18,
            background: "rgba(8,14,14,0.92)", border: `4px solid ${x.c}`, transform: `scale(${back(f, x.at, 10, 1.6)})` }}>
            <Big size={60} c={x.c}>VS</Big>
            <Big size={60}>{x.t}</Big>
          </div>
        ),
      )}
      <Grain />
    </AbsoluteFill>
  );
};
