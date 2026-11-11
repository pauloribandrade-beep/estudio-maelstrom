import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { C, HL, OUT, lerp, rnd } from "./hl3";
import { BigLabel, Callout, E, ICE, ORANGE, W, H, Wire, add, box, cyl, fadeLife, mono, ring, xf } from "./hl3f";
import type { Cam, Layer, Seg, V } from "./hl3f";
import { CRATE_P, CY, Chip, FY, Flash, HOLE, HOLE_C, P, PATCH, RED, TABLE_P, XL, XR, ZB, ZF, bez, bezSegs, dashed, flame, fy, lerpV, polyAt, polyLen, roomCam, roomLayers, scr, shatter, soldier, turnTo } from "./hl3g";

// Bloco 2C (2026-10-02): a IA, o combate, as criaturas e a física reagindo ao espaço — tudo na MESMA sala em
// wireframe do 2B. Tempos em QUADROS relativos à cena.

// anda num caminho a uma velocidade (u/s); devolve posição, rumo e se já chegou
const walk = (path: V[], el: number, speed: number) => {
  const tot = polyLen(path);
  const d = Math.max(0, Math.min(tot, el * speed));
  const t = d / tot;
  const pos = polyAt(path, t);
  const a = polyAt(path, Math.min(1, t + 0.02));
  const b = polyAt(path, Math.max(0, t - 0.02));
  return { pos, ry: Math.atan2(a[0] - b[0], a[2] - b[2]), done: d >= tot - 1e-3, d, tot };
};
const PL: V = [1.7, FY, 1.9]; // o jogador (posição de sempre)
const player = (f: number, a = 1): Layer[] => [
  { segs: xf(soldier([0, 0, 0], 0, 0, 0, 0), { pos: PL, ry: Math.atan2(-4 - PL[0], -2.3 - PL[2]) }), color: ORANGE, width: 2.3, alpha: a },
  { segs: ring(add(PL, [0, 0.03, 0]), 0.7 + 0.06 * Math.sin(f / 4), "y", 24), color: ORANGE, width: 1.6, alpha: a * 0.8 },
];
// célula da malha de navegação (quadradinho no chão)
const cell = (x: number, z: number, s = 0.42): Seg[] => {
  const y = FY + 0.02;
  return [
    [[x - s, y, z - s], [x + s, y, z - s]],
    [[x + s, y, z - s], [x + s, y, z + s]],
    [[x + s, y, z + s], [x - s, y, z + s]],
    [[x - s, y, z + s], [x - s, y, z - s]],
  ];
};
const inBox = (x: number, z: number, c: V, w: number, d: number) => Math.abs(x - c[0]) < w / 2 + 0.4 && Math.abs(z - c[2]) < d / 2 + 0.4;

