// =================================================================================================
// HL3 · 1:45:35 → 1:46:00 o Ártico se desfaz, em ILUSTRAÇÃO CHAPADA 2D (31/10/2026). Pedido dele: abandonar o 3D ("essas
// coisas subindo meio redondas", "o fragmento de Xen feio", "lasca de gelo na frente da câmera"); dos dois rascunhos ele
// escolheu a ilustração chapada, "bem mais detalhada". Vista de lado, um mundo só (céu, aurora, montanhas, o navio preso no
// gelo) e a câmera passeia por ele seguindo a narração:
//   0      o gelo racha em volta do navio
//   iceAt  "pedaços enormes de gelo deixam o chão e sobem": placas grossas sobem e deixam o buraco do mesmo formato
//   xenAt  "fragmentos de Xen presos à Terra… arrancados": o chão estufa, racha em raio e a rocha sai com a tampa de gelo e
//          terra; fica a cratera (paredes de terra, resto verde, placas da borda tombadas)
//   creatAt antlions saem das tocas sem atacar; headcrabs fogem cada um pra um lado
//   combAt  os Combine que restam olham pra todo lado, sem alvo
//   fearAt  plano aberto: tudo olha pro navio. "TUDO COM MEDO DA MESMA COISA"
// Peças que sobem são desenhadas com o mesmo contorno do buraco e recortadas pela borda da frente do buraco enquanto estão
// dentro dele: nada atravessa o chão.
// =================================================================================================
import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { MONO } from "./overlays";
import { C } from "./hl3";
import { FilmLook } from "./hl3r";

