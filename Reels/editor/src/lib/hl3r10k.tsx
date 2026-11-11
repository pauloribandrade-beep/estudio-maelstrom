// =================================================================================================
// HL3 · kit 3D de interiores do Borealis (three.js), 11/10/2026.
// Texturas de chapa pintada, grade de piso, revestimento Combine; o Advisor em 3D (o mesmo desenho aprovado do 2D: corpo
// de larva claro com malha hexagonal, faixas escuras, máscara, braços mecânicos com garras); crachás 3D (foto + nome numa
// plaquinha sempre virada para a câmera, com haste até o chão) — ficam ATRÁS das coisas quando estão atrás (profundidade
// certa), ao contrário dos crachás desenhados por cima da imagem.
// =================================================================================================
import React, { useMemo } from "react";
import { staticFile } from "remotion";
import { useLoader, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { rnd } from "./hl3";
import { canvasTex, V } from "./hl3r9s";
import { renderToStaticMarkup } from "react-dom/server.browser";
import { AdvisorArt } from "./hl3rx";

export type K = Record<string, THREE.Material>;
const S = (color: string, rough = 0.7, metal = 0.2, extra: THREE.MeshStandardMaterialParameters = {}) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, ...extra });
export const M = (g: THREE.BufferGeometry, m: THREE.Material, p: V = [0, 0, 0], r: V = [0, 0, 0], sh = true) => {
  const o = new THREE.Mesh(g, m);
  o.position.set(...p);
  o.rotation.set(...r);
  o.castShadow = sh;
  o.receiveShadow = sh;
  return o;
};
export const B = (w: number, h: number, d: number, m: THREE.Material, p: V, r: V = [0, 0, 0], sh = true) => M(new THREE.BoxGeometry(w, h, d), m, p, r, sh);
export const Cyl = (r0: number, r1: number, h: number, m: THREE.Material, p: V, r: V = [0, 0, 0], seg = 16) => M(new THREE.CylinderGeometry(r0, r1, h, seg), m, p, r);
export const rod = (a: V, b: V, r: number, m: THREE.Material, seg = 8) => {
  const A = new THREE.Vector3(...a), Bv = new THREE.Vector3(...b);
  const o = M(new THREE.CylinderGeometry(r, r, A.distanceTo(Bv), seg), m);
  o.position.copy(A.clone().add(Bv).multiplyScalar(0.5));
  o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), Bv.clone().sub(A).normalize());
  return o;
};

// ------------------------------------------------------------------------------------------------ texturas
const rep = (t: THREE.Texture, x: number, y: number) => {
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(x, y);
  return t;
};
// chapa pintada com painéis, rebites e sujeira embaixo
export const panelTex = (base: string, line = "rgba(0,0,0,0.45)", rx = 1, ry = 1) =>
  rep(
    canvasTex(512, 512, (c) => {
      c.fillStyle = base;
      c.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 260; i++) {
        c.fillStyle = rnd(i) > 0.5 ? "rgba(255,255,255,0.025)" : "rgba(0,0,0,0.05)";
        c.fillRect(rnd(i * 3) * 512, rnd(i * 5) * 512, 6 + rnd(i * 7) * 60, 2 + rnd(i * 11) * 30);
      }
      const g = c.createLinearGradient(0, 300, 0, 512);
      g.addColorStop(0, "rgba(30,24,18,0)");
      g.addColorStop(1, "rgba(30,24,18,0.35)");
      c.fillStyle = g;
      c.fillRect(0, 0, 512, 512);
      c.strokeStyle = line;
      c.lineWidth = 3;
      [0, 256].forEach((x) => c.strokeRect(x + 2, 2, 252, 508));
      c.strokeRect(2, 170, 508, 2);
      c.fillStyle = "rgba(0,0,0,0.5)";
      for (const x of [14, 242, 270, 498]) for (let y = 16; y < 512; y += 48) c.fillRect(x - 2, y - 2, 4, 4);
      // escorrido de ferrugem
      for (let i = 0; i < 6; i++) {
        const x = 30 + rnd(i * 13) * 450;
        const gg = c.createLinearGradient(0, 172, 0, 172 + 80 + rnd(i) * 120);
        gg.addColorStop(0, "rgba(110,60,30,0.35)");
        gg.addColorStop(1, "rgba(110,60,30,0)");
        c.fillStyle = gg;
        c.fillRect(x, 172, 3 + rnd(i * 3) * 4, 200);
      }
    }),
    rx,
    ry,
  );
