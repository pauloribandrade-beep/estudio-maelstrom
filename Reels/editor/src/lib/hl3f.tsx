import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { FONT, MONO } from "./overlays";
import { C, Clip, HL, OUT, lerp, rnd } from "./hl3";

// Bloco 2A (parte "Gameplay", 2026-10-01): mecânicas representadas em WIREFRAME 3D (linhas projetadas em SVG,
// mesma linguagem do "carro girando" da 1B: azul-gelo com acentos laranja, rótulos mono com linha de chamada).
// Sem WebGL (sai igual na prévia e no render). Tempos em QUADROS relativos à cena.

// ============================================================================================== motor
type V = [number, number, number];
type Seg = [V, V];
type P2 = [number, number];
const add = (a: V, b: V): V => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: V, b: V): V => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: V, b: V) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V, b: V): V => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a: V): V => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
const rot = (p: V, rx: number, ry: number, rz = 0): V => {
  let [x, y, z] = p;
  // Z
  let c = Math.cos(rz);
  let s = Math.sin(rz);
  [x, y] = [x * c - y * s, x * s + y * c];
  // X
  c = Math.cos(rx);
  s = Math.sin(rx);
  [y, z] = [y * c - z * s, y * s + z * c];
  // Y
  c = Math.cos(ry);
  s = Math.sin(ry);
  [x, z] = [x * c + z * s, -x * s + z * c];
  return [x, y, z];
};
const xf = (segs: Seg[], o: { pos?: V; rx?: number; ry?: number; rz?: number; scale?: number; pivot?: V }) =>
  segs.map(
    ([a, b]) =>
      [a, b].map((p) => {
        const pv = o.pivot ?? [0, 0, 0];
        const q = rot(sub(p, pv), o.rx ?? 0, o.ry ?? 0, o.rz ?? 0);
        const k = o.scale ?? 1;
        return add(add([q[0] * k, q[1] * k, q[2] * k], pv), o.pos ?? [0, 0, 0]);
      }) as Seg,
  );

type Cam = { pos: V; target: V; f?: number };
const W = 1920;
const H = 1080;
const project = (p: V, cam: Cam) => {
  const fw = norm(sub(cam.target, cam.pos));
  const rt = norm(cross(fw, [0, 1, 0]));
  const up = cross(rt, fw);
  const d = sub(p, cam.pos);
  const depth = dot(d, fw);
  const f = cam.f ?? 1100;
  return { x: W / 2 + (f * dot(d, rt)) / depth, y: H / 2 - (f * dot(d, up)) / depth, depth };
};
const orbit = (target: V, dist: number, yaw: number, pitch: number, f?: number): Cam => ({
  target,
  pos: [target[0] + Math.sin(yaw) * Math.cos(pitch) * dist, target[1] + Math.sin(pitch) * dist, target[2] + Math.cos(yaw) * Math.cos(pitch) * dist],
  f,
});

// modelos
const box = (c: V, w: number, h: number, d: number): Seg[] => {
  const [x, y, z] = c;
  const v: V[] = [
    [x - w / 2, y - h / 2, z - d / 2],
    [x + w / 2, y - h / 2, z - d / 2],
    [x + w / 2, y + h / 2, z - d / 2],
    [x - w / 2, y + h / 2, z - d / 2],
    [x - w / 2, y - h / 2, z + d / 2],
    [x + w / 2, y - h / 2, z + d / 2],
    [x + w / 2, y + h / 2, z + d / 2],
    [x - w / 2, y + h / 2, z + d / 2],
  ];
  return [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]].map(([i, j]) => [v[i], v[j]] as Seg);
};
const ring = (c: V, r: number, axis: "x" | "y" | "z", n = 28): Seg[] => {
  const pts: V[] = Array.from({ length: n }).map((_, i) => {
    const a = (i / n) * Math.PI * 2;
    const u = Math.cos(a) * r;
    const w2 = Math.sin(a) * r;
    return axis === "z" ? [c[0] + u, c[1] + w2, c[2]] : axis === "y" ? [c[0] + u, c[1], c[2] + w2] : [c[0], c[1] + u, c[2] + w2];
  });
  return pts.map((p, i) => [p, pts[(i + 1) % n]] as Seg);
};
const cyl = (c: V, r: number, h: number, axis: "y" | "z", n = 20, every = 4): Seg[] => {
  const off: V = axis === "y" ? [0, h / 2, 0] : [0, 0, h / 2];
  const a = ring(add(c, off), r, axis, n);
  const b = ring(sub(c, off), r, axis, n);
  const v: Seg[] = [];
  for (let i = 0; i < n; i += every) v.push([a[i][0], b[i][0]]);
  return [...a, ...b, ...v];
};
const extrude = (poly: P2[], depth: number, every = 1, z0 = 0): Seg[] => {
  const F = poly.map(([x, y]) => [x, y, z0 + depth / 2] as V);
  const B = poly.map(([x, y]) => [x, y, z0 - depth / 2] as V);
  const s: Seg[] = [];
  for (let i = 0; i < poly.length; i++) {
    const j = (i + 1) % poly.length;
    s.push([F[i], F[j]], [B[i], B[j]]);
    if (i % every === 0) s.push([F[i], B[i]]);
  }
  return s;
};
const arc = (cx: number, cy: number, r: number, a0: number, a1: number, n: number): P2[] =>
  Array.from({ length: n + 1 }).map((_, i) => {
    const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  });
const outline = (center: P2[], w: number): P2[] => {
  const L: P2[] = [];
  const R: P2[] = [];
  center.forEach((p, i) => {
    const a = center[Math.max(0, i - 1)];
    const b = center[Math.min(center.length - 1, i + 1)];
    let nx = -(b[1] - a[1]);
    let ny = b[0] - a[0];
    const l = Math.hypot(nx, ny) || 1;
    nx /= l;
    ny /= l;
    L.push([p[0] + (nx * w) / 2, p[1] + (ny * w) / 2]);
    R.push([p[0] - (nx * w) / 2, p[1] - (ny * w) / 2]);
  });
  return [...L, ...R.reverse()];
};
const subdivide = (segs: Seg[], n: number): Seg[] =>
  segs.flatMap(([a, b]) =>
    Array.from({ length: n }).map((_, i) => {
      const t0 = i / n;
      const t1 = (i + 1) / n;
      const m = (t: number): V => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
      return [m(t0), m(t1)] as Seg;
    }),
  );

// formas
const GAMEPAD_R: P2[] = [
  [0, 0.55],
  [0.9, 0.55],
  [1.25, 0.62],
  [1.58, 0.46],
  [1.78, 0.1],
  [1.97, -0.45],
  [2.06, -0.95],
  [1.96, -1.26],
  [1.7, -1.36],
  [1.44, -1.2],
  [1.14, -0.76],
  [0.8, -0.56],
  [0, -0.56],
];
const GAMEPAD: P2[] = [...GAMEPAD_R, ...GAMEPAD_R.slice(1, -1).reverse().map(([x, y]) => [-x, y] as P2)].reverse();
const gamepad = (): Seg[] => {
  const s = extrude(GAMEPAD, 0.5, 2);
  s.push(...cyl([-0.58, -0.45, 0.3], 0.22, 0.2, "z", 18, 6), ...cyl([0.58, -0.45, 0.3], 0.22, 0.2, "z", 18, 6));
  const cross = extrude(
    [
      [-0.08, 0.26],
      [0.08, 0.26],
      [0.08, 0.08],
      [0.26, 0.08],
      [0.26, -0.08],
      [0.08, -0.08],
      [0.08, -0.26],
      [-0.08, -0.26],
      [-0.08, -0.08],
      [-0.26, -0.08],
      [-0.26, 0.08],
      [-0.08, 0.08],
    ].map(([x, y]) => [x - 1.28, y + 0.05] as P2),
    0.1,
    3,
    0.28,
  );
  s.push(...cross);
  [
    [1.28, 0.27],
    [1.06, 0.05],
    [1.5, 0.05],
    [1.28, -0.17],
  ].forEach(([x, y]) => s.push(...ring([x, y, 0.27], 0.09, "z", 14)));
  return s;
};
const roundRect = (w: number, h: number, r: number, n = 6): P2[] => [
  ...arc(w / 2 - r, h / 2 - r, r, 0, 90, n),
  ...arc(-w / 2 + r, h / 2 - r, r, 90, 180, n),
  ...arc(-w / 2 + r, -h / 2 + r, r, 180, 270, n),
  ...arc(w / 2 - r, -h / 2 + r, r, 270, 360, n),
];
// curva do visor (vista de frente): superelipse larga, com o recorte do nariz embaixo no meio
const visorOutline = (A: number, B: number, n = 64): P2[] =>
  Array.from({ length: n }).map((_, i) => {
    const t = (i / n) * Math.PI * 2;
    const c = Math.cos(t);
    const sn = Math.sin(t);
    const x = A * Math.sign(c) * Math.abs(c) ** (2 / 4.2);
    let y = B * Math.sign(sn) * Math.abs(sn) ** (2 / 3.2);
    if (sn < 0) y += 0.42 * B * Math.exp(-((x / (0.26 * A)) ** 2)); // nariz
    return [x, y];
  });
