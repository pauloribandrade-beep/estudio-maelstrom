// =================================================================================================
// HL3 · REFORMULAÇÃO · 5A "os Flickers" (06/10/2026). Visão do Gordon (primeira pessoa) dentro de uma SALA da
// estação: 3D com faces iluminadas pela lanterna (pintor: de trás para frente), luz de emergência, poeira, HUD do
// HEV (bússola, rastreador de movimento, mira, munição). A criatura é uma falha na imagem (fatias de luz), nunca um
// corpo desenhado.
//  · HLRFlickerRoom: entra pela câmera do corredor → aparece no fim do corredor → some → ressurge do outro lado da
//    sala e a primeira continua lá → várias versões, mesma assinatura → título FLICKERS
//  · HLRFlickerAnchor: combate na mesma sala → uma versão diferente (pegadas, empurra a caixa, o som vem dela) → as
//    outras levam tiro e se remontam → a ANCORADA → mira, tiro → todas somem juntas
// =================================================================================================
import { drawGL, parseRGBA, GLFace } from "./xgl";
import React, { useMemo } from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { FONT, MONO } from "./overlays";
import { C, HL, rnd } from "./hl3";
import { FilmLook } from "./hl3r";

const RED = "#ff5d4d";
const AMB = "#ffb22e";
const CREAM = "#ffe2b0";
const ICE = "#9fe6ff";
const MAG = "#ff3df0";
const TXT = HL.text;
const P = (f: number, at: number, d = 12) => interpolate(f, [at, at + d], [0, 1], { ...C, easing: Easing.out(Easing.cubic) });
const IO = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

// ---------------------------------------------------------------- câmera em primeira pessoa
export type V3 = [number, number, number];
export type Eye = { x: number; y: number; z: number; yaw: number; pitch: number; F: number };
export const toCam = (e: Eye, p: V3): V3 => {
  const dx = p[0] - e.x;
  const dy = p[1] - e.y;
  const dz = p[2] - e.z;
  const c = Math.cos(e.yaw);
  const s = Math.sin(e.yaw);
  const rx = dx * c - dy * s;
  const fy = dx * s + dy * c;
  const cp = Math.cos(e.pitch);
  const sp = Math.sin(e.pitch);
  return [rx, fy * cp + dz * sp, dz * cp - fy * sp]; // [direita, profundidade, cima]
};
const NEAR = 0.15;
const scr = (e: Eye, q: V3): [number, number] => [960 + (q[0] * e.F) / q[1], 540 - (q[2] * e.F) / q[1]];
export const proj = (e: Eye, p: V3) => {
  const q = toCam(e, p);
  return q[1] > NEAR ? { x: scr(e, q)[0], y: scr(e, q)[1], d: q[1] } : null;
};
// recorte do polígono no plano próximo (Sutherland–Hodgman)
const clip = (ps: V3[]): V3[] => {
  const out: V3[] = [];
  for (let i = 0; i < ps.length; i++) {
    const a = ps[i];
    const b = ps[(i + 1) % ps.length];
    const ai = a[1] > NEAR;
    const bi = b[1] > NEAR;
    if (ai) out.push(a);
    if (ai !== bi) {
      const t = (NEAR - a[1]) / (b[1] - a[1]);
      out.push([a[0] + (b[0] - a[0]) * t, NEAR, a[2] + (b[2] - a[2]) * t]);
    }
  }
  return out;
};

