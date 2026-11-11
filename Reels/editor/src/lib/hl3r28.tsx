// =================================================================================================
// HL3 · Final 2 no gelo, em ILUSTRAÇÃO CHAPADA (31/10/2026). Ele aprovou o Ártico 2D (hl3r27) e pediu o mesmo estilo em
// todas as cenas do gelo. Aqui: o Varga sozinho na neve (1:46:00) e o G-Man que falha (1:47:55), que agora acontece NO
// GELO ("o Gordon tá no gelo, não dentro do Borealis"). Personagens desenhados no mesmo traço; o Gordon sempre de costas.
// =================================================================================================
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { MONO } from "./overlays";
import { C } from "./hl3";
import { FilmLook } from "./hl3r";
import { rnd, cl, io, eo, P, pts, footprint, aboveFront, Hole, Crack, SlabBody, XenRock, World, Sky, Ship, SHIP_X, SHIP_Y, camAt, Label, K, Pt, VIO } from "./hl3r27";
import { InkFilter, GordonBack } from "./hl3chars";
export { GordonBack };

type PR = Record<string, number> & { life: number };
const at = (p: PR, k: string) => Math.round((p[k] as number | undefined) ?? 1e6);

// ---------------------------------------------------------------------------------------------- personagens
// Varga sentado num bloco de gelo, de perfil para a direita, olhando para cima: gorro, barba grisalha, jaqueta militar com
// braçadeira, a pasta com os arquivos da Mossman na mão
export const VargaSit: React.FC<{ x: number; y: number; s: number; f: number; look: number }> = ({ x, y, s, f, look }) => {
  const OL = "#556042", OLD = "#3f4832", PANT = "#4a4d3a", SKIN = "#c99a7a", BEARD = "#bdb7ae";
  const br = Math.sin(f / 22) * 1.5;
  const tilt = -10 - 16 * look;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} filter="url(#ink)">
      {/* o bloco onde ele senta */}
      <ellipse cx={20} cy={74} rx={90} ry={12} fill="#5d7a90" opacity={0.45} />
      <polygon points={pts([[-50, 72], [-56, 6], [70, 0], [80, 72]])} fill="#86b8d6" />
      <polygon points={pts([[-56, 6], [70, 0], [62, -10], [-44, -8]])} fill="#eef6fb" />
      <polygon points={pts([[40, 72], [44, 2], [70, 0], [80, 72]])} fill="#6795b7" />
      {/* pernas */}
      <polyline points={pts([[0, -6], [62, -12], [70, 58]])} fill="none" stroke={PANT} strokeWidth={26} strokeLinejoin="round" strokeLinecap="round" />
      <polyline points={pts([[0, -2], [58, -4]])} stroke="#3a3c2e" strokeWidth={6} />
      <polygon points={pts([[56, 50], [96, 54], [98, 72], [56, 72]])} fill="#2e241c" />
      {/* tronco */}
      <g transform={`translate(0 ${br})`}>
        <polygon points={pts([[-22, 4], [30, 0], [36, -104], [-14, -112]])} fill={OL} />
        <polygon points={pts([[-22, 4], [-4, 2], [4, -110], [-14, -112]])} fill={OLD} />
        <rect x={10} y={-80} width={18} height={14} fill={OLD} />
        <rect x={10} y={-44} width={18} height={14} fill={OLD} />
        <polygon points={pts([[-12, -112], [36, -106], [30, -96], [-8, -100]])} fill="#6b7652" />
        {/* braço com a braçadeira e a pasta */}
        <polyline points={pts([[20, -96], [40, -50], [78, -60]])} fill="none" stroke={OL} strokeWidth={22} strokeLinejoin="round" strokeLinecap="round" />
        <polygon points={pts([[14, -84], [34, -90], [38, -78], [18, -72]])} fill="#c9452f" />
        <g transform={`rotate(${-18 + Math.sin(f / 30) * 2} 86 -64)`}>
          <rect x={64} y={-92} width={56} height={40} fill="#d8b871" />
          <rect x={68} y={-98} width={46} height={8} fill="#f2efe6" />
          <rect x={72} y={-102} width={40} height={6} fill="#e6e2d6" />
          <rect x={68} y={-80} width={30} height={4} fill="#a8894a" />
          <text x={70} y={-60} fontFamily={MONO} fontSize={8} letterSpacing={1} fill="#6b5428">MOSSMAN</text>
        </g>
        <circle cx={80} cy={-60} r={9} fill={SKIN} />
        {/* cabeça inclinada para trás, olhando o céu */}
        <g transform={`rotate(${tilt} 14 -118)`}>
          <rect x={6} y={-128} width={16} height={18} fill={SKIN} />
          <ellipse cx={18} cy={-146} rx={22} ry={25} fill={SKIN} />
          <path d={`M10 -140 q 18 34 34 6 q 6 -10 2 -14 l -8 2 q -8 -4 -14 6 z`} fill={BEARD} />
          <polygon points={pts([[38, -150], [48, -140], [38, -138]])} fill="#b78868" />
          <path d="M26 -156 q 7 -3 12 0" fill="none" stroke="#3a2a20" strokeWidth={3} strokeLinecap="round" />
          <path d="M-6 -150 q 2 -32 26 -32 q 22 0 26 18 l -4 6 q -24 -8 -48 8 z" fill="#3a3a3e" />
          <rect x={-8} y={-158} width={52} height={9} rx={3} fill="#2e2e32" transform="rotate(8 18 -154)" />
        </g>
      </g>
      {/* o hálito no frio */}
      {[0, 1].map((k) => {
        const t = ((f / 30 + k * 1.2) % 2.4) / 2.4;
        return <ellipse key={k} cx={56 + t * 40} cy={-160 - t * 40 - look * 20} rx={6 + t * 16} ry={4 + t * 10} fill="#f4f9fc" opacity={0.5 * (1 - t)} />;
      })}
    </g>
  );
};

