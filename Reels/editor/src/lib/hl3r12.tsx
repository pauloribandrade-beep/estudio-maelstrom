// =================================================================================================
// HL3 · 1:12:36 → 1:15:16 reformulado (12/10/2026). Pedido dele: o bloqueio (cadeado sobre colagem, Dog bugado, Eli
// colado) e as "versões da própria vida" (espaço cinza, G-Man lá atrás, rotas mal apresentadas, rosto cortado) eram
// genéricos → jogar fora e reformular.
// A narração acontece DURANTE a corrida ("entre um combate e outro, Alyx começa a falar… ela continua andando enquanto
// fala"). Então é um POV contínuo no corredor aprovado (buildShipHall2), a Alyx (crachá) andando à frente, e o que ela
// conta aparece nas TELAS DE PAREDE do Borealis: telas de verdade dentro do 3D (canvas como textura num plano, com
// profundidade — as cavernas do corredor tampam), em baias livres, alternando os lados. A câmera para diante de cada
// tela e vira para ela; depois segue andando até a próxima.
// =================================================================================================
import React, { useEffect, useMemo, useRef, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, Easing, interpolate, staticFile, useCurrentFrame } from "remotion";
import * as THREE from "three";
import { MONO } from "./overlays";
import { C, HL } from "./hl3";
import { FilmLook } from "./hl3r";
import { Eye, Hud } from "./hl3rf";
import { XView, XL, RGB, mk, keys, fadeIO, buildShipHall2 } from "./hl3rx";
import { FlagAt } from "./hl3r9";

const RED = "#ff5d4d";
const AMB = "#ffb22e";
const CREAM = "#ffe2b0";
const ICE = "#9fe6ff";
const GREEN = "#8dffa8";
const ORANGE = HL.orange;
const P = (f: number, at: number, d = 12) => interpolate(f, [at, at + d], [0, 1], { ...C, easing: Easing.out(Easing.cubic) });
type PR = Record<string, number> & { life: number };
const at = (p: PR, k: string) => Math.round((p[k] as number | undefined) ?? 1e6); // o registro já entrega em quadros

// ------------------------------------------------------------------------------------------------ imagens
const IMGS = ["hl3silh/alyx_badge.jpg", "hl3silh/gman_silh.png", "hl3silh/gordon_retrato.png", "hl3silh/eli_retrato.png", "hl3silh/combine_badge.jpg", "hl3silh/vort_icone.png", "hl3silh/kleiner_retrato.png", "hl3silh/magnusson_badge.jpg", "hl3silh/mossman_badge.jpg", "hl3silh/barney_badge.jpg", "hl3silh/varga_retrato.png", "hl3silh/dog_badge.jpg", "hl3silh/advisor_mask.png"];
let imgCache: Record<string, HTMLImageElement> | null = null;
let imgPending: Promise<Record<string, HTMLImageElement>> | null = null;
const loadImgs = () => {
  if (imgCache) return Promise.resolve(imgCache);
  if (!imgPending)
    imgPending = Promise.all(
      IMGS.map(
        (n) =>
          new Promise<[string, HTMLImageElement]>((res) => {
            const im = new Image();
            im.onload = () => res([n, im]);
            im.onerror = () => res([n, im]);
            im.src = staticFile(n);
          }),
      ),
    ).then((a) => (imgCache = Object.fromEntries(a)));
  return imgPending;
};
export const useImgs = () => {
  const [ok, setOk] = useState(!!imgCache);
  useEffect(() => {
    if (ok) return;
    const h = delayRender("hl3r12 imgs");
    loadImgs().then(() => {
      setOk(true);
      continueRender(h);
    });
  }, [ok]);
  return ok ? imgCache : null;
};

// ------------------------------------------------------------------------------------------------ kit de desenho da tela
export const CW = 1280, CH = 720;
export type Ctx = CanvasRenderingContext2D;
export type Im = Record<string, HTMLImageElement>;
export const font = (c: Ctx, px: number, w = 400) => (c.font = `${w} ${px}px 'Geist Mono', ui-monospace, monospace`);
export const screenBg = (c: Ctx, title: string, col = ICE, alert = false) => {
  const g = c.createLinearGradient(0, 0, 0, CH);
  // 13/10 (pedido dele: telas escuras demais, quase não dá para ver): a tela acesa, com o brilho no meio
  g.addColorStop(0, alert ? "#4a1410" : "#2c6a7c");
  g.addColorStop(0.5, alert ? "#3a0e0a" : "#22586a");
  g.addColorStop(1, alert ? "#28090a" : "#184554");
  c.fillStyle = g;
  c.fillRect(0, 0, CW, CH);
  c.strokeStyle = "rgba(159,230,255,0.12)";
  c.lineWidth = 1;
  for (let x = 0; x < CW; x += 64) {
    c.beginPath();
    c.moveTo(x, 70);
    c.lineTo(x, CH);
    c.stroke();
  }
  for (let y = 70; y < CH; y += 64) {
    c.beginPath();
    c.moveTo(0, y);
    c.lineTo(CW, y);
    c.stroke();
  }
  c.fillStyle = col;
  font(c, 28, 500);
  c.fillText(title, 40, 50);
  c.fillRect(40, 62, 160, 3);
};
export const scan = (c: Ctx, f: number) => {
  c.fillStyle = "rgba(0,0,0,0.08)";
  for (let y = (f * 2) % 4; y < CH; y += 4) c.fillRect(0, y, CW, 2);
};
export const txt = (c: Ctx, s: string, x: number, y: number, px: number, col: string, k = 1, w = 400) => {
  if (k <= 0) return;
  // 30/10: multiplica pelo alpha de quem chamou (antes zerava para 1 e quebrava todo crossfade: as duas cenas por cima)
  const base = c.globalAlpha;
  c.globalAlpha = base * Math.min(1, k);
  font(c, px, w);
  c.fillStyle = col;
  c.fillText(s.slice(0, Math.max(0, Math.round(s.length * Math.min(1, k * 1.6)))), x, y);
  c.globalAlpha = base;
};
export const strike = (c: Ctx, x: number, y: number, w: number, k: number) => {
  if (k <= 0) return;
  c.fillStyle = RED;
  c.fillRect(x - 6, y - 10, (w + 12) * k, 4);
};
export const boxed = (c: Ctx, x: number, y: number, w: number, h: number, col: string, k = 1, fill = "rgba(6,16,22,0.85)") => {
  if (k <= 0) return;
  const base = c.globalAlpha;
  c.globalAlpha = base * Math.min(1, k);
  c.fillStyle = fill;
  c.fillRect(x, y, w, h);
  c.strokeStyle = col;
  c.lineWidth = 3;
  c.strokeRect(x, y, w, h);
  c.globalAlpha = base;
};
// o crachá (foto + faixa com nome); tint: null = normal · "blue" = a agente · "amber" = as vidas
export const badge = (c: Ctx, im: Im, x: number, y: number, w: number, label: string, col: string, tint: null | "blue" | "amber" = null, o = 1, src = "hl3silh/alyx_badge.jpg") => {
  const h = w * 1.25;
  const base = c.globalAlpha;
  c.globalAlpha = base * o;
  c.fillStyle = "#0b0d10";
  c.fillRect(x - 4, y - 4, w + 8, h + 8 + 44);
  const img = im[src];
  if (img && img.width) {
    const sw = img.width, sh = img.height;
    // 30/10 (ele: o crachá do G-Man saía todo preto): silhueta preta precisa de contraluz e cabe inteira (contain)
    const silh = src.includes("_silh");
    const s = silh ? Math.min(w / sw, h / sh) * 0.92 : Math.max(w / sw, h / sh);
    const dw = sw * s, dh = sh * s;
    c.save();
    c.beginPath();
    c.rect(x, y, w, h);
    c.clip();
    if (silh) {
      const g = c.createRadialGradient(x + w / 2, y + h * 0.4, 4, x + w / 2, y + h * 0.4, h * 0.75);
      g.addColorStop(0, "#fff4dc");
      g.addColorStop(0.45, col);
      g.addColorStop(1, "#2a2418");
      c.fillStyle = g;
      c.fillRect(x, y, w, h);
    }
    c.drawImage(img, x + (w - dw) / 2, silh ? y + h - dh : y + (h - dh) * 0.22, dw, dh);
    if (tint) {
      c.globalCompositeOperation = "color";
      c.fillStyle = tint === "blue" ? "#3aa8ff" : "#ffb22e";
      c.fillRect(x, y, w, h);
      c.globalCompositeOperation = "source-over";
    }
    c.restore();
  }
  c.strokeStyle = col;
  c.lineWidth = 4;
  c.strokeRect(x, y, w, h + 44);
  c.fillStyle = col;
  c.fillRect(x, y + h, w, 44);
  font(c, 22, 700);
  c.fillStyle = "#0b0b0b";
  const tw = c.measureText(label).width;
  c.fillText(label, x + (w - tw) / 2, y + h + 30);
  c.globalAlpha = base;
};
export const lockIcon = (c: Ctx, x: number, y: number, s: number, col: string, open = 0) => {
  c.strokeStyle = col;
  c.lineWidth = s * 0.12;
  c.beginPath();
  c.arc(x, y - s * 0.35 - open * s * 0.4, s * 0.32, Math.PI, 0);
  c.stroke();
  c.fillStyle = col;
  c.fillRect(x - s * 0.45, y - s * 0.35, s * 0.9, s * 0.75);
  c.fillStyle = "#06141c";
  c.beginPath();
  c.arc(x, y, s * 0.1, 0, Math.PI * 2);
  c.fill();
};

