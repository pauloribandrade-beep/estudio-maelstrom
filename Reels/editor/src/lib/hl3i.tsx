import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { loadFont as loadCaveat } from "@remotion/google-fonts/Caveat";
import { FONT } from "./overlays";
import { C, GlitchWrap, HL, OUT, glitchAmt, lerp, rnd } from "./hl3";
import { BigLabel, E, ICE, ORANGE, W, H, Wire, add, box, fadeLife, mono, orbit, ring, xf } from "./hl3f";
import type { Cam, Layer, P2, Seg, V } from "./hl3f";
import { CY, Chip, FY, Flash, HOLE_C, P, PURPLE, RED, bez, bezSegs, dashed, lerpV, pulse, roomLayers, scr, soldier, wallGrid } from "./hl3g";

// Blocos 2D–2F (2026-10-02): o Borealis como razão do jogo (navio em wireframe, a doca vazia, o corredor cujas portas
// dão em estados diferentes), as regras e os 23 fundamentos. Tempos em QUADROS relativos à cena.
const { fontFamily: HAND } = loadCaveat();
const INK = "#1c2a6e";
const HULL = "#ff6b5a"; // casco vermelho do Borealis
const XEN = "#b07cff";
const MOSS = "#8fe0a6";
const RUST = "#c9905e";

// ============================================================================================== navio (Borealis)
// casco de quebra-gelo (proa em +x): convés com tosado subindo na proa, quilha mais estreita, cavernas (costelas),
// duas fiadas de chapa, linha d'água, amurada com balaústres e o número "02" no costado
const HALF = (t: number) => (t < 0.72 ? 1.55 : 1.55 * Math.cos(((t - 0.72) / 0.28) * (Math.PI / 2)) ** 0.75);
const SHEER = (t: number) => 0.45 * Math.max(0, (t - 0.7) / 0.3) ** 2;
const NX = 28;
const hullAt = (t: number, side: 1 | -1, k: number): V => {
  // k: 0 = convés, 1 = meia altura (bojo), 2 = quilha
  const x = -6 + 12 * t;
  const h = HALF(t);
  if (k === 0) return [x, SHEER(t), side * h];
  if (k === 1) return [x * 0.98 - 0.1, -0.85, side * h * 0.9];
  return [x * 0.9 - 0.4, -1.7, side * h * 0.35];
};
const hull = (): Seg[] => {
  const s: Seg[] = [];
  const line = (k: number, side: 1 | -1) => {
    for (let i = 0; i < NX; i++) s.push([hullAt(i / NX, side, k), hullAt((i + 1) / NX, side, k)]);
  };
  for (const side of [1, -1] as const) for (const k of [0, 1, 2]) line(k, side);
  // popa (fecha atrás) e proa (une os dois lados)
  for (const k of [0, 1, 2]) s.push([hullAt(0, 1, k), hullAt(0, -1, k)]);
  // cavernas: costelas do convés ao bojo e à quilha, dos dois lados
  for (let i = 0; i <= NX; i += 2) for (const side of [1, -1] as const) s.push([hullAt(i / NX, side, 0), hullAt(i / NX, side, 1)], [hullAt(i / NX, side, 1), hullAt(i / NX, side, 2)]);
  // fiadas de chapa e linha d'água
  for (const y of [-0.42, -1.25]) {
    const k = y > -0.85 ? 0.45 : 0.55;
    for (const side of [1, -1] as const)
      for (let i = 0; i < NX; i++) {
        const a = lerpV(hullAt(i / NX, side, y > -0.85 ? 0 : 1), hullAt(i / NX, side, y > -0.85 ? 1 : 2), k);
        const b2 = lerpV(hullAt((i + 1) / NX, side, y > -0.85 ? 0 : 1), hullAt((i + 1) / NX, side, y > -0.85 ? 1 : 2), k);
        s.push([a, b2]);
      }
  }
  // amurada (corrimão) com balaústres
  for (const side of [1, -1] as const)
    for (let i = 0; i < NX; i++) {
      const a = add(hullAt(i / NX, side, 0), [0, 0.32, 0]);
      const b2 = add(hullAt((i + 1) / NX, side, 0), [0, 0.32, 0]);
      s.push([a, b2], [hullAt(i / NX, side, 0), a]);
    }
  // "02" no costado de boreste, perto da proa (sete segmentos)
  const seg7: Record<string, number[][]> = { "0": [[0, 0, 1, 0], [1, 0, 1, 1], [1, 1, 1, 2], [0, 2, 1, 2], [0, 1, 0, 2], [0, 0, 0, 1]], "2": [[0, 0, 1, 0], [1, 0, 1, 1], [0, 1, 1, 1], [0, 1, 0, 2], [0, 2, 1, 2]] };
  ["0", "2"].forEach((ch, ci) => {
    seg7[ch].forEach(([x1, y1, x2, y2]) => {
      const X = (u: number) => 2.4 + ci * 0.55 + u * 0.38;
      const Y = (v: number) => -0.15 - v * 0.28;
      s.push([[X(x1), Y(y1), HALF((X(x1) + 6) / 12) * 0.97 + 0.02], [X(x2), Y(y2), HALF((X(x2) + 6) / 12) * 0.97 + 0.02]]);
    });
  });
  return s;
};
// superestrutura à ré em três andares, passadiço com asas e janelas, chaminé, mastros com radar, guindaste na proa
const superstructure = (): Seg[] => {
  const s: Seg[] = [
    ...box([-3.6, 0.6, 0], 3.2, 1.2, 2.7),
    ...box([-3.5, 1.65, 0], 2.6, 0.9, 2.3),
    ...box([-3.3, 2.5, 0], 2.0, 0.8, 3.4), // passadiço com asas
    ...box([-4.6, 2.3, 0], 0.7, 1.6, 0.9), // chaminé
    [[-3.3, 2.9, 0], [-3.3, 4.4, 0]],
    [[-3.3, 4.0, -0.7], [-3.3, 4.0, 0.7]],
    [[-3.3, 3.6, -0.45], [-3.3, 3.6, 0.45]],
    ...ring([-3.3, 4.45, 0], 0.32, "y", 12),
    [[-0.2, 0.1, 0], [-0.2, 2.8, 0]], // mastro de vante
    [[-0.2, 2.4, -0.5], [-0.2, 2.4, 0.5]],
    // guindaste: pórtico em A + lança
    [[2.0, 0.1, -0.5], [2.2, 1.6, 0]],
    [[2.0, 0.1, 0.5], [2.2, 1.6, 0]],
    [[2.2, 1.6, 0], [3.9, 2.3, 0]],
    [[3.9, 2.3, 0], [3.9, 1.2, 0]],
    ...box([0.8, 0.35, 0], 1.2, 0.5, 1.4), // escotilha de carga
  ];
  // janelas do passadiço (frente) e dos andares (laterais)
  for (let k = -1.4; k <= 1.41; k += 0.35) s.push([[-2.29, 2.42, k], [-2.29, 2.72, k]]);
  for (const zz of [-1.16, 1.16]) for (let x = -4.9; x <= -2.3; x += 0.4) s.push([[x, 1.5, zz], [x, 1.8, zz]]);
  for (const zz of [-1.36, 1.36]) for (let x = -5.0; x <= -2.2; x += 0.45) s.push([[x, 0.45, zz], [x, 0.75, zz]]);
  return s;
};
const SHIP_HULL = hull();
const SHIP_TOP = superstructure();

// 9 · a doca: primeiro COMPLETA, com o Borealis dentro. Em `tornAt` ("levando junto parte da própria doca") o navio
// brilha, sobe e some num clarão de teletransporte, e a ponta da doca é arrancada do chão em pedaços (fica a borda
// rasgada e o contorno tracejado do que estava ali). Em `boxAt` ("caixa preta da série") uma caixa preta se fecha.
export const WFDock: React.FC<{ life: number; ghostAt?: number; tornAt?: number; boxAt?: number }> = ({ life, ghostAt = 10, tornAt = 1e9, boxAt = 1e9 }) => {
  const f = useCurrentFrame();
  const o = fadeLife(f, life, 10, 10);
  const cam = orbit([0, -0.6, 0], 15, 0.7 + f * 0.0025, 0.48, 1000);
  const DW = 8.5;
  const DD = 2.8;
  const CUT = 5.2; // a ponta da doca (x > CUT) vai embora com o navio
  const dock: Seg[] = [];
  for (const z of [-DD, DD]) dock.push([[-DW, 0, z], [DW, 0, z]], [[-DW, -2.6, z], [DW, -2.6, z]]);
  dock.push([[-DW, 0, -DD], [-DW, 0, DD]], [[-DW, -2.6, -DD], [-DW, -2.6, DD]], [[DW, 0, -DD], [DW, 0, DD]], [[DW, -2.6, -DD], [DW, -2.6, DD]]);
  for (let x = -DW; x <= DW + 0.01; x += 0.85) for (const z of [-DD, DD]) dock.push([[x, 0, z], [x, -2.6, z]]);
  for (let x = -DW; x <= DW; x += 1.2) dock.push([[x, -2.6, -DD], [x, -2.6, DD]]);
  // subdivide as linhas longas para a ponta poder se soltar em pedaços
  const fine: Seg[] = dock.flatMap(([a, b]) => {
    const n = Math.max(1, Math.ceil(Math.abs(b[0] - a[0]) / 0.85));
    return Array.from({ length: n }).map((_, i) => [lerpV(a, b, i / n), lerpV(a, b, (i + 1) / n)] as Seg);
  });
  const isEnd = ([a, b]: Seg) => (a[0] + b[0]) / 2 > CUT;
  const main = fine.filter((sg) => !isEnd(sg));
  const tear = Math.max(0, f - tornAt - 6);
  const endPart = fine.filter(isEnd);
  const flying: Seg[] = tear > 0 ? endPart.map(([a, b], i) => {
    const t = tear / 30;
    const m = lerpV(a, b, 0.5);
    const d: V = [0.6 + rnd(i * 3) * 1.6, 2.2 + rnd(i * 5) * 2.4, (rnd(i * 7) - 0.5) * 2];
    const off: V = [d[0] * t, d[1] * t - 2.0 * t * t, d[2] * t];
    const ang = (rnd(i) - 0.5) * 5 * t;
    const r2 = (q: V): V => add(add(rot3(sub3(q, m), ang), m), off);
    return [r2(a), r2(b)] as Seg;
  }) : endPart;
  const endA = tear > 0 ? Math.max(0, 1 - tear / 40) : 1;
  // borda rasgada onde a ponta saiu
  // borda serrilhada CONTÍNUA (perfil quebrado da doca), na cor da doca — nada de tracinhos soltos
  const ragPts: V[] = [];
  for (let k = 0; k <= 12; k++) {
    const z = -DD + (k / 12) * DD * 2;
    ragPts.push([CUT + (rnd(k * 3) - 0.5) * 0.5, k % 2 ? -0.35 - rnd(k) * 0.5 : 0, z]);
  }
  const rag: Seg[] = ragPts.slice(0, -1).map((q, i) => [q, ragPts[i + 1]] as Seg);
  for (const z of [-DD, DD]) rag.push([[CUT, 0, z], [CUT + 0.2, -1.2, z], [CUT - 0.15, -2.6, z]].slice(0, 2) as Seg, [[CUT + 0.2, -1.2, z], [CUT - 0.15, -2.6, z]]);
  // o navio: inteiro dentro da doca; no `tornAt` brilha, sobe e some
  const go = lerp(f, tornAt - 4, tornAt + 18, 0, 1, E(Easing.in(Easing.quad)));
  const shipSegs = xf([...SHIP_HULL, ...SHIP_TOP], { pos: [0, -0.7 + 2.2 * go, 0] });
  const ghost = xf([...SHIP_HULL].filter((_, i) => i % 3 === 0), { pos: [0, -0.7, 0] }).flatMap(([a, b]) => dashed([a, b], 0.3));
  const flashC = scr([0, 1.0, 0], cam);
  const bp = lerp(f, boxAt, boxAt + 26, 0, 1, E(Easing.inOut(Easing.cubic)));
  const blackBox = xf(box([0, 0, 0], 14, 5.6, 4.6), { pos: [0, 0.6, 0], scale: 1.6 - 0.6 * bp });
  return (
    <AbsoluteFill style={{ opacity: o }}>
      {bp > 0 ? <AbsoluteFill style={{ background: "#020104", opacity: bp * 0.55 }} /> : null}
      <Wire
        cam={cam}
        fog={40}
        layers={[
          { segs: main, color: ICE, width: 1.3, alpha: 0.6 },
          { segs: flying, color: tear > 0 ? "#ffd9b0" : ICE, width: 1.6, alpha: 0.6 * endA + (tear > 0 ? 0.3 * endA : 0) },
          { segs: rag, color: ICE, width: 1.8, alpha: 0.75 * P(f, tornAt + 8, 8) },
          { segs: shipSegs, color: go > 0.2 ? "#ffffff" : HULL, width: 1.9 + go * 1.5, alpha: P(f, ghostAt, 16) * (1 - go) },
          { segs: ghost, color: HULL, width: 1.3, alpha: P(f, tornAt + 18, 16) * 0.55 },
          { segs: blackBox, color: "#f2f0f7", width: 2.4, alpha: bp },
        ]}
      />
      <Flash f={f} at={tornAt + 10} x={flashC.x} y={flashC.y} size={1400} color="rgba(200,230,255,0.75)" />
      <Chip text="o borealis na doca" p={P(f, 4, 14) * (1 - P(f, tornAt, 10))} x={120} y={100} color={HULL} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 160, textAlign: "center", ...mono(24, "#ffd9b0", 8), opacity: P(f, tornAt + 12, 12) * (1 - bp) }}>levou junto parte da doca</div>
      <BigLabel text="a caixa preta da série" p={P(f, boxAt + 14, 14)} y={860} size={66} />
    </AbsoluteFill>
  );
};
const sub3 = (a: V, b: V): V => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const rot3 = (p: V, ang: number): V => {
  const c = Math.cos(ang);
  const s2 = Math.sin(ang);
  return [p[0] * c - p[1] * s2, p[0] * s2 + p[1] * c, p[2]];
};

