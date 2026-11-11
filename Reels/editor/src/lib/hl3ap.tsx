// =================================================================================================
// HL3 · APERTURE NO BOREALIS (08/10/2026, pedidos do Paulo). Tudo em POV no motor de hl3rx (XView), sem footage:
//  · HLAPhaseRooms (37:59): corredor destruído → a porta abre → entra → a MESMA sala décadas antes, funcionando, com
//    funcionários da Aperture correndo (crachás) → a frente do tempo varre a sala: abandonada → varre de novo: destruída,
//    com o grupo (Alyx, Mossman) ainda dentro.
//  · HLATestChamber (40:21): a câmara de teste vista DE CIMA, da sala de observação; a IA ainda roda o teste; o
//    protocolo falha em cada coisa real da sala; os painéis caem e mostram o casco do navio.
//  · HLACaveVideo (40:35): os arquivos do sistema → as gravações do Cave Johnson são VÍDEO (retrato real); projetos,
//    imagens e dados de tecnologia Combine (campos/pontes de energia) → antes da invasão → do futuro para o passado →
//    COPIEM TUDO.
// =================================================================================================
import React, { useMemo } from "react";
import { AbsoluteFill, Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { FONT, MONO } from "./overlays";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { makeBorealis } from "./hl3r9s";
import { SfxCtx } from "./sfx-ctx";
import { C, Clip, HL, rnd } from "./hl3";
import { FilmLook } from "./hl3r";
import { Eye, Hud, V3, proj } from "./hl3rf";
import { AdvisorArt, FlagBadge, HLXPod, PodRingsView, RGB, SilhouetteAt, XF, XL, XMarker, XView, buildCoastRoom, buildPodRoom, buildShipHall, buildShipHall2, fadeIO, keys, mk, quadMatrix3d } from "./hl3rx";

const RED = "#ff5d4d";
const AMB = "#ffb22e";
const ICE = "#9fe6ff";
const GREEN = "#8dffa8";
const CREAM = "#ffe2b0";
const APT = "#f2f0ea";
const ORANGE = HL.orange;
const TXT = HL.text;
const P = (f: number, at: number, d = 12) => interpolate(f, [at, at + d], [0, 1], { ...C, easing: Easing.out(Easing.cubic) });
type PR = Record<string, number> & { life: number };
const at = (p: PR, k: string) => (p[k] as number | undefined) ?? 1e9;
const CL = "videos/hl3_M01_R/clips/";
const sh = (c: RGB, k: number): RGB => [c[0] * k, c[1] * k, c[2] * k];

// ================================================================================================= 37:59 as fases da sala
const DOOR_Y = 16;
const ROOM: [number, number, number, number] = [-7, 7, DOOR_Y, 32];
// o corredor: "dead" = destruído (presente), "lit" = o mesmo corredor aceso numa outra fase (o lampejo)
const buildCorr = (lit: boolean): XF[] => {
  const g = mk();
  const wall: RGB = lit ? [196, 200, 204] : [64, 70, 74];
  g.room(-2.2, 2.2, 0, DOOR_Y, 3.0, wall, lit ? [120, 124, 128] : [46, 48, 50], lit ? [170, 174, 178] : [30, 32, 34], [{ side: "N", c: 0, w: 2.2, h: 2.6 }], 2);
  for (let y = 4; y < DOOR_Y; y += 4) {
    g.box(-2.2, y, 0, 0.35, 0.3, 3.0, sh(wall, 0.7));
    g.box(1.85, y, 0, 0.35, 0.3, 3.0, sh(wall, 0.7));
  }
  // batente da porta + faixa de aviso
  g.box(-1.45, DOOR_Y - 0.12, 0, 0.35, 0.24, 2.9, [86, 92, 96]);
  g.box(1.1, DOOR_Y - 0.12, 0, 0.35, 0.24, 2.9, [86, 92, 96]);
  g.box(-1.45, DOOR_Y - 0.12, 2.6, 2.9, 0.24, 0.3, [86, 92, 96]);
  g.box(-0.9, DOOR_Y - 0.2, 2.66, 1.8, 0.06, 0.12, [255, 178, 46], { emit: lit ? 1 : 0.55 });
  if (lit) {
    for (let y = 2; y < DOOR_Y; y += 3) g.box(-0.5, y, 2.95, 1.0, 0.5, 0.04, [255, 244, 225], { emit: 1 });
    g.box(-2.19, 6, 1.2, 0.02, 3, 0.7, [120, 200, 230], { emit: 0.5 });
  } else {
    // entulho, placas do teto caídas, gelo nas paredes
    for (let k = 0; k < 14; k++) g.box(-1.9 + rnd(k) * 3.4, 2 + rnd(k * 3) * 12.5, 0, 0.3 + rnd(k * 5) * 0.7, 0.3 + rnd(k * 7) * 0.6, 0.12 + rnd(k * 11) * 0.45, [58 + rnd(k) * 20, 56, 52]);
    g.quad([-2.1, 7, 3.0], [-0.9, 7, 3.0], [-0.9, 8.0, 1.9], [-2.1, 8.0, 2.1], [52, 56, 58], [0, -0.7, 0.7]);
    g.quad([1.0, 11.4, 3.0], [2.1, 11.4, 3.0], [2.1, 12.2, 1.4], [1.0, 12.2, 1.6], [50, 54, 56], [0, -0.7, 0.7]);
    for (let k = 0; k < 8; k++) {
      const y = 1 + k * 1.9;
      g.box(k % 2 ? 2.17 : -2.2, y, 0.4 + rnd(k) * 1.4, 0.03, 0.6 + rnd(k * 3) * 0.9, 0.5 + rnd(k * 5) * 0.8, [150, 190, 210]);
    }
    g.box(-0.3, 5, 2.95, 0.6, 0.4, 0.04, [255, 230, 190], { emit: 0.6, tag: "flick" });
  }
  return g.F;
};
// a sala nas três fases: 0 = décadas antes (funcionando), 1 = abandonada, 2 = presente (destruída e congelada)
const buildRoom = (era: 0 | 1 | 2): XF[] => {
  const g = mk();
  const [x0, x1, y0, y1] = ROOM;
  const wall: RGB = era === 0 ? [226, 228, 230] : era === 1 ? [148, 144, 134] : [70, 78, 84];
  const floor: RGB = era === 0 ? [150, 152, 156] : era === 1 ? [92, 88, 82] : [54, 58, 62];
  const ceil: RGB = era === 0 ? [205, 208, 210] : era === 1 ? [106, 104, 98] : [38, 42, 46];
  g.room(x0, x1, y0, y1, 4.2, wall, floor, ceil, [{ side: "S", c: 0, w: 2.2, h: 2.6 }], 2);
  // armários de laboratório nas laterais
  for (let y = y0 + 2; y < y1 - 1; y += 3) {
    g.box(x0, y, 0, 0.7, 2.2, 2.3, era === 0 ? [200, 204, 208] : era === 1 ? [120, 116, 108] : [60, 64, 68]);
    g.box(x1 - 0.7, y, 0, 0.7, 2.2, 2.3, era === 0 ? [200, 204, 208] : era === 1 ? [120, 116, 108] : [60, 64, 68]);
    if (era === 0) {
      g.box(x0 + 0.71, y + 0.4, 1.6, 0.02, 0.3, 0.12, [120, 255, 170], { emit: 0.9 });
      g.box(x1 - 0.73, y + 1.2, 1.6, 0.02, 0.3, 0.12, [120, 220, 255], { emit: 0.9 });
    }
  }
  // as mesas com monitores (deslocadas/viradas na abandonada, esmagadas na destruída)
  const desks: [number, number][] = [[-6.0, 20.5], [-3.4, 20.5], [1.0, 20.5], [3.6, 20.5], [-6.0, 25.6], [1.0, 25.6]]; // corredor do meio livre (a câmera anda por ele)
  desks.forEach(([dx, dy], i) => {
    const jx = era === 1 ? (rnd(i * 3) - 0.5) * 1.2 : era === 2 ? (rnd(i * 5) - 0.5) * 0.8 : 0;
    const jy = era === 1 ? (rnd(i * 7) - 0.5) * 0.9 : era === 2 ? (rnd(i * 9) - 0.5) * 0.6 : 0;
    const x = dx + jx;
    const y = dy + jy;
    if (era === 1 && i === 4) {
      g.box(x, y, 0, 2.4, 0.2, 1.1, [120, 112, 100]); // a mesa virada
      return;
    }
    const h = era === 2 ? 0.34 + rnd(i) * 0.2 : 0.76;
    g.box(x, y, 0, 2.4, 1.1, h, era === 0 ? [176, 180, 184] : era === 1 ? [112, 106, 96] : [62, 66, 70]);
    if (era === 2) return;
    g.box(x + 0.8, y + 0.35, h, 0.8, 0.14, 0.55, era === 0 ? [40, 44, 48] : [34, 34, 32]);
    g.quad([x + 0.85, y + 0.33, h + 0.06], [x + 1.55, y + 0.33, h + 0.06], [x + 1.55, y + 0.33, h + 0.5], [x + 0.85, y + 0.33, h + 0.5], era === 0 ? [120, 220, 255] : [24, 26, 28], [0, -1, 0], era === 0 ? { emit: 0.95 } : undefined);
  });
  if (era === 0) {
    for (const x of [-4, 0, 4]) for (const y of [18, 22, 26, 30]) g.box(x - 0.8, y - 0.4, 4.17, 1.6, 0.8, 0.03, [255, 248, 236], { emit: 1 });
    // o letreiro no fundo
    g.box(-3.2, y1 - 0.06, 2.6, 6.4, 0.04, 1.0, [30, 34, 38]);
  }
  if (era === 1) {
    for (let k = 0; k < 26; k++) g.quad([-6 + rnd(k) * 12, 17 + rnd(k * 3) * 14, 0.01], [-5.6 + rnd(k) * 12, 17 + rnd(k * 3) * 14, 0.01], [-5.6 + rnd(k) * 12, 17.3 + rnd(k * 3) * 14, 0.01], [-6 + rnd(k) * 12, 17.3 + rnd(k * 3) * 14, 0.01], [196, 190, 172], [0, 0, 1]);
    g.quad([-4.8, 22, 4.2], [-3.2, 22, 4.2], [-3.2, 23.2, 2.4], [-4.8, 23.2, 2.6], [120, 118, 110], [0, -0.7, 0.7]);
    g.box(-0.8, 26, 4.17, 1.6, 0.8, 0.03, [255, 236, 200], { emit: 0.35 });
    g.box(-3.2, y1 - 0.06, 2.6, 6.4, 0.04, 1.0, [60, 58, 54]);
  }
  if (era === 2) {
    for (let k = 0; k < 22; k++) g.box((k % 2 ? 1 : -1) * (1.6 + rnd(k * 2) * 4.6), 17 + rnd(k * 4) * 14, 0, 0.4 + rnd(k) * 1.0, 0.4 + rnd(k * 6) * 0.9, 0.2 + rnd(k * 8) * 0.7, [66 + rnd(k) * 18, 64, 62]);
    for (let k = 0; k < 9; k++) g.prism((k % 2 ? 1 : -1) * (2.2 + rnd(k * 13) * 4), 18 + rnd(k * 17) * 12, 0, 0.5 + rnd(k) * 0.9, 0.12 + rnd(k * 3) * 0.14, 5, [150, 205, 228], undefined, rnd(k));
    for (let k = 0; k < 10; k++) g.quad([-6.9 + rnd(k) * 13, 17 + rnd(k * 5) * 14, 0.02], [-5.9 + rnd(k) * 13, 17 + rnd(k * 5) * 14, 0.02], [-5.9 + rnd(k) * 13, 18.2 + rnd(k * 5) * 14, 0.02], [-6.9 + rnd(k) * 13, 18.2 + rnd(k * 5) * 14, 0.02], [140, 180, 200], [0, 0, 1]);
    g.quad([-6.9, 21, 4.2], [-1, 21, 4.2], [-1, 23, 0.8], [-6.9, 23, 1.6], [56, 60, 64], [0, -0.7, 0.7]);
    g.quad([1.5, 27, 4.2], [6.9, 27, 4.2], [6.9, 28.6, 1.0], [1.5, 28.6, 1.4], [52, 56, 60], [0, -0.7, 0.7]);
    g.box(5.9, 17.2, 3.2, 0.3, 0.3, 0.3, [255, 60, 40], { emit: 0.9 });
  }
  return g.F;
};
// as portas da sala (duas folhas que correm para os lados)
const doorLeaves = (open: number): XF[] => {
  const g = mk();
  const s = open * 1.12;
  g.box(-1.12 - s, DOOR_Y - 0.06, 0, 1.12, 0.12, 2.6, [96, 102, 106]);
  g.box(0 + s, DOOR_Y - 0.06, 0, 1.12, 0.12, 2.6, [96, 102, 106]);
  g.box(-1.0 - s, DOOR_Y - 0.08, 1.2, 0.9, 0.02, 0.1, [255, 178, 46], { emit: 0.6 });
  g.box(0.1 + s, DOOR_Y - 0.08, 1.2, 0.9, 0.02, 0.1, [255, 178, 46], { emit: 0.6 });
  return g.F;
};
// os funcionários: crachás correndo pela sala (sempre crachá, nunca gente desenhada)
const RUNNERS = [
  { y: 22.6, x0: -6.3, x1: 6.3, t0: 0, v: 0.085 },
  { y: 26.8, x0: 6.3, x1: -6.3, t0: 9, v: 0.07 },
  { y: 28.9, x0: -6.3, x1: 6.3, t0: 22, v: 0.095 },
  { y: 23.9, x0: 6.3, x1: -6.3, t0: 34, v: 0.08 },
];
const runnerPos = (r: (typeof RUNNERS)[number], f: number, from: number) => {
  const span = Math.abs(r.x1 - r.x0);
  const d = ((f - from - r.t0) * r.v) % (span + 3);
  if (f - from - r.t0 < 0 || d > span) return null;
  const dir = Math.sign(r.x1 - r.x0);
  return { x: r.x0 + dir * d, dir };
};
const RunnerBadge: React.FC<{ e: Eye; x: number; y: number; dir: number; f: number; o: number }> = ({ e, x, y, dir, f, o }) => {
  const base = proj(e, [x, y, 0]);
  const top = proj(e, [x, y, 1.7]);
  if (!base || !top) return null;
  const s = Math.max(0.4, Math.min(2, 6 / base.d));
  const k = Math.max(0.55, Math.min(1.0, s * 0.85));
  const bob = Math.abs(Math.sin(f / 2.2)) * 6 * s;
  const tail = [0.5, 1.1, 1.8].map((dx) => proj(e, [x - dir * dx, y, 0.9]));
  return (
    <g opacity={o}>
      {tail.map((q, i) => (q ? <line key={i} x1={q.x} y1={q.y - 20 * s} x2={q.x - dir * 50 * s} y2={q.y - 20 * s} stroke="rgba(242,240,234,0.5)" strokeWidth={2 + 2 * (2 - i)} opacity={0.5 - i * 0.14} /> : null))}
      <ellipse cx={base.x} cy={base.y} rx={26 * s} ry={7 * s} fill="none" stroke={APT} strokeWidth={1.6} />
      <line x1={base.x} y1={base.y} x2={top.x} y2={top.y - bob} stroke={APT} strokeWidth={2} />
      <FlagBadge cx={top.x} by={top.y - bob} k={k} label="FUNCIONÁRIO" col={APT} f={f} photo="hl3silh/aperture_func.svg" sub="CORRENDO" />
    </g>
  );
};
export const HLAPhaseRooms: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [hardAt, notAt, destAt, doorAt, decAt, staffAt, aheadAt, abandAt, againAt, insideAt] = ["hardAt", "notAt", "destAt", "doorAt", "decAt", "staffAt", "aheadAt", "abandAt", "againAt", "insideAt"].map((k) => at(p, k));
  const CORR = useMemo(() => buildCorr(false), []);
  const CORR_LIT = useMemo(() => buildCorr(true), []);
  const R = useMemo(() => [buildRoom(0), buildRoom(1), buildRoom(2)], []);
  const open = P(f, doorAt, 20);
  const walk = (a: number, b: number) => (f > a && f < b ? 1 : 0);
  const y = keys(f, [
    [0, 1.0],
    [destAt - 10, 2.6],
    [doorAt - 4, 12.6],
    [doorAt + 20, 13.0],
    [decAt + 6, 15.2],
    [decAt + 46, 19.2],
    [aheadAt, 19.6],
    [aheadAt + 50, 22.6],
    [life, 23.4],
  ]);
  const moving = walk(destAt - 10, doorAt - 4) || walk(doorAt + 20, decAt + 46) || walk(aheadAt, aheadAt + 50);
  const yaw = keys(f, [
    [0, 0.05],
    [destAt, -0.06],
    [doorAt - 10, 0],
    [staffAt - 4, 0],
    [staffAt + 34, -0.24],
    [aheadAt - 6, -0.08],
    [abandAt + 10, 0.06],
    [insideAt - 10, 0.0],
    [insideAt + 20, 0.2],
    [life, 0.22],
  ]);
  const e: Eye = { x: 0.08 * Math.sin(f / 50), y, z: 1.65 + (moving ? 0.035 * Math.sin(f / 3.6) : 0), yaw, pitch: -0.05, F: 960 };
  const inCorr = e.y < DOOR_Y + 0.2;
  // a frente do tempo: faixa que varre a tela da esquerda para a direita; à esquerda dela, a fase nova
  const band = (t0: number) => interpolate(f, [t0, t0 + 26], [-120, 2040], { ...C, easing: Easing.inOut(Easing.cubic) });
  const b1 = band(abandAt);
  const b2 = band(againAt);
  const b3 = band(insideAt + 4);
  // o lampejo do corredor em "não permanece no mesmo momento"
  const flashCorr = f >= notAt && f < notAt + 26 && [0, 1, 0, 0, 1, 1, 0, 1, 1, 1, 0, 0, 1].includes(Math.floor((f - notAt) / 2)) ? 1 : 0;
  const flick = rnd(Math.floor(f / 3)) > 0.82 ? 0.15 : 1;
  const lightsCorr: XL[] = [{ x: 0, y: 5, z: 2.6, col: [255, 230, 190], k: 0.35 * flick, r: 6 }];
  const lightsEra = (era: number): XL[] =>
    era === 0
      ? [
          { x: 0, y: 20, z: 3.8, col: [255, 248, 236], k: 0.6, r: 10 },
          { x: 0, y: 28, z: 3.8, col: [255, 248, 236], k: 0.55, r: 10 },
        ]
      : era === 1
        ? [{ x: 0, y: 26, z: 3.6, col: [255, 226, 180], k: 0.22, r: 8 }]
        : [
            { x: 0, y: 24, z: 3, col: [140, 190, 230], k: 0.3, r: 10 },
            { x: 5.9, y: 17.3, z: 3.2, col: [255, 60, 40], k: 0.3 * (0.6 + 0.4 * Math.sin(f / 5)), r: 7 },
          ];
  const ambEra = [0.32, 0.08, 0.1];
  const flashEra = [0.35, 0.95, 0.95];
  const sign = (era: number) => {
    const q = proj(e, [0, ROOM[3] - 0.1, 3.1]);
    if (!q || era === 2) return null;
    const s = 960 / q.d;
    return (
      <g opacity={era === 0 ? 1 : 0.55}>
        <circle cx={q.x - s * 2.5} cy={q.y} r={s * 0.38} fill="none" stroke={era === 0 ? "#f2f6f8" : "#8a8478"} strokeWidth={s * 0.08} />
        <text x={q.x - s * 1.9} y={q.y + s * 0.16} fill={era === 0 ? "#f2f6f8" : "#8a8478"} fontFamily={FONT} fontWeight={700} fontSize={s * 0.46} letterSpacing={s * 0.02}>{era === 0 ? "APERTURE SCIENCE" : "APERT RE SCI NCE"}</text>
      </g>
    );
  };
  const eraView = (era: 0 | 1 | 2) => (
    <AbsoluteFill>
      <XView e={e} faces={[...R[era], ...(inCorr ? [] : doorLeaves(open))]} lights={lightsEra(era)} flash={flashEra[era]} amb={ambEra[era]} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {sign(era)}
        {era === 0 && f >= staffAt - 10
          ? RUNNERS.map((r, i) => {
              const q = runnerPos(r, f, staffAt - 10);
              return q ? <RunnerBadge key={i} e={e} x={q.x} y={r.y} dir={q.dir} f={f + i * 7} o={1} /> : null;
            })
          : null}
      </svg>
    </AbsoluteFill>
  );
  // fase visível de cada lado da faixa
  const left = f >= againAt ? 2 : f >= abandAt ? 1 : 0;
  const right = f >= againAt ? 1 : 0;
  const bx = f >= againAt ? b2 : b1;
  const eraName = (era: number) => (era === 0 ? "DÉCADAS ANTES · FUNCIONANDO" : era === 1 ? "ANOS DEPOIS · ABANDONADA" : "PRESENTE · DESTRUÍDA");
  const shownEra = !inCorr || open > 0.5 ? (f >= againAt + 13 ? 2 : f >= abandAt + 13 ? 1 : 0) : -1;
  const groupOn = P(f, decAt + 40, 12);
  const ring = f >= insideAt ? ((f - insideAt) % 30) / 30 : 0;
  // a terceira mudança (o grupo dentro): a sala treme entre a destruída e a abandonada por um instante
  const tremor = f >= insideAt + 4 && f < insideAt + 30 && b3 > -100 && b3 < 2040;
  return (
    <AbsoluteFill style={{ background: "#020304", overflow: "hidden" }}>
      {/* a sala (atrás do corredor enquanto estamos nele) */}
      {f < abandAt ? (
        eraView(0)
      ) : (
        <>
          {eraView(right as 0 | 1)}
          <div style={{ position: "absolute", inset: 0, clipPath: `inset(0px ${Math.max(0, 1920 - bx)}px 0px 0px)` }}>{eraView(left as 1 | 2)}</div>
        </>
      )}
      {tremor ? <div style={{ position: "absolute", inset: 0, clipPath: `inset(0px 0px 0px ${Math.max(0, b3)}px)`, opacity: Math.floor(f / 2) % 2 ? 0.6 : 0.2 }}>{eraView(1)}</div> : null}
      {/* o corredor por cima, com a porta */}
      {inCorr ? (
        <AbsoluteFill>
          <XView e={e} faces={[...(flashCorr ? CORR_LIT : CORR), ...doorLeaves(open)]} lights={flashCorr ? [{ x: 0, y: 8, z: 2.6, col: [255, 244, 225], k: 0.7, r: 12 }] : lightsCorr} flash={flashCorr ? 0.3 : 0.95} amb={flashCorr ? 0.3 : 0.07} seam={flashCorr ? "rgba(159,230,255,0.7)" : "rgba(0,0,0,0.32)"} />
          {/* a luz da outra época vazando pela porta */}
          {open > 0
            ? (() => {
                const q = proj(e, [0, DOOR_Y, 1.3]);
                if (!q) return null;
                const s = 960 / q.d;
                return <div style={{ position: "absolute", left: q.x - s * 2.2, top: q.y - s * 1.8, width: s * 4.4, height: s * 3.6, background: `radial-gradient(ellipse at 50% 55%, rgba(255,250,235,${0.35 * open}) 0%, rgba(255,250,235,0) 70%)`, pointerEvents: "none" }} />;
              })()
            : null}
        </AbsoluteFill>
      ) : null}
      {flashCorr ? <AbsoluteFill style={{ background: "rgba(159,230,255,0.07)" }} /> : null}
      {/* a faixa da frente do tempo */}
      {[b1, b2, b3].map((x, i) =>
        x > -110 && x < 2030 && (i < 2 || tremor) ? (
          <div key={i} style={{ position: "absolute", left: x - 70, top: 0, width: 140, height: 1080, background: "linear-gradient(90deg, rgba(159,230,255,0) 0%, rgba(159,230,255,0.28) 42%, rgba(232,250,255,0.95) 50%, rgba(159,230,255,0.28) 58%, rgba(159,230,255,0) 100%)", mixBlendMode: "screen", pointerEvents: "none" }} />
        ) : null,
      )}
      {/* o grupo dentro da sala (em todas as fases) */}
      {groupOn > 0 ? (
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          {[
            { x: -1.4, dy: 3.4, label: "ALYX", col: ORANGE },
            { x: 1.5, dy: 2.8, label: "MOSSMAN", col: ICE },
          ].map((m, i) => {
            const my = Math.min(ROOM[3] - 2, e.y + m.dy);
            const q = proj(e, [m.x, my, 0.02]);
            return (
              <g key={i}>
                {ring > 0 && q ? <ellipse cx={q.x} cy={q.y} rx={(30 + 70 * ring) * Math.min(1.8, 5 / q.d)} ry={(8 + 18 * ring) * Math.min(1.8, 5 / q.d)} fill="none" stroke={m.col} strokeWidth={2} opacity={1 - ring} /> : null}
                <XMarker e={e} x={m.x} y={my} label={m.label} col={m.col} f={f} o={groupOn} sub={f >= insideAt ? "AINDA DENTRO" : undefined} />
              </g>
            );
          })}
        </svg>
      ) : null}
      {/* a época da sala */}
      {shownEra >= 0 ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 120, display: "flex", justifyContent: "center", pointerEvents: "none" }}>
          <div key={shownEra} style={{ padding: "10px 26px", borderRadius: 10, background: "rgba(4,8,10,0.72)", border: `1.5px solid ${shownEra === 0 ? APT : shownEra === 1 ? CREAM : RED}`, fontFamily: MONO, letterSpacing: 5, textAlign: "center", opacity: P(f, shownEra === 0 ? decAt : shownEra === 1 ? abandAt + 13 : againAt + 13, 8) }}>
            <div style={{ fontSize: 14, color: "rgba(242,240,247,0.65)" }}>BOREALIS · SETOR DA APERTURE · A MESMA SALA</div>
            <div style={{ fontSize: 24, marginTop: 4, color: shownEra === 0 ? APT : shownEra === 1 ? CREAM : RED }}>{eraName(shownEra)}</div>
          </div>
        </div>
      ) : null}
      <Hud
        f={f}
        yaw={e.yaw}
        eye={e}
        blips={groupOn > 0 ? [{ x: -1.4, y: e.y + 3.4 }, { x: 1.5, y: e.y + 2.8 }] : []}
        msg={f >= hardAt && f < notAt ? "ROTA · RECALCULANDO" : f >= notAt && f < destAt ? "SETOR · FASE INSTÁVEL" : f >= doorAt - 10 && f < decAt ? "[E] ABRIR" : f >= insideAt ? "A SALA MUDOU · GRUPO DENTRO" : undefined}
        msgCol={f >= insideAt ? RED : AMB}
      />
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// prende um elemento HTML w×h num retângulo 3D (cantos: sup-esq, sup-dir, inf-dir, inf-esq) com perspectiva
const Pinned: React.FC<{ e: Eye; w: number; h: number; corners: [V3, V3, V3, V3]; o?: number; children: React.ReactNode }> = ({ e, w, h, corners, o = 1, children }) => {
  const q = corners.map((v) => proj(e, v));
  if (q.some((v) => !v || v.d < 0.2) || o <= 0) return null;
  const m = quadMatrix3d(w, h, q.map((v) => [v!.x, v!.y]) as [number, number][]);
  if (!m) return null;
  return <div style={{ position: "absolute", left: 0, top: 0, width: w, height: h, transformOrigin: "0 0", transform: m, opacity: o }}>{children}</div>;
};
// chamada presa a um ponto 3D real: anel no alvo → linha → rótulo
const Call: React.FC<{ e: Eye; pt: V3; f: number; from: number; until?: number; text: string; sub?: string; col: string; dx: number; dy: number }> = ({ e, pt, f, from, until = 1e9, text, sub, col, dx, dy }) => {
  if (f < from || f >= until) return null;
  const q = proj(e, pt);
  if (!q) return null;
  const o = P(f, from, 8) * (1 - P(f, until - 8, 8));
  const k = P(f, from, 12);
  const end = dx >= 0 ? "start" : "end";
  const lx = q.x + dx + (dx >= 0 ? 10 : -10);
  const ly = q.y + dy;
  return (
    <g opacity={o}>
      <circle cx={q.x} cy={q.y} r={12 + 3 * Math.sin(f / 6)} fill="none" stroke={col} strokeWidth={2.2} />
      <circle cx={q.x} cy={q.y} r={4} fill={col} />
      <line x1={q.x} y1={q.y} x2={q.x + dx * k} y2={q.y + dy * k} stroke={col} strokeWidth={1.8} />
      <text x={lx} y={ly - 6} textAnchor={end} fill={col} fontFamily={MONO} fontSize={22} letterSpacing={4} opacity={k} style={{ paintOrder: "stroke", stroke: "rgba(0,0,0,0.85)", strokeWidth: 5 }}>{text}</text>
      {sub ? <text x={lx} y={ly + 22} textAnchor={end} fill="rgba(242,240,247,0.85)" fontFamily={MONO} fontSize={15} letterSpacing={2} opacity={k} style={{ paintOrder: "stroke", stroke: "rgba(0,0,0,0.85)", strokeWidth: 4 }}>{sub}</text> : null}
    </g>
  );
};