// ------------------------------------------------------------------------------------------------ as telas (uma por parada)
type Draw = (c: Ctx, f: number, im: Im) => void;
type Stop = { from: number; draw: Draw };

// 1:12:36 a agente dentro dela
const drawAgent = (p: PR): Draw => {
  const [notJustAt, leftAt, partAt] = [at(p, "notJustAt"), at(p, "leftAt"), at(p, "partAt")];
  return (c, f, im) => {
    screenBg(c, "H.E.V. · ANÁLISE · A. VANCE");
    badge(c, im, 70, 110, 340, "ALYX", ORANGE);
    // a segunda camada: o scanner desce e revela (frio, duotone) o que ficou
    const sc = P(f, leftAt - 4, 40);
    if (sc > 0) {
      c.save();
      c.beginPath();
      c.rect(70, 110, 340, 425 * sc);
      c.clip();
      badge(c, im, 70, 110, 340, "ALYX · CAMADA 2", ICE, "blue");
      const gm = im["hl3silh/gman_silh.png"];
      if (gm && gm.width) {
        c.globalAlpha = 0.5;
        c.drawImage(gm, 300, 300, 80, 216);
        c.globalAlpha = 1;
      }
      c.restore();
      if (sc < 1) {
        c.fillStyle = ICE;
        c.fillRect(66, 110 + 425 * sc, 348, 4);
      }
    }
    txt(c, "SÓ LEVOU AS MEMÓRIAS", 480, 170, 34, "rgba(242,240,247,0.7)", P(f, notJustAt, 8));
    strike(c, 480, 170, 420, P(f, notJustAt + 30, 10));
    txt(c, "DEIXOU ALGUMA COISA", 480, 250, 44, CREAM, P(f, leftAt, 10), 700);
    txt(c, "DENTRO DELA", 480, 302, 44, CREAM, P(f, leftAt + 8, 10), 700);
    const k = P(f, partAt, 10);
    boxed(c, 480, 360, 720, 150, ICE, k);
    txt(c, "UMA PARTE · ADORMECIDA", 506, 412, 28, ICE, P(f, partAt + 4, 10));
    txt(c, "CRIADA PARA DESPERTAR", 506, 456, 32, "#f2f0f7", P(f, partAt + 10, 10));
    txt(c, "NO MOMENTO CERTO", 506, 494, 32, "#f2f0f7", P(f, partAt + 16, 10));
    scan(c, f);
  };
};

// 1:12:54 o bloqueio: o painel de sinais (o mesmo do labirinto, 37:03) — os lapsos subindo até o salto romper o cadeado
const drawBlock = (p: PR): Draw => {
  const [backAt, sleepAt, ritAt, painAt, imgAt, knowAt, jumpAt] = ["backAt", "sleepAt", "ritAt", "painAt", "imgAt", "knowAt", "jumpAt"].map((k) => at(p, k));
  return (c, f, im) => {
    const jump = P(f, jumpAt, 10);
    screenBg(c, "ALYX · SINAIS", jump > 0.5 ? AMB : ICE);
    // ECG: calmo; com as dores, picos; no salto, um pico enorme
    const pain = P(f, painAt, 20);
    c.strokeStyle = jump > 0 ? AMB : GREEN;
    c.lineWidth = 3;
    c.beginPath();
    for (let x = 0; x <= 560; x += 4) {
      const t = (x + f * 6) / 60;
      let y = Math.sin(t * 2) * 6;
      const ph = t % 4;
      if (ph > 3.6 && ph < 3.8) y -= 50 + 40 * pain * (0.5 + 0.5 * Math.sin(t * 7));
      if (jump > 0 && Math.abs(x - 300) < 40) y -= 220 * jump * Math.cos(((x - 300) / 40) * Math.PI * 0.5);
      if (x === 0) c.moveTo(60 + x, 330 + y);
      else c.lineTo(60 + x, 330 + y);
    }
    c.stroke();
    txt(c, "ECG", 60, 130, 22, "rgba(242,240,247,0.6)", 1);
    // contagem de lapsos
    const laps = Math.floor(interpolate(f, [ritAt, painAt, imgAt, knowAt, jumpAt], [0, 3, 7, 12, 19], C));
    txt(c, "LAPSOS", 60, 470, 24, "rgba(242,240,247,0.6)", 1);
    txt(c, String(laps).padStart(2, "0"), 60, 560, 84, laps > 10 ? AMB : "#f2f0f7", 1, 700);
    // à direita: a memória em blocos, trancada
    txt(c, "MEMÓRIA", 700, 100, 20, "rgba(242,240,247,0.6)", 1);
    const gx = 700, gy = 116, cw = 120, chh = 88;
    const lit = (i: number) => (i * 37) % 12;
    for (let i = 0; i < 12; i++) {
      const x = gx + (i % 4) * (cw + 10), y = gy + Math.floor(i / 4) * (chh + 10);
      const on = (f >= imgAt && lit(i) < interpolate(f, [imgAt, jumpAt], [2, 7], C)) || jump > 0.3;
      c.fillStyle = on ? (jump > 0.3 ? "rgba(255,178,46,0.35)" : "rgba(141,255,168,0.22)") : "rgba(159,230,255,0.13)";
      c.fillRect(x, y, cw, chh);
      c.strokeStyle = on ? (jump > 0.3 ? AMB : GREEN) : "rgba(159,230,255,0.5)";
      c.lineWidth = 2;
      c.strokeRect(x, y, cw, chh);
    }
    // as rachaduras do ritual (verde) no bloqueio
    const rit = P(f, ritAt, 60);
    if (rit > 0 && jump < 1) {
      c.strokeStyle = GREEN;
      c.lineWidth = 3;
      c.globalAlpha = 0.85 * (1 - jump);
      for (let k = 0; k < 6; k++) {
        c.beginPath();
        let x = gx + 255, y = gy + 150;
        c.moveTo(x, y);
        for (let s = 0; s < 6 * rit; s++) {
          x += Math.cos(k * 1.05 + s * 0.7) * 34;
          y += Math.sin(k * 1.05 + s * 0.9) * 26;
          c.lineTo(x, y);
        }
        c.stroke();
      }
      c.globalAlpha = 1;
    }
    // o cadeado no meio: fecha (adormecida), racha (ritual), estoura no salto
    if (f >= sleepAt && jump < 1) {
      c.globalAlpha = P(f, sleepAt, 8) * (1 - jump);
      lockIcon(c, gx + 255, gy + 170, 110, jump > 0 ? AMB : ICE, jump);
      c.globalAlpha = 1;
    }
    if (jump > 0)
      for (let k = 0; k < 10; k++) {
        const a = (k / 10) * Math.PI * 2;
        const r = 40 + 260 * jump;
        c.fillStyle = AMB;
        c.globalAlpha = 1 - jump * 0.7;
        c.fillRect(gx + 255 + Math.cos(a) * r, gy + 170 + Math.sin(a) * r * 0.7, 14, 10);
        c.globalAlpha = 1;
      }
    // o que acontece (uma linha por vez)
    const lines: [number, string, string][] = [[backAt, "DEVOLVIDA SEM LEMBRAR", "#f2f0f7"], [sleepAt, "A AGENTE · ADORMECIDA", ICE], [ritAt, "O RITUAL COMEÇA A QUEBRAR O BLOQUEIO", GREEN], [painAt, "DORES · LAPSOS", AMB], [imgAt, "IMAGENS", AMB], [knowAt, "COISAS QUE SABIA SEM SABER DE ONDE", AMB], [jumpAt, "O GRANDE SALTO · BLOQUEIO ROMPIDO", AMB]];
    let cur = -1;
    lines.forEach(([t], i) => {
      if (f >= t) cur = i;
    });
    if (cur >= 0) {
      const [t, s, col] = lines[cur];
      boxed(c, 700, 440, 520, 80, col, P(f, t, 8));
      // 30/10 (ele: "O RITUAL COMEÇA A QUEBRAR O BLOQUEIO" saía da caixa): a letra encolhe até caber nos 520 da caixa
      let px = s.length > 26 ? 24 : 30;
      font(c, px, 600);
      const tw = c.measureText(s).width;
      if (tw > 476) px = Math.floor((px * 476) / tw);
      txt(c, s, 722, 492, px, col, P(f, t + 2, 10), 600);
      // os anteriores, pequenos, embaixo
      lines.slice(Math.max(0, cur - 3), cur).forEach(([, s2], k) => txt(c, "· " + s2, 700, 566 + k * 36, 23, "rgba(242,240,247,0.5)", 1));
    }
    scan(c, f);
  };
};

