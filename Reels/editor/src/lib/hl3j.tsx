import React, { useContext, useEffect, useMemo, useState } from "react";
import { AbsoluteFill, Easing, continueRender, delayRender, interpolate, staticFile, useCurrentFrame, useRemotionEnvironment } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { Canvas, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { MONO } from "./overlays";
import { C, GlitchWrap, glitchAmt, rnd } from "./hl3";
import { LiteCtx } from "./sfx-ctx";

// Parte 3 (a história, 2026-10-02). Duas linguagens para a narrativa no lugar do traçado:
//  · HL25D — uma imagem REAL do jogo vira um relevo 3D pela profundidade (Depth Anything V2): a câmera faz um
//    travelling lento e o primeiro plano se descola do fundo (paralaxe), com poeira flutuando na luz.
//  · HLCombineFeed — momento que nenhum jogo mostrou, construído do zero em 3D e visto como IMAGEM DE CÂMERA DE
//    VIGILÂNCIA COMBINE interceptada (monocromático ciano, varredura, granulação, painel Overwatch).
// Tempos em QUADROS relativos à cena.

const useTex = (src: string) => {
  const { isRendering } = useRemotionEnvironment();
  const [tex, setTex] = useState<THREE.Texture | null>(null);
  const [h] = useState(() => (isRendering ? delayRender(`textura ${src}`) : -1));
  useEffect(() => {
    new THREE.TextureLoader().load(
      staticFile(src),
      (t) => {
        t.colorSpace = THREE.NoColorSpace; // o shader devolve a cor como veio (sem conversão dupla)
        t.minFilter = THREE.LinearFilter;
        setTex(t);
        if (h >= 0) continueRender(h);
      },
      undefined,
      () => h >= 0 && continueRender(h),
    );
  }, [src, h]);
  return tex;
};

const Redraw: React.FC<{ f: number }> = ({ f }) => {
  const { invalidate } = useThree();
  useEffect(() => {
    invalidate();
  }, [f, invalidate]);
  return null;
};
export const Canvas3D: React.FC<{ f: number; lite: boolean; fov: number; pos: [number, number, number]; near: number; far: number; children: React.ReactNode }> = ({ f, lite, fov, pos, near, far, children }) => {
  const { isRendering } = useRemotionEnvironment();
  const camera = { fov, position: pos, near, far };
  if (isRendering)
    return (
      <ThreeCanvas width={1920} height={1080} style={{ position: "absolute", inset: 0 }} gl={{ antialias: true }} camera={camera}>
        {children}
      </ThreeCanvas>
    );
  return (
    <Canvas style={{ position: "absolute", inset: 0, width: 1920, height: 1080 }} resize={{ offsetSize: true, scroll: false }} dpr={lite ? 0.5 : 1} gl={{ antialias: !lite }} camera={camera} frameloop="demand">
      <Redraw f={f} />
      {children}
    </Canvas>
  );
};

const VS = `
uniform sampler2D uDepth; uniform float uAmp; varying vec2 vUv;
void main(){ vUv = uv; float d = texture2D(uDepth, uv).r; vec3 p = position; p.z += d * uAmp;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }`;
const FS = `
uniform sampler2D uMap; uniform float uBright; varying vec2 vUv;
void main(){ vec3 c = texture2D(uMap, vUv).rgb * uBright; gl_FragColor = vec4(c, 1.0); }`;

const FOV = 35;
const D0 = 1 / Math.tan(((FOV / 2) * Math.PI) / 180); // distância em que um plano de altura 2 enche a tela

const Relief: React.FC<{ map: THREE.Texture | null; dep: THREE.Texture | null; amp: number; f: number; life: number; push: number; drift: number }> = ({ map, dep, amp, f, life, push, drift }) => {
  const { camera } = useThree();
  const geo = useMemo(() => new THREE.PlaneGeometry(2 * (16 / 9) * 1.08, 2 * 1.08, 320, 180), []);
  const mat = useMemo(() => new THREE.ShaderMaterial({ vertexShader: VS, fragmentShader: FS, uniforms: { uMap: { value: null }, uDepth: { value: null }, uAmp: { value: amp }, uBright: { value: 1 } } }), [amp]);
  mat.uniforms.uMap.value = map;
  mat.uniforms.uDepth.value = dep;
  const t = interpolate(f, [0, life], [0, 1], { ...C, easing: Easing.inOut(Easing.sin) });
  camera.position.set(-drift + 2 * drift * t, 0.02 - 0.04 * t, D0 * (1 - push * t));
  camera.lookAt(0, 0, 0);
  // poeira na luz: pontos quentes flutuando entre a imagem e a câmera
  const dust = useMemo(() => {
    const n = 420;
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    return { g, n };
  }, []);
  const pos = dust.g.getAttribute("position") as THREE.BufferAttribute;
  for (let i = 0; i < dust.n; i++) {
    const x0 = (rnd(i * 3 + 1) - 0.5) * 3.6;
    const y0 = (rnd(i * 5 + 2) - 0.5) * 2.0;
    const z0 = 0.15 + rnd(i * 7 + 3) * 1.6;
    pos.setXYZ(i, x0 + Math.sin(f * 0.01 + i) * 0.04 + f * 0.0006, y0 + Math.sin(f * 0.013 + i * 1.7) * 0.05 - f * 0.0004, z0);
  }
  pos.needsUpdate = true;
  if (!map || !dep) return null;
  return (
    <>
      <mesh geometry={geo} material={mat} />
      <points geometry={dust.g}>
        <pointsMaterial color="#ffe2b8" size={0.0065} sizeAttenuation transparent opacity={0.55} blending={THREE.AdditiveBlending} depthWrite={false} />
      </points>
    </>
  );
};

export const HL25D: React.FC<{ life: number; src: string; depth: string; amp?: number; push?: number; drift?: number; eyesAt?: number }> = ({ life, src, depth, amp = 0.28, push = 0.12, drift = 0.07, eyesAt }) => {
  const f = useCurrentFrame();
  const lite = useContext(LiteCtx);
  // texturas carregadas FORA do canvas (dentro dele o quadro saía antes de a imagem chegar: tela preta)
  const map = useTex(src);
  const dep = useTex(depth);
  const o = interpolate(f, [0, 12, life - 12, life], [0, 1, 1, 0], C);
  // `eyesAt`: abre como pálpebra (Gordon abrindo os olhos): duas pálpebras pretas, desfocado → nítido
  const eye = eyesAt === undefined ? 1 : interpolate(f, [eyesAt, eyesAt + 10, eyesAt + 16, eyesAt + 30], [0, 0.35, 0.22, 1], { ...C, easing: Easing.inOut(Easing.quad) });
  return (
    <AbsoluteFill style={{ opacity: o, background: "#000" }}>
      <AbsoluteFill style={{ filter: eyesAt === undefined ? undefined : `blur(${(1 - eye) * 14}px)` }}>
        <Canvas3D f={f} lite={lite} fov={FOV} pos={[0, 0, D0]} near={0.05} far={50}>
          <Relief map={map} dep={dep} amp={amp} f={f} life={life} push={push} drift={drift} />
        </Canvas3D>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 80% 75% at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)" }} />
      {eyesAt !== undefined && eye < 1 ? (
        <>
          <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 540 * (1 - eye) + 2, background: "#000", borderRadius: "0 0 50% 50% / 0 0 40px 40px" }} />
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 540 * (1 - eye) + 2, background: "#000", borderRadius: "50% 50% 0 0 / 40px 40px 0 0" }} />
        </>
      ) : null}
    </AbsoluteFill>
  );
};

