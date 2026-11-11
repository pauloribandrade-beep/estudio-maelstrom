import React from "react";
import { AbsoluteFill, Easing, Sequence, interpolate, useCurrentFrame } from "remotion";
import { FONT } from "./overlays";
import { C, Clip, HL, OUT, lerp, rnd } from "./hl3";
import { BigLabel, Callout, E, ICE, ORANGE, W, H, Wire, add, box, cyl, fadeLife, mono, orbit, project, ring, rot, sub, xf } from "./hl3f";
import type { Cam, Layer, Seg, V } from "./hl3f";

// Bloco 2B (2026-10-02): "o espaço deixa de ser confiável". UMA sala em wireframe que atravessa o bloco inteiro
// (mesma geometria e mesma câmera de cena em cena): primeiro o jeito tradicional (porta trancada, uma solução),
// depois as soluções sistêmicas (explosivo, estrutura, mover, tubulação), a memória do mundo (o buraco continua,
// os Combine usam a passagem, a rota bloqueia, o objeto não volta) e a outra metade (o espaço muda sozinho).
// Tempos em QUADROS relativos à cena.

const RED = "#ff4a3a";
const PURPLE = "#a98bff";
const lerpV = (a: V, b: V, t: number): V => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

// ============================================================================================== sala
const FY = -1.5;
const CY = 1.6;
const XL = -4;
const XR = 4;
const ZB = -5;
const ZF = 3;
type Rect = { u0: number; u1: number; v0: number; v1: number };
const DOOR: Rect = { u0: -0.7, u1: 0.7, v0: FY, v1: 0.9 }; // parede do fundo (u = x, v = y)
const WIN: Rect = { u0: 2.0, u1: 3.3, v0: 0.3, v1: 1.3 }; // janela alta no fundo
const HOLE: Rect = { u0: -3.2, u1: -1.4, v0: FY, v1: 0.35 }; // trecho destrutível da parede esquerda (u = z, v = y)
type Map2 = (u: number, v: number) => V;
const mBack: Map2 = (u, v) => [u, v, ZB];
const mLeft: Map2 = (u, v) => [XL, v, u];
const mRight: Map2 = (u, v) => [XR, v, u];
const mFloor: Map2 = (u, v) => [u, FY, v];

// grade de uma parede com recortes (portas, janela, buraco)
const wallGrid = (map: Map2, U: [number, number], Vr: [number, number], step: number, holes: Rect[] = []): Seg[] => {
  const s: Seg[] = [];
  const line = (fixed: number, isU: boolean, a: number, b: number) => {
    let parts: [number, number][] = [[a, b]];
    for (const h of holes) {
      const inside = isU ? fixed > h.u0 + 1e-6 && fixed < h.u1 - 1e-6 : fixed > h.v0 + 1e-6 && fixed < h.v1 - 1e-6;
      if (!inside) continue;
      const [c0, c1] = isU ? [h.v0, h.v1] : [h.u0, h.u1];
      parts = parts.flatMap(([p0, p1]) => {
        const out: [number, number][] = [];
        if (c0 > p0) out.push([p0, Math.min(p1, c0)]);
        if (c1 < p1) out.push([Math.max(p0, c1), p1]);
        return out.filter(([x0, x1]) => x1 - x0 > 1e-3);
      });
    }
    for (const [p0, p1] of parts) s.push(isU ? [map(fixed, p0), map(fixed, p1)] : [map(p0, fixed), map(p1, fixed)]);
  };
  for (let u = U[0]; u <= U[1] + 1e-6; u += step) line(u, true, Vr[0], Vr[1]);
  for (let v = Vr[0]; v <= Vr[1] + 1e-6; v += step) line(v, false, U[0], U[1]);
  return s;
};
const rectOut = (map: Map2, r: Rect): Seg[] => [
  [map(r.u0, r.v0), map(r.u1, r.v0)],
  [map(r.u1, r.v0), map(r.u1, r.v1)],
  [map(r.u1, r.v1), map(r.u0, r.v1)],
  [map(r.u0, r.v1), map(r.u0, r.v0)],
];
const SHELL: Seg[] = [
  ...wallGrid(mFloor, [XL, XR], [ZB, ZF], 1),
  ...wallGrid(mBack, [XL, XR], [FY, CY], 0.8, [DOOR, WIN]),
  ...rectOut(mBack, { u0: XL, u1: XR, v0: FY, v1: CY }),
  ...wallGrid(mLeft, [ZB, ZF], [FY, CY], 0.8, [HOLE]),
  ...rectOut(mLeft, { u0: ZB, u1: ZF, v0: FY, v1: CY }),
  ...wallGrid(mRight, [ZB, ZF], [FY, CY], 0.8),
  ...rectOut(mRight, { u0: ZB, u1: ZF, v0: FY, v1: CY }),
  ...rectOut(mBack, DOOR),
  ...rectOut(mBack, WIN),
];
// painel destrutível (grade mais fina) e a borda irregular do buraco depois da explosão
const PATCH: Seg[] = [...wallGrid(mLeft, [HOLE.u0, HOLE.u1], [HOLE.v0, HOLE.v1], 0.3), ...rectOut(mLeft, HOLE)];
const HOLE_EDGE: Seg[] = (() => {
  const pts: V[] = [];
  const n = 18;
  for (let i = 0; i <= n; i++) {
    const a = Math.PI * (i / n);
    const r = 1 + (rnd(i * 11) - 0.5) * 0.28;
    const cz = (HOLE.u0 + HOLE.u1) / 2;
    pts.push([XL, FY + Math.sin(a) * 1.85 * r, cz + Math.cos(a) * 0.95 * r]);
  }
  return pts.slice(0, -1).map((p, i) => [p, pts[i + 1]] as Seg);
})();
const HOLE_C: V = [XL, FY + 0.9, (HOLE.u0 + HOLE.u1) / 2];

// estilhaços: cada aresta ganha velocidade, gira e cai (para no chão). t em quadros desde o impacto
const shatter = (segs: Seg[], t: number, dir: V, seed = 0): Seg[] => {
  if (t <= 0) return segs;
  const tt = t / 30;
  return segs.map(([a, b], i) => {
    const m = lerpV(a, b, 0.5);
    const d: V = [dir[0] * (1.2 + rnd(i * 3 + seed) * 3), dir[1] + rnd(i * 5 + seed) * 2.4, dir[2] + (rnd(i * 7 + seed) - 0.5) * 3];
    const off: V = [d[0] * tt, d[1] * tt - 4.9 * tt * tt, d[2] * tt];
    const ang = (rnd(i + seed) - 0.5) * 9 * tt;
    const r = (p: V): V => {
      const q = add(add(rot(sub(p, m), ang, ang * 0.7, ang * 0.5), m), off);
      return [q[0], Math.max(FY + 0.02, q[1]), q[2]];
    };
    return [r(a), r(b)] as Seg;
  });
};

// objetos da sala
const TABLE_P: V = [-2.6, -1.15, 1.6];
const KEY_P: V = [-2.6, -0.77, 1.6];
const LOCK_P: V = [0.48, -0.25, ZB + 0.1];
const CRATE_P: V = [-1.0, -1.0, 0.7];
const TOWER_PIV: V = [2.65, FY, -1.75];
const PIPE_Y = 1.15;
const PIPE_Z = ZB + 0.25;
const PIPE_BREAK = -2.2;
const keyShape = (): Seg[] => xf([...ring([0, 0, 0], 0.09, "y", 12), [[0.09, 0, 0], [0.44, 0, 0]], [[0.33, 0, 0], [0.33, 0, 0.09]], [[0.41, 0, 0], [0.41, 0, 0.07]]], { scale: 2.6 });
const lockShape = (): Seg[] => {
  const s: Seg[] = [...box([0, 0, 0], 0.26, 0.22, 0.1)];
  const pts: V[] = Array.from({ length: 9 }).map((_, i) => {
    const a = Math.PI * (i / 8);
    return [Math.cos(a) * 0.08, 0.11 + Math.sin(a) * 0.11, 0];
  });
  pts.slice(0, -1).forEach((p, i) => s.push([p, pts[i + 1]]));
  return s;
};
const tower = (): Seg[] => {
  // torre de andaime 0,9 x 3,4 x 0,9 com travessas em X; origem na base (pivô)
  const s: Seg[] = [...box([0.45, 1.7, -0.45], 0.9, 3.4, 0.9)];
  for (let y = 0; y < 3.4 - 0.1; y += 0.85) {
    s.push([[0, y, 0], [0.9, y + 0.85, 0]], [[0.9, y, -0.9], [0, y + 0.85, -0.9]], [[0, y, 0], [0, y + 0.85, -0.9]], [[0.9, y, -0.9], [0.9, y + 0.85, 0]]);
    s.push([[0, y, 0], [0.9, y, 0]], [[0, y, -0.9], [0.9, y, -0.9]]);
  }
  return s;
};
const TOWER = tower();
const PIPE_A: Seg[] = xf(cyl([0, 0, 0], 0.13, PIPE_BREAK - XL - 0.06, "z", 14, 7), { ry: Math.PI / 2, pos: [(XL + PIPE_BREAK - 0.06) / 2, PIPE_Y, PIPE_Z] });
const PIPE_B: Seg[] = xf(cyl([0, 0, 0], 0.13, XR - PIPE_BREAK - 0.06, "z", 14, 7), { ry: Math.PI / 2, pos: [(XR + PIPE_BREAK + 0.06) / 2, PIPE_Y, PIPE_Z] });
const VENT: Seg[] = (() => {
  const s: Seg[] = rectOut(mFloor, { u0: CRATE_P[0] - 0.42, u1: CRATE_P[0] + 0.42, v0: CRATE_P[2] - 0.42, v1: CRATE_P[2] + 0.42 });
  for (let k = -0.3; k <= 0.31; k += 0.15) s.push([[CRATE_P[0] - 0.36, FY + 0.01, CRATE_P[2] + k], [CRATE_P[0] + 0.36, FY + 0.01, CRATE_P[2] + k]]);
  return s.map(([a, b]) => [[a[0], FY + 0.015, a[2]], [b[0], FY + 0.015, b[2]]] as Seg);
})();
// soldado Combine em arame (vermelho); `p` = pés
// `move` = amplitude da passada (0 parado), `aim` = 0 arma atravessada no peito → 1 arma no ombro apontando
const soldier = (p: V, ry: number, ph: number, move = 1, aim = 0): Seg[] => {
  const sw = Math.sin(ph) * 0.34 * move;
  const bob = Math.abs(Math.sin(ph)) * 0.05 * move;
  const L = (a: V, b2: V, t: number): V => lerpV(a, b2, t);
  const s: Seg[] = [
    ...box([0, 1.2, 0], 0.5, 0.72, 0.3),
    ...box([0, 1.78, 0], 0.28, 0.32, 0.3),
    // lentes da máscara Combine
    ...ring([-0.075, 1.8, 0.155], 0.05, "z", 8),
    ...ring([0.075, 1.8, 0.155], 0.05, "z", 8),
    [[-0.13, 0.85, 0], [-0.13, 0.42, sw * 0.45]],
    [[-0.13, 0.42, sw * 0.45], [-0.13, 0, sw * 0.7]],
    [[0.13, 0.85, 0], [0.13, 0.42, -sw * 0.45]],
    [[0.13, 0.42, -sw * 0.45], [0.13, 0, -sw * 0.7]],
    [[-0.27, 1.5, 0], L([-0.28, 1.1, 0.28], [0.08, 1.5, 0.6], aim)],
    [[0.27, 1.5, 0], L([0.2, 1.18, 0.36], [0.14, 1.5, 0.35], aim)],
    [L([-0.3, 1.14, 0.3], [0.12, 1.52, 0.05], aim), L([0.28, 1.22, 0.62], [0.12, 1.55, 0.98], aim)],
  ];
  return xf(s, { ry, pos: [p[0], p[1] + bob, p[2]] });
};
// ângulo mais curto entre dois rumos
const turnTo = (a: number, b2: number, t: number) => {
  let d = b2 - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
};
const polyLen = (pts: V[]) => pts.slice(1).reduce((acc, q, i) => acc + Math.hypot(q[0] - pts[i][0], q[2] - pts[i][2]), 0);
const dashed = (pts: V[], dash = 0.22): Seg[] => {
  const s: Seg[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    const L = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    const n = Math.max(1, Math.floor(L / dash));
    for (let k = 0; k < n; k += 2) s.push([lerpV(a, b, k / n), lerpV(a, b, Math.min(1, (k + 1) / n))]);
  }
  return s;
};
const polyAt = (pts: V[], t: number): V => {
  const L = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1], p[2] - pts[i][2]));
  const tot = L.reduce((a, b) => a + b, 0);
  let d = Math.max(0, Math.min(1, t)) * tot;
  for (let i = 0; i < L.length; i++) {
    if (d <= L[i]) return lerpV(pts[i], pts[i + 1], d / (L[i] || 1));
    d -= L[i];
  }
  return pts[pts.length - 1];
};

