import React, { useLayoutEffect, useRef } from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";

// 3C · A FOGUEIRA como DIORAMA ISOMÉTRICO em pixel art (estilo Habbo / @brullov_art): um pedaço de chão nevado
// recortado, flutuando no escuro, com o bloco de terra à mostra; em cima o acampamento — fogueira, barracas,
// pinheiros, caixotes com rádio — e os personagens em sprites detalhados (3 tons + contorno por material).
// Tudo desenhado por código num quadro de 320×180; a câmera mostra um RECORTE ampliado em escala inteira (×6 plano
// aberto, ×12 plano fechado), então o pixel fica sempre nítido. Animação em degraus de 10 quadros/s.
// Gordon sempre DE COSTAS. Tudo é função pura do quadro. Tempos em QUADROS.

const W = 320;
const H = 180;
type RGB = [number, number, number];
const hex = (h: string): RGB => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
const bay = (x: number, y: number) => BAYER[(y & 3) * 4 + (x & 3)];
const rnd = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// ---------------------------------------------------------------- paleta dos sprites (char → cor)
const PAL: Record<string, string> = {
  "0": "#120e14",
  // pele clara (Varga)
  a: "#f0c49a", b: "#d49a70", c: "#a8704c", d: "#6e4430", e: "#1a1210",
  // barba grisalha
  g: "#c8c2b8", h: "#948e86", i: "#625c56",
  // gorro de lã
  m: "#6e6c4c", n: "#4c4a34", o: "#302f20",
  // jaqueta militar
  p: "#86964e", q: "#5e6e38", r: "#3c4824",
  // braçadeira
  y: "#e8c848", Y: "#a88a20",
  // calça
  t: "#56627c", u: "#3e485e", v: "#272e3e",
  // botas
  w: "#64482e", x: "#3e2c1c",
  // Gordon: cabelo
  A: "#86522c", B: "#5e3820", C: "#3c2414",
  // HEV laranja / cinza / preto
  D: "#f4a444", F: "#d4742a", G: "#9a4a1a", I: "#b8c0cc", J: "#848d9a", K: "#5a616e", L: "#393e48", M: "#23262d",
  // Eli
  N: "#a47c4a", O: "#7c5a34", P: "#4e3a22", Q: "#dedad2", R: "#8e2a2a", S: "#2c2c32", T: "#94603e", U: "#704430", V: "#4a2c1c",
  W: "#50505a", X: "#36363e", Z: "#aab2ba", "1": "#646c78",
  // Vortigaunt
  "2": "#a4845a", "3": "#7c5e3e", "4": "#523e28", "5": "#30241a", "6": "#ff4a2a", "7": "#9cffb4", "8": "#3ad070",
};
const PC: Record<string, RGB> = Object.fromEntries(Object.entries(PAL).map(([k, v]) => [k, hex(v)]));

const pad = (rows: string[]) => {
  const w = Math.max(...rows.map((r) => r.length));
  return rows.map((r) => r.padEnd(w, "."));
};
const swap = (base: string[], rows: Record<number, string>) => pad(base.map((r, i) => rows[i] ?? r));
const mirror = (half: string[]) => half.map((r) => r + r.split("").reverse().join(""));

// Varga sentado, de frente (3/4), gorro, barba grisalha, jaqueta militar com braçadeira
const VARGA = pad([
  ".......000000.......",
  "......0nmmmmn0......",
  ".....0nmmmmmmmn0....",
  ".....0nmnmnmnmn0....",
  ".....0oooooooooo0...",
  ".....0iaaaaaaaab0...",
  ".....0iabbaaabba0...",
  ".....0iaeaaaeaab0...",
  ".....0icaaabacab0...",
  ".....0ihaaaaaahh0...",
  "......0hgggdgggh0...",
  "......0hgggggghi0...",
  ".......0ihhhhii0....",
  ".....00rqqqqqqr00...",
  "....0rqpqqqqqqpqr0..",
  "...0rqppqqrqqqppqr0.",
  "...0ryyqqqrqqqqpqr0.",
  "...0rYYqqqrqqqqqqr0.",
  "...0rqqqqrrqqqqqqr0.",
  "...0rqqbbqrqqqqbbr0.",
  "....0rbaarqqqrbaar0.",
  "....0uttttttttttttu0",
  "....0uttttttttttttu0",
  "....0vuuuuuuuuuuuuv0",
  ".....0vvtt0..0ttvv0.",
  ".....0ttu0....0ttu0.",
  ".....0ttu0....0ttu0.",
  ".....0xwwx0...0wwx0.",
  "....0xwwwx0..0xwwwx0",
  "....00000000.0000000",
]);
// falando: mão direita no ar, boca aberta
const VARGA_T1 = swap(VARGA, {
  10: "......0hggdddggh0...",
  15: "...0rqppqqrqqqppqr0.....",
  16: "...0ryyqqqrqqqqpq00ba0..",
  17: "...0rYYqqqrqqqqq0qbb0...",
  18: "...0rqqqqrrqqqq0qq0.....",
  19: "...0rqqbbqrqqqqqr0......",
  20: "....0rbaarqqqqqr0.......",
});
const VARGA_T2 = swap(VARGA, {
  10: "......0hgg0d0ggh0...",
  14: "....0rqpqqqqqqpqr00ba0..",
  15: "...0rqppqqrqqqppq0bb0...",
  16: "...0ryyqqqrqqqqq0q0.....",
  17: "...0rYYqqqrqqqqr0.......",
  18: "...0rqqqqrrqqqqr0.......",
  19: "...0rqqbbqrqqqqqr0......",
  20: "....0rbaarqqqqqr0.......",
});
// silêncio: olhos para baixo (no fogo)
const VARGA_Q = swap(VARGA, {
  6: ".....0iaaaaaaaab0...",
  7: ".....0iabbaaabba0...",
  8: ".....0iaeaaaeaab0...",
});