// ============================================================================================ feed Combine
const hgt = (x: number, z: number) => 2.2 * Math.sin(x * 0.05) * Math.cos(z * 0.04) + 1.1 * Math.sin(x * 0.13 + z * 0.09) + 0.45 * Math.sin(x * 0.31 - z * 0.27) + 0.22 * Math.sin(x * 0.9 + z * 0.35) * Math.sin(z * 0.7 - x * 0.2);
const pathX = (z: number) => 4 + Math.sin(z * 0.02) * 5;
const SPEED = 0.1; // unidades por quadro (comboio; os soldados acompanham a pé)
const ST_SPEED = 0.1; // Striders

// ---------------------------------------------------------------------------------------------------------------
// Cena do feed montada UMA VEZ (objetos three.js) e só MOVIDA a cada quadro, sem o React comparar centenas de peças
// por quadro (era isso que deixava a prévia lenta, o player atrasava e a voz "repetia").
const _v = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);
const CYL: Record<string, THREE.CylinderGeometry> = {};
const cyl = (r: number, r2: number) => (CYL[`${r}|${r2}`] ??= new THREE.CylinderGeometry(r, r2, 1, 8));
const MATS: Record<string, THREE.Material> = {};
const mat = (color: string, kind: "metal" | "matte" | "basic" = "metal") =>
  (MATS[`${color}|${kind}`] ??=
    kind === "basic" ? new THREE.MeshBasicMaterial({ color }) : new THREE.MeshStandardMaterial({ color, roughness: kind === "metal" ? 0.45 : 0.75, metalness: kind === "metal" ? 0.6 : 0.1 }));
const add = (parent: THREE.Object3D, g: THREE.BufferGeometry, m: THREE.Material, pos?: [number, number, number], scale?: number | [number, number, number], rot?: [number, number, number]) => {
  const o = new THREE.Mesh(g, m);
  if (pos) o.position.set(pos[0], pos[1], pos[2]);
  if (scale !== undefined) typeof scale === "number" ? o.scale.setScalar(scale) : o.scale.set(scale[0], scale[1], scale[2]);
  if (rot) o.rotation.set(rot[0], rot[1], rot[2]);
  parent.add(o);
  return o;
};
// barra (cilindro de altura 1) esticada entre dois pontos
const setBar = (o: THREE.Object3D, a: THREE.Vector3, b: THREE.Vector3) => {
  _v.copy(b).sub(a);
  const len = _v.length();
  o.position.copy(a).addScaledVector(_v, 0.5);
  o.quaternion.setFromUnitVectors(UP, _v.normalize());
  o.scale.set(1, Math.max(1e-4, len), 1);
};
const bar = (parent: THREE.Object3D, r: number, r2: number, m: THREE.Material) => add(parent, cyl(r, r2), m);