// 1:13:06 a linha do tempo dela, tirada da experiência linear
const drawLinear = (p: PR): Draw => {
  const [tookAt, biggerAt, linearAt] = [at(p, "tookAt"), at(p, "biggerAt"), at(p, "linearAt")];
  return (c, f, im) => {
    screenBg(c, "LINHA DO TEMPO · A. VANCE");
    const y0 = 360;
    const br = P(f, linearAt, 40);
    c.strokeStyle = "rgba(242,240,247,0.8)";
    c.lineWidth = 4;
    c.beginPath();
    c.moveTo(80, y0);
    c.lineTo(br > 0 ? 560 : 1200, y0);
    c.stroke();
    // a experiência linear se abre em ramos (as outras linhas)
    if (br > 0)
      for (let k = 0; k < 9; k++) {
        const dy = (k - 4) * 62;
        c.strokeStyle = k === 4 ? "rgba(242,240,247,0.8)" : `rgba(159,230,255,${0.35 + 0.05 * k})`;
        c.lineWidth = k === 4 ? 4 : 2.5;
        c.beginPath();
        c.moveTo(560, y0);
        c.bezierCurveTo(700, y0, 760, y0 + dy * br, 900, y0 + dy * br);
        c.lineTo(900 + 300 * br, y0 + dy * br);
        c.stroke();
      }
    txt(c, "LINEAR", 90, y0 - 24, 22, "rgba(242,240,247,0.6)", 1);
    // a Alyx (ponto) anda; o G-Man (maleta) a tira da linha
    const take = P(f, tookAt, 30);
    const ax = 300 + Math.min(200, f * 0.8);
    const ay = y0 - 160 * take;
    c.fillStyle = ORANGE;
    c.beginPath();
    c.arc(ax, ay, 14, 0, Math.PI * 2);
    c.fill();
    txt(c, "ALYX", ax - 30, ay - 26, 22, ORANGE, 1, 700);
    if (take > 0) {
      const gm = im["hl3silh/gman_silh.png"];
      if (gm && gm.width) {
        c.globalAlpha = take;
        c.drawImage(gm, ax + 30, ay - 70, 52, 140);
        c.globalAlpha = 1;
      }
      c.setLineDash([8, 8]);
      c.strokeStyle = ORANGE;
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(ax, y0);
      c.lineTo(ax, ay + 16);
      c.stroke();
      c.setLineDash([]);
    }
    txt(c, "APAGAR ALGUMAS MEMÓRIAS", 80, 600, 30, "rgba(242,240,247,0.6)", P(f, biggerAt - 20, 8));
    strike(c, 80, 600, 470, P(f, biggerAt, 8));
    txt(c, "ALGO MUITO MAIOR", 80, 660, 44, CREAM, P(f, biggerAt + 6, 10), 700);
    if (br > 0.5) txt(c, "OUTRAS LINHAS · OUTRAS ESCOLHAS · OUTROS FUTUROS", 640, 670, 22, ICE, P(f, linearAt + 20, 12));
    scan(c, f);
  };
};

