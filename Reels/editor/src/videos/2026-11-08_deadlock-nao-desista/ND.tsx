import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, Loop, OffthreadVideo, random, Sequence, staticFile, useCurrentFrame } from "remotion";
import { DLMapa } from "../../lib/dlmapa";
import { loadFont as loadAnton } from "@remotion/google-fonts/Anton";
import { loadFont as loadBody } from "@remotion/google-fonts/NunitoSans";
import { loadFont as loadHand } from "@remotion/google-fonts/Caveat";
import CL from "../2026-11-06_deadlock-magia/clips.json";
import LITE from "../2026-11-06_deadlock-magia/clips_lite.json";
import { LiteCtx } from "../../lib/sfx-ctx";

// "Não desista" (08/11/2026). Mesma linguagem do "objetivos do mapa": Linguagem do Magia v2, que ele aprovou: material REAL (arte oficial da deadlock.wiki,
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

// ========== 1) gancho: tomou um atropelo na 1ª partida (placar 0/12/0, ATROPELADO) ==========
export const NDHook: React.FC<{ life: number; deathAt?: number; clip?: string; ss?: number }> = ({ life, deathAt = 70, clip = "raw", ss = 140 }) => {
  const f = useCurrentFrame();
  const hit = f >= deathAt;
  const z = 1.04 + interpolate(f, [0, life], [0, 0.07], clamp) + punchZ(f, [deathAt], 0.14, 10);
  const sh = shake(f, deathAt, 22, 12, "nd");
  const kd = back(f, deathAt + 4, 10, 1.6);
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `translate(${sh.x}px, ${sh.y}px) scale(${z}) rotate(${hit ? -2 : 0}deg)`, filter: `grayscale(${hit ? 0.85 : 0}) brightness(${hit ? 0.6 : 0.95})` }}>
        <Clip clip={clip} ss={ss} life={life} />
      </AbsoluteFill>
      {hit ? <AbsoluteFill style={{ background: `radial-gradient(ellipse 70% 60% at 50% 45%, rgba(216,69,47,0) 40%, rgba(216,69,47,${0.45 * ease(f, deathAt, 6)}) 100%)` }} /> : null}
      <Vignette o={0.55} />
      {/* placar da primeira partida */}
      {hit ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 300, display: "flex", justifyContent: "center", transform: `scale(${kd})` }}>
          <div style={{ background: "rgba(8,14,14,0.9)", border: `3px solid ${CREAM}`, borderRadius: 18, padding: "18px 40px", textAlign: "center", boxShadow: "0 20px 50px rgba(0,0,0,0.7)" }}>
            <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 28, letterSpacing: 8, color: SOUL }}>SUA 1ª PARTIDA</div>
            <div style={{ fontFamily: POSTER, fontSize: 130, lineHeight: 1.05, color: CREAM, letterSpacing: 4 }}>
              0 / <span style={{ color: STAMP }}>{Math.min(12, Math.max(0, Math.floor((f - deathAt - 4) / 1.6)))}</span> / 0
            </div>
            <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 26, letterSpacing: 6, color: `${CREAM}aa` }}>ABATES · MORTES · ASSIST.</div>
          </div>
        </div>
      ) : null}
      {hit ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 700, display: "flex", justifyContent: "center" }}>
          <Stamp text="ATROPELADO" at={deathAt + 26} size={110} rot={-7} />
        </div>
      ) : null}
      <Grain o={0.07} />
      <Flash f={f} ts={[0, deathAt]} pk={0.45} />
    </AbsoluteFill>
  );
};