// blindado Combine (APC do HL2): casco alto de laterais chapadas, frente inclinada com fendas de visão, três rodas
// grandes por lado com saia de blindagem por cima, painéis laterais em tom diferente (lê bem no monocromático),
// torre com metralhadora na frente, lançador de foguetes atrás, antenas, faróis e luz vermelha.
const extrudeSide = (pts: [number, number][], width: number) => {
  const sh = new THREE.Shape();
  sh.moveTo(pts[0][0], pts[0][1]);
  pts.slice(1).forEach((q) => sh.lineTo(q[0], q[1]));
  sh.closePath();
  const g = new THREE.ExtrudeGeometry(sh, { depth: width, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 1 });
  g.translate(0, 0, -width / 2);
  g.rotateY(-Math.PI / 2); // perfil (z do carro, y) → comprimento no eixo z (frente em +z)
  return g;
};
const APC_HULL = extrudeSide([[-3.1, 0.35], [2.7, 0.35], [3.25, 0.85], [2.55, 1.55], [1.3, 2.0], [-2.7, 2.0], [-3.1, 1.7]], 2.5);
const APC_DECK = extrudeSide([[-2.3, 2.0], [1.0, 2.0], [0.7, 2.35], [-2.0, 2.35]], 1.9);
const APC_SKIRT = extrudeSide([[-2.8, 0.75], [2.5, 0.75], [2.85, 1.05], [2.4, 1.3], [-2.8, 1.3]], 0.12);
const APC_PANEL = extrudeSide([[-2.2, 1.35], [1.0, 1.35], [0.8, 1.8], [-2.0, 1.8]], 0.06);
const WHEEL = new THREE.CylinderGeometry(0.62, 0.62, 0.42, 16);
const HUB = new THREE.CylinderGeometry(0.28, 0.28, 0.46, 8);
const BOX = new THREE.BoxGeometry(1, 1, 1);
const SPH = new THREE.SphereGeometry(1, 12, 9);
const SPH_HI = new THREE.SphereGeometry(1, 22, 14);
const makeApc = () => {
  const g = new THREE.Group();
  const dark = mat("#4b535b");
  const mid = mat("#6b757e");
  const light = mat("#8b96a0");
  const black = mat("#0b0d0f", "basic");
  const gun = mat("#111316", "matte");
  add(g, APC_HULL, mid);
  add(g, APC_DECK, dark);
  [-0.55, 0, 0.55].forEach((sx) => add(g, BOX, black, [sx, 1.72, 2.12], [0.38, 0.07, 0.04], [0.62, 0, 0]));
  const wheels: THREE.Group[] = [];
  [-1, 1].forEach((sd) => {
    add(g, APC_SKIRT, dark, [sd * 1.3, 0, 0]);
    add(g, APC_PANEL, light, [sd * 1.29, 0, 0]);
    [-2.0, 0, 2.0].forEach((wz) => {
      const w = new THREE.Group();
      w.position.set(sd * 1.12, 0.62, wz);
      add(w, WHEEL, mat("#16191c", "matte"));
      add(w, HUB, light);
      g.add(w);
      wheels.push(w);
    });
  });
  add(g, SPH, dark, [0, 2.4, 0.5], [0.55, 0.32, 0.55]);
  add(g, BOX, gun, [0, 2.45, 1.35], [0.1, 0.1, 1.3]);
  add(g, BOX, light, [0, 2.62, -1.5], [1.1, 0.5, 1.2], [-0.25, 0, 0]);
  [-0.3, 0, 0.3].forEach((sx) => add(g, SPH, black, [sx, 2.72, -0.92], 0.1));
  add(g, BOX, gun, [0.9, 2.9, -2.4], [0.03, 1.8, 0.03]);
  add(g, BOX, gun, [-0.9, 2.7, -2.5], [0.03, 1.4, 0.03]);
  [-0.85, 0.85].forEach((lx) => add(g, SPH, mat("#ffffff", "basic"), [lx, 0.95, 3.05], 0.17));
  add(g, SPH, mat("#ff3344", "basic"), [0, 2.0, 1.45], 0.1);
  const update = (z: number, f: number, k: number) => {
    const x = pathX(z);
    g.position.set(x, hgt(x, z) + 0.28 + Math.sin(f * 0.5 + k) * 0.03, z);
    g.rotation.set(0, Math.atan2(pathX(z - 1) - x, -1), 0); // frente (+z local) para onde anda (-z)
    wheels.forEach((w) => w.rotation.set(f * 0.16, 0, Math.PI / 2));
  };
  return { g, update };
};

// soldado Combine (HL2): capacete, máscara com os dois olhos acesos e respirador, colete, ombreiras, cinto, mochila,
// joelheiras e botas; fuzil atravessado no peito, seguro com as duas mãos; passada natural (coxa + canela).
export const makeSoldier = () => {
  const g = new THREE.Group();
  const BODY = mat("#5d666e", "matte");
  const DARK = mat("#2d3338", "matte");
  const ARM = mat("#58616a", "matte");
  const legs = [-1, 1].map((sd) => {
    const thigh = new THREE.Group();
    thigh.position.set(sd * 0.11, 0.93, 0);
    add(thigh, BOX, BODY, [0, -0.23, 0], [0.15, 0.46, 0.17]);
    const knee = new THREE.Group();
    knee.position.set(0, -0.46, 0);
    add(knee, BOX, DARK, [0, 0, 0.08], [0.13, 0.12, 0.05]);
    add(knee, BOX, BODY, [0, -0.22, 0], [0.13, 0.44, 0.14]);
    add(knee, BOX, DARK, [0, -0.47, 0.05], [0.15, 0.1, 0.27]);
    thigh.add(knee);
    g.add(thigh);
    return { thigh, knee, sd };
  });
  add(g, BOX, BODY, [0, 1.33, 0], [0.46, 0.48, 0.3]);
  add(g, BOX, mat("#77818a", "matte"), [0, 1.36, 0.155], [0.36, 0.3, 0.02]);
  add(g, BOX, BODY, [0, 1.04, 0], [0.38, 0.22, 0.24]);
  add(g, BOX, DARK, [0, 0.93, 0], [0.42, 0.07, 0.27]);
  add(g, BOX, DARK, [0, 1.34, -0.22], [0.34, 0.4, 0.15]);
  [-1, 1].forEach((sd) => add(g, SPH, mat("#6b757e", "matte"), [sd * 0.27, 1.53, 0], [0.11, 0.08, 0.13]));
  add(g, SPH, DARK, [0, 1.75, 0], [0.15, 0.16, 0.17]);
  add(g, BOX, mat("#3a4146", "matte"), [0, 1.71, 0.12], [0.17, 0.13, 0.06]);
  [-0.055, 0.055].forEach((ex) => add(g, SPH, mat("#bff4ff", "basic"), [ex, 1.75, 0.16], 0.032));
  add(g, SPH, mat("#202428", "matte"), [0, 1.64, 0.17], [0.045, 0.04, 0.05]);
  const rifle = new THREE.Group();
  rifle.position.set(0.02, 1.24, 0.27);
  rifle.rotation.set(0.1, 0.45, -0.42);
  add(rifle, BOX, mat("#14171a", "matte"), [0, 0, 0], [0.06, 0.1, 0.9]);
  add(rifle, BOX, mat("#14171a", "matte"), [0, -0.1, 0.05], [0.05, 0.16, 0.08]);
  g.add(rifle);
  const arm = (a: [number, number, number], b: [number, number, number], r: number) => setBar(bar(g, r, r * 0.85, ARM), new THREE.Vector3(...a), new THREE.Vector3(...b));
  arm([0.27, 1.48, 0], [0.22, 1.2, 0.14], 0.055);
  arm([0.22, 1.2, 0.14], [0.12, 1.14, 0.3], 0.045);
  arm([-0.27, 1.48, 0], [-0.2, 1.3, 0.22], 0.055);
  arm([-0.2, 1.3, 0.22], [-0.12, 1.36, 0.42], 0.045);
  const update = (x: number, z: number, f: number, ph: number, ang: number) => {
    const w = f * 0.4 + ph;
    g.position.set(x, hgt(x, z) + Math.abs(Math.cos(w)) * 0.05, z);
    g.rotation.set(0, ang, Math.sin(w) * 0.03);
    legs.forEach((l) => {
      const ws = w + (l.sd > 0 ? Math.PI : 0);
      l.thigh.rotation.x = -0.42 * Math.sin(ws);
      l.knee.rotation.x = 0.12 + 0.7 * Math.max(0, Math.cos(ws)) ** 1.5;
    });
  };
  return { g, update };
};