// 1:13:21 as versões (2 × 2): rotas diferentes até o Borealis · vence · perde · do lado dos Combine
export const miniRoute = (c: Ctx, x: number, y: number, w: number, h: number, k: number, f: number) => {
  // três caminhos diferentes chegando ao mesmo ponto (o Borealis)
  const bx = x + w - 60, by = y + h * 0.45;
  const starts = [[x + 30, y + 40], [x + 40, y + h - 40], [x + 30, y + h * 0.55]];
  starts.forEach(([sx, sy], i) => {
    c.strokeStyle = i === 0 ? ORANGE : "rgba(255,178,46,0.55)";
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(sx, sy);
    const n = 20;
    for (let s = 1; s <= n * k; s++) {
      const t = s / n;
      c.lineTo(sx + (bx - sx) * t + Math.sin(t * 6 + i * 2) * 30 * (1 - t), sy + (by - sy) * t + Math.cos(t * 5 + i) * 40 * (1 - t));
    }
    c.stroke();
  });
  c.strokeStyle = ICE;
  c.lineWidth = 3;
  c.beginPath();
  c.arc(bx, by, 16 + 2 * Math.sin(f / 6), 0, Math.PI * 2);
  c.stroke();
  txt(c, "BOREALIS", bx - 50, by - 26, 16, ICE, 1, 600);
};
export const skyline = (c: Ctx, x: number, y: number, w: number, h: number, win: boolean, k: number) => {
  // a cidade e a Cidadela: de pé (vermelha) ou partida (com o λ)
  c.fillStyle = "rgba(20,26,30,1)";
  for (let i = 0; i < 9; i++) {
    const bw = w / 11, bh = 40 + ((i * 53) % 70);
    c.fillRect(x + 20 + i * (bw + 4), y + h - 20 - bh, bw, bh);
  }
  const cx = x + w / 2;
  c.fillStyle = win ? "rgba(70,80,86,1)" : "rgba(130,30,24,1)";
  c.beginPath();
  if (win) {
    c.moveTo(cx - 30, y + h - 20);
    c.lineTo(cx - 14, y + h - 140 * k - 20);
    c.lineTo(cx + 4, y + h - 110 * k - 20);
    c.lineTo(cx + 30, y + h - 20);
  } else {
    c.moveTo(cx - 36, y + h - 20);
    c.lineTo(cx - 8, y + 30);
    c.lineTo(cx + 8, y + 30);
    c.lineTo(cx + 36, y + h - 20);
  }
  c.fill();
  if (win) {
    font(c, 70, 700);
    c.fillStyle = ORANGE;
    c.globalAlpha = k;
    c.fillText("λ", cx + 50, y + 90);
    c.globalAlpha = 1;
  } else {
    c.fillStyle = RED;
    c.globalAlpha = 0.5 + 0.5 * Math.sin(k * 20);
    c.fillRect(cx - 4, y + 40, 8, 8);
    c.globalAlpha = 1;
  }
};
// 30/10 (ele: em "versões da própria vida, de outras linhas, outras escolhas, outros futuros" a tela ficava preta até
// "chegando ao Borealis"): antes da grade, a ramificação. A Alyx na origem, as linhas saindo dela, os nós das escolhas
// acendendo, e na ponta de cada linha uma versão dela; em "viu versões de si mesma" tudo se recolhe na grade de quatro
let introCv: HTMLCanvasElement | null = null;
const BR_COLS = [ORANGE, ICE, GREEN, RED, ICE, AMB, RED];
const versionsIntro = (c: Ctx, f: number, im: Im, versAt: number, linesAt: number, choicesAt: number, futAt: number) => {
  c.fillStyle = "#04080b";
  c.fillRect(0, 50, CW, CH - 50);
  const ox = 250, oy = 380;
  badge(c, im, 70, 250, 140, "A. VANCE", ORANGE, null, P(f, versAt - 10, 12));
  const N = BR_COLS.length;
  for (let k = 0; k < N; k++) {
    const ey = 120 + k * 80;
    const fy = oy + (ey - oy) * 0.45;
    const g = P(f, versAt + k * 4, 22);
    if (g <= 0) continue;
    const col = BR_COLS[k];
    // origem → nó da escolha → ponta (desenhada até onde cresceu)
    const pts: [number, number][] = [[ox, oy], [560, fy], [880, ey], [1080, ey]];
    const segs = [0, 0.35, 0.75, 1];
    c.strokeStyle = col;
    c.globalAlpha = 0.75;
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(ox, oy);
    for (let i = 1; i < pts.length; i++) {
      const a = segs[i - 1], b = segs[i];
      if (g <= a) break;
      const t = Math.min(1, (g - a) / (b - a));
      c.lineTo(pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t);
    }
    c.stroke();
    c.globalAlpha = 1;
    // o nó da escolha (acende em "outras escolhas")
    if (g > 0.35) {
      const ch = P(f, choicesAt + k * 2, 10);
      c.fillStyle = ch > 0 ? col : "rgba(242,240,247,0.4)";
      c.beginPath();
      c.arc(560, fy, 7 + 5 * ch, 0, Math.PI * 2);
      c.fill();
      if (ch > 0 && ch < 1) {
        c.strokeStyle = col;
        c.globalAlpha = 1 - ch;
        c.lineWidth = 2;
        c.beginPath();
        c.arc(560, fy, 10 + 30 * ch, 0, Math.PI * 2);
        c.stroke();
        c.globalAlpha = 1;
      }
    }
    // a versão dela na ponta (fraca até "outros futuros", depois acesa)
    if (g >= 1) {
      const fu = P(f, futAt + k * 3, 10);
      const img = im["hl3silh/alyx_badge.jpg"];
      const w = 52, h = 64, x = 1092, y = ey - h / 2;
      c.globalAlpha = 0.3 + 0.7 * fu;
      c.fillStyle = "#0b0d10";
      c.fillRect(x - 3, y - 3, w + 6, h + 6);
      if (img && img.width) {
        const sc = Math.max(w / img.width, h / img.height);
        c.save();
        c.beginPath();
        c.rect(x, y, w, h);
        c.clip();
        c.drawImage(img, x + (w - img.width * sc) / 2, y + (h - img.height * sc) * 0.22, img.width * sc, img.height * sc);
        c.globalCompositeOperation = "color";
        c.fillStyle = col;
        c.fillRect(x, y, w, h);
        c.globalCompositeOperation = "source-over";
        c.restore();
      }
      c.strokeStyle = col;
      c.lineWidth = 2;
      c.strokeRect(x - 3, y - 3, w + 6, h + 6);
      c.globalAlpha = 1;
      txt(c, `LINHA ${[17, 203, 58, 9, 112, 31, 77][k]}`, 1160, ey + 6, 16, col, 0.4 + 0.6 * fu);
    }
  }
  // as três palavras da fala, em fila embaixo
  ([[linesAt, "OUTRAS LINHAS"], [choicesAt, "OUTRAS ESCOLHAS"], [futAt, "OUTROS FUTUROS"]] as [number, string][]).forEach(([t, w], i) => {
    const k = P(f, t, 8);
    if (k <= 0) return;
    boxed(c, 300 + i * 300, 650, 270, 50, ICE, k, "rgba(6,16,22,0.9)");
    txt(c, w, 318 + i * 300, 684, 22, ICE, k, 600);
  });
};
const drawVersions = (p: PR): Draw => {
  const [versAt, sawAt, winAt, loseAt, closeAt] = ["versAt", "sawAt", "winAt", "loseAt", "closeAt"].map((k) => at(p, k));
  const linesAt = Math.min(at(p, "otherLinesAt"), versAt + 76), choicesAt = Math.min(at(p, "otherChoicesAt"), versAt + 106), futAt = Math.min(at(p, "otherFutAt"), versAt + 140);
  return (c, f, im) => {
    const intro = 1 - P(f, sawAt - 14, 14);
    screenBg(c, intro > 0.5 ? "VERSÕES DA PRÓPRIA VIDA · ∞" : "VERSÕES DA PRÓPRIA VIDA · 4 DE ∞");
    if (intro >= 1) {
      versionsIntro(c, f, im, versAt, linesAt, choicesAt, futAt);
      scan(c, f);
      return;
    }
    const cells: [number, number][] = [[40, 90], [650, 90], [40, 400], [650, 400]];
    const W = 590, H = 290;
    const cues = [sawAt, winAt, loseAt, closeAt];
    const titles = ["CHEGANDO AO BOREALIS · OUTROS CAMINHOS", "A HUMANIDADE VENCE", "A HUMANIDADE PERDE", "MAIS PRÓXIMA DOS COMBINE · DA UNION"];
    const cols = [ORANGE, GREEN, RED, RED];
    cells.forEach(([x, y], i) => {
      const k = P(f, cues[i], 14);
      c.fillStyle = "rgba(4,10,14,0.9)";
      c.fillRect(x, y, W, H);
      c.strokeStyle = k > 0 ? cols[i] : "rgba(159,230,255,0.2)";
      c.lineWidth = 3;
      c.strokeRect(x, y, W, H);
      txt(c, `LINHA ${[17, 203, 58, 9][i]}`, x + 14, y + 30, 18, "rgba(242,240,247,0.5)", f >= versAt ? 1 : 0);
      if (k <= 0) {
        // ainda sem sinal: chuvisco
        for (let s = 0; s < 40; s++) {
          c.fillStyle = `rgba(200,220,230,${0.04 + 0.06 * (((s * 31 + f * 7) % 13) / 13)})`;
          c.fillRect(x + ((s * 97 + f * 13) % W), y + ((s * 53 + f * 29) % H), 30, 2);
        }
        return;
      }
      c.save();
      c.beginPath();
      c.rect(x, y, W, H);
      c.clip();
      c.globalAlpha = k;
      if (i === 0) miniRoute(c, x, y + 30, W, H - 40, P(f, sawAt, 50), f);
      if (i === 1) skyline(c, x, y + 20, W, H - 20, true, P(f, winAt, 30));
      if (i === 2) skyline(c, x, y + 20, W, H - 20, false, P(f, loseAt, 30));
      if (i === 3) {
        badge(c, im, x + 40, y + 46, 150, "A. VANCE", RED, null);
        txt(c, "COLABORADORA", x + 230, y + 120, 30, RED, 1, 700);
        txt(c, "NÍVEL · ADVISOR", x + 230, y + 162, 22, "rgba(242,240,247,0.7)", 1);
        const cb = im["hl3silh/combine_badge.jpg"];
        if (cb && cb.width) c.drawImage(cb, x + 430, y + 190, 120, 80);
      }
      c.globalAlpha = 1;
      c.restore();
      boxed(c, x, y + H - 46, W, 46, cols[i], k, "rgba(4,10,14,0.92)");
      txt(c, titles[i], x + 16, y + H - 15, 20, cols[i], k, 600);
    });
    if (intro > 0) {
      // a ramificação some por cima da grade (desenhada à parte, porque cada texto mexe no globalAlpha)
      if (!introCv) { introCv = document.createElement("canvas"); introCv.width = CW; introCv.height = CH; }
      const ic = introCv.getContext("2d")!;
      ic.globalAlpha = 1;
      ic.clearRect(0, 0, CW, CH);
      versionsIntro(ic, f, im, versAt, linesAt, choicesAt, futAt);
      c.globalAlpha = intro;
      c.drawImage(introCv, 0, 0);
      c.globalAlpha = 1;
    }
    scan(c, f);
  };
};

