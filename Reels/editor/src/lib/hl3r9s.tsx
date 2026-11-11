// =================================================================================================
// HL3 · 1:06:06 o ataque total ao Borealis — refeito em 3D de verdade (three.js) em 10/10/2026.
// Pedido dele: canhões / artilharia improvisada "muito mal feitos", aeronaves com modelo ruim, o gelo "nem parece gelo",
// o navio pode ter mais detalhe, e o player travava (eram milhares de polígonos SVG + filtros de desfoque a cada quadro).
// Agora: WebGL (placa de vídeo), luz da lua com sombra, gelo com brilho e rachaduras, neve caindo, névoa na distância.
//   · canhões de campanha (rodas raiadas, escudo com λ, cano com freio de boca, conteira com pás) que sobem da crista
//   · barris explosivos vermelhos (os do HL2) e caixotes · a picape com o lançador de foguetes de canos soldados
//   · o ninho de morteiros de sacos de areia · dois aviões a hélice remendados (fumaça, motor falhando)
//   · o Borealis: casco quebra-gelo lofteado (proa inclinada, vermelho abaixo da linha d'água), superestrutura em três
//     andares com janelas acesas, ponte com asas, mastro com radar girando, chaminé, botes salva-vidas laranja,
//     guindastes, contêineres, escotilhas, guarda-corpo, nome no casco, preso no gelo com blocos em volta.
// HL9Silent (1:06:45): o MESMO navio e a mesma câmera, inteiro, com as marcas dos tiros nos mesmos lugares.
// =================================================================================================
import React, { useMemo } from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { FONT, MONO } from "./overlays";
import { C, HL, rnd } from "./hl3";
import { FilmLook } from "./hl3r";
import { Eye, Hud } from "./hl3rf";
import { FlagBadge, fadeIO } from "./hl3rx";
import { LiteCtx, SfxCtx } from "./sfx-ctx";

const RED = "#ff5d4d";
const AMB = "#ffb22e";
const CYC = "#7ef0ff";
const CREAM = "#ffe2b0";
const GREEN = "#8dffa8";
const TXT = HL.text;
void FONT;
const P = (f: number, at: number, d = 12) => interpolate(f, [at, at + d], [0, 1], { ...C, easing: Easing.out(Easing.cubic) });
type PR = Record<string, number> & { life: number };
const at = (p: PR, k: string) => (p[k] as number | undefined) ?? 1e9;
const ats = (p: PR, ks: string[]) => ks.map((k) => at(p, k));
export type V = [number, number, number];
const ss = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
// chaves suaves (smoothstep entre as chaves)
export const kk = (f: number, ks: [number, number][]) => {
  if (f <= ks[0][0]) return ks[0][1];
  for (let i = 1; i < ks.length; i++) if (f <= ks[i][0]) return ks[i - 1][1] + (ks[i][1] - ks[i - 1][1]) * ss((f - ks[i - 1][0]) / Math.max(1e-6, ks[i][0] - ks[i - 1][0]));
  return ks[ks.length - 1][1];
};
export const kv = (f: number, ks: [number, V][]): V => [0, 1, 2].map((i) => kk(f, ks.map(([t, v]) => [t, v[i]] as [number, number]))) as V;

// ------------------------------------------------------------------------------------------------ o mundo
export const SX = 6; // o navio
export const SY = 2.2; // a linha d'água fica 2,2 m acima do gelo (o casco preso)
export const SZ = -128;
export const PIV = 15; // a junta onde a proa se parte
export const CREST_Z = -15;
// altura da crista de neve onde a Resistência se posiciona
export const ridgeH = (x: number, z: number) => {
  const crest = 1.75 * Math.exp(-Math.pow((z - CREST_Z) / 3.6, 2)) * (0.85 + 0.15 * Math.sin(x * 0.27 + 1.3) + 0.06 * Math.sin(x * 0.9));
  const near = z > CREST_Z ? 0.35 * ss((z - CREST_Z) / 6) : 0;
  const lump = 0.12 * Math.sin(x * 0.6 + z * 0.4) * Math.sin(x * 0.23 - z * 0.7);
  return Math.max(0.04, crest + near + lump);
};
const GUNS: [number, number][] = [[-12.5, CREST_Z - 0.6], [-4.2, CREST_Z - 0.2], [4.4, CREST_Z - 0.4], [12.6, CREST_Z - 0.1]];
const TRUCK: V = [-8.3, 0, CREST_Z - 7.5];
const MORTAR: V = [8.2, 0, CREST_Z - 7.0];
const STOCK: [number, number, number][] = [[-8.4, CREST_Z + 0.6, 0], [8.6, CREST_Z + 0.8, 1], [-0.2, CREST_Z + 1.2, 2]];
// casco: meia-boca na altura y (linha d'água = 0), com a proa inclinada para a frente
const hullHalf = (x: number) => {
  if (x < -46) return 10.6 * (0.8 + 0.2 * ss((x + 56) / 10));
  if (x <= 14) return 10.6;
  const u = (x - 14) / 37;
  return u >= 1 ? 0 : 10.6 * Math.sqrt(1 - u * u);
};
export const deckY = (x: number) => 7 + Math.max(0, x - 18) * 0.075 + Math.max(0, -x - 44) * 0.05;
const PROF: [number, number][] = [[-8.5, 0], [-8.0, 0.5], [-5.6, 0.86], [-2.6, 0.97], [0, 1], [3, 1.015], [99, 1.03]];
export const halfAt = (x: number, y: number) => {
  const rake = x > 14 ? (y + 8.5) * 0.52 : 0;
  const fac = PROF.reduce((acc, [py, k], i) => (i && y <= py && y >= PROF[i - 1][0] ? PROF[i - 1][1] + (k - PROF[i - 1][1]) * ((y - PROF[i - 1][0]) / (py - PROF[i - 1][0])) : acc), 1.03);
  return hullHalf(x - rake) * fac;
};
// onde os tiros batem no costado (coordenadas do navio) e ficam as marcas
export const HITS: V[] = [[-20, 4.2, 0], [5, 3.0, 0], [11, 4.6, 0], [-38, 9.5, 0], [30, 3.6, 0], [-8, 2.4, 0]].map(([x, y]) => [x, y, halfAt(x, y) + 0.12] as V);
export const shipW = (v: V): V => [SX + v[0], SY + v[1], SZ + v[2]];
// 12/10 (pedido dele: a porta não encaixava no casco — parecia colada): a porta de costado é PARTE do navio. Um vão de
// verdade recortado no casco (lado +z), batente, túnel revestido até uma antepara com porta estanque, e a folha da porta
// do tamanho exato do vão, presa por dobradiça na lateral. Fechada nas outras cenas; aberta na invasão (st.door).
export const DOOR = { x: -12, y0: 0.9, y1: 3.8, hw: 1.6, depth: 5.2 };
// as marcas que o navio JÁ carregava antes do ataque (ferrugem escorrida, a chapa remendada, o arranhão do gelo na proa):
// visíveis desde que ele surge; na volta (1:06:45) ele reaparece com elas e sem nenhum dano do ataque
export const OLD: V[] = [[-22, 4.0, 0], [-30, 3.2, 0], [31, 1.3, 0]].map(([x, y]) => [x, y, halfAt(x, y) + 0.1] as V);

// ------------------------------------------------------------------------------------------------ texturas (canvas)
export const canvasTex = (w: number, h: number, draw: (c: CanvasRenderingContext2D) => void, srgb = true) => {
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  draw(cv.getContext("2d")!);
  const t = new THREE.CanvasTexture(cv);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
};
export const radialTex = (stops: [number, string][]) =>
  canvasTex(128, 128, (c) => {
    const g = c.createRadialGradient(64, 64, 0, 64, 64, 64);
    stops.forEach(([o, s]) => g.addColorStop(o, s));
    c.fillStyle = g;
    c.fillRect(0, 0, 128, 128);
  });
// o gelo: placas azuladas, rachaduras com borda clara, neve arrastada pelo vento; e o mapa de aspereza (gelo liso brilha,
// neve não)
export const iceTextures = () => {
  const N = 1024;
  const streaks = Array.from({ length: 140 }).map((_, i) => [rnd(i * 3 + 1) * N, rnd(i * 5 + 2) * N, 30 + rnd(i * 7) * 150, 6 + rnd(i * 11) * 22, -0.25 + rnd(i * 13) * 0.2, 0.18 + rnd(i * 17) * 0.4]);
  const cracks = Array.from({ length: 34 }).map((_, i) => {
    let x = rnd(i * 19 + 4) * N, y = rnd(i * 23 + 5) * N, a = rnd(i * 29) * Math.PI * 2;
    const pts: [number, number][] = [[x, y]];
    const n = 14 + Math.floor(rnd(i * 31) * 40);
    for (let k = 0; k < n; k++) {
      a += (rnd(i * 37 + k) - 0.5) * 0.9;
      const L = 6 + rnd(i * 41 + k) * 16;
      x += Math.cos(a) * L;
      y += Math.sin(a) * L;
      pts.push([x, y]);
    }
    return pts;
  });
  // 11/10 (pedido dele: divisórias retas no gelo que não se encontravam): a textura se repete em placas e o desenho era
  // cortado nas bordas — agora cada mancha, faixa e rachadura é desenhada dando a volta (nas 9 posições), sem costura
  const wrap = (c: CanvasRenderingContext2D, draw: () => void) => {
    for (const dx of [-N, 0, N])
      for (const dy of [-N, 0, N]) {
        c.save();
        c.translate(dx, dy);
        draw();
        c.restore();
      }
  };
  const map = canvasTex(N, N, (c) => {
    c.fillStyle = "#9db4c6";
    c.fillRect(0, 0, N, N);
    wrap(c, () => {
      for (let i = 0; i < 420; i++) {
        c.fillStyle = rnd(i * 3) > 0.5 ? "rgba(235,245,255,0.07)" : "rgba(40,80,120,0.07)";
        c.beginPath();
        c.arc(rnd(i * 7 + 1) * N, rnd(i * 9 + 2) * N, 20 + rnd(i * 13) * 110, 0, Math.PI * 2);
        c.fill();
      }
    });
    c.filter = "blur(7px)";
    wrap(c, () =>
      streaks.forEach(([x, y, rx, ry, rot, o]) => {
        c.fillStyle = `rgba(244,249,255,${o})`;
        c.beginPath();
        c.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
        c.fill();
      }),
    );
    c.filter = "none";
    wrap(c, () =>
      cracks.forEach((pts) => {
        c.lineJoin = "round";
        c.strokeStyle = "rgba(30,60,90,0.55)";
        c.lineWidth = 1.8;
        c.beginPath();
        pts.forEach(([x, y], k) => (k ? c.lineTo(x, y) : c.moveTo(x, y)));
        c.stroke();
        c.strokeStyle = "rgba(235,250,255,0.5)";
        c.lineWidth = 1.2;
        c.beginPath();
        pts.forEach(([x, y], k) => (k ? c.lineTo(x + 1.6, y + 1.2) : c.moveTo(x + 1.6, y + 1.2)));
        c.stroke();
      }),
    );
  });
  const rough = canvasTex(
    N,
    N,
    (c) => {
      c.fillStyle = "rgb(60,60,60)";
      c.fillRect(0, 0, N, N);
      c.filter = "blur(7px)";
      wrap(c, () =>
        streaks.forEach(([x, y, rx, ry, rot]) => {
          c.fillStyle = "rgb(235,235,235)";
          c.beginPath();
          c.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
          c.fill();
        }),
      );
      c.filter = "none";
    },
    false,
  );
  [map, rough].forEach((t) => {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(26, 26);
  });
  return { map, rough };
};
export const lambdaTex = () =>
  canvasTex(256, 256, (c) => {
    c.clearRect(0, 0, 256, 256);
    c.fillStyle = "rgba(255,138,31,0.92)";
    c.font = "bold 210px Georgia, serif";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText("λ", 128, 136);
    // tinta escorrida
    for (let i = 0; i < 6; i++) c.fillRect(70 + rnd(i * 3) * 110, 170 + rnd(i) * 30, 3, 20 + rnd(i * 7) * 40);
  });
const nameTex = () =>
  canvasTex(1024, 160, (c) => {
    c.clearRect(0, 0, 1024, 160);
    c.fillStyle = "rgba(245,245,240,0.92)";
    c.font = "bold 118px 'Arial Black', Arial, sans-serif";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText("BOREALIS", 512, 84);
  });
const plankTex = () =>
  canvasTex(256, 256, (c) => {
    c.fillStyle = "#7a5a34";
    c.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 5; i++) {
      c.fillStyle = `rgba(${90 + i * 8},${62 + i * 4},${34},1)`;
      c.fillRect(0, i * 51, 256, 49);
      c.fillStyle = "rgba(30,20,10,0.6)";
      c.fillRect(0, i * 51 + 49, 256, 2);
      for (let k = 0; k < 14; k++) {
        c.fillStyle = "rgba(40,26,12,0.25)";
        c.fillRect(rnd(i * 20 + k) * 256, i * 51 + rnd(k * 3 + i) * 45, 40 + rnd(k) * 60, 1);
      }
    }
    c.fillStyle = "rgba(170,30,24,0.9)";
    c.fillRect(0, 108, 256, 36);
    c.fillStyle = "rgba(20,14,8,0.9)";
    c.font = "bold 30px 'Courier New', monospace";
    c.textAlign = "center";
    c.fillText("PERIGO", 128, 136);
  });
const ribTex = () =>
  canvasTex(256, 64, (c) => {
    for (let x = 0; x < 256; x += 16) {
      const g = c.createLinearGradient(x, 0, x + 16, 0);
      g.addColorStop(0, "#c8c8c8");
      g.addColorStop(0.5, "#ffffff");
      g.addColorStop(1, "#9a9a9a");
      c.fillStyle = g;
      c.fillRect(x, 0, 16, 64);
    }
  });
const scorchTex = () =>
  canvasTex(256, 256, (c) => {
    c.clearRect(0, 0, 256, 256);
    for (let i = 0; i < 26; i++) {
      const g = c.createRadialGradient(128 + (rnd(i) - 0.5) * 90, 128 + (rnd(i * 3) - 0.5) * 70, 0, 128, 128, 40 + rnd(i * 5) * 70);
      g.addColorStop(0, "rgba(12,10,8,0.5)");
      g.addColorStop(1, "rgba(12,10,8,0)");
      c.fillStyle = g;
      c.fillRect(0, 0, 256, 256);
    }
    c.fillStyle = "rgba(4,4,4,0.95)";
    c.beginPath();
    for (let k = 0; k < 14; k++) {
      const a = (k / 14) * Math.PI * 2;
      const r = 16 + rnd(k * 7) * 22;
      k ? c.lineTo(128 + Math.cos(a) * r, 128 + Math.sin(a) * r) : c.moveTo(128 + Math.cos(a) * r, 128 + Math.sin(a) * r);
    }
    c.fill();
    c.strokeStyle = "rgba(150,70,30,0.6)";
    c.lineWidth = 3;
    c.stroke();
  });
