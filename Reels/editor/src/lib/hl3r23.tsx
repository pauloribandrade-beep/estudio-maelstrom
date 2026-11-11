// HL3 · 1:43:30 outra realidade: o bonde de Black Mesa (30/10)
// Pedido dele: montar a cena com os modelos do Half-Life 1, como a narração descreve. Tudo saiu do jogo instalado
// (F:\SteamLibrary\...\Half-Life) pelos conversores em tools/hl1: o mapa c0a0 (o passeio de bonde do começo do HL1) com as
// texturas e a luz originais do jogo, o próprio bonde (*12), o G-Man HD com as animações dele e o cientista de óculos HD.
//  · "mostra outro lugar · outra realidade": o túnel; o bonde vem chegando
//  · "um trem atravessando lentamente um complexo subterrâneo": o poço grande, o bonde saindo do túnel
//  · "uma placa passa pela janela, escrito Black Mesa": de dentro, a placa passando
//  · "dentro de um vagão, um homem de óculos está indo trabalhar": o Gordon sentado no banco
//  · "na plataforma, o G-Man observa · ajeita a gravata": pela janela, ele na plataforma acompanhando o bonde; ajeita o paletó
//  · "e o trem? continua": de fora, o bonde seguindo para o túnel
// Coordenadas: tudo no sistema do HL (Z para cima, polegadas). w() converte para o mundo do three (Y para cima).
import React, { useEffect, useMemo, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, Easing, interpolate, staticFile, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { C } from "./hl3";
import { FilmLook } from "./hl3r";
import { LiteCtx, SfxCtx } from "./sfx-ctx";

type PR = Record<string, number> & { life: number };
type G = { scene: THREE.Group; animations: THREE.AnimationClip[] };
const at = (p: PR, k: string) => Math.round((p[k] as number | undefined) ?? 1e6);
const w = (x: number, y: number, z: number) => new THREE.Vector3(x, z, -y);

// o trilho do bonde (path_track do c0a0, na ordem)
const TRACK: [number, number][] = [[2983, 2836], [2796, 2836], [2632, 2836], [2390, 2836], [2166, 2836], [1379, 2836], [-2533, 2836], [-2709, 2790], [-2866, 2699], [-2993, 2571], [-3085, 2412], [-3132, 2237], [-3132, 1664], [-3132, -774], [-3132, -1504]];
const TZ = 453;
const SEG = TRACK.slice(1).map((q, i) => Math.hypot(q[0] - TRACK[i][0], q[1] - TRACK[i][1]));
const along0 = (s: number) => {
  let i = 0;
  while (i < SEG.length - 1 && s > SEG[i]) s -= SEG[i++];
  const a = TRACK[i], b = TRACK[i + 1], u = Math.max(0, Math.min(1, s / SEG[i]));
  return { x: a[0] + (b[0] - a[0]) * u, y: a[1] + (b[1] - a[1]) * u, yaw: Math.atan2(b[1] - a[1], b[0] - a[0]) };
};
// o trilho do mapa é feito de retas: o bonde virava de uma vez em cada canto. Aqui a posição é a média de pontos à frente
// e atrás, e o giro vem da corda entre eles, então ele faz a curva (e as retas continuam retas)
const along = (s: number) => {
  const L = 90, n = 6;
  let x = 0, y = 0;
  for (let j = -n; j <= n; j++) {
    const q = along0(s + (L * j) / n);
    x += q.x;
    y += q.y;
  }
  const a = along0(s - L), b = along0(s + L);
  return { x: x / (2 * n + 1), y: y / (2 * n + 1), yaw: Math.atan2(b.y - a.y, b.x - a.x) };
};
// a distância do trilho onde ele cruza uma certa coordenada y no trecho reto x = -3132
const S_AT_Y = (y: number) => SEG.slice(0, 11).reduce((a, b) => a + b, 0) + (2237 - y);
const S_AT_X = (x: number) => SEG.slice(0, 5).reduce((a, b) => a + b, 0) + (1379 - x);

const cache: Record<string, Promise<G>> = {};
const load = (src: string) => (cache[src] ??= new Promise<G>((ok, no) => new GLTFLoader().load(staticFile(src), (g) => ok(g as unknown as G), undefined, no)));
// a placa: arte nossa no estilo da sinalização do Black Mesa, na fonte do vídeo (Geist Mono); gerada por tools/hl1/make_sign.py
let signTex: Promise<THREE.Texture> | null = null;
const loadSign = () =>
  (signTex ??= new THREE.TextureLoader().loadAsync(staticFile("hl3models/hl1/sign_blackmesa_v2.png")).then((tx) => {
    tx.colorSpace = THREE.SRGBColorSpace;
    tx.anisotropy = 8; // a janela vê a placa de lado: sem isso o texto borra
    return tx;
  }));
const useAssets = () => {
  const [a, setA] = useState<{ map: G; gman: G; sci: G; sign: THREE.Texture } | null>(null);
  const [h] = useState(() => delayRender("HL1 bonde"));
  useEffect(() => {
    Promise.all([load("hl3models/hl1/c0a0.glb"), load("hl3models/hl1_gman.glb"), load("hl3models/hl1_gordon.glb"), loadSign()])
      .then(([map, gman, sci, sign]) => {
        setA({ map, gman, sci, sign });
        continueRender(h);
      })
      .catch((e) => {
        console.error(e);
        continueRender(h);
      });
  }, [h]);
  return a;
};

type Shot = { t0: number; t1: number; s0: number; s1: number; fov: number; cam: (tram: THREE.Object3D, f: number, k: number) => { pos: THREE.Vector3; look: THREE.Vector3 } };

const Scene: React.FC<{ A: { map: G; gman: G; sci: G; sign: THREE.Texture }; f: number; shots: Shot[]; brushAt: number }> = ({ A, f, shots, brushAt }) => {
  const { camera } = useThree();
  const R = useMemo(() => {
    const root = A.map.scene.children[0] as THREE.Object3D; // hl1_map: o sistema do HL
    // 30/10: o GLTFLoader troca espaços por "_" no nome dos nós ("*12 func_tracktrain train" → "*12_func_tracktrain_train")
    let tram: THREE.Object3D | null = null;
    A.map.scene.traverse((o) => {
      if (!tram && /^\*12(_|$)/.test(o.name)) tram = o;
    });
    if (!tram) throw new Error("bonde (*12) não encontrado no c0a0.glb");
    const tramMeshes = new Set<THREE.Object3D>();
    (tram as THREE.Object3D).traverse((o) => tramMeshes.add(o));
    const brushes = [...root.children];
    A.map.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.frustumCulled = false;
        const old = m.material as THREE.MeshStandardMaterial;
        const isTram = tramMeshes.has(o);
        const mat = new THREE.MeshBasicMaterial({ map: old.map ?? null, vertexColors: !isTram, transparent: false, alphaTest: old.alphaTest || (old.transparent ? 0.5 : 0), side: THREE.FrontSide });
        if (old.map) {
          old.map.magFilter = THREE.LinearFilter;
          old.map.anisotropy = 4;
        }
        mat.color.setScalar(isTram ? 0.85 : 1.55);
        m.material = mat;
      }
    });
    const add = (g: G, parent: THREE.Object3D) => {
      const inner = g.scene.children[0];
      inner.quaternion.identity(); // o pai já está no sistema do HL
      g.scene.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.isMesh) {
          m.frustumCulled = false;
          const old = m.material as THREE.MeshStandardMaterial;
          m.material = new THREE.MeshLambertMaterial({ map: old.map ?? null, alphaTest: 0.5, side: THREE.DoubleSide });
        }
      });
      parent.add(g.scene);
      return { obj: g.scene, mixer: new THREE.AnimationMixer(g.scene) };
    };
    const gman = add(A.gman, root);
    // com giro 0 os modelos olham para +X aqui; giro π vira o G-Man de frente para o trilho (que fica em -X)
    gman.obj.position.set(-2870, 900, 526);
    gman.obj.rotation.set(0, 0, Math.PI);
    const sci = add(A.sci, tram!);
    // o Gordon indo trabalhar: corpo de jaleco do cientista HD com a cabeça do Gordon enxertada (--graft), no banco duplo do bonde
    sci.obj.position.set(72, 34, 40);
    sci.obj.rotation.set(0, 0, Math.PI);
    // uma chapa de verdade (6 de espessura) encostada na parede do lado da janela (x = -2940, contínua de y 1300 a 2200, conferido
    // por raio; a face do trilho é a de x menor), na altura da janela. Só a frente leva a arte; as bordas são metal escuro
    const edge = new THREE.MeshBasicMaterial({ color: "#3a3d40" });
    const face = new THREE.MeshBasicMaterial({ map: A.sign, color: new THREE.Color(0.9, 0.9, 0.9) });
    // 31/10: menor (205×35, o tamanho de uma placa de parede ao lado de um homem de 72), e inteira dentro do túnel: a boca fica
    // em y ≈ 1300, e a de 512 passava dela e aparecia por trás na tomada de fora. Fundo da chapa exatamente na parede
    const sign = new THREE.Mesh(new THREE.BoxGeometry(205, 35, 3), [edge, edge, edge, edge, face, edge]);
    sign.position.copy(w(-2941.5, 1560, 522));
    sign.rotation.y = -Math.PI / 2;
    root.parent!.add(sign);
    const clip = (mx: THREE.AnimationMixer, g: G, n: string) => mx.clipAction(g.animations.find((a) => a.name === n) ?? g.animations[0]);
    const gIdle = clip(gman.mixer, A.gman, "idle01"), gBrush = clip(gman.mixer, A.gman, "idlebrush");
    const sSit = clip(sci.mixer, A.sci, "sitting2");
    [gIdle, gBrush, sSit].forEach((x) => x.play());
    return { tram: tram as THREE.Object3D, gman, sci, gIdle, gBrush, sSit, brushes, sign, root };
  }, [A]);
  const shot = shots.find((s) => f >= s.t0 && f < s.t1) ?? shots[shots.length - 1];
  const k = Math.max(0, Math.min(1, (f - shot.t0) / Math.max(1, shot.t1 - shot.t0)));
  const pt = along(shot.s0 + (shot.s1 - shot.s0) * k);
  R.tram.position.set(pt.x, pt.y, TZ);
  R.tram.rotation.set(0, 0, pt.yaw);
  R.tram.updateMatrixWorld(true);
  // o G-Man: parado, depois ajeita o paletó/gravata; o Gordon sentado
  const tb = (f - brushAt) / 30;
  R.gBrush.weight = tb > 0 ? 1 : 0;
  R.gIdle.weight = tb > 0 ? 0 : 1;
  R.gman.mixer.setTime(tb > 0 ? tb : f / 30);
  R.sci.mixer.setTime(f / 30);
  const c = shot.cam(R.tram, f, k);
  const cam = camera as THREE.PerspectiveCamera;
  cam.position.copy(c.pos);
  cam.lookAt(c.look);
  if (cam.fov !== shot.fov || cam.far < 20000) {
    cam.fov = shot.fov;
    cam.near = 1;
    cam.far = 30000;
    cam.updateProjectionMatrix();
  }
  return <primitive object={A.map.scene} />;
};