// ========== 2) o pedido: paciência · estuda · joga (três linhas que acendem na fala) ==========
const Ico: React.FC<{ k: number; c: string }> = ({ k, c }) => {
  const st = { fill: "none", stroke: c, strokeWidth: 5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg width={96} height={96} viewBox="0 0 48 48">
      {k === 0 ? <><path d="M12 6 H36 M12 42 H36" {...st} /><path d="M14 6 C14 18 34 22 34 42 M34 6 C34 18 14 22 14 42" {...st} /><path d="M18 38 H30" {...st} strokeWidth={7} /></> : null}
      {k === 1 ? <><path d="M6 10 C14 8 20 10 24 14 C28 10 34 8 42 10 V38 C34 36 28 38 24 41 C20 38 14 36 6 38 Z" {...st} /><path d="M24 14 V41" {...st} /></> : null}
      {k === 2 ? <><rect x={5} y={14} width={38} height={22} rx={11} {...st} /><path d="M14 21 V29 M10 25 H18" {...st} /><circle cx={32} cy={23} r={1.6} fill={c} /><circle cx={36} cy={28} r={1.6} fill={c} /></> : null}
    </svg>
  );
};
export const NDAsk: React.FC<{ life: number; pacAt?: number; studyAt?: number; playAt?: number }> = ({ life, pacAt = 50, studyAt = 70, playAt = 100 }) => {
  const f = useCurrentFrame();
  const rows = [
    { t: "TENHA PACIÊNCIA", at: pacAt },
    { t: "ESTUDA UM POUCO", at: studyAt },
    { t: "JOGA MAIS UM POUCO", at: playAt },
  ];
  return (
    <AbsoluteFill style={{ background: INK, overflow: "hidden" }}>
      <BgClip clip="k4" ss={120} life={life} dim={0.3} />
      <Halftone o={0.2} />
      <Title at={2} y={210} size={92} c={CREAM} sub="UM PEDIDO, DE VERDADE">CARA, EU TE PEÇO:</Title>
      {rows.map((r, i) => {
        const on = f >= r.at;
        const e = back(f, r.at, 10, 1.5);
        return (
          <div key={r.t} style={{ position: "absolute", left: 70, width: 860, top: 480 + i * 240, height: 200, display: "flex", alignItems: "center", gap: 34, padding: "0 34px",
            borderRadius: 22, background: on ? "rgba(10,40,36,0.92)" : "rgba(8,14,14,0.6)", border: `4px solid ${on ? SOUL : `${CREAM}33`}`, transform: `translateX(${on ? 0 : -40}px) scale(${on ? 0.9 + 0.1 * e : 0.92})`,
            opacity: on ? 1 : 0.35, boxShadow: on ? `0 0 40px ${SOUL}44` : "none" }}>
            <Ico k={i} c={on ? SOUL : CREAM} />
            <div style={{ fontFamily: POSTER, fontSize: 64, color: CREAM, letterSpacing: 1, whiteSpace: "nowrap" }}>{r.t}</div>
            {on ? <div style={{ marginLeft: "auto", width: 62, height: 62, borderRadius: "50%", background: SOUL, color: INK, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: BODY, fontWeight: 900, fontSize: 40,
              transform: `scale(${back(f, r.at + 4, 8, 2.2)})` }}>✓</div> : null}
          </div>
        );
      })}
      <Grain />
      <Flash f={f} ts={[0]} pk={0.3} />
    </AbsoluteFill>
  );
};

// ========== 3) "vai ser tão grande quanto o LoL": logo do Deadlock cresce até o tamanho do LoL, "=" bate ==========
export const NDVs: React.FC<{ life: number; dlAt?: number; eqAt?: number }> = ({ life, dlAt = 50, eqAt = 100 }) => {
  const f = useCurrentFrame();
  const grow = interpolate(f, [dlAt, eqAt], [0.45, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const eq = back(f, eqAt, 10, 2);
  const sh = shake(f, eqAt, 14, 10, "eq");
  return (
    <AbsoluteFill style={{ background: INK, overflow: "hidden" }}>
      <AbsoluteFill style={{ opacity: 0.55 }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: 540, height: 1920, overflow: "hidden" }}><BgClip clip="lol_b" ss={90} life={life} dim={0.45} blur={4} /></div>
        <div style={{ position: "absolute", left: 540, top: 0, width: 540, height: 1920, overflow: "hidden" }}><BgClip clip="raw" ss={220} life={life} dim={0.45} blur={4} /></div>
      </AbsoluteFill>
      <div style={{ position: "absolute", left: 537, top: 0, width: 6, height: 1920, background: CREAM, opacity: 0.6 }} />
      <Title at={2} y={210} size={84} c={CREAM} sub="QUANDO O DEADLOCK FOR LANÇADO">TÃO GRANDE QUANTO</Title>
      <div style={{ position: "absolute", left: 0, width: 540, top: 560, height: 400, display: "flex", alignItems: "center", justifyContent: "center", transform: `translate(${sh.x}px, ${sh.y}px)` }}>
        <Img src={mg("lol_logo.png")} style={{ width: 420, height: 300, objectFit: "contain", filter: "drop-shadow(0 10px 30px #000)" }} />
      </div>
      {f >= dlAt ? (
        <div style={{ position: "absolute", left: 540, width: 540, top: 560, height: 400, display: "flex", alignItems: "center", justifyContent: "center", transform: `translate(${sh.x}px, ${sh.y}px) scale(${grow})` }}>
          <Img src={mg("dl_logo.png")} style={{ width: 460, height: 300, objectFit: "contain", filter: `drop-shadow(0 10px 30px #000) drop-shadow(0 0 ${20 * grow}px ${SOUL}88)` }} />
        </div>
      ) : null}
      {f >= eqAt ? (
        <div style={{ position: "absolute", left: 540 - 90, top: 680, width: 180, height: 160, borderRadius: 30, background: STAMP, border: `6px solid ${CREAM}`, display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: POSTER, fontSize: 150, color: CREAM, lineHeight: 1, transform: `scale(${eq}) rotate(-6deg)`, boxShadow: "0 16px 40px rgba(0,0,0,0.7)" }}>=</div>
      ) : null}
      <Grain />
      <Flash f={f} ts={[0, eqAt]} pk={0.35} />
    </AbsoluteFill>
  );
};

// ========== 4) quem entrar agora: jogar · pro player · streamer → vai virar o seu jogo → GRANA ==========
const PATHS = [
  { t: "JOGAR", clip: "raw", ss: 262, icon: "🎮" },
  { t: "PRO PLAYER", clip: "k4", ss: 180, icon: "🏆" },
  { t: "STREAMER", clip: "rat", ss: 160, icon: "🎥" },
];
export const NDPaths: React.FC<{ life: number; ondaAt?: number; a1At?: number; a2At?: number; a3At?: number; jogoAt?: number; moneyAt?: number }> = ({
  life, ondaAt = 20, a1At = 100, a2At = 140, a3At = 180, jogoAt = 220, moneyAt = 310,
}) => {
  const f = useCurrentFrame();
  const ats = [a1At, a2At, a3At];
  const yours = f >= jogoAt;
  return (
    <AbsoluteFill style={{ background: INK, overflow: "hidden" }}>
      <BgClip clip="raw" ss={20} life={life} dim={0.28} />
      <Halftone o={0.2} />
      <Title at={ondaAt} y={200} size={86} c={CREAM} sub="QUEM ENTRAR AGORA NESSA ONDA">3 CAMINHOS</Title>
      {PATHS.map((p, i) => {
        const at = ats[i];
        if (f < at) return null;
        const e = back(f, at, 10, 1.5);
        const lit = true;
        return (
          <div key={p.t} style={{ position: "absolute", left: 70, width: 940, top: 450 + i * 270, height: 240, borderRadius: 22, overflow: "hidden", border: `5px solid ${yours ? SOUL : CREAM}`,
            transform: `translateX(${(1 - e) * (i % 2 ? 300 : -300)}px) rotate(${(i - 1) * 1.2}deg)`, opacity: lit ? 1 : 0.4, boxShadow: yours ? `0 0 30px ${SOUL}66` : "0 14px 30px rgba(0,0,0,0.6)" }}>
            <Clip clip={p.clip} ss={p.ss} life={life} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(8,14,14,0.92) 0%, rgba(8,14,14,0.6) 55%, rgba(8,14,14,0.1) 100%)" }} />
            <div style={{ position: "absolute", left: 34, top: 0, bottom: 0, display: "flex", alignItems: "center", gap: 24 }}>
              <div style={{ fontSize: 86 }}>{p.icon}</div>
              <div style={{ fontFamily: POSTER, fontSize: 92, color: CREAM, letterSpacing: 2 }}>{p.t}</div>
            </div>
          </div>
        );
      })}
      {yours && f < moneyAt ? <Hand at={jogoAt} x={90} y={1270 - 70} size={64} c={SOUL} rot={-3} w={900} center>…vai virar o SEU jogo</Hand> : null}
      {/* grana: moedas caindo + carimbo */}
      {f >= moneyAt
        ? Array.from({ length: 22 }).map((_, i) => {
            const t = f - moneyAt - (i % 7) * 2;
            if (t < 0) return null;
            const x = 40 + random(`mx${i}`) * 1000, y = -120 + t * (22 + random(`mv${i}`) * 14);
            return <div key={i} style={{ position: "absolute", left: x, top: y, fontSize: 70, transform: `rotate(${t * (random(`mr${i}`) - 0.5) * 20}deg)` }}>{i % 3 ? "🪙" : "💵"}</div>;
          })
        : null}
      {f >= moneyAt ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 1150, display: "flex", justifyContent: "center" }}>
          <Stamp text="MUITA GRANA" at={moneyAt + 4} size={100} rot={-6} c={AMBER} />
        </div>
      ) : null}
      <Grain />
      <Flash f={f} ts={[0, moneyAt]} pk={0.3} />
    </AbsoluteFill>
  );
};

