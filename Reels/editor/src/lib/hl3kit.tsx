// =================================================================================================
// HL3 · kit de cenário de verdade (11/10/2026): peças modulares glTF (Quaternius Modular Sci-Fi MegaKit, CC0, em
// public/hl3models/megakit) + o Advisor do Half-Life: Alyx. Módulo de 4 m (piso 4×4, parede em x = −2, pé-direito 5 m).
// =================================================================================================
import { useMemo } from "react";
import { staticFile } from "remotion";
import { useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export const KIT = (n: string) => staticFile(`hl3models/megakit/${n}.gltf`);
export type Kit = Record<string, THREE.Group>;
// carrega as peças (Suspense: o Remotion espera) e prepara sombra/material
export const useKit = (names: string[]): Kit => {
  const gltfs = useLoader(GLTFLoader, names.map(KIT));
  return useMemo(() => {
    const out: Kit = {};
    names.forEach((n, i) => {
      const s = gltfs[i].scene;
      s.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.isMesh) {
          m.castShadow = true;
          m.receiveShadow = true;
        }
      });
      out[n.split("/").pop()!] = s;
    });
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gltfs]);
};
// uma cópia da peça posicionada (rotY em múltiplos de 90°)
export const put = (k: Kit, name: string, x: number, y: number, z: number, rotY = 0, s = 1) => {
  const o = k[name].clone(true);
  o.position.set(x, y, z);
  o.rotation.y = rotY;
  o.scale.setScalar(s);
  return o;
};
