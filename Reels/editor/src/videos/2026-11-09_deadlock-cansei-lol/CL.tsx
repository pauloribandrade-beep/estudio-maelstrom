import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, Loop, OffthreadVideo, random, Sequence, staticFile, useCurrentFrame } from "remotion";
import { loadFont as loadAnton } from "@remotion/google-fonts/Anton";
import { loadFont as loadBody } from "@remotion/google-fonts/NunitoSans";
import { loadFont as loadHand } from "@remotion/google-fonts/Caveat";

// "Cansei do LoL" (09/11): só voz. Linha v2 do Farm: ícone + tipografia batendo, objeto em ação em cada cena, material real
// (logo do LoL/Deadlock, arte do Shaco, tela de DEFEAT, gameplay), memes nos golpes. LoL = dourado/azul-noite; Deadlock = petróleo/alma.
// Zona segura do TikTok: conteúdo entre y 180 e 1290, legenda em 1370, nada à direita de ~930 entre y 700 e 1550.
// Props *At chegam em QUADROS relativos à cena.

const { fontFamily: POSTER } = loadAnton("normal", { weights: ["400"], subsets: ["latin", "latin-ext"] });
const { fontFamily: BODY } = loadBody("normal", { weights: ["700", "800", "900"], subsets: ["latin", "latin-ext"] });
const { fontFamily: HAND } = loadHand("normal", { weights: ["700"], subsets: ["latin", "latin-ext"] });

const mg = (n: string) => staticFile(`videos/2026-11-06_deadlock-magia_R/mg/${n}`);
const clip = (n: string) => staticFile(`videos/2026-11-06_deadlock-magia_R/clips/${n}.mp4`);
const cl = (n: string) => staticFile(`videos/2026-11-09_deadlock-cansei-lol_R/cl/${n}`);
const fl3 = (n: string) => staticFile(`fluent3d/${n}.png`);
const blies = staticFile("videos/2026-11-05_deadlock-patch-celeste_R/dl/blies.jpg");
export const CL_MEME = {
  nazare: "videos/2026-11-06_deadlock-ranked_R/memes/nazare.mp4",
  esqueleto: "videos/2026-11-06_deadlock-magia_R/memes/esqueleto.mp4",
  chill: "videos/2026-11-06_deadlock-ranked_R/memes/chill.mp4",
};