// ========== 5) "essa ideia já aconteceu": perfil dele com o link da bio → Discord ==========
const DiscordMark: React.FC<{ s?: number }> = ({ s = 90 }) => (
  <svg width={s} height={s * 0.76} viewBox="0 0 127 96">
    <path fill="#fff" d="M107.7 8.07A105 105 0 0 0 81.47 0a72 72 0 0 0-3.36 6.83 97.7 97.7 0 0 0-29.11 0A72 72 0 0 0 45.64 0a105.9 105.9 0 0 0-26.25 8.09C2.79 32.65-1.71 56.6.54 80.21a105.7 105.7 0 0 0 32.17 16.15 77.7 77.7 0 0 0 6.89-11.11 68.4 68.4 0 0 1-10.85-5.18c.91-.66 1.8-1.34 2.66-2a75.6 75.6 0 0 0 64.32 0c.87.71 1.76 1.39 2.66 2a68.7 68.7 0 0 1-10.87 5.19 77 77 0 0 0 6.89 11.1 105.3 105.3 0 0 0 32.19-16.14c2.64-27.38-4.51-51.11-18.9-72.15ZM42.45 65.69C36.18 65.69 31 60 31 53s5-12.74 11.43-12.74S54 46 53.89 53s-5.05 12.69-11.44 12.69Zm42.24 0C78.41 65.69 73.25 60 73.25 53s5-12.74 11.44-12.74S96.23 46 96.12 53s-5.04 12.69-11.43 12.69Z" />
  </svg>
);
export const NDBio: React.FC<{ life: number; bioAt?: number; discordAt?: number }> = ({ life, bioAt = 60, discordAt = 85 }) => {
  const f = useCurrentFrame();
  const card = back(f, 0, 12, 1.3);
  const tap = f >= bioAt + 6 && f < bioAt + 11 ? 0.94 : 1;
  const d = back(f, discordAt, 12, 1.5);
  return (
    <AbsoluteFill style={{ background: INK, overflow: "hidden" }}>
      <BgClip clip="rat" ss={80} life={life} dim={0.3} />
      <Halftone o={0.2} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 190, display: "flex", justifyContent: "center" }}><Stamp text="JÁ ACONTECEU" at={3} size={64} rot={-4} c={SOUL} /></div>
      <div style={{ position: "absolute", left: 110, top: 300, width: 860, transform: `scale(${card})`, background: "#121212", borderRadius: 34, border: "2px solid #2a2a2a", padding: "40px 40px 46px", boxShadow: "0 30px 70px rgba(0,0,0,0.7)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 30 }}>
          <Img src={dl("blies.jpg")} style={{ width: 170, height: 170, borderRadius: "50%", objectFit: "cover", border: "5px solid #fe2c55" }} />
          <div>
            <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 56, color: "#fff" }}>Blies</div>
            <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 30, color: "#aaa" }}>Deadlock todo dia · live</div>
          </div>
        </div>
        <div style={{ marginTop: 34, fontFamily: BODY, fontWeight: 700, fontSize: 32, color: "#ddd" }}>a maior comunidade de Deadlock do Brasil 🇧🇷</div>
        <div style={{ marginTop: 22, display: "inline-flex", alignItems: "center", gap: 14, padding: "14px 26px", borderRadius: 14, background: f >= bioAt ? "#2b2b2b" : "transparent", transform: `scale(${tap})`,
          border: f >= bioAt ? `3px solid ${SOUL}` : "3px solid transparent", boxShadow: f >= bioAt ? `0 0 26px ${SOUL}66` : "none" }}>
          <span style={{ fontSize: 34 }}>🔗</span>
          <span style={{ fontFamily: BODY, fontWeight: 900, fontSize: 40, color: "#fff" }}>bio.blies.live</span>
        </div>
      </div>
      {f >= bioAt - 6 && f < discordAt + 6 ? (
        <div style={{ position: "absolute", left: 330 + interpolate(f, [bioAt - 6, bioAt + 4], [300, 0], clamp), top: 820 + interpolate(f, [bioAt - 6, bioAt + 4], [200, 0], clamp), fontSize: 90, transform: `scale(${tap})` }}>👆</div>
      ) : null}
      {f >= discordAt ? (
        <div style={{ position: "absolute", left: 140, top: 1000, width: 800, height: 210, borderRadius: 30, background: "#5865F2", transform: `scale(${d}) rotate(-2deg)`, display: "flex", alignItems: "center", gap: 30, padding: "0 46px",
          boxShadow: "0 24px 60px rgba(0,0,0,0.6)" }}>
          <DiscordMark s={120} />
          <div>
            <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 30, letterSpacing: 4, color: "#e0e3ff" }}>SERVIDOR DO DISCORD</div>
            <div style={{ fontFamily: POSTER, fontSize: 70, color: "#fff", lineHeight: 1.05 }}>DEADLOCK BRASIL</div>
          </div>
        </div>
      ) : null}
      <Grain />
      <Flash f={f} ts={[0, discordAt]} pk={0.3} />
    </AbsoluteFill>
  );
};

