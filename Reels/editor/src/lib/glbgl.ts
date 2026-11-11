// =================================================================================================
// HL3 · modelos .glb genéricos para o motor POV com profundidade (xgl): carrega uma vez (o Remotion espera com
// delayRender), devolve cópias normalizadas (maior dimensão = len, centradas) e põe no mundo do motor (x, y, z).
// Usado para o gunship do comboio (12/10); o Advisor tem o seu próprio (advgl.ts, por causa dos braços).
// =================================================================================================
import { continueRender, delayRender, staticFile } from "remotion";
import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { clone as skClone } from "three/examples/jsm/utils/SkeletonUtils.js";

const cache: Record<string, THREE.Group> = {};
const pending: Record<string, Promise<THREE.Group>> = {};
const load = (path: string) => {
  if (cache[path]) return Promise.resolve(cache[path]);
  if (!pending[path]) {
    const h = delayRender("glb " + path);
    pending[path] = new GLTFLoader().loadAsync(staticFile(path)).then((g) => {
      cache[path] = g.scene;
      continueRender(h);
      return g.scene;
    });
  }
  return pending[path];
};
// uma cópia: maior dimensão = len, centro na origem; o objeto externo é o que se posiciona
const copyOf = (src: THREE.Group, len: number) => {
  const inner = skClone(src) as THREE.Group;
  inner.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.isMesh) m.frustumCulled = false;
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
  return root;
};
export const useGLB = (path: string, n: number, len: number): THREE.Group[] => {
  const [ready, setReady] = useState(!!cache[path]);
  useEffect(() => {
    if (ready) return;
    const h = delayRender("glb copies " + path);
    load(path).then(() => {
      setReady(true);
      requestAnimationFrame(() => requestAnimationFrame(() => continueRender(h)));
    });
  }, [ready, path]);
  return useMemo(() => (ready ? Array.from({ length: n }).map(() => copyOf(cache[path], len)) : []), [ready, n, len, path]);
};
const W3 = (p: [number, number, number]) => new THREE.Vector3(p[0], p[2], -p[1]);
// no mundo do motor (x direita, y frente, z cima): posição, para onde aponta (+z do modelo), giro extra e inclinação
export const placeGLB = (o: THREE.Object3D, pos: [number, number, number], look: [number, number, number], yawOff = 0, roll = 0, pitch = 0) => {
  o.position.copy(W3(pos));
  o.lookAt(W3(look));
  o.rotateY(yawOff);
  o.rotateX(pitch);
  o.rotateZ(roll);
  o.updateMatrixWorld(true);
};