// 10 · "o Borealis precisa ser a razão do jogo funcionar assim": o navio em wireframe girando; em `roomAt` corte
// lateral do casco revela a nossa sala lá dentro.
export const WFShipRoom: React.FC<{ life: number; roomAt?: number; whyAt?: number }> = ({ life, roomAt = 1e9, whyAt = 1e9 }) => {
  const f = useCurrentFrame();
  const o = fadeLife(f, life, 10, 10);
  const zoom = lerp(f, roomAt, roomAt + 40, 0, 1, E(Easing.inOut(Easing.cubic)));
  const cam = orbit([-1.6 * zoom, -0.4, 0], 15 - 7 * zoom, 0.9 + f * 0.003, 0.32, 1000);
  const room = roomLayers({ holeT: 300, lock: 0, door: 1, tower: 1, crate: [1.25, 0, -0.4] }, f).map((l) => ({ ...l, segs: xf(l.segs, { scale: 0.2, pos: [-1.6, -0.75, 0] }), alpha: (l.alpha ?? 1) * zoom }));
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <Wire
        cam={cam}
        fog={34}
        layers={[
          { segs: SHIP_HULL, color: HULL, width: 1.8, alpha: 1 - 0.55 * zoom, reveal: lerp(f, 0, 30, 0, 1, OUT) },
          { segs: SHIP_TOP, color: "#f2f0f7", width: 1.6, alpha: 1 - 0.55 * zoom, reveal: lerp(f, 8, 36, 0, 1, OUT) },
          ...room,
        ]}
      />
      <Chip text="borealis" p={P(f, 4, 14)} x={120} y={100} color={HULL} />
      <BigLabel text="a razão do jogo funcionar assim" p={P(f, whyAt, 14)} y={880} size={60} color={ORANGE} />
    </AbsoluteFill>
  );
};