// ================================================================================================= 40:21 a câmara de teste
// vista pela câmera de observação da IA, de dentro da sala de controle no alto (vidro, caixilhos, o console com a tela):
// a câmara branca de painéis, o botão, o tubo do cubo, a saída com a grade; o Gordon (crachá) entra pela porta lateral; a
// tela da IA: TESTE EM ANDAMENTO · NORMAL → SUJEITO DETECTADO → PROTOCOLO 7 (liberar cubo · botão · abrir saída) → cada
// passo FALHA numa coisa real da sala (o cubo emperra no tubo torto, a saída abre para o gelo do casco) → os painéis caem
// e mostram o casco enferrujado do navio; a sala adernada. No fim a câmera mergulha na tela da IA (→ os arquivos).
const CH: [number, number, number, number] = [-7, 7, 6, 22];
const CH_H = 9;
const PANEL_W = 2;
const PANEL_H = 2.25;
type Panel = { p: [V3, V3, V3, V3]; n: V3; dark: boolean; fall: number; out: V3 };
const buildPanels = (): Panel[] => {
  const ps: Panel[] = [];
  const [x0, x1, y0, y1] = CH;
  const FALL: Record<string, number> = { "N-1-2": 0, "N-5-3": 5, "E-2-2": 2, "E-5-1": 9, "W-3-2": 4, "W-6-3": 11, "N-3-3": 7, "E-6-3": 13 };
  const add = (key: string, p: [V3, V3, V3, V3], n: V3, dark: boolean) => ps.push({ p, n, dark, fall: FALL[key] ?? -1, out: n });
  for (let i = 0; i < (x1 - x0) / PANEL_W; i++)
    for (let r = 0; r < CH_H / PANEL_H; r++) {
      const x = x0 + i * PANEL_W;
      const z = r * PANEL_H;
      if (Math.abs(x + 1 - 4) < 1.2 && z < 2.6) continue; // a saída
      const yy = y1 - 0.05;
      add(`N-${i}-${r}`, [[x + PANEL_W - 0.04, yy, z + 0.04], [x + 0.04, yy, z + 0.04], [x + 0.04, yy, z + PANEL_H - 0.04], [x + PANEL_W - 0.04, yy, z + PANEL_H - 0.04]], [0, -1, 0], (i + r) % 3 === 0);
    }
  for (let i = 0; i < (y1 - y0) / PANEL_W; i++)
    for (let r = 0; r < CH_H / PANEL_H; r++) {
      const y = y0 + i * PANEL_W;
      const z = r * PANEL_H;
      // a porta de entrada (oeste) fica sem painel
      if (!(Math.abs(y + 1 - 9) < 1.2 && z < 2.6)) add(`W-${i}-${r}`, [[x0 + 0.05, y + 0.04, z + 0.04], [x0 + 0.05, y + PANEL_W - 0.04, z + 0.04], [x0 + 0.05, y + PANEL_W - 0.04, z + PANEL_H - 0.04], [x0 + 0.05, y + 0.04, z + PANEL_H - 0.04]], [1, 0, 0], (i * 2 + r) % 4 === 1);
      add(`E-${i}-${r}`, [[x1 - 0.05, y + PANEL_W - 0.04, z + 0.04], [x1 - 0.05, y + 0.04, z + 0.04], [x1 - 0.05, y + 0.04, z + PANEL_H - 0.04], [x1 - 0.05, y + PANEL_W - 0.04, z + PANEL_H - 0.04]], [-1, 0, 0], (i + r * 2) % 4 === 2);
    }
  return ps;
};
const buildChamber = (): XF[] => {
  const g = mk();
  const [x0, x1, y0, y1] = CH;
  // por trás dos painéis: o casco do navio (aço enferrujado, nervuras)
  // teto (as paredes são os próprios painéis; atrás deles, só onde um cai, aparece o casco — ver casco())
  g.quad([x0, y0, CH_H], [x0, y1, CH_H], [x1, y1, CH_H], [x1, y0, CH_H], [150, 154, 158], [0, 0, -1]);
  // piso: placas cinza claras com juntas
  for (let x = x0; x < x1; x += 2) for (let y = y0; y < y1; y += 2) g.quad([x + 0.03, y + 0.03, 0.01], [x + 1.97, y + 0.03, 0.01], [x + 1.97, y + 1.97, 0.01], [x + 0.03, y + 1.97, 0.01], (x / 2 + y / 2) % 2 ? [150, 154, 158] : [140, 144, 148], [0, 0, 1], { tag: "floor" });
  // luzes do teto
  for (const x of [-4, 0, 4]) for (const y of [9, 14, 19]) g.box(x - 0.6, y - 0.6, CH_H - 0.04, 1.2, 1.2, 0.03, [255, 252, 244], { emit: 1 });
  // o botão grande vai numa camada própria (buildButton), por cima do piso
  // o tubo do cubo descendo do teto (vidro azulado) e o funil embaixo
  g.prism(3, 12, 5.4, CH_H, 0.72, 8, [120, 170, 196], { tag: "tube" });
  g.prism(3, 12, 5.1, 5.4, 0.9, 8, [200, 204, 208]);
  // a saída: batente e, atrás, o gelo do casco
  g.box(2.75, y1 - 0.2, 0, 0.25, 0.3, 2.8, [210, 214, 218]);
  g.box(5.0, y1 - 0.2, 0, 0.25, 0.3, 2.8, [210, 214, 218]);
  g.box(2.75, y1 - 0.2, 2.6, 2.5, 0.3, 0.25, [210, 214, 218]);
  g.box(2.9, y1 + 0.5, 0, 2.2, 0.8, 2.6, [176, 214, 230], { tag: "ice" });
  // a entrada (oeste): batente laranja aceso e o corredor escuro atrás
  g.box(x0 - 0.05, 7.9, 0, 0.12, 0.12, 2.6, [255, 150, 50], { emit: 0.8 });
  g.box(x0 - 0.05, 9.98, 0, 0.12, 0.12, 2.6, [255, 150, 50], { emit: 0.8 });
  g.quad([x0 - 2, 8, 0], [x0 - 2, 10, 0], [x0 - 2, 10, 2.6], [x0 - 2, 8, 2.6], [12, 12, 14], [1, 0, 0]);
  // plataforma elevada
  g.box(-6.9, 17.5, 0, 3.4, 4.4, 2.2, [196, 200, 204]);
  // a sala de observação (onde a câmera está): piso, laterais, teto, parapeito, caixilhos e o console
  g.box(-3.4, 1.6, 5.9, 6.8, 4.6, 0.25, [52, 56, 60]);
  g.box(-3.6, 1.6, 5.9, 0.25, 4.6, 3.4, [60, 64, 68]);
  g.box(3.35, 1.6, 5.9, 0.25, 4.6, 3.4, [60, 64, 68]);
  g.box(-3.6, 1.6, 9.05, 7.2, 4.7, 0.25, [46, 50, 54]);
  // o parapeito da janela (a câmera fica colada no vidro, olhando para baixo) e os caixilhos finos
  g.box(-3.35, 5.85, 6.0, 6.7, 0.35, 0.4, [70, 74, 78]);
  g.box(-3.35, 5.85, 9.0, 6.7, 0.35, 0.35, [70, 74, 78]);
  for (const x of [-1.6, 1.54]) g.box(x, 5.92, 6.4, 0.06, 0.1, 2.6, [36, 40, 44]);
  return g.F;
};
// o casco do navio atrás de um painel que caiu: aço enferrujado com uma nervura e gelo
const casco = (pn: Panel): XF[] => {
  const g = mk();
  const k = 0.08; // um pouco atrás do plano dos painéis
  const p = pn.p.map((q) => [q[0] - pn.n[0] * k, q[1] - pn.n[1] * k, q[2]] as V3) as [V3, V3, V3, V3];
  g.quad(p[0], p[1], p[2], p[3], [104, 66, 44], pn.n);
  const mid = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const off = (q: V3): V3 => [q[0] + pn.n[0] * 0.03, q[1] + pn.n[1] * 0.03, q[2]];
  g.quad(off(mid(p[0], p[1], 0.44)), off(mid(p[0], p[1], 0.56)), off(mid(p[3], p[2], 0.56)), off(mid(p[3], p[2], 0.44)), [70, 42, 28], pn.n);
  g.quad(off(mid(p[0], p[3], 0.0)), off(mid(p[1], p[2], 0.0)), off(mid(p[1], p[2], 0.3)), off(mid(p[0], p[3], 0.22)), [176, 214, 230], pn.n);
  return g.F;
};
// o botão grande (vermelho) sobre a base — camada própria por cima da sala (o piso cobria a base)
const buildButton = (): XF[] => {
  const g = mk();
  g.prism(-2, 14, 0.01, 0.13, 0.95, 18, [190, 194, 198]);
  g.prism(-2, 14, 0.13, 0.3, 0.62, 18, [200, 40, 30], { tag: "button" });
  return g.F;
};
// o painel caindo: gira para fora pela borda de baixo e desaba até o chão
const panelAt = (pn: Panel, t: number): V3[] => {
  if (t <= 0) return pn.p;
  const [a, b, c, d] = pn.p;
  const zb = Math.min(a[2], b[2]);
  const tilt = Math.min(1, t * 1.4) * 1.2;
  const drop = t * t * zb;
  const rot = (q: V3): V3 => {
    const hgt = q[2] - zb;
    return [q[0] + pn.out[0] * Math.sin(tilt) * hgt, q[1] + pn.out[1] * Math.sin(tilt) * hgt, zb + Math.cos(tilt) * hgt - drop];
  };
  return [rot(a), rot(b), rot(c), rot(d)];
};
export const HLATestChamber: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [testsAt, normAt, chambersAt, protoAt, senseAt, brokenAt] = ["testsAt", "normAt", "chambersAt", "protoAt", "senseAt", "brokenAt"].map((k) => at(p, k));
  const G = useMemo(() => buildChamber(), []);
  const PN = useMemo(() => buildPanels(), []);
  const BTN = useMemo(() => buildButton(), []);
  // câmera de observação: quase parada, um deslize lento; no navio quebrado, tranco + adernar; no fim, mergulha na tela
  const dive = P(f, life - 16, 16);
  const jolt = f >= brokenAt && f < brokenAt + 24 ? Math.sin((f - brokenAt) * 1.7) * 0.012 * (1 - (f - brokenAt) / 24) : 0;
  const e: Eye = {
    x: keys(f, [[0, 0.3], [life, -0.1]]),
    y: 4.9 + 0.3 * P(f, 0, 200),
    z: 7.95,
    yaw: keys(f, [[0, 0.04], [chambersAt, -0.08], [protoAt + 10, 0.06], [senseAt + 20, 0.12], [life, 0.06]]) + jolt,
    pitch: -0.6 + jolt * 0.5,
    F: 900,
  };
  const panels: XF[] = PN.map((pn) => {
    const t = pn.fall >= 0 ? interpolate(f, [brokenAt + pn.fall, brokenAt + pn.fall + 16], [0, 1], C) : 0;
    return { p: panelAt(pn, t), col: pn.dark ? [64, 68, 72] : [226, 228, 230], n: pn.n };
  });
  const holes: XF[] = PN.filter((pn) => pn.fall >= 0 && f >= brokenAt + pn.fall).flatMap(casco);
  // o cubo: cai pelo tubo no protocolo e emperra na curva
  const cubeZ = interpolate(f, [protoAt + 14, protoAt + 26, protoAt + 30], [8.2, 6.0, 6.25], C);
  const cube = mk();
  if (f >= protoAt + 10) cube.box(2.62, 11.62, cubeZ, 0.76, 0.76, 0.76, [210, 214, 218]);
  // a saída abre (as duas folhas correm) e mostra o gelo
  const exitOpen = P(f, senseAt + 12, 14);
  const door = mk();
  door.box(2.9 - 1.1 * exitOpen, 21.9, 0, 1.1, 0.1, 2.6, [220, 224, 228]);
  door.box(4.0 + 1.1 * exitOpen, 21.9, 0, 1.1, 0.1, 2.6, [220, 224, 228]);
  const grill = mk();
  if (f < senseAt + 20 || Math.floor(f / 3) % 3) grill.quad([2.95, 21.75, 0.05], [5.05, 21.75, 0.05], [5.05, 21.75, 2.55], [2.95, 21.75, 2.55], [130, 200, 255], [0, -1, 0], { emit: 0.42 + 0.1 * Math.sin(f / 3) });
  const broken = P(f, brokenAt, 30);
  const lights: XL[] = [
    { x: 0, y: 12, z: 8, col: [255, 252, 244], k: 0.55 * (1 - 0.5 * broken) * (f >= brokenAt && rnd(Math.floor(f / 2)) > 0.7 ? 0.4 : 1), r: 14 },
    { x: 0, y: 3.8, z: 8.6, col: [120, 200, 255], k: 0.25, r: 3.5 },
    { x: 4, y: 21, z: 1.4, col: [255, 60, 40], k: 0.4 * broken, r: 8 },
  ];
  // o Gordon (crachá): entra pela porta oeste → até o botão → segue para a saída
  const gx = keys(f, [[chambersAt, -7.6], [protoAt, -3.0], [senseAt + 6, -2.2], [brokenAt + 30, 2.4]]);
  const gy = keys(f, [[chambersAt, 9], [protoAt, 13.2], [senseAt + 6, 13.6], [brokenAt + 30, 18.5]]);
  const steps = [
    { t: "LIBERAR CUBO", fail: "EMPERROU NO TUBO", at: protoAt + 4 },
    { t: "PRESSIONAR BOTÃO", fail: "SEM RESPOSTA", at: protoAt + 10 },
    { t: "ABRIR SAÍDA", fail: "GELO · CASCO DO NAVIO", at: protoAt + 16 },
  ];
  const failAt = [senseAt, senseAt + 8, senseAt + 18];
  return (
    <AbsoluteFill style={{ background: "#020304", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `rotate(${2.4 * broken}deg) scale(${1 + 0.04 * broken})` }}>
        <XView e={e} faces={[...G, ...holes, ...panels, ...cube.F, ...door.F, ...grill.F]} lights={lights} flash={0} amb={0.56 - 0.2 * broken} />
        <XView e={e} faces={BTN} lights={lights} flash={0} amb={0.56 - 0.2 * broken} />
        {/* a placa da câmara (03) na parede oeste, estilo Aperture */}
        <Pinned e={e} w={360} h={520} corners={[[-6.9, 11.0, 7.4], [-6.9, 13.6, 7.4], [-6.9, 13.6, 3.6], [-6.9, 11.0, 3.6]]}>
          <div style={{ width: 360, height: 520, background: "#eef0f0", borderRadius: 10, padding: 26, boxSizing: "border-box", fontFamily: FONT, color: "#20262a" }}>
            <div style={{ fontSize: 150, fontWeight: 800, lineHeight: 1 }}>03</div>
            <div style={{ height: 4, background: "#20262a", margin: "10px 0 14px" }} />
            <div style={{ fontFamily: MONO, fontSize: 30, letterSpacing: 2 }}>03/19</div>
            <div style={{ display: "flex", gap: 10, marginTop: 30 }}>
              {[0, 1, 2, 3, 4].map((k) => <div key={k} style={{ width: 48, height: 48, borderRadius: 8, background: k < 2 ? "#20262a" : "#c9cdd0" }} />)}
            </div>
            <div style={{ fontFamily: MONO, fontSize: 22, marginTop: 30, letterSpacing: 2 }}>APERTURE SCIENCE</div>
          </div>
        </Pinned>
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          {f >= chambersAt ? <XMarker e={e} x={gx} y={gy} label="GORDON" col={ORANGE} f={f} o={P(f, chambersAt, 10)} sub={f >= chambersAt + 24 ? "SUJEITO DE TESTE?" : undefined} /> : null}
          <Call e={e} pt={[3, 12, 6.6]} f={f} from={failAt[0]} until={brokenAt + 12} text="O CUBO EMPERROU" sub="O TUBO ESTÁ TORTO" col={RED} dx={150} dy={-110} />
          <Call e={e} pt={[4, 22.6, 1.3]} f={f} from={failAt[2] + 6} text="A SAÍDA DÁ NO GELO" sub="O CASCO DO NAVIO" col={RED} dx={140} dy={-150} />
          <Call e={e} pt={[-2.0, 21.9, 5.6]} f={f} from={brokenAt + 6} text="ATRÁS DOS PAINÉIS" sub="O NAVIO QUEBRADO" col={AMB} dx={-150} dy={-120} />
        </svg>
      </AbsoluteFill>
      {/* o vidro da sala de observação: reflexos */}
      <AbsoluteFill style={{ background: "linear-gradient(115deg, rgba(255,255,255,0) 30%, rgba(200,230,255,0.06) 38%, rgba(255,255,255,0) 46%, rgba(255,255,255,0) 62%, rgba(200,230,255,0.04) 68%, rgba(255,255,255,0) 74%)", pointerEvents: "none", opacity: 1 - dive }} />
      {/* o painel da IA sobre a imagem da câmera de vigilância; no fim ele cresce e enche a tela (→ os arquivos do sistema) */}
      <div style={{ position: "absolute", left: 60 * (1 - dive) + 150 * dive, top: 600 * (1 - dive) + 90 * dive, width: 640, height: 380, transformOrigin: "0 0", transform: `scale(${0.82 + (1620 / 640 - 0.82) * dive}, ${0.82 + (900 / 380 - 0.82) * dive})`, borderRadius: 14, overflow: "hidden", border: `2px solid rgba(159,230,255,${0.5 * (1 - dive)})`, boxShadow: "0 20px 60px rgba(0,0,0,0.6)" }}>
        <AIScreen f={f} chambersAt={chambersAt} normAt={normAt} protoAt={protoAt} senseAt={senseAt} brokenAt={brokenAt} steps={steps} failAt={failAt} />
      </div>
      {/* a câmera de observação da IA */}
      <div style={{ position: "absolute", left: 80, top: 70, fontFamily: MONO, letterSpacing: 5, opacity: 1 - dive }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 18, color: APT }}>
          <span style={{ width: 14, height: 14, borderRadius: 7, background: RED, opacity: Math.floor(f / 15) % 2 ? 1 : 0.25 }} />
          CÂMERA DE OBSERVAÇÃO · CÂMARA 03
        </div>
        <div style={{ fontSize: 14, color: "rgba(242,240,247,0.6)", marginTop: 6, opacity: P(f, testsAt, 10) }}>A IA AINDA ACHA QUE OS TESTES CONTINUAM</div>
      </div>
      <AbsoluteFill style={{ background: "#000", opacity: interpolate(f, [0, 6], [1, 0], C), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};
// a tela da IA (também é o primeiro quadro dos arquivos do Cave, para a passagem ficar contínua)
export const AIScreen: React.FC<{ f: number; chambersAt: number; normAt: number; protoAt: number; senseAt: number; brokenAt: number; steps: { t: string; fail: string; at: number }[]; failAt: number[] }> = ({ f, chambersAt, normAt, protoAt, senseAt, brokenAt, steps, failAt }) => (
  <div style={{ width: 640, height: 380, background: "radial-gradient(ellipse at 50% 45%, #0e2230 0%, #04090d 90%)", fontFamily: MONO, color: ICE, padding: "22px 28px", boxSizing: "border-box", position: "relative", overflow: "hidden" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 18, letterSpacing: 3 }}>
      <div style={{ width: 22, height: 22, borderRadius: 11, background: "radial-gradient(circle, #ffe2b0 0%, #ff9a2c 45%, #3a1a06 80%)" }} />
      APERTURE · SISTEMA DE TESTES
    </div>
    <div style={{ marginTop: 14, fontSize: 26, color: f >= senseAt ? RED : GREEN }}>{f >= brokenAt ? "ERRO · ESTRUTURA FORA DO PADRÃO" : f >= chambersAt ? "SUJEITO DETECTADO · CÂMARA 03" : "TESTE EM ANDAMENTO"}</div>
    {f < protoAt ? <div style={{ marginTop: 8, fontSize: 22, color: f >= normAt ? GREEN : ICE }}>{f >= normAt ? "STATUS: NORMAL ✓" : "STATUS: …"}</div> : null}
    {f >= protoAt ? (
      <div style={{ marginTop: 10, fontSize: 21, lineHeight: 1.55 }}>
        <div style={{ color: AMB }}>PROTOCOLO 7</div>
        {steps.map((s, i) =>
          f >= s.at ? (
            <div key={i} style={{ color: f >= failAt[i] ? RED : TXT }}>
              {`${i + 1}. ${s.t}`} <span style={{ opacity: f >= failAt[i] ? 1 : 0.5 }}>{f >= failAt[i] ? `✗ ${s.fail}` : "…"}</span>
            </div>
          ) : null,
        )}
      </div>
    ) : null}
    {f >= brokenAt + 10 ? <div style={{ position: "absolute", left: 28, bottom: 22, fontSize: 20, color: AMB, opacity: Math.floor(f / 8) % 2 ? 1 : 0.3 }}>REINICIANDO TESTE…</div> : null}
    <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.18) 0px, rgba(0,0,0,0.18) 2px, rgba(0,0,0,0) 2px, rgba(0,0,0,0) 4px)" }} />
  </div>
);

