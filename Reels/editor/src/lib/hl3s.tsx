import React, { useLayoutEffect, useRef } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";

// SPRITES dos personagens da 3C, desenhados PIXEL A PIXEL (retângulos, linhas e elipses exatos, sem sombreado
// automático), no estilo da referência de pixel art de Half-Life: figuras esguias, ~55 px de altura, 2–3 tons por
// material e contorno escuro. Gordon sempre DE COSTAS. `HLSpriteLab` mostra a folha de personagens ampliada.

type RGB = [number, number, number];
const hex = (h: string): RGB => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

export const SPAL: Record<string, string> = {
  // pele clara / média / escura
  a: "#efc19a", b: "#d29a72", c: "#a06a48",
  T: "#a8704a", U: "#7e4e32", V: "#52301e",
  e: "#141010", w: "#ece6dc",
  // cabelo castanho (Gordon)
  A: "#9a6236", B: "#6e4224", C: "#462814",
  // grisalho (barba/cabelo)
  g: "#d8d2c8", h: "#a29c94", i: "#6e6862",
  // HEV
  D: "#f8ac50", E: "#e07a28", F: "#a24c1a", G: "#c8cfd8", H: "#8f98a6", I: "#5c6370", J: "#3c404a", K: "#25282f",
  // pé de cabra
  R: "#d0362c", r: "#82201a", S: "#a8aeb6",
  // Eli: sobretudo, camisa, gravata, calça, sapato, prótese
  N: "#ac8250", O: "#825c36", P: "#563c22", Q: "#e6e2da", y: "#962c2c", W: "#5e5e6a", X: "#40404a", Z: "#2c2422", m: "#b8c0ca", n: "#6e7684",
  // Varga: gorro, jaqueta militar, braçadeira, calça, botas
  k: "#62623f", l: "#7e7e54", j: "#40402a", p: "#90a058", q: "#667640", s: "#454f2a", Y: "#ecca4a", z: "#a88a20", t: "#4e5a74", u: "#363f54", v: "#6e4c30", x: "#46301e",
  // Vortigaunt
  "2": "#b08e5e", "3": "#866640", "4": "#5a4428", "5": "#3a2c1a", "6": "#ff4626", "7": "#ffd2c0",
};
export const SPC: Record<string, RGB> = Object.fromEntries(Object.entries(SPAL).map(([k, v]) => [k, hex(v)]));
export const OUTLINE: RGB = hex("#15121a");

export type Sprite = { w: number; h: number; px: (string | null)[] };
type Op = ["r", number, number, number, number, string] | ["l", number, number, number, number, number, string] | ["e", number, number, number, number, string] | ["p", number, number, string];

// monta: aplica as operações em ordem e contorna a silhueta (o contorno fica FORA da figura)
const build = (w: number, h: number, ops: Op[]): Sprite => {
  const g: (string | null)[] = new Array(w * h).fill(null);
  const set = (x: number, y: number, c: string) => {
    x = Math.round(x);
    y = Math.round(y);
    if (x >= 0 && y >= 0 && x < w && y < h) g[y * w + x] = c;
  };
  for (const op of ops) {
    if (op[0] === "r") {
      const [, x, y, ww, hh, c] = op;
      for (let yy = y; yy < y + hh; yy++) for (let xx = x; xx < x + ww; xx++) set(xx, yy, c);
    } else if (op[0] === "p") set(op[1], op[2], op[3]);
    else if (op[0] === "l") {
      const [, x1, y1, x2, y2, th, c] = op;
      const n = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1), 1);
      for (let k = 0; k <= n; k++) {
        const x = x1 + ((x2 - x1) * k) / n;
        const y = y1 + ((y2 - y1) * k) / n;
        for (let dy = 0; dy < th; dy++) for (let dx = 0; dx < th; dx++) set(Math.round(x - (th - 1) / 2) + dx, Math.round(y - (th - 1) / 2) + dy, c);
      }
    } else if (op[0] === "e") {
      const [, cx, cy, rx, ry, c] = op;
      for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
        for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) if (((x - cx) / (rx + 0.35)) ** 2 + ((y - cy) / (ry + 0.35)) ** 2 <= 1) set(x, y, c);
    }
  }
  // contorno
  const out = g.slice();
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      if (g[y * w + x]) continue;
      const nb = (xx: number, yy: number) => xx >= 0 && yy >= 0 && xx < w && yy < h && !!g[yy * w + xx];
      if (nb(x - 1, y) || nb(x + 1, y) || nb(x, y - 1) || nb(x, y + 1)) out[y * w + x] = "0";
    }
  return { w, h, px: out };
};

