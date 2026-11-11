// =================================================================================================
// HL3 · 1:45:35 o Ártico se desfaz: o chão com crateras (31/10/2026). Pedido dele: "os pedaços não levantam do chão
// deixando uma cratera", "pedaços de chão atravessando tudo", "uma cruz no chão". O diorama foi recusado ("tá feio"); fica
// o mundo de sempre (o navio, a aurora, as mesmas tomadas) e só o chão muda.
// Regra: o gelo fica PARADO. Só se movem pedaços recortados dele, e cada pedaço tem o mesmo contorno do buraco que deixa (o
// lençol é furado com o mesmo polígono), então nada atravessa nada. Embaixo de cada buraco há uma cova de terra: o fragmento
// de Xen estava enterrado nela; os pedaços de gelo grandes têm uma quilha que sai da cova deles. Em volta dos fragmentos as
// placas da borda tombam para cima (pivô na aresta de fora, por baixo: nunca entram no gelo) e fazem a borda da cratera.
// =================================================================================================
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

const rnd = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const cl = (x: number) => Math.max(0, Math.min(1, x));
const io = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
type P2 = [number, number];
type V3 = [number, number, number];

const T = 3; // espessura do gelo: de 0 a -3
// os fragmentos de Xen (as mesmas posições dos de antes); t = quadros depois do xenAt em que é arrancado
export const XENF = [
  { x: -50, z: -60, R: 9, t: 80 },
  { x: 30, z: -80, R: 13, t: 100 },
  { x: -5, z: -98, R: 7, t: 120 },
  { x: 60, z: -55, R: 6, t: 135 },
].map((r) => ({ ...r, D: r.R * 1.15 }));
// pedaços de gelo grandes: x, z, raio, atraso (quadros depois do iceAt)
const CHUNK: [number, number, number, number][] = [
  [-10, -55, 6, 0],
  [-28, -88, 7, 14],
  [-80, -95, 8, 26],
  [8, -38, 6, 38],
  [88, -88, 8, 50],
];
// a textura do gelo do mundo (a mesma conta do plano de 3400 m centrado em z = -700)
const uvOf = (x: number, z: number): P2 => [(x + 1700) / 3400, (-(z + 700) + 1700) / 3400];

const ring = (x: number, z: number, r: number, n: number, seed: number, rMin: number, rMax: number): P2[] =>
  Array.from({ length: n }).map((_, k) => {
    const a = ((k + (rnd(seed + k * 7) - 0.5) * 0.35) / n) * Math.PI * 2;
    const rr = r * (rMin + (rMax - rMin) * rnd(seed * 3 + k));
    return [x + Math.cos(a) * rr, z - Math.sin(a) * rr];
  });
