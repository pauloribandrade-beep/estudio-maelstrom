import React, { useLayoutEffect, useRef } from "react";
import { AbsoluteFill, interpolate, Easing, useCurrentFrame } from "remotion";

// 3C · A FOGUEIRA em PIXEL ART (sem 3D nenhum). Tudo desenhado por código num quadro de 192×108 e ampliado 10× sem
// suavizar (1920×1080): paleta fixa, sprites feitos à mão em texto, animação em DEGRAUS de 10 quadros/s (é o que dá a
// cara de sprite de 16 bits), fogo no algoritmo clássico do Doom, fagulhas que esfriam de branco → amarelo → laranja →
// brasa, neve de 1 px, aurora em pontilhado. Câmera anda por pixels inteiros em camadas (paralaxe de fliperama).
// Varga à esquerda do fogo, de perfil, falando; Gordon em primeiro plano, DE COSTAS (nunca o rosto).
// Tudo é função pura do quadro (o Remotion pode pedir qualquer quadro fora de ordem). Tempos em QUADROS.

const W = 192;
const H = 108;

// ---------------------------------------------------------------- paleta
const hex = (h: string): [number, number, number] => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
type RGB = [number, number, number];
// cores dos sprites (char → cor) e a versão acesa pelo fogo de cada uma
const SP: Record<string, [string, string]> = {
  O: ["#07090d", "#2a1610"],
  C: ["#5f5a52", "#9a7a58"],
  c: ["#3d3a36", "#6a5038"],
  H: ["#3a2a1e", "#6a4a2e"],
  s: ["#c99a72", "#f2b47c"],
  S: ["#9a6e4e", "#cf8c5c"],
  e: ["#140f0c", "#140f0c"],
  b: ["#8a847c", "#d0a682"],
  B: ["#57524c", "#8e6a50"],
  k: ["#2a341e", "#5a4a26"],
  j: ["#46572f", "#8a7a3c"],
  J: ["#5d7240", "#ab9150"],
  P: ["#222b3c", "#4a4046"],
  p: ["#34405a", "#6a5a5e"],
  f: ["#2a2018", "#5a4028"],
  h: ["#3b2717", "#7a4a26"],
  y: ["#5c3d22", "#9a6a3a"],
  n: ["#b07a56", "#e0a070"],
  N: ["#7c5238", "#a87048"],
  g: ["#737a83", "#c09070"],
  G: ["#a3aab3", "#e0b090"],
  q: ["#464c55", "#7a5a48"],
  x: ["#15171b", "#3a2018"],
  o: ["#c4561c", "#ff8a3a"],
  L: ["#e9853a", "#ffb060"],
  r: ["#8e3612", "#c05a20"],
  w: ["#3a2618", "#7a4a26"],
  W: ["#5a3c24", "#a0683a"],
  v: ["#24170e", "#4a2a16"],
};
const SPC: Record<string, [RGB, RGB]> = Object.fromEntries(Object.entries(SP).map(([k, [a, b]]) => [k, [hex(a), hex(b)]]));
const FIRE = ["#000000", "#2a0a04", "#5e1606", "#9a2a08", "#d0480e", "#f07a1a", "#ffb43a", "#ffe08a", "#fff6d6"].map(hex);
const SKY = ["#060810", "#0a0e1a", "#0f1626", "#141d33", "#1a2540"].map(hex);
const AUR = ["#123a34", "#1d5a48", "#2f8a68", "#5cc79a"].map(hex);
const STAR = ["#5e6a8e", "#a8b6df", "#e6ecff"].map(hex);
const MTN = { far: hex("#161f30"), farSnow: hex("#2e3b54"), near: hex("#10172a"), nearSnow: hex("#25324a") };
const TREE = { far: [hex("#0d1a1e"), hex("#1f3138")], mid: [hex("#08130f"), hex("#1a2a2c")], near: [hex("#050b09"), hex("#141f22")] };
const SNOW = ["#1c263a", "#2c3a52", "#4a5c7a", "#6c80a0", "#93a6c2", "#c3cfe0"].map(hex);
const WARM = ["#5a4a5e", "#86605e", "#b2745a", "#d8935e", "#f2bb7a"].map(hex);
const TENT = [hex("#1a1d22"), hex("#2e3036"), hex("#5a4030")];