// ---------------------------------------------------------------- GORDON de costas, em pé, pé de cabra na direita
const gordonOps = (bob: number, swing: number): Op[] => {
  const b = bob;
  return [
    // pernas (coxa laranja, joelho preto, canela laranja, bota cinza)
    ["r", 8, 31, 5, 8, "E"],
    ["r", 15, 31, 5, 8, "E"],
    ["r", 8, 31, 1, 8, "F"],
    ["r", 19, 31, 1, 8, "F"],
    ["r", 8, 39, 5, 3, "J"],
    ["r", 15, 39, 5, 3, "J"],
    ["r", 8, 42, 5, 9, "E"],
    ["r", 15, 42, 5, 9, "E"],
    ["r", 8, 42, 1, 9, "F"],
    ["r", 19, 42, 1, 9, "F"],
    ["r", 9, 42, 2, 1, "D"],
    ["r", 16, 42, 2, 1, "D"],
    ["r", 8, 51, 5, 1, "K"],
    ["r", 15, 51, 5, 1, "K"],
    ["r", 7, 52, 6, 3, "H"],
    ["r", 15, 52, 6, 3, "H"],
    ["r", 7, 54, 6, 1, "I"],
    ["r", 15, 54, 6, 1, "I"],
    // quadril
    ["r", 8, 28 + b, 12, 4, "E"],
    ["r", 13, 29 + b, 2, 3, "K"],
    // braços: ombreira, braço cinza, cotovelo, antebraço laranja, luva
    ["r", 4, 16 + b, 3, 7, "H"],
    ["r", 4, 16 + b, 1, 7, "I"],
    ["r", 4, 23 + b, 3, 2, "K"],
    ["r", 4, 25 + b, 3, 5, "E"],
    ["r", 4, 25 + b, 1, 5, "F"],
    ["r", 4, 30 + b, 3, 3, "K"],
    ["r", 21, 16 + b, 3, 7, "H"],
    ["r", 23, 16 + b, 1, 7, "I"],
    ["r", 21, 23 + b, 3, 2, "K"],
    ["r", 21, 25 + b, 3, 5, "E"],
    ["r", 23, 25 + b, 1, 5, "F"],
    ["r", 21, 30 + b, 3, 3, "K"],
    // tronco (costas do HEV)
    ["r", 7, 12 + b, 14, 16, "K"],
    ["r", 8, 13 + b, 5, 9, "E"],
    ["r", 15, 13 + b, 5, 9, "E"],
    ["r", 8, 13 + b, 5, 1, "D"],
    ["r", 15, 13 + b, 5, 1, "D"],
    ["r", 8, 21 + b, 5, 1, "F"],
    ["r", 15, 21 + b, 5, 1, "F"],
    ["r", 11, 15 + b, 6, 8, "I"],
    ["r", 12, 16 + b, 4, 6, "H"],
    ["r", 12, 16 + b, 4, 1, "G"],
    ["p", 13, 18 + b, "E"],
    ["p", 14, 18 + b, "E"],
    ["p", 13, 19 + b, "D"],
    ["p", 14, 19 + b, "D"],
    ["r", 7, 26 + b, 14, 2, "H"],
    ["r", 7, 27 + b, 14, 1, "I"],
    // ombreiras
    ["r", 4, 12 + b, 5, 4, "G"],
    ["r", 19, 12 + b, 5, 4, "G"],
    ["r", 4, 15 + b, 5, 1, "H"],
    ["r", 19, 15 + b, 5, 1, "H"],
    // gola, nuca, orelhas, cabelo
    // nuca (pele) entre o cabelo e a gola, orelhas dos lados, cabelo cobrindo a cabeça inteira (é a parte de TRÁS)
    ["r", 10, 10 + b, 8, 2, "K"],
    ["r", 11, 7 + b, 6, 4, "b"],
    ["r", 11, 9 + b, 6, 1, "c"],
    ["r", 9, 3 + b, 1, 4, "b"],
    ["r", 18, 3 + b, 1, 4, "b"],
    ["p", 9, 6 + b, "c"],
    ["p", 18, 6 + b, "c"],
    ["r", 10, 0 + b, 8, 7, "B"],
    ["r", 11, 7 + b, 6, 1, "B"],
    ["r", 11, 0 + b, 6, 1, "A"],
    ["r", 10, 1 + b, 7, 2, "A"],
    ["p", 12, 3 + b, "A"],
    ["p", 15, 3 + b, "A"],
    ["p", 13, 4 + b, "A"],
    ["p", 11, 5 + b, "C"],
    ["p", 14, 5 + b, "C"],
    ["p", 16, 6 + b, "C"],
    ["p", 12, 7 + b, "C"],
    ["p", 15, 7 + b, "C"],
    // pé de cabra na mão direita (lado direito da tela), balança um pouco
    ["l", 23, 31 + b, 25 + swing, 47, 2, "R"],
    ["l", 24, 31 + b, 26 + swing, 47, 1, "r"],
    ["l", 25 + swing, 47, 27 + swing, 50, 2, "S"],
    ["p", 28 + swing, 49, "S"],
    ["l", 22, 30 + b, 23, 27 + b, 1, "S"],
  ];
};