export const grateTex = (rx = 1, ry = 1) =>
  rep(
    canvasTex(256, 256, (c) => {
      c.fillStyle = "#2a2c2e";
      c.fillRect(0, 0, 256, 256);
      for (let y = 0; y < 256; y += 16)
        for (let x = 0; x < 256; x += 16) {
          c.fillStyle = (x + y) % 32 ? "#3a3d40" : "#34373a";
          c.save();
          c.translate(x + 8, y + 8);
          c.rotate(((x + y) / 16) % 2 ? 0.6 : -0.6);
          c.fillRect(-6, -1.6, 12, 3.2);
          c.restore();
        }
    }),
    rx,
    ry,
  );
export const combineTex = (rx = 1, ry = 1) =>
  rep(
    canvasTex(512, 512, (c) => {
      c.fillStyle = "#1f262d";
      c.fillRect(0, 0, 512, 512);
      c.strokeStyle = "rgba(0,0,0,0.6)";
      c.lineWidth = 4;
      c.beginPath();
      c.moveTo(0, 120);
      c.lineTo(180, 120);
      c.lineTo(230, 70);
      c.lineTo(512, 70);
      c.moveTo(0, 380);
      c.lineTo(300, 380);
      c.lineTo(350, 430);
      c.lineTo(512, 430);
      c.moveTo(256, 120);
      c.lineTo(256, 380);
      c.stroke();
      c.strokeStyle = "rgba(160,200,220,0.08)";
      c.lineWidth = 2;
      c.stroke();
      for (let i = 0; i < 200; i++) {
        c.fillStyle = "rgba(255,255,255,0.02)";
        c.fillRect(rnd(i * 3) * 512, rnd(i * 5) * 512, 20 + rnd(i) * 80, 2);
      }
    }),
    rx,
    ry,
  );
export const woodTex = (rx = 1, ry = 1) =>
  rep(
    canvasTex(256, 512, (c) => {
      for (let x = 0; x < 256; x += 32) {
        c.fillStyle = `rgb(${120 + rnd(x) * 20},${84 + rnd(x * 3) * 14},${52 + rnd(x * 5) * 10})`;
        c.fillRect(x, 0, 32, 512);
        c.fillStyle = "rgba(40,24,10,0.5)";
        c.fillRect(x, 0, 2, 512);
        for (let k = 0; k < 14; k++) {
          c.fillStyle = "rgba(60,36,16,0.18)";
          c.fillRect(x + 4 + rnd(x + k) * 24, rnd(k * 7 + x) * 512, 1.5, 40 + rnd(k) * 100);
        }
      }
    }),
    rx,
    ry,
  );
export const carpetTex = (rx = 1, ry = 1) =>
  rep(
    canvasTex(256, 256, (c) => {
      c.fillStyle = "#6d5a44";
      c.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 3000; i++) {
        c.fillStyle = rnd(i) > 0.5 ? "rgba(255,240,210,0.05)" : "rgba(0,0,0,0.07)";
        c.fillRect(rnd(i * 3) * 256, rnd(i * 7) * 256, 2, 2);
      }
    }),
    rx,
    ry,
  );
export const tileTex = (rx = 1, ry = 1) =>
  rep(
    canvasTex(256, 256, (c) => {
      c.fillStyle = "#d8d3c4";
      c.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 900; i++) {
        c.fillStyle = "rgba(0,0,0,0.06)";
        c.fillRect(rnd(i * 3) * 256, rnd(i * 5) * 256, 2, 2);
      }
      c.strokeStyle = "#9a958a";
      c.lineWidth = 3;
      c.strokeRect(0, 0, 256, 256);
    }),
    rx,
    ry,
  );