// Gordon sentado de COSTAS: cabelo castanho, nuca, HEV (ombreiras cinza, painéis laranja, coluna preta, mochila)
const GORDON = pad(
  mirror([
    "......0000",
    ".....0BAAA",
    "....0BAAAA",
    "....0BAAAA",
    "....0BAAAA",
    "....0CBAAA",
    "...0bCBBAA",
    "...0cCCBBB",
    "....0cCCCC",
    ".....0Mbbb",
    "...000MMMM",
    "..0JII0MMM",
    ".0JIIIJ0MK",
    "0KJIIIJK0K",
    "0KJJJJK0FD",
    "0LKKKK0FDD",
    ".0LDD0MFDD",
    ".0DFG0MGFF",
    ".0LKK0MMGG",
    ".0LKK0MMMM",
    "..0LL0MMMM",
    "..00K0LMMM",
    "...00LMMMM",
    "....000000",
  ]),
);
// respiração: o corpo desce 1 px
const GORDON_B = [GORDON[0].replace(/./g, "."), ...GORDON.slice(0, GORDON.length - 1)];

// Eli de pé, 3/4: gorro preto, barba, sobretudo de tweed, camisa e gravata, perna mecânica (à direita da tela)
const ELI = pad([
  "......00000.......",
  ".....0SSSSS0......",
  "....0SSSSSSS0.....",
  "....0SSSSSSS0.....",
  "....0VTTTTTTV0....",
  "....0TTUTTTUT0....",
  "....0TeTTTeTT0....",
  "....0TTTTUTTT0....",
  "....0hTTTTTTh0....",
  "....0hgUUUggh0....",
  ".....0hgggghh0....",
  "......0hhhh0......",
  "....00OQRQO00.....",
  "...0PONQRQNOP0....",
  "..0PONNQRQNNOP0...",
  "..0PONNNRNNNOP0...",
  "..0PONNNRNNNOP0...",
  "..0PONNNNNNNOP0...",
  "..0POONNNNNOOP0...",
  "..0TPONNNNNOPT0...",
  "..0UPONNNNNOPU0...",
  "...0PONNNNNOP0....",
  "...0POONNNOOP0....",
  "....0WWWWWWWW0....",
  "....0WWXX0WWX0....",
  "....0WWX0.0ZZ0....",
  "....0WWX0.0Z10....",
  "....0WWX0..0Z0....",
  "....0WWX0..0Z0....",
  "....0WWX0..010....",
  "....0xwx0..0Z0....",
  "...0xwwx0.0x1x0...",
  "...00000..00000...",
]);
// Eli olhando para o Varga (cabeça vira 1 px)
const ELI_B = swap(ELI, { 6: "....0eTTTeTTT0....", 9: "....0hgUUUhgh0...." });

// Vortigaunt curvado, olho vermelho, dedos compridos
const VORT = pad([
  "........000.........",
  ".......03330........",
  "......0322230.......",
  "......0326223.......",
  "......0322230.......",
  ".......03330........",
  "........0230........",
  ".......02230........",
  "....000322230000....",
  "...033222222223330..",
  "..0332223322232330..",
  "..0430223322230340..",
  ".0430.0322230.0340..",
  ".040..0322230..040..",
  ".040..0332330..040..",
  "0440..0433340..0440.",
  "020...0433340...020.",
  "0.0...0433340...0.0.",
  ".....04333340.......",
  ".....0433.3340......",
  "....0433...3340.....",
  "....043.....340.....",
  "....043.....340.....",
  ".....043...340......",
  ".....043...340......",
  "....0430...0340.....",
  "...04400...00440....",
  "...0000.....0000....",
]);

