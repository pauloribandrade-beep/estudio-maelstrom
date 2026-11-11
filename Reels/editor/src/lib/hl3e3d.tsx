import React, { useMemo } from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { FONT, MONO } from "./overlays";
import { C, HL, OUT, lerp, rnd } from "./hl3";
import { LiteCtx, SfxCtx } from "./sfx-ctx";

// 1D, "por que caralho... Half-Life 3? Tem a ver com a história": o pé de cabra do Gordon em 3D
// entra com o impacto (da câmera para o centro, girando), treme e assenta; "HALF-LIFE 3" nasce atrás
// na palavra e "tem a ver com a história" embaixo. Tempos em QUADROS relativos à cena.

const Env: React.FC = () => {
  const { gl, scene } = useThree();
  useMemo(() => {
    const pm = new THREE.PMREMGenerator(gl);
    scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    return () => pm.dispose();
  }, [gl, scene]);
  return null;
};

// pé de cabra: barra sextavada grossa; em cima o gancho em "J" fechado terminando na garra bifurcada,
// embaixo a ponta chata levemente dobrada (como o do Half-Life)
const crowbarCurve = () =>
  new THREE.CatmullRomCurve3(
    [
      [0.16, -1.86, 0],
      [0.05, -1.62, 0],
      [0, -1.32, 0],
      [0, 0.8, 0],
      [0, 1.12, 0],
      [0.03, 1.34, 0],
      [0.13, 1.5, 0],
      [0.29, 1.57, 0],
      [0.44, 1.52, 0],
      [0.52, 1.4, 0],
    ].map(([x, y, z]) => new THREE.Vector3(x, y, z)),
    false,
    "centripetal",
  );

const Crowbar: React.FC<{ rot: [number, number, number]; pos: [number, number, number]; scale: number }> = ({ rot, pos, scale }) => {
  const g = useMemo(() => {
    const c = crowbarCurve();
    const R = 0.105;
    const body = new THREE.TubeGeometry(c, 200, R, 6, false);
    const sub = (a: number, b: number) => new THREE.CatmullRomCurve3(Array.from({ length: 12 }).map((_, i) => c.getPoint(a + ((b - a) * i) / 11)));
    const tipA = new THREE.TubeGeometry(sub(0, 0.06), 24, R * 1.03, 6, false);
    const tipB = new THREE.TubeGeometry(sub(0.9, 1), 30, R * 1.03, 6, false);
    // garra: dois dentes chatos na ponta do gancho, na direção da tangente
    const end = c.getPoint(1);
    const tan = c.getTangent(1).normalize();
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), tan);
    // ponta chata de baixo
    const start = c.getPoint(0);
    const tan0 = c.getTangent(0).normalize().multiplyScalar(-1);
    const q0 = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), tan0);
    return { body, tipA, tipB, end, q, start, q0, tan, tan0 };
  }, []);
  const red = <meshStandardMaterial color="#7e1214" metalness={0.35} roughness={0.55} envMapIntensity={0.9} />;
  const steel = <meshStandardMaterial color="#8f969e" metalness={0.95} roughness={0.35} />;
  return (
    <group position={pos} rotation={rot} scale={scale}>
      <mesh geometry={g.body}>{red}</mesh>
      <mesh geometry={g.tipA}>{steel}</mesh>
      <mesh geometry={g.tipB}>{steel}</mesh>
      {/* garra bifurcada */}
      <group position={g.end.clone().add(g.tan.clone().multiplyScalar(0.07))} quaternion={g.q}>
        <mesh position={[0, 0, 0.055]}>
          <boxGeometry args={[0.2, 0.2, 0.06]} />
          {steel}
        </mesh>
        <mesh position={[0, 0, -0.055]}>
          <boxGeometry args={[0.2, 0.2, 0.06]} />
          {steel}
        </mesh>
      </group>
      {/* ponta chata */}
      <group position={g.start.clone().add(g.tan0.clone().multiplyScalar(0.07))} quaternion={g.q0}>
        <mesh>
          <boxGeometry args={[0.24, 0.18, 0.06]} />
          {steel}
        </mesh>
      </group>
    </group>
  );
};

