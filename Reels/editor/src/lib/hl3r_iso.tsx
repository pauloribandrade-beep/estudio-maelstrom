import React, { useLayoutEffect, useRef } from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";

// 3C · A FOGUEIRA — diorama isométrico em pixel art 16/32-bit (estilo Habbo / @brullov_art), resolução 640×360.
// Os personagens são BONECOS 2D montados por partes (cabeça, tronco, braços, pernas, detalhes) desenhados direto em
// pixels: cada parte tem volume (normal) e o sombreado sai em 4 tons pela direção da luz do fogo, com contorno escuro
// automático da cor do material e linha de sombra onde uma parte cobre outra — o acabamento de sprite feito à mão,
// mas articulado (dá para animar braço, cabeça, respiração). A câmera mostra um recorte ampliado em escala inteira
// (×3 tudo, ×4 meio, ×6 perto, ×8 bem perto): pixel sempre nítido. Animação em degraus de 10 quadros/s.
// Gordon SEMPRE de costas. Função pura do quadro. Tempos em QUADROS.

const W = 640;
const H = 360;
type RGB = [number, number, number];
const hex = (h: string): RGB => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const cl = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
const mix = (a: RGB, b: RGB, k: number): RGB => [cl(a[0] + (b[0] - a[0]) * k), cl(a[1] + (b[1] - a[1]) * k), cl(a[2] + (b[2] - a[2]) * k)];
const mul = (a: RGB, k: number): RGB => [cl(a[0] * k), cl(a[1] * k), cl(a[2] * k)];
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
const bay = (x: number, y: number) => BAYER[(y & 3) * 4 + (x & 3)];
const rnd = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const NIGHT: RGB = [12, 18, 40];
const FIREC: RGB = [255, 160, 80];

// ---------------------------------------------------------------- materiais: rampa de 5 cores a partir de uma base
// 0 contorno · 1 sombra · 2 meio-tom · 3 luz · 4 brilho (o brilho puxa para o laranja do fogo)
type Ramp = RGB[];
const ramp = (h: string, warm = 1): Ramp => {
  const b = hex(h);
  return [mix(mul(b, 0.3), [8, 8, 20], 0.4), mix(mul(b, 0.62), NIGHT, 0.22), b, mix(mul(b, 1.2), FIREC, 0.14 * warm), mix(mul(b, 1.42), [255, 196, 130], 0.3 * warm)];
};
const flat = (h: string): Ramp => {
  const b = hex(h);
  return [b, b, b, b, b];
};
const MAT = {
  skinL: ramp("#d9a27a"),
  skinD: ramp("#8a5a3c"),
  beardG: ramp("#a8a29a"),
  hairB: ramp("#6a4024"),
  hairG: ramp("#9a948c"),
  beanie: ramp("#55553a"),
  beanieB: ramp("#2e2e34"),
  olive: ramp("#5f6e38"),
  oliveD: ramp("#46522a"),
  band: ramp("#d8b440"),
  jeans: ramp("#465474"),
  boot: ramp("#5a4028"),
  tweed: ramp("#8e6a40"),
  tweedD: ramp("#6a4c2c"),
  shirt: ramp("#d6d2ca"),
  tie: ramp("#8e2a2a"),
  trou: ramp("#4c4c56"),
  metal: ramp("#9aa2ae"),
  hevO: ramp("#e07a28"),
  hevG: ramp("#8e97a4"),
  hevK: ramp("#2c3038"),
  vort: ramp("#8c7048"),
  vortD: ramp("#5e4a30"),
  eye: flat("#160e0c"),
  white: flat("#e8e2d8"),
  red: flat("#ff3a1e"),
  mouth: flat("#4a2418"),
  lambda: ramp("#e07a28"),
};
type MatK = keyof typeof MAT;
const MKEYS = Object.keys(MAT) as MatK[];
const MID: Record<MatK, number> = Object.fromEntries(MKEYS.map((k, i) => [k, i])) as Record<MatK, number>;