// Strider (HL2): corpo achatado pendurado ENTRE as pernas; pernas que saem de cima do corpo, sobem até joelhos acima
// dele e descem longas e finas: coxa com faixas claras, joelho saliente, canela afinando com anéis escuros, bulbo do
// tornozelo com cerdas e ponta escura fincada no gelo. Canhão de pulso debaixo da cabeça, com rajadas de traçantes.
const STRIDERS = [
  { x: 14, z0: -8, ph: 0 },
  { x: 24, z0: -34, ph: 0.35 },
  { x: -10, z0: -50, ph: 0.7 },
  { x: 30, z0: -78, ph: 0.15 },
  { x: 2, z0: -104, ph: 0.55 },
];
const stBody = (i: number, f: number) => {
  const st = STRIDERS[i];
  const z = st.z0 - f * ST_SPEED;
  const x = pathX(z) + st.x;
  return new THREE.Vector3(x, hgt(x, z) + 10 + Math.sin(f * 0.16 + st.ph * 6) * 0.4, z);
};
// `opts` (opcional, só o mapa tático usa): corpo e chão próprios, velocidade do passo. Sem opts = o feed de sempre.
type StriderOpts = { body?: (f: number) => THREE.Vector3; ground?: (x: number, z: number) => number; speed?: number; fire?: boolean };
export const makeStrider = (i: number, lite = false, opts: StriderOpts = {}) => {
  const gnd = opts.ground ?? hgt;
  const g = new THREE.Group();
  const C1 = mat("#262b31");
  const BAND = mat("#8f99a2");
  const RING = mat("#101215", "matte");
  const SPIKE = mat("#0d0f11", "matte");
  const WHITE = mat("#ffffff", "basic");
  const body = add(g, SPH_HI, C1, undefined, [1.5, 0.85, 2.5]);
  const head = add(g, SPH, mat("#2f353c"), undefined, [1.0, 0.7, 0.95]);
  const eye = add(g, SPH, mat("#bff4ff", "basic"), undefined, 0.28);
  const gunBase = add(g, SPH, mat("#1c2025"), undefined, 0.45);
  const gun = bar(g, 0.26, 0.18, mat("#15181b", "matte"));
  const ant = bar(g, 0.08, 0.064, C1);
  const legs = [0, 1, 2].map((k) => ({
    k,
    thigh: bar(g, 0.32, 0.22, C1),
    bands: [0, 1].map(() => bar(g, 0.35, 0.28, BAND)),
    knee: add(g, SPH, C1, undefined, [0.36, 0.42, 0.36]),
    shin: bar(g, 0.19, 0.1, C1),
    rings: [0, 1, 2].map((j) => bar(g, 0.22 - j * 0.03, (0.22 - j * 0.03) * 0.8, RING)),
    ankle: add(g, SPH, C1, undefined, [0.24, 0.3, 0.24]),
    hairs: Array.from({ length: 9 }).map(() => bar(g, 0.035, 0.008, RING)), // as cerdas do tornozelo (também na prévia)
    spike: bar(g, 0.09, 0.015, SPIKE),
  }));
  const tracers = Array.from({ length: 7 }).map(() => bar(g, 0.09, 0.072, WHITE));
  const flash = add(g, SPH, WHITE, undefined, 0.7);
  const hits = Array.from({ length: 7 }).map(() => add(g, SPH, new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0 })));
  const p0 = new THREE.Vector3();
  const p1 = new THREE.Vector3();
  const update = (f: number) => {
    const B = opts.body ? opts.body(f) : stBody(i, f);
    const ph = STRIDERS[i].ph;
    body.position.copy(B);
    head.position.copy(B).add(new THREE.Vector3(0, -0.25, -2.3));
    eye.position.copy(B).add(new THREE.Vector3(0, -0.15, -3.2));
    const gb = B.clone().add(new THREE.Vector3(0, -0.9, -1.4));
    const muzzle = B.clone().add(new THREE.Vector3(0, -1.15, -4.6));
    gunBase.position.copy(gb);
    setBar(gun, gb, muzzle);
    setBar(ant, B.clone().add(new THREE.Vector3(0, 0.5, 1.4)), B.clone().add(new THREE.Vector3(0, 1.4, 2.6)));
    const T = 40;
    const L = (opts.speed ?? ST_SPEED) * T * 0.75;
    legs.forEach((lg) => {
      const a = [Math.PI / 2 + 0.2, -0.5, Math.PI + 0.5][lg.k];
      const sg = (((f / T + ph + lg.k / 3) % 1) + 1) % 1;
      let dz: number;
      let lift = 0;
      if (sg < 0.75) dz = L * (0.5 - sg / 0.75);
      else {
        const w = (sg - 0.75) / 0.25;
        dz = L * (-0.5 + w);
        lift = Math.sin(w * Math.PI) * 2.2;
      }
      const fx = B.x + Math.cos(a) * 6.5;
      const fz = B.z - Math.sin(a) * 6.5 - dz;
      const foot = new THREE.Vector3(fx, gnd(fx, fz) + lift, fz);
      const hip = B.clone().add(new THREE.Vector3(Math.cos(a) * 0.8, 0.7, -Math.sin(a) * 0.8));
      const knee = hip.clone().add(new THREE.Vector3(Math.cos(a) * 2.4, 4.0, -Math.sin(a) * 2.4)).add(new THREE.Vector3(0, 0, -dz * 0.3));
      const ankle = foot.clone().add(new THREE.Vector3(0, 1.9, 0));
      setBar(lg.thigh, hip, knee);
      lg.bands.forEach((bd, j) => setBar(bd, p0.copy(hip).lerp(knee, [0.1, 0.2][j]), p1.copy(hip).lerp(knee, [0.1, 0.2][j] + 0.06)));
      lg.knee.position.copy(knee);
      setBar(lg.shin, knee, ankle);
      lg.rings.forEach((rg, j) => setBar(rg, p0.copy(knee).lerp(ankle, [0.3, 0.55, 0.8][j]), p1.copy(knee).lerp(ankle, [0.3, 0.55, 0.8][j] + 0.012)));
      lg.ankle.position.copy(ankle);
      lg.hairs.forEach((h, j) => {
        const an = (j / 9) * Math.PI * 2 + lg.k;
        const ln = 0.8 + 0.35 * rnd(j * 7 + lg.k);
        setBar(h, ankle, p1.copy(ankle).add(_v.set(Math.cos(an) * ln, -0.3 - 0.35 * rnd(j + lg.k * 3), Math.sin(an) * ln)));
      });
      setBar(lg.spike, ankle, foot);
    });
    // rajadas: a cada 60 quadros, 14 quadros atirando (um traçante a cada 2 quadros) no chão à frente
    const cyc = ((f + Math.round(ph * 60)) % 60 + 60) % 60;
    let anyFlash = false;
    for (let j = 0; j < 7; j++) {
      const age = cyc - j * 2;
      const tx = B.x + (rnd(i * 31 + j) - 0.5) * 10;
      const tz = B.z - 18 - rnd(i * 17 + j) * 10;
      const target = new THREE.Vector3(tx, gnd(tx, tz), tz);
      const tr = tracers[j];
      if (opts.fire === false) {
        tr.visible = false;
        hits[j].visible = false;
        continue;
      }
      if (age >= 0 && age < 3) {
        tr.visible = true;
        const u0 = age / 3;
        setBar(tr, p0.copy(muzzle).lerp(target, u0), p1.copy(muzzle).lerp(target, Math.min(1, u0 + 0.45)));
        if (age === 0) anyFlash = true;
      } else tr.visible = false;
      const h = hits[j];
      if (age >= 2 && age < 14) {
        h.visible = true;
        const r = 0.6 + (age - 2) * 0.18;
        h.position.copy(target);
        h.scale.set(r, r * 0.5, r);
        (h.material as THREE.MeshBasicMaterial).opacity = 0.9 * (1 - (age - 2) / 12);
      } else h.visible = false;
    }
    flash.visible = anyFlash;
    flash.position.copy(muzzle);
  };
  return { g, update };
};

