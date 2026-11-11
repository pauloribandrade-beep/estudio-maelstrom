import React, { useContext } from "react";
import { AbsoluteFill, Easing, interpolate, staticFile, useCurrentFrame } from "remotion";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { MONO } from "./overlays";
import { C } from "./hl3";
import { Canvas3D } from "./hl3j";
import { Actor } from "./hl3m";
import { LiteCtx } from "./sfx-ctx";

// 3C · O ATAQUE NO MAPA TÁTICO 2D (decisão do Paulo, 03/10: "2D é o caminho"). Carta de campo da Resistência vista de
// cima: curvas de nível, mata em símbolos, a clareira com as barracas, o fogo e a maleta dos DADOS. Linguagem única de
// selos: rebeldes = fichas λ; Freeman e Varga = retratos; Strider e Hunter = recortes reais (Ep2) pintados; Combine =
// marcadores vermelhos pequenos e iguais. Pouca linha: só o que conta a batida. A câmera desliza pela carta seguindo a
// fala. Mesmas batidas do HLWarTable. Tempos em QUADROS.

const AMB = "#ffb22e";
const RED = "#ff4d5e";
const ICE = "#c6f7ff";
const rnd = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const P = (f: number, at: number, d = 12) => interpolate(f, [at, at + d], [0, 1], { ...C, easing: Easing.out(Easing.cubic) });
const IO = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], { ...C, easing: Easing.inOut(Easing.cubic) });
const lerp = (a: [number, number], b: [number, number], k: number): [number, number] => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];

type Beats = { contactAt: number; goAt: number; skipAt: number; lockAt: number; radioAt: number; vargaAt: number; gordonAt: number; criticalAt: number; hunterAt: number; repelAt: number; loseAt: number };

// ---------------------------------------------------------------- a carta (em metros; fogo no 0,0)
const CRATE: [number, number] = [-0.9, 0.6];
const REB: { id: string; p: [number, number]; def: [number, number] }[] = [
  { id: "varga", p: [-0.75, -0.45], def: [-1.4, -2.4] },
  { id: "gordon", p: [0.8, 0.35], def: [2.1, -2.6] },
  { id: "eli", p: [0.55, -0.7], def: [0.9, -1.0] },
  { id: "r1", p: [-0.2, 0.85], def: [-2.6, -1.6] },
  { id: "r2", p: [1.3, -0.3], def: [3.0, -1.4] },
  { id: "r3", p: [-1.4, 0.2], def: [-3.2, -0.6] },
  { id: "r4", p: [-1.9, 1.3], def: [-2.9, -1.4] },
  { id: "r5", p: [1.9, 1.5], def: [3.2, -0.8] },
  { id: "r6", p: [-2.1, -1.6], def: [-2.0, -2.3] },
  { id: "r7", p: [2.1, -1.0], def: [2.3, -2.5] },
  { id: "r8", p: [0.4, -2.3], def: [-0.4, -2.85] },
  { id: "r9", p: [-0.8, 1.6], def: [0.4, -2.95] },
  { id: "r10", p: [1.0, 1.4], def: [1.5, -2.85] },
  { id: "r11", p: [-2.6, 0.4], def: [-3.4, 0.2] },
];
const UNITS = Array.from({ length: 10 }).map((_, i) => {
  const a = -Math.PI / 2 + (i - 4.5) * 0.16;
  const r = 7.2 + rnd(i * 5) * 1.2;
  return { from: [Math.cos(a) * r, Math.sin(a) * r * 0.9] as [number, number], mid: [Math.cos(a) * 3.4 + (rnd(i) - 0.5) * 0.6, Math.sin(a) * 3.0] as [number, number], d: rnd(i * 9) * 0.25 };
});
const VORTS: { p: [number, number]; def: [number, number] }[] = [
  { p: [-2.5, -0.6], def: [-1.9, -1.5] },
  { p: [2.6, 0.5], def: [1.9, -1.7] },
  { p: [-3.1, 0.9], def: [-2.7, -1.0] },
  { p: [3.2, -0.8], def: [2.8, -1.2] },
  { p: [-0.9, 1.2], def: [-0.8, -2.1] },
  { p: [1.0, 1.4], def: [0.7, -2.2] },
];
const STRIDER0: [number, number] = [6.6, -7.0];
const STRIDER1: [number, number] = [4.4, -5.4];
const HUNT0: [number, number] = [4.6, -3.4];
const ARC: [number, number][] = [
  [-3.4, -0.4],
  [-2.6, -2.0],
  [-1.0, -2.8],
  [1.0, -2.9],
  [2.8, -2.4],
  [3.4, -1.2],
];
const ATTACK: [number, number][][] = [
  [
    [0, -7.4],
    [0.3, -5.4],
    [-0.3, -3.6],
  ],
  [
    [5.8, -6.6],
    [4.2, -4.8],
    [2.6, -3.3],
  ],
  [
    [-6.2, -5.8],
    [-4.6, -4.3],
    [-2.9, -3.0],
  ],
];
const HILLS: [number, number, number][] = [
  [-8, -5.5, 6],
  [7.5, 4.2, 5],
  [8.5, -6, 5],
  [-6.5, 5, 4],
];
const CONTOURS: { pts: [number, number][] }[] = (() => {
  const out: { pts: [number, number][] }[] = [];
  HILLS.forEach(([hx, hz, n], h) => {
    for (let k = 1; k <= n; k++) {
      const pts: [number, number][] = [];
      for (let j = 0; j <= 60; j++) {
        const a = (j / 60) * Math.PI * 2;
        const r = k * 0.75 * (1 + 0.16 * Math.sin(a * 3 + h + k) + 0.08 * Math.sin(a * 7 + k));
        pts.push([hx + Math.cos(a) * r * 1.3, hz + Math.sin(a) * r]);
      }
      out.push({ pts });
    }
  });
  return out;
})();
const PINES: [number, number, number][] = (() => {
  const out: [number, number, number][] = [];
  for (let i = 0; out.length < 230 && i < 5000; i++) {
    const x = (rnd(i * 3) - 0.5) * 30;
    const z = (rnd(i * 7) - 0.5) * 20;
    const r = Math.hypot(x, z * 1.2);
    if (r < 4.0) continue;
    if (Math.abs(x + 0.6 * Math.sin(z * 0.3)) < 0.8 && z > 2) continue;
    if (rnd(i * 11) > 0.28 + Math.min(1, (r - 4) / 3) * 0.55) continue;
    out.push([x, z, 0.75 + rnd(i * 13) * 0.45]);
  }
  return out;
})();
const TENTS: [number, number][] = [
  [-1.6, -1.2],
  [1.5, -1.5],
  [-1.9, 1.0],
  [1.7, 1.2],
  [0.1, -2.1],
];