const fy = (x: number, z: number): V => [x, FY + 0.03, z];
const PATH_OLD: V[] = [fy(-2.6, 2.2), fy(-2.4, 0.0), fy(-0.9, -2.2), fy(0, -3.6), fy(0, -4.9)];
const PATH_HOLE: V[] = [fy(1.4, 2.9), fy(-0.4, 0.2), fy(-2.6, -1.8), fy(-4.0, -2.3), fy(-6.5, -2.3)];
const PATH_RAMP: V[] = [fy(1.6, 2.9), fy(2.2, 0.4), fy(2.8, -1.6), [2.85, -0.4, -3.0], [2.7, 0.55, -4.6], [2.7, 0.75, -5.6]];
const PATH_VENT: V[] = [fy(0.4, 2.9), fy(-0.4, 1.8), fy(CRATE_P[0], CRATE_P[2])];

type RoomSt = {
  holeT?: number; // quadros desde a explosão (0 = parede inteira)
  rebuild?: number; // 0..1 a parede volta inteira
  tower?: number; // 0 em pé → 1 encostada na janela (rampa)
  towerDown?: number; // segunda estrutura: 0 em pé → 1 tombada atravessando a porta
  crate?: V; // deslocamento da caixa
  crateA?: number;
  door?: number;
  lock?: number; // 1 = cadeado no lugar
  lockDrop?: number;
  pipeT?: number; // quadros desde a quebra da tubulação
  key?: V | null;
  color?: string;
  accent?: string;
  hot?: { patch?: number; pipe?: number; tower?: number; tower2?: number; crate?: number; door?: number; lock?: number };
};
const roomLayers = (st: RoomSt, f: number, reveal = 1): Layer[] => {
  const col = st.color ?? ICE;
  const acc = st.accent ?? ORANGE;
  const hot = st.hot ?? {};
  const hc = (k?: number) => ((k ?? 0) > 0.5 ? acc : col);
  const L: Layer[] = [{ segs: SHELL, width: 1.3, alpha: 0.55, reveal, color: col }];
  // parede destrutível
  const ht = st.holeT ?? 0;
  if (st.rebuild !== undefined && st.rebuild > 0) {
    L.push({ segs: shatter(PATCH, (1 - st.rebuild) * 44, [1, 0, 0], 3), color: hc(hot.patch), width: 1.6, alpha: Math.min(1, 0.25 + st.rebuild) });
    if (st.rebuild < 1) L.push({ segs: HOLE_EDGE, color: acc, width: 2, alpha: 1 - st.rebuild });
  } else if (ht <= 0) {
    L.push({ segs: PATCH, color: hc(hot.patch), width: 1.6, alpha: 0.85, reveal });
  } else {
    L.push({ segs: shatter(PATCH, ht, [1, 0, 0], 3), color: "#ffd9b0", width: 1.6, alpha: Math.max(0, 1 - ht / 45) });
    L.push({ segs: HOLE_EDGE, color: hc(hot.patch ?? 1), width: 2, alpha: Math.min(1, ht / 6) });
  }
  // porta + cadeado
  const door = st.door ?? 0;
  L.push({ segs: xf(box([0, -0.3, ZB], 1.4, 2.4, 0.06), { pivot: [-0.7, 0, ZB], ry: -1.5 * door }), color: hc(hot.door), width: 1.8, reveal });
  const lk = st.lock ?? 0;
  if (lk > 0) {
    const drop = st.lockDrop ?? 0;
    L.push({ segs: xf(lockShape(), { scale: 2, pos: add(LOCK_P, [0, -1.0 * drop * drop, 0.3 * drop]), rz: drop * 1.4 }), color: hc(hot.lock), width: 2.2, alpha: lk });
  }
  // mesa e chave
  L.push({ segs: box(TABLE_P, 1.2, 0.7, 0.7), width: 1.5, alpha: 0.7, reveal, color: col });
  if (st.key !== null) L.push({ segs: xf(keyShape(), { pos: st.key ?? KEY_P, ry: f * 0.03 * (st.key ? 1 : 0) }), color: st.key ? acc : col, width: 2.2 });
  // caixa e grade do duto embaixo dela
  const cr = st.crate ?? [0, 0, 0];
  const ca = st.crateA ?? 1;
  if (Math.hypot(cr[0], cr[2]) > 0.2) L.push({ segs: VENT, color: acc, width: 1.6, alpha: Math.min(1, Math.hypot(cr[0], cr[2]) - 0.2) });
  if (ca > 0) L.push({ segs: xf(box([0, 0, 0], 1, 1, 1), { pos: add(CRATE_P, cr), ry: cr[0] * 0.3 }), color: hc(hot.crate), width: 1.9, alpha: ca, reveal });
  // torre: em pé → encostada na janela (rampa) → tombada de vez
  const tw = st.tower ?? 0;
  const td = st.towerDown ?? 0;
  const lean = -1.02 * Easing.in(Easing.quad)(tw);
  L.push({ segs: xf(TOWER, { pivot: [0, 0, 0], rx: lean, pos: TOWER_PIV }), color: hc(hot.tower), width: 1.7, reveal });
  // segunda estrutura (perto da porta): tomba para a direita e fica deitada atravessando a passagem
  if (st.towerDown !== undefined) L.push({ segs: xf(TOWER, { pivot: [0.9, 0, 0], rz: -(Math.PI / 2) * Easing.bounce(td), pos: [-3.6, FY, -3.7] }), color: hc(hot.tower2), width: 1.7, reveal });
  // tubulação no alto da parede do fundo
  const pt = st.pipeT ?? 0;
  const bend = pt > 0 ? Math.min(1, pt / 10) : 0;
  L.push({ segs: PIPE_A, color: hc(hot.pipe), width: 1.7, reveal });
  L.push({ segs: xf(PIPE_B, { pivot: [XR, PIPE_Y, PIPE_Z], rz: -0.12 * bend }), color: hc(hot.pipe), width: 1.7, reveal });
  if (pt > 0) {
    // vapor: jatos curtos saindo da quebra
    const steam: Seg[] = [];
    for (let k = 0; k < 34; k++) {
      const ph = ((f * 1.1 + k * 9.7) % 26) / 26;
      const sp = 0.5 + rnd(k * 13) * 0.9;
      const o: V = [PIPE_BREAK + (rnd(k * 3) - 0.5) * 0.4 * ph, PIPE_Y - ph * 1.6 * sp, PIPE_Z + ph * 2.2 * sp];
      steam.push([o, add(o, [0, -0.12, 0.2])]);
    }
    L.push({ segs: steam, color: "#ffffff", width: 1.4, alpha: Math.min(0.75, pt / 8) });
  }
  return L;
};
const roomCam = (f: number, yaw0 = 0.62, dist = 9.6): Cam => orbit([0, -0.25, -1.2], dist, yaw0 + Math.sin(f / 95) * 0.1, 0.3, 1000);
const P = (f: number, at: number, d = 12) => lerp(f, at, at + d, 0, 1, OUT);
const scr = (p: V, cam: Cam) => {
  const q = project(p, cam);
  return { x: q.x, y: q.y };
};
const Flash: React.FC<{ f: number; at: number; at2?: number; color?: string; x?: number; y?: number; size?: number }> = ({ f, at, color = "rgba(255,200,140,0.75)", x = 960, y = 540, size = 1400 }) => {
  const o = interpolate(f - at, [0, 2, 16], [0, 1, 0], C);
  if (o <= 0) return null;
  return <div style={{ position: "absolute", left: x - size / 2, top: y - size / 2, width: size, height: size, borderRadius: "50%", background: `radial-gradient(closest-side, ${color}, rgba(0,0,0,0))`, opacity: o }} />;
};
const Chip: React.FC<{ text: string; p: number; color?: string; x: number; y: number; align?: "left" | "right" }> = ({ text, p, color = ICE, x, y, align = "left" }) => (
  <div style={{ position: "absolute", left: align === "left" ? x : undefined, right: align === "right" ? W - x : undefined, top: y, ...mono(22, color, 5), padding: "8px 18px", border: `1px solid ${color}`, borderRadius: 999, background: "rgba(5,4,10,0.55)", opacity: p, transform: `translateY(${(1 - p) * 12}px)`, whiteSpace: "nowrap" }}>
    {text}
  </div>
);

// ============================================================================================== cenas
// 0 · (transição) a sala chega "esticada" do warp e se assenta; em `simpleAt` o rótulo "cenário"; em `tagsAt` os
// objetos ganham ficha técnica (o cenário vira sistema).
export const WFRoomSystem: React.FC<{ life: number; glitchAt?: number; crazyAt?: number; aroundAt?: number; calmAt?: number; simpleAt?: number; tagsAt?: number }> = ({
  life,
  glitchAt = 1e9,
  crazyAt = 1e9,
  aroundAt = 1e9,
  calmAt = 1e9,
  simpleAt = 1e9,
  tagsAt = 1e9,
}) => {
  const f = useCurrentFrame();
  const o = fadeLife(f, life, 2, 10);
  const settle = lerp(f, 0, 40, 1, 0, E(Easing.out(Easing.cubic)));
  // "loucura de um espaço-tempo mudando ao redor do jogador": a sala torce e ondula e depois gira em volta do
  // jogador; em `calmAt` ("uma coisa mais simples") volta ao normal de uma vez
  const calm = lerp(f, calmAt, calmAt + 16, 0, 1, E(Easing.out(Easing.back(1.6))));
  const crazy = lerp(f, crazyAt, crazyAt + 34, 0, 1, E(Easing.inOut(Easing.cubic))) * (1 - calm);
  const around = lerp(f, aroundAt, aroundAt + 20, 0, 1, E(Easing.in(Easing.quad))) * (1 - calm);
  const spinT = Math.max(0, Math.min(f, calmAt) - aroundAt);
  const spin = around * spinT * 0.055;
  const PL: V = [0.2, FY, 0.6];
  const tt = f / 30;
  const cam = roomCam(f, 0.62, 9.6 + 1.2 * crazy);
  const base = roomLayers({ hot: { patch: P(f, tagsAt), pipe: P(f, tagsAt + 6), tower: P(f, tagsAt + 12), crate: P(f, tagsAt + 18) } }, f, lerp(f, 0, 30, 0.35, 1, OUT));
  const deform = (p: V): V => {
    // chega esticada (vinda do warp) e se assenta
    let q: V = settle > 0.001 ? [p[0] * (1 - 0.3 * settle) + Math.sin(p[2] * 0.5 + f / 4) * 0.4 * settle, p[1] + Math.sin(p[0] * 0.8 + f / 5) * 0.3 * settle, p[2] * (1 + 5 * settle) - 6 * settle] : p;
    if (crazy > 0.001 || around > 0.001) {
      const dx = q[0] - PL[0];
      const dz = q[2] - PL[2];
      const r = Math.hypot(dx, dz);
      const ang = crazy * (0.35 * Math.sin(tt * 1.4 + r * 0.7) + 0.25 * Math.sin((q[1] - FY) * 1.2 + tt * 2.1)) + spin * (0.6 + 0.4 * Math.sin(r * 0.5));
      const c = Math.cos(ang);
      const sn = Math.sin(ang);
      const nx = PL[0] + dx * c - dz * sn;
      const nz = PL[2] + dx * sn + dz * c;
      const ny = q[1] + crazy * (0.35 * Math.sin(nx * 0.9 + tt * 1.8) + 0.25 * Math.sin(nz * 0.7 - tt * 1.3)) * ((q[1] - FY) / (CY - FY) + 0.3);
      q = [nx, ny, nz];
    }
    return q;
  };
  const glitch = (f >= glitchAt && f < glitchAt + 16 && (f - glitchAt) % 5 < 2) || (crazy > 0.5 && f % 23 < 2);
  const layers = base.map((L) => ({ ...L, segs: L.segs.map(([a, b]) => [deform(a), deform(b)] as Seg) }));
  const pl = P(f, crazyAt + 10, 14) * (1 - P(f, calmAt + 20, 14));
  const player: Layer[] = [
    { segs: xf(soldier([0, 0, 0], 0, 0), { pos: PL, ry: -0.6 }), color: ORANGE, width: 2.2, alpha: pl },
    { segs: ring(add(PL, [0, 0.03, 0]), 0.7 + 0.08 * Math.sin(f / 4), "y", 24), color: ORANGE, width: 1.6, alpha: pl },
  ];
  const tags: { p: V; to: [number, number]; text: string; sub: string; at: number; align?: "left" | "right" }[] = [
    { p: [XL, -0.4, -2.3], to: [130, 300], text: "parede", sub: "concreto · destrutível", at: tagsAt },
    { p: [-0.5, PIPE_Y, PIPE_Z], to: [760, 150], text: "tubulação", sub: "vapor · pressão", at: tagsAt + 6 },
    { p: [3.1, 0.6, -2.2], to: [1790, 330], text: "estrutura", sub: "aço · 2,4 t", at: tagsAt + 12, align: "right" },
    { p: [CRATE_P[0], -0.5, CRATE_P[2]], to: [1260, 880], text: "caixa", sub: "madeira · 40 kg", at: tagsAt + 18 },
  ];
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <div style={{ position: "absolute", inset: 0, transform: glitch ? `translateX(${(rnd(f) - 0.5) * 30}px)` : undefined }}>
        <Wire cam={cam} fog={26} layers={[...layers, ...player]} />
        {glitch ? (
          <div style={{ position: "absolute", inset: 0, opacity: 0.5, transform: "translateX(12px)", mixBlendMode: "screen" }}>
            <Wire cam={cam} fog={26} layers={layers.map((L) => ({ ...L, color: "rgba(255,80,60,0.8)" }))} />
          </div>
        ) : null}
      </div>
      <Callout from={scr(add(PL, [0, 1.9, 0]), cam)} to={[1240, 230]} text="o jogador" sub="o espaço muda ao redor" p={P(f, aroundAt, 14) * (1 - P(f, calmAt, 10))} />
      {tags.map((t) => (
        <Callout key={t.text} from={scr(t.p, cam)} to={t.to} text={t.text} sub={t.sub} p={P(f, t.at, 16)} align={t.align ?? "left"} />
      ))}
      <div style={{ position: "absolute", left: 120, top: 100, ...mono(26, ICE, 10), opacity: P(f, simpleAt) * (1 - P(f, tagsAt, 8)) }}>cenário</div>
      <div style={{ position: "absolute", left: 120, top: 100, ...mono(26, ORANGE, 10), opacity: P(f, tagsAt, 8) }}>cenário = sistema</div>
      <Flash f={f} at={0} color="rgba(220,240,255,0.7)" />
      <Flash f={f} at={calmAt} color="rgba(220,240,255,0.35)" />
    </AbsoluteFill>
  );
};