// ========== faixa fixa bio.blies.live (08/11, pedido dele): fica na tela do fim do NDBio até o fim, para dar tempo de anotar.
// Lane 2, logo acima da legenda (y 1370), dentro da zona segura; entra deslizando e pulsa de leve a cada ~4 s.
export const NDUrl: React.FC<{ life: number }> = ({ life }) => {
  const f = useCurrentFrame();
  const inn = back(f, 0, 14, 1.4);
  const out = interpolate(f, [life * FPS - 8, life * FPS], [1, 0], clamp);
  const k = f % 120;
  const pulse = k < 14 ? 1 + 0.05 * Math.sin((k / 14) * Math.PI) : 1;
  const glow = k < 20 ? 1 - k / 20 : 0;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1212, display: "flex", justifyContent: "center", opacity: out }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, padding: "14px 30px 14px 16px", borderRadius: 999, background: "rgba(11,20,18,0.92)",
          border: `3px solid ${SOUL}`, boxShadow: `0 14px 40px rgba(0,0,0,0.65), 0 0 ${18 + 30 * glow}px ${SOUL}${glow > 0 ? "aa" : "55"}`,
          transform: `translateY(${(1 - inn) * 160}px) scale(${pulse})` }}>
          <div style={{ width: 66, height: 66, borderRadius: "50%", background: "#5865F2", display: "grid", placeItems: "center" }}><DiscordMark s={42} /></div>
          <div style={{ lineHeight: 1 }}>
            <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 22, letterSpacing: 3, color: "#9fd9cf" }}>DISCORD NO LINK DA BIO</div>
            <div style={{ fontFamily: POSTER, fontSize: 56, color: "#fff", marginTop: 4 }}>bio.blies.live</div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ========== 6) TikTok · roxinha · vermelhinha: as três telas AO VIVO transmitindo campeonato ==========