// ============================================================================================== corredor do navio
const CW = 1.3; // meia largura
const CORR: Seg[] = [
  ...wallGrid((u, v) => [-CW, v, u], [-18, 4], [FY, CY], 0.8),
  ...wallGrid((u, v) => [CW, v, u], [-18, 4], [FY, CY], 0.8),
  ...wallGrid((u, v) => [u, FY, v], [-CW, CW], [-18, 4], 0.65),
  ...wallGrid((u, v) => [u, CY, v], [-CW, CW], [-18, 4], 1.3),
];
const DOORS: { z: number; side: 1 | -1 }[] = [
  { z: -2.0, side: -1 },
  { z: -5.0, side: 1 },
  { z: -8.0, side: -1 },
  { z: -11.0, side: 1 },
];
type StateKind = "dia" | "seculos" | "combine" | "xen";
// salas atrás das portas: 5 x 5, coladas no corredor; a câmera entra nelas
const RW = 5;
const roomCenter = (z: number, side: 1 | -1): V => [side * (CW + RW / 2), 0, z];
const rockPoly = (c: V, r: number, seed: number): Seg[] => {
  // pedra irregular: dois anéis deformados + ligações (poliedro torto)
  const n = 7;
  const up: V[] = [];
  const dn: V[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const rr = r * (0.7 + rnd(seed * 31 + i) * 0.6);
    up.push([c[0] + Math.cos(a) * rr, c[1] + r * 0.25 * rnd(seed + i), c[2] + Math.sin(a) * rr]);
    dn.push([c[0] + Math.cos(a + 0.4) * rr * 0.55, c[1] - r * (0.7 + rnd(seed * 7 + i) * 0.6), c[2] + Math.sin(a + 0.4) * rr * 0.55]);
  }
  const tip: V = [c[0], c[1] - r * 1.6, c[2]];
  const s: Seg[] = [];
  for (let i = 0; i < n; i++) s.push([up[i], up[(i + 1) % n]], [dn[i], dn[(i + 1) % n]], [up[i], dn[i]], [dn[i], tip]);
  return s;
};
const sideRoom = (z: number, side: 1 | -1, kind: StateKind, f: number): Layer[] => {
  const c = roomCenter(z, side);
  const x0 = c[0];
  const tt = f / 30;
  const L: Layer[] = [];
  const shell = (holes = 0): Seg[] => {
    const s: Seg[] = [
      ...wallGrid((u, v) => [x0 + side * RW / 2, v, u], [z - RW / 2, z + RW / 2], [FY, CY], 0.6),
      ...wallGrid((u, v) => [u, v, z - RW / 2], [x0 - RW / 2, x0 + RW / 2], [FY, CY], 0.6),
      ...wallGrid((u, v) => [u, v, z + RW / 2], [x0 - RW / 2, x0 + RW / 2], [FY, CY], 0.6),
      ...wallGrid((u, v) => [u, FY, v], [x0 - RW / 2, x0 + RW / 2], [z - RW / 2, z + RW / 2], 0.6),
      ...wallGrid((u, v) => [u, CY, v], [x0 - RW / 2, x0 + RW / 2], [z - RW / 2, z + RW / 2], 1.2),
    ];
    return holes ? s.filter((_, i) => rnd(i * 13 + 7) > holes) : s;
  };
  if (kind === "dia") {
    // o MOMENTO do sumiço: sala de laboratório do navio (bancadas, telas com alerta, relógio na parede), o alarme
    // vermelho girando, um vórtice de teletransporte no meio e as coisas soltas começando a flutuar
    L.push({ segs: shell(), color: "#eaf6ff", width: 1.2, alpha: 0.8 });
    const lights: Seg[] = [];
    for (const dx of [-1.2, 1.2]) for (const dz of [-1.2, 1.2]) lights.push(...xf(box([0, 0, 0], 1.2, 0.04, 0.5), { pos: [x0 + dx, CY - 0.05, z + dz] }));
    L.push({ segs: lights, color: "#fff6d8", width: 2.6 });
    const desks: Seg[] = [];
    for (const dz of [-1.3, 1.3]) {
      desks.push(...box([x0 + side * 1.2, FY + 0.4, z + dz], 0.9, 0.8, 1.8));
      desks.push(...xf(box([0, 0, 0], 0.06, 0.45, 0.7), { pos: [x0 + side * 1.4, FY + 1.05, z + dz] }));
    }
    L.push({ segs: desks, color: "#eaf6ff", width: 1.8 });
    // "!" de alerta nas telas
    const warn: Seg[] = [];
    for (const dz of [-1.3, 1.3]) {
      const c: V = [x0 + side * 1.36, FY + 1.05, z + dz];
      warn.push([add(c, [0, 0.16, 0]), add(c, [0, -0.04, 0])], [add(c, [0, -0.1, -0.02]), add(c, [0, -0.13, 0.02])]);
    }
    L.push({ segs: warn, color: RED, width: 2.4, alpha: 0.6 + 0.4 * Math.sin(tt * 10) });
    // relógio na parede do fundo (vai reaparecer parado e trincado séculos depois)
    const clockC: V = [x0, CY - 0.75, z - side * 0 - RW / 2 + 0.03];
    L.push({ segs: [...ring(clockC, 0.32, "z", 20), [clockC, add(clockC, [0, 0.22, 0])], [clockC, add(clockC, [0.15, -0.05, 0])]], color: "#eaf6ff", width: 1.8 });
    // alarme girando no teto: lâmpada + feixe varrendo
    const al: V = [x0 - side * 1.6, CY - 0.1, z + 1.6];
    const ang = tt * 5;
    L.push({ segs: [...ring(al, 0.15, "y", 10), [al, [al[0] + Math.cos(ang) * 2.4, FY + 0.4, al[2] + Math.sin(ang) * 2.4]]], color: RED, width: 2.4, alpha: 0.9 });
    // vórtice de teletransporte no meio da sala (anéis girando, subindo)
    const vort: Seg[] = [];
    for (let k = 0; k < 5; k++) {
      const r = 0.35 + k * 0.28 + 0.06 * Math.sin(tt * 4 + k);
      const y = FY + 0.6 + k * 0.32;
      const pts: V[] = Array.from({ length: 25 }).map((_, i) => {
        const a2 = (i / 24) * Math.PI * 2 + tt * (1.5 + k * 0.4);
        return [x0 - side * 0.3 + Math.cos(a2) * r, y + Math.sin(a2 * 3) * 0.05, z + Math.sin(a2) * r] as V;
      });
      pts.slice(0, -1).forEach((q, i) => vort.push([q, pts[i + 1]]));
    }
    L.push({ segs: vort, color: "#9fd8ff", width: 2, alpha: 0.85 });
    // papéis e uma cadeira flutuando
    const fl: Seg[] = [];
    for (let k = 0; k < 6; k++) {
      const c: V = [x0 - side * 0.3 + Math.cos(k * 1.1 + tt) * (0.9 + k * 0.1), FY + 0.8 + ((tt * 0.25 + k * 0.3) % 1.8), z + Math.sin(k * 1.1 + tt) * (0.9 + k * 0.1)];
      fl.push(...xf(box([0, 0, 0], 0.3, 0.01, 0.22), { pos: c, rx: tt + k, rz: tt * 0.7 + k }));
    }
    fl.push(...xf(box([0, 0, 0], 0.5, 0.5, 0.5), { pos: [x0 - side * 0.5, FY + 0.45 + 0.25 * Math.sin(tt * 1.5), z - 1.0], rz: 0.3 * Math.sin(tt), ry: tt * 0.4 }));
    L.push({ segs: fl, color: "#eaf6ff", width: 1.6 });
  } else if (kind === "seculos") {
    // a MESMA sala do dia do sumiço, séculos depois, no Ártico: congelada. Coisas reconhecíveis:
    // bancadas tombadas e telas trincadas · luminária pendurada por um cabo, balançando · rachaduras e placas faltando ·
    // pingentes de gelo no teto · neve acumulada no chão.
    const FROST = "#d9f0ff";
    const shellS = shell().filter((_, i) => rnd(i * 13 + 7) > 0.18);
    L.push({ segs: shellS, color: RUST, width: 1.2, alpha: 0.8 });
    // rachaduras grandes nas paredes (zigue-zague)
    const cracks: Seg[] = [];
    [[-1.4, 0.2], [0.8, -0.3], [1.9, 0.6]].forEach(([dz, y0], k) => {
      let p: V = [x0 + side * (RW / 2 - 0.02), CY - 0.1, z + dz];
      for (let j = 0; j < 6; j++) {
        const q: V = [p[0], p[1] - 0.45, p[2] + (rnd(k * 9 + j) - 0.5) * 0.5];
        cracks.push([p, q]);
        if (j === 2) cracks.push([q, [q[0], q[1] - 0.3, q[2] + 0.45]]);
        p = q;
      }
      void y0;
    });
    L.push({ segs: cracks, color: "#ffd9b0", width: 2 });
    // bancadas: uma tombada de lado, a outra com uma perna quebrada; telas trincadas (X)
    const desks: Seg[] = [
      ...xf(box([0, 0, 0], 0.9, 0.8, 1.8), { pos: [x0 + side * 1.0, FY + 0.45, z - 1.2], rz: side * 1.35, ry: 0.2 }),
      ...xf(box([0, 0, 0], 0.9, 0.8, 1.8), { pos: [x0 + side * 1.2, FY + 0.32, z + 1.3], rx: 0.22 }),
    ];
    const scr0: V = [x0 + side * 1.3, FY + 0.95, z + 1.25];
    const screen = xf(box([0, 0, 0], 0.06, 0.45, 0.7), { pos: scr0, rx: 0.22 });
    const xcrack: Seg[] = [[add(scr0, [0, 0.2, -0.32]), add(scr0, [0, -0.2, 0.32])], [add(scr0, [0, -0.2, -0.32]), add(scr0, [0, 0.2, 0.32])]];
    L.push({ segs: [...desks, ...screen], color: RUST, width: 1.8 });
    L.push({ segs: xcrack, color: "#ffd9b0", width: 1.8 });
    // luminária pendurada por um cabo, balançando
    const swing = Math.sin(tt * 1.6) * 0.35;
    const anchor: V = [x0 + 0.6, CY, z - 0.4];
    const lampC: V = [anchor[0] + Math.sin(swing) * 1.2, CY - 1.2 * Math.cos(swing), anchor[2]];
    L.push({ segs: [[anchor, lampC], ...xf(box([0, 0, 0], 1.0, 0.05, 0.4), { pos: lampC, rz: swing + 0.5 })], color: "#fff6d8", width: 2.2 });
    // pingentes de gelo no teto (triângulos pendurados)
    const ice: Seg[] = [];
    for (let k = 0; k < 16; k++) {
      const bx = x0 - RW / 2 + 0.3 + rnd(k * 3) * (RW - 0.6);
      const bz = z - RW / 2 + 0.3 + rnd(k * 5) * (RW - 0.6);
      const len = 0.35 + rnd(k * 7) * 0.7;
      const w = 0.08 + rnd(k) * 0.08;
      const tip: V = [bx, CY - len, bz];
      ice.push([[bx - w, CY, bz], tip], [[bx + w, CY, bz], tip], [[bx, CY, bz - w], tip], [[bx, CY, bz + w], tip]);
    }
    // neve acumulada: montes suaves no chão (curvas) encostados nas paredes
    for (let r = 0; r < 4; r++) {
      const pts: V[] = Array.from({ length: 21 }).map((_, i) => {
        const u = i / 20;
        return [x0 + side * (RW / 2 - 0.2 - r * 0.35), FY + 0.5 * Math.sin(Math.PI * u) * (1 - r * 0.22), z - RW / 2 + u * RW] as V;
      });
      pts.slice(0, -1).forEach((p, i) => ice.push([p, pts[i + 1]]));
    }
    L.push({ segs: ice, color: FROST, width: 1.8 });
    // neve caindo pelo buraco do teto
    const snow: Seg[] = [];
    for (let k = 0; k < 40; k++) {
      const y = CY - ((rnd(k * 5) * 3.1 + tt * 0.35) % 3.1);
      const p: V = [x0 - 0.8 + (rnd(k * 3) - 0.5) * 1.6 + Math.sin(tt + k) * 0.1, y, z + 0.6 + (rnd(k * 7) - 0.5) * 1.6];
      snow.push([p, add(p, [0.02, -0.04, 0])]);
    }
    L.push({ segs: snow, color: "#ffffff", width: 2.6, alpha: 0.7 });
    // o mesmo relógio do dia do sumiço: parado e trincado
    const clockC: V = [x0, CY - 0.75, z - RW / 2 + 0.03];
    L.push({ segs: [...ring(clockC, 0.32, "z", 20), [clockC, add(clockC, [-0.05, 0.22, 0])], [clockC, add(clockC, [0.18, 0.02, 0])], [add(clockC, [-0.25, 0.2, 0]), add(clockC, [0.2, -0.22, 0])]], color: RUST, width: 1.8 });
    // teias nos cantos de cima (fios radiais + anéis)
    const web: Seg[] = [];
    for (const [cx, cz] of [[x0 - RW / 2, z - RW / 2], [x0 + RW / 2, z - RW / 2]] as [number, number][]) {
      const c: V = [cx, CY, cz];
      const sx = cx < x0 ? 1 : -1;
      for (let k = 0; k < 5; k++) {
        const a2 = (k / 4) * (Math.PI / 2);
        web.push([c, add(c, [sx * Math.cos(a2) * 0.9, -Math.sin(a2) * 0.9, 0.02])]);
      }
      for (const r of [0.3, 0.55, 0.8]) for (let k = 0; k < 4; k++) {
        const a1 = (k / 4) * (Math.PI / 2);
        const a2 = ((k + 1) / 4) * (Math.PI / 2);
        web.push([add(c, [sx * Math.cos(a1) * r, -Math.sin(a1) * r, 0.02]), add(c, [sx * Math.cos(a2) * r, -Math.sin(a2) * r, 0.02])]);
      }
    }
    L.push({ segs: web, color: "#e8e2d6", width: 1.1, alpha: 0.75 });
    // armário tombado e poeira grossa no chão
    L.push({ segs: xf(box([0, 0, 0], 0.6, 2.0, 0.8), { pos: [x0 - side * 1.5, FY + 0.35, z - 1.6], rz: side * 1.35, ry: 0.4 }), color: RUST, width: 1.7 });
    const dustFloor: Seg[] = [];
    for (let k = 0; k < 70; k++) {
      const p: V = [x0 + (rnd(k * 3 + 1) - 0.5) * 4.6, FY + 0.01, z + (rnd(k * 5 + 2) - 0.5) * 4.6];
      dustFloor.push([p, add(p, [0.05, 0, 0.03])]);
    }
    L.push({ segs: dustFloor, color: "#d8c3a8", width: 2.2, alpha: 0.6 });
    // cristais de gelo na parede (asteriscos)
    const frost: Seg[] = [];
    for (let k = 0; k < 10; k++) {
      const c: V = [x0 + side * (RW / 2 - 0.03), FY + 0.4 + rnd(k * 7) * 2.4, z + (rnd(k * 9) - 0.5) * 4.2];
      for (let j = 0; j < 3; j++) {
        const a2 = (j / 3) * Math.PI;
        frost.push([add(c, [0, Math.cos(a2) * 0.14, Math.sin(a2) * 0.14]), add(c, [0, -Math.cos(a2) * 0.14, -Math.sin(a2) * 0.14])]);
      }
    }
    L.push({ segs: frost, color: "#d9f0ff", width: 1.6 });
    L.push({ segs: xf(box([0, 0, 0], 1.6, 0.02, 1.6), { pos: [x0 - 0.8, CY, z + 0.6] }), color: "#ffffff", width: 1.6, alpha: 0.5 });
  } else if (kind === "combine") {
    // paredes forradas de placas Combine (lâminas altas com fresta), campo de força, barricadas, esquadrão e holofote
    L.push({ segs: shell().filter((_, i) => i % 2 === 0), color: "rgba(140,160,190,0.7)", width: 1.1 });
    const plates: Seg[] = [];
    for (let k = -2; k <= 2; k++) {
      plates.push(...box([x0 + side * (RW / 2 - 0.15), (FY + CY) / 2 + 0.1, z + k * 0.95], 0.2, CY - FY - 0.1, 0.8));
      plates.push([[x0 + side * (RW / 2 - 0.26), FY + 0.5, z + k * 0.95], [x0 + side * (RW / 2 - 0.26), CY - 0.3, z + k * 0.95]]);
    }
    for (const zz of [z - RW / 2 + 0.15, z + RW / 2 - 0.15]) for (let k = -2; k <= 2; k++) plates.push(...box([x0 + k * 0.95, (FY + CY) / 2 + 0.1, zz], 0.8, CY - FY - 0.1, 0.2));
    L.push({ segs: plates, color: "#9fb1cc", width: 1.4 });
    const field: Seg[] = [];
    for (let k = -0.6; k <= 0.61; k += 0.15) field.push([[side * (CW + 0.05), FY, z + k], [side * (CW + 0.05), FY + 2.3, z + k]]);
    L.push({ segs: field, color: "#7fd0ff", width: 1.6, alpha: 0.55 + 0.35 * Math.sin(tt * 9) });
    const bar: Seg[] = [...xf(box([0, 0, 0], 1.8, 1.1, 0.14), { pos: [x0 - side * 0.6, FY + 0.55, z - 1.3], ry: 0.5 }), ...xf(box([0, 0, 0], 1.8, 1.1, 0.14), { pos: [x0 - side * 0.6, FY + 0.55, z + 1.3], ry: -0.5 })];
    L.push({ segs: bar, color: RED, width: 1.8 });
    const squad: Seg[] = [];
    [[0.4, -0.9], [0.4, 0.9], [1.3, -0.4], [1.3, 0.5]].forEach(([dx, dz]) => squad.push(...soldier([x0 + side * dx, FY, z + dz], side > 0 ? -Math.PI / 2 : Math.PI / 2, 0, 0, 1)));
    L.push({ segs: squad, color: RED, width: 2.1 });
    const sweep = Math.sin(tt * 1.4) * 1.2;
    const lamp: V = [x0 + side * 1.8, CY - 0.1, z];
    L.push({ segs: [...ring(lamp, 0.22, "y", 12), [lamp, [x0 - side * 1.2, FY, z + sweep]]], color: RED, width: 2.2, alpha: 0.85 });
  } else {
    // Xen: a sala some; ilhas de pedra flutuando, plantas com bulbos que brilham, tentáculos, esporos, chão orgânico
    const ground: Seg[] = [];
    for (let r = 0.6; r < 3.4; r += 0.45) {
      const pts: V[] = Array.from({ length: 33 }).map((_, i) => {
        const a = (i / 32) * Math.PI * 2;
        const rr = r + 0.12 * Math.sin(a * 3 + tt + r);
        return [x0 + Math.cos(a) * rr, FY + 0.06 * Math.sin(a * 5 + tt * 2 + r), z + Math.sin(a) * rr] as V;
      });
      pts.slice(0, -1).forEach((p, i) => ground.push([p, pts[i + 1]]));
    }
    L.push({ segs: ground, color: MOSS, width: 1.3, alpha: 0.75 });
    const rocks: Seg[] = [];
    [[-1.4, 1.3, -1.2, 0.6], [1.2, 2.2, 0.8, 0.45], [0.2, 0.9, 1.7, 0.35], [-0.6, 2.6, 0.2, 0.3]].forEach(([dx, y, dz, r], k) =>
      rocks.push(...xf(rockPoly([0, 0, 0], r, k + 11), { pos: [x0 + dx, y + Math.sin(tt * 0.8 + k) * 0.15, z + dz], ry: tt * 0.2 + k })),
    );
    L.push({ segs: rocks, color: XEN, width: 1.7 });
    const flora: Seg[] = [];
    const bulbs: Seg[] = [];
    for (let k = 0; k < 7; k++) {
      const b: V = [x0 + (rnd(k * 19) - 0.5) * 3.4, FY, z + (rnd(k * 23) - 0.5) * 3.4];
      const sw = Math.sin(tt * 1.3 + k) * 0.2;
      const top: V = add(b, [sw, 1.0 + rnd(k) * 1.1, sw * 0.5]);
      flora.push(...bezSegs(b, add(b, [-sw, 0.6, 0]), top, 1, 12));
      bulbs.push(...ring(top, 0.12 + 0.04 * Math.sin(tt * 3 + k), "y", 10), ...ring(top, 0.12, "x", 10));
    }
    L.push({ segs: flora, color: MOSS, width: 1.6 });
    L.push({ segs: bulbs, color: "#e6ffb0", width: 2.2 });
    const spores: Seg[] = [];
    for (let k = 0; k < 36; k++) {
      const p: V = [x0 + (rnd(k * 3) - 0.5) * 4.6, FY + ((rnd(k * 5) * 3.4 + tt * 0.25) % 3.4), z + (rnd(k * 7) - 0.5) * 4.6];
      spores.push([p, add(p, [0, 0.05, 0])]);
    }
    L.push({ segs: spores, color: "#d9b8ff", width: 2.6, alpha: 0.8 });
  }
  return L;
};