// faixa amarela/preta de aviso
export const hazardTex = (rx = 1) =>
  rep(
    canvasTex(256, 64, (c) => {
      c.fillStyle = "#d8a42a";
      c.fillRect(0, 0, 256, 64);
      c.fillStyle = "#1a1a1a";
      for (let x = -64; x < 320; x += 48) {
        c.beginPath();
        c.moveTo(x, 64);
        c.lineTo(x + 24, 64);
        c.lineTo(x + 56, 0);
        c.lineTo(x + 32, 0);
        c.fill();
      }
    }),
    rx,
    1,
  );
// tela Combine (redesenhada a cada quadro quando é a principal)
export const drawCombineScreen = (c: CanvasRenderingContext2D, w: number, h: number, f: number, seed: number, alert = false) => {
  c.fillStyle = alert ? "#2a0806" : "#06202c";
  c.fillRect(0, 0, w, h);
  c.strokeStyle = alert ? "rgba(255,90,70,0.15)" : "rgba(120,230,255,0.12)";
  for (let x = 0; x < w; x += 24) {
    c.beginPath();
    c.moveTo(x, 0);
    c.lineTo(x, h);
    c.stroke();
  }
  const col = alert ? "#ff6a50" : "#8ff0ff";
  c.fillStyle = col;
  c.font = `${Math.round(h / 16)}px monospace`;
  for (let i = 0; i < 9; i++) {
    const L = 4 + Math.floor(rnd(seed * 7 + i + Math.floor(f / 6)) * 16);
    c.globalAlpha = 0.5 + 0.5 * rnd(i + seed);
    c.fillRect(w * 0.06, h * (0.12 + i * 0.075), (w * 0.5 * L) / 20, h * 0.03);
  }
  c.globalAlpha = 1;
  // radar girando
  const cx = w * 0.78, cy = h * 0.42, R = h * 0.26;
  c.strokeStyle = col;
  c.lineWidth = 2;
  c.beginPath();
  c.arc(cx, cy, R, 0, Math.PI * 2);
  c.stroke();
  c.beginPath();
  c.arc(cx, cy, R * 0.55, 0, Math.PI * 2);
  c.stroke();
  const a = f / 12 + seed;
  c.beginPath();
  c.moveTo(cx, cy);
  c.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
  c.stroke();
  // barra de progresso
  c.strokeRect(w * 0.06, h * 0.86, w * 0.88, h * 0.06);
  c.fillRect(w * 0.06, h * 0.86, w * 0.88 * ((0.4 + 0.5 * rnd(seed)) % 1), h * 0.06);
};
export const liveScreen = (w: number, h: number, seed: number) => {
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  const ctx = cv.getContext("2d")!;
  let last = -1;
  const draw = (f: number, alert = false, custom?: (c: CanvasRenderingContext2D, w: number, h: number) => void) => {
    const key = f * 2 + (alert ? 1 : 0);
    if (key === last && !custom) return;
    last = key;
    if (custom) custom(ctx, w, h);
    else drawCombineScreen(ctx, w, h, f, seed, alert);
    t.needsUpdate = true;
  };
  return { tex: t, draw };
};

