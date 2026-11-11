import React, { useEffect, useMemo, useState } from "react";
import { AbsoluteFill, Easing, continueRender, delayRender, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { C } from "./hl3";
import { LiteCtx, SfxCtx } from "./sfx-ctx";

// Virada 1D → 2A (2026-10-01): FENDA 3D + G-MAN DE VERDADE (modelo oficial do Half-Life: Alyx, exportado com o
// Source 2 Viewer e enxugado com glTF-Transform → public/models/gman.glb, animações oficiais).
// O G-Man fica no escuro, recortado pela luz verde-azulada da fenda atrás dele, e caminha para fora dela.
// Em `hitAt` a fenda explode em luz (o impacto; o título entra no corte). Tempos em QUADROS relativos à cena.

const RIFT_VERT = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;
const RIFT_FRAG = /* glsl */ `
uniform float uTime; uniform float uOpen; uniform float uGrow; uniform float uFlash;
varying vec2 vUv;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){ vec2 i = floor(p); vec2 f = fract(p); vec2 u = f*f*(3.0-2.0*f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), u.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y); }
float fbm(vec2 p){ float v = 0.0; float a = 0.5; for (int i = 0; i < 5; i++){ v += a * noise(p); p *= 2.03; a *= 0.5; } return v; }
void main(){
  vec2 p = vUv - 0.5;                       // x: -0.5..0.5 (largura), y: -0.5..0.5 (altura)
  float ay = abs(p.y) * 2.0;
  float len = uGrow;                        // altura visível da fenda (0..1)
  float lens = sqrt(max(0.0, 1.0 - pow(ay / max(len, 0.001), 2.0)));   // forma de olho
  float w = (0.004 + 0.11 * uOpen) * lens;  // meia-largura
  float wob = (fbm(vec2(p.y * 7.0, uTime * 0.8)) - 0.5) * (0.012 + 0.05 * uOpen);
  float d = abs(p.x + wob);
  float edge = (fbm(vec2(p.y * 22.0 + uTime * 2.0, p.x * 30.0)) - 0.5) * 0.02 * (0.3 + uOpen);
  float core = smoothstep(w + 0.004 + edge, w * 0.2, d);                  // miolo quente
  float glow = exp(-d / (0.02 + 0.05 * uOpen)) * lens * 0.9;               // brilho em volta
  float fil = pow(max(0.0, 1.0 - abs(fbm(vec2(p.y * 14.0 - uTime * 3.0, p.x * 9.0 + uTime)) - 0.5) * 9.0), 6.0)
              * exp(-d / 0.06) * lens * (0.4 + uOpen);                       // filamentos elétricos
  vec3 teal = vec3(0.37, 0.88, 0.77); vec3 ice = vec3(0.86, 1.0, 0.97);
  vec3 col = teal * (glow + fil * 1.4) + ice * core * 1.6;
  float a = clamp(core + glow * 0.8 + fil, 0.0, 1.0) * step(ay, len + 0.02);
  col += ice * uFlash; a = max(a, uFlash * 0.9);
  gl_FragColor = vec4(col, a);
}
`;

const useGman = () => {
  const [gltf, setGltf] = useState<{ scene: THREE.Group; animations: THREE.AnimationClip[] } | null>(null);
  const [handle] = useState(() => delayRender("G-Man glb"));
  useEffect(() => {
    new GLTFLoader().load(
      staticFile("models/gman.glb"),
      (g) => {
        setGltf(g as unknown as { scene: THREE.Group; animations: THREE.AnimationClip[] });
        continueRender(handle);
      },
      undefined,
      (e) => {
        console.error(e);
        continueRender(handle);
      },
    );
  }, [handle]);
  return gltf;
};

const Gman: React.FC<{ t: number; clip: string; x: number; z: number; rotY: number }> = ({ t, clip, x, z, rotY }) => {
  const gltf = useGman();
  const mixer = useMemo(() => (gltf ? new THREE.AnimationMixer(gltf.scene) : null), [gltf]);
  const action = useMemo(() => {
    if (!gltf || !mixer) return null;
    const c = gltf.animations.find((a) => a.name === clip) ?? gltf.animations[0];
    const a = mixer.clipAction(c);
    a.play();
    return a;
  }, [gltf, mixer, clip]);
  useMemo(() => {
    if (!gltf) return;
    gltf.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.frustumCulled = false;
        const mat = m.material as THREE.MeshStandardMaterial;
        if (mat && "envMapIntensity" in mat) {
          mat.envMapIntensity = 0.15;
          mat.roughness = Math.max(0.45, mat.roughness ?? 0.6);
        }
      }
    });
  }, [gltf]);
  if (!gltf || !mixer || !action) return null;
  mixer.setTime(Math.max(0, t));
  return <primitive object={gltf.scene} position={[x, 0, z]} rotation={[0, rotY, 0]} />;
};

const Camera: React.FC<{ z: number; y: number }> = ({ z, y }) => {
  const { camera } = useThree();
  camera.position.set(0, y, z);
  camera.lookAt(0, 1.2, 0);
  return null;
};

