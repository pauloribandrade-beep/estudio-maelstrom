// =================================================================================================
// HL3 · o convés de comando do Borealis em 3D (11/10/2026): UM cenário contínuo para 1:09:59 → 1:12:36.
//   galeria de observação (z 0…3, piso 1,0 m) — o Gordon escondido atrás da parede, espiando pela janela
//   sala de controle (z −16…0): mesa holográfica no centro, anel de consoles Combine, porta lateral (x = 9)
//   vidro do fundo (z = −16) → sala dos motores (dois motores verticais acesos) — onde o G-Man aparece
// O Gordon entra pela porta lateral na luta, atravessa a sala até a Alyx (suspensa ao lado do console dela) e sai com
// ela pela porta do fundo: sem cortes de lugar.
// =================================================================================================
import React from "react";
import { AbsoluteFill, Easing, interpolate, staticFile, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import * as THREE from "three";
import { FONT, MONO } from "./overlays";
import { C, HL, rnd } from "./hl3";
import { FilmLook, decode } from "./hl3r";
import { Eye, Hud } from "./hl3rf";
import { fadeIO } from "./hl3rx";
import { LiteCtx, SfxCtx } from "./sfx-ctx";
import { V, kv, kk, canvasTex } from "./hl3r9s";
import { K, M, B, Cyl, rod, panelTex, grateTex, combineTex, hazardTex, liveScreen, combineConsole, crate, combineBarrier, lamp, buildAdvisorBoard, ADVISOR_SVG, makeTag, Stage, Cam, projectorC, kitMats } from "./hl3r10k";

const RED = "#ff5d4d";
const AMB = "#ffb22e";
const CREAM = "#ffe2b0";
const VIO = "#c79bff";
const CYC = "#7ef0ff";
const ORANGE = HL.orange;
const TXT = HL.text;
const P = (f: number, at: number, d = 12) => interpolate(f, [at, at + d], [0, 1], { ...C, easing: Easing.out(Easing.cubic) });
type PR = Record<string, number> & { life: number };
const at = (p: PR, k: string) => (p[k] as number | undefined) ?? 1e9;
const ats = (p: PR, ks: string[]) => ks.map((k) => at(p, k));
const IO = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const S = (color: string, rough = 0.7, metal = 0.2, extra: THREE.MeshStandardMaterialParameters = {}) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, ...extra });
const hudEye = (c: Cam): Eye => ({ x: c.pos[0], y: -c.pos[2], z: c.pos[1], yaw: Math.atan2(c.tgt[0] - c.pos[0], -(c.tgt[2] - c.pos[2])), pitch: 0, F: 1000 });