// ---------------------------------------------------------------- a sala
// x: -10..10, y: 0..16 (norte = fundo), z: 0..4.2. Porta no fundo (x -1.6..1.6) → corredor até y = 40.
export type Face = { p: V3[]; col: [number, number, number]; n: V3; kind?: "lamp" | "door" | "sign" };
const RH = 4.2;
const buildRoom = (): Face[] => {
  const F: Face[] = [];
  const quad = (a: V3, b: V3, c: V3, d: V3, col: [number, number, number], n: V3, kind?: Face["kind"]) => F.push({ p: [a, b, c, d], col, n, kind });
  const wallCol: [number, number, number] = [74, 86, 94];
  const wallCol2: [number, number, number] = [62, 72, 80];
  const floorCol: [number, number, number] = [58, 62, 64];
  const ceilCol: [number, number, number] = [34, 38, 42];
  // chão e teto da sala em placas 2×2
  for (let i = 0; i < 10; i++)
    for (let j = 0; j < 8; j++) {
      const x0 = -10 + i * 2;
      const y0 = j * 2;
      const k = (i + j) % 2 ? 1 : 0.92;
      quad([x0, y0, 0], [x0 + 2, y0, 0], [x0 + 2, y0 + 2, 0], [x0, y0 + 2, 0], [floorCol[0] * k, floorCol[1] * k, floorCol[2] * k], [0, 0, 1]);
      quad([x0, y0, RH], [x0, y0 + 2, RH], [x0 + 2, y0 + 2, RH], [x0 + 2, y0, RH], ceilCol, [0, 0, -1]);
    }
  // paredes laterais em painéis (2 m × 1,4 m)
  for (let j = 0; j < 8; j++)
    for (let r = 0; r < 3; r++) {
      const y0 = j * 2;
      const z0 = r * 1.4;
      const c = r === 0 ? wallCol2 : wallCol;
      quad([-10, y0, z0], [-10, y0 + 2, z0], [-10, y0 + 2, z0 + 1.4], [-10, y0, z0 + 1.4], c, [1, 0, 0]);
      quad([10, y0 + 2, z0], [10, y0, z0], [10, y0, z0 + 1.4], [10, y0 + 2, z0 + 1.4], c, [-1, 0, 0]);
    }
  // parede do fundo (y = 16) com a porta
  for (let i = 0; i < 10; i++)
    for (let r = 0; r < 3; r++) {
      const x0 = -10 + i * 2;
      const z0 = r * 1.4;
      if (x0 + 2 > -1.6 && x0 < 1.6 && z0 < 3) continue;
      quad([x0 + 2, 16, z0], [x0, 16, z0], [x0, 16, z0 + 1.4], [x0 + 2, 16, z0 + 1.4], r === 0 ? wallCol2 : wallCol, [0, -1, 0]);
    }
  quad([-1.6, 16, 3], [1.6, 16, 3], [1.6, 16, 2.8], [-1.6, 16, 2.8], wallCol, [0, -1, 0]); // verga
  // parede da frente (y = 0), atrás de quem entra
  for (let i = 0; i < 10; i++) {
    const x0 = -10 + i * 2;
    if (x0 + 2 > -1.6 && x0 < 1.6) continue;
    quad([x0, 0, 0], [x0 + 2, 0, 0], [x0 + 2, 0, RH], [x0, 0, RH], wallCol, [0, 1, 0]);
  }
  // corredor do fundo: y 16..40, x -1.6..1.6, alto 3
  for (let j = 0; j < 12; j++) {
    const y0 = 16 + j * 2;
    const k = j % 2 ? 1 : 0.9;
    quad([-1.6, y0, 0], [1.6, y0, 0], [1.6, y0 + 2, 0], [-1.6, y0 + 2, 0], [floorCol[0] * k, floorCol[1] * k, floorCol[2] * k], [0, 0, 1]);
    quad([-1.6, y0, 3], [-1.6, y0 + 2, 3], [1.6, y0 + 2, 3], [1.6, y0, 3], ceilCol, [0, 0, -1]);
    quad([-1.6, y0, 0], [-1.6, y0 + 2, 0], [-1.6, y0 + 2, 3], [-1.6, y0, 3], wallCol2, [1, 0, 0]);
    quad([1.6, y0 + 2, 0], [1.6, y0, 0], [1.6, y0, 3], [1.6, y0 + 2, 3], wallCol2, [-1, 0, 0]);
  }
  quad([1.6, 40, 0], [-1.6, 40, 0], [-1.6, 40, 3], [1.6, 40, 3], [40, 46, 50], [0, -1, 0]);
  // corredor de entrada (atrás): y -8..0
  for (let j = 0; j < 4; j++) {
    const y0 = -8 + j * 2;
    quad([-1.6, y0, 0], [1.6, y0, 0], [1.6, y0 + 2, 0], [-1.6, y0 + 2, 0], floorCol, [0, 0, 1]);
    quad([-1.6, y0, 0], [-1.6, y0 + 2, 0], [-1.6, y0 + 2, 3], [-1.6, y0, 3], wallCol2, [1, 0, 0]);
    quad([1.6, y0 + 2, 0], [1.6, y0, 0], [1.6, y0, 3], [1.6, y0 + 2, 3], wallCol2, [-1, 0, 0]);
    quad([-1.6, y0, 3], [-1.6, y0 + 2, 3], [1.6, y0 + 2, 3], [1.6, y0, 3], ceilCol, [0, 0, -1]);
  }
  // luminárias do teto (emitem)
  [[-5, 5], [5, 5], [-5, 11], [5, 11]].forEach(([x, y]) => quad([x - 1.2, y - 0.25, RH - 0.02], [x - 1.2, y + 0.25, RH - 0.02], [x + 1.2, y + 0.25, RH - 0.02], [x + 1.2, y - 0.25, RH - 0.02], [255, 236, 200], [0, 0, -1], "lamp"));
  // caixa genérica
  const box = (x: number, y: number, w: number, d: number, h: number, col: [number, number, number]) => {
    const a: V3 = [x, y, 0], b: V3 = [x + w, y, 0], c: V3 = [x + w, y + d, 0], dd: V3 = [x, y + d, 0];
    const up = (p: V3): V3 => [p[0], p[1], h];
    quad(up(a), up(b), up(c), up(dd), [col[0] * 1.15, col[1] * 1.15, col[2] * 1.15], [0, 0, 1]);
    quad(a, b, up(b), up(a), col, [0, -1, 0]);
    quad(c, dd, up(dd), up(c), col, [0, 1, 0]);
    quad(dd, a, up(a), up(dd), [col[0] * 0.85, col[1] * 0.85, col[2] * 0.85], [-1, 0, 0]);
    quad(b, c, up(c), up(b), [col[0] * 0.85, col[1] * 0.85, col[2] * 0.85], [1, 0, 0]);
  };
  // prateleiras na parede oeste, mesa, tambores, armários
  box(-9.6, 2.5, 0.9, 8, 2.4, [70, 66, 58]);
  box(-3.8, 7, 2.6, 1.3, 0.95, [92, 84, 70]);
  box(4.6, 11.6, 1.2, 1.2, 1.3, [120, 50, 40]);
  box(6.1, 12.4, 1.2, 1.2, 1.3, [120, 50, 40]);
  box(8.8, 4, 0.9, 5, 2.6, [64, 74, 82]);
  box(-7.5, 13.6, 2.2, 1.6, 1.1, [86, 92, 70]);
  return F;
};
// a caixa que a ancorada empurra (desenhada à parte porque anda)
const crateFaces = (x: number, y: number): Face[] => {
  const F: Face[] = [];
  const s = 1.3;
  const col: [number, number, number] = [150, 110, 60];
  const a: V3 = [x, y, 0], b: V3 = [x + s, y, 0], c: V3 = [x + s, y + s, 0], d: V3 = [x, y + s, 0];
  const up = (p: V3): V3 => [p[0], p[1], s];
  F.push({ p: [up(a), up(b), up(c), up(d)], col: [175, 130, 72], n: [0, 0, 1] });
  F.push({ p: [a, b, up(b), up(a)], col, n: [0, -1, 0] });
  F.push({ p: [d, a, up(a), up(d)], col: [128, 94, 52], n: [-1, 0, 0] });
  F.push({ p: [b, c, up(c), up(b)], col: [128, 94, 52], n: [1, 0, 0] });
  F.push({ p: [c, d, up(d), up(c)], col, n: [0, 1, 0] });
  return F;
};