const TwitchMark: React.FC<{ s?: number }> = ({ s = 90 }) => (
  <svg width={s} height={s} viewBox="0 0 64 64">
    <path d="M10 4 L6 14 V54 H18 V62 H26 L34 54 H44 L58 40 V4 Z" fill="#fff" />
    <path d="M14 10 H52 V38 L44 46 H32 L24 54 V46 H14 Z" fill="#9146FF" />
    <rect x={30} y={18} width={5} height={14} fill="#fff" /><rect x={42} y={18} width={5} height={14} fill="#fff" />
  </svg>
);
export const NDLive: React.FC<{ life: number; tkAt?: number; twAt?: number; ytAt?: number; campAt?: number }> = ({ life, tkAt = 20, twAt = 70, ytAt = 95, campAt = 140 }) => {
  const f = useCurrentFrame();
  const P = [
    { at: tkAt, bg: "#000", ring: "#fe2c55", name: "TIKTOK", logo: <Img src={mg("tiktok.png")} style={{ width: 90, height: 90, objectFit: "contain" }} />, clip: "raw", ss: 150 },
    { at: twAt, bg: "#9146FF", ring: "#bf94ff", name: "A ROXINHA", logo: <TwitchMark s={90} />, clip: "k4", ss: 50, sub: "Twitch" },
    { at: ytAt, bg: "#ff0000", ring: "#ff7b7b", name: "A VERMELHINHA", logo: <Img src={mg("youtube.png")} style={{ width: 100, height: 80, objectFit: "contain" }} />, clip: "rat", ss: 20, sub: "YouTube" },
  ];
  const camp = f >= campAt;
  return (
    <AbsoluteFill style={{ background: INK, overflow: "hidden" }}>
      <Halftone o={0.2} />
      <Souls n={12} o={0.4} />
      {P.map((p, i) => {
        if (f < p.at) return null;
        const e = back(f, p.at, 10, 1.5);
        const y = 200 + i * 360;
        return (
          <div key={p.name} style={{ position: "absolute", left: 60, width: 960, top: y, height: 330, borderRadius: 24, overflow: "hidden", border: `5px solid ${p.ring}`, transform: `scale(${e}) rotate(${(i - 1) * -1.2}deg)`,
            boxShadow: `0 0 34px ${p.ring}55` }}>
            <Clip clip={p.clip} ss={p.ss} life={life} />
            <div style={{ position: "absolute", inset: 0, background: `linear-gradient(90deg, ${p.bg}ee 0%, ${p.bg}88 38%, rgba(0,0,0,0) 70%)` }} />
            <div style={{ position: "absolute", left: 30, top: 0, bottom: 0, display: "flex", alignItems: "center", gap: 22 }}>
              {p.logo}
              <div>
                <div style={{ fontFamily: POSTER, fontSize: 70, color: "#fff", lineHeight: 1 }}>{p.name}</div>
                {p.sub ? <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 28, color: "#ffffffcc" }}>({p.sub})</div> : null}
              </div>
            </div>
            <div style={{ position: "absolute", right: 24, top: 20, background: "#e91916", color: "#fff", fontFamily: BODY, fontWeight: 900, fontSize: 26, letterSpacing: 3, padding: "6px 14px", borderRadius: 8,
              opacity: 0.6 + 0.4 * Math.sin(f / 5) }}>● AO VIVO</div>
            {camp ? (
              <div style={{ position: "absolute", right: 24, bottom: 20, background: "rgba(8,14,14,0.88)", border: `2px solid ${CREAM}`, color: CREAM, fontFamily: BODY, fontWeight: 900, fontSize: 24, letterSpacing: 3, padding: "6px 14px", borderRadius: 8,
                transform: `scale(${back(f, campAt + i * 4, 8, 2)})` }}>🏆 CAMPEONATO DE DEADLOCK</div>
            ) : null}
          </div>
        );
      })}
      <Grain />
      <Flash f={f} ts={[tkAt, twAt, ytAt]} pk={0.2} />
    </AbsoluteFill>
  );
};