// Gunship Combine: fuselagem longa de inseto, cauda com rotor, atravessando o céu rápido
const makeGunship = () => {
  const g = new THREE.Group();
  const C = mat("#2a2f35");
  add(g, SPH, C, undefined, [0.9, 0.7, 3.4]);
  setBar(bar(g, 0.22, 0.12, C), new THREE.Vector3(0, 0.1, 2.6), new THREE.Vector3(0, 0.5, 6.2));
  const rotor = add(g, BOX, mat("#15181b", "matte"), [0, 0.5, 6.3], [2.6, 0.08, 0.2]);
  add(g, SPH, mat("#bff4ff", "basic"), [0, -0.1, -3.3], 0.25);
  const update = (f: number, k: number, lead: number) => {
    g.position.set(90 - f * 0.75 - k * 34, 26 + k * 4 + Math.sin(f * 0.05 + k) * 0.8, lead - 30 - k * 22);
    g.rotation.set(0, Math.PI / 2 + 0.25, Math.sin(f * 0.04 + k) * 0.08);
    rotor.rotation.z = f * 0.9;
  };
  return { g, update };
};

// faixa de rastro (fita colada no chão) seguindo o caminho do comboio entre z0 e z1
const trackGeo = (z0: number, z1: number, off: number) => {
  const n = 160;
  const pos: number[] = [];
  const idx: number[] = [];
  for (let i = 0; i <= n; i++) {
    const z = z0 + ((z1 - z0) * i) / n;
    const x = pathX(z) + off;
    for (const w of [-0.32, 0.32]) pos.push(x + w, hgt(x + w, z) + 0.05, z);
    if (i < n) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
};
const N_APC = 12;
// o mundo do Ártico (terreno, blindados, soldados, Striders, neve) é montado UMA vez por sessão e reaproveitado:
// a prévia desmonta a cena longe do cursor e remontar tudo a cada passagem travava o player ~0,9 s (a voz andava e a
// animação ficava para trás). Tudo nele é reposicionado a cada quadro a partir de `f`, então reusar é seguro.
const WORLDS = new Map<boolean, ReturnType<typeof buildArctic>>();
const buildArctic = (lite: boolean) => {
    const root = new THREE.Group();
    const gg = new THREE.PlaneGeometry(520, 520, lite ? 90 : 200, lite ? 90 : 200);
    gg.rotateX(-Math.PI / 2);
    const gp = gg.getAttribute("position") as THREE.BufferAttribute;
    for (let i = 0; i < gp.count; i++) gp.setY(i, hgt(gp.getX(i), gp.getZ(i)));
    gg.computeVertexNormals();
    add(root, gg, new THREE.MeshStandardMaterial({ color: "#eef2f4", roughness: 0.95 }));
    const rockG = new THREE.DodecahedronGeometry(1, 0);
    const rockM = new THREE.MeshStandardMaterial({ color: "#8a939a", roughness: 0.9 });
    for (let i = 0; i < (lite ? 12 : 50); i++) {
      const x = (rnd(i * 3) - 0.5) * 260;
      const z = 40 - rnd(i * 5) * 280;
      const sc = 0.3 + rnd(i * 7) * 1.1;
      add(root, rockG, rockM, [x, hgt(x, z) + sc * 0.3, z], sc, [rnd(i), rnd(i + 1) * 3, 0]);
    }
    const trackM = new THREE.MeshStandardMaterial({ color: "#9aa4ab", roughness: 1, transparent: true, opacity: 0.85 });
    [-0.8, 0.8].forEach((o) => add(root, trackGeo(-260, 60, o), trackM));
    const apcs = Array.from({ length: lite ? 5 : N_APC }).map(() => makeApc());
    const soldiers = Array.from({ length: lite ? 6 : 16 }).map(() => makeSoldier());
    const striders = STRIDERS.slice(0, lite ? 3 : STRIDERS.length).map((_, i) => makeStrider(i, lite));
    const gunships = (lite ? [] : [0, 1]).map(() => makeGunship());
    [...apcs, ...soldiers, ...striders, ...gunships].forEach((o) => root.add(o.g));
    const n = lite ? 800 : 6000;
    const sg = new THREE.BufferGeometry();
    sg.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    const snow = new THREE.Points(sg, new THREE.PointsMaterial({ color: "#ffffff", size: 0.16, sizeAttenuation: true, transparent: true, opacity: 0.8, depthWrite: false }));
    root.add(snow);
    return { root, apcs, soldiers, striders, gunships, snow, n };
};
const ArcticScene: React.FC<{ f: number; zoom: number; lite: boolean }> = ({ f, zoom, lite }) => {
  const { camera } = useThree();
  const W = useMemo(() => {
    let w = WORLDS.get(lite);
    if (!w) WORLDS.set(lite, (w = buildArctic(lite)));
    return w;
  }, [lite]);
  const lead = 6 - f * SPEED; // z do primeiro blindado
  // dois planos: 1) visão aérea, os Strider de longe sobre o comboio; 2) depois do corte (`zoom` ≥ 0,5), drone
  // baixo acompanhando de lado (blindados e pelotão de perto)
  const wide = zoom < 0.5;
  const cam = wide
    ? new THREE.Vector3(-50 + Math.sin(f * 0.012) * 5, 18 + Math.sin(f * 0.03) * 0.4, lead + 56)
    : new THREE.Vector3(pathX(lead - 6) - 15 + Math.sin(f * 0.02) * 0.6, 4.6 + Math.sin(f * 0.05) * 0.15, lead + 4);
  camera.position.copy(cam);
  camera.lookAt(wide ? new THREE.Vector3(pathX(lead - 16), 4.5, lead - 16) : new THREE.Vector3(pathX(lead - 8), 1.6, lead - 8));
  const pc = camera as THREE.PerspectiveCamera;
  pc.fov = wide ? 24 : 34;
  pc.updateProjectionMatrix();
  W.apcs.forEach((a, k) => a.update(lead - k * 8, f, k));
  W.soldiers.forEach((s, k) => {
    const zz = 3 - Math.floor(k / 2) * 2.2 - f * SPEED; // mesmo passo do comboio
    s.update(pathX(zz) + 4.2 + (k % 2) * 1.3, zz, f, k * 0.9, Math.atan2(pathX(zz - 1) - pathX(zz), -1));
  });
  W.striders.forEach((s) => s.update(f));
  W.gunships.forEach((g, k) => g.update(f, k, lead));
  const sp = W.snow.geometry.getAttribute("position") as THREE.BufferAttribute;
  for (let i = 0; i < W.n; i++) {
    const x0 = (rnd(i * 3 + 9) - 0.5) * 70;
    const z0 = (rnd(i * 5 + 4) - 0.5) * 70;
    const y0 = rnd(i * 7 + 2) * 30;
    const y = ((y0 - f * (0.06 + rnd(i) * 0.06)) % 30 + 30) % 30;
    sp.setXYZ(i, cam.x + 18 + x0 * 1.4 + ((f * (0.14 + rnd(i + 3) * 0.12)) % 30), y, cam.z - 30 + z0 * 1.4);
  }
  sp.needsUpdate = true;
  return (
    <>
      <color attach="background" args={["#c3ccd2"]} />
      <fog attach="fog" args={["#c3ccd2", 70, 300]} />
      <hemisphereLight args={["#eef4fb", "#6d7a84", 1.05]} />
      <directionalLight position={[-70, 14, -40]} intensity={2.1} color="#fff0d8" />
      <primitive object={W.root} dispose={null} />
    </>
  );
};

export const HLCombineFeed: React.FC<{ life: number; glitches?: { at: number; k?: number }[]; dest?: string; zoomAt?: number }> = ({ life, glitches = [], dest = "ÁRTICO", zoomAt }) => {
  const f = useCurrentFrame();
  const lite = useContext(LiteCtx);
  // entra sem fade (vem do estouro gelado do mapa; o fade deixava o fundo roxo aparecer)
  const o = interpolate(f, [life - 8, life], [1, 0], C);
  // zoom digital no meio do plano, com um tranco de glitch no salto
  const f3 = f; // a cena 3D é só movida a cada quadro (barata): roda a 30 q/s também na prévia
  const zAt = zoomAt ?? Math.round(life * 0.5);
  const zoom = interpolate(f, [zAt, zAt + 5], [0, 1], { ...C, easing: Easing.out(Easing.cubic) });
  const g = glitchAmt(f, [{ at: 0, k: 1 }, { at: 3, k: 0.7 }, { at: zAt - 1, k: 0.8 }, ...glitches]);
  const tc = (() => {
    const s = 41 * 60 + 17 + f / 30;
    return `${String(Math.floor(s / 3600) + 3).padStart(2, "0")}:${String(Math.floor((s / 60) % 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}:${String(f % 30).padStart(2, "0")}`;
  })();
  const HUD = "#c6f7ff";
  const roll = ((f * 6) % 1300) - 200;
  return (
    <AbsoluteFill style={{ opacity: o, background: "#9fb3bd" }}>
      <GlitchWrap f={f} amt={lite ? 0 : g} id="gfeed">
        <AbsoluteFill style={{ filter: `${lite ? "" : "blur(0.8px) "}grayscale(1) contrast(1.75) brightness(0.74) sepia(0.55) hue-rotate(150deg) saturate(1.8)` }}>
          <Canvas3D f={f3} lite={lite} fov={21} pos={[0, 15, 30]} near={0.1} far={400}>
            <ArcticScene f={f3} zoom={zoom} lite={lite} />
          </Canvas3D>
        </AbsoluteFill>
        {/* varredura, faixa rolando, granulação e vinheta do sensor */}
        <AbsoluteFill style={{ background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.28) 0 1px, rgba(0,0,0,0) 1px 3px)" }} />
        <div style={{ position: "absolute", left: 0, right: 0, top: roll, height: 160, background: "linear-gradient(180deg, rgba(200,250,255,0), rgba(200,250,255,0.07), rgba(200,250,255,0))" }} />
        {lite ? null : <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, mixBlendMode: "overlay", opacity: 0.38 }}>
          <filter id="feedgrain">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={f % 50} />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width={1920} height={1080} filter="url(#feedgrain)" />
        </svg>}
        <AbsoluteFill style={{ background: "radial-gradient(ellipse 75% 70% at 50% 50%, rgba(0,0,0,0) 50%, rgba(0,8,12,0.75) 100%)" }} />
        {/* painel Overwatch */}
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          {[
            [70, 60, 1],
            [1850, 60, -1],
          ].map(([x, y, s], k) => (
            <path key={k} d={`M ${x} ${y + 70} L ${x} ${y} L ${x + s * 70} ${y}`} fill="none" stroke={HUD} strokeWidth={3} opacity={0.8} />
          ))}
          {[
            [70, 1020, 1],
            [1850, 1020, -1],
          ].map(([x, y, s], k) => (
            <path key={k} d={`M ${x} ${y - 70} L ${x} ${y} L ${x + s * 70} ${y}`} fill="none" stroke={HUD} strokeWidth={3} opacity={0.8} />
          ))}
          <g stroke={HUD} strokeWidth={2} fill="none" opacity={0.65}>
            <path d="M 900 540 L 940 540 M 980 540 L 1020 540 M 960 500 L 960 520 M 960 560 L 960 580" />
            <rect x={760} y={400} width={400} height={280} strokeDasharray="14 10" />
          </g>
        </svg>
        {zoom >= 0.5 ? (
          <>
            <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
              <g stroke="#ff6b6b" strokeWidth={3} fill="none">
                {[
                  [700, 300, 1, 1],
                  [1220, 300, -1, 1],
                  [700, 780, 1, -1],
                  [1220, 780, -1, -1],
                ].map(([x, y, sx, sy], k) => (
                  <path key={k} d={`M ${x} ${y + sy * 50} L ${x} ${y} L ${x + sx * 50} ${y}`} />
                ))}
              </g>
            </svg>
            <div style={{ position: "absolute", left: 700, top: 800, fontFamily: MONO, fontSize: 22, letterSpacing: 4, color: "#ff8f8f" }}>ALVO · BLINDADO APC · ESCOLTA</div>
            <div style={{ position: "absolute", right: 100, top: 160, fontFamily: MONO, fontSize: 22, letterSpacing: 4, color: "#c6f7ff" }}>ZOOM 3×</div>
          </>
        ) : (
          <>
            <div style={{ position: "absolute", right: 100, top: 160, fontFamily: MONO, fontSize: 22, letterSpacing: 4, color: "#c6f7ff" }}>FEED 03 · VISÃO AÉREA</div>
          </>
        )}
        <div style={{ position: "absolute", left: 100, top: 82, fontFamily: MONO, fontSize: 24, letterSpacing: 4, color: HUD, lineHeight: 1.5 }}>
          <div>OVERWATCH ◆ FEED 07</div>
          <div style={{ opacity: 0.75, fontSize: 20 }}>SETOR {dest} · 81°N 23°W</div>
        </div>
        <div style={{ position: "absolute", right: 100, top: 82, fontFamily: MONO, fontSize: 24, letterSpacing: 4, color: HUD, textAlign: "right", lineHeight: 1.5 }}>
          <div>
            <span style={{ color: "#ff4d5e", opacity: Math.floor(f / 15) % 2 ? 0.25 : 1 }}>●</span> REC
          </div>
          <div style={{ opacity: 0.75, fontSize: 20 }}>{tc}</div>
        </div>
        <div style={{ position: "absolute", left: 100, bottom: 80, fontFamily: MONO, fontSize: 20, letterSpacing: 3, color: HUD, lineHeight: 1.6, opacity: 0.85 }}>
          <div>UNIDADES EM MOVIMENTO · 12</div>
          <div>SYNTHS · 05 STRIDER · 02 GUNSHIP</div>
          <div>REFORÇOS DO OVERWORLD · SEM RESPOSTA</div>
        </div>
        <div style={{ position: "absolute", right: 100, bottom: 80, fontFamily: MONO, fontSize: 20, letterSpacing: 3, color: HUD, textAlign: "right", opacity: 0.85 }}>
          DESTINO · {dest}
          <div style={{ marginTop: 6, height: 6, width: 260, marginLeft: "auto", background: "rgba(198,247,255,0.2)" }}>
            <div style={{ height: 6, width: `${30 + 60 * interpolate(f, [0, life], [0, 1], C)}%`, background: HUD }} />
          </div>
        </div>
      </GlitchWrap>
      {lite && g > 0.05 ? (
        <AbsoluteFill style={{ pointerEvents: "none" }}>
          {Array.from({ length: 8 }).map((_, k) => (
            <div key={k} style={{ position: "absolute", left: rnd(f * 3 + k) * 1600, top: rnd(f * 5 + k * 7) * 1060, width: 120 + rnd(f * 11 + k) * 700 * g, height: 4 + rnd(f * 13 + k) * 30 * g, background: k % 3 === 0 ? "rgba(0,255,230,0.35)" : k % 3 === 1 ? "rgba(255,40,160,0.32)" : "rgba(255,255,255,0.3)", mixBlendMode: "screen" }} />
          ))}
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};

// ============================================================================================ voo pelo ambiente
// HLFly: a foto vira um AMBIENTE em camadas — fundo (com o buraco dos personagens preenchido) e primeiro plano
// recortado (RGBA), cada um em relevo pela própria profundidade. A câmera voa por um caminho de pontos-chave
// (`path`: t 0..1, posição e alvo, em unidades do plano: x ±1,92 · y ±1,08 · z = profundidade × amp) — passa pelos
// personagens e termina estourando em branco (`whiteFrom`, fração da cena) ao entrar na luz de uma janela.
const FS_A = `
uniform sampler2D uMap; uniform float uFade; varying vec2 vUv;
void main(){ vec4 c = texture2D(uMap, vUv); if (c.a < 0.45) discard; gl_FragColor = vec4(c.rgb, uFade); }`;
type Key = { t: number; p: [number, number, number]; l: [number, number, number] };

const FlyLayers: React.FC<{ bg: THREE.Texture | null; bgD: THREE.Texture | null; fg: THREE.Texture | null; fgD: THREE.Texture | null; amp: number; bgAmp: number; u: number; path: Key[]; f: number; lite: boolean; passFrom: number }> = ({ bg, bgD, fg, fgD, amp, bgAmp, u, path, f, lite, passFrom }) => {
  const { camera } = useThree();
  const seg = lite ? 1 : 2;
  const gBg = useMemo(() => new THREE.PlaneGeometry(2 * (16 / 9) * 1.08, 2 * 1.08, 160 * seg, 90 * seg), [seg]);
  const gFg = useMemo(() => new THREE.PlaneGeometry(2 * (16 / 9) * 1.08, 2 * 1.08, 160 * seg, 90 * seg), [seg]);
  const mBg = useMemo(() => new THREE.ShaderMaterial({ vertexShader: VS, fragmentShader: FS, uniforms: { uMap: { value: null }, uDepth: { value: null }, uAmp: { value: bgAmp }, uBright: { value: 1 } } }), [bgAmp]);
  const mFg = useMemo(() => new THREE.ShaderMaterial({ vertexShader: VS, fragmentShader: FS_A, uniforms: { uMap: { value: null }, uDepth: { value: null }, uAmp: { value: amp }, uFade: { value: 1 } }, transparent: true, side: THREE.DoubleSide }), [amp]);
  mBg.uniforms.uMap.value = bg;
  mBg.uniforms.uDepth.value = bgD;
  mFg.uniforms.uMap.value = fg;
  mFg.uniforms.uDepth.value = fgD;
  // os personagens somem no instante em que a câmera passa por eles (de perto o recorte esticaria)
  mFg.uniforms.uFade.value = interpolate(u, [passFrom, passFrom + 0.08], [1, 0], C);
  const curve = useMemo(() => ({ p: new THREE.CatmullRomCurve3(path.map((k) => new THREE.Vector3(...k.p))), l: new THREE.CatmullRomCurve3(path.map((k) => new THREE.Vector3(...k.l))) }), [path]);
  // tempo da cena → parâmetro da curva pelos `t` dos pontos-chave
  const ts = path.map((k) => k.t);
  let j = 0;
  while (j < ts.length - 2 && u > ts[j + 1]) j++;
  const local = (u - ts[j]) / Math.max(1e-6, ts[j + 1] - ts[j]);
  const cu = (j + Math.min(1, Math.max(0, local))) / (path.length - 1);
  camera.position.copy(curve.p.getPoint(cu));
  camera.lookAt(curve.l.getPoint(cu));
  const dust = useMemo(() => {
    const n = lite ? 200 : 700;
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    return { g, n };
  }, [lite]);
  const pos = dust.g.getAttribute("position") as THREE.BufferAttribute;
  for (let i = 0; i < dust.n; i++) pos.setXYZ(i, (rnd(i * 3 + 1) - 0.5) * 3.4 + Math.sin(f * 0.01 + i) * 0.04, (rnd(i * 5 + 2) - 0.5) * 2 + Math.sin(f * 0.013 + i * 1.7) * 0.05, 0.1 + rnd(i * 7 + 3) * 2.8);
  pos.needsUpdate = true;
  if (!bg || !bgD || !fg || !fgD) return null;
  return (
    <>
      <mesh geometry={gBg} material={mBg} />
      <mesh geometry={gFg} material={mFg} position={[0, 0, 0.004]} />
      <points geometry={dust.g}>
        <pointsMaterial color="#ffe2b8" size={0.006} sizeAttenuation transparent opacity={0.6} blending={THREE.AdditiveBlending} depthWrite={false} />
      </points>
    </>
  );
};

export const HLFly: React.FC<{ life: number; bg: string; bgDepth: string; fg: string; fgDepth: string; amp?: number; bgAmp?: number; path: Key[]; whiteFrom?: number; whiteX?: number; whiteY?: number; passFrom?: number }> = ({ life, bg, bgDepth, fg, fgDepth, amp = 1.1, bgAmp, path, whiteFrom = 0.96, whiteX = 1130, whiteY = 260, passFrom = 0.6 }) => {
  const f = useCurrentFrame();
  const lite = useContext(LiteCtx);
  const tBg = useTex(bg);
  const tBgD = useTex(bgDepth);
  const tFg = useTex(fg);
  const tFgD = useTex(fgDepth);
  const u = interpolate(f, [0, life], [0, 1], { ...C, easing: Easing.inOut(Easing.cubic) });
  const o = interpolate(f, [0, 10], [0, 1], C);
  const wt = interpolate(u, [whiteFrom, 1], [0, 1], { ...C, easing: Easing.in(Easing.quad) });
  return (
    <AbsoluteFill style={{ opacity: o, background: "#000" }}>
      <Canvas3D f={f} lite={lite} fov={FOV} pos={[0, 0, D0]} near={0.02} far={50}>
        <FlyLayers bg={tBg} bgD={tBgD} fg={tFg} fgD={tFgD} amp={amp} bgAmp={bgAmp ?? amp * 0.7} passFrom={passFrom} u={u} path={path} f={f} lite={lite} />
      </Canvas3D>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 80% 75% at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.5) 100%)" }} />
      {/* entra na luz da janela: brilho que cresce do ponto da janela e estoura em branco */}
      {wt > 0 ? <AbsoluteFill style={{ background: `radial-gradient(circle at ${(whiteX / 1920) * 100}% ${(whiteY / 1080) * 100}%, rgba(255,250,240,${Math.min(1, wt * 1.6)}) 0%, rgba(255,246,232,${wt}) ${20 + 60 * wt}%, rgba(255,246,232,${wt * wt}) 100%)` }} /> : null}
    </AbsoluteFill>
  );
};