const headset = (): Seg[] => {
  const A = 1.45;
  const B = 0.62;
  const s: Seg[] = [];
  // casca da frente: contorno + linhas de contorno (horizontais e verticais) seguindo a curvatura
  const zf = (x: number, y: number) => 0.55 - 0.32 * (x / A) ** 2 - 0.12 * (y / B) ** 2;
  const front = visorOutline(A, B).map(([x, y]) => [x, y, zf(x, y)] as V);
  front.forEach((pt, i) => s.push([pt, front[(i + 1) % front.length]]));
  for (const k of [-0.55, -0.15, 0.25, 0.62]) {
    const y = k * B;
    const xs = Array.from({ length: 24 }).map((_, i) => -A * 0.94 + (i / 23) * A * 1.88);
    const pts = xs.map((x) => [x, y + (k < 0 ? 0.42 * B * Math.exp(-((x / (0.26 * A)) ** 2)) * (k < -0.4 ? 1 : 0.4) : 0), zf(x, y)] as V);
    pts.forEach((pt, i) => i < pts.length - 1 && s.push([pt, pts[i + 1]]));
  }
  for (const k of [-0.7, -0.35, 0.35, 0.7]) {
    const x = k * A;
    const ys = Array.from({ length: 12 }).map((_, i) => -B * 0.9 + (i / 11) * B * 1.8);
    const pts = ys.map((y) => [x, y, zf(x, y)] as V);
    pts.forEach((pt, i) => i < pts.length - 1 && s.push([pt, pts[i + 1]]));
  }
  // corpo: contorno de trás (onde encosta o rosto) e as arestas ligando frente e trás
  const back = visorOutline(A * 0.93, B * 0.95).map(([x, y]) => [x, y, -0.55] as V);
  back.forEach((pt, i) => s.push([pt, back[(i + 1) % back.length]]));
  for (let i = 0; i < front.length; i += 4) s.push([front[i], back[i]]);
  // máscara de rosto (espuma): contorno mais para dentro
  const pad = visorOutline(A * 0.8, B * 0.8).map(([x, y]) => [x, y, -0.78] as V);
  pad.forEach((pt, i) => s.push([pt, pad[(i + 1) % pad.length]]));
  for (let i = 0; i < pad.length; i += 8) s.push([back[i], pad[i]]);
  // hastes laterais → faixa rígida em volta da cabeça (duas bordas) + almofada traseira
  const N = 44;
  const band = (dy: number): V[] =>
    Array.from({ length: N + 1 }).map((_, i) => {
      const t = Math.PI * (i / N); // só a parte de trás
      return [Math.cos(t) * 1.38, dy + 0.18 * Math.sin(t), -0.7 - Math.sin(t) * 2.3];
    });
  for (const dy of [-0.12, 0.12]) {
    const bpts = band(dy);
    bpts.forEach((pt, i) => i < N && s.push([pt, bpts[i + 1]]));
  }
  const b1 = band(-0.12);
  const b2 = band(0.12);
  for (let i = 0; i <= N; i += 4) s.push([b1[i], b2[i]]);
  // almofada traseira
  s.push(...xf(box([0, 0, 0], 0.9, 0.6, 0.25), { pos: [0, 0.2, -3.05] }));
  // faixa de cima
  const top: V[] = Array.from({ length: 17 }).map((_, i) => {
    const t = i / 16;
    return [0, B * 0.9 + Math.sin(Math.PI * t) * 0.75, -0.4 - 2.65 * t];
  });
  top.forEach((pt, i) => i < 16 && s.push([pt, top[i + 1]]));
  // câmeras/sensores na frente
  s.push(...ring([-0.95, 0.18, zf(-0.95, 0.18) + 0.01], 0.07, "z", 10), ...ring([0.95, 0.18, zf(0.95, 0.18) + 0.01], 0.07, "z", 10));
  return s;
};
const digit = (d: "2" | "3"): P2[] => {
  const c: P2[] =
    d === "3"
      ? [...arc(0, 0.52, 0.48, 150, -90, 14), ...arc(0, -0.5, 0.56, 90, -150, 16).slice(1)]
      : [...arc(0, 0.5, 0.5, 160, -25, 14), [-0.58, -1.02], [-0.58, -1.04], [0.62, -1.04]];
  return outline(c, 0.3);
};
const floorGrid = (y: number, size: number, step: number): Seg[] => {
  const s: Seg[] = [];
  for (let v = -size; v <= size + 1e-6; v += step) {
    s.push([[v, y, -size], [v, y, size]]);
    s.push([[-size, y, v], [size, y, v]]);
  }
  return s;
};
const roomGrid = (wx: number, hy: number, z0: number, z1: number, step: number): Seg[] => {
  const s: Seg[] = [];
  for (let z = z0; z <= z1 + 1e-6; z += step) {
    s.push([[-wx, -hy, z], [wx, -hy, z]], [[-wx, hy, z], [wx, hy, z]], [[-wx, -hy, z], [-wx, hy, z]], [[wx, -hy, z], [wx, hy, z]]);
  }
  for (let x = -wx; x <= wx + 1e-6; x += step) s.push([[x, -hy, z0], [x, -hy, z1]], [[x, hy, z0], [x, hy, z1]]);
  for (let y = -hy; y <= hy + 1e-6; y += step) s.push([[-wx, y, z0], [-wx, y, z1]], [[wx, y, z0], [wx, y, z1]]);
  return s;
};

// desenho
type Layer = { segs: Seg[]; color?: string; width?: number; reveal?: number; alpha?: number };
const Wire: React.FC<{ layers: Layer[]; cam: Cam; fog?: number }> = ({ layers, cam, fog = 18 }) => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
    <defs>
      <filter id="wfglow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3.2" result="g" />
        <feMerge>
          <feMergeNode in="g" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    <g filter="url(#wfglow)" strokeLinecap="round">
      {layers.map((L, li) => {
        const n = L.segs.length;
        const rv = L.reveal ?? 1;
        return L.segs.map(([a, b], i) => {
          const k = rv * n - i;
          if (k <= 0) return null;
          const t = Math.min(1, k);
          const bb: V = t < 1 ? [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t] : b;
          let pa: V = a;
          let pb: V = bb;
          const da = project(pa, cam).depth;
          const db = project(pb, cam).depth;
          if (da < 0.15 && db < 0.15) return null;
          if (da < 0.15 || db < 0.15) {
            const k2 = (0.15 - da) / (db - da);
            const q: V = [pa[0] + (pb[0] - pa[0]) * k2, pa[1] + (pb[1] - pa[1]) * k2, pa[2] + (pb[2] - pa[2]) * k2];
            if (da < 0.15) pa = q;
            else pb = q;
          }
          const A = project(pa, cam);
          const B = project(pb, cam);
          const dm = (A.depth + B.depth) / 2;
          const o = Math.max(0, Math.min(1, 1.35 - dm / fog)) * (L.alpha ?? 1);
          if (o <= 0.01) return null;
          return <line key={`${li}-${i}`} x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke={L.color ?? "#cfe9ff"} strokeWidth={(L.width ?? 2.2) * Math.min(1.6, 9 / dm + 0.4)} opacity={o} />;
        });
      })}
    </g>
  </svg>
);

