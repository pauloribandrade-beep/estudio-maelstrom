import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { ShoppingBag } from "lucide-react";
import { FONT, MONO } from "./overlays";
import { ZALE } from "./theme";
import { SEAM, Snd } from "./palco";
import { LiteCtx, SfxCtx } from "./sfx-ctx";

// LINGUAGEM "PREMIUM" do vídeo do iPhone (referência que o Paulo mandou em 2026-09-28, @tiagolemosx):
// câmera contínua, objeto 3D de verdade com luz e reflexo, grão + vinheta, UI de vidro escura com rótulos mono,
// linhas de chamada ligando rótulo ao objeto, faixa de HUD fixa no topo, movimento que assenta (sem mola).
// O celular é genérico (sem logo). three.js via @remotion/three; render com --gl=angle.

export const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
const W = 1080;
const H = SEAM;
export const eio = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
export const eout = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;

// ---------------------------------------------------------------- câmera e projeção (mesma do canvas)
const FOV = 28;
const CAM = (() => {
  const c = new THREE.PerspectiveCamera(FOV, W / H, 0.1, 100);
  c.position.set(0, 0, 5);
  c.updateMatrixWorld();
  c.updateProjectionMatrix();
  return c;
})();
export type Pose = { x: number; y: number; z?: number; rx?: number; ry: number; rz?: number; s: number };
const poseObj = new THREE.Object3D();
/** ponto local do celular -> px do palco (para ancorar as linhas de chamada no objeto 3D) */
export const project = (p: Pose, local: [number, number, number]): [number, number] => {
  poseObj.position.set(p.x, p.y, p.z ?? 0);
  poseObj.rotation.set(p.rx ?? 0, p.ry, p.rz ?? 0);
  poseObj.scale.setScalar(p.s);
  poseObj.updateMatrixWorld();
  const v = new THREE.Vector3(...local).applyMatrix4(poseObj.matrixWorld).project(CAM);
  return [((v.x + 1) / 2) * W, ((1 - v.y) / 2) * H];
};
export const lerpPose = (a: Pose, b: Pose, t: number): Pose => ({
  x: mix(a.x, b.x, t),
  y: mix(a.y, b.y, t),
  z: mix(a.z ?? 0, b.z ?? 0, t),
  rx: mix(a.rx ?? 0, b.rx ?? 0, t),
  ry: mix(a.ry, b.ry, t),
  rz: mix(a.rz ?? 0, b.rz ?? 0, t),
  s: mix(a.s, b.s, t),
});

// ---------------------------------------------------------------- geometria do celular (unidades ~ 1 = 10 cm)
export const PW = 0.72;
export const PH = 1.48;
const DEPTH = 0.05;
const BEV = 0.018;
export const FRONT_Z = DEPTH / 2 + BEV;
export const BACK_Z = -FRONT_Z;
// iPhone 18 Pro (formato do 17 Pro, cor bordô; pedido do Paulo com fotos): barra de câmeras de ponta a ponta
// no alto das costas; lentes à esquerda (visto de trás = +x local), flash/LiDAR à direita; janela de vidro embaixo.
const BAR_Y = PH / 2 - 0.2;
const BAR_H = 0.36;
const WIN_TOP = BAR_Y - BAR_H / 2 - 0.035;
const WIN_BOT = -PH / 2 + 0.035;
export const PLATEAU: [number, number] = [0.19, BAR_Y]; // centro do conjunto de lentes (local)
const OLD_PLATEAU: [number, number] = [PW / 2 - 0.195, PH / 2 - 0.195]; // aparelho antigo: bloco quadrado

const roundRect = (w: number, h: number, r: number) => {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
};
const flatGeo = (w: number, h: number, r: number) => {
  const g = new THREE.ShapeGeometry(roundRect(w, h, r), 12);
  const pos = g.attributes.position;
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    uv[i * 2] = pos.getX(i) / w + 0.5;
    uv[i * 2 + 1] = pos.getY(i) / h + 0.5;
  }
  g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  return g;
};
// maçã (espelhada em x porque a peça é girada 180° para as costas: a mordida aparece à direita, como na real)
const appleShapes = () => {
  const X = (x: number) => -x;
  const body = new THREE.Shape();
  body.moveTo(X(0), 0.3);
  body.bezierCurveTo(X(0.1), 0.36, X(0.3), 0.38, X(0.4), 0.22);
  body.bezierCurveTo(X(0.3), 0.12, X(0.3), -0.08, X(0.44), -0.13); // mordida
  body.bezierCurveTo(X(0.4), -0.3, X(0.3), -0.45, X(0.2), -0.47);
  body.bezierCurveTo(X(0.12), -0.49, X(0.06), -0.44, X(0), -0.44);
  body.bezierCurveTo(X(-0.06), -0.44, X(-0.12), -0.49, X(-0.2), -0.47);
  body.bezierCurveTo(X(-0.36), -0.44, X(-0.5), -0.2, X(-0.48), 0.02);
  body.bezierCurveTo(X(-0.46), 0.28, X(-0.26), 0.38, X(-0.12), 0.34);
  body.bezierCurveTo(X(-0.07), 0.33, X(-0.03), 0.31, X(0), 0.3);
  const leaf = new THREE.Shape();
  leaf.moveTo(X(0.02), 0.4);
  leaf.bezierCurveTo(X(0.02), 0.52, X(0.1), 0.6, X(0.2), 0.62);
  leaf.bezierCurveTo(X(0.21), 0.52, X(0.12), 0.42, X(0.02), 0.4);
  return [body, leaf];
};
let GEO: ReturnType<typeof buildGeo> | null = null;
const buildGeo = () => {
  const body = new THREE.ExtrudeGeometry(roundRect(PW - 2 * BEV, PH - 2 * BEV, 0.1), { depth: DEPTH, bevelEnabled: true, bevelThickness: BEV, bevelSize: BEV, bevelSegments: 6, curveSegments: 16 });
  body.translate(0, 0, -DEPTH / 2);
  const plateau = new THREE.ExtrudeGeometry(roundRect(0.33, 0.33, 0.075), { depth: 0.008, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 3, curveSegments: 12 });
  const bar = new THREE.ExtrudeGeometry(roundRect(PW - 0.07, BAR_H, 0.1), { depth: 0.01, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 5, curveSegments: 16 });
  const logo = new THREE.ShapeGeometry(appleShapes(), 24);
  return {
    body,
    bar,
    logo,
    window: flatGeo(PW - 0.075, WIN_TOP - WIN_BOT, 0.075),
    bezel: flatGeo(PW - 0.022, PH - 0.022, 0.1),
    screen: flatGeo(PW - 0.05, PH - 0.05, 0.085),
    island: flatGeo(0.2, 0.056, 0.028),
    plateau,
    ring: new THREE.CylinderGeometry(0.06, 0.062, 0.022, 48),
    lens: new THREE.CylinderGeometry(0.045, 0.045, 0.024, 48),
    coat: new THREE.CircleGeometry(0.028, 40),
    flash: new THREE.CircleGeometry(0.02, 24),
    btn: new THREE.BoxGeometry(0.012, 1, 0.026),
  };
};
const geo = () => (GEO ??= buildGeo());

