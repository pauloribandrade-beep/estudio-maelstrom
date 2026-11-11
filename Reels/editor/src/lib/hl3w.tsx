import React, { useContext, useEffect, useMemo, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, Easing, interpolate, staticFile, useCurrentFrame } from "remotion";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Canvas3D, makeSoldier, makeStrider } from "./hl3j";
import { MONO } from "./overlays";
import { C } from "./hl3";
import { LiteCtx } from "./sfx-ctx";

// 3C · O ATAQUE NO MAPA TÁTICO DE MESA. Uma maquete em relevo (curvas de nível que brilham, quadrícula de mapa) com o
// acampamento no meio: pinheirinhos nevados, barracas, a fogueira acesa e a caixa com os DADOS. A Resistência são
// fichas com o λ; o Combine são peões brancos-azulados, Hunters e um Strider em miniatura que anda e CAI. A cena é uma
// só, contínua, e muda com a narração: o acampamento quieto → contato na mata → o ataque → os peões ignoram os
// rebeldes e cercam os DADOS → Varga assume a defesa (fichas λ acendem) → Gordon entra → o Hunter salta no Gordon e
// o Varga derruba → a resistência repele, o Strider cai → falta um pedaço dos dados. Tempos em QUADROS.

const AMB = "#ffb22e";
const RED = "#ff4d5e";
const ICE = "#c6f7ff";
const P = (f: number, at: number, d = 12) => interpolate(f, [at, at + d], [0, 1], { ...C, easing: Easing.out(Easing.cubic) });
const IO = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], { ...C, easing: Easing.inOut(Easing.cubic) });
const rnd = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
type V3 = [number, number, number];

// ---------------------------------------------------------------- relevo
const hash = (x: number, y: number) => {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const vn = (x: number, y: number) => {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  return (hash(xi, yi) * (1 - u) + hash(xi + 1, yi) * u) * (1 - v) + (hash(xi, yi + 1) * (1 - u) + hash(xi + 1, yi + 1) * u) * v;
};
// clareira do acampamento no 0,0; morros em volta; um vale descendo para o sul (por onde vieram)
const H = (x: number, z: number) => {
  const r = Math.hypot(x, z * 1.2);
  const hills = 0.55 * vn(x * 0.32 + 3, z * 0.32 + 7) + 0.25 * vn(x * 0.8, z * 0.8) + 0.08 * vn(x * 2.2, z * 2.2);
  const ring = THREE.MathUtils.smoothstep(r, 2.2, 6.5);
  const valley = Math.exp(-((x + 0.6 * Math.sin(z * 0.3)) ** 2) / 3) * THREE.MathUtils.smoothstep(z, 1, 8) * 0.9;
  const north = THREE.MathUtils.smoothstep(-z, 3, 8) * 0.6;
  return 0.04 * vn(x * 3, z * 3) + ring * (hills * 1.5 + north) - valley * ring * 0.8;
};

const TERRAIN_VS = `varying vec3 vW; varying vec3 vN;
void main(){ vec4 w = modelMatrix * vec4(position,1.); vW = w.xyz; vN = normalize(mat3(modelMatrix)*normal); gl_Position = projectionMatrix * viewMatrix * w; }`;
const TERRAIN_FS = `uniform vec3 uFire; uniform float uFlick; uniform float uAlarm; uniform vec3 uCam; varying vec3 vW; varying vec3 vN;
float aal(float v, float w){ float d = fwidth(v); return 1. - smoothstep(0., d * w, abs(v)); }
void main(){
  vec3 n = normalize(vN);
  float dl = max(dot(n, normalize(vec3(-.5,.9,.35))), 0.); float lit = .6 + .3 * step(.4, dl) + .1 * dl;
  float h = vW.y;
  vec3 base = mix(vec3(.05,.075,.10), vec3(.11,.15,.19), clamp(h * .45, 0., 1.)) * lit;
  // neve nas encostas mais planas e no alto
  base = mix(base, vec3(.19,.23,.28) * lit, smoothstep(.75, .95, n.y) * clamp(h * .6, 0., .6));
  // curvas de nível: a cada .14, a mestra a cada 5
  float c1 = aal(fract(h / .14 + .5) - .5, 1.4);
  float c5 = aal(fract(h / .7 + .5) - .5, 1.8);
  vec3 col = base + vec3(.45,.8,1.) * (c1 * .16 + c5 * .34);
  // quadrícula do mapa
  vec2 g = abs(fract(vW.xz / 2. + .5) - .5);
  float grid = max(aal(g.x, 1.), aal(g.y, 1.));
  col += vec3(.45,.8,1.) * grid * .07;
  // a luz da fogueira na clareira
  float d = length(vW.xz - uFire.xz);
  col += vec3(1., .5, .18) * exp(-d * d * 1.3) * .55 * uFlick;
  // alarme: o mapa pulsa vermelho por baixo
  col += vec3(1., .15, .2) * uAlarm * (.08 + .06 * c1);
  // neblina para o fundo
  float fd = length(vW - uCam);
  col = mix(col, vec3(.02,.03,.045), smoothstep(10., 26., fd));
  gl_FragColor = vec4(col, 1.);
}`;

// ---------------------------------------------------------------- peças
const lambdaTex = (() => {
  let t: THREE.Texture | null = null;
  return () => {
    if (t) return t;
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d")!;
    g.fillStyle = "#2a1406";
    g.beginPath();
    g.arc(64, 64, 62, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = "#ff9a3a";
    g.lineWidth = 6;
    g.beginPath();
    g.arc(64, 64, 54, 0, Math.PI * 2);
    g.stroke();
    g.fillStyle = "#ffb04a";
    g.font = "700 92px Georgia, 'Times New Roman', serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText("λ", 64, 70);
    t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    // a tampa do cilindro espelha a textura na vertical: desfaz
    t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(1, -1);
    return t;
  };
})();

// etiqueta: a largura acompanha o texto (nada cortado)
const labelTex = (() => {
  const cache = new Map<string, { t: THREE.Texture; asp: number }>();
  return (txt: string, col: string) => {
    const k = txt + col;
    let r = cache.get(k);
    if (r) return r;
    const m = document.createElement("canvas").getContext("2d")!;
    m.font = `700 44px ${MONO}`;
    const W = Math.ceil(m.measureText(txt).width + 64);
    const c = document.createElement("canvas");
    c.width = W;
    c.height = 96;
    const g = c.getContext("2d")!;
    g.font = `700 44px ${MONO}`;
    g.fillStyle = "rgba(4,8,12,0.78)";
    g.fillRect(4, 14, W - 8, 64);
    g.strokeStyle = col;
    g.lineWidth = 3;
    g.strokeRect(4, 14, W - 8, 64);
    g.fillStyle = col;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(txt, W / 2, 48);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    r = { t, asp: W / 96 };
    cache.set(k, r);
    return r;
  };
})();

const Label: React.FC<{ pos: V3; text: string; col?: string; o: number; s?: number }> = ({ pos, text, col = AMB, o, s = 1 }) => {
  if (o <= 0.01) return null;
  const { t, asp } = labelTex(text, col);
  return (
    <sprite position={pos} scale={[0.41 * s * asp, 0.41 * s, 1]} renderOrder={10}>
      <spriteMaterial map={t} transparent opacity={o} depthTest={false} />
    </sprite>
  );
};

// ---------------------------------------------------------------- visual "3D com cara de 2D": tom chapado em 3 degraus
// (MeshToon) + contorno escuro por fora de cada peça (casca invertida). Sem sombra projetada.
const GRAD = (() => {
  const d = new Uint8Array([90, 170, 255]);
  const t = new THREE.DataTexture(d, 3, 1, THREE.RedFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter;
  t.needsUpdate = true;
  return t;
})();
const TOONS = new Map<string, THREE.MeshToonMaterial>();
const toon = (color: string, emissive = "#000000", ei = 0) => {
  const k = `${color}|${emissive}|${ei}`;
  let m = TOONS.get(k);
  if (!m) TOONS.set(k, (m = new THREE.MeshToonMaterial({ color, gradientMap: GRAD, emissive, emissiveIntensity: ei })));
  return m;
};
const INK = new THREE.MeshBasicMaterial({ color: "#05070b", side: THREE.BackSide });
// aplica tom chapado + contorno numa árvore de objetos já montada (ex.: o Strider do feed)
const toonify = (root: THREE.Object3D, k = 1.1, lift = 0) => {
  const meshes: THREE.Mesh[] = [];
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.isMesh && !m.userData.ink) meshes.push(m);
  });
  for (const m of meshes) {
    const src = m.material as THREE.MeshStandardMaterial;
    if (src.type === "MeshBasicMaterial") continue; // luzes, traçantes: ficam como estão
    m.material = toon("#" + src.color.clone().lerp(new THREE.Color("#9fb0c4"), lift).getHexString());
    const ink = new THREE.Mesh(m.geometry, INK);
    ink.userData.ink = true;
    ink.scale.setScalar(k);
    m.add(ink);
  }
};
// malha com contorno, em JSX
const Inked: React.FC<{ geo: React.ReactNode; mat: THREE.Material; pos?: V3; rot?: V3; scale?: V3; k?: number }> = ({ geo, mat, pos, rot, scale, k = 1.12 }) => (
  <group position={pos} rotation={rot} scale={scale}>
    <mesh material={mat}>{geo}</mesh>
    <mesh material={INK} scale={[k, k, k]}>
      {geo}
    </mesh>
  </group>
);