// ---------------------------------------------------------------- framebuffer
type FB = Uint8ClampedArray;
const put = (fb: FB, x: number, y: number, c: RGB) => {
  x = Math.round(x);
  y = Math.round(y);
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 4;
  fb[i] = c[0];
  fb[i + 1] = c[1];
  fb[i + 2] = c[2];
  fb[i + 3] = 255;
};
const mix = (a: RGB, b: RGB, k: number): RGB => [Math.round(a[0] + (b[0] - a[0]) * k), Math.round(a[1] + (b[1] - a[1]) * k), Math.round(a[2] + (b[2] - a[2]) * k)];
const FIREC: RGB = [255, 150, 60];
const NIGHT: RGB = [14, 20, 40];

// sprite com luz: `warm` = quanto o fogo esquenta (0..1) e de que lado (`side` +1 = fogo à direita do sprite);
// `night` = quanto o lado longe do fogo afunda no azul da noite
const sprite = (fb: FB, s: string[], ax: number, ay: number, o: { warm: number; side: number; night: number }) => {
  const w = s[0].length;
  const x0 = Math.round(ax - w / 2);
  const y0 = Math.round(ay - s.length);
  for (let y = 0; y < s.length; y++)
    for (let x = 0; x < w; x++) {
      const ch = s[y][x];
      if (ch === "." || ch === " ") continue;
      let c = PC[ch];
      if (!c) continue;
      const k = o.side > 0 ? x / w : 1 - x / w; // 1 = lado do fogo
      c = mix(c, NIGHT, o.night * (1 - k) * 0.8);
      if (ch !== "0") c = mix(c, mix(c, FIREC, 0.55), o.warm * Math.pow(k, 1.5));
      // aro aceso: borda do lado do fogo
      const nx = x + o.side;
      if (ch !== "0" && o.warm > 0.2 && (nx < 0 || nx >= w || s[y][nx] === "." || s[y][nx] === "0") && bay(x0 + x, y0 + y) < o.warm) c = mix(c, [255, 200, 130], 0.45);
      put(fb, x0 + x, y0 + y, c);
    }
};

// polígono convexo preenchido em scanline (sem antisserrilhado)
const poly = (fb: FB, pts: [number, number][], col: (x: number, y: number) => RGB | null) => {
  let y0 = Infinity;
  let y1 = -Infinity;
  for (const [, y] of pts) {
    y0 = Math.min(y0, y);
    y1 = Math.max(y1, y);
  }
  for (let y = Math.ceil(y0); y <= Math.floor(y1); y++) {
    let xa = Infinity;
    let xb = -Infinity;
    for (let i = 0; i < pts.length; i++) {
      const [ax, ay] = pts[i];
      const [bx, by] = pts[(i + 1) % pts.length];
      if ((y < ay && y < by) || (y > ay && y > by) || ay === by) {
        if (ay === by && ay === y) {
          xa = Math.min(xa, ax, bx);
          xb = Math.max(xb, ax, bx);
        }
        continue;
      }
      const x = ax + ((y - ay) / (by - ay)) * (bx - ax);
      xa = Math.min(xa, x);
      xb = Math.max(xb, x);
    }
    for (let x = Math.round(xa); x <= Math.round(xb); x++) {
      const c = col(x, y);
      if (c) put(fb, x, y, c);
    }
  }
};

// ---------------------------------------------------------------- mundo isométrico
const OX = 160;
const OY = 40;
const N = 92; // lado do bloco de chão
let BOB = 0;
const iso = (u: number, v: number, z = 0): [number, number] => [OX + (u - v), OY + BOB + (u + v) / 2 - z];
const FU = 47;
const FV = 46;

const SNOW = ["#eef3f9", "#d2dcea", "#aebcd2", "#8496b4", "#5e6e8e"].map(hex);
const SOIL = { lip: hex("#c8d4e4"), ice: hex("#9cc4dc"), dirtL: hex("#5a4232"), dirtD: hex("#3e2c22"), rockL: hex("#6a6e7a"), rockD: hex("#464a56"), deep: hex("#2a2c36"), root: hex("#2e2018") };
const WARM = ["#f6c58a", "#e8a070", "#c88068"].map(hex);

