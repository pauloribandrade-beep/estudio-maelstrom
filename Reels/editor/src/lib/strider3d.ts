// =================================================================================================
// HL3 · o Strider em 3D, modelado à mão (12/10/2026) — pedido dele: "os striders você consegue fazer 3D?".
// Sem download: o Strider do HL2 é feito de formas simples. O corpo (um casulo de carne clara e placas de metal, com
// a "cabeça" sensorial na frente e o canhão de dobra + a metralhadora embaixo) fica pendurado em três pernas longas:
// cada perna sai do alto do corpo, sobe até um joelho bem acima dele e desce, fina, até o pé pontudo no chão.
// Unidades em metros, y para cima; o Strider olha para −z. pose(t, walk, fall) anima o passo e a queda.
// =================================================================================================
import * as THREE from "three";
import { continueRender, delayRender, staticFile } from "remotion";
import { useEffect, useMemo, useState } from "react";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { clone as skClone } from "three/examples/jsm/utils/SkeletonUtils.js";

const std = (color: string, rough = 0.6, metal = 0.3, extra: THREE.MeshStandardMaterialParameters = {}) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, ...extra });
// um segmento cônico entre dois pontos
const seg = (a: THREE.Vector3, b: THREE.Vector3, r0: number, r1: number, m: THREE.Material, rs = 10) => {
  const d = b.clone().sub(a);
  const g = new THREE.CylinderGeometry(r1, r0, d.length(), rs, 1);
  const o = new THREE.Mesh(g, m);
  o.position.copy(a.clone().add(b).multiplyScalar(0.5));
  o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  return o;
};
export type Strider = { root: THREE.Group; pose: (t: number, walk: number, fall: number) => void; height: number };
export const makeStrider = (): Strider => {
  const root = new THREE.Group();
  const flesh = std("#c8bca2", 0.7, 0.05);
  const fleshD = std("#9a8e76", 0.75, 0.05);
  const metal = std("#5a626c", 0.45, 0.55);
  const metalL = std("#8d959e", 0.4, 0.5);
  const dark = std("#1a1d21", 0.5, 0.6);
  const eye = new THREE.MeshStandardMaterial({ color: "#bfe9ff", emissive: new THREE.Color("#8fd8ff"), emissiveIntensity: 2.2, roughness: 0.2 });
  const H = 14; // altura do corpo
  // ---- o corpo (pivô no centro do corpo, para a queda)
  const body = new THREE.Group();
  body.position.y = H;
  root.add(body);
  // o corpo um pouco maior (o casulo do HL2 tem ~6 m)
  const bodyS = new THREE.Group();
  bodyS.scale.setScalar(1.35);
  body.add(bodyS);
  // casulo: três gomos de carne, do traseiro (+z) à frente (−z)
  ([[2.3, 1.45, 1.8, 0.9], [0, 1.8, 1.7, 0], [-2.3, 1.35, 1.45, -0.8]] as [number, number, number, number][]).forEach(([z, rx, ry, dz], i) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), i === 1 ? flesh : fleshD);
    m.scale.set(rx * 0.95, ry * 0.62, 1.9);
    m.position.set(0, 0.1 * i, z);
    void dz;
    bodyS.add(m);
  });
  // placas de metal sobre o dorso e as nervuras
  for (let i = 0; i < 5; i++) {
    const p = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 10, 0, Math.PI * 2, 0, Math.PI * 0.35), metal);
    p.scale.set(1.75 - Math.abs(i - 2) * 0.12, 1.25, 0.55);
    p.position.set(0, 0.25, 1.9 - i * 0.95);
    bodyS.add(p);
  }
  for (let i = 0; i < 7; i++) {
    const r = new THREE.Mesh(new THREE.TorusGeometry(1.55 - Math.abs(i - 3) * 0.12, 0.06, 6, 28, Math.PI), dark);
    r.rotation.set(0, Math.PI / 2, 0);
    r.position.set(0, 0, 2.2 - i * 0.7);
    bodyS.add(r);
  }
  // a cabeça sensorial na frente: um bloco de metal com os "olhos" acesos
  const head = new THREE.Group();
  head.position.set(0, 0.2, -3.1);
  bodyS.add(head);
  const hb = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.9, 1.1), metal);
  head.add(hb);
  const hc = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.6, 0.6, 8), metalL);
  hc.rotation.x = Math.PI / 2;
  hc.position.z = -0.7;
  head.add(hc);
  ([[0, 0.05, 0.2], [-0.42, -0.18, 0.11], [0.42, -0.18, 0.11]] as [number, number, number][]).forEach(([x, y, r]) => {
    const e = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 8), eye);
    e.position.set(x, y, -1.02);
    head.add(e);
  });
  // a metralhadora sob a cabeça e o canhão de dobra na barriga
  const gun = new THREE.Group();
  gun.position.set(0, -0.75, -2.6);
  bodyS.add(gun);
  gun.add(seg(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -0.2, -1.3), 0.22, 0.16, dark, 8));
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * Math.PI * 2;
    gun.add(seg(new THREE.Vector3(Math.cos(a) * 0.1, -0.2 + Math.sin(a) * 0.1, -1.2), new THREE.Vector3(Math.cos(a) * 0.1, -0.24 + Math.sin(a) * 0.1, -2.0), 0.04, 0.04, metal, 6));
  }
  const cannon = new THREE.Group();
  cannon.position.set(0, -1.55, -0.2);
  bodyS.add(cannon);
  cannon.add(seg(new THREE.Vector3(0, 0.6, 0.3), new THREE.Vector3(0, 0, -1.2), 0.38, 0.24, metal, 10));
  const tip = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.06, 6, 16), eye);
  tip.position.set(0, -0.05, -1.25);
  tip.rotation.x = Math.PI / 2 - 0.4;
  cannon.add(tip);
  // ---- as três pernas (frente-esquerda, frente-direita, trás), ancoradas no alto do corpo
  const ANG = [-Math.PI / 2 - 0.75, -Math.PI / 2 + 0.75, Math.PI / 2];
  const legs = ANG.map((a, i) => {
    const g = new THREE.Group();
    root.add(g);
    return { a, g, i };
  });
  const legMat = [metal, metal, metal];
  const build = (walk: number, t: number, fall: number) => {
    legs.forEach(({ a, g, i }) => {
      g.clear();
      const ph = t * 1.6 + i * 2.1;
      const step = walk * Math.sin(ph);
      const lift = walk * Math.max(0, Math.cos(ph)) * 1.4;
      const ca = Math.cos(a), sa = Math.sin(a);
      // ponto de encaixe no corpo (no alto), joelho alto e para fora, pé no chão longe
      const bodyY = H * (1 - 0.72 * fall);
      const hip = new THREE.Vector3(ca * 0.9, bodyY + 1.2, sa * 0.9);
      const kneeR = 5.6 + 1.5 * fall, footR = 9.5 + 3.5 * fall;
      const knee = new THREE.Vector3(ca * kneeR, bodyY + 6.5 - 5.5 * fall + 0.5 * step, sa * kneeR + step * 0.8);
      const foot = new THREE.Vector3(ca * footR, lift * (1 - fall), sa * footR + step * 1.6);
      // coxa grossa (com a junta) e canela longa e fina, com o pé pontudo
      g.add(seg(hip, knee, 0.42, 0.3, legMat[i], 10));
      const kj = new THREE.Mesh(new THREE.SphereGeometry(0.45, 12, 8), metalL);
      kj.position.copy(knee);
      g.add(kj);
      const mid = knee.clone().lerp(foot, 0.55);
      g.add(seg(knee, mid, 0.3, 0.2, legMat[i], 8));
      g.add(seg(mid, foot.clone().add(new THREE.Vector3(0, 0.5, 0)), 0.2, 0.12, dark, 8));
      g.add(seg(foot.clone().add(new THREE.Vector3(0, 0.5, 0)), foot, 0.12, 0.02, metalL, 6));
      // as mangueiras ao longo da coxa
      g.add(seg(hip.clone().add(new THREE.Vector3(0, -0.2, 0)), knee.clone().add(new THREE.Vector3(0, -0.35, 0)), 0.08, 0.08, fleshD, 6));
    });
  };
  const pose = (t: number, walk: number, fall: number) => {
    body.position.y = H * (1 - 0.72 * fall) + 0.25 * Math.sin(t * 3.2) * walk;
    body.rotation.x = -0.35 * fall + 0.03 * Math.sin(t * 1.6) * walk;
    body.rotation.z = 0.25 * fall;
    head.rotation.y = 0.25 * Math.sin(t * 0.7) * (1 - fall);
    build(walk, t, fall);
  };
  pose(0, 0, 0);
  return { root, pose, height: H + 7 };
};

