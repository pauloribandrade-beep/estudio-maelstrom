import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, Loop, OffthreadVideo, random, staticFile, useCurrentFrame } from "remotion";
import { loadFont as loadAnton } from "@remotion/google-fonts/Anton";
import { loadFont as loadBody } from "@remotion/google-fonts/NunitoSans";
import { loadFont as loadHand } from "@remotion/google-fonts/Caveat";

// O MAPA DO DEADLOCK, versão nossa (07/11/2026, pedido dele: "uma nossa própria versão do mapa… quando for mostrar alguma
// parte da linha, faz um zoom no mapa e mostra… marca no mapa… base para os próximos vídeos").
// Desenhado em código a partir da planta oficial (deadlock.wiki Map_colored): disco com as duas bases (a sua embaixo,
// a inimiga em cima), 3 rotas com as cores do jogo (amarela, azul, verde do seu lado; vermelha do lado deles), e em cada
// rota Guardião → Andarilho → Guardião da base; na base os 2 santuários e o Patrono; Midboss no centro; acampamentos.
// Tudo é dirigido por props: `cam` (câmera com zoom), `marks` (o que acende/marca/explode em cada palavra) e `dead`.
// Coordenadas do mapa: 0..502 × 0..560 (as da planta). Na tela: câmera centrada em (540, 735), escala 1,9 × zoom.
// Props terminadas em At / at / dur chegam em QUADROS relativos ao início da cena (o registry converte os aninhados também).

const { fontFamily: POSTER } = loadAnton("normal", { weights: ["400"], subsets: ["latin", "latin-ext"] });
const { fontFamily: BODY } = loadBody("normal", { weights: ["700", "800", "900"], subsets: ["latin", "latin-ext"] });
const { fontFamily: HAND } = loadHand("normal", { weights: ["700"], subsets: ["latin", "latin-ext"] });