// ---------------------------------------------------------------- ELI de pé, 3/4 olhando para a esquerda
const eliOps = (bob: number, look: number): Op[] => {
  const b = bob;
  return [
    // pernas: a esquerda normal, a direita (da tela) com a prótese abaixo do joelho
    ["r", 7, 34, 4, 18, "W"],
    ["r", 7, 34, 1, 18, "X"],
    ["r", 13, 34, 4, 10, "W"],
    ["r", 16, 34, 1, 10, "X"],
    ["r", 13, 44, 4, 2, "n"],
    ["r", 14, 46, 2, 6, "m"],
    ["r", 15, 46, 1, 6, "n"],
    ["r", 6, 52, 6, 3, "Z"],
    ["r", 13, 52, 5, 3, "Z"],
    // braços (mangas) e mãos
    ["r", 3, 15 + b, 3, 13, "O"],
    ["r", 3, 15 + b, 1, 13, "P"],
    ["r", 17, 15 + b, 3, 13, "O"],
    ["r", 19, 15 + b, 1, 13, "P"],
    ["r", 3, 28 + b, 3, 3, "U"],
    ["r", 17, 28 + b, 3, 3, "U"],
    // sobretudo
    ["r", 6, 14 + b, 11, 20, "N"],
    ["r", 6, 14 + b, 2, 20, "O"],
    ["r", 15, 14 + b, 2, 20, "O"],
    ["r", 6, 31 + b, 11, 3, "O"],
    // camisa, gravata, lapelas
    ["r", 9, 14 + b, 5, 5, "Q"],
    ["r", 10, 15 + b, 3, 1, "Q"],
    ["r", 11, 15 + b, 1, 10, "y"],
    ["p", 10, 16 + b, "y"],
    ["p", 12, 16 + b, "y"],
    ["r", 8, 14 + b, 1, 8, "P"],
    ["r", 14, 14 + b, 1, 8, "P"],
    ["l", 9, 19 + b, 11, 25 + b, 1, "P"],
    ["l", 13, 19 + b, 11, 25 + b, 1, "P"],
    ["p", 9, 27 + b, "P"],
    ["p", 9, 30 + b, "P"],
    // pescoço e cabeça (careca, franja grisalha dos lados)
    ["r", 9, 12 + b, 5, 2, "U"],
    ["r", 7, 1 + b, 9, 11, "U"],
    ["r", 8, 0 + b, 7, 1, "U"],
    ["r", 8, 1 + b, 5, 2, "T"],
    ["r", 6, 5 + b, 1, 3, "U"],
    ["r", 16, 5 + b, 1, 3, "U"],
    ["r", 7, 4 + b, 1, 4, "h"],
    ["r", 15, 4 + b, 1, 4, "h"],
    ["r", 15, 2 + b, 1, 2, "i"],
    // sobrancelhas, olhos (olhando para a esquerda), nariz
    ["r", 8 - look, 4 + b, 2, 1, "V"],
    ["r", 11 - look, 4 + b, 2, 1, "V"],
    ["p", 8 - look, 5 + b, "e"],
    ["p", 9 - look, 5 + b, "w"],
    ["p", 11 - look, 5 + b, "e"],
    ["p", 12 - look, 5 + b, "w"],
    ["r", 10 - look, 6 + b, 1, 2, "V"],
    // bigode e cavanhaque pequenos (grisalhos)
    ["r", 9 - look, 8 + b, 4, 1, "h"],
    ["r", 10 - look, 9 + b, 2, 1, "V"],
    ["r", 10 - look, 10 + b, 2, 1, "h"],
  ];
};

