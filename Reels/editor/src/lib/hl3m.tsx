import React, { useContext, useEffect, useMemo, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, staticFile, useCurrentFrame } from "remotion";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";
import { Canvas3D } from "./hl3j";
import { LiteCtx } from "./sfx-ctx";

// Parte 3C em 3D com os MODELOS OFICIAIS do Half-Life: Alyx (Source 2 Viewer → glTF-Transform → public/models/hl3c):
// cidadão montado por partes (cabeça + jaqueta + calça + sapato) no esqueleto-base com as animações do jogo, o Eli,
// o Gordon e o Vortigaunt. Cada parte tem a sua cópia do esqueleto; todas tocam o MESMO clipe no mesmo tempo, então a
// pose fica idêntica. Tempos em QUADROS relativos à cena.

type G = { scene: THREE.Group; animations: THREE.AnimationClip[]; tex?: THREE.Texture };
const CACHE = new Map<string, Promise<G>>();
const loadGlb = (src: string) => {
  let p = CACHE.get(src);
  if (!p) {
    p = /\.(jpg|png)$/.test(src)
      ? new Promise<G>((ok, bad) =>
          new THREE.TextureLoader().load(
            staticFile(src),
            (tx) => {
              tx.flipY = false;
              tx.colorSpace = THREE.SRGBColorSpace;
              ok({ scene: new THREE.Group(), animations: [], tex: tx });
            },
            undefined,
            bad,
          ),
        )
      : new Promise<G>((ok, bad) => new GLTFLoader().load(staticFile(src), (g) => ok(g as unknown as G), undefined, bad));
    CACHE.set(src, p);
  }
  return p;
};
// carrega uma lista de modelos (segura o render até chegarem)
// o quadro só é liberado (release) depois que quem usa desenhou a cena com os modelos: no render o ThreeCanvas só
// redesenha quando o quadro muda, e a captura saía com a cena vazia
export const useGlbs = (srcs: string[]) => {
  const key = srcs.join("|");
  const [out, setOut] = useState<G[] | null>(null);
  const [h] = useState(() => delayRender(`glb ${key}`));
  const [done] = useState(() => ({ v: false }));
  const release = () => {
    if (done.v) return;
    done.v = true;
    continueRender(h);
  };
  useEffect(() => {
    let ok = true;
    Promise.all(srcs.map(loadGlb))
      .then((gs) => ok && setOut(gs))
      .catch((e) => {
        console.error("glb", e);
        release();
      });
    return () => {
      ok = false;
    };
  }, [key, h]);
  return [out, release] as const;
};