// 11 · os estados do navio: um corredor do Borealis, num movimento CONTÍNUO de câmera: anda pelo corredor, vira para
// a porta, a porta abre devagar e a câmera entra na sala (grande, no centro); antes da próxima, sai, volta a olhar o
// corredor e anda até a próxima porta (sem cortes nem saltos). Dia do sumiço · séculos depois · Combine · Xen.
export const WFDoorStates: React.FC<{ life: number; partsAt?: number; d1At?: number; d2At?: number; d3At?: number; d4At?: number }> = ({ life, partsAt = 0, d1At = 1e9, d2At = 1e9, d3At = 1e9, d4At = 1e9 }) => {
  const f = useCurrentFrame();
  const o = fadeLife(f, life, 10, 10);
  const ats = [d1At, d2At, d3At, d4At];
  const kinds: StateKind[] = ["dia", "seculos", "combine", "xen"];
  const labels = ["o dia em que o navio sumiu", "décadas ou séculos depois", "tomado pelos combine", "xen"];
  const colors = ["#eaf6ff", RUST, RED, XEN];
  const io = (a: number, b: number) => lerp(f, a, b, 0, 1, E(Easing.inOut(Easing.cubic)));
  const TURN = 20; // vira para a porta antes da palavra
  const OUT_ = 16; // sai da sala
  const WALK_GAP = 26; // anda até a próxima porta
  // fase atual: última porta cuja virada já começou
  const cur = ats.reduce((acc, t, i) => (f >= t - TURN ? i : acc), -1);
  const cz = (i: number) => DOORS[i].z + 0.3;
  let z: number;
  let look = 0;
  let inn = 0;
  if (cur < 0) {
    z = lerp(f, 0, ats[0] - TURN, 3.2, cz(0), E(Easing.inOut(Easing.quad)));
  } else {
    const a = ats[cur];
    const next = ats[cur + 1] ?? 1e9;
    const out0 = next - TURN - WALK_GAP - OUT_;
    const out1 = out0 + OUT_;
    const turn = io(a - TURN, a);
    const unturn = io(out1, out1 + 12);
    inn = io(a + 12, a + 46) * (1 - io(out0, out1));
    look = DOORS[cur].side * 1.3 * turn * (1 - unturn);
    z = cur < 3 ? lerp(f, out1, next - TURN, cz(cur), cz(cur + 1), E(Easing.inOut(Easing.quad))) : cz(cur);
  }
  const corridor: Cam = { pos: [0, 0.1, z], target: [Math.sin(look) * 6, -0.2, z - Math.cos(look) * 6], f: 820 };
  let cam: Cam = corridor;
  if (cur >= 0 && inn > 0) {
    const d = DOORS[cur];
    const inPos: V = [d.side * (CW + 0.4), 0.25, d.z];
    const inTgt: V = [d.side * (CW + RW), -0.35, d.z];
    cam = { pos: lerpV(corridor.pos, inPos, inn), target: lerpV(corridor.target, inTgt, inn), f: 820 - 100 * inn };
  }
  const layers: Layer[] = [{ segs: CORR, color: ICE, width: 1.2, alpha: 0.6 }];
  DOORS.forEach((d, i) => {
    const op = lerp(f, ats[i] - 4, ats[i] + 26, 0, 1, E(Easing.inOut(Easing.cubic)));
    const leaf = xf(box([d.side * CW, FY + 1.15, d.z], 0.06, 2.3, 1.3), { pivot: [d.side * CW, FY + 1.15, d.z - 0.65], ry: d.side * 1.45 * op });
    const lit = f >= ats[i] - 4;
    layers.push({ segs: box([d.side * CW, FY + 1.2, d.z], 0.1, 2.4, 1.4), color: lit ? colors[i] : ICE, width: 1.8 });
    layers.push({ segs: leaf, color: lit ? colors[i] : ICE, width: 2 });
    if (op > 0.02 && i === cur) {
      if (kinds[i] === "seculos") {
        // a mesma sala do "dia do sumiço" envelhece na sua frente (time-lapse)
        const age = lerp(f, ats[i] + 30, ats[i] + 80, 0, 1, E(Easing.inOut(Easing.quad)));
        sideRoom(d.z, d.side, "dia", f).forEach((l) => layers.push({ ...l, alpha: (l.alpha ?? 1) * op * (1 - age), segs: l.segs.filter((_, j) => rnd(j * 7 + 3) > age * 0.9) }));
        sideRoom(d.z, d.side, "seculos", f).forEach((l) => layers.push({ ...l, alpha: (l.alpha ?? 1) * op * age }));
      } else sideRoom(d.z, d.side, kinds[i], f).forEach((l) => layers.push({ ...l, alpha: (l.alpha ?? 1) * op }));
    }
  });
  const xenGlow = cur === 3 ? P(f, ats[3] + 10, 24) * inn : 0;
  const ageN = cur === 1 ? lerp(f, ats[1] + 30, ats[1] + 80, 0, 1, E(Easing.in(Easing.quad))) : 0;
  const years = Math.round(Math.pow(ageN, 1.6) * 200);
  return (
    <AbsoluteFill style={{ opacity: o }}>
      {xenGlow > 0 ? <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 60%, rgba(176,124,255,0.35), rgba(143,224,166,0.12) 45%, rgba(0,0,0,0) 75%)", opacity: xenGlow }} /> : null}
      <Wire cam={cam} fog={22} layers={layers} />
      <Chip text="borealis · partes em estados diferentes" p={P(f, partsAt, 14) * (1 - P(f, d1At - TURN, 10))} x={120} y={100} color={HULL} />
      {cur === 1 ? (
        <div style={{ position: "absolute", right: 120, top: 90, textAlign: "right", opacity: P(f, ats[1] + 26, 10) * inn }}>
          <div style={{ ...mono(18, RUST, 6) }}>a mesma sala</div>
          <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 86, color: RUST, letterSpacing: -2, textShadow: "0 0 30px rgba(201,144,94,0.35)" }}>+{years} anos</div>
        </div>
      ) : null}
      {ats.map((t, i) => (
        <div key={i} style={{ position: "absolute", left: 0, right: 0, top: 900, textAlign: "center", ...mono(32, colors[i], 10), opacity: (i === cur ? inn : 0) * P(f, t + 20, 12), textShadow: "0 2px 16px rgba(0,0,0,0.95)" }}>
          {labels[i]}
        </div>
      ))}
    </AbsoluteFill>
  );
};