// ---------------------------------------------------------------- boneco: buffer de material + tom + ordem
const DW = 72;
const DH = 96;
const DOX = 36;
const DOY = 92;
class Doll {
  mat = new Int16Array(DW * DH).fill(-1);
  tone = new Uint8Array(DW * DH);
  ord = new Uint16Array(DW * DH);
  n = 1;
  L: [number, number, number];
  constructor(side: number) {
    const l: [number, number, number] = [side * 0.78, 0.18, 0.6];
    const m = Math.hypot(...l);
    this.L = [l[0] / m, l[1] / m, l[2] / m];
  }
  private set(x: number, y: number, m: number, s: number) {
    const px = Math.round(x + DOX);
    const py = Math.round(y + DOY);
    if (px < 0 || py < 0 || px >= DW || py >= DH) return;
    const i = py * DW + px;
    const j = (s + (bay(px, py) - 0.5) * 0.1);
    this.mat[i] = m;
    this.tone[i] = j < 0.3 ? 1 : j < 0.64 ? 2 : j < 0.88 ? 3 : 4;
    this.ord[i] = this.n;
  }
  private lit(nx: number, ny: number, nz: number) {
    const [lx, ly, lz] = this.L;
    // luz do fogo + um pouco de luz ambiente vinda de cima
    return Math.max(0, Math.min(1, 0.22 + 0.62 * (nx * lx + ny * ly + nz * lz) + 0.12 * -ny));
  }
  ell(cx: number, cy: number, rx: number, ry: number, m: MatK, tone?: number) {
    this.n++;
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const nx = (x - cx) / rx;
        const ny = (y - cy) / ry;
        const d = nx * nx + ny * ny;
        if (d > 1) continue;
        this.set(x, y, MID[m], tone ?? this.lit(nx, ny, Math.sqrt(1 - d)));
      }
  }
  cap(x1: number, y1: number, x2: number, y2: number, r1: number, r2: number, m: MatK) {
    this.n++;
    const minx = Math.floor(Math.min(x1 - r1, x2 - r2));
    const maxx = Math.ceil(Math.max(x1 + r1, x2 + r2));
    const miny = Math.floor(Math.min(y1 - r1, y2 - r2));
    const maxy = Math.ceil(Math.max(y1 + r1, y2 + r2));
    const dx = x2 - x1;
    const dy = y2 - y1;
    const ll = dx * dx + dy * dy || 1;
    for (let y = miny; y <= maxy; y++)
      for (let x = minx; x <= maxx; x++) {
        const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / ll));
        const px = x1 + dx * t;
        const py = y1 + dy * t;
        const r = r1 + (r2 - r1) * t;
        const ox = x - px;
        const oy = y - py;
        const d = (ox * ox + oy * oy) / (r * r);
        if (d > 1) continue;
        const nx = ox / r;
        const ny = oy / r;
        this.set(x, y, MID[m], this.lit(nx, ny, Math.sqrt(Math.max(0, 1 - d))));
      }
  }
  poly(pts: [number, number][], m: MatK, bulge = 0.6) {
    this.n++;
    let x0 = Infinity;
    let x1 = -Infinity;
    let y0 = Infinity;
    let y1 = -Infinity;
    for (const [x, y] of pts) {
      x0 = Math.min(x0, x);
      x1 = Math.max(x1, x);
      y0 = Math.min(y0, y);
      y1 = Math.max(y1, y);
    }
    for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) {
      let xa = Infinity;
      let xb = -Infinity;
      for (let i = 0; i < pts.length; i++) {
        const [ax, ay] = pts[i];
        const [bx, by] = pts[(i + 1) % pts.length];
        if ((y < Math.min(ay, by)) || y > Math.max(ay, by) || ay === by) continue;
        const x = ax + ((y - ay) / (by - ay)) * (bx - ax);
        xa = Math.min(xa, x);
        xb = Math.max(xb, x);
      }
      for (let x = Math.round(xa); x <= Math.round(xb); x++) {
        const gx = (((x - x0) / Math.max(1, x1 - x0)) * 2 - 1) * bulge;
        const gy = (((y - y0) / Math.max(1, y1 - y0)) * 2 - 1) * 0.25;
        const nz = Math.sqrt(Math.max(0.05, 1 - gx * gx - gy * gy));
        this.set(x, y, MID[m], this.lit(gx, gy, nz));
      }
    }
  }
  px(x: number, y: number, m: MatK, tone = 2) {
    this.n++;
    this.set(x, y, MID[m], tone === 1 ? 0.2 : tone === 2 ? 0.5 : tone === 3 ? 0.75 : 0.95);
  }
  // compõe no quadro: contorno (cor escura do material) onde encosta no vazio, linha de sombra onde outra parte cobre
  blit(fb: Uint8ClampedArray, ax: number, ay: number, night: number, warmK: number) {
    const x0 = Math.round(ax - DOX);
    const y0 = Math.round(ay - DOY);
    for (let y = 0; y < DH; y++)
      for (let x = 0; x < DW; x++) {
        const i = y * DW + x;
        const m = this.mat[i];
        if (m < 0) continue;
        const rp = MAT[MKEYS[m]];
        const empty = (xx: number, yy: number) => xx < 0 || yy < 0 || xx >= DW || yy >= DH || this.mat[yy * DW + xx] < 0;
        let t = this.tone[i];
        if (empty(x - 1, y) || empty(x + 1, y) || empty(x, y - 1) || empty(x, y + 1)) t = 0;
        else {
          for (const [xx, yy] of [
            [x, y - 1],
            [x - 1, y],
            [x + 1, y],
          ]) {
            const j = yy * DW + xx;
            if (this.mat[j] !== m && this.ord[j] > this.ord[i] && rp !== MAT.eye) {
              t = Math.min(t, 1);
              break;
            }
          }
        }
        let c = rp[t];
        if (t <= 1) c = mix(c, NIGHT, night * 0.5);
        if (t >= 3) c = mix(c, mix(c, FIREC, 0.35), warmK);
        put(fb, x0 + x, y0 + y, c);
      }
  }
}

// ---------------------------------------------------------------- personagens (origem nos pés, y para cima negativo)
type Pose = { t: number; talk: number; gest: number; quiet: number };