// 1 · "a IA precisa entender que o cenário mudou": a malha de navegação (grade vermelha no chão = onde a IA sabe
// andar) se refaz a cada mudança: o buraco abre (a malha passa por ele e um Combine usa a passagem) · a cobertura
// é destruída (o soldado corre para outra) · a rota é bloqueada (o caminho recalcula).
export const WFNavMesh: React.FC<{ life: number; meshAt?: number; holeAt?: number; useAt?: number; coverAt?: number; seekAt?: number; blockAt?: number; adaptAt?: number }> = ({
  life,
  meshAt = 0,
  holeAt = 1e9,
  useAt = 1e9,
  coverAt = 1e9,
  seekAt = 1e9,
  blockAt = 1e9,
  adaptAt = 1e9,
}) => {
  const f = useCurrentFrame();
  const o = fadeLife(f, life, 8, 10);
  const cam = roomCam(f, 0.55, 9.8);
  const crateGone = f >= coverAt;
  const beam = lerp(f, blockAt, blockAt + 12, 0, 1, E(Easing.in(Easing.quad)));
  const BEAM_C: V = [0.0, FY + 0.35, -2.2];
  // células: chão inteiro, menos debaixo de mesa/caixa/viga; o buraco libera a faixa de fora
  const cells: { x: number; z: number; out?: boolean }[] = [];
  for (let x = XL + 0.5; x < XR; x += 1)
    for (let z = ZB + 0.5; z < ZF; z += 1) {
      if (inBox(x, z, TABLE_P, 1.2, 0.7)) continue;
      if (!crateGone && inBox(x, z, CRATE_P, 1, 1)) continue;
      if (beam > 0.9 && Math.abs(z - BEAM_C[2]) < 0.6 && x > -2 && x < 2) continue;
      cells.push({ x, z });
    }
  const holeOpen = f >= holeAt;
  if (holeOpen) for (const z of [-2.8, -1.8]) for (const x of [-4.5, -5.5]) cells.push({ x, z, out: true });
  const scan = lerp(f, meshAt, meshAt + 24, 0, 1, OUT);
  const meshSegs: Seg[] = cells.filter((c) => (c.x - XL) / (XR - XL) <= scan * 1.05 || c.out).flatMap((c) => cell(c.x, c.z));
  // a malha "pisca" quando recalcula
  const recalc = [holeAt, coverAt, blockAt].some((t) => f >= t && f < t + 10 && (f - t) % 4 < 2);
  // soldado A: entra pelo buraco
  const pathA: V[] = [fy(-6.5, -2.3), fy(-4.0, -2.3), fy(-1.6, -1.2)];
  const wa = walk(pathA, Math.max(0, f - useAt) / 30, 1.7);
  // soldado B: atrás da caixa; a caixa estoura e ele corre para trás da mesa
  const bStart: V = [CRATE_P[0] - 0.2, FY, CRATE_P[2] - 1.1];
  const pathB: V[] = [bStart, fy(-1.9, 0.4), fy(TABLE_P[0] + 0.3, TABLE_P[2] - 0.9)];
  const wb = walk(pathB, Math.max(0, f - seekAt) / 30, 2.2);
  const bPos = f >= seekAt ? wb.pos : bStart;
  const bRy = f >= seekAt && !wb.done ? wb.ry : Math.atan2(PL[0] - bPos[0], PL[2] - bPos[2]);
  // soldado C: vem da porta até o jogador; a viga cai e a rota recalcula
  const C0: V = fy(0, -4.6);
  const routeOld: V[] = [C0, fy(0.3, -2.2), fy(1.2, 0.4), fy(PL[0] - 0.4, PL[2] - 0.6)];
  const routeNew: V[] = [C0, fy(2.6, -3.6), fy(2.8, -0.6), fy(PL[0] + 0.3, PL[2] - 0.7)];
  const adapt = P(f, adaptAt, 20);
  const crate = shatter(box(CRATE_P, 1, 1, 1), Math.max(0, f - coverAt), [0.3, 0.4, 0.8], 11);
  const base = roomLayers({ holeT: Math.max(0, f - holeAt), lock: 0, door: 1, crateA: 0 }, f);
  const layers: Layer[] = [
    ...base,
    { segs: meshSegs, color: RED, width: 1.1, alpha: (recalc ? 0.35 : 0.6) * P(f, meshAt, 10) },
    { segs: crate, color: crateGone ? "#ffd9b0" : ICE, width: 1.9, alpha: crateGone ? Math.max(0, 1 - (f - coverAt) / 40) : 1 },
    { segs: soldier(wa.pos, f >= useAt ? wa.ry : 0, wa.d * 5.2, wa.done ? 0 : 1, wa.done ? 1 : 0), color: RED, width: 2, alpha: f >= useAt ? 1 : 0 },
    { segs: soldier(bPos, bRy, wb.d * 5.2, f >= seekAt && !wb.done ? 1 : 0, f >= seekAt && !wb.done ? 0 : 1), color: RED, width: 2 },
    { segs: soldier(f >= adaptAt ? polyAt(routeNew, Math.min(1, (f - adaptAt) / 70)) : C0, f >= adaptAt ? Math.PI * 0.85 : Math.PI, f * 0.35, f >= adaptAt && f < adaptAt + 70 ? 1 : 0, 0), color: RED, width: 2 },
    { segs: dashed(routeOld), color: RED, width: 2.2, alpha: P(f, blockAt - 30, 12) * (1 - P(f, blockAt + 8, 10)) },
    { segs: dashed(routeNew), color: ORANGE, width: 2.4, reveal: adapt },
    { segs: xf(box([0, 0, 0], 4, 0.3, 0.35), { pos: [BEAM_C[0], CY - 0.2 - (CY - 0.2 - BEAM_C[1]) * beam, BEAM_C[2]], rz: 0.05 }), color: ORANGE, width: 2.2, alpha: f >= blockAt - 6 ? 1 : 0 },
    ...player(f),
  ];
  const hc = scr(HOLE_C, cam);
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <Wire cam={cam} fog={28} layers={layers} />
      <Flash f={f} at={holeAt} x={hc.x} y={hc.y} size={900} />
      <Chip text="ia · malha de navegação" p={P(f, meshAt + 6)} x={120} y={100} color={RED} />
      <Callout from={scr([-4.6, FY, -2.3], cam)} to={[150, 300]} text="passagem nova" sub="a malha passa pelo buraco" p={P(f, useAt, 16) * (1 - P(f, coverAt - 10))} color={RED} />
      <Callout from={scr(add(bPos, [0, 1.5, 0]), cam)} to={[300, 850]} text="cobertura destruída" sub="procura outra" p={P(f, coverAt, 14) * (1 - P(f, blockAt - 20))} color={RED} />
      <Callout from={scr([0, FY + 0.4, -2.2], cam)} to={[1300, 200]} text="rota bloqueada" sub="recalcula o caminho" p={P(f, blockAt + 4, 14)} color={ORANGE} />
    </AbsoluteFill>
  );
};

