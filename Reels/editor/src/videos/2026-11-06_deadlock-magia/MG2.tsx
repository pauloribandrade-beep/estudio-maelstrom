import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, Loop, OffthreadVideo, random, staticFile, useCurrentFrame } from "remotion";
import { loadFont as loadAnton } from "@remotion/google-fonts/Anton";
import { loadFont as loadSerif } from "@remotion/google-fonts/PlayfairDisplay";
import { loadFont as loadBody } from "@remotion/google-fonts/NunitoSans";
import { loadFont as loadHand } from "@remotion/google-fonts/Caveat";
import CL from "./clips.json";
import { LiteCtx } from "../../lib/sfx-ctx";
import LITE from "./clips_lite.json";

// "Magia do Deadlock" v2 (06/11, tarde). Ele reprovou a v1: "monótono", "só cards", "sem identidade visual", logo errada
// (era o card do Rat King). Linguagem nova, tirada da própria arte do Deadlock: logo oficial (wiki), pôsteres de papel
// creme com meio-tom (os ícones de item do jogo), verde-petróleo da cidade, almas azul-água, tinta vermelha de carimbo.
// Tudo com material REAL: logos oficiais dos jogos (Steam/Commons), arte da Steam, matérias da PC Gamer, o mod do Bakugo
// no GameBanana, ícones de item da wiki. Gameplay ganha soco de zoom, flash no corte e tremida no impacto.
// Zona segura do TikTok: conteúdo entre y 180 e 1290; nada importante à direita de 930 entre y 700 e 1550; legenda em 1370.

const { fontFamily: POSTER } = loadAnton("normal", { weights: ["400"], subsets: ["latin", "latin-ext"] });
const { fontFamily: SERIF } = loadSerif("italic", { weights: ["700", "900"], subsets: ["latin", "latin-ext"] });
const { fontFamily: BODY } = loadBody("normal", { weights: ["700", "800", "900"], subsets: ["latin", "latin-ext"] });
const { fontFamily: HAND } = loadHand("normal", { weights: ["700"], subsets: ["latin", "latin-ext"] });

const R = "videos/2026-11-06_deadlock-magia_R/";
const MG = `${R}mg/`;
const DLP = "videos/2026-11-05_deadlock-patch-celeste_R/dl/";
const FPS = 30;
const img = (n: string) => staticFile(`${MG}${n}`);
const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
const ease = (f: number, a: number, n = 10) => interpolate(f, [a, a + n], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
const back = (f: number, a: number, n = 10, s = 1.8) => interpolate(f - a, [0, n], [0, 1], { ...clamp, easing: Easing.out(Easing.back(s)) });
const inQ = (f: number, a: number, n = 10) => interpolate(f, [a, a + n], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
// clarão que só existe DEPOIS do golpe (o interpolate com clamp devolvia o pico antes do início)
const fl = (f: number, a: number, b: number, pk: number) => (f < a ? 0 : interpolate(f, [a, b], [pk, 0], clamp));
const outF = (f: number, life: number, n = 5) => interpolate(f, [life - n, life], [1, 0], clamp);
// tremida que morre em n quadros depois de `at`
const shake = (f: number, at: number, amp = 14, n = 9, seed = "s") => {
  const k = f - at;
  if (k < 0 || k > n) return { x: 0, y: 0, r: 0 };
  const d = amp * (1 - k / n) ** 2;
  return { x: (random(`${seed}x${k}`) - 0.5) * 2 * d, y: (random(`${seed}y${k}`) - 0.5) * 2 * d, r: (random(`${seed}r${k}`) - 0.5) * d * 0.12 };
};
// golpe de escala: +amp no quadro do soco, volta em n quadros
const punchZ = (f: number, ts: number[] = [], amp = 0.1, n = 9) => ts.reduce((z, t) => (f >= t && f < t + n ? z + amp * (1 - (f - t) / n) ** 2 : z), 0);

export const INK = "#0b1412";
export const TEAL = "#123b35";
export const CREAM = "#f4e7cb";
export const SOUL = "#5ff2d6";
export const EMBER = "#ec7a36";
export const STAMP = "#d8452f";
export const SPIRIT = "#b58cff";

// ---------- texturas: grão de papel/filme e vinheta ----------
const Grain: React.FC<{ o?: number }> = ({ o = 0.09 }) => {
  const f = useCurrentFrame();
  const seed = Math.floor(f / 2) % 9;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: o, mixBlendMode: "overlay", pointerEvents: "none" }}>
      <filter id={`gr${seed}`}>
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={seed} />
        <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1.4 -0.2" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#gr${seed})`} />
    </svg>
  );
};
const Vignette: React.FC<{ o?: number }> = ({ o = 0.75 }) => (
  <AbsoluteFill style={{ background: `radial-gradient(ellipse 85% 70% at 50% 42%, rgba(0,0,0,0) 45%, rgba(0,0,0,${o}) 100%)`, pointerEvents: "none" }} />
);
// meio-tom dos pôsteres do jogo
const Halftone: React.FC<{ c?: string; o?: number; size?: number; style?: React.CSSProperties }> = ({ c = "#000", o = 0.18, size = 14, style }) => (
  <div style={{ position: "absolute", inset: 0, opacity: o, backgroundImage: `radial-gradient(${c} 28%, transparent 30%)`, backgroundSize: `${size}px ${size}px`, pointerEvents: "none", ...style }} />
);
// almas subindo (as esferas azul-água do jogo)
const Souls: React.FC<{ n?: number; o?: number; c?: string; speed?: number }> = ({ n = 18, o = 1, c = SOUL, speed = 1 }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ opacity: o, pointerEvents: "none" }}>
      {Array.from({ length: n }).map((_, i) => {
        const x = random(`sx${i}`) * 1080;
        const sp = (1.4 + random(`sv${i}`) * 2.6) * speed;
        const y = 1980 - ((f * sp + random(`sy${i}`) * 1980) % 2100);
        const s = 6 + random(`ss${i}`) * 14;
        const wob = Math.sin((f + i * 20) / 18) * 18;
        return <div key={i} style={{ position: "absolute", left: x + wob, top: y, width: s, height: s, borderRadius: "50%", background: c, boxShadow: `0 0 ${s * 2}px ${s * 0.6}px ${c}`, opacity: 0.35 + random(`so${i}`) * 0.5 }} />;
      })}
    </AbsoluteFill>
  );
};
// névoa verde-petróleo da cidade
const Fog: React.FC<{ c?: string; o?: number }> = ({ c = TEAL, o = 1 }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ opacity: o, pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: -300 + Math.sin(f / 60) * 80, top: 1100, width: 1700, height: 900, background: `radial-gradient(ellipse at 50% 50%, ${c}cc 0%, rgba(0,0,0,0) 65%)`, filter: "blur(30px)" }} />
      <div style={{ position: "absolute", left: -200 - Math.sin(f / 75) * 90, top: -200, width: 1500, height: 800, background: `radial-gradient(ellipse at 50% 50%, ${c}88 0%, rgba(0,0,0,0) 65%)`, filter: "blur(30px)" }} />
    </AbsoluteFill>
  );
};

// ---------- gameplay ----------
const Clip: React.FC<{ clip: string; ss?: number; rate?: number; life: number; pos?: string; style?: React.CSSProperties }> = ({ clip, ss = 0, rate = 1, life, pos = "50% 50%", style }) => {
  const len = (CL as Record<string, number>)[clip] ?? 3;
  const loopF = Math.max(1, Math.floor(((len - ss) / rate) * FPS) - 1);
  const lite = React.useContext(LiteCtx);
  const v = <OffthreadVideo src={staticFile(`${R}${lite && (LITE as string[]).includes(clip) ? "clips_lite" : "clips"}/${clip}.mp4`)} muted startFrom={Math.round(ss * FPS)} playbackRate={rate} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: pos, ...style }} />;
  return life > loopF ? <Loop durationInFrames={loopF}>{v}</Loop> : v;
};
const BgClip: React.FC<{ clip: string; ss?: number; life: number; pos?: string; blur?: number; dim?: number; gray?: number }> = ({ clip, ss, life, pos, blur = 8, dim = 0.4, gray = 0 }) => (
  <AbsoluteFill style={{ transform: "scale(1.12)", filter: `blur(${blur}px) brightness(${dim}) grayscale(${gray})` }}>
    <Clip clip={clip} ss={ss} life={life} pos={pos} />
  </AbsoluteFill>
);

// cliques de "andar" do LoL (o cara cansado de clicar no chão)
const LolClicks: React.FC<{ every?: number; from?: number }> = ({ every = 6, from = 4 }) => {
  const f = useCurrentFrame();
  const out: React.ReactNode[] = [];
  for (let k = from; k <= f; k += every) {
    const age = f - k;
    if (age > 10) continue;
    const x = 200 + random(`cx${k}`) * 560;
    const y = 520 + random(`cy${k}`) * 620;
    const s = interpolate(age, [0, 10], [1.3, 0.5], clamp);
    const o = interpolate(age, [0, 2, 10], [0, 1, 0], clamp);
    out.push(
      <svg key={k} width={160} height={110} viewBox="-80 -55 160 110" style={{ position: "absolute", left: x - 80, top: y - 55, opacity: o, transform: `scale(${s})` }}>
        <ellipse rx={62} ry={30} fill="none" stroke="#37f06a" strokeWidth={5} />
        {[0, 1, 2, 3].map((q) => {
          const a = (q * Math.PI) / 2 + Math.PI / 4;
          const r = 22 + age * 2.4;
          return <path key={q} d="M-9 -7 L0 4 L9 -7" fill="none" stroke="#37f06a" strokeWidth={6} strokeLinecap="round" transform={`translate(${Math.cos(a) * r * 1.9},${Math.sin(a) * r}) rotate(${(a * 180) / Math.PI - 90})`} />;
        })}
      </svg>,
    );
  }
  return <AbsoluteFill style={{ pointerEvents: "none" }}>{out}</AbsoluteFill>;
};

