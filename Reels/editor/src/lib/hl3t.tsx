import React, { useContext, useEffect, useLayoutEffect, useRef, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { MONO } from "./overlays";
import { LiteCtx } from "./sfx-ctx";
import { C, rnd, TitleBlock } from "./hl3";

// 3C · O ACAMPAMENTO VISTO PELA VIGILÂNCIA. Nada de personagem desenhado: um CAMPO DE CALOR (fogo, corpos, barracas,
// pegadas que esfriam, fumaça quente) visto por uma câmera térmica de drone do Overwatch (branco-quente + HUD ciano),
// com a mira travando nas pessoas e as falas do Varga entrando como ÁUDIO INTERCEPTADO. Gente = mancha de calor:
// cabeça, ombros, mãos; o Gordon é o corpo frio do traje H.E.V. com a mochila de energia quente.
// Modos: `camp` (primeira noite), `quiet` (o acampamento quieto e as unidades fechando o cerco), `scan` (o ataque:
// ignorar os rebeldes, travar nos dados) e `patrol` (binóculo do HEV na neve, paleta de ferro e HUD laranja: uma
// pessoa sozinha que vai ficando nítida). `HLArchive`: o arquivo da Resistência (terminal verde) com o depoimento
// marcado. Tempos em QUADROS.

const ICE = "#c6f7ff";
const RED = "#ff5566";
const AMB = "#ffb22e";
const GREEN = "#8dffa8";
const P = (f: number, at: number, d = 12) => interpolate(f, [at, at + d], [0, 1], { ...C, easing: Easing.out(Easing.cubic) });
const flickIn = (f: number, at: number) => {
  const d = f - at;
  if (d < 0) return 0;
  return d < 7 ? [0.25, 1, 0.35, 1, 0.7, 1, 0.9][d] : 1;
};
const pad2 = (n: number) => String(Math.max(0, Math.floor(n))).padStart(2, "0");

// ---------------------------------------------------------------- campo de calor
const RW = 384;
const RH = 216;
type Cam = { tx: number; tz: number; dist: number; pitch: number; fov: number; yaw?: number; ty?: number };
// mancha de calor: no chão (elipse deitada; sem `y`) ou no ar (`y` = altura; vira círculo na tela)
type Blob = { x: number; z: number; rx: number; rz: number; h: number; soft?: number; y?: number; box?: boolean }; // box: retângulo (caixas), não elipse

// ruído por TABELA (o seno por pixel custava caro demais na prévia): 64k valores fixos, endereçados por hash inteiro
const NT = (() => {
  const t = new Float32Array(65536);
  let s = 1234567;
  for (let i = 0; i < t.length; i++) {
    s = (Math.imul(s, 1664525) + 1013904223) | 0;
    t[i] = (s >>> 8) / 16777216;
  }
  return t;
})();
const hash2 = (x: number, y: number) => NT[(Math.imul(Math.floor(x) | 0, 73856093) ^ Math.imul(Math.floor(y) | 0, 19349663)) & 65535];
const vnoise = (x: number, y: number) => {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  return (hash2(xi, yi) * (1 - u) + hash2(xi + 1, yi) * u) * (1 - v) + (hash2(xi, yi + 1) * (1 - u) + hash2(xi + 1, yi + 1) * u) * v;
};

// MAPAS DE CALOR de silhuetas reais (Wikimedia Commons, CC0): sentado, em pé, encolhido. Cinza = temperatura
// (rosto mais quente, miolo do corpo morno, borda esfriando). Carregados uma vez; o quadro espera por eles.
type HM = { w: number; h: number; d: Float32Array };
const HMS: Record<string, HM> = {};
const HM_NAMES = ["sentado", "empe", "empe2", "encolhido", "vort", "hev", "dog", "farda", "rebelde", "varga"]; // vort = contorno 3/4 do modelo do Vortigaunt (vort.glb)
let HM_LOADING: Promise<void> | null = null;
const loadHMs = () => {
  if (!HM_LOADING)
    HM_LOADING = Promise.all(
      HM_NAMES.map(
        (n) =>
          new Promise<void>((ok) => {
            const im = new Image();
            im.onload = () => {
              const c = document.createElement("canvas");
              c.width = im.width;
              c.height = im.height;
              const x = c.getContext("2d")!;
              x.drawImage(im, 0, 0);
              const px = x.getImageData(0, 0, im.width, im.height).data;
              const d = new Float32Array(im.width * im.height);
              for (let i = 0; i < d.length; i++) d[i] = px[i * 4] / 255;
              HMS[n] = { w: im.width, h: im.height, d };
              ok();
            };
            im.onerror = () => ok();
            im.src = staticFile(`hl3silh/${n}.png`);
          }),
      ),
    ).then(() => undefined);
  return HM_LOADING;
};
const useHMs = () => {
  const [ready, setReady] = useState(() => HM_NAMES.every((n) => HMS[n]));
  const [h] = useState(() => (ready ? null : delayRender("mapas de calor")));
  useEffect(() => {
    if (ready) return;
    loadHMs().then(() => {
      setReady(true);
      if (h !== null) continueRender(h);
    });
  }, [ready, h]);
  return ready;
};
// carimba a silhueta no campo: pés em (px, py) do buffer, altura em px; `flip` vira de lado; `shear` = quanto o topo
// desloca na horizontal (em alturas) — a vertical do mundo projetada; `gamma` > 1 = vista de cima (cabeça e tronco
// maiores, pernas encurtadas); `thick` = espessura do corpo vista de cima (fração da altura)
type Stamp = { hm: string; x: number; z: number; hM: number; heat: number; flip?: boolean; shear?: number; flat?: boolean; upright?: boolean }; // flat: sem a cópia de "volume" (braços finos duplicavam)
const stamp = (F: Float32Array, hmName: string, px: number, py: number, hPx: number, heat: number, flip = false, shear = 0, gamma = 1, thick = 0) => {
  const hm = HMS[hmName];
  if (!hm || hPx < 2) return;
  const wPx = (hm.w / hm.h) * hPx * (1 + thick * 0.4);
  const x0 = Math.floor(px - wPx / 2 - Math.abs(shear) * hPx);
  const x1 = Math.ceil(px + wPx / 2 + Math.abs(shear) * hPx);
  const y0 = Math.floor(py - hPx);
  const y1 = Math.ceil(py);
  for (let y = Math.max(0, y0); y <= Math.min(RH - 1, y1); y++) {
    const t = (y - (py - hPx)) / hPx; // 0 = topo da tela, 1 = pés
    if (t < 0 || t >= 1) continue;
    const v = Math.pow(t, gamma); // linha da silhueta (perspectiva de cima)
    const v2 = Math.max(0, v - thick); // a mesma coluna um pouco acima: o volume visto de cima
    const sh = shear * (1 - t) * hPx;
    const r1 = Math.floor(v * hm.h) * hm.w;
    const r2 = Math.floor(v2 * hm.h) * hm.w;
    for (let x = Math.max(0, x0); x <= Math.min(RW - 1, x1); x++) {
      let u = (x - sh - (px - wPx / 2)) / wPx;
      if (u < 0 || u >= 1) continue;
      if (flip) u = 1 - u;
      const cu = Math.floor(u * hm.w);
      const val = Math.max(hm.d[r1 + cu], hm.d[r2 + cu] * 0.92) * heat;
      const i = y * RW + x;
      if (val > F[i]) F[i] = val;
    }
  }
};


// câmera do drone em PERSPECTIVA: alvo no chão (tx,tz), distância, inclinação (pitch, rad), abertura (fov, graus).
// O chão some no horizonte, quem está longe fica menor e mais alto: as pessoas ficam DE PÉ no chão.
type V3 = [number, number, number];
type Proj = { c: V3; r: V3; u: V3; w: V3; foc: number };
const mkProj = (k: Cam): Proj => {
  const yaw = k.yaw ?? 0;
  const cp = Math.cos(k.pitch);
  const spt = Math.sin(k.pitch);
  const ty = k.ty ?? 0;
  const c: V3 = [k.tx + Math.sin(yaw) * cp * k.dist, ty + spt * k.dist, k.tz + Math.cos(yaw) * cp * k.dist];
  const w0: V3 = [k.tx - c[0], ty - c[1], k.tz - c[2]];
  const wl = Math.hypot(...w0);
  const w: V3 = [w0[0] / wl, w0[1] / wl, w0[2] / wl];
  const r0: V3 = [-w[2], 0, w[0]];
  const rl = Math.hypot(...r0);
  const r: V3 = [r0[0] / rl, 0, r0[2] / rl];
  const u: V3 = [r[1] * w[2] - r[2] * w[1], r[2] * w[0] - r[0] * w[2], r[0] * w[1] - r[1] * w[0]];
  return { c, r, u, w, foc: RH / 2 / Math.tan((k.fov * Math.PI) / 360) };
};
const proj = (P: Proj, x: number, y: number, z: number): [number, number, number] => {
  const vx = x - P.c[0];
  const vy = y - P.c[1];
  const vz = z - P.c[2];
  const zc = vx * P.w[0] + vy * P.w[1] + vz * P.w[2];
  const xc = vx * P.r[0] + vy * P.r[1] + vz * P.r[2];
  const yc = vx * P.u[0] + vy * P.u[1] + vz * P.u[2];
  return [RW / 2 + (xc / zc) * P.foc, RH / 2 - (yc / zc) * P.foc, zc];
};

// `step` 2 = prévia do Estúdio (lite): o chão é calculado em 1 de cada 2×2 pixels e repetido (o render usa 1)
const field = (P: Proj, blobs: Blob[], f: number, ground: (wx: number, wz: number) => number, stamps: Stamp[] = [], step = 1) => {
  const F = new Float32Array(RW * RH);
  // chão: um raio por pixel até o plano y = 0 (o que passa do horizonte é o ar frio)
  for (let py = 0; py < RH; py += step)
    for (let px = 0; px < RW; px += step) {
      const a = (px - RW / 2) / P.foc;
      const b = (py - RH / 2) / P.foc;
      const dx = P.w[0] + P.r[0] * a - P.u[0] * b;
      const dy = P.w[1] + P.r[1] * a - P.u[1] * b;
      const dz = P.w[2] + P.r[2] * a - P.u[2] * b;
      let v: number;
      if (dy > -1e-4) v = 0.05;
      else {
        const t = -P.c[1] / dy;
        const wx = P.c[0] + dx * t;
        const wz = P.c[2] + dz * t;
        v = ground(wx, wz);
        const dist = t * Math.hypot(dx, dy, dz);
        v += (0.06 - v) * Math.min(1, Math.max(0, (dist - 30) / 60)); // longe: some na névoa fria
      }
      F[py * RW + px] = v;
      if (step > 1) {
        if (px + 1 < RW) F[py * RW + px + 1] = v;
        if (py + 1 < RH) {
          F[(py + 1) * RW + px] = v;
          if (px + 1 < RW) F[(py + 1) * RW + px + 1] = v;
        }
      }
    }
  for (const bl of blobs) {
    let cx: number;
    let cy: number;
    let rx: number;
    let ry: number;
    if (bl.y === undefined) {
      const [x0, y0, z0] = proj(P, bl.x, 0, bl.z);
      if (z0 <= 0.1) continue;
      cx = x0;
      cy = y0;
      rx = Math.abs(proj(P, bl.x + bl.rx, 0, bl.z)[0] - x0);
      ry = Math.max(0.6, Math.abs(proj(P, bl.x, 0, bl.z + bl.rz)[1] - y0));
    } else {
      const [x0, y0, z0] = proj(P, bl.x, bl.y, bl.z);
      if (z0 <= 0.1) continue;
      const s = P.foc / z0;
      cx = x0;
      cy = y0;
      rx = bl.rx * s;
      ry = bl.rz * s;
    }
    const soft = bl.soft ?? 0.35;
    const xa = Math.max(0, Math.floor(cx - rx - 2));
    const xb = Math.min(RW - 1, Math.ceil(cx + rx + 2));
    const ya = Math.max(0, Math.floor(cy - ry - 2));
    const yb = Math.min(RH - 1, Math.ceil(cy + ry + 2));
    for (let py = ya; py <= yb; py++)
      for (let px = xa; px <= xb; px++) {
        const d = bl.box ? Math.max(Math.abs(px - cx) / Math.max(0.5, rx), Math.abs(py - cy) / Math.max(0.5, ry)) : Math.sqrt(((px - cx) / Math.max(0.5, rx)) ** 2 + ((py - cy) / Math.max(0.5, ry)) ** 2);
        if (d >= 1) continue;
        const k = d < 1 - soft ? 1 : (1 - d) / soft;
        const v = bl.h * k;
        const i = py * RW + px;
        if (v > F[i]) F[i] = v;
      }
  }
  for (const st of stamps) {
    const feet = proj(P, st.x, 0, st.z);
    if (feet[2] <= 0.1) continue;
    const head = proj(P, st.x, st.hM, st.z);
    const hPx = feet[1] - head[1];
    if (hPx < 2) continue;
    // ângulo de visão até a pessoa: de cima → corpo encurtado e com volume; a vertical do mundo inclina na tela
    const dy = P.c[1] - st.hM * 0.5;
    const sinT = dy / Math.hypot(dy, Math.hypot(P.c[0] - st.x, P.c[2] - st.z));
    stamp(F, st.hm, feet[0], feet[1], hPx, st.heat, st.flip, (head[0] - feet[0]) / hPx + (st.shear ?? 0), 1, 0); // sempre em pé (a câmera baixa dá a perspectiva)
    void sinT;
  }
  // ruído do sensor (muda a cada quadro) + listras fixas do detector
  for (let py = 0; py < RH; py++)
    for (let px = 0; px < RW; px++) {
      const i = py * RW + px;
      F[i] += (hash2(px + f * 13.1, py - f * 7.7) - 0.5) * 0.035 + (hash2(px, 3.3) - 0.5) * 0.012;
    }
  return F;
};

// paletas: branco-quente (Overwatch, leve ciano) e ferro (HEV)
const IRON: [number, number, number][] = [
  [8, 6, 20],
  [40, 10, 70],
  [120, 20, 110],
  [200, 60, 60],
  [240, 130, 30],
  [255, 210, 80],
  [255, 250, 220],
];
const paint = (F: Float32Array, img: Uint8ClampedArray, pal: "white" | "iron", gain = 1) => {
  for (let i = 0; i < RW * RH; i++) {
    const v = Math.max(0, Math.min(1, F[i] * gain));
    let r: number;
    let g: number;
    let b: number;
    if (pal === "white") {
      const t = Math.pow(v, 0.95);
      r = 16 + t * 232;
      g = 22 + t * 233;
      b = 28 + t * 227;
    } else {
      const t = v * (IRON.length - 1);
      const k = Math.min(IRON.length - 2, Math.floor(t));
      const fr = t - k;
      r = IRON[k][0] + (IRON[k + 1][0] - IRON[k][0]) * fr;
      g = IRON[k][1] + (IRON[k + 1][1] - IRON[k][1]) * fr;
      b = IRON[k][2] + (IRON[k + 1][2] - IRON[k][2]) * fr;
    }
    img[i * 4] = r;
    img[i * 4 + 1] = g;
    img[i * 4 + 2] = b;
    img[i * 4 + 3] = 255;
  }
};

// ---------------------------------------------------------------- o acampamento (em metros; fogo no 0,0)
type Who = { id: string; x: number; z: number; seated: boolean; hev?: boolean; xeno?: boolean };
const CAMP: Who[] = [
  // o Gordon do lado de cá da fogueira (de costas para a câmera, à esquerda) e o Varga do outro lado, de frente para ele
  { id: "varga", x: 1.1, z: -1.35, seated: false },
  { id: "gordon", x: -1.05, z: 1.45, seated: false, hev: true },
  { id: "eli", x: 2.7, z: -0.3, seated: false },
  { id: "vort", x: -2.9, z: -2.1, seated: false, xeno: true }, // na borda da luz, atrás do Varga (nunca na frente do log)
  { id: "r1", x: -9.6, z: -8.2, seated: false },
  { id: "r2", x: -8.1, z: -9.7, seated: false },
  { id: "r3", x: -10.4, z: -9.9, seated: false },
  { id: "r4", x: 9.3, z: -9.0, seated: false },
  { id: "r5", x: 10.9, z: -10.6, seated: false },
  { id: "r6", x: 4.6, z: -4.2, seated: false },
];
const FIRES: [number, number, number][] = [
  [0, 0, 1],
  [-9.3, -9.2, 0.75],
  [10.2, -9.8, 0.7],
];
const TENTS: [number, number, number, number, number][] = [
  [-6.2, -4.8, 2.4, 1.7, 0.42],
  [5.4, -5.6, 2.2, 1.6, 0.36],
  [-7.6, 3.6, 2.4, 1.6, 0.4],
  [7.2, 4.0, 2.0, 1.5, 0.3],
  [-1.5, -8.2, 2.6, 1.8, 0.38],
];

// objetos do acampamento que o drone identifica: caixas de munição, caixotes, armas encostadas, rádio com mastro,
// gerador (quente), sacos de dormir (mornos). Cada um vira um conjunto de manchas com forma (caixa = blocos lado a lado).
type Prop = { x: number; z: number; kind: "municao" | "caixote" | "armas" | "radio" | "gerador" | "saco"; label?: string };
const PROPS: Prop[] = [
  { x: -2.4, z: 1.9, kind: "municao", label: "MUNIÇÃO" },
  { x: -3.0, z: 1.2, kind: "caixote" },
  { x: 3.2, z: 1.3, kind: "caixote", label: "SUPRIMENTOS" },
  { x: 3.8, z: 0.6, kind: "caixote" },
  { x: -3.4, z: -2.7, kind: "radio", label: "RÁDIO · ANTENA" },
  { x: 2.0, z: 2.6, kind: "armas", label: "ARMAS" },
  { x: 4.6, z: -1.8, kind: "gerador", label: "GERADOR" },
  { x: -1.6, z: -3.4, kind: "saco" },
  { x: 0.4, z: -3.6, kind: "saco" },
  { x: -4.4, z: 0.2, kind: "saco" },
];
const propBlobs = (pr: Prop, f: number): Blob[] => {
  const o: Blob[] = [];
  const box = (cx: number, cz: number, w: number, d: number, hgt: number, heat: number) => {
    // uma caixa de verdade: retângulo (frente) com a tampa um pouco mais fria e a sombra no chão
    o.push({ x: cx, z: cz, rx: w / 2 + 0.08, rz: d / 2 + 0.08, h: heat * 0.45, soft: 0.6 });
    o.push({ x: cx, z: cz, y: hgt * 0.5, rx: w / 2, rz: hgt / 2, h: heat, soft: 0.08, box: true });
    o.push({ x: cx, z: cz, y: hgt - 0.03, rx: w / 2, rz: 0.04, h: heat * 0.8, soft: 0.1, box: true });
  };
  if (pr.kind === "municao") {
    box(pr.x, pr.z, 0.7, 0.4, 0.35, 0.34);
    box(pr.x + 0.05, pr.z, 0.6, 0.35, 0.25, 0.3);
  } else if (pr.kind === "caixote") box(pr.x, pr.z, 0.9, 0.7, 0.7, 0.28);
  else if (pr.kind === "armas") for (let k = 0; k < 4; k++) o.push({ x: pr.x + k * 0.16, z: pr.z, y: 0.5, rx: 0.025, rz: 0.5, h: 0.3, soft: 0.2 });
  else if (pr.kind === "radio") {
    box(pr.x, pr.z, 0.6, 0.4, 0.4, 0.55);
    for (let k = 0; k < 14; k++) o.push({ x: pr.x + 0.25, z: pr.z, y: 0.45 + k * 0.17, rx: 0.02, rz: 0.06, h: 0.32, soft: 0.2 }); // o mastro
    o.push({ x: pr.x + 0.25, z: pr.z, y: 2.9, rx: 0.05, rz: 0.05, h: 0.6 + 0.3 * (Math.floor(f / 15) % 2), soft: 0.4 }); // a luz no topo
  } else if (pr.kind === "gerador") {
    box(pr.x, pr.z, 1.0, 0.6, 0.6, 0.7);
    o.push({ x: pr.x + 0.4, z: pr.z, y: 0.9 + ((f / 30) % 1) * 0.8, rx: 0.12, rz: 0.2, h: 0.35, soft: 0.9 }); // o escapamento
  } else if (pr.kind === "saco") o.push({ x: pr.x, z: pr.z, rx: 0.9, rz: 0.32, h: 0.42, soft: 0.45 });
  return o;
};

// fogo: chão aquecido e pedras (no chão), a chama e a pluma de ar quente (no ar, sobem e entortam com o vento)
const fireBlobs = (fx: number, fz: number, s: number, f: number, amp: number): Blob[] => {
  const out: Blob[] = [];
  const fl = 0.9 + 0.1 * Math.sin(f / 2.7 + fx) * Math.sin(f / 5.3);
  out.push({ x: fx, z: fz, rx: 1.1 * s, rz: 1.1 * s, h: 0.4 * amp, soft: 0.9 });
  out.push({ x: fx, z: fz, rx: 0.6 * s, rz: 0.6 * s, h: 0.58 * amp, soft: 0.25 });
  out.push({ x: fx, z: fz, y: 0.25 * s, rx: 0.32 * s * fl, rz: 0.42 * s * fl, h: 1.1 * amp, soft: 0.5 });
  for (let k = 0; k < 7; k++) {
    const ph = ((f / 30) * 0.5 + k / 7) % 1;
    out.push({ x: fx + ph * 1.2 * s + Math.sin(ph * 6 + k) * 0.15, z: fz - ph * 0.4, y: (0.6 + ph * 3.2) * s, rx: (0.25 + ph * 0.7) * s, rz: (0.25 + ph * 0.7) * s, h: (0.55 - ph * 0.5) * amp, soft: 0.95 });
  }
  return out;
};

const ground = (wx: number, wz: number) => {
  const base = 0.11 + vnoise(wx * 0.35, wz * 0.35) * 0.06 + vnoise(wx * 2.3, wz * 2.3) * 0.025;
  const trail = Math.max(0, 1 - Math.abs(Math.sin(Math.atan2(wz, wx) * 3)) * 6) * Math.max(0, 1 - Math.abs(Math.hypot(wx, wz) - 5) / 4) * 0.035;
  return base + trail;
};

// ---------------------------------------------------------------- moldura do HUD Overwatch
export const Corners: React.FC<{ col: string; o?: number }> = ({ col, o = 1 }) => (
  <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: o }}>
    {[
      [60, 60, 1, 1],
      [1860, 60, -1, 1],
      [60, 1020, 1, -1],
      [1860, 1020, -1, -1],
    ].map(([x, y, sx, sy], i) => (
      <path key={i} d={`M ${x} ${y + sy * 70} L ${x} ${y} L ${x + sx * 70} ${y}`} fill="none" stroke={col} strokeWidth={3} />
    ))}
    <line x1={960 - 28} y1={540} x2={960 - 10} y2={540} stroke={col} strokeWidth={2} opacity={0.7} />
    <line x1={960 + 10} y1={540} x2={960 + 28} y2={540} stroke={col} strokeWidth={2} opacity={0.7} />
    <line x1={960} y1={540 - 28} x2={960} y2={540 - 10} stroke={col} strokeWidth={2} opacity={0.7} />
    <line x1={960} y1={540 + 10} x2={960} y2={540 + 28} stroke={col} strokeWidth={2} opacity={0.7} />
  </svg>
);

