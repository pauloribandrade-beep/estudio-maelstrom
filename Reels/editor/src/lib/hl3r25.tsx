// HL3 · o Ártico se desfaz: o chão de gelo de verdade (31/10)
// Pedido dele: "os pedaços não levantam do chão deixando uma cratera", "pedaços de chão atravessando tudo". O gelo era um plano
// liso e tudo subia atravessando ele. Agora, na área onde a cena acontece, o chão é uma camada de gelo com espessura (1,4),
// cortada em placas irregulares, com o abismo escuro-violeta embaixo:
//  · "o Ártico começa a se desfazer": as juntas entre as placas se abrem aos poucos (a partir do navio), deixando ver o violeta
//  · "pedaços enormes de gelo deixam o chão e sobem": blocos de várias placas se soltam e sobem girando devagar; fica o buraco
//  · os fragmentos de Xen estão enterrados: ao serem arrancados, as placas de cima quebram, empinam e são empurradas para fora
//    (a borda da cratera), e a ilha sobe de dentro do buraco
// O resto do chão (longe) continua o plano do mundo, com o mesmo material e as mesmas UVs, sem costura.
import * as THREE from "three";
import { rnd } from "./hl3";

const X0 = -110, X1 = 100, Z0 = -118, Z1 = 0, G = 5, TH = 1.4;
const NX = Math.round((X1 - X0) / G), NZ = Math.round((Z1 - Z0) / G);
// as UVs do plano do mundo (PlaneGeometry 3400 em [0, 0, -700], deitado): a textura continua igual nas placas
const uvOf = (x: number, z: number): [number, number] => [(x + 1700) / 3400, (-(z + 700) + 1700) / 3400];
const corner = (i: number, j: number): [number, number] => {
  const border = i === 0 || j === 0 || i === NX || j === NZ;
  return [X0 + i * G + (border ? 0 : (rnd(i * 131 + j * 17) - 0.5) * 2.6), Z0 + j * G + (border ? 0 : (rnd(i * 71 + j * 113) - 0.5) * 2.6)];
};