// ------------------------------------------------------------------------------------------------ mobília
// console Combine: pedestal sextavado, mesa inclinada com teclas acesas, tela alta inclinada para trás, aletas
export const combineConsole = (k: K, screen: THREE.Texture, big = 1) => {
  const g = new THREE.Group();
  g.add(Cyl(0.42 * big, 0.5 * big, 0.85, k.cmb, [0, 0.425, 0], [0, 0, 0], 6));
  g.add(B(1.9 * big, 0.1, 0.75, k.cmbDark, [0, 0.95, 0.05], [-0.35, 0, 0]));
  for (let i = 0; i < 6; i++) g.add(B(0.2 * big, 0.03, 0.1, i % 3 ? k.keyCyan : k.keyAmb, [-0.75 * big + i * 0.3 * big, 1.02, 0.12], [-0.35, 0, 0], false));
  const scr = M(new THREE.PlaneGeometry(1.75 * big, 1.25 * big), new THREE.MeshBasicMaterial({ map: screen, toneMapped: false }), [0, 1.85 * big, -0.32], [-0.22, 0, 0], false);
  g.add(scr);
  g.add(B(1.95 * big, 1.45 * big, 0.08, k.cmbDark, [0, 1.85 * big, -0.37], [-0.22, 0, 0]));
  [-1, 1].forEach((s) => g.add(B(0.1, 1.6 * big, 0.5, k.cmb, [s * 1.02 * big, 1.75 * big, -0.25], [-0.22, 0, 0])));
  g.add(B(2.1 * big, 0.1, 0.6, k.cmb, [0, 2.6 * big, -0.5], [0.3, 0, 0]));
  return g;
};
// caixote fechado (todas as faces) com tábuas e cintas
export const crate = (k: K, s = 1) => {
  const g = new THREE.Group();
  g.add(B(s, s * 0.9, s, k.crate, [0, s * 0.45, 0]));
  for (const y of [0.12, 0.78]) g.add(B(s * 1.02, s * 0.07, s * 1.02, k.strap, [0, s * y, 0]));
  return g;
};
// barricada Combine (placas angulares com faixa de luz)
export const combineBarrier = (k: K) => {
  const g = new THREE.Group();
  const sh = new THREE.Shape();
  sh.moveTo(-1.1, 0);
  sh.lineTo(1.1, 0);
  sh.lineTo(0.9, 1.15);
  sh.lineTo(0.2, 1.3);
  sh.lineTo(-0.9, 1.15);
  sh.closePath();
  g.add(M(new THREE.ExtrudeGeometry(sh, { depth: 0.18, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 1 }), k.cmb, [0, 0, -0.09]));
  g.add(B(1.4, 0.05, 0.2, k.lightCyan, [0, 0.95, 0.06], [0, 0, 0], false));
  [-0.8, 0.8].forEach((x) => g.add(B(0.18, 0.12, 0.7, k.cmbDark, [x, 0.06, 0])));
  return g;
};
// luminária de teto (gaiola + tubo aceso)
export const lamp = (k: K, warm = false) => {
  const g = new THREE.Group();
  g.add(B(1.3, 0.08, 0.3, k.cmbDark, [0, 0, 0]));
  g.add(Cyl(0.05, 0.05, 1.2, warm ? k.lightWarm : k.lightCold, [0, -0.07, 0], [0, 0, Math.PI / 2], 8));
  return g;
};