const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
const ease = (f: number, a: number, n = 10) => interpolate(f, [a, a + n], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
const back = (f: number, a: number, n = 10, s = 1.8) => interpolate(f - a, [0, n], [0, 1], { ...clamp, easing: Easing.out(Easing.back(s)) });
const fl = (f: number, a: number, b: number, pk: number) => (f < a ? 0 : interpolate(f, [a, b], [pk, 0], clamp));
const shake = (f: number, at: number, amp = 14, n = 9, seed = "s") => {
  const k = f - at;
  if (k < 0 || k > n) return { x: 0, y: 0 };
  const d = amp * (1 - k / n) ** 2;
  return { x: (random(`${seed}x${k}`) - 0.5) * 2 * d, y: (random(`${seed}y${k}`) - 0.5) * 2 * d };
};
const punchZ = (f: number, ts: number[] = [], amp = 0.1, n = 9) => ts.reduce((z, t) => (f >= t && f < t + n ? z + amp * (1 - (f - t) / n) ** 2 : z), 0);

const INK = "#06090a";
const CREAM = "#f4e7cb";
const SOUL = "#5ff2d6";
const GREEN = "#6dff8a";
const RED = "#ff4a3d";
const YEL = "#ffd23f";
const GOLD = "#c8aa6e";
const LOLBG = "#2a2110";

// ---------- base ----------
const Grain: React.FC<{ o?: number }> = ({ o = 0.07 }) => {
  const f = useCurrentFrame();
  const seed = Math.floor(f / 2) % 9;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: o, mixBlendMode: "overlay", pointerEvents: "none" }}>
      <filter id={`clgr${seed}`}>
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={seed} />
        <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1.4 -0.2" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#clgr${seed})`} />
    </svg>
  );
};
const Motes: React.FC<{ n?: number; c?: string; o?: number }> = ({ n = 24, c = SOUL, o = 0.7 }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ opacity: o, pointerEvents: "none" }}>
      {Array.from({ length: n }).map((_, i) => {
        const x = random(`clx${i}`) * 1080 + Math.sin((f + i * 30) / 22) * 20;
        const sp = 1.2 + random(`clv${i}`) * 2.4;
        const y = 1980 - ((f * sp + random(`cly${i}`) * 1980) % 2100);
        const s = 3 + random(`cls${i}`) * 8;
        return <div key={i} style={{ position: "absolute", left: x, top: y, width: s, height: s, borderRadius: "50%", background: c, boxShadow: `0 0 ${s * 2.5}px ${s * 0.8}px ${c}`, opacity: 0.2 + random(`clo${i}`) * 0.6 }} />;
      })}
    </AbsoluteFill>
  );
};
// fundo: preto limpo com brilho do lado (lol = dourado, dl = petróleo)
const Void: React.FC<{ side?: "lol" | "dl" | "red"; children?: React.ReactNode; z?: number }> = ({ side = "dl", children, z = 1 }) => {
  const glow = side === "lol" ? LOLBG : side === "red" ? "#3a120c" : "#0f3a34";
  return (
    <AbsoluteFill style={{ background: INK, overflow: "hidden" }}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 80% 55% at 50% 42%, ${glow} 0%, rgba(0,0,0,0) 70%)` }} />
      <div style={{ position: "absolute", inset: 0, opacity: 0.12, backgroundImage: "linear-gradient(#ffffff10 2px, transparent 2px), linear-gradient(90deg, #ffffff10 2px, transparent 2px)", backgroundSize: "90px 90px" }} />
      <Motes c={side === "lol" ? GOLD : side === "red" ? RED : SOUL} o={side === "lol" ? 0.45 : 0.7} />
      <AbsoluteFill style={{ transform: `scale(${z})` }}>{children}</AbsoluteFill>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 90% 75% at 50% 45%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.8) 100%)", pointerEvents: "none" }} />
      <Grain />
    </AbsoluteFill>
  );
};
const Flash: React.FC<{ f: number; ts: number[]; pk?: number; c?: string }> = ({ f, ts, pk = 0.4, c = "#fff" }) => (
  <AbsoluteFill style={{ background: c, opacity: ts.reduce((a, t) => a + fl(f, t, t + 5, pk), 0), pointerEvents: "none", zIndex: 60 }} />
);
const Slam: React.FC<{ f: number; at: number; size: number; c?: string; children: React.ReactNode; glow?: string; style?: React.CSSProperties }> = ({ f, at, size, c = CREAM, children, glow, style }) => {
  if (f < at) return null;
  const s = interpolate(f, [at, at + 5], [1.7, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  const b = interpolate(f, [at, at + 5], [14, 0], clamp);
  const sh = shake(f, at + 5, 12, 8, `sl${at}${size}`);
  return (
    <div style={{ fontFamily: POSTER, fontSize: size, color: c, lineHeight: 0.95, letterSpacing: 2, textAlign: "center", whiteSpace: "nowrap", transform: `translate(${sh.x}px, ${sh.y}px) scale(${s})`, filter: `blur(${b}px)`,
      opacity: interpolate(f, [at, at + 2], [0, 1], clamp), textShadow: glow ? `0 0 40px ${glow}, 0 0 90px ${glow}88` : "0 10px 40px rgba(0,0,0,0.9)", ...style }}>{children}</div>
  );
};
const Stroke: React.FC<{ f: number; at: number; d: string; c?: string; w?: number; n?: number; vb?: string; style?: React.CSSProperties }> = ({ f, at, d, c = RED, w = 26, n = 6, vb = "0 0 1000 1000", style }) => {
  if (f < at) return null;
  const p = ease(f, at, n);
  return (
    <svg viewBox={vb} style={{ position: "absolute", overflow: "visible", ...style }}>
      <path d={d} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} style={{ filter: `drop-shadow(0 0 14px ${c}aa)` }} />
    </svg>
  );
};
const Cross: React.FC<{ f: number; at: number; w: number; h: number; style?: React.CSSProperties; c?: string }> = ({ f, at, w, h, style, c = RED }) => (
  <Stroke f={f} at={at} c={c} d="M90 90 L910 910 M910 90 L90 910" w={80} n={5} style={{ width: w, height: h, ...style }} />
);
const pop = (f: number, at: number, dy = 0): React.CSSProperties => ({ transform: `translateY(${(1 - back(f, at, 9, 1.8)) * dy}px) scale(${back(f, at, 9, 2)})`, opacity: f >= at ? 1 : 0 });
const F3: React.FC<{ n: string; w: number; at: number; f: number; style?: React.CSSProperties }> = ({ n, w, at, f, style }) =>
  f < at ? null : <Img src={fl3(n)} style={{ width: w, transform: `scale(${back(f, at, 10, 2.4)}) rotate(${Math.sin(f / 6) * 4}deg)`, ...style }} />;
const At: React.FC<{ f: number; a: number; b?: number; children: React.ReactNode }> = ({ f, a, b = 1e9, children }) => (f >= a && f < b ? <>{children}</> : null);
const Abs: React.FC<{ top: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ top, children, style }) => (
  <div style={{ position: "absolute", left: 0, right: 0, top, display: "flex", justifyContent: "center", ...style }}>{children}</div>
);
// meme em tela cheia, corte seco
export const MemeCut: React.FC<{ f: number; at: number; dur: number; src: string; ss?: number; z1?: number }> = ({ f, at, dur, src, ss = 0, z1 = 1.08 }) => {
  if (f < at - 1 || f >= at + dur) return null;
  return (
    <Sequence from={at} durationInFrames={dur} layout="none">
      <AbsoluteFill style={{ background: "#000", overflow: "hidden", zIndex: 50 }}>
        <AbsoluteFill style={{ transform: `scale(${interpolate(f, [at, at + dur], [1, z1], clamp)})` }}>
          <OffthreadVideo src={staticFile(src)} muted startFrom={Math.round(ss * 30)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </AbsoluteFill>
      </AbsoluteFill>
    </Sequence>
  );
};
// janela de gameplay com moldura
const GameWin: React.FC<{ src: string; ss?: number; x?: number; y: number; w?: number; h: number; c?: string; tag?: string; gray?: number; style?: React.CSSProperties }> = ({ src, ss = 0, x = 40, y, w = 1000, h, c = CREAM, tag, gray = 0, style }) => (
  <div style={{ position: "absolute", left: x, top: y, width: w, height: h, overflow: "hidden", borderRadius: 26, border: `5px solid ${c}`, boxShadow: `0 30px 70px rgba(0,0,0,0.75), 0 0 40px ${c}44`, background: "#000", ...style }}>
    <OffthreadVideo src={src} muted startFrom={Math.round(ss * 30)} style={{ width: "100%", height: "100%", objectFit: "cover", filter: `grayscale(${gray})` }} />
    {tag ? <div style={{ position: "absolute", left: 20, top: 16, fontFamily: BODY, fontWeight: 900, fontSize: 24, letterSpacing: 5, color: "#fff", background: "rgba(0,0,0,0.6)", padding: "6px 14px", borderRadius: 8 }}>● {tag}</div> : null}
  </div>
);
const typed = (f: number, txt: string, a: number, cps = 1.2) => Array.from(txt).slice(0, Math.max(0, Math.floor((f - a) * cps))).join("");
const Caret: React.FC<{ f: number; c?: string }> = ({ f, c = SOUL }) => <span style={{ opacity: Math.floor(f / 4) % 2 ? 0 : 1, color: c }}>▌</span>;
const burst = (f: number, at: number, c: string, cx = 540, cy = 700, n = 24) =>
  f < at || f > at + 26 ? null : Array.from({ length: n }).map((_, i) => {
    const ang = (i / n) * Math.PI * 2 + random(`b${at}${i}`) * 0.4;
    const d = ease(f, at, 22) * (360 + random(`bd${at}${i}`) * 420);
    const s = 8 + random(`bs${at}${i}`) * 16;
    return <div key={i} style={{ position: "absolute", left: cx + Math.cos(ang) * d - s / 2, top: cy + Math.sin(ang) * d - s / 2, width: s, height: s, borderRadius: "50%", background: c, boxShadow: `0 0 ${s * 2}px ${c}`, opacity: 1 - ease(f, at + 6, 20) }} />;
  });
const LolLogo: React.FC<{ w: number; gray?: number; style?: React.CSSProperties }> = ({ w, gray = 0, style }) => (
  <Img src={mg("lol_logo.png")} style={{ width: w, filter: `grayscale(${gray}) brightness(${1 - gray * 0.35}) drop-shadow(0 0 30px ${GOLD}66)`, ...style }} />
);
const DlLogo: React.FC<{ w: number; style?: React.CSSProperties }> = ({ w, style }) => <Img src={mg("dl_logo.png")} style={{ width: w, filter: "drop-shadow(0 0 30px rgba(95,242,214,0.45))", ...style }} />;
const CHAMPS = ["Ahri", "Darius", "Garen", "Jinx", "LeeSin", "Lux", "Thresh", "Varus", "Yasuo", "Zed"];

// ========== 1) gancho: "jogar LoL em 2026 tá CHATO DEMAIS. Só louco, mano" ==========
export const CLHook: React.FC<{ life: number; yearAt?: number; chatoAt?: number; demaisAt?: number; loucoAt?: number }> = ({ life, yearAt = 60, chatoAt = 90, demaisAt = 110, loucoAt = 135 }) => {
  const f = useCurrentFrame();
  const sad = ease(f, chatoAt, 18);
  const z = 1 + (f / Math.max(life, 1)) * 0.05 + punchZ(f, [0, chatoAt, demaisAt, loucoAt], 0.07, 9);
  return (
    <Void side={f >= chatoAt ? "red" : "lol"} z={z}>
      {burst(f, 0, GOLD, 540, 640)}
      <Abs top={430} style={{ transform: `translateY(${sad * -60}px) rotate(${sad * -6}deg) scale(${interpolate(f, [0, 6], [2.6, 1], { ...clamp, easing: Easing.in(Easing.quad) }) - sad * 0.3})` }}>
        <LolLogo w={820} gray={sad} />
      </Abs>
      <Abs top={280}>
        <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 56, letterSpacing: 14, color: CREAM, opacity: f >= yearAt ? 1 : 0 }}>
          EM <span style={{ color: GOLD }}>{typed(f, "2026", yearAt, 0.5)}</span><Caret f={f} c={GOLD} />
        </div>
      </Abs>
      <At f={f} a={chatoAt}>
        <Abs top={820}><Slam f={f} at={chatoAt} size={300} c={RED} glow={`${RED}66`}>CHATO</Slam></Abs>
        <Abs top={1090}><Slam f={f} at={demaisAt} size={150}>DEMAIS</Slam></Abs>
        <F3 n="downcast_face_with_sweat" w={190} at={chatoAt + 6} f={f} style={{ position: "absolute", left: 800, top: 1060 }} />
      </At>
      <At f={f} a={loucoAt}>
        <F3 n="face_screaming_in_fear" w={190} at={loucoAt} f={f} style={{ position: "absolute", left: 90, top: 1060 }} />
      </At>
      <Flash f={f} ts={[0, chatoAt]} pk={0.35} />
    </Void>
  );
};

// ========== 2) +10 anos · toda vez que eu abro uma partida: PARTIDA ENCONTRADA → ACEITAR · maluco (Nazaré) ==========
export const CLAccept: React.FC<{ life: number; tenAt?: number; openAt?: number; madAt?: number }> = ({ life, tenAt = 40, openAt = 110, madAt = 170 }) => {
  const f = useCurrentFrame();
  const n = Math.min(10, Math.round(interpolate(f, [tenAt - 20, tenAt], [0, 10], clamp)));
  const click = openAt + 26;
  const pressed = f >= click && f < click + 4;
  const cx = interpolate(f, [openAt + 6, click], [900, 560], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const cy = interpolate(f, [openAt + 6, click], [1220, 985], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  return (
    <Void side="lol" z={1 + punchZ(f, [tenAt, click], 0.06, 9)}>
      {/* campeões orbitando o +10 */}
      {f < openAt
        ? CHAMPS.map((c, i) => {
            const a = (i / CHAMPS.length) * Math.PI * 2 + f / 40;
            const r = 360 * ease(f, i * 2, 14);
            return <Img key={c} src={mg(`lol/${c}.png`)} style={{ position: "absolute", left: 540 + Math.cos(a) * r - 60, top: 700 + Math.sin(a) * r * 0.9 - 60, width: 120, height: 120, borderRadius: "50%", border: `4px solid ${GOLD}`, objectFit: "cover", opacity: i < n || f < tenAt - 20 ? 1 : 1 }} />;
          })
        : null}
      <At f={f} a={0} b={openAt}>
        <Abs top={560}><div style={{ fontFamily: POSTER, fontSize: 280, color: CREAM, lineHeight: 1, textShadow: `0 0 50px ${GOLD}88` }}>+{n}</div></Abs>
        <Abs top={860}><Slam f={f} at={tenAt} size={110} c={GOLD}>ANOS DE LOL</Slam></Abs>
      </At>
      {/* a fila: PARTIDA ENCONTRADA → ACEITAR */}
      <At f={f} a={openAt}>
        <div style={{ position: "absolute", left: 90, top: 420, width: 900, height: 700, borderRadius: 30, overflow: "hidden", border: `4px solid ${GOLD}`, boxShadow: `0 0 60px ${GOLD}55`, background: "linear-gradient(180deg, #0a1428, #010a13)", ...pop(f, openAt, 300) }}>
          <div style={{ position: "absolute", inset: 0, opacity: 0.35 }}>
            <OffthreadVideo src={clip("lol_b")} muted startFrom={30 * 30} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "blur(6px)" }} />
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 90, textAlign: "center", whiteSpace: "nowrap", fontFamily: BODY, fontWeight: 900, fontSize: 56, letterSpacing: 4, color: "#f0e6d2" }}>PARTIDA ENCONTRADA!</div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 220, display: "flex", justifyContent: "center" }}>
            <div style={{ width: 170, height: 170, borderRadius: "50%", border: `6px solid ${GOLD}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: POSTER, fontSize: 80, color: "#f0e6d2",
              background: `conic-gradient(${GOLD} ${interpolate(f, [openAt, openAt + 80], [360, 0], clamp)}deg, #0a1428 0deg)` }}>
              <div style={{ width: 140, height: 140, borderRadius: "50%", background: "#0a1428", display: "flex", alignItems: "center", justifyContent: "center" }}>{Math.max(0, 12 - Math.floor((f - openAt) / 8))}</div>
            </div>
          </div>
          <div style={{ position: "absolute", left: 220, top: 500, width: 460, height: 110, borderRadius: 12, border: `4px solid ${GOLD}`, background: pressed ? "#c8aa6e" : "#1e2328", display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: BODY, fontWeight: 900, fontSize: 54, letterSpacing: 6, color: pressed ? "#0a1428" : "#cdbe91", transform: `scale(${pressed ? 0.95 : 1})` }}>{f >= click ? "ACEITO" : "ACEITAR"}</div>
        </div>
        {/* cursor */}
        <svg width={70} height={90} viewBox="0 0 70 90" style={{ position: "absolute", left: cx, top: cy, transform: `scale(${pressed ? 0.85 : 1})` }}>
          <path d="M5 5 L5 70 L22 55 L34 82 L46 76 L34 50 L58 50 Z" fill="#fff" stroke="#000" strokeWidth={4} />
        </svg>
      </At>
      <MemeCut f={f} at={madAt} dur={Math.min(48, life - madAt)} src={CL_MEME.nazare} ss={1.2} />
      <Flash f={f} ts={[openAt]} pk={0.3} c={GOLD} />
    </Void>
  );
};