// ------------------------------------------------------------------------------------------------ o cenário
export const ALYX_C: V = [2.8, 0, -5.4]; // o console dela
export const ADV_A: V = [-1.2, 3.1, -9.4]; // o Advisor que conduz
export const SOLDIERS: V[] = [[-6.6, 0, -11.4], [6.4, 0, -12.6], [-3.4, 0, -14.6]];
const PHOTOS = ["hl3silh/alyx_badge.jpg", "hl3silh/combine_badge.jpg", "hl3silh/gman_silh.png", ADVISOR_SVG];
export const IMGS = PHOTOS;
export type Deck = ReturnType<typeof buildDeck>;
export const buildDeck = (im: Record<string, HTMLImageElement>) => {
  const root = new THREE.Group();
  const k: K = kitMats();
  const wall = new THREE.MeshStandardMaterial({ map: panelTex("#5d646a", "rgba(0,0,0,0.5)", 6, 1.2), roughness: 0.62, metalness: 0.45 });
  const wallG = new THREE.MeshStandardMaterial({ map: panelTex("#4f5a58", "rgba(0,0,0,0.5)", 3, 1), roughness: 0.62, metalness: 0.45 });
  const floor = new THREE.MeshStandardMaterial({ map: grateTex(16, 10), roughness: 0.55, metalness: 0.7 });
  const cmbW = new THREE.MeshStandardMaterial({ map: combineTex(4, 1), roughness: 0.4, metalness: 0.8 });
  const ceil = S("#2a2e32", 0.8, 0.5);
  // ---- sala de controle: x −9…9, z −16…0, y 0…5,5
  root.add(M(new THREE.PlaneGeometry(18, 16), floor, [0, 0, -8], [-Math.PI / 2, 0, 0]));
  root.add(M(new THREE.PlaneGeometry(18, 16), ceil, [0, 5.5, -8], [Math.PI / 2, 0, 0]));
  // paredes laterais com a porta da direita (x = 9, z −9…−6,6)
  root.add(M(new THREE.PlaneGeometry(16, 5.5), cmbW, [-9, 2.75, -8], [0, Math.PI / 2, 0]));
  root.add(M(new THREE.PlaneGeometry(9, 5.5), cmbW, [9, 2.75, -11.5 - 0.5], [0, -Math.PI / 2, 0]));
  root.add(M(new THREE.PlaneGeometry(6.6, 5.5), cmbW, [9, 2.75, -3.3], [0, -Math.PI / 2, 0]));
  root.add(M(new THREE.PlaneGeometry(2.4, 2.4), cmbW, [9, 4.3, -7.8], [0, -Math.PI / 2, 0]));
  // o batente da porta lateral + campo de força (aceso até a luta)
  [-9.05, -6.55].forEach((z) => root.add(B(0.3, 3.1, 0.3, k.cmbDark, [8.9, 1.55, z])));
  root.add(B(0.3, 0.3, 2.8, k.cmbDark, [8.9, 3.1, -7.8]));
  const ff = M(new THREE.PlaneGeometry(2.4, 3.0), new THREE.MeshBasicMaterial({ color: "#6ff0ff", transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false, toneMapped: false }), [8.95, 1.5, -7.8], [0, Math.PI / 2, 0], false);
  ff.name = "ff";
  root.add(ff);
  // nervuras e faixas de luz Combine nas paredes laterais
  for (let z = -15; z <= -1; z += 2.8)
    [-1, 1].forEach((s) => {
      if (s > 0 && z > -10 && z < -5.5) return;
      root.add(B(0.35, 5.5, 0.4, k.cmbDark, [s * 8.82, 2.75, z]));
      root.add(B(0.06, 1.2, 0.14, k.lightCyan, [s * 8.62, 3.3, z], [0, 0, 0], false));
    });
  // a parede da janela (z = 0): sólida até x = −1,2 (onde o Gordon se esconde), vidro de −1,2 a 6, sólida depois
  root.add(M(new THREE.PlaneGeometry(7.8, 5.5), wall, [-5.1, 2.75, 0], [0, Math.PI, 0]));
  root.add(M(new THREE.PlaneGeometry(3, 5.5), wall, [7.5, 2.75, 0], [0, Math.PI, 0]));
  root.add(M(new THREE.PlaneGeometry(7.2, 1.9), wall, [2.4, 0.95, 0], [0, Math.PI, 0]));
  root.add(M(new THREE.PlaneGeometry(7.2, 1.6), wall, [2.4, 4.7, 0], [0, Math.PI, 0]));
  // ---- a galeria (do lado do Gordon): piso 1,0 m, x −7…7, z 0…3
  root.add(M(new THREE.PlaneGeometry(14, 3), floor, [0, 1.0, 1.5], [-Math.PI / 2, 0, 0]));
  root.add(M(new THREE.PlaneGeometry(14, 3), ceil, [0, 3.9, 1.5], [Math.PI / 2, 0, 0]));
  root.add(M(new THREE.PlaneGeometry(14, 2.9), wallG, [0, 2.45, 3], [0, Math.PI, 0]));
  // o lado da galeria da parede da janela (as mesmas aberturas)
  root.add(M(new THREE.PlaneGeometry(5.8, 2.9), wallG, [-4.1, 2.45, 0.01]));
  root.add(M(new THREE.PlaneGeometry(1, 2.9), wallG, [6.5, 2.45, 0.01]));
  root.add(M(new THREE.PlaneGeometry(7.2, 0.9), wallG, [2.4, 1.45, 0.01]));
  root.add(M(new THREE.PlaneGeometry(7.2, 0.3), wallG, [2.4, 3.75, 0.01]));
  // o canto onde ele se esconde: uma coluna de antepara grossa com faixa de aviso e cabos
  root.add(B(0.7, 2.9, 0.9, wallG, [-1.55, 2.45, 0.35]));
  root.add(M(new THREE.PlaneGeometry(0.7, 0.18), new THREE.MeshStandardMaterial({ map: hazardTex(2), roughness: 0.6 }), [-1.55, 1.2, 0.81], [0, 0, 0], false));
  for (let i = 0; i < 3; i++) root.add(Cyl(0.035, 0.035, 2.9, k.pipe, [-1.15 - i * 0.09, 2.45, 0.82 + i * 0.03]));
  // o vidro com moldura e montantes
  const glass = M(new THREE.PlaneGeometry(7.2, 1.7), k.glass, [2.4, 2.75, 0], [0, 0, 0], false);
  glass.renderOrder = 5;
  root.add(glass);
  [-1.2, 1.2, 3.6, 6.0].forEach((x) => root.add(B(0.12, 1.75, 0.18, k.cmbDark, [x, 2.75, 0])));
  root.add(B(7.4, 0.14, 0.4, k.cmbDark, [2.4, 1.9, 0.05]));
  root.add(B(7.4, 0.12, 0.2, k.cmbDark, [2.4, 3.62, 0]));
  // ---- o vidro do fundo (z = −16) e a sala dos motores (z −30…−16)
  root.add(M(new THREE.PlaneGeometry(1.8, 1.6), cmbW, [-8.1, 0.8, -16]));
  root.add(M(new THREE.PlaneGeometry(13.9, 1.6), cmbW, [2.05, 0.8, -16]));
  root.add(M(new THREE.PlaneGeometry(18, 0.8), cmbW, [0, 5.1, -16]));
  for (let x = -9; x <= 9; x += 3) if (x !== -6) root.add(B(0.18, 5.5, 0.25, k.cmbDark, [x, 2.75, -16]));
  const glass2 = M(new THREE.PlaneGeometry(13.9, 3.1), k.glass, [2.05, 3.15, -16], [0, 0, 0], false);
  glass2.renderOrder = 5;
  root.add(glass2);
  // porta do fundo (à esquerda) — por onde eles saem
  // 11/10: a porta do fundo é um vão de verdade (batente + campo de força desligado) que dá na passarela entre os motores
  [-7.15, -4.85].forEach((x) => root.add(B(0.3, 3.2, 0.4, k.cmbDark, [x, 1.6, -16])));
  root.add(B(2.6, 0.35, 0.4, k.cmbDark, [-6, 3.2, -16]));
  const walk = S("#2a3036", 0.5, 0.7);
  root.add(M(new THREE.PlaneGeometry(2.2, 16), new THREE.MeshStandardMaterial({ map: grateTex(2, 14), roughness: 0.55, metalness: 0.7 }), [-6, 0.01, -24], [-Math.PI / 2, 0, 0]));
  root.add(B(2.4, 0.15, 16, walk, [-6, -0.08, -24]));
  [-7.1, -4.9].forEach((x) => {
    root.add(rod([x, 1.05, -16.2], [x, 1.05, -32], 0.035, walk));
    for (let z = -16.6; z > -32; z -= 1.4) root.add(Cyl(0.025, 0.025, 1.05, walk, [x, 0.52, z], [0, 0, 0], 6));
  });
  for (let z = -18; z > -32; z -= 3) {
    const l = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.06, 0.15), k.lightCyan);
    l.position.set(-6, 2.9, z);
    root.add(l);
  }
  root.add(B(3, 3.4, 0.3, k.cmbDark, [-6, 1.7, -32.2]));
  const walkL = new THREE.PointLight("#9fe8ff", 60, 14, 1.5);
  walkL.position.set(-6, 2.6, -23);
  root.add(walkL);
  root.add(M(new THREE.PlaneGeometry(2.2, 2.8), new THREE.MeshBasicMaterial({ color: "#ffb36a", toneMapped: false, transparent: true, opacity: 0.5 }), [-6, 1.4, -32.0], [0, 0, 0], false));
  const hall = new THREE.Group();
  hall.add(M(new THREE.PlaneGeometry(26, 14), floor, [0, -1.5, -23], [-Math.PI / 2, 0, 0]));
  hall.add(M(new THREE.PlaneGeometry(26, 9), cmbW, [0, 3, -30]));
  const engM = S("#3a4148", 0.35, 0.85);
  const engGlow = new THREE.MeshBasicMaterial({ color: "#bff6ff", toneMapped: false });
  [-1.2, 5.2].forEach((x) => {
    hall.add(Cyl(2.2, 2.4, 9, engM, [x, 3, -23], [0, 0, 0], 28));
    for (let i = 0; i < 6; i++) hall.add(M(new THREE.TorusGeometry(2.42, 0.12, 8, 32), i % 2 ? engM : engGlow, [x, -0.6 + i * 1.4, -23], [Math.PI / 2, 0, 0], false));
    hall.add(Cyl(0.6, 0.6, 9.4, engGlow, [x, 3, -23], [0, 0, 0], 12));
  });
  for (let i = 0; i < 6; i++) hall.add(rod([-12, 6.5, -18 - i * 2], [12, 6.5, -18 - i * 2], 0.12, k.pipe));
  root.add(hall);
  const engL = new THREE.PointLight("#bff6ff", 220, 30, 1.6);
  engL.position.set(0, 3, -20);
  root.add(engL);
  // o G-Man: silhueta escura recortada contra a luz dos motores, atrás do vidro
  const gmTex = new THREE.Texture(im["hl3silh/gman_silh.png"]);
  gmTex.needsUpdate = true;
  const gman = M(new THREE.PlaneGeometry(0.72, 1.95), new THREE.MeshBasicMaterial({ color: "#05070a", map: gmTex, transparent: true, depthWrite: false, toneMapped: false }), [1.45, 2.6, -17.4], [0, 0, 0], false);
  gman.visible = false;
  // a passarela onde ele fica
  root.add(B(10, 0.12, 1.6, S("#2a3036", 0.5, 0.7), [2, 1.58, -17.6]));
  for (let x = -3; x <= 7; x += 1.2) root.add(Cyl(0.03, 0.03, 1.0, S("#2a3036", 0.5, 0.7), [x, 2.1, -16.9], [0, 0, 0], 5));
  root.add(rod([-3, 2.6, -16.9], [7, 2.6, -16.9], 0.035, S("#2a3036", 0.5, 0.7)));
  root.add(gman);
  // ---- teto: vigas, bandejas de cabo, tubos, luminárias
  for (let z = -15; z <= -1; z += 2.8) root.add(B(18, 0.35, 0.3, k.cmbDark, [0, 5.3, z]));
  [-6.5, -3, 3, 6.5].forEach((x) => root.add(rod([x, 5.0, -15.8], [x, 5.0, -0.2], 0.09, x > 0 ? k.pipe : k.pipeY)));
  [[-4, -4], [4, -4], [-4, -11], [4, -11]].forEach(([x, z]) => {
    const l = lamp(k);
    l.position.set(x, 5.05, z);
    root.add(l);
  });
  // ---- a mesa holográfica no centro (sem pilar: um tablado baixo com o holograma do núcleo em cima)
  root.add(Cyl(2.1, 2.3, 0.9, k.cmb, [0, 0.45, -8.6], [0, 0, 0], 8));
  root.add(Cyl(1.95, 1.95, 0.06, S("#0d1a20", 0.3, 0.6, { emissive: new THREE.Color("#0f3a44"), emissiveIntensity: 1 }), [0, 0.93, -8.6], [0, 0, 0], 8));
  root.add(M(new THREE.TorusGeometry(1.9, 0.035, 6, 8), k.lightCyan, [0, 0.97, -8.6], [Math.PI / 2, 0, Math.PI / 8], false));
  root.add(M(new THREE.TorusGeometry(0.9, 0.025, 6, 32), k.lightCyan, [0, 0.97, -8.6], [Math.PI / 2, 0, 0], false));
  const holo = new THREE.Group();
  holo.position.set(0, 2.0, -8.6);
  const hm = new THREE.LineBasicMaterial({ color: "#7ef0ff", transparent: true, opacity: 0.85, toneMapped: false });
  holo.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(0.75, 1)), hm));
  [0, 1, 2].forEach((i) => {
    const r = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.TorusGeometry(1.05 + i * 0.18, 0.005, 3, 48)), hm);
    r.rotation.set(Math.PI / 2 + i * 0.5, i * 0.7, 0);
    r.name = "ring" + i;
    holo.add(r);
  });
  root.add(holo);
  const holoL = new THREE.PointLight("#7ef0ff", 60, 12, 1.6);
  holoL.position.set(0, 2.2, -8.6);
  root.add(holoL);
  // ---- os consoles em anel em volta da mesa (o da Alyx é o da frente à direita)
  const screens: ReturnType<typeof liveScreen>[] = [];
  const CONS: [number, number][] = [[ALYX_C[0], ALYX_C[2]], [-2.8, -5.4], [-4.4, -9.6], [4.4, -9.8], [0, -13.0]];
  CONS.forEach(([x, z], i) => {
    const ls = liveScreen(256, 184, i * 3 + 1);
    screens.push(ls);
    const c = combineConsole(k, ls.tex, i === 0 ? 1 : 0.9);
    c.position.set(x, 0, z);
    c.lookAt(0, 0, -8.6);
    c.rotateY(Math.PI);
    root.add(c);
  });
  // ---- cobertura: caixotes inteiros e barreiras Combine (na luta)
  const crates: THREE.Group[] = [];
  ([[6.3, -5.6, 1.0], [5.2, -10.6, 1.1], [6.8, -11.6, 0.9], [3.6, -12.4, 1.0]] as [number, number, number][]).forEach(([x, z, s]) => {
    const c = crate(k, s);
    c.position.set(x, 0, z);
    c.rotation.y = rnd(x) * 0.6;
    root.add(c);
    crates.push(c);
  });
  [[-5.5, -12], [5.6, -2.8]].forEach(([x, z]) => {
    const b = combineBarrier(k);
    b.position.set(x, 0, z);
    b.rotation.y = x > 0 ? -0.5 : 0.4;
    root.add(b);
  });
  // ---- painel de parede que a telecinese arranca
  const panel = B(2.2, 1.6, 0.12, cmbW, [8.75, 2.4, -12.4], [0, Math.PI / 2, 0]);
  root.add(panel);
  // ---- o Advisor (e um segundo para a luta)
  const adv = buildAdvisorBoard(im[ADVISOR_SVG]);
  adv.g.position.set(...ADV_A);
  root.add(adv.g);
  const adv2 = buildAdvisorBoard(im[ADVISOR_SVG]);
  adv2.g.position.set(-4, 3.4, -12);
  adv2.g.visible = false;
  root.add(adv2.g);
  // telecinese: anéis violeta em volta de quem está preso
  const tkM = new THREE.MeshBasicMaterial({ color: "#c79bff", transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
  const tk = new THREE.Group();
  [0, 1, 2].forEach((i) => tk.add(M(new THREE.TorusGeometry(0.55 + i * 0.12, 0.018, 6, 40), tkM, [0, 0, 0], [Math.PI / 2, 0, 0], false)));
  root.add(tk);
  // ---- os crachás 3D
  const alyx = makeTag(im["hl3silh/alyx_badge.jpg"], { label: "ALYX", col: ORANGE, kind: "person" }, 2.0);
  alyx.g.position.set(ALYX_C[0] + 1.1, 0, ALYX_C[2] + 0.7);
  root.add(alyx.g);
  const sold = SOLDIERS.map((p, i) => {
    const t = makeTag(im["hl3silh/combine_badge.jpg"], { label: "COMBINE", col: RED, kind: "combine", sub: ["OTA · 04", "OTA · 11", "OTA · 07"][i] }, 1.7);
    t.g.position.set(...p);
    t.g.visible = false;
    root.add(t.g);
    return t;
  });
  const extra = [0, 1, 2].map((i) => {
    const t = makeTag(i === 2 ? null : im["hl3silh/combine_badge.jpg"], { label: i === 2 ? "HUNTER" : "COMBINE", col: i === 2 ? "#7ec8ff" : RED, kind: i === 2 ? "hunter" : "combine", sub: i === 2 ? "CAÇADOR" : "OTA · 1" + i }, 1.8);
    t.g.visible = false;
    root.add(t.g);
    return t;
  });
  // luzes
  root.add(new THREE.HemisphereLight("#8aa4b8", "#141a1e", 0.55));
  const key1 = new THREE.PointLight("#dfeeff", 70, 18, 1.4);
  key1.position.set(-4, 4.8, -4);
  const key2 = new THREE.PointLight("#dfeeff", 70, 18, 1.4);
  key2.position.set(4, 4.8, -4);
  const key3 = new THREE.PointLight("#dfeeff", 50, 18, 1.4);
  key3.position.set(0, 4.8, -12);
  const gal = new THREE.PointLight("#ffd9a8", 6, 6, 1.6);
  gal.position.set(-3, 3.6, 2);
  const alarm = new THREE.PointLight("#ff3020", 0, 30, 1.2);
  alarm.position.set(0, 5, -8);
  root.add(key1, key2, key3, gal, alarm);
  // a Gravity Gun (primeira pessoa), v2: carcaça cinza com bisel, painéis laranja, bobinas, núcleo aceso, três garras
  // curvas e a empunhadura — no canto de baixo à direita, como no jogo
  const gg = new THREE.Group();
  const ggDark = S("#34373a", 0.5, 0.55);
  const ggOr = S("#d8681a", 0.5, 0.25);
  const ggBlack = S("#141516", 0.5, 0.6);
  const hs = new THREE.Shape();
  hs.moveTo(-0.07, -0.06);
  hs.lineTo(0.07, -0.06);
  hs.lineTo(0.09, 0.02);
  hs.lineTo(0.05, 0.07);
  hs.lineTo(-0.05, 0.07);
  hs.lineTo(-0.09, 0.02);
  hs.closePath();
  const housing = M(new THREE.ExtrudeGeometry(hs, { depth: 0.42, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 3 }), ggDark, [0, 0, -0.26], [0, 0, 0], false);
  gg.add(housing);
  [-1, 1].forEach((sd) => gg.add(B(0.012, 0.07, 0.3, ggOr, [sd * 0.094, 0.0, 0.06], [0, 0, sd * 0.35], false)));
  for (let i = 0; i < 4; i++) gg.add(M(new THREE.TorusGeometry(0.075, 0.012, 8, 24), ggBlack, [0, 0.005, 0.18 - i * 0.05], [0, 0, 0], false));
  const core = M(new THREE.CylinderGeometry(0.045, 0.05, 0.14, 24), new THREE.MeshBasicMaterial({ color: "#ffc27a", toneMapped: false }), [0, 0.005, -0.27], [Math.PI / 2, 0, 0], false);
  core.name = "core";
  gg.add(core);
  gg.add(M(new THREE.TorusGeometry(0.06, 0.014, 8, 28), ggOr, [0, 0.005, -0.32], [0, 0, 0], false));
  const claws = new THREE.Group();
  claws.name = "claws";
  [0, 1, 2].forEach((i) => {
    const a = (i / 3) * Math.PI * 2 + Math.PI / 2;
    const cl = new THREE.Group();
    cl.rotation.z = a;
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0.05, 0, -0.3), new THREE.Vector3(0.1, 0, -0.38), new THREE.Vector3(0.11, 0, -0.48), new THREE.Vector3(0.07, 0, -0.56)]);
    cl.add(M(new THREE.TubeGeometry(curve, 16, 0.014, 8, false), ggOr, [0, 0, 0], [0, 0, 0], false));
    cl.add(M(new THREE.SphereGeometry(0.02, 12, 10), ggBlack, [0.07, 0, -0.56], [0, 0, 0], false));
    claws.add(cl);
  });
  gg.add(claws);
  gg.add(B(0.05, 0.13, 0.07, ggBlack, [0, -0.11, 0.14], [0.25, 0, 0], false));
  gg.add(B(0.03, 0.02, 0.12, ggOr, [0, 0.085, 0.0], [0, 0, 0], false));
  gg.scale.setScalar(0.62);
  gg.visible = false;
  root.add(gg);
  const beamM = new THREE.MeshBasicMaterial({ color: "#ffb060", transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1, 8, 1, true), beamM);
  beam.visible = false;
  root.add(beam);
  const shock = M(new THREE.TorusGeometry(1, 0.05, 6, 40), new THREE.MeshBasicMaterial({ color: "#ffd29a", transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }), [0, 0, 0], [0, 0, 0], false);
  root.add(shock);
  return { root, k, screens, holo, holoL, adv, adv2, tk, tkM, alyx, sold, extra, crates, panel, gman, alarm, ff, gg, beam, beamM, shock };
};