// G-Man de frente: terno azul-acinzentado, camisa branca, gravata escura, a maleta na mão esquerda; `tie` ajeita a gravata.
// `solid` desenha a silhueta inteira numa cor só (para as cópias da falha)
export const GMan: React.FC<{ x: number; y: number; s: number; tie: number; solid?: string; op?: number }> = ({ x, y, s, tie, solid, op = 1 }) => {
  const c = (v: string) => solid ?? v;
  const SU = "#3e4a5c", SUD = "#2c3544", SK = "#cdbfa6";
  const hx = -6 + tie * 4, hy = -168 - tie * 14;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={op} filter={solid ? undefined : "url(#ink)"}>
      {!solid ? <ellipse cx={0} cy={2} rx={40} ry={8} fill="#5d7a90" opacity={0.45} /> : null}
      <ellipse cx={-12} cy={-3} rx={13} ry={5} fill={c("#111")} />
      <ellipse cx={12} cy={-3} rx={13} ry={5} fill={c("#111")} />
      <polygon points={pts([[-22, -112], [-1, -112], [-4, -4], [-20, -4]])} fill={c(SU)} />
      <polygon points={pts([[1, -112], [22, -112], [20, -4], [4, -4]])} fill={c(SUD)} />
      {/* paletó */}
      <polygon points={pts([[-30, -100], [30, -100], [36, -196], [-36, -196]])} fill={c(SU)} />
      <polygon points={pts([[6, -100], [30, -100], [36, -196], [12, -196]])} fill={c(SUD)} />
      <polygon points={pts([[-12, -196], [12, -196], [4, -130], [-4, -130]])} fill={c("#e8ecef")} />
      <polygon points={pts([[-3, -190], [3, -190], [5, -140], [0, -132], [-5, -140]])} fill={c("#262b36")} />
      <polygon points={pts([[-12, -196], [-2, -150], [-18, -170]])} fill={c("#4a5870")} />
      <polygon points={pts([[12, -196], [2, -150], [18, -170]])} fill={c("#25303d")} />
      <circle cx={0} cy={-120} r={2.5} fill={c("#1a1f28")} />
      {/* braço esquerdo com a maleta */}
      <polyline points={pts([[-34, -190], [-44, -140], [-42, -100]])} fill="none" stroke={c(SU)} strokeWidth={16} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={-42} cy={-96} r={6} fill={c(SK)} />
      <rect x={-64} y={-92} width={44} height={34} rx={3} fill={c("#2a211a")} />
      <rect x={-50} y={-98} width={16} height={7} rx={3} fill="none" stroke={c("#2a211a")} strokeWidth={3} />
      <rect x={-60} y={-84} width={4} height={6} fill={c("#b8a070")} />
      <rect x={-28} y={-84} width={4} height={6} fill={c("#b8a070")} />
      {/* braço direito: ajeita a gravata */}
      <polyline points={pts([[34, -190], [42 - tie * 20, -146 - tie * 6], [hx + 10, hy + 6]])} fill="none" stroke={c(SUD)} strokeWidth={16} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={hx + 8} cy={hy + 4} r={6} fill={c(SK)} />
      {/* cabeça */}
      <rect x={-7} y={-206} width={14} height={12} fill={c(SK)} />
      <ellipse cx={0} cy={-226} rx={16} ry={21} fill={c(SK)} />
      <path d="M-17 -230 q 0 -22 17 -22 q 18 0 17 18 q -10 -10 -22 -8 q -8 2 -12 12 z" fill={c("#3b2b20")} />
      <ellipse cx={-6} cy={-226} rx={4} ry={3} fill={c("#5a4a3a")} />
      <ellipse cx={6} cy={-226} rx={4} ry={3} fill={c("#5a4a3a")} />
      <circle cx={-6} cy={-226} r={1.5} fill={c("#111")} />
      <circle cx={6} cy={-226} r={1.5} fill={c("#111")} />
      <rect x={-10} y={-232} width={8} height={2} fill={c("#3b2b20")} />
      <rect x={2} y={-232} width={8} height={2} fill={c("#3b2b20")} />
      <rect x={-5} y={-213} width={10} height={2} fill={c("#8a6a5a")} />
      <polygon points={pts([[-16, -222], [-12, -206], [-6, -205]])} fill={c("#b0a28a")} opacity={0.6} />
    </g>
  );
};