// ========== 3) "já não basta o meu main ser o Shaco" ==========
export const CLShaco: React.FC<{ life: number; mainAt?: number; shacoAt?: number }> = ({ life, mainAt = 10, shacoAt = 40 }) => {
  const f = useCurrentFrame();
  const k = back(f, 0, 12, 1.5);
  return (
    <Void side="lol" z={1 + punchZ(f, [shacoAt], 0.07, 9)}>
      <div style={{ position: "absolute", left: 60, top: 300, width: 960, height: 760, borderRadius: 30, overflow: "hidden", border: `6px solid ${GOLD}`, boxShadow: `0 0 70px ${GOLD}55`, transform: `rotate(${(1 - k) * -10 - 2}deg) scale(${0.6 + 0.4 * k})` }}>
        <Img src={cl("shaco_splash.jpg")} style={{ position: "absolute", height: "100%", left: interpolate(f, [0, life], [-300, -420]), filter: `brightness(${0.85 + 0.25 * fl(f, shacoAt, shacoAt + 8, 1)})` }} />
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 260, background: "linear-gradient(0deg, rgba(0,0,0,0.85), rgba(0,0,0,0))" }} />
        <div style={{ position: "absolute", left: 36, top: 30, fontFamily: BODY, fontWeight: 900, fontSize: 44, letterSpacing: 8, color: "#f0e6d2", background: "rgba(10,20,40,0.75)", padding: "8px 20px", borderRadius: 10, opacity: f >= mainAt ? 1 : 0 }}>MEU MAIN:</div>
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 40 }}><Slam f={f} at={shacoAt} size={210} c={RED} glow={`${RED}66`}>SHACO</Slam></div>
      </div>
      <F3 n="face_with_hand_over_mouth" w={230} at={shacoAt + 8} f={f} style={{ position: "absolute", left: 80, top: 1000 }} />
      <div style={{ position: "absolute", left: 340, top: 1090, fontFamily: HAND, fontSize: 90, color: CREAM, transform: "rotate(-4deg)", opacity: ease(f, shacoAt + 14, 8) }}>o palhaço…</div>
      <Flash f={f} ts={[shacoAt]} pk={0.35} c={RED} />
    </Void>
  );
};