const Token: React.FC<{ pos: V3; o: number; big?: boolean; hot?: number }> = ({ pos, o, big = false, hot = 0 }) => {
  const mats = useMemo(() => {
    const side = toon("#c2601c");
    const top = new THREE.MeshToonMaterial({ map: lambdaTex(), gradientMap: GRAD, emissive: new THREE.Color("#ff8a2a"), emissiveMap: lambdaTex(), emissiveIntensity: 0.6 });
    return [side, top, side];
  }, []);
  if (o <= 0.01) return null;
  const r = big ? 0.3 : 0.22;
  const s = THREE.MathUtils.clamp(o, 0, 1);
  const jump = Math.sin(Math.min(1, o) * Math.PI) * 0.25 * (o < 1 ? 1 : 0);
  mats[1].emissiveIntensity = 0.5 + hot * 1.5;
  return (
    <group position={[pos[0], pos[1] + jump, pos[2]]} scale={[s, s, s]}>
      <mesh material={mats} position={[0, 0.04, 0]}>
        <cylinderGeometry args={[r, r * 1.05, 0.08, 32]} />
      </mesh>
      <mesh material={INK} position={[0, 0.04, 0]} scale={[1.08, 1.25, 1.08]}>
        <cylinderGeometry args={[r, r * 1.05, 0.08, 32]} />
      </mesh>
      {big ? (
        <mesh position={[0, 0.085, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[r * 1.1, r * 1.25, 40]} />
          <meshBasicMaterial color="#ffe2b0" />
        </mesh>
      ) : null}
    </group>
  );
};

const PAWN_GEO = (() => {
  let g: THREE.LatheGeometry | null = null;
  return () => {
    if (g) return g;
    const pts = [
      [0, 0],
      [0.15, 0],
      [0.15, 0.04],
      [0.1, 0.07],
      [0.075, 0.12],
      [0.055, 0.28],
      [0.09, 0.31],
      [0.09, 0.34],
      [0.04, 0.36],
      [0, 0.36],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    g = new THREE.LatheGeometry(pts, 24);
    return g;
  };
})();
// peão Combine: corpo azul-acinzentado chapado, cabeça branca acesa (o visor)
const Pawn: React.FC<{ pos: V3; o: number; dead?: number }> = ({ pos, o, dead = 0 }) => {
  if (o <= 0.01) return null;
  return (
    <group position={pos} rotation={[0, 0, dead * 1.45]} scale={[o, o, o]}>
      <mesh geometry={PAWN_GEO()} material={toon("#3f5170")} />
      <mesh geometry={PAWN_GEO()} material={INK} scale={[1.14, 1.04, 1.14]} />
      <mesh position={[0, 0.43, 0]} material={toon("#e6f6ff", "#7fd2ff", 1.3 * (1 - dead))}>
        <sphereGeometry args={[0.075, 16, 12]} />
      </mesh>
      <mesh position={[0, 0.43, 0]} material={INK} scale={[1.2, 1.2, 1.2]}>
        <sphereGeometry args={[0.075, 16, 12]} />
      </mesh>
    </group>
  );
};

// barra entre dois pontos (para as pernas), com contorno
const Seg: React.FC<{ a: V3; b: V3; r: number; r2?: number; col: string }> = ({ a, b, r, r2, col }) => {
  const va = new THREE.Vector3(...a);
  const vb = new THREE.Vector3(...b);
  const mid = va.clone().add(vb).multiplyScalar(0.5);
  const len = va.distanceTo(vb);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.clone().sub(va).normalize());
  return (
    <group position={mid} quaternion={q}>
      <mesh material={toon(col)}>
        <cylinderGeometry args={[r, r2 ?? r * 0.8, len, 10]} />
      </mesh>
      <mesh material={INK} scale={[1.3, 1.02, 1.3]}>
        <cylinderGeometry args={[r, r2 ?? r * 0.8, len, 10]} />
      </mesh>
    </group>
  );
};

// HUNTER (das fotos de referência): cabeçorra em capuz azul-marinho inclinada para a frente; máscara clara com os DOIS
// olhos redondos empilhados (aro metálico, íris ciano acesa); garras claras embaixo da máscara; o lançador de
// flechetes saindo das costas; três pernas de caranguejo (duas na frente, uma atrás): coxa grossa que SOBE até o
// joelho, junta clara, canela longa que desce afinando, casco claro com duas garras pretas. +x = para onde olha.
const HB = "#34508e"; // azul do casco (o tom chapado escurece, por isso mais claro que a foto)
const HJ = "#b9bca8"; // juntas, máscara, garras (osso claro)
const HunterModel: React.FC<{ dead: number; step: number }> = ({ dead, step }) => {
  const legs: { hip: V3; knee: V3; ankle: V3; foot: V3 }[] = [
    { hip: [0.08, 1.0, 0.26], knee: [0.3, 1.18, 0.62], ankle: [0.46, 0.22, 0.78], foot: [0.5, 0, 0.8] },
    { hip: [0.08, 1.0, -0.26], knee: [0.3, 1.18, -0.62], ankle: [0.46, 0.22, -0.78], foot: [0.5, 0, -0.8] },
    { hip: [-0.24, 0.96, 0], knee: [-0.64, 1.14, 0], ankle: [-0.9, 0.22, 0], foot: [-0.94, 0, 0] },
  ];
  return (
    <group>
      {legs.map((l, k) => {
        const lift = Math.max(0, Math.sin((step + k / 3) * Math.PI * 2)) * 0.12;
        const ankle: V3 = [l.ankle[0], l.ankle[1] + lift, l.ankle[2]];
        const foot: V3 = [l.foot[0], l.foot[1] + lift, l.foot[2]];
        return (
          <group key={k}>
            <Seg a={l.hip} b={l.knee} r={0.09} r2={0.075} col={HB} />
            <Inked geo={<sphereGeometry args={[0.08, 14, 10]} />} mat={toon(HJ)} pos={l.knee} />
            <Seg a={l.knee} b={ankle} r={0.06} r2={0.034} col={HB} />
            <Inked geo={<sphereGeometry args={[0.05, 12, 8]} />} mat={toon(HJ)} pos={ankle} />
            <Seg a={ankle} b={foot} r={0.04} r2={0.03} col={HJ} />
            {[-0.035, 0.035].map((dz, j) => (
              <Inked key={j} geo={<coneGeometry args={[0.018, 0.12, 6]} />} mat={toon("#14161a")} pos={[foot[0] + 0.04, foot[1] + 0.03, foot[2] + dz]} rot={[0, 0, -2.0]} k={1.25} />
            ))}
          </group>
        );
      })}
      {/* cabeça-capuz e o "pescoço" que a liga às pernas */}
      <Inked geo={<sphereGeometry args={[1, 26, 18]} />} mat={toon(HB)} pos={[-0.02, 0.98, 0]} rot={[0, 0, -0.28]} scale={[0.32, 0.4, 0.38]} k={1.06} />
      <Inked geo={<sphereGeometry args={[1, 18, 12]} />} mat={toon(HB)} pos={[-0.12, 1.22, 0]} rot={[0, 0, -0.5]} scale={[0.2, 0.12, 0.24]} k={1.08} />
      {/* máscara clara */}
      <Inked geo={<sphereGeometry args={[1, 22, 16]} />} mat={toon(HJ)} pos={[0.24, 0.86, 0]} rot={[0, 0, -0.18]} scale={[0.1, 0.34, 0.24]} k={1.08} />
      {/* os dois olhos empilhados */}
      {[
        [0.33, 1.0, 0.1],
        [0.36, 0.74, 0.088],
      ].map(([x, y, r], k) => (
        <group key={k} position={[x, y, 0]}>
          <mesh material={toon("#7a8090")} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[r, r * 1.05, 0.06, 24]} />
          </mesh>
          <mesh material={INK} rotation={[0, 0, Math.PI / 2]} scale={[1.15, 1.2, 1.15]}>
            <cylinderGeometry args={[r, r * 1.05, 0.06, 24]} />
          </mesh>
          <mesh material={toon("#0e1218")} position={[0.032, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[r * 0.78, r * 0.78, 0.01, 24]} />
          </mesh>
          <mesh material={toon("#d8fbff", "#4fd8ff", 2.4 * (1 - dead))} position={[0.04, 0, 0]}>
            <sphereGeometry args={[r * 0.5, 16, 12]} />
          </mesh>
        </group>
      ))}
      {/* garras/presas claras debaixo da máscara */}
      {[-0.09, -0.045, 0, 0.045, 0.09].map((z, k) => (
        <Inked key={k} geo={<coneGeometry args={[0.02, 0.15 + (k % 2) * 0.05, 6]} />} mat={toon(HJ)} pos={[0.24, 0.5 - (k % 2) * 0.02, z]} rot={[0, 0, Math.PI + 0.25]} k={1.3} />
      ))}
      {/* lançador de flechetes nas costas */}
      <Seg a={[-0.16, 1.28, 0]} b={[-0.38, 1.62, 0]} r={0.035} r2={0.022} col="#1d2230" />
      <Inked geo={<sphereGeometry args={[0.035, 10, 8]} />} mat={toon("#8fe8ff", "#4fd8ff", 1.2)} pos={[-0.39, 1.64, 0]} />
    </group>
  );
};
// PEÇA DO HUNTER no tabuleiro: base de três pés, coluna escura e a cabeça alta com os DOIS olhos azuis empilhados
// (a marca do Hunter). Salta quando ataca (`lunge`) e tomba quando o Varga derruba (`dead`).
const HUNTER_PIECE = (() => {
  let g: THREE.LatheGeometry | null = null;
  return () => {
    if (g) return g;
    const pts = [
      [0, 0.1],
      [0.09, 0.1],
      [0.07, 0.16],
      [0.05, 0.36],
      [0.075, 0.42],
      [0.05, 0.46],
      [0, 0.46],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    g = new THREE.LatheGeometry(pts, 24);
    return g;
  };
})();
const Hunter: React.FC<{ pos: V3; heading: number; lunge: number; dead: number; o: number; step?: number }> = ({ pos, heading, lunge, dead, o }) => {
  if (o <= 0.01) return null;
  const bob = Math.sin(lunge * Math.PI) * 0.45;
  return (
    <group position={[pos[0], pos[1] + bob, pos[2]]} rotation={[0, -heading, dead * 1.45]} scale={[o * 1.05, o * 1.05, o * 1.05]}>
      {[0, 1, 2].map((k) => {
        const a = (k * Math.PI * 2) / 3 + 0.5;
        return <Seg key={k} a={[0, 0.14, 0]} b={[Math.cos(a) * 0.17, 0, Math.sin(a) * 0.17]} r={0.022} r2={0.016} col="#4a68a8" />;
      })}
      <mesh geometry={HUNTER_PIECE()} material={toon("#4a68a8")} />
      <mesh geometry={HUNTER_PIECE()} material={INK} scale={[1.16, 1.03, 1.16]} />
      {/* cabeça alta, inclinada para a frente, com a máscara clara */}
      <Inked geo={<sphereGeometry args={[1, 20, 14]} />} mat={toon("#4a68a8")} pos={[0.01, 0.58, 0]} rot={[0, 0, -0.2]} scale={[0.09, 0.15, 0.1]} k={1.12} />
      <Inked geo={<sphereGeometry args={[1, 18, 12]} />} mat={toon("#b9bca8")} pos={[0.065, 0.57, 0]} rot={[0, 0, -0.2]} scale={[0.04, 0.12, 0.075]} k={1.1} />
      {[0.62, 0.52].map((y, k) => (
        <mesh key={k} position={[0.1, y, 0]} material={toon("#d8fbff", "#4fd8ff", 2.4 * (1 - dead))}>
          <sphereGeometry args={[0.036, 14, 10]} />
        </mesh>
      ))}
      <Seg a={[-0.05, 0.68, 0]} b={[-0.12, 0.8, 0]} r={0.012} r2={0.008} col="#1d2230" />
    </group>
  );
};

// bancada de teste do Hunter (fundo neutro, girando devagar)
const HunterBench: React.FC<{ f: number }> = ({ f }) => {
  const { camera, scene } = useThree();
  scene.background = new THREE.Color("#8a96a8");
  camera.position.set(2.6, 1.5, 1.4);
  camera.lookAt(0, 0.7, 0);
  return (
    <>
      <hemisphereLight args={["#dfe8ff", "#30343c", 1.1]} />
      <directionalLight position={[3, 5, 2]} intensity={1.3} />
      <group rotation={[0, f / 60, 0]}>
        <HunterModel dead={0} step={f / 40} />
      </group>
    </>
  );
};
export const HLHunterLab: React.FC<{ life: number }> = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Canvas3D f={f} lite={false} fov={34} pos={[2.6, 1.5, 1.4]} near={0.05} far={50}>
        <HunterBench f={f} />
      </Canvas3D>
    </AbsoluteFill>
  );
};