// luz: lanterna (cone a partir do olho) + luminárias que piscam + emergência vermelha
export type Lights = { flash: number; lamps: number; red: number; strobe: number };
const shade = (e: Eye, fc: Face, L: Lights, f: number): string => {
  if (fc.kind === "lamp") {
    const k = L.lamps;
    return `rgb(${Math.round(60 + 195 * k)},${Math.round(58 + 178 * k)},${Math.round(50 + 150 * k)})`;
  }
  const cx = fc.p.reduce((s, p) => s + p[0], 0) / fc.p.length;
  const cy = fc.p.reduce((s, p) => s + p[1], 0) / fc.p.length;
  const cz = fc.p.reduce((s, p) => s + p[2], 0) / fc.p.length;
  const q = toCam(e, [cx, cy, cz]);
  const dist = Math.hypot(cx - e.x, cy - e.y, cz - e.z);
  const cone = Math.max(0, (q[1] / Math.max(0.01, dist) - 0.8) / 0.2);
  const facing = Math.max(0.15, Math.abs(((e.x - cx) * fc.n[0] + (e.y - cy) * fc.n[1] + (e.z - cz) * fc.n[2]) / Math.max(0.01, dist)));
  const flash = L.flash * cone * facing * Math.max(0, 1 - dist / 30) * 1.4;
  // luminárias: luz de cima, mais forte perto do centro da sala
  const lamp = L.lamps * 0.35 * (fc.n[2] > 0.5 ? 1 : 0.6) * (cy < 16.5 && cy > -0.5 ? 1 : 0.3);
  const red = L.red * (0.22 + 0.1 * Math.sin(f / 6)) * (cy > 12 ? 1 : 0.5);
  const amb = 0.08 + L.strobe;
  const k = amb + flash + lamp;
  const r = fc.col[0] * k + 120 * red;
  const g = fc.col[1] * k + 18 * red;
  const b = fc.col[2] * k + 14 * red;
  const cl = (v: number) => Math.round(Math.max(0, Math.min(255, v)));
  return `rgb(${cl(r)},${cl(g)},${cl(b)})`;
};

// 11/10: desenha com profundidade de verdade (mesmas cores do shade); `flat` = o jeito antigo (pintor)
const RoomViewGL: React.FC<{ e: Eye; L: Lights; f: number; all: Face[] }> = ({ e, L, f, all }) => {
  const ref = React.useRef<HTMLCanvasElement>(null);
  React.useLayoutEffect(() => {
    if (!ref.current) return;
    const fs: GLFace[] = [];
    for (const fc of all) {
      const rgb = parseRGBA(shade(e, fc, L, f));
      if (rgb) fs.push({ pts: fc.p as [number, number, number][], rgb: [rgb[0], rgb[1], rgb[2]] });
    }
    drawGL(ref.current, e, fs, [0, 0, 0, 0.35]);
  });
  return <canvas ref={ref} width={1920} height={1080} style={{ position: "absolute", inset: 0, width: 1920, height: 1080 }} />;
};
export const RoomView: React.FC<{ e: Eye; L: Lights; f: number; crate?: [number, number] | null; faces: Face[]; flat?: boolean }> = ({ e, L, f, crate, faces, flat }) => {
  const all = crate ? faces.concat(crateFaces(crate[0], crate[1])) : faces;
  if (!flat) return <RoomViewGL e={e} L={L} f={f} all={all} />;
  const polys: { d: number; pts: string; fill: string; seam: boolean }[] = [];
  for (const fc of all) {
    const cam = clip(fc.p.map((p) => toCam(e, p)));
    if (cam.length < 3) continue;
    const pts = cam.map((q) => scr(e, q));
    if (pts.every((p) => p[0] < -200) || pts.every((p) => p[0] > 2120) || pts.every((p) => p[1] < -200) || pts.every((p) => p[1] > 1280)) continue;
    const d = cam.reduce((s, q) => s + q[1], 0) / cam.length;
    polys.push({ d, pts: pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" "), fill: shade(e, fc, L, f), seam: fc.kind !== "lamp" });
  }
  polys.sort((a, b) => b.d - a.d);
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
      {polys.map((p, i) => (
        <polygon key={i} points={p.pts} fill={p.fill} stroke={p.seam ? "rgba(0,0,0,0.35)" : "none"} strokeWidth={1} />
      ))}
    </svg>
  );
};