const FPS = 30;
const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
const ease = (f: number, a: number, n = 10) => interpolate(f, [a, a + n], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
const back = (f: number, a: number, n = 10, s = 1.8) => interpolate(f - a, [0, n], [0, 1], { ...clamp, easing: Easing.out(Easing.back(s)) });
const shake = (f: number, at: number, amp = 14, n = 9, seed = "s") => {
  const k = f - at;
  if (k < 0 || k > n) return { x: 0, y: 0 };
  const d = amp * (1 - k / n) ** 2;
  return { x: (random(`${seed}x${k}`) - 0.5) * 2 * d, y: (random(`${seed}y${k}`) - 0.5) * 2 * d };
};

export const DM = {
  INK: "#0b1412", TEAL: "#123b35", CREAM: "#f4e7cb", SOUL: "#5ff2d6", STAMP: "#d8452f", GOLD: "#ffd27a",
  L: "#f2c33a", M: "#3fb6e8", R: "#6cc04a", ENEMY: "#e2492f", SPIRIT: "#b58cff",
};
const { INK, CREAM, SOUL, STAMP } = DM;

type P = [number, number];
type Kind = "patron" | "shrine" | "base" | "walker" | "guard" | "mid";
// objetivos: e. = time inimigo (em cima), a. = o seu time (embaixo). L/M/R = rota esquerda/meio/direita.
export const OBJ: Record<string, { p: P; k: Kind; team: "e" | "a" | "n"; lane?: "L" | "M" | "R" }> = {
  "e.P": { p: [280, 64], k: "patron", team: "e" },
  "e.S1": { p: [244, 97], k: "shrine", team: "e" }, "e.S2": { p: [316, 97], k: "shrine", team: "e" },
  "e.bL": { p: [228, 127], k: "base", team: "e", lane: "L" }, "e.bM": { p: [280, 153], k: "base", team: "e", lane: "M" }, "e.bR": { p: [333, 127], k: "base", team: "e", lane: "R" },
  "e.wL": { p: [123, 160], k: "walker", team: "e", lane: "L" }, "e.wM": { p: [281, 199], k: "walker", team: "e", lane: "M" }, "e.wR": { p: [398, 168], k: "walker", team: "e", lane: "R" },
  "e.gL": { p: [87, 234], k: "guard", team: "e", lane: "L" }, "e.gM": { p: [250, 239], k: "guard", team: "e", lane: "M" }, "e.gR": { p: [440, 237], k: "guard", team: "e", lane: "R" },
  "a.P": { p: [220, 497], k: "patron", team: "a" },
  "a.S1": { p: [183, 466], k: "shrine", team: "a" }, "a.S2": { p: [259, 466], k: "shrine", team: "a" },
  "a.bL": { p: [167, 436], k: "base", team: "a", lane: "L" }, "a.bM": { p: [221, 409], k: "base", team: "a", lane: "M" }, "a.bR": { p: [273, 436], k: "base", team: "a", lane: "R" },
  "a.wL": { p: [102, 386], k: "walker", team: "a", lane: "L" }, "a.wM": { p: [219, 358], k: "walker", team: "a", lane: "M" }, "a.wR": { p: [380, 397], k: "walker", team: "a", lane: "R" },
  "a.gL": { p: [58, 323], k: "guard", team: "a", lane: "L" }, "a.gM": { p: [250, 322], k: "guard", team: "a", lane: "M" }, "a.gR": { p: [415, 327], k: "guard", team: "a", lane: "R" },
  mid: { p: [247, 282], k: "mid", team: "n" },
};
const LANE_IDS: Record<"L" | "M" | "R", string[]> = {
  L: ["a.P", "a.bL", "a.wL", "a.gL", "e.gL", "e.wL", "e.bL", "e.P"],
  M: ["a.P", "a.bM", "a.wM", "a.gM", "e.gM", "e.wM", "e.bM", "e.P"],
  R: ["a.P", "a.bR", "a.wR", "a.gR", "e.gR", "e.wR", "e.bR", "e.P"],
};
const pt = (v: string | P): P => (typeof v === "string" ? (OBJ[v]?.p ?? [251, 290]) : v);

// curva suave (catmull-rom) pelos pontos, amostrada em polilinha
const smooth = (pts: P[], n = 10): P[] => {
  const out: P[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      const c = (a: number, b: number, cc: number, d: number) => 0.5 * (2 * b + (-a + cc) * t + (2 * a - 5 * b + 4 * cc - d) * t2 + (-a + 3 * b - 3 * cc + d) * t3);
      out.push([c(p0[0], p1[0], p2[0], p3[0]), c(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
};
const polyD = (pts: P[]) => pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
const polyLen = (pts: P[]) => pts.slice(1).reduce((s, p, i) => s + Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]), 0);
const along = (pts: P[], u: number): P => {
  const L = polyLen(pts) * Math.max(0, Math.min(1, u));
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const s = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    if (acc + s >= L) { const t = s ? (L - acc) / s : 0; return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t]; }
    acc += s;
  }
  return pts[pts.length - 1];
};
const LANES = (["L", "M", "R"] as const).map((k) => {
  const ids = LANE_IDS[k];
  return { k, ally: smooth(ids.slice(0, 4).map(pt)), link: smooth(ids.slice(3, 5).map(pt), 6), enemy: smooth(ids.slice(4).map(pt)), all: smooth(ids.map(pt)) };
});

// quarteirões da cidade (fixos): retângulos dentro do disco, longe das rotas
const CX = 251, CY = 290, RAD = 238;
const near = (x: number, y: number, d: number) => LANES.some((l) => l.all.some((q) => Math.hypot(q[0] - x, q[1] - y) < d)) || Object.values(OBJ).some((o) => Math.hypot(o.p[0] - x, o.p[1] - y) < d + 6);
const BLOCKS: { x: number; y: number; w: number; h: number; o: number }[] = [];
for (let i = 0; BLOCKS.length < 230 && i < 4000; i++) {
  const w = 7 + random(`bw${i}`) * 20, h = 6 + random(`bh${i}`) * 16;
  const x = CX - RAD + random(`bx${i}`) * RAD * 2, y = CY - RAD + random(`by${i}`) * RAD * 2;
  if (Math.hypot(x + w / 2 - CX, y + h / 2 - CY) > RAD - 14) continue;
  if (near(x + w / 2, y + h / 2, 15 + Math.max(w, h) / 2)) continue;
  if (BLOCKS.some((b) => x < b.x + b.w + 3 && x + w + 3 > b.x && y < b.y + b.h + 3 && y + h + 3 > b.y)) continue;
  BLOCKS.push({ x, y, w, h, o: 0.5 + random(`bo${i}`) * 0.5 });
}
const CAMPS: P[] = [];
for (let i = 0; CAMPS.length < 34 && i < 3000; i++) {
  const x = CX - RAD + random(`cx${i}`) * RAD * 2, y = CY - RAD + 40 + random(`cy${i}`) * (RAD * 2 - 80);
  if (Math.hypot(x - CX, y - CY) > RAD - 24 || near(x, y, 13) || CAMPS.some((c) => Math.hypot(c[0] - x, c[1] - y) < 26)) continue;
  CAMPS.push([x, y]);
}

// ---------- câmera ----------
export type Cam = { at: number; x: number; y: number; z: number; dur?: number };
const S0 = 1.9, SX = 540, SY = 735;
const camAt = (cams: Cam[], f: number) => {
  if (!cams.length) return { x: CX, y: CY, z: 1 };
  let c = { x: cams[0].x, y: cams[0].y, z: cams[0].z };
  for (let i = 1; i < cams.length; i++) {
    const k = cams[i];
    if (f < k.at) break;
    const d = Math.max(1, k.dur ?? 20);
    const t = interpolate(f, [k.at, k.at + d], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
    c = { x: c.x + (k.x - c.x) * t, y: c.y + (k.y - c.y) * t, z: c.z + (k.z - c.z) * t };
  }
  return c;
};

// ---------- marcas ----------
export type Mark =
  | { kind: "ring"; at: number; ids: string[]; endAt?: number; c?: string; stagger?: number }
  | { kind: "tag"; at: number; id: string; text: string; sub?: string; img?: string; side?: "l" | "r" | "t" | "b"; endAt?: number; c?: string }
  | { kind: "x"; at: number; ids: string[]; stagger?: number }
  | { kind: "lane"; at: number; lanes: ("L" | "M" | "R")[]; endAt?: number; stagger?: number }
  | { kind: "route"; at: number; ids: (string | P)[]; dur: number; endAt?: number }
  | { kind: "you"; at: number; to: string | P; dur?: number; label?: string }
  | { kind: "lock"; at: number; id: string; openAt?: number }
  | { kind: "range"; at: number; id: string; r: number; endAt?: number }
  | { kind: "hp"; at: number; name: string; id: string; endAt?: number; drains: { at: number; dur: number; seg: 0 | 1; to: number }[] }
  | { kind: "clip"; at: number; endAt: number; clip: string; ss?: number; rate?: number; id?: string; side?: "top" | "bottom"; label?: string; zoom?: number; origin?: string }
  | { kind: "art"; at: number; endAt: number; img: string; id?: string; title?: string; talkAt?: number; nameAt?: number; cutAt?: number }
  | { kind: "stamp"; at: number; text: string; x?: number; y?: number; c?: string; rot?: number; size?: number; sub?: string; endAt?: number }
  | { kind: "hand"; at: number; text: string; x?: number; y?: number; c?: string; size?: number; rot?: number; endAt?: number }
  | { kind: "title"; at: number; text: string; sub?: string; endAt?: number }
  | { kind: "punch"; at: number; amp?: number }
  | { kind: "camps"; at: number; endAt?: number }
  | { kind: "souls"; at: number; endAt?: number }
  | { kind: "list"; at: number; items: { t: string; at: number; ids: string[]; img?: string }[] };

const live = (f: number, m: { at: number; endAt?: number }, out = 6) => (f < m.at ? 0 : m.endAt != null ? Math.min(ease(f, m.at, 8), 1 - ease(f, m.endAt - out, out)) : ease(f, m.at, 8));

const Grain: React.FC = () => {
  const f = useCurrentFrame();
  const seed = Math.floor(f / 2) % 9;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: 0.07, mixBlendMode: "overlay", pointerEvents: "none" }}>
      <filter id={`dmg${seed}`}><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={seed} /><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1.4 -0.2" /></filter>
      <rect width="100%" height="100%" filter={`url(#dmg${seed})`} />
    </svg>
  );
};