// 2 · "o combate também reage": vista mais alta; o jogador no centro. Cercar (dois soldados abrem em arco pelos
// lados) · recuar quando perde vantagem · usar a abertura que você criou (um sai pelo buraco e volta por fora) ·
// mudar de posição quando a rota fica perigosa (zona vermelha no chão).
const arcArrow = (a: V, b: V, lift: number, p: number): Seg[] => {
  const mid: V = add(lerpV(a, b, 0.5), [0, lift, 0]);
  const s = bezSegs(a, mid, b, p, 30);
  if (p > 0.95) {
    const tip = bez(a, mid, b, 1);
    const pre = bez(a, mid, b, 0.9);
    const dir: V = [tip[0] - pre[0], 0, tip[2] - pre[2]];
    const l = Math.hypot(dir[0], dir[2]) || 1;
    const nx = dir[0] / l;
    const nz = dir[2] / l;
    s.push([tip, [tip[0] - nx * 0.35 - nz * 0.22, tip[1], tip[2] - nz * 0.35 + nx * 0.22]], [tip, [tip[0] - nx * 0.35 + nz * 0.22, tip[1], tip[2] - nz * 0.35 - nx * 0.22]]);
  }
  return s;
};
export const WFTactics: React.FC<{ life: number; flankAt?: number; retreatAt?: number; useAt?: number; moveAt?: number; dangerAt?: number }> = ({ life, flankAt = 1e9, retreatAt = 1e9, useAt = 1e9, moveAt = 1e9, dangerAt = 1e9 }) => {
  const f = useCurrentFrame();
  const o = fadeLife(f, life, 8, 10);
  const c0 = roomCam(f, 0.5, 10.4);
  const cam: Cam = { ...c0, pos: add(c0.pos, [0, 3.2, 0]) };
  const g = (at: number, d = 40) => lerp(f, at, at + d, 0, 1, E(Easing.inOut(Easing.cubic)));
  // soldados
  const S1a: V = fy(-0.6, -2.6);
  const S1b: V = fy(-2.6, 1.6); // cerco pela esquerda
  const S2a: V = fy(1.0, -2.8);
  const S2b: V = fy(3.3, 0.2); // cerco pela direita
  const S3a: V = fy(0.2, -1.2);
  const S3b: V = fy(-0.2, -4.2); // recua
  const fl = g(flankAt);
  const re = g(retreatAt);
  const us = lerp(f, useAt, useAt + 70, 0, 1, C);
  const pathUse: V[] = [S1b, fy(-3.2, -1.2), fy(-4.6, -2.3), fy(-5.6, -0.4), fy(-4.6, 1.8)];
  const p1 = f >= useAt ? polyAt(pathUse, us) : lerpV(S1a, S1b, fl);
  const mv = g(moveAt, 30);
  const p2 = lerpV(lerpV(S2a, S2b, fl), fy(3.0, -2.6), mv);
  const p3 = lerpV(S3a, S3b, re);
  const face = (p: V) => Math.atan2(PL[0] - p[0], PL[2] - p[2]);
  // zona perigosa (área do chão hachurada) sobre a rota da direita
  const dz: Seg[] = [];
  const dp = P(f, dangerAt - 6, 12);
  for (let k = -1.4; k <= 1.4; k += 0.28) dz.push([fy(2.2 + k, -1.6), fy(3.6 + k, -0.2)]);
  const layers: Layer[] = [
    ...roomLayers({ holeT: 300, lock: 0, door: 1, tower: 1, crate: [1.25, 0, -0.4] }, f).map((L) => ({ ...L, alpha: (L.alpha ?? 1) * 0.75 })),
    ...player(f),
    { segs: soldier(p1, face(p1), f * 0.4, fl > 0 && fl < 1 ? 1 : f >= useAt && us < 1 ? 1 : 0, 1), color: RED, width: 2 },
    { segs: soldier(p2, face(p2), f * 0.4, (fl > 0 && fl < 1) || (mv > 0 && mv < 1) ? 1 : 0, 1), color: RED, width: 2 },
    { segs: soldier(p3, face(p3), f * 0.4, re > 0 && re < 1 ? 1 : 0, 1), color: RED, width: 2 },
    { segs: arcArrow(S1a, S1b, 0.05, P(f, flankAt, 18)), color: RED, width: 2.4, alpha: 1 - P(f, retreatAt, 10) * 0.6 },
    { segs: arcArrow(S2a, S2b, 0.05, P(f, flankAt + 4, 18)), color: RED, width: 2.4, alpha: 1 - P(f, retreatAt, 10) * 0.6 },
    { segs: arcArrow(S3a, S3b, 0.05, P(f, retreatAt, 18)), color: ICE, width: 2.4 },
    { segs: dashed(pathUse), color: ORANGE, width: 2.2, reveal: P(f, useAt, 30) },
    { segs: dz, color: RED, width: 1.6, alpha: dp * (0.6 + 0.4 * Math.sin(f / 4)) },
    { segs: arcArrow(lerpV(S2a, S2b, 1), fy(3.0, -2.6), 0.05, P(f, moveAt, 16)), color: ORANGE, width: 2.4 },
  ];
  const pt = (p: V) => scr(add(p, [0, 2.0, 0]), cam);
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <Wire cam={cam} fog={30} layers={layers} />
      <Chip text="combate · reage ao que você faz" p={P(f, 0, 14)} x={120} y={100} color={RED} />
      {[
        { t: "cercar", p: pt(S1b), at: flankAt, end: retreatAt },
        { t: "recuar", p: pt(S3b), at: retreatAt, end: useAt },
        { t: "usar a sua abertura", p: pt(fy(-5.4, -0.6)), at: useAt, end: moveAt },
        { t: "rota perigosa", p: pt(fy(2.9, -0.9)), at: dangerAt, end: 1e9 },
      ].map((l) => (
        <div key={l.t} style={{ position: "absolute", left: l.p.x - 160, top: l.p.y - 40, width: 320, textAlign: "center", ...mono(22, l.t === "recuar" ? ICE : l.t === "usar a sua abertura" ? ORANGE : RED, 6), opacity: P(f, l.at, 10) * (1 - P(f, l.end + 20, 12)), textShadow: "0 2px 14px rgba(0,0,0,0.95)" }}>
          {l.t}
        </div>
      ))}
    </AbsoluteFill>
  );
};

