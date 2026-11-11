// =================================================================================================
// HL3 · piloto do padrão 3D novo (11/10/2026): assets de verdade (Advisor do Half-Life: Alyx, Sketchfab/TerMaty, Free
// Standard — ver public/hl3models/CREDITOS.txt), luz pensada e acabamento único. Primeiro: o teste do Advisor.
// =================================================================================================
import React, { useMemo } from "react";
import { AbsoluteFill, staticFile, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useLoader, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { clone as skClone } from "three/examples/jsm/utils/SkeletonUtils.js";
import { MONO } from "./overlays";
import { useKit, put } from "./hl3kit";
import { LiteCtx, SfxCtx } from "./sfx-ctx";
import { useAdvisors, placeAdvisor, advLightsFor, setArmP } from "./advgl";
import { drawGL } from "./xgl";
import { useGLB, placeGLB } from "./glbgl";
import { makeStrider, useRealStrider, useHla, HlaActor } from "./strider3d";

export const ADVISOR_GLB = "hl3models/advisor_hla.glb";
// um Advisor pronto para a cena: clone com esqueleto próprio, animação escolhida avançada pelo tempo do vídeo
export const useAdvisor = (clip = "idle") => {
  const gltf = useLoader(GLTFLoader, staticFile(ADVISOR_GLB));
  return useMemo(() => {
    const root = skClone(gltf.scene) as THREE.Group;
    root.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.castShadow = true;
        m.receiveShadow = true;
        m.frustumCulled = false;
      }
    });
    root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(root, true);
    const mixer = new THREE.AnimationMixer(root);
    const anim = gltf.animations.find((a) => a.name === clip) ?? gltf.animations.find((a) => a.name === "idle");
    if (anim) mixer.clipAction(anim).play();
    return { root, mixer, box, names: gltf.animations.map((a) => a.name) };
  }, [gltf, clip]);
};