// 1:13:41 o padrão: todas as linhas, cada uma por um caminho, terminam no mesmo ponto
const drawPattern = (p: PR): Draw => {
  const [notAt, patAt, sameAt] = [at(p, "notAt"), at(p, "patAt"), at(p, "sameAt")];
  return (c, f) => {
    screenBg(c, "O PADRÃO");
    txt(c, "TODAS VIRAM A MESMA PESSOA", 60, 130, 30, "rgba(242,240,247,0.7)", P(f, notAt, 8));
    strike(c, 60, 130, 500, P(f, notAt + 24, 8));
    const k = P(f, patAt, 60);
    const end: [number, number] = [1080, 400];
    for (let i = 0; i < 12; i++) {
      const sy = 190 + i * 38;
      const diff = Math.sin(i * 2.7) * 70;
      const same = P(f, sameAt, 40);
      c.strokeStyle = same > 0 ? `rgba(255,178,46,${0.4 + 0.5 * same})` : `rgba(159,230,255,${0.3 + 0.04 * i})`;
      c.lineWidth = same > 0 ? 4.5 : 3.5;
      c.beginPath();
      c.moveTo(60, sy);
      const n = 40;
      for (let s = 1; s <= n * k; s++) {
        const t = s / n;
        const x = 60 + (end[0] - 60) * t;
        const y = sy + (end[1] - sy) * Math.pow(t, 1.6) + diff * Math.sin(t * Math.PI) * (1 - t);
        c.lineTo(x, y);
      }
      c.stroke();
      // o que MUDA de uma linha para outra: marcas diferentes no meio de cada uma
      if (k > 0.5) {
        const t = 0.35 + 0.25 * ((i * 0.37) % 1);
        const x = 60 + (end[0] - 60) * t;
        const y = sy + (end[1] - sy) * Math.pow(t, 1.6) + diff * Math.sin(t * Math.PI) * (1 - t);
        c.fillStyle = i % 3 ? ICE : RED;
        c.fillRect(x - 8, y - 8, 16, 16);
      }
    }
    if (k > 0.95) {
      c.strokeStyle = AMB;
      c.lineWidth = 4;
      c.beginPath();
      c.arc(end[0], end[1], 26 + 3 * Math.sin(f / 5), 0, Math.PI * 2);
      c.stroke();
      txt(c, "BOREALIS", end[0] - 80, end[1] - 48, 30, AMB, 1, 700);
    }
    txt(c, "O QUE MUDA DE UMA LINHA PARA OUTRA", 60, 650, 22, ICE, P(f, patAt + 30, 10));
    txt(c, "O QUE LEVA TUDO AO MESMO PONTO", 640, 650, 22, AMB, P(f, sameAt, 10), 700);
    scan(c, f);
  };
};

// 1:13:56 a agente construída: a versão funcional, a missão, as memórias trancadas, a original devolvida
const drawBuilt = (p: PR): Draw => {
  const [buildAt, missAt, piecesAt, catAt, lockAt, origAt] = ["buildAt", "missAt", "piecesAt", "catAt", "lockAt", "origAt"].map((k) => at(p, k));
  return (c, f, im) => {
    const orig = P(f, origAt, 14);
    screenBg(c, orig > 0.5 ? "A. VANCE · DEVOLVIDA" : "A AGENTE · VERSÃO FUNCIONAL", orig > 0.5 ? ORANGE : "#6ec3ff");
    badge(c, im, 70, 110, 320, orig > 0.5 ? "ALYX" : "A AGENTE", orig > 0.5 ? ORANGE : "#6ec3ff", orig > 0.5 ? null : "blue", P(f, buildAt, 12));
    boxed(c, 450, 110, 770, 300, "#6ec3ff", P(f, missAt, 10));
    txt(c, "MISSÃO", 476, 156, 22, "#6ec3ff", P(f, missAt + 2, 8), 600);
    txt(c, "› LEVAR AS PEÇAS CERTAS ATÉ O BOREALIS", 476, 206, 26, "#f2f0f7", P(f, missAt + 6, 12));
    // as peças: Gordon, Eli, o Borealis
    const pk = P(f, piecesAt, 12);
    if (pk > 0) {
      const g = im["hl3silh/gordon_retrato.png"], el = im["hl3silh/eli_retrato.png"];
      c.globalAlpha = pk;
      [g, el].forEach((img, i) => {
        if (img && img.width) c.drawImage(img, 500 + i * 120, 236, 96, 96);
        c.strokeStyle = AMB;
        c.lineWidth = 3;
        c.strokeRect(500 + i * 120, 236, 96, 96);
      });
      c.strokeStyle = ICE;
      c.strokeRect(740, 236, 96, 96);
      txt(c, "BOREALIS", 744, 290, 16, ICE, 1, 600);
      c.globalAlpha = 1;
    }
    txt(c, "› O PROCEDIMENTO ATÉ O CATALISADOR", 476, 380, 26, "#f2f0f7", P(f, catAt, 12));
    // as memórias trancadas
    const lk = P(f, lockAt, 10);
    if (lk > 0) {
      boxed(c, 450, 440, 770, 110, ICE, lk);
      lockIcon(c, 510, 505, 60, ICE);
      txt(c, "ESSAS MEMÓRIAS · BLOQUEADAS", 570, 508, 28, ICE, P(f, lockAt + 4, 10), 600);
    }
    txt(c, "A ALYX ORIGINAL VOLTOU", 450, 630, 40, ORANGE, orig, 700);
    scan(c, f);
  };
};

