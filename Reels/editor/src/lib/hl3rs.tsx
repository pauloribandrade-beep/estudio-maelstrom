// =================================================================================================
// HL3 · REFORMULAÇÃO · 5A "a estação destruída" (06/10/2026). Planta 3D da estação em wireframe, MODELADA:
// cada sala com móveis e equipamentos, mastro de rádio, tanques, hangar com snowcat e ponte rolante, corredor com
// luminárias e tubos. A câmera faz um plano contínuo: chega rente à neve → sobe para a vista de cima → percorre →
// segue o Gordon → mergulha nas salas trancadas → desce rente à parede dos disparos → as câmeras de segurança
// (o MESMO modelo visto de 4 câmeras do teto, com lente olho-de-peixe), cada grupo atirando num lugar diferente
// contra a mesma assinatura.
// Sem personagem desenhado: soldados = marcadores de unidade; mortos = marcação KIA; a criatura = falha na imagem.
// =================================================================================================
import React, { useMemo } from "react";
import { AbsoluteFill, Easing, interpolate, staticFile, useCurrentFrame } from "remotion";
import { FONT, MONO } from "./overlays";
import { C, HL, rnd } from "./hl3";
import { FilmLook } from "./hl3r";

const ICE = "#9fe6ff";
const RED = "#ff5d4d";
const AMB = "#ffb22e";
const CREAM = "#ffe2b0";
const CYAN = "#5ff3ff";
const TXT = HL.text;
const P = (f: number, at: number, d = 12) => interpolate(f, [at, at + d], [0, 1], { ...C, easing: Easing.out(Easing.cubic) });
const IO = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

// ---------------------------------------------------------------- câmera 3D
export type Cam = { tx: number; ty: number; tz: number; yaw: number; pitch: number; dist: number; F: number; cx?: number; cy?: number; fish?: number };
export const pr = (c: Cam, x: number, y: number, z: number): [number, number, number] => {
  const dx = x - c.tx;
  const dy = y - c.ty;
  const dz = z - c.tz;
  const cy = Math.cos(c.yaw);
  const sy = Math.sin(c.yaw);
  const rx = dx * cy - dy * sy;
  const ry = dx * sy + dy * cy;
  const cp = Math.cos(c.pitch);
  const sp = Math.sin(c.pitch);
  const sY = -ry * sp - dz * cp;
  const depth = c.dist + ry * cp - dz * sp;
  const k = c.F / Math.max(0.5, depth);
  let X = rx * k;
  let Y = sY * k;
  if (c.fish) {
    // lente olho-de-peixe (câmeras de segurança): comprime as bordas
    const r = Math.hypot(X, Y);
    const R = 700;
    const g = r > 0 ? (R * Math.atan(r / R) * (1 + c.fish)) / r / (1 + c.fish * 0.6) : 1;
    X *= g;
    Y *= g;
  }
  return [(c.cx ?? 960) + X, (c.cy ?? 540) + Y, depth];
};
export const PP = (c: Cam, ps: [number, number, number][]) =>
  ps
    .map((p) => pr(c, p[0], p[1], p[2]))
    .map((q) => `${q[0].toFixed(1)},${q[1].toFixed(1)}`)
    .join(" ");
const behind = (c: Cam, x: number, y: number, z: number) => pr(c, x, y, z)[2] < 1.5;

// keyframes de câmera: [quadro, tx, ty, tz, yaw, pitch, dist]
export type Key = [number, number, number, number, number, number, number];
export const camAt = (f: number, keys: Key[]): Cam => {
  let i = 0;
  while (i < keys.length - 2 && f > keys[i + 1][0]) i++;
  const a = keys[i];
  const b = keys[i + 1];
  const t = IO((f - a[0]) / Math.max(1, b[0] - a[0]));
  const m = (j: number) => a[j] + (b[j] - a[j]) * t;
  return { tx: m(1), ty: m(2), tz: m(3), yaw: m(4), pitch: m(5), dist: m(6), F: 1150 };
};

// ---------------------------------------------------------------- o modelo da estação
type Room = { x: number; y: number; w: number; h: number; n: string; ruin?: boolean; door?: [number, number, number, number] };
export const ROOMS: Room[] = [
  { x: -30, y: -20, w: 16, h: 12, n: "LABORATÓRIO", ruin: true },
  { x: -12, y: -20, w: 12, h: 12, n: "RÁDIO" },
  { x: 2, y: -20, w: 12, h: 12, n: "DEPÓSITO", ruin: true },
  { x: 16, y: -20, w: 12, h: 12, n: "ALOJAMENTO" },
  { x: -30, y: -6, w: 58, h: 6, n: "CORREDOR A" },
  { x: -30, y: 2, w: 14, h: 14, n: "GERADOR" },
  { x: -14, y: 2, w: 10, h: 10, n: "SALA 4" },
  { x: -2, y: 2, w: 10, h: 10, n: "SALA 5" },
  { x: 10, y: 2, w: 18, h: 16, n: "HANGAR", ruin: true },
];
const WH = 3; // altura das paredes
// móveis/equipamentos: [x, y, w, h, z0, alt, rótulo?]
type Item = [number, number, number, number, number, number, string?];
const ITEMS: Item[] = [
  // laboratório
  [-28.5, -18.5, 6, 1.4, 0, 1, "BANCADA"],
  [-28.5, -13.5, 6, 1.4, 0, 1],
  [-21.5, -19.4, 2.2, 1, 0, 1.9, "TERMINAL"],
  [-17.5, -11, 2.5, 2, 0, 0.9],
  // rádio
  [-11, -19, 8, 1.6, 0, 1.1, "CONSOLE DE RÁDIO"],
  [-2.6, -18.5, 1.6, 4, 0, 2.6],
  [-10.5, -11.5, 3, 2, 0, 0.8],
  // depósito
  [3, -19.4, 10, 1, 0, 2.2],
  [3, -10, 10, 1, 0, 2.2],
  [4, -16, 1.6, 1.6, 0, 1.6],
  [6.2, -15.6, 1.6, 1.6, 0, 1.6],
  [8.6, -16.2, 1.6, 1.6, 0, 1.6],
  [4.6, -13.6, 1.6, 1.6, 0, 1.6],
  [7.4, -13.4, 1.6, 1.6, 0, 1.6, "CAIXAS DE AMOSTRA"],
  // alojamento
  [17, -19.2, 2, 4.6, 0, 1.6],
  [20, -19.2, 2, 4.6, 0, 1.6],
  [23, -19.2, 2, 4.6, 0, 1.6],
  [17, -12.8, 2, 4.6, 0, 1.6],
  [26.4, -19, 1.2, 7, 0, 2.4],
  // gerador
  [-29, 13, 12, 2, 0, 1.2],
  // sala 4 / sala 5
  [-12, 5, 5, 2, 0, 0.9],
  [-13.4, 10.6, 1.2, 1, 0, 2.2],
  [0, 5, 5, 2, 0, 0.9],
  [6.2, 9, 1.2, 2.6, 0, 2.2],
  // hangar: snowcat
  [13, 6, 7, 4, 0.6, 2.2, "SNOWCAT"],
  [19, 13, 3, 3, 0, 1.4],
  [23, 13.5, 3, 2, 0, 1.4],
];
// cilindros: [x, y, raio, alt, rótulo?]
const CYLS: [number, number, number, number, string?][] = [
  [-23, 8.5, 3, 3, "GERADOR 2"],
  [-17.8, -16.2, 1.3, 2.3],
  [-36.5, 5, 2, 2.4],
  [-36.5, 11, 2, 2.4],
];
// barricadas Combine no corredor: [x, y, ângulo]
export const BARR: [number, number, number][] = [
  [-15, -3, 0.6],
  [-13, -4.5, -0.4],
  [5, -3.4, 0.5],
  [22.5, -2.6, -0.7],
];
const EMBL: [number, number][] = [
  [-22, -3],
  [14, -3],
  [19, 9],
  [-8, -14],
];
const KIA: [number, number, string?][] = [
  [-26, -3.4, "KIA · OTA-03"],
  [-9.5, -2.2],
  [1.5, -4.2],
  [11.5, -3.2, "KIA · OTA-11"],
  [20, -4.4],
  [16, 10.5],
];
const LOCKED_KIA: [number, number][] = [
  [-10.5, 8],
  [-7, 5.8],
  [2.6, 8.4],
];
const HOLES: [number, number][] = [
  [10.2, 1.3], [10.9, 1.9], [11.3, 1.1], [11.8, 2.3], [12.6, 1.6], [13.4, 2.1], [13.9, 1.2], [14.7, 1.8],
  [15.3, 2.5], [16.1, 1.4], [16.8, 2.0], [17.6, 1.6],
];

