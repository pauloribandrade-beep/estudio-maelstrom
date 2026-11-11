// =================================================================================================
// HL3 · REFORMULAÇÃO 2 (06/10/2026, noite). Plantas 3D em wireframe (o mesmo motor da estação de 5A, hl3rs),
// para LUGARES: o interior do Borealis com o grupo guiado pela Alyx (39:42) e a instalação Combine presa ao casco
// (43:39). Cada coisa entra na palavra; pessoas são marcadores; tudo o que entra tem um som no edit.json.
// =================================================================================================
import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { FONT, MONO } from "./overlays";
import { C, Clip, HL, rnd } from "./hl3";
import { FilmLook, decode } from "./hl3r";
import { Cam, Key, PP, camAt, pr } from "./hl3rs";
import { loadFont as loadCaveatW } from "@remotion/google-fonts/Caveat";
import { AdvisorArt, FLAG_NAMES, FlagBadge, XView, mk, type RGB, type XF, type XL } from "./hl3rx";
import { Eye as EyeF, Hud as HudF, Lights as LightsF, RoomView, proj } from "./hl3rf";
import { buildShipCorridor } from "./hl3rb";
import { HLRRupture } from "./hl3r6b";

const { fontFamily: HANDW } = loadCaveatW();

const ICE = "#9fe6ff";
const RED = "#ff5d4d";
const AMB = "#ffb22e";
const CREAM = "#ffe2b0";
const CYAN = "#5ff3ff";
const GREEN = "#8dffa8";
const APT = "#f2f0ea";
const ORANGE = HL.orange;
const TXT = HL.text;
const P = (f: number, at: number, d = 12) => interpolate(f, [at, at + d], [0, 1], { ...C, easing: Easing.out(Easing.cubic) });
const IO = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
type V = [number, number, number];
type PR = Record<string, number> & { life: number };
const A = (p: PR, k: string) => (p[k] as number | undefined) ?? 1e9;

// ---------------------------------------------------------------- caixa de ferramentas do wireframe
const mkW = (c: Cam) => {
  const out: React.ReactNode[] = [];
  let n = 0;
  const behind = (ps: V[]) => ps.some((p) => pr(c, p[0], p[1], p[2])[2] < 1.5);
  const line = (ps: V[], col: string, w = 1.4, o = 1, dash?: string) => {
    if (o <= 0.001 || behind(ps)) return;
    out.push(<polyline key={n++} points={PP(c, ps)} fill="none" stroke={col} strokeWidth={w} opacity={o} strokeDasharray={dash} strokeLinejoin="round" />);
  };
  const poly = (ps: V[], fill: string, stroke?: string, w = 1, o = 1) => {
    if (o <= 0.001 || behind(ps)) return;
    out.push(<polygon key={n++} points={PP(c, ps)} fill={fill} stroke={stroke} strokeWidth={w} opacity={o} />);
  };
  // sala: piso, paredes translúcidas subindo até h*b, bordas
  const room = (x: number, y: number, w: number, d: number, h: number, b: number, col: string, fill: string, wall: string) => {
    if (b <= 0) return;
    const z = h * b;
    const fl: V[] = [[x, y, 0], [x + w, y, 0], [x + w, y + d, 0], [x, y + d, 0]];
    poly(fl, fill);
    for (let k = 0; k < 4; k++) {
      const p0 = fl[k];
      const p1 = fl[(k + 1) % 4];
      poly([p0, p1, [p1[0], p1[1], z], [p0[0], p0[1], z]], wall);
      line([[p0[0], p0[1], z], [p1[0], p1[1], z]], col, 1.5, 0.95);
      line([p0, [p0[0], p0[1], z]], col, 1.1, 0.6);
    }
    line([...fl, fl[0]], col, 1.6, 0.9);
  };
  const box = (x: number, y: number, w: number, d: number, z0: number, h: number, col: string, fill: string, o = 1) => {
    const b: V[] = [[x, y, z0], [x + w, y, z0], [x + w, y + d, z0], [x, y + d, z0]];
    const t: V[] = b.map((p) => [p[0], p[1], z0 + h]);
    poly(t, fill, undefined, 1, o);
    line([...b, b[0]], col, 1, 0.6 * o);
    line([...t, t[0]], col, 1.2, 0.9 * o);
    for (let i = 0; i < 4; i++) line([b[i], t[i]], col, 1, 0.6 * o);
  };
  const cyl = (x: number, y: number, r: number, z0: number, h: number, col: string, o = 1) => {
    const N = 16;
    const ring = (z: number) => Array.from({ length: N + 1 }).map((_, i) => [x + r * Math.cos((i / N) * Math.PI * 2), y + r * Math.sin((i / N) * Math.PI * 2), z] as V);
    poly(ring(z0 + h).slice(0, N), "rgba(159,230,255,0.05)", undefined, 1, o);
    line(ring(z0), col, 1, 0.55 * o);
    line(ring(z0 + h), col, 1.3, 0.9 * o);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + 0.4;
      line([[x + r * Math.cos(a), y + r * Math.sin(a), z0], [x + r * Math.cos(a), y + r * Math.sin(a), z0 + h]], col, 0.8, 0.45 * o);
    }
  };
  const text = (p: V, s: string, col: string, size = 18, o = 1, anchor: "start" | "middle" = "middle") => {
    const q = pr(c, p[0], p[1], p[2]);
    if (q[2] < 2 || o <= 0) return;
    out.push(
      <text key={n++} x={q[0]} y={q[1]} textAnchor={anchor} fill={col} fontFamily={MONO} fontSize={size} letterSpacing={3} opacity={o} style={{ paintOrder: "stroke", stroke: "rgba(0,0,0,0.75)", strokeWidth: 4 }}>
        {s}
      </text>,
    );
  };
  // marcador de pessoa: ponto com haste e anel no chão
  const person = (x: number, y: number, col: string, label?: string, o = 1, ring = 0, sub?: string) => {
    if (o <= 0) return;
    const g = pr(c, x, y, 0.02);
    const h = pr(c, x, y, 1.8);
    if (g[2] < 2) return;
    const s = Math.max(0.6, Math.min(2, 900 / g[2] / 20));
    out.push(
      <g key={n++} opacity={o}>
        <ellipse cx={g[0]} cy={g[1]} rx={14 * s} ry={6 * s} fill="none" stroke={col} strokeWidth={1.6} />
        {ring > 0 ? <ellipse cx={g[0]} cy={g[1]} rx={(14 + ring * 40) * s} ry={(6 + ring * 17) * s} fill="none" stroke={col} strokeWidth={2} opacity={1 - ring} /> : null}
        <line x1={g[0]} y1={g[1]} x2={h[0]} y2={h[1]} stroke={col} strokeWidth={2} />
        {label && FLAG_NAMES.has(label) ? <FlagBadge cx={h[0]} by={h[1]} k={Math.max(0.7, Math.min(1.2, s))} label={label} col={col} f={0} sub={sub} /> : <circle cx={h[0]} cy={h[1]} r={6 * s} fill={col} />}
        {label && !FLAG_NAMES.has(label) ? (
          <text x={h[0] + 12 * s} y={h[1] - 6} fill={col} fontFamily={MONO} fontSize={Math.max(13, 15 * s)} letterSpacing={3} style={{ paintOrder: "stroke", stroke: "rgba(0,0,0,0.8)", strokeWidth: 4 }}>
            {label}
          </text>
        ) : null}
        {sub && !(label && FLAG_NAMES.has(label)) ? (
          <text x={h[0] + 12 * s} y={h[1] + 16} fill="rgba(242,240,247,0.8)" fontFamily={MONO} fontSize={Math.max(12, 13 * s)} letterSpacing={2} style={{ paintOrder: "stroke", stroke: "rgba(0,0,0,0.8)", strokeWidth: 4 }}>
            {sub}
          </text>
        ) : null}
      </g>,
    );
  };
  return { out, line, poly, room, box, cyl, text, person };
};
const camK = (f: number, ks: Key[]) => camAt(f, ks);
// posição ao longo de uma rota (lista de pontos) para t em 0..1
const along = (pts: [number, number][], t: number): [number, number] => {
  const seg = pts.slice(1).map((q, i) => Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1]));
  const L = seg.reduce((s, v) => s + v, 0);
  let d = Math.max(0, Math.min(1, t)) * L;
  for (let i = 0; i < seg.length; i++) {
    if (d <= seg[i]) {
      const k = d / Math.max(0.001, seg[i]);
      return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k];
    }
    d -= seg[i];
  }
  return pts[pts.length - 1];
};
const Shell: React.FC<{ f: number; life: number; children: React.ReactNode; bg?: string }> = ({ f, life, children, bg = "#04070a" }) => (
  <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 45%, ${bg} 0%, #010203 80%)`, overflow: "hidden" }}>
    {children}
    <AbsoluteFill style={{ background: "#000", opacity: interpolate(f, [0, 8], [1, 0], C) + interpolate(f, [life - 6, life], [0, 1], C), pointerEvents: "none" }} />
    <FilmLook />
  </AbsoluteFill>
);
const Corner: React.FC<{ f: number; at: number; t: string; sub?: string; col?: string }> = ({ f, at, t, sub, col = ICE }) => (
  <div style={{ position: "absolute", left: 80, top: 64, fontFamily: MONO, letterSpacing: 6, opacity: P(f, at, 10) }}>
    <div style={{ fontSize: 20, color: col }}>{decode(t, f, at, 2.4)}</div>
    {sub ? <div style={{ fontSize: 15, color: "rgba(242,240,247,0.6)", marginTop: 6 }}>{decode(sub, f, at + 6, 2.6)}</div> : null}
  </div>
);

// ================================================================================================= 39:42 a Alyx guia
// planta do interior do Borealis: casco, corredor A → cruzamento → (leste: beco) / (norte: corredor C) → a ala antiga
// da Aperture (branca, ergue-se na palavra); porões ao sul. O grupo anda com a Alyx à frente; ela PARA (anel); no
// cruzamento ESCOLHE (duas setas, uma acende); "?" quando não lembra por quê; corredores "lembrados" (verde, tracejado)
// deslizam até coincidir com os reais = RECONHECE O NAVIO; perto da Aperture o sinal dela fica mais forte (anéis).
const HULL: [number, number][] = [[-52, -20], [26, -20], [44, -6], [48, 6], [30, 34], [-52, 34]];
type Rm = { x: number; y: number; w: number; d: number; n?: string; apt?: boolean };
const DECK: Rm[] = [
  { x: -46, y: -2, w: 46, d: 4, n: "CORREDOR A" },
  { x: 0, y: -4, w: 6, d: 8, n: "CRUZAMENTO" },
  { x: 6, y: -2, w: 22, d: 4, n: "CORREDOR B" },
  { x: 1, y: 4, w: 4, d: 12, n: "CORREDOR C" },
  { x: -40, y: -16, w: 14, d: 11, n: "PORÃO 1" },
  { x: -24, y: -16, w: 14, d: 11, n: "PORÃO 2" },
  { x: -8, y: -16, w: 12, d: 11 },
  { x: -40, y: 5, w: 16, d: 9 },
  { x: -22, y: 5, w: 14, d: 9 },
];
const APTR: Rm[] = [
  { x: -8, y: 16, w: 14, d: 12, n: "LAB 01", apt: true },
  { x: 6, y: 16, w: 14, d: 12, n: "CÂMARA 03", apt: true },
  { x: 20, y: 16, w: 8, d: 12, n: "ARQUIVO", apt: true },
];
const ROUTE: [number, number][] = [[-42, 0], [-14, 0], [3, 0], [3, 10], [3, 15], [0, 22]];
export const HLWGuide: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [guideAt, notAt, stopAt, chooseAt, forgetAt, clearAt, recogAt, closerAt, aptAt, strongAt] = ["guideAt", "notAt", "stopAt", "chooseAt", "forgetAt", "clearAt", "recogAt", "closerAt", "aptAt", "strongAt"].map((k) => A(p, k));
  // andamento do grupo: anda → para (stop) → anda até o cruzamento (choose) → espera → segue para o norte (closer)
  const t = interpolate(f, [0, stopAt, stopAt + 26, chooseAt, recogAt, closerAt, life], [0, 0.32, 0.32, 0.52, 0.52, 0.62, 0.86], C);
  const lead = along(ROUTE, t + 0.035);
  const grp = [0, 0.02, 0.035, 0.05].map((dt) => along(ROUTE, t - dt));
  const c = camK(f, [
    [0, -36, 0, 0, 0.3, 0.42, 22],
    [stopAt, -22, 0, 0, 0.15, 0.55, 26],
    [chooseAt, -2, 2, 0, -0.1, 0.62, 30],
    [recogAt, 2, 5, 0, -0.3, 0.7, 36],
    [aptAt, 4, 13, 0, -0.45, 0.76, 44],
    [life, 5, 17, 0, -0.55, 0.8, 42],
  ]);
  const W = mkW(c);
  // chão em grade + casco
  for (let i = 0; i <= 20; i++) W.line([[-52 + i * 5, -20, 0], [-52 + i * 5, 34, 0]], "rgba(159,230,255,0.05)", 1);
  for (let i = 0; i <= 11; i++) W.line([[-52, -20 + i * 5, 0], [48, -20 + i * 5, 0]], "rgba(159,230,255,0.05)", 1);
  W.line([...HULL.map((q) => [q[0], q[1], 0] as V), [HULL[0][0], HULL[0][1], 0]], "rgba(159,230,255,0.55)", 2.2);
  W.line([...HULL.map((q) => [q[0], q[1], 3.4] as V), [HULL[0][0], HULL[0][1], 3.4]], "rgba(159,230,255,0.25)", 1.2, 1, "6 6");
  HULL.forEach((q) => W.line([[q[0], q[1], 0], [q[0], q[1], 3.4]], "rgba(159,230,255,0.25)", 1));
  // costelas do casco (ferrugem, curvas)
  for (let i = 0; i < 9; i++) W.line([[-48 + i * 9, -20, 0], [-48 + i * 9, -20.8, 1.6], [-48 + i * 9, -20, 3.4]], "rgba(159,230,255,0.3)", 1.2);
  // salas do navio
  DECK.forEach((r, i) => {
    W.room(r.x, r.y, r.w, r.d, 3, P(f, 2 + i * 2, 14), "rgba(159,230,255,0.7)", "rgba(159,230,255,0.035)", "rgba(159,230,255,0.03)");
    if (r.n) W.text([r.x + r.w / 2, r.y + r.d / 2, 0.05], r.n, ICE, 13, 0.7);
  });
  // carga nos porões
  for (let k = 0; k < 10; k++) W.box(-39 + (k % 5) * 5.4, -15 + Math.floor(k / 5) * 5, 2.4, 2.4, 0, 1.4 + rnd(k) * 1.2, "rgba(159,230,255,0.45)", "rgba(159,230,255,0.05)");
  // a ala da Aperture: só se ergue em "Aperture" (branca)
  const apt = P(f, aptAt, 30);
  APTR.forEach((r) => {
    W.room(r.x, r.y, r.w, r.d, 3.2, apt, `rgba(242,240,234,${0.85})`, "rgba(242,240,234,0.06)", "rgba(242,240,234,0.05)");
    if (apt > 0.5) W.text([r.x + r.w / 2, r.y + r.d / 2, 0.05], r.n ?? "", APT, 14, apt);
  });
  if (apt > 0) {
    // painéis da câmara de teste e o anel de portal
    for (let k = 0; k < 5; k++) W.box(7 + k * 2.6, 26.6, 2.3, 1, 0, 2.6 * apt, "rgba(242,240,234,0.6)", "rgba(242,240,234,0.08)");
    W.cyl(13, 21, 1.4, 0, 0.1 * apt, "rgba(120,190,255,0.9)");
    W.text([7, 15.2, 3.6], "APERTURE SCIENCE", APT, 18, apt, "start");
  }
  // corredores "lembrados" (verde, tracejado) deslizando até coincidir
  const rec = P(f, recogAt, 50);
  if (f >= recogAt) {
    const off = (1 - rec) * 7;
    [DECK[1], DECK[3]].forEach((r) => {
      const ps: V[] = [[r.x + off, r.y - off * 0.6, 0.05], [r.x + r.w + off, r.y - off * 0.6, 0.05], [r.x + r.w + off, r.y + r.d - off * 0.6, 0.05], [r.x + off, r.y + r.d - off * 0.6, 0.05], [r.x + off, r.y - off * 0.6, 0.05]];
      W.line(ps, GREEN, 2.4, 0.9 * (1 - 0.4 * rec), "8 6");
    });
    if (rec > 0.95) W.text([3, 4, 3.6], "IGUAL AO QUE ELA LEMBRA", GREEN, 16, P(f, recogAt + 50, 10));
  }
  // setas da escolha no cruzamento
  if (f >= chooseAt && f < closerAt + 30) {
    const k = P(f, chooseAt, 10);
    const pick = f >= chooseAt + 18;
    W.line([[6, 0, 0.1], [12, 0, 0.1]], pick ? "rgba(159,230,255,0.35)" : ICE, 3, k);
    W.line([[11, -1, 0.1], [12, 0, 0.1], [11, 1, 0.1]], pick ? "rgba(159,230,255,0.35)" : ICE, 3, k);
    W.line([[3, 4, 0.1], [3, 10, 0.1]], pick ? ORANGE : ICE, pick ? 4.5 : 3, k);
    W.line([[2, 9, 0.1], [3, 10, 0.1], [4, 9, 0.1]], pick ? ORANGE : ICE, pick ? 4.5 : 3, k);
  }
  // o grupo
  grp.forEach((q, i) => W.person(q[0], q[1], [ICE, GREEN, GREEN, AMB][i], i === 0 ? "MOSSMAN" : i === 3 ? "GORDON" : undefined, 1));
  const stopped = f >= stopAt && f < stopAt + 26;
  const ringK = stopped ? ((f - stopAt) % 26) / 26 : f >= strongAt ? ((f - strongAt) % 20) / 20 : 0;
  W.person(lead[0], lead[1], f >= recogAt ? GREEN : ORANGE, f >= guideAt ? "ALYX" : undefined, P(f, 0, 10), ringK, stopped ? "PARA" : f >= forgetAt && f < recogAt ? "POR QUÊ?" : f >= chooseAt && f < forgetAt ? "ESCOLHE O NORTE" : f >= strongAt ? "SINAL MAIS FORTE" : undefined);
  // o "?" que falha (não lembra)
  // 08/10 (pedido dele): o "?" fica centrado logo ACIMA do card da Alyx (antes caía em cima da foto)
  const hg = pr(c, lead[0], lead[1], 0.02);
  const hh = pr(c, lead[0], lead[1], 1.8);
  const hk = Math.max(0.7, Math.min(1.2, Math.max(0.6, Math.min(2, 900 / hg[2] / 20))));
  const hq = [hh[0], hh[1] - (112 + 26) * hk - 14 * hk, hg[2]];
  const qOn = f >= forgetAt && f < recogAt;
  return (
    <Shell f={f} life={life}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {W.out}
        {qOn && hq[2] > 2 ? (
          <text x={hq[0] + (rnd(Math.floor(f / 3)) - 0.5) * 4} y={hq[1]} textAnchor="middle" fill={ORANGE} fontFamily={FONT} fontWeight={800} fontSize={54 * hk} style={{ paintOrder: "stroke", stroke: "rgba(0,0,0,0.8)", strokeWidth: 5 }} opacity={Math.floor(f / 4) % 3 ? 1 : 0.3}>
            ?
          </text>
        ) : null}
      </svg>
      <Corner f={f} at={0} t="O BOREALIS · CONVÉS INFERIOR" sub={f >= aptAt ? "AS PARTES ANTIGAS DA APERTURE" : "A ALYX GUIA O GRUPO"} col={f >= aptAt ? APT : ICE} />
      {/* medidor: o reconhecimento dela */}
      {f >= recogAt ? (
        <div style={{ position: "absolute", right: 90, top: 70, width: 360, fontFamily: MONO, opacity: P(f, recogAt, 10) }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, letterSpacing: 4, color: GREEN }}>
            <span>RECONHECIMENTO</span>
            <span>{`${Math.round(interpolate(f, [recogAt, aptAt, strongAt + 30], [12, 46, 93], C))}%`}</span>
          </div>
          <div style={{ height: 8, marginTop: 8, borderRadius: 4, background: "rgba(141,255,168,0.15)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${interpolate(f, [recogAt, aptAt, strongAt + 30], [12, 46, 93], C)}%`, background: GREEN, boxShadow: `0 0 12px ${GREEN}` }} />
          </div>
        </div>
      ) : null}
      {void notAt}
      {void clearAt}
    </Shell>
  );
};

// ================================================================================================= 43:39 presa ao casco
// a câmera desce os conveses (contador 3 → 5) e encontra, rente ao casco curvo, um módulo Combine inteiro FUNDIDO no
// metal (costura acesa); por dentro: zumbis de armadura (marcadores com capacete), máquinas piscando e girando
// sozinhas, e riscos de contagem nas paredes, cada vez mais.
export const HLWStuckBase: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [belowAt, instAt, hullAt, zombAt, armorAt, equipAt, aloneAt, marksAt, stuckAt] = ["belowAt", "instAt", "hullAt", "zombAt", "armorAt", "equipAt", "aloneAt", "marksAt", "stuckAt"].map((k) => A(p, k));
  const c = camK(f, [
    [0, 4, -6, 14, 0.25, 0.9, 40],
    [instAt, 4, -7, 0, 0.35, 0.7, 34],
    [zombAt, 0, -8, 0, 0.45, 0.72, 20],
    [equipAt, 11, -9, 0, 0.7, 0.7, 18],
    [marksAt, 4, -4, 1, 0.1, 0.3, 14],
    [life, 4, -4, 1, 0.05, 0.25, 12],
  ]);
  const W = mkW(c);
  const deck = Math.round(interpolate(f, [0, instAt], [3, 5], C));
  // os conveses de cima passando (descendo)
  const drop = interpolate(f, [0, instAt], [0, 14], C);
  for (let L = 1; L <= 3; L++) {
    const z = L * 4.5 - drop + 14;
    if (z < 0.2 || z > 30) continue;
    W.line([[-30, -14, z], [30, -14, z], [30, 14, z], [-30, 14, z], [-30, -14, z]], "rgba(159,230,255,0.25)", 1.2);
    for (let i = 0; i < 12; i++) W.line([[-30 + i * 5, -14, z], [-30 + i * 5, 14, z]], "rgba(159,230,255,0.07)", 1);
  }
  // o casco curvo (costelas) ao sul
  for (let i = 0; i < 13; i++) {
    const x = -30 + i * 5;
    W.line(Array.from({ length: 8 }).map((_, k) => [x, -14 - Math.sin((k / 7) * Math.PI) * 2.2, (k / 7) * 9] as V), "rgba(159,230,255,0.45)", 1.4);
  }
  W.line(Array.from({ length: 13 }).map((_, i) => [-30 + i * 5, -14, 0] as V), "rgba(159,230,255,0.6)", 2);
  // o módulo Combine fundido ao casco
  const inst = P(f, instAt, 30);
  const mod: [number, number, number, number][] = [
    [-8, -13, 9, 8],
    [1, -13, 7, 11],
    [8, -13, 8, 8],
  ];
  mod.forEach(([x, y, w, d], i) => {
    W.room(x, y, w, d, 3.4, Math.max(0, Math.min(1, inst * 1.5 - i * 0.2)), "rgba(95,243,255,0.85)", "rgba(95,243,255,0.05)", "rgba(10,30,36,0.35)");
    // nervuras Combine na parede
    for (let k = 0; k < Math.floor(w / 1.5); k++) W.line([[x + 0.8 + k * 1.5, y + d, 0], [x + 0.8 + k * 1.5, y + d, 3.4 * inst]], "rgba(95,243,255,0.4)", 1);
  });
  // a costura acesa onde o módulo fundiu no casco
  const seam = P(f, hullAt, 16);
  if (seam > 0) {
    W.line(Array.from({ length: 25 }).map((_, i) => [-8 + i * 1, -13.2 + Math.sin(i * 1.7) * 0.25, 0.1 + 3.2 * (i % 2 ? 0.4 : 0.6) * 0] as V), "#ffd27a", 3, seam * (0.7 + 0.3 * Math.sin(f / 4)));
    W.line([[-8, -13.2, 3.4], [16, -13.2, 3.4]], "#ffd27a", 2.4, seam * 0.8, "4 3");
    W.text([4, -13.6, 4.2], "FUNDIDA AO CASCO", "#ffd27a", 16, seam);
  }
  if (inst > 0.4) W.text([1, -8, 4.6], "INSTALAÇÃO COMBINE", CYAN, 18, P(f, instAt + 12, 10));
  // zumbis de armadura: marcadores vermelhos com capacete (arrastando)
  const zs: [number, number][] = [[-5, -9], [-2.5, -7], [3, -6], [5.5, -10]];
  zs.forEach(([x, y], i) => {
    const o = P(f, zombAt + i * 5, 10);
    if (o <= 0) return;
    const sx = x + Math.sin(f / 30 + i) * 0.4;
    W.person(sx, y, RED, i === 2 ? (f >= armorAt ? "ZUMBI · AINDA DE ARMADURA" : "ZUMBI") : undefined, o);
    const h = pr(c, sx, y, 1.95);
    if (h[2] > 2 && f >= armorAt) W.out.push(<path key={`hel${i}`} d={`M ${h[0] - 10} ${h[1] + 2} Q ${h[0]} ${h[1] - 16} ${h[0] + 10} ${h[1] + 2} Z`} fill="none" stroke={CYAN} strokeWidth={2} opacity={P(f, armorAt + i * 4, 8)} />);
  });
  // máquinas funcionando sozinhas
  const eq = P(f, equipAt, 12);
  [[9, -12, 2.5, 2], [12.5, -12, 2.5, 2], [9, -8, 2, 1.6]].forEach(([x, y, w, d], i) => {
    W.box(x, y, w, d, 0, 1.6 * eq, "rgba(95,243,255,0.75)", "rgba(95,243,255,0.06)", eq);
    const lt = pr(c, x + w / 2, y + d / 2, 1.7);
    if (eq > 0 && lt[2] > 2) W.out.push(<circle key={`lt${i}`} cx={lt[0]} cy={lt[1]} r={5} fill={Math.floor((f + i * 7) / 9) % 2 ? GREEN : "rgba(141,255,168,0.2)"} />);
  });
  if (f >= aloneAt) W.text([11, -6.5, 2.6], "LIGADAS SOZINHAS", GREEN, 15, P(f, aloneAt, 8));
  // riscos de contagem na parede do fundo (y = -5 do módulo do meio), aumentando
  const nMarks = f >= marksAt ? Math.min(46, Math.floor((f - marksAt) / 2)) : 0;
  for (let k = 0; k < nMarks; k++) {
    const g = Math.floor(k / 5);
    const j = k % 5;
    const x = 1.4 + g * 0.6 + j * 0.1;
    const z0 = 0.6 + (Math.floor(g / 9) * 0.9);
    if (j === 4) W.line([[x - 0.45, -2.05, z0 + 0.1], [x + 0.05, -2.05, z0 + 0.55]], CREAM, 1.6, 0.9);
    else W.line([[x, -2.05, z0], [x, -2.05, z0 + 0.6]], CREAM, 1.6, 0.9);
  }
  if (f >= stuckAt) W.text([4, -2.4, 3.2], "QUEM FICOU PRESO TEMPO DEMAIS", CREAM, 15, P(f, stuckAt, 8));
  return (
    <Shell f={f} life={life} bg="#05090c">
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {W.out}
      </svg>
      <Corner f={f} at={0} t={f >= instAt ? "PRESA AO CASCO" : "MAIS ABAIXO"} sub={`CONVÉS ${deck}`} col={f >= instAt ? CYAN : ICE} />
      {void belowAt}
    </Shell>
  );
};