const drawIsland = (fb: FB, flick: number) => {
  const T = 24; // espessura
  // face esquerda (abaixo da aresta v = N) e direita (abaixo da aresta u = N)
  const L0 = iso(0, N);
  const L1 = iso(N, N);
  const R0 = iso(N, 0);
  const bottom = (x: number, base: number) => base + T + Math.round(Math.sin(x * 0.7) * 1.5 + (rnd(x * 3) > 0.7 ? 2 : 0));
  for (let x = Math.floor(L0[0]); x <= L1[0]; x++) {
    const ty = L0[1] + (x - L0[0]) / 2;
    const by = bottom(x, ty);
    for (let y = Math.ceil(ty); y <= by; y++) {
      const d = y - ty;
      let c = d < 2 ? SOIL.lip : d < 3 ? SOIL.ice : d < 10 ? (bay(x, y) < 0.18 ? SOIL.root : SOIL.dirtL) : d < 17 ? (rnd(Math.floor(x / 3) * 7 + Math.floor(y / 2)) > 0.6 ? SOIL.rockL : SOIL.dirtL) : SOIL.rockL;
      if (d >= 10 && d < 11) c = SOIL.dirtD;
      if (y === by) c = SOIL.deep;
      put(fb, x, y, c);
    }
    // pingentes de gelo embaixo da beira de neve
    if (rnd(x * 7) > 0.8) for (let k = 0; k < 2 + Math.floor(rnd(x) * 3); k++) put(fb, x, ty + 3 + k, SOIL.ice);
  }
  for (let x = Math.ceil(L1[0]); x <= R0[0]; x++) {
    const ty = L1[1] - (x - L1[0]) / 2;
    const by = bottom(x, ty);
    for (let y = Math.ceil(ty); y <= by; y++) {
      const d = y - ty;
      let c = d < 2 ? mix(SOIL.lip, NIGHT, 0.25) : d < 3 ? SOIL.ice : d < 10 ? (bay(x, y) < 0.18 ? SOIL.root : SOIL.dirtD) : d < 17 ? (rnd(Math.floor(x / 3) * 11 + Math.floor(y / 2)) > 0.6 ? SOIL.rockD : SOIL.dirtD) : SOIL.rockD;
      if (y === by) c = SOIL.deep;
      put(fb, x, y, c);
    }
    if (rnd(x * 13) > 0.82) for (let k = 0; k < 2 + Math.floor(rnd(x * 2) * 3); k++) put(fb, x, ty + 3 + k, mix(SOIL.ice, NIGHT, 0.3));
  }
  // topo de neve: claro, com sombras de monte e a poça quente do fogo
  const [fx, fy] = iso(FU, FV);
  poly(fb, [iso(0, 0), iso(N, 0), iso(N, N), iso(0, N)], (x, y) => {
    let t = 0.9 + (y - OY) / 70 + (x - OX) / 260;
    // pegadas entre as barracas e o fogo
    if (rnd(Math.floor(x / 2) * 17 + Math.floor(y) * 5) > 0.985) return SNOW[3];
    const dx = x - fx;
    const dy = (y - fy) * 2;
    const d = Math.hypot(dx, dy);
    // chão derretido em volta do fogo
    if (d < 13) return d < 9 ? hex("#3a2a24") : bay(x, y) < (13 - d) / 4 ? hex("#5a4038") : WARM[2];
    const wv = Math.max(0, 1 - d / (44 * flick)) * 3.2;
    if (wv > 0.2) {
      const wi = Math.min(2, Math.floor(3 - wv));
      if (bay(x, y) < wv) return WARM[Math.max(0, wi)];
    }
    t = Math.max(0, Math.min(SNOW.length - 1, t));
    const i = Math.floor(t);
    const fr = t - i;
    return SNOW[Math.min(SNOW.length - 1, i + (fr > 0.6 ? 1 : fr < 0.4 ? 0 : bay(x, y) < (fr - 0.4) / 0.2 ? 1 : 0))];
  });
  // beira da neve: linha clara nas arestas da frente
  for (let u = 0; u <= N; u++) {
    const [x, y] = iso(u, N);
    put(fb, x, y, SNOW[0]);
    const [x2, y2] = iso(N, u);
    put(fb, x2, y2, SNOW[1]);
  }
};

