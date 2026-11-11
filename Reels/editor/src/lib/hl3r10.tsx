// =================================================================================================
// HL3 · 1:08:24 → 1:15:14 reformulado em 3D (three.js) em 11/10/2026.
// Pedido dele: o bloco inteiro estava genérico (texto, setinhas, pontinhos), o navio fraco depois do Borealis bem
// desenhado, cenário cinza que não parecia gelo, salas que piscavam, o pilar sem sentido, caixas sem tampa, o Gordon
// "do nada" com a Alyx. Aqui: o mesmo Borealis 3D e o mesmo gelo do ataque (hl3r9s), uma parede de CCTV do navio para
// o procedimento e as equipes, e um interior do navio detalhado e contínuo (corredor → sala de controle → motores).
// =================================================================================================
import React, { useMemo } from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import * as THREE from "three";
import { MONO } from "./overlays";
import { C, rnd } from "./hl3";
import { FilmLook } from "./hl3r";
import { Eye, Hud } from "./hl3rf";
import { fadeIO } from "./hl3rx";
import { LiteCtx, SfxCtx } from "./sfx-ctx";
import { BState, World, projector, Call3, Sky, shipW, SX, SZ, kv, V, std, mesh, boxM } from "./hl3r9s";

const RED = "#ff5d4d";
const VIO = "#c79bff";
const CREAM = "#ffe2b0";
const P = (f: number, at: number, d = 12) => interpolate(f, [at, at + d], [0, 1], { ...C, easing: Easing.out(Easing.cubic) });

// estado "navio inteiro, sem ataque" para reaproveitar o mundo do ataque
export const calmState = (f: number, lite: boolean, cam: BState["cam"]): BState => {
  const st: BState = {
    f,
    lite,
    cam,
    ship: { on: true, op: 1, glow: 0, collapse: 0, burn: 0, scar: [0, 0, 0, 0, 0, 0] },
    guns: { up: 0, aim: shipW([0, 4, 0]), recoil: [0, 0, 0, 0] },
    stock: [0, 0, 0],
    truck: 0,
    mortar: 0,
    planes: [null, null],
    fire: [],
    smoke: [],
    tracers: [],
    flashes: [],
    ring: -1,
    crack: 0,
    ridge: false,
  };
  (st as unknown as { gunsUp: number[] }).gunsUp = [0, 0, 0, 0];
  return st;
};
const hudEye = (cam: BState["cam"]): Eye => ({ x: cam.pos[0], y: -cam.pos[2], z: cam.pos[1], yaw: Math.atan2(cam.tgt[0] - cam.pos[0], -(cam.tgt[2] - cam.pos[2])), pitch: 0, F: 1000 });