// ---------------------------------------------------------------- a criatura (falha na imagem)
export const Flicker: React.FC<{ e: Eye; x: number; y: number; f: number; seed: number; o?: number; anchored?: boolean; burst?: number; label?: string; labelCol?: string }> = ({ e, x, y, f, seed, o = 1, anchored = false, burst = 0, label, labelCol = CREAM }) => {
  const base = proj(e, [x, y, 0]);
  const top = proj(e, [x, y, 2.1]);
  if (!base || !top || o <= 0) return null;
  const H = base.y - top.y;
  const W = H * 0.36;
  const on = anchored ? 1 : rnd(Math.floor(f / 2) * 3.1 + seed) > 0.15 ? 1 : 0.25;
  const N = 12;
  return (
    <g opacity={o * on}>
      {/* brilho no chão */}
      <ellipse cx={base.x} cy={base.y} rx={W * 1.2} ry={W * 0.25} fill={anchored ? "rgba(255,226,176,0.35)" : "rgba(255,61,240,0.22)"} />
      {Array.from({ length: N }).map((_, k) => {
        const yy = top.y + (k / N) * H;
        const w = W * (0.35 + 0.65 * Math.sin(((k + 0.5) / N) * Math.PI)) * (k < 2 ? 0.55 : 1);
        const off = anchored ? (rnd(k * 1.3 + seed) - 0.5) * W * 0.08 : (rnd(k * 3.7 + Math.floor(f / 2) + seed) - 0.5) * W * 0.9;
        const scatter = burst * (rnd(k * 9.1 + seed) - 0.5) * W * 6;
        const lift = burst * (rnd(k * 4.3 + seed) - 0.5) * H * 0.8;
        return <rect key={k} x={base.x - w / 2 + off + scatter} y={yy + lift} width={w} height={(H / N) * 0.82} fill={anchored ? (k % 3 === 0 ? CREAM : "#f6fbff") : k % 3 === 0 ? MAG : "#e8fbff"} opacity={(anchored ? 0.95 : 0.8) * (1 - burst * 0.7)} />;
      })}
      {label ? (
        <g>
          <rect x={base.x - W * 1.1} y={top.y - 14} width={W * 2.2} height={H + 28} fill="none" stroke={labelCol} strokeWidth={2} strokeDasharray="12 7" />
          <text x={base.x + W * 1.1 + 10} y={top.y + 8} fill={labelCol} fontFamily={MONO} fontSize={Math.max(14, Math.min(22, H / 12))} letterSpacing={2}>
            {label}
          </text>
        </g>
      ) : null}
    </g>
  );
};