// fases coladas: vista de cima, as quatro fases (dia · séculos · Combine · Xen) chegam uma por vez e se encaixam lado
// a lado até formar um quadrado — fases separadas, só coladas umas nas outras
const LoadingPhases: React.FC<{ f: number; until: number }> = ({ f, until }) => {
  const kinds: StateKind[] = ["dia", "seculos", "combine", "xen"];
  const colors = ["#eaf6ff", RUST, RED, XEN];
  const quad: [number, number][] = [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ];
  const seg = Math.max(18, (until - 10) / 4);
  const cam = orbit([0, -1.5, 0], 16.5, 0.35 + f * 0.003, 1.0, 1000);
  const C0 = roomCenter(0, 1);
  const L: Layer[] = [];
  kinds.forEach((k, i) => {
    const p = lerp(f, i * seg, i * seg + seg * 0.7, 0, 1, E(Easing.out(Easing.back(1.1))));
    if (p <= 0) return;
    const [qx, qz] = quad[i];
    const tx = qx * (RW / 2 + 0.02);
    const tz = qz * (RW / 2 + 0.02);
    const from: V = [qx * 14, 6, qz * 10];
    const pos = lerpV(from, [tx, 0, tz], p);
    sideRoom(0, 1, k, f).forEach((l) => L.push({ ...l, segs: xf(l.segs, { pos: [pos[0] - C0[0], pos[1], pos[2]], ry: (1 - p) * 1.2 * qx }), alpha: (l.alpha ?? 1) * Math.min(1, p * 1.5) }));
    // borda/emenda de cada fase
    L.push({ segs: xf(box([0, 0, 0], RW, 0.05, RW), { pos: [pos[0], FY, pos[2]] }), color: colors[i], width: 2.4, alpha: Math.min(1, p * 1.5) });
  });
  return (
    <AbsoluteFill>
      <Wire cam={cam} fog={40} layers={L} />
      {kinds.map((_, i) => {
        const [qx, qz] = quad[i];
        const q = scr([qx * (RW / 2), CY + 0.6, qz * (RW / 2)], cam);
        return (
          <div key={i} style={{ position: "absolute", left: q.x - 90, top: q.y - 20, width: 180, textAlign: "center", ...mono(22, colors[i], 6), opacity: P(f, i * seg + seg * 0.5, 8), textShadow: "0 2px 12px rgba(0,0,0,0.95)" }}>
            {`fase ${i + 1}`}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// 12 · "não queria um monte de fases coladas… a mudança acontece com você lá dentro": primeiro quatro FASES separadas
// (blocos com emenda e barra de carregamento) — riscado; depois UMA sala com o jogador no meio e frentes de mudança
// atravessando a sala com ele dentro (dia → séculos → Combine → Xen). A caixa segue rolando através da mudança
// (física), os soldados reagem e apontam (inimigos), a rota que você abriu continua (consequências) e, em `truthAt`,
// a porta para onde você ia some e aparece em outro lugar ("pode deixar de ser verdade").
export const WFMorphWalk: React.FC<{ life: number; changeAt?: number; objAt?: number; enemAt?: number; routeAt?: number; truthAt?: number }> = ({ life, changeAt = 60, objAt = 1e9, enemAt = 1e9, routeAt = 1e9, truthAt = 1e9 }) => {
  const f = useCurrentFrame();
  const o = fadeLife(f, life, 10, 10);
  const toRoom = lerp(f, changeAt - 20, changeAt + 6, 0, 1, E(Easing.inOut(Easing.cubic)));
  // --- parte 1: fases coladas
  const phases: Seg[] = [];
  const kinds: StateKind[] = ["dia", "seculos", "combine", "xen"];
  const phaseCols = ["#eaf6ff", RUST, RED, XEN];
  const pcam = orbit([0, 0, 0], 17, 0.5, 0.45, 1000);
  // --- parte 2: a sala (a do corredor, centrada na origem) com as frentes de mudança
  const C0: V = roomCenter(0, 1);
  const cam = orbit([C0[0], -0.3, 0], 9.2, 0.5 + f * 0.0025, 0.32, 1000);
  const sweeps = [changeAt + 10, enemAt - 10, routeAt + 20];
  const sw = sweeps.map((t) => lerp(f, t, t + 36, 0, 1, E(Easing.inOut(Easing.quad))));
  const stage = sw.reduce((acc, v) => acc + (v >= 1 ? 1 : 0), 0);
  const curP = stage < 3 ? sw[stage] : 1;
  const xFront = C0[0] - RW / 2 - 0.3 + (RW + 0.6) * curP; // a frente avança em x
  const keep = (segs: Seg[], left: boolean) => segs.filter(([a, b]) => ((a[0] + b[0]) / 2 < xFront) === left);
  const roomOf = (k: StateKind) => sideRoom(0, 1, k, f);
  const oldK = kinds[Math.min(3, stage)];
  const newK = kinds[Math.min(3, stage + 1)];
  const L: Layer[] = [];
  if (toRoom > 0) {
    if (stage < 3 && curP > 0) {
      roomOf(newK).forEach((l) => L.push({ ...l, segs: keep(l.segs, true) }));
      roomOf(oldK).forEach((l) => L.push({ ...l, segs: keep(l.segs, false) }));
      L.push({ segs: [[[xFront, FY, -RW / 2], [xFront, CY, -RW / 2]], [[xFront, FY, RW / 2], [xFront, CY, RW / 2]], [[xFront, FY, -RW / 2], [xFront, FY, RW / 2]], [[xFront, CY, -RW / 2], [xFront, CY, RW / 2]]], color: "#ffffff", width: 3 });
    } else roomOf(stage >= 3 ? "xen" : oldK).forEach((l) => L.push(l));
  }
  // o jogador no meio (sempre o mesmo)
  const PLm: V = [C0[0] - 0.4, FY, 0.9];
  L.push({ segs: soldier(PLm, Math.PI * 0.8, 0, 0, 0), color: ORANGE, width: 2.4 }, { segs: ring(add(PLm, [0, 0.03, 0]), 0.6 + 0.05 * Math.sin(f / 4), "y", 24), color: ORANGE, width: 1.6 });
  // caixa rolando através da mudança
  const ct = Math.max(0, f - objAt) / 30;
  const crateX = C0[0] - 2.0 + Math.min(3.6, ct * 1.2);
  L.push({ segs: xf(box([0, 0, 0], 0.6, 0.6, 0.6), { pos: [crateX, FY + 0.3, -0.9], rz: -ct * 2.2 }), color: ORANGE, width: 2, alpha: P(f, objAt - 6, 8) });
  // rota que você abriu (tracejada até a porta) e a porta que "deixa de ser verdade"
  const doorA: V = [C0[0] + 0.6, FY, -RW / 2 + 0.05];
  const doorB: V = [C0[0] + RW / 2 - 0.05, FY, 1.2];
  const tr = lerp(f, truthAt, truthAt + 16, 0, 1, E(Easing.inOut(Easing.cubic)));
  L.push({ segs: dashed([fy(PLm[0], PLm[2] - 0.3), fy(C0[0] + 0.3, -0.8), fy(doorA[0], doorA[2] + 0.2)]), color: tr > 0.5 ? RED : "#ffd9b0", width: 2.4, reveal: P(f, routeAt, 18) });
  L.push({ segs: box([doorA[0], FY + 1.1, doorA[2]], 1.1, 2.2, 0.08), color: ORANGE, width: 2.2, alpha: P(f, routeAt, 10) * (1 - tr) });
  L.push({ segs: box([doorB[0], FY + 1.1, doorB[2]], 0.08, 2.2, 1.1), color: ORANGE, width: 2.2, alpha: tr });
  const ph = 1 - toRoom;
  return (
    <AbsoluteFill style={{ opacity: o }}>
      {ph > 0.01 ? (
        <AbsoluteFill style={{ opacity: ph }}>
          <LoadingPhases f={f} until={changeAt - 26} />
          <BigLabel text="fases coladas uma na outra" p={P(f, changeAt - 44, 10)} y={860} size={60} strike={P(f, changeAt - 34, 10)} />
        </AbsoluteFill>
      ) : null}
      {toRoom > 0 ? (
        <AbsoluteFill style={{ opacity: toRoom }}>
          {stage >= 3 || (stage === 2 && curP > 0.5) ? <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 60%, rgba(176,124,255,0.3), rgba(0,0,0,0) 70%)" }} /> : null}
          <Wire cam={cam} fog={26} layers={L} />
          <Chip text="a mudança acontece com você lá dentro" p={P(f, changeAt, 14) * (1 - P(f, objAt - 6, 8))} x={120} y={100} color={HULL} />
          {[
            { t: "objetos · a física continua", at: objAt, end: enemAt, c: ORANGE },
            { t: "inimigos · reagem", at: enemAt, end: routeAt, c: RED },
            { t: "rotas · continuam tendo consequência", at: routeAt, end: truthAt, c: "#ffd9b0" },
          ].map((l) => (
            <div key={l.t} style={{ position: "absolute", left: 120, top: 100, ...mono(24, l.c, 6), opacity: P(f, l.at, 10) * (1 - P(f, l.end - 4, 8)) }}>
              {l.t}
            </div>
          ))}
          <BigLabel text="pode deixar de ser verdade" p={P(f, truthAt + 8, 14)} y={880} size={64} />
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};

const fy0 = (x: number, z: number): V => [x, FY + 0.03, z];
const fy = fy0;

// 13 · "gameplay e história viraram a mesma coisa… o Borealis deixou de ser uma ponta solta… virou a mecânica
// central": as duas linhas (gameplay laranja, história azul) vêm paralelas e, até `mergeAt`, CONVERGEM e se trançam
// entrando no navio. Em `shipAt` uma etiqueta de papel "ponta solta" fica pendurada na proa, balançando. Em `mechAt`
// a etiqueta é puxada para dentro do navio e as engrenagens ENCAIXAM em volta dele (coroa grande + duas menores) e
// começam a girar — o navio vira o eixo do jogo.
const gear = (r: number, teeth: number, w: number, hub = true): Seg[] => {
  const pts: P2[] = [];
  for (let i = 0; i < teeth * 4; i++) {
    const a = (i / (teeth * 4)) * Math.PI * 2;
    const rr = i % 4 < 2 ? r : r * 0.82;
    pts.push([Math.cos(a) * rr, Math.sin(a) * rr]);
  }
  const s: Seg[] = [];
  for (const z of [-w / 2, w / 2]) pts.forEach((p, i) => s.push([[p[0], p[1], z], [pts[(i + 1) % pts.length][0], pts[(i + 1) % pts.length][1], z]]));
  pts.forEach((p, i) => i % 2 === 0 && s.push([[p[0], p[1], -w / 2], [p[0], p[1], w / 2]]));
  if (hub) {
    s.push(...ring([0, 0, 0], r * 0.3, "z", 14));
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2;
      s.push([[Math.cos(a) * r * 0.3, Math.sin(a) * r * 0.3, 0], [Math.cos(a) * r * 0.78, Math.sin(a) * r * 0.78, 0]]);
    }
  } else s.push(...ring([0, 0, 0], r * 0.74, "z", 48));
  return s;
};
const SHIP_C: V = [0.4, -0.2, 0];
export const WFMerge: React.FC<{ life: number; mergeAt?: number; shipAt?: number; mechAt?: number }> = ({ life, mergeAt = 10, shipAt = 1e9, mechAt = 1e9 }) => {
  const f = useCurrentFrame();
  const o = fadeLife(f, life, 10, 10);
  const cam = orbit([0.6, 0.1, 0], 17, 0.18 + Math.sin(f / 90) * 0.05, 0.14, 1000);
  const tt = f / 30;
  const draw = lerp(f, 0, 34, 0, 1, E(Easing.out(Easing.cubic)));
  // convergência sincronizada com o riser: as linhas se aproximam e terminam de se trançar em `mergeAt`
  const conv = lerp(f, mergeAt - 42, mergeAt, 0, 1, E(Easing.in(Easing.cubic)));
  const strand = (y0: number, ph: number) =>
    Array.from({ length: 80 }).map((_, i) => {
      const x = -10 + (8.4 * i) / 79; // termina na popa do navio
      const m = Math.min(1, Math.max(0, (x + 6.5) / 3)) * conv;
      const a = x * 3.2 + ph + tt * 2.2;
      return [x, y0 * (1 - m) + Math.sin(a) * 0.22 * m, Math.cos(a) * 0.22 * m] as V;
    });
  const toSegs = (pts: V[], upTo = 1): Seg[] => pts.slice(0, Math.max(1, Math.floor(upTo * pts.length))).map((q, i, a2) => [q, a2[Math.min(i + 1, a2.length - 1)]] as Seg);
  const merged = P(f, mergeAt, 10);
  // etiqueta "ponta solta" pendurada na proa
  const ANCHOR: V = [2.5, 0.3, 0.2];
  const drop = lerp(f, shipAt - 6, shipAt + 10, 0, 1, E(Easing.out(Easing.back(1.8))));
  const sw = 0.32 * Math.sin(tt * 1.7) + 0.5 * (1 - drop) * Math.sin(tt * 6);
  const pull = lerp(f, mechAt - 10, mechAt + 4, 0, 1, E(Easing.in(Easing.cubic)));
  const strLen = 1.0 * drop * (1 - pull);
  const tagP0: V = add(ANCHOR, [Math.sin(sw) * strLen, -Math.cos(sw) * strLen, 0]);
  const tagP = lerpV(tagP0, SHIP_C, pull);
  // engrenagens: encaixam em `mechAt + 6` e giram
  const SNAP = mechAt + 6;
  const sp = lerp(f, mechAt - 6, SNAP, 0, 1, E(Easing.out(Easing.back(1.7))));
  const spin = Math.max(0, f - SNAP) * 0.035;
  const RB = 3.3;
  const RS = 1.3;
  const DIST = (RB + RS) * 0.91;
  const big = xf(gear(RB, 30, 0.35, false), { pos: SHIP_C, rz: spin, scale: 1.5 - 0.5 * sp });
  const small = [0.62, 0.62 + Math.PI].map((ang, k) => {
    const d = DIST * (1 + 1.4 * (1 - sp));
    return xf(gear(RS, 12, 0.3), { pos: add(SHIP_C, [Math.cos(ang) * d, Math.sin(ang) * d, 0]), rz: -spin * (RB / RS) + k * 0.13 });
  });
  const gearOn = f >= mechAt - 6;
  const ship = xf([...SHIP_HULL, ...SHIP_TOP], { scale: 0.45, pos: SHIP_C });
  const snapC = scr(SHIP_C, cam);
  const tq = scr(tagP, cam);
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <Wire
        cam={cam}
        fog={40}
        layers={[
          { segs: ship, color: f >= SNAP ? ORANGE : HULL, width: 1.5 + merged * 0.5, alpha: 0.85 },
          { segs: toSegs(strand(1.7, 0), draw), color: ORANGE, width: 3 },
          { segs: toSegs(strand(-1.7, Math.PI), draw), color: ICE, width: 3 },
          { segs: strLen > 0.02 ? [[ANCHOR, tagP0]] : [], color: "#e8dcc0", width: 1.6, alpha: P(f, shipAt - 6, 6) },
          { segs: gearOn ? big : [], color: ORANGE, width: 2.2, alpha: sp },
          { segs: gearOn ? small.flat() : [], color: "#ffd9b0", width: 2, alpha: sp },
        ]}
      />
      {/* etiqueta de papel */}
      {f >= shipAt - 6 && pull < 1 ? (
        <div style={{ position: "absolute", left: tq.x - 95, top: tq.y - 4, width: 190, height: 92, transformOrigin: "50% 0", transform: `rotate(${(-sw * 180) / Math.PI}deg) scale(${(1 - pull) * (0.6 + 0.4 * drop)})`, opacity: P(f, shipAt - 6, 6) }}>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(170deg, #efe5cc, #d9cba8)", clipPath: "polygon(20% 0, 80% 0, 100% 22%, 100% 100%, 0 100%, 0 22%)", boxShadow: "0 12px 30px rgba(0,0,0,0.5)" }} />
          <div style={{ position: "absolute", left: 87, top: 8, width: 16, height: 16, borderRadius: 8, border: "3px solid #8a7a5a", background: "#1a1622" }} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 30, textAlign: "center", fontFamily: HAND, fontSize: 40, color: "#b3121b" }}>ponta solta</div>
        </div>
      ) : null}
      <Flash f={f} at={SNAP} x={snapC.x} y={snapC.y} size={900} color="rgba(255,190,120,0.55)" />
      <div style={{ position: "absolute", left: 140, top: 330, ...mono(28, ORANGE, 10), opacity: P(f, 4, 12) * (1 - merged) }}>gameplay</div>
      <div style={{ position: "absolute", left: 140, top: 700, ...mono(28, ICE, 10), opacity: P(f, 4, 12) * (1 - merged) }}>história</div>
      <Chip text="gameplay + história" p={merged * (1 - P(f, mechAt - 10, 10))} x={120} y={100} color={ORANGE} />
      <BigLabel text="a mecânica central do jogo" p={P(f, SNAP, 12)} y={900} size={66} color={ORANGE} />
    </AbsoluteFill>
  );
};

// 14 · "pilares fortes para justificar um terceiro Half-Life": cinco pilares sobem do chão (espaço · física · IA ·
// borealis · regras) e sustentam uma laje.
export const WFPillars: React.FC<{ life: number; at?: number; step?: number }> = ({ life, at = 6, step = 5 }) => {
  const f = useCurrentFrame();
  const o = fadeLife(f, life, 10, 10);
  const cam = orbit([0, 0.6, 0], 13, 0.35 + f * 0.003, 0.18, 1000);
  const names = ["espaço", "física", "ia", "borealis", "regras"];
  const segs: Layer[] = names.map((_, i) => {
    const hgt = 3.4 * lerp(f, at + i * step, at + i * step + 16, 0, 1, E(Easing.out(Easing.back(1.2))));
    const x = -4 + i * 2;
    return { segs: hgt > 0.01 ? box([x, -1.6 + hgt / 2, 0], 0.7, hgt, 0.7) : [], color: i === 3 ? HULL : ICE, width: 2 };
  });
  const slab = P(f, at + 4 * step + 18, 10);
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <Wire cam={cam} fog={34} layers={[{ segs: box([0, -1.7, 0], 11, 0.2, 2.5), color: ICE, width: 1.2, alpha: 0.5 }, ...segs, { segs: box([0, 1.95, 0], 10.4, 0.3, 1.6), color: ORANGE, width: 2.4, alpha: slab }]} />
      {names.map((n, i) => {
        const q = scr([-4 + i * 2, -2.1, 0.5], cam);
        return (
          <div key={n} style={{ position: "absolute", left: q.x - 90, top: q.y, width: 180, textAlign: "center", ...mono(20, i === 3 ? HULL : ICE, 5), opacity: P(f, at + i * step + 6, 8) }}>
            {n}
          </div>
        );
      })}
      <div style={{ position: "absolute", left: 0, right: 0, top: scr([0, 2.5, 0], cam).y - 70, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 64, color: ORANGE, opacity: slab, textShadow: "0 0 30px rgba(255,138,31,0.4)" }}>Half-Life 3</div>
    </AbsoluteFill>
  );
};

// 15 · "problemas e paradoxos… se esse navio pode fazer tudo isso, quais são as regras?": cópias do navio num anel
// (o navio dentro de si mesmo), girando; a pergunta fica na tela.
const PARADOX_STEP = 8;
export const WFParadox: React.FC<{ life: number; probAt?: number; qAt?: number }> = ({ life, probAt = 6, qAt = 1e9 }) => {
  const f = useCurrentFrame();
  const o = fadeLife(f, life, 10, 12);
  const cam = orbit([0, 0, 0], 22, f * 0.006, 0.55, 1000);
  const n = 7;
  // cada cópia MATERIALIZA no seu quadro (probAt + i·8): cresce de 60% com um lampejo branco curto
  const ships: Layer[] = Array.from({ length: n }).map((_, i) => {
    const t0 = i === 0 ? -1e9 : probAt + i * PARADOX_STEP;
    const m = lerp(f, t0, t0 + 6, 0, 1, E(Easing.out(Easing.back(2))));
    const a = (i / n) * Math.PI * 2 + f * 0.004;
    const hot = f >= t0 && f < t0 + 5;
    return { segs: m > 0 ? xf([...SHIP_HULL, ...SHIP_TOP], { scale: 0.42 * (0.6 + 0.4 * m), ry: -a + Math.PI / 2, pos: [Math.cos(a) * 6, Math.sin(a * 2) * 0.6, Math.sin(a) * 6] }) : [], color: hot ? "#ffffff" : i === 0 ? HULL : "rgba(255,107,90,0.55)", width: hot ? 2.4 : 1.4, alpha: Math.min(1, m * 1.5) };
  });
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <Wire cam={cam} fog={50} layers={[...ships, { segs: ring([0, 0, 0], 6, "y", 60), color: "#ffd9b0", width: 1, alpha: 0.4 }]} />
      <Chip text="problemas e paradoxos" p={P(f, probAt, 14)} x={120} y={100} color={HULL} />
      <BigLabel text="quais são as regras?" p={P(f, qAt, 14)} y={860} size={84} />
    </AbsoluteFill>
  );
};

// 16 (2E) · as regras, na sala do 2B. "Não pode mudar o mundo do jeito que o roteiro quiser": um papel de roteiro
// escreve ordens e a sala obedece sem causa (a parede some, um soldado aparece atrás de você); "vira mágica": linhas
// roxas ligam o papel ao que mudou — e "mágica" é riscada. Três regras: 1 o jogador percebe (as luzes piscam, o chão
// levanta poeira e o aviso acende ANTES da mudança) · 2 a física continua valendo (a caixa cai e fica) · 3 vale para
// todos (você, aliado e inimigo sob a mesma onda). "Pode surpreender, mas não pode trapacear": o roteiro tenta de
// novo e leva um carimbo "REGRA".
export const WFBorealisRules: React.FC<{ life: number; scriptAt?: number; magicAt?: number; simpleAt?: number; r1At?: number; r2At?: number; r3At?: number; trickAt?: number }> = ({
  life,
  scriptAt = 10,
  magicAt = 1e9,
  simpleAt = 1e9,
  r1At = 1e9,
  r2At = 1e9,
  r3At = 1e9,
  trickAt = 1e9,
}) => {
  const f = useCurrentFrame();
  const o = fadeLife(f, life, 10, 12);
  const cam = orbit([0.2, -0.3, -1.0], 9.4, 0.62 + Math.sin(f / 90) * 0.08, 0.3, 1000);
  const tt = f / 30;
  const wallGone = f >= scriptAt + 30 && f < r1At;
  const popAt = scriptAt + 58;
  const youP: V = [1.6, FY, 1.6];
  const foeBehind: V = [2.6, FY, 2.8];
  // regra 1: aviso antes da mudança (piscar + poeira + anel); a mudança é uma varredura de cor
  const warn = f >= r1At && f < r1At + 40;
  const flick = warn && Math.floor((f - r1At) / 3) % 2 === 0 ? 0.45 : 1;
  const shiftT = lerp(f, r1At + 40, r1At + 70, 0, 1, E(Easing.inOut(Easing.quad)));
  const roomColor = shiftT > 0.5 ? RUST : ICE;
  // regra 2: a caixa cai e fica
  const fall = lerp(f, r2At, r2At + 14, 0, 1, E(Easing.in(Easing.quad)));
  // regra 3: anel único passando por todos
  const r3 = Math.max(0, f - r3At);
  const room = roomLayers({ holeT: wallGone ? 300 : 0, lock: 0, door: 1, crate: [0.6, 2.0 * (1 - fall), -0.9], color: roomColor, accent: ORANGE, hot: { crate: P(f, r2At, 10) } }, f).map((l) => ({ ...l, alpha: (l.alpha ?? 1) * flick }));
  const dust: Seg[] = [];
  if (warn) for (let k = 0; k < 40; k++) {
    const t = ((f - r1At) / 40 + rnd(k)) % 1;
    const p: V = [XLr + rnd(k * 3) * 8, FY + t * 1.2, -5 + rnd(k * 7) * 8];
    dust.push([p, add(p, [0, 0.06, 0])]);
  }
  const ring1 = warn ? ring([0.2, FY + 0.03, -0.5], 0.4 + (f - r1At) * 0.12, "y", 40) : [];
  const ring3 = r3 > 0 && r3 < 60 ? ring([1.0, FY + 0.03, 0.8], 0.3 + r3 * 0.1, "y", 40) : [];
  const allyP: V = [-0.4, FY, 1.8];
  const foeP: V = [0.8, FY, -2.6];
  const magicP = P(f, magicAt - 4, 10) * (1 - P(f, simpleAt, 10));
  // cartola sobre o papel do roteiro; a varinha sai dela, acena e solta faíscas que vão até o buraco da parede e
  // até o soldado (com um "puf" em cada um); depois "mágica" é riscada
  const hatIn = lerp(f, magicAt - 6, magicAt + 4, 0, 1, E(Easing.out(Easing.back(2))));
  const wandUp = lerp(f, magicAt, magicAt + 8, 0, 1, OUT);
  const wave = f >= magicAt + 6 && f < magicAt + 26 ? Math.sin((f - magicAt - 6) * 0.55) * 32 : 0;
  const wandAng = -60 + 45 * wandUp + wave; // graus (0 = para a direita)
  const HAT = { x: 455, y: 175 };
  const wandLen = 150 * wandUp;
  const tip = { x: HAT.x + Math.cos((wandAng * Math.PI) / 180) * wandLen, y: HAT.y - 40 + Math.sin((wandAng * Math.PI) / 180) * wandLen };
  const targets = [
    { q: scr(HOLE_C, cam), at: magicAt + 18 },
    { q: scr(add(foeBehind, [0, 1.0, 0]), cam), at: magicAt + 24 },
  ];
  const STRIKE = magicAt + 32;
  const stamp = lerp(f, trickAt + 12, trickAt + 20, 0, 1, E(Easing.out(Easing.back(2))));
  const scriptLines = ["a parede some", "um inimigo aparece atrás", f >= trickAt ? "a porta vira parede" : ""];
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <Wire
        cam={cam}
        fog={28}
        layers={[
          ...room,
          { segs: soldier(youP, -2.5, 0, 0, 0), color: ORANGE, width: 2.3, alpha: P(f, 0, 12) },
          { segs: soldier(foeBehind, -2.4, 0, 0, 1), color: RED, width: 2.2, alpha: f >= popAt && f < r1At ? 1 : 0 },
          { segs: dust, color: "#ffe6c8", width: 2.4, alpha: 0.7 },
          { segs: [...ring1, ...ring3], color: "#ffffff", width: 2.2 },
          { segs: soldier(allyP, 2.6, 0, 0, 0), color: ICE, width: 2.2, alpha: P(f, r3At - 6, 10) },
          { segs: soldier(foeP, 0.3, 0, 0, 1), color: RED, width: 2.2, alpha: P(f, r3At, 10) },
        ]}
      />
      {/* o papel do roteiro (canto esquerdo) */}
      <div style={{ position: "absolute", left: 90, top: 170, width: 420, padding: "24px 28px", borderRadius: 14, background: "linear-gradient(170deg, #eee6d2, #ddd2b6)", boxShadow: "0 30px 80px rgba(0,0,0,0.6)", opacity: P(f, scriptAt - 6, 12) * (1 - P(f, simpleAt, 14)) + P(f, trickAt - 4, 10), transform: `rotate(-2deg)` }}>
        <div style={{ fontFamily: HAND, fontSize: 40, color: "#b3121b" }}>roteiro</div>
        {scriptLines.map((t, i) =>
          t ? (
            <div key={i} style={{ fontFamily: HAND, fontSize: 38, color: INK, marginTop: 6 }}>
              {t.slice(0, Math.max(0, Math.floor((f - (i < 2 ? scriptAt + i * 26 : trickAt)) / 1.0)))}
            </div>
          ) : null,
        )}
        <div style={{ position: "absolute", right: 24, bottom: 18, padding: "6px 16px", border: "5px solid #b3121b", borderRadius: 10, fontFamily: FONT, fontWeight: 900, fontSize: 34, color: "#b3121b", transform: `rotate(-14deg) scale(${2 - stamp})`, opacity: stamp }}>REGRA</div>
      </div>
      {hatIn > 0 && magicP > 0 ? (
        <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: magicP }}>
          {/* faíscas: rastro da ponta da varinha até cada alvo */}
          {targets.map((tg, k) => {
            const t0 = tg.at - 12;
            return Array.from({ length: 9 }).map((_, j) => {
              const u = lerp(f, t0 + j * 0.8, tg.at + j * 0.8, 0, 1, OUT);
              if (u <= 0 || u >= 1) return null;
              const mx = (tip.x + tg.q.x) / 2;
              const my = Math.min(tip.y, tg.q.y) - 160;
              const x = (1 - u) * (1 - u) * tip.x + 2 * u * (1 - u) * mx + u * u * tg.q.x;
              const y = (1 - u) * (1 - u) * tip.y + 2 * u * (1 - u) * my + u * u * tg.q.y;
              const r = 5 + 4 * Math.sin(f * 0.9 + j);
              return <path key={`${k}-${j}`} d={`M ${x} ${y - r * 2} L ${x + r * 0.5} ${y - r * 0.5} L ${x + r * 2} ${y} L ${x + r * 0.5} ${y + r * 0.5} L ${x} ${y + r * 2} L ${x - r * 0.5} ${y + r * 0.5} L ${x - r * 2} ${y} L ${x - r * 0.5} ${y - r * 0.5} Z`} fill={j % 3 === 0 ? "#ffe9a8" : "#ffffff"} opacity={0.9 - j * 0.07} />;
            });
          })}
          {/* "puf": nuvenzinha que estoura em cada alvo */}
          {targets.map((tg, k) => {
            const d = f - tg.at;
            if (d < 0 || d > 16) return null;
            const e2 = d / 16;
            return (
              <g key={`puf${k}`} opacity={1 - e2}>
                {[0, 1, 2, 3, 4, 5].map((j) => {
                  const a2 = (j / 6) * Math.PI * 2;
                  return <circle key={j} cx={tg.q.x + Math.cos(a2) * 50 * e2} cy={tg.q.y + Math.sin(a2) * 40 * e2} r={22 + 18 * e2} fill="#efe9ff" opacity={0.55} />;
                })}
              </g>
            );
          })}
          {/* varinha */}
          <line x1={HAT.x} y1={HAT.y - 40} x2={tip.x} y2={tip.y} stroke="#15121c" strokeWidth={10} strokeLinecap="round" />
          <line x1={HAT.x} y1={HAT.y - 40} x2={tip.x} y2={tip.y} stroke="#f2f0f7" strokeWidth={2} strokeLinecap="round" opacity={0.6} />
          <circle cx={tip.x} cy={tip.y} r={7 * wandUp} fill="#ffffff" />
          {/* cartola */}
          <g transform={`translate(${HAT.x} ${HAT.y}) scale(${hatIn}) rotate(-8)`}>
            <ellipse cx={0} cy={22} rx={86} ry={18} fill="#15121c" stroke="#f2f0f7" strokeWidth={2.5} />
            <path d="M -54 20 L -48 -78 Q 0 -90 48 -78 L 54 20 Z" fill="#15121c" stroke="#f2f0f7" strokeWidth={2.5} />
            <path d="M -52 -6 L 52 -6 L 53 8 L -53 8 Z" fill="#b3121b" />
            <ellipse cx={0} cy={-80} rx={48} ry={10} fill="#221d2c" stroke="#f2f0f7" strokeWidth={2} />
          </g>
        </svg>
      ) : null}
      <BigLabel text="mágica" p={magicP} y={110} size={80} strike={P(f, STRIKE, 10)} />
      <div style={{ position: "absolute", right: 120, top: 100, ...mono(22, ORANGE, 6), opacity: warn ? 1 : 0, border: `1px solid ${ORANGE}`, padding: "8px 16px", borderRadius: 10, background: "rgba(5,4,10,0.6)" }}>⚠ o espaço vai mudar</div>
      {[
        { t: "1 · o jogador percebe", at: r1At, c: "#ffffff" },
        { t: "2 · a física continua valendo", at: r2At, c: ORANGE },
        { t: "3 · vale para você, aliados e inimigos", at: r3At, c: ICE },
      ].map((l, i) => (
        <div key={l.t} style={{ position: "absolute", left: 120, top: 700 + i * 50, ...mono(24, l.c, 5), opacity: P(f, l.at, 10) * (1 - P(f, trickAt - 10, 10)), textShadow: "0 2px 14px rgba(0,0,0,0.95)" }}>
          {l.t}
        </div>
      ))}
      <Chip text="regras simples" p={P(f, simpleAt, 12) * (1 - P(f, r1At, 10))} x={120} y={100} color={ORANGE} />
      <BigLabel text="pode surpreender, mas não pode trapacear" p={P(f, trickAt, 14)} y={880} size={58} color={ORANGE} />
      {void tt}
    </AbsoluteFill>
  );
};
const XLr = -4;

// abertura dos fundamentos (antes do caderno): "doido pra eu começar a contar a história" → um botão "▶ HISTÓRIA"
// sendo clicado com pressa (cada clique em `clicks`); "antes disso" (`pauseAt`) → o botão vira pausa; "como eu construí
// esse Half-Life 3" → uma planta (blueprint) se desenha de `bpAt` até `bpDoneAt`; "não queria inventar coisas conforme a
// história precisasse" → linha da história (`lineAt`) com remendos colados (`patches`), riscados em `xAt`.
const FundIntro: React.FC<{ f: number; clicks: { at: number }[]; pauseAt: number; bpAt: number; bpDoneAt: number; lineAt: number; patches: { t: string; at: number }[]; xAt: number; endAt: number }> = ({ f, clicks, pauseAt, bpAt, bpDoneAt, lineAt, patches, xAt, endAt }) => {
  const out = 1 - P(f, endAt - 10, 10);
  const c0 = clicks[0]?.at ?? 1e9;
  const btnIn = lerp(f, 4, 18, 0, 1, E(Easing.out(Easing.back(1.6)))); // entra logo no começo (sem tela vazia)
  const btnOut = lerp(f, bpAt - 4, bpAt + 12, 0, 1, E(Easing.in(Easing.cubic)));
  const press = clicks.reduce((m, c) => {
    const d = f - c.at;
    return d >= 0 && d < 8 ? Math.max(m, 1 - d / 8) : m;
  }, 0);
  const paused = f >= pauseAt;
  const cur = lerp(f, c0 - 22, c0 - 2, 0, 1, E(Easing.out(Easing.cubic)));
  const curX = 1080 + (1 - cur) * 520;
  const curY = 560 + (1 - cur) * 300 + press * 6;
  const curO = P(f, c0 - 22, 6) * (1 - P(f, pauseAt + 4, 8));
  // planta
  const bpIn = lerp(f, bpAt, bpAt + 14, 0, 1, E(Easing.out(Easing.cubic)));
  const bpOut = lerp(f, lineAt - 8, lineAt + 8, 0, 1, E(Easing.in(Easing.cubic)));
  const pr = (k: number, n: number) => lerp(f, bpAt + 10 + ((bpDoneAt - bpAt - 10) * k) / n, bpAt + 10 + ((bpDoneAt - bpAt - 10) * (k + 1.4)) / n, 0, 1, C);
  const BP = "#cfe6ff";
  const pieces = [
    { d: "M 30 30 L 1210 30 L 1210 630 L 30 630 Z", w: 2 },
    { d: "M 300 140 A 190 190 0 1 1 299.9 140", w: 3 },
    { d: "M 210 180 L 262 180 L 410 500 M 318 312 L 205 500", w: 9 },
    { d: "M 640 120 L 880 120 L 880 210 L 640 210 Z M 940 120 L 1180 120 L 1180 210 L 940 210 Z", w: 2.5 },
    { d: "M 640 420 L 880 420 L 880 510 L 640 510 Z M 940 420 L 1180 420 L 1180 510 L 940 510 Z", w: 2.5 },
    { d: "M 490 300 L 640 165 M 490 360 L 640 465 M 880 165 L 940 165 M 880 465 L 940 465 M 760 210 L 760 420 M 1060 210 L 1060 420", w: 1.6 },
    { d: "M 640 575 L 1180 575 M 640 562 L 640 588 M 1180 562 L 1180 588 M 910 566 L 910 584", w: 1.4 },
  ];
  const boxLabels = [
    { t: "espaço", x: 760, y: 172, k: 3 },
    { t: "física", x: 1060, y: 172, k: 3 },
    { t: "ia", x: 760, y: 472, k: 4 },
    { t: "borealis", x: 1060, y: 472, k: 4 },
  ];
  // linha da história com remendos
  const lineP = lerp(f, lineAt, lineAt + 16, 0, 1, OUT);
  return (
    <AbsoluteFill style={{ opacity: out, pointerEvents: "none", transform: `translateY(${-(1 - out) * 260}px)` }}>
      {/* botão */}
      {btnIn > 0 && btnOut < 1 ? (
        <>
          <div style={{ position: "absolute", left: 960 - 300, top: 540 - 80, width: 600, height: 160, borderRadius: 80, border: `3px solid ${paused ? "rgba(242,240,247,0.45)" : ORANGE}`, background: "rgba(10,8,18,0.78)", boxShadow: paused ? "none" : `0 0 ${40 + press * 70}px rgba(255,138,31,${0.25 + press * 0.4})`, display: "flex", alignItems: "center", justifyContent: "center", gap: 30, transform: `translateY(${-btnOut * 260}px) scale(${(0.6 + 0.4 * btnIn) * (1 - 0.06 * press)})`, opacity: btnIn * (1 - btnOut) }}>
            <span style={{ fontFamily: FONT, fontWeight: 900, fontSize: 60, color: paused ? HL.dim : ORANGE }}>{paused ? "❚❚" : "▶"}</span>
            <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 64, letterSpacing: 3, color: paused ? HL.dim : HL.text }}>HISTÓRIA</span>
          </div>
          {clicks.map((c, k) => {
            const d = f - c.at;
            if (d < 0 || d > 14) return null;
            return <div key={k} style={{ position: "absolute", left: curX - 30 - d * 4, top: curY - 30 - d * 4, width: 60 + d * 8, height: 60 + d * 8, borderRadius: "50%", border: `3px solid ${ORANGE}`, opacity: 1 - d / 14 }} />;
          })}
          <svg width={60} height={70} style={{ position: "absolute", left: curX, top: curY, opacity: curO }}>
            <path d="M 2 2 L 2 50 L 14 39 L 23 60 L 31 56 L 22 36 L 38 36 Z" fill="#ffffff" stroke="#15121c" strokeWidth={3} strokeLinejoin="round" />
          </svg>
          <div style={{ position: "absolute", left: 0, right: 0, top: 660, textAlign: "center", ...mono(30, HL.dim, 10), opacity: P(f, pauseAt, 8) * (1 - btnOut) }}>antes disso…</div>
        </>
      ) : null}
      {/* planta do Half-Life 3 */}
      {bpIn > 0 && bpOut < 1 ? (
        <div style={{ position: "absolute", left: 340, top: 200, width: 1240, height: 660, transformOrigin: "50% 0", transform: `scaleY(${bpIn}) translateY(${-bpOut * 120}px)`, opacity: 1 - bpOut, borderRadius: 10, overflow: "hidden", background: "linear-gradient(160deg, #123672, #0b2350)", boxShadow: "0 40px 120px rgba(0,0,0,0.7)" }}>
          <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(207,230,255,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(207,230,255,0.10) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
          <svg width={1240} height={660} style={{ position: "absolute", inset: 0 }}>
            {pieces.map((pc, k) => (
              <path key={k} d={pc.d} pathLength={1} fill="none" stroke={BP} strokeWidth={pc.w} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="1" strokeDashoffset={1 - pr(k, pieces.length)} />
            ))}
          </svg>
          {boxLabels.map((b) => (
            <div key={b.t} style={{ position: "absolute", left: b.x - 120, top: b.y - 16, width: 240, textAlign: "center", ...mono(22, BP, 6), opacity: pr(b.k, pieces.length) }}>
              {b.t}
            </div>
          ))}
          <div style={{ position: "absolute", left: 60, top: 50, ...mono(22, BP, 8), opacity: P(f, bpDoneAt - 6, 10) }}>HALF-LIFE 3 · planta</div>
          <div style={{ position: "absolute", right: 70, bottom: 30, ...mono(16, BP, 5), opacity: P(f, bpDoneAt - 6, 10) * 0.7 }}>rev. 01 · borealis</div>
        </div>
      ) : null}
      {/* linha da história com remendos */}
      {f >= lineAt ? (
        <>
          <div style={{ position: "absolute", left: 220, width: 1480, top: 600, height: 5, background: "rgba(207,233,255,0.6)", transformOrigin: "left", transform: `scaleX(${lineP})` }} />
          <div style={{ position: "absolute", left: 220, top: 630, ...mono(22, HL.dim, 8), opacity: lineP }}>a história</div>
          {patches.map((pt, k) => {
            const pop = lerp(f, pt.at, pt.at + 7, 0, 1, E(Easing.out(Easing.back(2.2))));
            if (pop <= 0) return null;
            const strike = lerp(f, xAt + k * 5, xAt + k * 5 + 7, 0, 1, OUT);
            const x = 430 + k * 470;
            const rot = [-7, 5, -4][k % 3];
            return (
              <div key={k} style={{ position: "absolute", left: x - 140, top: 600 - 70, width: 280, height: 140, transform: `rotate(${rot}deg) scale(${1.5 - 0.5 * pop})`, opacity: Math.min(1, pop * 1.4) }}>
                <div style={{ position: "absolute", inset: 0, background: strike > 0.5 ? "#d9cf9c" : "#f4e27a", boxShadow: "0 14px 34px rgba(0,0,0,0.5)", filter: strike > 0.5 ? "saturate(0.4)" : undefined }} />
                <div style={{ position: "absolute", left: 110, top: -14, width: 60, height: 26, background: "rgba(230,230,220,0.55)", transform: "rotate(-4deg)" }} />
                <div style={{ position: "absolute", left: 0, right: 0, top: 36, textAlign: "center", fontFamily: HAND, fontSize: 46, color: INK }}>{pt.t}</div>
                <svg width={280} height={140} style={{ position: "absolute", inset: 0 }}>
                  <path d="M 20 30 L 260 110 M 260 30 L 20 110" pathLength={1} fill="none" stroke="#b3121b" strokeWidth={9} strokeLinecap="round" strokeDasharray="1" strokeDashoffset={1 - strike} />
                </svg>
              </div>
            );
          })}
          <div style={{ position: "absolute", left: 0, right: 0, top: 330, textAlign: "center", ...mono(28, "#ffd9b0", 8), opacity: P(f, patches[0]?.at ?? 1e9, 10) }}>inventar conforme a história precisa</div>
        </>
      ) : null}
    </AbsoluteFill>
  );
};