// ------------------------------------------------------------------------------------------------ o Advisor 3D
// 11/10 v2 (pedido dele: estava pixelado/tosco): textura 1024 com malha hexagonal fina e manchas, corpo liso (perfil
// com mais pontos, 64 lados, levemente curvado), gomos com dobra de pele, máscara metálica com aro e lente, cabos
// saindo da nuca, braços em três segmentos com articulações e garras curvas.
const hexTex = () => {
  const t = canvasTex(1024, 1024, (c) => {
    const g = c.createLinearGradient(0, 0, 0, 1024);
    g.addColorStop(0, "#ddd5bd");
    g.addColorStop(0.6, "#bdb59c");
    g.addColorStop(1, "#8f8874");
    c.fillStyle = g;
    c.fillRect(0, 0, 1024, 1024);
    for (let i = 0; i < 160; i++) {
      const x = rnd(i * 3) * 1024, y = rnd(i * 5) * 1024, r = 20 + rnd(i * 7) * 90;
      const gg = c.createRadialGradient(x, y, 0, x, y, r);
      gg.addColorStop(0, rnd(i) > 0.5 ? "rgba(120,96,80,0.10)" : "rgba(255,250,235,0.10)");
      gg.addColorStop(1, "rgba(0,0,0,0)");
      c.fillStyle = gg;
      c.fillRect(x - r, y - r, r * 2, r * 2);
    }
    c.strokeStyle = "rgba(70,62,48,0.28)";
    c.lineWidth = 1.6;
    for (let y = 0; y < 1060; y += 26)
      for (let x = 0; x < 1060; x += 30) {
        const ox = (Math.round(y / 26) % 2) * 15;
        c.beginPath();
        for (let k = 0; k < 6; k++) {
          const a = (k / 6) * Math.PI * 2;
          const px = x + ox + Math.cos(a) * 14, py = y + Math.sin(a) * 14;
          k ? c.lineTo(px, py) : c.moveTo(px, py);
        }
        c.closePath();
        c.stroke();
      }
  });
  t.anisotropy = 16;
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  return t;
};
export const buildAdvisor = () => {
  const g = new THREE.Group();
  const skin = new THREE.MeshPhysicalMaterial({ map: hexTex(), color: "#c4b9a0", roughness: 0.48, metalness: 0.0, clearcoat: 0.35, clearcoatRoughness: 0.5, sheen: 0.4, sheenColor: new THREE.Color("#fff1d8") });
  // perfil liso do corpo (larva), 64 lados; curvado de leve (a cauda desce)
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= 40; i++) {
    const u = i / 40;
    const y = -1.75 + u * 3.5;
    const r = 0.8 * Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.04)), 0.62) * (1 - 0.18 * Math.max(0, 0.3 - u) * 3) + 0.01;
    pts.push(new THREE.Vector2(Math.max(0.01, r), y));
  }
  const geo = new THREE.LatheGeometry(pts, 64);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    pos.setX(i, pos.getX(i));
    pos.setZ(i, pos.getZ(i) + 0.12 * Math.pow(Math.max(0, -y - 0.2) / 1.5, 2) * 2);
  }
  geo.computeVertexNormals();
  const body = M(geo, skin, [0, 0, 0], [Math.PI / 2, 0, 0]);
  body.scale.set(1, 1, 0.88);
  g.add(body);
  // gomos: dobra escura + borda clara
  const band = S("#3b3830", 0.55, 0.25);
  const lip = new THREE.MeshPhysicalMaterial({ color: "#d9d0b6", roughness: 0.5, clearcoat: 0.3 });
  [-1.05, -0.35, 0.35].forEach((z) => {
    const r = 0.8 * Math.pow(Math.sin(Math.PI * ((z + 1.75) / 3.5) * 1.04), 0.62) * 0.9;
    const t1 = M(new THREE.TorusGeometry(r, 0.05, 12, 64), band, [0, 0, z]);
    t1.scale.set(1, 0.88, 1);
    const t2 = M(new THREE.TorusGeometry(r * 1.01, 0.022, 8, 64), lip, [0, 0, z + 0.06]);
    t2.scale.set(1, 0.88, 1);
    g.add(t1, t2);
  });
  // a máscara: casca metálica com aro, a lente
  const maskM = new THREE.MeshPhysicalMaterial({ color: "#2a2c2c", roughness: 0.3, metalness: 0.85, clearcoat: 0.6 });
  const mask = M(new THREE.SphereGeometry(0.62, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2.3), maskM, [0, 0.02, 1.1], [Math.PI / 2, 0, 0]);
  mask.scale.set(1, 0.62, 0.86);
  g.add(mask);
  const rim = M(new THREE.TorusGeometry(0.6, 0.035, 10, 64), S("#5a5c5a", 0.35, 0.9), [0, 0.02, 1.12]);
  rim.scale.set(1, 0.86, 1);
  g.add(rim);
  g.add(M(new THREE.CylinderGeometry(0.13, 0.15, 0.08, 32), S("#151616", 0.3, 0.9), [0, 0.12, 1.6], [Math.PI / 2, 0, 0], false));
  g.add(M(new THREE.CircleGeometry(0.09, 32), new THREE.MeshBasicMaterial({ color: "#e4c8ff", toneMapped: false }), [0, 0.12, 1.645], [0, 0, 0], false));
  // cabos saindo da nuca para trás
  const cableM = S("#1d1e1e", 0.5, 0.5);
  for (let i = 0; i < 4; i++) {
    const a = -0.6 + i * 0.4;
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(Math.sin(a) * 0.4, 0.55, 0.7), new THREE.Vector3(Math.sin(a) * 0.55, 0.8, 0.0), new THREE.Vector3(Math.sin(a) * 0.5, 0.7, -0.9), new THREE.Vector3(Math.sin(a) * 0.3, 0.45, -1.5)]);
    g.add(M(new THREE.TubeGeometry(curve, 24, 0.035, 8, false), cableM, [0, 0, 0], [0, 0, 0], false));
  }
  // braços: ombro → cotovelo → punho, articulações e três garras curvas
  const metal = new THREE.MeshPhysicalMaterial({ color: "#4f524f", roughness: 0.35, metalness: 0.85, clearcoat: 0.4 });
  const dark = S("#1b1c1b", 0.45, 0.7);
  const arms: THREE.Group[] = [];
  [[-1, 0.55], [1, 0.55], [-1, -0.35], [1, -0.35]].forEach(([s, z], i) => {
    const arm = new THREE.Group();
    arm.position.set(s * 0.6, -0.25, z);
    const sh: V = [0, 0, 0], el: V = [s * 0.5, -0.45, 0.3], wr: V = [s * 0.32, -1.05, 0.72];
    arm.add(rod(sh, el, 0.055, metal, 16), rod(el, wr, 0.042, metal, 16));
    arm.add(M(new THREE.SphereGeometry(0.085, 20, 14), dark, sh), M(new THREE.SphereGeometry(0.075, 20, 14), dark, el), M(new THREE.SphereGeometry(0.06, 16, 12), dark, wr));
    [-0.5, 0, 0.5].forEach((d) => {
      const tip = new THREE.Vector3(wr[0] + Math.sin(d) * 0.16, wr[1] - 0.22, wr[2] + 0.18);
      const mid = new THREE.Vector3(wr[0] + Math.sin(d) * 0.1, wr[1] - 0.1, wr[2] + 0.2);
      arm.add(M(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(new THREE.Vector3(...wr), mid, tip), 10, 0.016, 6, false), dark, [0, 0, 0], [0, 0, 0], false));
    });
    arm.name = "arm" + i;
    arms.push(arm);
    g.add(arm);
  });
  const glow = new THREE.PointLight("#b080ff", 0, 6, 1.6);
  glow.position.set(0, -0.9, 0.2);
  g.add(glow);
  return { g, arms, glow, skin };
};