// 1 · jogo tradicional: tudo apagado; porta trancada; UM caminho já decidido (mesa → porta); a chave voa até o
// cadeado; a porta abre e a câmera segue.
export const WFOldWay: React.FC<{ life: number; lockAt?: number; solvedAt?: number; keyAt?: number; openAt?: number; goAt?: number }> = ({ life, lockAt = 1e9, solvedAt = 1e9, keyAt = 1e9, openAt = 1e9, goAt = 1e9 }) => {
  const f = useCurrentFrame();
  const o = fadeLife(f, life, 8, 10);
  const go = lerp(f, goAt, goAt + 40, 0, 1, E(Easing.inOut(Easing.cubic)));
  const c0 = roomCam(f);
  const cam: Cam = go > 0 ? { pos: lerpV(c0.pos, [0, -0.2, -6.5], go), target: lerpV(c0.target, [0, -0.3, -12], go), f: 1000 } : c0;
  const kp = lerp(f, keyAt, keyAt + 26, 0, 1, E(Easing.inOut(Easing.cubic)));
  const key: V = kp > 0 ? add(lerpV(KEY_P, add(LOCK_P, [0.05, 0, 0.15]), kp), [0, Math.sin(Math.PI * kp) * 1.1, 0]) : KEY_P;
  const open = lerp(f, openAt, openAt + 22, 0, 1, E(Easing.inOut(Easing.cubic)));
  const lockP = P(f, lockAt);
  const pulse = interpolate(f, [lockAt, lockAt + 6, lockAt + 22], [0, 1, 0.4], C);
  const st: RoomSt = {
    lock: 1,
    lockDrop: lerp(f, openAt - 4, openAt + 14, 0, 1, C),
    door: open,
    key: kp > 0 && open < 0.05 ? key : kp > 0 ? null : KEY_P,
    color: "rgba(200,205,215,0.85)",
    accent: "#ffd9b0",
    hot: { lock: lockP, door: open },
  };
  const path = dashed(PATH_OLD);
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <AbsoluteFill style={{ filter: "saturate(0.25)" }}>
        <Wire cam={cam} fog={26} layers={[...roomLayers(st, f), { segs: path, color: "#ffd9b0", width: 2.4, reveal: lerp(f, solvedAt, solvedAt + 26, 0, 1, OUT) }]} />
        {/* corredor do outro lado da porta */}
        <Wire cam={cam} fog={20} layers={[{ segs: wallGrid((u, v) => [-0.7, v, u], [-12, ZB], [FY, 0.9], 0.8).concat(wallGrid((u, v) => [0.7, v, u], [-12, ZB], [FY, 0.9], 0.8)), width: 1.2, alpha: 0.5 * open }]} />
      </AbsoluteFill>
      <div style={{ position: "absolute", left: 120, top: 100, ...mono(26, "rgba(220,225,235,0.8)", 10), opacity: P(f, 0, 14) * (1 - go) }}>jogo tradicional</div>
      <Callout from={scr(LOCK_P, cam)} to={[1240, 300]} text="trancada" sub={pulse > 0.9 ? "" : "uma porta"} p={lockP * (1 - P(f, openAt, 8))} color="#ffd9b0" />
      <Chip text="1 solução · já decidida" p={P(f, solvedAt + 10) * (1 - go)} x={120} y={160} color="#ffd9b0" />
    </AbsoluteFill>
  );
};

// 2 · as soluções sistêmicas, uma por fala, na MESMA sala (cor volta em `diffAt`): chave · explosivo/buraco ·
// estrutura derrubada vira rampa · mover a caixa revela o duto · tubulação quebra · reação · um caminho que ninguém
// desenhou (laranja, atravessando o buraco).
export const WFManyWays: React.FC<{
  life: number;
  diffAt?: number;
  keyAt?: number;
  bombAt?: number;
  holeAt?: number;
  structAt?: number;
  passAt?: number;
  moveAt?: number;
  pipeAt?: number;
  reactAt?: number;
  pathAt?: number;
}> = ({ life, diffAt = 0, keyAt = 1e9, bombAt = 1e9, holeAt = 1e9, structAt = 1e9, passAt = 1e9, moveAt = 1e9, pipeAt = 1e9, reactAt = 1e9, pathAt = 1e9 }) => {
  const f = useCurrentFrame();
  const o = fadeLife(f, life, 8, 10);
  const cam = roomCam(f, 0.55 + lerp(f, 0, life, 0, 0.25, C));
  const sat = P(f, diffAt, 20);
  const mv = lerp(f, moveAt, moveAt + 22, 0, 1, E(Easing.out(Easing.cubic)));
  const st: RoomSt = {
    lock: 1,
    holeT: Math.max(0, f - holeAt),
    tower: lerp(f, structAt, structAt + 26, 0, 1, C),
    crate: [1.25 * mv, 0, -0.4 * mv],
    pipeT: Math.max(0, f - pipeAt),
    hot: { lock: P(f, keyAt) * (1 - P(f, bombAt)), patch: P(f, bombAt), tower: P(f, structAt), crate: P(f, moveAt), pipe: P(f, pipeAt) },
  };
  const blink = f > bombAt && f < holeAt && Math.floor((f - bombAt) / 5) % 2 === 0;
  const charge: Layer = { segs: xf(box([0, 0, 0], 0.08, 0.3, 0.42), { pos: [XL + 0.06, -0.5, (HOLE.u0 + HOLE.u1) / 2] }), color: blink ? RED : ORANGE, width: 2.4, alpha: f >= bombAt && f < holeAt ? 1 : 0 };
  const rip = Math.max(0, f - reactAt);
  const ripple: Layer = { segs: rip > 0 ? ring([PIPE_BREAK, FY + 0.03, -3.6], 0.3 + rip * 0.09, "y", 36) : [], color: "#ffffff", width: 1.6, alpha: Math.max(0, 1 - rip / 30) };
  const routes: Layer[] = [
    { segs: dashed(PATH_OLD), color: ICE, width: 2, alpha: 0.6, reveal: P(f, keyAt, 20) },
    { segs: dashed(PATH_RAMP), color: "#ffd9b0", width: 2.2, reveal: P(f, passAt, 22) },
    { segs: dashed(PATH_VENT), color: "#ffd9b0", width: 2.2, reveal: P(f, moveAt + 12, 18) },
    { segs: PATH_HOLE.slice(0, -1).map((p, i) => [p, PATH_HOLE[i + 1]] as Seg), color: ORANGE, width: 4, reveal: lerp(f, pathAt, pathAt + 34, 0, 1, OUT) },
  ];
  const hc = scr(HOLE_C, cam);
  const list: [string, number][] = [
    ["chave", keyAt],
    ["explosivo", bombAt],
    ["estrutura", structAt],
    ["mover", moveAt],
    ["tubulação", pipeAt],
  ];
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <AbsoluteFill style={{ filter: `saturate(${0.25 + 0.75 * sat})` }}>
        <Wire cam={cam} fog={26} layers={[...roomLayers(st, f), charge, ripple, ...routes]} />
      </AbsoluteFill>
      <Flash f={f} at={holeAt} x={hc.x} y={hc.y} size={1100} />
      <div style={{ position: "absolute", left: 120, top: 100, ...mono(26, ORANGE, 10), opacity: sat }}>nesse half-life</div>
      <div style={{ position: "absolute", right: 120, top: 100, display: "flex", flexDirection: "column", gap: 14, alignItems: "flex-end" }}>
        {list.map(([t, at], i) => {
          const p = P(f, at);
          return (
            <div key={t} style={{ ...mono(22, p > 0.5 ? ORANGE : ICE, 5), opacity: p, transform: `translateX(${(1 - p) * 30}px)` }}>
              {`${t} · ${i + 1}`}
            </div>
          );
        })}
      </div>
      <BigLabel text="um caminho que ninguém desenhou" p={P(f, pathAt + 14, 16)} y={900} size={58} color={ORANGE} />
    </AbsoluteFill>
  );
};