// ------------------------------------------------------------------------------------------------ 1:08:24 as duas formas
// o Borealis inteiro no gelo, de cima da crista. "Destruir o Borealis": cargas vermelhas piscando presas no costado e a
// linha de corte. "Usar contra o próprio Combine": o núcleo acende no convés e um feixe violeta vai do navio até a torre
// Combine no horizonte (a mesma rede que o Kleiner acabou de provar).
// 11/10 (pedido dele: a torre parecia flutuar no nada): mais perto, assentada numa base Combine no gelo, com névoa
const TOWER: V = [520, 0, -640];
export const TwoWays3D: React.FC<{ f: number; t0: number; destAt: number; useAt: number; life: number }> = ({ f, t0, destAt, useAt, life }) => {
  const lite = React.useContext(LiteCtx);
  const ctx = React.useContext(SfxCtx);
  const g = f - t0;
  const cam = { pos: kv(g, [[0, [-14, 9, 6]], [life - t0, [-6, 8, -4]]]), tgt: kv(g, [[0, [SX + 20, 6, SZ - 40]], [life - t0, [SX + 40, 12, SZ - 60]]]), fov: 46 };
  const st = calmState(f, lite, cam);
  const dest = P(f, destAt, 14);
  const use = P(f, useAt, 18);
  // cargas no costado (lado da câmera)
  const CH: V[] = [[-36, 3.0], [-18, 2.6], [-2, 3.2], [14, 2.8], [30, 2.4]].map(([x, y]) => shipW([x, y, 10.9]));
  const OBJ = useMemo(() => {
    const grp = new THREE.Group();
    // a torre Combine no horizonte: lâmina escura com nervuras e faixas de luz
    const tower = new THREE.Group();
    // 12/10 (pedido dele: a torre parecia flutuar): sem névoa na torre e na base — a silhueta escura vai inteira até o
    // gelo — e uma fileira de luzes na base, para ela assentar no horizonte
    const dark = std("#1d232a", 0.45, 0.8, { fog: false });
    const shape = new THREE.Shape();
    shape.moveTo(-22, 0);
    shape.lineTo(22, 0);
    shape.lineTo(9, 300);
    shape.lineTo(0, 340);
    shape.lineTo(-7, 300);
    shape.closePath();
    const body = mesh(new THREE.ExtrudeGeometry(shape, { depth: 18, bevelEnabled: false }), dark, [0, 0, -9], [0, 0.4, 0], false);
    tower.add(body);
    const stripM = new THREE.MeshBasicMaterial({ color: "#5ff3ff", fog: false });
    stripM.name = "strip";
    for (let i = 0; i < 9; i++) tower.add(mesh(new THREE.BoxGeometry(30 - i * 2.6, 1.6, 20), stripM, [0, 30 + i * 30, 0], [0, 0.4, 0], false));
    // a base: plataforma octogonal escura com escoras, assentada no gelo, e neve acumulada em volta
    tower.add(mesh(new THREE.CylinderGeometry(40, 46, 10, 8), dark, [0, 5, 0], [0, 0.4, 0], false));
    tower.add(mesh(new THREE.CylinderGeometry(60, 70, 3, 12), std("#cfdce6", 0.95, 0), [0, 1.2, 0], [0, 0, 0], false));
    const baseL = new THREE.MeshBasicMaterial({ color: "#ff5040", fog: false });
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      tower.add(mesh(new THREE.BoxGeometry(3, 2, 3), i % 4 ? stripM : baseL, [Math.cos(a) * 44, 9, Math.sin(a) * 44], [0, 0, 0], false));
    }
    tower.add(mesh(new THREE.CylinderGeometry(48, 48, 1.2, 8), stripM, [0, 10.6, 0], [0, 0.4, 0], false));
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + 0.4;
      const st = mesh(new THREE.BoxGeometry(6, 70, 6), dark, [Math.cos(a) * 30, 30, Math.sin(a) * 30], [Math.sin(a) * 0.35, 0, -Math.cos(a) * 0.35], false);
      tower.add(st);
    }
    tower.scale.setScalar(0.62);
    tower.position.set(...TOWER);
    grp.add(tower);
    // as cargas
    const chM = new THREE.MeshStandardMaterial({ color: "#3a1210", emissive: new THREE.Color("#ff2a1a"), emissiveIntensity: 0, roughness: 0.5 });
    const charges = CH.map((p) => {
      const c = boxM(1.6, 1.0, 0.5, chM, [p[0], p[1], p[2] + 0.25]);
      grp.add(c);
      return c;
    });
    // o feixe e o núcleo
    const beamM = new THREE.MeshBasicMaterial({ color: "#c79bff", transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 1, 12, 1, true), beamM);
    const beam2 = new THREE.Mesh(new THREE.CylinderGeometry(4, 4, 1, 12, 1, true), beamM.clone());
    grp.add(beam, beam2);
    const core = new THREE.Mesh(new THREE.SphereGeometry(3.2, 20, 14), new THREE.MeshBasicMaterial({ color: "#e9d6ff", transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    core.position.set(...shipW([2, 10, 0]));
    grp.add(core);
    const coreL = new THREE.PointLight("#b080ff", 0, 90, 1.4);
    coreL.position.copy(core.position);
    grp.add(coreL);
    return { grp, tower, chM, charges, beam, beam2, beamM, core, coreL, stripM };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const extra = (root: THREE.Group) => {
    if (OBJ.grp.parent !== root) root.add(OBJ.grp);
    OBJ.chM.emissiveIntensity = dest * (Math.floor(f / 8) % 2 ? 2.4 : 0.6);
    OBJ.charges.forEach((c, k) => (c.visible = f >= destAt + k * 3));
    const a = new THREE.Vector3(...shipW([2, 10, 0]));
    const b = new THREE.Vector3(TOWER[0], 195, TOWER[2]);
    const len = a.distanceTo(b);
    const reach = IOq((f - useAt) / 26);
    [OBJ.beam, OBJ.beam2].forEach((bm, i) => {
      bm.visible = use > 0;
      const L = Math.max(0.01, len * reach);
      const end = a.clone().lerp(b, reach);
      bm.position.copy(a.clone().add(end).multiplyScalar(0.5));
      bm.scale.set(1, L, 1);
      bm.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
      (bm.material as THREE.MeshBasicMaterial).opacity = use * (i ? 0.12 : 0.85) * (0.85 + 0.15 * Math.sin(f / 3));
    });
    (OBJ.core.material as THREE.MeshBasicMaterial).opacity = use * 0.9;
    OBJ.core.scale.setScalar(1 + 0.12 * Math.sin(f / 4));
    OBJ.coreL.intensity = use * 1400;
    OBJ.stripM.color.set(reach > 0.98 ? "#c79bff" : "#5ff3ff");
  };
  const pr = projector(cam);
  const hz = pr([cam.pos[0], 0, cam.pos[2] - 3000]);
  const yaw = hudEye(cam).yaw;
  // pulsos correndo no feixe
  const pa = pr(shipW([2, 10, 0]));
  const pb = pr([TOWER[0], 195, TOWER[2]]);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Sky hy={hz ? hz.y : 540} shift={yaw * 700} f={f} />
      {ctx.mode === "collect" ? null : (
        <ThreeCanvas frameloop="demand" width={1920} height={1080} style={{ position: "absolute", inset: 0 }} dpr={lite ? 0.75 : 1} shadows gl={{ antialias: true, alpha: true }} camera={{ fov: 46, position: [0, 3, 0], near: 0.3, far: 4000 }}>
          <World st={st} extra={extra} />
        </ThreeCanvas>
      )}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {/* a linha de corte: onde as cargas partiriam o casco */}
        {dest > 0
          ? (() => {
              const q = CH.map((c) => pr(c));
              if (q.some((v) => !v)) return null;
              return <polyline points={q.map((v) => `${v!.x},${v!.y}`).join(" ")} fill="none" stroke={RED} strokeWidth={2.5} strokeDasharray="10 8" strokeDashoffset={-f * 2} opacity={dest * 0.9} />;
            })()
          : null}
        <Call3 pr={pr} f={f} pt={CH[1]} from={destAt + 4} until={life + 99} text="DESTRUIR O BOREALIS" sub="CARGAS NO CASCO" col={RED} dx={-120} dy={170} />
        {use > 0 && pa && pb
          ? [0, 1, 2, 3].map((k) => {
              const u = ((f - useAt) / 26 + k / 4) % 1;
              if ((f - useAt) / 26 < u) return null;
              return <circle key={k} cx={pa.x + (pb.x - pa.x) * u} cy={pa.y + (pb.y - pa.y) * u} r={6 - u * 3} fill="#f4eaff" opacity={use * (1 - u * 0.6)} />;
            })
          : null}
        {pb ? <Call3 pr={pr} f={f} pt={[TOWER[0], 195, TOWER[2]]} from={useAt + 20} until={life + 99} text="USAR CONTRA OS COMBINE" sub="O NÚCLEO → A TORRE DA REDE COMBINE" col={VIO} dx={-200} dy={150} /> : null}
        <text x={960} y={150} textAnchor="middle" fill={CREAM} fontFamily={MONO} fontSize={21} letterSpacing={6} opacity={P(f, t0 + 6, 10)} style={{ paintOrder: "stroke", stroke: "rgba(0,0,0,0.8)", strokeWidth: 4 }}>PELA PRIMEIRA VEZ · DUAS FORMAS DE TERMINAR A GUERRA</text>
      </svg>
      <Hud f={f} yaw={yaw} eye={hudEye(cam)} blips={[]} />
      <FilmLook />
    </AbsoluteFill>
  );
};
const IOq = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : 1 - Math.pow(1 - x, 3));
void rnd;
void fadeIO;