// ------------------------------------------------------------------------------------------------ o Strider do jogo
// 12/10: o modelo real do Half-Life: Alyx (public/hl3models/strider_hla.glb, extraído do jogo instalado), com as animações
// do jogo: walk_n (andar), idle_high (de pé), death01 (queda). Carrega uma vez; cada cena pede uma cópia com esqueleto.
let SC: { scene: THREE.Group; anims: THREE.AnimationClip[] } | null = null;
let SP: Promise<void> | null = null;
const loadS = () => {
  if (SC) return Promise.resolve();
  if (!SP) {
    const h = delayRender("strider glb");
    SP = new GLTFLoader().loadAsync(staticFile("hl3models/strider_hla.glb")).then((g) => {
      SC = { scene: g.scene, anims: g.animations };
      continueRender(h);
    });
  }
  return SP;
};
export type RealStrider = { root: THREE.Group; set: (clip: "walk" | "idle" | "death" | "fire", t: number) => void };
// altura em metros (o Strider do jogo tem ~ 25 m de pé); o objeto externo fica com os pés no chão (y = 0)
export const useRealStrider = (height = 26): RealStrider | null => {
  const [ok, setOk] = useState(!!SC);
  useEffect(() => {
    if (ok) return;
    const h = delayRender("strider copy");
    loadS().then(() => {
      setOk(true);
      requestAnimationFrame(() => requestAnimationFrame(() => continueRender(h)));
    });
  }, [ok]);
  return useMemo(() => (ok ? makeRealStrider(height) : null), [ok, height]);
};
const makeRealStrider = (height: number): RealStrider | null => {
  if (!SC) return null;
    const inner = skClone(SC.scene) as THREE.Group;
    inner.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.frustumCulled = false;
        // a variante "ferida" vem sobreposta no mesmo arquivo: fica escondida
        if (/injured/.test(m.name) || /injured/.test(m.parent?.name ?? "")) m.visible = false;
      }
    });
    const mixer = new THREE.AnimationMixer(inner);
    const find = (n: string) => SC!.anims.find((a) => a.name === n);
    const clips = { walk: find("strider_anim_walk_n"), idle: find("strider_anim_idle_high"), death: find("strider_anim_choreo_fight_death") ?? find("strider_anim_death01"), fire: find("strider_anim_shoot01") ?? find("strider_anim_minigun_firing") };
    const acts = Object.fromEntries(Object.entries(clips).map(([k, c]) => [k, c ? mixer.clipAction(c) : null])) as Record<string, THREE.AnimationAction | null>;
    // escala pela pose de pé
    acts.idle?.play();
    mixer.setTime(0);
    inner.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(inner, true);
    const k = height / Math.max(0.001, box.max.y - box.min.y);
    inner.scale.setScalar(k);
    inner.position.y = -box.min.y * k;
    const root = new THREE.Group();
    root.add(inner);
    let cur = "idle";
    const set = (clip: "walk" | "idle" | "death" | "fire", t: number) => {
      if (clip !== cur) {
        Object.values(acts).forEach((a) => a?.stop());
        acts[clip]?.play();
        cur = clip;
      }
      const a = acts[clip];
      if (a && clip === "death") {
        a.setLoop(THREE.LoopOnce, 1);
        a.clampWhenFinished = true;
      }
      mixer.setTime(t);
    };
    return { root, set };
};
export const useRealStriders = (n: number, height = 26): RealStrider[] => {
  const one = useRealStrider(height);
  return useMemo(() => (one ? [one, ...Array.from({ length: n - 1 }).map(() => makeRealStrider(height)!)] : []), [one, n, height]);
};