// 3 · "um sistema com regras… você pode mexer nessas regras": dentro da mesma sala, cada regra é um fio de causa e
// efeito entre objetos de verdade (fogo na mesa → madeira da caixa · pressão da tubulação → estrutura · peso da caixa
// → chão), com sinais correndo. Em `youAt` a mira trava na caixa, o peso sobe de 40 para 400 kg e ela afunda,
// rachando o chão.
const flame = (c: V, f: number, k = 1): Seg[] => {
  const s: Seg[] = [];
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    const h = (0.35 + 0.25 * rnd(i * 7 + Math.floor(f / 3))) * k;
    const base: V = add(c, [Math.cos(a) * 0.14 * k, 0, Math.sin(a) * 0.14 * k]);
    const mid: V = add(c, [Math.cos(a + 0.6) * 0.1 * k, h * 0.55, Math.sin(a + 0.6) * 0.1 * k]);
    const tip: V = add(c, [Math.sin(f / 4 + i) * 0.05 * k, h, Math.cos(f / 5 + i) * 0.05 * k]);
    s.push([base, mid], [mid, tip]);
  }
  return s;
};
export const WFRules: React.FC<{ life: number; youAt?: number }> = ({ life, youAt = 1e9 }) => {
  const f = useCurrentFrame();
  const o = fadeLife(f, life, 8, 10);
  const lock = P(f, youAt, 10);
  const heavy = lerp(f, youAt + 6, youAt + 24, 0, 1, C);
  const slam = interpolate(f, [youAt + 24, youAt + 28], [0, 1], { ...C, easing: Easing.in(Easing.quad) });
  const shake = f >= youAt + 26 && f < youAt + 34 ? (rnd(f) - 0.5) * 0.12 : 0;
  const c0 = roomCam(f, 0.78 - lerp(f, 0, life, 0, 0.12, C), 8.4 - lerp(f, 0, life, 0, 0.8, C));
  const cam: Cam = { ...c0, pos: add(c0.pos, [shake, shake * 0.6, 0]) };
  const crateOff: V = [1.25, -0.22 * slam, -0.4];
  const CR: V = add(CRATE_P, crateOff);
  const st: RoomSt = { holeT: 300, tower: 1, crate: crateOff, pipeT: 300, lock: 1, hot: { crate: lock } };
  const FIRE: V = [TABLE_P[0], TABLE_P[1] + 0.36, TABLE_P[2]];
  const PIPE_P: V = [PIPE_BREAK, PIPE_Y, PIPE_Z];
  const TOWER_T: V = [3.1, 0.2, -4.0];
  const FLOOR_P: V = [CR[0], FY, CR[2]];
  const rules: { a: V; b: V; lift: number; text: string; at: number; hot?: number }[] = [
    { a: FIRE, b: add(CR, [0, 0.5, 0]), lift: 1.4, text: "fogo → madeira queima", at: 2 },
    { a: PIPE_P, b: TOWER_T, lift: 1.1, text: "pressão → empurra a estrutura", at: 9 },
    { a: add(CR, [0.55, 0, 0.3]), b: add(FLOOR_P, [0.9, 0, 0.6]), lift: 0.6, text: "peso → chão", at: 16, hot: lock },
  ];
  const tt = f / 30;
  const wires: Layer[] = [];
  rules.forEach((r, i) => {
    const mid: V = add(lerpV(r.a, r.b, 0.5), [0, r.lift, 0]);
    const p = lerp(f, r.at, r.at + 18, 0, 1, OUT);
    const hot = (r.hot ?? 0) > 0.5;
    wires.push({ segs: bezSegs(r.a, mid, r.b, p), color: hot ? ORANGE : "#ffd9b0", width: hot ? 3 : 2 });
    if (p >= 1) {
      const t1 = (((tt * 0.7 + i * 0.3) % 1) + 1) % 1;
      wires.push({ segs: pulse(bez(r.a, mid, r.b, t1), 0.09), color: hot ? ORANGE : ICE, width: 2 });
    }
  });
  // rachaduras do chão quando a caixa pesa
  const cracks: Seg[] = [];
  for (let k = 0; k < 10; k++) {
    const a = (k / 10) * Math.PI * 2 + rnd(k) * 0.4;
    const L = 0.7 + rnd(k * 5) * 1.1;
    const m: V = [FLOOR_P[0] + Math.cos(a) * L * 0.5, FY + 0.02, FLOOR_P[2] + Math.sin(a) * L * 0.5 + (rnd(k * 9) - 0.5) * 0.25];
    cracks.push([[FLOOR_P[0] + Math.cos(a) * 0.55, FY + 0.02, FLOOR_P[2] + Math.sin(a) * 0.55], m], [m, [FLOOR_P[0] + Math.cos(a + 0.25) * L, FY + 0.02, FLOOR_P[2] + Math.sin(a + 0.25) * L]]);
  }
  const crS = scr(add(CR, [0, 0.2, 0]), cam);
  const cross = { x: lerp(f, youAt - 8, youAt + 6, 960, crS.x, E(Easing.inOut(Easing.cubic))), y: lerp(f, youAt - 8, youAt + 6, 560, crS.y, E(Easing.inOut(Easing.cubic))) };
  const kg = Math.round(40 + 360 * heavy);
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <Wire cam={cam} fog={26} layers={[...roomLayers(st, f), { segs: flame(FIRE, f), color: ORANGE, width: 2 }, ...wires, { segs: cracks, color: ORANGE, width: 2, reveal: slam }]} />
      {rules.map((r, i) => {
        const q = scr(add(lerpV(r.a, r.b, 0.5), [0, r.lift * 0.62, 0]), cam);
        const p = P(f, r.at + 10, 12);
        return (
          <div key={i} style={{ position: "absolute", left: q.x - 220, top: q.y - 46, width: 440, textAlign: "center", ...mono(20, (r.hot ?? 0) > 0.5 ? ORANGE : "#ffd9b0", 4), opacity: p, textShadow: "0 2px 12px rgba(0,0,0,0.9)" }}>
            {r.text}
          </div>
        );
      })}
      <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: P(f, youAt - 8, 8) }}>
        {[0, 90, 180, 270].map((ang) => (
          <line key={ang} x1={cross.x} y1={cross.y - 34 + 10 * lock} x2={cross.x} y2={cross.y - 54 + 10 * lock} stroke={ORANGE} strokeWidth={3} transform={`rotate(${ang} ${cross.x} ${cross.y})`} />
        ))}
      </svg>
      <div style={{ position: "absolute", left: crS.x + 70, top: crS.y - 70, ...mono(26, ORANGE, 4), opacity: lock, textShadow: "0 2px 14px rgba(0,0,0,0.9)" }}>
        <div style={{ ...mono(15, HL.dim, 4) }}>peso</div>
        {kg} kg
      </div>
      <Flash f={f} at={youAt + 27} x={crS.x} y={crS.y + 60} size={600} color="rgba(255,190,120,0.55)" />
      <div style={{ position: "absolute", left: 0, right: 0, top: 90, textAlign: "center", ...mono(26, HL.dim, 10), opacity: P(f, 0, 14) }}>um sistema com regras</div>
    </AbsoluteFill>
  );
};

// 4 · o mundo não esquece: o buraco continua (e os Combine entram por ele); a torre tomba num soldado e, 5 minutos
// depois, a passagem da porta está bloqueada; a caixa sai e, ao voltar, só o contorno vazio.
export const WFMemory: React.FC<{
  life: number;
  forgetAt?: number;
  wallAt?: number;
  combineAt?: number;
  towerAt?: number;
  minAt?: number;
  blockAt?: number;
  takeAt?: number;
  backAt?: number;
  emptyAt?: number;
}> = ({ life, forgetAt = 0, wallAt = 1e9, combineAt = 1e9, towerAt = 1e9, minAt = 1e9, blockAt = 1e9, takeAt = 1e9, backAt = 1e9, emptyAt = 1e9 }) => {
  const f = useCurrentFrame();
  const o = fadeLife(f, life, 8, 10);
  const skip = f >= minAt && f < minAt + 8;
  const cam = roomCam(f, 0.5 + lerp(f, takeAt, backAt, 0, 0.35, E(Easing.inOut(Easing.cubic))) - lerp(f, backAt, backAt + 30, 0, 0.35, E(Easing.inOut(Easing.cubic))));
  const take = lerp(f, takeAt, takeAt + 24, 0, 1, E(Easing.in(Easing.cubic)));
  const st: RoomSt = {
    holeT: 300,
    tower: 1,
    towerDown: lerp(f, towerAt, towerAt + 24, 0, 1, C),
    crate: [0, 3.5 * take, 0],
    crateA: 1 - take,
    lock: 0,
    hot: { patch: P(f, wallAt), tower2: P(f, towerAt - 20) },
  };
  // os Combine entram pelo buraco, contornam a caixa, param em leque diante do jogador, viram para ele e apontam
  const PLM: V = [1.7, FY, 1.8];
  const squad: { path: V[]; delay: number }[] = [
    { path: [fy(-6.5, -2.4), fy(-4.0, -2.4), fy(-0.3, -0.9)], delay: 0 },
    { path: [fy(-6.8, -1.8), fy(-4.0, -1.8), fy(-2.4, -0.4)], delay: 14 },
    { path: [fy(-6.8, -2.9), fy(-4.0, -2.9), fy(-1.5, -2.4), fy(0.9, -1.8)], delay: 26 },
  ];
  const sold: Seg[] = [];
  squad.forEach((u, k) => {
    const el = (f - combineAt - u.delay) / 30;
    if (el < 0) return;
    const tot = polyLen(u.path);
    const dist = Math.min(tot, el * 1.8);
    const tp = dist / tot;
    const pos = polyAt(u.path, tp);
    const ahead = polyAt(u.path, Math.min(1, tp + 0.02));
    const back = polyAt(u.path, Math.max(0, tp - 0.02));
    const walkRy = Math.atan2(ahead[0] - back[0], ahead[2] - back[2]);
    const arrive = (el - tot / 1.8) * 30; // quadros desde a chegada
    const face = Math.atan2(PLM[0] - pos[0], PLM[2] - pos[2]);
    const ry = arrive > 0 ? turnTo(walkRy, face, Math.min(1, arrive / 12)) : walkRy;
    const move = arrive > 0 ? Math.max(0, 1 - arrive / 6) : 1;
    const aim = arrive > 0 ? Math.min(1, Math.max(0, (arrive - 8) / 12)) : 0;
    sold.push(...soldier([pos[0], FY, pos[2]], ry, dist * 5.2, move, aim));
  });
  const you = xf(soldier([0, 0, 0], 0, 0, 0, 0), { pos: PLM, ry: Math.atan2(-4 - PLM[0], -2.3 - PLM[2]) });
  const youRing = ring(add(PLM, [0, 0.03, 0]), 0.7 + 0.06 * Math.sin(f / 4), "y", 24);
  // o soldado esmagado pela torre (perto da porta)
  const crushed = P(f, towerAt + 14, 6);
  const victim = soldier([-0.3, FY, -3.6], 0.4, 0);
  const route: V[] = [fy(1.2, 2.6), fy(0.6, -1.0), fy(0, -3.6), fy(0, -4.9)];
  const blocked = P(f, blockAt, 10);
  const ghost = P(f, emptyAt, 10);
  const ghostSegs = box(CRATE_P, 1, 1, 1).flatMap(([a, b]) => dashed([a, b], 0.12));
  return (
    <AbsoluteFill style={{ opacity: o, transform: skip ? `translateX(${(rnd(f) - 0.5) * 26}px)` : undefined, filter: skip ? "brightness(1.6) saturate(0.4)" : undefined }}>
      <Wire
        cam={cam}
        fog={26}
        layers={[
          ...roomLayers(st, f),
          { segs: sold, color: RED, width: 2, alpha: f >= combineAt ? 1 : 0 },
          { segs: you, color: ORANGE, width: 2.2 },
          { segs: youRing, color: ORANGE, width: 1.6, alpha: 0.8 },
          { segs: victim, color: RED, width: 2, alpha: f >= towerAt - 30 ? 1 - crushed : 0 },
          { segs: dashed(route), color: blocked > 0.5 ? RED : ICE, width: 2.4, reveal: P(f, towerAt - 20, 20), alpha: f >= towerAt - 20 ? 1 : 0 },
          { segs: ghostSegs, color: ICE, width: 1.6, alpha: ghost * (0.6 + 0.4 * Math.sin(f / 3)) },
        ]}
      />
      <div style={{ position: "absolute", left: 120, top: 100, display: "flex", alignItems: "center", gap: 14, ...mono(24, ICE, 8), opacity: P(f, forgetAt) }}>
        <span style={{ width: 14, height: 14, borderRadius: 7, background: RED, opacity: Math.floor(f / 15) % 2 ? 1 : 0.35 }} />o mundo guarda
      </div>
      <Callout from={scr(HOLE_C, cam)} to={[150, 330]} text="continua destruída" sub="permanente" p={P(f, wallAt, 16) * (1 - P(f, towerAt - 30))} />
      <Callout from={scr([-0.3, 0.4, -0.9], cam)} to={[300, 820]} text="combine" sub="a mesma passagem" p={P(f, combineAt + 20, 16) * (1 - P(f, towerAt - 30))} color={RED} />
      <Callout from={scr(add(PLM, [0, 1.9, 0]), cam)} to={[1500, 860]} text="você" sub="eles chegam até você" p={P(f, combineAt + 90, 16) * (1 - P(f, towerAt - 30))} />
      <Chip text="+ 5 minutos" p={P(f, minAt) * (1 - P(f, takeAt - 10))} x={1800} y={100} align="right" />
      <Callout from={scr([0, -0.6, -4.2], cam)} to={[1300, 300]} text="rota bloqueada" sub="você vai precisar dela" p={blocked * (1 - P(f, takeAt - 10))} color={RED} />
      <Callout from={scr(CRATE_P, cam)} to={[1200, 860]} text="não volta" sub="o lugar fica vazio" p={ghost} />
    </AbsoluteFill>
  );
};

