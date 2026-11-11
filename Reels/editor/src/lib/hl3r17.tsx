// HL3 · 1:36:38 o tempo corre (13/10)
// Pedido dele: dois minutos parados num Borealis invisível enquanto a fala conta outra coisa. Refeito na linguagem da
// malha holográfica (aprovada): a linha do tempo é um vale de linhas por onde a câmera avança sem parar, e cada coisa
// que a narração conta SURGE do chão na hora em que é dita — as armas esmagadas, o véu fechando sobre o navio, os
// códigos afundando no gelo, a cidade crescendo, a célula do Varga se espalhando em vermelho, os arquivos virando
// escritura, o Varga apagando, Eli e Barney envelhecendo, a estátua da Alyx com o Dog, a cidade virando Combine, os
// rostos virando máscaras e o véu caindo. O ano corre no alto.
import React from "react";
import { AbsoluteFill, Easing, interpolate, staticFile, useCurrentFrame } from "remotion";
import { MONO } from "./overlays";
import { C } from "./hl3";
import { FilmLook } from "./hl3r";
import { borealisEdges } from "./hl3r9s";

type PR = Record<string, number> & { life: number };
type V3 = [number, number, number];
const at = (p: PR, k: string) => Math.round((p[k] as number | undefined) ?? 1e6);
const P = (f: number, t: number, d = 12) => interpolate(f, [t, t + d], [0, 1], { ...C, easing: Easing.out(Easing.cubic) });
const rnd = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const TEAL = "#5ff3d0";
const ICE = "#9fe6ff";
const RED = "#ff5d4d";
const CREAM = "#ffe2b0";
const AMB = "#ffb22e";
const GREEN = "#8dffa8";

const Hg = (x: number, z: number) => 0.7 * Math.sin(x * 0.18 + z * 0.05) + 0.4 * Math.sin(x * 0.41 - z * 0.13) + Math.max(0, (Math.abs(x) - 16) * 0.35);
// o navio em linhas (o mesmo modelo do Borealis), escalado para ~12 m
let SHIP: [V3, V3][] | null = null;
const ship = () => {
  if (SHIP) return SHIP;
  const s = 12 / 116;
  const all = borealisEdges();
  SHIP = all.filter((_, i) => i % 3 === 0).map(([ax, ay, az, bx, by, bz]) => [[ax * s, (ay + 8) * s, -az * s], [bx * s, (by + 8) * s, -bz * s]] as [V3, V3]);
  return SHIP;
};