// gameplay em tela cheia com dinâmica: entra com flash + zoom que assenta (kick), soco de zoom nas palavras fortes (punch),
// tremida junto do soco. clicks = cliques verdes do LoL por cima.
// punchS = segundos relativos (lista de número não passa pela conversão do registry, então converte aqui)
export const MGPunch: React.FC<{ life: number; clip: string; ss?: number; rate?: number; pos?: string; punchS?: number[]; kick?: boolean; z1?: number; clicks?: boolean; gray?: number }> = ({ life, clip, ss, rate, pos, punchS = [], kick = true, z1 = 1.07, clicks, gray = 0 }) => {
  const f = useCurrentFrame();
  const punch = punchS.map((s) => Math.round(s * FPS));
  const k = kick ? interpolate(f, [0, 6], [0.16, 0], { ...clamp, easing: Easing.out(Easing.cubic) }) : 0;
  const blur = kick ? interpolate(f, [0, 5], [10, 0], clamp) : 0;
  const flash = kick ? fl(f, 0, 4, 0.45) : 0;
  const z = interpolate(f, [0, life], [1, z1], clamp) + k + punchZ(f, punch, 0.12, 9);
  const sh = punch.reduce((acc, t, i) => {
    const s = shake(f, t, 12, 8, `p${i}`);
    return { x: acc.x + s.x, y: acc.y + s.y, r: acc.r + s.r };
  }, { x: 0, y: 0, r: 0 });
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `translate(${sh.x}px, ${sh.y}px) rotate(${sh.r}deg) scale(${z})`, filter: `blur(${blur}px) grayscale(${gray})` }}>
        <Clip clip={clip} ss={ss} rate={rate} life={life} pos={pos} />
      </AbsoluteFill>
      {clicks ? <LolClicks /> : null}
      <Vignette o={0.45} />
      <Grain o={0.06} />
      <AbsoluteFill style={{ background: "#fff", opacity: flash, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};

// ---------- logo com impacto ----------
// entra grande e bate (escala 2,6 → 1 em 5 quadros), treme, fantasmas coloridos, faixa de luz atravessando a logo
const Slam: React.FC<{ src: string; at: number; w: number; sweep?: boolean; seed?: string; glow?: string }> = ({ src, at, w, sweep = true, seed = "l", glow = "rgba(255,255,255,0.35)" }) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  const s = interpolate(f, [at, at + 5], [2.6, 1], { ...clamp, easing: Easing.in(Easing.quad) }) + interpolate(f, [at + 5, at + 60], [0, 0.05], clamp);
  const o = interpolate(f, [at, at + 2], [0, 1], clamp);
  const sh = shake(f, at + 5, 16, 10, seed);
  const ghost = interpolate(f, [at + 5, at + 14], [1, 0], clamp);
  const sw = interpolate(f, [at + 6, at + 26], [-0.6, 1.6], clamp);
  return (
    <div style={{ position: "relative", width: w, transform: `translate(${sh.x}px, ${sh.y}px) rotate(${sh.r}deg) scale(${s})`, opacity: o }}>
      {ghost > 0 ? (
        <>
          <Img src={src} style={{ position: "absolute", left: -14 * ghost, top: 0, width: w, opacity: 0.55 * ghost, filter: "sepia(1) saturate(8) hue-rotate(-50deg)" }} />
          <Img src={src} style={{ position: "absolute", left: 14 * ghost, top: 0, width: w, opacity: 0.55 * ghost, filter: "sepia(1) saturate(8) hue-rotate(140deg)" }} />
        </>
      ) : null}
      <Img src={src} style={{ position: "relative", width: w, filter: `drop-shadow(0 12px 40px rgba(0,0,0,0.75)) drop-shadow(0 0 30px ${glow})` }} />
      {sweep ? (
        <div style={{ position: "absolute", inset: 0, WebkitMaskImage: `url(${src})`, WebkitMaskSize: "100% 100%", maskImage: `url(${src})`, maskSize: "100% 100%",
          background: `linear-gradient(105deg, rgba(255,255,255,0) ${sw * 100 - 18}%, rgba(255,255,255,0.85) ${sw * 100}%, rgba(255,255,255,0) ${sw * 100 + 18}%)` }} />
      ) : null}
    </div>
  );
};

// logo de um jogo batendo por cima do gameplay dele (escurecido)
export const MGLogo: React.FC<{ life: number; logo: string; clip: string; ss?: number; pos?: string; slamAt?: number; w?: number; y?: number; gray?: number }> = ({ life, logo, clip, ss, pos, slamAt = 2, w = 760, y = 560, gray = 0 }) => {
  const f = useCurrentFrame();
  const flash = fl(f, slamAt + 5, slamAt + 10, 0.5);
  const z = 1 + punchZ(f, [slamAt + 5], 0.08, 10) + interpolate(f, [0, life], [0, 0.06], clamp);
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden", opacity: outF(f, life, 3) }}>
      <AbsoluteFill style={{ transform: `scale(${z})` }}>
        <BgClip clip={clip} ss={ss} life={life} pos={pos} blur={3} dim={0.55} gray={gray} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 70% 40% at 50% 40%, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 70%)" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: y, display: "flex", justifyContent: "center" }}>
        <Slam src={img(logo)} at={slamAt} w={w} />
      </div>
      <Vignette o={0.6} />
      <Grain />
      <AbsoluteFill style={{ background: "#fff", opacity: flash, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
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
        <filter id="rough">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="4" />
          <feDisplacementMap in="SourceGraphic" scale="7" />
        </filter>
        <filter id="speck">
          <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="1" seed="2" result="n" />
          <feColorMatrix in="n" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.4 1.6" result="m" />
          <feComposite in="SourceGraphic" in2="m" operator="in" />
        </filter>
      </svg>
      <div style={{ filter: "url(#rough)" }}>
        <div style={{ filter: "url(#speck)", border: `9px solid ${c}`, borderRadius: 12, padding: "10px 34px 14px", textAlign: "center", color: c }}>
          <div style={{ fontFamily: POSTER, fontSize: size, lineHeight: 1.02, letterSpacing: 3, whiteSpace: "nowrap", textTransform: "uppercase" }}>{text}</div>
          {sub ? <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: size * 0.34, letterSpacing: 6, marginTop: 2 }}>{sub}</div> : null}
        </div>
      </div>
    </div>
  );
};

// ---------- logo do Deadlock (oficial: emblema gira e o nome abre da esquerda pra direita) ----------
const DLWordmark: React.FC<{ at: number; w?: number }> = ({ at, w = 860 }) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  // a logo oficial tem 1280×287; o emblema ocupa ~22% da largura
  const emb = back(f, at, 14, 1.3);
  const spin = interpolate(f, [at, at + 22], [-200, 0], { ...clamp, easing: Easing.out(Easing.cubic) });
  const wipe = interpolate(f, [at + 8, at + 22], [0, 100], { ...clamp, easing: Easing.out(Easing.cubic) });
  const glow = 0.5 + 0.5 * Math.sin((f - at) / 9);
  const h = (w * 287) / 1280;
  const ew = w * 0.225;
  return (
    <div style={{ position: "relative", width: w, height: h }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: ew, height: h, transform: `rotate(${spin}deg) scale(${emb})`, filter: `drop-shadow(0 0 ${20 + glow * 30}px ${SOUL}aa)` }}>
        <Img src={img("dl_logo.png")} style={{ position: "absolute", left: 0, top: 0, width: w, height: h, clipPath: `inset(0 ${100 - 22.5}% 0 0)` }} />
      </div>
      <Img src={img("dl_logo.png")} style={{ position: "absolute", left: 0, top: 0, width: w, height: h, clipPath: `inset(0 ${100 - Math.max(22.5, 22.5 + (wipe / 100) * 77.5)}% 0 22.5%)`, filter: "drop-shadow(0 10px 30px rgba(0,0,0,0.8))" }} />
    </div>
  );
};

// ---------- GANCHO: LoL, Overwatch e Rivals batem um embaixo do outro (cada um no nome, com o gameplay dele atrás);
// no "jogar" eles despencam e o Deadlock nasce da névoa; no "nem foi lançado" desce o carimbo.
type HG = { logo: string; clip: string; ss?: number; at: number; w?: number };
export const MGHook2: React.FC<{ life: number; games: HG[]; dlAt: number; notAt: number; dlClip?: string; dlSs?: number }> = ({ life, games, dlAt, notAt, dlClip = "k4", dlSs = 30 }) => {
  const f = useCurrentFrame();
  const cur = [...games].reverse().find((g) => f >= g.at) ?? games[0];
  const fall = f - dlAt;
  const dl = f >= dlAt;
  const flash = Math.max(...games.map((g) => fl(f, g.at + 5, g.at + 10, 0.4)), fl(f, dlAt + 2, dlAt + 9, 0.6));
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden", opacity: outF(f, life, 3) }}>
      {!dl ? (
        <AbsoluteFill key={cur.logo} style={{ transform: `scale(${1.04 + punchZ(f, [cur.at + 5], 0.08, 10)})` }}>
          <BgClip clip={cur.clip} ss={cur.ss} life={life} blur={3} dim={0.5} />
        </AbsoluteFill>
      ) : (
        <AbsoluteFill style={{ transform: `scale(${1.15 - ease(f, dlAt, 40) * 0.08})` }}>
          <BgClip clip={dlClip} ss={dlSs} life={life} blur={6} dim={0.42} />
          <AbsoluteFill style={{ background: `linear-gradient(180deg, ${INK}cc 0%, ${TEAL}66 45%, ${INK}ee 100%)` }} />
          <Fog o={ease(f, dlAt, 20)} />
          <Souls n={22} o={ease(f, dlAt + 4, 20)} />
        </AbsoluteFill>
      )}
      {games.map((g, i) => {
        const y0 = 250 + i * 300;
        const t = Math.max(0, fall - i * 2);
        const dy = fall > 0 ? 0.9 * t * t : 0;
        const rot = fall > 0 ? (i % 2 ? 1 : -1) * t * 1.6 : 0;
        if (f < g.at || dy > 2200 || t > 9) return null;
        return (
          <div key={g.logo} style={{ position: "absolute", left: 0, right: 0, top: y0 + dy, display: "flex", justifyContent: "center", transform: `rotate(${rot}deg)`, opacity: 1 - t / 9, filter: f >= g.at + 6 && i < games.length - 1 && games[i + 1] && f >= games[i + 1].at ? "grayscale(0.4) brightness(0.85)" : undefined }}>
            <Slam src={img(g.logo)} at={g.at} w={g.w ?? 620} seed={`h${i}`} />
          </div>
        );
      })}
      {dl ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 560, display: "flex", justifyContent: "center", transform: `translateY(${(1 - ease(f, dlAt + 4, 18)) * 60}px)` }}>
          <DLWordmark at={dlAt + 4} w={880} />
        </div>
      ) : null}
      <div style={{ position: "absolute", left: 0, right: 0, top: 860, display: "flex", justifyContent: "center" }}>
        <Stamp text="nem foi lançado" at={notAt} size={104} rot={-6} c="#ff5338" />
      </div>
      <Vignette o={0.65} />
      <Grain />
      <AbsoluteFill style={{ background: "#fff", opacity: flash, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};

// ---------- cursor com etiqueta e círculo de marcador ----------
const Cursor: React.FC<{ x: number; y: number; press?: number; name?: string }> = ({ x, y, press = 0, name = "Blies" }) => (
  <div style={{ position: "absolute", left: x, top: y, transform: `scale(${1 - press * 0.15})`, transformOrigin: "0 0", filter: "drop-shadow(0 6px 12px rgba(0,0,0,0.6))" }}>
    <svg width={56} height={64} viewBox="0 0 28 32"><path d="M2 2 L2 26 L8.5 20 L13 30 L17 28.2 L12.6 18.6 L21.5 18.6 Z" fill="#fff" stroke="#111" strokeWidth={2} strokeLinejoin="round" /></svg>
    <div style={{ position: "absolute", left: 40, top: 46, background: SPIRIT, color: "#14091f", fontFamily: BODY, fontWeight: 900, fontSize: 26, padding: "4px 14px", borderRadius: 20, whiteSpace: "nowrap" }}>{name}</div>
  </div>
);
const Marker: React.FC<{ at: number; w: number; h: number; c?: string; n?: number; sw?: number }> = ({ at, w, h, c = STAMP, n = 12, sw = 9 }) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [at, at + n], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  if (p <= 0) return null;
  const rx = w / 2, ry = h / 2;
  // elipse à mão: passa um pouco do ponto de partida
  const pts: string[] = [];
  for (let i = 0; i <= 60; i++) {
    const a = -2.2 + (i / 60) * (Math.PI * 2.25);
    const wob = 1 + Math.sin(i * 1.7) * 0.025;
    pts.push(`${rx + Math.cos(a) * rx * wob},${ry + Math.sin(a) * ry * wob * (1 + i / 400)}`);
  }
  const d = `M${pts.join(" L")}`;
  return (
    <svg width={w + 40} height={h + 40} viewBox={`-20 -20 ${w + 40} ${h + 40}`} style={{ position: "absolute", overflow: "visible" }}>
      <path d={d} fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} style={{ filter: "drop-shadow(0 3px 6px rgba(0,0,0,0.4))" }} />
    </svg>
  );
};