// pinheiro isométrico: camadas em triângulo, lado esquerdo (lua) mais claro, neve nas pontas
const PINE = [hex("#2e5a46"), hex("#1e4032"), hex("#12281f"), hex("#dfe8f2"), hex("#9fb2c8"), hex("#3a2618")];
const pine = (fb: FB, u: number, v: number, h: number, seed: number) => {
  const [cx, by] = iso(u, v);
  // sombra no chão
  for (let k = 0; k < 6; k++) put(fb, cx + 1 + k, by + 1, SNOW[3]);
  put(fb, cx, by, PINE[5]);
  put(fb, cx, by - 1, PINE[5]);
  const tiers = Math.max(3, Math.round(h / 7));
  for (let y = 0; y < h - 2; y++) {
    const ty = y / (h - 2);
    const tier = (ty * tiers) % 1;
    const half = Math.round((0.45 + 0.55 * tier) * (h * 0.32) * Math.pow(ty, 0.85));
    const yy = by - h + y;
    for (let dx = -half; dx <= half; dx++) {
      if (Math.abs(dx) === half && rnd(seed * 31 + y * 7 + dx) > 0.5) continue;
      const side = dx < -half * 0.2 ? 0 : dx < half * 0.4 ? 1 : 2;
      let c = PINE[side];
      if (tier < 0.28 && rnd(seed + y * 13 + dx * 3) < 0.7) c = side === 2 ? PINE[4] : PINE[3];
      put(fb, cx + dx, yy, c);
    }
  }
};

// barraca em A ao longo de u: encosta esquerda + empena da frente com a porta (luz quente lá dentro)
const TENT = { lit: hex("#8a9456"), mid: hex("#646e3c"), dark: hex("#3e4626"), door: hex("#1a1410"), glow: hex("#c8783a"), snow: hex("#dfe8f2") };
const tent = (fb: FB, u0: number, u1: number, v0: number, v1: number, hh: number, glow: number) => {
  const vm = (v0 + v1) / 2;
  // encosta de trás (direita) — quase não aparece
  poly(fb, [iso(u0, vm, hh), iso(u1, vm, hh), iso(u1, v0), iso(u0, v0)], () => TENT.dark);
  // encosta da esquerda (lado v1, virada para a tela)
  poly(fb, [iso(u0, vm, hh), iso(u1, vm, hh), iso(u1, v1), iso(u0, v1)], (x, y) => (bay(x, y) < 0.12 ? TENT.mid : TENT.lit));
  // neve em cima da cumeeira
  for (let u = u0; u <= u1; u++) {
    const [x, y] = iso(u, vm, hh);
    put(fb, x, y, TENT.snow);
    put(fb, x - 1, y + 1, TENT.snow);
  }
  // empena da frente (u1)
  poly(fb, [iso(u1, v0), iso(u1, vm, hh), iso(u1, v1)], () => TENT.mid);
  const [px, py] = iso(u1, vm, hh * 0.62);
  const [ax, ay] = iso(u1, vm - 3);
  const [bx, byy] = iso(u1, vm + 3);
  poly(fb, [[ax, ay], [px, py], [bx, byy]], (x, y) => (bay(x, y) < glow ? TENT.glow : TENT.door));
};

// caixote isométrico (cubo com tábuas)
const crate = (fb: FB, u: number, v: number, s: number, z = 0) => {
  const top = hex("#b08a56");
  const left = hex("#8a6a40");
  const right = hex("#5e4628");
  const line = hex("#3e2c1a");
  poly(fb, [iso(u, v, z + s), iso(u + s, v, z + s), iso(u + s, v + s, z + s), iso(u, v + s, z + s)], (x, y) => (bay(x, y) < 0.06 ? line : top));
  poly(fb, [iso(u, v + s, z + s), iso(u + s, v + s, z + s), iso(u + s, v + s, z), iso(u, v + s, z)], (x, y) => ((y + Math.round(x / 2)) % 4 === 0 ? line : left));
  poly(fb, [iso(u + s, v, z + s), iso(u + s, v + s, z + s), iso(u + s, v + s, z), iso(u + s, v, z)], (x, y) => ((y - Math.round(x / 2)) % 4 === 0 ? line : right));
};

// tronco deitado ao longo de u (casca escura, ponta clara virada para a tela)
const log = (fb: FB, u0: number, u1: number, v: number, r: number) => {
  const bark = [hex("#8a5a32"), hex("#6a4224"), hex("#42281a")];
  for (let u = u0; u <= u1; u += 0.5) {
    const [x, y] = iso(u, v);
    for (let k = 0; k < r * 2; k++) put(fb, x, y - k, bark[k < r * 0.6 ? 2 : k < r * 1.3 ? 1 : 0]);
    put(fb, x, y - r * 2, hex("#dfe8f2"));
  }
  const [ex, ey] = iso(u1, v);
  for (let dy = 0; dy < r * 2; dy++) for (let dx = 0; dx < 2; dx++) put(fb, ex + dx, ey - dy, dy === 0 || dy === r * 2 - 1 ? hex("#a07240") : hex("#c89a62"));
};

