// =================================================================================================
// HL3 · o motor POV desenhado com profundidade de verdade (11/10/2026).
// O XView desenhava polígonos SVG ordenados pela distância (pintor): pilar atravessando o teto, mesa com parte preta,
// coisas "se desfazendo" de perto — tudo erro de ordem. Aqui as MESMAS faces, com as MESMAS cores (o sombreamento do
// XView), vão para um WebGL com teste de profundidade. O visual não muda; só deixa de bugar. E dá para pôr modelos 3D de
// verdade (o Advisor) na mesma cena, escondidos pelas paredes quando estão atrás delas.
// Mundo do motor: x direita, y frente, z cima  →  three: (x, z, −y).
// =================================================================================================
import * as THREE from "three";

export type GLFace = { pts: [number, number, number][]; rgb: [number, number, number]; vc?: [number, number, number][]; nofill?: boolean; edge?: [number, number, number]; top?: boolean };
type EyeL = { x: number; y: number; z: number; yaw: number; pitch: number; F: number };
let R: THREE.WebGLRenderer | null = null;
const scene = new THREE.Scene();
const cam = new THREE.PerspectiveCamera(60, 16 / 9, 0.15, 6000);
const fillM = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1, toneMapped: false });
// 13/10 (pedido dele: as faixas azuis embaixo dos monitores e as paredes piscando): as faces acesas (faixas, lâmpadas,
// telas) ficam coladas em outras faces — no mesmo plano o teste de profundidade sorteia quem aparece e pisca. Elas vão
// numa malha própria puxada para a frente.
const topM = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4, toneMapped: false });
// 06/11 (o player ficava todo preto até recarregar): se a placa de vídeo derruba o contexto WebGL (jogo aberto, falta de
// memória), o renderizador único ficava morto para sempre. Agora ele é recriado na hora.
const getR = (w: number, h: number) => {
  if (R && R.getContext().isContextLost()) {
    try { R.dispose(); } catch { /* já perdido */ }
    R = null;
  }
  if (!R) {
    const cv = document.createElement("canvas");
    R = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true, preserveDrawingBuffer: true });
    R.outputColorSpace = THREE.LinearSRGBColorSpace;
    R.setPixelRatio(1);
  }
  const s = R.getSize(new THREE.Vector2());
  if (s.x !== w || s.y !== h) R.setSize(w, h, false);
  return R;
};
export const W3 = (p: [number, number, number]) => new THREE.Vector3(p[0], p[2], -p[1]);
export const setEyeCam = (c: THREE.PerspectiveCamera, e: EyeL) => {
  c.fov = (2 * Math.atan(540 / e.F) * 180) / Math.PI;
  c.aspect = 16 / 9;
  c.near = 0.12;
  c.far = 6000;
  c.position.set(e.x, e.z, -e.y);
  const cp = Math.cos(e.pitch);
  c.up.set(0, 1, 0);
  c.lookAt(e.x + Math.sin(e.yaw) * cp, e.z + Math.sin(e.pitch), -e.y - Math.cos(e.yaw) * cp);
  c.updateProjectionMatrix();
  c.updateMatrixWorld();
};
// desenha as faces (em coordenadas do mundo do motor) + objetos three extras, e copia para o canvas alvo
export const drawGL = (target: HTMLCanvasElement, e: EyeL, faces: GLFace[], seam: [number, number, number, number] | null, extras: THREE.Object3D[] = [], lights: THREE.Light[] = []) => {
  const w = target.width, h = target.height;
  const r = getR(w, h);
  setEyeCam(cam, e);
  let maxD = 0;
  for (const fc of faces) for (const q of fc.pts) { const d = Math.hypot(q[0] - e.x, q[1] - e.y, q[2] - e.z); if (d > maxD) maxD = d; }
  for (const o of extras) { const d = o.position.distanceTo(cam.position) + 80; if (d > maxD) maxD = d; }
  cam.near = maxD < 120 ? 0.08 : 0.15;
  cam.far = Math.min(6000, Math.max(60, maxD * 1.25 + 10));
  cam.updateProjectionMatrix();
  let nT = 0, nL = 0, nE = 0;
  for (const fc of faces) {
    if (!fc.nofill) nT += fc.pts.length - 2;
    if (fc.edge) nE += fc.pts.length;
    else nL += fc.pts.length;
  }
  const ep = new Float32Array(nE * 6), ec = new Float32Array(nE * 6);
  let jE = 0;
  let nTop = 0;
  for (const fc of faces) if (fc.top && !fc.nofill) nTop += fc.pts.length - 2;
  const pos = new Float32Array((nT - nTop) * 9), col = new Float32Array((nT - nTop) * 9);
  const posT = new Float32Array(nTop * 9), colT = new Float32Array(nTop * 9);
  let iT = 0;
  const lp = new Float32Array(nL * 6);
  let i = 0, j = 0;
  for (const fc of faces) {
    const p = fc.pts;
    const c0 = fc.rgb[0] / 255, c1 = fc.rgb[1] / 255, c2 = fc.rgb[2] / 255;
    if (fc.edge) {
      for (let k = 0; k < p.length; k++) {
        const a = p[k], b = p[(k + 1) % p.length];
        ep.set([a[0], a[2], -a[1], b[0], b[2], -b[1]], jE);
        ec.set([fc.edge[0] / 255, fc.edge[1] / 255, fc.edge[2] / 255, fc.edge[0] / 255, fc.edge[1] / 255, fc.edge[2] / 255], jE);
        jE += 6;
      }
    }
    if (!fc.nofill)
    for (let k = 1; k < p.length - 1; k++)
      for (const vi of [0, k, k + 1]) {
        const q = p[vi];
        const v = fc.vc ? fc.vc[vi] : null;
        const P2 = fc.top ? posT : pos, C2 = fc.top ? colT : col;
        const ii = fc.top ? iT : i;
        P2[ii] = q[0];
        P2[ii + 1] = q[2];
        P2[ii + 2] = -q[1];
        C2[ii] = v && v[0] === v[0] ? v[0] / 255 : c0;
        C2[ii + 1] = v && v[1] === v[1] ? v[1] / 255 : c1;
        C2[ii + 2] = v && v[2] === v[2] ? v[2] / 255 : c2;
        if (fc.top) iT += 3;
        else i += 3;
      }
    if (!fc.edge)
      for (let k = 0; k < p.length; k++) {
        const a = p[k], b = p[(k + 1) % p.length];
        lp.set([a[0], a[2], -a[1], b[0], b[2], -b[1]], j);
        j += 6;
      }
  }
  let edges: THREE.LineSegments | null = null;
  if (nE) {
    const eg = new THREE.BufferGeometry();
    eg.setAttribute("position", new THREE.BufferAttribute(ep, 3));
    eg.setAttribute("color", new THREE.BufferAttribute(ec, 3));
    edges = new THREE.LineSegments(eg, new THREE.LineBasicMaterial({ vertexColors: true, toneMapped: false }));
    scene.add(edges);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const mesh = new THREE.Mesh(g, fillM);
  scene.add(mesh);
  const gT = new THREE.BufferGeometry();
  gT.setAttribute("position", new THREE.BufferAttribute(posT, 3));
  gT.setAttribute("color", new THREE.BufferAttribute(colT, 3));
  const meshT = new THREE.Mesh(gT, topM);
  meshT.renderOrder = 1;
  scene.add(meshT);
  let lines: THREE.LineSegments | null = null;
  if (seam && nL) {
    const lg = new THREE.BufferGeometry();
    lg.setAttribute("position", new THREE.BufferAttribute(lp, 3));
    lines = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: new THREE.Color(seam[0] / 255, seam[1] / 255, seam[2] / 255), transparent: true, opacity: seam[3], toneMapped: false }));
    scene.add(lines);
  }
  extras.forEach((o) => scene.add(o));
  lights.forEach((o) => scene.add(o));
  r.toneMapping = THREE.NoToneMapping;
  r.setClearColor(0x000000, 0);
  r.clear();
  r.render(scene, cam);
  scene.remove(mesh);
  g.dispose();
  scene.remove(meshT);
  gT.dispose();
  extras.forEach((o) => scene.remove(o));
  lights.forEach((o) => scene.remove(o));
  if (edges) {
    scene.remove(edges);
    edges.geometry.dispose();
    (edges.material as THREE.Material).dispose();
  }
  if (lines) {
    scene.remove(lines);
    lines.geometry.dispose();
    (lines.material as THREE.Material).dispose();
  }
  const ctx = target.getContext("2d")!;
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(r.domElement, 0, 0, w, h);
};
export const parseRGBA = (s: string): [number, number, number, number] | null => {
  const m = s.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const v = m[1].split(",").map((x) => parseFloat(x));
  return [v[0], v[1], v[2], v[3] ?? 1];
};