const rustTex = () =>
  canvasTex(256, 256, (c) => {
    c.clearRect(0, 0, 256, 256);
    for (let i = 0; i < 22; i++) {
      const x = 30 + rnd(i * 3) * 196, w = 3 + rnd(i * 5) * 8, h = 60 + rnd(i * 7) * 180;
      const g = c.createLinearGradient(0, 20, 0, 20 + h);
      g.addColorStop(0, "rgba(120,58,26,0.95)");
      g.addColorStop(1, "rgba(120,58,26,0)");
      c.fillStyle = g;
      c.fillRect(x, 20, w, h);
    }
    c.fillStyle = "rgba(90,40,18,0.9)";
    c.fillRect(20, 12, 216, 14);
  });
const scrapeTex = () =>
  canvasTex(512, 128, (c) => {
    c.clearRect(0, 0, 512, 128);
    for (let i = 0; i < 30; i++) {
      const y = 30 + rnd(i * 3) * 70, x0 = rnd(i * 5) * 120, x1 = 300 + rnd(i * 7) * 200;
      c.strokeStyle = i % 3 ? "rgba(70,60,56,0.85)" : "rgba(150,80,40,0.85)";
      c.lineWidth = 1.5 + rnd(i * 11) * 3;
      c.beginPath();
      c.moveTo(x0, y);
      c.lineTo(x1, y + (rnd(i * 13) - 0.5) * 14);
      c.stroke();
    }
  });
export const smokeTex = () =>
  canvasTex(128, 128, (c) => {
    for (let i = 0; i < 18; i++) {
      const x = 64 + (rnd(i * 3) - 0.5) * 50, y = 64 + (rnd(i * 5) - 0.5) * 50, r = 18 + rnd(i * 7) * 30;
      const g = c.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, "rgba(255,255,255,0.35)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      c.fillStyle = g;
      c.fillRect(0, 0, 128, 128);
    }
  });
const crackDiscTex = () =>
  canvasTex(512, 512, (c) => {
    c.clearRect(0, 0, 512, 512);
    // água escura nas fendas que se abrem em volta da proa
    for (let i = 0; i < 16; i++) {
      let x = 256, y = 256, a = (i / 16) * Math.PI * 2 + rnd(i) * 0.3;
      c.strokeStyle = "rgba(6,14,22,0.95)";
      c.lineWidth = 10 - rnd(i * 3) * 4;
      c.lineCap = "round";
      c.beginPath();
      c.moveTo(x, y);
      for (let k = 0; k < 12; k++) {
        a += (rnd(i * 13 + k) - 0.5) * 0.6;
        x += Math.cos(a) * 20;
        y += Math.sin(a) * 20;
        c.lineWidth = Math.max(1.5, c.lineWidth * 0.84);
        c.lineTo(x, y);
      }
      c.stroke();
    }
    const g = c.createRadialGradient(256, 256, 0, 256, 256, 120);
    g.addColorStop(0, "rgba(6,14,22,0.95)");
    g.addColorStop(1, "rgba(6,14,22,0)");
    c.fillStyle = g;
    c.fillRect(0, 0, 512, 512);
  });