type PR = Record<string, number> & { life: number };
export type Pt = [number, number];
const at = (p: PR, k: string) => Math.round((p[k] as number | undefined) ?? 1e6);
export const rnd = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
export const cl = (x: number) => Math.max(0, Math.min(1, x));
export const io = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const eo = (x: number) => 1 - Math.pow(1 - cl(x), 3);
export const P = (f: number, a: number, d = 12) => interpolate(f, [a, a + d], [0, 1], { ...C, easing: Easing.out(Easing.cubic) });
export const pts = (ps: Pt[]) => ps.map((p) => p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");
export const sh = (ps: Pt[], dx: number, dy: number): Pt[] => ps.map(([x, y]) => [x + dx, y + dy]);

// ---- paleta
export const ICE_TOP = "#eef6fb", ICE_HI = "#ffffff", ICE_SIDE = "#86b8d6", ICE_SIDE_D = "#6795b7", ICE_STRIPE = "#71a5c6", ICE_DEEP = "#1b3247";
const EARTH = "#5a4030", EARTH_D = "#3e2c22", EARTH_DD = "#251a15";
export const XEN_ROCK = "#4a3a5e", XEN_HI = "#64507e", XEN_DK = "#2e2340", XEN_G = "#47e08c", XEN_GL = "#b9ffd8", XEN_GD = "#1f9a5a";
export const VIO = "#c49cff";

// contorno irregular visto de lado (elipse achatada): pontos de a = 0 (direita) passando pela frente (baixo) até 2π
export const N = 16;
export const footprint = (cx: number, cy: number, rx: number, seed: number, jit = 0.13, sq = 0.3): Pt[] =>
  Array.from({ length: N }).map((_, k) => {
    const a = (k / N) * Math.PI * 2;
    const r = 1 + (rnd(seed * 7 + k) - 0.5) * 2 * jit;
    return [cx + Math.cos(a) * rx * r, cy + Math.sin(a) * rx * sq * r];
  });
export const frontOf = (F: Pt[]) => F.slice(0, N / 2 + 1); // direita → frente → esquerda
const backOf = (F: Pt[]) => [...F.slice(N / 2), F[0]]; // esquerda → fundo → direita
// tudo que está acima da borda da frente de um buraco (para recortar o que ainda está dentro dele)
export const aboveFront = (F: Pt[]): Pt[] => {
  const fr = frontOf(F);
  const r = fr[0], l = fr[fr.length - 1];
  return [...fr, [l[0] - 4000, l[1]], [l[0] - 4000, -6000], [r[0] + 4000, -6000], [r[0] + 4000, r[1]]];
};

// ---- o buraco que fica no gelo (fundo escuro, parede do fundo com estrias, borda de neve)
export const Hole: React.FC<{ id: string; F: Pt[]; depth: number; earth?: boolean; glow?: number }> = ({ id, F, depth, earth, glow = 0 }) => {
  const bk = backOf(F);
  const wall: Pt[] = [...bk, ...sh(bk, 0, depth).reverse()];
  const ice = Math.min(depth, 38);
  return (
    <g>
      <defs>
        <clipPath id={id}>
          <polygon points={pts(F)} />
        </clipPath>
      </defs>
      <polygon points={pts(F)} fill={earth ? EARTH_DD : ICE_DEEP} />
      <g clipPath={`url(#${id})`}>
        <polygon points={pts(wall)} fill={earth ? EARTH : "#5f8fb0"} />
        {/* a camada de gelo no alto da parede, depois a terra em camadas */}
        <polygon points={pts([...bk, ...sh(bk, 0, ice).reverse()])} fill="#7fb0cf" />
        <polyline points={pts(sh(bk, 0, ice * 0.45))} fill="none" stroke="#a8d0e6" strokeWidth={3} />
        {earth ? (
          <>
            <polygon points={pts([...sh(bk, 0, ice), ...sh(bk, 0, ice + (depth - ice) * 0.35).reverse()])} fill="#6b4e3a" />
            <polygon points={pts([...sh(bk, 0, ice + (depth - ice) * 0.62), ...sh(bk, 0, depth).reverse()])} fill={EARTH_D} />
            {bk.map(([x, y], k) => (k % 2 ? <ellipse key={k} cx={x + 6} cy={y + ice + (depth - ice) * (0.2 + 0.5 * rnd(k + x))} rx={5 + 5 * rnd(k * 3)} ry={3 + 2 * rnd(k * 5)} fill={rnd(k * 7) > 0.5 ? "#8a7a68" : "#2a1e18"} /> : null))}
          </>
        ) : (
          <polyline points={pts(sh(bk, 0, ice + 10))} fill="none" stroke={ICE_STRIPE} strokeWidth={4} />
        )}
        {/* o resto verde de Xen no fundo da cratera */}
        {earth && glow > 0 ? (
          <>
            <ellipse cx={(F[0][0] + F[N / 2][0]) / 2} cy={F[N / 4][1] - 6} rx={Math.abs(F[0][0] - F[N / 2][0]) * 0.32} ry={14} fill={XEN_G} opacity={0.22 * glow} />
            {Array.from({ length: 9 }).map((_, k) => {
              const x = F[N / 2][0] + (F[0][0] - F[N / 2][0]) * (0.2 + 0.6 * rnd(k * 11 + 3));
              return <ellipse key={k} cx={x} cy={F[N / 4][1] - 10 - 18 * rnd(k * 5)} rx={4 + 4 * rnd(k)} ry={2.5} fill={XEN_G} opacity={0.85 * glow} />;
            })}
          </>
        ) : null}
      </g>
      <polyline points={pts(bk)} fill="none" stroke="#a9c6da" strokeWidth={2.5} />
      <polyline points={pts(frontOf(F))} fill="none" stroke={ICE_HI} strokeWidth={4} strokeLinejoin="round" />
    </g>
  );
};

// ---- uma placa de gelo grossa (topo de neve, lateral azul em estrias, base com pingentes e sujeira)
export const SlabBody: React.FC<{ F: Pt[]; h: number; seed: number; dirt?: boolean }> = ({ F, h, seed, dirt }) => {
  const fr = frontOf(F);
  const side: Pt[] = [...fr, ...sh(fr, 0, h).reverse()];
  const cx = (F[0][0] + F[N / 2][0]) / 2, cy = F[N / 4][1] - (F[N / 4][1] - F[(3 * N) / 4][1]) / 2;
  const left = fr.filter((_, k) => k >= N / 2 - 3);
  return (
    <g>
      <polygon points={pts(side)} fill={ICE_SIDE} />
      <polygon points={pts([...left, ...sh(left, 0, h).reverse()])} fill={ICE_SIDE_D} />
      {[0.32, 0.62].map((t) => (
        <polyline key={t} points={pts(sh(fr, 0, h * t))} fill="none" stroke={ICE_STRIPE} strokeWidth={3} strokeLinejoin="round" />
      ))}
      {/* pingentes e lascas na base */}
      {fr.slice(1, -1).map(([x, y], k) => {
        const L = h * (0.18 + 0.45 * rnd(seed * 13 + k));
        return <polygon key={k} points={pts([[x - 9, y + h - 1], [x + 9, y + h - 1], [x + 2 * (rnd(k + seed) - 0.5) * 6, y + h + L]])} fill={k % 3 ? "#9fd0ea" : ICE_SIDE_D} />;
      })}
      {dirt
        ? fr.slice(2, -2).map(([x, y], k) => (k % 2 ? <ellipse key={"d" + k} cx={x + 4} cy={y + h * (0.72 + 0.2 * rnd(k * 5 + seed))} rx={6 + 6 * rnd(k)} ry={3} fill="#6b5a4a" opacity={0.7} /> : null))
        : null}
      <polygon points={pts(F)} fill={ICE_TOP} />
      <polygon points={pts(F.map(([x, y]) => [cx + (x - cx) * 0.78, cy + (y - cy) * 0.7 - 3] as Pt))} fill={ICE_HI} opacity={0.75} />
      <polygon points={pts(F.filter(([x]) => x > cx + (F[0][0] - cx) * 0.25).concat([[cx + (F[0][0] - cx) * 0.25, cy]]))} fill="#d3e5f0" opacity={0.6} />
      {Array.from({ length: 5 }).map((_, k) => (
        <ellipse key={"s" + k} cx={cx + (F[0][0] - cx) * (rnd(seed + k * 3) - 0.5) * 1.3} cy={cy + (rnd(seed * 2 + k) - 0.5) * (F[N / 4][1] - cy) * 1.2} rx={10 + 12 * rnd(k + seed)} ry={2.5} fill="#cfe2ee" />
      ))}
      <polyline points={pts(fr)} fill="none" stroke={ICE_HI} strokeWidth={2.5} strokeLinejoin="round" />
    </g>
  );
};

// ---- o chão: céu, aurora, estrelas, montanhas, campo de gelo
const STARS = Array.from({ length: 220 }).map((_, i) => [rnd(i * 3) * 5200 - 800, rnd(i * 5 + 1) * 560 - 300, 0.8 + rnd(i * 7) * 1.8, rnd(i * 11)] as const);
const ridge = (y0: number, amp: number, seed: number, x0 = -1400, x1 = 5200, step = 90): Pt[] => {
  const ps: Pt[] = [];
  for (let x = x0, k = 0; x <= x1; x += step, k++) ps.push([x, y0 - amp * (0.35 + 0.65 * rnd(seed + k)) * (k % 2 ? 0.55 : 1)]);
  return ps;
};
const MT1 = ridge(600, 210, 3, -1400, 5200, 150), MT2 = ridge(615, 120, 9, -1400, 5200, 95);
const BLOCKS = Array.from({ length: 90 }).map((_, i) => {
  const y = 640 + Math.pow(rnd(i * 13), 1.6) * 760;
  return [rnd(i * 7) * 5600 - 1000, y, (4 + rnd(i * 3) * 10) * (0.4 + (y - 600) / 500)] as const;
});
export const World: React.FC<{ f: number }> = ({ f }) => (
  <g>
    {/* montanhas de gelo ao longe: lado da luz, lado da sombra, neve nas cristas */}
    <polygon points={pts([...MT1, [5200, 640], [-1400, 640]])} fill="#3c5266" />
    {MT1.slice(0, -1).map(([x, y], k) => {
      const [x2, y2] = MT1[k + 1];
      return y < y2 ? <polygon key={k} points={pts([[x, y], [x2, y2], [x2, 640], [x + (x2 - x) * 0.4, 640]])} fill="#33475a" /> : <polygon key={k} points={pts([[x, y], [x + (x2 - x) * 0.35, y + 40], [x - 30, y + 55]])} fill="#c9d9e6" opacity={0.85} />;
    })}
    <polygon points={pts([...MT2, [5200, 650], [-1400, 650]])} fill="#5b7488" />
    {MT2.map(([x, y], k) => (k % 2 ? null : <polygon key={k} points={pts([[x, y], [x + 26, y + 22], [x - 22, y + 26]])} fill="#dce8f1" />))}
    {/* o campo de gelo */}
    <rect x={-1400} y={630} width={6600} height={1200} fill="url(#arcGround)" />
    {Array.from({ length: 60 }).map((_, i) => {
      const y = 650 + Math.pow(rnd(i * 17), 1.4) * 800, s = 0.4 + (y - 600) / 500;
      return <ellipse key={"sz" + i} cx={rnd(i * 19) * 6000 - 1100} cy={y} rx={(60 + 120 * rnd(i)) * s} ry={3 * s} fill={i % 3 ? "#f6fafc" : "#a9c3d6"} opacity={0.75} />;
    })}
    {/* cordões de pressão: blocos empilhados */}
    {[700, 760].map((ry, r) =>
      Array.from({ length: 70 }).map((_, i) => {
        const x = -1200 + i * 92 + rnd(i * 3 + r) * 40, s = r ? 1 : 0.7, w = (18 + 22 * rnd(i * 5 + r)) * s, hh = (10 + 16 * rnd(i * 7 + r)) * s;
        const y = ry + Math.sin(i * 0.7 + r) * 14;
        if (x > 2150 && x < 3150) return null;
        return (
          <g key={"pr" + r + "_" + i}>
            <polygon points={pts([[x - w, y], [x - w * 0.6, y - hh], [x + w * 0.3, y - hh * 1.1], [x + w, y]])} fill="#9fbfd4" />
            <polygon points={pts([[x - w * 0.6, y - hh], [x + w * 0.3, y - hh * 1.1], [x + w * 0.1, y - hh * 0.6], [x - w * 0.5, y - hh * 0.7]])} fill="#f2f8fb" />
          </g>
        );
      }),
    )}
    {BLOCKS.map(([x, y, s], i) =>
      x > 2150 && x < 3150 && y < 760 ? null : (
        <g key={"b" + i}>
          <ellipse cx={x + s * 0.6} cy={y + 1} rx={s * 1.5} ry={s * 0.35} fill="#7f9db3" opacity={0.45} />
          <polygon points={pts([[x - s, y], [x - s * 0.8, y - s], [x + s * 0.7, y - s * 1.1], [x + s, y]])} fill="#a9c8dc" />
          <polygon points={pts([[x - s * 0.8, y - s], [x + s * 0.7, y - s * 1.1], [x + s * 0.3, y - s * 1.45], [x - s * 0.5, y - s * 1.35]])} fill="#f4f9fc" />
        </g>
      ),
    )}
  </g>
);
export const Sky: React.FC<{ f: number }> = ({ f }) => {
  const t = f / 30;
  const curtain = (y: number, amp: number, k: number, col: string, op: number) => {
    const top: Pt[] = [], bot: Pt[] = [];
    for (let x = -1400; x <= 5200; x += 120) {
      const w = Math.sin(x / 420 + t * 0.35 + k) * amp + Math.sin(x / 170 - t * 0.5 + k * 2) * amp * 0.35;
      top.push([x, y + w - 70 - 40 * Math.sin(x / 300 + k)]);
      bot.push([x, y + w + 60]);
    }
    return (
      <g opacity={op}>
        <polygon points={pts([...top, ...bot.reverse()])} fill={col} opacity={0.18} />
        {top.flatMap(([x, y2], i) =>
          [0, 1, 2].map((q) => (
            <rect key={i + "_" + q} x={x + q * 40 + 10 * Math.sin(t + i + q)} y={y2 - 20 + 30 * rnd(i * 7 + q)} width={5 + 9 * rnd(i + k * 50 + q)} height={130 + 90 * rnd(i * 3 + k + q)} fill={"url(#aur" + k + ")"} opacity={0.35 + 0.45 * (0.5 + 0.5 * Math.sin(t * 1.3 + i * 0.9 + q * 2 + k))} />
          )),
        )}
      </g>
    );
  };
  return (
    <g>
      <defs>
        {[["0", "#4ef0b0"], ["2", "#7ad8ff"], ["4", "#b48cff"]].map(([id, c]) => (
          <linearGradient key={id} id={"aur" + id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={c} stopOpacity={0} />
            <stop offset="0.3" stopColor={c} stopOpacity={0.9} />
            <stop offset="1" stopColor={c} stopOpacity={0} />
          </linearGradient>
        ))}
      </defs>
      <rect x={-1400} y={-900} width={6600} height={1560} fill="url(#arcSky)" />
      {STARS.map(([x, y, r, ph], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill="#e6f0ff" opacity={0.35 + 0.55 * (0.5 + 0.5 * Math.sin(f / (9 + ph * 12) + ph * 30))} />
      ))}
      {curtain(-60, 70, 0, "#4ef0b0", 0.9)}
      {curtain(40, 55, 2, "#7ad8ff", 0.55)}
      {curtain(-150, 60, 4, "#a07cff", 0.6)}
    </g>
  );
};

// ---- o navio preso no gelo (desenho próprio: casco, superestrutura na popa, contêineres, guindastes, botes)
export const SHIP_X = 2250, SHIP_Y = 705;
export const Ship: React.FC<{ f: number; phase: number }> = ({ f, phase }) => {
  const hull: Pt[] = [[0, -100], [700, -100], [800, -126], [838, -124], [792, -22], [772, 0], [24, 0], [6, -38], [-14, -84]];
  const win = (x0: number, y0: number, w: number, n: number, seed: number) =>
    Array.from({ length: n }).map((_, k) => <rect key={k} x={x0 + k * (w / n) + 3} y={y0} width={w / n - 7} height={8} fill={rnd(seed + k) > 0.55 ? "#ffd27a" : "#1d2a36"} />);
  const glitch = phase * (Math.sin(f * 1.7) > 0.6 ? 1 : 0.25);
  return (
    <g transform={`translate(${SHIP_X} ${SHIP_Y})`}>
      {/* sombra no gelo */}
      <ellipse cx={420} cy={8} rx={470} ry={20} fill="#6a879c" opacity={0.55} />
      {/* casco */}
      <polygon points={pts(hull)} fill="#33404b" />
      <polygon points={pts([[6, -38], [790, -38], [772, 0], [24, 0]])} fill="#2a343d" />
      <polygon points={pts([[14, -22], [785, -22], [772, 0], [24, 0]])} fill="#8a2e2a" />
      <polyline points={pts([[-14, -84], [0, -100], [700, -100], [800, -126], [838, -124]])} fill="none" stroke="#9aa8b4" strokeWidth={3} />
      {Array.from({ length: 18 }).map((_, k) => {
        const x = 40 + k * 42 + rnd(k) * 20;
        return <rect key={k} x={x} y={-96} width={3 + 3 * rnd(k * 3)} height={22 + 40 * rnd(k * 5)} fill="#7a4a32" opacity={0.5} />;
      })}
      {Array.from({ length: 15 }).map((_, k) => <circle key={k} cx={280 + k * 28} cy={-72} r={3.5} fill="#151d25" />)}
      <text x={600} y={-52} fill="#e8edf1" fontFamily={MONO} fontSize={20} letterSpacing={7}>BOREALIS</text>
      {/* proa: castelo e mastro */}
      <polygon points={pts([[700, -100], [800, -126], [800, -142], [705, -118]])} fill="#3d4b57" />
      <rect x={784} y={-215} width={5} height={80} fill="#4a5560" />
      <rect x={770} y={-200} width={34} height={4} fill="#4a5560" />
      {/* contêineres no convés */}
      {Array.from({ length: 2 }).map((_, r) =>
        Array.from({ length: r ? 5 : 7 }).map((_, k) => {
          const cols = ["#b8392f", "#2f6db0", "#3a8a4a", "#d08a2a", "#6a4a8a", "#2f8a8a"];
          const x = 300 + k * 40 + r * 20, y = -100 - (r + 1) * 24, c = cols[(k * 3 + r * 5) % cols.length];
          return (
            <g key={r + "_" + k}>
              <rect x={x} y={y} width={38} height={23} fill={c} />
              {[8, 16, 24, 32].map((d) => <rect key={d} x={x + d} y={y + 2} width={2} height={19} fill="#000" opacity={0.18} />)}
              <rect x={x} y={y} width={38} height={3} fill="#fff" opacity={0.2} />
            </g>
          );
        }),
      )}
      {/* guindastes */}
      {[280, 575].map((x, k) => (
        <g key={x}>
          <rect x={x} y={-180} width={10} height={80} fill="#e0a83a" />
          <rect x={x + 7} y={-180} width={3} height={80} fill="#a8761f" />
          <polygon points={pts([[x + 4, -170], [x + 105 - k * 20, -255], [x + 110 - k * 20, -250], [x + 9, -160]])} fill="#e0a83a" />
          <rect x={x + 104 - k * 20} y={-252} width={2} height={70} fill="#2a2e33" />
          <rect x={x + 99 - k * 20} y={-184} width={12} height={8} fill="#2a2e33" />
        </g>
      ))}
      {/* superestrutura da popa */}
      {[
        [30, -150, 200, 50, 7],
        [50, -195, 165, 45, 6],
        [70, -235, 140, 40, 0],
      ].map(([x, y, w, h, n], k) => (
        <g key={k}>
          <rect x={x} y={y} width={w} height={h} fill="#dfe5ea" />
          <rect x={x + w * 0.76} y={y} width={w * 0.24} height={h} fill="#bcc6ce" />
          <rect x={x - 4} y={y - 3} width={w + 8} height={4} fill="#f4f7f9" />
          {n ? win(x + 8, y + 14, w - 20, n, k * 20) : null}
          {n ? win(x + 8, y + 30, w - 20, n, k * 20 + 9) : null}
        </g>
      ))}
      <rect x={66} y={-226} width={148} height={14} fill="#1d2a36" />
      {Array.from({ length: 9 }).map((_, k) => <rect key={k} x={70 + k * 16} y={-224} width={10} height={10} fill={k % 4 ? "#2c4256" : "#ffd27a"} opacity={0.9} />)}
      <polygon points={pts([[150, -235], [192, -235], [200, -300], [160, -300]])} fill="#2b3036" />
      <polygon points={pts([[152, -282], [196, -282], [197, -270], [151, -270]])} fill="#b8392f" />
      <rect x={110} y={-305} width={4} height={70} fill="#4a5560" />
      <rect x={96} y={-290} width={32} height={4} fill="#4a5560" />
      <ellipse cx={112} cy={-308} rx={9} ry={5} fill="#cfd8de" />
      {[60, 160].map((x) => (
        <g key={x}>
          <ellipse cx={x} cy={-152} rx={26} ry={9} fill="#e86a2a" />
          <rect x={x - 22} y={-159} width={44} height={4} fill="#fff" opacity={0.7} />
        </g>
      ))}
      {Array.from({ length: 22 }).map((_, k) => <circle key={k} cx={20 + k * 36} cy={-104} r={2.5} fill="#ffe9a8" opacity={0.6 + 0.4 * Math.sin(f / 7 + k)} />)}
      {/* o gelo apertando o casco */}
      {Array.from({ length: 34 }).map((_, k) => {
        const x = -60 + k * 28 + rnd(k * 3) * 12, s = 10 + 18 * rnd(k * 7), y = rnd(k) > 0.5 ? 4 : 14;
        return (
          <g key={"i" + k}>
            <polygon points={pts([[x - s, y], [x - s * 0.7, y - s * 0.9], [x + s * 0.6, y - s], [x + s, y]])} fill="#a9c8dc" />
            <polygon points={pts([[x - s * 0.7, y - s * 0.9], [x + s * 0.6, y - s], [x + s * 0.2, y - s * 1.3], [x - s * 0.4, y - s * 1.25]])} fill="#f4f9fc" />
          </g>
        );
      })}
      {/* a falha de fase: o casco tremeluz em violeta */}
      {phase > 0 ? (
        <g opacity={phase}>
          <polygon points={pts(hull)} fill="none" stroke={VIO} strokeWidth={4} transform={`translate(${glitch * 7} ${-glitch * 2})`} opacity={0.75} />
          <polygon points={pts(hull)} fill={VIO} opacity={0.08 + 0.1 * glitch} />
          {glitch > 0.5 ? <rect x={-20} y={-80 + ((f * 13) % 70)} width={860} height={10} fill={VIO} opacity={0.35} /> : null}
        </g>
      ) : null}
    </g>
  );
};

// ---- os pedaços de gelo (iceAt)
const SLABS = [
  { x: 1050, y: 800, rx: 125, h: 52, d: 0, up: 230 },
  { x: 1400, y: 755, rx: 95, h: 42, d: 14, up: 190 },
  { x: 800, y: 875, rx: 160, h: 62, d: 26, up: 260 },
  { x: 1690, y: 815, rx: 115, h: 48, d: 38, up: 210 },
  { x: 560, y: 760, rx: 85, h: 36, d: 50, up: 170 },
].map((s, i) => ({ ...s, F: footprint(s.x, s.y, s.rx, 40 + i * 9) }));
const slabLift = (s: (typeof SLABS)[number], f: number, iceAt: number) => {
  const t = f - iceAt - s.d;
  return s.up * io(cl(t / 130)) + Math.max(0, t - 130) * 0.5;
};
// fenda no gelo: cunha escura que afina, com o brilho de fase no fundo; k = quanto já correu
export const Fissure: React.FC<{ a: Pt; b: Pt; w: number; seed: number; k: number; core: string; f: number }> = ({ a, b, w, seed, k, core, f }) => {
  if (k <= 0) return null;
  const n = 7, dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
  const c: Pt[] = Array.from({ length: n + 1 }).map((_, i) => {
    const u = (i / n) * k, j = i && i < n ? (rnd(seed * 9 + i) - 0.5) * L * 0.16 : 0;
    return [a[0] + dx * u + nx * j, a[1] + dy * u + ny * j * 0.4];
  });
  const wd = (i: number) => w * Math.pow(1 - i / n, 0.8) * (0.7 + 0.5 * rnd(seed + i * 3));
  const l = c.map(([x, y], i) => [x + nx * wd(i), y + ny * wd(i) * 0.5] as Pt), r = c.map(([x, y], i) => [x - nx * wd(i), y - ny * wd(i) * 0.5] as Pt);
  return (
    <g>
      <polygon points={pts([...l, ...r.reverse()])} fill="#1d3448" />
      <polygon points={pts([...c.map(([x, y], i) => [x + nx * wd(i) * 0.45, y + ny * wd(i) * 0.22] as Pt), ...c.map(([x, y], i) => [x - nx * wd(i) * 0.45, y - ny * wd(i) * 0.22] as Pt).reverse()])} fill={core} opacity={0.55 + 0.35 * Math.sin(f / 3 + seed)} />
    </g>
  );
};
export const Crack: React.FC<{ F: Pt[]; k: number; f: number; seed: number }> = ({ F, k, f, seed }) =>
  k <= 0 ? null : (
    <g opacity={Math.min(1, k * 1.5)}>
      <polygon points={pts(F)} fill="none" stroke="#1d3448" strokeWidth={6} strokeLinejoin="round" />
      <polygon points={pts(F)} fill="none" stroke={VIO} strokeWidth={2.5} strokeLinejoin="round" opacity={0.7 + 0.3 * Math.sin(f / 3)} />
      {[1, 5, 9, 12].map((q) => {
        const [x, y] = F[q], cx = (F[0][0] + F[N / 2][0]) / 2, cy = (F[N / 4][1] + F[(3 * N) / 4][1]) / 2;
        const ox = x - cx, oy = y - cy, L = Math.hypot(ox, oy * 3) || 1;
        return <Fissure key={q} a={[x, y]} b={[x + (ox / L) * 110, y + ((oy * 3) / L) * 110 * 0.3]} w={7} seed={seed * 13 + q} k={k} core={VIO} f={f} />;
      })}
    </g>
  );
const Slab: React.FC<{ s: (typeof SLABS)[number]; i: number; f: number; iceAt: number }> = ({ s, i, f, iceAt }) => {
  const t0 = iceAt + s.d;
  const L = slabLift(s, f, iceAt);
  const rot = cl((L - s.h - 20) / 80) * (rnd(i) - 0.5) * 9;
  const crackK = cl((f - (t0 - 70)) / 45) * (1 - cl((f - t0 - 4) / 20));
  const inHole = L < s.h + s.h * 0.4 + 6;
  const id = "slab" + i;
  // neve caindo de baixo do pedaço, até o fundo do buraco
  const flakes = Array.from({ length: 14 }).map((_, j) => {
    const tj = f - t0 - 20 - j * 7;
    if (tj < 0 || L < s.h) return null;
    const x = s.x + (rnd(i * 30 + j) - 0.5) * s.rx * 1.4;
    const y0 = s.y - L + s.h * 1.2, yb = s.y + s.h * 1.6;
    const y = Math.min(yb, y0 + tj * tj * 0.18);
    return <rect key={j} x={x} y={y} width={3 + 3 * rnd(j)} height={3 + 3 * rnd(j)} fill={j % 4 ? "#f4f9fc" : "#8a7a68"} opacity={y >= yb ? 0.6 : 0.95} />;
  });
  return (
    <g>
      {L > 0.5 ? <Hole id={"h" + id} F={s.F} depth={s.h * 1.6} /> : null}
      {flakes}
      <defs>
        <clipPath id={"c" + id}>
          <polygon points={pts(aboveFront(s.F))} />
        </clipPath>
      </defs>
      <g clipPath={inHole ? `url(#c${id})` : undefined}>
        <g transform={`translate(0 ${-L}) rotate(${rot} ${s.x} ${s.y})`}>
          <SlabBody F={s.F} h={s.h} seed={i * 5 + 1} dirt />
        </g>
      </g>
      <Crack F={s.F} k={crackK} f={f + i * 5} seed={i} />
    </g>
  );
};

// ---- os fragmentos de Xen (xenAt)
const XENS = [
  { x: 1250, y: 975, rx: 200, D: 280, t: 106 },
  { x: 470, y: 905, rx: 115, D: 160, t: 88 },
  { x: 1930, y: 915, rx: 125, D: 175, t: 126 },
].map((r, i) => ({ ...r, F: footprint(r.x, r.y, r.rx, 90 + i * 13, 0.1), H: footprint(r.x, r.y, r.rx * 1.12, 120 + i * 7, 0.14) }));
const xenLift = (r: (typeof XENS)[number], f: number, xenAt: number) => {
  const t = f - xenAt - r.t;
  return t < 0 ? 0 : (r.D + 70) * eo(t / 24) + t * 0.9;
};
// o corpo da rocha: base pontuda, facetas, veios e cristais verdes, raízes penduradas
export const XenRock: React.FC<{ r: (typeof XENS)[number]; i: number; f: number; out: boolean }> = ({ r, i, f, out }) => {
  const { x, y, rx, D, F } = r;
  const fr = frontOf(F);
  const cap = 26, earthB = 30;
  const j = (k: number) => (rnd(i * 31 + k) - 0.5) * rx * 0.12;
  const body: Pt[] = [
    ...sh(fr, 0, cap + earthB),
    [x - rx * 0.92 + j(1), y + D * 0.25],
    [x - rx * 0.66 + j(2), y + D * 0.5],
    [x - rx * 0.4 + j(3), y + D * 0.74],
    [x - rx * 0.08 + j(4), y + D],
    [x + rx * 0.22 + j(5), y + D * 0.82],
    [x + rx * 0.52 + j(6), y + D * 0.6],
    [x + rx * 0.8 + j(7), y + D * 0.34],
  ];
  const tip: Pt = [x - rx * 0.08 + j(4), y + D];
  const sway = Math.sin(f / 14 + i);
  return (
    <g>
      {/* raízes e cipós de Xen pendurados */}
      {Array.from({ length: 7 }).map((_, k) => {
        const bx = x + (k / 6 - 0.5) * rx * 1.1, by = y + D * (0.55 + 0.35 * (1 - Math.abs(k / 6 - 0.5) * 2));
        const L = 60 + 90 * rnd(i * 9 + k), dx = sway * (14 + 10 * rnd(k));
        return <path key={k} d={`M${bx} ${by} q ${dx * 0.5 + 10} ${L * 0.5} ${dx} ${L}`} fill="none" stroke="#6e4f86" strokeWidth={6 - k % 3} strokeLinecap="round" />;
      })}
      <polygon points={pts(body)} fill={XEN_ROCK} />
      {/* facetas: luz à esquerda, sombra à direita */}
      <polygon points={pts([sh(fr, 0, cap + earthB)[fr.length - 1], [x - rx * 0.92 + j(1), y + D * 0.25], [x - rx * 0.66 + j(2), y + D * 0.5], [x - rx * 0.4 + j(3), y + D * 0.74], [x - rx * 0.2, y + D * 0.45], [x - rx * 0.45, y + cap + earthB + 30]])} fill={XEN_HI} />
      <polygon points={pts([sh(fr, 0, cap + earthB)[0], [x + rx * 0.8 + j(7), y + D * 0.34], [x + rx * 0.52 + j(6), y + D * 0.6], [x + rx * 0.22 + j(5), y + D * 0.82], tip, [x + rx * 0.15, y + D * 0.5], [x + rx * 0.5, y + cap + earthB + 26]])} fill={XEN_DK} />
      <polyline points={pts([[x - rx * 0.45, y + cap + earthB + 30], [x - rx * 0.2, y + D * 0.45], [x + rx * 0.15, y + D * 0.5], [x + rx * 0.5, y + cap + earthB + 26]])} fill="none" stroke="#231a32" strokeWidth={4} />
      {/* veios acesos */}
      {[0, 1, 2].map((k) => (
        <polyline key={k} points={pts([[x - rx * (0.6 - k * 0.3), y + cap + earthB + 20], [x - rx * (0.5 - k * 0.32), y + D * 0.35], [x - rx * (0.3 - k * 0.28), y + D * (0.55 + 0.1 * k)]])} fill="none" stroke={XEN_G} strokeWidth={4} opacity={0.65 + 0.35 * Math.sin(f / 6 + k + i)} strokeLinejoin="round" />
      ))}
      {/* cristais */}
      {Array.from({ length: 6 }).map((_, k) => {
        const u = (k + 0.5) / 6;
        const bx = x - rx * 0.85 + u * rx * 1.6, by = y + D * (0.3 + 0.55 * Math.sin(u * Math.PI));
        const ang = (u - 0.5) * 1.6 + Math.PI / 2, L = rx * (0.1 + 0.1 * rnd(i * 17 + k)), w = L * 0.3;
        const ex = Math.cos(ang) * L, ey = Math.sin(ang) * L, nx = -Math.sin(ang) * w, ny = Math.cos(ang) * w;
        return (
          <g key={k}>
            <polygon points={pts([[bx - nx, by - ny], [bx + ex * 0.8 - nx, by + ey * 0.8 - ny], [bx + ex, by + ey], [bx + ex * 0.8 + nx, by + ey * 0.8 + ny], [bx + nx, by + ny]])} fill={XEN_G} />
            <polygon points={pts([[bx - nx, by - ny], [bx + ex * 0.8 - nx, by + ey * 0.8 - ny], [bx + ex, by + ey], [bx, by]])} fill={XEN_GL} opacity={0.8} />
            <polygon points={pts([[bx + nx, by + ny], [bx + ex * 0.8 + nx, by + ey * 0.8 + ny], [bx + ex, by + ey], [bx, by]])} fill={XEN_GD} />
          </g>
        );
      })}
      {/* a tampa que veio junto: terra congelada e o gelo por cima */}
      <polygon points={pts([...sh(fr, 0, cap), ...sh(fr, 0, cap + earthB).reverse()])} fill={EARTH} />
      {fr.map(([px, py], k) => (k % 2 ? <ellipse key={"e" + k} cx={px} cy={py + cap + earthB * (0.3 + 0.5 * rnd(k + i))} rx={6 + 4 * rnd(k)} ry={3} fill={rnd(k * 3) > 0.5 ? "#8a7a68" : EARTH_DD} /> : null))}
      <SlabBody F={F} h={cap} seed={i * 7 + 3} />
      {/* plantinhas de Xen que já brotavam no gelo */}
      {(out ? [0, 1, 2, 3] : []).map((k) => {
        const px = x + (k / 3 - 0.5) * rx * 1.1, py = y + (rnd(k + i) - 0.5) * rx * 0.15, hh = 18 + 14 * rnd(k * 3 + i);
        return (
          <g key={"p" + k}>
            <rect x={px - 2} y={py - hh} width={4} height={hh} fill="#6e4f86" />
            <circle cx={px} cy={py - hh} r={6} fill={XEN_G} opacity={0.85 + 0.15 * Math.sin(f / 5 + k)} />
          </g>
        );
      })}
    </g>
  );
};
const Xen: React.FC<{ r: (typeof XENS)[number]; i: number; f: number; xenAt: number }> = ({ r, i, f, xenAt }) => {
  const tR = xenAt + r.t;
  const L = xenLift(r, f, xenAt);
  const k = cl((f - xenAt - 6) / (r.t - 6));
  const ripped = f >= tR;
  const shake = ripped ? 0 : k * 3.5;
  const sx = shake * Math.sin(f * 2.7 + i), sy = -shake * Math.abs(Math.sin(f * 3.3 + i)) - k * 6;
  const rip = eo((f - tR) / 14);
  const id = "xen" + i;
  const rot = cl((L - r.D - 60) / 120) * (i % 2 ? 6 : -5);
  // placas da borda: tombam para fora, com a borda de dentro levantada
  const Hin = r.H, Hout = footprint(r.x, r.y, r.rx * 1.55, 150 + i * 5, 0.12);
  const plates = Hin.map((p0, q) => {
    const p1 = Hin[(q + 1) % N], o0 = Hout[q], o1 = Hout[(q + 1) % N];
    const lift = rip * (16 + 14 * rnd(i * 40 + q)) * (0.6 + 0.4 * Math.sin((q / N) * Math.PI * 2) * 0.5 + 0.4);
    const top: Pt[] = [[p0[0], p0[1] - lift], [p1[0], p1[1] - lift], o1, o0];
    return { top, lift, front: Math.sin((q / N) * Math.PI * 2 + 0.2) > 0 };
  });
  // rachaduras em raio enquanto estufa
  const cracks = Array.from({ length: 10 }).map((_, q) => {
    const a = (q / 10) * Math.PI * 2 + rnd(q + i) * 0.4;
    const ps: Pt[] = [];
    for (let s = 0; s <= 5; s++) {
      const rr = r.rx * (1.0 + s * 0.17 * (0.6 + 0.6 * rnd(q * 7 + s)));
      ps.push([r.x + Math.cos(a + (rnd(q * 11 + s) - 0.5) * 0.25) * rr, r.y + Math.sin(a + (rnd(q * 13 + s) - 0.5) * 0.25) * rr * 0.3]);
    }
    return ps;
  });
  const reach = cl((f - xenAt - 10) / (r.t - 20));
  // terra e gelo caindo de baixo da rocha de volta na cratera
  const debris = ripped
    ? Array.from({ length: 22 }).map((_, q) => {
        const tq = f - tR - 6 - q * 3;
        if (tq < 0) return null;
        const relx = (rnd(i * 50 + q) - 0.5) * r.rx * 1.2;
        const L0 = xenLift(r, tR + 6 + q * 3, xenAt);
        const y0 = r.y + r.D * (0.5 + 0.3 * (1 - Math.abs(relx) / r.rx)) - L0;
        const yb = r.y + r.D * 0.18 + 8 * rnd(q);
        const y = Math.min(yb, y0 + tq * tq * 0.32);
        const s = 4 + 7 * rnd(q * 3 + i);
        return <polygon key={q} points={pts([[r.x + relx - s, y], [r.x + relx, y - s], [r.x + relx + s, y + s * 0.3]])} fill={q % 3 ? EARTH : "#dce9f2"} />;
      })
    : null;
  return (
    <g>
      {ripped ? <Hole id={"h" + id} F={r.H} depth={r.D * 0.55} earth glow={P(f, tR + 10, 30)} /> : null}
      {debris}
      {/* placas tombadas da borda (as de trás antes, as da frente depois da rocha) */}
      {ripped
        ? plates.map((pl, q) =>
            pl.front ? null : (
              <g key={"pb" + q}>
                <polygon points={pts(pl.top)} fill={ICE_TOP} />
                <polygon points={pts([pl.top[0], pl.top[1], [pl.top[1][0], pl.top[1][1] + pl.lift + 6], [pl.top[0][0], pl.top[0][1] + pl.lift + 6]])} fill={ICE_SIDE} />
              </g>
            ),
          )
        : null}
      <defs>
        <clipPath id={"c" + id}>
          <polygon points={pts(aboveFront(ripped ? r.H : r.F))} />
        </clipPath>
      </defs>
      <g clipPath={L < r.D + 60 ? `url(#c${id})` : undefined}>
        <g transform={`translate(${sx} ${sy - L}) rotate(${rot} ${r.x} ${r.y})`}>
          <XenRock r={r} i={i} f={f} out={ripped} />
        </g>
      </g>
      {ripped
        ? plates.map((pl, q) =>
            pl.front ? (
              <g key={"pf" + q}>
                <polygon points={pts([pl.top[0], pl.top[1], [pl.top[1][0], pl.top[1][1] + pl.lift + 8], [pl.top[0][0], pl.top[0][1] + pl.lift + 8]])} fill={ICE_SIDE_D} />
                <polygon points={pts(pl.top)} fill={ICE_TOP} />
                <polyline points={pts([pl.top[0], pl.top[1]])} fill="none" stroke={ICE_HI} strokeWidth={3} />
              </g>
            ) : null,
          )
        : null}
      {!ripped && k > 0 ? cracks.map((c, q) => <Fissure key={"k" + q} a={c[0]} b={c[c.length - 1]} w={9} seed={i * 40 + q} k={reach} core={q % 2 ? VIO : XEN_G} f={f} />) : null}
      {!ripped && k > 0 ? <polygon points={pts(r.F)} fill="none" stroke={XEN_G} strokeWidth={3} opacity={k * (0.5 + 0.5 * Math.sin(f / 2.5))} /> : null}
      {/* poeira de neve no arranque */}
      {ripped && f - tR < 40
        ? Array.from({ length: 16 }).map((_, q) => {
            const a = (q / 16) * Math.PI * 2, tt = (f - tR) / 40;
            return <circle key={"pu" + q} cx={r.x + Math.cos(a) * r.rx * (1 + tt * 0.8)} cy={r.y + Math.sin(a) * r.rx * 0.3 * (1 + tt * 0.8) - tt * 40} r={10 + 26 * tt} fill="#f4f9fc" opacity={0.7 * (1 - tt)} />;
          })
        : null}
    </g>
  );
};

// ---- as criaturas
// antlion de lado (virado para a esquerda): abdômen listrado, tórax com espinhos, cabeça com mandíbulas, asas, 4 pernas
const Antlion: React.FC<{ x: number; y: number; s: number; ph: number; dir: number; wing: number }> = ({ x, y, s, ph, dir, wing }) => {
  const leg = (hx: number, k: number, far: boolean) => {
    const p = ph + k * Math.PI * 0.5;
    const fx = hx - 18 + Math.sin(p) * 22, lift = Math.max(0, Math.cos(p)) * 12;
    const kx = (hx + fx) / 2 + 6, ky = -78 - 10 * Math.abs(Math.sin(p));
    return <polyline key={k + (far ? "f" : "n")} points={pts([[hx, -40], [kx, ky], [fx, -lift]])} fill="none" stroke={far ? "#5a4226" : "#8c6a3a"} strokeWidth={far ? 6 : 8} strokeLinejoin="round" strokeLinecap="round" />;
  };
  return (
    <g transform={`translate(${x} ${y}) scale(${s * dir} ${s})`}>
      <ellipse cx={0} cy={2} rx={70} ry={8} fill="#000" opacity={0.18} />
      {[-30, 20].map((hx, k) => leg(hx + 8, k + 2, true))}
      {/* abdômen */}
      <ellipse cx={42} cy={-48} rx={48} ry={26} fill="#b08a4e" transform="rotate(-12 42 -48)" />
      {[18, 34, 50, 66].map((bx) => <path key={bx} d={`M${bx} -72 q 6 24 0 46`} fill="none" stroke="#6e5228" strokeWidth={5} />)}
      <ellipse cx={30} cy={-60} rx={26} ry={8} fill="#d2b072" opacity={0.6} transform="rotate(-12 30 -60)" />
      {/* tórax */}
      <polygon points={pts([[-30, -40], [-22, -62], [4, -66], [14, -40], [-4, -30]])} fill="#a07c44" />
      {[-20, -8, 4].map((sx) => <polygon key={sx} points={pts([[sx, -64], [sx + 4, -80], [sx + 8, -64]])} fill="#6e5228" />)}
      {/* cabeça e mandíbulas */}
      <polygon points={pts([[-30, -40], [-56, -50], [-66, -42], [-52, -30], [-28, -30]])} fill="#8c6a3a" />
      <circle cx={-50} cy={-44} r={3.5} fill="#1a120a" />
      <path d="M-62 -36 q -14 2 -16 14" fill="none" stroke="#3a2a14" strokeWidth={4} strokeLinecap="round" />
      <path d="M-58 -32 q -6 10 -2 18" fill="none" stroke="#3a2a14" strokeWidth={4} strokeLinecap="round" />
      {/* asas */}
      <g transform={`rotate(${-8 - wing * 18} 0 -64)`}>
        <ellipse cx={46} cy={-74} rx={56} ry={13} fill="#e3d6ae" opacity={0.55} />
        <path d="M0 -70 L96 -76 M14 -66 L80 -82" stroke="#a8946a" strokeWidth={2} opacity={0.7} />
      </g>
      {[-30, 20].map((hx, k) => leg(hx, k, false))}
    </g>
  );
};
// headcrab de lado: domo claro, bico, 4 patas
const Headcrab: React.FC<{ x: number; y: number; s: number; ph: number; dir: number }> = ({ x, y, s, ph, dir }) => {
  const bob = Math.abs(Math.sin(ph)) * 6;
  const leg = (hx: number, k: number, far: boolean) => {
    const p = ph * 2 + k * Math.PI;
    const fx = hx - 14 + Math.sin(p) * 14, lift = Math.max(0, Math.cos(p)) * 8;
    return <polyline key={k + (far ? "f" : "n")} points={pts([[hx, -22 - bob], [(hx + fx) / 2 - 6, -40 - bob], [fx, -lift]])} fill="none" stroke={far ? "#9a7a5e" : "#c8a882"} strokeWidth={far ? 4 : 5} strokeLinejoin="round" strokeLinecap="round" />;
  };
  return (
    <g transform={`translate(${x} ${y}) scale(${s * dir} ${s})`}>
      <ellipse cx={0} cy={2} rx={28} ry={4} fill="#000" opacity={0.18} />
      {leg(10, 1, true)}
      {leg(-8, 0, true)}
      <path d={`M-28 ${-20 - bob} q 4 -26 30 -26 q 26 0 28 26 z`} fill="#d9c3a0" />
      <path d={`M-28 ${-20 - bob} q 30 10 58 0 l -2 6 q -28 8 -54 0 z`} fill="#a8846a" />
      <path d={`M-24 ${-34 - bob} q 18 -12 40 -6`} fill="none" stroke="#efe1c6" strokeWidth={4} strokeLinecap="round" />
      <path d={`M-30 ${-22 - bob} l -10 4 l 10 2 z`} fill="#c06a6a" />
      {leg(16, 0, false)}
      {leg(-14, 1, false)}
    </g>
  );
};
// soldado Combine de frente: máscara com os olhos azuis, colete, rifle; a cabeça vira de um lado pro outro
const Combine: React.FC<{ x: number; y: number; s: number; look: number; f: number; scared: number }> = ({ x, y, s, look, f, scared }) => {
  const sway = Math.sin(f / 18 + x) * 1.5;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx={0} cy={2} rx={40} ry={7} fill="#000" opacity={0.2} />
      <polygon points={pts([[-20, 0], [-16, -70], [-4, -70], [-6, 0]])} fill="#1f2833" />
      <polygon points={pts([[6, 0], [4, -70], [16, -70], [20, 0]])} fill="#1f2833" />
      <rect x={-19} y={-44} width={13} height={14} rx={3} fill="#3a4756" />
      <rect x={6} y={-44} width={13} height={14} rx={3} fill="#3a4756" />
      <rect x={-22} y={-6} width={18} height={8} fill="#141a20" />
      <rect x={4} y={-6} width={18} height={8} fill="#141a20" />
      <g transform={`translate(${sway} 0)`}>
        <polygon points={pts([[-26, -70], [-28, -130], [28, -130], [26, -70]])} fill="#2c3a4a" />
        <polygon points={pts([[-20, -124], [20, -124], [16, -90], [-16, -90]])} fill="#47586b" />
        <rect x={-18} y={-86} width={36} height={8} fill="#1a222b" />
        <rect x={-36} y={-128} width={12} height={46} rx={5} fill="#2c3a4a" />
        <rect x={24} y={-128} width={12} height={46} rx={5} fill="#2c3a4a" />
        {/* o rifle atravessado (abaixa quando ele tem medo) */}
        <g transform={`rotate(${-28 + scared * 40} 0 -96)`}>
          <rect x={-46} y={-102} width={96} height={12} rx={3} fill="#151a1f" />
          <rect x={30} y={-108} width={22} height={6} fill="#151a1f" />
          <rect x={-10} y={-90} width={10} height={16} fill="#151a1f" />
          <circle cx={46} cy={-96} r={3} fill="#ffb23a" opacity={0.7} />
        </g>
        {/* cabeça */}
        <g transform={`translate(0 -150) scale(${look} 1)`}>
          <ellipse cx={0} cy={0} rx={21} ry={24} fill="#2a333d" />
          <ellipse cx={-4} cy={-12} rx={14} ry={7} fill="#3a4553" />
          <circle cx={-9} cy={-2} r={6.5} fill="#6fe3ff" />
          <circle cx={7} cy={-2} r={6.5} fill="#6fe3ff" />
          <circle cx={-9} cy={-2} r={2.5} fill="#e6fbff" />
          <circle cx={7} cy={-2} r={2.5} fill="#e6fbff" />
          <rect x={-8} y={10} width={10} height={12} rx={3} fill="#151a1f" />
          <circle cx={-15} cy={14} r={6} fill="#151a1f" />
        </g>
      </g>
    </g>
  );
};
// a toca: monte de terra e neve com a boca escura
const Den: React.FC<{ x: number; y: number; s: number }> = ({ x, y, s }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ellipse cx={0} cy={6} rx={120} ry={22} fill="#7f9db3" opacity={0.4} />
    <path d="M-120 4 q 30 -46 120 -50 q 90 4 120 50 z" fill="#9c8466" />
    <path d="M-100 -6 q 30 -32 100 -36 q 40 2 66 18 q -60 -6 -120 6 z" fill="#efe6d6" />
    <ellipse cx={0} cy={-8} rx={62} ry={18} fill="#1a120c" />
    <path d="M-62 -8 q 62 -26 124 0" fill="none" stroke="#5e4834" strokeWidth={6} />
    {Array.from({ length: 10 }).map((_, k) => <ellipse key={k} cx={-110 + k * 24 + rnd(k) * 10} cy={-4 - rnd(k * 3) * 22} rx={5} ry={3} fill={k % 2 ? "#6e5840" : "#c9b89a"} />)}
  </g>
);
const DENS = [
  { x: 330, y: 1100, s: 1 },
  { x: 610, y: 1175, s: 1.1 },
  { x: 900, y: 1090, s: 0.95 },
  { x: 1080, y: 1190, s: 1.05 },
];
const ANTS = [
  { den: 0, d: 0, v: -2.4 },
  { den: 1, d: 12, v: -2.0 },
  { den: 2, d: 24, v: 2.2 },
  { den: 3, d: 36, v: 2.6 },
];
const CRABS: [number, number, number, number, number][] = [
  // x, y, atraso, velocidade (px/quadro, sinal = direção), escala
  [760, 1215, 20, -5.5, 1],
  [820, 1240, 30, 4.8, 1.05],
  [700, 1260, 38, -4.2, 1.1],
  [960, 1225, 46, 5.6, 0.95],
  [880, 1270, 54, -6.0, 1.1],
  [600, 1235, 62, 4.4, 1],
];
const COMB = [
  { x: 1960, y: 1110, s: 1.0, ph: 0 },
  { x: 2090, y: 1150, s: 1.08, ph: 2.1 },
  { x: 2220, y: 1105, s: 0.95, ph: 4.0 },
];

// ---- a câmera: [quadro, centro x, centro y, zoom]
export type K = [number, number, number, number];
export const camAt = (f: number, ks: K[]) => {
  if (f <= ks[0][0]) return ks[0];
  for (let i = 0; i < ks.length - 1; i++) {
    const a = ks[i], b = ks[i + 1];
    if (f <= b[0]) {
      const t = io((f - a[0]) / Math.max(1, b[0] - a[0]));
      return [f, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t, a[3] + (b[3] - a[3]) * t] as K;
    }
  }
  return ks[ks.length - 1];
};
export const Label: React.FC<{ x: number; y: number; text: string; sub?: string; col: string; o: number; align?: "left" | "right" | "center" }> = ({ x, y, text, sub, col, o, align = "left" }) =>
  o <= 0 ? null : (
    <div style={{ position: "absolute", left: x, top: y, transform: align === "right" ? "translateX(-100%)" : align === "center" ? "translateX(-50%)" : undefined, textAlign: align, opacity: o, fontFamily: MONO, textShadow: "0 2px 10px rgba(0,0,0,0.95), 0 0 2px #000", whiteSpace: "nowrap" }}>
      <div style={{ fontSize: 30, letterSpacing: 6, color: col }}>{text}</div>
      {sub ? <div style={{ fontSize: 18, letterSpacing: 4, color: "rgba(242,240,247,0.85)", marginTop: 6 }}>{sub}</div> : null}
    </div>
  );

export const HL14ArcticFlat: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [iceAt, xenAt, creatAt, combAt, fearAt] = ["iceAt", "xenAt", "creatAt", "combAt", "fearAt"].map((k) => at(p, k));
  const tX = xenAt + XENS[0].t;
  const cam = camAt(f, [
    [0, 1900, 690, 0.56],
    [iceAt - 14, 1780, 710, 0.6],
    [iceAt + 22, 1150, 760, 0.86],
    [xenAt - 14, 1120, 740, 0.9],
    [xenAt + 22, 1250, 900, 1.15],
    [tX - 6, 1250, 905, 1.17],
    [tX + 40, 1240, 760, 0.9],
    [creatAt - 10, 1230, 750, 0.88],
    [creatAt + 20, 650, 1110, 1.22],
    [combAt - 10, 680, 1115, 1.22],
    [combAt + 20, 2080, 1010, 1.15],
    [fearAt - 10, 2090, 1010, 1.15],
    [fearAt + 45, 1650, 760, 0.56],
    [life, 1650, 720, 0.52],
  ]);
  const [, cx, cy, z] = cam;
  const W = (x: number, y: number) => [960 + (x - cx) * z, 540 + (y - cy) * z] as const;
  const fear = P(f, fearAt + 10, 30);
  const phase = 0.3 + 0.4 * cl(f / life) + fear * 0.4;

  // ---- o que vai na cena, ordenado pela profundidade (y da base)
  const items: { y: number; el: React.ReactNode }[] = [];
  items.push({ y: SHIP_Y, el: <Ship key="ship" f={f} phase={phase} /> });
  SLABS.forEach((s, i) => items.push({ y: s.y, el: <Slab key={"s" + i} s={s} i={i} f={f} iceAt={iceAt} /> }));
  XENS.forEach((r, i) => items.push({ y: r.y, el: <Xen key={"x" + i} r={r} i={i} f={f} xenAt={xenAt} /> }));
  DENS.forEach((d, i) => items.push({ y: d.y - 1, el: <Den key={"d" + i} {...d} /> }));
  ANTS.forEach((a, i) => {
    const d = DENS[a.den];
    const t = f - creatAt - a.d;
    if (t < 0) return;
    const rise = eo(t / 30);
    const walk = Math.max(0, t - 34);
    // depois do medo, todos param e se viram pro navio
    const x = d.x + a.v * walk * (1 - fear * 0.7);
    const dir = fear > 0.5 ? -1 : a.v < 0 ? 1 : -1;
    const ph = walk * 0.22 * (1 - fear);
    const y = d.y - 6 + (1 - rise) * 90;
    const id = "den" + i;
    items.push({
      y: d.y + 2,
      el: (
        <g key={"a" + i}>
          <defs>
            <clipPath id={id}>
              <rect x={d.x - 3000} y={-5000} width={6000} height={5000 + d.y - 4} />
            </clipPath>
          </defs>
          <g clipPath={rise < 1 ? `url(#${id})` : undefined}>
            <Antlion x={x} y={y} s={0.95 * d.s} ph={ph} dir={dir} wing={Math.max(0, Math.sin(t / 3 + i)) * (t % 50 < 12 ? 1 : 0)} />
          </g>
          {t < 40
            ? Array.from({ length: 12 }).map((_, q) => {
                const tt = t / 40, a2 = Math.PI + (q / 11) * Math.PI;
                return <rect key={q} x={d.x + Math.cos(a2) * 60 * tt * (1 + rnd(q))} y={d.y - 20 + Math.sin(a2) * 70 * tt + tt * tt * 60} width={6} height={6} fill={q % 3 ? "#9c8466" : "#efe6d6"} opacity={1 - tt} />;
              })
            : null}
        </g>
      ),
    });
  });
  CRABS.forEach(([x0, y0, d0, v, s], i) => {
    const t = f - creatAt - d0;
    if (t < 0) return;
    const run = t * (1 - fear * 0.85);
    const dist = v * (run - (1 - Math.exp(-run / 10)) * 10);
    items.push({ y: y0, el: <Headcrab key={"c" + i} x={x0 + dist} y={y0 - Math.abs(Math.sin(run * 0.25)) * 4} s={1.3 * s} ph={run * 0.35} dir={fear > 0.5 ? -1 : v < 0 ? 1 : -1} /> });
  });
  COMB.forEach((c, i) => {
    if (f < combAt - 10) return;
    const t = f - combAt + 40;
    const swing = Math.sin(t / 20 + c.ph);
    const look = fear > 0.5 ? 1 : swing > 0.25 ? 1 : swing < -0.25 ? -1 : 1;
    items.push({ y: c.y, el: <Combine key={"cb" + i} x={c.x} y={c.y} s={c.s} look={look} f={f} scared={fear} /> });
  });
  items.sort((a, b) => a.y - b.y);

  const crackFade = 1 - P(f, creatAt, 30);

  // ---- textos
  const s1 = W(SLABS[0].x, SLABS[0].y - slabLift(SLABS[0], f, iceAt) - 40);
  const x0 = XENS[0];
  const sx = W(x0.x + x0.rx * 0.6, x0.y - xenLift(x0, f, xenAt) - 30);
  const sd = W(DENS[1].x + 120, DENS[1].y - 330);
  const sc = W(COMB[1].x, COMB[1].y - 290);
  const fearTxt = "TUDO COM MEDO DA MESMA COISA";
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#0d1b2e" }}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        <defs>
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
        {/* fundo com paralaxe (céu e montanhas andam menos que o chão) */}
        <g transform={`translate(960 540) scale(${1 + (z - 1) * 0.3}) translate(${-(1800 + (cx - 1800) * 0.3)} ${-(560 + (cy - 700) * 0.3)})`}>
          <Sky f={f} />
        </g>
        <g transform={`translate(960 540) scale(${z}) translate(${-cx} ${-cy})`}>
          <World f={f} />
          {/* rachaduras que saem do navio */}
          {/* o gelo racha em volta do casco */}
          {crackFade > 0
            ? Array.from({ length: 9 }).map((_, i) => {
                const x = SHIP_X - 40 + i * 105, y = SHIP_Y + 16 + (i % 2) * 10;
                const b: Pt = [x + (rnd(i * 3) - 0.6) * 260, y + 60 + rnd(i * 5) * 120];
                return (
                  <g key={"cr" + i} opacity={crackFade}>
                    <Fissure a={[x, y]} b={b} w={10} seed={200 + i} k={cl((f - 6 - i * 5) / 40)} core={VIO} f={f} />
                  </g>
                );
              })
            : null}
          {/* anéis de fase saindo do navio no medo */}
          {fear > 0
            ? [0, 1, 2].map((k) => {
                const tt = ((f - fearAt + k * 25) % 75) / 75;
                return <ellipse key={k} cx={SHIP_X + 420} cy={SHIP_Y + 4} rx={300 + tt * 1500} ry={(300 + tt * 1500) * 0.18} fill="none" stroke={VIO} strokeWidth={6} opacity={fear * (1 - tt) * 0.8} />;
              })
            : null}
          {items.map((it) => it.el)}
        </g>
        {/* neve caindo na frente */}
        {Array.from({ length: 140 }).map((_, i) => {
          const sp = 0.6 + rnd(i * 3) * 1.4;
          const x = ((rnd(i * 7) * 2100 + f * (1.4 + sp) - cx * z * 0.2) % 2100 + 2100) % 2100 - 90;
          const y = ((rnd(i * 11) * 1200 + f * sp * 2.2) % 1200) - 60;
          return <circle key={i} cx={x} cy={y} r={1 + sp * 1.3} fill="#f2f8ff" opacity={0.35 + 0.35 * rnd(i)} />;
        })}
      </svg>
      {/* o navio brilha violeta no medo */}
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 45% 35% at ${(W(SHIP_X + 420, SHIP_Y)[0] / 19.2).toFixed(1)}% ${(W(SHIP_X + 420, SHIP_Y - 150)[1] / 10.8).toFixed(1)}%, rgba(196,156,255,${0.3 * fear}), rgba(0,0,0,0) 70%)`, pointerEvents: "none" }} />
      <Label x={s1[0] + 150} y={s1[1] - 120} text="PEDAÇOS DE GELO SOBEM" sub="E DEIXAM O BURACO NO CHÃO" col="#bfe8ff" o={P(f, iceAt + 40, 12) * (1 - P(f, xenAt - 14, 10))} />
      <Label x={sx[0] + 60} y={sx[1] - 110} text="FRAGMENTO DE XEN" sub="PRESO NA TERRA DESDE A TEMPESTADE DE PORTAL" col="#8dffa8" o={P(f, xenAt + 30, 12) * (1 - P(f, tX - 10, 8))} />
      <Label x={sx[0] + 60} y={sx[1] - 110} text="ARRANCADO" sub="FICA A CRATERA" col="#8dffa8" o={P(f, tX + 26, 12) * (1 - P(f, creatAt - 14, 10))} />
      <Label x={sd[0]} y={sd[1]} text="ANTLIONS SAEM DAS TOCAS" sub="SEM ATACAR · OS HEADCRABS FOGEM" col="#ffd9a0" o={P(f, creatAt + 34, 12) * (1 - P(f, combAt - 14, 10))} align="center" />
      <Label x={sc[0]} y={sc[1]} text="COMBINE SEM ALVO" sub="CONTRA QUEM ESTÃO LUTANDO?" col="#9fe6ff" o={P(f, combAt + 30, 12) * (1 - P(f, fearAt - 10, 10))} align="center" />
      {f >= fearAt ? (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 140, textAlign: "center", fontFamily: MONO, fontSize: 46, letterSpacing: 12, color: "#e6dcff" }}>
          {fearTxt.split("").map((ch, k) => {
            const t = fearAt + 30 + k * 1.2;
            return (
              <span key={k} style={{ opacity: P(f, t, 8), textShadow: "0 3px 16px rgba(0,0,0,0.95), 0 0 18px rgba(180,140,255,0.45)" }}>
                {ch}
              </span>
            );
          })}
        </div>
      ) : null}
      <AbsoluteFill style={{ background: "#000", opacity: interpolate(f, [0, 8], [1, 0], C) + interpolate(f, [life - 6, life], [0, 1], C), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};