// ---------- STEAM: página da loja do Deadlock numa janela inclinada; o cursor desce, clica em "Solicitar acesso" →
// "só por convite" (círculo de marcador); depois a faixa "Em desenvolvimento inicial" com marca-texto ----------
export const MGSteam2: React.FC<{ life: number; inviteAt: number; devAt: number }> = ({ life, inviteAt, devAt }) => {
  const f = useCurrentFrame();
  const a = back(f, 0, 14, 1.2);
  // câmera: entra inclinada e longe; vai ao botão no convite; depois desce para o aviso
  const camY = interpolate(f, [0, inviteAt - 6, inviteAt + 4, devAt - 6, devAt + 6], [0, 0, 140, 140, 510], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const camZ = interpolate(f, [0, 16, inviteAt + 4, devAt + 6, life], [0.86, 0.96, 1.12, 1.18, 1.22], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const rotX = interpolate(f, [0, 20], [16, 6], { ...clamp, easing: Easing.out(Easing.cubic) });
  const rotY = interpolate(f, [0, life], [-9, 4], clamp);
  const cx = interpolate(f, [0, inviteAt - 10, inviteAt - 2], [820, 820, 560], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const cy = interpolate(f, [0, inviteAt - 10, inviteAt - 2], [380, 380, 760], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const press = interpolate(f, [inviteAt - 2, inviteAt, inviteAt + 3], [0, 1, 0], clamp);
  const toast = back(f, inviteAt + 1, 10, 1.6);
  const hl = interpolate(f, [devAt, devAt + 10], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const W = 940;
  return (
    <AbsoluteFill style={{ background: "#0b141d", overflow: "hidden", opacity: outF(f, life, 3) }}>
      <AbsoluteFill style={{ transform: "scale(1.2)" }}>
        <Img src={img("dl_hero.jpg")} style={{ position: "absolute", left: -900 - f * 0.6, top: 0, height: 1920, filter: "blur(14px) brightness(0.35) saturate(1.2)" }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 80% 55% at 50% 40%, rgba(102,192,244,0.16) 0%, rgba(0,0,0,0) 70%)" }} />
      <AbsoluteFill style={{ perspective: 1800 }}>
        <div style={{ position: "absolute", left: (1080 - W) / 2, top: 230, width: W, transformOrigin: "50% 30%", transform: `translateY(${(1 - a) * 300 - camY}px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(${camZ})`, opacity: Math.min(1, a * 1.5) }}>
          {/* janela */}
          <div style={{ borderRadius: 14, overflow: "hidden", background: "#1b2838", boxShadow: "0 50px 120px rgba(0,0,0,0.75), 0 0 0 2px #2a475e" }}>
            <div style={{ height: 56, background: "#171a21", display: "flex", alignItems: "center", gap: 12, padding: "0 20px" }}>
              {["#ff5f57", "#febc2e", "#28c840"].map((c) => <div key={c} style={{ width: 16, height: 16, borderRadius: 8, background: c }} />)}
              <div style={{ marginLeft: 16, flex: 1, height: 32, borderRadius: 8, background: "#0e1116", color: "#8f98a0", fontFamily: BODY, fontWeight: 700, fontSize: 20, display: "flex", alignItems: "center", paddingLeft: 14 }}>store.steampowered.com/app/1422450/Deadlock</div>
            </div>
            <div style={{ height: 70, background: "linear-gradient(90deg, #171a21, #1b2838)", display: "flex", alignItems: "center", padding: "0 26px", gap: 34, fontFamily: BODY, fontWeight: 800, fontSize: 24, color: "#dcdedf", letterSpacing: 1 }}>
              <span style={{ fontFamily: BODY, fontWeight: 900, fontSize: 32, color: "#fff", letterSpacing: 3 }}>STEAM</span>
              <span style={{ color: "#66c0f4" }}>LOJA</span><span>COMUNIDADE</span><span>SOBRE</span>
            </div>
            <div style={{ padding: "22px 26px 30px" }}>
              <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 20, color: "#8f98a0" }}>Todos os jogos › Jogos de ação › Deadlock</div>
              <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 56, color: "#fff", marginTop: 4 }}>Deadlock</div>
              <div style={{ marginTop: 14, height: 300, borderRadius: 4, overflow: "hidden", position: "relative" }}>
                <Img src={img("dl_hero.jpg")} style={{ position: "absolute", left: -260 - f * 0.4, top: -30, height: 360 }} />
                <div style={{ position: "absolute", right: 24, bottom: 22 }}><Img src={img("dl_logo.png")} style={{ width: 380 }} /></div>
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                {["Multijogador", "MOBA", "Tiro em 3ª pessoa", "Estratégia"].map((t) => <div key={t} style={{ background: "#2a3f5a", color: "#67c1f5", fontFamily: BODY, fontWeight: 700, fontSize: 20, padding: "6px 12px", borderRadius: 3 }}>{t}</div>)}
              </div>
              {/* caixa de acesso */}
              <div style={{ position: "relative", marginTop: 24, background: "linear-gradient(90deg, #2c3d50, #1f2c3a)", borderRadius: 4, padding: "22px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 32, color: "#fff" }}>Jogar Deadlock</div>
                <div style={{ position: "relative", zIndex: 3 }}>
                  <div style={{ background: f >= inviteAt ? "#3d4450" : "linear-gradient(90deg, #75b022, #588a1b)", color: f >= inviteAt ? "#8f98a0" : "#d2efa9", fontFamily: BODY, fontWeight: 900, fontSize: 28, padding: "16px 28px", borderRadius: 3 }}>Solicitar acesso</div>
                  <div style={{ position: "absolute", left: -30, top: -30, zIndex: 3 }}><Marker at={inviteAt + 2} w={300} h={128} /></div>
                </div>
                {f >= inviteAt + 1 ? (
                  <div style={{ position: "absolute", left: 20, right: 20, top: 180, zIndex: 1, transform: `scale(${toast})`, transformOrigin: "50% 0%", background: "#0e1720", border: "3px solid #66c0f4", borderRadius: 6, padding: "18px 22px", display: "flex", alignItems: "center", gap: 18 }}>
                    <svg width={52} height={52} viewBox="0 0 24 24"><rect x="5" y="10" width="14" height="11" rx="2" fill="#66c0f4" /><path d="M8 10 V7 a4 4 0 0 1 8 0 V10" fill="none" stroke="#66c0f4" strokeWidth="2.4" /></svg>
                    <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 38, color: "#fff" }}>Só por <span style={{ color: "#66c0f4" }}>convite</span></div>
                  </div>
                ) : null}
              </div>
              {/* aviso de acesso antecipado */}
              <div style={{ marginTop: 196, background: "#4c6b22", borderRadius: 4, padding: "22px 24px", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${hl * 100}%`, background: "rgba(255, 230, 70, 0.55)", mixBlendMode: "screen" }} />
                <div style={{ position: "relative", fontFamily: BODY, fontWeight: 900, fontSize: 34, color: "#fff" }}>⚠ Em desenvolvimento inicial</div>
                <div style={{ position: "relative", fontFamily: BODY, fontWeight: 700, fontSize: 24, color: "#d6e8b8", marginTop: 6 }}>Arte provisória, recursos experimentais e mudanças frequentes.</div>
              </div>
            </div>
          </div>
          {f < inviteAt + 12 ? <Cursor x={cx} y={cy} press={press} /> : null}
        </div>
      </AbsoluteFill>
      <Vignette o={0.6} />
      <Grain o={0.07} />
    </AbsoluteFill>
  );
};

// ---------- GRÁFICO (estilo SteamDB) ----------
// up: a linha sobe e bate no pico (peakAt) com o contador rolando; ref = linha de outro jogo (TF2) que entra no refAt.
// down: sobe até o pico e despenca no dropAt (Rivals), contador descendo e o −80% batendo.
type Ref = { v: number; label: string; logo?: string; c?: string; at: number };
export const MGChart2: React.FC<{ life: number; mode?: "up" | "down"; cap: string; logo: string; title: string; peak: number; end?: number; pct?: number; peakAt: number; dropAt?: number; refs?: Ref[]; max?: number; line?: string; art?: string }> = ({ life, mode = "up", cap, logo, title, peak, end = 0, pct = 0, peakAt, dropAt = 9999, refs = [], max, line = SOUL, art }) => {
  const f = useCurrentFrame();
  const a = back(f, 0, 12, 1.3);
  const W = 900, H = 640, X0 = 90, Y0 = 600;
  const top = max ?? peak * 1.12;
  const N = 70;
  // série: ruído + subida até o pico no fim (up) / pico no meio e queda (down)
  const val = (i: number) => {
    const t = i / (N - 1);
    const n = (random(`n${cap}${i}`) - 0.5) * 0.06;
    if (mode === "up") return peak * (0.05 + 0.25 * t + 0.7 * Math.pow(t, 6) + n * t);
    const tp = 0.32;
    if (t <= tp) return peak * (0.15 + 0.85 * Math.pow(t / tp, 2.2) + n * 0.4);
    return Math.max(end, peak * Math.exp(-((t - tp) / (1 - tp)) * 2.0) + (end - peak * Math.exp(-2)) * ((t - tp) / (1 - tp)) + n * peak * 0.3);
  };
  const reveal = mode === "up" ? interpolate(f, [4, peakAt], [0.05, 1], { ...clamp, easing: Easing.in(Easing.quad) })
    : f < dropAt ? interpolate(f, [4, peakAt], [0.05, 0.33], { ...clamp, easing: Easing.out(Easing.quad) }) : interpolate(f, [dropAt, dropAt + 26], [0.33, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const shown = Math.max(2, Math.floor(reveal * (N - 1)) + 1);
  const px = (i: number) => X0 + (i / (N - 1)) * (W - X0 - 30);
  const py = (v: number) => Y0 - (v / top) * (Y0 - 60);
  const pts = Array.from({ length: shown }).map((_, i) => `${px(i)},${py(val(i))}`);
  const head = { x: px(shown - 1), y: py(val(shown - 1)) };
  const curV = mode === "up" ? (f >= peakAt ? peak : val(shown - 1)) : f < dropAt ? (f >= peakAt ? peak : val(shown - 1)) : val(shown - 1);
  const sh = shake(f, mode === "up" ? peakAt : dropAt + 26, 16, 10, `c${cap}`);
  const pctS = interpolate(f, [dropAt + 22, dropAt + 27], [2.4, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  const lineC = mode === "down" && f >= dropAt ? "#ff5a4a" : line;
  const camZ = interpolate(f, [0, life], [1, 1.07], clamp) + punchZ(f, [mode === "up" ? peakAt : dropAt + 26], 0.06, 10);
  return (
    <AbsoluteFill style={{ background: "#0a0f14", overflow: "hidden", opacity: outF(f, life, 3) }}>
      <AbsoluteFill style={{ transform: "scale(1.15)" }}>
        <Img src={img(art ?? cap)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "blur(18px) brightness(0.3) saturate(1.3)" }} />
      </AbsoluteFill>
      <Halftone c="#ffffff" o={0.04} size={10} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, transform: `translate(${sh.x}px, ${sh.y}px) scale(${camZ})`, transformOrigin: "50% 45%" }}>
        {/* cabeçalho: capa real + logo */}
        <div style={{ position: "absolute", left: 80, top: 210, display: "flex", alignItems: "center", gap: 28, opacity: a, transform: `translateY(${(1 - a) * -40}px)` }}>
          <Img src={img(cap)} style={{ width: 170, height: 255, objectFit: "cover", borderRadius: 8, boxShadow: "0 20px 50px rgba(0,0,0,0.7)", border: "3px solid rgba(255,255,255,0.15)" }} />
          <div>
            <Img src={img(logo)} style={{ width: 520, maxHeight: 150, objectFit: "contain", objectPosition: "0% 50%" }} />
            <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 28, letterSpacing: 5, color: "#9fb3c8", marginTop: 8 }}>{title}</div>
          </div>
        </div>
        {/* contador */}
        <div style={{ position: "absolute", left: 80, top: 500, fontFamily: POSTER, fontSize: 150, color: mode === "down" && f >= dropAt ? "#ff6a5c" : CREAM, lineHeight: 1, textShadow: "0 10px 40px rgba(0,0,0,0.7)" }}>
          {Math.round(curV).toLocaleString("pt-BR")}
        </div>
        <div style={{ position: "absolute", left: 86, top: 660, fontFamily: BODY, fontWeight: 800, fontSize: 30, color: "#9fb3c8", letterSpacing: 3 }}>JOGADORES AO MESMO TEMPO</div>
        {/* gráfico */}
        <svg width={W} height={H} style={{ position: "absolute", left: 60, top: 730, opacity: a }}>
          {[0.25, 0.5, 0.75, 1].map((q) => <line key={q} x1={X0} x2={W - 30} y1={py(top * q)} y2={py(top * q)} stroke="rgba(255,255,255,0.09)" strokeWidth={2} />)}
          <line x1={X0} x2={W - 30} y1={Y0} y2={Y0} stroke="rgba(255,255,255,0.25)" strokeWidth={3} />
          {refs.map((r) => {
            const p = interpolate(f, [r.at, r.at + 12], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
            if (p <= 0) return null;
            const y = py(r.v);
            return (
              <g key={r.label}>
                <line x1={X0} x2={X0 + (W - 30 - X0) * p} y1={y} y2={y} stroke={r.c ?? EMBER} strokeWidth={6} strokeDasharray="18 12" />
              </g>
            );
          })}
          <defs>
            <linearGradient id={`fill${cap}`} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={lineC} stopOpacity={0.45} /><stop offset="1" stopColor={lineC} stopOpacity={0} /></linearGradient>
          </defs>
          <path d={`M${X0},${Y0} L${pts.join(" L")} L${head.x},${Y0} Z`} fill={`url(#fill${cap})`} />
          <polyline points={pts.join(" ")} fill="none" stroke={lineC} strokeWidth={8} strokeLinejoin="round" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 12px ${lineC})` }} />
          <circle cx={head.x} cy={head.y} r={16} fill="#fff" style={{ filter: `drop-shadow(0 0 18px ${lineC})` }} />
        </svg>
        {/* rótulos das linhas de referência (logo real) */}
        {refs.map((r) => {
          const p = back(f, r.at + 4, 10, 1.6);
          if (f < r.at + 4) return null;
          return (
            <div key={r.label} style={{ position: "absolute", left: 160, top: 730 + py(r.v) + 16, display: "flex", alignItems: "center", gap: 16, transform: `scale(${p})`, transformOrigin: "0% 0%" }}>
              {r.logo ? <Img src={img(r.logo)} style={{ height: 64 }} /> : null}
              <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 32, color: r.c ?? EMBER, background: "rgba(0,0,0,0.6)", padding: "4px 12px", borderRadius: 6 }}>{r.label}</div>
            </div>
          );
        })}
        {mode === "down" && f >= dropAt + 22 ? (
          <div style={{ position: "absolute", right: 170, top: 860, transform: `rotate(-6deg) scale(${pctS})` }}>
            <div style={{ fontFamily: POSTER, fontSize: 230, color: "#ff5a4a", lineHeight: 1, textShadow: "0 12px 40px rgba(0,0,0,0.8)" }}>−{pct}%</div>
          </div>
        ) : null}
      </div>
      <Vignette o={0.6} />
      <Grain />
      <AbsoluteFill style={{ background: "#fff", opacity: fl(f, mode === "up" ? peakAt : dropAt + 26, (mode === "up" ? peakAt : dropAt + 26) + 6, 0.35), pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};

// ---------- MEME recortado (webm com alfa ou mp4) por cima do que está embaixo (lane 2) ou do gameplay desfocado ----------
export const MGSticker: React.FC<{ life: number; m: string; ext?: string; w?: number; y?: number; rot?: number; clip?: string; ss?: number; frame?: boolean; tint?: string }> = ({ life, m, ext = "webm", w = 900, y = 380, rot = -3, clip, ss, frame, tint }) => {
  const f = useCurrentFrame();
  const p = back(f, 0, 9, 2);
  const sh = shake(f, 3, 10, 7, `m${m}`);
  const o = outF(f, life, 3);
  const v = <OffthreadVideo src={staticFile(`${R}memes/${m}.${ext}`)} muted transparent={ext === "webm"} style={{ width: w, display: "block", borderRadius: frame ? 14 : 0 }} />;
  return (
    <AbsoluteFill style={{ overflow: "hidden", opacity: o }}>
      {clip ? <BgClip clip={clip} ss={ss} life={life} blur={14} dim={0.35} /> : null}
      {tint ? <AbsoluteFill style={{ background: tint }} /> : null}
      <div style={{ position: "absolute", left: (1080 - w) / 2, top: y, transform: `translate(${sh.x}px, ${sh.y}px) rotate(${rot * p}deg) scale(${0.4 + 0.6 * p})`, filter: frame ? "drop-shadow(0 30px 60px rgba(0,0,0,0.7))" : "drop-shadow(0 0 0 #fff) drop-shadow(0 20px 40px rgba(0,0,0,0.6))" }}>
        <div style={frame ? { border: `10px solid ${CREAM}`, borderRadius: 18, background: CREAM } : undefined}>{v}</div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- LOJA DE SKINS fechada: os heróis (arte oficial) entram como vitrine e caem as correntes com cadeado ----------
export const MGLocked: React.FC<{ life: number; heroes: string[]; lockAt: number }> = ({ life, heroes, lockAt }) => {
  const f = useCurrentFrame();
  const head = back(f, 0, 12, 1.3);
  const chain = interpolate(f, [lockAt, lockAt + 7], [-900, 0], { ...clamp, easing: Easing.in(Easing.quad) });
  const sh = shake(f, lockAt + 7, 18, 10, "lock");
  const gray = ease(f, lockAt + 7, 10);
  return (
    <AbsoluteFill style={{ background: INK, overflow: "hidden", opacity: outF(f, life, 3) }}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 90% 60% at 50% 45%, ${TEAL} 0%, ${INK} 75%)` }} />
      <Halftone c={SOUL} o={0.06} size={16} />
      <Souls n={12} o={0.6 * (1 - gray)} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, transform: `translate(${sh.x}px, ${sh.y}px)` }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 210, textAlign: "center", opacity: head, transform: `translateY(${(1 - head) * -50}px)` }}>
          <Img src={img("dl_logo.png")} style={{ width: 420 }} />
          <div style={{ fontFamily: POSTER, fontSize: 120, color: CREAM, lineHeight: 1.05, letterSpacing: 4, marginTop: 6 }}>LOJA DE SKINS</div>
        </div>
        {heroes.map((h, i) => {
          const col = i % 3, row = Math.floor(i / 3);
          const e = back(f, 4 + i * 3, 12, 1.5);
          const x = 95 + col * 300, y = 480 + row * 410;
          return (
            <div key={h} style={{ position: "absolute", left: x, top: y, width: 270, height: 380, transform: `translateY(${(1 - e) * 200}px) rotate(${(col - 1) * 2}deg) scale(${0.6 + 0.4 * e})`, opacity: Math.min(1, e * 1.4) }}>
              <div style={{ position: "absolute", inset: 0, borderRadius: 10, overflow: "hidden", border: `4px solid ${CREAM}`, boxShadow: "0 20px 40px rgba(0,0,0,0.6)", filter: `grayscale(${gray}) brightness(${1 - gray * 0.45})` }}>
                <Img src={staticFile(`${DLP}${h}_card.png`)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 15%" }} />
                <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "10px 12px", background: "linear-gradient(180deg, rgba(0,0,0,0), rgba(0,0,0,0.85))", fontFamily: BODY, fontWeight: 900, fontSize: 26, color: CREAM, textAlign: "center" }}>{h.replace(/_/g, " ")}</div>
              </div>
            </div>
          );
        })}
        {/* correntes em X e o cadeado */}
        {f >= lockAt ? (
          <div style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, transform: `translateY(${chain}px)` }}>
            {[-28, 28].map((r) => (
              <div key={r} style={{ position: "absolute", left: -120, top: 860, width: 1320, height: 70, transform: `rotate(${r}deg)`, display: "flex", gap: 6, alignItems: "center", justifyContent: "center" }}>
                {Array.from({ length: 22 }).map((_, k) => <div key={k} style={{ width: 70, height: k % 2 ? 26 : 50, borderRadius: 26, border: "9px solid #9aa3a8", boxShadow: "inset 0 0 6px rgba(0,0,0,0.6), 0 6px 10px rgba(0,0,0,0.6)", background: "transparent" }} />)}
              </div>
            ))}
            <svg width={260} height={300} viewBox="0 0 26 30" style={{ position: "absolute", left: 410, top: 760, filter: "drop-shadow(0 20px 30px rgba(0,0,0,0.8))" }}>
              <path d="M7 13 V8 a6 6 0 0 1 12 0 V13" fill="none" stroke="#b8bfc4" strokeWidth={3.2} />
              <rect x={3} y={12} width={20} height={16} rx={3} fill="#d9a441" stroke="#7a5512" strokeWidth={1} />
              <circle cx={13} cy={19} r={2.2} fill="#3b2a08" /><rect x={12.2} y={20} width={1.6} height={4.5} fill="#3b2a08" />
            </svg>
          </div>
        ) : null}
      </div>
      <Vignette o={0.65} />
      <Grain />
      <AbsoluteFill style={{ background: "#fff", opacity: fl(f, lockAt + 7, lockAt + 12, 0.4), pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};

// ---------- MOD do Bakugo (GameBanana, real): print no jogo com círculo → Danny original × Bakugo → página do mod + carimbo ----------
export const MGMod: React.FC<{ life: number; circleAt: number; dannyAt: number; bakuAt: number; pageAt: number; modAt: number }> = ({ life, circleAt, dannyAt, bakuAt, pageAt, modAt }) => {
  const f = useCurrentFrame();
  const st = f < dannyAt ? 0 : f < pageAt ? 1 : 2;
  const e0 = back(f, 0, 12, 1.2);
  const e1 = back(f, dannyAt, 12, 1.3);
  const e2 = back(f, pageAt, 12, 1.2);
  const flash = Math.max(fl(f, dannyAt, dannyAt + 5, 0.4), fl(f, pageAt, pageAt + 5, 0.4), fl(f, modAt + 5, modAt + 10, 0.35));
  return (
    <AbsoluteFill style={{ background: INK, overflow: "hidden", opacity: outF(f, life, 3) }}>
      <AbsoluteFill style={{ transform: "scale(1.2)" }}>
        <Img src={img("bakugo1.jpg")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "blur(20px) brightness(0.3)" }} />
      </AbsoluteFill>
      <Halftone c={EMBER} o={0.07} size={14} />
      {st === 0 ? (
        // o print no jogo, grande, com zoom lento e círculo no Bakugo
        <div style={{ position: "absolute", left: 40, top: 300, width: 1000, height: 800, borderRadius: 14, overflow: "hidden", border: `6px solid ${CREAM}`, boxShadow: "0 40px 90px rgba(0,0,0,0.75)", transform: `rotate(${-2 * e0}deg) scale(${0.7 + 0.3 * e0})`, opacity: e0 }}>
          <AbsoluteFill style={{ transform: `scale(${1.05 + f * 0.0015})`, transformOrigin: "75% 45%" }}>
            <Img src={img("bakugo1.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </AbsoluteFill>
          <div style={{ position: "absolute", left: 520, top: 110 }}><Marker at={circleAt} w={380} h={620} /></div>
        </div>
      ) : null}
      {st === 1 ? (
        <>
          <div style={{ position: "absolute", left: 60, top: 330, width: 430, height: 600, borderRadius: 12, overflow: "hidden", border: `5px solid ${CREAM}`, transform: `translateX(${(1 - e1) * -500}px) rotate(-3deg)`, boxShadow: "0 30px 70px rgba(0,0,0,0.7)" }}>
            <Img src={staticFile(`${DLP}Deadman_Danny_card.png`)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 15%" }} />
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: 14, background: "linear-gradient(180deg, rgba(0,0,0,0), rgba(0,0,0,0.9))", fontFamily: POSTER, fontSize: 52, color: CREAM, textAlign: "center" }}>DEADMAN DANNY</div>
          </div>
          <svg width={120} height={90} viewBox="0 0 120 90" style={{ position: "absolute", left: 480, top: 590, opacity: ease(f, dannyAt + 8, 6) }}>
            <path d="M8 45 H100 M70 15 L104 45 L70 75" fill="none" stroke={CREAM} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {f >= bakuAt - 4 ? (
            <div style={{ position: "absolute", left: 590, top: 310, width: 440, height: 640, borderRadius: 12, overflow: "hidden", border: `5px solid ${EMBER}`, transform: `scale(${back(f, bakuAt - 4, 10, 1.8)}) rotate(4deg)`, boxShadow: `0 30px 70px rgba(0,0,0,0.7), 0 0 60px ${EMBER}66` }}>
              <Img src={img("bakugo0.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "40% 30%" }} />
            </div>
          ) : null}
        </>
      ) : null}
      {st === 2 ? (
        // página real do mod no GameBanana
        <div style={{ position: "absolute", left: 70, top: 260, width: 940, transform: `translateY(${(1 - e2) * 300}px) rotate(${-1.5 * e2}deg)`, opacity: e2 }}>
          <div style={{ borderRadius: 14, overflow: "hidden", background: "#1f2326", boxShadow: "0 50px 110px rgba(0,0,0,0.8)" }}>
            <div style={{ height: 66, background: "#2d3236", display: "flex", alignItems: "center", padding: "0 24px", gap: 14 }}>
              <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 30, color: "#f7c400" }}>GameBanana</div>
              <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 22, color: "#9aa3a8" }}>› Deadlock › Skins › Deadman Danny</div>
            </div>
            <div style={{ height: 470, position: "relative", overflow: "hidden" }}>
              <Img src={img("bakugo0.jpg")} style={{ position: "absolute", left: 0, top: -60, width: "100%", transform: `scale(${1 + (f - pageAt) * 0.0012})` }} />
            </div>
            <div style={{ padding: "22px 26px 26px" }}>
              <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 46, color: "#fff" }}>Katsuki Bakugo | Deadman Danny</div>
              <div style={{ display: "flex", gap: 24, marginTop: 10, fontFamily: BODY, fontWeight: 800, fontSize: 26, color: "#9aa3a8" }}>
                <span>por velvetfog</span><span>⬇ 7.097</span><span>👁 1.234</span>
              </div>
            </div>
          </div>
          <div style={{ position: "absolute", left: 170, top: 300 }}><Stamp text="mod de fã" sub="NÃO É DA VALVE" at={modAt} size={120} rot={-9} /></div>
        </div>
      ) : null}
      <Vignette o={0.6} />
      <Grain />
      <AbsoluteFill style={{ background: "#fff", opacity: flash, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};

// ---------- MATÉRIA real (PC Gamer): janela do navegador, foto da matéria, título original e a tradução marcada ----------
type HL = { t: string; at: number };
// cont = continuação da mesma matéria depois de um meme (já está na tela: sem a entrada)
export const MGArticle: React.FC<{ life: number; site?: string; head: string; img0: string; date: string; author?: string; pt: HL[]; tag?: string; cont?: boolean; url?: string }> = ({ life, site = "PC GAMER", head, img0, date, author, pt, tag, cont, url = "pcgamer.com/games/moba" }) => {
  const f = useCurrentFrame();
  const a = cont ? 1 : back(f, 0, 14, 1.2);
  // pedido 06/11: nada de texto rolando dentro do card; o card inteiro é que gira (texto parado nele)
  const scroll = 0;
  const rotY = interpolate(f, [0, life], cont ? [-5, -13] : [12, -5], clamp);
  const rotZ = interpolate(f, [0, life], cont ? [-0.6, -1.6] : [1.4, -0.6], clamp);
  const push = interpolate(f, [0, life], cont ? [1.03, 1.07] : [0.97, 1.03], clamp);
  return (
    <AbsoluteFill style={{ background: "#0c0c0f", overflow: "hidden", opacity: outF(f, life, 3) }}>
      <AbsoluteFill style={{ transform: "scale(1.2)" }}>
        <Img src={img(img0)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "blur(22px) brightness(0.3)" }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ perspective: 1800 }}>
        <div style={{ position: "absolute", left: 60, top: 220, width: 960, transform: `translateY(${(1 - a) * 400}px) rotateY(${rotY}deg) rotateX(4deg) rotateZ(${rotZ}deg) scale(${(0.92 + 0.08 * a) * push})`, opacity: a, transformOrigin: "50% 20%" }}>
          <div style={{ borderRadius: 14, overflow: "hidden", background: "#fff", boxShadow: "0 50px 120px rgba(0,0,0,0.8)" }}>
            <div style={{ height: 52, background: "#e9e9ec", display: "flex", alignItems: "center", gap: 10, padding: "0 18px" }}>
              {["#ff5f57", "#febc2e", "#28c840"].map((c) => <div key={c} style={{ width: 15, height: 15, borderRadius: 8, background: c }} />)}
              <div style={{ marginLeft: 14, flex: 1, height: 30, borderRadius: 8, background: "#fff", color: "#666", fontFamily: BODY, fontWeight: 700, fontSize: 19, display: "flex", alignItems: "center", paddingLeft: 12 }}>{url}</div>
            </div>
            <div style={{ height: 64, background: "#c4161c", display: "flex", alignItems: "center", padding: "0 24px", justifyContent: "space-between" }}>
              <div style={{ fontFamily: POSTER, fontSize: 40, color: "#fff", letterSpacing: 2 }}>{site}</div>
              <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 20, color: "#fff" }}>{tag ?? "LEAGUE OF LEGENDS"}</div>
            </div>
            <div style={{ height: 820, overflow: "hidden", position: "relative" }}>
              <div style={{ transform: `translateY(${-scroll}px)`, padding: "26px 30px" }}>
                <div style={{ fontFamily: "Georgia, serif", fontWeight: 700, fontSize: 46, lineHeight: 1.14, color: "#111" }}>{head}</div>
                <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 22, color: "#777", marginTop: 14 }}>{author ? `${author} · ` : ""}{date}</div>
                <div style={{ marginTop: 18, height: 470, borderRadius: 6, overflow: "hidden" }}>
                  <Img src={img(img0)} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${1.02 + f * 0.0008})` }} />
                </div>
              </div>
            </div>
          </div>
          {/* tradução: cartões de marca-texto que entram na fala */}
          <div style={{ position: "absolute", left: -10, right: -10, top: 560, display: "flex", flexDirection: "column", gap: 18, alignItems: "flex-start" }}>
            {pt.map((h, i) => {
              if (f < h.at) return null;
              const e = back(f, h.at, 10, 1.7);
              const sw = interpolate(f, [h.at + 3, h.at + 13], [0, 100], { ...clamp, easing: Easing.out(Easing.cubic) });
              return (
                <div key={i} style={{ transform: `rotate(${i % 2 ? 1.5 : -1.5}deg) scale(${e})`, transformOrigin: "0% 50%", background: "#111", padding: "14px 22px", borderRadius: 8, boxShadow: "0 20px 40px rgba(0,0,0,0.6)", position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${sw}%`, background: "#ffe24a" }} />
                  <div style={{ position: "relative", fontFamily: BODY, fontWeight: 900, fontSize: 50, color: "#111", lineHeight: 1.1 }}>“{h.t}”</div>
                </div>
              );
            })}
          </div>
        </div>
      </AbsoluteFill>
      <Vignette o={0.55} />
      <Grain o={0.06} />
    </AbsoluteFill>
  );
};