// ================================================================================================= 40:37 os arquivos do Cave
// gravador de rolo (bobinas girando, onda da voz, GRAVAÇÃO 07 · C. JOHNSON) → a pasta abre: PROJETO (planta de uma
// estrutura Combine), IMAGEM (foto real da Cidadela, footage) e DADOS → carimbo TECNOLOGIA COMBINE → linha do tempo:
// as fitas ficam ANTES da invasão; Aperture "INVENTOU" riscado; seta do futuro (o Borealis) até o passado → carimbo
// COPIEM TUDO · C. JOHNSON e as cópias se multiplicando em pilhas.
const Reel: React.FC<{ x: number; y: number; r: number; a: number }> = ({ x, y, r, a }) => (
  <g transform={`translate(${x} ${y}) rotate(${a})`}>
    <circle r={r} fill="#14110c" stroke="#c8b48a" strokeWidth={3} />
    <circle r={r * 0.78} fill="#2a2116" />
    {[0, 1, 2].map((k) => (
      <path key={k} d={`M 0 0 L ${Math.cos((k / 3) * Math.PI * 2) * r * 0.7} ${Math.sin((k / 3) * Math.PI * 2) * r * 0.7} A ${r * 0.7} ${r * 0.7} 0 0 1 ${Math.cos((k / 3) * Math.PI * 2 + 0.7) * r * 0.7} ${Math.sin((k / 3) * Math.PI * 2 + 0.7) * r * 0.7} Z`} fill="#0b0906" />
    ))}
    <circle r={r * 0.16} fill="#c8b48a" />
  </g>
);
const Sheet: React.FC<{ x: number; y: number; w: number; h: number; rot: number; o: number; kind: "proj" | "img" | "data"; f: number; imgAt: number }> = ({ x, y, w, h, rot, o, kind, f, imgAt }) => (
  <div style={{ position: "absolute", left: x, top: y, width: w, height: h, transform: `rotate(${rot}deg) translateY(${(1 - o) * 60}px)`, opacity: o, background: kind === "proj" ? "#123a5a" : "#ece4d2", borderRadius: 6, boxShadow: "0 20px 50px rgba(0,0,0,0.6)", overflow: "hidden", padding: kind === "img" ? 12 : 0 }}>
    {kind === "proj" ? (
      <svg width={w} height={h}>
        {Array.from({ length: 12 }).map((_, i) => (
          <line key={i} x1={0} x2={w} y1={i * 30} y2={i * 30} stroke="rgba(255,255,255,0.08)" />
        ))}
        {/* uma torre Combine (estilo Cidadela) em planta técnica */}
        <path d={`M ${w * 0.5} 40 L ${w * 0.62} ${h - 70} L ${w * 0.38} ${h - 70} Z`} fill="none" stroke="#e8f4ff" strokeWidth={2} />
        <path d={`M ${w * 0.45} 90 L ${w * 0.55} 90 M ${w * 0.43} 150 L ${w * 0.57} 150 M ${w * 0.41} 210 L ${w * 0.59} 210`} stroke="#e8f4ff" strokeWidth={1.4} />
        <line x1={w * 0.2} x2={w * 0.8} y1={h - 70} y2={h - 70} stroke="#e8f4ff" strokeWidth={2} />
        <text x={14} y={h - 22} fill="#e8f4ff" fontFamily={MONO} fontSize={13} letterSpacing={2}>PROJETO · ESTRUTURA DESCONHECIDA</text>
      </svg>
    ) : kind === "img" ? (
      <div style={{ width: "100%", height: h - 60, background: "#000", overflow: "hidden" }}>
        <Sequence from={Math.round(imgAt)} layout="none">
          <Clip src="videos/hl3_M01_R/clips/f_citadel_hq.mp4" from={0} rate={1} style={{ filter: "sepia(0.35) contrast(1.1)" }} />
        </Sequence>
      </div>
    ) : (
      <svg width={w} height={h}>
        {Array.from({ length: 9 }).map((_, i) => (
          <text key={i} x={16} y={34 + i * 24} fill="#3a3326" fontFamily={MONO} fontSize={13}>{`${(rnd(i) * 900 + 100).toFixed(2)}  ${(rnd(i * 3) * 99).toFixed(3)}  Ω${Math.floor(rnd(i * 5) * 9)}`}</text>
        ))}
        <polyline points={Array.from({ length: 20 }).map((_, i) => `${16 + i * ((w - 32) / 19)},${h - 40 - Math.abs(Math.sin(i * 0.9)) * 50}`).join(" ")} fill="none" stroke="#7a2a1e" strokeWidth={2} />
      </svg>
    )}
    {kind === "img" ? <div style={{ fontFamily: MONO, fontSize: 13, color: "#3a3326", letterSpacing: 2, marginTop: 10 }}>IMAGEM · ORIGEM: BOREALIS</div> : null}
  </div>
);
export const HLWCaveFiles: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [filesAt, tapesAt, caveAt, testsAt, infoAt, notExistAt, projAt, imgAt, dataAt, combAt, beforeAt, invAt, notInvAt, archAt, futAt, pastAt, copyAt] = ["filesAt", "tapesAt", "caveAt", "testsAt", "infoAt", "notExistAt", "projAt", "imgAt", "dataAt", "combAt", "beforeAt", "invAt", "notInvAt", "archAt", "futAt", "pastAt", "copyAt"].map((k) => A(p, k));
  const ph2 = P(f, beforeAt, 16);
  const ph3 = P(f, copyAt, 12);
  const spin = f >= tapesAt && f < beforeAt + 20 ? f * 3 : tapesAt * 3;
  const wave = (k: number) => (f >= caveAt ? Math.sin(k * 0.7 + f * 0.5) * 24 * (0.3 + 0.7 * Math.abs(Math.sin(k * 0.13 + f / 9))) : 0);
  const stamp = (at: number) => {
    const k = interpolate(f, [at, at + 6], [2.2, 1], C);
    return { transform: `rotate(-8deg) scale(${k})`, opacity: f >= at ? 1 : 0 };
  };
  return (
    <Shell f={f} life={life} bg="#0d0b07">
      {/* fase 1: o gravador e a pasta */}
      <div style={{ position: "absolute", inset: 0, opacity: 1 - ph2 }}>
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          <rect x={140} y={300} width={620} height={420} rx={22} fill="#1d1810" stroke="#3a3122" strokeWidth={3} opacity={P(f, filesAt, 12)} />
          <Reel x={310} y={450} r={110} a={spin} />
          <Reel x={590} y={450} r={110} a={spin * 1.2} />
          <path d={`M 310 560 L 450 610 L 590 560`} fill="none" stroke="#5a4a30" strokeWidth={5} />
          <rect x={190} y={630} width={520} height={60} rx={8} fill="#0a0806" />
          <polyline points={Array.from({ length: 60 }).map((_, k) => `${200 + k * 8.4},${660 + wave(k)}`).join(" ")} fill="none" stroke={AMB} strokeWidth={2.4} />
        </svg>
        <div style={{ position: "absolute", left: 160, top: 250, fontFamily: MONO, letterSpacing: 4, color: AMB, fontSize: 18, opacity: P(f, tapesAt, 10) }}>{f >= caveAt ? "GRAVAÇÃO 07 · C. JOHNSON" : "GRAVAÇÕES · APERTURE SCIENCE"}</div>
        {f >= testsAt ? <div style={{ position: "absolute", left: 160, top: 740, fontFamily: MONO, letterSpacing: 4, color: CREAM, fontSize: 18, opacity: P(f, testsAt, 10) }}>PRIMEIROS TESTES COM O BOREALIS</div> : null}
        {/* a pasta */}
        <div style={{ position: "absolute", left: 900, top: 200, width: 880, height: 640, borderRadius: 14, background: "#b89a62", boxShadow: "0 30px 80px rgba(0,0,0,0.6)", opacity: P(f, infoAt, 12), transform: `translateX(${(1 - P(f, infoAt, 14)) * 120}px)` }}>
          <div style={{ position: "absolute", left: 30, top: 20, fontFamily: MONO, fontSize: 16, letterSpacing: 4, color: "#3a2a12" }}>{f >= notExistAt ? "INFORMAÇÃO QUE NÃO PODERIA EXISTIR" : "ARQUIVO · BOREALIS"}</div>
        </div>
        <Sheet x={940} y={270} w={300} h={420} rot={-6} o={P(f, projAt, 12)} kind="proj" f={f} imgAt={imgAt} />
        <Sheet x={1190} y={250} w={340} h={300} rot={4} o={P(f, imgAt, 12)} kind="img" f={f} imgAt={imgAt} />
        <Sheet x={1240} y={540} w={420} h={260} rot={-3} o={P(f, dataAt, 12)} kind="data" f={f} imgAt={imgAt} />
        {f >= combAt ? (
          <div style={{ position: "absolute", left: 1010, top: 470, padding: "14px 26px", border: `5px solid ${RED}`, borderRadius: 8, color: RED, fontFamily: FONT, fontWeight: 800, fontSize: 52, letterSpacing: 2, background: "rgba(40,6,4,0.35)", ...stamp(combAt) }}>TECNOLOGIA COMBINE</div>
        ) : null}
      </div>
      {/* fase 2: a linha do tempo */}
      {ph2 > 0 && ph3 < 1 ? (
        <div style={{ position: "absolute", inset: 0, opacity: ph2 * (1 - ph3) }}>
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
            <line x1={180} x2={1740} y1={640} y2={640} stroke="rgba(242,240,247,0.4)" strokeWidth={3} />
            {/* a fita (passado) */}
            <g transform="translate(420 640)">
              <circle r={14} fill={AMB} />
              <circle r={22} fill="none" stroke={AMB} strokeWidth={2} />
            </g>
            {/* a invasão */}
            {f >= invAt ? (
              <g transform="translate(1180 640)" opacity={P(f, invAt, 10)}>
                <rect x={-12} y={-12} width={24} height={24} transform="rotate(45)" fill={RED} />
              </g>
            ) : null}
            {/* o Borealis no futuro e a seta de volta */}
            {f >= futAt ? (
              <g opacity={P(f, futAt, 10)}>
                <g transform="translate(1600 640)">
                  <path d="M -40 10 L 40 10 L 30 24 L -30 24 Z M -24 10 L -24 -10 L 10 -10 L 10 10" fill="none" stroke={ICE} strokeWidth={2.5} />
                </g>
                <path d={`M 1600 600 C 1300 ${400 - 20 * Math.sin(f / 10)}, 720 ${400 - 20 * Math.sin(f / 10)}, 440 610`} fill="none" stroke={ICE} strokeWidth={4} strokeDasharray={`${2000 * P(f, futAt + 4, 30)} 2000`} />
                <path d="M 440 610 l 6 -22 l 14 18 Z" fill={ICE} opacity={P(f, pastAt, 8)} />
              </g>
            ) : null}
          </svg>
          <div style={{ position: "absolute", left: 300, top: 680, width: 240, textAlign: "center", fontFamily: MONO, letterSpacing: 3, color: AMB, fontSize: 18 }}>AS GRAVAÇÕES</div>
          {f >= invAt ? <div style={{ position: "absolute", left: 1060, top: 680, width: 240, textAlign: "center", fontFamily: MONO, letterSpacing: 3, color: RED, fontSize: 18, opacity: P(f, invAt, 10) }}>A INVASÃO DA TERRA</div> : null}
          <div style={{ position: "absolute", left: 300, top: 540, width: 300, textAlign: "center", fontFamily: MONO, letterSpacing: 3, color: CREAM, fontSize: 17, opacity: P(f, beforeAt, 10) }}>ANTES DA INVASÃO</div>
          {f >= notInvAt ? (
            <div style={{ position: "absolute", left: 180, top: 220, display: "flex", gap: 24, alignItems: "center", opacity: P(f, notInvAt, 8) }}>
              <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 70, color: TXT }}>Aperture</div>
              <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 70, color: "rgba(242,240,247,0.45)", textDecoration: "line-through", textDecorationColor: RED }}>inventou</div>
              {f >= archAt ? <div style={{ fontFamily: MONO, fontSize: 22, letterSpacing: 4, color: CREAM }}>A ARQUITETURA</div> : null}
            </div>
          ) : null}
          {f >= futAt ? <div style={{ position: "absolute", left: 0, right: 0, top: 360, textAlign: "center", fontFamily: MONO, letterSpacing: 6, color: ICE, fontSize: 24, opacity: P(f, futAt + 10, 10) }}>{f >= pastAt ? "DO FUTURO → PARA O PASSADO" : "DO FUTURO"}</div> : null}
        </div>
      ) : null}
      {/* fase 3: COPIEM TUDO */}
      {ph3 > 0 ? (
        <div style={{ position: "absolute", inset: 0, opacity: ph3 }}>
          {Array.from({ length: 24 }).map((_, i) => {
            const t0 = copyAt + 10 + i * 1.5;
            const o = P(f, t0, 6);
            return <div key={i} style={{ position: "absolute", left: 260 + (i % 8) * 180 + rnd(i) * 30, top: 380 + Math.floor(i / 8) * 120 - Math.min(40, (f - t0) * 0.5), width: 150, height: 190, background: i % 3 === 0 ? "#123a5a" : "#ece4d2", borderRadius: 4, transform: `rotate(${(rnd(i * 3) - 0.5) * 16}deg)`, opacity: o, boxShadow: "0 10px 30px rgba(0,0,0,0.6)" }} />;
          })}
          <div style={{ position: "absolute", left: 0, right: 0, top: 220, display: "flex", justifyContent: "center" }}>
            <div style={{ padding: "16px 34px", border: `6px solid ${RED}`, borderRadius: 10, color: RED, fontFamily: FONT, fontWeight: 800, fontSize: 84, background: "rgba(30,4,2,0.5)", ...stamp(copyAt + 2) }}>COPIEM TUDO</div>
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 360, textAlign: "center", fontFamily: MONO, fontSize: 20, letterSpacing: 6, color: CREAM, opacity: P(f, copyAt + 8, 8) }}>— C. JOHNSON</div>
          <div style={{ position: "absolute", right: 120, bottom: 120, fontFamily: FONT, fontWeight: 800, fontSize: 64, color: TXT, opacity: P(f, copyAt + 14, 8) }}>{`×${Math.min(999, Math.max(1, Math.floor((f - copyAt - 10) * 6)))}`}</div>
        </div>
      ) : null}
    </Shell>
  );
};