// ================================================================================================= 40:35 as gravações do Cave
// continua da tela da IA: os ARQUIVOS DO SISTEMA (lista já cheia) → a pasta GRAVAÇÕES · DIRETORIA → o vídeo 07 abre e enche
// o monitor: o Cave Johnson (retrato real) em filme velho, com o letreiro → o vídeo corta para o teste do Borealis no dique
// seco (o Cave em janelinha) → INFORMAÇÃO QUE NÃO PODERIA EXISTIR → os slides do filme: PROJETO (emissor de campo de
// energia), IMAGEM (a Cidadela), DADOS → o projeto ao lado do campo de força Combine: TECNOLOGIA COMBINE → a linha do
// tempo: as gravações ANTES da invasão; Aperture "inventou" riscado; do futuro para o passado → o Cave de volta: COPIEM TUDO.
const CAVE_IMG = "hl3silh/cave_retrato.png";
// o retrato do Cave como filme: grão, cintilação, leve deriva do quadro
const CaveFilm: React.FC<{ f: number; w: number; h: number; zoom?: number }> = ({ f, w, h, zoom = 1 }) => {
  const weave = Math.sin(f / 7) * 1.5;
  const flick = 0.92 + 0.08 * rnd(Math.floor(f / 2));
  return (
    <div style={{ position: "absolute", inset: 0, width: w, height: h, overflow: "hidden", background: "#0b0906" }}>
      {/* fundo de estúdio (papel de parede quente) */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 40%, #6a5634 0%, #2a2014 70%, #0b0906 100%)" }} />
      <Img src={staticFile(CAVE_IMG)} style={{ position: "absolute", left: "50%", top: "50%", height: h * 0.96 * Math.min(1, zoom), transform: `translate(-50%, calc(-50% + ${weave}px)) scale(${1 + Math.min(f, 900) * 0.00004})`, filter: `sepia(0.25) contrast(1.08) brightness(${flick})` }} />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.65) 100%)" }} />
    </div>
  );
};
// o filme do teste: o Borealis no dique seco, de lado, com o andaime, os holofotes e os arcos azuis do teste
// (desenhado: só footage canônica, e não existe footage oficial do Borealis no dique)
// 12/10 (pedido dele: o Borealis 2D no dique seco muito mal feito): o MESMO Borealis 3D, no dique seco de 1979 — bacia de
// concreto com degraus (altares), picadeiros sob a quilha, escoras do costado às paredes, dois pórticos amarelos, torres
// de andaime e postes de holofote; câmera baixa andando ao longo do casco. Por cima, o filme antigo (sépia, riscos,
// tremido) e os arcos elétricos do teste.
const DockWorld: React.FC<{ f: number; g: number }> = ({ f, g }) => {
  const { camera, scene, invalidate } = useThree();
  const W = useMemo(() => {
    const root = new THREE.Group();
    const conc = new THREE.MeshStandardMaterial({ color: "#8a8478", roughness: 0.95 });
    const concD = new THREE.MeshStandardMaterial({ color: "#5e5a52", roughness: 0.95 });
    const wood = new THREE.MeshStandardMaterial({ color: "#6a4a2c", roughness: 0.9 });
    const steel = new THREE.MeshStandardMaterial({ color: "#3a3c3e", roughness: 0.6, metalness: 0.6 });
    const yel = new THREE.MeshStandardMaterial({ color: "#c89a2a", roughness: 0.6, metalness: 0.3 });
    const lampM = new THREE.MeshStandardMaterial({ color: "#fff4d0", emissive: new THREE.Color("#ffe9b0"), emissiveIntensity: 2.5 });
    const box = (w: number, h: number, d: number, m: THREE.Material, x: number, y: number, z: number, ry = 0, rz = 0) => {
      const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
      o.position.set(x, y, z);
      o.rotation.set(0, ry, rz);
      root.add(o);
      return o;
    };
    // a bacia: fundo e paredes em degraus dos dois lados e na cabeceira
    box(160, 0.4, 44, concD, 0, -0.2, 0);
    for (let k = 0; k < 4; k++) {
      const zz = 20 + k * 2.2, hh = 3.5 + k * 3.5;
      box(160, hh, 2.2, conc, 0, hh / 2, zz);
      box(160, hh, 2.2, conc, 0, hh / 2, -zz);
      box(2.2, hh, 44 + k * 4.4, conc, -78 - k * 2.2, hh / 2, 0);
    }
    // picadeiros sob a quilha (blocos de madeira sobre concreto)
    for (let x = -50; x <= 50; x += 3) {
      box(1.2, 0.8, 2.6, concD, x, 0.4, 0);
      box(1.2, 0.5, 2.4, wood, x, 1.05, 0);
    }
    // o navio sobre os picadeiros (quilha em y = −8,5 no modelo)
    const B = makeBorealis();
    B.root.position.set(0, 8.5 + 1.3, 0);
    B.scars.forEach((s) => (s.visible = false));
    B.tear.visible = false;
    root.add(B.root);
    // escoras do costado às paredes (os dois lados)
    for (let x = -44; x <= 44; x += 11)
      for (const s of [1, -1]) {
        const a = new THREE.Vector3(x, 4.5, s * 10.7), b = new THREE.Vector3(x, 10.2, s * 20.5);
        const d = b.clone().sub(a);
        const o = new THREE.Mesh(new THREE.BoxGeometry(0.35, d.length(), 0.35), wood);
        o.position.copy(a.clone().add(b).multiplyScalar(0.5));
        o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
        root.add(o);
      }
    // dois pórticos amarelos sobre a bacia
    for (const x of [-22, 26]) {
      for (const s of [1, -1]) box(1.4, 30, 1.4, yel, x, 15, s * 24);
      box(2.2, 2.2, 50, yel, x, 30.5, 0);
      box(4, 3, 3, yel, x, 28, 4);
      const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 10, 4), steel);
      cable.position.set(x, 23, 4);
      root.add(cable);
    }
    // torres de andaime junto à proa e à popa
    for (const [x, z] of [[40, 14], [-40, 14], [8, -14]] as [number, number][])
      for (let lv = 0; lv < 5; lv++) {
        for (const dx of [-1, 1]) for (const dz of [-1, 1]) box(0.12, 3, 0.12, steel, x + dx * 1.2, 1.5 + lv * 3, z + dz * 1.2);
        box(2.6, 0.12, 2.6, wood, x, 3 + lv * 3, z);
      }
    // postes de holofote nas bordas
    const lights: THREE.Light[] = [];
    for (const [x, z] of [[-40, 30], [0, 30], [40, 30], [-20, -30], [30, -30]] as [number, number][]) {
      box(0.5, 22, 0.5, steel, x, 11 + 14, z);
      const lamp = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.2, 1.2), lampM);
      lamp.position.set(x, 36, z - Math.sign(z) * 0.8);
      root.add(lamp);
      const sp = new THREE.SpotLight("#ffe6b8", 2600, 140, 0.55, 0.5, 1.6);
      sp.position.set(x, 36, z);
      sp.target.position.set(x * 0.6, 8, Math.sign(z) * 9);
      root.add(sp, sp.target);
      lights.push(sp);
    }
    root.add(new THREE.HemisphereLight("#d8cbb0", "#2a2218", 1.1));
    return { root };
  }, []);
  scene.fog = new THREE.FogExp2("#2a2216", 0.006);
  const u = Math.min(1, Math.max(0, g / 300));
  const cam = camera as THREE.PerspectiveCamera;
  cam.fov = 42;
  cam.near = 0.3;
  cam.far = 900;
  cam.position.set(64 - 26 * u, 20 - 2 * u, 40);
  cam.lookAt(-10 - 10 * u, 5, 0);
  cam.updateProjectionMatrix();
  invalidate();
  void f;
  return <primitive object={W.root} />;
};
const DockFilm: React.FC<{ f: number; t0: number; w: number; h: number }> = ({ f, t0, w, h }) => {
  const g = f - t0;
  const ctx = React.useContext(SfxCtx);
  // os arcos elétricos do teste, pulando do casco para os pórticos
  const arc = (i: number) => {
    const on = (g + i * 7) % 23 < 5;
    if (!on) return null;
    const x0 = w * (0.36 + 0.13 * i);
    const pts = Array.from({ length: 9 }).map((_, k) => `${x0 + (rnd(i * 31 + k + Math.floor(g / 2)) - 0.5) * w * 0.05},${h * 0.12 + k * h * 0.045}`).join(" ");
    return <polyline key={i} points={pts} fill="none" stroke="#bfefff" strokeWidth={3} style={{ filter: "drop-shadow(0 0 8px #9fe6ff)" }} />;
  };
  const flick = 0.92 + 0.08 * rnd(Math.floor(f / 2));
  return (
    <AbsoluteFill style={{ background: "#14100a" }}>
      <AbsoluteFill style={{ filter: `sepia(0.6) contrast(1.18) brightness(${0.9 * flick})` }}>
        {ctx.mode === "collect" ? null : (
          <ThreeCanvas frameloop="demand" width={w} height={h} style={{ position: "absolute", inset: 0 }} dpr={1} gl={{ antialias: true }} camera={{ fov: 48, position: [50, 7, 34], near: 0.3, far: 900 }}>
            <DockWorld f={f} g={g} />
          </ThreeCanvas>
        )}
      </AbsoluteFill>
      <svg width={w} height={h} style={{ position: "absolute", inset: 0 }}>
        {[0, 1, 2].map(arc)}
        {/* riscos e poeira do filme */}
        {Array.from({ length: 3 }).map((_, i) => {
          const x = rnd(Math.floor(f / 3) * 7 + i) * w;
          return rnd(Math.floor(f / 3) + i * 13) > 0.5 ? <line key={i} x1={x} x2={x + 2} y1={0} y2={h} stroke="rgba(240,230,200,0.18)" strokeWidth={1.5} /> : null;
        })}
        <rect width={w} height={h} fill="url(#dockVig)" />
        <defs>
          <radialGradient id="dockVig" cx="0.5" cy="0.5" r="0.75">
            <stop offset="0.6" stopColor="rgba(0,0,0,0)" />
            <stop offset="1" stopColor="rgba(0,0,0,0.65)" />
          </radialGradient>
        </defs>
      </svg>
    </AbsoluteFill>
  );
};
// o emissor de campo (o "projeto" que a Aperture recebeu): planta técnica azul, desenhada rápido
const FieldBlueprint: React.FC<{ f: number; at: number; w: number; h: number; combine?: boolean }> = ({ f, at: t0, w, h, combine }) => {
  const k = P(f, t0, 10);
  const shim = (i: number) => 0.35 + 0.25 * Math.sin(f / 3 + i);
  const px = [w * 0.24, w * 0.76];
  return (
    <svg width={w} height={h}>
      <rect width={w} height={h} fill={combine ? "#05090c" : "#123a5a"} />
      {!combine ? Array.from({ length: Math.ceil(h / 24) }).map((_, i) => <line key={i} x1={0} x2={w} y1={i * 24} y2={i * 24} stroke="rgba(255,255,255,0.07)" />) : null}
      {/* as duas colunas emissoras */}
      {px.map((x, i) => (
        <g key={i} opacity={k}>
          <rect x={x - w * 0.035} y={h * 0.2} width={w * 0.07} height={h * 0.62} fill={combine ? "#1c2228" : "none"} stroke={combine ? "#4a5a66" : "#e8f4ff"} strokeWidth={2} />
          {[0.28, 0.45, 0.62].map((v, j) => <rect key={j} x={x - w * 0.045} y={h * v} width={w * 0.09} height={h * 0.035} fill={combine ? "#5ff3ff" : "none"} stroke={combine ? "none" : "#e8f4ff"} strokeWidth={1.4} opacity={combine ? 0.8 : 1} />)}
        </g>
      ))}
      {/* o campo entre elas */}
      {Array.from({ length: 9 }).map((_, i) => (
        <line key={i} x1={px[0] + w * 0.04} x2={px[0] + w * 0.04 + (px[1] - px[0] - w * 0.08) * k} y1={h * (0.24 + i * 0.065)} y2={h * (0.24 + i * 0.065)} stroke={combine ? "#5ff3ff" : "#9fe6ff"} strokeWidth={combine ? 2 : 1.2} strokeDasharray={combine ? undefined : "6 6"} opacity={combine ? shim(i) : 0.8} />
      ))}
      {combine ? <rect x={px[0] + w * 0.04} y={h * 0.22} width={(px[1] - px[0] - w * 0.08) * k} height={h * 0.56} fill="rgba(95,243,255,0.12)" /> : null}
      {!combine ? (
        <g opacity={k} fontFamily={MONO} fontSize={Math.max(11, w * 0.026)} fill="#e8f4ff">
          <line x1={px[0]} x2={px[1]} y1={h * 0.9} y2={h * 0.9} stroke="#e8f4ff" strokeWidth={1.2} />
          <text x={w / 2} y={h * 0.88} textAnchor="middle">4,20 m</text>
          <text x={w * 0.05} y={h * 0.1}>PROJETO · EMISSOR DE CAMPO</text>
        </g>
      ) : (
        <text x={w * 0.05} y={h * 0.1} fontFamily={MONO} fontSize={Math.max(11, w * 0.026)} fill="#5ff3ff" opacity={k}>CAMPO DE FORÇA · COMBINE</text>
      )}
    </svg>
  );
};
export const HLACaveVideo: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [filesAt, folderAt, tapesAt, caveAt, testsAt, infoAt, projAt, imgAt, dataAt, combAt, beforeAt, invAt, notInvAt, archAt, futAt, pastAt, backAt, copyAt] = ["filesAt", "folderAt", "tapesAt", "caveAt", "testsAt", "infoAt", "projAt", "imgAt", "dataAt", "combAt", "beforeAt", "invAt", "notInvAt", "archAt", "futAt", "pastAt", "backAt", "copyAt"].map((k) => at(p, k));
  // fases: 0 arquivos · 1 o vídeo · 2 a linha do tempo · 3 o vídeo de novo (copiem tudo)
  const vid = P(f, tapesAt, 14) * (1 - P(f, beforeAt, 14)) + P(f, backAt, 14);
  const tl = P(f, beforeAt, 14) * (1 - P(f, backAt, 14));
  const files = 1 - P(f, tapesAt, 14);
  // dentro do vídeo: o que está na tela
  const scene = f >= backAt ? "cave" : f >= projAt ? "slides" : f >= infoAt ? "cave" : f >= testsAt ? "dock" : "cave";
  const tc = (fr: number) => {
    const s = Math.max(0, fr) / 30 + 72;
    return `00:${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}:${String(Math.floor((s * 24) % 24)).padStart(2, "0")}`;
  };
  // o monitor (moldura fixa em volta de tudo, para as fases serem a MESMA tela)
  const MX = 150;
  const MY = 90;
  const MW = 1620;
  const MH = 900;
  const LIST = ["TESTES/", "MANUTENÇÃO/", "SUJEITOS/", "BOREALIS/", "GRAVAÇÕES · DIRETORIA/", "PROTOCOLOS/", "ENERGIA/"];
  const VIDS = ["GRAVAÇÃO 03 · C. JOHNSON", "GRAVAÇÃO 05 · C. JOHNSON", "GRAVAÇÃO 07 · C. JOHNSON", "GRAVAÇÃO 09 · C. JOHNSON"];
  const stamp = (t0: number, rot = -8) => ({ transform: `rotate(${rot}deg) scale(${interpolate(f, [t0, t0 + 6], [2.2, 1], C)})`, opacity: f >= t0 ? 1 : 0 });
  const slideIn = (t0: number) => P(f, t0, 10);
  return (
    <AbsoluteFill style={{ background: "#050403", overflow: "hidden" }}>
      {/* a moldura do monitor */}
      <div style={{ position: "absolute", left: MX - 34, top: MY - 34, width: MW + 68, height: MH + 68, borderRadius: 40, background: "linear-gradient(180deg, #2a2620, #14110d)", boxShadow: "0 40px 120px rgba(0,0,0,0.8)" }} />
      <div style={{ position: "absolute", left: MX, top: MY, width: MW, height: MH, borderRadius: 22, overflow: "hidden", background: "#04090d" }}>
        {/* ---- 0 · os arquivos do sistema */}
        {files > 0 ? (
          <div style={{ position: "absolute", inset: 0, opacity: files, background: "radial-gradient(ellipse at 50% 45%, #0e2230 0%, #04090d 90%)", fontFamily: MONO, color: ICE, padding: "50px 64px", boxSizing: "border-box" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 30, letterSpacing: 4 }}>
              <div style={{ width: 34, height: 34, borderRadius: 17, background: "radial-gradient(circle, #ffe2b0 0%, #ff9a2c 45%, #3a1a06 80%)" }} />
              APERTURE · ARQUIVOS DO SISTEMA
            </div>
            <div style={{ display: "flex", gap: 60, marginTop: 40 }}>
              <div style={{ width: 640, fontSize: 30, lineHeight: 1.75 }}>
                {LIST.map((l, i) => {
                  const hot = i === 4 && f >= folderAt;
                  return (
                    <div key={i} style={{ opacity: P(f, filesAt + i * 1.5, 4), color: hot ? "#04090d" : ICE, background: hot ? AMB : "transparent", padding: "0 14px", borderRadius: 6 }}>
                      {`▸ ${l}`}
                    </div>
                  );
                })}
              </div>
              {f >= folderAt ? (
                <div style={{ flex: 1, fontSize: 26, lineHeight: 1.6, borderLeft: "2px solid rgba(159,230,255,0.3)", paddingLeft: 40 }}>
                  {VIDS.map((v, i) => {
                    const hot = i === 2 && f >= tapesAt - 10;
                    return (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 22, marginBottom: 18, opacity: P(f, folderAt + 2 + i * 2, 5), background: hot ? "rgba(255,178,46,0.18)" : "transparent", border: hot ? `2px solid ${AMB}` : "2px solid transparent", borderRadius: 10, padding: 8 }}>
                        <div style={{ width: 120, height: 80, borderRadius: 6, overflow: "hidden", position: "relative", background: "#000" }}>
                          <Img src={staticFile(CAVE_IMG)} style={{ position: "absolute", left: "50%", top: 0, height: 120, transform: "translateX(-50%)", filter: "sepia(0.4)" }} />
                          <div style={{ position: "absolute", left: 6, bottom: 4, fontSize: 14, color: "#fff" }}>▶</div>
                        </div>
                        <div>
                          <div style={{ color: hot ? AMB : TXT }}>{v}</div>
                          <div style={{ fontSize: 18, color: "rgba(159,230,255,0.6)" }}>{`VÍDEO · ${["04:12", "06:40", "11:03", "02:58"][i]}`}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
        {/* ---- 1 e 3 · o vídeo */}
        {vid > 0 ? (
          <div style={{ position: "absolute", inset: 0, opacity: vid, transform: `scale(${0.7 + 0.3 * P(f, tapesAt, 16)})` }}>
            {scene === "cave" ? <CaveFilm f={f} w={MW} h={MH} /> : null}
            {scene === "dock" ? (
              <AbsoluteFill>
                <DockFilm f={f} t0={testsAt} w={MW} h={MH} />
                {/* o Cave em janelinha, ainda falando */}
                <div style={{ position: "absolute", right: 40, top: 40, width: 300, height: 200, borderRadius: 8, overflow: "hidden", border: "3px solid #e8dcc0" }}>
                  <CaveFilm f={f} w={300} h={200} zoom={1.6} />
                </div>
                <div style={{ position: "absolute", left: 50, bottom: 110, padding: "10px 20px", background: "rgba(10,8,4,0.8)", borderLeft: `6px solid ${AMB}`, fontFamily: MONO, fontSize: 26, letterSpacing: 3, color: CREAM, opacity: P(f, testsAt + 4, 8) }}>TESTE 01 · BOREALIS · DIQUE SECO</div>
              </AbsoluteFill>
            ) : null}
            {scene === "slides" ? (
              <AbsoluteFill style={{ background: "#0b0906" }}>
                {/* os três slides do filme, entrando um a um (já cheios) */}
                {[
                  { t0: projAt, x: 60, el: <FieldBlueprint f={f} at={projAt} w={480} h={340} /> },
                  { t0: imgAt, x: 570, el: (
                    <div style={{ width: 480, height: 340, background: "#000", position: "relative", overflow: "hidden" }}>
                      <Sequence from={Math.round(imgAt)} layout="none">
                        <Clip src={CL + "cmb_campo_hq.mp4"} from={1} rate={1} style={{ filter: "sepia(0.35) contrast(1.1)" }} />
                      </Sequence>
                      <div style={{ position: "absolute", left: 12, top: 10, fontFamily: MONO, fontSize: 14, color: "#fff", letterSpacing: 2 }}>IMAGEM · ESTRUTURA DESCONHECIDA</div>
                    </div>
                  ) },
                  { t0: dataAt, x: 1080, el: (
                    <svg width={480} height={340}>
                      <rect width={480} height={340} fill="#ece4d2" />
                      {Array.from({ length: 9 }).map((_, i) => <text key={i} x={18} y={40 + i * 27} fill="#3a3326" fontFamily={MONO} fontSize={15}>{`${(rnd(i) * 900 + 100).toFixed(2)}  ${(rnd(i * 3) * 99).toFixed(3)}  Ω${Math.floor(rnd(i * 5) * 9)}`}</text>)}
                      <polyline points={Array.from({ length: 20 }).map((_, i) => `${250 + i * 11},${200 - Math.abs(Math.sin(i * 0.9)) * 70}`).join(" ")} fill="none" stroke="#7a2a1e" strokeWidth={2.5} />
                      <text x={18} y={326} fill="#3a3326" fontFamily={MONO} fontSize={14}>DADOS · ENERGIA ESCURA?</text>
                    </svg>
                  ) },
                ].map((s, i) => {
                  const k = slideIn(s.t0);
                  // em "Combine": o projeto cresce no meio e o campo Combine aparece ao lado
                  const big = P(f, combAt - 40, 20);
                  const isProj = i === 0;
                  const x = isProj ? s.x + (220 - s.x) * big : s.x;
                  const y = isProj ? 230 - 90 * big : 230;
                  const sc = isProj ? 1 + 0.3 * big : 1;
                  return f >= s.t0 ? (
                    <div key={i} style={{ position: "absolute", left: x, top: y, transform: `translateY(${(1 - k) * 60}px) scale(${sc})`, transformOrigin: "0 0", opacity: k * (isProj ? 1 : 1 - big), boxShadow: "0 20px 60px rgba(0,0,0,0.7)", border: "6px solid #e8dcc0" }}>
                      {s.el}
                    </div>
                  ) : null;
                })}
                {f >= combAt - 30 ? (
                  <div style={{ position: "absolute", left: 960, top: 140, transform: "scale(1.3)", transformOrigin: "0 0", opacity: P(f, combAt - 30, 12), boxShadow: "0 20px 60px rgba(0,0,0,0.7)", border: "6px solid #5ff3ff" }}>
                    <FieldBlueprint f={f} at={combAt - 30} w={480} h={340} combine />
                  </div>
                ) : null}
                {f >= combAt - 30 ? <div style={{ position: "absolute", left: 0, right: 0, top: 640, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 90, color: TXT, opacity: P(f, combAt - 24, 8) }}>=</div> : null}
                {f >= combAt ? (
                  <div style={{ position: "absolute", left: 0, right: 0, top: 690, display: "flex", justifyContent: "center" }}>
                    <div style={{ padding: "14px 30px", border: `6px solid ${RED}`, borderRadius: 10, color: RED, fontFamily: FONT, fontWeight: 800, fontSize: 70, background: "rgba(30,4,2,0.55)", ...stamp(combAt) }}>TECNOLOGIA COMBINE</div>
                  </div>
                ) : null}
              </AbsoluteFill>
            ) : null}
            {/* letreiro do Cave e a etiqueta de informação */}
            {scene === "cave" && f < backAt ? (
              <div style={{ position: "absolute", left: 60, bottom: 110, opacity: P(f, caveAt + 6, 10) * (f >= infoAt ? 0 : 1) }}>
                <div style={{ padding: "12px 24px", background: "rgba(10,8,4,0.85)", borderLeft: `6px solid ${AMB}`, fontFamily: FONT, fontWeight: 800, fontSize: 46, color: CREAM }}>Cave Johnson</div>
                <div style={{ padding: "6px 24px", background: "rgba(10,8,4,0.7)", fontFamily: MONO, fontSize: 20, letterSpacing: 4, color: "rgba(255,226,176,0.8)" }}>FUNDADOR E CEO · APERTURE SCIENCE</div>
              </div>
            ) : null}
            {scene === "cave" && f >= infoAt && f < backAt ? (
              <div style={{ position: "absolute", left: 60, bottom: 110, padding: "12px 24px", background: "rgba(40,6,4,0.85)", borderLeft: `6px solid ${RED}`, fontFamily: MONO, fontSize: 26, letterSpacing: 3, color: "#ffd2c8", opacity: P(f, infoAt, 8) }}>INFORMAÇÃO QUE NÃO PODERIA EXISTIR NAQUELA ÉPOCA</div>
            ) : null}
            {/* COPIEM TUDO: o carimbo e as cópias do projeto se empilhando */}
            {f >= copyAt ? (
              <AbsoluteFill>
                {Array.from({ length: 18 }).map((_, i) => {
                  const t0 = copyAt + 8 + i * 1.4;
                  return f >= t0 ? (
                    <div key={i} style={{ position: "absolute", left: 80 + (i % 6) * 250 + rnd(i) * 30, top: 470 + Math.floor(i / 6) * 120 - Math.min(30, (f - t0) * 0.6), transform: `rotate(${(rnd(i * 3) - 0.5) * 14}deg)`, opacity: P(f, t0, 5), boxShadow: "0 10px 30px rgba(0,0,0,0.6)", border: "3px solid #e8dcc0" }}>
                      <FieldBlueprint f={f} at={t0 - 20} w={200} h={140} />
                    </div>
                  ) : null;
                })}
                <div style={{ position: "absolute", left: 0, right: 0, top: 180, display: "flex", justifyContent: "center" }}>
                  <div style={{ padding: "16px 34px", border: `6px solid ${RED}`, borderRadius: 10, color: RED, fontFamily: FONT, fontWeight: 800, fontSize: 96, background: "rgba(30,4,2,0.55)", ...stamp(copyAt + 2) }}>COPIEM TUDO</div>
                </div>
                <div style={{ position: "absolute", right: 70, top: 380, fontFamily: FONT, fontWeight: 800, fontSize: 60, color: TXT, opacity: P(f, copyAt + 14, 8), textShadow: "0 6px 30px #000" }}>{`×${Math.min(999, Math.max(1, Math.floor((f - copyAt - 10) * 6)))}`}</div>
              </AbsoluteFill>
            ) : null}
            {/* a barra do reprodutor */}
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 74, background: "linear-gradient(0deg, rgba(0,0,0,0.85), rgba(0,0,0,0))", fontFamily: MONO, color: TXT, display: "flex", alignItems: "center", gap: 24, padding: "0 30px", boxSizing: "border-box", fontSize: 20, letterSpacing: 3 }}>
              <span style={{ color: RED }}>●</span>
              <span>GRAVAÇÃO 07 · C. JOHNSON</span>
              <div style={{ flex: 1, height: 6, borderRadius: 3, background: "rgba(255,255,255,0.2)" }}>
                <div style={{ width: `${interpolate(f, [tapesAt, life], [8, 92], C)}%`, height: "100%", borderRadius: 3, background: AMB }} />
              </div>
              <span>{tc(f - tapesAt)}</span>
            </div>
            <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.12) 0px, rgba(0,0,0,0.12) 2px, rgba(0,0,0,0) 2px, rgba(0,0,0,0) 4px)", pointerEvents: "none" }} />
          </div>
        ) : null}
        {/* ---- 2 · a linha do tempo */}
        {tl > 0 ? (
          <div style={{ position: "absolute", inset: 0, opacity: tl, background: "radial-gradient(ellipse at 50% 50%, #0e1a22 0%, #04090d 90%)" }}>
            <svg width={MW} height={MH} style={{ position: "absolute", inset: 0 }}>
              <line x1={80} x2={MW - 80} y1={560} y2={560} stroke="rgba(242,240,247,0.4)" strokeWidth={3} />
              {f >= invAt ? (
                <g transform="translate(1030 560)" opacity={P(f, invAt, 10)}>
                  <rect x={-14} y={-14} width={28} height={28} transform="rotate(45)" fill={RED} />
                </g>
              ) : null}
              {f >= futAt ? (
                <g opacity={P(f, futAt, 10)}>
                  <g transform="translate(1440 560)">
                    <path d="M -50 12 L 50 12 L 38 30 L -38 30 Z M -30 12 L -30 -14 L 14 -14 L 14 12" fill="none" stroke={ICE} strokeWidth={3} />
                  </g>
                  <path d={`M 1440 520 C 1140 ${300 - 20 * Math.sin(f / 10)}, 700 ${300 - 20 * Math.sin(f / 10)}, 492 440`} fill="none" stroke={ICE} strokeWidth={4} strokeDasharray={`${2000 * P(f, futAt + 4, 30)} 2000`} />
                  <path d="M 492 440 l 2 -24 l 18 16 Z" fill={ICE} opacity={P(f, pastAt, 8)} />
                </g>
              ) : null}
            </svg>
            {/* as gravações (o vídeo do Cave em miniatura) */}
            {/* 11/10 (pedido dele: o Cave aparecia cortado numa miniatura): o filme maior, o rosto inteiro, com a legenda */}
            <div style={{ position: "absolute", left: 150, top: 430, width: 340, height: 260, borderRadius: 10, overflow: "hidden", border: `3px solid ${AMB}`, boxShadow: "0 20px 50px rgba(0,0,0,0.7)" }}>
              <CaveFilm f={f} w={340} h={260} zoom={0.95} />
              <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "6px 10px", background: "rgba(10,8,4,0.8)", fontFamily: MONO, fontSize: 14, letterSpacing: 3, color: AMB }}>CAVE JOHNSON · APERTURE</div>
            </div>
            <div style={{ position: "absolute", left: 150, top: 708, width: 340, textAlign: "center", fontFamily: MONO, letterSpacing: 3, color: AMB, fontSize: 22 }}>AS GRAVAÇÕES</div>
            <div style={{ position: "absolute", left: 150, top: 390, width: 340, textAlign: "center", fontFamily: MONO, letterSpacing: 3, color: CREAM, fontSize: 20, opacity: P(f, beforeAt + 6, 10) }}>ANTES DA INVASÃO</div>
            {f >= invAt ? <div style={{ position: "absolute", left: 900, top: 600, width: 260, textAlign: "center", fontFamily: MONO, letterSpacing: 3, color: RED, fontSize: 22, opacity: P(f, invAt, 10) }}>A INVASÃO DA TERRA</div> : null}
            {f >= notInvAt ? (
              <div style={{ position: "absolute", left: 120, top: 130, display: "flex", gap: 28, alignItems: "baseline", opacity: P(f, notInvAt, 8) }}>
                <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 84, color: TXT }}>a Aperture</div>
                <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 84, color: "rgba(242,240,247,0.45)", position: "relative" }}>
                  inventou
                  <span style={{ position: "absolute", left: 0, top: "55%", height: 7, width: `${100 * P(f, notInvAt + 6, 10)}%`, background: RED }} />
                </div>
                {f >= archAt ? <div style={{ fontFamily: MONO, fontSize: 26, letterSpacing: 4, color: CREAM }}>A ARQUITETURA</div> : null}
              </div>
            ) : null}
            {f >= futAt ? <div style={{ position: "absolute", left: 0, right: 0, top: 290, textAlign: "center", fontFamily: MONO, letterSpacing: 6, color: ICE, fontSize: 28, opacity: P(f, futAt + 10, 10) }}>{f >= pastAt ? "O BOREALIS · DO FUTURO → PARA O PASSADO" : "O BOREALIS · DO FUTURO"}</div> : null}
          </div>
        ) : null}
        <div style={{ position: "absolute", inset: 0, borderRadius: 22, boxShadow: "inset 0 0 120px rgba(0,0,0,0.7)", pointerEvents: "none" }} />
      </div>
      <FilmLook />
    </AbsoluteFill>
  );
};

