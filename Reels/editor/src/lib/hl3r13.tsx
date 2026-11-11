// =================================================================================================
// HL3 · 1:17:43 → reformulado (12/10/2026). Pedido dele: do ~1:17 até o fim tudo refeito, parte por parte; régua =
// "ninguém chamaria de tosco", nada fora de perspectiva; se o POV não serve, mudar de linguagem.
// Aqui: a conversa na câmara do núcleo. Eles estão na laje de entrada (a sala aprovada, CoreRoom, com a aura); duas
// estações de controle com monitor grande (uma de cada lado da laje) mostram o que a Alyx explica — telas de verdade
// dentro do 3D (canvas como textura, com profundidade). A câmera vira para a estação e volta para o núcleo.
// =================================================================================================
import React, { useMemo, useRef } from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import * as THREE from "three";
import { C, HL } from "./hl3";
import { FilmLook } from "./hl3r";
import { Eye, Hud } from "./hl3rf";
import { keys, fadeIO } from "./hl3rx";
import { CoreRoom, buildCoreRoom, FlagAt, Call, MECH_L, MECH_R, ARM_R } from "./hl3r9";
import { SilhouetteAt } from "./hl3rx";
import { MONO } from "./overlays";
import { useAdvScene } from "./advgl";
import { staticFile } from "remotion";
import { proj } from "./hl3rf";
import { CW, CH, Ctx, Im, useImgs, screenBg, scan, txt, strike, boxed, badge, font } from "./hl3r12";

const RED = "#ff5d4d";
const AMB = "#ffb22e";
const CREAM = "#ffe2b0";
const ICE = "#9fe6ff";
const VIO = "#c79bff";
const GREEN = "#8dffa8";
const ORANGE = HL.orange;
const P = (f: number, at: number, d = 12) => interpolate(f, [at, at + d], [0, 1], { ...C, easing: Easing.out(Easing.cubic) });
type PR = Record<string, number> & { life: number };
const at = (p: PR, k: string) => Math.round((p[k] as number | undefined) ?? 1e6);
type V3 = [number, number, number];
const W3 = (p: V3) => new THREE.Vector3(p[0], p[2], -p[1]);