// headcrab em wireframe: cúpula achatada + 4 patas (como no jogo: 2 da frente longas, arqueadas para a frente, com a
// ponta em garra; 2 de trás curtas, apoiando) e a boca em bico na frente; `ph` anima as patas (pares alternados)
const crab = (p: V, ry: number, ph: number, hop = 0, s = 1): Seg[] => {
  const segs: Seg[] = [];
  for (let k = 0; k < 4; k++) {
    const yy = 0.18 + k * 0.07;
    const r = 0.36 * Math.cos((k / 4) * 1.2);
    segs.push(...xf(ring([0, 0, 0], r, "y", 14), { pos: [0, yy, 0], scale: 1 }).map(([a, b]) => [[a[0], a[1], a[2] * 1.25], [b[0], b[1], b[2] * 1.25]] as Seg));
  }
  // boca/bico embaixo da frente
  segs.push([[-0.12, 0.17, 0.42], [0, 0.1, 0.56]], [[0.12, 0.17, 0.42], [0, 0.1, 0.56]], [[-0.12, 0.17, 0.42], [0.12, 0.17, 0.42]]);
  // [x do ombro, z do ombro, joelho, ponta, fase]
  const legs: { sh: V; kn: V; tip: V; sg: number; front: boolean }[] = [
    { sh: [-0.2, 0.22, 0.32], kn: [-0.36, 0.34, 0.62], tip: [-0.3, 0.0, 0.98], sg: 1, front: true },
    { sh: [0.2, 0.22, 0.32], kn: [0.36, 0.34, 0.62], tip: [0.3, 0.0, 0.98], sg: -1, front: true },
    { sh: [-0.26, 0.18, -0.28], kn: [-0.5, 0.3, -0.42], tip: [-0.56, 0.0, -0.6], sg: -1, front: false },
    { sh: [0.26, 0.18, -0.28], kn: [0.5, 0.3, -0.42], tip: [0.56, 0.0, -0.6], sg: 1, front: false },
  ];
  legs.forEach(({ sh, kn, tip, sg, front }) => {
    const sw = Math.sin(ph + (sg > 0 ? 0 : Math.PI)) * (front ? 0.1 : 0.06);
    const k2: V = [kn[0], kn[1] + Math.max(0, sw) * 0.6, kn[2] + sw];
    const t2: V = [tip[0], tip[1] + Math.max(0, sw) * 0.5, tip[2] + sw * 1.4];
    segs.push([sh, k2], [k2, t2]);
    if (front) segs.push([t2, [t2[0] * 0.85, t2[1] + 0.07, t2[2] - 0.07]]); // garra
  });
  return xf(segs, { pos: [p[0], p[1] + hop, p[2]], ry, scale: s });
};

