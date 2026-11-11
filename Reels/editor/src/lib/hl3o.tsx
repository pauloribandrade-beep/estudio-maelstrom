import React, { useContext, useMemo } from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Canvas3D } from "./hl3j";
import { Actor, SIL, silMat, VARGA_HEAD, VARGA_PARTS } from "./hl3m";
import { AURORA_FS, dot, makeFire, NOISE, tickFire, VS, type Fire } from "./hl3n";
import { LiteCtx } from "./sfx-ctx";

// 3C · A FOGUEIRA em 2.5D: SILHUETA E LUZ. As pessoas são recortes pretos com a borda acesa pelo fogo (o 3D só
// garante a anatomia; nada de rosto, nada de textura). O cenário é feito de CAMADAS desenhadas por código — mata em
// quatro profundidades com uma clareira no meio, serras ao longe, céu com estrelas e aurora — e a câmera anda devagar
// entre elas (paralaxe). A fogueira é a única luz quente: acende a neve e joga as sombras dos dois na direção da câmera.
// Varga à esquerda e Gordon à direita, os dois DE COSTAS, olhando o fogo. Tempos em QUADROS.

const C = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const rndm = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const faceTo = (x: number, z: number, tx = 0, tz = 0) => Math.atan2(tx - x, tz - z);

// céu: degradê frio + estrelas redondas que cintilam
const SKY_VS = `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`;
const SKY_FS = `uniform float uT; varying vec3 vDir;
float h3(vec3 p){ return fract(sin(dot(p, vec3(127.1,311.7,74.7)))*43758.5453); }
void main(){
  float h = vDir.y;
  vec3 col = mix(vec3(.045,.062,.09), vec3(.006,.008,.016), smoothstep(-.02,.45,h));
  vec3 q = vDir * 95.;
  vec3 c = floor(q);
  float r = h3(c);
  if (r > .985) {
    float d = length(fract(q) - .5);
    float tw = .65 + .35 * sin(uT * (1.5 + r * 4.) + r * 60.);
    col += vec3(.78,.84,1.) * smoothstep(.16, .0, d) * ((r - .985) / .015) * tw * smoothstep(.02,.2,h);
  }
  gl_FragColor = vec4(col, 1.);
}`;

// serra ao longe: perfil de ruído, neve no alto, apagada pela distância
const RIDGE_FS = `uniform vec3 uCol; uniform vec3 uTop; uniform float uSeed; uniform float uAmp; varying vec2 vUv;
${NOISE}
void main(){
  float h = .25 + uAmp * (fbm(vec2(vUv.x * 5. + uSeed, uSeed)) * .9 + .25 * abs(sin(vUv.x * 9. + uSeed)));
  float a = smoothstep(h + .004, h - .004, vUv.y);
  if (a < .01) discard;
  float snow = smoothstep(h - .18, h - .02, vUv.y) * smoothstep(.45, .7, fbm(vUv * vec2(60., 14.) + uSeed));
  vec3 col = mix(uCol, uTop, snow * .7);
  gl_FragColor = vec4(col, a);
}`;

