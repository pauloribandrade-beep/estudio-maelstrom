import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, Loop, OffthreadVideo, staticFile, useCurrentFrame } from "remotion";
import { loadFont as loadTitle } from "@remotion/google-fonts/AlegreyaSans";
import { loadFont as loadBody } from "@remotion/google-fonts/NunitoSans";
import { loadFont as loadHand } from "@remotion/google-fonts/PermanentMarker";
import ML from "./memes.json";

// "Subi de rank sem fazer nada" (06/11): a linguagem vem da tela do print dele (Ranked Hub da Beta Season 2): preto com
// triângulo e círculo finos em verde-água, emblema grande no centro. Marcador vermelho escrito à mão é a voz dos improvisos.
// Zona segura do TikTok: tudo entre y 190 e 1290 e sem nada importante à direita de 930 entre y 700 e 1290. Legenda em 1370.

const { fontFamily: TITLE } = loadTitle("normal", { weights: ["700", "800", "900"], subsets: ["latin", "latin-ext"] });
const { fontFamily: BODY } = loadBody("normal", { weights: ["600", "700", "800", "900"], subsets: ["latin", "latin-ext"] });
const { fontFamily: HAND } = loadHand("normal", { weights: ["400"], subsets: ["latin"] });

const R = "videos/2026-11-06_deadlock-ranked_R/";
const FPS = 30;
const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
const ease = (f: number, a: number, n = 10) => interpolate(f, [a, a + n], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
const back = (f: number, a: number, n = 10, s = 1.9) => interpolate(f - a, [0, n], [0, 1], { ...clamp, easing: Easing.out(Easing.back(s)) });
const fall = (f: number, a: number, n = 14) => interpolate(f, [a, a + n], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });

const INK = "#e9e2d0";
const TEAL = "#a9cfcc";
const DIM = "#6f8583";
const GOLD = "#e0a24a";
const RED = "#ff3b30";
const GREEN = "#6fe08c";
const PANEL = "linear-gradient(180deg, #17201f 0%, #101615 100%)";
const EDGE = "#2c3b39";

const badge = (n: string) => staticFile(`${R}dl/Rank_${n}.png`);
const dl = (n: string) => staticFile(`${R}dl/${n}`);
const ME = "blies.jpg";

// ---------- fundo do Ranked Hub ----------
export const Bg: React.FC<{ glow?: string }> = ({ glow = "#3b6d68" }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#07090a", overflow: "hidden" }}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 80% 45% at 50% 42%, ${glow}55 0%, rgba(0,0,0,0) 72%)` }} />
      <svg width={1400} height={1400} viewBox="0 0 1400 1400" style={{ position: "absolute", left: -160, top: 60, transform: `rotate(${f * 0.05}deg) scale(${1 + f * 0.0004})`, opacity: 0.32 }}>
        <circle cx={700} cy={700} r={520} fill="none" stroke={TEAL} strokeWidth={2} />
        <polygon points="700,110 1210,1000 190,1000" fill="none" stroke={TEAL} strokeWidth={3} />
        <line x1={190} y1={520} x2={1210} y2={520} stroke={TEAL} strokeWidth={2} />
        {[[445, 520], [955, 520], [700, 1000]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={24} fill="#07090a" stroke={TEAL} strokeWidth={3} />)}
      </svg>
      {Array.from({ length: 18 }).map((_, i) => {
        const x = (i * 197) % 1080, y = ((i * 311 - f * (0.4 + (i % 3) * 0.2)) % 1920 + 1920) % 1920;
        return <div key={i} style={{ position: "absolute", left: x, top: y, width: 4, height: 4, borderRadius: 4, background: TEAL, opacity: 0.22 }} />;
      })}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 85% 70% at 50% 45%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.75) 100%)" }} />
    </AbsoluteFill>
  );
};

// palco: fundo + câmera sempre andando devagar
const Stage: React.FC<{ life: number; glow?: string; push?: number; shakeAt?: number; children: React.ReactNode }> = ({ life, glow, push = 0.05, shakeAt = -99, children }) => {
  const f = useCurrentFrame();
  const z = interpolate(f, [0, Math.max(life, 1)], [1, 1 + push], clamp);
  const dt = f - shakeAt;
  const sh = dt >= 0 && dt < 10 ? (10 - dt) * 1.8 : 0;
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Bg glow={glow} />
      <AbsoluteFill style={{ transform: `translate(${Math.sin(f * 2.3) * sh}px, ${Math.cos(f * 3.1) * sh}px) scale(${z})`, transformOrigin: "50% 42%" }}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
};

const T: React.FC<{ y: number; size?: number; color?: string; at?: number; children: React.ReactNode; x?: number; w?: number; left?: boolean; ls?: number; weight?: number; font?: string }> = ({ y, size = 80, color = INK, at = 0, children, x = 80, w = 850, left, ls = 0, weight = 900, font = TITLE }) => {
  const f = useCurrentFrame();
  const e = back(f, at, 9, 1.5);
  return <div style={{ position: "absolute", left: x, width: w, top: y, textAlign: left ? "left" : "center", fontFamily: font, fontWeight: weight, fontSize: size, lineHeight: 1.04, letterSpacing: ls, color, opacity: Math.min(1, e * 1.3), transform: `translateY(${(1 - e) * 26}px)`, textShadow: "0 4px 24px rgba(0,0,0,0.75)" }}>{children}</div>;
};

const Hand: React.FC<{ x: number; y: number; size?: number; at?: number; rot?: number; color?: string; children: React.ReactNode; w?: number }> = ({ x, y, size = 64, at = 0, rot = -5, color = RED, children, w = 800 }) => {
  const f = useCurrentFrame();
  const e = ease(f, at, 7);
  return <div style={{ position: "absolute", left: x, top: y, width: w, fontFamily: HAND, fontSize: size, lineHeight: 1.05, color, transform: `rotate(${rot}deg)`, transformOrigin: "0 50%", clipPath: `inset(-20% ${(1 - e) * 100}% -20% -5%)`, textShadow: "0 3px 12px rgba(0,0,0,0.8)" }}>{children}</div>;
};

const Stamp: React.FC<{ x?: number; y: number; at: number; color?: string; rot?: number; size?: number; children: React.ReactNode; w?: number }> = ({ x = 80, y, at, color = RED, rot = -6, size = 90, children, w = 850 }) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  const e = interpolate(f - at, [0, 5], [1.9, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, display: "flex", justifyContent: "center", transform: `rotate(${rot}deg) scale(${e})`, opacity: interpolate(f - at, [0, 3], [0, 1], clamp) }}>
      <div style={{ fontFamily: TITLE, fontWeight: 900, fontSize: size, lineHeight: 1, color, padding: "12px 30px", border: `9px solid ${color}`, borderRadius: 16, textAlign: "center", background: "rgba(7,9,10,0.82)" }}>{children}</div>
    </div>
  );
};

const Badge: React.FC<{ n: string; w: number; x?: number; y: number; style?: React.CSSProperties }> = ({ n, w, x, y, style }) => (
  <Img src={badge(n)} style={{ position: "absolute", left: x ?? (1080 - w) / 2, top: y, width: w, objectFit: "contain", ...style }} />
);