const mono = (size: number, color = HL.dim, ls = 4): React.CSSProperties => ({ fontFamily: MONO, fontSize: size, letterSpacing: ls, textTransform: "uppercase", color });
const fadeLife = (f: number, life: number, a = 12, b = 12) => Math.min(lerp(f, 0, a, 0, 1, OUT), lerp(f, life - b, life, 1, 0));
// rótulo com linha de chamada até um ponto da tela
const Callout: React.FC<{ from: { x: number; y: number }; to: P2; text: string; sub?: string; p: number; color?: string; align?: "left" | "right" }> = ({ from, to, text, sub, p, color = HL.orange, align = "left" }) => {
  if (p <= 0) return null;
  const mx = from.x + (to[0] - from.x) * Math.min(1, p * 1.4);
  const my = from.y + (to[1] - from.y) * Math.min(1, p * 1.4);
  const tp = Math.max(0, (p - 0.5) * 2);
  return (
    <>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <circle cx={from.x} cy={from.y} r={6} fill="none" stroke={color} strokeWidth={2} opacity={p} />
        <line x1={from.x} y1={from.y} x2={mx} y2={my} stroke={color} strokeWidth={2} opacity={0.9} />
      </svg>
      <div style={{ position: "absolute", left: align === "left" ? to[0] + 14 : undefined, right: align === "right" ? W - to[0] + 14 : undefined, top: to[1] - 22, textAlign: align, opacity: tp, transform: `translateY(${(1 - tp) * 8}px)` }}>
        <div style={{ ...mono(24, color, 6) }}>{text}</div>
        {sub ? <div style={{ ...mono(16, HL.dim, 3), marginTop: 6 }}>{sub}</div> : null}
      </div>
    </>
  );
};
const BigLabel: React.FC<{ text: string; p: number; y?: number; size?: number; color?: string; strike?: number }> = ({ text, p, y = 860, size = 64, color = HL.text, strike = 0 }) => (
  <div style={{ position: "absolute", left: 0, right: 0, top: y, textAlign: "center", opacity: p, transform: `translateY(${(1 - p) * 16}px)` }}>
    <span style={{ position: "relative", fontFamily: FONT, fontWeight: 800, fontSize: size, letterSpacing: -1, color, textShadow: "0 8px 40px rgba(0,0,0,0.85)" }}>
      {text}
      {strike > 0 ? <span style={{ position: "absolute", left: -10, top: "54%", height: 6, width: `calc(${strike * 100}% + 20px)`, background: HL.orange, borderRadius: 3, boxShadow: `0 0 14px ${HL.orange}` }} /> : null}
    </span>
  </div>
);
const ICE = "#cfe9ff";
const typedHud = (t: string, f: number, at: number) => t.slice(0, Math.max(0, Math.floor((f - at) / 0.8)));
const E = (e: (t: number) => number) => ({ ...C, easing: e });
const ORANGE = HL.orange;

// ============================================================================================== cenas
// 2 · "trazer alguma coisa que muda a maneira como a indústria faz jogos / como a gente joga": controle em
// wireframe se constrói e gira; chamadas "como se faz jogos" e "como a gente joga".
export const WFGamepad: React.FC<{ life: number; buildAt?: number; pulseAt?: number; makeAt?: number; playAt?: number }> = ({ life, buildAt = 0, pulseAt = 1e9, makeAt = 1e9, playAt = 1e9 }) => {
  const f = useCurrentFrame();
  const o = fadeLife(f, life);
  const rv = lerp(f, buildAt, buildAt + 40, 0, 1, OUT);
  const yaw = -0.35 + Math.sin(f / 55) * 0.4;
  const cam = orbit([0, -0.35, 0], 6.2, yaw, 0.32);
  const pulse = interpolate(f, [pulseAt, pulseAt + 10, pulseAt + 30], [0, 1, 0], C);
  const pad = gamepad();
  const sticks = xf(cyl([-0.58, -0.45, 0.3], 0.22, 0.2, "z", 18, 6).concat(cyl([0.58, -0.45, 0.3], 0.22, 0.2, "z", 18, 6)), {});
  const anchorL = project([-1.75, 0.2, 0], cam);
  const anchorR = project([0.58, -0.45, 0.4], cam);
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <Wire cam={cam} layers={[{ segs: floorGrid(-1.8, 6, 1), color: "rgba(159,216,255,0.35)", width: 1, alpha: 0.5 * rv }, { segs: pad, reveal: rv, width: 2.2 + 2 * pulse, color: pulse > 0.05 ? "#ffd9b0" : ICE }, { segs: sticks, color: ORANGE, alpha: lerp(f, playAt, playAt + 10, 0, 1, OUT) }]} />
      <Callout from={anchorL} to={[300, 250]} text="como se faz jogos" sub="a indústria" p={lerp(f, makeAt, makeAt + 16, 0, 1, OUT)} align="left" />
      <Callout from={anchorR} to={[1560, 820]} text="como a gente joga" sub="o jogador" p={lerp(f, playAt, playAt + 16, 0, 1, OUT)} align="left" />
    </AbsoluteFill>
  );
};

// 4 · "não assiste numa cutscene… participa": a MESMA cena vista de dois jeitos. Primeiro como cutscene: faixas pretas
// de cinema fecham, a câmera passeia sozinha num corredor em wireframe (você só olha), legenda e barra de reprodução.
// Em `diveAt` ("você participa") as faixas se abrem, a interface do vídeo some, a mira acende e a câmera passa a andar
// para frente — o controle volta para a sua mão.
export const WFInside: React.FC<{ life: number; cutAt?: number; xAt?: number; diveAt?: number; partAt?: number }> = ({ life, cutAt = 0, xAt = 30, diveAt = 50, partAt = 100 }) => {
  const f = useCurrentFrame();
  const o = fadeLife(f, life);
  const bars = lerp(f, cutAt, cutAt + 16, 0, 1, OUT) * (1 - lerp(f, diveAt, diveAt + 14, 0, 1, E(Easing.inOut(Easing.cubic))));
  const play = 1 - lerp(f, diveAt, diveAt + 10, 0, 1, OUT);
  const ctrl = lerp(f, diveAt, diveAt + 20, 0, 1, OUT);
  // câmera: na cutscene faz um travelling lateral lento e "automático"; no controle anda reto para frente
  const auto = Math.min(f, diveAt);
  const walk = Math.max(0, f - diveAt);
  const camX = 1.4 * Math.cos(auto / 40) * (1 - ctrl);
  const camY = 0.6 * (1 - ctrl) - 0.35 * ctrl;
  const lunge = interpolate(walk, [0, 8, 20], [0, 1.6, 1.2], C);
  const camZ = 4 - auto * 0.03 - walk * 0.12 - lunge;
  const cam: Cam = { pos: [camX, camY, camZ], target: [-camX * 0.6, -0.1, camZ - 20], f: 900 };
  const corr = subdivide(roomGrid(2.2, 1.4, -70, 8, 1.1), 3);
  const door: Seg[] = box([0, -0.2, -30], 1.6, 2.4, 0.1);
  const cross = lerp(f, diveAt + 10, diveAt + 22, 0, 1, OUT);
  const part = lerp(f, partAt, partAt + 14, 0, 1, OUT);
  const tag = lerp(f, xAt, xAt + 10, 0, 1, OUT);
  const BAR = 190;
  const prog = Math.min(1, Math.max(0, (f - cutAt) / Math.max(1, diveAt - cutAt)));
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <AbsoluteFill style={{ filter: `saturate(${0.4 + 0.6 * ctrl}) brightness(${0.75 + 0.25 * ctrl})` }}>
        <Wire cam={cam} fog={26} layers={[{ segs: corr, width: 1.6, alpha: lerp(f, cutAt + 8, cutAt + 22, 0, 1, OUT) }, { segs: door, color: ORANGE, alpha: lerp(f, cutAt + 8, cutAt + 22, 0, 1, OUT) }]} />
      </AbsoluteFill>
      {/* faixas de cinema */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: BAR * bars, background: "#020104" }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: BAR * bars, background: "#020104" }} />
      {/* interface de vídeo: legenda + barra de reprodução (você só assiste) */}
      <div style={{ position: "absolute", left: 140, right: 140, bottom: BAR * bars - 92, opacity: bars * play }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <svg width={22} height={22} viewBox="0 0 22 22">
            <path d="M5 3 L19 11 L5 19 Z" fill={ICE} />
          </svg>
          <div style={{ flex: 1, height: 4, background: "rgba(207,233,255,0.22)", borderRadius: 2 }}>
            <div style={{ width: `${prog * 100}%`, height: "100%", background: ICE, borderRadius: 2 }} />
          </div>
          <div style={{ ...mono(18, HL.dim, 3) }}>pular ▸▸</div>
        </div>
      </div>
      <div style={{ position: "absolute", left: 140, top: BAR * bars - 70, ...mono(26, ICE, 12), opacity: bars * play * (0.5 + 0.5 * tag) }}>
        <span style={{ color: tag > 0.5 ? ORANGE : ICE }}>●</span> cutscene · você assiste
      </div>
      {/* fundo escuro que entra junto com as faixas (o plano anterior some por baixo) */}
      <AbsoluteFill style={{ background: "#05040a", opacity: lerp(f, cutAt, cutAt + 12, 0, 1, OUT), zIndex: -1 }} />
      {/* clarão quando as faixas abrem: o controle volta */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, rgba(255,240,220,0.55), rgba(255,170,90,0.15) 45%, rgba(0,0,0,0) 75%)", opacity: interpolate(f - diveAt, [0, 3, 14], [0, 1, 0], C) }} />
      {/* mira e HUD de primeira pessoa */}
      <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: cross }}>
        {[0, 90, 180, 270].map((ang) => (
          <line key={ang} x1={960} y1={540 - 14} x2={960} y2={540 - 34} stroke={ORANGE} strokeWidth={3} transform={`rotate(${ang} 960 540)`} />
        ))}
        <circle cx={960} cy={540} r={3} fill={ORANGE} />
      </svg>
    </AbsoluteFill>
  );
};