const M = "models/hl3c/";
// OLHO: o shader de olho do Source 2 (íris projetada) não vem no glTF e o olho saía como um buraco escuro. Aqui a íris
// e a pupila são desenhadas pela posição de repouso do vértice (centro e frente de cada globo medidos no cit_base).
const eyeMat = () => {
  const m = new THREE.MeshStandardMaterial({ color: "#e9e3da", roughness: 0.25, metalness: 0 });
  m.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nvarying vec3 vEyeP;").replace("#include <begin_vertex>", "#include <begin_vertex>\nvEyeP = position;");
    sh.fragmentShader = sh.fragmentShader.replace("#include <common>", "#include <common>\nvarying vec3 vEyeP;").replace(
      "#include <map_fragment>",
      `#include <map_fragment>
      vec3 c = vec3(sign(vEyeP.x) * 0.034, 1.7351, 0.0358);
      vec3 n = normalize(vEyeP - c);
      float iris = smoothstep(0.86, 0.885, n.z);
      float pupil = smoothstep(0.955, 0.965, n.z);
      vec3 irisC = mix(vec3(0.22, 0.16, 0.10), vec3(0.10, 0.07, 0.05), smoothstep(0.885, 0.95, n.z));
      diffuseColor.rgb = mix(diffuseColor.rgb, irisC, iris);
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.015), pupil);
      diffuseColor.rgb *= mix(0.75, 1.0, smoothstep(0.0, 0.6, n.z));`,
    );
  };
  m.customProgramCacheKey = () => "eyeHL";
  return m;
};
// SILHUETA (2.5D): o corpo é um recorte quase preto; só a borda que olha para o fogo acende em âmbar (fresnel × luz
// do fogo × distância). Sem rosto, sem textura. `SIL.uFire` = posição do fogo no mundo, `SIL.uAmp` = tremulação.
export const SIL = { uFire: { value: new THREE.Vector3(0, 0.55, 0) }, uAmp: { value: 1 }, uCold: { value: 0.35 } };
export const silMat = (src: THREE.Material) => {
  const o = src as THREE.MeshStandardMaterial;
  const m = new THREE.MeshStandardMaterial({ color: "#000000", map: o.map ?? null, alphaTest: o.alphaTest || (o.map && o.transparent ? 0.5 : 0), transparent: false, side: o.side });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uSilFire = SIL.uFire;
    sh.uniforms.uSilAmp = SIL.uAmp;
    sh.uniforms.uSilCold = SIL.uCold;
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", `#include <common>
varying vec3 vSilW;
varying vec3 vSilN;`)
      .replace("#include <project_vertex>", `#include <project_vertex>
vSilW = (modelMatrix * vec4(transformed, 1.0)).xyz;
vSilN = normalize(mat3(modelMatrix) * objectNormal);`);
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", `#include <common>
uniform vec3 uSilFire; uniform float uSilAmp; uniform float uSilCold; varying vec3 vSilW; varying vec3 vSilN;`)
      .replace(
        "#include <dithering_fragment>",
        `vec3 Nw = normalize(vSilN);
        if (!gl_FrontFacing) Nw = -Nw;
        vec3 V = normalize(cameraPosition - vSilW);
        vec3 Ld = uSilFire - vSilW;
        float d = length(Ld);
        vec3 L = Ld / d;
        float fres = pow(1.0 - clamp(dot(Nw, V), 0.0, 1.0), 2.4);
        float face = pow(clamp(dot(Nw, L) * 0.5 + 0.5, 0.0, 1.0), 3.0);
        float att = 1.0 / (1.0 + d * d * 0.28);
        vec3 rim = vec3(1.0, 0.42, 0.11) * (fres * 2.6 * face + face * 0.10) * att * uSilAmp;
        // contra-luz fria (céu/neve) bem fraca nas bordas de cima
        rim += vec3(0.25, 0.38, 0.6) * fres * smoothstep(0.0, 1.0, Nw.y) * 0.08 * uSilCold;
        gl_FragColor.rgb = vec3(0.008, 0.009, 0.012) + rim;
        #include <dithering_fragment>`,
      );
  };
  m.customProgramCacheKey = () => "silHL";
  return m;
};
const _inv = new THREE.Matrix4();
const _loc = new THREE.Matrix4();
const pose = (rig: { group: THREE.Group; mixers: THREE.AnimationMixer[]; follow: { bone: THREE.Bone; src: THREE.Object3D }[] }, t: number) => {
  for (const mx of rig.mixers) mx.setTime(Math.max(0, t));
  if (!rig.follow.length) return;
  rig.group.updateMatrixWorld(true);
  // na ordem da hierarquia (pai antes do filho): local = inverso(mundo do pai) × mundo do osso completo
  for (const { bone, src } of rig.follow) {
    const par = bone.parent!;
    par.updateMatrixWorld(false);
    _loc.multiplyMatrices(_inv.copy(par.matrixWorld).invert(), src.matrixWorld);
    _loc.decompose(bone.position, bone.quaternion, bone.scale);
    bone.updateMatrixWorld(false);
  }
};
// personagem montado: partes que tocam o mesmo clipe (vindo do esqueleto-base quando a parte não tem animação)
export const Actor: React.FC<{ t: number; parts: string[]; clipSrc?: string; clip?: string; pos?: [number, number, number]; rotY?: number; scale?: number; tint?: number; off?: [number, number, number]; head?: string; hair?: string; sil?: boolean }> = ({ t, parts, clipSrc = M + "cit_base.glb", clip, pos = [0, 0, 0], rotY = 0, scale = 1, tint = 1, off, head, hair = "#2e2823", sil = false }) => {
  // `head`: textura de rosto de cidadão genérico do Alyx (tex/head_*.jpg) aplicada na cabeça (material de cabeça ou
  // a malha que veio sem textura, como a do cit01)
  const [gs0, release] = useGlbs(head ? [clipSrc, ...parts, head] : [clipSrc, ...parts]);
  const headTex = head && gs0 ? gs0[gs0.length - 1].tex : undefined;
  const gs = head && gs0 ? gs0.slice(0, -1) : gs0;
  const { gl, scene, camera } = useThree();
  const rig = useMemo(() => {
    if (!gs) return null;
    const [base, ...ps] = gs;
    const group = new THREE.Group();
    const clipObj = clip ? base.animations.find((a) => a.name === clip) ?? null : null;
    const mixers: THREE.AnimationMixer[] = [];
    // PEÇAS COM ESQUELETO REDUZIDO (gorro, sapato, calça… só têm os ossos que usam, pulando os do meio): tocar o clipe
    // nelas deixa a peça flutuando. Elas copiam a pose (no mundo) de um esqueleto completo, o do clipSrc, animado à parte.
    let driver: THREE.Object3D | null = null;
    const follow: { bone: THREE.Bone; src: THREE.Object3D }[] = [];
    const nBase = (() => {
      let n = 0;
      base.scene.traverse((o) => void ((o as THREE.Bone).isBone && n++));
      return n;
    })();
    for (let pi = 0; pi < ps.length; pi++) {
      const g = ps[pi];
      const sc = cloneSkinned(g.scene) as THREE.Group;
      sc.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.isMesh) {
          m.frustumCulled = false;
          m.castShadow = true;
          const mats = Array.isArray(m.material) ? m.material : [m.material];
          for (let mi = 0; mi < mats.length; mi++) {
            let mt = mats[mi] as THREE.MeshStandardMaterial;
            if (!mt) continue;
            if (sil) {
              const sm = silMat(mt);
              if (Array.isArray(m.material)) (m.material as THREE.Material[])[mi] = sm;
              else m.material = sm;
              continue;
            }
            if (mt.name === "eli_eye" && pi === 0 && head) {
              const e = eyeMat();
              e.name = "eye_fix";
              if (Array.isArray(m.material)) (m.material as THREE.Material[])[mi] = e;
              else m.material = e;
              continue;
            }
            if (headTex && pi === 0 && (/head/i.test(mt.name) || !mt.map)) {
              mt = mt.clone();
              mt.map = headTex;
              mt.color?.set("#ffffff");
              mt.needsUpdate = true;
              if (Array.isArray(m.material)) (m.material as THREE.Material[])[mi] = mt;
              else m.material = mt;
            }
            // cabelo do Alyx vem sem a cor (no jogo é tingido por personagem): grisalho escuro
            if (/hair/i.test(mt.name) && !/head/i.test(mt.name)) {
              mt = mt.clone();
              mt.color.set(hair);
              if (Array.isArray(m.material)) (m.material as THREE.Material[])[mi] = mt;
              else m.material = mt;
            }
            mt.envMapIntensity = 0.1;
            mt.roughness = Math.max(0.55, mt.roughness ?? 0.7);
            mt.metalness = Math.min(0.2, mt.metalness ?? 0);
            if (tint !== 1 && mt.color) mt.color.multiplyScalar(tint);
          }
        }
      });
      const own = g.animations.find((a) => a.name === clip);
      const c = own ?? clipObj;
      let nb = 0;
      sc.traverse((o) => void ((o as THREE.Bone).isBone && nb++));
      if (!own && clipObj && nb < nBase * 0.6) {
        if (!driver) {
          driver = cloneSkinned(base.scene);
          driver.visible = false;
          const mx = new THREE.AnimationMixer(driver);
          mx.clipAction(clipObj).play();
          mixers.push(mx);
          group.add(driver);
        }
        const byName = new Map<string, THREE.Object3D>();
        driver.traverse((o) => void ((o as THREE.Bone).isBone && byName.set(o.name, o)));
        sc.traverse((o) => {
          const src = byName.get(o.name);
          if ((o as THREE.Bone).isBone && src) follow.push({ bone: o as THREE.Bone, src });
        });
        group.add(sc);
        continue;
      }
      if (c) {
        const mx = new THREE.AnimationMixer(sc);
        mx.clipAction(c).play();
        mixers.push(mx);
      }
      group.add(sc);
    }
    return { group, mixers, follow };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gs0, clip, sil]);
  useEffect(() => {
    if (!rig) return;
    pose(rig, t);
    gl.render(scene, camera);
    release();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rig]);
  if (!rig) return null;
  pose(rig, t);
  // `off`: desloca o corpo DENTRO do personagem (antes de girar). Os clipes de banco do Alyx sentam a ~0,9 m do lado
  // da origem (o banco do jogo era comprido); com o off o quadril cai em cima do `pos`.
  if (off)
    return (
      <group position={pos} rotation={[0, rotY, 0]} scale={scale}>
        <primitive object={rig.group} position={off} dispose={null} />
      </group>
    );
  return <primitive object={rig.group} position={pos} rotation={[0, rotY, 0]} scale={scale} dispose={null} />;
};