// 1:14:15 a função esperando o gatilho; o ritual trazendo de volta; os lapsos de coisas que nunca aconteceram com ela
const drawTrigger = (p: PR): Draw => {
  const [funcAt, ritAt, lapsAt, neverAt] = ["funcAt", "ritAt", "lapsAt", "neverAt"].map((k) => at(p, k));
  return (c, f, im) => {
    screenBg(c, "A. VANCE · DUAS CAMADAS");
    badge(c, im, 70, 110, 320, "ALYX", ORANGE);
    // a camada da agente, adormecida (pulsando fraco) por baixo
    const pul = 0.25 + 0.15 * Math.sin(f / 9);
    c.save();
    c.beginPath();
    c.rect(70, 110, 320, 400);
    c.clip();
    badge(c, im, 70, 110, 320, "", "#6ec3ff", "blue", pul * P(f, funcAt, 10));
    c.restore();
    c.globalAlpha = 1;
    txt(c, "A FUNÇÃO CONTINUAVA DENTRO DELA", 470, 160, 28, "#6ec3ff", P(f, funcAt, 10), 600);
    txt(c, "ESPERANDO O GATILHO", 470, 204, 28, "#f2f0f7", P(f, funcAt + 10, 10));
    const rk = P(f, ritAt, 12);
    if (rk > 0) {
      // o ritual: o anel verde em volta do crachá
      c.strokeStyle = GREEN;
      c.lineWidth = 3;
      c.globalAlpha = rk;
      c.beginPath();
      c.ellipse(230, 330, 230, 270, 0, 0, Math.PI * 2 * rk);
      c.stroke();
      c.globalAlpha = 1;
      txt(c, "O RITUAL TRAZ DE VOLTA", 470, 280, 28, GREEN, P(f, ritAt + 6, 10), 600);
      txt(c, "O QUE O G-MAN SEPAROU", 470, 316, 28, GREEN, P(f, ritAt + 14, 10), 600);
    }
    txt(c, "OS LAPSOS NÃO ERAM LEMBRANÇAS ANTIGAS", 470, 370, 26, AMB, P(f, lapsAt, 10), 600);
    const nk = P(f, neverAt, 10);
    if (nk > 0) {
      txt(c, "ERAM DE COISAS QUE NUNCA ACONTECERAM COM ELA", 450, 404, 22, "#f2f0f7", nk);
      // fragmentos das outras linhas piscando
      for (let i = 0; i < 4; i++) {
        const on = ((Math.floor(f / 7) + i * 3) % 5) < 3;
        const x = 450 + i * 190, y = 440;
        c.globalAlpha = nk * (on ? 0.95 : 0.25);
        c.fillStyle = "rgba(4,10,14,0.9)";
        c.fillRect(x, y, 170, 120);
        c.strokeStyle = [ORANGE, GREEN, RED, RED][i];
        c.lineWidth = 2;
        c.strokeRect(x, y, 170, 120);
        if (i === 0) miniRoute(c, x, y + 10, 170, 100, 1, f);
        if (i === 1) skyline(c, x, y, 170, 120, true, 1);
        if (i === 2) skyline(c, x, y, 170, 120, false, 1);
        if (i === 3) badge(c, im, x + 50, y + 8, 64, "", RED);
        txt(c, `LINHA ${[17, 203, 58, 9][i]}`, x + 8, y + 140, 16, "rgba(242,240,247,0.6)", 1);
        c.globalAlpha = 1;
      }
    }
    scan(c, f);
  };
};

// 1:14:34 o salto: as três coisas convergem numa pessoa só
// 30/10 (ele: a passagem para "o G-Man esperava acordar a agente" ficava bugada — os crachás continuavam por cima dos
// quadros e sumiam de uma vez, porque o badge() reescreve o globalAlpha): agora é um movimento só. A pessoa única desliza
// para o quadro da esquerda e ganha a tinta azul da agente (ESPERADO); em "acordou" o quadro da direita acende com a
// Alyx sem tinta (A ALYX INTEIRA); em "erro" o carimbo cai embaixo dos dois
const drawThree = (p: PR): Draw => {
  const [jumpAt, threeAt, expAt, wokeAt, errAt] = ["jumpAt", "threeAt", "expAt", "wokeAt", "errAt"].map((k) => at(p, k));
  const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
  return (c, f, im) => {
    const m = P(f, threeAt, 40);
    const tr = interpolate(f, [expAt, expAt + 18], [0, 1], { ...C, easing: Easing.inOut(Easing.cubic) });
    screenBg(c, tr > 0.5 ? "O PLANO DO G-MAN" : "O GRANDE SALTO · TUDO VOLTOU", tr > 0.5 ? RED : AMB, tr > 0.5);
    // os dois quadros (entram junto com o deslize)
    const BX = [80, 680], BY = 110, BW = 520, BH = 450;
    if (tr > 0) {
      boxed(c, BX[0], BY, BW, BH, "#6ec3ff", tr, "rgba(6,16,22,0.85)");
      const w = P(f, wokeAt, 10);
      if (w <= 0) {
        // o da direita ainda vazio: só o contorno, esperando
        c.globalAlpha = tr * 0.5;
        c.setLineDash([10, 8]);
        c.strokeStyle = "rgba(242,240,247,0.5)";
        c.lineWidth = 2;
        c.strokeRect(BX[1], BY, BW, BH);
        c.setLineDash([]);
        c.globalAlpha = 1;
      } else boxed(c, BX[1], BY, BW, BH, ORANGE, w, "rgba(14,10,4,0.85)");
    }
    if (tr < 1) {
      // os três crachás convergindo (antes do deslize)
      const L: [string, string, null | "blue" | "amber"][] = [["A ORIGINAL", ORANGE, null], ["AS VIDAS", AMB, "amber"], ["A AGENTE", "#6ec3ff", "blue"]];
      L.forEach(([lab, col, tint], i) => {
        if (i === 0) return;
        const k = P(f, jumpAt + i * 20, 14);
        const x0 = 110 + i * 380, x = x0 + (490 - x0) * m;
        const o = k * (m > 0.95 ? 0 : 1) * (1 - m * 0.5) * (1 - tr);
        if (o > 0) badge(c, im, x, 120, 300, lab, col, tint, o);
      });
      if (m > 0.6) txt(c, "UMA ÚNICA PESSOA", 470, 650, 40, CREAM, Math.min(P(f, threeAt + 30, 10), 1 - tr * 2), 700);
    }
    // a pessoa única: do centro para o quadro da esquerda, ganhando a tinta da agente
    {
      const k0 = P(f, jumpAt, 14);
      const x0 = 110 + (490 - 110) * m;
      const bx = lerp(x0, BX[0] + 36, tr), by = lerp(120, BY + 60, tr), bw = lerp(300, 180, tr);
      badge(c, im, bx, by, bw, tr > 0.5 ? "A AGENTE" : "A ORIGINAL", tr > 0.5 ? "#6ec3ff" : ORANGE, null, k0);
      if (tr > 0) badge(c, im, bx, by, bw, tr > 0.5 ? "A AGENTE" : "A ORIGINAL", "#6ec3ff", "blue", tr);
    }
    if (tr > 0) {
      const k = P(f, expAt + 12, 10);
      txt(c, "ESPERADO", BX[0] + 250, BY + 90, 22, "rgba(242,240,247,0.6)", k);
      txt(c, "ACORDAR", BX[0] + 250, BY + 160, 38, "#6ec3ff", k, 700);
      txt(c, "A AGENTE", BX[0] + 250, BY + 210, 38, "#6ec3ff", k, 700);
      const w = P(f, wokeAt, 10);
      if (w > 0) {
        badge(c, im, BX[1] + 36 + 30 * (1 - w), BY + 60, 180, "A ALYX", ORANGE, null, w);
        txt(c, "ACORDOU", BX[1] + 250, BY + 90, 22, "rgba(242,240,247,0.6)", w);
        txt(c, "A ALYX", BX[1] + 250, BY + 160, 38, ORANGE, P(f, wokeAt + 4, 10), 700);
        txt(c, "INTEIRA", BX[1] + 250, BY + 210, 38, ORANGE, P(f, wokeAt + 8, 10), 700);
        const fl = 1 - P(f, wokeAt, 10);
        if (fl > 0) {
          c.globalAlpha = fl * 0.45;
          c.fillStyle = "#fff2dc";
          c.fillRect(BX[1], BY, BW, BH);
          c.globalAlpha = 1;
        }
      }
      const e2 = P(f, errAt, 8);
      if (e2 > 0) {
        c.save();
        c.translate(640, 628);
        c.rotate(-0.04);
        c.scale(1.25 - 0.25 * e2, 1.25 - 0.25 * e2);
        c.globalAlpha = e2;
        c.fillStyle = "rgba(20,4,4,0.92)";
        c.fillRect(-250, -48, 500, 96);
        c.strokeStyle = RED;
        c.lineWidth = 6;
        c.strokeRect(-250, -48, 500, 96);
        font(c, 56, 800);
        c.fillStyle = RED;
        c.textAlign = "center";
        c.fillText("O ERRO DELE", 0, 20);
        c.textAlign = "left";
        c.restore();
        c.globalAlpha = 1;
      }
    }
    scan(c, f);
  };
};