// 6 · física: caixas, barril e tábua num chão em grade. "cenário" → "jogo"; cada verbo vira um movimento:
// empurra (desliza) · quebra (arestas voam) · arremessa (barril em arco) · improvisa (tábua vira rampa).
export const WFPhysics: React.FC<{ life: number; decorAt?: number; gameAt?: number; pushAt?: number; breakAt?: number; throwAt?: number; improvAt?: number }> = ({
  life,
  decorAt = 1e9,
  gameAt = 1e9,
  pushAt = 1e9,
  breakAt = 1e9,
  throwAt = 1e9,
  improvAt = 1e9,
}) => {
  const f = useCurrentFrame();
  const o = fadeLife(f, life);
  const rv = lerp(f, 0, 36, 0, 1, OUT);
  const cam = orbit([0, -0.4, 0.4], 7.2, 0.5 + f * 0.003, 0.36);
  const lit = lerp(f, gameAt, gameAt + 10, 0, 1, OUT);
  const col = (k: number) => (lit > 0.5 ? (k ? ORANGE : "#ffd9b0") : ICE);
  // caixa A (empurrada)
  const push = lerp(f, pushAt, pushAt + 14, 0, 1, E(Easing.out(Easing.cubic)));
  const A = xf(box([0, 0, 0], 1, 1, 1), { pos: [-2.2 + 1.4 * push, -0.5, 0.6], ry: push * 0.25 });
  // caixa B (quebra): cada aresta ganha velocidade
  const bt = Math.max(0, f - breakAt);
  const Bbase = box([0, 0, 0], 1, 1, 1);
  const B = Bbase.map((s, i) => {
    if (bt <= 0) return xf([s], { pos: [0.2, -0.5, -0.4] })[0];
    const dir: V = [rnd(i * 3) - 0.5, rnd(i * 5) * 0.8 + 0.2, rnd(i * 7) - 0.5];
    const t = bt / 30;
    const off: V = [dir[0] * 4 * t, dir[1] * 4 * t - 4.9 * t * t, dir[2] * 4 * t];
    return xf([s], { pos: add([0.2, -0.5, -0.4], off), rx: rnd(i) * 6 * t, rz: rnd(i + 9) * 6 * t })[0];
  });
  const Bo = bt > 0 ? Math.max(0, 1 - bt / 26) : 1;
  // barril (arremessado em arco)
  const tt = Math.max(0, (f - throwAt) / 30);
  const barrel = xf(cyl([0, 0, 0], 0.4, 1.1, "y", 18, 3), { pos: [2.2 - 6 * tt, -0.45 + 3.2 * tt - 4.9 * tt * tt * 0.9, 0.8 + 2.5 * tt], rz: tt * 7, rx: tt * 3 });
  const bo = tt > 1.1 ? 0 : 1;
  // tábua (vira rampa encostada na caixa A)
  const ip = lerp(f, improvAt, improvAt + 16, 0, 1, E(Easing.inOut(Easing.cubic)));
  const plank = xf(box([0, 0, 0], 2.6, 0.1, 0.7), { pos: [-0.6 + 0.3 * ip, -0.95 + 0.45 * ip, 1.9 - 0.9 * ip], rz: -0.4 * ip, ry: -0.25 * ip });
  const labelP = lerp(f, decorAt, decorAt + 12, 0, 1, OUT) * (1 - lit);
  const verbs: [string, number][] = [
    ["empurra", pushAt],
    ["quebra", breakAt],
    ["arremessa", throwAt],
    ["improvisa", improvAt],
  ];
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <Wire
        cam={cam}
        layers={[
          { segs: floorGrid(-1.0, 7, 1), color: "rgba(159,216,255,0.3)", width: 1, alpha: 0.6 * rv },
          { segs: A, reveal: rv, color: col(0) },
          { segs: B, reveal: rv, color: col(1), alpha: Bo },
          { segs: barrel, reveal: rv, color: col(0), alpha: bo },
          { segs: plank, reveal: rv, color: col(1) },
        ]}
      />
      <div style={{ position: "absolute", left: 120, top: 110, ...mono(26, ICE, 10), opacity: labelP }}>só cenário</div>
      <div style={{ position: "absolute", left: 120, top: 110, ...mono(26, ORANGE, 10), opacity: lit }}>parte do jogo</div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 110, display: "flex", justifyContent: "center", gap: 44 }}>
        {verbs.map(([v, at]) => {
          const p = lerp(f, at, at + 8, 0, 1, OUT);
          return (
            <div key={v} style={{ fontFamily: FONT, fontWeight: 800, fontSize: 58, color: p > 0.5 ? HL.text : "rgba(242,240,247,0.15)", opacity: 0.25 + 0.75 * p, transform: `scale(${1 + 0.12 * interpolate(f, [at, at + 6, at + 16], [0, 1, 0], C)})`, textShadow: p > 0.5 ? `0 0 26px rgba(255,138,31,0.45)` : undefined }}>
              {v}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// 8 · Alyx / VR: headset em wireframe se constrói; "só uma plataforma" é riscado; "construído ao redor dela":
// objetos (caixa, anel, garrafa, porta) giram em volta e se aproximam do headset.
export const WFHeadset: React.FC<{ life: number; platAt?: number; strikeAt?: number; aroundAt?: number }> = ({ life, platAt = 1e9, strikeAt = 1e9, aroundAt = 1e9 }) => {
  const f = useCurrentFrame();
  const o = fadeLife(f, life);
  const rv = lerp(f, 0, 40, 0, 1, OUT);
  const cam = orbit([0, 0, -1.1], 6.0, 0.75 + Math.sin(f / 60) * 0.3, 0.2);
  const hs = headset();
  const ar = lerp(f, aroundAt, aroundAt + 40, 0, 1, OUT);
  const R = 4.2 - 1.6 * ar;
  const objs: Seg[][] = [box([0, 0, 0], 0.6, 0.6, 0.6), ring([0, 0, 0], 0.4, "z", 18), cyl([0, 0, 0], 0.22, 0.8, "y", 12, 3), box([0, 0, 0], 0.5, 1.0, 0.06)];
  const orbitSegs = objs.flatMap((s, i) => {
    const a = (i / objs.length) * Math.PI * 2 + f * 0.03;
    return xf(s, { pos: [Math.cos(a) * R, Math.sin(a * 2) * 0.6, -0.8 + Math.sin(a) * R], ry: f * 0.04 + i, rx: f * 0.03 });
  });
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <Wire cam={cam} layers={[{ segs: hs, reveal: rv }, { segs: orbitSegs, color: ORANGE, alpha: ar }]} />
      <BigLabel text="só uma plataforma" p={lerp(f, platAt, platAt + 12, 0, 1, OUT)} strike={lerp(f, strikeAt, strikeAt + 10, 0, 1, OUT)} y={830} size={60} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 120, textAlign: "center", ...mono(26, ORANGE, 10), opacity: ar }}>o jogo construído ao redor dela</div>
    </AbsoluteFill>
  );
};

// mão em wireframe (direita; a esquerda é espelhada): palma + 4 dedos em 3 falanges + polegar. Origem no punho,
// dedos para +y, palma virada para -z quando roll = 0.
const handSegs = (curl: number, spread: number, fc: number[] = [0, 0, 0, 0]): Seg[] => {
  const s: Seg[] = [];
  const palm: P2[] = [[-0.3, 0.02], [0.3, 0.02], [0.4, 0.2], [0.47, 0.55], [0.44, 0.88], [0.36, 0.99], [-0.36, 0.99], [-0.44, 0.88], [-0.46, 0.5], [-0.38, 0.18]];
  s.push(...extrude(palm, 0.2, 1));
  s.push(...cyl([0, -0.12, 0], 0.24, 0.3, "y", 12, 3)); // punho
  const F: { x: number; len: number[]; a: number }[] = [
    { x: -0.31, len: [0.26, 0.17, 0.14], a: -0.12 },
    { x: -0.1, len: [0.3, 0.2, 0.16], a: -0.04 },
    { x: 0.11, len: [0.29, 0.19, 0.15], a: 0.04 },
    { x: 0.3, len: [0.22, 0.15, 0.12], a: 0.13 },
  ];
  for (const [fiIdx, fi] of F.entries()) {
    let pos: V = [fi.x, 0.98, 0];
    let ang = 0;
    fi.len.forEach((L, k) => {
      ang += (curl + fc[fiIdx]) * (0.35 + 0.15 * k);
      const dir: V = rot([0, 1, 0], -ang, 0, -fi.a * spread);
      const mid: V = add(pos, [(dir[0] * L) / 2, (dir[1] * L) / 2, (dir[2] * L) / 2]);
      s.push(...xf(cyl([0, 0, 0], 0.072 - k * 0.008, L * 0.96, "y", 8, 2), { pos: mid, rx: -ang, rz: -fi.a * spread }));
      s.push(...xf(ring([0, 0, 0], 0.075 - k * 0.008, "y", 8), { pos: add(pos, [dir[0] * L, dir[1] * L, dir[2] * L]) }));
      pos = add(pos, [dir[0] * L, dir[1] * L, dir[2] * L]);
    });
  }
  // polegar: sai da lateral da palma, para fora e para a frente
  let tp: V = [0.42, 0.35, 0];
  [0.22, 0.17, 0.14].forEach((L, k) => {
    const dir: V = norm(rot([0.75, 0.66, 0], -curl * 0.3 * k, 0, 0.15 * k));
    const mid: V = add(tp, [(dir[0] * L) / 2, (dir[1] * L) / 2, (dir[2] * L) / 2]);
    s.push(...xf(cyl([0, 0, 0], 0.085 - k * 0.01, L * 0.96, "y", 8, 2), { pos: mid, rz: -Math.atan2(dir[0], dir[1]) }));
    tp = add(tp, [dir[0] * L, dir[1] * L, dir[2] * L]);
  });
  return s;
};
const mirrorX = (segs: Seg[]): Seg[] => segs.map(([a2, b2]) => [[-a2[0], a2[1], a2[2]], [-b2[0], b2[1], b2[2]]] as Seg);

// tremor/balanço natural: soma de senos com frequências que não se repetem juntas (sem loop perceptível)
const wobble = (t: number, seed: number) => 0.5 * Math.sin(t * 1.13 + seed) + 0.3 * Math.sin(t * 2.71 + seed * 1.7) + 0.2 * Math.sin(t * 4.37 + seed * 2.3);
export const WFHands: React.FC<{ life: number; raiseAt?: number; turnAt?: number }> = ({ life, raiseAt = 0, turnAt = 30 }) => {
  const f = useCurrentFrame();
  const o = fadeLife(f, life, 10, 12);
  const cam: Cam = { pos: [0, 0, 0], target: [0, -0.05, -1], f: 1150 };
  const hand = (side: 1 | -1) => {
    const seed = side === 1 ? 0.7 : 3.9;
    const lag = side === 1 ? 4 : 0; // as mãos não se mexem em sincronia
    const t = f / 30;
    const up = lerp(f, raiseAt + lag, raiseAt + lag + 26, 0, 1, E(Easing.out(Easing.back(1.2))));
    // a virada da palma: começa devagar, passa um pouco do ponto e volta (como quem confere a mão)
    // passa rápido pela posição de perfil (a mão de lado vira uma linha) e assenta devagar
    const turn = lerp(f, turnAt + lag, turnAt + lag + 36, 0, 1, E(Easing.inOut(Easing.poly(4))));
    const over = Math.sin(Math.PI * turn) * 0.18;
    const n = (k: number) => wobble(t, seed + k);
    const curl = 0.38 - 0.25 * turn + 0.06 * n(5);
    // cada dedo respira sozinho (onda leve do mínimo ao indicador)
    const fc = [0, 1, 2, 3].map((k) => 0.09 * wobble(t * 1.4 + k * 0.35, seed + 10 + k));
    const base = side === 1 ? handSegs(curl, 1 + 0.08 * n(6), fc) : mirrorX(handSegs(curl, 1 + 0.08 * n(6), fc));
    const roll = side * (Math.PI - Math.PI * 0.9 * turn + over);
    return xf(base, {
      rx: -0.5 + 0.25 * up + 0.05 * n(1) - 0.45 * Math.sin(Math.PI * turn), // inclina enquanto vira: nunca fica de perfil chapado
      ry: roll + 0.06 * n(2),
      rz: side * (-0.28 + 0.14 * turn) + 0.05 * n(3),
      scale: 0.6,
      pos: [side * (0.92 - 0.06 * turn) + 0.025 * n(4), -1.6 + 1.25 * up + 0.03 * n(7), -2.15 + 0.25 * turn + 0.03 * n(8)],
    });
  };
  const tw = lerp(f, turnAt + 10, turnAt + 30, 0, 1, OUT);
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <Wire cam={cam} fog={6} layers={[{ segs: hand(1), width: 2.2, color: tw > 0.5 ? "#ffe0c2" : ICE }, { segs: hand(-1), width: 2.2, color: tw > 0.5 ? "#ffe0c2" : ICE }]} />
    </AbsoluteFill>
  );
};