// 17 (2F) · os 23 fundamentos. Caderno com o índice (os nomeados escritos na palavra; os outros tarjados) e carimbo
// "JÁ EXISTEM". "Não vou jogar as 23 na sua cabeça": os cartões ESTOURAM do caderno em direção à câmera, girando,
// enchendo a tela; em `diffAt` ("vamos fazer diferente") o tempo congela, todos caem e só um flutua para o centro.
// Uma linha do tempo da história aparece embaixo; em `qAt` surge um "?" num momento dela; em `oneAt` o cartão vira
// (abre) e se liga ao "?"; as linhas da regra se escrevem. Em `bigQAt` a resposta puxa um fio vermelho até um cartão
// MAIOR atrás, onde um "?" enorme é desenhado à mão — e a borda de um ainda maior aparece atrás dele.
export const HLFundamentos: React.FC<{
  life: number;
  openAt?: number;
  items?: { t: string; at: number }[];
  lockAt?: number;
  flyAt?: number;
  diffAt?: number;
  storyAt?: number;
  qAt?: number;
  oneAt?: number;
  bigQAt?: number;
  clicks?: { at: number }[];
  pauseAt?: number;
  bpAt?: number;
  bpDoneAt?: number;
  lineAt?: number;
  patches?: { t: string; at: number }[];
  xAt?: number;
  glitches?: { at: number; k?: number }[];
}> = ({ life, openAt = 0, items = [], lockAt = 1e9, flyAt = 1e9, diffAt = 1e9, storyAt = 1e9, qAt = 1e9, oneAt = 1e9, bigQAt = 1e9, clicks = [], pauseAt = 1e9, bpAt = 1e9, bpDoneAt = 1e9, lineAt = 1e9, patches = [], xAt = 1e9, glitches = [] }) => {
  const f = useCurrentFrame();
  const o = fadeLife(f, life, 12, 12);
  const e = lerp(f, openAt, openAt + 20, 0, 1, E(Easing.out(Easing.cubic))); // o caderno desliza de baixo e assenta na mesa
  const book = 1 - P(f, flyAt + 4, 10);
  const named = new Map(items.map((it, i) => [i, it]));
  const rows = Array.from({ length: 23 }).map((_, i) => i);
  const stamp = lerp(f, lockAt, lockAt + 8, 0, 1, E(Easing.out(Easing.back(2))));
  const tf = Math.min(f, diffAt); // o tempo dos cartões congela em diffAt
  const drop = lerp(f, diffAt + 8, diffAt + 34, 0, 1, E(Easing.in(Easing.quad)));
  const KEEP = 6; // o cartão que fica (07)
  const center = lerp(f, diffAt + 10, diffAt + 34, 0, 1, E(Easing.inOut(Easing.cubic)));
  const flip = lerp(f, oneAt, oneAt + 18, 0, 1, E(Easing.inOut(Easing.cubic)));
  const big = lerp(f, bigQAt, bigQAt + 30, 0, 1, E(Easing.inOut(Easing.cubic)));
  const story = P(f, storyAt, 16) * (1 - big);
  const qs = lerp(f, qAt, qAt + 10, 0, 1, E(Easing.out(Easing.back(2))));
  const freeze = f >= diffAt && f < diffAt + 34;
  // pergunta maior: o próprio cartão sobe e alarga (vira a metade de cima de uma folha) e a metade de baixo DESDOBRA
  const u1 = lerp(f, bigQAt, bigQAt + 12, 0, 1, E(Easing.inOut(Easing.cubic)));
  const u2 = lerp(f, bigQAt + 10, bigQAt + 26, 0, 1, E(Easing.out(Easing.cubic)));
  const cardL = 960 - 330 + (460 - 630) * u1;
  const cardT = 540 - 230 + (200 - 310) * u1;
  const cardW = 660 + 340 * u1;
  const cardH = 400 - 60 * u1;
  const nUnnamed = (i: number) => i - items.length;
  return (
    <AbsoluteFill style={{ opacity: o }}>
      {/* no fim (antes do título) a tela FALHA: rajadas de glitch no próprio conteúdo */}
      <GlitchWrap f={f} amt={glitchAmt(f, glitches)} id="gfund" style={{ perspective: 1400 }}>
      {f < openAt + 12 ? <FundIntro f={f} clicks={clicks} pauseAt={pauseAt} bpAt={bpAt} bpDoneAt={bpDoneAt} lineAt={lineAt} patches={patches} xAt={xAt} endAt={openAt + 2} /> : null}
      {/* caderno */}
      <div style={{ position: "absolute", left: 960 - 760, top: 80, width: 1520, height: 920, borderRadius: 18, background: "linear-gradient(170deg, #eee6d2 0%, #e2d8bf 100%)", boxShadow: "0 50px 140px rgba(0,0,0,0.7), inset 0 0 120px rgba(120,90,40,0.25)", transform: `translateY(${(1 - e) * 760}px) rotateX(${8 + (1 - e) * 34}deg) rotateZ(${-1 - (1 - e) * 4}deg)`, opacity: book * Math.min(1, e * 3), overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 110, top: 0, bottom: 0, width: 2, background: "rgba(190,60,60,0.35)" }} />
        <div style={{ position: "absolute", left: 140, top: 24, fontFamily: HAND, fontSize: 60, color: "#b3121b" }}>23 fundamentos · regras internas</div>
        {rows.map((i) => {
          const col = i < 12 ? 0 : 1;
          const r = i < 12 ? i : i - 12;
          const it = named.get(i);
          const t0 = openAt + 10 + nUnnamed(i) * 4;
          const p = it ? P(f, it.at, 8) : P(f, t0, 3);
          return (
            <div key={i} style={{ position: "absolute", left: 140 + col * 700, top: 120 + r * 64, width: 660, height: 56, display: "flex", alignItems: "center", gap: 18, opacity: p }}>
              <span style={{ fontFamily: HAND, fontSize: 40, color: "#b3121b", width: 50 }}>{String(i + 1).padStart(2, "0")}</span>
              {it ? (
                <span style={{ fontFamily: HAND, fontSize: 50, color: INK }}>{it.t.slice(0, Math.max(0, Math.floor((f - it.at) / 0.8)))}</span>
              ) : (
                <span style={{ height: 22, width: 220 + ((i * 97) % 260), background: "repeating-linear-gradient(90deg, rgba(28,42,110,0.75) 0 18px, rgba(28,42,110,0.55) 18px 22px)", borderRadius: 4, transformOrigin: "left", transform: `scaleX(${lerp(f, t0, t0 + 5, 0, 1, C)})` }} />
              )}
            </div>
          );
        })}
        <div style={{ position: "absolute", right: 110, top: 380, padding: "14px 30px", border: "6px solid #b3121b", borderRadius: 14, fontFamily: FONT, fontWeight: 900, fontSize: 54, color: "#b3121b", letterSpacing: 4, transform: `rotate(-12deg) scale(${2 - stamp})`, opacity: stamp * 0.9 }}>JÁ EXISTEM</div>
      </div>
      {/* os 23 cartões estouram do caderno para a câmera */}
      {f >= flyAt
        ? rows.map((i) => {
            const t = Math.max(0, tf - flyAt - i * 1.4) / 30;
            if (t <= 0) return null;
            const a = rnd(i * 7) * Math.PI * 2;
            const spread = 0.35 + rnd(i * 3) * 0.65;
            // vêm para cima de você e ficam pairando perto (enchendo a tela) até o tempo congelar
            const ease = 1 - Math.exp(-t * 2.4);
            let x = Math.cos(a) * 900 * spread * ease + Math.sin(t * 1.3 + i) * 20;
            let y = Math.sin(a) * 520 * spread * ease - 40 + Math.cos(t * 1.1 + i) * 16;
            let z = -500 + (900 + rnd(i * 11) * 300) * ease;
            let rot = (rnd(i) - 0.5) * 90 * ease + Math.sin(t * 0.9 + i) * 12;
            let op = z > 700 ? Math.max(0, 1 - (z - 700) / 300) : 1;
            if (i === KEEP) {
              x *= 1 - center;
              y *= 1 - center;
              z = z * (1 - center);
              rot *= 1 - center;
              op = 1;
            } else if (drop > 0) {
              y += drop * 900;
              op *= 1 - drop;
            }
            if (i === KEEP && flip > 0) return null;
            return (
              <div key={i} style={{ position: "absolute", left: 960 - 130 + x, top: 540 - 85 + y, width: 260, height: 170, borderRadius: 14, background: "linear-gradient(170deg, #eee6d2, #ddd2b6)", boxShadow: "0 20px 50px rgba(0,0,0,0.5)", transform: `translateZ(${z}px) rotateZ(${rot}deg) rotateX(${rot * 0.3}deg)`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: HAND, fontSize: 52, color: "#b3121b", opacity: op, filter: freeze ? "saturate(0.3) brightness(0.85)" : undefined }}>
                {String(i + 1).padStart(2, "0")}
              </div>
            );
          })
        : null}
      {freeze ? <AbsoluteFill style={{ background: "rgba(150,200,255,0.06)", pointerEvents: "none" }} /> : null}
      {/* a linha do tempo da história, com o momento e a pergunta */}
      <div style={{ position: "absolute", left: 260, right: 260, top: 860, height: 4, background: "rgba(207,233,255,0.5)", opacity: story, transformOrigin: "left", transform: `scaleX(${P(f, storyAt, 20)})` }} />
      {[0.15, 0.35, 0.55, 0.78].map((u, k) => (
        <div key={k} style={{ position: "absolute", left: 260 + u * 1400 - 8, top: 854, width: 16, height: 16, borderRadius: 8, background: k === 2 ? ORANGE : ICE, opacity: story * P(f, storyAt + 6 + k * 4, 8) }} />
      ))}
      <div style={{ position: "absolute", left: 260 + 0.55 * 1400 - 30, top: 760, width: 60, textAlign: "center", fontFamily: HAND, fontSize: 80 * qs, color: ORANGE, opacity: story * (qs > 0 ? 1 : 0) }}>?</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 900, textAlign: "center", ...mono(20, HL.dim, 6), opacity: story }}>a história</div>
      {/* o cartão aberto (vira) e se desenvolve */}
      {flip > 0 ? (
        <div style={{ position: "absolute", left: cardL, top: cardT, width: cardW, height: cardH, borderRadius: u1 > 0.5 ? "20px 20px 0 0" : 18, background: "linear-gradient(170deg, #f2ead6, #e2d8bf)", boxShadow: "0 40px 100px rgba(0,0,0,0.6)", transform: `rotateY(${(1 - flip) * 90}deg)`, padding: "40px 50px", boxSizing: "border-box", zIndex: 2 }}>
          <div style={{ opacity: 1 - P(f, bigQAt, 6) }}>
          <div style={{ fontFamily: HAND, fontSize: 56, color: "#b3121b" }}>regra 07</div>
          {[0, 1, 2, 3].map((k) => {
            const w = lerp(f, oneAt + 14 + k * 8, oneAt + 26 + k * 8, 0, 1, C);
            return <div key={k} style={{ marginTop: 26, height: 18, width: `${(88 - k * 14) * w}%`, background: "repeating-linear-gradient(90deg, rgba(28,42,110,0.7) 0 16px, rgba(28,42,110,0.5) 16px 20px)", borderRadius: 4 }} />;
          })}
          <div style={{ position: "absolute", right: 40, bottom: 26, ...mono(18, INK, 4) }}>só o necessário para este momento</div>
          </div>
        </div>
      ) : null}
      {/* fio do cartão até o "?" da história */}
      {flip > 0.9 ? (
        <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <path d={`M ${960 - big * 420} ${540 + 170 - big * 60} C ${960 - big * 420} 760, ${260 + 0.55 * 1400} 700, ${260 + 0.55 * 1400} 780`} fill="none" stroke={ORANGE} strokeWidth={3} strokeDasharray="8 8" opacity={story * (1 - u1)} />
        </svg>
      ) : null}
      {/* a pergunta ainda maior: a metade de baixo da folha desdobra e um "?" enorme é desenhado à mão no centro */}
      {f >= bigQAt + 10 ? (
        <>
          <div style={{ position: "absolute", left: 460, top: 540, width: 1000, height: 340, transformOrigin: "50% 0", transform: `rotateX(${(1 - u2) * -178}deg)`, borderRadius: "0 0 20px 20px", background: u2 > 0.5 ? "linear-gradient(170deg, #ece3cc, #dcd1b4)" : "linear-gradient(170deg, #cfc4a6, #bdb193)", boxShadow: "0 50px 130px rgba(0,0,0,0.6)", zIndex: 2 }} />
          <div style={{ position: "absolute", left: 470, top: 538, width: 980, height: 4, background: "rgba(120,100,60,0.35)", opacity: u2, zIndex: 3 }} />
          <svg width={1000} height={680} viewBox="0 0 1000 680" style={{ position: "absolute", left: 460, top: 200, pointerEvents: "none", zIndex: 4 }}>
            <path d="M 395 230 C 395 110, 610 95, 620 225 C 630 325, 500 340, 500 445 L 500 490" pathLength={1} fill="none" stroke="#b3121b" strokeWidth={32} strokeLinecap="round" strokeDasharray="1" strokeDashoffset={1 - lerp(f, bigQAt + 26, bigQAt + 54, 0, 1, OUT)} />
            <circle cx={500} cy={580} r={24} fill="#b3121b" opacity={P(f, bigQAt + 56, 4)} />
          </svg>
        </>
      ) : null}
      </GlitchWrap>
    </AbsoluteFill>
  );
};