// ---------------------------------------------------------------------------------------------- cenário
// pedaços de gelo e de Xen subindo no céu (ao fundo, com paralaxe); t = tempo (congela junto com o G-Man)
const FLOAT = Array.from({ length: 9 }).map((_, i) => ({ x: -200 + i * 420 + rnd(i * 3) * 160, y: 260 + rnd(i * 5) * 260, rx: 40 + rnd(i * 7) * 50, xen: i % 3 === 1, v: 0.25 + rnd(i * 11) * 0.35 }));
export const Floaters: React.FC<{ t: number }> = ({ t }) => (
  <g>
    {FLOAT.map((q, i) => {
      const y = q.y - t * q.v, F = footprint(q.x, 0, q.rx, 300 + i * 7, 0.12);
      const rot = Math.sin(t / 60 + i) * 6;
      return (
        <g key={i} transform={`translate(0 ${y}) rotate(${rot} ${q.x} 0)`} opacity={0.9}>
          {q.xen ? <XenRock r={{ x: q.x, y: 0, rx: q.rx, D: q.rx * 1.4, t: 0, F, H: F }} i={i} f={t} out /> : <SlabBody F={F} h={q.rx * 0.35} seed={i} dirt />}
        </g>
      );
    })}
  </g>
);
// o céu se desfazendo: estilhaços escuros com borda violeta
const SHARDS = Array.from({ length: 12 }).map((_, i) => {
  const cx = 200 + i * 300 + rnd(i) * 120, cy = -200 + rnd(i * 3) * 380, r = 70 + rnd(i * 5) * 90;
  return Array.from({ length: 5 }).map((_, k) => [cx + Math.cos(k * 1.25 + i) * r * (0.6 + 0.6 * rnd(i * 9 + k)), cy + Math.sin(k * 1.25 + i) * r * (0.6 + 0.6 * rnd(i * 13 + k))] as Pt);
});
export const SkyTear: React.FC<{ k: number; t: number }> = ({ k, t }) =>
  k <= 0 ? null : (
    <g>
      {SHARDS.map((ps, i) => {
        const o = cl(k * 12 / 6 - i * 0.12);
        if (o <= 0) return null;
        const cx = ps.reduce((a, p) => a + p[0], 0) / 5, cy = ps.reduce((a, p) => a + p[1], 0) / 5;
        return (
          <g key={i} opacity={o} transform={`translate(0 ${-t * 0.08 * (1 + rnd(i))}) rotate(${Math.sin(t / 40 + i) * 4} ${cx} ${cy})`}>
            <polygon points={pts(ps)} fill="#07040f" />
            {[0, 1, 2, 3].map((q) => <circle key={q} cx={cx + (rnd(i * 7 + q) - 0.5) * 80} cy={cy + (rnd(i * 5 + q) - 0.5) * 60} r={1.5 + rnd(q + i)} fill="#d8c8ff" />)}
            <polygon points={pts(ps)} fill="none" stroke={VIO} strokeWidth={5} strokeLinejoin="round" opacity={0.85} />
          </g>
        );
      })}
    </g>
  );