// papel de parede abstrato (genérico), desenhado uma vez num canvas
let WALL: THREE.CanvasTexture | null = null;
const wallpaper = () => {
  if (WALL) return WALL;
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 1052;
  const g = c.getContext("2d")!;
  const bg = g.createLinearGradient(0, 0, 0, c.height);
  bg.addColorStop(0, "#07070f");
  bg.addColorStop(1, "#140a26");
  g.fillStyle = bg;
  g.fillRect(0, 0, c.width, c.height);
  g.filter = "blur(70px)";
  const blob = (x: number, y: number, r: number, col: string) => {
    g.fillStyle = col;
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  };
  blob(120, 640, 230, "#ff5a2c");
  blob(400, 520, 210, "#7a35ff");
  blob(260, 860, 200, "#2b62ff");
  blob(330, 300, 130, "#c2338a");
  WALL = new THREE.CanvasTexture(c);
  WALL.colorSpace = THREE.SRGBColorSpace;
  return WALL;
};
// tela do celular ANTIGO: papel de parede apagado + trincas
let OLDWALL: THREE.CanvasTexture | null = null;
const oldWallpaper = () => {
  if (OLDWALL) return OLDWALL;
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 1052;
  const g = c.getContext("2d")!;
  const bg = g.createLinearGradient(0, 0, 0, c.height);
  bg.addColorStop(0, "#1a2230");
  bg.addColorStop(1, "#0c1016");
  g.fillStyle = bg;
  g.fillRect(0, 0, c.width, c.height);
  g.filter = "blur(60px)";
  g.fillStyle = "#3b5a7a";
  g.beginPath();
  g.arc(260, 620, 220, 0, Math.PI * 2);
  g.fill();
  g.filter = "none";
  g.strokeStyle = "rgba(255,255,255,0.55)";
  g.lineWidth = 2.2;
  const crack = (pts: number[]) => {
    g.beginPath();
    g.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]);
    g.stroke();
  };
  crack([380, 0, 330, 180, 390, 300, 300, 470, 350, 640, 250, 860, 290, 1052]);
  crack([330, 180, 120, 230, 0, 210]);
  crack([390, 300, 512, 350]);
  crack([300, 470, 90, 560, 0, 540]);
  crack([350, 640, 512, 700]);
  OLDWALL = new THREE.CanvasTexture(c);
  OLDWALL.colorSpace = THREE.SRGBColorSpace;
  return OLDWALL;
};

// tela do iPhone NOVO trincada pela queda (cena "ninguém ia comprar"): o mesmo papel de parede + teia de trincas
let CRACKWALL: THREE.CanvasTexture | null = null;
const crackedWallpaper = () => {
  if (CRACKWALL) return CRACKWALL;
  const src = wallpaper().image as HTMLCanvasElement;
  const c = document.createElement("canvas");
  c.width = src.width;
  c.height = src.height;
  const g = c.getContext("2d")!;
  g.drawImage(src, 0, 0);
  g.fillStyle = "rgba(0,0,0,0.25)";
  g.fillRect(0, 0, c.width, c.height);
  const cx = 330;
  const cy = 700;
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  g.strokeStyle = "rgba(255,255,255,0.8)";
  g.lineWidth = 2;
  const rays: [number, number][][] = [];
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2 + rnd() * 0.3;
    const pts: [number, number][] = [];
    let r = 0;
    while (r < 1300) {
      r += 60 + rnd() * 110;
      const aa = a + (rnd() - 0.5) * 0.35;
      pts.push([cx + Math.cos(aa) * r, cy + Math.sin(aa) * r]);
    }
    rays.push(pts);
    g.beginPath();
    g.moveTo(cx, cy);
    pts.forEach(([x, y]) => g.lineTo(x, y));
    g.stroke();
  }
  g.lineWidth = 1.2;
  [70, 150, 260].forEach((rr) => {
    g.beginPath();
    rays.forEach((pts, i) => {
      const p = pts[0];
      const d = Math.hypot(p[0] - cx, p[1] - cy) || 1;
      const x = cx + ((p[0] - cx) / d) * rr;
      const y = cy + ((p[1] - cy) / d) * rr;
      if (i === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    });
    g.closePath();
    g.stroke();
  });
  g.fillStyle = "rgba(255,255,255,0.9)";
  g.beginPath();
  g.arc(cx, cy, 10, 0, Math.PI * 2);
  g.fill();
  CRACKWALL = new THREE.CanvasTexture(c);
  CRACKWALL.colorSpace = THREE.SRGBColorSpace;
  return CRACKWALL;
};