// 3 · headcrabs reagem por instinto: fogem do fogo · vão para o escuro · entram nas frestas · saem do buraco que
// você abriu. Em `splitAt` ("cada tipo de inimigo reage diferente"): tela dividida, o mesmo estouro — o soldado
// procura cobertura, o headcrab foge pulando.
export const WFCrabs: React.FC<{ life: number; crabAt?: number; fireAt?: number; darkAt?: number; crackAt?: number; holeAt?: number; splitAt?: number }> = ({
  life,
  crabAt = 0,
  fireAt = 1e9,
  darkAt = 1e9,
  crackAt = 1e9,
  holeAt = 1e9,
  splitAt = 1e9,
}) => {
  const f = useCurrentFrame();
  const o = fadeLife(f, life, 8, 10);
  const cam = roomCam(f, 0.6, 9.2);
  const split = P(f, splitAt - 4, 14);
  // fogo no meio da sala; o headcrab 1 foge dele
  const FIRE: V = fy(0.4, 0.2);
  const c1a: V = fy(0.9, 0.9);
  const c1b: V = fy(2.8, 2.2);
  const flee = lerp(f, fireAt + 4, fireAt + 26, 0, 1, E(Easing.out(Easing.cubic)));
  const c1 = lerpV(c1a, c1b, flee);
  // escuro: canto do fundo à direita com o chão apagado; headcrab 2 vai até lá
  const DARK: V = fy(3.2, -4.2);
  const c2 = lerpV(fy(1.2, -1.6), DARK, lerp(f, darkAt, darkAt + 30, 0, 1, E(Easing.inOut(Easing.cubic))));
  // fresta na parede direita: headcrab 3 entra nela
  const CRACK: V = [XR - 0.05, FY + 0.1, -1.0];
  const c3 = lerpV(fy(2.6, -0.4), CRACK, lerp(f, crackAt, crackAt + 26, 0, 1, E(Easing.in(Easing.quad))));
  const c3a = 1 - P(f, crackAt + 24, 6);
  // buraco: headcrab 4 pula de dentro do buraco que você abriu
  const jt = Math.max(0, f - holeAt) / 30;
  const c4 = add(lerpV(HOLE_C.map((v, i) => (i === 1 ? FY : v)) as V, fy(-1.8, -1.4), Math.min(1, jt / 0.6)), [0, 0, 0]);
  const hop4 = jt > 0 && jt < 0.6 ? Math.sin((jt / 0.6) * Math.PI) * 1.0 : 0;
  const darkCells: Seg[] = [];
  for (let k = 0; k < 7; k++) darkCells.push([fy(2.2 + k * 0.25, -5), fy(2.2 + k * 0.25, -3.2)]);
  const crackSegs: Seg[] = [
    [[XR - 0.02, FY, -1.25], [XR - 0.02, FY + 0.5, -1.05]],
    [[XR - 0.02, FY + 0.5, -1.05], [XR - 0.02, FY + 0.95, -1.2]],
    [[XR - 0.02, FY, -0.75], [XR - 0.02, FY + 0.5, -0.92]],
    [[XR - 0.02, FY + 0.5, -0.92], [XR - 0.02, FY + 0.95, -0.85]],
  ];
  const single: Layer[] = [
    ...roomLayers({ holeT: 300, lock: 0, door: 1, tower: 1, crate: [1.25, 0, -0.4] }, f).map((L) => ({ ...L, alpha: (L.alpha ?? 1) * 0.75 })),
    { segs: flame(FIRE, f, 1.6), color: ORANGE, width: 2.2, alpha: P(f, fireAt - 6, 8) },
    { segs: darkCells, color: "#3a3550", width: 6, alpha: P(f, darkAt - 6, 10) },
    { segs: crackSegs, color: "#ffd9b0", width: 2, alpha: P(f, crackAt - 8, 8) },
    { segs: crab(c1, flee > 0 && flee < 1 ? Math.atan2(c1b[0] - c1a[0], c1b[2] - c1a[2]) : -2.4, f * 0.9, 0), color: "#e9f7c9", width: 1.8, alpha: P(f, crabAt, 10) },
    { segs: crab(c2, Math.atan2(DARK[0] - 1.2, DARK[2] + 1.6), f * 0.9, 0), color: "#e9f7c9", width: 1.8, alpha: P(f, darkAt - 10, 10) * (1 - 0.6 * P(f, darkAt + 30, 20)) },
    { segs: crab(c3, Math.PI / 2, f * 1.1, 0, 0.9), color: "#e9f7c9", width: 1.8, alpha: P(f, crackAt - 10, 10) * c3a },
    { segs: crab(c4, 2.2, f * 1.2, hop4), color: "#e9f7c9", width: 1.8, alpha: f >= holeAt ? 1 : 0 },
  ];
  // tela dividida: o mesmo estouro, duas reações
  const halfCam = (side: number): Cam => {
    const c = roomCam(f, 0.6, 11);
    return { ...c, f: 800 };
  };
  const bt = Math.max(0, f - splitAt - 10) / 30;
  const BLAST: V = fy(0.2, -0.6);
  const solP = lerpV(fy(-1.0, -1.6), fy(CRATE_P[0] + 1.25, CRATE_P[2] - 1.0), Math.min(1, bt * 1.4));
  const crP = add(lerpV(fy(1.0, -1.4), fy(3.2, 1.8), Math.min(1, bt * 1.2)), [0, Math.sin(Math.min(1, bt * 1.2) * Math.PI) * 1.2, 0]);
  const mini = (layers: Layer[], x: number, label: string, col: string, side: number) => (
    <div style={{ position: "absolute", left: x, top: 150, width: 860, height: 700, borderRadius: 24, overflow: "hidden", border: "1px solid rgba(255,255,255,0.18)", background: "rgba(5,4,10,0.6)", opacity: split, transform: `translateY(${(1 - split) * 30}px)` }}>
      <div style={{ position: "absolute", left: -530, top: -190, width: W, height: H, transform: "scale(0.66)", transformOrigin: "960px 540px" }}>
        <Wire cam={halfCam(side)} fog={30} layers={layers} />
      </div>
      <div style={{ position: "absolute", left: 24, top: 18, ...mono(22, col, 6) }}>{label}</div>
    </div>
  );
  const blastRing: Layer = { segs: bt > 0 ? ring(BLAST, 0.3 + bt * 3, "y", 30) : [], color: "#ffd9b0", width: 2, alpha: Math.max(0, 1 - bt) };
  const roomMini = roomLayers({ holeT: 300, lock: 0, door: 1, crate: [1.25, 0, -0.4] }, f).map((L) => ({ ...L, alpha: (L.alpha ?? 1) * 0.6 }));
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <AbsoluteFill style={{ opacity: 1 - split }}>
        <Wire cam={cam} fog={28} layers={single} />
        <Chip text="headcrabs · instinto" p={P(f, crabAt + 6)} x={120} y={100} color="#e9f7c9" />
        {[
          { t: "foge do fogo", p: scr(add(c1, [0, 0.9, 0]), cam), at: fireAt, end: darkAt },
          { t: "espaços escuros", p: scr(add(DARK, [0, 1.0, 0]), cam), at: darkAt, end: crackAt },
          { t: "frestas", p: scr([XR, FY + 1.3, -1.0], cam), at: crackAt, end: holeAt },
          { t: "sai do buraco que você abriu", p: scr(add(HOLE_C, [0, 1.3, 0]), cam), at: holeAt, end: splitAt },
        ].map((l) => (
          <div key={l.t} style={{ position: "absolute", left: l.p.x - 200, top: l.p.y - 40, width: 400, textAlign: "center", ...mono(22, "#e9f7c9", 6), opacity: P(f, l.at, 10) * (1 - P(f, l.end, 10)), textShadow: "0 2px 14px rgba(0,0,0,0.95)" }}>
            {l.t}
          </div>
        ))}
      </AbsoluteFill>
      {split > 0 ? (
        <>
          {mini([...roomMini, blastRing, { segs: soldier(solP, Math.atan2(BLAST[0] - solP[0], BLAST[2] - solP[2]), bt * 9, bt > 0 && bt < 0.7 ? 1 : 0, bt > 0.7 ? 1 : 0), color: RED, width: 2.2 }], 80, "soldado · procura cobertura", RED, -1)}
          {mini([...roomMini, blastRing, { segs: crab(crP, Math.atan2(3.2 - 1.0, 1.8 + 1.4), f * 1.2, 0, 1.2), color: "#e9f7c9", width: 2.2 }], 980, "headcrab · foge pulando", "#e9f7c9", 1)}
          <BigLabel text="o mesmo mundo, reações diferentes" p={P(f, splitAt + 8, 14)} y={900} size={54} />
        </>
      ) : null}
    </AbsoluteFill>
  );
};