// ================================================================================================= 41:22 a arquitetura
// a câmara real da Aperture (footage) × uma sala Combine real (footage), lado a lado; de cada uma sai o MÓDULO de
// painel (desenho: o quadrado branco da Aperture, o painel chanfrado Combine); os dois deslizam para o meio e se
// sobrepõem: mesma proporção, mesmas juntas → % IGUAL → "a resposta do porquê".
export const HLWArchSplit: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [archAt, portalAt, techAt, similarAt, alignAt, combAt, answerAt] = ["archAt", "portalAt", "techAt", "similarAt", "alignAt", "combAt", "answerAt"].map((k) => A(p, k));
  const merge = P(f, alignAt, 40);
  const ans = P(f, answerAt, 14);
  const pct = Math.round(interpolate(f, [alignAt, alignAt + 50], [0, 94], C));
  const mod = (x: number, kind: "apt" | "cmb", o: number) => (
    <svg width={300} height={300} style={{ position: "absolute", left: x - 150, top: 650, opacity: o }}>
      {kind === "apt" ? (
        <g>
          {[0, 1].map((r) => [0, 1].map((c) => <rect key={`${r}${c}`} x={20 + c * 132} y={20 + r * 132} width={124} height={124} fill="rgba(242,240,234,0.12)" stroke={APT} strokeWidth={3} />))}
        </g>
      ) : (
        <g>
          {[0, 1].map((r) => [0, 1].map((c) => <path key={`${r}${c}`} d={`M ${20 + c * 132} ${20 + r * 132} h 104 l 20 20 v 104 h -124 Z`} fill="rgba(95,243,255,0.1)" stroke={CYAN} strokeWidth={3} />))}
        </g>
      )}
    </svg>
  );
  return (
    <Shell f={f} life={life} bg="#07090b">
      {/* os dois vídeos */}
      {[
        { src: "f_chamber_hq.mp4", from: 1, x: 120, label: "APERTURE · PORTAL", col: APT, at: archAt },
        { src: "f_ctrl_hq.mp4", from: 4, x: 1000, label: "COMBINE", col: CYAN, at: combAt < 1e8 ? Math.min(combAt, techAt) : techAt },
      ].map((v, i) => (
        <div key={i} style={{ position: "absolute", left: v.x, top: 150, width: 800, height: 450, borderRadius: 16, overflow: "hidden", border: `2px solid ${v.col}`, opacity: P(f, v.at, 12) * (1 - 0.6 * ans), transform: `translateY(${(1 - P(f, v.at, 14)) * 30}px)` }}>
          <Sequence from={Math.round(v.at)} layout="none">
            <Clip src={`videos/hl3_M01_R/clips/${v.src}`} from={v.from} rate={1} style={{ filter: "saturate(0.8) contrast(1.05)" }} />
          </Sequence>
          <div style={{ position: "absolute", left: 16, top: 12, padding: "6px 12px", borderRadius: 6, background: "rgba(0,0,0,0.6)", fontFamily: MONO, fontSize: 16, letterSpacing: 4, color: v.col }}>{v.label}</div>
        </div>
      ))}
      {f >= portalAt ? <div style={{ position: "absolute", left: 120, top: 100, fontFamily: MONO, fontSize: 16, letterSpacing: 4, color: APT, opacity: P(f, portalAt, 8) }}>OS JOGOS DE PORTAL</div> : null}
      {/* os módulos saem de cada parede e se sobrepõem */}
      {f >= similarAt ? mod(lerp(520, 960, merge), "apt", P(f, similarAt, 10)) : null}
      {f >= similarAt ? mod(lerp(1400, 960, merge), "cmb", P(f, similarAt + 6, 10)) : null}
      {f >= alignAt ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 960, textAlign: "center", fontFamily: MONO, fontSize: 20, letterSpacing: 5, color: ORANGE, opacity: P(f, alignAt + 30, 10) }}>{`MÓDULO · PROPORÇÃO · JUNTAS · ${pct}% IGUAL`}</div>
      ) : null}
      {ans > 0 ? <div style={{ position: "absolute", left: 0, right: 0, top: 420, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 96, color: TXT, opacity: ans, textShadow: "0 10px 50px #000" }}>a resposta do porquê</div> : null}
    </Shell>
  );
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// ================================================================================================= 6 · a Alyx parece melhor
// uma ideia por vez, cada uma com um desenho: o monitor dela (dor de cabeça → 0, a fala sem travar) · RESOLVIDO? →
// NÃO FOI ISSO · os balões: a resposta dela chega antes da pergunta da Mossman acabar (−0,8 s) · a planta: o corredor
// marcado ANTES de mudar · o headcrab: o tiro antes do salto · o medidor de insegurança esvazia · ALGO MUDOU NO SALTO
const Beat: React.FC<{ f: number; from: number; to: number; children: React.ReactNode }> = ({ f, from, to, children }) => {
  if (f < from - 2 || f >= to) return null;
  const o = P(f, from, 8) * (1 - P(f, to - 6, 6));
  return <AbsoluteFill style={{ opacity: o, transform: `translateY(${(1 - P(f, from, 12)) * 30}px)` }}>{children}</AbsoluteFill>;
};
export const HLWAlyxBetter: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [betterAt, headAt, lostAt, resolvedAt, notAt, answerAt, mossAt, corrAt, changeAt, fightAt, crabAt, insecAt, goneAt, actAt, knowAt, gameAt, changedAt] = ["betterAt", "headAt", "lostAt", "resolvedAt", "notAt", "answerAt", "mossAt", "corrAt", "changeAt", "fightAt", "crabAt", "insecAt", "goneAt", "actAt", "knowAt", "gameAt", "changedAt"].map((k) => A(p, k));
  const pain = 100 - 100 * P(f, headAt, 40);
  const wave = (k: number) => Math.sin(k * 0.6 + f * 0.3) * 14 * (f >= lostAt ? 1 : 0.6 + 0.8 * (rnd(Math.floor(k / 6) + Math.floor(f / 5)) > 0.75 ? 1 : 0));
  return (
    <Shell f={f} life={life} bg="#0b0806">
      <Corner f={f} at={0} t="ALYX VANCE · DEPOIS DO SALTO" sub={f >= notAt ? "NÃO FOI ISSO QUE ACONTECEU" : "ELA PARECE MELHOR"} col={f >= notAt ? RED : ORANGE} />
      {/* 1. o monitor dela */}
      <Beat f={f} from={betterAt} to={notAt + 20}>
        <div style={{ position: "absolute", left: 360, top: 250, width: 1200, padding: 40, borderRadius: 20, background: "rgba(16,12,8,0.85)", border: `1.5px solid ${f >= notAt ? RED : ORANGE}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, letterSpacing: 4 }}>
            <span style={{ fontSize: 20, color: ORANGE }}>DOR DE CABEÇA</span>
            <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 56, color: pain < 5 ? GREEN : RED }}>{`${Math.round(pain)}%`}</span>
          </div>
          <div style={{ height: 14, marginTop: 10, borderRadius: 7, background: "rgba(255,93,77,0.15)" }}>
            <div style={{ height: "100%", width: `${pain}%`, background: pain < 5 ? GREEN : RED, borderRadius: 7 }} />
          </div>
          {f >= lostAt ? (
            <div style={{ marginTop: 40, opacity: P(f, lostAt, 8) }}>
              <div style={{ fontFamily: MONO, fontSize: 20, letterSpacing: 4, color: ORANGE }}>A FALA · SEM TRAVAR</div>
              <svg width={1120} height={80}>
                <polyline points={Array.from({ length: 140 }).map((_, k) => `${k * 8},${40 + wave(k)}`).join(" ")} fill="none" stroke={GREEN} strokeWidth={2.5} />
              </svg>
            </div>
          ) : null}
          {f >= resolvedAt ? (
            <div style={{ marginTop: 30, fontFamily: FONT, fontWeight: 800, fontSize: 70, color: f >= notAt ? RED : GREEN, opacity: P(f, resolvedAt, 8), textDecoration: f >= notAt ? "line-through" : "none" }}>
              {f >= notAt ? "RESOLVIDO" : "RESOLVIDO?"}
            </div>
          ) : null}
        </div>
      </Beat>
      {/* 2. os balões: ela responde antes da Mossman terminar */}
      <Beat f={f} from={answerAt} to={corrAt}>
        <div style={{ position: "absolute", left: 300, top: 300, width: 900, padding: "26px 30px", borderRadius: 24, background: "rgba(159,230,255,0.1)", border: `1.5px solid ${ICE}`, fontFamily: FONT, fontWeight: 700, fontSize: 44, color: TXT }}>
          <div style={{ fontFamily: MONO, fontSize: 16, letterSpacing: 4, color: ICE, marginBottom: 8 }}>MOSSMAN</div>
          {"Alyx, você sabe se esse corredor leva até".slice(0, Math.max(0, Math.floor((f - answerAt) * 1.2)))}
          {f >= mossAt ? <span style={{ color: "rgba(242,240,247,0.3)" }}> o…</span> : null}
        </div>
        {f >= answerAt + 26 ? (
          <div style={{ position: "absolute", left: 820, top: 520, width: 800, padding: "26px 30px", borderRadius: 24, background: "rgba(255,152,40,0.12)", border: `1.5px solid ${ORANGE}`, fontFamily: FONT, fontWeight: 700, fontSize: 44, color: TXT, opacity: P(f, answerAt + 26, 6) }}>
            <div style={{ fontFamily: MONO, fontSize: 16, letterSpacing: 4, color: ORANGE, marginBottom: 8 }}>ALYX</div>
            Leva. Pelo lado leste.
          </div>
        ) : null}
        {f >= answerAt + 32 ? (
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: P(f, answerAt + 32, 8) }}>
            <line x1={820} x2={1200} y1={780} y2={780} stroke={RED} strokeWidth={3} />
            <line x1={820} x2={820} y1={770} y2={790} stroke={RED} strokeWidth={3} />
            <line x1={1200} x2={1200} y1={770} y2={790} stroke={RED} strokeWidth={3} />
            <text x={1010} y={830} textAnchor="middle" fill={RED} fontFamily={MONO} fontSize={26} letterSpacing={4}>−0,8 s · ANTES DA PERGUNTA ACABAR</text>
          </svg>
        ) : null}
      </Beat>
      {/* 3. a planta: o corredor marcado antes de mudar */}
      <Beat f={f} from={corrAt} to={fightAt}>
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          {[0, 1, 2, 3, 4].map((k) => {
            const changed = f >= changeAt + 30 && k === 2;
            return (
              <g key={k}>
                <rect x={320 + k * 260} y={changed ? 330 : 420} width={200} height={changed ? 420 : 240} rx={10} fill="rgba(159,230,255,0.05)" stroke={k === 2 ? ORANGE : "rgba(159,230,255,0.6)"} strokeWidth={k === 2 ? 4 : 2} strokeDasharray={k === 2 && !changed ? "12 8" : undefined} />
                <text x={420 + k * 260} y={720} textAnchor="middle" fill="rgba(159,230,255,0.7)" fontFamily={MONO} fontSize={16} letterSpacing={3}>{`CORREDOR ${k + 1}`}</text>
              </g>
            );
          })}
          <text x={940} y={390} textAnchor="middle" fill={ORANGE} fontFamily={MONO} fontSize={20} letterSpacing={4} opacity={P(f, corrAt + 6, 8) * (f >= changeAt + 30 ? 0 : 1)}>ELA MARCA ESTE</text>
          {f >= changeAt + 30 ? <text x={940} y={300} textAnchor="middle" fill={GREEN} fontFamily={MONO} fontSize={20} letterSpacing={4}>… E ELE MUDA DEPOIS</text> : null}
        </svg>
      </Beat>
      {/* 4. o headcrab: derrubado antes do salto */}
      <Beat f={f} from={fightAt} to={insecAt}>
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          <path d="M 1300 760 Q 1000 380 640 640" fill="none" stroke="rgba(255,93,77,0.7)" strokeWidth={3} strokeDasharray="10 10" />
          <text x={980} y={420} textAnchor="middle" fill="rgba(255,93,77,0.8)" fontFamily={MONO} fontSize={18} letterSpacing={4}>O SALTO QUE NÃO ACONTECEU</text>
          {/* o headcrab (silhueta: corpo achatado + 4 patas) parado no ponto de partida */}
          <g transform={`translate(1300 760) rotate(${f >= crabAt + 4 ? 24 : 0})`} opacity={f >= crabAt + 4 ? 0.6 : 1}>
            <ellipse rx={58} ry={28} fill="#c9a07a" stroke="#3a2a1e" strokeWidth={3} />
            <path d="M -50 10 L -80 40 M -20 22 L -36 56 M 20 22 L 36 56 M 50 10 L 80 40" stroke="#3a2a1e" strokeWidth={6} strokeLinecap="round" />
            <path d="M -30 -10 Q 0 -30 30 -10" fill="none" stroke="#3a2a1e" strokeWidth={4} />
          </g>
          {f >= crabAt ? (
            <g opacity={1 - P(f, crabAt + 10, 10) * 0.6}>
              <line x1={500} y1={760} x2={1300} y2={760} stroke={ORANGE} strokeWidth={4} strokeDasharray={`${900 * P(f, crabAt, 4)} 900`} />
              <circle cx={1300} cy={760} r={20 + (f - crabAt) * 3} fill="none" stroke={ORANGE} strokeWidth={3} opacity={Math.max(0, 1 - (f - crabAt) / 14)} />
            </g>
          ) : null}
          <text x={500} y={820} fill={ORANGE} fontFamily={MONO} fontSize={18} letterSpacing={4}>ALYX</text>
          {f >= crabAt + 6 ? <text x={1300} y={860} textAnchor="middle" fill={ORANGE} fontFamily={MONO} fontSize={24} letterSpacing={5}>ANTES DO SALTO</text> : null}
        </svg>
      </Beat>
      {/* 5. a insegurança esvazia; ela age */}
      <Beat f={f} from={insecAt} to={gameAt}>
        <div style={{ position: "absolute", left: 460, top: 330, width: 1000, fontFamily: MONO }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 20, letterSpacing: 4, color: CREAM }}>
            <span>INSEGURANÇA</span>
            <span>{`${Math.round(100 - 100 * P(f, goneAt, 30))}%`}</span>
          </div>
          <div style={{ height: 16, marginTop: 10, borderRadius: 8, background: "rgba(255,226,176,0.15)" }}>
            <div style={{ height: "100%", width: `${100 - 100 * P(f, goneAt, 30)}%`, background: CREAM, borderRadius: 8 }} />
          </div>
          {f >= actAt ? (
            <div style={{ marginTop: 60, display: "flex", gap: 40, alignItems: "baseline", opacity: P(f, actAt, 8) }}>
              <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 64, color: "rgba(242,240,247,0.4)", textDecoration: "line-through" }}>tenta entender</span>
              <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 80, color: ORANGE }}>age</span>
            </div>
          ) : null}
          {f >= knowAt ? <div style={{ marginTop: 20, fontSize: 20, letterSpacing: 5, color: GREEN, opacity: P(f, knowAt, 8) }}>COMO SE JÁ CONHECESSE PARTES DO NAVIO</div> : null}
        </div>
      </Beat>
      {/* 6. ALGO MUDOU NO SALTO */}
      <Beat f={f} from={gameAt} to={life + 10}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 400, textAlign: "center" }}>
          <div style={{ fontFamily: MONO, fontSize: 20, letterSpacing: 6, color: "rgba(242,240,247,0.6)" }}>O JOGO NÃO EXPLICA AINDA</div>
          {f >= changedAt ? <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 110, color: TXT, marginTop: 16, opacity: P(f, changedAt, 8) }}>algo mudou no salto</div> : null}
        </div>
      </Beat>
    </Shell>
  );
};

// ================================================================================================= 6 · Shu'ulathoi (2D concreto)
// terminal Combine decodificando o registro → glifos dos Vortigaunts traduzidos: SHU'ULATHOI → a carta "Epistle 3 ·
// Marc Laidlaw" com o carimbo O CONCEITO DO EPISÓDIO 3 → antes dos Combine: as larvas espalhadas na superfície do
// mundo deles, separadas (réguas de distância) → fios de luz ligam todas → no alto, o MUNDO MENTAL COLETIVO com
// conhecimento, memória e cultura → os corpos apagam e o mundo mental fica: SEM DEPENDER DO CORPO.
// a larva
const Grub: React.FC<{ x: number; y: number; s: number; o?: number }> = ({ x, y, s, o = 1 }) => {
  const f = useCurrentFrame();
  // a larva em holograma do terminal: a forma real (larva_ref) virada em curvas de nível violeta (larva_holo.py).
  // Em pé, centrada em (x + 28s, y), ~80s de altura; respira, e o sinal tremula de leve como projeção
  const h = 80 * s;
  const w = h * (404 / 629);
  const br = 1 + 0.02 * Math.sin((f + x) / 13);
  const fl = 0.86 + 0.14 * Math.sin((f + x * 0.37) / 3.1) * Math.sin((f + x) / 23);
  return (
    <g transform={`translate(${x + 28 * s} ${y + h / 2}) scale(${2 - br} ${br}) translate(0 ${-h / 2})`} opacity={o * fl}>
      <image href={staticFile("hl3silh/larva_holo.png")} x={-w / 2} y={-h / 2} width={w} height={h} style={{ filter: "drop-shadow(0 0 6px rgba(199,155,255,0.55))" }} />
      <ellipse cx={0} cy={h / 2 + 2} rx={w * 0.55} ry={w * 0.09} fill="none" stroke="rgba(199,155,255,0.5)" strokeWidth={1.2} />
    </g>
  );
};
const GRUBS: [number, number][] = [[260, 820], [520, 760], [760, 840], [1000, 780], [1240, 850], [1480, 770], [1700, 830], [420, 900], [1120, 910]];
export const HLWShu: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [termAt, vortAt, nameAt, laidlawAt, conceptAt, incorpAt, psyAt, sepAt, connAt, worldAt, knowAt, memAt, cultAt, bodyAt] = ["termAt", "vortAt", "nameAt", "laidlawAt", "conceptAt", "incorpAt", "psyAt", "sepAt", "connAt", "worldAt", "knowAt", "memAt", "cultAt", "bodyAt"].map((k) => A(p, k));
  const ph2 = P(f, incorpAt, 14);
  const conn = P(f, connAt, 40);
  const world = P(f, worldAt, 30);
  const dim = P(f, bodyAt, 30);
  const glyph = (i: number) => `M ${i * 70} 0 l 20 30 l -14 26 M ${i * 70 + 26} 4 l 0 50 M ${i * 70 + 10} 28 l 30 0`;
  return (
    <Shell f={f} life={life} bg="#08060c">
      {/* fase 1: o terminal, os glifos, o nome, a carta */}
      <div style={{ position: "absolute", inset: 0, opacity: 1 - ph2 }}>
        <div style={{ position: "absolute", left: 140, top: 180, width: 820, height: 560, borderRadius: 16, background: "rgba(6,16,20,0.9)", border: "1.5px solid #5ff3ff", padding: 30, opacity: P(f, termAt, 10), fontFamily: MONO, color: CYAN }}>
          <div style={{ fontSize: 16, letterSpacing: 4 }}>TERMINAL COMBINE · REGISTRO BIOLÓGICO</div>
          {[0, 1, 2, 3, 4, 5].map((k) => (
            <div key={k} style={{ fontSize: 18, letterSpacing: 2, marginTop: 14, opacity: 0.75 }}>{decode(["ESPÉCIE: ADVISOR", "ORIGEM: INCORPORADA", "SISTEMA NERVOSO: DISTRIBUÍDO", "COMUNICAÇÃO: PSÍQUICA", "STATUS: SUPORTE", "NOME NATIVO: ████████"][k], f, termAt + 6 + k * 5, 2.2)}</div>
          ))}
          {f >= vortAt ? (
            <svg width={760} height={90} style={{ marginTop: 26, opacity: P(f, vortAt, 10) }}>
              {Array.from({ length: 9 }).map((_, i) => (
                <path key={i} d={glyph(i)} transform="translate(10 18)" fill="none" stroke={GREEN} strokeWidth={4} strokeLinecap="round" strokeDasharray={`${120 * P(f, vortAt + i * 3, 10)} 120`} />
              ))}
            </svg>
          ) : null}
          {f >= vortAt ? <div style={{ fontSize: 15, letterSpacing: 4, color: GREEN, marginTop: 6 }}>COMO OS VORTIGAUNTS CHAMAM A ESPÉCIE</div> : null}
        </div>
        {f >= nameAt ? <div style={{ position: "absolute", left: 140, top: 790, fontFamily: FONT, fontWeight: 800, fontSize: 110, color: TXT, opacity: P(f, nameAt, 8), letterSpacing: -2 }}>{decode("Shu'ulathoi", f, nameAt, 1.4)}</div> : null}
        {/* a carta do Laidlaw */}
        {f >= laidlawAt ? (
          <div style={{ position: "absolute", left: 1080, top: 210, width: 640, height: 600, background: "#ece4d2", borderRadius: 6, padding: "40px 44px", boxShadow: "0 30px 80px rgba(0,0,0,0.6)", transform: `rotate(3deg) translateX(${(1 - P(f, laidlawAt, 14)) * 200}px)`, opacity: P(f, laidlawAt, 10), fontFamily: "'Courier New', monospace", color: "#2a2318" }}>
            <div style={{ fontSize: 30, fontWeight: 700 }}>Epistle 3</div>
            <div style={{ fontSize: 20, marginTop: 6 }}>Marc Laidlaw</div>
            {Array.from({ length: 11 }).map((_, k) => (
              <div key={k} style={{ height: 10, marginTop: 18, width: `${60 + rnd(k) * 38}%`, background: "rgba(42,35,24,0.35)", borderRadius: 3 }} />
            ))}
            {f >= conceptAt ? <div style={{ position: "absolute", left: 120, top: 330, padding: "10px 20px", border: `4px solid ${RED}`, borderRadius: 8, color: RED, fontFamily: FONT, fontWeight: 800, fontSize: 34, transform: `rotate(-8deg) scale(${interpolate(f, [conceptAt, conceptAt + 6], [2, 1], C)})`, background: "rgba(255,255,255,0.4)" }}>O CONCEITO DO EPISÓDIO 3</div> : null}
          </div>
        ) : null}
      </div>
      {/* fase 2: o mundo deles, as mentes ligadas */}
      {ph2 > 0 ? (
        <div style={{ position: "absolute", inset: 0, opacity: ph2 }}>
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
            <path d="M -100 760 Q 960 640 2020 760 L 2020 1080 L -100 1080 Z" fill="rgba(60,40,70,0.35)" stroke="rgba(199,155,255,0.35)" strokeWidth={2} />
            {/* réguas de distância: separados */}
            {f >= sepAt
              ? GRUBS.slice(0, 6).map((g, i) => {
                  const h = GRUBS[i + 1];
                  return (
                    <g key={"r" + i} opacity={P(f, sepAt + i * 3, 8) * (1 - conn)}>
                      <line x1={g[0] + 40} x2={h[0] - 10} y1={g[1] - 40} y2={h[1] - 40} stroke="rgba(242,240,247,0.5)" strokeWidth={1.5} strokeDasharray="4 6" />
                      <text x={(g[0] + h[0]) / 2} y={(g[1] + h[1]) / 2 - 50} textAnchor="middle" fill="rgba(242,240,247,0.6)" fontFamily={MONO} fontSize={14}>{`${(800 + rnd(i) * 900).toFixed(0)} KM`}</text>
                    </g>
                  );
                })
              : null}
            {/* 08/10 (pedido dele: os fios não combinavam): a conexão é PSÍQUICA — cada mente pulsa ondas no chão;
                separadas, cada uma no seu ritmo; em "conectar" os ritmos se acertam até virar um pulso só, e uma onda única
                atravessa o mundo inteiro. No "mundo mental", o que pulsava sobe em partículas e forma a nuvem lá no alto */}
            {f >= psyAt
              ? GRUBS.map((g, i) =>
                  [0, 1, 2].map((k) => {
                    const off = rnd(i * 7 + 1) * 48 * (1 - conn);
                    const t = (((f + off) / 48 + k / 3) % 1 + 1) % 1;
                    const rx = 26 + t * (180 + 120 * conn);
                    return <ellipse key={`w${i}-${k}`} cx={g[0] + 28} cy={g[1] + 58} rx={rx} ry={rx * 0.2} fill="none" stroke={VIOL} strokeWidth={2 - t * 1.4} opacity={(1 - t) * 0.55 * P(f, psyAt + i * 2, 10) * (1 - dim * 0.7)} />;
                  }),
                )
              : null}
            {conn > 0.6
              ? [0, 1].map((k) => {
                  const t = ((f / 48 + k / 2) % 1 + 1) % 1;
                  return <ellipse key={`big${k}`} cx={960} cy={880} rx={120 + t * 1100} ry={(120 + t * 1100) * 0.16} fill="none" stroke="#e4d0ff" strokeWidth={3 - t * 2} opacity={(1 - t) * 0.5 * P(f, connAt + 30, 20) * (1 - dim * 0.7)} />;
                })
              : null}
            {world > 0
              ? GRUBS.map((g, i) =>
                  Array.from({ length: 7 }).map((_, m) => {
                    const t = ((f / 55 + m / 7 + rnd(i) * 0.3) % 1 + 1) % 1;
                    const x0 = g[0] + 28;
                    const y0 = g[1] - 20;
                    const x1 = 960 + (g[0] - 960) * 0.35;
                    const y1 = 340;
                    const x = x0 + (x1 - x0) * t + Math.sin(t * 6 + i + m) * 18 * (1 - t);
                    const y = y0 + (y1 - y0) * (1 - (1 - t) * (1 - t));
                    return <circle key={`m${i}-${m}`} cx={x} cy={y} r={2 + 2.5 * (1 - t)} fill="#e4d0ff" opacity={world * Math.sin(Math.PI * t) * 0.85} style={{ filter: "drop-shadow(0 0 5px rgba(199,155,255,0.9))" }} />;
                  }),
                )
              : null}
            {GRUBS.map((g, i) => (
              <g key={i}>
                {f >= psyAt ? <circle cx={g[0] + 20} cy={g[1] - 6} r={40 + 10 * Math.sin(f / 8 + i)} fill="rgba(199,155,255,0.12)" opacity={P(f, psyAt + i * 2, 10) * (1 - dim * 0.8)} /> : null}
                <Grub x={g[0]} y={g[1]} s={1.4} o={P(f, incorpAt + i * 2, 10) * (1 - dim * 0.75)} />
              </g>
            ))}
            {/* o mundo mental */}
            {world > 0 ? (
              <g opacity={world}>
                <defs>
                  <radialGradient id="shuMind" cx="0.5" cy="0.5" r="0.5">
                    <stop offset="0" stopColor="#000" stopOpacity={0} />
                    <stop offset="0.7" stopColor="#000" stopOpacity={0} />
                    <stop offset="1" stopColor="#08060c" stopOpacity={1} />
                  </radialGradient>
                  <radialGradient id="shuFeather" cx="0.5" cy="0.5" r="0.5">
                    <stop offset="0" stopColor="#fff" stopOpacity={1} />
                    <stop offset="0.72" stopColor="#fff" stopOpacity={1} />
                    <stop offset="1" stopColor="#fff" stopOpacity={0} />
                  </radialGradient>
                  <mask id="shuMindMask" maskUnits="userSpaceOnUse" x={0} y={0} width={1920} height={1080}>
                    <ellipse cx={960} cy={330} rx={560 * world} ry={170 * world} fill="url(#shuFeather)" />
                  </mask>
                </defs>
                {/* a nuvem do mundo mental: nebulosa violeta girando devagar; a imagem é bem maior que o contorno (cobre em
                    qualquer ângulo) e a borda esfuma — antes os cantos do retângulo apareciam como cortes retos */}
                <g mask="url(#shuMindMask)">
                  <image href={staticFile("hl3/nebula_2.png")} x={960 - 1250} y={330 - 700} width={2500} height={1400} preserveAspectRatio="xMidYMid slice" opacity={0.8} transform={`rotate(${f * 0.04} 960 330)`} style={{ filter: "hue-rotate(20deg) saturate(1.3)" }} />
                </g>
                <ellipse cx={960} cy={330} rx={560 * world} ry={170 * world} fill="none" stroke={VIOL} strokeWidth={2} opacity={0.6} />
              </g>
            ) : null}
          </svg>
          {world > 0 ? <div style={{ position: "absolute", left: 0, right: 0, top: 150, textAlign: "center", fontFamily: MONO, fontSize: 20, letterSpacing: 6, color: VIOL, opacity: world }}>MUNDO MENTAL COLETIVO</div> : null}
          {[
            { at: knowAt, k: "CONHECIMENTO", x: 640 },
            { at: memAt, k: "MEMÓRIA", x: 960 },
            { at: cultAt, k: "CULTURA", x: 1280 },
          ].map((it, i) =>
            f >= it.at ? (
              <div key={i} style={{ position: "absolute", left: it.x - 120, top: 290, width: 240, textAlign: "center", fontFamily: MONO, fontSize: 18, letterSpacing: 4, color: TXT, opacity: P(f, it.at, 8) }}>
                <div style={{ fontSize: 34, color: VIOL }}>{["◆", "◎", "♪"][i]}</div>
                {it.k}
              </div>
            ) : null,
          )}
          {f >= bodyAt ? <div style={{ position: "absolute", left: 0, right: 0, bottom: 90, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 64, color: TXT, opacity: P(f, bodyAt, 10) }}>sem depender do corpo</div> : null}
          {f >= incorpAt && f < psyAt ? <div style={{ position: "absolute", left: 80, top: 120, fontFamily: MONO, fontSize: 18, letterSpacing: 5, color: VIOL, opacity: P(f, incorpAt, 8) }}>ANTES DE SEREM INCORPORADOS AOS COMBINE</div> : null}
          {f >= psyAt && f < worldAt ? <div style={{ position: "absolute", left: 80, top: 120, fontFamily: MONO, fontSize: 18, letterSpacing: 5, color: VIOL }}>{f >= connAt ? "AS MENTES SE CONECTAVAM" : f >= sepAt ? "MESMO SEPARADOS FISICAMENTE" : "UMA ESPÉCIE PROFUNDAMENTE PSÍQUICA"}</div> : null}
        </div>
      ) : null}
    </Shell>
  );
};
const VIOL = "#c79bff";
const VIO = VIOL;

// ================================================================================================= 6 · o registro do Breen
// dossiê Combine: REGISTRO · WALLACE BREEN com o rosto real (Breencast) → MORREU: a Cidadela real ao lado e o rosto
// fica cinza com o carimbo MORTO · QUEDA NA CIDADELA → a TRANSFERÊNCIA dos Advisors (final de HL2) riscada: NUNCA SALVOU
// O CORPO → CÓPIA ANTERIOR DA MENTE (arquivo) → impressa numa larva (hospedeiro) → O HOMEM QUE SOBREVIVEU ✗ · UMA
// VERSÃO QUE CONTINUOU ✓.
const BreenFace: React.FC<{ at: number; gray: number }> = ({ at, gray }) => (
  <Sequence from={Math.round(at)} premountFor={20}>
    <AbsoluteFill style={{ transform: "translate(24.5%, 25%) scale(2.9)", transformOrigin: "25.5% 25%", filter: `saturate(${0.8 - 0.8 * gray}) contrast(1.1) brightness(${1 - 0.3 * gray})` }}>
      <Clip src="videos/hl3_M01_R/clips/f_breencast_pp_hq.mp4" from={0} rate={1} />
    </AbsoluteFill>
  </Sequence>
);
export const HLWBreenRecord: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [recAt, diedAt, citAt, transAt, hl2At, neverAt, preservedAt, mindAt, printedAt, hostAt, notAt, versionAt, origAt] = ["recAt", "diedAt", "citAt", "transAt", "hl2At", "neverAt", "preservedAt", "mindAt", "printedAt", "hostAt", "notAt", "versionAt", "origAt"].map((k) => A(p, k));
  const gray = P(f, diedAt, 10);
  const ph3 = P(f, notAt, 14);
  return (
    <Shell f={f} life={life} bg="#0c0a0a">
      <Corner f={f} at={recAt} t="REGISTRO COMBINE · WALLACE BREEN" sub="ARQUIVO ENCONTRADO PELA MOSSMAN" col={ORANGE} />
      <div style={{ position: "absolute", inset: 0, opacity: 1 - ph3 }}>
        {/* o rosto */}
        <div style={{ position: "absolute", left: 60, top: 200, width: 520, height: 292, borderRadius: 14, overflow: "hidden", border: `2px solid ${gray > 0.5 ? RED : ORANGE}`, background: "#000", opacity: P(f, recAt, 10) }}>
          <BreenFace at={recAt} gray={gray} />
          {f >= diedAt ? <div style={{ position: "absolute", left: 150, top: 110, padding: "10px 18px", border: `5px solid ${RED}`, borderRadius: 8, color: RED, fontFamily: FONT, fontWeight: 800, fontSize: 46, background: "rgba(30,4,2,0.55)", transform: `rotate(-10deg) scale(${interpolate(f, [diedAt, diedAt + 6], [2, 1], C)})` }}>MORTO</div> : null}
        </div>
        <div style={{ position: "absolute", left: 60, top: 510, fontFamily: MONO, fontSize: 18, letterSpacing: 4, color: gray > 0.5 ? RED : TXT }}>{gray > 0.5 ? "O CORPO ORIGINAL · QUEDA NA CIDADELA" : "WALLACE BREEN · ORIGINAL"}</div>
        {/* a Cidadela */}
        {f >= citAt ? (
          <div style={{ position: "absolute", left: 600, top: 200, width: 560, height: 315, borderRadius: 12, overflow: "hidden", border: "1.5px solid rgba(255,93,77,0.6)", opacity: P(f, citAt, 10) }}>
            <Sequence from={Math.round(citAt)} premountFor={20}>
              <Clip src="videos/hl3_M01_R/clips/f_citadel_hq.mp4" from={0} rate={1} />
            </Sequence>
            <div style={{ position: "absolute", left: 12, bottom: 10, fontFamily: MONO, fontSize: 15, letterSpacing: 3, color: CREAM, background: "rgba(0,0,0,0.6)", padding: "4px 10px", borderRadius: 4 }}>A CIDADELA · FINAL DE HALF-LIFE 2</div>
          </div>
        ) : null}
        {/* a transferência riscada */}
        {f >= transAt ? (
          <div style={{ position: "absolute", left: 600, top: 560, width: 560, padding: "18px 22px", borderRadius: 12, background: "rgba(16,10,22,0.85)", border: "1.5px solid #c79bff", opacity: P(f, transAt, 10), fontFamily: MONO }}>
            <div style={{ fontSize: 15, letterSpacing: 4, color: "#c79bff" }}>{f >= hl2At ? "TRANSFERÊNCIA DOS ADVISORS · FINAL DE HL2" : "TRANSFERÊNCIA DOS ADVISORS"}</div>
            {f >= neverAt ? <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 40, color: RED, marginTop: 10 }}>✗ nunca salvou o corpo</div> : null}
          </div>
        ) : null}
        {/* a cópia anterior da mente → a larva */}
        {f >= preservedAt ? (
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
            <g opacity={P(f, preservedAt, 10)} transform="translate(1290 260)">
              <path d="M 0 0 h 120 l 40 40 v 160 h -160 Z" fill="rgba(255,152,40,0.12)" stroke={ORANGE} strokeWidth={3} />
              <path d="M 120 0 v 40 h 40" fill="none" stroke={ORANGE} strokeWidth={3} />
              {[0, 1, 2, 3].map((k) => <line key={k} x1={24} x2={130} y1={80 + k * 26} y2={80 + k * 26} stroke={ORANGE} strokeWidth={4} opacity={0.6} />)}
              <text x={80} y={240} textAnchor="middle" fill={ORANGE} fontFamily={MONO} fontSize={16} letterSpacing={3}>{f >= mindAt ? "CÓPIA ANTERIOR DA MENTE" : "PRESERVADA ANTES"}</text>
            </g>
            {f >= printedAt ? (
              <g>
                <path d="M 1370 520 C 1370 640, 1430 660, 1480 720" fill="none" stroke={ORANGE} strokeWidth={4} strokeDasharray={`${400 * P(f, printedAt, 20)} 400`} />
                <ellipse cx={1520} cy={790} rx={170} ry={90} fill="rgba(79,227,208,0.08)" stroke={TEALW} strokeWidth={2.5} opacity={P(f, printedAt + 10, 10)} />
                <Grub x={1450} y={795} s={2.2} o={P(f, printedAt + 14, 10)} />
                <text x={1520} y={920} textAnchor="middle" fill={TEALW} fontFamily={MONO} fontSize={18} letterSpacing={4} opacity={P(f, hostAt, 10)}>IMPRESSA NUM HOSPEDEIRO</text>
              </g>
            ) : null}
          </svg>
        ) : null}
      </div>
      {/* a conclusão: a linha da vida do Breen acaba na Cidadela; a cópia anterior sai da linha e continua até a larva */}
      {ph3 > 0
        ? (() => {
            const lineK = P(f, notAt, 24);
            const brK = P(f, versionAt, 36);
            const Y = 600;
            const X0 = 330;
            const XC = 1180; // a Cidadela
            const XB = 760; // onde a mente foi copiada
            const XL = 1600; // a larva
            const brPath = `M ${XB} ${Y} C ${XB + 120} ${Y - 220}, ${XC + 60} ${Y - 260}, ${XL - 80} ${Y - 150}`;
            return (
              <div style={{ position: "absolute", inset: 0, opacity: ph3 }}>
                <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
                  <line x1={X0} y1={Y} x2={X0 + (XC - X0) * lineK} y2={Y} stroke="rgba(242,240,247,0.85)" strokeWidth={5} />
                  {Array.from({ length: 9 }).map((_, i) => <line key={i} x1={X0 + i * 100} y1={Y - 8} x2={X0 + i * 100} y2={Y + 8} stroke="rgba(242,240,247,0.4)" strokeWidth={2} opacity={lineK} />)}
                  {/* a Cidadela e o fim */}
                  <path d={`M ${XC - 18} ${Y} L ${XC - 8} ${Y - 170} L ${XC} ${Y - 230} L ${XC + 8} ${Y - 170} L ${XC + 18} ${Y} Z`} fill="rgba(140,160,180,0.25)" stroke="rgba(200,220,240,0.7)" strokeWidth={2} opacity={lineK} />
                  {lineK > 0.95 ? (
                    <g>
                      <path d={`M ${XC - 26} ${Y - 26} L ${XC + 26} ${Y + 26} M ${XC + 26} ${Y - 26} L ${XC - 26} ${Y + 26}`} stroke={RED} strokeWidth={7} strokeLinecap="round" />
                      <text x={XC} y={Y + 70} textAnchor="middle" fill={RED} fontFamily={MONO} fontSize={22} letterSpacing={5}>CIDADELA · MORTO</text>
                    </g>
                  ) : null}
                  <text x={(X0 + XC) / 2} y={Y - 26} textAnchor="middle" fill="rgba(242,240,247,0.65)" fontFamily={MONO} fontSize={20} letterSpacing={4} opacity={lineK}>O HOMEM ORIGINAL</text>
                  {f >= notAt + 20 ? (
                    <g opacity={P(f, notAt + 20, 10)}>
                      <text x={(X0 + XC) / 2} y={Y + 130} textAnchor="middle" fill="rgba(242,240,247,0.45)" fontFamily={FONT} fontWeight={800} fontSize={40}>o homem que sobreviveu à Cidadela</text>
                      <line x1={(X0 + XC) / 2 - 330} y1={Y + 116} x2={(X0 + XC) / 2 - 330 + 660 * P(f, notAt + 26, 10)} y2={Y + 116} stroke={RED} strokeWidth={5} />
                    </g>
                  ) : null}
                  {/* a cópia anterior da mente: sai da linha antes da queda e continua */}
                  {f >= versionAt ? (
                    <g>
                      <circle cx={XB} cy={Y} r={14} fill={ORANGE} style={{ filter: `drop-shadow(0 0 10px ${ORANGE})` }} />
                      <path d={brPath} fill="none" stroke={ORANGE} strokeWidth={5} strokeDasharray={`${1400 * brK} 1400`} style={{ filter: `drop-shadow(0 0 8px ${ORANGE})` }} />
                      <text x={XB} y={Y + 44} textAnchor="middle" fill={ORANGE} fontFamily={MONO} fontSize={18} letterSpacing={4}>CÓPIA DA MENTE</text>
                      <text x={XC + 40} y={Y - 300} textAnchor="middle" fill={TXT} fontFamily={FONT} fontWeight={800} fontSize={46} opacity={P(f, versionAt + 20, 10)}>uma versão que continuou existindo</text>
                    </g>
                  ) : null}
                  {brK > 0.9 ? <Grub x={XL - 40} y={Y - 150} s={2.2} o={P(f, versionAt + 30, 12)} /> : null}
                  {f >= origAt ? <text x={XL + 20} y={Y - 50} textAnchor="middle" fill={ORANGE} fontFamily={MONO} fontSize={18} letterSpacing={4} opacity={P(f, origAt, 8)}>DEPOIS QUE O ORIGINAL MORREU</text> : null}
                </svg>
                {/* o rosto real (Breencast) no começo da linha, cinza */}
                <div style={{ position: "absolute", left: X0 - 150, top: Y - 90, width: 180, height: 180, borderRadius: "50%", overflow: "hidden", border: "3px solid rgba(242,240,247,0.6)", filter: "grayscale(1) contrast(1.1)", opacity: lineK }}>
                  <AbsoluteFill style={{ transform: "scale(2.6)", transformOrigin: "26% 26%" }}>
                    <Clip src="videos/hl3_M01_R/clips/f_breencast_pp_hq.mp4" from={0} rate={1} />
                  </AbsoluteFill>
                </div>
              </div>
            );
          })()
        : null}
    </Shell>
  );
};
const TEALW = "#4fe3d0";

// ================================================================================================= 6 · continuar ≠ sobreviver
// a praça real do Breencast: no telão, em vez do rosto, a propaganda PERPETUIDADE · A PROMESSA DOS COMBINE (brilha) →
// corte: a larva no casulo ("conseguiu exatamente aquilo") · ELE SÓ CONTINUOU → o vidro do telão racha →
// continuar ≠ sobreviver.
export const HLWPerpPoster: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [perpAt, promAt, gordonAt, wantedAt, contAt, notAt, survAt] = ["perpAt", "promAt", "gordonAt", "wantedAt", "contAt", "notAt", "survAt"].map((k) => A(p, k));
  const ph2 = f >= gordonAt && f < notAt;
  const ph3 = P(f, notAt, 10);
  const crack = P(f, notAt, 8);
  return (
    <Shell f={f} life={life} bg="#0b0b09">
      {/* a praça com o telão */}
      {!ph2 ? (
        <AbsoluteFill style={{ opacity: 1 - 0.5 * ph3 }}>
          <AbsoluteFill style={{ transform: `scale(${1.6 + 0.002 * f})`, transformOrigin: "25.5% 25%" }}>
            <Sequence from={0} premountFor={10}>
              <Clip src="videos/hl3_M01_R/clips/f_breencast_pp_hq.mp4" from={0} rate={1} style={{ filter: "saturate(0.7) contrast(1.05)" }} />
            </Sequence>
            {/* o cartaz no lugar do rosto (telão: ~21–30% × 8–42%) */}
            <div style={{ position: "absolute", left: "21.2%", top: "8.6%", width: "8.8%", height: "33%", background: "#071216", boxShadow: `0 0 ${20 + 20 * P(f, promAt, 10)}px rgba(95,243,255,${0.4 + 0.4 * P(f, promAt, 10)})`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", opacity: P(f, perpAt - 10, 10), overflow: "hidden" }}>
              <svg width="70%" viewBox="0 0 100 100">
                <circle cx={50} cy={50} r={42} fill="none" stroke={CYAN} strokeWidth={5} />
                <path d="M 30 36 L 50 56 L 70 36 M 30 52 L 50 72 L 70 52" fill="none" stroke={CYAN} strokeWidth={6} />
              </svg>
              <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 16, color: TXT, marginTop: 6 }}>PERPETUIDADE</div>
              {crack > 0 ? (
                <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: "absolute", inset: 0 }}>
                  {[0, 1, 2, 3, 4, 5].map((k) => (
                    <polyline key={k} points={`50,40 ${50 + Math.cos(k) * 20 * crack},${40 + Math.sin(k) * 20 * crack} ${50 + Math.cos(k + 0.3) * 60 * crack},${40 + Math.sin(k + 0.3) * 70 * crack}`} fill="none" stroke="#fff" strokeWidth={0.8} opacity={0.9} />
                  ))}
                </svg>
              ) : null}
            </div>
          </AbsoluteFill>
          {f >= promAt && f < gordonAt ? <div style={{ position: "absolute", right: 120, top: 200, fontFamily: MONO, fontSize: 20, letterSpacing: 5, color: CYAN, opacity: P(f, promAt, 8) }}>A PROMESSA GRANDIOSA DOS COMBINE</div> : null}
        </AbsoluteFill>
      ) : (
        // a larva: quem conseguiu
        <AbsoluteFill>
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
            <ellipse cx={960} cy={560} rx={260} ry={360} fill="rgba(79,227,208,0.07)" stroke={TEALW} strokeWidth={3} />
            <Grub x={960 - 28 * 4} y={560} s={4} />
          </svg>
          <div style={{ position: "absolute", left: 0, right: 0, top: 110, textAlign: "center", fontFamily: MONO, fontSize: 20, letterSpacing: 5, color: TEALW }}>{f >= wantedAt ? "EXATAMENTE O QUE O BREEN QUERIA" : "ALGUÉM QUE CONSEGUIU"}</div>
          {f >= contAt ? <div style={{ position: "absolute", left: 0, right: 0, bottom: 120, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 84, color: TXT, opacity: P(f, contAt, 8) }}>ele só continuou</div> : null}
        </AbsoluteFill>
      )}
      {ph3 > 0 ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 440, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 110, color: TXT, opacity: P(f, survAt, 8), textShadow: "0 10px 50px #000" }}>
          continuar <span style={{ color: RED }}>≠</span> sobreviver
        </div>
      ) : null}
    </Shell>
  );
};

// ================================================================================================= 7 · o guia de campo de Xen
// três páginas de caderno de campo, a lápis, que se desenham na palavra: HOUNDEYE (três patas, domo, a placa de sonar)
// em matilha · BULLSQUID (tentáculos na boca, cauda com ferrão) no pântano · BARNACLE presa a uma estrutura, a língua
// pendurada no vazio, sem chão embaixo. Traço com hachura, anotações com seta.
const draw = (f: number, at: number, len = 1600, d = 26) => ({ strokeDasharray: `${len * P(f, at, d)} ${len}` });
const INK = "#2b2418";
const WASH = (id: string, c0: string, c1: string) => (
  <defs>
    <radialGradient id={id} cx="0.4" cy="0.35" r="0.75">
      <stop offset="0" stopColor={c0} />
      <stop offset="1" stopColor={c1} />
    </radialGradient>
  </defs>
);
const Houndeye: React.FC<{ x: number; y: number; s: number; f: number; at: number }> = ({ x, y, s, f, at }) => {
  // referência: corpo em barril carnudo amarelo-esverdeado com vincos azulados, o disco frontal de lábio rosado
  // cheio de esferas escuras (os olhos) com espinhos finos, três pernas finas de joelho invertido e garras escuras
  const fill = P(f, at + 14, 14);
  const id = `hd${Math.round(x)}${Math.round(y)}`;
  const orbs: [number, number, number][] = [];
  for (let r = 0; r < 5; r++)
    for (let c = 0; c < 4; c++) {
      const ox = -12 + c * 9 + (r % 2) * 4.5;
      const oy = -40 + r * 16;
      if (Math.hypot((ox - 2) / 22, oy / 44) < 1) orbs.push([ox, oy, 7.4]);
    }
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} strokeLinecap="round" strokeLinejoin="round">
      <defs>
        <radialGradient id={`${id}b`} cx="0.45" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#efe2a0" />
          <stop offset="0.55" stopColor="#c6b46a" />
          <stop offset="1" stopColor="#7e7440" />
        </radialGradient>
        <radialGradient id={`${id}o`} cx="0.35" cy="0.3" r="0.7">
          <stop offset="0" stopColor="#5a5f9a" />
          <stop offset="0.6" stopColor="#22244a" />
          <stop offset="1" stopColor="#0c0c1c" />
        </radialGradient>
      </defs>
      {/* perna de trás (longe) */}
      <path d="M -70 30 C -86 54, -92 66, -84 82 L -98 112 M -98 112 l -12 4 M -98 112 l -4 12 M -98 112 l 8 8" fill="none" stroke={INK} strokeWidth={6} style={draw(f, at + 8, 400)} />
      {/* pernas da frente (uma perto, uma longe) */}
      <path d="M 22 34 C 30 58, 18 74, 30 92 L 20 120 M 20 120 l -12 4 M 20 120 l -2 12 M 20 120 l 10 8" fill="none" stroke={INK} strokeWidth={6.5} style={draw(f, at + 6, 400)} />
      <path d="M -20 36 C -14 60, -30 76, -18 94 L -26 118 M -26 118 l -12 4 M -26 118 l -2 12 M -26 118 l 10 6" fill="none" stroke={INK} strokeWidth={5} opacity={0.75} style={draw(f, at + 9, 400)} />
      {/* o corpo em barril */}
      <path d="M -112 -8 C -118 -62, -60 -84, 0 -80 C 40 -78, 62 -60, 64 -40 L 64 40 C 40 52, -40 56, -92 44 C -112 36, -116 18, -112 -8 Z" fill={`url(#${id}b)`} fillOpacity={0.92 * fill} stroke={INK} strokeWidth={4.5} style={draw(f, at, 1200)} />
      {/* vincos e dobras azuladas em volta do corpo */}
      {[-90, -66, -42, -18, 6, 30].map((xx, k) => (
        <path key={k} d={`M ${xx} ${-74 + Math.abs(xx + 30) * 0.06} Q ${xx + 10} -10 ${xx + 2} ${46 - Math.abs(xx) * 0.02}`} fill="none" stroke={k % 2 ? "#4a5a8a" : INK} strokeWidth={k % 2 ? 3 : 1.8} opacity={0.6} style={draw(f, at + 12 + k * 2, 200, 10)} />
      ))}
      {/* sombra hachurada por baixo */}
      {Array.from({ length: 12 }).map((_, k) => <line key={k} x1={-96 + k * 13} y1={42} x2={-88 + k * 13} y2={22} stroke={INK} strokeWidth={1.2} opacity={0.5} style={draw(f, at + 18 + k, 40, 8)} />)}
      {/* o disco do rosto: lábio rosado e as esferas escuras */}
      <ellipse cx={74} cy={0} rx={30} ry={56} fill="#b85a64" fillOpacity={fill} stroke={INK} strokeWidth={4.5} style={draw(f, at + 6, 400)} />
      <ellipse cx={76} cy={0} rx={23} ry={46} fill="#1a1a30" fillOpacity={fill} stroke={INK} strokeWidth={2} style={draw(f, at + 10, 300)} />
      <g transform="translate(76 0)" opacity={fill}>
        {orbs.map(([ox, oy, r], k) => (
          <g key={k}>
            <circle cx={ox} cy={oy} r={r} fill={`url(#${id}o)`} stroke="#05050c" strokeWidth={1} />
            <circle cx={ox - 2.5} cy={oy - 2.5} r={1.8} fill="#cfd8ff" opacity={0.85} />
          </g>
        ))}
        {/* espinhos finos entre as esferas */}
        {Array.from({ length: 9 }).map((_, k) => {
          const a = -1.2 + k * 0.3;
          return <line key={k} x1={Math.cos(a) * 14} y1={Math.sin(a) * 28} x2={Math.cos(a) * 34 + 6} y2={Math.sin(a) * 52} stroke="#8fd8e8" strokeWidth={1.4} />;
        })}
      </g>
      {/* pregas do lábio */}
      {Array.from({ length: 10 }).map((_, k) => {
        const a = (k / 10) * Math.PI * 2;
        return <line key={"l" + k} x1={74 + Math.cos(a) * 24} y1={Math.sin(a) * 47} x2={74 + Math.cos(a) * 30} y2={Math.sin(a) * 56} stroke={INK} strokeWidth={1.4} opacity={0.6} style={draw(f, at + 16 + k, 20, 4)} />;
      })}
    </g>
  );
};
const Bullsquid: React.FC<{ x: number; y: number; s: number; f: number; at: number }> = ({ x, y, s, f, at }) => {
  // referência: corpo de lagarto curvado (costas em arco), pele mostarda com manchas de onça, cauda longa que afina num
  // ferrão, duas pernas traseiras fortes (coxa grande, joelho para trás, pé de três garras), cabeça triangular para a
  // frente, olho amarelo e o tufo de tentáculos vermelhos serrilhados saindo da boca
  const fill = P(f, at + 14, 14);
  const id = `bs${Math.round(x)}${Math.round(y)}`;
  const spots: [number, number, number][] = [[-60, -60, 9], [-32, -74, 11], [-2, -78, 10], [28, -70, 9], [52, -58, 7], [-46, -38, 8], [-16, -50, 9], [14, -50, 8], [40, -40, 6], [-74, -42, 6], [-112, -50, 6], [-140, -60, 5], [-168, -72, 4], [72, -50, 5]];
  const leg = (dx: number, w: number, o: number, d: number) => (
    <g opacity={o} transform={`translate(${dx} 0)`}>
      <ellipse cx={-34} cy={-18} rx={38} ry={30} fill={`url(#${id}b)`} fillOpacity={0.95 * fill} stroke={INK} strokeWidth={4} style={draw(f, at + d, 300)} />
      <path d="M -24 6 L -6 34 L -34 66 L -14 80" fill="none" stroke={INK} strokeWidth={w} style={draw(f, at + d + 2, 300)} />
      <path d="M -24 6 L -6 34 L -34 66 L -14 80" fill="none" stroke="#b88e52" strokeWidth={w - 5} opacity={fill} />
      <path d="M -14 80 l 18 0 m -18 0 l 14 10 m -14 -10 l 4 14" fill="none" stroke={INK} strokeWidth={4} />
    </g>
  );
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} strokeLinecap="round" strokeLinejoin="round">
      <defs>
        <radialGradient id={`${id}b`} cx="0.5" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#ecd090" />
          <stop offset="0.6" stopColor="#c09456" />
          <stop offset="1" stopColor="#74522c" />
        </radialGradient>
      </defs>
      {/* perna de trás (longe) */}
      {leg(26, 13, 0.55, 8)}
      {/* cauda longa que afina num ferrão */}
      <path d="M -84 -40 C -130 -56, -180 -64, -226 -104 L -250 -132 L -232 -100 C -190 -70, -140 -48, -92 -26 Z" fill={`url(#${id}b)`} fillOpacity={0.92 * fill} stroke={INK} strokeWidth={4} style={draw(f, at + 4, 700)} />
      {/* tronco com as costas em arco, pescoço e cabeça triangular */}
      <path d="M -96 -36 C -90 -92, 10 -104, 54 -78 C 70 -70, 80 -62, 92 -64 C 118 -66, 140 -50, 142 -34 C 142 -20, 126 -10, 104 -10 C 90 -10, 80 -4, 70 4 C 40 22, -40 24, -70 12 C -90 4, -98 -16, -96 -36 Z" fill={`url(#${id}b)`} fillOpacity={0.94 * fill} stroke={INK} strokeWidth={4.5} style={draw(f, at, 1400)} />
      {/* manchas de onça */}
      {spots.map(([cx, cy, r], k) => (
        <g key={k} opacity={fill}>
          <ellipse cx={cx} cy={cy} rx={r} ry={r * 0.72} fill="#4a2e16" stroke={INK} strokeWidth={1.2} />
          <ellipse cx={cx + 1} cy={cy - 1} rx={r * 0.42} ry={r * 0.28} fill="#a87a48" />
        </g>
      ))}
      {/* perna da frente (perto) */}
      {leg(0, 15, 1, 6)}
      {/* o olho amarelo e a sobrancelha */}
      <path d="M 104 -56 q 12 -6 22 2" fill="none" stroke={INK} strokeWidth={3} />
      <circle cx={114} cy={-46} r={8} fill="#f2d24a" fillOpacity={fill} stroke={INK} strokeWidth={2.5} />
      <ellipse cx={116} cy={-46} rx={2.4} ry={5} fill={INK} opacity={fill} />
      {/* o tufo de tentáculos vermelhos serrilhados, saindo da boca */}
      {[-40, -22, -6, 10, 26].map((a2, k) => {
        const L = 48 + (k % 2) * 16;
        const sx = 140;
        const sy = -28 + k * 3;
        const ax = sx + Math.cos((a2 * Math.PI) / 180) * L;
        const ay = sy + Math.sin((a2 * Math.PI) / 180) * L + Math.sin(f / 9 + k) * 3;
        const mx = (sx + ax) / 2;
        const my = (sy + ay) / 2 - 8;
        return (
          <g key={k}>
            <path d={`M ${sx} ${sy} Q ${mx} ${my} ${ax} ${ay}`} fill="none" stroke="#6a1a12" strokeWidth={10} style={draw(f, at + 10 + k * 2, 140, 12)} />
            <path d={`M ${sx} ${sy} Q ${mx} ${my} ${ax} ${ay}`} fill="none" stroke="#cc4430" strokeWidth={5.5} opacity={fill} />
            {[0.3, 0.55, 0.8].map((t, j) => {
              const px = (1 - t) * (1 - t) * sx + 2 * (1 - t) * t * mx + t * t * ax;
              const py = (1 - t) * (1 - t) * sy + 2 * (1 - t) * t * my + t * t * ay;
              return <path key={j} d={`M ${px} ${py - 4} l 4 -7 l 3 7`} fill="#f0dcc8" stroke={INK} strokeWidth={0.8} opacity={fill} />;
            })}
          </g>
        );
      })}
      {/* sombra hachurada */}
      {Array.from({ length: 12 }).map((_, k) => <line key={k} x1={-80 + k * 15} y1={18} x2={-72 + k * 15} y2={0} stroke={INK} strokeWidth={1.2} opacity={0.45} style={draw(f, at + 18 + k, 40, 8)} />)}
    </g>
  );
};
const Barnacle: React.FC<{ x: number; y: number; s: number; f: number; at: number }> = ({ x, y, s, f, at }) => {
  // referência: grudado no teto, corpo carnudo marrom-avermelhado cheio de fibras/pelos em volta, um olho, presas
  // curvas brancas, o maxilar oliva com espinhos e a língua comprida até embaixo, com o gancho na ponta
  const fill = P(f, at + 12, 14);
  const id = `bn${Math.round(x)}${Math.round(y)}`;
  const sway = Math.sin(f / 14) * 6;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} strokeLinecap="round" strokeLinejoin="round">
      <defs>
        <radialGradient id={`${id}b`} cx="0.45" cy="0.35" r="0.75">
          <stop offset="0" stopColor="#c88a6a" />
          <stop offset="0.6" stopColor="#8a4a34" />
          <stop offset="1" stopColor="#4a2418" />
        </radialGradient>
        <linearGradient id={`${id}j`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#b8a45a" />
          <stop offset="1" stopColor="#6e6630" />
        </linearGradient>
      </defs>
      {/* o teto de rocha */}
      <path d="M -190 -112 Q -100 -122 0 -114 T 190 -112 L 190 -90 Q 100 -84 0 -92 T -190 -90 Z" fill="#8a8478" fillOpacity={0.7 * fill} stroke={INK} strokeWidth={4} style={draw(f, at, 900)} />
      {Array.from({ length: 16 }).map((_, k) => <line key={k} x1={-180 + k * 24} y1={-108} x2={-170 + k * 24} y2={-94} stroke={INK} strokeWidth={1.2} opacity={0.5} />)}
      {/* fibras/pelos em volta do corpo */}
      {Array.from({ length: 64 }).map((_, k) => {
        const a = Math.PI + (k / 63) * Math.PI;
        const r0 = 62;
        const r1 = 92 + (k % 4) * 12 + rnd(k) * 14;
        return <path key={k} d={`M ${Math.cos(a) * r0} ${-54 - Math.sin(a) * r0 * 0.7} q ${Math.cos(a + 0.4) * 10} ${-Math.sin(a) * 8} ${Math.cos(a) * (r1 - r0)} ${-Math.sin(a) * (r1 - r0) * 0.7}`} fill="none" stroke="#6a3a26" strokeWidth={2} opacity={0.8 * fill} />;
      })}
      {Array.from({ length: 6 }).map((_, k) => {
        const a = 0.3 + k * 0.5;
        return <path key={"t" + k} d={`M ${Math.cos(a) * 60 * (k % 2 ? 1 : -1)} ${-60} q ${(k % 2 ? 1 : -1) * 30} -10 ${(k % 2 ? 1 : -1) * 50} ${-20 + k * 8} q 8 6 4 14`} fill="none" stroke="#5a3020" strokeWidth={3} opacity={0.85 * fill} style={draw(f, at + 4 + k, 120, 10)} />;
      })}
      {/* o corpo (a cabeça) */}
      <path d="M -70 -92 C -82 -30, -54 4, 0 8 C 54 4, 82 -30, 70 -92 Z" fill={`url(#${id}b)`} fillOpacity={0.94 * fill} stroke={INK} strokeWidth={4.5} style={draw(f, at + 4, 600)} />
      {[0, 1, 2].map((k) => <path key={k} d={`M ${-56 + k * 6} ${-70 + k * 18} Q 0 ${-58 + k * 22} ${56 - k * 6} ${-70 + k * 18}`} fill="none" stroke={INK} strokeWidth={1.6} opacity={0.55} style={draw(f, at + 10 + k, 160, 10)} />)}
      {/* o olho */}
      <ellipse cx={-30} cy={-46} rx={10} ry={7} fill="#e8d0a0" fillOpacity={fill} stroke={INK} strokeWidth={2.5} />
      <circle cx={-28} cy={-46} r={3.5} fill={INK} opacity={fill} />
      {/* o maxilar oliva com espinhos e as presas curvas */}
      <path d="M -46 -4 C -40 30, -18 44, 0 44 C 18 44, 40 30, 46 -4" fill={`url(#${id}j)`} fillOpacity={0.94 * fill} stroke={INK} strokeWidth={4} style={draw(f, at + 8, 300)} />
      {[-36, -22, 22, 36].map((xx, k) => <path key={k} d={`M ${xx} ${10 + Math.abs(xx) * 0.1} l ${xx > 0 ? 8 : -8} 6`} stroke={INK} strokeWidth={2.4} opacity={fill} />)}
      {[-30, -16, -4, 8, 20, 32].map((xx, k) => (
        <path key={"f" + k} d={`M ${xx - 4} 0 L ${xx + 4} 0 Q ${xx + (xx > 0 ? 6 : -2)} 20 ${xx + (xx > 0 ? -3 : 3)} 38 Q ${xx - (xx > 0 ? 2 : -2)} 18 ${xx - 4} 0 Z`} fill="#f4efe2" fillOpacity={fill} stroke={INK} strokeWidth={2} style={draw(f, at + 12 + k, 60, 8)} />
      ))}
      {/* a língua: comprida, pendurada, com o gancho grudento na ponta */}
      <path d={`M 0 40 C ${sway} 150, ${-sway} 270, ${sway * 0.6} 400`} fill="none" stroke="#7a3428" strokeWidth={9} style={draw(f, at + 14, 420)} />
      <path d={`M 0 40 C ${sway} 150, ${-sway} 270, ${sway * 0.6} 400`} fill="none" stroke="#c8705e" strokeWidth={4} opacity={fill} />
      <path d={`M ${sway * 0.6 - 10} 396 q 10 26 22 4 q -4 -8 -10 -4`} fill="#e8e0d0" fillOpacity={fill} stroke={INK} strokeWidth={2.4} />
      {[110, 190, 280, 350].map((yy, k) => <circle key={k} cx={sway * Math.sin(yy / 90)} cy={yy} r={4} fill="#e8a090" opacity={0.85 * fill} />)}
    </g>
  );
};
// a ilustração do caderno (feita a partir das referências do Paulo): o traço de grafite se desenha da esquerda para a
// direita e a aquarela entra por cima
const Sketch: React.FC<{ name: string; x: number; y: number; w: number; h: number; f: number; at: number; flip?: boolean }> = ({ name, x, y, w, h, f, at, flip }) => {
  const id = `sk${name}${Math.round(x)}${Math.round(y)}`;
  const wipe = P(f, at, 22);
  const col = P(f, at + 16, 16);
  const tr = flip ? `translate(${x + w} ${y}) scale(-1 1)` : `translate(${x} ${y})`;
  return (
    <g transform={tr}>
      <defs>
        <clipPath id={id}>
          <rect x={0} y={0} width={w * wipe} height={h} />
        </clipPath>
      </defs>
      <image href={staticFile(`hl3silh/caderno_${name}_linha.png`)} x={0} y={0} width={w} height={h} clipPath={`url(#${id})`} preserveAspectRatio="xMidYMid meet" />
      <image href={staticFile(`hl3silh/caderno_${name}_cor.png`)} x={0} y={0} width={w} height={h} opacity={col} preserveAspectRatio="xMidYMid meet" />
    </g>
  );
};
export const HLWFieldGuide: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [houndAt, packAt, bullAt, swampAt, barnAt, voidAt] = ["houndAt", "packAt", "bullAt", "swampAt", "barnAt", "voidAt"].map((k) => A(p, k));
  const page = (i: number, at: number, title: string, sub: string, children: React.ReactNode, note?: React.ReactNode) => {
    const o = P(f, at, 10);
    return (
      <div key={i} style={{ position: "absolute", left: 90 + i * 590, top: 150, width: 560, height: 760, borderRadius: 8, background: "#e9e0cc", boxShadow: "0 30px 70px rgba(0,0,0,0.6)", opacity: o, transform: `rotate(${(i - 1) * 2.2}deg) translateY(${(1 - o) * 80}px)`, overflow: "hidden" }}>
        {Array.from({ length: 24 }).map((_, k) => (
          <div key={k} style={{ position: "absolute", left: 0, right: 0, top: 40 + k * 30, height: 1, background: "rgba(43,36,24,0.08)" }} />
        ))}
        <svg width={560} height={760} style={{ position: "absolute", inset: 0 }}>
          {children}
        </svg>
        <div style={{ position: "absolute", left: 30, bottom: 70, fontFamily: MONO, fontSize: 14, letterSpacing: 4, color: "rgba(43,36,24,0.7)" }}>{`XEN · ESPÉCIME 0${i + 1}`}</div>
        <div style={{ position: "absolute", left: 30, bottom: 26, fontFamily: FONT, fontWeight: 800, fontSize: 44, color: INK }}>{title}</div>
        <div style={{ position: "absolute", right: 28, bottom: 34, fontFamily: HANDW, fontSize: 30, color: "#7a2a1e" }}>{sub}</div>
        {note}
      </div>
    );
  };
  return (
    <Shell f={f} life={life} bg="#100c08">
      <Corner f={f} at={0} t="CRIATURAS CLÁSSICAS" sub="CADERNO DE CAMPO · XEN" col={ORANGE} />
      {page(
        0,
        houndAt,
        "Houndeye",
        "caçam em grupo",
        <g>
          <Sketch name="houndeye" x={70} y={110} w={430} h={430} f={f} at={houndAt + 2} />
          {f >= packAt ? <Sketch name="houndeye" x={50} y={500} w={150} h={150} f={f} at={packAt} /> : null}
          {f >= packAt ? <Sketch name="houndeye" x={340} y={515} w={135} h={135} f={f} at={packAt + 4} flip /> : null}
          <path d="M 430 230 L 470 110" stroke="#7a2a1e" strokeWidth={2} fill="none" style={draw(f, houndAt + 20, 140, 10)} />
          <text x={360} y={98} fill="#7a2a1e" fontFamily={HANDW} fontSize={26} opacity={P(f, houndAt + 26, 8)}>olhos · sonar</text>
        </g>,
      )}
      {page(
        1,
        bullAt,
        "Bullsquid",
        "nos pântanos",
        <g>
          <Sketch name="bullsquid" x={20} y={190} w={520} h={270} f={f} at={bullAt + 2} />
          {f >= swampAt
            ? [0, 1, 2].map((k) => <path key={k} d={`M 60 ${490 + k * 26} q 60 ${-10 + Math.sin(f / 10 + k) * 6} 120 0 t 120 0 t 120 0 t 120 0`} fill="none" stroke="#3b6a7a" strokeWidth={2} opacity={0.8} style={draw(f, swampAt + k * 3, 600, 14)} />)
            : null}
          <path d="M 190 160 l -70 110" stroke="#7a2a1e" strokeWidth={2} fill="none" style={draw(f, bullAt + 20, 140, 10)} />
          <text x={150} y={150} fill="#7a2a1e" fontFamily={HANDW} fontSize={26} opacity={P(f, bullAt + 26, 8)}>tentáculos · cospe ácido</text>
        </g>,
      )}
      {page(
        2,
        barnAt,
        "Barnacle",
        "sem chão embaixo",
        <g>
          <path d="M 40 130 Q 280 112 520 130 L 520 150 Q 280 136 40 150 Z" fill="#8a8478" fillOpacity={0.7 * P(f, barnAt, 10)} stroke={INK} strokeWidth={3} style={draw(f, barnAt, 1100)} />
          <Sketch name="barnacle" x={130} y={112} w={300} h={520} f={f} at={barnAt + 4} />
          <path d="M 410 190 L 300 370" stroke="#7a2a1e" strokeWidth={2} fill="none" style={draw(f, barnAt + 20, 220, 10)} />
          <text x={390} y={182} fill="#7a2a1e" fontFamily={HANDW} fontSize={26} opacity={P(f, barnAt + 26, 8)}>presas</text>
          {f >= voidAt ? (
            <g opacity={P(f, voidAt, 10)}>
              {Array.from({ length: 10 }).map((_, k) => (
                <line key={k} x1={60 + k * 46} y1={680} x2={90 + k * 46} y2={650} stroke="rgba(43,36,24,0.35)" strokeWidth={1.4} />
              ))}
              <text x={400} y={630} textAnchor="middle" fill="#7a2a1e" fontFamily={HANDW} fontSize={28}>vazio</text>
            </g>
          ) : null}
        </g>,
      )}
    </Shell>
  );
};