// SOLDADOS COMBINE em miniatura: o MESMO soldado do feed Combine (capacete, máscara com os olhos acesos, fuzil), em
// tom chapado + contorno, marchando sobre a mesa (as pernas andam conforme a peça avança). Montados uma vez.
const SOLDIER_SCALE = 0.36;
type Man = { holder: THREE.Group; step: (phase: number, ph: number) => void };
const SQUADS = new Map<boolean, { root: THREE.Group; men: Man[] }>();
const buildSquad = () => {
  const root = new THREE.Group();
  const men: Man[] = Array.from({ length: 10 }).map(() => {
    const s = makeSoldier();
    toonify(s.g, 1.1, 0.55);
    const holder = new THREE.Group();
    holder.add(s.g);
    root.add(holder);
    // o update do feed põe o soldado no chão do feed: mede essa altura uma vez e desconta (fica no 0 da peça)
    s.update(0, 0, 0, Math.PI / 2, 0);
    const base = s.g.position.y;
    return {
      holder,
      step: (phase: number, ph: number) => {
        s.update(0, 0, phase, ph, 0);
        s.g.position.y -= base;
      },
    };
  });
  return { root, men };
};

// HUNTER: peça recortada no contorno REAL do Hunter (quadro do Ep2), pintada em tons chapados com contorno preto
// (public/hl3silh/hunter_peca.png), de pé numa base preta, sempre de frente para a câmera. Os dois olhos brilham.
let HUNTER_TEX: Promise<THREE.Texture> | null = null;
const loadHunterTex = () => {
  if (!HUNTER_TEX)
    HUNTER_TEX = new Promise((ok, bad) =>
      new THREE.TextureLoader().load(
        staticFile("hl3silh/hunter_peca.png"),
        (t) => {
          t.colorSpace = THREE.SRGBColorSpace;
          t.anisotropy = 4;
          ok(t);
        },
        undefined,
        bad,
      ),
    );
  return HUNTER_TEX;
};
const HSTAND_H = 1.0;
const HSTAND_W = (HSTAND_H * 480) / 512;
const HunterStandee: React.FC<{ pos: V3; lunge: number; dead: number; o: number; f: number }> = ({ pos, lunge, dead, o, f }) => {
  const { camera, gl, scene } = useThree();
  const [tex, setTex] = useState<THREE.Texture | null>(null);
  const [h] = useState(() => delayRender("peça do Hunter"));
  useEffect(() => {
    loadHunterTex()
      .then(setTex)
      .catch(() => continueRender(h));
  }, [h]);
  useEffect(() => {
    if (!tex) return;
    gl.render(scene, camera);
    continueRender(h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tex]);
  const mat = useMemo(() => (tex ? new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.4, side: THREE.DoubleSide, color: new THREE.Color("#f2f5fa") }) : null), [tex]);
  if (!mat || o <= 0.01) return null;
  const bob = Math.sin(lunge * Math.PI) * 0.4;
  const face = Math.atan2(camera.position.x - pos[0], camera.position.z - pos[2]);
  // inclina o cartão para a câmera (que olha de cima): sem isso ele fica de perfil e some
  const tilt = -Math.atan2(camera.position.y - pos[1], Math.hypot(camera.position.x - pos[0], camera.position.z - pos[2])) * 0.75;
  const glow = (0.75 + 0.25 * Math.sin(f / 3)) * (1 - dead);
  return (
    <group position={[pos[0], pos[1] + bob, pos[2]]} rotation={[0, face, 0]} scale={[o, o, o]}>
      <mesh position={[0, 0.015, 0]} material={toon("#15181d")}>
        <cylinderGeometry args={[0.17, 0.19, 0.03, 28]} />
      </mesh>
      <group rotation={[tilt, 0, dead * 1.35]}>
        <mesh position={[0, 0.03 + HSTAND_H / 2, 0]} material={mat}>
          <planeGeometry args={[HSTAND_W, HSTAND_H]} />
        </mesh>
        {[0.646, 0.502].map((v, k) => (
          <sprite key={k} position={[(228 / 480 - 0.5) * HSTAND_W, 0.03 + v * HSTAND_H, 0.01]} scale={[0.09, 0.09, 1]}>
            <spriteMaterial color="#7fe8ff" transparent opacity={0.55 * glow} depthWrite={false} blending={THREE.AdditiveBlending} />
          </sprite>
        ))}
      </group>
    </group>
  );
};