// 9 · verbos do Alyx em quatro painéis wireframe (cada um acende na palavra) e, em `roomAt`, os painéis recuam e
// uma sala em grade envolve a câmera ("realmente estar naquele espaço").
const Panel: React.FC<{ x: number; label: string; p: number; children: React.ReactNode }> = ({ x, label, p, children }) => (
  <div style={{ position: "absolute", left: x, top: 230, width: 400, height: 520, opacity: 0.2 + 0.8 * p, transform: `translateY(${(1 - p) * 30}px)` }}>
    <div style={{ position: "absolute", inset: 0, borderRadius: 22, border: `1px solid rgba(255,255,255,${0.14 + 0.3 * p})`, background: "linear-gradient(160deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02) 60%, rgba(107,63,212,0.1))", boxShadow: p > 0.5 ? "0 0 40px rgba(255,138,31,0.18)" : undefined }} />
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", borderRadius: 22 }}>{children}</div>
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 26, textAlign: "center", ...mono(22, p > 0.5 ? ORANGE : HL.dim, 6) }}>{label}</div>
  </div>
);
const Mini: React.FC<{ layers: Layer[]; cam: Cam }> = ({ layers, cam }) => (
  <div style={{ position: "absolute", left: -760, top: -280, width: W, height: H, transform: "scale(0.5)", transformOrigin: "960px 540px" }}>
    <Wire cam={cam} layers={layers} />
  </div>
);
const PISTOL: P2[] = [
  [-0.95, 0.32],
  [0.95, 0.32],
  [0.95, 0.02],
  [-0.38, 0.02],
  [-0.5, -0.85],
  [-0.88, -0.85],
  [-0.78, 0.02],
  [-0.95, 0.02],
];
export const WFVerbs: React.FC<{ life: number; grabAt: number; doorAt: number; reloadAt: number; drawerAt: number; roomAt?: number; hereAt?: number }> = ({ life, grabAt, doorAt, reloadAt, drawerAt, roomAt = 1e9, hereAt = 1e9 }) => {
  const f = useCurrentFrame();
  const o = fadeLife(f, life);
  const room = lerp(f, roomAt, roomAt + 30, 0, 1, E(Easing.inOut(Easing.cubic)));
  const yaw = f * 0.012;
  const P = (at: number) => lerp(f, at, at + 10, 0, 1, OUT);
  // 1 pegar: cubo sobe com um anel de "puxão"
  const g = lerp(f, grabAt, grabAt + 24, 0, 1, E(Easing.out(Easing.back(1.4))));
  const grab: Layer[] = [
    { segs: floorGrid(-1.2, 3, 1), color: "rgba(159,216,255,0.3)", width: 1 },
    { segs: xf(box([0, 0, 0], 0.9, 0.9, 0.9), { pos: [0, -0.75 + 1.3 * g, 0], ry: g * 2, rx: g * 0.6 }), color: g > 0 ? ORANGE : ICE },
    { segs: ring([0, -0.75 + 1.3 * g, 0], 0.9 + 0.2 * Math.sin(f / 4), "y", 24), color: ORANGE, alpha: g > 0 ? 0.7 : 0 },
  ];
  // 2 abrir porta
  const d = lerp(f, doorAt, doorAt + 22, 0, 1, E(Easing.inOut(Easing.cubic)));
  const door: Layer[] = [
    { segs: box([0, 0, 0], 1.5, 2.5, 0.2), color: "rgba(207,233,255,0.6)" },
    { segs: xf(box([0, 0, 0], 1.3, 2.3, 0.08), { pivot: [-0.65, 0, 0], ry: -1.6 * d }), color: d > 0 ? ORANGE : ICE },
  ];
  // 3 recarregar: o carregador sobe para dentro da empunhadura
  const r = lerp(f, reloadAt, reloadAt + 14, 0, 1, E(Easing.in(Easing.cubic)));
  const reload: Layer[] = [
    { segs: extrude(PISTOL, 0.22, 1), color: ICE },
    { segs: xf(box([0, 0, 0], 0.22, 0.7, 0.14), { pos: [-0.66, -1.75 + 1.3 * r, 0], rz: -0.13 }), color: ORANGE },
  ];
  // 4 gaveta
  const dr = lerp(f, drawerAt, drawerAt + 20, 0, 1, E(Easing.out(Easing.cubic)));
  const drawer: Layer[] = [
    { segs: box([0, 0, 0], 1.8, 1.4, 1.1), color: "rgba(207,233,255,0.6)" },
    { segs: xf(box([0, 0, 0], 1.6, 0.45, 1.05).concat(box([0, 0, 0.56], 0.4, 0.08, 0.06)), { pos: [0, 0.3, 0.9 * dr] }), color: dr > 0 ? ORANGE : ICE },
  ];
  const mcam = orbit([0, 0, 0], 6.5, 0.6 + yaw, 0.35);
  const rcam: Cam = { pos: [Math.sin(f * 0.006) * 0.6, 0, 3 - room * 2], target: [0, 0, -10], f: 800 };
  return (
    <AbsoluteFill style={{ opacity: o }}>
      {room > 0 ? <Wire cam={rcam} fog={20} layers={[{ segs: roomGrid(4, 2.4, -16, 4, 1), alpha: room, width: 1.4 }]} /> : null}
      <div style={{ position: "absolute", inset: 0, opacity: 1 - room, transform: `scale(${1 - 0.4 * room})` }}>
        <Panel x={90} label="pegar objetos" p={P(grabAt)}>
          <Mini layers={grab} cam={mcam} />
        </Panel>
        <Panel x={540} label="abrir portas" p={P(doorAt)}>
          <Mini layers={door} cam={mcam} />
        </Panel>
        <Panel x={990} label="recarregar" p={P(reloadAt)}>
          <Mini layers={reload} cam={orbit([0, -0.3, 0], 5.2, 0.35 + Math.sin(f / 40) * 0.3, 0.15)} />
        </Panel>
        <Panel x={1440} label="procurar na gaveta" p={P(drawerAt)}>
          <Mini layers={drawer} cam={mcam} />
        </Panel>
      </div>
      <BigLabel text="estar naquele espaço" p={lerp(f, hereAt, hereAt + 14, 0, 1, OUT)} y={470} size={86} />
    </AbsoluteFill>
  );
};