// ========== 4) aos 15 minutos não tem mais o que fazer → ACABOU (DEFEAT de verdade) ==========
export const CLClock: React.FC<{ life: number; minAt?: number; nadaAt?: number; overAt?: number }> = ({ life, minAt = 30, nadaAt = 70, overAt = 110 }) => {
  const f = useCurrentFrame();
  const sec = Math.round(interpolate(f, [0, minAt], [0, 900], { ...clamp, easing: Easing.in(Easing.quad) }));
  const mm = String(Math.floor(sec / 60)).padStart(2, "0");
  const ss = String(sec % 60).padStart(2, "0");
  const BTN = ["FARMAR", "LUTAR", "VIRAR", "DRAGÃO"];
  return (
    <Void side="lol" z={1 + punchZ(f, [minAt, overAt], 0.07, 9)}>
      <At f={f} a={0} b={overAt}>
        <Abs top={300}><F3 n="stopwatch" w={230} at={0} f={f} /></Abs>
        <Abs top={560}><div style={{ fontFamily: POSTER, fontSize: 260, color: f >= minAt ? RED : CREAM, letterSpacing: 6, textShadow: f >= minAt ? `0 0 50px ${RED}88` : "none", transform: `translate(${shake(f, minAt, 14, 9, "mm").x}px, 0)` }}>{mm}:{ss}</div></Abs>
        <div style={{ position: "absolute", left: 90, right: 90, top: 900, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          {BTN.map((b, i) => {
            const off = f >= nadaAt + i * 4;
            return (
              <div key={b} style={{ height: 120, borderRadius: 16, border: `4px solid ${off ? "#555" : GOLD}`, background: off ? "#15171a" : "#1e2328", color: off ? "#666" : "#cdbe91", display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: BODY, fontWeight: 900, fontSize: 48, letterSpacing: 4, textDecoration: off ? "line-through" : "none", ...pop(f, minAt + 6 + i * 3, 80) }}>{off ? "🔒 " : ""}{b}</div>
            );
          })}
        </div>
      </At>
      <At f={f} a={overAt}>
        <AbsoluteFill>
          <OffthreadVideo src={clip("lol_defeat")} muted startFrom={Math.round(10.6 * 30)} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${1.15 + 0.04 * (f - overAt) / 30})` }} />
          <AbsoluteFill style={{ background: "radial-gradient(ellipse 70% 50% at 50% 50%, rgba(0,0,0,0) 30%, rgba(0,0,0,0.75) 100%)" }} />
        </AbsoluteFill>
        <Abs top={1060}><Slam f={f} at={overAt + 2} size={200} c={RED} glow={`${RED}66`}>ACABOU!</Slam></Abs>
      </At>
      <Flash f={f} ts={[overAt]} pk={0.5} c={RED} />
    </Void>
  );
};

// ========== 5) difícil subir de elo (a escada que te devolve) · mecânica interessante? ==========
export const CLElo: React.FC<{ life: number; eloAt?: number; mecAt?: number }> = ({ life, eloAt = 30, mecAt = 110 }) => {
  const f = useCurrentFrame();
  // o PdL sobe devagar e cai de volta (+18 / −22)
  const cyc = Math.max(0, f - eloAt) % 34;
  const lp = f < eloAt ? 50 : cyc < 22 ? interpolate(cyc, [0, 22], [62, 80]) : interpolate(cyc, [22, 26], [80, 58], clamp);
  const lost = f >= eloAt && cyc >= 22;
  return (
    <Void side="lol" z={1 + punchZ(f, [eloAt, mecAt], 0.06, 9)}>
      <At f={f} a={0} b={mecAt}>
        <Abs top={260}><Slam f={f} at={2} size={130} c={GOLD}>SUBIR DE ELO?</Slam></Abs>
        <div style={{ position: "absolute", left: 140, top: 450, width: 800, ...pop(f, 6, 200) }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: BODY, fontWeight: 900, fontSize: 40, color: "#cdbe91", letterSpacing: 4 }}>
            <span>SEU ELO</span><span>{Math.round(lp)} PDL</span>
          </div>
          <div style={{ marginTop: 14, height: 54, borderRadius: 27, background: "#1e2328", border: `4px solid ${GOLD}`, overflow: "hidden" }}>
            <div style={{ width: `${lp}%`, height: "100%", background: lost ? RED : `linear-gradient(90deg, #785a28, ${GOLD})` }} />
          </div>
          <div style={{ marginTop: 18, textAlign: "center", fontFamily: POSTER, fontSize: 110, color: lost ? RED : GREEN, opacity: f >= eloAt ? 1 : 0 }}>{lost ? "−22" : "+18"}</div>
        </div>
        <Abs top={850}>
          <div style={{ position: "relative", width: 420, height: 380 }}>
            <Img src={fl3("ladder")} style={{ width: 300, position: "absolute", left: 60, top: 0 }} />
            <Img src={fl3("person_running")} style={{ width: 130, position: "absolute", left: 140, top: interpolate(cyc, [0, 22, 26, 34], [220, 40, 230, 220], clamp), transform: `rotate(${lost ? 160 : 0}deg)` }} />
          </div>
        </Abs>
      </At>
      <At f={f} a={mecAt}>
        <Abs top={330}><Slam f={f} at={mecAt} size={190} c={CREAM}>MECÂNICA</Slam></Abs>
        <Abs top={560}><Slam f={f} at={mecAt + 6} size={150} c={GOLD}>INTERESSANTE</Slam></Abs>
        <Abs top={800}><F3 n="thinking_face" w={300} at={mecAt + 10} f={f} /></Abs>
        <Img src={fl3("red_question_mark")} style={{ position: "absolute", left: 700, top: 800, width: 180, ...pop(f, mecAt + 16) }} />
      </At>
      <Flash f={f} ts={[mecAt]} pk={0.3} />
    </Void>
  );
};

// ========== 6) o jogo virou MECÂNICO: Q W E R em loop, sempre igual ==========
export const CLRobot: React.FC<{ life: number; mecAt?: number }> = ({ life, mecAt = 80 }) => {
  const f = useCurrentFrame();
  const KEYS = ["Q", "W", "E", "R"];
  const beat = 7;
  const cur = Math.floor(f / beat) % 4;
  const reps = Math.floor(interpolate(f, [0, life], [9600, 10000], clamp));
  return (
    <Void side="lol" z={1 + punchZ(f, [mecAt], 0.07, 9)}>
      <Abs top={280}><div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 44, letterSpacing: 10, color: "#cdbe91", opacity: ease(f, 2, 8) }}>PARTIDA Nº {reps.toLocaleString("pt-BR")}</div></Abs>
      <div style={{ position: "absolute", left: 80, right: 80, top: 430, display: "flex", justifyContent: "space-between" }}>
        {KEYS.map((k, i) => {
          const on = cur === i;
          return (
            <div key={k} style={{ width: 200, height: 200, borderRadius: 26, background: on ? GOLD : "#1e2328", border: `6px solid ${on ? "#f0e6d2" : GOLD}`, boxShadow: on ? `0 0 50px ${GOLD}` : "0 14px 0 #0a0d10",
              display: "flex", alignItems: "center", justifyContent: "center", fontFamily: POSTER, fontSize: 130, color: on ? "#0a1428" : "#cdbe91", transform: `translateY(${on ? 12 : 0}px)`, ...(f < 10 ? pop(f, i * 2, 120) : {}) }}>{k}</div>
          );
        })}
      </div>
      {/* metrônomo: o mesmo padrão marcado na linha do tempo */}
      <div style={{ position: "absolute", left: 80, right: 80, top: 720, height: 80, display: "flex", gap: 8, alignItems: "flex-end" }}>
        {Array.from({ length: 24 }).map((_, i) => (
          <div key={i} style={{ flex: 1, height: 30 + (i % 4) * 14, background: (Math.floor(f / beat) - i) % 4 === 0 ? GOLD : "#3a3020", borderRadius: 4 }} />
        ))}
      </div>
      <At f={f} a={mecAt}>
        <Abs top={880}><Slam f={f} at={mecAt} size={230} c={CREAM} glow={`${GOLD}66`}>MECÂNICO</Slam></Abs>
        <Abs top={1140}><div style={{ fontFamily: HAND, fontSize: 80, color: GOLD, opacity: ease(f, mecAt + 10, 8) }}>sempre a mesma coisa</div></Abs>
      </At>
      <Flash f={f} ts={[mecAt]} pk={0.3} c={GOLD} />
    </Void>
  );
};