// ================================================================================================= 7 · o vazamento (wireframe 3D)
// o Borealis em wireframe (casco que afina até a quilha, convés, castelo de popa, mastros, compartimentos) flutuando;
// embaixo, A FERIDA (rachadura acesa) e a membrana de Xen (grade violeta). A sincronia cai → a membrana sobe e Xen
// VAZA em manchas violeta dentro dos compartimentos. Painel: o botão XEN riscado. A Alyx (marcador) num compartimento
// SEGURA uma ruptura aberta. Dois medidores: o que ela entende do Borealis × o que ela mostra ao Gordon.
const SHIP: [number, number][] = [[-30, -7], [20, -7], [34, 0], [20, 7], [-30, 7]];
export const HLWLeak: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [notTravelAt, syncAt, woundAt, vortAt, leakAt, weightAt, buttonAt, recogAt, openAt, jumpAt, betterAt, hideAt] = ["notTravelAt", "syncAt", "woundAt", "vortAt", "leakAt", "weightAt", "buttonAt", "recogAt", "openAt", "jumpAt", "betterAt", "hideAt"].map((k) => A(p, k));
  const c = camAt(f, [
    [0, 0, 0, 0, 0.5, 0.35, 70],
    [woundAt, 0, 0, -4, 0.6, 0.28, 62],
    [leakAt, -4, 0, 0, 0.75, 0.42, 48],
    [weightAt, -8, 2, 0, 0.9, 0.6, 34],
    [openAt, -10, 2, 1, 1.0, 0.62, 28],
    [life, -10, 2, 1, 1.05, 0.64, 26],
  ]);
  const W = mkW(c);
  const sync = 1 - P(f, syncAt, 40) * 0.85;
  const memb = P(f, syncAt, 50);
  const lk = P(f, leakAt, 30);
  // a ferida (rachadura) e a membrana de Xen
  const wz = -12;
  const crack: V[] = Array.from({ length: 18 }).map((_, i) => [-36 + i * 4.4, Math.sin(i * 1.9) * 2.5 + Math.sin(i * 0.7) * 1.5, wz]);
  W.line(crack, "#ff8a5a", 4, P(f, woundAt, 12) * (0.7 + 0.3 * Math.sin(f / 5)));
  if (f >= woundAt && f < weightAt + 12) W.text([0, 6, wz], "A FERIDA", "#ff8a5a", 18, P(f, woundAt, 10) * (1 - P(f, weightAt, 12)));
  if (f >= vortAt && f < leakAt + 12) W.text([0, 10, wz], "O QUE OS VORTIGAUNTS PERCEBEM DESDE O COMEÇO", "rgba(255,170,140,0.9)", 15, P(f, vortAt, 10) * (1 - P(f, leakAt, 12)));
  const mz = wz + 2 + memb * 6;
  for (let i = 0; i <= 14; i++) W.line(Array.from({ length: 15 }).map((_, k) => [-40 + i * 5.6, -18 + k * 2.6, mz + Math.sin(i * 0.8 + k * 0.6 + f / 10) * 0.8 * memb] as V), "rgba(199,155,255,0.35)", 1, 0.3 + 0.5 * memb);
  if (memb > 0.2) W.text([30, -16, mz + 1], "A FRONTEIRA COM XEN", "#c79bff", 15, memb);
  // o casco
  const deck = 4;
  const keel = -4;
  W.line([...SHIP.map((q) => [q[0], q[1], deck] as V), [SHIP[0][0], SHIP[0][1], deck]], ICE, 2.2);
  W.line([[-30, 0, keel], [26, 0, keel], [34, 0, deck]], ICE, 1.6, 0.8);
  SHIP.forEach((q) => W.line([[q[0], q[1], deck], [Math.min(q[0], 26), 0, keel]], "rgba(159,230,255,0.45)", 1.2));
  for (let i = 0; i < 9; i++) {
    const x = -28 + i * 6;
    const w = x > 20 ? 7 - (x - 20) * 0.5 : 7;
    W.line([[x, -w, deck], [x, 0, keel], [x, w, deck]], "rgba(159,230,255,0.25)", 1);
  }
  // castelo de popa e mastros
  W.box(-30, -5, deck, 9, 10, 6, "rgba(159,230,255,0.7)", "rgba(159,230,255,0.05)");
  W.box(-28, -3.5, deck + 6, 6, 7, 2.5, "rgba(159,230,255,0.6)", "rgba(159,230,255,0.05)");
  [-8, 6].forEach((x) => W.line([[x, 0, deck], [x, 0, deck + 12]], "rgba(159,230,255,0.6)", 1.6));
  W.line([[-8, 0, deck + 11], [10, 0, deck + 4]], "rgba(159,230,255,0.4)", 1.2);
  W.text([-26, -6, deck + 10], "BOREALIS", ICE, 18, 1, "start");
  // compartimentos (dentro do casco, sob o convés)
  const comps: [number, number][] = [[-18, -3], [-8, -3], [2, -3], [12, -3]];
  comps.forEach(([x, y], i) => {
    W.box(x, y, -1, 8, 6, 4.6, "rgba(159,230,255,0.4)", "rgba(159,230,255,0.03)");
    const L = Math.max(0, Math.min(1, lk * 1.6 - i * 0.25));
    if (L > 0) {
      const q = pr(c, x + 4, y + 3, 1.2);
      if (q[2] > 2) W.out.push(<ellipse key={`lk${i}`} cx={q[0]} cy={q[1]} rx={(900 / q[2]) * 3.2 * L} ry={(900 / q[2]) * 1.8 * L} fill="rgba(199,155,255,0.35)" style={{ filter: "blur(6px)" }} />);
    }
  });
  if (lk > 0.3) W.text([-3, -4, 4.4], "XEN VAZA PARA DENTRO", "#c79bff", 16, lk);
  // a Alyx segurando uma ruptura aberta (compartimento 1)
  if (f >= recogAt) {
    W.person(-15, 1.5, ORANGE, "ALYX", P(f, recogAt, 10), 0, f >= openAt ? "MANTEVE ABERTA" : "RECONHECEU A RUPTURA");
    const q = pr(c, -8.4, -2.4, 1.4);
    if (q[2] > 2) {
      const r = (900 / q[2]) * (1.2 + 0.1 * Math.sin(f / 4)) * P(f, recogAt, 14);
      W.out.push(
        <g key="aring">
          <ellipse cx={q[0]} cy={q[1]} rx={r} ry={r * 1.3} fill="rgba(199,155,255,0.25)" stroke="#ff9be8" strokeWidth={3} />
          {f >= openAt ? <ellipse cx={q[0]} cy={q[1]} rx={r * 1.3} ry={r * 1.7} fill="none" stroke={ORANGE} strokeWidth={2} strokeDasharray="6 6" strokeDashoffset={-f} /> : null}
        </g>,
      );
    }
  }
  return (
    <Shell f={f} life={life} bg="#07070c">
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {W.out}
      </svg>
      <Corner f={f} at={0} t="O BOREALIS NÃO VIAJA PARA XEN" sub={f >= leakAt ? "A FRONTEIRA VAZA PARA DENTRO DELE" : "QUANDO PERDE A SINCRONIA"} col={ORANGE} />
      {/* sincronia */}
      {f >= syncAt ? (
        <div style={{ position: "absolute", right: 90, top: 70, width: 360, padding: "12px 16px", borderRadius: 10, background: "rgba(7,7,12,0.88)", fontFamily: MONO, opacity: P(f, syncAt, 10) }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, letterSpacing: 4, color: sync < 0.5 ? RED : ICE }}>
            <span>SINCRONIA</span>
            <span>{`${Math.round(sync * 100)}%`}</span>
          </div>
          <div style={{ height: 8, marginTop: 8, borderRadius: 4, background: "rgba(159,230,255,0.15)" }}>
            <div style={{ height: "100%", width: `${sync * 100}%`, background: sync < 0.5 ? RED : ICE, borderRadius: 4 }} />
          </div>
        </div>
      ) : null}
      {/* o botão XEN que ela NÃO apertou */}
      {f >= buttonAt && f < recogAt + 30 ? (
        <div style={{ position: "absolute", left: 90, bottom: 110, display: "flex", alignItems: "center", gap: 24, padding: "18px 24px", borderRadius: 14, background: "rgba(10,8,14,0.85)", border: "1px solid rgba(242,240,247,0.25)", opacity: P(f, buttonAt, 8) }}>
          <div style={{ position: "relative", padding: "14px 30px", borderRadius: 10, border: "3px solid #c79bff", fontFamily: FONT, fontWeight: 800, fontSize: 44, color: "#c79bff" }}>
            XEN
            <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }} viewBox="0 0 100 100" preserveAspectRatio="none">
              <line x1={4} y1={96} x2={96} y2={4} stroke={RED} strokeWidth={6} strokeDasharray={`${140 * P(f, buttonAt + 8, 8)} 140`} />
            </svg>
          </div>
          <div style={{ fontFamily: MONO, fontSize: 18, letterSpacing: 4, color: TXT }}>ELA NÃO APERTOU UM BOTÃO</div>
        </div>
      ) : null}
      {/* entender × mostrar */}
      {f >= jumpAt ? (
        <div style={{ position: "absolute", left: 90, bottom: 100, width: 640, fontFamily: MONO, opacity: P(f, jumpAt, 10) }}>
          {[
            { k: "O QUE ELA ENTENDE DO BOREALIS", v: interpolate(f, [jumpAt, betterAt + 20], [30, 92], C), c: ORANGE },
            { k: "O QUE ELA DEIXA O GORDON PERCEBER", v: f >= hideAt ? 18 : 30, c: "rgba(242,240,247,0.6)" },
          ].map((m, i) => (
            <div key={i} style={{ marginTop: i ? 18 : 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, letterSpacing: 3, color: m.c }}>
                <span>{m.k}</span>
                <span>{`${Math.round(m.v)}%`}</span>
              </div>
              <div style={{ height: 8, marginTop: 6, borderRadius: 4, background: "rgba(242,240,247,0.12)" }}>
                <div style={{ height: "100%", width: `${m.v}%`, background: m.c, borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </div>
      ) : null}
      {void notTravelAt}
      {void weightAt}
    </Shell>
  );
};

// ================================================================================================= 7–8 · rodada 3 (56:22 → 1:00:31)
// mapa do litoral ártico (mesmo desenho na fuga para a frota e na corrida): costa recortada, gelo em placas, grade
// polar apagada; tudo entra na palavra e cada coisa que entra tem som no edit.json.
const coastPts = (seed: number, y0: number, amp: number): [number, number][] =>
  Array.from({ length: 49 }).map((_, i) => {
    const x = -80 + i * 42.5;
    return [x, y0 + Math.sin(i * 0.55 + seed) * amp + Math.sin(i * 1.7 + seed * 2) * amp * 0.35 + (rnd(i + seed * 13) - 0.5) * amp * 0.5];
  });
export const ArcticBase: React.FC<{ f: number; seed?: number; y0?: number; o?: number }> = ({ f, seed = 1, y0 = 330, o = 1 }) => {
  const cp = coastPts(seed, y0, 60);
  const land = `M -100 -100 L 2100 -100 L 2100 ${cp[cp.length - 1][1]} ${cp.map(([x, y]) => `L ${x} ${y}`).reverse().join(" ")} L -100 ${cp[0][1]} Z`;
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: o }}>
      <defs>
        <linearGradient id="seaG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0b1a26" />
          <stop offset="100%" stopColor="#050b12" />
        </linearGradient>
        <pattern id="iceHatch" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
          <line x1="0" y1="0" x2="0" y2="14" stroke="rgba(190,225,255,0.08)" strokeWidth="2" />
        </pattern>
      </defs>
      <rect x={0} y={0} width={1920} height={1080} fill="url(#seaG)" />
      {/* grade polar apagada */}
      {Array.from({ length: 9 }).map((_, i) => (
        <circle key={i} cx={960} cy={-1400} r={1600 + i * 180} fill="none" stroke="rgba(159,230,255,0.07)" strokeWidth={1} />
      ))}
      {Array.from({ length: 13 }).map((_, i) => (
        <line key={i} x1={960} y1={-1400} x2={-600 + i * 260} y2={1200} stroke="rgba(159,230,255,0.06)" strokeWidth={1} />
      ))}
      {/* placas de gelo à deriva */}
      {Array.from({ length: 26 }).map((_, i) => {
        const x = ((rnd(i * 3 + seed) * 2100 + f * (0.15 + rnd(i) * 0.2)) % 2100) - 90;
        const y = y0 + 90 + rnd(i * 7 + seed) * 640;
        const r = 14 + rnd(i * 5) * 42;
        const pts = Array.from({ length: 7 }).map((_, k) => {
          const a = (k / 7) * Math.PI * 2;
          const rr = r * (0.6 + rnd(i * 11 + k) * 0.5);
          return `${x + Math.cos(a) * rr * 1.5},${y + Math.sin(a) * rr * 0.6}`;
        });
        return <polygon key={i} points={pts.join(" ")} fill="rgba(200,230,255,0.07)" stroke="rgba(200,230,255,0.22)" strokeWidth={1} />;
      })}
      {/* terra: gelo firme com hachura e as curvas de nível da costa */}
      <path d={land} fill="#0f1a22" />
      <path d={land} fill="url(#iceHatch)" />
      {[18, 40, 66].map((dy, k) => (
        <polyline key={k} points={cp.map(([x, y]) => `${x},${y - dy - k * 6}`).join(" ")} fill="none" stroke="rgba(159,230,255,0.12)" strokeWidth={1} />
      ))}
      <polyline points={cp.map(([x, y]) => `${x},${y}`).join(" ")} fill="none" stroke="rgba(200,235,255,0.75)" strokeWidth={2.2} />
      {Array.from({ length: 34 }).map((_, i) => {
        const x = 40 + rnd(i * 17 + seed) * 1840;
        const yc = cp[Math.max(0, Math.min(cp.length - 1, Math.round((x + 80) / 42.5)))][1];
        const y = yc - 70 - rnd(i * 23 + seed) * Math.max(0, yc - 140);
        const w = 18 + rnd(i * 5) * 26;
        return y > 40 ? <polyline key={"r" + i} points={`${x - w},${y + 8} ${x - w * 0.3},${y - 10} ${x},${y - 4} ${x + w * 0.4},${y - 14} ${x + w},${y + 8}`} fill="none" stroke="rgba(200,235,255,0.22)" strokeWidth={1.4} /> : null;
      })}
      <text x={1780} y={Math.min(cp[44][1] - 40, 300)} textAnchor="end" fill="rgba(200,235,255,0.35)" fontFamily={MONO} fontSize={18} letterSpacing={10}>GELO · ÁRTICO</text>
      <text x={1780} y={cp[44][1] + 90} textAnchor="end" fill="rgba(159,230,255,0.3)" fontFamily={MONO} fontSize={18} letterSpacing={10}>MAR</text>
    </svg>
  );
};
// ícones do mapa
export const IcoComb: React.FC<{ x: number; y: number; s?: number; col?: string; o?: number }> = ({ x, y, s = 1, col = RED, o = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>
    <polygon points="0,-22 19,-11 19,11 0,22 -19,11 -19,-11" fill="rgba(30,6,6,0.85)" stroke={col} strokeWidth={2.5} />
    <path d="M -8 -9 L 8 -9 L 8 -3 L -2 -3 L -2 3 L 8 3 L 8 9 L -8 9 Z" fill={col} />
  </g>
);
export const IcoLambda: React.FC<{ x: number; y: number; s?: number; col?: string; o?: number }> = ({ x, y, s = 1, col = AMB, o = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>
    <circle r={18} fill="rgba(30,18,4,0.88)" stroke={col} strokeWidth={2.5} />
    <text y={8} textAnchor="middle" fill={col} fontFamily="Georgia, serif" fontSize={24} fontWeight={700}>λ</text>
  </g>
);
export const IcoShip: React.FC<{ x: number; y: number; s?: number; col?: string; o?: number; aura?: number }> = ({ x, y, s = 1, col = GREEN, o = 1, aura = 0 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>
    {aura > 0 ? <ellipse rx={70 * aura} ry={38 * aura} fill="none" stroke={col} strokeWidth={2} opacity={0.5} strokeDasharray="5 6" /> : null}
    <path d="M -46 0 L 34 0 L 48 -8 L 40 10 L -40 10 Z" fill="rgba(6,24,14,0.9)" stroke={col} strokeWidth={2.2} />
    <rect x={-34} y={-14} width={16} height={14} fill="none" stroke={col} strokeWidth={2} />
    <line x1={-2} y1={0} x2={-2} y2={-22} stroke={col} strokeWidth={2} />
    <line x1={14} y1={0} x2={14} y2={-16} stroke={col} strokeWidth={2} />
  </g>
);
const IcoDrop: React.FC<{ x: number; y: number; a?: number; col?: string }> = ({ x, y, a = 0, col = AMB }) => (
  <g transform={`translate(${x} ${y}) rotate(${(a * 180) / Math.PI})`}>
    <path d="M 26 0 L 6 -8 L -10 -22 L -16 -22 L -8 -6 L -20 -4 L -20 4 L -8 6 L -16 22 L -10 22 L 6 8 Z" fill="rgba(30,18,4,0.9)" stroke={col} strokeWidth={2.2} />
  </g>
);
const Pin: React.FC<{ x: number; y: number; f: number; t: number; label: string; sub?: string; col?: string; left?: boolean }> = ({ x, y, f, t, label, sub, col = ORANGE, left }) => {
  if (f < t) return null;
  const k = P(f, t, 10);
  return (
    <g opacity={k}>
      <circle cx={x} cy={y} r={14 + (1 - k) * 30} fill="none" stroke={col} strokeWidth={2.5} />
      <circle cx={x} cy={y} r={4} fill={col} />
      <polyline points={`${x},${y} ${x + (left ? -40 : 40)},${y - 50} ${x + (left ? -150 : 150)},${y - 50}`} fill="none" stroke={col} strokeWidth={2} />
      <text x={x + (left ? -154 : 154)} y={y - 56} textAnchor={left ? "end" : "start"} fill={col} fontFamily={MONO} fontSize={20} letterSpacing={4} style={{ paintOrder: "stroke", stroke: "#000", strokeWidth: 4 }}>{label}</text>
      {sub ? <text x={x + (left ? -154 : 154)} y={y - 30} textAnchor={left ? "end" : "start"} fill="rgba(242,240,247,0.75)" fontFamily={MONO} fontSize={15} letterSpacing={3} style={{ paintOrder: "stroke", stroke: "#000", strokeWidth: 4 }}>{sub}</text> : null}
    </g>
  );
};
const pathD = (pts: [number, number][]) => pts.map((q, i) => `${i ? "L" : "M"} ${q[0]} ${q[1]}`).join(" ");
const pathLen = (pts: [number, number][]) => pts.slice(1).reduce((s, q, i) => s + Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1]), 0);

// ------------------------------------------------------------------ 57:53 a fuga para a frota (mapa)
const INST_C: [number, number] = [380, 300];
const FLEET_C: [number, number] = [1500, 760];
const RUN: [number, number][] = [INST_C, [560, 420], [820, 470], [1050, 600], [1280, 690], FLEET_C];
export const HLWFleetRun: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [stealAt, transAt, reachAt, fleetAt] = ["stealAt", "transAt", "reachAt", "fleetAt"].map((k) => A(p, k));
  const draw = IO((f - transAt) / Math.max(20, fleetAt + 20 - transAt));
  const [cx, cy] = along(RUN, draw);
  const [nx, ny] = along(RUN, Math.min(1, draw + 0.02));
  const L = pathLen(RUN);
  const pan = interpolate(f, [0, life], [0, -160], C);
  return (
    <Shell f={f} life={life} bg="#081420">
      <AbsoluteFill style={{ transform: `translateX(${pan}px) scale(1.08)` }}>
        <ArcticBase f={f} seed={2} />
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          <IcoComb x={INST_C[0]} y={INST_C[1]} s={1.4} />
          <text x={INST_C[0]} y={INST_C[1] - 46} textAnchor="middle" fill={RED} fontFamily={MONO} fontSize={18} letterSpacing={4}>INSTALAÇÃO · LITORAL</text>
          <path d={pathD(RUN)} fill="none" stroke="rgba(255,178,46,0.25)" strokeWidth={3} strokeDasharray="8 12" opacity={f >= transAt ? 1 : 0} />
          <path d={pathD(RUN)} fill="none" stroke={AMB} strokeWidth={4} strokeDasharray={`${L * draw} ${L}`} style={{ filter: "drop-shadow(0 0 8px rgba(255,178,46,0.8))" }} />
          {f >= stealAt ? <IcoDrop x={f >= transAt ? cx : INST_C[0] + 50} y={f >= transAt ? cy : INST_C[1] + 30} a={Math.atan2(ny - cy, nx - cx)} /> : null}
          {f >= stealAt ? (
            <g opacity={P(f, stealAt, 8) * (1 - P(f, transAt + 30, 10))}>
              <rect x={INST_C[0] + 80} y={INST_C[1] + 20} width={250} height={36} rx={6} fill="rgba(30,18,4,0.9)" stroke={AMB} strokeWidth={2} transform={`rotate(-4 ${INST_C[0] + 200} ${INST_C[1] + 40})`} />
              <text x={INST_C[0] + 205} y={INST_C[1] + 44} textAnchor="middle" fill={AMB} fontFamily={MONO} fontSize={17} letterSpacing={3} transform={`rotate(-4 ${INST_C[0] + 200} ${INST_C[1] + 40})`}>TRANSPORTE · ROUBADO</text>
            </g>
          ) : null}
          {[[1440, 730], [1530, 790], [1600, 720], [1470, 830], [1680, 800]].map(([x, y], i) => (
            <IcoLambda key={i} x={x} y={y} s={0.9} o={P(f, fleetAt + i * 4, 8)} />
          ))}
          {f >= fleetAt ? <text x={FLEET_C[0] + 60} y={FLEET_C[1] + 120} textAnchor="middle" fill={AMB} fontFamily={MONO} fontSize={20} letterSpacing={5} opacity={P(f, fleetAt + 6, 8)}>FROTA DA RESISTÊNCIA</text> : null}
        </svg>
      </AbsoluteFill>
      <Corner f={f} at={0} t="A FUGA" sub="DA INSTALAÇÃO ATÉ A FROTA" col={AMB} />
    </Shell>
  );
};