// 1:14:57 ela interpretou o papel: o canal Overwatch com o que ela entregou — e o pacote que nunca fecha
const drawRole = (p: PR): Draw => {
  const [knewAt, roleAt, outAt, warAt, routesAt, calcAt, neverAllAt] = ["knewAt", "roleAt", "outAt", "warAt", "routesAt", "calcAt", "neverAllAt"].map((k) => at(p, k));
  return (c, f) => {
    screenBg(c, "OVERWATCH · CANAL DOS ADVISORS", RED);
    txt(c, "ELA SABIA COMO A AGENTE DEVIA AGIR", 60, 130, 24, "#f2f0f7", P(f, knewAt, 10));
    txt(c, "O QUE OS ADVISORS ESPERAVAM · O QUE O G-MAN ESPERAVA", 60, 168, 20, "rgba(242,240,247,0.7)", P(f, knewAt + 30, 10));
    const rk = P(f, roleAt, 10);
    boxed(c, 60, 196, 520, 60, ORANGE, rk);
    txt(c, "INTERPRETOU O PAPEL", 84, 236, 28, ORANGE, rk, 700);
    const rows: [number, string][] = [[outAt, "A. VANCE · SAÍDA DO BOREALIS · COM OS ADVISORS"], [warAt, "COORDENAÇÃO DA GUERRA · ACEITA"], [routesAt, "ROTAS · ENVIADAS"], [calcAt, "CÁLCULOS · ENVIADOS"]];
    rows.forEach(([t, s], i) => {
      const k = P(f, t, 8);
      txt(c, s, 60, 320 + i * 54, 24, "#f2f0f7", k);
      txt(c, "OK", 1160, 320 + i * 54, 24, GREEN, P(f, t + 10, 6), 700);
    });
    const nk = P(f, neverAllAt, 10);
    const pct = Math.min(85, interpolate(f, [outAt, calcAt + 30], [10, 85], C));
    if (f >= outAt) {
      txt(c, "PACOTE COMPLETO DO PROCEDIMENTO", 60, 560, 20, "rgba(242,240,247,0.6)", 1);
      c.strokeStyle = "rgba(242,240,247,0.4)";
      c.lineWidth = 2;
      c.strokeRect(60, 580, 1160, 30);
      c.fillStyle = nk > 0 ? AMB : ICE;
      c.fillRect(62, 582, 1156 * (pct / 100), 26);
      txt(c, `${Math.round(pct)}%`, 60, 650, 26, nk > 0 ? AMB : "#f2f0f7", 1, 700);
      txt(c, "NUNCA ENTREGOU TUDO", 760, 650, 32, AMB, nk, 700);
    }
    scan(c, f);
  };
};