// 5 · "não seria um jogo de escolhas no sentido de Detroit": o menu de escolhas real; em `optAt` o recorte nas
// opções; em `playAt` a tela do Detroit recua e volta a sala com a mira ("você simplesmente joga").
export const HLNoChoice: React.FC<{ life: number; src: string; shots: { from: number; at: number; dur: number }[]; optAt?: number; playAt?: number; credit?: string }> = ({ life, src, shots, optAt = 1e9, playAt = 1e9, credit = "" }) => {
  const f = useCurrentFrame();
  const o = fadeLife(f, life, 8, 10);
  const back = lerp(f, playAt, playAt + 18, 0, 1, E(Easing.in(Easing.cubic)));
  const opt = P(f, optAt, 10);
  const PW = 1500;
  const PH = 844;
  return (
    <AbsoluteFill style={{ opacity: o }}>
      {back > 0 ? (
        <AbsoluteFill style={{ opacity: P(f, playAt + 6, 14) }}>
          <Wire cam={roomCam(f, 0.6, 9.6 - 1.2 * P(f, playAt, 40))} fog={26} layers={roomLayers({ holeT: 300, lock: 1 }, f)} />
          <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
            {[0, 90, 180, 270].map((ang) => (
              <line key={ang} x1={960} y1={540 - 14} x2={960} y2={540 - 34} stroke={ORANGE} strokeWidth={3} transform={`rotate(${ang} 960 540)`} />
            ))}
            <circle cx={960} cy={540} r={3} fill={ORANGE} />
          </svg>
          <BigLabel text="você simplesmente joga" p={P(f, playAt + 10, 16)} y={860} size={64} />
        </AbsoluteFill>
      ) : null}
      <div style={{ position: "absolute", left: 960 - PW / 2, top: 540 - PH / 2 - 20, width: PW, height: PH, borderRadius: 24, overflow: "hidden", border: "1px solid rgba(255,255,255,0.2)", boxShadow: "0 40px 120px rgba(0,0,0,0.6)", opacity: 1 - back, transform: `perspective(1600px) translateZ(${-back * 900}px) rotateX(${back * 18}deg)`, filter: `brightness(${1 - 0.5 * back})` }}>
        {shots.map((s, i) => (
          <Sequence key={i} from={s.at} durationInFrames={Math.max(1, s.dur)} premountFor={20}>
            <Clip src={src} from={s.from} />
          </Sequence>
        ))}
        <div style={{ position: "absolute", left: 24, bottom: 18, ...mono(15, "rgba(242,240,247,0.65)", 3) }}>{credit}</div>
      </div>
      {/* sem recorte nem legenda nas opções: o menu do jogo já se explica */}
      <div style={{ position: "absolute", left: 960 - PW / 2, top: 540 - PH / 2 - 66, ...mono(24, HL.dim, 8), opacity: P(f, 0, 12) * (1 - back) }}>jogo de escolhas</div>
    </AbsoluteFill>
  );
};

// 6 · ações materiais → consequências materiais (a caixa cai na tubulação e racha o chão); depois a régua de
// duração: sala · sequência · fase; "algumas decisões" vão até o fim e reverberam.
export const WFConsequence: React.FC<{ life: number; actAt?: number; consAt?: number; rulerAt?: number; salaAt?: number; seqAt?: number; faseAt?: number; someAt?: number; echoAt?: number }> = ({
  life,
  actAt = 1e9,
  consAt = 1e9,
  rulerAt,
  salaAt = 1e9,
  seqAt = 1e9,
  faseAt = 1e9,
  someAt = 1e9,
  echoAt = 1e9,
}) => {
  const f = useCurrentFrame();
  const o = fadeLife(f, life, 8, 10);
  const ruler = P(f, rulerAt ?? salaAt - 18, 18);
  const cam = roomCam(f, 0.7, 9.6 + 3 * ruler);
  const fall = lerp(f, actAt, actAt + 18, 0, 1, E(Easing.in(Easing.quad)));
  const crack = P(f, consAt, 10);
  const cracks: Seg[] = [];
  for (let k = 0; k < 9; k++) {
    const a = (k / 9) * Math.PI * 2 + rnd(k) * 0.5;
    const L = 0.6 + rnd(k * 5) * 1.3;
    const c: V = [1.0, FY + 0.02, -0.5];
    const m: V = [c[0] + Math.cos(a) * L * 0.5, FY + 0.02, c[2] + Math.sin(a) * L * 0.5 + (rnd(k * 9) - 0.5) * 0.3];
    cracks.push([c, m], [m, [c[0] + Math.cos(a + 0.3) * L, FY + 0.02, c[2] + Math.sin(a + 0.3) * L]]);
  }
  const st: RoomSt = { holeT: 300, lock: 0, crate: [2.0, 2.2 * (1 - fall), -1.2], hot: { crate: P(f, actAt) } };
  const marks: { t: string; at: number; x: number }[] = [
    { t: "sala", at: salaAt, x: 0.2 },
    { t: "sequência", at: seqAt, x: 0.45 },
    { t: "fase", at: faseAt, x: 0.7 },
  ];
  const X0 = 260;
  const XW = 1400;
  const fill = Math.max(0, ...marks.map((m, i) => {
    const prev = i > 0 ? marks[i - 1].x : 0;
    return f >= m.at ? prev + (m.x - prev) * P(f, m.at, 14) : 0;
  }));
  const long = P(f, someAt, 30);
  const echo = Math.max(0, f - echoAt);
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <AbsoluteFill style={{ opacity: 1 - 0.6 * ruler }}>
        <Wire cam={cam} fog={28} layers={[...roomLayers(st, f), { segs: cracks, color: ORANGE, width: 2, reveal: crack }]} />
      </AbsoluteFill>
      <Flash f={f} at={actAt + 18} x={scr([1.0, FY, -0.5], cam).x} y={scr([1.0, FY, -0.5], cam).y} size={700} color="rgba(255,190,120,0.6)" />
      <div style={{ position: "absolute", left: 120, top: 100, ...mono(24, ICE, 8), opacity: P(f, actAt) * (1 - ruler) }}>ação material</div>
      <div style={{ position: "absolute", left: 120, top: 140, ...mono(24, ORANGE, 8), opacity: crack * (1 - ruler) }}>consequência material</div>
      {/* régua de duração */}
      <div style={{ position: "absolute", left: X0, top: 600, width: XW, height: 4, background: "rgba(207,233,255,0.25)", opacity: ruler }} />
      <div style={{ position: "absolute", left: X0, top: 596, width: XW * Math.max(fill, long), height: 12, borderRadius: 6, background: ORANGE, boxShadow: `0 0 24px rgba(255,138,31,0.6)`, opacity: ruler }} />
      {marks.map((m) => (
        <div key={m.t} style={{ position: "absolute", left: X0 + XW * m.x - 150, top: 640, width: 300, textAlign: "center", ...mono(26, f >= m.at ? HL.text : "rgba(242,240,247,0.3)", 8), opacity: ruler }}>
          <div style={{ width: 2, height: 30, background: "currentColor", margin: "-58px auto 28px" }} />
          {m.t}
        </div>
      ))}
      <div style={{ position: "absolute", left: X0 + XW - 150, top: 640, width: 300, textAlign: "center", ...mono(26, long > 0.5 ? ORANGE : "rgba(242,240,247,0.3)", 8), opacity: ruler }}>
        <div style={{ width: 2, height: 30, background: "currentColor", margin: "-58px auto 28px" }} />o jogo inteiro
      </div>
      {echo > 0
        ? [0, 1, 2].map((k) => {
            const e = echo - k * 10;
            if (e <= 0) return null;
            return <div key={k} style={{ position: "absolute", left: X0 + XW - e * 9, top: 602 - e * 4.5, width: e * 18, height: e * 9, borderRadius: "50%", border: `2px solid ${ORANGE}`, opacity: Math.max(0, 1 - e / 45) * ruler }} />;
          })
        : null}
      <div style={{ position: "absolute", left: 0, right: 0, top: 380, textAlign: "center", ...mono(26, HL.dim, 10), opacity: ruler }}>quanto dura uma consequência</div>
    </AbsoluteFill>
  );
};

// planta vista de cima: 3 x 3 salas com portas no meio de cada parede (usada em rastros e marcas)
const PLAN_WALLS: Seg[] = (() => {
  const s: Seg[] = [];
  const g = 0.8;
  const cuts = [-6, 0, 6];
  const wall = (fixed: number, alongZ: boolean) => {
    let t = -9;
    const P3 = (k: number): V => (alongZ ? [fixed, 0, k] : [k, 0, fixed]);
    for (const c of cuts) {
      s.push([P3(t), P3(c - g)]);
      t = c + g;
    }
    s.push([P3(t), P3(9)]);
  };
  wall(-3, true);
  wall(3, true);
  wall(-3, false);
  wall(3, false);
  s.push([[-9, 0, -9], [9, 0, -9]], [[-9, 0, -9], [-9, 0, 9]], [[9, 0, -9], [9, 0, 9]], [[-9, 0, 9], [-0.8, 0, 9]], [[0.8, 0, 9], [9, 0, 9]]);
  return s;
})();
const PLAN_FLOOR: Seg[] = (() => {
  const s: Seg[] = [];
  for (let v = -9; v <= 9; v += 1.5) s.push([[v, -0.02, -9], [v, -0.02, 9]], [[-9, -0.02, v], [9, -0.02, v]]);
  return s;
})();
const p0 = (x: number, z: number): V => [x, 0.05, z];
const TRAIL_A: V[] = [p0(0, 9.8), p0(0, 6), p0(0, 3), p0(0, 0), p0(-3, 0), p0(-6, 0), p0(-6, -3), p0(-6, -6)];
const TRAIL_B: V[] = [p0(0, 9.8), p0(0, 6.4), p0(3, 6.4), p0(6, 6), p0(6, 3), p0(6, 0), p0(6, -3), p0(6, -6), p0(3, -6), p0(0, -6), p0(-3, -6), p0(-6, -6)];
const TRAIL_C: V[] = [p0(0, 9.8), p0(-1, 6.6), p0(-6, 6), p0(-6, 3), p0(-6, 0), p0(-6, -3), p0(-6, -6)];
const planCam = (f: number, tilt = 0): Cam => ({ pos: [Math.sin(f / 120) * 1.5, 23 - 4 * tilt, 7 + 8 * tilt], target: [0, 0, 0.5], f: 980 });
const polyline = (pts: V[]): Seg[] => pts.slice(0, -1).map((p, i) => [p, pts[i + 1]] as Seg);

// 7 · o jogo guarda a maneira como você passou: rastro de luz na planta; "dois jogadores": um segundo rastro, outro
// caminho, mesmo lugar.
export const WFTrails: React.FC<{ life: number; trailAt?: number; twoAt?: number; sameAt?: number; diffAt?: number }> = ({ life, trailAt = 0, twoAt = 1e9, sameAt = 1e9, diffAt = 1e9 }) => {
  const f = useCurrentFrame();
  const o = fadeLife(f, life, 10, 10);
  const cam = planCam(f, 0.35);
  const a = lerp(f, trailAt, trailAt + 70, 0, 1, E(Easing.inOut(Easing.quad)));
  const b = lerp(f, twoAt, sameAt + 6, 0, 1, E(Easing.inOut(Easing.quad)));
  const headA = polyAt(TRAIL_A, a);
  const headB = polyAt(TRAIL_B, b);
  const goal = scr(p0(-6, -6), cam);
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <Wire
        cam={cam}
        fog={40}
        layers={[
          { segs: PLAN_FLOOR, width: 1, alpha: 0.25 },
          { segs: PLAN_WALLS, width: 2, reveal: P(f, 0, 24) },
          { segs: polyline(TRAIL_A), color: ORANGE, width: 5, reveal: a },
          { segs: polyline(TRAIL_B), color: PURPLE, width: 5, reveal: b, alpha: f >= twoAt ? 1 : 0 },
          { segs: ring(headA, 0.35, "y", 16), color: ORANGE, width: 2, alpha: a > 0 && a < 1 ? 1 : 0 },
          { segs: ring(headB, 0.35, "y", 16), color: PURPLE, width: 2, alpha: b > 0 && b < 1 ? 1 : 0 },
          { segs: ring(p0(-6, -6), 0.9 + 0.1 * Math.sin(f / 5), "y", 24), color: HL.text, width: 2, alpha: P(f, sameAt) },
        ]}
      />
      <div style={{ position: "absolute", left: 120, top: 100, ...mono(24, ORANGE, 8), opacity: P(f, trailAt) }}>o jogo guarda o seu caminho</div>
      <Chip text="jogador 1" p={P(f, trailAt + 10)} x={120} y={160} color={ORANGE} />
      <Chip text="jogador 2" p={P(f, twoAt)} x={120} y={220} color={PURPLE} />
      <Callout from={goal} to={[goal.x + 160, goal.y - 160]} text="mesmo lugar" p={P(f, sameAt, 16)} color={HL.text} />
      <BigLabel text="caminhos completamente diferentes" p={P(f, diffAt, 16)} y={900} size={58} />
    </AbsoluteFill>
  );
};