// O STRIDER do feed Combine (o mesmo modelo), em miniatura sobre a maquete: anda do norte para o acampamento e TOMBA
const SCALE_ST = 0.3;
type WStrider = { outer: THREE.Group; pivot: THREE.Group; inner: THREE.Group; update: (f: number) => void; opts: { speed: number; fire: boolean; fall: number }; zb: (f: number) => number; toWorld: (x: number, z: number) => [number, number] };
const WSTR = new Map<boolean, WStrider>();
const buildStrider = (lite: boolean): WStrider => {
  const [x0, z0] = STRIDER0;
  const dx = STRIDER1[0] - x0;
  const dz = STRIDER1[1] - z0;
  const th = Math.atan2(-dx, -dz);
  const s = SCALE_ST;
  const toWorld = (x: number, z: number): [number, number] => [x0 + (x * Math.cos(th) + z * Math.sin(th)) * s, z0 + (-x * Math.sin(th) + z * Math.cos(th)) * s];
  const baseY = H(x0, z0);
  const groundL = (x: number, z: number) => {
    const [wx, wz] = toWorld(x, z);
    return (H(wx, wz) - baseY) / s;
  };
  // o mesmo objeto de opções fica com o makeStrider: mudar `opts.speed`/`opts.fire` depois vale para o passo e os tiros
  // `fall` (0→1): o corpo DESABA entre as pernas — os pés ficam plantados, os joelhos dobram e abrem, o casco desce
  // até quase o chão (nada de tombar a peça inteira: as pernas atravessavam a mesa)
  const opts: { speed: number; fire: boolean; fall: number; body: (f: number) => THREE.Vector3; ground: (x: number, z: number) => number } = { speed: 0.05, fire: false, fall: 0, body: () => new THREE.Vector3(), ground: groundL };
  const zb = (f: number) => -f * opts.speed;
  opts.body = (f) => new THREE.Vector3(0, groundL(0, zb(f)) + 10 - 8.6 * opts.fall, zb(f));
  const st = makeStrider(0, lite, opts);
  toonify(st.g, 1.12, 0.45);
  const inner = new THREE.Group();
  inner.add(st.g);
  const pivot = new THREE.Group();
  pivot.add(inner);
  const outer = new THREE.Group();
  outer.position.set(x0, baseY, z0);
  outer.rotation.y = th;
  outer.scale.setScalar(s);
  outer.add(pivot);
  return { outer, pivot, inner, update: st.update, opts, zb, toWorld };
};

// traçante entre dois pontos (pisca)
const Tracer: React.FC<{ a: V3; b: V3; col: string; o: number }> = ({ a, b, col, o }) => {
  if (o <= 0.01) return null;
  const va = new THREE.Vector3(...a);
  const vb = new THREE.Vector3(...b);
  const mid = va.clone().add(vb).multiplyScalar(0.5);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.clone().sub(va).normalize());
  return (
    <mesh position={mid} quaternion={q} renderOrder={5}>
      <cylinderGeometry args={[0.014, 0.014, va.distanceTo(vb), 6]} />
      <meshBasicMaterial color={col} transparent opacity={o} depthWrite={false} blending={THREE.AdditiveBlending} />
    </mesh>
  );
};

// caminho desenhado no relevo (seta de avanço / arco de defesa): `k` 0→1 quanto já foi traçado
const PathLine: React.FC<{ pts: [number, number][]; k: number; col: string; o?: number; w?: number }> = ({ pts, k, col, o = 1, w = 0.035 }) => {
  const geo = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(pts.map(([x, z]) => new THREE.Vector3(x, H(x, z) + 0.05, z)));
    return new THREE.TubeGeometry(curve, 120, w, 6, false);
  }, [pts, w]);
  if (k <= 0.001 || o <= 0.01) return null;
  geo.setDrawRange(0, Math.floor(geo.index!.count * Math.min(1, k) / 6) * 6);
  return (
    <mesh geometry={geo} renderOrder={4}>
      <meshBasicMaterial color={col} transparent opacity={0.9 * o} depthWrite={false} />
    </mesh>
  );
};