// ------------------------------------------------------------------------------------------------ criaturas do jogo
// 12/10: antlion e headcrab do Half-Life: Alyx (public/hl3models/*_hla.glb, extraídos do jogo instalado, texturas
// embutidas), com as animações do jogo. useHla("antlion_hla.glb", 4, 1.4, { dig: "digout01", run: "run02" }) devolve n
// cópias com esqueleto, cada uma com set(clip, t). Altura em metros, pés no chão (y = 0).
const HLA: Record<string, { scene: THREE.Group; anims: THREE.AnimationClip[] }> = {};
const HLA_P: Record<string, Promise<void>> = {};
export type HlaActor = { root: THREE.Group; set: (clip: string, t: number) => void };
const makeHla = (file: string, height: number, map: Record<string, string>): HlaActor => {
  const src = HLA[file];
  const inner = skClone(src.scene) as THREE.Group;
  inner.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    m.frustumCulled = false;
    // as variantes sobrepostas (sem armadura, asa borrada) ficam escondidas
    if (/unarmored|wingblur|_dead|ragdoll/i.test(m.name) || /unarmored|wingblur/i.test(m.parent?.name ?? "")) m.visible = false;
    // o ORM do Source 2 vira "metálico" no three e sai preto sem reflexo: material fosco
    const mats = (Array.isArray(m.material) ? m.material : [m.material]) as THREE.MeshStandardMaterial[];
    mats.forEach((mm) => {
      if (!mm || !("metalness" in mm)) return;
      mm.metalness = 0;
      mm.metalnessMap = null;
      mm.roughness = 0.75;
      // um pouco de luz própria pela própria textura (no gelo à noite o bicho sumia de tão escuro)
      if (mm.map) {
        mm.emissive = new THREE.Color("#ffffff");
        mm.emissiveMap = mm.map;
        mm.emissiveIntensity = 0.35;
      }
      mm.needsUpdate = true;
    });
  });
  const mixer = new THREE.AnimationMixer(inner);
  const acts: Record<string, THREE.AnimationAction | null> = {};
  Object.entries(map).forEach(([k, n]) => {
    const c = src.anims.find((a) => a.name === n);
    acts[k] = c ? mixer.clipAction(c) : null;
  });
  const first = Object.keys(map)[0];
  acts[first]?.play();
  mixer.setTime(0);
  inner.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(inner, true);
  const k = height / Math.max(0.001, box.max.y - box.min.y);
  inner.scale.setScalar(k);
  inner.position.y = -box.min.y * k;
  const root = new THREE.Group();
  root.add(inner);
  let cur = first;
  const set = (clip: string, t: number) => {
    if (clip !== cur) {
      Object.values(acts).forEach((a) => a?.stop());
      acts[clip]?.play();
      cur = clip;
    }
    mixer.setTime(Math.max(0, t));
  };
  return { root, set };
};
export const useHla = (file: string, n: number, height: number, map: Record<string, string>): HlaActor[] => {
  const [ok, setOk] = useState(!!HLA[file]);
  const [hold] = useState(() => (HLA[file] ? null : delayRender("hla " + file)));
  useEffect(() => {
    if (ok) {
      if (hold !== null) requestAnimationFrame(() => requestAnimationFrame(() => continueRender(hold)));
      return;
    }
    if (!HLA_P[file])
      HLA_P[file] = new GLTFLoader().loadAsync(staticFile("hl3models/" + file)).then((g) => {
        HLA[file] = { scene: g.scene, anims: g.animations };
      });
    HLA_P[file].then(() => setOk(true));
  }, [ok, hold, file]);
  return useMemo(() => (ok ? Array.from({ length: n }).map(() => makeHla(file, height, map)) : []), [ok, n, height, file]); // eslint-disable-line react-hooks/exhaustive-deps
};