export const Snowfall: React.FC<{ t: number; cx: number; z: number; n?: number }> = ({ t, cx, z, n = 160 }) => (
  <g>
    {Array.from({ length: n }).map((_, i) => {
      const sp = 0.6 + rnd(i * 3) * 1.4;
      const x = ((rnd(i * 7) * 2100 + t * (1.4 + sp) - cx * z * 0.2) % 2100 + 2100) % 2100 - 90;
      const y = ((rnd(i * 11) * 1200 + t * sp * 2.2) % 1200) - 60;
      return <circle key={i} cx={x} cy={y} r={1 + sp * 1.4} fill="#f2f8ff" opacity={0.35 + 0.4 * rnd(i)} />;
    })}
  </g>
);
export const Defs: React.FC = () => (
  <defs>
    <InkFilter />
    <linearGradient id="arcSky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#081221" />
      <stop offset="0.6" stopColor="#13243a" />
      <stop offset="1" stopColor="#2a4560" />
    </linearGradient>
    <linearGradient id="arcGround" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#9fb9cc" />
      <stop offset="0.12" stopColor="#c6d9e6" />
      <stop offset="0.5" stopColor="#dfeaf2" />
      <stop offset="1" stopColor="#e9f2f8" />
    </linearGradient>
  </defs>
);
// ---- o chão sendo arrancado: placas de gelo sobem dos próprios buracos (mesmo contorno), as crateras ficam
export type Rip = { x: number; y: number; rx: number; h: number; t0: number; seed: number; earth: boolean };
export const makeRips = (seed: number, n: number, t1: number, box: [number, number, number, number], avoid: [number, number, number][]): Rip[] => {
  const out: Rip[] = [];
  for (let i = 0; out.length < n && i < n * 30; i++) {
    const x = box[0] + rnd(seed * 101 + i * 7) * (box[1] - box[0]), y = box[2] + rnd(seed * 37 + i * 13) * (box[3] - box[2]);
    const rx = 50 + ((y - 700) / 650) * 110 * (0.7 + 0.6 * rnd(i * 3 + seed));
    if (avoid.some(([ax, ay, ar]) => Math.hypot((x - ax) / 1.6, y - ay) < ar + rx * 0.4)) continue;
    if (out.some((o) => Math.hypot((x - o.x) / 2, y - o.y) < (rx + o.rx) * 0.4)) continue;
    out.push({ x, y, rx, h: rx * 0.42, t0: -320 + (out.length / n) * (t1 + 320) + rnd(i) * 60, seed: seed * 50 + i, earth: rnd(i * 17 + seed) > 0.55 });
  }
  return out.sort((a, b) => a.y - b.y);
};
const RipSlab: React.FC<{ r: Rip; t: number }> = ({ r, t }) => {
  const u = t - r.t0;
  if (u < -60) return null;
  const F = footprint(r.x, r.y, r.rx, r.seed, 0.13);
  const Lft = u <= 0 ? 0 : r.h * 3 * io(cl(u / 90)) + Math.max(0, u - 90) * 2.2;
  const crackK = cl((u + 60) / 45) * (1 - cl((u - 4) / 20));
  const inHole = Lft < r.h * 1.5 + 6;
  const rot = cl((Lft - r.h - 20) / 80) * (rnd(r.seed) - 0.5) * 14;
  const id = "rip" + r.seed;
  return (
    <g>
      {Lft > 0.5 ? <Hole id={"h" + id} F={F} depth={r.h * 1.7} earth={r.earth} glow={r.earth ? 1 : 0} /> : null}
      {Lft < 1600 ? (
        <>
          <defs>
            <clipPath id={"c" + id}>
              <polygon points={pts(aboveFront(F))} />
            </clipPath>
          </defs>
          <g clipPath={inHole ? `url(#c${id})` : undefined} opacity={1 - cl((Lft - 1100) / 500)}>
            <g transform={`translate(0 ${-Lft}) rotate(${rot} ${r.x} ${r.y})`}>
              <SlabBody F={F} h={r.h} seed={r.seed} dirt={r.earth} />
            </g>
          </g>
        </>
      ) : null}
      <Crack F={F} k={crackK} f={t} seed={r.seed} />
    </g>
  );
};
export const Ruin: React.FC<{ rips: Rip[]; t: number }> = ({ rips, t }) => (
  <g>
    {rips.map((r) => (
      <RipSlab key={r.seed} r={r} t={t} />
    ))}
  </g>
);
// o navio partido ao meio: as duas metades tombam, a ferida violeta no meio, fumaça subindo
const SPLIT = SHIP_X + 430;
const BrokenShip: React.FC<{ f: number; t: number }> = ({ f, t }) => (
  <g>
    <defs>
      <clipPath id="shipL">
        <rect x={SHIP_X - 400} y={SHIP_Y - 900} width={SPLIT - SHIP_X + 400} height={1000} />
      </clipPath>
      <clipPath id="shipR">
        <rect x={SPLIT} y={SHIP_Y - 900} width={1200} height={1000} />
      </clipPath>
    </defs>
    <ellipse cx={SPLIT} cy={SHIP_Y - 60} rx={170 + 20 * Math.sin(t / 5)} ry={150} fill={VIO} opacity={0.28} />
    <g clipPath="url(#shipL)">
      <g transform={`rotate(-6 ${SPLIT} ${SHIP_Y}) translate(-14 18)`}>
        <Ship f={f} phase={1} />
      </g>
    </g>
    <g clipPath="url(#shipR)">
      <g transform={`rotate(9 ${SPLIT} ${SHIP_Y}) translate(26 40)`}>
        <Ship f={f} phase={1} />
      </g>
    </g>
    {/* as bordas rasgadas do casco */}
    <polygon points={pts([[SPLIT - 18, SHIP_Y - 120], [SPLIT + 6, SHIP_Y - 80], [SPLIT - 10, SHIP_Y - 40], [SPLIT + 10, SHIP_Y + 10], [SPLIT - 20, SHIP_Y + 16]])} fill="#1a1f26" />
    <polygon points={pts([[SPLIT + 30, SHIP_Y - 90], [SPLIT + 50, SHIP_Y - 50], [SPLIT + 34, SHIP_Y - 10], [SPLIT + 56, SHIP_Y + 40], [SPLIT + 24, SHIP_Y + 40]])} fill="#1a1f26" />
    {/* gelo empurrado contra as metades */}
    {Array.from({ length: 9 }).map((_, i) => {
      const x = SHIP_X - 20 + i * 110, hh = 18 + rnd(i * 5) * 40;
      return <polygon key={i} points={pts([[x - 40, SHIP_Y + 30], [x - 10, SHIP_Y + 4 - hh], [x + 22, SHIP_Y + 10 - hh * 0.5], [x + 46, SHIP_Y + 30]])} fill={i % 2 ? "#eef6fb" : "#bcd6e6"} />;
    })}
    {/* fumaça e fogo */}
    {Array.from({ length: 16 }).map((_, i) => {
      const per = 160, u = ((((t + i * (per / 16)) % per) + per) % per) / per;
      const x0 = SPLIT + (rnd(i) - 0.5) * 120 + (i % 3 === 0 ? -260 : 0);
      const x = x0 + u * 90 + Math.sin(u * 6 + i) * 20, y = SHIP_Y - 120 - u * 520, r = 34 + u * 90;
      return <ellipse key={i} cx={x} cy={y} rx={r} ry={r * 0.75} fill={i % 2 ? "#2a2e36" : "#3a3f48"} opacity={0.75 * (1 - u)} />;
    })}
    {[0, 1, 2].map((i) => (
      <ellipse key={"fire" + i} cx={SPLIT - 20 + i * 30} cy={SHIP_Y - 110 - i * 8} rx={18 + 6 * Math.sin(f / 3 + i)} ry={26 + 8 * Math.sin(f / 4 + i)} fill={i === 1 ? "#ffd27a" : "#e8742c"} opacity={0.85} />
    ))}
  </g>
);