export const HLGmanRift3D: React.FC<{ life: number; hitAt: number; clip?: string; clipFrom?: number; walkFrom?: number; walkTo?: number; debug?: boolean }> = ({
  life,
  hitAt,
  clip = "gman_void_01_enter",
  clipFrom = 0,
  walkFrom = -1.6,
  walkTo = 0.9,
  debug,
}) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const lite = React.useContext(LiteCtx);
  const ctx = React.useContext(SfxCtx);
  const after = f - hitAt;
  const grow = interpolate(f, [0, hitAt * 0.4], [0.05, 1], { ...C, easing: Easing.out(Easing.cubic) });
  const open = interpolate(f, [hitAt * 0.3, hitAt * 0.7], [0, 1], { ...C, easing: Easing.inOut(Easing.cubic) });
  const walk = interpolate(f, [hitAt * 0.35, hitAt], [0, 1], { ...C, easing: Easing.out(Easing.quad) });
  const flash = after >= 0 ? interpolate(after, [0, 2, 14], [0, 1, 0], C) : interpolate(f, [hitAt - 6, hitAt], [0, 0.35], C);
  const o = interpolate(f, [life - 8, life], [1, 0], C);
  const camZ = 7.2 - 1.6 * interpolate(f, [0, hitAt], [0, 1], { ...C, easing: Easing.inOut(Easing.quad) });
  const riftLight = (2 + 26 * open) * (1 + 3 * flash);
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uOpen: { value: 0 }, uGrow: { value: 0 }, uFlash: { value: 0 } }), []);
  uniforms.uTime.value = f / fps;
  uniforms.uOpen.value = open;
  uniforms.uGrow.value = grow;
  uniforms.uFlash.value = after >= 0 ? flash : 0;
  // partículas: saem da fenda em direção à câmera (determinísticas)
  const N = 260;
  const pts = useMemo(() => new Float32Array(N * 3), []);
  for (let i = 0; i < N; i++) {
    const r = Math.sin(i * 12.9898) * 43758.5453;
    const a = r - Math.floor(r);
    const r2 = Math.sin(i * 78.233) * 12345.678;
    const b = r2 - Math.floor(r2);
    const ph = ((f / fps) * (0.12 + 0.25 * open) + a) % 1;
    pts[i * 3] = (b - 0.5) * 0.6 * (1 + 4 * ph);
    pts[i * 3 + 1] = 0.2 + 3.6 * (((i * 0.618) % 1) - 0.0) * (0.6 + 0.4 * ph);
    pts[i * 3 + 2] = -0.4 + 6.5 * ph;
  }
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pts, 3));
    return g;
  }, [pts]);
  geo.attributes.position.needsUpdate = true;
  if (ctx.mode === "collect") return null;
  return (
    <AbsoluteFill style={{ opacity: o, pointerEvents: "none" }}>
      <ThreeCanvas width={1920} height={1080} style={{ position: "absolute", inset: 0 }} dpr={lite ? 0.6 : undefined} gl={{ antialias: !lite, alpha: true }} camera={{ fov: 32, position: [0, 1.4, 7], near: 0.05, far: 100 }}>
        <Camera z={camZ} y={1.35} />
        <ambientLight intensity={debug ? 2 : 0.03} />
        {debug ? <directionalLight position={[0, 2, 6]} intensity={3} /> : null}
        {/* a luz da fenda vem de trás: recorta o G-Man e acende o chão */}
        <pointLight position={[0, 1.4, -0.6]} intensity={riftLight} distance={14} decay={1.6} color="#7ef0d4" />
        <directionalLight position={[0, 2.5, -4]} intensity={0.8 + 2.5 * open} color="#9ff7e2" />
        <directionalLight position={[3, 3, 5]} intensity={0.05} color="#b9c2ff" />
        {/* a fenda */}
        <mesh position={[0, 1.6, -0.9]}>
          <planeGeometry args={[4.2, 4.2]} />
          <shaderMaterial vertexShader={RIFT_VERT} fragmentShader={RIFT_FRAG} uniforms={uniforms} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
        {/* chão escuro e brilhante (reflete a luz da fenda) */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <planeGeometry args={[40, 40]} />
          <meshStandardMaterial color="#05060a" metalness={0.6} roughness={0.35} />
        </mesh>
        <points geometry={geo}>
          <pointsMaterial size={0.025} color="#b8ffee" transparent opacity={0.35 + 0.5 * open} depthWrite={false} blending={THREE.AdditiveBlending} />
        </points>
        {/* a própria animação anda (root motion); girado 180° ele vem da fenda na direção da câmera */}
        <Gman t={clipFrom + f / fps} clip={clip} x={0} z={walkFrom} rotY={Math.PI} />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};

// o G-Man como SOMBRA (parado, observando): o modelo oficial no escuro, só o contorno aceso por uma luz de trás.
// Fundo transparente: quem usa posiciona o quadro (left/top/width/height) onde ele deve aparecer (atrás de um vidro, ao longe).
export const GmanShadow: React.FC<{ f: number; clip?: string; from?: number; rim?: string; rimK?: number; o?: number; turn?: number }> = ({ f, clip = "gman_approach_pre_idle", from = 0, rim = "#9fe6ff", rimK = 3, o = 1, turn = 0 }) => {
  const { fps } = useVideoConfig();
  const lite = React.useContext(LiteCtx);
  const ctx = React.useContext(SfxCtx);
  if (ctx.mode === "collect") return null;
  return (
    <AbsoluteFill style={{ opacity: o, pointerEvents: "none" }}>
      <ThreeCanvas width={600} height={900} style={{ position: "absolute", inset: 0 }} dpr={lite ? 0.6 : undefined} gl={{ antialias: !lite, alpha: true }} camera={{ fov: 30, position: [0, 1.3, 6.2], near: 0.05, far: 50 }}>
        <Camera z={6.2} y={1.25} />
        <ambientLight intensity={0.015} />
        <directionalLight position={[0, 2.4, -4]} intensity={rimK} color={rim} />
        <directionalLight position={[-2.5, 2, -3]} intensity={rimK * 0.6} color={rim} />
        <directionalLight position={[2, 3, 5]} intensity={0.04} color="#b9c2ff" />
        <Gman t={from + f / fps} clip={clip} x={0} z={0} rotY={turn} />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