// ========== 7) "virar o Gaules do Deadlock": a foto dele ganha a coroa ==========
export const NDKing: React.FC<{ life: number; kingAt?: number }> = ({ life, kingAt = 30 }) => {
  const f = useCurrentFrame();
  const pic = back(f, 0, 12, 1.3);
  const crown = interpolate(f, [kingAt - 8, kingAt], [-500, 0], { ...clamp, easing: Easing.in(Easing.quad) });
  const sh = shake(f, kingAt, 18, 10, "kg");
  return (
    <AbsoluteFill style={{ background: INK, overflow: "hidden" }}>
      <BgClip clip="k4" ss={190} life={life} dim={0.3} />
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 50% 35% at 50% 45%, ${AMBER}55 0%, rgba(0,0,0,0) 70%)`, opacity: ease(f, kingAt, 10) }} />
      {f >= kingAt
        ? Array.from({ length: 16 }).map((_, i) => (
            <div key={i} style={{ position: "absolute", left: 540, top: 820, width: 8, height: 900, background: `linear-gradient(180deg, ${AMBER}aa, rgba(0,0,0,0))`, transformOrigin: "50% 0%",
              transform: `rotate(${i * 22.5 + f * 0.6}deg)`, opacity: 0.35 * ease(f, kingAt, 12) }} />
          ))
        : null}
      <div style={{ position: "absolute", left: 540 - 260, top: 560, width: 520, height: 520, transform: `translate(${sh.x}px, ${sh.y}px) scale(${pic})` }}>
        <Img src={dl("blies.jpg")} style={{ width: 520, height: 520, borderRadius: "50%", objectFit: "cover", border: `10px solid ${f >= kingAt ? AMBER : CREAM}`, boxShadow: `0 0 60px ${f >= kingAt ? AMBER : "#000"}` }} />
        {f >= kingAt - 8 ? <div style={{ position: "absolute", left: 120, top: -230 + crown, fontSize: 260, transform: "rotate(-10deg)", filter: "drop-shadow(0 12px 20px rgba(0,0,0,0.6))" }}>👑</div> : null}
      </div>
      <Title at={2} y={210} size={80} c={CREAM}>A MINHA IDEIA:</Title>
      {f >= kingAt ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 1130, display: "flex", justifyContent: "center" }}>
          <Stamp text="O GAULES DO DEADLOCK" at={kingAt + 4} size={82} rot={-5} c={AMBER} />
        </div>
      ) : null}
      <Grain />
      <Flash f={f} ts={[0, kingAt]} pk={0.35} />
    </AbsoluteFill>
  );
};

// ========== 8) "dá mais uma chance" (UMA vez: 08/11 ele cortou as repetições, "repeti 3 vezes porque falei errado") → pro Deadlock → não vai se arrepender ==========
export const NDChance: React.FC<{ life: number; c1At?: number; dlAt?: number; regAt?: number }> = ({ life, c1At = 12, dlAt = 100, regAt = 150 }) => {
  const f = useCurrentFrame();
  const z = 1.05 + punchZ(f, [c1At, dlAt], 0.1, 9) + interpolate(f, [0, life], [0, 0.06], clamp);
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${z})`, filter: `brightness(${f >= dlAt ? 0.75 : 0.5})` }}>
        <Clip clip="raw" ss={230} life={life} />
      </AbsoluteFill>
      <Vignette o={0.6} />
      {f < dlAt ? (
        <>
          <Title at={c1At} y={430} size={150} c={CREAM}>DÁ MAIS UMA</Title>
          <Title at={c1At + 4} y={590} size={200} c={SOUL}>CHANCE</Title>
        </>
      ) : (
        <>
          <div style={{ position: "absolute", left: 140, top: 520, width: 800, transform: `scale(${interpolate(f, [dlAt, dlAt + 6], [2.2, 1], { ...clamp, easing: Easing.in(Easing.quad) })})` }}>
            <Img src={mg("dl_logo.png")} style={{ width: 800, filter: `drop-shadow(0 12px 40px #000) drop-shadow(0 0 30px ${SOUL}88)` }} />
          </div>
          {f >= regAt ? (
            <div style={{ position: "absolute", left: 0, right: 0, top: 900, display: "flex", justifyContent: "center" }}>
              <Stamp text="NÃO VAI SE ARREPENDER" at={regAt} size={80} rot={-5} c={SOUL} />
            </div>
          ) : null}
        </>
      )}
      <Grain o={0.07} />
      <Flash f={f} ts={[c1At, dlAt]} pk={0.3} />
    </AbsoluteFill>
  );
};

// ========== 9) fechamento: like · compartilha · salva → tamo junto ==========
const BTN = [
  { k: "like", icon: "❤️", t: "DÁ LIKE", c: "#fe2c55" },
  { k: "share", icon: "↪", t: "COMPARTILHA", c: "#ffd27a" },
  { k: "save", icon: "🔖", t: "SALVA", c: SOUL },
];
export const NDCta: React.FC<{ life: number; likeAt?: number; shareAt?: number; saveAt?: number; byeAt?: number }> = ({ life, likeAt = 4, shareAt = 30, saveAt = 66, byeAt = 116 }) => {
  const f = useCurrentFrame();
  const ats = [likeAt, shareAt, saveAt];
  return (
    <AbsoluteFill style={{ background: INK, overflow: "hidden" }}>
      <BgClip clip="raw" ss={285} life={life} dim={0.3} />
      <Halftone o={0.2} />
      <Souls n={14} o={0.5} />
      {BTN.map((b, i) => {
        const at = ats[i];
        const on = f >= at;
        const press = on && f < at + 5 ? 0.86 : 1;
        const burst = ease(f, at, 14);
        return (
          <div key={b.k} style={{ position: "absolute", left: 90 + i * 310, top: 520, width: 280, height: 340, display: "flex", flexDirection: "column", alignItems: "center", gap: 18,
            transform: `scale(${back(f, i * 3, 10, 1.6) * press})` }}>
            <div style={{ position: "relative", width: 200, height: 200, borderRadius: "50%", background: on ? b.c : "rgba(255,255,255,0.12)", border: `5px solid ${on ? "#fff" : `${CREAM}55`}`,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 100, color: "#fff", fontFamily: BODY, fontWeight: 900, boxShadow: on ? `0 0 40px ${b.c}` : "none" }}>
              {b.icon}
              {on ? <div style={{ position: "absolute", inset: -20, borderRadius: "50%", border: `5px solid ${b.c}`, transform: `scale(${1 + burst * 0.6})`, opacity: 1 - burst }} /> : null}
            </div>
            <div style={{ fontFamily: POSTER, fontSize: 50, color: on ? CREAM : `${CREAM}66`, letterSpacing: 1 }}>{b.t}</div>
          </div>
        );
      })}
      {f >= byeAt ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 960, display: "flex", justifyContent: "center" }}>
          <Stamp text="TAMO JUNTO" at={byeAt} size={110} rot={-5} c={SOUL} sub="ATÉ A PRÓXIMA" />
        </div>
      ) : null}
      <Img src={dl("blies.jpg")} style={{ position: "absolute", left: 540 - 70, top: 250, width: 140, height: 140, borderRadius: "50%", objectFit: "cover", border: `5px solid ${SOUL}`, transform: `scale(${back(f, 0, 12, 1.5)})` }} />
      <Grain />
      <Flash f={f} ts={ats} pk={0.2} />
    </AbsoluteFill>
  );
};