// uma faixa de mata: pinheiros em silhueta (camadas de galho em serra), neve no topo de cada camada, clareira no meio
// e o calor do fogo subindo pelo pé das árvores mais perto
const PINES_FS = `uniform vec3 uCol; uniform vec3 uSnow; uniform float uSeed; uniform float uN; uniform float uAsp;
uniform float uGapC; uniform float uGapW; uniform float uWarm; uniform float uFx; uniform float uT; varying vec2 vUv;
${NOISE}
float h1(float x){ return fract(sin(x * 91.7 + uSeed * 13.1) * 43758.5453); }
void main(){
  float u = vUv.x * uN;
  float y = vUv.y;
  float ci = floor(u);
  float a = 0.;
  float sn = 0.;
  for (int k = -2; k <= 2; k++) {
    float c = ci + float(k);
    float cx = c + .5 + (h1(c) - .5) * .7;
    float gap = abs(cx / uN - uGapC);
    if (gap < uGapW * (.7 + .5 * h1(c + 9.))) continue;
    float th = mix(.42, .95, h1(c + 3.));
    float ty = y / th;
    if (ty > 1. || ty < 0.) continue;
    // meia-largura em "células" (corrigida pela proporção da faixa)
    float tiers = 7. + floor(h1(c + 5.) * 5.);
    float ph = 1. - fract(ty * tiers + h1(c + 7.));
    float taper = pow(1. - ty, 1.15);
    float w = taper * (.30 + .22 * h1(c + 11.)) * (.42 + .58 * pow(ph, .8)) * uAsp + .008;
    float jag = (noise(vec2(u * 14., y * 70. + c)) - .5) * .10 * (.3 + ph);
    float dx = abs(u - cx) + jag;
    float tree = smoothstep(w, w - .035, dx);
    float trunk = step(dx, .025) * step(ty, .1);
    float hit = max(tree, trunk);
    if (hit > a) { a = hit; sn = smoothstep(.55, .0, ph) * (.35 + .65 * noise(vec2(u * 30., y * 90.))) * (1. - ty * .3); }
  }
  // o barranco de neve que segura as árvores no chão
  float bank = smoothstep(.06 + .03 * noise(vec2(vUv.x * 20., uSeed)), .04, y);
  a = max(a, bank);
  if (a < .02) discard;
  vec3 col = mix(uCol, uSnow, max(sn, bank * .55));
  float wx = exp(-pow((vUv.x - uFx) * 9., 2.));
  col += vec3(1., .42, .12) * uWarm * wx * pow(1. - y, 7.) * (.85 + .15 * sin(uT * 9.));
  gl_FragColor = vec4(col, a);
}`;