// ordenação de Bayer 4×4 (pontilhado sem gradiente)
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
const bay = (x: number, y: number) => BAYER[(y & 3) * 4 + (x & 3)];
const band = (t: number, x: number, y: number) => {
  const i = Math.floor(t);
  const fr = t - i;
  return i + (fr > 0.62 ? 1 : fr < 0.38 ? 0 : bay(x, y) < (fr - 0.38) / 0.24 ? 1 : 0);
};
const rnd = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// ---------------------------------------------------------------- sprites (texto → pixels)
// Varga sentado, de perfil, olhando para a direita (o fogo). A: quieto · B/C: falando (mão no ar, boca)
const VARGA_A = [
  "      OOOOO       ",
  "     OCCCCCO      ",
  "    OCCCCCCCO     ",
  "    OccccccccccO  ",
  "    OHHssssssO    ",
  "    OHHsssessO    ",
  "    OHSssssssO    ",
  "    OHSsssssO     ",
  "     OSbbbbbO     ",
  "     ObbbbBBO     ",
  "      ObbbbO      ",
  "     OkjjjkO      ",
  "    OkjjJJjjjO    ",
  "   OkjjjJJjjjjO   ",
  "   OkjjjjJJjjjO   ",
  "   OkjjjjjJjjjO   ",
  "   OkjjjjjJJjjO   ",
  "   OkkjjjjjJjjO   ",
  "   OkkjjjjjJJssO  ",
  "   OPpppppppPssO  ",
  "   OPpppppppppppO ",
  "   OPPPPPPPPPpppO ",
  "    OOOOOOOOOpppO ",
  "            OpppO ",
  "            OppPO ",
  "            OppPO ",
  "           OffffO ",
  "           OfffffO",
];
const swap = (base: string[], rows: Record<number, string>) => base.map((r, i) => rows[i] ?? r);
const VARGA_B = swap(VARGA_A, {
  9: "     ObbbbOBO     ",
  13: "   OkjjjJJjjjjO   ",
  14: "   OkjjjjJJJJJssO ",
  15: "   OkjjjjjjjjjO   ",
  16: "   OkjjjjjjjjjO   ",
  17: "   OkkjjjjjjjjO   ",
  18: "   OkkjjjjjjjjO   ",
  19: "   OPpppppppPPO   ",
});
const VARGA_C = swap(VARGA_A, {
  9: "     ObbbbBBO     ",
  12: "    OkjjJJjjjOss  ",
  13: "   OkjjjJJjjjJJO  ",
  14: "   OkjjjjJJJJjO   ",
  15: "   OkjjjjjjjjjO   ",
  16: "   OkjjjjjjjjjO   ",
  17: "   OkkjjjjjjjjO   ",
  18: "   OkkjjjjjjjjO   ",
  19: "   OPpppppppPPO   ",
});
// cabeça baixa, olhando o fogo (silêncio)
const VARGA_D = swap(VARGA_A, {
  5: "    OHHssssssO    ",
  6: "    OHSsssseSO    ",
  7: "    OHSssssssO    ",
});

// Gordon de COSTAS (meia figura espelhada): cabelo, nuca, HEV (laranja, cinza, preto) com a mochila de energia
const GORDON_HALF = [
  "...........OOOOO",
  "..........Ohhhyy",
  ".........Ohhhhhy",
  ".........Ohhhhhh",
  ".........Ohhhhhh",
  ".........ONhhhhh",
  ".........ONhhhhh",
  "..........ONnnnn",
  "...........Oxnnn",
  "......OOOOOxxxxx",
  "....OOgGGGqxxxxx",
  "...OgGGGGgqxoooo",
  "..OgGGGgggqxoLLL",
  "..OgGgggggqxoLrr",
  ".OgGggggggqxoLrq",
  ".OggggggggqxoLrq",
  ".OqggggggqxxoLrq",
  ".OqqggggqxxxoLrr",
  ".OxqqqqqxxxxooLL",
  ".Oxxqqqxxxxxxooo",
  ".Oxxxxxxxxxxxxxx",
  ".Oxxxxoxxxxxxxxx",
  ".Oxxxxoxxxxxxxxx",
  ".Oxxxxxxxxxxxxxx",
  ".Oxxxxxxxxxxxxxx",
  ".Oxxxxxxxxxxxxxx",
  ".Oxxxxxxxxxxxxxx",
  ".Oxxxxxxxxxxxxxx",
];
const mirror = (half: string[]) => half.map((r) => (r + r.split("").reverse().join("")).replace(/\./g, " "));
const GORDON = mirror(GORDON_HALF);
// respiração: os ombros sobem 1 px
const GORDON_B = [GORDON[0], ...GORDON.slice(0, GORDON.length - 1)];

