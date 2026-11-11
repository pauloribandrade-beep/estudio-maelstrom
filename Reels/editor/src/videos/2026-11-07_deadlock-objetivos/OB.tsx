import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, Loop, OffthreadVideo, random, Sequence, staticFile, useCurrentFrame } from "remotion";
import { DLMapa } from "../../lib/dlmapa";
import { loadFont as loadAnton } from "@remotion/google-fonts/Anton";
import { loadFont as loadBody } from "@remotion/google-fonts/NunitoSans";
import { loadFont as loadHand } from "@remotion/google-fonts/Caveat";
import CL from "./clips.json";

// "Objetivos do mapa" (07/11/2026). Linguagem do Magia v2, que ele aprovou: material REAL (arte oficial da deadlock.wiki,
// gameplay da Valve sem HUD), identidade do próprio jogo (pôster creme com meio-tom, verde-petróleo, almas azul-água,
// carimbo de tinta). O mapa é desenhado em código com os ícones oficiais para as rotas e os objetivos acenderem na palavra.
// Zona segura do TikTok: conteúdo entre y 180 e 1290; nada importante à direita de 930 entre y 700 e 1550; legenda em 1370.
// Props terminadas em At chegam em QUADROS relativos ao início da cena (o registry converte).

const { fontFamily: POSTER } = loadAnton("normal", { weights: ["400"], subsets: ["latin", "latin-ext"] });
const { fontFamily: BODY } = loadBody("normal", { weights: ["700", "800", "900"], subsets: ["latin", "latin-ext"] });
const { fontFamily: HAND } = loadHand("normal", { weights: ["700"], subsets: ["latin", "latin-ext"] });

const R = "videos/2026-11-07_deadlock-objetivos_R/";
const FPS = 30;
const ob = (n: string) => staticFile(`${R}ob/${n}`);
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
  const v = <OffthreadVideo src={staticFile(`${R}clips/${clip}.mp4`)} muted startFrom={Math.round(ss * FPS)} playbackRate={rate} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: pos, ...style }} />;
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