// ---------------------------------------------------------------- VARGA de pé, 3/4 para a direita; `gest` 0..1 levanta a mão
const vargaOps = (bob: number, talk: number, gest: number, down: number): Op[] => {
  const b = bob;
  const ops: Op[] = [
    // calça e botas
    ["r", 7, 30, 4, 20, "t"],
    ["r", 13, 30, 4, 20, "t"],
    ["r", 10, 30, 1, 20, "u"],
    ["r", 13, 30, 1, 20, "u"],
    ["r", 6, 50, 6, 4, "v"],
    ["r", 13, 50, 6, 4, "v"],
    ["r", 6, 53, 6, 1, "x"],
    ["r", 13, 53, 6, 1, "x"],
    // braço esquerdo (da tela) com a braçadeira
    ["r", 4, 15 + b, 2, 13, "s"],
    ["r", 4, 15 + b, 1, 13, "s"],
    ["r", 5, 15 + b, 1, 13, "q"],
    ["r", 4, 19 + b, 2, 3, "Y"],
    ["r", 4, 21 + b, 2, 1, "z"],
    ["r", 4, 28 + b, 2, 2, "b"],
    // jaqueta
    ["r", 6, 14 + b, 12, 15, "q"],
    ["r", 14, 14 + b, 4, 15, "p"],
    ["r", 6, 14 + b, 2, 15, "s"],
    ["r", 12, 15 + b, 1, 13, "s"],
    ["r", 7, 17 + b, 4, 1, "s"],
    ["r", 14, 17 + b, 4, 1, "s"],
    ["r", 7, 18 + b, 4, 2, "q"],
    ["r", 6, 29, 12, 1, "x"],
  ];
  // braço direito: parado ou gesticulando (antebraço sobe em direção ao fogo)
  if (gest < 0.3) {
    ops.push(["r", 18, 15 + b, 2, 13, "q"], ["r", 19, 15 + b, 1, 13, "p"], ["r", 18, 28 + b, 2, 2, "a"]);
  } else {
    const hy = Math.round(27 - gest * 12);
    ops.push(["r", 18, 15 + b, 2, 6, "q"], ["l", 19, 21 + b, 22, hy + b, 2, "q"], ["r", 21, hy - 2 + b, 2, 2, "a"]);
  }
  ops.push(
    // cabeça: rosto, orelha, sobrancelhas, olhos (olhando à direita), nariz
    ["r", 7, 5 + b, 9, 6, "a"],
    ["r", 7, 5 + b, 1, 6, "b"],
    ["r", 6, 7 + b, 1, 2, "b"],
    ["r", 9, 6 + b + down, 2, 1, "i"],
    ["r", 13, 6 + b + down, 2, 1, "i"],
    ["p", 9, 7 + b + down, "w"],
    ["p", 10, 7 + b + down, "e"],
    ["p", 13, 7 + b + down, "w"],
    ["p", 14, 7 + b + down, "e"],
    ["r", 15, 8 + b, 1, 2, "b"],
    ["p", 16, 9 + b, "b"],
    // barba grisalha cheia
    ["r", 7, 10 + b, 9, 4, "g"],
    ["r", 7, 12 + b, 9, 2, "h"],
    ["r", 8, 14 + b, 7, 1, "h"],
    ["r", 10, 10 + b, 5, 1, "h"],
    ["r", 11, 11 + b, 3, talk > 1 ? 2 : 1, talk > 0 ? "e" : "i"],
    // gorro de lã com dobra
    ["r", 7, 0 + b, 9, 5, "k"],
    ["r", 8, 0 + b, 5, 1, "l"],
    ["r", 7, 3 + b, 9, 2, "j"],
    ["p", 8, 3 + b, "k"],
    ["p", 10, 3 + b, "k"],
    ["p", 12, 3 + b, "k"],
    ["p", 14, 3 + b, "k"],
  );
  return ops;
};