// ---------------------------------------------------------------- HUD do HEV
export const Hud: React.FC<{ f: number; yaw: number; blips: { x: number; y: number; hot?: boolean }[]; eye: Eye; ammo?: number; msg?: string; msgCol?: string; o?: number }> = ({ f, yaw, blips, eye, ammo = 30, msg, msgCol = AMB, o = 1 }) => {
  const heading = ((yaw * 180) / Math.PI + 360) % 360;
  return (
    <AbsoluteFill style={{ opacity: o, pointerEvents: "none" }}>
      {/* visor */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 58%, rgba(0,0,0,0.55) 82%, rgba(0,0,0,0.9) 100%)" }} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {/* bússola */}
        <g opacity={0.85}>
          <line x1={660} x2={1260} y1={70} y2={70} stroke={AMB} strokeWidth={1.5} opacity={0.6} />
          {Array.from({ length: 37 }).map((_, i) => {
            const deg = i * 10;
            let dx = deg - heading;
            dx = ((dx + 540) % 360) - 180;
            if (Math.abs(dx) > 30) return null;
            const x = 960 + dx * 10;
            const big = deg % 90 === 0;
            return (
              <g key={i}>
                <line x1={x} x2={x} y1={70} y2={big ? 52 : 60} stroke={AMB} strokeWidth={big ? 2.5 : 1.5} />
                {big ? (
                  <text x={x} y={44} textAnchor="middle" fill={AMB} fontFamily={MONO} fontSize={18}>
                    {["N", "L", "S", "O"][deg / 90]}
                  </text>
                ) : null}
              </g>
            );
          })}
          <path d="M 960 76 l -7 10 l 14 0 Z" fill={AMB} />
        </g>
        {/* mira */}
        <g stroke={AMB} strokeWidth={2} opacity={0.8}>
          <line x1={940} x2={952} y1={540} y2={540} />
          <line x1={968} x2={980} y1={540} y2={540} />
          <line x1={960} x2={960} y1={520} y2={532} />
          <line x1={960} x2={960} y1={548} y2={560} />
        </g>
        {/* rastreador de movimento */}
        <g transform="translate(1720 880)">
          <circle r={120} fill="rgba(10,8,2,0.55)" stroke={AMB} strokeWidth={1.5} />
          <circle r={80} fill="none" stroke={AMB} strokeWidth={1} opacity={0.35} />
          <circle r={40} fill="none" stroke={AMB} strokeWidth={1} opacity={0.35} />
          <line x1={0} y1={0} x2={Math.sin(f / 12) * 120} y2={-Math.cos(f / 12) * 120} stroke={AMB} strokeWidth={1.5} opacity={0.5} />
          <path d="M 0 -10 L 7 8 L -7 8 Z" fill={AMB} />
          {blips.map((b, i) => {
            const dx = b.x - eye.x;
            const dy = b.y - eye.y;
            const c = Math.cos(eye.yaw);
            const s = Math.sin(eye.yaw);
            const rx = dx * c - dy * s;
            const fy = dx * s + dy * c;
            const k = 120 / 22;
            const px = Math.max(-114, Math.min(114, rx * k));
            const py = Math.max(-114, Math.min(114, -fy * k));
            return <circle key={i} cx={px} cy={py} r={b.hot ? 9 : 7} fill={b.hot ? CREAM : RED} opacity={0.5 + 0.5 * Math.sin(f / 4 + i)} />;
          })}
        </g>
      </svg>
      {/* vida / traje / munição */}
      <div style={{ position: "absolute", left: 70, bottom: 60, display: "flex", gap: 30, fontFamily: MONO, color: AMB }}>
        {[
          ["VIDA", "100"],
          ["TRAJE", "85"],
        ].map(([l, v]) => (
          <div key={l} style={{ padding: "10px 18px", background: "rgba(10,8,2,0.55)", borderRadius: 10, display: "flex", alignItems: "baseline", gap: 14 }}>
            <span style={{ fontSize: 16, letterSpacing: 4 }}>{l}</span>
            <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 52 }}>{v}</span>
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", right: 300, bottom: 60, padding: "10px 18px", background: "rgba(10,8,2,0.55)", borderRadius: 10, fontFamily: MONO, color: AMB, display: "flex", alignItems: "baseline", gap: 14 }}>
        <span style={{ fontSize: 16, letterSpacing: 4 }}>MUNIÇÃO</span>
        <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 52 }}>{ammo}</span>
      </div>
      {msg ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 120, textAlign: "center", fontFamily: MONO, fontSize: 22, letterSpacing: 6, color: msgCol }}>
          <span style={{ padding: "8px 18px", background: "rgba(10,8,2,0.6)", borderRadius: 8 }}>{msg}</span>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// poeira no ar (pega a luz da lanterna)
export const Dust: React.FC<{ f: number; e: Eye; o?: number }> = ({ f, e, o = 1 }) => {
  const motes = useMemo(() => Array.from({ length: 120 }).map((_, i) => [-9 + rnd(i * 2.1) * 18, 1 + rnd(i * 3.3) * 30, 0.3 + rnd(i * 5.7) * 3.6] as V3), []);
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: o, pointerEvents: "none" }}>
      {motes.map((m, i) => {
        const p = proj(e, [m[0] + Math.sin(f / 50 + i) * 0.3, m[1], m[2] + Math.sin(f / 70 + i * 2) * 0.2]);
        if (!p || p.d > 22) return null;
        const r = Math.max(0.6, 5 / p.d);
        return <circle key={i} cx={p.x} cy={p.y} r={r} fill="#fff4dc" opacity={Math.max(0, 0.5 - p.d / 40)} />;
      })}
    </svg>
  );
};