// ------------------------------------------------------------------ 58:12 a máscara gruda
// a máscara da Proteção Civil (desenhada como objeto, com lentes e filtro); vira e mostra o λ por dentro; o rosto da
// Alyx por trás dela; as máscaras de quem só queria sobreviver; o controle atuação ↔ pessoa que borra; a frase; o
// silêncio; as duas possibilidades.
const CPMask: React.FC<{ s?: number; lens?: number; o?: number }> = ({ s = 1, lens = 0.6, o = 1 }) => (
  <svg width={360 * s} height={420 * s} viewBox="-180 -210 360 420" style={{ opacity: o, overflow: "visible" }}>
    <defs>
      <radialGradient id="cpRub" cx="45%" cy="35%" r="70%">
        <stop offset="0%" stopColor="#3a4048" />
        <stop offset="100%" stopColor="#101317" />
      </radialGradient>
      <radialGradient id="cpLens" cx="40%" cy="35%" r="65%">
        <stop offset="0%" stopColor={`rgba(255,250,220,${0.4 + lens * 0.6})`} />
        <stop offset="60%" stopColor={`rgba(255,190,90,${0.25 + lens * 0.5})`} />
        <stop offset="100%" stopColor="rgba(40,20,0,0.9)" />
      </radialGradient>
    </defs>
    {/* tiras */}
    <path d="M -150 -40 Q -175 -120 -120 -170 M 150 -40 Q 175 -120 120 -170" stroke="#1a1d21" strokeWidth={14} fill="none" />
    {/* corpo da máscara */}
    <path d="M 0 -190 Q 120 -185 140 -70 Q 152 30 110 110 Q 70 180 0 196 Q -70 180 -110 110 Q -152 30 -140 -70 Q -120 -185 0 -190 Z" fill="url(#cpRub)" stroke="#5a626c" strokeWidth={3} />
    {/* placa da testa e rebites */}
    <path d="M -70 -150 Q 0 -175 70 -150 L 60 -118 Q 0 -138 -60 -118 Z" fill="#262b31" stroke="#6a727c" strokeWidth={2} />
    {[-50, -25, 0, 25, 50].map((x) => <circle key={x} cx={x} cy={-140 + Math.abs(x) * 0.25} r={3} fill="#8a929c" />)}
    {/* lentes */}
    {[-1, 1].map((k) => (
      <g key={k}>
        <ellipse cx={k * 62} cy={-50} rx={46} ry={40} fill="#0c0e11" stroke="#7a828c" strokeWidth={4} />
        <ellipse cx={k * 62} cy={-50} rx={36} ry={30} fill="url(#cpLens)" />
        <ellipse cx={k * 62 - 12} cy={-62} rx={10} ry={6} fill="rgba(255,255,255,0.35)" />
      </g>
    ))}
    {/* filtro central */}
    <path d="M -40 40 L 40 40 L 52 120 Q 0 150 -52 120 Z" fill="#1d2126" stroke="#6a727c" strokeWidth={3} />
    {Array.from({ length: 6 }).map((_, i) => <line key={i} x1={-34 + i * 2} y1={60 + i * 11} x2={34 - i * 2} y2={60 + i * 11} stroke="#4a525c" strokeWidth={3} />)}
    <circle cx={-118} cy={40} r={20} fill="#1d2126" stroke="#6a727c" strokeWidth={3} />
    <circle cx={118} cy={40} r={20} fill="#1d2126" stroke="#6a727c" strokeWidth={3} />
  </svg>
);
const NightDeck: React.FC<{ f: number; o: number; quiet?: number }> = ({ f, o, quiet = 0 }) => {
  const fl = (k: number) => 0.8 + 0.2 * Math.sin(f / (2.3 + k) + k * 2) * Math.sin(f / (5.1 + k));
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: o }}>
      <defs>
        <radialGradient id="ndGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(255,170,70,0.55)" />
          <stop offset="100%" stopColor="rgba(255,120,40,0)" />
        </radialGradient>
      </defs>
      {/* o mar à noite e a linha do horizonte, outro navio da frota ao longe */}
      <line x1={0} y1={520} x2={1920} y2={520} stroke="rgba(159,230,255,0.18)" strokeWidth={1.5} />
      {Array.from({ length: 9 }).map((_, i) => <line key={i} x1={0} y1={540 + i * 14} x2={1920} y2={540 + i * 14} stroke="rgba(159,230,255,0.05)" strokeDasharray={`${40 + i * 10} ${30 + i * 8}`} strokeDashoffset={-f * (0.3 + i * 0.1)} />)}
      <path d="M 1380 520 L 1600 520 L 1620 506 L 1400 506 Z M 1450 506 L 1450 470 L 1480 470 L 1480 506 M 1530 506 L 1530 452" fill="rgba(20,26,32,0.95)" stroke="rgba(255,178,46,0.35)" strokeWidth={1.5} />
      <circle cx={1530} cy={450} r={3} fill={AMB} opacity={Math.floor(f / 20) % 2 ? 1 : 0.3} />
      {/* o convés: piso em perspectiva, amurada, caixotes */}
      <polygon points="0,700 1920,700 1920,1080 0,1080" fill="#0b0c0e" />
      {Array.from({ length: 12 }).map((_, i) => <line key={i} x1={960 + (i - 5.5) * 60} y1={700} x2={960 + (i - 5.5) * 260} y2={1080} stroke="rgba(255,255,255,0.04)" />)}
      <line x1={0} y1={640} x2={1920} y2={640} stroke="rgba(200,210,220,0.35)" strokeWidth={3} />
      {Array.from({ length: 17 }).map((_, i) => <line key={i} x1={i * 120} y1={640} x2={i * 120} y2={700} stroke="rgba(200,210,220,0.25)" strokeWidth={2} />)}
      {[[240, 600, 170, 110], [380, 640, 110, 70], [1500, 610, 190, 100], [1640, 660, 120, 50]].map(([x, y, w, h], i) => (
        <g key={i}>
          <rect x={x} y={y} width={w} height={h} fill="#15130f" stroke="rgba(255,178,46,0.18)" />
          <line x1={x} y1={y} x2={x + w} y2={y + h} stroke="rgba(255,178,46,0.08)" />
        </g>
      ))}
      {/* a fogueira num tambor */}
      <ellipse cx={960} cy={880} rx={420} ry={140} fill="url(#ndGlow)" opacity={fl(0)} />
      <rect x={915} y={830} width={90} height={70} rx={6} fill="#1c1a17" stroke="#3a342a" strokeWidth={2} />
      {[0, 1, 2, 3, 4].map((k) => {
        const h = (60 + k * 8) * fl(k);
        const x = 930 + k * 15;
        return <path key={k} d={`M ${x - 10} 832 Q ${x - 6} ${832 - h * 0.5} ${x + Math.sin(f / 4 + k) * 6} ${832 - h} Q ${x + 8} ${832 - h * 0.45} ${x + 12} 832 Z`} fill={k % 2 ? "rgba(255,200,90,0.85)" : "rgba(255,120,40,0.8)"} />;
      })}
      {Array.from({ length: 8 }).map((_, i) => {
        const t = ((f / 50 + i / 8) % 1);
        return <circle key={i} cx={960 + Math.sin(i * 2.1 + f / 20) * 30} cy={820 - t * 220} r={2} fill="rgba(255,190,90,0.9)" opacity={1 - t} />;
      })}
      {/* os dois junto ao fogo (marcadores) */}
      {[["BARNEY", 760, AMB], ["GORDON", 1160, ORANGE]].map(([n, x, c]) => (
        <g key={n as string} opacity={1 - quiet * 0.4}>
          <ellipse cx={x as number} cy={900} rx={46} ry={12} fill="none" stroke={c as string} strokeWidth={2} strokeDasharray="6 5" strokeDashoffset={-f} />
          <line x1={x as number} y1={900} x2={x as number} y2={735} stroke={c as string} strokeWidth={2} />
          <circle cx={x as number} cy={735} r={11} fill={c as string} />
          <text x={(x as number) + 22} y={741} fill={c as string} fontFamily={MONO} fontSize={18} letterSpacing={4}>{n as string}</text>
        </g>
      ))}
      {quiet > 0 ? <text x={1182} y={700} fill="rgba(242,240,247,0.7)" fontFamily={MONO} fontSize={26} opacity={quiet}>…</text> : null}
      {/* neve */}
      {Array.from({ length: 70 }).map((_, i) => {
        const x = ((rnd(i) * 2000 + Math.sin(f / 40 + i) * 30) % 2000) - 40;
        const y = ((rnd(i * 3) * 1100 + f * (1 + rnd(i * 7) * 1.5)) % 1100) - 10;
        return <circle key={i} cx={x} cy={y} r={1 + rnd(i * 5) * 2} fill="#e8f2ff" opacity={0.5} />;
      })}
    </svg>
  );
};
export const HLWMask: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [barneyAt, diffAt, uniformAt, fakeAt, helpAt, sameAt, usingAt, seriousAt, startAt, maskAt, surviveAt, timeAt, actAt, personAt, quoteAt, gordonAt, gameAt, twoAt, deceiveAt, believeAt] = ["barneyAt", "diffAt", "uniformAt", "fakeAt", "helpAt", "sameAt", "usingAt", "seriousAt", "startAt", "maskAt", "surviveAt", "timeAt", "actAt", "personAt", "quoteAt", "gordonAt", "gameAt", "twoAt", "deceiveAt", "believeAt"].map((k) => A(p, k));
  // a máscara: entra no "uniforme"; no "ajudava" ela SOBE e revela o Barney por baixo (emblema λ costurado); no "mesma coisa"
  // desce e sobe de novo revelando a Alyx; no "sério" volta a cobrir
  const lift = Math.max(IO((f - helpAt) / 18) * (1 - IO((f - sameAt + 14) / 12)), IO((f - sameAt) / 18)) * (1 - IO((f - seriousAt) / 16));
  const maskIn = P(f, uniformAt, 16) * (1 - P(f, startAt, 12));
  const showAlyx = f >= sameAt && f < seriousAt;
  const crowd = P(f, startAt, 12) * (1 - P(f, quoteAt, 10));
  const quote = P(f, quoteAt, 10) * (1 - P(f, gordonAt, 12));
  const silence = P(f, gordonAt, 12) * (1 - P(f, twoAt, 10));
  const two = P(f, twoAt, 12);
  const blend = interpolate(f, [actAt, personAt + 40], [0, 1], C);
  const fire = 0.85 + 0.15 * Math.sin(f / 3.3) * Math.sin(f / 7.1);
  return (
    <Shell f={f} life={life} bg="#0e0905">
      {/* a noite: a fogueira embaixo, dois marcadores conversando */}
      <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 108%, rgba(255,140,40,${0.28 * fire}) 0%, rgba(0,0,0,0) 55%)`, opacity: 1 - two * 0.7 }} />
      {f < uniformAt + 10 ? <NightDeck f={f} o={1 - P(f, uniformAt, 10)} /> : null}
      {f < uniformAt + 10 ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 150, textAlign: "center", fontFamily: MONO, opacity: 1 - P(f, uniformAt, 10) }}>
          <div style={{ fontSize: 18, letterSpacing: 6, color: "rgba(255,190,120,0.8)" }}>NAQUELA NOITE · NA FROTA</div>
          {f >= diffAt ? <div style={{ fontSize: 24, letterSpacing: 5, color: CREAM, marginTop: 14, opacity: P(f, diffAt, 8) }}>O ÚNICO QUE OLHA PARA A ALYX DE OUTRO JEITO</div> : null}
        </div>
      ) : null}
      {/* quem está por baixo da máscara: o retrato (Barney, depois a Alyx) e, por cima, a máscara que sobe */}
      {maskIn > 0.01 ? (
        <div style={{ position: "absolute", left: 960 - 180, top: 300, width: 360, height: 420, perspective: 1400, opacity: maskIn, transform: `scale(${0.9 + 0.1 * maskIn})` }}>
          <div style={{ position: "absolute", left: 30, top: 20, width: 300, height: 380, borderRadius: 18, overflow: "hidden", border: `3px solid ${showAlyx ? ORANGE : AMB}`, background: "#0d0a06", boxShadow: "0 20px 50px rgba(0,0,0,0.7)", opacity: Math.min(1, lift * 3) }}>
            <Img src={staticFile(showAlyx ? "hl3silh/alyx_badge.jpg" : "hl3silh/barney_badge.jpg")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 30%", filter: "contrast(1.05) brightness(0.95)" }} />
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "10px 14px", background: showAlyx ? ORANGE : AMB, color: "#0a0806", fontFamily: MONO, fontSize: 18, fontWeight: 700, letterSpacing: 4 }}>{showAlyx ? "ALYX VANCE" : "BARNEY CALHOUN"}</div>
            {!showAlyx ? (
              // o emblema λ da resistência costurado no canto (tecido, borda pespontada)
              <div style={{ position: "absolute", right: 14, bottom: 54, width: 74, height: 74, borderRadius: "50%", background: "radial-gradient(circle at 40% 35%, #5a4a2a, #2a2010)", border: "3px dashed rgba(255,200,120,0.75)", boxShadow: "0 4px 10px rgba(0,0,0,0.6), inset 0 0 0 4px #3a2c14", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Georgia, serif", fontSize: 46, fontWeight: 700, color: AMB, transform: `rotate(-8deg) scale(${0.6 + 0.4 * P(f, helpAt + 14, 10)})`, opacity: P(f, helpAt + 14, 10) }}>λ</div>
            ) : null}
          </div>
          <div style={{ position: "absolute", inset: 0, transformOrigin: "50% 0%", transform: `translateY(${-225 * lift}px) rotateX(${42 * lift}deg)`, filter: `drop-shadow(0 ${20 + 30 * lift}px 30px rgba(0,0,0,0.7))` }}>
            <CPMask lens={0.5 + 0.2 * Math.sin(f / 9)} />
          </div>
        </div>
      ) : null}
      {maskIn > 0.01 ? (
        <>
          <div style={{ position: "absolute", left: 120, top: 380, width: 520, fontFamily: MONO, opacity: maskIn }}>
            <div style={{ fontSize: 18, letterSpacing: 5, color: "rgba(159,230,255,0.85)" }}>{decode("PROTEÇÃO CIVIL · ANOS", f, uniformAt, 2)}</div>
            {f >= fakeAt ? <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 42, color: TXT, marginTop: 14, opacity: P(f, fakeAt, 8) }}>fingindo servir os Combine</div> : null}
          </div>
          <div style={{ position: "absolute", right: 120, top: 380, width: 520, textAlign: "right", fontFamily: MONO, opacity: maskIn }}>
            {f >= helpAt && f < sameAt ? <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 42, color: AMB, opacity: P(f, helpAt + 8, 8) }}>ajudando a resistência por dentro</div> : null}
            {f >= sameAt && f < seriousAt ? (
              <div style={{ opacity: P(f, sameAt, 8) }}>
                <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 42, color: AMB }}>a Alyx: a mesma coisa?</div>
                {f >= usingAt ? <div style={{ fontSize: 20, letterSpacing: 4, color: CREAM, marginTop: 10, opacity: P(f, usingAt, 8) }}>SÓ USANDO OS COMBINE</div> : null}
              </div>
            ) : null}
          </div>
        </>
      ) : null}
      {/* quem começava fingindo: fileira de máscaras; a linha do tempo; atuação ↔ pessoa */}
      {crowd > 0.01 ? (
        <AbsoluteFill style={{ opacity: crowd }}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 150, textAlign: "center", fontFamily: MONO, fontSize: 20, letterSpacing: 6, color: "rgba(159,230,255,0.85)" }}>{decode("GENTE QUE COMEÇOU FINGINDO", f, startAt, 2)}</div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 260, display: "flex", justifyContent: "center", gap: 46 }}>
            {Array.from({ length: 5 }).map((_, i) => {
              const t0 = maskAt + i * 4;
              const melt = Math.max(0, Math.min(1, blend * 1.6 - i * 0.12));
              return (
                <div key={i} style={{ position: "relative", width: 150, height: 220, opacity: P(f, t0, 8), transform: `translateY(${(1 - P(f, t0, 10)) * 30}px)` }}>
                  <svg width={150} height={220} style={{ position: "absolute", inset: 0 }}>
                    <path d="M 75 10 Q 120 10 125 60 Q 130 90 110 110 L 140 220 L 10 220 L 40 110 Q 20 90 25 60 Q 30 10 75 10 Z" fill={`rgba(${200 - melt * 60},${170 - melt * 40},${140 - melt * 40},0.18)`} stroke="rgba(242,240,247,0.35)" strokeWidth={2} />
                  </svg>
                  <div style={{ position: "absolute", left: 30, top: 6, filter: `blur(${melt * 3}px)`, opacity: 1 - melt * 0.35 }}>
                    <CPMask s={0.25} lens={0.4} />
                  </div>
                </div>
              );
            })}
          </div>
          {f >= surviveAt ? <div style={{ position: "absolute", left: 0, right: 0, top: 520, textAlign: "center", fontFamily: MONO, fontSize: 18, letterSpacing: 6, color: CREAM, opacity: P(f, surviveAt, 8) }}>SÓ PRA SOBREVIVER</div> : null}
          {f >= timeAt ? (
            <div style={{ position: "absolute", left: 460, right: 460, top: 590, opacity: P(f, timeAt, 8) }}>
              <div style={{ fontFamily: MONO, fontSize: 15, letterSpacing: 5, color: "rgba(242,240,247,0.6)" }}>TEMPO</div>
              <div style={{ height: 6, marginTop: 8, background: "rgba(242,240,247,0.12)", borderRadius: 3 }}>
                <div style={{ height: "100%", width: `${interpolate(f, [timeAt, timeAt + 50], [0, 100], C)}%`, background: CREAM, borderRadius: 3 }} />
              </div>
            </div>
          ) : null}
          {f >= actAt ? (
            <div style={{ position: "absolute", left: 360, right: 360, top: 700, opacity: P(f, actAt, 8) }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 22, letterSpacing: 6 }}>
                <span style={{ color: "rgba(159,230,255,0.9)" }}>ATUAÇÃO</span>
                {f >= personAt ? <span style={{ color: AMB, opacity: P(f, personAt, 8) }}>PESSOA</span> : null}
              </div>
              <div style={{ position: "relative", height: 26, marginTop: 12, borderRadius: 13, background: `linear-gradient(90deg, rgba(159,230,255,0.75) ${30 + blend * 10}%, rgba(255,178,46,0.75) ${70 - blend * 30}%)`, filter: `blur(${blend * 2}px)` }} />
              {f >= personAt ? <div style={{ textAlign: "center", marginTop: 16, fontFamily: MONO, fontSize: 17, letterSpacing: 5, color: CREAM, opacity: P(f, personAt + 8, 8) }}>ONDE TERMINA UMA E COMEÇA A OUTRA?</div> : null}
            </div>
          ) : null}
        </AbsoluteFill>
      ) : null}
      {/* a frase */}
      {quote > 0.01 ? (
        <AbsoluteFill style={{ opacity: quote, alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
          <div style={{ transform: `scale(${1 + interpolate(f, [quoteAt, gordonAt], [0, 0.06], C)})` }}>
            <CPMask s={0.8} lens={0.7 + 0.3 * Math.sin(f / 5)} />
          </div>
          <div style={{ fontFamily: MONO, fontSize: 16, letterSpacing: 6, color: AMB, marginTop: 10 }}>BARNEY</div>
          <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 74, color: TXT, marginTop: 6, textShadow: "0 8px 40px #000" }}>“Às vezes, a máscara gruda.”</div>
        </AbsoluteFill>
      ) : null}
      {/* o silêncio */}
      {silence > 0.01 ? (
        <AbsoluteFill style={{ opacity: silence, alignItems: "center", justifyContent: "flex-start", paddingTop: 170, flexDirection: "column", fontFamily: MONO }}>
          <NightDeck f={f} o={1} quiet={P(f, gordonAt + 6, 12)} />
          <div style={{ fontSize: 24, letterSpacing: 8, color: "rgba(242,240,247,0.75)" }}>{decode("GORDON NÃO RESPONDE", f, gordonAt, 2)}</div>
          {f >= gameAt ? <div style={{ fontSize: 24, letterSpacing: 8, color: ORANGE, marginTop: 18, opacity: P(f, gameAt, 8) }}>O JOGO TAMBÉM NÃO</div> : null}
        </AbsoluteFill>
      ) : null}
      {/* as duas possibilidades */}
      {two > 0.01 ? (
        <AbsoluteFill style={{ opacity: two }}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 110, textAlign: "center", fontFamily: MONO, fontSize: 22, letterSpacing: 8, color: CREAM }}>DUAS POSSIBILIDADES</div>
          {(
            [
              ["ELA ESTÁ ENGANANDO OS COMBINE", deceiveAt, AMB, "sepia(0.6) saturate(1.6) hue-rotate(-10deg)", -1],
              ["ELA COMEÇOU A ACREDITAR NO PAPEL", believeAt, CYAN, "grayscale(0.5) hue-rotate(160deg) saturate(1.4)", 1],
            ] as [string, number, string, string, number][]
          ).map(([t, t0, c, flt, side]) => (
            <div key={t} style={{ position: "absolute", top: 230, left: side < 0 ? 230 : undefined, right: side > 0 ? 230 : undefined, width: 600, textAlign: "center", opacity: P(f, t0, 10), transform: `translateY(${(1 - P(f, t0, 12)) * 30}px)` }}>
              <div style={{ position: "relative", width: 360, height: 440, margin: "0 auto", borderRadius: 16, overflow: "hidden", border: `2px solid ${c}` }}>
                <Img src={staticFile("hl3silh/alyx_badge.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 35%", filter: `${flt} contrast(1.05)` }} />
                {side > 0 ? <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: `${interpolate(f, [t0, t0 + 60], [0, 46], C)}%`, background: "linear-gradient(0deg, rgba(10,20,26,0.92), rgba(10,20,26,0))" }} /> : null}
              </div>
              <div style={{ fontFamily: MONO, fontSize: 21, letterSpacing: 4, color: c, marginTop: 20 }}>{t}</div>
            </div>
          ))}
          <div style={{ position: "absolute", left: 0, right: 0, top: 440, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 64, color: TXT, opacity: P(f, believeAt, 8) }}>ou</div>
        </AbsoluteFill>
      ) : null}
    </Shell>
  );
};

// ------------------------------------------------------------------ 59:05 o terminal do Kleiner: corrompido → CATALISADOR
// o mesmo monitor bege do arquivo da resistência (verde), sem desligar entre as duas cenas.
const KFILES = ["MOSSMAN_EXP_01.dat", "MOSSMAN_EXP_02.dat", "BOREALIS_NUCLEO.bin", "COORD_ARTICO.txt", "ALYX_REGISTRO.log", "ADVISOR_PROTOCOLO.bin", "TELEPORTE_APERTURE.dat", "PROCEDIMENTO_C.bin"];
const KBAD = [1, 2, 4, 5, 7];
const LOGW = ["TELEPORTE · SECUNDÁRIO", "ESTASE · LOTE 3", "UNIDADE 12 · POSIÇÃO OK", "SETOR 9 · SINC 0,4%", "RELATÓRIO 4471", "ALINHAMENTO PENDENTE", "TRANSFERÊNCIA · DOCA 2"];
export const HLWKleinerCrt: React.FC<PR & { mode?: number; powerOn?: number; powerOff?: number }> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const mode = p.mode ?? 0;
  const [corrAt, how, alyx, ans, wordAt, catAt] = ["corrAt", "howAt", "alyxAt", "ansAt", "wordAt", "catAt"].map((k) => A(p, k));
  const on = p.powerOn === 0 ? 1 : interpolate(f, [0, 8], [0, 1], { ...C, easing: Easing.out(Easing.cubic) });
  const offY = p.powerOff === 0 ? 1 : interpolate(f, [life - 9, life - 4], [1, 0.012], { ...C, easing: Easing.in(Easing.cubic) });
  const offX = p.powerOff === 0 ? 1 : interpolate(f, [life - 4, life - 1], [1, 0.012], { ...C, easing: Easing.in(Easing.cubic) });
  const sy = Math.min(0.012 + 0.988 * on, offY);
  const push = 1 + interpolate(f, [0, life], [0, 0.04], C);
  // registro rolando (modo 1): uma linha a cada 4 quadros; CATALISADOR a cada 3 linhas
  const N = Math.floor(f / 4);
  const rows = Array.from({ length: 14 }).map((_, k) => {
    const id = N - 13 + k;
    const cat = id % 3 === 0;
    return { id, cat, txt: cat ? ["CATALISADOR · PRIORIDADE", "CATALISADOR · NÚCLEO", "CATALISADOR · ALINHAMENTO", "CATALISADOR · PRÓXIMA JANELA"][((id / 3) | 0) % 4] : LOGW[((id % 7) + 7) % 7] };
  });
  const count = Math.max(0, Math.floor(N / 3));
  const big = P(f, catAt, 12);
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 40%, #2a2620 0%, #0c0b09 80%)" }}>
      <div style={{ position: "absolute", left: 960 - 760, top: 540 - 470, width: 1520, height: 940, transform: `scale(${push})` }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: 48, background: "linear-gradient(160deg, #cfc6ae, #a79d84 60%, #8c836c)", boxShadow: "0 60px 140px rgba(0,0,0,0.75), inset 0 4px 0 rgba(255,255,255,0.25)" }} />
        <div style={{ position: "absolute", left: 80, top: 70, width: 1360, height: 780, borderRadius: 60, background: "#1b1a16" }} />
        <div style={{ position: "absolute", left: 140, top: 110, width: 1240, height: 700, borderRadius: 40, overflow: "hidden", background: "radial-gradient(ellipse at 50% 50%, #0c2414 0%, #031008 85%)", transform: `scale(${offX}, ${sy})`, fontFamily: MONO, color: GREEN }}>
          <div style={{ position: "absolute", left: 40, top: 30, fontSize: 28, letterSpacing: 6 }}>{mode === 0 ? "KLEINER · ARQUIVOS DA MOSSMAN" : "REGISTRO COMBINE · BUSCA"}</div>
          <div style={{ position: "absolute", left: 40, right: 40, top: 80, height: 2, background: "rgba(141,255,168,0.35)" }} />
          {mode === 0 ? (
            <>
              <div style={{ position: "absolute", left: 50, top: 110, width: 640 }}>
                {KFILES.map((n, i) => {
                  const bad = KBAD.includes(i) && f >= corrAt + i * 3;
                  const jit = bad && f < corrAt + i * 3 + 10 ? (rnd(f * 3 + i) - 0.5) * 20 : 0;
                  return (
                    <div key={n} style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 14, fontSize: 21, transform: `translateX(${jit}px)`, color: bad ? "#ff6b6b" : GREEN, opacity: f >= 4 + i * 3 ? 1 : 0 }}>
                      <span style={{ width: 340 }}>{bad ? n.replace(/[A-Z]/g, (c) => (rnd(f + c.charCodeAt(0)) > 0.5 ? "▒" : c)) : n}</span>
                      <span style={{ flex: 1, height: 12, border: `1.5px solid ${bad ? "#ff6b6b" : "rgba(141,255,168,0.6)"}` }}>
                        <span style={{ display: "block", height: "100%", width: bad ? `${30 + rnd(i) * 30}%` : "100%", background: bad ? "repeating-linear-gradient(90deg, #ff6b6b 0 6px, transparent 6px 10px)" : GREEN }} />
                      </span>
                      <span style={{ width: 120, fontSize: 16 }}>{bad ? "CORROMPIDO" : "OK"}</span>
                    </div>
                  );
                })}
              </div>
              <div style={{ position: "absolute", right: 50, top: 130, width: 470 }}>
                <div style={{ fontSize: 18, letterSpacing: 4, opacity: f >= how ? 0.7 : 0 }}>O QUE SOBROU NÃO EXPLICA:</div>
                {(
                  [
                    ["COMO O BOREALIS FUNCIONA", how],
                    ["O QUE ACONTECEU COM A ALYX", alyx],
                    ["A RESPOSTA QUE TODOS QUERIAM", ans],
                  ] as [string, number][]
                ).map(([t, t0]) =>
                  f >= t0 ? (
                    <div key={t} style={{ display: "flex", justifyContent: "space-between", marginTop: 18, padding: "12px 14px", border: "1px solid rgba(255,107,107,0.6)", fontSize: 19, letterSpacing: 2, opacity: P(f, t0, 6) }}>
                      <span>{t}</span>
                      <span style={{ color: "#ff6b6b" }}>✗</span>
                    </div>
                  ) : null,
                )}
              </div>
            </>
          ) : (
            <>
              <div style={{ position: "absolute", left: 50, right: 460, top: 100, bottom: 30, overflow: "hidden", fontSize: 22, lineHeight: "42px", filter: `blur(${big * 3}px)`, opacity: 1 - big * 0.5 }}>
                {rows.map((r) => (
                  <div key={r.id} style={{ whiteSpace: "nowrap" }}><span style={{ color: r.cat && f >= wordAt ? "#1a1204" : GREEN, background: r.cat && f >= wordAt ? AMB : "transparent", padding: "0 8px" }}>{`[${String(Math.abs(r.id * 37) % 9000 + 1000).padStart(5, "0")}] ${r.txt}`}</span></div>
                ))}
              </div>
              <div style={{ position: "absolute", right: 50, top: 120, width: 380, textAlign: "right", opacity: P(f, wordAt, 8) }}>
                <div style={{ fontSize: 18, letterSpacing: 4, opacity: 0.7 }}>OCORRÊNCIAS</div>
                <div style={{ fontSize: 96, color: AMB }}>{count}</div>
              </div>
              {big > 0 ? <div style={{ position: "absolute", left: 0, right: 0, top: 290, textAlign: "center", fontSize: 92, letterSpacing: 14, color: AMB, textShadow: "0 0 30px rgba(255,178,46,0.7)", transform: `scale(${1.3 - 0.3 * big})`, opacity: big }}>CATALISADOR</div> : null}
            </>
          )}
          <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.32) 0 2px, rgba(0,0,0,0) 2px 4px)" }} />
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.6) 100%)" }} />
        </div>
        <div style={{ position: "absolute", left: 140, bottom: 34, fontFamily: MONO, fontSize: 18, letterSpacing: 6, color: "#4b4536" }}>KLEINER · FROTA DA RESISTÊNCIA</div>
      </div>
      <FilmLook />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ o Borealis em 3D (modelo sólido)
// 09/10 (pedido dele: "o modelo do Borealis muito mal feito, fazer um barco completo"): casco quebra-gelo (vermelho
// abaixo da linha d'água, cinza-claro em cima, a proa subindo e afinando), convés, superestrutura branca em três andares
// com a ponte de janelas acesas, chaminé com faixa, mastro, guindastes amarelos e contêineres no convés de proa.
// Comprimento ao longo de x (popa −6 → proa +6,6), boca em y, altura em z (linha d'água z = 0,15).
export const BOREALIS_HOLD: V3c = [3.0, 0, 0.1]; // o porão da frente (os anéis do teleporte)
export const BOREALIS_CORE: V3c = [-1.6, 0, -0.25]; // o núcleo, no fundo do casco
type V3c = [number, number, number];
export const buildBorealis = (): XF[] => {
  const g = mk();
  const N = 16;
  const X0 = -6, X1 = 6.6;
  const w = (x: number) => (x < 2.4 ? 1.25 : 1.25 * Math.max(0, 1 - Math.pow((x - 2.4) / (X1 - 2.4), 1.7)));
  const dz = (x: number) => 1.0 + (x > 2.5 ? (x - 2.5) * 0.16 : 0);
  const KZ = -0.6, WL = 0.15;
  for (let i = 0; i < N; i++) {
    const x0 = X0 + ((X1 - X0) * i) / N, x1 = X0 + ((X1 - X0) * (i + 1)) / N;
    const w0 = w(x0), w1 = w(x1), k0 = w0 * 0.72, k1 = w1 * 0.72;
    const l0 = w0 * 0.95, l1 = w1 * 0.95; // largura na linha d'água
    for (const s of [-1, 1]) {
      const n: V3c = [0, s, 0];
      // costado acima da linha d'água (cinza-claro) e abaixo (vermelho)
      g.F.push({ p: [[x0, s * w0, dz(x0)], [x1, s * w1, dz(x1)], [x1, s * l1, WL], [x0, s * l0, WL]], col: [196, 198, 194], n });
      g.F.push({ p: [[x0, s * l0, WL], [x1, s * l1, WL], [x1, s * k1, KZ], [x0, s * k0, KZ]], col: [132, 36, 30], n: [0, s, -0.3] });
      // faixa escura na linha d'água
      g.F.push({ p: [[x0, s * l0 * 1.004, WL + 0.06], [x1, s * l1 * 1.004, WL + 0.06], [x1, s * l1 * 1.004, WL], [x0, s * l0 * 1.004, WL]], col: [30, 32, 36], n });
    }
    g.F.push({ p: [[x0, -w0, dz(x0)], [x1, -w1, dz(x1)], [x1, w1, dz(x1)], [x0, w0, dz(x0)]], col: [72, 76, 80], n: [0, 0, 1] });
    g.F.push({ p: [[x0, -k0, KZ], [x0, k0, KZ], [x1, k1, KZ], [x1, -k1, KZ]], col: [90, 26, 22], n: [0, 0, -1] });
  }
  // popa (espelho)
  g.F.push({ p: [[X0, 1.25, dz(X0)], [X0, -1.25, dz(X0)], [X0, -0.9, KZ], [X0, 0.9, KZ]], col: [180, 182, 178], n: [-1, 0, 0] });
  // superestrutura (três andares, recuando) + a ponte com janelas acesas
  g.box(-5.6, -1.05, 1.0, 3.4, 2.1, 0.85, [222, 224, 220]);
  g.box(-5.3, -0.9, 1.85, 2.7, 1.8, 0.75, [214, 216, 212]);
  g.box(-5.0, -0.95, 2.6, 2.0, 1.9, 0.55, [206, 208, 204]);
  g.box(-2.99, -0.82, 2.78, 0.03, 1.64, 0.2, [150, 225, 255], { emit: 0.75 });
  g.box(-2.59, -0.75, 2.05, 0.03, 1.5, 0.16, [150, 225, 255], { emit: 0.55 });
  for (const s of [-1, 1]) g.box(-5.4, s > 0 ? 0.9 : -1.15, 1.25, 2.6, 0.25, 0.12, [150, 225, 255], { emit: 0.45 });
  // chaminé com faixa e mastro com antena
  g.prism(-4.6, 0, 3.15, 4.2, 0.36, 10, [44, 48, 54]);
  g.prism(-4.6, 0, 3.75, 3.95, 0.37, 10, [190, 60, 40]);
  g.box(-3.55, -0.03, 3.15, 0.06, 0.06, 1.5, [60, 64, 70]);
  g.box(-3.85, -0.3, 4.3, 0.6, 0.6, 0.04, [60, 64, 70]);
  // guindastes (coluna + lança) e contêineres no convés de proa
  [[0.2, -0.85, 1], [1.8, 0.85, -1]].forEach(([x, y, s]) => {
    g.box(x - 0.08, y - 0.08, 1.0, 0.16, 0.16, 1.7, [230, 180, 40]);
    g.box(x - 0.05, y - 0.05 + (s as number) * 0.0, 2.55, 2.2, 0.1, 0.1, [230, 180, 40]);
  });
  [[-1.4, -0.9, [60, 90, 140]], [-1.4, 0.15, [150, 60, 40]], [-0.6, -0.9, [70, 120, 80]], [-0.6, 0.15, [60, 90, 140]], [-1.0, -0.4, [150, 120, 50]]].forEach(([x, y, col], k) =>
    g.box(x as number, y as number, 1.0 + (k === 4 ? 0.55 : 0), 0.75, 0.75, 0.55, col as RGB),
  );
  // escotilha do porão da frente
  g.box(2.4, -0.6, 1.0, 1.4, 1.2, 0.12, [86, 90, 96]);
  return g.F;
};
// câmera que olha para um alvo (órbita)
const lookAt = (pos: V3c, tgt: V3c, F: number): EyeF => {
  const dx = tgt[0] - pos[0], dy = tgt[1] - pos[1], dz2 = tgt[2] - pos[2];
  return { x: pos[0], y: pos[1], z: pos[2], yaw: Math.atan2(dx, dy), pitch: Math.atan2(dz2, Math.hypot(dx, dy)), F };
};

// ------------------------------------------------------------------ 59:06 o alvo real: cruzamento → teleporte (menor) → catalisador
// 09/10 (pedido dele: bugado, textos sobrepostos — refazer do zero): os dois arquivos LADO A LADO com linhas de verdade;
// em "percebe uma coisa" as linhas do CATALISADOR acendem nos dois e se ligam; depois o Borealis em 3D sólido girando;
// no "teleporte da Aperture" o casco fica translúcido e os anéis acendem no porão da frente; "consequência menor" — os
// anéis encolhem; a câmera desce até o núcleo no fundo do casco: o catalisador.
const CAT_L = ["EXP-07 · TRANSFERÊNCIA DE MASSA", "EXP-11 · RESSONÂNCIA DO NÚCLEO", "EXP-12 · CATALISADOR · ESTÁGIO 1", "EXP-15 · ESTABILIDADE DE FASE", "EXP-19 · CATALISADOR · ESTÁGIO 2", "EXP-22 · MATÉRIA DESLOCADA"];
const CAT_R = ["REG 4471 · SALTO REGISTRADO", "REG 4473 · CATALISADOR · ACESSO NEGADO", "REG 4480 · DESVIO DE FASE", "REG 4492 · CATALISADOR · PRIORIDADE", "REG 4497 · TROPAS · PRÓXIMO PONTO", "REG 4501 · NÚCLEO · ALINHAR"];
const CAT_LINKS: [number, number][] = [[2, 1], [4, 3]];
export const HLWCatalyst: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [crossAt, stoleAt, perceAt, assumeAt, teleAt, notAt, onlyAt, advAt, minorAt, realAt, catAt] = ["crossAt", "stoleAt", "perceAt", "assumeAt", "teleAt", "notAt", "onlyAt", "advAt", "minorAt", "realAt", "catAt"].map((k) => A(p, k));
  const SHIPG = React.useMemo(() => buildBorealis(), []);
  const docs = 1 - P(f, assumeAt - 6, 14);
  const ship = P(f, assumeAt, 18);
  const xray = P(f, teleAt, 16);
  const shrink = P(f, minorAt, 18);
  const core = P(f, realAt, 18);
  // órbita em volta do navio; no fim desce para perto do núcleo
  const th = -2.3 + (f - assumeAt) / 260;
  const dive = IO((f - realAt + 10) / 40);
  const R = 14 - 2.5 * dive;
  const pos: V3c = [BOREALIS_CORE[0] + R * Math.cos(th), R * Math.sin(th), 4.2 - 1.2 * dive];
  const tgt: V3c = [0.3 * (1 - dive) + BOREALIS_CORE[0] * dive, 0, 1.2 * (1 - dive) + BOREALIS_CORE[2] * dive];
  const e = lookAt(pos, tgt, 1050 + 650 * dive);
  const lights: XL[] = [
    { x: -20, y: -30, z: 30, col: [210, 225, 255], k: 0.9, r: 120 },
    { x: BOREALIS_HOLD[0], y: 0, z: 0.3, col: [120, 200, 255], k: 0.9 * xray * (1 - shrink * 0.6), r: 3 },
    { x: BOREALIS_CORE[0], y: 0, z: 0, col: [200, 150, 255], k: 1.2 * core, r: 4 },
  ];
  const ring = (cx: V3c, r: number, n = 40) => Array.from({ length: n + 1 }).map((_, i) => proj(e, [cx[0], cx[1] + Math.cos((i / n) * Math.PI * 2) * r, cx[2] + Math.sin((i / n) * Math.PI * 2) * r]));
  const pts = (q: ReturnType<typeof ring>) => (q.every((v) => v) ? q.map((v) => `${v!.x.toFixed(1)},${v!.y.toFixed(1)}`).join(" ") : null);
  const lbl = (pt: V3c) => proj(e, pt);
  const holdQ = lbl([BOREALIS_HOLD[0], 0, 1.9]);
  const coreQ = lbl([BOREALIS_CORE[0], 0, BOREALIS_CORE[2]]);
  const nameQ = lbl([-4.2, 0, 4.7]);
  const lineY = (side: number, i: number) => 330 + i * 64;
  return (
    <Shell f={f} life={life} bg="radial-gradient(ellipse at 50% 55%, #0e1520 0%, #04060a 80%)">
      {/* 1) os dois arquivos, lado a lado */}
      {docs > 0.01 && f >= crossAt ? (
        <AbsoluteFill style={{ opacity: docs }}>
          {[
            ["EXPERIMENTOS · ROUBADOS PELA MOSSMAN", -1, stoleAt, AMB, CAT_L],
            ["REGISTROS · INSTALAÇÃO COMBINE", 1, crossAt, ICE, CAT_R],
          ].map(([t, side, t0, col, rows]) => {
            const s = side as number;
            const x = s < 0 ? 140 : 1020;
            return (
              <div key={t as string} style={{ position: "absolute", left: x, top: 230, width: 760, height: 520, borderRadius: 12, border: `2px solid ${col as string}`, background: s < 0 ? "rgba(40,24,4,0.55)" : "rgba(6,24,34,0.55)", opacity: P(f, t0 as number, 10), transform: `translateY(${(1 - P(f, t0 as number, 14)) * 30}px)`, fontFamily: MONO, padding: "22px 26px", boxSizing: "border-box" }}>
                <div style={{ fontSize: 18, letterSpacing: 4, color: col as string }}>{t as string}</div>
                {(rows as string[]).map((r, i) => {
                  const hit = r.includes("CATALISADOR");
                  const on = hit && f >= perceAt ? P(f, perceAt + i * 3, 8) : 0;
                  return (
                    <div key={i} style={{ marginTop: i ? 24 : 30, height: 40, display: "flex", alignItems: "center", padding: "0 12px", borderRadius: 6, fontSize: 19, letterSpacing: 2, color: on > 0.5 ? "#0b0b0b" : "rgba(242,240,247,0.82)", background: on > 0 ? `rgba(141,255,168,${0.9 * on})` : "rgba(255,255,255,0.04)", opacity: P(f, (t0 as number) + 6 + i * 4, 8) }}>
                      {r}
                    </div>
                  );
                })}
              </div>
            );
          })}
          {/* as linhas que ligam o mesmo achado nos dois arquivos */}
          {f >= perceAt ? (
            <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
              {CAT_LINKS.map(([l, r], k) => {
                const y1 = lineY(-1, l) + 20 + 84, y2 = lineY(1, r) + 20 + 84;
                const u = P(f, perceAt + 8 + k * 6, 14);
                return <path key={k} d={`M 900 ${y1} C 960 ${y1} 960 ${y2} ${900 + 120 * u} ${y1 + (y2 - y1) * u}`} fill="none" stroke={GREEN} strokeWidth={3} style={{ filter: "drop-shadow(0 0 8px #8dffa8)" }} />;
              })}
              <text x={960} y={820} textAnchor="middle" fill={GREEN} fontFamily={MONO} fontSize={24} letterSpacing={6} opacity={P(f, perceAt + 20, 10)}>OS DOIS BATEM · CATALISADOR</text>
            </svg>
          ) : null}
        </AbsoluteFill>
      ) : null}
      {/* 2) o Borealis em 3D */}
      {ship > 0.01 ? (
        <AbsoluteFill style={{ opacity: ship }}>
          {/* o mar de gelo por baixo */}
          <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(120,150,170,0.08) 100%)" }} />
          <div style={{ position: "absolute", inset: 0, opacity: 1 - 0.55 * xray }}>
            <XView e={e as unknown as Parameters<typeof XView>[0]["e"]} faces={SHIPG} lights={lights} flash={0.15} amb={0.32} seam="rgba(0,0,0,0.25)" solid />
          </div>
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            {nameQ ? <text x={nameQ.x} y={nameQ.y} textAnchor="middle" fill={ICE} fontFamily={MONO} fontSize={22} letterSpacing={8} opacity={P(f, assumeAt + 10, 10) * (1 - dive)}>BOREALIS</text> : null}
            {/* os anéis do teleporte da Aperture no porão da frente */}
            {xray > 0
              ? [0, 1, 2].map((j) => {
                  const r = (0.75 - j * 0.12) * (1 - 0.6 * shrink);
                  const q = pts(ring([BOREALIS_HOLD[0] + j * 0.25, 0, BOREALIS_HOLD[2] + 0.35], r));
                  return q ? <polyline key={j} points={q} fill="none" stroke={j % 2 ? "#ff9a3c" : "#4fb4ff"} strokeWidth={3.5 - j} opacity={xray * (1 - 0.5 * shrink)} style={{ filter: `drop-shadow(0 0 8px ${j % 2 ? "#ff9a3c" : "#4fb4ff"})` }} /> : null;
                })
              : null}
            {xray > 0 && holdQ ? (
              <text x={holdQ.x} y={holdQ.y - 20} textAnchor="middle" fill={shrink > 0.5 ? "rgba(242,240,247,0.65)" : "#9fd4ff"} fontFamily={MONO} fontSize={shrink > 0.5 ? 16 : 20} letterSpacing={4} opacity={xray * (1 - dive)} style={{ paintOrder: "stroke", stroke: "#000", strokeWidth: 4 }}>
                {shrink > 0.5 ? "TELEPORTE · CONSEQUÊNCIA MENOR" : "TELEPORTE · APERTURE"}
              </text>
            ) : null}
            {f >= notAt && f < realAt && holdQ ? (
              <g opacity={P(f, notAt, 8)}>
                <path d={`M ${holdQ.x - 70} ${holdQ.y + 10} l 140 120 m 0 -120 l -140 120`} stroke={RED} strokeWidth={6} opacity={0.85} />
              </g>
            ) : null}
            {/* o catalisador: o núcleo no fundo do casco */}
            {core > 0 && coreQ ? (
              <g>
                <circle cx={coreQ.x} cy={coreQ.y} r={(60 + 10 * Math.sin(f / 5)) * (0.6 + dive)} fill="rgba(199,155,255,0.25)" style={{ filter: "blur(14px)" }} opacity={core} />
                {[1, 1.7, 2.5].map((k, j) => {
                  const q = pts(ring(BOREALIS_CORE, 0.35 * k * (1 + 0.1 * Math.sin(f / 5 + j))));
                  return q ? <polyline key={j} points={q} fill="none" stroke={VIO} strokeWidth={3 - j * 0.6} opacity={core * (1 - j * 0.25)} /> : null;
                })}
                <text x={coreQ.x} y={coreQ.y + 14} textAnchor="middle" fill="#e3ccff" fontFamily={FONT} fontWeight={800} fontSize={42} opacity={core}>?</text>
                {f >= catAt ? <text x={coreQ.x} y={coreQ.y - 90} textAnchor="middle" fill="#e3ccff" fontFamily={MONO} fontSize={22} letterSpacing={5} opacity={P(f, catAt, 10)} style={{ paintOrder: "stroke", stroke: "#000", strokeWidth: 4 }}>O CATALISADOR · O OBJETIVO REAL</text> : null}
              </g>
            ) : null}
          </svg>
        </AbsoluteFill>
      ) : null}
      {f >= assumeAt && f < realAt ? <Corner f={f} at={assumeAt} t={f >= notAt ? "NÃO ERA ISSO · OU NÃO SÓ ISSO" : "O QUE TODO MUNDO ASSUMIA"} sub={f >= notAt ? undefined : "OS COMBINE QUEREM O TELEPORTE DA APERTURE"} col={f >= notAt ? RED : ICE} /> : null}
      {f >= advAt && f < realAt + 20 ? (
        <div style={{ position: "absolute", left: 90, bottom: 110, width: 520, padding: "14px 18px", borderRadius: 10, border: `1px solid ${VIO}`, background: "rgba(14,8,22,0.85)", fontFamily: MONO, color: "#e3ccff", opacity: P(f, advAt, 8) * (1 - P(f, realAt + 6, 14)) }}>
          <div style={{ fontSize: 15, letterSpacing: 4, color: VIO }}>REGISTROS DOS ADVISORS</div>
          {["TELEPORTE · EFEITO COLATERAL", "PRIORIDADE · CATALISADOR", "NÚCLEO · ALINHAR"].map((t, i) => (
            <div key={t} style={{ fontSize: 18, letterSpacing: 2, marginTop: 8, opacity: P(f, advAt + 6 + i * 5, 6) }}>{`› ${t}`}</div>
          ))}
        </div>
      ) : null}
      {void onlyAt}
    </Shell>
  );
};

// ------------------------------------------------------------------ 59:51 a planta incompleta
export const HLWBlueprint: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [notSayAt, refAt, coordAt, expAt, procAt, incAt] = ["notSayAt", "refAt", "coordAt", "expAt", "procAt", "incAt"].map((k) => A(p, k));
  const d = (t: number, n = 24) => P(f, t, n);
  const L = 2600;
  const tear = P(f, procAt, 14);
  return (
    <Shell f={f} life={life} bg="#0b1f3a">
      <AbsoluteFill style={{ transform: `scale(${1.02 + interpolate(f, [0, life], [0, 0.05], C)}) rotate(-1.5deg)` }}>
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          <defs>
            <pattern id="bpGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(170,210,255,0.12)" strokeWidth={1} />
            </pattern>
            <clipPath id="bpTorn">
              <path d={`M 0 0 L 1920 0 L 1920 ${620 - tear * 40} ${Array.from({ length: 16 }).map((_, i) => `L ${1920 - i * 40} ${560 + (rnd(i * 5) - 0.5) * 80 * tear + (1 - tear) * 520}`).join(" ")} L 1280 1080 L 0 1080 Z`} />
            </clipPath>
          </defs>
          <g clipPath="url(#bpTorn)">
            <rect x={100} y={90} width={1720} height={900} fill="#123056" stroke="rgba(190,225,255,0.6)" strokeWidth={3} />
            <rect x={100} y={90} width={1720} height={900} fill="url(#bpGrid)" />
            {/* o aparelho: anéis, canos e o núcleo */}
            {[220, 170, 120, 70].map((r, i) => (
              <circle key={r} cx={760} cy={540} r={r} fill="none" stroke="rgba(220,240,255,0.85)" strokeWidth={2} strokeDasharray={`${L * d(i * 6)} ${L}`} />
            ))}
            {[0, 1, 2, 3, 4, 5].map((i) => {
              const a = (i / 6) * Math.PI * 2;
              return <line key={i} x1={760 + Math.cos(a) * 70} y1={540 + Math.sin(a) * 70} x2={760 + Math.cos(a) * 300} y2={540 + Math.sin(a) * 300} stroke="rgba(220,240,255,0.6)" strokeWidth={1.6} strokeDasharray={`${300 * d(18 + i * 3)} 300`} />;
            })}
            <path d="M 980 540 L 1240 540 L 1240 300 L 1500 300" fill="none" stroke="rgba(220,240,255,0.7)" strokeWidth={2} strokeDasharray={`${900 * d(30)} 900`} />
            <path d="M 980 600 L 1300 600 L 1300 820 L 1640 820" fill="none" stroke="rgba(220,240,255,0.7)" strokeWidth={2} strokeDasharray={`${900 * d(34)} 900`} />
            <text x={140} y={150} fill="rgba(230,245,255,0.9)" fontFamily={MONO} fontSize={26} letterSpacing={6}>PROCEDIMENTO · CATALISADOR</text>
            <text x={140} y={180} fill="rgba(230,245,255,0.55)" fontFamily={MONO} fontSize={15} letterSpacing={4}>ARQUIVOS DA MOSSMAN · CÓPIA PARCIAL</text>
            {f >= notSayAt ? <text x={140} y={224} fill="#ffd9a0" fontFamily={MONO} fontSize={20} letterSpacing={4} opacity={P(f, notSayAt, 8)}>{decode("O QUE ELE FAZ? OS ARQUIVOS NÃO DIZEM CLARAMENTE", f, notSayAt, 2)}</text> : null}
          </g>
          {tear > 0 ? <path d={`M 1920 ${620 - tear * 40} ${Array.from({ length: 16 }).map((_, i) => `L ${1920 - i * 40} ${560 + (rnd(i * 5) - 0.5) * 80 * tear + (1 - tear) * 520}`).join(" ")}`} fill="none" stroke="rgba(230,245,255,0.8)" strokeWidth={2} /> : null}
        </svg>
        {/* o que veio e o que falta */}
        <div style={{ position: "absolute", left: 160, bottom: 140, display: "flex", gap: 20, fontFamily: MONO }}>
          {(
            [
              ["REFERÊNCIAS", refAt],
              ["COORDENADAS", coordAt],
              ["EXPERIMENTOS (PARTE)", expAt],
            ] as [string, number][]
          ).map(([t, t0]) =>
            f >= t0 ? (
              <div key={t} style={{ padding: "12px 18px", border: "2px solid rgba(141,255,168,0.8)", borderRadius: 8, background: "rgba(6,30,20,0.8)", color: GREEN, fontSize: 19, letterSpacing: 3, opacity: P(f, t0, 6), transform: `translateY(${(1 - P(f, t0, 8)) * 16}px)` }}>{`✓ ${t}`}</div>
            ) : null,
          )}
        </div>
        {f >= procAt ? (
          <div style={{ position: "absolute", right: 170, top: 700, textAlign: "center", fontFamily: MONO, opacity: P(f, procAt, 8) }}>
            <div style={{ fontSize: 22, letterSpacing: 5, color: "rgba(230,245,255,0.8)" }}>O PROCEDIMENTO</div>
            <div style={{ fontSize: 56, color: "rgba(230,245,255,0.5)", marginTop: 6 }}>? ? ?</div>
          </div>
        ) : null}
        {f >= incAt ? <div style={{ position: "absolute", right: 260, top: 560, padding: "10px 22px", border: `4px solid ${RED}`, borderRadius: 8, fontFamily: MONO, fontSize: 40, letterSpacing: 8, color: RED, transform: `rotate(-8deg) scale(${1.6 - 0.6 * P(f, incAt, 6)})`, opacity: P(f, incAt, 6), background: "rgba(40,6,6,0.5)" }}>INCOMPLETO</div> : null}
      </AbsoluteFill>
    </Shell>
  );
};

// ------------------------------------------------------------------ 60:00 a corrida no Ártico (mapa + radar)
const FLEET_S: [number, number] = [520, 920];
const INST_N: [number, number] = [760, 260];
const BOR: [number, number] = [1380, 420];
const GROUTE: [number, number][] = [FLEET_S, [600, 760], [560, 600], [660, 430], INST_N];
const CROUTES: [number, number][][] = [
  [[1900, 300], [1700, 360], [1520, 400], [BOR[0] + 60, BOR[1]]],
  [[1900, 620], [1720, 560], [1560, 480], [BOR[0] + 40, BOR[1] + 40]],
  [[1820, 860], [1680, 700], [1500, 560], [BOR[0], BOR[1] + 60]],
];
export const HLWArcticRace: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [coordAt, instAt, activeAt, expAt, restAt, radarAt, anomAt, borAt, moveAt, planAt, gordonAt, beforeAt] = ["coordAt", "instAt", "activeAt", "expAt", "restAt", "radarAt", "anomAt", "borAt", "moveAt", "planAt", "gordonAt", "beforeAt"].map((k) => A(p, k));
  const line = IO((f - coordAt) / 24);
  const radar = P(f, radarAt, 10) * (1 - P(f, borAt + 20, 10));
  const sweep = (f * 6) % 360;
  const bor = P(f, borAt, 16);
  const gk = IO((f - planAt) / 40);
  const GL = pathLen(GROUTE);
  const race = f >= beforeAt ? interpolate(f, [beforeAt, life], [0, 1], C) : 0;
  return (
    <Shell f={f} life={life} bg="#081420">
      <AbsoluteFill style={{ transform: `scale(${1.04 + interpolate(f, [0, life], [0, 0.06], C)})` }}>
        <ArcticBase f={f} seed={5} y0={700} />
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          {[[460, 880], [560, 930], [620, 870]].map(([x, y], i) => <IcoLambda key={i} x={x} y={y} s={0.8} />)}
          <text x={540} y={1000} textAnchor="middle" fill={AMB} fontFamily={MONO} fontSize={16} letterSpacing={4}>FROTA</text>
          {/* a coordenada sai do arquivo e cai no mapa */}
          {f >= coordAt ? <path d={`M 140 160 Q 400 120 ${INST_N[0]} ${INST_N[1]}`} fill="none" stroke={ORANGE} strokeWidth={2.5} strokeDasharray={`${1000 * line} 1000`} /> : null}
          {f >= instAt ? <IcoComb x={INST_N[0]} y={INST_N[1]} s={1.5} o={P(f, instAt, 8)} /> : null}
          {f >= activeAt
            ? [0, 1, 2].map((k) => {
                const t = ((f - activeAt) / 40 + k / 3) % 1;
                return <circle key={k} cx={INST_N[0]} cy={INST_N[1]} r={30 + t * 90} fill="none" stroke={RED} strokeWidth={2} opacity={(1 - t) * 0.7} />;
              })
            : null}
          <Pin x={INST_N[0]} y={INST_N[1]} f={f} t={instAt + 6} label="INSTALAÇÃO · AINDA ATIVA" sub={f >= restAt ? "O RESTO DA RESPOSTA?" : f >= expAt ? "DAÍ VIERAM OS EXPERIMENTOS" : "NO ÁRTICO"} col={RED} left />
          {/* o Borealis reaparece; os Combine marcham para ele */}
          {f >= borAt ? <IcoShip x={BOR[0]} y={BOR[1]} s={1.3} o={bor * (0.7 + 0.3 * Math.sin(f / 4))} aura={bor} /> : null}
          {f >= borAt ? <text x={BOR[0]} y={BOR[1] - 70} textAnchor="middle" fill={GREEN} fontFamily={MONO} fontSize={20} letterSpacing={5} opacity={bor}>BOREALIS · VAI APARECER</text> : null}
          {CROUTES.map((r, i) => {
            const k = IO((f - moveAt - i * 6) / 70);
            const Lr = pathLen(r);
            const [hx, hy] = along(r, k);
            return f >= moveAt ? (
              <g key={i}>
                <path d={pathD(r)} fill="none" stroke={RED} strokeWidth={4} strokeDasharray={`${Lr * k} ${Lr}`} />
                <IcoComb x={hx} y={hy} s={0.7} />
              </g>
            ) : null;
          })}
          {f >= moveAt ? <text x={1700} y={250} textAnchor="middle" fill={RED} fontFamily={MONO} fontSize={18} letterSpacing={4} opacity={P(f, moveAt + 10, 8)}>COMBINE · EM MARCHA</text> : null}
          {/* a rota do Gordon */}
          {f >= planAt ? <path d={pathD(GROUTE)} fill="none" stroke={ORANGE} strokeWidth={4.5} strokeDasharray={`${GL * gk} ${GL}`} style={{ filter: "drop-shadow(0 0 8px rgba(255,140,40,0.8))" }} /> : null}
          {f >= gordonAt ? <text x={430} y={560} fill={ORANGE} fontFamily={MONO} fontSize={18} letterSpacing={4} opacity={P(f, gordonAt, 8)}>GORDON</text> : null}
        </svg>
        {/* o arquivo de onde sai a coordenada */}
        {f >= coordAt && f < radarAt ? (
          <div style={{ position: "absolute", left: 60, top: 100, padding: "12px 16px", borderRadius: 8, border: "1px solid rgba(141,255,168,0.6)", background: "rgba(4,16,10,0.85)", fontFamily: MONO, fontSize: 17, color: GREEN, letterSpacing: 2, opacity: P(f, coordAt - 4, 8) }}>
            <div>COORD_ARTICO.txt</div>
            <div style={{ color: "rgba(141,255,168,0.5)" }}>78°41'N · 15°02'E</div>
            <div style={{ color: AMB }}>{"› 82°03'N · 31°17'W"}</div>
          </div>
        ) : null}
      </AbsoluteFill>
      {/* o radar da frota */}
      {radar > 0.01 ? (
        <div style={{ position: "absolute", right: 90, top: 90, width: 320, height: 320, opacity: radar }}>
          <svg width={320} height={320}>
            <circle cx={160} cy={160} r={150} fill="rgba(4,16,10,0.88)" stroke={GREEN} strokeWidth={2} />
            {[50, 100].map((r) => <circle key={r} cx={160} cy={160} r={r} fill="none" stroke="rgba(141,255,168,0.3)" />)}
            <line x1={160} y1={160} x2={160 + Math.cos((sweep * Math.PI) / 180) * 150} y2={160 + Math.sin((sweep * Math.PI) / 180) * 150} stroke={GREEN} strokeWidth={2} />
            {f >= anomAt ? <circle cx={230} cy={110} r={8 + 4 * Math.sin(f / 3)} fill={GREEN} opacity={0.9} /> : null}
          </svg>
          <div style={{ fontFamily: MONO, fontSize: 16, letterSpacing: 4, color: GREEN, textAlign: "center", marginTop: 6 }}>{f >= anomAt ? "ANOMALIA REGISTRADA" : "RADAR · FROTA"}</div>
        </div>
      ) : null}
      {f >= planAt ? <Corner f={f} at={planAt} t="O PLANO MUDA" sub="CHEGAR À INSTALAÇÃO ANTES DOS COMBINE CHEGAREM AO NAVIO" col={ORANGE} /> : null}
      {f >= beforeAt ? (
        <div style={{ position: "absolute", left: 600, right: 600, bottom: 90, fontFamily: MONO, opacity: P(f, beforeAt, 8) }}>
          {(
            [
              ["GORDON → INSTALAÇÃO", 0.25 + race * 0.5, ORANGE],
              ["COMBINE → BOREALIS", 0.3 + race * 0.48, RED],
            ] as [string, number, string][]
          ).map(([t, v, c], i) => (
            <div key={t} style={{ marginTop: i ? 14 : 0 }}>
              <div style={{ fontSize: 16, letterSpacing: 4, color: c }}>{t}</div>
              <div style={{ height: 10, marginTop: 6, borderRadius: 5, background: "rgba(242,240,247,0.12)" }}>
                <div style={{ height: "100%", width: `${v * 100}%`, borderRadius: 5, background: c }} />
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </Shell>
  );
};

// ================================================================================================= rodada 4: as cenas que eram só cartões
// silhueta com volume em 2D (máscara PNG + gradiente + contorno de luz)
const Sil2: React.FC<{ src: string; x: number; y: number; h: number; ar: number; o?: number; rim?: string; top?: string; bot?: string; flip?: boolean; eye?: [number, number, string] }> = ({ src, x, y, h, ar, o = 1, rim = "rgba(255,255,255,0.5)", top = "#3a3a36", bot = "#08080a", flip, eye }) => {
  const url = `url(${staticFile(src)})`;
  return (
    <div style={{ position: "absolute", left: x - (h * ar) / 2, top: y - h, width: h * ar, height: h, opacity: o, filter: `drop-shadow(0 0 4px ${rim}) drop-shadow(0 0 14px ${rim})` }}>
      <div style={{ position: "absolute", inset: 0, transform: `scaleX(${flip ? -1 : 1})` }}>
        <div style={{ position: "absolute", inset: 0, WebkitMaskImage: url, maskImage: url, WebkitMaskSize: "100% 100%", maskSize: "100% 100%", background: `linear-gradient(180deg, ${top}, ${bot} 85%)` }} />
        {eye ? <div style={{ position: "absolute", left: `${eye[0] * 100}%`, top: `${eye[1] * 100}%`, width: h * 0.022, height: h * 0.022, borderRadius: "50%", background: eye[2], boxShadow: `0 0 ${h * 0.03}px ${eye[2]}` }} /> : null}
      </div>
    </div>
  );
};
const VSILH = "hl3silh/vort_silh.png";

// ------------------------------------------------------------------ 50:26 o saldo
// três quadros vivos (a Alyx recortada na luz violeta do outro lado · o monitor da Mossman zerando · os Vortigaunts
// indo embora na luz verde) → sobem e viram uma faixa; o Borealis em wireframe rachado no tempo; os arquivos no
// inventário do HEV; a Alyx com tarjas (não conta tudo); a bússola que gira: a história muda de direção.
export const HLWAftermath: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [aliveAt, deadAt, goneAt, gordonAt, shipAt, filesAt, findAt, notAllAt, dirAt] = ["aliveAt", "deadAt", "goneAt", "gordonAt", "shipAt", "filesAt", "findAt", "notAllAt", "dirAt"].map((k) => A(p, k));
  const up = IO((f - gordonAt) / 24);
  // os três quadros entram grandes no meio da tela e sobem/encolhem quando o navio aparece
  const panelY = 330 - up * 240;
  const panelS = 1.15 - up * 0.6;
  const flat = interpolate(f, [deadAt + 8, deadAt + 30], [0, 1], C);
  const c = camK(f, [
    [0, 0, 0, 0, 0.6, 0.5, 80],
    [shipAt, 0, 0, 0, 0.6, 0.5, 80],
    [shipAt + 40, 0, 0, 0, 0.9, 0.38, 70],
    [life, 0, 0, 0, 1.2, 0.36, 66],
  ]);
  const W = mkW(c);
  const ship = P(f, shipAt, 16) * (1 - P(f, findAt, 14));
  if (ship > 0.01) {
    const g = (dx: number, col: string, o: number) => {
      const off = (pt: V): V => [pt[0] + dx, pt[1], pt[2]];
      W.line([...SHIP.map((q) => off([q[0], q[1], 4])), off([SHIP[0][0], SHIP[0][1], 4])], col, 2, o);
      W.line([off([-30, 0, -4]), off([26, 0, -4]), off([34, 0, 4])], col, 1.4, o * 0.8);
      SHIP.forEach((q) => W.line([off([q[0], q[1], 4]), off([Math.min(q[0], 26), 0, -4])], col, 1, o * 0.6));
      W.box(-30 + dx, -5, 4, 9, 10, 6, col, "rgba(159,230,255,0.04)", o);
    };
    // o mesmo navio em três tempos defasados (quebrado no tempo)
    g(0, ICE, ship);
    g(-3 + Math.sin(f / 7) * 1.2, "rgba(199,155,255,0.8)", ship * 0.45);
    g(3 + Math.cos(f / 9) * 1.2, "rgba(255,178,46,0.8)", ship * 0.35);
    W.line([[-6, -7, 4], [-2, -2, 2], [-5, 3, 0], [-1, 7, -2]], RED, 3, ship);
    W.line([[12, -7, 4], [9, -1, 1], [13, 5, -1]], RED, 3, ship);
  }
  return (
    <Shell f={f} life={life} bg="#07070c">
      {/* os três quadros vivos */}
      <div style={{ position: "absolute", left: 960, top: panelY, transform: `translateX(-50%) scale(${panelS})`, transformOrigin: "50% 0", display: "flex", gap: 34, opacity: 1 - P(f, findAt, 12) }}>
        {[
          [aliveAt, "ALYX", "SOBREVIVE · DO OUTRO LADO", ORANGE],
          [deadAt, "MOSSMAN", "ESTÁ MORTA", RED],
          [goneAt, "VORTIGAUNTS", "FORAM EMBORA", GREEN],
        ].map(([t0, n, sub, col], i) => (
          <div key={i} style={{ position: "relative", width: 480, height: 340, borderRadius: 14, overflow: "hidden", background: "#050608", border: `1.5px solid ${col as string}`, opacity: P(f, t0 as number, 10), transform: `translateY(${(1 - P(f, t0 as number, 12)) * 30}px)` }}>
            {i === 0 ? (
              <>
                {/* no formato do crachá: a foto em pé à esquerda, nome e status ao lado; a borda violeta da outra fase */}
                <div style={{ position: "absolute", left: 22, top: 22, width: 220, height: 296, borderRadius: 8, overflow: "hidden", border: "1.5px solid rgba(199,155,255,0.9)", boxShadow: "0 0 30px rgba(199,155,255,0.45)", opacity: rnd(Math.floor(f / 3)) > 0.9 ? 0.55 : 1 }}>
                  <Img src={staticFile("hl3silh/alyx_badge.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 35%" }} />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(150,100,240,0.12), rgba(80,40,160,0.32))" }} />
                  <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.12) 0 2px, rgba(0,0,0,0) 2px 4px)" }} />
                </div>
                <div style={{ position: "absolute", left: 262, top: 34, right: 18, fontFamily: MONO }}>
                  <div style={{ fontSize: 13, letterSpacing: 4, color: AMB }}>H.E.V. · IDENTIFICAÇÃO</div>
                  <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 30, color: TXT, marginTop: 10 }}>Alyx Vance</div>
                  <div style={{ marginTop: 22, padding: "8px 10px", borderLeft: `3px solid ${GREEN}`, background: "rgba(8,8,10,0.6)", fontSize: 20, letterSpacing: 3, color: GREEN }}>SOBREVIVE</div>
                  <div style={{ marginTop: 10, padding: "8px 10px", borderLeft: "3px solid #c79bff", background: "rgba(8,8,10,0.6)", fontSize: 16, letterSpacing: 3, color: "#c79bff" }}>DO OUTRO LADO · OUTRA FASE</div>
                </div>
              </>
            ) : null}
            {i === 1 ? (
              <svg width={480} height={340} style={{ position: "absolute", inset: 0 }}>
                {Array.from({ length: 9 }).map((_, k) => <line key={k} x1={0} x2={480} y1={40 + k * 30} y2={40 + k * 30} stroke="rgba(255,93,77,0.08)" />)}
                <polyline points={Array.from({ length: 97 }).map((_, k) => {
                  const xx = k * 5;
                  const ph = ((xx - f * 4) % 120 + 120) % 120;
                  const beat = ph < 10 ? Math.sin((ph / 10) * Math.PI * 2) * 70 : 0;
                  return `${xx},${170 - beat * (1 - flat)}`;
                }).join(" ")} fill="none" stroke={RED} strokeWidth={3} style={{ filter: "drop-shadow(0 0 6px #ff5d4d)" }} />
                <text x={460} y={320} textAnchor="end" fill={RED} fontFamily={MONO} fontSize={28}>{flat > 0.95 ? "0" : `${Math.round(72 * (1 - flat))}`} BPM</text>
              </svg>
            ) : null}
            {i === 2 ? (
              <>
                <div style={{ position: "absolute", left: 300, top: 60, width: 90, height: 200, background: "radial-gradient(ellipse at 50% 50%, rgba(141,255,168,0.85), rgba(60,160,90,0.3) 60%, rgba(0,0,0,0))", boxShadow: "0 0 40px rgba(141,255,168,0.5)" }} />
                {[0, 1, 2].map((k) => {
                  const w = interpolate(f, [goneAt, goneAt + 70], [0, 1], C);
                  return <Sil2 key={k} src={VSILH} x={120 + k * 60 + w * 170} y={290 - w * 50 - k * 6} h={170 * (1 - w * 0.55)} ar={270 / 400} rim="rgba(141,255,168,0.8)" top="#2e3a28" o={1 - w * 0.7} />;
                })}
              </>
            ) : null}
            <div style={{ position: "absolute", left: 18, bottom: 14, fontFamily: MONO, letterSpacing: 4, textShadow: "0 2px 8px #000", display: i === 0 ? "none" : undefined }}>
              <div style={{ fontSize: 16, color: col as string }}>{n as string}</div>
              <div style={{ fontSize: 24, color: TXT, marginTop: 4 }}>{sub as string}</div>
            </div>
          </div>
        ))}
      </div>
      {/* o navio quebrado no tempo */}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, transform: "translateY(80px)" }}>
        {W.out}
      </svg>
      {f >= shipAt && f < findAt ? <div style={{ position: "absolute", left: 0, right: 0, top: 860, textAlign: "center", fontFamily: MONO, fontSize: 22, letterSpacing: 8, color: ICE, opacity: P(f, shipAt + 10, 10) }}>UM NAVIO QUEBRADO NO TEMPO</div> : null}
      {/* os arquivos no inventário do HEV */}
      {f >= filesAt && f < findAt ? (
        <div style={{ position: "absolute", right: 110, top: 520, width: 340, padding: "16px 18px", borderRadius: 10, background: "rgba(14,10,4,0.88)", border: `1.5px solid ${AMB}`, fontFamily: MONO, color: AMB, opacity: P(f, filesAt, 8) }}>
          <div style={{ fontSize: 15, letterSpacing: 4 }}>H.E.V. · INVENTÁRIO</div>
          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            {[0, 1, 2].map((k) => (
              <div key={k} style={{ width: 90, height: 64, borderRadius: 6, border: "1px solid rgba(255,178,46,0.6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, opacity: P(f, filesAt + k * 5, 6) }}>?</div>
            ))}
          </div>
          <div style={{ fontSize: 15, letterSpacing: 3, color: CREAM, marginTop: 10 }}>ARQUIVOS DA MOSSMAN · NÃO DECIFRADOS</div>
        </div>
      ) : null}
      {/* a Alyx que não conta tudo: silhueta grande, tarjas por cima */}
      {f >= findAt ? (
        <div style={{ position: "absolute", inset: 0, opacity: P(f, findAt, 12) * (f >= dirAt ? 0 : 1), transform: `scale(${1 + 0.035 * P(f, dirAt - 40, 40)})`, transformOrigin: "50% 50%" }}>
          {/* o retrato dela num quadro de contato do HEV */}
          <div style={{ position: "absolute", left: 960 - 190, top: 250, width: 380, height: 500, borderRadius: 12, overflow: "hidden", border: `2px solid ${ORANGE}`, boxShadow: "0 0 50px rgba(255,150,60,0.35)", transform: `scale(${0.96 + 0.04 * P(f, findAt, 30)})` }}>
            <Img src={staticFile("hl3silh/alyx_badge.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 25%", filter: "saturate(0.85)" }} />
            <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.14) 0 2px, rgba(0,0,0,0) 2px 5px)" }} />
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "10px 14px", background: "rgba(10,6,2,0.8)", fontFamily: MONO, fontSize: 16, letterSpacing: 4, color: ORANGE }}>H.E.V. · CONTATO · ALYX VANCE</div>
          </div>
          {f >= notAllAt
            ? [0, 1, 2, 3].map((k) => <div key={k} style={{ position: "absolute", left: 1200, top: 420 + k * 70, height: 30, width: 420 * P(f, notAllAt + k * 5, 8), background: "#0b0b0d", border: "1px solid rgba(242,240,247,0.25)" }} />)
            : null}
          {f >= notAllAt ? <div style={{ position: "absolute", left: 1200, top: 360, fontFamily: MONO, fontSize: 20, letterSpacing: 5, color: ORANGE, opacity: P(f, notAllAt, 8) }}>O QUE A ALYX SABE</div> : null}
          {/* 08/10 (pedido dele): a frase embaixo da foto, centrada no quadro — antes ficava solta ao lado */}
          <div style={{ position: "absolute", left: 960 - 300, top: 772, width: 600, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 44, color: TXT, opacity: P(f, findAt + 8, 10), transform: `translateY(${(1 - P(f, findAt + 8, 12)) * 14}px)` }}>
            reencontrar a Alyx
            {f >= notAllAt ? <div style={{ fontFamily: MONO, fontWeight: 400, fontSize: 18, letterSpacing: 4, color: ORANGE, marginTop: 8, opacity: P(f, notAllAt, 8) }}>DESDE O GRANDE SALTO · NÃO CONTA TUDO</div> : null}
          </div>
        </div>
      ) : null}
      {/* a bússola: a história muda de direção */}
      {f >= dirAt ? (
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, transform: `scale(${1.08 - 0.08 * IO((f - dirAt) / 10)}) translate(${(f - dirAt < 8 ? (rnd(f) - 0.5) * 14 : 0)}px, ${(f - dirAt < 8 ? (rnd(f * 3) - 0.5) * 10 : 0)}px)`, transformOrigin: "50% 52%" }}>
          {/* o golpe da virada: clarão e a onda de choque saindo da bússola */}
          <rect width={1920} height={1080} fill="#fff" opacity={0.5 * (1 - P(f, dirAt, 6))} />
          {[0, 7].map((d) => {
            const t = P(f, dirAt + d, 26);
            return t > 0 && t < 1 ? <circle key={d} cx={960} cy={560} r={160 + t * 900} fill="none" stroke={d ? ORANGE : "#fff"} strokeWidth={10 * (1 - t) + 1} opacity={0.8 * (1 - t)} /> : null;
          })}
          <g transform={`translate(960 560) rotate(${interpolate(f, [dirAt, dirAt + 30], [0, 115], { ...C, easing: Easing.out(Easing.back(1.4)) })})`}>
            <circle r={150} fill="none" stroke="rgba(242,240,247,0.4)" strokeWidth={3} />
            {Array.from({ length: 36 }).map((_, k) => <line key={k} x1={0} y1={-150} x2={0} y2={k % 9 ? -138 : -124} stroke="rgba(242,240,247,0.5)" strokeWidth={2} transform={`rotate(${k * 10})`} />)}
            <polygon points="0,-118 14,0 0,18 -14,0" fill={ORANGE} />
            <polygon points="0,118 14,0 0,-18 -14,0" fill="rgba(242,240,247,0.4)" />
          </g>
          <text x={960} y={800} textAnchor="middle" fill={TXT} fontFamily={FONT} fontWeight={800} fontSize={52}>a história muda de direção</text>
        </svg>
      ) : null}
    </Shell>
  );
};

// ------------------------------------------------------------------ 50:46 as coordenadas vazadas
// mapa do mar de gelo: o Borealis salta de ponto em ponto; em cada ponto as tropas Combine JÁ estão lá antes do navio
// terminar de surgir (contorno se formando); um sinal sai de DENTRO do navio até os Combine (alguém passa as coordenadas);
// a câmera entra no navio em wireframe e o sinal é seguido até a sala de controle.
const JUMPS: [number, number][] = [[520, 640], [1020, 470], [1440, 700]];
// 08/10 (pedido dele): depois que os Vortigaunts vão embora, a REPRISE deles entrando pela porta verde; o Gordon
// procurando a Alyx pelo navio (POV no corredor); e o mapa SÓ quando começa "os Combine ... acertando os saltos"
const SEARCH_CORR = buildShipCorridor();
const REPRISE_FROM = 37.75; // segundo da cena da ruptura onde a reprise começa (o último Vortigaunt parado no vão)
const REPRISE_LEN = 3.0;
const SearchPOV: React.FC<{ f: number; t0: number; t1: number; strangeAt: number }> = ({ f, t0, t1, strangeAt }) => {
  const k = Math.max(0, f - t0);
  const yaw = 0.32 * Math.sin(k / 34) * Math.min(1, k / 20);
  const e: EyeF = { x: 0.15 * Math.sin(k / 50), y: 30 + k * 0.035, z: 1.7 + 0.025 * Math.abs(Math.sin(k / 6.5)), yaw, pitch: -0.02, F: 900 };
  const L: LightsF = { flash: 0.7, lamps: 0.25, red: f >= strangeAt ? 0.18 : 0, strobe: 0 };
  const odd = f >= strangeAt;
  const o = P(f, t0, 8) * (1 - P(f, t1 - 8, 8));
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <RoomView e={e} L={L} f={f} faces={SEARCH_CORR} />
      {/* o rastreador do HEV: o sinal da Alyx sumiu */}
      <div style={{ position: "absolute", left: 90, top: 150, width: 430, padding: "14px 18px", borderRadius: 12, background: "rgba(14,10,4,0.86)", border: `1.5px solid ${ORANGE}`, fontFamily: MONO, opacity: P(f, t0 + 10, 8) }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, letterSpacing: 4 }}>
          <span style={{ color: ORANGE }}>RASTREADOR · ALYX VANCE</span>
          <span style={{ color: RED, opacity: Math.floor(f / 10) % 2 ? 1 : 0.35 }}>SEM SINAL</span>
        </div>
        <svg width={394} height={40} style={{ marginTop: 8 }}>
          <polyline points={Array.from({ length: 80 }).map((_, i) => `${i * 5},${20 + (rnd(i + Math.floor(f / 2) * 7) - 0.5) * 6}`).join(" ")} fill="none" stroke="rgba(255,150,60,0.6)" strokeWidth={1.6} />
        </svg>
        {odd ? <div style={{ fontSize: 14, letterSpacing: 3, color: RED, marginTop: 6, opacity: P(f, strangeAt, 8) }}>› CONTATOS COMBINE FORA DO CASCO</div> : null}
      </div>
      <HudF f={f} yaw={e.yaw} eye={e} blips={odd ? [{ x: 7, y: 41, hot: true }, { x: -8, y: 44, hot: true }, { x: 6, y: 47, hot: true }] : []} msg={odd ? "ALGO ESTRANHO" : "PROCURANDO A ALYX"} msgCol={odd ? RED : AMB} />
    </AbsoluteFill>
  );
};
export const HLWLeakCoords: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [leaveAt, searchAt, strangeAt, precAt, troopsAt, beforeAt, someoneAt, coordsAt, signalAt, roomAt] = ["leaveAt", "searchAt", "strangeAt", "precAt", "troopsAt", "beforeAt", "someoneAt", "coordsAt", "signalAt", "roomAt"].map((k) => A(p, k));
  const mapAt = A(p, "mapAt") < 1e8 ? A(p, "mapAt") : strangeAt;
  const rup = (p as unknown as { rup?: Record<string, number> }).rup;
  const repEnd = Math.round(REPRISE_LEN * 30);
  const mapIn = P(f, mapAt, 10);
  const dive = IO((f - signalAt) / 30);
  const per = Math.max(30, (beforeAt + 30 - mapAt) / 3);
  const jumpIdx = f < mapAt ? 0 : Math.min(2, Math.floor((f - mapAt) / per));
  const jt = f < mapAt ? 0 : (((f - mapAt) % per) / per);
  const [jx, jy] = JUMPS[jumpIdx];
  const form = Math.min(1, jt * 1.6);
  const c = camK(f, [
    [signalAt, 0, 0, 0, 0.6, 0.55, 70],
    [life, -8, 0, 0, 0.9, 0.62, 46],
  ]);
  const W = mkW(c);
  if (dive > 0.01) {
    W.line([...SHIP.map((q) => [q[0], q[1], 4] as V), [SHIP[0][0], SHIP[0][1], 4]], ICE, 2, dive);
    SHIP.forEach((q) => W.line([[q[0], q[1], 4], [Math.min(q[0], 26), 0, -4]], "rgba(159,230,255,0.4)", 1, dive));
    [[-18, -3], [-8, -3], [2, -3], [12, -3]].forEach(([x, y], i) => W.box(x, y, -1, 8, 6, 4.6, i === 1 && f >= roomAt ? RED : "rgba(159,230,255,0.75)", i === 1 && f >= roomAt ? "rgba(255,93,77,0.18)" : "rgba(159,230,255,0.05)", dive));
    const sk = P(f, signalAt + 10, 30);
    W.line([[30, 0, 2], [20, 0, 1.5], [10, -1, 1.2], [-4, 0, 1.2]].slice(0, 1 + Math.round(sk * 3)) as V[], "#ff9be8", 3, dive, "6 6");
    if (f >= roomAt) W.text([-4, 0, 7], "SALA DE CONTROLE", RED, 28, P(f, roomAt, 8));
  }
  return (
    <Shell f={f} life={life} bg="#081420">
      {/* a reprise: o último Vortigaunt entrando pela porta verde (a mesma cena da ruptura, um pouco dessaturada) */}
      {rup && f < repEnd ? (
        <AbsoluteFill style={{ filter: "saturate(0.55) brightness(0.92)", opacity: 1 - P(f, repEnd - 8, 8) }}>
          <Sequence from={-Math.round(REPRISE_FROM * 30)} layout="none">
            {/* o registro já converte os tempos de dentro do 'rup' para quadros; só a duração vem em segundos */}
            <HLRRupture {...({ ...rup, life: Math.round((rup.life ?? 44.2) * 30) } as unknown as PR)} />
          </Sequence>
          <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)" }} />
        </AbsoluteFill>
      ) : null}
      {f >= repEnd - 8 && f < mapAt + 10 ? <SearchPOV f={f} t0={repEnd - 8} t1={mapAt + 10} strangeAt={strangeAt} /> : null}
      <AbsoluteFill style={{ opacity: (1 - dive) * mapIn }}>
        <ArcticBase f={f} seed={8} y0={260} />
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          {/* os pontos de salto anteriores e o atual */}
          {JUMPS.map(([x, y], i) => (i < jumpIdx ? <circle key={i} cx={x} cy={y} r={22} fill="none" stroke="rgba(141,255,168,0.5)" strokeWidth={2} strokeDasharray="4 4" /> : null))}
          {jumpIdx > 0 ? <path d={`M ${JUMPS[jumpIdx - 1][0]} ${JUMPS[jumpIdx - 1][1]} L ${jx} ${jy}`} fill="none" stroke="rgba(141,255,168,0.35)" strokeWidth={2} strokeDasharray="6 8" /> : null}
          {/* as tropas JÁ no ponto antes do navio completar */}
          {f >= troopsAt
            ? [[-120, -70], [135, -55], [-95, 100], [120, 90]].map(([dx, dy], k) => <IcoComb key={k} x={jx + dx} y={jy + dy} s={1.35} o={P(f, troopsAt + k * 3, 6)} />)
            : null}
          {/* o navio se formando (contorno tracejado → cheio) */}
          {f >= mapAt ? (
            <g>
              <IcoShip x={jx} y={jy} s={2.8} o={form > 0.99 ? 1 : 0.25 + 0.5 * form} aura={1 - form} col={GREEN} />
              {form < 0.99 ? <ellipse cx={jx} cy={jy} rx={150 * (1 - form) + 60} ry={80 * (1 - form) + 32} fill="none" stroke={GREEN} strokeWidth={2} strokeDasharray="5 6" /> : null}
            </g>
          ) : null}
          {f >= beforeAt ? <text x={jx} y={jy + 170} textAnchor="middle" fill={RED} fontFamily={MONO} fontSize={28} letterSpacing={4} opacity={P(f, beforeAt, 8)}>AS TROPAS CHEGAM ANTES DO NAVIO</text> : null}
          {/* o sinal saindo de dentro do navio */}
          {f >= someoneAt
            ? [[-120, -70], [135, -55], [-95, 100], [120, 90]].map(([dx, dy], k) => {
                const t = ((f - someoneAt) / 24 + k / 4) % 1;
                return (
                  <g key={k}>
                    <line x1={jx} y1={jy} x2={jx + dx} y2={jy + dy} stroke="#ff9be8" strokeWidth={2} strokeDasharray="4 6" />
                    <circle cx={jx + dx * t} cy={jy + dy * t} r={8} fill="#ff9be8" />
                  </g>
                );
              })
            : null}
          {f >= coordsAt ? <text x={jx} y={jy - 130} textAnchor="middle" fill="#ff9be8" fontFamily={MONO} fontSize={26} letterSpacing={3} opacity={P(f, coordsAt, 8)}>{`${(79 + jumpIdx * 0.8).toFixed(1)}°N · ${(12 + jumpIdx * 6.5).toFixed(1)}°E · ENVIADO`}</text> : null}
        </svg>
      </AbsoluteFill>
      {dive > 0.01 ? (
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          {W.out}
        </svg>
      ) : null}
      {f >= mapAt ? <Corner f={f} at={mapAt} t={f >= someoneAt ? "ALGUÉM ESTÁ PASSANDO AS COORDENADAS" : "OS COMBINE ACERTAM OS SALTOS COM PRECISÃO DEMAIS"} sub={f >= signalAt ? "GORDON SEGUE O SINAL" : undefined} col={f >= someoneAt ? "#ff9be8" : ICE} /> : null}
      {void leaveAt}
      {void searchAt}
      {void precAt}
    </Shell>
  );
};

// ------------------------------------------------------------------ 48:38 a perpetuidade
// o que os Combine já conquistaram, em escala: o ESPAÇO (frota cruzando estrelas) ✓ · os MUNDOS (planetas marcados) ✓ ·
// as DIMENSÕES (planos empilhados) ✓ → a câmera anda até um horizonte escuro: O PRÓPRIO FIM · é verdade? (falha) · eles
// acreditam: o Advisor diante dele · e o fio até o núcleo do Borealis.
export const HLWPerpetuity: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [spaceAt, worldsAt, dimAt, nextAt, endAt, unclearAt, believeAt, borAt, beliefAt] = ["spaceAt", "worldsAt", "dimAt", "nextAt", "endAt", "unclearAt", "believeAt", "borAt", "beliefAt"].map((k) => A(p, k));
  const pan = IO((f - nextAt) / 34);
  const check = (t0: number, label: string, x: number, y: number) =>
    f >= t0 ? (
      <g opacity={P(f, t0 + 10, 8)}>
        <rect x={x - 16} y={y - 16} width={32} height={32} rx={5} fill="none" stroke={GREEN} strokeWidth={3} />
        <path d={`M ${x - 9} ${y} l 7 8 l 13 -16`} fill="none" stroke={GREEN} strokeWidth={4} />
        <text x={x + 28} y={y + 9} fill={TXT} fontFamily={MONO} fontSize={24} letterSpacing={5}>{label}</text>
      </g>
    ) : null;
  return (
    <Shell f={f} life={life} bg="#05050a">
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {Array.from({ length: 160 }).map((_, i) => <circle key={i} cx={((rnd(i) * 3200 - pan * 1200) % 3200 + 3200) % 3200 - 600} cy={rnd(i * 3) * 1080} r={0.8 + rnd(i * 5) * 1.6} fill="#fff" opacity={0.3 + 0.5 * rnd(i * 7)} />)}
        <g transform={`translate(${-pan * 1200} 0)`}>
          {/* 08/10 (pedido dele: os triângulos/planos eram genéricos): uma vista espacial em profundidade, câmera avançando —
              ESPAÇO: naves Combine angulosas passando perto, com luzes e rastro · MUNDOS: planetas iluminados de lado, a rede
              vermelha Combine tomando o lado escuro, anéis de ocupação em órbita · DIMENSÕES: um rasgo violeta se abre no fundo
              com a nebulosa de Xen dentro e um anel Combine preso na borda */}
          {(() => {
            const dolly = interpolate(f, [0, nextAt + 20], [0, 1], C);
            const S3 = (x: number, y: number, z: number) => {
              const zz = z - dolly * 2.2;
              const k = 900 / Math.max(0.3, zz);
              return { x: 860 + x * k, y: 470 + y * k, k };
            };
            // o rasgo dimensional (bem no fundo)
            const rift = P(f, dimAt, 22);
            const rc = S3(1.6, -0.55, 9);
            // os planetas
            const planets: [number, number, number, number, string, string][] = [[-1.8, 0.35, 5.2, 0.95, "#3a6a8a", "#0c1a24"], [1.1, 0.55, 7.2, 0.6, "#8a5a3a", "#1e120a"], [2.6, -0.2, 8.5, 0.38, "#4a7a4a", "#0e1a0e"]];
            return (
              <g>
                <defs>
                  {planets.map((pl, k) => (
                    <radialGradient key={k} id={`pl${k}`} cx="0.32" cy="0.32" r="0.85">
                      <stop offset="0" stopColor={pl[4]} />
                      <stop offset="0.55" stopColor={pl[5]} />
                      <stop offset="1" stopColor="#000" />
                    </radialGradient>
                  ))}
                  <clipPath id="riftClip"><ellipse cx={rc.x} cy={rc.y} rx={rc.k * 0.9 * rift} ry={rc.k * 0.22 * rift} transform={`rotate(-14 ${rc.x} ${rc.y})`} /></clipPath>
                </defs>
                {rift > 0 ? (
                  <g>
                    <g clipPath="url(#riftClip)">
                      <image href={staticFile("hl3/nebula_1.png")} x={rc.x - rc.k} y={rc.y - rc.k * 0.5} width={rc.k * 2} height={rc.k} preserveAspectRatio="xMidYMid slice" style={{ filter: "saturate(1.4)" }} />
                    </g>
                    <ellipse cx={rc.x} cy={rc.y} rx={rc.k * 0.9 * rift} ry={rc.k * 0.22 * rift} transform={`rotate(-14 ${rc.x} ${rc.y})`} fill="none" stroke="#e4c8ff" strokeWidth={3} style={{ filter: "drop-shadow(0 0 14px #c79bff)" }} />
                    <ellipse cx={rc.x} cy={rc.y} rx={rc.k * 1.0 * rift} ry={rc.k * 0.3 * rift} transform={`rotate(-14 ${rc.x} ${rc.y})`} fill="none" stroke={RED} strokeWidth={4} strokeDasharray="40 18" strokeDashoffset={-f * 2} opacity={P(f, dimAt + 10, 10)} />
                  </g>
                ) : null}
                {/* os mundos */}
                {planets.map((pl, k) => {
                  const c = S3(pl[0], pl[1], pl[2]);
                  const r = pl[3] * c.k * 0.5;
                  const on = P(f, worldsAt - 20 + k * 4, 14);
                  const net = P(f, worldsAt + k * 5, 24);
                  return (
                    <g key={k} opacity={on}>
                      <circle cx={c.x} cy={c.y} r={r * 1.08} fill="none" stroke={pl[4]} strokeWidth={r * 0.06} opacity={0.35} style={{ filter: `blur(${r * 0.05}px)` }} />
                      <circle cx={c.x} cy={c.y} r={r} fill={`url(#pl${k})`} />
                      <clipPath id={`pc${k}`}><circle cx={c.x} cy={c.y} r={r} /></clipPath>
                      <g clipPath={`url(#pc${k})`} opacity={net}>
                        {Array.from({ length: 9 }).map((_, j) => <ellipse key={j} cx={c.x} cy={c.y} rx={r * (0.15 + j * 0.11)} ry={r} fill="none" stroke="rgba(255,93,77,0.55)" strokeWidth={1.2} transform={`translate(${r * 0.45 * (1 - net)} 0)`} />)}
                        {Array.from({ length: 7 }).map((_, j) => <line key={`h${j}`} x1={c.x - r} x2={c.x + r} y1={c.y - r + j * r * 0.33} y2={c.y - r + j * r * 0.33} stroke="rgba(255,93,77,0.4)" strokeWidth={1} />)}
                        {Array.from({ length: 6 }).map((_, j) => <circle key={`l${j}`} cx={c.x + r * (0.1 + 0.12 * j) * Math.cos(j * 2.1)} cy={c.y + r * 0.6 * Math.sin(j * 1.7)} r={Math.max(1.5, r * 0.025)} fill="#ff8a6a" opacity={0.6 + 0.4 * Math.sin(f / 4 + j)} />)}
                      </g>
                      <ellipse cx={c.x} cy={c.y} rx={r * 1.55} ry={r * 0.32} fill="none" stroke={RED} strokeWidth={Math.max(1.5, r * 0.025)} strokeDasharray={`${r * 0.4} ${r * 0.2}`} strokeDashoffset={-f * 1.5} transform={`rotate(-12 ${c.x} ${c.y})`} opacity={net} />
                    </g>
                  );
                })}
                {/* as estrelas em profundidade */}
                {Array.from({ length: 90 }).map((_, k) => {
                  const z = ((rnd(k * 3) * 10 - f * 0.03) % 10 + 10) % 10 + 0.4;
                  const c = S3((rnd(k) - 0.5) * 8, (rnd(k * 7) - 0.5) * 4.5, z);
                  const c2 = S3((rnd(k) - 0.5) * 8, (rnd(k * 7) - 0.5) * 4.5, z + 0.25);
                  return <line key={k} x1={c.x} y1={c.y} x2={c2.x} y2={c2.y} stroke="#fff" strokeWidth={Math.min(3, 0.6 + 6 / z)} opacity={Math.min(0.9, 2 / z)} />;
                })}
                {/* a frota: naves angulosas passando perto da câmera */}
                {[0, 1, 2, 3, 4].map((k) => {
                  const t = interpolate(f, [spaceAt - 10 + k * 7, spaceAt + 110 + k * 7], [0, 1], C);
                  if (t <= 0) return null;
                  const z = 1.5 + k * 0.7;
                  const c = S3(-3.2 + t * 6.4 + (k % 2) * 0.6, -0.9 + k * 0.32, z);
                  const L = c.k * 0.62;
                  const H = L * 0.16;
                  return (
                    <g key={k} opacity={P(f, spaceAt - 10 + k * 7, 8) * (1 - P(f, nextAt + 6, 10) * 0)}>
                      <line x1={c.x - L * 0.55} y1={c.y} x2={c.x - L * 0.55 - L * 1.4 * t} y2={c.y + H * 0.2} stroke="rgba(95,243,255,0.25)" strokeWidth={H * 0.35} strokeLinecap="round" />
                      <polygon points={`${c.x + L * 0.5},${c.y} ${c.x + L * 0.1},${c.y - H} ${c.x - L * 0.45},${c.y - H * 0.7} ${c.x - L * 0.55},${c.y} ${c.x - L * 0.45},${c.y + H * 0.8} ${c.x + L * 0.1},${c.y + H * 0.9}`} fill="#0c1014" stroke="#3a4a52" strokeWidth={1.5} />
                      <polygon points={`${c.x + L * 0.5},${c.y} ${c.x + L * 0.1},${c.y - H} ${c.x - L * 0.1},${c.y}`} fill="#1e2a30" />
                      {[0, 1, 2, 3].map((j) => <rect key={j} x={c.x - L * 0.3 + j * L * 0.14} y={c.y - H * 0.18} width={L * 0.05} height={H * 0.12} fill="#5ff3ff" opacity={0.7 + 0.3 * Math.sin(f / 5 + j)} />)}
                      <circle cx={c.x - L * 0.55} cy={c.y} r={H * 0.35} fill="#9ff8ff" opacity={0.85} style={{ filter: `blur(${H * 0.15}px)` }} />
                    </g>
                  );
                })}
              </g>
            );
          })()}
          {check(spaceAt, "ESPAÇO", 160, 930)}
          {check(worldsAt, "MUNDOS", 560, 930)}
          {check(dimAt + 6, "DIMENSÕES", 960, 930)}
          {/* o próprio fim: um monitor cardíaco indo para a linha reta; a mira Combine trava nele; depois a linha falha
              entre reta e batimento (não fica claro se eles venceram) */}
          {f >= nextAt
            ? (() => {
                const X = 2280;
                const Y = 520;
                const flat = interpolate(f, [nextAt + 6, endAt], [0, 1], C);
                const doubt = f >= unclearAt && rnd(Math.floor(f / 5)) > 0.55;
                const lock = P(f, endAt - 6, 18);
                const pts = Array.from({ length: 101 }).map((_, k) => {
                  const xx = X - 250 + k * 5;
                  const ph = ((k * 5 - f * 5) % 150 + 150) % 150;
                  const beat = ph < 12 ? Math.sin((ph / 12) * Math.PI * 2) * 90 : 0;
                  const amp = doubt ? 1 : 1 - flat;
                  return `${xx},${Y + 20 - beat * amp}`;
                });
                const R = 330 - 120 * lock;
                return (
                  <g opacity={P(f, nextAt, 10)}>
                    <path d={`M 1700 520 L ${1700 + 230 * P(f, nextAt + 10, 30)} 520`} stroke={RED} strokeWidth={5} strokeDasharray="12 10" />
                    <rect x={X - 290} y={Y - 200} width={580} height={400} rx={22} fill="#0c0e10" stroke="#2c3034" strokeWidth={6} />
                    <rect x={X - 260} y={Y - 170} width={520} height={300} rx={8} fill="#020806" />
                    {Array.from({ length: 10 }).map((_, k) => <line key={k} x1={X - 260} x2={X + 260} y1={Y - 170 + k * 30} y2={Y - 170 + k * 30} stroke="rgba(120,255,160,0.06)" />)}
                    <polyline points={pts.join(" ")} fill="none" stroke={doubt ? "#8dffa8" : flat > 0.95 ? RED : "#8dffa8"} strokeWidth={3.5} style={{ filter: `drop-shadow(0 0 6px ${flat > 0.95 && !doubt ? "#ff5d4d" : "#8dffa8"})` }} />
                    <text x={X + 240} y={Y - 135} textAnchor="end" fill={flat > 0.95 && !doubt ? RED : "#8dffa8"} fontFamily={MONO} fontSize={30}>{doubt ? "64" : flat > 0.95 ? "0" : Math.round(72 * (1 - flat))} BPM</text>
                    <text x={X - 240} y={Y - 135} fill="rgba(242,240,247,0.6)" fontFamily={MONO} fontSize={16} letterSpacing={4}>SINAIS VITAIS</text>
                    <rect x={X - 120} y={Y + 150} width={240} height={30} rx={4} fill="#16191c" />
                    {/* a mira Combine fechando no monitor */}
                    {f >= endAt - 6 ? (
                      <g opacity={lock}>
                        {[0, 1, 2, 3].map((k) => (
                          <path key={k} d={`M ${X + R} ${Y - 40} l 0 -50 m 0 50 l -50 0`} transform={`rotate(${k * 90} ${X} ${Y})`} fill="none" stroke={RED} strokeWidth={5} />
                        ))}
                        <IcoComb x={X} y={Y - 270} s={1.4} o={lock} />
                        <text x={X} y={Y + 270} textAnchor="middle" fill={RED} fontFamily={MONO} fontSize={24} letterSpacing={6}>ALVO · O FIM</text>
                      </g>
                    ) : null}
                    {f >= unclearAt ? <text x={X} y={Y + 320} textAnchor="middle" fill={TXT} fontFamily={MONO} fontSize={22} letterSpacing={5} opacity={P(f, unclearAt, 8)}>VENCERAM? · NÃO FICA CLARO</text> : null}
                  </g>
                );
              })()
            : null}
        </g>
        {/* eles acreditam: o Advisor diante do fim */}
        {f >= believeAt ? (
          <g opacity={P(f, believeAt, 12)}>
            {[0, 1, 2].map((k) => {
              const t = (f / 40 + k / 3) % 1;
              return <ellipse key={k} cx={760} cy={560} rx={120 + t * 200} ry={60 + t * 100} fill="none" stroke={VIO} strokeWidth={2} opacity={(1 - t) * 0.6} />;
            })}
            <AdvisorArt x={760} y={560} w={300} f={f} lit={0.8} id="perp" flip />
            <text x={760} y={760} textAnchor="middle" fill={VIO} fontFamily={MONO} fontSize={20} letterSpacing={5}>ELES ACREDITAM</text>
          </g>
        ) : null}
        {/* o fio até o Borealis */}
        {f >= borAt ? (
          <g opacity={P(f, borAt, 10)}>
            <IcoShip x={420} y={860} s={1.6} col={GREEN} aura={0.6 + 0.3 * Math.sin(f / 6)} />
            <circle cx={420} cy={860} r={8 + 3 * Math.sin(f / 4)} fill="#ffcf7a" style={{ filter: "drop-shadow(0 0 10px #ffcf7a)" }} />
            <path d={`M 420 860 Q 700 980 1080 ${520 + 60}`} fill="none" stroke="#ffcf7a" strokeWidth={2.5} strokeDasharray={`${900 * P(f, borAt + 6, 30)} 900`} />
            {f >= beliefAt ? <text x={420} y={960} textAnchor="middle" fill="#ffcf7a" fontFamily={MONO} fontSize={18} letterSpacing={4} opacity={P(f, beliefAt, 8)}>ALGO NO BOREALIS · LIGADO A ESSA CRENÇA</text> : null}
          </g>
        ) : null}
      </svg>
      <Corner f={f} at={0} t="O QUE OS COMBINE JÁ CONQUISTARAM" sub={f >= nextAt ? "O PRÓXIMO LIMITE" : undefined} col={RED} />
    </Shell>
  );
};