// ========== 1) gameplay com soco (entra com flash, socos de zoom nas palavras fortes) ==========
export const OBPunch: React.FC<{ life: number; clip: string; ss?: number; rate?: number; pos?: string; punchS?: number[]; z1?: number; gray?: number }> = ({ life, clip, ss, rate, pos, punchS = [], z1 = 1.07, gray = 0 }) => {
  const f = useCurrentFrame();
  const punch = punchS.map((s) => Math.round(s * FPS));
  const k = interpolate(f, [0, 6], [0.16, 0], { ...clamp, easing: Easing.out(Easing.cubic) });
  const blur = interpolate(f, [0, 5], [10, 0], clamp);
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
      <Vignette o={0.45} />
      <Grain o={0.06} />
      <AbsoluteFill style={{ background: "#fff", opacity: fl(f, 0, 4, 0.45), pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};

// ========== 2) gancho (v2, 07/11: "a abertura inicial tá muito ruim… só um ponto de interrogação na frente") ==========
// O novato no meio da briga: o marcador VOCÊ (o mesmo do mapa) cai no gameplay → as interrogações rodam em volta dele →
// "todo mundo brigando" racha a tela em 4 brigas com chamadas → "fica aqui" puxa tudo para o NOSSO mapa, a rota acende até
// o Patrono deles ("o objetivo do jogo") → "em um minuto": carimbo 1 MINUTO, risca e vira 2 MINUTOS (o vídeo tem 2, kkk).
const FIGHTS: { clip: string; ss: number; q: string; px: number; py: number }[] = [
  { clip: "hk1", ss: 3, q: "QUEM É QUEM?", px: 0.55, py: 0.45 },
  { clip: "walker", ss: 6, q: "QUE ROBÔ É ESSE?", px: 0.4, py: 0.5 },
  { clip: "base_guard", ss: 2, q: "ATACO O QUÊ?", px: 0.5, py: 0.5 },
  { clip: "midboss", ss: 4, q: "PRA ONDE EU VOU?", px: 0.5, py: 0.45 },
];
const YouDot: React.FC<{ f: number; at: number; x: number; y: number; lost: number; s?: number }> = ({ f, at, x, y, lost, s = 1 }) => {
  if (f < at) return null;
  const drop = interpolate(f, [at, at + 8], [-260, 0], { ...clamp, easing: Easing.in(Easing.quad) });
  const sq = f >= at + 8 && f < at + 13 ? 1 - 0.25 * Math.sin(((f - at - 8) / 5) * Math.PI) : 1;
  const wob = lost * Math.sin(f / 3) * 8;
  return (
    <div style={{ position: "absolute", left: x - 40 + wob, top: y - 40 + drop, width: 80, height: 80, transform: `scale(${s})` }}>
      <div style={{ position: "absolute", inset: -26, borderRadius: "50%", border: `4px solid ${SOUL}`, opacity: 1 - ((f - at) % 26) / 26, transform: `scale(${1 + ((f - at) % 26) / 26})` }} />
      <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: SOUL, border: `7px solid ${INK}`, boxShadow: `0 0 40px ${SOUL}`, transform: `scale(${1 / sq}, ${sq})` }} />
      <div style={{ position: "absolute", left: -80, width: 240, top: -62, textAlign: "center", fontFamily: BODY, fontWeight: 900, fontSize: 38, letterSpacing: 6, color: SOUL, textShadow: "0 3px 12px #000" }}>VOCÊ</div>
      {lost > 0
        ? [0, 1, 2].map((i) => {
            const a = f / 9 + (i * Math.PI * 2) / 3;
            return (
              <div key={i} style={{ position: "absolute", left: 40 + Math.cos(a) * 120 - 30, top: 40 + Math.sin(a) * 70 - 50, width: 60, textAlign: "center", fontFamily: POSTER, fontSize: 84, color: i === 1 ? STAMP : CREAM,
                opacity: lost, transform: `scale(${0.8 + 0.25 * Math.sin(f / 4 + i)}) rotate(${Math.sin(f / 6 + i) * 18}deg)`, textShadow: "0 4px 14px #000" }}>?</div>
            );
          })
        : null}
    </div>
  );
};
export const OBHook: React.FC<{ life: number; newAt?: number; lostAt?: number; allAt?: number; fightAt?: number; stayAt?: number; goalAt?: number; minAt?: number; twoAt?: number }> = ({
  life, newAt = 25, lostAt = 52, allAt = 80, fightAt = 99, stayAt = 125, goalAt = 172, minAt = 201, twoAt = 214,
}) => {
  const f = useCurrentFrame();
  const fixAt = Math.round((minAt + twoAt) / 2);
  // fase 1: gameplay cheio com o VOCÊ caindo
  const z1 = 1.05 + interpolate(f, [0, allAt], [0, 0.08], clamp) + punchZ(f, [newAt + 8], 0.06, 9);
  const lost = ease(f, lostAt, 10);
  // fase 2: mosaico de 4 brigas
  const mosaic = f >= allAt;
  const out = ease(f, stayAt, 14);
  const cells = FIGHTS.map((c, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    return { ...c, x: col * 543, y: 180 + row * 558, w: 537, h: 552, at: allAt + i * 4 };
  });
  const map = f >= stayAt - 2;
  const dotXY =
    f < allAt
      ? { x: 540, y: 1000 }
      : f < stayAt
        ? { x: 540, y: interpolate(f, [allAt, allAt + 10], [1000, 735], { ...clamp, easing: Easing.out(Easing.cubic) }) }
        : { x: interpolate(f, [stayAt, stayAt + 14], [540, 484], { ...clamp, easing: Easing.inOut(Easing.cubic) }), y: interpolate(f, [stayAt, stayAt + 14], [735, 1109], { ...clamp, easing: Easing.inOut(Easing.cubic) }) };
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      {/* o nosso mapa por baixo (aparece no "fica aqui") */}
      {map ? (
        <Sequence from={stayAt - 2} layout="none">
          <DLMapa life={life - stayAt + 2} intro cam={[{ at: 0, x: 251, y: 290, z: 0.95 }, { at: goalAt - stayAt, x: 251, y: 270, z: 1.02, dur: 30 }]}
            you="a.P"
            marks={[
              { kind: "route", at: goalAt - stayAt + 2, ids: ["a.P", "a.bM", "a.wM", "a.gM", "e.gM", "e.wM", "e.bM", "e.P"], dur: 22 },
              { kind: "ring", at: goalAt - stayAt + 20, ids: ["e.P"], c: STAMP },
              { kind: "tag", at: goalAt - stayAt + 4, id: "e.P", text: "O OBJETIVO", sub: "DESTRUIR O PATRONO DELES", img: "Patron.png", side: "b", endAt: minAt - stayAt + 2 },
            ]} />
        </Sequence>
      ) : null}
      {/* fase 1: gameplay cheio */}
      {f < allAt + 12 ? (
        <AbsoluteFill style={{ transform: `scale(${z1})`, filter: `brightness(${0.85 - lost * 0.25}) saturate(${1 - lost * 0.3})` }}>
          <Clip clip="shrine_a" ss={14} life={life} />
        </AbsoluteFill>
      ) : null}
      {f < allAt ? (
        <>
          <Vignette o={0.55} />
          {f >= newAt ? (
            <div style={{ position: "absolute", left: 0, right: 0, top: 210, display: "flex", justifyContent: "center", transform: `translateY(${(1 - back(f, newAt, 12, 1.4)) * -120}px)` }}>
              <div style={{ background: "rgba(8,14,14,0.88)", border: `3px solid ${SOUL}`, borderRadius: 16, padding: "14px 34px", display: "flex", alignItems: "center", gap: 20, boxShadow: `0 0 30px ${SOUL}55` }}>
                <Img src={ob("dl_logo.png")} style={{ height: 54 }} />
                <div style={{ width: 3, height: 54, background: `${CREAM}55` }} />
                <div>
                  <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 24, letterSpacing: 6, color: SOUL }}>NOVO JOGADOR</div>
                  <div style={{ fontFamily: POSTER, fontSize: 44, color: CREAM, lineHeight: 1 }}>0 HORAS DE JOGO</div>
                </div>
              </div>
            </div>
          ) : null}
        </>
      ) : null}
      {/* fase 2: a tela racha em 4 brigas */}
      {mosaic && out < 1
        ? cells.map((c, i) => {
            if (f < c.at) return null;
            const e = interpolate(f, [c.at, c.at + 6], [1.35, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
            const dx = (c.x + c.w / 2 - 540) * out * 1.6, dy = (c.y + c.h / 2 - 735) * out * 1.6;
            const sh = shake(f, c.at + 6, 10, 7, `mz${i}`);
            const qT = fightAt + i * 5;
            const ax = c.w * c.px, ay = c.h * c.py;
            const lx = i % 2 ? 40 : c.w - 40 - 330, ly = Math.floor(i / 2) ? c.h - 120 : 40;
            return (
              <div key={c.clip} style={{ position: "absolute", left: c.x + dx + sh.x, top: c.y + dy + sh.y, width: c.w, height: c.h, overflow: "hidden", transform: `scale(${e * (1 - out * 0.5)})`, opacity: 1 - out,
                border: `5px solid ${INK}`, background: "#000" }}>
                <AbsoluteFill style={{ transform: `scale(${1.15 + interpolate(f, [c.at, stayAt + 14], [0, 0.08], clamp)})` }}>
                  <Clip clip={c.clip} ss={c.ss} life={stayAt - c.at + 20} />
                </AbsoluteFill>
                <AbsoluteFill style={{ background: "#fff", opacity: fl(f, c.at, c.at + 5, 0.55) }} />
                {f >= qT ? (
                  <>
                    <svg width={c.w} height={c.h} style={{ position: "absolute", inset: 0 }}>
                      <circle cx={ax} cy={ay} r={18 + 4 * Math.sin(f / 4)} fill="none" stroke={STAMP} strokeWidth={5} />
                      <line x1={ax} y1={ay} x2={ax + (lx + 165 - ax) * ease(f, qT, 6)} y2={ay + (ly + 40 - ay) * ease(f, qT, 6)} stroke={CREAM} strokeWidth={4} />
                    </svg>
                    <div style={{ position: "absolute", left: lx, top: ly, width: 330, padding: "10px 0", textAlign: "center", background: "rgba(8,14,14,0.9)", border: `3px solid ${CREAM}`, borderRadius: 12,
                      fontFamily: POSTER, fontSize: 40, color: CREAM, transform: `scale(${back(f, qT + 3, 8, 2)})` }}>{c.q}</div>
                  </>
                ) : null}
              </div>
            );
          })
        : null}
      {/* o novato (some quando o "você" do mapa assume, na base) */}
      {f < stayAt + 14 ? <YouDot f={f} at={newAt} x={dotXY.x} y={dotXY.y} lost={f < stayAt ? lost : 1 - ease(f, stayAt, 8)} s={f >= allAt && f < stayAt ? 1.15 : 1} /> : null}
      {/* 1 MINUTO → risca → 2 MINUTOS (fundo escurece para a piada ler sozinha) */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 80% 45% at 50% 40%, rgba(5,10,9,0.88) 0%, rgba(5,10,9,0.55) 100%)", opacity: ease(f, minAt - 3, 6), pointerEvents: "none" }} />
      {f >= minAt ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 520, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ position: "relative", transform: `translateX(${-ease(f, twoAt, 8) * 150}px) scale(${1 - ease(f, twoAt, 8) * 0.35})`, opacity: 1 - ease(f, twoAt, 8) * 0.3 }}>
            <Stamp text="1 MINUTO" at={minAt} size={92} rot={-4} c={CREAM} />
            {f >= fixAt ? (
              <svg width={520} height={160} style={{ position: "absolute", left: "50%", top: "50%", marginLeft: -260, marginTop: -80 }}>
                <path d="M20 120 L500 40" stroke={STAMP} strokeWidth={16} strokeLinecap="round" strokeDasharray="500" strokeDashoffset={500 - ease(f, fixAt, 5) * 500} />
              </svg>
            ) : null}
          </div>
          {f >= twoAt ? (
            <div style={{ position: "absolute", top: 70, left: 0, right: 0, display: "flex", justifyContent: "center", transform: "translateX(90px)" }}>
              <Stamp text="2 MINUTOS" at={twoAt} size={104} rot={5} />
            </div>
          ) : null}
        </div>
      ) : null}
      <Hand at={twoAt + 6} x={90} y={840} size={66} c={CREAM} rot={-4} w={900} center>(na real, 2… kkkk)</Hand>
      <Grain o={0.07} />
      <AbsoluteFill style={{ background: "#fff", opacity: fl(f, allAt, allAt + 5, 0.3) + fl(f, stayAt, stayAt + 6, 0.25), pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};


// ========== 3) logo oficial do Deadlock batendo por cima do gameplay ==========
export const OBLogo: React.FC<{ life: number; clip?: string; ss?: number; slamAt?: number }> = ({ life, clip = "hk1", ss = 2, slamAt = 4 }) => {
  const f = useCurrentFrame();
  const z = 1 + punchZ(f, [slamAt + 5], 0.08, 10) + interpolate(f, [0, life], [0, 0.06], clamp);
  const s = interpolate(f, [slamAt, slamAt + 5], [2.6, 1], { ...clamp, easing: Easing.in(Easing.quad) }) + interpolate(f, [slamAt + 5, slamAt + 60], [0, 0.05], clamp);
  const sh = shake(f, slamAt + 5, 16, 10, "lg");
  const sw = interpolate(f, [slamAt + 6, slamAt + 26], [-0.6, 1.6], clamp);
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${z * 1.12})`, filter: "blur(3px) brightness(0.5)" }}>
        <Clip clip={clip} ss={ss} life={life} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 70% 40% at 50% 38%, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 70%)" }} />
      {f >= slamAt ? (
        <div style={{ position: "absolute", left: 110, top: 560, width: 860, transform: `translate(${sh.x}px, ${sh.y}px) rotate(${sh.r}deg) scale(${s})`, opacity: interpolate(f, [slamAt, slamAt + 2], [0, 1], clamp) }}>
          <Img src={ob("dl_logo.png")} style={{ width: 860, filter: `drop-shadow(0 12px 40px rgba(0,0,0,0.8)) drop-shadow(0 0 30px ${SOUL}66)` }} />
          <div style={{ position: "absolute", inset: 0, WebkitMaskImage: `url(${ob("dl_logo.png")})`, WebkitMaskSize: "100% 100%",
            background: `linear-gradient(105deg, rgba(255,255,255,0) ${sw * 100 - 18}%, rgba(255,255,255,0.85) ${sw * 100}%, rgba(255,255,255,0) ${sw * 100 + 18}%)` }} />
        </div>
      ) : null}
      <Hand at={slamAt + 22} x={90} y={860} size={62} c={CREAM} rot={-3} w={900} center>a história, em grande resumo</Hand>
      <Vignette o={0.6} />
      <Grain />
      <AbsoluteFill style={{ background: "#fff", opacity: fl(f, slamAt + 5, slamAt + 10, 0.5), pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};

// ========== 4) os dois Patronos: fenda de outra dimensão → máscara → Hidden King (âmbar, esquerda) × Archmother (safira, direita) ==========
export const OBPatrons: React.FC<{ life: number; patAt?: number; hkAt?: number; fodaAt?: number; amAt?: number; buroAt?: number }> = ({ life, patAt = 40, hkAt = 120, fodaAt = 160, amAt = 230, buroAt = 280 }) => {
  const f = useCurrentFrame();
  const rift = ease(f, 0, 30);
  const mask = back(f, patAt, 14, 1.4);
  const maskOut = 1 - ease(f, hkAt - 6, 10);
  const hk = ease(f, hkAt, 14);
  const am = ease(f, amAt, 14);
  const split = f >= amAt ? 540 : 1080;
  return (
    <Paper tint="#1b1530">
      {/* fenda: rasgo de luz vertical, a "outra dimensão" */}
      <div style={{ position: "absolute", left: 540 - 60 * rift, top: 120, width: 120 * rift, height: 1300, background: `radial-gradient(ellipse 50% 50% at 50% 50%, #fff 0%, ${SOUL} 25%, rgba(95,242,214,0) 70%)`, filter: "blur(8px)", opacity: 0.55 * maskOut + 0.15 }} />
      <Souls n={22} o={0.6} speed={0.8} />
      {/* máscara oficial dos Patronos */}
      {f >= patAt && maskOut > 0 ? (
        <div style={{ position: "absolute", left: 540 - 300, top: 330, width: 600, height: 600, transform: `scale(${mask * (1 + 0.04 * Math.sin(f / 12))})`, opacity: maskOut, filter: `drop-shadow(0 0 60px ${SOUL}aa)` }}>
          <Img src={ob("Patron.png")} style={{ width: 600, height: 600, objectFit: "contain" }} />
        </div>
      ) : null}
      {f >= patAt && maskOut > 0 ? <Title at={patAt + 6} y={980} size={130} sub="DOIS DEUSES ANTIGOS">OS PATRONOS</Title> : null}
      {/* Hidden King */}
      {f >= hkAt ? (
        <div style={{ position: "absolute", left: 0, top: 0, width: split, height: 1920, overflow: "hidden", transition: "none" }}>
          <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 80% 55% at ${f >= amAt ? 50 : 50}% 40%, ${AMBER}55 0%, rgba(0,0,0,0) 70%)` }} />
          <Img src={ob("Hidden_King_model.png")} style={{ position: "absolute", left: (f >= amAt ? 270 : 540) - 330, top: 200 + (1 - hk) * 120, height: 960, width: 660, objectFit: "contain", opacity: hk,
            filter: `drop-shadow(0 0 50px ${AMBER}88)`, transform: `scale(${1 + interpolate(f, [hkAt, life], [0, 0.05], clamp)})` }} />
          <div style={{ position: "absolute", left: 0, width: split, top: 1150, textAlign: "center", fontFamily: POSTER, fontSize: f >= amAt ? 76 : 110, color: AMBER, letterSpacing: 2, opacity: hk, textShadow: "0 6px 24px #000" }}>HIDDEN KING</div>
        </div>
      ) : null}
      <Hand at={fodaAt} x={f >= amAt ? 40 : 120} y={f >= amAt ? 270 : 300} size={f >= amAt ? 54 : 72} c={AMBER} rot={-6} w={f >= amAt ? 470 : 840}>o mais foda de todos ★</Hand>
      {/* Archmother */}
      {f >= amAt ? (
        <div style={{ position: "absolute", left: 540, top: 0, width: 540, height: 1920, overflow: "hidden", borderLeft: `6px solid ${CREAM}`, background: `linear-gradient(180deg, #0c1a33 0%, ${INK} 80%)`,
          clipPath: `inset(0 0 0 ${(1 - am) * 100}%)` }}>
          <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 80% 55% at 50% 40%, ${SAPPH}55 0%, rgba(0,0,0,0) 70%)` }} />
          <Img src={ob("Archmother_model.png")} style={{ position: "absolute", left: 270 - 330, top: 200, height: 960, width: 660, objectFit: "contain", filter: `drop-shadow(0 0 50px ${SAPPH}88) ${f >= buroAt ? "grayscale(0.5)" : ""}` }} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 1150, textAlign: "center", fontFamily: POSTER, fontSize: 76, color: SAPPH, letterSpacing: 2, textShadow: "0 6px 24px #000" }}>ARCHMOTHER</div>
          {/* papelada voando: a burocrata */}
          {f >= buroAt
            ? Array.from({ length: 7 }).map((_, i) => {
                const t = f - buroAt - i * 3;
                if (t < 0) return null;
                const x = 40 + random(`px${i}`) * 380 + t * (random(`pv${i}`) - 0.5) * 6;
                const y = 1000 - t * (8 + random(`pu${i}`) * 6) + t * t * 0.12;
                return <div key={i} style={{ position: "absolute", left: x, top: y, width: 90, height: 118, background: CREAM, transform: `rotate(${t * (random(`pr${i}`) - 0.5) * 14}deg)`, boxShadow: "0 6px 14px rgba(0,0,0,0.5)",
                  backgroundImage: "repeating-linear-gradient(180deg, transparent 0 16px, #9a8f78 16px 18px)", backgroundSize: "70px 100%", backgroundPosition: "10px 14px", backgroundRepeat: "no-repeat" }} />;
              })
            : null}
          <div style={{ position: "absolute", left: 0, right: 0, top: 560, display: "flex", justifyContent: "center" }}>
            <Stamp text="BUROCRATA" at={buroAt + 4} size={50} rot={-12} />
          </div>
        </div>
      ) : null}
      <AbsoluteFill style={{ background: "#fff", opacity: fl(f, hkAt, hkAt + 6, 0.35) + fl(f, amAt, amAt + 6, 0.35), pointerEvents: "none" }} />
    </Paper>
  );
};

// ========== 5) o ritual: querem entrar no nosso mundo → recrutam heróis (cartas) → círculo do ritual → máscara inimiga racha ==========
const CARDS = ["Rat_King_card.png", "Celeste_card.png", "Baba_card.png", "Apollo_card.png"];
export const OBRitual: React.FC<{ life: number; heroAt?: number; ritAt?: number; killAt?: number }> = ({ life, heroAt = 90, ritAt = 160, killAt = 260 }) => {
  const f = useCurrentFrame();
  const city = interpolate(f, [0, life], [1.05, 1.15], clamp);
  const circ = interpolate(f, [ritAt, ritAt + 40], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const crack = ease(f, killAt + 4, 8);
  const shatter = f >= killAt + 26;
  const sh = shake(f, killAt + 4, 18, 12, "rk");
  return (
    <AbsoluteFill style={{ background: INK, overflow: "hidden" }}>
      {/* a cidade (arte oficial) com a fenda da outra dimensão em cima */}
      <AbsoluteFill style={{ transform: `scale(${city})` }}>
        <Img src={ob("Patron_VisualNovel_Art.png")} style={{ position: "absolute", left: -900, top: 0, height: 1920, width: 2880, objectFit: "cover", filter: "brightness(0.55) saturate(1.1)" }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: `linear-gradient(180deg, rgba(11,20,18,0.2) 0%, rgba(11,20,18,0.85) 75%)` }} />
      <Souls n={16} o={0.6} />
      {f < heroAt ? <Title at={6} y={250} size={104} sub="QUEREM ENTRAR AQUI">NO NOSSO MUNDO</Title> : null}
      {/* heróis recrutados: cartas abrindo em leque */}
      {f >= heroAt && f < ritAt + 12
        ? CARDS.map((c, i) => {
            const e = back(f, heroAt + i * 6, 12, 1.4) * (1 - ease(f, ritAt, 10));
            const ang = (i - 1.5) * 13 * e;
            return (
              <div key={c} style={{ position: "absolute", left: 540 - 140, top: 330, width: 280, height: 400, transformOrigin: "50% 160%", transform: `rotate(${ang}deg) translateY(${(1 - e) * 600}px)`, opacity: Math.min(1, e * 1.5),
                borderRadius: 14, overflow: "hidden", border: `5px solid ${CREAM}`, boxShadow: "0 18px 40px rgba(0,0,0,0.7)" }}>
                <Img src={ob(c)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            );
          })
        : null}
      {f >= heroAt && f < ritAt ? <Hand at={heroAt + 20} x={90} y={860} size={60} c={CREAM} center w={900}>os seguidores recrutam heróis</Hand> : null}
      {/* círculo do ritual desenhando por baixo */}
      {f >= ritAt ? (
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
          <g transform="translate(540 760)" opacity={f >= killAt + 26 ? 0.5 : 1}>
            <circle r={380} fill="none" stroke={SOUL} strokeWidth={6} strokeDasharray={`${circ * 2388} 2388`} transform="rotate(-90)" />
            <circle r={330} fill="none" stroke={SOUL} strokeWidth={3} strokeDasharray={`${circ * 2073} 2073`} transform="rotate(90)" opacity={0.7} />
            {Array.from({ length: 6 }).map((_, i) => {
              const a = (i / 6) * Math.PI * 2 + f / 90;
              const o = interpolate(circ, [i / 6, i / 6 + 0.15], [0, 1], clamp);
              return <polygon key={i} points="0,-24 21,12 -21,12" fill="none" stroke={CREAM} strokeWidth={4} transform={`translate(${Math.cos(a) * 355} ${Math.sin(a) * 355}) rotate(${(a * 180) / Math.PI + 90})`} opacity={o} />;
            })}
            <polygon points="0,-330 286,165 -286,165" fill="none" stroke={SOUL} strokeWidth={3} opacity={circ * 0.6} />
            <polygon points="0,330 286,-165 -286,-165" fill="none" stroke={SOUL} strokeWidth={3} opacity={circ * 0.6} />
          </g>
        </svg>
      ) : null}
      {f >= ritAt && f < killAt ? <Title at={ritAt + 10} y={1170} size={96} c={SOUL}>O RITUAL</Title> : null}
      {/* a máscara do patrono inimigo no meio do círculo: racha e estilhaça */}
      {f >= ritAt ? (
        <div style={{ position: "absolute", left: 540 - 220, top: 760 - 220, width: 440, height: 440, transform: `translate(${sh.x}px, ${sh.y}px) scale(${back(f, ritAt + 20, 14, 1.4)})` }}>
          {!shatter ? (
            <>
              <Img src={ob("Patron.png")} style={{ width: 440, height: 440, objectFit: "contain", filter: `drop-shadow(0 0 40px ${STAMP}aa) ${f >= killAt ? "sepia(0.6) hue-rotate(-30deg) saturate(2)" : ""}` }} />
              {crack > 0 ? (
                <svg width={440} height={440} style={{ position: "absolute", inset: 0 }}>
                  <path d="M220 60 L200 150 L240 200 L190 280 L230 340 L210 420" fill="none" stroke="#fff" strokeWidth={7} strokeDasharray="600" strokeDashoffset={600 - crack * 600} style={{ filter: "drop-shadow(0 0 10px #fff)" }} />
                  <path d="M240 200 L320 230 L360 300" fill="none" stroke="#fff" strokeWidth={5} strokeDasharray="300" strokeDashoffset={300 - crack * 300} />
                  <path d="M190 280 L110 300 L80 260" fill="none" stroke="#fff" strokeWidth={5} strokeDasharray="300" strokeDashoffset={300 - crack * 300} />
                </svg>
              ) : null}
            </>
          ) : (
            Array.from({ length: 9 }).map((_, i) => {
              const t = f - killAt - 26;
              const a = (i / 9) * Math.PI * 2 + random(`sa${i}`);
              const d = t * (14 + random(`sd${i}`) * 10);
              return <div key={i} style={{ position: "absolute", left: 220 + Math.cos(a) * d - 60, top: 220 + Math.sin(a) * d - 60 + t * t * 0.6, width: 120, height: 120, overflow: "hidden",
                clipPath: `polygon(50% 0%, ${60 + random(`c1${i}`) * 40}% ${30 + random(`c2${i}`) * 40}%, ${random(`c3${i}`) * 40}% 100%)`, transform: `rotate(${t * (random(`sr${i}`) - 0.5) * 30}deg)`, opacity: interpolate(t, [10, 24], [1, 0], clamp) }}>
                <Img src={ob("Patron.png")} style={{ position: "absolute", left: -(220 - 60), top: -(220 - 60), width: 440, height: 440 }} />
              </div>;
            })
          )}
        </div>
      ) : null}
      {f >= killAt ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 1150, display: "flex", justifyContent: "center" }}>
          <Stamp text="DESTRUIR O PATRONO" at={killAt + 26} size={78} rot={-5} sub="DO TIME INIMIGO" />
        </div>
      ) : null}
      <Grain />
      <AbsoluteFill style={{ background: "#fff", opacity: fl(f, killAt + 26, killAt + 32, 0.6), pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};

// ========== 6) o mapa: desenhado em código, com os ícones oficiais. Base âmbar embaixo, safira em cima, três rotas. ==========
// Coordenadas do mapa (centro 540, 760; raio ~470). Rotas: esquerda, meio, direita, da base de baixo até a de cima.
type P = [number, number];
const LANES: P[][] = [
  [[540, 1215], [330, 1080], [230, 880], [230, 640], [330, 440], [540, 305]],
  [[540, 1215], [540, 1060], [540, 760], [540, 460], [540, 305]],
  [[540, 1215], [750, 1080], [850, 880], [850, 640], [750, 440], [540, 305]],
];
const pathD = (pts: P[]) => pts.map((p, i) => `${i ? "L" : "M"}${p[0]} ${p[1]}`).join(" ");
const lenOf = (pts: P[]) => pts.slice(1).reduce((s, p, i) => s + Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]), 0);
// pontos dos objetivos do time de CIMA (o inimigo), de fora pra dentro
const ENEMY = {
  guard: [[300, 560], [540, 560], [780, 560]] as P[],
  walk: [[370, 410], [540, 430], [710, 410]] as P[],
  shrine: [[465, 360], [615, 360]] as P[],
  patron: [540, 290] as P,
};
const Icon: React.FC<{ src: string; x: number; y: number; at: number; s?: number; ring?: string; done?: boolean; f: number }> = ({ src, x, y, at, s = 92, ring = SAPPH, done, f }) => {
  if (f < at) return null;
  const e = back(f, at, 10, 2);
  return (
    <div style={{ position: "absolute", left: x - s / 2, top: y - s / 2, width: s, height: s, transform: `scale(${e})`, borderRadius: "50%", background: "rgba(8,14,14,0.92)", border: `5px solid ${done ? SOUL : ring}`,
      boxShadow: `0 0 ${18 + 10 * Math.sin(f / 7)}px ${done ? SOUL : ring}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Img src={ob(src)} style={{ width: s * 0.82, height: s * 0.82, objectFit: "contain" }} />
      {done ? <div style={{ position: "absolute", right: -10, top: -10, width: 40, height: 40, borderRadius: "50%", background: SOUL, color: INK, fontFamily: BODY, fontWeight: 900, fontSize: 30, display: "flex", alignItems: "center", justifyContent: "center" }}>✓</div> : null}
    </div>
  );
};
export const OBMap: React.FC<{ life: number; goalAt?: number; lanesAt?: number; guardAt?: number; walkAt?: number; baseAt?: number; shrineAt?: number; patAt?: number; recap?: boolean; title?: string }> = ({
  life, goalAt = 9999, lanesAt = 9999, guardAt = 9999, walkAt = 9999, baseAt = 9999, shrineAt = 9999, patAt = 9999, recap = false, title,
}) => {
  const f = useCurrentFrame();
  const appear = back(f, 0, 14, 1.2);
  const goal = interpolate(f, [goalAt, goalAt + 30], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const lanes = interpolate(f, [lanesAt, lanesAt + 24], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const z = 1 + interpolate(f, [0, life], [0, 0.04], clamp) + punchZ(f, [guardAt, walkAt, baseAt, shrineAt, patAt].filter((x) => x < 9000), 0.03, 8);
  const mid = LANES[1];
  const ml = lenOf(mid);
  const tick = (at: number) => recap && f >= at;
  return (
    <Paper>
      {title ? <Title at={2} y={190} size={84} c={CREAM}>{title}</Title> : null}
      <div style={{ position: "absolute", inset: 0, transform: `scale(${z * appear})`, transformOrigin: "540px 760px" }}>
        {/* disco do mapa com a planta oficial bem apagada */}
        <div style={{ position: "absolute", left: 540 - 480, top: 760 - 480, width: 960, height: 960, borderRadius: "50%", overflow: "hidden", border: `6px solid ${CREAM}55`, background: "#141a18" }}>
          <Img src={ob("Map_buildings.png")} style={{ width: 960, height: 960, objectFit: "cover", opacity: 0.22, filter: "grayscale(1) contrast(1.3)" }} />
          <Halftone c="#000" o={0.25} size={10} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 300, background: `linear-gradient(180deg, ${SAPPH}33, rgba(0,0,0,0))` }} />
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 300, background: `linear-gradient(0deg, ${AMBER}33, rgba(0,0,0,0))` }} />
        </div>
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
          {LANES.map((pts, i) => {
            const L = lenOf(pts);
            return (
              <g key={i}>
                <path d={pathD(pts)} fill="none" stroke={CREAM} strokeOpacity={0.18} strokeWidth={26} strokeLinejoin="round" strokeLinecap="round" />
                <path d={pathD(pts)} fill="none" stroke={[AMBER, CREAM, SAPPH][i]} strokeWidth={14} strokeLinejoin="round" strokeLinecap="round" strokeDasharray={`${lanes * L} ${L}`} style={{ filter: `drop-shadow(0 0 10px ${[AMBER, CREAM, SAPPH][i]})` }} />
              </g>
            );
          })}
          {/* a sua rota até o patrono deles */}
          {goal > 0 ? <path d={pathD(mid)} fill="none" stroke={SOUL} strokeWidth={10} strokeDasharray={`${goal * ml} ${ml}`} strokeLinecap="round" style={{ filter: `drop-shadow(0 0 14px ${SOUL})` }} /> : null}
        </svg>
        {goal > 0 && goal < 1 ? (() => {
          // bolinha "você" andando pela rota do meio
          const d = goal * ml;
          let acc = 0, x = mid[0][0], y = mid[0][1];
          for (let i = 1; i < mid.length; i++) {
            const seg = Math.hypot(mid[i][0] - mid[i - 1][0], mid[i][1] - mid[i - 1][1]);
            if (acc + seg >= d) { const t = (d - acc) / seg; x = mid[i - 1][0] + (mid[i][0] - mid[i - 1][0]) * t; y = mid[i - 1][1] + (mid[i][1] - mid[i - 1][1]) * t; break; }
            acc += seg;
          }
          return <div style={{ position: "absolute", left: x - 26, top: y - 26, width: 52, height: 52, borderRadius: "50%", background: SOUL, border: `5px solid ${INK}`, boxShadow: `0 0 30px ${SOUL}` }} />;
        })() : null}
        {/* sua base (embaixo) e o patrono deles (em cima) */}
        <Icon f={f} src="Hidden_King_alt_icon.png" x={540} y={1230} at={0} s={110} ring={AMBER} />
        {ENEMY.guard.map((p, i) => <Icon key={`g${i}`} f={f} src="Guardian.png" x={p[0]} y={p[1]} at={guardAt + i * 4} s={88} done={tick(guardAt + 12)} />)}
        {ENEMY.walk.map((p, i) => <Icon key={`w${i}`} f={f} src="Walker_Icon.png" x={p[0]} y={p[1]} at={walkAt + i * 4} s={84} done={tick(walkAt + 12)} />)}
        {ENEMY.shrine.map((p, i) => <Icon key={`s${i}`} f={f} src="Shrine_Icon.png" x={p[0]} y={p[1]} at={shrineAt + i * 4} s={78} done={tick(shrineAt + 12)} />)}
        {f >= baseAt ? (
          <div style={{ position: "absolute", left: 540 - 190, top: 245, width: 380, height: 160, borderRadius: 80, border: `5px dashed ${tick(baseAt + 12) ? SOUL : SAPPH}`, opacity: ease(f, baseAt, 8), transform: `scale(${back(f, baseAt, 10, 1.6)})` }} />
        ) : null}
        <Icon f={f} src="Archmother_alt_icon.png" x={ENEMY.patron[0]} y={ENEMY.patron[1]} at={Math.min(patAt, goalAt)} s={120} ring={STAMP} done={tick(patAt + 12)} />
      </div>
      {/* rótulos à mão, fora da coluna de botões do TikTok */}
      {!recap ? (
        <>
          {f >= goalAt && f < lanesAt ? <Hand at={goalAt + 8} x={60} y={1290} size={60} c={SOUL} rot={-2} w={860}>você ↗ o patrono deles</Hand> : null}
          {f >= lanesAt && f < guardAt ? <Hand at={lanesAt + 6} x={60} y={1290} size={64} c={CREAM} rot={-2} w={860}>3 rotas</Hand> : null}
        </>
      ) : null}
    </Paper>
  );
};

