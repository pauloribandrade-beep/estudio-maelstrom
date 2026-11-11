import React, { useContext, useEffect, useMemo } from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Canvas3D } from "./hl3j";
import { Actor, REBEL_A, REBEL_B, REBEL_C, VARGA_HEAD, VARGA_PARTS, useGlbs } from "./hl3m";
import { TitleBlock } from "./hl3";
import { LiteCtx } from "./sfx-ctx";

// 3C · ACAMPAMENTO DA PRIMEIRA NOITE em 3D, com os modelos oficiais do Half-Life: Alyx (public/models/hl3c):
// Varga (cidadão genérico montado, NUNCA um personagem conhecido do jogo) sentado no tronco conversando, Gordon (HEV) SEMPRE DE COSTAS, Eli de pé, o Vortigaunt velho na borda
// da luz; mais duas fogueiras com rebeldes, lonas, caixotes, rádio com antena, cedros do jogo com neve, aurora,
// neblina e neve caindo. O fogo é a única luz quente (com sombra). Câmera em PLANOS (`shots`: {cam, at}) presos na
// fala. Nenhum plano olha o Gordon de frente. Tempos em QUADROS.

let DOT: THREE.Texture | null = null;
export const dot = () => {
  if (DOT) return DOT;
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, "rgba(255,255,255,1)");
  gr.addColorStop(0.35, "rgba(255,255,255,0.85)");
  gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr;
  g.fillRect(0, 0, 64, 64);
  DOT = new THREE.CanvasTexture(c);
  return DOT;
};
const rndm = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// neve por cima: o que olha para cima fica branco (troncos, lonas, pedras, cedros)
const snowify = (m: THREE.Material, k: number) => {
  const s = m as THREE.MeshStandardMaterial;
  s.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nvarying vec3 vSnowN;").replace("#include <beginnormal_vertex>", "#include <beginnormal_vertex>\nvSnowN = normalize(mat3(modelMatrix) * objectNormal);");
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vSnowN;")
      .replace("#include <map_fragment>", `#include <map_fragment>\nfloat snowK = smoothstep(0.3, 0.75, vSnowN.y) * ${k.toFixed(2)};\ndiffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.80, 0.85, 0.92), snowK);`);
  };
  s.customProgramCacheKey = () => "snow" + k.toFixed(2);
};

const prep = (o: THREE.Object3D, snow: number, dark = 1) => {
  o.traverse((x) => {
    const m = x as THREE.Mesh;
    if (!m.isMesh) return;
    m.frustumCulled = false;
    m.castShadow = true;
    m.receiveShadow = true;
    const one = (mt: THREE.Material) => {
      const c = (mt as THREE.MeshStandardMaterial).clone();
      c.envMapIntensity = 0.1;
      if (dark !== 1 && c.color) c.color.multiplyScalar(dark);
      if (snow > 0) snowify(c, snow);
      return c;
    };
    m.material = Array.isArray(m.material) ? m.material.map(one) : one(m.material);
  });
};