// ------------------------------------------------------------------------------------------------ 1:09:59 / 1:10:42 pelo vidro
// o Gordon na galeria, encostado na coluna de antepara (a parede que o esconde, em primeiro plano à esquerda), espiando
// a sala de controle pela janela. Modo 1: os Advisors percebem — o canal fecha, o Advisor vira devagar, o G-Man aparece
// do outro lado do vidro do fundo, a Alyx é erguida no ar, os soldados apontam.
export const HL10Glass3D: React.FC<PR & { mode?: number; frozen?: number }> = (p) => {
  const f0 = useCurrentFrame();
  const f = p.frozen !== undefined ? Math.round(p.frozen * 30) + (f0 % 1) : f0;
  const life = p.life;
  const mode = p.mode ?? 0;
  const lite = React.useContext(LiteCtx);
  const ctx = React.useContext(SfxCtx);
  const [advAt, calcAt, execAt, failAt, closeAt, ctrlAt, editAt, sendAt, recvAt, fail2At, purpAt] = ats(p, ["advAt", "calcAt", "execAt", "failAt", "closeAt", "ctrlAt", "editAt", "sendAt", "recvAt", "fail2At", "purpAt"]);
  const [snapAt, turnAt, stableAt, enoughAt, noFakeAt, glassAt, gmanAt, liftAt, aimAt, radioAt] = ats(p, ["snapAt", "turnAt", "stableAt", "enoughAt", "noFakeAt", "glassAt", "gmanAt", "liftAt", "aimAt", "radioAt"]);
  // câmera: atrás da coluna; no "perto o suficiente" ele avança até a beira do vidro; no modo 1 já está perto
  const near = mode ? 1 : P(f, closeAt, 40);
  const lean = 0.03 * Math.sin(f0 / 70);
  const cam: Cam = {
    pos: [-0.75 + 0.9 * near + lean, 2.62, 1.75 - 0.9 * near],
    tgt: mode ? kv(f, [[0, [1.6, 1.6, -8]], [glassAt, [1.6, 1.6, -8]], [glassAt + 30, [2.4, 1.6, -14]], [liftAt, [2.6, 2.3, -7]]]) : kv(f, [[0, [2.4, 1.5, -8]], [ctrlAt, [2.6, 1.4, -6]], [life, [2.4, 1.5, -7]]]),
    fov: mode ? 52 : kk(f, [[0, 54], [ctrlAt, 48]]),
  };
  const failing = (!mode && ((f >= failAt && f < failAt + 20) || (f >= fail2At && f < fail2At + 24))) || (mode && f >= snapAt && f < snapAt + 8);
  const turn = mode ? IO((f - turnAt) / 50) : 0;
  const lift = mode ? P(f, liftAt, 30) : 0;
  const link = (!mode && f >= recvAt && f < recvAt + 24) || (!mode && f >= calcAt && f < execAt) || (mode && f < snapAt);
  const update = (W: Deck, camera: THREE.Camera) => {
    W.screens.forEach((s, i) => s.draw(f0 + i * 7, !!failing && i !== 0));
    W.holo.rotation.y = f0 / 50;
    W.holo.children.forEach((c, i) => (c.rotation.z = f0 / (30 + i * 9)));
    W.holoL.color.set(failing ? "#ff4a30" : "#7ef0ff");
    ((W.holo.children[0] as THREE.LineSegments).material as THREE.LineBasicMaterial).color.set(failing ? "#ff6a50" : "#7ef0ff");
    W.alarm.intensity = failing ? 160 : mode && f >= aimAt ? 40 + 30 * Math.sin(f0 / 4) : 0;
    // o Advisor: flutua, olha para a Alyx; no modo 1 vira para o vidro (para o Gordon) e ergue a Alyx
    const A = W.adv.g;
    A.position.set(ADV_A[0], ADV_A[1] + 0.08 * Math.sin(f0 / 20), ADV_A[2]);
    const toAlyx = Math.atan2(ALYX_C[0] - ADV_A[0], ALYX_C[2] - ADV_A[2]);
    const toGlass = Math.atan2(-1.0 - ADV_A[0], 1.5 - ADV_A[2]);
    A.rotation.set(0, 0, 0);
    A.userData.flip = turn > 0.5;
    void toAlyx;
    void toGlass;
    W.adv.glow.intensity = mode ? 8 + 16 * lift : 6;
    W.adv.arms.forEach((a, i) => (a.rotation.x = 0.15 * Math.sin(f0 / 26 + i)));
    // a Alyx (crachá) — sobe no ar
    const ay = 1.0 * lift;
    W.alyx.g.position.set(ALYX_C[0] + 1.1, ay, ALYX_C[2] + 0.7);
    W.alyx.setSub(mode ? (lift > 0.5 ? "ERGUIDA NO AR" : f >= glassAt ? "OLHA PARA OS MOTORES" : undefined) : f >= editAt ? "ALTERA A SEQUÊNCIA" : f >= calcAt ? "ENTREGA O CÁLCULO" : undefined);
    W.alyx.face(camera, 1);
    W.tk.position.set(ALYX_C[0] + 1.1, ay + 1.0, ALYX_C[2] + 0.7);
    W.tk.children.forEach((r, i) => {
      r.scale.setScalar(1 + 0.25 * (((f0 / 20 + i / 3) % 1)));
      r.position.y = -0.8 + (((f0 / 20 + i / 3) % 1)) * 1.6;
    });
    W.tkM.opacity = lift * 0.8;
    W.sold.forEach((t, i) => {
      t.g.visible = true;
      t.setSub(mode && f >= aimAt ? "MIRANDO" : ["OTA · 04", "OTA · 11", "OTA · 07"][i]);
      t.face(camera, 1);
    });
    W.extra.forEach((t) => (t.g.visible = false));
    W.adv2.g.visible = false;
    // o G-Man atrás do vidro do fundo
    W.gman.visible = mode === 1 && f >= gmanAt && f < liftAt + 24;
    (W.gman.material as THREE.MeshBasicMaterial).opacity = P(f, gmanAt, 14) * (1 - P(f, liftAt + 10, 12));
  };
  const pr = projectorC(cam);
  const advQ = pr([ADV_A[0], ADV_A[1], ADV_A[2]]);
  const alyQ = pr([ALYX_C[0] + 1.1, 1.0 * lift + 2.2, ALYX_C[2] + 0.7]);
  const seq = ["Ω7", "Δ3", "Ψ1", "Λ9"];
  const edited = !mode && f >= editAt + 10;
  return (
    <AbsoluteFill style={{ background: "#020304", overflow: "hidden" }}>
      {ctx.mode === "collect" ? null : (
        <ThreeCanvas frameloop="demand" width={1920} height={1080} style={{ position: "absolute", inset: 0 }} dpr={lite ? 0.75 : 1} gl={{ antialias: true }} camera={{ fov: 50, position: [0, 2, 2], near: 0.05, far: 600 }}>
          <Stage build={buildDeck} update={update} cam={cam} imgs={IMGS} />
        </ThreeCanvas>
      )}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {/* o canal Alyx ↔ Advisor (fecha com estalo) */}
        {link && advQ && alyQ ? <line x1={alyQ.x} y1={alyQ.y} x2={advQ.x} y2={advQ.y} stroke={mode ? VIO : "#ffd27a"} strokeWidth={2.5} strokeDasharray="8 8" strokeDashoffset={-f0 * 3} opacity={0.8} /> : null}
        {mode && f >= snapAt && f < snapAt + 10 && advQ && alyQ ? <line x1={(alyQ.x + advQ.x) / 2 - 30} y1={(alyQ.y + advQ.y) / 2} x2={(alyQ.x + advQ.x) / 2 + 30} y2={(alyQ.y + advQ.y) / 2 + 10} stroke={RED} strokeWidth={5} /> : null}
        {mode && f >= aimAt && alyQ
          ? SOLDIERS.map((s, i) => {
              const q = pr([s[0], 1.35, s[2]]);
              return q ? <line key={i} x1={q.x} y1={q.y} x2={alyQ.x} y2={alyQ.y + 60} stroke="rgba(255,60,40,0.85)" strokeWidth={1.6} opacity={P(f, aimAt + i * 3, 8)} /> : null;
            })
          : null}
      </svg>
      {/* o zoom do HEV na tela dela: a sequência alterada antes de enviar */}
      {!mode && f >= ctrlAt ? (
        <div style={{ position: "absolute", right: 90, top: 130, width: 560, padding: "16px 20px", background: "linear-gradient(160deg, rgba(20,60,84,0.9), rgba(6,22,32,0.94))", clipPath: "polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px)", boxShadow: `inset 0 0 0 1.5px ${CYC}`, fontFamily: MONO, opacity: P(f, ctrlAt, 8) }}>
          <div style={{ fontSize: 15, letterSpacing: 4, color: CYC }}>H.E.V. · ZOOM · CONSOLE DA ALYX</div>
          <div style={{ display: "flex", gap: 14, marginTop: 14 }}>
            {seq.map((s2, i) => {
              const ch = i === 2 && f >= editAt;
              return (
                <div key={i} style={{ padding: "10px 14px", border: `2px solid ${ch ? ORANGE : "rgba(95,243,255,0.6)"}`, color: ch ? ORANGE : "#dff8ff", fontSize: 34, letterSpacing: 2 }}>
                  {ch && edited ? "Ψ4" : s2}
                </div>
              );
            })}
          </div>
          {f >= sendAt ? <div style={{ marginTop: 12, fontSize: 20, letterSpacing: 4, color: CYC, opacity: P(f, sendAt, 6) }}>ENVIAR ›››</div> : null}
          {f >= recvAt ? <div style={{ marginTop: 8, fontSize: 18, letterSpacing: 3, color: VIO, opacity: P(f, recvAt, 6) }}>ADVISOR · RECEBIDO · EXECUTANDO</div> : null}
          {f >= fail2At ? <div style={{ marginTop: 8, fontSize: 20, letterSpacing: 3, color: RED, opacity: P(f, fail2At, 6) }}>FALHA · ANTES DA CONCLUSÃO</div> : null}
          {f >= purpAt ? <div style={{ position: "absolute", right: 20, bottom: 18, padding: "4px 12px", border: `3px solid ${ORANGE}`, color: ORANGE, fontSize: 22, letterSpacing: 4, transform: `rotate(-6deg) scale(${1.5 - 0.5 * P(f, purpAt, 6)})`, opacity: P(f, purpAt, 6) }}>DE PROPÓSITO</div> : null}
        </div>
      ) : null}
      {!mode && f >= advAt && f < ctrlAt ? (
        <div style={{ position: "absolute", left: 90, top: 130, width: 520, padding: "14px 18px", borderRadius: 10, background: "rgba(8,8,10,0.8)", border: `1.5px solid ${CYC}`, fontFamily: MONO, opacity: P(f, advAt, 8) * (1 - P(f, ctrlAt - 8, 8)) }}>
          <div style={{ fontSize: 15, letterSpacing: 4, color: CYC }}>O MESMO PADRÃO</div>
          {[[calcAt, "CÁLCULO · A. VANCE", ORANGE], [execAt, "OS ADVISORS EXECUTAM", VIO], [failAt, "FALHA · POUCO ANTES DA CONCLUSÃO", RED]].map(([t0, txt, col]) =>
            f >= (t0 as number) ? <div key={txt as string} style={{ fontSize: 20, letterSpacing: 2, color: col as string, marginTop: 8, opacity: P(f, t0 as number, 6) }}>› {txt as string}</div> : null,
          )}
          {f >= closeAt ? <div style={{ fontSize: 16, letterSpacing: 3, color: CREAM, marginTop: 12, opacity: P(f, closeAt, 8) }}>DESSA VEZ GORDON ESTÁ PERTO O SUFICIENTE</div> : null}
        </div>
      ) : null}
      {mode ? (
        <div style={{ position: "absolute", right: 90, top: 130, width: 520, padding: "14px 18px", borderRadius: 10, background: "rgba(8,8,10,0.82)", border: `1.5px solid ${VIO}`, fontFamily: MONO, opacity: P(f, 4, 8) * (1 - P(f, radioAt, 10)) }}>
          <div style={{ fontSize: 15, letterSpacing: 4, color: VIO }}>OS ADVISORS PERCEBEM</div>
          {f >= snapAt ? <div style={{ fontSize: 20, letterSpacing: 2, color: RED, marginTop: 8 }}>› CANAL COM A. VANCE · FECHADO</div> : null}
          {f >= stableAt ? <div style={{ fontSize: 20, letterSpacing: 2, color: "#dff8ff", marginTop: 8 }}>› MANIFESTAÇÃO ESTÁVEL · 94%</div> : null}
          {f >= enoughAt ? <div style={{ fontSize: 20, letterSpacing: 2, color: "#dff8ff", marginTop: 8 }}>› PROCEDIMENTO · AVANÇADO O SUFICIENTE</div> : null}
          {f >= noFakeAt ? <div style={{ fontSize: 22, letterSpacing: 2, color: VIO, marginTop: 10 }}>NÃO PRECISAM MAIS FINGIR</div> : null}
        </div>
      ) : null}
      {mode && f >= radioAt ? (
        <div style={{ position: "absolute", left: 90, bottom: 170, width: 560, display: "flex", gap: 16, padding: 14, borderRadius: 12, background: "rgba(14,10,4,0.9)", border: `1.5px solid ${AMB}`, fontFamily: MONO, opacity: P(f, radioAt, 8) }}>
          <div style={{ width: 90, height: 108, borderRadius: 8, flexShrink: 0, backgroundImage: `url(${staticFile("hl3silh/eli_retrato.png")})`, backgroundSize: "cover", backgroundPosition: "50% 30%", border: `2px solid ${AMB}` }} />
          <div>
            <div style={{ fontSize: 15, letterSpacing: 4, color: AMB }}>RÁDIO · ELI VANCE</div>
            <svg width={400} height={50} style={{ marginTop: 8 }}>
              {Array.from({ length: 40 }).map((_, j) => {
                const h = 4 + Math.abs(Math.sin(f0 / 2.4 + j * 0.7) * Math.sin(f0 / 6 + j * 0.3)) * 40;
                return <rect key={j} x={j * 10} y={25 - h / 2} width={5} height={h} fill={AMB} opacity={0.85} />;
              })}
            </svg>
          </div>
        </div>
      ) : null}
      {failing ? <AbsoluteFill style={{ background: "rgba(255,40,30,0.08)", pointerEvents: "none" }} /> : null}
      <Hud f={f0} yaw={hudEye(cam).yaw} eye={hudEye(cam)} blips={[{ x: ALYX_C[0], y: -ALYX_C[2], hot: mode === 1 }]} msg={!mode && f < advAt ? "NO MEIO DO CAOS · O MESMO PADRÃO" : mode && f >= gmanAt && f < liftAt ? "DO OUTRO LADO DO VIDRO · OBSERVANDO" : undefined} msgCol={CREAM} />
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f0, life), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};
// ------------------------------------------------------------------------------------------------ 1:11:16 o Eli no rádio (o mesmo convés ao fundo, desfocado)
export const HL10EliPlea3D: React.FC<PR & { inner?: PR; frozenAt?: number }> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [pleaAt, lostAt, helpAt, foolAt, stillAt, daughterAt] = ats(p, ["pleaAt", "lostAt", "helpAt", "foolAt", "stillAt", "daughterAt"]);
  const inner = (p.inner ?? {}) as PR;
  const lines: [number, string, string][] = [
    [pleaAt, "“Gordon, salva a Alyx.”", TXT],
    [lostAt, "“Eu não entendo mais o que está acontecendo.”", TXT],
    [helpAt, "ajudando os Combine?", "rgba(242,240,247,0.7)"],
    [foolAt, "enganando eles?", "rgba(242,240,247,0.7)"],
    [stillAt, "ainda existe alguma coisa dela ali?", "rgba(242,240,247,0.7)"],
    [daughterAt, "“Mas continua sendo a minha filha.”", AMB],
  ];
  const cur = lines.filter(([t0]) => f >= t0);
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <AbsoluteFill style={{ filter: "blur(7px) brightness(0.42) saturate(0.7)", transform: "scale(1.05)" }}>
        <HL10Glass3D {...inner} mode={1} frozen={(p.frozenAt ?? 990) / 30} life={1e6} />
      </AbsoluteFill>
      <div style={{ position: "absolute", left: 160, top: 180, display: "flex", gap: 30, alignItems: "flex-start" }}>
        <div style={{ width: 300, height: 360, borderRadius: 14, overflow: "hidden", border: `3px solid ${AMB}`, backgroundImage: `url(${staticFile("hl3silh/eli_retrato.png")})`, backgroundSize: "cover", backgroundPosition: "50% 30%", boxShadow: "0 20px 50px rgba(0,0,0,0.7)" }} />
        <div style={{ fontFamily: MONO }}>
          <div style={{ fontSize: 18, letterSpacing: 5, color: AMB }}>RÁDIO · ELI VANCE · NO OUVIDO DO GORDON</div>
          <svg width={900} height={80} style={{ marginTop: 10 }}>
            {Array.from({ length: 90 }).map((_, j) => {
              const h = 4 + Math.abs(Math.sin(f / 2.2 + j * 0.7) * Math.sin(f / 5.5 + j * 0.3)) * 66;
              return <rect key={j} x={j * 10} y={40 - h / 2} width={5} height={h} fill={AMB} opacity={0.85} />;
            })}
          </svg>
        </div>
      </div>
      <div style={{ position: "absolute", left: 160, right: 140, top: 600 }}>
        {cur.slice(-3).map(([t0, txt, col]) => (
          <div key={txt} style={{ fontFamily: FONT, fontWeight: 800, fontSize: 52, lineHeight: 1.15, color: col, marginTop: 10, opacity: P(f, t0, 8), textShadow: "0 6px 30px rgba(0,0,0,0.9)" }}>{txt}</div>
        ))}
      </div>
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life, 6), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

void FONT;
void decode;
void canvasTex;
void M;
void B;
void Cyl;
void rod;
void TXT;
void staticFile;