// ---------------------------------------------------------------- o mundo fixo (relevo, mata, barracas, fogueira)
type World = { root: THREE.Group; terrain: THREE.ShaderMaterial; fireLight: THREE.PointLight; flame: THREE.Group; snow: THREE.Points };
const WORLDS = new Map<boolean, World>();
const buildWorld = (lite: boolean): World => {
  const root = new THREE.Group();
  const seg = lite ? 140 : 260;
  const g = new THREE.PlaneGeometry(26, 18, seg, Math.round(seg * 0.7));
  g.rotateX(-Math.PI / 2);
  const p = g.getAttribute("position") as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) p.setY(i, H(p.getX(i), p.getZ(i)));
  g.computeVertexNormals();
  const terrain = new THREE.ShaderMaterial({ vertexShader: TERRAIN_VS, fragmentShader: TERRAIN_FS, uniforms: { uFire: { value: new THREE.Vector3(0, 0, 0) }, uFlick: { value: 1 }, uAlarm: { value: 0 }, uCam: { value: new THREE.Vector3() } } });
  const tm = new THREE.Mesh(g, terrain);
  tm.receiveShadow = true;
  root.add(tm);
  // borda da maquete (corte do relevo)
  const edgeM = new THREE.MeshBasicMaterial({ color: "#0b1016" });
  const base = new THREE.Mesh(new THREE.BoxGeometry(26.2, 0.6, 18.2), edgeM);
  base.position.y = -0.32;
  root.add(base);
  // pinheirinhos (instâncias): três cones + ponta de neve
  const pines: [number, number, number][] = [];
  for (let i = 0; pines.length < (lite ? 160 : 320) && i < 4000; i++) {
    const x = (rnd(i * 3) - 0.5) * 24;
    const z = (rnd(i * 7) - 0.5) * 16;
    const r = Math.hypot(x, z * 1.2);
    if (r < 2.6) continue; // a clareira
    if (Math.abs(x + 0.6 * Math.sin(z * 0.3)) < 0.9 && z > 2) continue; // a trilha do vale
    if (rnd(i * 11) > 0.35 + THREE.MathUtils.smoothstep(r, 2.6, 7) * 0.6) continue;
    pines.push([x, z, 0.55 + rnd(i * 13) * 0.55]);
  }
  const tiers = [
    [0.26, 0.42, 0.28],
    [0.2, 0.36, 0.5],
    [0.13, 0.3, 0.7],
  ];
  const greenM = toon("#2a5040");
  const snowM = toon("#d8e4f0");
  tiers.forEach(([r, h, y], ti) => {
    const im = new THREE.InstancedMesh(new THREE.ConeGeometry(r, h, 7), greenM, pines.length);
    const sm = new THREE.InstancedMesh(new THREE.ConeGeometry(r * 0.55, h * 0.35, 7), snowM, pines.length);
    const ink = new THREE.InstancedMesh(new THREE.ConeGeometry(r * 1.12, h * 1.1, 7), INK, pines.length);
    const m = new THREE.Matrix4();
    pines.forEach(([x, z, s], i) => {
      const gy = H(x, z);
      m.compose(new THREE.Vector3(x, gy + y * s, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rnd(i + ti)), new THREE.Vector3(s, s, s));
      im.setMatrixAt(i, m);
      ink.setMatrixAt(i, m);
      m.compose(new THREE.Vector3(x, gy + (y + h * 0.36) * s, z), new THREE.Quaternion(), new THREE.Vector3(s, s, s));
      sm.setMatrixAt(i, m);
    });
    root.add(ink, im, sm);
  });
  // barracas em volta da clareira
  const tentM = toon("#8a8f5a");
  for (const [x, z, a] of [
    [-1.6, -1.2, 0.4],
    [1.5, -1.5, -0.5],
    [-1.9, 1.0, 1.2],
    [1.7, 1.2, -1.0],
    [0.1, -2.1, 0],
  ]) {
    const t = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.3, 4, 1), tentM);
    t.position.set(x, H(x, z) + 0.15, z);
    t.rotation.y = a + Math.PI / 4;
    t.scale.set(1, 1, 1.6);
    root.add(t);
    const ti = new THREE.Mesh(t.geometry, INK);
    ti.scale.setScalar(1.12);
    t.add(ti);
    const sn = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.1, 4, 1), snowM);
    sn.position.set(x, H(x, z) + 0.27, z);
    sn.rotation.y = a + Math.PI / 4;
    sn.scale.set(1, 1, 3.4);
    root.add(sn);
  }
  // fogueira
  // fogueira: lenha em X, três línguas de fogo (laranja → amarelo) e um brilho
  const flame = new THREE.Group();
  flame.position.set(0, H(0, 0), 0);
  const logM = new THREE.MeshStandardMaterial({ color: "#3a2414", roughness: 0.9, emissive: "#ff5a10", emissiveIntensity: 0.25 });
  for (const a of [0.4, -0.5, 1.6]) {
    const lg = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.022, 0.26, 6), logM);
    lg.rotation.set(Math.PI / 2 - 0.25, a, 0);
    lg.position.y = 0.04;
    flame.add(lg);
  }
  [
    ["#ff6a1a", 0.075, 0.2, 0, 0],
    ["#ff9a2a", 0.055, 0.17, 0.03, 0.02],
    ["#ffd45a", 0.035, 0.12, -0.02, -0.01],
  ].forEach(([c, r, h, x, z]) => {
    const fl = new THREE.Mesh(new THREE.ConeGeometry(r as number, h as number, 10), new THREE.MeshBasicMaterial({ color: c as string, transparent: true, opacity: 0.92 }));
    fl.position.set(x as number, (h as number) / 2 + 0.03, z as number);
    flame.add(fl);
  });
  const gc = document.createElement("canvas");
  gc.width = gc.height = 64;
  const gx = gc.getContext("2d")!;
  const gr = gx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, "rgba(255,255,255,1)");
  gr.addColorStop(1, "rgba(255,255,255,0)");
  gx.fillStyle = gr;
  gx.fillRect(0, 0, 64, 64);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(gc), color: "#ff8a2a", transparent: true, opacity: 0.45, depthWrite: false, blending: THREE.AdditiveBlending }));
  glow.scale.set(0.9, 0.9, 1);
  glow.position.y = 0.15;
  flame.add(glow);
  root.add(flame);
  const fireLight = new THREE.PointLight("#ff9a4a", 3, 5, 1.6);
  fireLight.position.set(0, H(0, 0) + 0.5, 0);
  root.add(fireLight);
  root.add(new THREE.HemisphereLight("#7fa6d6", "#06080c", 0.9));
  const dl = new THREE.DirectionalLight("#cfe2ff", 1.1);
  dl.position.set(-6, 10, 4);
  root.add(dl);
  // neve fininha caindo sobre a maquete
  const N = lite ? 500 : 1800;
  const sg = new THREE.BufferGeometry();
  sg.setAttribute("position", new THREE.BufferAttribute(new Float32Array(N * 3), 3));
  const snow = new THREE.Points(sg, new THREE.PointsMaterial({ color: "#e8f0fa", size: 0.045, transparent: true, opacity: 0.85, depthWrite: false }));
  snow.frustumCulled = false;
  root.add(snow);
  return { root, terrain, fireLight, flame, snow };
};

// ---------------------------------------------------------------- roteiro (posições no relevo)
const at = (x: number, z: number, lift = 0): V3 => [x, H(x, z) + lift, z];
const lerp = (a: [number, number], b: [number, number], k: number): [number, number] => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
const CRATE: [number, number] = [-0.9, 0.6];
// rebeldes em volta do fogo (fichas λ): Varga, Gordon e o grupo
const REB: { id: string; p: [number, number]; def: [number, number]; big?: boolean }[] = [
  { id: "varga", p: [-0.75, -0.45], def: [-1.4, -2.4] },
  { id: "gordon", p: [0.8, 0.35], def: [2.1, -2.6], big: true },
  { id: "eli", p: [0.55, -0.7], def: [0.9, -1.0] },
  { id: "r1", p: [-0.2, 0.85], def: [-2.6, -1.6] },
  { id: "r2", p: [1.3, -0.3], def: [3.0, -1.4] },
  { id: "r3", p: [-1.4, 0.2], def: [-3.2, -0.6] },
  // (03/10: "tem só três rebeldes" → o acampamento inteiro: mais fichas em volta das barracas, que vão para o arco)
  { id: "r4", p: [-1.9, 1.3], def: [-2.9, -1.4] },
  { id: "r5", p: [1.9, 1.5], def: [3.2, -0.8] },
  { id: "r6", p: [-2.1, -1.6], def: [-2.0, -2.3] },
  { id: "r7", p: [2.1, -1.0], def: [2.3, -2.5] },
  { id: "r8", p: [0.4, -2.3], def: [-0.4, -2.85] },
  { id: "r9", p: [-0.8, 1.6], def: [0.4, -2.95] },
  { id: "r10", p: [1.0, 1.4], def: [1.5, -2.85] },
  { id: "r11", p: [-2.6, 0.4], def: [-3.4, 0.2] },
];
// peões Combine: saem da mata ao norte e a nordeste e descem até os DADOS
const PAWNS: { from: [number, number]; mid: [number, number]; d: number }[] = Array.from({ length: 10 }).map((_, i) => {
  const a = -Math.PI / 2 + (i - 4.5) * 0.16;
  const r = 7.2 + rnd(i * 5) * 1.2;
  return { from: [Math.cos(a) * r, Math.sin(a) * r * 0.9], mid: [Math.cos(a) * 3.4 + (rnd(i) - 0.5) * 0.6, Math.sin(a) * 3.0], d: rnd(i * 9) * 0.25 };
});
const STRIDER0: [number, number] = [6.6, -7.0];
const STRIDER1: [number, number] = [4.4, -5.4];
const HUNT0: [number, number] = [4.6, -3.4];

type Beats = { contactAt: number; goAt: number; skipAt: number; lockAt: number; radioAt: number; vargaAt: number; gordonAt: number; criticalAt: number; hunterAt: number; repelAt: number; loseAt: number };