// ================================================================================================= 41:20 Aperture × Combine
// só footage dos jogos ORIGINAIS: a câmara da Aperture (Portal RTX) → a ponte de luz sólida (Portal 2) ao lado do campo de
// força da Cidadela (HL2) → a grade de emancipação (Portal) ao lado do campo de confisco (HL2) → os quatro em grade, com as
// ligações "mesma família" → a resposta: o Borealis trouxe do futuro (a seta do futuro para o passado, como na cena anterior)
type Pane = { src: string; from: number; rate?: number; label: string; col: string; tint?: string };
const FootPane: React.FC<{ f: number; at: number; pane: Pane; x: number; y: number; w: number; h: number; o?: number }> = ({ f, at: t0, pane, x, y, w, h, o = 1 }) => (
  <div style={{ position: "absolute", left: x, top: y, width: w, height: h, borderRadius: 14, overflow: "hidden", border: `2px solid ${pane.col}`, opacity: o, boxShadow: "0 30px 80px rgba(0,0,0,0.7)", background: "#000" }}>
    <Sequence from={Math.round(t0)} layout="none">
      <Clip src={CL + pane.src} from={pane.from} rate={pane.rate ?? 1} style={{ filter: pane.tint ?? "saturate(0.9) contrast(1.05)" }} />
    </Sequence>
    <div style={{ position: "absolute", left: 14, top: 12, padding: "6px 12px", borderRadius: 6, background: "rgba(0,0,0,0.65)", fontFamily: MONO, fontSize: Math.max(13, w * 0.02), letterSpacing: 3, color: pane.col }}>{pane.label}</div>
  </div>
);
const PAIRS: [Pane, Pane][] = [
  [
    { src: "apt_ponte_hq.mp4", from: 0, rate: 1, label: "APERTURE · PONTE DE LUZ SÓLIDA", col: APT },
    { src: "cmb_campo_hq.mp4", from: 0, rate: 1, label: "COMBINE · CAMPO DE FORÇA", col: "#5ff3ff" },
  ],
  [
    { src: "apt_grade_hq.mp4", from: 2.6, rate: 1, label: "APERTURE · GRADE DE EMANCIPAÇÃO", col: APT },
    { src: "cmb_confisco_hq.mp4", from: 0, rate: 1, label: "COMBINE · CAMPO DE CONFISCO", col: "#5ff3ff" },
  ],
];
export const HLAArchCompare: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [archAt, portalAt, techAt, similarAt, alignAt, combAt, answerAt] = ["archAt", "portalAt", "techAt", "similarAt", "alignAt", "combAt", "answerAt"].map((k) => at(p, k));
  // 0: a câmara sozinha · 1: par 1 · 2: par 2 · 3: os quatro em grade · 4: a resposta
  const split = P(f, techAt - 6, 16);
  const grid = P(f, alignAt - 4, 18);
  const ans = 0 * P(f, answerAt - 4, 16); // 08/10: sem a 'resposta do porquê' (pedido dele) — a cena só passa
  const pairK = f >= similarAt - 4 ? 1 : 0;
  const swap = P(f, similarAt - 4, 10);
  // posições: lado a lado grandes → grade 2×2 menor no alto
  const big = { w: 820, h: 461, y: 270 };
  const small = { w: 520, h: 292 };
  const gx = [380, 1020]; // borda de dentro de cada coluna (esq.: termina em 900; dir.: começa em 1020)
  const gy = [150, 470];
  const C2 = "#5ff3ff";
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, #0c1216 0%, #030506 80%)", overflow: "hidden" }}>
      {/* 0 · a arquitetura da Aperture: uma câmara real, larga */}
      {split < 1 ? (
        <FootPane f={f} at={0} pane={{ src: "apt_arch_hq.mp4", from: 0, rate: 1, label: f >= portalAt ? "APERTURE · OS JOGOS DE PORTAL" : "APERTURE · ARQUITETURA", col: APT }} x={260 - 160 * split} y={140 + 110 * split} w={1400 - 540 * split} h={788 - 304 * split} o={1 - split} />
      ) : null}
      {/* 1 e 2 · os pares lado a lado (o par 2 entra virando por cima do 1) */}
      {split > 0 && grid < 1
        ? [0, 1].map((side) => {
            const pane = PAIRS[pairK][side];
            const x = side === 0 ? 60 : 1040;
            const k = side === 0 ? split : P(f, techAt, 16);
            const flip = pairK === 1 ? 1 - swap : 0;
            return (
              <div key={`${pairK}-${side}`} style={{ position: "absolute", inset: 0, transform: `perspective(1800px) rotateY(${flip * (side ? -70 : 70)}deg)`, transformOrigin: `${side ? 1390 : 530}px 492px`, opacity: (1 - grid) * (pairK === 1 ? swap : 1) }}>
                <FootPane f={f} at={pairK === 1 ? similarAt - 4 : techAt - 6} pane={pane} x={x + (side ? 1 : -1) * (1 - k) * 80} y={big.y} w={big.w} h={big.h} o={k} />
              </div>
            );
          })
        : null}
      {split > 0 && grid < 1 ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 440, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 80, color: TXT, opacity: P(f, techAt + 10, 8) * (1 - grid), textShadow: "0 0 30px rgba(95,243,255,0.6)" }}>=</div>
      ) : null}
      {/* 3 · os quatro em grade, ligados */}
      {grid > 0
        ? PAIRS.map((pr2, r) =>
            pr2.map((pane, side) => (
              <FootPane key={`g${r}${side}`} f={f} at={alignAt - 4} pane={{ ...pane, from: 0 }} x={side ? gx[1] : gx[0]} y={gy[r]} w={small.w} h={small.h} o={grid * (1 - 0.65 * ans)} />
            )),
          )
        : null}
      {grid > 0 ? (
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: grid * (1 - 0.6 * ans) }}>
          {gy.map((y, r) => {
            const yy = y + small.h / 2;
            const k = P(f, alignAt + 6 + r * 6, 14);
            return (
              <g key={r}>
                <line x1={gx[0] + small.w} x2={gx[0] + small.w + (gx[1] - gx[0] - small.w) * k} y1={yy} y2={yy} stroke={ORANGE} strokeWidth={3} strokeDasharray="10 8" />
                <circle cx={960} cy={yy} r={22} fill="#0a0806" stroke={ORANGE} strokeWidth={2.5} opacity={k} />
                <text x={960} y={yy + 9} textAnchor="middle" fill={ORANGE} fontFamily={FONT} fontWeight={800} fontSize={28} opacity={k}>=</text>
              </g>
            );
          })}
        </svg>
      ) : null}
      {grid > 0 ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 790, display: "flex", justifyContent: "center", gap: 420, fontFamily: MONO, fontSize: 22, letterSpacing: 6, opacity: grid * (1 - 0.6 * ans) }}>
          <span style={{ color: APT }}>APERTURE</span>
          <span style={{ color: C2, opacity: P(f, combAt, 10) }}>COMBINE</span>
        </div>
      ) : null}
      {f >= combAt ? <div style={{ position: "absolute", left: 0, right: 0, top: 850, textAlign: "center", fontFamily: MONO, fontSize: 20, letterSpacing: 5, color: ORANGE, opacity: P(f, combAt + 6, 10) * (1 - ans) }}>A MESMA FAMÍLIA DE TECNOLOGIA</div> : null}
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ================================================================================================= 42:53 a Alyx depois do salto
// POV contínuo no corredor do navio, atrás da Alyx (crachá). Tudo dentro do HUD do HEV (nada de painel solto no preto):
// o biomonitor dela (dor de cabeça → 0, fala sem travar, ESTÁVEL? → NÃO É ISSO) · o registro de rádio: a resposta dela
// começa ANTES da fala da Mossman acabar · ela marca a seção do corredor que vai mudar, e ela muda · o headcrab no chão:
// o tiro sai antes do salto (a trajetória do salto fica só tracejada) · a insegurança zera · o cone de olhar dela para de
// procurar · a rota dela aparece no chão antes de ela andar · a assinatura muda de cor: algo mudou no salto.
const HALL_LEN = 46;
const SEC_Y = 27; // a seção do corredor que muda (parede direita)
const CRAB_Y = 33.6;
export const HLAAlyxAfter: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [betterAt, headAt, lostAt, resolvedAt, notAt, answerAt, mossAt, corrAt, changeAt, fightAt, crabAt, insecAt, goneAt, actAt, knowAt, gameAt, changedAt] = ["betterAt", "headAt", "lostAt", "resolvedAt", "notAt", "answerAt", "mossAt", "corrAt", "changeAt", "fightAt", "crabAt", "insecAt", "goneAt", "actAt", "knowAt", "gameAt", "changedAt"].map((k) => at(p, k));
  const HALL = useMemo(() => buildShipHall2(HALL_LEN), []);
  // a câmera anda atrás do grupo; para na luta; segue
  const y = keys(f, [[0, 2], [corrAt - 20, 17], [changeAt + 40, 21], [fightAt, 28.5], [crabAt + 40, 29.5], [actAt, 31], [life, 37]]);
  const walking = !(f > fightAt && f < crabAt + 40);
  const e: Eye = { x: 0.15 * Math.sin(f / 60), y, z: 1.65 + (walking ? 0.03 * Math.sin(f / 3.8) : 0), yaw: keys(f, [[0, 0], [corrAt, 0.1], [changeAt + 40, 0.12], [fightAt, 0.06], [life, 0]]), pitch: keys(f, [[0, -0.05], [fightAt, -0.12], [crabAt + 40, -0.05]]), F: 960 };
  // a Alyx à frente; depois do "age" ela se adianta sozinha pela rota que já conhece
  const ax = keys(f, [[0, 0.5], [actAt, 0.5], [actAt + 40, -0.4], [life, -0.9]]);
  const ay = keys(f, [[0, y + 3.4], [actAt, 34.4], [actAt + 60, 39.5], [life, 43]]);
  const alyxY = f < actAt ? y + 3.4 : ay;
  const changed = P(f, changedAt, 14);
  const alyxCol = changed > 0.5 ? "#e8f2ff" : f >= notAt && f < answerAt ? RED : ORANGE;
  // o cone de olhar dela: procura de um lado a outro (insegura) → para, olhando em frente
  const calm = P(f, goneAt, 30);
  const look = (1 - calm) * 0.9 * Math.sin(f / 14);
  // seção do corredor: muda de fase (porta fechada → vão aberto com a luz de outra época)
  const secOpen = f >= changeAt + 30;
  const secBlink = f >= changeAt + 22 && f < changeAt + 40 && Math.floor(f / 2) % 2 === 0;
  const sec = mk();
  if (!secOpen || secBlink) sec.box(2.05, SEC_Y, 0, 0.14, 3.2, 2.7, [92, 98, 102]);
  else sec.box(2.25, SEC_Y + 0.2, 0, 0.05, 2.8, 2.6, [255, 236, 200], { emit: 0.85 });
  const lights: XL[] = [
    { x: 0, y: y + 4, z: 2.6, col: [255, 236, 200], k: 0.5, r: 9 },
    { x: 2.2, y: SEC_Y + 1.6, z: 1.4, col: [255, 236, 200], k: secOpen ? 0.6 : 0, r: 5 },
  ];
  // o headcrab no chão, à frente; o tiro dela sai antes do salto
  const crabOn = f >= fightAt - 10 && f < crabAt + 50;
  const shot = f >= crabAt && f < crabAt + 5;
  const down = f >= crabAt + 2;
  // biomonitor
  const pain = 100 - 100 * P(f, headAt, 30);
  const insec = 100 - 100 * P(f, goneAt, 30);
  const status = changed > 0.5 ? "ASSINATURA ALTERADA" : f >= notAt ? "NÃO É ISSO" : f >= resolvedAt ? "ESTÁVEL?" : f >= betterAt ? "ESTÁVEL" : "RECUPERANDO";
  const statusCol = changed > 0.5 ? "#e8f2ff" : f >= notAt ? RED : f >= betterAt ? GREEN : AMB;
  // registro de rádio: a fala da Mossman (barra azul) e a resposta dela (laranja) começando antes do fim
  const radioOn = f >= answerAt - 10 && f < corrAt + 20;
  const mossEnd = mossAt + 24;
  const tl = (t: number) => 660 + (t - (answerAt - 10)) * 6;
  return (
    <AbsoluteFill style={{ background: "#020304", overflow: "hidden" }}>
      <XView e={e} faces={[...HALL, ...sec.F]} lights={lights} flash={0.95} amb={0.1} />
      {secBlink ? <AbsoluteFill style={{ background: "rgba(159,230,255,0.08)" }} /> : null}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {/* o cone de olhar da Alyx no chão */}
        {(() => {
          const ang = look;
          const pts = [0, -0.35, 0.35].map((da) => {
            if (da === 0) return proj(e, [ax, alyxY, 0.03]);
            return proj(e, [ax + Math.sin(ang + da) * 3.2, alyxY + Math.cos(ang + da) * 3.2, 0.03]);
          });
          if (pts.some((q) => !q)) return null;
          return <polygon points={pts.map((q) => `${q!.x},${q!.y}`).join(" ")} fill={`rgba(255,152,40,${0.1 + 0.05 * calm})`} stroke={alyxCol} strokeWidth={1.2} opacity={0.8 * (1 - changed * 0.5)} />;
        })()}
        {/* a rota que ela já conhece: aparece no chão antes de ela andar */}
        {f >= knowAt - 30
          ? (() => {
              const R: V3[] = [[0.5, 34.4, 0.04], [0.2, 37, 0.04], [-0.6, 39.5, 0.04], [-0.9, 43, 0.04]];
              const k = P(f, knowAt - 30, 30);
              const q = R.map((v) => proj(e, v)).filter(Boolean) as { x: number; y: number }[];
              return <polyline points={q.map((v) => `${v.x},${v.y}`).join(" ")} fill="none" stroke={GREEN} strokeWidth={4} strokeDasharray={`10 10`} strokeDashoffset={-f * 2} opacity={0.85 * k} />;
            })()
          : null}
        {/* a seção que vai mudar: o anel que ela marca antes */}
        {f >= corrAt && f < changeAt + 80
          ? (() => {
              const q = proj(e, [2.1, SEC_Y + 1.6, 1.3]);
              if (!q) return null;
              const ok = secOpen;
              return (
                <g opacity={P(f, corrAt, 8) * (1 - P(f, changeAt + 70, 10))}>
                  <circle cx={q.x} cy={q.y} r={34 + 4 * Math.sin(f / 5)} fill="none" stroke={ok ? GREEN : ORANGE} strokeWidth={3} strokeDasharray={ok ? undefined : "8 6"} />
                  <line x1={q.x - 30} y1={q.y - 30} x2={q.x - 120} y2={q.y - 110} stroke={ok ? GREEN : ORANGE} strokeWidth={1.8} />
                  <text x={q.x - 128} y={q.y - 118} textAnchor="end" fill={ok ? GREEN : ORANGE} fontFamily={MONO} fontSize={20} letterSpacing={4} style={{ paintOrder: "stroke", stroke: "#000", strokeWidth: 5 }}>{ok ? "MUDOU · COMO ELA DISSE" : "ELA MARCA: ESTE VAI MUDAR"}</text>
                </g>
              );
            })()
          : null}
        {/* o headcrab: a trajetória do salto (que não acontece) e o tiro */}
        {crabOn
          ? (() => {
              const c0 = proj(e, [1.0, CRAB_Y, 0.2]);
              const arc = [0, 0.25, 0.5, 0.75, 1].map((t) => proj(e, [1.0 + (ax - 1.0) * t, CRAB_Y + (alyxY - CRAB_Y) * t, 0.2 + Math.sin(t * Math.PI) * 1.4]));
              const a0 = proj(e, [ax, alyxY, 1.2]);
              if (!c0 || !a0) return null;
              return (
                <g>
                  {arc.every(Boolean) ? <polyline points={arc.map((q) => `${q!.x},${q!.y}`).join(" ")} fill="none" stroke="rgba(255,93,77,0.55)" strokeWidth={2.5} strokeDasharray="6 10" /> : null}
                  {shot ? <line x1={a0.x} y1={a0.y} x2={c0.x} y2={c0.y} stroke="#fff4c8" strokeWidth={4} style={{ filter: "drop-shadow(0 0 8px #ffb22e)" }} /> : null}
                  <rect x={c0.x - 60} y={c0.y - 52} width={120} height={80} fill="none" stroke={down ? AMB : RED} strokeWidth={2.2} strokeDasharray={down ? "4 6" : undefined} />
                  <text x={c0.x + 70} y={c0.y - 40} fill={down ? AMB : RED} fontFamily={MONO} fontSize={18} letterSpacing={4} style={{ paintOrder: "stroke", stroke: "#000", strokeWidth: 5 }}>{down ? "DERRUBADO · ANTES DO SALTO" : "HEADCRAB"}</text>
                </g>
              );
            })()
          : null}
        {/* o grupo: Alyx à frente, Mossman ao lado */}
        <XMarker e={e} x={-1.3} y={Math.min(y + 2.2, 34)} label="MOSSMAN" col={ICE} f={f} o={P(f, 0, 10) * (f >= actAt + 60 ? 0.6 : 1)} sub={radioOn && f >= mossAt ? "AINDA FALANDO" : undefined} />
        <XMarker e={e} x={ax} y={alyxY} label="ALYX" col={alyxCol} f={f} o={P(f, 0, 10)} sub={f >= actAt ? "AGE · SEM HESITAR" : f >= insecAt ? (insec < 5 ? "SEM INSEGURANÇA" : "INSEGURANÇA CAINDO") : f >= betterAt && f < notAt ? "PARECE MELHOR" : undefined} />
      </svg>
      {crabOn ? (
        <SilhouetteAt e={e} x={1.0} y={CRAB_Y} h={0.75} src="hl3silh/headcrab_silh.png" ar={471 / 516} f={f} o={down ? 0.55 : 1} rim="rgba(255,93,77,0.7)" top="#3a2c22" bot="#0a0806" jitter={down ? 0 : Math.sin(f * 1.3) * 2} />
      ) : null}
      {/* o biomonitor da Alyx, no canto do HUD */}
      <div style={{ position: "absolute", left: 1400, top: 150, width: 430, padding: "14px 18px", borderRadius: 12, background: "rgba(10,8,4,0.82)", border: `1.5px solid ${statusCol}`, fontFamily: MONO, opacity: P(f, 0, 12) }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, letterSpacing: 4 }}>
          <span style={{ color: ORANGE }}>ALYX · SINAIS</span>
          <span style={{ color: statusCol }}>{status}</span>
        </div>
        {[
          { k: "DOR DE CABEÇA", v: pain, at: 0, col: RED },
          { k: "INSEGURANÇA", v: insec, at: insecAt - 6, col: CREAM },
        ].map((r) =>
          f >= r.at ? (
            <div key={r.k} style={{ marginTop: 10, opacity: P(f, r.at, 8) }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, letterSpacing: 3, color: "rgba(242,240,247,0.75)" }}>
                <span>{r.k}</span>
                <span>{`${Math.round(r.v)}%`}</span>
              </div>
              <div style={{ height: 6, marginTop: 4, borderRadius: 3, background: "rgba(255,255,255,0.12)" }}>
                <div style={{ width: `${r.v}%`, height: "100%", borderRadius: 3, background: r.v < 5 ? GREEN : r.col }} />
              </div>
            </div>
          ) : null,
        )}
        {f >= lostAt ? (
          <div style={{ marginTop: 10, opacity: P(f, lostAt, 8) }}>
            <div style={{ fontSize: 13, letterSpacing: 3, color: "rgba(242,240,247,0.75)" }}>FALA · {f >= lostAt + 10 ? "SEM TRAVAR" : "…"}</div>
            <svg width={394} height={34}>
              <polyline points={Array.from({ length: 80 }).map((_, k) => `${k * 5},${17 + Math.sin(k * 0.6 + f * 0.3) * 10 * (f >= lostAt + 10 ? 1 : rnd(Math.floor(k / 6) + Math.floor(f / 5)) > 0.6 ? 1 : 0.1)}`).join(" ")} fill="none" stroke={GREEN} strokeWidth={2} />
            </svg>
          </div>
        ) : null}
      </div>
      {/* o registro de rádio do HEV: a resposta dela começa antes de a pergunta acabar */}
      {radioOn ? (
        <div style={{ position: "absolute", left: 600, top: 120, width: 720, padding: "12px 16px", borderRadius: 10, background: "rgba(6,10,12,0.8)", border: "1.5px solid rgba(159,230,255,0.6)", fontFamily: MONO, opacity: P(f, answerAt - 10, 8) * (1 - P(f, corrAt + 10, 10)) }}>
          <div style={{ fontSize: 13, letterSpacing: 4, color: ICE }}>RÁDIO · REGISTRO</div>
          <svg width={688} height={74} style={{ marginTop: 6 }}>
            {(() => {
              const m0 = tl(answerAt - 6) - 600;
              const m1 = tl(Math.min(f, mossEnd)) - 600;
              const a0 = tl(mossAt + 4) - 600;
              const a1 = tl(f) - 600;
              return (
                <g>
                  <text x={0} y={16} fill={ICE} fontSize={12} letterSpacing={2}>MOSSMAN</text>
                  <rect x={90 + m0} y={6} width={Math.max(0, m1 - m0)} height={14} rx={3} fill={ICE} opacity={0.8} />
                  {f >= mossAt + 4 ? <text x={0} y={50} fill={ORANGE} fontSize={12} letterSpacing={2}>ALYX</text> : null}
                  {f >= mossAt + 4 ? <rect x={90 + a0} y={40} width={Math.max(0, a1 - a0)} height={14} rx={3} fill={ORANGE} opacity={0.9} /> : null}
                  {f >= mossEnd ? (
                    <g opacity={P(f, mossEnd, 8)}>
                      <rect x={90 + a0} y={4} width={m1 - a0} height={52} fill="rgba(255,93,77,0.18)" stroke={RED} strokeWidth={1.5} />
                      <text x={90 + m1 + 8} y={36} fill={RED} fontSize={13} letterSpacing={2}>RESPONDEU ANTES DO FIM</text>
                    </g>
                  ) : null}
                </g>
              );
            })()}
          </svg>
        </div>
      ) : null}
      <Hud f={f} yaw={e.yaw} eye={e} blips={[{ x: ax, y: alyxY, hot: true }, { x: -1.3, y: y + 2.2 }]} msg={f >= gameAt && f < changedAt ? "SEM EXPLICAÇÃO NO SISTEMA" : f >= changedAt ? "ALGO MUDOU NO SALTO" : undefined} msgCol={f >= changedAt ? "#e8f2ff" : AMB} />
      {changed > 0 && f < changedAt + 14 ? <AbsoluteFill style={{ background: `rgba(232,242,255,${0.14 * (1 - (f - changedAt) / 14)})`, pointerEvents: "none" }} /> : null}
      <AbsoluteFill style={{ background: "#000", opacity: interpolate(f, [life - 6, life], [0, 1], C), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ================================================================================================= 45:03 → 46:16 corpos hospedeiros
// a mesma linguagem do mundo dos Shu'ulathoi (larvas em holograma violeta, aprovadas) sem nenhuma footage:
//  · HLAHostBodies: os anéis Combine fecham sobre as larvas (a conquista) → a varredura de uma larva vira cápsula: HOST BODY
//    → a consciência (um orbe dourado): PRESERVADA no arquivo → COPIADA → IMPRESSA na larva → a larva vira Advisor → a fila
//    de Advisors, cada um com um orbe "?" dentro (quem existe ali?) → COMANDO riscado: RECIPIENTES.
//  · HLABreenRecord: o terminal Combine da Mossman: o registro do Breen (o rosto real do HL2, monitor da Cidadela) → MORTO na
//    Cidadela → a transferência dos Advisors (fim do HL2): CORPO ORIGINAL NÃO SALVO → a versão anterior da mente, preservada
//    (o mesmo orbe) → impressa num hospedeiro (a mesma cápsula) → O HOMEM QUE CAIU ≠ A VERSÃO QUE CONTINUOU.
//  · HLACaveRecall: "algo que vimos antes" — o vídeo 07 do Cave volta rebobinando no monitor e a câmera entra nele.
const VIOLET = "#c79bff";
const CYANC = "#5ff3ff";
const GOLD = "#ffd27a";
// a larva em holograma (mesma imagem e tremulação do mundo dos Shu'ulathoi)
const Larva: React.FC<{ f: number; x: number; y: number; h: number; o?: number; tint?: string; lit?: number }> = ({ f, x, y, h, o = 1, tint, lit = 0 }) => {
  const w = h * (404 / 629);
  const br = 1 + 0.02 * Math.sin((f + x) / 13);
  const fl = 0.86 + 0.14 * Math.sin((f + x * 0.37) / 3.1) * Math.sin((f + x) / 23);
  return (
    <g transform={`translate(${x} ${y}) scale(${2 - br} ${br})`} opacity={o * fl}>
      <image href={staticFile("hl3silh/larva_holo.png")} x={-w / 2} y={-h} width={w} height={h} style={{ filter: `drop-shadow(0 0 8px ${tint ?? "rgba(199,155,255,0.6)"})${tint ? " hue-rotate(-60deg) saturate(1.4)" : ""}` }} />
      {lit > 0 ? <ellipse cx={0} cy={-h * 0.62} rx={w * 0.32} ry={h * 0.14} fill={GOLD} opacity={0.35 * lit} style={{ filter: "blur(10px)" }} /> : null}
    </g>
  );
};
// o anel Combine (aro ciano em perspectiva, metade de trás e da frente)
const CRing: React.FC<{ x: number; y: number; rx: number; o: number; front: boolean }> = ({ x, y, rx, o, front }) => (
  <path d={front ? `M ${x - rx} ${y} A ${rx} ${rx * 0.22} 0 0 0 ${x + rx} ${y}` : `M ${x - rx} ${y} A ${rx} ${rx * 0.22} 0 0 1 ${x + rx} ${y}`} fill="none" stroke={CYANC} strokeWidth={front ? 5 : 3} opacity={o * (front ? 1 : 0.55)} style={{ filter: "drop-shadow(0 0 8px rgba(95,243,255,0.8))" }} />
);
// a consciência: um orbe de pontos dourados
const MindOrb: React.FC<{ f: number; x: number; y: number; r: number; o?: number; q?: boolean; seed?: number }> = ({ f, x, y, r, o = 1, q, seed = 0 }) => (
  <g opacity={o}>
    <circle cx={x} cy={y} r={r * 1.6} fill={GOLD} opacity={0.12} style={{ filter: "blur(12px)" }} />
    {Array.from({ length: 34 }).map((_, i) => {
      const a = rnd(i * 3 + seed) * Math.PI * 2 + f / (30 + rnd(i) * 30);
      const d = r * Math.sqrt(rnd(i * 7 + seed));
      return <circle key={i} cx={x + Math.cos(a) * d} cy={y + Math.sin(a) * d * 0.9} r={1.6 + rnd(i * 5) * 2} fill="#fff3d0" opacity={0.6 + 0.4 * Math.sin(f / 5 + i)} />;
    })}
    {q ? <text x={x} y={y + r * 0.35} textAnchor="middle" fill="#fff3d0" fontFamily={FONT} fontWeight={800} fontSize={r * 1.1} opacity={0.9}>?</text> : null}
  </g>
);
// a cápsula hospedeira: base, dois anéis, cabos para cima, a larva dentro
const HostPod: React.FC<{ f: number; x: number; y: number; h: number; o?: number; lit?: number; label?: string; labelCol?: string }> = ({ f, x, y, h, o = 1, lit = 0, label, labelCol = CYANC }) => {
  const rx = h * 0.36;
  return (
    <g opacity={o}>
      {[0.12, 0.88].map((k, i) => <CRing key={`b${i}`} x={x} y={y - h * k} rx={rx} o={1} front={false} />)}
      <Larva f={f} x={x} y={y - h * 0.08} h={h * 0.8} lit={lit} />
      {[0.12, 0.88].map((k, i) => <CRing key={`f${i}`} x={x} y={y - h * k} rx={rx} o={1} front />)}
      <ellipse cx={x} cy={y} rx={rx * 1.15} ry={rx * 0.28} fill="rgba(95,243,255,0.08)" stroke="rgba(95,243,255,0.5)" strokeWidth={2} />
      {[-0.5, 0, 0.5].map((dx, i) => <path key={i} d={`M ${x + dx * rx} ${y - h * 0.9} Q ${x + dx * rx * 1.6} ${y - h * 1.15} ${x + dx * rx * 2.2} ${y - h * 1.35}`} fill="none" stroke="rgba(95,243,255,0.45)" strokeWidth={2} strokeDasharray="5 7" strokeDashoffset={-f * 1.5} />)}
      {label ? <text x={x + rx * 1.3} y={y - h * 0.95} fill={labelCol} fontFamily={MONO} fontSize={Math.max(14, h * 0.05)} letterSpacing={4} style={{ paintOrder: "stroke", stroke: "#000", strokeWidth: 5 }}>{label}</text> : null}
    </g>
  );
};
const HoloBG: React.FC<{ f: number }> = ({ f }) => (
  <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
    <defs>
      <radialGradient id="hbg" cx="0.5" cy="0.55" r="0.75"><stop offset="0" stopColor="#140d22" /><stop offset="1" stopColor="#04030a" /></radialGradient>
    </defs>
    <rect width={1920} height={1080} fill="url(#hbg)" />
    {Array.from({ length: 24 }).map((_, i) => <line key={i} x1={0} x2={1920} y1={760 + i * i * 1.6} y2={760 + i * i * 1.6} stroke="rgba(199,155,255,0.08)" />)}
    {Array.from({ length: 31 }).map((_, i) => <line key={`v${i}`} x1={960 + (i - 15) * 40} y1={760} x2={960 + (i - 15) * 220} y2={1080} stroke="rgba(199,155,255,0.06)" />)}
    <line x1={0} x2={1920} y1={760} y2={760} stroke="rgba(199,155,255,0.25)" strokeWidth={1.5} />
    {void f}
  </svg>
);
const XS = [300, 640, 960, 1280, 1620];
export const HLAHostBodies: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [conqAt, techAt, larvAt, hostAt, contAt, presAt, copyAt, printAt, advAt, whoAt, cmdAt, alsoAt] = ["conqAt", "techAt", "larvAt", "hostAt", "contAt", "presAt", "copyAt", "printAt", "advAt", "whoAt", "cmdAt", "alsoAt"].map((k) => at(p, k));
  // fase A: as cinco larvas e os anéis (0 → techAt) · B: uma larva no centro vira cápsula · C: orbe · D: Advisor · E: a fila
  const focus = P(f, techAt - 4, 24);
  const advK = P(f, advAt - 4, 20);
  const row = P(f, whoAt - 6, 24);
  return (
    <AbsoluteFill style={{ background: "#04030a", overflow: "hidden" }}>
      <HoloBG f={f} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {/* A · a conquista: um anel desce sobre cada larva */}
        {focus < 1
          ? XS.map((x, i) => {
              const t0 = conqAt + i * 12;
              const k = P(f, t0, 18);
              const yRing = 760 - 260 * (1 - k) - 40;
              const keep = i === 2;
              return (
                <g key={i} opacity={keep ? 1 : 1 - focus}>
                  <CRing x={x} y={yRing} rx={120} o={k} front={false} />
                  <Larva f={f} x={x} y={760} h={300} tint={k > 0.9 ? "rgba(95,243,255,0.7)" : undefined} />
                  <CRing x={x} y={yRing} rx={120} o={k} front />
                  {k > 0.95 ? <text x={x} y={820} textAnchor="middle" fill={CYANC} fontFamily={MONO} fontSize={16} letterSpacing={4} opacity={P(f, t0 + 18, 8)}>INCORPORADA</text> : null}
                </g>
              );
            })
          : null}
        {/* B · a larva do meio: a varredura e a cápsula */}
        {focus > 0 && advK < 1
          ? (() => {
              const x = 960 - 240 * P(f, presAt - 10, 20);
              const h = 300 + 200 * focus;
              const scan = f >= techAt && f < hostAt ? ((f - techAt) % 40) / 40 : -1;
              return (
                <g opacity={1 - advK}>
                  {f >= hostAt - 10 ? <HostPod f={f} x={x} y={820} h={h} lit={P(f, printAt + 20, 20)} label={f >= contAt ? "RECIPIENTE" : "HOST BODY · CORPO HOSPEDEIRO"} /> : <Larva f={f} x={x} y={820} h={h} tint="rgba(95,243,255,0.7)" />}
                  {scan >= 0 ? <rect x={x - 200} y={820 - h + scan * h} width={400} height={6} fill={CYANC} opacity={0.75} style={{ filter: "drop-shadow(0 0 10px #5ff3ff)" }} /> : null}
                  {f >= larvAt && f < hostAt + 20 ? (
                    <g opacity={P(f, larvAt, 8)} fontFamily={MONO} fontSize={18} letterSpacing={3}>
                      <line x1={x + 70} y1={820 - h * 0.62} x2={x + 330} y2={820 - h * 0.78} stroke={CYANC} strokeWidth={1.6} />
                      <circle cx={x + 70} cy={820 - h * 0.62} r={8} fill="none" stroke={CYANC} strokeWidth={2} />
                      <text x={x + 340} y={820 - h * 0.78 + 6} fill={CYANC}>MENTE SEM CORPO FIXO</text>
                      <line x1={x + 40} y1={820 - h * 0.3} x2={x + 330} y2={820 - h * 0.3} stroke={CYANC} strokeWidth={1.6} opacity={P(f, larvAt + 12, 8)} />
                      <circle cx={x + 40} cy={820 - h * 0.3} r={8} fill="none" stroke={CYANC} strokeWidth={2} opacity={P(f, larvAt + 12, 8)} />
                      <text x={x + 340} y={820 - h * 0.3 + 6} fill={CYANC} opacity={P(f, larvAt + 12, 8)}>SISTEMA NERVOSO DISTRIBUÍDO</text>
                    </g>
                  ) : null}
                </g>
              );
            })()
          : null}
        {/* C · a consciência: preservada (arquivo) → copiada → impressa na cápsula */}
        {f >= presAt - 10 && advK < 1
          ? (() => {
              const ax = 1180;
              const ay = 520;
              const cp = P(f, copyAt, 14);
              const pr2 = P(f, printAt, 26);
              const px = 720;
              return (
                <g opacity={P(f, presAt - 10, 10) * (1 - advK)}>
                  {/* o arquivo (cilindro) */}
                  <rect x={ax - 70} y={ay - 110} width={140} height={220} rx={20} fill="rgba(255,210,122,0.05)" stroke={GOLD} strokeWidth={2} />
                  <ellipse cx={ax} cy={ay - 110} rx={70} ry={14} fill="none" stroke={GOLD} strokeWidth={2} />
                  <text x={ax} y={ay + 150} textAnchor="middle" fill={GOLD} fontFamily={MONO} fontSize={18} letterSpacing={4}>PRESERVADA</text>
                  <MindOrb f={f} x={interpolate(f, [presAt - 10, presAt + 10], [ax + 340, ax], C)} y={ay} r={44} />
                  {cp > 0 ? (
                    <g>
                      <MindOrb f={f} x={ax + 230 * cp} y={ay} r={44} seed={9} o={pr2 < 1 ? 1 : 0} />
                      <text x={ax + 230} y={ay + 150} textAnchor="middle" fill={GOLD} fontFamily={MONO} fontSize={18} letterSpacing={4} opacity={cp}>COPIADA</text>
                    </g>
                  ) : null}
                  {pr2 > 0 && pr2 < 1 ? <MindOrb f={f} x={ax + 230 + (px - ax - 230) * pr2} y={ay - Math.sin(pr2 * Math.PI) * 160 + (480 - ay) * pr2} r={44 - 14 * pr2} seed={9} /> : null}
                  {pr2 >= 1 ? <text x={px} y={900} textAnchor="middle" fill={GOLD} fontFamily={MONO} fontSize={18} letterSpacing={4} opacity={P(f, printAt + 26, 8)}>IMPRESSA</text> : null}
                </g>
              );
            })()
          : null}
        {/* D/E · os Advisors: a cápsula vira Advisor, depois a fila, cada um com o seu "ocupante ?" */}
        {advK > 0 ? (
          <g opacity={advK}>
            {(row < 1 ? [2] : [0, 1, 2, 3, 4]).map((i) => {
              const big = i === 2 && row < 1;
              const x = big ? 960 : XS[i];
              const y = big ? 520 : 470 + (i % 2) * 40;
              const w = big ? 620 : 300;
              const o = big ? 1 : P(f, whoAt - 6 + Math.abs(i - 2) * 6, 14);
              const cmd = f >= cmdAt && f < alsoAt;
              const rec = f >= alsoAt;
              return (
                <g key={i} opacity={o} transform={`translate(0 ${Math.sin(f / 30 + i) * 8})`}>
                  <AdvisorArt x={x} y={y} w={w} f={f + i * 13} fold={0.2} lit={0.6} id={`hb${i}`} />
                  {f >= whoAt ? (
                    <g opacity={P(f, whoAt + Math.abs(i - 2) * 6, 10)}>
                      <circle cx={x} cy={y - w * 0.3} r={w * 0.13} fill="rgba(10,8,4,0.6)" stroke={GOLD} strokeWidth={2} />
                      <MindOrb f={f} x={x} y={y - w * 0.3} r={w * 0.1} q seed={i * 5} />
                      <line x1={x} y1={y - w * 0.17} x2={x} y2={y - w * 0.05} stroke={GOLD} strokeWidth={1.5} strokeDasharray="3 4" />
                    </g>
                  ) : null}
                  {!big && (cmd || rec) ? (
                    <g fontFamily={MONO} fontSize={18} letterSpacing={4}>
                      <text x={x} y={y - w * 0.5} textAnchor="middle" fill={rec ? "rgba(242,240,247,0.4)" : TXT}>COMANDO</text>
                      {rec ? <line x1={x - 50} x2={x - 50 + 100 * P(f, alsoAt, 8)} y1={y - w * 0.5 - 6} y2={y - w * 0.5 - 6} stroke={RED} strokeWidth={3} /> : null}
                      {rec ? <text x={x} y={y - w * 0.5 - 30} textAnchor="middle" fill={GOLD} opacity={P(f, alsoAt + 6 + i * 3, 8)}>RECIPIENTE</text> : null}
                    </g>
                  ) : null}
                </g>
              );
            })}
            {f >= whoAt ? <text x={960} y={980} textAnchor="middle" fill={GOLD} fontFamily={MONO} fontSize={20} letterSpacing={6} opacity={P(f, whoAt + 10, 10)}>OCUPANTE: ?</text> : null}
          </g>
        ) : null}
      </svg>
      <div style={{ position: "absolute", left: 80, top: 70, fontFamily: MONO, letterSpacing: 6 }}>
        <div style={{ fontSize: 18, color: CYANC }}>TERMINAL COMBINE · REGISTRO BIOLÓGICO</div>
        <div style={{ fontSize: 14, color: "rgba(242,240,247,0.6)", marginTop: 6 }}>{f >= advAt ? "OS ADVISORS" : f >= presAt ? "CONSCIÊNCIAS" : f >= techAt ? "A BIOLOGIA VIRA TECNOLOGIA" : "SHU'ULATHOI · CONQUISTADOS"}</div>
      </div>
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};
export const HLABreenRecord: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [recAt, diedAt, citAt, transAt, hl2At, neverAt, preservedAt, mindAt, printedAt, hostAt, notAt, versionAt, origAt] = ["recAt", "diedAt", "citAt", "transAt", "hl2At", "neverAt", "preservedAt", "mindAt", "printedAt", "hostAt", "notAt", "versionAt", "origAt"].map((k) => at(p, k));
  // dossiê à esquerda (sempre) → a linha da mente à direita → no fim, os dois cartões lado a lado
  const split = P(f, notAt - 6, 18);
  const stamp = (t0: number) => ({ transform: `rotate(-8deg) scale(${interpolate(f, [t0, t0 + 6], [2.2, 1], C)})`, opacity: f >= t0 ? 1 : 0 });
  return (
    <AbsoluteFill style={{ background: "#04030a", overflow: "hidden" }}>
      <HoloBG f={f} />
      {/* o terminal da Mossman */}
      <div style={{ position: "absolute", left: 90, top: 110, width: 1740, height: 860, borderRadius: 18, background: "rgba(4,12,16,0.82)", border: "1.5px solid rgba(95,243,255,0.6)", boxShadow: "0 30px 90px rgba(0,0,0,0.7)", opacity: P(f, 0, 10) }}>
        <div style={{ position: "absolute", left: 30, top: 20, fontFamily: MONO, fontSize: 18, letterSpacing: 5, color: CYANC }}>TERMINAL COMBINE · ACESSO: J. MOSSMAN</div>
        {/* o dossiê */}
        <div style={{ position: "absolute", left: 40, top: 80, width: 560, opacity: P(f, recAt, 10) * (1 - split) }}>
          <div style={{ width: 560, height: 420, borderRadius: 10, overflow: "hidden", position: "relative", background: "#000", border: "2px solid rgba(95,243,255,0.5)" }}>
            <Sequence from={0} layout="none">
              <AbsoluteFill style={{ transform: "scale(1.25)", transformOrigin: "50% 30%" }}>
                <Clip src={CL + "breen_rosto_hq.mp4"} from={0} rate={1} style={{ filter: `saturate(${f >= diedAt ? 0.15 : 0.8}) contrast(1.1) brightness(${f >= diedAt ? 0.75 : 1})` }} />
              </AbsoluteFill>
            </Sequence>
            {f >= diedAt ? (
              <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
                <div style={{ padding: "8px 26px", border: `5px solid ${RED}`, borderRadius: 8, color: RED, fontFamily: FONT, fontWeight: 800, fontSize: 64, background: "rgba(30,4,2,0.55)", ...stamp(diedAt) }}>MORTO</div>
              </AbsoluteFill>
            ) : null}
          </div>
          <div style={{ marginTop: 16, fontFamily: MONO, fontSize: 26, letterSpacing: 4, color: TXT }}>REGISTRO · WALLACE BREEN</div>
          {f >= citAt ? <div style={{ marginTop: 8, fontFamily: MONO, fontSize: 20, letterSpacing: 3, color: RED, opacity: P(f, citAt, 8) }}>QUEDA NA CIDADELA · FIM DO HALF-LIFE 2</div> : null}
        </div>
        {/* a linha da transferência e da mente */}
        <div style={{ position: "absolute", left: 660, top: 90, width: 1040, fontFamily: MONO, opacity: 1 - split }}>
          {f >= transAt ? (
            <div style={{ padding: "16px 20px", borderLeft: `4px solid ${f >= neverAt ? RED : CYANC}`, background: "rgba(95,243,255,0.06)", opacity: P(f, transAt, 8) }}>
              <div style={{ fontSize: 18, letterSpacing: 4, color: CYANC }}>TRANSFERÊNCIA OFERECIDA PELOS ADVISORS</div>
              {f >= hl2At ? <div style={{ fontSize: 15, letterSpacing: 3, color: "rgba(242,240,247,0.65)", marginTop: 4 }}>NO FINAL DO HALF-LIFE 2</div> : null}
              {f >= neverAt ? <div style={{ fontSize: 26, letterSpacing: 3, color: RED, marginTop: 10, opacity: P(f, neverAt, 8) }}>✗ O CORPO ORIGINAL NÃO FOI SALVO</div> : null}
            </div>
          ) : null}
          {f >= preservedAt ? (
            <svg width={1040} height={420} style={{ marginTop: 24, opacity: P(f, preservedAt, 10) }}>
              {/* a versão anterior (orbe) → impressa num hospedeiro (cápsula) */}
              <rect x={60} y={110} width={160} height={240} rx={22} fill="rgba(255,210,122,0.05)" stroke={GOLD} strokeWidth={2} />
              <MindOrb f={f} x={140} y={230} r={50} />
              <text x={140} y={390} textAnchor="middle" fill={GOLD} fontSize={17} letterSpacing={3}>{f >= mindAt ? "A MENTE · VERSÃO ANTERIOR" : "PRESERVADA ANTES"}</text>
              {f >= printedAt - 20 ? (
                <g>
                  <path d="M 240 230 C 420 140, 560 140, 720 230" fill="none" stroke={GOLD} strokeWidth={3} strokeDasharray={`${700 * P(f, printedAt - 20, 24)} 700`} />
                  {P(f, printedAt - 20, 24) > 0.05 && P(f, printedAt - 20, 24) < 1 ? <MindOrb f={f} x={240 + 480 * P(f, printedAt - 20, 24)} y={230 - Math.sin(P(f, printedAt - 20, 24) * Math.PI) * 70} r={26} seed={4} /> : null}
                </g>
              ) : null}
              {f >= printedAt ? <HostPod f={f} x={820} y={380} h={300} lit={P(f, printedAt + 4, 16)} o={P(f, printedAt - 6, 10)} /> : null}
              {f >= hostAt ? <text x={820} y={410} textAnchor="middle" fill={CYANC} fontSize={17} letterSpacing={3} opacity={P(f, hostAt, 8)}>IMPRESSA NUM CORPO HOSPEDEIRO</text> : null}
            </svg>
          ) : null}
        </div>
        {/* o fim: o homem que caiu ≠ a versão que continuou */}
        {split > 0 ? (
          <div style={{ position: "absolute", inset: 0, opacity: split }}>
            <div style={{ position: "absolute", left: 130, top: 120, width: 600, height: 520, borderRadius: 14, overflow: "hidden", border: `2px solid ${RED}` }}>
              <Sequence from={0} layout="none">
                <AbsoluteFill style={{ transform: "scale(1.25)", transformOrigin: "50% 30%" }}>
                  <Clip src={CL + "breen_rosto_hq.mp4"} from={0} rate={1} style={{ filter: "saturate(0.1) contrast(1.1) brightness(0.7)" }} />
                </AbsoluteFill>
              </Sequence>
            </div>
            <div style={{ position: "absolute", left: 130, top: 670, width: 600, textAlign: "center", fontFamily: MONO, fontSize: 22, letterSpacing: 4, color: RED }}>O HOMEM QUE CAIU NA CIDADELA</div>
            <div style={{ position: "absolute", left: 0, right: 0, top: 330, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 110, color: TXT }}>≠</div>
            <svg width={700} height={560} style={{ position: "absolute", left: 1010, top: 100 }}>
              <HostPod f={f} x={350} y={520} h={440} lit={1} />
              <MindOrb f={f} x={350} y={260} r={40} o={0.8} />
            </svg>
            <div style={{ position: "absolute", left: 1010, top: 670, width: 700, textAlign: "center", fontFamily: MONO, fontSize: 22, letterSpacing: 4, color: GOLD, opacity: P(f, versionAt, 8) }}>A VERSÃO QUE CONTINUOU</div>
            {f >= origAt ? <div style={{ position: "absolute", left: 1010, top: 710, width: 700, textAlign: "center", fontFamily: MONO, fontSize: 16, letterSpacing: 3, color: "rgba(242,240,247,0.65)", opacity: P(f, origAt, 8) }}>DEPOIS QUE O ORIGINAL MORREU</div> : null}
          </div>
        ) : null}
      </div>
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};
export const HLACaveRecall: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const meaningAt = at(p, "meaningAt");
  // o vídeo 07 volta: rebobinando (linhas de fita, tempo andando para trás) → para no Cave → a câmera mergulha na tela
  const rew = f < meaningAt + 10;
  const dive = P(f, life - 18, 18);
  return (
    <AbsoluteFill style={{ background: "#050403", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 960 - 520 * (1 + 0.85 * dive), top: 540 - 300 * (1 + 0.85 * dive), width: 1040 * (1 + 0.85 * dive), height: 600 * (1 + 0.85 * dive), borderRadius: 20, overflow: "hidden", border: "10px solid #1c1812", boxShadow: "0 40px 120px rgba(0,0,0,0.8)", opacity: P(f, 0, 8) }}>
        <CaveFilm f={rew ? 900 - f * 6 : f} w={1040 * (1 + 0.85 * dive)} h={600 * (1 + 0.85 * dive)} />
        {rew ? (
          <AbsoluteFill>
            {Array.from({ length: 6 }).map((_, i) => <div key={i} style={{ position: "absolute", left: 0, right: 0, top: `${((f * 9 + i * 17) % 100)}%`, height: 6, background: "rgba(255,255,255,0.18)" }} />)}
            <div style={{ position: "absolute", left: 30, top: 24, fontFamily: MONO, fontSize: 26, letterSpacing: 4, color: TXT }}>◀◀ GRAVAÇÃO 07</div>
          </AbsoluteFill>
        ) : null}
        <div style={{ position: "absolute", left: 30, bottom: 24, fontFamily: MONO, fontSize: 20, letterSpacing: 4, color: CREAM, opacity: P(f, meaningAt, 10) }}>ALGO QUE JÁ VIMOS · OUTRO SIGNIFICADO</div>
      </div>
      <AbsoluteFill style={{ background: "#000", opacity: interpolate(f, [life - 4, life], [0, 1], C), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ================================================================================================= 46:39 a planta da GLaDOS
// "GLaDOS! Pode ter começado como uma tentativa de reproduzir uma tecnologia que ela sequer compreendia": a prancha azul da
// Aperture; a GLaDOS se desenha (o suporte no teto, os segmentos do corpo, a cabeça com o olho amarelo); cada peça traz a
// etiqueta da peça Combine de onde foi copiada; os pontos que ninguém entendeu ficam com "?" vermelho; o medidor
// COMPREENSÃO sobe e trava em 31%.
const GL_PARTS: { d: string; at: number; lab: string; lx: number; ly: number; q?: [number, number] }[] = [
  // o suporte no teto e o trilho
  { d: "M 760 120 L 1160 120 L 1130 175 L 790 175 Z M 900 175 L 1020 175 L 1000 215 L 920 215 Z", at: 0, lab: "SUPORTE · CÓPIA DO PAINEL COMBINE", lx: 1200, ly: 150 },
  // a coluna articulada que desce
  { d: "M 945 215 L 975 215 L 985 300 L 935 300 Z M 930 300 L 990 300 L 1010 330 L 915 330 Z", at: 6, lab: "", lx: 0, ly: 0 },
  // o corpo: a carcaça curva pendurada (placas brancas)
  { d: "M 905 330 C 850 380 860 480 950 525 C 1040 560 1120 520 1125 450 C 1130 390 1070 335 1005 330 Z M 930 380 C 960 400 1040 400 1080 380 M 905 450 C 960 480 1050 480 1110 455", at: 12, lab: "NÚCLEO · ARQUITETURA COMBINE", lx: 1180, ly: 430, q: [1050, 440] },
  // o pescoço
  { d: "M 930 520 C 905 560 890 590 880 625 L 915 640 C 925 600 945 565 965 535 Z", at: 18, lab: "", lx: 0, ly: 0 },
  // a cabeça alongada, inclinada para a frente, com a lente
  { d: "M 935 640 C 900 610 820 620 760 660 C 700 700 690 760 735 780 C 790 805 880 770 935 720 C 970 690 965 660 935 640 Z M 760 700 C 800 690 860 680 905 665", at: 24, lab: "CABEÇA · SENSOR (ORIGEM: BOREALIS)", lx: 1000, ly: 760, q: [880, 735] },
];
export const HLAGladosPlan: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [nameAt, tryAt, reprAt, techAt, notAt, fullAt] = ["nameAt", "tryAt", "reprAt", "techAt", "notAt", "fullAt"].map((k) => at(p, k));
  const und = interpolate(f, [reprAt, notAt], [0, 31], C);
  const stuck = f >= notAt;
  return (
    <AbsoluteFill style={{ background: "#0b2a44", overflow: "hidden" }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {Array.from({ length: 46 }).map((_, i) => <line key={i} x1={0} x2={1920} y1={i * 24} y2={i * 24} stroke="rgba(255,255,255,0.06)" />)}
        {Array.from({ length: 80 }).map((_, i) => <line key={`v${i}`} x1={i * 24} x2={i * 24} y1={0} y2={1080} stroke="rgba(255,255,255,0.04)" />)}
        <rect x={60} y={60} width={1800} height={960} fill="none" stroke="rgba(232,244,255,0.5)" strokeWidth={2} />
        {/* o teto e os cabos */}
        <line x1={600} x2={1320} y1={120} y2={120} stroke="#e8f4ff" strokeWidth={3} />
        {[700, 760, 1160, 1220].map((x, i) => <path key={i} d={`M ${x} 120 Q ${x + (i < 2 ? -60 : 60)} 300 ${x + (i < 2 ? -20 : 20)} 520`} fill="none" stroke="rgba(232,244,255,0.45)" strokeWidth={2} strokeDasharray={`${600 * P(f, i * 5, 30)} 600`} />)}
        {/* as peças desenhando */}
        {GL_PARTS.map((pt, i) => {
          const k = P(f, nameAt + pt.at, 16);
          return (
            <g key={i}>
              <path d={pt.d} fill={`rgba(232,244,255,${0.06 * k})`} stroke="#e8f4ff" strokeWidth={2.5} strokeDasharray={`${1400 * k} 1400`} />
              {pt.lab && f >= techAt - 10 + i * 3 ? (
                <g opacity={P(f, techAt - 10 + i * 3, 8)}>
                  <line x1={pt.lx - 20} y1={pt.ly} x2={pt.lx - 120} y2={pt.ly} stroke={CYANC} strokeWidth={1.5} />
                  <text x={pt.lx} y={pt.ly + 6} fill={CYANC} fontFamily={MONO} fontSize={18} letterSpacing={3}>{pt.lab}</text>
                </g>
              ) : null}
              {pt.q && f >= notAt + i * 2 ? (
                <g opacity={P(f, notAt + i * 2, 6)}>
                  <circle cx={pt.q[0]} cy={pt.q[1]} r={26} fill="rgba(60,6,4,0.6)" stroke={RED} strokeWidth={2.5} />
                  <text x={pt.q[0]} y={pt.q[1] + 11} textAnchor="middle" fill={RED} fontFamily={FONT} fontWeight={800} fontSize={32}>?</text>
                </g>
              ) : null}
            </g>
          );
        })}
        {/* o olho */}
        <circle cx={748} cy={738} r={20} fill={`rgba(255,200,60,${0.2 + 0.7 * P(f, nameAt + 30, 10)})`} stroke="#ffd27a" strokeWidth={3} style={{ filter: "drop-shadow(0 0 14px #ffb22e)" }} />
        {/* o carimbo do projeto */}
        <g transform="translate(150 880)" fontFamily={MONO} fill="#e8f4ff">
          <rect x={0} y={0} width={520} height={110} fill="none" stroke="rgba(232,244,255,0.6)" strokeWidth={1.5} />
          <text x={16} y={34} fontSize={20} letterSpacing={3}>APERTURE SCIENCE · PROJETO G.L.a.D.O.S.</text>
          <text x={16} y={66} fontSize={15} letterSpacing={2} opacity={0.75}>{f >= tryAt ? "TENTATIVA DE REPRODUÇÃO" : "DESENHO PRELIMINAR"}</text>
          <text x={16} y={94} fontSize={15} letterSpacing={2} opacity={0.75}>FONTE: MATERIAL DO BOREALIS</text>
        </g>
      </svg>
      {/* o medidor de compreensão */}
      {f >= reprAt - 6 ? (
        <div style={{ position: "absolute", left: 1290, top: 880, width: 480, fontFamily: MONO, opacity: P(f, reprAt - 6, 8) }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18, letterSpacing: 4, color: stuck ? RED : "#e8f4ff" }}>
            <span>COMPREENSÃO</span>
            <span>{`${Math.round(und)}%`}</span>
          </div>
          <div style={{ height: 12, marginTop: 8, borderRadius: 6, background: "rgba(232,244,255,0.15)" }}>
            <div style={{ width: `${und}%`, height: "100%", borderRadius: 6, background: stuck ? RED : "#e8f4ff" }} />
          </div>
          {f >= fullAt ? <div style={{ marginTop: 8, fontSize: 15, letterSpacing: 3, color: RED, opacity: Math.floor(f / 8) % 2 ? 1 : 0.4 }}>NÃO COMPREENDIDO · COPIADO MESMO ASSIM</div> : null}
        </div>
      ) : null}
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life, 6), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ================================================================================================= 47:42 perpetuidade (POV)
// a MESMA sala do casulo: na parede direita, uma tela de propaganda Combine com PERPETUIDADE · A PROMESSA → "deixa de
// parecer uma promessa grandiosa": a tela falha e apaga em faixas → a câmera vira para o casulo (o Breen) → o painel do
// HUD: O QUE O BREEN QUERIA · CONTINUAR ✓ · SOBREVIVER ✗ (sem frase solta no meio do POV).
export const HLAPerpPod: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [perpAt, promAt, gordonAt, wantedAt, contAt, notAt, survAt] = ["perpAt", "promAt", "gordonAt", "wantedAt", "contAt", "notAt", "survAt"].map((k) => at(p, k));
  const cam = (fr: number): Eye => ({
    x: 0.3 + 0.1 * Math.sin(fr / 80),
    y: keys(fr, [[0, 3.2], [gordonAt, 3.6], [life, 4.6]]),
    z: 1.65 + 0.02 * Math.sin(fr / 9),
    yaw: keys(fr, [[0, 0.62], [gordonAt - 10, 0.66], [gordonAt + 30, 0.02], [life, 0]]),
    pitch: -0.03,
    F: 980,
  });
  const e = cam(f);
  const fail = P(f, promAt, 26);
  const bandOff = (k: number) => f >= promAt + k * 3 && rnd(k * 13 + Math.floor(f / 3)) > 0.35;
  return (
    <AbsoluteFill style={{ background: "#020304", overflow: "hidden" }}>
      <HLXPod {...({ life, final: 1, podAt: -60, cablesAt: -60, larvalAt: -60, looksAt: -90, advAt: 1e9, voiceAt: 1e9, freemanAt: 1e9, breenAt: -60, believesAt: 1e9, mossAt: 1e9, cam, noHud: true } as unknown as PR)} />
      {/* a tela de propaganda na parede direita */}
      <Pinned e={e} w={640} h={360} corners={[[5.9, 11.2, 3.45], [5.9, 6.4, 3.45], [5.9, 6.4, 1.05], [5.9, 11.2, 1.05]]}>
        <div style={{ width: 640, height: 360, background: "radial-gradient(ellipse at 50% 45%, #1a6a74 0%, #062024 90%)", position: "relative", overflow: "hidden", fontFamily: FONT, color: "#effeff", border: "6px solid #0a1214", boxShadow: "0 0 60px rgba(95,243,255,0.5)", boxSizing: "border-box" }}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 46, textAlign: "center", opacity: P(f, perpAt - 20, 10) * (1 - 0.85 * fail) }}>
            <svg width={120} height={120}>
              <circle cx={60} cy={60} r={52} fill="none" stroke="#5ff3ff" strokeWidth={6} />
              <path d="M 34 44 L 60 70 L 86 44 M 34 64 L 60 90 L 86 64" fill="none" stroke="#5ff3ff" strokeWidth={8} strokeLinejoin="round" />
            </svg>
            <div style={{ fontWeight: 800, fontSize: 52, letterSpacing: 4, marginTop: 6 }}>PERPETUIDADE</div>
            <div style={{ fontFamily: MONO, fontSize: 18, letterSpacing: 6, marginTop: 6, color: "#5ff3ff" }}>A PROMESSA DOS COMBINE</div>
          </div>
          {/* a falha: faixas apagando, ruído */}
          {f >= promAt ? Array.from({ length: 12 }).map((_, k) => (bandOff(k) ? <div key={k} style={{ position: "absolute", left: 0, right: 0, top: k * 30, height: 30, background: k % 3 ? "rgba(0,0,0,0.85)" : "rgba(95,243,255,0.25)" }} /> : null)) : null}
          <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.22) 0px, rgba(0,0,0,0.22) 2px, rgba(0,0,0,0) 2px, rgba(0,0,0,0) 4px)" }} />
        </div>
      </Pinned>
      {/* o painel do HUD: o que o Breen queria */}
      {f >= wantedAt - 6 ? (
        <div style={{ position: "absolute", left: 90, top: 150, width: 470, padding: "14px 18px", borderRadius: 12, background: "rgba(14,10,6,0.86)", border: `1.5px solid ${ORANGE}`, fontFamily: MONO, opacity: P(f, wantedAt - 6, 8) }}>
          <div style={{ fontSize: 14, letterSpacing: 5, color: ORANGE }}>WALLACE BREEN · O QUE ELE QUERIA</div>
          {[
            { k: "CONTINUAR", ok: true, at: contAt },
            { k: "SOBREVIVER", ok: false, at: survAt },
          ].map((r) =>
            f >= r.at - 4 ? (
              <div key={r.k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, padding: "10px 14px", background: "rgba(255,255,255,0.04)", borderLeft: `4px solid ${r.ok ? GREEN : RED}`, opacity: P(f, r.at - 4, 8) }}>
                <span style={{ fontSize: 28, letterSpacing: 4, color: TXT }}>{r.k}</span>
                <span style={{ fontSize: 30, color: r.ok ? GREEN : RED }}>{r.ok ? "✓" : "✗"}</span>
              </div>
            ) : null,
          )}
          {f >= notAt ? <div style={{ marginTop: 10, fontSize: 14, letterSpacing: 3, color: "rgba(242,240,247,0.7)", opacity: P(f, notAt, 8) }}>TALVEZ NÃO SEJAM A MESMA COISA</div> : null}
        </div>
      ) : null}
      <Hud f={f} yaw={e.yaw} eye={e} blips={[{ x: 0, y: 9.2, hot: true }]} msg={f >= gordonAt && f < wantedAt ? "O GORDON OLHA PARA O CASULO" : undefined} msgCol={CREAM} />
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life), pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};