// 4 · a física na mesma lógica: peso · material · explosão · objetos · estruturas — cada um acende num objeto e
// faz a sua ação; "não só como você atravessa" (a rota muda) "mas como o combate acontece" (o soldado perde a
// cobertura).
export const WFPhysicsRules: React.FC<{ life: number; pesoAt?: number; matAt?: number; expAt?: number; objAt?: number; estAt?: number; travAt?: number; combAt?: number }> = ({
  life,
  pesoAt = 1e9,
  matAt = 1e9,
  expAt = 1e9,
  objAt = 1e9,
  estAt = 1e9,
  travAt = 1e9,
  combAt = 1e9,
}) => {
  const f = useCurrentFrame();
  const o = fadeLife(f, life, 8, 10);
  const cam = roomCam(f, 0.66, 9.6);
  const sink = lerp(f, pesoAt + 6, pesoAt + 16, 0, 0.25, E(Easing.in(Easing.quad)));
  const BAR: V = fy(-2.2, -0.6);
  const bt = Math.max(0, f - expAt);
  const barrel = bt > 0 ? shatter(cyl([BAR[0], FY + 0.55, BAR[2]], 0.4, 1.1, "y", 16, 4), bt, [0, 0.8, 0.6], 21) : cyl([BAR[0], FY + 0.55, BAR[2]], 0.4, 1.1, "y", 16, 4);
  // objetos espalhados (latas/caixinhas) que voam no estouro
  const small: Seg[] = [];
  [
    [-1.2, -1.2],
    [-2.8, 0.6],
    [-1.6, 0.9],
    [-3.0, -1.6],
  ].forEach(([x, z], k) => {
    const t = Math.max(0, f - expAt - 2) / 30;
    const d: V = [(x - BAR[0]) * 1.4, 2.2, (z - BAR[2]) * 1.4];
    const p: V = [x + d[0] * t, Math.max(FY + 0.15, FY + 0.15 + d[1] * t - 4.9 * t * t), z + d[2] * t];
    small.push(...xf(box([0, 0, 0], 0.3, 0.3, 0.3), { pos: p, rx: t * 7, rz: t * 5 + k }));
  });
  const st: Parameters<typeof roomLayers>[0] = { holeT: 300, lock: 0, door: 1, tower: lerp(f, estAt, estAt + 24, 0, 1, C), crate: [1.25, -sink, -0.4], hot: { crate: P(f, pesoAt), patch: P(f, matAt), tower: P(f, estAt) } };
  const solP: V = fy(1.0, -2.4);
  const lost = P(f, combAt, 12);
  const layers: Layer[] = [
    ...roomLayers(st, f),
    { segs: barrel, color: bt > 0 ? "#ffd9b0" : ORANGE, width: 2, alpha: bt > 0 ? Math.max(0, 1 - bt / 40) : P(f, expAt - 20, 10) },
    { segs: small, color: ICE, width: 1.6, alpha: P(f, objAt - 30, 10) },
    { segs: dashed([fy(PL[0], PL[2]), fy(2.6, -0.8), fy(2.7, -2.6)]), color: ICE, width: 2.2, reveal: P(f, travAt - 10, 14), alpha: 1 - P(f, travAt + 10, 10) * 0.7 },
    { segs: dashed([fy(PL[0], PL[2]), fy(0.2, 0.4), fy(-1.0, -1.4), fy(-0.6, -3.6)]), color: ORANGE, width: 2.4, reveal: P(f, travAt + 8, 20) },
    { segs: soldier(solP, Math.atan2(PL[0] - solP[0], PL[2] - solP[2]), 0, 0, 1), color: RED, width: 2, alpha: P(f, travAt + 20, 10) },
    { segs: xf(box([0, 0, 0], 1.2, 0.9, 0.2), { pos: [solP[0], FY + 0.45, solP[2] + 0.7] }), color: RED, width: 1.8, alpha: P(f, travAt + 20, 10) * (1 - lost) },
    ...player(f),
  ];
  const bc = scr([BAR[0], FY + 0.6, BAR[2]], cam);
  const tags: { t: string; p: V; at: number; color: string }[] = [
    { t: "peso", p: [CRATE_P[0] + 1.25, -0.1, CRATE_P[2] - 0.4], at: pesoAt, color: ORANGE },
    { t: "material", p: [XL, 0.6, (HOLE.u0 + HOLE.u1) / 2], at: matAt, color: ORANGE },
    { t: "explosão", p: [BAR[0], FY + 1.6, BAR[2]], at: expAt, color: "#ffd9b0" },
    { t: "objetos", p: [-2.0, FY + 1.3, 0.2], at: objAt, color: ICE },
    { t: "estruturas", p: [3.1, 1.4, -2.4], at: estAt, color: ORANGE },
  ];
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <Wire cam={cam} fog={28} layers={layers} />
      <Flash f={f} at={expAt} x={bc.x} y={bc.y} size={900} />
      <Chip text="física · mesma lógica" p={P(f, 0, 14)} x={120} y={100} color={ORANGE} />
      {tags.map((t) => {
        const q = scr(t.p, cam);
        return (
          <div key={t.t} style={{ position: "absolute", left: q.x - 120, top: q.y - 30, width: 240, textAlign: "center", ...mono(22, t.color, 6), opacity: P(f, t.at, 8) * (1 - P(f, travAt - 6, 10)), textShadow: "0 2px 14px rgba(0,0,0,0.95)" }}>
            {t.t}
          </div>
        );
      })}
      <div style={{ position: "absolute", left: 120, top: 150, ...mono(22, ICE, 6), opacity: P(f, travAt, 10) }}>muda como você atravessa</div>
      <div style={{ position: "absolute", left: 120, top: 190, ...mono(22, RED, 6), opacity: P(f, combAt, 10) }}>e como o combate acontece</div>
    </AbsoluteFill>
  );
};