// ------------------------------------------------------------------------------------------------ as estações
// monitor 2,8 × 1,575 m numa carcaça escura, sobre um pedestal, com a régua de luz embaixo; virado para quem está na laje
const SW = 2.8, SH = 1.575;
// 12/10: nas laterais da laje (no meio elas tampavam os mecanismos), viradas para quem para diante delas
export const ST_L = { c: [-6.1, 3.2, 1.75] as V3, look: [-2.4, 3.6, 1.75] as V3 };
export const ST_R = { c: [6.1, 3.2, 1.75] as V3, look: [2.4, 3.6, 1.75] as V3 };
const makeStation = (st: { c: V3; look: V3 }) => {
  const cv = document.createElement("canvas");
  cv.width = CW;
  cv.height = CH;
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  const g = new THREE.Group();
  const dark = new THREE.MeshStandardMaterial({ color: "#23272c", roughness: 0.5, metalness: 0.6 });
  const steel = new THREE.MeshStandardMaterial({ color: "#3a4048", roughness: 0.45, metalness: 0.7 });
  // 30/10 (ele: a estrutura não fazia sentido — tela, uma prateleira inclinada, uma barra azul solta e duas bases): um
  // terminal Combine só, de cima a baixo. A carcaça funda com a tela embutida e a luz como um filete dentro da moldura de
  // baixo; atrás, a placa de montagem presa num pescoço; uma coluna única até o chão e um pé só
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(SW, SH), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
  scr.position.z = 0.081;
  const housing = new THREE.Mesh(new THREE.BoxGeometry(SW + 0.2, SH + 0.2, 0.16), dark);
  const backPlate = new THREE.Mesh(new THREE.BoxGeometry(SW * 0.62, SH * 0.62, 0.16), steel);
  backPlate.position.set(0, 0, -0.16);
  const strip = new THREE.Mesh(new THREE.BoxGeometry(SW * 0.9, 0.022, 0.01), new THREE.MeshBasicMaterial({ color: "#7ff3ff", toneMapped: false }));
  strip.position.set(0, -SH / 2 - 0.05, 0.082);
  const h = st.c[2] - 0.08; // do centro da tela até o pé
  const neck = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.24), dark);
  neck.position.set(0, 0, -0.32);
  const post = new THREE.Mesh(new THREE.BoxGeometry(0.34, h, 0.3), steel);
  post.position.set(0, -h / 2, -0.36);
  const base = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.08, 0.8), dark);
  base.position.set(0, -st.c[2] + 0.04, -0.36);
  g.add(housing, backPlate, scr, strip, neck, post, base);
  g.position.copy(W3(st.c));
  g.lookAt(W3(st.look));
  g.updateMatrixWorld(true);
  const lamp = new THREE.PointLight("#bfeeff", 22, 7, 1.3);
  lamp.position.copy(W3([st.c[0] + (st.look[0] - st.c[0]) * 0.25, st.c[1] + (st.look[1] - st.c[1]) * 0.25, st.c[2]]));
  return { cv, tex, g, lamp };
};
type Draw = (c: Ctx, f: number, im: Im) => void;
const idle = (c: Ctx, n: number) => {
  c.fillStyle = "#04080b";
  c.fillRect(0, 0, CW, CH);
  txt(c, `BOREALIS · CÂMARA DO NÚCLEO · ESTAÇÃO ${n}`, 40, 60, 24, "rgba(159,230,255,0.3)", 1);
};
// a cena genérica: a sala, as duas estações (cada uma com a sua tela), a câmera por quadros-chave, a Alyx na laje
const CoreTalk: React.FC<{ f: number; life: number; left?: Draw; right?: Draw; eye: Eye; alyx?: { at: V3; sub?: string }; hot?: number; children?: React.ReactNode; msg?: string; mech?: boolean; objs?: THREE.Object3D[]; objLights?: THREE.Light[]; mL?: number; mR?: number }> = ({ f, life, left, right, eye, alyx, hot = 0, children, msg, mech = false, objs = [], objLights = [], mL = 0, mR = 0 }) => {
  const im = useImgs();
  const G = useMemo(() => buildCoreRoom(mech), [mech]);
  const S = useMemo(() => [makeStation(ST_L), makeStation(ST_R)], []);
  const lights = useMemo(() => [new THREE.HemisphereLight("#e2e6ee", "#2a2218", 2.3), ...S.map((s) => s.lamp)], [S]);
  const last = useRef<number[]>([]);
  if (im)
    S.forEach((s, i) => {
      if (last.current[i] === f) return;
      last.current[i] = f;
      const c = s.cv.getContext("2d")!;
      c.globalAlpha = 1;
      const d = i ? right : left;
      if (d) d(c, f, im);
      else idle(c, i + 1);
      s.tex.needsUpdate = true;
    });
  return (
    <AbsoluteFill style={{ background: "#020304", overflow: "hidden" }}>
      <CoreRoom e={eye} f={f} G={G} o={{ hot, mL, mR, amb: 0.4, extras: [...S.map((s) => s.g), ...objs], glLights: [...lights, ...objLights] }} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {alyx ? <FlagAt e={eye} pt={alyx.at} label="ALYX" col={ORANGE} f={f} sub={alyx.sub} /> : null}
      </svg>
      {children}
      <Hud f={f} yaw={eye.yaw} eye={eye} blips={alyx ? [{ x: alyx.at[0], y: alyx.at[1] }] : []} msg={msg} msgCol={AMB} />
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};
// a câmera: parada na laje, olhando para a estação da esquerda (L), da direita (R) ou para o núcleo (N)
const POSE: Record<string, { x: number; y: number; yaw: number; pitch: number; F?: number }> = {
  // 30/10 (ele: a câmera longe da tela): mais perto e mais fechada — a tela ocupa quase todo o quadro
  L: { x: -2.9, y: 3.6, yaw: -1.68, pitch: -0.03, F: 1250 },
  R: { x: 2.9, y: 3.6, yaw: 1.68, pitch: -0.03, F: 1250 },
  N: { x: 0, y: 3.8, yaw: 0, pitch: 0.1 },
  // de costas para o núcleo, olhando a porta blindada da entrada
  B: { x: 0.2, y: 4.4, yaw: Math.PI, pitch: -0.03 },
  // aberto: os dois mecanismos no quadro
  M: { x: 0, y: 1.4, yaw: 0, pitch: 0.04, F: 820 },
  ML: { x: -1.7, y: 4.6, yaw: -0.85, pitch: -0.02 },
  MR: { x: 1.7, y: 4.6, yaw: 0.85, pitch: -0.02 },
  // a Alyx de pé junto à estação da direita
  A: { x: 1.2, y: 2.4, yaw: 1.3, pitch: -0.02 },
  // a mesma, mais fechada na tela (a última escolha)
  A2: { x: 3.0, y: 2.9, yaw: 1.42, pitch: -0.02, F: 1150 },
  // 30/10 (ele: na troca mirava a estação em vez da Alyx e o centro em vez do Varga): miradas calculadas para onde eles
  // estão de fato (Alyx em [0,9 · 5,6], Varga em [-2,6 · 6,4]), da laje, um pouco mais fechadas
  AY: { x: -0.4, y: 3.0, yaw: 0.464, pitch: -0.14, F: 1100 },
  VG: { x: -0.4, y: 3.2, yaw: -0.602, pitch: -0.14, F: 1100 },
  // o fundo da sala, à direita (a saliência onde o G-Man fica), mais fechado
  G: { x: 0, y: 4.2, yaw: 0.31, pitch: 0.03, F: 1700 },
};
const camPath = (f: number, ks: [number, string][], shake = 0): Eye => {
  const kx: [number, number][] = [], ky: [number, number][] = [], kyaw: [number, number][] = [], kp: [number, number][] = [], kF: [number, number][] = [];
  ks.forEach(([t, k], i) => {
    const q = POSE[k];
    const t0 = i ? t : 0;
    // segura a pose até a próxima troca (a virada leva 26 quadros)
    if (i) {
      const pq = POSE[ks[i - 1][1]];
      kx.push([t0 - 1, pq.x]);
      ky.push([t0 - 1, pq.y]);
      kyaw.push([t0 - 1, pq.yaw]);
      kp.push([t0 - 1, pq.pitch]);
      kF.push([t0 - 1, pq.F ?? 960]);
    }
    kx.push([t0 + (i ? 26 : 0), q.x]);
    ky.push([t0 + (i ? 26 : 0), q.y]);
    kyaw.push([t0 + (i ? 26 : 0), q.yaw]);
    kp.push([t0 + (i ? 26 : 0), q.pitch]);
    kF.push([t0 + (i ? 26 : 0), q.F ?? 960]);
  });
  const sh = shake;
  return {
    x: keys(f, kx) + 0.03 * Math.sin(f / 50) + sh * (Math.sin(f * 1.7) * 0.05),
    y: keys(f, ky),
    z: 1.65 + 0.012 * Math.sin(f / 40) + sh * Math.sin(f * 2.3) * 0.04,
    yaw: keys(f, kyaw) + 0.012 * Math.sin(f / 37),
    pitch: keys(f, kp) + sh * Math.sin(f * 1.9) * 0.02,
    F: keys(f, kF),
  };
};

// ------------------------------------------------------------------------------------------------ o tabuleiro do G-Man
const YEARS = ["1998", "2004", "2007", "2020", "2025", "2026"];
const ROWS = ["LINHA A", "LINHA B", "LINHA C"];
const gx = (i: number) => 230 + i * 180, gy = (r: number) => 230 + r * 120;
const piece = (c: Ctx, im: Im, x0: number, y0: number, kind: "gordon" | "alyx" | "adv" | "bor", o = 1, lift = 0) => {
  // desenhado em escala 1,6 em volta do ponto (legível na tela da estação)
  c.save();
  c.translate(x0, y0);
  c.scale(1.6, 1.6);
  const x = 0, y = 0;
  c.globalAlpha = o;
  const yy = y - lift;
  if (lift > 0) {
    c.fillStyle = "rgba(0,0,0,0.35)";
    c.beginPath();
    c.ellipse(x, y + 22, 34, 9, 0, 0, Math.PI * 2);
    c.fill();
  }
  if (kind === "alyx" || kind === "gordon") {
    const src = kind === "alyx" ? "hl3silh/alyx_badge.jpg" : "hl3silh/gordon_retrato.png";
    const img = im[src];
    c.fillStyle = "#0b0d10";
    c.fillRect(x - 32, yy - 52, 64, 74);
    if (img && img.width) {
      const s = Math.max(60 / img.width, 60 / img.height);
      c.save();
      c.beginPath();
      c.rect(x - 30, yy - 50, 60, 60);
      c.clip();
      c.drawImage(img, x - (img.width * s) / 2, yy - 50, img.width * s, img.height * s);
      c.restore();
    }
    c.fillStyle = kind === "alyx" ? ORANGE : AMB;
    c.fillRect(x - 32, yy + 10, 64, 14);
    font(c, 11, 700);
    c.fillStyle = "#0b0b0b";
    c.fillText(kind === "alyx" ? "ALYX" : "GORDON", x - (kind === "alyx" ? 14 : 22), yy + 21);
  } else if (kind === "adv") {
    c.fillStyle = "rgba(60,40,90,0.95)";
    c.strokeStyle = VIO;
    c.lineWidth = 3;
    c.beginPath();
    c.ellipse(x, yy - 14, 30, 18, 0, 0, Math.PI * 2);
    c.fill();
    c.stroke();
    font(c, 12, 700);
    c.fillStyle = VIO;
    c.fillText("ADVISORS", x - 30, yy + 24);
  } else {
    c.strokeStyle = ICE;
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(x - 34, yy - 10);
    c.lineTo(x + 26, yy - 10);
    c.lineTo(x + 36, yy - 24);
    c.lineTo(x + 30, yy + 4);
    c.lineTo(x - 30, yy + 4);
    c.closePath();
    c.stroke();
    c.strokeRect(x - 22, yy - 26, 18, 16);
    font(c, 12, 700);
    c.fillStyle = ICE;
    c.fillText("BOREALIS", x - 30, yy + 24);
  }
  c.globalAlpha = 1;
  c.restore();
};
const brief = (c: Ctx, im: Im, x: number, y: number, o = 1) => {
  // a maleta (o "cursor" do G-Man), com a alça
  c.globalAlpha = o;
  c.fillStyle = "#14161a";
  c.strokeStyle = CREAM;
  c.lineWidth = 2.5;
  c.fillRect(x - 26, y - 16, 52, 34);
  c.strokeRect(x - 26, y - 16, 52, 34);
  c.strokeRect(x - 9, y - 24, 18, 8);
  c.globalAlpha = 1;
  void im;
};
const boardGrid = (c: Ctx, hiRow = -1) => {
  YEARS.forEach((y, i) => {
    txt(c, y, gx(i) - 34, 130, 28, "rgba(242,240,247,0.7)", 1, 600);
    c.strokeStyle = "rgba(159,230,255,0.12)";
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(gx(i), 150);
    c.lineTo(gx(i), 540);
    c.stroke();
  });
  ROWS.forEach((r, k) => {
    c.strokeStyle = k === hiRow ? "rgba(255,178,46,0.6)" : "rgba(242,240,247,0.35)";
    c.lineWidth = k === hiRow ? 3 : 2;
    c.beginPath();
    c.moveTo(140, gy(k));
    c.lineTo(1250, gy(k));
    c.stroke();
    txt(c, r, 30, gy(k) + 8, 20, "rgba(242,240,247,0.6)", 1, 600);
  });
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const drawBoard = (p: PR): Draw => {
  const [askAt, diffAt, moveAt, outAt, inAt, wrongAt, alyxAt, linesAt] = ["askAt", "diffAt", "moveAt", "outAt", "inAt", "wrongAt", "alyxAt", "linesAt"].map((k) => at(p, k));
  return (c, f, im) => {
    screenBg(c, "O TABULEIRO DO G-MAN", CREAM);
    boardGrid(c, f >= linesAt ? 1 : -1);
    // GORDON: tirado de 1998 (o momento) e devolvido em 2004 (outro momento)
    const out = P(f, outAt, 18), ins = P(f, inAt, 18);
    const gxp = lerp(gx(0), gx(1), ins), gyp = gy(0) - 70 * out * (1 - ins);
    piece(c, im, gxp, gyp + 70 * 0, "gordon", 1, 70 * out * (1 - ins));
    if (out > 0 && ins < 1) brief(c, im, gxp, gyp - 110 * out, out);
    // o BOREALIS: posto onde não deveria estar (de 2020 para 2026, numa linha que não é a dele)
    const wr = P(f, wrongAt, 20);
    piece(c, im, lerp(gx(3), gx(5), wr), lerp(gy(2), gy(0), wr), "bor", 1, 40 * Math.sin(wr * Math.PI));
    if (wr > 0 && wr < 1) brief(c, im, lerp(gx(3), gx(5), wr), lerp(gy(2), gy(0), wr) - 80, 1);
    if (wr >= 1) txt(c, "ONDE NÃO DEVERIA ESTAR", gx(5) - 230, gy(0) + 92, 22, RED, P(f, wrongAt + 20, 8));
    // a ALYX: tirada da linha A e posta na linha B (entre linhas)
    const al = P(f, alyxAt, 20), ln = P(f, linesAt, 24);
    const ax = gx(4), ay = lerp(gy(0), gy(1), ln);
    piece(c, im, ax, ay, "alyx", 1, 60 * al * (1 - ln));
    if (al > 0 && ln < 1) brief(c, im, ax, ay - 60 * al - 60, al);
    piece(c, im, gx(2), gy(2), "adv", 1);
    // em cima: a pergunta do Gordon; embaixo: o que ele consegue fazer
    if (f >= askAt) {
      boxed(c, 40, 600, 1200, 90, CREAM, P(f, askAt, 8) * (1 - P(f, diffAt, 10)));
      txt(c, "SE ELE SABIA TANTO · POR QUE NÃO FEZ ACONTECER?", 66, 656, 30, CREAM, P(f, askAt + 2, 10) * (1 - P(f, diffAt, 10)), 600);
    }
    const lines: [number, string][] = [[moveAt, "MOVE PEÇAS"], [outAt, "TIRA ALGUÉM DE UM MOMENTO"], [inAt, "DEVOLVE EM OUTRO"], [wrongAt, "PÕE ONDE NÃO DEVERIA ESTAR"], [linesAt, "ENTRE LINHAS TEMPORAIS"]];
    let cur = -1;
    lines.forEach(([t], i) => f >= t && (cur = i));
    if (cur >= 0) {
      boxed(c, 40, 600, 1200, 90, AMB, P(f, lines[cur][0], 8));
      txt(c, lines[cur][1], 66, 658, 34, AMB, P(f, lines[cur][0] + 2, 10), 700);
      txt(c, `${cur + 1} / ${lines.length}`, 1120, 658, 22, "rgba(242,240,247,0.5)", 1);
    }
    scan(c, f);
  };
};
// o que ele NÃO consegue: todo mundo no lugar, o último passo de dentro desta realidade
const drawCant = (p: PR): Draw => {
  const [cantAt, prepAt, allAt, lastAt, needAt] = ["cantAt", "prepAt", "allAt", "lastAt", "needAt"].map((k) => at(p, k));
  return (c, f, im) => {
    screenBg(c, "O TABULEIRO DO G-MAN · O CATALISADOR", CREAM);
    // o catalisador no centro (o núcleo sobre a ferida)
    const cx = 640, cy = 330;
    const g = c.createRadialGradient(cx, cy, 4, cx, cy, 90);
    g.addColorStop(0, "rgba(255,240,200,0.95)");
    g.addColorStop(0.5, "rgba(255,178,46,0.55)");
    g.addColorStop(1, "rgba(255,120,40,0)");
    c.fillStyle = g;
    c.beginPath();
    c.arc(cx, cy, 90, 0, Math.PI * 2);
    c.fill();
    txt(c, "CATALISADOR", cx - 86, cy + 120, 24, AMB, 1, 700);
    // as peças chegando ao redor (preparar o cenário)
    const spots: [number, number, "gordon" | "alyx" | "adv" | "bor"][] = [[cx - 300, cy - 70, "gordon"], [cx + 300, cy - 70, "alyx"], [cx - 300, cy + 130, "adv"], [cx + 300, cy + 130, "bor"]];
    const from: [number, number][] = [[80, 160], [1200, 160], [80, 560], [1200, 560]];
    spots.forEach(([x, y, k], i) => {
      const t = P(f, prepAt + i * 24, 30);
      piece(c, im, lerp(from[i][0], x, t), lerp(from[i][1], y, t), k, Math.max(0.25, t), 30 * Math.sin(t * Math.PI));
      if (t > 0 && t < 1) brief(c, im, lerp(from[i][0], x, t), lerp(from[i][1], y, t) - 90, 1);
    });
    txt(c, "ELE NÃO PODE COMPLETAR O CATALISADOR", 40, 130, 30, RED, P(f, cantAt, 10), 700);
    if (f >= allAt) txt(c, "TODO MUNDO NO LUGAR CERTO", 40, 600, 30, CREAM, P(f, allAt, 10), 600);
    // o último passo: a maleta não entra
    const lk = P(f, lastAt, 12);
    if (lk > 0) {
      c.setLineDash([10, 8]);
      c.strokeStyle = RED;
      c.lineWidth = 3;
      c.globalAlpha = lk;
      c.beginPath();
      c.arc(cx, cy, 130, 0, Math.PI * 2);
      c.stroke();
      c.setLineDash([]);
      brief(c, im, cx + 170, cy - 170, lk);
      c.strokeStyle = RED;
      c.lineWidth = 6;
      c.beginPath();
      c.moveTo(cx + 140, cy - 200);
      c.lineTo(cx + 200, cy - 140);
      c.moveTo(cx + 200, cy - 200);
      c.lineTo(cx + 140, cy - 140);
      c.stroke();
      c.globalAlpha = 1;
      txt(c, "O ÚLTIMO PASSO · DE DENTRO DESTA REALIDADE", 40, 650, 26, AMB, lk, 600);
    }
    if (f >= needAt) {
      boxed(c, 680, 560, 560, 70, CREAM, P(f, needAt, 8));
      txt(c, "PRECISA QUE ALGUÉM FAÇA POR ELE", 700, 606, 26, CREAM, P(f, needAt + 2, 10), 700);
    }
    scan(c, f);
  };
};
export const HL11BoardS: React.FC<PR & { mode?: number }> = (p) => {
  const f = useCurrentFrame();
  const mode = (p.mode as number | undefined) ?? 0;
  const left = useMemo(() => (mode ? drawCant(p) : drawBoard(p)), [mode]); // eslint-disable-line react-hooks/exhaustive-deps
  const ks: [number, string][] = mode ? [[0, "L"]] : [[0, "N"], [Math.max(30, at(p, "diffAt") - 20), "L"]];
  const eye = camPath(f, ks);
  return <CoreTalk f={f} life={p.life} eye={eye} left={left} alyx={{ at: [0.7, 5.3, 0], sub: "EXPLICA" }} msg={f < 60 && !mode ? "CÂMARA DO NÚCLEO" : undefined} />;
};

// ------------------------------------------------------------------------------------------------ a escolha
const drawChoice = (p: PR): Draw => {
  const [undAt, obeyAt, ensureAt, choiceAt] = ["undAt", "obeyAt", "ensureAt", "choiceAt"].map((k) => at(p, k));
  return (c, f, im) => {
    screenBg(c, "A. VANCE · PARA QUE ELA FOI PREPARADA", ORANGE);
    badge(c, im, 70, 110, 300, "ALYX", ORANGE);
    txt(c, "O TAMANHO DO QUE ACONTECEU COM ELA", 420, 160, 26, "rgba(242,240,247,0.75)", P(f, undAt, 10));
    txt(c, "PREPARADA PARA OBEDECER O G-MAN", 420, 240, 32, "rgba(242,240,247,0.8)", P(f, obeyAt, 10), 600);
    strike(c, 420, 240, 640, P(f, obeyAt + 40, 10));
    txt(c, "PARA GARANTIR QUE ALGUÉM", 420, 320, 36, CREAM, P(f, ensureAt, 10), 700);
    txt(c, "CHEGASSE ATÉ ESTE PONTO", 420, 366, 36, CREAM, P(f, ensureAt + 8, 10), 700);
    const k = P(f, choiceAt, 14);
    if (k > 0) {
      // o ponto e os dois caminhos que saem dele
      c.globalAlpha = k;
      c.fillStyle = AMB;
      c.beginPath();
      c.arc(520, 520, 16, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = AMB;
      c.lineWidth = 4;
      c.beginPath();
      c.moveTo(380, 520);
      c.lineTo(504, 520);
      c.stroke();
      [[-1, ICE], [1, RED]].forEach(([s, col]) => {
        c.strokeStyle = col as string;
        c.beginPath();
        c.moveTo(536, 520);
        c.bezierCurveTo(640, 520, 660, 520 + (s as number) * 70, 820 * Math.min(1, k * 1.2) + 0, 520 + (s as number) * 80);
        c.stroke();
      });
      c.globalAlpha = 1;
      txt(c, "QUE A ESCOLHA EXISTISSE", 420, 650, 44, AMB, P(f, choiceAt + 10, 12), 800);
    }
    scan(c, f);
  };
};
export const HL11ChoiceS: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const left = useMemo(() => drawChoice(p), []); // eslint-disable-line react-hooks/exhaustive-deps
  const eye = camPath(f, [[0, "L"], [at(p, "choiceAt") + 40, "N"]]);
  return <CoreTalk f={f} life={p.life} eye={eye} left={left} alyx={{ at: [0.7, 5.3, 0], sub: "ENTENDE" }} />;
};

// ------------------------------------------------------------------------------------------------ a arma (Kleiner pelo rádio)
const globe = (c: Ctx, x: number, y: number, r: number, k: number, f: number) => {
  c.strokeStyle = "rgba(159,230,255,0.8)";
  c.lineWidth = 2;
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.stroke();
  for (let i = 1; i < 4; i++) {
    c.beginPath();
    c.ellipse(x, y, r, (r * i) / 4, 0, 0, Math.PI * 2);
    c.stroke();
    c.beginPath();
    c.ellipse(x, y, (r * i) / 4, r, 0, 0, Math.PI * 2);
    c.stroke();
  }
  // a estrutura Combine na Terra (os nós)
  const N = [[-0.5, -0.3], [0.2, -0.5], [0.4, 0.1], [-0.2, 0.3], [0.6, -0.2], [-0.6, 0.15], [0.05, 0.05]];
  N.forEach(([a, b], i) => {
    const q = P(f, i * 4, 8) * k;
    if (q <= 0) return;
    c.strokeStyle = RED;
    c.lineWidth = 3;
    c.globalAlpha = q;
    c.beginPath();
    c.arc(x + a * r, y + b * r, 10 + 3 * Math.sin(f / 6 + i), 0, Math.PI * 2);
    c.stroke();
    c.globalAlpha = 1;
  });
};
const drawWeapon = (p: PR): Draw => {
  const [alignAt, instrAt, crossAt, notOnlyAt, againstAt, fireAt, weaponAt, structAt, solAt] = ["alignAt", "instrAt", "crossAt", "notOnlyAt", "againstAt", "fireAt", "weaponAt", "structAt", "solAt"].map((k) => at(p, k));
  return (c, f, im) => {
    screenBg(c, "RÁDIO · DR. KLEINER · INSTRUMENTOS", AMB);
    // o Kleiner no canto
    const kl = im["hl3silh/kleiner_retrato.png"];
    if (kl && kl.width) c.drawImage(kl, 1110, 20, 130, 130);
    c.strokeStyle = AMB;
    c.lineWidth = 3;
    c.strokeRect(1110, 20, 130, 130);
    const swap = P(f, weaponAt - 30, 14);
    if (swap < 1) {
      c.globalAlpha = 1 - swap;
      // os instrumentos: o núcleo e a ferida, e os dados da Mossman cruzando
      const tr = (y0: number, col: string, ph: number, amp: number) => {
        c.strokeStyle = col;
        c.lineWidth = 3;
        c.beginPath();
        for (let x = 0; x <= 520; x += 4) {
          const y = y0 + Math.sin((x + f * 5) / 30 + ph) * amp * (0.6 + 0.4 * Math.sin((x + f) / 80));
          if (x) c.lineTo(60 + x, y);
          else c.moveTo(60 + x, y);
        }
        c.stroke();
      };
      txt(c, "O NÚCLEO", 60, 170, 22, AMB, P(f, alignAt, 8));
      tr(240, AMB, 0, 40 * P(f, alignAt, 20));
      txt(c, "A FERIDA", 60, 330, 22, RED, P(f, instrAt, 8));
      tr(400, RED, 1.3, 40 * P(f, instrAt, 20));
      const cr = P(f, crossAt, 20);
      if (cr > 0) {
        txt(c, "× DADOS DA MOSSMAN", 640, 170, 22, ICE, cr);
        const ms = im["hl3silh/mossman_badge.jpg"];
        if (ms && ms.width) {
          c.globalAlpha = (1 - swap) * cr;
          c.drawImage(ms, 640, 190, 110, 110);
          c.globalAlpha = 1 - swap;
        }
        tr(330, ICE, 2.1, 30 * cr);
      }
      txt(c, "NÃO SERVE SÓ PARA O QUE OS ADVISORS QUEREM", 60, 540, 28, CREAM, P(f, notOnlyAt, 10), 600);
      txt(c, "A MESMA CONDIÇÃO · CONTRA ELES", 60, 590, 28, AMB, P(f, againstAt, 10), 700);
      txt(c, "SE CONTROLAREM O DISPARO", 60, 640, 28, AMB, P(f, fireAt, 10), 700);
      c.globalAlpha = 1;
    }
    if (swap > 0) {
      c.globalAlpha = swap;
      // o Borealis → o arco → a Terra com a estrutura Combine
      c.strokeStyle = ICE;
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(100, 420);
      c.lineTo(330, 420);
      c.lineTo(360, 395);
      c.lineTo(350, 450);
      c.lineTo(120, 450);
      c.closePath();
      c.stroke();
      c.strokeRect(150, 390, 50, 30);
      txt(c, "O BOREALIS", 130, 490, 20, ICE, 1, 600);
      const arc = P(f, weaponAt, 30);
      c.strokeStyle = VIO;
      c.lineWidth = 5;
      c.beginPath();
      for (let s = 0; s <= 40 * arc; s++) {
        const t = s / 40;
        const x = 370 + (880 - 370) * t, y = 410 - Math.sin(t * Math.PI) * 220;
        if (s) c.lineTo(x, y);
        else c.moveTo(x, y);
      }
      c.stroke();
      globe(c, 980, 380, 170, P(f, structAt, 10), f - structAt);
      txt(c, "O BOREALIS PODE VIRAR UMA ARMA", 60, 150, 40, CREAM, P(f, weaponAt, 10), 800);
      txt(c, "A ESTRUTURA COMBINE NA TERRA", 760, 620, 22, RED, P(f, structAt, 10), 600);
      txt(c, "A SOLUÇÃO QUE TODO MUNDO PROCUROU?", 60, 680, 28, AMB, P(f, solAt, 10), 700);
      c.globalAlpha = 1;
    }
    scan(c, f);
  };
};
// as reações (Kleiner, Magnusson, Eli) na estação da esquerda
const drawReact = (p: PR): Draw => {
  const [klAt, magAt, eliAt, destroyAt, useAt] = ["klAt", "magAt", "eliAt", "destroyAt", "useAt"].map((k) => at(p, k));
  return (c, f, im) => {
    screenBg(c, "CANAL ABERTO · A EQUIPE", AMB);
    const who: [number, string, string, string, string][] = [
      [klAt, "hl3silh/kleiner_retrato.png", "DR. KLEINER", "VÊ UMA CHANCE DE VENCER", GREEN],
      [magAt, "hl3silh/magnusson_badge.jpg", "DR. MAGNUSSON", "COMO ESTABILIZAR O SISTEMA", ICE],
      [eliAt, "hl3silh/eli_retrato.png", "ELI VANCE", "HESITA", AMB],
    ];
    who.forEach(([t, src, name, s, col], i) => {
      const k = P(f, t, 10);
      if (k <= 0) return;
      const x = 60 + i * 400, y = 120;
      boxed(c, x, y, 360, 420, col, k);
      const img = im[src];
      c.globalAlpha = k;
      if (img && img.width) {
        const sc = Math.max(320 / img.width, 240 / img.height);
        c.save();
        c.beginPath();
        c.rect(x + 20, y + 20, 320, 240);
        c.clip();
        c.drawImage(img, x + 180 - (img.width * sc) / 2, y + 20, img.width * sc, img.height * sc);
        c.restore();
      }
      c.globalAlpha = 1;
      txt(c, name, x + 20, y + 300, 26, col, k, 700);
      txt(c, s, x + 20, y + 350, s.length > 18 ? 18 : 24, "#f2f0f7", P(f, t + 6, 10));
    });
    if (f >= destroyAt) {
      txt(c, "DESTRUIR O BOREALIS · SEMPRE FOI O QUE ELE QUIS", 60, 600, 24, "rgba(242,240,247,0.75)", P(f, destroyAt, 10));
      strike(c, 60, 600, 820, P(f, useAt, 10));
    }
    if (f >= useAt) txt(c, "AGORA · USAR CONTRA OS COMBINE PRIMEIRO", 60, 660, 32, RED, P(f, useAt, 10), 800);
    scan(c, f);
  };
};
export const HL12WeaponS: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const right = useMemo(() => drawWeapon(p), []); // eslint-disable-line react-hooks/exhaustive-deps
  const left = useMemo(() => drawReact(p), []); // eslint-disable-line react-hooks/exhaustive-deps
  const eye = camPath(f, [[0, "N"], [at(p, "instrAt") - 10, "R"], [at(p, "klAt") - 16, "L"]]);
  return <CoreTalk f={f} life={p.life} eye={eye} left={left} right={right} alyx={{ at: [0.7, 5.3, 0] }} hot={P(f, at(p, "alignAt"), 30) * 0.6} msg={f < 50 ? "O ALINHAMENTO COMEÇOU" : undefined} />;
};
void RED;
void GREEN;
void CREAM;
void CH;

// ================================================================================================= 1:20:07 → 1:24:03
const wrapTxt = (c: Ctx, s: string, x: number, y: number, maxW: number, px: number, col: string, k: number, w = 400, lh = 1.3) => {
  if (k <= 0) return y;
  font(c, px, w);
  const words = s.split(" ");
  let line = "", yy = y;
  const lines: string[] = [];
  words.forEach((wd) => {
    const t = line ? line + " " + wd : wd;
    if (c.measureText(t).width > maxW && line) {
      lines.push(line);
      line = wd;
    } else line = t;
  });
  if (line) lines.push(line);
  lines.forEach((l) => {
    txt(c, l, x, yy, px, col, k, w);
    yy += px * lh;
  });
  return yy;
};
// o "não" da Alyx: a arma × o que acontece depois (quem controla)
const drawHolds = (p: PR): Draw => {
  const [noAt, seenAt, weaponAt, afterAt, ifAt, notSolveAt, whoAt, todayAt, genAt, specAt, combAt, quoteAt, quote2At] = ["noAt", "seenAt", "weaponAt", "afterAt", "ifAt", "notSolveAt", "whoAt", "todayAt", "genAt", "specAt", "combAt", "quoteAt", "quote2At"].map((k) => at(p, k));
  return (c, f, im) => {
    const q = P(f, quoteAt, 12);
    screenBg(c, "A. VANCE · NÃO", ORANGE);
    if (q < 1) {
      c.globalAlpha = 1 - q;
      txt(c, "NÃO", 40, 170, 90, ORANGE, P(f, noAt, 8), 800);
      txt(c, "ELA JÁ VIU ESSA ESCOLHA ANTES", 300, 150, 28, "rgba(242,240,247,0.8)", P(f, seenAt, 10));
      const w = P(f, weaponAt, 10);
      if (w > 0) {
        boxed(c, 40, 220, 520, 240, RED, w);
        c.strokeStyle = RED;
        c.lineWidth = 4;
        c.globalAlpha = (1 - q) * w;
        c.beginPath();
        c.arc(300, 320, 60, 0, Math.PI * 2);
        c.moveTo(220, 320);
        c.lineTo(380, 320);
        c.moveTo(300, 240);
        c.lineTo(300, 400);
        c.stroke();
        c.globalAlpha = 1 - q;
        txt(c, "A RESISTÊNCIA VÊ · UMA ARMA", 60, 440, 24, RED, w, 700);
      }
      const a = P(f, afterAt, 10);
      boxed(c, 600, 220, 640, 240, AMB, a);
      txt(c, "ELA VÊ · O QUE ACONTECE DEPOIS", 620, 260, 24, AMB, a, 700);
      const ik = P(f, ifAt, 10);
      ["BOREALIS", "NÚCLEO", "FERIDA"].forEach((s, i) => {
        boxed(c, 620 + i * 205, 290, 190, 54, ICE, P(f, ifAt + i * 8, 8));
        txt(c, s, 640 + i * 205, 326, 22, ICE, P(f, ifAt + i * 8, 8), 600);
      });
      txt(c, "CONTINUAM EXISTINDO", 620, 380, 22, "rgba(242,240,247,0.8)", ik);
      txt(c, "NÃO RESOLVE · SÓ MUDA QUEM CONTROLA", 620, 430, 26, CREAM, P(f, notSolveAt, 10), 700);
      const who: [number, string, string][] = [[todayAt, "HOJE", "A RESISTÊNCIA"], [genAt, "DEPOIS", "OUTRA GERAÇÃO"], [specAt, "UM DIA", "OUTRA ESPÉCIE"], [combAt, "OU", "OS COMBINE · DE VOLTA"]];
      txt(c, "QUEM CONTROLA", 40, 530, 22, "rgba(242,240,247,0.6)", P(f, whoAt, 8));
      who.forEach(([t, k1, k2], i) => {
        const kk = P(f, t, 10);
        const x = 40 + i * 305;
        boxed(c, x, 550, 285, 120, i === 3 ? RED : AMB, kk);
        txt(c, k1, x + 22, 590, 20, "rgba(242,240,247,0.6)", kk);
        // 30/10 (ele: "OS COMBINE · DE VOLTA" colado na borda): a fonte encolhe até caber com 22 px de folga dos dois lados
        let px = 26;
        font(c, px, 700);
        while (px > 14 && c.measureText(k2).width > 285 - 44) font(c, --px, 700);
        txt(c, k2, x + 22, 634, px, i === 3 ? RED : AMB, kk, 700);
      });
      c.globalAlpha = 1;
    }
    if (q > 0) {
      c.globalAlpha = q;
      badge(c, im, 70, 140, 260, "ALYX", ORANGE);
      wrapTxt(c, "“Vocês estão olhando para uma arma.”", 400, 240, 800, 46, "rgba(242,240,247,0.85)", q, 600);
      wrapTxt(c, "“Eu estou olhando para todas as vezes que alguém decidiu que seria a última pessoa a usá-la.”", 400, 380, 800, 40, CREAM, P(f, quote2At, 12), 700);
      c.globalAlpha = 1;
    }
    scan(c, f);
  };
};
export const HL12HoldsS: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const left = useMemo(() => drawHolds(p), []); // eslint-disable-line react-hooks/exhaustive-deps
  const eye = camPath(f, [[0, "N"], [at(p, "seenAt") - 10, "L"]]);
  return <CoreTalk f={f} life={p.life} eye={eye} left={left} alyx={{ at: [0.7, 5.3, 0], sub: "NÃO" }} />;
};
// o Varga: as palavras nos registros e a pergunta
const drawVarga = (p: PR): Draw => {
  const [warAt, recAt, woundAt, askAt, qAt, silAt, promAt] = ["warAt", "recAt", "woundAt", "askAt", "qAt", "silAt", "promAt"].map((k) => at(p, k));
  return (c, f, im) => {
    screenBg(c, "REGISTROS · BOREALIS · DADOS DA MOSSMAN", ICE);
    const tags = ["GUERRA", "TECNOLOGIA", "ACABAR COM OS COMBINE"];
    tags.forEach((s, i) => {
      const k = P(f, warAt + i * 10, 8);
      boxed(c, 40 + i * 260, 100, i === 2 ? 420 : 240, 50, "rgba(242,240,247,0.4)", k);
      txt(c, s, 56 + i * 260, 134, 22, "rgba(242,240,247,0.75)", k);
    });
    const rows: [string, boolean][] = [["PROC. 7-Ψ · CONDIÇÃO DE ALINHAMENTO · REG. 8412", false], ["OBJETIVO DECLARADO · CONTINUIDADE", true], ["FASE SEGUINTE · ASCENSÃO", true], ["AMOSTRAS · CONSCIÊNCIAS PRESERVADAS FORA DO CORPO", true], ["OBSERVAÇÃO · RESULTADO NÃO VERIFICADO", false]];
    rows.forEach(([s, hot], i) => {
      const k = P(f, recAt + i * 12, 8);
      if (hot && k > 0) {
        c.fillStyle = `rgba(255,178,46,${0.12 * k})`;
        c.fillRect(34, 192 + i * 48, 860, 38);
      }
      txt(c, s, 40, 220 + i * 48, 24, hot ? AMB : "rgba(242,240,247,0.7)", k, hot ? 700 : 400);
    });
    const v = P(f, woundAt, 10);
    if (v > 0) {
      // 30/10 (ele: a legenda do Varga desalinhada, começando fora do crachá e colada nele): centrada embaixo do crachá,
      // em duas linhas, com respiro
      badge(c, im, 990, 160, 240, "VARGA", AMB, null, v, "hl3silh/varga_retrato.png");
      font(c, 22, 600);
      ["A FERIDA", "QUE ELE CARREGA"].forEach((l, i) => txt(c, l, 990 + (240 - c.measureText(l).width) / 2, 160 + 344 + 40 + i * 30, 22, AMB, v, 600));
    }
    if (f >= askAt) {
      boxed(c, 40, 470, 820, 200, CREAM, P(f, askAt, 8));
      wrapTxt(c, "“Se o corpo termina, alguma coisa pode continuar?”", 66, 530, 770, 38, CREAM, P(f, qAt, 12), 700);
    }
    if (f >= silAt) txt(c, "NINGUÉM RESPONDE", 66, 640, 22, "rgba(242,240,247,0.6)", P(f, silAt, 8) * (1 - P(f, promAt, 8)));
    if (f >= promAt) txt(c, "É A PROMESSA QUE OS ADVISORS PERSEGUEM", 66, 640, 24, VIO, P(f, promAt, 8), 700);
    scan(c, f);
  };
};
export const HL12VargaS: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const right = useMemo(() => drawVarga(p), []); // eslint-disable-line react-hooks/exhaustive-deps
  const eye = camPath(f, [[0, "N"], [at(p, "warAt") - 20, "R"]]);
  return (
    <CoreTalk f={f} life={p.life} eye={eye} right={right} alyx={{ at: [0.7, 5.3, 0] }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <FlagAt e={eye} pt={[1.9, 3.0, 0]} label="VARGA" col={AMB} f={f} o={P(f, at(p, "attAt"), 10)} sub={f >= at(p, "askAt") ? "PERGUNTA" : "PRESTA ATENÇÃO"} />
      </svg>
    </CoreTalk>
  );
};
// 30/10 (ele: "O que os Advisors acreditam" era só texto): agora é um diagrama. O Advisor à esquerda, a porta (o
// catalisador) no meio, e do outro lado o que eles imaginam (névoa → continuidade → perpetuidade). Uma frase por vez no
// alto, trocando com a fala; as limitações (corpo, mundo, vida) entre ele e a porta, e quebram em "perpetuidade"
const tintCache: Record<string, HTMLCanvasElement> = {};
const tinted = (c: Ctx, img: HTMLImageElement | undefined, x: number, y: number, w: number, h: number, col: string) => {
  if (!img || !img.width) return;
  const key = img.src + col;
  let t = tintCache[key];
  if (!t) {
    t = document.createElement("canvas");
    t.width = img.width;
    t.height = img.height;
    const g = t.getContext("2d")!;
    g.drawImage(img, 0, 0);
    g.globalCompositeOperation = "source-in";
    g.fillStyle = col;
    g.fillRect(0, 0, t.width, t.height);
    tintCache[key] = t;
  }
  c.drawImage(t, x, y, w, h);
};
const ctxt = (c: Ctx, s: string, cx: number, y: number, px: number, col: string, k: number, w = 400) => {
  font(c, px, w);
  txt(c, s, cx - c.measureText(s).width / 2, y, px, col, k, w);
};
// uma frase por vez, cada uma some quando a próxima entra
const headline = (c: Ctx, f: number, seq: [number, string, string][], x: number, y: number, px: number) => {
  seq.forEach(([t, s, col], i) => {
    const nx = i + 1 < seq.length ? seq[i + 1][0] : 1e9;
    const k = P(f, t, 10) * (1 - P(f, nx - 4, 8));
    if (k > 0) txt(c, s, x, y, px, col, k, 700);
  });
};
const doorIcon = (c: Ctx, x: number, y: number, open: number) => {
  c.strokeStyle = VIO;
  c.lineWidth = 5;
  c.strokeRect(x - 80, y - 150, 160, 300);
  if (open > 0) {
    const g = c.createLinearGradient(x, y - 150, x, y + 150);
    g.addColorStop(0, "rgba(255,240,255,0.95)");
    g.addColorStop(1, "rgba(199,155,255,0.4)");
    c.fillStyle = g;
    c.fillRect(x - 76, y - 146, 152 * open, 292);
  }
  c.fillStyle = "rgba(40,30,60,0.95)";
  c.beginPath();
  c.moveTo(x - 76 + 152 * open, y - 146);
  c.lineTo(x + 76, y - 146 - 20 * open);
  c.lineTo(x + 76, y + 146 + 20 * open);
  c.lineTo(x - 76 + 152 * open, y + 146);
  c.closePath();
  c.fill();
};
const infinity = (c: Ctx, cx: number, cy: number, r: number, k: number, col: string, lw: number) => {
  c.strokeStyle = col;
  c.lineWidth = lw;
  c.beginPath();
  const n = Math.round(80 * k);
  for (let i = 0; i <= n; i++) {
    const t = (i / 80) * Math.PI * 2;
    const d = 1 + Math.sin(t) ** 2;
    const px = cx + (r * Math.cos(t)) / d, py = cy + (r * Math.sin(t) * Math.cos(t)) / d;
    if (i) c.lineTo(px, py);
    else c.moveTo(px, py);
  }
  c.stroke();
};
const drawDoor = (p: PR): Draw => {
  const [explAt, dontAt, truthAt, contAt, escAt, bodyAt, worldAt, lifeAt, perpAt, neverAt, maybeAt, doorAt, broughtAt] = ["explAt", "dontAt", "truthAt", "contAt", "escAt", "bodyAt", "worldAt", "lifeAt", "perpAt", "neverAt", "maybeAt", "doorAt", "broughtAt"].map((k) => at(p, k));
  return (c, f, im) => {
    screenBg(c, "O QUE OS ADVISORS ACREDITAM", VIO);
    headline(c, f, [[explAt, "A CRENÇA DOS COMBINE", "rgba(242,240,247,0.85)"], [dontAt, "NÃO SABEM O QUE EXISTE DO OUTRO LADO", "rgba(242,240,247,0.9)"], [truthAt, "NEM A VERDADE COMPLETA", "rgba(242,240,247,0.9)"], [contAt, "SÓ UMA POSSIBILIDADE · CONTINUIDADE", VIO], [escAt, "ESCAPAR DAS LIMITAÇÕES NORMAIS", VIO], [perpAt, "PERPETUIDADE", VIO], [neverAt, "NUNCA SOUBERAM COMO CHEGAR LÁ", "rgba(242,240,247,0.9)"], [maybeAt, "TALVEZ NEM ENTENDAM O QUE PERSEGUEM", "rgba(242,240,247,0.9)"], [doorAt, "O CATALISADOR É A PORTA", CREAM], [broughtAt, "ESSA CRENÇA OS TROUXE ATÉ AQUI", CREAM]], 40, 132, 36);
    const DX = 760, DY = 420;
    // o Advisor (desliza até perto da porta no fim: "os trouxe até aqui")
    const ak = P(f, explAt, 14);
    const ax = 70 + 70 * P(f, broughtAt, 30), ay = 330;
    c.globalAlpha = ak;
    const g0 = c.createRadialGradient(ax + 120, ay + 85, 10, ax + 120, ay + 85, 170);
    g0.addColorStop(0, "rgba(199,155,255,0.35)");
    g0.addColorStop(1, "rgba(199,155,255,0)");
    c.fillStyle = g0;
    c.fillRect(ax - 60, ay - 90, 360, 360);
    tinted(c, im["hl3silh/advisor_mask.png"], ax, ay, 240, 170, "#d9c2ff");
    c.globalAlpha = 1;
    ctxt(c, "OS ADVISORS", ax + 120, ay + 220, 24, VIO, ak, 700);
    // o olhar até a porta: contínuo enquanto acreditam, quebrado em "nunca souberam como chegar"
    const gz = P(f, dontAt, 20);
    if (gz > 0) {
      const br = P(f, neverAt, 10) * (1 - P(f, doorAt, 14));
      c.strokeStyle = `rgba(199,155,255,${0.7 * gz})`;
      c.lineWidth = 3;
      c.setLineDash(br > 0.5 ? [6, 18] : [14, 10]);
      c.lineDashOffset = -f * 1.5;
      c.beginPath();
      c.moveTo(ax + 250, ay + 85);
      c.lineTo(ax + 250 + (DX - 90 - ax - 250) * gz, ay + 85);
      c.stroke();
      c.setLineDash([]);
      if (br > 0) ctxt(c, "COMO?", (ax + 250 + DX - 90) / 2, ay + 60, 30, CREAM, br, 800);
    }
    // as limitações: corpo, mundo, vida (entre ele e a porta); quebram na perpetuidade
    const pk = P(f, perpAt, 14);
    ([[bodyAt, "UM CORPO"], [worldAt, "UM MUNDO"], [lifeAt, "UMA VIDA"]] as [number, string][]).forEach(([t, s], i) => {
      const k = P(f, t, 8) * (1 - P(f, neverAt - 6, 10));
      if (k <= 0) return;
      const bx = 400, by = 220 + i * 100;
      c.save();
      c.translate(bx + 100, by + 30);
      c.rotate(pk * (i - 1) * 0.12);
      c.translate(-(bx + 100) + pk * (i - 1) * 30, -(by + 30) + pk * 20);
      boxed(c, bx, by, 200, 60, VIO, k * (1 - pk * 0.5), "rgba(20,12,34,0.9)");
      ctxt(c, s, bx + 100, by + 40, 24, "#f2f0f7", k * (1 - pk * 0.5), 700);
      strike(c, bx + 10, by + 34, 180, pk * k);
      c.restore();
    });
    if (P(f, escAt, 10) > 0 && P(f, bodyAt, 8) <= 0) ctxt(c, "AS LIMITAÇÕES", 500, 330, 24, "rgba(242,240,247,0.6)", P(f, escAt, 10) * (1 - P(f, bodyAt, 8)), 600);
    // a porta: contorno desde o início; abre em "o catalisador é a porta"
    const dk = P(f, explAt + 10, 14);
    c.globalAlpha = dk;
    doorIcon(c, DX, DY, P(f, doorAt, 30));
    c.globalAlpha = 1;
    ctxt(c, "O CATALISADOR", DX, DY + 196, 24, P(f, doorAt, 10) > 0.5 ? CREAM : VIO, dk, 700);
    // do outro lado: névoa e "?" → continuidade (∞ fraco) → perpetuidade (∞ forte) → incerteza de novo (talvez nem entendam)
    const OX = 1060, OY = 400;
    const fog = dk * (1 - 0.6 * P(f, contAt, 14)) + 0.5 * P(f, maybeAt, 20);
    for (let i = 0; i < 5; i++) {
      const fx = OX + Math.sin(f / 50 + i * 1.7) * 90, fy = OY + Math.cos(f / 60 + i * 2.1) * 120;
      const g = c.createRadialGradient(fx, fy, 0, fx, fy, 130);
      g.addColorStop(0, `rgba(160,140,200,${0.22 * Math.min(1, fog)})`);
      g.addColorStop(1, "rgba(160,140,200,0)");
      c.fillStyle = g;
      c.fillRect(fx - 130, fy - 130, 260, 260);
    }
    const qk = dk * (1 - P(f, contAt, 10)) + P(f, maybeAt, 14) * 0.8;
    if (qk > 0) ctxt(c, "?", OX, OY + 40, 140, "rgba(242,240,247,0.55)", Math.min(1, qk), 800);
    const ck = P(f, contAt, 24) * (1 - 0.65 * P(f, maybeAt, 20));
    if (ck > 0) {
      c.globalAlpha = Math.min(1, ck);
      infinity(c, OX, OY, 150, P(f, contAt, 40), `rgba(199,155,255,${0.45 + 0.55 * pk})`, 4 + 8 * pk);
      if (pk > 0) {
        c.shadowColor = VIO;
        c.shadowBlur = 30 * pk;
        infinity(c, OX, OY, 150, 1, "rgba(255,240,255,0.8)", 2);
        c.shadowBlur = 0;
      }
      c.globalAlpha = 1;
      ctxt(c, pk > 0.5 ? "PERPETUIDADE" : "CONTINUIDADE", OX, OY + 140, 26, VIO, ck, 700);
    }
    ctxt(c, "O OUTRO LADO", OX, 600, 20, "rgba(242,240,247,0.55)", P(f, dontAt, 10), 600);
    // "os trouxe até aqui": o rastro que eles percorreram até a porta
    const bk = P(f, broughtAt, 24);
    if (bk > 0) {
      c.fillStyle = `rgba(255,226,176,${0.8 * bk})`;
      for (let i = 0; i < 10; i++) {
        const x = 40 + i * 64 * bk;
        if (x > ax) break;
        c.beginPath();
        c.arc(x, 650, 5, 0, Math.PI * 2);
        c.fill();
      }
      txt(c, "ATÉ AQUI", 40, 690, 22, CREAM, bk, 700);
    }
    scan(c, f);
  };
};
export const HL12DoorS: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const left = useMemo(() => drawDoor(p), []); // eslint-disable-line react-hooks/exhaustive-deps
  const eye = camPath(f, [[0, "L"]]);
  return <CoreTalk f={f} life={p.life} eye={eye} left={left} alyx={{ at: [0.7, 5.3, 0] }} />;
};
// os empregadores
// 30/10 (ele: as cenas se sobrepunham na troca e faltava representação visual): parte 1 = o G-Man preso por fios a uma
// faixa acima dele (os empregadores), que desce em três mundos (uma Terra, os universos, as versões) sem pertencer a
// nenhum. Parte 2 = Combine pulando de mundo em mundo × empregadores varrendo as possibilidades de um mundo só; depois as
// linhas do tempo com as quatro interferências (cada uma um raio de cima) e as linhas empurradas até a porta
const person = (c: Ctx, x: number, y: number, col: string, s = 1) => {
  c.fillStyle = col;
  c.beginPath();
  c.arc(x, y - 22 * s, 8 * s, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.moveTo(x - 10 * s, y);
  c.lineTo(x - 7 * s, y - 12 * s);
  c.quadraticCurveTo(x, y - 16 * s, x + 7 * s, y - 12 * s);
  c.lineTo(x + 10 * s, y);
  c.closePath();
  c.fill();
};
const planet = (c: Ctx, x: number, y: number, r: number, hue: string, k: number) => {
  if (k <= 0) return;
  const base = c.globalAlpha;
  c.globalAlpha = base * k;
  const g = c.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
  g.addColorStop(0, "#f2f6ff");
  g.addColorStop(0.35, hue);
  g.addColorStop(1, "#0a1418");
  c.fillStyle = g;
  c.beginPath();
  c.arc(x, y, r * (0.6 + 0.4 * k), 0, Math.PI * 2);
  c.fill();
  c.globalAlpha = base;
};
const empBand = (c: Ctx, f: number, y0: number, h: number, k: number, label: string, px: number) => {
  if (k <= 0) return;
  const base = c.globalAlpha;
  c.globalAlpha = base * k;
  const g = c.createLinearGradient(0, y0, 0, y0 + h);
  g.addColorStop(0, "rgba(255,226,176,0.32)");
  g.addColorStop(1, "rgba(255,226,176,0.08)");
  c.fillStyle = g;
  c.fillRect(40, y0, 1200, h);
  c.strokeStyle = "rgba(255,226,176,0.7)";
  c.lineWidth = 2;
  c.strokeRect(40, y0, 1200, h);
  // o brilho que corre pela faixa
  const sx = 40 + ((f * 6) % 1400) - 100;
  const sg = c.createLinearGradient(sx - 120, 0, sx + 120, 0);
  sg.addColorStop(0, "rgba(255,240,210,0)");
  sg.addColorStop(0.5, "rgba(255,240,210,0.35)");
  sg.addColorStop(1, "rgba(255,240,210,0)");
  c.fillStyle = sg;
  c.fillRect(Math.max(40, sx - 120), y0, Math.min(240, 1240 - Math.max(40, sx - 120)), h);
  c.globalAlpha = base;
  ctxt(c, label, 640, y0 + h / 2 + px * 0.36, px, CREAM, k, 800);
};
const beam = (c: Ctx, x: number, y0: number, y1: number, k: number) => {
  if (k <= 0) return;
  const g = c.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, `rgba(255,226,176,${0.75 * k})`);
  g.addColorStop(1, `rgba(255,226,176,${0.15 * k})`);
  c.fillStyle = g;
  c.fillRect(x - 3 - 6 * k, y0, 6 + 12 * k, y1 - y0);
};
const drawEmp = (p: PR): Draw => {
  const two = (p.combAt as number | undefined) !== undefined;
  const [aloneAt, empAt, notOneAt, earthAt, univAt, verAt, opAt, combAt, possAt, interAt, takeAt, giveAt, deathAt, infoAt, pushAt, doorAt] = ["aloneAt", "empAt", "notOneAt", "earthAt", "univAt", "verAt", "opAt", "combAt", "possAt", "interAt", "takeAt", "giveAt", "deathAt", "infoAt", "pushAt", "doorAt"].map((k) => at(p, k));
  return (c, f, im) => {
    screenBg(c, "ACIMA DO G-MAN · OS EMPREGADORES", CREAM);
    if (!two) {
      const ek = P(f, empAt, 16);
      empBand(c, f, 86, 96, ek, "OS EMPREGADORES", 40);
      // o G-Man e os fios que sobem até a faixa
      const gk = P(f, 0, 14);
      const gm = im["hl3silh/gman_silh.png"];
      c.globalAlpha = gk;
      if (gm && gm.width) c.drawImage(gm, 100, 300, 112, 302);
      c.globalAlpha = 1;
      ctxt(c, "O G-MAN", 156, 640, 22, "rgba(242,240,247,0.75)", gk, 700);
      const tk = P(f, empAt + 10, 20);
      if (tk > 0) {
        c.strokeStyle = `rgba(255,226,176,${0.65 * tk})`;
        c.lineWidth = 1.5;
        ([[128, 420], [156, 318], [186, 420]] as [number, number][]).forEach(([x, y], i) => {
          const top = 182, x0 = 120 + i * 40;
          c.beginPath();
          c.moveTo(x0, top);
          c.lineTo(x0 + (x - x0) * tk, top + (y - top) * tk + Math.sin(f / 18 + i) * 3);
          c.stroke();
        });
        txt(c, "POR TRÁS DELE", 232, 260, 20, CREAM, tk, 600);
      }
      txt(c, "NÃO TRABALHA SOZINHO", 232, 330, 30, "rgba(242,240,247,0.9)", P(f, aloneAt, 10), 700);
      // os três mundos: nenhum é deles
      const slots: [number, string, number][] = [[earthAt, "NEM UMA TERRA", 620], [univAt, "NEM UM UNIVERSO", 880], [verAt, "NEM UMA VERSÃO", 1140]];
      slots.forEach(([t, lab, x], i) => {
        const k = P(f, t, 12);
        if (k <= 0) return;
        const y = 470;
        // o raio da faixa descendo até o mundo (estão em todos, não pertencem a nenhum)
        beam(c, x, 182, y - 90, k * 0.6);
        c.strokeStyle = `rgba(242,240,247,${0.25 * k})`;
        c.setLineDash([6, 8]);
        c.lineWidth = 2;
        c.beginPath();
        c.arc(x, y, 98, 0, Math.PI * 2);
        c.stroke();
        c.setLineDash([]);
        if (i === 0) planet(c, x, y, 64, "#3aa0c8", k);
        if (i === 1)
          ([[-40, -30, 30, "#3aa0c8"], [36, -42, 22, "#c87a3a"], [44, 26, 28, "#7a5ac8"], [-30, 44, 20, "#4ac88a"], [0, 0, 16, "#c8c03a"], [-62, 10, 14, "#c84a6a"]] as [number, number, number, string][]).forEach(([dx, dy, r, h], j) =>
            planet(c, x + dx, y + dy, r, h, P(f, t + j * 3, 10)),
          );
        if (i === 2) {
          c.strokeStyle = ICE;
          c.lineWidth = 3;
          const n = 6;
          for (let j = 0; j < n; j++) {
            const kk = P(f, t + j * 3, 14);
            c.beginPath();
            c.moveTo(x - 80, y);
            c.bezierCurveTo(x - 30, y, x - 10, y + (j - 2.5) * 30, x - 80 + 160 * kk, y + (j - 2.5) * 30);
            c.stroke();
            c.fillStyle = ICE;
            c.beginPath();
            c.arc(x - 80 + 160 * kk, y + (j - 2.5) * 30, 5, 0, Math.PI * 2);
            c.fill();
          }
          c.fillStyle = CREAM;
          c.beginPath();
          c.arc(x - 80, y, 8, 0, Math.PI * 2);
          c.fill();
        }
        ctxt(c, lab, x, y + 142, 22, ICE, k, 700);
      });
      ctxt(c, "NÃO PERTENCEM A NENHUMA", 880, 676, 26, CREAM, P(f, notOneAt, 10), 700);
    } else {
      const sp = P(f, interAt - 6, 14);
      if (sp < 1) {
        c.globalAlpha = 1 - sp;
        txt(c, "O G-MAN OPERA ONDE OS COMBINE NÃO CHEGAM", 40, 128, 28, "rgba(242,240,247,0.85)", P(f, opAt, 10), 700);
        const dv = P(f, combAt, 14);
        c.fillStyle = `rgba(242,240,247,${0.25 * dv})`;
        c.fillRect(639, 170, 2, 500);
        // esquerda: os Combine saltam de um mundo para outro (o portal vermelho passando por cada um)
        txt(c, "OS COMBINE", 60, 200, 32, RED, P(f, combAt, 8), 800);
        txt(c, "ATRAVESSAM MUNDOS", 60, 238, 24, "rgba(242,240,247,0.85)", P(f, combAt + 6, 8), 600);
        const PL: [number, number, string][] = [[120, 450, "#3aa0c8"], [260, 390, "#c87a3a"], [400, 460, "#7a5ac8"], [540, 400, "#4ac88a"]];
        PL.forEach(([x, y, h], i) => planet(c, x, y, 44, h, P(f, combAt + i * 4, 12)));
        const hop = Math.max(0, (f - combAt - 10) / 22);
        if (hop > 0) {
          c.strokeStyle = RED;
          c.lineWidth = 3;
          for (let i = 0; i < 3; i++) {
            const kk = Math.min(1, Math.max(0, hop - i));
            if (kk <= 0) continue;
            const [ax, ay] = PL[i], [bx, by] = PL[i + 1];
            c.beginPath();
            for (let s = 0; s <= 20 * kk; s++) {
              const t = s / 20;
              const x = ax + (bx - ax) * t, y = ay + (by - ay) * t - Math.sin(t * Math.PI) * 70;
              if (s) c.lineTo(x, y);
              else c.moveTo(x, y);
            }
            c.stroke();
          }
          const cur = Math.min(3, Math.floor(hop));
          c.strokeStyle = RED;
          c.lineWidth = 4;
          c.beginPath();
          c.ellipse(PL[cur][0], PL[cur][1], 54 + Math.sin(f / 4) * 3, 54, 0, 0, Math.PI * 2);
          c.stroke();
        }
        ctxt(c, "DE UM LUGAR PARA OUTRO", 330, 600, 22, "rgba(242,240,247,0.7)", P(f, combAt + 30, 10), 600);
        // direita: os empregadores, num mundo só, varrendo todas as versões dele ao mesmo tempo
        txt(c, "OS EMPREGADORES", 680, 200, 32, CREAM, P(f, possAt, 8), 800);
        txt(c, "ATRAVESSAM POSSIBILIDADES", 680, 238, 24, "rgba(242,240,247,0.85)", P(f, possAt + 6, 8), 600);
        const pk = P(f, possAt, 30);
        planet(c, 730, 430, 40, "#3aa0c8", P(f, possAt, 12));
        const ends: number[] = [];
        for (let i = 0; i < 8; i++) {
          const ey = 430 + (i - 3.5) * 36;
          ends.push(ey);
          c.strokeStyle = `rgba(255,226,176,${0.45 + 0.05 * i})`;
          c.lineWidth = 2.5;
          c.beginPath();
          c.moveTo(770, 430);
          c.bezierCurveTo(850, 430, 880, ey, 770 + 450 * pk, ey);
          c.stroke();
        }
        const sk = P(f, possAt + 30, 10);
        if (sk > 0) {
          const sx = 900 + (0.5 - 0.5 * Math.cos((f - possAt - 30) / 26)) * 300;
          c.fillStyle = `rgba(255,240,210,${0.5 * sk})`;
          c.fillRect(sx - 2, 290, 4, 290);
          ends.forEach((ey) => {
            c.fillStyle = `rgba(255,240,210,${sk})`;
            c.beginPath();
            c.arc(sx, ey, 6, 0, Math.PI * 2);
            c.fill();
          });
        }
        ctxt(c, "DE UMA VERSÃO PARA OUTRA", 960, 600, 22, "rgba(242,240,247,0.7)", P(f, possAt + 30, 10), 600);
        c.globalAlpha = 1;
      }
      if (sp > 0) {
        c.globalAlpha = sp;
        txt(c, "ELES NÃO SÓ OBSERVAM · INTERFEREM", 40, 124, 32, CREAM, 1, 800);
        empBand(c, f, 146, 44, 1, "OS EMPREGADORES", 22);
        // as linhas do tempo: de pé no começo, empurradas até a porta depois
        const pu = P(f, pushAt, 50);
        const DXc = 1160, DYc = 470;
        const ly = (i: number, x: number) => {
          const b = 300 + i * 50;
          const t = Math.max(0, (x - 40) / (DXc - 40));
          return b + (DYc - b) * pu * t * t + Math.sin(t * 9 + i * 1.3) * 10 * (1 - pu * t);
        };
        const rv = P(f, interAt, 30);
        for (let i = 0; i < 7; i++) {
          c.strokeStyle = `rgba(159,230,255,${0.35 + 0.06 * i})`;
          c.lineWidth = 2.5;
          c.beginPath();
          const xe = 40 + (DXc - 40) * rv;
          for (let x = 40; x <= xe; x += 20) {
            if (x === 40) c.moveTo(x, ly(i, x));
            else c.lineTo(x, ly(i, x));
          }
          c.stroke();
        }
        // as quatro interferências: cada uma um raio de cima numa linha
        const ev: [number, string, string, number, number][] = [[takeAt, "UMA PESSOA", "RETIRADA", 1, 230], [giveAt, "OUTRA", "DEVOLVIDA", 4, 450], [deathAt, "UMA MORTE", "NÃO ACONTECE", 2, 670], [infoAt, "UMA INFORMAÇÃO", "NO LUGAR CERTO", 5, 890]];
        ev.forEach(([t, a, b, li, x], j) => {
          const k = P(f, t, 10);
          if (k <= 0) return;
          const y = ly(li, x);
          const fl = Math.max(0.3, 1 - P(f, t + 10, 40));
          beam(c, x, 190, y, k * fl);
          ctxt(c, a, x, 222, 17, "rgba(242,240,247,0.75)", k, 600);
          ctxt(c, b, x, 246, 20, CREAM, k, 800);
          const m = P(f, t, 24);
          if (j === 0) {
            // retirada: sobe pelo raio e some; fica o vazio na linha
            c.strokeStyle = "rgba(242,240,247,0.5)";
            c.setLineDash([4, 4]);
            c.lineWidth = 2;
            c.beginPath();
            c.arc(x, y - 12, 16, 0, Math.PI * 2);
            c.stroke();
            c.setLineDash([]);
            c.globalAlpha = sp * (1 - m);
            person(c, x, y - m * 70, ORANGE);
            c.globalAlpha = sp;
          } else if (j === 1) {
            // devolvida: desce pelo raio até a linha
            c.globalAlpha = sp * Math.min(1, m * 2);
            person(c, x, y - (1 - m) * 70, ORANGE);
            c.globalAlpha = sp;
          } else if (j === 2) {
            // a morte riscada some, a linha segue
            const xk = 1 - m;
            c.strokeStyle = `rgba(255,93,77,${xk})`;
            c.lineWidth = 5;
            c.beginPath();
            c.moveTo(x - 14, y - 14);
            c.lineTo(x + 14, y + 14);
            c.moveTo(x + 14, y - 14);
            c.lineTo(x - 14, y + 14);
            c.stroke();
            c.fillStyle = `rgba(141,255,168,${m})`;
            c.beginPath();
            c.arc(x, y, 9, 0, Math.PI * 2);
            c.fill();
          } else {
            // a informação: o losango cai no ponto certo
            const yy = y - (1 - m) * 70;
            c.fillStyle = AMB;
            c.beginPath();
            c.moveTo(x, yy - 14);
            c.lineTo(x + 12, yy);
            c.lineTo(x, yy + 14);
            c.lineTo(x - 12, yy);
            c.closePath();
            c.fill();
          }
        });
        txt(c, "AS HISTÓRIAS MUDAM · MAS SEGUEM NA MESMA DIREÇÃO", 40, 690, 24, ICE, P(f, pushAt, 10), 700);
        const dk = P(f, doorAt, 14);
        if (dk > 0) {
          const g = c.createRadialGradient(DXc + 30, DYc, 10, DXc + 30, DYc, 140);
          g.addColorStop(0, `rgba(255,178,46,${0.45 * dk})`);
          g.addColorStop(1, "rgba(255,178,46,0)");
          c.fillStyle = g;
          c.fillRect(DXc - 110, DYc - 140, 280, 280);
          c.strokeStyle = AMB;
          c.lineWidth = 4;
          c.strokeRect(DXc, DYc - 75, 70, 150);
          c.fillStyle = `rgba(255,226,176,${0.6 * dk})`;
          c.fillRect(DXc + 4, DYc - 71, 62 * dk, 142);
          ctxt(c, "O CATALISADOR", DXc + 35, DYc + 112, 20, AMB, dk, 800);
        }
        c.globalAlpha = 1;
      }
    }
    scan(c, f);
  };
};
export const HL12EmployersS: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const right = useMemo(() => drawEmp(p), []); // eslint-disable-line react-hooks/exhaustive-deps
  const eye = camPath(f, [[0, "R"]]);
  return <CoreTalk f={f} life={p.life} eye={eye} right={right} alyx={{ at: [-0.7, 5.3, 0] }} />;
};
// a convergência
const drawConv = (p: PR): Draw => {
  const [notSameAt, gordAt, eliAt, alyxAt, boardAt, doorAt, needAt, notHandsAt, piecesAt, someoneAt] = ["notSameAt", "gordAt", "eliAt", "alyxAt", "boardAt", "doorAt", "needAt", "notHandsAt", "piecesAt", "someoneAt"].map((k) => at(p, k));
  return (c, f, im) => {
    screenBg(c, "AS LINHAS DE CONVERGÊNCIA", AMB);
    const sw = P(f, needAt, 12);
    if (sw < 1) {
      c.globalAlpha = 1 - sw;
      txt(c, "NÃO É TUDO IGUAL", 40, 140, 30, "rgba(242,240,247,0.85)", P(f, notSameAt, 8), 600);
      const who: [number, string, string, string][] = [[gordAt, "hl3silh/gordon_retrato.png", "GORDON", "DECISÕES DIFERENTES"], [eliAt, "hl3silh/eli_retrato.png", "ELI", "MORRE · OU SOBREVIVE"], [alyxAt, "hl3silh/alyx_badge.jpg", "ALYX", "CAMINHOS DIFERENTES"]];
      const dk = P(f, doorAt, 40);
      who.forEach(([t, src, n, s], i) => {
        const k = P(f, t, 10);
        if (k <= 0) return;
        const y = 180 + i * 150;
        badge(c, im, 40, y, 90, n, AMB, null, k * (1 - sw), src);
        txt(c, s, 150, y + 60, 22, CREAM, k, 600);
        for (let b = 0; b < 3; b++) {
          c.strokeStyle = `rgba(255,178,46,${0.5 * k})`;
          c.lineWidth = 2.5;
          c.beginPath();
          c.moveTo(460, y + 60);
          const ey = y + 60 + (b - 1) * 34;
          c.bezierCurveTo(560, y + 60, 600, ey, 700, ey);
          c.lineTo(700 + 300 * dk, ey + (370 - ey) * dk);
          c.stroke();
        }
      });
      if (f >= boardAt) txt(c, "ALGO REORGANIZA O TABULEIRO", 700, 150, 24, CREAM, P(f, boardAt, 10), 700);
      if (dk > 0) {
        c.strokeStyle = AMB;
        c.lineWidth = 4;
        c.strokeRect(1010, 300, 70, 140);
        txt(c, "A MESMA PORTA", 960, 490, 24, AMB, dk, 700);
      }
      c.globalAlpha = 1;
    }
    if (sw > 0) {
      c.globalAlpha = sw;
      badge(c, im, 70, 130, 260, "ALYX", ORANGE, null, sw);
      txt(c, "POR ISSO O G-MAN PRECISAVA DELA", 400, 190, 30, CREAM, sw, 700);
      txt(c, "PARA ATIVAR COM AS PRÓPRIAS MÃOS", 400, 270, 26, "rgba(242,240,247,0.7)", P(f, notHandsAt, 10));
      strike(c, 400, 270, 560, P(f, notHandsAt + 20, 8));
      txt(c, "PARA AS PEÇAS CONTINUAREM AVANÇANDO", 400, 350, 28, AMB, P(f, piecesAt, 10), 700);
      txt(c, "ATÉ ALGUÉM FAZER ISSO POR ELE", 400, 420, 34, AMB, P(f, someoneAt, 10), 800);
      c.globalAlpha = 1;
    }
    scan(c, f);
  };
};
export const HL12ConvS: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const left = useMemo(() => drawConv(p), []); // eslint-disable-line react-hooks/exhaustive-deps
  const eye = camPath(f, [[0, "L"]]);
  return <CoreTalk f={f} life={p.life} eye={eye} left={left} alyx={{ at: [0.7, 5.3, 0] }} />;
};
// a névoa: o limite da convergência
const drawMist = (p: PR): Draw => {
  const nobody = (p.firstAt as number | undefined) !== undefined;
  const [vortAt, mistAt, stasisAt, gmanAt, nowAt, notAt, absAt, futAt, pathAt, nothingAt, firstAt, alyxAt] = ["vortAt", "mistAt", "stasisAt", "gmanAt", "nowAt", "notAt", "absAt", "futAt", "pathAt", "nothingAt", "firstAt", "alyxAt"].map((k) => at(p, k));
  return (c, f, im) => {
    screenBg(c, "VORTESSÊNCIA · O QUE ELES VEEM", GREEN);
    const X0 = 700;
    const fk = nobody ? 1 : Math.max(P(f, futAt, 30), 0.4 * P(f, vortAt, 30));
    for (let i = 0; i < 10; i++) {
      c.strokeStyle = `rgba(141,255,168,${0.3 + 0.05 * i})`;
      c.lineWidth = i === 4 ? 4 : 2.5;
      c.beginPath();
      c.moveTo(40, 220 + i * 36);
      c.lineTo(40 + (X0 - 40) * fk, 220 + i * 36 + (300 + i * 18 - 220 - i * 36) * fk);
      c.stroke();
    }
    const mk2 = nobody ? 1 : P(f, mistAt, 30);
    const g = c.createLinearGradient(X0 - 60, 0, X0 + 200, 0);
    g.addColorStop(0, "rgba(220,230,235,0)");
    g.addColorStop(0.4, `rgba(220,230,235,${0.55 * mk2})`);
    g.addColorStop(1, `rgba(200,210,220,${0.85 * mk2})`);
    c.fillStyle = g;
    c.fillRect(X0 - 60, 90, CW - X0 + 60, CH - 90);
    for (let i = 0; i < 6; i++) {
      c.fillStyle = `rgba(240,245,250,${0.12 * mk2})`;
      c.beginPath();
      c.ellipse(X0 + 150 + ((f * (0.6 + i * 0.1) + i * 120) % 520), 200 + i * 80, 160, 40, 0, 0, Math.PI * 2);
      c.fill();
    }
    txt(c, "AGORA", X0 - 50, 200, 22, "#f2f0f7", mk2, 700);
    if (!nobody) {
      badge(c, im, X0 - 70, 430, 110, "ALYX", ORANGE, null, P(f, mistAt, 10));
      txt(c, "A ESTASE?", 40, 150, 24, "rgba(242,240,247,0.7)", P(f, stasisAt, 8));
      strike(c, 40, 150, 160, P(f, gmanAt - 8, 8));
      txt(c, "O G-MAN?", 260, 150, 24, "rgba(242,240,247,0.7)", P(f, gmanAt, 8));
      strike(c, 260, 150, 140, P(f, nowAt, 8));
      txt(c, "NÃO ERA ALGO EM VOLTA DELA", 40, 600, 26, "rgba(242,240,247,0.85)", P(f, notAt, 10) * (1 - P(f, absAt, 8)));
      txt(c, "ERA A AUSÊNCIA DE ALGO DEPOIS DELA", 40, 600, 30, CREAM, P(f, absAt, 10), 800);
      txt(c, "VEZES SUFICIENTES PARA DEIXAR UM CAMINHO", 40, 650, 22, GREEN, P(f, pathAt, 10) * (1 - P(f, nothingAt, 8)));
      txt(c, "DEPOIS DAQUELE MOMENTO · NADA", 40, 650, 28, "#f2f0f7", P(f, nothingAt, 10), 800);
    } else {
      txt(c, "PELA PRIMEIRA VEZ · NINGUÉM SABE O QUE VEM DEPOIS", 40, 150, 26, CREAM, P(f, firstAt, 10), 700);
      const who: [number, string, string, string][] = [[vortAt, "hl3silh/vort_icone.png", "VORTIGAUNTS", GREEN], [alyxAt, "hl3silh/alyx_badge.jpg", "ALYX", ORANGE], [gmanAt, "hl3silh/gman_silh.png", "G-MAN", CREAM]];
      who.forEach(([t, src, n, col], i) => {
        const k = P(f, t, 10);
        if (k <= 0) return;
        badge(c, im, 60 + i * 200, 430, 150, n, col, null, k, src);
        txt(c, "?", 120 + i * 200, 420, 48, col, k, 800);
      });
    }
    scan(c, f);
  };
};
export const HL12MistS: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const right = useMemo(() => drawMist(p), []); // eslint-disable-line react-hooks/exhaustive-deps
  const eye = camPath(f, [[0, "R"]]);
  return <CoreTalk f={f} life={p.life} eye={eye} right={right} alyx={{ at: [-0.7, 5.3, 0] }} />;
};