// fogo do Doom (função pura do passo)
const FW = 16;
const FH = 22;
const FIRE = ["#000000", "#2a0a04", "#5e1606", "#9a2a08", "#d0480e", "#f07a1a", "#ffb43a", "#ffe08a", "#fff6d6"].map(hex);
const fireGrid = (steps: number) => {
  const g = new Uint8Array(FW * FH);
  let s = 7;
  const r = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const top = FIRE.length - 1;
  for (let k = 0; k < steps; k++) {
    for (let x = 0; x < FW; x++) {
      const m = 1 - Math.abs(x - (FW - 1) / 2) / (FW / 2);
      g[(FH - 1) * FW + x] = m > 0.3 ? Math.min(top, Math.round(top * Math.min(1, m * 1.6) * (0.72 + r() * 0.28))) : 0;
    }
    for (let y = 1; y < FH; y++)
      for (let x = 0; x < FW; x++) {
        const src = y * FW + x;
        const val = g[src];
        if (val === 0) {
          g[src - FW] = 0;
          continue;
        }
        const rr = Math.floor(r() * 3.2);
        const dst = src - FW - rr + 1;
        if (dst >= 0) g[dst] = Math.max(0, val - (rr & 1) - (r() < 0.22 ? 1 : 0));
      }
  }
  return g;
};

type Thing = { depth: number; draw: () => void };