// 5 · "e quando você coloca mudança de espaço-tempo em cima disso": a sala (com tudo o que já aconteceu nela) volta
// a torcer em volta do jogador; em `partAt` ("ele vira parte da gameplay") a sala inteira vira laranja.
export const WFWarpPart: React.FC<{ life: number; warpAt?: number; placeAt?: number; partAt?: number }> = ({ life, warpAt = 0, placeAt = 1e9, partAt = 1e9 }) => {
  const f = useCurrentFrame();
  const o = fadeLife(f, life, 8, 10);
  const cam = roomCam(f, 0.62, 11.4);
  const w = lerp(f, warpAt, warpAt + 34, 0, 1, E(Easing.inOut(Easing.cubic)));
  const tt = f / 30;
  const def = (q: V): V => {
    const dx = q[0] - PL[0];
    const dz = q[2] - PL[2];
    const r = Math.hypot(dx, dz);
    const ang = w * (0.22 * Math.sin(tt * 1.3 + r * 0.6) + 0.14 * Math.sin((q[1] - FY) * 1.1 + tt * 1.9)) + w * 0.35 * Math.sin(Math.max(0, f - warpAt) * 0.03);
    const c = Math.cos(ang);
    const s = Math.sin(ang);
    return [PL[0] + dx * c - dz * s, q[1] + w * 0.22 * Math.sin(q[0] * 0.8 + tt * 1.7) * ((q[1] - FY) / (CY - FY) + 0.3), PL[2] + dx * s + dz * c];
  };
  const part = P(f, partAt, 14);
  const L = roomLayers({ holeT: 300, lock: 0, door: 1, tower: 1, crate: [1.25, -0.25, -0.4], color: part > 0.5 ? "#ffd9b0" : ICE, accent: ORANGE }, f).map((l) => ({ ...l, segs: l.segs.map(([a, b]) => [def(a), def(b)] as Seg), color: part > 0.5 ? ORANGE : l.color }));
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <Wire cam={cam} fog={28} layers={[...L, ...player(f)]} />
      <div style={{ position: "absolute", left: 120, top: 100, ...mono(24, ICE, 8), opacity: P(f, warpAt, 12) * (1 - part) }}>+ espaço-tempo</div>
      <BigLabel text="só um lugar onde a gameplay acontece" p={P(f, placeAt, 12) * (1 - part)} y={880} size={52} strike={P(f, partAt - 4, 10)} />
      <BigLabel text="parte da gameplay" p={part} y={880} size={78} color={ORANGE} />
    </AbsoluteFill>
  );
};