// ========== 7) o Guardião: o de hoje em ação + o antigo, que falava e tinha nome (tiraram) ==========
export const OBGuardian: React.FC<{ life: number; oldAt?: number; talkAt?: number; nameAt?: number; cutAt?: number; likeAt?: number }> = ({ life, oldAt = 40, talkAt = 70, nameAt = 110, cutAt = 140, likeAt = 190 }) => {
  const f = useCurrentFrame();
  const old = f >= oldAt;
  const bub = back(f, talkAt, 10, 1.6);
  const wave = (i: number) => 18 + Math.abs(Math.sin((f + i * 7) / 3.2)) * (f < cutAt ? 46 : 4);
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      {/* metade de cima: o Guardião de hoje, em jogo */}
      <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: old ? 700 : 1920, overflow: "hidden", transition: "none" }}>
        <AbsoluteFill style={{ transform: `scale(${1.05 + punchZ(f, [0], 0.12, 9) + interpolate(f, [0, life], [0, 0.06], clamp)})` }}>
          <Clip clip="guardian" ss={0} life={life} pos="45% 50%" />
        </AbsoluteFill>
        <Vignette o={0.4} />
        {!old ? <Title at={6} y={1050} size={130} c={CREAM}>O GUARDIÃO</Title> : null}
      </div>
      {/* metade de baixo: o Guardião antigo (arte oficial da época) */}
      {old ? (
        <div style={{ position: "absolute", left: 0, top: 700, width: 1080, height: 1220, background: `radial-gradient(ellipse 80% 60% at 50% 35%, ${TEAL} 0%, ${INK} 80%)`, borderTop: `6px solid ${CREAM}`, clipPath: `inset(${(1 - ease(f, oldAt, 10)) * 100}% 0 0 0)` }}>
          <Halftone o={0.2} />
          <div style={{ position: "absolute", left: 60, top: 40, width: 420, height: 520, borderRadius: 18, overflow: "hidden", border: `6px solid ${CREAM}`, transform: "rotate(-3deg)", boxShadow: "0 18px 40px rgba(0,0,0,0.7)",
            filter: f >= cutAt ? "grayscale(1) brightness(0.8)" : "none" }}>
            <Img src={ob("Sapphire_Guardian_vs_Trooper.png")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.65)", color: CREAM, fontFamily: BODY, fontWeight: 900, fontSize: 30, letterSpacing: 4, textAlign: "center", padding: "6px 0" }}>VERSÃO ANTIGA</div>
          </div>
          {/* balão de fala com a onda de voz */}
          {f >= talkAt ? (
            <div style={{ position: "absolute", left: 500, top: 60, width: 400, height: 190, transform: `scale(${bub})`, transformOrigin: "0% 100%" }}>
              <div style={{ position: "absolute", inset: 0, background: CREAM, borderRadius: 40, boxShadow: "0 12px 30px rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                {Array.from({ length: 11 }).map((_, i) => <div key={i} style={{ width: 16, height: wave(i), borderRadius: 8, background: INK }} />)}
              </div>
              <div style={{ position: "absolute", left: -10, bottom: -26, width: 0, height: 0, borderLeft: "30px solid transparent", borderRight: "30px solid transparent", borderTop: `46px solid ${CREAM}`, transform: "rotate(30deg)" }} />
            </div>
          ) : null}
          {/* crachá com nome */}
          {f >= nameAt ? (
            <div style={{ position: "absolute", left: 520, top: 320, width: 380, transform: `rotate(4deg) scale(${back(f, nameAt, 10, 1.8)})` }}>
              <div style={{ background: "#e9e1cc", borderRadius: 14, border: `5px solid ${INK}`, padding: "14px 20px", boxShadow: "0 12px 30px rgba(0,0,0,0.6)" }}>
                <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 26, letterSpacing: 6, color: STAMP }}>OLÁ, MEU NOME É</div>
                <div style={{ fontFamily: HAND, fontWeight: 700, fontSize: 64, color: INK, lineHeight: 1.1 }}>Guardião ___</div>
              </div>
            </div>
          ) : null}
          {f >= cutAt ? (
            <div style={{ position: "absolute", left: 470, top: 70, width: 470, height: 420 }}>
              <svg width={470} height={420}>
                <path d="M20 20 L450 400" stroke={STAMP} strokeWidth={22} strokeLinecap="round" strokeDasharray="600" strokeDashoffset={600 - ease(f, cutAt, 6) * 600} />
                <path d="M450 20 L20 400" stroke={STAMP} strokeWidth={22} strokeLinecap="round" strokeDasharray="600" strokeDashoffset={600 - ease(f, cutAt + 4, 6) * 600} />
              </svg>
            </div>
          ) : null}
          {f >= cutAt ? <div style={{ position: "absolute", left: 0, right: 0, top: 530, display: "flex", justifyContent: "center" }}><Stamp text="TIRARAM" at={cutAt + 8} size={90} rot={-6} /></div> : null}
          <Hand at={likeAt} x={80} y={700 - 700 + 470 + 220} size={66} c={CREAM} rot={-3} w={820} center>…mas eu curtia pra caramba 😢</Hand>
        </div>
      ) : null}
      <Grain o={0.07} />
      <AbsoluteFill style={{ background: "#fff", opacity: fl(f, 0, 4, 0.4) + fl(f, oldAt, oldAt + 5, 0.3), pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};

// ========== 8) a base: guardiões da base (gameplay em cima) + os dois santuários (arte oficial embaixo) ==========
export const OBBase: React.FC<{ life: number; shrAt?: number; onlyAt?: number }> = ({ life, shrAt = 90, onlyAt = 150 }) => {
  const f = useCurrentFrame();
  const split = f >= shrAt;
  const lock = ease(f, onlyAt, 8);
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: split ? 760 : 1920, overflow: "hidden" }}>
        <AbsoluteFill style={{ transform: `scale(${1.04 + punchZ(f, [0, shrAt], 0.1, 9) + interpolate(f, [0, life], [0, 0.05], clamp)})` }}>
          <Clip clip="base_guard" ss={0} life={life} />
        </AbsoluteFill>
        <Vignette o={0.4} />
        {!split ? <Title at={8} y={1020} size={110} c={CREAM} sub="GUARDIÕES DA BASE">A BASE</Title> : null}
      </div>
      {split ? (
        <div style={{ position: "absolute", left: 0, top: 760, width: 1080, height: 1160, background: `radial-gradient(ellipse 80% 60% at 50% 30%, ${TEAL} 0%, ${INK} 80%)`, borderTop: `6px solid ${CREAM}`, clipPath: `inset(${(1 - ease(f, shrAt, 10)) * 100}% 0 0 0)` }}>
          <Halftone o={0.2} />
          <Img src={ob("Shrines.png")} style={{ position: "absolute", left: 90, top: 30, width: 900, height: 420, objectFit: "contain", filter: `drop-shadow(0 0 40px ${SOUL}66)` }} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 440, textAlign: "center", fontFamily: POSTER, fontSize: 92, color: CREAM, letterSpacing: 2 }}>OS 2 SANTUÁRIOS</div>
          {f >= onlyAt ? (
            <div style={{ position: "absolute", left: 140, top: 15, width: 800, height: 460, opacity: lock }}>
              <svg width={800} height={460}>
                <circle cx={230} cy={210} r={150} fill="none" stroke={STAMP} strokeWidth={12} strokeDasharray="950" strokeDashoffset={950 - lock * 950} />
                <circle cx={570} cy={210} r={150} fill="none" stroke={STAMP} strokeWidth={12} strokeDasharray="950" strokeDashoffset={950 - ease(f, onlyAt + 6, 8) * 950} />
              </svg>
            </div>
          ) : null}
        </div>
      ) : null}
      <Grain o={0.07} />
      <AbsoluteFill style={{ background: "#fff", opacity: fl(f, 0, 4, 0.4) + fl(f, shrAt, shrAt + 5, 0.3), pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};

// ========== 9) as duas vidas do Patrono: barra de vida no estilo do jogo em cima do gameplay dele ==========
export const OBLives: React.FC<{ life: number; clip?: string; ss?: number; twoAt?: number; dmgAt?: number; deadAt?: number; backAt?: number; stunAt?: number; silAt?: number }> = ({
  life, clip = "hk1", ss = 0, twoAt = 30, dmgAt = 90, deadAt = 170, backAt = 9999, stunAt = 9999, silAt = 9999,
}) => {
  const f = useCurrentFrame();
  const bar1 = 1 - interpolate(f, [dmgAt, deadAt], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  const two = ease(f, twoAt, 10);
  const z = 1.05 + punchZ(f, [deadAt, stunAt, silAt].filter((x) => x < 9000), 0.12, 9) + interpolate(f, [0, life], [0, 0.06], clamp);
  const sh = [stunAt, silAt].reduce((a, t, i) => { const s = shake(f, t, 16, 9, `ls${i}`); return { x: a.x + s.x, y: a.y + s.y }; }, { x: 0, y: 0 });
  const retreat = f >= backAt ? interpolate(f, [backAt, backAt + 20], [0, 1], clamp) : 0;
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `translate(${sh.x}px, ${sh.y}px) scale(${z - retreat * 0.1})`, filter: `brightness(${f >= stunAt ? 0.7 : 0.9})` }}>
        <Clip clip={clip} ss={ss} life={life} />
      </AbsoluteFill>
      <Vignette o={0.5} />
      {/* barra de vida do chefe: duas metades = duas vidas */}
      {f >= twoAt ? (
        <div style={{ position: "absolute", left: 90, top: 230, width: 900, opacity: two, transform: `translateY(${(1 - two) * -30}px)` }}>
          <div style={{ fontFamily: POSTER, fontSize: 64, color: CREAM, textAlign: "center", letterSpacing: 3, textShadow: "0 4px 18px #000" }}>{clip.startsWith("am") ? "ARCHMOTHER" : "HIDDEN KING"}</div>
          <div style={{ display: "flex", gap: 14, marginTop: 10 }}>
            {[0, 1].map((i) => (
              <div key={i} style={{ flex: 1, height: 46, borderRadius: 8, background: "rgba(0,0,0,0.75)", border: `4px solid ${CREAM}`, overflow: "hidden", position: "relative" }}>
                <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${(i === 0 ? bar1 : 1) * 100}%`, background: i === 0 ? `linear-gradient(180deg, #ff6a4d, ${STAMP})` : `linear-gradient(180deg, #ffd27a, ${AMBER})` }} />
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 14, marginTop: 8 }}>
            {["1ª VIDA", "2ª VIDA"].map((t, i) => <div key={t} style={{ flex: 1, textAlign: "center", fontFamily: BODY, fontWeight: 900, fontSize: 32, letterSpacing: 5, color: i === 0 && f >= deadAt ? "#777" : CREAM, textDecoration: i === 0 && f >= deadAt ? "line-through" : "none" }}>{t}</div>)}
          </div>
        </div>
      ) : null}
      {f >= backAt ? <Hand at={backAt} x={80} y={500} size={86} c={CREAM} rot={-4} w={900} center>⟵ recua!</Hand> : null}
      {f >= stunAt ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 700, display: "flex", justifyContent: "center", gap: 40 }}>
          <Stamp text="STUN" at={stunAt} size={110} rot={-8} c="#ffd27a" />
          {f >= silAt ? <Stamp text="SILENCE" at={silAt} size={110} rot={6} c={SPIRITC} /> : null}
        </div>
      ) : null}
      <Grain o={0.07} />
      <AbsoluteFill style={{ background: "#fff", opacity: fl(f, 0, 4, 0.4) + fl(f, deadAt, deadAt + 6, 0.45), pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};
const SPIRITC = "#b58cff";

// ========== 10) a última vida: precisa estar perto. Gameplay em cima, diagrama do alcance embaixo ==========
export const OBClose: React.FC<{ life: number; clip?: string; ss?: number; nearAt?: number; farAt?: number }> = ({ life, clip = "hk_end", ss = 0, nearAt = 60, farAt = 150 }) => {
  const f = useCurrentFrame();
  const show = f >= nearAt;
  const r = interpolate(f, [nearAt, nearAt + 20], [0, 260], { ...clamp, easing: Easing.out(Easing.back(1.4)) });
  const hit = (x: number) => Math.sin(f / 2.2 + x) > 0.2;
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: show ? 720 : 1920, overflow: "hidden" }}>
        <AbsoluteFill style={{ transform: `scale(${1.05 + interpolate(f, [0, life], [0, 0.06], clamp)})` }}>
          <Clip clip={clip} ss={ss} life={life} />
        </AbsoluteFill>
        <Vignette o={0.4} />
        {!show ? <Title at={6} y={1020} size={110} c={CREAM} sub="LIVRE PRA MATAR">A ÚLTIMA VIDA</Title> : null}
      </div>
      {show ? (
        <div style={{ position: "absolute", left: 0, top: 720, width: 1080, height: 1200, background: `radial-gradient(ellipse 80% 60% at 50% 30%, ${TEAL} 0%, ${INK} 80%)`, borderTop: `6px solid ${CREAM}`, clipPath: `inset(${(1 - ease(f, nearAt, 10)) * 100}% 0 0 0)` }}>
          <Halftone o={0.2} />
          <svg width={1080} height={600} style={{ position: "absolute", left: 0, top: 0 }}>
            <circle cx={380} cy={300} r={r} fill={`${SOUL}22`} stroke={SOUL} strokeWidth={6} strokeDasharray="18 12" />
            {/* tiros de dentro do círculo acertam */}
            {hit(0) ? <line x1={300} y1={420} x2={380} y2={300} stroke="#fff" strokeWidth={6} /> : null}
            {/* de fora: o tiro some antes de chegar */}
            {f >= farAt && hit(2) ? <line x1={900} y1={430} x2={720} y2={360} stroke="#fff" strokeWidth={6} strokeDasharray="10 14" opacity={0.6} /> : null}
          </svg>
          <Img src={ob("Patron.png")} style={{ position: "absolute", left: 380 - 85, top: 300 - 85, width: 170, height: 170, filter: `drop-shadow(0 0 30px ${AMBER})` }} />
          <div style={{ position: "absolute", left: 270, top: 390, width: 64, height: 64, borderRadius: "50%", background: SOUL, border: `5px solid ${INK}` }} />
          <div style={{ position: "absolute", left: 120, top: 480, fontFamily: HAND, fontWeight: 700, fontSize: 56, color: SOUL }}>perto = dano ✓</div>
          {f >= farAt ? (
            <>
              <div style={{ position: "absolute", left: 880, top: 400, width: 64, height: 64, borderRadius: "50%", background: "#888", border: `5px solid ${INK}`, opacity: ease(f, farAt, 8) }} />
              <div style={{ position: "absolute", left: 560, top: 480, width: 360, transform: "rotate(-3deg)", opacity: ease(f, farAt, 8) }}>
                <Stamp text="0 DANO" at={farAt + 4} size={74} rot={-6} />
              </div>
            </>
          ) : null}
        </div>
      ) : null}
      <Grain o={0.07} />
      <AbsoluteFill style={{ background: "#fff", opacity: fl(f, 0, 4, 0.4) + fl(f, nearAt, nearAt + 5, 0.3), pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};

// ========== 11) próximo episódio: quatro janelas de gameplay acendendo na palavra ==========
type NX = { t: string; clip: string; ss?: number; at: number };
export const OBNext: React.FC<{ life: number; items: NX[] }> = ({ life, items }) => {
  const f = useCurrentFrame();
  return (
    <Paper>
      <Title at={2} y={200} size={96} c={CREAM} sub="NO PRÓXIMO EPISÓDIO">VEM AÍ</Title>
      {items.map((it, i) => {
        const on = f >= it.at;
        const e = back(f, it.at, 10, 1.6);
        const x = 70 + (i % 2) * 480;
        const y = 440 + Math.floor(i / 2) * 430;
        return (
          <div key={it.t} style={{ position: "absolute", left: x, top: y, width: 450, height: 400, transform: `scale(${on ? e : 0.92}) rotate(${(i % 2 ? 2 : -2) * (on ? 1 : 0)}deg)`, opacity: on ? 1 : 0.25,
            borderRadius: 18, overflow: "hidden", border: `6px solid ${on ? SOUL : CREAM}`, boxShadow: on ? `0 0 40px ${SOUL}66` : "none", background: "#000" }}>
            {on ? <Clip clip={it.clip} ss={it.ss ?? 0} life={life} /> : null}
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "10px 0 12px", background: "linear-gradient(0deg, rgba(0,0,0,0.9), rgba(0,0,0,0))", textAlign: "center", fontFamily: POSTER, fontSize: 58, color: CREAM, letterSpacing: 2 }}>{it.t}</div>
          </div>
        );
      })}
    </Paper>
  );
};