// ========== 10) a comunidade: avatares chegam de todo lado e formam o brasão DEADLOCK BRASIL → A MAIOR DO BRASIL ==========
export const NDCommunity: React.FC<{ life: number; comAt?: number; bigAt?: number }> = ({ life, comAt = 60, bigAt = 130 }) => {
  const f = useCurrentFrame();
  const N = 26;
  const crest = back(f, comAt, 12, 1.4);
  const big = f >= bigAt;
  return (
    <AbsoluteFill style={{ background: INK, overflow: "hidden" }}>
      <BgClip clip="k4" ss={30} life={life} dim={0.25} />
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 55% 40% at 50% 46%, ${big ? "#1f8a4c" : TEAL}aa 0%, rgba(0,0,0,0) 70%)` }} />
      <Halftone o={0.2} />
      {Array.from({ length: N }).map((_, i) => {
        const at = 6 + i * 2.2;
        if (f < at) return null;
        const ang = random(`ca${i}`) * Math.PI * 2;
        const ring = 330 + (i % 3) * 70;
        const tx = 540 + Math.cos(ang) * ring, ty = 860 + Math.sin(ang) * ring * 0.68;
        const fx = 540 + Math.cos(ang) * 1300, fy = 880 + Math.sin(ang) * 1300;
        const p = ease(f, at, 16);
        const hue = ["#5ff2d6", "#f2a13a", "#5aa9ff", "#d8452f", "#b58cff", "#ffd27a"][i % 6];
        return (
          <div key={i} style={{ position: "absolute", left: fx + (tx - fx) * p - 38, top: fy + (ty - fy) * p - 38 + Math.sin(f / 10 + i) * 6, width: 76, height: 76, borderRadius: "50%",
            background: `linear-gradient(135deg, ${hue}, ${INK})`, border: `4px solid ${CREAM}`, boxShadow: "0 8px 20px rgba(0,0,0,0.6)", overflow: "hidden" }}>
            <svg width={68} height={68} viewBox="0 0 68 68"><circle cx={34} cy={26} r={11} fill={`${CREAM}cc`} /><path d="M12 62 C14 44 54 44 56 62" fill={`${CREAM}cc`} /></svg>
          </div>
        );
      })}
      {f >= comAt ? (
        <div style={{ position: "absolute", left: 540 - 230, top: 880 - 230, width: 460, height: 460, borderRadius: "50%", background: `radial-gradient(circle, ${TEAL} 0%, ${INK} 80%)`, border: `8px solid ${big ? AMBER : SOUL}`,
          boxShadow: `0 0 60px ${big ? AMBER : SOUL}88`, transform: `scale(${crest})`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <Img src={mg("dl_emblem.png")} style={{ width: 190, height: 190, objectFit: "contain" }} />
          <div style={{ fontFamily: POSTER, fontSize: 64, color: CREAM, lineHeight: 1, marginTop: 6 }}>DEADLOCK</div>
          <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 34, letterSpacing: 10, color: big ? "#ffd34d" : SOUL }}>BRASIL</div>
        </div>
      ) : null}
      <Title at={2} y={200} size={88} c={CREAM} sub="TÔ CRIANDO AQUI">UMA COMUNIDADE</Title>
      {big ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 1170, display: "flex", justifyContent: "center" }}>
          <Stamp text="A MAIOR DO BRASIL" at={bigAt} size={92} rot={-5} c={AMBER} />
        </div>
      ) : null}
      <Grain />
      <Flash f={f} ts={[comAt, bigAt]} pk={0.3} />
    </AbsoluteFill>
  );
};

// ========== 11) apoia? comenta → Discord → campeonatos e transmissões ==========
const SLOT: React.FC<{ x: number; y: number; w: number; at: number; f: number; t: string; c?: string }> = ({ x, y, w, at, f, t, c = CREAM }) =>
  f < at ? null : (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: 74, borderRadius: 12, background: "rgba(8,14,14,0.92)", border: `3px solid ${c}`, display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: BODY, fontWeight: 900, fontSize: 30, color: c, letterSpacing: 2, transform: `scaleX(${ease(f, at, 8)})` }}>{t}</div>
  );
export const NDComment: React.FC<{ life: number; commentAt?: number; discordAt?: number; campAt?: number; liveAt?: number }> = ({ life, commentAt = 25, discordAt = 190, campAt = 260, liveAt = 300 }) => {
  const f = useCurrentFrame();
  const msg = "eu apoio! bora fazer a comunidade 🔥";
  const typed = Array.from(msg).slice(0, Math.max(0, Math.floor((f - commentAt) / 1.3))).join("");
  const sentAt = commentAt + Array.from(msg).length * 1.3 + 6;
  const sent = f >= sentAt;
  const likes = sent ? Math.min(999, Math.floor((f - sentAt) ** 1.6)) : 0;
  const phase2 = f >= campAt;
  const d = back(f, discordAt, 12, 1.4);
  const up = ease(f, campAt, 12);
  return (
    <AbsoluteFill style={{ background: INK, overflow: "hidden" }}>
      <BgClip clip="raw" ss={160} life={life} dim={0.25} />
      <Halftone o={0.2} />
      {up < 1 ? (
        <div style={{ position: "absolute", left: 80, top: 260 - up * 900, width: 920, opacity: 1 - up }}>
          <div style={{ fontFamily: POSTER, fontSize: 82, color: CREAM, textAlign: "center", marginBottom: 30, textShadow: "0 8px 30px #000" }}>APOIA A IDEIA? COMENTA</div>
          <div style={{ background: "#fff", borderRadius: 26, padding: "26px 30px", display: "flex", gap: 22, alignItems: "flex-start", boxShadow: "0 24px 60px rgba(0,0,0,0.6)", transform: `scale(${back(f, 4, 10, 1.4)})` }}>
            <div style={{ width: 84, height: 84, borderRadius: "50%", background: `linear-gradient(135deg, ${SOUL}, ${TEAL})`, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 28, color: "#888" }}>você · agora</div>
              <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 44, color: "#111", minHeight: 112 }}>{typed}{!sent && f >= commentAt && Math.floor(f / 8) % 2 ? "|" : ""}</div>
            </div>
            <div style={{ textAlign: "center", fontFamily: BODY, fontWeight: 900, fontSize: 28, color: sent ? "#fe2c55" : "#aaa" }}>♥<br />{likes}</div>
          </div>
        </div>
      ) : null}
      {f >= discordAt ? (
        <div style={{ position: "absolute", left: 140, top: 820 - up * 640, width: 800, height: 200, borderRadius: 30, background: "#5865F2", transform: `scale(${d * (1 - up * 0.25)}) rotate(-2deg)`, display: "flex", alignItems: "center", gap: 30, padding: "0 46px",
          boxShadow: "0 24px 60px rgba(0,0,0,0.6)" }}>
          <DiscordMark s={110} />
          <div>
            <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 28, letterSpacing: 4, color: "#e0e3ff" }}>NOS PRÓXIMOS VÍDEOS</div>
            <div style={{ fontFamily: POSTER, fontSize: 72, color: "#fff", lineHeight: 1.05 }}>UM DISCORD</div>
          </div>
        </div>
      ) : null}
      {phase2 ? (
        <AbsoluteFill style={{ transform: "translateY(-90px)" }}>
          <Title at={campAt} y={530} size={86} c={CREAM}>CAMPEONATOS</Title>
          {[0, 1, 2, 3].map((i) => <SLOT key={i} f={f} x={70} y={700 + i * 120} w={300} at={campAt + 4 + i * 3} t={`TIME ${i + 1}`} />)}
          {[0, 1].map((i) => <SLOT key={i} f={f} x={400} y={760 + i * 240} w={280} at={campAt + 18 + i * 4} t="SEMIFINAL" c={SOUL} />)}
          <SLOT f={f} x={710} y={880} w={300} at={campAt + 28} t="🏆 FINAL" c={AMBER} />
          <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            {[0, 1].map((i) => (
              <path key={i} d={`M370 ${737 + i * 240} H385 V${857 + i * 240} H370 M385 ${797 + i * 240} H400`} stroke={CREAM} strokeWidth={4} fill="none" opacity={ease(f, campAt + 14, 6)} />
            ))}
            <path d="M680 797 H695 V1037 H680 M695 917 H710" stroke={SOUL} strokeWidth={4} fill="none" opacity={ease(f, campAt + 24, 6)} />
          </svg>
        </AbsoluteFill>
      ) : null}
      {f >= liveAt ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 1110, display: "flex", justifyContent: "center", transform: `scale(${back(f, liveAt, 10, 1.8)})` }}>
          <div style={{ background: "#e91916", color: "#fff", fontFamily: POSTER, fontSize: 64, padding: "8px 34px", borderRadius: 14, display: "flex", alignItems: "center", gap: 18, boxShadow: "0 0 40px #e9191688" }}>
            <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#fff", opacity: Math.floor(f / 10) % 2 ? 0.4 : 1 }} />TRANSMISSÃO AO VIVO
          </div>
        </div>
      ) : null}
      <Grain />
      <Flash f={f} ts={[discordAt, campAt]} pk={0.25} />
    </AbsoluteFill>
  );
};