// 6 · "o meu Half-Life 3 perguntaria: e se o próprio mundo for?": um feixe laranja (estilo Gravity Gun) vem da
// câmera e PUXA a sala inteira, que sobe, gira e vem para perto.
export const WFWorldPull: React.FC<{ life: number; pullAt?: number }> = ({ life, pullAt = 10 }) => {
  const f = useCurrentFrame();
  const o = fadeLife(f, life, 8, 10);
  const pull = lerp(f, pullAt, pullAt + 50, 0, 1, E(Easing.inOut(Easing.cubic)));
  const cam = roomCam(f, 0.62, 12);
  const wob = Math.sin(f / 5) * 0.03 * pull;
  const L = roomLayers({ holeT: 300, lock: 0, door: 1, tower: 1, crate: [1.25, 0, -0.4] }, f).map((l) => ({
    ...l,
    segs: xf(l.segs, { pivot: [0, 0, -1], pos: [0, 1.4 * pull, 2.6 * pull], ry: -0.5 * pull + wob, rx: 0.25 * pull, scale: 1 - 0.25 * pull }),
    color: pull > 0.2 ? "#ffe0c2" : l.color,
  }));
  // feixe: linhas da base da tela até a sala, tremendo
  const beam: Seg[] = [];
  const src: V = add(cam.pos, [0.6, -1.6, -1.2]);
  for (let k = 0; k < 9; k++) {
    const tgt: V = [(rnd(k * 3) - 0.5) * 6, 1.4 * pull + (rnd(k * 5) - 0.3) * 2.5, -1 + 2.6 * pull + (rnd(k * 7) - 0.5) * 4];
    const mid: V = add(lerpV(src, tgt, 0.5), [Math.sin(f / 2 + k) * 0.3, Math.cos(f / 3 + k) * 0.3, 0]);
    beam.push(...bezSegs(src, mid, tgt, 1, 16));
  }
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <Wire cam={cam} fog={30} layers={[...L, { segs: beam, color: ORANGE, width: 1.6, alpha: P(f, pullAt - 4, 8) * (0.6 + 0.4 * Math.sin(f / 2)) }]} />
      <div style={{ position: "absolute", left: 120, top: 100, ...mono(24, ORANGE, 8), opacity: P(f, 0, 12) }}>half-life 3</div>
      <BigLabel text="e se o próprio mundo for?" p={P(f, pullAt + 20, 14)} y={880} size={70} color={ORANGE} />
    </AbsoluteFill>
  );
};

// 7 · "que lugar justificaria um jogo inteiro funcionando desse jeito?": a sala encolhe até virar um ponto de luz.
export const WFShrink: React.FC<{ life: number; shrinkAt?: number; qAt?: number }> = ({ life, shrinkAt = 10, qAt = 1e9 }) => {
  const f = useCurrentFrame();
  const o = fadeLife(f, life, 8, 14);
  const s = lerp(f, shrinkAt, shrinkAt + 60, 1, 0.02, E(Easing.inOut(Easing.cubic)));
  const cam = roomCam(f, 0.62 + f * 0.004, 10.4);
  const L = roomLayers({ holeT: 300, lock: 0, door: 1, tower: 1, crate: [1.25, 0, -0.4] }, f).map((l) => ({ ...l, segs: xf(l.segs, { pivot: [0, -0.2, -1], scale: s }) }));
  const dot = 1 - P(f, shrinkAt + 50, 10) * 0;
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <Wire cam={cam} fog={30} layers={L} />
      {s < 0.1 ? <div style={{ position: "absolute", left: scr([0, -0.2, -1], cam).x - 60, top: scr([0, -0.2, -1], cam).y - 60, width: 120, height: 120, borderRadius: "50%", background: "radial-gradient(closest-side, rgba(255,240,220,0.9), rgba(255,170,90,0))", opacity: dot * (0.7 + 0.3 * Math.sin(f / 5)) }} /> : null}
      <div style={{ position: "absolute", left: 0, right: 0, top: 740, textAlign: "center", padding: "0 200px", fontFamily: "inherit" }}>
        <BigLabel text="que lugar justificaria um jogo inteiro assim?" p={P(f, qAt, 16)} y={0} size={62} />
      </div>
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: interpolate(f, [life - 20, life], [0, 1], C), background: HL.bg }} />
    </AbsoluteFill>
  );
};