const lerpV3 = (a: V, b: V, t: number): V => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
// 12 · "não pode ser só um HL2 maior, mais bonito, com 20 anos de tecnologia em cima": o "2" em wireframe cresce e
// ganha brilho; a tecnologia se EMPILHA no próprio 2, uma por vez (polígonos: malha densa · resolução: o 2 pixelado
// em degraus que vai ficando liso · ray tracing: luz com raios que batem e refletem · física: caixinhas caem e quicam
// nele); em `ideaAt` tudo apaga; em `threeAt` nasce um "3" laranja; em `flyAt` a câmera atravessa o 3.
export const WFTwoThree: React.FC<{ life: number; bigAt?: number; prettyAt?: number; techAt?: number; ideaAt?: number; threeAt?: number; flyAt?: number }> = ({ life, bigAt = 1e9, prettyAt = 1e9, techAt = 1e9, ideaAt = 1e9, threeAt = 1e9, flyAt = 1e9 }) => {
  const f = useCurrentFrame();
  const o = fadeLife(f, life);
  const rv = lerp(f, 0, 30, 0, 1, OUT);
  const big = lerp(f, bigAt, bigAt + 16, 0, 1, E(Easing.out(Easing.back(1.3))));
  const pretty = lerp(f, prettyAt, prettyAt + 14, 0, 1, OUT);
  const idea = lerp(f, ideaAt, ideaAt + 14, 0, 1, OUT);
  const three = lerp(f, threeAt, threeAt + 30, 0, 1, OUT);
  const fly = lerp(f, flyAt, flyAt + 30, 0, 1, E(Easing.in(Easing.cubic)));
  const cam = orbit([0, -0.2, 0], 6.5 - 6.2 * fly, Math.sin(f / 50) * 0.25 * (1 - fly), 0.1 * (1 - fly));
  const sc2 = 1 + 0.55 * big;
  const ry2 = Math.sin(f / 35) * 0.25;
  const T = (i: number) => techAt + i * 10;
  const tp = (i: number) => lerp(f, T(i), T(i) + 10, 0, 1, OUT);
  // "em cima": quando a última tecnologia entra, o 2 fica sobrecarregado (treme)
  const over = f >= T(3) + 6 && f < ideaAt ? 1 : 0;
  const jit = over ? (rnd(f) - 0.5) * 0.06 : 0;
  const place = (segs: Seg[]) => xf(segs, { scale: sc2, ry: ry2, pos: [jit, 0, 0] });
  const two = place(extrude(digit("2"), 0.45, 2));
  // + polígonos: casca interna e mais nervuras (malha densa)
  const dense = place([...extrude(digit("2"), 0.45, 1), ...extrude(digit("2").map(([x, y]) => [x * 0.9, y * 0.94] as P2), 0.3, 1), ...extrude(digit("2"), 0.02, 1)]);
  // + resolução: o contorno do 2 preso numa grade que vai afinando (degraus → liso)
  const g = lerp(f, T(1), T(1) + 30, 0.24, 0.07, E(Easing.inOut(Easing.quad)));
  const out2 = digit("2");
  // pixels: cada célula da grade que o contorno atravessa vira um quadradinho (o 2 em baixa resolução que vai refinando)
  const cells = new Map<string, [number, number]>();
  out2.forEach((p, i) => {
    const q = out2[(i + 1) % out2.length];
    const n = Math.max(1, Math.ceil(Math.hypot(q[0] - p[0], q[1] - p[1]) / (g * 0.4)));
    for (let k = 0; k <= n; k++) {
      const x = p[0] + ((q[0] - p[0]) * k) / n;
      const y = p[1] + ((q[1] - p[1]) * k) / n;
      const cx = Math.floor(x / g);
      const cy = Math.floor(y / g);
      cells.set(`${cx},${cy}`, [cx, cy]);
    }
  });
  const stairs: Seg[] = [];
  const h = g * 0.42;
  cells.forEach(([cx, cy]) => {
    const x = (cx + 0.5) * g;
    const y = (cy + 0.5) * g;
    stairs.push([[x - h, y - h, 0.26], [x + h, y - h, 0.26]], [[x + h, y - h, 0.26], [x + h, y + h, 0.26]], [[x + h, y + h, 0.26], [x - h, y + h, 0.26]], [[x - h, y + h, 0.26], [x - h, y - h, 0.26]]);
  });
  const res = place(stairs);
  // + ray tracing: luz no alto à esquerda; raios até o 2 e reflexos
  const LIGHT: V = [-1.9, 1.5, 1.3];
  const rays: Seg[] = [];
  const rp = lerp(f, T(2), T(2) + 14, 0, 1, OUT);
  [0, 5, 10, 16, 22, 27].forEach((k, j) => {
    const hit = xf([[out2[k % out2.length][0], out2[k % out2.length][1], 0.23] as V].map((v) => [v, v] as Seg), { scale: sc2, ry: ry2 })[0][0];
    const mid = lerpV3(LIGHT, hit, Math.min(1, rp * 1.6));
    rays.push([LIGHT, mid]);
    if (rp > 0.6) {
      const refl: V = add(hit, [0.7 + 0.12 * j, -0.6 + 0.22 * j, 0.6]);
      rays.push([hit, lerpV3(hit, refl, (rp - 0.6) / 0.4)]);
    }
  });
  // + física: caixinhas caem do alto e quicam no 2 / no chão
  const fp = Math.max(0, f - T(3)) / 30;
  const boxes: Seg[] = [];
  [-0.9, -0.2, 0.5, 1.1].forEach((x0, k) => {
    const t = fp - k * 0.08;
    if (t <= 0) return;
    const yTop = 2.6;
    const floor = k % 2 ? 1.2 : -1.6; // umas batem no topo do 2, outras vão ao chão
    let y = yTop - 4.9 * 1.6 * t * t;
    if (y < floor) {
      const tb = Math.sqrt((yTop - floor) / (4.9 * 1.6));
      const t2 = t - tb;
      y = floor + Math.max(0, 2.2 * t2 - 4.9 * 1.6 * t2 * t2);
    }
    boxes.push(...xf(box([0, 0, 0], 0.22, 0.22, 0.22), { pos: [x0 * sc2 * 0.8, y, 0.4 + 0.2 * k], rx: t * 6, rz: t * 4 }));
  });
  const tre = xf(extrude(digit("3"), 0.5, 2), { scale: 1.5, ry: Math.sin(f / 30) * 0.3 });
  const gone = 1 - idea;
  const labels: { t: string; x: number; y: number }[] = [
    { t: "+ polígonos", x: 1370, y: 300 },
    { t: "+ resolução", x: 1370, y: 380 },
    { t: "+ ray tracing", x: 1370, y: 460 },
    { t: "+ física", x: 1370, y: 540 },
  ];
  return (
    <AbsoluteFill style={{ opacity: o, transform: over ? `translateX(${(rnd(f + 3) - 0.5) * 8}px)` : undefined }}>
      {pretty > 0 && idea < 1 ? <div style={{ position: "absolute", left: 960 - 500, top: 540 - 500, width: 1000, height: 1000, borderRadius: "50%", background: "radial-gradient(closest-side, rgba(159,216,255,0.22), rgba(159,216,255,0))", opacity: pretty * gone * (0.8 + 0.2 * Math.sin(f / 6)) }} /> : null}
      <Wire
        cam={cam}
        layers={[
          { segs: two, reveal: rv, color: pretty > 0.5 ? "#eaf6ff" : ICE, width: 2.2 + 1.4 * pretty, alpha: gone },
          { segs: dense, color: "#cfe9ff", width: 1.2, alpha: tp(0) * gone * 0.8 },
          { segs: res, color: "#9fd8ff", width: 1.6, alpha: tp(1) * gone * (1 - lerp(f, T(1) + 24, T(1) + 40, 0, 0.7, C)) },
          { segs: rays, color: "#fff2c8", width: 1.6, alpha: tp(2) * gone },
          { segs: ring(LIGHT, 0.12 + 0.03 * Math.sin(f / 3), "z", 12), color: "#fff2c8", width: 2.4, alpha: tp(2) * gone },
          { segs: boxes, color: ORANGE, width: 2, alpha: gone },
          { segs: tre, reveal: three, color: ORANGE, width: 3 },
        ]}
      />
      {labels.map((l, i) => (
        <div key={l.t} style={{ position: "absolute", left: l.x, top: l.y, ...mono(24, i === 3 ? ORANGE : ICE, 6), opacity: tp(i) * gone, transform: `translateX(${(1 - tp(i)) * 30}px)`, textShadow: "0 2px 14px rgba(0,0,0,0.9)" }}>
          {l.t}
        </div>
      ))}
      <div style={{ position: "absolute", left: 150, top: 300, ...mono(24, ICE, 8), opacity: gone * lerp(f, bigAt, bigAt + 10, 0, 1, OUT) }}>maior</div>
      <div style={{ position: "absolute", left: 150, top: 350, ...mono(24, ICE, 8), opacity: gone * pretty }}>mais bonito</div>
      <BigLabel text="uma ideia de gameplay" p={idea * (1 - lerp(f, flyAt, flyAt + 10, 0, 1, C))} y={860} size={72} color={ORANGE} />
      {fly > 0 ? <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, rgba(255,170,90,0.5), rgba(255,138,31,0) 70%)", opacity: interpolate(f - flyAt, [18, 28, 40], [0, 1, 0], C) }} /> : null}
    </AbsoluteFill>
  );
};