const Scene: React.FC<{ f: number; life: number; lite: boolean; b: Beats }> = ({ f, life, lite, b }) => {
  const { camera, scene, gl } = useThree();
  void gl;
  const W = useMemo(() => {
    let w = WORLDS.get(lite);
    if (!w) WORLDS.set(lite, (w = buildWorld(lite)));
    return w;
  }, [lite]);
  scene.background = new THREE.Color("#03060a");
  const t = f / 30;
  // ---------- câmera (uma só, contínua, presa às batidas)
  type Key = { at: number; pos: V3; look: V3; fov: number };
  // sempre do alto, como quem olha a mesa (nada de câmera rasteira: aí vira bagunça 3D)
  // (03/10: "o mapa ficou muito 3Dzão" → câmera sempre alta e mais fechada, lente longa: lê como MAPA)
  const rawKeys: Key[] = [
    { at: 0, pos: [0.1, 30, 1.6], look: [0, 0, -0.2], fov: 30 }, // chega de cima (vindo do drone): o mapa inteiro
    { at: 2, pos: [1.0, 8.6, 5.6], look: [0, 0, -0.3], fov: 24 }, // desce até o acampamento quieto
    { at: b.contactAt, pos: [1.6, 15.5, 9.0], look: [0.3, 0, -2.6], fov: 28 }, // abre: a mata, os soldados chegando
    { at: b.goAt, pos: [2.6, 11.5, 2.6], look: [4.4, 0.6, -5.4], fov: 27 }, // o Strider sai da mata (o ataque)
    { at: b.skipAt, pos: [0.2, 16, 5.0], look: [0, 0, -1.4], fov: 28 }, // tático, de cima: ignoram os rebeldes
    { at: b.vargaAt, pos: [-1.6, 10.5, 5.0], look: [-0.7, 0, -1.6], fov: 25 }, // pelo lado do Varga
    { at: b.criticalAt, pos: [3.4, 9.6, 2.4], look: [2.6, 0.1, -2.8], fov: 24 }, // o Hunter e o Gordon
    { at: b.repelAt, pos: [2.6, 11.0, 1.6], look: [4.4, 0.4, -5.6], fov: 26 }, // o Strider desaba
    { at: b.loseAt, pos: [-0.8, 8.6, 3.6], look: [CRATE[0] + 0.3, 0.1, CRATE[1] - 0.5], fov: 22 }, // a maleta dos dados
  ];
  const keys = rawKeys.filter((k) => k.at < 1e8);
  let ki = 0;
  for (let k = 0; k < keys.length; k++) if (f >= keys[k].at) ki = k;
  const K0 = keys[ki];
  // a última chave não tem próxima: mede pelo fim da cena (senão vira um pulo de 1 quadro)
  const nextAt = ki + 1 < keys.length ? keys[ki + 1].at : life;
  const span = Math.max(12, Math.min(50, (nextAt - K0.at) * 0.55));
  const prev = keys[Math.max(0, ki - 1)];
  const kk = ki === 0 ? 1 : IO(f, K0.at, K0.at + span);
  const cp = prev.pos.map((v, i) => v + (K0.pos[i] - v) * kk) as V3;
  const cl = prev.look.map((v, i) => v + (K0.look[i] - v) * kk) as V3;
  const fov = prev.fov + (K0.fov - prev.fov) * kk;
  // deriva lenta depois que chegou
  const drift = (f - K0.at) / 30;
  camera.position.set(cp[0] + Math.sin(drift * 0.3) * 0.25, cp[1] + Math.sin(drift * 0.2) * 0.06, cp[2] + Math.cos(drift * 0.25) * 0.2);
  camera.lookAt(cl[0], cl[1], cl[2]);
  const pc = camera as THREE.PerspectiveCamera;
  if (Math.abs(pc.fov - fov) > 0.01) {
    pc.fov = fov;
    pc.updateProjectionMatrix();
  }
  // ---------- mundo animado
  const flick = 0.85 + 0.1 * Math.sin(t * 13) + 0.05 * Math.sin(t * 31);
  const alarm = f >= b.goAt ? (0.5 + 0.5 * Math.sin((f - b.goAt) / 4)) * (1 - P(f, b.repelAt, 40)) : 0;
  W.terrain.uniforms.uFlick.value = flick;
  W.terrain.uniforms.uAlarm.value = alarm;
  W.terrain.uniforms.uCam.value.copy(camera.position);
  W.fireLight.intensity = 3 * flick;
  W.flame.children.forEach((c, i) => {
    if ((c as THREE.Mesh).geometry?.type === "ConeGeometry") c.scale.set(1, 0.8 + 0.3 * Math.abs(Math.sin(t * (11 + i * 4) + i)), 1);
  });
  const sp = (W.snow.geometry.getAttribute("position") as THREE.BufferAttribute).array as Float32Array;
  for (let i = 0; i < sp.length / 3; i++) {
    sp[i * 3] = (rnd(i * 3) - 0.5) * 22 + Math.sin(t * 0.6 + i) * 0.25 + ((t * 0.35) % 22);
    sp[i * 3 + 1] = ((rnd(i * 5) * 9 - t * (0.35 + rnd(i) * 0.25)) % 9 + 9) % 9;
    sp[i * 3 + 2] = (rnd(i * 7) - 0.5) * 16;
  }
  W.snow.geometry.getAttribute("position").needsUpdate = true;

  // rebeldes: em volta do fogo → vão para a defesa (Varga primeiro, o Gordon depois)
  const defK = (id: string) => (id === "gordon" ? IO(f, b.gordonAt, b.gordonAt + 40) : IO(f, b.vargaAt + (id === "varga" ? 0 : 8), b.vargaAt + 50));
  const rebPos = (r: (typeof REB)[number]) => {
    const k = defK(r.id);
    const [x, z] = lerp(r.p, r.def, k);
    return at(x, z);
  };
  // peões: aparecem na mata, descem, e cercam a caixa; recuam quando a resistência repele
  const pawnPos = (i: number, ff = f): { pos: V3; o: number; dead: number; walk: number } => {
    const pw = PAWNS[i];
    const o = P(ff, b.contactAt + i * 4, 10);
    const adv = IO(ff, b.goAt + pw.d * 60, b.lockAt + 30);
    const toData = IO(ff, b.lockAt + i * 3, b.vargaAt + 30);
    const back = IO(ff, b.repelAt + i * 3, b.repelAt + 70);
    let [x, z] = lerp(pw.from, pw.mid, adv);
    [x, z] = lerp([x, z], [CRATE[0] + Math.cos(i) * 1.4, CRATE[1] - 1.2 + Math.sin(i) * 0.6], toData * 0.7);
    [x, z] = lerp([x, z], pw.from, back);
    const dead = i % 3 === 1 ? IO(ff, b.vargaAt + 30 + i * 6, b.vargaAt + 44 + i * 6) : 0;
    // fase do passo = caminho andado (as pernas só andam quando a peça anda)
    const walk = (adv * 4.5 + toData * 2.2 + back * 4.5) * 18;
    return { pos: at(x, z), o: o * (1 - back * 0.6), dead, walk };
  };
  const sFall = IO(f, b.repelAt + 10, b.repelAt + 55);
  const SQ = useMemo(() => {
    let q = SQUADS.get(lite);
    if (!q) SQUADS.set(lite, (q = buildSquad()));
    return q;
  }, [lite]);
  SQ.men.forEach((m, i) => {
    const pp = pawnPos(i);
    const p2 = pawnPos(i, f + 4);
    const dx = p2.pos[0] - pp.pos[0];
    const dz = p2.pos[2] - pp.pos[2];
    const ang = Math.hypot(dx, dz) > 0.003 ? Math.atan2(dx, dz) : Math.atan2(CRATE[0] - pp.pos[0], CRATE[1] - pp.pos[2]);
    m.step(pp.walk, i * 0.9);
    m.holder.visible = pp.o > 0.01;
    m.holder.position.set(pp.pos[0], pp.pos[1], pp.pos[2]);
    m.holder.rotation.set(-pp.dead * 1.45, ang, 0);
    m.holder.scale.setScalar(SOLDIER_SCALE * Math.max(0.001, pp.o));
  });
  const WS = useMemo(() => {
    let w = WSTR.get(lite);
    if (!w) WSTR.set(lite, (w = buildStrider(lite)));
    return w;
  }, [lite]);
  const walkFrames = Math.max(30, b.repelAt + 10 - b.goAt);
  const walkF = Math.max(0, Math.min(f - b.goAt, walkFrames));
  {
    const distL = Math.hypot(STRIDER1[0] - STRIDER0[0], STRIDER1[1] - STRIDER0[1]) / SCALE_ST;
    WS.opts.speed = b.goAt < 1e8 ? distL / walkFrames : 0.05;
    WS.opts.fire = f >= b.goAt + 20 && f < b.repelAt;
    WS.update(walkF);
    const zNow = WS.zb(walkF);
    WS.pivot.position.set(0, 0, zNow);
    WS.inner.position.set(0, 0, -zNow);
    // desaba: o corpo desce entre as pernas (joelhos dobram), e só no fim a carcaça adorna um pouco e assenta
    WS.opts.fall = Easing.in(Easing.quad)(Math.min(1, sFall / 0.75));
    WS.update(walkF);
    const settle = Easing.inOut(Easing.sin)(Math.max(0, (sFall - 0.6) / 0.4));
    WS.pivot.rotation.x = settle * 0.1;
    WS.pivot.rotation.z = settle * 0.08;
    WS.outer.visible = f >= b.contactAt;
  }
  const [sx, sz] = WS.toWorld(0, WS.zb(walkF));
  const [ix, iz] = WS.toWorld(0, WS.zb(walkFrames)); // a poeira sobe onde o casco bate (ele desaba no lugar)
  const hunterO = P(f, b.gordonAt - 10, 12);
  const lunge = IO(f, b.criticalAt, b.criticalAt + 18);
  const hDead = IO(f, b.hunterAt, b.hunterAt + 14);
  const gordon = rebPos(REB[1]);
  const varga = rebPos(REB[0]);
  const [hx, hz] = lerp(HUNT0, [gordon[0] + 0.5, gordon[2] - 0.4], lunge * 0.85);
  // traçantes da troca de tiros (de cada ficha para um peão, piscando)
  const firing = f >= b.vargaAt && f < b.repelAt + 60;
  const tracers: React.ReactNode[] = [];
  if (firing)
    REB.forEach((r, i) => {
      if (defK(r.id) < 0.5) return;
      const pk = (i * 3 + Math.floor(f / 6)) % PAWNS.length;
      const pp = pawnPos(pk);
      if (pp.o < 0.3) return;
      const on = (f + i * 5) % 14 < 3;
      const a = rebPos(r);
      tracers.push(<Tracer key={`r${i}`} a={[a[0], a[1] + 0.12, a[2]]} b={[pp.pos[0], pp.pos[1] + 0.3, pp.pos[2]]} col="#ffb35a" o={on ? 0.95 : 0} />);
      const back = (f + i * 7) % 18 < 2;
      tracers.push(<Tracer key={`c${i}`} a={[pp.pos[0], pp.pos[1] + 0.3, pp.pos[2]]} b={[a[0], a[1] + 0.12, a[2]]} col="#8fe0ff" o={back ? 0.9 : 0} />);
    });
  // o tiro do Varga no Hunter
  const vShot = f >= b.hunterAt - 4 && f < b.hunterAt + 4;
  // flechas de avanço (vermelho) e o arco da defesa (âmbar)
  const advK = IO(f, b.goAt, b.goAt + 50);
  const arcK = IO(f, b.vargaAt, b.vargaAt + 30);
  return (
    <>
      <primitive object={W.root} dispose={null} />
      {/* MALETA DE DADOS: estojo escuro com borda laranja e três discos acesos; na perda um disco salta e apaga */}
      <group position={at(CRATE[0], CRATE[1])} rotation={[0, 0.5, 0]}>
        <Inked geo={<boxGeometry args={[0.46, 0.16, 0.32]} />} mat={toon("#2c3036")} pos={[0, 0.08, 0]} k={1.08} />
        <Inked geo={<boxGeometry args={[0.47, 0.03, 0.33]} />} mat={toon("#d06a20")} pos={[0, 0.165, 0]} k={1.04} />
        {[-0.13, 0, 0.13].map((x, i) => {
          const gone = i === 2 ? IO(f, b.loseAt, b.loseAt + 12) : 0;
          const glow = (0.6 + 0.4 * Math.sin(f / 4 + i)) * (1 - gone);
          return (
            <mesh key={i} position={[x, 0.185, 0]} material={toon(gone > 0.5 ? "#1a1c20" : "#ffcf7a", "#ffaa33", Math.round((1.6 * glow + P(f, b.lockAt, 10) * 0.6 * glow) * 10) / 10)}>
              <boxGeometry args={[0.09, 0.02, 0.2]} />
            </mesh>
          );
        })}
        {f >= b.loseAt ? (
          <group position={[0.13 + IO(f, b.loseAt, b.loseAt + 26) * 0.7, 0.2 + Math.sin(IO(f, b.loseAt, b.loseAt + 26) * Math.PI) * 0.45, 0]} rotation={[0, 0, IO(f, b.loseAt, b.loseAt + 26) * 4]} scale={1 - IO(f, b.loseAt + 18, b.loseAt + 34) * 0.99}>
            <Inked geo={<boxGeometry args={[0.09, 0.03, 0.2]} />} mat={toon("#ffcf7a", "#ffaa33", 1.4)} k={1.2} />
          </group>
        ) : null}
        {f >= b.lockAt ? (
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
            <ringGeometry args={[0.38 + 0.06 * Math.sin(f / 4), 0.44 + 0.06 * Math.sin(f / 4), 40]} />
            <meshBasicMaterial color={RED} transparent opacity={0.85 * Math.max(1 - P(f, b.repelAt + 40, 20), P(f, b.loseAt, 10))} />
          </mesh>
        ) : null}
      </group>
      {REB.map((r, i) => (
        <Token key={r.id} pos={rebPos(r)} o={i < 3 ? 1 : P(f, b.vargaAt + 6 + i * 5, 10) * 0.999 + (f < b.goAt ? 1 : 0) * (1 - P(f, b.goAt, 6))} big={r.big} hot={r.id === "varga" ? P(f, b.vargaAt, 10) : r.id === "gordon" ? P(f, b.gordonAt, 10) : 0} />
      ))}
      <primitive object={SQ.root} dispose={null} />
      <primitive object={WS.outer} dispose={null} />
      {/* poeira de neve quando o Strider bate no chão */}
      {sFall > 0.85
        ? Array.from({ length: 14 }).map((_, i) => {
            const k = IO(f, b.repelAt + 50, b.repelAt + 90);
            const a = (i / 14) * Math.PI * 2;
            const [px, pz] = [ix + Math.cos(a) * (0.3 + k * 1.4), iz + Math.sin(a) * (0.3 + k * 1.4)];
            return (
              <mesh key={i} position={[px, H(px, pz) + 0.1 + k * 0.4, pz]}>
                <sphereGeometry args={[0.12 + k * 0.25, 8, 6]} />
                <meshBasicMaterial color="#dfe8f2" transparent opacity={0.5 * (1 - k)} depthWrite={false} />
              </mesh>
            );
          })
        : null}
      <HunterStandee pos={at(hx, hz)} lunge={lunge} dead={hDead} o={hunterO} f={f} />
      {tracers}
      {vShot ? <Tracer a={[varga[0], varga[1] + 0.12, varga[2]]} b={[hx, H(hx, hz) + 0.5, hz]} col="#ffd27a" o={1} /> : null}
      <PathLine pts={[[0, -7.5], [0.4, -5.5], [-0.3, -3.6], [-0.8, -1.6]]} k={advK} col={RED} o={1 - P(f, b.repelAt, 30)} />
      <PathLine pts={[[5.8, -6.5], [4.2, -4.6], [2.4, -3.0], [0.2, -1.0]]} k={advK} col={RED} o={1 - P(f, b.repelAt, 30)} />
      <PathLine pts={[[-6.4, -5.8], [-4.6, -4.2], [-2.6, -2.4], [-1.2, -0.6]]} k={advK} col={RED} o={1 - P(f, b.repelAt, 30)} />
      <PathLine pts={[[-3.4, -0.4], [-2.6, -2.0], [-1.0, -2.8], [1.0, -2.9], [2.8, -2.4], [3.4, -1.2]]} k={arcK} col={AMB} w={0.05} />
      {/* rótulos */}
      <Label pos={[varga[0], varga[1] + 0.75, varga[2]]} text="VARGA · DEFESA" o={P(f, b.vargaAt, 10) * (1 - P(f, b.loseAt, 10))} s={0.8} />
      <Label pos={[gordon[0], gordon[1] + 0.75, gordon[2]]} text="FREEMAN" o={P(f, b.gordonAt, 10) * (1 - P(f, b.repelAt + 30, 10))} s={0.8} />
      <Label pos={[CRATE[0], H(CRATE[0], CRATE[1]) + 0.75, CRATE[1]]} text="ALVO · DADOS" col={RED} o={P(f, b.lockAt, 10) * (1 - P(f, b.repelAt + 30, 10))} s={0.85} />
      <Label pos={[CRATE[0], H(CRATE[0], CRATE[1]) + 0.7, CRATE[1]]} text="PERDA · PARTE DOS DADOS" col={RED} o={P(f, b.loseAt + 12, 10)} s={1.05} />
      <Label pos={[sx, H(sx, sz) + 3.1, sz]} text="STRIDER" col={ICE} o={P(f, b.goAt + 10, 10) * (1 - P(f, b.repelAt, 10))} s={0.9} />
      <Label pos={[hx, H(hx, hz) + 1.55, hz]} text="HUNTER" col={ICE} o={P(f, b.criticalAt - 10, 8) * (1 - P(f, b.hunterAt + 10, 10))} s={0.7} />
      {f >= b.skipAt && f < b.vargaAt ? (
        <Label pos={[0.6, H(0.6, 0.2) + 1.0, 0.2]} text="REBELDES · IGNORAR" col={ICE} o={P(f, b.skipAt, 10)} s={0.9} />
      ) : null}
    </>
  );
};