// ---------------------------------------------------------------- framebuffer
type FB = { d: Uint8ClampedArray };
const put = (fb: FB, x: number, y: number, c: RGB) => {
  x |= 0;
  y |= 0;
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 4;
  fb.d[i] = c[0];
  fb.d[i + 1] = c[1];
  fb.d[i + 2] = c[2];
  fb.d[i + 3] = 255;
};
const get = (fb: FB, x: number, y: number): RGB => {
  const i = (y * W + x) * 4;
  return [fb.d[i], fb.d[i + 1], fb.d[i + 2]];
};
const darken = (c: RGB, k: number, tint: RGB = [8, 12, 22]): RGB => [Math.round(c[0] * (1 - k) + tint[0] * k), Math.round(c[1] * (1 - k) + tint[1] * k), Math.round(c[2] * (1 - k) + tint[2] * k)];

// sprite com luz do fogo: `side` = de que lado está o fogo (+1 direita, −1 esquerda); `lit` acende a frente inteira
// (rosto de perfil virado para o fogo); `shade` escurece o resto (quem está de costas para o fogo)
const blit = (fb: FB, spr: string[], x0: number, y0: number, o: { side: number; lit: number; shade: number; rim: boolean; clipY?: number }) => {
  const w = Math.max(...spr.map((r) => r.length));
  const op = (x: number, y: number) => y >= 0 && y < spr.length && x >= 0 && x < w && (spr[y][x] ?? " ") !== " ";
  for (let y = 0; y < spr.length; y++) {
    if (o.clipY !== undefined && y0 + y >= o.clipY) break;
    for (let x = 0; x < w; x++) {
      const ch = spr[y][x] ?? " ";
      if (ch === " ") continue;
      const pal = SPC[ch];
      if (!pal) continue;
      // borda virada para o fogo (o vizinho daquele lado é vazio) = aro aceso
      const edge = o.rim && (!op(x + o.side, y) || !op(x + o.side, y - 1) || !op(x, y - 1));
      // frente acesa: proporção da largura na direção do fogo
      const tFront = o.side > 0 ? x / w : 1 - x / w;
      let c: RGB;
      if (edge && ch !== "e") c = pal[1];
      else if (o.lit > 0 && tFront > 1 - o.lit && bay(x0 + x, y0 + y) < 0.5 + o.lit * 0.5) c = pal[1];
      else c = o.shade > 0 ? darken(pal[0], o.shade) : pal[0];
      put(fb, x0 + x, y0 + y, c);
    }
  }
};

// ---------------------------------------------------------------- cenário
const ridge = (x: number, seed: number, amp: number) => {
  // perfil de serra em degraus (soma de senos + dentes)
  const v = Math.sin(x * 0.031 + seed) * 0.55 + Math.sin(x * 0.083 + seed * 2.1) * 0.3 + Math.sin(x * 0.19 + seed * 3.3) * 0.15;
  return Math.round(v * amp);
};
// pinheiro de pixel: camadas em triângulo, neve na beira de cima de cada camada
const pine = (fb: FB, cx: number, base: number, h: number, col: RGB[], snow: number, seed: number) => {
  const tiers = Math.max(3, Math.round(h / 5));
  for (let y = 0; y < h; y++) {
    const ty = y / h; // 0 = topo
    const tier = (ty * tiers) % 1;
    const half = Math.round((0.6 + 0.4 * tier) * (h * 0.3) * Math.pow(ty, 0.9)) + (y === 0 ? 0 : 0);
    const yy = base - h + y;
    for (let dx = -half; dx <= half; dx++) {
      const jag = Math.abs(dx) === half && rnd(seed * 31 + y * 7 + dx) > 0.55;
      if (jag) continue;
      const top = tier < 0.22 && rnd(seed + y * 13 + dx * 3) < snow;
      put(fb, cx + dx, yy, top ? col[1] : col[0]);
    }
  }
  // tronco
  put(fb, cx, base, col[0]);
  put(fb, cx, base + 1, col[0]);
};