// 13 · "antes de decidir o que aconteceria com Gordon, Alyx, G-Man ou o Borealis": quatro cartões (um por nome),
// que em `laterAt` apagam com "depois"; em `qAt` sobe "uma pergunta".
export const HLDossiers: React.FC<{
  life: number;
  headAt?: number;
  items: { name: string; tag: string; src: string; from?: number; rate?: number; pos?: string; at: number }[];
  laterAt?: number;
  qAt?: number;
}> = ({ life, headAt = 0, items, laterAt = 1e9, qAt = 1e9 }) => {
  const f = useCurrentFrame();
  const o = fadeLife(f, life);
  const later = lerp(f, laterAt, laterAt + 16, 0, 1, OUT);
  const q = lerp(f, qAt, qAt + 16, 0, 1, OUT);
  const PW = 400;
  const PH = 540;
  // saímos do outro lado do 3: os dossiês vêm de trás da câmera para o lugar
  const enter = lerp(f, 0, 30, 0, 1, OUT);
  return (
    <AbsoluteFill style={{ opacity: o, perspective: 1500 }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 110, textAlign: "center", ...mono(24, HL.dim, 12), opacity: lerp(f, headAt, headAt + 12, 0, 1, OUT) * (1 - q) }}>antes de decidir a história</div>
      <div style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d", transform: `translateY(${-q * 60}px) translateZ(${(1 - enter) * 700 - later * 260 - q * 200}px)` }}>
        {items.map((it, i) => {
          const n = items.length;
          const k = i - (n - 1) / 2;
          // já estão ali, apagados (a história ainda não decidida); cada um acende no nome
          const p = lerp(f, headAt + i * 8, headAt + i * 8 + 22, 0, 1, OUT); // um por vez (cada um com som de entrada)
          const lit = lerp(f, it.at, it.at + 12, 0, 1, OUT);
          const pop = Math.sin(Math.PI * lerp(f, it.at, it.at + 14, 0, 1, C)) * 0.05;
          const gray = Math.max(1 - lit, later);
          const bright = (0.5 + 0.5 * lit) * (1 - 0.45 * later);
          const img = /\.(png|jpe?g|webp)$/i.test(it.src);
          const bob = Math.sin((f + i * 23) / 38) * 7;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: 960 + k * 445 - PW / 2,
                top: 540 - PH / 2 - 10,
                width: PW,
                height: PH,
                opacity: Math.min(1, p),
                transform: `translate3d(0, ${(1 - p) * 90 + bob}px, ${-Math.abs(k) * 70 + (1 - p) * -500 + lit * 40}px) rotateY(${k * -11 * (1 - 0.25 * lit)}deg) scale(${1 + pop})`,
                filter: `grayscale(${gray}) brightness(${bright})`,
              }}
            >
              <div style={{ position: "absolute", inset: 0, borderRadius: 22, overflow: "hidden", border: "1px solid rgba(255,255,255,0.22)", boxShadow: "0 40px 100px rgba(0,0,0,0.6)", background: "#050409" }}>
                {img ? (
                  <Img src={staticFile(it.src)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: it.pos ?? "50% 50%", transform: `scale(${1.05 + 0.08 * lerp(f, it.at, life, 0, 1, C)})` }} />
                ) : (
                  <Clip src={it.src} from={it.from ?? 0} rate={it.rate ?? 1} style={{ objectPosition: it.pos ?? "50% 50%" }} />
                )}
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(0deg, rgba(5,4,10,0.92) 0%, rgba(5,4,10,0.2) 45%, rgba(5,4,10,0) 70%)" }} />
                <div style={{ position: "absolute", left: 24, bottom: 56, opacity: lit, transform: `translateY(${(1 - lit) * 14}px)`, fontFamily: FONT, fontWeight: 800, fontSize: 52, color: HL.text, letterSpacing: -1 }}>{it.name}</div>
                <div style={{ position: "absolute", left: 22, bottom: 22, opacity: lerp(f, it.at + 6, it.at + 18, 0, 1, OUT), ...mono(19, ORANGE, 4) }}>{it.tag}</div>
                <div style={{ position: "absolute", right: 16, top: 14, ...mono(13, "rgba(242,240,247,0.55)", 3) }}>{`0${i + 1}`}</div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 835, textAlign: "center", ...mono(28, ORANGE, 16), opacity: later * (1 - q) }}>fica para depois</div>
      <BigLabel text="primeiro, uma pergunta." p={q} y={820} size={84} />
    </AbsoluteFill>
  );
};