// objeto estático do jogo (caixote, tronco, lona, rádio…)
export const Prop: React.FC<{ src: string; pos?: [number, number, number]; rot?: [number, number, number]; scale?: number | [number, number, number]; snow?: number; dark?: number }> = ({ src, pos = [0, 0, 0], rot = [0, 0, 0], scale = 1, snow = 0, dark = 1 }) => {
  const [gs, release] = useGlbs([src]);
  const { gl, scene, camera } = useThree();
  const obj = useMemo(() => {
    if (!gs) return null;
    const o = gs[0].scene.clone(true);
    prep(o, snow, dark);
    return o;
  }, [gs, snow, dark]);
  useEffect(() => {
    if (!obj) return;
    gl.render(scene, camera);
    release();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [obj]);
  if (!obj) return null;
  return <primitive object={obj} position={pos} rotation={rot} scale={scale} dispose={null} />;
};

// floresta: cedros do Alyx (3 tamanhos + um seco) espalhados em anel, montada uma vez só
const P = "models/hl3c/";
const CEDARS = [P + "cedro1.glb", P + "cedro2.glb", P + "cedro3.glb", P + "cedro_morto.glb"];
const FORESTS = new Map<boolean, THREE.Group>();
const Forest: React.FC<{ lite: boolean }> = ({ lite }) => {
  const [gs, release] = useGlbs(CEDARS);
  const { gl, scene, camera } = useThree();
  const group = useMemo(() => {
    if (!gs) return null;
    let g = FORESTS.get(lite);
    if (g) return g;
    g = new THREE.Group();
    const bases = gs.map((x) => {
      const o = x.scene.clone(true);
      prep(o, 0.55, 0.85);
      return o;
    });
    const N = lite ? 60 : 130;
    let k = 0;
    for (let i = 0; k < N && i < N * 4; i++) {
      const a = rndm(i * 11 + 3) * Math.PI * 2;
      const r = 9 + Math.pow(rndm(i * 13 + 5), 0.8) * 42;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      if (z > 3 && Math.abs(x) < 9) continue; // o lado da câmera fica aberto
      if (Math.hypot(x + 6.5, z + 7) < 4.5 || Math.hypot(x - 7, z + 9) < 4.5) continue; // as outras fogueiras
      const big = r > 20 ? (rndm(i * 7) > 0.35 ? 2 : 0) : rndm(i * 7) > 0.85 ? 3 : rndm(i * 9) > 0.5 ? 0 : 1;
      const t = bases[big].clone(true);
      t.position.set(x, -0.1, z);
      t.rotation.y = rndm(i * 17) * 6.28;
      t.scale.setScalar((big === 2 ? 0.8 : 1.1) + rndm(i * 19) * 0.6);
      g.add(t);
      k++;
    }
    FORESTS.set(lite, g);
    return g;
  }, [gs, lite]);
  useEffect(() => {
    if (!group) return;
    gl.render(scene, camera);
    release();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group]);
  if (!group) return null;
  return <primitive object={group} dispose={null} />;
};

export const NOISE = `
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
float noise(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1.,0.)),u.x), mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),u.x), u.y); }
float fbm(vec2 p){ float v=0., a=.5; for(int i=0;i<5;i++){ v+=a*noise(p); p*=2.03; a*=.5; } return v; }`;
export const VS = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`;
const FLAME_FS = `
uniform float uT; uniform float uAmp; uniform float uSeed; varying vec2 vUv;
${NOISE}
void main(){
  vec2 p = vec2((vUv.x - .5) * 2., vUv.y);
  float n1 = fbm(vec2(p.x * 2.6 + uSeed, p.y * 3.2 - uT * 2.4));
  float n2 = fbm(vec2(p.x * 6.5 - uSeed, p.y * 7.5 - uT * 4.6));
  // a chama sobe torcida: o desvio cresce com a altura
  float x = p.x + (n1 - .5) * 1.1 * p.y + (n2 - .5) * .25 * p.y;
  float w = mix(.85, .05, pow(clamp(p.y, 0., 1.), .8));
  float body = 1. - smoothstep(.15, 1., abs(x) / w);
  // pontas que se soltam: o topo é recortado pelo ruído
  float top = .45 + n1 * .55;
  body *= 1. - smoothstep(top - .35, top, p.y + (n2 - .5) * .3);
  body *= smoothstep(.0, .12, p.y);
  float h = clamp(body * 1.25 * uAmp, 0., 1.);
  vec3 col = vec3(.55, .08, .01) * smoothstep(.0, .35, h);
  col = mix(col, vec3(1., .42, .06), smoothstep(.25, .6, h));
  col = mix(col, vec3(1., .82, .45), smoothstep(.6, .92, h));
  float a = smoothstep(.02, .5, h);
  gl_FragColor = vec4(col * a * 1.5, a);
}`;
const GLOW_FS = `uniform float uAmp; varying vec2 vUv;
void main(){ float r = length(vUv - .5) * 2.; float g = exp(-r * r * 3.) * uAmp; gl_FragColor = vec4(vec3(1., .46, .14) * g * .6, g); }`;
// fumaça: borrão escuro que sobe, abre e some
const SMOKE_FS = `uniform float uT; uniform float uA; uniform float uSeed; varying vec2 vUv;
${NOISE}
void main(){ vec2 p = vUv - .5; float r = length(p) * 2.;
  float n = fbm(vUv * 3. + vec2(uSeed, -uT * .25));
  float a = (1. - smoothstep(.2, 1., r + (n - .5) * .7)) * uA;
  gl_FragColor = vec4(vec3(.09, .085, .08) + n * .05, a * .55); }`;
// brasas no pé do fogo
const COAL_FS = `uniform float uT; varying vec2 vUv;
${NOISE}
void main(){ float r = length(vUv - .5) * 2.; float n = fbm(vUv * 9. + vec2(uT * .3, 0.));
  float g = (1. - smoothstep(.3, 1., r)) * smoothstep(.35, .75, n + .15 * sin(uT * 3. + vUv.x * 20.));
  gl_FragColor = vec4(vec3(1., .32, .05) * g * 1.6, g); }`;
export const AURORA_FS = `
uniform float uT; uniform float uAmp; varying vec2 vUv;
${NOISE}
void main(){
  vec3 acc = vec3(0.);
  for (int k = 0; k < 3; k++) {
    float fk = float(k);
    float base = .40 + .1 * sin(vUv.x * 2.4 + fk * 1.7 + uT * .05) + .05 * sin(vUv.x * 7.3 + uT * .11 + fk);
    float dy = vUv.y - base;
    float rays = .5 + .5 * fbm(vec2(vUv.x * 40. + fk * 10., uT * .08));
    float curtain = dy > 0. ? exp(-dy * (8. + fk * 4.)) : exp(dy * 70.);
    vec3 c = mix(vec3(.15, 1., .55), vec3(.25, .8, 1.), clamp(dy * 3., 0., 1.));
    c = mix(c, vec3(.55, .3, 1.), clamp(dy * 1.6 - .3, 0., 1.));
    acc += c * curtain * rays * (1. - fk * .25);
  }
  float edge = smoothstep(0., .18, vUv.x) * smoothstep(1., .82, vUv.x);
  gl_FragColor = vec4(acc * .45 * uAmp * edge, 1.);
}`;

export type Fire = { group: THREE.Group; mats: THREE.ShaderMaterial[]; glow: THREE.ShaderMaterial; coal: THREE.ShaderMaterial; smoke: { m: THREE.Mesh; mat: THREE.ShaderMaterial }[]; light: THREE.PointLight; embers: THREE.Points; n: number; base: number; scale: number };
export const makeFire = (scale: number, nEmb: number, base: number, shadow: boolean): Fire => {
  const group = new THREE.Group();
  const mats: THREE.ShaderMaterial[] = [];
  for (let k = 0; k < 6; k++) {
    const m = new THREE.ShaderMaterial({ vertexShader: VS, fragmentShader: FLAME_FS, uniforms: { uT: { value: 0 }, uAmp: { value: 1 }, uSeed: { value: k * 3.7 + scale * 5 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
    mats.push(m);
    const big = k < 3;
    const pl = new THREE.Mesh(new THREE.PlaneGeometry((big ? 0.8 - k * 0.1 : 0.42) * scale, (big ? 1.35 - k * 0.15 : 0.75) * scale), m);
    pl.position.set(big ? 0 : Math.cos(k * 2.1) * 0.16 * scale, (big ? 0.66 - k * 0.06 : 0.4) * scale, big ? 0 : Math.sin(k * 2.1) * 0.16 * scale);
    pl.rotation.y = (k * Math.PI) / 3 + k * 0.4;
    group.add(pl);
  }
  const glow = new THREE.ShaderMaterial({ vertexShader: VS, fragmentShader: GLOW_FS, uniforms: { uAmp: { value: 1 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const gm = new THREE.Mesh(new THREE.PlaneGeometry(3.6 * scale, 3.6 * scale), glow);
  gm.position.y = 0.6 * scale;
  gm.name = "billboard";
  group.add(gm);
  const coal = new THREE.ShaderMaterial({ vertexShader: VS, fragmentShader: COAL_FS, uniforms: { uT: { value: 0 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const cm = new THREE.Mesh(new THREE.CircleGeometry(0.42 * scale, 24), coal);
  cm.rotation.x = -Math.PI / 2;
  cm.position.y = 0.035;
  group.add(cm);
  const smoke: Fire["smoke"] = [];
  for (let k = 0; k < 5; k++) {
    const mat = new THREE.ShaderMaterial({ vertexShader: VS, fragmentShader: SMOKE_FS, uniforms: { uT: { value: 0 }, uA: { value: 0 }, uSeed: { value: k * 5.1 + scale } }, transparent: true, depthWrite: false });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
    m.name = "billboard";
    group.add(m);
    smoke.push({ m, mat });
  }
  const light = new THREE.PointLight("#ff8a33", base, 18 * scale, 1.6);
  light.position.y = 0.75 * scale;
  if (shadow) {
    light.castShadow = true;
    light.shadow.mapSize.set(1024, 1024);
    light.shadow.bias = -0.004;
    light.shadow.radius = 3;
    light.shadow.camera.near = 0.1;
    light.shadow.camera.far = 30;
  }
  group.add(light);
  const eg = new THREE.BufferGeometry();
  eg.setAttribute("position", new THREE.BufferAttribute(new Float32Array(nEmb * 3), 3));
  const embers = new THREE.Points(eg, new THREE.PointsMaterial({ map: dot(), color: "#ffb14a", size: 0.05 * scale, sizeAttenuation: true, transparent: true, opacity: 0.95, depthWrite: false, blending: THREE.AdditiveBlending }));
  embers.frustumCulled = false;
  group.add(embers);
  const stoneG = new THREE.DodecahedronGeometry(0.13 * scale, 0);
  const stoneM = new THREE.MeshStandardMaterial({ color: "#2b2724", roughness: 0.96, flatShading: true });
  for (let i = 0; i < 15; i++) {
    const a = (i / 15) * Math.PI * 2 + rndm(i * 2) * 0.2;
    const st = new THREE.Mesh(stoneG, stoneM);
    const r = (0.58 + rndm(i * 9) * 0.08) * scale;
    st.position.set(Math.cos(a) * r, 0.02 * scale, Math.sin(a) * r);
    st.scale.set(0.9 + rndm(i) * 0.7, 0.45 + rndm(i * 3) * 0.35, 0.8 + rndm(i * 5) * 0.5);
    st.rotation.set(rndm(i), rndm(i + 1) * 3, 0);
    st.castShadow = true;
    st.receiveShadow = true;
    group.add(st);
  }
  // lenha baixa cruzada (fogo que já queimou um tempo): toras carbonizadas deitadas em estrela, a ponta de dentro
  // levantada sobre as outras; o brilho vem só das brasas no chão e da luz do fogo
  const logM = new THREE.MeshStandardMaterial({ color: "#16100b", roughness: 0.97 });
  const tipM = new THREE.MeshStandardMaterial({ color: "#1a0d06", roughness: 0.9, emissive: new THREE.Color("#ff4a0a"), emissiveIntensity: 0.55 });
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + 0.5 + rndm(i * 4) * 0.3;
    const L = (0.62 + rndm(i * 6) * 0.18) * scale;
    const r = (0.05 + rndm(i * 8) * 0.02) * scale;
    const lg = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.1, L, 9), logM);
    body.rotation.z = Math.PI / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    lg.add(body);
    // a ponta que está no fogo fica em brasa
    const tip = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.92, r, L * 0.22, 9), tipM);
    tip.rotation.z = Math.PI / 2;
    tip.position.x = -L * 0.4;
    lg.add(tip);
    const c = 0.26 * scale;
    lg.position.set(Math.cos(a) * c, r + 0.06 * scale, Math.sin(a) * c);
    lg.rotation.y = -a + Math.PI;
    lg.rotateZ(-0.16);
    group.add(lg);
  }
  return { group, mats, glow, coal, smoke, light, embers, n: nEmb, base, scale };
};
export const tickFire = (F: Fire, t: number, f: number, amp: number, cam: THREE.Camera) => {
  const flick = 0.82 + 0.1 * Math.sin(t * 13.1 + F.scale) + 0.06 * Math.sin(t * 29.7 + 1) + 0.05 * (rndm(Math.floor(f / 2) + F.scale * 10) - 0.5);
  F.mats.forEach((m) => {
    m.uniforms.uT.value = t;
    m.uniforms.uAmp.value = amp;
  });
  F.coal.uniforms.uT.value = t;
  F.glow.uniforms.uAmp.value = flick * amp;
  F.light.intensity = F.base * flick * amp;
  F.group.children.forEach((c) => {
    if (c.name === "billboard") c.quaternion.copy(cam.quaternion);
  });
  F.smoke.forEach(({ m, mat }, k) => {
    const ph = (t / 5.5 + k / F.smoke.length) % 1;
    const s = (0.5 + ph * 2.2) * F.scale;
    m.scale.set(s, s, 1);
    m.position.set(Math.sin(ph * 3 + k) * 0.25 * F.scale + ph * 0.6, (1.3 + ph * 3.2) * F.scale, Math.cos(k) * 0.1);
    mat.uniforms.uT.value = t + k * 3;
    mat.uniforms.uA.value = Math.sin(ph * Math.PI) * 0.8;
  });
  const pos = (F.embers.geometry.getAttribute("position") as THREE.BufferAttribute).array as Float32Array;
  for (let i = 0; i < F.n; i++) {
    const per = 1.6 + rndm(i * 3) * 2.2;
    const ph = (t / per + rndm(i * 7)) % 1;
    const a = rndm(i * 11) * 6.28 + t * (0.6 + rndm(i) * 0.8);
    const r = (0.06 + ph * (0.25 + rndm(i * 13) * 0.5)) * F.scale;
    pos[i * 3] = Math.cos(a) * r + ph * ph * 0.5;
    pos[i * 3 + 1] = (0.3 + ph * (2.0 + rndm(i * 5) * 2.4)) * F.scale;
    pos[i * 3 + 2] = Math.sin(a) * r;
  }
  F.embers.geometry.getAttribute("position").needsUpdate = true;
};

// textura de relevo da neve (pegadas, ondulação)
const snowBump = () => {
  const S = 256;
  const d = new Uint8Array(S * S * 4);
  const vn = (x: number, y: number, p: number) => {
    const xi = Math.floor(x) % p;
    const yi = Math.floor(y) % p;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    const h = (a: number, b: number) => rndm(((a + p) % p) * 157 + ((b + p) % p) * 311);
    const u = xf * xf * (3 - 2 * xf);
    const v = yf * yf * (3 - 2 * yf);
    return (h(xi, yi) * (1 - u) + h(xi + 1, yi) * u) * (1 - v) + (h(xi, yi + 1) * (1 - u) + h(xi + 1, yi + 1) * u) * v;
  };
  for (let y = 0; y < S; y++)
    for (let x = 0; x < S; x++) {
      const n = 0.5 * vn((x / S) * 8, (y / S) * 8, 8) + 0.3 * vn((x / S) * 32, (y / S) * 32, 32) + 0.2 * vn((x / S) * 128, (y / S) * 128, 128);
      const v = Math.round(n * 255);
      d.set([v, v, v, 255], (y * S + x) * 4);
    }
  const tx = new THREE.DataTexture(d, S, S);
  tx.wrapS = tx.wrapT = THREE.RepeatWrapping;
  tx.repeat.set(36, 36);
  tx.needsUpdate = true;
  return tx;
};

const FIRES: [number, number, number][] = [
  [0, 0, 1],
  [-6.5, -7, 0.75],
  [7, -9, 0.7],
];
type Env = { root: THREE.Group; fires: Fire[]; aurora: THREE.ShaderMaterial; snow: THREE.Points; nSnow: number; beacon: THREE.PointLight; beaconDot: THREE.Mesh };
const ENVS = new Map<boolean, Env>();
const buildEnv = (lite: boolean): Env => {
  const root = new THREE.Group();
  const N = lite ? 90 : 200;
  const gg = new THREE.PlaneGeometry(140, 140, N, N);
  gg.rotateX(-Math.PI / 2);
  const gp = gg.getAttribute("position") as THREE.BufferAttribute;
  const cols: number[] = [];
  const dirt = new THREE.Color("#241c15");
  const slush = new THREE.Color("#6d6a66");
  const snow = new THREE.Color("#d5dde6");
  for (let i = 0; i < gp.count; i++) {
    const x = gp.getX(i);
    const z = gp.getZ(i);
    const far = Math.min(1, Math.hypot(x, z) / 10);
    gp.setY(i, (Math.sin(x * 0.7) * Math.cos(z * 0.6) + Math.sin(x * 2.3 + z * 1.7) * 0.3) * 0.05 + (Math.sin(x * 0.11) * Math.cos(z * 0.09) * 0.9 + Math.sin(x * 0.05 + 1) * 0.8) * far);
    let k = 1;
    for (const [fx, fz, fs] of FIRES) k = Math.min(k, THREE.MathUtils.smoothstep(Math.hypot(x - fx, z - fz) + (rndm(i) - 0.5) * 1.0, 0.9 * fs, 3.4 * fs));
    const c = k < 0.5 ? dirt.clone().lerp(slush, k * 2) : slush.clone().lerp(snow, (k - 0.5) * 2);
    cols.push(c.r, c.g, c.b);
  }
  gg.setAttribute("color", new THREE.Float32BufferAttribute(cols, 3));
  gg.computeVertexNormals();
  const ground = new THREE.Mesh(gg, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, bumpMap: snowBump(), bumpScale: 0.9 }));
  ground.receiveShadow = true;
  root.add(ground);
  const fires = FIRES.map(([x, z, s], k) => {
    const F = makeFire(s, lite ? 50 : k === 0 ? 260 : 90, k === 0 ? 34 : 16, k === 0 && !lite);
    F.group.position.set(x, 0, z);
    root.add(F.group);
    return F;
  });
  const aurora = new THREE.ShaderMaterial({ vertexShader: VS, fragmentShader: AURORA_FS, uniforms: { uT: { value: 0 }, uAmp: { value: 1 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
  const au = new THREE.Mesh(new THREE.PlaneGeometry(320, 130), aurora);
  au.position.set(0, 55, -120);
  root.add(au);
  const NS = lite ? 300 : 1100;
  const sp = new Float32Array(NS * 3);
  for (let i = 0; i < NS; i++) {
    const a = rndm(i * 3) * Math.PI - Math.PI;
    const e = 0.12 + rndm(i * 5) * 1.3;
    sp.set([Math.cos(a) * Math.cos(e) * 170, Math.sin(e) * 170, Math.sin(a) * Math.cos(e) * 170], i * 3);
  }
  const sg = new THREE.BufferGeometry();
  sg.setAttribute("position", new THREE.BufferAttribute(sp, 3));
  root.add(new THREE.Points(sg, new THREE.PointsMaterial({ map: dot(), color: "#cfd8ff", size: 0.55, sizeAttenuation: true, transparent: true, opacity: 0.75, depthWrite: false, fog: false })));
  const moon = new THREE.DirectionalLight("#8fb0d8", 0.32);
  moon.position.set(-20, 30, -10);
  root.add(moon);
  root.add(new THREE.HemisphereLight("#1f3047", "#06080b", 0.5));
  // neve caindo (caixa em volta da câmera, posicionada a cada quadro)
  const nSnow = lite ? 500 : 1800;
  const fg = new THREE.BufferGeometry();
  fg.setAttribute("position", new THREE.BufferAttribute(new Float32Array(nSnow * 3), 3));
  const snowP = new THREE.Points(fg, new THREE.PointsMaterial({ map: dot(), color: "#dfe7f2", size: 0.035, sizeAttenuation: true, transparent: true, opacity: 0.8, depthWrite: false }));
  snowP.frustumCulled = false;
  root.add(snowP);
  // luz azul fria lá no fundo da mata (só no plano quieto, antes do ataque)
  const beacon = new THREE.PointLight("#5fb6ff", 0, 14, 1.5);
  beacon.position.set(7, 1.6, -26);
  root.add(beacon);
  const beaconDot = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), new THREE.MeshBasicMaterial({ color: "#bfe6ff", transparent: true, opacity: 0, fog: false }));
  beaconDot.position.copy(beacon.position);
  root.add(beaconDot);
  return { root, fires, aurora, snow: snowP, nSnow, beacon, beaconDot };
};

const faceTo = (x: number, z: number, tx = 0, tz = 0) => Math.atan2(tx - x, tz - z);
type V3 = [number, number, number];
const BENCH = "bench_citizens_tk04_male_preidle";
const TALK = "bench_citizens_tk04_male";
const CAMP = P + "cit_camp.glb";
// quadril dos clipes de banco: (0,88 ; 0,655 ; 0,39) no espaço do modelo → puxa de volta para cima do tronco
const SEAT: V3 = [-0.88, 0, -0.3];
// o clipe de conversa só fica SENTADO até ~8 s (depois ele levanta e vai embora): vai e volta dentro desse trecho
const talkT = (t: number) => {
  const a = 0.4;
  const b = 7.8;
  const p = (t % (2 * (b - a))) ;
  return a + (p < b - a ? p : 2 * (b - a) - p);
};
// lugares em volta da fogueira principal (o fogo em 0,0)
const VARGA: [number, number] = [-1.0, -1.35];
const GORDON: [number, number] = [0.7, 1.5];
const ELI: [number, number] = [1.15, -1.95];
const VORT: [number, number] = [2.35, -0.45];

type Cam = { from: V3; to: V3; lookFrom: V3; lookTo: V3; fov?: number };
// planos de câmera (nenhum deles vê o rosto do Gordon: ele olha para -z, a câmera fica atrás ou de lado)
const CAMS: Record<string, Cam> = {
  // de cima das árvores, com a aurora, descendo até o acampamento
  crane: { from: [4, 12, 17], to: [5.6, 2.5, 7.8], lookFrom: [0, 6, -14], lookTo: [0, 0.8, -1], fov: 40 },
  // por cima do ombro do Gordon: o Varga do outro lado, falando
  ots: { from: [1.9, 1.62, 3.55], to: [1.65, 1.55, 3.05], lookFrom: [-0.7, 0.95, -1.2], lookTo: [-0.8, 0.98, -1.25], fov: 34 },
  // o rosto do Varga olhando o fogo
  varga: { from: [-0.25, 1.05, 0.15], to: [-0.4, 1.06, -0.25], lookFrom: [-1.0, 1.08, -1.35], lookTo: [-1.0, 1.1, -1.35], fov: 30 },
  // o fogo de perto, a câmera sobe com as fagulhas até o céu
  embers: { from: [-1.6, 0.45, 1.25], to: [-1.75, 0.9, 1.45], lookFrom: [0, 0.45, 0], lookTo: [0.4, 4.2, -2.5], fov: 36 },
  // baixo, pela esquerda: o Varga de perfil, o fogo, o Vortigaunt no escuro ao fundo
  side: { from: [-3.0, 0.55, 0.35], to: [-2.45, 0.6, 0.05], lookFrom: [0.2, 0.8, -0.9], lookTo: [0.3, 0.82, -0.8], fov: 34 },
  // afasta e sobe: o acampamento inteiro quieto em volta da conversa
  pull: { from: [-2.6, 1.3, 2.6], to: [-6.5, 4.2, 8.5], lookFrom: [0, 0.8, -0.8], lookTo: [0.5, 0.6, -2.5], fov: 38 },
  // o acampamento quieto; a câmera avança devagar para a mata escura
  // diagnóstico (não usar na edição)
  dbg_top: { from: [0.01, 9, 0.6], to: [0.01, 9, 0.6], lookFrom: [0, 0, 0], lookTo: [0, 0, 0], fov: 40 },
  dbg_front: { from: [0, 1.4, 5.5], to: [0, 1.4, 5.5], lookFrom: [0, 0.7, 0], lookTo: [0, 0.7, 0], fov: 45 },
  quiet: { from: [-3.6, 2.3, 10], to: [-2.6, 1.9, 7.2], lookFrom: [1, 1.1, -10], lookTo: [3.5, 1.2, -18], fov: 38 },
};
const C = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const lerp3 = (a: V3, b: V3, k: number) => a.map((v, i) => v + (b[i] - v) * k) as V3;

const CampScene: React.FC<{ f: number; lite: boolean; shots: { cam: string; at: number }[]; life: number; calm: boolean }> = ({ f, lite, shots, life, calm }) => {
  const { camera, scene, gl } = useThree();
  if (!lite && !gl.shadowMap.enabled) {
    gl.shadowMap.enabled = true;
    gl.shadowMap.type = THREE.PCFSoftShadowMap;
  }
  const W = useMemo(() => {
    let w = ENVS.get(lite);
    if (!w) ENVS.set(lite, (w = buildEnv(lite)));
    return w;
  }, [lite]);
  scene.fog = new THREE.FogExp2("#070a10", 0.04);
  const t = f / 30;
  // plano atual
  let i = 0;
  for (let k = 0; k < shots.length; k++) if (f >= shots[k].at) i = k;
  const s0 = shots[i]?.at ?? 0;
  const s1 = shots[i + 1]?.at ?? life;
  const cam = CAMS[shots[i]?.cam ?? "crane"] ?? CAMS.crane;
  const k = interpolate(f, [s0, Math.max(s0 + 1, s1)], [0, 1], { ...C, easing: Easing.inOut(Easing.sin) });
  const p = lerp3(cam.from, cam.to, k);
  const l = lerp3(cam.lookFrom, cam.lookTo, k);
  // leve respiração de câmera na mão
  camera.position.set(p[0] + Math.sin(t * 0.7) * 0.012, p[1] + Math.sin(t * 0.9 + 1) * 0.01, p[2]);
  camera.lookAt(l[0], l[1], l[2]);
  const pc = camera as THREE.PerspectiveCamera;
  if (pc.fov !== (cam.fov ?? 38)) {
    pc.fov = cam.fov ?? 38;
    pc.updateProjectionMatrix();
  }
  W.fires.forEach((F, n) => tickFire(F, t, f, calm ? (n === 0 ? 0.7 : 0.55) : 1, camera));
  W.aurora.uniforms.uT.value = t;
  // neve caindo em volta da câmera
  const sp = (W.snow.geometry.getAttribute("position") as THREE.BufferAttribute).array as Float32Array;
  for (let n = 0; n < W.nSnow; n++) {
    const bx = 14;
    const by = 8;
    const x = ((rndm(n * 3) * bx + Math.sin(t * 0.5 + n) * 0.2 + t * 0.35 - camera.position.x) % bx + bx) % bx;
    const y = ((rndm(n * 5) * by - t * (0.45 + rndm(n) * 0.3) - camera.position.y) % by + by) % by;
    const z = ((rndm(n * 7) * bx - camera.position.z) % bx + bx) % bx;
    sp[n * 3] = camera.position.x + x - bx / 2;
    sp[n * 3 + 1] = camera.position.y + y - by / 2;
    sp[n * 3 + 2] = camera.position.z + z - bx / 2;
  }
  W.snow.geometry.getAttribute("position").needsUpdate = true;
  // a luz azul no fundo da mata: só no fim do plano quieto
  const bz = calm ? interpolate(f, [life * 0.62, life * 0.8], [0, 1], C) * (0.6 + 0.4 * Math.sin(t * 2.3)) : 0;
  W.beacon.intensity = bz * 6;
  (W.beaconDot.material as THREE.MeshBasicMaterial).opacity = bz;
  const vf = faceTo(...VARGA);
  const gf = faceTo(...GORDON);
  const lg = (x: number, z: number, r: number, sx = 0.95): React.ReactNode => <Prop src={P + "tronco.glb"} pos={[x, 0.27, z]} rot={[0, r, 0]} scale={[sx, 1.9, 1.9]} snow={0.45} dark={0.55} />;
  return (
    <>
      <primitive object={W.root} dispose={null} />
      <Forest lite={lite} />
      {/* fogueira principal: Varga, Gordon (de costas), Eli, o Vortigaunt velho */}
      {lg(VARGA[0], VARGA[1], vf)}
      <Actor t={calm ? t + 20 : talkT(t + 1)} clipSrc={calm ? undefined : CAMP} parts={VARGA_PARTS} head={VARGA_HEAD} clip={calm ? BENCH : TALK} pos={[VARGA[0], 0, VARGA[1]]} rotY={vf} off={SEAT} />
      {lg(GORDON[0], GORDON[1], gf)}
      <Actor t={t + 1.3} parts={[P + "gordon.glb"]} clip={BENCH} pos={[GORDON[0], 0, GORDON[1]]} rotY={gf} off={SEAT} />
      <Actor t={t} parts={[P + "eli.glb"]} clip="idle_subtle" pos={[ELI[0], 0.06, ELI[1]]} rotY={faceTo(...ELI)} />
      <Actor t={1.2 + t * 0.12} clipSrc={P + "vort.glb"} parts={[P + "vort.glb"]} clip="vort_substation_pre_idle_aligned" pos={[VORT[0], 0, VORT[1]]} rotY={faceTo(...VORT)} scale={1.05} />
      <Prop src={P + "chaleira.glb"} pos={[0.66, 0.12, 0.22]} rot={[0, 1.1, 0]} />
      <Prop src={P + "panela.glb"} pos={[-0.55, 0.1, 0.45]} rot={[0, 0.4, 0]} />
      <Prop src={P + "lenha.glb"} pos={[-1.5, 0.01, 0.95]} rot={[0, 0.8, 0]} scale={0.8} snow={0.3} />
      {/* equipamento improvisado: caixotes, rádio, antena, lonas, sacos de dormir */}
      <Prop src={P + "lona2.glb"} pos={[-4.4, 2.55, -3.5]} rot={[0.12, 0.55, 0]} snow={0.5} />
      <Prop src={P + "lona2.glb"} pos={[3.9, 2.55, -4.6]} rot={[0.12, -0.5, 0]} snow={0.5} />
      <Prop src={P + "saco_dormir.glb"} pos={[-3.7, 0.12, -2.3]} rot={[0, 0.5, 0]} snow={0.2} />
      <Prop src={P + "saco_dormir.glb"} pos={[3.3, 0.12, -3.4]} rot={[0, -0.6, 0]} snow={0.2} />
      <Prop src={P + "caixote.glb"} pos={[-2.9, 0, -3.0]} rot={[0, 0.35, 0]} snow={0.5} />
      <Prop src={P + "caixote.glb"} pos={[-2.25, 0, -3.25]} rot={[0, 0.1, 0]} snow={0.5} />
      <Prop src={P + "caixote.glb"} pos={[-2.6, 0.39, -3.1]} rot={[0, 0.6, 0]} snow={0.5} />
      <Prop src={P + "radio.glb"} pos={[-2.55, 0.78, -3.05]} rot={[0, 0.9, 0]} />
      <Prop src={P + "radio2.glb"} pos={[-2.2, 0.39, -3.2]} rot={[0, 0.2, 0]} />
      <mesh position={[-2.2, 1.6, -3.4]} castShadow>
        <cylinderGeometry args={[0.012, 0.02, 3.2, 6]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.6} roughness={0.5} />
      </mesh>
      <Prop src={P + "cobertor.glb"} pos={[2.2, 0.12, 1.5]} rot={[0, 0.7, 0]} snow={0.2} />
      <Prop src={P + "barril.glb"} pos={[-3.6, 0, 0.6]} rot={[0, 1, 0]} snow={0.6} />
      <Prop src={P + "rochedo.glb"} pos={[-5.2, 0.3, 1.6]} rot={[0, 0.5, 0]} scale={1.3} snow={0.8} />
      <Prop src={P + "rochedo.glb"} pos={[5.9, 0.1, -1.8]} rot={[0, 2.2, 0]} scale={1.6} snow={0.8} />
      <Prop src={P + "pedra1.glb"} pos={[-9, -0.1, -2]} rot={[0, 1.2, 0]} snow={0.8} />
      <Prop src={P + "pedra2.glb"} pos={[9.5, -0.1, 3]} rot={[0, 0.4, 0]} snow={0.8} />
      <Prop src={P + "arvore_inverno.glb"} pos={[-10, 0, -5]} rot={[0, 1, 0]} scale={0.8} snow={0.6} />
      <Prop src={P + "arvore_inverno.glb"} pos={[11, 0, -2]} rot={[0, 2, 0]} scale={0.9} snow={0.6} />
      {/* segunda fogueira: três rebeldes */}
      {lg(-7.1, -6.3, faceTo(-7.1, -6.3, -6.5, -7), 0.7)}
      <Actor t={t + 9} parts={[P + "citvault.glb"]} clip={BENCH} pos={[-7.1, 0, -6.3]} rotY={faceTo(-7.1, -6.3, -6.5, -7)} off={SEAT} />
      {lg(-5.7, -6.6, faceTo(-5.7, -6.6, -6.5, -7), 0.7)}
      <Actor t={t + 31} parts={REBEL_B} head={P + "tex/head_caucasian30.jpg"} clip={BENCH} pos={[-5.7, 0, -6.6]} rotY={faceTo(-5.7, -6.6, -6.5, -7)} off={SEAT} />
      <Actor t={t + 2} parts={REBEL_C} head={P + "tex/head_asian50.jpg"} clip="idle_subtle" pos={[-6.3, 0, -8.1]} rotY={faceTo(-6.3, -8.1, -6.5, -7)} />
      {/* terceira fogueira: um sentado, um de guarda olhando a mata */}
      {lg(6.3, -8.4, faceTo(6.3, -8.4, 7, -9), 0.7)}
      <Actor t={t + 50} parts={REBEL_A} head={P + "tex/head_black30.jpg"} clip={BENCH} pos={[6.3, 0, -8.4]} rotY={faceTo(6.3, -8.4, 7, -9)} off={SEAT} />
      <Actor t={t + 4} parts={[P + "citvault.glb"]} clip="idle_subtle" pos={[8.1, 0, -10.2]} rotY={faceTo(8.1, -10.2, 10, -16)} />
    </>
  );
};

export const HLCamp3D: React.FC<{ life: number; shot?: string; shots?: { cam: string; at: number }[]; calm?: boolean; title?: string; sub?: string; titleAt?: number; titleOutAt?: number }> = ({ life, shot = "crane", shots, calm = false, title, sub, titleAt = 0, titleOutAt = 1e9 }) => {
  const f = useCurrentFrame();
  const lite = useContext(LiteCtx);
  const list = shots && shots.length ? shots : [{ cam: shot, at: 0 }];
  return (
    <AbsoluteFill style={{ background: "#04060a" }}>
      <Canvas3D f={f} lite={lite} fov={38} pos={[4, 2.4, 8]} near={0.05} far={400}>
        <CampScene f={f} life={life} lite={lite} shots={list} calm={calm} />
      </Canvas3D>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 55%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.65) 100%)", pointerEvents: "none" }} />
      {title ? <TitleBlock title={title} sub={sub} at={titleAt} out={titleOutAt} /> : null}
    </AbsoluteFill>
  );
};
