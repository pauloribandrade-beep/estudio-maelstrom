import React from "react";
import { AbsoluteFill, Easing, interpolate, Loop, OffthreadVideo, staticFile, useCurrentFrame } from "remotion";
import { loadFont as loadFredoka } from "@remotion/google-fonts/Fredoka";
import CL from "./clips.json";
import AR from "./clips_ar.json";

// Short "Atualização de Halloween do Deadlock" (31/10/2026), mesmo estilo Laestro do Rei dos Ratos: tomadas de jogo
// em tela cheia com zoom lento (HWShot), memes em card no fundo cinza, legenda amarela (captions.style = "laestro").
// Peças próprias: título do gancho (HWTitle), a aposta do troll 70% x 30% (HWOdds) e o prazo do evento (HWDate).

const { fontFamily: FREDOKA } = loadFredoka("normal", { weights: ["500", "600"], subsets: ["latin", "latin-ext"] });
const R = "videos/2026-10-31_deadlock-halloween_R/clips/";
const FPS = 30;
const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
const GRAY = "#8d8d8d";
const ORANGE = "#ff8a1f";
const INK = "#2b1606";
const stroke = (w: number, c = INK) => `${w}px ${w}px 0 ${c}, -${w}px ${w}px 0 ${c}, ${w}px -${w}px 0 ${c}, -${w}px -${w}px 0 ${c}, 0 ${w}px 0 ${c}, 0 -${w}px 0 ${c}, ${w}px 0 0 ${c}, -${w}px 0 0 ${c}`;

export const HWBg: React.FC = () => <AbsoluteFill style={{ background: GRAY }} />;

const Clip: React.FC<{ clip: string; ss?: number; rate?: number; life: number; pos?: string }> = ({ clip, ss = 0, rate = 1, life, pos = "50% 50%" }) => {
  const len = (CL as Record<string, number>)[clip] ?? 3;
  const loopF = Math.max(1, Math.floor(((len - ss) / rate) * FPS) - 1);
  const v = <OffthreadVideo src={staticFile(`${R}${clip}.mp4`)} muted startFrom={Math.round(ss * FPS)} playbackRate={rate} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: pos }} />;
  return life > loopF ? <Loop durationInFrames={loopF}>{v}</Loop> : v;
};

type ShotP = { life: number; clip: string; mode?: "full" | "card" | "pip"; ss?: number; rate?: number; pos?: string; rot?: number; z0?: number; z1?: number; cy?: number; shakeAt?: number };