type World = {
  root: THREE.Group;
  fire: Fire;
  far: Fire[];
  sky: THREE.ShaderMaterial;
  aurora: THREE.ShaderMaterial;
  pines: THREE.ShaderMaterial[];
  snow: THREE.Points;
  nSnow: number;
};
const WORLDS = new Map<boolean, World>();
const build = (lite: boolean): World => {
  const root = new THREE.Group();
  // chão: neve azulada, derretida e escura em volta do fogo
  const N = lite ? 90 : 170;
  const gg = new THREE.PlaneGeometry(160, 160, N, N);
  gg.rotateX(-Math.PI / 2);
  const gp = gg.getAttribute("position") as THREE.BufferAttribute;
  const cols: number[] = [];
  const dirt = new THREE.Color("#1d1611");
  const slush = new THREE.Color("#5b5a5c");
  const snowC = new THREE.Color("#c9d3e0");
  for (let i = 0; i < gp.count; i++) {
    const x = gp.getX(i);
    const z = gp.getZ(i);
    const far = Math.min(1, Math.hypot(x, z) / 12);
    gp.setY(i, (Math.sin(x * 0.8) * Math.cos(z * 0.7) * 0.04 + Math.sin(x * 2.1 + z * 1.3) * 0.015) + (Math.sin(x * 0.13) * Math.cos(z * 0.1) * 0.8) * far);
    const k = THREE.MathUtils.smoothstep(Math.hypot(x, z) + (rndm(i) - 0.5) * 0.8, 0.85, 2.6);
    const c = k < 0.5 ? dirt.clone().lerp(slush, k * 2) : slush.clone().lerp(snowC, (k - 0.5) * 2);
    cols.push(c.r, c.g, c.b);
  }
  gg.setAttribute("color", new THREE.Float32BufferAttribute(cols, 3));
  gg.computeVertexNormals();
  const ground = new THREE.Mesh(gg, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.93 }));
  ground.receiveShadow = true;
  root.add(ground);
  // céu
  const sky = new THREE.ShaderMaterial({ vertexShader: SKY_VS, fragmentShader: SKY_FS, uniforms: { uT: { value: 0 } }, side: THREE.BackSide, depthWrite: false, fog: false });
  const skyM = new THREE.Mesh(new THREE.SphereGeometry(260, 48, 24), sky);
  skyM.renderOrder = -10;
  root.add(skyM);
  const aurora = new THREE.ShaderMaterial({ vertexShader: VS, fragmentShader: AURORA_FS, uniforms: { uT: { value: 0 }, uAmp: { value: 0.6 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
  const au = new THREE.Mesh(new THREE.PlaneGeometry(420, 150), aurora);
  au.position.set(-20, 62, -200);
  au.renderOrder = -9;
  root.add(au);
  // serras
  const ridge = (z: number, w: number, h: number, col: string, top: string, seed: number, amp: number) => {
    const m = new THREE.ShaderMaterial({ vertexShader: VS, fragmentShader: RIDGE_FS, uniforms: { uCol: { value: new THREE.Color(col) }, uTop: { value: new THREE.Color(top) }, uSeed: { value: seed }, uAmp: { value: amp } }, transparent: true, depthWrite: false, fog: false });
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
    pl.position.set(0, h / 2 - 2, z);
    pl.renderOrder = -8;
    root.add(pl);
  };
  ridge(-170, 520, 60, "#121a26", "#2b3646", 3.1, 0.55);
  ridge(-110, 360, 34, "#0d131c", "#1f2834", 7.7, 0.5);
  // faixas de mata (longe → perto). x do fogo no uv = 0,5 (as faixas são centradas no fogo)
  const pines: THREE.ShaderMaterial[] = [];
  const band = (z: number, w: number, h: number, n: number, col: string, snow: string, seed: number, gapW: number, warm: number) => {
    const m = new THREE.ShaderMaterial({
      vertexShader: VS,
      fragmentShader: PINES_FS,
      uniforms: {
        uCol: { value: new THREE.Color(col) },
        uSnow: { value: new THREE.Color(snow) },
        uSeed: { value: seed },
        uN: { value: n },
        uAsp: { value: (h / (w / n)) * 0.36 },
        uGapC: { value: 0.5 },
        uGapW: { value: gapW },
        uWarm: { value: warm },
        uFx: { value: 0.5 },
        uT: { value: 0 },
      },
      transparent: true,
      depthWrite: true,
      fog: false,
    });
    pines.push(m);
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
    pl.position.set(0, h / 2 - 0.35, z);
    root.add(pl);
  };
  band(-62, 150, 22, 70, "#152030", "#2c3a4c", 1.3, 0.05, 0.0);
  band(-38, 96, 17, 40, "#0f1722", "#223042", 2.9, 0.09, 0.02);
  band(-22, 62, 14, 26, "#0a1018", "#1a2433", 4.4, 0.13, 0.04);
  band(-12.5, 40, 12, 15, "#06090e", "#121a25", 6.2, 0.2, 0.1);
  // fogueira principal + duas fogueiras do resto do grupo lá atrás (só o brilho)
  const fire = makeFire(1, lite ? 50 : 140, 26, !lite);
  fire.light.distance = 9;
  fire.light.decay = 2;
  (fire.embers.material as THREE.PointsMaterial).size = 0.03;
  root.add(fire.group);
  const far = [
    [-6.2, -8.5, 0.55],
    [5.4, -11, 0.5],
  ].map(([x, z, s]) => {
    const F = makeFire(s, lite ? 20 : 50, 9, false);
    F.group.position.set(x, 0, z);
    root.add(F.group);
    return F;
  });
  const tentM = new THREE.MeshStandardMaterial({ color: "#3a3631", roughness: 0.95, flatShading: true });
  for (const [x, z, r, sc] of [
    [-7.6, -9.6, 0.5, 1],
    [-4.9, -10.1, -0.3, 0.85],
    [6.9, -12.2, -0.6, 1.05],
  ]) {
    const tent = new THREE.Mesh(new THREE.ConeGeometry(1.15 * sc, 1.35 * sc, 4, 1), tentM);
    tent.position.set(x, 0.62 * sc, z);
    tent.rotation.y = Math.PI / 4 + r;
    tent.scale.set(1, 1, 1.6);
    tent.castShadow = true;
    tent.receiveShadow = true;
    root.add(tent);
  }
  root.add(new THREE.HemisphereLight("#2a4262", "#05070a", 0.5));
  const moon = new THREE.DirectionalLight("#86a6d6", 0.75);
  moon.position.set(-14, 16, -18);
  root.add(moon);
  // neve caindo (caixa em volta da câmera)
  const nSnow = lite ? 500 : 1600;
  const fg = new THREE.BufferGeometry();
  fg.setAttribute("position", new THREE.BufferAttribute(new Float32Array(nSnow * 3), 3));
  const snow = new THREE.Points(fg, new THREE.PointsMaterial({ map: dot(), color: "#dfe7f2", size: 0.03, sizeAttenuation: true, transparent: true, opacity: 0.75, depthWrite: false }));
  snow.frustumCulled = false;
  root.add(snow);
  return { root, fire, far, sky, aurora, pines, snow, nSnow };
};

// tronco de sentar: cilindro escuro com a mesma borda de fogo das pessoas
const Log: React.FC<{ x: number; z: number; rot: number }> = ({ x, z, rot }) => {
  const mat = useMemo(() => silMat(new THREE.MeshStandardMaterial()), []);
  return (
    <group position={[x, 0.28, z]} rotation={[0, rot, 0]}>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow material={mat}>
        <cylinderGeometry args={[0.235, 0.25, 0.8, 14]} />
      </mesh>
    </group>
  );
};

const BENCH = "bench_citizens_tk04_male_preidle";
const TALK = "bench_citizens_tk04_male";
const CAMP = "models/hl3c/cit_camp.glb";
const SEAT: [number, number, number] = [-0.88, 0, -0.3];
const VARGA: [number, number] = [-0.66, 1.02];
const GORDON: [number, number] = [0.86, 1.22];

type V3 = [number, number, number];
const lerp3 = (a: V3, b: V3, k: number) => a.map((v, i) => v + (b[i] - v) * k) as V3;

const Scene: React.FC<{ f: number; life: number; lite: boolean; talkAt: number; talkEndAt: number; riseAt: number }> = ({ f, life, lite, talkAt, talkEndAt, riseAt }) => {
  const { camera, scene, gl } = useThree();
  if (!lite && !gl.shadowMap.enabled) {
    gl.shadowMap.enabled = true;
    gl.shadowMap.type = THREE.PCFShadowMap;
  }
  const W = useMemo(() => {
    let w = WORLDS.get(lite);
    if (!w) WORLDS.set(lite, (w = build(lite)));
    return w;
  }, [lite]);
  scene.fog = new THREE.FogExp2("#0a111a", 0.03);
  const t = f / 30;
  // câmera: um plano só, contínuo — empurra devagar entre os dois e, no silêncio, sobe um pouco com as fagulhas
  const k = interpolate(f, [0, life], [0, 1], { ...C, easing: Easing.inOut(Easing.sin) });
  const up = interpolate(f, [riseAt, life], [0, 1], { ...C, easing: Easing.inOut(Easing.sin) });
  const p = lerp3([0.0, 1.22, 4.2], [0.3, 1.05, 3.1], k);
  const l = lerp3([-0.2, 0.7, 0], [-0.1, 0.84, 0], k);
  camera.position.set(p[0] + Math.sin(t * 0.6) * 0.01, p[1] + up * 0.18 + Math.sin(t * 0.8 + 1) * 0.008, p[2]);
  camera.lookAt(l[0], l[1] + up * 0.55, l[2]);
  const pc = camera as THREE.PerspectiveCamera;
  if (pc.fov !== 36) {
    pc.fov = 36;
    pc.updateProjectionMatrix();
  }
  tickFire(W.fire, t, f, 1, camera);
  W.far.forEach((F) => tickFire(F, t, f, 0.8, camera));
  const flick = 0.86 + 0.08 * Math.sin(t * 13.1 + 1) + 0.05 * Math.sin(t * 29.7 + 1);
  SIL.uAmp.value = flick;
  W.sky.uniforms.uT.value = t;
  W.aurora.uniforms.uT.value = t;
  W.pines.forEach((m) => (m.uniforms.uT.value = t));
  const sp = (W.snow.geometry.getAttribute("position") as THREE.BufferAttribute).array as Float32Array;
  for (let n = 0; n < W.nSnow; n++) {
    const bx = 12;
    const by = 7;
    const x = ((rndm(n * 3) * bx + Math.sin(t * 0.5 + n) * 0.2 + t * 0.25 - camera.position.x) % bx + bx) % bx;
    const y = ((rndm(n * 5) * by - t * (0.35 + rndm(n) * 0.25) - camera.position.y) % by + by) % by;
    const z = ((rndm(n * 7) * bx - camera.position.z) % bx + bx) % bx;
    sp[n * 3] = camera.position.x + x - bx / 2;
    sp[n * 3 + 1] = camera.position.y + y - by / 2;
    sp[n * 3 + 2] = camera.position.z + z - bx / 2;
  }
  W.snow.geometry.getAttribute("position").needsUpdate = true;
  // o Varga gesticula só enquanto fala; fora disso o clipe quase para (respira, não posa)
  const ct = 0.4 + t * 0.12 + 0.88 * Math.max(0, Math.min(t, talkEndAt / 30) - talkAt / 30);
  const vf = faceTo(...VARGA);
  const gf = faceTo(...GORDON) - 0.5;
  return (
    <>
      <primitive object={W.root} dispose={null} />
      <Log x={VARGA[0]} z={VARGA[1]} rot={vf} />
      <Actor t={Math.min(ct, 7.6)} clipSrc={CAMP} parts={VARGA_PARTS} head={VARGA_HEAD} clip={TALK} pos={[VARGA[0], 0, VARGA[1]]} rotY={vf} off={SEAT} sil />
      <Log x={GORDON[0]} z={GORDON[1]} rot={gf} />
      <Actor t={1.3 + t * 0.6} parts={["models/hl3c/gordon.glb"]} clip={BENCH} pos={[GORDON[0], 0, GORDON[1]]} rotY={gf} off={SEAT} sil />
    </>
  );
};

// grão de filme + vinheta por cima (o grão muda a cada quadro)
const Grain: React.FC<{ f: number }> = ({ f }) => (
  <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "overlay", opacity: 0.22 }}>
    <svg width="100%" height="100%">
      <filter id={`g${f % 8}`}>
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={f % 97} stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#g${f % 8})`} />
    </svg>
  </AbsoluteFill>
);

export const HLCamp25D: React.FC<{ life: number; talkAt?: number; talkEndAt?: number; riseAt?: number }> = ({ life, talkAt = 1e9, talkEndAt = 1e9, riseAt = 1e9 }) => {
  const f = useCurrentFrame();
  const lite = useContext(LiteCtx);
  return (
    <AbsoluteFill style={{ background: "#03050a" }}>
      <Canvas3D f={f} lite={lite} fov={36} pos={[0.05, 0.98, 3.75]} near={0.05} far={600}>
        <Scene f={f} life={life} lite={lite} talkAt={talkAt} talkEndAt={talkEndAt} riseAt={riseAt} />
      </Canvas3D>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 58%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.7) 100%)", pointerEvents: "none" }} />
      {lite ? null : <Grain f={f} />}
    </AbsoluteFill>
  );
};