// ---------------------------------------------------------------- materiais
type Mats = ReturnType<typeof buildMats>;
let MATS: Mats | null = null;
const buildMats = () => ({
  // iPhone 18 BORDÔ (Paulo mandou as fotos em 2026-09-28: "esse roxo é mais signature"; o laranja era o 17):
  // alumínio vinho (corpo, laterais e barra das câmeras), vidro fosco da janela um tom acima e a maçã polida
  frame: new THREE.MeshPhysicalMaterial({ color: "#561a30", metalness: 0.8, roughness: 0.32, clearcoat: 0.35, clearcoatRoughness: 0.3 }),
  back: new THREE.MeshPhysicalMaterial({ color: "#4e172b", metalness: 0.75, roughness: 0.4 }),
  glassWin: new THREE.MeshPhysicalMaterial({ color: "#5a1c33", metalness: 0.15, roughness: 0.5, clearcoat: 0.9, clearcoatRoughness: 0.25, side: THREE.DoubleSide }),
  logo: new THREE.MeshPhysicalMaterial({ color: "#9a5470", metalness: 1, roughness: 0.1, side: THREE.DoubleSide }),
  lidar: new THREE.MeshPhysicalMaterial({ color: "#111214", roughness: 0.25, clearcoat: 1 }),
  black: new THREE.MeshPhysicalMaterial({ color: "#020203", roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.03 }),
  screen: new THREE.MeshPhysicalMaterial({ color: "#000000", emissive: "#ffffff", emissiveMap: null, emissiveIntensity: 1, roughness: 0.06, clearcoat: 1, clearcoatRoughness: 0.02 }),
  plateau: new THREE.MeshPhysicalMaterial({ color: "#303236", metalness: 0.3, roughness: 0.14, clearcoat: 1, clearcoatRoughness: 0.05 }),
  ring: new THREE.MeshPhysicalMaterial({ color: "#8d8f94", metalness: 1, roughness: 0.18 }),
  lens: new THREE.MeshPhysicalMaterial({ color: "#050608", roughness: 0.02, clearcoat: 1, clearcoatRoughness: 0 }),
  coat: new THREE.MeshPhysicalMaterial({ color: "#0d1830", emissive: "#1c2f66", emissiveIntensity: 0.35, roughness: 0, metalness: 0.6, clearcoat: 1 }),
  flash: new THREE.MeshStandardMaterial({ color: "#d9d4c4", roughness: 0.4 }),
  // aparelho antigo: prata gasto, vidro fosco, tela trincada
  frameOld: new THREE.MeshPhysicalMaterial({ color: "#a9abae", metalness: 1, roughness: 0.45 }),
  backOld: new THREE.MeshPhysicalMaterial({ color: "#c9cacc", metalness: 0.1, roughness: 0.6, clearcoat: 0.4, clearcoatRoughness: 0.5 }),
  screenOld: new THREE.MeshPhysicalMaterial({ color: "#000000", emissive: "#ffffff", emissiveMap: null, emissiveIntensity: 1, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.2 }),
  screenCracked: new THREE.MeshPhysicalMaterial({ color: "#000000", emissive: "#ffffff", emissiveMap: null, emissiveIntensity: 1, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.25 }),
  // miolo da vista explodida
  battery: new THREE.MeshPhysicalMaterial({ color: "#16171a", metalness: 0.5, roughness: 0.35 }),
  board: new THREE.MeshPhysicalMaterial({ color: "#0d3326", metalness: 0.3, roughness: 0.5 }),
  chip: new THREE.MeshPhysicalMaterial({ color: "#2a2b2f", metalness: 0.8, roughness: 0.25 }),
});
const mats = () => {
  if (!MATS) {
    MATS = buildMats();
    MATS.screen.emissiveMap = wallpaper();
    MATS.screenOld.emissiveMap = oldWallpaper();
    MATS.screenCracked.emissiveMap = crackedWallpaper();
  }
  return MATS;
};
let INNER: { battery: THREE.BufferGeometry; board: THREE.BufferGeometry; chip: THREE.BufferGeometry } | null = null;
const inner = () =>
  (INNER ??= {
    battery: new THREE.BoxGeometry(PW - 0.2, PH * 0.55, 0.03),
    board: new THREE.BoxGeometry(0.26, PH * 0.62, 0.012),
    chip: new THREE.BoxGeometry(0.1, 0.1, 0.016),
  });

// ambiente de estúdio (reflexos do metal e do vidro); `turn` gira o ambiente = brilho varrendo o aparelho
const Env: React.FC<{ intensity: number; turn: number }> = ({ intensity, turn }) => {
  const { gl, scene } = useThree();
  React.useLayoutEffect(() => {
    const pm = new THREE.PMREMGenerator(gl);
    const env = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    return () => {
      scene.environment = null;
      env.dispose();
      pm.dispose();
    };
  }, [gl, scene]);
  scene.environmentIntensity = intensity;
  scene.environmentRotation.set(0, turn, 0);
  return null;
};