// corredor que aparece atrás da porta: reto ou virando à direita (a porta "agora leva para outro corredor")
const CORR_A: Seg[] = [...wallGrid((u, v) => [-0.7, v, u], [-13, ZB], [FY, 0.9], 0.8), ...wallGrid((u, v) => [0.7, v, u], [-13, ZB], [FY, 0.9], 0.8), ...wallGrid((u, v) => [u, FY, v], [-0.7, 0.7], [-13, ZB], 0.7)];
const CORR_B: Seg[] = [
  ...wallGrid((u, v) => [-0.7, v, u], [-9.5, ZB], [FY, 0.9], 0.8),
  ...wallGrid((u, v) => [u, v, -9.5], [-0.7, 6], [FY, 0.9], 0.8),
  ...wallGrid((u, v) => [0.7, v, u], [-8.1, ZB], [FY, 0.9], 0.8),
  ...wallGrid((u, v) => [u, v, -8.1], [0.7, 6], [FY, 0.9], 0.8),
  ...wallGrid((u, v) => [u, FY, v], [-0.7, 6], [-9.5, -8.1], 0.7),
];

// 8 · a outra metade: o espaço muda sozinho. Você lê a sala (portas, cobertura, inimigos); no meio da luta ela muda:
// a porta dá em outro corredor e a parede que você destruiu volta inteira.
export const WFLivingRoom: React.FC<{
  life: number;
  halfAt?: number;
  aloneAt?: number;
  doorsAt?: number;
  coverAt?: number;
  enemAt?: number;
  changeAt?: number;
  corrAt?: number;
  wallAt?: number;
}> = ({ life, halfAt = 0, aloneAt = 1e9, doorsAt = 1e9, coverAt = 1e9, enemAt = 1e9, changeAt = 1e9, corrAt = 1e9, wallAt = 1e9 }) => {
  const f = useCurrentFrame();
  const o = fadeLife(f, life, 8, 10);
  const shiftA = lerp(f, aloneAt, aloneAt + 30, 0, 1, E(Easing.inOut(Easing.cubic))) * (1 - lerp(f, aloneAt + 40, aloneAt + 70, 0, 1, E(Easing.inOut(Easing.cubic))));
  const glitch = f >= changeAt && f < changeAt + 14 && (f - changeAt) % 4 < 2;
  const cam = roomCam(f, 0.4, 9.6);
  const sw = lerp(f, corrAt, corrAt + 10, 0, 1, C);
  const rebuild = lerp(f, wallAt, wallAt + 30, 0, 1, E(Easing.inOut(Easing.cubic)));
  const st: RoomSt = { holeT: 300, rebuild: f >= wallAt ? Math.max(0.001, rebuild) : undefined, lock: 0, door: 1, tower: 0, hot: { door: P(f, doorsAt) * (1 - P(f, corrAt + 30)), crate: P(f, coverAt) * (1 - P(f, changeAt)), patch: P(f, wallAt) } };
  const room = roomLayers(st, f);
  // "o espaço muda sozinho": a parede direita avança e o teto desce, e voltam
  const warpR = (p: V): V => (p[0] > XR - 0.01 ? [p[0] - 1.6 * shiftA, p[1], p[2]] : p[1] > CY - 0.01 ? [p[0], p[1] - 0.7 * shiftA, p[2]] : p);
  const lay = room.map((L) => ({ ...L, segs: shiftA > 0.001 ? L.segs.map(([a, b]) => [warpR(a), warpR(b)] as Seg) : L.segs }));
  const enemies: Seg[] = [...soldier([1.8, FY, -3.6], 0.3, 0), ...soldier([-2.2, FY, -3.9], -0.3, 1)];
  return (
    <AbsoluteFill style={{ opacity: o, transform: glitch ? `translateX(${(rnd(f) - 0.5) * 34}px)` : undefined }}>
      <Wire
        cam={cam}
        fog={30}
        layers={[
          ...lay,
          { segs: CORR_A, width: 1.3, alpha: 0.55 * (1 - sw), color: ICE },
          { segs: CORR_B, width: 1.3, alpha: 0.75 * sw, color: "#ffd9b0" },
          { segs: enemies, color: RED, width: 2, alpha: P(f, enemAt) },
        ]}
      />
      {glitch ? (
        <div style={{ position: "absolute", inset: 0, opacity: 0.5, transform: "translateX(12px)", mixBlendMode: "screen" }}>
          <Wire cam={cam} fog={30} layers={lay.map((L) => ({ ...L, color: "rgba(255,80,60,0.8)" }))} />
        </div>
      ) : null}
      <Chip text="a outra metade · o espaço muda sozinho" p={P(f, halfAt) * (1 - P(f, doorsAt - 10))} x={120} y={100} color={ORANGE} />
      <Callout from={scr([0, 0.2, ZB], cam)} to={[1130, 170]} text="portas" p={P(f, doorsAt, 14) * (1 - P(f, changeAt))} color={ICE} />
      <Callout from={scr([CRATE_P[0], -0.4, CRATE_P[2]], cam)} to={[520, 860]} text="cobertura" p={P(f, coverAt, 14) * (1 - P(f, changeAt))} color={ICE} />
      <Callout from={scr([1.8, 0.2, -3.6], cam)} to={[1560, 300]} text="inimigos" p={P(f, enemAt, 14) * (1 - P(f, changeAt))} color={RED} />
      <Callout from={scr([0.4, -0.5, -7], cam)} to={[1300, 160]} text="outro corredor" p={P(f, corrAt + 8, 14)} />
      <Callout from={scr(HOLE_C, cam)} to={[150, 330]} text="inteira de novo" p={P(f, wallAt + 20, 14)} />
    </AbsoluteFill>
  );
};

// 9 · a mesma área em dois estados: tomada pelos Combine → varredura → versão abandonada. Depois "tudo reage junto",
// tudo DENTRO da sala, uma coisa por palavra: você (o jogador aparece) · inimigos (soldados surgem apontando) ·
// objetos (setas em cima deles) · rotas (caminhos se desenham no chão) · física (a estrutura tomba).
const arrowDown = (tip: V, s = 1): Seg[] => {
  const top: V = add(tip, [0, 0.7 * s, 0]);
  return [
    [top, tip],
    [tip, add(tip, [-0.16 * s, 0.22 * s, 0])],
    [tip, add(tip, [0.16 * s, 0.22 * s, 0])],
    [tip, add(tip, [0, 0.22 * s, -0.16 * s])],
    [tip, add(tip, [0, 0.22 * s, 0.16 * s])],
  ];
};
export const WFTwoStates: React.FC<{ life: number; combAt?: number; abandAt?: number; reactAt?: number; tags?: { t: string; at: number }[] }> = ({ life, combAt = 0, abandAt = 1e9, reactAt = 1e9, tags = [] }) => {
  const f = useCurrentFrame();
  const o = fadeLife(f, life, 8, 10);
  const cam = roomCam(f, 0.62, 10);
  const scan = lerp(f, abandAt, abandAt + 40, 0, 1, E(Easing.inOut(Easing.quad)));
  const sx = XR + 0.5 - (XR - XL + 1) * scan; // linha de varredura: da direita para a esquerda
  const at = (i: number) => tags[i]?.at ?? 1e9;
  const comb: Seg[] = [
    ...soldier([1.2, FY, -2.4], 0.5, 0, 0),
    ...soldier([-1.6, FY, -1.0], -0.4, 0, 0),
    ...soldier([0.4, FY, 1.2], 0.1, 0, 0),
    // barricadas Combine (painéis) e luzes vermelhas
    ...xf(box([0, 0, 0], 1.6, 1.2, 0.12), { pos: [-0.4, FY + 0.6, -1.8], ry: 0.3 }),
    ...xf(box([0, 0, 0], 1.6, 1.2, 0.12), { pos: [2.2, FY + 0.6, 0.4], ry: -0.5 }),
    ...ring([-3.0, CY - 0.05, -4.0], 0.25, "y", 12),
    ...ring([2.8, CY - 0.05, 1.0], 0.25, "y", 12),
  ];
  const plants: Seg[] = [];
  for (let k = 0; k < 16; k++) {
    const x = XL + 0.3 + rnd(k * 7) * (XR - XL - 0.6);
    const z = ZB + 0.3 + rnd(k * 3) * (ZF - ZB - 0.6);
    let p: V = [x, FY, z];
    for (let j = 0; j < 5; j++) {
      const q: V = [p[0] + (rnd(k * 11 + j) - 0.5) * 0.3, p[1] + 0.22, p[2] + (rnd(k * 13 + j) - 0.5) * 0.3];
      plants.push([p, q]);
      p = q;
    }
  }
  const keepX = (segs: Seg[], left: boolean) => segs.filter(([a, b]) => ((a[0] + b[0]) / 2 < sx) === left);
  // física: a estrutura (em pé na versão abandonada) tomba na palavra
  const fall = lerp(f, at(4), at(4) + 20, 0, 1, C);
  const roomComb = roomLayers({ holeT: 300, lock: 0, door: 0.3, color: "rgba(255,170,160,0.9)" }, f);
  const roomAband = roomLayers({ holeT: 300, lock: 0, door: 1, tower: fall, towerDown: 1, crate: [0.8, 0, 0.6], color: "rgba(190,215,200,0.85)", hot: { tower: P(f, at(4), 6) } }, f);
  // você
  const PLs: V = [1.5, FY, 1.7];
  const you = P(f, at(0), 10);
  const youSegs = xf(soldier([0, 0, 0], 0, 0, 0, 0), { pos: add(PLs, [0, -0.6 * (1 - you), 0]), ry: Math.atan2(-1.5, -4.5) });
  // inimigos: sobem do chão e apontam para o jogador
  const en = P(f, at(1), 12);
  const enemies: V[] = [
    [-2.0, FY, -1.6],
    [0.2, FY, -3.4],
  ];
  const enemySegs = enemies.flatMap((e) => soldier([e[0], FY - 1.9 * (1 - en), e[2]], Math.atan2(PLs[0] - e[0], PLs[2] - e[2]), 0, 0, en));
  // objetos: setas descendo em cima da caixa, da mesa e da tubulação
  const ob = P(f, at(2), 10);
  const bob = Math.sin(f / 6) * 0.08;
  const objTips: V[] = [add(add(CRATE_P, [0.8, 0, 0.6]), [0, 0.65 + bob, 0]), [TABLE_P[0], TABLE_P[1] + 0.5 + bob, TABLE_P[2]], [PIPE_BREAK + 1.2, PIPE_Y + 0.3 + bob, PIPE_Z]];
  const arrows = objTips.flatMap((t2) => arrowDown(add(t2, [0, 0.8 * (1 - ob), 0]), 0.9));
  // rotas: caminhos do jogador até a porta e até o buraco
  const ro = lerp(f, at(3), at(3) + 22, 0, 1, OUT);
  const routeA = dashed([fy(PLs[0], PLs[2] - 0.4), fy(0.9, -1.0), fy(0, -3.6), fy(0, -4.9)]);
  const routeB = dashed([fy(PLs[0] - 0.4, PLs[2]), fy(-1.0, 0.0), fy(-3.2, -2.0), fy(-4.3, -2.3)]);
  const layers: Layer[] = [
    ...roomComb.map((L) => ({ ...L, segs: keepX(L.segs, true) })),
    { segs: keepX(comb, true), color: RED, width: 2, alpha: P(f, combAt + 6) },
    ...(scan > 0 ? roomAband.map((L) => ({ ...L, segs: keepX(L.segs, false) })) : []),
    { segs: scan > 0 ? keepX(plants, false) : [], color: "#8fe0a6", width: 1.6 },
    { segs: scan > 0 && scan < 1 ? [[[sx, FY, ZB], [sx, CY, ZB]], [[sx, FY, ZB], [sx, FY, ZF]], [[sx, CY, ZB], [sx, CY, ZF]]] : [], color: "#ffffff", width: 3 },
    { segs: youSegs, color: ORANGE, width: 2.4, alpha: you },
    { segs: ring(add(PLs, [0, 0.03, 0]), 0.7 + 0.06 * Math.sin(f / 4), "y", 24), color: ORANGE, width: 1.6, alpha: you },
    { segs: enemySegs, color: RED, width: 2, alpha: en },
    { segs: arrows, color: "#ffd9b0", width: 2.2, alpha: ob },
    { segs: routeA, color: ICE, width: 2.4, reveal: ro },
    { segs: routeB, color: ICE, width: 2.4, reveal: ro },
  ];
  // rótulos pequenos presos ao que aparece (no espaço, não como letreiro)
  const lab: { t: string; p: V; i: number; color: string }[] = [
    { t: "você", p: add(PLs, [0, 2.1, 0]), i: 0, color: ORANGE },
    { t: "inimigos", p: [enemies[0][0], FY + 2.2, enemies[0][2]], i: 1, color: RED },
    { t: "objetos", p: add(objTips[0], [0, 0.9, 0]), i: 2, color: "#ffd9b0" },
    { t: "rotas", p: fy(0.5, -2.2), i: 3, color: ICE },
    { t: "física", p: [3.1, 1.5, -2.6], i: 4, color: ORANGE },
  ];
  const tc = scr([3.1, -0.3, -3.6], cam);
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <Wire cam={cam} fog={28} layers={layers} />
      <Flash f={f} at={at(4) + 16} x={tc.x} y={tc.y} size={700} color="rgba(220,240,230,0.5)" />
      {lab.map((l) => {
        const q = scr(l.p, cam);
        const p = P(f, at(l.i), 10);
        return (
          <div key={l.t} style={{ position: "absolute", left: q.x - 120, top: q.y - 30, width: 240, textAlign: "center", ...mono(22, l.color, 6), opacity: p, transform: `translateY(${(1 - p) * 10}px)`, textShadow: "0 2px 14px rgba(0,0,0,0.95)" }}>
            {l.t}
          </div>
        );
      })}
      <Chip text="tomada pelos combine" p={P(f, combAt) * (1 - P(f, abandAt + 30))} x={120} y={100} color={RED} />
      <Chip text="a mesma área · abandonada" p={P(f, abandAt + 20) * (1 - P(f, reactAt, 10))} x={1800} y={100} align="right" color="#8fe0a6" />
      <div style={{ position: "absolute", left: 120, top: 100, ...mono(24, HL.dim, 8), opacity: P(f, reactAt, 12) }}>tudo reage junto</div>
    </AbsoluteFill>
  );
};