const StampBox: React.FC<{ f: number; at: number; text: string; size?: number; rot?: number; c?: string; sub?: string }> = ({ f, at, text, size = 90, rot = -6, c = STAMP, sub }) => {
  const s = interpolate(f, [at, at + 5], [2.2, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  const sh = shake(f, at + 5, 10, 8, `dst${text}`);
  return (
    <div style={{ display: "inline-block", transform: `translate(${sh.x}px, ${sh.y}px) rotate(${rot}deg) scale(${s})`, opacity: interpolate(f, [at, at + 2], [0, 0.96], clamp) }}>
      <div style={{ filter: "url(#dmrough)", border: `8px solid ${c}`, borderRadius: 12, padding: "8px 30px 12px", textAlign: "center", color: c, background: "rgba(8,14,14,0.55)" }}>
        <div style={{ fontFamily: POSTER, fontSize: size, lineHeight: 1.02, letterSpacing: 3, whiteSpace: "nowrap" }}>{text}</div>
        {sub ? <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: size * 0.32, letterSpacing: 6 }}>{sub}</div> : null}
      </div>
    </div>
  );
};

// desenho do objetivo (no espaço do mapa)
const Shape: React.FC<{ id: string; dead: boolean; deadT: number; f: number; hot: number }> = ({ id, dead, deadT, f, hot }) => {
  const o = OBJ[id];
  const [x, y] = o.p;
  const col = o.team === "e" ? DM.ENEMY : o.team === "a" ? (o.lane ? DM[o.lane] : CREAM) : DM.SPIRIT;
  const fill = dead ? "#2a2f2e" : "#0d1513";
  const st = dead ? "#5b6461" : col;
  const glow = !dead ? `drop-shadow(0 0 ${3 + hot * 6}px ${col})` : "none";
  const sz = { patron: 12, shrine: 7.5, base: 6.5, walker: 13, guard: 8.5, mid: 9 }[o.k];
  const sc = 1 + hot * 0.35;
  const xMark = dead ? (
    <g opacity={Math.min(1, deadT / 6)}>
      <line x1={-sz} y1={-sz} x2={sz} y2={sz} stroke={STAMP} strokeWidth={3} strokeLinecap="round" />
      <line x1={sz} y1={-sz} x2={-sz} y2={sz} stroke={STAMP} strokeWidth={3} strokeLinecap="round" />
    </g>
  ) : null;
  if (o.k === "mid")
    return (
      <g transform={`translate(${x} ${y}) scale(${sc})`} style={{ filter: glow }}>
        <polygon points="0,-11 10,-4 6,9 -6,9 -10,-4" fill={fill} stroke={st} strokeWidth={2.4} />
        <circle r={3.4} fill={st} />
      </g>
    );
  return (
    <g transform={`translate(${x} ${y}) scale(${sc})`} style={{ filter: glow }}>
      {o.k === "patron" ? (
        <path d={o.team === "e" ? "M-38 -8 A38 38 0 0 1 38 -8 L26 -8 A26 26 0 0 0 -26 -8 Z" : "M-38 8 A38 38 0 0 0 38 8 L26 8 A26 26 0 0 1 -26 8 Z"} fill={dead ? "#2a2f2e" : `${col}55`} stroke={st} strokeWidth={2} />
      ) : null}
      <rect x={-sz} y={-sz} width={sz * 2} height={sz * 2} transform="rotate(45)" fill={fill} stroke={st} strokeWidth={2.4} />
      {o.k === "walker" || o.k === "patron" ? <rect x={-sz * 0.42} y={-sz * 0.42} width={sz * 0.84} height={sz * 0.84} transform="rotate(45)" fill={st} /> : null}
      {o.k === "shrine" ? <circle r={2.6} fill={st} /> : null}
      {xMark}
    </g>
  );
};

