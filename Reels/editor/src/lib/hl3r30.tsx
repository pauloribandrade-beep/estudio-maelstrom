// =================================================================================================
// HL3 · 1:50:22 o mundo dos Vortigaunts em ILUSTRAÇÃO CHAPADA (31/10/2026), mesmo traço do Ártico 2D: um planeta calmo,
// sem ruínas, sem Combine, sem Borealis. Vortigaunts livres cultivando e conversando, a comida oferecida, o Vortigaunt
// velho sentado olhando o céu, o Gordon (de costas) senta ao lado, a névoa abre lá longe, a tela escurece.
// =================================================================================================
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C } from "./hl3";
import { FilmLook } from "./hl3r";
import { rnd, cl, eo, P, pts, camAt, Label, K, Pt } from "./hl3r27";
import { GordonBack } from "./hl3r28";
import { InkFilter, GordonSitBack } from "./hl3chars";

type PR = Record<string, number> & { life: number };
const at = (p: PR, k: string) => Math.round((p[k] as number | undefined) ?? 1e6);
const HZ = 640; // horizonte

// ---------------------------------------------------------------------------------------------- Vortigaunt
// de perfil para a direita (d = -1 vira). pose: walk, work (enxada), talk (gesto), offer (tigela), carry (cesto)
type Pose = "walk" | "work" | "talk" | "offer" | "carry" | "stand";
const VC = { body: "#6e7f45", dark: "#4c5a2e", belly: "#9fae6e" };
const VO = { body: "#9d9a7e", dark: "#7a776a", belly: "#bdb9a0" };
export const Vort: React.FC<{ x: number; y: number; s: number; d?: number; pose: Pose; ph: number; f: number; old?: boolean; off?: number }> = ({ x, y, s, d = 1, pose, ph, f, old, off = 0 }) => {
  const c = old ? VO : VC;
  const amp = pose === "walk" || pose === "carry" ? 1 : 0;
  const bob = -Math.abs(Math.sin(ph)) * 4 * amp;
  const leg = (k: number) => {
    const sw = Math.sin(ph + k * Math.PI) * 0.4 * amp;
    const hx = k ? 4 : -4, kx = hx + 18 + sw * 30, ax = hx - 6 + sw * 40;
    return (
      <g key={k}>
        <polyline points={pts([[hx, -84 + bob], [kx, -52], [ax, -18], [ax + 18, -2]])} fill="none" stroke={k ? c.body : c.dark} strokeWidth={17} strokeLinejoin="round" strokeLinecap="round" />
        <polygon points={pts([[ax + 6, -6], [ax + 28, -4], [ax + 30, 0], [ax + 4, 0]])} fill={c.dark} />
      </g>
    );
  };
  const swing = Math.sin(ph) * 0.5 * amp;
  // mão do braço da frente
  const hand: Pt =
    pose === "work" ? [40, -46 + Math.sin(f / 7) * 10] : pose === "talk" ? [52, -150 + Math.sin(f / 6) * 10] : pose === "offer" ? [44 + off * 30, -118] : pose === "carry" ? [30, -110] : [16 + swing * 30, -76];
  const elb: Pt = pose === "talk" ? [44, -116] : pose === "offer" ? [30 + off * 12, -112] : [22 + swing * 16, -104];
  return (
    <g transform={`translate(${x} ${y}) scale(${s * d} ${s})`}>
      <ellipse cx={4} cy={2} rx={34} ry={7} fill="#5a4a2c" opacity={0.35} />
      {leg(0)}
      {/* braço de trás */}
      <polyline points={pts([[8, -128 + bob], [-6 - swing * 16, -100], [-2 - swing * 30, -74]])} fill="none" stroke={c.dark} strokeWidth={13} strokeLinejoin="round" strokeLinecap="round" />
      {leg(1)}
      <g transform={`translate(0 ${bob})`}>
        {/* corpo curvado */}
        <ellipse cx={4} cy={-112} rx={32} ry={44} fill={c.body} transform="rotate(22 4 -112)" />
        <ellipse cx={14} cy={-104} rx={13} ry={28} fill={c.belly} transform="rotate(22 14 -104)" />
        {[0, 1, 2].map((q) => <ellipse key={q} cx={-10 + q * 6} cy={-130 + q * 18} rx={5} ry={3.5} fill={c.dark} />)}
        {/* o bracinho do peito */}
        <polyline points={pts([[20, -108], [30, -98], [34, -88]])} fill="none" stroke={c.dark} strokeWidth={6} strokeLinecap="round" />
        {/* pescoço e cabeça */}
        <polyline points={pts([[20, -142], [40, -152]])} stroke={c.body} strokeWidth={18} strokeLinecap="round" />
        <ellipse cx={58} cy={-152} rx={30} ry={18} fill={c.body} />
        <polygon points={pts([[64, -146], [86, -140], [70, -134]])} fill={c.dark} />
        <circle cx={60} cy={-158} r={6.5} fill="#e04a2a" />
        <circle cx={60} cy={-158} r={2.4} fill="#1a0a06" />
        <circle cx={48} cy={-162} r={2.6} fill="#c43a22" />
        <circle cx={72} cy={-154} r={2.6} fill="#c43a22" />
        <path d="M60 -142 q 12 4 22 0" fill="none" stroke="#3a4228" strokeWidth={3} strokeLinecap="round" />
        {old ? <path d="M64 -138 q 6 14 2 22 M72 -138 q 8 12 6 20" fill="none" stroke="#e8e4d6" strokeWidth={3} strokeLinecap="round" /> : null}
      </g>
      {/* braço da frente */}
      <polyline points={pts([[22, -128 + bob], [elb[0], elb[1] + bob], [hand[0], hand[1] + bob]])} fill="none" stroke={c.body} strokeWidth={15} strokeLinejoin="round" strokeLinecap="round" />
      {[-1, 0, 1].map((q) => <polyline key={q} points={pts([[hand[0], hand[1] + bob], [hand[0] + 6, hand[1] + bob + 8 + q * 3]])} stroke={c.dark} strokeWidth={4} strokeLinecap="round" />)}
      {pose === "work" ? <polyline points={pts([[hand[0] - 30, hand[1] - 40], [hand[0] + 16, hand[1] + 44], [hand[0] + 34, hand[1] + 40]])} fill="none" stroke="#6b4a2a" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" /> : null}
      {pose === "offer" ? (
        <g transform={`translate(${hand[0] + 8} ${hand[1] + bob - 4})`}>
          <path d="M-22 0 q 22 26 44 0 z" fill="#8a5a34" />
          {[-10, 0, 10].map((q, k) => <circle key={k} cx={q} cy={-4 - (k === 1 ? 4 : 0)} r={7} fill="#ffcf5a" />)}
          <circle cx={0} cy={-6} r={22} fill="#ffcf5a" opacity={0.18} />
        </g>
      ) : null}
      {pose === "carry" ? (
        <g transform={`translate(${hand[0] - 4} ${hand[1] + bob})`}>
          <polygon points={pts([[-26, -26], [26, -26], [20, 10], [-20, 10]])} fill="#a77a44" />
          {[0, 1, 2].map((q) => <rect key={q} x={-24} y={-20 + q * 10} width={48} height={3} fill="#7a5530" />)}
          {[-14, 0, 14].map((q, k) => <circle key={k} cx={q} cy={-30} r={8} fill={k === 1 ? "#ffcf5a" : "#9ad46a"} />)}
        </g>
      ) : null}
    </g>
  );
};

// o Vortigaunt velho sentado, visto de trás; turn 0 olha o céu, 1 vira a cabeça para a esquerda (para o Gordon)
const OldVortBack: React.FC<{ x: number; y: number; s: number; turn: number; f: number }> = ({ x, y, s, turn, f }) => {
  const c = VO;
  const br = Math.sin(f / 26) * 1.5;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {/* costas curvadas, os braços apoiados nos joelhos */}
      <g transform={`translate(0 ${br})`}>
        <ellipse cx={0} cy={-62} rx={38} ry={50} fill={c.body} />
        <ellipse cx={-10} cy={-74} rx={14} ry={30} fill={c.dark} opacity={0.5} />
        {[0, 1, 2, 3].map((q) => <ellipse key={q} cx={-16 + q * 11} cy={-96 + (q % 2) * 16} rx={5} ry={3.5} fill={c.dark} />)}
        <polyline points={pts([[-30, -84], [-44, -50], [-30, -24]])} fill="none" stroke={c.dark} strokeWidth={11} strokeLinejoin="round" strokeLinecap="round" />
        <polyline points={pts([[30, -84], [44, -50], [30, -24]])} fill="none" stroke={c.dark} strokeWidth={11} strokeLinejoin="round" strokeLinecap="round" />
        <polyline points={pts([[0, -104], [0 - turn * 16, -124]])} stroke={c.body} strokeWidth={16} strokeLinecap="round" />
        {turn < 0.5 ? (
          // a cabeça de trás, erguida para o céu
          <g>
            <ellipse cx={0} cy={-134} rx={18} ry={22} fill={c.body} />
            <path d="M0 -154 l 0 34" stroke={c.dark} strokeWidth={4} strokeLinecap="round" />
          </g>
        ) : (
          // de perfil para a esquerda: o olho grande aparece
          <g transform="translate(-14 -132) scale(-1 1)">
            <ellipse cx={14} cy={0} rx={26} ry={15} fill={c.body} />
            <polygon points={pts([[20, 6], [42, 12], [26, 18]])} fill={c.dark} />
            <circle cx={16} cy={-6} r={6.5} fill="#e04a2a" />
            <circle cx={16} cy={-6} r={2.4} fill="#1a0a06" />
            <circle cx={4} cy={-10} r={2.6} fill="#c43a22" />
            <circle cx={28} cy={-2} r={2.6} fill="#c43a22" />
            <path d="M20 10 q 6 14 2 22 M28 10 q 8 12 6 20" fill="none" stroke="#e8e4d6" strokeWidth={3} strokeLinecap="round" />
          </g>
        )}
      </g>
    </g>
  );
};