export const HLLaterCards: React.FC<{ life: number; headAt?: number; names: { text: string; at: number }[]; laterAt?: number; qAt?: number }> = ({ life, headAt = 0, names, laterAt = 1e9, qAt = 1e9 }) => {
  const f = useCurrentFrame();
  const o = fadeLife(f, life);
  const later = lerp(f, laterAt, laterAt + 14, 0, 1, OUT);
  const q = lerp(f, qAt, qAt + 14, 0, 1, OUT);
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 170, textAlign: "center", ...mono(26, HL.dim, 10), opacity: lerp(f, headAt, headAt + 12, 0, 1, OUT) * (1 - q) }}>antes de decidir a história</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 360, display: "flex", justifyContent: "center", gap: 40, transform: `translateY(${-q * 80}px) scale(${1 - 0.15 * q})` }}>
        {names.map((n, i) => {
          const p = lerp(f, n.at, n.at + 12, 0, 1, E(Easing.out(Easing.back(1.5))));
          return (
            <div key={i} style={{ width: 320, height: 220, borderRadius: 22, border: "1px solid rgba(255,255,255,0.18)", background: "linear-gradient(160deg, rgba(255,255,255,0.1), rgba(255,255,255,0.02) 60%, rgba(107,63,212,0.12))", display: "flex", alignItems: "center", justifyContent: "center", opacity: Math.min(1, p) * (1 - 0.65 * later), transform: `translateY(${(1 - Math.min(1, p)) * 40}px)`, filter: later > 0 ? `grayscale(${later}) blur(${later * 1.5}px)` : undefined }}>
              <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 52, color: HL.text }}>{n.text}</div>
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 640, textAlign: "center", ...mono(30, ORANGE, 16), opacity: later * (1 - q) }}>depois</div>
      <BigLabel text="primeiro, uma pergunta." p={q} y={640} size={84} />
    </AbsoluteFill>
  );
};

// 15 · "e se o próprio espaço deixasse de ser confiável?": sala em grade; em `warpAt` começa a dobrar e ondular;
// em `breakAt` a distorção cresce (camadas defasadas, falha) e a pergunta fica na tela.
export const WFWarpRoom: React.FC<{ life: number; ideaAt?: number; qAt?: number; warpAt?: number; breakAt?: number; stretchAt?: number }> = ({ life, ideaAt = 0, qAt = 1e9, warpAt = 1e9, breakAt = 1e9, stretchAt = 1e9 }) => {
  const f = useCurrentFrame();
  const o = fadeLife(f, life, 14, 8);
  const rv = lerp(f, 0, 34, 0, 1, OUT);
  const wA = lerp(f, warpAt, warpAt + 40, 0, 1, E(Easing.in(Easing.quad))) * 0.6 + lerp(f, breakAt, breakAt + 30, 0, 1, OUT) * 1.4;
  const t = f / 30;
  // transição para o 2B: a sala estica em profundidade até virar riscos, a câmera dispara e tudo vira clarão
  const st = lerp(f, stretchAt, stretchAt + 50, 0, 1, E(Easing.in(Easing.cubic)));
  const warp0 = (p: V): V => {
    const [x, y, z] = p;
    const tw = Math.sin(z * 0.35 + t * 1.6) * 0.35 * wA; // torção ao longo do corredor
    const c = Math.cos(tw);
    const s = Math.sin(tw);
    return [x * c - y * s + Math.sin(y * 0.9 + t * 2) * 0.35 * wA, x * s + y * c + Math.sin(x * 0.8 + z * 0.3 + t * 1.3) * 0.25 * wA, z + Math.sin(x + t) * 0.3 * wA];
  };
  const warp = (p: V): V => {
    const q = warp0(p);
    return st > 0 ? [q[0] * (1 - 0.35 * st), q[1] * (1 - 0.35 * st), q[2] * (1 + 9 * st)] : q;
  };
  const base = subdivide(roomGrid(4, 2.4, -22, 3, 1.5), 4);
  const segs = base.map(([a, b]) => [warp(a), warp(b)] as Seg);
  const run = Math.max(0, f - stretchAt);
  const cam: Cam = { pos: [0, 0, 4 - f * 0.02 - run * run * 0.035], target: [0, 0, -14 - f * 0.02 - run * run * 0.035], f: 820 };
  const glitch = f >= breakAt && (f - breakAt) % 17 < 3;
  const words = "E se o próprio espaço deixasse de ser confiável?".split(" ");
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <div style={{ position: "absolute", inset: 0, transform: glitch ? `translateX(${(rnd(f) - 0.5) * 30}px)` : undefined }}>
        <Wire cam={cam} fog={22 + 120 * st} layers={[{ segs, reveal: rv, width: 1.5 + 1.5 * st, color: st > 0.3 ? "#eaf6ff" : wA > 0.9 ? "#ffe0c2" : ICE }]} />
        {glitch ? (
          <div style={{ position: "absolute", inset: 0, opacity: 0.5, transform: "translateX(10px)", mixBlendMode: "screen" }}>
            <Wire cam={cam} fog={22} layers={[{ segs, width: 1.5, color: "rgba(255,80,60,0.8)" }]} />
          </div>
        ) : null}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 150, textAlign: "center", ...mono(26, HL.dim, 10), opacity: lerp(f, ideaAt, ideaAt + 12, 0, 1, OUT) * (1 - lerp(f, qAt, qAt + 10, 0, 1, C)) }}>uma ideia muito simples</div>
      {st > 0 ? <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, rgba(230,244,255,0.95), rgba(159,216,255,0.35) 45%, rgba(0,0,0,0) 80%)", opacity: lerp(f, stretchAt + 34, stretchAt + 50, 0, 1, C) }} /> : null}
      <div style={{ position: "absolute", left: 0, right: 0, top: 440, textAlign: "center", padding: "0 160px", opacity: 1 - lerp(f, stretchAt, stretchAt + 14, 0, 1, C) }}>
        {words.map((w, i) => {
          const p = lerp(f, qAt + i * 4, qAt + i * 4 + 12, 0, 1, OUT);
          const hot = w.startsWith("espaço") || w.startsWith("confiável");
          return (
            <span key={i} style={{ display: "inline-block", whiteSpace: "pre", fontFamily: FONT, fontWeight: 800, fontSize: 88, letterSpacing: -2, color: hot ? ORANGE : HL.text, opacity: p, transform: `translateY(${(1 - p) * 22}px)`, textShadow: "0 8px 40px rgba(0,0,0,0.9)", filter: p < 1 ? `blur(${(1 - p) * 8}px)` : undefined }}>
              {w + (i < words.length - 1 ? " " : "")}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// motor e peças compartilhados com o 2B (hl3g.tsx)
export { add, sub, rot, xf, project, orbit, box, ring, cyl, extrude, subdivide, floorGrid, roomGrid, Wire, mono, fadeLife, Callout, BigLabel, ICE, E, ORANGE, W, H, arc, roundRect };
export type { V, Seg, P2, Cam, Layer };