// ---------------------------------------------------------------- câmera da carta (desliza entre as batidas)
type Key = { at: number; c: [number, number]; z: number };
export const MAP2D_KEYS = (b: Beats): Key[] =>
  [
    { at: 0, c: [0, -0.3] as [number, number], z: 1.0 },
    { at: b.contactAt, c: [0.4, -3.0] as [number, number], z: 0.74 },
    { at: b.goAt, c: [3.0, -4.9] as [number, number], z: 0.8 },
    { at: b.skipAt, c: [0, -1.7] as [number, number], z: 0.86 },
    { at: b.vargaAt, c: [-0.8, -1.9] as [number, number], z: 1.1 },
    { at: b.criticalAt, c: [2.6, -2.7] as [number, number], z: 1.2 },
    { at: b.repelAt, c: [3.6, -4.9] as [number, number], z: 0.86 },
    { at: b.loseAt, c: [-0.6, 0.0] as [number, number], z: 1.3 },
  ].filter((k) => k.at < 1e8);
const camAt = (f: number, life: number, b: Beats) => {
  const keys = MAP2D_KEYS(b);
  let ki = 0;
  for (let k = 0; k < keys.length; k++) if (f >= keys[k].at) ki = k;
  const K0 = keys[ki];
  const prev = keys[Math.max(0, ki - 1)];
  const nextAt = ki + 1 < keys.length ? keys[ki + 1].at : life;
  const span = Math.max(14, Math.min(45, (nextAt - K0.at) * 0.55));
  const k = ki === 0 ? 1 : IO(f, K0.at, K0.at + span);
  const drift = (f - K0.at) / 30;
  const c = lerp(prev.c, K0.c, k);
  return { cx: c[0] + Math.sin(drift * 0.4) * 0.05, cz: c[1] + Math.cos(drift * 0.33) * 0.04, zoom: (prev.z + (K0.z - prev.z) * k) * (1 + 0.006 * drift) };
};

// selo redondo com retrato (Freeman, Varga)
const Portrait: React.FC<{ x: number; y: number; r: number; src: string; ring: string; label: string; hot: number }> = ({ x, y, r, src, ring, label, hot }) => (
  <g transform={`translate(${x} ${y})`}>
    <circle r={r + 7} fill="none" stroke={ring} strokeWidth={2} opacity={0.3 + 0.7 * hot} />
    <clipPath id={`clip-${label}`}>
      <circle r={r} />
    </clipPath>
    <circle r={r + 2} fill="#0a0d12" />
    <image href={staticFile(src)} x={-r} y={-r} width={r * 2} height={r * 2} clipPath={`url(#clip-${label})`} preserveAspectRatio="xMidYMid slice" />
    <circle r={r} fill="none" stroke={ring} strokeWidth={4} />
    <rect x={-label.length * 6.6 - 10} y={r + 10} width={label.length * 13.2 + 20} height={26} rx={4} fill="rgba(5,8,12,0.85)" stroke={ring} strokeWidth={1.2} />
    <text y={r + 29} textAnchor="middle" fill={ring} fontFamily={MONO} fontSize={16} letterSpacing={3}>
      {label}
    </text>
  </g>
);

const Tag: React.FC<{ x: number; y: number; text: string; col: string; o: number; size?: number }> = ({ x, y, text, col, o, size = 16 }) =>
  o <= 0.01 ? null : (
    <g transform={`translate(${x} ${y})`} opacity={o}>
      <rect x={-text.length * size * 0.42 - 10} y={-size - 6} width={text.length * size * 0.84 + 20} height={size + 14} rx={4} fill="rgba(5,8,12,0.85)" stroke={col} strokeWidth={1.2} />
      <text y={0} textAnchor="middle" fill={col} fontFamily={MONO} fontSize={size} letterSpacing={3}>
        {text}
      </text>
    </g>
  );