// fogo no algoritmo do Doom, recalculado do zero até o passo atual (função pura do quadro)
const FW = 22;
const FH = 30;
const fireGrid = (steps: number, seed: number) => {
  const g = new Uint8Array(FW * FH);
  let s = seed >>> 0;
  const r = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const top = FIRE.length - 1;
  for (let k = 0; k < steps; k++) {
    // brasa da base: mais forte no meio, irregular
    for (let x = 0; x < FW; x++) {
      const m = 1 - Math.abs(x - (FW - 1) / 2) / (FW / 2);
      g[(FH - 1) * FW + x] = m > 0.25 ? Math.min(top, Math.round(top * Math.min(1, m * 1.5) * (0.75 + r() * 0.25))) : 0;
    }
    for (let y = 1; y < FH; y++)
      for (let x = 0; x < FW; x++) {
        const src = y * FW + x;
        const v = g[src];
        if (v === 0) {
          g[src - FW] = 0;
          continue;
        }
        const rr = Math.floor(r() * 3.2);
        const dst = src - FW - rr + 1;
        if (dst >= 0 && dst < FW * FH) g[dst] = Math.max(0, v - (rr & 1) - (r() < 0.18 ? 1 : 0));
      }
  }
  return g;
};

const render = (fb: FB, f: number, life: number, talkAt: number, talkEndAt: number, quietAt: number) => {
  const step = Math.floor(f / 3); // 10 passos por segundo
  const ts = step / 10;
  const fireStep = Math.floor(f / 2); // o fogo anda a 15/s
  // câmera: pixels inteiros, paralaxe por camada
  const k = interpolate(f, [0, life], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.sin) });
  const cam = Math.round(k * 11);
  const L = (m: number) => Math.round(cam * m);
  const flick = 0.82 + 0.1 * Math.sin(ts * 13.1) + 0.08 * (rnd(fireStep) - 0.5) * 2;

  // céu em faixas pontilhadas
  const HZ = 64;
  for (let y = 0; y < HZ; y++) {
    const t = (y / HZ) * (SKY.length - 1);
    const i = Math.floor(t);
    for (let x = 0; x < W; x++) put(fb, x, y, SKY[Math.min(SKY.length - 1, band(t, x, y))]);
    void i;
  }
  // aurora: cortina que ondula devagar (em degraus), pontilhada
  const ax = L(0.05);
  for (let x = 0; x < W; x++) {
    const wx = x + ax;
    const c0 = 17 + Math.round(Math.sin(wx * 0.04 + ts * 0.15) * 5 + Math.sin(wx * 0.13 + ts * 0.3) * 2);
    const len = 10 + Math.round(4 * Math.sin(wx * 0.06 + 1.3 + ts * 0.1));
    const ray = 0.55 + 0.45 * Math.sin(wx * 0.9 + Math.sin(wx * 0.13) * 3 + ts * 0.6);
    for (let y = c0 - len; y < c0 + 3; y++) {
      if (y < 0) continue;
      const v = (y < c0 ? (y - (c0 - len)) / len : 1 - (y - c0) / 3) * ray * (0.35 + 0.65 * Math.sin(Math.PI * Math.min(1, Math.max(0, (x - 8) / 176))));
      const lvl = v * (AUR.length - 0.6);
      const li = Math.floor(lvl);
      if (li <= 0 && bay(x, y) > lvl) continue;
      put(fb, x, y, AUR[Math.min(AUR.length - 1, Math.max(0, li - (bay(x, y) > lvl - li ? 1 : 0)))]);
    }
  }
  // estrelas (piscam em degraus)
  for (let i = 0; i < 70; i++) {
    const x = Math.floor(rnd(i * 3) * (W + 20)) - L(0.06);
    const y = Math.floor(rnd(i * 5) * 50);
    const tw = rnd(i * 7 + Math.floor(ts * (1 + rnd(i) * 2)));
    const c = tw > 0.85 ? 2 : tw > 0.35 ? 1 : 0;
    const p = get(fb, ((x % W) + W) % W, y);
    if (p[1] > 60) continue; // não fura a aurora forte
    put(fb, ((x % W) + W) % W, y, STAR[c]);
  }
  // serras: sólidas, neve só perto dos picos
  for (let x = 0; x < W; x++) {
    const h1 = 46 + ridge(x + L(0.12), 1.7, 7);
    for (let y = h1; y < HZ; y++) put(fb, x, y, y - h1 < 2 - (h1 - 39) * 0.3 || (y === h1 && h1 < 44) ? MTN.farSnow : MTN.far);
    const h2 = 53 + ridge(x + L(0.22) + 400, 4.2, 5);
    for (let y = h2; y < HZ; y++) put(fb, x, y, y === h2 && h2 < 51 ? MTN.nearSnow : MTN.near);
  }
  // mata distante (linha densa) e do meio
  for (let i = 0; i < 56; i++) {
    const x = Math.floor(rnd(i * 11 + 1) * (W + 50)) - 25 - L(0.35);
    pine(fb, x, HZ + 1, 5 + Math.floor(rnd(i * 13) * 8), TREE.far, 0.5, i);
  }
  // chão de neve: frio longe, a poça quente em volta do fogo
  const FX = 96 - L(1);
  const FY = 85;
  for (let y = HZ; y < H; y++)
    for (let x = 0; x < W; x++) {
      const dy = (y - HZ) / (H - HZ);
      const t = 1.4 + dy * 3.2;
      let c = SNOW[Math.min(SNOW.length - 1, band(t, x, y))];
      // poça de luz (elipse achatada pela perspectiva)
      const d = Math.hypot(x - FX, (y - FY) * 2.8);
      const wv = Math.pow(Math.max(0, 1 - d / (30 * flick)), 1.3) * 5;
      if (wv > 0) {
        const wi = Math.floor(wv);
        if (wi > 0 || bay(x, y) < wv) c = WARM[Math.min(WARM.length - 1, Math.max(0, wi - 1 + (bay(x, y) < wv - wi ? 1 : 0)))];
      }
      put(fb, x, y, c);
    }
  // barracas do grupo, cada uma com o brilho de uma fogueira pequena
  const tent = (cx: number, base: number, w: number, hgt: number, glow: number) => {
    for (let y = 0; y < hgt; y++) {
      const half = Math.round((y / hgt) * w);
      for (let dx = -half; dx <= half; dx++) put(fb, cx + dx, base - hgt + y, dx > 0 && glow > 0 && bay(cx + dx, y) < glow * (dx / Math.max(1, half)) ? TENT[2] : dx < 0 ? TENT[0] : TENT[1]);
    }
    // fogo pequeno (3 px) que pisca em degraus
    const fl = rnd(step * 3 + cx);
    put(fb, cx + w + 3, base - 1, FIRE[6]);
    put(fb, cx + w + 3, base - 2, fl > 0.4 ? FIRE[5] : FIRE[4]);
    if (fl > 0.6) put(fb, cx + w + 3, base - 3, FIRE[4]);
    put(fb, cx + w + 2, base, FIRE[3]);
    put(fb, cx + w + 4, base, FIRE[3]);
  };
  tent(28 - L(0.6), HZ + 5, 7, 8, 0.5);
  tent(160 - L(0.6), HZ + 4, 6, 7, 0.4);
  // mata do meio, atrás do acampamento (só nas laterais: clareira no meio)
  for (let i = 0; i < 22; i++) {
    const side = i % 2 ? 1 : -1;
    const x = 96 + side * (48 + Math.floor(rnd(i * 17) * 56)) - L(0.6);
    pine(fb, x, HZ + 3, 14 + Math.floor(rnd(i * 19) * 14), TREE.mid, 0.45, i + 100);
  }

  // fogueira: pedras, lenha cruzada, o fogo e as fagulhas
  const g = fireGrid(fireStep + 30, 7);
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    const sx = FX + Math.round(Math.cos(a) * 8);
    const sy = FY + Math.round(Math.sin(a) * 3);
    put(fb, sx, sy, hex(sy > FY ? "#5a5250" : "#3a3434"));
    put(fb, sx + 1, sy, hex("#2a2424"));
  }
  for (let i = -6; i <= 6; i++) {
    put(fb, FX + i, FY - 1 + Math.round(i * 0.25), hex(Math.abs(i) < 3 ? "#7a2a10" : "#2a1a10"));
    put(fb, FX + i, FY - 1 - Math.round(i * 0.25), hex(Math.abs(i) < 3 ? "#9a3a12" : "#3a2414"));
  }
  for (let y = 0; y < FH; y++)
    for (let x = 0; x < FW; x++) {
      const v = g[y * FW + x];
      if (v > 1) put(fb, FX - (FW >> 1) + x, FY - FH + y, FIRE[v]);
    }
  // fagulhas: sobem rodando e esfriam
  for (let i = 0; i < 18; i++) {
    const per = 1.4 + rnd(i * 3) * 1.6;
    const a = ((ts + rnd(i * 7) * per) % per) / per;
    if (a > 0.92) continue;
    const x = FX + Math.round((rnd(i * 11) - 0.5) * 6 + Math.sin(a * 7 + i) * 4 * a + a * a * 8);
    const y = FY - 12 - Math.round(a * (28 + rnd(i * 5) * 18));
    const c = a < 0.15 ? 8 : a < 0.4 ? 7 : a < 0.65 ? 6 : 4;
    put(fb, x, y, FIRE[c]);
  }
  // fumaça: poucos pixels cinza que sobem e somem no pontilhado
  for (let i = 0; i < 10; i++) {
    const per = 3.2;
    const a = ((ts + (i / 10) * per) % per) / per;
    const x = FX + Math.round(Math.sin(a * 4 + i) * 3 + a * 10);
    const y = FY - 26 - Math.round(a * 24);
    if (bay(x, y) < 0.55 * (1 - a)) {
      put(fb, x, y, hex("#2a2c30"));
      put(fb, x + 1, y, hex("#222428"));
    }
  }

  // Varga no tronco, de perfil para o fogo
  const VX = 64 - L(1);
  const VY = 61;
  const talking = f >= talkAt && f < talkEndAt;
  const quiet = f >= quietAt;
  const vs = talking ? [VARGA_B, VARGA_A, VARGA_C, VARGA_A][Math.floor(f / 4) % 4] : quiet ? VARGA_D : VARGA_A;
  const bob = !talking && Math.floor(step / 6) % 2 ? 1 : 0;
  // sombra dele e do tronco na neve, comprida para longe do fogo
  for (let x = 0; x < 24; x++) for (let y = 0; y < 2; y++) if (x > 8 || bay(VX - 22 + x, VY + 25 + y) < x / 9) put(fb, VX - 22 + x, VY + 25 + y, y ? SNOW[1] : SNOW[0]);
  // tronco: casca escura, veio, ponta cortada virada para a câmera, neve em cima
  for (let y = 0; y < 5; y++)
    for (let x = 0; x < 17; x++) {
      const tip = x >= 15;
      const ch = tip ? (y === 0 || y === 4 ? "v" : (x === 16 && (y === 1 || y === 3)) || (x === 15 && y === 2) ? "W" : "y") : y === 0 ? "W" : y === 4 ? "v" : (x * 5 + y * 3) % 9 === 0 ? "v" : "w";
      put(fb, VX + 1 + x, VY + 21 + y, SPC[ch][x > 11 ? 1 : 0]);
    }
  for (let x = 1; x < 13; x++) if (bay(VX + x, 0) < 0.5) put(fb, VX + 1 + x, VY + 21, SNOW[4]);
  blit(fb, vs, VX, VY + bob, { side: 1, lit: 0.45 * flick, shade: 0.15, rim: true });

  // Gordon em primeiro plano, de costas, cortado pela borda de baixo
  const GX = 122 - L(1.6);
  const GY = 84;
  const gs = Math.floor(step / 8) % 2 ? GORDON_B : GORDON;
  blit(fb, gs, GX, GY, { side: -1, lit: 0, shade: 0.32, rim: true });

  // neve caindo: 1 px, em degraus
  for (let i = 0; i < 100; i++) {
    const near = i % 3 === 0;
    const sp = near ? 13 : 7;
    const x = Math.floor(((rnd(i * 3) * (W + 40) + ts * (near ? 4 : 2.4) + Math.sin(ts * 0.8 + i) * 2 - L(near ? 1.4 : 0.7)) % (W + 40) + W + 40) % (W + 40)) - 20;
    const y = Math.floor((rnd(i * 5) * H + ts * sp) % H);
    put(fb, x, y, near ? hex("#dfe7f2") : hex("#8d9cb8"));
  }
};

export const HLPixelCamp: React.FC<{ life: number; talkAt?: number; talkEndAt?: number; quietAt?: number }> = ({ life, talkAt = 1e9, talkEndAt = 1e9, quietAt = 1e9 }) => {
  const f = useCurrentFrame();
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const img = ctx.createImageData(W, H);
    render({ d: img.data }, f, life, talkAt, talkEndAt, quietAt);
    ctx.putImageData(img, 0, 0);
  }, [f, life, talkAt, talkEndAt, quietAt]);
  return (
    <AbsoluteFill style={{ background: "#060810" }}>
      <canvas ref={ref} width={W} height={H} style={{ width: "100%", height: "100%", imageRendering: "pixelated" }} />
    </AbsoluteFill>
  );
};