// ------------------------------------------------------------------------------------------------ o Advisor como placa
// 11/10 v3 (pedido dele: o Advisor 3D ficou feio, movimento tosco): o MESMO desenho 2D aprovado (AdvisorArt) numa placa
// dentro da cena, sempre virada para a câmera — fica atrás das coisas quando está atrás; só flutua, sem braços mexendo.
export const ADVISOR_SVG = (() => {
  const g = renderToStaticMarkup(React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: 1100, height: 900, viewBox: "-230 -250 620 520" }, React.createElement(AdvisorArt, { x: 0, y: 0, w: 520, f: 0, lit: 0.75, id: "bb" })));
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(g);
})();
export const buildAdvisorBoard = (img: HTMLImageElement) => {
  const g = new THREE.Group();
  const tex = new THREE.Texture(img);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  const board = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 3.52), new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.04, toneMapped: false }));
  board.userData.billboard = true;
  g.add(board);
  const glow = new THREE.PointLight("#b080ff", 0, 6, 1.6);
  glow.position.set(0, -1.2, 0);
  g.add(glow);
  return { g, arms: [] as THREE.Group[], glow, board };
};
// vira todas as placas marcadas para a câmera (e espelha quando userData.flip)
export const faceBoards = (root: THREE.Object3D, cam: THREE.Camera) => {
  root.traverse((o) => {
    if (!o.userData.billboard || !o.parent) return;
    const pq = o.parent.getWorldQuaternion(new THREE.Quaternion()).invert();
    o.quaternion.copy(pq.multiply(cam.quaternion));
    o.scale.x = o.parent.userData.flip ? -1 : 1;
  });
};