// ========== 7) desde 2014 · os anos virando · "já não aguento mais" (esqueleto esperando) ==========
export const CLYears: React.FC<{ life: number; tenAt?: number; y2015At?: number; y2014At?: number; tiredAt?: number }> = ({ life, tenAt = 40, y2015At = 140, y2014At = 165, tiredAt = 230 }) => {
  const f = useCurrentFrame();
  const yr = f < y2015At ? Math.round(interpolate(f, [0, tenAt + 30], [2026, 2016], { ...clamp, easing: Easing.out(Easing.cubic) })) : f < y2014At ? 2015 : 2014;
  return (
    <Void side="lol" z={1 + punchZ(f, [tenAt, y2015At, y2014At], 0.06, 9)}>
      <Abs top={300}><F3 n="spiral_calendar" w={260} at={0} f={f} /></Abs>
      <Abs top={570}><div style={{ fontFamily: POSTER, fontSize: 300, color: f >= y2015At ? GOLD : CREAM, letterSpacing: 8, transform: `translateY(${-(f % 4)}px)`, textShadow: `0 0 50px ${GOLD}66` }}>{yr}</div></Abs>
      {/* trilho 2014 → 2026 com o tempo gasto */}
      <div style={{ position: "absolute", left: 100, right: 100, top: 950, height: 14, borderRadius: 7, background: "#2a2418" }}>
        <div style={{ width: `${interpolate(yr, [2014, 2026], [100, 0])}%`, marginLeft: `${interpolate(yr, [2014, 2026], [0, 100])}%`, height: "100%", borderRadius: 7, background: GOLD, boxShadow: `0 0 20px ${GOLD}` }} />
      </div>
      <div style={{ position: "absolute", left: 100, right: 100, top: 980, display: "flex", justifyContent: "space-between", fontFamily: BODY, fontWeight: 900, fontSize: 34, color: "#cdbe91" }}><span>2014</span><span>2026</span></div>
      <At f={f} a={tenAt}><Abs top={1080}><Slam f={f} at={tenAt} size={120} c={CREAM}>+10 ANOS</Slam></Abs></At>
      <MemeCut f={f} at={tiredAt} dur={Math.min(70, life - tiredAt)} src={CL_MEME.esqueleto} ss={0.5} />
    </Void>
  );
};

// ========== 8) apego · vício · dano → o buraco ==========
export const CLChain: React.FC<{ life: number; apegoAt?: number; vicioAt?: number; danoAt?: number; holeAt?: number }> = ({ life, apegoAt = 20, vicioAt = 60, danoAt = 90, holeAt = 130 }) => {
  const f = useCurrentFrame();
  const sink = ease(f, holeAt + 8, 30);
  const hole = ease(f, holeAt, 14);
  const W3 = [
    { t: "APEGO", at: apegoAt, y: 560 },
    { t: "VÍCIO", at: vicioAt, y: 720 },
    { t: "DANO", at: danoAt, y: 880 },
  ];
  return (
    <Void side={f >= danoAt ? "red" : "lol"} z={1 + punchZ(f, [apegoAt, vicioAt, danoAt, holeAt], 0.06, 9)}>
      <div style={{ position: "absolute", inset: 0, transform: `translateY(${sink * 380}px) scale(${1 - sink * 0.6})`, transformOrigin: "50% 60%", opacity: Math.max(0, 1 - sink * 1.8) }}>
        <Abs top={250}><LolLogo w={560} /></Abs>
        {/* corrente descendo do LoL até você */}
        <div style={{ position: "absolute", left: 528, top: 470, width: 24, height: 560, backgroundImage: `repeating-linear-gradient(180deg, #9a9a9a 0 30px, #4a4a4a 30px 40px)`, borderRadius: 12, boxShadow: "0 0 20px #000" }} />
        {W3.map((w, i) => (
          <div key={w.t} style={{ position: "absolute", left: i % 2 ? 580 : 90, width: 420, top: w.y, display: "flex", alignItems: "center", justifyContent: i % 2 ? "flex-start" : "flex-end", gap: 16, ...pop(f, w.at, 0) }}>
            {i % 2 ? <Img src={fl3("chains")} style={{ width: 110 }} /> : null}
            <div style={{ fontFamily: POSTER, fontSize: 110, color: i === 2 ? RED : CREAM, textShadow: "0 8px 30px #000" }}>{w.t}</div>
            {i % 2 ? null : <Img src={fl3("chains")} style={{ width: 110 }} />}
          </div>
        ))}
        <Abs top={1040}><Img src={fl3("bust_in_silhouette")} style={{ width: 200, filter: f >= danoAt ? "grayscale(1)" : "none" }} /></Abs>
      </div>
      {/* o buraco */}
      <div style={{ position: "absolute", left: 540 - 420 * hole, top: 1110 - 90 * hole, width: 840 * hole, height: 180 * hole, borderRadius: "50%", background: "radial-gradient(ellipse at 50% 40%, #000 55%, #1a0705 80%, rgba(0,0,0,0) 100%)", boxShadow: `0 0 60px ${RED}55` }} />
      <At f={f} a={holeAt}><Abs top={330}><Slam f={f} at={holeAt + 4} size={170} c={RED} glow={`${RED}55`}>O BURACO</Slam></Abs></At>
      <Flash f={f} ts={[danoAt]} pk={0.3} c={RED} />
    </Void>
  );
};

