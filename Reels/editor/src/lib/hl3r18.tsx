// HL3 · 1:36:38 o tempo corre (30/10, v3)
// Pedido dele: a câmera andando pelo vale não funcionou (as coisas deslizavam no chão, atravessavam o resto, a célula do
// Varga aparecia/sumia) e as silhuetas do Gordon e do G-Man em primeiro plano não ficaram boas. Agora o POV fica PARADO
// no alto (como a fala diz: o Gordon continua no mesmo lugar) olhando uma região só, em malha holográfica, e tudo fica
// preso ao chão no seu lugar: o depósito de armas, a casa do Eli (White Forest), o Borealis no gelo, a cidade, a praça e
// o bairro do Varga. A câmera só vira e aproxima de leve para onde a fala está; cada coisa nasce, cresce e continua lá.
import React from "react";
import { AbsoluteFill, Easing, interpolate, staticFile, useCurrentFrame } from "remotion";
import { MONO } from "./overlays";
import { C } from "./hl3";
import { FilmLook } from "./hl3r";
import { borealisEdges } from "./hl3r9s";

type PR = Record<string, number> & { life: number };
type V3 = [number, number, number];
const at = (p: PR, k: string) => Math.round((p[k] as number | undefined) ?? 1e6);
const P = (f: number, t: number, d = 12) => interpolate(f, [t, t + d], [0, 1], { ...C, easing: Easing.out(Easing.cubic) });
const rnd = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const TEAL = "#5ff3d0";
const ICE = "#9fe6ff";
const RED = "#ff5d4d";
const CREAM = "#ffe2b0";
const AMB = "#ffb22e";
const GREEN = "#8dffa8";
const DIM = "rgba(150,190,185,0.6)";
const CYAN = "#7fd8ff";

// o terreno: ondulado, com o gelo plano lá atrás à esquerda
const ICE_X = -13, ICE_Z = 38;
const iceK = (x: number, z: number) => Math.min(1, Math.max(0, (ICE_X - x) / 4)) * Math.min(1, Math.max(0, (z - ICE_Z) / 4));
const Hg = (x: number, z: number) => (0.5 * Math.sin(x * 0.15 + z * 0.07) + 0.3 * Math.sin(x * 0.33 - z * 0.11)) * (1 - iceK(x, z));

// os lugares (fixos)
const DEP: V3 = [10, 0, 13]; // o depósito de armas
const HOUSE: V3 = [14, 0, 25]; // a casa do Eli e do Barney
const SHIP: V3 = [-23, 0, 52]; // o Borealis no gelo
const CODES: V3 = [-15, 0, 43]; // os códigos e os arquivos enterrados
const CITY: V3 = [1, 0, 31]; // a cidade
const PLAZA: V3 = [0, 0, 19]; // a praça (a estátua, depois as máscaras)
const VARGA: V3 = [-11, 0, 23]; // o bairro do Varga
const CITADEL: V3 = [1, 0, 44];
const g = (q: V3): V3 => [q[0], Hg(q[0], q[2]), q[2]];

let SHIPE: [V3, V3][] | null = null;
const shipEdges = () => {
  if (SHIPE) return SHIPE;
  const s = 13 / 116;
  SHIPE = borealisEdges()
    .filter((_, i) => i % 3 === 0)
    .map(([ax, ay, az, bx, by, bz]) => [[ax * s, (ay + 8) * s, -az * s], [bx * s, (by + 8) * s, -bz * s]] as [V3, V3]);
  return SHIPE;
};

// os quarteirões da cidade, as casas do subúrbio, as árvores (tudo em posição fixa)
const BLOCKS = Array.from({ length: 24 }).map((_, i) => {
  const cx = (i % 6) - 2.5, cz = Math.floor(i / 6) - 1.5;
  return { x: CITY[0] + cx * 2.6 + (rnd(i * 3.1) - 0.5) * 0.6, z: CITY[2] + cz * 2.6 + (rnd(i * 4.7) - 0.5) * 0.6, h: 1.4 + rnd(i * 5.3) * 3.6, w: 1.1 + rnd(i * 2.2) * 0.7, born: rnd(i * 6.1) };
});
const HOUSES = Array.from({ length: 16 }).map((_, i) => {
  const a = rnd(i * 9.7) * Math.PI * 2, r = 10 + rnd(i * 1.9) * 5;
  return { x: CITY[0] + Math.cos(a) * r, z: CITY[2] + Math.sin(a) * r * 0.6, born: rnd(i * 8.3) };
}).filter((h) => Math.hypot(h.x - VARGA[0], h.z - VARGA[2]) > 5 && Math.hypot(h.x - HOUSE[0], h.z - HOUSE[2]) > 4 && Math.hypot(h.x - PLAZA[0], h.z - PLAZA[2]) > 4);
const TREES = Array.from({ length: 60 }).map((_, i) => ({ x: (rnd(i * 3.3) - 0.5) * 64, z: 4 + rnd(i * 7.1) * 50, s: 0.7 + rnd(i * 2.7) * 0.9 }))
  .filter((t) => iceK(t.x, t.z) < 0.1 && Math.hypot(t.x - CITY[0], (t.z - CITY[2]) * 1.4) > 10 && Math.hypot(t.x - VARGA[0], t.z - VARGA[2]) > 5 && Math.hypot(t.x - DEP[0], t.z - DEP[2]) > 4 && Math.hypot(t.x - HOUSE[0], t.z - HOUSE[2]) > 3.5 && Math.abs(t.x) > 1.5);
// a rede do Varga: nós fixos no chão, cada um com a sua hora de nascer (k em 0..1) e o pai a que se liga
const VNODES = Array.from({ length: 44 }).map((_, i) => {
  const a = rnd(i * 7.3) * Math.PI * 2, r = 0.8 + Math.sqrt(i / 44) * 5.5;
  return { x: VARGA[0] + Math.cos(a) * r, z: VARGA[2] + Math.sin(a) * r * 0.8, k: i / 44, par: i === 0 ? -1 : Math.floor(rnd(i * 3.9) * i) };
});
// as estradas
const ROADS: V3[][] = [
  [[0, 0, -2], [0, 0, 8], PLAZA, [0.5, 0, 26]],
  [PLAZA, [6, 0, 17], DEP],
  [[0.5, 0, 26], [8, 0, 27], HOUSE],
  [PLAZA, [-6, 0, 21], VARGA],
  [VARGA, [-13, 0, 32], [-14, 0, 39]],
];