// marcador vermelho riscado à mão
const scribblePath = (cx: number, cy: number, rx: number, ry: number) => {
  const p: string[] = [];
  for (let i = 0; i <= 64; i++) {
    const a = -2.1 + (i / 64) * 6.75, k = 1 + 0.03 * Math.sin(a * 3) + 0.05 * (i / 64);
    p.push(`${i ? "L" : "M"}${(cx + rx * k * Math.cos(a)).toFixed(1)} ${(cy + ry * k * Math.sin(a)).toFixed(1)}`);
  }
  return p.join(" ");
};
const Circle: React.FC<{ cx: number; cy: number; rx: number; ry: number; at: number; n?: number; w?: number }> = ({ cx, cy, rx, ry, at, n = 10, w = 13 }) => {
  const f = useCurrentFrame();
  const e = ease(f, at, n);
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <path d={scribblePath(cx, cy, rx, ry)} pathLength={1} fill="none" stroke={RED} strokeWidth={w} strokeLinecap="round" strokeDasharray={1} strokeDashoffset={1 - e} opacity={e > 0 ? 0.94 : 0} />
    </svg>
  );
};
const Line: React.FC<{ d: string; at: number; n?: number; color?: string; w?: number }> = ({ d, at, n = 8, color = RED, w = 9 }) => {
  const f = useCurrentFrame();
  const e = ease(f, at, n);
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <path d={d} pathLength={1} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={1} strokeDashoffset={1 - e} opacity={e > 0 ? 1 : 0} />
    </svg>
  );
};
const Rays: React.FC<{ color?: string; y?: number; opacity?: number }> = ({ color = GOLD, y = 620, opacity = 0.34 }) => {
  const f = useCurrentFrame();
  return (
    <div style={{ position: "absolute", left: -560, top: y - 1100, width: 2200, height: 2200, borderRadius: "50%", opacity, transform: `rotate(${f * 0.5}deg)`,
      background: `repeating-conic-gradient(${color} 0deg 9deg, rgba(0,0,0,0) 9deg 24deg)`, WebkitMaskImage: "radial-gradient(circle, #000 0%, rgba(0,0,0,0) 62%)" }} />
  );
};
const Photo: React.FC<{ size: number; x: number; y: number; ring?: string; radius?: string | number }> = ({ size, x, y, ring = GOLD, radius = "50%" }) => (
  <div style={{ position: "absolute", left: x, top: y, width: size, height: size, borderRadius: radius, overflow: "hidden", border: `6px solid ${ring}`, boxShadow: `0 0 50px ${ring}66` }}>
    <Img src={dl(ME)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "43% 38%" }} />
  </div>
);
const Panel: React.FC<{ x?: number; y: number; w?: number; h?: number; at?: number; children: React.ReactNode }> = ({ x = 80, y, w = 850, h, at = 0, children }) => {
  const f = useCurrentFrame();
  const e = back(f, at, 10, 1.3);
  return <div style={{ position: "absolute", left: x, top: y, width: w, height: h, background: PANEL, border: `3px solid ${EDGE}`, borderRadius: 26, opacity: Math.min(1, e * 1.4), transform: `translateY(${(1 - e) * 40}px) scale(${0.96 + e * 0.04})`, boxShadow: "0 24px 70px rgba(0,0,0,0.6)" }}>{children}</div>;
};
const Shield: React.FC<{ size?: number; color?: string; broken?: number }> = ({ size = 130, color = TEAL, broken = 0 }) => (
  <svg width={size} height={size * 1.16} viewBox="0 0 100 116" style={{ overflow: "visible" }}>
    <g style={{ transform: `translate(${-broken * 26}px, ${broken * 70}px) rotate(${-broken * 26}deg)`, transformOrigin: "50% 60%", opacity: 1 - broken * 0.9 }}>
      <path d="M50 4 L92 18 L92 58 C92 86 70 104 50 112 L50 58 L50 4 Z" fill={color} transform={`translate(${broken * 52} ${-broken * 30})`} />
      <path d="M50 4 L8 18 L8 58 C8 86 30 104 50 112 L50 58 Z" fill={color} opacity={0.82} />
    </g>
  </svg>
);
const Tile: React.FC<{ text: string; color: string; s?: number; size?: number }> = ({ text, color, s = 1, size = 110 }) => (
  <div style={{ width: size, height: size, borderRadius: 18, background: `${color}26`, border: `4px solid ${color}`, color, fontFamily: TITLE, fontWeight: 900, fontSize: size * 0.56, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${s})` }}>{text}</div>
);

// ---------- meme em tela cheia ----------
export const RKMeme: React.FC<{ life: number; m: string; ss?: number; z0?: number; z1?: number }> = ({ life, m, ss = 0, z0 = 1, z1 = 1.07 }) => {
  const f = useCurrentFrame();
  const len = (ML as Record<string, number>)[m] ?? 3;
  const loopF = Math.max(1, Math.floor((len - ss) * FPS) - 1);
  const v = <OffthreadVideo src={staticFile(`${R}memes/${m}.mp4`)} muted startFrom={Math.round(ss * FPS)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />;
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${interpolate(f, [0, life], [z0, z1], clamp)})` }}>{life > loopF ? <Loop durationInFrames={loopF}>{v}</Loop> : v}</AbsoluteFill>
    </AbsoluteFill>
  );
};

// foto de meme (sem som, pedido dele 06/11): foto inteira sobre ela mesma desfocada, zoom lento; corte seco na entrada e na saída
export const RKMemeFoto: React.FC<{ life: number; img: string; pos?: string; z0?: number; z1?: number }> = ({ life, img, pos = "50% 50%", z0 = 1.02, z1 = 1.1 }) => {
  const f = useCurrentFrame();
  const z = interpolate(f, [0, life], [z0, z1], clamp);
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <Img src={dl(img)} style={{ position: "absolute", inset: -80, width: "calc(100% + 160px)", height: "calc(100% + 160px)", objectFit: "cover", filter: "blur(38px) brightness(0.45) saturate(1.2)" }} />
      <div style={{ position: "absolute", left: 0, top: 190, width: 1080, height: 1100, overflow: "hidden", transform: `scale(${z})`, transformOrigin: "50% 45%", boxShadow: "0 30px 90px rgba(0,0,0,0.7)" }}>
        <Img src={dl(img)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: pos }} />
      </div>
    </AbsoluteFill>
  );
};

// ---------- gancho: subiu com 0 partidas ----------
export const RKHook: React.FC<{ life: number; riseAt?: number; zeroAt?: number }> = ({ life, riseAt = 40, zeroAt = 90 }) => {
  const f = useCurrentFrame();
  const flip = interpolate(f, [riseAt, riseAt + 12], [0, 180], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const up = ease(f, riseAt + 6, 10);
  return (
    <Stage life={life} shakeAt={riseAt + 12} glow={f > riseAt ? "#9a6a2a" : "#3b6d68"}>
      {f > riseAt + 6 ? <Rays y={620} opacity={0.26 * up} /> : null}
      <T y={214} size={46} color={TEAL} ls={7}>RANKED</T>
      <T y={268} size={86} ls={1}>BLIES</T>
      <div style={{ position: "absolute", left: 140, top: 370, width: 800, height: 640, perspective: 1400 }}>
        <div style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d", transform: `rotateY(${flip}deg) scale(${1 + up * 0.04 - up * 0.04 * Math.min(1, (f - riseAt - 16) / 10)}) translateY(${-up * 16}px)` }}>
          <Img src={badge("Acolyte")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", backfaceVisibility: "hidden" }} />
          <Img src={badge("Sentinel")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", backfaceVisibility: "hidden", transform: "rotateY(180deg)" }} />
        </div>
      </div>
      {f >= zeroAt ? (
        <Panel y={1050} x={190} w={700} h={210} at={zeroAt}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", gap: 34 }}>
            <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 40, color: TEAL, lineHeight: 1.1, textAlign: "right" }}>partidas<br />jogadas</div>
            <div style={{ fontFamily: TITLE, fontWeight: 900, fontSize: 170, color: RED, lineHeight: 1 }}>0</div>
          </div>
        </Panel>
      ) : null}
    </Stage>
  );
};

// ---------- o ratinho em cima de um metal ----------
export const RKRat: React.FC<{ life: number; ratAt?: number; metalAt?: number; naoAt?: number }> = ({ life, ratAt = 40, metalAt = 80, naoAt = 110 }) => {
  const f = useCurrentFrame();
  const e = back(f, 0, 12, 1.2);
  return (
    <Stage life={life} push={0.06}>
      <T y={196} size={82}>ACOLYTE III</T>
      <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transform: `scale(${0.8 + e * 0.2})`, transformOrigin: "50% 50%", opacity: Math.min(1, e * 1.3) }}>
        <Badge n="Acolyte" w={1040} x={20} y={320} />
      </div>
      <Line d="M 470 410 C 400 340 330 340 250 392" at={ratAt} />
      <Hand x={70} y={395} size={78} at={ratAt + 5} rot={-4}>ratinho</Hand>
      <Line d="M 590 880 C 680 950 730 1030 760 1090" at={metalAt} />
      <Hand x={560} y={1096} size={78} at={metalAt + 5} rot={-3} w={420}>metal?</Hand>
      <Line d="M 545 1140 L 860 1125 M 560 1168 L 850 1100" at={naoAt} n={6} w={11} />
      <Hand x={120} y={1205} size={62} at={naoAt + 4} rot={-2}>sei lá</Hand>
    </Stage>
  );
};

// ---------- título da temporada ----------
export const RKSeason: React.FC<{ life: number; seasonAt?: number }> = ({ life, seasonAt = 18 }) => {
  const f = useCurrentFrame();
  const word = "BETA SEASON 2";
  return (
    <Stage life={life} push={0.08}>
      <Line d="M 540 300 L 960 1020 L 120 1020 Z" at={0} n={22} color={TEAL} w={4} />
      <T y={500} size={84} color={TEAL} ls={6} at={2}>RANKED</T>
      <div style={{ position: "absolute", left: 40, width: 1000, top: 600, textAlign: "center", fontFamily: TITLE, fontWeight: 900, fontSize: 132, lineHeight: 1, color: INK }}>
        {word.split("").map((c, i) => {
          const e = back(f, seasonAt + i * 1.1, 8, 2.2);
          return <span key={i} style={{ display: "inline-block", whiteSpace: "pre", opacity: Math.min(1, e * 2), transform: `translateY(${(1 - e) * -70}px)` }}>{c}</span>;
        })}
      </div>
      <T y={886} size={44} color={TEAL} at={seasonAt + 16} weight={800} font={BODY}>5 de novembro · 11 de março</T>
    </Stage>
  );
};