// VARGA sentado, de frente, virado um pouco para a direita (o fogo): gorro, barba grisalha, jaqueta militar com
// bolsos e braçadeira, calça, botas. `gest` levanta a mão direita (lado do fogo) enquanto fala.
const drawVarga = (d: Doll, p: Pose) => {
  const br = Math.floor(p.t * 1.2) % 2; // respiração (1 px)
  const hy = -50 + br * 0 + (p.quiet ? 1 : 0);
  // botas e canelas
  d.ell(-6, -2, 4.5, 2.6, "boot");
  d.ell(7, -2, 4.5, 2.6, "boot");
  d.cap(-6, -14, -6, -3, 4, 3.6, "jeans");
  d.cap(7, -14, 7, -3, 4, 3.6, "jeans");
  // coxas (sentado: vêm para a frente)
  d.cap(-5, -21, -6, -14, 5, 4.6, "jeans");
  d.cap(5, -21, 7, -14, 5, 4.6, "jeans");
  // braço esquerdo (lado da tela esquerdo), apoiado no joelho
  d.cap(-12, -38, -15, -28, 3.8, 3.4, "olive");
  d.cap(-15, -28, -9, -17, 3.4, 3, "olive");
  d.ell(-8, -16, 2.8, 2.4, "skinL");
  // tronco
  d.poly(
    [
      [-12, -42],
      [12, -42],
      [11 + br * 0, -21],
      [-11, -21],
    ],
    "olive",
  );
  // gola, zíper, bolsos
  d.poly(
    [
      [-5, -43],
      [5, -43],
      [3, -38],
      [-3, -38],
    ],
    "oliveD",
  );
  for (let y = -38; y < -22; y++) d.px(0, y, "oliveD", 1);
  d.poly(
    [
      [-9, -35],
      [-3, -35],
      [-3, -29],
      [-9, -29],
    ],
    "oliveD",
    0.2,
  );
  d.poly(
    [
      [3, -35],
      [9, -35],
      [9, -29],
      [3, -29],
    ],
    "oliveD",
    0.2,
  );
  // braçadeira no braço esquerdo
  d.cap(-12.5, -35, -13.5, -33, 4.1, 4.1, "band");
  // braço direito: no joelho, ou levantado gesticulando
  const g = p.gest;
  const ex = 14 + g * 3;
  const ey = -29 - g * 6;
  const hx = 9 + g * 9;
  const hy2 = -17 - g * 16;
  d.cap(12, -38, ex, ey, 3.8, 3.4, "olive");
  d.cap(ex, ey, hx, hy2, 3.4, 3, "olive");
  d.ell(hx + g * 1, hy2 - g * 1.5, 2.8, 2.6, "skinL");
  // pescoço e cabeça
  d.cap(0, -44, 0, -46, 3.6, 3.6, "skinL");
  d.ell(1, hy, 8, 9, "skinL");
  // orelhas
  d.ell(-7, hy + 1, 1.8, 2.6, "skinL");
  // barba e bigode
  d.ell(1, hy + 5.5, 7, 4.6, "beardG");
  d.cap(-3, hy + 2.5, 5, hy + 2.5, 1.6, 1.6, "beardG");
  // boca: fechada triste, ou abrindo quando fala
  if (p.talk > 0) {
    d.px(1, hy + 4, "mouth");
    d.px(2, hy + 4, "mouth");
    if (p.talk > 1) {
      d.px(1, hy + 5, "mouth");
      d.px(2, hy + 5, "mouth");
    }
  } else {
    d.px(0, hy + 4, "mouth");
    d.px(1, hy + 4, "mouth");
    d.px(2, hy + 4, "mouth");
  }
  // nariz
  d.px(2, hy + 0, "skinL", 1);
  d.px(2, hy + 1, "skinL", 3);
  // olhos (cansados: pálpebra pesada; no silêncio olham para baixo)
  const eyY = hy - 2 + (p.quiet ? 1 : 0);
  for (const ex2 of [-2, 4]) {
    d.px(ex2, eyY - 1, "hairG", 1); // sobrancelha
    d.px(ex2 + 1, eyY - 1, "hairG", 1);
    d.px(ex2, eyY, "eye");
    if (!p.quiet) d.px(ex2 + 1, eyY, "white");
    d.px(ex2, eyY + 1, "skinL", 1); // olheira
  }
  // gorro de lã: copa, ribana, dobra
  d.ell(1, hy - 5, 8.4, 6, "beanie");
  d.poly(
    [
      [-7.5, hy - 5],
      [9.5, hy - 5],
      [9.5, hy - 2],
      [-7.5, hy - 2],
    ],
    "beanie",
    0.5,
  );
  for (let x = -6; x <= 8; x += 2) d.px(x, hy - 7, "beanie", 1);
};

// GORDON sentado, DE COSTAS: cabelo castanho, orelhas, nuca; HEV com ombreiras cinza, placas laranja nas costas,
// coluna preta e a unidade de energia; braços para a frente (só o começo aparece), coxas laranja dos lados
const drawGordon = (d: Doll, p: Pose) => {
  const br = Math.floor(p.t * 1.1) % 2;
  // coxas (sentado, indo para longe) aparecem dos lados
  d.cap(-9, -14, -10, -20, 5, 4.6, "hevO");
  d.cap(9, -14, 10, -20, 5, 4.6, "hevO");
  // braços: ombro → cotovelo (para a frente, encurtados)
  d.cap(-15, -40 + br, -17, -27, 4.6, 4.2, "hevO");
  d.cap(-17, -27, -14, -20, 4, 3.6, "hevK");
  d.cap(15, -40 + br, 17, -27, 4.6, 4.2, "hevO");
  d.cap(17, -27, 14, -20, 4, 3.6, "hevK");
  // tronco: base preta, placas laranja, coluna, unidade de energia
  d.poly(
    [
      [-15, -44 + br],
      [15, -44 + br],
      [12, -14],
      [-12, -14],
    ],
    "hevK",
  );
  d.poly(
    [
      [-13, -40 + br],
      [-3, -40 + br],
      [-4, -22],
      [-11, -22],
    ],
    "hevO",
  );
  d.poly(
    [
      [3, -40 + br],
      [13, -40 + br],
      [11, -22],
      [4, -22],
    ],
    "hevO",
  );
  d.poly(
    [
      [-5, -38 + br],
      [5, -38 + br],
      [5, -26],
      [-5, -26],
    ],
    "hevG",
    0.3,
  );
  d.poly(
    [
      [-3, -36 + br],
      [3, -36 + br],
      [3, -29],
      [-3, -29],
    ],
    "hevK",
    0.2,
  );
  d.px(0, -33 + br, "lambda", 4);
  d.px(-1, -32 + br, "lambda", 3);
  d.px(1, -32 + br, "lambda", 3);
  // cinto
  d.poly(
    [
      [-12, -18],
      [12, -18],
      [12, -15],
      [-12, -15],
    ],
    "hevG",
    0.4,
  );
  // ombreiras
  d.ell(-13, -42 + br, 6, 4.4, "hevG");
  d.ell(13, -42 + br, 6, 4.4, "hevG");
  // gola e nuca
  d.poly(
    [
      [-6, -47 + br],
      [6, -47 + br],
      [7, -43 + br],
      [-7, -43 + br],
    ],
    "hevK",
  );
  d.cap(0, -48 + br, 0, -50 + br, 3.6, 3.6, "skinL");
  // orelhas e cabeça (só cabelo)
  d.ell(-7.5, -55 + br, 1.8, 2.6, "skinL");
  d.ell(7.5, -55 + br, 1.8, 2.6, "skinL");
  d.ell(0, -56 + br, 7.6, 8.6, "hairB");
  // mechas
  for (let k = -5; k <= 5; k += 2) d.px(k, -60 + br + (k & 2 ? 1 : 0), "hairB", 3);
  d.px(-5, -49 + br, "hairB", 1);
  d.px(5, -49 + br, "hairB", 1);
};