// ========== 9) procurei um jogo que, mesmo perdendo (time feedando), eu me divertisse e aprendesse ==========
export const CLSearch: React.FC<{ life: number; loseAt?: number; feedAt?: number; funAt?: number; learnAt?: number }> = ({ life, loseAt = 60, feedAt = 120, funAt = 180, learnAt = 240 }) => {
  const f = useCurrentFrame();
  const LOGOS = ["dota_logo.png", "ow_logo.png", "mr_logo.png", "cs_logo.png", "tf2_logo.png"];
  const each = Math.max(12, Math.floor(loseAt / LOGOS.length));
  const i = Math.min(LOGOS.length - 1, Math.floor(f / each));
  const mx = interpolate(f % each, [0, each], [-30, 30]);
  const check = (at: number, t: string, n: string, y: number) => (
    <div style={{ position: "absolute", left: 90, right: 90, top: y, height: 150, borderRadius: 22, background: "#0d1a18", border: `4px solid ${f >= at ? GREEN : `${CREAM}33`}`, display: "flex", alignItems: "center", gap: 26, padding: "0 30px", ...pop(f, at - 6, 120) }}>
      <Img src={fl3(n)} style={{ width: 100 }} />
      <div style={{ flex: 1, fontFamily: POSTER, fontSize: 70, color: CREAM }}>{t}</div>
      {f >= at ? <div style={{ width: 90, height: 90, borderRadius: "50%", background: GREEN, color: INK, fontSize: 64, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${back(f, at, 8, 2.4)})` }}>✓</div> : null}
    </div>
  );
  return (
    <Void side="dl" z={1 + punchZ(f, [loseAt, funAt, learnAt], 0.05, 9)}>
      <At f={f} a={0} b={loseAt}>
        <Abs top={260}><div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 50, letterSpacing: 12, color: CREAM }}>PROCURANDO UM JOGO…</div></Abs>
        <Abs top={520}><Img src={mg(LOGOS[i])} style={{ width: 640, maxHeight: 360, objectFit: "contain", opacity: 0.9, filter: (f % each) > each * 0.6 ? "grayscale(1) brightness(0.5)" : "none" }} /></Abs>
        {(f % each) > each * 0.6 ? <Cross f={f} at={i * each + Math.floor(each * 0.6)} w={420} h={420} style={{ left: 330, top: 480 }} /> : null}
        <Img src={fl3("magnifying_glass_tilted_left")} style={{ position: "absolute", left: 600 + mx, top: 760, width: 260, transform: "rotate(-10deg)" }} />
      </At>
      <At f={f} a={loseAt}>
        <Abs top={240}><Slam f={f} at={loseAt} size={110} c={CREAM}>MESMO PERDENDO</Slam></Abs>
        <div style={{ position: "absolute", left: 0, right: 0, top: 380, display: "flex", justifyContent: "center", gap: 18 }}>
          {["0/7", "1/9", "0/11"].map((k, j) => (
            <div key={k} style={{ fontFamily: POSTER, fontSize: 64, color: RED, background: "#2a0f0c", border: `3px solid ${RED}`, borderRadius: 12, padding: "4px 18px", ...pop(f, feedAt + j * 5, 60) }}>{k}</div>
          ))}
        </div>
        {f >= feedAt ? <div style={{ position: "absolute", left: 0, right: 0, top: 480, textAlign: "center", fontFamily: HAND, fontSize: 64, color: RED, opacity: ease(f, feedAt + 14, 8) }}>o meu time feedando</div> : null}
        {check(funAt, "ME DIVERTIR", "party_popper", 640)}
        {check(learnAt, "APRENDER ALGO", "brain", 830)}
      </At>
      <Flash f={f} ts={[loseAt]} pk={0.25} />
    </Void>
  );
};

// ========== 10) perder 5 seguidas no Deadlock × perder 1 ou 2 no LoL ==========
export const CLLosses: React.FC<{ life: number; dlAt?: number; chillAt?: number; lolAt?: number }> = ({ life, dlAt = 10, chillAt = 9999, lolAt = 120 }) => {
  const f = useCurrentFrame();
  const row = (y: number, logo: React.ReactNode, n: number, at: number, face: string, c: string, rage: boolean) => (
    <div style={{ position: "absolute", left: 60, right: 60, top: y, ...pop(f, at - 8, 200) }}>
      <div style={{ height: 120, display: "flex", alignItems: "center" }}>{logo}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 20 }}>
        {Array.from({ length: n }).map((_, i) => (
          <div key={i} style={{ width: 130, height: 130, borderRadius: 16, background: "#3a0f0c", border: `6px solid ${RED}`, color: RED, fontFamily: POSTER, fontSize: 86, display: "flex", alignItems: "center", justifyContent: "center", ...pop(f, at + i * 8, 80) }}>D</div>
        ))}
        <div style={{ marginLeft: "auto", transform: rage ? `translate(${shake(f, at + n * 8 + 4, 18, 30, "rg").x}px, ${shake(f, at + n * 8 + 4, 18, 30, "rg").y}px)` : `rotate(${Math.sin(f / 9) * 6}deg)` }}>
          <F3 n={face} w={190} at={at + n * 8 + 4} f={f} />
        </div>
      </div>
      <div style={{ marginTop: 18, fontFamily: BODY, fontWeight: 900, fontSize: 44, letterSpacing: 5, color: c, opacity: ease(f, at + n * 8 + 10, 8) }}>{rage ? "VONTADE DE DESINSTALAR" : "TRANQUILO, BORA MAIS UMA"}</div>
    </div>
  );
  return (
    <Void side={f >= lolAt ? "red" : "dl"} z={1 + punchZ(f, [dlAt + 40, lolAt + 20], 0.05, 9)}>
      {row(300, <DlLogo w={520} />, 5, dlAt, "smiling_face_with_sunglasses", GREEN, false)}
      {f >= lolAt - 8 ? row(780, <LolLogo w={340} />, 2, lolAt, "collision", RED, true) : null}
      <MemeCut f={f} at={chillAt} dur={Math.max(1, Math.min(40, lolAt - 10 - chillAt))} src={CL_MEME.chill} ss={1} />
      <Flash f={f} ts={[lolAt + 20]} pk={0.3} c={RED} />
    </Void>
  );
};

// ========== 11) a comunidade: chat do LoL × chat do Deadlock (com uma exceção) ==========
export const CLChat: React.FC<{ life: number; dlAt?: number; excAt?: number; realAt?: number }> = ({ life, dlAt = 60, excAt = 140, realAt = 230 }) => {
  const f = useCurrentFrame();
  const LOL = [["Yasuo", "ff 15"], ["Teemo", "jg diff"], ["Lux", "report mid"], ["Zed", "uninstall"], ["Darius", "noob time"]];
  const DL = [["rato_da_lane", "gg wp"], ["haze_br", "boa rapaziada"], ["vindicta", "bora mais uma"], ["mo_krill", "vlw pelo heal"]];
  const box = (x: number, title: React.ReactNode, msgs: string[][], at: number, c: string, bad: boolean) => (
    <div style={{ position: "absolute", left: x, top: 380, width: 470, height: 760, borderRadius: 24, background: "rgba(5,10,12,0.9)", border: `4px solid ${c}`, boxShadow: `0 0 40px ${c}44`, padding: 22, overflow: "hidden", ...pop(f, at, 200) }}>
      <div style={{ height: 90, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>{title}</div>
      {msgs.map(([u, m], i) => (
        <div key={u} style={{ fontFamily: BODY, fontWeight: 800, fontSize: 34, color: "#ddd", marginBottom: 16, ...pop(f, at + 10 + i * 9, 40) }}>
          <span style={{ color: bad ? RED : SOUL }}>{u}:</span> {m}
        </div>
      ))}
    </div>
  );
  return (
    <Void side="dl" z={1 + punchZ(f, [dlAt, excAt], 0.05, 9)}>
      <Abs top={230}><Slam f={f} at={2} size={110} c={CREAM}>A COMUNIDADE</Slam></Abs>
      {box(40, <LolLogo w={260} gray={0.2} />, LOL, 4, RED, true)}
      {f >= dlAt ? box(570, <DlLogo w={330} />, DL, dlAt, SOUL, false) : null}
      {f >= excAt ? (
        <div style={{ position: "absolute", left: 592, top: 920, width: 426, fontFamily: BODY, fontWeight: 800, fontSize: 32, color: "#ddd", background: "#2a1a0a", border: `3px solid ${YEL}`, borderRadius: 12, padding: "10px 14px", ...pop(f, excAt, 40) }}>
          <Img src={fl3("warning")} style={{ width: 44, verticalAlign: "middle", marginRight: 8 }} />
          <span style={{ color: YEL }}>exceção:</span> ff
        </div>
      ) : null}
      {f >= realAt ? <Abs top={1180}><Slam f={f} at={realAt} size={96} c={GREEN} glow={`${GREEN}55`}>TOTALMENTE DIFERENTE</Slam></Abs> : null}
    </Void>
  );
};

// ========== 12) que as pessoas enxerguem o potencial e MIGREM pro Deadlock ==========
export const CLMigrate: React.FC<{ life: number; potAt?: number; migAt?: number }> = ({ life, potAt = 60, migAt = 150 }) => {
  const f = useCurrentFrame();
  const pot = ease(f, potAt, 40);
  return (
    <Void side="dl" z={1 + punchZ(f, [potAt, migAt], 0.05, 9)}>
      <div style={{ position: "absolute", left: 60, top: 420, width: 330, display: "flex", flexDirection: "column", alignItems: "center", gap: 20, ...pop(f, 2, 100) }}>
        <LolLogo w={300} gray={ease(f, migAt, 60) * 0.8} />
      </div>
      <div style={{ position: "absolute", left: 640, top: 360, width: 380, display: "flex", flexDirection: "column", alignItems: "center", gap: 20, ...pop(f, 6, 100) }}>
        <DlLogo w={380} style={{ transform: `scale(${1 + pot * 0.12})` }} />
      </div>
      {/* medidor de potencial */}
      <div style={{ position: "absolute", left: 660, top: 560, width: 340, opacity: ease(f, potAt, 8) }}>
        <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 30, letterSpacing: 6, color: SOUL, textAlign: "center" }}>POTENCIAL</div>
        <div style={{ marginTop: 10, height: 40, borderRadius: 20, background: "#0b2018", border: `3px solid ${SOUL}`, overflow: "hidden" }}>
          <div style={{ width: `${pot * 100}%`, height: "100%", background: `linear-gradient(90deg, #1f8f7a, ${SOUL})`, boxShadow: `0 0 20px ${SOUL}` }} />
        </div>
      </div>
      {/* gente atravessando a ponte de LoL pra Deadlock */}
      {f >= migAt
        ? Array.from({ length: 14 }).map((_, i) => {
            const t = ((f - migAt) / 45 + i / 14) % 1;
            const x = interpolate(t, [0, 1], [230, 830]);
            const y = 900 - Math.sin(t * Math.PI) * 220;
            return <Img key={i} src={fl3(i % 3 === 0 ? "person_running" : i % 3 === 1 ? "woman_running" : "person_running")} style={{ position: "absolute", left: x - 45, top: y - 45, width: 90, opacity: Math.min(1, (f - migAt) / 6) }} />;
          })
        : null}
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: ease(f, migAt - 6, 8) }}>
        <path d="M230 960 Q 530 520 830 960" fill="none" stroke={`${SOUL}66`} strokeWidth={8} strokeDasharray="20 18" strokeDashoffset={-f * 3} />
      </svg>
      {f >= migAt ? <Abs top={1080}><Slam f={f} at={migAt} size={170} c={SOUL} glow={SOUL}>MIGRA!</Slam></Abs> : null}
      <Flash f={f} ts={[migAt]} pk={0.3} c={SOUL} />
    </Void>
  );
};

// ========== 13) um Major / um CBLOL de Deadlock: qual seria o nome? (comenta) ==========
export const CLMajor: React.FC<{ life: number; majorAt?: number; cblolAt?: number; nameAt?: number; commentAt?: number }> = ({ life, majorAt = 40, cblolAt = 100, nameAt = 150, commentAt = 210 }) => {
  const f = useCurrentFrame();
  const NAMES = ["CBDL", "DEADLOCK BR", "CB DO RATO", "???"];
  const ni = Math.min(NAMES.length - 1, Math.floor(Math.max(0, f - nameAt) / 16));
  return (
    <Void side="dl" z={1 + punchZ(f, [majorAt, cblolAt, nameAt], 0.05, 9)}>
      {/* holofotes */}
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ position: "absolute", left: 140 + i * 300, top: 0, width: 200, height: 900, background: `linear-gradient(180deg, ${SOUL}30, rgba(0,0,0,0))`, clipPath: "polygon(40% 0, 60% 0, 100% 100%, 0 100%)", transform: `rotate(${Math.sin(f / 20 + i) * 8}deg)`, transformOrigin: "50% 0" }} />
      ))}
      <Abs top={280}><F3 n="trophy" w={330} at={0} f={f} /></Abs>
      <At f={f} a={majorAt} b={cblolAt}><Abs top={660}><Slam f={f} at={majorAt} size={230} c={YEL} glow={`${YEL}55`}>MAJOR</Slam></Abs><Abs top={900}><Slam f={f} at={majorAt + 4} size={90} c={SOUL}>DE DEADLOCK</Slam></Abs></At>
      <At f={f} a={cblolAt}>
        <Abs top={660}>
          <div style={{ position: "relative" }}>
            <Slam f={f} at={cblolAt} size={170} c={CREAM}>CBLOL</Slam>
            <Stroke f={f} at={nameAt - 8} d="M20 50 L980 50" w={30} vb="0 0 1000 100" style={{ left: "-6%", top: 60, width: "112%", height: 60 }} />
          </div>
        </Abs>
        <Abs top={860}><div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 46, letterSpacing: 8, color: SOUL, opacity: ease(f, cblolAt + 8, 8) }}>DE DEADLOCK</div></Abs>
      </At>
      <At f={f} a={nameAt}>
        <Abs top={950}><div style={{ fontFamily: POSTER, fontSize: 120, color: YEL, textShadow: `0 0 30px ${YEL}66` }}>{NAMES[ni]}<Caret f={f} c={YEL} /></div></Abs>
      </At>
      <At f={f} a={commentAt}>
        <div style={{ position: "absolute", left: 80, top: 1120, width: 820, height: 120, borderRadius: 60, background: "#f2f2f2", display: "flex", alignItems: "center", gap: 18, padding: "0 30px", ...pop(f, commentAt, 80) }}>
          <Img src={fl3("speech_balloon")} style={{ width: 70 }} />
          <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 40, color: "#333" }}>{typed(f, "o nome seria…", commentAt + 4, 0.9)}<Caret f={f} c="#333" /></div>
        </div>
      </At>
      <Flash f={f} ts={[majorAt, cblolAt]} pk={0.3} c={YEL} />
    </Void>
  );
};