// ------------------------------------------------------------------------------------------------ construtores
export type Mats = Record<string, THREE.MeshStandardMaterial>;
export const std = (color: string, rough = 0.7, metal = 0.1, extra: THREE.MeshStandardMaterialParameters = {}) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, ...extra });
export const mesh = (g: THREE.BufferGeometry, m: THREE.Material, p: V = [0, 0, 0], r: V = [0, 0, 0], shadow = true) => {
  const o = new THREE.Mesh(g, m);
  o.position.set(...p);
  o.rotation.set(...r);
  o.castShadow = shadow;
  o.receiveShadow = shadow;
  return o;
};
export const boxM = (w: number, h: number, d: number, m: THREE.Material, p: V, r: V = [0, 0, 0]) => mesh(new THREE.BoxGeometry(w, h, d), m, p, r);
// barra entre dois pontos
export const strut = (a: V, b: V, r: number, m: THREE.Material, seg = 8) => {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
  const L = A.distanceTo(B);
  const o = mesh(new THREE.CylinderGeometry(r, r, L, seg), m);
  o.position.copy(A.clone().add(B).multiplyScalar(0.5));
  o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize());
  return o;
};
export const wheel = (R: number, m: Mats, spokes = 10) => {
  const g = new THREE.Group();
  g.add(mesh(new THREE.TorusGeometry(R - 0.07, 0.09, 8, 28), m.rubber, [0, 0, 0], [0, Math.PI / 2, 0]));
  g.add(mesh(new THREE.TorusGeometry(R - 0.16, 0.035, 6, 24), m.steel, [0, 0, 0], [0, Math.PI / 2, 0]));
  for (let k = 0; k < spokes; k++) {
    const a = (k / spokes) * Math.PI * 2;
    g.add(strut([0, 0, 0], [0, Math.cos(a) * (R - 0.16), Math.sin(a) * (R - 0.16)], 0.022, m.olive, 5));
  }
  g.add(mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.32, 12), m.steel, [0, 0, 0], [0, 0, Math.PI / 2]));
  return g;
};
// canhão de campanha recuperado: olha para -z; origem no chão sob o eixo
const buildGun = (m: Mats, lam: THREE.Texture, k: number) => {
  const g = new THREE.Group();
  const paint = k % 2 ? m.olive : m.olive2;
  [-1.0, 1.0].forEach((x, i) => {
    const w = wheel(0.66, m);
    w.position.set(x, 0.66, 0);
    if (i === 1 && k === 2) w.scale.setScalar(0.96); // uma roda trocada
    g.add(w);
  });
  g.add(mesh(new THREE.CylinderGeometry(0.07, 0.07, 2.1, 10), m.steel, [0, 0.66, 0], [0, 0, Math.PI / 2]));
  g.add(boxM(0.85, 0.36, 1.3, paint, [0, 0.86, -0.05]));
  // escudo com o vão do cano, inclinado para trás
  const sh = new THREE.Shape();
  sh.moveTo(-1.25, 0);
  sh.lineTo(1.25, 0);
  sh.lineTo(1.18, 1.25);
  sh.lineTo(0.55, 1.5);
  sh.lineTo(-0.55, 1.5);
  sh.lineTo(-1.18, 1.25);
  sh.closePath();
  const hole = new THREE.Path();
  hole.absarc(0, 0.72, 0.2, 0, Math.PI * 2, true);
  sh.holes.push(hole);
  const shield = mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.05, bevelEnabled: true, bevelSize: 0.015, bevelThickness: 0.015, bevelSegments: 1 }), k === 1 ? m.rust : paint, [0, 0.36, -0.62], [-0.12, 0, 0]);
  g.add(shield);
  const dec = mesh(new THREE.PlaneGeometry(0.75, 0.75), new THREE.MeshStandardMaterial({ map: lam, transparent: true, roughness: 0.8, depthWrite: false }), [-0.68, 1.12, -0.545], [-0.12, 0, 0], false);
  g.add(dec);
  // cano (elevação + recuo animados)
  const elev = new THREE.Group();
  elev.position.set(0, 1.08, -0.15);
  elev.name = "elev";
  const rec = new THREE.Group();
  rec.name = "rec";
  elev.add(rec);
  rec.add(mesh(new THREE.CylinderGeometry(0.075, 0.105, 3.7, 16), m.gun, [0, 0, -1.25], [Math.PI / 2, 0, 0]));
  rec.add(mesh(new THREE.CylinderGeometry(0.135, 0.135, 0.38, 14), m.gun, [0, 0, -3.15], [Math.PI / 2, 0, 0]));
  rec.add(mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.9, 12), m.steel, [0, -0.19, -0.55], [Math.PI / 2, 0, 0]));
  rec.add(boxM(0.34, 0.34, 0.55, m.gun, [0, 0, 0.8]));
  rec.add(boxM(0.06, 0.22, 0.12, m.steel, [0.2, 0.05, 0.75]));
  const muz = new THREE.Object3D();
  muz.position.set(0, 0, -3.45);
  muz.name = "muz";
  rec.add(muz);
  g.add(elev);
  // conteira aberta com as pás
  [-1, 1].forEach((s) => {
    g.add(strut([s * 0.3, 0.82, 0.4], [s * 1.05, 0.14, 3.2], 0.075, paint, 6));
    g.add(boxM(0.55, 0.42, 0.06, m.steel, [s * 1.08, 0.2, 3.26], [-0.35, 0, 0]));
  });
  // munição ao lado
  const crate = boxM(0.95, 0.46, 0.55, m.wood, [1.75, 0.23, 1.3], [0, 0.3, 0]);
  g.add(crate);
  for (let i = 0; i < 3; i++) g.add(mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.7, 10), m.brass, [1.55 + i * 0.17, 0.08, 2.0], [0, 0.2, Math.PI / 2]));
  return g;
};
// a picape da Resistência com o lançador de canos soldados (olha para -z)
const buildTruck = (m: Mats, lam: THREE.Texture) => {
  const g = new THREE.Group();
  [[-1.08, -2.0], [1.08, -2.0], [-1.08, 1.7], [1.08, 1.7]].forEach(([x, z]) => {
    const w = new THREE.Group();
    w.add(mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.36, 18), m.rubber, [0, 0, 0], [0, 0, Math.PI / 2]));
    w.add(mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.38, 12), m.steel, [0, 0, 0], [0, 0, Math.PI / 2]));
    w.position.set(x, 0.5, z);
    g.add(w);
  });
  g.add(boxM(2.0, 0.35, 5.6, m.steel, [0, 0.72, -0.1]));
  g.add(boxM(2.1, 0.75, 1.5, m.teal, [0, 1.25, -2.65])); // capô
  g.add(boxM(2.1, 1.35, 1.6, m.teal, [0, 1.6, -1.15])); // cabine
  g.add(boxM(1.9, 0.62, 0.04, m.glass, [0, 1.95, -1.96], [0.25, 0, 0]));
  [-1, 1].forEach((s) => g.add(boxM(0.04, 0.55, 1.2, m.glass, [s * 1.06, 1.95, -1.15])));
  g.add(boxM(2.1, 0.12, 2.9, m.rust, [0, 0.95, 1.2])); // caçamba
  [-1, 1].forEach((s) => g.add(boxM(0.08, 0.55, 2.9, m.rust, [s * 1.03, 1.28, 1.2])));
  g.add(boxM(2.1, 0.55, 0.08, m.rust, [0, 1.28, 2.62]));
  g.add(boxM(0.7, 0.3, 0.06, m.chrome, [0, 1.0, -3.42])); // grade
  [-0.75, 0.75].forEach((x) => g.add(mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.06, 12), m.lamp, [x, 1.3, -3.42], [Math.PI / 2, 0, 0], false)));
  g.add(mesh(new THREE.PlaneGeometry(0.9, 0.9), new THREE.MeshStandardMaterial({ map: lam, transparent: true, depthWrite: false }), [1.065, 1.6, -1.15], [0, Math.PI / 2, 0], false));
  // o lançador: 3×3 canos soldados num quadro, inclinado
  const rack = new THREE.Group();
  rack.position.set(0, 1.55, 1.3);
  rack.rotation.x = 0.55;
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++) rack.add(mesh(new THREE.CylinderGeometry(0.13, 0.13, 2.5, 10, 1, true), j === 1 ? m.rust : m.gun, [(i - 1) * 0.3, (j - 1) * 0.3, -0.4], [Math.PI / 2, 0, 0]));
  [-0.55, 0.55].forEach((x) => rack.add(boxM(0.06, 1.0, 0.06, m.steel, [x, 0, -1.3])));
  rack.add(boxM(1.2, 0.06, 0.06, m.steel, [0, 0.5, -1.3]));
  rack.add(boxM(1.2, 0.06, 0.06, m.steel, [0, -0.5, -1.3]));
  const muz = new THREE.Object3D();
  muz.position.set(0, 0, -1.7);
  muz.name = "muz";
  rack.add(muz);
  rack.name = "rack";
  g.add(rack);
  g.add(strut([0, 0.95, 2.2], [0, 1.4, 1.6], 0.06, m.steel));
  return g;
};
// sacos de areia num anel
export const sandbagRing = (m: Mats, R: number, layers = 2) => {
  const g = new THREE.Group();
  const geo = new THREE.CapsuleGeometry(0.2, 0.5, 4, 8);
  for (let l = 0; l < layers; l++) {
    const n = Math.round((Math.PI * 2 * R) / 0.78);
    for (let i = 0; i < n; i++) {
      if (l === 0 && i === 0) continue;
      const a = (i / n) * Math.PI * 2 + l * 0.2;
      const b = mesh(geo, m.sand, [Math.cos(a) * R, 0.16 + l * 0.27, Math.sin(a) * R], [Math.PI / 2, 0, -a]);
      b.scale.set(1, 1, 0.62);
      g.add(b);
    }
  }
  return g;
};
const buildMortar = (m: Mats) => {
  const g = new THREE.Group();
  g.add(sandbagRing(m, 2.3, 2));
  [-0.7, 0.7].forEach((x, i) => {
    const t = new THREE.Group();
    t.position.set(x, 0.1, 0.2);
    t.add(mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.08, 14), m.steel));
    const tube = mesh(new THREE.CylinderGeometry(0.1, 0.11, 1.4, 12), m.gun, [0, 0.62, -0.32], [-0.5, 0, 0]);
    t.add(tube);
    t.add(strut([0, 0.85, -0.6], [-0.35, 0.02, -0.9], 0.03, m.steel));
    t.add(strut([0, 0.85, -0.6], [0.35, 0.02, -0.9], 0.03, m.steel));
    const muz = new THREE.Object3D();
    muz.position.set(0, 1.22, -0.68);
    muz.name = "muz" + i;
    t.add(muz);
    g.add(t);
  });
  for (let i = 0; i < 4; i++) g.add(mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.45, 8), m.brass, [-1.2 + i * 0.16, 0.25, 1.1], [0, 0, 0]));
  return g;
};
const buildStock = (m: Mats, kind: number) => {
  const g = new THREE.Group();
  const barrel = (x: number, z: number, tilt = 0) => {
    const b = new THREE.Group();
    b.add(mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.9, 18), m.redBarrel, [0, 0.45, 0]));
    b.add(mesh(new THREE.CylinderGeometry(0.305, 0.305, 0.16, 18), m.yellow, [0, 0.55, 0]));
    b.add(mesh(new THREE.TorusGeometry(0.29, 0.025, 6, 18), m.steel, [0, 0.9, 0], [Math.PI / 2, 0, 0]));
    b.position.set(x, 0, z);
    b.rotation.z = tilt;
    g.add(b);
  };
  if (kind === 0) {
    barrel(0, 0);
    barrel(0.68, 0.2);
    barrel(0.3, -0.6);
    g.add(boxM(0.9, 0.6, 0.6, m.crate, [-0.9, 0.3, 0.1], [0, 0.2, 0]));
  } else if (kind === 1) {
    g.add(boxM(0.9, 0.6, 0.6, m.crate, [0, 0.3, 0], [0, -0.3, 0]));
    g.add(boxM(0.9, 0.6, 0.6, m.crate, [0.1, 0.9, 0.05], [0, -0.1, 0]));
    barrel(1.0, 0.2);
  } else {
    barrel(0, 0);
    barrel(-0.66, 0.15);
    g.add(boxM(0.9, 0.6, 0.6, m.crate, [0.85, 0.3, -0.1], [0, 0.5, 0]));
  }
  return g;
};
// avião a hélice remendado (nariz para +z)
export const buildPlane = (m: Mats, lam: THREE.Texture, k: number) => {
  const g = new THREE.Group();
  const body = k ? m.planeB : m.planeA;
  const prof = [[0.04, -4.7], [0.22, -4.3], [0.42, -2.6], [0.6, -0.6], [0.7, 1.4], [0.69, 2.8], [0.62, 3.5]].map(([r, y]) => new THREE.Vector2(r, y));
  g.add(mesh(new THREE.LatheGeometry(prof, 18), body, [0, 0, 0], [Math.PI / 2, 0, 0]));
  g.add(mesh(new THREE.CylinderGeometry(0.72, 0.66, 0.95, 18, 1, true), m.gun, [0, 0, 3.75], [Math.PI / 2, 0, 0]));
  g.add(mesh(new THREE.CircleGeometry(0.66, 18), m.dark, [0, 0, 4.2], [0, 0, 0]));
  g.add(mesh(new THREE.ConeGeometry(0.2, 0.45, 12), m.steel, [0, 0, 4.42], [Math.PI / 2, 0, 0]));
  const prop = new THREE.Group();
  prop.position.set(0, 0, 4.32);
  prop.name = "prop";
  for (let i = 0; i < 3; i++) {
    const bl = boxM(0.16, 1.65, 0.04, m.dark, [0, 0.82, 0]);
    const piv = new THREE.Group();
    piv.rotation.z = (i / 3) * Math.PI * 2;
    piv.add(bl);
    prop.add(piv);
  }
  g.add(prop);
  const disc = mesh(new THREE.CircleGeometry(1.7, 32), new THREE.MeshBasicMaterial({ color: "#c8d0d8", transparent: true, opacity: 0.1, depthWrite: false, side: THREE.DoubleSide }), [0, 0, 4.33], [0, 0, 0], false);
  g.add(disc);
  // asas (planta trapezoidal, espessura, diedro)
  const wingShape = (span: number, root: number, tip: number, sweep: number) => {
    const s = new THREE.Shape();
    s.moveTo(0, root / 2);
    s.lineTo(span, tip / 2 - sweep);
    s.lineTo(span, -tip / 2 - sweep);
    s.lineTo(0, -root / 2);
    s.closePath();
    return s;
  };
  const wg = new THREE.ExtrudeGeometry(wingShape(6.2, 2.2, 1.1, 0.2), { depth: 0.16, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 2 });
  [-1, 1].forEach((s) => {
    const w = mesh(wg, body, [s * 0.35, -0.15, 0.7], [Math.PI / 2, 0, 0]);
    w.scale.x = s;
    const hold = new THREE.Group();
    hold.rotation.z = s * 0.07;
    hold.add(w);
    g.add(hold);
    // remendos nas asas
    hold.add(boxM(1.1, 0.03, 0.8, k ? m.primer : m.rust, [s * 3.2, -0.04, 0.6]));
    hold.add(boxM(0.7, 0.03, 0.5, m.yellow2, [s * 1.6, -0.04, 1.0]));
    // trem de pouso fixo
    g.add(strut([s * 1.4, -0.2, 1.2], [s * 1.5, -1.3, 1.4], 0.05, m.steel));
    g.add(mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.16, 14), m.rubber, [s * 1.5, -1.35, 1.4], [0, 0, Math.PI / 2]));
  });
  const tg = new THREE.ExtrudeGeometry(wingShape(2.1, 1.1, 0.6, 0.2), { depth: 0.08, bevelEnabled: false });
  [-1, 1].forEach((s) => {
    const t = mesh(tg, body, [s * 0.15, 0.05, -3.9], [Math.PI / 2, 0, 0]);
    t.scale.x = s;
    g.add(t);
  });
  const fin = new THREE.Shape();
  fin.moveTo(-4.7, 0);
  fin.lineTo(-3.3, 0);
  fin.lineTo(-4.25, 1.55);
  fin.lineTo(-4.75, 1.55);
  fin.closePath();
  g.add(mesh(new THREE.ExtrudeGeometry(fin, { depth: 0.08, bevelEnabled: false }), body, [-0.04, 0.2, 0], [0, -Math.PI / 2, 0]));
  [-1, 1].forEach((s) => g.add(mesh(new THREE.PlaneGeometry(0.85, 0.85), new THREE.MeshStandardMaterial({ map: lam, transparent: true, depthWrite: false, side: THREE.DoubleSide }), [s * 0.07, 1.05, -4.25], [0, s * Math.PI / 2, 0], false)));
  // cabine com vidro
  const can = mesh(new THREE.SphereGeometry(0.55, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), m.glass, [0, 0.42, 0.8]);
  can.scale.set(0.85, 0.85, 2.0);
  g.add(can);
  // remendos no corpo
  g.add(boxM(0.06, 0.5, 0.9, k ? m.rust : m.primer, [0.66, 0, -0.4], [0, 0, 0.1]));
  g.add(boxM(0.06, 0.4, 0.6, m.primer, [-0.62, 0.1, 1.6]));
  const ex = new THREE.Object3D();
  ex.position.set(0.55, -0.35, 3.3);
  ex.name = "ex";
  g.add(ex);
  return g;
};
// o Borealis
const loft = (xa: number, xb: number, N: number) => {
  const pos: number[] = [];
  const col: number[] = [];
  const idx: number[] = [];
  const np = PROF.length;
  const cRed = new THREE.Color("#7a221c"), cBand = new THREE.Color("#1c1e20"), cTop = new THREE.Color("#c9cdc9");
  for (let i = 0; i <= N; i++) {
    const x = xa + ((xb - xa) * i) / N;
    const wx = 0.95 + 0.06 * rnd(Math.floor(x * 0.7) + 300);
    const rust = rnd(Math.floor(x * 0.5) + 77) > 0.86;
    for (const s of [1, -1])
      for (let j = 0; j < np; j++) {
        const y = PROF[j][0] === 99 ? deckY(x) : PROF[j][0];
        pos.push(x, y, s * halfAt(x, y));
        const c = y < -0.25 ? cRed.clone() : y < 0.45 ? cBand.clone() : cTop.clone();
        if (y > 0.45) c.multiplyScalar(wx);
        if (rust && y > 0.45 && y < 5) c.lerp(new THREE.Color("#7a5a44"), 0.35);
        col.push(c.r, c.g, c.b);
      }
  }
  const vi = (i: number, s: number, j: number) => i * 2 * np + s * np + j;
  for (let i = 0; i < N; i++)
    for (let j = 0; j < np - 1; j++) {
      // lado +z (s=0) e lado -z (s=1), com a ordem invertida
      idx.push(vi(i, 0, j), vi(i + 1, 0, j), vi(i + 1, 0, j + 1), vi(i, 0, j), vi(i + 1, 0, j + 1), vi(i, 0, j + 1));
      idx.push(vi(i, 1, j), vi(i + 1, 1, j + 1), vi(i + 1, 1, j), vi(i, 1, j), vi(i, 1, j + 1), vi(i + 1, 1, j + 1));
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  // convés e borda (amurada)
  const dp: number[] = [], di: number[] = [], bp: number[] = [], bi: number[] = [];
  for (let i = 0; i <= N; i++) {
    const x = xa + ((xb - xa) * i) / N;
    const y = deckY(x), h = halfAt(x, y);
    dp.push(x, y, h, x, y, -h);
    bp.push(x, y, h, x, y + 1.0, h, x, y, -h, x, y + 1.0, -h);
    if (i < N) {
      const a = i * 2;
      di.push(a, a + 1, a + 3, a, a + 3, a + 2);
      const b = i * 4;
      bi.push(b, b + 4, b + 5, b, b + 5, b + 1, b + 2, b + 7, b + 6, b + 2, b + 3, b + 7);
    }
  }
  const deck = new THREE.BufferGeometry();
  deck.setAttribute("position", new THREE.Float32BufferAttribute(dp, 3));
  deck.setIndex(di);
  deck.computeVertexNormals();
  const bulw = new THREE.BufferGeometry();
  bulw.setAttribute("position", new THREE.Float32BufferAttribute(bp, 3));
  bulw.setIndex(bi);
  bulw.computeVertexNormals();
  // tampa de seção (vista quando a proa se parte)
  const cap = (x: number) => {
    const s = new THREE.Shape();
    const pts = PROF.map(([py]) => (py === 99 ? deckY(x) : py));
    pts.forEach((y, j) => (j ? s.lineTo(halfAt(x, y), y) : s.moveTo(halfAt(x, y), y)));
    [...pts].reverse().forEach((y) => s.lineTo(-halfAt(x, y), y));
    const geo = new THREE.ShapeGeometry(s);
    geo.rotateY(Math.PI / 2);
    geo.translate(x, 0, 0);
    return geo;
  };
  return { hull: g, deck, bulw, capA: cap(xa), capB: cap(xb) };
};
// o trecho do casco com o vão da porta: a mesma superfície (halfAt), em malha fina, sem as faces do vão (só no lado +z)
const loftHole = (xa: number, xb: number) => {
  const pos: number[] = [], col: number[] = [], idx: number[] = [];
  const cRed = new THREE.Color("#7a221c"), cBand = new THREE.Color("#1c1e20"), cTop = new THREE.Color("#c9cdc9");
  const xs: number[] = [];
  for (let x = xa; x <= xb + 1e-6; x += 0.4) xs.push(+x.toFixed(3));
  const hx0 = DOOR.x - DOOR.hw, hx1 = DOOR.x + DOOR.hw;
  [hx0, hx1].forEach((v) => {
    if (!xs.some((q) => Math.abs(q - v) < 1e-3)) xs.push(v);
  });
  xs.sort((a, b) => a - b);
  const ys0 = PROF.filter(([py]) => py !== 99).map(([py]) => py);
  [DOOR.y0, DOOR.y1].forEach((v) => ys0.push(v));
  for (let y = 0.45; y < 6.9; y += 0.7) ys0.push(y);
  const ys = [...new Set(ys0.map((v) => +v.toFixed(3)))].sort((a, b) => a - b);
  ys.push(99);
  const ny = ys.length;
  for (const x of xs) {
    const wx = 0.95 + 0.06 * rnd(Math.floor(x * 0.7) + 300);
    for (const s of [1, -1])
      for (const y0 of ys) {
        const y = y0 === 99 ? deckY(x) : y0;
        pos.push(x, y, s * halfAt(x, y));
        const cc = y < -0.25 ? cRed.clone() : y < 0.45 ? cBand.clone() : cTop.clone();
        if (y > 0.45) cc.multiplyScalar(wx);
        col.push(cc.r, cc.g, cc.b);
      }
  }
  const vi = (i: number, s: number, j: number) => i * 2 * ny + s * ny + j;
  for (let i = 0; i < xs.length - 1; i++)
    for (let j = 0; j < ny - 1; j++) {
      const cx = (xs[i] + xs[i + 1]) / 2, cy = (ys[j] + (ys[j + 1] === 99 ? 7 : ys[j + 1])) / 2;
      const inHole = cx > hx0 && cx < hx1 && cy > DOOR.y0 && cy < DOOR.y1;
      if (!inHole) idx.push(vi(i, 0, j), vi(i + 1, 0, j), vi(i + 1, 0, j + 1), vi(i, 0, j), vi(i + 1, 0, j + 1), vi(i, 0, j + 1));
      idx.push(vi(i, 1, j), vi(i + 1, 1, j + 1), vi(i + 1, 1, j), vi(i, 1, j), vi(i, 1, j + 1), vi(i + 1, 1, j + 1));
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
};
const buildShip = (m: Mats, tx: { name: THREE.Texture; rib: THREE.Texture; scorch: THREE.Texture; rust: THREE.Texture; scrape: THREE.Texture }) => {
  const root = new THREE.Group();
  root.position.set(SX, SY, SZ);
  const stern = new THREE.Group();
  const bowPiv = new THREE.Group();
  bowPiv.position.set(PIV, 0, 0);
  bowPiv.name = "bowPiv";
  const bow = new THREE.Group();
  bow.position.set(-PIV, 0, 0);
  bowPiv.add(bow);
  root.add(stern, bowPiv);
  const hullMat = m.hull;
  const add = (grp: THREE.Group, o: THREE.Object3D) => {
    grp.add(o);
    return o;
  };
  // a popa em três pedaços: antes do vão, o trecho com o vão (malha fina), depois do vão
  const HXA = DOOR.x - DOOR.hw - 0.8, HXB = DOOR.x + DOOR.hw + 0.8;
  const sA = loft(-56, HXA, 22), sB = loft(HXB, PIV, 13), sH = loft(HXA, HXB, 4), bowL = loft(PIV, 60, 30);
  [sA, sB, sH].forEach((L) => {
    if (L !== sH) add(stern, mesh(L.hull, hullMat));
    add(stern, mesh(L.deck, m.deck));
    add(stern, mesh(L.bulw, m.bulw));
  });
  add(stern, mesh(loftHole(HXA, HXB), hullMat));
  add(stern, mesh(sB.capB, m.torn));
  add(stern, mesh(sA.capA, m.white));
  add(bow, mesh(bowL.hull, hullMat));
  add(bow, mesh(bowL.deck, m.deck));
  add(bow, mesh(bowL.bulw, m.bulw));
  add(bow, mesh(bowL.capA, m.torn));
  // ---- a porta de costado
  const zD = halfAt(DOOR.x, DOOR.y1) + 0.02;
  const hx0 = DOOR.x - DOOR.hw, hx1 = DOOR.x + DOOR.hw, H = DOOR.y1 - DOOR.y0;
  const jamb = std("#8a9096", 0.5, 0.6), lining = std("#5d6368", 0.7, 0.45), floorM = std("#3c4044", 0.8, 0.5), rib = std("#4a4f54", 0.6, 0.6);
  const hazY = std("#d8a42a", 0.6, 0.2), hazK = std("#202224", 0.6, 0.2);
  // batente: moldura saliente em volta do vão (cobre a borda do recorte), com a faixa de aviso em cima
  add(stern, boxM(0.28, H + 0.56, 0.5, jamb, [hx0 - 0.14, DOOR.y0 + H / 2, zD - 0.13]));
  add(stern, boxM(0.28, H + 0.56, 0.5, jamb, [hx1 + 0.14, DOOR.y0 + H / 2, zD - 0.13]));
  add(stern, boxM(2 * DOOR.hw + 0.56, 0.28, 0.5, jamb, [DOOR.x, DOOR.y1 + 0.14, zD - 0.13]));
  add(stern, boxM(2 * DOOR.hw + 0.56, 0.2, 0.5, jamb, [DOOR.x, DOOR.y0 - 0.1, zD - 0.13]));
  for (let i = 0; i < 8; i++) add(stern, boxM(0.4, 0.12, 0.02, i % 2 ? hazK : hazY, [hx0 + 0.2 + i * 0.4, DOOR.y1 + 0.14, zD + 0.125]));
  // o túnel (revestido): piso de chapa, paredes, teto, cavernas a cada 1,2 m, duas luminárias
  const z0 = zD - 0.35, z1 = zD - DOOR.depth, zc = (z0 + z1) / 2, dz = z0 - z1;
  add(stern, boxM(2 * DOOR.hw, 0.1, dz, floorM, [DOOR.x, DOOR.y0 - 0.05, zc]));
  add(stern, boxM(2 * DOOR.hw, 0.1, dz, lining, [DOOR.x, DOOR.y1 + 0.05, zc]));
  add(stern, boxM(0.1, H, dz, lining, [hx0 - 0.05, DOOR.y0 + H / 2, zc]));
  add(stern, boxM(0.1, H, dz, lining, [hx1 + 0.05, DOOR.y0 + H / 2, zc]));
  for (let z = z0 - 0.5; z > z1 + 0.3; z -= 1.2) {
    add(stern, boxM(0.12, H, 0.14, rib, [hx0 + 0.06, DOOR.y0 + H / 2, z]));
    add(stern, boxM(0.12, H, 0.14, rib, [hx1 - 0.06, DOOR.y0 + H / 2, z]));
    add(stern, boxM(2 * DOOR.hw, 0.12, 0.14, rib, [DOOR.x, DOOR.y1 - 0.06, z]));
    add(stern, boxM(2 * DOOR.hw - 0.2, 0.012, 0.05, hazK, [DOOR.x, DOOR.y0 + 0.006, z + 0.6]));
  }
  const lampM = new THREE.MeshBasicMaterial({ color: "#fff0d6", toneMapped: false });
  [z0 - 1.1, z0 - 3.5].forEach((z) => {
    add(stern, boxM(0.9, 0.08, 0.3, rib, [DOOR.x, DOOR.y1 - 0.04, z]));
    add(stern, mesh(new THREE.BoxGeometry(0.8, 0.03, 0.22), lampM, [DOOR.x, DOOR.y1 - 0.09, z], [0, 0, 0], false));
  });
  // cabos e um quadro na parede esquerda do túnel
  add(stern, boxM(0.06, 0.06, dz, std("#24262a", 0.7, 0.3), [hx0 + 0.04, DOOR.y1 - 0.35, zc]));
  add(stern, boxM(0.06, 0.06, dz, std("#7a3a22", 0.7, 0.3), [hx0 + 0.04, DOOR.y1 - 0.45, zc]));
  add(stern, boxM(0.14, 0.7, 0.5, std("#5a6a62", 0.6, 0.4), [hx0 + 0.07, DOOR.y0 + 1.4, z0 - 2.3]));
  // a antepara do fundo, com a porta estanque ABERTA (folha encostada na parede) e o corredor aceso depois dela
  const bw = 0.55, bh = 2.0, bx = DOOR.x + 0.3;
  add(stern, boxM(bx - bw - hx0, H, 0.12, lining, [(hx0 + bx - bw) / 2, DOOR.y0 + H / 2, z1]));
  add(stern, boxM(hx1 - (bx + bw), H, 0.12, lining, [(bx + bw + hx1) / 2, DOOR.y0 + H / 2, z1]));
  add(stern, boxM(2 * bw, H - bh, 0.12, lining, [bx, DOOR.y0 + bh + (H - bh) / 2, z1]));
  add(stern, boxM(2 * bw + 0.24, 0.12, 0.2, jamb, [bx, DOOR.y0 + bh + 0.06, z1 + 0.02]));
  add(stern, boxM(0.12, bh, 0.2, jamb, [bx - bw - 0.06, DOOR.y0 + bh / 2, z1 + 0.02]));
  add(stern, boxM(0.12, bh, 0.2, jamb, [bx + bw + 0.06, DOOR.y0 + bh / 2, z1 + 0.02]));
  add(stern, boxM(2 * bw + 0.24, 0.18, 0.2, jamb, [bx, DOOR.y0 + 0.09, z1 + 0.02]));
  // a folha da porta estanque, aberta para dentro do túnel e encostada na antepara (à direita do vão)
  add(stern, boxM(2 * bw, bh - 0.05, 0.1, std("#6a7076", 0.5, 0.6), [bx + bw + 0.2 + bw * 0.98, DOOR.y0 + bh / 2, z1 + 0.14], [0, -0.12, 0]));
  const hallW = std("#d8d4c8", 0.8, 0.1);
  add(stern, boxM(2 * bw, 0.08, 4, std("#5a5e60", 0.8, 0.3), [bx, DOOR.y0 - 0.04, z1 - 2]));
  add(stern, boxM(0.08, 2.4, 4, hallW, [bx - bw, DOOR.y0 + 1.2, z1 - 2]));
  add(stern, boxM(0.08, 2.4, 4, hallW, [bx + bw, DOOR.y0 + 1.2, z1 - 2]));
  add(stern, boxM(2 * bw, 0.08, 4, hallW, [bx, DOOR.y0 + 2.4, z1 - 2]));
  add(stern, mesh(new THREE.PlaneGeometry(2 * bw, 2.4), new THREE.MeshBasicMaterial({ color: "#efe3c8", toneMapped: false }), [bx, DOOR.y0 + 1.2, z1 - 3.95], [0, 0, 0], false));
  add(stern, mesh(new THREE.BoxGeometry(0.6, 0.03, 0.2), lampM, [bx, DOOR.y0 + 2.34, z1 - 1.2], [0, 0, 0], false));
  const tunL = new THREE.PointLight("#ffe2b8", 18, 9, 1.4);
  tunL.position.set(DOOR.x, DOOR.y1 - 0.4, z0 - 2.2);
  stern.add(tunL);
  const hallL = new THREE.PointLight("#fff0d8", 10, 5, 1.4);
  hallL.position.set(bx, DOOR.y0 + 2.0, z1 - 1.5);
  stern.add(hallL);
  // a folha da porta de costado: do tamanho do vão, dobradiça na lateral esquerda; por fora a pintura do casco,
  // por dentro as nervuras e os trincos
  const doorLeaf = new THREE.Group();
  doorLeaf.position.set(hx0, DOOR.y0, zD);
  const leafOut = std("#c4c8c4", 0.62, 0.28), leafIn2 = std("#5c6268", 0.6, 0.55);
  doorLeaf.add(boxM(2 * DOOR.hw, H, 0.06, leafOut, [DOOR.hw, H / 2, -0.03]));
  doorLeaf.add(boxM(2 * DOOR.hw, H, 0.1, leafIn2, [DOOR.hw, H / 2, -0.11]));
  for (let i = 1; i < 4; i++) doorLeaf.add(boxM(2 * DOOR.hw - 0.2, 0.1, 0.12, rib, [DOOR.hw, (H * i) / 4, -0.22]));
  doorLeaf.add(boxM(0.1, H - 0.2, 0.12, rib, [DOOR.hw, H / 2, -0.22]));
  for (const y of [0.5, H / 2, H - 0.5]) doorLeaf.add(boxM(0.08, 0.3, 0.14, std("#b8402c", 0.6, 0.3), [2 * DOOR.hw - 0.15, y, -0.25]));
  for (let i = 0; i < 3; i++) doorLeaf.add(boxM(0.12, 0.34, 0.16, jamb, [0, 0.4 + (i * (H - 0.8)) / 2, -0.06]));
  for (let i = 0; i < 8; i++) doorLeaf.add(boxM(0.4, 0.1, 0.01, i % 2 ? hazK : hazY, [0.2 + i * 0.4, 0.08, 0.006]));
  stern.add(doorLeaf);
  // vigias acesas ao longo do costado
  const port = new THREE.CylinderGeometry(0.28, 0.28, 0.1, 12);
  for (let x = -40; x <= 40; x += 3.2) {
    if (Math.abs(x - DOOR.x) < DOOR.hw + 1.2) continue;
    const y = 4.4;
    const o = mesh(port, rnd(x * 3) > 0.35 ? m.winWarm : m.winDark, [x, y, halfAt(x, y) + 0.04], [Math.PI / 2, 0, 0], false);
    add(x > PIV ? bow : stern, o);
  }
  // o nome na proa
  // 11/10: letra por letra rente ao costado (a placa inteira entrava no casco curvo e cortava: "ORealis")
  "BOREALIS".split("").forEach((ch, i) => {
    const x = 16.5 + i * 1.75, y = 2.7;
    const dh = halfAt(x + 0.3, y) - halfAt(x - 0.3, y);
    const lt = canvasTex(128, 160, (c2) => {
      c2.clearRect(0, 0, 128, 160);
      c2.fillStyle = "rgba(24,34,48,0.95)";
      c2.font = "bold 150px 'Arial Black', Arial, sans-serif";
      c2.textAlign = "center";
      c2.textBaseline = "middle";
      c2.fillText(ch, 64, 88);
    });
    const o = mesh(new THREE.PlaneGeometry(1.5, 1.9), new THREE.MeshStandardMaterial({ map: lt, transparent: true, depthWrite: false, roughness: 0.6 }), [x, y, halfAt(x, y) + 0.05], [0, -Math.atan(dh / 0.6), 0], false);
    o.renderOrder = 2;
    add(x > PIV ? bow : stern, o);
  });
  void tx.name;
  // superestrutura (três andares + ponte com asas)
  const tiers: [number, number, number, number, number][] = [
    [-50, -26, 7, 11.2, 9.4],
    [-48.5, -30, 11.2, 14.6, 8.4],
    [-46.5, -33, 14.6, 17.8, 7.4],
  ];
  tiers.forEach(([x0, x1, y0, y1, hz]) => {
    add(stern, boxM(x1 - x0, y1 - y0, hz * 2, m.white, [(x0 + x1) / 2, (y0 + y1) / 2, 0]));
    add(stern, boxM(x1 - x0 + 0.3, 0.18, hz * 2 + 0.3, m.snow, [(x0 + x1) / 2, y1 + 0.09, 0]));
  });
  add(stern, boxM(5.2, 3.3, 21, m.white, [-33.6, 19.45, 0]));
  add(stern, boxM(5.5, 0.2, 21.4, m.snow, [-33.6, 21.2, 0]));
  // janelas: InstancedMesh (acesas quentes, frias e apagadas)
  const winG = new THREE.BoxGeometry(1.0, 0.85, 0.08);
  const wins: { p: V; ry: number; c: THREE.Material }[] = [];
  tiers.forEach(([x0, x1, y0, y1, hz], t) => {
    for (let x = x0 + 1.2; x < x1 - 0.6; x += 1.7)
      for (const s of [1, -1]) {
        const r = rnd(x * 7 + t * 13 + s);
        wins.push({ p: [x, (y0 + y1) / 2 + 0.2, s * (hz + 0.05)], ry: 0, c: r > 0.55 ? m.winWarm : r > 0.3 ? m.winCool : m.winDark });
      }
    for (let z = -hz + 1.2; z < hz - 0.6; z += 1.7) wins.push({ p: [x1 + 0.05, (y0 + y1) / 2 + 0.2, z], ry: Math.PI / 2, c: rnd(z * 5 + t) > 0.4 ? m.winWarm : m.winDark });
  });
  for (let z = -9.6; z <= 9.6; z += 1.25) wins.push({ p: [-30.95, 19.9, z], ry: Math.PI / 2, c: m.winCool });
  wins.forEach(({ p, ry, c }) => add(stern, mesh(winG, c, p, [0, ry, 0], false)));
  // mastro com radar e luzes
  add(stern, strut([-34, 21.3, 0], [-34, 29.5, 0], 0.22, m.white));
  add(stern, boxM(0.2, 0.2, 6.5, m.white, [-34, 27.2, 0]));
  const radar = new THREE.Group();
  radar.position.set(-34, 29.8, 0);
  radar.name = "radar";
  radar.add(boxM(0.35, 0.3, 4.2, m.dark, [0, 0, 0]));
  add(stern, radar);
  add(stern, mesh(new THREE.SphereGeometry(0.18, 8, 6), m.lampRed, [-34, 30.4, 0], [0, 0, 0], false));
  // chaminé
  const fun = mesh(new THREE.CylinderGeometry(2.0, 2.3, 7.5, 20), m.white, [-41.5, 21.5, 0]);
  fun.scale.z = 1.35;
  add(stern, fun);
  const band = mesh(new THREE.CylinderGeometry(2.13, 2.19, 1.3, 20), m.redPaint, [-41.5, 23.4, 0]);
  band.scale.z = 1.35;
  add(stern, band);
  const top = mesh(new THREE.CylinderGeometry(2.08, 2.08, 0.9, 20), m.dark, [-41.5, 25.68, 0]);
  top.scale.z = 1.35;
  add(stern, top);
  // botes salva-vidas (laranja) nos turcos
  [-46, -39].forEach((x) =>
    [1, -1].forEach((s) => {
      const b = mesh(new THREE.CapsuleGeometry(0.9, 4.2, 6, 12), m.orange, [x, 13.0, s * 9.4], [0, 0, Math.PI / 2]);
      b.scale.z = 0.85;
      add(stern, b);
      add(stern, strut([x - 1.6, 11.2, s * 8.6], [x - 1.6, 14.4, s * 9.4], 0.08, m.white));
      add(stern, strut([x + 1.6, 11.2, s * 8.6], [x + 1.6, 14.4, s * 9.4], 0.08, m.white));
    }),
  );
  // contêineres (corrugados) e escotilhas
  const cg = new THREE.BoxGeometry(6.1, 2.6, 2.45);
  const ccol = ["#3d5f8c", "#963a2a", "#3f7a52", "#3d5f8c", "#a8862e", "#6a6e72", "#963a2a"];
  for (let i = 0; i < 7; i++) {
    const x = -22 + (i % 4) * 6.4, z = (i < 4 ? 1 : -1) * 3.0 + (i % 2) * 0.3;
    const cm = new THREE.MeshStandardMaterial({ color: ccol[i], map: tx.rib, roughness: 0.65, metalness: 0.25 });
    add(stern, mesh(cg, cm, [x, deckY(x) + 1.3, z]));
    if (i % 3 === 0) add(stern, mesh(cg, new THREE.MeshStandardMaterial({ color: ccol[(i + 2) % 7], map: tx.rib, roughness: 0.65, metalness: 0.25 }), [x, deckY(x) + 3.9, z]));
    add(stern, boxM(6.15, 0.15, 2.5, m.snow, [x, deckY(x) + 2.66 + (i % 3 === 0 ? 2.6 : 0), z]));
  }
  [20, 28].forEach((x) => {
    add(bow, boxM(6.5, 1.0, 10, m.hatch, [x, deckY(x) + 0.5, 0]));
    add(bow, boxM(6.6, 0.1, 10.1, m.snow, [x, deckY(x) + 1.05, 0]));
  });
  // guindastes amarelos (coluna, cabine, lança inclinada, cabo)
  const crane = (grp: THREE.Group, x: number, z: number, yaw: number) => {
    const y0 = deckY(x);
    grp.add(mesh(new THREE.CylinderGeometry(0.8, 1.0, 6.5, 14), m.yellow, [x, y0 + 3.25, z]));
    grp.add(boxM(2.4, 2.0, 2.2, m.yellow, [x, y0 + 7.5, z]));
    const boom = new THREE.Group();
    boom.position.set(x, y0 + 7.6, z);
    boom.rotation.set(0, yaw, 0.62);
    boom.add(boxM(16, 0.55, 0.55, m.yellow, [8, 0, 0]));
    grp.add(boom);
    const tip = new THREE.Vector3(16, 0, 0).applyEuler(boom.rotation).add(boom.position);
    grp.add(strut([tip.x, tip.y, tip.z], [tip.x, y0 + 3, tip.z], 0.04, m.dark, 4));
  };
  crane(stern, -2, -4.5, 0.4);
  crane(bow, 34, 4.5, Math.PI - 0.3);
  // castelo de proa, molinete, mastro de vante com holofotes
  add(bow, boxM(8, 1.6, 12, m.white, [47, deckY(47) + 0.8, 0]));
  add(bow, strut([48, deckY(48) + 1.6, 0], [48, deckY(48) + 12, 0], 0.18, m.white));
  add(bow, boxM(0.2, 0.2, 4, m.white, [48, deckY(48) + 10, 0]));
  [-1.6, 1.6].forEach((z) => add(bow, mesh(new THREE.SphereGeometry(0.28, 8, 6), m.lamp, [48, deckY(48) + 10, z], [0, 0, 0], false)));
  add(bow, mesh(new THREE.SphereGeometry(0.22, 8, 6), m.lampRed, [48, deckY(48) + 12.2, 0], [0, 0, 0], false));
  // guarda-corpo (balaústres)
  const post = new THREE.CylinderGeometry(0.04, 0.04, 1.1, 5);
  for (let x = -54; x < 58; x += 2.2)
    for (const s of [1, -1]) {
      const y = deckY(x) + 1.0, h = halfAt(x, deckY(x));
      if (h < 0.5) continue;
      add(x > PIV ? bow : stern, mesh(post, m.white, [x, y + 0.55, s * (h - 0.05)], [0, 0, 0], false));
    }
  // as marcas antigas (sempre lá)
  const rustM = new THREE.MeshStandardMaterial({ map: tx.rust, transparent: true, depthWrite: false, roughness: 0.9 });
  rustM.userData.scar = true;
  const r0 = mesh(new THREE.PlaneGeometry(9, 7), rustM, [OLD[0][0], OLD[0][1] - 1.6, OLD[0][2]], [0, 0, 0], false);
  r0.renderOrder = 2;
  stern.add(r0);
  const patch = boxM(6.4, 3.4, 0.14, std("#6f7a80", 0.8, 0.3), [OLD[1][0], OLD[1][1], OLD[1][2] - 0.02]);
  stern.add(patch);
  for (const [dx, dy, w, h] of [[0, 1.75, 6.6, 0.16], [0, -1.75, 6.6, 0.16], [3.25, 0, 0.16, 3.6], [-3.25, 0, 0.16, 3.6], [-1.1, 0, 0.1, 3.4], [1.1, 0, 0.1, 3.4]]) stern.add(boxM(w, h, 0.16, std("#4a4642", 0.8, 0.5), [OLD[1][0] + dx, OLD[1][1] + dy, OLD[1][2]]));
  const scM = new THREE.MeshStandardMaterial({ map: tx.scrape, transparent: true, depthWrite: false, roughness: 0.9 });
  scM.userData.scar = true;
  const dhs = halfAt(31.5, 1.3) - halfAt(30.5, 1.3);
  const s0 = mesh(new THREE.PlaneGeometry(15, 3.2), scM, OLD[2], [0, Math.atan(dhs), 0], false);
  s0.renderOrder = 2;
  bow.add(s0);
  // marcas dos tiros (aparecem quando o tiro bate; somem na volta: ele volta ANTES da destruição)
  const scars: THREE.Mesh[] = HITS.map((h, k) => {
    const mat = new THREE.MeshStandardMaterial({ map: tx.scorch, transparent: true, depthWrite: false, roughness: 1, opacity: 0 });
    const o = mesh(new THREE.PlaneGeometry(k === 3 ? 4.5 : 5.5, k === 3 ? 4.5 : 5.5), mat, [h[0], h[1], h[2] + 0.02], [0, 0, rnd(k) * 3], false);
    o.renderOrder = 2;
    (h[0] > PIV ? bow : stern).add(o);
    return o;
  });
  // o rasgo na meia-nau (queimado)
  const tearMat = new THREE.MeshStandardMaterial({ map: tx.scorch, transparent: true, depthWrite: false, roughness: 1, opacity: 0, emissive: new THREE.Color("#ff6a20"), emissiveIntensity: 0 });
  const tear = mesh(new THREE.PlaneGeometry(16, 8), tearMat, [9, 3.6, halfAt(9, 3.6) + 0.1], [0, 0, 0], false);
  tear.renderOrder = 3;
  stern.add(tear);
  return { root, bowPiv, radar, scars, tear, tearMat, doorLeaf };
};

// ------------------------------------------------------------------------------------------------ estado por quadro
// os materiais do mundo/navio (12/10: separados para o Borealis poder aparecer em outras cenas, como o dique seco)
export const shipMaterials = (): Mats => ({
  olive: std("#4a5036", 0.72, 0.35),
  olive2: std("#565a3e", 0.75, 0.3),
  rust: std("#6e3c22", 0.85, 0.3),
  steel: std("#2e3031", 0.45, 0.75),
  gun: std("#1f2122", 0.4, 0.8),
  rubber: std("#141414", 0.9, 0),
  brass: std("#b08a3e", 0.35, 0.9),
  wood: new THREE.MeshStandardMaterial({ map: plankTex(), roughness: 0.85 }),
  crate: new THREE.MeshStandardMaterial({ map: plankTex(), roughness: 0.85 }),
  teal: std("#5c7774", 0.6, 0.35),
  glass: std("#1a2a34", 0.08, 0.9, { emissive: new THREE.Color("#0a1a24"), emissiveIntensity: 0.6 }),
  chrome: std("#9aa0a4", 0.25, 1),
  lamp: std("#fff4d0", 0.3, 0, { emissive: new THREE.Color("#ffe9b0"), emissiveIntensity: 2.4 }),
  lampRed: std("#ff4a3a", 0.3, 0, { emissive: new THREE.Color("#ff3020"), emissiveIntensity: 2.6 }),
  sand: std("#8c7f62", 0.95, 0),
  redBarrel: std("#a3231b", 0.5, 0.35),
  yellow: std("#d8a42a", 0.55, 0.3),
  yellow2: std("#b8963a", 0.7, 0.2),
  primer: std("#6b6f71", 0.8, 0.2),
  planeA: std("#5b6249", 0.6, 0.35),
  planeB: std("#858b88", 0.5, 0.5),
  dark: std("#151617", 0.6, 0.6),
  hull: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.62, metalness: 0.28 }),
  deck: std("#8e979c", 0.9, 0.1),
  bulw: std("#c2c6c2", 0.65, 0.25, { side: THREE.DoubleSide }),
  white: std("#dfe2de", 0.6, 0.15),
  snow: std("#eef3f7", 0.95, 0),
  torn: std("#2a1a12", 0.9, 0.4, { emissive: new THREE.Color("#ff5a10"), emissiveIntensity: 0.25 }),
  winWarm: std("#ffd9a0", 0.3, 0, { emissive: new THREE.Color("#ffc878"), emissiveIntensity: 1.9 }),
  winCool: std("#bfe8ff", 0.3, 0, { emissive: new THREE.Color("#9fdcff"), emissiveIntensity: 1.6 }),
  winDark: std("#1a2228", 0.2, 0.6),
  redPaint: std("#b0322a", 0.55, 0.2),
  orange: std("#ff7a1e", 0.5, 0.1),
  hatch: std("#4d5a63", 0.7, 0.4),
});
// o Borealis inteiro (o mesmo modelo do gelo), pronto para pôr em outra cena
export const makeBorealis = () => buildShip(shipMaterials(), { name: nameTex(), rib: ribTex(), scorch: scorchTex(), rust: rustTex(), scrape: scrapeTex() });
// 12/10 (pedido dele: o Borealis em wireframe simplório): as arestas do MESMO navio 3D, para os hologramas. Coordenadas
// do navio (three): x = comprimento (popa −56 · proa +60), y = altura (quilha −8,5), z = largura. Sem as janelas e a neve.
let edgesCache: [number, number, number, number, number, number][] | null = null;
export const borealisEdges = () => {
  if (edgesCache) return edgesCache;
  const B = makeBorealis();
  B.root.position.set(0, 0, 0);
  B.root.updateMatrixWorld(true);
  const out: [number, number, number, number, number, number][] = [];
  const a = new THREE.Vector3(), b = new THREE.Vector3();
  B.scars.forEach((s) => (s.visible = false));
  B.tear.visible = false;
  B.root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh || !m.visible) return;
    const mat = (Array.isArray(m.material) ? m.material[0] : m.material) as THREE.MeshStandardMaterial;
    if (mat.transparent || mat.userData?.scar) return;
    const g = m.geometry as THREE.BufferGeometry;
    const p = g.getAttribute("position");
    if (!p || p.count < 3) return;
    const big = p.count > 200;
    const eg = new THREE.EdgesGeometry(g, big ? 28 : 40);
    const ep = eg.getAttribute("position");
    for (let i = 0; i < ep.count; i += 2) {
      a.fromBufferAttribute(ep, i).applyMatrix4(m.matrixWorld);
      b.fromBufferAttribute(ep, i + 1).applyMatrix4(m.matrixWorld);
      if (a.distanceTo(b) < 0.5) continue;
      out.push([a.x, a.y, a.z, b.x, b.y, b.z]);
    }
    eg.dispose();
    // 13/10 (pedido dele: o casco não aparecia no wireframe): superfícies grandes e lisas (o casco) não têm quinas;
    // elas ganham os cortes de uma planta naval — cavernas (x) e linhas d'água (altura)
    g.computeBoundingBox();
    const bb = g.boundingBox!.clone().applyMatrix4(m.matrixWorld);
    if (bb.max.x - bb.min.x > 25) {
      const idx = g.getIndex();
      const tri = (k: number) => (idx ? idx.getX(k) : k);
      const nT = (idx ? idx.count : p.count) / 3;
      const V = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
      const slice = (axis: "x" | "y", val: number) => {
        for (let t = 0; t < nT; t++) {
          for (let j = 0; j < 3; j++) V[j].fromBufferAttribute(p, tri(t * 3 + j)).applyMatrix4(m.matrixWorld);
          const pts: THREE.Vector3[] = [];
          for (let j = 0; j < 3; j++) {
            const A = V[j], Bv = V[(j + 1) % 3];
            const da = A[axis] - val, db = Bv[axis] - val;
            if ((da < 0 && db >= 0) || (da >= 0 && db < 0)) pts.push(A.clone().lerp(Bv, da / (da - db)));
          }
          if (pts.length === 2) out.push([pts[0].x, pts[0].y, pts[0].z, pts[1].x, pts[1].y, pts[1].z]);
        }
      };
      for (let x = Math.ceil(bb.min.x / 6) * 6; x < bb.max.x; x += 6) slice("x", x);
      for (let y = Math.ceil(bb.min.y / 1.6) * 1.6; y < bb.max.y; y += 1.6) slice("y", y);
    }
  });
  edgesCache = out;
  return out;
};
export type BState = {
  f: number;
  lite: boolean;
  cam: { pos: V; tgt: V; fov: number };
  ship: { on: boolean; op: number; glow: number; collapse: number; burn: number; scar: number[]; phase?: number; decay?: number };
  guns: { up: number; aim: V; recoil: number[] };
  stock: number[];
  truck: number;
  mortar: number;
  planes: ({ pos: V; dir: V; roll: number } | null)[];
  fire: { p: V; s: number; o: number }[];
  smoke: { p: V; s: number; o: number; dark: number }[];
  tracers: { a: V; b: V }[];
  flashes: { p: V; k: number }[];
  ring: number;
  crack: number;
  ridge?: boolean;
  door?: number;
};
const POOL_FIRE = 140;
const POOL_SMOKE = 260;
// 12/10 (pedido dele: o navio só piscando não parece se desfazer): a MESMA falha de fase da fuga (1:45), agora no casco
// por fora — cada peça do navio, em grupos, se solta e se afasta do casco em ondas, escurece puxando para o violeta e, no
// pico, vira só a aresta violeta (o vazio atrás); com "decay" as peças vão ficando decompostas de vez (só a aresta) e as
// que restam escurecem (corroídas).
type PhaseRec = { m: THREE.Mesh; base: THREE.Vector3; dir: THREE.Vector3; gid: number; mat: THREE.MeshStandardMaterial; col: THREE.Color; edge: THREE.LineSegments };
const phaseInit = (root: THREE.Group): PhaseRec[] => {
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  const ctr = box.getCenter(new THREE.Vector3());
  const recs: PhaseRec[] = [];
  const edgeM = new THREE.LineBasicMaterial({ color: "#b48cff", transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh || !m.geometry || !m.parent) return;
    const mm = m.material as THREE.MeshStandardMaterial;
    if (!mm || Array.isArray(mm) || !mm.color || mm.userData.scar) return;
    const wb = new THREE.Box3().setFromObject(m);
    const wc = wb.getCenter(new THREE.Vector3());
    const dW = wc.clone().sub(ctr);
    dW.y = Math.max(0.2, dW.y * 0.5);
    dW.normalize();
    const pInv = new THREE.Matrix4().copy(m.parent.matrixWorld).invert();
    const dL = dW.clone().transformDirection(pInv);
    const gid = Math.floor((wc.x - box.min.x) / 7) * 5 + Math.floor((wc.y - box.min.y) / 4) * 3 + (wc.z > ctr.z ? 1 : 0);
    const mat = mm.clone();
    m.material = mat;
    let edge: THREE.LineSegments;
    try {
      edge = new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry, 25), edgeM);
    } catch {
      edge = new THREE.LineSegments(new THREE.BufferGeometry(), edgeM);
    }
    edge.visible = false;
    m.add(edge);
    recs.push({ m, base: m.position.clone(), dir: dL, gid, mat, col: mat.color.clone(), edge });
  });
  return recs;
};
const VIOL = new THREE.Color("#3a2458");
const phaseApply = (recs: PhaseRec[], f: number, phase: number, decay: number) => {
  for (const r of recs) {
    const gone = decay > 0 && prnd(r.gid * 13 + 1) < decay * 0.75;
    const wave = Math.max(0, Math.sin(f / 34 + r.gid * 2.1)) * phase * (prnd(r.gid * 7) > 0.35 ? 1 : 0.25);
    const ph = gone ? 1 : wave;
    r.m.position.copy(r.base).addScaledVector(r.dir, ph * (gone ? 2.6 + 1.2 * prnd(r.gid) : 1.4));
    r.m.rotation.z = (r.m.userData.rz0 ??= r.m.rotation.z) + ph * 0.08 * (prnd(r.gid * 3) - 0.5);
    const showEdge = ph > 0.72;
    r.m.visible = true;
    r.mat.visible = !showEdge;
    r.edge.visible = showEdge;
    // escurece puxando para o violeta (corroído) — mais com o "decay"
    const k = Math.min(1, ph * 0.55 + decay * 0.45);
    r.mat.color.copy(r.col).lerp(VIOL, k);
  }
};
const prnd = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
export const World: React.FC<{ st: BState; extra?: (root: THREE.Group, f: number) => void; extraKey?: string }> = ({ st, extra }) => {
  const { camera, scene, gl, invalidate } = useThree();
  const W = useMemo(() => {
    const lite = st.lite;
    const lam = lambdaTex();
    const ice = iceTextures();
    const m: Mats = shipMaterials();
    const root = new THREE.Group();
    // céu: fundo transparente (o céu 2D atrás) + névoa da cor do horizonte
    scene.fog = new THREE.FogExp2("#2c3e4c", 0.0021);
    // luzes: a lua (com sombra), o contra-luz da aurora (brilho no gelo), o céu
    const moon = new THREE.DirectionalLight("#cfe0ff", 1.6);
    moon.position.set(-140, 120, 60);
    moon.target.position.set(0, 0, -60);
    moon.castShadow = true;
    moon.shadow.mapSize.set(lite ? 1024 : 2048, lite ? 1024 : 2048);
    const sc = moon.shadow.camera as THREE.OrthographicCamera;
    sc.left = -140;
    sc.right = 140;
    sc.top = 120;
    sc.bottom = -120;
    sc.near = 10;
    sc.far = 500;
    moon.shadow.bias = -0.0006;
    moon.shadow.normalBias = 0.04;
    root.add(moon, moon.target);
    const rim = new THREE.DirectionalLight("#9fffe0", 1.1);
    rim.position.set(60, 60, -400);
    root.add(rim);
    root.add(new THREE.HemisphereLight("#5a7898", "#20262c", 0.75));
    // o gelo
    const iceM = new THREE.MeshStandardMaterial({ map: ice.map, roughnessMap: ice.rough, roughness: 1, metalness: 0.05, color: "#ffffff" });
    const iceP = mesh(new THREE.PlaneGeometry(3400, 3400), iceM, [0, 0, -700], [-Math.PI / 2, 0, 0]);
    iceP.castShadow = false;
    root.add(iceP);
    // a crista de neve e o chão perto da câmera
    const rg = new THREE.PlaneGeometry(150, 46, 150, 60);
    rg.rotateX(-Math.PI / 2);
    rg.translate(0, 0, -8);
    const rp = rg.attributes.position as THREE.BufferAttribute;
    const rc: number[] = [];
    for (let i = 0; i < rp.count; i++) {
      const x = rp.getX(i), z = rp.getZ(i);
      const edge = ss((75 - Math.abs(x)) / 20) * ss((z + 31) / 6);
      const y = ridgeH(x, z) * edge - (1 - edge) * 0.3;
      rp.setY(i, y);
      const k = 0.93 + 0.07 * rnd(i * 7);
      rc.push(0.74 * k, 0.8 * k, 0.88 * k);
    }
    rg.setAttribute("color", new THREE.Float32BufferAttribute(rc, 3));
    rg.computeVertexNormals();
    const ridge = mesh(rg, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.93, metalness: 0 }));
    ridge.castShadow = false;
    ridge.name = "ridge";
    root.add(ridge);
    // blocos de gelo: em volta do casco e em cordões de pressão no campo
    const chunkG = new THREE.DodecahedronGeometry(1, 0);
    const chunkM = std("#c9dbe6", 0.32, 0.05);
    const chunks: [V, V, V][] = [];
    for (let i = 0; i < 150; i++) {
      const x = -60 + rnd(i * 3) * 124;
      const s = rnd(i * 5) > 0.5 ? 1 : -1;
      // nenhum bloco na frente da porta de costado (onde fica a rampa)
      if (s === 1 && Math.abs(x - DOOR.x) < DOOR.hw + 3.5) continue;
      // nem na frente da porta da popa (por onde a Alyx entra)
      if (s === 1 && Math.abs(x + 50) < 5) continue;
      const hz = Math.max(4, hullHalf(x)) + 0.8 + rnd(i * 7) * 3.5;
      const sc2 = 0.6 + rnd(i * 11) * 1.8;
      chunks.push([[SX + x, sc2 * 0.35, SZ + s * hz], [sc2 * (1 + rnd(i) * 0.6), sc2 * 0.7, sc2], [rnd(i * 13) * 3, rnd(i * 17) * 3, rnd(i * 19) * 3]]);
    }
    for (let r = 0; r < 4; r++)
      for (let i = 0; i < 70; i++) {
        const u = i / 70;
        const x = -260 + u * 520;
        const z = [-60, -95, -230, -330][r] + Math.sin(u * 7 + r) * 12 + (rnd(i + r * 99) - 0.5) * 4;
        const sc2 = 0.5 + rnd(i * 23 + r) * (r < 2 ? 1.0 : 2.2);
        chunks.push([[x, sc2 * 0.3, z], [sc2 * 1.3, sc2 * 0.6, sc2], [rnd(i * 29) * 3, rnd(i * 31) * 3, rnd(i * 37) * 3]]);
      }
    const inst = new THREE.InstancedMesh(chunkG, chunkM, chunks.length);
    const tmp = new THREE.Object3D();
    chunks.forEach(([p, s, r], i) => {
      tmp.position.set(...p);
      tmp.scale.set(...s);
      tmp.rotation.set(...r);
      tmp.updateMatrix();
      inst.setMatrixAt(i, tmp.matrix);
    });
    inst.castShadow = true;
    inst.receiveShadow = true;
    root.add(inst);
    // montanhas de gelo ao longe
    for (let i = 0; i < 14; i++) {
      const x = -900 + i * 140 + rnd(i) * 60;
      const mt = mesh(new THREE.ConeGeometry(60 + rnd(i * 3) * 90, 30 + rnd(i * 5) * 50, 6), std("#5b7184", 0.9, 0), [x, 10, -820 - rnd(i * 7) * 120], [0, rnd(i * 9) * 3, 0], false);
      root.add(mt);
    }
    // a Resistência
    const guns = GUNS.map(([x, z], k) => {
      const g = buildGun(m, lam, k);
      g.position.set(x, ridgeH(x, z), z);
      root.add(g);
      return g;
    });
    const stock = STOCK.map(([x, z, k]) => {
      const g = buildStock(m, k);
      g.position.set(x, ridgeH(x, z), z);
      root.add(g);
      return g;
    });
    const truck = buildTruck(m, lam);
    truck.position.set(TRUCK[0], ridgeH(TRUCK[0], TRUCK[2]) - 0.15, TRUCK[2]);
    truck.rotation.y = 0.12;
    root.add(truck);
    truck.add(sandbagRing(m, 3.6, 1));
    const mortar = buildMortar(m);
    mortar.position.set(MORTAR[0], ridgeH(MORTAR[0], MORTAR[2]) - 0.1, MORTAR[2]);
    root.add(mortar);
    const planes = [0, 1].map((k) => {
      const p = buildPlane(m, lam, k);
      p.visible = false;
      root.add(p);
      return p;
    });
    // o navio
    const ship = buildShip(m, { name: nameTex(), rib: ribTex(), scorch: scorchTex(), rust: rustTex(), scrape: scrapeTex() });
    root.add(ship.root);
    const shipMats: THREE.Material[] = [];
    ship.root.traverse((o) => {
      const mm = (o as THREE.Mesh).material as THREE.Material | undefined;
      if (mm && !shipMats.includes(mm)) shipMats.push(mm);
    });
    // fendas na proa quando ela afunda
    const crack = mesh(new THREE.PlaneGeometry(90, 90), new THREE.MeshBasicMaterial({ map: crackDiscTex(), transparent: true, depthWrite: false, opacity: 0 }), [SX + 30, 0.06, SZ + 4], [-Math.PI / 2, 0, 0], false);
    root.add(crack);
    // a onda de fase quando ele surge
    const ring = mesh(new THREE.RingGeometry(0.92, 1, 96), new THREE.MeshBasicMaterial({ color: "#9fffe0", transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }), [SX, 0.4, SZ], [-Math.PI / 2, 0, 0], false);
    root.add(ring);
    // partículas: fogo (aditivo), fumaça, traçantes, neve
    const fireT = radialTex([[0, "rgba(255,252,235,1)"], [0.22, "rgba(255,214,120,0.95)"], [0.5, "rgba(255,120,30,0.5)"], [1, "rgba(120,30,0,0)"]]);
    const smT = smokeTex();
    const fire = Array.from({ length: POOL_FIRE }).map(() => {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: fireT, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false }));
      s.visible = false;
      root.add(s);
      return s;
    });
    const smoke = Array.from({ length: POOL_SMOKE }).map(() => {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: smT, depthWrite: false, transparent: true, color: "#555555" }));
      s.visible = false;
      root.add(s);
      return s;
    });
    const trG = new THREE.CylinderGeometry(0.09, 0.09, 7, 6);
    trG.rotateX(Math.PI / 2);
    const tracers = Array.from({ length: 10 }).map(() => {
      const t = new THREE.Mesh(trG, new THREE.MeshBasicMaterial({ color: "#ffe39a", blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false }));
      t.visible = false;
      root.add(t);
      return t;
    });
    const lights = Array.from({ length: 4 }).map(() => {
      const l = new THREE.PointLight("#ffaa55", 0, 90, 1.6);
      root.add(l);
      return l;
    });
    const fireLight = new THREE.PointLight("#ff8a3a", 0, 70, 1.4);
    root.add(fireLight);
    const N = lite ? 900 : 1800;
    const snowBase = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      snowBase[i * 3] = (rnd(i * 3 + 1) - 0.5) * 90;
      snowBase[i * 3 + 1] = rnd(i * 5 + 2) * 26;
      snowBase[i * 3 + 2] = -rnd(i * 7 + 3) * 70 + 6;
    }
    const sg = new THREE.BufferGeometry();
    sg.setAttribute("position", new THREE.BufferAttribute(new Float32Array(N * 3), 3));
    const snow = new THREE.Points(sg, new THREE.PointsMaterial({ size: 0.11, map: radialTex([[0, "rgba(255,255,255,1)"], [1, "rgba(255,255,255,0)"]]), transparent: true, depthWrite: false, color: "#e8f2ff", opacity: 0.85 }));
    snow.frustumCulled = false;
    root.add(snow);
    return { root, guns, stock, truck, mortar, planes, ship, shipMats, crack, ring, fire, smoke, tracers, lights, fireLight, snow, snowBase, N };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // ---- aplica o estado do quadro
  gl.shadowMap.enabled = !st.lite || true;
  const cam = camera as THREE.PerspectiveCamera;
  cam.fov = st.cam.fov;
  cam.near = 0.3;
  cam.far = 4000;
  cam.position.set(...st.cam.pos);
  cam.lookAt(...st.cam.tgt);
  cam.updateProjectionMatrix();
  const f = st.f;
  W.root.getObjectByName("ridge")!.visible = st.ridge !== false;
  // a Resistência sobe de trás da crista
  W.guns.forEach((g, k) => {
    const [x, z] = GUNS[k];
    g.position.y = ridgeH(x, z) - 3.2 * (1 - st.guns.up * 0 - (st.stock.length ? 0 : 0)) * 0 + (st.guns.up < 0 ? 0 : 0);
    const u = (st as unknown as { gunsUp: number[] }).gunsUp?.[k] ?? 1;
    g.position.y = ridgeH(x, z) - 3.4 * (1 - u);
    g.visible = u > 0.001;
    const d = new THREE.Vector3(st.guns.aim[0] - x, 0, st.guns.aim[2] - z);
    g.rotation.y = Math.atan2(-d.x, -d.z);
    const elev = g.getObjectByName("elev")!;
    elev.rotation.x = 0.24;
    g.getObjectByName("rec")!.position.z = st.guns.recoil[k] * 0.5;
  });
  W.stock.forEach((g, k) => {
    const [x, z] = STOCK[k];
    g.position.y = ridgeH(x, z) - 2.6 * (1 - st.stock[k]);
    g.visible = st.stock[k] > 0.001;
  });
  W.truck.position.y = ridgeH(TRUCK[0], TRUCK[2]) - 0.15 - 3.6 * (1 - st.truck);
  W.truck.visible = st.truck > 0.001;
  W.mortar.position.y = ridgeH(MORTAR[0], MORTAR[2]) - 0.1 - 3 * (1 - st.mortar);
  W.mortar.visible = st.mortar > 0.001;
  W.planes.forEach((pl, k) => {
    const s = st.planes[k];
    pl.visible = !!s;
    if (!s) return;
    pl.position.set(...s.pos);
    pl.lookAt(s.pos[0] + s.dir[0], s.pos[1] + s.dir[1], s.pos[2] + s.dir[2]);
    pl.rotateZ(s.roll);
    pl.getObjectByName("prop")!.rotation.z = f * (k ? 1.1 : 1.37);
  });
  // o navio
  const S = W.ship;
  S.root.visible = st.ship.on;
  S.bowPiv.rotation.z = -0.19 * st.ship.collapse;
  S.bowPiv.position.y = -2.2 * st.ship.collapse;
  S.radar.rotation.y = f * 0.06;
  S.doorLeaf.rotation.y = -1.8 * (st.door ?? 0);
  // a falha de fase no casco (só monta na primeira vez que alguma cena pede)
  if ((st.ship.phase ?? 0) > 0 || (st.ship.decay ?? 0) > 0) {
    const ud = S.root.userData as { phase?: PhaseRec[] };
    if (!ud.phase) ud.phase = phaseInit(S.root);
    phaseApply(ud.phase, f, st.ship.phase ?? 0, st.ship.decay ?? 0);
  }
  const transp = st.ship.op < 0.999;
  W.shipMats.forEach((mm) => {
    const ms = mm as THREE.MeshStandardMaterial;
    if (ms.userData.baseT === undefined) ms.userData.baseT = ms.transparent;
    if (ms.userData.baseO === undefined) ms.userData.baseO = ms.opacity;
    const wantT = transp || ms.userData.baseT;
    if (ms.transparent !== wantT) {
      ms.transparent = wantT;
      ms.needsUpdate = true;
    }
    if (!ms.userData.scar) ms.opacity = transp ? st.ship.op * (ms.userData.baseO as number) : (ms.userData.baseO as number);
    if (ms.emissive && ms.userData.baseE === undefined) ms.userData.baseE = ms.emissive.clone();
    if (ms.emissive && ms.userData.baseE) ms.emissive.copy(ms.userData.baseE as THREE.Color).lerp(new THREE.Color("#5affd0"), st.ship.glow);
  });
  S.scars.forEach((o, k) => {
    const mm = o.material as THREE.MeshStandardMaterial;
    mm.userData.scar = true;
    mm.opacity = st.ship.scar[k] * st.ship.op;
  });
  S.tearMat.userData.scar = true;
  S.tearMat.opacity = st.ship.burn * 0.95 * st.ship.op;
  S.tearMat.emissiveIntensity = st.ship.burn * (0.5 + 0.3 * Math.sin(f / 3));
  (W.crack.material as THREE.MeshBasicMaterial).opacity = st.crack;
  const rm = W.ring.material as THREE.MeshBasicMaterial;
  rm.opacity = st.ring > 0 && st.ring < 1 ? (1 - st.ring) * 0.9 : 0;
  W.ring.scale.setScalar(20 + st.ring * 260);
  // partículas
  W.fire.forEach((s, i) => {
    const q = st.fire[i];
    s.visible = !!q;
    if (!q) return;
    s.position.set(...q.p);
    s.scale.setScalar(q.s);
    s.material.opacity = q.o;
  });
  W.smoke.forEach((s, i) => {
    const q = st.smoke[i];
    s.visible = !!q;
    if (!q) return;
    s.position.set(...q.p);
    s.scale.setScalar(q.s);
    s.material.opacity = q.o;
    s.material.color.setScalar(0.18 + 0.4 * (1 - q.dark));
  });
  W.tracers.forEach((t, i) => {
    const q = st.tracers[i];
    t.visible = !!q;
    if (!q) return;
    t.position.set(...q.a);
    t.lookAt(...q.b);
  });
  W.lights.forEach((l, i) => {
    const q = st.flashes[i];
    l.intensity = q ? 900 * q.k : 0;
    if (q) l.position.set(q.p[0], q.p[1] + 3, q.p[2] + 4);
  });
  W.fireLight.intensity = st.ship.burn * st.ship.op * (500 + 160 * Math.sin(f / 2.3));
  W.fireLight.position.set(...shipW([9, 9, 14]));
  // neve caindo com vento
  const sp = W.snow.geometry.attributes.position as THREE.BufferAttribute;
  const t = f / 30;
  for (let i = 0; i < W.N; i++) {
    const bx = W.snowBase[i * 3], by = W.snowBase[i * 3 + 1], bz = W.snowBase[i * 3 + 2];
    const x = ((bx + t * 3.2 + Math.sin(t * 0.8 + i) * 0.4 + 45) % 90 + 90) % 90 - 45;
    const y = ((by - t * 1.3) % 26 + 26) % 26;
    sp.setXYZ(i, x + st.cam.pos[0], y, bz);
  }
  sp.needsUpdate = true;
  if (extra) extra(W.root, f);
  // prévia: o canvas só redesenha quando o quadro muda (frameloop "demand"), não 60 vezes por segundo
  invalidate();
  return <primitive object={W.root} />;
};