// tomada: tela cheia com zoom lento, ou "card" (meme pequeno e torto no cinza, com a proporção do vídeo)
// "pip": o meme pequeno por cima do jogo (lane de cima), sem o fundo cinza. shakeAt (s): a tela treme a partir dali.
export const HWShot: React.FC<ShotP> = ({ life, clip, mode = "full", ss, rate, pos, rot = -3, z0, z1, cy = 1010, shakeAt }) => {
  const f = useCurrentFrame();
  if (mode === "pip") {
    const pop = interpolate(f, [0, 7], [0.5, 1], { ...clamp, easing: Easing.out(Easing.back(2)) });
    const out = interpolate(f, [life - 5, life], [1, 0], clamp);
    const ar = (AR as Record<string, number>)[clip] ?? 16 / 9;
    const cw = 600, ch = cw / ar;
    return (
      <AbsoluteFill style={{ pointerEvents: "none" }}>
        <div style={{ position: "absolute", left: 1080 - cw - 50, top: cy - ch / 2, width: cw, height: ch, opacity: out, transform: `rotate(${rot}deg) scale(${pop})`, border: "10px solid #fff", borderRadius: 18, boxShadow: "0 22px 40px rgba(0,0,0,0.55)", overflow: "hidden", background: "#111" }}>
          <Clip clip={clip} ss={ss} rate={rate} life={life} pos={pos} />
        </div>
      </AbsoluteFill>
    );
  }
  if (mode === "card") {
    const pop = interpolate(f, [0, 7], [0.78, 1], { ...clamp, easing: Easing.out(Easing.back(1.8)) });
    const grow = interpolate(f, [0, life], [z0 ?? 1, z1 ?? 1.08], clamp);
    const ar = (AR as Record<string, number>)[clip] ?? 16 / 9;
    const cw = ar >= 1.5 ? 920 : 780;
    const ch = cw / ar;
    return (
      <AbsoluteFill style={{ background: GRAY }}>
        <div style={{ position: "absolute", left: 540 - cw / 2, top: cy - ch / 2, width: cw, height: ch, transform: `rotate(${rot}deg) scale(${pop * grow})`, boxShadow: "0 22px 40px rgba(0,0,0,0.45)", overflow: "hidden", background: "#111" }}>
          <Clip clip={clip} ss={ss} rate={rate} life={life} pos={pos} />
        </div>
      </AbsoluteFill>
    );
  }
  const z = interpolate(f, [0, life], [z0 ?? 1.0, z1 ?? 1.1], clamp);
  const k = shakeAt === undefined ? 0 : f - Math.round(shakeAt * FPS);
  const amp = k >= 0 ? 34 * Math.exp(-k / 7) : 0;
  const sx = amp * Math.sin(k * 2.7), sy = amp * Math.cos(k * 3.3) * 0.7;
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `translate(${sx}px, ${sy}px) scale(${z + (amp > 0 ? 0.04 : 0)})` }}>
        <Clip clip={clip} ss={ss} rate={rate} life={life} pos={pos} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// título do gancho por cima do jogo (carimbo, lane 1): duas linhas que caem uma depois da outra e balançam de leve
export const HWTitle: React.FC<{ life: number; l1?: string; l2?: string; y?: number }> = ({ life, l1 = "ATUALIZAÇÃO", l2 = "DE HALLOWEEN", y = 330 }) => {
  const f = useCurrentFrame();
  const out = interpolate(f, [life - 6, life], [1, 0], clamp);
  const line = (txt: string, d: number, size: number, color: string) => {
    const s = interpolate(f - d, [0, 8], [2.2, 1], { ...clamp, easing: Easing.out(Easing.back(1.6)) });
    const o = interpolate(f - d, [0, 3], [0, 1], clamp);
    const wob = Math.sin((f - d) / 9) * 2;
    return (
      <div style={{ fontFamily: FREDOKA, fontWeight: 600, fontSize: size, lineHeight: 1, color, textShadow: `${stroke(6)}, 0 14px 0 ${INK}`, transform: `scale(${s}) rotate(${wob}deg)`, opacity: o }}>{txt}</div>
    );
  };
  return (
    <AbsoluteFill style={{ alignItems: "center", pointerEvents: "none" }}>
      <div style={{ position: "absolute", top: y, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, opacity: out }}>
        {line(l1, 0, 112, "#ffffff")}
        {line(l2, 6, 128, ORANGE)}
      </div>
    </AbsoluteFill>
  );
};