export const DLMapa: React.FC<{ life: number; cam?: Cam[]; marks?: Mark[]; dead?: string[]; intro?: boolean; you?: P | string | null; hideAlly?: boolean }> = ({
  life, cam = [], marks = [], dead = [], intro = false, you = null,
}) => {
  const f = useCurrentFrame();
  const R = "videos/2026-11-07_deadlock-objetivos_R/";
  const img = (n: string) => staticFile(`${R}ob/${n}`);
  // câmera + soco de zoom nos "punch" e nos "x"
  const c = camAt(cam, f);
  const hits = marks.flatMap((m) => (m.kind === "punch" ? [{ t: m.at, a: m.amp ?? 0.08 }] : m.kind === "x" ? m.ids.map((_, i) => ({ t: m.at + i * (m.stagger ?? 5), a: 0.05 })) : []));
  const pz = hits.reduce((z, h) => (f >= h.t && f < h.t + 9 ? z + h.a * (1 - (f - h.t) / 9) ** 2 : z), 0);
  const sh = hits.reduce((a, h, i) => { const s = shake(f, h.t, 10, 8, `dh${i}`); return { x: a.x + s.x, y: a.y + s.y }; }, { x: 0, y: 0 });
  const drift = interpolate(f, [0, life], [0, 0.03], clamp);
  const z = c.z * (1 + drift + pz);
  const K = S0 * z;
  const proj = (p: P): P => [SX + (p[0] - c.x) * K + sh.x, SY + (p[1] - c.y) * K + sh.y];
  const mapT = `translate(${SX + sh.x} ${SY + sh.y}) scale(${K}) translate(${-c.x} ${-c.y})`;
  // entrada do mapa
  const inT = intro ? ease(f, 0, 26) : 1;
  const lanesT = intro ? interpolate(f, [8, 40], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) }) : 1;
  // mortos: os da prop + os "x" que já bateram
  const deadAt: Record<string, number> = {};
  dead.forEach((id) => (deadAt[id] = -999));
  marks.forEach((m) => { if (m.kind === "x") m.ids.forEach((id, i) => { const t = m.at + i * (m.stagger ?? 5); if (f >= t && deadAt[id] == null) deadAt[id] = t; }); });
  // destaque (hot) por anel ativo
  const hot: Record<string, number> = {};
  marks.forEach((m) => {
    if (m.kind === "ring") m.ids.forEach((id, i) => { const t = m.at + i * (m.stagger ?? 3); if (f >= t && (m.endAt == null || f < m.endAt)) hot[id] = Math.max(hot[id] ?? 0, 0.5 + 0.5 * Math.sin((f - t) / 4)); });
    if (m.kind === "list") m.items.forEach((it) => it.ids.forEach((id) => { if (f >= it.at && f < it.at + 30) hot[id] = Math.max(hot[id] ?? 0, 1 - (f - it.at) / 30); }));
  });
  // "você": posição atual
  let youP: P | null = you != null ? pt(you as string | P) : null;
  let youMove = 0;
  marks.forEach((m) => {
    if (m.kind !== "you" || f < m.at) return;
    const from = youP ?? pt(m.to);
    const t = interpolate(f, [m.at, m.at + Math.max(1, m.dur ?? 12)], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
    const to = pt(m.to);
    youP = [from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t];
    if (t < 1) youMove = 1;
  });
  marks.forEach((m) => {
    if (m.kind !== "route" || f < m.at) return;
    const pts = smooth(m.ids.map(pt));
    const u = interpolate(f, [m.at, m.at + m.dur], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
    if (m.endAt == null || f < m.endAt) { youP = along(pts, u); if (u < 1) youMove = 1; }
  });
  const campsOn = marks.find((m) => m.kind === "camps" && f >= m.at && (m.endAt == null || f < m.endAt));
  const soulsOn = marks.find((m) => m.kind === "souls" && f >= m.at && (m.endAt == null || f < m.endAt)) as { at: number } | undefined;

  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse 90% 70% at 50% 38%, #12302b 0%, ${INK} 72%)`, overflow: "hidden" }}>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <filter id="dmrough"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="4" /><feDisplacementMap in="SourceGraphic" scale="6" /></filter>
      </svg>
      <div style={{ position: "absolute", inset: 0, opacity: 0.2, backgroundImage: "radial-gradient(#000 28%, transparent 30%)", backgroundSize: "12px 12px" }} />
      {/* almas subindo no fundo */}
      {Array.from({ length: 14 }).map((_, i) => {
        const x = random(`dsx${i}`) * 1080, sp = 0.8 + random(`dsv${i}`) * 1.6, y = 1980 - ((f * sp + random(`dsy${i}`) * 1980) % 2100), s = 4 + random(`dss${i}`) * 8;
        return <div key={i} style={{ position: "absolute", left: x, top: y, width: s, height: s, borderRadius: "50%", background: SOUL, boxShadow: `0 0 ${s * 2}px ${SOUL}`, opacity: 0.25 }} />;
      })}

      {/* ===== o mapa ===== */}
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: inT }}>
        <defs>
          <radialGradient id="dmdisk" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#15302b" />
            <stop offset="80%" stopColor="#0c1a17" />
            <stop offset="100%" stopColor="#081210" />
          </radialGradient>
          <clipPath id="dmclip"><circle cx={CX} cy={CY} r={RAD + 2} /></clipPath>
        </defs>
        <g transform={mapT}>
          <g transform={`translate(${CX} ${CY}) scale(${0.92 + 0.08 * inT}) translate(${-CX} ${-CY})`}>
            {/* borda e as duas bases salientes */}
            <circle cx={CX} cy={CY} r={RAD + 10} fill="none" stroke={SOUL} strokeOpacity={0.12} strokeWidth={10} />
            <path d={`M ${CX + 30} ${CY - RAD - 4} Q ${CX + 30} 20 280 18 Q ${CX - 2} 20 ${CX - 28} ${CY - RAD + 2}`} fill="#0c1a17" stroke={`${CREAM}55`} strokeWidth={2} />
            <path d={`M ${CX - 60} ${CY + RAD - 4} Q ${CX - 60} 545 220 548 Q ${CX + 2} 545 ${CX + 26} ${CY + RAD - 4}`} fill="#0c1a17" stroke={`${CREAM}55`} strokeWidth={2} />
            <circle cx={CX} cy={CY} r={RAD} fill="url(#dmdisk)" stroke={`${CREAM}66`} strokeWidth={2.5} />
            <g clipPath="url(#dmclip)">
              {BLOCKS.map((b, i) => (
                <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h} rx={1.5} fill="#1b2d29" stroke="#2c4741" strokeWidth={0.8} opacity={b.o * Math.min(1, inT * 1.4 - (i % 7) * 0.05)} />
              ))}
              {CAMPS.map((p, i) => (
                <polygon key={i} points={`${p[0]},${p[1] - 5} ${p[0] + 4.5},${p[1] + 3.5} ${p[0] - 4.5},${p[1] + 3.5}`} fill={campsOn ? DM.GOLD : "#4c6c65"} opacity={campsOn ? 0.6 + 0.4 * Math.sin((f + i * 5) / 5) : 0.7}
                  style={campsOn ? { filter: `drop-shadow(0 0 4px ${DM.GOLD})` } : undefined} />
              ))}
            </g>
            {/* as 3 rotas: seu lado na cor da rota, o lado deles em vermelho */}
            {LANES.map((l) => {
              const parts: [P[], string][] = [[l.ally, DM[l.k]], [l.link, `${CREAM}`], [l.enemy, DM.ENEMY]];
              return (
                <g key={l.k}>
                  {parts.map(([pts, col], j) => {
                    const Lp = polyLen(pts);
                    return (
                      <g key={j}>
                        <path d={polyD(pts)} fill="none" stroke="#000" strokeOpacity={0.5} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
                        <path d={polyD(pts)} fill="none" stroke={col} strokeOpacity={j === 1 ? 0.35 : 0.85} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${lanesT * Lp} ${Lp}`} />
                      </g>
                    );
                  })}
                </g>
              );
            })}
            {/* rota acesa (fluxo) */}
            {marks.map((m, i) => {
              if (m.kind !== "lane") return null;
              return m.lanes.map((k, j) => {
                const t0 = m.at + j * (m.stagger ?? 5);
                const o = live(f, { at: t0, endAt: m.endAt });
                if (o <= 0) return null;
                const l = LANES.find((x) => x.k === k)!;
                const Lp = polyLen(l.all);
                const grow = ease(f, t0, 16);
                return (
                  <g key={`${i}${k}`} opacity={o}>
                    <path d={polyD(l.all)} fill="none" stroke={DM[k]} strokeWidth={5} strokeLinecap="round" strokeDasharray={`${grow * Lp} ${Lp}`} style={{ filter: `drop-shadow(0 0 6px ${DM[k]})` }} />
                    <path d={polyD(l.all)} fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeDasharray="6 14" strokeDashoffset={-f * 1.6} opacity={0.8 * grow} />
                  </g>
                );
              });
            })}
            {/* caminho do "você" */}
            {marks.map((m, i) => {
              if (m.kind !== "route" || f < m.at) return null;
              const pts = smooth(m.ids.map(pt));
              const Lp = polyLen(pts);
              const u = interpolate(f, [m.at, m.at + m.dur], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
              const o = live(f, m);
              return <path key={`r${i}`} d={polyD(pts)} fill="none" stroke={SOUL} strokeWidth={4} strokeLinecap="round" strokeDasharray={`${u * Lp} ${Lp}`} opacity={o} style={{ filter: `drop-shadow(0 0 6px ${SOUL})` }} />;
            })}
            {/* alcance */}
            {marks.map((m, i) => {
              if (m.kind !== "range") return null;
              const o = live(f, m);
              if (o <= 0) return null;
              const [x, y] = pt(m.id);
              const r = m.r * back(f, m.at, 12, 1.5);
              return (
                <g key={`g${i}`} opacity={o}>
                  <circle cx={x} cy={y} r={r} fill={`${SOUL}1f`} stroke={SOUL} strokeWidth={1.6} strokeDasharray="5 4" strokeDashoffset={-f * 0.5} />
                </g>
              );
            })}
            {/* objetivos */}
            {Object.keys(OBJ).map((id) => {
              const d = deadAt[id] != null;
              return <Shape key={id} id={id} dead={d} deadT={d ? f - deadAt[id] : 0} f={f} hot={hot[id] ?? 0} />;
            })}
          </g>
        </g>
      </svg>

      {/* ===== camada de tela (tamanho fixo, não escala com o zoom) ===== */}
      {/* explosão dos "x" */}
      {marks.map((m, i) => {
        if (m.kind !== "x") return null;
        return m.ids.map((id, j) => {
          const t = m.at + j * (m.stagger ?? 5);
          if (f < t || f > t + 16) return null;
          const [x, y] = proj(pt(id));
          const e = ease(f, t, 14);
          return (
            <div key={`${i}${id}`} style={{ position: "absolute", left: x - 90, top: y - 90, width: 180, height: 180, borderRadius: "50%", border: `6px solid ${DM.GOLD}`, transform: `scale(${0.3 + e * 1.4})`, opacity: 1 - e,
              boxShadow: `0 0 40px ${STAMP}, inset 0 0 30px ${DM.GOLD}` }} />
          );
        });
      })}
      {/* anéis */}
      {marks.map((m, i) => {
        if (m.kind !== "ring") return null;
        return m.ids.map((id, j) => {
          const t = m.at + j * (m.stagger ?? 3);
          const o = live(f, { at: t, endAt: m.endAt });
          if (o <= 0) return null;
          const [x, y] = proj(pt(id));
          const r = 34 + 16 * z * 0.5;
          const pulse = ((f - t) % 24) / 24;
          const col = m.c ?? SOUL;
          return (
            <React.Fragment key={`${i}${id}`}>
              <div style={{ position: "absolute", left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: "50%", border: `4px solid ${col}`, transform: `scale(${back(f, t, 10, 2)})`, opacity: o, boxShadow: `0 0 20px ${col}` }} />
              <div style={{ position: "absolute", left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: "50%", border: `3px solid ${col}`, transform: `scale(${1 + pulse * 0.8})`, opacity: o * (1 - pulse) }} />
            </React.Fragment>
          );
        });
      })}
      {/* cadeado */}
      {marks.map((m, i) => {
        if (m.kind !== "lock" || f < m.at) return null;
        const [x, y] = proj(pt(m.id));
        const open = m.openAt != null ? ease(f, m.openAt, 10) : 0;
        const gone = m.openAt != null ? ease(f, m.openAt + 14, 10) : 0;
        if (gone >= 1) return null;
        const sh2 = m.openAt != null ? shake(f, m.openAt, 8, 8, "lk") : { x: 0, y: 0 };
        return (
          <div key={`l${i}`} style={{ position: "absolute", left: x - 46 + sh2.x, top: y - 120 + sh2.y, width: 92, height: 110, transform: `scale(${back(f, m.at, 10, 2) * (1 + gone * 0.4)})`, opacity: 1 - gone }}>
            <svg width={92} height={110} viewBox="0 0 92 110">
              <path d={`M24 52 V34 A22 22 0 0 1 68 34 V${52 - open * 22}`} fill="none" stroke={CREAM} strokeWidth={10} strokeLinecap="round" transform={`translate(${open * 18} ${-open * 14})`} />
              <rect x={10} y={50} width={72} height={56} rx={10} fill={open ? SOUL : STAMP} stroke={INK} strokeWidth={4} />
              <circle cx={46} cy={74} r={7} fill={INK} />
              <rect x={43} y={76} width={6} height={16} rx={3} fill={INK} />
            </svg>
          </div>
        );
      })}
      {/* "você" */}
      {youP ? (() => {
        const [x, y] = proj(youP);
        const bob = youMove ? Math.sin(f / 2) * 3 : 0;
        return (
          <div style={{ position: "absolute", left: x - 26, top: y - 26 + bob, width: 52, height: 52 }}>
            <div style={{ position: "absolute", inset: -10, borderRadius: "50%", background: `${SOUL}33`, transform: `scale(${1 + 0.15 * Math.sin(f / 5)})` }} />
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: SOUL, border: `5px solid ${INK}`, boxShadow: `0 0 26px ${SOUL}` }} />
            <div style={{ position: "absolute", left: -40, width: 132, top: -46, textAlign: "center", fontFamily: BODY, fontWeight: 900, fontSize: 26, letterSpacing: 4, color: SOUL, textShadow: "0 2px 8px #000" }}>VOCÊ</div>
          </div>
        );
      })() : null}
      {/* etiquetas com linha (estilo HUD) */}
      {marks.map((m, i) => {
        if (m.kind !== "tag") return null;
        const o = live(f, m);
        if (o <= 0) return null;
        const [x, y] = proj(pt(m.id));
        const side = m.side ?? (x > 540 ? "l" : "r");
        // largura pelo texto (07/11: "2 SANTUÁRIOS" e "AGORA TOMA DANO" vazavam da caixa fixa): Anton ~0,5 em por letra,
        // subtítulo Nunito 900 com espaçamento ~21 px por letra; folga de sobra para nunca encostar na borda
        const W = Math.min(860, Math.max(m.text.length * 27, (m.sub ?? "").length * 21) + 56 + (m.img ? 86 : 0)), H = m.sub ? 128 : 100;
        const off = 70 + 40;
        let bx = side === "r" ? x + off : side === "l" ? x - off - W : x - W / 2;
        // nos lados, a caixa sobe acima do ponto (o "você" costuma estar logo abaixo do objetivo)
        let by = side === "t" ? y - off - H : side === "b" ? y + off : y - H - 24;
        bx = Math.max(40, Math.min(bx, (by + H > 700 ? 930 : 1040) - W));
        by = Math.max(190, Math.min(by, 1290 - H));
        const ax = Math.max(bx, Math.min(x, bx + W)), ay = Math.max(by, Math.min(y, by + H));
        const line = ease(f, m.at, 8);
        const box = back(f, m.at + 5, 10, 1.6);
        const col = m.c ?? CREAM;
        return (
          <React.Fragment key={`t${i}`}>
            <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: o }}>
              <line x1={x} y1={y} x2={x + (ax - x) * line} y2={y + (ay - y) * line} stroke={col} strokeWidth={3} />
              <circle cx={x} cy={y} r={7} fill={col} />
            </svg>
            <div style={{ position: "absolute", left: bx, top: by, width: W, height: H, opacity: o, transform: `scale(${box})`, transformOrigin: `${ax - bx}px ${ay - by}px`,
              background: "rgba(8,14,14,0.88)", border: `3px solid ${col}`, borderRadius: 14, display: "flex", alignItems: "center", gap: 14, padding: "0 18px", boxShadow: "0 12px 30px rgba(0,0,0,0.6)" }}>
              {m.img ? <Img src={img(m.img)} style={{ width: 70, height: 70, objectFit: "contain", flexShrink: 0 }} /> : null}
              <div>
                <div style={{ fontFamily: POSTER, fontSize: 52, lineHeight: 1, color: col, letterSpacing: 1.5, whiteSpace: "nowrap" }}>{m.text}</div>
                {m.sub ? <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 22, letterSpacing: 4, color: SOUL, marginTop: 6, whiteSpace: "nowrap" }}>{m.sub}</div> : null}
              </div>
            </div>
          </React.Fragment>
        );
      })}
      {/* barra de vida do Patrono (2 vidas) */}
      {marks.map((m, i) => {
        if (m.kind !== "hp") return null;
        const o = live(f, m);
        if (o <= 0) return null;
        const v = [1, 1];
        m.drains.forEach((d) => {
          if (f < d.at) return;
          const t = interpolate(f, [d.at, d.at + Math.max(1, d.dur)], [0, 1], clamp);
          v[d.seg] = v[d.seg] + (d.to - v[d.seg]) * t;
        });
        const [x, y] = proj(pt(m.id));
        const hitF = m.drains.some((d) => f >= d.at && f < d.at + d.dur && Math.floor(f / 3) % 2 === 0);
        return (
          <React.Fragment key={`h${i}`}>
            <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: o * 0.7 }}>
              <line x1={540} y1={360} x2={x} y2={y - 40} stroke={CREAM} strokeWidth={2} strokeDasharray="6 6" />
            </svg>
            <div style={{ position: "absolute", left: 90, top: 200, width: 900, opacity: o, transform: `translateY(${(1 - ease(f, m.at, 10)) * -30}px)` }}>
              <div style={{ fontFamily: POSTER, fontSize: 58, color: CREAM, textAlign: "center", letterSpacing: 3, textShadow: "0 4px 18px #000" }}>{m.name}</div>
              <div style={{ display: "flex", gap: 14, marginTop: 8 }}>
                {[0, 1].map((k) => (
                  <div key={k} style={{ flex: 1, height: 44, borderRadius: 8, background: "rgba(0,0,0,0.8)", border: `4px solid ${hitF ? "#fff" : CREAM}`, overflow: "hidden", position: "relative" }}>
                    <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${v[k] * 100}%`, background: k === 0 ? `linear-gradient(180deg, #ff7a5c, ${STAMP})` : `linear-gradient(180deg, #ffe09a, #f2a13a)` }} />
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 14, marginTop: 6 }}>
                {["1ª VIDA", "2ª VIDA"].map((t, k) => (
                  <div key={t} style={{ flex: 1, textAlign: "center", fontFamily: BODY, fontWeight: 900, fontSize: 28, letterSpacing: 5, color: v[k] <= 0.001 ? "#7c8582" : CREAM, textDecoration: v[k] <= 0.001 ? "line-through" : "none" }}>{t}</div>
                ))}
              </div>
            </div>
          </React.Fragment>
        );
      })}
      {/* janela de gameplay saindo do ponto marcado */}
      {marks.map((m, i) => {
        if (m.kind !== "clip") return null;
        const o = live(f, m, 5);
        if (o <= 0) return null;
        const top = (m.side ?? "top") === "top";
        const W = 860, H = 420, bx = 110, by = top ? 200 : 870;
        const len = 30;
        const life2 = m.endAt - m.at + 10;
        const loopF = Math.max(1, Math.floor(((len - (m.ss ?? 0)) / (m.rate ?? 1)) * FPS) - 1);
        const v = <OffthreadVideo src={staticFile(`${R}clips/${m.clip}.mp4`)} muted startFrom={Math.round((m.ss ?? 0) * FPS)} playbackRate={m.rate ?? 1} style={{ width: "100%", height: "100%", objectFit: "cover" }} />;
        const pop = back(f, m.at, 10, 1.4);
        const p = m.id ? proj(pt(m.id)) : null;
        return (
          <React.Fragment key={`c${i}`}>
            {p ? (
              <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: o }}>
                <polygon points={`${p[0]},${p[1]} ${bx + W / 2 - 60},${top ? by + H : by} ${bx + W / 2 + 60},${top ? by + H : by}`} fill={`${SOUL}22`} stroke={SOUL} strokeWidth={2} />
              </svg>
            ) : null}
            <div style={{ position: "absolute", left: bx, top: by, width: W, height: H, opacity: o, transform: `scale(${0.6 + 0.4 * pop})`, transformOrigin: top ? "50% 100%" : "50% 0%",
              borderRadius: 18, overflow: "hidden", border: `5px solid ${SOUL}`, boxShadow: `0 0 40px ${SOUL}55, 0 20px 50px rgba(0,0,0,0.7)`, background: "#000" }}>
              <div style={{ position: "absolute", inset: 0, transformOrigin: m.origin ?? "50% 50%", transform: `scale(${(m.zoom ?? 1) * (1.04 + interpolate(f, [m.at, m.endAt], [0, 0.06], clamp))})` }}>
                {life2 > loopF ? <Loop durationInFrames={loopF}>{v}</Loop> : v}
              </div>
              <AbsoluteFill style={{ background: "#fff", opacity: interpolate(f, [m.at, m.at + 5], [0.5, 0], clamp) }} />
              {m.label ? (
                <div style={{ position: "absolute", left: 18, top: 14, padding: "4px 14px", background: "rgba(8,14,14,0.8)", borderRadius: 8, fontFamily: BODY, fontWeight: 900, fontSize: 24, letterSpacing: 4, color: SOUL }}>
                  ● {m.label}
                </div>
              ) : null}
            </div>
          </React.Fragment>
        );
      })}
      {/* arte oficial (cartão) com balão de fala, crachá e corte */}
      {marks.map((m, i) => {
        if (m.kind !== "art") return null;
        const o = live(f, m, 6);
        if (o <= 0) return null;
        const p = m.id ? proj(pt(m.id)) : null;
        const pop = back(f, m.at, 12, 1.4);
        const cut = m.cutAt != null && f >= m.cutAt;
        const wave = (k: number) => 14 + Math.abs(Math.sin((f + k * 7) / 3.2)) * (cut ? 3 : 40);
        return (
          <div key={`a${i}`} style={{ position: "absolute", inset: 0, opacity: o }}>
            {p ? (
              <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
                <line x1={p[0]} y1={p[1]} x2={290} y2={680} stroke={CREAM} strokeWidth={3} strokeDasharray="8 8" />
              </svg>
            ) : null}
            <div style={{ position: "absolute", left: 90, top: 200, width: 400, height: 490, transform: `rotate(-3deg) scale(${pop})`, borderRadius: 18, overflow: "hidden", border: `6px solid ${CREAM}`,
              boxShadow: "0 18px 40px rgba(0,0,0,0.7)", filter: cut ? "grayscale(1) brightness(0.75)" : "none", background: "#000" }}>
              <Img src={img(m.img)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              {m.title ? <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", color: CREAM, fontFamily: BODY, fontWeight: 900, fontSize: 28, letterSpacing: 4, textAlign: "center", padding: "6px 0" }}>{m.title}</div> : null}
            </div>
            {m.talkAt != null && f >= m.talkAt ? (
              <div style={{ position: "absolute", left: 540, top: 220, width: 400, height: 170, transform: `scale(${back(f, m.talkAt, 10, 1.6)})`, transformOrigin: "0% 100%" }}>
                <div style={{ position: "absolute", inset: 0, background: CREAM, borderRadius: 40, boxShadow: "0 12px 30px rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                  {Array.from({ length: 11 }).map((_, k) => <div key={k} style={{ width: 15, height: wave(k), borderRadius: 8, background: INK }} />)}
                </div>
                <div style={{ position: "absolute", left: -6, bottom: -24, width: 0, height: 0, borderLeft: "28px solid transparent", borderRight: "28px solid transparent", borderTop: `44px solid ${CREAM}`, transform: "rotate(35deg)" }} />
              </div>
            ) : null}
            {m.nameAt != null && f >= m.nameAt ? (
              <div style={{ position: "absolute", left: 540, top: 430, width: 390, transform: `rotate(4deg) scale(${back(f, m.nameAt, 10, 1.8)})` }}>
                <div style={{ background: "#e9e1cc", borderRadius: 14, border: `5px solid ${INK}`, padding: "12px 20px", boxShadow: "0 12px 30px rgba(0,0,0,0.6)" }}>
                  <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 24, letterSpacing: 6, color: STAMP }}>OLÁ, MEU NOME É</div>
                  <div style={{ fontFamily: HAND, fontWeight: 700, fontSize: 62, color: INK, lineHeight: 1.1 }}>Guardião ___</div>
                </div>
              </div>
            ) : null}
            {cut ? (
              <div style={{ position: "absolute", left: 520, top: 200, width: 440, height: 400 }}>
                <svg width={440} height={400}>
                  <path d="M20 20 L420 380" stroke={STAMP} strokeWidth={20} strokeLinecap="round" strokeDasharray="560" strokeDashoffset={560 - ease(f, m.cutAt!, 6) * 560} />
                  <path d="M420 20 L20 380" stroke={STAMP} strokeWidth={20} strokeLinecap="round" strokeDasharray="560" strokeDashoffset={560 - ease(f, m.cutAt! + 4, 6) * 560} />
                </svg>
                <div style={{ position: "absolute", left: 0, right: 0, top: 150, display: "flex", justifyContent: "center" }}>
                  <StampBox f={f} at={m.cutAt! + 8} text="TIRARAM" size={84} />
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
      {/* checklist (recap) */}
      {marks.map((m, i) => {
        if (m.kind !== "list" || f < m.at) return null;
        const n = m.items.length;
        const W = Math.min(190, (1000 - (n - 1) * 10) / n);
        return (
          <div key={`li${i}`} style={{ position: "absolute", left: (1080 - (W * n + 10 * (n - 1))) / 2, top: 200, display: "flex", gap: 10 }}>
            {m.items.map((it, k) => {
              const on = f >= it.at;
              const e = back(f, m.at + k * 3, 10, 1.6);
              const pop = on ? 1 + 0.18 * (1 - ease(f, it.at, 10)) : 1;
              return (
                <div key={it.t} style={{ width: W, height: 150, borderRadius: 14, background: on ? "rgba(10,40,36,0.95)" : "rgba(8,14,14,0.85)", border: `3px solid ${on ? SOUL : `${CREAM}66`}`, transform: `scale(${e * pop})`,
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, boxShadow: on ? `0 0 26px ${SOUL}66` : "none", position: "relative" }}>
                  {it.img ? <Img src={img(it.img)} style={{ width: 62, height: 62, objectFit: "contain", opacity: on ? 1 : 0.45 }} /> : null}
                  <div style={{ fontFamily: POSTER, fontSize: 30, color: on ? CREAM : `${CREAM}88`, letterSpacing: 1 }}>{it.t}</div>
                  <div style={{ position: "absolute", left: 8, top: 6, fontFamily: BODY, fontWeight: 900, fontSize: 20, color: on ? SOUL : `${CREAM}66` }}>{k + 1}</div>
                  {on ? <div style={{ position: "absolute", right: -10, top: -12, width: 40, height: 40, borderRadius: "50%", background: SOUL, color: INK, fontFamily: BODY, fontWeight: 900, fontSize: 28,
                    display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${back(f, it.at, 8, 2.2)})` }}>✓</div> : null}
                </div>
              );
            })}
          </div>
        );
      })}
      {/* almas saindo dos acampamentos (próximo episódio) */}
      {soulsOn
        ? CAMPS.slice(0, 18).map((cp, k) => {
            const t = (((f - soulsOn.at) * 1.2 + k * 9) % 46) / 46;
            const [x, y] = proj(cp);
            return <div key={`so${k}`} style={{ position: "absolute", left: x - 7, top: y - 7 - t * 120, width: 14, height: 14, borderRadius: "50%", background: SOUL, boxShadow: `0 0 16px ${SOUL}`, opacity: Math.sin(t * Math.PI) * ease(f, soulsOn.at, 10) }} />;
          })
        : null}
      {/* títulos, carimbos e notas à mão */}
      {marks.map((m, i) => {
        if (m.kind === "title") {
          const o = live(f, m);
          if (o <= 0) return null;
          const s = interpolate(f, [m.at, m.at + 5], [1.8, 1], { ...clamp, easing: Easing.in(Easing.quad) });
          return (
            <div key={`ti${i}`} style={{ position: "absolute", left: 40, right: 40, top: 200, textAlign: "center", opacity: o, transform: `scale(${s})` }}>
              <div style={{ fontFamily: POSTER, fontSize: 96, color: CREAM, letterSpacing: 2, lineHeight: 1, textShadow: "0 8px 30px rgba(0,0,0,0.85)" }}>{m.text}</div>
              {m.sub ? <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 28, color: SOUL, letterSpacing: 8, marginTop: 10 }}>{m.sub}</div> : null}
            </div>
          );
        }
        if (m.kind === "stamp") {
          const o = live(f, m);
          if (o <= 0) return null;
          return (
            <div key={`st${i}`} style={{ position: "absolute", left: 0, width: 1080, top: m.y ?? 1080, display: "flex", justifyContent: "center", opacity: o, transform: `translateX(${(m.x ?? 540) - 540}px)` }}>
              <StampBox f={f} at={m.at} text={m.text} size={m.size ?? 90} rot={m.rot ?? -6} c={m.c ?? STAMP} sub={m.sub} />
            </div>
          );
        }
        if (m.kind === "hand") {
          const o = live(f, m);
          if (o <= 0) return null;
          const p = interpolate(f, [m.at, m.at + Math.max(8, m.text.length * 1.1)], [0, 100], clamp);
          return (
            <div key={`ha${i}`} style={{ position: "absolute", left: (m.x ?? 540) - 450, width: 900, top: m.y ?? 1180, textAlign: "center", opacity: o, transform: `rotate(${m.rot ?? -3}deg)`,
              fontFamily: HAND, fontWeight: 700, fontSize: m.size ?? 66, color: m.c ?? CREAM, lineHeight: 1, clipPath: `inset(0 ${(100 - p) / 2}% 0 ${(100 - p) / 2}%)`, textShadow: "0 4px 16px rgba(0,0,0,0.9)" }}>{m.text}</div>
          );
        }
        return null;
      })}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 85% 70% at 50% 40%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.7) 100%)", pointerEvents: "none" }} />
      <Grain />
      <AbsoluteFill style={{ background: "#fff", opacity: hits.reduce((a, h) => a + (f >= h.t && f < h.t + 5 ? 0.18 * (1 - (f - h.t) / 5) : 0), 0) + (intro ? interpolate(f, [0, 5], [0.35, 0], clamp) : 0), pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};