// ---------------------------------------------------------------------------------------------- o planeta
const SkyV: React.FC<{ f: number }> = ({ f }) => (
  <g>
    <defs>
      <linearGradient id="vSky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#2e3466" />
        <stop offset="0.45" stopColor="#7a6ea6" />
        <stop offset="0.8" stopColor="#e0a98e" />
        <stop offset="1" stopColor="#f6d39c" />
      </linearGradient>
    </defs>
    <rect x={-1400} y={-900} width={7000} height={1600} fill="url(#vSky)" />
    {Array.from({ length: 70 }).map((_, i) => <circle key={i} cx={-1200 + rnd(i * 3) * 6400} cy={-850 + rnd(i * 7) * 900} r={1 + rnd(i) * 1.8} fill="#fff" opacity={0.3 + 0.5 * rnd(i * 5) * (0.7 + 0.3 * Math.sin(f / 20 + i))} />)}
    {/* duas luas */}
    <circle cx={2700} cy={60} r={170} fill="#f1e6d6" opacity={0.95} />
    <circle cx={2640} cy={20} r={28} fill="#ddd0bc" />
    <circle cx={2770} cy={110} r={40} fill="#ddd0bc" />
    <circle cx={2730} cy={-40} r={16} fill="#ddd0bc" />
    <circle cx={800} cy={-60} r={60} fill="#cfd6f0" opacity={0.8} />
    <circle cx={786} cy={-70} r={12} fill="#b9c0de" />
    {/* nuvens longas e calmas */}
    {[0, 1, 2, 3].map((i) => {
      const x = ((i * 1600 + f * 0.4) % 6400) - 1400, y = 260 + i * 70;
      return <rect key={i} x={x} y={y} width={900 + i * 120} height={22} rx={11} fill="#f6d8c0" opacity={0.35} />;
    })}
  </g>
);
const hill = (y0: number, amp: number, seed: number, x0 = -1400, x1 = 5200): string => {
  const ps: Pt[] = [];
  for (let x = x0; x <= x1; x += 120) ps.push([x, y0 - amp * (0.5 + 0.5 * Math.sin(x / 400 + seed)) - amp * 0.4 * rnd(Math.floor(x / 120) + seed * 31)]);
  return pts([[x0, 2000], ...ps, [x1, 2000]]);
};
// planta alienígena: haste curva com bulbos que brilham
const Plant: React.FC<{ x: number; y: number; h: number; i: number; f: number }> = ({ x, y, h, i, f }) => {
  const sw = Math.sin(f / 40 + i) * 6;
  return (
    <g>
      <path d={`M${x} ${y} q ${-10 + sw} ${-h * 0.5} ${sw * 2} ${-h}`} fill="none" stroke="#3e6a4a" strokeWidth={8} strokeLinecap="round" />
      <ellipse cx={x + sw * 2} cy={y - h} rx={16} ry={22} fill="#ffcf5a" opacity={0.9} />
      <ellipse cx={x + sw * 2} cy={y - h} rx={30} ry={38} fill="#ffcf5a" opacity={0.18 + 0.08 * Math.sin(f / 15 + i)} />
      <ellipse cx={x - 14} cy={y - h * 0.35} rx={14} ry={6} fill="#5d9a5a" transform={`rotate(-30 ${x - 14} ${y - h * 0.35})`} />
    </g>
  );
};
// casinha orgânica em domo
const Hut: React.FC<{ x: number; y: number; s: number }> = ({ x, y, s }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ellipse cx={0} cy={2} rx={110} ry={14} fill="#5a4a2c" opacity={0.35} />
    <path d="M-100 0 Q -100 -130 0 -140 Q 100 -130 100 0 Z" fill="#9b7d5e" />
    <path d="M-100 0 Q -100 -130 0 -140 L 0 0 Z" fill="#86694c" />
    {[-60, -20, 20, 60].map((q, k) => <path key={k} d={`M${q} 0 Q ${q * 1.1} -100 ${q * 0.2} -136`} fill="none" stroke="#6e5238" strokeWidth={6} />)}
    <path d="M-24 0 Q -24 -60 0 -62 Q 24 -60 24 0 Z" fill="#3a2a1e" />
    <circle cx={0} cy={-30} r={30} fill="#ffcf5a" opacity={0.12} />
  </g>
);
// as fileiras da plantação
const Field: React.FC<{ x: number; y: number; w: number; rows: number; f: number }> = ({ x, y, w, rows, f }) => (
  <g>
    <polygon points={pts([[x, y], [x + w, y], [x + w + 40, y + rows * 34], [x - 40, y + rows * 34]])} fill="#6b5a3a" />
    {Array.from({ length: rows }).map((_, r) => (
      <g key={r}>
        <rect x={x - r * 6} y={y + r * 34 + 8} width={w + r * 12} height={14} rx={7} fill="#4a3a26" />
        {Array.from({ length: Math.floor(w / 46) }).map((_, q) => {
          const px = x - r * 6 + 20 + q * 46, py = y + r * 34 + 12, sw = Math.sin(f / 30 + q + r) * 3;
          return (
            <g key={q}>
              <ellipse cx={px - 8 + sw} cy={py - 8} rx={10} ry={5} fill="#7fbf6a" transform={`rotate(-30 ${px - 8} ${py - 8})`} />
              <ellipse cx={px + 8 + sw} cy={py - 10} rx={10} ry={5} fill="#9ad46a" transform={`rotate(30 ${px + 8} ${py - 10})`} />
              {(q + r) % 3 === 0 ? <circle cx={px + sw} cy={py - 18} r={5} fill="#ffcf5a" /> : null}
            </g>
          );
        })}
      </g>
    ))}
  </g>
);
// a névoa no horizonte: abre (k) mostrando uma luz sem forma
const Mist: React.FC<{ k: number; f: number }> = ({ k, f }) => (
  <g>
    <ellipse cx={3400} cy={HZ - 30} rx={60 + 460 * k} ry={30 + 120 * k} fill="#fff4dc" opacity={0.5 * k} />
    <ellipse cx={3400} cy={HZ - 30} rx={20 + 180 * k} ry={10 + 60 * k} fill="#ffffff" opacity={0.6 * k} />
    {Array.from({ length: 22 }).map((_, i) => {
      const side = i % 2 ? 1 : -1, base = 3400 + side * (30 + (i >> 1) * 55);
      const x = base + side * k * (300 + (i >> 1) * 30) + Math.sin(f / 50 + i) * 12;
      const y = HZ - 10 - rnd(i * 3) * 60, r = 110 + rnd(i * 5) * 90;
      return <ellipse key={i} cx={x} cy={y} rx={r} ry={r * 0.28} fill={i % 3 ? "#e6e8f0" : "#d4d8e6"} opacity={0.8} />;
    })}
  </g>
);

