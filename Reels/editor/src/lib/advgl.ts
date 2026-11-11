// =================================================================================================
// HL3 · o Advisor 3D (Half-Life: Alyx, public/hl3models/advisor_hla.glb) para o motor POV com profundidade (xgl).
// Carrega uma vez (o Remotion espera com delayRender); cada cena pede cópias com esqueleto próprio.
// Os dois braços mecânicos (arm_0..2_L/R, hand_L/R) ganham movimento por cima da animação "idle" do jogo.
// =================================================================================================
import { continueRender, delayRender, staticFile } from "remotion";
import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { clone as skClone } from "three/examples/jsm/utils/SkeletonUtils.js";

type G = { scene: THREE.Group; animations: THREE.AnimationClip[] };
let cache: G | null = null;
let pending: Promise<G> | null = null;
export const loadAdvisor = (): Promise<G> => {
  if (cache) return Promise.resolve(cache);
  if (!pending) {
    const h = delayRender("advisor glb");
    pending = new GLTFLoader().loadAsync(staticFile("hl3models/advisor_hla.glb")).then((g) => {
      cache = { scene: g.scene, animations: g.animations };
      continueRender(h);
      return cache;
    });
  }
  return pending;
};
export const advisorReady = () => cache;
// gira um osso em torno de um eixo dado no espaço do CORPO do Advisor (root): x = lado, y = cima, z = frente (para onde
// ele olha). Os ossos L/R do modelo têm eixos locais espelhados de jeitos diferentes; no espaço do corpo fica simétrico.
const _q = new THREE.Quaternion(), _pw = new THREE.Quaternion(), _rw = new THREE.Quaternion(), _ax = new THREE.Vector3(), _v = new THREE.Vector3();
export const rotInBody = (root: THREE.Object3D, b: THREE.Object3D, axis: [number, number, number], ang: number) => {
  if (!b.parent || !ang) return;
  root.getWorldQuaternion(_rw);
  _ax.set(axis[0], axis[1], axis[2]).applyQuaternion(_rw).normalize();
  b.parent.getWorldQuaternion(_pw);
  _q.setFromAxisAngle(_ax, ang);
  // local' = Pw⁻¹ · D · Pw · local
  const inv = _pw.clone().invert();
  b.quaternion.premultiply(_pw).premultiply(_q).premultiply(inv);
  b.updateMatrixWorld(true);
};
// de que lado do corpo está o ombro (+1 / −1 no x do corpo)
export const sideOf = (root: THREE.Object3D, b: THREE.Object3D) => {
  b.getWorldPosition(_v);
  root.worldToLocal(_v);
  return _v.x >= 0 ? 1 : -1;
};
export const ARM_YAW = 0.9;
export let ARM_P0 = -0.3, ARM_P1 = 1.3, ARM_P2 = 0.6;
export const setArmP = (a: number, b: number, c: number) => { ARM_P0 = a; ARM_P1 = b; ARM_P2 = c; };
export type AdvArm = { s: "L" | "R"; seg: (THREE.Object3D | null)[]; hand: THREE.Object3D | null };
export type AdvisorInst = { root: THREE.Group; mixer: THREE.AnimationMixer; len: number; pose: (t: number, reach: number, yawK?: number) => void; arms: AdvArm[] };
// uma cópia normalizada: comprimento `len` m; o objeto externo fica no centro do corpo
export const makeAdvisor = (len = 3.2, larva = false): AdvisorInst | null => {
  if (!cache) return null;
  const inner = skClone(cache.scene) as THREE.Group;
  inner.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.isMesh) {
      m.frustumCulled = false;
      // larva = só o corpo (sem os braços e o arreio mecânico)
      const mn = ((Array.isArray(m.material) ? m.material[0] : m.material) as THREE.Material).name;
      if (larva && /mech/.test(mn)) m.visible = false;
    }
  });
  inner.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(inner, true);
  const size = box.getSize(new THREE.Vector3());
  const c = box.getCenter(new THREE.Vector3());
  const k = len / Math.max(size.x, size.y, size.z);
  inner.scale.setScalar(k);
  inner.position.set(-c.x * k, -c.y * k, -c.z * k);
  const root = new THREE.Group();
  root.add(inner);
  const mixer = new THREE.AnimationMixer(inner);
  const idle = cache.animations.find((a) => a.name === "idle");
  if (idle) mixer.clipAction(idle).play();
  const bone = (re: RegExp) => {
    let b: THREE.Object3D | null = null;
    inner.traverse((o) => {
      if (!b && re.test(o.name)) b = o;
    });
    return b as THREE.Object3D | null;
  };
  const arms: AdvArm[] = (["L", "R"] as const).map((s) => ({ s, seg: [0, 1, 2].map((i) => bone(new RegExp(`^arm_${i}_${s}(_[0-9]+)?$`))), hand: bone(new RegExp(`^hand_${s}(_[0-9]+)?$`)) }));
  // 12/10: o modelo tem um braço "solto" (detached_arm_*_L, para quando o arrancam) no MESMO lugar do braço esquerdo —
  // ao mexer só no esquerdo a cópia ficava parada e parecia que o braço não se mexia. Ela anda junto.
  const twin = [0, 1, 2].map((i) => bone(new RegExp(`^detached_arm_${i}_L(_[0-9]+)?$`)));
  const twinHand = bone(/^detached_hand_L(_[0-9]+)?$/);
  // pose de repouso dos braços (antes da animação): o "idle" do jogo mexe cada braço de um jeito; partimos do repouso
  // e o movimento dos braços é todo nosso (simétrico, ondas lentas)
  const armBones = [...arms.flatMap((a) => [...a.seg, a.hand]), ...twin, twinHand].filter(Boolean) as THREE.Object3D[];
  const rest = armBones.map((b) => b.quaternion.clone());
  // 12/10 (pedido dele): os braços PARA A FRENTE (não abertos para o lado), com movimento fluido. Os giros são no espaço do
  // corpo (x lado, y cima, z frente), então ficam simétricos. reach 0 = braços à frente, relaxados; 1 = estendidos à frente
  // na direção do alvo, garra fechando (telecinese).
  const pose = (t: number, reach: number, yawK = ARM_YAW) => {
    mixer.setTime(t);
    armBones.forEach((b, k) => b.quaternion.copy(rest[k]));
    root.updateMatrixWorld(true);
    arms.forEach(({ s, seg, hand }, i) => {
      const ph = i * 1.7;
      const sx = seg[0] ? sideOf(root, seg[0]) : 1;
      const tw = s === "L" ? twin : [null, null, null];
      const both = (k: number, ax: [number, number, number], a: number) => {
        const b = seg[k];
        if (b) rotInBody(root, b, ax, a);
        const c2 = tw[k];
        if (c2) rotInBody(root, c2, ax, a);
      };
      // ombro: o segmento que sai para o lado gira em torno do eixo vertical e aponta para a frente (braços juntos à frente)
      both(0, [0, 1, 0], sx * (yawK + 0.06 * Math.sin(t * 0.7 + ph)));
      both(0, [1, 0, 0], ARM_P0 + 0.06 * Math.sin(t * 0.9 + ph));
      // antebraço: de pendurado para apontando à frente (mais quando ele estende); punho acompanha
      both(1, [1, 0, 0], -(ARM_P1 + 0.45 * reach) + 0.1 * Math.sin(t * 1.1 + ph + 1) + 0.04 * Math.sin(t * 2.6 + ph));
      both(2, [1, 0, 0], ARM_P2 * (1 - reach) + 0.1 * Math.sin(t * 1.5 + ph + 2));
      if (hand) hand.rotation.x += 0.25 * Math.sin(t * 1.4 + i) + 0.5 * reach;
      if (s === "L" && twinHand) twinHand.rotation.x += 0.25 * Math.sin(t * 1.4 + i) + 0.5 * reach;
    });
  };
  return { root, mixer, len, pose, arms };
};
// glow violeta (luz) para acompanhar o Advisor
export const W3 = (p: [number, number, number]) => new THREE.Vector3(p[0], p[2], -p[1]);
// hook: n Advisors prontos para a cena (o Remotion espera o modelo carregar)
export const useAdvisors = (n: number, len = 3.2, larva = false): AdvisorInst[] => {
  const [ready, setReady] = useState(!!cache);
  useEffect(() => {
    if (ready) return;
    const h = delayRender("advisors");
    loadAdvisor().then(() => {
      setReady(true);
      requestAnimationFrame(() => requestAnimationFrame(() => continueRender(h)));
    });
  }, [ready]);
  return useMemo(() => (ready ? (Array.from({ length: n }).map(() => makeAdvisor(len, larva)).filter(Boolean) as AdvisorInst[]) : []), [ready, n, len, larva]);
};
// coloca o Advisor no mundo do motor (x, y, z) olhando para um alvo, com flutuação
export const placeAdvisor = (a: AdvisorInst, pos: [number, number, number], look: [number, number, number], yawOff = 0) => {
  const p = W3(pos);
  a.root.position.copy(p);
  a.root.lookAt(W3(look));
  a.root.rotateY(yawOff);
  a.root.updateMatrixWorld(true);
};
// luzes padrão para o Advisor 3D numa cena POV (o resto da cena é sombreado pelo motor; isto só ilumina o modelo)
export const advLightsFor = (key: [number, number, number], keyCol = "#ffe0b0", tint = "#9aa6b4", k = 1, target?: [number, number, number]): THREE.Light[] => {
  const d = new THREE.DirectionalLight(keyCol, 2.6 * k);
  d.position.copy(W3(key));
  d.target.position.copy(target ? W3(target) : new THREE.Vector3(0, 0, 0));
  d.target.updateMatrixWorld();
  return [new THREE.AmbientLight(tint, 1.4 * k), new THREE.HemisphereLight("#cfd8e0", "#1a1410", 0.9 * k), d];
};
// cena POV com n Advisors: posiciona cada um (mundo do motor) e devolve extras + luzes para o XView
export type AdvSpec = { pos: [number, number, number]; look: [number, number, number]; reach?: number; show?: boolean; yaw?: number };
export const useAdvScene = (specs: AdvSpec[], f: number, len = 2.4, larva = false) => {
  const advs = useAdvisors(specs.length, len, larva);
  const p0 = specs[0]?.pos ?? [0, 0, 0];
  const lights = useMemo(() => {
    const pl = new THREE.PointLight("#d8c8ff", 60, 10, 1.2);
    pl.position.copy(W3([p0[0] + 1.2, p0[1] - 1.6, p0[2] + 0.6]));
    return [...advLightsFor([p0[0], p0[1] - 8, p0[2] + 4], "#e8eeff", "#9aa6b8", 2.2, p0), pl];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const extras: THREE.Object3D[] = [];
  advs.forEach((A, i) => {
    const s = specs[i];
    if (!s || s.show === false) return;
    // 12/10 (pedido dele: movimentação bem fluida): além de flutuar, deriva devagar e a cabeça acompanha o alvo com um
    // leve atraso (ondas lentas, defasadas entre os Advisors) — nunca parado, nunca tremendo
    const ph = i * 2.1;
    const pos: [number, number, number] = [s.pos[0] + 0.07 * Math.sin(f / 53 + ph), s.pos[1] + 0.05 * Math.sin(f / 67 + ph), s.pos[2] + 0.09 * Math.sin(f / 31 + ph)];
    const look: [number, number, number] = [s.look[0] + 0.3 * Math.sin(f / 59 + ph), s.look[1], s.look[2] + 0.18 * Math.sin(f / 43 + ph)];
    placeAdvisor(A, pos, look, (s.yaw ?? 0) + 0.04 * Math.sin(f / 71 + ph));
    A.pose(f / 30 + i * 3.1, s.reach ?? 0.1);
    extras.push(A.root);
  });
  return { ready: advs.length > 0, extras, lights: advs.length ? lights : [] };
};