// ---------------------------------------------------------------- VORTIGAUNT de perfil, curvado, olhando à direita
const vortOps = (sway: number, reach: number): Op[] => {
  const s = sway;
  const r = reach;
  return [
    // perna de trás (mais escura): coxa para a frente, joelho invertido para trás, pé comprido
    ["l", 10, 30, 12, 37, 3, "4"],
    ["l", 12, 37, 8, 44, 2, "4"],
    ["l", 8, 44, 10, 48, 2, "4"],
    ["l", 10, 48, 14, 48, 1, "4"],
    // braço de trás
    ["l", 15, 21, 17, 29, 2, "4"],
    ["l", 17, 29, 18, 37 + r, 2, "4"],
    ["l", 18, 37 + r, 17, 41 + r, 1, "4"],
    ["l", 18, 37 + r, 20, 40 + r, 1, "4"],
    // tronco inclinado para a frente + corcunda
    ["l", 12, 29, 16, 19, 7, "3"],
    ["l", 14, 29, 18, 20, 3, "2"],
    ["e", 13, 19, 4, 3, "3"],
    ["l", 11, 18, 14, 16, 1, "2"],
    ["p", 12, 24, "4"],
    ["p", 14, 26, "4"],
    ["p", 15, 22, "4"],
    ["p", 11, 21, "4"],
    // quadril
    ["e", 12, 30, 3, 2, "3"],
    // perna da frente
    ["l", 13, 30, 15, 37, 3, "3"],
    ["l", 15, 37, 11, 44, 2, "3"],
    ["l", 11, 44, 13, 48, 2, "3"],
    ["l", 13, 48, 18, 48, 1, "3"],
    ["p", 15, 37, "2"],
    // bracinho do peito
    ["l", 18, 24, 21, 26, 1, "3"],
    ["p", 22, 25, "3"],
    // pescoço comprido, cabeça alongada com o queixo
    ["l", 18, 18, 22 + s, 12, 3, "3"],
    ["l", 19, 17, 22 + s, 13, 1, "2"],
    ["e", 25 + s, 9, 5, 3, "3"],
    ["e", 25 + s, 8, 4, 2, "2"],
    ["r", 27 + s, 11, 4, 2, "3"],
    ["r", 28 + s, 12, 3, 1, "4"],
    // olho grande vermelho e os pequenos
    ["r", 24 + s, 8, 2, 2, "6"],
    ["p", 24 + s, 8, "7"],
    ["p", 22 + s, 7, "6"],
    ["p", 28 + s, 7, "6"],
    ["p", 29 + s, 10, "5"],
    // braço da frente comprido, três dedos
    ["l", 18, 21, 21, 30, 2, "2"],
    ["l", 21, 30, 22 + r, 38 + r, 2, "2"],
    ["l", 22 + r, 38 + r, 21 + r, 42 + r, 1, "2"],
    ["l", 22 + r, 38 + r, 23 + r, 42 + r, 1, "2"],
    ["l", 22 + r, 38 + r, 25 + r, 41 + r, 1, "2"],
  ];
};