const SNOW = Array.from({ length: 160 }).map((_, i) => ({ x: rnd(i * 2.1) * 2100, y: rnd(i * 3.3) * 1160, k: rnd(i * 5.7) }));
const wallCol = (ruin: boolean, a = 1) => (ruin ? `rgba(255,93,77,${0.75 * a})` : `rgba(159,230,255,${0.7 * a})`);

// desenha a estação vista pela câmera `c`. `t` = tempos (quadros) dos estados; `lite` para as câmeras de segurança.
export type St = { f: number; build: (i: number) => number; ruin: number; marks: number; gear: number; bodies: number; lock: number; holes: number; lite?: boolean };
export const Station: React.FC<{ c: Cam; s: St }> = ({ c, s }) => {
  const { f } = s;
  const out: React.ReactNode[] = [];
  const line = (k: string, ps: [number, number, number][], col: string, w = 1.4, o = 1, dash?: string) => {
    if (ps.some((p) => behind(c, p[0], p[1], p[2]))) return;
    out.push(<polyline key={k} points={PP(c, ps)} fill="none" stroke={col} strokeWidth={w} opacity={o} strokeDasharray={dash} strokeLinejoin="round" />);
  };
  const poly = (k: string, ps: [number, number, number][], fill: string, stroke?: string, w = 1) => {
    if (ps.some((p) => behind(c, p[0], p[1], p[2]))) return;
    out.push(<polygon key={k} points={PP(c, ps)} fill={fill} stroke={stroke} strokeWidth={w} />);
  };
  const box = (k: string, x: number, y: number, w: number, h: number, z0: number, d: number, col: string, fill: string) => {
    const b: [number, number, number][] = [[x, y, z0], [x + w, y, z0], [x + w, y + h, z0], [x, y + h, z0]];
    const t: [number, number, number][] = b.map((p) => [p[0], p[1], z0 + d]);
    poly(k + "t", t, fill);
    line(k + "b", [...b, b[0]], col, 1, 0.6);
    line(k + "u", [...t, t[0]], col, 1.2, 0.9);
    for (let i = 0; i < 4; i++) line(k + "v" + i, [b[i], t[i]], col, 1, 0.6);
  };
  const cyl = (k: string, x: number, y: number, r: number, d: number, col: string) => {
    const N = 16;
    const ring = (z: number) => Array.from({ length: N + 1 }).map((_, i) => [x + r * Math.cos((i / N) * Math.PI * 2), y + r * Math.sin((i / N) * Math.PI * 2), z] as [number, number, number]);
    poly(k + "t", ring(d).slice(0, N), "rgba(159,230,255,0.05)");
    line(k + "b", ring(0), col, 1, 0.55);
    line(k + "u", ring(d), col, 1.3, 0.9);
    line(k + "m", ring(d * 0.5), col, 0.8, 0.35);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + 0.4;
      line(k + "v" + i, [[x + r * Math.cos(a), y + r * Math.sin(a), 0], [x + r * Math.cos(a), y + r * Math.sin(a), d]], col, 0.8, 0.45);
    }
  };
  // chão: grade e neve
  if (!s.lite) {
    for (let i = 0; i <= 22; i++) line("gx" + i, [[-55 + i * 5, -40, 0], [-55 + i * 5, 34, 0]], "rgba(159,230,255,0.05)", 1);
    for (let i = 0; i <= 15; i++) line("gy" + i, [[-55, -40 + i * 5, 0], [55, -40 + i * 5, 0]], "rgba(159,230,255,0.05)", 1);
    // marcas de neve acumulada (linhas onduladas fora da estação)
    for (let i = 0; i < 9; i++) {
      const y0 = -36 + i * 8.5;
      const ps: [number, number, number][] = Array.from({ length: 14 }).map((_, k) => [-52 + k * 8, y0 + Math.sin(k * 1.3 + i) * 1.2, 0]);
      line("sn" + i, ps, "rgba(220,240,250,0.07)", 1.2);
    }
    // cerca do perímetro
    for (let i = 0; i < 24; i++) {
      const x = -44 + i * 4;
      line("fp" + i, [[x, -30, 0], [x, -30, 1.4]], "rgba(159,230,255,0.25)", 1);
    }
    line("fw", [[-44, -30, 1.2], [48, -30, 1.2]], "rgba(159,230,255,0.18)", 1);
  }
  // salas (paredes com a altura subindo)
  ROOMS.forEach((r, i) => {
    const b = s.build(i);
    if (b <= 0) return;
    const ruin = !!r.ruin && s.ruin > 0;
    const col = ruin ? `rgba(255,${Math.round(93 + (230 - 93) * (1 - s.ruin))},${Math.round(77 + (255 - 77) * (1 - s.ruin))},0.8)` : wallCol(false);
    const z = WH * b;
    const fl: [number, number, number][] = [[r.x, r.y, 0], [r.x + r.w, r.y, 0], [r.x + r.w, r.y + r.h, 0], [r.x, r.y + r.h, 0]];
    poly("rf" + i, fl, ruin ? `rgba(255,93,77,${0.04 + 0.05 * s.ruin})` : "rgba(159,230,255,0.035)");
    // paredes: faces translúcidas (dá volume)
    for (let k = 0; k < 4; k++) {
      const p0 = fl[k];
      const p1 = fl[(k + 1) % 4];
      // parede derrubada: nas salas destruídas, um trecho cai
      if (ruin && k === 2 && s.ruin > 0) {
        const mx = (p0[0] + p1[0]) / 2;
        const tilt = s.ruin * 1.0;
        const top = z * (1 - 0.65 * tilt);
        poly("rw" + i + k, [p0, [mx - 1, p0[1], 0], [mx - 1, p0[1] + tilt * 1.6, top], [p0[0], p0[1], z]], "rgba(255,93,77,0.05)", "rgba(255,93,77,0.6)");
        line("rw2" + i + k, [[mx + 1.5, p1[1], 0], [p1[0], p1[1], 0], [p1[0], p1[1], z], [mx + 1.5, p1[1], z * 0.45]], col, 1.2);
        continue;
      }
      poly("rw" + i + k, [p0, p1, [p1[0], p1[1], z], [p0[0], p0[1], z]], ruin ? "rgba(255,93,77,0.035)" : "rgba(159,230,255,0.03)");
      line("re" + i + k, [[p0[0], p0[1], z], [p1[0], p1[1], z]], col, 1.5, 0.95, ruin ? "10 6 3 7" : undefined);
      line("rv" + i + k, [p0, [p0[0], p0[1], z]], col, 1.1, 0.6);
    }
    line("rb" + i, [...fl, fl[0]], col, 1.6, 0.9);
    // nome da sala
    if (!s.lite) {
      const q = pr(c, r.x + r.w / 2, r.y + r.h / 2, 0.05);
      if (q[2] > 2)
        out.push(
          <text key={"rn" + i} x={q[0]} y={q[1]} textAnchor="middle" fill={ruin ? "#ff8d80" : ICE} fontFamily={MONO} fontSize={Math.max(10, Math.min(20, 900 / q[2]))} letterSpacing={3} opacity={0.8 * b}>
            {r.n}
          </text>,
        );
    }
  });
  const built = s.build(ROOMS.length);
  if (built > 0) {
    // móveis / equipamentos
    ITEMS.forEach((it, i) => {
      const [x, y, w, h, z0, d] = it;
      box("it" + i, x, y, w, h, z0, d * built, "rgba(159,230,255,0.55)", "rgba(159,230,255,0.06)");
    });
    // esteiras do snowcat
    line("tr1", [[12.6, 5.6, 0.1], [20.4, 5.6, 0.1], [20.4, 6.6, 0.6], [12.6, 6.6, 0.6], [12.6, 5.6, 0.1]], "rgba(159,230,255,0.55)", 1.2, built);
    line("tr2", [[12.6, 9.4, 0.1], [20.4, 9.4, 0.1], [20.4, 10.4, 0.6], [12.6, 10.4, 0.6], [12.6, 9.4, 0.1]], "rgba(159,230,255,0.55)", 1.2, built);
    CYLS.forEach(([x, y, r, d], i) => cyl("cy" + i, x, y, r, d * built, "rgba(159,230,255,0.6)"));
    // ponte rolante do hangar
    line("cr1", [[11, 3, 0], [11, 3, 4.6], [27, 3, 4.6], [27, 3, 0]], "rgba(159,230,255,0.5)", 1.4, built);
    line("cr2", [[11, 17, 0], [11, 17, 4.6], [27, 17, 4.6], [27, 17, 0]], "rgba(159,230,255,0.5)", 1.4, built);
    line("cr3", [[17 + 4 * Math.sin(f / 90), 3, 4.6], [17 + 4 * Math.sin(f / 90), 17, 4.6]], "rgba(159,230,255,0.7)", 2, built);
    // luminárias e tubos do corredor
    for (let i = 0; i < 9; i++) {
      const x = -27 + i * 6.5;
      const broken = rnd(i * 4.1) > 0.6 && s.ruin > 0;
      const lit = broken ? (rnd(Math.floor(f / 3) + i) > 0.7 ? 1 : 0.15) : 1;
      line("lm" + i, [[x, -3.6, WH - 0.1], [x + 1.6, -3.6, WH - 0.1]], `rgba(255,236,190,${0.85 * lit})`, 3, built);
    }
    line("pp1", [[-30, -5.6, 2.5], [28, -5.6, 2.5]], "rgba(159,230,255,0.35)", 2, built);
    line("pp2", [[-30, -5.2, 2.2], [28, -5.2, 2.2]], "rgba(159,230,255,0.25)", 1.2, built);
    if (!s.lite) {
      // mastro de rádio (treliça) com luz piscando
      const mx = -6;
      const my = -25;
      const H = 15 * built;
      line("ma1", [[mx - 0.8, my - 0.8, 0], [mx, my, H]], "rgba(159,230,255,0.55)", 1.2);
      line("ma2", [[mx + 0.8, my - 0.8, 0], [mx, my, H]], "rgba(159,230,255,0.55)", 1.2);
      line("ma3", [[mx, my + 0.9, 0], [mx, my, H]], "rgba(159,230,255,0.55)", 1.2);
      for (let k = 1; k < 7; k++) {
        const z = (k / 7) * H;
        const w = 0.8 * (1 - k / 7);
        line("mb" + k, [[mx - w, my - w, z], [mx + w, my - w, z], [mx, my + w, z], [mx - w, my - w, z]], "rgba(159,230,255,0.35)", 0.9);
      }
      const tip = pr(c, mx, my, H + 0.3);
      if (tip[2] > 2) out.push(<circle key="mlight" cx={tip[0]} cy={tip[1]} r={4} fill={RED} opacity={Math.floor(f / 18) % 2 ? 1 : 0.2} />);
      line("mw", [[mx, my, H * 0.9], [-6, -20, WH]], "rgba(159,230,255,0.25)", 1, 1, "3 4");
    }
  }
  // destruição: entulho, queimado, faíscas
  if (s.ruin > 0) {
    ROOMS.forEach((r, i) => {
      if (!r.ruin) return;
      for (let k = 0; k < 7; k++) {
        const x = r.x + 1 + rnd(i * 13 + k) * (r.w - 2);
        const y = r.y + r.h - 0.4 - rnd(i * 7 + k * 3) * 3.4;
        const sz = 0.5 + rnd(k * 5 + i) * 0.9;
        const fall = Math.min(1, s.ruin * 1.4 - k * 0.05);
        if (fall <= 0) continue;
        box("db" + i + k, x, y, sz, sz * 0.7, 0, sz * 0.5 * fall, "rgba(255,141,128,0.7)", "rgba(255,93,77,0.08)");
      }
      // queimado (mancha no chão)
      const cx = r.x + r.w * 0.55;
      const cy = r.y + r.h * 0.45;
      const ring: [number, number, number][] = Array.from({ length: 14 }).map((_, k) => {
        const a = (k / 14) * Math.PI * 2;
        const rr = (2.4 + rnd(k + i) * 1.4) * s.ruin;
        return [cx + rr * Math.cos(a), cy + rr * 0.8 * Math.sin(a), 0.02];
      });
      poly("sc" + i, ring, "rgba(20,4,2,0.55)", "rgba(255,93,77,0.25)");
      // faíscas de um fio solto
      if (!s.lite) {
        const sp = pr(c, r.x + r.w - 1.2, r.y + 1, WH - 0.2);
        const burst = (f + i * 17) % 40 < 6;
        if (burst && sp[2] > 2)
          for (let k = 0; k < 6; k++) {
            const a = rnd(k + Math.floor(f / 2) + i) * Math.PI;
            const l = 6 + rnd(k * 3 + f) * 16;
            out.push(<line key={`sp${i}${k}`} x1={sp[0]} y1={sp[1]} x2={sp[0] + Math.cos(a) * l} y2={sp[1] + Math.sin(a) * l} stroke="#ffe9a8" strokeWidth={1.6} />);
          }
      }
    });
  }
  // marcas Combine: barricadas (painéis inclinados com faixa de luz) e emblemas no chão
  if (s.marks > 0) {
    BARR.forEach(([x, y, a], i) => {
      const m = Math.max(0, Math.min(1, s.marks * 1.6 - i * 0.18));
      if (m <= 0) return;
      const dx = Math.cos(a) * 1.8;
      const dy = Math.sin(a) * 1.8;
      const h = 2.2 * m;
      const q: [number, number, number][] = [[x - dx, y - dy, 0], [x + dx, y + dy, 0], [x + dx, y + dy, h], [x - dx, y - dy, h]];
      poly("ba" + i, q, "rgba(6,12,16,0.9)", "rgba(95,243,255,0.65)", 1.3);
      line("bl" + i, [[x - dx * 0.8, y - dy * 0.8, h * 0.78], [x + dx * 0.8, y + dy * 0.8, h * 0.78]], CYAN, 2.4, 0.6 + 0.4 * Math.sin(f / 5 + i));
    });
    EMBL.forEach(([x, y], i) => {
      const m = Math.max(0, Math.min(1, s.marks * 1.6 - 0.3 - i * 0.15));
      if (m <= 0) return;
      const hex: [number, number, number][] = Array.from({ length: 7 }).map((_, k) => [x + 1.5 * m * Math.cos((k / 6) * Math.PI * 2 + 0.5), y + 1.5 * m * Math.sin((k / 6) * Math.PI * 2 + 0.5), 0.04]);
      line("eh" + i, hex, RED, 2, 0.9);
      line("ec" + i, [[x - 0.8 * m, y - 0.3, 0.04], [x, y + 0.6 * m, 0.04], [x + 0.8 * m, y - 0.3, 0.04]], RED, 2.2, 0.9);
    });
  }
  // mortos (marcação no chão)
  if (s.bodies > 0) {
    KIA.forEach(([x, y], i) => {
      const m = Math.max(0, Math.min(1, s.bodies * 1.8 - i * 0.16));
      if (m <= 0) return;
      const ring: [number, number, number][] = Array.from({ length: 12 }).map((_, k) => [x + 1.1 * m * Math.cos((k / 12) * Math.PI * 2), y + 0.7 * m * Math.sin((k / 12) * Math.PI * 2), 0.03]);
      poly("kp" + i, ring, "rgba(120,10,6,0.55)");
      line("kx1" + i, [[x - 0.5, y - 0.5, 0.05], [x + 0.5, y + 0.5, 0.05]], RED, 2.2, m);
      line("kx2" + i, [[x + 0.5, y - 0.5, 0.05], [x - 0.5, y + 0.5, 0.05]], RED, 2.2, m);
    });
  }
  // salas trancadas por dentro: os mortos lá dentro
  if (s.lock > 0) {
    LOCKED_KIA.forEach(([x, y], i) => {
      const m = Math.max(0, Math.min(1, s.lock * 2 - i * 0.3));
      if (m <= 0) return;
      const ring: [number, number, number][] = Array.from({ length: 12 }).map((_, k) => [x + 1.1 * Math.cos((k / 12) * Math.PI * 2), y + 0.7 * Math.sin((k / 12) * Math.PI * 2), 0.03]);
      poly("lk" + i, ring, `rgba(160,14,8,${0.6 * m})`);
      line("lkx1" + i, [[x - 0.6, y - 0.6, 0.05], [x + 0.6, y + 0.6, 0.05]], RED, 3, m);
      line("lkx2" + i, [[x + 0.6, y - 0.6, 0.05], [x - 0.6, y + 0.6, 0.05]], RED, 3, m);
    });
  }
  // furos de bala na parede sul do corredor (y = 0)
  if (s.holes > 0) {
    HOLES.forEach(([x, z], i) => {
      if (i >= s.holes) return;
      const p = pr(c, x, 0, z);
      if (p[2] < 1.5) return;
      const k = Math.min(3, 60 / p[2]);
      out.push(
        <g key={"ho" + i}>
          <circle cx={p[0]} cy={p[1]} r={4 * k} fill="#020304" stroke="rgba(255,226,176,0.8)" strokeWidth={1} />
          {[0, 1, 2, 3].map((j) => {
            const a = rnd(i * 4 + j) * Math.PI * 2;
            return <line key={j} x1={p[0] + Math.cos(a) * 4 * k} y1={p[1] + Math.sin(a) * 4 * k} x2={p[0] + Math.cos(a) * 11 * k} y2={p[1] + Math.sin(a) * 11 * k} stroke="rgba(255,226,176,0.55)" strokeWidth={1} />;
          })}
        </g>,
      );
    });
  }
  return <>{out}</>;
};