// ELI de pé, 3/4 olhando para a esquerda (o fogo): careca com franja grisalha, barba, sobretudo de tweed com lapela,
// camisa e gravata, calça cinza, perna mecânica (esquerda dele = direita da tela), sapatos
const drawEli = (d: Doll, p: Pose) => {
  const sh = Math.floor(p.t / 2.2) % 2; // troca o peso de perna devagar
  const hx = -1 - (p.quiet ? 1 : 0);
  // pernas
  d.ell(-5, -2, 4.4, 2.4, "boot");
  d.cap(-5, -26, -5, -3, 4.2, 3.6, "trou");
  // perna mecânica: coxa na calça, canela de metal com junta
  d.cap(5, -26, 5 + sh, -15, 4.2, 3.8, "trou");
  d.cap(5 + sh, -15, 5, -4, 1.6, 1.4, "metal");
  d.ell(5 + sh, -15, 2.4, 2.2, "metal");
  d.ell(6, -2, 4, 2.2, "boot");
  // braço de trás
  d.cap(10, -50, 12, -38, 3.8, 3.4, "tweedD");
  d.cap(12, -38, 11, -28, 3.4, 3, "tweedD");
  d.ell(11, -26, 2.6, 2.6, "skinD");
  // sobretudo
  d.poly(
    [
      [-12, -52],
      [12, -52],
      [13, -22],
      [-13, -22],
    ],
    "tweed",
  );
  // camisa, gravata, lapelas
  d.poly(
    [
      [-4, -53],
      [4, -53],
      [0, -40],
    ],
    "shirt",
    0.2,
  );
  d.poly(
    [
      [-1, -50],
      [1, -50],
      [1, -40],
      [0, -38],
      [-1, -40],
    ],
    "tie",
    0.1,
  );
  d.poly(
    [
      [-6, -53],
      [-3, -53],
      [-1, -38],
      [-5, -44],
    ],
    "tweedD",
    0.3,
  );
  d.poly(
    [
      [3, -53],
      [6, -53],
      [5, -44],
      [1, -38],
    ],
    "tweedD",
    0.3,
  );
  // botões e bolso
  d.px(-3, -33, "tweedD", 1);
  d.px(-3, -28, "tweedD", 1);
  // braço da frente
  d.cap(-11, -50, -13, -38, 3.8, 3.4, "tweed");
  d.cap(-13, -38, -12, -28, 3.4, 3, "tweed");
  d.ell(-12, -26, 2.6, 2.6, "skinD");
  // pescoço e cabeça
  d.cap(0, -54, 0, -56, 3.6, 3.6, "skinD");
  d.ell(hx, -62, 7.4, 8.6, "skinD");
  d.ell(hx + 7, -61, 1.6, 2.4, "skinD");
  // franja grisalha dos lados e atrás
  d.cap(hx + 4, -63, hx + 7, -58, 1.8, 1.6, "hairG");
  d.cap(hx - 6, -64, hx - 6, -58, 1.6, 1.4, "hairG");
  // barba curta e bigode
  d.ell(hx, -56.5, 6, 3.6, "beardG");
  d.cap(hx - 3, -59, hx + 2, -59, 1.4, 1.4, "beardG");
  d.px(hx - 1, -57, "mouth");
  d.px(hx, -57, "mouth");
  // olhos (3/4: deslocados para a esquerda), sobrancelhas
  for (const ex of [hx - 4, hx + 1]) {
    d.px(ex, -64, "hairG", 1);
    d.px(ex + 1, -64, "hairG", 1);
    d.px(ex, -63, "eye");
    d.px(ex + 1, -63, "white");
  }
  d.px(hx - 2, -61, "skinD", 1);
  d.px(hx - 2, -60, "skinD", 3);
};

// VORTIGAUNT curvado, olhando para a direita: pernas de articulação invertida, tronco corcunda, pescoço comprido,
// cabeça alongada com o olho vermelho grande e os pequenos, braços finos com três dedos e o bracinho do peito
const drawVort = (d: Doll, p: Pose) => {
  const sw = Math.floor(p.t * 0.9) % 2;
  // pernas
  for (const s of [-1, 1]) {
    const m: MatK = s < 0 ? "vortD" : "vort";
    d.cap(s * 4, -30, s * 4 - 4, -18, 3.6, 3, m);
    d.cap(s * 4 - 4, -18, s * 4 + 1, -6, 3, 2.2, m);
    d.cap(s * 4 + 1, -6, s * 4 + 4, -1, 2.2, 1.8, m);
    d.cap(s * 4 + 4, -1, s * 4 + 7, -1, 1.4, 1.2, m);
  }
  // braço de trás
  d.cap(-2, -42, 2, -32, 2.4, 2, "vortD");
  d.cap(2, -32, 6 + sw, -24, 2, 1.8, "vortD");
  // tronco corcunda
  d.ell(0, -36, 9, 11, "vort");
  d.ell(4, -34, 5, 7, "vort");
  // manchas
  for (let k = 0; k < 9; k++) d.px(-6 + Math.floor(rnd(k * 3) * 12), -44 + Math.floor(rnd(k * 5) * 16), "vortD", 1);
  // bracinho do peito
  d.cap(6, -36, 9, -32, 1.4, 1.2, "vort");
  // pescoço e cabeça
  d.cap(4, -44, 10, -52, 3.4, 2.8, "vort");
  d.ell(13 + sw * 0.5, -54, 7, 5, "vort");
  d.ell(18, -53, 2.6, 2.2, "vort");
  // olho grande e os pequenos
  d.ell(14 + sw * 0.5, -55, 2, 2, "red", 0.95);
  d.px(14 + sw * 0.5, -55, "white");
  d.px(10, -57, "red");
  d.px(17, -57, "red");
  d.px(11, -52, "eye");
  // braço da frente, comprido, mão com três dedos
  d.cap(3, -43, 9, -32, 2.6, 2.2, "vort");
  d.cap(9, -32, 14 + sw, -22, 2.2, 1.8, "vort");
  for (let k = -1; k <= 1; k++) d.cap(14 + sw, -22, 15 + sw + k * 2, -16, 0.9, 0.7, "vort");
};