// o mundo inteiro numa câmera (céu e coisas no ar com paralaxe)
export const Stage: React.FC<{ f: number; t: number; cx: number; cy: number; z: number; tear?: number; ship?: number; rips?: Rip[]; rt?: number; children?: React.ReactNode }> = ({ f, t, cx, cy, z, tear = 0, ship = 0, rips, rt = 0, children }) => (
  <>
    <g transform={`translate(960 540) scale(${1 + (z - 1) * 0.3}) translate(${-(1800 + (cx - 1800) * 0.3)} ${-(560 + (cy - 700) * 0.3)})`}>
      <Sky f={t} />
      <SkyTear k={tear} t={t} />
    </g>
    <g transform={`translate(960 540) scale(${1 + (z - 1) * 0.55}) translate(${-(1800 + (cx - 1800) * 0.55)} ${-(600 + (cy - 700) * 0.55)})`}>
      <Floaters t={t} />
    </g>
    <g transform={`translate(960 540) scale(${z}) translate(${-cx} ${-cy})`}>
      <World f={t} />
      {ship > 0 ? (
        <g opacity={ship}>
          <BrokenShip f={f} t={rt} />
        </g>
      ) : null}
      {rips ? <Ruin rips={rips} t={rt} /> : null}
      {children}
    </g>
  </>
);