// um ponto preso ao bonde (coordenadas locais do bonde: X para a frente, Y para a esquerda, Z para cima)
const onTram = (tram: THREE.Object3D, x: number, y: number, z: number) => {
  const v = new THREE.Vector3(x, y, z);
  tram.localToWorld(v);
  return v;
};

export const HL13TramHL1: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const lite = React.useContext(LiteCtx);
  const ctx = React.useContext(SfxCtx);
  const [cutAt, tramAt, signAt, manAt, gmanAt, goAt] = ["cutAt", "tramAt", "signAt", "manAt", "gmanAt", "goAt"].map((k) => at(p, k));
  const A = useAssets();
  const GY = 900;
  const sOut = S_AT_Y(2180), rate = (S_AT_Y(1560) - sOut) / Math.max(1, signAt - tramAt), camV = 80 / Math.max(1, signAt - tramAt);
  const mouth = (() => {
    const m = along(sOut);
    return w(m.x, m.y, TZ);
  })();
  const shots: Shot[] = useMemo(() => [
    // 30/10 (ele: "o outro lugar já é o trem, já é o Half-Life 1"): sem vazio; abre no poço do complexo, a câmera na boca
    // do túnel enquanto o bonde vem por dentro dele, e em "um trem" ele sai e a câmera passa a seguir (plano contínuo)
    // a câmera anda na mesma velocidade nos dois planos, e o olhar vai da boca do túnel para o bonde aos poucos, já antes de ele sair
    { t0: cutAt, t1: tramAt, s0: sOut - rate * (tramAt - cutAt), s1: sOut, fov: 50, cam: (tram, f) => ({ pos: w(-2860, 640 - camV * (tramAt - f), 700), look: mouth.clone().lerp(tram.getWorldPosition(new THREE.Vector3()), interpolate(f, [tramAt - 50, tramAt], [0, 1], { ...C, easing: Easing.inOut(Easing.cubic) })) }) },
    { t0: tramAt, t1: signAt, s0: sOut, s1: S_AT_Y(1560), fov: 50, cam: (tram, f) => ({ pos: w(-2860, 640 + camV * (f - tramAt), 700), look: tram.getWorldPosition(new THREE.Vector3()) }) },
    // de dentro: a placa passando pela janela
    { t0: signAt, t1: manAt, s0: S_AT_Y(1560), s1: S_AT_Y(1380), fov: 62, cam: (tram) => ({ pos: onTram(tram, -20, -40, 62), look: onTram(tram, -20, 200, 58) }) },
    // o homem de óculos indo trabalhar
    { t0: manAt, t1: gmanAt, s0: S_AT_Y(1380), s1: S_AT_Y(1180), fov: 52, cam: (tram, _f, k) => ({ pos: onTram(tram, -50 + 10 * k, -34, 60), look: onTram(tram, 72, 34, 50) }) },
    // pela janela: o G-Man na plataforma, a cabeça acompanha ele passando
    { t0: gmanAt, t1: goAt, s0: S_AT_Y(1180), s1: S_AT_Y(640), fov: 44, cam: (tram) => ({ pos: onTram(tram, 0, -44, 62), look: w(-2870, GY, 578) }) },
    // e o trem continua
    { t0: goAt, t1: life + 1, s0: S_AT_Y(640), s1: S_AT_Y(180), fov: 50, cam: (tram) => ({ pos: w(-3020, 1020, 560), look: tram.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 20, 0)) }) },
  ], [cutAt, tramAt, signAt, manAt, gmanAt, goAt, life]);
  const fadeIn = interpolate(f, [cutAt, cutAt + 18], [1, 0], C);
  const cutFlash = [signAt, manAt, gmanAt, goAt].some((t) => f >= t && f < t + 2) ? 0.5 : 0;
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      {ctx.mode === "collect" || !A ? null : (
        <ThreeCanvas linear={false} width={1920} height={1080} style={{ position: "absolute", inset: 0 }} dpr={lite ? 0.75 : 1} gl={{ antialias: true }} camera={{ fov: 55, position: [0, 0, 0], near: 1, far: 30000 }}>
          <ambientLight intensity={1.9} />
          {/* luz pela frente dos personagens (eles olham para -X do HL, que é -x aqui), um pouco de cima: sem órbitas escuras */}
          <directionalLight position={[-0.8, 0.6, 0.15]} intensity={0.7} />
          <Scene A={A} f={f} shots={shots} brushAt={gmanAt + 36} />
        </ThreeCanvas>
      )}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)", pointerEvents: "none" }} />
      <AbsoluteFill style={{ background: "#fff8ea", opacity: fadeIn, pointerEvents: "none" }} />
      <AbsoluteFill style={{ background: "#000", opacity: cutFlash + interpolate(f, [life - 24, life], [0, 1], C), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};