// VARGA: cidadão GENÉRICO do Alyx montado (nenhum personagem conhecido): rosto caucasian40 (mais velho, barba por
// fazer), jaqueta militar, boina (cit_bone) com o cabelo de baixo de chapéu, calça e botas. Os rebeldes de fundo também são montados com outros rostos.
const CIT = [M + "cit_base.glb", M + "cit_calca.glb", M + "cit_sapato.glb"];
export const VARGA_PARTS = [...CIT, M + "cit_jaqueta_militar.glb", M + "cit_head_gorro.glb", M + "cit_bone.glb"];
export const VARGA_HEAD = M + "tex/head_caucasian40.jpg";
export const REBEL_A = [...CIT, M + "cit_jaqueta_inverno.glb", M + "cit_head_capuz.glb"];
export const REBEL_B = [...CIT, M + "cit_jaqueta_inverno.glb"];
export const REBEL_C = [...CIT, M + "cit_jaqueta_militar.glb"];

// teste de modelos: luz neutra, fundo cinza, os quatro lado a lado
const TestScene: React.FC<{ f: number }> = ({ f }) => {
  const { camera } = useThree();
  camera.position.set(0, 1.4, 6.2);
  camera.lookAt(0, 0.95, 0);
  const t = f / 30;
  return (
    <>
      <hemisphereLight args={["#ffffff", "#666666", 1.6]} />
      <directionalLight position={[3, 5, 4]} intensity={2.2} />
      <Actor t={t} parts={VARGA_PARTS} clip="idle_subtle" pos={[-2.7, 0, 0]} head={VARGA_HEAD} />
      <Actor t={t} parts={VARGA_PARTS} clip="bench_citizens_tk04_male_preidle" pos={[-1.2, 0, 0]} off={[-0.88, 0, -0.3]} head={VARGA_HEAD} />
      <Actor t={t} parts={REBEL_A} clip="idle_subtle" pos={[0.3, 0, 0]} head={M + "tex/head_black30.jpg"} />
      <Actor t={t} parts={REBEL_B} clip="idle_subtle" pos={[1.5, 0, 0]} head={M + "tex/head_asian50.jpg"} />
      <Actor t={t} parts={REBEL_C} clip="idle_subtle" pos={[2.7, 0, 0]} head={M + "tex/head_caucasian30.jpg"} />
    </>
  );
};
export const HLModelTest: React.FC<{ life: number }> = ({ life }) => {
  const f = useCurrentFrame();
  const lite = useContext(LiteCtx);
  void life;
  return (
    <AbsoluteFill style={{ background: "#7a8088" }}>
      <Canvas3D f={f} lite={lite} fov={40} pos={[0, 1.4, 6.2]} near={0.05} far={100}>
        <TestScene f={f} />
      </Canvas3D>
    </AbsoluteFill>
  );
};