// a criatura nas câmeras: uma falha na imagem (fatias deslocadas), sem rosto
export const Glitch: React.FC<{ f: number; x: number; y: number; s: number; seed: number }> = ({ f, x, y, s, seed }) => {
  const on = rnd(Math.floor(f / 2) * 3.1 + seed) > 0.18;
  return (
    <g opacity={on ? 1 : 0.25}>
      {Array.from({ length: 9 }).map((_, k) => {
        const yy = y - 60 * s + k * 13 * s;
        const w = (10 + 14 * Math.sin((k / 8) * Math.PI)) * s;
        const off = (rnd(k * 3.7 + Math.floor(f / 2) + seed) - 0.5) * 26 * s;
        return <rect key={k} x={x - w / 2 + off} y={yy} width={w} height={9 * s} fill={k % 3 === 0 ? "#ff3df0" : "#e8fbff"} opacity={0.85} />;
      })}
    </g>
  );
};

// ---------------------------------------------------------------- a cena
type Props = {
  life: number;
  stationAt?: number;
  ruinAt?: number;
  markAt?: number;
  gearAt?: number;
  bodyAt?: number;
  hypAt?: number;
  deepAt?: number;
  crackAt?: number;
  lockAt?: number;
  shotsAt?: number;
  nobodyAt?: number;
  camAt?: number;
  fireAt?: number;
  sameAt?: number;
};
export const HLRStation: React.FC<Props> = (p) => {
  const f = useCurrentFrame();
  const a = (v?: number) => v ?? 1e9;
  const [stationAt, ruinAt, markAt, gearAt, bodyAt, hypAt, deepAt, crackAt, lockAt, shotsAt, nobodyAt, camAt, fireAt, sameAt] = [p.stationAt, p.ruinAt, p.markAt, p.gearAt, p.bodyAt, p.hypAt, p.deepAt, p.crackAt, p.lockAt, p.shotsAt, p.nobodyAt, p.camAt, p.fireAt, p.sameAt].map(a);
  const life = p.life;
  // o Gordon: entra pelo oeste e anda pelo corredor
  const gx = interpolate(f, [deepAt, lockAt, shotsAt], [-36, -8, 11], { ...C, easing: Easing.inOut(Easing.quad) });
  const gy = -3;
  // câmera contínua
  const keys: Key[] = [
    [0, 0, -4, 0, -0.1, 0.3, 105],
    [stationAt, 0, -4, 0, -0.32, 0.62, 118],
    [ruinAt, -2, -3, 0, -0.45, 0.92, 92],
    [bodyAt, -6, -4, 0, -0.58, 0.95, 78],
    [hypAt + 20, 2, -2, 0, -0.7, 0.98, 100],
    [deepAt, 2, -2, 0, -0.72, 0.98, 100],
    [deepAt + 50, gx < -20 ? -20 : gx, -3, 0, -0.52, 0.86, 58],
    [lockAt, -6, 1, 0, -0.42, 0.86, 54],
    [lockAt + 26, -4, 6, 0, -0.28, 0.78, 34],
    [shotsAt, -4, 6, 0, -0.28, 0.78, 34],
    [shotsAt + 26, 13.5, -3.5, 1.6, 0.0, 0.16, 15],
    [camAt, 13.5, -3.5, 1.6, 0.06, 0.18, 14],
    [life, 13.5, -3.5, 1.6, 0.08, 0.18, 14],
  ];
  const cam = camAt0(f, keys, deepAt, lockAt, gx);
  const st: St = {
    f,
    build: (i) => P(f, 12 + i * ((stationAt - 4) / 10), 26),
    ruin: P(f, ruinAt, 26),
    marks: P(f, markAt, 30),
    gear: P(f, gearAt, 20),
    bodies: P(f, bodyAt, 30),
    lock: P(f, lockAt + 24, 24),
    holes: 0,
  };
  const cctv = P(f, camAt, 10);
  const hyp = P(f, hypAt, 12);
  const crack = f >= crackAt;
  const gp = pr(cam, gx, gy, 0.1);
  const gp2 = pr(cam, gx + 1, gy, 0.1);
  const gAng = (Math.atan2(gp2[1] - gp[1], gp2[0] - gp[0]) * 180) / Math.PI;
  // callouts dos equipamentos
  const CALL: { at: number; w: [number, number, number]; t: string; s: string; side: number }[] = [
    { at: gearAt, w: [-20.4, -18.9, 1.9], t: "TERMINAL", s: "LABORATÓRIO · TELA QUEBRADA", side: 0 },
    { at: gearAt + 7, w: [-7, -18.2, 1.1], t: "CONSOLE DE RÁDIO", s: "ÚLTIMA TRANSMISSÃO · 02:11", side: 0 },
    { at: gearAt + 14, w: [8.2, -12.6, 1.6], t: "CAIXAS DE AMOSTRA", s: "DEPÓSITO · LACRADAS", side: 1 },
    { at: gearAt + 21, w: [16.5, 8, 2.8], t: "SNOWCAT", s: "HANGAR · MOTOR FRIO", side: 1 },
    { at: gearAt + 28, w: [-23, 8.5, 3], t: "GERADOR 2", s: "DESLIGADO", side: 0 },
  ];
  const wall = P(f, shotsAt + 4, 10) * (1 - cctv);
  const showMap = (1 - cctv) * (1 - wall);
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 55%, #08131a 0%, #020507 78%)", overflow: "hidden" }}>
      {showMap > 0 ? (
        <AbsoluteFill style={{ opacity: showMap }}>
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
            <Station c={cam} s={st} />
            {/* rotas dos esquadrões (a hipótese): chegam de fora e entram */}
            {f >= hypAt
              ? [
                  [[46, 9, 0.2], [28.5, 9, 0.2], [20, -3, 0.2], [0, -3, 0.2]],
                  [[-50, -3, 0.2], [-30, -3, 0.2], [-14, -3, 0.2]],
                  [[30, -32, 0.2], [22, -21, 0.2], [22, -6, 0.2]],
                ].map((r, i) => {
                  const e = P(f, hypAt + 6 + i * 8, 40);
                  const pts = r as [number, number, number][];
                  const proj = pts.map((q) => pr(cam, q[0], q[1], q[2]));
                  let len = 0;
                  for (let k = 1; k < proj.length; k++) len += Math.hypot(proj[k][0] - proj[k - 1][0], proj[k][1] - proj[k - 1][1]);
                  return (
                    <g key={"sq" + i} opacity={crack ? 0.25 : 0.95}>
                      <polyline points={PP(cam, pts)} fill="none" stroke={AMB} strokeWidth={3} strokeDasharray={`${len * e} ${len}`} />
                      <polyline points={PP(cam, pts)} fill="none" stroke={AMB} strokeWidth={10} opacity={0.12} strokeDasharray={`${len * e} ${len}`} />
                      {e > 0.98 ? (() => {
                        const z = proj[proj.length - 1];
                        const y0 = proj[proj.length - 2];
                        const ang = (Math.atan2(z[1] - y0[1], z[0] - y0[0]) * 180) / Math.PI;
                        return <path d="M 0 -9 L 16 0 L 0 9 Z" fill={AMB} transform={`translate(${z[0]} ${z[1]}) rotate(${ang})`} />;
                      })() : null}
                    </g>
                  );
                })
              : null}
            {/* o Gordon: seta apontando para onde ele anda + rastro */}
            {f >= deepAt - 10 ? (
              <g opacity={P(f, deepAt - 10, 10) * (1 - P(f, shotsAt + 10, 12))}>
                <polyline points={PP(cam, [[-36, gy, 0.1], [Math.max(-36, gx), gy, 0.1]])} stroke={AMB} strokeWidth={2} strokeDasharray="4 6" opacity={0.6} fill="none" />
                <g transform={`translate(${gp[0]} ${gp[1]}) rotate(${gAng})`}>
                  <circle r={24 + 3 * Math.sin(f / 5)} fill="none" stroke={AMB} strokeWidth={1.5} opacity={0.45} />
                  <path d="M 16 0 L -10 -11 L -5 0 L -10 11 Z" fill={AMB} />
                </g>
                <text x={gp[0] + 26} y={gp[1] - 22} fill={AMB} fontFamily={MONO} fontSize={16} letterSpacing={3}>
                  GORDON
                </text>
              </g>
            ) : null}
            {/* callouts com linha */}
            {CALL.map((c, i) => {
              if (f < c.at || f > hypAt + 10) return null;
              const e = P(f, c.at, 12);
              const q = pr(cam, c.w[0], c.w[1], c.w[2]);
              const lx = c.side ? 1560 : 360;
              const same = CALL.filter((o) => o.side === c.side).map((o) => ({ o, y: pr(cam, o.w[0], o.w[1], o.w[2])[1] })).sort((u, v) => u.y - v.y);
              const ly = 230 + same.findIndex((u) => u.o === c) * 135;
              const mid = c.side ? lx - 60 : lx + 60;
              return (
                <g key={"cl" + i} opacity={e * (1 - P(f, hypAt, 10))}>
                  <circle cx={q[0]} cy={q[1]} r={5} fill={CREAM} />
                  <circle cx={q[0]} cy={q[1]} r={12 + 6 * (1 - e)} fill="none" stroke={CREAM} strokeWidth={1.2} />
                  <polyline points={`${q[0]},${q[1]} ${mid},${ly} ${lx},${ly}`} fill="none" stroke={CREAM} strokeWidth={1.2} opacity={0.7} strokeDasharray={`${2000 * e} 2000`} />
                  <text x={lx + (c.side ? 10 : -10)} y={ly - 8} textAnchor={c.side ? "start" : "end"} fill={TXT} fontFamily={FONT} fontWeight={800} fontSize={26}>
                    {c.t}
                  </text>
                  <text x={lx + (c.side ? 10 : -10)} y={ly + 20} textAnchor={c.side ? "start" : "end"} fill={CREAM} fontFamily={MONO} fontSize={14} letterSpacing={3} opacity={0.8}>
                    {c.s}
                  </text>
                </g>
              );
            })}
            {/* KIA: etiquetas */}
            {f >= bodyAt && f < hypAt + 10
              ? KIA.filter((k) => k[2]).map(([x, y, t], i) => {
                  const q = pr(cam, x, y, 0.1);
                  return (
                    <g key={"kt" + i} opacity={P(f, bodyAt + 10 + i * 8, 10) * (1 - P(f, hypAt, 10))}>
                      <line x1={q[0]} y1={q[1]} x2={q[0] + 40} y2={q[1] - 40} stroke={RED} strokeWidth={1.2} />
                      <text x={q[0] + 46} y={q[1] - 44} fill={RED} fontFamily={MONO} fontSize={15} letterSpacing={3}>
                        {t}
                      </text>
                    </g>
                  );
                })
              : null}
            {/* salas trancadas: cadeado na porta, por dentro */}
            {f >= lockAt
              ? [
                  [-9, 2],
                  [3, 2],
                ].map(([x, y], i) => {
                  const q = pr(cam, x, y, 1.2);
                  const e = P(f, lockAt + 8 + i * 8, 10);
                  const rattle = f - (lockAt + 8 + i * 8) < 14 ? Math.sin(f * 2.4) * 4 : 0;
                  return (
                    <g key={"lc" + i} opacity={e * (1 - P(f, shotsAt + 6, 10))} transform={`translate(${q[0] + rattle} ${q[1]})`}>
                      <rect x={-22} y={-8} width={44} height={36} rx={6} fill="#05090c" stroke={AMB} strokeWidth={3} />
                      <path d="M -14 -8 L -14 -22 A 14 14 0 0 1 14 -22 L 14 -8" fill="none" stroke={AMB} strokeWidth={3} />
                      <circle cx={0} cy={8} r={4} fill={AMB} />
                    </g>
                  );
                })
              : null}
            {/* disparos: traçantes vindos de lugar nenhum, clarão no impacto */}
            {f >= shotsAt + 20 && f < camAt
              ? HOLES.map(([x, z], i) => {
                  const t0 = shotAt(shotsAt, i);
                  if (f < t0 || f > t0 + 5) return null;
                  const q = pr(cam, x, 0, z);
                  const o = pr(cam, x - 3 + rnd(i) * 6, -5.5, 1.2 + rnd(i * 3) * 0.8);
                  return (
                    <g key={"tz" + i}>
                      <line x1={o[0]} y1={o[1]} x2={q[0]} y2={q[1]} stroke="#ffd27a" strokeWidth={3} opacity={1 - (f - t0) / 5} />
                      <circle cx={q[0]} cy={q[1]} r={18 * (1 - (f - t0) / 5) + 4} fill="#fff4cc" opacity={0.9 * (1 - (f - t0) / 5)} />
                    </g>
                  );
                })
              : null}
          </svg>
          {/* cabeçalho */}
          <div style={{ position: "absolute", left: 70, top: 56, fontFamily: MONO, color: ICE, letterSpacing: 6, opacity: P(f, stationAt - 20, 14) * (1 - P(f, shotsAt, 14)) }}>
            <div style={{ fontSize: 22 }}>H.E.V. · VARREDURA · ESTAÇÃO DE PESQUISA</div>
            <div style={{ fontSize: 16, opacity: 0.7, marginTop: 6 }}>ÚLTIMO POSTO CONHECIDO · DRA. MOSSMAN</div>
          </div>
          {/* contadores da varredura */}
          {f >= ruinAt && f < hypAt + 10 ? (
            <div style={{ position: "absolute", left: 70, bottom: 70, display: "flex", gap: 44, fontFamily: MONO, opacity: P(f, ruinAt, 10) * (1 - P(f, hypAt, 10)) }}>
              {[
                { l: "ESTRUTURA", v: `${Math.round(100 - 38 * P(f, ruinAt, 30))}%`, c: RED, at: ruinAt },
                { l: "MARCAS COMBINE", v: String(Math.round(8 * P(f, markAt, 30))), c: CYAN, at: markAt },
                { l: "EQUIPAMENTOS", v: String(Math.round(14 * P(f, gearAt, 30))), c: CREAM, at: gearAt },
                { l: "KIA", v: String(Math.round(6 * P(f, bodyAt, 30))), c: RED, at: bodyAt },
              ].map((x) => (
                <div key={x.l} style={{ opacity: P(f, x.at, 8) }}>
                  <div style={{ fontSize: 14, letterSpacing: 4, color: "rgba(242,240,247,0.6)" }}>{x.l}</div>
                  <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 52, color: x.c, lineHeight: 1.05 }}>{x.v}</div>
                </div>
              ))}
            </div>
          ) : null}
          {/* a hipótese (vidro), depois rachada */}
          {f >= hypAt && f < lockAt + 20 ? (
            <div style={{ position: "absolute", right: 80, top: 150, width: 540, padding: "22px 26px", background: "rgba(6,12,16,0.72)", border: `1px solid ${crack ? RED : "rgba(255,178,46,0.6)"}`, borderRadius: 16, boxShadow: "0 20px 60px rgba(0,0,0,0.5)", opacity: hyp * (1 - P(f, lockAt + 4, 14)), transform: `translateY(${(1 - hyp) * 30}px)` }}>
              <div style={{ fontFamily: MONO, fontSize: 15, letterSpacing: 6, color: crack ? RED : AMB }}>HIPÓTESE</div>
              <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 38, lineHeight: 1.08, color: TXT, marginTop: 10, opacity: crack ? 0.45 : 1 }}>Os Combine chegaram depois da transmissão e tomaram a estação.</div>
              <div style={{ fontFamily: MONO, fontSize: 18, letterSpacing: 5, color: crack ? RED : "#8dffa8", marginTop: 14 }}>{crack ? "NÃO FECHA" : "PROVÁVEL"}</div>
              {crack ? (
                <svg width={540} height={260} style={{ position: "absolute", left: 0, top: 0 }}>
                  <polyline points="300,0 286,58 318,96 274,150 300,206 282,260" fill="none" stroke={RED} strokeWidth={2.5} strokeDasharray={`${400 * P(f, crackAt, 8)} 400`} />
                  <polyline points="318,96 380,118 430,104" fill="none" stroke={RED} strokeWidth={1.5} strokeDasharray={`${200 * P(f, crackAt + 4, 8)} 200`} />
                </svg>
              ) : null}
            </div>
          ) : null}
          {/* legendas das descobertas */}
          {f >= lockAt + 24 && f < shotsAt + 6 ? (
            <div style={{ position: "absolute", left: 80, bottom: 80, opacity: P(f, lockAt + 24, 10) * (1 - P(f, shotsAt, 8)) }}>
              <div style={{ fontFamily: MONO, fontSize: 16, letterSpacing: 6, color: AMB }}>SALAS 4 E 5 · TRANCADAS POR DENTRO</div>
              <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 56, color: TXT, lineHeight: 1.05 }}>3 soldados mortos lá dentro</div>
            </div>
          ) : null}
          {false ? (
            <div style={{ position: "absolute", left: 80, bottom: 80, opacity: P(f, shotsAt + 30, 10) }}>
              <div style={{ fontFamily: MONO, fontSize: 16, letterSpacing: 6, color: RED }}>CORREDOR A · PAREDE SUL</div>
              <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 56, color: TXT, lineHeight: 1.05 }}>{HOLES.filter((_, i) => f >= shotAt(shotsAt, i)).length} impactos{f >= nobodyAt ? " · ninguém do outro lado" : ""}</div>
            </div>
          ) : null}
          {/* neve e vento por cima da planta (lá fora) */}
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: 1 - P(f, lockAt, 20) * 0.85 }}>
            {SNOW.map((n, i) => {
              const x = (((n.x + f * (2.2 + n.k * 3)) % 2100) + 2100) % 2100 - 90;
              const y = (((n.y + f * (1.2 + n.k * 2.4)) % 1160) + 1160) % 1160 - 40;
              return <line key={i} x1={x} y1={y} x2={x + 6 + n.k * 10} y2={y + 3 + n.k * 5} stroke="#e6f6ff" strokeWidth={0.8 + n.k * 1.6} opacity={0.18 + 0.4 * n.k} strokeLinecap="round" />;
            })}
          </svg>
          <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(159,230,255,0.10) 0%, rgba(0,0,0,0) 60%)", opacity: 1 - P(f, ruinAt, 30), pointerEvents: "none" }} />
          {/* a chegada: nome do lugar */}
          {f < ruinAt + 10 ? (
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 120, textAlign: "center", opacity: P(f, 16, 18) * (1 - P(f, ruinAt - 6, 12)) }}>
              <div style={{ fontFamily: MONO, fontSize: 18, letterSpacing: 10, color: ICE }}>78° N · BANQUISA</div>
              <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 84, letterSpacing: -2, color: TXT, lineHeight: 1.05 }}>A estação da Mossman</div>
            </div>
          ) : null}
          <FilmLook />
        </AbsoluteFill>
      ) : null}
      {wall > 0 ? <WallShots f={f} shotsAt={shotsAt} nobodyAt={nobodyAt} camAt={camAt} o={wall} /> : null}
      {/* câmeras de segurança: o mesmo modelo visto de 4 câmeras do teto */}
      {cctv > 0 ? <CCTV f={f} camAt={camAt} fireAt={fireAt} sameAt={sameAt} st={st} o={cctv} /> : null}
    </AbsoluteFill>
  );
};