// ---------- emblema caindo do céu ----------
export const RKSlam: React.FC<{ life: number; n?: string; title?: string; hit?: number }> = ({ life, n = "Sentinel", title = "SENTINELA III", hit = 7 }) => {
  const f = useCurrentFrame();
  const e = fall(f, 0, hit);
  const ring = ease(f, hit, 16);
  return (
    <Stage life={life} shakeAt={hit} glow="#9a6a2a">
      {f >= hit ? <Rays y={660} opacity={0.22} /> : null}
      <div style={{ position: "absolute", left: 540 - 460 * ring, top: 660 - 460 * ring, width: 920 * ring, height: 920 * ring, borderRadius: "50%", border: `${Math.max(1, 16 * (1 - ring))}px solid ${GOLD}`, opacity: f >= hit ? 1 - ring : 0 }} />
      <div style={{ position: "absolute", left: 90, top: 300, width: 900, height: 720, transform: `translateY(${(1 - e) * -1100}px) scale(${1 + (1 - e) * 0.8})` }}>
        <Img src={badge(n)} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
      </div>
      <T y={1090} size={104} at={hit + 2} color={GOLD}>{title}</T>
    </Stage>
  );
};

// ---------- o pai é bom demais ----------
export const RKPai: React.FC<{ life: number }> = ({ life }) => {
  const f = useCurrentFrame();
  const e = back(f, 0, 9, 1.6);
  return (
    <Stage life={life} push={0.12} glow="#b47a22">
      <Rays y={660} opacity={0.5} />
      <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1320, transform: `scale(${0.7 + e * 0.3})`, transformOrigin: "50% 45%" }}>
        <Photo size={640} x={220} y={320} />
      </div>
      <T y={1000} size={210} color={GOLD} at={3}>O PAI</T>
    </Stage>
  );
};

// ---------- III vira IV, barra 350/1000 ----------
export const RKUp: React.FC<{ life: number; upAt?: number; quaseAt?: number; provaAt?: number }> = ({ life, upAt = 30, quaseAt = 70, provaAt = 110 }) => {
  const f = useCurrentFrame();
  const flip = ease(f, upAt, 8);
  const bar = interpolate(f, [quaseAt, quaseAt + 22], [0, 0.35], { ...clamp, easing: Easing.out(Easing.cubic) });
  return (
    <Stage life={life} shakeAt={upAt} glow="#9a6a2a">
      <Badge n="Sentinel" w={760} x={160} y={210} />
      <div style={{ position: "absolute", left: 0, width: 1080, top: 850, height: 130, overflow: "hidden", textAlign: "center", fontFamily: TITLE, fontWeight: 900, fontSize: 112, color: GOLD, lineHeight: "130px" }}>
        <div style={{ transform: `translateY(${-flip * 130}px)` }}>
          <div>SENTINELA III</div>
          <div>SENTINELA IV</div>
        </div>
      </div>
      <div style={{ position: "absolute", left: 140, top: 1020, width: 800, height: 64, borderRadius: 34, background: "#17201f", border: `3px solid ${EDGE}`, overflow: "hidden" }}>
        <div style={{ width: `${bar * 100}%`, height: "100%", background: `linear-gradient(90deg, ${TEAL}, #d9f1ee)` }} />
      </div>
      <T y={1029} x={560} w={360} size={38} at={quaseAt} font={BODY} weight={900}>{Math.round(bar * 1000)} / 1.000</T>
      <Line d="M 420 1180 C 410 1150 415 1120 415 1096" at={quaseAt + 22} w={8} />
      <Hand x={220} y={1178} size={70} at={quaseAt + 26} rot={-3}>quase, né?</Hand>
      <Stamp y={260} at={provaAt} rot={-8} size={84}>TEM PROVA</Stamp>
    </Stage>
  );
};