export const HLCrowbar3D: React.FC<{ life: number; slamAt?: number; titleAt?: number; subAt?: number; title?: string; num?: string; sub?: string }> = ({
  life,
  slamAt = 2,
  titleAt = 60,
  subAt = 100,
  title = "HALF-LIFE",
  num = "3",
  sub = "tem a ver com a história",
}) => {
  const f = useCurrentFrame();
  const lite = React.useContext(LiteCtx);
  const ctx = React.useContext(SfxCtx);
  const o = interpolate(f, [life - 12, life], [1, 0], C);
  const k = interpolate(f, [slamAt - 6, slamAt + 4], [0, 1], { ...C, easing: Easing.in(Easing.cubic) }); // chegada
  const after = Math.max(0, f - slamAt - 4);
  // vem da câmera girando rápido e trava; depois gira devagar e flutua
  const z = 3.8 * (1 - k);
  const spinIn = (1 - k) * Math.PI * 3;
  const settle = Math.exp(-after / 7) * Math.sin(after * 1.6) * 0.12;
  const rotY = -0.5 + spinIn + after * 0.012;
  const rotZ = 0.62 + settle + Math.sin(after / 40) * 0.04;
  const rotX = 0.12 + Math.sin(after / 55) * 0.06;
  const yF = Math.sin(after / 45) * 0.06;
  const shake = f >= slamAt && f < slamAt + 12 ? (1 - (f - slamAt) / 12) * 16 : 0;
  const sx = shake ? (rnd(f * 7) - 0.5) * shake : 0;
  const sy = shake ? (rnd(f * 11) - 0.5) * shake : 0;
  const flash = interpolate(f, [slamAt, slamAt + 1, slamAt + 12], [0.85, 0.6, 0], C);
  const ring = lerp(f, slamAt, slamAt + 22, 0, 1, OUT);
  const tp = (i: number) => lerp(f, titleAt + i * 1.5, titleAt + i * 1.5 + 10, 0, 1, OUT);
  const np = lerp(f, titleAt + title.length * 1.5 + 2, titleAt + title.length * 1.5 + 12, 0, 1, { ...C, easing: Easing.out(Easing.back(2.2)) });
  const sp = lerp(f, subAt, subAt + 12, 0, 1, OUT);
  return (
    <AbsoluteFill style={{ opacity: o, transform: `translate(${sx}px, ${sy}px)` }}>
      {/* luz vermelha atrás e onda de choque do impacto */}
      <div style={{ position: "absolute", left: 960 - 900, top: 540 - 900, width: 1800, height: 1800, borderRadius: "50%", background: "radial-gradient(closest-side, rgba(200,30,30,0.28), rgba(200,30,30,0))", opacity: k }} />
      {f >= slamAt ? <div style={{ position: "absolute", left: 960 - 1150 * ring, top: 540 - 1150 * ring, width: 2300 * ring, height: 2300 * ring, borderRadius: "50%", border: `${8 * (1 - ring) + 1}px solid rgba(255,214,170,${0.8 * (1 - ring)})` }} /> : null}
      {/* HALF-LIFE 3 atrás do pé de cabra */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 380, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 230, letterSpacing: -6, lineHeight: 1, color: "rgba(242,240,247,0.92)" }}>
        {title.split("").map((ch, i) => (
          <span key={i} style={{ display: "inline-block", whiteSpace: "pre", opacity: tp(i), transform: `translateY(${(1 - tp(i)) * 40}px)`, filter: tp(i) < 1 ? `blur(${(1 - tp(i)) * 10}px)` : undefined }}>
            {ch}
          </span>
        ))}
        <span style={{ display: "inline-block", marginLeft: 40, color: HL.orange, opacity: Math.min(1, np), transform: `scale(${0.6 + 0.4 * np})`, textShadow: `0 0 60px rgba(255,138,31,${0.8 * Math.min(1, np)})` }}>{num}</span>
      </div>
      {ctx.mode === "collect" ? null : (
        <ThreeCanvas width={1920} height={1080} style={{ position: "absolute", inset: 0 }} dpr={lite ? 0.5 : undefined} gl={{ antialias: !lite, alpha: true }} camera={{ fov: 30, position: [0, 0, 7], near: 0.1, far: 100 }}>
          <Env />
          <ambientLight intensity={0.25} />
          <directionalLight position={[3, 4, 5]} intensity={2.2} color="#fff1e0" />
          <directionalLight position={[-4, 1, -2]} intensity={2.6} color="#9fd8ff" />
          <directionalLight position={[0, -3, 3]} intensity={0.8} color="#ff8a1f" />
          <Crowbar rot={[rotX, rotY, rotZ]} pos={[0, yF - 0.18, z]} scale={1.0} />
        </ThreeCanvas>
      )}
      <div style={{ position: "absolute", left: 0, right: 0, top: 930, textAlign: "center", fontFamily: MONO, fontSize: 30, letterSpacing: 10, textTransform: "uppercase", color: "rgba(242,240,247,0.85)", opacity: sp, transform: `translateY(${(1 - sp) * 14}px)` }}>{sub}</div>
      <AbsoluteFill style={{ background: "#fff3e2", opacity: flash, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};