export const gordonSprite = (t: number) => build(31, 56, gordonOps(Math.floor(t * 1.1) % 2, Math.floor(t * 0.7) % 2));
export const eliSprite = (t: number, look = 0) => build(22, 56, eliOps(Math.floor(t / 2.1) % 2, look));
export const vargaSprite = (t: number, talk = 0, gest = 0, down = 0) => build(25, 55, vargaOps(gest > 0.3 ? 0 : Math.floor(t * 1.2) % 2, talk, gest, down));
export const vortSprite = (t: number) => build(33, 50, vortOps(Math.floor(t * 0.9) % 2, Math.floor(t * 0.6) % 2));

// desenha um sprite num buffer RGBA (âncora nos pés); `tint` opcional por pixel
export const drawSprite = (fb: Uint8ClampedArray, W: number, H: number, s: Sprite, ax: number, ay: number, tint?: (c: RGB, x: number, y: number) => RGB) => {
  const x0 = Math.round(ax - s.w / 2);
  const y0 = Math.round(ay - s.h);
  for (let y = 0; y < s.h; y++)
    for (let x = 0; x < s.w; x++) {
      const ch = s.px[y * s.w + x];
      if (!ch) continue;
      let c = ch === "0" ? OUTLINE : SPC[ch];
      if (!c) continue;
      if (tint) c = tint(c, x / s.w, y / s.h);
      const X = x0 + x;
      const Y = y0 + y;
      if (X < 0 || Y < 0 || X >= W || Y >= H) continue;
      const i = (Y * W + X) * 4;
      fb[i] = c[0];
      fb[i + 1] = c[1];
      fb[i + 2] = c[2];
      fb[i + 3] = 255;
    }
};

// folha de personagens ampliada (para aprovar antes de montar a cena)
export const HLSpriteLab: React.FC<{ life: number }> = () => {
  const f = useCurrentFrame();
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const W = 160;
    const H = 90;
    const cv = ref.current;
    if (!cv) return;
    const off = document.createElement("canvas");
    off.width = W;
    off.height = H;
    const o = off.getContext("2d")!;
    const img = o.createImageData(W, H);
    const bg = hex("#a9b8d4");
    for (let i = 0; i < W * H; i++) img.data.set([bg[0], bg[1], bg[2], 255], i * 4);
    const t = f / 30;
    const shadow = (x: number, y: number, w: number) => {
      for (let k = -w; k <= w; k++) for (let j = 0; j < 2; j++) img.data.set([140, 152, 178, 255], ((y + j) * W + x + k) * 4);
    };
    const base = 78;
    const xs = [22, 60, 98, 136];
    xs.forEach((x, i) => shadow(x, base - 1, i === 3 ? 11 : 9));
    drawSprite(img.data, W, H, gordonSprite(t), xs[0], base);
    drawSprite(img.data, W, H, vargaSprite(t, Math.floor(f / 5) % 3, Math.floor(t / 1.5) % 2 ? 1 : 0), xs[1], base);
    drawSprite(img.data, W, H, eliSprite(t), xs[2], base);
    drawSprite(img.data, W, H, vortSprite(t), xs[3], base);
    o.putImageData(img, 0, 0);
    const ctx = cv.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(off, 0, 0, W, H, 0, 0, 1920, 1080);
  }, [f]);
  return (
    <AbsoluteFill style={{ background: "#a9b8d4" }}>
      <canvas ref={ref} width={1920} height={1080} style={{ width: "100%", height: "100%", imageRendering: "pixelated" }} />
    </AbsoluteFill>
  );
};