// placa de gelo com espessura a partir de um polígono (e furos); UV do gelo do mundo, lados em degradê neve → azul
const slab = (pts: P2[], holes: P2[][] = []) => {
  const toS = ([x, z]: P2) => new THREE.Vector2(x, -z);
  const sh = new THREE.Shape(pts.map(toS));
  holes.forEach((h) => sh.holes.push(new THREE.Path(h.map(toS))));
  const g = new THREE.ExtrudeGeometry(sh, { depth: T, bevelEnabled: false, curveSegments: 1 });
  g.rotateX(-Math.PI / 2);
  g.translate(0, -T, 0);
  g.computeVertexNormals();
  const p = g.attributes.position as THREE.BufferAttribute;
  const uv: number[] = [], c: number[] = [];
  for (let i = 0; i < p.count; i++) {
    uv.push(...uvOf(p.getX(i), p.getZ(i)));
    const t = Math.pow(cl((p.getY(i) + T) / T), 0.6);
    c.push(0.3 + 0.62 * t, 0.5 + 0.45 * t, 0.66 + 0.32 * t);
  }
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute("color", new THREE.Float32BufferAttribute(c, 3));
  return g;
};
// faixa de luz violeta na costura que vai abrir
const seam = (pts: P2[], w: number) => {
  const pos: number[] = [];
  for (let k = 0; k < pts.length; k++) {
    const [ax, az] = pts[k], [bx, bz] = pts[(k + 1) % pts.length];
    const L = Math.hypot(bx - ax, bz - az) || 1;
    const nx = (-(bz - az) / L) * w, nz = ((bx - ax) / L) * w;
    const ex = ((bx - ax) / L) * w * 0.5, ez = ((bz - az) / L) * w * 0.5;
    const q = [
      [ax - ex + nx, az - ez + nz],
      [ax - ex - nx, az - ez - nz],
      [bx + ex - nx, bz + ez - nz],
      [bx + ex + nx, bz + ez + nz],
    ];
    [0, 1, 2, 0, 2, 3].forEach((i) => pos.push(q[i][0], 0.07, q[i][1]));
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  return g;
};
// meia esfera achatada em cima (o topo fica colado na tampa de gelo); cor por ponto
const keelGeo = (R: number, D: number, seed: number, col: (x: number, y: number, z: number, i: number) => V3) => {
  const hemi = new THREE.SphereGeometry(1, 40, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
  const disc = new THREE.CircleGeometry(1, 40);
  disc.rotateX(-Math.PI / 2);
  const parts = [hemi, disc].map((g) => {
    const p = g.attributes.position as THREE.BufferAttribute;
    const c: number[] = [];
    for (let i = 0; i < p.count; i++) {
      let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const L = Math.hypot(x, y, z) || 1;
      const n = 0.5 + 0.5 * Math.sin((x / L) * 5 + seed) * Math.cos((z / L) * 4 + seed * 2) * Math.sin((y / L) * 3 + seed);
      const k = 0.92 + 0.08 * n;
      x *= k * R;
      y *= k * D;
      z *= k * R;
      p.setXYZ(i, x, y, z);
      c.push(...col(x, y, z, i));
    }
    g.setAttribute("color", new THREE.Float32BufferAttribute(c, 3));
    g.deleteAttribute("uv");
    return g.toNonIndexed();
  });
  const g = mergeGeometries(parts)!;
  g.computeVertexNormals();
  return g;
};
// a cova na terra (vista de dentro) e o chão de terra em volta dela, logo abaixo do gelo
const pitGeo = (R: number, D: number, rOut: number, seed: number, xen: boolean) => {
  const b = new THREE.SphereGeometry(1, 36, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
  b.scale(R, D, R);
  const fl = new THREE.RingGeometry(R * 0.995, rOut, 36, 1);
  fl.rotateX(-Math.PI / 2);
  const parts = [b, fl].map((g, gi) => {
    const p = g.attributes.position as THREE.BufferAttribute;
    const c: number[] = [];
    for (let i = 0; i < p.count; i++) {
      const q = gi ? 0 : cl(-p.getY(i) / D);
      const s = 0.75 + 0.4 * rnd(i * 3 + seed);
      const green = xen && q > 0.3 && rnd(i * 7 + seed) > 0.7;
      c.push(green ? 0.22 : (0.28 - 0.12 * q) * s, green ? 0.62 : (0.22 - 0.1 * q) * s, green ? 0.36 : (0.19 - 0.03 * q) * s);
    }
    g.setAttribute("color", new THREE.Float32BufferAttribute(c, 3));
    g.deleteAttribute("uv");
    return g.toNonIndexed();
  });
  const g = mergeGeometries(parts)!;
  g.computeVertexNormals();
  return g;
};

export const buildCraterField = (iceMat: THREE.Material) => {
  const g = new THREE.Group();
  const sideM = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.22, metalness: 0.05, emissive: "#0d1822", flatShading: true });
  const mats = [iceMat, sideM];
  const earthM = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: true, side: THREE.DoubleSide });
  const xenM = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75, flatShading: true });
  xenM.onBeforeCompile = (s) => {
    s.fragmentShader = s.fragmentShader.replace("#include <emissivemap_fragment>", "#include <emissivemap_fragment>\n  totalEmissiveRadiance += max(vColor.g - vColor.r - 0.2, 0.0) * vec3(0.55, 1.5, 0.8);");
  };
  const keelM = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.35, metalness: 0.05, flatShading: true });
  const crystM = new THREE.MeshStandardMaterial({ color: "#7dffb0", emissive: "#3dff8a", emissiveIntensity: 0.9, roughness: 0.3, flatShading: true });
  const seamM = () => new THREE.MeshBasicMaterial({ color: "#c49cff", transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  const add = (o: THREE.Object3D) => {
    o.traverse((q) => {
      if ((q as THREE.Mesh).isMesh) q.castShadow = q.receiveShadow = true;
    });
    g.add(o);
    return o;
  };
  // ---- os fragmentos de Xen, com a tampa de gelo em cima e as placas da borda
  const rocks = XENF.map((r, i) => {
    const grp = new THREE.Group();
    grp.position.set(r.x, 0, r.z);
    const rock = new THREE.Mesh(
      keelGeo(r.R, r.D, i * 3.1 + 1, (x, y, z, k) => {
        const v = Math.abs(Math.sin(x * 0.8 + i) * Math.sin(y * 1.1 - z * 0.3) + 0.6 * Math.sin(z * 0.7 - y * 0.5 + i));
        const sh = 0.85 + 0.3 * rnd(k + i * 17);
        return v < 0.16 ? [0.35, 1.0, 0.55] : [0.24 * sh, 0.18 * sh, 0.25 * sh];
      }),
      xenM,
    );
    rock.position.y = -T;
    grp.add(rock);
    for (let k = 0; k < 9; k++) {
      const a = k * 2.4 + i, el = -0.35 - rnd(k + i * 9) * 0.5;
      const d = new THREE.Vector3(Math.cos(a) * Math.cos(el), Math.sin(el), Math.sin(a) * Math.cos(el));
      const len = r.R * (0.25 + rnd(k * 3 + i) * 0.2);
      const cr = new THREE.Mesh(new THREE.ConeGeometry(len * 0.22, len, 5), crystM);
      cr.position.set(d.x * r.R * 0.85, -T + d.y * r.D * 0.85, d.z * r.R * 0.85);
      cr.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d);
      grp.add(cr);
    }
    const cap = ring(r.x, r.z, r.R, 9, 20 + i * 13, 1.03, 1.16);
    const outer = cap.map(([x, z], k) => {
      const dx = x - r.x, dz = z - r.z, L = Math.hypot(dx, dz);
      const s = (r.R * (1.55 + 0.25 * rnd(i * 50 + k))) / L;
      return [r.x + dx * s, r.z + dz * s] as P2;
    });
    const capG = slab(cap);
    capG.translate(-r.x, 0, -r.z);
    grp.add(new THREE.Mesh(capG, mats));
    add(grp);
    const wedges = cap.map((c0, k) => {
      const c1 = cap[(k + 1) % cap.length], o0 = outer[k], o1 = outer[(k + 1) % cap.length];
      const geo = slab([c0, c1, o1, o0]);
      const px = (o0[0] + o1[0]) / 2, pz = (o0[1] + o1[1]) / 2;
      geo.translate(-px, T, -pz);
      const m = new THREE.Mesh(geo, mats);
      m.position.set(px, -T, pz);
      const ax = new THREE.Vector3(o1[0] - o0[0], 0, o1[1] - o0[1]).normalize();
      const sgn = Math.sign(ax.z * (r.x - px) - ax.x * (r.z - pz)) || 1;
      add(m);
      return { m, ax, sgn, th: 0.2 + rnd(i * 31 + k) * 0.2 };
    });
    const pit = new THREE.Mesh(pitGeo(r.R * 1.02, r.D * 1.02, r.R * 2.1, i * 11, true), earthM);
    pit.position.set(r.x, -T - 0.02, r.z);
    pit.receiveShadow = true;
    g.add(pit);
    const sm = new THREE.Mesh(seam(outer, 0.35), seamM());
    g.add(sm);
    const light = new THREE.PointLight("#b48cff", 0, r.R * 3.2, 1.6);
    light.position.set(r.x, -T - r.D * 0.4, r.z);
    g.add(light);
    return { r, grp, wedges, outer, sm, light, rOut: r.R * 1.85 };
  });
  // ---- os pedaços de gelo: a placa e a quilha de gelo sujo que sai da cova
  const chunks = CHUNK.map(([x, z, r, dl], i) => {
    const pts = ring(x, z, r, 8, 70 + i * 9, 0.8, 1.12);
    const grp = new THREE.Group();
    grp.position.set(x, 0, z);
    const geo = slab(pts);
    geo.translate(-x, 0, -z);
    grp.add(new THREE.Mesh(geo, mats));
    const kR = r * 0.78, kD = r * 0.75;
    const keel = new THREE.Mesh(
      keelGeo(kR, kD, i * 5.3 + 2, (_x, y, _z, k) => {
        const t = cl(1 + y / kD), dirt = rnd(k * 13 + i) > 0.86;
        return dirt ? [0.3, 0.25, 0.2] : [0.36 + 0.4 * t, 0.52 + 0.36 * t, 0.66 + 0.28 * t];
      }),
      keelM,
    );
    keel.position.y = -T;
    grp.add(keel);
    add(grp);
    const pit = new THREE.Mesh(pitGeo(kR * 1.02, kD * 1.02, r * 1.3, i * 7 + 40, false), earthM);
    pit.position.set(x, -T - 0.02, z);
    pit.receiveShadow = true;
    g.add(pit);
    const sm = new THREE.Mesh(seam(pts, 0.32), seamM());
    g.add(sm);
    return { grp, pts, x, z, r, dl, kR, kD, sm, rOut: r * 1.15 };
  });
  // ---- o lençol de gelo do mundo, furado
  const outline: P2[] = [[-1700, -2400], [1700, -2400], [1700, 1000], [-1700, 1000]];
  const sheet = new THREE.Mesh(slab(outline, [...rocks.map((q) => q.outer), ...chunks.map((c) => c.pts)]), mats);
  sheet.receiveShadow = true;
  g.add(sheet);
  // ---- o que cai: terra e gelo de baixo dos fragmentos, neve de baixo dos pedaços
  const lumpG = new THREE.IcosahedronGeometry(1, 0);
  const dirtM = new THREE.MeshStandardMaterial({ color: "#4a3a2e", roughness: 1, flatShading: true });
  const chipM = new THREE.MeshStandardMaterial({ color: "#d8e8f2", roughness: 0.5, flatShading: true });
  const debris: { m: THREE.Mesh; src: "rock" | "chunk"; i: number; j: number; s: number }[] = [];
  XENF.forEach((_, i) =>
    Array.from({ length: 16 }).forEach((__, j) => {
      const s = 0.25 + rnd(i * 40 + j) * 0.45;
      const m = new THREE.Mesh(lumpG, j % 3 ? dirtM : chipM);
      m.scale.setScalar(s);
      m.castShadow = true;
      m.visible = false;
      g.add(m);
      debris.push({ m, src: "rock", i, j, s });
    }),
  );
  CHUNK.forEach((_, i) =>
    Array.from({ length: 10 }).forEach((__, j) => {
      const s = 0.14 + rnd(i * 60 + j) * 0.22;
      const m = new THREE.Mesh(lumpG, j % 4 ? chipM : dirtM);
      m.scale.setScalar(s);
      m.visible = false;
      g.add(m);
      debris.push({ m, src: "chunk", i, j, s });
    }),
  );
  return { g, rocks, chunks, debris, pruned: false };
};
export type CraterField = ReturnType<typeof buildCraterField>;