// 10 · o ciclo em 3D: o jogador (boneco laranja) e o espaço (a sala em miniatura). O arco de cima leva o sinal do
// jogador até a sala (ela se deforma: "modifica o espaço"); o de baixo traz de volta (surge um problema na frente
// do jogador: barreira e soldado). Em impAt o ciclo gira sozinho, com sinais indo e vindo.
const bez = (a: V, c: V, b: V, t: number): V => [
  (1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * c[0] + t * t * b[0],
  (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * c[1] + t * t * b[1],
  (1 - t) * (1 - t) * a[2] + 2 * (1 - t) * t * c[2] + t * t * b[2],
];
const bezSegs = (a: V, c: V, b: V, upTo = 1, n = 40): Seg[] => {
  const s: Seg[] = [];
  const m = Math.max(0, Math.round(n * upTo));
  for (let i = 0; i < m; i++) s.push([bez(a, c, b, i / n), bez(a, c, b, Math.min(upTo, (i + 1) / n))]);
  return s;
};
const pulse = (q: V, r = 0.12): Seg[] => [...ring(q, r, "x", 8), ...ring(q, r, "y", 8), ...ring(q, r, "z", 8)];
export const WFLoop: React.FC<{ life: number; aAt?: number; bAt?: number; impAt?: number }> = ({ life, aAt = 0, bAt = 1e9, impAt = 1e9 }) => {
  const f = useCurrentFrame();
  const o = fadeLife(f, life, 8, 10);
  const cam = orbit([0, 0.3, 0], 9.6, 0.22 * Math.sin(f / 80), 0.2, 1000);
  const PJ: V = [-4.2, -1.2, 0];
  const RM: V = [3.8, -0.4, 0];
  const a = lerp(f, aAt, aAt + 24, 0, 1, E(Easing.inOut(Easing.cubic)));
  const b = lerp(f, bAt, bAt + 24, 0, 1, E(Easing.inOut(Easing.cubic)));
  const topA: V = add(PJ, [0.4, 2.4, 0]);
  const topB: V = add(RM, [-1.6, 1.4, 0]);
  const topC: V = [0, 4.4, 0];
  const botA: V = add(RM, [-1.4, -1.3, 0]);
  const botB: V = add(PJ, [0.8, -0.2, 0]);
  const botC: V = [0, -3.4, 0.6];
  // a sala se deforma quando o sinal chega
  const hitA = interpolate(f, [aAt + 22, aAt + 30, aAt + 60], [0, 1, 0.35], C);
  const tt = f / 30;
  const room = roomLayers({ holeT: 300, lock: 0, door: 1 }, f).map((L) => ({
    ...L,
    segs: xf(L.segs, { scale: 0.48 }).map(([p1, p2]) => {
      const w = (q: V): V => [q[0] + Math.sin(q[1] * 3 + tt * 3) * 0.18 * hitA, q[1] + Math.sin(q[0] * 2.5 + tt * 2) * 0.14 * hitA, q[2]];
      return [add(w(p1), RM), add(w(p2), RM)] as Seg;
    }),
  }));
  // o problema que volta: uma barreira sobe na frente do jogador e um soldado aparece apontando
  const hitB = lerp(f, bAt + 22, bAt + 36, 0, 1, E(Easing.out(Easing.back(1.4))));
  const barrier = xf(box([0, 0, 0], 0.18, 1.3, 1.6), { pos: add(PJ, [1.3, -0.85 + 0.65 * hitB, 0]) });
  const foe = xf(soldier([0, 0, 0], -Math.PI / 2, 0, 0, hitB), { pos: add(PJ, [2.6, -1.5, 0.5]), scale: 0.85 });
  // as bolinhas circulando nascem junto com a volta ("de volta o problema"), não no "isso cria"
  void impAt;
  const spin = Math.max(0, f - bAt);
  const dots: Seg[] = [];
  const dotsB: Seg[] = [];
  if (spin > 0)
    for (let k = 0; k < 4; k++) {
      const t1 = (((spin * 0.022 + k / 4) % 1) + 1) % 1;
      dots.push(...pulse(bez(topA, topC, topB, t1), 0.1));
      dotsB.push(...pulse(bez(botA, botC, botB, t1), 0.1));
    }
  const headA = a > 0 && a < 1 ? pulse(bez(topA, topC, topB, a), 0.16) : [];
  const headB = b > 0 && b < 1 ? pulse(bez(botA, botC, botB, b), 0.16) : [];
  const pj = scr(add(PJ, [0, -1.5, 0]), cam);
  const rm = scr(add(RM, [0, -1.1, 0.9]), cam);
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <Wire
        cam={cam}
        fog={30}
        layers={[
          { segs: xf(soldier([0, 0, 0], 0.9, 0, 0, 0), { pos: add(PJ, [0, -1.5, 0]), scale: 1.25 }), color: ORANGE, width: 2.6, alpha: P(f, 0, 14) },
          { segs: ring(add(PJ, [0, -1.47, 0]), 0.8 + 0.06 * Math.sin(f / 4), "y", 24), color: ORANGE, width: 1.6, alpha: P(f, 0, 14) },
          ...room.map((L) => ({ ...L, alpha: (L.alpha ?? 1) * P(f, 4, 16), color: hitA > 0.3 ? "#ffe0c2" : L.color })),
          { segs: bezSegs(topA, topC, topB, a), color: ORANGE, width: 3 },
          { segs: bezSegs(botA, botC, botB, b), color: ICE, width: 3 },
          { segs: headA, color: ORANGE, width: 2.4 },
          { segs: headB, color: ICE, width: 2.4 },
          { segs: dots, color: ORANGE, width: 2, alpha: P(f, bAt, 10) },
          { segs: dotsB, color: ICE, width: 2, alpha: P(f, bAt, 10) },
          { segs: barrier, color: RED, width: 2, alpha: hitB },
          { segs: foe, color: RED, width: 2, alpha: hitB },
        ]}
      />
      <div style={{ position: "absolute", left: pj.x - 150, top: pj.y + 24, width: 300, textAlign: "center", ...mono(24, ORANGE, 8), opacity: P(f, 0, 14) }}>jogador</div>
      <div style={{ position: "absolute", left: rm.x - 150, top: rm.y + 24, width: 300, textAlign: "center", ...mono(24, ICE, 8), opacity: P(f, 4, 14) }}>espaço</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 120, textAlign: "center", ...mono(22, ORANGE, 6), opacity: a }}>modifica o espaço</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 930, textAlign: "center", ...mono(22, ICE, 6), opacity: b }}>modifica de volta o problema</div>
    </AbsoluteFill>
  );
};