// ================================================================================================= 1:24:03 → 1:27:43
// o preço: a última conta do Kleiner (direita) e o rádio do Eli e da Mossman (esquerda); depois o que cada um vê
const drawCalc = (p: PR): Draw => {
  const [wayAt, closeAt, priceAt, ifAt, notOnlyAt, woundAt, earthAt, eliCardAt, alyxCardAt, vargaCardAt] = ["wayAt", "closeAt", "priceAt", "ifAt", "notOnlyAt", "woundAt", "earthAt", "eliCardAt", "alyxCardAt", "vargaCardAt"].map((k) => at(p, k));
  return (c, f, im) => {
    const cards = P(f, eliCardAt - 10, 14);
    screenBg(c, cards > 0.5 ? "O QUE CADA UM VÊ" : "DR. KLEINER · A ÚLTIMA CONTA", cards > 0.5 ? CREAM : AMB);
    if (cards < 1) {
      c.globalAlpha = 1 - cards;
      const kl = im["hl3silh/kleiner_retrato.png"];
      if (kl && kl.width) c.drawImage(kl, 1110, 20, 130, 130);
      c.strokeStyle = AMB;
      c.lineWidth = 3;
      c.strokeRect(1110, 20, 130, 130);
      txt(c, "EXISTE UM JEITO DE DESTRUIR O NÚCLEO", 40, 140, 30, "#f2f0f7", P(f, wayAt, 10), 700);
      txt(c, "CONTRA A FERIDA · FECHAR DE UMA VEZ", 40, 184, 26, AMB, P(f, closeAt, 10), 600);
      // 30/10 (ele: a ferida e o núcleo mal feitos, animação ruim): corte lateral do espaço. A malha do espaço afunda
      // em volta da ferida (uma rachadura de luz viva, soltando faíscas); o núcleo com anéis paira acima, o Borealis ao
      // lado. "Colapsar": o núcleo cai, bate e implode (clarão + onda). "Não é só o Borealis": a nave se desfaz.
      // "A ferida se fecha": a rachadura costura das pontas para o meio e a malha é puxada para o ponto. "A Terra vai
      // junto": a Terra escorre pela malha, esticando, até sumir no ponto
      const WX = 520, WY = 500;
      const fallK = interpolate(f, [ifAt + 6, ifAt + 30], [0, 1], { ...C, easing: Easing.in(Easing.quad) });
      const hit = ifAt + 30;
      const shut = P(f, woundAt, 50);
      const ek = interpolate(f, [earthAt, earthAt + 60], [0, 1], { ...C, easing: Easing.in(Easing.cubic) });
      const meshK = P(f, wayAt, 30);
      // a malha: cada ponto é puxado para a ferida (poço fixo + o fechamento puxando tudo)
      const warp = (x: number, y: number): [number, number] => {
        const dx = x - WX;
        const well = 0.16 * Math.exp(-((dx / 210) ** 2)) * ((y - 200) / 300);
        const pin = shut * 0.9 * Math.exp(-Math.abs(dx) / 420) * Math.min(1, (y - 180) / 320);
        const k = Math.min(0.97, well + pin);
        return [x + (WX - x) * k, y + (WY - y) * k];
      };
      if (meshK > 0) {
        c.lineWidth = 1.5;
        for (let j = 0; j < 8; j++) {
          const yb = 236 + j * 38;
          c.strokeStyle = `rgba(159,230,255,${(0.12 + 0.035 * j) * meshK})`;
          c.beginPath();
          for (let x = 40; x <= 1240; x += 20) {
            const [px, py] = warp(x, yb);
            if (x === 40) c.moveTo(px, py);
            else c.lineTo(px, py);
          }
          c.stroke();
        }
        for (let x = 40; x <= 1240; x += 60) {
          c.strokeStyle = `rgba(159,230,255,${0.14 * meshK})`;
          c.beginPath();
          for (let j = 0; j <= 14; j++) {
            const [px, py] = warp(x, 236 + j * 19);
            if (!j) c.moveTo(px, py);
            else c.lineTo(px, py);
          }
          c.stroke();
        }
      }
      // a ferida: rachadura serrilhada que pulsa; costura das pontas para o meio
      const half = 150 * (1 - shut * 0.96);
      const open = (1 - shut) * (1 + 0.12 * Math.sin(f / 5));
      if (half > 2) {
        const pts = 28;
        const edge = (sgn: number) => {
          const out: [number, number][] = [];
          for (let i = 0; i <= pts; i++) {
            const t = i / pts, x = WX - half + 2 * half * t;
            const env = Math.sin(Math.PI * t);
            const jag = (Math.sin(i * 2.7 + f / 9) * 0.5 + Math.sin(i * 5.3) * 0.5) * 6;
            out.push([x, WY + sgn * (env * 16 * open + Math.abs(jag) * env * open) + jag * 0.6]);
          }
          return out;
        };
        const top = edge(-1), bot = edge(1).reverse();
        const glow = c.createRadialGradient(WX, WY, 4, WX, WY, half + 60);
        glow.addColorStop(0, `rgba(255,140,60,${0.55 * (1 - shut)})`);
        glow.addColorStop(1, "rgba(255,80,40,0)");
        c.fillStyle = glow;
        c.fillRect(WX - half - 60, WY - 120, 2 * half + 120, 200);
        c.beginPath();
        [...top, ...bot].forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
        c.closePath();
        const fg = c.createLinearGradient(0, WY - 20, 0, WY + 20);
        fg.addColorStop(0, "#ff5a2a");
        fg.addColorStop(0.5, "#fff1c8");
        fg.addColorStop(1, "#ff5a2a");
        c.fillStyle = fg;
        c.shadowColor = "#ff7a3a";
        c.shadowBlur = 24;
        c.fill();
        c.shadowBlur = 0;
        c.strokeStyle = RED;
        c.lineWidth = 2;
        c.stroke();
        // faíscas subindo da rachadura
        for (let i = 0; i < 18; i++) {
          const t = ((f + i * 13) % 50) / 50;
          const sx = WX + Math.sin(i * 12.9) * half * 0.8;
          const sy = WY - 8 - t * 110;
          c.fillStyle = `rgba(255,${Math.round(150 + 80 * t)},80,${(1 - t) * 0.8 * (1 - shut)})`;
          c.beginPath();
          c.arc(sx + Math.sin(t * 6 + i) * 8, sy, 2.4 * (1 - t) + 0.6, 0, Math.PI * 2);
          c.fill();
        }
      }
      if (shut > 0.9) {
        // o ponto onde fechou
        c.fillStyle = `rgba(255,240,220,${0.6 + 0.3 * Math.sin(f / 4)})`;
        c.beginPath();
        c.arc(WX, WY, 5, 0, Math.PI * 2);
        c.fill();
      }
      txt(c, shut > 0.5 ? "A FERIDA SE FECHA" : "A FERIDA", WX - (shut > 0.5 ? 100 : 50), WY + 56, 20, RED, P(f, closeAt, 10), 700);
      // o Borealis (ao lado do núcleo), que se desfaz em "não é só o Borealis"
      const dis = P(f, notOnlyAt + 6, 24);
      const bo = P(f, wayAt + 10, 14) * (1 - dis);
      {
        const bx = 250, by = 300;
        if (bo > 0) {
          c.save();
          c.globalAlpha = c.globalAlpha * bo;
          c.strokeStyle = ICE;
          c.fillStyle = "rgba(20,50,64,0.9)";
          c.lineWidth = 2.5;
          c.beginPath();
          c.moveTo(bx - 90, by);
          c.lineTo(bx - 60, by - 22);
          c.lineTo(bx + 50, by - 22);
          c.lineTo(bx + 70, by - 44);
          c.lineTo(bx + 84, by - 44);
          c.lineTo(bx + 80, by - 18);
          c.lineTo(bx + 96, by);
          c.lineTo(bx + 70, by + 16);
          c.lineTo(bx - 70, by + 16);
          c.closePath();
          c.fill();
          c.stroke();
          c.restore();
          txt(c, "BOREALIS", bx - 46, by + 48, 18, ICE, bo, 700);
        }
        if (dis > 0 && dis < 1)
          for (let i = 0; i < 26; i++) {
            const px = bx - 90 + ((i * 37) % 186), py = by - 30 + ((i * 17) % 46);
            c.fillStyle = `rgba(159,230,255,${(1 - dis) * 0.9})`;
            c.fillRect(px + dis * 40 * Math.sin(i), py - dis * 60 * ((i % 5) / 5 + 0.3), 3, 3);
          }
      }
      // o núcleo: esfera com anéis girando; cai, bate e implode
      const cy = 290 + (WY - 290) * fallK;
      const imp = P(f, hit, 16);
      const cr = 32 * (1 - imp) * P(f, wayAt, 14);
      if (cr > 0.5) {
        if (fallK > 0 && fallK < 1) {
          const tg = c.createLinearGradient(0, cy - 120, 0, cy);
          tg.addColorStop(0, "rgba(255,200,110,0)");
          tg.addColorStop(1, "rgba(255,200,110,0.45)");
          c.fillStyle = tg;
          c.fillRect(WX - cr * 0.7, cy - 120, cr * 1.4, 120);
        }
        const g = c.createRadialGradient(WX - cr * 0.3, cy - cr * 0.3, 2, WX, cy, cr * 1.9);
        g.addColorStop(0, "#fffbe8");
        g.addColorStop(0.4, "#ffc66a");
        g.addColorStop(1, "rgba(255,150,40,0)");
        c.fillStyle = g;
        c.beginPath();
        c.arc(WX, cy, cr * 1.9, 0, Math.PI * 2);
        c.fill();
        c.strokeStyle = "rgba(255,214,140,0.85)";
        c.lineWidth = 2;
        for (let r = 0; r < 2; r++) {
          c.beginPath();
          c.ellipse(WX, cy, cr * 2.1, cr * 0.5, f / (r ? -40 : 30) + r * 1.2, 0, Math.PI * 2);
          c.stroke();
        }
        txt(c, "NÚCLEO", WX + cr * 2.3, cy + 6, 20, AMB, P(f, wayAt, 10), 700);
      }
      // a seta "contra a ferida" antes da queda
      const ar = P(f, closeAt, 14) * (1 - P(f, ifAt + 6, 8));
      if (ar > 0) {
        c.strokeStyle = `rgba(255,178,46,${0.8 * ar})`;
        c.setLineDash([8, 8]);
        c.lineDashOffset = -f * 1.2;
        c.lineWidth = 3;
        c.beginPath();
        c.moveTo(WX, 340);
        c.lineTo(WX, WY - 40);
        c.stroke();
        c.setLineDash([]);
        c.fillStyle = `rgba(255,178,46,${0.8 * ar})`;
        c.beginPath();
        c.moveTo(WX - 10, WY - 44);
        c.lineTo(WX + 10, WY - 44);
        c.lineTo(WX, WY - 28);
        c.fill();
      }
      // o impacto: clarão e onda
      if (f >= hit && f < hit + 40) {
        const t = (f - hit) / 40;
        c.strokeStyle = `rgba(255,240,210,${1 - t})`;
        c.lineWidth = 6 * (1 - t) + 1;
        c.beginPath();
        c.ellipse(WX, WY, 40 + 420 * t, 12 + 120 * t, 0, 0, Math.PI * 2);
        c.stroke();
        const fl = 1 - P(f, hit, 10);
        if (fl > 0) {
          c.fillStyle = `rgba(255,244,220,${0.5 * fl})`;
          c.fillRect(40, 220, 1200, 330);
        }
      }
      // a Terra: entra na malha em "não é só o Borealis"; escorre esticando até o ponto em "a Terra vai junto"
      const eo = P(f, notOnlyAt, 14);
      if (eo > 0 && ek < 1) {
        const [hx, hy] = warp(1060, 390);
        const ex = hx + (WX - hx) * ek, ey = hy + (WY - hy) * ek;
        const er = 50 * (1 - 0.92 * ek);
        const ang = Math.atan2(WY - hy, WX - hx);
        c.save();
        c.globalAlpha = c.globalAlpha * eo * (1 - P(f, earthAt + 54, 6));
        c.translate(ex, ey);
        c.rotate(ang);
        c.scale(1 + 1.8 * ek, 1 - 0.5 * ek);
        const pg = c.createRadialGradient(-er * 0.35, -er * 0.35, er * 0.1, 0, 0, er);
        pg.addColorStop(0, "#f2f6ff");
        pg.addColorStop(0.35, ek > 0 ? "#c86a5a" : "#3aa0c8");
        pg.addColorStop(1, "#0a1418");
        c.fillStyle = pg;
        c.beginPath();
        c.arc(0, 0, er, 0, Math.PI * 2);
        c.fill();
        c.strokeStyle = ek > 0 ? RED : ICE;
        c.lineWidth = 2;
        c.stroke();
        c.restore();
        if (ek < 0.3) txt(c, "A TERRA", hx - 44, hy - 66, 20, ek > 0 ? RED : ICE, eo, 700);
      }
      if (f >= priceAt) {
        boxed(c, 900, 170, 330, 60, RED, P(f, priceAt, 8));
        txt(c, "EXISTE UM PREÇO", 920, 210, 26, RED, P(f, priceAt, 8), 700);
      }
      txt(c, "SE O NÚCLEO COLAPSAR NO MOMENTO DO CATALISADOR", 40, 612, 22, "rgba(242,240,247,0.8)", P(f, ifAt, 10) * (1 - P(f, notOnlyAt, 8)));
      txt(c, "NÃO É SÓ O BOREALIS QUE DESAPARECE", 40, 612, 26, CREAM, P(f, notOnlyAt, 10) * (1 - P(f, woundAt, 8)), 700);
      txt(c, "A FERIDA SE FECHA · LEVANDO O ESPAÇO PRESO A ELA", 40, 612, 24, AMB, P(f, woundAt, 10), 700);
      txt(c, "A TERRA VAI JUNTO", 40, 676, 46, RED, P(f, earthAt, 10), 800);
      c.globalAlpha = 1;
    }
    if (cards > 0) {
      c.globalAlpha = cards;
      const who: [number, string, string, string, string][] = [
        [eliCardAt, "hl3silh/eli_retrato.png", "ELI", "SALVAR O BOREALIS", "A CHAVE PARA SALVAR A TERRA"],
        [alyxCardAt, "hl3silh/alyx_badge.jpg", "ALYX", "DESTRUIR ANTES", "QUE ALGUÉM CONTINUE O CICLO"],
        [vargaCardAt, "hl3silh/varga_retrato.png", "VARGA", "UMA PORTA", "PARA ALGO QUE ELE PERDEU"],
      ];
      who.forEach(([t, src, n, a, b], i) => {
        const k = P(f, t, 10);
        if (k <= 0) return;
        const x = 40 + i * 410;
        boxed(c, x, 110, 380, 560, i === 1 ? ORANGE : AMB, k);
        badge(c, im, x + 90, 140, 200, n, i === 1 ? ORANGE : AMB, null, k, src);
        txt(c, a, x + 20, 560, 26, CREAM, k, 800);
        txt(c, b, x + 20, 600, b.length > 22 ? 18 : 21, "rgba(242,240,247,0.85)", P(f, t + 8, 10));
      });
      c.globalAlpha = 1;
    }
    scan(c, f);
  };
};
const wave = (c: Ctx, x: number, y: number, w: number, amp: number, f: number, col: string) => {
  c.fillStyle = col;
  for (let i = 0; i < w / 8; i++) {
    const h = 4 + amp * Math.abs(Math.sin(f / 2.3 + i * 0.9) * Math.sin(f / 7 + i * 0.3));
    c.fillRect(x + i * 8, y - h / 2, 4, h);
  }
};
const drawRadio = (p: PR): Draw => {
  const [eliSilAt, eliAskAt, lostAt, worldAt, otherAt, mossAt, useAt, sealAt] = ["eliSilAt", "eliAskAt", "lostAt", "worldAt", "otherAt", "mossAt", "useAt", "sealAt"].map((k) => at(p, k));
  return (c, f, im) => {
    const mo = P(f, mossAt, 12);
    screenBg(c, mo > 0.5 ? "RÁDIO · DRA. MOSSMAN" : "RÁDIO · ELI VANCE", AMB);
    const src = mo > 0.5 ? "hl3silh/mossman_badge.jpg" : "hl3silh/eli_retrato.png";
    badge(c, im, 60, 110, 250, mo > 0.5 ? "MOSSMAN" : "ELI", mo > 0.5 ? ICE : AMB, null, 1, src);
    const talking = mo > 0.5 ? f >= mossAt && f < sealAt + 90 : f >= eliAskAt && f < mossAt;
    wave(c, 360, 170, 840, talking ? 50 : 2, f, mo > 0.5 ? ICE : AMB);
    if (mo < 0.5) {
      txt(c, "SILÊNCIO", 360, 260, 28, "rgba(242,240,247,0.6)", P(f, eliSilAt, 8) * (1 - P(f, eliAskAt, 8)));
      txt(c, "ELE PASSOU A HISTÓRIA INTEIRA QUERENDO DESTRUIR O BOREALIS", 360, 300, 20, "rgba(242,240,247,0.6)", P(f, eliSilAt + 30, 10) * (1 - P(f, eliAskAt, 8)));
      txt(c, "“GORDON · NÃO FAÇA ISSO”", 360, 290, 40, AMB, P(f, eliAskAt, 10), 800);
      txt(c, "JÁ PERDI A ALYX UMA VEZ", 360, 380, 30, "#f2f0f7", P(f, lostAt, 10), 600);
      txt(c, "NÃO VOU PERDER O MUNDO INTEIRO", 360, 430, 30, "#f2f0f7", P(f, worldAt, 10), 600);
      txt(c, "DEVE EXISTIR OUTRA SAÍDA", 360, 500, 34, CREAM, P(f, otherAt, 10), 800);
    } else {
      txt(c, "“O BOREALIS É UMA ARMA”", 360, 290, 40, ICE, P(f, mossAt + 6, 10), 800);
      txt(c, "CONTRA OS COMBINE · ACABAR COM A OCUPAÇÃO DA TERRA", 360, 380, 24, "#f2f0f7", P(f, useAt, 10), 600);
      boxed(c, 360, 420, 760, 70, GREEN, P(f, sealAt, 10));
      txt(c, "PROMESSA · SELAR O BOREALIS DEPOIS", 384, 466, 28, GREEN, P(f, sealAt + 4, 10), 700);
    }
    scan(c, f);
  };
};
export const HL12PriceS: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const right = useMemo(() => drawCalc(p), []); // eslint-disable-line react-hooks/exhaustive-deps
  const left = useMemo(() => drawRadio(p), []); // eslint-disable-line react-hooks/exhaustive-deps
  const eye = camPath(f, [[0, "R"], [at(p, "eliSilAt") - 16, "L"], [at(p, "alyxAt") - 10, "AY"], [at(p, "vargaAt") - 10, "VG"], [at(p, "eliCardAt") - 30, "R"]]);
  const onceK = P(f, at(p, "onceAt"), 10);
  return (
    <CoreTalk f={f} life={p.life} eye={eye} left={left} right={right} alyx={{ at: [0.9, 5.6, 0], sub: f >= at(p, "onceAt") ? "TODO MUNDO ACHA QUE VAI USAR SÓ UMA VEZ" : f >= at(p, "alyxAt") ? "ESSE É O PROBLEMA" : undefined }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <FlagAt e={eye} pt={[-2.6, 6.4, 0]} label="VARGA" col={AMB} f={f} o={P(f, at(p, "vargaAt") - 20, 10)} sub={f >= at(p, "vargaAt") ? "OS REGISTROS DE CONTINUIDADE" : undefined} />
      </svg>
      {void onceK}
    </CoreTalk>
  );
};
// a sala: Barney chega pela entrada; os Advisors descem do alto; as duas possibilidades nos dois mecanismos
const ADV_FROM: V3[] = [[-3.2, 19.5, 8.5], [1.6, 20.5, 9.2], [4.8, 18.8, 8.2]];
const ADV_TO: V3[] = [[-3.4, 16.2, 5.6], [1.2, 17.6, 6.2], [4.4, 16.0, 5.4]];
export const HL12RoomS: React.FC<PR & { mode?: number }> = (p) => {
  const f = useCurrentFrame();
  const mode = (p.mode as number | undefined) ?? 0;
  const life = p.life;
  const [barneyAt, advAt, almostAt, twoAt, useAt, colAt, alyxAt, noMenuAt, pathsAt, leftAt, rightAt, gmanAt, waitAt] = ["barneyAt", "advAt", "almostAt", "twoAt", "useAt", "colAt", "alyxAt", "noMenuAt", "pathsAt", "leftAt", "rightAt", "gmanAt", "waitAt"].map((k) => at(p, k));
  // 30/10 (ele: os Advisors atravessando a parede do núcleo estava muito ruim e errado — no núcleo só estão a Alyx e o
  // Gordon; o Barney e os rebeldes acabaram de chegar e nada mostrava isso): abre de costas para o núcleo, na porta
  // blindada, com o Barney e os rebeldes entrando; os Advisors avançam em OUTRO lugar, num feed de câmera do Borealis;
  // em "o alinhamento está quase completo" a câmera vira para o núcleo
  const ks: [number, string][] = mode ? [[0, "M"], [leftAt - 10, "ML"], [rightAt - 10, "MR"], [gmanAt - 16, "G"]] : [[0, "B"], [almostAt - 20, "N"], [twoAt + 10, "M"]];
  const eye = camPath(f, ks);
  // os Advisors não entram na câmara (ficam fora da cena 3D)
  const AS = useAdvScene(ADV_FROM.map((a) => ({ pos: a, look: [0, 4, 1.6] as V3, reach: 0.4, show: false })), f, 2.0);
  void ADV_TO;
  // os rebeldes entrando pela porta blindada (do vão em y = 0 até a laje)
  const reb = (k: number) => interpolate(f, [barneyAt + k * 7, barneyAt + k * 7 + 75], [0, 1], { ...C, easing: Easing.out(Easing.quad) });
  const REB: [string, number, number, number, number][] = [
    // src, largura/altura, x final, y final, altura (m)
    ["hl3silh/farda.png", 86 / 200, 0.1, 2.5, 1.86],
    ["hl3silh/rebelde.png", 67 / 200, -0.9, 2.0, 1.8],
    ["hl3silh/empe.png", 66 / 200, 1.0, 2.1, 1.78],
    ["hl3silh/empe2.png", 61 / 200, -0.3, 1.3, 1.72],
    ["hl3silh/rebelde.png", 67 / 200, 0.7, 1.1, 1.8],
  ];
  const feedK = mode ? 0 : P(f, advAt - 4, 10) * (1 - P(f, almostAt - 24, 10));
  const gq = proj(eye, [4.6, 18.4, 0]);
  const gt = proj(eye, [4.6, 18.4, 1.85]);
  const gm = mode ? P(f, gmanAt, 24) : 0;
  return (
    <CoreTalk f={f} life={p.life} eye={eye} mech objs={AS.extras} objLights={AS.lights} alyx={{ at: [0.9, 5.6, 0], sub: !mode && f >= alyxAt ? "OLHA PARA O GORDON" : undefined }} mL={mode ? P(f, leftAt, 10) * (1 - P(f, rightAt, 10)) : P(f, useAt, 10)} mR={mode ? P(f, rightAt, 10) : P(f, colAt, 10)} msg={!mode && f >= almostAt && f < twoAt + 20 ? "ALINHAMENTO · 99% · QUASE COMPLETO" : mode && f >= noMenuAt && f < leftAt ? (f >= pathsAt ? "DOIS CAMINHOS FÍSICOS DENTRO DA SALA" : "SEM MENU · SEM OPÇÕES NA TELA") : mode && f >= waitAt ? "TALVEZ ELE TAMBÉM ESTEJA ESPERANDO" : undefined}>
      {/* o G-Man no fundo, parado, observando (silhueta contra a luz do poço) */}
      {gm > 0 && gq && gt ? (
        <div style={{ position: "absolute", left: gq.x - (gq.y - gt.y) * 0.185, top: gt.y, width: (gq.y - gt.y) * 0.37, height: gq.y - gt.y, opacity: gm * 0.95, filter: "drop-shadow(0 0 4px rgba(255,210,150,0.7)) drop-shadow(0 0 14px rgba(255,170,90,0.4))", pointerEvents: "none" }}>
          <div style={{ position: "absolute", inset: 0, WebkitMaskImage: `url(${staticFile("hl3silh/gman_silh.png")})`, maskImage: `url(${staticFile("hl3silh/gman_silh.png")})`, WebkitMaskSize: "100% 100%", maskSize: "100% 100%", background: "#07080a" }} />
        </div>
      ) : null}
      {!mode
        ? REB.map(([src, ar, x, y, h], i) => {
            const k = reb(i);
            const yy = 0.15 + (y - 0.15) * k;
            const walking = k > 0 && k < 1;
            return <SilhouetteAt key={i} e={eye} x={x * (0.4 + 0.6 * k)} y={yy} h={h} src={src} ar={ar} f={f} o={Math.min(1, k * 4)} rim="rgba(255,190,110,0.7)" top="#3a3226" bot="#0c0a08" bob={walking ? Math.abs(Math.sin(f / 4 + i)) * -4 : 0} flip={i % 2 === 1} label={i === 0 ? "BARNEY" : undefined} labelCol={AMB} sub={i === 0 ? "E OS REBELDES · NA ENTRADA DO NÚCLEO" : undefined} />;
          })
        : null}
      {/* os Advisors: em outro lugar do Borealis, num feed de câmera (não dentro do núcleo) */}
      {feedK > 0 ? (
        <div style={{ position: "absolute", right: 90, top: 150, width: 640, opacity: feedK, transform: `translateY(${(1 - feedK) * 20}px)`, fontFamily: MONO, pointerEvents: "none" }}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 14px", background: "rgba(40,8,8,0.92)", border: `1.5px solid ${RED}`, borderBottom: "none", color: RED, fontSize: 16, letterSpacing: 4 }}>
            <span>● FEED · OUTRA ALA DO BOREALIS</span>
            <span>{`DIST. NÚCLEO ${Math.max(180, Math.round(620 - (f - advAt) * 1.6))} m`}</span>
          </div>
          <svg width={640} height={340} style={{ display: "block", background: "#07090c", border: `1.5px solid ${RED}` }}>
            <defs>
              <filter id="advTint">
                <feColorMatrix type="matrix" values="0 0 0 0 0.85  0 0 0 0 0.72  0 0 0 0 1  0 0 0 1 0" />
              </filter>
              <radialGradient id="advGlow">
                <stop offset="0" stopColor="rgba(199,155,255,0.45)" />
                <stop offset="1" stopColor="rgba(199,155,255,0)" />
              </radialGradient>
            </defs>
            {/* o corredor em perspectiva, com as nervuras passando */}
            {[0, 1, 2, 3, 4, 5].map((i) => {
              const t = ((i + (f - advAt) / 30) % 6) / 6;
              const s = 0.12 + t * t * 1.1;
              const w = 640 * s, hh = 340 * s;
              return <rect key={i} x={320 - w / 2} y={180 - hh / 2} width={w} height={hh} fill="none" stroke={`rgba(159,230,255,${0.1 + 0.25 * t})`} strokeWidth={1 + 2 * t} />;
            })}
            <line x1={0} y1={340} x2={300} y2={190} stroke="rgba(159,230,255,0.2)" />
            <line x1={640} y1={340} x2={340} y2={190} stroke="rgba(159,230,255,0.2)" />
            <line x1={0} y1={0} x2={300} y2={170} stroke="rgba(159,230,255,0.2)" />
            <line x1={640} y1={0} x2={340} y2={170} stroke="rgba(159,230,255,0.2)" />
            {/* três Advisors flutuando pelo corredor, vindo para a câmera */}
            {[[-150, -10, 0], [10, -40, 10], [160, 0, 20]].map(([dx, dy, d], i) => {
              const t = Math.min(1, Math.max(0, (f - advAt - d) / 110));
              const sc = 0.45 + 0.75 * t;
              const x = 320 + dx * sc, y = 175 + dy * sc + Math.sin(f / 14 + i) * 5;
              const w = 150 * sc, h = 106 * sc;
              return (
                <g key={i} opacity={Math.min(1, t * 5 + 0.2)}>
                  <circle cx={x} cy={y} r={w * 0.8} fill="url(#advGlow)" />
                  <image href={staticFile("hl3silh/advisor_mask.png")} x={x - w / 2} y={y - h / 2} width={w} height={h} filter="url(#advTint)" />
                </g>
              );
            })}
            {Array.from({ length: 34 }, (_, i) => <rect key={i} x={0} y={i * 10 + ((f * 2) % 10)} width={640} height={2} fill="rgba(0,0,0,0.25)" />)}
            <text x={18} y={322} fill={VIO} fontFamily={MONO} fontSize={20} letterSpacing={4}>OS ADVISORS · AVANÇANDO</text>
          </svg>
          <div style={{ marginTop: 8, fontSize: 15, letterSpacing: 3, color: "rgba(242,240,247,0.75)" }}>DO OUTRO LADO · LONGE DA CÂMARA DO NÚCLEO</div>
        </div>
      ) : null}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {!mode ? <Call e={eye} f={f} pt={MECH_L} from={useAt} until={life} text="USAR O CATALISADOR" sub="ACABAR COM OS COMBINE · SALVAR A HUMANIDADE AGORA" col={ICE} dx={160} dy={-260} /> : null}
        {!mode ? <Call e={eye} f={f} pt={MECH_R} from={colAt} until={life} text="COLAPSAR O NÚCLEO" sub="QUEBRAR A CONVERGÊNCIA · SACRIFICAR A TERRA" col={ORANGE} dx={-180} dy={-300} /> : null}
        {mode ? <Call e={eye} f={f} pt={MECH_L} from={leftAt + 20} until={rightAt} text="O SISTEMA QUE COMPLETA O USO DO BOREALIS" col={ICE} dx={220} dy={-240} /> : null}
        {mode ? <Call e={eye} f={f} pt={MECH_R} from={rightAt + 20} until={gmanAt - 10} text="O MECANISMO QUE LANÇA O NÚCLEO CONTRA A FERIDA" col={ORANGE} dx={-260} dy={-260} /> : null}
        {mode ? <Call e={eye} f={f} pt={ARM_R} from={rightAt + 40} until={gmanAt - 10} text="O BRAÇO QUE SEGURA O NÚCLEO" col={ORANGE} dx={-120} dy={200} /> : null}
        {mode && gm > 0 ? <Call e={eye} f={f} pt={[4.6, 18.4, 1.9]} from={gmanAt + 30} until={life} text="O G-MAN" sub="NÃO APONTA · NÃO INTERFERE" col={CREAM} dx={-320} dy={-160} /> : null}
      </svg>
    </CoreTalk>
  );
};
// a dúvida da Alyx: a certeza é dela ou do G-Man? — e ela não escolhe por ele
const drawDoubt = (p: PR): Draw => {
  const [certAt, firstAt, doubtAt, gmanAt, builtAt, memAt, usedAt, proofAt, refuseAt, s1At, s2At, s3At, lastAt, stillAt, askAt, clearAt, promAt, finalAt] = ["certAt", "firstAt", "doubtAt", "gmanAt", "builtAt", "memAt", "usedAt", "proofAt", "refuseAt", "s1At", "s2At", "s3At", "lastAt", "stillAt", "askAt", "clearAt", "promAt", "finalAt"].map((k) => at(p, k));
  // 13/10 (pedido dele: coisas truncadas uma na outra): em blocos — cada bloco entra sozinho, no máximo 2 ou 3 linhas
  // grandes, e o anterior sai antes (nada empilhado)
  const blk = (f: number, a: number, b: number) => P(f, a, 10) * (1 - P(f, b - 8, 8));
  return (c, f, im) => {
    screenBg(c, "A. VANCE · A ÚLTIMA ESCOLHA", ORANGE);
    // a tela acesa (não um buraco preto) e o conteúdo no meio da altura
    const gl = c.createRadialGradient(CW / 2, CH / 2, 60, CW / 2, CH / 2, CW * 0.7);
    gl.addColorStop(0, "rgba(96,168,190,0.62)");
    gl.addColorStop(0.6, "rgba(64,120,142,0.5)");
    gl.addColorStop(1, "rgba(44,88,108,0.42)");
    c.fillStyle = gl;
    c.fillRect(0, 70, CW, CH - 70);
    c.save();
    c.translate(0, 70);
    let k = blk(f, certAt, doubtAt);
    if (k > 0) {
      txt(c, "DESTRUIR O NÚCLEO", 80, 300, 64, CREAM, k, 800);
      txt(c, "A ÚNICA MANEIRA", 80, 370, 34, ORANGE, k, 700);
      txt(c, "ALGO QUE ELA NÃO CONSEGUE RESPONDER", 80, 460, 28, "rgba(242,240,247,0.8)", k * P(f, firstAt, 10));
    }
    k = blk(f, doubtAt, builtAt);
    if (k > 0) {
      badge(c, im, 70, 150, 300, "ALYX", ORANGE, null, k);
      const ag = P(f, gmanAt, 20) * k;
      if (ag > 0) {
        c.save();
        c.beginPath();
        c.rect(70, 150, 150, 380);
        c.clip();
        badge(c, im, 70, 150, 300, "", "#6ec3ff", "blue", ag);
        c.restore();
      }
      txt(c, "ESSA CERTEZA", 440, 300, 54, ORANGE, k, 800);
      txt(c, "É DELA?", 440, 360, 54, ORANGE, k, 800);
      txt(c, "OU A ÚLTIMA COISA QUE", 440, 450, 36, "#6ec3ff", ag, 800);
      txt(c, "O G-MAN DEIXOU?", 440, 496, 36, "#6ec3ff", ag, 800);
    }
    k = blk(f, builtAt, proofAt);
    if (k > 0) {
      txt(c, "ELE CONSTRUIU A AGENTE", 80, 250, 44, CREAM, k, 800);
      txt(c, "PARA LEVAR TUDO ATÉ AQUI", 80, 302, 44, CREAM, k, 800);
      txt(c, "· MESMO DEPOIS DE RECUPERAR AS MEMÓRIAS", 80, 400, 28, "rgba(242,240,247,0.85)", k * P(f, memAt, 10));
      txt(c, "· MESMO DEPOIS DE USAR A AGENTE CONTRA ELE", 80, 450, 28, "rgba(242,240,247,0.85)", k * P(f, usedAt, 10));
    }
    k = blk(f, proofAt, refuseAt);
    if (k > 0) {
      boxed(c, 70, 250, 1140, 200, RED, k);
      txt(c, "NÃO CONSEGUE PROVAR", 110, 330, 52, RED, k, 800);
      txt(c, "QUE ISSO NÃO ERA PARTE DO PLANO", 110, 395, 40, "#f2f0f7", k, 700);
    }
    k = blk(f, refuseAt, lastAt);
    if (k > 0) {
      txt(c, "ELA SE RECUSA A FAZER", 80, 210, 46, ORANGE, k, 800);
      txt(c, "A ÚLTIMA ESCOLHA", 80, 264, 46, ORANGE, k, 800);
      ([[s1At, "FOI ELA QUEM LEVOU O GORDON ATÉ ALI"], [s2At, "QUEM MANTEVE OS COMBINE AVANÇANDO"], [s3At, "QUEM SEGUROU O PROCEDIMENTO ATÉ A HORA CERTA"]] as [number, string][]).forEach(([t, s], i) => {
        const kk = P(f, t, 8) * k;
        c.fillStyle = `rgba(141,255,168,${kk})`;
        c.fillRect(80, 342 + i * 62, 24, 24);
        txt(c, s, 124, 364 + i * 62, 28, "#f2f0f7", kk, 600);
      });
    }
    k = blk(f, lastAt, askAt);
    if (k > 0) {
      boxed(c, 70, 230, 1140, 130, AMB, k);
      txt(c, "O ÚLTIMO PASSO PRECISA SER DELE", 110, 312, 46, AMB, k, 800);
      txt(c, "ELA AINDA QUER DESTRUIR · AINDA ACHA QUE É A ÚNICA SAÍDA", 80, 440, 26, "rgba(242,240,247,0.85)", k * P(f, stillAt, 10));
    }
    k = blk(f, askAt, promAt);
    if (k > 0) {
      txt(c, "“Gordon, por favor,", 80, 290, 54, CREAM, k, 700);
      txt(c, "confie em mim mais uma vez.”", 80, 356, 54, CREAM, k, 700);
      txt(c, "SE ELE ESCOLHER O CONTRÁRIO · ELA NÃO VAI IMPEDIR", 80, 460, 28, ICE, k * P(f, clearAt, 10), 700);
    }
    const ph3 = P(f, promAt, 12);
    if (ph3 > 0) {
      const ka = ph3 * (1 - P(f, finalAt - 8, 8));
      if (ka > 0) {
        badge(c, im, 70, 150, 300, "ALYX", ORANGE, null, ka);
        txt(c, "NÃO PROMETE CONCORDAR", 440, 300, 40, "#f2f0f7", ka, 700);
        txt(c, "SÓ PROMETE NÃO", 440, 380, 46, ORANGE, ka, 800);
        txt(c, "ESCOLHER POR ELE", 440, 436, 46, ORANGE, ka, 800);
      }
      const fk = P(f, finalAt, 12);
      if (fk > 0) {
        txt(c, "TALVEZ A ÚNICA DECISÃO", 80, 250, 46, CREAM, fk, 700);
        txt(c, "QUE O G-MAN NÃO CONSIGA CONTROLAR", 80, 306, 46, CREAM, fk, 700);
        txt(c, "SEJA UMA QUE NÃO VENHA DELA", 80, 410, 52, AMB, P(f, finalAt + 20, 10), 800);
      }
    }
    c.restore();
    scan(c, f);
  };
};
export const HL12LastS: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const right = useMemo(() => drawDoubt(p), []); // eslint-disable-line react-hooks/exhaustive-deps
  const [bothAt, colAt, useAt, promAt] = ["bothAt", "colAt", "useAt", "promAt"].map((k) => at(p, k));
  const eye = camPath(f, [[0, "A2"], [bothAt - 10, "M"], [promAt - 16, "A2"]]);
  return (
    <CoreTalk f={f} life={p.life} eye={eye} right={right} mech mL={P(f, useAt, 10) * (1 - P(f, promAt, 10))} mR={P(f, colAt, 10) * (1 - P(f, promAt, 10))} alyx={{ at: [4.6, 4.6, 0], sub: f >= bothAt && f < promAt ? "SABE OPERAR OS DOIS CAMINHOS" : undefined }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <Call e={eye} f={f} pt={MECH_R} from={colAt} until={promAt - 16} text="COLAPSAR" sub="ELA COMPLETA A SEQUÊNCIA" col={ORANGE} dx={-180} dy={-280} />
        <Call e={eye} f={f} pt={MECH_L} from={useAt} until={promAt - 16} text="USAR COMO ARMA" sub="ELA REDIRECIONA O PROCEDIMENTO" col={ICE} dx={160} dy={-240} />
      </svg>
    </CoreTalk>
  );
};