const drawDoll = (fb: Uint8ClampedArray, fn: (d: Doll, p: Pose) => void, p: Pose, ax: number, ay: number, side: number, warmK: number, night: number) => {
  const d = new Doll(side);
  fn(d, p);
  d.blit(fb, ax, ay, night, warmK);
};

// ---------------------------------------------------------------- framebuffer
const put = (fb: Uint8ClampedArray, x: number, y: number, c: RGB) => {
  x = Math.round(x);
  y = Math.round(y);
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 4;
  fb[i] = c[0];
  fb[i + 1] = c[1];
  fb[i + 2] = c[2];
  fb[i + 3] = 255;
};
const polyFill = (fb: Uint8ClampedArray, pts: [number, number][], col: (x: number, y: number) => RGB | null) => {
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
      if (y < Math.min(ay, by) || y > Math.max(ay, by)) continue;
      if (ay === by) {
        xa = Math.min(xa, ax, bx);
        xb = Math.max(xb, ax, bx);
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

// ---------------------------------------------------------------- mundo isométrico (2 px por unidade)
const S = 2;
const OX = 320;
const OY = 64;
const N = 92;
let BOB = 0;
const iso = (u: number, v: number, z = 0): [number, number] => [OX + (u - v) * S, OY + BOB + ((u + v) * S) / 2 - z * S];
const FU = 47;
const FV = 46;

const SNOW = ["#eef3f9", "#d6dfec", "#b8c6da", "#94a6c2", "#6e809e"].map(hex);
const SOIL = { lip: hex("#d4deec"), ice: hex("#a8cce2"), dirtL: hex("#5e4636"), dirtD: hex("#402e24"), rockL: hex("#6e727e"), rockD: hex("#4a4e5a"), deep: hex("#2a2c36"), root: hex("#2e2018") };
const WARM = ["#f8c88c", "#eaa272", "#c88268"].map(hex);

const drawIsland = (fb: Uint8ClampedArray, flick: number) => {
  const T = 48;
  const L0 = iso(0, N);
  const L1 = iso(N, N);
  const R0 = iso(N, 0);
  const bottom = (x: number, base: number) => base + T + Math.round(Math.sin(x * 0.35) * 3 + (rnd(Math.floor(x / 2) * 3) > 0.7 ? 4 : 0));
  const face = (x: number, ty: number, dark: boolean) => {
    const by = bottom(x, ty);
    for (let y = Math.ceil(ty); y <= by; y++) {
      const d = y - ty;
      const rock = rnd(Math.floor(x / 5) * 7 + Math.floor((y - ty) / 4) * 13 + (dark ? 99 : 0)) > 0.55;
      let c = d < 3 ? SOIL.lip : d < 5 ? SOIL.ice : d < 20 ? (bay(x, y) < 0.1 ? SOIL.root : dark ? SOIL.dirtD : SOIL.dirtL) : rock ? (dark ? SOIL.rockD : SOIL.rockL) : dark ? SOIL.dirtD : SOIL.dirtL;
      if (d >= 20 && d < 22) c = dark ? SOIL.dirtD : mul(SOIL.dirtL, 0.8);
      if (by - y < 2) c = SOIL.deep;
      if (dark && d < 5) c = mix(c, NIGHT, 0.25);
      put(fb, x, y, c);
    }
    if (rnd(x * 7 + (dark ? 3 : 0)) > 0.78) for (let k = 0; k < 3 + Math.floor(rnd(x) * 6); k++) put(fb, x, ty + 5 + k, dark ? mix(SOIL.ice, NIGHT, 0.3) : SOIL.ice);
  };
  for (let x = Math.floor(L0[0]); x <= L1[0]; x++) face(x, L0[1] + (x - L0[0]) / 2, false);
  for (let x = Math.ceil(L1[0]); x <= R0[0]; x++) face(x, L1[1] - (x - L1[0]) / 2, true);
  const [fx, fy] = iso(FU, FV);
  polyFill(fb, [iso(0, 0), iso(N, 0), iso(N, N), iso(0, N)], (x, y) => {
    const dx = x - fx;
    const dy = (y - fy) * 2;
    const d = Math.hypot(dx, dy);
    if (d < 22) return d < 15 ? hex("#3a2a24") : bay(x, y) < (22 - d) / 7 ? hex("#5a4038") : WARM[2];
    const wv = Math.max(0, 1 - d / (88 * flick)) * 3.2;
    if (wv > 0.2 && bay(x, y) < wv) return WARM[Math.max(0, Math.min(2, Math.floor(3 - wv)))];
    if (rnd(Math.floor(x / 3) * 17 + Math.floor(y / 2) * 5) > 0.992) return SNOW[3];
    const t = Math.max(0, Math.min(4, 0.8 + (y - OY) / 120 + (x - OX) / 520));
    const i = Math.floor(t);
    const fr = t - i;
    return SNOW[Math.min(4, i + (fr > 0.6 ? 1 : fr < 0.4 ? 0 : bay(x, y) < (fr - 0.4) / 0.2 ? 1 : 0))];
  });
  for (let u = 0; u <= N; u += 0.5) {
    const [x, y] = iso(u, N);
    put(fb, x, y, SNOW[0]);
    const [x2, y2] = iso(N, u);
    put(fb, x2, y2, SNOW[1]);
  }
};

const PINE = [hex("#2e5a46"), hex("#1f4234"), hex("#132a20"), hex("#e2eaf4"), hex("#a2b4ca"), hex("#3a2618")];
const pine = (fb: Uint8ClampedArray, u: number, v: number, h: number, seed: number) => {
  const [cx, by] = iso(u, v);
  for (let k = 0; k < 14; k++) for (let j = 0; j < 2; j++) put(fb, cx + 2 + k, by + 1 + j, SNOW[3]);
  for (let k = 0; k < 4; k++) {
    put(fb, cx, by - k, PINE[5]);
    put(fb, cx + 1, by - k, PINE[5]);
  }
  const tiers = Math.max(4, Math.round(h / 12));
  for (let y = 0; y < h - 4; y++) {
    const ty = y / (h - 4);
    const tier = (ty * tiers) % 1;
    const half = Math.round((0.42 + 0.58 * tier) * (h * 0.3) * Math.pow(ty, 0.85));
    const yy = by - h + y;
    for (let dx = -half; dx <= half; dx++) {
      if (Math.abs(dx) >= half - 1 && rnd(seed * 31 + y * 7 + dx) > 0.55) continue;
      const side = dx < -half * 0.25 ? 0 : dx < half * 0.35 ? 1 : 2;
      let c = PINE[side];
      if (tier < 0.26 && rnd(seed + y * 13 + dx * 3) < 0.75) c = side === 2 ? PINE[4] : PINE[3];
      else if (rnd(seed * 3 + y * 5 + dx * 11) > 0.93) c = PINE[Math.min(2, side + 1)];
      put(fb, cx + dx, yy, c);
    }
  }
};
const TENT = { lit: hex("#8a9456"), mid: hex("#646e3c"), dark: hex("#3e4626"), door: hex("#1a1410"), glow: hex("#c8783a"), snow: hex("#e2eaf4"), rope: hex("#c8b88a") };
const tent = (fb: Uint8ClampedArray, u0: number, u1: number, v0: number, v1: number, hh: number, glow: number) => {
  const vm = (v0 + v1) / 2;
  polyFill(fb, [iso(u0, vm, hh), iso(u1, vm, hh), iso(u1, v0), iso(u0, v0)], () => TENT.dark);
  polyFill(fb, [iso(u0, vm, hh), iso(u1, vm, hh), iso(u1, v1), iso(u0, v1)], (x, y) => ((x + y * 2) % 9 === 0 ? TENT.mid : TENT.lit));
  for (let u = u0; u <= u1; u += 0.5) {
    const [x, y] = iso(u, vm, hh);
    for (let k = 0; k < 3; k++) put(fb, x - k, y + k, TENT.snow);
  }
  polyFill(fb, [iso(u1, v0), iso(u1, vm, hh), iso(u1, v1)], () => TENT.mid);
  const [px, py] = iso(u1, vm, hh * 0.62);
  const [ax, ay] = iso(u1, vm - 3);
  const [bx, byy] = iso(u1, vm + 3);
  polyFill(fb, [[ax, ay], [px, py], [bx, byy]], (x, y) => (bay(x, y) < glow ? TENT.glow : TENT.door));
  // cordas e estacas
  const [rx, ry] = iso(u1, vm, hh);
  const [sx, sy] = iso(u1 + 5, vm + 4);
  for (let k = 0; k <= 20; k++) put(fb, rx + ((sx - rx) * k) / 20, ry + ((sy - ry) * k) / 20, TENT.rope);
};
const crate = (fb: Uint8ClampedArray, u: number, v: number, s: number, z = 0) => {
  const top = hex("#b08a56");
  const left = hex("#8a6a40");
  const right = hex("#5e4628");
  const line = hex("#3e2c1a");
  polyFill(fb, [iso(u, v, z + s), iso(u + s, v, z + s), iso(u + s, v + s, z + s), iso(u, v + s, z + s)], (x, y) => ((x + y * 2) % 12 === 0 ? line : top));
  polyFill(fb, [iso(u, v + s, z + s), iso(u + s, v + s, z + s), iso(u + s, v + s, z), iso(u, v + s, z)], (x, y) => ((y - Math.round(x / 2)) % 6 === 0 ? line : left));
  polyFill(fb, [iso(u + s, v, z + s), iso(u + s, v + s, z + s), iso(u + s, v + s, z), iso(u + s, v, z)], (x, y) => ((y + Math.round(x / 2)) % 6 === 0 ? line : right));
};
const log = (fb: Uint8ClampedArray, u0: number, u1: number, v: number, r: number) => {
  const bark = [hex("#8a5a32"), hex("#6a4224"), hex("#42281a"), hex("#2a180e")];
  for (let u = u0; u <= u1; u += 0.25) {
    const [x, y] = iso(u, v);
    for (let k = 0; k < r * 2; k++) {
      const t = k / (r * 2);
      put(fb, x, y - k, (Math.round(u * 4) + k) % 7 === 0 ? bark[3] : bark[t < 0.3 ? 2 : t < 0.65 ? 1 : 0]);
    }
    put(fb, x, y - r * 2, hex("#e2eaf4"));
    put(fb, x, y - r * 2 - 1, hex("#c8d4e4"));
  }
  const [ex, ey] = iso(u1, v);
  for (let dy = 0; dy < r * 2; dy++) for (let dx = 0; dx < 3; dx++) put(fb, ex + dx, ey - dy, dy === 0 || dy === r * 2 - 1 || dx === 2 ? hex("#a07240") : (dy + dx) % 3 === 0 ? hex("#b08250") : hex("#d0a46a"));
};

const FW = 28;
const FH = 44;
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
      g[(FH - 1) * FW + x] = m > 0.28 ? Math.min(top, Math.round(top * Math.min(1, m * 1.6) * (0.74 + r() * 0.26))) : 0;
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
        if (dst >= 0) g[dst] = Math.max(0, val - (rr & 1) - (r() < 0.12 ? 1 : 0));
      }
  }
  return g;
};