const World: React.FC<{ f: number; mist: number }> = ({ f, mist }) => (
  <g>
    <polygon points={hill(HZ - 10, 90, 1)} fill="#8a8fb8" />
    <Mist k={mist} f={f} />
    <polygon points={hill(HZ + 20, 70, 2)} fill="#6f8aa0" />
    <polygon points={hill(HZ + 70, 60, 3)} fill="#5f8a88" />
    <polygon points={hill(HZ + 130, 40, 4)} fill="#8c9a72" />
    <rect x={-1400} y={HZ + 150} width={6600} height={1600} fill="#c2b077" />
    {Array.from({ length: 60 }).map((_, i) => <ellipse key={i} cx={-800 + rnd(i * 9) * 5400} cy={HZ + 190 + rnd(i * 4) * 700} rx={30 + rnd(i) * 50} ry={6} fill="#ad9b62" />)}
  </g>
);

// ---------------------------------------------------------------------------------------------- a cena
export const HL14VortWorldFlat: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [noAt, workAt, nobodyAt, foodAt, playAt, oldAt, sitAt, mistAt, nobodySawAt, vortAt, diffAt, f1At, f2At, darkAt, notGmanAt, noStasisAt, futureAt] = ["noAt", "workAt", "nobodyAt", "foodAt", "playAt", "oldAt", "sitAt", "mistAt", "nobodySawAt", "vortAt", "diffAt", "f1At", "f2At", "darkAt", "notGmanAt", "noStasisAt", "futureAt"].map((k) => at(p, k));
  const RX = 2900, RY = 960; // a pedra onde o velho está sentado
  const cam = camAt(f, [
    [0, 620, 880, 1.7],
    [noAt - 10, 640, 880, 1.55],
    [noAt + 50, 1400, 640, 0.55],
    [workAt - 10, 1400, 660, 0.58],
    [workAt + 30, 1500, 860, 1.1],
    [nobodyAt + 20, 1380, 880, 1.1],
    [foodAt - 10, 1080, 900, 1.35],
    [foodAt + 20, 1080, 880, 1.7],
    [playAt + 10, 1300, 860, 1.15],
    [oldAt - 10, 1450, 840, 1.0],
    [oldAt + 50, RX - 60, 840, 1.3],
    [sitAt - 5, RX - 70, 840, 1.3],
    [mistAt + 40, 3100, 700, 0.75],
    [vortAt - 5, 3090, 700, 0.75],
    [vortAt + 25, RX - 60, 840, 1.9],
    [diffAt - 10, RX - 60, 845, 1.85],
    [diffAt + 50, 3050, 720, 0.85],
    [life, 3100, 700, 0.75],
  ] as K[]);
  const [, cx, cy, z] = cam;
  // Gordon: acorda e fica de pé olhando; anda pela vila; depois vai até a pedra e senta
  const walk1 = f < foodAt + 70 ? 0.6 * eo(cl((f - noAt - 20) / (foodAt - 10 - noAt - 20))) : 0.6 + 0.4 * eo(cl((f - foodAt - 70) / (playAt + 60 - foodAt - 70)));
  const walk2 = eo(cl((f - oldAt - 40) / (sitAt - oldAt - 40)));
  const inVillage = f < oldAt + 40;
  const gx = inVillage ? 620 + walk1 * 640 : RX - 330 + walk2 * 230, gy = inVillage ? 1060 - walk1 * 40 : 1060 - walk2 * 60;
  const gWalk = inVillage ? (walk1 > 0 && walk1 < 1 && Math.abs(walk1 - 0.6) > 0.001 ? 1 : 0) : walk2 > 0 && walk2 < 1 ? 1 : 0;
  const rise = eo(cl(f / 40));
  const sitK = P(f, sitAt, 18);
  const mist = eo(cl((f - mistAt) / 200));
  const turn = f >= vortAt ? 1 : 0;
  const dark = interpolate(f, [darkAt, notGmanAt + 30], [0, 0.72], C);
  // a vila: quem trabalha, quem conversa, quem carrega
  const vorts: { x: number; y: number; s: number; d: number; pose: Pose; v: number; old?: boolean }[] = [
    { x: 1500, y: 960, s: 1.0, d: 1, pose: "work", v: 0 },
    { x: 1640, y: 990, s: 1.05, d: -1, pose: "work", v: 0 },
    { x: 1830, y: 940, s: 0.92, d: 1, pose: "talk", v: 0 },
    { x: 1930, y: 945, s: 0.92, d: -1, pose: "stand", v: 0 },
    { x: 980, y: 900, s: 0.8, d: 1, pose: "carry", v: 0.7 },
    { x: 2200, y: 905, s: 0.82, d: -1, pose: "walk", v: -0.6 },
    { x: 2350, y: 880, s: 0.7, d: 1, pose: "work", v: 0 },
  ];
  // o que oferece comida: passa da direita para a esquerda, para na frente do Gordon e segue
  const fx = (() => {
    const t0 = foodAt - 120, t1 = foodAt, t2 = foodAt + 70;
    if (f < t1) return 1560 - 400 * eo(cl((f - t0) / (t1 - t0)));
    if (f < t2) return 1160;
    return 1160 + (f - t2) * 1.8;
  })();
  const fPose: Pose = f >= foodAt && f < foodAt + 70 ? "offer" : "walk";
  const fD = f >= foodAt + 70 ? 1 : -1;
  const W = (x: number, y: number) => [960 + (x - cx) * z, 540 + (y - cy) * z] as const;
  const lab = (a: number, b: number) => P(f, a + 12, 12) * (1 - P(f, b - 8, 8));
  const pr = 0.3;
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#2e3466" }}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        <defs>
          <InkFilter />
        </defs>
        <g transform={`translate(960 540) scale(${1 + (z - 1) * pr}) translate(${-(1800 + (cx - 1800) * pr)} ${-(520 + (cy - 700) * pr)})`}>
          <SkyV f={f} />
        </g>
        <g transform={`translate(960 540) scale(${z}) translate(${-cx} ${-cy})`}>
          <World f={f} mist={mist} />
          <Hut x={1150} y={830} s={0.7} />
          <Hut x={2050} y={815} s={0.6} />
          <Hut x={2500} y={835} s={0.75} />
          <Field x={1380} y={900} w={680} rows={4} f={f} />
          {[300, 420, 860, 2240, 2620, 3500, 3700].map((x, i) => <Plant key={i} x={x} y={HZ + 260 + (i % 3) * 30} h={90 + (i % 2) * 50} i={i} f={f} />)}
          {vorts.map((v, i) => (
            <Vort key={i} x={v.x + v.v * f} y={v.y} s={v.s * 1.2} d={v.d} pose={v.pose} ph={f * 0.18 + i} f={f + i * 13} />
          ))}
          {/* a pedra do velho, na beira do vale */}
          <polygon points={pts([[RX - 230, RY + 10], [RX - 200, RY - 50], [RX - 40, RY - 70], [RX + 120, RY - 46], [RX + 160, RY + 10]])} fill="#7a7466" />
          <polygon points={pts([[RX - 200, RY - 50], [RX - 40, RY - 70], [RX + 120, RY - 46], [RX + 20, RY - 40]])} fill="#968f80" />
          <OldVortBack x={RX + 30} y={RY - 52} s={1.1} turn={turn} f={f} />
          {!inVillage && sitK > 0 ? <GordonSitBack x={RX - 110} y={RY - 52} s={1.1} k={sitK} /> : null}
          {f < foodAt + 260 ? <Vort x={fx} y={1070} s={1.25} d={fD} pose={fPose} ph={f * 0.2} f={f} off={P(f, foodAt, 14)} /> : null}
          {inVillage || sitK <= 0 ? (
            <g opacity={inVillage ? 1 : 1}>
              <GordonBack x={gx} y={gy} s={inVillage ? 1.15 : 1.1} ph={f * 0.2} amp={gWalk} />
            </g>
          ) : null}
          {/* acordando: a luz verde que o trouxe ainda se apagando */}
          {f < 50 ? <ellipse cx={620} cy={960} rx={220} ry={260} fill="#7dffb4" opacity={0.5 * (1 - f / 50)} /> : null}
        </g>
        {f < 40 ? <rect x={0} y={0} width={1920} height={1080} fill="#e6fff0" opacity={1 - rise} /> : null}
        <rect x={0} y={0} width={1920} height={1080} fill="#05060c" opacity={dark} />
      </svg>
      <Label x={960} y={130} text="SEM RUÍNAS · SEM COMBINE · SEM BOREALIS" col="#fff1d6" o={lab(noAt, workAt)} align="center" />
      <Label x={960} y={130} text="LIVRES: CAMINHANDO, CULTIVANDO, CONVERSANDO" col="#fff1d6" o={lab(workAt, nobodyAt)} align="center" />
      <Label x={960} y={130} text="NINGUÉM COMEMORA" sub="NINGUÉM EXPLICA POR QUE O SALVOU" col="#fff1d6" o={lab(nobodyAt, foodAt)} align="center" />
      <Label x={W(1080, 800)[0]} y={W(1080, 800)[1] - 160} text="UM OFERECE COMIDA" sub="E SEGUE ANDANDO" col="#ffd98a" o={lab(foodAt, playAt)} align="center" />
      <Label x={960} y={130} text="O FINAL AINDA É JOGÁVEL" col="#fff1d6" o={lab(playAt, oldAt)} align="center" />
      <Label x={960} y={130} text="O VORTIGAUNT VELHO" sub="OLHANDO PARA O CÉU" col="#fff1d6" o={lab(oldAt + 40, sitAt)} align="center" />
      <Label x={960} y={130} text="LÁ LONGE, A NÉVOA COMEÇA A ABRIR" col="#ffffff" o={lab(mistAt + 10, nobodySawAt)} align="center" />
      <Label x={960} y={130} text="NINGUÉM VIU O QUE VEM DEPOIS" col="#ffffff" o={lab(nobodySawAt, vortAt)} align="center" />
      <Label x={960} y={130} text="“NÃO SEI SE FOI UMA VITÓRIA.”" sub="NEM SE FOI A ESCOLHA CERTA" col="#ffd9c8" o={lab(vortAt + 10, diffAt)} align="center" />
      <Label x={960} y={130} text="A DIFERENÇA ENTRE OS DOIS FINAIS" col="#fff1d6" o={lab(diffAt, f1At)} align="center" />
      <Label x={960} y={130} text="FINAL 1 · SALVA A TERRA" sub="E RECEBE A CERTEZA DE QUE ESCOLHEU ERRADO" col="#ffd9a0" o={lab(f1At, f2At)} align="center" />
      <Label x={960} y={130} text="FINAL 2 · PERDE A TERRA" sub="E NUNCA SABE SE ESCOLHEU CERTO" col="#cfe3ff" o={lab(f2At, darkAt)} align="center" />
      <Label x={960} y={500} text="NÃO É O G-MAN QUE VEM BUSCAR" col="#e6dcff" o={lab(notGmanAt, noStasisAt)} align="center" />
      <Label x={960} y={500} text="SEM ÊXTASE · SEM PRÓXIMA MISSÃO" col="#e6dcff" o={lab(noStasisAt, futureAt)} align="center" />
      <Label x={960} y={500} text="UM FUTURO QUE NINGUÉM PREVIU" col="#ffffff" o={P(f, futureAt + 6, 14)} align="center" />
      <AbsoluteFill style={{ background: "#000", opacity: interpolate(f, [life - 8, life], [0, 1], C), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};