// ---------------------------------------------------------------------------------------------- 1:46:00 o Varga
const RIPS_V = makeRips(3, 22, 600, [500, 2500, 760, 1360], [[1560, 1000, 260], [1080, 1180, 200], [1430, 1000, 180], [1780, 810, 150]]);
export const HL14VargaFlat: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [filesAt, skyAt, seeAt, loseAt, goAt] = ["filesAt", "skyAt", "seeAt", "loseAt", "goAt"].map((k) => at(p, k));
  const VX = 1560, VY = 1010;
  const cam = camAt(f, [
    [0, 1430, 900, 0.95],
    [filesAt - 8, 1470, 910, 1.0],
    [filesAt + 16, 1640, 930, 2.0],
    [skyAt - 10, 1650, 925, 2.05],
    [skyAt + 26, 1500, 420, 0.8],
    [seeAt - 8, 1520, 440, 0.82],
    [seeAt + 18, 1580, 880, 1.9],
    [goAt - 10, 1585, 885, 1.95],
    [goAt + 30, 1500, 820, 0.85],
    [life, 1480, 800, 0.8],
  ] as K[]);
  const [, cx, cy, z] = cam;
  const W = (x: number, y: number) => [960 + (x - cx) * z, 540 + (y - cy) * z] as const;
  // o Gordon chega por trás e depois segue em frente, sumindo para o horizonte
  const gt = f - goAt;
  const gk = eo(gt / 200);
  const gx = 1080 + gk * 700, gy = 1180 - gk * 370, gs = 1.25 - gk * 0.85;
  const walking = gt > 0 ? 1 : 0;
  // as folhas que o vento arranca da pasta
  const papers = Array.from({ length: 7 }).map((_, i) => {
    const t0 = filesAt + 10 + i * 22, tt = f - t0;
    if (tt < 0) return null;
    const x = VX + 100 + tt * (3 + rnd(i) * 2), y = VY - 90 - tt * (1.2 + rnd(i * 3)) + Math.sin(tt / 8 + i) * 18;
    return <rect key={i} x={x} y={y} width={22} height={28} fill="#f2efe6" transform={`rotate(${tt * (4 + i)} ${x + 11} ${y + 14})`} opacity={1 - cl((tt - 160) / 40)} />;
  });
  const look = P(f, skyAt - 20, 30);
  const sv = W(VX + 30, VY - 210), sf = W(VX + 120, VY - 120);
  const quote = "“CHEGUEI TÃO PERTO.”";
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#0d1b2e" }}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        <Defs />
        <Stage f={f} t={f + 760} cx={cx} cy={cy} z={z} tear={P(f, skyAt - 30, 90) * 0.6 + 0.4} ship={1} rips={RIPS_V} rt={f}>
          <VargaSit x={VX} y={VY} s={1.15} f={f} look={look} />
          {papers}
          <GordonBack x={gx} y={gy} s={gs} ph={gt > 0 ? gt * 0.2 : 0} amp={walking} />
        </Stage>
        <Snowfall t={f} cx={cx} z={z} />
      </svg>
      <Label x={sf[0]} y={sf[1] - 60} text="OS ARQUIVOS DA MOSSMAN" sub="NA MÃO, SEM TENTAR ESCAPAR" col="#ffd9a0" o={P(f, filesAt + 18, 12) * (1 - P(f, skyAt - 12, 8))} />
      <Label x={960} y={150} text="O CÉU SE DESFAZ" col="#d8c8ff" o={P(f, skyAt + 20, 12) * (1 - P(f, seeAt - 10, 8))} align="center" />
      <Label x={sv[0] + 40} y={sv[1] - 40} text={quote} sub="DE NUNCA MAIS PERDER NINGUÉM" col="#e6dcff" o={P(f, seeAt + 20, 12) * (1 - P(f, goAt - 8, 8))} />
      <Label x={960} y={930} text="NÃO PEDE AJUDA · O GORDON CONTINUA" col="#bfe8ff" o={P(f, goAt + 40, 12)} align="center" />
      <AbsoluteFill style={{ background: "#000", opacity: interpolate(f, [0, 8], [1, 0], C) + interpolate(f, [life - 6, life], [0, 1], C), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------- 1:47:55 o G-Man falha (no gelo)
const RIPS_G = makeRips(5, 26, 1500, [500, 2600, 760, 1380], [[1520, 990, 300], [1780, 990, 200], [1250, 1230, 220], [1460, 1010, 180], [1670, 790, 150]]);
export const HL14GlitchFlat: React.FC<PR & { lines?: string[] }> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [stopAt, gmanAt, l0At, l1At, cutAt, glitchAt, l2At, goneAt, lostAt] = ["stopAt", "gmanAt", "l0At", "l1At", "cutAt", "glitchAt", "l2At", "goneAt", "lostAt"].map((k) => at(p, k));
  const lines = p.lines ?? ["Sr. Freeman.", "Meus empregadores certamente irão considerar esta…", "Esta inesperada alteração nas condições requer…"];
  // o tempo congela no stopAt e volta quando ele some
  const t = f < stopAt ? f : f < goneAt ? stopAt : f - (goneAt - stopAt);
  const frz = f < stopAt ? 0 : f < goneAt ? P(f, stopAt, 10) : 1 - P(f, goneAt, 14);
  const GX = 1520, GY = 990;
  const cam = camAt(f, [
    [0, 1330, 860, 0.95],
    [stopAt, 1360, 870, 1.0],
    [gmanAt + 20, 1420, 900, 1.05],
    [l0At - 10, 1430, 900, 1.1],
    [l0At + 18, 1520, 860, 1.75],
    [glitchAt - 6, 1525, 860, 1.8],
    [glitchAt + 14, 1600, 880, 1.25],
    [goneAt + 4, 1600, 880, 1.25],
    [goneAt + 50, 1450, 780, 0.75],
    [life, 1450, 760, 0.7],
  ] as K[]);
  const [, cx, cy, z] = cam;
  const W = (x: number, y: number) => [960 + (x - cx) * z, 540 + (y - cy) * z] as const;
  // o Gordon correndo (congela junto), depois continua até o horizonte
  const run = f < stopAt ? f : f < goneAt ? stopAt : f - (goneAt - stopAt);
  const after = Math.max(0, f - goneAt - 20);
  const ak = eo(after / 300);
  const gx = 1250 + ak * 420, gy = 1230 - ak * 440, gs = 1.6 - ak * 1.2;
  const runAmp = f < stopAt ? 1.5 : f < goneAt ? 0 : cl((f - goneAt - 10) / 20) * 1.5;
  // a falha
  const shown = f >= gmanAt && f < goneAt;
  const gl = f >= glitchAt && f < goneAt ? 1 : 0;
  const hard = gl && rnd(Math.floor(f / 2) * 7.3) > 0.55;
  const tie = f >= gmanAt && f < l0At ? 0.5 + 0.5 * Math.sin((f - gmanAt) / 8) : 0;
  const bands = Array.from({ length: 7 });
  const gman = (dx: number, op: number) => (
    <g>
      {gl ? <GMan x={GX + dx - 7} y={GY} s={1.3} tie={tie} solid="#3ff0ff" op={0.45 * op} /> : null}
      {gl ? <GMan x={GX + dx + 7} y={GY} s={1.3} tie={tie} solid="#ff3a6a" op={0.45 * op} /> : null}
      {bands.map((_, k) => {
        const y0 = GY - 320 + k * 48;
        const off = gl ? (rnd(Math.floor(f / 2) * 13 + k) - 0.5) * (hard ? 70 : 18) : 0;
        return (
          <g key={k} clipPath={`url(#gb${k})`}>
            <defs>
              <clipPath id={"gb" + k}>
                <rect x={GX - 400} y={y0} width={800} height={48} />
              </clipPath>
            </defs>
            <g transform={`translate(${off + dx} 0)`}>
              <GMan x={GX} y={GY} s={1.3} tie={tie} op={op} />
            </g>
          </g>
        );
      })}
    </g>
  );
  // a cópia em outro lugar ("em dois lugares ao mesmo tempo")
  const twin = gl ? (Math.floor(f / 3) % 3 === 0 ? 1 : 0.55) * P(f, glitchAt + 6, 4) : 0;
  const mainOp = gl && Math.floor(f / 3) % 5 === 0 ? 0.35 : 1;
  // vai sumir: achata em uma linha
  const squash = f >= goneAt - 3 && f < goneAt ? (goneAt - f) / 3 : 1;
  const typed = (s: string, a: number, end: number) => (f < a || f >= end ? "" : s.slice(0, Math.max(0, Math.floor((f - a) * 1.1))));
  const sub = f < l1At ? typed(lines[0], l0At, l1At) : f < cutAt + 6 ? typed(lines[1], l1At, cutAt + 6) : typed(lines[2], l2At, goneAt);
  const lost = P(f, lostAt, 14);
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#0d1b2e" }}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0, filter: `saturate(${1 - 0.7 * frz}) brightness(${1 - 0.08 * frz})` }}>
        <Defs />
        <Stage f={t} t={t + 1300} cx={cx} cy={cy} z={z} tear={0.7} ship={1} rips={RIPS_G} rt={t}>
          {/* o lugar vazio onde ele estava */}
          {f >= goneAt ? <ellipse cx={GX} cy={GY + 2} rx={52} ry={10} fill="#5d7a90" opacity={0.4 * (1 - P(f, goneAt + 40, 60))} /> : null}
          {shown ? (
            <g transform={`translate(0 ${GY * (1 - squash)}) scale(1 ${squash})`}>
              {twin > 0 ? <g opacity={twin}>{gman(260, 0.85)}</g> : null}
              <g opacity={mainOp}>{gman(0, 1)}</g>
            </g>
          ) : null}
          {f >= goneAt && f < goneAt + 6 ? <rect x={GX - 120} y={GY - 160} width={240} height={4} fill="#fff" opacity={1 - (f - goneAt) / 6} /> : null}
          <GordonBack x={gx} y={gy} s={gs} ph={run * 0.3} amp={runAmp} />
        </Stage>
        <Snowfall t={t} cx={cx} z={z} />
        {/* o tempo parado: um anel frio que passa */}
        {f >= stopAt && f < stopAt + 20 ? <circle cx={960} cy={540} r={(f - stopAt) * 70} fill="none" stroke="#cfe3ff" strokeWidth={10} opacity={1 - (f - stopAt) / 20} /> : null}
        {gl && hard ? <rect x={0} y={(f * 37) % 1080} width={1920} height={6} fill="#cfe3ff" opacity={0.35} /> : null}
      </svg>
      {/* a fala dele, cortada onde ele para */}
      {sub ? (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 64, textAlign: "center", fontFamily: MONO, fontSize: 36, letterSpacing: 5, color: "#eef2ff", textShadow: "0 3px 14px rgba(0,0,0,0.95)" }}>
          {sub.toUpperCase()}
        </div>
      ) : null}
      <Label x={W(GX, GY - 360)[0]} y={W(GX, GY - 360)[1]} text="O TEMPO PARA" col="#cfe3ff" o={P(f, stopAt + 6, 10) * (1 - P(f, gmanAt + 30, 8))} align="center" />
      <Label x={960} y={140} text="EM DOIS LUGARES AO MESMO TEMPO" col="#ffb3c6" o={P(f, glitchAt + 40, 10) * (1 - P(f, l2At - 4, 8))} align="center" />
      <Label x={960} y={140} text="SOME NO MEIO DA FRASE" sub="SEM DESPEDIDA · SEM ÊXTASE" col="#e6dcff" o={P(f, goneAt + 30, 12) * (1 - P(f, lostAt - 10, 10))} align="center" />
      <Label x={960} y={140} text="ELES PERDERAM" sub="PELA PRIMEIRA VEZ, O G-MAN NÃO ENCERROU A HISTÓRIA" col="#e6dcff" o={lost} align="center" />
      <AbsoluteFill style={{ background: "#000", opacity: interpolate(f, [0, 8], [1, 0], C) + interpolate(f, [life - 6, life], [0, 1], C), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};