// 11 · cada pessoa atravessa de um jeito: não é um mapa sorteado (dado), são as marcas que você deixa (cicatrizes na
// planta que mudam o mundo); no fim, dois mundos lado a lado já diferentes.
export const WFMarks: React.FC<{ life: number; dieAt?: number; mapAt?: number; marksAt?: number; affectAt?: number; routeAt?: number; worldAt?: number }> = ({
  life,
  dieAt = 1e9,
  mapAt = 1e9,
  marksAt = 1e9,
  affectAt = 1e9,
  routeAt = 1e9,
  worldAt = 1e9,
}) => {
  const f = useCurrentFrame();
  const o = fadeLife(f, life, 8, 10);
  const two = P(f, routeAt - 6, 24);
  const cam = planCam(f, 0.3);
  // dado rolando
  const dt = Math.max(0, f - dieAt);
  const dieP = dt > 0 ? Math.min(1, dt / 26) : 0;
  const die = xf(box([0, 0, 0], 1.6, 1.6, 1.6).concat(ring([0, 0, 0.81], 0.18, "z", 10), ring([0.4, 0.4, 0.81], 0.14, "z", 8), ring([-0.4, -0.4, 0.81], 0.14, "z", 8)), { scale: 1.9, rx: dt * 0.35 * (1 - dieP * 0.7), ry: dt * 0.27, pos: [-5 + 5 * dieP, 1.2 + Math.abs(Math.sin(dt / 5)) * 1.4 * (1 - dieP), 0] });
  const dieOut = P(f, marksAt - 14, 14);
  // marcas ao longo do rastro A
  const markList: { segs: Seg[]; at: number; pos: V }[] = [
    { segs: ring(p0(0, 1.5), 0.7, "y", 18).concat(ring(p0(0, 1.5), 0.4, "y", 12)), at: marksAt, pos: p0(0, 1.5) },
    { segs: [[[-3, 0.1, -1.2], [-3, 0.1, 1.2]], [[-3.3, 0.1, -0.8], [-2.7, 0.1, 0.9]], [[-2.7, 0.1, -0.9], [-3.3, 0.1, 0.8]]], at: marksAt + 8, pos: p0(-3, 0) },
    { segs: [[[-7.5, 0.1, -2.6], [-4.5, 0.1, -3.4]], [[-7.5, 0.1, -2.2], [-4.5, 0.1, -3.0]]], at: marksAt + 16, pos: p0(-6, -2.8) },
    { segs: dashed([p0(-5.0, -0.6), p0(-4.0, -0.6), p0(-4.0, 0.4), p0(-5.0, 0.4), p0(-5.0, -0.6)], 0.2), at: marksAt + 24, pos: p0(-4.5, -0.1) },
  ];
  const aff = P(f, affectAt, 20);
  const enemy: Seg[] = [...soldier([-7, 0, 1.2], 0.6, f * 0.3), ...soldier([2, 0, -1], -0.6, f * 0.3 + 1)].map(([a, b]) => [[a[0], a[1] * 0.5, a[2]], [b[0], b[1] * 0.5, b[2]]] as Seg);
  const single = (
    <Wire
      cam={cam}
      fog={40}
      layers={[
        { segs: PLAN_FLOOR, width: 1, alpha: 0.25 },
        { segs: PLAN_WALLS, width: 2 },
        { segs: polyline(TRAIL_A), color: ORANGE, width: 3, alpha: Math.max(0.5 * P(f, marksAt - 20, 20), 0.55 * P(f, 0, 20) * (1 - P(f, dieAt - 10, 14))), reveal: lerp(f, 0, 45, 0, 1, OUT) },
        { segs: polyline(TRAIL_B), color: PURPLE, width: 3, alpha: 0.55 * P(f, 6, 20) * (1 - P(f, dieAt - 10, 14)), reveal: lerp(f, 6, 55, 0, 1, OUT) },
        { segs: polyline(TRAIL_C), color: "#8fe0a6", width: 3, alpha: 0.55 * P(f, 12, 20) * (1 - P(f, dieAt - 10, 14)), reveal: lerp(f, 12, 60, 0, 1, OUT) },
        ...markList.map((m) => ({ segs: m.segs, color: ORANGE, width: 3, reveal: P(f, m.at, 10) })),
        ...markList.map((m) => ({ segs: aff > 0 ? [[m.pos, add(m.pos, [0, 2.2 * aff, 0])] as Seg] : [], color: "#ffd9b0", width: 1.5, alpha: 0.6 })),
        { segs: enemy, color: RED, width: 2, alpha: aff },
        { segs: die, color: ICE, width: 2.2, alpha: (f >= dieAt ? 1 : 0) * (1 - dieOut) },
      ]}
    />
  );
  // dois mundos: mesma planta, marcas e caminhos diferentes
  const worldA: Layer[] = [
    { segs: PLAN_FLOOR, width: 1, alpha: 0.25 },
    { segs: PLAN_WALLS, width: 2 },
    { segs: polyline(TRAIL_A), color: ORANGE, width: 4 },
    ...markList.map((m) => ({ segs: m.segs, color: ORANGE, width: 3, alpha: P(f, worldAt, 14) })),
  ];
  const marksB: Seg[] = [...ring(p0(6, 1.5), 0.7, "y", 18), [[3, 0.1, -7.2], [3, 0.1, -4.8]], [[5, 0.1, -4.2], [7.5, 0.1, -3.4]], ...ring(p0(-3, -6), 0.6, "y", 16)];
  const worldB: Layer[] = [
    { segs: PLAN_FLOOR, width: 1, alpha: 0.25 },
    { segs: PLAN_WALLS, width: 2 },
    { segs: polyline(TRAIL_B), color: PURPLE, width: 4 },
    { segs: marksB, color: PURPLE, width: 3, alpha: P(f, worldAt, 14) },
  ];
  const mini = (layers: Layer[], x: number, label: string, col: string) => (
    <div style={{ position: "absolute", left: x, top: 150, width: 820, height: 640, borderRadius: 24, overflow: "hidden", border: "1px solid rgba(255,255,255,0.18)", background: "rgba(5,4,10,0.55)", opacity: two, transform: `translateY(${(1 - two) * 30}px)` }}>
      <div style={{ position: "absolute", left: -550, top: -220, width: W, height: H, transform: "scale(0.62)", transformOrigin: "960px 540px" }}>
        <Wire cam={planCam(f, 0.1)} fog={40} layers={layers} />
      </div>
      <div style={{ position: "absolute", left: 24, top: 18, ...mono(20, col, 5) }}>{label}</div>
    </div>
  );
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <AbsoluteFill style={{ opacity: 1 - two }}>{single}</AbsoluteFill>
      <BigLabel text="sorteou um mapa novo" p={P(f, dieAt + 4, 12) * (1 - dieOut)} y={860} size={60} strike={P(f, mapAt + 6, 12)} />
      <div style={{ position: "absolute", left: 120, top: 100, ...mono(24, ORANGE, 8), opacity: P(f, marksAt) * (1 - two) }}>marcas no caminho</div>
      <div style={{ position: "absolute", left: 120, top: 140, ...mono(20, "#ffd9b0", 5), opacity: aff * (1 - two) }}>o mundo responde a elas</div>
      {mini(worldA, 120, "jogador 1", ORANGE)}
      {mini(worldB, 980, "jogador 2", PURPLE)}
      <BigLabel text="uma rota diferente" p={P(f, routeAt + 6, 12) * (1 - P(f, worldAt - 6, 10))} y={850} size={56} strike={P(f, routeAt + 30, 12)} />
      <BigLabel text="um mundo diferente" p={P(f, worldAt, 14)} y={850} size={72} color={ORANGE} />
    </AbsoluteFill>
  );
};

// 12 · três sistemas conversando, em 3D: ESPAÇO (a sala em miniatura dobrando) · FÍSICA (caixa tombando em arco
// com a trajetória) · IA (soldado Combine varrendo com o cone de visão). Fios curvos ligam os três com sinais indo e
// vindo; cada um acende na sua palavra.
export const WFThreeSystems: React.FC<{ life: number; eAt?: number; fAt?: number; iAt?: number }> = ({ life, eAt = 1e9, fAt = 1e9, iAt = 1e9 }) => {
  const f = useCurrentFrame();
  const o = fadeLife(f, life, 10, 14);
  const cam = orbit([0, -0.1, 0], 9.2, 0.18 * Math.sin(f / 90), 0.14, 1000);
  const tt = f / 30;
  const R = 4.3;
  const at3 = [eAt, fAt, iAt];
  void R;
  // triângulo de pé, de frente para a câmera: espaço em cima, física embaixo à direita, IA embaixo à esquerda
  const C3: V[] = [[0, 2.0, 0], [3.5, -1.6, 0], [-3.5, -1.6, 0]];
  const lit = at3.map((t) => P(f, t, 14));
  const base = (i: number) => Math.max(0.35 * P(f, 6 + i * 5, 16), lit[i]);
  const flash = (i: number) => interpolate(f, [at3[i], at3[i] + 6, at3[i] + 24], [0, 1, 0], C);
  const dim = "rgba(207,233,255,0.7)";
  // ESPAÇO: a sala em miniatura que dobra
  const bendE = 0.12 + 0.28 * lit[0];
  const roomE: Layer[] = roomLayers({ holeT: 300, lock: 0, door: 1 }, f).map((L) => ({
    ...L,
    segs: xf(L.segs, { scale: 0.46, ry: -0.55, rx: 0.42 }).map(([p1, p2]) => {
      const w = (q: V): V => {
        const ang = Math.sin(q[1] * 2.2 + tt * 1.6) * 0.35 * bendE;
        return [q[0] * Math.cos(ang) - q[2] * Math.sin(ang), q[1] + Math.sin(q[0] * 2 + tt * 2) * 0.08 * bendE, q[0] * Math.sin(ang) + q[2] * Math.cos(ang)];
      };
      return [add(w(p1), C3[0]), add(w(p2), C3[0])] as Seg;
    }),
    alpha: (L.alpha ?? 1) * base(0),
    color: lit[0] > 0.5 ? (flash(0) > 0.3 ? "#ffe0c2" : L.color) : dim,
  }));
  // FÍSICA: caixa voa em arco girando (em loop), com a trajetória tracejada e o chão
  const ph = (tt * 0.6) % 1;
  const arcP = (t: number): V => add(C3[1], [-1.2 + 2.4 * t, -0.9 + 5.2 * t * (1 - t), 0]);
  const crate = xf(box([0, 0, 0], 1.05, 1.05, 1.05), { pos: arcP(ph), rz: -ph * Math.PI * 2, rx: ph * 1.2 });
  const traj = dashed(Array.from({ length: 21 }).map((_, i) => arcP(i / 20)), 0.18);
  const fl = (x: number, z: number): V => add(C3[1], [x, -1.25, z]);
  const floorF: Seg[] = [[fl(-1.6, -0.6), fl(1.6, -0.6)], [fl(-1.6, 0.6), fl(1.6, 0.6)], [fl(-1.6, -0.6), fl(-1.6, 0.6)], [fl(1.6, -0.6), fl(1.6, 0.6)]];
  // IA: soldado com o cone de visão varrendo
  const dirA = Math.sin(tt * 1.3) * 0.7 + Math.PI * 0.75;
  const sold = xf(soldier([0, 0, 0], 0, 0, 0, 0.6), { pos: add(C3[2], [0, -1.25, 0]), ry: dirA, scale: 1.3 });
  const eye: V = add(C3[2], [0, 0.9, 0]);
  const tip = (da: number): V => add(eye, [Math.sin(dirA + da) * 2.2, -0.7, Math.cos(dirA + da) * 2.2]);
  const cone: Seg[] = [[eye, tip(-0.35)], [eye, tip(0.35)], [tip(-0.35), tip(0)], [tip(0), tip(0.35)]];
  // fios entre os três, com sinais nos dois sentidos
  const wires: Layer[] = [];
  [0, 1, 2].forEach((i) => {
    const A = C3[i];
    const B = C3[(i + 1) % 3];
    const mid: V = [((A[0] + B[0]) / 2) * 1.35, ((A[1] + B[1]) / 2) * 1.35 + 0.3, 1.2];
    const both = Math.min(lit[i], lit[(i + 1) % 3]);
    const sig: Seg[] = [];
    const sigB: Seg[] = [];
    if (both > 0)
      for (let k = 0; k < 2; k++) {
        const t1 = (((tt * 0.45 + k / 2 + i * 0.17) % 1) + 1) % 1;
        sig.push(...pulse(bez(A, mid, B, t1), 0.1));
        sigB.push(...pulse(bez(A, mid, B, 1 - t1), 0.1));
      }
    wires.push({ segs: bezSegs(A, mid, B), color: "rgba(207,233,255,0.6)", width: 1.6, alpha: Math.max(both, 0.25 * P(f, 12, 16)) });
    wires.push({ segs: sig, color: ORANGE, width: 2.2, alpha: both });
    wires.push({ segs: sigB, color: ICE, width: 2.2, alpha: both });
  });
  const labels = ["espaço", "física", "inteligência artificial"];
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <Wire
        cam={cam}
        fog={34}
        layers={[
          ...wires,
          ...roomE,
          { segs: [...crate, ...floorF], color: lit[1] > 0.5 ? (flash(1) > 0.3 ? "#ffe0c2" : ORANGE) : dim, width: 2, alpha: base(1) },
          { segs: traj, color: ICE, width: 1.4, alpha: base(1) * 0.7 },
          { segs: sold, color: lit[2] > 0.5 ? (flash(2) > 0.3 ? "#ffd0c8" : RED) : dim, width: 2, alpha: base(2) },
          { segs: cone, color: lit[2] > 0.5 ? RED : dim, width: 1.4, alpha: base(2) * 0.8 },
        ]}
      />
      {C3.map((c, i) => {
        const q = scr(add(c, [0, -1.6, 0]), cam);
        return (
          <div key={i} style={{ position: "absolute", left: q.x - 220, top: q.y + 6, width: 440, textAlign: "center", ...mono(26, lit[i] > 0.5 ? HL.text : "rgba(207,233,255,0.55)", 8), opacity: base(i), textShadow: lit[i] > 0.5 ? "0 0 22px rgba(255,138,31,0.5)" : undefined }}>
            {labels[i]}
          </div>
        );
      })}
      <div style={{ position: "absolute", left: 0, right: 0, top: 90, textAlign: "center", ...mono(26, HL.dim, 10), opacity: P(f, 0, 14) }}>três sistemas · conversando o tempo inteiro</div>
    </AbsoluteFill>
  );
};

// peças compartilhadas com o 2C–2F (hl3h.tsx / hl3i.tsx)
export { RED, PURPLE, lerpV, FY, CY, XL, XR, ZB, ZF, DOOR, WIN, HOLE, HOLE_C, PATCH, SHELL, TABLE_P, KEY_P, CRATE_P, TOWER, TOWER_PIV, PIPE_Y, PIPE_Z, PIPE_BREAK, wallGrid, rectOut, mBack, mLeft, mRight, mFloor, shatter, soldier, dashed, polyAt, polyLen, turnTo, fy, roomLayers, roomCam, P, scr, Flash, Chip, bez, bezSegs, pulse, flame, arrowDown, PLAN_WALLS, PLAN_FLOOR, planCam, polyline };
export type { RoomSt, Rect };