// a aposta do troll: no cinza, duas barras que enchem (70% buff permanente x 30% nada) e, em `stunAt`,
// o carimbo "SEM DOCE = STUN" treme por cima. Chaves "...At" chegam em frames.
export const HWOdds: React.FC<{ life: number; fillAt?: number; stunAt?: number }> = ({ life, fillAt = 10, stunAt = 9999 }) => {
  const f = useCurrentFrame();
  const pop = interpolate(f, [0, 8], [0.8, 1], { ...clamp, easing: Easing.out(Easing.back(1.8)) });
  const grow = interpolate(f, [0, life], [1, 1.05], clamp);
  const k = interpolate(f, [fillAt, fillAt + 24], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const bar = (label: string, pct: number, color: string, d: number) => {
    const kk = interpolate(f, [fillAt + d, fillAt + d + 22], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 44, fontWeight: 600, color: "#1c1c1c" }}>
          <span>{label}</span>
          <span style={{ fontVariantNumeric: "tabular-nums" }}>{Math.round(pct * kk)}%</span>
        </div>
        <div style={{ height: 58, borderRadius: 30, background: "#e6e6e6", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct * kk}%`, borderRadius: 30, background: color }} />
        </div>
      </div>
    );
  };
  const st = interpolate(f, [stunAt, stunAt + 6], [2.4, 1], { ...clamp, easing: Easing.out(Easing.back(2)) });
  const so = interpolate(f, [stunAt, stunAt + 2], [0, 1], clamp);
  const shake = f >= stunAt && f < stunAt + 10 ? Math.sin(f * 3.1) * 8 : 0;
  return (
    <AbsoluteFill style={{ background: GRAY }}>
      <div style={{ position: "absolute", left: 110, top: 720, width: 860, transform: `rotate(-2deg) scale(${pop * grow}) translateX(${shake}px)`, background: "#fff", borderRadius: 30, boxShadow: "0 24px 44px rgba(0,0,0,0.45)", padding: "40px 48px 48px", fontFamily: FREDOKA, display: "flex", flexDirection: "column", gap: 34 }}>
        <div style={{ fontSize: 50, fontWeight: 600, color: "#1c1c1c", opacity: interpolate(k, [0, 0.2], [0.6, 1]) }}>🍬 1 doce pro troll</div>
        {bar("Buff permanente", 70, "#3fbf4a", 0)}
        {bar("Nada (ele te engana)", 30, "#9a9a9a", 8)}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1420, display: "flex", justifyContent: "center", opacity: so }}>
        <div style={{ fontFamily: FREDOKA, fontWeight: 600, fontSize: 92, color: "#ffd84a", textShadow: `${stroke(6)}, 0 12px 0 ${INK}`, transform: `rotate(4deg) scale(${st})` }}>SEM DOCE = STUN ⚡</div>
      </div>
    </AbsoluteFill>
  );
};

// carimbo por cima do jogo (lane 2): bate grande, treme e assenta, ex. "SEM DOCE = STUN ⚡"
export const HWStamp: React.FC<{ life: number; text?: string; y?: number; color?: string }> = ({ life, text = "SEM DOCE = STUN ⚡", y = 380, color = "#ffd84a" }) => {
  const f = useCurrentFrame();
  const s = interpolate(f, [0, 6], [2.4, 1], { ...clamp, easing: Easing.out(Easing.back(2)) });
  const o = interpolate(f, [0, 2], [0, 1], clamp) * interpolate(f, [life - 5, life], [1, 0], clamp);
  const shake = f < 10 ? Math.sin(f * 3.1) * 10 : 0;
  return (
    <AbsoluteFill style={{ alignItems: "center", pointerEvents: "none" }}>
      <div style={{ position: "absolute", top: y, opacity: o, transform: `translateX(${shake}px) rotate(-4deg) scale(${s})`, fontFamily: FREDOKA, fontWeight: 600, fontSize: 104, color, textShadow: `${stroke(7)}, 0 14px 0 ${INK}`, whiteSpace: "nowrap" }}>{text}</div>
    </AbsoluteFill>
  );
};

// o stun (overlay, lane de cima): clarão azul, raios elétricos em volta do herói, a tela azulada piscando e as
// estrelinhas girando em cima da cabeça. x/y = onde está a cabeça do herói na tela.
const bolt = (x0: number, y0: number, a: number, len: number, seed: number) => {
  const p: string[] = [`${x0},${y0}`];
  let x = x0, y = y0;
  for (let i = 1; i <= 7; i++) {
    const r = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
    const j = (r - Math.floor(r) - 0.5) * 46;
    x = x0 + Math.cos(a) * (len * i) / 7 - Math.sin(a) * j;
    y = y0 + Math.sin(a) * (len * i) / 7 + Math.cos(a) * j;
    p.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return p.join(" ");
};
export const HWStun: React.FC<{ life: number; x?: number; y?: number }> = ({ life, x = 330, y = 900 }) => {
  const f = useCurrentFrame();
  const flash = interpolate(f, [0, 2, 7], [0, 0.85, 0], clamp);
  const zap = f < 22 ? 1 : interpolate(f, [22, 30], [1, 0], clamp);
  const out = interpolate(f, [life - 6, life], [1, 0], clamp);
  const tint = (0.28 + 0.12 * Math.sin(f * 1.7)) * zap;
  const seed = Math.floor(f / 2);
  const stars = interpolate(f, [4, 10], [0, 1], clamp) * out;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill style={{ background: "#6fd0ff", mixBlendMode: "screen", opacity: tint }} />
      <AbsoluteFill style={{ background: "#ffffff", opacity: flash }} />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <filter id="hwglow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="9" /></filter>
        </defs>
        {zap > 0
          ? Array.from({ length: 9 }).map((_, i) => {
              const a = (i / 9) * Math.PI * 2 + seed * 0.7;
              const pts = bolt(x + Math.cos(a) * 60, y + 260 + Math.sin(a) * 90, a, 260 + (i % 3) * 70, seed * 9 + i);
              return (
                <g key={i} opacity={zap * ((seed + i) % 3 === 0 ? 0.35 : 1)}>
                  <polyline points={pts} fill="none" stroke="#5fd0ff" strokeWidth={22} strokeLinejoin="round" filter="url(#hwglow)" />
                  <polyline points={pts} fill="none" stroke="#e8fbff" strokeWidth={7} strokeLinejoin="round" />
                </g>
              );
            })
          : null}
        {/* estrelinhas girando em cima da cabeça */}
        <g opacity={stars}>
          <ellipse cx={x} cy={y - 40} rx={150} ry={42} fill="none" stroke="#ffffff" strokeWidth={4} opacity={0.35} />
          {Array.from({ length: 5 }).map((_, i) => {
            const a = f / 5 + (i / 5) * Math.PI * 2;
            const sx = x + Math.cos(a) * 150, sy = y - 40 + Math.sin(a) * 42, sc = 0.75 + 0.35 * Math.sin(a);
            return (
              <g key={i} transform={`translate(${sx} ${sy}) scale(${sc}) rotate(${f * 6})`}>
                <polygon points="0,-34 9,-11 33,-10 14,5 21,29 0,15 -21,29 -14,5 -33,-10 -9,-11" fill="#ffd84a" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
              </g>
            );
          })}
        </g>
      </svg>
    </AbsoluteFill>
  );
};

// prazo do evento (carimbo, lane 1): folha de calendário que cai e quica, "ATÉ 02/11"
export const HWDate: React.FC<{ life: number; y?: number }> = ({ life, y = 300 }) => {
  const f = useCurrentFrame();
  const drop = interpolate(f, [0, 10], [-500, 0], { ...clamp, easing: Easing.out(Easing.bounce) });
  const out = interpolate(f, [life - 6, life], [1, 0], clamp);
  return (
    <AbsoluteFill style={{ alignItems: "center", pointerEvents: "none" }}>
      <div style={{ position: "absolute", top: y, transform: `translateY(${drop}px) rotate(-4deg)`, opacity: out, width: 360, borderRadius: 28, overflow: "hidden", background: "#fff", boxShadow: "0 22px 40px rgba(0,0,0,0.5)", fontFamily: FREDOKA, textAlign: "center" }}>
        <div style={{ background: ORANGE, color: "#fff", fontSize: 50, fontWeight: 600, padding: "14px 0" }}>ATÉ</div>
        <div style={{ fontSize: 150, fontWeight: 600, color: "#1c1c1c", lineHeight: 1.1, padding: "10px 0 6px" }}>02/11</div>
        <div style={{ fontSize: 40, color: "#576f76", paddingBottom: 18 }}>segunda-feira</div>
      </div>
    </AbsoluteFill>
  );
};