const LOG = (b: Beats) =>
  [
    { at: 0, t: "23:46", s: "ACAMPAMENTO · NOITE 1 · CALMO" },
    { at: b.contactAt, t: "23:51", s: "CONTATO · MATA AO NORTE", red: true },
    { at: b.goAt, t: "23:52", s: "ATAQUE COMBINE", red: true },
    { at: b.skipAt, t: "23:52", s: "ELES IGNORAM OS REBELDES" },
    { at: b.lockAt, t: "23:53", s: "ALVO: OS DADOS", red: true },
    { at: b.vargaAt, t: "23:53", s: "VARGA ASSUME A DEFESA" },
    { at: b.gordonAt, t: "23:54", s: "FREEMAN ENTRA NO COMBATE" },
    { at: b.criticalAt, t: "23:55", s: "HUNTER · FLANCO LESTE", red: true },
    { at: b.hunterAt, t: "23:55", s: "VARGA DERRUBA O HUNTER" },
    { at: b.repelAt, t: "23:57", s: "EMBOSCADA REPELIDA" },
    { at: b.loseAt, t: "23:58", s: "PERDA · PARTE DOS DADOS", red: true },
  ].filter((l) => l.at < 1e8);

// o passo do Strider: uma pisada a cada 40/3 quadros (as pisadas do som são as mesmas)
const ST_T = 40;

// esquadrões Combine (símbolo tático: losango vermelho = hostil, X = infantaria)
const SQUADS = [
  { name: "OTA · 1", idx: [0, 1, 2] },
  { name: "OTA · 2", idx: [3, 4, 5, 6] },
  { name: "OTA · 3", idx: [7, 8, 9] },
];
// selo losango (Strider, Hunter): o recorte real dentro, borda vermelha
const Diamond: React.FC<{ id: string; x: number; y: number; r: number; src: string; dead: number; o: number; label: string; ring?: number }> = ({ id, x, y, r, src, dead, o, label, ring = 0 }) =>
  o <= 0.01 ? null : (
    <g transform={`translate(${x} ${y}) scale(${o})`}>
      {ring > 0 ? <circle r={ring} fill="rgba(255,77,94,0.06)" stroke={RED} strokeWidth={1.5} strokeDasharray="8 8" opacity={0.6 * (1 - dead)} /> : null}
      <path d={`M 0 ${-r} L ${r} 0 L 0 ${r} L ${-r} 0 Z`} fill="#1c070b" stroke={dead > 0.5 ? "#7a6a6c" : RED} strokeWidth={3.5} />
      <clipPath id={`dclip-${id}`}>
        <path d={`M 0 ${-r + 4} L ${r - 4} 0 L 0 ${r - 4} L ${-r + 4} 0 Z`} />
      </clipPath>
      <image href={staticFile(src)} x={-r * 1.0} y={-r * 1.02} width={r * 2.0} height={r * 2.04} clipPath={`url(#dclip-${id})`} preserveAspectRatio="xMidYMid meet" style={{ filter: dead > 0.5 ? "grayscale(1) brightness(0.6)" : undefined }} />
      {dead > 0.01 ? <path d={`M ${-r * 0.55} ${-r * 0.55} L ${r * 0.55} ${r * 0.55} M ${r * 0.55} ${-r * 0.55} L ${-r * 0.55} ${r * 0.55}`} stroke={RED} strokeWidth={5} strokeLinecap="round" opacity={dead} /> : null}
      <rect x={-label.length * 6.6 - 10} y={r + 10} width={label.length * 13.2 + 20} height={26} rx={4} fill="rgba(5,8,12,0.85)" stroke={dead > 0.5 ? "#7a6a6c" : RED} strokeWidth={1.2} />
      <text y={r + 29} textAnchor="middle" fill={dead > 0.5 ? "#9a8a8c" : "#ffb3bb"} fontFamily={MONO} fontSize={16} letterSpacing={3}>
        {label}
      </text>
    </g>
  );