// ------------------------------------------------------------------------------------------------ a cena
// baias livres do corredor (hall2 tem o quadro elétrico à esquerda em y ≡ 4,5 e a válvula à direita em y ≡ 1,5 (mód 6)
// + 6): esquerda em y ≡ 1,5 (mód 6), direita em y ≡ 4,5 (mód 6)
const bayY = (i: number) => 7.5 + i * 3; // i par → esquerda (7,5 13,5 …) · i ímpar → direita (10,5 16,5 …)
const sideOf = (i: number) => (i % 2 ? 1 : -1);
const SCR_W = 2.3, SCR_H = 1.29, SCR_Z = 1.52;
const PARTS = {
  agent: (p: PR): Stop[] => [{ from: 0, draw: drawAgent(p) }],
  block: (p: PR): Stop[] => [{ from: 0, draw: drawBlock(p) }],
  lines: (p: PR): Stop[] => [
    { from: 0, draw: drawLinear(p) },
    { from: at(p, "versAt") - 20, draw: drawVersions(p) },
    { from: at(p, "notAt") - 20, draw: drawPattern(p) },
    { from: at(p, "buildAt") - 20, draw: drawBuilt(p) },
  ],
  three: (p: PR): Stop[] => [
    { from: 0, draw: drawTrigger(p) },
    { from: at(p, "jumpAt") - 20, draw: drawThree(p) },
    { from: at(p, "knewAt") - 20, draw: drawRole(p) },
  ],
};
type Part = keyof typeof PARTS;
const buildPanels = (n: number): XF2 => {
  const g = mk();
  for (let i = 0; i < n; i++) {
    const s = sideOf(i), y = bayY(i), x = s * 2.2;
    // a carcaça da tela presa na parede (moldura grossa, parafusos, cabo descendo)
    g.box(s > 0 ? x - 0.1 : x, y - SCR_W / 2 - 0.1, SCR_Z - SCR_H / 2 - 0.1, 0.1, SCR_W + 0.2, SCR_H + 0.2, [30, 34, 38]);
    g.box(s > 0 ? x - 0.12 : x + 0.1, y - SCR_W / 2 - 0.1, SCR_Z - SCR_H / 2 - 0.16, 0.02, SCR_W + 0.2, 0.06, [80, 220, 230], { emit: 0.5 });
    g.box(s > 0 ? x - 0.06 : x, y + SCR_W / 2 - 0.2, 0.35, 0.06, 0.06, SCR_Z - SCR_H / 2 - 0.45, [20, 22, 24]);
  }
  return g.F;
};
type XF2 = ReturnType<typeof mk>["F"];
// 12/10 (pedido dele: entrava de fade e a tela aparecia do nada): UM corredor só para as quatro cenas, continuando de onde
// a corrida (HL10Hand) parou — y ≈ 19,5. Todas as nove telas já estão na parede desde o começo (apagadas até a vez delas;
// as já vistas ficam em espera com o título); a câmera continua de onde a cena anterior parou e só vira na hora.
const PART_ORDER: Part[] = ["agent", "block", "lines", "three"];
const PART_N: Record<Part, number> = { agent: 1, block: 1, lines: 4, three: 3 };
const TOTAL = 9;
const TITLES = ["A. VANCE · ANÁLISE", "ALYX · SINAIS", "LINHA DO TEMPO", "VERSÕES DA PRÓPRIA VIDA", "O PADRÃO", "A AGENTE", "DUAS CAMADAS", "O GRANDE SALTO", "OVERWATCH · O PAPEL"];
const OFF: Record<Part, number> = { agent: 0, block: 1, lines: 2, three: 6 };
const BAY0 = 25.5;
const gBayY = (j: number) => BAY0 + j * 3;
const gStopY = (j: number) => gBayY(j) - 1.7;
const HAND_END_Y = 19.5;
export const HALL_V = 0.085; // m por quadro na corrida
const AGENT_ARRIVE = Math.round((2 * (BAY0 - 1.7 - HAND_END_Y)) / HALL_V); // ease-out que começa na velocidade da corrida
// 30/10 (ele: corte seco entre o "lado a lado" e a agente, as telas surgindo do nada): o corredor da corrida do HL10Hand
// agora É este (fo < 0 = antes da cena): as mesmas telas nas paredes, a mesma câmera andando em velocidade constante, e
// ela só desacelera depois do corte, até a primeira tela
export const HL10MindRun: React.FC<{ p: PR; part: Part; fo?: number; preMsg?: string; preSub?: string }> = ({ p, part, fo, preMsg, preSub }) => {
  const f = useCurrentFrame() + (fo ?? 0);
  const life = p.life;
  const stops = useMemo(() => PARTS[part](p), [part]); // eslint-disable-line react-hooks/exhaustive-deps
  const off = OFF[part];
  const im = useImgs();
  const G = useMemo(() => {
    const g = mk();
    const B = buildPanels(TOTAL);
    // os painéis foram montados em bayY(i) = 7,5 + 3i; aqui o mesmo, deslocado para BAY0
    const dy = BAY0 - 7.5;
    B.forEach((fc) => g.F.push({ ...fc, p: fc.p.map((q) => [q[0], q[1] + dy, q[2]] as [number, number, number]) }));
    return buildShipHall2(BAY0 + TOTAL * 3 + 18).concat(g.F);
  }, []);
  const scr = useMemo(
    () =>
      Array.from({ length: TOTAL }).map((_, j) => {
        const cv = document.createElement("canvas");
        cv.width = CW;
        cv.height = CH;
        const tex = new THREE.CanvasTexture(cv);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 8;
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(SCR_W, SCR_H), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
        const s = sideOf(j);
        mesh.position.set(s * (2.2 - 0.105), SCR_Z, -gBayY(j));
        mesh.rotation.y = s > 0 ? -Math.PI / 2 : Math.PI / 2;
        return { cv, tex, mesh };
      }),
    [],
  );
  const lastDraw = useRef<number[]>([]);
  if (im)
    scr.forEach(({ cv, tex }, j) => {
      const local = j - off;
      const st = local >= 0 && local < stops.length ? stops[local] : null;
      const on = st && f >= 0 && f >= st.from - 30;
      const key = on ? f : -1 - (j < off ? 1 : 0);
      if (lastDraw.current[j] === key) return;
      lastDraw.current[j] = key;
      const c = cv.getContext("2d")!;
      c.globalAlpha = 1;
      if (on && st) st.draw(c, f, im);
      else {
        // apagada / em espera: a marca do terminal (as já vistas mostram o título)
        c.fillStyle = "#04080b";
        c.fillRect(0, 0, CW, CH);
        txt(c, `BOREALIS · TERMINAL ${String(12 + j).padStart(2, "0")}`, 40, 60, 24, "rgba(159,230,255,0.28)", 1);
        if (j < off || (st && local >= 0)) txt(c, j < off ? TITLES[j] + " · EM ESPERA" : "", 40, CH / 2, 40, "rgba(159,230,255,0.22)", 1, 600);
      }
      tex.needsUpdate = true;
    });
  // a câmera: começa onde a cena anterior parou (andando, se veio da corrida; virada para a última tela, se não)
  const yk: [number, number][] = [];
  const yawk: [number, number][] = [];
  if (part === "agent") {
    yk.push([0, HAND_END_Y]);
    yawk.push([0, 0.06]);
  } else {
    const pj = off - 1;
    yk.push([0, gStopY(pj) + 0.22]);
    yawk.push([0, sideOf(pj) * 1.02]);
    yawk.push([8, sideOf(pj) * 1.02]);
  }
  stops.forEach((st, i) => {
    const j = off + i;
    const arrive = Math.max(st.from, i ? 0 : part === "agent" ? AGENT_ARRIVE : 46);
    const leave = i < stops.length - 1 ? stops[i + 1].from - 44 : life + 60;
    yk.push([arrive, gStopY(j)]);
    yk.push([Math.max(arrive + 1, leave), gStopY(j) + 0.25]);
    const tw = sideOf(j) * 1.02;
    if (!(i === 0 && part !== "agent")) yawk.push([arrive - 14, 0.0]);
    else yawk.push([Math.max(10, arrive - 30), 0.0]);
    yawk.push([arrive + 10, tw]);
    yawk.push([Math.max(arrive + 11, leave - 6), tw]);
    if (i < stops.length - 1) yawk.push([leave + 14, 0]);
  });
  yk.sort((a, b) => a[0] - b[0]);
  yawk.sort((a, b) => a[0] - b[0]);
  // agent: chega da corrida em velocidade constante e desacelera (ease-out) até a primeira tela, sem parar no corte
  const yAt = (t: number) =>
    part !== "agent" ? keys(t, yk) : t < 0 ? Math.max(1, HAND_END_Y + HALL_V * t) : t < AGENT_ARRIVE ? HAND_END_Y + (gStopY(0) - HAND_END_Y) * (1 - (1 - t / AGENT_ARRIVE) ** 2) : keys(t, yk);
  const y = yAt(f);
  const moving = Math.abs(yAt(f + 1) - y) > 0.004;
  const e: Eye = { x: 0.12 * Math.sin(f / 23), y, z: 1.65 + (moving ? Math.abs(Math.sin(f / 4.5)) * 0.04 : 0.01 * Math.sin(f / 40)), yaw: keys(f, yawk) + 0.015 * Math.sin(f / 37), pitch: -0.04, F: 960 };
  const lamps: XL[] = Array.from({ length: 30 }).map((_, i) => 1.5 + i * 3).filter((ly) => ly > y - 4 && ly < y + 18).map((ly) => ({ x: 0, y: ly, z: 2.9, col: [255, 232, 196] as RGB, k: 1.0, r: 4.6 }));
  const glow = useMemo(() => scr.map(({ mesh }) => {
    const l = new THREE.PointLight("#9fe6ff", 3, 3.5, 1.5);
    l.position.copy(mesh.position).add(new THREE.Vector3(-Math.sign(mesh.position.x) * 0.5, 0, 0));
    return l;
  }), [scr]);
  const ay = y + 2.6;
  // só a última parte fecha em preto (depois vem a regra 13); entre as partes o corredor continua
  const fadeOut = part === "three" ? interpolate(f, [life - 6, life], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 0;
  return (
    <AbsoluteFill style={{ background: "#020304", overflow: "hidden" }}>
      <XView e={e} faces={G} lights={lamps} flash={0.35} amb={0.13} seam="rgba(0,0,0,0.18)" gl smooth extras={scr.map((s) => s.mesh)} glLights={glow} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <FlagAt e={e} pt={[0.55, ay, 0]} label="ALYX" col={ORANGE} f={f} sub={f < 0 && preSub ? preSub : moving ? "ANDANDO · FALANDO" : "FALANDO"} />
      </svg>
      <Hud f={f} yaw={e.yaw} eye={e} blips={[{ x: 0.55, y: ay }]} msg={f < 0 ? preMsg : undefined} msgCol={AMB} />
      <AbsoluteFill style={{ background: "#000", opacity: fadeOut, pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};
void fadeIO;
void PART_ORDER;
void PART_N;
void CREAM;
// as quatro cenas do edit.json (mesmos tempos) apontam para a corrida
export const HL10AgentRun: React.FC<PR> = (p) => <HL10MindRun p={p} part="agent" />;
export const HL10BlockRun: React.FC<PR> = (p) => <HL10MindRun p={p} part="block" />;
export const HL10LinesRun: React.FC<PR> = (p) => <HL10MindRun p={p} part="lines" />;
export const HL10ThreeRun: React.FC<PR> = (p) => <HL10MindRun p={p} part="three" />;