const Box: React.FC<{ x: number; y: number; w: number; h: number; col: string; a: number; label: string; sub?: string; s: number }> = ({ x, y, w, h, col, a, label, sub, s }) => {
  const W2 = (w / 2) * s;
  const H2 = (h / 2) * s;
  const c = 16;
  // Prende a legenda ao alvo sem deixá-la escapar da tela ou entrar no log inferior.
  const tx = Math.max(90, Math.min(1510, x - W2));
  const ty = Math.max(190, Math.min(780, y - H2 - 22));
  const anchorX = Math.max(x - W2, Math.min(x + W2, tx + 80));
  const anchorY = y - H2;
  return (
    <g opacity={a}>
      {[
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ].map(([sx, sy], i) => (
        <path key={i} d={`M ${x + sx * W2} ${y + sy * H2 - sy * c} L ${x + sx * W2} ${y + sy * H2} L ${x + sx * W2 - sx * c} ${y + sy * H2}`} fill="none" stroke={col} strokeWidth={3} />
      ))}
      <path d={`M ${anchorX} ${anchorY} L ${tx + 8} ${ty + 6}`} fill="none" stroke={col} strokeWidth={1.5} opacity={0.7} />
      <circle cx={anchorX} cy={anchorY} r={4} fill={col} />
      <text x={tx} y={ty} fill={col} fontFamily={MONO} fontSize={22} letterSpacing={4} style={{ paintOrder: "stroke", stroke: "rgba(0,0,0,0.8)", strokeWidth: 5 }}>
        {label}
      </text>
      {sub ? (
        <text x={tx} y={ty + 25} fill={col} fontFamily={MONO} fontSize={18} letterSpacing={3} opacity={0.9} style={{ paintOrder: "stroke", stroke: "rgba(0,0,0,0.8)", strokeWidth: 5 }}>
          {sub}
        </text>
      ) : null}
    </g>
  );
};