// ---------- o print dele ----------
export const RKPrint: React.FC<{ life: number; circleAt?: number; duvidaAt?: number }> = ({ life, circleAt = 16, duvidaAt = 34 }) => {
  const f = useCurrentFrame();
  const e = ease(f, 0, 12);
  const z = interpolate(f, [0, life], [1.0, 1.05], clamp);
  return (
    <AbsoluteFill style={{ background: "#07090a", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${z})`, transformOrigin: "50% 52%", opacity: e }}>
        <Img src={dl("print.png")} style={{ position: "absolute", width: 2671, left: -804, top: 40 }} />
        <AbsoluteFill style={{ background: "linear-gradient(90deg, rgba(7,9,10,0.85) 0%, rgba(7,9,10,0) 12%, rgba(7,9,10,0) 88%, rgba(7,9,10,0.85) 100%)" }} />
        <Circle cx={540} cy={985} rx={250} ry={78} at={circleAt} />
        <Hand x={150} y={1125} size={62} at={duvidaAt} rot={-1}>pra quem duvida</Hand>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------- top rank (um dia) ----------
export const RKTop: React.FC<{ life: number }> = ({ life }) => {
  const f = useCurrentFrame();
  const e = back(f, 0, 12, 1.4);
  return (
    <Stage life={life} push={0.1} glow="#b47a22">
      <Rays y={590} opacity={0.34} />
      <div style={{ position: "absolute", left: 90, top: 210, width: 900, height: 700, transform: `scale(${0.55 + e * 0.45})` }}>
        <Img src={badge("Eternus")} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
      </div>
      <Photo size={250} x={415} y={760} />
      <T y={1040} size={112} color={GOLD} at={5}>TOP RANK</T>
      <Hand x={380} y={1168} size={70} at={14} rot={-3} w={560}>um dia</Hand>
    </Stage>
  );
};

// ---------- carta de agradecimento à Valve ----------
export const RKLetter: React.FC<{ life: number; typeDur?: number }> = ({ life, typeDur = 50 }) => {
  const f = useCurrentFrame();
  const body = "Muito obrigado pelo rank.";
  const n = Math.round(interpolate(f, [8, Math.max(9, typeDur)], [0, body.length], clamp));
  return (
    <Stage life={life} push={0.04}>
      <Panel y={420} h={520}>
        <div style={{ padding: "44px 50px", fontFamily: BODY }}>
          <div style={{ fontSize: 36, fontWeight: 800, color: DIM }}>Para:</div>
          <div style={{ fontFamily: TITLE, fontSize: 92, fontWeight: 900, color: INK, lineHeight: 1.05 }}>Valve</div>
          <div style={{ height: 3, background: EDGE, margin: "24px 0 30px" }} />
          <div style={{ fontSize: 74, fontWeight: 800, lineHeight: 1.12, color: TEAL, minHeight: 170 }}>{body.slice(0, n)}<span style={{ opacity: Math.floor(f / 8) % 2 ? 0 : 1, color: INK }}>|</span></div>
        </div>
      </Panel>
    </Stage>
  );
};

// ---------- não me representa ----------
export const RKNotMe: React.FC<{ life: number; xAt?: number }> = ({ life, xAt = 30 }) => {
  const f = useCurrentFrame();
  const e = back(f, 0, 10, 1.3);
  const d = ease(f, xAt, 6);
  return (
    <Stage life={life} glow="#6c2a26">
      <div style={{ position: "absolute", left: 90, top: 250, width: 900, height: 720, transform: `scale(${0.8 + e * 0.2})`, filter: `saturate(${1 - d * 0.7}) brightness(${1 - d * 0.35})` }}>
        <Img src={badge("Acolyte")} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
      </div>
      <Line d="M 230 330 L 840 900" at={xAt} n={5} w={30} />
      <Line d="M 850 320 L 230 910" at={xAt + 5} n={5} w={30} />
      <Hand x={100} y={1040} size={92} at={xAt + 12} rot={-3} w={830}>não me representa</Hand>
    </Stage>
  );
};

// ---------- ficha técnica: negar farm, 80%, menos de um mês ----------
export const RKTec: React.FC<{ life: number; farmAt?: number; pctAt?: number; assimAt?: number; mesAt?: number }> = ({ life, farmAt = 30, pctAt = 120, assimAt = 170, mesAt = 200 }) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [pctAt, pctAt + 24], [0, 80], { ...clamp, easing: Easing.out(Easing.cubic) });
  const C = 2 * Math.PI * 200;
  return (
    <Stage life={life} push={0.03}>
      <Panel y={210} h={170}>
        <div style={{ display: "flex", alignItems: "center", gap: 28, height: "100%", padding: "0 40px" }}>
          <Photo size={110} x={0} y={0} ring={TEAL} />
          <div style={{ marginLeft: 130 }}>
            <div style={{ fontFamily: TITLE, fontWeight: 900, fontSize: 70, color: INK, lineHeight: 1 }}>BLIES</div>
            <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 36, color: TEAL }}>muita coisa pra aprender</div>
          </div>
        </div>
      </Panel>
      {f < pctAt ? <div style={{ opacity: 1 - ease(f, pctAt - 8, 8) }}><T y={640} size={104} color={GOLD} at={4}>MUITA COISA</T><T y={750} size={104} at={8}>PRA APRENDER</T></div> : null}
      {f >= farmAt ? (
        <Panel y={402} h={120} at={farmAt}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "100%", padding: "0 40px", fontFamily: BODY, fontWeight: 800, fontSize: 46, color: INK }}>
            <span>Negar os farms</span><span style={{ color: RED, fontFamily: TITLE, fontWeight: 900 }}>AINDA NÃO</span>
          </div>
        </Panel>
      ) : null}
      {f >= pctAt ? (
        <div style={{ position: "absolute", left: 300, top: 548, width: 480, height: 480, opacity: ease(f, pctAt, 6) }}>
          <svg width={480} height={480} viewBox="0 0 480 480" style={{ transform: "rotate(-90deg)" }}>
            <circle cx={240} cy={240} r={200} fill="none" stroke="#17201f" strokeWidth={38} />
            <circle cx={240} cy={240} r={200} fill="none" stroke={GOLD} strokeWidth={38} strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - p / 100)} />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: TITLE }}>
            <div style={{ fontSize: 150, fontWeight: 900, color: INK, lineHeight: 0.95 }}>{Math.round(p)}%</div>
            <div style={{ fontFamily: BODY, fontSize: 34, fontWeight: 800, color: TEAL, textAlign: "center", lineHeight: 1.05 }}>de técnica<br />desenvolvida</div>
          </div>
        </div>
      ) : null}
      <Hand x={90} y={1040} size={58} at={assimAt} rot={-3}>(vamos dizer assim)</Hand>
      {f >= mesAt ? (
        <Panel y={1130} x={120} w={800} h={140} at={mesAt}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", gap: 22, fontFamily: BODY, fontWeight: 800, fontSize: 44, color: TEAL }}>
            tempo de jogo <span style={{ fontFamily: TITLE, fontWeight: 900, fontSize: 62, color: RED }}>&lt; 1 MÊS</span>
          </div>
        </Panel>
      ) : null}
    </Stage>
  );
};

// ---------- o novo Fallen ----------
export const RKPlayer: React.FC<{ life: number }> = ({ life }) => {
  const f = useCurrentFrame();
  const e = back(f, 0, 12, 1.2);
  return (
    <Stage life={life} push={0.08} glow="#b47a22">
      <Rays y={600} opacity={0.3} />
      <div style={{ position: "absolute", left: 190, top: 210, width: 700, height: 1050, borderRadius: 26, overflow: "hidden", border: `5px solid ${GOLD}`, boxShadow: `0 0 90px ${GOLD}66`, transform: `translateY(${(1 - e) * 200}px) rotate(${(1 - e) * -8}deg)`, background: "#101615" }}>
        <Img src={dl(ME)} style={{ width: "100%", height: 720, objectFit: "cover", objectPosition: "43% 30%" }} />
        <div style={{ position: "absolute", left: 0, right: 0, top: 480, height: 240, background: "linear-gradient(180deg, rgba(16,22,21,0), #101615)" }} />
        <div style={{ textAlign: "center", marginTop: 6, fontFamily: TITLE, fontWeight: 900 }}>
          <div style={{ fontSize: 118, color: INK, lineHeight: 1 }}>BLIES</div>
          <div style={{ fontSize: 66, color: GOLD, lineHeight: 1.05, marginTop: 8 }}>o novo Fallen</div>
          <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 44, color: TEAL, marginTop: 6 }}>do Deadlock</div>
        </div>
      </div>
    </Stage>
  );
};

// ---------- campeonatos ----------
const Bracket: React.FC<{ y: number; at: number; color: string; label: string; flag?: boolean }> = ({ y, at, color, label }) => {
  const f = useCurrentFrame();
  return (
    <>
      <T y={y} size={62} color={color} at={at} x={90} left w={760}>{label}</T>
      {[0, 1, 2, 3].map((i) => {
        const e = back(f, at + 4 + i * 3, 8);
        return <div key={i} style={{ position: "absolute", left: 90, top: y + 84 + i * 66, width: 240, height: 54, borderRadius: 10, background: "#17201f", border: `3px solid ${color}66`, opacity: Math.min(1, e), transform: `translateX(${(1 - e) * -40}px)` }}>
          <div style={{ margin: "13px 16px", height: 22, width: 120 + (i * 37) % 80, borderRadius: 6, background: `${color}55` }} />
        </div>;
      })}
      <Line d={`M 330 ${y + 111} H 410 V ${y + 177} H 330 M 410 ${y + 144} H 490`} at={at + 14} color={color} w={5} />
      <Line d={`M 330 ${y + 243} H 410 V ${y + 309} H 330 M 410 ${y + 276} H 490`} at={at + 17} color={color} w={5} />
      <Line d={`M 490 ${y + 144} H 570 V ${y + 276} H 490 M 570 ${y + 210} H 650`} at={at + 22} color={color} w={5} />
      <div style={{ position: "absolute", left: 650, top: y + 150, width: 130, height: 120, opacity: ease(f, at + 26, 6), transform: `scale(${back(f, at + 26, 8)})` }}>
        <svg viewBox="0 0 100 100" width={130} height={120}><path d="M28 10 H72 V38 C72 54 62 62 50 62 C38 62 28 54 28 38 Z M28 16 H12 C12 36 20 44 30 46 M72 16 H88 C88 36 80 44 70 46 M44 62 V76 H56 V62 M34 88 H66 V76 H34 Z" fill={color} stroke={color} strokeWidth={3} /></svg>
      </div>
    </>
  );
};
export const RKBracket: React.FC<{ life: number; gringaAt?: number; brAt?: number }> = ({ life, gringaAt = 10, brAt = 80 }) => {
  const f = useCurrentFrame();
  if (f < gringaAt - 4) {
    return (
      <Stage life={life} push={0.05}>
        <T y={520} size={120} at={2}>CONTEÚDOS</T>
        <T y={660} size={74} color={GOLD} at={10}>vindo aí</T>
        <Hand x={260} y={800} size={70} at={18} rot={-4} w={600}>inclusive...</Hand>
      </Stage>
    );
  }
  return (
    <Stage life={life} push={0.03}>
      <Bracket y={200} at={gringaAt} color={TEAL} label="LÁ NA GRINGA" />
      <div style={{ position: "absolute", left: 500, top: 216, display: "flex", alignItems: "center", gap: 10, opacity: ease(f, gringaAt + 8, 6), fontFamily: BODY, fontWeight: 900, fontSize: 32, color: "#fff", background: RED, borderRadius: 10, padding: "4px 16px" }}>
        <div style={{ width: 14, height: 14, borderRadius: 14, background: "#fff", opacity: Math.floor(f / 12) % 2 ? 0.4 : 1 }} />AO VIVO
      </div>
      {f >= brAt ? <Bracket y={690} at={brAt} color="#ffd34d" label="AQUI NO BRASIL" /> : null}
      <Hand x={140} y={1140} size={66} at={brAt + 34} rot={-3}>tô pensando, tá?</Hand>
    </Stage>
  );
};

// ---------- comentário e Discord ----------
const Row: React.FC<{ at: number; y: number; txt: string }> = ({ at, y, txt }) => {
  const f = useCurrentFrame();
  const e = back(f, at, 8);
  return (
    <div style={{ position: "absolute", left: 40, top: y, display: "flex", gap: 22, alignItems: "center", opacity: Math.min(1, e), transform: `translateX(${(1 - e) * 40}px)` }}>
      <div style={{ width: 76, height: 76, borderRadius: 76, background: `linear-gradient(135deg, ${TEAL}, ${EDGE})` }} />
      <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 50, color: INK }}>{txt}</div>
    </div>
  );
};
export const RKComment: React.FC<{ life: number; commentAt?: number; discordAt?: number }> = ({ life, commentAt = 20, discordAt = 70 }) => {
  const f = useCurrentFrame();
  const d = back(f, discordAt, 12, 1.4);
  return (
    <Stage life={life} push={0.03}>
      <Panel y={220} h={520}>
        <div style={{ textAlign: "center", fontFamily: BODY, fontWeight: 800, fontSize: 38, color: TEAL, padding: "22px 0" }}>comentários</div>
        <Row at={Math.min(commentAt, 8)} y={100} txt="bora campeonato" />
        <Row at={commentAt + 12} y={220} txt="eu jogo" />
        <Row at={commentAt + 24} y={340} txt="cria o Discord" />
      </Panel>
      {f >= discordAt ? (
        <div style={{ position: "absolute", left: 100, top: 790, width: 810, height: 440, borderRadius: 30, background: "#5865f2", transform: `translateY(${(1 - d) * 300}px)`, boxShadow: "0 30px 90px rgba(88,101,242,0.55)", textAlign: "center", paddingTop: 44 }}>
          <svg width={190} height={146} viewBox="0 0 127 96"><path fill="#fff" d="M107.7 8.1A105 105 0 0 0 81.5 0a72 72 0 0 0-3.4 6.8 97.7 97.7 0 0 0-29.1 0A72 72 0 0 0 45.6 0a105.8 105.8 0 0 0-26.2 8.1C2.8 32.7-1.7 56.6.5 80.2A105.7 105.7 0 0 0 32.7 96a78 78 0 0 0 6.9-11.2 68.4 68.4 0 0 1-10.8-5.2c.9-.7 1.8-1.3 2.6-2a75.6 75.6 0 0 0 64.5 0c.9.7 1.7 1.4 2.6 2a68.7 68.7 0 0 1-10.8 5.2A76.7 76.7 0 0 0 94.5 96a105.3 105.3 0 0 0 32.2-15.8c2.6-27.3-4.5-51-19-72.1ZM42.5 65.7c-6.3 0-11.5-5.7-11.5-12.8s5-12.8 11.5-12.8 11.6 5.8 11.5 12.8-5.1 12.8-11.5 12.8Zm42.2 0c-6.3 0-11.5-5.7-11.5-12.8s5-12.8 11.5-12.8 11.6 5.8 11.5 12.8-5 12.8-11.5 12.8Z" /></svg>
          <div style={{ fontFamily: TITLE, fontWeight: 900, fontSize: 84, color: "#fff", lineHeight: 1.05, marginTop: 14 }}>Discord</div>
          <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 46, color: "#e3e6ff" }}>vou criar depois</div>
        </div>
      ) : null}
    </Stage>
  );
};

// ---------- entrando no ponto do vídeo (depois de 1:15) ----------
export const RKPoint: React.FC<{ life: number; clock?: string; stampAt?: number }> = ({ life, clock = "1:15", stampAt = 22 }) => {
  const f = useCurrentFrame();
  const a = interpolate(f, [0, life], [-30, 200], clamp);
  return (
    <Stage life={life} push={0.06}>
      <div style={{ position: "absolute", left: 240, top: 270, width: 600, height: 600, borderRadius: "50%", border: `16px solid ${TEAL}`, background: "#101615" }}>
        <div style={{ position: "absolute", left: 250, top: -66, width: 76, height: 50, background: TEAL, borderRadius: 8 }} />
        <div style={{ position: "absolute", left: 284, top: 62, width: 8, height: 226, background: RED, transformOrigin: "50% 100%", transform: `rotate(${a}deg)`, borderRadius: 6 }} />
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", paddingTop: 170, fontFamily: TITLE, fontWeight: 900, fontSize: 130, color: INK }}>{clock}</div>
      </div>
      <Stamp y={930} at={stampAt} rot={-4} size={80}>O VÍDEO COMEÇA AGORA</Stamp>
    </Stage>
  );
};

// ---------- entrou gente nova ----------
const HEROES = ["Rat_King", "Celeste", "Baba", "Apollo", "Deadman_Danny", "Nurse_Harrow", "Mo_Krill"];
const Port: React.FC<{ h: string; size: number; x: number; y: number; ring?: string; style?: React.CSSProperties }> = ({ h, size, x, y, ring = TEAL, style }) => (
  <div style={{ position: "absolute", left: x, top: y, width: size, height: size, borderRadius: "50%", overflow: "hidden", border: `4px solid ${ring}`, background: "#17201f", ...style }}>
    <Img src={dl(`${h}_card.png`)} style={{ width: "100%", height: "136%", objectFit: "cover", objectPosition: "50% 0%" }} />
  </div>
);
export const RKCrowd: React.FC<{ life: number; newAt?: number }> = ({ life, newAt = 40 }) => {
  const f = useCurrentFrame();
  return (
    <Stage life={life} push={0.03}>
      <T y={230} size={110}>O QUE A VALVE</T>
      <T y={340} size={124} color={GOLD} at={6}>MUDOU?</T>
      {Array.from({ length: 34 }).map((_, i) => {
        const a = newAt + i * 1.4;
        if (f < a) return null;
        const col = i % 7, row = Math.floor(i / 7);
        const e = interpolate(f - a, [0, 9], [0, 1], { ...clamp, easing: Easing.bounce });
        const yy = 1190 - row * 118 - (col % 2) * 40;
        return <Port key={i} h={HEROES[(i * 3) % 7]} size={124} x={70 + col * 124} y={-140 + (yy + 140) * e} />;
      })}
    </Stage>
  );
};

// ---------- redistribuição ----------
const LADDER = ["Eternus", "Phantom", "Oracle", "Mystic", "Sentinel", "Acolyte"];
export const RKShuffle: React.FC<{ life: number; resetAt?: number; upAt?: number; downAt?: number }> = ({ life, resetAt = 90, upAt = 140, downAt = 170 }) => {
  const f = useCurrentFrame();
  const n = 40;
  return (
    <Stage life={life} push={0.02}>
      {LADDER.map((b, i) => <Badge key={b} n={b} w={190} x={70} y={205 + i * 178} />)}
      {Array.from({ length: n }).map((_, i) => {
        const seed = (i * 7919) % 97 / 97, sx = (i * 131) % 97 / 97;
        const base = 230 + seed * 1000;
        const shuffle = Math.sin(f * 0.11 + i) * 22 * ease(f, 0, 12) * (f < resetAt ? 1 : 0);
        const kind = i % 3; // 0 sobe, 1 desce, 2 fica
        const up = kind === 0 ? ease(f, upAt + (i % 6), 14) : 0;
        const dn = kind === 1 ? ease(f, downAt + (i % 6), 14) : 0;
        const rs = f >= resetAt ? back(f, resetAt, 8) * 26 : 0;
        const col = up > 0 ? GREEN : dn > 0 ? RED : TEAL;
        return <div key={i} style={{ position: "absolute", left: 310 + sx * 590, top: Math.max(200, Math.min(1260, base + shuffle + rs - up * 230 + dn * 230)), width: 40, height: 40, borderRadius: 40, background: col, boxShadow: `0 0 18px ${col}aa`, opacity: Math.min(1, ease(f, i * 0.5, 6)) }} />;
      })}
      <Stamp x={300} w={620} y={640} at={resetAt} size={110} rot={-7}>RESET</Stamp>
    </Stage>
  );
};

// ---------- igual a mim ----------
export const RKIgualAMim: React.FC<{ life: number; meAt?: number }> = ({ life, meAt = 30 }) => {
  const f = useCurrentFrame();
  const r = ease(f, 4, 26);
  return (
    <Stage life={life} glow="#3e7d4a">
      <Line d="M 880 1180 V 330 M 800 420 L 880 310 L 960 420" at={0} n={22} color={GREEN} w={22} />
      <div style={{ position: "absolute", left: 230, top: 880 - r * 440, transition: "none" }}>
        <Photo size={480} x={0} y={0} ring={GREEN} />
      </div>
      <T y={1080} size={78} color={GREEN} at={6} w={760}>SUBIU SEM JOGAR</T>
      {f >= meAt ? <><Circle cx={470} cy={680} rx={300} ry={300} at={meAt} /><Hand x={90} y={310} size={150} at={meAt + 8} rot={-8} w={300}>eu</Hand></> : null}
    </Stage>
  );
};

// ---------- regras: pontos ----------
const RuleRow: React.FC<{ at: number; y: number; label: string; a: string; b: string; swapAt: number }> = ({ at, y, label, a, b, swapAt }) => {
  const f = useCurrentFrame();
  const s = ease(f, swapAt, 7);
  return (
    <Panel y={y} h={290} at={at}>
      <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 44, color: TEAL, padding: "30px 0 0", textAlign: "center" }}>{label}</div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 44, height: 200, fontFamily: TITLE, fontWeight: 900 }}>
        <div style={{ position: "relative", fontSize: 98, color: DIM }}>{a}<div style={{ position: "absolute", left: -6, right: -6, top: "54%", height: 8, background: RED, transform: `scaleX(${s})`, transformOrigin: "0 50%" }} /></div>
        <svg width={70} height={50} viewBox="0 0 70 50" style={{ opacity: s }}><path d="M2 25 H60 M42 6 L62 25 L42 44" fill="none" stroke={GREEN} strokeWidth={9} /></svg>
        <div style={{ fontSize: 132, color: GREEN, opacity: s, transform: `scale(${0.6 + back(f, swapAt, 8) * 0.4})` }}>{b}</div>
      </div>
    </Panel>
  );
};
export const RKRules: React.FC<{ life: number; a1At?: number; a2At?: number; fastAt?: number }> = ({ life, a1At = 50, a2At = 130, fastAt = 200 }) => {
  const f = useCurrentFrame();
  return (
    <Stage life={life} push={0.03}>
      <T y={210} size={94}>REGRAS NOVAS</T>
      <RuleRow at={8} y={340} label="Pontos por partida" a="300" b="350" swapAt={a1At} />
      {f >= a2At - 30 ? <RuleRow at={a2At - 30} y={660} label="Pro emblema seguinte" a="2.000" b="1.500" swapAt={a2At} /> : null}
      {f >= fastAt ? <T y={1000} size={110} color={GREEN} at={fastAt}>SOBE MAIS RÁPIDO</T> : null}
    </Stage>
  );
};

// ---------- gráfico: subir e cair ----------
export const RKGraph: React.FC<{ life: number; winAt?: number; loseAt?: number }> = ({ life, winAt = 50, loseAt = 150 }) => {
  const f = useCurrentFrame();
  const e = fall(f, 0, 12);
  const hit = f >= 12;
  const pts = [[100, 1080], [230, 960], [360, 850], [490, 710], [620, 590]];
  const dn = [[620, 590], [720, 780], [800, 930], [880, 1170]];
  const pd = "M" + pts.map((p) => p.join(" ")).join(" L");
  const dd = "M" + dn.map((p) => p.join(" ")).join(" L");
  return (
    <Stage life={life} shakeAt={12} push={0.02} glow={f > loseAt ? "#6c2a26" : "#3b6d68"}>
      <T y={205} size={86} at={f > 0 ? 0 : 0} color={RED}>MAIS RÁPIDO DE CAIR</T>
      <div style={{ position: "absolute", left: interpolate(ease(f, winAt - 6, 10), [0, 1], [290, 780]), top: interpolate(ease(f, winAt - 6, 10), [0, 1], [-300 + e * 760, 390]), width: interpolate(ease(f, winAt - 6, 10), [0, 1], [500, 170]), height: interpolate(ease(f, winAt - 6, 10), [0, 1], [410, 140]), transform: `rotate(${hit ? 18 : 0}deg)` }}><Img src={badge("Sentinel")} style={{ width: "100%", height: "100%", objectFit: "contain" }} /></div>
      <Line d={pd} at={winAt} n={26} color={GREEN} w={18} />
      {pts.slice(1).map(([x, y], i) => {
        const a = winAt + 6 + i * 6;
        return f >= a ? <div key={i} style={{ position: "absolute", left: x - 44, top: y - 118 }}><Tile text="V" color={GREEN} size={88} s={back(f, a, 7)} /></div> : null;
      })}
      <Line d={dd} at={loseAt} n={18} color={RED} w={18} />
      {dn.slice(1).map(([x, y], i) => {
        const a = loseAt + 4 + i * 6;
        return f >= a ? <div key={i} style={{ position: "absolute", left: x - 104, top: y - 44 }}><Tile text="D" color={RED} size={88} s={back(f, a, 7)} /></div> : null;
      })}
    </Stage>
  );
};

// ---------- martingale ----------
const Chips: React.FC<{ x: number; n: number; at: number; label: string }> = ({ x, n, at, label }) => {
  const f = useCurrentFrame();
  return (
    <div style={{ position: "absolute", left: x, top: 0 }}>
      {Array.from({ length: n }).map((_, i) => {
        const e = back(f, at + i * 1, 7, 1.4);
        return <div key={i} style={{ position: "absolute", left: 0, top: 1060 - i * 34 - (1 - e) * 90, width: 170, height: 62, borderRadius: "50%", background: i % 2 ? "#c9352c" : "#e5e0d0", border: "5px solid #2b1110", opacity: Math.min(1, e * 2) }} />;
      })}
      <div style={{ position: "absolute", left: 0, top: 1140, width: 170, textAlign: "center", fontFamily: TITLE, fontWeight: 900, fontSize: 62, color: INK, opacity: ease(f, at, 6) }}>{label}</div>
    </div>
  );
};
export const RKBet: React.FC<{ life: number; naoAt?: number }> = ({ life, naoAt = 24 }) => {
  return (
    <Stage life={life} glow="#6c2a26" shakeAt={naoAt}>
      <T y={220} size={110} color={GOLD}>MARTINGALE</T>
      <T y={340} size={46} color={TEAL} font={BODY} weight={800}>perdeu? dobra a aposta</T>
      <Chips x={70} n={2} at={2} label="2x" />
      <Chips x={280} n={4} at={6} label="4x" />
      <Chips x={490} n={8} at={10} label="8x" />
      <Chips x={700} n={15} at={14} label="16x" />
      <Stamp y={560} at={naoAt} size={150} rot={-9}>NÃO</Stamp>
    </Stage>
  );
};

// ---------- feedou, caiu ----------
export const RKFeed: React.FC<{ life: number; fallAt?: number }> = ({ life, fallAt = 50 }) => {
  const f = useCurrentFrame();
  const steps = ["IV", "III", "II", "I"];
  const s = Math.min(3, Math.max(0, Math.floor((f - fallAt) / 12)));
  const y = interpolate(f, [fallAt, fallAt + 36], [0, 460], { ...clamp, easing: Easing.in(Easing.quad) });
  return (
    <Stage life={life} glow="#6c2a26" shakeAt={fallAt + 36}>
      <Panel y={210} h={170} x={160} w={760}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "baseline", gap: 18, fontFamily: TITLE, fontWeight: 900, lineHeight: "170px", fontSize: 120, color: RED }}>0 / 12 / 0</div>
      </Panel>
      <Badge n="Sentinel" w={480} x={250} y={420 + y} style={{ transform: `rotate(${y * 0.04}deg)` }} />
      <div style={{ position: "absolute", left: 0, width: 1080, top: 800 + y * 0.55, textAlign: "center", fontFamily: TITLE, fontWeight: 900, fontSize: 120, color: GOLD }}>SENTINELA {steps[s]}</div>
    </Stage>
  );
};

// ---------- proteção do emblema ----------
export const RKShields: React.FC<{ life: number; threeAt?: number; lossAt?: number; perdeAt?: number; antesAt?: number; caiAt?: number }> = ({ life, threeAt = 50, lossAt = 110, perdeAt = 160, antesAt = 190, caiAt = 240 }) => {
  const f = useCurrentFrame();
  const fallE = fall(f, perdeAt, 16);
  return (
    <Stage life={life} push={0.02} shakeAt={perdeAt + 16}>
      <T y={205} size={78}>PROTEÇÃO DO EMBLEMA</T>
      <div style={{ position: "absolute", left: 100, top: 310, width: 880, display: "flex", justifyContent: "space-between" }}>
        {[0, 1, 2, 3, 4].map((i) => {
          const a = 6 + i * 3;
          const br = i >= 3 ? ease(f, threeAt + (i - 3) * 6, 14) : 0;
          return <div key={i} style={{ transform: `scale(${back(f, a, 8)})` }}><Shield size={140} broken={br} /></div>;
        })}
      </div>
      <T y={510} size={108} at={threeAt + 8} color={GOLD}>DE 5 PRA 3</T>
      {f >= lossAt ? (
        <div style={{ position: "absolute", left: 200, top: 680, display: "flex", gap: 34 }}>
          {[0, 1, 2].map((i) => <Tile key={i} text="D" color={RED} size={170} s={back(f, lossAt + i * 7, 8)} />)}
        </div>
      ) : null}
      {f >= lossAt + 16 ? (
        <div style={{ position: "absolute", left: 330, top: 880 + fallE * 500, width: 420, height: 340, transform: `rotate(${fallE * 34}deg)`, opacity: 1 - fallE * 0.2 }}>
          <Img src={badge("Sentinel")} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </div>
      ) : null}
      <Hand x={110} y={1000} size={72} at={antesAt} rot={-4} w={320}>antes: 5</Hand>
      <T y={1130} size={84} color={RED} at={caiAt}>MAIS FÁCIL DE CAIR</T>
    </Stage>
  );
};

// ---------- de Phantom pra cima ----------
export const RKTopo: React.FC<{ life: number; topoAt?: number; euAt?: number; desculpaAt?: number; antesAt?: number; caiAt?: number; difAt?: number }> = ({ life, topoAt = 80, euAt = 130, desculpaAt = 170, antesAt = 190, caiAt = 240, difAt = 300 }) => {
  const f = useCurrentFrame();
  const tops = ["Phantom", "Ascendant", "Eternus"];
  const cai = ease(f, caiAt, 8);
  return (
    <Stage life={life} push={0.02} glow="#4d3a84">
      <T y={205} size={72} color={TEAL} at={0}>DE PHANTOM PRA CIMA</T>
      {tops.map((b, i) => {
        const d = fall(f, caiAt + i * 5, 18);
        return (
          <div key={b} style={{ position: "absolute", left: 40 + i * 300, top: 330 + d * 720, width: 320, height: 290, opacity: back(f, 4 + i * 3, 8), transform: `rotate(${d * (i - 1) * 24}deg)` }}>
            <Img src={badge(b)} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            <div style={{ position: "absolute", left: 0, right: 0, top: 285, textAlign: "center", fontFamily: TITLE, fontWeight: 900, fontSize: 56, color: RED, opacity: (1 - cai) * (1 - ease(f, euAt - 4, 6)) }}>0 proteção</div>
          </div>
        );
      })}
      {f >= euAt ? (
        <div style={{ opacity: 1 - cai * 0.0 }}>
          <div style={{ transform: `scale(${back(f, euAt, 10)})`, transformOrigin: "300px 820px" }}><Photo size={290} x={150} y={680} /></div>
          <T y={985} size={74} color={GOLD} at={euAt + 3} x={110} w={380}>BLIES</T>
          <Hand x={470} y={700} size={44} at={euAt + 6} rot={-3} w={470}>daqui a uns meses</Hand>
          <Line d="M 480 732 L 900 715" at={antesAt} n={5} w={9} />
          <Hand x={490} y={790} size={64} at={desculpaAt} rot={-3} w={420}>desculpa</Hand>
          <Hand x={490} y={890} size={58} at={antesAt + 3} rot={-2} w={420}>ou antes</Hand>
        </div>
      ) : null}
      {f >= difAt ? <Stamp y={1060} at={difAt} size={62} rot={-3}>SE MANTER FICOU MAIS DIFÍCIL</Stamp> : null}
    </Stage>
  );
};

// ---------- 4 bans ----------
export const RKBans: React.FC<{ life: number; banAt?: number; favAt?: number }> = ({ life, banAt = 10, favAt = 90 }) => {
  const f = useCurrentFrame();
  const list = ["Celeste", "Apollo", "Baba", "Rat_King"];
  const dt = [0, 8, 16, favAt - banAt];
  return (
    <Stage life={life} push={0.03}>
      <T y={205} size={120}>4 BANS</T>
      <T y={330} size={46} color={TEAL} font={BODY} weight={800}>por partida (eram 3)</T>
      <div style={{ position: "absolute", left: 110, top: 430, width: 800, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 34 }}>
        {list.map((h, i) => {
          const a = banAt + dt[i];
          const on = ease(f, a, 4);
          return (
            <div key={h} style={{ position: "relative", height: 370, borderRadius: 22, overflow: "hidden", border: `5px solid ${on ? RED : EDGE}`, background: "#17201f" }}>
              <Img src={dl(`${h}_card.png`)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 10%", filter: `grayscale(${on}) brightness(${1 - on * 0.5})` }} />
              {f >= a ? (
                <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, transform: `scale(${interpolate(f - a, [0, 4], [1.4, 1], clamp)})` }}>
                  <path d="M12 12 L88 88 M88 12 L12 88" stroke={RED} strokeWidth={8} strokeLinecap="round" vectorEffect="none" />
                </svg>
              ) : null}
            </div>
          );
        })}
      </div>
      <Hand x={500} y={1215} size={56} at={favAt + 2} rot={-3} w={440}>teu favorito</Hand>
    </Stage>
  );
};

// ---------- 35 pontos / de presente ----------
export const RKPoints: React.FC<{ life: number; ptsAt?: number; valAt?: number; lossAt?: number; giftAt?: number }> = ({ life, ptsAt = 70, valAt = 110, lossAt = 170, giftAt = 260 }) => {
  const f = useCurrentFrame();
  const n = Math.round(interpolate(f, [lossAt, giftAt - 6], [0, 35], clamp));
  const g = ease(f, giftAt, 10);
  if (f >= giftAt) {
    return (
      <Stage life={life} glow="#b47a22" shakeAt={giftAt}>
        <Rays y={640} opacity={0.34} />
        <div style={{ position: "absolute", left: 300, top: 300 - g * 30, width: 480, height: 620, borderRadius: 24, overflow: "hidden", border: `6px solid ${GOLD}`, transform: `scale(${0.4 + back(f, giftAt, 12) * 0.6})`, boxShadow: `0 0 90px ${GOLD}88` }}>
          <Img src={dl("Rat_King_card.png")} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 10%" }} />
        </div>
        <T y={960} size={100} color={GOLD} at={giftAt + 4}>HERÓI LIBERADO</T>
        <Hand x={250} y={1090} size={84} at={giftAt + 10} rot={-3}>de presente</Hand>
      </Stage>
    );
  }
  return (
    <Stage life={life} push={0.02}>
      <div style={{ position: "absolute", left: 0, width: 1080, top: 210, textAlign: "center", fontFamily: TITLE, fontWeight: 900, fontSize: 92, color: DIM }}>
        <span style={{ position: "relative", fontSize: f < ptsAt - 8 ? 120 : 92, color: f < ptsAt - 8 ? INK : DIM }}>15 VITÓRIAS<span style={{ position: "absolute", left: -12, right: -12, top: "52%", height: 10, background: RED, transform: `scaleX(${ease(f, ptsAt - 8, 6)})`, transformOrigin: "0 50%" }} /></span>
      </div>
      <T y={320} size={150} color={GOLD} at={ptsAt}>35 PONTOS</T>
      {f >= valAt ? (
        <div style={{ position: "absolute", left: 120, top: 500, display: "flex", gap: 40 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, transform: `scale(${back(f, valAt, 8)})`, fontFamily: TITLE, fontWeight: 900, fontSize: 86, color: GREEN }}><Tile text="V" color={GREEN} size={110} />+2</div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, transform: `scale(${back(f, valAt + 16, 8)})`, fontFamily: TITLE, fontWeight: 900, fontSize: 86, color: RED }}><Tile text="D" color={RED} size={110} />+1</div>
        </div>
      ) : null}
      {f >= lossAt ? (
        <>
          <div style={{ position: "absolute", left: 90, top: 660, width: 820, display: "flex", flexWrap: "wrap", gap: 10 }}>
            {Array.from({ length: 35 }).map((_, i) => <div key={i} style={{ width: 72, height: 72, borderRadius: 11, border: `3px solid ${i < n ? RED : EDGE}`, background: i < n ? `${RED}38` : "#101615", color: RED, fontFamily: TITLE, fontWeight: 900, fontSize: 44, lineHeight: "66px", textAlign: "center" }}>{i < n ? "D" : ""}</div>)}
          </div>
          <T y={1140} size={100} color={RED}>{n} / 35</T>
        </>
      ) : null}
    </Stage>
  );
};

// ---------- a matemática dele ----------
const Chalk: React.FC<{ y: number; at: number; children: React.ReactNode; size?: number; x?: number; color?: string; rot?: number; w?: number }> = ({ y, at, children, size = 74, x = 110, color = "#f1efe3", rot = -1.5, w = 800 }) => (
  <Hand x={x} y={y} size={size} at={at} rot={rot} color={color} w={w}>{children}</Hand>
);
export const RKMath: React.FC<{ life: number; minAt?: number; maxAt?: number; riscoAt?: number; max35At?: number; min15At?: number; fixAt?: number }> = ({ life, minAt = 60, maxAt = 120, riscoAt = 150, max35At = 170, min15At = 200, fixAt = 280 }) => {
  return (
    <AbsoluteFill style={{ background: "#07090a", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 60, top: 190, width: 960, height: 1090, borderRadius: 20, background: "radial-gradient(ellipse at 40% 40%, #1e3a33 0%, #12251f 100%)", border: "14px solid #4a3522" }} />
      <Chalk y={230} at={4} size={70} color={TEAL}>herói favorito:</Chalk>
      <Chalk y={350} at={minAt}>mínimo = 35</Chalk>
      <Chalk y={445} at={minAt + 12} size={50} color={TEAL}>(se for muito ruim)</Chalk>
      <Chalk y={560} at={maxAt}>máximo = ???</Chalk>
      <Line d="M 110 600 L 640 590" at={riscoAt} n={5} w={10} color="#f1efe3" />
      <Chalk y={660} at={max35At}>máximo = 35</Chalk>
      <Line d="M 110 390 L 620 380" at={min15At - 4} n={5} w={10} color="#f1efe3" />
      <Chalk y={790} at={min15At}>mínimo = <span style={{ color: "#f1efe3" }}>15</span></Chalk>
      <Chalk y={885} at={min15At + 14} size={50} color={TEAL}>(ganhando todas)</Chalk>
      <Circle cx={540} cy={830} rx={110} ry={70} at={fixAt} n={7} w={10} />
      <Hand x={640} y={760} size={110} at={fixAt + 8} rot={-6} w={300}>18!</Hand>
      <Hand x={150} y={1010} size={66} at={fixAt + 16} rot={-2} w={780}>35 ÷ 2 = 18 vitórias</Hand>
      <Hand x={250} y={1110} size={52} at={fixAt + 24} rot={-2} w={600} color="#ffb3ae">assinado: o editor</Hand>
    </AbsoluteFill>
  );
};

// ---------- me segue ----------
const Follow: React.FC<{ y: number; at: number; clickAt: number; x?: number }> = ({ y, at, clickAt, x = 190 }) => {
  const f = useCurrentFrame();
  const done = f >= clickAt;
  const press = f >= clickAt && f < clickAt + 6 ? 0.93 : 1;
  const ce = interpolate(f, [at + 2, clickAt], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  return (
    <>
      <div style={{ position: "absolute", left: x, top: y, width: 700, height: 140, borderRadius: 26, background: done ? "#1b2423" : "#fe2c55", border: `4px solid ${done ? EDGE : "#fe2c55"}`, color: "#fff", fontFamily: BODY, fontWeight: 900, fontSize: 68, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${press * back(f, at, 9)})`, opacity: Math.min(1, ease(f, at, 5)) }}>
        {done ? "SEGUINDO ✓" : "SEGUIR"}
      </div>
      {f < clickAt + 18 && f >= at ? (
        <svg width={90} height={110} viewBox="0 0 24 30" style={{ position: "absolute", left: x + 700 * (0.95 - 0.45 * ce), top: y + 270 - 190 * ce }}><path d="M3 1 L3 23 L9 18 L13 28 L17 26 L13 16 L21 16 Z" fill="#fff" stroke="#000" strokeWidth={1.4} /></svg>
      ) : null}
    </>
  );
};
export const RKFollow: React.FC<{ life: number; followAt?: number; liveAt?: number; diaAt?: number }> = ({ life, followAt = 60, liveAt = 120, diaAt = 170 }) => {
  const f = useCurrentFrame();
  const e = back(f, 0, 12, 1.3);
  return (
    <Stage life={life} push={0.03}>
      <div style={{ transform: `scale(${0.7 + e * 0.3})`, transformOrigin: "540px 380px" }}><Photo size={330} x={375} y={200} /></div>
      <T y={540} size={124}>BLIES</T>
      <Follow y={690} at={followAt - 10} clickAt={followAt + 16} />
      {f >= liveAt ? (
        <div style={{ position: "absolute", left: 190, top: 860, display: "flex", alignItems: "center", gap: 16, fontFamily: BODY, fontWeight: 900, fontSize: 60, color: "#fff", background: RED, borderRadius: 16, padding: "10px 32px", transform: `scale(${back(f, liveAt, 8)})` }}>
          <div style={{ width: 26, height: 26, borderRadius: 26, background: "#fff", opacity: Math.floor(f / 12) % 2 ? 0.4 : 1 }} />LIVE
        </div>
      ) : null}
      {f >= diaAt ? (
        <div style={{ position: "absolute", left: 190, top: 1000, width: 700, display: "flex", justifyContent: "space-between" }}>
          {["S", "T", "Q", "Q", "S", "S", "D"].map((d, i) => <div key={i} style={{ transform: `scale(${back(f, diaAt + i * 2, 7)})` }}><Tile text={d} color={GOLD} size={88} /></div>)}
        </div>
      ) : null}
      {f >= diaAt ? <T y={1120} size={78} color={GOLD} at={diaAt + 12}>TODO DIA</T> : null}
    </Stage>
  );
};