// log de eventos à direita (cada linha entra digitada)
const LOG = (b: Beats) =>
  [
    { at: 0, t: "23:46", s: "ACAMPAMENTO · NOITE 1 · CALMO" },
    { at: b.contactAt, t: "23:51", s: "CONTATO · MATA AO NORTE", red: true },
    { at: b.goAt, t: "23:52", s: "ATAQUE COMBINE", red: true },
    { at: b.skipAt, t: "23:52", s: "ELES IGNORAM OS REBELDES" },
    { at: b.lockAt, t: "23:53", s: "ALVO: OS DADOS", red: true },
    { at: b.vargaAt, t: "23:53", s: "VARGA ASSUME A DEFESA" },
    { at: b.gordonAt, t: "23:54", s: "FREEMAN ENTRA NO COMBATE" },
    { at: b.criticalAt, t: "23:55", s: "HUNTER · FLANCO LESTE", red: true },
    { at: b.hunterAt, t: "23:55", s: "VARGA DERRUBA O HUNTER" },
    { at: b.repelAt, t: "23:57", s: "EMBOSCADA REPELIDA" },
    { at: b.loseAt, t: "23:58", s: "PERDA · PARTE DOS DADOS", red: true },
  ].filter((l) => l.at < 1e8);

// neve grossa e desfocada passando na frente da câmera (camada 2D por cima da maquete)
// (prévia: sem o desfoque por floco — filtro CSS em 70 elementos pesava a cada quadro)
const FrontSnow: React.FC<{ f: number; lite?: boolean }> = ({ f, lite }) => (
  <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
    {Array.from({ length: 70 }).map((_, i) => {
      const sp = 1.2 + rnd(i * 3) * 2.6;
      const x = ((rnd(i * 7) * 2100 + f * (0.8 + rnd(i) * 1.6) + Math.sin(f / 40 + i) * 30) % 2100) - 90;
      const y = ((rnd(i * 11) * 1200 + f * sp) % 1200) - 60;
      const r = 1.5 + rnd(i * 13) * 4.5;
      return <circle key={i} cx={x} cy={y} r={r} fill="#eef4ff" opacity={0.25 + rnd(i * 17) * 0.4} style={{ filter: r > 4 && !lite ? "blur(2px)" : undefined }} />;
    })}
  </svg>
);