export const HL13FutureScan: React.FC<PR & { events?: { k: string; c: string }[]; y0?: number; y1?: number }> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const E = Array.from({ length: 12 }).map((_, k) => at(p, `e${k}At`));
  const events = (p.events as unknown as { k: string; c: string }[]) ?? [];
  const y0 = (p.y0 as number) ?? 2032, y1 = (p.y1 as number) ?? 2190;
  // a câmera avança sempre; o passo acelera um pouco com os séculos
  const SPEED = 0.055;
  const camZ = f * SPEED + Math.max(0, f - E[8]) * 0.015;
  const camAt = (t: number) => t * SPEED + Math.max(0, t - E[8]) * 0.015;
  const camX = 1.2 * Math.sin(f / 180);
  const camY = 4.2 + 0.4 * Math.sin(f / 140);
  const yaw = 0.06 * Math.sin(f / 160);
  const pitch = 0.2;
  const FP = 1250;
  const pr = (x: number, y: number, z: number) => {
    const dx = x - camX, dz = z - camZ, dy = y - camY;
    const rx = dx * Math.cos(yaw) - dz * Math.sin(yaw);
    let rz = dx * Math.sin(yaw) + dz * Math.cos(yaw);
    const ry = dy * Math.cos(pitch) + rz * Math.sin(pitch);
    rz = rz * Math.cos(pitch) - dy * Math.sin(pitch);
    if (rz < 0.5) return null;
    return { x: 960 + (rx * FP) / rz, y: 540 - (ry * FP) / rz, d: rz };
  };
  const seg = (a: V3, b: V3, col: string, w: number, o: number, key: string) => {
    const A = pr(a[0], a[1], a[2]), B = pr(b[0], b[1], b[2]);
    return A && B ? <line key={key} x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke={col} strokeWidth={w} opacity={o} /> : null;
  };
  const els: React.ReactNode[] = [];
  // o vale de linhas
  const z0 = Math.floor(camZ);
  for (let zz = z0 + 70; zz > camZ + 1; zz -= 1.5) {
    const pts: string[] = [];
    for (let x = -34; x <= 34; x += 1.5) {
      const q = pr(x, Hg(x, zz), zz);
      if (q) pts.push(`${q.x.toFixed(1)},${q.y.toFixed(1)}`);
    }
    const far = zz - camZ;
    els.push(<polyline key={"g" + zz.toFixed(1)} points={pts.join(" ")} fill="none" stroke={TEAL} strokeWidth={far < 10 ? 1.4 : 1} opacity={Math.max(0.05, 0.55 - far / 90)} />);
  }
  const box = (c: V3, w: number, h: number, d: number, col: string, o: number, key: string) => {
    const [x, y, z] = c;
    const v: V3[] = [[x - w / 2, y, z - d / 2], [x + w / 2, y, z - d / 2], [x + w / 2, y, z + d / 2], [x - w / 2, y, z + d / 2]];
    const t = v.map((q) => [q[0], q[1] + h, q[2]] as V3);
    const out: React.ReactNode[] = [];
    for (let i = 0; i < 4; i++) {
      out.push(seg(v[i], v[(i + 1) % 4], col, 1.4, o, key + "b" + i));
      out.push(seg(t[i], t[(i + 1) % 4], col, 1.4, o, key + "t" + i));
      out.push(seg(v[i], t[i], col, 1.4, o, key + "v" + i));
    }
    return out;
  };
  // 30/10 (ele: o vale estava vazio, faltava mundo em volta, cidades, detalhe): o caminho vira uma estrada e, dos dois
  // lados, o mundo que envelhece junto: ruínas da guerra → a reconstrução (andaimes, janelas acesas) → arquitetura Combine
  // (torres finas, arestas azuis, antenas), casas, torres de energia com cabos, árvores que crescem, postes
  const rebuild = P(f, E[3], 150);
  const combK = P(f, E[9], 150);
  // a seita do Varga crescendo por dentro da sociedade nova (janelas vermelhas nos prédios, geração após geração)
  const sectAt = at(p, "sectAt"), genAt = at(p, "genAt"), findAt = at(p, "findAt");
  const sectK = P(f, sectAt, 120) * (1 - P(f, E[11] + 30, 40));
  const DIM = "rgba(150,190,185,0.55)";
  // a estrada
  for (let zz = Math.floor(camZ / 3) * 3 + 60; zz > camZ + 1; zz -= 3) {
    const far = zz - camZ;
    const o = Math.max(0.06, 0.6 - far / 80);
    els.push(seg([0, Hg(0, zz) + 0.02, zz], [0, Hg(0, zz + 1.4) + 0.02, zz + 1.4], CREAM, 1.6, o, "rd" + zz));
    [-1.7, 1.7].forEach((x, i) => els.push(seg([x, Hg(x, zz) + 0.02, zz], [x, Hg(x, zz + 3) + 0.02, zz + 3], ICE, 1.1, o * 0.8, `rs${i}_${zz}`)));
  }
  const TILE = 5;
  for (let n = Math.floor(camZ / TILE) + 13; n * TILE > camZ - 2; n--) {
    for (const side of [-1, 1]) {
      const id = n * 2 + (side > 0 ? 1 : 0);
      const z = n * TILE + rnd(id * 1.7) * 3;
      const far = z - camZ;
      if (far < 5) continue;
      const fo = Math.min(1, Math.max(0, (68 - far) / 18)) * Math.min(1, (far - 5) / 7);
      const kind = Math.floor(rnd(id * 3.3) * 6);
      const x = side * (4.5 + rnd(id * 5.1) * 11);
      const y = Hg(x, z);
      const key = "a" + id;
      if (kind <= 1) {
        // um prédio: ruína → reconstruído → Combine
        const H = 2.2 + rnd(id * 7.7) * 5;
        const W = 1.4 + rnd(id * 2.9) * 1.4;
        const h = H * (0.45 + 0.55 * rebuild) * (1 + 1.3 * combK);
        const w = W * (1 - 0.45 * combK);
        const col = combK > 0.5 ? "#7fd8ff" : rebuild > 0.5 ? CREAM : DIM;
        els.push(...box([x, y, z], w, h, w, col, 0.85 * fo, key));
        if (rebuild < 0.6) {
          // o topo quebrado da ruína
          const t = y + h;
          els.push(seg([x - w / 2, t, z], [x - w / 6, t + 0.7 * (1 - rebuild), z], DIM, 1.3, fo * (1 - rebuild), key + "q1"));
          els.push(seg([x - w / 6, t + 0.7 * (1 - rebuild), z], [x + w / 5, t + 0.2, z], DIM, 1.3, fo * (1 - rebuild), key + "q2"));
        }
        if (rebuild > 0.2 && combK < 0.6) {
          // janelas acesas
          for (let j = 0; j < 6; j++) {
            if (rnd(id * 13 + j) > 0.4 + 0.5 * Math.sin(f / 23 + j) * 0.2) continue;
            const q = pr(x + (j % 2 ? 0.25 : -0.25) * w, y + h * (0.2 + 0.13 * j), z - w / 2);
            if (q) els.push(<rect key={key + "w" + j} x={q.x - 2} y={q.y - 2} width={4} height={4} fill="#ffd27a" opacity={fo * rebuild * (1 - combK)} />);
          }
        }
        if (rebuild > 0.05 && rebuild < 0.95) {
          // andaime da reconstrução
          els.push(seg([x + w / 2 + 0.3, y, z], [x + w / 2 + 0.3, y + h * 0.9, z], AMB, 1, fo * 0.7, key + "an"));
          els.push(seg([x + w / 2 + 0.3, y + h * 0.5, z], [x + w / 2, y + h * 0.5, z], AMB, 1, fo * 0.7, key + "an2"));
        }
        if (combK > 0.3) els.push(seg([x, y + h, z], [x, y + h + 1.2 + rnd(id) * 1.5, z], "#cff6ff", 1.6, fo * combK, key + "ant"));
        if (sectK > 0 && rnd(id * 4.9) < 0.25 + 0.6 * sectK * P(f, genAt, 90)) {
          // por dentro: janelas vermelhas e a base marcada
          for (let j = 0; j < 4; j++) {
            const q = pr(x + (j % 2 ? 0.22 : -0.22) * w, y + h * (0.15 + 0.2 * j), z - w / 2);
            if (q) els.push(<rect key={key + "sw" + j} x={q.x - 2.5} y={q.y - 2.5} width={5} height={5} fill={RED} opacity={fo * sectK * (0.6 + 0.4 * Math.sin(f / 7 + j + id))} />);
          }
          els.push(seg([x - w / 2, y + 0.03, z - w / 2], [x + w / 2, y + 0.03, z - w / 2], RED, 2, fo * sectK, key + "sb"));
        }
      } else if (kind === 2) {
        // torre de energia com cabo até a próxima
        const H = 4.2;
        const col = combK > 0.5 ? "#7fd8ff" : ICE;
        els.push(seg([x - 0.6, y, z], [x, y + H, z], col, 1.2, 0.7 * fo, key + "p1"));
        els.push(seg([x + 0.6, y, z], [x, y + H, z], col, 1.2, 0.7 * fo, key + "p2"));
        els.push(seg([x - 1, y + H * 0.8, z], [x + 1, y + H * 0.8, z], col, 1.2, 0.7 * fo, key + "p3"));
        const z2 = z + TILE * 2, x2 = x + side * 0.4;
        [-1, 1].forEach((dx, i) => {
          const a: V3 = [x + dx, y + H * 0.8, z], b: V3 = [x2 + dx, Hg(x2, z2) + H * 0.8, z2];
          const m: V3 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - 0.6, (a[2] + b[2]) / 2];
          els.push(seg(a, m, col, 0.8, 0.45 * fo, key + "cb" + i));
          els.push(seg(m, b, col, 0.8, 0.45 * fo, key + "cc" + i));
        });
      } else if (kind === 3) {
        // árvores (crescem com a reconstrução)
        for (let j = 0; j < 3; j++) {
          const tx = x + (j - 1) * 1.1, tz = z + (rnd(id + j) - 0.5) * 1.5, ty = Hg(tx, tz);
          const th = (0.8 + rnd(id * 9 + j) * 1.2) * (0.5 + 0.7 * rebuild);
          els.push(seg([tx, ty, tz], [tx, ty + th * 0.35, tz], DIM, 1.2, fo, key + "tt" + j));
          els.push(seg([tx - 0.5 * th / 2, ty + th * 0.35, tz], [tx, ty + th * 1.3, tz], GREEN, 1.2, 0.65 * fo, key + "tl" + j));
          els.push(seg([tx + 0.5 * th / 2, ty + th * 0.35, tz], [tx, ty + th * 1.3, tz], GREEN, 1.2, 0.65 * fo, key + "tr" + j));
          els.push(seg([tx - 0.5 * th / 2, ty + th * 0.35, tz], [tx + 0.5 * th / 2, ty + th * 0.35, tz], GREEN, 1.2, 0.5 * fo, key + "tb" + j));
        }
      } else if (kind === 4) {
        // casa com telhado
        const hw = 0.9, hh = 1.1;
        const col = combK > 0.6 ? "#7fd8ff" : rebuild > 0.4 ? CREAM : DIM;
        els.push(...box([x, y, z], hw * 2, hh, 1.6, col, 0.8 * fo, key));
        els.push(seg([x - hw, y + hh, z], [x, y + hh + 0.8, z], col, 1.3, 0.8 * fo, key + "r1"));
        els.push(seg([x + hw, y + hh, z], [x, y + hh + 0.8, z], col, 1.3, 0.8 * fo, key + "r2"));
        if (rebuild > 0.3) {
          const q = pr(x, y + hh * 0.5, z - 0.8);
          if (q) els.push(<rect key={key + "jw"} x={q.x - 3} y={q.y - 3} width={6} height={6} fill="#ffd27a" opacity={fo * rebuild * (0.6 + 0.4 * Math.sin(f / 17 + id))} />);
        }
      } else {
        // poste de luz na beira da estrada
        const lx = side * 2.4;
        els.push(seg([lx, Hg(lx, z), z], [lx, Hg(lx, z) + 2.2, z], DIM, 1.2, fo, key + "lp"));
        els.push(seg([lx, Hg(lx, z) + 2.2, z], [lx - side * 0.6, Hg(lx, z) + 2.2, z], DIM, 1.2, fo, key + "lb"));
        const q = pr(lx - side * 0.6, Hg(lx, z) + 2.15, z);
        if (q && rebuild > 0.2) els.push(<circle key={key + "lg"} cx={q.x} cy={q.y} r={Math.max(2, 30 / q.d)} fill={combK > 0.5 ? "#9fe6ff" : "#ffd27a"} opacity={fo * rebuild} />);
      }
    }
  }
  // cada acontecimento: um lugar ao lado do caminho, à frente da câmera na hora em que é dito
  const place = (k: number): V3 => {
    const z = camAt(E[k]) + 22;
    const x = (k % 2 ? 1 : -1) * (2.5 + (k % 3) * 0.8);
    return [x, Hg(x, z), z];
  };
  const badge = (c: V3, h: number, img: string, col: string, o: number, key: string, gray = 0, size = 46) => {
    const b = pr(c[0], c[1], c[2]), t = pr(c[0], c[1] + h, c[2]);
    if (!b || !t || o <= 0) return null;
    const s = Math.max(0.5, Math.min(2, 14 / t.d));
    const W = size * s, Hh = size * 1.25 * s;
    return (
      <g key={key} opacity={o}>
        <ellipse cx={b.x} cy={b.y} rx={18 * s} ry={5 * s} fill="none" stroke={col} strokeWidth={1.4} strokeDasharray="4 4" />
        <line x1={b.x} y1={b.y} x2={t.x} y2={t.y} stroke={col} strokeWidth={1.4} />
        <rect x={t.x - W / 2 - 3} y={t.y - Hh - 3} width={W + 6} height={Hh + 6} rx={5} fill="#05070a" stroke={col} strokeWidth={2.4} />
        <image href={staticFile(img)} x={t.x - W / 2} y={t.y - Hh} width={W} height={Hh} preserveAspectRatio="xMidYMid slice" style={{ filter: `grayscale(${gray}) brightness(${1 - 0.4 * gray})` }} />
      </g>
    );
  };
  const caption = (c: V3, k: number, h = 4) => {
    const ev = events[k];
    if (!ev) return null;
    const t = pr(c[0], c[1] + h, c[2]);
    if (!t) return null;
    const o = P(f, E[k], 10) * (k < 11 ? 1 - P(f, E[k + 1] ?? 1e9, 10) * 0.6 : 1);
    return (
      <g key={"cap" + k} opacity={o}>
        <line x1={t.x} y1={t.y} x2={t.x} y2={t.y - 40} stroke={ev.c} strokeWidth={1.4} />
        <text x={Math.max(360, Math.min(1560, t.x))} y={t.y - 50} textAnchor="middle" fill={ev.c} fontFamily={MONO} fontSize={20} letterSpacing={3} style={{ paintOrder: "stroke", stroke: "#000", strokeWidth: 5 }}>{ev.k}</text>
      </g>
    );
  };
  const vis = (k: number) => f >= E[k] - 50;
  // 0 · as armas destruídas: canhões em caixa esmagados e o X
  if (vis(0)) {
    const c = place(0), k = P(f, E[0] + 10, 30);
    [-1.6, 0, 1.6].forEach((dx, i) => els.push(...box([c[0] + dx, c[1], c[2]], 1.0, 2.2 * (1 - 0.85 * k), 2.6, k > 0.5 ? RED : ICE, 0.9, "w" + i)));
    if (k > 0.3) { els.push(seg([c[0] - 3, c[1] + 2.5, c[2]], [c[0] + 3, c[1] + 0.2, c[2]], RED, 3, k, "x1")); els.push(seg([c[0] - 3, c[1] + 0.2, c[2]], [c[0] + 3, c[1] + 2.5, c[2]], RED, 3, k, "x2")); }
    els.push(caption(c, 0));
  }
  // 1 e 11 · o navio, o véu que fecha e o véu que cai
  const shipAt = (k: number, veilIn: number, veilOut: number) => {
    const c = place(k);
    const glow = veilOut;
    const shipO = Math.max(0.12, 0.9 - 0.75 * veilIn + 0.75 * veilOut);
    ship().forEach(([a, b], i) => els.push(seg([c[0] + a[0], c[1] + a[1], c[2] + a[2]], [c[0] + b[0], c[1] + b[1], c[2] + b[2]], glow > 0.3 ? "#cff6ff" : ICE, glow > 0.3 ? 1.6 : 1, shipO, `s${k}_${i}`)));
    // o domo do véu (meridianos e paralelos), que se forma ou estoura
    const R = 9;
    const form = veilIn * (1 - veilOut);
    const burst = veilOut;
    for (let m = 0; m < 10; m++) {
      const a = (m / 10) * Math.PI * 2;
      const pts: V3[] = Array.from({ length: 9 }).map((_, j) => { const t = (j / 8) * (Math.PI / 2) * form; const r = R * (1 + burst * 0.6); return [c[0] + Math.cos(a) * Math.cos(t) * r, c[1] + Math.sin(t) * r, c[2] + Math.sin(a) * Math.cos(t) * r * 0.8] as V3; });
      for (let j = 0; j < 8; j++) els.push(seg(pts[j], pts[j + 1], "#bfe6ff", 1.2, 0.6 * (form > 0 ? 1 : 0) * (1 - burst), `d${k}${m}${j}`));
    }
    for (let r = 1; r <= 3; r++) {
      const t = (r / 4) * (Math.PI / 2);
      const ring: V3[] = Array.from({ length: 25 }).map((_, j) => { const a = (j / 24) * Math.PI * 2; const rr = R * (1 + burst * 0.6); return [c[0] + Math.cos(a) * Math.cos(t) * rr, c[1] + Math.sin(t) * rr * Math.min(1, form * 1.4), c[2] + Math.sin(a) * Math.cos(t) * rr * 0.8] as V3; });
      for (let j = 0; j < 24; j++) els.push(seg(ring[j], ring[j + 1], "#bfe6ff", 1, 0.45 * form * (1 - burst), `r${k}${r}${j}`));
    }
    els.push(caption(c, k, 9));
  };
  if (vis(1)) shipAt(1, P(f, E[1] + 10, 60), 0);
  if (vis(11)) shipAt(11, 1, P(f, E[11] + 20, 40));
  // 2 · os códigos enterrados no gelo
  if (vis(2)) {
    const c = place(2), k = P(f, E[2] + 10, 60);
    els.push(...box([c[0], c[1] + 1.4 - 2.2 * k, c[2]], 1.8, 1.4, 1.2, CREAM, 1 - 0.6 * k, "cod"));
    const q = pr(c[0], c[1] + 2.6 - 2.2 * k, c[2]);
    if (q) els.push(<text key="codt" x={q.x} y={q.y} textAnchor="middle" fill={CREAM} fontFamily={MONO} fontSize={14} letterSpacing={2} opacity={1 - k}>01101 · VÉU</text>);
    els.push(caption(c, 2));
  }
  // 3 e 9 · a cidade cresce; depois vira Combine
  const city = (k: number, combine: number) => {
    const c = place(k);
    const g = P(f, E[k] + 6, 80);
    for (let i = 0; i < 9; i++) {
      const dx = (i % 3 - 1) * 2.2, dz = (Math.floor(i / 3) - 1) * 2.2;
      const h = (1.5 + rnd(i * 3 + k) * 4) * g * (1 + combine * 1.6);
      const w = 1.4 * (1 - combine * 0.4);
      els.push(...box([c[0] + dx, c[1], c[2] + dz], w, h, w, combine > 0.4 ? "#7fd8ff" : CREAM, 0.85, `c${k}${i}`));
      if (combine > 0.4) els.push(seg([c[0] + dx, c[1] + h, c[2] + dz], [c[0] + dx, c[1] + h + 1.6, c[2] + dz], "#cff6ff", 2, combine, `ct${k}${i}`));
    }
    els.push(caption(c, k, 6));
  };
  if (vis(3)) city(3, 0);
  if (vis(9)) city(9, P(f, E[9] + 20, 60));
  // 4, 5, 6 · o Varga: a célula vermelha que se espalha, os arquivos que viram escritura, ele apaga e a ideia continua
  const net = (c: V3, k: number, n: number, key: string) => {
    for (let i = 0; i < n; i++) {
      const a = rnd(i * 7) * Math.PI * 2, r = 1 + rnd(i * 11) * 7 * k;
      const q: V3 = [c[0] + Math.cos(a) * r, Hg(c[0] + Math.cos(a) * r, c[2] + Math.sin(a) * r) + 0.05, c[2] + Math.sin(a) * r];
      els.push(seg([c[0], c[1] + 0.05, c[2]], q, RED, 1.2, 0.7 * k, `${key}l${i}`));
      const s = pr(q[0], q[1], q[2]);
      if (s) els.push(<circle key={`${key}n${i}`} cx={s.x} cy={s.y} r={3.5} fill={RED} opacity={k} />);
    }
  };
  // 4, 5, 6 · o Varga — 30/10 (ele: a célula aparecia, sumia e aparecia de novo, sem continuidade; o Varga envelhecer
  // não estava representado): agora é UMA coisa só, que acompanha o caminho (fica sempre à esquerda, à frente da câmera)
  // e cresce: a célula pequena → vira um movimento → os arquivos giram e viram uma escritura vermelha → o Varga envelhece
  // (o retrato fica grisalho, a idade sobe) e morre (vira uma lápide) → a rede continua, a escritura no lugar dele → mais
  // tarde, a seita entra nos prédios (janelas vermelhas) geração após geração → alguém acha os códigos
  if (f >= E[4] - 20) {
    const [moveAt, ageAt, dieAt, ideaAt] = ["vMoveAt", "vAgeAt", "vDieAt", "vIdeaAt"].map((k) => at(p, k));
    const AZ = camZ + 24;
    const c: V3 = [-8.5, Hg(-8.5, AZ), AZ];
    const born = P(f, E[4], 14);
    const cellK = P(f, E[4] + 6, 40);
    const moveK = P(f, moveAt, 100);
    const ideaK = P(f, ideaAt, 30);
    const late = P(f, ideaAt + 30, 900);
    const N = Math.round(6 + 22 * moveK + 14 * late + 18 * sectK);
    // a rede no chão: cada nó nasce e liga ao vizinho mais antigo (cresce para fora, nunca some)
    const nodes: V3[] = [];
    for (let i = 0; i < N; i++) {
      const a = rnd(i * 7.3) * Math.PI * 2;
      const r = 0.8 + Math.sqrt(i / 60) * 9 * (0.6 + 0.4 * rnd(i * 2.1));
      const nx = c[0] + Math.cos(a) * r, nz = c[2] + Math.sin(a) * r * 0.8;
      nodes.push([nx, Hg(nx, nz) + 0.05, nz]);
    }
    const pulse = 0.65 + 0.35 * Math.sin(f / 8);
    const netO = born * (1 - 0.4 * P(f, E[11] + 30, 40));
    nodes.forEach((q, i) => {
      const to = i === 0 ? c : nodes[Math.floor(rnd(i * 3.9) * i)];
      els.push(seg([to[0], to[1], to[2]], q, RED, 1.3, 0.7 * netO * (0.7 + 0.3 * ideaK), `vn${i}`));
      const sq = pr(q[0], q[1], q[2]);
      if (sq) els.push(<circle key={`vd${i}`} cx={sq.x} cy={sq.y} r={Math.max(2.5, 40 / sq.d) * (i < 6 ? 1.2 : 1)} fill={RED} opacity={netO * (i / N > cellK && i < 6 ? 0 : 1) * (0.7 + 0.3 * pulse * ideaK)} />);
    });
    // os arquivos da Mossman girando e virando escritura (um livro vermelho que fica)
    const pk = P(f, E[5] + 6, 80);
    if (f >= E[5] - 10) {
      for (let i = 0; i < 10; i++) {
        const a = i * 0.63 + f / 40, r = 2.2 * (1 - 0.7 * pk), hh = 3.4 + Math.sin(a * 2) * 0.4 + 0.5 * pk;
        const q = pr(c[0] + 2.6 + Math.cos(a) * r, c[1] + hh, c[2] + Math.sin(a) * r * 0.6);
        if (q) { const sz = Math.max(0.6, 14 / q.d); els.push(<rect key={"pg" + i} x={q.x - 9 * sz} y={q.y - 12 * sz} width={18 * sz} height={24 * sz} fill={i / 10 < pk ? "rgba(255,93,77,0.3)" : "rgba(255,226,176,0.2)"} stroke={i / 10 < pk ? RED : CREAM} strokeWidth={1.2} opacity={P(f, E[5] - 10, 12) * (1 - 0.8 * P(f, E[5] + 100, 20))} />); }
      }
      const bq = pr(c[0] + 2.6, c[1] + 3.6, c[2]);
      if (bq && pk > 0.5) {
        const sz = Math.max(0.6, 14 / bq.d), bo = P(f, E[5] + 80, 20);
        els.push(
          <g key="book" opacity={bo}>
            <rect x={bq.x - 26 * sz} y={bq.y - 18 * sz} width={52 * sz} height={34 * sz} rx={3} fill="rgba(60,8,8,0.85)" stroke={RED} strokeWidth={2} />
            <line x1={bq.x} y1={bq.y - 18 * sz} x2={bq.x} y2={bq.y + 16 * sz} stroke={RED} strokeWidth={1.5} />
            <text x={bq.x} y={bq.y + 34 * sz} textAnchor="middle" fill={RED} fontFamily={MONO} fontSize={12 * sz} letterSpacing={2}>EXTINÇÃO</text>
          </g>,
        );
      }
    }
    // o Varga: envelhece (grisalho, a idade subindo) e morre (lápide); a rede segue
    const ageK = P(f, ageAt, 40);
    const dead = P(f, dieAt, 16);
    const age = Math.round(interpolate(f, [E[4], ageAt, dieAt], [44, 58, 83], C));
    if (dead < 1) els.push(badge(c, 3, "hl3silh/varga_retrato.png", dead > 0 ? "#7a7f86" : RED, born * (1 - dead), "varga", ageK));
    if (dead > 0) {
      const t = pr(c[0], c[1] + 1.6, c[2]), b0 = pr(c[0], c[1], c[2]);
      if (t && b0) {
        const sz = Math.max(0.6, 14 / t.d);
        els.push(
          <g key="tomb" opacity={dead}>
            <path d={`M ${b0.x - 16 * sz} ${b0.y} V ${t.y + 8 * sz} a ${16 * sz} ${16 * sz} 0 0 1 ${32 * sz} 0 V ${b0.y} Z`} fill="#0b0f10" stroke="#9aa3a8" strokeWidth={2} />
            <text x={t.x} y={t.y + 22 * sz} textAnchor="middle" fill="#cfd6da" fontFamily={MONO} fontSize={11 * sz}>VARGA</text>
          </g>,
        );
      }
    }
    // o rótulo de cima: uma linha só, que muda conforme a história (nada empilhado)
    const top = pr(c[0], c[1] + 5.6, c[2]);
    const stage: [number, string, string][] = [
      [E[4], "VARGA · UMA CÉLULA CONTRA O ELI", RED],
      [moveAt, "A CÉLULA VIRA UM MOVIMENTO", RED],
      [E[5], "OS ARQUIVOS DA MOSSMAN VIRAM ESCRITURA", RED],
      [ageAt, `VARGA ENVELHECE · ${age} ANOS`, "#cfd6da"],
      [dieAt, "VARGA MORRE SEM VOLTAR AO NÚCLEO", "#cfd6da"],
      [ideaAt, "A IDEIA SOBREVIVE", RED],
      [sectAt, "A SEITA CRESCE POR DENTRO", RED],
      [genAt, "GERAÇÃO APÓS GERAÇÃO", RED],
      [findAt, "ATÉ ALGUÉM ACHAR OS CÓDIGOS", CREAM],
    ];
    let cur = -1;
    stage.forEach(([t], i) => { if (f >= t) cur = i; });
    const hideMid = f >= E[7] - 10 && f < sectAt - 10;
    if (top && cur >= 0 && !hideMid) {
      const [t0, txt, col] = stage[cur];
      els.push(
        <g key="vlab" opacity={P(f, t0, 10)}>
          <line x1={top.x} y1={top.y + 8} x2={top.x} y2={top.y + 40} stroke={col} strokeWidth={1.4} />
          <text x={Math.max(360, top.x)} y={top.y} textAnchor="middle" fill={col} fontFamily={MONO} fontSize={20} letterSpacing={3} style={{ paintOrder: "stroke", stroke: "#000", strokeWidth: 5 }}>{txt}</text>
        </g>,
      );
    }
    // "até alguém encontrar os códigos": um fio da rede desce e acha a caixa dos códigos
    if (f >= findAt) {
      const k = P(f, findAt, 30);
      const cz: V3 = [c[0] + 4.5, c[1] + 0.3, c[2] - 3];
      els.push(seg(c, [c[0] + (cz[0] - c[0]) * k, c[1] + (cz[1] - c[1]) * k, c[2] + (cz[2] - c[2]) * k], CREAM, 2.4, 1, "find"));
      if (k > 0.8) els.push(...box(cz, 1.6, 1.1, 1.1, CREAM, P(f, findAt + 24, 10), "codes2"));
    }
  }
  // 7 · Eli e Barney envelhecem
  if (vis(7)) {
    const c = place(7), g = P(f, E[7] + 10, 90);
    els.push(badge([c[0] - 1.2, c[1], c[2]], 3, "hl3silh/eli_retrato.png", GREEN, 1 - 0.5 * P(f, E[8], 30), "eli", g));
    els.push(badge([c[0] + 1.2, c[1], c[2]], 3, "hl3silh/barney_badge.jpg", GREEN, 1 - 0.5 * P(f, E[8], 30), "barney", g));
    els.push(caption(c, 7, 5));
  }
  // 8 · a estátua da Alyx, o Dog ao lado
  if (vis(8)) {
    const c = place(8), g = P(f, E[8] + 4, 40);
    els.push(...box(c, 2.2, 1.2 * g, 2.2, AMB, 0.9, "ped"));
    els.push(badge([c[0], c[1] + 1.2 * g, c[2]], 2.2, "hl3silh/alyx_badge.jpg", AMB, g, "statue", 0.85, 70));
    els.push(badge([c[0] + 2.4, c[1], c[2] + 0.4], 1.6, "hl3silh/dog_badge.jpg", ICE, P(f, E[8] + 20, 20), "dog"));
    els.push(caption(c, 8, 6));
  }
  // 10 · os rostos viram máscaras
  if (vis(10)) {
    const c = place(10);
    for (let i = 0; i < 12; i++) {
      const dx = (i % 4 - 1.5) * 1.3, dz = (Math.floor(i / 4) - 1) * 1.4;
      const turn = f >= E[10] + 10 + i * 6;
      els.push(badge([c[0] + dx, c[1], c[2] + dz], 1.6, turn ? "hl3silh/combine_badge.jpg" : "hl3silh/cidada_badge.jpg", turn ? RED : CREAM, P(f, E[10] - 10, 14), "m" + i, 0, 30));
    }
    els.push(caption(c, 10, 3.6));
  }
  // o ano
  const ks = E.map((t, i) => [t, y0 + ((y1 - y0) * i) / 11] as [number, number]);
  const year = Math.round(interpolate(f, [0, ...ks.map((k) => k[0]), life], [y0, ...ks.map((k) => k[1]), y1], C));
  const HZ = 540 - FP * Math.tan(pitch) + 6;
  const par = -yaw * FP * 0.9 - camX * 6;
  const day = 0.5 + 0.5 * Math.sin(f / (f < E[8] ? 26 : 16));
  const mount = (seed: number, base: number, amp: number, n: number) =>
    Array.from({ length: n + 1 }).map((_, i) => {
      const x = -200 + (i / n) * 2320;
      const h = amp * (0.35 + 0.65 * Math.abs(Math.sin(i * 0.7 + seed) * Math.cos(i * 0.31 + seed * 2)));
      return `${(x + par * (seed > 2 ? 0.3 : 0.15)).toFixed(1)},${(base - h).toFixed(1)}`;
    });
  const sky = (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
      {/* o céu que passa: dias e noites */}
      <rect x={0} y={0} width={1920} height={HZ} fill={`rgba(${Math.round(40 + 60 * day)},${Math.round(90 + 70 * day)},${Math.round(100 + 50 * day)},${0.1 + 0.14 * day})`} />
      {Array.from({ length: 70 }).map((_, i) => <circle key={"st" + i} cx={rnd(i * 3.7) * 1920} cy={rnd(i * 5.3) * (HZ - 40)} r={rnd(i) > 0.85 ? 1.6 : 1} fill="#e8fff4" opacity={(1 - day) * 0.7 * (0.5 + 0.5 * Math.sin(f / 9 + i))} />)}
      {(() => {
        const t = (f / (f < E[8] ? 26 : 16) / (Math.PI * 2)) % 1;
        const sx = 200 + t * 1520, sy = HZ - 40 - Math.sin(t * Math.PI) * 220;
        return <circle cx={sx} cy={sy} r={14} fill={day > 0.5 ? "#ffe2b0" : "#cfe8ff"} opacity={0.55} />;
      })()}
      {/* montanhas em duas camadas */}
      <polygon points={[...mount(4.1, HZ, 150, 26), `2120,${HZ}`, `-200,${HZ}`].join(" ")} fill="#06110f" stroke={TEAL} strokeOpacity={0.18} strokeWidth={1.2} />
      <polygon points={[...mount(1.3, HZ, 85, 34), `2120,${HZ}`, `-200,${HZ}`].join(" ")} fill="#081815" stroke={TEAL} strokeOpacity={0.3} strokeWidth={1.2} />
      {/* a cidade no horizonte: ruína → reconstruída → Combine (com a Cidadela subindo no meio) */}
      {Array.from({ length: 34 }).map((_, i) => {
        const x = 560 + i * 24 + par * 0.4;
        const ruin = 0.35 + 0.65 * rebuild;
        const h = (18 + rnd(i * 4.4) * 70) * ruin * (1 + 0.9 * combK * rnd(i * 2.2));
        const w = 14 + rnd(i * 6.1) * 10;
        const col = combK > 0.5 ? "#7fd8ff" : rebuild > 0.5 ? "#ffe2b0" : "rgba(150,190,185,0.6)";
        return (
          <g key={"sk" + i}>
            <rect x={x} y={HZ - h} width={w} height={h} fill="#071311" stroke={col} strokeOpacity={0.5} strokeWidth={1} />
            {rebuild > 0.3 && rnd(i * 8.8) > 0.4 ? <rect x={x + w / 2 - 1.5} y={HZ - h * 0.6} width={3} height={3} fill={combK > 0.5 ? "#9fe6ff" : "#ffd27a"} opacity={0.4 + 0.5 * (1 - day)} /> : null}
          </g>
        );
      })}
      {combK > 0 ? <polygon points={`${940 + par * 0.4},${HZ} ${960 + par * 0.4},${HZ - 330 * combK} ${982 + par * 0.4},${HZ}`} fill="#06121a" stroke="#9fe6ff" strokeOpacity={0.7 * combK} strokeWidth={1.4} /> : null}
      <rect x={0} y={HZ - 2} width={1920} height={30} fill="url(#hzfog)" />
      <defs>
        <linearGradient id="hzfog" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="rgba(95,243,208,0.12)" />
          <stop offset="1" stopColor="rgba(95,243,208,0)" />
        </linearGradient>
      </defs>
    </svg>
  );
  // o Gordon (de costas) e o G-Man ao lado, parados, olhando o mundo envelhecer (entram em "Gordon continua parado"
  // e "o G-Man continua ao lado dele")
  const gordO = P(f, 105, 14), gmanO = P(f, 170, 14);
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 35%, #072220 0%, #020707 75%)", overflow: "hidden" }}>
      {sky}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>{els}</svg>
      <div style={{ position: "absolute", left: 150, bottom: -40, width: 150, height: 370, opacity: 0.92 * gordO, WebkitMaskImage: `url(${staticFile("hl3silh/gordon_peca.png")})`, maskImage: `url(${staticFile("hl3silh/gordon_peca.png")})`, WebkitMaskSize: "100% 100%", maskSize: "100% 100%", background: "linear-gradient(180deg, #23302e, #050807 85%)", filter: "drop-shadow(0 0 10px rgba(95,243,208,0.35))" }} />
      <div style={{ position: "absolute", left: 300, bottom: -30, width: 150, height: 405, opacity: 0.92 * gmanO, WebkitMaskImage: `url(${staticFile("hl3silh/gman_silh.png")})`, maskImage: `url(${staticFile("hl3silh/gman_silh.png")})`, WebkitMaskSize: "100% 100%", maskSize: "100% 100%", background: "linear-gradient(180deg, #2a3036, #060809 85%)", filter: "drop-shadow(0 0 10px rgba(220,240,255,0.3))" }} />
      {f < E[0] + 20 ? <div style={{ position: "absolute", left: 0, right: 0, top: 150, textAlign: "center", fontFamily: MONO, fontSize: 22, letterSpacing: 8, color: "#cfe8ff", opacity: P(f, 240, 14) * (1 - P(f, E[0], 14)) }}>O MUNDO INTEIRO ENVELHECE EM VOLTA DOS DOIS</div> : null}
      <div style={{ position: "absolute", right: 80, top: 60, textAlign: "right", fontFamily: MONO, color: TEAL }}>
        <div style={{ fontSize: 15, letterSpacing: 6, opacity: 0.8 }}>O TEMPO CORRE</div>
        <div style={{ fontSize: 76, letterSpacing: 4, color: "#e8fff4", textShadow: "0 0 18px rgba(95,243,208,0.5)" }}>{year}</div>
      </div>
      <AbsoluteFill style={{ boxShadow: "inset 0 0 220px rgba(0,0,0,0.85)", pointerEvents: "none" }} />
      <AbsoluteFill style={{ background: "#000", opacity: interpolate(f, [0, 8, life - 6, life], [1, 0, 0, 1], C), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};