export type PhoneSpec = { pose: Pose; screen?: number; explode?: number; old?: boolean; cracked?: boolean };
const PhoneModel: React.FC<PhoneSpec> = ({ pose, screen = 1, explode = 0, old, cracked }) => {
  const g = geo();
  const m = mats();
  const scr = old ? m.screenOld : cracked ? m.screenCracked : m.screen;
  scr.emissiveIntensity = screen;
  const ex = explode;
  const ig = inner();
  const [px, py] = old ? OLD_PLATEAU : PLATEAU;
  // lentes em triângulo (duas empilhadas na ponta, uma para dentro), como no 17 Pro
  const lenses: [number, number][] = old
    ? [
        [px + 0.072, py + 0.076],
        [px + 0.072, py - 0.076],
        [px - 0.074, py],
      ]
    : [
        [px + 0.07, py + 0.078],
        [px + 0.07, py - 0.078],
        [px - 0.075, py],
      ];
  return (
    <group position={[pose.x, pose.y, pose.z ?? 0]} rotation={[pose.rx ?? 0, pose.ry, pose.rz ?? 0]} scale={pose.s}>
      <mesh geometry={g.body} material={old ? [m.backOld, m.frameOld] : [m.back, m.frame]} />
      <mesh geometry={g.bezel} material={m.black} position={[0, 0, FRONT_Z + 0.0006 + ex * 0.42]} />
      <mesh geometry={g.screen} material={scr} position={[0, 0, FRONT_Z + 0.0012 + ex * 0.42]} />
      <mesh geometry={g.island} material={m.black} position={[0, PH / 2 - 0.075, FRONT_Z + 0.002 + ex * 0.42]} />
      {ex > 0.01 ? (
        <>
          <mesh geometry={ig.battery} material={m.battery} position={[0, -0.18, ex * 0.24]} />
          <group position={[0.2, 0.12, ex * 0.08]}>
            <mesh geometry={ig.board} material={m.board} />
            {[0.3, 0.1, -0.12].map((cy, i) => (
              <mesh key={i} geometry={ig.chip} material={m.chip} position={[0, cy, 0.012]} />
            ))}
          </group>
        </>
      ) : null}
      {/* bloco das câmeras nas costas (visto de trás fica no canto superior esquerdo) */}
      {!old ? (
        <group position={[0, 0, BACK_Z]} rotation={[0, Math.PI, 0]}>
          {/* janela de vidro fosco na parte de baixo das costas + a maçã polida no centro dela */}
          <mesh geometry={g.window} material={m.glassWin} position={[0, (WIN_TOP + WIN_BOT) / 2, 0.0015]} />
          <mesh geometry={g.logo} material={m.logo} position={[0, -0.12, 0.0025]} scale={0.2} />
          {/* barra das câmeras de ponta a ponta, flash e LiDAR à direita */}
          <mesh geometry={g.bar} material={m.frame} position={[0, BAR_Y, 0.002 + ex * 0.3]} />
          <mesh geometry={g.flash} material={m.flash} position={[-0.2, BAR_Y + 0.075, 0.021 + ex * 0.3]} />
          <mesh geometry={g.coat} material={m.lidar} position={[-0.2, BAR_Y - 0.07, 0.021 + ex * 0.3]} scale={1.15} />
        </group>
      ) : null}
      <group position={[px, py, BACK_Z - ex * 0.3 - (old ? 0 : 0.012)]} rotation={[0, Math.PI, 0]}>
        {old ? <mesh geometry={g.plateau} material={m.plateau} position={[0, 0, 0.002]} /> : null}
        {lenses.map(([lx, ly], i) => (
          <group key={i} position={[-(lx - px), ly - py, 0.026]}>
            <mesh geometry={g.ring} material={m.ring} rotation={[Math.PI / 2, 0, 0]} />
            <mesh geometry={g.lens} material={m.lens} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.002]} />
            <mesh geometry={g.coat} material={m.coat} position={[0, 0, 0.0145]} />
          </group>
        ))}
        {old ? <mesh geometry={g.flash} material={m.flash} position={[0.074, 0.088, 0.0125]} /> : null}
      </group>
      {/* botões laterais */}
      <mesh geometry={g.btn} material={old ? m.frameOld : m.frame} position={[-PW / 2 - 0.004, 0.36, 0]} scale={[1, 0.09, 1]} />
      <mesh geometry={g.btn} material={old ? m.frameOld : m.frame} position={[-PW / 2 - 0.004, 0.22, 0]} scale={[1, 0.09, 1]} />
      <mesh geometry={g.btn} material={old ? m.frameOld : m.frame} position={[PW / 2 + 0.004, 0.28, 0]} scale={[1, 0.16, 1]} />
    </group>
  );
};

/** o celular 3D num canvas transparente do tamanho do palco. mood 0 = estúdio keynote, 1 = luz fluorescente fria */
export const PhoneStage: React.FC<{ pose?: Pose; screen?: number; mood?: number; turn?: number; env?: number; explode?: number; old?: boolean; phones?: PhoneSpec[]; style?: React.CSSProperties }> = ({
  pose,
  screen = 1,
  mood = 0,
  turn = 0,
  env = 1,
  explode = 0,
  old,
  phones,
  style,
}) => {
  const ctx = React.useContext(SfxCtx);
  const lite = React.useContext(LiteCtx);
  if (ctx.mode === "collect") return null; // coleta de sons não precisa de WebGL
  const k = 1 - mood;
  return (
    <ThreeCanvas width={W} height={H} style={{ position: "absolute", left: 0, top: 0, ...style }} dpr={lite ? 0.5 : undefined} gl={{ antialias: !lite, alpha: true }} camera={{ fov: FOV, position: [0, 0, 5], near: 0.1, far: 100 }}>
      <Env intensity={mix(0.35, 1.05, k) * env} turn={turn} />
      <ambientLight intensity={mix(0.5, 0.08, k)} color={mood > 0.5 ? "#dff5ea" : "#ffffff"} />
      <directionalLight position={[2.5, 3, 4]} intensity={mix(0.6, 1.4, k)} color="#ffffff" />
      <directionalLight position={[0, 6, 1.5]} intensity={mix(2.4, 0, k)} color="#e3f7ec" />
      <directionalLight position={[-4, 1.2, -3]} intensity={mix(0, 3.2, k)} color="#cfe0ff" />
      <directionalLight position={[4, 0.4, -2.5]} intensity={mix(0, 2.2, k)} color="#ffffff" />
      {(phones ?? (pose ? [{ pose, screen, explode, old }] : [])).map((p, i) => (
        <PhoneModel key={i} {...p} />
      ))}
    </ThreeCanvas>
  );
};