export const HLWarMap2D: React.FC<{ life: number } & Partial<Beats>> = (p) => {
  const f = useCurrentFrame();
  const lite = useContext(LiteCtx);
  const N = 1e9;
  const b: Beats = {
    contactAt: p.contactAt ?? N,
    goAt: p.goAt ?? N,
    skipAt: p.skipAt ?? N,
    lockAt: p.lockAt ?? N,
    radioAt: p.radioAt ?? N,
    vargaAt: p.vargaAt ?? N,
    gordonAt: p.gordonAt ?? N,
    criticalAt: p.criticalAt ?? N,
    hunterAt: p.hunterAt ?? N,
    repelAt: p.repelAt ?? N,
    loseAt: p.loseAt ?? N,
  };
  const life = p.life;
  const cam = camAt(f, life, b);
  const S = 132 * cam.zoom;
  const X = (x: number) => 960 + (x - cam.cx) * S;
  const Y = (z: number) => 560 + (z - cam.cz) * S;
  const sz = Math.max(0.7, cam.zoom);
  // ---------- rebeldes (sempre na carta; vão para o arco quando o Varga assume)
  const defK = (id: string) => (id === "gordon" ? IO(f, b.gordonAt, b.gordonAt + 40) : IO(f, b.vargaAt + (id === "varga" ? 0 : 8), b.vargaAt + 50));
  const rebPos = (r: (typeof REB)[number]) => lerp(r.p, r.def, defK(r.id));
  // ---------- Combine
  const unitPos = (i: number, ff = f) => {
    const u = UNITS[i];
    const o = P(ff, b.contactAt + i * 4, 10);
    const adv = IO(ff, b.goAt + u.d * 60, b.lockAt + 30);
    const toData = IO(ff, b.lockAt + i * 3, b.vargaAt + 30);
    const back = IO(ff, b.repelAt + i * 3, b.repelAt + 70);
    let q = lerp(u.from, u.mid, adv);
    q = lerp(q, [CRATE[0] + Math.cos(i) * 1.4, CRATE[1] - 1.2 + Math.sin(i) * 0.6], toData * 0.7);
    q = lerp(q, u.from, back);
    const dead = i % 3 === 1 ? IO(ff, b.vargaAt + 30 + i * 6, b.vargaAt + 40 + i * 6) : 0;
    return { q, o: o * (1 - back * 0.7), dead };
  };
  // ---------- Strider: desliza do norte (sem balanço), atira, é abatido no repel
  const walkFrames = Math.max(30, b.repelAt + 10 - b.goAt);
  const walkF = Math.max(0, Math.min(f - b.goAt, walkFrames));
  const sPos = lerp(STRIDER0, STRIDER1, Easing.inOut(Easing.sin)(walkF / walkFrames));
  const sO = P(f, b.goAt - 6, 10);
  const sDead = IO(f, b.repelAt + 10, b.repelAt + 24);
  const sShake = f >= b.repelAt + 10 && f < b.repelAt + 24 ? Math.sin(f * 2.3) * 5 : 0;
  const sFire = f >= b.goAt + 20 && f < b.repelAt && (f - b.goAt) % 60 < 14;
  // ---------- Hunter
  const hO = P(f, b.gordonAt - 10, 10);
  const lunge = IO(f, b.criticalAt, b.criticalAt + 18);
  const hDead = IO(f, b.hunterAt, b.hunterAt + 10);
  const gPos = rebPos(REB[1]);
  const vPos = rebPos(REB[0]);
  const ePos = rebPos(REB[2]);
  const hPos = lerp(HUNT0, [gPos[0] + 0.7, gPos[1] - 0.55], lunge * 0.85);
  // ---------- linhas (poucas)
  const arcK = IO(f, b.vargaAt, b.vargaAt + 30);
  const firing = f >= b.vargaAt + 25 && f < b.repelAt + 50;
  const tracers: React.ReactNode[] = [];
  if (firing) {
    for (let k = 0; k < 3; k++) {
      const slot = Math.floor((f + k * 5) / 6);
      const ri = (slot * 7 + k * 3) % REB.length;
      const ui = (slot * 3 + k) % UNITS.length;
      const up = unitPos(ui);
      if (up.o < 0.4 || up.dead > 0.5) continue;
      const rp = rebPos(REB[ri]);
      if ((f + k * 5) % 6 > 2) continue;
      const fromReb = (slot + k) % 3 !== 0;
      const a = fromReb ? rp : up.q;
      const c = fromReb ? up.q : rp;
      tracers.push(<line key={`t${k}`} x1={X(a[0])} y1={Y(a[1])} x2={X(c[0])} y2={Y(c[1])} stroke={fromReb ? "#ffd27a" : "#8fe0ff"} strokeWidth={1.6} opacity={0.75} />);
    }
  }
  const vShot = f >= b.hunterAt - 4 && f < b.hunterAt + 3;
  // Vortigaunts: vão para trás do arco com o grupo; a cada ~1,5 s um deles dispara vortessência num Combine
  const vortK = IO(f, b.vargaAt + 4, b.vargaAt + 46);
  const vortPos = VORTS.map((v) => lerp(v.p, v.def, vortK));
  const zaps: React.ReactNode[] = [];
  if (f >= b.vargaAt + 40 && f < b.repelAt + 30) {
    VORTS.forEach((_, k) => {
      const ph = (f - b.vargaAt - 40 + k * 7) % 44;
      if (ph > 7) return;
      // dispara no Combine visível mais próximo (o mesmo para onde a seta dele aponta)
      const a = vortPos[k];
      let ui = -1;
      let bd = 1e9;
      UNITS.forEach((_, j) => {
        const u2 = unitPos(j);
        if (u2.o < 0.4) return;
        const dd = Math.hypot(u2.q[0] - a[0], u2.q[1] - a[1]);
        if (dd < bd) {
          bd = dd;
          ui = j;
        }
      });
      if (ui < 0) return;
      const up = unitPos(ui);
      const pts: string[] = [];
      for (let j = 0; j <= 10; j++) {
        const t = j / 10;
        const x = a[0] + (up.q[0] - a[0]) * t;
        const z = a[1] + (up.q[1] - a[1]) * t;
        const jit = j === 0 || j === 10 ? 0 : (rnd(j * 7 + f * 3 + k) - 0.5) * 0.35;
        pts.push(`${j ? "L" : "M"} ${X(x + jit).toFixed(1)} ${Y(z + jit).toFixed(1)}`);
      }
      zaps.push(
        <g key={`z${k}`} opacity={1 - ph / 8}>
          <path d={pts.join(" ")} fill="none" stroke="#8dffa8" strokeWidth={6} opacity={0.35} />
          <path d={pts.join(" ")} fill="none" stroke="#e6ffe9" strokeWidth={2.2} />
          <circle cx={X(up.q[0])} cy={Y(up.q[1])} r={14 * sz} fill="#8dffa8" opacity={0.45} />
        </g>,
      );
    });
  }
  const alarm = f >= b.goAt && f < b.repelAt ? 0.5 + 0.5 * Math.sin((f - b.goAt) / 4) : 0;
  const log = LOG(b).filter((l) => f >= l.at);
  const path = (pts: [number, number][]) => `M ${pts.map(([x, z]) => `${X(x).toFixed(1)} ${Y(z).toFixed(1)}`).join(" L ")}`;
  // seta tática grossa (avanço de um esquadrão): corpo + ponta
  const bigArrow = (from: [number, number], to: [number, number], k: number, o: number, key: string) => {
    if (k <= 0.01 || o <= 0.01) return null;
    const tip = lerp(from, to, k);
    const ax = X(from[0]);
    const ay = Y(from[1]);
    const bx = X(tip[0]);
    const by = Y(tip[1]);
    const ang = Math.atan2(by - ay, bx - ax);
    const w = 9 * sz;
    const nx = -Math.sin(ang);
    const ny = Math.cos(ang);
    const hx = bx - Math.cos(ang) * 22 * sz;
    const hy = by - Math.sin(ang) * 22 * sz;
    const d = `M ${ax + nx * w * 0.4} ${ay + ny * w * 0.4} L ${hx + nx * w} ${hy + ny * w} L ${hx + nx * w * 2.1} ${hy + ny * w * 2.1} L ${bx} ${by} L ${hx - nx * w * 2.1} ${hy - ny * w * 2.1} L ${hx - nx * w} ${hy - ny * w} L ${ax - nx * w * 0.4} ${ay - ny * w * 0.4} Z`;
    return <path key={key} d={d} fill="rgba(255,77,94,0.32)" stroke={RED} strokeWidth={2} opacity={o} />;
  };
  const advK = IO(f, b.goAt, b.goAt + 45);
  const advO = 1 - P(f, b.lockAt + 20, 30);
  return (
    <AbsoluteFill style={{ background: "#070d12" }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <radialGradient id="fire2d">
            <stop offset="0" stopColor="#ffb14a" stopOpacity={0.85} />
            <stop offset="1" stopColor="#ff6a1a" stopOpacity={0} />
          </radialGradient>
        </defs>
        {/* a carta de relevo (gerada: relevo sombreado, mata, lago, riacho, pedras, trilha, curvas de nível) */}
        <image href={staticFile("hl3silh/carta_relevo.jpg")} x={X(-15)} y={Y(-10)} width={30 * S} height={20 * S} preserveAspectRatio="none" />
        {/* acampamento: barracas, caixotes, a antena do rádio, o fogo */}
        <circle cx={X(0)} cy={Y(0)} r={90 * sz * (0.95 + 0.05 * Math.sin(f / 3))} fill="url(#fire2d)" />
        <circle cx={X(0)} cy={Y(0)} r={7 * sz} fill="#ffcf7a" />
        {TENTS.map(([x, z], i) => (
          <g key={`tn${i}`} transform={`translate(${X(x)} ${Y(z)}) scale(${sz}) rotate(${[20, -30, 70, -60, 0][i]})`}>
            <path d="M -16 -11 L 16 -11 L 16 11 L -16 11 Z" fill="#5a5038" stroke="#1a160c" strokeWidth={2} />
            <path d="M 0 -11 L 0 11" stroke="#2a2416" strokeWidth={3} />
            <path d="M -16 -11 L 0 -3 L 16 -11" fill="none" stroke="#d6dde3" strokeWidth={2} opacity={0.5} />
          </g>
        ))}
        {[
          [-2.9, -3.0],
          [-2.3, -3.2],
        ].map(([x, z], i) => (
          <rect key={`cx${i}`} x={X(x) - 9 * sz} y={Y(z) - 9 * sz} width={18 * sz} height={18 * sz} fill="#4a3a26" stroke="#1a140c" strokeWidth={2} />
        ))}
        <circle cx={X(-2.2)} cy={Y(-3.4)} r={4 * sz} fill="#c6f7ff" opacity={0.6 + 0.4 * Math.sin(f / 5)} />
        {/* a maleta dos DADOS */}
        <g transform={`translate(${X(CRATE[0])} ${Y(CRATE[1])}) scale(${sz})`}>
          <rect x={-20} y={-13} width={40} height={26} rx={3} fill="#22262c" stroke="#d06a20" strokeWidth={2.5} />
          {[-11, 0, 11].map((dx, i) => {
            const gone = i === 2 ? IO(f, b.loseAt, b.loseAt + 12) : 0;
            return <rect key={i} x={dx - 4} y={-8} width={8} height={16} fill={gone > 0.5 ? "#1a1c20" : "#ffcf7a"} opacity={0.9} />;
          })}
          {f >= b.lockAt ? <circle r={36 + 4 * Math.sin(f / 4)} fill="none" stroke={RED} strokeWidth={3} opacity={0.85 * Math.max(1 - P(f, b.repelAt + 40, 20), P(f, b.loseAt, 10))} /> : null}
          {f >= b.loseAt ? (
            <rect x={7 + IO(f, b.loseAt, b.loseAt + 24) * 60} y={-8 - Math.sin(IO(f, b.loseAt, b.loseAt + 24) * Math.PI) * 40} width={8} height={16} fill="#ffcf7a" opacity={1 - IO(f, b.loseAt + 16, b.loseAt + 30)} />
          ) : null}
        </g>
        {/* setas táticas de avanço (uma por esquadrão) e o arco da defesa */}
        {SQUADS.map((sq, k) => {
          const from: [number, number] = [sq.idx.reduce((a, i) => a + UNITS[i].from[0], 0) / sq.idx.length, sq.idx.reduce((a, i) => a + UNITS[i].from[1], 0) / sq.idx.length];
          const to: [number, number] = [sq.idx.reduce((a, i) => a + UNITS[i].mid[0], 0) / sq.idx.length, sq.idx.reduce((a, i) => a + UNITS[i].mid[1], 0) / sq.idx.length];
          return bigArrow(from, lerp(from, to, 0.82), advK, advO, `ar${k}`);
        })}
        {/* a zona da defesa (sutil): faixa âmbar suave por trás das fichas + pontilhado fino (03/10: a linha forte destoava) */}
        <path d={path(ARC)} fill="none" stroke={AMB} strokeWidth={46 * sz} strokeLinejoin="round" strokeLinecap="round" opacity={0.07 * arcK} />
        <path d={path(ARC)} fill="none" stroke={AMB} strokeWidth={1.5} strokeLinejoin="round" strokeDasharray="2 9" strokeLinecap="round" opacity={0.45 * arcK} />
        {tracers}
        {zaps}
        {vShot ? <line x1={X(vPos[0])} y1={Y(vPos[1])} x2={X(hPos[0])} y2={Y(hPos[1])} stroke="#ffe2a0" strokeWidth={2.6} /> : null}
        {sFire ? <line x1={X(sPos[0])} y1={Y(sPos[1])} x2={X(sPos[0] - 1.6)} y2={Y(sPos[1] + 2.2)} stroke="#bff4ff" strokeWidth={2.4} opacity={f % 4 < 2 ? 0.95 : 0.2} /> : null}
        {/* Combine: símbolo tático (losango hostil com X de infantaria), em esquadrões nomeados */}
        {UNITS.map((_, i) => {
          const u = unitPos(i);
          if (u.o <= 0.01) return null;
          const dead = u.dead > 0.5;
          return (
            <g key={`u${i}`} transform={`translate(${X(u.q[0])} ${Y(u.q[1])}) scale(${u.o * sz})`} opacity={dead ? 0.5 : 1}>
              <path d="M 0 -15 L 15 0 L 0 15 L -15 0 Z" fill={dead ? "#2a2224" : "#3a0a12"} stroke={dead ? "#7a6a6c" : RED} strokeWidth={2.6} />
              <path d="M -6 -6 L 6 6 M 6 -6 L -6 6" stroke={dead ? "#7a6a6c" : RED} strokeWidth={2.2} />
            </g>
          );
        })}
        {SQUADS.map((sq, k) => {
          const pts = sq.idx.map((i) => unitPos(i)).filter((u) => u.dead < 0.5);
          if (!pts.length) return null;
          const o = Math.min(...pts.map((u) => u.o)) * (1 - P(f, b.vargaAt, 20));
          const cx = pts.reduce((a, u) => a + u.q[0], 0) / pts.length;
          const cz = Math.min(...pts.map((u) => u.q[1]));
          return <Tag key={`sq${k}`} x={X(cx)} y={Y(cz) - 22 * sz} text={sq.name} col="#ffb3bb" o={o} size={14} />;
        })}
        {/* rebeldes: fichas λ (Varga, Freeman e Eli são retratos, por cima) */}
        {REB.slice(3).map((r) => {
          const q = rebPos(r);
          return (
            <g key={r.id} transform={`translate(${X(q[0])} ${Y(q[1])}) scale(${sz})`}>
              <circle r={15} fill="#3a1d08" stroke={AMB} strokeWidth={2.5} />
              <text y={0.5} textAnchor="middle" dominantBaseline="central" fill={AMB} fontFamily={MONO} fontSize={19} fontWeight={700}>
                λ
              </text>
            </g>
          );
        })}
        <Diamond id="strider" x={X(sPos[0]) + sShake} y={Y(sPos[1])} r={74 * sz} src="hl3silh/strider_icone.png" dead={sDead} o={sO} label={sDead > 0.5 ? "STRIDER · ABATIDO" : "STRIDER"} ring={sDead > 0.5 ? 0 : 2.4 * S} />
        <Diamond id="hunter" x={X(hPos[0])} y={Y(hPos[1]) - Math.sin(lunge * Math.PI) * 30} r={58 * sz} src="hl3silh/hunter_peca.png" dead={hDead} o={hO} label={hDead > 0.5 ? "HUNTER · ABATIDO" : "HUNTER"} />
        {vortPos.map((q, k) => {
          // mira: o Combine visível mais próximo; a seta gira para ele e a linha tracejada aparece antes do disparo
          let best = -1;
          let bd = 1e9;
          UNITS.forEach((_, ui) => {
            const up = unitPos(ui);
            if (up.o < 0.4) return;
            const dd = Math.hypot(up.q[0] - q[0], up.q[1] - q[1]);
            if (dd < bd) {
              bd = dd;
              best = ui;
            }
          });
          const tq = best >= 0 ? unitPos(best).q : [q[0], q[1] - 3];
          const ang = Math.atan2(Y(tq[1]) - Y(q[1]), X(tq[0]) - X(q[0]));
          const fighting = f >= b.vargaAt + 30 && f < b.repelAt + 30;
          const ph = (((f - b.vargaAt - 40 + k * 7) % 44) + 44) % 44;
          const aiming = fighting && best >= 0 && ph > 30;
          return (
          <g key={`v${k}`}>
            {aiming ? <line x1={X(q[0])} y1={Y(q[1])} x2={X(tq[0])} y2={Y(tq[1])} stroke="#8dffa8" strokeWidth={1.4} strokeDasharray="6 6" opacity={0.55} /> : null}
          <g transform={`translate(${X(q[0])} ${Y(q[1])}) scale(${sz})`}>
            {fighting ? <path d="M 30 0 L 18 -8 L 18 8 Z" transform={`rotate(${(ang * 180) / Math.PI})`} fill="#8dffa8" opacity={0.9} /> : null}
            <circle r={19} fill="rgba(8,32,17,0.94)" stroke="#8dffa8" strokeWidth={2.5} />
            <clipPath id={`vclip${k}`}><circle r={16} /></clipPath>
            <image href={staticFile("hl3silh/vort_icone.png")} x={-16} y={-16} width={32} height={32} clipPath={`url(#vclip${k})`} preserveAspectRatio="xMidYMid slice" />
            <circle r={23} fill="none" stroke="#8dffa8" strokeWidth={1.2} opacity={0.22 + 0.2 * Math.sin(f / 7 + k)} />
            {k === 0 ? (
              <>
                <rect x={-78} y={31} width={156} height={24} rx={4} fill="rgba(5,8,12,0.85)" stroke="#8dffa8" strokeWidth={1.2} />
                <text y={48} textAnchor="middle" fill="#8dffa8" fontFamily={MONO} fontSize={14} letterSpacing={3}>
                  VORTIGAUNTS
                </text>
              </>
            ) : null}
          </g>
          </g>
          );
        })}
        <Portrait x={X(ePos[0])} y={Y(ePos[1])} r={26 * sz} src="hl3silh/eli_retrato.png" ring={AMB} label="ELI" hot={0} />
        <Portrait x={X(vPos[0])} y={Y(vPos[1])} r={30 * sz} src="hl3silh/varga_retrato.png" ring={AMB} label="VARGA" hot={P(f, b.vargaAt, 10)} />
        <Portrait x={X(gPos[0])} y={Y(gPos[1])} r={32 * sz} src="hl3silh/gordon_retrato.png" ring="#ff8a1a" label="FREEMAN" hot={P(f, b.gordonAt, 10)} />
        <Tag x={X(CRATE[0])} y={Y(CRATE[1]) + 70 * sz} text="ALVO · DADOS" col={RED} o={P(f, b.lockAt, 10) * (1 - P(f, b.repelAt + 30, 10))} size={18} />
        <Tag x={X(CRATE[0])} y={Y(CRATE[1]) + 70 * sz} text="PERDA · PARTE DOS DADOS" col={RED} o={P(f, b.loseAt + 12, 10)} size={22} />
        <Tag x={X(0)} y={Y(-1.2)} text="REBELDES · IGNORAR" col={ICE} o={f >= b.skipAt && f < b.vargaAt ? P(f, b.skipAt, 10) * (1 - P(f, b.vargaAt - 10, 10)) : 0} size={18} />
        {/* rosa dos ventos */}
        <g transform="translate(1790 180)" opacity={0.8}>
          <circle r={30} fill="rgba(5,8,12,0.6)" stroke="#9fb7c4" strokeWidth={1.5} />
          {/* agulha simétrica no centro exato do círculo: norte âmbar, sul cinza */}
          <path d="M 0 -22 L 6.5 0 L -6.5 0 Z" fill={AMB} />
          <path d="M 0 22 L 6.5 0 L -6.5 0 Z" fill="#5f7480" />
          <circle r={2.6} fill="#05080c" stroke="#9fb7c4" strokeWidth={1} />
          <text y={-38} textAnchor="middle" dominantBaseline="central" fill="#9fb7c4" fontFamily={MONO} fontSize={15}>
            N
          </text>
        </g>
      </svg>
      {/* neve fina passando por cima da carta */}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {Array.from({ length: lite ? 40 : 70 }).map((_, i) => {
          const x = ((rnd(i * 7) * 2100 + f * (0.8 + rnd(i) * 1.6)) % 2100) - 90;
          const y = ((rnd(i * 11) * 1200 + f * (1.2 + rnd(i * 3) * 2.4)) % 1200) - 60;
          return <circle key={i} cx={x} cy={y} r={1.4 + rnd(i * 13) * 3.2} fill="#eef4ff" opacity={0.2 + rnd(i * 17) * 0.35} />;
        })}
      </svg>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.6) 100%)", pointerEvents: "none" }} />
      {alarm > 0 ? <AbsoluteFill style={{ boxShadow: `inset 0 0 ${110 + alarm * 50}px rgba(255,40,60,${0.18 + alarm * 0.16})`, pointerEvents: "none" }} /> : null}
      {/* entrada limpa: a linha do feed Overwatch se abre e revela a carta */}
      {f < 38 ? (
        <>
          <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: Math.max(0, 540 - P(f, 0, 34) * 540), background: "#03060a" }} />
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: Math.max(0, 540 - P(f, 0, 34) * 540), background: "#03060a" }} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 539, height: 2, background: AMB, opacity: 0.75 * (1 - P(f, 18, 18)), boxShadow: `0 0 18px ${AMB}` }} />
        </>
      ) : null}
      <div style={{ position: "absolute", left: 90, top: 70, fontFamily: MONO, color: AMB, letterSpacing: 5, fontSize: 22, lineHeight: 1.6, textShadow: "0 2px 6px #000", opacity: P(f, 30, 12) }}>
        <div>RESISTÊNCIA · MAPA TÁTICO</div>
        <div style={{ opacity: 0.7, fontSize: 18 }}>ACAMPAMENTO · NOITE 1 · SETOR 31</div>
      </div>
      {/* a legenda só entra quando o ataque é revelado (contato Combine) */}
      <div style={{ position: "absolute", left: 70, bottom: 64, width: 400, padding: "16px 20px 18px", background: "rgba(3,6,10,0.86)", border: "1px solid rgba(198,247,255,0.25)", borderRadius: 6, color: ICE, fontFamily: MONO, boxShadow: "0 8px 28px rgba(0,0,0,0.35)", opacity: P(f, b.contactAt, 14), transform: `translateX(${(1 - P(f, b.contactAt, 14)) * -40}px)` }}>
        <div style={{ color: ICE, opacity: 0.65, fontSize: 15, letterSpacing: 5, marginBottom: 13 }}>LEGENDA TÁTICA</div>
        {[
          { kind: "lambda", label: "SOLDADOS DA RESISTÊNCIA" },
          { kind: "combine", label: "TROPAS COMBINE" },
          { kind: "vort", label: "VORTIGAUNTS" },
          { kind: "person", label: "PESSOAL IDENTIFICADO" },
          { kind: "data", label: "DADOS · SUPRIMENTOS" },
        ].map((item) => (
          <div key={item.kind} style={{ display: "flex", alignItems: "center", height: 34, gap: 15, fontSize: 15, letterSpacing: 2.2, color: "#d9e8ee" }}>
            <svg width={30} height={30} viewBox="0 0 30 30" style={{ flex: "none" }}>
              {item.kind === "lambda" ? (
                <><circle cx={15} cy={15} r={11} fill="#3a1d08" stroke={AMB} strokeWidth={2} /><text x={15} y={15.5} textAnchor="middle" dominantBaseline="central" fill={AMB} fontFamily={MONO} fontSize={17} fontWeight={700}>λ</text></>
              ) : item.kind === "combine" ? (
                <><path d="M 15 3 L 27 15 L 15 27 L 3 15 Z" fill="#3a0a12" stroke={RED} strokeWidth={2} /><path d="M 10 10 L 20 20 M 20 10 L 10 20" stroke={RED} strokeWidth={2} /></>
              ) : item.kind === "vort" ? (
                <><circle cx={15} cy={15} r={11} fill="#082011" stroke="#8dffa8" strokeWidth={2} /><circle cx={15} cy={15} r={4.5} fill="#8dffa8" /></>
              ) : item.kind === "person" ? (
                <><circle cx={15} cy={15} r={11} fill="#17120b" stroke={AMB} strokeWidth={2} /><circle cx={15} cy={11} r={4} fill={AMB} /><path d="M 8 23 Q 15 14 22 23" fill={AMB} /></>
              ) : (
                <><rect x={4} y={7} width={22} height={17} rx={2} fill="#22262c" stroke={AMB} strokeWidth={2} /><path d="M 11 7 V 4 H 19 V 7" fill="none" stroke={AMB} strokeWidth={2} /><circle cx={15} cy={15.5} r={2.5} fill={AMB} /></>
              )}
            </svg>
            <span>{item.label}</span>
          </div>
        ))}
        {/* o Kleiner não está no acampamento: coordena de White Forest, pelo rádio */}
        <div style={{ display: "flex", alignItems: "center", gap: 15, marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(141,255,168,0.25)", fontSize: 14, letterSpacing: 1.4, color: "#8dffa8", whiteSpace: "nowrap" }}>
          <div style={{ display: "flex", gap: 3, alignItems: "flex-end", width: 30, height: 22 }}>
            {[0, 1, 2, 3].map((k) => (
              <div key={k} style={{ width: 5, height: 6 + k * 5, background: "#8dffa8", opacity: 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(f / 5 + k)) }} />
            ))}
          </div>
          <span>KLEINER · NO RÁDIO · WHITE FOREST</span>
        </div>
      </div>
      <div style={{ position: "absolute", right: 70, bottom: 64, width: 610, opacity: P(f, 34, 12), padding: "16px 22px", background: "rgba(3,6,10,0.88)", border: "1px solid rgba(255,178,46,0.35)", borderRadius: 6, fontFamily: MONO, fontSize: 22, letterSpacing: 2, lineHeight: "34px" }}>
        <div style={{ color: AMB, opacity: 0.7, fontSize: 16, letterSpacing: 5, marginBottom: 6 }}>REGISTRO DA NOITE</div>
        {log.slice(-4).map((l, i, arr) => {
          const n = Math.floor(interpolate(f, [l.at, l.at + 14], [0, l.s.length], C));
          const isLast = i === arr.length - 1;
          return (
            <div key={l.s} style={{ color: l.red ? "#ff8a96" : "#ffd9a0", opacity: isLast ? 1 : 0.5, whiteSpace: "nowrap" }}>
              <span style={{ opacity: 0.6 }}>{l.t} · </span>
              {l.s.slice(0, n)}
              {isLast && n < l.s.length ? <span>▮</span> : null}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// bancada para gerar o retrato do Gordon (fundo verde para recorte): o modelo do HEV (Half-Life: Alyx), de frente
export const HLBadgeBench: React.FC<{ life: number; who?: string }> = ({ who = "gordon" }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#00ff00" }}>
      <Canvas3D f={f} lite={false} fov={22} pos={[0, 1.6, 1.6]} near={0.05} far={50}>
        <BenchScene who={who} />
      </Canvas3D>
    </AbsoluteFill>
  );
};
const BenchScene: React.FC<{ who: string }> = ({ who }) => {
  const { camera, scene } = useThree();
  scene.background = new THREE.Color("#00ff00");
  camera.position.set(0.25, 1.62, 1.55);
  camera.lookAt(0, 1.55, 0);
  return (
    <>
      <hemisphereLight args={["#ffffff", "#606060", 1.4]} />
      <directionalLight position={[-1.2, 2.4, 2.6]} intensity={2.2} />
      <directionalLight position={[3, 2, 2]} intensity={0.8} />
      <Actor t={1.5} parts={[`models/hl3c/${who}.glb`]} clip="idle_subtle" />
    </>
  );
};