type Cell = { i: number; j: number; poly: [number, number][]; c: THREE.Vector3 };
// o som de uma placa: topo (grupo 0), lados (grupo 1) e, se pedir, o fundo (grupo 1); centrada em `org`
const cellGeo = (cells: Cell[], org: THREE.Vector3, bottom: boolean, extra?: (c: Cell, n: number) => void) => {
  const P: number[] = [], UV: number[] = [];
  let nTop = 0;
  const tri = (a: number[], b: number[], c: number[], uv: boolean) => {
    P.push(...a, ...b, ...c);
    if (uv) [a, b, c].forEach((v) => UV.push(...uvOf(v[0] + org.x, v[2] + org.z)));
    else UV.push(0, 0, 0, 0, 0, 0);
  };
  // topos primeiro (um grupo só), depois lados e fundos
  const per: number[] = [];
  cells.forEach((cl) => {
    const q = cl.poly.map(([x, z]) => [x - org.x, 0 - org.y, z - org.z]);
    tri(q[0], q[2], q[1], true);
    tri(q[0], q[3], q[2], true);
    per.push(6);
  });
  nTop = P.length / 3;
  cells.forEach((cl) => {
    const q = cl.poly.map(([x, z]) => [x - org.x, 0 - org.y, z - org.z]);
    const cx = cl.c.x - org.x, cz = cl.c.z - org.z;
    for (let k = 0; k < 4; k++) {
      const a = q[k], b = q[(k + 1) % 4];
      const a2 = [a[0], a[1] - TH, a[2]], b2 = [b[0], b[1] - TH, b[2]];
      // virada para fora da placa
      const mx = (a[0] + b[0]) / 2 - cx, mz = (a[2] + b[2]) / 2 - cz;
      const ex = b[0] - a[0], ez = b[2] - a[2];
      const out = ez * mx - ex * mz > 0;
      if (out) {
        tri(a, b, b2, false);
        tri(a, b2, a2, false);
      } else {
        tri(a, b2, b, false);
        tri(a, a2, b2, false);
      }
    }
    if (bottom) {
      const d = q.map((v) => [v[0], v[1] - TH, v[2]]);
      tri(d[0], d[1], d[2], false);
      tri(d[0], d[2], d[3], false);
    }
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(P, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(UV, 2));
  // a cor das laterais: gelo claro em cima, azul escuro embaixo (o topo usa a textura do chão e ignora a cor)
  const COL: number[] = [];
  for (let k = 0; k < P.length / 3; k++) {
    const y = P[k * 3 + 1] + org.y;
    const u = Math.max(0, Math.min(1, -y / TH));
    COL.push(0.86 - 0.62 * u, 0.93 - 0.55 * u, 0.98 - 0.42 * u);
  }
  geo.setAttribute("color", new THREE.Float32BufferAttribute(COL, 3));
  geo.computeVertexNormals();
  geo.addGroup(0, nTop, 0);
  geo.addGroup(nTop, P.length / 3 - nTop, 1);
  if (extra) {
    // atributos por vértice (centro da placa e quando ela racha), na mesma ordem em que os triângulos foram gerados
    const A: number[] = [], T: number[] = [];
    const push = (cl: Cell, n: number) => {
      for (let k = 0; k < n; k++) {
        A.push(cl.c.x, 0, cl.c.z);
        T.push((cl as Cell & { t0: number }).t0);
      }
    };
    cells.forEach((cl) => push(cl, 6));
    cells.forEach((cl) => push(cl, 24 + (bottom ? 6 : 0)));
    geo.setAttribute("aCenter", new THREE.Float32BufferAttribute(A, 3));
    geo.setAttribute("aT0", new THREE.Float32BufferAttribute(T, 1));
  }
  return geo;
};

export type IceSheet = {
  g: THREE.Group;
  uT: { value: number };
  crater: { m: THREE.Mesh; c: THREE.Vector3; isl: number; dir: THREE.Vector3; d: number }[];
  chunks: { m: THREE.Mesh; c: THREE.Vector3; t0: number; sp: number; sd: number }[];
};

// islands: [x, z, s] dos fragmentos de Xen · iceAt: quando o gelo começa a ceder (quadros) · avoid: áreas que ficam quietas
export const buildIceSheet = (worldIce: THREE.Mesh, islands: [number, number, number][], iceAt: number, avoid: [number, number, number][]): IceSheet => {
  const g = new THREE.Group();
  const topM = (worldIce.material as THREE.MeshStandardMaterial).clone();
  const sideM = new THREE.MeshStandardMaterial({ color: "#ffffff", vertexColors: true, roughness: 0.45, metalness: 0.05, emissive: "#1c2a36", flatShading: true });
  const uT = { value: 0 };
  // as juntas abrindo: cada placa encolhe um pouco para o próprio centro e afunda de leve, na sua hora
  const patch = (m: THREE.MeshStandardMaterial, key: string) => {
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uT = uT;
      sh.vertexShader =
        "attribute vec3 aCenter;\nattribute float aT0;\nuniform float uT;\n" +
        sh.vertexShader.replace(
          "#include <begin_vertex>",
          `#include <begin_vertex>
          float gk = clamp((uT - aT0) / 45.0, 0.0, 1.0);
          transformed.xz = aCenter.xz + (transformed.xz - aCenter.xz) * (1.0 - 0.07 * gk);
          transformed.y -= gk * 0.08 * fract(aCenter.x * 0.37 + aCenter.z * 0.71);`,
        );
    };
    m.customProgramCacheKey = () => key;
    return m;
  };
  const cells: (Cell & { t0: number })[] = [];
  for (let i = 0; i < NX; i++)
    for (let j = 0; j < NZ; j++) {
      const poly = [corner(i, j), corner(i + 1, j), corner(i + 1, j + 1), corner(i, j + 1)];
      const c = new THREE.Vector3(poly.reduce((a, p) => a + p[0], 0) / 4, 0, poly.reduce((a, p) => a + p[1], 0) / 4);
      // rachando a partir do navio (fundo), vindo para a câmera
      const t0 = iceAt + Math.max(0, (c.z - Z0) * 1.1) + rnd(i * 7 + j * 3) * 25;
      cells.push({ i, j, poly, c, t0 });
    }
  const used = new Set<Cell>();
  // a cratera de cada fragmento de Xen
  const crater: IceSheet["crater"] = [];
  islands.forEach(([x, z, s], k) => {
    cells.forEach((cl) => {
      const d = Math.hypot(cl.c.x - x, cl.c.z - z);
      if (used.has(cl) || d > s * 1.25) return;
      used.add(cl);
      const geo = cellGeo([cl], cl.c, true);
      const m = new THREE.Mesh(geo, [topM, sideM]);
      m.castShadow = m.receiveShadow = true;
      g.add(m);
      crater.push({ m, c: cl.c.clone(), isl: k, dir: new THREE.Vector3(cl.c.x - x, 0, cl.c.z - z).normalize(), d: d / (s * 1.25) });
    });
  });
  // os blocos que sobem
  const CH: [number, number, number][] = [
    [-20, -78, 7], [-40, -92, 6.5], [12, -60, 6], [-70, -86, 7.5], [8, -100, 6], [-24, -108, 6], [-80, -40, 6.5], [42, -28, 6], [-6, -40, 5], [-58, -25, 5.5],
  ];
  const chunks: IceSheet["chunks"] = [];
  CH.forEach(([x, z, r], k) => {
    if (avoid.some(([ax, az, ar]) => Math.hypot(ax - x, az - z) < ar + r)) return;
    const mine = cells.filter((cl) => !used.has(cl) && Math.hypot(cl.c.x - x, cl.c.z - z) < r);
    if (!mine.length) return;
    mine.forEach((cl) => used.add(cl));
    const org = new THREE.Vector3(mine.reduce((a, cl) => a + cl.c.x, 0) / mine.length, 0, mine.reduce((a, cl) => a + cl.c.z, 0) / mine.length);
    const m = new THREE.Mesh(cellGeo(mine, org, true), [topM, sideM]);
    m.castShadow = m.receiveShadow = true;
    m.position.copy(org);
    g.add(m);
    chunks.push({ m, c: org, t0: iceAt + 20 + k * 16, sp: 0.6 + rnd(k * 9.1) * 0.7, sd: k });
  });
  // o resto: uma malha só, com as juntas abrindo no shader
  const rest = cells.filter((cl) => !used.has(cl));
  const sheet = new THREE.Mesh(cellGeo(rest, new THREE.Vector3(), false, () => undefined), [patch(topM.clone(), "gelo-topo"), patch(sideM.clone(), "gelo-lado")]);
  sheet.receiveShadow = true;
  g.add(sheet);
  // o abismo embaixo: escuro, com o violeta da fase
  const abyss = new THREE.Mesh(new THREE.PlaneGeometry(420, 320), new THREE.MeshBasicMaterial({ color: "#2a1446" }));
  abyss.rotation.x = -Math.PI / 2;
  abyss.position.set((X0 + X1) / 2, -26, (Z0 + Z1) / 2);
  g.add(abyss);
  const glowM = new THREE.MeshBasicMaterial({ color: "#7a4cc8", transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false });
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(X1 - X0, Z1 - Z0), glowM);
  glow.rotation.x = -Math.PI / 2;
  glow.position.set((X0 + X1) / 2, -TH - 0.6, (Z0 + Z1) / 2);
  g.add(glow);
  // o chão de longe: o plano do mundo, menos o retângulo das placas (mesmo material, mesmas UVs)
  const far = (xa: number, xb: number, za: number, zb: number) => {
    const P = [xa, 0, za, xb, 0, za, xb, 0, zb, xa, 0, zb];
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(P, 3));
    geo.setAttribute("uv", new THREE.Float32BufferAttribute([...uvOf(xa, za), ...uvOf(xb, za), ...uvOf(xb, zb), ...uvOf(xa, zb)], 2));
    geo.setIndex([0, 2, 1, 0, 3, 2]);
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, worldIce.material);
    m.receiveShadow = true;
    g.add(m);
  };
  far(-1700, X0, -2400, 1000);
  far(X1, 1700, -2400, 1000);
  far(X0, X1, Z1, 1000);
  far(X0, X1, -2400, Z0);
  return { g, uT, crater, chunks };
};