const render = (fb: FB, f: number, talkAt: number, talkEndAt: number, quietAt: number) => {
  const step = Math.floor(f / 3);
  const ts = step / 10;
  const flick = 0.86 + 0.08 * Math.sin(ts * 11.3) + 0.06 * (rnd(Math.floor(f / 2)) - 0.5) * 2;
  // fundo: noite com degradê em faixas e estrelas
  const SKY = ["#05070d", "#080c16", "#0c1220", "#10182a"].map(hex);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const t = (y / H) * (SKY.length - 1) * 1.1;
      const i = Math.min(SKY.length - 1, Math.floor(t));
      const fr = t - i;
      put(fb, x, y, SKY[Math.min(SKY.length - 1, i + (fr > 0.6 ? 1 : fr < 0.4 ? 0 : bay(x, y) < (fr - 0.4) / 0.2 ? 1 : 0))]);
    }
  // aurora discreta no alto
  const AUR = ["#0f2e2a", "#17483c", "#22704f", "#3fae7e"].map(hex);
  for (let x = 0; x < W; x++) {
    const c0 = 22 + Math.round(Math.sin(x * 0.03 + ts * 0.12) * 6 + Math.sin(x * 0.1 + ts * 0.25) * 2);
    const len = 12 + Math.round(4 * Math.sin(x * 0.05 + 1 + ts * 0.1));
    const ray = 0.55 + 0.45 * Math.sin(x * 0.8 + Math.sin(x * 0.12) * 3 + ts * 0.5);
    for (let y = c0 - len; y < c0 + 2; y++) {
      if (y < 0) continue;
      const v = (y < c0 ? (y - (c0 - len)) / len : 1 - (y - c0) / 2) * ray * Math.sin(Math.PI * Math.min(1, Math.max(0, (x - 20) / 280)));
      const lvl = v * 3.2;
      const li = Math.floor(lvl);
      if (li <= 0 && bay(x, y) > lvl) continue;
      put(fb, x, y, AUR[Math.min(3, Math.max(0, li - (bay(x, y) > lvl - li ? 1 : 0)))]);
    }
  }
  for (let i = 0; i < 90; i++) {
    const x = Math.floor(rnd(i * 3) * W);
    const y = Math.floor(rnd(i * 5) * H * 0.7);
    const tw = rnd(i * 7 + Math.floor(ts * (1 + rnd(i) * 2)));
    put(fb, x, y, hex(tw > 0.85 ? "#e6ecff" : tw > 0.4 ? "#8a96bc" : "#4a5272"));
  }

  BOB = Math.floor(ts / 1.3) % 2;
  drawIsland(fb, flick);

  // tudo em cima do bloco, desenhado de trás para a frente (u + v)
  const things: Thing[] = [];
  const add = (u: number, v: number, draw: () => void) => things.push({ depth: u + v, draw });
  for (const [u, v, h, sd] of [
    [4, 30, 40, 1],
    [3, 52, 34, 2],
    [6, 72, 28, 3],
    [24, 4, 36, 4],
    [46, 3, 42, 5],
    [70, 6, 30, 6],
    [12, 12, 46, 7],
    [86, 18, 24, 8],
    [10, 84, 22, 9],
  ])
    add(u, v, () => pine(fb, u, v, h, sd));
  add(14 + 14, 18 + 8, () => tent(fb, 12, 26, 18, 34, 16, 0.35 * flick));
  add(60 + 14, 14 + 8, () => tent(fb, 62, 74, 10, 24, 13, 0.25 * flick));
  add(14 + 7, 44 + 7, () => {
    crate(fb, 12, 42, 7);
    crate(fb, 12, 42, 6, 7);
  });
  add(22 + 6, 52 + 6, () => crate(fb, 20, 52, 6));
  // rádio em cima dos caixotes: luzinha que pisca
  add(22, 52, () => {
    const [x, y] = iso(15, 45, 13);
    for (let dy = 0; dy < 4; dy++) for (let dx = -2; dx <= 2; dx++) put(fb, x + dx, y - dy, dy === 0 ? hex("#2a2c30") : hex("#4a4e56"));
    put(fb, x + 1, y - 2, step % 10 < 5 ? hex("#ff5a3a") : hex("#5a2a20"));
    for (let k = 0; k < 14; k++) put(fb, x - 2, y - 4 - k, hex("#8a8e96"));
  });
  const bag = (u: number, v: number, col: string, dark: string) =>
    add(u + 4, v + 2, () => {
      poly(fb, [iso(u, v, 2), iso(u + 9, v, 2), iso(u + 9, v + 4, 2), iso(u, v + 4, 2)], (x, y) => (bay(x, y) < 0.1 ? hex(dark) : hex(col)));
      poly(fb, [iso(u, v + 4, 2), iso(u + 9, v + 4, 2), iso(u + 9, v + 4), iso(u, v + 4)], () => hex(dark));
      poly(fb, [iso(u, v, 3), iso(u + 2, v, 3), iso(u + 2, v + 4, 3), iso(u, v + 4, 3)], () => hex("#c8c0b0"));
    });
  bag(36, 70, "#8a3a2a", "#5a2218");
  bag(50, 72, "#3a5a8a", "#22385a");
  add(76, 62, () => {
    for (let k = 0; k < 3; k++) log(fb, 72, 80, 60 + k * 2, 1);
    log(fb, 73, 79, 61, 1);
  });
  // troncos de sentar
  add(33, 57, () => log(fb, 27, 39, 57, 2));
  add(66, 48, () => log(fb, 60, 72, 48, 2));
  // fogueira
  const g = fireGrid(Math.floor(f / 2) + 30);
  add(FU, FV, () => {
    const [cx, cy] = iso(FU, FV);
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      put(fb, cx + Math.round(Math.cos(a) * 7), cy + Math.round(Math.sin(a) * 3.5), hex(Math.sin(a) > 0 ? "#7a7270" : "#4a4444"));
    }
    for (let k = -5; k <= 5; k++) {
      put(fb, cx + k, cy - 1 + Math.round(k * 0.3), hex("#4a2a16"));
      put(fb, cx + k, cy - 1 - Math.round(k * 0.3), hex("#6a3a1c"));
    }
    for (let y = 0; y < FH; y++)
      for (let x = 0; x < FW; x++) {
        const val = g[y * FW + x];
        if (val > 1) put(fb, cx - FW / 2 + x, cy - FH + y + 1, FIRE[val]);
      }
  });
  // personagens
  const talking = f >= talkAt && f < talkEndAt;
  const quiet = f >= quietAt;
  const vs = talking ? [VARGA_T1, VARGA, VARGA_T2, VARGA][Math.floor(f / 4) % 4] : quiet ? VARGA_Q : VARGA;
  add(33, 57.5, () => {
    const [x, y] = iso(33, 57);
    sprite(fb, vs, x, y + 4 + (!talking && Math.floor(step / 7) % 2 ? 1 : 0), { warm: 0.7 * flick, side: 1, night: 0.5 });
  });
  add(66, 48.5, () => {
    const [x, y] = iso(66, 48);
    sprite(fb, Math.floor(step / 9) % 2 ? GORDON_B : GORDON, x, y + 2, { warm: 0.55 * flick, side: -1, night: 0.6 });
  });
  add(60, 31, () => {
    const [x, y] = iso(60, 31);
    sprite(fb, talking || quiet ? ELI_B : ELI, x, y + 1, { warm: 0.5 * flick, side: -1, night: 0.55 });
  });
  add(27, 36, () => {
    const [x, y] = iso(27, 36);
    const sw = Math.floor(step / 6) % 2;
    sprite(fb, VORT, x + sw, y + 1, { warm: 0.4 * flick, side: 1, night: 0.7 });
    // estalos verdes entre os dedos (a cada ~3 s, por meio segundo)
    const ph = step % 30;
    if (ph < 5) {
      const hx = x + sw + 8;
      const hy = y + 1 - 11;
      for (let k = 0; k < 6; k++) {
        const ex = hx + Math.round((rnd(step * 7 + k) - 0.5) * 5);
        const ey = hy + Math.round((rnd(step * 11 + k) - 0.5) * 5);
        put(fb, ex, ey, PC[k % 2 ? "7" : "8"]);
      }
      put(fb, hx, hy, PC["7"]);
    }
  });
  things.sort((a, b) => a.depth - b.depth);
  for (const t of things) t.draw();

  // fagulhas e fumaça
  const [cx, cy] = iso(FU, FV);
  for (let i = 0; i < 16; i++) {
    const per = 1.4 + rnd(i * 3) * 1.4;
    const a = ((ts + rnd(i * 7) * per) % per) / per;
    if (a > 0.9) continue;
    const x = cx + Math.round((rnd(i * 11) - 0.5) * 6 + Math.sin(a * 7 + i) * 3 * a + a * a * 6);
    const y = cy - 16 - Math.round(a * (26 + rnd(i * 5) * 16));
    put(fb, x, y, FIRE[a < 0.15 ? 8 : a < 0.4 ? 7 : a < 0.65 ? 6 : 4]);
  }
  for (let i = 0; i < 10; i++) {
    const a = ((ts + (i / 10) * 3) % 3) / 3;
    const x = cx + Math.round(Math.sin(a * 4 + i) * 3 + a * 9);
    const y = cy - 24 - Math.round(a * 26);
    if (bay(x, y) < 0.5 * (1 - a)) put(fb, x, y, hex("#2e3036"));
  }
  // neve caindo
  for (let i = 0; i < 110; i++) {
    const x = Math.floor((((rnd(i * 3) * (W + 20) + ts * 3 + Math.sin(ts * 0.8 + i) * 2) % (W + 20)) + W + 20) % (W + 20)) - 10;
    const y = Math.floor((rnd(i * 5) * H + ts * (i % 3 === 0 ? 11 : 6)) % H);
    put(fb, x, y, hex(i % 3 === 0 ? "#e8eef6" : "#8e9cb8"));
  }
};