type Thing = { depth: number; draw: () => void };

const render = (fb: Uint8ClampedArray, f: number, talkAt: number, talkEndAt: number, quietAt: number) => {
  const step = Math.floor(f / 3);
  const ts = step / 10;
  const flick = 0.86 + 0.08 * Math.sin(ts * 11.3) + 0.06 * (rnd(Math.floor(f / 2)) - 0.5) * 2;
  // fundo
  const SKY = ["#05070d", "#080c16", "#0c1220", "#10182a"].map(hex);
  for (let y = 0; y < H; y++) {
    const t = (y / H) * (SKY.length - 1) * 1.1;
    const i = Math.min(SKY.length - 1, Math.floor(t));
    const fr = t - i;
    for (let x = 0; x < W; x++) put(fb, x, y, SKY[Math.min(SKY.length - 1, i + (fr > 0.6 ? 1 : fr < 0.4 ? 0 : bay(x, y) < (fr - 0.4) / 0.2 ? 1 : 0))]);
  }
  const AUR = ["#0f2e2a", "#17483c", "#22704f", "#3fae7e"].map(hex);
  for (let x = 0; x < W; x++) {
    const c0 = 44 + Math.round(Math.sin(x * 0.015 + ts * 0.12) * 12 + Math.sin(x * 0.05 + ts * 0.25) * 4);
    const len = 24 + Math.round(8 * Math.sin(x * 0.025 + 1 + ts * 0.1));
    const ray = 0.55 + 0.45 * Math.sin(x * 0.4 + Math.sin(x * 0.06) * 3 + ts * 0.5);
    for (let y = c0 - len; y < c0 + 4; y++) {
      if (y < 0) continue;
      const v = (y < c0 ? (y - (c0 - len)) / len : 1 - (y - c0) / 4) * ray * Math.sin(Math.PI * Math.min(1, Math.max(0, (x - 40) / 560)));
      const lvl = v * 3.2;
      const li = Math.floor(lvl);
      if (li <= 0 && bay(x, y) > lvl) continue;
      put(fb, x, y, AUR[Math.min(3, Math.max(0, li - (bay(x, y) > lvl - li ? 1 : 0)))]);
    }
  }
  for (let i = 0; i < 160; i++) {
    const x = Math.floor(rnd(i * 3) * W);
    const y = Math.floor(rnd(i * 5) * H * 0.75);
    const tw = rnd(i * 7 + Math.floor(ts * (1 + rnd(i) * 2)));
    put(fb, x, y, hex(tw > 0.85 ? "#e6ecff" : tw > 0.4 ? "#8a96bc" : "#4a5272"));
  }

  BOB = Math.floor(ts / 1.3) % 2;
  drawIsland(fb, flick);

  const things: Thing[] = [];
  const add = (u: number, v: number, draw: () => void) => things.push({ depth: u + v, draw });
  for (const [u, v, h, sd] of [
    [4, 30, 80, 1],
    [3, 52, 68, 2],
    [6, 72, 56, 3],
    [24, 4, 72, 4],
    [46, 3, 84, 5],
    [70, 6, 60, 6],
    [12, 12, 92, 7],
    [86, 18, 48, 8],
    [10, 84, 44, 9],
  ])
    add(u, v, () => pine(fb, u, v, h, sd));
  add(26, 26, () => tent(fb, 12, 26, 18, 34, 16, 0.35 * flick));
  add(74, 22, () => tent(fb, 62, 74, 10, 24, 13, 0.25 * flick));
  add(21, 51, () => {
    crate(fb, 12, 42, 7);
    crate(fb, 12, 42, 6, 7);
  });
  add(28, 58, () => crate(fb, 20, 52, 6));
  add(22, 52, () => {
    const [x, y] = iso(15, 45, 13);
    for (let dy = 0; dy < 8; dy++) for (let dx = -5; dx <= 5; dx++) put(fb, x + dx, y - dy, dy === 0 ? hex("#2a2c30") : dx === -5 || dx === 5 ? hex("#2e3036") : hex("#4a4e56"));
    for (let dx = -3; dx <= 0; dx++) put(fb, x + dx, y - 5, hex("#2a2c30"));
    put(fb, x + 3, y - 5, step % 10 < 5 ? hex("#ff5a3a") : hex("#5a2a20"));
    put(fb, x + 3, y - 3, hex("#8a8e96"));
    for (let k = 0; k < 30; k++) put(fb, x - 4, y - 8 - k, hex("#8a8e96"));
    put(fb, x - 4, y - 38, step % 6 < 3 ? hex("#ff5a3a") : hex("#8a8e96"));
  });
  const bag = (u: number, v: number, col: string, dark: string) =>
    add(u + 4, v + 2, () => {
      polyFill(fb, [iso(u, v, 2), iso(u + 9, v, 2), iso(u + 9, v + 4, 2), iso(u, v + 4, 2)], (x, y) => ((x + y) % 7 === 0 ? hex(dark) : hex(col)));
      polyFill(fb, [iso(u, v + 4, 2), iso(u + 9, v + 4, 2), iso(u + 9, v + 4), iso(u, v + 4)], () => hex(dark));
      polyFill(fb, [iso(u, v, 3), iso(u + 2, v, 3), iso(u + 2, v + 4, 3), iso(u, v + 4, 3)], () => hex("#c8c0b0"));
    });
  bag(36, 70, "#8a3a2a", "#5a2218");
  bag(50, 72, "#3a5a8a", "#22385a");
  add(76, 62, () => {
    for (let k = 0; k < 3; k++) log(fb, 72, 80, 60 + k * 2, 2);
    log(fb, 73, 79, 61, 2);
  });
  add(33, 57, () => log(fb, 27, 39, 57, 4));
  add(66, 48, () => log(fb, 60, 72, 48, 4));
  const g = fireGrid(Math.floor(f / 2) + 40);
  add(FU, FV, () => {
    const [cx, cy] = iso(FU, FV);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const sx = cx + Math.round(Math.cos(a) * 15);
      const sy = cy + Math.round(Math.sin(a) * 7.5);
      for (let dy = 0; dy < 3; dy++) for (let dx = 0; dx < 4; dx++) put(fb, sx + dx - 2, sy - dy, hex(dy === 2 ? "#9a9290" : Math.sin(a) > 0 ? "#6a6260" : "#4a4444"));
    }
    for (let k = -10; k <= 10; k++)
      for (let j = 0; j < 2; j++) {
        put(fb, cx + k, cy - 2 + Math.round(k * 0.3) - j, hex(Math.abs(k) < 4 ? "#ff7a2a" : "#4a2a16"));
        put(fb, cx + k, cy - 2 - Math.round(k * 0.3) - j, hex(Math.abs(k) < 4 ? "#d0480e" : "#6a3a1c"));
      }
    for (let y = 0; y < FH; y++)
      for (let x = 0; x < FW; x++) {
        const val = g[y * FW + x];
        if (val > 1) put(fb, cx - FW / 2 + x, cy - FH + y - 1, FIRE[val]);
      }
  });

  // personagens
  const talking = f >= talkAt && f < talkEndAt;
  const quiet = f >= quietAt ? 1 : 0;
  const tq = f / 30;
  const gestPh = Math.floor(f / 5) % 6;
  const pose: Pose = { t: tq, talk: talking ? [2, 1, 0, 2, 1, 1][gestPh] : 0, gest: talking ? [0.6, 1, 1, 0.8, 0.4, 0.7][gestPh] : 0, quiet };
  const [fireX] = iso(FU, FV);
  const sideOf = (x: number) => (fireX > x ? 1 : -1);
  add(33, 57.5, () => {
    const [x, y] = iso(33, 57);
    drawDoll(fb, drawVarga, pose, x, y + 3, sideOf(x), 0.75 * flick, 0.5);
  });
  add(66, 48.5, () => {
    const [x, y] = iso(66, 48);
    drawDoll(fb, drawGordon, { ...pose, talk: 0, gest: 0 }, x, y + 3, sideOf(x), 0.6 * flick, 0.65);
  });
  add(60, 31, () => {
    const [x, y] = iso(60, 31);
    drawDoll(fb, drawEli, { ...pose, talk: 0, gest: 0 }, x, y + 2, sideOf(x), 0.55 * flick, 0.55);
  });
  add(27, 36, () => {
    const [x, y] = iso(27, 36);
    drawDoll(fb, drawVort, { ...pose, talk: 0, gest: 0 }, x, y + 2, sideOf(x), 0.45 * flick, 0.7);
    const ph = step % 30;
    if (ph < 5) {
      const hx = x + 15;
      const hy = y + 2 - 20;
      for (let k = 0; k < 10; k++) put(fb, hx + Math.round((rnd(step * 7 + k) - 0.5) * 10), hy + Math.round((rnd(step * 11 + k) - 0.5) * 10), hex(k % 2 ? "#9cffb4" : "#3ad070"));
      put(fb, hx, hy, hex("#e8fff0"));
    }
  });
  things.sort((a, b) => a.depth - b.depth);
  for (const t of things) t.draw();

  // fagulhas, fumaça, neve
  const [cx, cy] = iso(FU, FV);
  for (let i = 0; i < 24; i++) {
    const per = 1.4 + rnd(i * 3) * 1.4;
    const a = ((ts + rnd(i * 7) * per) % per) / per;
    if (a > 0.9) continue;
    const x = cx + Math.round((rnd(i * 11) - 0.5) * 12 + Math.sin(a * 7 + i) * 6 * a + a * a * 12);
    const y = cy - 30 - Math.round(a * (52 + rnd(i * 5) * 32));
    put(fb, x, y, FIRE[a < 0.15 ? 8 : a < 0.4 ? 7 : a < 0.65 ? 6 : 4]);
  }
  for (let i = 0; i < 16; i++) {
    const a = ((ts + (i / 16) * 3) % 3) / 3;
    const x = cx + Math.round(Math.sin(a * 4 + i) * 6 + a * 18);
    const y = cy - 48 - Math.round(a * 52);
    if (bay(x, y) < 0.5 * (1 - a)) {
      put(fb, x, y, hex("#2e3036"));
      put(fb, x + 1, y, hex("#2a2c32"));
    }
  }
  for (let i = 0; i < 200; i++) {
    const near = i % 3 === 0;
    const x = Math.floor((((rnd(i * 3) * (W + 20) + ts * (near ? 6 : 4) + Math.sin(ts * 0.8 + i) * 3) % (W + 20)) + W + 20) % (W + 20)) - 10;
    const y = Math.floor((rnd(i * 5) * H + ts * (near ? 22 : 12)) % H);
    put(fb, x, y, hex(near ? "#e8eef6" : "#8e9cb8"));
    if (near) put(fb, x + 1, y, hex("#c8d2e2"));
  }
};

// planos: recorte do quadro 640×360 em escala inteira (×3 tudo · ×4 · ×6 · ×8)
const SHOTS: Record<string, { s: number; x: number; y: number; x2?: number; y2?: number }> = {
  wide: { s: 3, x: 0, y: 0 },
  mid: { s: 4, x: 80, y: 30, x2: 92, y2: 42 },
  close: { s: 6, x: 196, y: 92, x2: 210, y2: 86 },
  varga: { s: 8, x: 200, y: 98, x2: 206, y2: 96 },
};

export const HLIsoCampHD: React.FC<{ life: number; shots?: { cam: string; at: number }[]; talkAt?: number; talkEndAt?: number; quietAt?: number }> = ({ life, shots, talkAt = 1e9, talkEndAt = 1e9, quietAt = 1e9 }) => {
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
    const list = shots && shots.length ? shots : [{ cam: "wide", at: 0 }];
    let i = 0;
    for (let k = 0; k < list.length; k++) if (f >= list[k].at) i = k;
    const sh = SHOTS[list[i].cam] ?? SHOTS.wide;
    const s0 = list[i].at;
    const s1 = list[i + 1]?.at ?? life;
    const k = interpolate(f, [s0, Math.max(s0 + 1, s1)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.sin) });
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