// ---------- A MAGIA: emblema oficial no centro, anéis de runa girando, almas sendo sugadas, gameplay atrás ----------
export const MGMagic: React.FC<{ life: number; clip?: string; ss?: number }> = ({ life, clip = "k4", ss = 120 }) => {
  const f = useCurrentFrame();
  const e = back(f, 0, 16, 1.3);
  const pulse = 1 + 0.03 * Math.sin(f / 6);
  return (
    <AbsoluteFill style={{ background: INK, overflow: "hidden", opacity: outF(f, life, 3) }}>
      <BgClip clip={clip} ss={ss} life={life} blur={10} dim={0.3} />
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 42%, ${TEAL}ee 0%, ${INK}f0 60%)` }} />
      {/* almas espiralando para o centro */}
      {Array.from({ length: 26 }).map((_, i) => {
        const t = ((f * 0.012 + random(`m${i}`)) % 1);
        const ang = random(`ma${i}`) * Math.PI * 2 + t * 5;
        const r = (1 - t) * 620;
        const s = 8 + random(`ms${i}`) * 10;
        return <div key={i} style={{ position: "absolute", left: 540 + Math.cos(ang) * r - s / 2, top: 800 + Math.sin(ang) * r * 0.9 - s / 2, width: s, height: s, borderRadius: "50%", background: SOUL, boxShadow: `0 0 ${s * 2}px ${SOUL}`, opacity: Math.min(1, t * 3) * (1 - t) * 1.4 }} />;
      })}
      {[460, 600, 740].map((d, i) => (
        <svg key={d} width={d} height={d} viewBox="-100 -100 200 200" style={{ position: "absolute", left: 540 - d / 2, top: 800 - d / 2, opacity: e * (0.55 - i * 0.12), transform: `rotate(${(i % 2 ? -1 : 1) * f * (0.6 - i * 0.15)}deg) scale(${e})` }}>
          <circle r={96} fill="none" stroke={CREAM} strokeWidth={1.2} strokeDasharray={i === 1 ? "2 6" : undefined} />
          {Array.from({ length: 12 }).map((_, k) => (
            <g key={k} transform={`rotate(${k * 30})`}><path d="M0 -96 L4 -88 L0 -80 L-4 -88 Z" fill={i === 0 ? SOUL : CREAM} /></g>
          ))}
        </svg>
      ))}
      <div style={{ position: "absolute", left: 540 - 190, top: 800 - 190, width: 380, height: 380, transform: `scale(${e * pulse}) rotate(${interpolate(f, [0, 24], [-180, 0], { ...clamp, easing: Easing.out(Easing.cubic) })}deg)`, filter: `drop-shadow(0 0 40px ${SOUL}) drop-shadow(0 0 90px ${SOUL}88)` }}>
        <Img src={img("dl_emblem.png")} style={{ width: "100%", height: "100%" }} />
      </div>
      <Vignette o={0.7} />
      <Grain />
    </AbsoluteFill>
  );
};

// ---------- FUSÃO: logos reais orbitando o emblema; no "juntou" todas voam pro centro e nasce a logo do Deadlock ----------
type FL = { logo: string; at: number; w?: number };
export const MGFuse: React.FC<{ life: number; logos: FL[]; fuseAt: number }> = ({ life, logos, fuseAt }) => {
  const f = useCurrentFrame();
  const fu = interpolate(f, [fuseAt, fuseAt + 8], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const boom = f >= fuseAt + 8;
  const sh = shake(f, fuseAt + 8, 20, 12, "fuse");
  return (
    <AbsoluteFill style={{ background: INK, overflow: "hidden", opacity: outF(f, life, 3) }}>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 45%, ${TEAL} 0%, ${INK} 70%)` }} />
      <Halftone c={CREAM} o={0.05} size={14} />
      <Souls n={16} o={0.7} speed={boom ? 2.2 : 1} />
      <div style={{ position: "absolute", inset: 0, transform: `translate(${sh.x}px, ${sh.y}px)` }}>
        {logos.map((l, i) => {
          if (f < l.at) return null;
          const e = back(f, l.at, 12, 1.6);
          const ang = (i / logos.length) * Math.PI * 2 - Math.PI / 2 + f * 0.012;
          const r = 330 * (1 - fu);
          const x = 540 + Math.cos(ang) * r * 1.05, y = 820 + Math.sin(ang) * r * 1.25;
          const w = (l.w ?? 400) * (1 - fu * 0.8);
          return (
            <div key={l.logo} style={{ position: "absolute", left: x - w / 2, top: y - 70, width: w, height: 140, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${e})`, opacity: boom ? 0 : 1 }}>
              <Img src={img(l.logo)} style={{ maxWidth: w, maxHeight: 140, objectFit: "contain", filter: "drop-shadow(0 10px 30px rgba(0,0,0,0.8))" }} />
            </div>
          );
        })}
        {boom ? (
          <div style={{ position: "absolute", left: 0, right: 0, top: 720, display: "flex", justifyContent: "center", transform: `scale(${interpolate(f, [fuseAt + 8, fuseAt + 14], [1.8, 1], { ...clamp, easing: Easing.out(Easing.cubic) })})` }}>
            <Img src={img("dl_logo.png")} style={{ width: 900, filter: `drop-shadow(0 0 50px ${SOUL}aa) drop-shadow(0 14px 30px rgba(0,0,0,0.8))` }} />
          </div>
        ) : (
          <div style={{ position: "absolute", left: 540 - 110, top: 820 - 110, width: 220, height: 220, transform: `rotate(${f * 1.2}deg) scale(${1 + fu * 0.5})`, filter: `drop-shadow(0 0 30px ${SOUL})`, opacity: ease(f, 0, 10) }}>
            <Img src={img("dl_emblem.png")} style={{ width: "100%", height: "100%" }} />
          </div>
        )}
      </div>
      {boom ? <div style={{ position: "absolute", left: 540, top: 820, width: 10, height: 10, borderRadius: "50%", boxShadow: `0 0 0 ${interpolate(f, [fuseAt + 8, fuseAt + 22], [0, 900], clamp)}px ${SOUL}`, opacity: fl(f, fuseAt + 8, fuseAt + 22, 0.5) }} /> : null}
      <Vignette o={0.65} />
      <Grain />
      <AbsoluteFill style={{ background: "#fff", opacity: fl(f, fuseAt + 8, fuseAt + 14, 0.7), pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};

// ---------- LOJA DE ITEM: os ícones reais do jogo (pôsteres de papel) caindo em grade, um por um ----------
export const MGItems: React.FC<{ life: number; items: string[]; every?: number }> = ({ life, items, every = 2 }) => {
  const f = useCurrentFrame();
  const head = back(f, 0, 10, 1.4);
  return (
    <AbsoluteFill style={{ background: INK, overflow: "hidden", opacity: outF(f, life, 3) }}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 90% 60% at 50% 45%, #3a2f22 0%, ${INK} 75%)` }} />
      <Halftone c={CREAM} o={0.06} size={12} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 200, textAlign: "center", opacity: head, transform: `translateY(${(1 - head) * -40}px)` }}>
        <div style={{ fontFamily: POSTER, fontSize: 118, color: CREAM, letterSpacing: 4, lineHeight: 1 }}>LOJA DE ITEM</div>
        <div style={{ display: "flex", justifyContent: "center", gap: 14, marginTop: 14 }}>
          {[["ARMA", EMBER], ["VITALIDADE", "#7bd36a"], ["ESPÍRITO", SPIRIT]].map(([t, c]) => (
            <div key={t} style={{ fontFamily: BODY, fontWeight: 900, fontSize: 26, letterSpacing: 3, color: INK, background: c, padding: "6px 16px", borderRadius: 4 }}>{t}</div>
          ))}
        </div>
      </div>
      {items.map((it, i) => {
        const col = i % 4, row = Math.floor(i / 4);
        const at = 6 + i * every;
        const e = back(f, at, 9, 2);
        const x = 95 + col * 226, y = 440 + row * 226;
        return (
          <div key={it} style={{ position: "absolute", left: x, top: y, width: 200, height: 200, transform: `scale(${e}) rotate(${(1 - e) * (i % 2 ? 20 : -20)}deg)`, opacity: Math.min(1, e * 2), borderRadius: 10, overflow: "hidden", boxShadow: "0 14px 30px rgba(0,0,0,0.6)", border: `3px solid ${CREAM}55` }}>
            <Img src={img(`items/${it}.png`)} style={{ width: "100%", height: "100%" }} />
          </div>
        );
      })}
      <Vignette o={0.6} />
      <Grain />
    </AbsoluteFill>
  );
};