// os blocos de gelo soltos do mundo (InstancedMesh) que caíssem em cima de um buraco somem
export const pruneWorldChunks = (root: THREE.Object3D, F: CraterField) => {
  if (F.pruned) return;
  F.pruned = true;
  const holes = [...F.rocks.map((q) => [q.r.x, q.r.z, q.rOut]), ...F.chunks.map((c) => [c.x, c.z, c.rOut])];
  const m4 = new THREE.Matrix4(), p = new THREE.Vector3(), q = new THREE.Quaternion(), s = new THREE.Vector3();
  root.traverse((o) => {
    const im = o as THREE.InstancedMesh;
    if (!im.isInstancedMesh || o === F.g || F.g.getObjectById(o.id)) return;
    let hit = false;
    for (let i = 0; i < im.count; i++) {
      im.getMatrixAt(i, m4);
      m4.decompose(p, q, s);
      if (holes.some(([x, z, r]) => Math.hypot(p.x - x, p.z - z) < r + Math.max(s.x, s.z) + 1)) {
        m4.compose(p, q, new THREE.Vector3(0, 0, 0));
        im.setMatrixAt(i, m4);
        hit = true;
      }
    }
    if (hit) im.instanceMatrix.needsUpdate = true;
  });
};

const pitDepth = (x: number, z: number, cx: number, cz: number, R: number, D: number) => {
  const d = Math.hypot(x - cx, z - cz) / R;
  return d < 1 ? -T - D * Math.sqrt(1 - d * d) : -T;
};
export const chunkY = (dl: number, f: number, iceAt: number) => {
  const t = f - iceAt - dl;
  return 8 * io(cl(t / 120)) + Math.max(0, t - 120) * 0.035;
};
export const xenPos = (i: number, f: number, xenAt: number): V3 => {
  const r = XENF[i];
  const tR = xenAt + r.t;
  if (f < tR) {
    const k = cl((f - xenAt - 10) / (r.t - 10));
    const sh = 0.14 * k;
    return [r.x + sh * Math.sin(f * 2.7 + i), sh * 0.8 * Math.abs(Math.sin(f * 3.3 + i)), r.z + sh * 0.6 * Math.cos(f * 2.1 + i)];
  }
  const t = f - tR;
  return [r.x, 10 * (1 - Math.exp(-t / 16)) + t * 0.05, r.z];
};
export const updateCraterField = (F: CraterField, f: number, iceAt: number, xenAt: number) => {
  F.chunks.forEach((c, i) => {
    const t0 = iceAt + c.dl;
    const y = chunkY(c.dl, f, iceAt);
    c.grp.position.y = y;
    // só inclina depois que a quilha saiu inteira do buraco
    const rr = cl((y - T - c.kD - 0.4) / 5);
    c.grp.rotation.set(rr * 0.12 * (rnd(i) * 2 - 1), rr * 0.25 * (rnd(i + 5) - 0.5), rr * 0.1 * (rnd(i + 9) * 2 - 1));
    (c.sm.material as THREE.MeshBasicMaterial).opacity = cl((f - (t0 - 70)) / 45) * (1 - cl((f - t0 - 6) / 30)) * (0.75 + 0.25 * Math.sin(f / 3 + i));
  });
  F.rocks.forEach((q, i) => {
    const tR = xenAt + q.r.t;
    const [x, y, z] = xenPos(i, f, xenAt);
    q.grp.position.set(x, y, z);
    const lift = cl((y - T - q.r.D - 0.5) / 6);
    q.grp.rotation.set(lift * 0.1 * (i % 2 ? 1 : -1), lift * 0.15, lift * 0.08 * (i % 2 ? -1 : 1));
    const k = cl((f - xenAt - 10) / (q.r.t - 10));
    const rip = io(cl((f - tR) / 14));
    q.wedges.forEach((w, j) => {
      const th = w.th * rip + 0.025 * k * (1 - rip) * Math.abs(Math.sin(f * 1.9 + j));
      w.m.quaternion.setFromAxisAngle(w.ax, w.sgn * th);
    });
    (q.sm.material as THREE.MeshBasicMaterial).opacity = k * (1 - cl((f - tR - 4) / 24)) * (0.7 + 0.3 * Math.sin(f / 2.5 + i));
    q.light.intensity = f < tR ? 0 : 60 * cl((f - tR) / 20) - 25 * cl((f - tR - 30) / 40);
  });
  const G = 0.012;
  F.debris.forEach((d) => {
    let p0: V3, tr: number, ground: (x: number, z: number) => number;
    if (d.src === "rock") {
      const r = XENF[d.i];
      tr = xenAt + r.t + 4 + d.j * 3;
      const a = d.j * 2.4, rr = r.R * (0.25 + 0.55 * rnd(d.i * 13 + d.j));
      const rp = xenPos(d.i, tr, xenAt);
      p0 = [rp[0] + Math.cos(a) * rr, rp[1] - T - r.D * Math.sqrt(1 - (rr / r.R) ** 2) * 0.85, rp[2] - Math.sin(a) * rr];
      ground = (x, z) => (Math.hypot(x - r.x, z - r.z) < r.R * 1.02 ? pitDepth(x, z, r.x, r.z, r.R * 1.02, r.D * 1.02) : 0.2);
    } else {
      const c = F.chunks[d.i];
      tr = iceAt + c.dl + 25 + d.j * 8;
      const a = d.j * 2.4, rr = c.kR * 0.8 * rnd(d.i * 7 + d.j);
      p0 = [c.x + Math.cos(a) * rr, chunkY(c.dl, tr, iceAt) - T - c.kD * Math.sqrt(1 - (rr / c.kR) ** 2) * 0.85, c.z - Math.sin(a) * rr];
      ground = (x, z) => (Math.hypot(x - c.x, z - c.z) < c.kR * 1.02 ? pitDepth(x, z, c.x, c.z, c.kR * 1.02, c.kD * 1.02) : Math.hypot(x - c.x, z - c.z) < c.r * 0.8 ? -T : 0);
    }
    const t = f - tr;
    d.m.visible = t >= 0;
    if (t < 0) return;
    let y = p0[1] - 0.5 * G * t * t;
    const gy = ground(p0[0], p0[2]) + d.s * 0.5;
    const landed = y <= gy;
    if (landed) y = gy;
    d.m.position.set(p0[0], y, p0[2]);
    const spin = landed ? Math.sqrt(Math.max(0, (2 * (p0[1] - gy)) / G)) : t;
    d.m.rotation.set(spin * 0.15 + d.j, spin * 0.1, d.i);
  });
};