// T: o tempo corrido da cena · rip(k): quanto o fragmento k já foi arrancado (0 a 1)
export const updateIceSheet = (S: IceSheet, T: number, rip: (k: number) => number) => {
  S.uT.value = T;
  S.crater.forEach((c) => {
    const r = rip(c.isl);
    // a placa é empurrada para fora, a borda de dentro levanta (empina) e a de fora afunda: a borda da cratera
    const push = r * (2.2 + 2.5 * (1 - c.d));
    const lift = r * (0.8 * (1 - c.d) + 0.15);
    c.m.position.set(c.c.x + c.dir.x * push, lift, c.c.z + c.dir.z * push);
    const axis = new THREE.Vector3(-c.dir.z, 0, c.dir.x);
    c.m.quaternion.setFromAxisAngle(axis, -r * (0.3 + 0.3 * (1 - c.d)));
  });
  S.chunks.forEach((c) => {
    const t = Math.max(0, (T - c.t0) / 30);
    // um tranco (solta), depois sobe sem parar, girando devagar
    const jolt = Math.min(1, t * 2);
    const up = Math.max(0, t - 0.6);
    c.m.position.set(c.c.x, 0.12 * jolt + up * up * 0.25 * c.sp + up * 0.9 * c.sp, c.c.z);
    c.m.rotation.set(up * 0.05 * (rnd(c.sd) - 0.5) + 0.03 * jolt, up * 0.04 * c.sp, up * 0.06 * (rnd(c.sd + 3) - 0.5));
  });
};
