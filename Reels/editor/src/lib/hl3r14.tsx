// =================================================================================================
// HL3 · 1:36:38 → 1:38:36 o tempo corre (12/10/2026). Pedido dele (p_tempo_corre_2041): o cenário 2D fraco (navio,
// torres, G-Man recortado) → reformular. Agora é o MESMO sítio do Borealis no gelo (o navio e o gelo aprovados, World),
// visto da crista, em time-lapse: o véu em domo sobre o navio, os códigos enterrados, as luzes da célula do Varga
// crescendo na outra margem, o memorial da Alyx na crista, a cidade subindo no horizonte e virando arquitetura Combine,
// e o véu caindo. Os anos correm no alto; o G-Man fica ao lado, à direita (meio fora do quadro), parado como o Gordon.
// =================================================================================================
import React, { useMemo } from "react";
import { AbsoluteFill, continueRender, delayRender, Easing, interpolate, staticFile, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { MONO } from "./overlays";
import { C } from "./hl3";
import { FilmLook } from "./hl3r";
import { LiteCtx, SfxCtx } from "./sfx-ctx";
import { V, kv, World, Sky, shipW, projector, SX, SZ, Call3 } from "./hl3r9s";
import { calmState } from "./hl3r10";
import { HL9Tower, HL13Leave, SnowGreen, Kin, HL13Board } from "./hl3r9";
import { useRealStrider, useHla } from "./strider3d";
import { Eye } from "./hl3rf";
import { drawGL } from "./xgl";
import { Hud } from "./hl3rf";
import { FlagBadge, fadeIO } from "./hl3rx";
import { buildCraterField, updateCraterField, pruneWorldChunks, CraterField, xenPos, XENF } from "./hl3r26";

const RED = "#ff5d4d";
const AMB = "#ffb22e";
const ICE = "#9fe6ff";
const GREEN = "#8dffa8";
const ORANGE = "#ff9a3c";
const CREAM = "#ffe2b0";
const P = (f: number, at: number, d = 12) => interpolate(f, [at, at + d], [0, 1], { ...C, easing: Easing.out(Easing.cubic) });
type PR = Record<string, number> & { life: number };
const at = (p: PR, k: string) => Math.round((p[k] as number | undefined) ?? 1e6);
const rnd = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

export const HL13Future3D: React.FC<PR & { events?: { k: string; c: string }[]; y0?: number; y1?: number }> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const lite = React.useContext(LiteCtx);
  const ctx = React.useContext(SfxCtx);
  const E = Array.from({ length: 12 }).map((_, k) => at(p, `e${k}At`));
  const runAt = at(p, "runAt");
  const evs = (p.events as unknown as { k: string; c: string }[]) ?? [];
  const y0 = (p.y0 as number | undefined) ?? 2032;
  const y1 = (p.y1 as number | undefined) ?? 2190;
  const year = Math.round(interpolate(f, [runAt, life - 20], [y0, y1], C));
  const veil = P(f, E[1], 30) * (1 - P(f, E[11] + 10, 20));
  const grow = interpolate(f, [E[3], E[9]], [0.1, 0.7], C) + 0.3 * P(f, E[9], 120);
  const comb = P(f, E[9], 90);
  const cult = interpolate(f, [E[4], E[6], E[10] + 60], [0, 0.45, 1], C);
  const ev = E.reduce((acc, t, k) => (f >= t ? k : acc), -1);
  // a câmera: da crista, olhando o navio e o horizonte; um travelling muito lento ao longo de tudo
  const cam = { pos: kv(f, [[0, [-70, 12, -30]], [life, [-58, 14, -40]]]), tgt: kv(f, [[0, [SX + 10, 6, SZ - 30]], [life, [SX + 30, 10, SZ - 60]]]), fov: 50 };
  const st = calmState(f, lite, cam);
  // 12/10 (ele: o véu do Eli tem que esconder o Borealis): sob o véu o navio fica quase invisível; volta quando o véu cai
  st.ship.op = 1 - 0.88 * veil;
  const OBJ = useMemo(() => {
    const grp = new THREE.Group();
    // o véu: um domo de energia sobre o navio, com a malha de latitude/longitude
    const c = new THREE.Vector3(...shipW([0, -2, 0]));
    const veilM = new THREE.MeshBasicMaterial({ color: "#7fe8ff", transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
    const dome = new THREE.Mesh(new THREE.SphereGeometry(82, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), veilM);
    dome.position.copy(c);
    dome.scale.set(1, 0.55, 0.42);
    const gridM = new THREE.MeshBasicMaterial({ color: "#bff4ff", wireframe: true, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
    const grid = new THREE.Mesh(new THREE.SphereGeometry(82.4, 36, 12, 0, Math.PI * 2, 0, Math.PI / 2), gridM);
    grid.position.copy(c);
    grid.scale.copy(dome.scale);
    grp.add(dome, grid);
    // os códigos enterrados: um marco aceso no gelo, perto da crista, que a neve cobre
    const codeM = new THREE.MeshBasicMaterial({ color: "#9fe6ff", transparent: true, opacity: 0, fog: false });
    const code = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.5, 1.2), codeM);
    code.position.set(-40, 0.25, -60);
    const codeL = new THREE.PointLight("#9fe6ff", 0, 20, 1.6);
    codeL.position.set(-40, 2, -60);
    grp.add(code, codeL);
    // o memorial da Alyx na crista: pedestal em degraus, obelisco escuro e a placa acesa
    const memo = new THREE.Group();
    const stone = new THREE.MeshStandardMaterial({ color: "#5a6168", roughness: 0.8 });
    [[6, 0.6], [4.4, 0.6]].forEach(([w, h], i) => {
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), stone);
      b.position.y = 0.3 + i * 0.6;
      memo.add(b);
    });
    const ob = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 1.3, 9, 4), stone);
    ob.position.y = 5.7;
    ob.rotation.y = Math.PI / 4;
    memo.add(ob);
    const plaqueM = new THREE.MeshBasicMaterial({ color: "#ffb22e", transparent: true, opacity: 0, fog: false });
    const plaque = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.7), plaqueM);
    plaque.position.set(0, 1.4, 2.25);
    memo.add(plaque);
    memo.position.set(-58, 0, -96);
    memo.visible = false;
    grp.add(memo);
    // a outra margem: as luzes da célula do Varga (lanternas vermelhas, cada vez mais)
    const cultM = new THREE.MeshBasicMaterial({ color: "#ff4a3a", fog: false });
    const cultLights = Array.from({ length: 70 }).map((_, i) => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.9, 6, 4), cultM);
      m.position.set(-260 + rnd(i) * 160, 0.8, -380 - rnd(i + 50) * 160);
      m.visible = false;
      grp.add(m);
      return m;
    });
    // a cidade no horizonte: prédios que sobem; com o tempo viram lâminas Combine com faixas de luz
    const bM = new THREE.MeshStandardMaterial({ color: "#2c3238", roughness: 0.8, fog: false });
    const cM = new THREE.MeshStandardMaterial({ color: "#161b20", roughness: 0.45, metalness: 0.7, fog: false });
    const winM = new THREE.MeshBasicMaterial({ color: "#ffd9a0", fog: false });
    const stripM = new THREE.MeshBasicMaterial({ color: "#5ff3ff", fog: false });
    const city = Array.from({ length: 90 }).map((_, i) => {
      const g = new THREE.Group();
      const w = 14 + rnd(i * 3) * 22, d = 14 + rnd(i * 7) * 18, h = 30 + rnd(i * 11) * 80;
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, 1, d), bM);
      const cb = new THREE.Mesh(new THREE.BoxGeometry(w * 0.6, 1, d * 0.6), cM);
      const win = new THREE.Mesh(new THREE.BoxGeometry(w * 1.01, 0.6, d * 1.01), winM);
      const strip = new THREE.Mesh(new THREE.BoxGeometry(w * 0.62, 1.2, d * 0.62), stripM);
      g.add(b, cb, win, strip);
      // 12/10 (ele: a cidade preta atrás mal distribuída): espalhada pelo horizonte inteiro, longe, em dois grupos (à esquerda e à direita do navio)
      g.position.set((i % 2 ? 1 : -1) * (260 + (Math.floor(i / 2) % 15) * 46 + rnd(i) * 20), 0, -980 - Math.floor(i / 30) * 90 - rnd(i * 2) * 40);
      g.userData = { h, w, d, at: rnd(i * 13) };
      grp.add(g);
      return g;
    });
    return { grp, veilM, gridM, codeM, codeL, memo, plaqueM, cultLights, city };
  }, []);
  const extra = (root: THREE.Group) => {
    if (OBJ.grp.parent !== root) root.add(OBJ.grp);
    const drop = f >= E[11] && f < E[11] + 30 ? (Math.floor(f / 2) % 2 ? 1.6 : 0.2) : 1;
    OBJ.veilM.opacity = veil * (0.14 + 0.04 * Math.sin(f / 7)) * drop;
    OBJ.gridM.opacity = veil * 0.16 * drop;
    const cd = P(f, E[2], 20) * (1 - P(f, E[2] + 90, 60));
    OBJ.codeM.opacity = cd;
    OBJ.codeL.intensity = cd * 300;
    OBJ.memo.visible = f >= E[8] - 10;
    OBJ.memo.scale.setScalar(P(f, E[8] - 10, 20) || 0.001);
    OBJ.plaqueM.opacity = P(f, E[8] + 10, 20);
    OBJ.cultLights.forEach((m, i) => (m.visible = i / OBJ.cultLights.length < cult));
    // 12/10 (ele: a cidade atrás do navio não fazia sentido no meio do Ártico): a cidade não aparece nesta cena
    OBJ.city.forEach((g) => (g.visible = false));
    if (false) OBJ.city.forEach((g) => {
      const u = g.userData as { h: number; w: number; d: number; at: number };
      const k = Math.max(0, Math.min(1, (grow - u.at * 0.6) / 0.4));
      g.visible = k > 0.01;
      const [b, cb, win, strip] = g.children as THREE.Mesh[];
      const H = u.h * k;
      b.scale.y = Math.max(0.01, H * (1 - comb));
      b.position.y = (H * (1 - comb)) / 2;
      win.visible = comb < 0.6 && k > 0.4;
      win.position.y = H * 0.6 * (1 - comb);
      const HC = u.h * 1.8 * k * comb;
      cb.scale.y = Math.max(0.01, HC);
      cb.position.y = HC / 2;
      strip.visible = comb > 0.3;
      strip.position.y = HC * 0.75;
    });
  };
  const pr = projector(cam);
  const hz = pr([cam.pos[0], 0, cam.pos[2] - 3000]);
  const yaw = Math.atan2(cam.tgt[0] - cam.pos[0], -(cam.tgt[2] - cam.pos[2]));
  // o "dia passando" do time-lapse: a luz pulsando a cada ~3 s
  const day = 0.5 + 0.5 * Math.sin((f / 90) * Math.PI * 2);
  const card = (x: number, img: string, n: string, gone: number) => (
    <div key={n} style={{ position: "absolute", left: x, top: 110, width: 110, opacity: 1 - 0.7 * gone, fontFamily: MONO }}>
      <div style={{ width: 110, height: 120, borderRadius: 6, border: `2px solid ${gone > 0.5 ? "#6d747c" : AMB}`, backgroundImage: `url(${staticFile(img)})`, backgroundSize: "cover", backgroundPosition: "50% 25%", filter: `grayscale(${gone}) brightness(${1 - 0.3 * gone})` }} />
      <div style={{ textAlign: "center", fontSize: 13, letterSpacing: 2, color: gone > 0.5 ? "#9aa3ab" : AMB, marginTop: 4 }}>{n}</div>
    </div>
  );
  const gH = 880;
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#02060c" }}>
      <Sky hy={hz ? hz.y : 540} shift={yaw * 700} f={f} />
      {ctx.mode === "collect" ? null : (
        <AbsoluteFill style={{ filter: `brightness(${0.86 + 0.14 * day})` }}>
          <ThreeCanvas frameloop="demand" width={1920} height={1080} style={{ position: "absolute", inset: 0 }} dpr={lite ? 0.75 : 1} shadows gl={{ antialias: true, alpha: true }} camera={{ fov: 50, position: [0, 3, 0], near: 0.3, far: 4000 }}>
            <World st={st} extra={extra} />
          </ThreeCanvas>
        </AbsoluteFill>
      )}
      {/* o G-Man ao lado, parado, meio fora do quadro, contra a luz do gelo */}
      <div style={{ position: "absolute", right: -60, bottom: -40, width: gH * 0.37, height: gH, opacity: P(f, 0, 12), filter: "drop-shadow(0 0 3px rgba(190,220,240,0.55)) drop-shadow(0 0 16px rgba(150,200,230,0.25))" }}>
        <div style={{ position: "absolute", inset: 0, WebkitMaskImage: `url(${staticFile("hl3silh/gman_silh.png")})`, maskImage: `url(${staticFile("hl3silh/gman_silh.png")})`, WebkitMaskSize: "100% 100%", maskSize: "100% 100%", background: "linear-gradient(90deg, #0a0d10 70%, #2a3540)" }} />
      </div>
      {/* os anos */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 30, textAlign: "center", fontFamily: MONO }}>
        <div style={{ fontSize: 15, letterSpacing: 6, color: "rgba(242,240,247,0.65)" }}>O TEMPO CORRE · GORDON PARADO NO MESMO LUGAR</div>
        <div style={{ fontSize: 64, letterSpacing: 8, color: "#f2f0f7", marginTop: 4, textShadow: "0 0 18px rgba(0,0,0,0.8)" }}>{year}</div>
      </div>
      {/* quem fez as promessas, envelhecendo */}
      {card(60, "hl3silh/eli_retrato.png", "ELI", P(f, E[7], 60))}
      {card(185, "hl3silh/barney_badge.jpg", "BARNEY", P(f, E[7] + 30, 60))}
      {f >= E[4] - 10 ? card(310, "hl3silh/varga_retrato.png", "VARGA", P(f, E[6], 40)) : null}
      {/* o acontecimento da vez */}
      {ev >= 0 && evs[ev] ? (
        <div key={ev} style={{ position: "absolute", left: 60, bottom: 90, padding: "12px 20px", background: "rgba(6,10,14,0.86)", borderLeft: `5px solid ${evs[ev].c}`, fontFamily: MONO, fontSize: 24, letterSpacing: 3, color: evs[ev].c, opacity: P(f, E[ev], 8) }}>
          {evs[ev].k}
        </div>
      ) : null}
      {/* as máscaras: os soldados de agora, de máscara */}
      {f >= E[10] ? (
        <div style={{ position: "absolute", left: 60, bottom: 160, display: "flex", gap: 10, opacity: P(f, E[10], 12) * (1 - P(f, E[11] - 10, 10)) }}>
          {Array.from({ length: 6 }).map((_, i) => <div key={i} style={{ width: 70, height: 80, borderRadius: 4, border: `1.5px solid ${RED}`, backgroundImage: `url(${staticFile("hl3silh/combine_badge.jpg")})`, backgroundSize: "cover", backgroundPosition: "50% 25%", filter: "saturate(0.6)" }} />)}
        </div>
      ) : null}
      {/* o véu caindo */}
      {f >= E[11] && f < E[11] + 30 ? <AbsoluteFill style={{ background: `rgba(159,230,255,${0.25 * (1 - (f - E[11]) / 30)})`, pointerEvents: "none" }} /> : null}
      {f >= E[11] + 20 ? <div style={{ position: "absolute", left: 0, right: 0, top: 150, textAlign: "center", fontFamily: MONO, fontSize: 22, letterSpacing: 6, color: ICE, opacity: P(f, E[11] + 20, 10) }}>O BOREALIS VOLTA</div> : null}
      <AbsoluteFill style={{ background: "#000", opacity: interpolate(f, [0, 8], [1, 0], C) + interpolate(f, [life - 6, life], [0, 1], C), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};
void (null as unknown as V);

// 1:55:37 o desejo: o Borealis 3D no gelo (o mesmo navio do vídeo), câmera baixa recuando devagar; o painel por cima
// 12/10 (pedido dele: o card do HEV com tudo empilhado não ficou bom; o "pra mim, já valeu" ficou horroroso): um objetivo
// de cada vez, como aviso de objetivo do jogo no canto de baixo — a linha desenha, as palavras sobem, a caixa ganha o
// visto e o aviso sai antes do próximo entrar (nunca empilha); a fileira de cinco marcas vai enchendo. "Uma resposta para
// cada pergunta" entra cinza e é riscada; as cinco marcas se juntam no OBJETIVO FINAL: UM FINAL DIGNO. No fim, o HUD
// some e "pra mim, já valeu." entra como título de capítulo do Half-Life, letra por letra com brilho, palavra na fala.
const FONT_W = "'Inter', 'Segoe UI', system-ui, sans-serif";
const WishToast: React.FC<{ f: number; t0: number; t1: number; n: number; main: string; sub?: string; subAt?: number; done?: number; strike?: number }> = ({ f, t0, t1, n, main, sub, subAt, done, strike }) => {
  if (f < t0 || f > t1 + 14) return null;
  const inK = P(f, t0, 14);
  const outK = P(f, t1, 14);
  const line = P(f, t0, 20);
  const ok = done !== undefined ? P(f, done, 10) : 0;
  const st = strike !== undefined ? P(f, strike, 14) : 0;
  const gray = strike !== undefined;
  const col = gray ? "rgba(236,232,224,0.62)" : "#f4efe4";
  const head = gray ? "rgba(236,232,224,0.55)" : ok > 0.5 ? GREEN : AMB;
  const words = main.split(" ");
  return (
    <div style={{ position: "absolute", left: 120, bottom: 150, width: 1100, opacity: inK * (1 - outK), transform: `translateY(${-40 * outK}px)` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, fontFamily: MONO, fontSize: 17, letterSpacing: 5, color: head }}>
        <span>{gray ? "OBJETIVO" : `OBJETIVO ${String(n).padStart(2, "0")} / 05`}</span>
        <span style={{ opacity: ok, color: GREEN }}>{ok > 0 ? "· CONCLUÍDO" : ""}</span>
        <span style={{ opacity: st, color: RED }}>{st > 0 ? "· DESCARTADO" : ""}</span>
      </div>
      <div style={{ height: 2, width: 620 * line, marginTop: 10, background: `linear-gradient(90deg, ${head}, rgba(255,178,46,0))` }} />
      <div style={{ display: "flex", alignItems: "flex-start", gap: 22, marginTop: 18 }}>
        <svg width={48} height={48} style={{ flex: "none", marginTop: 6 }}>
          <rect x={2} y={2} width={44} height={44} rx={6} fill={ok > 0 ? `rgba(141,255,168,${0.18 * ok})` : "rgba(0,0,0,0.35)"} stroke={gray ? "rgba(236,232,224,0.5)" : ok > 0.5 ? GREEN : AMB} strokeWidth={2.5} strokeDasharray={176} strokeDashoffset={176 * (1 - P(f, t0 + 4, 16))} />
          {done !== undefined ? <path d="M 12 25 L 21 34 L 37 15" fill="none" stroke={GREEN} strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={40} strokeDashoffset={40 * (1 - ok)} /> : null}
          {strike !== undefined ? <path d="M 14 14 L 34 34 M 34 14 L 14 34" fill="none" stroke={RED} strokeWidth={4} strokeLinecap="round" strokeDasharray={60} strokeDashoffset={60 * (1 - st)} /> : null}
        </svg>
        <div style={{ position: "relative" }}>
          <div style={{ fontFamily: FONT_W, fontWeight: 800, fontSize: 56, lineHeight: 1.12, letterSpacing: -0.5, color: col, textShadow: "0 4px 24px rgba(0,0,0,0.85)" }}>
            {words.map((w, k) => {
              const kw = P(f, t0 + 6 + k * 2, 12);
              return (
                <span key={k} style={{ display: "inline-block", overflow: "hidden", verticalAlign: "top", padding: "0 30px 30px 30px", margin: "0 -16px -30px -30px" }}>
                  <span style={{ display: "inline-block", transform: `translateY(${(1 - kw) * 100}%)`, opacity: kw }}>{w}</span>
                </span>
              );
            })}
          </div>
          {strike !== undefined ? <div style={{ position: "absolute", left: 0, top: "52%", height: 5, width: `${100 * st}%`, background: RED, borderRadius: 3, boxShadow: "0 0 12px rgba(255,93,77,0.6)" }} /> : null}
          {sub && subAt !== undefined && f >= subAt ? (
            <div style={{ marginTop: 10, fontFamily: MONO, fontSize: 22, letterSpacing: 3, color: CREAM, opacity: P(f, subAt, 12), transform: `translateX(${(1 - P(f, subAt, 12)) * -20}px)`, textShadow: "0 2px 12px #000" }}>{sub}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
const WishHud: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const [askAt, w1At, w2At, w3At, w4At, w5At, noAnsAt, worthyAt, worthAt] = ["askAt", "w1At", "w2At", "w3At", "w4At", "w5At", "noAnsAt", "worthyAt", "worthAt"].map((k) => at(p, k));
  // palavras da fala (s → quadros, a partir das marcas): "Tirando… Half-Life 4" w5+196 · "pergunta" noAns+43 · "pra mim" worth+168
  const hl4At = w5At + 196, perguntaAt = noAnsAt + 43, mimAt = worthAt + 168;
  const W: [number, number, string, string?, number?][] = [
    [w1At, w2At, "Um Borealis que justifique 20 anos de mistério"],
    [w2At, w3At, "Um G-Man que dê pra teorizar", "MAS ESTRANHO DEMAIS PRA SER EXPLICADO", w2At + 120],
    [w3At, w4At, "Combine que sejam mais do que um império do mal"],
    [w4At, w5At, "A Alyx com consequência real", "DEPOIS DO FINAL DE HALF-LIFE: ALYX", w4At + 40],
    [w5At, noAnsAt - 4, "Um jogo que encerre a história de vez", "SEM DEIXAR PORTA PRA UM HALF-LIFE 4", hl4At],
  ];
  const filled = W.filter(([t0]) => f >= t0 + 30).length;
  // as cinco marcas: embaixo, à esquerda; no objetivo final elas correm pro centro e viram um ponto só
  const merge = P(f, worthyAt - 6, 18);
  const hudOut = P(f, mimAt - 40, 24);
  const fin = P(f, worthyAt + 8, 16);
  const title = "PRA MIM, JÁ VALEU.";
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill style={{ background: `linear-gradient(0deg, rgba(2,4,8,${0.72 * (1 - hudOut * 0.5)}) 0%, rgba(2,4,8,0.25) 42%, rgba(0,0,0,0) 60%)` }} />
      <Kin kind="type" t0={askAt} until={w1At} top={140} size={64} col={AMB} text="que Half-Life 3 eu gostaria de jogar?" />
      {/* no objetivo final e no título, o navio desfoca e escurece atrás (como as frases do vídeo) */}
      {(() => {
        const foc = Math.max(P(f, worthyAt, 14) * (1 - P(f, mimAt - 30, 20)) * 0.9, P(f, mimAt - 16, 18));
        return foc > 0 ? <AbsoluteFill style={{ backdropFilter: `blur(${8 * foc}px) brightness(${1 - 0.5 * foc})`, WebkitBackdropFilter: `blur(${8 * foc}px) brightness(${1 - 0.5 * foc})`, background: `radial-gradient(ellipse at 50% 50%, rgba(0,0,0,${0.25 * foc}), rgba(0,0,0,${0.5 * foc}) 85%)` }} /> : null;
      })()}
      <div style={{ opacity: 1 - hudOut }}>
        {W.map(([t0, t1, main, sub, subAt], i) => (
          <WishToast key={i} f={f} t0={t0} t1={t1} n={i + 1} main={main} sub={sub} subAt={subAt} done={t0 + 30} />
        ))}
        <WishToast f={f} t0={noAnsAt} t1={worthyAt - 8} n={0} main="Uma resposta para cada pergunta" strike={perguntaAt} />
        {f >= w1At ? (
          <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, opacity: P(f, w1At, 10) * (1 - P(f, worthyAt + 6, 10)) }}>
            {[0, 1, 2, 3, 4].map((i) => {
              const x0 = 190 + i * 58, y0 = 958;
              const x = x0 + (960 - x0) * merge, y = y0 + (560 - y0) * merge;
              const on = i < filled;
              return <div key={i} style={{ position: "absolute", left: x - 24, top: y - 4, width: 48 * (1 - 0.8 * merge), height: 8, borderRadius: 4, background: on ? GREEN : "rgba(255,255,255,0.18)", boxShadow: on ? "0 0 10px rgba(141,255,168,0.6)" : "none" }} />;
            })}
          </div>
        ) : null}
        {f >= worthyAt ? (
          <div style={{ position: "absolute", left: 0, right: 0, top: 380, display: "flex", flexDirection: "column", alignItems: "center", opacity: fin }}>
            <svg width={300} height={300} style={{ position: "absolute", top: -60, overflow: "visible" }}>
              <circle cx={150} cy={150} r={60 + 110 * fin} fill="none" stroke="#ffd27a" strokeWidth={2} opacity={0.5 * (1 - P(f, worthyAt + 8, 30))} />
              <circle cx={150} cy={150} r={60 + 50 * fin} fill="none" stroke="#ffd27a" strokeWidth={1.5} opacity={0.35} />
            </svg>
            <div style={{ fontFamily: MONO, fontSize: 20, letterSpacing: 10, color: "#ffd27a", textShadow: "0 2px 14px #000" }}>OBJETIVO FINAL</div>
            <div style={{ height: 2, width: 420 * P(f, worthyAt + 12, 18), marginTop: 14, background: "linear-gradient(90deg, rgba(255,210,122,0), #ffd27a, rgba(255,210,122,0))" }} />
            <div style={{ marginTop: 18, fontFamily: FONT_W, fontWeight: 800, fontSize: 92, letterSpacing: -1, color: "#ffe9bf", textShadow: `0 0 ${40 * P(f, worthyAt + 20, 30)}px rgba(255,200,110,0.55), 0 6px 30px rgba(0,0,0,0.9)`, transform: `scale(${0.94 + 0.06 * P(f, worthyAt + 14, 20)})`, opacity: P(f, worthyAt + 14, 14) }}>Um final digno.</div>
          </div>
        ) : null}
      </div>
      {/* o título de capítulo: letra por letra, cada uma acende com brilho e assenta */}
      {f >= mimAt - 6 ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 470, textAlign: "center", fontFamily: FONT_W, fontWeight: 300, fontSize: 64, letterSpacing: 18, color: "#f6ead2" }}>
          {title.split("").map((ch, k) => {
            const t = mimAt - 6 + k * 1.6;
            const a = P(f, t, 10);
            const glow = 1 - P(f, t + 4, 26);
            return <span key={k} style={{ opacity: a, textShadow: `0 0 ${6 + 26 * glow}px rgba(255,214,150,${0.35 + 0.55 * glow}), 0 3px 18px rgba(0,0,0,0.9)` }}>{ch}</span>;
          })}
          <div style={{ margin: "22px auto 0", height: 1.5, width: 520 * P(f, mimAt + 20, 24), background: "linear-gradient(90deg, rgba(255,210,122,0), rgba(255,210,122,0.85), rgba(255,210,122,0))" }} />
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
export const HL15WishS: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const lite = React.useContext(LiteCtx);
  const ctx = React.useContext(SfxCtx);
  const life = p.life;
  const cam = { pos: kv(f, [[0, [-40, 5, -60]], [life, [-66, 10, -44]]]), tgt: kv(f, [[0, [SX - 10, 7, SZ]], [life, [SX - 4, 10, SZ - 10]]]), fov: 44 };
  const st = calmState(f, lite, cam);
  const pr = projector(cam);
  const hz = pr([cam.pos[0], 0, cam.pos[2] - 3000]);
  const yaw = Math.atan2(cam.tgt[0] - cam.pos[0], -(cam.tgt[2] - cam.pos[2]));
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#02060c" }}>
      <Sky hy={hz ? hz.y : 540} shift={yaw * 700} f={f} />
      {ctx.mode === "collect" ? null : (
        <ThreeCanvas frameloop="demand" width={1920} height={1080} style={{ position: "absolute", inset: 0 }} dpr={lite ? 0.75 : 1} shadows gl={{ antialias: true, alpha: true }} camera={{ fov: 44, position: [0, 3, 0], near: 0.3, far: 4000 }}>
          <World st={st} />
        </ThreeCanvas>
      )}
      <WishHud {...p} />
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ================================================================================================= 1:03:58 a torre (3D)
// 12/10 (pedido dele: a cena da torre mal trabalhada; Strider em 3D): o posto avançado no mesmo gelo do Borealis. A torre
// Combine detalhada (base sextavada com contrafortes, três níveis blindados com faixas acesas, sacadas com torretas, a
// plataforma do topo com parapeito, o mastro e o farol vermelho); o Strider 3D (strider3d.ts) chega andando e guarda a
// entrada; do topo ele está na altura dos olhos e cai no fim; a coluna presa no gelo lá embaixo. A parte de dentro
// (o corte) continua a mesma.
const TOWER_Z = -300;
const buildTower3D = () => {
  const g = new THREE.Group();
  const dark = new THREE.MeshStandardMaterial({ color: "#1f252c", roughness: 0.45, metalness: 0.8 });
  const plate = new THREE.MeshStandardMaterial({ color: "#2c343c", roughness: 0.5, metalness: 0.7 });
  const strip = new THREE.MeshBasicMaterial({ color: "#5ff3ff", fog: false });
  const red = new THREE.MeshBasicMaterial({ color: "#ff4a3a", fog: false });
  const hex = (r0: number, r1: number, h: number, y: number, m: THREE.Material) => {
    const o = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, h, 6), m);
    o.position.y = y + h / 2;
    o.rotation.y = Math.PI / 6;
    g.add(o);
    return o;
  };
  // base e contrafortes
  hex(11, 9, 3, 0, dark);
  hex(8.5, 8, 6, 3, plate);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const b = new THREE.Mesh(new THREE.BoxGeometry(1.4, 9, 4), dark);
    b.position.set(Math.cos(a) * 9, 4.5, Math.sin(a) * 9);
    b.rotation.y = -a;
    b.rotation.z = 0.25;
    g.add(b);
  }
  // os três níveis blindados com as faixas acesas e as sacadas
  [[9, 7, 6.2, 5.2], [15, 6, 5.4, 4.6], [21, 4, 4.8, 4.2]].forEach(([y, h, r0, r1]) => {
    hex(r0, r1, h, y, plate);
    hex(r0 + 0.15, r0 + 0.15, 0.5, y + 0.4, strip);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
      const p = new THREE.Mesh(new THREE.BoxGeometry(0.25, h * 0.7, r1 * 0.8), dark);
      p.position.set(Math.cos(a) * (r1 + 0.1), y + h * 0.5, Math.sin(a) * (r1 + 0.1));
      p.rotation.y = -a;
      g.add(p);
    }
  });
  // a plataforma do topo e o parapeito
  hex(6.5, 6.5, 0.6, 25, dark);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const w = new THREE.Mesh(new THREE.BoxGeometry(6.6, 1.0, 0.25), plate);
    w.position.set(Math.cos(a + Math.PI / 6) * 5.6, 26.1, Math.sin(a + Math.PI / 6) * 5.6);
    w.rotation.y = -a - Math.PI / 6 + Math.PI / 2;
    g.add(w);
  }
  // o mastro, as antenas e o farol
  hex(1.2, 0.6, 9, 25.6, dark);
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.7, 12, 8), red);
  beacon.position.y = 35;
  g.add(beacon);
  for (const s of [-1, 1]) {
    const an = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 6, 5), dark);
    an.position.set(s * 1.6, 29, 0);
    an.rotation.z = s * 0.2;
    g.add(an);
  }
  // torretas nas sacadas (canos para fora)
  [[0.2, 12], [2.3, 18], [4.4, 12], [3.4, 23]].forEach(([a, y]) => {
    const t = new THREE.Group();
    t.position.set(Math.cos(a) * 6.4, y, Math.sin(a) * 6.4);
    t.rotation.y = -a;
    const bx = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.1, 1.4), plate);
    const gn = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.2, 6), dark);
    gn.rotation.z = Math.PI / 2;
    gn.position.x = 1.4;
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), red);
    eye.position.set(0.72, 0.2, 0);
    t.add(bx, gn, eye);
    g.add(t);
  });
  const L = new THREE.PointLight("#5ff3ff", 900, 60, 1.6);
  L.position.set(0, 14, 10);
  g.add(L);
  const R = new THREE.PointLight("#ff4a3a", 120, 30, 1.8);
  R.position.set(0, 36, 0);
  g.add(R);
  g.position.set(0, 0, TOWER_Z);
  return { g, beacon };
};
// 13/10 (pedido dele: os veículos da coluna pareciam slimes do Minecraft): caminhões da resistência de verdade — chassi,
// cabine com para-brisa e capô, para-choque, seis rodas, carroceria com lona arqueada, faróis acesos, sulcos na neve
const buildColumn = () => {
  const g = new THREE.Group();
  const paints = ["#6a5a3c", "#4a5644", "#7a4a2c", "#5a5e60"].map((col) => new THREE.MeshStandardMaterial({ color: col, roughness: 0.75, metalness: 0.35 }));
  const dark = new THREE.MeshStandardMaterial({ color: "#1c1e20", roughness: 0.9 });
  const steel = new THREE.MeshStandardMaterial({ color: "#7a7e80", roughness: 0.45, metalness: 0.8 });
  const glass = new THREE.MeshStandardMaterial({ color: "#20303a", roughness: 0.15, metalness: 0.6 });
  const tarp = new THREE.MeshStandardMaterial({ color: "#8a8460", roughness: 1, side: THREE.DoubleSide });
  const lamp = new THREE.MeshBasicMaterial({ color: "#fff0c0", fog: false });
  const track = new THREE.MeshBasicMaterial({ color: "#aab8c0", transparent: true, opacity: 0.5 });
  const box = (w: number, h: number, d: number, m: THREE.Material, x: number, y: number, z: number) => {
    const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    o.position.set(x, y, z);
    return o;
  };
  [[-3, -232], [2, -240], [-1.5, -248], [3, -256]].forEach(([x, z], i) => {
    const t = new THREE.Group();
    const pm = paints[i % paints.length];
    t.add(box(2.3, 0.35, 7.2, dark, 0, 0.75, 0)); // chassi
    t.add(box(2.4, 1.3, 2.0, pm, 0, 1.6, -2.5)); // cabine
    t.add(box(2.42, 0.62, 0.06, glass, 0, 2.0, -3.52)); // para-brisa
    for (const s of [-1, 1]) t.add(box(0.06, 0.55, 1.2, glass, s * 1.21, 2.0, -2.45)); // janelas
    t.add(box(2.2, 0.8, 1.3, pm, 0, 1.25, -4.1)); // capô
    t.add(box(2.5, 0.28, 0.25, steel, 0, 0.8, -4.8)); // para-choque
    t.add(box(1.4, 0.5, 0.05, dark, 0, 1.25, -4.77)); // grade
    t.add(box(2.4, 0.9, 4.6, pm, 0, 1.4, 0.9)); // carroceria
    // a lona arqueada
    const arc = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 4.4, 16, 1, true, -Math.PI / 2, Math.PI), tarp);
    arc.rotation.x = Math.PI / 2;
    arc.rotation.z = Math.PI / 2;
    arc.position.set(0, 1.85, 0.9);
    t.add(arc);
    // rodas
    for (const zz of [-3.6, 1.0, 2.6])
      for (const s of [-1, 1]) {
        const w = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.4, 16), dark);
        w.rotation.z = Math.PI / 2;
        w.position.set(s * 1.12, 0.55, zz);
        t.add(w);
        const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.42, 10), steel);
        hub.rotation.z = Math.PI / 2;
        hub.position.set(s * 1.13, 0.55, zz);
        t.add(hub);
      }
    for (const s of [-0.8, 0.8]) {
      const l = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), lamp);
      l.position.set(s, 1.3, -4.78);
      t.add(l);
    }
    t.add(box(1.6, 0.12, 0.25, lamp, 0, 2.3, -2.6)); // barra de luz no teto
    // sulcos dos pneus na neve, para trás
    for (const s of [-1.12, 1.12]) t.add(box(0.45, 0.01, 14, track, s, 0.02, 9));
    t.position.set(x, 0, z);
    g.add(t);
  });
  return g;
};
export const HL9Tower3D: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const lite = React.useContext(LiteCtx);
  const ctx = React.useContext(SfxCtx);
  const [towerAt, roadAt, strAt, troopAt, enterAt, climbAt, defAt, dogAt, gravAt, topAt, waitAt, fallAt, groupAt] = ["towerAt", "roadAt", "strAt", "troopAt", "enterAt", "climbAt", "defAt", "dogAt", "gravAt", "topAt", "waitAt", "fallAt", "groupAt"].map((k) => at(p, k));
  const foot = f >= enterAt && f < topAt;
  const top = f >= topAt;
  const OBJ = useMemo(() => {
    const T = buildTower3D();
    const col = buildColumn();
    const grp = new THREE.Group();
    grp.add(T.g, col);
    return { grp, T, col };
  }, []);
  // 12/10: o Strider do jogo (Half-Life: Alyx), com as animações dele
  const RS = useRealStrider(22);
  // câmeras: chegando pela estrada de gelo · no topo da torre olhando para trás (a coluna e o Strider)
  const cam = top
    ? { pos: [1.5, 28.4, TOWER_Z + 5.8] as V, tgt: kv(f, [[topAt, [-10, 24, TOWER_Z + 40]], [waitAt, [-10, 22, TOWER_Z + 40]], [waitAt + 30, [-2, 4, -245]], [fallAt, [-2, 4, -245]], [fallAt + 30, [-10, 8, TOWER_Z + 30]]]), fov: 52 }
    : { pos: kv(f, [[0, [0, 1.7, -200]], [enterAt, [0, 1.7, -250]]]), tgt: kv(f, [[0, [0, 24, TOWER_Z]], [roadAt, [0, 10, TOWER_Z]], [strAt, [-14, 15, TOWER_Z + 20]], [troopAt, [-6, 14, TOWER_Z]], [enterAt, [0, 8, TOWER_Z]]]), fov: 50 };
  const st = calmState(f, lite, cam);
  st.ship.on = false;
  st.ridge = false;
  const fall = P(f, fallAt, 40);
  const extra = (root: THREE.Group) => {
    if (OBJ.grp.parent !== root) root.add(OBJ.grp);
    // o Strider: chega andando até a entrada; no topo, de frente, na altura dos olhos; cai
    const walkIn = P(f, strAt - 40, 120);
    OBJ.col.visible = top;
    (OBJ.T.beacon.material as THREE.MeshBasicMaterial).color.set(Math.floor(f / 15) % 2 ? "#ff4a3a" : "#7a1a14");
    // 13/10 (pedido dele: o Strider na frente da pedra de gelo, surgindo do nada): dentro do mesmo mundo 3D (a pedra o
    // tapa de verdade) e entrando andando de fora do quadro, pela esquerda, ao longe
    if (RS) {
      if (RS.root.parent !== root) root.add(RS.root);
      const fall2 = f >= fallAt;
      if (!top) {
        const w = P(f, strAt - 90, 110);
        RS.root.position.set(-150 + 120 * w, 0, TOWER_Z + 4 - 40 * (1 - w));
        RS.root.rotation.y = Math.PI / 2 - 0.6 * w;
        RS.root.visible = true;
        // 13/10 (pedido dele: o Strider tem que estar atirando): chegando, ele dispara o canhão na estrada
        if (w < 1) RS.set("walk", (f - strAt + 90) / 30);
        else RS.set("fire", ((f - strAt) / 30) % 3.8);
      } else {
        RS.root.position.set(-18, 0, TOWER_Z + 46);
        RS.root.rotation.y = -Math.PI * 0.15;
        RS.root.visible = true;
        if (!fall2) RS.set("idle", (f - topAt) / 30);
        else RS.set("death", (f - fallAt) / 30);
      }
      RS.root.updateMatrixWorld(true);
    }
  };
  const pr = projector(cam);
  const hz = pr([cam.pos[0], 0, cam.pos[2] - 3000]);
  const yaw = Math.atan2(cam.tgt[0] - cam.pos[0], -(cam.tgt[2] - cam.pos[2]));
  const eye = { x: cam.pos[0], y: -cam.pos[2], z: cam.pos[1], yaw, pitch: 0, F: 1000 };
  // o Strider do jogo numa camada própria, com a mesma câmera (o mundo do gelo não o desenhava)
  const sRef = React.useRef<HTMLCanvasElement>(null);
  const walkIn2 = P(f, strAt - 40, 120);
  React.useLayoutEffect(() => {
    if (!sRef.current || !RS || sRef.current) return;
    const fall2 = f >= fallAt;
    if (!top) {
      RS.root.position.set(-60 + 30 * walkIn2, 0, TOWER_Z + 4);
      RS.root.rotation.y = Math.PI / 2 - 0.6 * walkIn2;
      RS.root.visible = f >= strAt - 40;
      if (walkIn2 < 1) RS.set("walk", (f - strAt + 40) / 30);
      else RS.set("idle", (f - strAt) / 30);
    } else {
      RS.root.position.set(-18, 0, TOWER_Z + 46);
      RS.root.rotation.y = -Math.PI * 0.15;
      RS.root.visible = true;
      if (!fall2) RS.set("idle", (f - topAt) / 30);
      else RS.set("death", (f - fallAt) / 30);
    }
    RS.root.updateMatrixWorld(true);
    const dx = cam.tgt[0] - cam.pos[0], dy = cam.tgt[1] - cam.pos[1], dz = cam.tgt[2] - cam.pos[2];
    const ey: Eye = { x: cam.pos[0], y: -cam.pos[2], z: cam.pos[1], yaw: Math.atan2(dx, -dz), pitch: Math.atan2(dy, Math.hypot(dx, dz)), F: 540 / Math.tan((cam.fov * Math.PI) / 360) };
    // as coordenadas do mundo do gelo já são three (x, y=cima, z) → no motor: (x, −z, y)
    const holder = new THREE.Group();
    holder.add(RS.root);
    const moon = new THREE.DirectionalLight("#cfe0ff", 2.4);
    moon.position.set(-140, 120, 60);
    // luz de frente (do lado da câmera) e o reflexo azulado do gelo por baixo
    const key = new THREE.DirectionalLight("#e8eef8", 3.2);
    key.position.set(cam.pos[0] + 40, cam.pos[1] + 60, cam.pos[2] + 40);
    key.target.position.copy(RS.root.position);
    key.target.updateMatrixWorld();
    drawGL(sRef.current, ey, [], null, [holder], [new THREE.HemisphereLight("#c8d8e8", "#6a88a0", 2.6), moon, key]);
    holder.remove(RS.root);
  });
  const flash = f >= fallAt && f < fallAt + 12 ? 1 - (f - fallAt) / 12 : 0;
  const objs: [number, string][] = [
    [climbAt, "SUBIR A ESTRUTURA POR DENTRO"],
    [defAt, "DESLIGAR AS DEFESAS · SETOR POR SETOR"],
    [dogAt, "ABRIR CAMINHO PARA O DOG"],
    [gravAt, "GRAVITY GUN · O EQUIPAMENTO VIRA ARMA"],
    [topAt, "NO TOPO · DERRUBAR O STRIDER"],
  ];
  if (foot) return <HL9Tower {...p} />;
  const vq = pr([0, 3, -248]);
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#02060c" }}>
      <Sky hy={hz ? hz.y : 540} shift={yaw * 700} f={f} />
      {ctx.mode === "collect" || !RS ? null : (
        <ThreeCanvas frameloop="demand" width={1920} height={1080} style={{ position: "absolute", inset: 0 }} dpr={lite ? 0.75 : 1} shadows gl={{ antialias: true, alpha: true }} camera={{ fov: 50, position: [0, 3, 0], near: 0.3, far: 4000 }}>
          <World st={st} extra={extra} />
        </ThreeCanvas>
      )}
      {/* os tiros do canhão do Strider: traçantes azuis do corpo dele até a estrada, com o gelo explodindo onde batem */}
      {!top && RS && f >= strAt - 90 + 110 ? (() => {
        const sx = -150 + 120, sz = TOWER_Z + 4;
        const m = pr([sx + 1.5, 11, sz + 2]);
        if (!m) return null;
        const out: React.ReactNode[] = [];
        for (let k = 0; k < 3; k++) {
          const ph = (f + k * 5) % 15;
          if (ph > 5) continue;
          const tx = -14 + 18 * rnd(Math.floor((f + k * 5) / 15) * 7 + k), tz = TOWER_Z + 28 + 26 * rnd(Math.floor((f + k * 5) / 15) * 11 + k);
          const g = pr([tx, 0, tz]);
          if (!g) continue;
          const t = ph / 5;
          out.push(<line key={"t" + k} x1={m.x + (g.x - m.x) * t * 0.7} y1={m.y + (g.y - m.y) * t * 0.7} x2={m.x + (g.x - m.x) * Math.min(1, t * 0.7 + 0.35)} y2={m.y + (g.y - m.y) * Math.min(1, t * 0.7 + 0.35)} stroke="#cfefff" strokeWidth={3} style={{ filter: "drop-shadow(0 0 8px #6fd8ff)" }} />);
          if (ph >= 4) out.push(<ellipse key={"p" + k} cx={g.x} cy={g.y} rx={46} ry={22} fill="rgba(230,245,255,0.75)" style={{ filter: "blur(6px)" }} />);
        }
        if ((f % 15) < 3) out.push(<circle key="mz" cx={m.x} cy={m.y} r={18} fill="rgba(200,240,255,0.9)" style={{ filter: "blur(4px)" }} />);
        return <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>{out}</svg>;
      })() : null}

      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {!top ? <Call3 pr={pr} f={f} pt={[0, 30, TOWER_Z]} from={towerAt + 20} until={strAt} text="POSTO AVANÇADO · TORRE COMBINE" sub="PROTEGE A INSTALAÇÃO" col={RED} dx={240} dy={-80} /> : null}
        {!top ? <Call3 pr={pr} f={f} pt={[-30, 12, TOWER_Z + 4]} from={strAt + 30} until={troopAt} text="STRIDER" sub="GUARDA A ENTRADA" col={RED} dx={-260} dy={-90} /> : null}
        {!top ? <Call3 pr={pr} f={f} pt={[0, 15, TOWER_Z]} from={troopAt} until={enterAt} text="TROPAS NOS NÍVEIS" sub="TORRETAS NAS SACADAS" col={RED} dx={240} dy={-60} /> : null}
        {top ? <Call3 pr={pr} f={f} pt={[-18, 20, TOWER_Z + 46]} from={topAt + 20} until={waitAt + 10} text="O STRIDER" sub="NA ALTURA DOS OLHOS" col={RED} dx={-240} dy={-120} /> : null}
        {top ? <Call3 pr={pr} f={f} pt={[0, 3, -244]} from={waitAt + 30} until={groupAt} text="A COLUNA" sub="PRESA NO GELO, ESPERANDO" col={AMB} dx={240} dy={-120} /> : null}
        {top && f >= groupAt && vq ? (
          <g opacity={P(f, groupAt, 10)}>
            <line x1={vq.x} y1={vq.y} x2={vq.x} y2={vq.y - 70} stroke={AMB} strokeWidth={2} />
            <FlagBadge cx={vq.x} by={vq.y - 70} k={0.9} label="VARGA" col={AMB} f={f} sub="TRAZ O RESTANTE" />
          </g>
        ) : null}
      </svg>
      {!top && f >= roadAt && f < strAt + 10 ? <div style={{ position: "absolute", left: 0, right: 0, top: 150, textAlign: "center", fontFamily: MONO, fontSize: 20, letterSpacing: 6, color: CREAM, opacity: P(f, roadAt, 8) * (1 - P(f, strAt, 8)) }}>A ESTRADA DE GELO TERMINA AQUI</div> : null}
      {f >= climbAt ? (
        <div style={{ position: "absolute", left: 90, top: 110, width: 600, padding: "16px 20px", borderRadius: 12, background: "rgba(14,10,4,0.82)", border: `1.5px solid ${AMB}`, fontFamily: MONO }}>
          <div style={{ fontSize: 15, letterSpacing: 5, color: AMB }}>H.E.V. · OBJETIVOS · POSTO AVANÇADO</div>
          {objs.filter(([t0]) => f >= t0).map(([t0, tx], i, arr) => {
            const done = i < arr.length - 1 || f >= fallAt;
            return (
              <div key={tx} style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10, fontSize: 19, letterSpacing: 2, color: done ? "rgba(242,240,247,0.55)" : "#f2f0f7", opacity: P(f, t0, 8) }}>
                <span style={{ width: 22, height: 22, borderRadius: 4, border: `2px solid ${done ? GREEN : AMB}`, display: "inline-flex", alignItems: "center", justifyContent: "center", color: GREEN, fontSize: 16 }}>{done ? "✓" : ""}</span>
                {tx}
              </div>
            );
          })}
        </div>
      ) : null}
      {flash > 0 ? <AbsoluteFill style={{ background: `rgba(255,240,220,${flash * 0.85})` }} /> : null}
      <Hud f={f} yaw={eye.yaw} eye={eye} blips={[]} msg={top && f >= fallAt ? "O POSTO CAIU" : top ? "O TOPO DA TORRE" : undefined} msgCol={top && f >= fallAt ? GREEN : RED} />
      <AbsoluteFill style={{ background: "#000", opacity: interpolate(f, [0, 8], [1, 0], C) + interpolate(f, [life - 6, life], [0, 1], C) + (Math.abs(f - topAt) < 4 ? 0.9 : 0), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ================================================================================================= 1:43:17 a Terra para trás (3D)
// 12/10 v2 (ele: a versão em órbita ficou mal feita — naves de brinquedo, anel chapado): no mesmo sítio do Borealis no
// gelo (aprovado), à noite. A cidade nova (humanos + Combine) acesa no horizonte; no céu abre o portal do catalisador, um
// redemoinho de luz como os portais Combine; as naves são rastros de luz subindo da cidade em fila até o portal (vistas de
// longe, sem modelo); por fim o próprio Borealis entra em fase — brilha, pisca e some, levado junto.
export const HL13Leave3D: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const lite = React.useContext(LiteCtx);
  const ctx = React.useContext(SfxCtx);
  const [leaveAt, workAt, reachAt, cutAt] = ["leaveAt", "workAt", "reachAt", "cutAt"].map((k) => at(p, k));
  const cam = { pos: kv(f, [[0, [-48, 9, -20]], [cutAt, [-40, 11, -34]]]), tgt: kv(f, [[0, [SX - 10, 30, SZ - 120]], [cutAt, [SX - 6, 44, SZ - 140]]]), fov: 54 };
  const st = calmState(f, lite, cam);
  st.ridge = false;
  const open = P(f, 0, 70);
  const goneK = P(f, reachAt + 10, 50);
  st.ship.glow = 0.7 * goneK;
  st.ship.op = goneK > 0 ? (1 - goneK) * (rnd(Math.floor(f / 2)) > 0.35 ? 1 : 0.3) : 1;
  const PORTAL = useMemo(() => new THREE.Vector3(SX - 10, 150, SZ - 300), []);
  const OBJ = useMemo(() => {
    const grp = new THREE.Group();
    const portal = new THREE.Group();
    portal.position.copy(PORTAL);
    portal.lookAt(new THREE.Vector3(-48, 9, -20));
    const spec: [number, number, string][] = [[70, 0.07, "#9fe6ff"], [52, 0.12, "#c7f0ff"], [36, 0.2, "#e8f8ff"], [20, 0.35, "#ffffff"]];
    const layers = spec.map(([r, o, col], i) => {
      const m = new THREE.Mesh(new THREE.RingGeometry(r * 0.25, r, 96, 1), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: o, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
      m.userData.dir = i % 2 ? -1 : 1;
      portal.add(m);
      return m;
    });
    const arms = new THREE.Group();
    for (let k = 0; k < 6; k++) {
      const pts: THREE.Vector3[] = [];
      for (let s = 0; s < 60; s++) {
        const t = s / 59, a = k * (Math.PI / 3) + t * 4.2, r = 12 + t * 62;
        pts.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0));
      }
      arms.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: "#bfefff", transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, fog: false })));
    }
    portal.add(arms);
    const core = new THREE.Mesh(new THREE.CircleGeometry(10, 48), new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.9, fog: false }));
    portal.add(core);
    // o halo suave em volta do portal
    const hc = document.createElement("canvas");
    hc.width = hc.height = 256;
    const hx = hc.getContext("2d")!;
    const hg = hx.createRadialGradient(128, 128, 10, 128, 128, 128);
    hg.addColorStop(0, "rgba(220,245,255,0.9)");
    hg.addColorStop(0.4, "rgba(160,225,255,0.25)");
    hg.addColorStop(1, "rgba(160,225,255,0)");
    hx.fillStyle = hg;
    hx.fillRect(0, 0, 256, 256);
    const halo = new THREE.Mesh(new THREE.PlaneGeometry(260, 260), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(hc), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    halo.position.z = -1;
    portal.add(halo);
    grp.add(portal);
    const bM = new THREE.MeshStandardMaterial({ color: "#151a20", roughness: 0.6, metalness: 0.6, fog: false });
    const win = new THREE.MeshBasicMaterial({ color: "#ffd9a0", fog: false });
    const cy = new THREE.MeshBasicMaterial({ color: "#5ff3ff", fog: false });
    if (false)
    for (let i = 0; i < 70; i++) {
      const x = -340 + i * 10 + rnd(i) * 6, z = -560 - rnd(i * 3) * 80, h = 14 + rnd(i * 5) * (i % 7 === 0 ? 90 : 40), w = 6 + rnd(i * 7) * 8;
      const b = new THREE.Mesh(i % 7 === 0 ? new THREE.ConeGeometry(w * 0.6, h, 4) : new THREE.BoxGeometry(w, h, w), bM);
      b.position.set(x, h / 2, z);
      grp.add(b);
      if (i % 7 !== 0)
        for (let k = 0; k < 3; k++) {
          const l = new THREE.Mesh(new THREE.BoxGeometry(w * 1.02, 0.6, w * 1.02), (i + k) % 4 ? win : cy);
          l.position.set(x, h * (0.25 + k * 0.22), z);
          grp.add(l);
        }
    }
    const trails = Array.from({ length: 34 }).map((_, i) => {
      const isC = i % 2 === 1;
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.Float32BufferAttribute(new Array(24 * 3).fill(0), 3));
      const cols: number[] = [];
      const c0 = new THREE.Color(isC ? "#9fe6ff" : "#ffcf86");
      for (let s = 0; s < 24; s++) {
        const k = s / 23;
        cols.push(c0.r * k, c0.g * k, c0.b * k);
      }
      geo.setAttribute("color", new THREE.Float32BufferAttribute(cols, 3));
      const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
      const head = new THREE.Mesh(new THREE.SphereGeometry(1.6, 8, 6), new THREE.MeshBasicMaterial({ color: isC ? "#dff6ff" : "#fff1d6", fog: false }));
      grp.add(line, head);
      return { line, head, i, x0: -320 + rnd(i * 11) * 640, z0: -900 - rnd(i * 13) * 100 };
    });
    return { grp, layers, arms, core, trails };
  }, [PORTAL]);
  const extra = (root: THREE.Group) => {
    if (OBJ.grp.parent !== root) root.add(OBJ.grp);
    OBJ.layers.forEach((m, i) => {
      m.rotation.z = f * 0.004 * (m.userData.dir as number) * (1 + i * 0.4);
      m.scale.setScalar(Math.max(0.01, open));
    });
    OBJ.arms.rotation.z = f * 0.006;
    OBJ.arms.scale.setScalar(Math.max(0.01, open));
    OBJ.core.scale.setScalar(Math.max(0.01, open * (1 + 0.06 * Math.sin(f / 5))));
    const bez = (a: THREE.Vector3, b: THREE.Vector3, cc: THREE.Vector3, t: number) => a.clone().multiplyScalar((1 - t) * (1 - t)).add(cc.clone().multiplyScalar(2 * (1 - t) * t)).add(b.clone().multiplyScalar(t * t));
    OBJ.trails.forEach(({ line, head, i, x0, z0 }) => {
      const u = (f - leaveAt - i * 9) / 170;
      const vis = u > 0 && u < 1.05;
      line.visible = vis;
      head.visible = vis && u < 1;
      if (!vis) return;
      const A = new THREE.Vector3(x0, 4, z0), Cc = new THREE.Vector3(x0 * 0.6 + PORTAL.x * 0.4, 70, (z0 + PORTAL.z) / 2 + 80);
      const pos = line.geometry.getAttribute("position") as THREE.BufferAttribute;
      for (let s = 0; s < 24; s++) {
        const t = Math.max(0, Math.min(1, u - (23 - s) * 0.012));
        const q = bez(A, PORTAL, Cc, t);
        pos.setXYZ(s, q.x, q.y, q.z);
      }
      pos.needsUpdate = true;
      head.position.copy(bez(A, PORTAL, Cc, Math.min(1, u)));
    });
  };
  const pr = projector(cam);
  const hz = pr([cam.pos[0], 0, cam.pos[2] - 3000]);
  const yaw = Math.atan2(cam.tgt[0] - cam.pos[0], -(cam.tgt[2] - cam.pos[2]));
  if (f >= cutAt) return <HL13Leave {...p} />;
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#02060c" }}>
      <Sky hy={hz ? hz.y : 540} shift={yaw * 700} f={f} />
      {ctx.mode === "collect" ? null : (
        <ThreeCanvas frameloop="demand" width={1920} height={1080} style={{ position: "absolute", inset: 0 }} dpr={lite ? 0.75 : 1} shadows gl={{ antialias: true, alpha: true }} camera={{ fov: 54, position: [0, 3, 0], near: 0.3, far: 4000 }}>
          <World st={st} extra={extra} />
        </ThreeCanvas>
      )}
      {f >= leaveAt ? (
        <div style={{ position: "absolute", left: 90, top: 140, display: "flex", flexDirection: "column", gap: 12, opacity: P(f, leaveAt, 10), fontFamily: MONO }}>
          {[["hl3silh/rebelde_badge.jpg", "HUMANIDADE", GREEN], ["hl3silh/combine_badge.jpg", "COMBINE", "#b8c4cc"]].map(([img, n, col]) => (
            <div key={n} style={{ display: "flex", alignItems: "center", gap: 12, padding: 8, borderRadius: 10, background: "rgba(8,8,10,0.75)", border: `1.5px solid ${col}`, fontSize: 16, letterSpacing: 3, color: col }}>
              <div style={{ width: 62, height: 76, borderRadius: 6, backgroundImage: `url(${staticFile(img)})`, backgroundSize: "cover", backgroundPosition: "50% 30%" }} />
              {n} · JUNTOS
            </div>
          ))}
        </div>
      ) : null}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 110, textAlign: "center", fontFamily: MONO, textShadow: "0 2px 10px #000" }}>
        {f >= leaveAt ? <div style={{ fontSize: 24, letterSpacing: 6, color: "#f2efe6", opacity: P(f, leaveAt, 10) }}>A HUMANIDADE DEIXA A TERRA PARA TRÁS</div> : null}
        {f >= workAt ? <div style={{ fontSize: 18, letterSpacing: 4, color: "#ffd27a", marginTop: 10, opacity: P(f, workAt, 10) }}>QUEM VENCEU OS COMBINE PASSOU A TRABALHAR COM ELES</div> : null}
        {f >= reachAt ? <div style={{ fontSize: 18, letterSpacing: 4, color: GREEN, marginTop: 8, opacity: P(f, reachAt, 10) }}>A LINHA CHEGOU EXATAMENTE ONDE PRECISAVA</div> : null}
      </div>
      <AbsoluteFill style={{ background: "#000", opacity: interpolate(f, [0, 8], [1, 0], C) + interpolate(f, [cutAt - 10, cutAt], [0, 1], C), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ================================================================================================= 1:45:40 o Ártico se desfaz (3D)
// 12/10 (pedido dele: o 2D ficou horrível): no mesmo gelo do Borealis. O navio pisca em fase ao fundo (brilho e somindo);
// placas de gelo se descolam do chão e sobem devagar girando; ilhas de Xen (rocha escura com as torres verdes acesas)
// arrancadas da Terra sobem junto; antlions e headcrabs (silhuetas) fugem pelo gelo sem atacar; dois Combine (crachás)
// parados, sem alvo. Depois o Varga sozinho na neve, os arquivos na mão, olhando o céu se desfazer.
const ICE_SLABS = Array.from({ length: 30 }).map((_, i) => ({ x: -90 + rnd(i * 3.1) * 180, z: 0 - rnd(i * 5.3) * 110, w: 4 + rnd(i * 7.7) * 10, d: 3 + rnd(i * 2.2) * 8, sp: 0.6 + rnd(i * 9.1), t0: rnd(i * 4.4) * 120 }));
const XEN_ISL = [[-50, -60, 9], [30, -80, 13], [-5, -105, 7], [60, -55, 6]] as [number, number, number][];
// 12/10 v2 (ele: blocos e ilhas toscos): formas irregulares — um icosaedro subdividido com o relevo deslocado por ruído.
// Gelo: placas achatadas, facetadas, translúcidas; ilhas de Xen: rocha porosa por baixo (estalactites), topo de musgo e
// as plantas/torres orgânicas acesas, como no Xen aprovado
const lump = (r: number, sx: number, sy: number, sz: number, seed: number, rough = 0.35, det = 3) => {
  const g = new THREE.IcosahedronGeometry(r, det);
  const pos = g.getAttribute("position") as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const n = Math.sin(v.x * 1.7 + seed) * Math.cos(v.y * 2.3 - seed) * Math.sin(v.z * 1.9 + seed * 2) + 0.5 * Math.sin(v.x * 4.1 + v.z * 3.3 + seed);
    v.multiplyScalar(1 + rough * n);
    pos.setXYZ(i, v.x * sx, v.y * sy, v.z * sz);
  }
  g.computeVertexNormals();
  return g;
};
const buildArctic = () => {
  const g = new THREE.Group();
  const iceM = new THREE.MeshPhysicalMaterial({ color: "#d6ebf5", roughness: 0.25, metalness: 0, transmission: 0.25, thickness: 1.5, flatShading: true });
  const snowM = new THREE.MeshStandardMaterial({ color: "#f2f7fb", roughness: 0.9, flatShading: true });
  const slabs = ICE_SLABS.map((s, i) => {
    const m = new THREE.Group();
    const b = new THREE.Mesh(lump(1, s.w * 0.5, 0.7, s.d * 0.5, i * 1.7, 0.28, 2), iceM);
    const t = new THREE.Mesh(lump(1, s.w * 0.48, 0.18, s.d * 0.48, i * 3.1, 0.2, 2), snowM);
    t.position.y = 0.55;
    m.add(b, t);
    g.add(m);
    return m;
  });
  const rock = new THREE.MeshStandardMaterial({ color: "#5a4c3a", roughness: 0.95, flatShading: true });
  const moss = new THREE.MeshStandardMaterial({ color: "#6e8a42", roughness: 0.9, flatShading: true });
  const stem = new THREE.MeshStandardMaterial({ color: "#8a7a5a", roughness: 0.8 });
  const glowM = new THREE.MeshBasicMaterial({ color: "#c8ff9a" });
  const isl = XEN_ISL.map(([x, z, s], i) => {
    const m = new THREE.Group();
    const body = new THREE.Mesh(lump(1, s, s * 1.3, s, i * 5.3, 0.4, 3), rock);
    body.position.y = -s * 0.9;
    body.scale.y = 1;
    const top = new THREE.Mesh(lump(1, s * 1.02, s * 0.22, s * 1.02, i * 2.9, 0.25, 2), moss);
    top.position.y = 0;
    m.add(body, top);
    // estalactites embaixo
    for (let k = 0; k < 5; k++) {
      const a = k * 1.3 + i;
      const st = new THREE.Mesh(new THREE.ConeGeometry(s * 0.12, s * (0.6 + 0.3 * rnd(k + i)), 5), rock);
      st.rotation.x = Math.PI;
      st.position.set(Math.cos(a) * s * 0.4, -s * 2.0 - s * 0.2 * rnd(k), Math.sin(a) * s * 0.4);
      m.add(st);
    }
    // as plantas de Xen: hastes curvas com o bulbo aceso
    for (let k = 0; k < 4; k++) {
      const a = k * 1.7 + i * 0.7, r = s * (0.2 + 0.5 * rnd(k * 3 + i));
      const h = s * (0.5 + 0.6 * rnd(k * 7 + i));
      const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r), new THREE.Vector3(Math.cos(a) * r * 1.1, h * 0.5, Math.sin(a) * r * 1.1 + s * 0.08), new THREE.Vector3(Math.cos(a) * r * 1.2, h, Math.sin(a) * r * 1.2)]);
      m.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 10, s * 0.035, 6), stem));
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(s * 0.08, 10, 8), glowM);
      bulb.position.copy(curve.getPoint(1));
      m.add(bulb);
    }
    const pl = new THREE.PointLight("#b8ff90", 40, s * 4, 1.6);
    pl.position.y = s * 0.8;
    m.add(pl);
    m.position.set(x, -s, z);
    g.add(m);
    return m;
  });
  return { g, slabs, isl };
};
const Arctic3D: React.FC<{ p: PR; varga: boolean }> = ({ p, varga }) => {
  const f = useCurrentFrame();
  const life = p.life;
  const lite = React.useContext(LiteCtx);
  const ctx = React.useContext(SfxCtx);
  const [iceAt, xenAt, creatAt, combAt, fearAt] = ["iceAt", "xenAt", "creatAt", "combAt", "fearAt"].map((k) => at(p, k));
  const [filesAt, skyAt, closeAt, goAt] = ["filesAt", "skyAt", "closeAt", "goAt"].map((k) => at(p, k));
  // no Varga a cena continua de onde o Ártico parou (tudo já subindo)
  const T = varga ? f + 700 : f;
  const cam = varga
    ? { pos: kv(f, [[0, [-14, 2.2, 36]], [life, [-12, 2.4, 32]]]), tgt: kv(f, [[0, [-30, 2.4, 8]], [skyAt, [-30, 2.4, 8]], [skyAt + 50, [-40, 34, -50]], [goAt, [-40, 34, -50]], [goAt + 30, [0, 6, -40]]]), fov: 50 }
    : { pos: kv(f, [[0, [-30, 3, 30]], [life, [-24, 3.8, 18]]]), tgt: kv(f, [[0, [SX - 10, 8, SZ]], [xenAt, [SX - 10, 16, SZ + 20]], [creatAt, [-10, 3, -60]], [life, [-6, 10, -70]]]), fov: 52 };
  const st = calmState(f, lite, cam);
  st.ridge = false;
  // o navio pisca em fase
  const fl = rnd(Math.floor(T / 3) * 7) > 0.6;
  st.ship.glow = 0;
  st.ship.op = fl ? 0.3 : 1;
  const OBJ = useMemo(() => buildArctic(), []);
  const extra = (root: THREE.Group) => {
    if (OBJ.g.parent !== root) root.add(OBJ.g);
    const ice = varga ? 1 : P(f, iceAt, 30);
    OBJ.slabs.forEach((m, i) => {
      const s = ICE_SLABS[i];
      const u = Math.max(0, (T - iceAt - s.t0) / 30) * ice;
      m.position.set(s.x, 0.6 + u * s.sp * 1.8, s.z);
      m.rotation.set(u * 0.04 * s.sp, u * 0.05, u * 0.03 * (i % 2 ? 1 : -1));
    });
    OBJ.isl.forEach((m, i) => {
      const [x, z, s] = XEN_ISL[i];
      const u = varga ? 1 : P(f, xenAt + i * 12, 60);
      const up = Math.max(0, (T - xenAt - i * 12) / 30);
      m.position.set(x, -s * (1 - u) + up * 2.2, z);
      m.rotation.y = up * 0.03;
    });
  };
  const pr = projector(cam);
  const hz = pr([cam.pos[0], 0, cam.pos[2] - 3000]);
  const yaw = Math.atan2(cam.tgt[0] - cam.pos[0], -(cam.tgt[2] - cam.pos[2]));
  const eye = { x: cam.pos[0], y: -cam.pos[2], z: cam.pos[1], yaw, pitch: 0, F: 1000 };
  // as criaturas fugindo (silhuetas no gelo, projetadas)
  const crit = (src: string, ar: number, x0: number, z0: number, h: number, t0: number, vx: number, flip = false) => {
    if (f < t0) return null;
    const u = (f - t0) / 30;
    const q = pr([x0 + vx * u, 0, z0]);
    const qt = pr([x0 + vx * u, h, z0]);
    if (!q || !qt) return null;
    const hh = Math.max(4, q.y - qt.y);
    return <img key={src + x0} src={staticFile(src)} style={{ position: "absolute", left: q.x - (hh * ar) / 2, top: qt.y + Math.abs(Math.sin(f / 3)) * hh * 0.04, height: hh, width: hh * ar, transform: flip ? "scaleX(-1)" : undefined, filter: "brightness(0.2) drop-shadow(0 0 2px rgba(200,230,255,0.4))", opacity: P(f, t0, 10) }} />;
  };
  const badge = (x: number, z: number, h: number, label: string, col: string, sub: string, o: number, img: string) => {
    const b = pr([x, 0, z]), t = pr([x, h, z]);
    if (!b || !t || o <= 0) return null;
    return (
      <g opacity={o}>
        <line x1={b.x} y1={b.y} x2={t.x} y2={t.y} stroke={col} strokeWidth={2} />
        <ellipse cx={b.x} cy={b.y} rx={22} ry={6} fill="none" stroke={col} strokeWidth={1.5} strokeDasharray="5 4" />
        <FlagBadge cx={t.x} by={t.y} k={0.9} label={label} col={col} f={f} sub={sub} photo={img} />
      </g>
    );
  };
  const lines: [number, string][] = [[iceAt, "O GELO DEIXA O CHÃO"], [xenAt, "FRAGMENTOS DE XEN ARRANCADOS DA TERRA"], [creatAt, "AS CRIATURAS FOGEM · NINGUÉM ATACA"], [combAt, "OS COMBINE NÃO SABEM CONTRA QUEM LUTAR"]];
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#02060c" }}>
      <Sky hy={hz ? hz.y : 540} shift={yaw * 700} f={f} />
      {ctx.mode === "collect" ? null : (
        <ThreeCanvas frameloop="demand" width={1920} height={1080} style={{ position: "absolute", inset: 0 }} dpr={lite ? 0.75 : 1} shadows gl={{ antialias: true, alpha: true }} camera={{ fov: 52, position: [0, 3, 0], near: 0.3, far: 4000 }}>
          <World st={st} extra={extra} />
        </ThreeCanvas>
      )}
      {!varga ? (
        <>
          {crit("hl3silh/antlion_silh.png", 449 / 528, -40, -70, 2.6, creatAt, 6)}
          {crit("hl3silh/antlion_silh.png", 449 / 528, -46, -76, 2.4, creatAt + 10, 6.5)}
          {crit("hl3silh/headcrab_silh.png", 471 / 516, 6, -64, 0.9, creatAt + 30, -5, true)}
          {crit("hl3silh/headcrab_silh.png", 471 / 516, 9, -68, 0.8, creatAt + 40, -5.6, true)}
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            {badge(-14, -72, 3.2, "COMBINE", "#b8c4cc", "SEM ALVO", P(f, combAt, 10), "hl3silh/combine_badge.jpg")}
            {badge(8, -66, 3.6, "COMBINE", "#b8c4cc", "", P(f, combAt + 8, 10), "hl3silh/combine_badge.jpg")}
          </svg>
          <div style={{ position: "absolute", left: 90, top: 120, fontFamily: MONO }}>
            {lines.map(([t0, s]) => (f >= t0 ? <div key={s} style={{ marginTop: 8, padding: "8px 14px", background: "rgba(6,10,14,0.82)", borderLeft: `3px solid ${ICE}`, fontSize: 19, letterSpacing: 3, color: "#f2f0f7", opacity: P(f, t0, 8) }}>{s}</div> : null))}
          </div>
          {f >= fearAt ? <div style={{ position: "absolute", left: 0, right: 0, bottom: 130, textAlign: "center", fontFamily: MONO, fontSize: 30, letterSpacing: 8, color: "#bfe6ff", textShadow: "0 2px 12px #000", opacity: P(f, fearAt, 12) }}>TUDO COM MEDO DA MESMA COISA</div> : null}
        </>
      ) : (
        <>
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            {badge(-30, 8, 1.9, "VARGA", AMB, f >= skyAt ? "OLHA O CÉU" : f >= filesAt ? "OS ARQUIVOS DA MOSSMAN NA MÃO" : "SOZINHO NA NEVE", 1 - P(f, goAt + 20, 20), "hl3silh/varga_retrato.png")}
          </svg>
          {f >= closeAt ? (
            <div style={{ position: "absolute", left: "50%", bottom: 150, transform: `translateX(-50%) translateY(${(1 - P(f, closeAt, 14)) * 16}px)`, display: "flex", gap: 16, alignItems: "center", padding: "16px 26px 16px 18px", borderRadius: 12, background: "rgba(14,10,4,0.82)", borderLeft: `5px solid ${AMB}`, opacity: P(f, closeAt, 10) * (1 - P(f, goAt + 20, 10)) }}>
              <div style={{ width: 54, height: 64, borderRadius: 6, backgroundImage: `url(${staticFile("hl3silh/varga_retrato.png")})`, backgroundSize: "cover", backgroundPosition: "50% 25%", border: `1.5px solid ${AMB}` }} />
              <div>
                <div style={{ fontFamily: MONO, fontSize: 14, letterSpacing: 4, color: AMB }}>VARGA</div>
                <div style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 38, color: CREAM }}>{"Cheguei tão perto.".slice(0, Math.max(0, Math.floor((f - closeAt) * 0.9)))}</div>
              </div>
            </div>
          ) : null}
          {f >= goAt ? <div style={{ position: "absolute", left: 0, right: 0, top: 120, textAlign: "center", fontFamily: MONO, fontSize: 20, letterSpacing: 5, color: "#f2efe6", opacity: P(f, goAt, 10) }}>NÃO PEDE AJUDA · GORDON CONTINUA</div> : null}
        </>
      )}
      <Hud f={f} yaw={eye.yaw} eye={eye} blips={[]} msg={undefined} />
      <AbsoluteFill style={{ background: "#000", opacity: interpolate(f, [0, 8], [1, 0], C) + interpolate(f, [life - 6, life], [0, 1], C), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};
export const HL14Arctic3D: React.FC<PR> = (p) => <Arctic3D p={p} varga={false} />;
export const HL14Varga3D: React.FC<PR> = (p) => <Arctic3D p={p} varga />;

// ================================================================================================= 1:49:08 a despedida na neve (3D)
// 12/10 (pedido dele: o 2D do Eli, Gordon, Alyx ficou muito ruim): o mesmo gelo à noite. O rádio (Magnusson, Kleiner,
// Barney) enquanto o Gordon corre; o Borealis morrendo ao fundo, piscando de fase. A Alyx abre um portal (disco de luz em
// pé no gelo) até o Eli: crachás de pé na neve (Eli, Dog; a Alyx sai do portal); o abraço; o Gordon segue sozinho; o
// chão abre em luz (fendas acesas) e o céu se dobra; no fim a luz verde dos Vortigaunts (a mesma de antes).
export const HL14Snow3D: React.FC<PR & { mode?: number }> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const mode = (p.mode as number | undefined) ?? 0;
  const lite = React.useContext(LiteCtx);
  const ctx = React.useContext(SfxCtx);
  const [magAt, kleinerAt, barneyAt, laughAt, muteAt] = ["magAt", "kleinerAt", "barneyAt", "laughAt", "muteAt"].map((k) => at(p, k));
  const [portalAt, throughAt, dogAt, knowsAt, hugAt, aloneAt, foldAt, greenAt, lightAt, lastAt] = ["portalAt", "throughAt", "dogAt", "knowsAt", "hugAt", "aloneAt", "foldAt", "greenAt", "lightAt", "lastAt"].map((k) => at(p, k));
  const away = mode ? P(f, aloneAt, 90) : 0;
  const hug = mode ? P(f, hugAt, 30) : 0;
  const green = mode ? P(f, greenAt, 60) : 0;
  const white = mode ? P(f, lightAt, 40) : 0;
  const fold = mode ? P(f, foldAt, 80) : 0;
  // câmera: correndo pela neve (rádio) · parado perto do Eli (reencontro) · se afastando sozinho
  const cam = !mode
    ? { pos: kv(f, [[0, [-40, 1.8, 40]], [life, [-10, 1.8, -10]]]).map((v, i) => (i === 1 ? v + Math.abs(Math.sin(f / 4.5)) * 0.08 : v)) as V, tgt: kv(f, [[0, [-20, 3, -60]], [life, [10, 4, -120]]]), fov: 56 }
    : f < throughAt
      ? { pos: kv(f, [[0, [9, 1.8, -84]], [throughAt, [5, 1.8, -89]]]), tgt: kv(f, [[0, [-5, 3.2, -110]], [throughAt, [-7, 2.6, -107]]]), fov: 50 }
      : { pos: kv(f, [[0, [-24, 1.75, 20]], [aloneAt, [-23, 1.75, 18]], [aloneAt + 120, [-4, 2.4, 70]], [life, [6, 4, 90]]]), tgt: kv(f, [[0, [-33, 1.4, 6]], [aloneAt, [-33, 1.4, 6]], [aloneAt + 120, [-30, 6, -20]], [foldAt + 60, [-20, 30, -60]], [life, [-20, 30, -60]]]), fov: 50 };
  const st = calmState(f, lite, cam);
  st.ridge = false;
  const dg2 = mode ? P(f, foldAt - 60, 160) : 0;
  // 12/10 (pedido dele: o navio só piscando não parece destruído): a falha de fase roxa no casco por fora e as peças
  // ficando decompostas de vez; no fim ele some de verdade
  st.ship.op = 1 - dg2;
  st.ship.phase = 1;
  st.ship.decay = mode ? interpolate(f, [0, foldAt], [0.6, 0.95], C) : interpolate(f, [0, life], [0.45, 0.6], C);
  st.ship.on = dg2 < 0.99;
  st.crack = fold;
  const PORTAL = useMemo(() => new THREE.Vector3(-30, 1.75, 4), []);
  const OBJ = useMemo(() => {
    const grp = new THREE.Group();
    // 12/10 (pedido dele: portal no estilo Portal 2): oval em pé, a borda acesa (azul) com o brilho que pulsa e as
    // partículas, e por dentro a OUTRA ponta — o interior do Borealis (corredor aceso) visto através
    const pc = document.createElement("canvas");
    pc.width = 256;
    pc.height = 512;
    const px = pc.getContext("2d")!;
    const bg = px.createLinearGradient(0, 0, 0, 512);
    bg.addColorStop(0, "#1a1e22");
    bg.addColorStop(1, "#2c3238");
    px.fillStyle = bg;
    px.fillRect(0, 0, 256, 512);
    // o corredor do navio em perspectiva, aceso, visto pela abertura
    px.fillStyle = "#3a4046";
    px.beginPath(); px.moveTo(0, 0); px.lineTo(98, 200); px.lineTo(98, 330); px.lineTo(0, 512); px.fill();
    px.beginPath(); px.moveTo(256, 0); px.lineTo(158, 200); px.lineTo(158, 330); px.lineTo(256, 512); px.fill();
    px.fillStyle = "#52585e";
    px.beginPath(); px.moveTo(0, 512); px.lineTo(98, 330); px.lineTo(158, 330); px.lineTo(256, 512); px.fill();
    px.fillStyle = "#fff0d0";
    px.fillRect(98, 200, 60, 130);
    for (let k = 0; k < 5; k++) { px.fillStyle = "#ffe8c0"; px.fillRect(116 - k * 14, 170 - k * 34, 24 + k * 28, 5); }
    const inner = new THREE.Mesh(new THREE.CircleGeometry(1, 64), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(pc), side: THREE.DoubleSide, fog: false }));
    const rim = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.07, 16, 96), new THREE.MeshBasicMaterial({ color: "#5fb8ff", fog: false }));
    const glow = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.22, 16, 96), new THREE.MeshBasicMaterial({ color: "#3a9cff", transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    const ring = rim;
    const portal = new THREE.Group();
    portal.add(inner, glow, rim);
    portal.position.copy(PORTAL);
    portal.scale.set(1, 1.6, 1);
    const pl = new THREE.PointLight("#5fb8ff", 400, 30, 1.6);
    pl.position.copy(PORTAL).add(new THREE.Vector3(0, 0, 2));
    grp.add(portal, pl);
    void ring;
    const arc = buildArctic();
    grp.add(arc.g);
    // o halo (aura) e as partículas da borda
    const hc = document.createElement("canvas");
    hc.width = hc.height = 256;
    const hx = hc.getContext("2d")!;
    const hg = hx.createRadialGradient(128, 128, 40, 128, 128, 128);
    hg.addColorStop(0, "rgba(120,200,255,0)");
    hg.addColorStop(0.42, "rgba(120,200,255,0.75)");
    hg.addColorStop(1, "rgba(60,140,255,0)");
    hx.fillStyle = hg;
    hx.fillRect(0, 0, 256, 256);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(hc), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    halo.scale.set(4.2, 4.2, 1);
    portal.add(halo);
    const NP = 220;
    const pg = new THREE.BufferGeometry();
    pg.setAttribute("position", new THREE.Float32BufferAttribute(new Array(NP * 3).fill(0), 3));
    const parts = new THREE.Points(pg, new THREE.PointsMaterial({ color: "#bfe6ff", size: 0.06, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    portal.add(parts);
    const SH = buildArcticShots();
    SH.nest.visible = false;
    SH.debris.forEach((d) => (d.visible = false));
    grp.add(SH.g);
    // o raio do navio até o portal (a última coisa que o navio faz)
    const bm = new THREE.LineBasicMaterial({ color: "#9fdcff", transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
    const beams = [0, 1, 2].map(() => {
      const g2 = new THREE.BufferGeometry();
      g2.setAttribute("position", new THREE.Float32BufferAttribute(new Array(20 * 3).fill(0), 3));
      const l = new THREE.Line(g2, bm);
      grp.add(l);
      return l;
    });
    // 13/10 (pedido dele: o piso em si tinha que se desfazer, com crateras): crateras que se abrem no gelo — o buraco
    // escuro com luz subindo do fundo, a borda rachada, e as placas em volta inclinando e caindo para dentro
    const craters = [[-12, 40, 7], [8, 30, 5], [-26, 18, 4.5], [16, 46, 4], [24, 12, 3.5], [-4, 14, 6]].map(([x, z, r], i) => {
      const cg = new THREE.Group();
      const hole = new THREE.Mesh(new THREE.CircleGeometry(1, 40), new THREE.MeshBasicMaterial({ color: "#06080c", fog: false }));
      hole.rotation.x = -Math.PI / 2;
      hole.position.y = 0.08;
      const glow = new THREE.Mesh(new THREE.CircleGeometry(0.8, 40), new THREE.MeshBasicMaterial({ color: "#fff4dc", transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
      glow.rotation.x = -Math.PI / 2;
      glow.position.y = 0.1;
      const rim = new THREE.Mesh(new THREE.RingGeometry(0.95, 1.12, 40), new THREE.MeshBasicMaterial({ color: "#5a6878", transparent: true, opacity: 0.9, fog: false }));
      rim.rotation.x = -Math.PI / 2;
      rim.position.y = 0.09;
      cg.add(hole, glow, rim);
      const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 1.0, 40, 24, 1, true), new THREE.MeshBasicMaterial({ color: "#fff0d0", transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
      beam.position.y = 20;
      cg.add(beam);
      const chunks = Array.from({ length: 7 }).map((_, k) => {
        const ch = new THREE.Mesh(lump(1, 0.9 + rnd(i * 9 + k), 0.35, 0.8 + rnd(i * 7 + k), i * 11 + k, 0.3, 1), new THREE.MeshStandardMaterial({ color: "#d6e4ee", roughness: 0.6, flatShading: true }));
        const ang = (k / 7) * Math.PI * 2 + rnd(i + k);
        ch.userData = { ang, d: 1.0 + rnd(i * 3 + k) * 0.3, sp: 0.6 + rnd(i * 5 + k) * 0.8 };
        cg.add(ch);
        return ch;
      });
      cg.position.set(x, 0, z);
      cg.userData = { r, t0: i * 18 };
      grp.add(cg);
      return { cg, hole, glow, rim, beam, chunks };
    });
    return { grp, portal, pl, arc, halo, parts, NP, SH, beams, craters };
  }, [PORTAL]);
  // no navio o portal abre de um ponto (com estouro) e fica aberto até ela entrar; do lado do Eli já está aberto e fecha
  // depois que ela sai
  const PA = useMemo(() => new THREE.Vector3(-8, 1.75, -105), []);
  const pOpen = !mode ? 0 : f < throughAt ? P(f, portalAt + 8, 40) * (1 - P(f, throughAt - 4, 4)) : 1 - P(f, throughAt + 50, 30);
  const sideA = mode && f < throughAt;
  const extra = (root: THREE.Group) => {
    if (OBJ.grp.parent !== root) root.add(OBJ.grp);
    OBJ.portal.visible = pOpen > 0.01;
    const PP = sideA ? PA : PORTAL;
    OBJ.portal.position.copy(PP);
    OBJ.pl.position.copy(PP).add(new THREE.Vector3(0, 0, 2));
    const breath = 1 + 0.04 * Math.sin(f / 5);
    OBJ.portal.scale.set(1.05 * pOpen * breath, 1.7 * pOpen * breath, 1);
    OBJ.portal.lookAt(new THREE.Vector3(cam.pos[0], PP.y, cam.pos[2]));
    OBJ.pl.intensity = (400 + 120 * Math.sin(f / 4)) * pOpen;
    OBJ.halo.material.opacity = (0.75 + 0.25 * Math.sin(f / 6)) * pOpen;
    OBJ.halo.scale.set(4.2 + 0.4 * Math.sin(f / 7), 4.2 + 0.4 * Math.sin(f / 7), 1);
    // partículas: giram na borda e algumas escapam pra fora
    const pa = OBJ.parts.geometry.getAttribute("position") as THREE.BufferAttribute;
    for (let i = 0; i < OBJ.NP; i++) {
      const a = (i / OBJ.NP) * Math.PI * 2 + f * (0.02 + 0.01 * rnd(i));
      const out = ((f * (0.004 + 0.01 * rnd(i * 3)) + rnd(i * 7)) % 1) * (i % 4 === 0 ? 0.9 : 0.12);
      const r = 1.02 + out + 0.03 * Math.sin(f / 3 + i);
      pa.setXYZ(i, Math.cos(a) * r, Math.sin(a) * r, 0.05 + out * 0.6);
    }
    pa.needsUpdate = true;
    // o raio do navio até o portal (do "última coisa que o navio consegue fazer" até ela entrar)
    const beamOn = !!sideA && f >= lastAt - 10;
    OBJ.beams.forEach((l, k) => {
      l.visible = beamOn && rnd(Math.floor(f / 2) * 3 + k) > 0.25;
      if (!l.visible) return;
      const A0 = new THREE.Vector3(...shipW([-14 + k * 3, 4 + k, 9]));
      const p2 = l.geometry.getAttribute("position") as THREE.BufferAttribute;
      for (let i = 0; i < 20; i++) {
        const t = i / 19;
        const v = A0.clone().lerp(PA, t);
        const j = Math.sin(t * Math.PI) * 0.6;
        p2.setXYZ(i, v.x + (rnd(f * 3 + i * 7 + k) - 0.5) * j, v.y + (rnd(f * 5 + i * 11 + k) - 0.5) * j + Math.sin(t * Math.PI) * 1.5, v.z + (rnd(f * 7 + i * 13 + k) - 0.5) * j);
      }
      p2.needsUpdate = true;
    });
    // as crateras (só no reencontro, a partir de "o chão abre em luz")
    OBJ.craters.forEach(({ cg, hole, glow, rim, beam, chunks }) => {
      const k = mode ? P(f, foldAt - 30 + (cg.userData.t0 as number), 60) : 0;
      cg.visible = k > 0.01;
      if (!cg.visible) return;
      const R = (cg.userData.r as number) * (0.2 + 0.8 * k);
      hole.scale.setScalar(R);
      glow.scale.setScalar(R * 0.55);
      rim.scale.setScalar(R);
      (glow.material as THREE.MeshBasicMaterial).opacity = 0.4 * k * (0.8 + 0.2 * Math.sin(f / 5));
      beam.scale.set(R * 0.45, 1, R * 0.45);
      (beam.material as THREE.MeshBasicMaterial).opacity = 0.05 * k;
      chunks.forEach((ch) => {
        const u = ch.userData as { ang: number; d: number; sp: number };
        const fallK = Math.max(0, k * 1.4 - 0.3);
        ch.position.set(Math.cos(u.ang) * R * (u.d - 0.25 * fallK), 0.3 - fallK * fallK * 1.6 * u.sp, Math.sin(u.ang) * R * (u.d - 0.25 * fallK));
        ch.rotation.set(Math.sin(u.ang) * fallK * 0.9, u.ang, -Math.cos(u.ang) * fallK * 0.9);
      });
    });
    // o chão rachando e as placas soltando (sem parar: quando uma some no alto, outra se solta de uma rachadura)
    const T2 = f + (mode ? 1100 : 300);
    OBJ.SH.cracks.forEach((cr) => {
      const k = Math.max(0, Math.min(1, (T2 - cr.t0 - 200) / 900));
      const n = Math.floor((cr.n / 6) * k) * 6;
      cr.groove.geometry.setDrawRange(0, n);
      cr.glow.geometry.setDrawRange(0, n);
      (cr.glow.material as THREE.MeshBasicMaterial).opacity = 0.75 + 0.25 * Math.sin(T2 / 6 + cr.t0);
    });
    OBJ.SH.slabs.forEach((sl) => {
      const t = ((T2 - sl.t0 * 7) / 30 % 14 + 14) % 14;
      const tilt = Math.min(1, t * 0.8);
      sl.m.position.set(sl.x, -0.35 + Math.min(0.5, t * 0.6) + Math.max(0, t - 0.8) * sl.sp * 1.4, sl.z);
      sl.m.rotation.set(tilt * 0.35 * (rnd(sl.sd) - 0.5) + t * 0.03, t * 0.04 * sl.sp, tilt * 0.4 * (rnd(sl.sd + 1) - 0.5));
    });
    // 12/10 (pedido dele: antes da luz verde, a degradação de tudo): o gelo se solta e sobe, as ilhas sobem, o navio some
    const dg = mode ? P(f, foldAt - 60, 160) : 0;
    OBJ.arc.g.visible = dg > 0;
    OBJ.arc.slabs.forEach((m, i) => {
      const s = ICE_SLABS[i];
      const u = Math.max(0, (f - foldAt + 60 - s.t0 * 0.5) / 30) * dg;
      m.position.set(s.x * 0.8 - 20, 0.6 + u * s.sp * 2.4, s.z * 0.7 - 10);
      m.rotation.set(u * 0.05 * s.sp, u * 0.06, u * 0.04 * (i % 2 ? 1 : -1));
    });
    OBJ.arc.isl.forEach((m, i) => {
      const [x, z, sz] = XEN_ISL[i];
      const up = Math.max(0, (f - foldAt - i * 15) / 30) * dg;
      m.position.set(x * 0.8 - 20, -sz + up * 3 + sz * dg, z * 0.7 - 10);
    });
  };
  const pr = projector(cam);
  const hz = pr([cam.pos[0], 0, cam.pos[2] - 3000]);
  const yaw = Math.atan2(cam.tgt[0] - cam.pos[0], -(cam.tgt[2] - cam.pos[2]));
  const eye = { x: cam.pos[0], y: -cam.pos[2], z: cam.pos[1], yaw, pitch: 0, F: 1000 };
  const badge = (x: number, z: number, h: number, label: string, col: string, sub: string | undefined, o: number) => {
    const b = pr([x, 0, z]), t = pr([x, h, z]);
    if (!b || !t || o <= 0) return null;
    return (
      <g key={label} opacity={o}>
        <line x1={b.x} y1={b.y} x2={t.x} y2={t.y} stroke={col} strokeWidth={2} />
        <ellipse cx={b.x} cy={b.y} rx={20} ry={5} fill="none" stroke={col} strokeWidth={1.5} strokeDasharray="5 4" />
        <FlagBadge cx={t.x} by={t.y} k={1.0} label={label} col={col} f={f} sub={sub} />
      </g>
    );
  };
  const ax = f < throughAt ? -30 : -30 - 2.6 * P(f, throughAt, 30) - 0.6 * hug;
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#02060c" }}>
      <AbsoluteFill style={{ transform: `perspective(1400px) rotateX(${fold * 6}deg) skewX(${fold * 2 * Math.sin(f / 30)}deg)`, transformOrigin: "50% 20%" }}>
        <Sky hy={hz ? hz.y : 540} shift={yaw * 700} f={f} />
        {ctx.mode === "collect" ? null : (
          <ThreeCanvas frameloop="demand" width={1920} height={1080} style={{ position: "absolute", inset: 0 }} dpr={lite ? 0.75 : 1} shadows gl={{ antialias: true, alpha: true }} camera={{ fov: 52, position: [0, 3, 0], near: 0.3, far: 4000 }}>
            <World st={st} extra={extra} />
          </ThreeCanvas>
        )}
      </AbsoluteFill>
      {mode ? (
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          {sideA ? (() => {
            // a Alyx no gelo diante do navio: abre o portal e, no fim da tomada, anda até ele e entra
            const walk = P(f, throughAt - 50, 40);
            const x = -2 + (PA.x + 0.2 - -2) * walk, z = -100 + (PA.z + 0.4 - -100) * walk;
            return badge(x, z, 1.7, "ALYX", ORANGE, f < lastAt ? "ABRE UM PORTAL ATÉ O ELI" : "ENTRA", P(f, 2, 10) * (1 - P(f, throughAt - 10, 8)));
          })() : null}
          {!sideA ? badge(-34 + 0.4 * hug, 8, 1.8, "ELI", AMB, hug > 0.5 ? "ABRAÇA A FILHA" : undefined, P(f, throughAt, 10) * (1 - away)) : null}
          {!sideA ? badge(-37, 9, 2.4, "DOG", ICE, hug > 0.5 ? "DEITA AO LADO" : f >= dogAt ? "ESTÁ COM ELE" : undefined, P(f, throughAt + 4, 10) * (1 - away)) : null}
          {!sideA ? badge(ax, 6, 1.7, "ALYX", ORANGE, f >= knowsAt && f < hugAt ? "O CATALISADOR NÃO ACONTECEU" : f < throughAt + 40 ? "SAI DO PORTAL" : undefined, P(f, throughAt + 6, 10) * (1 - away)) : null}
          {sideA ? <Call3 pr={pr} f={f} pt={shipW([-14, 6, 9])} from={lastAt} until={throughAt - 6} text="A ÚLTIMA COISA QUE O NAVIO CONSEGUE FAZER" col="#9fe6ff" dx={-120} dy={-150} /> : null}
        </svg>
      ) : null}
      {!mode ? (
        <>
          <RadioCardS f={f} at={magAt} until={kleinerAt} img="hl3silh/magnusson_badge.jpg" name="MAGNUSSON" text="Dessa vez, o foguete não vai salvar ninguém." col={GREEN} />
          <RadioCardS f={f} at={kleinerAt} until={barneyAt} img="hl3silh/kleiner_retrato.png" name="DR. KLEINER" text="Obrigado, Gordon. Foi uma honra." col={ICE} />
          <RadioCardS f={f} at={barneyAt} until={muteAt + 20} img="hl3silh/barney_badge.jpg" name="BARNEY" text={f >= laughAt ? "…ha. A cerveja fica pra outra vida." : "Pelo jeito aquela cerveja…"} col={AMB} mute={f >= muteAt} />
          {f >= muteAt ? <div style={{ position: "absolute", left: 0, right: 0, top: 150, textAlign: "center", fontFamily: MONO, fontSize: 20, letterSpacing: 8, color: "rgba(242,240,247,0.75)", textShadow: "0 2px 8px #000", opacity: P(f, muteAt, 10) }}>O RÁDIO FICA MUDO</div> : null}
        </>
      ) : null}
      {false ? <div style={{ position: "absolute", left: 0, right: 0, top: 130, textAlign: "center", fontFamily: MONO, fontSize: 20, letterSpacing: 6, color: "#9fe6ff", textShadow: "0 2px 8px #000", opacity: P(f, portalAt, 10) }}>A ÚLTIMA COISA QUE O NAVIO CONSEGUE FAZER · UM PORTAL ATÉ O ELI</div> : null}
      {mode && f >= aloneAt && f < greenAt ? <div style={{ position: "absolute", left: 0, right: 0, top: 130, textAlign: "center", fontFamily: MONO, fontSize: 20, letterSpacing: 6, color: "#cfe8ff", textShadow: "0 2px 8px #000", opacity: P(f, aloneAt, 10) }}>{f >= foldAt ? "O CÉU SE DOBRA · O CHÃO ABRE EM LUZ" : "GORDON SEGUE SOZINHO"}</div> : null}
      {fold > 0 ? <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 85%, rgba(255,240,210,${0.5 * fold}), rgba(255,240,210,0) 60%)`, pointerEvents: "none" }} /> : null}
      {/* 12/10 (pedido dele: só o Gordon, sem Vortigaunts em volta): a vortessência sobe em volta da visão dele —
          filetes verdes subindo das bordas, anéis que fecham, faíscas — até tomar a tela */}
      {green > 0 ? (
        <AbsoluteFill style={{ pointerEvents: "none" }}>
          <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 55%, rgba(141,255,168,${0.04 + 0.25 * green}) 0%, rgba(20,80,40,${0.75 * green}) 80%)` }} />
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
            {Array.from({ length: 18 }).map((_, k) => {
              const side = k % 2 ? 1 : -1;
              const ph = ((f - greenAt) / 50 + k * 0.17) % 1;
              const x0 = 960 + side * (700 + 260 * rnd(k)), y0 = 1100 - ph * 200;
              const pts = Array.from({ length: 14 }).map((_, i) => {
                const t = i / 13;
                const x = x0 + (960 - x0) * t * 0.85 + (rnd(Math.floor(f / 2) * 7 + k * 13 + i) - 0.5) * 40 * (1 - t);
                const y = y0 + (560 - y0) * t + Math.sin(t * 6 + k) * 30;
                return `${x.toFixed(0)},${y.toFixed(0)}`;
              }).join(" ");
              return <polyline key={k} points={pts} fill="none" stroke="#b8ffc8" strokeWidth={2.2} opacity={green * (0.4 + 0.5 * rnd(k * 5 + Math.floor(f / 3)))} style={{ filter: "drop-shadow(0 0 6px #8dffa8)" }} />;
            })}
            {[0, 1, 2].map((k) => {
              const t = ((f - greenAt) / 45 + k / 3) % 1;
              return <ellipse key={"r" + k} cx={960} cy={560} rx={1100 * (1 - t)} ry={700 * (1 - t)} fill="none" stroke="#8dffa8" strokeWidth={3} opacity={green * t * 0.7} />;
            })}
            <circle cx={960} cy={560} r={40 + 220 * green} fill="rgba(220,255,230,0.5)" style={{ filter: "blur(30px)" }} />
          </svg>
        </AbsoluteFill>
      ) : null}
      {mode && f >= throughAt && f < throughAt + 3 ? <AbsoluteFill style={{ background: "rgba(200,230,255,0.6)", pointerEvents: "none" }} /> : null}
      {white > 0 ? <AbsoluteFill style={{ background: `rgba(240,255,244,${white})`, pointerEvents: "none" }} /> : null}
      <Hud f={f} yaw={eye.yaw} eye={eye} blips={[]} msg={undefined} />
      <AbsoluteFill style={{ background: "#000", opacity: interpolate(f, [0, 8], [1, 0], C) + (mode ? 0 : interpolate(f, [life - 6, life], [0, 1], C)), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};
const RadioCardS: React.FC<{ f: number; at: number; until: number; img: string; name: string; text: string; col: string; mute?: boolean }> = ({ f, at: t0, until, img, name, text, col, mute }) => {
  if (f < t0 || f >= until) return null;
  return (
    <div style={{ position: "absolute", left: 90, top: 130, width: 560, display: "flex", gap: 14, padding: 12, borderRadius: 12, background: "rgba(8,10,14,0.82)", border: `1.5px solid ${col}`, fontFamily: MONO, opacity: P(f, t0, 8) * (1 - P(f, until - 8, 8)) }}>
      <div style={{ flex: "0 0 92px", height: 112, borderRadius: 8, border: `1px solid ${col}`, backgroundImage: `url(${staticFile(img)})`, backgroundSize: "cover", backgroundPosition: "50% 30%" }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, letterSpacing: 4, color: col }}>RÁDIO · {name}</div>
        <svg width={400} height={34} style={{ marginTop: 6 }}>
          {Array.from({ length: 50 }).map((_, k) => {
            const h = mute ? 2 : Math.max(2, 30 * Math.abs(Math.sin(k * 0.7 + f / 3)) * (0.4 + 0.6 * rnd(k + Math.floor(f / 3))));
            return <rect key={k} x={k * 8} y={17 - h / 2} width={5} height={h} fill={col} opacity={0.85} />;
          })}
        </svg>
        <div style={{ fontSize: 20, letterSpacing: 2, color: "#f2f0f7", marginTop: 4, lineHeight: 1.3 }}>{text}</div>
      </div>
    </div>
  );
};

// ================================================================================================= 1:50:28 o mundo dos Vortigaunts (3D)
// 12/10 (pedido dele: não é aldeia nem Xen — outro mundo alienígena; nada de "Minecraft"): um planeta calmo, em 3D de
// verdade. Céu verde-água para âmbar com um gigante gasoso anelado e uma lua pequena; relevo suave coberto de musgo
// violeta-azulado; a flora: hastes altas e curvas (como corais) com bulbos que brilham, leques translúcidos, arcos de
// pedra lisa; esporos de luz no ar. Os Vortigaunts andam pelo campo (silhuetas em pé, com profundidade); o velho
// sentado numa pedra lisa diante do horizonte, onde a névoa começa a abrir.
const VW_RAND = (i: number) => rnd(i * 1.37 + 0.5);
const skyTex = () => {
  const cv = document.createElement("canvas");
  cv.width = 1024;
  cv.height = 512;
  const c = cv.getContext("2d")!;
  const g = c.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, "#08262c");
  g.addColorStop(0.45, "#1d5a58");
  g.addColorStop(0.62, "#c98a52");
  g.addColorStop(0.7, "#f2c486");
  g.addColorStop(1, "#f2c486");
  c.fillStyle = g;
  c.fillRect(0, 0, 1024, 512);
  for (let i = 0; i < 260; i++) {
    c.fillStyle = `rgba(255,255,255,${0.2 + 0.6 * VW_RAND(i)})`;
    c.fillRect(VW_RAND(i * 3) * 1024, VW_RAND(i * 7) * 200, 1.2, 1.2);
  }
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
};
let VORT_IMG: HTMLImageElement | null = null;
let VORT_P: Promise<void> | null = null;
// a textura dos Vortigaunts é uma só; quando a imagem chega, ela é posta nela (cada quadro confere)
let VORT_TEX: THREE.Texture | null = null;
const vortTex = () => {
  if (!VORT_TEX) {
    VORT_TEX = new THREE.Texture();
    VORT_TEX.colorSpace = THREE.SRGBColorSpace;
  }
  if (VORT_IMG && VORT_TEX.image !== VORT_IMG) {
    VORT_TEX.image = VORT_IMG;
    VORT_TEX.needsUpdate = true;
  }
  return VORT_TEX;
};
const useVortImg = () => {
  const [ok, setOk] = React.useState(!!VORT_IMG);
  // o delayRender já no primeiro render (no useEffect chegava tarde e o 1º quadro saía sem os Vortigaunts)
  const [hold] = React.useState(() => (VORT_IMG ? null : delayRender("vort img")));
  React.useEffect(() => {
    if (ok) {
      if (hold !== null) setTimeout(() => continueRender(hold), 300);
      return;
    }
    if (!VORT_P)
      VORT_P = new Promise<void>((res) => {
        const im = new Image();
        im.onload = () => {
          VORT_IMG = im;
          res();
        };
        im.onerror = () => res();
        im.src = staticFile("hl3silh/vort_silh.png");
      });
    VORT_P.then(() => setOk(true));
  }, [ok, hold]);
  return ok;
};
// 12/10 (pedido dele: os cards FINAL 1 / FINAL 2 genéricos): os dois finais como visão do Vortigaunt no céu que se abre —
// duas Terras dentro de anéis de vortessência. FINAL 1: a Terra inteira, girando, salva — e o halo dela vira vermelho
// (a certeza de que escolheu errado: o catalisador aconteceu). FINAL 2: a Terra se desfaz em pó de luz que se espalha,
// sobra o anel vazio — e nunca vem a confirmação.
const earthTex = () => {
  const W = 1024, H = 512;
  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  const g = cv.getContext("2d")!;
  const oc = g.createLinearGradient(0, 0, 0, H);
  oc.addColorStop(0, "#0d2a52");
  oc.addColorStop(0.5, "#1a4f8a");
  oc.addColorStop(1, "#0d2a52");
  g.fillStyle = oc;
  g.fillRect(0, 0, W, H);
  const img = g.getImageData(0, 0, W, H);
  const n = (x: number, y: number) => Math.sin(x * 0.011 + 1.3) * Math.cos(y * 0.017 - 0.4) + 0.6 * Math.sin(x * 0.027 + y * 0.013) + 0.35 * Math.sin(x * 0.061 - y * 0.049 + 2.1) + 0.2 * Math.sin(x * 0.13 + y * 0.11);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const v = n(x, y);
      const k = (y * W + x) * 4;
      const lat = Math.abs(y / H - 0.5) * 2;
      if (lat > 0.86) {
        img.data[k] = 235; img.data[k + 1] = 240; img.data[k + 2] = 245;
      } else if (v > 0.55) {
        const d = Math.min(1, (v - 0.55) * 1.6);
        const dry = lat < 0.35 && Math.sin(x * 0.02) > 0.3;
        img.data[k] = dry ? 150 + 40 * d : 46 + 50 * d;
        img.data[k + 1] = dry ? 120 + 20 * d : 96 + 40 * d;
        img.data[k + 2] = dry ? 70 : 52 + 10 * d;
      }
    }
  g.putImageData(img, 0, 0);
  return new THREE.CanvasTexture(cv);
};
const cloudTex = () => {
  const cv = document.createElement("canvas");
  cv.width = 1024;
  cv.height = 512;
  const g = cv.getContext("2d")!;
  for (let i = 0; i < 260; i++) {
    const x = rnd(i * 3) * 1024, y = 60 + rnd(i * 5) * 392, r = 10 + rnd(i * 7) * 40;
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, "rgba(255,255,255,0.55)");
    gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr;
    g.beginPath();
    g.ellipse(x, y, r * 2.2, r, 0, 0, Math.PI * 2);
    g.fill();
  }
  return new THREE.CanvasTexture(cv);
};
const buildFinals = () => {
  const root = new THREE.Group();
  const et = earthTex(), ct = cloudTex();
  const ringM = (col: string) => new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, side: THREE.DoubleSide });
  const glow = (col: string, s: number) => {
    const cv = document.createElement("canvas");
    cv.width = cv.height = 128;
    const g = cv.getContext("2d")!;
    const gr = g.createRadialGradient(64, 64, 20, 64, 64, 64);
    gr.addColorStop(0, "rgba(255,255,255,0.0)");
    gr.addColorStop(0.45, "rgba(255,255,255,0.75)");
    gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr;
    g.fillRect(0, 0, 128, 128);
    const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), color: col, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    m.scale.setScalar(s);
    return m;
  };
  const mk = () => {
    const g = new THREE.Group();
    const earth = new THREE.Mesh(new THREE.SphereGeometry(3.2, 64, 32), new THREE.MeshStandardMaterial({ map: et, roughness: 0.8, emissive: new THREE.Color("#0a1a30"), emissiveIntensity: 0.6, fog: false, transparent: true }));
    const clouds = new THREE.Mesh(new THREE.SphereGeometry(3.28, 48, 24), new THREE.MeshStandardMaterial({ map: ct, transparent: true, depthWrite: false, fog: false }));
    const halo = glow("#8dffa8", 10.5);
    const rings = [0, 1].map((k) => {
      const r = new THREE.Mesh(new THREE.TorusGeometry(4.6 + k * 0.7, 0.05, 6, 120), ringM("#8dffa8"));
      g.add(r);
      return r;
    });
    g.add(halo, earth, clouds);
    root.add(g);
    return { g, earth, clouds, halo, rings };
  };
  const A = mk(), B = mk();
  // o pó da Terra do final 2: pontos na superfície com a cor da textura
  const N = 2600;
  const pos: number[] = [], col: number[] = [], dir: number[] = [];
  const tc = (et.image as HTMLCanvasElement).getContext("2d")!.getImageData(0, 0, 1024, 512).data;
  for (let i = 0; i < N; i++) {
    const y = 1 - (i / (N - 1)) * 2, r = Math.sqrt(1 - y * y), th = i * 2.39996;
    const v = new THREE.Vector3(Math.cos(th) * r, y, Math.sin(th) * r);
    pos.push(v.x * 3.22, v.y * 3.22, v.z * 3.22);
    dir.push(v.x + (rnd(i) - 0.5) * 0.6, v.y + (rnd(i * 3) - 0.5) * 0.6, v.z + (rnd(i * 5) - 0.5) * 0.6);
    const u = Math.floor(((Math.atan2(v.z, v.x) / (Math.PI * 2) + 1) % 1) * 1023), w = Math.floor((0.5 - y / 2) * 511);
    const k = (w * 1024 + u) * 4;
    col.push(tc[k] / 255 + 0.15, tc[k + 1] / 255 + 0.15, tc[k + 2] / 255 + 0.2);
  }
  const pg = new THREE.BufferGeometry();
  pg.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  pg.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  const dust = new THREE.Points(pg, new THREE.PointsMaterial({ size: 0.09, vertexColors: true, transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  B.g.add(dust);
  // visão: desenhadas por cima da mata (a floresta não corta as duas Terras)
  root.traverse((o) => {
    const m = (o as THREE.Mesh).material as THREE.Material | undefined;
    if (m) m.depthTest = false;
    o.renderOrder = 20;
  });
  return { root, A, B, dust, pos0: pos, dir };
};

// o chão do planeta: musgo alienígena em manchas, células arredondadas, pedrinhas e pontos de luz (azulejado)
const groundTex = () => {
  const S = 1024;
  const cv = document.createElement("canvas");
  cv.width = cv.height = S;
  const c = cv.getContext("2d")!;
  c.fillStyle = "#7a7a88";
  c.fillRect(0, 0, S, S);
  // manchas grandes (tons do musgo)
  for (let i = 0; i < 260; i++) {
    const x = VW_RAND(i * 3) * S, y = VW_RAND(i * 5) * S, r = 30 + VW_RAND(i * 7) * 120;
    const k = VW_RAND(i * 11);
    const g = c.createRadialGradient(x, y, 1, x, y, r);
    const col = k < 0.4 ? "120,96,170" : k < 0.75 ? "70,140,140" : "150,130,110";
    g.addColorStop(0, `rgba(${col},0.55)`);
    g.addColorStop(1, `rgba(${col},0)`);
    c.fillStyle = g;
    for (const dx of [-S, 0, S]) for (const dy of [-S, 0, S]) {
      c.save();
      c.translate(dx, dy);
      c.beginPath();
      c.arc(x, y, r, 0, Math.PI * 2);
      c.fill();
      c.restore();
    }
  }
  // células (musgo em tufos arredondados, com sombra embaixo e brilho em cima)
  for (let i = 0; i < 1400; i++) {
    const x = VW_RAND(i * 13) * S, y = VW_RAND(i * 17) * S, r = 3 + VW_RAND(i * 19) * 9;
    c.fillStyle = "rgba(20,16,40,0.35)";
    c.beginPath();
    c.ellipse(x + 1.5, y + 2, r, r * 0.8, 0, 0, Math.PI * 2);
    c.fill();
    const k = VW_RAND(i * 23);
    c.fillStyle = k < 0.5 ? "rgba(140,110,200,0.6)" : "rgba(90,170,160,0.6)";
    c.beginPath();
    c.ellipse(x, y, r, r * 0.8, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "rgba(230,230,255,0.18)";
    c.beginPath();
    c.ellipse(x - r * 0.3, y - r * 0.3, r * 0.4, r * 0.3, 0, 0, Math.PI * 2);
    c.fill();
  }
  // pedrinhas claras
  for (let i = 0; i < 220; i++) {
    const x = VW_RAND(i * 29) * S, y = VW_RAND(i * 31) * S, r = 2 + VW_RAND(i * 37) * 4;
    c.fillStyle = "rgba(210,205,196,0.8)";
    c.beginPath();
    c.ellipse(x, y, r * 1.3, r, VW_RAND(i) * 3, 0, Math.PI * 2);
    c.fill();
  }
  // pontinhos de luz (esporos caídos)
  for (let i = 0; i < 500; i++) {
    const x = VW_RAND(i * 41) * S, y = VW_RAND(i * 43) * S;
    c.fillStyle = VW_RAND(i * 47) > 0.5 ? "rgba(170,255,235,0.9)" : "rgba(255,210,160,0.9)";
    c.fillRect(x, y, 2, 2);
  }
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(45, 45);
  t.anisotropy = 8;
  return t;
};
const buildVortPlanet = () => {
  const root = new THREE.Group();
  // céu
  const sky = new THREE.Mesh(new THREE.SphereGeometry(900, 48, 24), new THREE.MeshBasicMaterial({ map: skyTex(), side: THREE.BackSide, fog: false }));
  root.add(sky);
  // o gigante gasoso anelado e a lua
  const planet = new THREE.Group();
  const pc = document.createElement("canvas");
  pc.width = 512;
  pc.height = 256;
  const px = pc.getContext("2d")!;
  for (let y = 0; y < 256; y++) {
    const k = 0.5 + 0.5 * Math.sin(y * 0.09) * Math.cos(y * 0.031);
    px.fillStyle = `rgb(${Math.round(190 + 50 * k)},${Math.round(140 + 50 * k)},${Math.round(110 + 40 * k)})`;
    px.fillRect(0, y, 512, 1);
  }
  const gas = new THREE.Mesh(new THREE.SphereGeometry(120, 48, 32), new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(pc), roughness: 1, emissive: new THREE.Color("#3a2010"), emissiveIntensity: 0.3, fog: false }));
  const ring = new THREE.Mesh(new THREE.RingGeometry(150, 230, 96), new THREE.MeshBasicMaterial({ color: "#f0d2a0", transparent: true, opacity: 0.45, side: THREE.DoubleSide, fog: false }));
  ring.rotation.x = Math.PI / 2 - 0.35;
  planet.add(gas, ring);
  planet.position.set(-260, 260, -620);
  planet.rotation.z = 0.3;
  root.add(planet);
  const moon = new THREE.Mesh(new THREE.SphereGeometry(18, 24, 16), new THREE.MeshBasicMaterial({ color: "#dfeee8", fog: false }));
  moon.position.set(300, 300, -700);
  root.add(moon);
  // o chão: relevo suave com cor por altura (musgo violeta-azulado, clareiras âmbar)
  const ground = new THREE.PlaneGeometry(600, 600, 160, 160);
  ground.rotateX(-Math.PI / 2);
  const gp = ground.getAttribute("position") as THREE.BufferAttribute;
  const cols: number[] = [];
  const cA = new THREE.Color("#6fa0a8"), cB = new THREE.Color("#9a80c0"), cC = new THREE.Color("#7ab0a0"), cD = new THREE.Color("#c8b49a");
  const H = (x: number, z: number) => 1.6 * Math.sin(x * 0.03 + 1) * Math.cos(z * 0.025) + 0.8 * Math.sin(x * 0.08 + z * 0.06) + (Math.abs(x) > 60 ? (Math.abs(x) - 60) * 0.08 : 0) - (Math.abs(x - 2) < 3 && z > -80 ? 0.4 : 0);
  for (let i = 0; i < gp.count; i++) {
    const x = gp.getX(i), z = gp.getZ(i);
    const y = H(x, z);
    gp.setY(i, y);
    const k = 0.5 + 0.5 * Math.sin(x * 0.11 + z * 0.07) * Math.cos(z * 0.05);
    const c = cA.clone().lerp(cB, k).lerp(cC, Math.max(0, Math.min(1, (y + 1) * 0.25)));
    if (Math.abs(x - 2) < 2.6 && z > -80) c.lerp(cD, 0.7);
    cols.push(c.r, c.g, c.b);
  }
  ground.setAttribute("color", new THREE.Float32BufferAttribute(cols, 3));
  ground.computeVertexNormals();
  root.add(new THREE.Mesh(ground, new THREE.MeshStandardMaterial({ vertexColors: true, map: groundTex(), roughness: 0.95 })));
  // a flora
  const stemM = new THREE.MeshStandardMaterial({ color: "#d8c8b0", roughness: 0.6 });
  const stemM2 = new THREE.MeshStandardMaterial({ color: "#8a7aa8", roughness: 0.6 });
  const bulbM = new THREE.MeshStandardMaterial({ color: "#9ffff0", emissive: new THREE.Color("#6affe0"), emissiveIntensity: 1.4, roughness: 0.3 });
  const bulbM2 = new THREE.MeshStandardMaterial({ color: "#ffd0a0", emissive: new THREE.Color("#ffb070"), emissiveIntensity: 1.2, roughness: 0.3 });
  const fanM = new THREE.MeshStandardMaterial({ color: "#c0a0ff", transparent: true, opacity: 0.55, side: THREE.DoubleSide, roughness: 0.4, emissive: new THREE.Color("#4a2a8a"), emissiveIntensity: 0.4 });
  const plant = (x: number, z: number, s: number, i: number) => {
    const g = new THREE.Group();
    const y0 = H(x, z);
    const lean = (VW_RAND(i) - 0.5) * 1.2;
    const pts = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(lean * 0.3 * s, 3 * s, 0.2 * s), new THREE.Vector3(lean * s, 6 * s, -0.3 * s), new THREE.Vector3(lean * 1.6 * s, 8.5 * s, 0.4 * s)];
    const curve = new THREE.CatmullRomCurve3(pts);
    const tube = new THREE.TubeGeometry(curve, 24, 0.22 * s, 10);
    // afina para cima
    const tp = tube.getAttribute("position") as THREE.BufferAttribute;
    for (let k = 0; k < tp.count; k++) {
      const yy = tp.getY(k) / (8.5 * s);
      const p = curve.getPoint(Math.min(1, Math.max(0, yy)));
      tp.setX(k, p.x + (tp.getX(k) - p.x) * (1 - 0.6 * yy));
      tp.setZ(k, p.z + (tp.getZ(k) - p.z) * (1 - 0.6 * yy));
    }
    tube.computeVertexNormals();
    g.add(new THREE.Mesh(tube, i % 3 ? stemM : stemM2));
    // bulbos em cacho no topo e alguns pela haste
    const top = curve.getPoint(1);
    for (let k = 0; k < 5; k++) {
      const b = new THREE.Mesh(new THREE.SphereGeometry((0.35 + 0.2 * VW_RAND(i * 9 + k)) * s, 16, 12), i % 4 ? bulbM : bulbM2);
      b.position.set(top.x + (VW_RAND(i + k) - 0.5) * s, top.y + (VW_RAND(i * 2 + k) - 0.3) * 0.8 * s, top.z + (VW_RAND(i * 5 + k) - 0.5) * s);
      g.add(b);
    }
    // leques translúcidos
    for (let k = 0; k < 3; k++) {
      const p = curve.getPoint(0.35 + k * 0.18);
      const fan = new THREE.Mesh(new THREE.CircleGeometry(1.1 * s, 20, 0, Math.PI * 0.9), fanM);
      fan.position.copy(p);
      fan.rotation.set(0.3, (i + k) * 1.7, 0.6 * (k % 2 ? 1 : -1));
      g.add(fan);
    }
    g.position.set(x, y0, z);
    root.add(g);
  };
  for (let i = 0; i < 110; i++) {
    const side = i % 2 ? 1 : -1;
    const x = side * (5 + VW_RAND(i * 3) * 60), z = 20 - VW_RAND(i * 7) * 220;
    plant(x, z, 1.4 + VW_RAND(i * 11) * 2.4, i);
  }
  // arcos de pedra lisa
  const stone = new THREE.MeshStandardMaterial({ color: "#9a9aa8", roughness: 0.4, metalness: 0.1 });
  [[-60, -150, 30]].forEach(([x, z, r]) => {
    const a = new THREE.Mesh(new THREE.TorusGeometry(r, r * 0.12, 16, 48, Math.PI), stone);
    a.position.set(x, H(x, z) - 1, z);
    a.rotation.y = 0.4;
    root.add(a);
  });
  // a pedra lisa onde o velho está
  const seat = new THREE.Mesh(new THREE.SphereGeometry(1.4, 24, 16), stone);
  seat.scale.set(0.9, 0.3, 0.7);
  seat.position.set(1.2, H(1.2, -38) + 0.1, -38);
  root.add(seat);
  // esporos de luz
  const sp: number[] = [];
  for (let i = 0; i < 900; i++) sp.push((VW_RAND(i * 3) - 0.5) * 160, 0.5 + VW_RAND(i * 5) * 14, 20 - VW_RAND(i * 7) * 200);
  const sg = new THREE.BufferGeometry();
  sg.setAttribute("position", new THREE.Float32BufferAttribute(sp, 3));
  const spores = new THREE.Points(sg, new THREE.PointsMaterial({ color: "#c8fff0", size: 0.18, transparent: true, opacity: 0.85 }));
  root.add(spores);
  // a névoa no horizonte (parede de luz que abre)
  const mistM = new THREE.MeshBasicMaterial({ color: "#fff4e6", transparent: true, opacity: 0, depthWrite: false, fog: false });
  const mist = new THREE.Mesh(new THREE.PlaneGeometry(900, 160), mistM);
  mist.position.set(0, 40, -420);
  root.add(mist);
  // luzes
  root.add(new THREE.HemisphereLight("#cfeee6", "#3a2a5a", 1.3));
  const sun = new THREE.DirectionalLight("#ffd0a0", 2.2);
  sun.position.set(120, 60, -300);
  root.add(sun);
  // os Vortigaunts (silhuetas em pé, com profundidade)
  const vtex = vortTex();
  const vMat = new THREE.MeshBasicMaterial({ map: vtex, color: "#3e5a3a", transparent: true, alphaTest: 0.4, side: THREE.DoubleSide });
  const vort = (x: number, z: number, h = 1.85) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry((h * 270) / 400, h), vMat);
    m.position.set(x, H(x, z) + h / 2, z);
    root.add(m);
    return m;
  };
  return { root, H, spores, mistM, vort };
};
// 12/10 (pedido dele: os Vortigaunts trabalhando/cultivando mal ambientados): a vida da aldeia de verdade — a roça
// (sulcos de terra arada com fileiras de plantas de bulbo acesas, um canal de irrigação de água luminosa, cestos com a
// colheita), dois Vortigaunts nela, um agachado, mandando vortessência das mãos para as plantas, que crescem e acendem;
// a roda de conversa (duas silhuetas frente a frente, a pedra quente no meio, arcos verdes entre as mãos); as cabanas
// orgânicas com a porta acesa e fumaça; um no mapa riscado de luz no chão, planejando.
const buildVortLife = (H: (x: number, z: number) => number) => {
  const root = new THREE.Group();
  const soil = new THREE.MeshStandardMaterial({ color: "#3a2a24", roughness: 1 });
  const stem = new THREE.MeshStandardMaterial({ color: "#5f8a5a", roughness: 0.8 });
  const bulbM = (k: number) => new THREE.MeshStandardMaterial({ color: ["#c8ffd8", "#ffe0a8", "#d8c8ff"][k % 3], emissive: ["#5fffa0", "#ffb860", "#a888ff"][k % 3], emissiveIntensity: 0.9, roughness: 0.4 });
  // a roça: 6 sulcos entre x -11 e -4, z -9 a -19
  const plants: { g: THREE.Group; t: number }[] = [];
  for (let r = 0; r < 6; r++) {
    const x = -10.5 + r * 1.25;
    const ridge = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.22, 10), soil);
    ridge.position.set(x, H(x, -2) + 0.05, -2);
    root.add(ridge);
    for (let k = 0; k < 9; k++) {
      const z = 2.4 - k * 1.1;
      const g = new THREE.Group();
      const s = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 0.6, 6), stem);
      s.position.y = 0.3;
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 8), bulbM(r + k));
      b.position.y = 0.66;
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), stem);
      leaf.scale.set(1.4, 0.25, 0.6);
      leaf.position.set(0.12, 0.3, 0);
      g.add(s, b, leaf);
      g.position.set(x + (VW_RAND(r * 9 + k) - 0.5) * 0.12, H(x, z) + 0.15, z);
      root.add(g);
      plants.push({ g, t: VW_RAND(r * 31 + k * 7) });
    }
  }
  // o canal de irrigação (água luminosa)
  const water = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 11), new THREE.MeshBasicMaterial({ color: "#6ff6e0", transparent: true, opacity: 0.75 }));
  water.position.set(-3.6, H(-3.6, -2) + 0.05, -2);
  root.add(water);
  // cestos com a colheita
  [[-3.0, 1.5], [-3.2, -5.8]].forEach(([x, z], i) => {
    const bk = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.28, 0.42, 14, 1, true), new THREE.MeshStandardMaterial({ color: "#8a6a3a", roughness: 1, side: THREE.DoubleSide }));
    bk.position.set(x, H(x, z) + 0.21, z);
    root.add(bk);
    for (let k = 0; k < 6; k++) {
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), bulbM(i + k));
      b.position.set(x + (VW_RAND(k * 3 + i) - 0.5) * 0.4, H(x, z) + 0.42, z + (VW_RAND(k * 5 + i) - 0.5) * 0.4);
      root.add(b);
    }
  });
  // as cabanas orgânicas (cúpulas de barro com a porta acesa)
  const mud = new THREE.MeshStandardMaterial({ color: "#6a5a4a", roughness: 1 });
  const smoke: THREE.Mesh[] = [];
  [[-24, 4, 2.6], [17, -42, 3], [-2, -60, 2.4], [19, -12, 2.2]].forEach(([x, z, r], i) => {
    const d = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), mud);
    d.scale.y = 0.8;
    d.position.set(x, H(x, z) - 0.1, z);
    root.add(d);
    const door = new THREE.Mesh(new THREE.CircleGeometry(r * 0.32, 20, 0, Math.PI), new THREE.MeshBasicMaterial({ color: "#ffb860" }));
    const toCam = Math.atan2(-x, 0 - z);
    door.position.set(x + Math.sin(toCam) * r * 0.98, H(x, z) - 0.05, z + Math.cos(toCam) * r * 0.98);
    door.rotation.y = toCam;
    root.add(door);
    const lt = new THREE.PointLight("#ffb060", 3, r * 4);
    lt.position.copy(door.position).add(new THREE.Vector3(Math.sin(toCam) * 0.6, 0.5, Math.cos(toCam) * 0.6));
    root.add(lt);
    for (let k = 0; k < 4; k++) {
      const s = new THREE.Mesh(new THREE.SphereGeometry(0.5, 10, 8), new THREE.MeshBasicMaterial({ color: "#d8e8e0", transparent: true, opacity: 0.25, depthWrite: false }));
      s.userData = { x, y: H(x, z) + r * 0.8, z, k: k + i * 4 };
      root.add(s);
      smoke.push(s);
    }
  });
  // a roda de conversa: a pedra quente no meio
  const ember = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 10), new THREE.MeshStandardMaterial({ color: "#ff9a4a", emissive: "#ff6a20", emissiveIntensity: 1.4 }));
  ember.scale.y = 0.6;
  ember.position.set(8.6, H(8.6, -14.3) + 0.15, -14.3);
  root.add(ember);
  const emberL = new THREE.PointLight("#ff8a40", 4, 6);
  emberL.position.copy(ember.position).add(new THREE.Vector3(0, 0.5, 0));
  root.add(emberL);
  // o mapa riscado de luz no chão (planejando)
  const mcv = document.createElement("canvas");
  mcv.width = mcv.height = 512;
  const mg = mcv.getContext("2d")!;
  mg.strokeStyle = "rgba(141,255,168,0.95)";
  mg.lineWidth = 4;
  mg.beginPath(); mg.arc(256, 256, 220, 0, Math.PI * 2); mg.stroke();
  mg.lineWidth = 3;
  for (let i = 0; i < 9; i++) { mg.beginPath(); mg.arc(256 + Math.cos(i) * 120, 256 + Math.sin(i * 1.7) * 120, 16 + (i % 3) * 10, 0, Math.PI * 2); mg.stroke(); }
  for (let i = 0; i < 12; i++) { mg.beginPath(); mg.moveTo(256 + Math.cos(i) * 120, 256 + Math.sin(i * 1.7) * 120); mg.lineTo(256 + Math.cos(i + 1) * 120, 256 + Math.sin((i + 1) * 1.7) * 120); mg.stroke(); }
  const map = new THREE.Mesh(new THREE.CircleGeometry(1.6, 48), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(mcv), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  map.rotation.x = -Math.PI / 2;
  map.position.set(-9.2, H(-9.2, -40) + 0.06, -40);
  root.add(map);
  // os arcos de vortessência (reutilizados, refeitos a cada quadro)
  const arcM = new THREE.LineBasicMaterial({ color: "#8dffa8", transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });
  const arcs = Array.from({ length: 8 }).map(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(new Array(16 * 3).fill(0), 3));
    const l = new THREE.Line(g, arcM);
    root.add(l);
    return l;
  });
  const arcTo = (l: THREE.Line, a: THREE.Vector3, b: THREE.Vector3, seed: number, amp = 0.18) => {
    const pa = l.geometry.getAttribute("position") as THREE.BufferAttribute;
    for (let i = 0; i < 16; i++) {
      const t = i / 15;
      const v = a.clone().lerp(b, t);
      const j = Math.sin(t * Math.PI) * amp;
      v.x += (VW_RAND(seed + i * 3) - 0.5) * j * 2;
      v.y += (VW_RAND(seed + i * 5) - 0.5) * j * 2 + Math.sin(t * Math.PI) * 0.25;
      v.z += (VW_RAND(seed + i * 7) - 0.5) * j * 2;
      pa.setXYZ(i, v.x, v.y, v.z);
    }
    pa.needsUpdate = true;
    l.visible = true;
  };
  return { root, plants, smoke, arcs, arcTo, ember, emberL, map };
};
const VW_SPOTS: [number, number, string?][] = [[-7.1, -0.5, "CULTIVANDO"], [-9.6, -4.2], [7.7, -14.3, "CONVERSANDO"], [9.5, -14.3], [-10.4, -40.6], [6, -48]];
export const HL14VortWorld3D: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const lite = React.useContext(LiteCtx);
  const ctx = React.useContext(SfxCtx);
  const [wakeAt, noAt, workAt, nobodyAt, foodAt, playAt, oldAt, sitAt, mistAt, nobodySawAt, vortAt, f1At, f2At, darkAt, notGmanAt, futureAt, diffAt] = ["wakeAt", "noAt", "workAt", "nobodyAt", "foodAt", "playAt", "oldAt", "sitAt", "mistAt", "nobodySawAt", "vortAt", "f1At", "f2At", "darkAt", "notGmanAt", "futureAt", "diffAt"].map((k) => at(p, k));
  const wake = P(f, wakeAt, 45);
  const dark = P(f, darkAt, 40);
  const z = kv(f, [[0, [0, 0, 18]], [playAt, [0, 0, 10]], [oldAt, [0, 0, -22]], [sitAt, [0, 0, -27.5]], [life, [0, 0, -28]]])[2];
  const sit = P(f, sitAt, 40);
  const walking = f > playAt && f < sitAt;
  const yawT = kv(f, [[0, [-0.15, 0, 0]], [workAt, [-0.5, 0, 0]], [nobodyAt, [0.35, 0, 0]], [foodAt, [0.05, 0, 0]], [oldAt, [0, 0, 0]], [sitAt, [-0.1, 0, 0]], [mistAt, [0, 0, 0]]])[0];
  const imgOk = useVortImg();
  const W = useMemo(() => buildVortPlanet(), [imgOk]); // eslint-disable-line react-hooks/exhaustive-deps
  const vorts = useMemo(() => VW_SPOTS.map(([x, zz]) => W.vort(x, zz)), [W]);
  // 12/10 proposta 2 (pedido dele: silhuetas que surgem do nada, ninguém andando): o Vortigaunt do HL:Alyx, o modelo do
  // jogo, com os gestos dele (o modelo não tem ciclo de andar) — já estão lá desde o começo, trabalhando, conversando,
  // no mapa; o da comida e o velho também
  const RV = useHla("vort_hla.glb", 8, 1.95, { g: "vort_substation_2019_vort_catwalk" });
  const food = useMemo(() => W.vort(1.6, 0), [W]);
  const old = useMemo(() => W.vort(0.9, -38, 1.5), [W]);
  const FN = useMemo(() => buildFinals(), []);
  const VL = useMemo(() => buildVortLife(W.H), [W]);
  void old;
  const gy = W.H(0, z) + 1.65 - 0.6 * sit + (walking ? Math.abs(Math.sin(f / 4.5)) * 0.05 : 0);
  const camPos: V = [0.4 * Math.sin(f / 80) - 0.4 * sit, gy, z];
  const camTgt: V = [camPos[0] + Math.sin(yawT) * 10, gy + (f >= mistAt ? 1.4 : 0.2) - 0.3 * (1 - wake), z - Math.cos(yawT) * 10];
  const Stage3: React.FC = () => {
    const { camera, scene, invalidate } = useThree();
    scene.fog = new THREE.FogExp2("#7aa89a", 0.0035);
    const cam = camera as THREE.PerspectiveCamera;
    cam.fov = 54;
    cam.near = 0.1;
    cam.far = 2000;
    cam.position.set(...camPos);
    cam.lookAt(...camTgt);
    cam.updateProjectionMatrix();
    // vivos: esporos subindo devagar, os Vortigaunts olhando para a câmera, o da comida andando
    (W.spores.geometry.getAttribute("position") as THREE.BufferAttribute).needsUpdate = false;
    W.spores.position.y = (f * 0.01) % 2;
    vorts.forEach((m, i) => {
      m.lookAt(cam.position.x, m.position.y, cam.position.z);
      m.visible = !RV.length && f >= [workAt, workAt + 10, nobodyAt, nobodyAt + 6, noAt, noAt + 10][i];
    });
    if (RV.length) {
      // onde e para onde cada um olha: roça (2, viradas para as plantas), conversa (frente a frente), mapa, um longe,
      // o da comida (vem devagar), o velho na pedra
      const spots: [number, number, number, number, number][] = [
        [-7.1, -0.5, -9, 0.5, 4], [-9.6, -4.2, -8, -2, 13], [7.7, -14.3, 9.5, -14.3, 22], [9.5, -14.3, 7.7, -14.3, 31], [-10.4, -40.6, -9.2, -40, 40], [6, -48, 0, -40, 49],
        [1.6, Math.min(-2, z - 6 - Math.max(0, (f - foodAt) / 30) * 0.6), cam.position.x, cam.position.z, 8], [0.9, -38, 0, 0, 2.2],
      ];
      RV.forEach((A, i) => {
        const [x, zz, lx, lz, t0] = spots[i];
        if (A.root.parent !== W.root) W.root.add(A.root);
        A.root.position.set(x, W.H(x, zz), zz);
        A.root.rotation.y = Math.atan2(lx - x, lz - zz);
        A.root.visible = i !== 6 || (f >= foodAt - 30 && f < oldAt);
        A.set("g", i === 7 ? 2.2 : t0 + f / 30);
      });
    }
    food.visible = !RV.length && f >= foodAt && f < oldAt;
    food.position.z = z - 3 - Math.max(0, (f - foodAt) / 30) * 1.2;
    food.position.x = 1.6;
    food.position.y = W.H(1.6, food.position.z) + 0.92;
    food.lookAt(cam.position.x, food.position.y, cam.position.z);
    old.visible = !RV.length && f >= oldAt;
    old.lookAt(cam.position.x, old.position.y, cam.position.z);
    W.mistM.opacity = 0;
    vortTex();
    // a vida da aldeia
    if (VL.root.parent !== W.root) W.root.add(VL.root);
    const grow = P(f, workAt - 20, 120);
    VL.plants.forEach(({ g, t }) => {
      const k = Math.min(1, Math.max(0.25, grow * 1.4 - t * 0.5));
      g.scale.setScalar(k);
      g.rotation.z = 0.05 * Math.sin(f / 30 + t * 9);
    });
    VL.smoke.forEach((s) => {
      const u = ((f / 140 + (s.userData.k as number) * 0.25) % 1 + 1) % 1;
      s.position.set((s.userData.x as number) + Math.sin(u * 4 + (s.userData.k as number)) * 0.4, (s.userData.y as number) + u * 5, s.userData.z as number);
      s.scale.setScalar(0.6 + u * 1.6);
      (s.material as THREE.MeshBasicMaterial).opacity = 0.22 * (1 - u);
    });
    VL.emberL.intensity = 3.5 + 0.8 * Math.sin(f / 4) + 0.5 * Math.sin(f / 2.3);
    VL.arcs.forEach((l) => (l.visible = false));
    // agachado na roça: as mãos mandam vortessência para as plantas da frente (o arco pula de planta em planta)
    const v0 = vorts[0].position, v1 = vorts[1].position;
    if (vorts[0].visible) {
      const tgt = VL.plants[Math.floor(f / 18) % 9 + 9 * 3].g.position;
      VL.arcTo(VL.arcs[0], new THREE.Vector3(v0.x + 0.3, v0.y - 0.05, v0.z), tgt.clone().add(new THREE.Vector3(0, 0.6, 0)), Math.floor(f / 2) * 13);
      VL.arcTo(VL.arcs[1], new THREE.Vector3(v0.x - 0.2, v0.y - 0.1, v0.z), tgt.clone().add(new THREE.Vector3(0, 0.6, 0)), Math.floor(f / 2) * 17 + 5);
    }
    if (vorts[1].visible && Math.floor(f / 40) % 2 === 0) {
      const tgt = VL.plants[Math.floor(f / 24) % 9 + 9 * 1].g.position;
      VL.arcTo(VL.arcs[2], new THREE.Vector3(v1.x + 0.3, v1.y, v1.z), tgt.clone().add(new THREE.Vector3(0, 0.6, 0)), Math.floor(f / 2) * 19 + 3);
    }
    // a conversa: arcos curtos entre as mãos, de vez em quando
    const v2 = vorts[2].position, v3 = vorts[3].position;
    if (vorts[2].visible && vorts[3].visible && Math.sin(f / 22) > 0.3) {
      VL.arcTo(VL.arcs[3], new THREE.Vector3(v2.x + 0.35, v2.y + 0.05, v2.z), new THREE.Vector3(v3.x - 0.35, v3.y + 0.05, v3.z), Math.floor(f / 2) * 23, 0.12);
    }
    // o do mapa: aponta e o mapa acende onde ele toca
    const v4 = vorts[4].position;
    if (vorts[4].visible) VL.arcTo(VL.arcs[4], new THREE.Vector3(v4.x + 0.3, v4.y, v4.z), VL.map.position.clone().add(new THREE.Vector3(Math.cos(f / 40) * 0.8, 0.05, Math.sin(f / 40) * 0.8)), Math.floor(f / 2) * 29, 0.1);
    (VL.map.material as THREE.MeshBasicMaterial).opacity = 0.75 + 0.25 * Math.sin(f / 10);
    // as silhuetas: o da roça agachado; os dois da conversa de frente um para o outro
    vorts[0].scale.set(1, 0.78, 1);
    vorts[0].position.y = W.H(-7.1, -0.5) + (1.85 * 0.78) / 2;
    vorts[2].scale.x = -1;
    // os dois finais no céu
    if (FN.root.parent !== W.root) W.root.add(FN.root);
    const fz = z - 70, fy = gy + 24;
    const show = P(f, diffAt, 40) * (1 - P(f, darkAt, 24));
    FN.root.visible = show > 0;
    FN.A.g.position.set(-19, fy, fz);
    FN.B.g.position.set(19, fy, fz);
    [FN.A, FN.B].forEach((E, k) => {
      E.g.scale.setScalar(2.4 * (0.6 + 0.4 * show));
      E.earth.rotation.y = f * 0.004 + k;
      E.clouds.rotation.y = f * 0.0055 + k;
      E.rings.forEach((r, j) => {
        r.lookAt(camera.position);
        r.rotateZ(f * 0.01 * (j ? -1 : 1));
        (r.material as THREE.MeshBasicMaterial).opacity = 0.75 * show;
      });
      (E.earth.material as THREE.MeshStandardMaterial).opacity = show;
      (E.clouds.material as THREE.MeshStandardMaterial).opacity = 0.8 * show;
      E.halo.material.opacity = 0.75 * show;
    });
    // final 1: o halo e os anéis viram vermelho (a certeza de que escolheu errado)
    const wrong = P(f, f1At + 60, 30);
    FN.A.halo.material.color.set(new THREE.Color("#8dffa8").lerp(new THREE.Color("#ff4a3a"), wrong));
    FN.A.rings.forEach((r) => (r.material as THREE.MeshBasicMaterial).color.set(new THREE.Color("#8dffa8").lerp(new THREE.Color("#ff4a3a"), wrong)));
    // final 2: a Terra vira pó e se espalha; sobra o anel vazio
    const lost = P(f, f2At + 10, 70);
    FN.B.earth.visible = lost < 0.02;
    FN.B.clouds.visible = lost < 0.02;
    FN.dust.visible = lost >= 0.02;
    const pa = FN.dust.geometry.getAttribute("position") as THREE.BufferAttribute;
    for (let i = 0; i < pa.count; i++) {
      const s = lost * (2.5 + 3 * rnd(i * 13));
      pa.setXYZ(i, FN.pos0[i * 3] + FN.dir[i * 3] * s, FN.pos0[i * 3 + 1] + FN.dir[i * 3 + 1] * s, FN.pos0[i * 3 + 2] + FN.dir[i * 3 + 2] * s);
    }
    pa.needsUpdate = true;
    (FN.dust.material as THREE.PointsMaterial).opacity = show * (1 - 0.85 * P(f, f2At + 50, 60));
    FN.B.halo.material.opacity = 0.75 * show * (1 - 0.6 * lost);
    invalidate();
    return <primitive object={W.root} />;
  };
  const pr = projector({ pos: camPos, tgt: camTgt, fov: 54 });
  const lab = (pt: V, text: string, sub?: string) => {
    const q = pr(pt);
    return q ? (
      <g key={text}>
        <text x={q.x} y={q.y - 10} textAnchor="middle" fill={GREEN} fontFamily={MONO} fontSize={16} letterSpacing={3} style={{ paintOrder: "stroke", stroke: "#000", strokeWidth: 4 }}>{text}</text>
        {sub ? <text x={q.x} y={q.y + 12} textAnchor="middle" fill="#f2f0f7" fontFamily={MONO} fontSize={13} letterSpacing={2} style={{ paintOrder: "stroke", stroke: "#000", strokeWidth: 4 }}>{sub}</text> : null}
      </g>
    ) : null;
  };
  const eye = { x: camPos[0], y: -camPos[2], z: camPos[1], yaw: yawT, pitch: 0, F: 1000 };
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <AbsoluteFill style={{ opacity: wake }}>
        {ctx.mode === "collect" || !imgOk || !RV.length ? null : (
          <ThreeCanvas frameloop="demand" width={1920} height={1080} style={{ position: "absolute", inset: 0 }} dpr={lite ? 0.75 : 1} gl={{ antialias: true }} camera={{ fov: 54, position: [0, 2, 18], near: 0.1, far: 2000 }}>
            <Stage3 />
          </ThreeCanvas>
        )}
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          {f >= workAt && f < oldAt ? lab([-7.1, W.H(-7.1, -0.5) + 2.0, -0.5], "CULTIVANDO") : null}
          {f >= nobodyAt && f < oldAt ? lab([8.6, W.H(8.6, -14.3) + 2.4, -14.3], "CONVERSANDO") : null}
          {f >= foodAt && f < oldAt ? lab([1.6, W.H(1.6, z - 4) + 2.3, z - 3 - Math.max(0, (f - foodAt) / 30) * 1.2], "OFERECE COMIDA", "E CONTINUA ANDANDO") : null}
          {f >= oldAt && f < f1At ? lab([0.9, W.H(0.9, -38) + 1.8, -38], "O VORTIGAUNT VELHO", f >= vortAt ? "NÃO SABE SE FOI UMA VITÓRIA" : "OLHANDO O CÉU") : null}
        </svg>
      </AbsoluteFill>
      {/* a névoa no horizonte abrindo: um brilho suave que sobe da linha do horizonte */}
      {f >= mistAt ? <AbsoluteFill style={{ background: `radial-gradient(ellipse 70% 22% at 50% 52%, rgba(255,246,230,${0.55 * P(f, mistAt, 120)}), rgba(255,246,230,0) 100%)`, pointerEvents: "none" }} /> : null}
      <Kin kind="light" t0={nobodySawAt} until={f1At} top={120} size={46} col="#fff6e0" text="pela primeira vez, ninguém viu o que vem depois" />
      {f >= f1At && f < darkAt + 20 ? (() => {
        const fz = z - 70, fy = gy + 24;
        const o = 1 - P(f, darkAt, 20);
        const lbl = (x: number, t0: number, n: string, a: string, b: string, bAt: number, col: string, bCol: string, left: boolean) => {
          const q = pr([x, fy - 12.5, fz]);
          if (!q) return null;
          return (
            <div key={n} style={{ position: "absolute", left: q.x - 260, top: q.y + 6, width: 520, textAlign: "center", fontFamily: MONO, opacity: o * P(f, t0, 12), transform: `translateY(${(1 - P(f, t0, 14)) * 16}px)` }}>
              <div style={{ fontSize: 15, letterSpacing: 8, color: col, textShadow: "0 2px 10px #000" }}>{n}</div>
              <div style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif", fontWeight: 800, fontSize: 40, letterSpacing: 1, color: "#f6f2ea", marginTop: 4, textShadow: "0 3px 18px rgba(0,0,0,0.9)" }}>{a}</div>
              {f >= bAt ? <div style={{ display: "inline-block", marginTop: 10, padding: "8px 16px", borderRadius: 6, background: "rgba(6,8,10,0.72)", borderTop: `1.5px solid ${bCol}`, fontSize: 17, letterSpacing: 3, color: bCol, opacity: P(f, bAt, 12), textShadow: "0 2px 10px #000" }}>{b}</div> : null}
            </div>
          );
          void left;
        };
        return (
          <>
            {lbl(-19, f1At, "FINAL 1", "Salva a Terra", "E A CERTEZA DE QUE ESCOLHEU ERRADO", f1At + 60, "#9fe6ff", "#ff6a5a", true)}
            {lbl(19, f2At, "FINAL 2", "Perde a Terra", "E NUNCA A CONFIRMAÇÃO DE QUE ESCOLHEU CERTO", f2At + 60, GREEN, CREAM, false)}
          </>
        );
      })() : null}
      {dark > 0 ? (
        <AbsoluteFill style={{ background: `rgba(0,0,0,${dark})` }}>
          <Kin kind="glitch" t0={notGmanAt} until={futureAt} top={430} size={46} text="não é o G-Man que vem buscar o Gordon" />
          <Kin kind="rise" t0={futureAt} top={480} size={54} col={GREEN} text="um futuro que ninguém conseguiu prever" />
        </AbsoluteFill>
      ) : null}
      <Hud f={f} yaw={eye.yaw} eye={eye} blips={[]} msg={f >= playAt && f < oldAt ? "O FINAL AINDA É JOGÁVEL" : undefined} msgCol={GREEN} o={(1 - dark) * wake} />
      <AbsoluteFill style={{ background: "#000", opacity: interpolate(f, [life - 6, life], [0, 1], C), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ================================================================================================= 1:47:03 o cisne negro (3D)
// 12/10 (pedido dele: o tabuleiro das linhas ficava parado mais de um minuto, sem som, nada envolvente): no espaço escuro,
// dezenas de linhas do tempo de luz crescem de longe e chegam todas ao MESMO ponto — o catalisador — e cada chegada é um
// clarão; pulsos de energia correm por elas. A câmera anda junto da nossa linha (âmbar, do Gordon). Vencedores e durações
// diferentes (chamadas nas linhas), mas o mesmo evento. No cisne negro a nossa linha desvia antes de chegar e acaba no
// escuro; o catalisador racha e falha. "Nunca foi o Combine / a humanidade / a perpetuidade" (riscados nas próprias linhas);
// "o que importava era o catalisador acontecer": ele explode de luz → a câmera recua: o catalisador é um nó de uma estrutura
// imensa de outros catalisadores — a arquitetura dos empregadores — com um buraco apagado onde estava o nosso.
const SW_C: V = [0, 0, -160];
const glowTex = (() => {
  let t: THREE.Texture | null = null;
  return () => {
    if (t) return t;
    const cv = document.createElement("canvas");
    cv.width = cv.height = 128;
    const g = cv.getContext("2d")!;
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, "rgba(255,255,255,1)");
    gr.addColorStop(0.25, "rgba(255,255,255,0.55)");
    gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr;
    g.fillRect(0, 0, 128, 128);
    t = new THREE.CanvasTexture(cv);
    return t;
  };
})();
type SwLine = { curve: THREE.CatmullRomCurve3; tube: THREE.Mesh; mat: THREE.MeshBasicMaterial; t0: number; dur: number; kind: number; packets: THREE.Sprite[] };
const buildSwan = () => {
  const root = new THREE.Group();
  const tex = glowTex();
  const C = new THREE.Vector3(...SW_C);
  const spr = (col: string, s: number, o = 1) => {
    const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: col, transparent: true, opacity: o, blending: THREE.AdditiveBlending, depthWrite: false }));
    m.scale.setScalar(s);
    return m;
  };
  // estrelas e poeira violeta ao fundo
  const sp: number[] = [];
  for (let i = 0; i < 1800; i++) {
    const a = rnd(i) * Math.PI * 2, b = Math.acos(2 * rnd(i + 0.5) - 1), r = 900 + rnd(i * 3) * 600;
    sp.push(Math.sin(b) * Math.cos(a) * r, Math.cos(b) * r, Math.sin(b) * Math.sin(a) * r - 200);
  }
  const sg = new THREE.BufferGeometry();
  sg.setAttribute("position", new THREE.Float32BufferAttribute(sp, 3));
  root.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: "#c9c2ff", size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0.6 })));
  for (let i = 0; i < 14; i++) {
    const n = spr(["#3a1f6a", "#1e2a5a", "#4a1f4a"][i % 3], 500 + rnd(i * 9) * 500, 0.35);
    n.position.set((rnd(i * 2) - 0.5) * 1400, (rnd(i * 4) - 0.5) * 700, -500 - rnd(i * 6) * 700);
    root.add(n);
  }
  // o catalisador: núcleo, halo e anéis girando
  const cat = new THREE.Group();
  cat.position.copy(C);
  const core = spr("#ffffff", 26);
  const halo = spr("#c79bff", 90, 0.7);
  cat.add(halo, core);
  const rings = [0, 1, 2].map((i) => {
    const r = new THREE.Mesh(new THREE.TorusGeometry(10 + i * 6, 0.25, 6, 96), new THREE.MeshBasicMaterial({ color: i === 1 ? "#ffffff" : "#c79bff", transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }));
    r.rotation.set(rnd(i) * 3, rnd(i + 3) * 3, 0);
    cat.add(r);
    return r;
  });
  root.add(cat);
  // as linhas: vêm de longe (atrás e dos lados) e terminam no catalisador
  const COLS = ["#ff6a5a", "#7dffa8", "#9fd8ff"];
  const lines: SwLine[] = Array.from({ length: 38 }).map((_, i) => {
    const kind = i % 3;
    const a = rnd(i * 7) * Math.PI * 2, rr = 70 + rnd(i * 5) * 110;
    const p0 = new THREE.Vector3(Math.cos(a) * rr, Math.sin(a) * rr * 0.6, 160 + rnd(i * 3) * 120);
    const m1 = new THREE.Vector3(p0.x * 0.8 + (rnd(i * 11) - 0.5) * 60, p0.y * 0.7 + (rnd(i * 13) - 0.5) * 40, 70 - rnd(i) * 30);
    const m2 = new THREE.Vector3(p0.x * 0.35 + (rnd(i * 17) - 0.5) * 30, p0.y * 0.3, -60);
    const curve = new THREE.CatmullRomCurve3([p0, m1, m2, C.clone()]);
    const mat = new THREE.MeshBasicMaterial({ color: COLS[kind], transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false });
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 140, 0.35, 5, false), mat);
    root.add(tube);
    const packets = [0, 1].map(() => {
      const s = spr(COLS[kind], 5, 0.95);
      root.add(s);
      return s;
    });
    return { curve, tube, mat, t0: 6 + i * 9 + rnd(i * 19) * 20, dur: 150 + rnd(i * 23) * 160, kind, packets };
  });
  // a nossa linha (âmbar): até o ponto de desvio e o galho que vai para o escuro; o rastro tracejado de onde ela iria
  const O0 = [new THREE.Vector3(10, -5, 230), new THREE.Vector3(8, -4, 120), new THREE.Vector3(6, -2, 40), new THREE.Vector3(3, -1, -50)];
  const ours = new THREE.CatmullRomCurve3([...O0, new THREE.Vector3(1, -0.5, -110)]);
  const branch = new THREE.CatmullRomCurve3([new THREE.Vector3(1, -0.5, -110), new THREE.Vector3(18, -12, -128), new THREE.Vector3(46, -34, -126), new THREE.Vector3(70, -58, -112)]);
  const amb = new THREE.MeshBasicMaterial({ color: "#ffb22e", transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false });
  const oursT = new THREE.Mesh(new THREE.TubeGeometry(ours, 160, 0.28, 6, false), amb);
  const brT = new THREE.Mesh(new THREE.TubeGeometry(branch, 100, 0.28, 6, false), amb);
  const head = spr("#ffd27a", 14);
  const tip = spr("#ffffff", 7);
  root.add(oursT, brT, head, tip);
  const ghostPts = new THREE.LineCurve3(new THREE.Vector3(1, -0.5, -110), C.clone()).getPoints(20);
  const ghost = new THREE.Line(new THREE.BufferGeometry().setFromPoints(ghostPts), new THREE.LineDashedMaterial({ color: "#ffb22e", dashSize: 2, gapSize: 2, transparent: true, opacity: 0.5 }));
  ghost.computeLineDistances();
  root.add(ghost);
  // o fim da nossa linha: estilhaços escuros que se espalham (o cisne negro)
  const shards = Array.from({ length: 40 }).map((_, i) => {
    const m = new THREE.Mesh(new THREE.TetrahedronGeometry(0.6 + rnd(i) * 1.4), new THREE.MeshBasicMaterial({ color: i % 4 ? "#0b0710" : "#6a3cff", transparent: true, opacity: 1 }));
    m.userData.v = new THREE.Vector3(rnd(i * 3) - 0.5, rnd(i * 5) - 0.5, rnd(i * 7) - 0.5).normalize().multiplyScalar(0.12 + rnd(i * 9) * 0.25);
    m.userData.w = new THREE.Vector3(rnd(i), rnd(i + 1), rnd(i + 2)).multiplyScalar(0.08);
    root.add(m);
    return m;
  });
  // a arquitetura: outros catalisadores numa esfera enorme (o nosso é um nó da frente) ligados entre si
  const LC = C.clone().add(new THREE.Vector3(0, 0, -420));
  const N = 220;
  const nodes: THREE.Vector3[] = [C.clone()];
  for (let i = 1; i < N; i++) {
    const y = 1 - (i / (N - 1)) * 2, r = Math.sqrt(1 - y * y), th = i * 2.39996;
    const v = new THREE.Vector3(Math.cos(th) * r, y, Math.sin(th) * r).multiplyScalar(420).add(LC);
    if (v.distanceTo(C) > 30) nodes.push(v);
  }
  const arch = new THREE.Group();
  const nodeSpr = nodes.map((v, i) => {
    const s = spr(i === 0 ? "#ffffff" : "#e6dcff", i === 0 ? 0 : 10, 0.9);
    s.position.copy(v);
    arch.add(s);
    return s;
  });
  const seg: number[] = [];
  nodes.forEach((a, i) => {
    const near = nodes.map((b, j) => [a.distanceTo(b), j] as [number, number]).filter(([, j]) => j !== i).sort((x, y) => x[0] - y[0]).slice(0, 3);
    near.forEach(([, j]) => { if (j > i) seg.push(a.x, a.y, a.z, nodes[j].x, nodes[j].y, nodes[j].z); });
  });
  const eg = new THREE.BufferGeometry();
  eg.setAttribute("position", new THREE.Float32BufferAttribute(seg, 3));
  const archMat = new THREE.LineBasicMaterial({ color: "#9a7cff", transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending, depthWrite: false });
  arch.add(new THREE.LineSegments(eg, archMat));
  root.add(arch);
  return { root, cat, core, halo, rings, lines, ours, branch, oursT, brT, head, tip, ghost, shards, arch, archMat, nodeSpr };
};
export const HL13Swan3D: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const lite = React.useContext(LiteCtx);
  const ctx = React.useContext(SfxCtx);
  const [oursAt, diffAt, swanAt, neverAt, humAt, perpAt, whatAt, archAt] = ["oursAt", "diffAt", "swanAt", "neverAt", "humAt", "perpAt", "whatAt", "archAt"].map((k) => at(p, k));
  const S = useMemo(() => buildSwan(), []);
  // a nossa linha: a cabeça corre do começo até o ponto de desvio (no cisne negro) e depois segue o galho
  const runO = interpolate(f, [oursAt, swanAt], [0.3, 1], { ...C, easing: Easing.inOut(Easing.sin) });
  const runB = interpolate(f, [swanAt, swanAt + 60], [0, 1], { ...C, easing: Easing.out(Easing.cubic) });
  const headP = runB > 0 ? S.branch.getPointAt(runB) : S.ours.getPointAt(runO);
  const crack = P(f, swanAt + 50, 30);
  const boom = P(f, whatAt, 20) * (1 - P(f, archAt + 10, 40));
  const pull = interpolate(f, [archAt, archAt + 150], [0, 1], { ...C, easing: Easing.inOut(Easing.cubic) });
  // a câmera: atrás da cabeça da nossa linha → sobe para ver o feixe todo convergindo → segue o desvio → de frente para o
  // catalisador → recua até ver a arquitetura inteira
  const behind: V = [headP.x + 6, headP.y + 4, headP.z + 26];
  const cam = {
    pos: kv(f, [[0, behind], [diffAt, [headP.x + 10, headP.y + 6, headP.z + 30]], [diffAt + 90, [-60, 40, 40]], [swanAt - 10, [-30, 20, -30]], [swanAt + 50, [40, -10, -60]], [neverAt, [95, 42, -125]], [whatAt, [78, 32, -112]], [archAt, [66, 28, -100]], [archAt + 150, [0, 140, 420]]]),
    tgt: kv(f, [[0, [headP.x, headP.y, headP.z - 40]], [diffAt, [headP.x, headP.y, headP.z - 40]], [diffAt + 90, [0, 0, -120]], [swanAt - 10, [2, -1, -120]], [swanAt + 50, [40, -30, -125]], [neverAt, [0, 0, -150]], [whatAt, [0, 0, -160]], [archAt, [0, 0, -160]], [archAt + 150, [0, 0, -500]]]),
    fov: 52,
  };
  // as chegadas: cada linha que chega ao catalisador dá um clarão
  let flash = 0;
  S.lines.forEach((L) => {
    const t = (f - L.t0) / L.dur;
    if (t >= 1 && t < 1 + 18 / L.dur) flash = Math.max(flash, 1 - (t - 1) * (L.dur / 18));
  });
  const Stage: React.FC = () => {
    const { camera, invalidate } = useThree();
    const c3 = camera as THREE.PerspectiveCamera;
    c3.fov = cam.fov;
    c3.near = 0.3;
    c3.far = 4000;
    c3.position.set(...cam.pos);
    c3.lookAt(...cam.tgt);
    c3.updateProjectionMatrix();
    S.lines.forEach((L, i) => {
      const t = Math.max(0, Math.min(1, (f - L.t0) / L.dur));
      const idx = L.tube.geometry.index!.count;
      L.tube.geometry.setDrawRange(0, Math.floor(140 * t) * 5 * 6); void idx;
      // depois do cisne negro, o resto das linhas apaga um pouco; no "o que importava", elas acendem todas
      L.mat.opacity = (0.5 + 0.2 * Math.sin(f / 9 + i)) * (1 - 0.45 * crack) * (1 + boom);
      // os riscados: as vermelhas (Combine venceu) no "nunca foi o Combine", as verdes no "nunca foi a humanidade"
      const off = L.kind === 0 ? P(f, neverAt + 6, 14) : L.kind === 1 ? P(f, humAt + 6, 14) : P(f, perpAt + 6, 14);
      L.mat.opacity *= 1 - 0.6 * off * (1 - boom);
      L.packets.forEach((s, k) => {
        const u = (((f - L.t0) / 80 + k * 0.5 + i * 0.13) % 1 + 1) % 1;
        const uu = Math.min(u, t);
        s.visible = t > 0.05;
        s.position.copy(L.curve.getPointAt(uu));
        s.material.opacity = 0.9 * (1 - 0.5 * crack);
      });
    });
    const oi = S.oursT.geometry.index!.count;
    S.oursT.geometry.setDrawRange(0, Math.floor(160 * runO) * 6 * 6); void oi;
    const bi = S.brT.geometry.index!.count;
    S.brT.geometry.setDrawRange(0, Math.floor(100 * runB) * 6 * 6); void bi;
    S.head.position.copy(headP);
    S.tip.position.copy(headP);
    S.head.material.opacity = 1 - P(f, swanAt + 70, 30);
    S.tip.material.opacity = S.head.material.opacity;
    S.ghost.visible = f >= swanAt + 30;
    (S.ghost.material as THREE.LineDashedMaterial).opacity = 0.5 * P(f, swanAt + 30, 20);
    const end = S.branch.getPointAt(1);
    S.shards.forEach((m) => {
      const g = Math.max(0, f - (swanAt + 58));
      m.visible = g > 0;
      m.position.copy(end).addScaledVector(m.userData.v as THREE.Vector3, g * 1.1);
      m.rotation.set(g * (m.userData.w as THREE.Vector3).x, g * (m.userData.w as THREE.Vector3).y, 0);
      (m.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 1 - g / 160);
    });
    // o catalisador: pulsa, clareia a cada chegada; depois do cisne negro racha (falha); explode de luz no "o que importava"
    const fail = crack > 0 && rnd(Math.floor(f / 2) * 7) > 0.8 ? 0.35 : 1;
    const base = (1 + 0.08 * Math.sin(f / 5) + 0.6 * flash) * fail;
    S.core.scale.setScalar(26 * base * (1 + 2.2 * boom));
    S.halo.scale.setScalar(90 * base * (1 + 1.5 * boom));
    S.halo.material.color.set(crack > 0.5 && boom < 0.2 ? "#ff6a8a" : "#c79bff");
    S.rings.forEach((r, i) => {
      r.rotation.x += 0; // estável por quadro
      r.rotation.set(f * 0.01 * (i + 1), f * 0.013 * (2 - i), 0);
      (r.material as THREE.MeshBasicMaterial).opacity = 0.55 * fail;
    });
    // a arquitetura aparece no recuo
    S.archMat.opacity = 0.35 * P(f, archAt + 30, 60);
    S.nodeSpr.forEach((s, i) => {
      if (i === 0) return;
      s.visible = f >= archAt + 20 + (i % 60);
      s.material.opacity = 0.9 * P(f, archAt + 20 + (i % 60), 20) * (0.7 + 0.3 * Math.sin(f / 7 + i));
    });
    // o buraco: o nosso nó apaga no fim
    S.cat.visible = true;
    S.cat.scale.setScalar(1 - 0.85 * P(f, archAt + 120, 40));
    invalidate();
    return <primitive object={S.root} />;
  };
  const pr = projector(cam);
  const lp = (i: number, u: number): V => {
    const v = S.lines[i].curve.getPointAt(u);
    return [v.x, v.y, v.z];
  };
  const strike = (from: number) => P(f, from + 6, 10);
  return (
    <AbsoluteFill style={{ background: "#03020a", overflow: "hidden" }}>
      {ctx.mode === "collect" ? null : (
        <ThreeCanvas frameloop="demand" width={1920} height={1080} style={{ position: "absolute", inset: 0 }} dpr={lite ? 0.75 : 1} gl={{ antialias: true }} camera={{ fov: 52, position: [0, 0, 100], near: 0.3, far: 4000 }}>
          <Stage />
        </ThreeCanvas>
      )}
      {flash > 0 ? <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 50%, rgba(220,200,255,${0.12 * flash}), rgba(0,0,0,0) 60%)`, pointerEvents: "none" }} /> : null}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <Call3 pr={pr} f={f} pt={[headP.x, headP.y, headP.z]} from={oursAt + 6} until={diffAt + 40} text="A NOSSA LINHA" sub="GORDON · O FINAL 2" col={AMB} dx={120} dy={-80} />
        <Call3 pr={pr} f={f} pt={lp(0, 0.55)} from={diffAt + 20} until={swanAt - 10} text="COMBINE VENCEM" sub="DURA 20 ANOS" col="#ff6a5a" dx={-120} dy={-60} />
        <Call3 pr={pr} f={f} pt={lp(1, 0.6)} from={diffAt + 60} until={swanAt - 10} text="HUMANOS VENCEM" sub="DURA 300 ANOS" col={GREEN} dx={120} dy={-70} />
        <Call3 pr={pr} f={f} pt={lp(2, 0.62)} from={diffAt + 100} until={swanAt - 10} text="NINGUÉM VENCE" sub="DURA 3 DIAS" col={ICE} dx={-120} dy={70} />
        <Call3 pr={pr} f={f} pt={SW_C} from={diffAt + 150} until={swanAt + 20} text="O MESMO EVENTO" sub="O CATALISADOR · TODAS AS LINHAS" col="#e6dcff" dx={140} dy={-90} />
        <Call3 pr={pr} f={f} pt={[S.branch.getPointAt(1).x, S.branch.getPointAt(1).y, S.branch.getPointAt(1).z]} from={swanAt + 50} until={neverAt} text="O CISNE NEGRO" sub="UMA LINHA QUE ACABA SEM O CATALISADOR" col={AMB} dx={-140} dy={-80} />
        {f >= swanAt + 70 && f < neverAt ? (() => {
          const q = pr(SW_C);
          return q ? <text x={q.x} y={q.y + 130} textAnchor="middle" fill="#ff8aa0" fontFamily={MONO} fontSize={20} letterSpacing={5} opacity={P(f, swanAt + 70, 10)} style={{ paintOrder: "stroke", stroke: "#000", strokeWidth: 5 }}>A CONVERGÊNCIA QUEBRA</text> : null;
        })() : null}
      </svg>
      {/* os três "nunca foi" — riscados na hora da fala */}
      {f >= neverAt && f < whatAt + 10 ? (
        <div style={{ position: "absolute", left: 120, top: 150, fontFamily: MONO, opacity: 1 - P(f, whatAt, 10) }}>
          {([[neverAt, "O COMBINE VENCER", "#ff6a5a"], [humAt, "A HUMANIDADE VENCER", GREEN], [perpAt, "ALCANÇAR A PERPETUIDADE", CREAM]] as [number, string, string][]).map(([t0, s, col]) => (f >= t0 ? (
            <div key={s} style={{ position: "relative", display: "table", marginBottom: 14, padding: "8px 14px", background: "rgba(6,4,14,0.75)", borderLeft: `3px solid ${col}`, fontSize: 24, letterSpacing: 4, color: col, opacity: P(f, t0, 8) * (1 - 0.45 * strike(t0)), transform: `translateX(${(1 - P(f, t0, 10)) * -30}px)` }}>
              <span style={{ fontSize: 13, letterSpacing: 4, color: "rgba(242,240,247,0.55)", marginRight: 12 }}>NUNCA FOI</span>{s}
              <div style={{ position: "absolute", left: 8, right: 8, top: "52%", height: 3, background: col, transform: `scaleX(${strike(t0)})`, transformOrigin: "left" }} />
            </div>
          ) : null))}
        </div>
      ) : null}
      {f >= whatAt && f < archAt + 20 ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 150, textAlign: "center", fontFamily: "'Inter', 'Segoe UI', sans-serif", fontWeight: 300, fontSize: 46, letterSpacing: 6, color: "#f3ecff", opacity: 1 - P(f, archAt + 8, 12) }}>
          {"O QUE IMPORTAVA ERA O CATALISADOR ACONTECER".split("").map((ch, k) => {
            const t = whatAt + 4 + k * 0.9;
            const glow = 1 - P(f, t + 4, 24);
            return <span key={k} style={{ opacity: P(f, t, 8), textShadow: `0 0 ${6 + 22 * glow}px rgba(200,170,255,${0.35 + 0.5 * glow}), 0 3px 16px rgba(0,0,0,0.9)` }}>{ch}</span>;
          })}
        </div>
      ) : null}
      {f >= archAt + 60 ? (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 120, textAlign: "center", fontFamily: MONO, opacity: P(f, archAt + 60, 14) }}>
          <div style={{ fontSize: 30, letterSpacing: 10, color: "#d9ccff", textShadow: "0 0 18px rgba(160,120,255,0.6), 0 2px 10px #000" }}>A ARQUITETURA DOS EMPREGADORES</div>
          {f >= archAt + 130 ? <div style={{ marginTop: 10, fontSize: 18, letterSpacing: 5, color: AMB, opacity: P(f, archAt + 130, 12) }}>E AGORA, UM NÓ APAGADO</div> : null}
        </div>
      ) : null}
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};
const VIO_S = "#c79bff";
// ================================================================================================= 1:34:42 / 1:35:17 os participantes
// 30/10 (ele: o "tabuleiro de xadrez" não dava para entender, entrava fora de sincronia, e no "apenas alterou os
// participantes" a fala do G-Man não aparecia): sai o tabuleiro de trilhos. Agora é um caminho só, da esquerda até o
// CATALISADOR, com o G-Man de pé ao lado, olhando de fora.
//  modo 0: "nunca precisou que os Combine ganhassem" (COMBINE · VENCER riscado) · "nem que a humanidade perdesse"
//          (HUMANOS · PERDER riscado) · "ele fala isso direto para o Gordon".
//  modo 1: alguém tem que chegar ao catalisador (a peça anda) · escolher continuar · recusar o próprio fim · a convergência
//          continua (o anel pulsa) · a FALA do G-Man ("não impediu resultados… apenas alterou os participantes"): a peça
//          troca de COMBINE para HUMANOS e chega igual · a releitura: quatro cartas (ajudou o Gordon, Advisors mortos,
//          Combine perdendo, Alyx contra eles) · que se separam em dois lados com o G-Man no meio, em nenhum · o caminho
//          acende (a história nos trilhos) · a maior vitória.
const SEAT_IMG: Record<string, string> = {
  COMBINE: "hl3silh/combine_badge.jpg",
  HUMANOS: "hl3silh/rebelde_badge.jpg",
  GORDON: "hl3silh/gordon_card.jpg",
  ADVISORS: "hl3silh/advisor_card.jpg",
  ALYX: "hl3silh/alyx_badge.jpg",
};
const SeatCard: React.FC<{ x: number; y: number; w: number; label: string; col: string; img?: string; sub?: string; strike?: number; o?: number; mask?: string; glow?: number }> = ({ x, y, w, label, col, img, sub, strike = 0, o = 1, mask, glow = 0 }) => {
  const h = w * 1.25;
  return (
    <div style={{ position: "absolute", left: x - w / 2, top: y - h, width: w, opacity: o, fontFamily: MONO }}>
      <div style={{ width: w, height: h, borderRadius: 12, overflow: "hidden", border: `3px solid ${col}`, background: mask ? "radial-gradient(circle at 50% 40%, #f3e7cf, #8f8270)" : "#0b0e12", boxShadow: `0 0 ${18 + 30 * glow}px ${col}${glow > 0 ? "aa" : "55"}, 0 14px 40px rgba(0,0,0,0.7)`, position: "relative" }}>
        {img ? <img src={staticFile(img)} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} /> : null}
        {mask ? (
          <div style={{ position: "absolute", inset: "8% 6% 0 6%", WebkitMaskImage: `url(${staticFile(mask)})`, maskImage: `url(${staticFile(mask)})`, WebkitMaskSize: "contain", maskSize: "contain", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center bottom", maskPosition: "center bottom", background: "#16121c" }} />
        ) : null}
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "8px 0", background: "rgba(4,6,8,0.86)", textAlign: "center", fontSize: Math.round(w * 0.12), letterSpacing: 3, color: col }}>{label}</div>
      </div>
      {sub ? (
        <div style={{ position: "relative", marginTop: 14, textAlign: "center", fontSize: Math.round(w * 0.11), letterSpacing: 2, lineHeight: 1.3, color: "#f2f0f7", textShadow: "0 2px 10px #000" }}>
          {sub}
          {strike > 0 ? <span style={{ position: "absolute", left: "8%", right: "8%", top: "50%", height: 4, background: RED, transform: `scaleX(${strike})`, transformOrigin: "left", boxShadow: "0 0 10px rgba(255,93,77,0.8)" }} /> : null}
        </div>
      ) : null}
    </div>
  );
};

export const HL13Seats: React.FC<PR & { mode?: number }> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const mode = p.mode ?? 0;
  const [combAt, humAt, neverAt] = [at(p, "combAt"), at(p, "humAt"), at(p, "neverAt")];
  const [whatAt, chooseAt, refuseAt, contAt, lookAt, q1At, altAt] = ["whatAt", "chooseAt", "refuseAt", "contAt", "lookAt", "q1At", "altAt"].map((k) => at(p, k));
  const [rereadAt, helpAt, advAt, loseAt, alyxAt, sidesAt, railsAt, victAt] = ["rereadAt", "helpAt", "advAt", "loseAt", "alyxAt", "sidesAt", "railsAt", "victAt"].map((k) => at(p, k));
  const m1 = mode === 1;
  // o caminho e o catalisador
  const RY = 560, RX0 = 200, GX = 1430;
  const reread = m1 ? P(f, rereadAt, 16) * (1 - P(f, railsAt, 16)) : 0;
  const quote = m1 ? P(f, lookAt, 14) * (1 - P(f, rereadAt - 6, 12)) : 0;
  const lit = m1 ? P(f, railsAt, 24) : 0;
  const vict = m1 ? P(f, victAt, 20) : 0;
  const roadO = (mode === 0 ? 0.55 : 1) * (1 - 0.75 * reread);
  // modo 2 (1:38:35 "não destruiu aquilo para onde a história estava sendo empurrada · só mudou quem chegaria lá"):
  // as setas correm pelo caminho até o catalisador, que continua aceso; a peça COMBINE que ia chegar é tirada do caminho
  // e a HUMANOS entra no lugar dela e chega
  const m2 = mode === 2;
  const pushAt = at(p, "pushAt");
  const out2 = m2 ? P(f, altAt, 14) : 0;
  const in2 = m2 ? P(f, altAt + 8, 12) : 0;
  const x2 = m2 ? interpolate(f, [0, altAt, altAt + 10, altAt + 50], [760, 900, 900, GX - 130], { ...C, easing: Easing.inOut(Easing.cubic) }) : 0;
  const gateCol = vict > 0.5 || (m2 && f >= altAt + 50) ? GREEN : AMB;
  // a peça que anda até o catalisador (modo 1): COMBINE, que vira HUMANOS na fala do G-Man
  const swap = m1 ? P(f, altAt + 10, 10) : 0;
  const px = m1 ? interpolate(f, [whatAt + 6, whatAt + 160, altAt + 34, altAt + 80], [RX0 + 120, 980, 980, GX - 130], { ...C, easing: Easing.inOut(Easing.cubic) }) : 0;
  const hop = m1 && f > whatAt + 6 && (f < whatAt + 160 || (f > altAt + 34 && f < altAt + 80)) ? Math.abs(Math.sin(f / 4.5)) * 10 : 0;
  // o G-Man: de pé à direita do catalisador; na fala cresce e acende; em "nenhum dos lados" vai para o meio
  const mid = m1 ? P(f, sidesAt, 22) * (1 - P(f, railsAt + 10, 20)) : 0;
  const gH = 440 + 170 * quote;
  const gX = interpolate(mid, [0, 1], [1690, 960]) - 120 * quote;
  const gY = interpolate(mid, [0, 1], [RY + 30, 520]) + 230 * quote;
  const told = mode === 0 ? P(f, neverAt, 14) : 0;
  const gGlow = 0.25 + 0.75 * Math.max(quote, told, mid);
  // as quatro cartas da releitura e, depois, os dois lados
  const READ: { k: string; t: number; col: string; sub: string; side: number; img?: string; mask?: string }[] = [
    { k: "GORDON", t: helpAt, col: AMB, sub: "AJUDOU O GORDON", side: 0, img: SEAT_IMG.GORDON },
    { k: "ADVISORS", t: advAt, col: "#c79bff", sub: "DEIXOU ADVISORS MORREREM", side: 1, img: SEAT_IMG.ADVISORS },
    { k: "COMBINE", t: loseAt, col: RED, sub: "DEIXOU OS COMBINE PERDEREM", side: 1, img: SEAT_IMG.COMBINE },
    { k: "ALYX", t: alyxAt, col: ORANGE, sub: "PÔS A ALYX CONTRA ELES", side: 0, img: SEAT_IMG.ALYX },
  ];
  const sideK = m1 ? P(f, sidesAt, 22) : 0;
  const head = (t0: number, t1: number, text: string, col: string) =>
    f >= t0 && f < t1 ? <div key={text} style={{ marginTop: 10, padding: "8px 14px", background: "rgba(8,10,14,0.82)", borderLeft: `3px solid ${col}`, fontSize: 22, letterSpacing: 3, color: "#f2f0f7", opacity: P(f, t0, 8) * (1 - P(f, t1 - 8, 8)), width: "fit-content" }}>{text}</div> : null;
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 40%, #131b24 0%, #06080b 70%, #020304 100%)", overflow: "hidden", fontFamily: MONO }}>
      {/* o caminho */}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: roadO * (1 - 0.55 * quote) }}>
        <defs>
          <linearGradient id="seatRoad" x1="0" x2="1">
            <stop offset="0" stopColor="rgba(159,230,255,0.08)" />
            <stop offset={Math.max(0.01, lit)} stopColor={vict > 0.5 ? "rgba(141,255,168,0.9)" : "rgba(255,210,122,0.9)"} />
            <stop offset={Math.min(1, lit + 0.01)} stopColor="rgba(159,230,255,0.25)" />
            <stop offset="1" stopColor="rgba(159,230,255,0.35)" />
          </linearGradient>
        </defs>
        <rect x={RX0} y={RY} width={GX - RX0} height={10} rx={5} fill="url(#seatRoad)" />
        {Array.from({ length: 12 }).map((_, i) => <rect key={i} x={RX0 + 30 + i * ((GX - RX0 - 60) / 11)} y={RY + 22} width={26} height={4} fill="rgba(159,230,255,0.25)" />)}
        <text x={RX0} y={RY + 60} fill="rgba(242,240,247,0.45)" fontFamily={MONO} fontSize={18} letterSpacing={4}>A HISTÓRIA</text>
        {/* o catalisador */}
        <g transform={`translate(${GX} ${RY + 5})`}>
          <ellipse rx={74} ry={30} fill={`rgba(255,210,122,${0.15 + 0.2 * lit})`} stroke={gateCol} strokeWidth={4} />
          <ellipse rx={40} ry={16} fill={gateCol} opacity={0.35 + 0.4 * Math.max(lit, 0.5 + 0.5 * Math.sin(f / 9)) * (mode === 0 ? 0.5 : 1)} />
          {m1 && f >= contAt
            ? [0, 1, 2].map((k) => {
                const t = ((f - contAt) / 40 + k / 3) % 1;
                return <ellipse key={k} rx={74 + t * 170} ry={(74 + t * 170) * 0.42} fill="none" stroke={gateCol} strokeWidth={3} opacity={(1 - t) * 0.8 * (1 - reread)} />;
              })
            : null}
          <text y={70} textAnchor="middle" fill={gateCol} fontFamily={MONO} fontSize={20} letterSpacing={5}>CATALISADOR</text>
        </g>
      </svg>
      {/* o G-Man, de fora */}
      <div style={{ position: "absolute", left: gX - gH * 0.185, top: gY - gH, width: gH * 0.37, height: gH, opacity: P(f, 0, 14), filter: `drop-shadow(0 0 ${6 + 18 * gGlow}px rgba(220,240,255,${0.35 + 0.4 * gGlow}))` }}>
        <div style={{ position: "absolute", inset: 0, WebkitMaskImage: `url(${staticFile("hl3silh/gman_silh.png")})`, maskImage: `url(${staticFile("hl3silh/gman_silh.png")})`, WebkitMaskSize: "100% 100%", maskSize: "100% 100%", background: "linear-gradient(180deg, #2e353c, #07090b 80%)" }} />
      </div>
      {mid > 0.4 ? <div style={{ position: "absolute", left: 760, width: 400, top: 548, textAlign: "center", fontSize: 22, letterSpacing: 5, color: ICE, opacity: P(f, sidesAt + 14, 10) * (1 - P(f, railsAt, 12)) }}>NENHUM DOS LADOS</div> : null}
      {/* modo 0: os dois lados que nunca importaram */}
      {mode === 0 ? (
        <>
          {f >= combAt ? <SeatCard x={640} y={RY - 30} w={210} label="COMBINE" col={RED} img={SEAT_IMG.COMBINE} sub="VENCER" strike={P(f, combAt + 24, 12)} o={P(f, combAt, 10) * (1 - 0.5 * told)} /> : null}
          {f >= humAt ? <SeatCard x={1040} y={RY - 30} w={210} label="HUMANOS" col={GREEN} img={SEAT_IMG.HUMANOS} sub="PERDER" strike={P(f, humAt + 24, 12)} o={P(f, humAt, 10) * (1 - 0.5 * told)} /> : null}
        </>
      ) : null}
      {m2 ? (
        <>
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
            {Array.from({ length: 9 }).map((_, i) => {
              const u = ((f - pushAt) / 50 + i / 9) % 1;
              const x = RX0 + 60 + u * (GX - RX0 - 160);
              return f >= pushAt ? <path key={i} d={`M ${x} ${RY - 22} l 18 27 l -18 27`} fill="none" stroke="#ffd27a" strokeWidth={4} opacity={P(f, pushAt, 12) * Math.sin(u * Math.PI) * 0.8} /> : null;
            })}
          </svg>
          {out2 < 1 ? <SeatCard x={x2 + 160 * out2} y={RY - 8 + 260 * out2} w={150} label="COMBINE" col={RED} img={SEAT_IMG.COMBINE} o={(1 - out2) * P(f, 0, 10)} /> : null}
          {f >= altAt + 8 ? <SeatCard x={x2} y={RY - 8 - 40 * (1 - in2) - (f < altAt + 50 ? Math.abs(Math.sin(f / 4.5)) * 10 : 0)} w={150} label="HUMANOS" col={GREEN} img={SEAT_IMG.HUMANOS} o={in2} glow={f < altAt + 22 ? 1 : 0} /> : null}
        </>
      ) : null}
      {/* modo 1: a peça no caminho */}
      {m1 && f >= whatAt && reread < 0.98 ? (
        <SeatCard x={px} y={RY - 8 - hop} w={150} label={swap > 0.5 ? "HUMANOS" : "COMBINE"} col={swap > 0.5 ? GREEN : RED} img={swap > 0.5 ? SEAT_IMG.HUMANOS : SEAT_IMG.COMBINE} o={P(f, whatAt, 10) * (1 - reread) * (1 - 0.35 * quote) + 0.35 * quote * (1 - reread)} glow={swap > 0 && swap < 1 ? 1 : 0} />
      ) : null}
      {m1 && swap > 0 && swap < 1 ? <div style={{ position: "absolute", left: px - 110 * (1 - swap) - 30, top: RY - 160 - 110 * (1 - swap), width: 220 * (1 - swap) + 60, height: 220 * (1 - swap) + 60, borderRadius: "50%", border: "4px solid #fff", opacity: 1 - swap }} /> : null}
      {m1 && f >= rereadAt + 6 && f < railsAt + 30 ? (
        <>
          {READ.map((r, i) => {
            if (f < r.t) return null;
            const k = P(f, r.t, 12);
            const rowX = 420 + i * 360;
            // nos lados: humanos à esquerda, Combine/Advisors à direita, o G-Man no meio
            const sideX = r.side === 0 ? (r.k === "GORDON" ? 300 : 560) : r.k === "ADVISORS" ? 1360 : 1620;
            const x = interpolate(sideK, [0, 1], [rowX, sideX]);
            return <SeatCard key={r.k} x={x} y={900 + 20 * (1 - k)} w={200} label={r.k} col={r.col} img={r.img} mask={r.mask} sub={sideK > 0.5 ? undefined : r.sub} o={k * (1 - P(f, railsAt, 20))} />;
          })}
          {sideK > 0.5 ? (
            <>
              <div style={{ position: "absolute", left: 230, width: 400, top: 560, textAlign: "center", fontSize: 22, letterSpacing: 5, color: GREEN, opacity: P(f, sidesAt + 14, 10) * (1 - P(f, railsAt, 16)) }}>LADO HUMANO</div>
              <div style={{ position: "absolute", left: 1290, width: 400, top: 560, textAlign: "center", fontSize: 22, letterSpacing: 5, color: RED, opacity: P(f, sidesAt + 14, 10) * (1 - P(f, railsAt, 16)) }}>LADO COMBINE</div>
            </>
          ) : null}
        </>
      ) : null}
      {/* as frases do narrador, no canto */}
      <div style={{ position: "absolute", left: 100, top: 110, width: 900 }}>
        {m2 ? (
          <>
            {head(pushAt, life, "O DESTINO CONTINUA LÁ · NÃO FOI DESTRUÍDO", "#ffd27a")}
            {head(altAt, life, "SÓ MUDOU QUEM CHEGARIA LÁ", GREEN)}
          </>
        ) : mode === 0 ? (
          <>
            {head(combAt, life, "✕ NUNCA PRECISOU QUE OS COMBINE GANHASSEM", RED)}
            {head(humAt, life, "✕ NEM QUE A HUMANIDADE PERDESSE", GREEN)}
            {head(neverAt, life, "ELE DIZ ISSO DIRETO PARA O GORDON", ICE)}
          </>
        ) : (
          <>
            {head(0, whatAt, "O QUE REALMENTE INTERESSA · A ELE E AOS EMPREGADORES", VIO_S)}
            {head(whatAt, lookAt, "QUE ALGUÉM CHEGUE AO CATALISADOR", AMB)}
            {head(chooseAt, lookAt, "QUE ALGUÉM ESCOLHA CONTINUAR", AMB)}
            {head(refuseAt, lookAt, "QUE SE RECUSE A ACEITAR O PRÓPRIO FIM", AMB)}
            {head(contAt, lookAt, "ENQUANTO ISSO ACONTECER · A CONVERGÊNCIA CONTINUA", "#ffd27a")}
            {head(rereadAt, sidesAt, "ISSO MUDA A LEITURA DE TUDO O QUE ELE FEZ", ICE)}
            {head(sidesAt, railsAt, "NUNCA TRABALHOU PARA NENHUM DOS DOIS LADOS", ICE)}
            {head(railsAt, life, "O TRABALHO DELE · MANTER A HISTÓRIA NOS TRILHOS", "#ffd27a")}
          </>
        )}
      </div>
      {/* a fala do G-Man */}
      {m1 && quote > 0 ? (
        <>
          <AbsoluteFill style={{ background: `rgba(0,0,0,${0.45 * quote})`, pointerEvents: "none" }} />
          <div style={{ position: "absolute", left: 160, right: 160, bottom: 140, textAlign: "center", fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: "italic", fontSize: 52, lineHeight: 1.3, color: "#f2ead8", textShadow: "0 4px 30px #000", opacity: quote }}>
            {f >= q1At ? <div style={{ opacity: P(f, q1At, 10) }}>“O senhor não impediu resultados.”</div> : null}
            {f >= altAt ? <div style={{ opacity: P(f, altAt, 10) }}>“Apenas alterou… completamente os participantes.”</div> : null}
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 120, textAlign: "center", fontSize: 20, letterSpacing: 8, color: "#cfe8ff", opacity: quote * (1 - P(f, q1At, 10)) }}>O G-MAN OLHA PARA O GORDON</div>
        </>
      ) : null}
      {m1 ? <Kin kind="light" t0={victAt} bottom={110} size={50} col="#ffe2a0" text="a maior vitória da história para a humanidade" /> : null}
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// 30/10: os modos 0 e 1 (os participantes) saem do tabuleiro e vão para o caminho do catalisador (HL13Seats)
export const HL13BoardX: React.FC<PR & { mode?: number }> = (p) => (p.mode === 4 ? <HL13Swan3D {...p} /> : !p.mode || p.mode === 1 || p.mode === 2 ? <HL13Seats {...p} /> : <HL13Board {...p} />);

// ================================================================================================= 1:45:40 o Ártico se desfaz (tomadas)
// 12/10 v3 (pedido dele: genérico, pedaços flutuando que paravam no teto, sem mudança de cena; o navio só piscando não
// parece se desfazer; o chão tem que rachar e se degradar): cinco tomadas no mesmo gelo, cortadas na fala.
//  1. o Borealis inteiro, com a falha de fase roxa no casco (as peças se soltam, viram aresta violeta, ficam corroídas) e
//     as rachaduras violeta correndo pelo gelo até a câmera; as placas se soltam ONDE a rachadura passa, inclinam e sobem
//     sem parar (somem no alto).
//  2. de perto, um fragmento de Xen sendo arrancado do chão: o anel de rachadura, o gelo quebrando em volta, pedras caindo
//     de baixo dele enquanto sobe.
//  3. o ninho de antlions: os antlions do jogo saem cavando e correm pra longe sem atacar; headcrabs passam fugindo.
//  4. Combine (crachás) no gelo, cada um virado pra um lado — sem alvo — com tudo subindo atrás.
//  5. o plano aberto: tudo subindo, o navio se desfazendo; "tudo com medo da mesma coisa".
const ARC_CRACKS = (() => {
  // rachaduras: polilinhas que saem do casco e vêm na direção da câmera, com galhos
  const out: { pts: THREE.Vector3[]; t0: number }[] = [];
  for (let i = 0; i < 9; i++) {
    const pts: THREE.Vector3[] = [];
    let x = -40 + i * 11 + rnd(i * 3) * 6, z = -108;
    for (let s = 0; s < 26; s++) {
      pts.push(new THREE.Vector3(x, 0.05, z));
      x += (rnd(i * 50 + s) - 0.5) * 7 - 2.2;
      z += 3.2 + rnd(i * 70 + s) * 2.5;
    }
    out.push({ pts, t0: i * 4 });
    // um galho do meio
    const b: THREE.Vector3[] = [];
    let bx = pts[9].x, bz = pts[9].z;
    for (let s = 0; s < 10; s++) {
      b.push(new THREE.Vector3(bx, 0.05, bz));
      bx += (i % 2 ? 1 : -1) * (2 + rnd(i * 90 + s) * 3);
      bz += 1.5 + rnd(i * 91 + s) * 2;
    }
    out.push({ pts: b, t0: i * 4 + 30 });
  }
  return out;
})();
const buildArcticShots = () => {
  const g = new THREE.Group();
  // as rachaduras: fita no chão (borda escura + miolo violeta aceso)
  const crackM = new THREE.MeshBasicMaterial({ color: "#c49cff", transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false });
  const grooveM = new THREE.MeshBasicMaterial({ color: "#0b0a14", transparent: true, opacity: 0.85, depthWrite: false });
  const ribbon = (pts: THREE.Vector3[], w: number, y: number) => {
    const pos: number[] = [], idx: number[] = [];
    pts.forEach((p, i) => {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
      const d = b.clone().sub(a).normalize();
      const n = new THREE.Vector3(-d.z, 0, d.x).multiplyScalar(w * (0.6 + 0.4 * Math.sin(i * 1.7)));
      pos.push(p.x + n.x, y, p.z + n.z, p.x - n.x, y, p.z - n.z);
      if (i) idx.push((i - 1) * 2, (i - 1) * 2 + 1, i * 2, (i - 1) * 2 + 1, i * 2 + 1, i * 2);
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    geo.setIndex(idx);
    return geo;
  };
  const cracks = ARC_CRACKS.map((c) => {
    const groove = new THREE.Mesh(ribbon(c.pts, 2.0, 0.1), grooveM);
    const glow = new THREE.Mesh(ribbon(c.pts, 0.7, 0.14), crackM);
    g.add(groove, glow);
    return { groove, glow, n: (c.pts.length - 1) * 6, t0: c.t0, pts: c.pts };
  });
  // as placas que se soltam ao longo das rachaduras
  const iceM = new THREE.MeshPhysicalMaterial({ color: "#d6ebf5", roughness: 0.25, transmission: 0.2, thickness: 1.2, flatShading: true });
  const snowM = new THREE.MeshStandardMaterial({ color: "#f2f7fb", roughness: 0.9, flatShading: true });
  const slabs: { m: THREE.Group; x: number; z: number; t0: number; sp: number; sd: number }[] = [];
  ARC_CRACKS.forEach((c, ci) => {
    c.pts.forEach((p, si) => {
      if (si % 3 !== 1 || ci % 2) return;
      const m = new THREE.Group();
      const w = 2.5 + rnd(ci * 30 + si) * 4, d = 2 + rnd(ci * 31 + si) * 3;
      m.add(new THREE.Mesh(lump(1, w * 0.5, 0.6, d * 0.5, ci * 3 + si, 0.25, 2), iceM));
      const t = new THREE.Mesh(lump(1, w * 0.48, 0.16, d * 0.48, ci * 5 + si, 0.2, 2), snowM);
      t.position.y = 0.45;
      m.add(t);
      g.add(m);
      slabs.push({ m, x: p.x + (rnd(si + ci) - 0.5) * 3, z: p.z, t0: c.t0 + si * 3 + 12, sp: 0.5 + rnd(ci * 7 + si), sd: ci * 7 + si });
    });
  });
  // o ninho de antlions: monte de areia e rocha com a boca escura
  const sandM = new THREE.MeshStandardMaterial({ color: "#8a7458", roughness: 1, flatShading: true });
  const nest = new THREE.Group();
  const mound = new THREE.Mesh(lump(1, 4.5, 1.6, 4.5, 4.4, 0.3, 3), sandM);
  mound.position.y = -0.2;
  const hole = new THREE.Mesh(new THREE.CircleGeometry(1.5, 24), new THREE.MeshBasicMaterial({ color: "#100c08" }));
  hole.rotation.x = -Math.PI / 2 + 0.25;
  hole.position.set(0.6, 1.35, 1.2);
  nest.add(mound, hole);
  for (let k = 0; k < 6; k++) {
    const r = new THREE.Mesh(lump(1, 0.6 + rnd(k) * 0.8, 0.5, 0.6 + rnd(k + 9) * 0.7, k * 2.1, 0.35, 1), new THREE.MeshStandardMaterial({ color: "#6a5c4a", roughness: 1, flatShading: true }));
    const a = k * 1.05;
    r.position.set(Math.cos(a) * 4.6, 0.2, Math.sin(a) * 4.6);
    nest.add(r);
  }
  nest.position.set(-28, 0, -46);
  g.add(nest);
  // pedras que caem de baixo do fragmento de Xen enquanto ele sobe
  const rockM = new THREE.MeshStandardMaterial({ color: "#4a4034", roughness: 1, flatShading: true });
  const debris = Array.from({ length: 26 }).map((_, i) => {
    const m = new THREE.Mesh(lump(1, 0.4 + rnd(i) * 0.9, 0.4 + rnd(i + 3) * 0.7, 0.4 + rnd(i + 5) * 0.8, i * 1.3, 0.35, 1), i % 3 ? rockM : iceM);
    g.add(m);
    return m;
  });
  return { g, cracks, slabs, nest, debris };
};
export const HL14ArcticShots: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const lite = React.useContext(LiteCtx);
  const ctx = React.useContext(SfxCtx);
  const [iceAt, xenAt, creatAt, combAt, fearAt] = ["iceAt", "xenAt", "creatAt", "combAt", "fearAt"].map((k) => at(p, k));
  const shot = f < xenAt ? 1 : f < creatAt ? 2 : f < combAt ? 3 : f < fearAt ? 4 : 5;
  const s0 = [0, 0, xenAt, creatAt, combAt, fearAt][shot];
  const u = f - s0;
  const ISL = 1; // o fragmento de perto: [30, -80, 13]
  const cam =
    shot === 1
      ? { pos: kv(f, [[0, [-62, 7, -30]], [xenAt, [-52, 6, -42]]]), tgt: kv(f, [[0, [4, 9, -120]], [xenAt, [8, 8, -118]]]), fov: 50 }
      : shot === 2
        ? { pos: kv(u, [[0, [4, 9, -36]], [creatAt - xenAt, [8, 11, -42]]]), tgt: kv(u, [[0, [30, 0, -80]], [creatAt - xenAt, [30, 9, -80]]]), fov: 48 }
        : shot === 3
          ? { pos: kv(u, [[0, [-20.5, 1.3, -36.5]], [combAt - creatAt, [-21.5, 1.4, -37.5]]]), tgt: kv(u, [[0, [-28, 1.4, -46]], [combAt - creatAt, [-31, 1.2, -45]]]), fov: 46 }
          : shot === 4
            ? { pos: kv(u, [[0, [-2, 1.7, -42]], [fearAt - combAt, [1, 1.8, -46]]]), tgt: kv(u, [[0, [4, 3, -70]], [fearAt - combAt, [6, 5, -72]]]), fov: 50 }
            : { pos: kv(u, [[0, [-110, 30, 40]], [life - fearAt, [-140, 48, 90]]]), tgt: kv(u, [[0, [0, 14, -100]], [life - fearAt, [0, 20, -110]]]), fov: 52 };
  const st = calmState(f, lite, cam);
  st.ridge = false;
  st.ship.op = 1;
  st.ship.phase = 1;
  st.ship.decay = interpolate(f, [0, life], [0.15, 0.55], C);
  const OBJ = useMemo(() => buildArctic(), []);
  const SH = useMemo(() => buildArcticShots(), []);
  // 31/10: o "run02" do antlion veio quebrado na extração (0,3 s, 5 quadros): eles não correm mais; emergem da neve (digout01,
  // como no HL2) e ficam agitados olhando em volta (distractidle01), sem atacar
  const ants = useHla("antlion_hla.glb", 5, 1.2, { dig: "digout01", look: "distractidle01", idle: "idle01" });
  const crabs = useHla("headcrab_hla.glb", 6, 0.5, { run: "headcrab_run", rear: "headcrab_rearup", idle: "headcrab_idle" });
  const T = f; // tempo corrido da cena (as coisas continuam entre os cortes)
  const ICE = React.useRef<{ F: CraterField; plane: THREE.Mesh } | null>(null);
  const extra = (root: THREE.Group) => {
    if (OBJ.g.parent !== root) root.add(OBJ.g);
    if (SH.g.parent !== root) root.add(SH.g);
    // 31/10 (ele: "os pedaços não levantam do chão deixando uma cratera", "pedaços de chão atravessando tudo"): o chão de gelo
    // de verdade (hl3r25): placas com espessura sobre o abismo; as placas soltas e as rachaduras pintadas antigas saem
    OBJ.slabs.forEach((m) => (m.visible = false));
    SH.slabs.forEach((s) => (s.m.visible = false));
    SH.cracks.forEach((c) => {
      c.groove.visible = false;
      c.glow.visible = false;
    });
    if (!ICE.current) {
      let worldIce: THREE.Mesh | null = null;
      root.traverse((o) => {
        const m = o as THREE.Mesh;
        const pg = m.geometry as THREE.PlaneGeometry | undefined;
        if (!worldIce && m.isMesh && pg?.type === "PlaneGeometry" && pg.parameters.width === 3400) worldIce = m;
      });
      if (worldIce) {
        const wi = worldIce as THREE.Mesh;
        ICE.current = { F: buildCraterField(wi.material as THREE.Material), plane: wi };
        root.add(ICE.current.F.g);
        pruneWorldChunks(root, ICE.current.F);
      }
    }
    if (ICE.current) {
      ICE.current.plane.visible = false;
      updateCraterField(ICE.current.F, f, iceAt, xenAt);
    }
    // 31/10: os fragmentos agora são os do chão com crateras (hl3r26); as ilhas e os detritos antigos saem
    OBJ.isl.forEach((m) => (m.visible = false));
    SH.debris.forEach((d) => (d.visible = false));
    SH.nest.visible = false; // o monte com o buraco não fazia sentido (ele): os antlions saem do próprio chão
    creatures(root);
  };
  // as criaturas numa camada própria, com a mesma câmera
  // 31/10 (ele: "parece PNG", "os buracos ficam e o chão some quando pisca", "tudo por cima, fodendo a perspectiva"): as tocas e as
  // criaturas agora estão DENTRO da cena do Ártico (mesma câmera, mesmo chão em y = 0, mesma luz e sombra), não num canvas por
  // cima. Cada toca: borda de neve levantada, cacos de gelo, e a boca escura (disco logo acima do gelo): o corpo que ainda está
  // abaixo do chão fica escondido pelo próprio gelo, e o antlion sai de dentro da boca
  const DEN = useMemo(() => {
    const C0 = new THREE.Vector3(-20.5, 0, -36.5), F = new THREE.Vector3(-0.62, 0, -0.78), L = new THREE.Vector3(0.78, 0, -0.62);
    const spot = (d: number, l: number) => C0.clone().addScaledVector(F, d).addScaledVector(L, l);
    const spots = [spot(17, -1.5), spot(19.5, -6), spot(21, 2.5), spot(23, -3), spot(16.5, 4.5)];
    const R = 0.95;
    const g = new THREE.Group();
    const snowM = new THREE.MeshStandardMaterial({ color: "#e8f0f6", roughness: 0.9, flatShading: true });
    const iceM = new THREE.MeshStandardMaterial({ color: "#9fc4d8", roughness: 0.3, flatShading: true });
    const mouthM = new THREE.MeshBasicMaterial({ color: "#05090d" });
    spots.forEach((s, i) => {
      const mouth = new THREE.Mesh(new THREE.CircleGeometry(R, 24), mouthM);
      mouth.rotation.x = -Math.PI / 2;
      mouth.position.set(s.x, 0.03, s.z);
      mouth.receiveShadow = true;
      g.add(mouth);
      const lip = new THREE.Mesh(new THREE.TorusGeometry(R + 0.22, 0.3, 6, 20), snowM);
      lip.rotation.x = -Math.PI / 2;
      lip.scale.set(1, 1, 0.5);
      lip.position.set(s.x, 0.05, s.z);
      lip.castShadow = lip.receiveShadow = true;
      g.add(lip);
      for (let k = 0; k < 7; k++) {
        const a = (k / 7) * Math.PI * 2 + i;
        const sh = new THREE.Mesh(new THREE.TetrahedronGeometry(0.22 + rnd(k + i * 10) * 0.22, 0), iceM);
        sh.position.set(s.x + Math.cos(a) * (R + 0.6), 0.1, s.z + Math.sin(a) * (R + 0.6));
        sh.rotation.set(rnd(k * 3 + i) * 2, a, 0.6 + rnd(k + i) * 0.5);
        sh.castShadow = true;
        g.add(sh);
      }
    });
    const shadowM = new THREE.MeshBasicMaterial({ color: "#000000", transparent: true, opacity: 0.32, depthWrite: false });
    const blobGeo = new THREE.CircleGeometry(1, 18);
    blobGeo.rotateX(-Math.PI / 2);
    const blobs = Array.from({ length: 12 }).map(() => new THREE.Mesh(blobGeo, shadowM));
    const cre = new THREE.Group(); // o que muda a cada quadro (os bichos, as sombras, a neve)
    return { g, spots, blobs, cre };
  }, []);
  const snowRef = React.useRef<THREE.Mesh[]>([]);
  const creatures = (root: THREE.Group) => {
    if (DEN.g.parent !== root) root.add(DEN.g);
    if (DEN.cre.parent !== root) root.add(DEN.cre);
    DEN.g.visible = shot === 3;
    DEN.cre.clear();
    snowRef.current.forEach((m) => {
      m.geometry.dispose();
      (m.material as THREE.Material).dispose();
    });
    snowRef.current = [];
    if (shot !== 3) return;
    let nb = 0;
    const blob = (x: number, z: number, r: number) => {
      const m = DEN.blobs[nb++];
      if (!m) return;
      m.position.set(x, 0.02, z);
      m.scale.set(r, 1, r);
      DEN.cre.add(m);
    };
    const D0 = [0, 16, 27, 41, 52];
    ants.forEach((A, i) => {
      const s = DEN.spots[i];
      const t = (u - D0[i]) / 30;
      if (t < 0) return;
      const DIG = 1.63;
      // de frente para fora da toca, para o lado da câmera (variando um pouco); sem girar depois
      A.root.rotation.y = Math.atan2(-20.5 - s.x, -36.5 - s.z) + (rnd(i * 4.4) - 0.5) * 1.2;
      if (t < DIG) {
        const k = t / DIG;
        A.root.position.set(s.x, -1.7 * (1 - Math.min(1, k * 1.15)) ** 2, s.z);
        A.set("dig", t);
        for (let q = 0; q < 12; q++) {
          const a = q * 2.39 + i, sp = 1 + rnd(q + i * 20) * 1.8;
          const tt = t - (q % 4) * 0.08;
          if (tt <= 0) continue;
          const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.05 + rnd(q * 3 + i) * 0.07, 0), new THREE.MeshStandardMaterial({ color: "#eef4fa", roughness: 0.9, transparent: true, opacity: Math.max(0, 1 - tt / 1.3) }));
          m.position.set(s.x + Math.cos(a) * sp * tt * 0.5, Math.max(0, 2.6 * tt - 4.9 * tt * tt), s.z + Math.sin(a) * sp * tt * 0.5);
          DEN.cre.add(m);
          snowRef.current.push(m);
        }
      } else {
        A.root.position.set(s.x, 0, s.z);
        A.set("look", t - DIG + i * 0.37);
        blob(s.x, s.z, 0.8);
      }
      A.root.traverse((o) => ((o as THREE.Mesh).isMesh ? ((o as THREE.Mesh).castShadow = true) : null));
      DEN.cre.add(A.root);
    });
    // os headcrabs: seis, cada um com seu ponto, seu tempo, sua direção (fogem para longe e para os lados, nunca juntos) e sua
    // velocidade; a animação anda na mesma proporção da distância (o passo não escorrega)
    const CR: [number, number, number, number, number][] = [
      [-22.5, -42, 34, -2.2, 1.7],
      [-25.8, -44.2, 41, -0.6, 1.35],
      [-21.0, -45.8, 47, -2.9, 1.9],
      [-29.6, -42.6, 55, 0.5, 1.5],
      [-24.2, -48.5, 60, -1.7, 1.25],
      [-27.4, -41.2, 66, 2.6, 1.8],
    ];
    const STRIDE = 1.15; // unidades por ciclo de 1,33 s no tamanho de 0,5
    crabs.forEach((Cb, i) => {
      const [x0, z0, d0, dir, v] = CR[i];
      const t = (u - d0) / 30;
      if (t < 0) return;
      const dist = v * (t - (1 - Math.exp(-t * 3)) / 3); // arranca e pega velocidade
      Cb.root.rotation.y = dir;
      Cb.root.position.set(x0 + Math.sin(dir) * dist, 0, z0 + Math.cos(dir) * dist);
      Cb.set("run", (dist / STRIDE) * 1.333 + i * 0.21);
      Cb.root.traverse((o) => ((o as THREE.Mesh).isMesh ? ((o as THREE.Mesh).castShadow = true) : null));
      blob(Cb.root.position.x, Cb.root.position.z, 0.32);
      DEN.cre.add(Cb.root);
    });
  };
  const cRef = React.useRef<HTMLCanvasElement>(null);
  React.useLayoutEffect(() => {
    const cv = cRef.current;
    if (!cv) return;
    const actors: THREE.Object3D[] = [];
    const dx = cam.tgt[0] - cam.pos[0], dy = cam.tgt[1] - cam.pos[1], dz = cam.tgt[2] - cam.pos[2];
    const ey: Eye = { x: cam.pos[0], y: -cam.pos[2], z: cam.pos[1], yaw: Math.atan2(dx, -dz), pitch: Math.atan2(dy, Math.hypot(dx, dz)), F: 540 / Math.tan((cam.fov * Math.PI) / 360) };
    const holder = new THREE.Group();
    actors.forEach((a) => {
      a.updateMatrixWorld(true);
      holder.add(a);
    });
    const moon = new THREE.DirectionalLight("#cfe0ff", 2.2);
    moon.position.set(-140, 120, 60);
    const key = new THREE.DirectionalLight("#fff2e0", 3.6);
    key.position.set(cam.pos[0] + 20, cam.pos[1] + 30, cam.pos[2] + 20);
    const vio = new THREE.PointLight("#b48cff", 30, 40);
    vio.position.set(-20, 4, -60);
    drawGL(cv, ey, [], null, [holder], [new THREE.HemisphereLight("#c8d8e8", "#6a6080", 2.4), moon, key, vio]);
    actors.forEach((a) => holder.remove(a));
  });
  const pr = projector(cam);
  const hz = pr([cam.pos[0], 0, cam.pos[2] - 3000]);
  const yaw = Math.atan2(cam.tgt[0] - cam.pos[0], -(cam.tgt[2] - cam.pos[2]));
  const eye = { x: cam.pos[0], y: -cam.pos[2], z: cam.pos[1], yaw, pitch: 0, F: 1000 };
  const badge = (x: number, z: number, h: number, label: string, sub: string, o: number) => {
    const b = pr([x, 0, z]), t = pr([x, h, z]);
    if (!b || !t || o <= 0) return null;
    return (
      <g key={x + "_" + z} opacity={o}>
        <line x1={b.x} y1={b.y} x2={t.x} y2={t.y} stroke="#b8c4cc" strokeWidth={2} />
        <ellipse cx={b.x} cy={b.y} rx={26} ry={7} fill="none" stroke="#b8c4cc" strokeWidth={1.5} strokeDasharray="5 4" strokeDashoffset={-f} />
        <FlagBadge cx={t.x} by={t.y} k={1} label={label} col="#b8c4cc" f={f} sub={sub} photo="hl3silh/combine_badge.jpg" />
      </g>
    );
  };
  // o lado pra onde cada Combine olha (vira de um lado pro outro, sem alvo)
  const look = (i: number) => (Math.sin(u / 22 + i * 2) > 0 ? "◀ ?" : "? ▶");
  const big = XEN_ISL[ISL];
  const fearTxt = "TUDO COM MEDO DA MESMA COISA";
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#02060c" }}>
      <Sky hy={hz ? hz.y : 540} shift={yaw * 700} f={f} />
      {ctx.mode === "collect" ? null : (
        <ThreeCanvas frameloop="demand" width={1920} height={1080} style={{ position: "absolute", inset: 0 }} dpr={lite ? 0.75 : 1} shadows gl={{ antialias: true, alpha: true }} camera={{ fov: 50, position: [0, 3, 0], near: 0.3, far: 4000 }}>
          <World st={st} extra={extra} />
        </ThreeCanvas>
      )}
      <canvas ref={cRef} width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: shot === 3 ? 1 : 0, filter: "brightness(0.9) contrast(1.05)" }} />
      {/* o violeta da fase no ar */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 40%, rgba(150,110,255,0.10), rgba(0,0,0,0) 65%)", pointerEvents: "none" }} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {shot === 1 ? <Call3 pr={pr} f={f} pt={[6, 16, -128]} from={10} until={xenAt} text="O BOREALIS SE DESFAZ" sub="A FALHA DE FASE · POR FORA" col="#c49cff" dx={160} dy={-120} /> : null}
        {shot === 1 ? <Call3 pr={pr} f={f} pt={[-28, 0.2, -88]} from={50} until={xenAt} text="O CHÃO RACHA" col="#c49cff" dx={-150} dy={-90} /> : null}
        {shot === 2 ? <Call3 pr={pr} f={f} pt={[XENF[ISL].x, xenPos(ISL, f, xenAt)[1] + 1, XENF[ISL].z]} from={xenAt + 14} until={creatAt} text="FRAGMENTO DE XEN" sub="ARRANCADO DA TERRA" col="#b8ff90" dx={-200} dy={-110} /> : null}
        {shot === 3 ? <Call3 pr={pr} f={f} pt={[DEN.spots[0].x, 1.4, DEN.spots[0].z]} from={creatAt + 40} until={combAt} text="ANTLIONS SAEM DOS NINHOS" sub="SEM ATACAR" col="#e8c890" dx={180} dy={-150} /> : null}
        {shot === 4 ? [badge(-4, -62, 2.4, "COMBINE", "SEM ALVO " + look(0), P(f, combAt + 4, 10)), badge(5, -66, 2.6, "COMBINE", look(1), P(f, combAt + 12, 10)), badge(12, -60, 2.3, "COMBINE", look(2), P(f, combAt + 20, 10))] : null}
      </svg>
      {shot === 3 && u > 40 ? <div style={{ position: "absolute", left: 120, bottom: 170, fontFamily: MONO, fontSize: 20, letterSpacing: 4, color: "#e8d0a0", textShadow: "0 2px 10px #000", opacity: P(f, creatAt + 40, 10) }}>HEADCRABS FOGEM</div> : null}
      {shot === 5 ? (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 150, textAlign: "center", fontFamily: "'Inter', 'Segoe UI', sans-serif", fontWeight: 300, fontSize: 52, letterSpacing: 14, color: "#e6dcff" }}>
          {fearTxt.split("").map((ch, k) => {
            const t = fearAt + 6 + k * 1.2;
            const glow = 1 - P(f, t + 4, 24);
            return <span key={k} style={{ opacity: P(f, t, 8), textShadow: `0 0 ${6 + 24 * glow}px rgba(180,140,255,${0.35 + 0.5 * glow}), 0 3px 16px rgba(0,0,0,0.9)` }}>{ch}</span>;
          })}
        </div>
      ) : null}
      {/* os cortes: 2 quadros de branco violeta */}
      {[xenAt, creatAt, combAt, fearAt].some((t) => f >= t && f < t + 2) ? <AbsoluteFill style={{ background: "rgba(200,180,255,0.35)", pointerEvents: "none" }} /> : null}
      {shot !== 5 ? <Hud f={f} yaw={eye.yaw} eye={eye} blips={[]} msg={undefined} /> : null}
      <AbsoluteFill style={{ background: "#000", opacity: interpolate(f, [0, 8], [1, 0], C) + interpolate(f, [life - 6, life], [0, 1], C), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};