// ---------------------------------------------------------------- cena 1: a primeira criatura
type P1 = { life: number; appearAt?: number; goneAt?: number; againAt?: number; stillAt?: number; manyAt?: number; titleAt?: number };
const A_POS: [number, number] = [0, 36];
const B_POS: [number, number] = [8, 9.5];
const MANY: [number, number][] = [
  [-6.5, 12.5],
  [3.5, 14.2],
  [-4.5, 5.5],
  [6.8, 3.6],
  [0.4, 26],
];
export const HLRFlickerRoom: React.FC<P1> = (p) => {
  const f = useCurrentFrame();
  const a = (v?: number) => v ?? 1e9;
  const [appearAt, goneAt, againAt, stillAt, manyAt, titleAt] = [p.appearAt, p.goneAt, p.againAt, p.stillAt, p.manyAt, p.titleAt].map(a);
  const life = p.life;
  const faces = useMemo(() => buildRoom(), []);
  // olho: entra pelo corredor e para no meio da sala
  const walk = interpolate(f, [0, appearAt], [-5, 3.2], { ...C, easing: Easing.out(Easing.quad) });
  const bob = f < appearAt ? Math.sin(f / 4.5) * 0.04 : 0;
  // olhar: frente → vira para o outro lado da sala → volta → abre
  const turn1 = IO((f - againAt + 3) / 10);
  const turn2 = IO((f - stillAt + 2) / 14);
  const yaw = 0.95 * turn1 * (1 - turn2) + 0.12 * turn2 + Math.sin(f / 90) * 0.02 + (f >= manyAt ? Math.sin((f - manyAt) / 40) * 0.25 : 0);
  const back = P(f, manyAt, 40);
  const e: Eye = { x: 0 - back * 0.5, y: walk - back * 1.6, z: 1.7 + bob + back * 0.25, yaw, pitch: -0.04 - back * 0.05, F: 980 - back * 120 };
  // luz: as luminárias falham quando ela aparece
  const glitchL = (at: number, d = 8) => (f >= at && f < at + d ? (rnd(f * 3.1) > 0.5 ? 0 : 0.6) : 1);
  const lamps = (f < appearAt ? 0.85 : 0.45) * glitchL(appearAt) * glitchL(againAt) * glitchL(manyAt, 14);
  const L: Lights = { flash: 1, lamps, red: f >= manyAt ? 1 : f >= appearAt ? 0.5 : 0, strobe: f >= manyAt && f < titleAt && (f - manyAt) % 9 < 2 ? 0.12 : 0 };
  // entrada: a câmera de segurança do corredor vira a visão do Gordon
  const intro = 1 - P(f, 0, 14);
  // as criaturas
  const showA = (f >= appearAt && f < goneAt) || f >= againAt;
  const showB = f >= againAt;
  const title = P(f, titleAt, 10);
  const blips = [...(showA ? [{ x: A_POS[0], y: A_POS[1] }] : []), ...(showB ? [{ x: B_POS[0], y: B_POS[1] }] : []), ...(f >= manyAt ? MANY.filter((_, i) => f >= manyAt + i * 5).map(([x, y]) => ({ x, y })) : [])];
  const tag = (i: number) => (f >= stillAt ? "CONTATO 01 · 7F·2C" : "CONTATO 01");
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <AbsoluteFill style={{ opacity: 1 - title * 0.85, transform: `scale(${1 + title * 0.06})` }}>
        <RoomView e={e} L={L} f={f} faces={faces} />
        <Dust f={f} e={e} />
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          {showA ? <Flicker e={e} x={A_POS[0]} y={A_POS[1]} f={f} seed={1} label={f >= appearAt + 6 ? tag(0) : undefined} o={f < goneAt && f > goneAt - 4 ? 0.4 : 1} /> : null}
          {showB ? <Flicker e={e} x={B_POS[0]} y={B_POS[1]} f={f} seed={2} label={f >= againAt + 6 ? tag(1) : undefined} /> : null}
          {f >= manyAt ? MANY.map(([x, y], i) => (f >= manyAt + i * 5 ? <Flicker key={i} e={e} x={x} y={y} f={f} seed={10 + i} label={f >= manyAt + 20 ? "7F·2C" : undefined} labelCol={RED} /> : null)) : null}
        </svg>
        {/* lanterna: brilho do cone */}
        <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 54%, rgba(255,244,220,0.10) 0%, rgba(0,0,0,0) 32%)", pointerEvents: "none" }} />
        <Hud f={f} yaw={yaw} eye={e} blips={blips} msg={f >= manyAt ? `${blips.length} CONTATOS · 1 ASSINATURA` : f >= stillAt ? "2 CONTATOS · MESMA ASSINATURA" : f >= appearAt ? "MOVIMENTO DETECTADO" : undefined} msgCol={f >= stillAt ? RED : AMB} o={P(f, 6, 10)} />
      </AbsoluteFill>
      {/* entrada: a gravação do corredor enche a tela e vira a visão dele */}
      {intro > 0 ? (
        <AbsoluteFill style={{ opacity: intro, background: "#0b0f0e" }}>
          <AbsoluteFill style={{ background: "repeating-linear-gradient(0deg, rgba(200,255,230,0.10) 0px, rgba(200,255,230,0.10) 1px, rgba(0,0,0,0) 2px, rgba(0,0,0,0) 4px)" }} />
          <div style={{ position: "absolute", left: 30, top: 24, fontFamily: MONO, fontSize: 22, letterSpacing: 4, color: "#cfeee0" }}>CAM 02 · CORREDOR A</div>
        </AbsoluteFill>
      ) : null}
      {/* FLICKERS */}
      {title > 0 ? (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
          {[3, 2, 1, 0].map((k) => {
            const lag = k * 3;
            const t = P(f, titleAt + lag, 12);
            const dx = (rnd(k * 7 + Math.floor(f / 3)) - 0.5) * (k ? 60 : 0) * (1 - P(f, titleAt + 20, 16));
            return (
              <div key={k} style={{ position: "absolute", fontFamily: FONT, fontWeight: 800, fontSize: 220, letterSpacing: -6, color: k ? "transparent" : TXT, WebkitTextStroke: k ? `2px ${k === 1 ? MAG : "rgba(232,251,255,0.5)"}` : undefined, opacity: t * (k ? 0.6 - k * 0.12 : 1), transform: `translateX(${dx + (k ? k * 18 : 0)}px) scale(${1 + (1 - t) * 0.15})` }}>
                FLICKERS
              </div>
            );
          })}
          <div style={{ position: "absolute", top: 660, fontFamily: MONO, fontSize: 24, letterSpacing: 8, color: CREAM, opacity: P(f, titleAt + 14, 12) }}>A MESMA CRIATURA · EM VÁRIOS LUGARES</div>
        </AbsoluteFill>
      ) : null}
      <AbsoluteFill style={{ background: "#000", opacity: interpolate(f, [life - 6, life], [0, 1], C), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- cena 2: a versão ancorada
type P2 = { life: number; copiesAt?: number; combatAt?: number; oddAt?: number; stepsAt?: number; pushAt?: number; soundAt?: number; othersAt?: number; hitAt?: number; backAt?: number; anchorAt?: number; aimAt?: number; killAt?: number; goneAt?: number };
const COPIES: [number, number][] = [
  [-6.2, 12.8],
  [1.2, 15.2],
  [-4.2, 6.2],
  [7.8, 13.2],
  [0.2, 22],
];
const ANCH: [number, number] = [4.3, 6.8]; // a ancorada (perto da caixa)
export const HLRFlickerAnchor: React.FC<P2> = (p) => {
  const f = useCurrentFrame();
  const a = (v?: number) => v ?? 1e9;
  const [copiesAt, combatAt, oddAt, stepsAt, pushAt, soundAt, othersAt, hitAt, backAt, anchorAt, aimAt, killAt, goneAt] = [p.copiesAt, p.combatAt, p.oddAt, p.stepsAt, p.pushAt, p.soundAt, p.othersAt, p.hitAt, p.backAt, p.anchorAt, p.aimAt, p.killAt, p.goneAt].map(a);
  const life = p.life;
  const faces = useMemo(() => buildRoom(), []);
  // a ancorada anda (deixa pegadas) até a caixa e empurra
  const walkT = interpolate(f, [stepsAt - 20, pushAt + 10], [0, 1], C);
  const ax = 2.2 + (ANCH[0] - 2.2) * walkT;
  const ay = 9.6 + (ANCH[1] - 9.6) * walkT;
  const crateX = 5.2 + 1.3 * IO((f - pushAt) / 14);
  // olhar: varre a sala no combate, depois trava na ancorada
  const aimYaw = Math.atan2(ax - 0.3, ay - 1.8);
  const sweep = Math.sin((f - combatAt) / 26) * 0.55;
  const toAim = IO((f - aimAt) / 16);
  const toOdd = IO((f - oddAt) / 18) * (1 - IO((f - othersAt) / 14));
  const yawFree = (f >= combatAt ? sweep : 0) * (1 - toOdd) + aimYaw * 0.8 * toOdd;
  const yaw = yawFree * (1 - toAim) + aimYaw * toAim;
  const kick = f >= killAt && f < killAt + 8 ? (1 - (f - killAt) / 8) * 0.06 : 0;
  const shake = f >= hitAt && f < backAt ? Math.sin(f * 2.3) * 0.006 : 0;
  const e: Eye = { x: 0.3, y: 1.8, z: 1.75, yaw: yaw + shake, pitch: -0.06 + kick, F: 900 + 160 * toAim };
  const lamps = f >= goneAt + 8 ? 0.85 : 0.4 + (f >= combatAt && f < goneAt ? (rnd(Math.floor(f / 3)) > 0.85 ? -0.3 : 0) : 0);
  // tiros do Gordon (nas outras): clarão e munição
  const shots = [hitAt, hitAt + 6, hitAt + 12, hitAt + 22, hitAt + 30];
  const lastShot = Math.max(-1e9, ...shots.filter((s) => s <= f), f >= killAt ? killAt : -1e9);
  const muzzle = f - lastShot < 3 ? 1 - (f - lastShot) / 3 : 0;
  const ammo = 30 - shots.filter((s) => s <= f).length - (f >= killAt ? 1 : 0);
  const L: Lights = { flash: 1, lamps, red: f < goneAt + 8 ? 1 : 0, strobe: muzzle * 0.35 };
  // as cópias: aparecem, levam tiro (estouram) e voltam (se remontam)
  const copyBurst = (i: number) => {
    const s = shots[i % shots.length];
    if (f < s) return 0;
    const t = f - s;
    if (f < backAt) return Math.min(1, t / 6);
    return Math.max(0, 1 - (f - backAt) / 10); // voltam
  };
  const gone = P(f, goneAt, 8);
  const killed = f >= killAt ? Math.min(1, (f - killAt) / 10) : 0;
  const isOdd = f >= oddAt;
  const anchored = f >= anchorAt;
  // pegadas (chão) da ancorada
  const steps = f >= stepsAt ? Array.from({ length: 9 }).map((_, i) => {
    const t = i / 8;
    const sx = 2.2 + (ANCH[0] - 2.2) * t + (i % 2 ? 0.18 : -0.18);
    const sy = 9.6 + (ANCH[1] - 9.6) * t;
    return { sx, sy, o: f >= stepsAt + i * 3 ? 1 : 0 };
  }) : [];
  const blips = [...COPIES.filter((_, i) => f >= copiesAt + i * 4).map(([x, y]) => ({ x, y })), ...(killed < 1 ? [{ x: ax, y: ay, hot: isOdd }] : [])];
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <RoomView e={e} L={L} f={f} faces={faces} crate={[crateX, 5.8]} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {/* pegadas que brilham */}
        {steps.map((s, i) => {
          const q = proj(e, [s.sx, s.sy, 0.01]);
          if (!q || !s.o) return null;
          const r = Math.max(5, 110 / q.d);
          return (
            <g key={i} opacity={1 - gone}>
              <ellipse cx={q.x} cy={q.y} rx={r * 1.1} ry={r * 0.45} fill="rgba(255,226,176,0.18)" />
              <ellipse cx={q.x} cy={q.y} rx={r * 0.5} ry={r * 0.2} fill={CREAM} opacity={0.9} />
            </g>
          );
        })}
        {/* ondas de som saindo dela */}
        {f >= soundAt && f < othersAt + 20
          ? [0, 1, 2].map((k) => {
              const q = proj(e, [ax, ay, 0.3]);
              if (!q) return null;
              const t = ((f - soundAt + k * 12) % 36) / 36;
              const r = (20 + t * 160) * Math.min(2, 6 / q.d);
              return <ellipse key={k} cx={q.x} cy={q.y} rx={r} ry={r * 0.3} fill="none" stroke={CREAM} strokeWidth={2} opacity={(1 - t) * 0.8} />;
            })
          : null}
        {/* as cópias */}
        {COPIES.map(([x, y], i) => (f >= copiesAt + i * 4 ? <Flicker key={i} e={e} x={x} y={y} f={f} seed={20 + i} burst={copyBurst(i)} o={1 - gone} label={f >= anchorAt ? "ECO" : f >= combatAt ? "7F·2C" : undefined} labelCol={f >= anchorAt ? "rgba(255,93,77,0.8)" : RED} /> : null))}
        {/* a ancorada */}
        {killed < 1 ? <Flicker e={e} x={ax} y={ay} f={f} seed={7} anchored={anchored} burst={killed} label={anchored ? "ANCORADA" : isOdd ? "DIFERENTE" : f >= combatAt ? "7F·2C" : undefined} labelCol={anchored || isOdd ? CREAM : RED} o={1} /> : null}
        {/* âncora: uma linha firme até o chão */}
        {anchored && killed < 1
          ? (() => {
              const q0 = proj(e, [ax, ay, 0]);
              const q1 = proj(e, [ax, ay, -6]);
              if (!q0 || !q1) return null;
              return <line x1={q0.x} y1={q0.y} x2={q0.x} y2={1080} stroke={CREAM} strokeWidth={3} opacity={0.8 * P(f, anchorAt, 10)} />;
            })()
          : null}
        {/* clarão do tiro */}
        {muzzle > 0 ? <circle cx={1180} cy={860} r={120 * muzzle + 30} fill="#fff1c4" opacity={0.7 * muzzle} /> : null}
        {/* traçante do tiro final */}
        {f >= killAt && f < killAt + 4
          ? (() => {
              const q = proj(e, [ax, ay, 1.2]);
              return q ? <line x1={1180} y1={860} x2={q.x} y2={q.y} stroke="#ffe6a0" strokeWidth={5} opacity={1 - (f - killAt) / 4} /> : null;
            })()
          : null}
        {/* todas somem juntas: implosão */}
        {f >= goneAt && f < goneAt + 14
          ? [...COPIES].map(([x, y], i) => {
              const q = proj(e, [x, y, 1]);
              if (!q) return null;
              const t = (f - goneAt) / 14;
              return <circle key={i} cx={q.x} cy={q.y} r={(1 - t) * 90 * Math.min(2, 6 / q.d)} fill="none" stroke={MAG} strokeWidth={3} opacity={1 - t} />;
            })
          : null}
      </svg>
      <Dust f={f} e={e} />
      <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 54%, rgba(255,244,220,0.10) 0%, rgba(0,0,0,0) 32%)", pointerEvents: "none" }} />
      {/* clarão na tela inteira no tiro final */}
      <AbsoluteFill style={{ background: "#fff", opacity: f >= killAt && f < killAt + 4 ? 0.5 * (1 - (f - killAt) / 4) : 0, pointerEvents: "none" }} />
      <Hud
        f={f}
        yaw={yaw}
        eye={e}
        blips={f >= goneAt ? [] : blips}
        ammo={ammo}
        msg={f >= goneAt + 4 ? "CONTATOS: 0" : f >= aimAt ? "ALVO TRAVADO · ANCORADA" : f >= anchorAt ? "1 ANCORADA · 5 ECOS" : f >= backAt ? "ATINGIDAS · VOLTARAM" : f >= soundAt ? "ORIGEM DO SOM: 1 CONTATO" : f >= oddAt ? "1 CONTATO DIFERENTE" : f >= copiesAt ? "CÓPIAS · MESMA ASSINATURA" : undefined}
        msgCol={f >= goneAt + 4 ? "#8dffa8" : f >= anchorAt || f >= oddAt ? CREAM : RED}
      />
      {/* trava da mira na ancorada */}
      {f >= aimAt && killed < 1
        ? (() => {
            const q = proj(e, [ax, ay, 1.1]);
            if (!q) return null;
            const t = P(f, aimAt, 14);
            const r = 160 - 100 * t;
            return (
              <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
                <g transform={`translate(${q.x} ${q.y}) rotate(${(1 - t) * 90})`} stroke={CREAM} strokeWidth={3} fill="none">
                  <path d={`M ${-r} ${-r / 2} L ${-r} ${-r} L ${-r / 2} ${-r}`} />
                  <path d={`M ${r / 2} ${-r} L ${r} ${-r} L ${r} ${-r / 2}`} />
                  <path d={`M ${r} ${r / 2} L ${r} ${r} L ${r / 2} ${r}`} />
                  <path d={`M ${-r / 2} ${r} L ${-r} ${r} L ${-r} ${r / 2}`} />
                </g>
              </svg>
            );
          })()
        : null}
      <AbsoluteFill style={{ background: "#000", opacity: interpolate(f, [0, 6], [1, 0], C) * 0.9 + interpolate(f, [life - 8, life], [0, 1], C), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};