export const HLWarTable: React.FC<{ life: number } & Partial<Beats>> = (p) => {
  const f = useCurrentFrame();
  const lite = useContext(LiteCtx);
  const N = 1e9;
  const b: Beats = {
    contactAt: p.contactAt ?? N,
    goAt: p.goAt ?? N,
    skipAt: p.skipAt ?? N,
    lockAt: p.lockAt ?? N,
    radioAt: p.radioAt ?? N,
    vargaAt: p.vargaAt ?? N,
    gordonAt: p.gordonAt ?? N,
    criticalAt: p.criticalAt ?? N,
    hunterAt: p.hunterAt ?? N,
    repelAt: p.repelAt ?? N,
    loseAt: p.loseAt ?? N,
  };
  const log = LOG(b).filter((l) => f >= l.at);
  const alarm = f >= b.goAt && f < b.repelAt ? 0.5 + 0.5 * Math.sin((f - b.goAt) / 4) : 0;
  return (
    <AbsoluteFill style={{ background: "#03060a" }}>
      <Canvas3D f={f} lite={lite} fov={34} pos={[1.6, 1.25, 3.2]} near={0.05} far={120}>
        <Scene f={f} life={p.life} lite={lite} b={b} />
      </Canvas3D>
      {/* clima: névoa fria que passa devagar e neve grossa na frente da lente */}
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 60% 40% at ${30 + 20 * Math.sin(f / 160)}% ${35 + 10 * Math.cos(f / 190)}%, rgba(170,200,235,0.10), rgba(0,0,0,0) 70%)`, pointerEvents: "none" }} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(110,150,200,0.10) 0%, rgba(0,0,0,0) 45%, rgba(30,60,100,0.14) 100%)", mixBlendMode: "screen", pointerEvents: "none" }} />
      <FrontSnow f={f} lite={lite} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.7) 100%)", pointerEvents: "none" }} />
      {/* entrada: continua a transição do drone — as mesmas curvas âmbar por cima do escuro, que se abre e mostra o mapa */}
      {f < 22 ? (
        <>
          <AbsoluteFill style={{ background: "#03060a", opacity: 0.85 * (1 - P(f, 4, 16)) }} />
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: 1 - P(f, 6, 14) }}>
            {Array.from({ length: 9 }).map((_, i) => {
              const pts: string[] = [];
              for (let j = 0; j <= 48; j++) {
                const a = (j / 48) * Math.PI * 2;
                const r = 90 + i * 70 + 22 * Math.sin(a * 3 + i) + 14 * Math.sin(a * 5 + i * 2);
                pts.push(`${j ? "L" : "M"} ${(960 + Math.cos(a) * r * 1.35).toFixed(1)} ${(540 + Math.sin(a) * r * 0.82).toFixed(1)}`);
              }
              return <path key={i} d={pts.join(" ") + " Z"} fill="none" stroke={AMB} strokeWidth={1.6} opacity={0.55} />;
            })}
          </svg>
        </>
      ) : null}
      <div style={{ position: "absolute", left: 90, top: 70, fontFamily: MONO, color: AMB, letterSpacing: 5, fontSize: 22, lineHeight: 1.6 }}>
        <div>RESISTÊNCIA · MAPA TÁTICO</div>
        <div style={{ opacity: 0.6, fontSize: 18 }}>ACAMPAMENTO · NOITE 1 · SETOR 31</div>
      </div>
      <div style={{ position: "absolute", right: 70, bottom: 64, width: 610, padding: "16px 22px", background: "rgba(3,6,10,0.84)", border: "1px solid rgba(255,178,46,0.35)", borderRadius: 6, fontFamily: MONO, fontSize: 22, letterSpacing: 2, lineHeight: "34px" }}>
        <div style={{ color: AMB, opacity: 0.7, fontSize: 16, letterSpacing: 5, marginBottom: 6 }}>REGISTRO DA NOITE</div>
        {log.slice(-5).map((l, i) => {
          const n = Math.floor(interpolate(f, [l.at, l.at + 14], [0, l.s.length], C));
          const isLast = i === log.slice(-5).length - 1;
          return (
            <div key={l.s} style={{ color: l.red ? "#ff8a96" : "#ffd9a0", opacity: isLast ? 1 : 0.55, whiteSpace: "nowrap" }}>
              <span style={{ opacity: 0.6 }}>{l.t} · </span>
              {l.s.slice(0, n)}
              {isLast && n < l.s.length ? <span>▮</span> : null}
            </div>
          );
        })}
      </div>
      {alarm > 0 ? <AbsoluteFill style={{ boxShadow: `inset 0 0 ${120 + alarm * 60}px rgba(255,40,60,${0.25 + alarm * 0.2})`, pointerEvents: "none" }} /> : null}
    </AbsoluteFill>
  );
};