// ---------------------------------------------------------------- o LOG do áudio interceptado
// Caixa FIXA; cada fala é uma linha com a hora e quem fala; as palavras entram no tempo da voz; o que já foi dito
// sobe (a caixa rola). Linhas de sistema entre colchetes (canal aberto, silêncio contando, tradução parcial).
type Word = { w: string; at: number };
type LogEntry = { at: number; who?: string; words?: Word[]; sys?: string; count?: boolean; redact?: boolean; endAt?: number };
const clock = (f: number) => {
  const t = 23 * 3600 + 47 * 60 + 12 + f / 30;
  return `${pad2(t / 3600)}:${pad2((t % 3600) / 60)}:${pad2(t % 60)}`;
};
const LogBox: React.FC<{ f: number; entries: LogEntry[]; openAt: number; head: string }> = ({ f, entries, openAt, head }) => {
  const a = P(f, openAt, 10);
  if (a <= 0.01) return null;
  const vis = entries.filter((e) => f >= e.at);
  const speaking = vis.some((e) => e.words?.length && f >= e.words[0].at && f < e.words[e.words.length - 1].at + 18);
  return (
    <div style={{ position: "absolute", left: 300, right: 300, bottom: 64, opacity: a, transform: `translateY(${(1 - a) * 30}px)` }}>
      <div style={{ background: "rgba(2,12,16,0.82)", border: `2px solid ${ICE}`, borderRadius: 6, padding: "14px 26px 16px", boxShadow: "0 0 30px rgba(120,230,255,0.15)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, fontFamily: MONO, fontSize: 19, letterSpacing: 5, color: ICE }}>
          <span style={{ width: 12, height: 12, borderRadius: 6, background: RED, opacity: Math.floor(f / 12) % 2 ? 1 : 0.35 }} />
          <span>{head}</span>
          <span style={{ flex: 1 }} />
          <svg width={280} height={34}>
            {Array.from({ length: 38 }).map((_, i) => {
              const h = speaking ? 4 + Math.abs(Math.sin(f / 2.3 + i * 0.9) * Math.sin(f / 5.1 + i * 0.37)) * 28 : 2 + rnd(i + Math.floor(f / 3)) * 3;
              return <rect key={i} x={i * 7.4} y={17 - h / 2} width={4} height={h} fill={ICE} opacity={0.85} />;
            })}
          </svg>
        </div>
        <div style={{ position: "relative", height: 176, overflow: "hidden", marginTop: 10, maskImage: "linear-gradient(180deg, transparent 0, #000 40px)" }}>
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, fontFamily: MONO, fontSize: 27, lineHeight: "40px", color: "#eafcff" }}>
            {vis.map((e, i) => {
              const last = i === vis.length - 1;
              const dim = last ? 1 : 0.5;
              if (e.sys) {
                const txt = e.count ? `${e.sys} · ${pad2((Math.min(f, e.endAt ?? f) - e.at) / 30)} s` : e.sys;
                return (
                  <div key={i} style={{ color: "rgba(198,247,255,0.6)", opacity: dim, fontSize: 22, letterSpacing: 3 }}>
                    [{clock(e.at)}] [ {txt} ]
                  </div>
                );
              }
              const ws = (e.words ?? []).filter((w) => f >= w.at);
              // prefixo fixo à esquerda; a fala quebra em quantas linhas precisar, alinhada depois do prefixo
              return (
                <div key={i} style={{ opacity: dim, display: "flex", alignItems: "baseline" }}>
                  <span style={{ flex: "none", color: "rgba(198,247,255,0.55)", fontSize: 22, letterSpacing: 2, marginRight: 14, whiteSpace: "nowrap" }}>
                    [{clock(e.at)}] {e.who} ›
                  </span>
                  <span style={{ flex: 1, minWidth: 0, whiteSpace: "normal", overflowWrap: "break-word" }}>
                    {ws.map((w, j) => (
                      <React.Fragment key={j}>
                        {e.redact && w.w === "█" ? (
                          <span style={{ background: "rgba(198,247,255,0.45)", color: "transparent", borderRadius: 2 }}>████</span>
                        ) : (
                          <span>{w.w}</span>
                        )}{" "}
                      </React.Fragment>
                    ))}
                    {last && ws.length < (e.words ?? []).length ? <span style={{ opacity: Math.floor(f / 6) % 2 ? 1 : 0.2 }}>▮</span> : null}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// leitura discreta do Gordon: o Overwatch registra a reação sem transformar a emoção num símbolo solto
const EmotionCard: React.FC<{ x: number; y: number; f: number; at: number }> = ({ x, y, f, at }) => {
  const k = P(f, at, 10);
  const left = Math.max(90, Math.min(1420, x > 1160 ? x - 470 : x + 90));
  const top = Math.max(150, Math.min(720, y - 110));
  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity: flickIn(f, at) * k }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <path d={`M ${x} ${y} L ${left - 18} ${top + 54} L ${left} ${top + 54}`} fill="none" stroke={ICE} strokeWidth={1.5} strokeDasharray="5 7" opacity={0.55} />
        <circle cx={x} cy={y} r={5} fill={ICE} opacity={0.8} />
      </svg>
      <div style={{ position: "absolute", left, top, width: 360, padding: "14px 18px", background: "rgba(4,18,22,0.78)", border: `1px solid rgba(198,247,255,0.58)`, borderRadius: 5, color: ICE, fontFamily: MONO, transform: `translateX(${(1 - k) * 24}px)` }}>
        <div style={{ fontSize: 14, letterSpacing: 4, opacity: 0.62 }}>LEITURA COMPORTAMENTAL</div>
        <div style={{ marginTop: 8, fontSize: 18, letterSpacing: 3 }}>ALVO 03 · FREEMAN</div>
        <div style={{ marginTop: 7, fontSize: 22, letterSpacing: 2, color: "#eaffff" }}>SENTIMENTO IDENTIFICADO · DÚVIDA</div>
      </div>
    </AbsoluteFill>
  );
};
// o feed fecha numa linha; o mapa seguinte reabre a mesma linha e revela a carta
const FeedClose: React.FC<{ k: number }> = ({ k }) => {
  const slit = Math.max(0, 540 * (1 - k));
  return (
    <>
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 540 - slit, background: "#03060a" }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 540 - slit, background: "#03060a" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 539, height: 2, background: AMB, opacity: P(k, 0.55, 0.25), boxShadow: `0 0 18px ${AMB}` }} />
    </>
  );
};

// ---------------------------------------------------------------- a aura de vortessência (camada do sensor)
// O sensor do Overwatch marca a energia em volta do Vortigaunt: halo verde por cima do térmico, respirando, e fios de
// descarga curtos que correm pela borda do halo (mais e mais fortes quando ele fala).
const VortAura: React.FC<{ f: number; x: number; y: number; ppm: number; a: number; pulse: number }> = ({ f, x, y, ppm, a, pulse }) => {
  const rx = 1.25 * ppm * (1 + 0.05 * Math.sin(f / 9) + pulse * 0.12);
  const ry = 1.55 * ppm * (1 + 0.05 * Math.sin(f / 9) + pulse * 0.12);
  const nArc = 2 + Math.round(pulse * 3);
  const arcs: string[] = [];
  for (let k = 0; k < nArc; k++) {
    const seed = Math.floor(f / 3) * 7 + k * 31;
    const a0 = rnd(seed) * Math.PI * 2;
    const len = 0.5 + rnd(seed + 1) * 0.7;
    let d = "";
    for (let j = 0; j <= 8; j++) {
      const t = a0 + (len * j) / 8;
      const jit = 1 + (rnd(seed + j * 3 + 2) - 0.5) * 0.16;
      d += `${j ? "L" : "M"} ${(x + Math.cos(t) * rx * 0.92 * jit).toFixed(1)} ${(y + Math.sin(t) * ry * 0.92 * jit).toFixed(1)} `;
    }
    arcs.push(d);
  }
  return (
    <>
      <div style={{ position: "absolute", left: x - rx * 1.5, top: y - ry * 1.5, width: rx * 3, height: ry * 3, borderRadius: "50%", background: "radial-gradient(ellipse at 50% 50%, rgba(141,255,168,0.0) 22%, rgba(141,255,168,0.22) 40%, rgba(90,255,170,0.10) 55%, rgba(0,0,0,0) 68%)", opacity: a, mixBlendMode: "screen" }} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, mixBlendMode: "screen" }}>
        {arcs.map((d, i) => (
          <path key={i} d={d} fill="none" stroke={GREEN} strokeWidth={2 + pulse * 1.5} strokeLinejoin="round" opacity={(0.35 + pulse * 0.5) * a * (Math.floor(f / 2 + i) % 3 ? 1 : 0.4)} style={{ filter: "drop-shadow(0 0 6px rgba(141,255,168,0.9))" }} />
        ))}
      </svg>
    </>
  );
};

// ---------------------------------------------------------------- cena
type CamKey = { at: number; cam: Cam };
type CampProps = {
  life: number;
  mode?: "camp" | "vort";
  title?: string;
  sub?: string;
  titleAt?: number;
  titleOutAt?: number;
  gearAt?: number;
  fireAt?: number;
  vargaAt?: number;
  gordonAt?: number;
  closeAt?: number;
  lookAt?: number;
  logAt?: number;
  log?: LogEntry[];
  talkA?: number;
  talkB?: number;
  talkC?: number;
  talkD?: number;
  // modo vort: a mira sai do acampamento e trava no Vortigaunt (`vortAt`), a ficha dele se preenche (`fields`, no
  // estilo da ficha do Varga), em `lookGAt` ele olha para o Gordon (linha até o ALVO 03); `speakAt` = começa a falar
  vortAt?: number;
  lookGAt?: number;
  speakAt?: number;
  fields?: { k: string; v: string; at: number }[];
  // o Gordon não entende: a câmera vai até ele e um "?" acende sobre a cabeça (`qAt`); "a gente também não" = o
  // segundo "?" no HUD (`q2At`); o canal cai em `cutAt`; nos últimos quadros as curvas de nível do mapa se desenham
  // por cima e a imagem térmica escurece (transição para o mapa tático)
  qAt?: number;
  q2At?: number;
  cutAt?: number;
};
const D2R = Math.PI / 180;
const mix = (a: Cam, b: Cam, k: number): Cam => ({ tx: a.tx + (b.tx - a.tx) * k, tz: a.tz + (b.tz - a.tz) * k, dist: a.dist + (b.dist - a.dist) * k, pitch: a.pitch + (b.pitch - a.pitch) * k, fov: a.fov + (b.fov - a.fov) * k, yaw: (a.yaw ?? 0) + ((b.yaw ?? 0) - (a.yaw ?? 0)) * k, ty: (a.ty ?? 0) + ((b.ty ?? 0) - (a.ty ?? 0)) * k });