// ---------------------------------------------------------------- acabamento de cinema (HTML)
export const Grain: React.FC<{ f: number; o?: number }> = ({ f, o = 0.07 }) => (React.useContext(LiteCtx) ? null :
  <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: o, mixBlendMode: "overlay", pointerEvents: "none" }}>
    <filter id={`gr${f % 6}`}>
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={f % 6} stitchTiles="stitch" />
      <feColorMatrix type="saturate" values="0" />
    </filter>
    <rect width="100%" height="100%" filter={`url(#gr${f % 6})`} />
  </svg>
);
export const Vignette: React.FC<{ o?: number }> = ({ o = 0.6 }) => <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 75% 70% at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,${o}) 100%)`, pointerEvents: "none" }} />;

/** faixa fixa no topo do palco: capítulo à esquerda, contador à direita (como o "EDITANDO AO VIVO" da referência) */
// `hideAt`: some suavemente a partir desse quadro (Paulo: a faixa fica até o CTA; no "me segue aqui" o perfil fica sozinho)
export const Hud: React.FC<{ left: string; right: string; f: number; dark?: boolean; switchAt?: number; left2?: string; hideAt?: number }> = ({ left, right, f, dark, switchAt, left2, hideAt }) => {
  const sw = switchAt !== undefined && f >= switchAt;
  const glitch = switchAt !== undefined && f >= switchAt && f < switchAt + 6 ? (f % 2 ? 4 : -3) : 0;
  const col = dark ? "rgba(20,26,24,0.7)" : "rgba(255,255,255,0.62)";
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: 128, display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: MONO, fontSize: 19, letterSpacing: 3, color: col, textTransform: "uppercase", opacity: hideAt !== undefined ? 1 - eio(f, hideAt, hideAt + 12) : 1 }}>
      <span style={{ display: "flex", alignItems: "center", gap: 12, transform: `translateX(${glitch}px)` }}>
        <span style={{ width: 10, height: 10, borderRadius: 5, background: sw ? "#e7eaa0" : ZALE.redBright, boxShadow: `0 0 10px ${sw ? "#e7eaa0" : ZALE.redBright}`, opacity: Math.floor(f / 15) % 2 ? 0.45 : 1 }} />
        {sw && left2 ? left2 : left}
      </span>
      <span>{right}</span>
    </div>
  );
};

/** TRANSIÇÃO (pedido do Paulo: "piscar a tela e sumir não tá bacana"): a cena NÃO sai para o preto. A próxima começa
 *  ~0,43 s antes do fim desta (sobreposta na linha do tempo, build_iphone.py) e entra POR CIMA, desfocada -> nítida,
 *  enquanto esta continua inteira por baixo = dissolve com puxada de foco, sem quadro preto no meio. */
export const XFADE = 13; // quadros de sobreposição/entrada
export const Focus: React.FC<{ f: number; life: number; children: React.ReactNode; first?: boolean }> = ({ f, children }) => {
  const inn = eio(f, 0, XFADE);
  const blur = React.useContext(LiteCtx) ? 0 : (1 - inn) * 14; // prévia: sem desfoque do palco inteiro (pesado)
  return <div style={{ position: "absolute", inset: 0, opacity: inn, transform: `scale(${(1.04 - 0.04 * inn).toFixed(4)})`, filter: blur > 0.2 ? `blur(${blur.toFixed(2)}px)` : undefined }}>{children}</div>;
};

/** linha de chamada: ponto no objeto -> cotovelo -> rótulo de vidro */
export const Callout: React.FC<{ f: number; at: number; from: [number, number]; to: [number, number]; kicker: string; children?: React.ReactNode; side?: "left" | "right"; width?: number }> = ({
  f,
  at,
  from,
  to,
  kicker,
  children,
  side = "right",
  width = 330,
}) => {
  const lite = React.useContext(LiteCtx);
  const dot = eout(f, at, at + 6);
  const line = eio(f, at + 3, at + 15);
  const box = eout(f, at + 11, at + 24);
  const elbow: [number, number] = [mix(from[0], to[0], 0.35), to[1]];
  const seg1 = Math.hypot(elbow[0] - from[0], elbow[1] - from[1]);
  const seg2 = Math.abs(to[0] - elbow[0]);
  const len = seg1 + seg2;
  return (
    <>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <circle cx={from[0]} cy={from[1]} r={7 * dot} fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth={2} />
        <circle cx={from[0]} cy={from[1]} r={2.5 * dot} fill="#fff" />
        <path d={`M ${from[0]} ${from[1]} L ${elbow[0]} ${elbow[1]} L ${to[0]} ${to[1]}`} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={1.6} strokeDasharray={len} strokeDashoffset={len * (1 - line)} />
      </svg>
      <div
        style={{
          position: "absolute",
          top: to[1] - 34,
          ...(side === "right" ? { left: to[0] + 14 } : { left: to[0] - 14 - width }),
          width,
          opacity: box,
          transform: `translateY(${(1 - box) * 10}px)`,
          filter: box < 0.98 ? `blur(${((1 - box) * 6).toFixed(2)}px)` : undefined,
          background: "rgba(18,18,22,0.55)",
          border: "1px solid rgba(255,255,255,0.14)",
          borderRadius: 16,
          color: "#fff",
          fontFamily: FONT,
          padding: "14px 20px 16px",
          backdropFilter: lite ? undefined : "blur(14px)",
          boxShadow: "0 18px 40px rgba(0,0,0,0.45)",
        }}
      >
        <div style={{ fontFamily: MONO, fontSize: 17, letterSpacing: 3, color: "rgba(255,255,255,0.55)", textTransform: "uppercase", marginBottom: 6 }}>{kicker}</div>
        {children}
      </div>
    </>
  );
};

/** número de odômetro: cada casa rola continuamente (12.000 -> 1.000 rola de verdade) */
export const Odometer: React.FC<{ value: number; size: number; color?: string; prefix?: string; digits?: number }> = ({ value, size, color = "#fff", prefix = "R$ ", digits = 5 }) => {
  const lh = size * 1.08;
  const cols = [];
  for (let k = digits - 1; k >= 0; k--) {
    const p = Math.pow(10, k);
    // casa k só gira na "virada" (quando as casas de baixo passam do 9), como odômetro de verdade
    const frac = k === 0 ? value % 1 : (value % p) / p;
    const turn = k === 0 ? frac : Math.max(0, (frac - 0.9) / 0.1);
    const d = (Math.floor(value / p) % 10) + turn * turn * (3 - 2 * turn);
    const show = value >= p - 0.5 || k === 0;
    const vis = k === 0 ? 1 : Math.max(0, Math.min(1, (value - p * 0.9) / (p * 0.1)));
    cols.push(
      <span key={k} style={{ display: "inline-block", height: lh, overflow: "hidden", width: show ? size * 0.6 * vis : 0, opacity: vis, verticalAlign: "top" }}>
        <span style={{ display: "block", transform: `translateY(${(-d * lh).toFixed(2)}px)` }}>
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((n, i) => (
            <span key={i} style={{ display: "block", height: lh, lineHeight: `${lh}px`, textAlign: "center" }}>
              {n}
            </span>
          ))}
        </span>
      </span>,
    );
    if (k === 3 && show) cols.push(<span key="dot" style={{ display: "inline-block", lineHeight: `${lh}px`, verticalAlign: "top", opacity: vis }}>.</span>);
  }
  return (
    <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: size, color, letterSpacing: -size * 0.03, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap", display: "inline-flex" }}>
      <span style={{ lineHeight: `${lh}px`, marginRight: size * 0.12, fontWeight: 600, opacity: 0.85 }}>{prefix.trim()}</span>
      {cols}
    </span>
  );
};

/** preço rolando de `from` para `to` (pedido do Paulo: "mais smooth"): cada casa gira sozinha, da direita para a
 *  esquerda, com aceleração/freio e desfoque de movimento proporcional à velocidade. `t` = 0..1 (linear). */
const rollEase = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
/** posição contínua da casa k (0 = unidades) no instante t (0..1) — a MESMA conta serve o desenho e os tiques */
const rollCol = (from: number, to: number, t: number, k: number) => {
  const n = Math.max(String(from).length, String(to).length);
  const p = Math.pow(10, k);
  const a = Math.floor(from / p) % 10;
  const b = Math.floor(to / p) % 10;
  const down = to < from;
  const base = down ? (a - b + 10) % 10 : (b - a + 10) % 10;
  const spins = k === n - 1 ? 0 : 1; // uma volta por casa: rola contando, sem virar borrão
  const steps = base + 10 * spins;
  const tk = Math.max(0, Math.min(1, (t - k * 0.07) / (1 - 0.07 * (n - 1)))); // a casa das unidades começa primeiro
  const e = rollEase(tk);
  const speed = Math.abs(rollEase(Math.min(1, tk + 0.02)) - e) * steps;
  const raw = down ? a - steps * e : a + steps * e;
  const lead = from >= p || to >= p;
  const vis = !lead ? 0 : from < p ? e : to < p ? 1 - e : 1; // casa que some/aparece encolhe junto
  return { raw, pos: ((raw % 10) + 10) % 10, speed, vis, n };
};
/** tiques do contador SINCRONIZADOS com o desenho (pedido do Paulo: o som estava desencontrado): um tique cada
 *  vez que a casa das unidades troca de número, com espaço mínimo de `gap` quadros. Quadros relativos à cena. */
export const rollDigitTicks = (from: number, to: number, at: number, dur: number, gap = 2) => {
  const out: number[] = [];
  let prev = Math.floor(rollCol(from, to, 0, 0).raw + 1e-6);
  for (let f = 1; f <= dur; f++) {
    const cur = Math.floor(rollCol(from, to, f / dur, 0).raw + 1e-6);
    if (cur !== prev && (!out.length || at + f - out[out.length - 1] >= gap)) out.push(at + f);
    prev = cur;
  }
  return out;
};
/** preço rolando de `from` para `to` (pedido do Paulo: "mais smooth"): cada casa gira sozinha, da direita para a
 *  esquerda, com aceleração/freio e desfoque de movimento proporcional à velocidade. `t` = 0..1 (linear). */
export const RollNumber: React.FC<{ from: number; to: number; t: number; size: number; color?: string; prefix?: string }> = ({ from, to, t, size, color = "#fff", prefix = "R$" }) => {
  const lh = size * 1.08;
  const n = Math.max(String(from).length, String(to).length);
  const cols: React.ReactNode[] = [];
  for (let k = n - 1; k >= 0; k--) {
    const { pos, speed, vis } = rollCol(from, to, t, k);
    cols.push(
      <span key={k} style={{ display: "inline-block", height: lh, overflow: "hidden", width: size * 0.6 * vis, opacity: vis, verticalAlign: "top" }}>
        <span style={{ display: "block", transform: `translateY(${(-pos * lh).toFixed(2)}px)`, filter: speed > 0.03 ? `blur(${Math.min(1.4, speed * 4).toFixed(2)}px)` : undefined }}>
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d, i) => (
            <span key={i} style={{ display: "block", height: lh, lineHeight: `${lh}px`, textAlign: "center" }}>
              {d}
            </span>
          ))}
        </span>
      </span>,
    );
    if (k === 3) cols.push(<span key="dot" style={{ display: "inline-block", lineHeight: `${lh}px`, verticalAlign: "top" }}>.</span>);
  }
  return (
    <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: size, color, letterSpacing: -size * 0.03, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap", display: "inline-flex" }}>
      <span style={{ lineHeight: `${lh}px`, marginRight: size * 0.12, fontWeight: 600, opacity: 0.85 }}>{prefix}</span>
      {cols}
    </span>
  );
};
/** quadros (relativos a `at`) em que um contador de `dur` quadros deve tocar tique: segue a curva (acelera e freia) */
export const rollTicks = (at: number, dur: number, n = 8) => {
  const out: number[] = [];
  const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  for (let i = 1; i <= n; i++) {
    let fr = 0;
    while (fr < dur && ease(fr / dur) < i / (n + 1)) fr++;
    out.push(at + fr);
  }
  return out;
};

/** título palavra a palavra, sobe desfocado e assenta */
export const Reveal: React.FC<{ f: number; at: number; text: string; size: number; weight?: number; color?: string; gap?: number }> = ({ f, at, text, size, weight = 800, color = "#fff", gap = 5 }) => (
  <span style={{ fontFamily: FONT, fontWeight: weight, fontSize: size, color, letterSpacing: -size * 0.035, lineHeight: 1.02, whiteSpace: "nowrap" }}>
    {text.split(" ").map((w, i) => {
      const t = eout(f, at + i * gap, at + i * gap + 14);
      return (
        <span key={i} style={{ display: "inline-block", marginRight: size * 0.24, opacity: t, transform: `translateY(${((1 - t) * size * 0.35).toFixed(1)}px)`, filter: t < 0.98 ? `blur(${((1 - t) * 8).toFixed(2)}px)` : undefined }}>
          {w}
        </span>
      );
    })}
  </span>
);

export const Kicker: React.FC<{ f: number; at: number; text: string }> = ({ f, at, text }) => {
  const t = eout(f, at, at + 14);
  return <div style={{ fontFamily: MONO, fontSize: 19, letterSpacing: 4, textTransform: "uppercase", color: "rgba(255,255,255,0.55)", opacity: t, transform: `translateX(${(1 - t) * -12}px)`, marginBottom: 14 }}>{text}</div>;
};

// fundos
export const KeynoteBg: React.FC<{ o?: number }> = ({ o = 1 }) => (
  <div style={{ position: "absolute", inset: 0, opacity: o, background: "radial-gradient(ellipse 60% 55% at 38% 42%, #1c1c20 0%, #0a0a0c 55%, #000 100%)" }}>
    <div style={{ position: "absolute", left: 140, top: 760, width: 460, height: 90, borderRadius: "50%", background: "radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.10), rgba(255,255,255,0) 70%)" }} />
  </div>
);
export const OfficeBg: React.FC<{ o: number }> = ({ o }) => (
  <div style={{ position: "absolute", inset: 0, opacity: o, background: "linear-gradient(#aeb9b3 0%, #8b9792 55%, #58625e 100%)" }}>
    {[210, 540, 870].map((x) => (
      <div key={x} style={{ position: "absolute", left: x - 150, top: 186, width: 300, height: 16, borderRadius: 8, background: "#f4fbf7", boxShadow: "0 0 40px 14px rgba(236,250,242,0.75), 0 0 120px 40px rgba(220,245,232,0.35)" }} />
    ))}
    {/* tampo da mesa em perspectiva */}
    <div style={{ position: "absolute", left: -80, right: -80, top: 700, height: 300, background: "linear-gradient(#6f675d, #4a443d)", transform: "perspective(900px) rotateX(58deg)", transformOrigin: "50% 0%" }} />
    <div style={{ position: "absolute", left: 140, top: 735, width: 460, height: 70, borderRadius: "50%", background: "radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0.45), rgba(0,0,0,0) 70%)" }} />
  </div>
);

// ================================================================ CENA 1 — "Se a Apple vendesse igual a maioria… mil reais… ninguém ia querer"
export const AppleOpen: React.FC<{ life: number; mayAt: number; calloutAt: number; rollAt: number; zeroAt: number }> = ({ life, mayAt, calloutAt, rollAt, zeroAt }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  // flicker da fluorescente acendendo no "maioria"
  const fl = f < mayAt ? 0 : ([1, 0.15, 0.9, 0.3, 1, 0.6, 1][f - mayAt] ?? 1);
  const mood = fl;
  const t = f / Math.max(1, life);
  const pose: Pose = { x: -0.46, y: 0.06 + Math.sin(f / 40) * 0.012, ry: mix(-0.62, 0.32, t), rx: -0.05, s: 1 };
  const rollDur = Math.round(fps * 0.75); // começa no "custar" e assenta no "mil reais"
  const roll = interpolate(f, [rollAt, rollAt + rollDur], [0, 1], clamp);
  const zero = eout(f, zeroAt, zeroAt + 14);
  const dim = eio(f, zeroAt, zeroAt + 40);
  const anchor = project(pose, [PW / 2 + 0.01, 0.3, 0]);
  return (
    <AbsoluteFill style={{ height: H, overflow: "hidden" }}>
      <Focus f={f} life={life}>
        <KeynoteBg />
        <OfficeBg o={mood} />
        <PhoneStage pose={pose} mood={mood} screen={mix(1, 0.25, dim)} turn={mix(-0.6, 0.6, t)} />
        <Callout f={f} at={calloutAt} from={anchor} to={[640, 330]} kicker="preço" width={360}>
          <RollNumber from={12000} to={1000} t={roll} size={66} />
        </Callout>
        <div style={{ position: "absolute", left: 654, top: 520, width: 390, whiteSpace: "nowrap", opacity: zero, transform: `translateY(${(1 - zero) * 12}px)`, filter: zero < 0.98 ? `blur(${((1 - zero) * 6).toFixed(2)}px)` : undefined, background: "rgba(18,18,22,0.6)", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 16, padding: "14px 20px", backdropFilter: "blur(14px)", display: "flex", alignItems: "center", gap: 16 }}>
          <ShoppingBag size={34} color="rgba(255,255,255,0.8)" strokeWidth={1.5} />
          <div>
            <div style={{ fontFamily: MONO, fontSize: 17, letterSpacing: 3, color: "rgba(255,255,255,0.55)" }}>PEDIDOS</div>
            <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 54, color: "#fff", lineHeight: 1 }}>0</div>
          </div>
          <div style={{ marginLeft: "auto", fontFamily: MONO, fontSize: 16, letterSpacing: 2, color: ZALE.redBright }}>● SEM INTERESSE</div>
        </div>
        <Hud f={f} left="O jeito Apple" left2="Se vendesse igual a maioria" switchAt={mayAt} right="01 · o preço" dark={mood > 0.5} />
        <Vignette o={mix(0.65, 0.35, mood)} />
        <Grain f={f} o={mix(0.06, 0.1, mood)} />
      </Focus>
      <Snd at={0} name="whoosh" k="apple-open" vol={0.2} />
      <Snd at={mayAt} name="switch" k="fluor" vol={0.3} />
      <Snd at={mayAt + 3} name="click" k="fluor-tick" vol={0.25} />
      <Snd at={calloutAt + 12} name="ui" v={0} vol={0.2} />
      {rollDigitTicks(12000, 1000, rollAt, rollDur).map((t, i) => (
        <Snd key={i} at={t} name="tick" v={0} vol={0.09} />
      ))}
      <Snd at={zeroAt} name="error" k="no-orders" vol={0.2} />
    </AbsoluteFill>
  );
};

// ================================================================ CENA 2 — "O iPhone 18 já chegou no Brasil… a partir de 12 mil"
export const LensReveal: React.FC<{ life: number; nameAt: number; specAt: number; spec2At: number; priceAt: number; name?: string }> = ({ life, nameAt, specAt, spec2At, priceAt, name = "iPhone 18" }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s0 = 2.9;
  const start: Pose = { x: PLATEAU[0] * s0, y: -PLATEAU[1] * s0, ry: Math.PI, rx: 0, s: s0 };
  const end: Pose = { x: -0.44, y: 0.04, ry: Math.PI - 0.62, rx: -0.06, s: 1 };
  const dolly = eio(f, 2, Math.round(fps * 0.8));
  const titleAt = Math.max(nameAt, Math.round(fps * 0.6)); // no "18", com a câmera já quase assentada
  const pose = lerpPose(start, end, dolly);
  pose.ry += Math.sin(f / 50) * 0.02 * dolly;
  pose.y += Math.sin(f / 40) * 0.01 * dolly;
  const pr = eout(f, priceAt, priceAt + 16);
  return (
    <AbsoluteFill style={{ height: H, overflow: "hidden" }}>
      <Focus f={f} life={life}>
        <KeynoteBg />
        <PhoneStage pose={pose} turn={mix(-1.1, 0.5, eio(f, 0, fps * 2))} screen={0} />
        <div style={{ position: "absolute", left: 640, top: 380, width: 420 }}>
          <Kicker f={f} at={titleAt - 6} text="Lançamento" />
          <Reveal f={f} at={titleAt} text={name} size={86} gap={6} />
          <div style={{ marginTop: 14, fontFamily: MONO, fontSize: 19, letterSpacing: 4, color: "rgba(255,255,255,0.7)", opacity: eout(f, specAt, specAt + 14), transform: `translateX(${((1 - eout(f, specAt, specAt + 14)) * -12).toFixed(1)}px)` }}>● JÁ CHEGOU AO BRASIL</div>
          <div style={{ height: 1, background: "rgba(255,255,255,0.18)", margin: "26px 0 22px", width: `${(eio(f, priceAt - 4, priceAt + 14) * 100).toFixed(1)}%` }} />
          <div style={{ opacity: pr, transform: `translateY(${(1 - pr) * 12}px)`, filter: pr < 0.98 ? `blur(${((1 - pr) * 6).toFixed(2)}px)` : undefined }}>
            <div style={{ fontFamily: FONT, fontSize: 30, fontWeight: 400, color: "rgba(255,255,255,0.6)", marginBottom: 4 }}>a partir de</div>
            <div style={{ fontFamily: FONT, fontSize: 64, fontWeight: 800, color: "#fff", letterSpacing: -2 }}>R$ 12 mil</div>
          </div>
        </div>
        <Hud f={f} left="O jeito Apple" right="02 · o lançamento" />
        <Vignette />
        <Grain f={f} />
      </Focus>
      <Snd at={0} name="whoosh" k="dolly" vol={0.22} />
      <Snd at={titleAt} name="ui" v={2} vol={0.22} />
      <Snd at={specAt} name="tick" v={0} vol={0.16} />
      <Snd at={priceAt} name="ding" k="price" vol={0.22} />
    </AbsoluteFill>
  );
};