// ================================================================================================= 48:57 a emboscada (POV)
// 08/10 (pedido dele: os Hunters atravessavam as paredes e tinham os pés cortados) — refeita com física de verdade:
// a mesma sala do casulo; o alarme → o grupo RECUA até perto do casulo (a câmera vê a porta inteira e o piso) → o
// corredor escuro atrás da porta: o primeiro Hunter vem andando por ele, visto SÓ pelo vão da porta (recortado no
// batente), passa a porta e entra na sala → o segundo vem atrás → disparos de flechette saindo deles → a Mossman é
// atingida: Gordon se ajoelha ao lado dela (a câmera desce e vira; os Hunters saem do quadro sozinhos) → os DADOS
// passam para o HEV → a fala dela no rádio → os sinais zeram → NOVO OBJETIVO.
const DOOR_X = 1.03; // vão livre da porta (por dentro do batente aceso)
const DOOR_H = 2.4;
const HUNT_H = 2.25; // cabe no vão (a porta tem 2,4 m)
const doorClip = (e: Eye): string | null => {
  const pts = [proj(e, [-DOOR_X, 0, 0]), proj(e, [DOOR_X, 0, 0]), proj(e, [DOOR_X, 0, DOOR_H]), proj(e, [-DOOR_X, 0, DOOR_H])];
  if (pts.some((q) => !q)) return null;
  return `polygon(${pts.map((q) => `${q!.x.toFixed(1)}px ${q!.y.toFixed(1)}px`).join(", ")})`;
};
// um Hunter: sombra no chão, silhueta com luz de borda, os dois olhos acesos; o passo pesado sobe e desce o corpo.
// Atrás da parede (y < 0) só aparece pelo vão da porta; dentro da sala, na frente de tudo que está atrás dele.
const HunterWalk: React.FC<{ e: Eye; x: number; y: number; f: number; o: number; seed: number; step: number }> = ({ e, x, y, f, o, seed, step }) => {
  const base = proj(e, [x, y, 0]);
  const head = proj(e, [x, y, HUNT_H]);
  if (!base || !head || o <= 0) return null;
  const H = base.y - head.y;
  const W = H * (480 / 512);
  const bob = -Math.abs(Math.sin(step)) * H * 0.025;
  const sh = proj(e, [x, y, 0]);
  const clip = y < 0.05 ? doorClip(e) : null;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: o, clipPath: clip ?? undefined, pointerEvents: "none" }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {sh ? <ellipse cx={sh.x} cy={sh.y} rx={W * 0.42} ry={Math.max(4, W * 0.07)} fill="rgba(0,0,0,0.7)" style={{ filter: "blur(6px)" }} /> : null}
      </svg>
      <SilhouetteAt e={e} x={x} y={y} h={HUNT_H} src="hl3silh/hunter_peca.png" ar={480 / 512} f={f + seed * 9} o={1} rim="rgba(120,200,255,0.7)" top="#1c2632" bot="#05070a" bob={bob} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {[0.39, 0.5].map((v, i) => <circle key={i} cx={base.x - W / 2 + W * 0.47} cy={head.y + bob + H * v} r={Math.max(3, H * 0.035)} fill="#bff4ff" style={{ filter: `drop-shadow(0 0 ${Math.max(4, H * 0.04)}px #6fd8ff)` }} />)}
      </svg>
    </div>
  );
};
export const HLAAmbush: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [combAt, onlyAt, vulnAt, huntersAt, ambushAt, hitAt, dieAt, dataAt, quoteAt, eliAt, deadAt, explainAt] = ["combAt", "onlyAt", "vulnAt", "huntersAt", "ambushAt", "hitAt", "dieAt", "dataAt", "quoteAt", "eliAt", "deadAt", "explainAt"].map((k) => at(p, k));
  const G = useMemo(() => buildPodRoom(), []);
  const DOOR: V3 = [0, 0, 1.2];
  // a Mossman correu para trás dos consoles (lado oposto da porta): quando ela é atingida, a câmera vira para ela e os
  // Hunters saem do quadro sozinhos
  const mx = 2.9;
  const my = 3.9;
  // câmera: nos terminais (como na cena anterior) → vira para a porta e recua até perto do casulo → treme no tiroteio
  // → quando ela é atingida, desce (ajoelha) e vira para ela
  const shake = f >= ambushAt && f < hitAt + 20 ? Math.sin(f * 2.3) * 0.01 : 0;
  const kneel = P(f, hitAt + 4, 30);
  const e: Eye = {
    x: keys(f, [[0, 0.5], [hitAt + 4, 0.5], [hitAt + 34, 1.6]]),
    y: keys(f, [[0, 2.6], [combAt, 2.6], [combAt + 50, 5.4], [hitAt + 4, 5.4], [hitAt + 34, 4.8]]),
    z: 1.65 - 0.75 * kneel + 0.015 * Math.sin(f / 9),
    yaw: keys(f, [[0, 0.62], [combAt - 4, 0.62], [combAt + 34, -3.05], [hitAt + 4, -3.05], [hitAt + 34, -4.12], [life, -4.1]]) + shake,
    pitch: keys(f, [[0, -0.05], [hitAt + 4, -0.04], [hitAt + 34, -0.4], [life, -0.42]]) + shake * 0.6,
    F: 980,
  };
  const alarm = f >= combAt && Math.floor((f - combAt) / 12) % 2 === 0;
  const firing = f >= ambushAt && f < hitAt + 30;
  const hit = f >= hitAt;
  // os Hunters: o primeiro desce o corredor e entra; o segundo vem logo atrás e abre para a direita
  const STEP = 13;
  const h1: [number, number] = [keys(f, [[huntersAt, -0.1], [ambushAt, -0.1], [ambushAt + 30, -0.8]]), keys(f, [[huntersAt - 40, -5.6], [huntersAt + 30, -0.6], [ambushAt, 0.2], [ambushAt + 30, 0.7]])];
  const h2: [number, number] = [keys(f, [[ambushAt + 20, 0.0], [hitAt, 0.0], [hitAt + 30, 1.0]]), keys(f, [[ambushAt - 30, -5.6], [ambushAt + 20, -1.4], [hitAt, 0.1], [hitAt + 30, 0.5]])];
  const walking1 = f >= huntersAt - 40 && f < ambushAt + 30;
  const walking2 = f >= ambushAt - 30 && f < hitAt + 30;
  const step1 = walking1 ? (f / STEP) * Math.PI : 0;
  const step2 = walking2 ? (f / STEP) * Math.PI + 1.3 : 0;
  const lights: XL[] = [
    { x: 0, y: 9.2, z: 1.6, col: [60, 255, 225], k: 0.25, r: 6.5 },
    { x: 0, y: 0.6, z: 2.6, col: [255, 60, 40], k: alarm ? 0.7 : 0.15, r: 7 },
    // a luz azulada do corredor quando eles vêm (os olhos/lanternas dos Hunters)
    { x: 0, y: -2.5, z: 1.6, col: [120, 200, 255], k: f >= huntersAt - 40 ? 0.45 : 0, r: 5 },
    ...((firing && rnd(Math.floor(f / 2)) > 0.6) ? [{ x: 0, y: 0.8, z: 1.4, col: [200, 230, 255] as RGB, k: 1.1, r: 9 }] : []),
  ];
  const fall = P(f, hitAt + 2, 18);
  const vit = hit ? interpolate(f, [hitAt, deadAt], [92, 0], C) : 88;
  const dead = f >= deadAt;
  const data = interpolate(f, [dataAt, dataAt + 70], [0, 1], C);
  const quote = (t: string, t0: number) => t.slice(0, Math.max(0, Math.floor((f - t0) * 1.3)));
  // ordem de desenho: o que está mais longe primeiro (o segundo Hunter vem atrás do primeiro)
  const hs = [
    { k: 1, x: h1[0], y: h1[1], on: f >= huntersAt - 40, step: step1 },
    { k: 2, x: h2[0], y: h2[1], on: f >= ambushAt - 30, step: step2 },
  ].sort((a, b) => Math.hypot(b.x - e.x, b.y - e.y) - Math.hypot(a.x - e.x, a.y - e.y));
  const dclip = doorClip(e);
  return (
    <AbsoluteFill style={{ background: "#020304", overflow: "hidden" }}>
      <XView e={e} faces={G} lights={lights} flash={0.9} amb={0.07} />
      <PodRingsView e={e} />
      {alarm ? <AbsoluteFill style={{ background: "rgba(255,40,30,0.07)" }} /> : null}
      {/* soldados Combine no fundo do corredor (só pelo vão da porta) */}
      {f >= ambushAt - 10 && dclip ? (
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none", clipPath: dclip }}>
          {[[-0.45, -4.6], [0.5, -5.2]].map(([x, y], i) => {
            const top = proj(e, [x, y, 1.75]);
            const base = proj(e, [x, y, 0]);
            if (!top || !base) return null;
            return (
              <g key={i} opacity={P(f, ambushAt - 10 + i * 6, 8)}>
                <line x1={base.x} y1={base.y} x2={top.x} y2={top.y} stroke={RED} strokeWidth={2} />
                <ellipse cx={base.x} cy={base.y} rx={14} ry={4} fill="none" stroke={RED} strokeWidth={1.5} />
                <circle cx={top.x} cy={top.y} r={5} fill={RED} style={{ filter: "drop-shadow(0 0 6px #ff5a4a)" }} />
              </g>
            );
          })}
        </svg>
      ) : null}
      {hs.map((h) => (h.on ? <HunterWalk key={h.k} e={e} x={h.x} y={h.y} f={f} o={1} seed={h.k} step={h.step} /> : null))}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {/* os disparos: flechettes saindo dos Hunters para dentro da sala */}
        {firing
          ? [h1, h2].map((h, j) =>
              Array.from({ length: 2 }).map((_, i) => {
                if ((j === 1 && f < ambushAt + 20) || rnd(Math.floor(f / 2) * 3 + i + j * 7) < 0.5) return null;
                const a = proj(e, [h[0], h[1] + 0.3, HUNT_H * 0.55]);
                const b = proj(e, [-2.5 + rnd(f * 7 + i + j) * 5, 3.5 + rnd(f + i * 3 + j) * 4, 0.6 + rnd(f * 3 + i) * 1.6]);
                return a && b ? <line key={`${j}${i}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={i % 2 ? "#9ff8ff" : "#d6fbff"} strokeWidth={3} opacity={0.9} style={{ filter: "drop-shadow(0 0 6px #9ff8ff)" }} /> : null;
              }),
            )
          : null}
        {/* a porta: o único acesso */}
        <Call e={e} pt={DOOR} f={f} from={onlyAt} until={huntersAt - 10} text="O ÚNICO ACESSO" sub="ELES VÊM POR AQUI" col={RED} dx={200} dy={-150} />
        {/* o grupo */}
        <XMarker e={e} x={-1.6} y={2.6} label="ALYX" col={ORANGE} f={f} o={P(f, combAt + 40, 10) * (f >= hitAt + 10 ? 0 : 1)} sub={f >= vulnAt && f < hitAt ? "SEM COBERTURA" : undefined} />
        {(() => {
          const base = proj(e, [mx, my, 0]);
          const topUp = proj(e, [mx, my, 1.75]);
          const topDown = proj(e, [mx + 0.3, my - 0.9, 0.2]);
          if (!base || !topUp || !topDown) return null;
          const tx = topUp.x + (topDown.x - topUp.x) * fall;
          const ty = topUp.y + (topDown.y - topUp.y) * fall;
          const col = dead ? "rgba(242,240,247,0.5)" : hit ? RED : ICE;
          return (
            <g opacity={P(f, combAt + 40, 10)}>
              <ellipse cx={base.x} cy={base.y} rx={Math.min(120, 240 / Math.max(1, base.d))} ry={Math.min(30, 60 / Math.max(1, base.d))} fill="none" stroke={col} strokeWidth={2} strokeDasharray="6 5" />
              <line x1={base.x} y1={base.y} x2={tx} y2={ty} stroke={col} strokeWidth={2} />
              <g style={{ filter: dead ? "grayscale(1) brightness(0.7)" : undefined }}>
                <FlagBadge cx={tx} by={ty} k={1.05} label="MOSSMAN" col={col} f={f} sub={dead ? "SEM SINAIS" : hit ? "ATINGIDA" : f >= vulnAt ? "SEM COBERTURA" : undefined} />
              </g>
              {f >= hitAt && f < hitAt + 10 ? <circle cx={topUp.x} cy={topUp.y + 60} r={30 + (f - hitAt) * 9} fill="none" stroke={RED} strokeWidth={4} opacity={1 - (f - hitAt) / 10} /> : null}
              {/* os dados saindo dela para o HEV (canto de baixo à esquerda) */}
              {data > 0 && data < 1
                ? Array.from({ length: 6 }).map((_, i) => {
                    const t = (data * 3 + i / 6) % 1;
                    return <circle key={i} cx={tx + (330 - tx) * t} cy={ty + (800 - ty) * t} r={5} fill={GREEN} opacity={0.9} style={{ filter: "drop-shadow(0 0 6px #8dffa8)" }} />;
                  })
                : null}
            </g>
          );
        })()}
      </svg>
      {/* biomonitor da Mossman (HUD) */}
      {hit ? (
        <div style={{ position: "absolute", right: 90, top: 150, width: 430, padding: "14px 18px", borderRadius: 12, background: "rgba(14,4,4,0.86)", border: `1.5px solid ${dead ? "rgba(242,240,247,0.4)" : RED}`, fontFamily: MONO, opacity: P(f, hitAt, 8) }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, letterSpacing: 4 }}>
            <span style={{ color: RED }}>J. MOSSMAN · SINAIS</span>
            <span style={{ color: dead ? "rgba(242,240,247,0.6)" : RED }}>{dead ? "SEM SINAIS" : "CRÍTICO"}</span>
          </div>
          <svg width={394} height={60} style={{ marginTop: 8 }}>
            <polyline points={Array.from({ length: 80 }).map((_, k) => { const ph = ((k * 5 + f * 4) % 160 + 160) % 160; const amp = dead ? 0 : vit / 92; return `${k * 5},${30 - (ph > 60 && ph < 66 ? 24 * amp : ph > 66 && ph < 70 ? -12 * amp : 0)}`; }).join(" ")} fill="none" stroke={dead ? "rgba(242,240,247,0.5)" : RED} strokeWidth={2.4} />
          </svg>
          <div style={{ fontSize: 26, color: dead ? "rgba(242,240,247,0.6)" : RED }}>{`${Math.round(vit)} BPM`}</div>
        </div>
      ) : null}
      {/* os dados no HEV */}
      {f >= dataAt ? (
        <div style={{ position: "absolute", left: 90, top: 780, width: 520, padding: "12px 16px", borderRadius: 10, background: "rgba(6,14,8,0.85)", border: `1.5px solid ${GREEN}`, fontFamily: MONO, color: GREEN, opacity: P(f, dataAt, 8) }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, letterSpacing: 4 }}>
            <span>{data >= 1 ? "DADOS RECEBIDOS · MOSSMAN" : "RECEBENDO DADOS · MOSSMAN"}</span>
            <span>{`${Math.round(data * 100)}%`}</span>
          </div>
          <div style={{ height: 8, marginTop: 8, borderRadius: 4, background: "rgba(141,255,168,0.15)" }}>
            <div style={{ width: `${data * 100}%`, height: "100%", borderRadius: 4, background: GREEN }} />
          </div>
        </div>
      ) : null}
      {/* a fala dela: o rádio do HEV — onda da voz + a frase digitada, a segunda parte em laranja */}
      {f >= quoteAt - 6 ? (
        <div style={{ position: "absolute", left: 90, top: 150, width: 700, padding: "16px 22px 18px", borderRadius: 12, background: "rgba(6,10,14,0.9)", border: `1.5px solid ${ICE}`, borderLeft: `5px solid ${ICE}`, fontFamily: MONO, opacity: P(f, quoteAt - 6, 8) * (1 - 0.35 * P(f, explainAt, 20)) }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, letterSpacing: 5, color: ICE }}>
            <span>RÁDIO · J. MOSSMAN</span>
            <span style={{ color: dead ? "rgba(242,240,247,0.5)" : RED }}>{dead ? "SINAL PERDIDO" : "SINAL FRACO"}</span>
          </div>
          <svg width={656} height={40} style={{ marginTop: 8 }}>
            {Array.from({ length: 82 }).map((_, i) => {
              const h = dead ? 2 : 3 + Math.abs(Math.sin(f / 3.4 + i * 0.7) * Math.sin(f / 9 + i * 0.3)) * 26 * (rnd(Math.floor(f / 3) + i) > 0.25 ? 1 : 0.1);
              return <rect key={i} x={i * 8} y={20 - h / 2} width={5} height={h} fill={ICE} opacity={0.75} />;
            })}
          </svg>
          <div style={{ marginTop: 10, fontFamily: FONT, fontWeight: 700, fontSize: 34, lineHeight: 1.25, color: TXT }}>
            {quote("“Gordon, o Borealis é uma arma.”", quoteAt)}
            {f < eliAt - 14 ? <span style={{ opacity: Math.floor(f / 8) % 2, color: ICE }}>▍</span> : null}
          </div>
          {f >= eliAt - 14 ? (
            <div style={{ marginTop: 4, fontFamily: FONT, fontWeight: 700, fontSize: 34, lineHeight: 1.25, color: ORANGE }}>
              {quote("“Você não pode deixar o Eli destruí-lo.”", eliAt - 14)}
              {!dead ? <span style={{ opacity: Math.floor(f / 8) % 2 }}>▍</span> : null}
            </div>
          ) : null}
        </div>
      ) : null}
      <Hud f={f} yaw={e.yaw} eye={e} blips={[{ x: h1[0], y: h1[1], hot: true }, ...(f >= ambushAt - 30 ? [{ x: h2[0], y: h2[1], hot: true }] : []), { x: mx, y: my }]} msg={f >= explainAt ? "NOVO OBJETIVO · NÃO DEIXAR O ELI DESTRUIR O BOREALIS" : f >= hitAt && f < dataAt ? "MOSSMAN ATINGIDA" : f >= huntersAt - 40 && f < hitAt ? "HUNTERS NO CONVÉS" : f >= combAt && f < huntersAt - 40 ? "CONTATO · COMBINE" : undefined} msgCol={f >= explainAt ? GREEN : RED} />
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ================================================================================================= 56:25 a chegada no litoral
// a travessia termina em branco → a sala de terminais da instalação Combine (a mesma da cena seguinte) aparece; o Dog ao
// lado; o mapa do HEV: o navio ficou longe (NÃO É O NAVIO), o ponto deles: INSTALAÇÃO COMBINE · LITORAL DO ÁRTICO.
export const HLACoastArrive: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [notAt, surgeAt, instAt, coastAt] = ["notAt", "surgeAt", "instAt", "coastAt"].map((k) => at(p, k));
  const G = useMemo(() => buildCoastRoom(), []);
  const e: Eye = { x: 0.3 * Math.sin(f / 90), y: 0.6, z: 1.65 + 0.03 * Math.sin(f / 7) * (1 - P(f, 20, 30)), yaw: keys(f, [[0, -0.6], [surgeAt, -0.4], [instAt, 0.1], [life, 0.35]]), pitch: keys(f, [[0, -0.25], [30, 0]]), F: 950 };
  const white = interpolate(f, [0, 14], [1, 0], C);
  const lights: XL[] = [
    { x: 0, y: 9.4, z: 1.6, col: [90, 210, 230], k: 0.45, r: 7 },
    { x: -4.3, y: 3.9, z: 1.2, col: [255, 150, 70], k: 0.2, r: 4 },
  ];
  const map = P(f, notAt - 4, 10);
  const pin = P(f, coastAt - 6, 10);
  return (
    <AbsoluteFill style={{ background: "#020304", overflow: "hidden" }}>
      <XView e={e} faces={G} lights={lights} flash={0.85} amb={0.08} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <XMarker e={e} x={-1.6} y={2.4} label="DOG" col={ICE} f={f} o={P(f, 10, 10)} sub={f >= instAt ? "FAREJANDO" : undefined} />
      </svg>
      {/* o mapa do HEV */}
      {map > 0 ? (
        <div style={{ position: "absolute", right: 90, top: 140, width: 520, height: 360, borderRadius: 12, background: "rgba(4,10,14,0.88)", border: `1.5px solid ${AMB}`, overflow: "hidden", opacity: map, fontFamily: MONO }}>
          <svg width={520} height={360} style={{ position: "absolute", inset: 0 }}>
            <rect width={520} height={360} fill="#07121a" />
            {/* costa */}
            <path d="M 0 210 Q 60 190 110 205 T 220 195 Q 280 170 330 190 T 450 175 L 520 182 L 520 360 L 0 360 Z" fill="#1a2630" stroke="rgba(190,225,255,0.5)" strokeWidth={1.5} />
            {Array.from({ length: 8 }).map((_, i) => <line key={i} x1={i * 70} x2={i * 70} y1={0} y2={360} stroke="rgba(255,178,46,0.06)" />)}
            {/* o navio, longe */}
            <g transform="translate(110 80)" opacity={0.85}>
              <path d="M -18 4 L 18 4 L 13 11 L -13 11 Z M -9 4 L -9 -5 L 5 -5 L 5 4" fill="none" stroke={ICE} strokeWidth={2} />
              <text y={30} textAnchor="middle" fill={ICE} fontSize={13} letterSpacing={2}>BOREALIS</text>
            </g>
            {f >= notAt ? <line x1={130} y1={95} x2={370} y2={220} stroke={RED} strokeWidth={2} strokeDasharray="6 6" opacity={P(f, notAt, 10)} /> : null}
            {/* o ponto deles */}
            {f >= surgeAt - 4 ? (
              <g transform="translate(380 228)" opacity={P(f, surgeAt - 4, 8)}>
                <circle r={9} fill={ORANGE} />
                <circle r={14 + 10 * ((f / 20) % 1)} fill="none" stroke={ORANGE} strokeWidth={2} opacity={1 - ((f / 20) % 1)} />
              </g>
            ) : null}
          </svg>
          <div style={{ position: "absolute", left: 14, top: 10, fontSize: 13, letterSpacing: 4, color: AMB }}>H.E.V. · POSIÇÃO</div>
          {f >= notAt ? <div style={{ position: "absolute", left: 14, top: 32, fontSize: 15, letterSpacing: 3, color: RED, opacity: P(f, notAt, 8) }}>NÃO É O NAVIO</div> : null}
          {f >= instAt ? <div style={{ position: "absolute", left: 14, bottom: 34, fontSize: 16, letterSpacing: 3, color: ORANGE, opacity: P(f, instAt, 8) }}>INSTALAÇÃO COMBINE</div> : null}
          {f >= coastAt ? <div style={{ position: "absolute", left: 14, bottom: 12, fontSize: 14, letterSpacing: 3, color: "rgba(242,240,247,0.8)", opacity: pin }}>LITORAL DO ÁRTICO</div> : null}
        </div>
      ) : null}
      <Hud f={f} yaw={e.yaw} eye={e} blips={[{ x: -1.6, y: 2.4 }]} msg={f >= instAt ? "INSTALAÇÃO COMBINE" : f >= surgeAt ? "LOCAL DESCONHECIDO" : undefined} msgCol={AMB} />
      <AbsoluteFill style={{ background: "#fff", opacity: white, pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};