// planos: recorte do quadro 320×180 em escala inteira (×6 = tudo; ×8 = 240×135; ×12 = 160×90)
type Shot = { at: number; s: 6 | 8 | 12; x: number; y: number; x2?: number; y2?: number };
const SHOTS: Record<string, Omit<Shot, "at">> = {
  wide: { s: 6, x: 0, y: 0 },
  mid: { s: 8, x: 40, y: 18, x2: 46, y2: 24 },
  close: { s: 12, x: 94, y: 42, x2: 102, y2: 40 },
};

export const HLIsoCamp: React.FC<{ life: number; shots?: { cam: string; at: number }[]; talkAt?: number; talkEndAt?: number; quietAt?: number }> = ({ life, shots, talkAt = 1e9, talkEndAt = 1e9, quietAt = 1e9 }) => {
  const f = useCurrentFrame();
  const ref = useRef<HTMLCanvasElement>(null);
  const off = useRef<HTMLCanvasElement | null>(null);
  useLayoutEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    if (!off.current) {
      off.current = document.createElement("canvas");
      off.current.width = W;
      off.current.height = H;
    }
    const octx = off.current.getContext("2d")!;
    const img = octx.createImageData(W, H);
    render(img.data, f, talkAt, talkEndAt, quietAt);
    octx.putImageData(img, 0, 0);
    // plano atual
    const list = shots && shots.length ? shots : [{ cam: "wide", at: 0 }];
    let i = 0;
    for (let k = 0; k < list.length; k++) if (f >= list[k].at) i = k;
    const sh = SHOTS[list[i].cam] ?? SHOTS.wide;
    const s0 = list[i].at;
    const s1 = list[i + 1]?.at ?? life;
    const k = interpolate(f, [s0, Math.max(s0 + 1, s1)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.sin) });
    // a câmera anda em pixels inteiros do quadro pequeno (nada de meio pixel)
    const sx = Math.round(sh.x + ((sh.x2 ?? sh.x) - sh.x) * k);
    const sy = Math.round(sh.y + ((sh.y2 ?? sh.y) - sh.y) * k);
    const ctx = cv.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(off.current, sx, sy, 1920 / sh.s, 1080 / sh.s, 0, 0, 1920, 1080);
  }, [f, life, shots, talkAt, talkEndAt, quietAt]);
  return (
    <AbsoluteFill style={{ background: "#05070d" }}>
      <canvas ref={ref} width={1920} height={1080} style={{ width: "100%", height: "100%", imageRendering: "pixelated" }} />
    </AbsoluteFill>
  );
};