// ========== 14) a comunidade só aumenta · engajamento: post de Deadlock × post de LoL ==========
export const CLEngage: React.FC<{ life: number; growAt?: number; postAt?: number; lolAt?: number; zeroAt?: number }> = ({ life, growAt = 10, postAt = 110, lolAt = 230, zeroAt = 300 }) => {
  const f = useCurrentFrame();
  const n = Math.floor(interpolate(f, [0, postAt - 10], [6, 60], { ...clamp, easing: Easing.out(Easing.quad) }));
  const likes = Math.round(interpolate(f, [postAt, postAt + 80], [0, 12400], { ...clamp, easing: Easing.out(Easing.cubic) }));
  const post = (x: number, at: number, logo: React.ReactNode, num: string, c: string, dead: boolean) => (
    <div style={{ position: "absolute", left: x, top: 380, width: 460, height: 740, borderRadius: 26, background: "#0d0f12", border: `4px solid ${c}`, overflow: "hidden", ...pop(f, at, 200), filter: dead ? "grayscale(0.7)" : "none" }}>
      <div style={{ height: 520, display: "flex", alignItems: "center", justifyContent: "center", background: dead ? "#15171a" : "radial-gradient(circle at 50% 40%, #0f3a34, #06090a)" }}>{logo}</div>
      <div style={{ padding: 24, display: "flex", alignItems: "center", gap: 16 }}>
        <Img src={fl3(dead ? "broken_heart" : "red_heart")} style={{ width: 80 }} />
        <div style={{ fontFamily: POSTER, fontSize: 80, color: dead ? "#777" : CREAM }}>{num}</div>
      </div>
    </div>
  );
  return (
    <Void side="dl" z={1 + punchZ(f, [growAt, postAt, lolAt], 0.05, 9)}>
      <At f={f} a={0} b={postAt}>
        <Abs top={250}><DlLogo w={460} style={pop(f, 2, -120)} /></Abs>
        <Abs top={1110}><Slam f={f} at={growAt} size={130} c={SOUL} glow={SOUL}>SÓ AUMENTA ▲</Slam></Abs>
        <div style={{ position: "absolute", left: 90, right: 90, top: 470, display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
          {Array.from({ length: n }).map((_, i) => (
            <Img key={i} src={fl3(i % 5 === 0 ? "woman" : "bust_in_silhouette")} style={{ width: 82, ...pop(f, Math.sqrt(i) * 10, 0) }} />
          ))}
        </div>
      </At>
      <At f={f} a={postAt}>
        {post(40, postAt, <DlLogo w={380} />, likes > 0 ? "MUITO" : "", SOUL, false)}
        {f >= lolAt ? post(580, lolAt, <LolLogo w={300} gray={0.6} />, "POUCO", "#555", true) : null}
        {f < lolAt
          ? Array.from({ length: 8 }).map((_, i) => {
              const t = ((f - postAt) / 40 + i / 8) % 1;
              return <Img key={i} src={fl3("red_heart")} style={{ position: "absolute", left: 120 + (i * 53) % 300, top: 1050 - t * 600, width: 70, opacity: 1 - t }} />;
            })
          : null}
      </At>
      <At f={f} a={zeroAt}>
        <Abs top={1150}><div style={{ display: "flex", alignItems: "center", gap: 20 }}><F3 n="person_shrugging" w={150} at={zeroAt} f={f} /><Slam f={f} at={zeroAt + 2} size={80} c={CREAM}>NÃO QUER DIZER NADA</Slam></div></Abs>
      </At>
      <Flash f={f} ts={[postAt]} pk={0.25} c={SOUL} />
    </Void>
  );
};

// ========== 15) quer jogar? comenta → DM → link do Discord → convite pro jogo ==========
export const CLInvite: React.FC<{ life: number; commentAt?: number; dmAt?: number; discordAt?: number; inviteAt?: number }> = ({ life, commentAt = 40, dmAt = 100, discordAt = 170, inviteAt = 330 }) => {
  const f = useCurrentFrame();
  const msg = "eu quero jogar!";
  const sent = commentAt + msg.length * 1.3 + 6;
  const acc = inviteAt + 40;
  return (
    <Void side="dl" z={1 + punchZ(f, [dmAt, discordAt, inviteAt], 0.05, 9)}>
      <Abs top={230}><Slam f={f} at={2} size={110} c={CREAM}>QUER JOGAR?</Slam></Abs>
      {/* 1. comentário */}
      <div style={{ position: "absolute", left: 70, top: 400, width: 760, borderRadius: 22, background: "#f2f2f2", padding: "22px 26px", ...pop(f, 6, 120), opacity: f >= discordAt ? 0.35 : 1 }}>
        <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 26, color: "#777" }}>Comentários</div>
        <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 44, color: "#111", marginTop: 8 }}>{typed(f, msg, commentAt, 1 / 1.3)}{f < sent ? <Caret f={f} c="#111" /> : <span style={{ color: "#fe2c55" }}> ✓</span>}</div>
      </div>
      {/* 2. DM */}
      {f >= dmAt ? (
        <div style={{ position: "absolute", left: 250, top: 600, width: 650, borderRadius: "30px 30px 6px 30px", background: "linear-gradient(135deg, #7b2ff7, #f107a3)", padding: "22px 28px", ...pop(f, dmAt, 80), opacity: f >= discordAt ? 0.35 : 1 }}>
          <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 26, color: "#ffffffbb" }}>MENSAGEM PRIVADA</div>
          <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 42, color: "#fff" }}>fala, me manda o link!</div>
        </div>
      ) : null}
      {/* 3. Discord */}
      {f >= discordAt ? (
        <div style={{ position: "absolute", left: 70, top: 790, width: 860, borderRadius: 22, background: "#313338", padding: 26, boxShadow: "0 30px 60px rgba(0,0,0,0.6)", ...pop(f, discordAt, 120) }}>
          <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 26, color: "#b5bac1", letterSpacing: 2 }}>CONVITE PARA ENTRAR EM UM SERVIDOR</div>
          <div style={{ display: "flex", alignItems: "center", gap: 22, marginTop: 16 }}>
            <div style={{ width: 110, height: 110, borderRadius: 28, background: "#5865f2", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: POSTER, fontSize: 60, color: "#fff" }}>🐀</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 42, color: "#f2f3f5" }}>Ratazanas do Deadlock</div>
              <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 28, color: "#23a55a" }}>● comunidade do Blies</div>
            </div>
            <div style={{ borderRadius: 10, background: f >= discordAt + 40 ? "#23a55a" : "#248046", padding: "16px 26px", fontFamily: BODY, fontWeight: 900, fontSize: 32, color: "#fff" }}>{f >= discordAt + 40 ? "Entrou" : "Entrar"}</div>
          </div>
        </div>
      ) : null}
      {/* 4. convite pro jogo (Steam) */}
      {f >= inviteAt ? (
        <div style={{ position: "absolute", left: 70, top: 1060, width: 860, borderRadius: 18, background: "linear-gradient(90deg, #1b2838, #2a475e)", padding: 22, display: "flex", alignItems: "center", gap: 20, border: `3px solid ${SOUL}`, ...pop(f, inviteAt, 120) }}>
          <Img src={mg("steam_icon.png")} style={{ width: 90 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 26, color: "#66c0f4", letterSpacing: 2 }}>CONVITE RECEBIDO</div>
            <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 40, color: "#fff" }}>Acesso ao Deadlock</div>
          </div>
          <div style={{ width: 90, height: 90, borderRadius: "50%", background: f >= acc ? GREEN : "#3d4450", color: INK, fontSize: 60, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${f >= acc ? back(f, acc, 8, 2.4) : 1})` }}>{f >= acc ? "✓" : ""}</div>
        </div>
      ) : null}
      <Flash f={f} ts={[inviteAt]} pk={0.25} c={SOUL} />
    </Void>
  );
};

// ========== 16) eu me chamo Blies: live todo dia, foto piscando, Half-Life, jogos e música, segue ==========
export const CLMe: React.FC<{ life: number; nameAt?: number; liveAt?: number; blinkAt?: number; hlAt?: number; gamesAt?: number; musicAt?: number; followAt?: number; byeAt?: number }> = ({
  life, nameAt = 10, liveAt = 40, blinkAt = 90, hlAt = 280, gamesAt = 310, musicAt = 330, followAt = 360, byeAt = 450,
}) => {
  const f = useCurrentFrame();
  const ring = f >= blinkAt && f < hlAt ? 0.5 + 0.5 * Math.sin((f - blinkAt) / 3) : 0;
  const tap = f >= followAt + 10 && f < followAt + 15;
  const TOP = [
    { at: hlAt, el: <Img src={mg("lambda.png")} style={{ width: 120 }} />, t: "HALF-LIFE" },
    { at: gamesAt, el: <DlLogo w={170} />, t: "JOGOS" },
    { at: musicAt, el: <Img src={fl3("speaker_high_volume")} style={{ width: 120 }} />, t: "MÚSICA" },
  ];
  return (
    <Void side="dl" z={1 + punchZ(f, [nameAt, blinkAt, followAt, byeAt], 0.05, 9)}>
      {/* foto com o anel de live */}
      <Abs top={250}>
        <div style={{ position: "relative", width: 420, height: 420, ...pop(f, 0, 200) }}>
          <div style={{ position: "absolute", inset: -22, borderRadius: "50%", background: `conic-gradient(#fe2c55, #ff6a00, #fe2c55, #25f4ee, #fe2c55)`, opacity: f >= blinkAt && f < hlAt ? 0.4 + 0.6 * ring : 0.25, transform: `scale(${1 + ring * 0.05})`, boxShadow: `0 0 ${60 * ring}px #fe2c55` }} />
          <Img src={blies} style={{ position: "absolute", inset: 0, width: 420, height: 420, borderRadius: "50%", objectFit: "cover", border: `8px solid ${INK}` }} />
          {f >= liveAt ? <div style={{ position: "absolute", left: 120, bottom: -26, width: 180, textAlign: "center", borderRadius: 10, background: "#fe2c55", fontFamily: BODY, fontWeight: 900, fontSize: 36, color: "#fff", letterSpacing: 4, ...pop(f, liveAt, 40) }}>LIVE</div> : null}
        </div>
      </Abs>
      <Abs top={740}><Slam f={f} at={nameAt} size={170} c={CREAM}>BLIES</Slam></Abs>
      <At f={f} a={liveAt} b={hlAt}>
        <Abs top={950}><div style={{ display: "flex", alignItems: "center", gap: 18, ...pop(f, liveAt + 4, 60) }}><DlLogo w={260} /><div style={{ fontFamily: POSTER, fontSize: 80, color: SOUL }}>TODO DIA</div></div></Abs>
        {f >= blinkAt ? <Abs top={1110}><div style={{ fontFamily: HAND, fontSize: 76, color: "#fe2c55", opacity: ease(f, blinkAt, 8) }}>foto piscando? entra na live!</div></Abs> : null}
      </At>
      <At f={f} a={hlAt} b={followAt}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 960, display: "flex", justifyContent: "center", gap: 40 }}>
          {TOP.map((x) => (
            <div key={x.t} style={{ width: 260, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, ...pop(f, x.at, 100) }}>
              <div style={{ height: 140, display: "flex", alignItems: "center" }}>{x.el}</div>
              <div style={{ fontFamily: POSTER, fontSize: 56, color: CREAM }}>{x.t}</div>
            </div>
          ))}
        </div>
      </At>
      <At f={f} a={followAt}>
        <Abs top={980}>
          <div style={{ width: 520, height: 130, borderRadius: 18, background: f >= followAt + 12 ? "#2f2f35" : "#fe2c55", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: BODY, fontWeight: 900, fontSize: 56, color: "#fff",
            transform: `scale(${tap ? 0.93 : 1})`, ...pop(f, followAt, 80) }}>{f >= followAt + 12 ? "SEGUINDO ✓" : "SEGUIR"}</div>
        </Abs>
        {f >= byeAt ? <Abs top={1150}><Slam f={f} at={byeAt} size={110} c={SOUL} glow={SOUL}>TAMO JUNTO</Slam></Abs> : null}
      </At>
      <Flash f={f} ts={[nameAt, followAt + 12]} pk={0.25} />
    </Void>
  );
};