// ---------- série dos básicos ----------
export const RKSeries: React.FC<{ life: number; eloAt?: number; fundAt?: number; shareAt?: number }> = ({ life, eloAt = 80, fundAt = 170, shareAt = 210 }) => {
  const f = useCurrentFrame();
  return (
    <Stage life={life} push={0.02}>
      <T y={205} size={110} color={GOLD}>OS BÁSICOS</T>
      <div style={{ position: "absolute", left: 90, top: 340, display: "flex", gap: 24 }}>
        {["01", "02", "03"].map((e, i) => (
          <div key={e} style={{ width: 262, height: 200, borderRadius: 20, background: PANEL, border: `3px solid ${EDGE}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", transform: `scale(${back(f, 8 + i * 5, 8)})` }}>
            <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 34, color: TEAL }}>EP</div>
            <div style={{ fontFamily: TITLE, fontWeight: 900, fontSize: 96, lineHeight: 1, color: INK }}>{e}</div>
          </div>
        ))}
      </div>
      {f >= eloAt ? (
        <div style={{ position: "absolute", left: 90, top: 590, width: 820, height: 330, opacity: ease(f, eloAt, 6) }}>
          <Img src={badge("Sentinel")} style={{ position: "absolute", left: 0, top: 10, width: 300, height: 240, objectFit: "contain" }} />
          <Img src={badge("Eternus")} style={{ position: "absolute", left: 520, top: 0, width: 320, height: 250, objectFit: "contain", filter: "grayscale(1) brightness(0.5)" }} />
          <svg width={260} height={60} style={{ position: "absolute", left: 280, top: 100 }}><path d="M0 30 H230" stroke={DIM} strokeWidth={8} strokeDasharray="16 16" /><path d="M210 10 L240 30 L210 50" fill="none" stroke={DIM} strokeWidth={8} /></svg>
          <div style={{ position: "absolute", left: 0, top: 250, width: 300, textAlign: "center", fontFamily: TITLE, fontWeight: 900, fontSize: 54, color: GOLD }}>eu</div>
          <div style={{ position: "absolute", left: 520, top: 250, width: 320, textAlign: "center", fontFamily: TITLE, fontWeight: 900, fontSize: 54, color: DIM }}>high elo</div>
        </div>
      ) : null}
      {f >= fundAt ? (
        <Panel y={950} h={140} at={fundAt}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 24, height: "100%", fontFamily: TITLE, fontWeight: 900, fontSize: 74, color: GREEN }}>
            <svg width={70} height={60} viewBox="0 0 70 60"><path d="M6 32 L26 52 L64 8" fill="none" stroke={GREEN} strokeWidth={12} strokeLinecap="round" /></svg>FUNDAMENTOS
          </div>
        </Panel>
      ) : null}
      {f >= shareAt ? <T y={1120} size={72} color={TEAL} at={shareAt}>tudo que eu sei, pra vocês</T> : null}
    </Stage>
  );
};

// ---------- comunidade no Brasil + porta-voz ----------
export const RKBrasil: React.FC<{ life: number; micAt?: number }> = ({ life, micAt = 90 }) => {
  const f = useCurrentFrame();
  return (
    <Stage life={life} glow="#2c7a45" push={0.03}>
      {Array.from({ length: 24 }).map((_, i) => {
        const a = (i / 24) * Math.PI * 2 + f * 0.012;
        const e = back(f, i * 1.2, 9, 1.3);
        const r = 410 * e;
        return <Port key={i} h={HEROES[i % 7]} size={100} x={490 + Math.cos(a) * r} y={640 + Math.sin(a) * r} ring={i % 2 ? "#ffd34d" : "#3ecf6b"} />;
      })}
      <div style={{ position: "absolute", left: 240, top: 480, width: 600, textAlign: "center", fontFamily: TITLE, fontWeight: 900, lineHeight: 1 }}>
        <div style={{ fontSize: 118, color: "#ffd34d", opacity: ease(f, 8, 8) }}>DEADLOCK</div>
        <div style={{ fontSize: 132, color: "#3ecf6b", opacity: ease(f, 14, 8) }}>BRASIL</div>
      </div>
      {f >= micAt ? (
        <div style={{ position: "absolute", left: 340, top: 700, width: 400, transform: `scale(${back(f, micAt, 10)})`, transformOrigin: "50% 40%" }}>
          <Photo size={270} x={65} y={0} />
          <svg width={120} height={170} viewBox="0 0 60 90" style={{ position: "absolute", left: 270, top: 130 }}><rect x={18} y={4} width={24} height={44} rx={12} fill={INK} /><path d="M8 34 C8 62 52 62 52 34 M30 58 V82 M16 84 H44" fill="none" stroke={INK} strokeWidth={5} /></svg>
        </div>
      ) : null}
      {f >= micAt ? <Hand x={130} y={1190} size={58} at={micAt + 8} rot={-2} w={820}>porta-voz, quem sabe</Hand> : null}
    </Stage>
  );
};

// ---------- fechamento ----------
export const RKEnd: React.FC<{ life: number; followAt?: number; proAt?: number; byeAt?: number }> = ({ life, followAt = 8, proAt = 70, byeAt = 120 }) => {
  const f = useCurrentFrame();
  return (
    <Stage life={life} push={0.04} glow="#9a6a2a">
      {f >= proAt ? <Rays y={480} opacity={0.2} /> : null}
      <Photo size={300} x={390} y={200} />
      <T y={510} size={110}>BLIES</T>
      <Follow y={640} at={followAt} clickAt={followAt + 26} />
      <Line d="M 780 760 C 880 860 930 800 925 690" at={followAt + 30} n={10} w={10} />
      {f >= proAt ? <T y={830} size={84} color={TEAL} at={proAt}>quem sabe virar</T> : null}
      {f >= proAt ? <T y={920} size={126} color={GOLD} at={proAt + 8}>PRO PLAYER</T> : null}
      {f >= byeAt ? <Hand x={170} y={1110} size={100} at={byeAt} rot={-3} color={INK} w={860}>tamo junto!</Hand> : null}
    </Stage>
  );
};