// ------------------------------------------------------------------------------------------------ projeção para as camadas 2D
export const projector = (cam: BState["cam"]) => {
  const c = new THREE.PerspectiveCamera(cam.fov, 16 / 9, 0.3, 4000);
  c.position.set(...cam.pos);
  c.lookAt(...cam.tgt);
  c.updateMatrixWorld();
  c.updateProjectionMatrix();
  return (p: V) => {
    const v = new THREE.Vector3(...p);
    const inCam = v.clone().applyMatrix4(c.matrixWorldInverse);
    if (inCam.z > -0.3) return null;
    v.project(c);
    return { x: (v.x + 1) * 960, y: (1 - v.y) * 540, d: -inCam.z };
  };
};
export type Proj = ReturnType<typeof projector>;
export const Call3: React.FC<{ pr: Proj; f: number; pt: V; from: number; until?: number; text: string; sub?: string; col: string; dx: number; dy: number }> = ({ pr, f, pt, from, until = 1e9, text, sub, col, dx, dy }) => {
  if (f < from || f >= until) return null;
  const q = pr(pt);
  if (!q) return null;
  const o = P(f, from, 8) * (1 - P(f, until - 8, 8));
  const k = P(f, from, 12);
  const end = dx >= 0 ? "start" : "end";
  const lx = q.x + dx + (dx >= 0 ? 10 : -10);
  const ly = q.y + dy;
  return (
    <g opacity={o}>
      <circle cx={q.x} cy={q.y} r={10 + 3 * Math.sin(f / 6)} fill="none" stroke={col} strokeWidth={2} />
      <circle cx={q.x} cy={q.y} r={4} fill={col} />
      <line x1={q.x} y1={q.y} x2={q.x + dx * k} y2={q.y + dy * k} stroke={col} strokeWidth={1.6} />
      {text ? (
        <text x={lx} y={ly - 6} textAnchor={end} fill={col} fontFamily={MONO} fontSize={22} letterSpacing={4} opacity={k} style={{ paintOrder: "stroke", stroke: "rgba(0,0,0,0.85)", strokeWidth: 5 }}>
          {text}
        </text>
      ) : null}
      {sub ? (
        <text x={lx} y={ly + 22} textAnchor={end} fill="rgba(242,240,247,0.8)" fontFamily={MONO} fontSize={15} letterSpacing={2} opacity={k} style={{ paintOrder: "stroke", stroke: "rgba(0,0,0,0.85)", strokeWidth: 4 }}>
          {sub}
        </text>
      ) : null}
    </g>
  );
};
// céu noturno leve: gradiente + estrelas + aurora em gradientes (sem filtro de desfoque: não pesa no player)
const STARS = Array.from({ length: 140 }).map((_, i) => [rnd(i * 3 + 1) * 2400 - 240, rnd(i * 7 + 2), 0.6 + rnd(i * 11) * 1.4, 0.3 + 0.6 * rnd(i * 13)]);
export const Sky: React.FC<{ hy: number; shift: number; f: number }> = ({ hy, shift, f }) => {
  const pc = (hy / 1080) * 100;
  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, #02060c 0%, #081624 ${Math.max(2, pc - 45)}%, #172b3b ${pc - 14}%, #2c3e4c ${pc}%, #2c3e4c 100%)` }}>
      <div style={{ position: "absolute", left: -300, right: -300, top: 0, height: Math.max(0, hy), transform: `translateX(${-shift}px)`, willChange: "transform" }}>
        <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
          {STARS.map(([x, y, r, o], i) => <circle key={i} cx={x + 300} cy={y * Math.max(0, hy - 60)} r={r} fill="#fff" opacity={o * (0.75 + 0.25 * Math.sin(f / 9 + i))} />)}
        </svg>
        {[0, 1, 2].map((k) => (
          <div key={k} style={{ position: "absolute", left: `${8 + k * 26}%`, top: hy - 520 + k * 50 + 24 * Math.sin(f / 60 + k), width: `${48 - k * 6}%`, height: 300 - k * 40, borderRadius: "50%", background: `radial-gradient(ellipse at 50% 60%, rgba(90,255,180,${0.26 - k * 0.05}), rgba(60,200,255,0.06) 55%, rgba(60,200,255,0) 72%)`, transform: `rotate(${-8 + k * 9}deg) scaleY(${0.8 + 0.12 * Math.sin(f / 45 + k * 2)})` }} />
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------------------------------------ 1:06:06 o ataque
export type Ex = { p: V; t0: number; s: number };
export const fireOf = (f: number, ex: Ex[], out: BState) => {
  ex.forEach(({ p, t0, s }, n) => {
    const g = f - t0;
    if (g < 0 || g > 70) return;
    const k = g / 18;
    if (k < 1) {
      out.fire.push({ p, s: s * (3 + 9 * Math.sqrt(k)), o: 1 - k });
      out.fire.push({ p: [p[0], p[1] + s * 2 * k, p[2]], s: s * (2 + 6 * k), o: (1 - k) * 0.8 });
      if (g < 8) out.flashes.push({ p, k: (1 - g / 8) * Math.min(1.5, s) });
    }
    for (let j = 0; j < 3; j++) {
      const k2 = (g - 4 - j * 3) / 60;
      if (k2 < 0 || k2 > 1) continue;
      out.smoke.push({ p: [p[0] + (rnd(n * 7 + j) - 0.5) * s * 3, p[1] + k2 * s * 9 + j, p[2] + (rnd(n * 3 + j) - 0.5) * s * 2], s: s * (4 + 12 * k2), o: 0.55 * (1 - k2) * Math.min(1, (g - 4) / 6), dark: 1 });
    }
  });
};
export const HL9Barrage3D: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const lite = React.useContext(LiteCtx);
  const ctx = React.useContext(SfxCtx);
  const [cannonAt, explAt, artAt, airAt, surgeAt, fireAt, workAt, tearAt, collapseAt, deckAt, goneAt] = ats(p, ["cannonAt", "explAt", "artAt", "airAt", "surgeAt", "fireAt", "workAt", "tearAt", "collapseAt", "deckAt", "goneAt"]);
  const shake = f >= fireAt && f < goneAt + 10 ? 0.06 : 0;
  const sh = (i: number) => (shake ? (rnd(f * 3 + i) - 0.5) * shake : 0);
  // câmera: atrás da crista olhando as peças subirem → ergue o olhar para os aviões → abre para o navio
  const cam = {
    pos: kv(f, [[0, [-7, 2.9, -3]], [airAt - 20, [-2, 3.2, -4]], [surgeAt, [0, 4.4, -4]], [life, [1.5, 4.8, -6]]]).map((v, i) => v + sh(i)) as V,
    tgt: kv(f, [[0, [-9, 0.8, CREST_Z - 6]], [cannonAt + 30, [-3, 1.0, CREST_Z - 8]], [explAt + 18, [-1, 1.0, CREST_Z - 8]], [artAt + 30, [0, 1.6, CREST_Z - 8]], [airAt + 26, [4, 9, -70]], [surgeAt - 10, [SX, 10, SZ]], [life, [SX + 2, 9, SZ]]]),
    fov: 50,
  };
  const goneK = P(f, goneAt, 22);
  const flick = f >= surgeAt && f < surgeAt + 30 ? (rnd(Math.floor(f / 2)) > 0.6 ? 0.35 : 1) : f >= goneAt ? (rnd(Math.floor(f / 2) + 5) > 0.5 ? 0.25 : 1) * (1 - goneK) : 1;
  const hitT = (k: number, r: number) => fireAt + k * 7 + r * 40 + Math.round(rnd(k + r) * 6);
  const st: BState = {
    f,
    lite,
    cam,
    ship: {
      on: f >= surgeAt - 2 && f < goneAt + 24,
      op: P(f, surgeAt, 16) * flick,
      glow: f >= surgeAt && f < surgeAt + 40 ? (1 - (f - surgeAt) / 40) * 0.8 : f >= goneAt ? goneK * 0.8 : 0,
      collapse: P(f, collapseAt, 44),
      burn: P(f, tearAt, 30),
      scar: HITS.map((_, k) => P(f, hitT(k, 0), 6)),
    },
    guns: { up: 1, aim: shipW([0, 4, 0]), recoil: [0, 0, 0, 0] },
    stock: STOCK.map((_, k) => IO((f - explAt - k * 4) / 22)),
    truck: IO((f - artAt) / 24),
    mortar: IO((f - artAt - 8) / 24),
    planes: [],
    fire: [],
    smoke: [],
    tracers: [],
    flashes: [],
    ring: f >= surgeAt ? (f - surgeAt) / 30 : -1,
    crack: P(f, collapseAt + 8, 30),
  };
  (st as unknown as { gunsUp: number[] }).gunsUp = GUNS.map((_, k) => IO((f - cannonAt - k * 8) / 22));
  // o fogo dos canhões: traçantes até pontos reais do casco, clarão de boca, recuo, fumaça
  const muzzle = (k: number): V => {
    const [x, z] = GUNS[k];
    const d = new THREE.Vector3(SX - x, 0, SZ - z).normalize();
    return [x + d.x * 3.4, ridgeH(x, z) + 1.08 + 3.4 * Math.sin(0.24), z + d.z * 3.4];
  };
  if (f >= fireAt && f < goneAt) {
    GUNS.forEach((_, k) => {
      const ph = (f - fireAt + k * 5) % 12;
      const cyc = Math.floor((f - fireAt + k * 5) / 12);
      const m0 = muzzle(k);
      st.guns.recoil[k] = ph < 2 ? ph / 2 : Math.max(0, 1 - (ph - 2) / 8);
      if (ph < 3) st.fire.push({ p: m0, s: 1.6 - ph * 0.4, o: 1 });
      for (let j = 0; j < 2; j++) {
        const g2 = ph + j * 12;
        st.smoke.push({ p: [m0[0], m0[1] + g2 * 0.05, m0[2] - g2 * 0.1], s: 1.2 + g2 * 0.12, o: 0.35 * (1 - g2 / 24), dark: 0.3 });
      }
      if (ph < 9) {
        const tgt = shipW(HITS[(k + cyc) % HITS.length]);
        const u = ph / 9;
        const a: V = [m0[0] + (tgt[0] - m0[0]) * u, m0[1] + (tgt[1] - m0[1]) * u, m0[2] + (tgt[2] - m0[2]) * u];
        st.tracers.push({ a, b: tgt });
      }
    });
    // a artilharia improvisada: foguetes da picape e granadas dos morteiros em arco, com rastro
    const arc = (from: V, to: V, u: number, hgt: number): V => [from[0] + (to[0] - from[0]) * u, from[1] + (to[1] - from[1]) * u + Math.sin(u * Math.PI) * hgt, from[2] + (to[2] - from[2]) * u];
    const rack: V = [TRUCK[0] + 0.2, ridgeH(TRUCK[0], TRUCK[2]) + 2.2, TRUCK[2] - 1.2];
    const mort: V = [MORTAR[0], ridgeH(MORTAR[0], MORTAR[2]) + 1.2, MORTAR[2] - 0.6];
    [[rack, 24, 22, 16], [mort, 30, 28, 38]].forEach(([from, per, dur, hgt], n) => {
      for (let c = 0; c < 3; c++) {
        const g = f - fireAt - c * (per as number) - n * 9;
        const gg = ((g % (per as number) * 3) + (per as number) * 3) % ((per as number) * 3);
        if (g < 0 || gg > (dur as number)) continue;
        const to = shipW(HITS[(c * 2 + n + Math.floor(g / ((per as number) * 3))) % HITS.length]);
        const u = gg / (dur as number);
        const q = arc(from as V, to, u, hgt as number);
        st.fire.push({ p: q, s: 1.4, o: 1 });
        for (let j = 1; j < 9; j++) {
          const uj = Math.max(0, (gg - j * 1.5) / (dur as number));
          st.smoke.push({ p: arc(from as V, to, uj, hgt as number), s: 0.9 + j * 0.35, o: 0.4 * (1 - j / 9), dark: 0.2 });
        }
        if (gg < 3) st.fire.push({ p: from as V, s: 2.2, o: 1 - gg / 3 });
      }
    });
  }
  // explosões: no casco (no ritmo dos sons), o rasgo, a proa, os conveses
  const ex: Ex[] = [];
  if (f >= fireAt) HITS.forEach((h, k) => [0, 1, 2].forEach((r) => ex.push({ p: shipW(h), t0: hitT(k, r), s: 1.0 })));
  ex.push({ p: shipW([8, 3.6, halfAt(8, 3.6)]), t0: tearAt, s: 2.4 });
  ex.push({ p: shipW([PIV + 1, 3, halfAt(PIV, 3)]), t0: collapseAt + 6, s: 2.6 });
  [0, 1, 2, 3].forEach((k) => ex.push({ p: shipW([-24 + k * 9, deckY(-24 + k * 9) + 1.5, (k % 2 ? -3 : 3)]), t0: deckAt + k * 6, s: 1.8 }));
  if (f < goneAt + 30) fireOf(f, ex.filter((e) => f >= e.t0 - 1), st);
  // fogo na meia-nau rasgada + coluna de fumaça preta
  if (st.ship.burn > 0 && st.ship.on) {
    for (let k = 0; k < 14; k++) {
      const x = 2 + rnd(k) * 13, y = 2 + rnd(k * 3) * 5;
      const fl = 0.75 + 0.25 * Math.sin(f / 2.2 + k * 1.7);
      st.fire.push({ p: shipW([x, y, halfAt(x, y) + 0.6]), s: (1.8 + rnd(k * 5) * 2.4) * fl * st.ship.burn, o: 0.85 * st.ship.op });
    }
    for (let k = 0; k < 26; k++) {
      const u = ((f / 90 + k / 26) % 1);
      const x = 4 + rnd(k * 3) * 10;
      st.smoke.push({ p: shipW([x - u * 14, 6 + u * 34, halfAt(x, 4) * (1 - u) + 1]), s: 5 + u * 18, o: 0.6 * Math.sin(u * Math.PI) * st.ship.burn * st.ship.op, dark: 1 });
    }
  }
  // os aviões remendados: primeiro passam cruzando na frente (mal voam, fumaça, motor falhando); depois o bombardeio
  // por cima do navio — chegam sobre ele junto com as explosões do convés
  const planeAt = (k: number): BState["planes"][number] => {
    const A0 = airAt + k * 26, A1 = A0 + 175;
    const B0 = deckAt - 98 - k * 14, B1 = B0 + 200;
    let a: V, b: V, u: number;
    if (f >= A0 && f < A1) {
      u = (f - A0) / (A1 - A0);
      a = [-95, 15 - k * 3, -42 - k * 10];
      b = [105, 21 - k * 2, -78 - k * 8];
    } else if (f >= B0 && f < B1) {
      u = (f - B0) / (B1 - B0);
      a = [135, 48 + k * 6, -112 - k * 8];
      b = [-120, 42 + k * 4, -195 - k * 10];
    } else return null;
    const wob = Math.sin(u * 13 + k * 2) * 0.9 + (k === 1 ? Math.sin(u * 31) * 0.4 : 0);
    const pos: V = [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u + wob, a[2] + (b[2] - a[2]) * u];
    const dir: V = [b[0] - a[0], (b[1] - a[1]) + Math.cos(u * 13 + k * 2) * 12, b[2] - a[2]];
    return { pos, dir, roll: Math.sin(u * 7 + k) * 0.22 + (k === 1 ? 0.12 : 0) };
  };
  st.planes = [planeAt(0), planeAt(1)];
  st.planes.forEach((pl, k) => {
    if (!pl) return;
    // fumaça do motor: rastro de baforadas (o segundo, preto e falhando)
    const dl = Math.hypot(...pl.dir);
    for (let j = 1; j < 16; j++) {
      const miss = k === 1 && rnd(Math.floor((f - j * 2) / 5)) > 0.7;
      if (miss) continue;
      const back = j * 2.2;
      st.smoke.push({ p: [pl.pos[0] - (pl.dir[0] / dl) * back * 3, pl.pos[1] - 0.4 - (pl.dir[1] / dl) * back * 3 + j * 0.08, pl.pos[2] - (pl.dir[2] / dl) * back * 3], s: 1.2 + j * 0.45, o: 0.42 * (1 - j / 16), dark: k ? 0.95 : 0.55 });
    }
    if (k === 1 && rnd(Math.floor(f / 3) + 11) > 0.82) st.fire.push({ p: [pl.pos[0] + (pl.dir[0] / dl) * 3, pl.pos[1] - 0.3, pl.pos[2] + (pl.dir[2] / dl) * 3], s: 1.3, o: 0.9 });
  });
  // limita as partículas aos pools e os clarões às 4 luzes mais fortes
  st.fire = st.fire.slice(0, POOL_FIRE);
  st.smoke = st.smoke.slice(0, POOL_SMOKE);
  st.tracers = st.tracers.slice(0, 10);
  st.flashes = st.flashes.sort((a, b) => b.k - a.k).slice(0, 4);
  const pr = projector(cam);
  const hz = pr([cam.pos[0], 0, cam.pos[2] - 3000]);
  const inv: [number, string][] = [[cannonAt, "CANHÕES RECUPERADOS · 4"], [explAt, "EXPLOSIVOS"], [artAt, "ARTILHARIA IMPROVISADA"], [airAt, "AERONAVES · MAL VOAM"]];
  const surgeFlash = f >= surgeAt && f < surgeAt + 14 ? 1 - (f - surgeAt) / 14 : 0;
  const goneFlash = f >= goneAt && f < goneAt + 18 ? 1 - (f - goneAt) / 18 : 0;
  const yaw = Math.atan2(cam.tgt[0] - cam.pos[0], -(cam.tgt[2] - cam.pos[2]));
  const eye: Eye = { x: cam.pos[0], y: -cam.pos[2], z: cam.pos[1], yaw, pitch: 0, F: 1000 };
  return (
    <AbsoluteFill style={{ background: "#050a10", overflow: "hidden" }}>
      <Sky hy={hz ? hz.y : 540} shift={yaw * 700} f={f} />
      {ctx.mode === "collect" ? null : (
        <ThreeCanvas frameloop="demand" width={1920} height={1080} style={{ position: "absolute", inset: 0 }} dpr={lite ? 0.75 : 1} shadows gl={{ antialias: true, alpha: true }} camera={{ fov: 50, position: [0, 3, 0], near: 0.3, far: 4000 }}>
          <World st={st} />
        </ThreeCanvas>
      )}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {st.ship.on ? <Call3 pr={pr} f={f} pt={shipW([-30, 22, 0])} from={surgeAt + 8} until={fireAt + 10} text="O BOREALIS SURGE SOBRE O GELO" col={CYC} dx={260} dy={-110} /> : null}
        {st.ship.on && f >= collapseAt ? <Call3 pr={pr} f={f} pt={shipW([44, 8 - st.ship.collapse * 12, 0])} from={collapseAt + 10} until={goneAt} text="A PROA INTEIRA DESABA" col={RED} dx={160} dy={-160} /> : null}
        {f >= workAt && f < tearAt ? <text x={960} y={250} textAnchor="middle" fill={AMB} fontFamily={MONO} fontSize={22} letterSpacing={6} opacity={P(f, workAt, 8)} style={{ paintOrder: "stroke", stroke: "rgba(0,0,0,0.8)", strokeWidth: 4 }}>POR ALGUNS MINUTOS · PARECE FUNCIONAR</text> : null}
        {f >= goneAt + 14 ? <text x={960} y={250} textAnchor="middle" fill={TXT} fontFamily={MONO} fontSize={24} letterSpacing={8} opacity={P(f, goneAt + 14, 8)} style={{ paintOrder: "stroke", stroke: "rgba(0,0,0,0.8)", strokeWidth: 4 }}>O BOREALIS DESAPARECE</text> : null}
      </svg>
      {/* o inventário: cada linha entra junto com a peça que sobe */}
      <div style={{ position: "absolute", left: 90, top: 120, width: 480, padding: "14px 18px", borderRadius: 10, background: "rgba(14,10,4,0.82)", border: `1.5px solid ${AMB}`, fontFamily: MONO, opacity: P(f, 4, 10) * (1 - P(f, surgeAt + 20, 14)) }}>
        <div style={{ fontSize: 15, letterSpacing: 5, color: AMB }}>A RESISTÊNCIA · TUDO O QUE FICA DE PÉ</div>
        {inv.filter(([t0]) => f >= t0).map(([t0, txt]) => (
          <div key={txt} style={{ display: "flex", gap: 10, marginTop: 10, fontSize: 19, letterSpacing: 2, color: TXT, opacity: P(f, t0, 8) }}>
            <span style={{ color: GREEN }}>✓</span>
            {txt}
          </div>
        ))}
      </div>
      {surgeFlash > 0 ? <AbsoluteFill style={{ background: `rgba(180,255,220,${surgeFlash * 0.45})` }} /> : null}
      {goneFlash > 0 ? <AbsoluteFill style={{ background: `rgba(255,240,220,${goneFlash * 0.55})` }} /> : null}
      <Hud f={f} yaw={yaw} eye={eye} blips={[]} msg={f < surgeAt ? "A PRÓXIMA MANIFESTAÇÃO" : f < fireAt ? "TODOS AO MESMO TEMPO" : undefined} msgCol={AMB} />
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};
export const IO = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

// ------------------------------------------------------------------------------------------------ 1:06:45 o silêncio → o Borealis volta inteiro
export const HL9Silent3D: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const lite = React.useContext(LiteCtx);
  const ctx = React.useContext(SfxCtx);
  const [d1At, d2At, d3At, eliAt, beepAt, backAt, marksAt] = ats(p, ["d1At", "d2At", "d3At", "eliAt", "beepAt", "backAt", "marksAt"]);
  const day = f >= d3At ? 3 : f >= d2At ? 2 : f >= d1At ? 1 : 0;
  const pov = f >= backAt;
  // a mesma câmera da crista no fim do ataque (a crista vazia agora)
  const cam = { pos: [1.5, 4.8, -6] as V, tgt: kv(f, [[backAt, [SX + 2, 9, SZ]], [marksAt, [SX - 2, 6, SZ]], [life, [SX - 4, 6, SZ]]]), fov: kk(f, [[backAt, 50], [marksAt - 6, 50], [marksAt + 24, 30], [life, 28]]) };
  const st: BState = {
    f,
    lite,
    cam,
    ship: { on: true, op: P(f, backAt, 10) * (f < backAt + 24 ? (rnd(Math.floor(f / 2) + 3) > 0.55 ? 0.4 : 1) : 1), glow: f < backAt + 30 ? (1 - P(f, backAt, 30)) * 0.7 : 0, collapse: 0, burn: 0, scar: HITS.map(() => 0) },
    guns: { up: 0, aim: shipW([0, 4, 0]), recoil: [0, 0, 0, 0] },
    stock: STOCK.map(() => 0),
    truck: 0,
    mortar: 0,
    planes: [null, null],
    fire: [],
    smoke: [],
    tracers: [],
    flashes: [],
    ring: f >= backAt ? (f - backAt) / 30 : -1,
    crack: 0,
  };
  (st as unknown as { gunsUp: number[] }).gunsUp = GUNS.map(() => 0);
  st.ridge = false;
  const pr = projector(cam);
  const hz = pr([cam.pos[0], 0, cam.pos[2] - 3000]);
  const flash = f >= backAt && f < backAt + 14 ? 1 - (f - backAt) / 14 : 0;
  const yaw = Math.atan2(cam.tgt[0] - cam.pos[0], -(cam.tgt[2] - cam.pos[2]));
  return (
    <AbsoluteFill style={{ background: "#050403", overflow: "hidden" }}>
      {!pov ? (
        <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, #14110c 0%, #050404 80%)" }}>
          {/* o calendário na parede */}
          <div style={{ position: "absolute", left: 230, top: 260, width: 380, height: 460, background: "#efe6cf", boxShadow: "0 20px 40px rgba(0,0,0,0.6)", fontFamily: "'Courier New', monospace", color: "#2a2418" }}>
            <div style={{ height: 80, background: "#8a2a1e", color: "#f4ece0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, letterSpacing: 6 }}>SEM SINAL</div>
            <div style={{ textAlign: "center", fontSize: 220, fontWeight: 700, marginTop: 30 }}>{day || "–"}</div>
            <div style={{ textAlign: "center", fontSize: 30, letterSpacing: 8 }}>{day ? (day === 1 ? "DIA" : "DIAS") : ""}</div>
          </div>
          {/* o osciloscópio do Kleiner */}
          <div style={{ position: "absolute", left: 760, top: 240, width: 940, height: 500, borderRadius: 16, background: "#04100a", border: "6px solid #2a2b24" }}>
            <svg width={928} height={488} style={{ position: "absolute", inset: 0 }}>
              {Array.from({ length: 9 }).map((_, i) => <line key={i} x1={0} x2={928} y1={i * 61} y2={i * 61} stroke="rgba(125,255,154,0.08)" />)}
              <polyline
                points={Array.from({ length: 160 }).map((_, i) => {
                  const x = i * 5.8;
                  const ph = ((x - (f - beepAt) * 12) % 300 + 300) % 300;
                  const spike = f >= beepAt && ph < 18 ? Math.sin((ph / 18) * Math.PI * 2) * 150 : 0;
                  return `${x},${244 - spike + (rnd(i + Math.floor(f / 3)) - 0.5) * 3}`;
                }).join(" ")}
                fill="none"
                stroke="#7dff9a"
                strokeWidth={3}
              />
              <text x={20} y={40} fill="#7dff9a" fontFamily="'Courier New', monospace" fontSize={20} letterSpacing={4}>{f >= beepAt ? "SINAL DO BOREALIS · DETECTADO" : "SINAL DO BOREALIS · NENHUM"}</text>
              <circle cx={890} cy={36} r={12} fill={f >= beepAt && Math.floor(f / 5) % 2 ? "#ff5a3a" : "#3a1a10"} />
            </svg>
          </div>
          {f >= eliAt ? (
            <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: P(f, eliAt, 10) }}>
              <FlagBadge cx={1480} by={980} k={1.1} label="ELI" col={AMB} f={f} sub="TALVEZ TENHA ACABADO" />
            </svg>
          ) : null}
          <div style={{ position: "absolute", left: 0, right: 0, top: 120, textAlign: "center", fontFamily: MONO, fontSize: 22, letterSpacing: 10, color: CREAM, opacity: P(f, 2, 10) }}>SILÊNCIO</div>
        </AbsoluteFill>
      ) : (
        <AbsoluteFill>
          <Sky hy={hz ? hz.y : 540} shift={yaw * 700} f={f} />
          {ctx.mode === "collect" ? null : (
            <ThreeCanvas frameloop="demand" width={1920} height={1080} style={{ position: "absolute", inset: 0 }} dpr={lite ? 0.75 : 1} shadows gl={{ antialias: true, alpha: true }} camera={{ fov: 50, position: [0, 3, 0], near: 0.3, far: 4000 }}>
              <World st={st} />
            </ThreeCanvas>
          )}
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            <Call3 pr={pr} f={f} pt={shipW([-30, 22, 0])} from={backAt + 8} until={life} text="O BOREALIS REAPARECE · INTEIRO" col={CYC} dx={240} dy={-120} />
            {f >= marksAt ? OLD.map((h, k) => <Call3 key={k} pr={pr} f={f} pt={shipW(h)} from={marksAt + k * 5} until={life} text={k === 0 ? "AS MESMAS MARCAS" : ""} sub={k === 0 ? "DE ANTES DO ATAQUE" : undefined} col={AMB} dx={k === 0 ? -160 : k === 1 ? -60 : 60} dy={k === 0 ? 150 : 130} />) : null}
            {f >= marksAt + 30 ? <text x={960} y={960} textAnchor="middle" fill={CYC} fontFamily={MONO} fontSize={20} letterSpacing={6} opacity={P(f, marksAt + 30, 10)} style={{ paintOrder: "stroke", stroke: "rgba(0,0,0,0.85)", strokeWidth: 4 }}>NENHUM DANO DO ATAQUE</text> : null}
          </svg>
          {flash > 0 ? <AbsoluteFill style={{ background: `rgba(180,255,220,${flash * 0.6})` }} /> : null}
        </AbsoluteFill>
      )}
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life, 6), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};