// câmera com o trecho "seguindo o Gordon" usando a posição dele
const camAt0 = (f: number, keys: Key[], deepAt: number, lockAt: number, gx: number) => {
  const c = camAt(f, keys);
  if (f > deepAt + 50 && f < lockAt) {
    const k = Math.min(1, (f - deepAt - 50) / 20);
    c.tx = c.tx * (1 - k) + Math.max(-26, gx + 6) * k;
  }
  return c;
};
// quadro de cada disparo (rajadas de 4, 3 rajadas)
const shotAt = (shotsAt: number, i: number) => shotsAt + 20 + Math.floor(i / 4) * 14 + (i % 4) * 2;

const FEEDS = [
  { n: "CAM 01 · HANGAR", c: { tx: 19, ty: 10, tz: 0.6, yaw: -2.4, pitch: 0.62, dist: 17, F: 560 } as Cam, ul: [[-5, -3], [-3.4, -4.4], [-6.2, -1.2]] as [number, number][], tl: [4.2, 3] as [number, number] },
  { n: "CAM 02 · CORREDOR A", c: { tx: -2, ty: -3, tz: 0.6, yaw: -1.57, pitch: 0.55, dist: 16, F: 560 } as Cam, ul: [[1.6, -4.6], [-1.2, -5], [0.4, -3.4]] as [number, number][], tl: [-0.6, 5.5] as [number, number] },
  { n: "CAM 03 · DEPÓSITO", c: { tx: 8, ty: -14, tz: 0.6, yaw: 0.7, pitch: 0.62, dist: 16, F: 560 } as Cam, ul: [[4.4, -3.6], [5.8, -2], [3, -4.6]] as [number, number][], tl: [-4.6, 2.4] as [number, number] },
  { n: "CAM 04 · GERADOR", c: { tx: -23, ty: 8, tz: 0.6, yaw: 2.2, pitch: 0.62, dist: 17, F: 560 } as Cam, ul: [[-4, -3.6], [-2.4, -4.6], [4.6, -3.8]] as [number, number][], tl: [1.2, 4.4] as [number, number] },
];
const CCTV: React.FC<{ f: number; camAt: number; fireAt: number; sameAt: number; st: St; o: number }> = ({ f, camAt, fireAt, sameAt, st, o }) => {
  const same = P(f, sameAt, 14);
  const GW = 820;
  const GH = 400;
  const X0 = 120;
  const Y0 = 150;
  const GAP = 40;
  const stamp = (k: number) => {
    const s = 7 * 60 + 14 + Math.floor((f - camAt) / 30) + k * 0;
    return `02:${String(Math.floor(s / 60) % 60).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  };
  const centers = FEEDS.map((_, k) => [X0 + (k % 2) * (GW + GAP) + GW / 2, Y0 + Math.floor(k / 2) * (GH + GAP) + GH / 2]);
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <div style={{ position: "absolute", left: X0, top: 74, fontFamily: MONO, fontSize: 22, letterSpacing: 6, color: same > 0 ? RED : ICE }}>{same > 0 ? "4 CÂMERAS · 4 LUGARES · A MESMA ASSINATURA" : "GRAVAÇÕES DE SEGURANÇA · NOITE DO ATAQUE"}</div>
      {FEEDS.map((fd, k) => {
        const x = X0 + (k % 2) * (GW + GAP);
        const y = Y0 + Math.floor(k / 2) * (GH + GAP);
        const appear = P(f, camAt + k * 4, 10);
        const c: Cam = { ...fd.c, yaw: fd.c.yaw + Math.sin((f + k * 40) / 70) * 0.06, cx: GW / 2, cy: GH / 2, fish: 0.9 };
        const firing = f >= fireAt + k * 5;
        const L = (rx: number, ry: number): [number, number] => [c.tx + rx * Math.cos(c.yaw) + ry * Math.sin(c.yaw), c.ty - rx * Math.sin(c.yaw) + ry * Math.cos(c.yaw)];
        const T0 = L(fd.tl[0], fd.tl[1]);
        const units = fd.ul.map((u) => L(u[0], u[1]));
        const tgt = pr(c, T0[0], T0[1], 1.2);
        return (
          <div key={k} style={{ position: "absolute", left: x, top: y, width: GW, height: GH, borderRadius: 10, overflow: "hidden", border: `1px solid ${same > 0 ? "rgba(255,93,77,0.6)" : "rgba(159,230,255,0.35)"}`, background: "#040807", opacity: appear, filter: "saturate(0.6)" }}>
            <svg width={GW} height={GH} style={{ position: "absolute", inset: 0 }}>
              <Station c={c} s={{ ...st, lite: true, holes: 0 }} />
              {/* unidades Combine (marcador com o visor) */}
              {units.map(([ux, uy], i) => {
                const q = pr(c, ux, uy, 1.3);
                if (q[2] < 1.5) return null;
                const flash = firing && (f + i * 3 + k * 2) % 6 < 2;
                const aim = pr(c, T0[0] + (rnd(f + i) - 0.5) * 1.2, T0[1] + (rnd(f + i + 7) - 0.5) * 1.2, 1.2 + (rnd(f * 2 + i) - 0.5));
                return (
                  <g key={i}>
                    {firing && (f + i * 3 + k * 2) % 6 < 3 ? <line x1={q[0]} y1={q[1]} x2={aim[0]} y2={aim[1]} stroke="#ffe6a0" strokeWidth={2} opacity={0.9} /> : null}
                    <path d={`M ${q[0] - 14} ${q[1] - 10} L ${q[0] + 14} ${q[1] - 10} L ${q[0] + 10} ${q[1] + 12} L ${q[0]} ${q[1] + 18} L ${q[0] - 10} ${q[1] + 12} Z`} fill="#0a1214" stroke={CYAN} strokeWidth={1.6} transform={`translate(${q[0]} ${q[1]}) scale(1.45) translate(${-q[0]} ${-q[1]})`} />
                    <circle cx={q[0] - 5} cy={q[1]} r={3.4} fill={CYAN} />
                    <circle cx={q[0] + 5} cy={q[1]} r={3.4} fill={CYAN} />
                    {flash ? <circle cx={q[0] + 16} cy={q[1] - 4} r={12} fill="#fff6cc" opacity={0.9} /> : null}
                    <text x={q[0]} y={q[1] - 18} textAnchor="middle" fill={CYAN} fontFamily={MONO} fontSize={12} letterSpacing={2}>{`OTA-${String(3 + k * 3 + i).padStart(2, "0")}`}</text>
                  </g>
                );
              })}
              {/* o alvo: a falha na imagem, num lugar diferente em cada câmera */}
              {tgt[2] > 1.5 ? (
                <g>
                  {f >= fireAt - 6 ? <Glitch f={f} x={tgt[0]} y={tgt[1]} s={0.9} seed={k * 11} /> : null}
                  <g opacity={P(f, fireAt + 10 + k * 5, 8)}>
                    <rect x={tgt[0] - 44} y={tgt[1] - 74} width={88} height={128} fill="none" stroke={same > 0 ? RED : CREAM} strokeWidth={2} strokeDasharray="10 6" />
                    <text x={tgt[0] + 52} y={tgt[1] - 56} fill={same > 0 ? RED : CREAM} fontFamily={MONO} fontSize={16} letterSpacing={2}>
                      CONTATO
                    </text>
                    <text x={tgt[0] + 52} y={tgt[1] - 36} fill={same > 0 ? RED : CREAM} fontFamily={MONO} fontSize={14} letterSpacing={2} opacity={0.85}>
                      {same > 0 ? "ASSIN. 7F·2C" : `ASSIN. ${["7F·2C", "7F·2C", "7F·2C", "7F·2C"][k]}`}
                    </text>
                  </g>
                </g>
              ) : null}
            </svg>
            {/* textura de câmera de segurança */}
            <AbsoluteFill style={{ background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.22) 0px, rgba(0,0,0,0.22) 1px, rgba(0,0,0,0) 2px, rgba(0,0,0,0) 4px)" }} />
            <AbsoluteFill style={{ backgroundImage: `url(${staticFile("videos/hl3_M01_R/grao.png")})`, backgroundSize: "256px 256px", backgroundPosition: `${(f * 211 + k * 50) % 256}px ${(f * 97) % 256}px`, opacity: 0.16, mixBlendMode: "screen" }} />
            <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.75) 100%)" }} />
            <div style={{ position: "absolute", left: 0, right: 0, top: `${(f * 2.2 + k * 31) % 110 - 5}%`, height: 6, background: "rgba(200,255,230,0.07)" }} />
            <div style={{ position: "absolute", left: 14, top: 10, fontFamily: MONO, fontSize: 15, letterSpacing: 3, color: "#cfeee0" }}>{fd.n}</div>
            <div style={{ position: "absolute", right: 14, top: 10, fontFamily: MONO, fontSize: 15, color: RED, display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ width: 10, height: 10, borderRadius: 5, background: RED, opacity: Math.floor(f / 12) % 2 ? 1 : 0.25 }} />
              REC
            </div>
            <div style={{ position: "absolute", left: 14, bottom: 10, fontFamily: MONO, fontSize: 15, letterSpacing: 2, color: "#cfeee0", opacity: 0.85 }}>{stamp(k)}</div>
          </div>
        );
      })}
      {/* no "mesmo inimigo": linhas das 4 câmeras convergem para a assinatura única */}
      {same > 0 ? (
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          {centers.map(([cx, cy], k) => (
            <line key={k} x1={cx} y1={cy} x2={960} y2={570} stroke={RED} strokeWidth={2} strokeDasharray={`${700 * same} 700`} opacity={0.8} />
          ))}
          <g opacity={P(f, sameAt + 10, 10)}>
            <rect x={760} y={520} width={400} height={100} rx={12} fill="rgba(10,4,4,0.92)" stroke={RED} strokeWidth={2} />
            <text x={960} y={560} textAnchor="middle" fill={RED} fontFamily={MONO} fontSize={16} letterSpacing={5}>
              ASSINATURA 7F·2C
            </text>
            <text x={960} y={600} textAnchor="middle" fill={TXT} fontFamily={FONT} fontWeight={800} fontSize={34}>
              o mesmo inimigo
            </text>
          </g>
        </svg>
      ) : null}
      <FilmLook />
    </AbsoluteFill>
  );
};

// a parede sul do corredor em close: painéis de aço, rajadas de furos com faísca e poeira, traçantes vindas do
// corredor vazio; no "ninguém" a câmera recua e mostra que do outro lado não havia ninguém
const WallShots: React.FC<{ f: number; shotsAt: number; nobodyAt: number; camAt: number; o: number }> = ({ f, shotsAt, nobodyAt, camAt, o }) => {
  void camAt;
  const back = P(f, nobodyAt - 4, 22);
  const sc = 1.08 - 0.06 * ((f - shotsAt) / 120) - 0.3 * back;
  const holes = HOLES.map(([x, z], i) => ({ x: 260 + (x - 10) * 190, y: 610 - z * 165, t0: shotAt(shotsAt, i), i }));
  return (
    <AbsoluteFill style={{ opacity: o, background: "#040608", overflow: "hidden" }}>
      <AbsoluteFill style={{ perspective: 1500 }}>
        <div style={{ position: "absolute", left: -180, top: 60, width: 2300, height: 820, transform: `translateX(${-140 * back}px) scale(${sc}) rotateY(${-16 - 12 * back}deg)`, transformOrigin: "40% 50%" }}>
          {/* a parede */}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, #1a2026 0%, #11161a 55%, #0b0e11 100%)", borderTop: "2px solid #2b343b" }} />
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={"pv" + i} style={{ position: "absolute", left: i * 200, top: 0, width: 2, height: 820, background: "rgba(0,0,0,0.55)", boxShadow: "1px 0 0 rgba(255,255,255,0.05)" }} />
          ))}
          {[230, 520].map((y) => (
            <div key={y} style={{ position: "absolute", left: 0, right: 0, top: y, height: 2, background: "rgba(0,0,0,0.55)", boxShadow: "0 1px 0 rgba(255,255,255,0.05)" }} />
          ))}
          {Array.from({ length: 48 }).map((_, i) => (
            <div key={"rb" + i} style={{ position: "absolute", left: (i % 12) * 200 + 14, top: [14, 244, 534, 800][Math.floor(i / 12)], width: 6, height: 6, borderRadius: 3, background: "#2d363d" }} />
          ))}
          {/* tubos */}
          <div style={{ position: "absolute", left: 0, right: 0, top: 70, height: 26, borderRadius: 13, background: "linear-gradient(180deg, #3a454d, #161b1f)" }} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 112, height: 14, borderRadius: 7, background: "linear-gradient(180deg, #313a41, #13171a)" }} />
          {/* placa do setor */}
          <div style={{ position: "absolute", left: 560, top: 640, padding: "10px 18px", border: "3px solid #c9a23a", color: "#c9a23a", fontFamily: MONO, fontSize: 34, letterSpacing: 6, opacity: 0.8 }}>CORREDOR A · SETOR 2</div>
          {/* luz de emergência */}
          <div style={{ position: "absolute", left: 980, top: 160, width: 90, height: 34, borderRadius: 8, background: Math.floor(f / 9) % 3 ? "#ff5d4d" : "#4a1210", boxShadow: Math.floor(f / 9) % 3 ? "0 0 60px 20px rgba(255,93,77,0.35)" : "none" }} />
          {/* furos */}
          <svg width={2300} height={820} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
            {holes.map((h) => {
              if (f < h.t0) return null;
              const age = f - h.t0;
              return (
                <g key={h.i}>
                  {age < 30 ? <circle cx={h.x} cy={h.y} r={10 + age * 2.4} fill="rgba(210,205,190,0.18)" opacity={1 - age / 30} /> : null}
                  {[0, 1, 2, 3, 4].map((j) => {
                    const a = rnd(h.i * 5 + j) * Math.PI * 2;
                    const l = 22 + rnd(h.i * 9 + j) * 30;
                    return <line key={j} x1={h.x} y1={h.y} x2={h.x + Math.cos(a) * l} y2={h.y + Math.sin(a) * l} stroke="rgba(180,190,198,0.45)" strokeWidth={1.4} />;
                  })}
                  <circle cx={h.x} cy={h.y} r={13} fill="#4a4f52" />
                  <circle cx={h.x} cy={h.y} r={8} fill="#010101" />
                  {age < 5
                    ? [0, 1, 2, 3, 4, 5].map((j) => {
                        const a = rnd(h.i * 7 + j) * Math.PI * 2;
                        const l = (14 + rnd(j + h.i) * 40) * (age / 5 + 0.3);
                        return <line key={"s" + j} x1={h.x} y1={h.y} x2={h.x + Math.cos(a) * l} y2={h.y + Math.sin(a) * l} stroke="#ffe9a8" strokeWidth={2.4} />;
                      })
                    : null}
                  {age < 4 ? <circle cx={h.x} cy={h.y} r={34 * (1 - age / 4) + 6} fill="#fff6d0" opacity={0.9 * (1 - age / 4)} /> : null}
                </g>
              );
            })}
          </svg>
        </div>
      </AbsoluteFill>
      {/* traçantes: vêm do corredor, do lado da câmera */}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {holes.map((h) => {
          const age = f - h.t0;
          if (age < -2 || age > 2) return null;
          const tx = 200 + (h.x - 260) * 0.62 * (1 - 0.3 * back);
          const ty = 120 + h.y * 0.8;
          return <line key={h.i} x1={1500 + (rnd(h.i) - 0.5) * 60} y1={700 + (rnd(h.i * 3) - 0.5) * 80} x2={tx} y2={ty} stroke="#ffd27a" strokeWidth={3} opacity={0.8 - Math.abs(age) * 0.3} />;
        })}
      </svg>
      {/* o outro lado do corredor: vazio */}
      {/* chão do corredor */}
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0) 72%, rgba(40,52,60,0.35) 86%, rgba(20,26,30,0.6) 100%)", pointerEvents: "none" }} />
      {/* o lugar de onde vêm os tiros: vazio */}
      <div style={{ position: "absolute", left: 1500 - 120, top: 520, width: 240, height: 360, opacity: P(f, shotsAt + 20, 8) }}>
        <div style={{ position: "absolute", left: 20, right: 20, bottom: -14, height: 28, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(255,226,176,0.25), rgba(0,0,0,0))" }} />
        <div style={{ position: "absolute", inset: 0, border: `2px dashed ${CREAM}`, borderRadius: 6, opacity: 0.55 + 0.45 * back }} />
        <div style={{ position: "absolute", left: 0, right: 0, top: `${(f * 3) % 100}%`, height: 2, background: CREAM, opacity: 0.4 }} />
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT, fontWeight: 800, fontSize: 110, color: CREAM, opacity: back }}>?</div>
      </div>
      <div style={{ position: "absolute", left: 1500 - 200, width: 400, top: 900, textAlign: "center", opacity: back }}>
        <div style={{ fontFamily: MONO, fontSize: 16, letterSpacing: 5, color: CREAM }}>ORIGEM DOS DISPAROS</div>
        <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 46, color: TXT, lineHeight: 1.1 }}>ninguém</div>
      </div>
      <div style={{ position: "absolute", left: 80, bottom: 80, opacity: P(f, shotsAt + 24, 10) }}>
        <div style={{ fontFamily: MONO, fontSize: 16, letterSpacing: 6, color: RED }}>CORREDOR A · PAREDE SUL</div>
        <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 56, color: TXT, lineHeight: 1.05 }}>{HOLES.filter((_, i) => f >= shotAt(shotsAt, i)).length} impactos</div>
      </div>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 45% 50%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.75) 100%)", pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};