const Probe: React.FC<{ f: number }> = ({ f }) => {
  const { camera, scene, gl, invalidate } = useThree();
  const A = useAdvisor("idle");
  const W = useMemo(() => {
    const g = new THREE.Group();
    const size = A.box.getSize(new THREE.Vector3());
    const c = A.box.getCenter(new THREE.Vector3());
    const k = 3.2 / Math.max(size.x, size.y, size.z);
    A.root.scale.setScalar(k);
    A.root.position.set(-c.x * k, -c.y * k + 1.8, -c.z * k);
    g.add(A.root);
    g.add(new THREE.HemisphereLight("#9fb4c8", "#141418", 0.6));
    const key = new THREE.SpotLight("#fff1dc", 260, 30, 0.5, 0.6, 1.4);
    key.position.set(4, 7, 5);
    key.target.position.set(0, 1.8, 0);
    key.castShadow = true;
    g.add(key, key.target);
    const fill = new THREE.DirectionalLight("#cfe0ff", 1.4);
    fill.position.set(-5, 4, 6);
    g.add(fill);
    const rim = new THREE.PointLight("#b07cff", 80, 12, 1.6);
    rim.position.set(-3, 2.5, -3);
    g.add(rim);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshStandardMaterial({ color: "#2a2e33", roughness: 0.6, metalness: 0.4 }));
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    g.add(floor);
    const bn: string[] = []; A.root.traverse((o) => { if (/arm|hand/.test(o.name)) bn.push(o.name); }); console.log("ADVISOR bones", bn.join(","));
    return g;
  }, [A]);
  gl.toneMapping = THREE.ACESFilmicToneMapping;
  gl.shadowMap.enabled = true;
  scene.background = new THREE.Color("#0a0c10");
  const a = f / 90;
  camera.position.set(Math.sin(a) * 6, 2.6, Math.cos(a) * 6);
  camera.lookAt(0, 1.8, 0);
  A.mixer.setTime(f / 30);
  // as mãos mecânicas: cada braço (3 segmentos + mão) ganha um movimento próprio por cima do idle —
  // o da esquerda estende e fecha a garra (telecinese), o da direita tateia devagar
  const bone = (n: string) => A.root.getObjectByName(n);
  const t = f / 30;
  (["L", "R"] as const).forEach((s, i) => {
    const reach = s === "L" ? 0.5 + 0.5 * Math.sin(t * 1.3) : 0.3 + 0.2 * Math.sin(t * 0.7 + 1);
    [0, 1, 2].forEach((k) => {
      const b2 = A.root.getObjectByProperty("name", `arm_${k}_${s}`) ?? bone(`arm_${k}_${s}_${[30, 29, 28][k] + (s === "R" ? 14 : 0)}`);
      if (b2) b2.rotation.z += (k === 0 ? -0.35 : 0.25) * reach * (s === "L" ? 1 : -1) + 0.04 * Math.sin(t * 2.1 + k + i);
    });
    const h = A.root.getObjectByProperty("name", `hand_${s}`) ?? bone(`hand_${s}_${s === "L" ? 27 : 41}`);
    if (h) h.rotation.x += 0.5 * Math.sin(t * 2.4 + i);
  });
  invalidate();
  return <primitive object={W} />;
};
export const HLAdvisorProbe: React.FC<{ life: number }> = () => {
  const f = useCurrentFrame();
  const lite = React.useContext(LiteCtx);
  const ctx = React.useContext(SfxCtx);
  return (
    <AbsoluteFill style={{ background: "#0a0c10" }}>
      {ctx.mode === "collect" ? null : (
        <ThreeCanvas frameloop="demand" width={1920} height={1080} dpr={lite ? 0.75 : 1} shadows gl={{ antialias: true }} camera={{ fov: 40, position: [0, 2, 6], near: 0.05, far: 200 }}>
          <Probe f={f} />
        </ThreeCanvas>
      )}
      <div style={{ position: "absolute", left: 40, top: 30, fontFamily: MONO, color: "#9fb4c8", fontSize: 18, letterSpacing: 4 }}>TESTE · ADVISOR 3D</div>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------------------------------------ teste do corredor
const CORR = ["Platforms/Platform_Metal2", "Platforms/Platform_DarkPlates", "Walls/WallAstra_Straight", "Walls/WallBand_Straight", "Walls/TopCables_Straight", "Walls/TopAstra_Straight", "Walls/BottomMetal_Straight", "Columns/Column_Simple", "Platforms/Door_Frame_Square", "Props/Prop_Light_Wide", "Props/Prop_Vent_Big", "Props/Prop_PipeHolder", "Props/Prop_Crate3", "Props/Prop_Barrel_Large", "Props/Prop_Computer", "Walls/WallAstra_Straight_Window"];
const CorrProbe: React.FC<{ f: number; f0: number }> = ({ f, f0 }) => {
  const { camera, scene, gl, invalidate } = useThree();
  const K = useKit(CORR);
  const A = useAdvisor("idle");
  const W = useMemo(() => {
    const g = new THREE.Group();
    for (let i = 0; i < 8; i++) {
      const z = -i * 4;
      g.add(put(K, "Platform_Metal2", 0, 0, z));
      const ceil = put(K, "Platform_DarkPlates", 0, 5, z);
      ceil.rotation.x = Math.PI;
      g.add(ceil);
      const wl = i % 3 === 2 ? "WallAstra_Straight_Window" : i % 2 ? "WallBand_Straight" : "WallAstra_Straight";
      g.add(put(K, wl, 0, 0, z, 0), put(K, wl, 0, 0, z, Math.PI));
      g.add(put(K, i % 2 ? "TopAstra_Straight" : "TopCables_Straight", 0, 0, z, 0), put(K, "TopCables_Straight", 0, 0, z, Math.PI));
      g.add(put(K, "BottomMetal_Straight", 0, 0, z, 0), put(K, "BottomMetal_Straight", 0, 0, z, Math.PI));
      const lt = put(K, "Prop_Light_Wide", 0.66, 4.98, z, 0);
      g.add(lt);
      const pl = new THREE.PointLight(f0 < 0 ? "#ffcf96" : "#ffe6c4", f0 < 0 ? 12 : 18, 9, 1.6);
      pl.position.set(0, 4.3, z);
      pl.castShadow = i < 3;
      g.add(pl);
    }
    g.add(put(K, "Door_Frame_Square", 0, 0, -30));
    g.add(put(K, "Prop_Crate3", 1.2, 0.5, -9, 0.3), put(K, "Prop_Barrel_Large", -1.3, 0, -14), put(K, "Prop_Computer", 1.5, 0, -18, -Math.PI / 2));
    // versão Borealis: o mesmo kit "envelhecido" (tinta cinza-esverdeada de navio, mais fosca)
    if (f0 < 0) {
      const seen = new Set<THREE.Material>();
      g.traverse((o) => {
        const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
        if (!m || seen.has(m) || !m.color) return;
        seen.add(m);
        const nm = m.clone();
        nm.color.multiply(new THREE.Color("#8a9088"));
        nm.roughness = Math.min(1, (nm.roughness ?? 0.5) + 0.25);
        (o as THREE.Mesh).material = nm;
      });
    }
    g.add(new THREE.HemisphereLight("#8fa4b8", "#1a1c20", 0.35));
    const core = new THREE.PointLight("#ff9a40", 60, 30, 1.5);
    core.position.set(0, 2.5, -34);
    g.add(core);
    const size = A.box.getSize(new THREE.Vector3());
    const k = 2.4 / Math.max(size.x, size.y, size.z);
    A.root.scale.setScalar(k);
    const c = A.box.getCenter(new THREE.Vector3());
    A.root.position.set(-c.x * k, -c.y * k + 2.8, -c.z * k - 20);
    g.add(A.root);
    return g;
  }, [K, A, f0 < 0]);
  gl.toneMapping = THREE.ACESFilmicToneMapping;
  gl.toneMappingExposure = 1.1;
  gl.shadowMap.enabled = true;
  scene.background = new THREE.Color("#050608");
  scene.fog = new THREE.FogExp2("#0b0d10", 0.035);
  camera.position.set(0.2 * Math.sin(f / 40), 1.7, 2 - f * 0.05);
  camera.lookAt(0, 1.8, -40);
  (camera as THREE.PerspectiveCamera).fov = 62;
  (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
  A.mixer.setTime(f / 30);
  invalidate();
  return <primitive object={W} />;
};
export const HLCorrProbe: React.FC<{ life: number }> = () => {
  const f = useCurrentFrame();
  const lite = React.useContext(LiteCtx);
  const ctx = React.useContext(SfxCtx);
  return (
    <AbsoluteFill style={{ background: "#050608" }}>
      {ctx.mode === "collect" ? null : (
        <ThreeCanvas frameloop="demand" width={1920} height={1080} dpr={lite ? 0.75 : 1} shadows gl={{ antialias: true }} camera={{ fov: 62, position: [0, 1.7, 2], near: 0.05, far: 200 }}>
          <CorrProbe f={f} f0={f > 250 ? -1 : 1} />
        </ThreeCanvas>
      )}
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------------------------------------ teste: eixos dos braços
// 12/10: descobrir qual rotação leva os braços PARA A FRENTE (pedido dele). Linha de cima: de frente; de baixo: de lado.
export const HLArmProbe: React.FC<{ life: number }> = () => {
  const ref = React.useRef<HTMLCanvasElement>(null);
  const advs = useAdvisors(15, 1.7);
  const V: [string, number, number, number, number, number][] = [["t0", -0.3, 1.3, 0.6, 0, 0], ["t2", -0.3, 1.3, 0.6, 0, 2], ["t4", -0.3, 1.3, 0.6, 0, 4], ["r.5", -0.3, 1.3, 0.6, 0.5, 1], ["r1", -0.3, 1.3, 0.6, 1, 1]];
  React.useLayoutEffect(() => {
    if (!ref.current || !advs.length) return;
    const extras: THREE.Object3D[] = [];
    advs.forEach((A, i) => {
      const col = i % 5, row = Math.floor(i / 5);
      const pos: [number, number, number] = [-5.2 + col * 2.6, 8, [4.4, 2.4, 0.4][row]];
      const look: [number, number, number][] = [[pos[0] - 10, pos[1], pos[2]], [pos[0], pos[1] - 10, pos[2]], [pos[0] - 7, pos[1] - 7, pos[2]]];
      placeAdvisor(A, pos, look[row]);
      setArmP(V[col][1], V[col][2], V[col][3]);
      A.pose(V[col][5], V[col][4]);
      extras.push(A.root);
    });
    drawGL(ref.current, { x: 0, y: -1, z: 2.6, yaw: 0, pitch: 0, F: 1000 }, [], null, extras, advLightsFor([3, -6, 8], "#ffffff", "#ccd", 5, [0, 9, 2]));
  });
  return (
    <AbsoluteFill style={{ background: "#50565e" }}>
      <canvas ref={ref} width={1920} height={1080} style={{ position: "absolute", inset: 0 }} />
      {V.map(([n], k) => <div key={k} style={{ position: "absolute", left: 960 + (-5.2 + k * 2.6) * 111 - 20, top: 40, fontFamily: MONO, color: "#fff", fontSize: 28 }}>{n}</div>)}
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------------------------------------ captura: gunship e Advisor
// 12/10: os dois modelos em cinza sobre preto, para virar máscara de holograma (o preto vira transparente no PIL)
export const HLModelSnap: React.FC<{ life: number }> = () => {
  const f = useCurrentFrame();
  const ref = React.useRef<HTMLCanvasElement>(null);
  const GS = useGLB("hl3models/gunship.glb", 1, 10);
  const advs = useAdvisors(1, 9);
  React.useLayoutEffect(() => {
    if (!ref.current || !GS.length || !advs.length) return;
    placeGLB(GS[0], [-6, 20, 2], [-16, 21.5, 1.4], Math.PI, 0, 0);
    placeAdvisor(advs[0], [7, 22, 2], [-3, 14, 2.4]);
    advs[0].pose(1, 0.6);
    const L = new THREE.DirectionalLight("#ffffff", 3);
    L.position.set(-10, 20, 30);
    drawGL(ref.current, { x: 0, y: 0, z: 2, yaw: 0, pitch: 0, F: 1100 }, [], null, [GS[0], advs[0].root], [new THREE.AmbientLight("#ffffff", 7), new THREE.HemisphereLight("#ffffff", "#888888", 4), L]);
    void f;
  });
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <canvas ref={ref} width={1920} height={1080} style={{ position: "absolute", inset: 0 }} />
    </AbsoluteFill>
  );
};

// teste: o Strider 3D (três vistas: de frente, de lado, andando)
export const HLStriderProbe: React.FC<{ life: number }> = () => {
  const f = useCurrentFrame();
  const ref = React.useRef<HTMLCanvasElement>(null);
  const RS = useRealStrider(20);
  React.useLayoutEffect(() => {
    if (!ref.current || !RS) return;
    RS.root.position.set(0, 0, -40);
    RS.root.rotation.y = 0.6;
    RS.set("idle", 2.8);
    RS.root.updateMatrixWorld(true);
    const L = new THREE.DirectionalLight("#ffffff", 3);
    L.position.set(-20, 40, 30);
    drawGL(ref.current, { x: 0, y: 0, z: 10, yaw: 0, pitch: 0.0, F: 900 }, [], null, [RS.root], [new THREE.HemisphereLight("#dfe8f0", "#505458", 3), L]);
  });
  return (
    <AbsoluteFill style={{ background: "#4a525c" }}>
      <canvas ref={ref} width={1920} height={1080} style={{ position: "absolute", inset: 0 }} />
      <div style={{ position: "absolute", left: 20, top: 20, color: "#fff", fontSize: 30 }}>{RS ? "ok" : "sem modelo"}</div>
    </AbsoluteFill>
  );
};

// 12/10: sonda do Vortigaunt do HL:Alyx (vort_hla.glb) — quatro cópias em tempos diferentes das animações
export const HLVortProbe: React.FC<{ life: number }> = () => {
  const f = useCurrentFrame();
  const ref = React.useRef<HTMLCanvasElement>(null);
  const V = useHla("vort_hla.glb", 1, 1.9, { walk: "vort_substation_2019_vort_catwalk" });
  React.useLayoutEffect(() => {
    if (!ref.current || !V.length) return;
    // retrato para o crachá: rosto e ombros, luz de estúdio quente de lado e recorte frio
    const A = V[0];
    A.root.position.set(0, 0, -2.2);
    A.root.rotation.y = 0.35 + 0.15 * Math.floor(f / 30);
    A.set("walk", 3 + Math.floor(f / 30) * 7);
    A.root.updateMatrixWorld(true);
    const key = new THREE.DirectionalLight("#ffe6c8", 3.2);
    key.position.set(-2, 2.5, 1.5);
    const rim = new THREE.DirectionalLight("#9fe6ff", 2.4);
    rim.position.set(2.5, 2, -2);
    drawGL(ref.current, { x: 0, y: 0, z: 1.55, yaw: 0, pitch: -0.02, F: 2600 }, [], null, [A.root], [new THREE.HemisphereLight("#d8d0c8", "#30281e", 1.4), key, rim]);
  });
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 40%, #3a4238 0%, #141814 80%)" }}>
      <canvas ref={ref} width={1920} height={1080} style={{ position: "absolute", inset: 0 }} />
    </AbsoluteFill>
  );
};