// ------------------------------------------------------------------------------------------------ crachás 3D
export type TagSpec = { label: string; photo?: string; col: string; sub?: string; kind?: "combine" | "hunter" | "person" };
const tagCard = (img: HTMLImageElement | null, s: TagSpec) =>
  canvasTex(256, 330, (c) => {
    c.clearRect(0, 0, 256, 330);
    c.fillStyle = "rgba(8,10,12,0.92)";
    c.fillRect(6, 6, 244, 318);
    c.strokeStyle = s.col;
    c.lineWidth = 7;
    c.strokeRect(6, 6, 244, 318);
    if (img) {
      const ar = img.width / img.height;
      const W = 228, H = 236;
      let sw = img.width, sh = img.height, sx = 0, sy = 0;
      if (ar > W / H) {
        sw = img.height * (W / H);
        sx = (img.width - sw) / 2;
      } else {
        sh = img.width / (W / H);
        sy = (img.height - sh) * 0.25;
      }
      c.drawImage(img, sx, sy, sw, sh, 14, 14, W, H);
    } else {
      // sem foto: o emblema (Combine / hunter) desenhado
      c.fillStyle = s.kind === "hunter" ? "#11202a" : "#1a0c0c";
      c.fillRect(14, 14, 228, 236);
      c.strokeStyle = s.col;
      c.lineWidth = 8;
      c.beginPath();
      if (s.kind === "hunter") {
        c.arc(100, 120, 26, 0, Math.PI * 2);
        c.moveTo(182, 120);
        c.arc(156, 120, 26, 0, Math.PI * 2);
        c.stroke();
        c.fillStyle = "#8fe8ff";
        c.beginPath();
        c.arc(100, 120, 12, 0, Math.PI * 2);
        c.arc(156, 120, 12, 0, Math.PI * 2);
        c.fill();
      } else {
        c.moveTo(128, 50);
        c.lineTo(196, 90);
        c.lineTo(196, 170);
        c.lineTo(128, 210);
        c.lineTo(60, 170);
        c.lineTo(60, 90);
        c.closePath();
        c.stroke();
      }
    }
    c.fillStyle = s.col;
    c.fillRect(6, 256, 244, 68);
    c.fillStyle = "#0a0806";
    c.font = "bold 38px 'Courier New', monospace";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(s.label, 128, 290);
  });
// um crachá 3D: plaquinha virada para a câmera + haste + anel no chão. setSub troca a linha de baixo (a legenda)
export const makeTag = (img: HTMLImageElement | null, s: TagSpec, h = 2.2) => {
  const g = new THREE.Group();
  const card = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.8), new THREE.MeshBasicMaterial({ map: tagCard(img, s), transparent: true, toneMapped: false }));
  card.position.y = h + 0.4;
  card.name = "card";
  const col = new THREE.Color(s.col);
  const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, h, 5), new THREE.MeshBasicMaterial({ color: col, toneMapped: false }));
  stalk.position.y = h / 2;
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.16, 0.2, 24), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.85, side: THREE.DoubleSide, toneMapped: false }));
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.02;
  const dot = new THREE.Mesh(new THREE.CircleGeometry(0.05, 12), new THREE.MeshBasicMaterial({ color: col, toneMapped: false }));
  dot.rotation.x = -Math.PI / 2;
  dot.position.y = 0.025;
  g.add(card, stalk, ring, dot);
  // legenda (texto pequeno ao lado)
  let subKey = "";
  const subMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.2), new THREE.MeshBasicMaterial({ transparent: true, toneMapped: false, depthWrite: false }));
  subMesh.position.set(0.95, h + 0.12, 0);
  card.add(subMesh);
  subMesh.position.set(0.93, -0.3, 0);
  const setSub = (t?: string) => {
    if ((t ?? "") === subKey) return;
    subKey = t ?? "";
    const mat = subMesh.material as THREE.MeshBasicMaterial;
    mat.map?.dispose();
    mat.map = t
      ? canvasTex(512, 84, (c) => {
          c.clearRect(0, 0, 512, 84);
          c.font = "bold 34px 'Courier New', monospace";
          c.lineWidth = 7;
          c.strokeStyle = "rgba(0,0,0,0.85)";
          c.strokeText(t, 8, 52);
          c.fillStyle = s.col;
          c.fillText(t, 8, 52);
        })
      : null;
    mat.opacity = t ? 1 : 0;
    mat.needsUpdate = true;
  };
  setSub(s.sub);
  // vira a plaquinha para a câmera e ajusta o tamanho com a distância (mínimo legível)
  const face = (cam: THREE.Camera, o = 1) => {
    const wp = new THREE.Vector3();
    card.getWorldPosition(wp);
    const d = wp.distanceTo(cam.position);
    card.quaternion.copy(g.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(cam.quaternion));
    card.scale.setScalar(Math.max(1, d / 7));
    g.visible = o > 0.01;
    [card, stalk, ring, dot, subMesh].forEach((m) => {
      const mm = m.material as THREE.MeshBasicMaterial;
      mm.transparent = true;
      mm.opacity = (m === ring ? 0.85 : 1) * o * (m === subMesh && !subKey ? 0 : 1);
    });
  };
  return { g, face, setSub };
};
// carrega as fotos dos crachás (Suspense: o Remotion espera)
export const useTagImages = (names: string[]) => {
  const urls = names.map((n) => (n.startsWith("data:") ? n : staticFile(n)));
  const tex = useLoader(THREE.ImageLoader, urls) as unknown as HTMLImageElement[];
  return Object.fromEntries(names.map((n, i) => [n, tex[i]])) as Record<string, HTMLImageElement>;
};