export const HLThermalCamp: React.FC<CampProps> = (p) => {
  const f = useCurrentFrame();
  const lite = useContext(LiteCtx);
  useHMs();
  const ref = useRef<HTMLCanvasElement>(null);
  const mode = p.mode ?? "camp";
  const N = 1e9;
  const at = (v?: number) => v ?? N;
  const V = CAMP.find((w) => w.id === "varga")!;
  const G = CAMP.find((w) => w.id === "gordon")!;
  const X = CAMP.find((w) => w.id === "vort")!;
  // câmera: chaves presas às falas, transição suave entre elas, deriva lenta de drone
  const keys: CamKey[] =
    mode === "camp"
      ? [
          { at: 0, cam: { tx: 0, tz: -1.5, dist: 30, pitch: 34 * D2R, fov: 30, yaw: -0.15 } },
          { at: at(p.fireAt), cam: { tx: 0, tz: -0.5, dist: 19, pitch: 30 * D2R, fov: 30, yaw: -0.1 } },
          { at: at(p.closeAt), cam: { tx: 0, tz: 0.0, dist: 11, pitch: 25 * D2R, fov: 30, yaw: 0.05 } },
          { at: at(p.lookAt), cam: { tx: V.x - 0.4, tz: V.z + 0.6, dist: 9, pitch: 18 * D2R, fov: 30, yaw: 0.2, ty: 1.0 } },
        ].filter((k) => k.at < N)
      : [
          // começa no acampamento (de onde a conversa estava) e corre para a borda da luz
          { at: 0, cam: { tx: -0.4, tz: -0.2, dist: 12, pitch: 26 * D2R, fov: 30, yaw: 0.05, ty: 0.6 } },
          { at: Math.max(1, at(p.vortAt) - 22), cam: { tx: X.x + 1.6, tz: X.z + 0.3, dist: 9.5, pitch: 23 * D2R, fov: 30, yaw: -0.25, ty: 0.8 } },
          { at: at(p.vortAt) + 30, cam: { tx: X.x + 1.25, tz: X.z + 0.2, dist: 7.4, pitch: 19 * D2R, fov: 30, yaw: -0.3, ty: 1.0 } },
          // ele olha para o Gordon: a câmera abre para caber os dois
          { at: at(p.lookGAt), cam: { tx: (X.x + G.x) / 2 + 0.3, tz: (X.z + G.z) / 2, dist: 10.5, pitch: 24 * D2R, fov: 30, yaw: -0.2, ty: 0.6 } },
          // fala: volta a fechar devagar nele
          { at: at(p.speakAt) + 40, cam: { tx: X.x + 1.1, tz: X.z + 0.2, dist: 7.8, pitch: 20 * D2R, fov: 30, yaw: -0.32, ty: 1.0 } },
          // o Gordon (de costas, sentado): a câmera vai até ele
          { at: at(p.qAt), cam: { tx: G.x - 0.3, tz: G.z + 0.3, dist: 7.2, pitch: 22 * D2R, fov: 30, yaw: 0.25, ty: 0.7 } },
          // fim: sobe até ficar de cima, como o mapa
          { at: Math.max(at(p.qAt) + 30, p.life - 34), cam: { tx: 0, tz: -0.3, dist: 16, pitch: 78 * D2R, fov: 30, yaw: 0, ty: 0 } },
        ].filter((k) => k.at < N);
  let ki = 0;
  for (let k = 0; k < keys.length; k++) if (f >= keys[k].at) ki = k;
  const prev = keys[Math.max(0, ki - 1)];
  const cur = keys[ki];
  const next = keys[ki + 1];
  const span = Math.max(20, Math.min(60, ((next?.at ?? p.life) - cur.at) * 0.6));
  const kk = ki === 0 ? 1 : interpolate(f, [cur.at, cur.at + span], [0, 1], { ...C, easing: Easing.inOut(Easing.sin) });
  const cam0 = mix(prev.cam, cur.cam, kk);
  const camD: Cam = { ...cam0, tx: cam0.tx + Math.sin(f / 90) * 0.12, tz: cam0.tz + Math.cos(f / 110) * 0.08, yaw: (cam0.yaw ?? 0) + Math.sin(f / 140) * 0.03 };
  // saída do Vortigaunt para o mapa tático: o drone sobe e se afasta (zoom out) no último meio segundo; o mapa entra
  // visto de cima, continuando o movimento
  const outK = mode === "vort" && p.qAt === undefined ? Easing.in(Easing.cubic)(Math.max(0, Math.min(1, (f - (p.life - 16)) / 16))) : 0;
  const mapK = mode === "vort" && p.qAt !== undefined ? Math.max(0, Math.min(1, (f - (p.life - 54)) / 54)) : 0;
  const cam: Cam = outK > 0 ? { ...camD, dist: camD.dist * (1 + outK * 3.2), pitch: camD.pitch + (1.35 - camD.pitch) * outK, ty: (camD.ty ?? 0) * (1 - outK) } : camD;
  const P3 = mkProj(cam);

  const talks: [number, number][] = [
    [at(p.talkA), at(p.talkB)],
    [at(p.talkC), at(p.talkD)],
  ];
  const vargaTalk = mode === "camp" && talks.some(([s, e]) => f >= s && f < e);
  // a aura do Vortigaunt pulsa a cada palavra que ele diz (some em 10 quadros)
  let vortPulse = 0;
  if (mode === "vort")
    for (const e of p.log ?? [])
      if (e.who === "ALVO 05") for (const w of e.words ?? []) if (f >= w.at && f < w.at + 10) vortPulse = Math.max(vortPulse, 1 - (f - w.at) / 10);

  useLayoutEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const blobs: Blob[] = [];
    TENTS.forEach(([x, z, w, d, h], i) => {
      blobs.push({ x, z, rx: w / 2, rz: d / 2, h: h * 0.7, soft: 0.25 });
      // (sem a mancha no ar: parecia uma bola flutuando)
      void i;
    });
    blobs.push({ x: -3.6, z: -2.4, rx: 0.5, rz: 0.4, h: 0.2, soft: 0.15 }, { x: -3.0, z: -2.9, rx: 0.4, rz: 0.35, h: 0.2, soft: 0.15 }, { x: -3.4, z: -2.5, y: 0.5, rx: 0.1, rz: 0.1, h: 0.55, soft: 0.5 });
    for (let k = 0; k < 26; k++) {
      const a = (k / 26) * Math.PI * 1.6 + 0.4;
      const r = 5.5 + Math.sin(k * 1.7) * 0.4;
      blobs.push({ x: Math.cos(a) * r + (k % 2 ? 0.15 : -0.15), z: Math.sin(a) * r, rx: 0.1, rz: 0.13, h: 0.2 - (k / 26) * 0.06, soft: 0.6 });
    }
    FIRES.forEach(([x, z, s], i) => blobs.push(...fireBlobs(x, z, s, f, i === 0 ? 1 : 0.8)));

    const stamps: Stamp[] = [];
    CAMP.forEach((w, i) => {
      const br = 1 + 0.012 * Math.sin(f / 22 + i);
      blobs.push({ x: w.x, z: w.z, rx: 0.55, rz: 0.55, h: 0.22, soft: 0.95 }); // o chão morno em volta de quem está ali
      if (w.xeno) {
        // a aura de vortessência: um halo de ar morno em volta do corpo, pulsando (mais forte quando ele fala)
        const pulse = 0.8 + 0.2 * Math.sin(f / 9) + vortPulse * 0.35;
        blobs.push({ x: w.x, z: w.z, y: 1.0, rx: 1.0 * pulse, rz: 1.25 * pulse, h: 0.3 * pulse, soft: 0.95 });
        stamps.push({ hm: "vort", x: w.x, z: w.z, hM: 1.85 * br, heat: 0.8, flat: true });
      }
      // todos em pé (sentados pareciam flutuar); o Gordon é a silhueta do traje HEV, com ele dentro
      else if (w.hev) stamps.push({ hm: "hev", x: w.x, z: w.z, hM: 1.88 * br, heat: 0.95 });
      else if (w.id === "varga") stamps.push({ hm: "varga", x: w.x, z: w.z, hM: 1.82 * br, heat: 0.95 }); // o Varga (render dele), apontando para o Gordon
      else stamps.push({ hm: i % 2 ? "empe" : "empe2", x: w.x, z: w.z, hM: 1.75 * br, heat: 0.88 });
    });
    // a mão do Varga mexe enquanto ele fala
    if (vargaTalk) blobs.push({ x: V.x + 0.42 + Math.sin(f / 4) * 0.06, z: V.z, y: 0.85 + Math.abs(Math.sin(f / 5)) * 0.18, rx: 0.07, rz: 0.07, h: 0.9, soft: 0.8 });
    const F = field(P3, blobs, f, ground, stamps, lite ? 2 : 1);
    const octx = cv.getContext("2d")!;
    const img = octx.createImageData(RW, RH);
    paint(F, img.data, "white", 1.22);
    octx.putImageData(img, 0, 0);
  });

  // travas (posição na tela a partir da mesma projeção)
  const sp = (x: number, y: number, z: number): [number, number] => {
    const [px, py] = proj(P3, x, y, z);
    return [px * 5, py * 5];
  };
  const pxPerM = (x: number, z: number) => (P3.foc / Math.max(0.5, proj(P3, x, 0, z)[2])) * 5;
  type L = { at: number; until?: number; label: string; sub?: string; red?: boolean; x: number; y: number; z: number; w: number; h: number };
  const locks: L[] = [];
  const propTags: Prop[] = []; // (objetos tirados: não dava para identificar)
  if (mode === "camp") {
    locks.push({ at: at(p.gearAt), until: at(p.fireAt) + 30, label: "ACAMPAMENTO · 5 ABRIGOS", sub: "RÁDIO · ANTENA", x: -3.3, y: 0.4, z: -2.6, w: 1.8, h: 1.6 });
    locks.push({ at: at(p.fireAt), until: at(p.vargaAt), label: "FONTE DE CALOR", sub: "640 °C", x: 0, y: 0.5, z: 0, w: 1.6, h: 1.8 });
    locks.push({ at: at(p.vargaAt), label: "ALVO 02 · HUMANO", sub: "DÁ ORDENS AO GRUPO", x: V.x, y: 0.62, z: V.z, w: 1.2, h: 1.6 });
    locks.push({ at: at(p.gordonAt), label: "ALVO 03 · TRAJE H.E.V.", sub: "ASSINATURA ANÔMALA", x: G.x, y: 0.62, z: G.z, w: 1.2, h: 1.6 });
    locks.push({ at: at(p.gordonAt) + 40, until: at(p.closeAt) + 20, label: "AURA DE VORTESSÊNCIA", x: X.x, y: 0.95, z: X.z, w: 1.3, h: 2.2 });
    locks.push({ at: at(p.gearAt) + 18, until: at(p.vargaAt), label: "PERÍMETRO · RESISTÊNCIA", sub: "SENTINELAS NA MATA", x: -8.8, y: 0.8, z: -8.8, w: 3.0, h: 2.2 });
    locks.push({ at: at(p.fireAt) + 14, until: at(p.gordonAt), label: "GRUPO EM MOVIMENTO", sub: "RUMO AO NORTE", x: 8.8, y: 0.8, z: -7.5, w: 3.0, h: 2.2 });
  } else {
    const named = p.fields?.length ? at(p.fields[0].at) : at(p.vortAt) + 20;
    locks.push({ at: at(p.vortAt), until: named, label: "ALVO 05 · NÃO HUMANO", sub: "ANALISANDO…", x: X.x, y: 0.95, z: X.z, w: 1.3, h: 2.2 });
    locks.push({ at: named, label: "ALVO 05 · VORTIGAUNT", sub: "AURA DE VORTESSÊNCIA", x: X.x, y: 0.95, z: X.z, w: 1.3, h: 2.2 });
    locks.push({ at: at(p.lookGAt) + 8, label: "ALVO 03 · TRAJE H.E.V.", sub: "OBSERVADO PELO ALVO 05", x: G.x, y: 0.62, z: G.z, w: 1.2, h: 1.6 });
  }
  const link = mode === "camp" ? P(f, at(p.gordonAt) + 6, 14) * (1 - P(f, at(p.closeAt) + 30, 10)) : 0;
  const linkX = mode === "vort" ? P(f, at(p.lookGAt), 16) : 0;
  const [vx, vy] = sp(V.x, 0.62, V.z);
  const [gx, gy] = sp(G.x, 0.62, G.z);
  const [xx, xy] = sp(X.x, 1.45, X.z);
  const xppm = pxPerM(X.x, X.z);
  const auraA = mode === "vort" ? 0.55 + 0.25 * Math.sin(f / 9) + vortPulse * 0.4 : f >= at(p.gordonAt) + 40 ? 0.3 + 0.12 * Math.sin(f / 9) : 0;
  const fields = mode === "vort" ? p.fields ?? [] : [];
  const panelOut = P(f, at(p.lookGAt) - 4, 10);
  const panelOn = fields.length && f >= at(fields[0].at) - 6 && panelOut < 1;
  const hudIn = flickIn(f, 2);
  const zoomTxt = (34 / cam.dist).toFixed(1);
  const t = 23 * 3600 + 47 * 60 + 12 + f / 30;
  return (
    <AbsoluteFill style={{ background: "#101418" }}>
      <canvas ref={ref} width={RW} height={RH} style={{ position: "absolute", left: -8, top: -8, width: 1936, height: 1096, filter: "blur(2px)" }} />
      <AbsoluteFill style={{ background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.16) 0 2px, rgba(0,0,0,0) 2px 4px)" }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: ((f * 11) % 1300) - 120, height: 4, background: "rgba(220,250,255,0.12)" }} />
      {auraA > 0 ? <VortAura f={f} x={xx} y={xy + 0.5 * xppm} ppm={xppm} a={auraA} pulse={vortPulse} /> : null}
      <AbsoluteFill style={{ opacity: hudIn }}>
        <Corners col={ICE} />
        <div style={{ position: "absolute", left: 92, top: 84, fontFamily: MONO, fontSize: 22, letterSpacing: 6, color: ICE }}>
          OVERWATCH · VIGILÂNCIA AÉREA · S-17
          <div style={{ fontSize: 17, letterSpacing: 4, opacity: 0.75, marginTop: 8 }}>SETOR 31 · NORTE · TÉRMICO BRANCO-QUENTE</div>
        </div>
        <div style={{ position: "absolute", right: 92, top: 84, textAlign: "right", fontFamily: MONO, fontSize: 22, letterSpacing: 6, color: ICE }}>
          {pad2(t / 3600)}:{pad2((t % 3600) / 60)}:{pad2(t % 60)}
          <div style={{ fontSize: 17, letterSpacing: 4, opacity: 0.75, marginTop: 8 }}>
            <span style={{ color: RED, opacity: Math.floor(f / 15) % 2 ? 1 : 0.3 }}>● </span>REC · ZOOM ×{zoomTxt}
          </div>
        </div>
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          {Array.from({ length: 41 }).map((_, i) => {
            const x = 560 + i * 20 - (((cam.yaw ?? 0) * 900) % 20);
            return <line key={i} x1={x} y1={150} x2={x} y2={i % 5 === 0 ? 166 : 158} stroke={ICE} strokeWidth={2} opacity={0.5} />;
          })}
          {link > 0 ? <line x1={vx} y1={vy} x2={vx + (gx - vx) * link} y2={vy + (gy - vy) * link} stroke={ICE} strokeWidth={2} strokeDasharray="10 8" opacity={0.8} /> : null}
          {linkX > 0 ? (
            <>
              <line x1={xx} y1={xy} x2={xx + (gx - xx) * linkX} y2={xy + (gy - xy) * linkX} stroke={GREEN} strokeWidth={2} strokeDasharray="10 8" opacity={0.85} />
              <text x={xx + (gx - xx) * 0.5 + 12} y={xy + (gy - xy) * 0.5 - 14} fill={GREEN} fontFamily={MONO} fontSize={17} letterSpacing={3} opacity={P(f, at(p.lookGAt) + 10, 10)} style={{ paintOrder: "stroke", stroke: "#000", strokeWidth: 4 }}>
                DIREÇÃO DO OLHAR
              </text>
            </>
          ) : null}
          {propTags.map((pr, i) => {
            const [x, y] = sp(pr.x, pr.kind === "radio" ? 3.1 : 1.0, pr.z);
            const a = flickIn(f, at(p.fireAt) + 20 + i * 6);
            if (x < 40 || x > 1880 || y < 120 || y > 980) return null;
            return (
              <g key={`pt${i}`} opacity={0.8 * a}>
                <line x1={x} y1={y + 4} x2={x} y2={y + 18} stroke={ICE} strokeWidth={1.4} />
                <text x={x} y={y} textAnchor="middle" fill={ICE} fontFamily={MONO} fontSize={15} letterSpacing={3} style={{ paintOrder: "stroke", stroke: "rgba(0,0,0,0.85)", strokeWidth: 4 }}>
                  {pr.label}
                </text>
              </g>
            );
          })}
          {locks.map((l, i) => {
            if (f < l.at || f >= (l.until ?? N)) return null;
            const [x, y] = sp(l.x, l.y, l.z);
            const ppm = pxPerM(l.x, l.z);
            const s = 1 + (1 - P(f, l.at, 10)) * 0.6;
            const out = l.until ? 1 - P(f, l.until - 6, 6) : 1;
            return <Box key={i} x={x} y={y} w={Math.max(70, l.w * ppm)} h={Math.max(80, l.h * ppm)} col={l.red ? RED : ICE} a={flickIn(f, l.at) * out} label={l.label} sub={l.sub} s={s} />;
          })}
        </svg>
        {panelOn ? (
          // a ficha do Vortigaunt, no mesmo esquema da do Varga (lado direito, campos digitados), nas cores do Overwatch
          <div style={{ position: "absolute", left: 1330, top: 236, width: 500, padding: "20px 26px", background: "rgba(4,18,22,0.74)", border: `1px solid ${ICE}`, borderRadius: 8, fontFamily: MONO, color: ICE, opacity: P(f, at(fields[0].at) - 6, 10) * (1 - panelOut), transform: `translateX(${panelOut * 40}px)` }}>
            <div style={{ fontSize: 17, letterSpacing: 5, opacity: 0.7 }}>ANÁLISE · OVERWATCH</div>
            <div style={{ fontSize: 44, fontWeight: 700, letterSpacing: 8, margin: "8px 0 14px" }}>ALVO 05</div>
            {fields.map((fl, i) => {
              const n = Math.floor(interpolate(f, [fl.at, fl.at + 16], [0, fl.v.length], C));
              return f >= fl.at ? (
                <div key={i} style={{ marginBottom: 14, opacity: flickIn(f, fl.at) }}>
                  <div style={{ fontSize: 16, letterSpacing: 5, opacity: 0.65 }}>{fl.k}</div>
                  <div style={{ fontSize: 28, letterSpacing: 2, color: /vortess/i.test(fl.v) ? GREEN : "#eafcff" }}>
                    {fl.v.slice(0, n)}
                    {n < fl.v.length ? <span style={{ opacity: Math.floor(f / 5) % 2 ? 1 : 0.2 }}>▮</span> : null}
                  </div>
                </div>
              ) : null;
            })}
          </div>
        ) : null}
      </AbsoluteFill>
      {mode === "vort" && f >= at(p.qAt) ? <EmotionCard x={sp(G.x, 1.25, G.z)[0]} y={sp(G.x, 1.25, G.z)[1]} f={f} at={at(p.qAt)} /> : null}
      {mapK > 0 ? <FeedClose k={mapK} /> : null}
      <LogBox f={f} entries={p.log ?? []} openAt={at(p.logAt)} head={mode === "camp" ? "ÁUDIO INTERCEPTADO · CANAL 4 · TRANSCRIÇÃO AUTOMÁTICA" : "ÁUDIO INTERCEPTADO · ALVO 05 · TRADUÇÃO PARCIAL"} />
      {p.title ? <TitleBlock title={p.title} sub={p.sub} at={at(p.titleAt)} out={at(p.titleOutAt)} /> : null}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- o Varga visto pelo HEV do Gordon (dossiê)
// "É nessa saída que ele começa a reparar em Varga": visão térmica do traje (paleta de ferro, HUD laranja) na altura
// dos olhos, o comboio saindo de White Forest — gente carregando, o caminhão com o motor quente — a lente varre o grupo,
// trava em um homem que dá ordens (a mão sobe e desce) e o HEV vai preenchendo a ficha dele. Tempos em QUADROS.
const SQUAD: { x: number; z: number; hm: string; flip?: boolean }[] = [
  { x: -4.2, z: -8.5, hm: "empe" },
  { x: -2.9, z: -6.2, hm: "empe2" },
  { x: 2.2, z: -7.4, hm: "empe" },
  { x: 3.4, z: -9.6, hm: "empe2", flip: true },
  { x: 0.9, z: -11.5, hm: "empe" },
  { x: -6.0, z: -12.0, hm: "empe2" },
];
const VARGA_AT = { x: -0.9, z: -5.4 };
export const HLHevScan: React.FC<{ life: number; noticeAt?: number; nameAt?: number; fields?: { k: string; v: string; at: number }[]; place?: string }> = ({ life, noticeAt = 1e9, nameAt = 1e9, fields = [], place = "SAÍDA DE WHITE FOREST · COMBOIO 01" }) => {
  const f = useCurrentFrame();
  const lite = useContext(LiteCtx);
  useHMs();
  const ref = useRef<HTMLCanvasElement>(null);
  // câmera na altura dos olhos: varre o grupo da direita para a esquerda e, no "reparar", fecha no Varga
  const scan = interpolate(f, [0, noticeAt], [0, 1], { ...C, easing: Easing.inOut(Easing.sin) });
  const k = P(f, noticeAt, 40);
  const cam: Cam = {
    tx: 2.6 - scan * 3.0 + (VARGA_AT.x + 0.5 - (2.6 - 3.0)) * k + Math.sin(f / 23) * 0.05 * (1 - k),
    tz: -7.5 + (VARGA_AT.z + 0.6 + 7.5) * k,
    dist: 10.5 - k * 4.0,
    pitch: (7 - k * 1.5) * (Math.PI / 180),
    fov: 34 - k * 7,
    yaw: 0.04 * Math.sin(f / 70),
    ty: 0.95,
  };
  const P3 = mkProj(cam);
  const clear = P(f, nameAt, 30);
  useLayoutEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const wind = f / 30;
    const gnd = (wx: number, wz: number) => 0.08 + vnoise(wx * 0.5 + wind * 0.4, wz * 0.5) * 0.08 + vnoise(wx * 2.6 - wind * 2, wz * 2.6) * 0.035;
    const blobs: Blob[] = [];
    // caminhão: lataria morna, o motor quente na frente, o escapamento soltando ar quente
    blobs.push({ x: 4.6, z: -10.5, rx: 1.6, rz: 0.9, h: 0.3, soft: 0.2 });
    blobs.push({ x: 4.6, z: -10.5, y: 0.9, rx: 1.4, rz: 0.7, h: 0.34, soft: 0.3 });
    blobs.push({ x: 3.2, z: -10.5, y: 0.8, rx: 0.5, rz: 0.4, h: 0.85, soft: 0.6 });
    for (let j = 0; j < 4; j++) {
      const ph = ((f / 30) * 0.7 + j / 4) % 1;
      blobs.push({ x: 6.3 + ph * 0.6, z: -10.5, y: 0.6 + ph * 1.6, rx: 0.2 + ph * 0.4, rz: 0.2 + ph * 0.4, h: 0.5 - ph * 0.45, soft: 0.95 });
    }
    // caixas sendo carregadas (frias) e pegadas
    for (let j = 0; j < 5; j++) blobs.push({ x: 2.8 + (j % 3) * 0.6, z: -8.8 - Math.floor(j / 3) * 0.5, rx: 0.3, rz: 0.25, h: 0.16, soft: 0.2 });
    const stamps: Stamp[] = SQUAD.map((s, i) => ({ hm: s.hm, x: s.x, z: s.z, hM: 1.75, heat: 0.86, flip: s.flip }));
    stamps.push({ hm: "varga", x: VARGA_AT.x, z: VARGA_AT.z, hM: 1.82, heat: 0.95 }); // o Varga (render dele): gorro, colete, apontando
    const F = field(P3, blobs, f, gnd, stamps, lite ? 2 : 1);
    for (let n = 0; n < 160 * (1 - clear * 0.6); n++) {
      const x = Math.floor((rnd(n * 3) * RW + f * (2 + rnd(n) * 4)) % RW);
      const y = Math.floor((rnd(n * 7) * RH + f * (0.6 + rnd(n * 5))) % RH);
      F[y * RW + x] = Math.min(F[y * RW + x], 0.03);
    }
    const octx = cv.getContext("2d")!;
    const img = octx.createImageData(RW, RH);
    paint(F, img.data, "iron", 1.05);
    octx.putImageData(img, 0, 0);
  });
  const [bx, by] = proj(P3, VARGA_AT.x, 0.9, VARGA_AT.z);
  const ppm = (P3.foc / Math.max(0.5, proj(P3, VARGA_AT.x, 0, VARGA_AT.z)[2])) * 5;
  const lk = P(f, noticeAt, 10);
  const named = f >= nameAt;
  const BX = bx * 5;
  const BY = by * 5;
  const panelX = 1030;
  return (
    <AbsoluteFill style={{ background: "#08060f" }}>
      <canvas ref={ref} width={RW} height={RH} style={{ position: "absolute", left: -8, top: -8, width: 1936, height: 1096, filter: `blur(${1.4 + (1 - clear) * 1.2}px)` }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 58%, rgba(5,4,10,0.85) 100%)" }} />
      <AbsoluteFill style={{ background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.14) 0 2px, rgba(0,0,0,0) 2px 4px)" }} />
      <AbsoluteFill style={{ opacity: flickIn(f, 2) }}>
        <Corners col={AMB} />
        <div style={{ position: "absolute", left: 92, top: 84, fontFamily: MONO, fontSize: 22, letterSpacing: 6, color: AMB }}>
          H.E.V. · VISÃO TÉRMICA
          <div style={{ fontSize: 17, letterSpacing: 4, opacity: 0.75, marginTop: 8 }}>{place}</div>
        </div>
        <div style={{ position: "absolute", right: 92, top: 84, textAlign: "right", fontFamily: MONO, fontSize: 22, letterSpacing: 6, color: AMB }}>
          AMPLIAÇÃO ×{(34 / cam.fov).toFixed(1)}
          <div style={{ fontSize: 17, letterSpacing: 4, opacity: 0.75, marginTop: 8 }}>{named ? "IDENTIFICADO" : f >= noticeAt ? "ANALISANDO…" : "VARREDURA"}</div>
        </div>
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          {f >= noticeAt ? (
            <>
              <Box x={BX} y={BY} w={Math.max(120, 1.0 * ppm)} h={Math.max(180, 1.9 * ppm)} col={AMB} a={flickIn(f, noticeAt)} label={named ? "VARGA" : "ALVO · DÁ ORDENS"} sub={named ? "RESISTÊNCIA · LIDERANÇA" : "ANALISANDO…"} s={1 + (1 - lk) * 0.7} />
              {named && fields.length ? <path d={`M ${BX + Math.max(60, 0.6 * ppm)} ${BY} L ${1080} ${BY} L ${1080} 256 L ${1106} 256`} fill="none" stroke={AMB} strokeWidth={2} opacity={0.6 * P(f, nameAt + 6, 14)} /> : null}
            </>
          ) : null}
        </svg>
        {f >= noticeAt ? (
          // a ficha no MESMO molde da da Alyx: foto de registro com régua de altura, varredura e pontos do rosto,
          // correspondência subindo, campos digitados na fala e a linha de STATUS
          <div style={{ position: "absolute", left: 1110, top: 196, width: 720, opacity: P(f, noticeAt, 14), transform: `translateX(${(1 - P(f, noticeAt, 14)) * 60}px)`, fontFamily: MONO, color: AMB }}>
            <div style={{ position: "relative", padding: "18px 24px 22px", background: "rgba(30,16,4,0.9)", border: `1px solid ${AMB}`, borderRadius: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 16, fontSize: 15, letterSpacing: 4, opacity: 0.85 }}>
                <span>H.E.V. · RECONHECIMENTO FACIAL</span>
                <span style={{ color: "#ffd9a0", opacity: named ? 1 : Math.floor(f / 8) % 2 ? 1 : 0.35 }}>{named ? "IDENTIFICADO" : "IDENTIFICANDO…"}</span>
              </div>
              <div style={{ display: "flex", gap: 24, marginTop: 14 }}>
                <div style={{ position: "relative", width: 300, height: 372, flex: "none", overflow: "hidden", borderRadius: 4, border: "1px solid rgba(255,178,46,0.6)", background: "linear-gradient(180deg, #8d9196, #6f7378)" }}>
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} style={{ position: "absolute", left: 0, right: 0, top: 22 + i * 42, height: 1, background: "rgba(20,22,26,0.5)" }}>
                      <span style={{ position: "absolute", left: 6, top: -16, fontSize: 12, color: "rgba(20,22,26,0.75)", letterSpacing: 1 }}>{(1.9 - i * 0.1).toFixed(2)}</span>
                    </div>
                  ))}
                  <Img src={staticFile("hl3silh/varga_retrato.png")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 30%", filter: named ? `saturate(${0.6 + P(f, nameAt, 10) * 0.35}) contrast(1.05)` : "grayscale(1) contrast(1.4) blur(2.5px)" }} />
                  {!named ? (
                    <>
                      <div style={{ position: "absolute", left: 0, right: 0, top: ((f - noticeAt) * 9) % 372, height: 3, background: AMB, boxShadow: `0 0 16px ${AMB}`, opacity: 0.9 }} />
                      {[[0.36, 0.42], [0.6, 0.42], [0.48, 0.55], [0.48, 0.66]].map(([x, y], i) => (
                        <div key={i} style={{ position: "absolute", left: x * 300 - 5, top: y * 372 - 5, width: 10, height: 10, border: `2px solid ${AMB}`, borderRadius: 5, opacity: f >= noticeAt + 4 + i * 3 ? 0.9 : 0 }} />
                      ))}
                    </>
                  ) : (
                    <div style={{ position: "absolute", left: 14, bottom: 14, padding: "4px 10px", border: `2px solid ${AMB}`, fontSize: 15, letterSpacing: 3, background: "rgba(30,16,4,0.7)", transform: `rotate(-4deg) scale(${1 + (1 - P(f, nameAt, 10)) * 0.5})`, opacity: P(f, nameAt, 10) }}>REGISTRO 1-0412</div>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, letterSpacing: 4, opacity: 0.65 }}>CORRESPONDÊNCIA</div>
                  <div style={{ fontSize: 34, letterSpacing: 2, color: "#ffe2b0", marginBottom: 12 }}>{Math.min(98, Math.round(interpolate(f, [noticeAt + 2, nameAt], [11, 98], C)))}%</div>
                  <div style={{ marginBottom: 12, opacity: named ? 1 : 0 }}>
                    <div style={{ fontSize: 14, letterSpacing: 4, opacity: 0.65 }}>NOME</div>
                    <div style={{ fontSize: 24, letterSpacing: 1, color: "#ffe2b0" }}>{"Varga".slice(0, Math.floor(interpolate(f, [nameAt, nameAt + 10], [0, 5], C)))}</div>
                  </div>
                  {fields.map((fl, i) => {
                    const n = Math.floor(interpolate(f, [fl.at, fl.at + 14], [0, fl.v.length], C));
                    return f >= fl.at ? (
                      <div key={i} style={{ marginBottom: 12, opacity: flickIn(f, fl.at) }}>
                        <div style={{ fontSize: 14, letterSpacing: 4, opacity: 0.65 }}>{fl.k}</div>
                        <div style={{ fontSize: 24, letterSpacing: 1, color: "#ffe2b0", lineHeight: 1.25 }}>
                          {fl.v.slice(0, n)}
                          {n < fl.v.length ? <span style={{ opacity: Math.floor(f / 5) % 2 ? 1 : 0.2 }}>▮</span> : null}
                        </div>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
              <div style={{ marginTop: 14, fontSize: 18, letterSpacing: 4, display: "flex", gap: 16, alignItems: "center" }}>
                <span style={{ opacity: 0.7 }}>STATUS</span>
                <span style={{ position: "relative", color: "#ff8a70" }}>
                  NÃO CADASTRADO
                  {named ? <span style={{ position: "absolute", left: -4, right: -4, top: "50%", height: 3, background: "#ff8a70", transformOrigin: "0 50%", transform: `scaleX(${P(f, nameAt + 8, 10)})` }} /> : null}
                </span>
                {f >= nameAt + 18 ? <span style={{ color: "#ffe2b0", opacity: flickIn(f, nameAt + 18) }}>RESISTÊNCIA · LIDERANÇA</span> : null}
              </div>
            </div>
          </div>
        ) : null}
      </AbsoluteFill>
      {life > 0 ? null : null}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- binóculo térmico do HEV: a pessoa sozinha na neve
// Olhando PARA A FRENTE: céu frio em cima, neve em perspectiva embaixo (dunas que o vento varre), a pessoa pequena no
// horizonte. A lente varre a paisagem, acha a mancha de calor, trava, e o zoom sobe até a imagem limpar.
// IDENTIFICAÇÃO (pedido do Paulo, 03/10): em vez da Alyx deitada na mesa do Ep2, o HEV reconhece o rosto. Em `idAt`
// a pessoa desliza para a esquerda e a ficha abre à direita: "IDENTIFICANDO…" com a foto de registro sendo varrida;
// em `nameAt` vira IDENTIFICADO, a foto limpa e os campos (`fields`) se preenchem conforme a fala.
type IdField = { k: string; v: string; at: number };
export const HLThermalPatrol: React.FC<{ life: number; seeAt?: number; lockAt?: number; nearAt?: number; clearAt?: number; idAt?: number; nameAt?: number; fields?: IdField[] }> = ({ life, seeAt = 1e9, lockAt = 1e9, nearAt = 1e9, clearAt = 1e9, idAt = 1e9, nameAt = 1e9, fields = [] }) => {
  const f = useCurrentFrame();
  const lite = useContext(LiteCtx);
  useHMs();
  const ref = useRef<HTMLCanvasElement>(null);
  const YH = RH * 0.42; // linha do horizonte (no quadro-base)
  const PX = RW * 0.5; // onde a pessoa está no quadro-base
  // varredura: a lente vem da esquerda e para na pessoa; depois só o tremor da mão
  const sweep = interpolate(f, [0, seeAt], [-150, 0], { ...C, easing: Easing.out(Easing.cubic) });
  const near = P(f, nearAt, Math.max(30, clearAt - nearAt));
  const clear = P(f, clearAt, 36);
  const Z = 1 + P(f, lockAt, 40) * 1.6 + near * 5.5;
  const shake = (1 - clear * 0.8) * (0.6 + near);
  const idK = P(f, idAt, 30);
  // a pessoa vai para o terço esquerdo da tela (a ficha ocupa a direita)
  const fx = PX + sweep + Math.sin(f / 9) * shake * 0.6 + (idK * 0.21 * RW) / Z;
  const fy = YH - 3 + Math.cos(f / 11) * shake * 0.4;
  const toBase = (px: number, py: number): [number, number] => [fx + (px - RW / 2) / Z, fy + (py - RH / 2) / Z];
  const toScreen = (bx: number, by: number): [number, number] => [((bx - fx) * Z + RW / 2) * 5, ((by - fy) * Z + RH / 2) * 5];
  useLayoutEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const wind = f / 30;
    const br = Math.sin(f / 20) * 0.25;
    // a pessoa ajoelhada e encolhida (unidades do quadro-base, chão no 0)
    const hm = HMS["encolhido"];
    const PH = 9.5; // altura da pessoa no quadro-base
    const PW = hm ? (hm.w / hm.h) * PH : 9;
    const F = new Float32Array(RW * RH);
    const stp = lite ? 2 : 1;
    for (let py = 0; py < RH; py += stp)
      for (let px = 0; px < RW; px += stp) {
        const [bx, by] = toBase(px, py);
        let v: number;
        if (by < YH) {
          v = 0.03 + (by / YH) * 0.035 + vnoise(bx * 0.02 + wind * 0.05, by * 0.05) * 0.02;
        } else {
          const d = (by - YH) / (RH - YH);
          const z = 1 / (d + 0.03);
          const wx = ((bx - RW / 2) / RW) * z * 2;
          v = 0.07 + 0.09 * vnoise(wx * 0.5 + wind * 0.6, z * 0.9) + 0.035 * vnoise(wx * 3 - wind * 2.5, z * 4) * (1 - clear * 0.6) + d * 0.05;
          // sastrugi: listras de neve que o vento desenha, mais marcadas perto
          v += Math.max(0, Math.sin(wx * 2.2 + z * 0.6) - 0.8) * 0.12 * d;
        }
        // a pessoa (silhueta real, respirando de leve) + o halo morno em volta
        const lx = bx - PX;
        const ly = by - (YH + 7);
        const hd = Math.hypot(lx / (PW * 0.75), (ly + PH / 2) / (PH * 0.75));
        if (hd < 1) v = Math.max(v, 0.2 * (1 - hd));
        if (hm) {
          const u = (lx + PW / 2) / PW;
          const vv = (ly + PH * (1 + br * 0.01)) / (PH * (1 + br * 0.01));
          if (u >= 0 && u < 1 && vv >= 0 && vv < 1) v = Math.max(v, hm.d[Math.floor(vv * hm.h) * hm.w + Math.floor(u * hm.w)] * 0.92);
        }
        const vv = v + (hash2(px + f * 13.1, py - f * 7.7) - 0.5) * 0.04 * (1 - clear * 0.6);
        F[py * RW + px] = vv;
        if (stp > 1) {
          if (px + 1 < RW) F[py * RW + px + 1] = vv;
          if (py + 1 < RH) {
            F[(py + 1) * RW + px] = vv;
            if (px + 1 < RW) F[(py + 1) * RW + px + 1] = vv;
          }
        }
      }
    // neve soprando na frente da lente
    for (let k = 0; k < 200 * (1 - clear * 0.85); k++) {
      const x = Math.floor((rnd(k * 3) * RW + f * (3 + rnd(k) * 5)) % RW);
      const y = Math.floor((rnd(k * 7) * RH + f * (0.5 + rnd(k * 5))) % RH);
      F[y * RW + x] = Math.min(F[y * RW + x], 0.03);
      if (x + 1 < RW) F[y * RW + x + 1] = Math.min(F[y * RW + x + 1], 0.05);
    }
    const octx = cv.getContext("2d")!;
    const img = octx.createImageData(RW, RH);
    paint(F, img.data, "iron", 1.05);
    octx.putImageData(img, 0, 0);
  });
  const [sx, sy] = toScreen(PX, YH + 7 - 4.75);
  const seen = f >= seeAt;
  const lk = P(f, lockAt, 10);
  const pct = Math.round(14 + near * 62 + clear * 24);
  const bw = Math.max(90, 9 * Z * 5);
  const bh = Math.max(110, 12 * Z * 5);
  return (
    <AbsoluteFill style={{ background: "#08060f" }}>
      <canvas ref={ref} width={RW} height={RH} style={{ position: "absolute", left: -8, top: -8, width: 1936, height: 1096, filter: `blur(${1.4 + (1 - clear) * 2.6}px)` }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 58%, rgba(5,4,10,0.85) 100%)" }} />
      <AbsoluteFill style={{ background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.14) 0 2px, rgba(0,0,0,0) 2px 4px)" }} />
      <AbsoluteFill style={{ opacity: flickIn(f, 2) }}>
        <Corners col={AMB} />
        <div style={{ position: "absolute", left: 92, top: 84, fontFamily: MONO, fontSize: 22, letterSpacing: 6, color: AMB }}>
          H.E.V. · VISÃO TÉRMICA
          <div style={{ fontSize: 17, letterSpacing: 4, opacity: 0.75, marginTop: 8 }}>PATRULHA · DIA 4 · NORTE</div>
        </div>
        <div style={{ position: "absolute", right: 92, top: 84, textAlign: "right", fontFamily: MONO, fontSize: 22, letterSpacing: 6, color: AMB }}>
          AMPLIAÇÃO ×{Z.toFixed(1)}
          <div style={{ fontSize: 17, letterSpacing: 4, opacity: 0.75, marginTop: 8 }}>TEMP. EXTERNA −31 °C</div>
        </div>
        <div style={{ position: "absolute", right: 92, bottom: 70, fontFamily: MONO, fontSize: 18, letterSpacing: 4, color: AMB, opacity: 0.85 }}>DISTÂNCIA {Math.round(420 - near * 370 - clear * 30)} m</div>
        {f >= idAt ? <IdCard f={f} idAt={idAt} nameAt={nameAt} fields={fields} lineFrom={[sx + bw / 2, sy]} /> : null}
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          {Array.from({ length: 31 }).map((_, i) => {
            const x = 660 + i * 20 - ((sweep * 5) % 20);
            return <line key={i} x1={x} y1={150} x2={x} y2={i % 5 === 0 ? 166 : 158} stroke={AMB} strokeWidth={2} opacity={0.5} />;
          })}
          {seen ? (
            <Box x={sx} y={sy} w={bw} h={bh} col={AMB} a={flickIn(f, seeAt)} label={f >= nameAt ? "ALYX VANCE" : lk > 0.5 ? "FORMA HUMANA · 1" : "ASSINATURA DE CALOR"} sub={f >= nameAt ? "RESISTÊNCIA · IDENTIFICADA" : f >= idAt ? "RECONHECIMENTO FACIAL…" : lk > 0.5 ? `SOZINHA · NITIDEZ ${pct}%` : "ANALISANDO…"} s={1 + (1 - P(f, seeAt, 10)) * 0.8} />
          ) : null}
        </svg>
      </AbsoluteFill>
      {idAt < 1e8 ? null : <AbsoluteFill style={{ background: "#fff6e8", opacity: interpolate(f, [life - 6, life], [0, 0.9], C) }} />}
    </AbsoluteFill>
  );
};

// ficha de reconhecimento do HEV: foto de registro (o modelo da Alyx, de frente, numa parede com régua de altura) e os
// campos digitados. A foto é 3D ao vivo: respira e gira um tico, e a varredura passa por ela até identificar.
const IdCard: React.FC<{ f: number; idAt: number; nameAt: number; fields: IdField[]; lineFrom: [number, number] }> = ({ f, idAt, nameAt, fields, lineFrom }) => {
  const k = P(f, idAt, 14);
  const named = f >= nameAt;
  const nk = P(f, nameAt, 10);
  const L = 1110;
  const T = 196;
  const PW = 300;
  const PH = 372;
  const match = Math.min(99, Math.round(interpolate(f, [idAt + 10, nameAt], [8, 97], C)));
  const scanY = ((f - idAt) * 9) % PH;
  const found = f >= nameAt + 18;
  return (
    <div style={{ position: "absolute", left: L, top: T, width: 720, opacity: k, transform: `translateX(${(1 - k) * 60}px)`, fontFamily: MONO, color: AMB }}>
      <svg width={1920} height={1080} style={{ position: "absolute", left: -L, top: -T, pointerEvents: "none" }}>
        <path d={`M ${lineFrom[0]} ${lineFrom[1]} L ${L - 30} ${lineFrom[1]} L ${L - 30} ${T + 60} L ${L - 4} ${T + 60}`} fill="none" stroke={AMB} strokeWidth={2} opacity={0.6 * k} />
      </svg>
      <div style={{ position: "relative", padding: "18px 24px 22px", background: "rgba(30,16,4,0.8)", border: `1px solid ${AMB}`, borderRadius: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 17, letterSpacing: 5, opacity: 0.85 }}>
          <span>H.E.V. · RECONHECIMENTO FACIAL</span>
          <span style={{ color: "#ffd9a0", opacity: named ? 1 : Math.floor(f / 8) % 2 ? 1 : 0.35 }}>{named ? "IDENTIFICADO" : "IDENTIFICANDO…"}</span>
        </div>
        <div style={{ display: "flex", gap: 24, marginTop: 14 }}>
          {/* a foto de registro */}
          <div style={{ position: "relative", width: PW, height: PH, flex: "none", overflow: "hidden", borderRadius: 4, border: "1px solid rgba(255,178,46,0.6)", background: "linear-gradient(180deg, #8d9196, #6f7378)" }}>
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} style={{ position: "absolute", left: 0, right: 0, top: 22 + i * 42, height: 1, background: "rgba(20,22,26,0.5)" }}>
                <span style={{ position: "absolute", left: 6, top: -16, fontSize: 12, color: "rgba(20,22,26,0.75)", letterSpacing: 1 }}>{(1.9 - i * 0.1).toFixed(2)}</span>
              </div>
            ))}
            <div style={{ position: "absolute", inset: 0, filter: named ? `saturate(${0.6 + nk * 0.35}) contrast(1.05)` : "grayscale(1) contrast(1.4) blur(2.5px)" }}>
              <AlyxMug f={f} w={PW} h={PH} />
            </div>
            {!named ? (
              <>
                <div style={{ position: "absolute", left: 0, right: 0, top: scanY, height: 3, background: AMB, boxShadow: `0 0 16px ${AMB}`, opacity: 0.9 }} />
                {[
                  [0.35, 0.5],
                  [0.61, 0.5],
                  [0.48, 0.62],
                  [0.48, 0.72],
                ].map(([x, y], i) => (
                  <div key={i} style={{ position: "absolute", left: x * PW - 5, top: y * PH - 5, width: 10, height: 10, border: `2px solid ${AMB}`, borderRadius: 5, opacity: f >= idAt + 12 + i * 6 ? 0.9 : 0 }} />
                ))}
              </>
            ) : (
              <div style={{ position: "absolute", left: 14, bottom: 14, padding: "4px 10px", border: `2px solid ${AMB}`, fontSize: 15, letterSpacing: 3, background: "rgba(30,16,4,0.7)", transform: `rotate(-4deg) scale(${1 + (1 - nk) * 0.5})`, opacity: nk }}>REGISTRO 1-0076</div>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, letterSpacing: 4, opacity: 0.65 }}>CORRESPONDÊNCIA</div>
            <div style={{ fontSize: 34, letterSpacing: 2, color: "#ffe2b0", marginBottom: 12 }}>{match}%</div>
            {fields.map((fl, i) => {
              const n = Math.floor(interpolate(f, [fl.at, fl.at + 14], [0, fl.v.length], C));
              return f >= fl.at ? (
                <div key={i} style={{ marginBottom: 12, opacity: flickIn(f, fl.at) }}>
                  <div style={{ fontSize: 14, letterSpacing: 4, opacity: 0.65 }}>{fl.k}</div>
                  <div style={{ fontSize: 24, letterSpacing: 1, color: "#ffe2b0", lineHeight: 1.25 }}>
                    {fl.v.slice(0, n)}
                    {n < fl.v.length ? <span style={{ opacity: Math.floor(f / 5) % 2 ? 1 : 0.2 }}>▮</span> : null}
                  </div>
                </div>
              ) : null;
            })}
          </div>
        </div>
        <div style={{ marginTop: 14, fontSize: 18, letterSpacing: 4, display: "flex", gap: 16, alignItems: "center" }}>
          <span style={{ opacity: 0.7 }}>STATUS</span>
          <span style={{ position: "relative", color: "#ff8a70" }}>
            DESAPARECIDA
            {named ? <span style={{ position: "absolute", left: -4, right: -4, top: "50%", height: 3, background: "#ff8a70", transformOrigin: "0 50%", transform: `scaleX(${P(f, nameAt + 8, 10)})` }} /> : null}
          </span>
          {found ? <span style={{ color: "#ffe2b0", opacity: flickIn(f, nameAt + 18) }}>LOCALIZADA</span> : null}
        </div>
      </div>
    </div>
  );
};