export const HL13FutureWorld: React.FC<PR & { events?: { k: string; c: string }[]; y0?: number; y1?: number }> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const E = Array.from({ length: 12 }).map((_, k) => at(p, `e${k}At`));
  const events = (p.events as unknown as { k: string; c: string }[]) ?? [];
  const y0 = (p.y0 as number) ?? 2032, y1 = (p.y1 as number) ?? 2190;
  const [survAt, tryAt, moveAt, ageAt, dieAt, ideaAt, sectAt, genAt, findAt] = ["vSurvAt", "vTryAt", "vMoveAt", "vAgeAt", "vDieAt", "vIdeaAt", "sectAt", "genAt", "findAt"].map((k) => at(p, k));
  const [scriptAt, wordAt, promAt] = ["scriptAt", "wordAt", "promAt"].map((k) => at(p, k));
  const [convAt, energyAt, transAt, medAt, armAt, decAt, famAt, gunsAt, uniAt, barneyAt, quoteAt] = ["convAt", "energyAt", "transAt", "medAt", "armAt", "decAt", "famAt", "gunsAt", "uniAt", "barneyAt", "quoteAt"].map((k) => at(p, k));

  // ---- a câmera: parada no alto; só vira e aproxima para onde a fala está
  type Foc = [number, number, number, number];
  const WIDE: Foc = [0, 0, 28, 1000];
  const FOCUS: [number, Foc][] = [
    [0, WIDE],
    [E[0] - 6, [9, 0.5, 14, 1950]],
    [E[1] - 6, [-19, 2, 48, 1650]],
    [E[2] - 6, [-15, 0, 42, 2050]],
    [E[3] - 60, [5, 1, 28, 1500]],
    [survAt - 6, [-10, 1, 23, 1950]],
    [E[7] - 6, [13, 1.2, 24, 2050]],
    [E[8] - 6, [0.6, 1.2, 19, 2250]],
    [E[9] - 6, [1, 3, 33, 1300]],
    [E[10] - 6, [0, 0.8, 19, 2100]],
    [sectAt - 6, [-4, 1, 27, 1250]],
    [findAt - 6, [-14, 0.5, 38, 1500]],
    [E[11] - 6, [-21, 3, 50, 1500]],
  ];
  let fi = 0;
  FOCUS.forEach(([t], i) => { if (f >= t) fi = i; });
  const prevF = FOCUS[Math.max(0, fi - 1)][1], curF = FOCUS[fi][1];
  const bk = fi === 0 ? 1 : interpolate(f, [FOCUS[fi][0], FOCUS[fi][0] + 54], [0, 1], { ...C, easing: Easing.inOut(Easing.cubic) });
  const T = [0, 1, 2, 3].map((j) => prevF[j] + (curF[j] - prevF[j]) * bk);
  const ex = 0.12 * T[0] + 0.8 * Math.sin(f / 260), ey = 11 + 0.3 * Math.sin(f / 190), ez = -13;
  const yaw = Math.atan2(T[0] - ex, T[2] - ez);
  const pitch = Math.atan2(ey - T[1], Math.hypot(T[0] - ex, T[2] - ez));
  const FP = T[3];
  const pr = (x: number, y: number, z: number) => {
    const dx = x - ex, dz = z - ez, dy = y - ey;
    const rx = dx * Math.cos(yaw) - dz * Math.sin(yaw);
    let rz = dx * Math.sin(yaw) + dz * Math.cos(yaw);
    const ry = dy * Math.cos(pitch) + rz * Math.sin(pitch);
    rz = rz * Math.cos(pitch) - dy * Math.sin(pitch);
    if (rz < 0.5) return null;
    return { x: 960 + (rx * FP) / rz, y: 540 - (ry * FP) / rz, d: rz };
  };
  const els: React.ReactNode[] = [];
  const seg = (a: V3, b: V3, col: string, w: number, o: number, key: string, dash?: string) => {
    if (o <= 0.005) return;
    const A = pr(a[0], a[1], a[2]), B = pr(b[0], b[1], b[2]);
    if (A && B) els.push(<line key={key} x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke={col} strokeWidth={w} opacity={o} strokeDasharray={dash} />);
  };
  const box = (c: V3, w: number, h: number, d: number, col: string, o: number, key: string, taper = 1) => {
    const [x, y, z] = c;
    const v: V3[] = [[x - w / 2, y, z - d / 2], [x + w / 2, y, z - d / 2], [x + w / 2, y, z + d / 2], [x - w / 2, y, z + d / 2]];
    const t = v.map((q) => [x + (q[0] - x) * taper, q[1] + h, z + (q[2] - z) * taper] as V3);
    for (let i = 0; i < 4; i++) {
      seg(v[i], v[(i + 1) % 4], col, 1.3, o, key + "b" + i);
      seg(t[i], t[(i + 1) % 4], col, 1.3, o, key + "t" + i);
      seg(v[i], t[i], col, 1.3, o, key + "v" + i);
    }
  };
  const dot = (q: V3, r: number, col: string, o: number, key: string) => {
    const s = pr(q[0], q[1], q[2]);
    if (s && o > 0.01) els.push(<circle key={key} cx={s.x} cy={s.y} r={Math.max(1.6, (r * FP) / s.d)} fill={col} opacity={o} />);
  };
  const badge = (c: V3, h: number, img: string, col: string, o: number, key: string, gray = 0, size = 58) => {
    const b = pr(c[0], c[1], c[2]), t = pr(c[0], c[1] + h, c[2]);
    if (!b || !t || o <= 0.01) return;
    const s = Math.max(0.5, Math.min(1.8, 26 / t.d)) * (FP / 1250);
    const W = size * s, Hh = size * 1.25 * s;
    els.push(
      <g key={key} opacity={o}>
        <ellipse cx={b.x} cy={b.y} rx={16 * s} ry={5 * s} fill="none" stroke={col} strokeWidth={1.4} strokeDasharray="4 4" />
        <line x1={b.x} y1={b.y} x2={t.x} y2={t.y} stroke={col} strokeWidth={1.4} />
        <rect x={t.x - W / 2 - 3} y={t.y - Hh - 3} width={W + 6} height={Hh + 6} rx={5} fill="#05070a" stroke={col} strokeWidth={2.4} />
        <image href={staticFile(img)} x={t.x - W / 2} y={t.y - Hh} width={W} height={Hh} preserveAspectRatio="xMidYMid slice" style={{ filter: `grayscale(${gray}) brightness(${1 - 0.35 * gray})` }} />
      </g>,
    );
  };
  // os rótulos: um só de cada vez (o da fala atual), preso ao lugar de que ela fala
  const labels: [number, number, V3, number, string, string][] = [];
  const label = (t0: number, t1: number, c: V3, h: number, txt: string, col: string) => labels.push([t0, t1, c, h, txt, col]);

  // ---- o chão
  for (let zz = 0; zz <= 70; zz += 2) {
    const pts: string[] = [];
    let ic = 0;
    for (let x = -44; x <= 44; x += 2) {
      const q = pr(x, Hg(x, zz), zz);
      if (q) pts.push(`${q.x.toFixed(1)},${q.y.toFixed(1)}`);
      ic += iceK(x, zz);
    }
    els.push(<polyline key={"gz" + zz} points={pts.join(" ")} fill="none" stroke={TEAL} strokeWidth={1} opacity={Math.max(0.06, 0.4 - zz / 160)} />);
    void ic;
  }
  for (let xx = -44; xx <= 44; xx += 4) {
    const pts: string[] = [];
    for (let z = 0; z <= 70; z += 2) {
      const q = pr(xx, Hg(xx, z), z);
      if (q) pts.push(`${q.x.toFixed(1)},${q.y.toFixed(1)}`);
    }
    els.push(<polyline key={"gx" + xx} points={pts.join(" ")} fill="none" stroke={xx < ICE_X - 2 ? ICE : TEAL} strokeWidth={0.9} opacity={0.16} />);
  }
  // o gelo: a borda e o brilho
  for (let z = ICE_Z + 2; z <= 70; z += 4) seg([ICE_X - 4, 0.01, z], [-44, 0.01, z], ICE, 1, 0.35, "ice" + z);
  seg([ICE_X - 4, 0.01, ICE_Z + 2], [ICE_X - 4, 0.01, 70], ICE, 1.6, 0.5, "icee");
  // as estradas (a reconstrução acende as faixas)
  const rebuild = P(f, E[3] - 30, 300);
  const combK = P(f, E[9], 360);
  ROADS.forEach((r, ri) => {
    for (let i = 0; i < r.length - 1; i++) {
      const a = g(r[i]), b = g(r[i + 1]);
      const n = Math.max(2, Math.round(Math.hypot(b[0] - a[0], b[2] - a[2]) / 1.2));
      for (let j = 0; j < n; j++) {
        if (j % 2) continue;
        const u0 = j / n, u1 = (j + 1) / n;
        const A: V3 = [a[0] + (b[0] - a[0]) * u0, 0, a[2] + (b[2] - a[2]) * u0], B: V3 = [a[0] + (b[0] - a[0]) * u1, 0, a[2] + (b[2] - a[2]) * u1];
        seg([A[0], Hg(A[0], A[2]) + 0.03, A[2]], [B[0], Hg(B[0], B[2]) + 0.03, B[2]], combK > 0.5 ? CYAN : CREAM, 1.5, 0.3 + 0.35 * rebuild, `rd${ri}_${i}_${j}`);
      }
    }
  });
  // as árvores: tocos queimados que voltam a crescer
  TREES.forEach((t, i) => {
    const y = Hg(t.x, t.z);
    const gr = 0.35 + 0.65 * P(f, E[3] + rnd(i) * 300, 120);
    const th = t.s * 1.6 * gr;
    seg([t.x, y, t.z], [t.x, y + th * 0.3, t.z], DIM, 1.1, 0.7, "tt" + i);
    if (gr > 0.4) {
      const o = 0.55 * (gr - 0.35) / 0.65;
      seg([t.x - th * 0.3, y + th * 0.3, t.z], [t.x, y + th * 1.25, t.z], GREEN, 1.1, o, "tl" + i);
      seg([t.x + th * 0.3, y + th * 0.3, t.z], [t.x, y + th * 1.25, t.z], GREEN, 1.1, o, "tr" + i);
      seg([t.x - th * 0.3, y + th * 0.3, t.z], [t.x + th * 0.3, y + th * 0.3, t.z], GREEN, 1.1, o * 0.8, "tb" + i);
    }
  });
  // torres de energia ao longo da estrada da casa do Eli (aparecem na reconstrução, viram Combine depois)
  const PYL: V3[] = [[3, 0, 24], [6, 0, 26.5], [9.5, 0, 27.2], [12.5, 0, 26.2]];
  PYL.forEach((q0, i) => {
    const o = P(f, E[3] + 60 + i * 20, 30);
    if (o <= 0) return;
    const q = g(q0), H = 3.2, col = combK > 0.5 ? CYAN : ICE;
    seg([q[0] - 0.5, q[1], q[2]], [q[0], q[1] + H, q[2]], col, 1.1, 0.7 * o, "py1" + i);
    seg([q[0] + 0.5, q[1], q[2]], [q[0], q[1] + H, q[2]], col, 1.1, 0.7 * o, "py2" + i);
    seg([q[0] - 0.8, q[1] + H * 0.8, q[2]], [q[0] + 0.8, q[1] + H * 0.8, q[2]], col, 1.1, 0.7 * o, "py3" + i);
    if (i < PYL.length - 1) {
      const n = g(PYL[i + 1]);
      const m: V3 = [(q[0] + n[0]) / 2, (q[1] + n[1]) / 2 + H * 0.8 - 0.4, (q[2] + n[2]) / 2];
      seg([q[0], q[1] + H * 0.8, q[2]], m, col, 0.8, 0.5 * o, "pc1" + i);
      seg(m, [n[0], n[1] + H * 0.8, n[2]], col, 0.8, 0.5 * o, "pc2" + i);
    }
  });

  // ---- o depósito de armas: o Eli destrói (um fio verde sai da casa dele e as caixas desabam)
  {
    const c = g(DEP), k = P(f, E[0] + 30, 30);
    [-1.7, 0, 1.7].forEach((dx, i) => box([c[0] + dx, Hg(c[0] + dx, c[2]), c[2]], 1.2, 1.8 * (1 - 0.85 * k), 2.6, k > 0.5 ? RED : ICE, k > 0.9 ? 0.5 : 0.9, "dep" + i));
    if (k > 0.3) {
      seg([c[0] - 3, c[1] + 2.4, c[2]], [c[0] + 3, c[1] + 0.2, c[2]], RED, 2.6, k * (1 - 0.6 * P(f, E[1], 30)), "dx1");
      seg([c[0] - 3, c[1] + 0.2, c[2]], [c[0] + 3, c[1] + 2.4, c[2]], RED, 2.6, k * (1 - 0.6 * P(f, E[1], 30)), "dx2");
    }
    const lk = P(f, E[0], 30);
    if (f >= E[0] && f < E[1] + 30) {
      const h = g(HOUSE);
      seg([h[0], h[1] + 0.2, h[2]], [h[0] + (c[0] - h[0]) * lk, h[1] + 0.2 + (c[1] - h[1]) * lk, h[2] + (c[2] - h[2]) * lk], GREEN, 2, 1 - P(f, E[1], 30), "eli2dep", "8 6");
    }
    label(E[0], E[1], c, 3.2, events[0]?.k ?? "", events[0]?.c ?? GREEN);
  }
  // ---- a casa do Eli e do Barney (White Forest); eles envelhecem e desaparecem
  {
    const c = g(HOUSE);
    box(c, 2.4, 1.4, 2, rebuild > 0.4 ? CREAM : DIM, 0.85, "hs");
    seg([c[0] - 1.2, c[1] + 1.4, c[2]], [c[0], c[1] + 2.3, c[2]], CREAM, 1.3, 0.85, "hr1");
    seg([c[0] + 1.2, c[1] + 1.4, c[2]], [c[0], c[1] + 2.3, c[2]], CREAM, 1.3, 0.85, "hr2");
    const old = P(f, E[7] + 10, 120);
    const gone = P(f, E[8] - 40, 40);
    badge([c[0] - 1.4, c[1], c[2] - 1.4], 3.4, "hl3silh/eli_retrato.png", GREEN, P(f, E[0] - 20, 14) * (1 - 0.85 * gone), "eli", old);
    badge([c[0] + 1.4, c[1], c[2] - 1.4], 3.4, "hl3silh/barney_badge.jpg", GREEN, P(f, E[3] - 50, 14) * (1 - 0.85 * gone), "barney", old);
    label(E[7], E[8], c, 5.4, events[7]?.k ?? "", events[7]?.c ?? GREEN);
  }
  // ---- o Borealis no gelo: o véu (o Kleiner, da casa do Eli) cobre e esconde o navio; no fim estoura e ele volta
  {
    const c = g(SHIP);
    const veilIn = P(f, E[1] + 40, 90), burst = P(f, E[11] + 10, 40);
    const shipO = Math.max(0.2 + 0.08 * Math.sin(f / 18), 0.9 - 0.8 * veilIn + 0.9 * burst); // 05/11: escondido, mas ainda lá (pulsa sob o véu)
    shipEdges().forEach(([a, b], i) => seg([c[0] + a[0], c[1] + a[1], c[2] + a[2]], [c[0] + b[0], c[1] + b[1], c[2] + b[2]], burst > 0.3 ? "#dff8ff" : ICE, burst > 0.3 ? 1.5 : 1, shipO, "sh" + i));
    if (f >= E[1] && f < E[1] + 90) {
      const lk = P(f, E[1], 40), h = g(HOUSE);
      const m: V3 = [(h[0] + c[0]) / 2, 9, (h[2] + c[2]) / 2];
      const q = (u: number): V3 => [h[0] + (c[0] - h[0]) * u, (1 - u) * (1 - u) * h[1] + 2 * u * (1 - u) * m[1] + u * u * c[1], h[2] + (c[2] - h[2]) * u];
      for (let i = 0; i < 16; i++) if (i / 16 < lk) seg(q(i / 16), q((i + 1) / 16), ICE, 1.6, 1 - P(f, E[1] + 70, 20), "kl" + i);
    }
    const R = 9, form = veilIn;
    for (let m = 0; m < 12; m++) {
      const a = (m / 12) * Math.PI * 2;
      const pts: V3[] = Array.from({ length: 9 }).map((_, j) => { const t = (j / 8) * (Math.PI / 2) * form; const r = R * (1 + burst * 0.7); return [c[0] + Math.cos(a) * Math.cos(t) * r, c[1] + Math.sin(t) * r * 0.8, c[2] + Math.sin(a) * Math.cos(t) * r * 0.8] as V3; });
      for (let j = 0; j < 8; j++) seg(pts[j], pts[j + 1], "#bfe6ff", 1.1, 0.55 * (form > 0 ? 1 : 0) * (1 - burst), `vd${m}_${j}`);
    }
    for (let rr = 1; rr <= 3; rr++) {
      const t = (rr / 4) * (Math.PI / 2);
      const ring: V3[] = Array.from({ length: 25 }).map((_, j) => { const a = (j / 24) * Math.PI * 2; const r = R * (1 + burst * 0.7); return [c[0] + Math.cos(a) * Math.cos(t) * r, c[1] + Math.sin(t) * r * 0.8 * Math.min(1, form * 1.4), c[2] + Math.sin(a) * Math.cos(t) * r * 0.8] as V3; });
      for (let j = 0; j < 24; j++) seg(ring[j], ring[j + 1], "#bfe6ff", 1, 0.4 * form * (1 - burst), `vr${rr}_${j}`);
    }
    label(E[1], E[2], c, 10, events[1]?.k ?? "", events[1]?.c ?? ICE);
  }
  // ---- os códigos e os arquivos da Mossman: afundam no gelo e ficam lá (tracejados) até alguém achar
  {
    const c = g(CODES);
    const sink = P(f, E[2] + 20, 70);
    const found = P(f, findAt + 30, 40);
    const y = 1.0 - 2.2 * sink + 2.2 * found;
    box([c[0], y - 0.6, c[2]], 1.6, 1.1, 1.1, CREAM, 1 - 0.65 * sink + 0.65 * found, "cod");
    box([c[0] + 2.2, y - 0.8, c[2] + 0.6], 1.2, 0.8, 0.9, CREAM, 1 - 0.65 * sink + 0.65 * found, "mos");
    if (sink > 0.5) seg([c[0] - 2, 0.02, c[2] - 1.2], [c[0] + 4, 0.02, c[2] - 1.2], ICE, 1.2, 0.5, "codline", "5 5");
    label(E[2], E[3] - 60, c, 3, events[2]?.k ?? "", events[2]?.c ?? ICE);
  }
  // ---- a cidade: ruína → reconstruída (janelas acesas) → Combine (torres finas, arestas azuis, a Cidadela no fundo);
  // depois, a seita por dentro (janelas vermelhas)
  const sectK = P(f, sectAt, 120) * (1 - 0.6 * P(f, E[11] + 30, 40));
  const genK = P(f, genAt, 120);
  {
    BLOCKS.forEach((b, i) => {
      const y = Hg(b.x, b.z);
      const grow = 0.3 + 0.7 * P(f, E[3] - 30 + b.born * 240, 90);
      const h = b.h * grow * (1 + 1.4 * combK * (0.5 + b.born));
      const w = b.w * (1 - 0.3 * combK);
      const col = combK > 0.5 ? CYAN : grow > 0.6 ? CREAM : DIM;
      box([b.x, y, b.z], w, h, w, col, 0.8, "bk" + i, 1 - 0.35 * combK);
      if (grow < 0.6) seg([b.x - w / 2, y + h, b.z - w / 2], [b.x + w / 4, y + h + 0.5, b.z - w / 2], DIM, 1.2, 0.8, "bq" + i);
      if (combK > 0.35) seg([b.x, y + h, b.z], [b.x, y + h + 0.8 + b.born, b.z], "#cff6ff", 1.4, combK, "ba" + i);
      const red = sectK > 0 && rnd(i * 4.9) < 0.3 + 0.65 * genK;
      for (let j = 0; j < 3; j++) {
        if (rnd(i * 13 + j) > 0.7) continue;
        const q: V3 = [b.x + (j - 1) * 0.3 * w, y + h * (0.25 + 0.22 * j), b.z - w / 2];
        if (red) dot(q, 0.09, RED, sectK * (0.6 + 0.4 * Math.sin(f / 7 + i + j)), `bw${i}_${j}`);
        else if (grow > 0.6) dot(q, 0.07, combK > 0.5 ? "#9fe6ff" : "#ffd27a", 0.75, `bw${i}_${j}`);
      }
    });
    HOUSES.forEach((hh, i) => {
      const o = P(f, E[3] + hh.born * 300, 30);
      if (o <= 0) return;
      const y = Hg(hh.x, hh.z), col = combK > 0.6 ? CYAN : CREAM;
      box([hh.x, y, hh.z], 1.2, 0.8, 1, col, 0.7 * o, "ho" + i);
      seg([hh.x - 0.6, y + 0.8, hh.z], [hh.x, y + 1.3, hh.z], col, 1.1, 0.7 * o, "hor1" + i);
      seg([hh.x + 0.6, y + 0.8, hh.z], [hh.x, y + 1.3, hh.z], col, 1.1, 0.7 * o, "hor2" + i);
    });
    // 30/10 (ele: "energia, transporte, medicina" era só legenda): cada sistema aparece na cidade na hora da fala
    if (f >= energyAt) {
      const ek = P(f, energyAt, 20);
      PYL.forEach((q0, i) => {
        if (i >= PYL.length - 1) return;
        const a = g(q0), b = g(PYL[i + 1]);
        for (let j = 0; j < 3; j++) {
          const u = ((f - energyAt) / 30 + j / 3) % 1;
          dot([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u + 2.6 - Math.sin(u * Math.PI) * 0.4, a[2] + (b[2] - a[2]) * u], 0.1, "#dff8ff", ek, `ep${i}_${j}`);
        }
      });
      // o reator na entrada da cidade
      const r = g([-6.5, 0, 29]);
      box(r, 1.6, 2.4 * ek, 1.6, CYAN, 0.9, "reac", 0.6);
      dot([r[0], r[1] + 2.6 * ek, r[2]], 0.28, "#dff8ff", ek * (0.6 + 0.4 * Math.sin(f / 4)), "reacg");
    }
    if (f >= transAt) {
      // o monotrilho cruzando a cidade, com um vagão indo e voltando
      const tk = P(f, transAt, 24);
      const A: V3 = [-14, 3.4, 37], B: V3 = [16, 3.4, 35];
      const xx = A[0] + (B[0] - A[0]) * tk;
      seg(A, [xx, 3.4, A[2] + (B[2] - A[2]) * tk], CYAN, 2, 0.9, "mono");
      for (let i = 0; i <= 6; i++) { const u = i / 6; if (u > tk) break; const x = A[0] + (B[0] - A[0]) * u, z = A[2] + (B[2] - A[2]) * u; seg([x, Hg(x, z), z], [x, 3.4, z], CYAN, 1.1, 0.6, "mp" + i); }
      const u = 0.5 + 0.5 * Math.sin((f - transAt) / 40);
      if (tk > 0.9) box([A[0] + (B[0] - A[0]) * u, 3.45, A[2] + (B[2] - A[2]) * u], 1.8, 0.6, 0.6, "#dff8ff", 1, "pod");
    }
    if (f >= medAt) {
      // o hospital com a cruz verde da estação de saúde Combine
      const mk = P(f, medAt, 20);
      const h = g([7, 0, 33]);
      box(h, 2, 2.2, 1.6, CYAN, 0.9 * mk, "hosp");
      seg([h[0] - 0.5, h[1] + 3, h[2]], [h[0] + 0.5, h[1] + 3, h[2]], GREEN, 4, mk, "hx1");
      seg([h[0], h[1] + 2.5, h[2]], [h[0], h[1] + 3.5, h[2]], GREEN, 4, mk, "hx2");
    }
    if (f >= armAt) {
      // torretas na borda da cidade
      const ak = P(f, armAt, 20);
      [[-7, 35], [-3, 37.5], [5, 37.5], [9, 35]].forEach(([x, z], i) => {
        const q = g([x, 0, z]);
        box(q, 0.6, 0.9 * ak, 0.6, RED, 0.9, "tur" + i);
        seg([q[0], q[1] + 0.8 * ak, q[2]], [q[0], q[1] + 0.8 * ak, q[2] - 1], RED, 2, ak, "turb" + i);
      });
    }
    const ck = P(f, E[9] + 60, 300);
    if (ck > 0) {
      const c = g(CITADEL);
      box(c, 3.4, 16 * ck, 3.4, "#9fe6ff", 0.8, "cit", 0.25);
      seg([c[0], c[1] + 16 * ck, c[2]], [c[0], c[1] + 16 * ck + 2, c[2]], "#dff8ff", 2, ck, "citt");
    }
    label(E[3], E[4] - 30, g(CITY), 7, events[3]?.k ?? "", events[3]?.c ?? CREAM);
  }
  // ---- a praça: a estátua da Alyx com o Dog; depois as pessoas viram máscaras
  {
    const c = g(PLAZA);
    const sk = P(f, E[8] + 4, 40);
    if (sk > 0) {
      box(c, 1.8, 1.1 * sk, 1.8, AMB, 0.9, "ped");
      badge([c[0], c[1] + 1.1 * sk, c[2]], 2.2, "hl3silh/alyx_badge.jpg", AMB, sk, "statue", 0.85, 66);
      badge([c[0] + 2.4, c[1], c[2] + 0.2], 1.5, "hl3silh/dog_badge.jpg", ICE, P(f, E[8] + 30, 20), "dog");
    }
    if (f >= E[10] - 20) {
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2, r = 3.6;
        const q: V3 = [c[0] + Math.cos(a) * r, Hg(c[0] + Math.cos(a) * r, c[2] + Math.sin(a) * r * 0.7), c[2] + Math.sin(a) * r * 0.7];
        const turn = f >= E[10] + 10 + i * 7;
        badge(q, 1.4, turn ? "hl3silh/combine_badge.jpg" : "hl3silh/cidada_badge.jpg", turn ? RED : CREAM, P(f, E[10] - 20, 14), "mk" + i, 0, 34);
      }
    }
    label(E[8], E[9], c, 6.4, events[8]?.k ?? "", events[8]?.c ?? AMB);
  }
  // ---- o bairro do Varga: UMA rede, presa ao chão, que só cresce
  {
    const c = g(VARGA);
    const born = P(f, survAt, 14);
    const cellK = P(f, E[4], 40) * 0.15;
    const moveK = P(f, moveAt, 120) * 0.55;
    const lateK = P(f, ideaAt + 30, 900) * 0.3;
    const reach = cellK + moveK + lateK;
    const pulse = P(f, ideaAt, 20) * (0.5 + 0.5 * Math.sin(f / 8));
    VNODES.forEach((n, i) => {
      if (n.k > reach || f < E[4]) return;
      const o = Math.min(1, (reach - n.k) * 40);
      const q: V3 = [n.x, Hg(n.x, n.z) + 0.04, n.z];
      const pa = n.par < 0 ? c : (() => { const m = VNODES[n.par]; return [m.x, Hg(m.x, m.z) + 0.04, m.z] as V3; })();
      seg(pa, q, RED, 1.3, 0.75 * o, "vl" + i);
      dot(q, 0.13, RED, o * (0.75 + 0.25 * pulse), "vn" + i);
    });
    // nunca consegue voltar ao Borealis: um traço até o gelo que para no véu
    if (f >= tryAt && f < E[4] + 10) {
      const k = P(f, tryAt, 40), to = g(SHIP), stop = 0.62;
      const u = Math.min(k, stop);
      seg([c[0], c[1] + 0.1, c[2]], [c[0] + (to[0] - c[0]) * u, 0.1, c[2] + (to[2] - c[2]) * u], RED, 2, 1 - P(f, E[4] - 10, 20), "vtry", "8 6");
      if (k >= stop) {
        const x0: V3 = [c[0] + (to[0] - c[0]) * stop, 0.6, c[2] + (to[2] - c[2]) * stop];
        seg([x0[0] - 0.8, x0[1] + 0.8, x0[2]], [x0[0] + 0.8, x0[1] - 0.8, x0[2]], RED, 3, 1 - P(f, E[4] - 10, 20), "vtx1");
        seg([x0[0] - 0.8, x0[1] - 0.8, x0[2]], [x0[0] + 0.8, x0[1] + 0.8, x0[2]], RED, 3, 1 - P(f, E[4] - 10, 20), "vtx2");
      }
    }
    // o Varga: aparece em "sobreviveu", envelhece (grisalho, a idade sobe) e morre (vira lápide); a rede fica
    const ageK = P(f, ageAt, 40);
    const dead = P(f, dieAt, 16);
    const age = Math.round(interpolate(f, [survAt, ageAt, dieAt], [52, 63, 66], C));
    if (dead < 1) badge(c, 3, "hl3silh/varga_retrato.png", dead > 0 ? "#7a7f86" : RED, born * (1 - dead), "varga", ageK);
    if (dead > 0) {
      // 30/10 (ele: a lápide era tão estreita que o nome não cabia): mais larga e mais alta, e o nome cabe sempre
      const t = pr(c[0], c[1] + 2.6, c[2]), b0 = pr(c[0], c[1], c[2]);
      if (t && b0) {
        const sz = Math.max(0.6, 26 / t.d) * (FP / 1250);
        const hw = Math.max(34, 30 * sz), fs = hw * 0.36, r = hw;
        const top = Math.min(t.y, b0.y - hw * 2.6);
        els.push(
          <g key="tomb" opacity={dead}>
            <path d={`M ${b0.x - hw} ${b0.y} V ${top + r} a ${r} ${r} 0 0 1 ${2 * hw} 0 V ${b0.y} Z`} fill="#0b0f10" stroke="#9aa3a8" strokeWidth={2} />
            <line x1={b0.x} y1={top + r * 0.35} x2={b0.x} y2={top + r * 1.05} stroke="#9aa3a8" strokeWidth={2} />
            <line x1={b0.x - r * 0.25} y1={top + r * 0.6} x2={b0.x + r * 0.25} y2={top + r * 0.6} stroke="#9aa3a8" strokeWidth={2} />
            <text x={b0.x} y={top + r * 1.6} textAnchor="middle" fill="#e2e8ec" fontFamily={MONO} fontSize={fs} letterSpacing={1}>VARGA</text>
          </g>,
        );
      }
    }
    // a seita sai do bairro pelas ruas e entra na cidade
    if (sectK > 0) {
      const city = g(CITY);
      for (let i = 0; i < 6; i++) {
        const tz = city[2] + (i - 2.5) * 2.4, tx = city[0] - 6.5;
        const k = P(f, sectAt + i * 20, 60);
        const mx = c[0] + (tx - c[0]) * k, mz = c[2] + (tz - c[2]) * k;
        seg([c[0], c[1] + 0.05, c[2]], [mx, Hg(mx, mz) + 0.05, mz], RED, 1.4, 0.7 * sectK, "sc" + i);
        dot([mx, Hg(mx, mz) + 0.05, mz], 0.12, RED, sectK, "scd" + i);
      }
    }
    // "até alguém encontrar os códigos": um fio sai da rede e vai até o gelo
    if (f >= findAt) {
      const k = P(f, findAt, 40), to = g(CODES);
      seg([c[0], c[1] + 0.1, c[2]], [c[0] + (to[0] - c[0]) * k, 0.1, c[2] + (to[2] - c[2]) * k], CREAM, 2.4, 1 - P(f, E[11] + 40, 30), "find");
    }
    const stage: [number, number, string, string][] = [
      [survAt, tryAt, "SÓ QUE O VARGA SOBREVIVEU", RED],
      [tryAt, E[4], "NUNCA CONSEGUE VOLTAR AO BOREALIS", RED],
      [E[4], moveAt, "VARGA · UMA CÉLULA CONTRA O ELI", RED],
      [moveAt, E[5], "A CÉLULA VIRA UM MOVIMENTO", RED],
      [E[5], ageAt, "", RED],
      [ageAt, dieAt, `VARGA ENVELHECE · ${age} ANOS`, "#cfd6da"],
      [dieAt, ideaAt, "VARGA MORRE SEM VOLTAR AO NÚCLEO", "#cfd6da"],
      [ideaAt, E[7], "A IDEIA SOBREVIVE", RED],
    ];
    stage.forEach(([t0, t1, txt, col]) => label(t0, t1, t0 >= sectAt && t0 < findAt ? g([-6, 0, 27]) : t0 >= findAt ? g(CODES) : c, t0 >= findAt ? 3 : 5.2, txt, col));
  }
  // o rótulo atual
  let cur = -1;
  labels.forEach(([t0, t1], i) => { if (f >= t0 && f < t1 && (cur < 0 || t0 >= labels[cur][0])) cur = i; });
  let labEl: React.ReactNode = null;
  if (cur >= 0) {
    const [t0, t1, c, h, txt, col] = labels[cur];
    const t = pr(c[0], c[1] + h, c[2]);
    if (t && txt) {
      const o = P(f, t0, 10) * (1 - P(f, t1 - 8, 8));
      labEl = (
        <g opacity={o}>
          <line x1={t.x} y1={t.y} x2={t.x} y2={t.y - 36} stroke={col} strokeWidth={1.4} />
          {(() => {
            const W = txt.length * 15.6 + 44, X = Math.max(60, Math.min(1860 - W, t.x - W / 2));
            return (
              <g>
                <rect x={X} y={t.y - 82} width={W} height={46} rx={6} fill="rgba(4,8,10,0.86)" stroke={col} strokeOpacity={0.55} />
                <rect x={X} y={t.y - 82} width={5} height={46} rx={2} fill={col} />
                <text x={X + 24} y={t.y - 52} fill="#f2f0f7" fontFamily={MONO} fontSize={20} letterSpacing={3}>{txt}</text>
              </g>
            );
          })()}
        </g>
      );
    }
  }

  // ---- o céu e o horizonte
  const HZ = 540 - FP * Math.tan(pitch);
  const par = -yaw * FP;
  const dayP = f < E[8] ? 34 : 18;
  const day = 0.5 + 0.5 * Math.sin(f / dayP);
  const mount = (seed: number, amp: number, n: number) =>
    Array.from({ length: n + 1 }).map((_, i) => {
      const x = -900 + (i / n) * 3720;
      const h = amp * (0.35 + 0.65 * Math.abs(Math.sin(i * 0.7 + seed) * Math.cos(i * 0.31 + seed * 2)));
      return `${(x + par * 0.92).toFixed(1)},${(HZ - h).toFixed(1)}`;
    });
  const tS = (f / dayP / (Math.PI * 2)) % 1;
  // o ano
  // 30/10 (ele: o Eli vivo até 2070+ não faz sentido; ele já é um senhor, mais uns 15 ou 20 anos no máximo): o ano não
  // corre mais por igual entre os acontecimentos. As primeiras duas décadas vão devagar (o Varga morre por volta de 2049,
  // o Eli e o Barney somem por volta de 2054) e só depois, em "as décadas se passam", o tempo dispara até o véu cair.
  const YEARS = [y0, y0 + 1, y0 + 2, y0 + 4, y0 + 6, y0 + 9, y0 + 17, y0 + 18, y0 + 24, y0 + 33, y0 + 78, y1];
  const ks = E.map((t, i) => [t, YEARS[i]] as [number, number]);
  const year = Math.round(interpolate(f, [0, ...ks.map((k) => k[0]), life], [y0, ...ks.map((k) => k[1]), y1], C));
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 35%, #072220 0%, #020707 75%)", overflow: "hidden" }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <rect x={0} y={0} width={1920} height={Math.max(0, HZ)} fill={`rgba(${Math.round(40 + 60 * day)},${Math.round(90 + 70 * day)},${Math.round(100 + 50 * day)},${0.08 + 0.12 * day})`} />
        {Array.from({ length: 70 }).map((_, i) => <circle key={"st" + i} cx={rnd(i * 3.7) * 1920} cy={rnd(i * 5.3) * Math.max(10, HZ - 40)} r={rnd(i) > 0.85 ? 1.6 : 1} fill="#e8fff4" opacity={(1 - day) * 0.6 * (0.5 + 0.5 * Math.sin(f / 9 + i))} />)}
        <circle cx={200 + tS * 1520} cy={HZ - 30 - Math.sin(tS * Math.PI) * 200} r={13} fill={day > 0.5 ? "#ffe2b0" : "#cfe8ff"} opacity={0.5} />
        <polygon points={[...mount(4.1, 140, 40), `2820,${HZ}`, `-900,${HZ}`].join(" ")} fill="#06110f" stroke={TEAL} strokeOpacity={0.18} strokeWidth={1.2} />
        <polygon points={[...mount(1.3, 70, 52), `2820,${HZ}`, `-900,${HZ}`].join(" ")} fill="#081815" stroke={TEAL} strokeOpacity={0.3} strokeWidth={1.2} />
        {els}
        {labEl}
      </svg>
      <div style={{ position: "absolute", right: 80, top: 60, textAlign: "right", fontFamily: MONO, color: TEAL }}>
        <div style={{ fontSize: 15, letterSpacing: 6, opacity: 0.8 }}>O TEMPO CORRE</div>
        <div style={{ fontSize: 76, letterSpacing: 4, color: "#e8fff4", textShadow: "0 0 18px rgba(95,243,208,0.5)" }}>{year}</div>
      </div>
      {/* 30/10 (ele: "tecnologia · energia · transporte · medicina", "às vezes a máscara gruda" e "até alguém achar os
          códigos" eram só legendinha vermelha): cards estruturados, um de cada vez, no mesmo lugar do card da escritura */}
      {(() => {
        const box = (o: number, title: string, col: string, child: React.ReactNode, key: string, sub?: string) => (
          <div key={key} style={{ position: "absolute", right: 110, top: 230, width: 600, height: 560, opacity: o, transform: `translateX(${30 * (1 - Math.min(1, o * 1.5))}px)`, fontFamily: MONO }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: 16, background: "rgba(5,8,10,0.9)", border: `1.5px solid ${col}88`, boxShadow: "0 20px 60px rgba(0,0,0,0.7)" }} />
            <div style={{ position: "absolute", left: 30, top: 22, right: 30, display: "flex", justifyContent: "space-between", fontSize: 18, letterSpacing: 5, color: col }}>
              <span>{title}</span>
              {sub ? <span style={{ fontSize: 14, color: "rgba(242,240,247,0.6)" }}>{sub}</span> : null}
            </div>
            {child}
          </div>
        );
        const out: React.ReactNode[] = [];
        // 1 · a tecnologia Combine
        if (f >= E[9] - 6 && f < famAt + 6) {
          const o = P(f, E[9] - 6, 12) * (1 - P(f, famAt - 8, 12));
          const SYS: [number, string, string, React.ReactNode][] = [
            [energyAt, "ENERGIA", CYAN, <path d="M 28 4 L 10 34 H 24 L 18 58 L 40 24 H 26 Z" fill={CYAN} />],
            [transAt, "TRANSPORTE", CYAN, <g fill="none" stroke={CYAN} strokeWidth={3}><rect x={10} y={8} width={36} height={36} rx={8} /><line x1={10} y1={28} x2={46} y2={28} /><circle cx={19} cy={36} r={3} fill={CYAN} /><circle cx={37} cy={36} r={3} fill={CYAN} /><line x1={16} y1={44} x2={10} y2={56} /><line x1={40} y1={44} x2={46} y2={56} /></g>],
            [medAt, "MEDICINA", GREEN, <g fill={GREEN}><rect x={22} y={6} width={12} height={48} rx={2} /><rect x={4} y={24} width={48} height={12} rx={2} /></g>],
            [armAt, "ARMAMENTO", RED, <g fill="none" stroke={RED} strokeWidth={3}><circle cx={28} cy={30} r={18} /><circle cx={28} cy={30} r={4} fill={RED} /><line x1={28} y1={4} x2={28} y2={16} /><line x1={28} y1={44} x2={28} y2={56} /><line x1={2} y1={30} x2={14} y2={30} /><line x1={42} y1={30} x2={54} y2={30} /></g>],
          ];
          const why = f >= convAt ? "DEPOIS · POR CONVENIÊNCIA" : "PRIMEIRO · POR NECESSIDADE";
          out.push(box(o, "TECNOLOGIA COMBINE", CYAN, (
            <>
              <div style={{ position: "absolute", left: 30, top: 66, fontSize: 16, letterSpacing: 4, color: f >= convAt ? AMB : "rgba(242,240,247,0.75)" }}>{why}</div>
              <div style={{ position: "absolute", left: 30, top: 110, right: 30, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
                {SYS.map(([t, lab, col, ico]) => {
                  const k = P(f, t, 12);
                  return (
                    <div key={lab} style={{ height: 180, borderRadius: 12, border: `2px solid ${k > 0 ? col : "rgba(242,240,247,0.15)"}`, background: k > 0 ? "rgba(10,30,40,0.6)" : "rgba(255,255,255,0.02)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, opacity: 0.35 + 0.65 * k, transform: `scale(${0.96 + 0.04 * k})`, boxShadow: k > 0 ? `0 0 ${24 * k}px ${col}55` : "none" }}>
                      <svg width={56} height={60} viewBox="0 0 56 60">{ico}</svg>
                      <div style={{ fontSize: 20, letterSpacing: 4, color: k > 0 ? "#f2f0f7" : "rgba(242,240,247,0.4)" }}>{lab}</div>
                      <div style={{ fontSize: 12, letterSpacing: 3, color: col, opacity: k }}>EM USO</div>
                    </div>
                  );
                })}
              </div>
              {f >= decAt ? <div style={{ position: "absolute", left: 30, right: 30, bottom: 24, textAlign: "center", fontSize: 18, letterSpacing: 5, color: AMB, opacity: P(f, decAt, 10) }}>E AS DÉCADAS SE PASSAM</div> : null}
            </>
          ), "tech", "HUMANIDADE"));
        }
        // 2 · as cidades familiares demais → as armas → os uniformes → as máscaras; depois a frase do Barney
        if (f >= famAt - 6 && f < sectAt + 6) {
          const o = P(f, famAt - 6, 12) * (1 - P(f, sectAt - 8, 12));
          const bk = P(f, barneyAt, 18);
          const STEPS: [number, string][] = [[famAt, "AS CIDADES · FAMILIARES DEMAIS"], [gunsAt, "AS ARMAS TAMBÉM"], [uniAt, "OS UNIFORMES MUDAM"], [E[10], "ATÉ QUE APARECEM AS MÁSCARAS"]];
          const mask = P(f, E[10], 24);
          const uni = P(f, uniAt, 16);
          out.push(box(o, bk > 0.5 ? "A FRASE DO BARNEY VOLTA" : "FAMILIAR DEMAIS", bk > 0.5 ? GREEN : RED, (
            <>
              {/* o retrato: o rosto → o uniforme → a máscara desce */}
              <div style={{ position: "absolute", left: 30, top: 74, width: 230, height: 290, borderRadius: 10, overflow: "hidden", border: `2px solid ${bk > 0.5 ? GREEN : mask > 0.5 ? RED : CREAM}`, opacity: 1 }}>
                <img src={staticFile(bk > 0.5 ? "hl3silh/barney_badge.jpg" : "hl3silh/cidada_badge.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover", filter: bk > 0.5 ? `grayscale(0.3) contrast(1.1)` : "none" }} />
                {bk <= 0.5 ? <div style={{ position: "absolute", inset: 0, background: `rgba(40,70,110,${0.45 * uni})`, mixBlendMode: "multiply" }} /> : null}
                {bk <= 0.5 && mask > 0 ? <img src={staticFile("hl3silh/combine_badge.jpg")} style={{ position: "absolute", left: 0, top: `${-100 + 100 * mask}%`, width: "100%", height: "100%", objectFit: "cover" }} /> : null}
                {bk > 0.5 ? Array.from({ length: 12 }).map((_, i) => <div key={i} style={{ position: "absolute", left: 0, right: 0, top: `${(i * 8.3 + (f * 3) % 8.3)}%`, height: 2, background: "rgba(141,255,168,0.12)" }} />) : null}
              </div>
              {bk <= 0.5 ? (
                <div style={{ position: "absolute", left: 290, top: 84, right: 30, display: "flex", flexDirection: "column", gap: 22 }}>
                  {STEPS.map(([t, txt], i) => {
                    const k = P(f, t, 10);
                    return (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, opacity: 0.25 + 0.75 * k, fontSize: 17, letterSpacing: 2, color: "#f2f0f7", lineHeight: 1.3 }}>
                        <span style={{ width: 20, height: 20, flex: "none", borderRadius: 4, border: `2px solid ${RED}`, background: k > 0.5 ? RED : "transparent" }} />
                        {txt}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ position: "absolute", left: 290, top: 90, right: 30, opacity: bk }}>
                  <div style={{ fontSize: 14, letterSpacing: 4, color: "rgba(242,240,247,0.6)" }}>SEM NINGUÉM PRECISAR REPETIR</div>
                  {f >= quoteAt ? (
                    <div style={{ marginTop: 34, fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: "italic", fontSize: 44, lineHeight: 1.25, color: "#f2ead8", opacity: P(f, quoteAt, 12), transform: `translateY(${10 * (1 - P(f, quoteAt, 14))}px)` }}>“Às vezes a máscara gruda.”</div>
                  ) : null}
                  {f >= quoteAt ? <div style={{ marginTop: 22, fontSize: 16, letterSpacing: 4, color: GREEN, opacity: P(f, quoteAt + 14, 10) }}>— BARNEY CALHOUN</div> : null}
                </div>
              )}
              {bk <= 0.5 ? <div style={{ position: "absolute", left: 30, top: 380, width: 230, textAlign: "center", fontSize: 14, letterSpacing: 3, color: mask > 0.5 ? RED : uni > 0.5 ? "#9fc3ff" : CREAM }}>{mask > 0.5 ? "MÁSCARA" : uni > 0.5 ? "UNIFORME" : "CIDADÃO"}</div> : null}
            </>
          ), "mask", bk > 0.5 ? "ECO" : undefined));
        }
        // 3 · a seita cresce por dentro, geração após geração (o livro vermelho passando de mão em mão)
        if (f >= sectAt - 6 && f < findAt + 6) {
          const o = P(f, sectAt - 6, 12) * (1 - P(f, findAt - 8, 12));
          const N = 5;
          const hop = f < genAt ? 0 : Math.min(N - 1, (f - genAt) / 14);
          const bi = Math.floor(hop), bu = hop - bi;
          out.push(box(o, "A SEITA CRESCE POR DENTRO", RED, (
            <>
              <svg width={540} height={420} style={{ position: "absolute", left: 30, top: 80 }}>
                {/* a cidade nova, com a rede vermelha por baixo */}
                {Array.from({ length: 11 }).map((_, i) => {
                  const h = 50 + ((i * 37) % 70);
                  return <rect key={i} x={10 + i * 48} y={150 - h} width={38} height={h} fill="#06121a" stroke={CYAN} strokeOpacity={0.6} />;
                })}
                {Array.from({ length: 11 }).map((_, i) => P(f, sectAt + i * 6, 12) > 0 ? <rect key={"w" + i} x={24 + i * 48} y={120 - ((i * 13) % 40)} width={8} height={8} fill={RED} opacity={P(f, sectAt + i * 6, 12)} /> : null)}
                <line x1={0} y1={150} x2={540} y2={150} stroke={CYAN} strokeOpacity={0.5} />
                {Array.from({ length: 10 }).map((_, i) => <line key={"r" + i} x1={34 + i * 48} y1={168} x2={34 + (i + 1) * 48} y2={168 + ((i % 2) ? 10 : -6)} stroke={RED} strokeWidth={2} opacity={P(f, sectAt + i * 6, 12)} />)}
                <text x={0} y={200} fill="rgba(242,240,247,0.6)" fontFamily={MONO} fontSize={13} letterSpacing={3}>POR BAIXO DA SOCIEDADE NOVA</text>
                {/* as gerações */}
                {Array.from({ length: N }).map((_, i) => {
                  const x = 50 + i * 110, y = 330;
                  const k = f >= genAt ? P(f, genAt + i * 14 - 10, 10) : i === 0 ? 1 : 0;
                  return (
                    <g key={"g" + i} opacity={0.3 + 0.7 * k}>
                      <circle cx={x} cy={y - 52} r={14} fill="none" stroke={CREAM} strokeWidth={2} />
                      <path d={`M ${x - 22} ${y + 20} Q ${x - 20} ${y - 32} ${x} ${y - 34} Q ${x + 20} ${y - 32} ${x + 22} ${y + 20}`} fill="none" stroke={CREAM} strokeWidth={2} />
                      <text x={x} y={y + 46} textAnchor="middle" fill={CREAM} fontFamily={MONO} fontSize={12} letterSpacing={2}>GERAÇÃO {i + 1}</text>
                    </g>
                  );
                })}
                {/* o livro */}
                {(() => {
                  const x = 50 + (bi + (bi < N - 1 ? bu : 0)) * 110, y = 300 - Math.sin(bu * Math.PI) * 40 * (bi < N - 1 ? 1 : 0);
                  return <g><rect x={x - 14} y={y - 10} width={28} height={20} rx={2} fill="#6e130e" stroke={RED} strokeWidth={2} /><line x1={x} y1={y - 10} x2={x} y2={y + 10} stroke={RED} /></g>;
                })()}
              </svg>
              {f >= genAt ? <div style={{ position: "absolute", left: 30, right: 30, bottom: 24, textAlign: "center", fontSize: 18, letterSpacing: 5, color: RED, opacity: P(f, genAt, 10) }}>GERAÇÃO APÓS GERAÇÃO</div> : null}
            </>
          ), "sect", "A ESCRITURA DO VARGA"));
        }
        // 4 · alguém acha os códigos → o terminal decodifica → o véu cai
        if (f >= findAt - 6 && f < E[11] + 70) {
          const o = P(f, findAt - 6, 12) * (1 - P(f, E[11] + 56, 14));
          const prog = P(f, findAt + 10, Math.max(10, E[11] - findAt - 10));
          const down = P(f, E[11], 10);
          const lines = ["> abrindo arquivo: VEU_BOREALIS", "> chave encontrada no gelo", "> verificando assinatura Mossman", "> desativando campo de contenção", "> ...", "> VÉU · OFF"];
          out.push(box(o, "OS CÓDIGOS · ENCONTRADOS", down > 0.5 ? ICE : CREAM, (
            <>
              <div style={{ position: "absolute", left: 30, top: 76, right: 30, height: 300, borderRadius: 8, background: "#020605", border: "1px solid rgba(95,243,208,0.3)", padding: "18px 20px", boxSizing: "border-box", fontSize: 18, lineHeight: 1.75, color: TEAL }}>
                {lines.map((t, i) => {
                  const show = prog * lines.length - i;
                  if (show <= 0) return null;
                  const n = Math.max(0, Math.min(t.length, Math.round(show * t.length)));
                  return <div key={i} style={{ color: i === lines.length - 1 ? ICE : TEAL }}>{t.slice(0, n)}</div>;
                })}
              </div>
              <div style={{ position: "absolute", left: 30, right: 30, top: 400, height: 14, borderRadius: 7, background: "rgba(242,240,247,0.12)" }}>
                <div style={{ width: `${100 * prog}%`, height: "100%", borderRadius: 7, background: down > 0.5 ? ICE : CREAM }} />
              </div>
              <div style={{ position: "absolute", left: 30, right: 30, top: 440, textAlign: "center", fontSize: down > 0.5 ? 34 : 18, letterSpacing: 6, color: down > 0.5 ? "#dff8ff" : "rgba(242,240,247,0.7)", textShadow: down > 0.5 ? "0 0 24px rgba(159,230,255,0.8)" : "none" }}>{down > 0.5 ? "O VÉU CAI · O BOREALIS VOLTA" : "ATÉ QUE ALGUÉM ENCONTRE OS CÓDIGOS"}</div>
            </>
          ), "codes", `${Math.round(prog * 100)}%`));
        }
        return out;
      })()}
      {/* 30/10 (ele: os arquivos da Mossman e a palavra estavam mal representados, e a palavra é ASCENSÃO): um card na tela.
          "os arquivos da Mossman deixam de ser apenas documentos" = a pasta com as folhas datilografadas (com as palavras
          grifadas) → "viram quase que uma escritura" = as folhas viram um livro encadernado em vermelho → "a palavra
          ascensão deixa de ser uma hipótese" = ASCENSÃO grande, HIPÓTESE riscada → "vira promessa" = o carimbo PROMESSA */}
      {f >= E[5] - 6 && f < ageAt + 10 ? (() => {
        const o = P(f, E[5] - 6, 12) * (1 - P(f, ageAt - 6, 14));
        const bk = P(f, scriptAt, 24);
        const wk = P(f, wordAt, 14);
        const pk = P(f, promAt, 8);
        const stamp = 1 + 0.5 * (1 - P(f, promAt, 6));
        return (
          <div style={{ position: "absolute", right: 110, top: 230, width: 600, height: 560, opacity: o, transform: `translateX(${30 * (1 - P(f, E[5] - 6, 16))}px)`, fontFamily: MONO }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: 16, background: "rgba(5,8,10,0.88)", border: `1.5px solid ${bk > 0.5 ? "rgba(255,93,77,0.55)" : "rgba(255,226,176,0.35)"}`, boxShadow: "0 20px 60px rgba(0,0,0,0.7)" }} />
            <div style={{ position: "absolute", left: 30, top: 22, fontSize: 18, letterSpacing: 5, color: bk > 0.5 ? RED : CREAM }}>{bk > 0.5 ? "A ESCRITURA DA CÉLULA" : "ARQUIVOS · J. MOSSMAN"}</div>
            {/* as folhas (somem quando viram livro) */}
            {[2, 1, 0].map((i) => (
              <div key={i} style={{ position: "absolute", left: 70 + i * 14, top: 70 + i * 10, width: 300, height: 380, background: "#efe6d2", borderRadius: 3, transform: `rotate(${(i - 1) * 3 * (1 - bk)}deg) translateX(${-60 * bk}px) scale(${1 - 0.3 * bk})`, opacity: 1 - bk, boxShadow: "0 6px 18px rgba(0,0,0,0.5)", padding: 22, boxSizing: "border-box", color: "#3a332a", fontSize: 13, lineHeight: 1.7 }}>
                {i === 0 ? (
                  <>
                    <div style={{ fontSize: 12, letterSpacing: 3, color: "#8a1f14" }}>CONFIDENCIAL · BOREALIS</div>
                    {["projeto de", "CONTINUIDADE", "das linhas temporais", "e a", "ASCENSÃO", "das consciências", "rumo à", "PERPETUIDADE"].map((t, j) => (
                      <div key={j} style={t === t.toUpperCase() ? { background: j === 4 ? "rgba(255,93,77,0.35)" : "rgba(255,210,122,0.5)", display: "inline-block", padding: "0 4px", marginRight: 6, fontWeight: 700 } : { display: "inline", marginRight: 6 }}>{t}</div>
                    ))}
                    {Array.from({ length: 6 }).map((_, j) => <div key={"l" + j} style={{ height: 6, marginTop: 10, width: `${60 + ((j * 37) % 35)}%`, background: "rgba(58,51,42,0.25)" }} />)}
                  </>
                ) : null}
              </div>
            ))}
            {/* o livro vermelho */}
            {bk > 0 ? (
              <div style={{ position: "absolute", left: 60, top: 80, width: 250, height: 340, borderRadius: "6px 14px 14px 6px", background: "linear-gradient(90deg, #3a0907 0 14px, #6e130e 14px, #4a0c09)", border: "2px solid #ff5d4d", opacity: bk, transform: `scale(${0.85 + 0.15 * bk})`, boxShadow: `0 0 ${30 + 30 * wk}px rgba(255,93,77,0.45)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18 }}>
                <svg width={80} height={80} viewBox="-40 -40 80 80">
                  {[0, 1, 2, 3, 4, 5].map((k) => <line key={k} x1={0} y1={0} x2={30 * Math.cos(k * 1.047)} y2={30 * Math.sin(k * 1.047)} stroke="#ffb3a8" strokeWidth={2} />)}
                  {[0, 1, 2, 3, 4, 5].map((k) => <circle key={"c" + k} cx={30 * Math.cos(k * 1.047)} cy={30 * Math.sin(k * 1.047)} r={5} fill="#ffb3a8" />)}
                  <circle r={8} fill="#ffb3a8" />
                </svg>
                <div style={{ fontSize: 16, letterSpacing: 6, color: "#ffd2c8" }}>ESCRITURA</div>
              </div>
            ) : null}
            {/* a palavra */}
            {f >= wordAt ? (
              <div style={{ position: "absolute", left: 330, top: 120, width: 250, textAlign: "center", opacity: wk }}>
                <div style={{ fontSize: 15, letterSpacing: 5, color: "rgba(242,240,247,0.6)" }}>A PALAVRA</div>
                <div style={{ marginTop: 10, fontSize: 46, letterSpacing: 3, color: "#fff", textShadow: `0 0 ${18 + 20 * pk}px rgba(255,93,77,0.8)`, transform: `scale(${0.9 + 0.1 * wk})` }}>ASCENSÃO</div>
                <div style={{ position: "relative", display: "inline-block", marginTop: 36, fontSize: 24, letterSpacing: 5, color: "rgba(242,240,247,0.55)" }}>
                  HIPÓTESE
                  <span style={{ position: "absolute", left: -6, right: -6, top: "50%", height: 4, background: RED, transform: `scaleX(${P(f, wordAt + 26, 12)})`, transformOrigin: "left" }} />
                </div>
                {f >= promAt ? (
                  <div style={{ marginTop: 40, display: "inline-block", padding: "10px 22px", border: "4px solid #ff5d4d", borderRadius: 6, color: RED, fontSize: 34, letterSpacing: 6, transform: `rotate(-8deg) scale(${stamp})`, opacity: pk, boxShadow: "0 0 24px rgba(255,93,77,0.4)" }}>PROMESSA</div>
                ) : null}
              </div>
            ) : null}
          </div>
        );
      })() : null}
      {/* 05/11 (pendência "fica parada ~2 min, só a ferrugem aparece"): a régua das gerações embaixo. Os anos andam numa
          escala que abre o começo (onde acontece quase tudo) e cada acontecimento acende quando a fala chega nele; as vidas
          do Eli, do Barney e do Varga são barras que param quando eles somem, e a seita do Varga vira uma linha vermelha
          que atravessa as gerações até alguém achar os códigos. */}
      {(() => {
        const L = 150, W = 1620, TOP = 900;
        const span = y1 - y0;
        const X = (yr: number) => L + W * (Math.log(1 + Math.max(0, yr - y0)) / Math.log(1 + span));
        const inK = P(f, E[0] - 30, 30);
        const lives: [string, string, number, number, number][] = [
          ["ELI", GREEN, y0, y0 + 24, E[0] - 20],
          ["BARNEY", GREEN, y0, y0 + 24, E[3] - 50],
          ["VARGA", RED, y0, y0 + 17, survAt - 10],
          ["A SEITA", RED, y0 + 17, y1, ideaAt],
        ];
        const gens = f >= genAt ? Math.min(5, 1 + Math.floor((f - genAt) / 18)) : 0;
        return (
          <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, opacity: inK, pointerEvents: "none" }}>
            <div style={{ position: "absolute", left: L - 20, top: TOP - 34, width: W + 40, height: 150, borderRadius: 12, background: "linear-gradient(180deg, rgba(2,10,9,0.0), rgba(2,10,9,0.85) 30%)" }} />
            <div style={{ position: "absolute", left: L, top: TOP, width: W, height: 2, background: "rgba(95,243,208,0.25)" }} />
            <div style={{ position: "absolute", left: L, top: TOP, width: Math.max(0, X(year) - L), height: 2, background: TEAL, boxShadow: `0 0 10px ${TEAL}` }} />
            {E.map((t, i) => {
              const yr = YEARS[i];
              const on = f >= t;
              return <div key={"tk" + i} style={{ position: "absolute", left: X(yr) - 5, top: TOP - 4, width: 10, height: 10, borderRadius: 5, background: on ? (events[i]?.c ?? TEAL) : "#0b1c1a", border: `1.5px solid ${events[i]?.c ?? TEAL}`, opacity: on ? 1 : 0.45, boxShadow: on && f < t + 30 ? `0 0 ${16 * (1 - (f - t) / 30)}px ${events[i]?.c ?? TEAL}` : undefined }} />;
            })}
            {[y0, y0 + 10, y0 + 25, y0 + 50, y0 + 100, y1].map((yr) => (
              <div key={"yl" + yr} style={{ position: "absolute", left: X(yr) - 40, width: 80, top: TOP - 30, textAlign: "center", fontFamily: MONO, fontSize: 13, letterSpacing: 2, color: "rgba(207,232,255,0.55)" }}>{yr}</div>
            ))}
            {/* o agora */}
            <div style={{ position: "absolute", left: X(year) - 1, top: TOP - 12, width: 2, height: 112, background: "#e8fff4", boxShadow: "0 0 10px rgba(232,255,244,0.8)" }} />
            {lives.map(([n, col, a, b, t0], i) => {
              if (f < t0) return null;
              const end = Math.min(year, b);
              const dead = year >= b && b < y1;
              return (
                <div key={n} style={{ position: "absolute", left: 0, top: TOP + 20 + i * 20, width: 1920, height: 18, opacity: P(f, t0, 14) }}>
                  <div style={{ position: "absolute", left: L - 130, width: 120, textAlign: "right", fontFamily: MONO, fontSize: 13, letterSpacing: 3, lineHeight: "18px", color: dead ? "rgba(207,232,255,0.4)" : col }}>{n}</div>
                  <div style={{ position: "absolute", left: X(a), top: 6, width: Math.max(2, X(end) - X(a)), height: 6, borderRadius: 3, background: col, opacity: dead ? 0.35 : 0.85 }} />
                  {dead ? <div style={{ position: "absolute", left: X(b) + 8, top: 0, fontFamily: MONO, fontSize: 13, color: "rgba(207,232,255,0.5)", lineHeight: "18px" }}>✝ {b}</div> : null}
                </div>
              );
            })}
            {gens > 0 ? <div style={{ position: "absolute", right: 150, top: TOP + 82, fontFamily: MONO, fontSize: 16, letterSpacing: 5, color: RED, opacity: P(f, genAt, 12) }}>GERAÇÃO {gens}{gens >= 5 ? "+" : ""}</div> : null}
          </div>
        );
      })()}
      {f < E[0] + 20 ? <div style={{ position: "absolute", left: 0, right: 0, top: 150, textAlign: "center", fontFamily: MONO, fontSize: 22, letterSpacing: 8, color: "#cfe8ff", opacity: P(f, 240, 14) * (1 - P(f, E[0], 14)) }}>O MUNDO INTEIRO ENVELHECE EM VOLTA DOS DOIS</div> : null}
      <AbsoluteFill style={{ boxShadow: "inset 0 0 220px rgba(0,0,0,0.85)", pointerEvents: "none" }} />
      <AbsoluteFill style={{ background: "#000", opacity: interpolate(f, [0, 8, life - 6, life], [1, 0, 0, 1], C), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};