// virada para o TÍTULO (lane de cima): de `darkAt` a tela vai apagando com TREMULAÇÃO (quadros que piscam, faixas de
// interferência), nos últimos quadros fica preto total; em `hitAt` impacto grande: clarão âmbar, onda de choque e o
// preto some de uma vez (o título entra com glitch por baixo). As falhas vêm de `glitches` (as mesmas rajadas do conteúdo).
export const HLTitleBuild: React.FC<{ life: number; darkAt?: number; hitAt: number; blackAt?: number; glitches?: { at: number; k?: number }[] }> = ({ life, darkAt = 0, hitAt, blackAt, glitches = [] }) => {
  const f = useCurrentFrame();
  void life;
  const after = f - hitAt;
  const bAt = blackAt ?? hitAt - 24;
  const g = glitchAmt(f, glitches);
  const dk = lerp(f, darkAt, bAt, 0, 0.55, E(Easing.in(Easing.quad)));
  let veil = f >= bAt ? lerp(f, bAt, bAt + 4, 0.55, 1, C) : dk * (1 - 0.5 * g); // na rajada o glitch aparece por baixo
  if (after >= 0) veil = 0;
  const flash = after >= 0 ? interpolate(after, [0, 2, 16], [1, 0.8, 0], C) : 0;
  const ring = after >= 0 ? interpolate(after, [0, 24], [0, 1], { ...C, easing: Easing.out(Easing.cubic) }) : 0;
  // ruído digital nas rajadas: blocos ciano/magenta e uma linha de rasgo
  const blocks = g > 0.05 && f < bAt ? Array.from({ length: 7 }).map((_, k) => ({ x: rnd(f * 3 + k) * 1700, y: rnd(f * 5 + k * 7) * 1060, w: 60 + rnd(f * 11 + k) * 520 * g, h: 4 + rnd(f * 13 + k) * 34 * g, c: k % 3 === 0 ? "rgba(0,255,230,0.32)" : k % 3 === 1 ? "rgba(255,40,160,0.30)" : "rgba(255,255,255,0.16)" })) : [];
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill style={{ background: "#030206", opacity: veil }} />
      {blocks.map((b2, k) => (
        <div key={k} style={{ position: "absolute", left: b2.x, top: b2.y, width: b2.w, height: b2.h, background: b2.c, mixBlendMode: "screen" }} />
      ))}
      {blocks.length ? <div style={{ position: "absolute", left: 0, right: 0, top: rnd(f * 19) * 1080, height: 2, background: "rgba(255,255,255,0.5)", mixBlendMode: "screen" }} /> : null}
      {after >= 0 && after < 26 ? (
        <div style={{ position: "absolute", left: 960 - 1400 * ring, top: 540 - 1400 * ring, width: 2800 * ring, height: 2800 * ring, borderRadius: "50%", border: `${70 * (1 - ring) + 6}px solid rgba(255,190,120,${0.5 * (1 - ring)})`, filter: "blur(20px)" }} />
      ) : null}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, #fff6e8 0%, #ffbf70 40%, #8a3a0a 100%)", opacity: flash }} />
    </AbsoluteFill>
  );
};