// a foto de registro: o retrato da Alyx (Half-Life 2) que o Paulo mandou, recortado no rosto; aproxima devagar
const AlyxMug: React.FC<{ f: number; w: number; h: number }> = ({ f, w, h }) => (
  <Img src={staticFile("hl3silh/alyx_badge.jpg")} style={{ position: "absolute", left: 0, top: 0, width: w, height: h, objectFit: "cover", transform: `scale(${1.02 + Math.min(1, f / 600) * 0.05})`, transformOrigin: "50% 40%" }} />
);

// ---------------------------------------------------------------- arquivo da Resistência (terminal verde do Kleiner)
export const HLArchive: React.FC<{ life: number; words?: Word[]; markFrom?: number; markTo?: number; markAt?: number; pinAt?: number; head?: string; sub?: string }> = ({ life, words = [], markFrom = -1, markTo = -1, markAt = 1e9, pinAt = 1e9, head = "ARQUIVO · RESISTÊNCIA · DEPOIMENTO 017", sub = "VARGA · NOITE 1 · RÁDIO DE CAMPO" }) => {
  const f = useCurrentFrame();
  const on = interpolate(f, [0, 8], [0, 1], { ...C, easing: Easing.out(Easing.cubic) });
  const offY = interpolate(f, [life - 9, life - 4], [1, 0.012], { ...C, easing: Easing.in(Easing.cubic) });
  const offX = interpolate(f, [life - 4, life - 1], [1, 0.012], { ...C, easing: Easing.in(Easing.cubic) });
  const sy = Math.min(0.012 + 0.988 * on, offY);
  const flash = Math.max(1 - on, 1 - offY) * (f < life - 1 ? 1 : 0);
  const mk = P(f, markAt, 18);
  const pin = P(f, pinAt, 10);
  const push = 1 + interpolate(f, [0, life], [0, 0.05], C);
  const flick = 0.94 + 0.06 * Math.sin(f * 1.7) * Math.sin(f * 0.37);
  // o texto aparece inteiro, digitado rápido (já foi dito), palavra a palavra em ~1 s
  const shown = Math.floor(interpolate(f, [8, 38], [0, words.length], C));
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 40%, #2a2620 0%, #0c0b09 80%)" }}>
      <div style={{ position: "absolute", left: 960 - 760, top: 540 - 470, width: 1520, height: 940, transform: `scale(${push})`, transformOrigin: "50% 50%" }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: 48, background: "linear-gradient(160deg, #cfc6ae, #a79d84 60%, #8c836c)", boxShadow: "0 60px 140px rgba(0,0,0,0.75), inset 0 4px 0 rgba(255,255,255,0.25)" }} />
        <div style={{ position: "absolute", left: 80, top: 70, width: 1360, height: 780, borderRadius: 60, background: "#1b1a16", boxShadow: "inset 0 0 40px rgba(0,0,0,0.9)" }} />
        <div style={{ position: "absolute", left: 140, top: 110, width: 1240, height: 700, borderRadius: 40, overflow: "hidden", background: "radial-gradient(ellipse at 50% 50%, #0c2414 0%, #031008 85%)", opacity: flick, filter: "drop-shadow(0 0 6px rgba(141,255,168,0.35))", transform: `scale(${offX}, ${sy})` }}>
          <div style={{ position: "absolute", left: 40, top: 30, fontFamily: MONO, fontSize: 30, letterSpacing: 6, color: GREEN }}>{head}</div>
          <div style={{ position: "absolute", left: 40, top: 76, fontFamily: MONO, fontSize: 20, letterSpacing: 5, color: "rgba(141,255,168,0.55)" }}>{sub}</div>
          <div style={{ position: "absolute", left: 40, right: 40, top: 118, height: 2, background: "rgba(141,255,168,0.35)" }} />
          <div style={{ position: "absolute", left: 60, right: 60, top: 170, fontFamily: MONO, fontSize: 44, lineHeight: "70px", color: GREEN }}>
            <span style={{ opacity: 0.6 }}>“</span>
            {words.slice(0, shown).map((w, i) => {
              const inMark = i >= markFrom && i <= markTo;
              return (
                <span key={i} style={{ position: "relative", marginRight: 16, display: "inline-block" }}>
                  {inMark ? <span style={{ position: "absolute", left: -6, right: -10, top: 10, bottom: 8, background: AMB, opacity: 0.85, transformOrigin: "left center", transform: `scaleX(${Math.max(0, Math.min(1, mk * (markTo - markFrom + 1) - (i - markFrom)))})` }} /> : null}
                  <span style={{ position: "relative", color: inMark && mk > 0 ? "#1a1204" : GREEN, fontWeight: inMark ? 700 : 400 }}>{w.w}</span>
                </span>
              );
            })}
            {shown >= words.length ? <span style={{ opacity: 0.6 }}>”</span> : <span style={{ opacity: Math.floor(f / 8) % 2 ? 1 : 0 }}>▮</span>}
          </div>
          {pin > 0 ? (
            <div style={{ position: "absolute", right: 70, bottom: 60, transform: `rotate(-4deg) scale(${1.6 - pin * 0.6})`, opacity: pin, border: `4px solid ${AMB}`, borderRadius: 8, padding: "12px 26px", fontFamily: MONO, fontSize: 40, fontWeight: 700, letterSpacing: 10, color: AMB, background: "rgba(40,24,4,0.6)" }}>GUARDE ISSO</div>
          ) : null}
          <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.32) 0 2px, rgba(0,0,0,0) 2px 4px)" }} />
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.6) 100%)" }} />
          <div style={{ position: "absolute", left: 0, right: 0, top: ((f * 9) % 900) - 100, height: 90, background: "linear-gradient(180deg, rgba(141,255,168,0), rgba(141,255,168,0.06), rgba(141,255,168,0))" }} />
          <div style={{ position: "absolute", left: -200, top: -300, width: 900, height: 600, borderRadius: "50%", background: "radial-gradient(closest-side, rgba(255,255,255,0.07), rgba(255,255,255,0))" }} />
          {flash > 0.01 ? <div style={{ position: "absolute", inset: 0, background: "#e6ffef", opacity: flash * 0.9 }} /> : null}
        </div>
        <div style={{ position: "absolute", left: 140, bottom: 34, fontFamily: MONO, fontSize: 18, letterSpacing: 6, color: "#4b4536" }}>KLEINER · ARQUIVO DE CAMPO</div>
        <div style={{ position: "absolute", right: 150, bottom: 38, width: 14, height: 14, borderRadius: 7, background: "#7dff9a", boxShadow: "0 0 12px #7dff9a" }} />
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 4B · a Alyx estranha, vista pelo HEV (estação ártica)
// DIA: visão térmica do traje (paleta de ferro, HUD laranja) dentro da estação; cada coisa que esquenta tem nome
// (aquecedor, Gordon, Vortigaunts, Dog, Alyx). Ao lado, o CARD DE SAÚDE da Alyx (retrato, batimento, sinais): normal →
// anomalia → ela olha a porta, a mira conta, na batida o calor aparece DO OUTRO LADO da porta (reagiu 1 s antes) →
// nariz sangrando (no card). NOITE: o gravador automático do HEV registra a voz dela dormindo ("ainda não…"), depois
// acordada ("eu não sei, Gordon"), e a análise marca o que não fecha (que porta? "ainda" = futuro). Tempos em QUADROS.
type AlyxSignsProps = { life: number; normalAt?: number; anomAt?: number; doorAt?: number; bangAt?: number; noseAt?: number; nightAt?: number; line?: { w: string; at: number }[]; replyAt?: number; doorQAt?: number; openQAt?: number };
const ST_ALYX = { x: -0.8, z: 0.6 };
const ST_GORDON = { x: 0.9, z: 3.1 }; // primeiro plano, de costas para a câmera: olhando para a Alyx
const ST_DOOR = { x: -3.4, z: -3.2 };
const ST_HEATER = { x: 1.0, z: -0.8 };
const ST_DOG = { x: 0.6, z: -3.0 }; // dentro da sala, no fundo
const stationGround = (wx: number, wz: number) => {
  const inside = Math.abs(wx) < 5 && Math.abs(wz) < 4.2;
  const base = inside ? 0.12 + vnoise(wx * 0.8, wz * 0.8) * 0.03 : 0.05 + vnoise(wx * 0.4, wz * 0.4) * 0.02;
  const tile = inside && (Math.abs(wx % 1) < 0.03 || Math.abs(wz % 1) < 0.03) ? -0.025 : 0;
  return base + tile;
};
// batimento: um traço de ECG que corre; bpm e irregularidade vêm de fora
export const Ecg: React.FC<{ f: number; bpm: number; jitter: number; col: string; w: number; h: number }> = ({ f, bpm, jitter, col, w, h }) => {
  const pts: string[] = [];
  for (let x = 0; x <= w; x += 3) {
    const t = (f - (w - x) / 5) / 30;
    const ph = (t * bpm) / 60 + jitter * 0.15 * Math.sin(t * 7.3);
    const fr = ph - Math.floor(ph);
    let y = 0;
    if (fr < 0.05) y = -Math.sin((fr / 0.05) * Math.PI) * h * 0.42;
    else if (fr < 0.09) y = Math.sin(((fr - 0.05) / 0.04) * Math.PI) * h * 0.14;
    else if (fr > 0.3 && fr < 0.42) y = -Math.sin(((fr - 0.3) / 0.12) * Math.PI) * h * 0.08;
    y += (rnd(Math.floor(t * 30) + x) - 0.5) * 2;
    pts.push(`${x},${h / 2 + y}`);
  }
  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      <polyline points={pts.join(" ")} fill="none" stroke={col} strokeWidth={2.5} style={{ filter: `drop-shadow(0 0 4px ${col})` }} />
    </svg>
  );
};
export const HLThermalAlyx: React.FC<AlyxSignsProps> = (p) => {
  const f = useCurrentFrame();
  const lite = useContext(LiteCtx);
  useHMs();
  const ref = useRef<HTMLCanvasElement>(null);
  const N = 1e9;
  const at = (v?: number) => v ?? N;
  const isNight = f >= at(p.nightAt);
  const keys: CamKey[] = [
    { at: 0, cam: { tx: 0.0, tz: 0.2, dist: 9.5, pitch: 6 * D2R, fov: 30, yaw: 0.2, ty: 1.55 } },
    { at: at(p.normalAt), cam: { tx: -1.4, tz: 0.4, dist: 6.8, pitch: 5 * D2R, fov: 30, yaw: 0.28, ty: 1.55 } },
    { at: at(p.anomAt), cam: { tx: -1.5, tz: 0.5, dist: 5.4, pitch: 4 * D2R, fov: 30, yaw: 0.34, ty: 1.55 } },
    { at: at(p.doorAt) - 14, cam: { tx: -2.6, tz: -1.6, dist: 8, pitch: 5 * D2R, fov: 30, yaw: 0.5, ty: 1.55 } },
    { at: at(p.noseAt) - 6, cam: { tx: -1.6, tz: 0.5, dist: 4.6, pitch: 4 * D2R, fov: 30, yaw: 0.36, ty: 1.55 } },
  ].filter((k) => k.at < N);
  let ki = 0;
  for (let k = 0; k < keys.length; k++) if (f >= keys[k].at) ki = k;
  const prev = keys[Math.max(0, ki - 1)];
  const cur = keys[ki];
  const next = keys[ki + 1];
  const span = Math.max(14, Math.min(40, ((next?.at ?? p.life) - cur.at) * 0.5));
  const kk = ki === 0 ? 1 : interpolate(f, [cur.at, cur.at + span], [0, 1], { ...C, easing: Easing.inOut(Easing.sin) });
  const cam0 = mix(prev.cam, cur.cam, kk);
  const bd = f - at(p.bangAt);
  const shake = bd >= 0 && bd < 10 ? (1 - bd / 10) * 0.12 : 0;
  const cam: Cam = { ...cam0, tx: cam0.tx + Math.sin(f / 90) * 0.06 + (rnd(f * 3) - 0.5) * shake, tz: cam0.tz + Math.cos(f / 110) * 0.05, yaw: (cam0.yaw ?? 0) + Math.sin(f / 150) * 0.02 };
  const P3 = mkProj(cam);
  const lookDoor = f >= at(p.doorAt);
  const anom = f >= at(p.anomAt);
  const alyxHeat = 0.9 + (anom ? 0.06 * Math.sin(f / 3.3) * Math.sin(f / 7.1) : 0);
  const behind = bd >= 0 && bd < 70 ? (bd < 6 ? 1 : 1 - (bd - 6) / 64) : 0;
  useLayoutEffect(() => {
    const cv = ref.current;
    if (!cv || isNight) return;
    const blobs: Blob[] = [];
    // o aquecedor: um tambor em pé (coluna morna, boca quente em cima) e o chão morno em volta
    blobs.push({ x: ST_HEATER.x, z: ST_HEATER.z, rx: 1.2, rz: 1.2, h: 0.3, soft: 0.95 });
    for (let k = 0; k < 6; k++) blobs.push({ x: ST_HEATER.x, z: ST_HEATER.z, y: 0.08 + k * 0.13, rx: 0.26, rz: 0.08, h: 0.62 + k * 0.05, soft: 0.35 });
    blobs.push({ x: ST_HEATER.x, z: ST_HEATER.z, y: 0.86, rx: 0.24, rz: 0.06, h: 1.0, soft: 0.4 });
    [[3.2, -2.6, 1.4, 0.6], [-3.6, -0.2, 1.6, 0.7], [3.4, 2.6, 1.0, 0.8]].forEach(([x, z, w, d]) => blobs.push({ x, z, rx: w / 2, rz: d / 2, h: 0.16, soft: 0.3 }));
    if (behind > 0) {
      blobs.push({ x: ST_DOOR.x, z: ST_DOOR.z - 1.25, y: 1.1, rx: 0.5, rz: 0.95, h: 0.75 * behind, soft: 0.8 });
      blobs.push({ x: ST_DOOR.x, z: ST_DOOR.z - 1.0, y: 1.05, rx: 0.45, rz: 1.0, h: 0.4 * behind, soft: 0.5 });
    }
    // o Dog: corpo grande e frio, o núcleo (o "olho") quente
    // (o Dog agora é a silhueta real, carimbada junto com as pessoas)
    const stamps: Stamp[] = [];
    // o Gordon não aparece: a visão térmica é a do traje dele (é ele quem está olhando) // a silhueta do traje HEV (frio, cabeça morna)
    stamps.push({ hm: "vort", x: 2.9, z: -1.8, hM: 1.8, heat: 0.78, upright: true });
    stamps.push({ hm: "vort", x: 3.5, z: -0.8, hM: 1.8, heat: 0.75, upright: true, flip: true });
    stamps.push({ hm: "empe", x: ST_ALYX.x, z: ST_ALYX.z, hM: 1.72, heat: alyxHeat, flip: lookDoor, upright: true });
    stamps.push({ hm: "dog", x: ST_DOG.x, z: ST_DOG.z, hM: 2.6, heat: 1.0, upright: true });
    blobs.push({ x: ST_ALYX.x, z: ST_ALYX.z, rx: 0.5, rz: 0.5, h: 0.2, soft: 0.95 });
    const F = field(P3, blobs, f, stationGround, stamps, lite ? 2 : 1);
    const octx = cv.getContext("2d")!;
    const img = octx.createImageData(RW, RH);
    paint(F, img.data, "iron", 1);
    octx.putImageData(img, 0, 0);
  });
  const sp = (x: number, y: number, z: number): [number, number] => {
    const [px, py] = proj(P3, x, y, z);
    return [px * 5, py * 5];
  };
  const pxPerM = (x: number, z: number) => (P3.foc / Math.max(0.5, proj(P3, x, 0, z)[2])) * 5;
  const room: [number, number, number][][] = [
    [[-5, 0, -4.2], [5, 0, -4.2], [5, 0, 4.2], [-5, 0, 4.2], [-5, 0, -4.2]],
    [[-5, 0, -4.2], [-5, 2.6, -4.2], [5, 2.6, -4.2], [5, 0, -4.2]],
    [[-5, 0, -4.2], [-5, 2.6, -4.2], [-5, 2.6, 4.2], [-5, 0, 4.2]],
  ];
  const door: [number, number, number][] = [[ST_DOOR.x - 0.55, 0, ST_DOOR.z - 0.98], [ST_DOOR.x - 0.55, 2.1, ST_DOOR.z - 0.98], [ST_DOOR.x + 0.55, 2.1, ST_DOOR.z - 0.98], [ST_DOOR.x + 0.55, 0, ST_DOOR.z - 0.98]];
  const path = (pts: [number, number, number][]) => pts.map((q, i) => `${i ? "L" : "M"} ${sp(q[0], q[1], q[2]).join(" ")}`).join(" ");
  const flash = interpolate(f, [at(p.bangAt), at(p.bangAt) + 1, at(p.bangAt) + 8], [0, 0.45, 0], C);
  const cnt = Math.max(0, (at(p.bangAt) - f) / 30);
  // etiquetas fixas: o que é cada fonte de calor
  const tags: { x: number; y: number; z: number; t: string }[] = [
    { x: ST_HEATER.x, y: 1.15, z: ST_HEATER.z, t: "AQUECEDOR" },
    { x: 3.2, y: 2.1, z: -1.3, t: "VORTIGAUNTS" },
    { x: ST_DOG.x, y: 2.85, z: ST_DOG.z, t: "DOG" },
    { x: ST_ALYX.x, y: 2.0, z: ST_ALYX.z, t: "ALYX" },
  ];
  type L = { at: number; until?: number; label: string; sub?: string; red?: boolean; x: number; y: number; z: number; w: number; h: number };
  const locks: L[] = [
    { at: at(p.doorAt) + 4, until: at(p.bangAt), label: "ALYX OLHA PARA A PORTA", sub: `NADA DO OUTRO LADO · T−${cnt.toFixed(1).replace(".", ",")} s`, x: ST_DOOR.x, y: 1.05, z: ST_DOOR.z - 0.98, w: 1.3, h: 2.3 },
    { at: at(p.bangAt), until: at(p.noseAt) - 4, label: "IMPACTO DO OUTRO LADO", sub: "ELA REAGIU 1,0 s ANTES", red: true, x: ST_DOOR.x, y: 1.05, z: ST_DOOR.z - 0.98, w: 1.3, h: 2.3 },
  ];
  // card de saúde
  const card = P(f, at(p.normalAt), 14);
  const bpm = f < at(p.anomAt) ? 72 : f < at(p.bangAt) ? 94 : f < at(p.bangAt) + 50 ? 128 : f < at(p.noseAt) ? 104 : 112;
  const rows: { k: string; v: string; at: number; bad?: boolean }[] = [
    { k: "TEMPERATURA", v: anom ? "37,9 °C · OSCILANDO" : "36,7 °C", at: at(p.normalAt), bad: anom },
    { k: "COMPORTAMENTO", v: anom ? "ANÔMALO" : "NORMAL", at: at(p.normalAt), bad: anom },
    { k: "REAÇÃO", v: "ANTECIPADA · −1,0 s", at: at(p.bangAt) + 14, bad: true },
    { k: "NARIZ", v: "HEMORRAGIA · SEM CAUSA", at: at(p.noseAt), bad: true },
  ];
  const t = 2 * 3600 + 13 * 60 + f / 30;
  const line = p.line ?? [];
  // NOITE: gravador do HEV
  if (isNight) {
    const n0 = at(p.nightAt);
    const rep = f >= at(p.replyAt);
    const lastW = line.length ? line[line.length - 1].at : n0 + 60;
    const speaking = line.some((w) => f >= w.at && f < w.at + 10) || (rep && f < at(p.replyAt) + 70);
    const amp = speaking ? 1 : 0.12;
    const clip = rep ? 2 : 1;
    const t2 = 3 * 3600 + 12 * 60 + (f - n0) / 30 + (rep ? 40 : 0);
    return (
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, #1a0d0b 0%, #070405 75%)" }}>
        <Corners col={AMB} o={0.7} />
        <div style={{ position: "absolute", left: 92, top: 84, fontFamily: MONO, color: AMB, letterSpacing: 6 }}>
          <div style={{ fontSize: 22 }}>H.E.V. · GRAVAÇÃO AUTOMÁTICA DE ÁUDIO</div>
          <div style={{ fontSize: 17, letterSpacing: 4, opacity: 0.75, marginTop: 6 }}>POSTO ÁRTICO 7 · NOITE · DISPARADA POR VOZ</div>
        </div>
        <div style={{ position: "absolute", right: 92, top: 84, textAlign: "right", fontFamily: MONO, fontSize: 22, letterSpacing: 6, color: AMB }}>
          {pad2(t2 / 3600)}:{pad2((t2 % 3600) / 60)}:{pad2(t2 % 60)}
          <div style={{ fontSize: 17, letterSpacing: 4, marginTop: 8 }}>
            <span style={{ color: RED, opacity: Math.floor(f / 15) % 2 ? 1 : 0.3 }}>● </span>REC · TRECHO {String(clip).padStart(2, "0")}
          </div>
        </div>
        {/* a fonte e o estado */}
        <div style={{ position: "absolute", left: 160, top: 250, fontFamily: MONO, letterSpacing: 5 }}>
          <div style={{ fontSize: 18, color: AMB, opacity: 0.75 }}>FONTE</div>
          <div style={{ fontSize: 40, color: "#ffe2b0" }}>ALYX VANCE · {rep ? "ACORDADA" : "DORMINDO"}</div>
        </div>
        {/* a onda da voz */}
        <svg width={1600} height={240} style={{ position: "absolute", left: 160, top: 360 }}>
          <line x1={0} x2={1600} y1={120} y2={120} stroke="rgba(255,178,46,0.25)" />
          {Array.from({ length: 160 }).map((_, i) => {
            const h = 6 + 200 * amp * Math.abs(Math.sin(i * 0.37 + f * 0.6)) * (0.35 + 0.65 * rnd(i + Math.floor(f / 2) * 7));
            return <rect key={i} x={i * 10} y={120 - h / 2} width={5} height={h} fill={rep ? "#ffe2b0" : RED} opacity={0.85} />;
          })}
        </svg>
        {/* transcrição */}
        <div style={{ position: "absolute", left: 160, top: 640, width: 1600, fontFamily: MONO }}>
          <div style={{ fontSize: 17, letterSpacing: 5, color: AMB, opacity: 0.75 }}>TRANSCRIÇÃO</div>
          {!rep ? (
            <div style={{ fontSize: 64, letterSpacing: 3, color: "#ffd2cc", textShadow: "0 0 26px rgba(255,93,77,0.5)" }}>
              {line.map((w, i) => (f >= w.at ? <span key={i} style={{ opacity: flickIn(f, w.at) }}>{w.w} </span> : null))}
            </div>
          ) : (
            <div style={{ fontSize: 44, letterSpacing: 2, color: "#ffe2b0" }}>“Eu não sei, Gordon. Eu não sei o que está acontecendo.”</div>
          )}
        </div>
        {/* a análise: o que não fecha */}
        <div style={{ position: "absolute", left: 160, top: 870, display: "flex", gap: 40, fontFamily: MONO, letterSpacing: 3 }}>
          {f >= at(p.doorQAt) ? (
            <div style={{ padding: "10px 18px", border: `1px solid ${AMB}`, background: "rgba(30,16,4,0.7)", opacity: flickIn(f, at(p.doorQAt)) }}>
              <div style={{ fontSize: 15, color: AMB, opacity: 0.75 }}>REFERÊNCIA · "A PORTA"</div>
              <div style={{ fontSize: 28, color: "#ffe2b0" }}>NÃO IDENTIFICADA</div>
            </div>
          ) : null}
          {f >= at(p.openQAt) ? (
            <div style={{ padding: "10px 18px", border: `1px solid ${RED}`, background: "rgba(40,6,6,0.7)", opacity: flickIn(f, at(p.openQAt)) }}>
              <div style={{ fontSize: 15, color: RED, opacity: 0.85 }}>"AINDA NÃO ABRIU"</div>
              <div style={{ fontSize: 28, color: "#ffd2cc" }}>ELA FALA DE ALGO QUE AINDA VAI ACONTECER</div>
            </div>
          ) : null}
        </div>
        {lastW ? null : null}
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={{ background: "#08060f" }}>
      <canvas ref={ref} width={RW} height={RH} style={{ position: "absolute", left: -8, top: -8, width: 1936, height: 1096, filter: "blur(1.6px)" }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 58%, rgba(5,4,10,0.85) 100%)" }} />
      <AbsoluteFill style={{ background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.12) 0 2px, rgba(0,0,0,0) 2px 4px)" }} />
      <AbsoluteFill style={{ background: "#fff3e2", opacity: flash }} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {room.map((r, i) => (
          <path key={i} d={path(r)} fill="none" stroke={AMB} strokeWidth={1.4} opacity={0.22} />
        ))}
        <path d={path(door)} fill="none" stroke={f >= at(p.bangAt) && f < at(p.noseAt) ? RED : AMB} strokeWidth={2.6} opacity={0.75} />
        {tags.map((g, i) => {
          const [x, y] = sp(g.x, g.y, g.z);
          const isA = g.t === "ALYX";
          return (
            <g key={i} opacity={isA ? 1 : 0.75}>
              <line x1={x} y1={y + 6} x2={x} y2={y + 22} stroke={isA ? "#ffe2b0" : AMB} strokeWidth={1.5} />
              <text x={x} y={y} textAnchor="middle" fill={isA ? "#ffe2b0" : AMB} fontFamily={MONO} fontSize={isA ? 22 : 17} letterSpacing={3} style={{ paintOrder: "stroke", stroke: "rgba(0,0,0,0.85)", strokeWidth: 5 }}>
                {g.t}
              </text>
            </g>
          );
        })}
        {locks.map((l, i) => {
          if (f < l.at || f >= (l.until ?? N)) return null;
          const [x, y] = sp(l.x, l.y, l.z);
          const ppm = pxPerM(l.x, l.z);
          const s = 1 + (1 - P(f, l.at, 10)) * 0.6;
          return <Box key={i} x={x} y={y} w={Math.max(70, l.w * ppm)} h={Math.max(80, l.h * ppm)} col={l.red ? RED : AMB} a={flickIn(f, l.at)} label={l.label} sub={l.sub} s={s} />;
        })}
      </svg>
      <Corners col={AMB} o={0.8} />
      <div style={{ position: "absolute", left: 92, top: 84, fontFamily: MONO, color: AMB, letterSpacing: 6 }}>
        <div style={{ fontSize: 22 }}>H.E.V. · VISÃO TÉRMICA</div>
        <div style={{ fontSize: 17, letterSpacing: 4, opacity: 0.75, marginTop: 6 }}>ESTAÇÃO ABANDONADA · POSTO ÁRTICO 7 · DIA 2</div>
      </div>
      <div style={{ position: "absolute", right: 92, top: 84, textAlign: "right", fontFamily: MONO, fontSize: 22, letterSpacing: 6, color: AMB }}>
        {pad2(t / 3600)}:{pad2((t % 3600) / 60)}:{pad2(t % 60)}
        <div style={{ fontSize: 17, letterSpacing: 4, opacity: 0.75, marginTop: 8 }}>−13 °C AMBIENTE</div>
      </div>
      {/* card de saúde da Alyx */}
      {card > 0.01 ? (
        <div style={{ position: "absolute", right: 92, top: 200, width: 520, padding: "18px 22px", background: "rgba(20,10,4,0.82)", border: `1px solid ${anom ? RED : AMB}`, borderRadius: 8, fontFamily: MONO, color: AMB, opacity: card, transform: `translateX(${(1 - card) * 40}px)` }}>
          <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
            <div style={{ width: 92, height: 112, overflow: "hidden", border: `1px solid ${AMB}`, borderRadius: 4 }}>
              <Img src={staticFile("hl3silh/alyx_badge.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "grayscale(1) sepia(1) saturate(2.5) hue-rotate(-12deg) contrast(1.1)" }} />
            </div>
            <div>
              <div style={{ fontSize: 15, letterSpacing: 4, opacity: 0.7 }}>H.E.V. · ACOMPANHAMENTO</div>
              <div style={{ fontSize: 32, letterSpacing: 3, color: "#ffe2b0" }}>ALYX VANCE</div>
              <div style={{ fontSize: 28, letterSpacing: 2, color: anom ? RED : "#bfff9a" }}>
                {bpm} <span style={{ fontSize: 16, opacity: 0.7 }}>BPM</span>
              </div>
            </div>
          </div>
          <div style={{ marginTop: 10 }}>
            <Ecg f={f} bpm={bpm} jitter={anom ? 1 : 0} col={anom ? RED : "#bfff9a"} w={476} h={70} />
          </div>
          {rows.map((r, i) =>
            f >= r.at ? (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 18, letterSpacing: 2, marginTop: 8, opacity: flickIn(f, r.at) }}>
                <span style={{ opacity: 0.75 }}>{r.k}</span>
                <span style={{ color: r.bad ? RED : "#bfff9a", opacity: r.k === "NARIZ" ? (Math.floor((f - r.at) / 10) % 2 ? 1 : 0.55) : 1 }}>{r.v}</span>
              </div>
            ) : null,
          )}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