// ---------- MISTURA: cada jogo citado entra como painel (arte real) + logo; "+" entre eles ----------
type EQ = { logo: string; art: string; at: number };
export const MGMixEq: React.FC<{ life: number; parts: EQ[]; eqAt?: number }> = ({ life, parts, eqAt = 9999 }) => {
  const f = useCurrentFrame();
  const n = parts.length;
  const H = 230;
  const eq = f >= eqAt;
  return (
    <AbsoluteFill style={{ background: INK, overflow: "hidden", opacity: outF(f, life, 3) }}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 90% 60% at 50% 45%, ${TEAL} 0%, ${INK} 75%)` }} />
      {parts.map((p, i) => {
        if (f < p.at) return null;
        const e = interpolate(f, [p.at, p.at + 7], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
        const y = 200 + i * (H + 30);
        const sh = shake(f, p.at + 6, 10, 8, `eq${i}`);
        return (
          <React.Fragment key={p.logo}>
            <div style={{ position: "absolute", left: 60, width: 960, top: y, height: H, borderRadius: 12, overflow: "hidden", transform: `translate(${(1 - e) * (i % 2 ? 1200 : -1200) + sh.x}px, ${sh.y}px) skewX(-6deg)`, boxShadow: "0 20px 50px rgba(0,0,0,0.7)", border: `4px solid ${CREAM}`, filter: eq ? "grayscale(0.6) brightness(0.6)" : undefined }}>
              <Img src={img(p.art)} style={{ position: "absolute", left: -60, top: 0, width: 1140, height: H, objectFit: "cover", transform: `translateX(${-f * 0.8}px) skewX(6deg)` }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.1) 70%)" }} />
              <div style={{ position: "absolute", left: 50, top: 0, bottom: 0, display: "flex", alignItems: "center", transform: "skewX(6deg)" }}>
                <Img src={img(p.logo)} style={{ maxWidth: 500, maxHeight: 150, objectFit: "contain", filter: "drop-shadow(0 6px 20px rgba(0,0,0,0.9))" }} />
              </div>
            </div>
            {i > 0 ? <div style={{ position: "absolute", left: 470, top: y - 64, width: 140, height: 90, textAlign: "center", fontFamily: POSTER, fontSize: 96, lineHeight: "90px", color: SOUL, textShadow: "0 6px 20px rgba(0,0,0,0.9)", transform: `scale(${back(f, p.at + 2, 8, 2)})` }}>+</div> : null}
          </React.Fragment>
        );
      })}
      {eq ? (
        <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center", background: `rgba(11,20,18,${ease(f, eqAt, 6) * 0.7})` }}>
          <div style={{ transform: `scale(${interpolate(f, [eqAt, eqAt + 6], [2, 1], { ...clamp, easing: Easing.in(Easing.quad) })})`, textAlign: "center", marginTop: -200 }}>
            <div style={{ fontFamily: POSTER, fontSize: 160, color: SOUL, lineHeight: 1 }}>=</div>
            <Img src={img("dl_logo.png")} style={{ width: 880, filter: `drop-shadow(0 0 50px ${SOUL}88)` }} />
          </div>
        </AbsoluteFill>
      ) : null}
      <Vignette o={0.6} />
      <Grain />
    </AbsoluteFill>
  );
};

// ---------- O DEVER DE CASA DA VALVE (07/11): a v1 era uma caixinha "DOTA 2 ✓ MOBA" num fundo vazio ("muito mal feito,
// tela sem uso, sem movimento"). Agora é um caderno de verdade ocupando a tela: cada lição entra na palavra dele com a
// foto do jogo colada com fita (arte da Steam + logo oficial), a lição escrita à mão, um ícone que se desenha
// (mapa de 3 lanes, estrelas, skins reais do CS) e o visto de caneta vermelha. A câmera desce pelo caderno lição a
// lição; no fim abre a página inteira, chove moeda e vem o "nota 10". ----------
const HandText: React.FC<{ text: string; at: number; n?: number; size?: number; c?: string }> = ({ text, at, n = 14, size = 64, c = "#1d2a6b" }) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [at, at + n], [0, 100], { ...clamp, easing: Easing.inOut(Easing.quad) });
  return <div style={{ fontFamily: HAND, fontWeight: 700, fontSize: size, color: c, lineHeight: 1.0, whiteSpace: "nowrap", clipPath: `inset(-20% ${100 - p}% -30% 0)` }}>{text}</div>;
};
const Check: React.FC<{ at: number; s?: number }> = ({ at, s = 120 }) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [at, at + 8], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  if (p <= 0) return null;
  return (
    <svg width={s} height={s} viewBox="0 0 100 100" style={{ overflow: "visible" }}>
      <path d="M8 55 L38 84 L94 10" fill="none" stroke="#d8352a" strokeWidth={13} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
    </svg>
  );
};
const Tape: React.FC<{ x: number; y: number; r: number }> = ({ x, y, r }) => (
  <div style={{ position: "absolute", left: x, top: y, width: 150, height: 44, background: "rgba(240,232,200,0.72)", transform: `rotate(${r}deg)`, boxShadow: "0 2px 6px rgba(0,0,0,0.18)" }} />
);
const Polaroid: React.FC<{ at: number; art: string; logo: string; rot: number; lw?: number }> = ({ at, art, logo, rot, lw = 230 }) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  const e = back(f, at, 9, 1.5);
  return (
    <div style={{ position: "absolute", left: 40, top: 30, width: 380, padding: "16px 16px 64px", background: "#fbfaf6", boxShadow: "0 18px 40px rgba(0,0,0,0.35)",
      transform: `translateY(${(1 - e) * -160}px) rotate(${rot + (1 - e) * 14}deg) scale(${0.7 + 0.3 * e})`, opacity: Math.min(1, e * 2) }}>
      <div style={{ height: 250, overflow: "hidden", position: "relative" }}>
        <Img src={img(art)} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${1.08 + (f - at) * 0.0012})` }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(0,0,0,0.6) 100%)" }} />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 10, display: "flex", justifyContent: "center" }}>
        <Img src={img(logo)} style={{ width: lw, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))" }} />
      </div>
      <Tape x={110} y={-22} r={-4} />
    </div>
  );
};
// mapa de 3 lanes (MOBA) se desenhando
const LaneMap: React.FC<{ at: number }> = ({ at }) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  const p = (k: number) => interpolate(f, [at + k * 4, at + k * 4 + 10], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const ln = (d: string, k: number) => <path d={d} fill="none" stroke="#e8d9a8" strokeWidth={9} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p(k)} />;
  return (
    <svg width={210} height={210} viewBox="0 0 100 100" style={{ overflow: "visible", transform: `rotate(-4deg) scale(${0.85 + 0.15 * ease(f, at, 8)})` }}>
      <rect x={4} y={4} width={92} height={92} rx={8} fill="#2f5d3a" opacity={ease(f, at, 6)} stroke="#1d2a6b" strokeWidth={3} />
      {ln("M14 86 L14 14 L86 14", 0)}
      {ln("M14 86 L86 14", 1)}
      {ln("M14 86 L86 86 L86 14", 2)}
      <circle cx={14} cy={86} r={9 * ease(f, at + 10, 6)} fill="#5ff2d6" stroke="#fff" strokeWidth={2} />
      <circle cx={86} cy={14} r={9 * ease(f, at + 12, 6)} fill="#ff5a4a" stroke="#fff" strokeWidth={2} />
    </svg>
  );
};
const Stars: React.FC<{ at: number }> = ({ at }) => {
  const f = useCurrentFrame();
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {[0, 1, 2, 3, 4].map((i) => {
        const e = back(f, at + i * 3, 8, 2.4);
        return (
          <svg key={i} width={62} height={62} viewBox="0 0 24 24" style={{ transform: `scale(${e}) rotate(${(1 - e) * 90}deg)` }}>
            <path d="M12 2l3 6.6 7 .8-5.2 4.8 1.4 7L12 17.8 5.8 21.2l1.4-7L2 9.4l7-.8z" fill="#ffc531" stroke="#a86b00" strokeWidth={1.2} />
          </svg>
        );
      })}
    </div>
  );
};
const Coins: React.FC<{ at: number }> = ({ at }) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {Array.from({ length: 26 }, (_, i) => {
        const t = f - at - random(`cd${i}`) * 14;
        if (t < 0) return null;
        const x = 60 + random(`cx${i}`) * 960;
        const y = -120 + t * t * 0.9 + t * (14 + random(`cv${i}`) * 10);
        if (y > 2000) return null;
        const r = t * (8 + random(`cr${i}`) * 10);
        const sc = 0.7 + random(`cs${i}`) * 0.6;
        return (
          <div key={i} style={{ position: "absolute", left: x, top: y, width: 70 * sc, height: 70 * sc, borderRadius: "50%", background: "radial-gradient(circle at 35% 30%, #fff2a8, #f1b51c 45%, #a8700a)",
            border: "4px solid #8a5a00", transform: `rotateY(${r}deg)`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: POSTER, fontSize: 40 * sc, color: "#7a4d00", boxShadow: "0 6px 14px rgba(0,0,0,0.4)" }}>$</div>
        );
      })}
    </AbsoluteFill>
  );
};
const wrap = (s: string, n: number) => s.split(" ").reduce<string[]>((acc, w) => {
  const last = acc[acc.length - 1];
  if (last && (last + " " + w).length <= n) acc[acc.length - 1] = last + " " + w;
  else acc.push(w);
  return acc;
}, []);
type Lesson = { at: number; doneAt: number; art: string; logo: string; lw?: number; who: string; what: string };
export const MGHomework: React.FC<{ life: number; dotaAt: number; mobaAt: number; tfAt: number; persAt: number; csAt: number; dota2At: number; fortAt: number }> = ({ life, dotaAt, mobaAt, tfAt, persAt, csAt, dota2At, fortAt }) => {
  const f = useCurrentFrame();
  const L: Lesson[] = [
    { at: dotaAt, doneAt: mobaAt, art: "dota_hero.jpg", logo: "dota_logo.png", who: "o Dota ensinou:", what: "como fazer MOBA" },
    { at: tfAt, doneAt: persAt, art: "tf2_hero.jpg", logo: "tf2_logo.png", lw: 200, who: "o TF2 ensinou:", what: "personagem com qualidade" },
    { at: csAt, doneAt: fortAt, art: "cs_hero.jpg", logo: "cs_logo.png", lw: 250, who: "CS e Dota ensinaram:", what: "fortuna só com skin" },
  ];
  const ROW = 400, TOP = 300;
  const notaAt = Math.min(life - 12, fortAt + 22);
  // câmera: cabeçalho → lição 1 → 2 → 3 → página inteira
  const keys = [0, dotaAt - 8, tfAt - 8, csAt - 8];
  const ys = [420, TOP + ROW * 0.5, TOP + ROW * 1.5, TOP + ROW * 2.3];
  const focus = interpolate(f, keys, ys, { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const zoom = 1.18 + interpolate(f, [0, life], [0, 0.05], clamp);
  const enter = back(f, 0, 14, 1.2);
  const rotX = interpolate(f, [0, life], [10, 4], clamp);
  const rotZ = interpolate(f, [0, life], [-2.4, 1.2], clamp);
  const sh = shake(f, notaAt + 5, 14, 9, "nota");
  const PH = TOP + ROW * 3 + 900;
  return (
    <AbsoluteFill style={{ background: "#141019", overflow: "hidden", opacity: outF(f, life, 3) }}>
      {/* mesa: arte do Deadlock desfocada e escura */}
      <AbsoluteFill style={{ transform: "scale(1.25)" }}>
        <Img src={img("dl_hero.jpg")} style={{ position: "absolute", left: -600 - f * 0.5, top: 0, height: 1920, filter: "blur(18px) brightness(0.32) saturate(1.1)" }} />
      </AbsoluteFill>
      <Souls n={14} o={0.5} />
      <AbsoluteFill style={{ perspective: 2000 }}>
        <div style={{ position: "absolute", left: 70, top: 700 - focus, width: 940, height: PH, transformOrigin: `50% ${focus}px`,
          transform: `translate(${sh.x}px, ${(1 - enter) * 500 + sh.y}px) rotateX(${rotX}deg) rotateZ(${rotZ}deg) scale(${zoom})` }}>
          {/* folha pautada */}
          <div style={{ position: "absolute", inset: 0, borderRadius: 10, background: "#f7f3e8", boxShadow: "0 60px 140px rgba(0,0,0,0.75)",
            backgroundImage: "repeating-linear-gradient(180deg, rgba(0,0,0,0) 0px, rgba(0,0,0,0) 62px, rgba(70,120,190,0.28) 62px, rgba(70,120,190,0.28) 64px)" }} />
          <div style={{ position: "absolute", left: 120, top: 0, bottom: 0, width: 3, background: "rgba(215,60,60,0.55)" }} />
          {Array.from({ length: 16 }, (_, i) => <div key={i} style={{ position: "absolute", left: 30, top: 70 + i * ((PH - 140) / 15), width: 34, height: 34, borderRadius: 17, background: "#141019", boxShadow: "inset 0 3px 6px rgba(0,0,0,0.6)" }} />)}
          {/* cabeçalho */}
          <div style={{ position: "absolute", left: 150, top: 60 }}>
            <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 26, letterSpacing: 6, color: "#8a7f6a" }}>ALUNA: VALVE</div>
            <div style={{ marginTop: 6 }}><HandText text="Dever de casa" at={2} n={16} size={118} c="#141a4a" /></div>
            <svg width={560} height={30} viewBox="0 0 560 30" style={{ marginTop: -6 }}><path d="M5 18 C 140 4, 300 30, 555 10" fill="none" stroke="#d8352a" strokeWidth={6} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - ease(f, 14, 12)} /></svg>
          </div>
          {/* lições */}
          {L.map((l, i) => {
            const y = TOP + i * ROW;
            return (
              <div key={i} style={{ position: "absolute", left: 120, top: y, width: 820, height: ROW }}>
                <Polaroid at={l.at} art={l.art} logo={l.logo} lw={l.lw} rot={i % 2 ? 3 : -4} />
                {f >= l.at ? (
                  <div style={{ position: "absolute", left: 450, top: 34, width: 360 }}>
                    <HandText text={`${i + 1}. ${l.who}`} at={l.at + 4} n={12} size={46} c="#5a5a6a" />
                    <div style={{ marginTop: 6 }}>
                      {wrap(l.what, 12).map((ln, k) => <HandText key={k} text={ln} at={l.doneAt - 10 + k * 7} n={10} size={60} />)}
                    </div>
                  </div>
                ) : null}
                <div style={{ position: "absolute", left: 720, top: 236 }}><Check at={l.doneAt + 6} s={90} /></div>
                {i === 0 ? <div style={{ position: "absolute", left: 470, top: 196 }}><LaneMap at={l.doneAt - 4} /></div> : null}
                {i === 2 && f >= dota2At ? <div style={{ position: "absolute", left: 250, top: -26, transform: `rotate(10deg) scale(${back(f, dota2At, 9, 2) * 0.8})`, background: "#fbfaf6", padding: "8px 12px", borderRadius: 8, boxShadow: "0 10px 22px rgba(0,0,0,0.4)", display: "flex", alignItems: "center", gap: 6 }}><div style={{ fontFamily: HAND, fontWeight: 700, fontSize: 52, color: "#d8352a", lineHeight: 1 }}>+</div><Img src={img("dota_logo.png")} style={{ width: 130 }} /></div> : null}
                {i === 1 && f >= l.doneAt ? <div style={{ position: "absolute", left: 455, top: 250, transform: "scale(0.85)", transformOrigin: "0 0" }}><Stars at={l.doneAt} /></div> : null}
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
      {/* skins reais do CS voando por cima do caderno na "fortuna" */}
      {f >= fortAt - 4 ? (
        <AbsoluteFill style={{ pointerEvents: "none" }}>
          {[{ src: "skin_awp.png", x: 470, y: 190, r: -10, d: 0 }, { src: "skin_howl.png", x: 60, y: 330, r: 8, d: 5 }].map((k, i) => {
            const e = back(f, fortAt - 4 + k.d, 12, 1.6);
            const sw = interpolate((f - fortAt - k.d + 400) % 40, [0, 14], [-0.4, 1.4], clamp);
            return (
              <div key={i} style={{ position: "absolute", left: k.x, top: k.y + Math.sin((f + i * 20) / 14) * 10, width: 520, transform: `rotate(${k.r}deg) scale(${e})`, filter: "drop-shadow(0 26px 30px rgba(0,0,0,0.6)) drop-shadow(0 0 30px rgba(255,200,80,0.35))" }}>
                <Img src={img(k.src)} style={{ width: "100%", display: "block" }} />
                <div style={{ position: "absolute", inset: 0, WebkitMaskImage: `url(${img(k.src)})`, WebkitMaskSize: "100% 100%", background: `linear-gradient(110deg, rgba(255,255,255,0) ${sw * 100 - 15}%, rgba(255,255,255,0.75) ${sw * 100}%, rgba(255,255,255,0) ${sw * 100 + 15}%)` }} />
              </div>
            );
          })}
        </AbsoluteFill>
      ) : null}
      <Coins at={fortAt + 2} />
      {f >= notaAt ? (
            <div style={{ position: "absolute", left: 560, top: 1010, transform: `rotate(8deg) scale(${interpolate(f, [notaAt, notaAt + 5], [2.4, 1], { ...clamp, easing: Easing.in(Easing.quad) })})`, opacity: ease(f, notaAt, 3) }}>
              <div style={{ width: 300, height: 300, borderRadius: 150, border: "12px solid #d8352a", background: "rgba(247,243,232,0.6)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#d8352a" }}>
                <div style={{ fontFamily: HAND, fontWeight: 700, fontSize: 64, lineHeight: 1 }}>nota</div>
                <div style={{ fontFamily: HAND, fontWeight: 700, fontSize: 170, lineHeight: 0.9 }}>10</div>
              </div>
            </div>
          ) : null}
      <AbsoluteFill style={{ background: "#fff", opacity: fl(f, notaAt + 5, notaAt + 11, 0.3), pointerEvents: "none" }} />
      <Vignette o={0.55} />
      <Grain o={0.06} />
    </AbsoluteFill>
  );
};

// exportados para o MG3 (cenas refeitas em 07/11)
export { Grain, Vignette, Halftone, Souls, Fog, Clip, BgClip, Slam, Stamp, DLWordmark, Cursor, Marker, HandText, Check, Coins, img, clamp, ease, back, inQ, fl, outF, shake, punchZ, POSTER, SERIF, BODY, HAND, DLP, FPS };