// ------------------------------------------------------------------------------------------------ palco genérico
// constrói a cena uma vez (useMemo), aplica o quadro (update) e desenha só quando o quadro muda (frameloop demand)
export type Cam = { pos: V; tgt: V; fov: number; roll?: number };
export const setCam = (camera: THREE.Camera, c: Cam) => {
  const cam = camera as THREE.PerspectiveCamera;
  cam.fov = c.fov;
  cam.near = 0.05;
  cam.far = 600;
  cam.position.set(...c.pos);
  cam.up.set(0, 1, 0);
  cam.lookAt(...c.tgt);
  if (c.roll) cam.rotateZ(c.roll);
  cam.updateProjectionMatrix();
  cam.updateMatrixWorld();
};
export function Stage<T extends { root: THREE.Group }>({ build, update, cam, fog, imgs }: { build: (imgs: Record<string, HTMLImageElement>) => T; update: (w: T, camera: THREE.Camera) => void; cam: Cam; fog?: [string, number]; imgs: string[] }) {
  const { camera, scene, gl, invalidate } = useThree();
  const im = useTagImages(imgs);
  // constrói UMA vez por cenário (as fotos chegam no mesmo objeto do cache do useLoader)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const W = useMemo(() => build(im), [build, imgs.join("|")]);
  gl.localClippingEnabled = true;
  scene.fog = fog ? new THREE.FogExp2(fog[0], fog[1]) : null;
  setCam(camera, cam);
  update(W, camera);
  faceBoards(W.root, camera);
  invalidate();
  return <primitive object={W.root} />;
}
export const projectorC = (c: Cam) => {
  const cam = new THREE.PerspectiveCamera(c.fov, 16 / 9, 0.05, 600);
  setCam(cam, c);
  return (p: V) => {
    const v = new THREE.Vector3(...p);
    const inCam = v.clone().applyMatrix4(cam.matrixWorldInverse);
    if (inCam.z > -0.05) return null;
    v.project(cam);
    return { x: (v.x + 1) * 960, y: (1 - v.y) * 540, d: -inCam.z };
  };
};
export const kitMats = (): K => ({
  cmb: S("#2a3138", 0.45, 0.75),
  cmbDark: S("#161a1e", 0.4, 0.8),
  keyCyan: new THREE.MeshBasicMaterial({ color: "#7fe8ff", toneMapped: false }),
  keyAmb: new THREE.MeshBasicMaterial({ color: "#ffb066", toneMapped: false }),
  lightCyan: new THREE.MeshBasicMaterial({ color: "#6ff0ff", toneMapped: false }),
  lightCold: new THREE.MeshBasicMaterial({ color: "#e8f4ff", toneMapped: false }),
  lightWarm: new THREE.MeshBasicMaterial({ color: "#fff0d0", toneMapped: false }),
  lightRed: new THREE.MeshBasicMaterial({ color: "#ff4030", toneMapped: false }),
  crate: new THREE.MeshStandardMaterial({ map: woodTex(1, 1), roughness: 0.85 }),
  strap: S("#2c2e30", 0.5, 0.7),
  steel: S("#5a6066", 0.5, 0.7),
  pipe: S("#4a5056", 0.45, 0.75),
  pipeY: S("#a8862e", 0.55, 0.4),
  glass: new THREE.MeshPhysicalMaterial({ color: "#9fc8d8", roughness: 0.05, metalness: 0, transmission: 0, transparent: true, opacity: 0.12, depthWrite: false }),
});
