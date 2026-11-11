// =================================================================================================
// HL3 · REFORMULAÇÃO 39:42 → 1:00:31 (06/10/2026). Mistura de três linguagens, alternadas para não ficar monótono:
//  · HLXFootage: imagem real dos vídeos de fãs (E:/Source videos, recortada sem HUD/marca d'água) com o tratamento
//    de cinema do vídeo (FilmLook), empurrão lento de câmera, chamadas com linha e citação grande. Um clipe por vez.
//  · salas em primeira pessoa (POV, visão do Gordon com o HUD do HEV), no motor de hl3rf: luz por pontos + lanterna.
//  · nada de personagem desenhado: pessoas são marcadores; o G-Man é sombra/maleta; criaturas são massa e luz.
// =================================================================================================
import React, { useMemo } from "react";
import { AbsoluteFill, Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { FONT, MONO } from "./overlays";
import { C, Clip, HL, rnd } from "./hl3";
import { FilmLook, decode } from "./hl3r";
import { Eye, Hud, V3, proj, toCam } from "./hl3rf";
import * as THREE from "three";
import { drawGL, parseRGBA, GLFace } from "./xgl";
import { useAdvisors, placeAdvisor, advLightsFor, useAdvScene } from "./advgl";

const RED = "#ff5d4d";
const AMB = "#ffb22e";
const CREAM = "#ffe2b0";
const ICE = "#9fe6ff";
const VIO = "#c79bff";
const GREEN = "#8dffa8";
const TEAL = "#4fe3d0";
const ORANGE = HL.orange;
const TXT = HL.text;
const P = (f: number, at: number, d = 12) => interpolate(f, [at, at + d], [0, 1], { ...C, easing: Easing.out(Easing.cubic) });
const IO = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const CL = "videos/hl3_M01_R/clips/";
type PR = Record<string, number> & { life: number };
const at = (p: PR, k: string) => (p[k] as number | undefined) ?? 1e9;
// interpola um valor por "chaves" (instante → valor), com easing suave entre elas
export const keys = (f: number, ks: [number, number][]) => {
  if (f <= ks[0][0]) return ks[0][1];
  for (let i = 0; i < ks.length - 1; i++) {
    const [t0, v0] = ks[i];
    const [t1, v1] = ks[i + 1];
    if (f <= t1) return v0 + (v1 - v0) * IO((f - t0) / Math.max(1, t1 - t0));
  }
  return ks[ks.length - 1][1];
};

// ================================================================================================= FOOTAGE
// clips: cada um entra no seu "at" (s→quadros pelo registro) e fica até o próximo; from = segundo dentro do arquivo
// marks: chamadas com linha (ponto no quadro → rótulo); quote: frase grande; title: rótulo do canto
type FClip = { src: string; from: number; at: number; rate?: number; push?: number; pos?: string; echo?: boolean; tint?: string; zoom?: number; origin?: string };
// trk = rastreamento do ponto no vídeo ([segundos desde o início da cena, x, y] em pixels do clipe 1920×1080); o rótulo anda junto
type FMark = { at: number; until?: number; x: number; y: number; lx?: number; ly?: number; text: string; sub?: string; col?: string; ring?: number; trk?: [number, number, number][]; ox?: number; oy?: number };
type FLink = { at: number; pts: [number, number][]; col?: string };
type FootP = { life: number; clips?: FClip[]; marks?: FMark[]; links?: FLink[]; title?: string; titleSub?: string; titleAt?: number; quote?: string; quoteAt?: number; quoteUntil?: number; quote2?: string; quote2At?: number; flashAt?: number; redAt?: number; blackAt?: number; blackText?: string; blackText2?: string; blackText2At?: number; chain?: { at: number; text: string }[] };
export const HLXFootage: React.FC<FootP> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  // o registro converte "at"/"...At" (até dentro das listas) para quadros; "until" e "quoteUntil" chegam em segundos
  const S = 30;
  const clips = (p.clips ?? []).slice().sort((a, b) => a.at - b.at);
  const ci = clips.reduce((k, c, i) => (f >= c.at ? i : k), 0);
  const cur = clips[ci];
  const curEnd = cur ? (ci + 1 < clips.length ? clips[ci + 1].at : life) : life;
  const curSc = cur ? (cur.zoom ?? 1.0) + Math.min(0.03, cur.push ?? 0.03) * ((f - cur.at) / Math.max(1, curEnd - cur.at)) : 1;
  const marks = (p.marks ?? []).map((m) => {
    const until = m.until !== undefined ? m.until * S : undefined;
    if (!m.trk || !m.trk.length) return { ...m, until };
    const ts = f / S;
    const tr = m.trk;
    let j = 0;
    while (j < tr.length - 2 && tr[j + 1][0] < ts) j++;
    const [t0, x0, y0] = tr[j];
    const [t1, x1, y1] = tr[Math.min(tr.length - 1, j + 1)];
    const u = t1 > t0 ? Math.max(0, Math.min(1, (ts - t0) / (t1 - t0))) : 0;
    const vx = x0 + (x1 - x0) * u + (m.ox ?? 0);
    const vy = y0 + (y1 - y0) * u + (m.oy ?? 0);
    const x = 960 + (vx - 960) * curSc;
    const y = 540 + (vy - 540) * curSc;
    const dx = (m.lx ?? m.x + 160) - m.x;
    const dy = (m.ly ?? m.y - 90) - m.y;
    // o rótulo anda junto com o ponto, sem sair da tela (troca de lado perto da borda)
    let lx = x + dx;
    if (lx > 1640) lx = x - Math.abs(dx);
    if (lx < 140) lx = x + Math.abs(dx);
    const ly = Math.max(120, Math.min(860, y + dy));
    return { ...m, until, x, y, lx, ly };
  });
  const links = p.links ?? [];
  const chainF = p.chain ?? [];
  const quoteUntil = p.quoteUntil !== undefined ? p.quoteUntil * S : 1e9;
  const black = P(f, p.blackAt ?? 1e9, 8);
  const flash = p.flashAt !== undefined ? Math.max(0, 1 - Math.abs(f - p.flashAt) / 6) : 0;
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      {clips.map((c, i) => {
        const end = i + 1 < clips.length ? clips[i + 1].at : life;
        if (i !== ci && !(i === ci + 1 && f > end - 20)) return null;
        const loc = f - c.at;
        const sc = (c.zoom ?? 1.0) + Math.min(0.03, c.push ?? 0.03) * (loc / Math.max(1, end - c.at));
        return (
          <Sequence key={i} from={Math.round(c.at)} durationInFrames={Math.max(1, Math.round(end - c.at))} premountFor={20}>
            <AbsoluteFill style={{ transform: `scale(${sc})`, transformOrigin: c.origin ?? "50% 50%", filter: `saturate(0.78) contrast(1.08) brightness(0.92)${c.tint ? ` ${c.tint}` : ""}` }}>
              <Clip src={CL + c.src} from={c.from} rate={c.rate ?? 1} style={{ objectPosition: c.pos ?? "50% 50%" }} />
            </AbsoluteFill>
          </Sequence>
        );
      })}
      {/* corte seco: um quadro de preto entre os clipes */}
      {clips.some((c, i) => i > 0 && Math.abs(f - c.at) < 1) ? <AbsoluteFill style={{ background: "#000" }} /> : null}
      {/* cor fria do vídeo + faixas de cinema */}
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(8,16,24,0.35) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 65%, rgba(4,6,10,0.75) 100%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 64, background: "#000" }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 64, background: "#000" }} />
      {p.redAt !== undefined && f >= p.redAt ? <AbsoluteFill style={{ background: `rgba(255,40,30,${0.22 * Math.max(0, 1 - (f - p.redAt) / 40)})`, pointerEvents: "none" }} /> : null}
      {/* ligações desenhadas sobre a imagem (rede, rota) */}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {links.map((l, i) => {
          if (f < l.at) return null;
          const k = P(f, l.at, 24);
          const d = l.pts.map((q, j) => `${j ? "L" : "M"} ${q[0]} ${q[1]}`).join(" ");
          return (
            <g key={i}>
              <path d={d} fill="none" stroke={l.col ?? VIO} strokeWidth={2.5} strokeDasharray={`${3000 * k} 3000`} opacity={0.85} style={{ filter: `drop-shadow(0 0 8px ${l.col ?? VIO})` }} />
              {l.pts.map((q, j) => (
                <circle key={j} cx={q[0]} cy={q[1]} r={6 + 3 * Math.sin(f / 6 + j)} fill={l.col ?? VIO} opacity={k} />
              ))}
            </g>
          );
        })}
        {marks.map((m, i) => {
          if (f < m.at || f >= (m.until ?? 1e9)) return null;
          const k = P(f, m.at, 10);
          const lx = m.lx ?? m.x + 160;
          const ly = m.ly ?? m.y - 90;
          const col = m.col ?? ORANGE;
          return (
            <g key={i} opacity={k}>
              <circle cx={m.x} cy={m.y} r={(m.ring ?? 16) * (1.4 - 0.4 * k)} fill="none" stroke={col} strokeWidth={2.5} />
              <circle cx={m.x} cy={m.y} r={4} fill={col} />
              <polyline points={`${m.x},${m.y} ${m.x + (lx - m.x) * 0.55 * k},${ly} ${m.x + (lx - m.x) * k},${ly}`} fill="none" stroke={col} strokeWidth={2} />
            </g>
          );
        })}
      </svg>
      {marks.map((m, i) => {
        if (f < m.at || f >= (m.until ?? 1e9)) return null;
        const lx = m.lx ?? m.x + 160;
        const ly = m.ly ?? m.y - 90;
        const left = lx < m.x;
        return (
          <div key={i} style={{ position: "absolute", left: left ? undefined : lx + 10, right: left ? 1920 - lx + 10 : undefined, top: ly - 22, textAlign: left ? "right" : "left", fontFamily: MONO, color: m.col ?? ORANGE, opacity: P(f, m.at + 6, 8) }}>
            <div style={{ fontSize: 20, letterSpacing: 4, textShadow: "0 2px 10px #000" }}>{decode(m.text, f, m.at + 4, 2.4)}</div>
            {m.sub ? <div style={{ fontSize: 15, letterSpacing: 3, color: "rgba(242,240,247,0.75)", marginTop: 4, textShadow: "0 2px 10px #000" }}>{decode(m.sub, f, m.at + 10, 2.6)}</div> : null}
          </div>
        );
      })}
      {chainF.length && f >= chainF[0].at ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 150, display: "flex", justifyContent: "center", alignItems: "center", gap: 14, fontFamily: MONO }}>
          {chainF.map((c, i) => {
            if (f < c.at) return null;
            const isCur = i === chainF.length - 1 || f < chainF[i + 1].at;
            return (
              <React.Fragment key={i}>
                {i > 0 ? <span style={{ color: ORANGE, fontSize: 22, opacity: P(f, c.at, 8) }}>→</span> : null}
                <span style={{ padding: "8px 16px", borderRadius: 8, fontSize: 20, letterSpacing: 4, color: isCur ? "#0b0b0b" : TXT, background: isCur ? ORANGE : "rgba(10,10,12,0.72)", border: `1.5px solid ${isCur ? ORANGE : "rgba(242,240,247,0.25)"}`, opacity: P(f, c.at, 8), transform: `translateY(${(1 - P(f, c.at, 10)) * 14}px)` }}>{c.text}</span>
              </React.Fragment>
            );
          })}
        </div>
      ) : null}
      {p.title ? (
        <div style={{ position: "absolute", left: 80, top: 96, fontFamily: MONO, letterSpacing: 6, opacity: P(f, p.titleAt ?? 0, 10) }}>
          <div style={{ fontSize: 20, color: ICE, textShadow: "0 2px 10px #000" }}>{decode(p.title, f, p.titleAt ?? 0, 2.2)}</div>
          {p.titleSub ? <div style={{ fontSize: 15, color: "rgba(242,240,247,0.65)", marginTop: 6 }}>{p.titleSub}</div> : null}
        </div>
      ) : null}
      {p.quote && f >= (p.quoteAt ?? 1e9) && f < quoteUntil ? (
        <div style={{ position: "absolute", left: 140, right: 140, bottom: 150, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 64, lineHeight: 1.12, color: TXT, textShadow: "0 8px 40px rgba(0,0,0,0.9)" }}>
          <span style={{ opacity: P(f, p.quoteAt ?? 0, 8) }}>{p.quote}</span>
          {p.quote2 && f >= (p.quote2At ?? 1e9) ? <div style={{ color: ORANGE, fontSize: 56, marginTop: 10, opacity: P(f, p.quote2At ?? 0, 8) }}>{p.quote2}</div> : null}
        </div>
      ) : null}
      <AbsoluteFill style={{ background: "#fff", opacity: flash * 0.8, pointerEvents: "none" }} />
      {black > 0 ? (
        <AbsoluteFill style={{ background: `rgba(0,0,0,${black})`, alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
          {p.blackText ? <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 70, color: TXT, textAlign: "center", maxWidth: 1500, lineHeight: 1.12, opacity: P(f, (p.blackAt ?? 0) + 4, 10) }}>{p.blackText}</div> : null}
          {p.blackText2 && f >= (p.blackText2At ?? 1e9) ? <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 58, color: ORANGE, textAlign: "center", maxWidth: 1500, marginTop: 20, opacity: P(f, p.blackText2At ?? 0, 10) }}>{p.blackText2}</div> : null}
        </AbsoluteFill>
      ) : null}
      <AbsoluteFill style={{ background: "#000", opacity: interpolate(f, [0, 6], [1, 0], C) + interpolate(f, [life - 6, life], [0, 1], C), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ================================================================================================= MOTOR POV (cenas novas)
// faces com cor própria; luz = ambiente + lanterna (cone do olho) + pontos de luz coloridos; emit = brilha sozinha
export type RGB = [number, number, number];
export type XF = { p: V3[]; col: RGB; n: V3; emit?: number; tag?: string; nofill?: boolean; edge?: RGB };
export type XL = { x: number; y: number; z: number; col: RGB; k: number; r: number };
const NEARX = 0.15;
const clipX = (ps: V3[]): V3[] => {
  const out: V3[] = [];
  for (let i = 0; i < ps.length; i++) {
    const a = ps[i];
    const b = ps[(i + 1) % ps.length];
    const ai = a[1] > NEARX;
    const bi = b[1] > NEARX;
    if (ai) out.push(a);
    if (ai !== bi) {
      const t = (NEARX - a[1]) / (b[1] - a[1]);
      out.push([a[0] + (b[0] - a[0]) * t, NEARX, a[2] + (b[2] - a[2]) * t]);
    }
  }
  return out;
};
const shadeX = (e: Eye, fc: XF, lights: XL[], flash: number, amb: number): string => {
  const cl = (v: number) => Math.round(Math.max(0, Math.min(255, v)));
  if (fc.emit) return `rgb(${cl(fc.col[0] * fc.emit)},${cl(fc.col[1] * fc.emit)},${cl(fc.col[2] * fc.emit)})`;
  const n = fc.p.length;
  const cx = fc.p.reduce((s, q) => s + q[0], 0) / n;
  const cy = fc.p.reduce((s, q) => s + q[1], 0) / n;
  const cz = fc.p.reduce((s, q) => s + q[2], 0) / n;
  const q = toCam(e, [cx, cy, cz]);
  const dist = Math.hypot(cx - e.x, cy - e.y, cz - e.z);
  const cone = Math.max(0, (q[1] / Math.max(0.01, dist) - 0.82) / 0.18);
  const facing = Math.max(0.2, Math.abs(((e.x - cx) * fc.n[0] + (e.y - cy) * fc.n[1] + (e.z - cz) * fc.n[2]) / Math.max(0.01, dist)));
  let r = fc.col[0] * amb;
  let g = fc.col[1] * amb;
  let b = fc.col[2] * amb;
  const fl = flash * cone * facing * Math.max(0, 1 - dist / 26) * 1.3;
  r += fc.col[0] * fl;
  g += fc.col[1] * fl;
  b += fc.col[2] * fl;
  for (const L of lights) {
    const dx = L.x - cx;
    const dy = L.y - cy;
    const dz = L.z - cz;
    const d = Math.hypot(dx, dy, dz);
    const fall = L.k * Math.max(0, 1 - d / L.r);
    const nd = Math.max(0.25, (dx * fc.n[0] + dy * fc.n[1] + dz * fc.n[2]) / Math.max(0.01, d));
    const w = fall * nd;
    r += (fc.col[0] * 0.6 + L.col[0] * 0.4) * w;
    g += (fc.col[1] * 0.6 + L.col[1] * 0.4) * w;
    b += (fc.col[2] * 0.6 + L.col[2] * 0.4) * w;
  }
  return `rgb(${cl(r)},${cl(g)},${cl(b)})`;
};
// a mesma conta do shadeX, num ponto (para sombrear por vértice no modo gl: poças de luz suaves, sem mudar o estilo)
const shadeAt = (e: Eye, fc: XF, pt: V3, lights: XL[], flash: number, amb: number): [number, number, number] => {
  if (fc.emit) return [fc.col[0] * fc.emit, fc.col[1] * fc.emit, fc.col[2] * fc.emit];
  const [cx, cy, cz] = pt;
  const q = toCam(e, pt);
  const dist = Math.hypot(cx - e.x, cy - e.y, cz - e.z);
  const cone = Math.max(0, (q[1] / Math.max(0.01, dist) - 0.82) / 0.18);
  const facing = Math.max(0.2, Math.abs(((e.x - cx) * fc.n[0] + (e.y - cy) * fc.n[1] + (e.z - cz) * fc.n[2]) / Math.max(0.01, dist)));
  const fl = flash * cone * facing * Math.max(0, 1 - dist / 26) * 1.3;
  let r = fc.col[0] * (amb + fl), g = fc.col[1] * (amb + fl), b = fc.col[2] * (amb + fl);
  for (const L of lights) {
    const dx = L.x - cx, dy = L.y - cy, dz = L.z - cz;
    const d = Math.hypot(dx, dy, dz);
    const fall = L.k * Math.pow(Math.max(0, 1 - d / L.r), 1.6);
    const nd = Math.max(0.15, (dx * fc.n[0] + dy * fc.n[1] + dz * fc.n[2]) / Math.max(0.01, d));
    const w = fall * nd * 1.25;
    r += (fc.col[0] * 0.6 + L.col[0] * 0.4) * w;
    g += (fc.col[1] * 0.6 + L.col[1] * 0.4) * w;
    b += (fc.col[2] * 0.6 + L.col[2] * 0.4) * w;
  }
  return [Math.min(255, r), Math.min(255, g), Math.min(255, b)];
};
const scrX = (e: Eye, q: V3): [number, number] => [960 + (q[0] * e.F) / q[1], 540 - (q[2] * e.F) / q[1]];
// 11/10 (pedido dele: crachás na frente da parede): oclusão para o que é desenhado por cima (crachás, chamadas). Cada
// XView registra as faces que desenhou neste quadro (mesmo olho = mesma cena); quem desenha por cima pergunta se o ponto
// está escondido atrás de alguma face (raio do olho até o ponto contra os triângulos).
let OCC: { e: Eye | null; faces: XF[] } = { e: null, faces: [] };
const regOcc = (e: Eye, faces: XF[]) => {
  if (OCC.e !== e) OCC = { e, faces: [] };
  OCC.faces = OCC.faces.concat(faces);
};
export const occluded = (e: Eye, pt: V3, margin = 0.25): boolean => {
  if (!OCC.e || OCC.e.x !== e.x || OCC.e.y !== e.y || OCC.e.z !== e.z) return false;
  const o: V3 = [e.x, e.y, e.z];
  const d: V3 = [pt[0] - o[0], pt[1] - o[1], pt[2] - o[2]];
  const L = Math.hypot(d[0], d[1], d[2]);
  if (L < 0.01) return false;
  const dir: V3 = [d[0] / L, d[1] / L, d[2] / L];
  const maxT = L - margin;
  for (const fc of OCC.faces) {
    if (fc.nofill || fc.emit) continue;
    const P = fc.p;
    for (let k = 1; k < P.length - 1; k++) {
      const a = P[0], b = P[k], cc = P[k + 1];
      const e1 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], e2 = [cc[0] - a[0], cc[1] - a[1], cc[2] - a[2]];
      const h = [dir[1] * e2[2] - dir[2] * e2[1], dir[2] * e2[0] - dir[0] * e2[2], dir[0] * e2[1] - dir[1] * e2[0]];
      const det = e1[0] * h[0] + e1[1] * h[1] + e1[2] * h[2];
      if (Math.abs(det) < 1e-7) continue;
      const inv = 1 / det;
      const s = [o[0] - a[0], o[1] - a[1], o[2] - a[2]];
      const u = inv * (s[0] * h[0] + s[1] * h[1] + s[2] * h[2]);
      if (u < 0 || u > 1) continue;
      const q = [s[1] * e1[2] - s[2] * e1[1], s[2] * e1[0] - s[0] * e1[2], s[0] * e1[1] - s[1] * e1[0]];
      const v = inv * (dir[0] * q[0] + dir[1] * q[1] + dir[2] * q[2]);
      if (v < 0 || u + v > 1) continue;
      const t = inv * (e2[0] * q[0] + e2[1] * q[1] + e2[2] * q[2]);
      if (t > 0.05 && t < maxT) return true;
    }
  }
  return false;
};
// 11/10: gl = desenha com profundidade de verdade (WebGL, xgl.ts) — mesmas cores; extras = objetos three (o Advisor)
// na mesma cena, escondidos pelas paredes
const XViewGL: React.FC<{ e: Eye; faces: XF[]; lights: XL[]; flash: number; amb: number; hide?: (fc: XF) => boolean; seam: string; extras?: THREE.Object3D[]; glLights?: THREE.Light[]; smooth?: boolean }> = ({ e, faces, lights, flash, amb, hide, seam, extras, glLights, smooth }) => {
  const ref = React.useRef<HTMLCanvasElement>(null);
  React.useLayoutEffect(() => {
    if (!ref.current) return;
    const fs: GLFace[] = [];
    for (const fc of faces) {
      if (hide && hide(fc)) continue;
      const rgb = parseRGBA(shadeX(e, fc, lights, flash, amb));
      const fx = fc as XF & { nofill?: boolean; edge?: RGB };
      if (rgb) fs.push({ pts: fc.p as [number, number, number][], rgb: [rgb[0], rgb[1], rgb[2]], vc: smooth && !fx.nofill ? fc.p.map((pt) => shadeAt(e, fc, pt, lights, flash, amb)) : undefined, nofill: fx.nofill, edge: fx.edge, top: !!fc.emit });
    }
    drawGL(ref.current, e, fs, parseRGBA(seam), extras ?? [], glLights ?? []);
  });
  return <canvas ref={ref} width={1920} height={1080} style={{ position: "absolute", inset: 0, width: 1920, height: 1080 }} />;
};
export const XView: React.FC<{ e: Eye; faces: XF[]; lights: XL[]; flash?: number; amb?: number; hide?: (fc: XF) => boolean; seam?: string; solid?: boolean; gl?: boolean; smooth?: boolean; flat?: boolean; extras?: THREE.Object3D[]; glLights?: THREE.Light[] }> = ({ e, faces, lights, flash = 0.9, amb = 0.1, hide, seam = "rgba(0,0,0,0.32)", solid, gl, smooth, flat, extras, glLights }) => {
  // 11/10 (aprovado no piloto): TODAS as cenas POV desenham com profundidade de verdade e luz suave; `flat` = o jeito antigo
  if (!flat) { gl = true; if (smooth === undefined) smooth = true; }
  regOcc(e, hide ? faces.filter((fc) => !hide(fc)) : faces);
  if (gl) return <XViewGL e={e} faces={faces} lights={lights} flash={flash} amb={amb} hide={hide} seam={seam} extras={extras} glLights={glLights} smooth={smooth} />;
  // solid (08/10, a cadeira do Cave ficava oca de perto): descarta as faces viradas de costas para o olho e ordena pela
  // distância real até o olho — com a câmera inclinada para cima a profundidade "para a frente" punha o assento atrás do pé
  const polys: { d: number; pts: string; fill: string; emit: boolean }[] = [];
  for (const fc of faces) {
    if (hide && hide(fc)) continue;
    let dd = 0;
    if (solid) {
      const n = fc.p.length;
      const cx = fc.p.reduce((a, q) => a + q[0], 0) / n - e.x;
      const cy = fc.p.reduce((a, q) => a + q[1], 0) / n - e.y;
      const cz = fc.p.reduce((a, q) => a + q[2], 0) / n - e.z;
      if (cx * fc.n[0] + cy * fc.n[1] + cz * fc.n[2] > 0) continue;
      dd = Math.hypot(cx, cy, cz);
    }
    const cam = clipX(fc.p.map((q) => toCam(e, q)));
    if (cam.length < 3) continue;
    const pts = cam.map((q) => scrX(e, q));
    if (pts.every((q) => q[0] < -300) || pts.every((q) => q[0] > 2220) || pts.every((q) => q[1] < -300) || pts.every((q) => q[1] > 1380)) continue;
    const d = solid ? dd : cam.reduce((s, q) => s + q[1], 0) / cam.length;
    polys.push({ d, pts: pts.map((q) => `${q[0].toFixed(1)},${q[1].toFixed(1)}`).join(" "), fill: shadeX(e, fc, lights, flash, amb), emit: !!fc.emit });
  }
  polys.sort((a, b) => b.d - a.d);
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
      {polys.map((q, i) => (
        <polygon key={i} points={q.pts} fill={q.fill} stroke={q.emit ? "none" : seam} strokeWidth={1} />
      ))}
    </svg>
  );
};
// construtores
export const mk = () => {
  const F: XF[] = [];
  const quad = (a: V3, b: V3, c: V3, d: V3, col: RGB, n: V3, extra?: Partial<XF>) => F.push({ p: [a, b, c, d], col, n, ...extra });
  const box = (x: number, y: number, z: number, w: number, d: number, h: number, col: RGB, extra?: Partial<XF>) => {
    const A: V3 = [x, y, z], B: V3 = [x + w, y, z], Cc: V3 = [x + w, y + d, z], D: V3 = [x, y + d, z];
    const up = (q: V3): V3 => [q[0], q[1], z + h];
    const dk = (k: number): RGB => [col[0] * k, col[1] * k, col[2] * k];
    quad(up(A), up(B), up(Cc), up(D), dk(1.12), [0, 0, 1], extra);
    quad(A, B, up(B), up(A), col, [0, -1, 0], extra);
    quad(Cc, D, up(D), up(Cc), col, [0, 1, 0], extra);
    quad(D, A, up(A), up(D), dk(0.84), [-1, 0, 0], extra);
    quad(B, Cc, up(Cc), up(B), dk(0.84), [1, 0, 0], extra);
  };
  // prisma de n lados (cilindro aproximado), aberto ou fechado em cima
  const prism = (x: number, y: number, z0: number, z1: number, r: number, nSide: number, col: RGB, extra?: Partial<XF>, rot = 0) => {
    for (let i = 0; i < nSide; i++) {
      const a0 = rot + (i / nSide) * Math.PI * 2;
      const a1 = rot + ((i + 1) / nSide) * Math.PI * 2;
      const am = (a0 + a1) / 2;
      quad([x + Math.cos(a0) * r, y + Math.sin(a0) * r, z0], [x + Math.cos(a1) * r, y + Math.sin(a1) * r, z0], [x + Math.cos(a1) * r, y + Math.sin(a1) * r, z1], [x + Math.cos(a0) * r, y + Math.sin(a0) * r, z1], col, [Math.cos(am), Math.sin(am), 0], extra);
    }
    F.push({ p: Array.from({ length: nSide }).map((_, i) => [x + Math.cos(rot + (i / nSide) * Math.PI * 2) * r, y + Math.sin(rot + (i / nSide) * Math.PI * 2) * r, z1] as V3), col: [col[0] * 1.1, col[1] * 1.1, col[2] * 1.1], n: [0, 0, 1], ...extra });
  };
  // sala retangular em placas: x0..x1, y0..y1, altura h; portas = vãos na parede (lado, centro, largura, altura)
  const room = (x0: number, x1: number, y0: number, y1: number, h: number, wall: RGB, floor: RGB, ceil: RGB, gaps: { side: "N" | "S" | "E" | "W"; c: number; w: number; h: number }[] = [], tile = 2) => {
    for (let x = x0; x < x1; x += tile)
      for (let y = y0; y < y1; y += tile) {
        const k = ((x - x0) / tile + (y - y0) / tile) % 2 ? 1 : 0.9;
        quad([x, y, 0], [x + tile, y, 0], [x + tile, y + tile, 0], [x, y + tile, 0], [floor[0] * k, floor[1] * k, floor[2] * k], [0, 0, 1], { tag: "floor" });
        quad([x, y, h], [x, y + tile, h], [x + tile, y + tile, h], [x + tile, y, h], ceil, [0, 0, -1]);
      }
    const inGap = (side: string, u: number, z: number) => gaps.some((g) => g.side === side && Math.abs(u - g.c) < g.w / 2 && z < g.h);
    const rows = Math.max(1, Math.round(h / 1.4));
    const zh = h / rows;
    for (let x = x0; x < x1; x += tile)
      for (let r = 0; r < rows; r++) {
        const z = r * zh;
        const c = r === 0 ? ([wall[0] * 0.85, wall[1] * 0.85, wall[2] * 0.85] as RGB) : wall;
        if (!inGap("N", x + tile / 2, z + 0.01)) quad([x + tile, y1, z], [x, y1, z], [x, y1, z + zh], [x + tile, y1, z + zh], c, [0, -1, 0]);
        if (!inGap("S", x + tile / 2, z + 0.01)) quad([x, y0, z], [x + tile, y0, z], [x + tile, y0, z + zh], [x, y0, z + zh], c, [0, 1, 0]);
      }
    for (let y = y0; y < y1; y += tile)
      for (let r = 0; r < rows; r++) {
        const z = r * zh;
        const c = r === 0 ? ([wall[0] * 0.85, wall[1] * 0.85, wall[2] * 0.85] as RGB) : wall;
        if (!inGap("W", y + tile / 2, z + 0.01)) quad([x0, y, z], [x0, y + tile, z], [x0, y + tile, z + zh], [x0, y, z + zh], c, [1, 0, 0]);
        if (!inGap("E", y + tile / 2, z + 0.01)) quad([x1, y + tile, z], [x1, y, z], [x1, y, z + zh], [x1, y + tile, z + zh], c, [-1, 0, 0]);
      }
  };
  return { F, quad, box, prism, room };
};
// marcador de pessoa no POV (ponto no chão + haste + rótulo), igual ao do labirinto/salto
// o crachá na própria bandeira do marcador: foto + nome (retratos de Mossman e Barney: Combine OverWiki); sem foto = iniciais.
// o crachá na própria bandeira do marcador: foto (quando houver) + nome. Sem foto ainda (Mossman, Barney) = iniciais.
export const MARK_PHOTO: Record<string, string> = {
  ALYX: "hl3silh/alyx_badge.jpg",
  "ALYX VANCE": "hl3silh/alyx_badge.jpg",
  DOG: "hl3silh/dog_badge.jpg",
  ELI: "hl3silh/eli_retrato.png",
  "ELI VANCE": "hl3silh/eli_retrato.png",
  KLEINER: "hl3silh/kleiner_retrato.png",
  GORDON: "hl3silh/gordon_retrato.png",
  MOSSMAN: "hl3silh/mossman_badge.jpg",
  BARNEY: "hl3silh/barney_badge.jpg",
  VARGA: "hl3silh/varga_retrato.png",
  MAGNUSSON: "hl3silh/magnusson_badge.jpg",
};
export const FLAG_NAMES = new Set([...Object.keys(MARK_PHOTO), "MOSSMAN", "BARNEY", "MAGNUSSON"]);
// o crachá desenhado com a base em (cx, by) — a ponta da haste; k = escala
export const FlagBadge: React.FC<{ cx: number; by: number; k: number; label: string; col: string; f: number; sub?: string; photo?: string }> = ({ cx, by, k, label, col, f, sub, photo: ph }) => {
  const W = 104 * k;
  const PH = 112 * k;
  const NH = 26 * k;
  const x0 = cx - W / 2;
  const y0 = by - PH - NH;
  const photo = ph ?? MARK_PHOTO[label];
  const id = `fb${label.replace(/[^A-Z]/g, "")}${Math.round(cx)}${Math.round(by)}`;
  const initials = label.split(" ").map((w) => w[0]).join("").slice(0, 2);
  return (
    <g>
      <defs>
        <clipPath id={id}>
          <rect x={x0 + 4 * k} y={y0 + 4 * k} width={W - 8 * k} height={PH - 4 * k} rx={4 * k} />
        </clipPath>
      </defs>
      <rect x={x0} y={y0} width={W} height={PH + NH} rx={7 * k} fill="rgba(10,8,4,0.92)" stroke={col} strokeWidth={2} />
      {photo ? (
        <image href={staticFile(photo)} x={x0 + 4 * k} y={y0 + 4 * k} width={W - 8 * k} height={PH - 4 * k} preserveAspectRatio="xMidYMid slice" clipPath={`url(#${id})`} />
      ) : (
        <g>
          <rect x={x0 + 4 * k} y={y0 + 4 * k} width={W - 8 * k} height={PH - 4 * k} rx={4 * k} fill="rgba(255,255,255,0.05)" />
          <text x={cx} y={y0 + 4 * k + (PH - 4 * k) / 2 + 14 * k} textAnchor="middle" fill={col} fontFamily={FONT} fontWeight={800} fontSize={40 * k}>{initials}</text>
        </g>
      )}
      <rect x={x0} y={y0 + PH} width={W} height={NH} fill={col} opacity={0.9} />
      <text x={cx} y={y0 + PH + NH * 0.72} textAnchor="middle" fill="#0a0806" fontFamily={MONO} fontWeight={700} fontSize={Math.max(11, 13 * k)} letterSpacing={2}>
        {label}
      </text>
      <circle cx={x0 + W - 8 * k} cy={y0 + 10 * k} r={3.5 * k} fill={col} opacity={0.5 + 0.5 * Math.sin(f / 6)} />
      {sub ? (
        <text x={x0 + W + 12} y={y0 + PH + NH * 0.72} fill="rgba(242,240,247,0.85)" fontFamily={MONO} fontSize={15} letterSpacing={2} style={{ paintOrder: "stroke", stroke: "rgba(0,0,0,0.8)", strokeWidth: 4 }}>
          {sub}
        </text>
      ) : null}
    </g>
  );
};
// 12/10 (pedido dele: crachás "em cima" de estruturas): se o pé do crachá está escondido atrás de alguma coisa, a haste
// sai de trás dela — começa no primeiro ponto visível subindo do chão — e o pé (círculo) não é desenhado
export const stemBase = (e: Eye, x: number, y: number, z0: number, h: number): { z: number; hidden: boolean } => {
  if (!occluded(e, [x, y, z0 + 0.03])) return { z: z0, hidden: false };
  for (let z = z0 + 0.1; z < z0 + h; z += 0.08) if (!occluded(e, [x, y, z])) return { z, hidden: true };
  return { z: z0 + h, hidden: true };
};
export const XMarker: React.FC<{ e: Eye; x: number; y: number; label: string; col: string; f: number; o?: number; sub?: string }> = ({ e, x, y, label, col, f, o = 1, sub }) => {
  const base = proj(e, [x, y, 0]);
  const top = proj(e, [x, y, 1.75]);
  if (!base || !top || o <= 0) return null;
  // atrás de uma parede: o crachá some (não fica desenhado por cima da parede)
  if (occluded(e, [x, y, 2.1]) && occluded(e, [x, y, 1.0])) return null;
  const s = Math.max(0.4, Math.min(2.2, 6 / base.d));
  const k = Math.max(0.75, Math.min(1.3, s));
  const sb = stemBase(e, x, y, 0, 1.75);
  const b2 = sb.hidden ? proj(e, [x, y, sb.z]) ?? base : base;
  return (
    <g opacity={o}>
      {sb.hidden ? null : <ellipse cx={base.x} cy={base.y} rx={34 * s} ry={9 * s} fill="none" stroke={col} strokeWidth={2} strokeDasharray="6 5" strokeDashoffset={-f} />}
      <line x1={b2.x} y1={b2.y} x2={top.x} y2={top.y} stroke={col} strokeWidth={2} />
      {sb.hidden ? null : <circle cx={base.x} cy={base.y} r={4 * s} fill={col} />}
      <FlagBadge cx={top.x} by={top.y} k={k} label={label} col={col} f={f} sub={sub} />
    </g>
  );
};
// aviso de interação do jogo ("[E] ...") preso a um ponto 3D
export const XPrompt: React.FC<{ e: Eye; pt: V3; k: string; text: string; o: number; col?: string }> = ({ e, pt, k, text, o, col = AMB }) => {
  const q = proj(e, pt);
  if (!q || o <= 0) return null;
  return (
    <div style={{ position: "absolute", left: q.x, top: q.y, transform: "translate(-50%, -50%)", opacity: o, display: "flex", alignItems: "center", gap: 14, padding: "10px 18px", background: "rgba(10,8,2,0.7)", border: `1.5px solid ${col}`, borderRadius: 10, fontFamily: MONO, color: col, whiteSpace: "nowrap" }}>
      <span style={{ padding: "2px 10px", border: `1.5px solid ${col}`, borderRadius: 6, fontSize: 20 }}>{k}</span>
      <span style={{ fontSize: 20, letterSpacing: 3 }}>{text}</span>
    </div>
  );
};
export const fadeIO = (f: number, life: number, a = 8) => interpolate(f, [0, a], [1, 0], C) + interpolate(f, [life - 6, life], [0, 1], C);

// ================================================================================================= o Advisor (desenho)
// pelas referências do Paulo (HL2 Ep2 / HL:Alyx): larva em 3/4 com dois gomos de malha bege-acinzentada e faixas escuras;
// NA FRENTE o domo do rosto (anéis creme, borda escura com runas), a grade sanfonada no centro com SÓ DOIS tubos pretos que
// descem e grudam na barriga, as duas luzes verde-água numa plaquinha ao lado; no alto a coroa de metal com luzes e as duas alças curvas; braços
// longos e finos que saem do alto e DESCEM PELA FRENTE, com garras apontando para a frente. `fold` recolhe os braços
// (a larva no casulo); `lit` acende as luzes; `id` separa os gradientes.
export const AdvisorArt: React.FC<{ x: number; y: number; w: number; f: number; fold?: number; lit?: number; id: string; o?: number; flip?: boolean }> = ({ x, y, w, f, fold = 0, lit = 0.4, id, o = 1, flip = false }) => {
  const k = w / 520;
  const br = 1 + 0.015 * Math.sin(f / 14);
  // braço: ombro no alto → cotovelo para fora e para cima → antebraço descendo pela frente → garras
  const arm = (sx: number, sy: number, ex: number, ey: number, wx: number, wy: number, sw: number, back: boolean) => {
    const fx = (v: number, a: number) => v + (a - v) * fold;
    const E: [number, number] = [fx(ex, sx + (ex - sx) * 0.4), fx(ey, sy - 20)];
    const W: [number, number] = [fx(wx, sx + (wx - sx) * 0.35) + Math.sin(f / 26 + sw) * 4, fx(wy, sy + 40)];
    const col = back ? "#3a3c3a" : "#4a4c4a";
    const claws = [-0.5, 0, 0.45].map((d, i) => {
      const a = Math.atan2(W[1] - E[1], W[0] - E[0]) + d;
      const L = 30 + (i === 1 ? 8 : 0);
      return <path key={i} d={`M ${W[0]} ${W[1]} l ${Math.cos(a) * L * 0.6} ${Math.sin(a) * L * 0.6} l ${Math.cos(a - 0.6) * L * 0.5} ${Math.sin(a - 0.6) * L * 0.5}`} fill="none" stroke="#1c1d1c" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />;
    });
    return (
      <g opacity={back ? 0.85 : 1}>
        <path d={`M ${sx} ${sy} L ${E[0]} ${E[1]} L ${W[0]} ${W[1]}`} fill="none" stroke="#141514" strokeWidth={back ? 12 : 15} strokeLinejoin="round" strokeLinecap="round" />
        <path d={`M ${sx} ${sy} L ${E[0]} ${E[1]} L ${W[0]} ${W[1]}`} fill="none" stroke={col} strokeWidth={back ? 6 : 8} strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={E[0]} cy={E[1]} r={back ? 8 : 10} fill="#2a2c2a" stroke="#6a6e6a" strokeWidth={2} />
        <circle cx={W[0]} cy={W[1]} r={6} fill="#2a2c2a" />
        {claws}
      </g>
    );
  };
  return (
    <g transform={`translate(${x} ${y}) scale(${(flip ? -1 : 1) * k} ${k})`} opacity={o}>
      <defs>
        <radialGradient id={`aB${id}`} cx="0.35" cy="0.28" r="0.85">
          <stop offset="0" stopColor="#cfc8b0" />
          <stop offset="0.55" stopColor="#9a9480" />
          <stop offset="1" stopColor="#4e4a3e" />
        </radialGradient>
        <radialGradient id={`aF${id}`} cx="0.4" cy="0.35" r="0.75">
          <stop offset="0" stopColor="#f6f2e8" />
          <stop offset="0.6" stopColor="#d2ccbe" />
          <stop offset="1" stopColor="#8e887a" />
        </radialGradient>
        <pattern id={`aM${id}`} width="10" height="9" patternUnits="userSpaceOnUse">
          <path d="M 0 4.5 L 2.5 0 L 7.5 0 L 10 4.5 L 7.5 9 L 2.5 9 Z" fill="none" stroke="rgba(60,56,44,0.28)" strokeWidth={0.9} />
        </pattern>
        <clipPath id={`aC${id}`}>
          <path d="M -150 20 C -160 -110, 20 -170, 150 -140 C 260 -120, 300 -20, 280 60 C 260 140, 150 175, 20 160 C -100 150, -146 110, -150 20 Z" />
        </clipPath>
      </defs>
      {/* braços de trás */}
      {/* 12/10 (pedido dele): só DOIS braços mecânicos — o de trás saiu */}
      {/* corpo: dois gomos, malha, faixas escuras */}
      <g transform={`scale(${br})`}>
        <path d="M -150 20 C -160 -110, 20 -170, 150 -140 C 260 -120, 300 -20, 280 60 C 260 140, 150 175, 20 160 C -100 150, -146 110, -150 20 Z" fill={`url(#aB${id})`} stroke="#2a2822" strokeWidth={3} />
        <rect x={-170} y={-180} width={480} height={370} fill={`url(#aM${id})`} clipPath={`url(#aC${id})`} />
        <path d="M 90 -150 C 130 -60, 132 60, 96 166" fill="none" stroke="#3a3830" strokeWidth={13} clipPath={`url(#aC${id})`} />
        <path d="M 90 -150 C 130 -60, 132 60, 96 166" fill="none" stroke="#6a665a" strokeWidth={4} clipPath={`url(#aC${id})`} />
        <path d="M 190 -128 C 222 -50, 224 50, 196 140" fill="none" stroke="#3a3830" strokeWidth={9} clipPath={`url(#aC${id})`} opacity={0.8} />
        <path d="M -40 -140 Q 90 -178 230 -112" fill="none" stroke="rgba(255,252,236,0.22)" strokeWidth={14} strokeLinecap="round" />
      </g>
      {/* a coroa de metal no alto, com luzes verde-água */}
      <path d="M -20 -150 Q 40 -182 120 -168 L 150 -142 Q 60 -150 -10 -128 Z" fill="#4a4e50" stroke="#1e2022" strokeWidth={3} />
      <circle cx={58} cy={-160} r={14} fill="#2e3234" stroke="#6a7276" strokeWidth={3} />
      {[[112, -150], [134, -140]].map(([cx, cy], i) => <ellipse key={i} cx={cx} cy={cy} rx={9} ry={6} fill={`rgba(95,232,224,${0.4 + 0.6 * lit})`} style={{ filter: "drop-shadow(0 0 6px #5fe8e0)" }} />)}
      {/* 12/10: as alças curvas por cima saíram (pareciam braços a mais) */}
      {/* o rosto: borda escura com runas e o domo de anéis creme */}
      <ellipse cx={-62} cy={22} rx={104} ry={112} fill="#3e3c36" stroke="#1c1b18" strokeWidth={3} />
      {Array.from({ length: 22 }).map((_, i) => {
        const a = (i / 22) * Math.PI * 2;
        const rx = -62 + Math.cos(a) * 96;
        const ry = 22 + Math.sin(a) * 104;
        return <text key={i} x={rx} y={ry} fill="#8a8678" fontSize={11} fontFamily="Georgia, serif" textAnchor="middle" dominantBaseline="middle" transform={`rotate(${(a * 180) / Math.PI + 90} ${rx} ${ry})`}>{"ϟΨΔΣΩλΞΦ"[i % 8]}</text>;
      })}
      <ellipse cx={-62} cy={22} rx={86} ry={93} fill={`url(#aF${id})`} />
      {[0.82, 0.64, 0.46, 0.3].map((t, i) => <ellipse key={i} cx={-62 - (1 - t) * 6} cy={22 + (1 - t) * 4} rx={86 * t} ry={93 * t} fill="none" stroke="rgba(120,112,96,0.35)" strokeWidth={2} />)}
      {/* a grade sanfonada e os DOIS tubos em U */}
      <rect x={-84} y={4} width={30} height={26} rx={5} fill="#262624" stroke="#121211" strokeWidth={2} />
      {[0, 1, 2, 3].map((i) => <line key={i} x1={-82} x2={-56} y1={9 + i * 6} y2={9 + i * 6} stroke="#5a5a56" strokeWidth={2} />)}
      {/* os DOIS tubos: saem da grade, descem e vão grudar na barriga, embaixo do corpo */}
      <path d={`M -76 30 C -90 150, ${-40 + Math.sin(f / 22) * 5} 250, 30 166`} fill="none" stroke="#0e0e0e" strokeWidth={7} strokeLinecap="round" />
      <path d={`M -62 30 C -70 140, ${10 + Math.sin(f / 19) * 5} 236, 70 160`} fill="none" stroke="#161616" strokeWidth={6} strokeLinecap="round" />
      {/* a plaquinha com as duas luzes verde-água */}
      <rect x={-22} y={20} width={18} height={30} rx={4} fill="#4a4c4a" stroke="#1e1f1e" strokeWidth={2} />
      {[0, 1].map((i) => <circle key={i} cx={-13} cy={28 + i * 13} r={5} fill={`rgba(95,232,224,${0.35 + 0.65 * lit})`} style={{ filter: lit > 0.5 ? "drop-shadow(0 0 7px #5fe8e0)" : undefined }} />)}
      {/* braços da frente: saem do alto e descem pela frente */}
      {arm(-40, -118, -190, -150, -205, 180, 0, false)}
      {arm(110, -148, 190, -222, 246, 186, 1, false)}
    </g>
  );
};

// ================================================================================================= a larva (antes de ser incorporada)
// pelas referências do Paulo (a larva do Breen): SÓ a larva, nada de tecnologia. Corpo em pé, carnudo, verde-acinzentado
// pálido, um gomo de cima (a "cabeça") e a barriga maior estufada para a frente, dobras de pele, uma costura vertical,
// o olhinho escuro, a tromba vermelha saindo de um orifício enrugado na frente, cotocos rosados nos lados. Respira e a
// tromba balança. `lit` acende o contorno de luz (do líquido); `id` separa os gradientes.
const LARVA_BODY = "M -10 -210 C 70 -218, 128 -170, 132 -108 C 135 -70, 118 -50, 124 -30 C 166 20, 174 130, 128 186 C 88 222, -50 228, -112 202 C -170 174, -180 92, -162 30 C -152 -6, -126 -24, -130 -40 C -152 -62, -154 -102, -140 -132 C -122 -182, -70 -208, -10 -210 Z";
export const LarvaArt: React.FC<{ x: number; y: number; w: number; f: number; id: string; o?: number; flip?: boolean; lit?: number; rim?: string }> = ({ x, y, w, f, id, o = 1, flip = false, lit = 0.5, rim = "#9ff5e8" }) => {
  const k = w / 300;
  const br = 1 + 0.014 * Math.sin(f / 13);
  const sw = Math.sin(f / 17) * 10 + Math.sin(f / 7.3) * 3;
  const OX = -140;
  const OY = -92;
  const mid: [number, number] = [-196, -70 + sw * 0.5];
  const tip: [number, number] = [-246, -40 + sw];
  // um cotoco: calombo da própria pele com a ponta rosada
  const nub = (cx: number, cy: number, r: number, rot: number, key: string) => (
    <g key={key} transform={`rotate(${rot} ${cx} ${cy})`}>
      <ellipse cx={cx} cy={cy} rx={r * 1.5} ry={r * 1.25} fill={`url(#lB${id})`} stroke="rgba(58,56,38,0.6)" strokeWidth={1.5} />
      <ellipse cx={cx + r * 0.9} cy={cy} rx={r * 0.75} ry={r * 0.68} fill={`url(#lN${id})`} />
      <circle cx={cx + r * 1.2} cy={cy} r={r * 0.22} fill="rgba(140,60,48,0.8)" />
    </g>
  );
  const trunk = (d: string, wd: number, col: string) => <path d={d} fill="none" stroke={col} strokeWidth={wd} strokeLinecap="round" />;
  const seg1 = `M ${OX} ${OY} C ${OX - 22} ${OY - 6}, ${mid[0] + 22} ${mid[1] - 12}, ${mid[0]} ${mid[1]}`;
  const seg2 = `M ${mid[0]} ${mid[1]} C ${mid[0] - 20} ${mid[1] + 10}, ${tip[0] + 18} ${tip[1] - 8}, ${tip[0]} ${tip[1]}`;
  return (
    <g transform={`translate(${x} ${y}) scale(${(flip ? -1 : 1) * k} ${k})`} opacity={o}>
      <defs>
        <radialGradient id={`lB${id}`} cx="0.34" cy="0.24" r="0.9">
          <stop offset="0" stopColor="#d6d3ae" />
          <stop offset="0.42" stopColor="#aeaa82" />
          <stop offset="0.78" stopColor="#7a7654" />
          <stop offset="1" stopColor="#46432e" />
        </radialGradient>
        <linearGradient id={`lS${id}`} x1="0.1" y1="0.1" x2="0.95" y2="0.85">
          <stop offset="0" stopColor="rgba(30,30,16,0)" />
          <stop offset="0.55" stopColor="rgba(30,30,16,0.08)" />
          <stop offset="1" stopColor="rgba(22,22,10,0.62)" />
        </linearGradient>
        <linearGradient id={`lO${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="rgba(26,26,12,0.7)" />
          <stop offset="1" stopColor="rgba(26,26,12,0)" />
        </linearGradient>
        <radialGradient id={`lN${id}`} cx="0.4" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#f0b8a0" />
          <stop offset="0.6" stopColor="#cf8268" />
          <stop offset="1" stopColor="#8a4a3a" />
        </radialGradient>
        <radialGradient id={`lH${id}`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="rgba(255,255,240,0.6)" />
          <stop offset="1" stopColor="rgba(255,255,240,0)" />
        </radialGradient>
        <clipPath id={`lC${id}`}>
          <path d={LARVA_BODY} />
        </clipPath>
        <filter id={`lT${id}`} x="0" y="0" width="1" height="1">
          <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves={3} seed={7} />
          <feColorMatrix values="0 0 0 0 0.18  0 0 0 0 0.18  0 0 0 0 0.08  0 0 0 1.1 -0.45" />
        </filter>
      </defs>
      {nub(118, -84, 11, -30, "nb")}
      <g transform={`translate(0 210) scale(${2 - br} ${br}) translate(0 -210)`}>
        <path d={LARVA_BODY} fill="none" stroke={rim} strokeWidth={10} opacity={0.12 + 0.35 * lit} style={{ filter: "blur(6px)" }} />
        <path d={LARVA_BODY} fill={`url(#lB${id})`} stroke="#34321f" strokeWidth={3} />
        <g clipPath={`url(#lC${id})`}>
          <rect x={-190} y={-230} width={380} height={470} filter={`url(#lT${id})`} opacity={0.22} />
          {/* o gomo de cima caindo por cima da barriga: sombra logo abaixo da dobra */}
          <path d="M -134 -36 C -60 0, 60 -6, 128 -28 L 150 40 C 60 30, -60 40, -170 20 Z" fill={`url(#lO${id})`} />
          <path d="M -132 -40 C -60 -4, 60 -10, 126 -30" fill="none" stroke="rgba(34,34,16,0.85)" strokeWidth={7} style={{ filter: "blur(1.5px)" }} />
          <path d="M -128 -50 C -60 -16, 60 -20, 124 -40" fill="none" stroke="rgba(255,255,232,0.22)" strokeWidth={5} style={{ filter: "blur(2px)" }} />
          {/* rugas em volta do orifício (pele franzida), sem nada parecido com boca */}
          {[22, 32, 44].map((r, i) => (
            <path key={i} d={`M ${OX + r * 0.5} ${OY - r} A ${r} ${r * 0.9} 0 0 1 ${OX + r * 0.6} ${OY + r * 0.9}`} fill="none" stroke={`rgba(44,42,24,${0.5 - i * 0.12})`} strokeWidth={3 - i * 0.6} style={{ filter: "blur(0.8px)" }} />
          ))}
          {/* dobra baixa e pregas da base */}
          <path d="M -156 132 C -90 172, 40 182, 150 128" fill="none" stroke="rgba(44,42,24,0.5)" strokeWidth={5} style={{ filter: "blur(2px)" }} />
          <path d="M -150 146 C -90 184, 40 194, 148 142" fill="none" stroke="rgba(255,255,232,0.14)" strokeWidth={4} style={{ filter: "blur(2px)" }} />
          <path d="M -40 -2 C -52 50, -50 120, -34 210" fill="none" stroke="rgba(44,42,24,0.35)" strokeWidth={2.5} />
          <path d="M 80 -200 C 100 -170, 118 -150, 128 -112" fill="none" stroke="rgba(44,42,24,0.28)" strokeWidth={3} style={{ filter: "blur(1px)" }} />
          {/* volume e brilho úmido */}
          <rect x={-190} y={-230} width={380} height={470} fill={`url(#lS${id})`} />
          <ellipse cx={-50} cy={-172} rx={66} ry={26} fill={`url(#lH${id})`} transform="rotate(-14 -50 -172)" />
          <ellipse cx={-118} cy={74} rx={30} ry={64} fill={`url(#lH${id})`} opacity={0.75} transform="rotate(12 -118 74)" />
          <ellipse cx={40} cy={70} rx={50} ry={24} fill={`url(#lH${id})`} opacity={0.3} />
          <ellipse cx={-136} cy={-118} rx={10} ry={22} fill={`url(#lH${id})`} opacity={0.6} />
        </g>
        {/* o olhinho, pequeno e afundado no alto */}
        <ellipse cx={-62} cy={-160} rx={8} ry={6} fill="rgba(60,56,36,0.55)" />
        <circle cx={-62} cy={-160} r={3.6} fill="#121210" />
        <circle cx={-63.5} cy={-161.5} r={1.2} fill="rgba(255,255,255,0.85)" />
        {/* o orifício */}
        <ellipse cx={OX} cy={OY} rx={11} ry={13} fill="#4e4030" />
        <ellipse cx={OX - 2} cy={OY} rx={6} ry={8} fill="#24160e" />
      </g>
      {/* a tromba: grossa no orifício, afinando até a ponta, úmida */}
      {trunk(seg1, 20, "#4a140e")}
      {trunk(seg1, 15, "#b0402c")}
      {trunk(seg2, 13, "#4a140e")}
      {trunk(seg2, 9, "#b84a32")}
      <path d={`M ${OX - 2} ${OY - 6} C ${OX - 22} ${OY - 12}, ${mid[0] + 22} ${mid[1] - 18}, ${mid[0]} ${mid[1] - 5}`} fill="none" stroke="rgba(255,180,150,0.6)" strokeWidth={3} strokeLinecap="round" />
      {nub(144, 36, 11, 20, "n1")}
      {nub(132, 150, 13, 35, "n2")}
      {nub(-84, 204, 10, 80, "n3")}
    </g>
  );
};

// ================================================================================================= gente em silhueta
// personagem desenhado só pela silhueta (CC0 humana ou o contorno do vort.glb), com VOLUME: gradiente por dentro (luz de
// cima, escuro embaixo), contorno de luz colorido (drop-shadow) e, se for o caso, um olho aceso. Respira de leve.
export const SilhouetteAt: React.FC<{ e: Eye; x: number; y: number; h: number; src: string; ar: number; f: number; o?: number; flip?: boolean; rim?: string; top?: string; bot?: string; eye?: [number, number, string]; label?: string; labelCol?: string; sub?: string; bob?: number; jitter?: number }> = ({ e, x, y, h, src, ar, f, o = 1, flip, rim = "rgba(255,255,255,0.6)", top = "#3a3a36", bot = "#0a0a0a", eye, label, labelCol = ORANGE, sub, bob = 0, jitter = 0 }) => {
  const base = proj(e, [x, y, 0]);
  const head = proj(e, [x, y, h]);
  if (!base || !head || o <= 0) return null;
  const H = base.y - head.y;
  if (H < 4) return null;
  const W = H * ar;
  const br = 1 + 0.012 * Math.sin(f / 11 + x * 3);
  const url = `url(${staticFile(src)})`;
  return (
    <div style={{ position: "absolute", left: base.x - W / 2 + jitter, top: head.y + bob, width: W, height: H, opacity: o }}>
      <div style={{ position: "absolute", inset: 0, filter: `drop-shadow(0 0 ${Math.max(2, H * 0.012)}px ${rim}) drop-shadow(0 0 ${Math.max(4, H * 0.04)}px ${rim})`, transform: `scaleX(${flip ? -1 : 1}) scaleY(${br})`, transformOrigin: "50% 100%" }}>
        <div style={{ position: "absolute", inset: 0, WebkitMaskImage: url, maskImage: url, WebkitMaskSize: "100% 100%", maskSize: "100% 100%", background: `linear-gradient(180deg, ${top} 0%, ${bot} 85%)` }} />
        {eye ? <div style={{ position: "absolute", left: `${eye[0] * 100}%`, top: `${eye[1] * 100}%`, width: Math.max(3, H * 0.022), height: Math.max(3, H * 0.022), marginLeft: -Math.max(1.5, H * 0.011), borderRadius: "50%", background: eye[2], boxShadow: `0 0 ${Math.max(4, H * 0.03)}px ${eye[2]}` }} /> : null}
      </div>
      {label ? (
        <div style={{ position: "absolute", left: "100%", top: 0, marginLeft: 8, fontFamily: MONO, letterSpacing: 3, whiteSpace: "nowrap", textShadow: "0 2px 8px #000" }}>
          <div style={{ fontSize: Math.max(13, Math.min(18, H * 0.06)), color: labelCol }}>{label}</div>
          {sub ? <div style={{ fontSize: Math.max(12, Math.min(15, H * 0.05)), color: "rgba(242,240,247,0.7)", marginTop: 3 }}>{sub}</div> : null}
        </div>
      ) : null}
    </div>
  );
};

// a sala do casulo (a mesma no casulo e na escolha)
// 08/10 (pedido dele: os aros do casulo têm que ser 3D e encostar na borda): faixas em volta do vidro numa camada
// própria por cima da sala, só as placas viradas para a câmera — a metade de trás fica escondida pelo vidro
export const PodRingsView: React.FC<{ e: Eye; o?: number; noMid?: boolean }> = ({ e, o = 1, noMid }) => {
  const faces: XF[] = [];
  const R = 1.12;
  for (const z of noMid ? [0.5, 2.55] : [0.5, 1.5, 2.55])
    for (let i = 0; i < 40; i++) {
      const a0 = (i / 40) * Math.PI * 2;
      const a1 = ((i + 1) / 40) * Math.PI * 2;
      const am = (a0 + a1) / 2;
      const n: V3 = [Math.cos(am), Math.sin(am), 0];
      const mx = Math.cos(am) * R;
      const my = 9.2 + Math.sin(am) * R;
      if ((e.x - mx) * n[0] + (e.y - my) * n[1] <= 0) continue;
      faces.push({ p: [[Math.cos(a0) * R, 9.2 + Math.sin(a0) * R, z], [Math.cos(a1) * R, 9.2 + Math.sin(a1) * R, z], [Math.cos(a1) * R, 9.2 + Math.sin(a1) * R, z + 0.09], [Math.cos(a0) * R, 9.2 + Math.sin(a0) * R, z + 0.09]], col: [110, 255, 235], n, emit: 0.95 });
    }
  return (
    <div style={{ position: "absolute", inset: 0, opacity: o, filter: "drop-shadow(0 0 8px rgba(110,255,235,0.75))" }}>
      <XView e={e} faces={faces} lights={[]} />
    </div>
  );
};
// 12/10 (pedido dele: o vidro e os aros azuis — a parte de baixo não parecia ir até o fim, círculo sem perspectiva): o
// vidro, o líquido e os dois aros de luz agora são objetos 3D na MESMA cena com profundidade. Os aros dão a volta inteira
// (a metade de trás aparece através do vidro, mais apagada), o de baixo encosta no pedestal e o de cima na tampa.
export const makePodDeco = (): THREE.Group => {
  const g2 = new THREE.Group();
  const liq = new THREE.Mesh(new THREE.CylinderGeometry(1.03, 1.03, 2.13, 64, 1, true), new THREE.MeshBasicMaterial({ color: "#5fe0cc", transparent: true, opacity: 0.1, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
  const gl2 = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, 2.15, 64, 1, true), new THREE.MeshPhysicalMaterial({ color: "#bffff4", roughness: 0.05, metalness: 0, transparent: true, opacity: 0.14, depthWrite: false, side: THREE.DoubleSide }));
  liq.renderOrder = 3;
  gl2.renderOrder = 4;
  liq.position.y = gl2.position.y = 0.45 + 2.15 / 2;
  g2.add(liq, gl2);
  // aros: a faixa acesa (anel inteiro) + um halo transparente em volta
  for (const [z0, z1] of [[0.45, 0.58], [2.47, 2.6]]) {
    const h = z1 - z0;
    const band = new THREE.Mesh(new THREE.CylinderGeometry(1.085, 1.085, h, 72, 1, true), new THREE.MeshBasicMaterial({ color: "#7dfff0", side: THREE.DoubleSide, toneMapped: false }));
    band.position.y = (z0 + z1) / 2;
    const rimIn = new THREE.Mesh(new THREE.RingGeometry(1.05, 1.085, 72), new THREE.MeshBasicMaterial({ color: "#3fbfb0", side: THREE.DoubleSide, toneMapped: false }));
    rimIn.rotation.x = -Math.PI / 2;
    rimIn.position.y = z1;
    const halo = new THREE.Mesh(new THREE.CylinderGeometry(1.14, 1.14, h * 2.6, 72, 1, true), new THREE.MeshBasicMaterial({ color: "#6effe6", transparent: true, opacity: 0.16, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false }));
    halo.position.y = (z0 + z1) / 2;
    halo.renderOrder = 5;
    g2.add(band, rimIn, halo);
  }
  g2.position.set(0, 0, -9.2);
  return g2;
};
export const buildPodRoom = (): XF[] => {
  const g = mk();
  // sala Combine: metal escuro azulado, piso de grade, porta atrás
  g.room(-6, 6, 0, 12, 3.6, [34, 40, 46], [30, 33, 36], [16, 18, 21], [{ side: "S", c: 0, w: 2.4, h: 2.4 }]);
  // nervuras verticais nas paredes laterais e no fundo
  for (let y = 1; y < 12; y += 2) {
    g.box(-6, y - 0.12, 0, 0.28, 0.24, 3.6, [22, 26, 30]);
    g.box(5.72, y - 0.12, 0, 0.28, 0.24, 3.6, [22, 26, 30]);
  }
  for (let x = -5; x <= 5; x += 2) if (Math.abs(x) > 1.6) g.box(x - 0.12, 11.72, 0, 0.24, 0.28, 3.6, [22, 26, 30]);
  // tubulação no teto (sai do casulo para os lados)
  g.box(-6, 9.0, 3.25, 12, 0.22, 0.22, [44, 48, 50]);
  g.box(-0.11, 0, 3.3, 0.22, 12, 0.2, [44, 48, 50]);
  // painel Combine atrás do casulo, com frestas acesas
  g.box(-2.2, 11.4, 0.3, 4.4, 0.3, 3.0, [26, 30, 34]);
  for (let k = 0; k < 5; k++) g.box(-1.9 + k * 0.85, 11.36, 0.6, 0.12, 0.05, 2.4, [80, 230, 210], { emit: 0.55 });
  // o casulo: base, vidro escuro com anéis de luz, tampa
  // 11/10 (pedido dele: o cilindro parecia aberto): casulo FECHADO — pedestal em dois degraus, anel de base, o vidro
  // (tag pod), seis montantes de metal em volta do vidro, a tampa larga que fecha em cima e o cubo de onde saem os cabos
  g.prism(0, 9.2, 0, 0.18, 1.6, 16, [30, 34, 38]);
  g.prism(0, 9.2, 0.18, 0.35, 1.32, 16, [40, 44, 50]);
  g.prism(0, 9.2, 0.35, 0.45, 1.18, 24, [56, 62, 68]);
  g.prism(0, 9.2, 0.45, 2.6, 1.05, 24, [14, 46, 44], { emit: 0.42, tag: "pod" });
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2 + Math.PI / 6;
    // 11/10: só os montantes de trás (os da frente cortavam a larva no meio)
    if (Math.sin(a) < 0.1) continue;
    g.box(Math.cos(a) * 1.12 - 0.05, 9.2 + Math.sin(a) * 1.12 - 0.05, 0.4, 0.1, 0.1, 2.25, [48, 54, 60]);
  }
  g.prism(0, 9.2, 2.6, 2.72, 1.2, 24, [56, 62, 68]);
  g.prism(0, 9.2, 2.72, 2.95, 1.0, 16, [40, 44, 50]);
  g.prism(0, 9.2, 2.95, 3.6, 0.5, 8, [30, 34, 38]);
  // máquina de suporte (esquerda) + alavanca + tela
  g.box(-5.6, 6.4, 0, 1.4, 2.6, 2.1, [44, 50, 52]);
  // 08/10 (pedido dele): só UM botão vermelho (a alavanca); a luz vermelha do lado parecia outro botão, e a tela deitada
  // em cima da máquina parecia um feixe azul solto — virou um monitor de pé, virado para a sala
  // a alavanca: placa escura na face da máquina, haste vermelha e pegador
  g.box(-4.24, 7.25, 1.05, 0.04, 0.5, 0.75, [38, 40, 42]);
  g.box(-4.22, 7.44, 1.2, 0.12, 0.12, 0.45, [200, 50, 36], { tag: "lever" });
  g.box(-4.18, 7.36, 1.62, 0.2, 0.28, 0.12, [220, 60, 44], { tag: "lever" });
  g.box(-4.24, 6.6, 1.2, 0.05, 0.6, 0.6, [30, 34, 36]);
  g.box(-4.2, 6.64, 1.25, 0.02, 0.52, 0.5, [90, 220, 200], { emit: 0.45 });
  // consoles à direita
  g.box(4.2, 5.5, 0, 1.6, 4.5, 1.0, [40, 46, 50]);
  g.box(4.3, 5.7, 1.0, 0.1, 4.1, 0.9, [60, 160, 180], { emit: 0.38 });
  // porta (atrás): batente aceso e placa de saída
  g.box(-1.15, -0.04, 0, 0.12, 0.08, 2.45, [220, 70, 50], { emit: 0.7 });
  g.box(1.03, -0.04, 0, 0.12, 0.08, 2.45, [220, 70, 50], { emit: 0.7 });
  g.box(-0.6, -0.05, 2.55, 1.2, 0.1, 0.3, [230, 80, 55], { emit: 1, tag: "exit" });
  // corredor escuro atrás da porta
  for (let y = -6; y < 0; y += 2) {
    g.quad([-1, y, 0], [1, y, 0], [1, y + 2, 0], [-1, y + 2, 0], [22, 24, 26], [0, 0, 1]);
    g.quad([-1, y, 0], [-1, y + 2, 0], [-1, y + 2, 2.4], [-1, y, 2.4], [20, 22, 25], [1, 0, 0]);
    g.quad([1, y + 2, 0], [1, y, 0], [1, y, 2.4], [1, y + 2, 2.4], [20, 22, 25], [-1, 0, 0]);
    g.quad([-1, y, 2.4], [-1, y + 2, 2.4], [1, y + 2, 2.4], [1, y, 2.4], [12, 13, 15], [0, 0, -1]);
  }
  g.quad([1, -6, 0], [-1, -6, 0], [-1, -6, 2.4], [1, -6, 2.4], [6, 7, 8], [0, 1, 0]);
  g.box(-0.4, -5.95, 2.2, 0.8, 0.05, 0.08, [255, 240, 210], { emit: 0.6 });
  return g.F;
};
// ================================================================================================= 6 · a escolha (POV)
// a sala do casulo vista pelo Gordon: o casulo verde-água no fundo (cabos do teto, pulso do suporte); à esquerda a máquina
// de suporte com a alavanca ([E] DESLIGAR O SUPORTE); atrás, a porta com a placa de saída ([E] SAIR DA SALA). A câmera
// olha o casulo → vira para a alavanca → vira para a porta → volta ao meio, as duas opções acesas; ESCOLHA REGISTRADA.
export const HLXChoice: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [noForceAt, offAt, dieAt, leaveAt, keepAt, sufferAt, smallAt, notChangeAt, regAt] = ["noForceAt", "offAt", "dieAt", "leaveAt", "keepAt", "sufferAt", "smallAt", "notChangeAt", "regAt"].map((k) => at(p, k));
  const G = useMemo(() => buildPodRoom(), []);
  // câmera: olha o casulo → alavanca (esquerda) → porta (atrás) → meio
  const yaw = keys(f, [
    [0, 0.05],
    [offAt - 6, 0.05],
    [offAt + 26, -0.78],
    [leaveAt - 4, -0.78],
    [leaveAt + 40, -2.75],
    [sufferAt + 10, -2.75],
    [sufferAt + 46, -0.32],
    [life, -0.3],
  ]);
  const y = keys(f, [
    [0, 3.0],
    [offAt, 4.6],
    [leaveAt, 4.6],
    [sufferAt + 46, 4.0],
  ]);
  const cam = (fr: number): Eye => ({ x: 0.6 * Math.sin(fr / 90), y: keys(fr, [[0, 3.0], [offAt, 4.6], [leaveAt, 4.6], [sufferAt + 46, 4.0]]), z: 1.65 + 0.02 * Math.sin(fr / 9), yaw: keys(fr, [[0, 0.05], [offAt - 6, 0.05], [offAt + 26, -0.78], [leaveAt - 4, -0.78], [leaveAt + 40, -2.75], [sufferAt + 10, -2.75], [sufferAt + 46, -0.32], [life, -0.3]]), pitch: -0.04, F: 980 });
  const e: Eye = cam(f);
  const beat = (f % 34) < 4 ? 1 : 0;
  const lights: XL[] = [
    { x: 0, y: 9.2, z: 1.6, col: [60, 255, 225], k: 0.32 + 0.1 * beat, r: 6.5 },
    { x: -4.9, y: 7.6, z: 2.4, col: [120, 240, 220], k: 0.25, r: 4 },
    { x: 0, y: 0.4, z: 2.5, col: [255, 90, 60], k: 0.35, r: 5 },
  ];
  const lv = proj(e, [-4.15, 7.55, 1.75]);
  const offO = P(f, offAt, 10) * (f >= smallAt ? 0.95 : 1);
  const outO = P(f, leaveAt + 20, 10);
  const reg = P(f, regAt, 10);
  return (
    <AbsoluteFill style={{ background: "#020304", overflow: "hidden" }}>
      {/* 08/10 (pedido dele): a máquina é a MESMA da primeira vez (o casulo com o Breen, os anéis, os cabos) */}
      <HLXPod {...({ life, final: 1, podAt: -60, cablesAt: -60, larvalAt: -60, looksAt: -90, advAt: 1e9, voiceAt: 1e9, freemanAt: 1e9, breenAt: -60, believesAt: 1e9, mossAt: 1e9, cam, noHud: true } as unknown as PR)} />
      {/* opções do jogo */}
      <XPrompt e={e} pt={[-4.15, 7.55, 2.05]} k="E" text={f >= dieAt ? "DESLIGAR O SUPORTE · O BREEN MORRE" : "DESLIGAR O SUPORTE"} o={offO * (lv ? 1 : 0)} col={RED} />
      <XPrompt e={e} pt={[0, -0.4, 1.7]} k="E" text={f >= keepAt ? "SAIR · OS APARELHOS CONTINUAM" : "SAIR DA SALA"} o={outO} col={ICE} />
      {/* o suporte continua: sinais vitais do casulo */}
      {f >= sufferAt ? (
        <div style={{ position: "absolute", right: 90, top: 200, width: 420, padding: "16px 20px", background: "rgba(4,14,13,0.75)", border: `1px solid ${TEAL}`, borderRadius: 12, opacity: P(f, sufferAt, 10) }}>
          <div style={{ fontFamily: MONO, fontSize: 14, letterSpacing: 5, color: TEAL }}>SUPORTE · ATIVO</div>
          <svg width={380} height={60} style={{ marginTop: 6 }}>
            <polyline points={Array.from({ length: 76 }).map((_, i) => { const ph = (i * 5 + f * 4) % 120; return `${i * 5},${30 - (ph > 50 && ph < 56 ? 24 : ph > 56 && ph < 60 ? -14 : 0)}`; }).join(" ")} fill="none" stroke={TEAL} strokeWidth={2} />
          </svg>
          <div style={{ fontFamily: MONO, fontSize: 14, letterSpacing: 3, color: "rgba(242,240,247,0.7)" }}>CONTINUA EXISTINDO · SOFRENDO</div>
        </div>
      ) : null}
      <Hud f={f} yaw={yaw} eye={e} blips={[{ x: 0, y: 9.2, hot: true }]} msg={f >= noForceAt && f < offAt ? "NENHUMA DECISÃO OBRIGATÓRIA" : f >= smallAt && f < regAt ? (f >= notChangeAt ? "NÃO MUDA A HISTÓRIA" : "UMA ESCOLHA PEQUENA") : undefined} msgCol={CREAM} />
      {reg > 0 ? (
        <div style={{ position: "absolute", right: 90, top: 110, display: "flex", alignItems: "center", gap: 14, padding: "12px 20px", background: "rgba(6,16,10,0.85)", border: `1.5px solid ${GREEN}`, borderRadius: 10, fontFamily: MONO, color: GREEN, opacity: reg, transform: `translateX(${(1 - reg) * 40}px)` }}>
          <svg width={26} height={26}>
            <circle cx={13} cy={13} r={10} fill="none" stroke={GREEN} strokeWidth={2.5} strokeDasharray={`${63 * Math.min(1, (f - regAt) / 20)} 63`} transform="rotate(-90 13 13)" />
          </svg>
          <span style={{ fontSize: 20, letterSpacing: 5 }}>ESCOLHA REGISTRADA</span>
        </div>
      ) : null}
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ================================================================================================= 6 · o casulo (POV)
// o Gordon entra na sala pela porta (de costas para ela) e anda até o casulo; olha os cabos no teto; a forma lá dentro
// (larva de Advisor?) → ELA OLHA PARA ELE: 1 s de imagem real do Advisor (Overworld) em corte seco → "Freeman." grande →
// a etiqueta vira WALLACE BREEN? → a Mossman (marcador) parada atrás, sem entender.
// 08/10 (pedido dele: "o aro azul some quando a câmera sobe"): os três anéis do casulo em 3D de verdade — cada anel é
// um círculo projetado; a metade mais longe que o eixo do casulo vai ATRÁS do vidro, a mais perto vai NA FRENTE
const POD_RINGS = [0.5, 1.5, 2.55];
const podRing = (e: Eye, z: number, front: boolean, w: number, o: number, key: string) => {
  const cen = proj(e, [0, 9.2, z]);
  if (!cen) return null;
  const segs: string[] = [];
  let cur: string[] = [];
  for (let i = 0; i <= 48; i++) {
    const a = (i / 48) * Math.PI * 2;
    const q = proj(e, [Math.cos(a) * 1.12, 9.2 + Math.sin(a) * 1.12, z]);
    const isFront = q ? q.d < cen.d : false;
    if (q && isFront === front) cur.push(`${q.x.toFixed(1)},${q.y.toFixed(1)}`);
    else if (cur.length) {
      segs.push(cur.join(" "));
      cur = [];
    }
  }
  if (cur.length) segs.push(cur.join(" "));
  const sw = Math.max(2.5, (w * 980) / Math.max(0.5, cen.d));
  return (
    <g key={key} opacity={o}>
      {segs.map((pts, i) => (
        <g key={i}>
          <polyline points={pts} fill="none" stroke="rgba(110,255,235,0.35)" strokeWidth={sw * 2.6} strokeLinecap="round" style={{ filter: "blur(4px)" }} />
          <polyline points={pts} fill="none" stroke={front ? "#7dfff0" : "#3fb8aa"} strokeWidth={sw} strokeLinecap="round" />
        </g>
      ))}
    </g>
  );
};
// aproximação lenta e linear do casulo (o Breen): y0 → y1 ao longo da cena; balanço lateral que começa e termina em 0
// para duas cenas seguidas emendarem sem salto
const podPush = (fr: number, len: number, y0: number, y1: number): Eye => {
  const t = Math.max(0, Math.min(1, fr / Math.max(1, len)));
  return { x: 0.12 * Math.sin(Math.PI * t), y: y0 + (y1 - y0) * t, z: 1.65, yaw: 0, pitch: 0.02, F: 980 };
};
export const HLXPod: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [podAt, cablesAt, larvalAt, advAt, looksAt, voiceAt, freemanAt, breenAt, believesAt, mossAt] = ["podAt", "cablesAt", "larvalAt", "advAt", "looksAt", "voiceAt", "freemanAt", "breenAt", "believesAt", "mossAt"].map((k) => at(p, k));
  const G = useMemo(() => buildPodRoom(), []);
  const y = keys(f, [
    [0, 0.6],
    [podAt, 2.0],
    [larvalAt, 4.3],
    [looksAt, 4.8],
    [mossAt, 4.8],
  ]);
  const pitch = keys(f, [
    [0, -0.03],
    [cablesAt, -0.03],
    [cablesAt + 24, 0.32],
    [larvalAt - 6, 0.32],
    [larvalAt + 20, 0.02],
  ]);
  const yaw = keys(f, [
    [0, 0],
    [mossAt - 4, 0],
    [mossAt + 26, -0.3],
  ]);
  const shake = f >= looksAt && f < looksAt + 40 ? Math.sin(f * 2.1) * 0.006 * (1 - (f - looksAt) / 40) : 0;
  const camFn = (p as unknown as { cam?: (fr: number) => Eye }).cam;
  const e: Eye = camFn ? camFn(f) : { x: 0.15 * Math.sin(f / 70), y, z: 1.65 + 0.03 * Math.sin(f / 8) * (f < larvalAt ? 1 : 0.3), yaw: yaw + shake, pitch, F: 980 };
  const noHud = !!(p as unknown as { noHud?: boolean }).noHud;
  const beat = (f % 34) < 4 ? 1 : 0;
  const lights: XL[] = [
    { x: 0, y: 9.2, z: 1.6, col: [60, 255, 225], k: 0.32 + 0.1 * beat + (f >= looksAt ? 0.2 : 0), r: 6.5 },
    { x: -4.9, y: 7.6, z: 2.4, col: [120, 240, 220], k: 0.25, r: 4 },
  ];
  // o corte seco para o Advisor real (1,2 s) quando ela olha
  // 08/10 (pedido dele): sem o corte de footage quando ela olha — fica tudo linear na simulação; o olhar é a luz acendendo
  const insert = false;
  const label = p.final ? "WALLACE BREEN" : f >= breenAt ? "WALLACE BREEN?" : f >= larvalAt ? "LARVA · ADVISOR?" : f >= podAt ? "ESTRUTURA COMBINE · SUPORTE" : "";
  const c = proj(e, [0, 9.2, 1.55]);
  // 11/10 (pedido dele): o Advisor 3D do jogo encolhido dentro do casulo (no lugar do desenho), virado para quem chega;
  // quando ele olha, a cabeça sobe e os braços se abrem um pouco
  const [POD] = useAdvisors(1, 1.75, true);
  const lookK = P(f, looksAt, 24);
  if (POD) {
    placeAdvisor(POD, [0, 9.2 + 0.05, 1.5 + 0.04 * Math.sin(f / 30)], [e.x, e.y, 1.5 + 0.9 * lookK], 0.95 - 0.55 * lookK);
    POD.pose(f / 30, 0);
  }
  // o vidro e o líquido de verdade (transparentes, dentro da mesma cena com profundidade)
  const podGlass = useMemo(() => makePodDeco(), []);
  const podL = useMemo(() => {
    const pl = new THREE.PointLight("#e0fff8", 150, 12, 1.2);
    pl.position.set(0.5, 2.0, -8.0);
    const pl2 = new THREE.PointLight("#7fffe0", 40, 8, 1.2);
    pl2.position.set(-0.8, 0.6, -8.4);
    return [...advLightsFor([0.8, 6.0, 3.4], "#e8fff8", "#a8d8d0", 2.2, [0, 9.2, 1.5]), pl, pl2];
  }, []);
  return (
    <AbsoluteFill style={{ background: "#020304", overflow: "hidden" }}>
      <XView e={e} faces={G} lights={lights} flash={1.1} amb={0.06} hide={(fc) => fc.tag === "pod"} extras={POD ? [POD.root, podGlass] : [podGlass]} glLights={POD ? podL : []} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <defs>
          <radialGradient id="podShape" cx="0.5" cy="0.55" r="0.5">
            <stop offset="0" stopColor="rgba(2,8,8,0.92)" />
            <stop offset="0.6" stopColor="rgba(4,14,14,0.6)" />
            <stop offset="1" stopColor="rgba(4,14,14,0)" />
          </radialGradient>
        </defs>
        {Array.from({ length: 9 }).map((_, i) => {
          const a = (i / 9) * Math.PI * 2;
          const top = proj(e, [Math.cos(a) * 2.6, 9.2 + Math.sin(a) * 2.2, 3.6]);
          const mid = proj(e, [Math.cos(a) * 1.4, 9.2 + Math.sin(a) * 1.2, 3.3 - 0.25 * Math.sin(f / 40 + i)]);
          const end = proj(e, [Math.cos(a) * 0.45, 9.2 + Math.sin(a) * 0.45, 3.2]);
          if (!top || !mid || !end) return null;
          const lit = f >= cablesAt ? 0.5 + 0.5 * Math.max(0, Math.sin(f / 5 - i)) : 0;
          return (
            <g key={i}>
              <path d={`M ${top.x} ${top.y} Q ${mid.x} ${mid.y + 30} ${end.x} ${end.y}`} fill="none" stroke="#0a0d0e" strokeWidth={Math.max(2, 26 / mid.d)} />
              {lit > 0 ? <path d={`M ${top.x} ${top.y} Q ${mid.x} ${mid.y + 30} ${end.x} ${end.y}`} fill="none" stroke={TEAL} strokeWidth={1.5} strokeDasharray="4 40" strokeDashoffset={-f * 3} opacity={lit} /> : null}
            </g>
          );
        })}
        {/* 08/10 (pedido dele): a metade de trás dos aros fica escondida pelo cilindro de vidro (mesmo raio) — só a frente aparece */}
        {c ? (
          <g>
            <ellipse cx={c.x} cy={c.y} rx={(900 / c.d) * 0.6} ry={(900 / c.d) * 1.0} fill="url(#podShape)" opacity={0} />
            {/* a larva dentro do vidro: corpo segmentado, pálido, respirando; o olho acende quando ela olha */}
            {(() => {
              const u = 900 / c.d;
              const br = 1 + 0.03 * Math.sin(f / 9);
              const reveal = P(f, larvalAt - 20, 30);
              return (
                <g opacity={0.35 + 0.65 * reveal}>
                  <defs>
                    <radialGradient id="grubSkin" cx="0.4" cy="0.35" r="0.7">
                      <stop offset="0" stopColor="#efe0c8" />
                      <stop offset="0.6" stopColor="#b59a80" />
                      <stop offset="1" stopColor="#5a4636" />
                    </radialGradient>
                  </defs>
                  <defs>
                    <clipPath id="podIn">
                      <ellipse cx={c.x} cy={c.y} rx={u * 0.56} ry={u * 0.95} />
                    </clipPath>
                    <radialGradient id="podLiq" cx="0.5" cy="0.6" r="0.6">
                      <stop offset="0" stopColor="rgba(40,140,130,0.55)" />
                      <stop offset="1" stopColor="rgba(4,30,30,0.9)" />
                    </radialGradient>
                    <linearGradient id="podGlass" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0" stopColor="rgba(200,255,250,0.0)" />
                      <stop offset="0.18" stopColor="rgba(200,255,250,0.28)" />
                      <stop offset="0.26" stopColor="rgba(200,255,250,0.0)" />
                      <stop offset="0.7" stopColor="rgba(200,255,250,0.0)" />
                      <stop offset="0.78" stopColor="rgba(200,255,250,0.12)" />
                      <stop offset="1" stopColor="rgba(200,255,250,0.0)" />
                    </linearGradient>
                  </defs>
                  <ellipse cx={c.x} cy={c.y} rx={u * 0.56} ry={u * 0.95} fill="url(#podLiq)" opacity={0} />
                  <g>
                    {/* o Breen: o Advisor do Alyx (o desenho aprovado) encolhido no casulo, braços recolhidos, respirando
                        no líquido; quando ele olha para o Gordon as luzes acendem e os braços se abrem um pouco */}
                    <g opacity={0} style={{ filter: `saturate(0.85) brightness(${0.6 + 0.4 * reveal})` }}>
                      <AdvisorArt x={c.x} y={c.y + u * 0.05 + Math.sin(f / 30) * u * 0.02} w={u * 1.12} f={f} fold={1 - 0.25 * P(f, looksAt, 20)} lit={f >= looksAt ? 0.8 + 0.2 * Math.sin(f / 4) : 0.25} id="pod" />
                    </g>
                    {/* o líquido por cima (tingimento) e as bolhas subindo */}
                    {Array.from({ length: 14 }).map((_, i) => {
                      const t = ((f / 70 + i / 14) % 1);
                      return <circle key={i} cx={c.x + (rnd(i) - 0.5) * u * 0.8 + Math.sin(f / 15 + i) * u * 0.02} cy={c.y + u * 0.9 - t * u * 1.8} r={Math.max(1.5, u * (0.008 + 0.012 * rnd(i * 3)))} fill="none" stroke="rgba(200,255,245,0.6)" strokeWidth={1.2} />;
                    })}
                  </g>
                  {/* o vidro: reflexos verticais e a faixa do casulo passando NA FRENTE dele */}
                </g>
              );
            })()}
            {/* 08/10 (pedido dele): nenhum aro por cima do vidro — os aros só aparecem fora dele */}
            {label ? (
              <g opacity={P(f, podAt, 10)}>
                <rect x={c.x - (900 / c.d) * 1.3} y={c.y - (900 / c.d) * 1.45} width={(900 / c.d) * 2.6} height={(900 / c.d) * 2.9} fill="none" stroke={f >= breenAt ? ORANGE : TEAL} strokeWidth={2} strokeDasharray="12 8" />
                <text x={c.x + (900 / c.d) * 1.4} y={c.y - (900 / c.d) * 1.3} fill={f >= breenAt ? ORANGE : TEAL} fontFamily={MONO} fontSize={22} letterSpacing={4}>{label}</text>
              </g>
            ) : null}
          </g>
        ) : null}
        {p.final ? null : <XMarker e={e} x={-1.9} y={7.4} label="MOSSMAN" sub={f >= mossAt ? "PARADA · SEM ENTENDER" : f >= breenAt ? "OLHANDO O CASULO" : undefined} col={f >= mossAt ? AMB : ICE} f={f} o={P(f, podAt, 12)} />}
        {f >= mossAt ? (() => {
          const q = proj(e, [-1.9, 7.4, 0.02]);
          if (!q) return null;
          const k = ((f - mossAt) % 40) / 40;
          return <ellipse cx={q.x} cy={q.y} rx={(40 + 90 * k) * Math.min(1.6, 5 / q.d)} ry={(11 + 25 * k) * Math.min(1.6, 5 / q.d)} fill="none" stroke={AMB} strokeWidth={2} opacity={1 - k} />;
        })() : null}
      </svg>
      {/* 08/10 (pedido dele: nada de frase grande no meio do POV): a voz que sai do casulo vira o painel de voz do HUD,
          no canto de baixo; o "Freeman." é a transcrição dele; depois o mesmo painel vira a IDENTIFICAÇÃO */}
      {f >= voiceAt - 6 && f < breenAt ? (
        <div style={{ position: "absolute", left: 90, top: 640, width: 560, padding: "14px 18px", borderRadius: 12, background: "rgba(6,14,14,0.88)", border: "1.5px solid #4fe3d0", fontFamily: MONO, opacity: P(f, voiceAt - 6, 8) }}>
          <div style={{ fontSize: 14, letterSpacing: 5, color: "#4fe3d0" }}>VOZ · ORIGEM: O CASULO · QUASE IRRECONHECÍVEL</div>
          <svg width={524} height={44} style={{ marginTop: 6 }}>
            {Array.from({ length: 66 }).map((_, i) => {
              const h = 3 + Math.abs(Math.sin(f / 4.2 + i * 0.6) * Math.sin(f / 11 + i * 0.25)) * 32 * (rnd(Math.floor(f / 4) + i) > 0.3 ? 1 : 0.15);
              return <rect key={i} x={i * 8} y={22 - h / 2} width={5} height={h} fill="#4fe3d0" opacity={0.8} />;
            })}
          </svg>
          {f >= freemanAt ? <div style={{ marginTop: 8, fontSize: 34, color: TXT, filter: `blur(${Math.max(0, 1 - (f - freemanAt) / 10) * 3}px)` }}>{"“Freeman.”".slice(0, Math.max(0, Math.floor((f - freemanAt) * 1.2)))}</div> : null}
        </div>
      ) : null}
      {!p.final && f >= breenAt - 6 ? (
        <div style={{ position: "absolute", left: 90, top: 560, width: 520, padding: 14, borderRadius: 12, background: "rgba(14,10,6,0.88)", border: `1.5px solid ${ORANGE}`, opacity: P(f, breenAt - 6, 8) * (1 - P(f, mossAt - 12, 10)), transform: `translateX(${(1 - P(f, breenAt - 6, 12)) * -40}px)` }}>
          <div style={{ fontFamily: MONO, fontSize: 14, letterSpacing: 4, color: ORANGE, marginBottom: 10 }}>IDENTIFICAÇÃO · VOZ</div>
          <div style={{ width: 492, height: 276, borderRadius: 8, overflow: "hidden", background: "#000", position: "relative" }}>
            <Sequence from={Math.round(breenAt - 6)} premountFor={20}>
              {/* 08/10: o rosto do Breen do HL2 original (monitor da Cidadela), não o clipe de fã */}
              <AbsoluteFill style={{ transform: "scale(1.2)", transformOrigin: "50% 30%", filter: "saturate(0.7) contrast(1.1)" }}>
                <Clip src={CL + "breen_rosto_hq.mp4"} from={0} rate={1} />
              </AbsoluteFill>
            </Sequence>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontFamily: MONO, letterSpacing: 3 }}>
            <span style={{ fontSize: 20, color: TXT }}>WALLACE BREEN</span>
            <span style={{ fontSize: 20, color: ORANGE }}>{`${Math.min(97, Math.max(0, Math.round((f - breenAt) * 3)))}%`}</span>
          </div>
        </div>
      ) : null}
      {noHud ? null : <Hud f={f} yaw={e.yaw} eye={e} blips={[{ x: 0, y: 9.2, hot: true }, { x: -1.9, y: 7.4 }]} msg={f >= believesAt && f < mossAt ? "ALGO QUE ACREDITA SER WALLACE BREEN" : undefined} msgCol={ORANGE} />}
      {/* ela olha: o casulo inteiro acende num pulso e a câmera dá um tranco (dentro da simulação, sem corte) */}
      {c && f >= looksAt && f < looksAt + 24 ? (
        <AbsoluteFill style={{ background: `radial-gradient(circle at ${c.x}px ${c.y}px, rgba(120,255,235,${0.45 * (1 - (f - looksAt) / 24)}) 0%, rgba(20,80,70,${0.25 * (1 - (f - looksAt) / 24)}) 30%, rgba(0,0,0,0) 60%)`, pointerEvents: "none" }} />
      ) : null}
      {insert ? (
        <AbsoluteFill style={{ background: "#000" }}>
          <Sequence from={Math.round(looksAt)} durationInFrames={36}>
            <AbsoluteFill style={{ transform: `scale(${1.25 + (f - looksAt) * 0.004})`, filter: "saturate(0.7) contrast(1.15) brightness(1.1)" }}>
              <Clip src={CL + "f_ow_adv_hq.mp4"} from={3.2} rate={1} />
            </AbsoluteFill>
          </Sequence>
          <AbsoluteFill style={{ background: `rgba(79,227,208,${0.2 * Math.max(0, 1 - (f - looksAt) / 8)})` }} />
        </AbsoluteFill>
      ) : null}
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ================================================================================================= 7 · a sala de controle (POV)
// as portas abrem: sala de controle Combine com janelão para a nevasca; a Alyx (marcador) no console diante do Advisor
// (massa escura flutuando, anéis psíquicos; 1 s de imagem real do Advisor quando ele é citado); PRESA ✗ INTERROGADA ✗
// FALANDO COM ELE ✓; ela vê o Gordon, nada acontece; "ele ainda não entenderia"; ela volta ao console; uma ruptura abre no
// chão e o céu de Xen aparece lá dentro (imagem real); o Gordon corre, o piso some, ele cai.
const RIFT: [number, number] = [0, 7.2];
const buildCtrl = (): XF[] => {
  const g = mk();
  g.room(-7, 7, 0, 14, 4.6, [32, 38, 44], [28, 31, 34], [14, 16, 19], [
    { side: "S", c: 0, w: 2.4, h: 2.8 },
    { side: "N", c: 0, w: 12, h: 4.0 },
  ]);
  // o janelão: parapeito e caixilhos; lá fora, a noite
  g.box(-7, 13.7, 0, 14, 0.3, 1.0, [26, 30, 34]);
  for (let x = -6; x <= 6; x += 3) g.box(x - 0.1, 13.8, 1.0, 0.2, 0.2, 3.6, [20, 24, 28]);
  g.quad([7, 40, -4], [-7, 40, -4], [-7, 40, 12], [7, 40, 12], [10, 22, 34], [0, -1, 0], { emit: 0.9 });
  // 12/10 (pedido dele: os terminais Combine muito simples): cada terminal é uma estação de verdade — rodapé recuado,
  // corpo com frisos de luz, mesa inclinada com teclas, e atrás o monitor alto numa carcaça escura com aletas laterais
  // (fenda acesa), a tela com conteúdo (cabeçalho, linhas de dados, medidor vertical, grade) e cabos descendo até o chão
  for (let k = -2; k <= 2; k++) {
    const x = k * 2.4;
    const hot = k === 1;
    const acc: RGB = hot ? [255, 170, 80] : [90, 220, 240];
    g.box(x - 0.7, 11.62, 0, 1.4, 0.8, 0.12, [20, 22, 25]);
    g.box(x - 0.8, 11.55, 0.12, 1.6, 0.9, 0.86, [38, 44, 50]);
    g.box(x - 0.78, 11.53, 0.3, 1.56, 0.02, 0.04, acc, { emit: 0.55 });
    g.box(x - 0.78, 11.53, 0.62, 1.56, 0.02, 0.02, [24, 28, 32]);
    for (let i = 0; i < 4; i++) g.box(x - 0.6 + i * 0.4, 11.53, 0.4, 0.22, 0.02, 0.16, [30, 34, 38]);
    // a carcaça do monitor (atrás da mesa) e as aletas
    g.box(x - 0.86, 12.28, 0.98, 1.72, 0.2, 1.42, [26, 30, 34]);
    g.box(x - 0.9, 12.26, 0.98, 1.8, 0.24, 0.06, [44, 50, 56]);
    g.box(x - 0.9, 12.26, 2.36, 1.8, 0.24, 0.06, [44, 50, 56]);
    for (const s of [-1, 1]) {
      g.box(x + s * 0.95 - 0.07, 12.22, 0.12, 0.14, 0.34, 2.4, [32, 36, 40]);
      g.box(x + s * 0.95 - 0.015, 12.21, 0.5, 0.03, 0.02, 1.7, acc, { emit: 0.6 });
    }
    // a tela: fundo escuro aceso + o conteúdo em relevo luminoso
    const sy = 12.27;
    g.quad([x - 0.74, sy, 1.12], [x + 0.74, sy, 1.12], [x + 0.74, sy, 2.26], [x - 0.74, sy, 2.26], hot ? [60, 34, 14] : [12, 44, 54], [0, -1, 0], { emit: 0.5 });
    g.quad([x - 0.7, sy - 0.003, 2.12], [x + 0.7, sy - 0.003, 2.12], [x + 0.7, sy - 0.003, 2.2], [x - 0.7, sy - 0.003, 2.2], acc, [0, -1, 0], { emit: 0.8 });
    for (let i = 0; i < 7; i++) {
      const w = 0.25 + 0.6 * ((Math.sin(i * 2.3 + k * 1.7) + 1) / 2);
      const z = 1.96 - i * 0.1;
      g.quad([x - 0.68, sy - 0.003, z], [x - 0.68 + w, sy - 0.003, z], [x - 0.68 + w, sy - 0.003, z + 0.035], [x - 0.68, sy - 0.003, z + 0.035], i === 2 ? [255, 200, 120] : acc, [0, -1, 0], { emit: 0.7 });
    }
    // medidor vertical e a grade (radar) no canto direito da tela
    g.quad([x + 0.55, sy - 0.003, 1.2], [x + 0.62, sy - 0.003, 1.2], [x + 0.62, sy - 0.003, 1.2 + 0.4 + 0.3 * ((k + 2) / 4)], [x + 0.55, sy - 0.003, 1.2 + 0.4 + 0.3 * ((k + 2) / 4)], acc, [0, -1, 0], { emit: 0.75 });
    for (let i = 0; i < 4; i++) {
      g.quad([x + 0.12 + i * 0.1, sy - 0.003, 1.2], [x + 0.13 + i * 0.1, sy - 0.003, 1.2], [x + 0.13 + i * 0.1, sy - 0.003, 1.56], [x + 0.12 + i * 0.1, sy - 0.003, 1.56], acc, [0, -1, 0], { emit: 0.35 });
      g.quad([x + 0.12, sy - 0.003, 1.2 + i * 0.12], [x + 0.43, sy - 0.003, 1.2 + i * 0.12], [x + 0.43, sy - 0.003, 1.21 + i * 0.12], [x + 0.12, sy - 0.003, 1.21 + i * 0.12], acc, [0, -1, 0], { emit: 0.35 });
    }
    // cabos da carcaça até o chão e para a parede
    for (const dx of [-0.4, 0.3]) {
      g.box(x + dx, 12.48, 0, 0.07, 0.07, 1.0, [16, 18, 20]);
      g.box(x + dx, 12.48, 0, 0.07, 1.2, 0.05, [16, 18, 20]);
    }
  }
  // 11/10: mais detalhe — mesas dos consoles com tampo inclinado e teclas, cabos no chão até a parede, vigas no teto,
  // luminárias, a passarela do Advisor (plataforma suspensa diante do janelão) e um rack de equipamento de cada lado
  for (let k = -2; k <= 2; k++) {
    const x = k * 2.4;
    g.quad([x - 0.85, 11.35, 1.0], [x + 0.85, 11.35, 1.0], [x + 0.85, 11.6, 1.12], [x - 0.85, 11.6, 1.12], [24, 28, 32], [0, -0.4, 0.9]);
    for (let i = 0; i < 6; i++) g.box(x - 0.7 + i * 0.25, 11.42, 1.05, 0.14, 0.08, 0.03, i % 2 ? [90, 210, 230] : [255, 160, 80], { emit: 0.6 });
    g.box(x - 0.04, 12.5, 0, 0.08, 1.2, 0.04, [16, 18, 20]);
  }
  for (let y = 2; y < 14; y += 2.4) g.box(-7, y - 0.15, 4.25, 14, 0.3, 0.35, [22, 26, 30]);
  for (let y = 3.2; y < 13; y += 4.8) for (const x of [-3.5, 3.5]) {
    g.box(x - 0.6, y - 0.15, 4.45, 1.2, 0.3, 0.1, [30, 32, 36]);
    g.box(x - 0.55, y - 0.1, 4.42, 1.1, 0.2, 0.03, [220, 240, 255], { emit: 0.85 });
  }
  g.box(-3.4, 10.6, 1.55, 3.2, 1.6, 0.12, [40, 46, 52]);
  g.box(-3.4, 10.6, 1.67, 3.2, 0.04, 0.5, [60, 66, 72]);
  g.box(-3.42, 10.58, 1.55, 3.24, 0.03, 0.04, [180, 140, 255], { emit: 0.6 });
  for (const x of [-3.2, -0.4]) g.box(x, 10.72, 0, 0.12, 0.12, 1.55, [30, 34, 38]);
  for (const s of [-1, 1]) {
    const x = s > 0 ? 5.6 : -6.6;
    g.box(x, 4.0, 0, 1.0, 1.8, 2.4, [34, 40, 46]);
    for (let i = 0; i < 6; i++) g.box(s > 0 ? x - 0.01 : x + 1.0, 4.15 + i * 0.27, 0.4, 0.02, 0.18, 1.6, i % 2 ? [70, 190, 210] : [34, 40, 46], i % 2 ? { emit: 0.4 } : undefined);
  }
  // nervuras e faixas de luz nas laterais
  for (let y = 1; y < 14; y += 2.2) {
    g.box(-7, y, 0, 0.3, 0.3, 4.6, [20, 24, 28]);
    g.box(6.7, y, 0, 0.3, 0.3, 4.6, [20, 24, 28]);
    g.box(-6.72, y + 0.6, 2.6, 0.04, 1.0, 0.12, [80, 220, 230], { emit: 0.5 });
    g.box(6.68, y + 0.6, 2.6, 0.04, 1.0, 0.12, [80, 220, 230], { emit: 0.5 });
  }
  return g.F;
};
export const HLXControlRoom: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const [doorAt, advAt, notPrisonAt, interAt, talkAt, seesAt, nothingAt, sayAt, backAt, riftAt, holdAt, xenAt, runAt, dropAt, fallAt] = ["doorAt", "advAt", "notPrisonAt", "interAt", "talkAt", "seesAt", "nothingAt", "sayAt", "backAt", "riftAt", "holdAt", "xenAt", "runAt", "dropAt", "fallAt"].map((k) => at(p, k));
  const G = useMemo(() => buildCtrl(), []);
  const open = P(f, doorAt, 18);
  const fall = Math.max(0, (f - dropAt) / 30);
  const y = keys(f, [
    [0, -1.8],
    [doorAt + 10, -1.8],
    [advAt + 30, 2.6],
    [runAt, 2.6],
    [runAt + 30, 4.9],
  ]);
  const yaw = keys(f, [
    [0, 0],
    [advAt + 10, 0],
    [advAt + 40, -0.12],
    [seesAt, -0.12],
    [seesAt + 20, 0.08],
    [riftAt, 0.08],
    [riftAt + 20, 0],
  ]);
  const pitch = keys(f, [
    [0, 0],
    [riftAt, 0],
    [riftAt + 24, -0.42],
    [holdAt + 20, -0.2],
    [dropAt, -0.2],
    [dropAt + 30, -1.25],
  ]);
  const z = 1.65 - (f >= dropAt ? 10 * fall * fall : 0);
  const e: Eye = { x: 0, y, z, yaw: yaw + (f >= dropAt ? Math.sin(f * 0.7) * 0.03 : 0), pitch, F: 980 };
  const riftR = f >= riftAt ? 2.1 * IO((f - riftAt) / 40) : 0;
  const lights: XL[] = [
    { x: 2.4, y: 11.8, z: 1.4, col: [255, 170, 80], k: 0.35, r: 6 },
    { x: -1.8, y: 11.4, z: 2.6, col: [200, 150, 255], k: 0.25 + (f >= advAt ? 0.15 * Math.sin(f / 7) : 0), r: 7 },
    { x: RIFT[0], y: RIFT[1], z: 0.3, col: [255, 120, 200], k: riftR > 0 ? 0.7 * (riftR / 2.1) : 0, r: 7 },
  ];
  // o piso some dentro da ruptura (e tudo perto do Gordon quando ele cai)
  const hide = (fc: XF) => {
    if (fc.tag !== "floor") return false;
    const cx = fc.p.reduce((s, q) => s + q[0], 0) / 4;
    const cy = fc.p.reduce((s, q) => s + q[1], 0) / 4;
    const d = Math.hypot(cx - RIFT[0], cy - RIFT[1]);
    return f >= dropAt && d < 4.5;
  };
  // contorno da ruptura na tela (recorta a imagem de Xen)
  const ring = Array.from({ length: 28 }).map((_, i) => {
    const a = (i / 28) * Math.PI * 2;
    const rr = riftR * (1 + 0.08 * Math.sin(a * 5 + f / 6));
    return proj(e, [RIFT[0] + Math.cos(a) * rr, RIFT[1] + Math.sin(a) * rr, 0.01]);
  });
  const ringOk = riftR > 0.05 && ring.every((q) => q);
  const clipPoly = ringOk ? `polygon(${ring.map((q) => `${q!.x.toFixed(0)}px ${q!.y.toFixed(0)}px`).join(", ")})` : "";
  const xenFull = f >= dropAt ? Math.min(1, fall * 1.4) : 0;
  const adv = proj(e, [-1.8, 9.7, 2.45]);
  // 11/10 (pedido dele): o Advisor 3D do jogo, flutuando sobre a plataforma, virado para a Alyx; a garra se estende
  // quando ele fala com ela
  const [ADV] = useAdvisors(1, 2.4);
  if (ADV) {
    // 12/10 (pedido dele: o Advisor brotava da parede): fica à frente da passarela, longe dos consoles, e desce do alto
    // devagar quando ele aparece
    placeAdvisor(ADV, [-1.8, 9.7, 2.15 + 1.4 * (1 - P(f, advAt - 40, 70)) + 0.08 * Math.sin(f / 30)], [1.6, 10.6, 1.9], -0.4);
    ADV.pose(f / 30, f >= talkAt ? 0.5 + 0.2 * Math.sin(f / 20) : 0.1);
  }
  const advL = useMemo(() => {
    const pl = new THREE.PointLight("#d8c8ff", 70, 9, 1.2);
    pl.position.set(-0.8, 3.2, -8.2);
    const pl2 = new THREE.PointLight("#ffb070", 40, 8, 1.2);
    pl2.position.set(1.0, 1.6, -9.0);
    return [...advLightsFor([0, 3, 3.5], "#e8eeff", "#8a96a8", 2.4, [-1.8, 9.7, 2.3]), pl, pl2, new THREE.HemisphereLight("#cfe0ff", "#2a3038", 1.6)];
  }, []);
  const advS = adv ? 900 / adv.d : 0;
  const alyxHead = proj(e, [1.6, 11.2, 1.75]);
  // 08/10 (pedido dele): nada de footage de fã (o Advisor era da animação Overworld) — o Advisor fica só na sala
  const insert = false;
  return (
    <AbsoluteFill style={{ background: "#020304", overflow: "hidden" }}>
      {f >= dropAt - 4 ? (
        <AbsoluteFill>
          {/* 08/10: a queda é UMA só — aqui já é a câmera da cena de Xen (HLXXenFall) no começo da mesma trajetória */}
          {(p as unknown as { xen?: PR }).xen ? (
            <HLXXenFall {...({ ...(p as unknown as { xen: PR }).xen, life: Math.round(((p as unknown as { xenLife?: number }).xenLife ?? 25) * 30), shift: -p.life } as unknown as PR)} />
          ) : (
            <XenVista f={f} e={{ x: e.x * 2, y: -12 + e.y, z: 58 - 30 * Math.min(1, Math.max(0, (f - dropAt) / 120)), yaw: e.yaw, pitch: -0.75 + 0.5 * Math.min(1, Math.max(0, (f - dropAt) / 120)), F: 900 }} />
          )}
        </AbsoluteFill>
      ) : null}
      <AbsoluteFill style={{ opacity: 1 - xenFull }}>
        <XView e={e} faces={G} lights={lights} flash={0.9} amb={0.13} hide={hide} extras={ADV && f >= doorAt ? [ADV.root] : []} glLights={ADV ? advL : []} />
        {/* a ruptura: o céu de Xen só DENTRO do contorno, por cima do piso */}
        {ringOk && f < dropAt ? (
          <AbsoluteFill style={{ clipPath: clipPoly }}>
            <XenVista f={f} e={{ x: e.x * 3, y: -12 + e.y * 2, z: 58, yaw: e.yaw, pitch: -0.75 + e.pitch, F: 900 }} />
          </AbsoluteFill>
        ) : null}
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          {Array.from({ length: 70 }).map((_, i) => {
            const q = proj(e, [-6 + rnd(i) * 12, 16 + rnd(i * 3) * 10, 4.5 - ((f * (0.03 + rnd(i * 7) * 0.04) + rnd(i * 5) * 6) % 6)]);
            return q ? <circle key={i} cx={q.x + Math.sin(f / 20 + i) * 6} cy={q.y} r={Math.max(0.8, 3 / q.d)} fill="#dfefff" opacity={0.55} /> : null;
          })}
          {open < 1
            ? [-1, 1].map((sgn) => {
                const x0 = sgn * (0.05 + open * 1.3);
                const a = proj(e, [x0, 0.02, 0]);
                const b = proj(e, [x0 + sgn * 1.2, 0.02, 0]);
                const c2 = proj(e, [x0 + sgn * 1.2, 0.02, 2.8]);
                const d = proj(e, [x0, 0.02, 2.8]);
                return a && b && c2 && d ? <polygon key={sgn} points={`${a.x},${a.y} ${b.x},${b.y} ${c2.x},${c2.y} ${d.x},${d.y}`} fill="#1a1f24" stroke={TEAL} strokeWidth={2} /> : null;
              })
            : null}
          {adv && f >= doorAt ? (
            <g opacity={P(f, doorAt + 10, 14)}>
              {ADV ? null : <AdvisorArt x={adv.x} y={adv.y + Math.sin(f / 30) * 6} w={advS * 2.2} f={f} lit={0.7} id="ctrl" />}
              <text x={adv.x - advS * 1.1} y={adv.y - advS * 0.7} fill={VIO} fontFamily={MONO} fontSize={18} letterSpacing={4}>
                ADVISOR
              </text>
              {/* 12/10: sem pontilhado do Advisor até a Alyx */}
            </g>
          ) : null}

          {ringOk && xenFull < 1 ? <polygon points={ring.map((q) => `${q!.x},${q!.y}`).join(" ")} fill="none" stroke="#ff9be8" strokeWidth={4} opacity={0.9} style={{ filter: "drop-shadow(0 0 12px #ff7ad9)" }} /> : null}
          {ringOk && xenFull < 1 && riftR > 1 ? (() => {
            const top = ring.reduce((m, q) => (q!.y < m!.y ? q : m), ring[0])!;
            return <text x={top.x} y={top.y - 18} textAnchor="middle" fill="#ff9be8" fontFamily={MONO} fontSize={20} letterSpacing={5} style={{ paintOrder: "stroke", stroke: "#000", strokeWidth: 4 }}>A RUPTURA · XEN DO OUTRO LADO</text>;
          })() : null}
        </svg>
        {f >= notPrisonAt && f < riftAt ? (
          <div style={{ position: "absolute", right: 90, top: 130, width: 420, fontFamily: MONO, opacity: P(f, notPrisonAt, 8) }}>
            {(
              [
                ["PRESA", "✗", notPrisonAt, RED],
                ["INTERROGADA", "✗", interAt, RED],
                ["FALANDO COM ELE", "✓", talkAt, GREEN],
              ] as [string, string, number, string][]
            ).map(([k, v, t, c]) =>
              f >= t ? (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "10px 16px", marginTop: 8, background: "rgba(8,8,10,0.75)", borderLeft: `3px solid ${c}`, fontSize: 20, letterSpacing: 4, color: TXT }}>
                  <span>{k}</span>
                  <span style={{ color: c }}>{v}</span>
                </div>
              ) : null,
            )}
          </div>
        ) : null}
        {/* a fala dela no painel de voz do HUD (nada de legenda branca no meio do POV) */}
        {f >= sayAt - 6 && f < riftAt + 10 ? (
          <div style={{ position: "absolute", left: 90, top: 150, width: 560, padding: "14px 18px", borderRadius: 12, background: "rgba(14,10,6,0.86)", border: `1.5px solid ${ORANGE}`, fontFamily: MONO, opacity: P(f, sayAt - 6, 8) * (1 - P(f, riftAt, 10)) }}>
            <div style={{ fontSize: 14, letterSpacing: 5, color: ORANGE }}>VOZ · ALYX VANCE</div>
            <svg width={524} height={40} style={{ marginTop: 6 }}>
              {Array.from({ length: 66 }).map((_, i) => {
                const h = f < backAt ? 3 + Math.abs(Math.sin(f / 3.2 + i * 0.7) * Math.sin(f / 8 + i * 0.3)) * 26 : 2;
                return <rect key={i} x={i * 8} y={20 - h / 2} width={5} height={h} fill={ORANGE} opacity={0.8} />;
              })}
            </svg>
            <div style={{ marginTop: 8, fontSize: 26, color: TXT }}>{"“Você ainda não entenderia.”".slice(0, Math.max(0, Math.floor((f - sayAt) * 1.4)))}</div>
          </div>
        ) : null}
        {f >= doorAt ? (
          <>
            <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
              <XMarker e={e} x={1.6} y={11.2} label="ALYX" col={ORANGE} f={f} o={P(f, doorAt + 6, 12)} sub={f >= backAt ? "VOLTA AO CONSOLE" : f >= seesAt ? "VÊ O GORDON" : undefined} />
            </svg>
          </>
        ) : null}
        <Hud f={f} yaw={e.yaw} eye={e} blips={[{ x: 1.6, y: 11.2 }, { x: -1.8, y: 11.4, hot: true }]} msg={f >= xenAt && f < dropAt ? "DO OUTRO LADO: XEN" : f >= holdAt && f < dropAt ? "ELA SEGURA A RUPTURA" : f >= nothingAt && f < sayAt ? "NINGUÉM FAZ NADA" : undefined} msgCol={f >= holdAt ? "#ff9be8" : CREAM} />
      </AbsoluteFill>
      {insert ? (
        <AbsoluteFill style={{ background: "#000" }}>
          <Sequence from={Math.round(advAt)} durationInFrames={34}>
            <AbsoluteFill style={{ transform: `scale(${1.15 + (f - advAt) * 0.004})`, filter: "saturate(0.6) contrast(1.15) hue-rotate(200deg) brightness(1.05)" }}>
              <Clip src={CL + "f_ow_adv_hq.mp4"} from={18} rate={1} />
            </AbsoluteFill>
          </Sequence>
        </AbsoluteFill>
      ) : null}
      {f >= fallAt ? <div style={{ position: "absolute", left: 0, right: 0, top: 120, textAlign: "center", fontFamily: MONO, fontSize: 22, letterSpacing: 8, color: CREAM, opacity: P(f, fallAt, 8) * (1 - P(f, p.life - 16, 14)) }}>GORDON E DOG · CAINDO EM DIREÇÃO A XEN</div> : null}
      <AbsoluteFill style={{ background: "#000", opacity: interpolate(f, [0, 6], [1, 0], C), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ================================================================================================= 7 · Xen (POV)
// rocha flutuante: topo irregular (verde) + lados que afinam até uma ponta embaixo
const islandFaces = (g: ReturnType<typeof mk>, x: number, y: number, z: number, r: number, seed: number) => {
  // placa de rocha de Xen (referência HL1): topo de musgo oliva/cinza com manchas, borda de musgo, rocha em faixas
  // marrom-oliva nas laterais, afinando numa estalactite embaixo
  const n = 11;
  const top: V3[] = [];
  const lip: V3[] = [];
  const mid: V3[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + seed;
    const rr = r * (0.78 + 0.34 * rnd(seed * 13 + i));
    const zz = z + (rnd(seed * 5 + i) - 0.5) * r * 0.08;
    top.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr, zz]);
    lip.push([x + Math.cos(a) * rr * 0.96, y + Math.sin(a) * rr * 0.96, zz - r * 0.12]);
    mid.push([x + Math.cos(a) * rr * 0.62, y + Math.sin(a) * rr * 0.62, z - r * (0.55 + 0.3 * rnd(seed * 7 + i))]);
  }
  const ctr: V3 = [x, y, z + r * 0.05];
  const tip: V3 = [x + (rnd(seed) - 0.5) * r * 0.3, y + (rnd(seed * 2) - 0.5) * r * 0.3, z - r * 2.0];
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const am = ((i + 0.5) / n) * Math.PI * 2 + seed;
    const v = rnd(seed * 3 + i);
    const moss: RGB = v < 0.33 ? [96, 122, 78] : v < 0.66 ? [110, 128, 92] : [124, 128, 104];
    g.F.push({ p: [ctr, top[j], top[i]], col: moss, n: [0, 0, 1], tag: "top" });
    g.F.push({ p: [top[i], top[j], lip[j], lip[i]], col: [84, 112, 70], n: [Math.cos(am), Math.sin(am), 0.1] });
    const band = i % 3 === 0 ? 0.8 : i % 3 === 1 ? 1 : 0.9;
    g.F.push({ p: [lip[i], lip[j], mid[j], mid[i]], col: [104 * band, 86 * band, 62 * band], n: [Math.cos(am), Math.sin(am), -0.2] });
    g.F.push({ p: [mid[i], mid[j], tip], col: [78, 64, 50], n: [Math.cos(am), Math.sin(am), -0.6] });
  }
};
// as torres de Xen: colunas altas que afinam em anéis, com a ponta acesa
const spire = (g: ReturnType<typeof mk>, x: number, y: number, z: number, h: number, r: number, seed: number) => {
  const seg = 9;
  for (let k = 0; k < seg; k++) {
    const z0 = z + (h * k) / seg;
    const z1 = z + (h * (k + 1)) / seg;
    const rr = r * (1 - k / (seg + 1.5));
    g.prism(x, y, z0, z1 - h * 0.02, rr, 8, k % 2 ? [92, 112, 82] : [74, 94, 70], undefined, seed + k * 0.1);
    g.prism(x, y, z1 - h * 0.02, z1, rr * 1.12, 8, [60, 74, 58], undefined, seed + k * 0.1);
  }
  g.prism(x, y, z + h, z + h + r * 0.9, r * 0.22, 6, [170, 210, 255], { emit: 0.9 }, seed);
};

export const XenSky: React.FC<{ yaw: number; pitch: number; o?: number }> = ({ yaw, pitch, o = 1 }) => (
  <Img src={staticFile("hl3silh/xen_ceu.jpg")} style={{ position: "absolute", left: -960 - yaw * 900, top: Math.max(-1080, Math.min(0, -560 + pitch * 760)), width: 3840, height: 2160, maxWidth: "none", opacity: o }} />
);
const ISL: [number, number, number, number][] = [
  [0, 14, 6, 3.2], [-9, 26, 14, 4], [10, 30, 22, 5], [-14, 48, 9, 6], [6, 60, 30, 7], [16, 10, 30, 3],
  [-6, 8, 34, 2.5], [-18, 30, 40, 5], [20, 44, 12, 5], [2, 40, 46, 4], [-4, 26, 3, 3.6], [8, 22, 5, 2.8],
];
const ISL2: [number, number, number, number][] = [
  [-26, 70, 18, 6], [24, 80, 34, 8], [-8, 90, 10, 9], [34, 64, 4, 5], [-34, 56, 30, 5], [12, 100, 40, 10], [-20, 110, 22, 8], [40, 96, 16, 6],
];
// pilares de pedra de Xen (colunas flutuando, de ponta a ponta)
const PILL: [number, number, number, number, number][] = [
  [-12, 34, -10, 26, 1.4], [14, 40, -14, 30, 1.8], [-22, 64, -6, 40, 2.2], [28, 58, -20, 44, 2.6], [4, 76, -16, 50, 2.4], [-36, 82, -10, 36, 2.0],
];
const buildXen = (): XF[] => {
  const g = mk();
  ISL.concat(ISL2).forEach(([x, y, z, r], i) => islandFaces(g, x, y, z, r, i + 1.3));
  PILL.forEach(([x, y, z0, z1, r], i) => {
    g.prism(x, y, z0, z1, r, 8, i % 2 ? [96, 84, 66] : [86, 78, 64], undefined, i);
    g.prism(x, y, z1, z1 + r * 1.2, r * 0.45, 8, [110, 132, 92], undefined, i + 0.5);
  });
  // torres nas ilhas maiores (como as do HL1)
  ISL.concat(ISL2).forEach(([x, y, z, r], i) => {
    if (r < 4.5) return;
    const nT = r > 7 ? 3 : 2;
    for (let k = 0; k < nT; k++) {
      const a = rnd(i * 7 + k) * Math.PI * 2;
      spire(g, x + Math.cos(a) * r * 0.45, y + Math.sin(a) * r * 0.45, z, r * (1.6 + rnd(i + k) * 1.2), r * 0.13, i + k);
    }
  });
  return g.F;
};
export const HLXXenFall: React.FC<PR> = (p) => {
  // 08/10 (pedido dele: a queda cortava e começava outra): a MESMA queda começa na sala de controle (que desenha esta
  // cena com `shift` negativo) e continua aqui sem recomeçar nem escurecer na emenda
  const q0 = p as unknown as { shift?: number; preAt?: number; contIn?: boolean };
  const f = useCurrentFrame() + (q0.shift ?? 0);
  const pre = q0.preAt ?? 0;
  const life = p.life;
  const [rootsAt, notCampAt, notCorrAt, sepAt, caveAt, islandsAt, dogAt, meetAt, creatAt] = ["rootsAt", "notCampAt", "notCorrAt", "sepAt", "caveAt", "islandsAt", "dogAt", "meetAt", "creatAt"].map((k) => at(p, k));
  const G = useMemo(() => buildXen(), []);
  // queda até a ilha [0,14,6] → pousa → anda → salta para [8,22,5] → anda até [-4,26,3]
  const land = sepAt;
  const jump0 = islandsAt;
  // a queda num trecho só (sem chave no meio → sem frear na emenda das cenas)
  const t0 = -pre;
  // queda contínua: já sai em movimento e só freia na chegada (1 − (1−u)^1,6), sem a arrancada lenta do IO
  const fu = Math.max(0, Math.min(1, (f - t0) / Math.max(1, land - t0)));
  const fe = 1 - Math.pow(1 - fu, 1.6);
  const fl = (a0: number, a1: number) => a0 + (a1 - a0) * fe;
  const z = f < land ? fl(pre ? 88 : 62, 7.65) : f < jump0 ? 7.65 : keys(f, [[jump0, 7.65], [jump0 + 18, 10.5], [jump0 + 40, 6.65], [life, 6.65]]);
  const x = f < land ? fl(pre ? 4.2 : 3, 0) : f < jump0 ? keys(f, [[land, 0], [jump0, 0.6]]) : keys(f, [[jump0, 0.6], [jump0 + 40, 7.5], [life, 7.9]]);
  const y = f < land ? fl(pre ? 3.6 : 6, 12.4) : f < jump0 ? keys(f, [[land, 12.4], [jump0, 15.8]]) : keys(f, [[jump0, 15.8], [jump0 + 40, 21.2], [life, 21.0]]);
  const pitch = f < land ? keys(f, [[t0, -1.25], [land - 30, -0.7], [land, -0.15]]) : keys(f, [[land, -0.15], [land + 20, 0.02], [dogAt, 0.02], [dogAt + 20, 0.08], [meetAt - 50, 0.06], [meetAt - 30, -0.12], [creatAt, -0.1], [creatAt + 30, 0.02]]);
  const yaw = keys(f, [[t0, -0.5], [land, 0.05], [jump0, 0.4], [jump0 + 40, 0.15], [dogAt, 0.15], [dogAt + 24, -0.55], [meetAt - 46, -0.95], [creatAt, -0.9], [creatAt + 40, -0.3]]);
  const thud = f >= land && f < land + 14 ? Math.sin((f - land) * 1.5) * 0.06 * (1 - (f - land) / 14) : 0;
  const DL0 = meetAt - 36;
  const dthud0 = f >= DL0 && f < DL0 + 16 ? Math.sin((f - DL0) * 1.6) * 0.05 * (1 - (f - DL0) / 16) : 0;
  const e: Eye = { x, y, z: z + thud + dthud0, yaw, pitch, F: 900 };
  const lights: XL[] = [{ x: 40, y: 120, z: 60, col: [255, 170, 120], k: 0.9, r: 260 }];
  const DOG: V3 = [-14, 48, 9];
  const dogQ = proj(e, [DOG[0], DOG[1], DOG[2] + 0.5]);
  // 09/10 (pedido dele: uma cena do reencontro): o Dog salta de outra ilha e cai na frente do Gordon (DL), fica ~2 s
  const DL = meetAt - 36;
  const dogNear = f >= DL - 22;
  const DOGL: V3 = [-3.6, 25.8, 3.0]; // 09/10 (pedido dele): no meio da plataforma da frente (ilha -4,26 · topo 3 · raio 3,6)
  const dlu = Math.max(0, Math.min(1, (f - (DL - 22)) / 22));
  const dogP: V3 = f < DL ? [-9 + (DOGL[0] + 9) * dlu, 33 + (DOGL[1] - 33) * dlu, 10 + (DOGL[2] - 10) * dlu + Math.sin(dlu * Math.PI) * 2.5] : DOGL;

  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#2e2234" }}>
      {/* o céu de Xen (nebulosa pintada no estilo do HL1), andando com a câmera */}
      <XenSky yaw={yaw} pitch={pitch} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <filter id="xenMist" x="-20%" y="-200%" width="140%" height="500%">
            <feGaussianBlur stdDeviation="40" />
          </filter>
        </defs>
        {Array.from({ length: 4 }).map((_, i) => (
          <ellipse key={"mi" + i} cx={960 + Math.sin(f / 90 + i) * 300} cy={420 + i * 160 + pitch * 300} rx={1300} ry={46} fill="rgba(255,200,180,0.09)" filter="url(#xenMist)" />
        ))}
      </svg>
      <XView e={e} faces={G} lights={lights} flash={0.2} amb={0.32} seam="rgba(20,8,10,0.4)" />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {/* flora de Xen: caules com bulbo aceso, tentáculos curvos e "árvores" com copa */}
        {ISL.concat(ISL2).map(([ix, iy, iz, r], i) =>
          Array.from({ length: 9 }).map((_, k) => {
            const a = rnd(i * 31 + k) * Math.PI * 2;
            const rr = r * 0.62 * rnd(i * 17 + k);
            const kind = k % 3;
            const hgt = kind === 2 ? 1.6 + 1.4 * rnd(k + i) : 0.6 + 0.6 * rnd(k + i);
            const b = proj(e, [ix + Math.cos(a) * rr, iy + Math.sin(a) * rr, iz]);
            const m = proj(e, [ix + Math.cos(a) * rr + Math.sin(f / 30 + k) * 0.12, iy + Math.sin(a) * rr, iz + hgt * 0.55]);
            const t = proj(e, [ix + Math.cos(a) * rr + Math.sin(f / 26 + k) * 0.18, iy + Math.sin(a) * rr, iz + hgt]);
            if (!b || !t || !m || b.d > 90) return null;
            const w = Math.max(1, 10 / b.d);
            if (kind === 1)
              return <path key={`${i}-${k}`} d={`M ${b.x} ${b.y} Q ${m.x + 30 / m.d} ${m.y} ${t.x} ${t.y}`} fill="none" stroke="#c46a8a" strokeWidth={w * 1.4} strokeLinecap="round" opacity={0.85} />;
            return (
              <g key={`${i}-${k}`}>
                <line x1={b.x} y1={b.y} x2={t.x} y2={t.y} stroke={kind === 2 ? "#4f7a5a" : "#6fe0a0"} strokeWidth={w * (kind === 2 ? 1.8 : 1)} opacity={0.85} />
                <circle cx={t.x} cy={t.y} r={Math.max(1.5, (kind === 2 ? 40 : 14) / t.d)} fill={kind === 2 ? "#3f8a5c" : "#b7ffd8"} opacity={kind === 2 ? 0.85 : 0.6 + 0.4 * Math.sin(f / 9 + k)} />
                {kind === 2 ? <circle cx={t.x} cy={t.y} r={Math.max(1, 12 / t.d)} fill="#d8ffb0" opacity={0.7 + 0.3 * Math.sin(f / 7 + i)} /> : null}
              </g>
            );
          }),
        )}
        {/* orbes de luz flutuando (pólen de Xen) */}
        {Array.from({ length: 40 }).map((_, i) => {
          const q = proj(e, [-20 + rnd(i) * 40, 6 + rnd(i * 3) * 60, rnd(i * 7) * 40 + Math.sin(f / 40 + i) * 0.6]);
          return q && q.d < 80 ? <circle key={"o" + i} cx={q.x} cy={q.y} r={Math.max(1.2, 30 / q.d)} fill="#ffe7a8" opacity={0.35 + 0.3 * Math.sin(f / 11 + i)} /> : null;
        })}
        {/* o Dog destruindo alguma coisa ao longe → depois ele chega */}
        {f >= dogAt && dogQ && !dogNear ? (
          <g>
            {[0, 1, 2].map((k) => {
              const t = ((f - dogAt) / 26 + k / 3) % 1;
              return <circle key={k} cx={dogQ.x} cy={dogQ.y} r={6 + t * 60} fill="none" stroke={CREAM} strokeWidth={2} opacity={1 - t} />;
            })}
            <text x={dogQ.x + 20} y={dogQ.y - 20} fill={ICE} fontFamily={MONO} fontSize={18} letterSpacing={4}>DOG · AO LONGE</text>
          </g>
        ) : null}
        {/* a poeira do pouso do Dog */}
        {f >= DL && f < DL + 26
          ? (() => {
              const q = proj(e, DOGL);
              const u = (f - DL) / 26;
              return q ? <ellipse cx={q.x} cy={q.y} rx={(40 + 320 * u) * Math.min(2, 3 / q.d)} ry={(10 + 70 * u) * Math.min(2, 3 / q.d)} fill="none" stroke="rgba(230,240,255,0.7)" strokeWidth={4 * (1 - u)} opacity={1 - u} /> : null;
            })()
          : null}
      </svg>
      {/* o Dog (holograma azul do HEV, aliado), caindo na frente do Gordon */}
      {dogNear ? <HoloAt e={e} x={dogP[0]} y={dogP[1]} z={dogP[2]} h={3.2} src="hl3silh/dog_holo.png" ar={832 / 1000} reveal={1} o={0.95} glitch={false} f={f} glow="rgba(160,225,255,0.7)" breath={f >= DL ? 1 + 0.02 * Math.sin(f / 7) : 1} /> : null}
      {f >= DL + 6
        ? (() => {
            const q = proj(e, [DOGL[0], DOGL[1], DOGL[2]]);
            return q ? <div style={{ position: "absolute", left: q.x, top: Math.min(q.y + 18, 930), transform: "translateX(-50%)", fontFamily: MONO, fontSize: 18, letterSpacing: 5, color: ICE, opacity: P(f, DL + 6, 10), textShadow: "0 2px 8px #000", whiteSpace: "nowrap" }}>DOG · REENCONTRO</div> : null;
          })()
        : null}
      <div style={{ position: "absolute", left: 80, top: 100, fontFamily: MONO, letterSpacing: 6 }}>
        <div style={{ fontSize: 22, color: ORANGE, opacity: P(f, rootsAt, 10) }}>XEN · VOLTA ÀS RAÍZES</div>
        {f >= notCampAt ? <div style={{ fontSize: 17, color: "rgba(242,240,247,0.7)", marginTop: 10 }}>≠ UMA CAMPANHA INTEIRA</div> : null}
        {f >= notCorrAt ? <div style={{ fontSize: 17, color: "rgba(242,240,247,0.7)", marginTop: 6 }}>≠ DOIS CORREDORES E UM MURAL</div> : null}
      </div>
      <Hud f={f} yaw={yaw} eye={e} blips={f >= dogAt ? [{ x: dogNear ? 5.8 : DOG[0], y: dogNear ? 25.5 : DOG[1], hot: true }] : []} msg={f >= creatAt ? "CRIATURAS CLÁSSICAS À FRENTE" : f >= islandsAt && f < dogAt ? "ILHAS FLUTUANTES" : f >= caveAt && f < islandsAt ? "CAVERNAS" : f >= sepAt && f < caveAt ? "GORDON SOZINHO · O DOG CAIU EM OUTRO LUGAR" : undefined} msgCol={CREAM} o={P(f, land - 10, 12)} />
      <AbsoluteFill style={{ background: "#000", opacity: q0.contIn ? interpolate(f, [life - 6, life], [0, 1], C) : fadeIO(f, life, 4), pointerEvents: "none" }} />
      {q0.shift ? null : <FilmLook />}
    </AbsoluteFill>
  );
};

// ================================================================================================= 7 · a colmeia (POV)
// 09/10 (pedidos dele): uma colmeia de verdade e um ABISMO de verdade. O túnel de rocha com células hexagonais de resina
// âmbar (larvas brilhando) desemboca num salão enorme sem chão: só uma ponte de pedra estreita e reta atravessa o vão até
// a ilha onde fica a Guardiã. Dos dois lados da ponte, pilares com antlions (passar reto = morrer). A Guardiã (holograma
// verde do scanner do HEV, forma do Antlion Guardian do Ep2) desperta e cospe ácido; os antlions (hologramas laranja)
// saem dos pilares. O Dog corre pela ponte e segura a Guardiã; a plataforma de salto de Xen joga o Gordon num platô alto,
// fora do alcance; a Gravity Gun estoura o cristal que segura a estalactite em cima dela (cai e a prende) e depois
// arremessa no abismo os antlions que sobem no platô — física, munição 0.
const HIVE_GY = 28; // a Guardiã (base no chão da ilha)
const HIVE_GH = 4.2;
const HIVE_MASS: V3 = [0, HIVE_GY - 0.4, 8.4]; // o cristal de Xen que segura a estalactite sobre ela
const VOID_A = 11; // o abismo: de y = 11 a 26 (só a ponte atravessa)
const VOID_B = 26;
const PLAT: V3 = [-6.0, 19.6, 3.0]; // o platô alto do Gordon (centro, topo)
const ANT: [number, number, number][] = [
  [-3.4, 15.5, 0.25],
  [3.6, 18.0, 0.2],
  [-3.6, 23.0, 0.3],
  [3.4, 23.8, 0.15],
];
const hiveR = (y: number) => {
  const k = Math.max(0, Math.min(1, (y - 9) / 4));
  const kk = k * k * (3 - 2 * k);
  return { w: 3.0 + 6.0 * kk, h: 3.4 + 6.2 * kk };
};
const buildHive2 = (): { F: XF[]; cells: V3[] } => {
  const g = mk();
  const cells: V3[] = [];
  const NA = 11;
  const rock = (k: number): RGB => [58 * k, 42 * k, 30 * k];
  const ring = (y: number, i: number) => {
    const { w, h } = hiveR(y);
    return Array.from({ length: NA + 1 }).map((_, j) => {
      const t = (j / NA) * Math.PI;
      const jit = 1 + (rnd(i * 13 + j * 7) - 0.5) * 0.14;
      return [Math.cos(t) * w * jit, y, Math.max(0, Math.sin(t) * h * jit)] as V3;
    });
  };
  const rings: V3[][] = [];
  for (let i = 0, y = -1; y <= 33; i++, y += 1.5) rings.push(ring(y, i));
  for (let i = 0; i < rings.length - 1; i++) {
    const A = rings[i];
    const B = rings[i + 1];
    for (let j = 0; j < NA; j++) {
      const a0 = A[j], a1 = A[j + 1], b0 = B[j], b1 = B[j + 1];
      const c: V3 = [(a0[0] + a1[0] + b0[0] + b1[0]) / 4, (a0[1] + b0[1]) / 2, (a0[2] + a1[2] + b0[2] + b1[2]) / 4];
      let nx = -c[0], nz = hiveR(c[1]).h * 0.35 - c[2];
      const nl = Math.hypot(nx, nz) || 1;
      nx /= nl;
      nz /= nl;
      g.quad(a0, b0, b1, a1, rock(0.75 + 0.4 * rnd(i * 31 + j * 5)), [nx, 0, nz]);
      const t = ((j + 0.5) / NA) * Math.PI;
      if (t > 0.16 * Math.PI && t < 0.84 * Math.PI && rnd(i * 17 + j * 3) > 0.45 && c[1] > 1) cells.push([c[0], c[1], c[2], nx, nz] as unknown as V3);
    }
    const ya = A[0][1], yb = B[0][1];
    const wA = hiveR(ya).w, wB = hiveR(yb).w;
    const isVoid = ya >= VOID_A - 0.01 && ya < VOID_B - 0.01;
    if (!isVoid) {
      const w = Math.min(wA, wB) * 0.98;
      for (let s = 0; s < 4; s++) {
        const k = 0.8 + 0.25 * rnd(i * 7 + s);
        const x0 = -w + (s * 2 * w) / 4, x1 = -w + ((s + 1) * 2 * w) / 4;
        g.quad([x0, ya, 0.001], [x1, ya, 0.001], [x1, yb, 0.001], [x0, yb, 0.001], [104 * k, 80 * k, 52 * k], [0, 0, 1], { tag: "floor" });
      }
    } else {
      // as paredes do salão descem pelo abismo até o fundo, que brilha fraco lá embaixo
      g.quad([-wA, ya, 0], [-wB, yb, 0], [-wB, yb, -16], [-wA, ya, -16], rock(0.5), [1, 0, 0]);
      g.quad([wB, yb, 0], [wA, ya, 0], [wA, ya, -16], [wB, yb, -16], rock(0.5), [-1, 0, 0]);
      g.quad([-wA, ya, -16], [wA, ya, -16], [wB, yb, -16], [-wB, yb, -16], [120, 255, 140], [0, 0, 1], { emit: 0.1 });
    }
  }
  // as faces do abismo: a borda da entrada e a da ilha (de frente para o Gordon)
  {
    const w1 = hiveR(VOID_A).w, w2 = hiveR(VOID_B).w;
    g.quad([-w1, VOID_A, 0], [w1, VOID_A, 0], [w1, VOID_A, -16], [-w1, VOID_A, -16], rock(0.5), [0, 1, 0]);
    g.quad([w2, VOID_B, 0], [-w2, VOID_B, 0], [-w2, VOID_B, -1.6], [w2, VOID_B, -1.6], rock(1.2), [0, -1, 0]);
    g.quad([w2, VOID_B, -1.6], [-w2, VOID_B, -1.6], [-w2, VOID_B, -16], [w2, VOID_B, -16], rock(0.5), [0, -1, 0]);
  }
  const last = rings[rings.length - 1];
  for (let j = 0; j < NA; j++) g.quad(last[j + 1], last[j], [last[j][0] * 0.2, last[j][1] + 0.01, last[j][2] * 0.6], [last[j + 1][0] * 0.2, last[j + 1][1] + 0.01, last[j + 1][2] * 0.6], rock(0.6), [0, -1, 0]);
  // a ponte estreita e reta sobre o abismo
  g.box(-0.75, VOID_A - 0.02, -0.9, 1.5, VOID_B - VOID_A + 0.04, 0.9, [92, 72, 50]);
  // os pilares dos antlions (dos lados da ponte) e o platô alto do Gordon
  ANT.forEach(([x, y, z], k) => g.prism(x, y, -16, z, 1.15 + 0.15 * rnd(k), 8, [76, 58, 40], undefined, k));
  g.prism(PLAT[0], PLAT[1], -16, PLAT[2], 2.1, 9, [84, 64, 44], undefined, 0.3);
  // a plataforma de salto de Xen (no começo da ponte) e a rocha solta no platô (a Gravity Gun pega)
  g.prism(0, 13.4, 0, 0.06, 0.45, 14, [120, 255, 160], { emit: 0.6, tag: "pad" });
  g.prism(-6.7, 20.6, PLAT[2], PLAT[2] + 0.36, 0.26, 7, [86, 66, 48], undefined, 0.4);
  // as células hexagonais (fundo afundado, paredes internas, borda de resina acesa)
  for (const cc of cells) {
    const [cx, cy, cz, nx, nz] = cc as unknown as number[];
    const n: V3 = [nx, 0, nz];
    const v: V3 = [nz, 0, -nx];
    const per = 2 + Math.floor(rnd(cx * 7 + cy) * 3);
    for (let m = 0; m < per; m++) {
      const s = 0.32 + 0.1 * rnd(cy * 3 + m);
      const du = (m % 2 ? 0.6 : -0.6) * (0.5 + rnd(m + cy)) * 0.9;
      const dv = (m - per / 2) * 0.6;
      const o: V3 = [cx + v[0] * dv + n[0] * 0.02, cy + du, cz + v[2] * dv + n[2] * 0.02];
      const P6 = (r: number, d: number) => Array.from({ length: 6 }).map((_, k) => {
        const a = (k / 6) * Math.PI * 2 + Math.PI / 6;
        return [o[0] + Math.sin(a) * v[0] * r + n[0] * d, o[1] + Math.cos(a) * r, o[2] + Math.sin(a) * v[2] * r + n[2] * d] as V3;
      });
      const lipO = P6(s * 1.18, 0.07);
      const lipI = P6(s, 0.07);
      const back = P6(s * 0.92, -0.22);
      const kk = 0.85 + 0.3 * rnd(cx + cy * 5 + m);
      g.F.push({ p: back, col: [70 * kk, 40 * kk, 14 * kk], n });
      for (let k = 0; k < 6; k++) {
        const k1 = (k + 1) % 6;
        const mid: V3 = [(lipI[k][0] + lipI[k1][0]) / 2 - o[0], (lipI[k][1] + lipI[k1][1]) / 2 - o[1], (lipI[k][2] + lipI[k1][2]) / 2 - o[2]];
        const ml = Math.hypot(mid[0], mid[1], mid[2]) || 1;
        g.quad(lipI[k], lipI[k1], back[k1], back[k], [170 * kk, 104 * kk, 38 * kk], [-mid[0] / ml, -mid[1] / ml, -mid[2] / ml]);
        g.quad(lipO[k], lipO[k1], lipI[k1], lipI[k], [236 * kk, 156 * kk, 58 * kk], n, { emit: 0.42 * kk });
      }
    }
  }
  // estalactites
  for (let i = 0; i < 22; i++) {
    const y = 3 + rnd(i * 3.1) * 29;
    const { w, h } = hiveR(y);
    const x = (rnd(i * 5.3) - 0.5) * w * 1.2;
    if (Math.abs(x) < 1.6 && Math.abs(y - HIVE_GY) < 2.5) continue;
    const top = Math.sqrt(Math.max(0, 1 - (x / w) ** 2)) * h * 0.97;
    const len = 0.8 + rnd(i * 7.7) * (y > 12 ? 3.2 : 1.2);
    const r = 0.2 + rnd(i) * 0.3;
    const tip: V3 = [x, y, top - len];
    for (let k = 0; k < 6; k++) {
      const a0 = (k / 6) * Math.PI * 2, a1 = ((k + 1) / 6) * Math.PI * 2, am = (a0 + a1) / 2;
      g.F.push({ p: [[x + Math.cos(a0) * r, y + Math.sin(a0) * r, top], [x + Math.cos(a1) * r, y + Math.sin(a1) * r, top], tip], col: rock(0.8 + 0.3 * rnd(i + k)), n: [Math.cos(am), Math.sin(am), -0.3] });
    }
  }
  return { F: g.F, cells };
};
// holograma de criatura ancorado no mundo (base no chão, altura em metros): sobe com a varredura, respira, falha
const HoloAt: React.FC<{ e: Eye; x: number; y: number; z: number; h: number; src: string; ar: number; reveal: number; o: number; glitch: boolean; f: number; glow: string; breath?: number }> = ({ e, x, y, z, h, src, ar, reveal, o, glitch, f, glow, breath = 1 }) => {
  const b = proj(e, [x, y, z]);
  const t = proj(e, [x, y, z + h]);
  if (!b || !t || o <= 0) return null;
  const Hh = (b.y - t.y) * breath;
  if (Hh < 4) return null;
  const Ww = Hh * ar;
  const left = b.x - Ww / 2;
  const top = b.y - Hh;
  const slices = glitch ? 6 : 1;
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {Array.from({ length: slices }).map((_, s) => (
        <div key={s} style={{ position: "absolute", left: left + (glitch ? (rnd(f * 3 + s + x) - 0.5) * Ww * 0.12 : 0), top, width: Ww, height: Hh, clipPath: `inset(${Math.max((1 - reveal) * 100, (s / slices) * 100)}% 0 ${100 - ((s + 1) / slices) * 100}% 0)`, opacity: o * (glitch && s % 2 ? 0.6 : 1) }}>
          <Img src={staticFile(src)} style={{ width: "100%", height: "100%", filter: `drop-shadow(0 0 ${Math.max(5, Hh * 0.03)}px ${glow})` }} />
        </div>
      ))}
      {reveal > 0 && reveal < 1 ? <div style={{ position: "absolute", left: left - 14, width: Ww + 28, top: top + Hh * (1 - reveal) - 2, height: 3, background: "#fff6e0", boxShadow: `0 0 16px ${glow}`, opacity: 0.9 * o }} /> : null}
    </div>
  );
};
export const HLXHive: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [hiveAt, wakeAt, dogAt, padsAt, gunAt, hitAt, physAt, ammoAt] = ["hiveAt", "wakeAt", "dogAt", "padsAt", "gunAt", "hitAt", "physAt", "ammoAt"].map((k) => at(p, k));
  const H2 = useMemo(() => buildHive2(), []);
  // câmera: túnel → para na beira do abismo (ela desperta, os antlions saem) → anda na ponte até a plataforma de salto →
  // o salto até o platô → mira o cristal (Gravity Gun) → se vira para os antlions que sobem no platô
  const J0 = padsAt + 14, J1 = padsAt + 44;
  const jumpU = Math.max(0, Math.min(1, (f - J0) / (J1 - J0)));
  const onPlat = f >= J1;
  const CAM: V3 = [PLAT[0] - 0.4, PLAT[1] - 0.9, PLAT[2] + 1.65];
  const x = f < J0 ? keys(f, [[0, 0.2], [padsAt - 30, 0.1], [J0, 0.0]]) : f < J1 ? jumpU * CAM[0] : CAM[0];
  const y = f < J0 ? keys(f, [[0, 0.5], [wakeAt, 9.9], [padsAt - 30, 10.3], [J0, 13.4]]) : f < J1 ? 13.4 + (CAM[1] - 13.4) * jumpU : CAM[1];
  const zBase = f < J0 ? 1.65 : f < J1 ? 1.65 + (CAM[2] - 1.65) * jumpU + Math.sin(jumpU * Math.PI) * 2.6 : CAM[2];
  const land = onPlat && f < J1 + 14 ? Math.sin((f - J1) * 1.3) * 0.05 * (1 - (f - J1) / 14) : 0;
  const yaw = keys(f, [[0, 0], [wakeAt - 10, 0.02], [dogAt, 0.05], [padsAt - 30, 0.05], [J0, 0.0], [J0 + 16, -0.25], [J1, 0.35], [gunAt, 0.42], [gunAt + 24, 0.42], [hitAt + 44, 0.42], [physAt - 14, 0.62], [life, 0.62]]);
  const pitch = keys(f, [[0, -0.02], [wakeAt, 0.04], [padsAt - 30, 0.04], [padsAt - 6, -0.3], [J0, -0.2], [J0 + 16, 0.08], [J1, -0.02], [gunAt, 0.02], [gunAt + 24, 0.2], [hitAt + 20, 0.18], [hitAt + 46, -0.04], [physAt - 14, -0.2], [life, -0.2]]);
  const roar = f >= wakeAt + 20 && f < wakeAt + 70 ? Math.sin(f * 2.3) * 0.012 * (1 - (f - wakeAt - 20) / 50) : 0;
  const hitT = f >= hitAt ? (f - hitAt) / 14 : -1;
  const fallT = Math.max(0, (f - hitAt - 14) / 30);
  const crash = f >= hitAt + 30 ? Math.max(0, 1 - (f - hitAt - 30) / 40) : 0;
  const walk = f < wakeAt || (f >= padsAt - 30 && f < J0) ? Math.abs(Math.sin(f / 6.5)) * 0.03 : 0;
  const e: Eye = { x, y, z: zBase + walk + land, yaw: yaw + roar + crash * Math.sin(f * 2) * 0.012, pitch, F: 920 };
  // camada dinâmica: o cristal + a estalactite e a rocha da Gravity Gun (por cima dos hologramas)
  const g2 = mk();
  const broken = f >= hitAt + 14;
  const STB = HIVE_MASS[2] - 0.2;
  const SLEN = 3.2;
  const drop = fallT > 0 ? Math.min(1, fallT * fallT) * (STB - SLEN - 0.15) : 0;
  const cone = (cx: number, cy: number, zb: number, zt: number, r: number, n: number, col: RGB, emit?: number, tilt: [number, number] = [0, 0]) => {
    for (let k = 0; k < n; k++) {
      const a0 = (k / n) * Math.PI * 2, a1 = ((k + 1) / n) * Math.PI * 2, am = (a0 + a1) / 2;
      const rr = (a: number) => r * (0.85 + 0.3 * rnd(k * 5 + cx * 3 + a));
      g2.F.push({ p: [[cx + Math.cos(a0) * rr(0), cy + Math.sin(a0) * rr(0), zb], [cx + Math.cos(a1) * rr(1), cy + Math.sin(a1) * rr(1), zb], [cx + tilt[0], cy + tilt[1], zt]], col: [col[0] * (0.8 + 0.3 * rnd(k)), col[1] * (0.8 + 0.3 * rnd(k)), col[2] * (0.8 + 0.3 * rnd(k))], n: [Math.cos(am), Math.sin(am), zt < zb ? -0.35 : 0.35], ...(emit ? { emit } : {}) });
    }
  };
  cone(HIVE_MASS[0], HIVE_MASS[1], STB - drop, STB - SLEN - drop, 1.35, 9, [92, 66, 44]);
  g2.F.push({ p: Array.from({ length: 9 }).map((_, k) => [HIVE_MASS[0] + Math.cos((k / 9) * Math.PI * 2) * 1.35, HIVE_MASS[1] + Math.sin((k / 9) * Math.PI * 2) * 1.35, STB - drop] as V3), col: [70, 50, 34], n: [0, 0, 1] });
  if (!broken)
    [[0, 0, 0.9], [0.55, 0.2, 0.7], [-0.5, -0.15, 0.75], [0.15, -0.55, 0.6], [-0.2, 0.55, 0.65]].forEach(([dx, dy, l], k) =>
      cone(HIVE_MASS[0] + dx * 0.9, HIVE_MASS[1] + dy * 0.9, HIVE_MASS[2] + 1.0, HIVE_MASS[2] + 1.0 - l * 2.3, 0.34 + 0.08 * rnd(k), 5, [255, 214, 120], 1.0, [dx * 0.9, dy * 0.9]),
    );
  const held = f >= gunAt && f < hitAt;
  const fwd: V3 = [e.x + Math.sin(e.yaw) * 2.2, e.y + Math.cos(e.yaw) * 2.2, e.z - 0.3 + 2.2 * Math.sin(Math.min(0.32, e.pitch))];
  const lift = P(f, gunAt, 14);
  const rockP: V3 | null = held ? [fwd[0] + (-6.7 - fwd[0]) * (1 - lift), fwd[1] + (20.6 - fwd[1]) * (1 - lift), fwd[2] + (PLAT[2] + 0.2 - fwd[2]) * (1 - lift)] : hitT >= 0 && hitT < 1 ? [fwd[0] + (HIVE_MASS[0] - fwd[0]) * hitT, fwd[1] + (HIVE_MASS[1] - fwd[1]) * hitT, fwd[2] + (HIVE_MASS[2] + 0.4 - fwd[2]) * hitT] : null;
  if (rockP) g2.prism(rockP[0], rockP[1], rockP[2] - 0.12, rockP[2] + 0.14, 0.15, 7, [104, 80, 58], undefined, f / 9);
  const wake = P(f, wakeAt, 40);
  const pinned = P(f, hitAt + 40, 12);
  // os antlions: saem dos pilares quando ela desperta; dois saltam para o platô e a Gravity Gun os arremessa no abismo
  const punts = [physAt + 4, physAt + 40];
  const ants = ANT.map(([ax, ay, az], k) => {
    const up = P(f, wakeAt + 30 + k * 9, 22);
    let px = ax, py = ay, pz = az, o = up, spin = 0;
    const jumper = k === 0 || k === 2 ? (k === 0 ? 0 : 1) : -1;
    if (jumper >= 0) {
      const tj = punts[jumper] - 26; // salta para a borda do platô
      const LAND: V3 = [PLAT[0] + 1.5 + jumper * 0.3, PLAT[1] + 1.0 - jumper * 0.5, PLAT[2]];
      const u = Math.max(0, Math.min(1, (f - tj) / 18));
      if (f >= tj) {
        px = ax + (LAND[0] - ax) * u;
        py = ay + (LAND[1] - ay) * u;
        pz = az + (LAND[2] - az) * u + Math.sin(u * Math.PI) * 1.8;
      }
      const tp = punts[jumper];
      if (f >= tp) {
        // o arremesso: sai voando para o abismo e cai
        const v = (f - tp) / 30;
        px = LAND[0] + 6 * v;
        py = LAND[1] + 3.5 * v;
        pz = LAND[2] + 2.2 * v - 9.8 * v * v * 1.6;
        spin = v;
        o = Math.max(0, 1 - Math.max(0, v - 0.8) * 2);
      }
    }
    return { k, x: px, y: py, z: pz, o, up, spin };
  });
  const lights: XL[] = [
    { x: 0, y: 6, z: 3, col: [255, 170, 80], k: 0.35, r: 10 },
    { x: 0, y: HIVE_GY, z: 2, col: [140, 255, 150], k: 0.15 + 0.45 * wake * (1 - 0.6 * pinned), r: 14 },
    { x: 0, y: 13.4, z: 0.4, col: [120, 255, 160], k: 0.4, r: 5 },
    { x: HIVE_MASS[0], y: HIVE_MASS[1], z: HIVE_MASS[2], col: [255, 200, 110], k: f < hitAt + 14 ? 0.5 : f < hitAt + 24 ? 1.4 : 0, r: 8 },
    ...(crash > 0 ? [{ x: 0, y: HIVE_GY, z: 1.5, col: [255, 230, 180] as RGB, k: crash * 1.1, r: 12 }] : []),
  ];
  const glitch = (f >= hitAt + 28 && f < hitAt + 60 && rnd(Math.floor(f / 2)) > 0.45) || (f >= wakeAt && f < wakeAt + 30 && rnd(Math.floor(f / 3) + 7) > 0.7);
  const reveal = P(f, wakeAt, 34);
  const gun = held || (hitT >= 0 && hitT < 0.3);
  const rockS = rockP ? proj(e, rockP) : null;
  const pad = proj(e, [0, 13.4, 0.08]);
  const beamTop = proj(e, [0, 13.4, 6]);
  const gb = proj(e, [0, HIVE_GY, 0]);
  const gt = proj(e, [0, HIVE_GY, HIVE_GH]);
  // ordem de desenho dos hologramas: de longe para perto
  const holos = [
    ...ants.filter((a) => f >= wakeAt + 30 + a.k * 9 - 2).map((a) => ({ d: Math.hypot(a.x - e.x, a.y - e.y), kind: "ant" as const, a })),
    ...(f >= wakeAt - 2 ? [{ d: Math.hypot(0 - e.x, HIVE_GY - e.y), kind: "g" as const, a: null }] : []),
  ].sort((a, b) => b.d - a.d);
  return (
    <AbsoluteFill style={{ background: "#070504", overflow: "hidden" }}>
      <XView e={e} faces={H2.F} lights={lights} flash={0.75} amb={0.14} seam="rgba(20,10,4,0.35)" solid />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <defs>
          <linearGradient id="hivePadBeam" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="rgba(150,255,180,0.55)" />
            <stop offset="1" stopColor="rgba(150,255,180,0)" />
          </linearGradient>
          <linearGradient id="hiveVoid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="rgba(0,0,0,0)" />
            <stop offset="1" stopColor="rgba(120,255,140,0.18)" />
          </linearGradient>
        </defs>
        {/* larvas brilhando dentro das células */}
        {H2.cells.map((cc, i) => {
          if (rnd(i * 9.1) < 0.55) return null;
          const c = cc as unknown as number[];
          const q = proj(e, [c[0] + c[3] * 0.05, c[1], c[2] + c[4] * 0.05]);
          if (!q || q.d > 30) return null;
          const r = Math.max(1.5, 9 / q.d);
          return <circle key={i} cx={q.x} cy={q.y} r={r * (1 + 0.15 * Math.sin(f / 10 + i))} fill="#e6ff8a" opacity={0.55 + 0.35 * Math.sin(f / 13 + i * 1.7)} style={{ filter: `drop-shadow(0 0 ${r * 2.5}px #c8ff60)` }} />;
        })}
        {/* as beiradas do abismo e da ponte (luz rasante) */}
        {(e.y > 8
          ? [
              [[-hiveR(VOID_A).w, VOID_A, 0.02], [-0.75, VOID_A, 0.02]],
              [[0.75, VOID_A, 0.02], [hiveR(VOID_A).w, VOID_A, 0.02]],
              [[-hiveR(VOID_B).w, VOID_B, 0.02], [-0.75, VOID_B, 0.02]],
              [[0.75, VOID_B, 0.02], [hiveR(VOID_B).w, VOID_B, 0.02]],
              [[-0.75, VOID_A, 0.02], [-0.75, VOID_B, 0.02]],
              [[0.75, VOID_A, 0.02], [0.75, VOID_B, 0.02]],
            ]
          : []
        ).map(([a3, b3], k) => {
          const pts = Array.from({ length: 9 }).map((_, i) => proj(e, [a3[0] + ((b3[0] - a3[0]) * i) / 8, a3[1] + ((b3[1] - a3[1]) * i) / 8, 0.02]));
          if (pts.some((q) => !q)) return null;
          return <polyline key={k} points={pts.map((q) => `${q!.x.toFixed(1)},${q!.y.toFixed(1)}`).join(" ")} fill="none" stroke="rgba(255,190,110,0.5)" strokeWidth={2} style={{ filter: "drop-shadow(0 0 6px rgba(255,170,80,0.6))" }} />;
        })}
        {/* a coluna de luz da plataforma de salto */}
        {pad && beamTop && f >= padsAt - 40 && f < J1 + 10 ? <polygon points={`${pad.x - 560 / pad.d},${pad.y} ${pad.x + 560 / pad.d},${pad.y} ${beamTop.x + 320 / beamTop.d},${beamTop.y} ${beamTop.x - 320 / beamTop.d},${beamTop.y}`} fill="url(#hivePadBeam)" opacity={(f >= J0 && f < J0 + 26 ? 0.95 : 0.5) * P(f, padsAt - 40, 12) * (1 - P(f, J1, 10))} /> : null}
      </svg>
      {/* os hologramas: a Guardiã (verde) e os antlions (laranja) */}
      {holos.map((hh, i) =>
        hh.kind === "g" ? (
          <HoloAt key={"g" + i} e={e} x={0} y={HIVE_GY} z={0} h={HIVE_GH * (0.55 + 0.45 * wake) * (1 - 0.35 * pinned)} src="hl3silh/guardia_holo.png" ar={857 / 1000} reveal={reveal} o={0.92 - 0.35 * pinned} glitch={glitch} f={f} glow="rgba(150,255,170,0.65)" breath={1 + 0.025 * Math.sin(f / 9) * wake * (1 - pinned)} />
        ) : (
          <HoloAt key={"a" + hh.a!.k} e={e} x={hh.a!.x} y={hh.a!.y} z={hh.a!.z} h={1.7} src="hl3silh/antlion_holo.png" ar={851 / 1000} reveal={hh.a!.up} o={hh.a!.o * 0.95} glitch={hh.a!.spin > 0 && rnd(Math.floor(f / 2) + hh.a!.k) > 0.5} f={f} glow="rgba(255,170,80,0.65)" breath={1 + 0.03 * Math.sin(f / 5 + hh.a!.k)} />
        ),
      )}
      {/* o quadro do scanner em volta da Guardiã */}
      {gb && gt && f >= wakeAt + 20 ? (
        (() => {
          const Hh = gb.y - gt.y;
          const Ww = Hh * (857 / 1000);
          const left = gb.x - Ww / 2, top = gb.y - Hh;
          const col = pinned > 0.5 ? CREAM : "#8dffa8";
          return (
            <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: P(f, wakeAt + 20, 10) * (1 - 0.5 * pinned) }}>
              {[[left - 16, top - 16, 1, 1], [left + Ww + 16, top - 16, -1, 1], [left - 16, gb.y + 10, 1, -1], [left + Ww + 16, gb.y + 10, -1, -1]].map(([cx, cy, sx, sy], k) => (
                <path key={k} d={`M ${cx} ${cy + 26 * sy} L ${cx} ${cy} L ${cx + 26 * sx} ${cy}`} fill="none" stroke={col} strokeWidth={2.5} />
              ))}
              <text x={left + Ww + 26} y={top + 4} fill={col} fontFamily={MONO} fontSize={18} letterSpacing={4}>{pinned > 0.5 ? "GUARDIÃ · PRESA" : "ANTLION GUARDIÃ"}</text>
              <text x={left + Ww + 26} y={top + 28} fill="rgba(242,240,247,0.75)" fontFamily={MONO} fontSize={15} letterSpacing={3}>{pinned > 0.5 ? "SOB A ESTALACTITE" : "PROTEGE O LUGAR"}</text>
            </svg>
          );
        })()
      ) : null}
      {/* o cristal, a estalactite e a rocha (na frente dos hologramas) */}
      <XView e={e} faces={g2.F} lights={lights} flash={0.75} amb={0.16} seam="rgba(20,10,4,0.35)" solid />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {f >= dogAt ? <XMarker e={e} x={keys(f, [[dogAt, 0.3], [dogAt + 50, 0.3], [dogAt + 66, 1.5]])} y={keys(f, [[dogAt, 10.4], [dogAt + 50, VOID_B + 0.2], [dogAt + 66, HIVE_GY - 1.6]])} label="DOG" sub={f >= dogAt + 66 ? "SEGURA A GUARDIÃ" : "CORRE PELA PONTE"} col={ICE} f={f} o={P(f, dogAt, 10) * (1 - pinned * 0.4)} /> : null}
        {/* os antlions marcados pelo scanner (vermelho) enquanto ameaçam */}
        {ants.map((a) => {
          if (a.up < 0.6 || a.o < 0.5 || f >= hitAt + 40 && a.k % 2 === 1) return null;
          const q = proj(e, [a.x, a.y, a.z + 1.9]);
          return q ? <text key={a.k} x={q.x} y={q.y} textAnchor="middle" fill={RED} fontFamily={MONO} fontSize={Math.max(11, Math.min(16, 60 / q.d))} letterSpacing={3} opacity={0.85}>ANTLION</text> : null;
        })}
        {/* o alvo da Gravity Gun: o cristal que segura a estalactite */}
        {f >= gunAt && f < hitAt + 14
          ? (() => {
              const q = proj(e, [HIVE_MASS[0], HIVE_MASS[1], HIVE_MASS[2] + 0.4]);
              return q ? (
                <g opacity={P(f, gunAt + 10, 8)}>
                  <circle cx={q.x} cy={q.y} r={16 + 3 * Math.sin(f / 4)} fill="none" stroke={ORANGE} strokeWidth={2.5} />
                  <line x1={q.x + 16} y1={q.y} x2={q.x + 140} y2={q.y - 60} stroke={ORANGE} strokeWidth={1.6} />
                  <text x={q.x + 150} y={q.y - 64} fill={ORANGE} fontFamily={MONO} fontSize={18} letterSpacing={4}>CRISTAL DE SUSTENTAÇÃO</text>
                  <text x={q.x + 150} y={q.y - 40} fill="rgba(242,240,247,0.75)" fontFamily={MONO} fontSize={15} letterSpacing={3}>SEGURA A ESTALACTITE · SOBRE ELA</text>
                </g>
              ) : null;
            })()
          : null}
        {/* o ácido: a Guardiã cospe por cima do abismo até onde o Gordon está */}
        {[
          [wakeAt + 46, [0.4, VOID_A - 0.6, 0.02]],
          [J1 + 10, [PLAT[0] + 1.1, PLAT[1] - 0.2, PLAT[2] + 0.02]],
          [gunAt - 4, [PLAT[0] + 0.6, PLAT[1] + 0.8, PLAT[2] + 0.02]],
        ].map(([t0, B0], j) => {
          const T0 = t0 as number;
          const B3 = B0 as V3;
          if (f < T0 || f >= T0 + 46) return null;
          const t = Math.min(1, (f - T0) / 22);
          const A0: V3 = [0, HIVE_GY - 1.2, 2.4];
          const pt = (u: number): V3 => [A0[0] + (B3[0] - A0[0]) * u, A0[1] + (B3[1] - A0[1]) * u, A0[2] + (B3[2] - A0[2]) * u + Math.sin(u * Math.PI) * 3.0];
          const trail = Array.from({ length: 8 }).map((_, k) => proj(e, pt(Math.max(0, t - k * 0.04))));
          const landQ = proj(e, B3);
          const sp = f - T0 - 22;
          return (
            <g key={j}>
              {t < 1 ? trail.map((q, k) => (q ? <circle key={k} cx={q.x} cy={q.y} r={Math.max(3, (110 - k * 12) / q.d)} fill="#b8ff3c" opacity={0.85 - k * 0.1} style={{ filter: "drop-shadow(0 0 8px #9cff2a)" }} /> : null)) : null}
              {sp >= 0 && landQ
                ? Array.from({ length: 12 }).map((_, k) => {
                    const a = (k / 12) * Math.PI * 2;
                    const r = (14 + sp * 3.2) * (0.6 + 0.6 * rnd(k + j)) * Math.max(0.5, 6 / landQ.d);
                    return <circle key={k} cx={landQ.x + Math.cos(a) * r} cy={landQ.y + Math.sin(a) * r * 0.35} r={Math.max(2, 5 * (1 - sp / 24))} fill="#b8ff3c" opacity={Math.max(0, 1 - sp / 24)} />;
                  })
                : null}
              {sp >= 0 && landQ ? <ellipse cx={landQ.x} cy={landQ.y} rx={Math.max(20, 260 / landQ.d)} ry={Math.max(6, 70 / landQ.d)} fill="rgba(160,255,60,0.35)" opacity={Math.max(0, 1 - sp / 24)} style={{ filter: "blur(4px)" }} /> : null}
            </g>
          );
        })}
        {/* o feixe da Gravity Gun (a rocha; e os antlions arremessados) */}
        {(gun && rockS) || punts.some((t) => f >= t - 6 && f < t + 4)
          ? (() => {
              const tq = gun && rockS ? rockS : (() => {
                const a = ants.find((x) => punts.some((t, i) => (x.k === (i === 0 ? 0 : 2)) && f >= t - 6 && f < t + 4));
                return a ? proj(e, [a.x, a.y, a.z + 0.8]) : null;
              })();
              return tq ? (
                <g>
                  {[-1, 0, 1].map((k) => (
                    <path key={k} d={`M ${1190 + k * 26} 1080 Q ${(1190 + tq.x) / 2 + k * 40} ${(1080 + tq.y) / 2 + Math.sin(f / 2 + k) * 20} ${tq.x} ${tq.y}`} fill="none" stroke={ORANGE} strokeWidth={3} opacity={0.6 + 0.3 * Math.sin(f + k)} style={{ filter: `drop-shadow(0 0 8px ${ORANGE})` }} />
                  ))}
                </g>
              ) : null;
            })()
          : null}
        {/* o cristal estoura */}
        {f >= hitAt + 14 && f < hitAt + 44
          ? Array.from({ length: 26 }).map((_, i) => {
              const t = (f - hitAt - 14) / 30;
              const a = rnd(i * 3.3) * Math.PI * 2;
              const sp = 1.2 + rnd(i * 7.1) * 2.4;
              const q = proj(e, [HIVE_MASS[0] + Math.cos(a) * sp * t, HIVE_MASS[1] + Math.sin(a) * sp * t * 0.6, HIVE_MASS[2] + 0.4 + (rnd(i) - 0.3) * sp * t - 4.9 * t * t]);
              return q ? <rect key={i} x={q.x} y={q.y} width={Math.max(2, 26 / q.d)} height={Math.max(4, 60 / q.d)} fill="#ffe08a" opacity={1 - t} transform={`rotate(${rnd(i) * 360 + f * 9} ${q.x} ${q.y})`} style={{ filter: "drop-shadow(0 0 6px #ffc34a)" }} /> : null;
            })
          : null}
        {/* poeira da estalactite */}
        {crash > 0 && gb
          ? Array.from({ length: 70 }).map((_, i) => (
              <circle key={i} cx={gb.x + (rnd(i) - 0.5) * 760 * (1.25 - crash * 0.5) * Math.min(1, 10 / Math.max(1, gb.d))} cy={gb.y - rnd(i * 3) * 300 * (1.3 - crash * 0.4) * Math.min(1, 10 / Math.max(1, gb.d))} r={8 + rnd(i * 5) * 26} fill="rgba(210,170,120,0.2)" style={{ filter: "blur(6px)" }} />
            ))
          : null}
      </svg>
      {f >= physAt ? (
        <div style={{ position: "absolute", left: "50%", top: 170, transform: "translateX(-50%)", display: "flex", gap: 30, fontFamily: MONO, opacity: P(f, physAt, 10) }}>
          {(
            [
              ["FÍSICA", "✓", GREEN, physAt],
              ["MUNIÇÃO GASTA", "0", RED, ammoAt],
            ] as [string, string, string, number][]
          ).map(([k, v, c, t]) =>
            f >= t ? (
              <div key={k} style={{ padding: "10px 20px", background: "rgba(10,8,2,0.7)", borderLeft: `3px solid ${c}`, display: "flex", gap: 16, alignItems: "baseline" }}>
                <span style={{ fontSize: 16, letterSpacing: 4, color: TXT }}>{k}</span>
                <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 44, color: c }}>{v}</span>
              </div>
            ) : null,
          )}
        </div>
      ) : null}
      <Hud f={f} yaw={e.yaw} eye={e} ammo={30} blips={[...(f >= wakeAt ? [{ x: 0, y: HIVE_GY, hot: true }] : []), ...ants.filter((a) => a.up > 0.5 && a.o > 0.5).map((a) => ({ x: a.x, y: a.y, hot: true })), ...(f >= dogAt ? [{ x: 1.5, y: HIVE_GY - 1.6 }] : [])]} msg={(f >= J1 + 24 && f < J1 + 46) || (f >= gunAt + 18 && f < gunAt + 34) ? "ÁCIDO" : f >= gunAt && f < physAt ? "GRAVITY GUN" : f >= padsAt - 30 && f < gunAt ? "PLATAFORMA DE SALTO DE XEN" : f >= wakeAt + 40 && f < padsAt - 30 ? "ANTLIONS DOS DOIS LADOS DA PONTE" : f >= hiveAt && f < wakeAt ? "UMA COLMEIA ANTIGA DE ANTLIONS" : undefined} msgCol={f >= gunAt ? ORANGE : f >= wakeAt + 40 ? RED : CREAM} />
      <AbsoluteFill style={{ background: "#fff", opacity: crash > 0.85 ? (crash - 0.85) * 2.5 : 0, pointerEvents: "none" }} />
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ================================================================================================= 7 · o observatório (POV)
// salão octogonal de pedra com glifos verdes (vortessência); pedras suspensas giram no centro e acendem quando o Gordon
// se aproxima; acima delas, mundos projetados em luz (TERRA, XEN, OUTROS) ligados por passagens; pontos vermelhos (os
// Combine) atravessam as passagens; no chão, equipamento Combine muito mais recente (caixas com telas e cabos).
const buildObs = (): XF[] => {
  const g = mk();
  const R = 10;
  const N = 8;
  for (let i = 0; i < N; i++) {
    const a0 = (i / N) * Math.PI * 2 + Math.PI / 8;
    const a1 = ((i + 1) / N) * Math.PI * 2 + Math.PI / 8;
    const am = (a0 + a1) / 2;
    const p0: [number, number] = [Math.cos(a0) * R, 10 + Math.sin(a0) * R];
    const p1: [number, number] = [Math.cos(a1) * R, 10 + Math.sin(a1) * R];
    const isDoor = Math.abs(Math.sin(am) + 1) < 0.1; // o lado de baixo (entrada)
    // 12/10 (pedido dele: textura da parede e do chão, tudo cinza): a parede em fiadas de blocos de pedra Xen — rejunte
    // escuro atrás, cada bloco com o seu tom (ocre, pardo, cinza-esverdeado), manchas de umidade, musgo aceso nas
    // fiadas de baixo e rachaduras. Na parede da entrada, o vão do corredor (|x| < 1,8, até 3,2 m) fica aberto.
    const nW: V3 = [-Math.cos(am), -Math.sin(am), 0];
    const L = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
    const at = (t: number, z: number, inset: number): V3 => [p0[0] + (p1[0] - p0[0]) * t + nW[0] * inset, p0[1] + (p1[1] - p0[1]) * t + nW[1] * inset, z];
    const wq = (t0: number, t1: number, z0: number, z1: number, col: RGB, inset: number, o?: { emit?: number }) => g.quad(at(t1, z0, inset), at(t0, z0, inset), at(t0, z1, inset), at(t1, z1, inset), col, nW, o);
    const doorT = (x: number) => (x - p0[0]) / (p1[0] - p0[0]);
    const holeT0 = isDoor ? Math.min(doorT(-1.8), doorT(1.8)) : 2, holeT1 = isDoor ? Math.max(doorT(-1.8), doorT(1.8)) : -1;
    const inHole = (t0: number, t1: number, z1: number) => isDoor && z1 <= 3.25 && t1 > holeT0 && t0 < holeT1;
    // rejunte (fundo)
    if (isDoor) {
      wq(0, holeT0, 0, 3.2, [30, 28, 24], 0);
      wq(holeT1, 1, 0, 3.2, [30, 28, 24], 0);
      wq(0, 1, 3.2, 6.4, [30, 28, 24], 0);
    } else wq(0, 1, 0, 6.4, [30, 28, 24], 0);
    let z = 0;
    let row = 0;
    while (z < 6.39) {
      const hgt = Math.min(6.4 - z, 0.55 + 0.25 * rnd(i * 31 + row));
      let t = row % 2 ? -0.35 / L : 0;
      let b = 0;
      while (t < 1) {
        const len = (0.9 + 0.8 * rnd(i * 97 + row * 13 + b)) / L;
        const t0 = Math.max(0, t), t1 = Math.min(1, t + len);
        if (t1 - t0 > 0.04 / L && !inHole(t0, t1, z + hgt)) {
          const r = rnd(i * 211 + row * 37 + b * 7);
          const r2 = rnd(i * 53 + row * 11 + b * 19);
          // tons: ocre quente, pardo, cinza-esverdeado; mais escuro e mais verde perto do chão (umidade)
          const base: RGB = r < 0.35 ? [104, 88, 64] : r < 0.7 ? [86, 78, 66] : [74, 80, 68];
          const k = 0.78 + 0.32 * r2 - (z < 1.2 ? 0.1 : 0);
          const wet = z < 1.0 ? 0.25 : 0;
          const col: RGB = [base[0] * k * (1 - wet), base[1] * k * (1 - wet * 0.4), base[2] * k * (1 - wet * 0.6)];
          const m = 0.025 / L;
          wq(t0 + m, t1 - m, z + 0.025, z + hgt - 0.025, col, 0.02);
          // mancha mais escura no pé de alguns blocos
          if (r2 > 0.75) wq(t0 + m, t1 - m, z + 0.025, z + hgt * 0.35, [col[0] * 0.75, col[1] * 0.75, col[2] * 0.72], 0.025);
          // musgo aceso nas fiadas de baixo
          if (z < 1.3 && rnd(i * 7 + row * 3 + b * 5) > 0.55) {
            const mt = t0 + (t1 - t0) * (0.15 + 0.5 * r);
            wq(mt, Math.min(t1 - m, mt + (0.25 + 0.3 * r2) / L), z + 0.03, z + 0.12 + 0.18 * r2, [70, 170, 110], 0.03, { emit: 0.35 });
          }
          // rachadura
          if (rnd(i * 13 + row * 29 + b) > 0.9) {
            const ct = t0 + (t1 - t0) * 0.5;
            wq(ct - 0.012 / L, ct + 0.012 / L, z + 0.05, z + hgt - 0.05, [24, 22, 20], 0.03);
          }
        }
        t += len;
        b++;
      }
      z += hgt;
      row++;
    }
    // faixa de glifos verdes
    const q0: V3 = [p0[0] * 0.995 + (p1[0] - p0[0]) * 0.15, 10 + (p0[1] - 10) * 0.995 + (p1[1] - p0[1]) * 0.15, 2.0];
    const q1: V3 = [p0[0] * 0.995 + (p1[0] - p0[0]) * 0.85, 10 + (p0[1] - 10) * 0.995 + (p1[1] - p0[1]) * 0.85, 2.0];
    void q0;
    void q1;
    // piso: o fundo (rejunte) em fatias; as lajes vêm depois
    g.F.push({ p: [[0, 10, 0], [p1[0], p1[1], 0], [p0[0], p0[1], 0]], col: [28, 27, 24], n: [0, 0, 1], tag: "floor" });
  }
  // as lajes do piso: grade de 1,25 m defasada por fileira, cada laje com o seu tom, algumas rachadas, musgo nas juntas
  {
    const S = 1.25;
    const rIn = R * Math.cos(Math.PI / N) - 0.45;
    for (let yy = 10 - rIn; yy < 10 + rIn; yy += S) {
      const ri = Math.round((yy - 10) / S);
      for (let xx = -rIn - (ri % 2 ? S / 2 : 0); xx < rIn; xx += S) {
        const cx = xx + S / 2, cy = yy + S / 2;
        if (Math.hypot(cx, cy - 10) > rIn - 0.3) continue;
        if (Math.hypot(cx, cy - 10) < 3.45) continue; // os anéis do pedestal
        const r = rnd(Math.round(cx * 7) * 31 + Math.round(cy * 7));
        const r2 = rnd(Math.round(cx * 5) + Math.round(cy * 11) * 17);
        const base: RGB = r < 0.4 ? [112, 100, 80] : r < 0.75 ? [96, 90, 78] : [84, 90, 78];
        const k = 0.85 + 0.3 * r2;
        const col: RGB = [base[0] * k, base[1] * k, base[2] * k];
        const m = 0.04;
        g.quad([xx + m, yy + m, 0.01], [xx + S - m, yy + m, 0.01], [xx + S - m, yy + S - m, 0.01], [xx + m, yy + S - m, 0.01], col, [0, 0, 1], { tag: "floor" });
        if (r2 > 0.82) g.quad([xx + 0.3, yy + 0.2, 0.015], [xx + 0.34, yy + 0.2, 0.015], [xx + S * 0.7, yy + S - 0.15, 0.015], [xx + S * 0.66, yy + S - 0.15, 0.015], [26, 24, 22], [0, 0, 1], { tag: "floor" });
        if (r > 0.86) g.quad([xx + S - 0.06, yy + 0.1, 0.014], [xx + S + 0.02, yy + 0.1, 0.014], [xx + S + 0.02, yy + S * 0.6, 0.014], [xx + S - 0.06, yy + S * 0.6, 0.014], [70, 170, 110], [0, 0, 1], { emit: 0.3, tag: "floor" });
      }
    }
  }
  // 11/10 (pedido dele: os desenhos perfeitos, mas o salão sem detalhe): pilastras de pedra em cada canto do octógono,
  // rodapé em degrau, cornija no alto, faixa entalhada escura, anéis de pedra no piso em volta do pedestal, entulho e
  // blocos caídos junto às paredes, raízes pendendo do alto e cristais pequenos nascendo da pedra
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2 + Math.PI / 8;
    const cx = Math.cos(a) * (R - 0.25), cy = 10 + Math.sin(a) * (R - 0.25);
    if (Math.abs(Math.sin(a) + 0.92) < 0.1 && Math.abs(Math.cos(a)) < 0.5) continue;
    g.prism(cx, cy, 0, 6.4, 0.42, 6, [70, 66, 56], undefined, a);
    g.prism(cx, cy, 0, 0.5, 0.55, 6, [58, 55, 47], undefined, a);
    g.prism(cx, cy, 5.9, 6.4, 0.55, 6, [58, 55, 47], undefined, a);
  }
  for (let i = 0; i < N; i++) {
    const a0 = (i / N) * Math.PI * 2 + Math.PI / 8, a1 = ((i + 1) / N) * Math.PI * 2 + Math.PI / 8, am = (a0 + a1) / 2;
    if (Math.abs(Math.sin(am) + 1) < 0.1) continue;
    const inR = R - 0.35;
    const P0: V3 = [Math.cos(a0) * inR, 10 + Math.sin(a0) * inR, 0], P1: V3 = [Math.cos(a1) * inR, 10 + Math.sin(a1) * inR, 0];
    const n: V3 = [-Math.cos(am), -Math.sin(am), 0];
    // rodapé (degrau de 0,3 m) e cornija
    g.quad([P1[0], P1[1], 0], [P0[0], P0[1], 0], [P0[0], P0[1], 0.3], [P1[0], P1[1], 0.3], [50, 47, 40], n);
    g.quad([P1[0], P1[1], 0.3], [P0[0], P0[1], 0.3], [Math.cos(a0) * R, 10 + Math.sin(a0) * R, 0.3], [Math.cos(a1) * R, 10 + Math.sin(a1) * R, 0.3], [62, 59, 50], [0, 0, 1]);
    g.quad([P1[0], P1[1], 6.1], [P0[0], P0[1], 6.1], [P0[0], P0[1], 6.4], [P1[0], P1[1], 6.4], [52, 49, 42], n);
    // raízes pendendo (3 por parede) e entulho
    for (let k = 0; k < 3; k++) {
      const t = 0.2 + 0.3 * k + 0.1 * rnd(i * 7 + k);
      const x = Math.cos(a0) * (R - 0.4) * (1 - t) + Math.cos(a1) * (R - 0.4) * t, y = 10 + (Math.sin(a0) * (1 - t) + Math.sin(a1) * t) * (R - 0.4);
      const L = 1.2 + 2.2 * rnd(i * 11 + k);
      g.box(x - 0.04, y - 0.04, 6.4 - L, 0.08, 0.08, L, [40, 56, 34]);
      if (rnd(i * 3 + k) > 0.4) {
        const s = 0.3 + 0.5 * rnd(i * 13 + k);
        const rx = Math.cos(am) * (R - 1.0 - rnd(k + i) * 0.8) + (rnd(i * 17 + k) - 0.5) * 2.5, ry = 10 + Math.sin(am) * (R - 1.0 - rnd(k + i) * 0.8);
        g.box(rx - s / 2, ry - s / 2, 0, s, s * 0.8, s * 0.6, [76 + 10 * rnd(k), 72, 60]);
      }
      if (rnd(i * 19 + k) > 0.55) {
        const cr = 0.08 + 0.06 * rnd(k * 5 + i);
        g.prism(x * 0.97, 10 + (y - 10) * 0.97, 0.3, 0.3 + 0.5 + 0.4 * rnd(k + i * 2), cr, 5, [110, 230, 170], { emit: 0.45 });
      }
    }
  }
  // anéis de pedra no piso em volta do pedestal (degraus baixos)
  g.prism(0, 10, 0, 0.08, 3.4, 16, [62, 60, 52]);
  g.prism(0, 10, 0.08, 0.16, 2.7, 16, [68, 66, 58]);
  for (let k = 0; k < 16; k++) {
    const a = (k / 16) * Math.PI * 2;
    g.box(Math.cos(a) * 3.0 - 0.08, 10 + Math.sin(a) * 3.0 - 0.08, 0.16, 0.16, 0.16, 0.02, [120, 255, 170], { emit: 0.5 });
  }
  // entrada (corredor curto)
  for (let y = -6; y < 0.8; y += 1) {
    const r = rnd(Math.round(y * 3) + 500);
    g.quad([-1.8, y, 0], [1.8, y, 0], [1.8, y + 1, 0], [-1.8, y + 1, 0], [28, 27, 24], [0, 0, 1]);
    g.quad([-1.75, y + 0.04, 0.01], [1.75, y + 0.04, 0.01], [1.75, y + 0.96, 0.01], [-1.75, y + 0.96, 0.01], [66 + 12 * r, 61 + 8 * r, 52], [0, 0, 1]);
    for (const s of [-1, 1]) {
      const x = s * 1.8;
      const n: V3 = [-s, 0, 0];
      g.quad([x, y, 0], [x, y + 1, 0], [x, y + 1, 3.2], [x, y, 3.2], [30, 28, 24], n);
      for (let zr = 0; zr < 5; zr++) {
        const o = (zr % 2) * 0.5;
        const k = 0.8 + 0.3 * rnd(Math.round(y * 5) + zr * 7 + s * 3);
        const x2 = x - s * 0.02;
        g.quad([x2, y + 0.03 + o * 0, zr * 0.64 + 0.03], [x2, y + 0.97, zr * 0.64 + 0.03], [x2, y + 0.97, zr * 0.64 + 0.61], [x2, y + 0.03, zr * 0.64 + 0.61], [94 * k, 84 * k, 66 * k], n);
        void o;
      }
    }
  }
  // pedestal central
  g.prism(0, 10, 0, 0.5, 2.0, 10, [92, 84, 68], { tag: "obj" });
  g.prism(0, 10, 0.5, 0.7, 1.4, 10, [80, 74, 62], { tag: "obj" });
  // entalhes do pedestal: frisos escuros, a faixa de glifos acesa e o tampo com o anel gravado
  g.prism(0, 10, 0.08, 0.12, 2.02, 10, [40, 36, 30], { tag: "obj" });
  g.prism(0, 10, 0.38, 0.42, 2.02, 10, [40, 36, 30], { tag: "obj" });
  for (let k = 0; k < 10; k++) {
    const a = (k / 10) * Math.PI * 2 + Math.PI / 10;
    const cx = Math.cos(a) * 1.92, cy = 10 + Math.sin(a) * 1.92;
    const tx = -Math.sin(a) * 0.18, ty = Math.cos(a) * 0.18;
    g.quad([cx - tx, cy - ty, 0.18], [cx + tx, cy + ty, 0.18], [cx + tx, cy + ty, 0.32], [cx - tx, cy - ty, 0.32], [110, 230, 170], [Math.cos(a), Math.sin(a), 0], { emit: 0.45, tag: "obj" });
  }
  g.prism(0, 10, 0.7, 0.705, 1.0, 20, [110, 230, 170], { emit: 0.35, tag: "obj" });
  g.prism(0, 10, 0.705, 0.71, 0.92, 20, [80, 74, 62], { tag: "obj" });
  // equipamento Combine (à direita): sensores em coluna sextavada de metal escuro, nervuras, faixa ciano, visor,
  // antena com luz vermelha e cabo no chão
  // na parede sudeste, ao lado da entrada (a única sem pintura), para não ficar na frente dos murais; luz ciano em anéis
  [[6.5, 5.1], [5.1, 3.6]].forEach(([x, y], k) => {
    const T = { tag: "obj" };
    g.box(x - 0.6, y - 0.5, 0, 1.2, 1.0, 0.18, [34, 38, 44], T);
    g.prism(x, y, 0.18, 1.9 + 0.3 * k, 0.42, 6, [44, 50, 58], T, 0.3);
    g.prism(x, y, 1.9 + 0.3 * k, 2.15 + 0.3 * k, 0.55, 6, [30, 34, 40], T, 0.3);
    for (let r = 0; r < 4; r++) g.prism(x, y, 0.45 + r * 0.38, 0.5 + r * 0.38, 0.47, 6, [24, 28, 32], T, 0.3);
    [0.95, 1.55].forEach((z) => g.prism(x, y, z, z + 0.05, 0.445, 6, [90, 230, 250], { emit: 0.8, tag: "obj" }, 0.3));
    g.box(x - 0.03, y - 0.03, 2.15 + 0.3 * k, 0.06, 0.06, 0.9, [30, 34, 40], T);
    g.box(x - 0.06, y - 0.06, 3.0 + 0.3 * k, 0.12, 0.12, 0.08, [255, 90, 70], { emit: 0.8, tag: "obj" });
    g.box(x - 0.9, y + 0.3, 0, 0.9, 0.06, 0.04, [16, 18, 20], T);
  });
  return g.F;
};
// ================================================================================================= murais Vortigaunt
// o estilo das referências do Paulo: traço verde-água aceso feito à mão sobre a parede escura, campo de pontos (alguns
// mais fortes), quadrados laranja tortos com pontos laranja acesos, figuras de Vortigaunt (cabeça alongada, um olho),
// figuras com auréola de raios, sóis com raios. Tudo em coordenadas 400×240 (o desenho que vai na parede).
const VT = "#4dffc0";
const VO = "#ff8a1a";
const vGlow = { filter: "drop-shadow(0 0 3px rgba(77,255,192,1)) drop-shadow(0 0 10px rgba(77,255,192,0.7))" };
const oGlow = { filter: "drop-shadow(0 0 4px rgba(255,140,30,1)) drop-shadow(0 0 12px rgba(255,140,30,0.75))" };
const VField: React.FC<{ seed: number; n?: number; o?: number }> = ({ seed, n = 70, o = 1 }) => (
  <g opacity={o}>
    {Array.from({ length: n }).map((_, i) => {
      const x = 8 + rnd(seed * 31 + i) * 384;
      const y = 8 + rnd(seed * 17 + i * 3) * 224;
      const big = rnd(seed + i * 7) > 0.85;
      return <circle key={i} cx={x} cy={y} r={big ? 3.6 : 2 + rnd(i) * 1.2} fill={VT} opacity={big ? 0.95 : 0.55} style={big ? vGlow : undefined} />;
    })}
    {Array.from({ length: 3 }).map((_, i) => {
      const x = 20 + rnd(seed * 5 + i * 11) * 330;
      const y = 14 + rnd(seed * 9 + i * 13) * 150;
      const w = 40 + rnd(seed + i) * 40;
      const r = (rnd(seed * 3 + i) - 0.5) * 18;
      return (
        <g key={"q" + i} transform={`rotate(${r} ${x + w / 2} ${y + w / 2})`}>
          <path d={`M ${x} ${y + 2} L ${x + w + 3} ${y} L ${x + w} ${y + w + 2} L ${x - 2} ${y + w}`} fill="none" stroke={VO} strokeWidth={2.4} opacity={0.85} />
          <circle cx={x + w * 0.3} cy={y + w * 0.6} r={5} fill={VO} style={oGlow} />
        </g>
      );
    })}
  </g>
);
// figura de Vortigaunt: cabeça alongada para a frente com um olho, corpo curvado, braços longos, pernas dobradas
const VVort: React.FC<{ x: number; y: number; s?: number; st?: React.CSSProperties }> = ({ x, y, s = 1, st }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} fill="none" stroke={VT} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" style={{ ...vGlow, ...st }}>
    <path d="M 0 -60 Q 10 -78 22 -70 Q 26 -62 14 -54 Q 6 -50 0 -60 Z" />
    <circle cx={14} cy={-64} r={3} fill={VT} />
    <path d="M 2 -52 Q -8 -30 -2 -6" />
    <path d="M -2 -40 Q 16 -28 22 -6 l 4 6 M 22 -6 l -2 8 M 22 -6 l -6 6" />
    <path d="M -2 -40 Q -18 -26 -22 -4 l -4 6 M -22 -4 l 0 8" />
    <path d="M -2 -6 L -10 14 L -4 30 L -12 42 M -2 -6 L 8 14 L 2 30 L 10 42" />
  </g>
);
// figura com auréola de raios (o "Gordon" das pinturas)
const VHalo: React.FC<{ x: number; y: number; s?: number; col?: string; dash?: boolean }> = ({ x, y, s = 1, col = VT, dash }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} fill="none" stroke={col} strokeWidth={2.4} strokeLinecap="round" strokeDasharray={dash ? "4 5" : undefined} style={dash ? undefined : vGlow}>
    <circle cx={0} cy={-52} r={17} />
    {Array.from({ length: 10 }).map((_, i) => {
      const a = (i / 10) * Math.PI * 2;
      return <line key={i} x1={Math.cos(a) * 20} y1={-52 + Math.sin(a) * 20} x2={Math.cos(a) * 27} y2={-52 + Math.sin(a) * 27} />;
    })}
    <rect x={-9} y={-44} width={18} height={10} rx={3} />
    <path d="M -12 -32 L 12 -32 L 10 6 L -10 6 Z M -12 -30 L -20 -2 M 12 -30 L 20 -2 M -6 6 L -7 34 M 6 6 L 7 34" />
  </g>
);
// sol / mundo com raios
const VSun: React.FC<{ x: number; y: number; r: number; col?: string; st?: React.CSSProperties; rays?: number }> = ({ x, y, r, col = VT, st, rays = 18 }) => (
  <g fill="none" stroke={col} strokeWidth={2.6} strokeLinecap="round" style={{ ...vGlow, ...st }}>
    <circle cx={x} cy={y} r={r} />
    <circle cx={x} cy={y} r={r * 0.62} opacity={0.7} />
    {Array.from({ length: rays }).map((_, i) => {
      const a = (i / rays) * Math.PI * 2;
      const l = i % 2 ? 1.35 : 1.6;
      return <line key={i} x1={x + Math.cos(a) * r * 1.12} y1={y + Math.sin(a) * r * 1.12} x2={x + Math.cos(a) * r * l} y2={y + Math.sin(a) * r * l} />;
    })}
  </g>
);
// ilha de Xen com torres (glifo)
const VIsle: React.FC<{ x: number; y: number; w: number; st?: React.CSSProperties }> = ({ x, y, w, st }) => (
  <g fill="none" stroke={VO} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" style={{ ...oGlow, ...st }}>
    <path d={`M ${x - w} ${y} L ${x + w} ${y} L ${x + w * 0.45} ${y + w * 0.6} L ${x} ${y + w * 1.25} L ${x - w * 0.5} ${y + w * 0.55} Z`} />
    {[-0.5, 0.05, 0.55].map((d, i) => (
      <path key={i} d={`M ${x + d * w} ${y} L ${x + d * w + 2} ${y - w * (0.9 + i * 0.25)} M ${x + d * w - 6} ${y - w * 0.3} h 12 M ${x + d * w - 5} ${y - w * 0.6} h 10`} />
    ))}
  </g>
);
// matrix3d que leva o retângulo (0,0)-(w,h) ao quadrilátero dst (cantos: sup-esq, sup-dir, inf-dir, inf-esq)
export const quadMatrix3d = (w: number, h: number, dst: [number, number][]): string | null => {
  const src: [number, number][] = [[0, 0], [w, 0], [w, h], [0, h]];
  const A: number[][] = [];
  const B: number[] = [];
  for (let i = 0; i < 4; i++) {
    const [x, y] = src[i];
    const [u, v] = dst[i];
    A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]);
    B.push(u);
    A.push([0, 0, 0, x, y, 1, -v * x, -v * y]);
    B.push(v);
  }
  const n = 8;
  for (let c = 0; c < n; c++) {
    let piv = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[piv][c])) piv = r;
    if (Math.abs(A[piv][c]) < 1e-9) return null;
    [A[c], A[piv]] = [A[piv], A[c]];
    [B[c], B[piv]] = [B[piv], B[c]];
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const k = A[r][c] / A[c][c];
      for (let cc = c; cc < n; cc++) A[r][cc] -= k * A[c][cc];
      B[r] -= k * B[c];
    }
  }
  const [a0, b0, c0, d0, e0, f0, g0, h0] = B.map((bv, i) => bv / A[i][i]);
  // 13/10 (o mapa perdia um pedaço em alguns quadros): o navegador recorta camadas 3D quando o "w" da perspectiva fica
  // muito pequeno ou desigual entre os cantos; a mesma homografia normalizada (w mínimo = 1) não perde nada
  const ws = [1, w * g0 + 1, w * g0 + h * h0 + 1, h * h0 + 1];
  const s = Math.min(...ws) > 0 ? Math.min(...ws) : 1;
  const [a, b2, c, d, e2, f2, g, h2, i9] = [a0, b0, c0, d0, e0, f0, g0, h0, 1].map((v) => v / s);
  return `matrix3d(${a}, ${d}, 0, ${g}, ${b2}, ${e2}, 0, ${h2}, 0, 0, 1, 0, ${c}, ${f2}, 0, ${i9})`;
};
type Globe = { c: V3; r: number; col: string; label: string; key: string };
const GLOBES: Globe[] = [
  { c: [-2.8, 11, 4.4], r: 1.0, col: "#6fb6ff", label: "TERRA", key: "earthAt" },
  { c: [2.9, 11.5, 4.9], r: 1.2, col: "#ff9a3c", label: "XEN", key: "xenAt" },
  { c: [0.2, 13.5, 6.4], r: 0.9, col: VIO, label: "?", key: "otherAt" },
  { c: [-4.8, 14, 6.0], r: 0.7, col: GREEN, label: "?", key: "otherAt" },
];
const PASS: [number, number][] = [[0, 1], [1, 2], [0, 3], [2, 3], [0, 2]];
export const HLXObservatory: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const A2 = (k: string) => at(p, k);
  const [ruinsAt, notDrawAt, obsAt, stonesAt, nearAt, lightAt, imgAt, notHoloAt, memAt, worldsAt, earthAt, xenAt, otherAt, passAt, combAt, equipAt, sepAt] = ["ruinsAt", "notDrawAt", "obsAt", "stonesAt", "nearAt", "lightAt", "imgAt", "notHoloAt", "memAt", "worldsAt", "earthAt", "xenAt", "otherAt", "passAt", "combAt", "equipAt", "sepAt"].map(A2);
  const mode = (p.mode as number | undefined) ?? 0; // 0 = observatório · 1/2 = a parede das versões
  const G = useMemo(() => buildObs(), []);
  // 09/10 (pedido dele: o pacing): entra no salão já em "ruínas Vortigaunts" (antes levava 9 s no corredor); a câmera nunca
  // para — um arco lento em volta das pedras
  const y = keys(f, [[0, -2.6], [ruinsAt, 1.4], [obsAt, 2.2], [nearAt, 3.6], [life, 4.0]]);
  const moving = Math.abs(keys(f + 1, [[0, -2.6], [ruinsAt, 1.4], [obsAt, 2.2], [nearAt, 3.6], [life, 4.0]]) - y) > 0.012;
  // olha as pinturas: Terra (noroeste) → Xen (nordeste) → outros (norte) → passagens/Combine (leste) → o equipamento
  const yaw = mode
    ? keys(f, [[0, -1.25], [life, -1.35]])
    : keys(f, [[0, 0], [earthAt - 6, 0], [earthAt + 20, -0.62], [xenAt - 4, -0.62], [xenAt + 22, 0.62], [otherAt - 4, 0.62], [otherAt + 22, 0], [passAt + 10, 0], [combAt + 20, 0.95], [equipAt - 4, 0.95], [equipAt + 24, 1.62], [sepAt, 1.62], [sepAt + 30, 0.1]]);
  const pitch = mode ? 0.05 : keys(f, [[0, 0], [stonesAt, 0.08], [lightAt, 0.12], [worldsAt, 0.1], [life, 0.08]]);
  const orbit = mode ? 0 : 0.9 * P(f, stonesAt, 60) * Math.sin((f - stonesAt) / 170);
  const e: Eye = { x: 0.3 * Math.sin(f / 120) + orbit, y: mode ? 4.6 : y, z: 1.7 + (moving && !mode ? 0.025 * Math.abs(Math.sin(f / 6.5)) : 0), yaw, pitch, F: 930 };
  const lit = mode ? 1 : P(f, lightAt, 30);
  const g2 = mk();
  // cristais suspensos: bipirâmides alongadas de 6 lados, girando devagar; acendem em sequência com a vortessência
  const crystal = (x: number, y: number, z: number, len: number, r: number, rot: number, tilt: number, on: number) => {
    const n = 6;
    const ring: V3[] = Array.from({ length: n }).map((_, i) => {
      const a = rot + (i / n) * Math.PI * 2;
      return [x + Math.cos(a) * r + tilt * 0.3 * len, y + Math.sin(a) * r, z] as V3;
    });
    const top: V3 = [x + tilt * len, y, z + len * 0.6];
    const bot: V3 = [x - tilt * len * 0.6, y, z - len * 0.4];
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const am = rot + ((i + 0.5) / n) * Math.PI * 2;
      const lt = 0.75 + 0.35 * Math.max(0, Math.cos(am - 0.8));
      const c: RGB = on > 0.3 ? [140 * lt, Math.min(255, 255 * lt), 215 * lt] : [96 * lt, 116 * lt, 108 * lt];
      g2.F.push({ p: [ring[i], ring[j], top], col: c, n: [Math.cos(am), Math.sin(am), 0.5], emit: on > 0.3 ? 0.3 + 0.45 * on * lt : undefined });
      g2.F.push({ p: [ring[j], ring[i], bot], col: [c[0] * 0.75, c[1] * 0.75, c[2] * 0.75], n: [Math.cos(am), Math.sin(am), -0.5], emit: on > 0.3 ? 0.2 + 0.3 * on : undefined });
    }
  };
  const ign = (k: number) => nearAt + 6 + k * 5; // 09/10: um por um, em espiral (cada um com o seu tom)
  for (let k = 0; k < 16; k++) {
    const a = (k / 16) * Math.PI * 2 + f / 260;
    const rr = 1.5 + 1.1 * rnd(k * 3);
    const zz = 2.1 + 1.3 * rnd(k * 7) + 0.15 * Math.sin(f / 40 + k);
    const len = 0.35 + 0.45 * rnd(k * 11);
    const react = f >= stonesAt ? 0.32 * Math.max(0, Math.sin(f / 9 + k * 1.7)) * P(f, stonesAt, 20) : 0;
    const on = mode ? 1 : Math.max(react, P(f, ign(k), 6));
    crystal(Math.cos(a) * rr, 10 + Math.sin(a) * rr, zz, len, len * 0.22, f / 50 + k, (rnd(k * 13) - 0.5) * 0.5, on);
  }
  const back = G.filter((fc) => fc.tag !== "obj");
  const inHall = e.y > 0.9;
  const front = G.filter((fc) => fc.tag === "obj" && (inHall || fc.p.reduce((s2, q) => s2 + q[0], 0) / fc.p.length < 3)).concat(g2.F);
  const lights: XL[] = [
    { x: 0, y: 10, z: 2.5, col: [120, 255, 170], k: 0.2 + 0.5 * lit, r: 13 },
    { x: 5.6, y: 4.2, z: 1.2, col: [80, 220, 240], k: 0.25, r: 5 },
  ];
  // as paredes do octógono (mesma geometria do buildObs): p1 = esquerda, p0 = direita, vistas de dentro
  const R = 10;
  const wall = (deg: number) => {
    const i = (((Math.round(deg / 45) - 1) % 8) + 8) % 8;
    const a0 = (i / 8) * Math.PI * 2 + Math.PI / 8;
    const a1 = ((i + 1) / 8) * Math.PI * 2 + Math.PI / 8;
    const p0: [number, number] = [Math.cos(a0) * R * 0.985, 10 + Math.sin(a0) * R * 0.985];
    const p1: [number, number] = [Math.cos(a1) * R * 0.985, 10 + Math.sin(a1) * R * 0.985];
    return { p0, p1 };
  };
  // prende um desenho 400×240 na parede com PERSPECTIVA (homografia dos 4 cantos projetados → matrix3d)
  const Mural: React.FC<{ deg: number; o: number; children: React.ReactNode }> = ({ deg, o: o0, children }) => {
    let o = o0;
    const { p0, p1 } = wall(deg);
    const P0: V3 = [p1[0] + (p0[0] - p1[0]) * 0.03, p1[1] + (p0[1] - p1[1]) * 0.03, 4.9];
    const P1: V3 = [p1[0] + (p0[0] - p1[0]) * 0.97, p1[1] + (p0[1] - p1[1]) * 0.97, 4.9];
    const P2: V3 = [P1[0], P1[1], 0.35];
    const P3: V3 = [P0[0], P0[1], 0.35];
    const q = [P0, P1, P2, P3].map((v) => proj(e, v));
    // só dentro do octógono: do corredor de entrada as paredes da frente tapariam as pinturas
    const inside = Math.max(0, Math.min(1, (e.y - 0.6) / 1.2));
    o *= inside;
    if (q.some((v) => !v || v.d < 0.4) || o <= 0) return null;
    const m = quadMatrix3d(400, 240, q.map((v) => [v!.x, v!.y]) as [number, number][]);
    if (!m) return null;
    return (
      <div style={{ position: "absolute", left: 0, top: 0, width: 400, height: 240, transformOrigin: "0 0", transform: m, opacity: o }}>
        <svg width={400} height={240} viewBox="0 0 400 240" style={{ overflow: "visible" }}>
          {children}
        </svg>
      </div>
    );
  };
  const paint = (start: number, len = 900, d = 40) => ({ strokeDasharray: `${len * P(f, start, d)} ${len}` });
  const GP = "#8dffa8";
  const glow = { filter: "drop-shadow(0 0 6px rgba(141,255,168,0.8))" };
  return (
    <AbsoluteFill style={{ background: "#050605", overflow: "hidden" }}>
      <XView e={e} faces={back} lights={lights} flash={0.85} amb={0.08} seam="rgba(10,10,8,0.4)" />
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", filter: "saturate(1.45) brightness(1.18)" }}>
        {mode === 0 ? (
          <>
            {/* o que já existia em todas as paredes: campo de pontos e figuras apagadas */}
            {[135, 90, 45, 0, 180].map((deg, i) => (
              <Mural key={"old" + deg} deg={deg} o={0.08 + 0.92 * lit}>
                <VField seed={i + 1} o={0.55} />
                <g opacity={0.35}>
                  <VVort x={60} y={180} s={0.8} />
                  <VHalo x={340} y={190} s={0.7} />
                </g>
              </Mural>
            ))}
            {/* TERRA (noroeste): o mundo com raios, Vortigaunts olhando para ele */}
            <Mural deg={135} o={P(f, earthAt, 10) * lit}>
              <VSun x={200} y={105} r={58} st={paint(earthAt, 900, 40)} />
              <path d="M 168 88 q 18 -16 34 4 q 16 18 30 -4 M 160 118 q 26 14 52 -6 q 14 -8 24 12" fill="none" stroke={VT} strokeWidth={2.6} style={{ ...vGlow, ...paint(earthAt + 10, 400) }} />
              <VVort x={70} y={190} s={1.1} st={paint(earthAt + 14, 600)} />
              <VVort x={330} y={190} s={-1.1} st={paint(earthAt + 18, 600)} />
              <text x={200} y={232} textAnchor="middle" fill={VT} fontFamily={MONO} fontSize={18} letterSpacing={6} opacity={P(f, earthAt + 20, 10)}>TERRA</text>
            </Mural>
            {/* XEN (nordeste): as ilhas com torres, em laranja */}
            <Mural deg={45} o={P(f, xenAt, 10) * lit}>
              <VIsle x={100} y={90} w={42} st={paint(xenAt, 700)} />
              <VIsle x={230} y={70} w={62} st={paint(xenAt + 6, 900)} />
              <VIsle x={335} y={115} w={34} st={paint(xenAt + 12, 600)} />
              <VVort x={200} y={205} s={0.8} st={paint(xenAt + 16, 600)} />
              <text x={200} y={232} textAnchor="middle" fill={VO} fontFamily={MONO} fontSize={18} letterSpacing={6} opacity={P(f, xenAt + 20, 10)}>XEN</text>
            </Mural>
            {/* OUTROS MUNDOS (norte): mundos-olho, espiral, anel */}
            <Mural deg={90} o={P(f, otherAt, 10) * lit}>
              <g fill="none" stroke={VT} strokeWidth={2.6} strokeLinecap="round" style={vGlow}>
                <circle cx={90} cy={90} r={38} style={paint(otherAt, 300)} />
                <path d="M 66 90 Q 90 66 114 90 Q 90 114 66 90 Z" style={paint(otherAt + 4, 200)} />
                <circle cx={90} cy={90} r={7} fill={VT} />
                <path d={`M 205 95 ${Array.from({ length: 30 }).map((_, i) => `L ${205 + Math.cos(i * 0.6) * i * 1.4} ${95 + Math.sin(i * 0.6) * i * 1.4}`).join(" ")}`} style={paint(otherAt + 8, 500)} />
                <circle cx={320} cy={92} r={30} style={paint(otherAt + 12, 260)} />
                <ellipse cx={320} cy={92} rx={58} ry={14} style={paint(otherAt + 16, 400)} />
              </g>
              <VHalo x={205} y={205} s={0.7} />
              <text x={200} y={232} textAnchor="middle" fill={VT} fontFamily={MONO} fontSize={16} letterSpacing={5} opacity={P(f, otherAt + 20, 10)}>LUGARES QUE GORDON NUNCA VIU</text>
            </Mural>
            {/* PASSAGENS (leste) e os COMBINE atravessando por elas */}
            <Mural deg={0} o={P(f, passAt, 10) * lit}>
              <VSun x={60} y={105} r={30} rays={12} />
              <VSun x={340} y={105} r={30} rays={12} col={VO} st={oGlow} />
              <path d="M 96 100 Q 200 10 304 100" fill="none" stroke={VT} strokeWidth={2.6} strokeDasharray="8 9" style={{ ...vGlow, ...paint(passAt, 400) }} />
              <path d="M 96 115 Q 200 200 304 115" fill="none" stroke={VT} strokeWidth={2.6} strokeDasharray="8 9" style={{ ...vGlow, ...paint(passAt + 8, 400) }} />
              {f >= combAt
                ? [0, 1, 2, 3, 4].map((k) => {
                    const t = Math.min(1, P(f, combAt + k * 5, 30));
                    const x = 100 + t * 200;
                    const yy = 100 - Math.sin(t * Math.PI) * 62;
                    return <path key={k} d={`M ${x - 10} ${yy + 9} l 10 -19 l 10 19 Z`} fill="none" stroke="#ff5d4d" strokeWidth={2.6} style={{ filter: "drop-shadow(0 0 5px #ff5d4d)" }} />;
                  })
                : null}
              <text x={200} y={232} textAnchor="middle" fill="#ff8a7a" fontFamily={MONO} fontSize={16} letterSpacing={5} opacity={P(f, combAt + 10, 10)}>OS COMBINE ATRAVESSANDO</text>
            </Mural>
          </>
        ) : (
          // a parede das versões (oeste): o MESMO acontecimento repetido, com pequenas diferenças, sem passagem entre eles
          <>
            {[180, 135].map((deg, wi) => (
              <Mural key={deg} deg={deg} o={1}>
                {[0, 1].map((k) => {
                  const idx = wi * 2 + k;
                  // 09/10 (pedido dele): no modo 2 a parede oeste abre espaço no canto para o homem de terno, fora das cenas
                  const tight = mode === 2 && wi === 0;
                  const x0 = tight ? 8 + k * 152 : 10 + k * 200;
                  const variant = idx % 4;
                  const on = P(f, (p[`v${idx}At`] as number | undefined) ?? 0, 14);
                  return (
                    <g key={k} opacity={0.4 + 0.6 * on} transform={tight ? `translate(${x0} 0) scale(0.78 1) translate(${-x0} 0)` : undefined}>
                      <VField seed={idx * 5 + 3} n={22} o={0.6} />
                      <path d={`M ${x0} ${22} L ${x0 + 182} ${18} L ${x0 + 178} ${212} L ${x0 + 3} ${208} Z`} fill="none" stroke={VO} strokeWidth={3} style={on > 0.5 ? oGlow : undefined} />
                      <path d={`M ${x0 + 12} 176 Q ${x0 + 90} 168 ${x0 + 168} 176`} fill="none" stroke={VT} strokeWidth={2.4} />
                      {[0, 1, 2, 3].map((q) => {
                        const gone = (variant === 1 && q === 2) || (variant === 3 && q === 0);
                        return <VHalo key={q} x={x0 + 34 + q * 38} y={168} s={0.62} col={gone ? "#ff5d4d" : VT} dash={gone} />;
                      })}
                      <text x={x0 + 90} y={60} textAnchor="middle" fill={variant % 2 ? "#ff5d4d" : GP} fontFamily={MONO} fontSize={30}>{variant % 2 ? "✕" : "✓"}</text>
                    </g>
                  );
                })}
              </Mural>
            ))}
            {/* o homem de terno (09/10, pedido dele: não só a maleta): desenhado DE CORPO INTEIRO no traço aceso dos murais,
                em pé no canto da parede, FORA das cenas — cabelo penteado, paletó com lapela, gravata, a maleta na mão; o olhar
                dele (pontilhado) vai até cada versão */}
            {mode === 2
              ? (() => {
                  const ga = (p.gmanAt as number | undefined) ?? 1e9;
                  const o = P(f, ga, 14);
                  const draw = (t0: number, len: number) => ({ strokeDasharray: `${len * P(f, ga + t0, 30)} ${len}` });
                  const CR = CREAM;
                  const cGlow = { filter: "drop-shadow(0 0 3px rgba(255,226,176,1)) drop-shadow(0 0 10px rgba(255,226,176,0.6))" };
                  return (
                    <Mural deg={180} o={o}>
                      <g transform="translate(352 226)" fill="none" stroke={CR} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" style={cGlow}>
                        {/* cabeça (sem rosto) e o cabelo penteado para trás */}
                        <ellipse cx={-2} cy={-176} rx={10} ry={13} style={draw(0, 80)} />
                        <path d="M -12 -180 Q -6 -194 8 -188" style={draw(4, 40)} />
                        <path d="M -2 -163 L -2 -156" />
                        {/* paletó: ombros, cintura, lapelas, gravata */}
                        <path d="M -22 -152 Q -2 -158 18 -152 L 15 -88 L -19 -88 Z" style={draw(6, 220)} />
                        <path d="M -9 -155 L -2 -128 L 5 -155" style={draw(10, 70)} />
                        <path d="M -2 -150 L -5 -126 L -2 -112 L 1 -126 Z" fill={CR} style={draw(12, 60)} />
                        {/* braço esquerdo solto, braço direito segurando a maleta */}
                        <path d="M -22 -150 L -27 -118 L -25 -92" style={draw(14, 70)} />
                        <path d="M 18 -150 L 24 -118 L 26 -96" style={draw(14, 70)} />
                        <rect x={16} y={-96} width={28} height={20} rx={2} style={draw(18, 100)} />
                        <path d="M 25 -96 v -5 h 10 v 5" />
                        {/* calças e sapatos */}
                        <path d="M -12 -88 L -14 -12 M 8 -88 L 10 -12" style={draw(16, 160)} />
                        <path d="M -14 -12 L -24 -10 M 10 -12 L 20 -10" />
                      </g>
                      {/* o olhar dele: pontilhado até cada versão */}
                      {[70, 190].map((x, k) => (
                        <path key={k} d={`M 348 52 Q ${(348 + x) / 2} ${10 + k * 6} ${x} 40`} fill="none" stroke={CR} strokeWidth={1.6} strokeDasharray="4 6" opacity={0.75 * P(f, ga + 26 + k * 6, 14)} />
                      ))}
                      <text x={352} y={22} textAnchor="middle" fill={CR} fontFamily={MONO} fontSize={13} letterSpacing={2} opacity={P(f, ga + 20, 10)}>DO LADO DE FORA</text>
                    </Mural>
                  );
                })()
              : null}
          </>
        )}
      </div>
      <XView e={e} faces={front} lights={lights} flash={0.85} amb={0.08} seam="rgba(10,10,8,0.4)" />
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {mode === 0 && f >= equipAt
          ? (() => {
              const cs = [[4.5, 3.0, 0], [7.1, 5.7, 0], [4.5, 3.0, 3.5], [7.1, 5.7, 3.5]].map((v) => proj(e, v as V3));
              if (cs.some((c) => !c)) return null;
              const xs = cs.map((c) => c!.x);
              const ys = cs.map((c) => c!.y);
              const x0 = Math.min(...xs) - 20;
              const y0 = Math.min(...ys) - 20;
              const w = Math.max(...xs) - x0 + 20;
              const h = Math.max(...ys) - y0 + 20;
              return (
                <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
                  <g opacity={P(f, equipAt + 10, 10)}>
                    <rect x={x0} y={y0} width={w} height={h} fill="none" stroke={ICE} strokeWidth={2} strokeDasharray="12 8" />
                    <text x={x0 + 10} y={y0 - 14} fill={ICE} fontFamily={MONO} fontSize={18} letterSpacing={4} style={{ paintOrder: "stroke", stroke: "#000", strokeWidth: 4 }}>EQUIPAMENTO COMBINE · MUITO MAIS RECENTE</text>
                  </g>
                </svg>
              );
            })()
          : null}
      </div>
      {!mode ? (
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          {/* o estalo de luz de cada cristal acendendo */}
          {Array.from({ length: 16 }).map((_, k) => {
            const t0 = ign(k);
            if (f < t0 || f >= t0 + 14) return null;
            const a = (k / 16) * Math.PI * 2 + f / 260;
            const rr = 1.5 + 1.1 * rnd(k * 3);
            const q = proj(e, [Math.cos(a) * rr, 10 + Math.sin(a) * rr, 2.1 + 1.3 * rnd(k * 7)]);
            if (!q) return null;
            const u = (f - t0) / 14;
            return <circle key={k} cx={q.x} cy={q.y} r={(8 + 60 * u) * Math.min(2, 6 / q.d)} fill="none" stroke="#b8ffd6" strokeWidth={3 * (1 - u)} opacity={1 - u} style={{ filter: "drop-shadow(0 0 8px #8dffa8)" }} />;
          })}
          {/* a vortessência: luz verde subindo dos cristais e abrindo para as paredes (as imagens no espaço) */}
          {f >= imgAt - 10
            ? Array.from({ length: 70 }).map((_, i) => {
                const per = 150 + rnd(i * 3) * 120;
                const ph = ((f - imgAt + rnd(i) * per) % per) / per;
                const a = rnd(i * 7) * Math.PI * 2 + ph * 2.4;
                const r = 0.6 + ph * (2.5 + 5 * rnd(i * 5)) * (f >= worldsAt ? 1.3 : 1);
                const q = proj(e, [Math.cos(a) * r, 10 + Math.sin(a) * r, 2.0 + ph * 3.4]);
                if (!q) return null;
                const o = P(f, imgAt - 10, 30) * Math.sin(ph * Math.PI) * (1 - 0.5 * P(f, passAt, 30));
                return <circle key={i} cx={q.x} cy={q.y} r={Math.max(1.5, 22 / q.d)} fill="#b8ffd6" opacity={0.75 * o} style={{ filter: "drop-shadow(0 0 6px #4dffc0)" }} />;
              })
            : null}
        </svg>
      ) : null}
      <div style={{ position: "absolute", left: 80, top: 100, fontFamily: MONO, letterSpacing: 6 }}>
        <div style={{ fontSize: 22, color: GREEN, opacity: mode ? 1 : P(f, ruinsAt, 10) }}>{mode ? "A PAREDE MAIS ANTIGA" : f >= obsAt ? "UM OBSERVATÓRIO ANTIGO" : "RUÍNAS VORTIGAUNTS"}</div>
        {!mode && f >= notDrawAt && f < obsAt ? <div style={{ fontSize: 16, color: "rgba(242,240,247,0.6)", marginTop: 8 }}>NÃO SÓ DESENHOS NAS PAREDES</div> : null}
        {!mode && f >= memAt ? <div style={{ fontSize: 16, color: "rgba(242,240,247,0.7)", marginTop: 8 }}>MEMÓRIA PRESERVADA PELA VORTESSÊNCIA</div> : null}
        {!mode && f >= notHoloAt && f < memAt ? <div style={{ fontSize: 16, color: "rgba(242,240,247,0.6)", marginTop: 8, textDecoration: "line-through" }}>HOLOGRAMA TECNOLÓGICO</div> : null}
        {mode ? <div style={{ fontSize: 16, color: "rgba(242,240,247,0.7)", marginTop: 8 }}>O MESMO ACONTECIMENTO · VERSÕES SEPARADAS</div> : null}
      </div>
      <Hud f={f} yaw={yaw} eye={e} blips={[]} msg={!mode && f >= sepAt ? "DUAS COISAS QUE PARECIAM IGUAIS" : !mode && f >= stonesAt && f < lightAt ? "PEDRAS E CRISTAIS SUSPENSOS" : !mode && f >= lightAt && f < imgAt ? "A LUZ DESENHA NAS PAREDES" : undefined} msgCol={CREAM} />
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ================================================================================================= 5D · lapsos → a maior mudança (POV)
// ela fecha o assunto e o grupo segue: corredor do navio com portas dos dois lados, a Alyx (marcador) à frente.
// LAPSOS: piscadas verdes cada vez mais frequentes (contador); ela olha uma porta e a porta abre DEPOIS; a frase dela
// trava no meio. A MAIOR MUDANÇA: o corredor treme, o fundo some em pedaços, as portas trocam de lugar, o rádio do
// Kleiner vira chiado, a Mossman: "não é uma mudança normal", e tudo é puxado para longe (o corredor estica).
type LDoor = { side: number; y: number };
const LDOORS: LDoor[] = [6, 10, 14, 18, 22, 26, 30, 34].map((y, i) => ({ side: i % 2 ? 1 : -1, y }));
const buildLapseCorr = (): XF[] => {
  const g = mk();
  for (let y = -4; y < 44; y += 2) {
    const k = ((y + 4) / 2) % 2 ? 1 : 0.9;
    g.quad([-1.6, y, 0], [1.6, y, 0], [1.6, y + 2, 0], [-1.6, y + 2, 0], [44 * k, 42 * k, 40 * k], [0, 0, 1], { tag: "floor" });
    g.quad([-1.6, y, 3], [-1.6, y + 2, 3], [1.6, y + 2, 3], [1.6, y, 3], [22, 22, 24], [0, 0, -1]);
    g.quad([-1.6, y, 0], [-1.6, y + 2, 0], [-1.6, y + 2, 3], [-1.6, y, 3], [64, 58, 52], [1, 0, 0]);
    g.quad([1.6, y + 2, 0], [1.6, y, 0], [1.6, y, 3], [1.6, y + 2, 3], [64, 58, 52], [-1, 0, 0]);
    // tubos e nervuras (rebites de navio)
    g.box(-1.6, y, 2.5, 0.18, 2, 0.18, [70, 62, 54]);
    g.box(1.42, y, 2.2, 0.18, 2, 0.14, [70, 62, 54]);
    if (Math.round(y) % 4 === 0) g.box(-0.6, y + 0.9, 2.94, 1.2, 0.25, 0.05, [255, 236, 200], { emit: 0.85, tag: "lamp" });
  }
  g.quad([1.6, 44, 0], [-1.6, 44, 0], [-1.6, 44, 3], [1.6, 44, 3], [30, 30, 32], [0, -1, 0]);
  return g.F;
};
const doorFaces = (d: LDoor, y: number, open: number, hot: boolean): XF[] => {
  // 12/10 (as portas piscavam em 42:11): batente e folha a poucos cm da parede brigavam na profundidade; agora com folga
  const x = d.side * (HALL_W - 0.16);
  const n: V3 = [-d.side, 0, 0];
  const F: XF[] = [];
  // batente aceso
  const fr: RGB = hot ? [255, 170, 80] : [120, 200, 210];
  F.push({ p: [[x, y - 0.86, 0], [x, y - 0.7, 0], [x, y - 0.7, 2.3], [x, y - 0.86, 2.3]], col: fr, n, emit: 0.75 });
  F.push({ p: [[x, y + 0.7, 0], [x, y + 0.86, 0], [x, y + 0.86, 2.3], [x, y + 0.7, 2.3]], col: fr, n, emit: 0.75 });
  F.push({ p: [[x, y - 0.86, 2.3], [x, y + 0.86, 2.3], [x, y + 0.86, 2.46], [x, y - 0.86, 2.46]], col: fr, n, emit: 0.75 });
  // a folha da porta (desliza para abrir)
  const dy = open * 1.35;
  F.push({ p: [[x - d.side * 0.03, y - 0.7 + dy, 0], [x - d.side * 0.03, y + 0.7 + dy, 0], [x - d.side * 0.03, y + 0.7 + dy, 2.3], [x - d.side * 0.03, y - 0.7 + dy, 2.3]], col: [104, 112, 118], n });
  F.push({ p: [[x - d.side * 0.06, y - 0.5 + dy, 1.45], [x - d.side * 0.06, y + 0.5 + dy, 1.45], [x - d.side * 0.06, y + 0.5 + dy, 1.6], [x - d.side * 0.06, y - 0.5 + dy, 1.6]], col: fr, n, emit: 0.6 });
  if (open > 0.05) F.push({ p: [[x + d.side * 0.02, y - 0.7, 0], [x + d.side * 0.02, y - 0.7 + dy, 0], [x + d.side * 0.02, y - 0.7 + dy, 2.3], [x + d.side * 0.02, y - 0.7, 2.3]], col: [255, 236, 200], n, emit: 0.5 });
  return F;
};
export const HLXLapseJump: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [walkAt, lapseAt, allAt, knowAt, doorAt, openAt, sentAt, stopAt, rememberAt, biggestAt, shakeAt, corrAt, doorsAt, radioAt, noiseAt, mossAt, notNormalAt, pullAt, farAt] = ["walkAt", "lapseAt", "allAt", "knowAt", "doorAt", "openAt", "sentAt", "stopAt", "rememberAt", "biggestAt", "shakeAt", "corrAt", "doorsAt", "radioAt", "noiseAt", "mossAt", "notNormalAt", "pullAt", "farAt"].map((k) => at(p, k));
  // 13/10 (pedido dele: o corredor fora do padrão dos outros): o mesmo corredor do navio das outras cenas
  const base = useMemo(() => buildShipHall2(44), []);
  const y = keys(f, [[0, 0], [walkAt, 0.6], [knowAt, 5.5], [openAt + 30, 7.2], [stopAt, 8.4], [biggestAt, 9.6], [life, 11]]);
  const shake = f >= shakeAt ? Math.min(1, (f - shakeAt) / 30) * (f >= pullAt ? 1.6 : 1) : f >= biggestAt ? 0.25 : 0;
  const e: Eye = { x: Math.sin(f * 1.7) * 0.03 * shake, y, z: 1.62 + Math.sin(f / 7) * 0.02 + Math.sin(f * 2.3) * 0.025 * shake, yaw: Math.sin(f * 1.1) * 0.012 * shake + (f < walkAt ? -0.25 : 0) * (1 - P(f, 0, 20)), pitch: Math.sin(f * 1.9) * 0.01 * shake, F: 940 };
  // portas: a que ela olha (índice 2) abre depois; na mudança, as portas trocam de lugar
  const swap = P(f, doorsAt, 26);
  const order = [3, 5, 0, 6, 1, 7, 2, 4];
  const doors = LDOORS.map((d, i) => {
    const d2 = LDOORS[order[i]];
    const yy = d.y + (d2.y - d.y) * swap;
    const side = swap > 0.5 ? d2.side : d.side;
    const open = i === 2 ? P(f, openAt, 14) : 0;
    return doorFaces({ side, y: yy }, yy, open, i === 2 && f >= knowAt && f < stopAt);
  }).flat();
  // o fundo some em pedaços e o corredor estica (puxado para longe)
  const cut = f >= corrAt ? interpolate(f, [corrAt, corrAt + 50], [44, 18], C) : 99;
  const pull = P(f, pullAt, 40);
  const stretch = (q: V3): V3 => [q[0], e.y + (q[1] - e.y) * (1 + 2.6 * pull), q[2]];
  const faces = base.concat(doors).map((fc) => ({ ...fc, p: fc.p.map(stretch) }));
  const hide = (fc: XF) => {
    const cy = fc.p.reduce((s, q) => s + q[1], 0) / fc.p.length;
    const yy = e.y + (cy - e.y) / (1 + 2.6 * pull);
    return yy > cut && rnd(Math.floor(yy) * 3.1 + Math.floor(f / 4)) > 0.25;
  };
  const red = f >= shakeAt ? 0.5 + 0.5 * Math.sin(f / 4) : 0;
  const lights: XL[] = [
    { x: 0, y: e.y + 4, z: 2.9, col: [255, 236, 200], k: f >= shakeAt ? 0.5 * (rnd(Math.floor(f / 3)) > 0.4 ? 1 : 0.3) : 0.9, r: 9 },
    { x: 0, y: e.y + 10, z: 2.9, col: [255, 236, 200], k: f >= shakeAt ? 0.3 : 0.7, r: 9 },
    { x: 0, y: e.y + 6, z: 2.5, col: [255, 60, 40], k: 0.6 * red, r: 10 },
    { x: 1.4, y: 14, z: 1.2, col: [255, 200, 140], k: P(f, openAt, 14) * 0.6, r: 5 },
  ];
  const lapse = f >= lapseAt && f < biggestAt && (f - lapseAt) % (f >= allAt ? 26 : 46) < 4;
  const nLapse = f >= lapseAt ? 1 + Math.floor((f - lapseAt) / (f >= allAt ? 26 : 46)) : 0;
  const alyxY = e.y + 4.4 + 2.6 * pull;
  const quote = "“Gordon, eu acho que o—”";
  const typed = f >= sentAt ? quote.slice(0, Math.min(f >= stopAt ? quote.length : quote.length - 1, Math.floor((f - sentAt) * 1.4))) : "";
  return (
    <AbsoluteFill style={{ background: "#020203", overflow: "hidden" }}>
      <XView e={e} faces={faces} lights={lights} flash={0.5} amb={0.13} hide={hide} seam="rgba(0,0,0,0.18)" />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <XMarker e={e} x={0.3} y={alyxY} label="ALYX" sub={f >= stopAt && f < biggestAt ? "PAROU NO MEIO" : f >= knowAt && f < openAt + 20 ? "OLHA A PORTA ANTES" : f < walkAt + 30 ? "EVITA O ASSUNTO" : undefined} col={lapse ? GREEN : ORANGE} f={f} o={1 - pull} />
        {f >= knowAt && f < openAt + 24
          ? (() => {
              const a = proj(e, [0.3, alyxY, 1.6]);
              const b = proj(e, [LDOORS[2].side * 1.5, LDOORS[2].y, 1.2]);
              return a && b ? <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={ORANGE} strokeWidth={2.5} strokeDasharray="6 7" strokeDashoffset={-f} opacity={P(f, knowAt, 8)} /> : null;
            })()
          : null}
        {f >= mossAt ? <XMarker e={e} x={-1.0} y={e.y + 2.4} label="MOSSMAN" sub={f >= notNormalAt ? "NÃO É UMA FASE NORMAL" : undefined} col={ICE} f={f} o={P(f, mossAt, 10)} /> : null}
      </svg>
      {/* a frase que trava */}
      {f >= sentAt && f < biggestAt ? (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 150, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 70, color: TXT, textShadow: "0 8px 40px #000" }}>
          {typed}
          {f >= rememberAt ? <div style={{ fontFamily: MONO, fontWeight: 400, fontSize: 18, letterSpacing: 5, color: GREEN, marginTop: 10 }}>COMO SE LEMBRASSE DE ALGO QUE AINDA NÃO ACONTECEU</div> : null}
        </div>
      ) : null}
      {/* o rádio do Kleiner */}
      {f >= radioAt ? (
        <div style={{ position: "absolute", right: 90, top: 150, width: 400, padding: "12px 16px", background: "rgba(6,8,10,0.8)", border: `1px solid ${f >= noiseAt ? RED : ICE}`, borderRadius: 10, fontFamily: MONO, opacity: P(f, radioAt, 8) }}>
          <div style={{ fontSize: 14, letterSpacing: 4, color: f >= noiseAt ? RED : ICE }}>{f >= noiseAt ? "RÁDIO · SÓ RUÍDO" : "RÁDIO · KLEINER"}</div>
          <svg width={368} height={50}>
            <polyline points={Array.from({ length: 74 }).map((_, k) => `${k * 5},${25 + (f >= noiseAt ? (rnd(k * 7 + f) - 0.5) * 44 : Math.sin(k * 0.5 + f * 0.4) * 12)}`).join(" ")} fill="none" stroke={f >= noiseAt ? RED : ICE} strokeWidth={1.6} />
          </svg>
        </div>
      ) : null}
      {/* contador de lapsos */}
      {f >= lapseAt && f < biggestAt ? (
        <div style={{ position: "absolute", left: 80, top: 150, fontFamily: MONO, color: GREEN, opacity: P(f, lapseAt, 8) }}>
          <div style={{ fontSize: 14, letterSpacing: 4 }}>LAPSOS</div>
          <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 56 }}>{nLapse}</div>
        </div>
      ) : null}
      {lapse ? <AbsoluteFill style={{ background: "rgba(141,255,168,0.12)", pointerEvents: "none" }} /> : null}
      <Hud f={f} yaw={e.yaw} eye={e} blips={[{ x: 0.3, y: alyxY }, ...(f >= mossAt ? [{ x: -1, y: e.y + 2.4 }] : [])]} msg={f >= farAt ? "ALGO PUXA O NAVIO MUITO MAIS LONGE" : f >= corrAt ? (f >= doorsAt ? "AS PORTAS TROCAM DE LUGAR" : "CORREDORES DESAPARECEM") : f >= biggestAt ? "A MAIOR MUDANÇA DESDE QUE ENTRARAM" : undefined} msgCol={f >= biggestAt ? RED : CREAM} />
      <AbsoluteFill style={{ background: "#fff", opacity: pull > 0.6 ? (pull - 0.6) * 0.6 : 0, pointerEvents: "none" }} />
      <AbsoluteFill style={{ background: "#000", opacity: interpolate(f, [0, 4], [1, 0], C), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ================================================================================================= 7 · a fenda nas ruínas (POV)
// 09/10 (pedidos dele: o cenário estava todo bugado; e na travessia a abertura aparecia em OUTRO lugar) — refeito como UM
// lugar só: um salão de ruínas Vortigaunt (paredes de pedra, colunas, faixa de glifos verdes, entulho) com um tablado de
// pedra no centro. A ruptura fica EM PÉ sobre o tablado — parecida com a membrana violeta que a Alyx abriu no Borealis —,
// abre e fecha sozinha com Xen lá dentro; em volta, tripés Combine com telas viradas para ela e cabos até o tablado.
// modo 1 (55:11): Gordon e Dog chegam, a fenda pulsa, o equipamento registra a mesma distorção do Borealis.
// modo 2 (56:10, HLXXenRift): o MESMO salão e a mesma câmera — eles esperam ao lado, ela reabre e os dois atravessam.
const RIFT_Y = 11;
const RIFT_C: V3 = [0, RIFT_Y, 2.15];
const RIFT_EQ: [number, number, number][] = [[-2.5, 9.4, 0.5], [2.5, 9.4, -0.5], [2.1, 12.9, -2.4]];
const buildRiftHall = (): XF[] => {
  const g = mk();
  g.room(-6, 6, 0, 20, 6, [74, 70, 58], [50, 48, 41], [22, 21, 18], [{ side: "S", c: 0, w: 3, h: 4 }], 2);
  // colunas encostadas nas paredes, com capitel
  for (const x of [-5.35, 5.35])
    for (let y = 3; y < 19; y += 3.6) {
      g.prism(x, y, 0, 5.6, 0.42, 8, [82, 78, 64], undefined, 0.2);
      g.prism(x, y, 5.6, 6, 0.6, 8, [66, 62, 52], undefined, 0.2);
    }
  // faixa de glifos Vortigaunt (verde aceso) nas paredes laterais
  for (const x of [-5.94, 5.9])
    for (let y = 1; y < 19.5; y += 1.4) {
      const w = 0.4 + 0.6 * rnd(y * 3 + x);
      g.box(x, y, 2.4 + 0.25 * rnd(y + x), 0.04, w, 0.12 + 0.1 * rnd(y * 7), [90, 255, 190], { emit: 0.55 });
    }
  // fundo: um nicho mais escuro atrás do tablado
  g.box(-2.6, 19.7, 0, 5.2, 0.2, 4.4, [40, 38, 32]);
  // o tablado de pedra com o anel de glifos aceso
  g.prism(0, RIFT_Y, 0, 0.3, 2.5, 18, [66, 63, 54]);
  g.prism(0, RIFT_Y, 0.3, 0.32, 2.15, 30, [100, 255, 190], { emit: 0.42 });
  g.prism(0, RIFT_Y, 0.32, 0.34, 1.95, 30, [62, 60, 52]);
  // entulho e blocos caídos
  [[-3.6, 6.2, 0.5], [3.9, 7.0, 0.4], [-3.2, 15.4, 0.6], [4.1, 16.2, 0.5], [-1.4, 17.6, 0.35]].forEach(([x, y, s], k) =>
    g.box(x - s / 2, y - s / 2, 0, s * (1 + 0.4 * rnd(k)), s, s * (0.6 + 0.6 * rnd(k * 3)), [70 + 10 * rnd(k), 66, 56]),
  );
  // o equipamento Combine: tripé (três pernas), corpo, tela virada para a fenda (tag scr) e cabo até o tablado
  RIFT_EQ.forEach(([x, y, face], k) => {
    for (let l = 0; l < 3; l++) {
      const a = (l / 3) * Math.PI * 2 + k;
      g.box(x + Math.cos(a) * 0.35 - 0.03, y + Math.sin(a) * 0.35 - 0.03, 0, 0.06, 0.06, 1.05, [36, 40, 46]);
    }
    g.box(x - 0.32, y - 0.24, 1.0, 0.64, 0.48, 0.5, [40, 46, 54]);
    g.box(x - 0.05, y - 0.05, 1.5, 0.1, 0.1, 0.5, [36, 40, 46]);
    g.box(x - 0.06, y - 0.06, 2.0, 0.12, 0.12, 0.06, [255, 90, 70], { emit: 0.8 });
    const sx = Math.sign(-x) || 1;
    // a tela: placa na face do corpo voltada para o tablado
    const fx = x + sx * 0.33;
    g.quad([fx, y - 0.2, 1.05], [fx, y + 0.2, 1.05], [fx, y + 0.2, 1.42], [fx, y - 0.2, 1.42], [70, 220, 240], [sx, 0, 0], { emit: 0.6, tag: "scr" });
    // cabo no chão até o tablado
    const dx = -x, dy = RIFT_Y - y, L = Math.hypot(dx, dy);
    const steps = 6;
    for (let i = 0; i < steps; i++) {
      const u0 = i / steps, u1 = (i + 1) / steps;
      const ax = x + dx * u0 * (1 - 2.4 / L), ay = y + dy * u0 * (1 - 2.4 / L);
      const bx = x + dx * u1 * (1 - 2.4 / L), by = y + dy * u1 * (1 - 2.4 / L);
      g.quad([ax - 0.04, ay, 0.01], [ax + 0.04, ay, 0.01], [bx + 0.04, by, 0.01], [bx - 0.04, by, 0.01], [18, 20, 24], [0, 0, 1]);
    }
    void face;
  });
  return g.F;
};
// o contorno da membrana (em pé, no plano y = RIFT_Y), com a borda viva
const riftEdge = (e: Eye, k: number, f: number) =>
  Array.from({ length: 40 }).map((_, i) => {
    const a = (i / 40) * Math.PI * 2;
    const w = 1 + 0.08 * Math.sin(a * 5 + f / 5) + 0.05 * Math.sin(a * 11 - f / 3);
    return proj(e, [RIFT_C[0] + Math.cos(a) * 1.45 * k * w, RIFT_Y, RIFT_C[2] + Math.sin(a) * 1.8 * k * w]);
  });
const RiftHall: React.FC<{ e: Eye; f: number; openK: number; hot: number; G: XF[] }> = ({ e, f, openK, hot, G }) => {
  const faces = G.map((fc) => (fc.tag === "scr" ? { ...fc, col: (hot > 0.3 ? [255, 120, 210] : [70, 220, 240]) as RGB } : fc));
  const lights: XL[] = [
    { x: 0, y: 6, z: 5, col: [255, 236, 200], k: 0.18, r: 14 },
    { x: RIFT_C[0], y: RIFT_Y, z: 2, col: [200, 140, 255], k: 0.15 + 0.9 * openK, r: 11 },
    { x: 0, y: 11, z: 0.6, col: [90, 255, 190], k: 0.25, r: 5 },
  ];
  const ring = riftEdge(e, openK, f);
  const ok = openK > 0.04 && ring.every((q) => q);
  const clip = ok ? `polygon(${ring.map((q) => `${q!.x.toFixed(0)}px ${q!.y.toFixed(0)}px`).join(", ")})` : "inset(100%)";
  const c = proj(e, RIFT_C);
  const CELLV = useMemo(() => buildCoastRoom(), []);
  const ce: Eye = { x: 0.4 + e.x * 0.4, y: 1.4, z: 1.7, yaw: 0.12 + e.yaw * 0.5, pitch: -0.02 + e.pitch * 0.5, F: 820 };
  const cellL: XL[] = [{ x: 0, y: 9.4, z: 1.6, col: [90, 210, 230], k: 0.75, r: 9 }, { x: -4.3, y: 3.9, z: 1.2, col: [255, 150, 70], k: 0.3, r: 5 }, { x: 0, y: 4, z: 3, col: [200, 220, 235], k: 0.35, r: 8 }];
  return (
    <>
      <XView e={e} faces={faces} lights={lights} flash={0.7} amb={0.12} seam="rgba(10,10,8,0.4)" solid />
      {/* 10/10 (pedido dele: dentro da ruptura não é Xen — é onde eles vão sair): a sala de terminais da instalação
          Combine no litoral (a mesma da cena seguinte), vista pela membrana com leve paralaxe */}
      <AbsoluteFill style={{ clipPath: clip, background: "#030303" }}>
        <XView e={ce} faces={CELLV} lights={cellL} flash={0.8} amb={0.2} />
        <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(246,232,255,0.06), rgba(176,128,246,0.16) 55%, rgba(70,34,130,0.45))" }} />
      </AbsoluteFill>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {ok ? <polygon points={ring.map((q) => `${q!.x},${q!.y}`).join(" ")} fill="none" stroke="#f3e6ff" strokeWidth={3.5} style={{ filter: "drop-shadow(0 0 10px #c79bff) drop-shadow(0 0 26px #9a6cff)" }} /> : null}
        {ok ? ring.filter((_, k) => rnd(k * 7 + Math.floor(f / 2)) > 0.84).map((q, k) => <circle key={k} cx={q!.x + (rnd(k + f) - 0.5) * 18} cy={q!.y + (rnd(k * 3 + f) - 0.5) * 18} r={2.2} fill="#fff" opacity={0.9} />) : null}
        {/* quando fechada: faíscas violetas no ar onde ela vai voltar */}
        {!ok && c
          ? Array.from({ length: 8 }).map((_, i) => {
              const t = (f / 16 + i / 8) % 1;
              const a = i * 2.4;
              return <circle key={i} cx={c.x + Math.cos(a) * t * 90 * Math.min(2, 6 / c.d)} cy={c.y + Math.sin(a) * t * 120 * Math.min(2, 6 / c.d)} r={2.5} fill="#e4c8ff" opacity={(1 - t) * 0.7} />;
            })
          : null}
      </svg>
    </>
  );
};
export const HLXRiftRuins: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [riftAt, aloneAt, equipAt, regAt, everyAt, distAt, syncAt, questAt, temporalAt, whyAt] = ["riftAt", "aloneAt", "equipAt", "regAt", "everyAt", "distAt", "syncAt", "questAt", "temporalAt", "whyAt"].map((k) => at(p, k));
  const G = useMemo(() => buildRiftHall(), []);
  const per = 70;
  const ph = f >= riftAt ? ((f - riftAt) % per) / per : -1;
  const openK = ph < 0 ? 0 : Math.max(0, Math.sin(ph * Math.PI * 1.15));
  const y = keys(f, [[0, -1.5], [riftAt, 3.4], [life, 5.2]]);
  const yaw = keys(f, [[0, 0], [riftAt, 0], [equipAt, 0], [equipAt + 24, 0.34], [questAt, 0.34], [questAt + 24, 0.02]]);
  const e: Eye = { x: -0.5 + 0.2 * Math.sin(f / 120), y, z: 1.7, yaw, pitch: keys(f, [[0, 0], [riftAt, 0.02], [life, 0.04]]), F: 930 };
  const wavePts = (ref: boolean) =>
    Array.from({ length: 90 }).map((_, k) => {
      const base = Math.sin(k * 0.35 + f * 0.25) * 10;
      const spike = ref ? (Math.abs(k - 45) < 12 ? Math.sin(k * 1.7) * 26 : 0) : openK > 0.3 && Math.abs(k - 45) < 12 ? Math.sin(k * 1.7 + f * 0.1) * 26 * openK : 0;
      return `${k * 4.4},${36 + base + spike}`;
    }).join(" ");
  const top = proj(e, [RIFT_C[0], RIFT_Y, RIFT_C[2] + 2.3]);
  const eqL = proj(e, [2.6, 9.4, 2.7]);
  return (
    <AbsoluteFill style={{ background: "#050605", overflow: "hidden" }}>
      <RiftHall e={e} f={f} openK={openK} hot={openK} G={G} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {f >= riftAt && top ? (
          <text x={top.x} y={top.y} textAnchor="middle" fill="#e4c8ff" fontFamily={MONO} fontSize={20} letterSpacing={5} style={{ paintOrder: "stroke", stroke: "#000", strokeWidth: 4 }} opacity={P(f, riftAt, 10)}>
            {f >= aloneAt ? "ABRE E FECHA SOZINHA" : "UMA RUPTURA"}
          </text>
        ) : null}
        {f >= equipAt && eqL ? (
          <text x={eqL.x} y={eqL.y} textAnchor="middle" fill={ICE} fontFamily={MONO} fontSize={18} letterSpacing={4} style={{ paintOrder: "stroke", stroke: "#000", strokeWidth: 4 }} opacity={P(f, equipAt, 10)}>
            {f >= regAt ? "EQUIPAMENTO COMBINE · REGISTRANDO" : "EQUIPAMENTO COMBINE"}
          </text>
        ) : null}
        <XMarker e={e} x={1.6} y={y + 2.2} label="DOG" col={ICE} f={f} o={P(f, 6, 10) * (1 - P(f, equipAt, 10))} />
      </svg>
      {/* o registro: a onda da fenda × a assinatura do Borealis fora de sincronia */}
      {f >= everyAt ? (
        <div style={{ position: "absolute", right: 80, top: 150, width: 440, padding: "14px 18px", background: "rgba(6,8,10,0.85)", border: `1px solid ${ICE}`, borderRadius: 10, fontFamily: MONO, opacity: P(f, everyAt, 10) }}>
          <div style={{ fontSize: 14, letterSpacing: 4, color: openK > 0.3 ? "#e4c8ff" : ICE }}>{openK > 0.3 ? "ABERTURA · DISTORÇÃO" : "REGISTRO DA FENDA"}</div>
          <svg width={400} height={72}>
            <polyline points={wavePts(false)} fill="none" stroke={openK > 0.3 ? "#e4c8ff" : ICE} strokeWidth={2} />
          </svg>
          {f >= syncAt ? (
            <>
              <div style={{ fontSize: 14, letterSpacing: 4, color: ORANGE, marginTop: 6 }}>BOREALIS · FORA DE SINCRONIA</div>
              <svg width={400} height={72}>
                <polyline points={wavePts(true)} fill="none" stroke={ORANGE} strokeWidth={2} />
              </svg>
              <div style={{ fontSize: 16, letterSpacing: 4, color: GREEN, marginTop: 4 }}>MESMA DISTORÇÃO</div>
            </>
          ) : null}
        </div>
      ) : null}
      {/* a pergunta do começo: no painel do HEV (nada de frase solta no meio do POV) */}
      {f >= temporalAt ? (
        <div style={{ position: "absolute", left: 90, top: 150, width: 560, padding: "14px 18px", borderRadius: 12, background: "rgba(10,6,14,0.86)", border: "1.5px solid #c79bff", fontFamily: MONO, opacity: P(f, temporalAt, 8) }}>
          <div style={{ fontSize: 14, letterSpacing: 5, color: "#c79bff" }}>A PERGUNTA DO COMEÇO</div>
          <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 34, color: TXT, marginTop: 8, lineHeight: 1.2 }}>
            Se o Borealis é temporal,{f >= whyAt ? <span style={{ color: "#e4c8ff" }}> por que ele abre pra Xen?</span> : null}
          </div>
        </div>
      ) : null}
      <Hud f={f} yaw={yaw} eye={e} blips={[{ x: 1.6, y: y + 2.2 }]} msg={f >= distAt && f < questAt ? "A MESMA DISTORÇÃO DO BOREALIS" : f >= riftAt && f < equipAt ? "RUÍNAS VORTIGAUNT · UMA RUPTURA" : undefined} msgCol={CREAM} />
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

const CYAN_C = "#5ff3ff";

// ================================================================================================= 7 · o terminal do litoral (POV → tela)
// a sala de terminais da instalação Combine no litoral: o Gordon atravessa a sala até o console; a tela toma o quadro
// (interface Combine): ORDENS RECENTES (linhas digitadas), MOVIMENTAÇÃO DE TROPAS (mapa com setas), SALTOS DO
// BOREALIS (coordenadas); em "autorizadas" cada coluna leva o carimbo AUTORIZADO · A. VANCE; a ficha dela entra; "não
// tem mais como fingir"; na fuga a tela cai, o alarme acende e a câmera vira para a porta.
export const buildCoastRoom = (): XF[] => {
  const g = mk();
  g.room(-5, 5, 0, 10, 3.4, [30, 40, 46], [26, 30, 33], [14, 17, 20], [{ side: "S", c: 0, w: 2.2, h: 2.6 }]);
  // consoles Combine (HL2/HL:Alyx): pedestal sextavado, mesa inclinada, tela alta inclinada para trás acesa em
  // branco-azulado, aletas laterais, tampa angulosa e cabos no chão; o do meio é o maior
  for (let k = -1; k <= 1; k++) {
    const cx = k * 2.7;
    const big = k === 0 ? 1.15 : 0.9;
    const met: RGB = [30, 38, 48];
    g.prism(cx, 9.0, 0, 0.85, 0.42 * big, 6, met, undefined, 0.5);
    g.prism(cx, 9.0, 0.85, 0.95, 0.6 * big, 6, [22, 28, 36], undefined, 0.5);
    // mesa inclinada com teclas acesas
    g.quad([cx - 0.95 * big, 8.45, 0.95], [cx + 0.95 * big, 8.45, 0.95], [cx + 0.95 * big, 9.15, 1.18], [cx - 0.95 * big, 9.15, 1.18], [40, 50, 62], [0, -0.3, 0.95]);
    for (let i = 0; i < 6; i++) g.box(cx - 0.8 * big + i * 0.3 * big, 8.62, 1.0 + 0.02, 0.18 * big, 0.12, 0.03, i % 3 ? [70, 190, 230] : [255, 150, 80], { emit: 0.6 });
    // a tela alta, inclinada para trás
    g.quad([cx - 0.92 * big, 9.25, 1.22], [cx + 0.92 * big, 9.25, 1.22], [cx + 0.82 * big, 9.6, 1.22 + 1.45 * big], [cx - 0.82 * big, 9.6, 1.22 + 1.45 * big], [30, 80, 110], [0, -0.97, 0.24], { emit: 0.5 });
    // moldura e aletas
    g.box(cx - 1.02 * big, 9.22, 1.1, 0.1, 0.5, 1.7 * big, met);
    g.box(cx + 0.92 * big, 9.22, 1.1, 0.1, 0.5, 1.7 * big, met);
    g.quad([cx - 1.05 * big, 9.55, 1.22 + 1.5 * big], [cx + 1.05 * big, 9.55, 1.22 + 1.5 * big], [cx + 0.9 * big, 9.95, 1.22 + 1.62 * big], [cx - 0.9 * big, 9.95, 1.22 + 1.62 * big], [26, 32, 40], [0, -0.3, 0.95]);
    g.box(cx - 0.06, 9.7, 0, 0.12, 0.6, 0.06, [14, 16, 20]);
  }
  // nervuras e faixas de luz Combine nas paredes, cabos no teto
  for (let y = 0.8; y < 10; y += 2.0) {
    g.box(-5, y, 0, 0.25, 0.3, 3.4, [18, 22, 26]);
    g.box(4.75, y, 0, 0.25, 0.3, 3.4, [18, 22, 26]);
    g.box(-4.78, y + 0.5, 2.4, 0.03, 0.9, 0.1, [80, 220, 230], { emit: 0.55 });
    g.box(4.75, y + 0.5, 2.4, 0.03, 0.9, 0.1, [80, 220, 230], { emit: 0.55 });
  }
  for (let x = -4; x <= 4; x += 2) g.box(x - 0.08, 0, 3.2, 0.16, 10, 0.12, [16, 18, 22]);
  // caixas de equipamento e um rack lateral
  g.box(-4.4, 3.2, 0, 1.0, 1.4, 1.8, [40, 46, 52]);
  g.box(-4.36, 3.3, 0.8, 0.02, 1.2, 0.5, [255, 150, 70], { emit: 0.35 });
  g.box(3.4, 5.6, 0, 1.2, 0.9, 0.8, [44, 48, 52]);
  return g.F;
};
const CoastStamp: React.FC<{ f: number; at: number; rot?: number }> = ({ f, at: t, rot = -6 }) => {
  if (f < t) return null;
  const k = P(f, t, 6);
  return (
    <div style={{ position: "absolute", right: 14, bottom: 14, transform: `rotate(${rot}deg) scale(${1.8 - 0.8 * k})`, opacity: k, padding: "8px 14px", border: `3px solid ${RED}`, borderRadius: 6, fontFamily: MONO, fontSize: 22, letterSpacing: 3, color: RED, background: "rgba(40,6,6,0.55)", whiteSpace: "nowrap" }}>
      AUTORIZADO · A. VANCE
    </div>
  );
};
// a tela de um console Combine (400×300): fundo azul-petróleo, grade, faixa de glifos, linhas de registro rolando, um
// radar girando e um alerta laranja piscando
export const CombineScreen: React.FC<{ f: number; big?: boolean }> = ({ f, big }) => (
  <svg width={400} height={300} viewBox="0 0 400 300">
    <rect width={400} height={300} fill="#082030" />
    {Array.from({ length: 9 }).map((_, i) => <line key={"v" + i} x1={i * 50} x2={i * 50} y1={0} y2={300} stroke="rgba(159,230,255,0.08)" />)}
    {Array.from({ length: 7 }).map((_, i) => <line key={"h" + i} x1={0} x2={400} y1={i * 50} y2={i * 50} stroke="rgba(159,230,255,0.08)" />)}
    {Array.from({ length: 22 }).map((_, i) => {
      const v = rnd(i * 5 + Math.floor(f / 8));
      return <rect key={"g" + i} x={14 + i * 17} y={14} width={v > 0.5 ? 10 : 5} height={v > 0.7 ? 11 : 7} fill="#9fe6ff" opacity={0.5} />;
    })}
    <line x1={10} x2={390} y1={34} y2={34} stroke="#9fe6ff" strokeWidth={1.5} opacity={0.6} />
    <g clipPath="inset(0)">
      {Array.from({ length: 9 }).map((_, i) => {
        const row = (i + Math.floor(f / 10)) % 9;
        const w = 60 + rnd(row * 13 + Math.floor(f / 90)) * (big ? 150 : 120);
        return <rect key={"l" + i} x={14} y={48 + i * 24} width={w} height={8} fill={rnd(row * 3) > 0.82 ? "#ffb066" : "#cfefff"} opacity={0.75} />;
      })}
    </g>
    <g transform="translate(320 170)">
      <circle r={58} fill="none" stroke="#9fe6ff" strokeWidth={1.5} opacity={0.7} />
      <circle r={36} fill="none" stroke="#9fe6ff" strokeWidth={1} opacity={0.4} />
      <line x1={0} y1={0} x2={Math.cos(f / 12) * 58} y2={Math.sin(f / 12) * 58} stroke="#9fe6ff" strokeWidth={2} />
      <circle cx={22} cy={-18} r={4} fill="#ffb066" opacity={Math.floor(f / 10) % 2 ? 1 : 0.3} />
    </g>
    <rect x={14} y={270} width={120} height={14} fill="#ffb066" opacity={Math.floor(f / 15) % 2 ? 0.9 : 0.25} />
  </svg>
);
export const HLXCoastTerminal: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [discAt, advAt, termAt, ordAt, troopAt, coordAt, authAt, alyxAt, fakeAt, wrongAt, reallyAt, escAt] = ["discAt", "advAt", "termAt", "ordAt", "troopAt", "coordAt", "authAt", "alyxAt", "fakeAt", "wrongAt", "reallyAt", "escAt"].map((k) => at(p, k));
  // 12/10 (pedido dele: a saída era um vão preto e a passagem para a cela fraca): atrás da porta já está a ala das celas
  // (a mesma da cena seguinte, virada: célula (x, y) → aqui (−x, −y)); a fuga atravessa a porta e entra no corredor
  const G = useMemo(() => {
    const cells = buildCellBlock().concat(barsFaces(0)).filter((fc) => !fc.p.every((q) => Math.abs(q[1]) < 0.01)).map((fc) => ({ ...fc, p: fc.p.map((q) => [-q[0], -q[1], q[2]] as V3), n: [-fc.n[0], -fc.n[1], fc.n[2]] as V3 }));
    return buildCoastRoom().concat(cells);
  }, []);
  const y = keys(f, [[0, 0.6], [discAt, 1.2], [termAt, 7.4], [escAt, 7.4], [escAt + 30, 5.0], [life, -0.5]]);
  const yaw = keys(f, [[0, 0.35], [discAt, 0.2], [termAt - 10, 0], [escAt, 0], [escAt + 26, Math.PI], [life, Math.PI]]);
  const e: Eye = { x: 0.3 * Math.sin(f / 90), y, z: 1.65 + (f >= escAt + 26 ? Math.abs(Math.sin(f / 4)) * 0.05 : 0), yaw, pitch: keys(f, [[0, 0], [termAt - 10, -0.06], [escAt, -0.06], [escAt + 20, 0]]), F: 950 };
  const alarm = f >= escAt ? 0.5 + 0.5 * Math.sin((f - escAt) / 4) : 0;
  const lights: XL[] = [
    { x: 0, y: 9.4, z: 1.6, col: [90, 210, 230], k: 0.45, r: 7 },
    { x: -4.3, y: 3.9, z: 1.2, col: [255, 150, 70], k: 0.2, r: 4 },
    { x: 0, y: 5, z: 3.2, col: [255, 40, 30], k: 0.8 * alarm, r: 9 },
    // as luzes da ala das celas, atrás da porta
    ...[1.75, 5.25, 8.75].map((ly) => ({ x: 0, y: -ly, z: 3.1, col: [230, 240, 215] as RGB, k: 0.55, r: 5.5 })),
  ];
  // a tela toma o quadro: entra quando a câmera chega; sai na fuga (cai em ruído)
  const ui = P(f, termAt - 4, 14) * (1 - P(f, escAt, 8));
  const glitch = f >= escAt && f < escAt + 10;
  const col = (t0: number, title: string, body: React.ReactNode, stampAt: number, i: number) =>
    f >= t0 ? (
      <div style={{ position: "relative", flex: 1, height: 430, padding: "20px 24px", background: "linear-gradient(160deg, rgba(20,60,84,0.85), rgba(6,22,32,0.9))", clipPath: "polygon(22px 0, 100% 0, 100% calc(100% - 22px), calc(100% - 22px) 100%, 0 100%, 0 22px)", boxShadow: `inset 0 0 0 1.5px ${CYAN_C}`, opacity: P(f, t0, 8), transform: `translateY(${(1 - P(f, t0, 10)) * 20}px)` }}>
        <div style={{ fontFamily: MONO, fontSize: 22, letterSpacing: 5, color: CYAN_C }}>{decode(title, f, t0, 2.2)}</div>
        <div style={{ height: 1, background: "rgba(95,243,255,0.35)", margin: "12px 0 14px" }} />
        {body}
        <CoastStamp f={f} at={stampAt} rot={[-7, 4, -3][i]} />
      </div>
    ) : null;
  const orders = ["MANTER TRANSMISSÃO DO NÚCLEO", "RESTRIÇÃO · SETOR NORTE", "TRANSFERIR UNIDADES · DOCA 2", "PRIORIDADE · BOREALIS"];
  const jumps = ["78°41'N 15°02'E · D−11", "81°12'N 03°55'W · D−6", "79°58'N 22°40'E · D−2", "80°30'N 10°10'E · PRÓXIMO"];
  return (
    <AbsoluteFill style={{ background: "#020304", overflow: "hidden" }}>
      <XView e={e} faces={G} lights={lights} flash={0.85} amb={0.08} />
      {ui < 0.99
        ? [-1, 0, 1].map((k) => {
            const cx = k * 2.7;
            const big = k === 0 ? 1.15 : 0.9;
            const c4 = [
              proj(e, [cx - 0.86 * big, 9.6, 1.22 + 1.4 * big]),
              proj(e, [cx + 0.86 * big, 9.6, 1.22 + 1.4 * big]),
              proj(e, [cx + 0.9 * big, 9.27, 1.26]),
              proj(e, [cx - 0.9 * big, 9.27, 1.26]),
            ];
            if (c4.some((q) => !q)) return null;
            const m = quadMatrix3d(400, 300, c4.map((q) => [q!.x, q!.y]) as [number, number][]);
            if (!m) return null;
            return (
              <div key={k} style={{ position: "absolute", left: 0, top: 0, width: 400, height: 300, transformOrigin: "0 0", transform: m, opacity: 1 - ui }}>
                <CombineScreen f={f + k * 37} big={k === 0} />
              </div>
            );
          })
        : null}
      {alarm > 0 ? <AbsoluteFill style={{ background: `rgba(255,30,20,${0.16 * alarm})`, pointerEvents: "none" }} /> : null}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {f >= escAt + 20 ? <XMarker e={e} x={-1.2} y={2.2} label="DOG" col={AMB} f={f} o={P(f, escAt + 20, 10)} sub="ABRE CAMINHO" /> : null}
      </svg>
      {ui > 0.01 ? (
        <AbsoluteFill style={{ opacity: glitch ? (f % 2 ? 0.2 : 0.8) : ui, transform: `scale(${0.92 + 0.08 * ui})`, background: "radial-gradient(ellipse at 50% 38%, #0d2a3c 0%, #04101a 75%)" }}>
          {/* grade fina da tela Combine, faixa de glifos no topo, emblema girando */}
          <AbsoluteFill style={{ backgroundImage: "linear-gradient(rgba(159,230,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(159,230,255,0.06) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
            <g transform={`translate(1820 1000) rotate(${f * 0.8})`} opacity={0.5}>
              <polygon points="0,-34 29,-17 29,17 0,34 -29,17 -29,-17" fill="none" stroke={CYAN_C} strokeWidth={2} />
              <path d="M -12 -12 L 12 -12 L 12 -4 L -2 -4 L -2 4 L 12 4 L 12 12 L -12 12 Z" fill={CYAN_C} />
            </g>
            {Array.from({ length: 46 }).map((_, i) => {
              const v = rnd(i * 7 + Math.floor(f / 6));
              return <rect key={i} x={90 + i * 22} y={160} width={v > 0.5 ? 12 : 6} height={v > 0.75 ? 14 : 8} fill={CYAN_C} opacity={0.25 + 0.4 * rnd(i)} />;
            })}
            <line x1={90} x2={1830} y1={182} y2={182} stroke={CYAN_C} strokeWidth={1} opacity={0.35} />
          </svg>
          <div style={{ position: "absolute", left: 90, top: 70, fontFamily: MONO, color: CYAN_C, letterSpacing: 6 }}>
            <div style={{ fontSize: 22 }}>{decode("TERMINAL OVERWATCH · INSTALAÇÃO LITORAL-7", f, termAt, 2)}</div>
            <div style={{ fontSize: 15, color: "rgba(159,230,255,0.6)", marginTop: 6 }}>REGISTROS RECENTES · ACESSO NÍVEL ADVISOR</div>
          </div>
          <div style={{ position: "absolute", left: 90, right: 90, top: 210, display: "flex", gap: 30 }}>
            {col(
              ordAt,
              "ORDENS RECENTES",
              <div style={{ fontFamily: MONO, fontSize: 24, lineHeight: 1.9, color: "#dff8ff" }}>
                {orders.map((o, i) => {
                  const t0 = ordAt + 6 + i * 7;
                  const n = Math.floor(interpolate(f, [t0, t0 + 10], [0, o.length], C));
                  return f >= t0 ? <div key={i}>{`› ${o.slice(0, n)}`}</div> : null;
                })}
              </div>,
              authAt,
              0,
            )}
            {col(
              troopAt,
              "MOVIMENTAÇÃO DE TROPAS",
              <svg width={480} height={330} viewBox="0 30 480 400">
                <path d="M 20 330 Q 120 250 180 270 T 330 190 T 460 120" fill="none" stroke="rgba(159,230,255,0.4)" strokeWidth={2} />
                <text x={30} y={360} fill="rgba(159,230,255,0.6)" fontFamily={MONO} fontSize={14} letterSpacing={3}>LITORAL</text>
                {[[60, 300, 260, 180], [90, 340, 300, 230], [140, 280, 380, 150]].map(([x0, y0, x1, y1], i) => {
                  const k = P(f, troopAt + 8 + i * 6, 26);
                  return (
                    <g key={i}>
                      <line x1={x0} y1={y0} x2={x0 + (x1 - x0) * k} y2={y0 + (y1 - y0) * k} stroke={RED} strokeWidth={4} strokeLinecap="round" />
                      {k > 0.95 ? <polygon points={`${x1},${y1} ${x1 - 14},${y1 + 4} ${x1 - 6},${y1 + 14}`} fill={RED} /> : null}
                      <rect x={x0 - 8} y={y0 - 8} width={16} height={16} fill={RED} opacity={k > 0 ? 1 : 0} />
                    </g>
                  );
                })}
                <circle cx={420} cy={110} r={16 + 4 * Math.sin(f / 6)} fill="none" stroke={CYAN_C} strokeWidth={2} opacity={P(f, troopAt + 30, 10)} />
                <text x={392} y={80} fill={CYAN_C} fontFamily={MONO} fontSize={14} letterSpacing={3} opacity={P(f, troopAt + 30, 10)}>BOREALIS</text>
              </svg>,
              authAt + 6,
              1,
            )}
            {col(
              coordAt,
              "SALTOS DO BOREALIS · COORDENADAS",
              <div style={{ fontFamily: MONO, fontSize: 22, lineHeight: 2.1, color: "#dff8ff" }}>
                {jumps.map((j, i) => {
                  const t0 = coordAt + 6 + i * 6;
                  return f >= t0 ? (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", opacity: P(f, t0, 6) }}>
                      <span>{`◆ ${j}`}</span>
                      <span style={{ color: i === 3 ? AMB : "rgba(159,230,255,0.6)" }}>{i === 3 ? "ABERTO" : "OK"}</span>
                    </div>
                  ) : null;
                })}
              </div>,
              authAt + 12,
              2,
            )}
          </div>
          {f >= alyxAt ? (
            <div style={{ position: "absolute", right: 90, top: 70, display: "flex", gap: 16, alignItems: "center", padding: "10px 16px", border: `1.5px solid ${RED}`, borderRadius: 10, background: "rgba(30,6,6,0.85)", opacity: P(f, alyxAt, 8), transform: `translateX(${(1 - P(f, alyxAt, 12)) * 60}px)` }}>
              <div style={{ width: 70, height: 86, borderRadius: 6, overflow: "hidden", border: `1px solid ${RED}` }}>
                <Img src={staticFile("hl3silh/alyx_badge.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 35%", filter: "grayscale(1) contrast(1.15) brightness(0.95)" }} />
              </div>
              <div style={{ fontFamily: MONO, letterSpacing: 3 }}>
                <div style={{ fontSize: 14, color: "rgba(255,180,170,0.75)" }}>AUTORIZAÇÃO</div>
                <div style={{ fontSize: 24, color: "#fff0ee" }}>ALYX VANCE</div>
                <div style={{ fontSize: 14, color: RED }}>NÍVEL · ADVISOR</div>
              </div>
            </div>
          ) : null}
          {f >= fakeAt ? (
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 120, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 60, color: TXT, textShadow: "0 8px 40px #000", opacity: P(f, fakeAt, 8) }}>
              Não tem mais como fingir
              {f >= wrongAt ? (
                <div style={{ fontFamily: MONO, fontWeight: 400, fontSize: 24, letterSpacing: 5, marginTop: 10, color: "rgba(242,240,247,0.7)", opacity: P(f, wrongAt, 8) }}>
                  <span style={{ position: "relative" }}>
                    O GORDON ENTENDEU ERRADO
                    <span style={{ position: "absolute", left: -6, right: -6, top: "50%", height: 4, background: RED, transformOrigin: "left", transform: `scaleX(${P(f, wrongAt + 6, 8)})` }} />
                  </span>
                </div>
              ) : null}
            </div>
          ) : null}
          {f >= reallyAt ? (
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 60, textAlign: "center", fontFamily: MONO, fontSize: 22, letterSpacing: 6, color: RED, opacity: P(f, reallyAt, 8) }}>ELA REALMENTE TRABALHA COM OS COMBINE</div>
          ) : null}
          <AbsoluteFill style={{ background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.16) 0 2px, rgba(0,0,0,0) 2px 4px)", pointerEvents: "none" }} />
          {/* a moldura do console em volta da tela (metal escuro, cantos chanfrados, parafusos) */}
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            <path d="M 0 0 H 1920 V 1080 H 0 Z M 60 40 L 1860 40 L 1890 70 L 1890 1010 L 1860 1040 L 60 1040 L 30 1010 L 30 70 Z" fill="#141a20" fillRule="evenodd" />
            <path d="M 60 40 L 1860 40 L 1890 70 L 1890 1010 L 1860 1040 L 60 1040 L 30 1010 L 30 70 Z" fill="none" stroke="#3a4650" strokeWidth={4} />
            {[[48, 56], [1872, 56], [48, 1024], [1872, 1024]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={6} fill="#2a323a" stroke="#56626c" strokeWidth={2} />)}
          </svg>
        </AbsoluteFill>
      ) : null}
      {ui < 0.99 ? <Hud f={f} yaw={e.yaw} eye={e} blips={[{ x: 0, y: 9 }]} msg={f >= escAt ? "FUGA · ALARME" : f >= advAt && f < termAt ? "NÃO FOI ALGO ISOLADO" : f < discAt ? "INSTALAÇÃO COMBINE · LITORAL" : undefined} msgCol={f >= escAt ? RED : CREAM} o={1 - ui} /> : null}
      <AbsoluteFill style={{ background: "#000", opacity: interpolate(f, [0, 8], [1, 0], C), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ================================================================================================= 7 · a ala de detenção (POV)
// corredor de celas com grade dos dois lados, luz fria piscando. A voz reclamando vem da cela 4 (onda + "…a comida…"),
// a grade desliza, o marcador BARNEY acende e a ficha dele entra (captura térmica do HEV no lugar da foto): velho,
// acabado, puto da vida, VIVO; a pendência da cerveja (Black Mesa). Depois os três saem: espingarda, Gravity Gun, Dog.
const CELLS: { side: number; y: number }[] = [3, 6.5, 10, 13.5].flatMap((y) => [{ side: -1, y }, { side: 1, y }]);
const BCELL = { side: 1, y: 10 };
// 12/10 (pedido dele: a ala das celas toda torta, cinza, crua): refeita. Corredor de concreto com rodapé escuro, faixa
// pintada (azul Combine) na altura da cintura, pilastras de metal entre as celas, verga em cima de cada vão; teto mais
// alto com dois canos e luminárias em gaiola. Cada cela: paredes de concreto, beliche de metal com colchão, vaso e pia
// de aço, luz fraca. Grades com moldura e travessas; o portão da cela do Barney SOBE para dentro da verga (antes deslizava
// por cima da cela vizinha).
const CB = { hw: 1.6, H: 3.4, open: 2.8, oh: 2.6, depth: 3.0 };
export const buildCellBlock = (): XF[] => {
  const g = mk();
  const L = 18;
  const conc: RGB = [92, 94, 90], concD: RGB = [62, 64, 62], band: RGB = [44, 74, 86], steel: RGB = [70, 76, 82];
  // piso: placas com rejunte e a canaleta no meio
  for (let y = 0; y < L; y += 1.0)
    for (let x = -CB.hw; x < CB.hw - 0.01; x += 1.6) {
      const k = 0.9 + 0.12 * rnd(Math.round(y * 7) + Math.round(x * 3) * 13);
      g.quad([x, y, 0], [x + 1.6, y, 0], [x + 1.6, y + 1, 0], [x, y + 1, 0], [58 * k, 60 * k, 58 * k], [0, 0, 1], { tag: "floor" });
      g.quad([x, y, 0.004], [x + 1.6, y, 0.004], [x + 1.6, y + 0.03, 0.004], [x, y + 0.03, 0.004], [30, 32, 32], [0, 0, 1], { tag: "floor" });
    }
  g.quad([-0.12, 0, 0.006], [0.12, 0, 0.006], [0.12, L, 0.006], [-0.12, L, 0.006], [34, 36, 36], [0, 0, 1], { tag: "floor" });
  // teto
  for (let y = 0; y < L; y += 2) g.quad([-CB.hw, y, CB.H], [-CB.hw, y + 2, CB.H], [CB.hw, y + 2, CB.H], [CB.hw, y, CB.H], [40, 42, 42], [0, 0, -1]);
  // paredes: entre os vãos (pilastras) e em cima dos vãos (verga), com rodapé e faixa pintada
  const wallSeg = (s: number, y0: number, y1: number, z0: number, z1: number) => {
    const x = s * CB.hw;
    const n: V3 = [-s, 0, 0];
    const q = (za: number, zb: number, col: RGB) => {
      const a = Math.max(z0, za), b = Math.min(z1, zb);
      if (b > a) g.quad([x, s > 0 ? y1 : y0, a], [x, s > 0 ? y0 : y1, a], [x, s > 0 ? y0 : y1, b], [x, s > 0 ? y1 : y0, b], col, n);
    };
    q(0, 0.3, concD);
    q(0.3, 1.0, conc);
    q(1.0, 1.18, band);
    q(1.18, CB.H, conc);
  };
  for (const s of [-1, 1]) {
    let y = 0;
    for (const cy of CELLS.filter((q) => q.side === s).map((q) => q.y).sort((a, b) => a - b)) {
      const a = cy - CB.open / 2, b = cy + CB.open / 2;
      wallSeg(s, y, a, 0, CB.H);
      wallSeg(s, a, b, CB.oh, CB.H);
      // moldura de metal do vão (montantes e verga)
      const x = s * (CB.hw - 0.04);
      g.box(x - 0.06, a - 0.12, 0, 0.12, 0.12, CB.oh + 0.12, steel);
      g.box(x - 0.06, b, 0, 0.12, 0.12, CB.oh + 0.12, steel);
      g.box(x - 0.06, a - 0.12, CB.oh, 0.12, CB.open + 0.24, 0.12, steel);
      // a plaquinha da cela
      g.box(x - s * 0.01 - 0.01, a - 0.5, 1.9, 0.02, 0.32, 0.18, [200, 196, 180]);
      y = b;
    }
    wallSeg(s, y, L, 0, CB.H);
  }
  // fundo do corredor (porta de saída) e começo
  g.quad([CB.hw, L, 0], [-CB.hw, L, 0], [-CB.hw, L, CB.H], [CB.hw, L, CB.H], concD, [0, -1, 0]);
  // a porta de saída: batente de aço, folha com visor gradeado e barra, placa de saída acesa em cima
  g.box(-0.78, L - 0.12, 0, 0.14, 0.12, 2.4, [70, 76, 82]);
  g.box(0.64, L - 0.12, 0, 0.14, 0.12, 2.4, [70, 76, 82]);
  g.box(-0.78, L - 0.12, 2.3, 1.56, 0.12, 0.14, [70, 76, 82]);
  g.box(-0.64, L - 0.06, 0, 1.28, 0.06, 2.3, [58, 64, 70]);
  g.box(-0.3, L - 0.08, 1.45, 0.6, 0.02, 0.45, [20, 26, 30]);
  for (let k = 0; k < 4; k++) g.box(-0.24 + k * 0.16, L - 0.09, 1.45, 0.03, 0.02, 0.45, [80, 86, 92]);
  g.box(-0.5, L - 0.1, 1.0, 1.0, 0.04, 0.06, [110, 116, 122]);
  g.box(-0.45, L - 0.08, 2.48, 0.9, 0.04, 0.22, [40, 44, 46]);
  g.box(-0.4, L - 0.1, 2.51, 0.8, 0.02, 0.16, [255, 90, 60], { emit: 0.7 });
  g.quad([-CB.hw, 0, 0], [CB.hw, 0, 0], [CB.hw, 0, CB.H], [-CB.hw, 0, CB.H], concD, [0, 1, 0]);
  // canos no teto e luminárias em gaiola
  g.box(-1.2, 0, CB.H - 0.3, 0.12, L, 0.12, [60, 66, 70]);
  g.box(-0.95, 0, CB.H - 0.26, 0.08, L, 0.08, [90, 60, 40]);
  for (let y = 1.75; y < L; y += 3.5) {
    g.box(-0.45, y - 0.15, CB.H - 0.14, 0.9, 0.3, 0.14, [40, 44, 46]);
    g.box(-0.4, y - 0.1, CB.H - 0.17, 0.8, 0.2, 0.03, [235, 240, 220], { emit: 0.85 });
    for (const dx of [-0.42, 0, 0.42]) g.box(dx - 0.01, y - 0.16, CB.H - 0.24, 0.02, 0.32, 0.1, [28, 30, 32]);
  }
  // as celas
  CELLS.forEach(({ side: s, y }) => {
    const xi = s * CB.hw, xo = s * (CB.hw + CB.depth);
    const n0: V3 = [-s, 0, 0];
    const xa = Math.min(xi, xo), xb = Math.max(xi, xo);
    g.quad([xa, y - 1.6, 0], [xb, y - 1.6, 0], [xb, y + 1.6, 0], [xa, y + 1.6, 0], [54, 56, 54], [0, 0, 1], { tag: "floor" });
    g.quad([xa, y - 1.6, CB.H], [xa, y + 1.6, CB.H], [xb, y + 1.6, CB.H], [xb, y - 1.6, CB.H], [36, 38, 38], [0, 0, -1]);
    // fundo
    for (const [za, zb, col] of [[0, 0.3, concD], [0.3, 1.0, [80, 82, 78]], [1.0, 1.18, band], [1.18, CB.H, [80, 82, 78]]] as [number, number, RGB][])
      g.quad([xo, s > 0 ? y + 1.6 : y - 1.6, za], [xo, s > 0 ? y - 1.6 : y + 1.6, za], [xo, s > 0 ? y - 1.6 : y + 1.6, zb], [xo, s > 0 ? y + 1.6 : y - 1.6, zb], col, n0);
    // paredes laterais da cela
    for (const sy of [-1, 1]) {
      const yy = y + sy * 1.6;
      for (const [za, zb, col] of [[0, 0.3, concD], [0.3, CB.H, [76, 78, 74]]] as [number, number, RGB][])
        g.quad(sy > 0 ? [xa, yy, za] : [xb, yy, za], sy > 0 ? [xb, yy, za] : [xa, yy, za], sy > 0 ? [xb, yy, zb] : [xa, yy, zb], sy > 0 ? [xa, yy, zb] : [xb, yy, zb], col, [0, -sy, 0]);
    }
    // beliche: estrutura de metal, colchão, travesseiro
    const bx = xo - s * 0.5;
    g.box(bx - 0.45, y - 1.5, 0.42, 0.9, 1.95, 0.08, [60, 64, 68]);
    g.box(bx - 0.42, y - 1.47, 0.5, 0.84, 1.89, 0.14, [96, 88, 70]);
    g.box(bx - 0.3, y - 1.4, 0.64, 0.6, 0.35, 0.1, [150, 146, 130]);
    for (const dy of [-1.5, 0.4]) g.box(bx - 0.45, y + dy, 0, 0.06, 0.05, 0.5, [60, 64, 68]);
    // vaso e pia de aço
    g.box(xo - s * 0.35 - 0.2, y + 1.0, 0, 0.4, 0.45, 0.42, [150, 156, 160]);
    g.box(xo - s * 0.2 - 0.12, y + 0.98, 0.42, 0.24, 0.5, 0.35, [140, 146, 150]);
    g.box(xo - s * 0.2 - 0.15, y + 0.4, 0.8, 0.3, 0.42, 0.12, [150, 156, 160]);
    // a luz fraca da cela
    g.box(xo - s * 0.05 - 0.03, y - 0.25, 2.7, 0.06, 0.5, 0.12, [255, 214, 150], { emit: 0.55 });
  });
  return g.F;
};
// grades: moldura + barras + travessas diante de cada vão; o portão da cela do Barney sobe para dentro da verga
export const barsFaces = (open: number): XF[] => {
  const g = mk();
  CELLS.forEach(({ side: s, y }) => {
    const x = s * (CB.hw + 0.02);
    const isB = s === BCELL.side && y === BCELL.y;
    const lift = isB ? open * (CB.oh - 0.25) : 0;
    const col: RGB = [52, 56, 60];
    const z0 = lift;
    // barras (cortadas na verga: só a parte abaixo dela aparece)
    for (let k = 0; k < 13; k++) {
      const yy = y - CB.open / 2 + 0.12 + k * 0.215;
      // a parte que sobe acima do vão fica escondida atrás da verga
      g.box(x - 0.03, yy - 0.03, z0, 0.06, 0.06, Math.max(0.01, Math.min(CB.oh - 0.02, CB.H - 0.05 - z0)), col);
    }
    // travessas (sobem junto)
    for (const zz of [0.1, 1.05, 2.35]) if (zz + lift < CB.H - 0.15) g.box(x - 0.05, y - CB.open / 2, zz + lift, 0.1, CB.open, 0.1, [44, 48, 52]);
    // a fechadura (na grade, à altura da mão)
  });
  return g.F;
};
const BeerIcon: React.FC = () => (
  <svg width={34} height={60} viewBox="0 0 34 60">
    <path d="M 12 2 L 22 2 L 22 14 Q 30 20 30 30 L 30 56 Q 30 58 28 58 L 6 58 Q 4 58 4 56 L 4 30 Q 4 20 12 14 Z" fill="rgba(255,178,46,0.25)" stroke={AMB} strokeWidth={2} />
    <rect x={6} y={34} width={22} height={12} fill="rgba(255,178,46,0.6)" />
  </svg>
);
export const HLXCellBlock: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [foodAt, openAt, barneyAt, olderAt, wornAt, angryAt, aliveAt, beerAt, threeAt, shotAt, ggAt, forceAt] = ["foodAt", "openAt", "barneyAt", "olderAt", "wornAt", "angryAt", "aliveAt", "beerAt", "threeAt", "shotAt", "ggAt", "forceAt"].map((k) => at(p, k));
  const y = keys(f, [[0, 0.5], [foodAt + 10, 7.4], [threeAt, 7.4], [life, 12.5]]);
  // 13/10 (pedido dele: a fuga a três não representava a fala): a folha da porta de saída vira peça solta (o Dog a
  // arrebenta), um contêiner para a Gravity Gun e dois Combine no fim do corredor
  const G = useMemo(() => buildCellBlock().filter((fc) => !fc.p.every((q) => q[1] >= 17.93 && q[1] <= 18.0 && Math.abs(q[0]) <= 0.65 && q[2] <= 2.31)), []);
  const open = P(f, openAt, 22);
  const blast = P(f, forceAt + 8, 14);
  const leaf = mk();
  {
    const dy = -blast * 3.2, dz = Math.sin(blast * Math.PI) * 0.6 - blast * 0.1;
    const tilt = blast * 1.3;
    const cx = 0, cy = 17.97 + dy, cz = 1.15 + dz;
    const W2 = 0.64, H2 = 1.15, T = 0.03;
    const rot = (x: number, y: number, z: number): V3 => [cx + x, cy + y * Math.cos(tilt) - z * Math.sin(tilt), cz + y * Math.sin(tilt) + z * Math.cos(tilt)];
    const fr = [rot(-W2, -T, -H2), rot(W2, -T, -H2), rot(W2, -T, H2), rot(-W2, -T, H2)];
    leaf.quad(fr[0], fr[1], fr[2], fr[3], [58, 64, 70], [0, -1, 0]);
    leaf.quad(rot(-0.3, -T - 0.01, 0.3), rot(0.3, -T - 0.01, 0.3), rot(0.3, -T - 0.01, 0.75), rot(-0.3, -T - 0.01, 0.75), [20, 26, 30], [0, -1, 0]);
  }
  const ggK = P(f, ggAt + 4, 14), throwK = P(f, ggAt + 30, 14);
  const hold: V3 = [-0.4, y + 3.4, 1.25];
  const crateP: V3 = throwK > 0 ? [hold[0] + (-0.5 - hold[0]) * throwK, hold[1] + (16.6 - hold[1]) * throwK, hold[2] + (0.6 - hold[2]) * throwK] : [-1.2 + (hold[0] + 1.2) * ggK, 13.2 + (hold[1] - 13.2) * ggK, hold[2] * ggK];
  const crate = mk();
  crate.box(crateP[0] - 0.3, crateP[1] - 0.3, crateP[2], 0.6, 0.6, 0.55, [56, 62, 70]);
  crate.box(crateP[0] - 0.31, crateP[1] - 0.31, crateP[2] + 0.3, 0.62, 0.02, 0.05, [90, 220, 235], { emit: 0.7 });
  const faces = G.concat(barsFaces(open), leaf.F, f >= ggAt - 10 ? crate.F : []);
  const yaw = keys(f, [[0, 0], [foodAt, 0], [foodAt + 24, 0.95], [threeAt, 0.95], [threeAt + 26, 0], [life, 0]]);
  const e: Eye = { x: 0, y, z: 1.65, yaw, pitch: keys(f, [[0, 0], [foodAt + 24, -0.05], [threeAt, -0.05], [threeAt + 20, 0]]), F: 950 };
  const flick = 0.85 + 0.15 * (rnd(Math.floor(f / 3)) > 0.08 ? 1 : 0.2);
  const lights: XL[] = [1.75, 5.25, 8.75, 12.25, 15.75].map((ly) => ({ x: 0, y: ly, z: 3.1, col: [230, 240, 215] as RGB, k: 0.55 * flick, r: 5.5 }));
  const voice = f >= foodAt - 20 && f < openAt;
  const card = P(f, barneyAt, 12) * (1 - P(f, threeAt, 10));
  const field = (t0: number, k: string, v: string, c = TXT) =>
    f >= t0 ? (
      <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.08)", opacity: P(f, t0, 6) }}>
        <span style={{ color: "rgba(255,178,46,0.7)", fontSize: 15, letterSpacing: 3 }}>{k}</span>
        <span style={{ color: c, fontSize: 18, letterSpacing: 2 }}>{decode(v, f, t0, 2)}</span>
      </div>
    ) : null;
  const vq = proj(e, [BCELL.side * 3, BCELL.y, 1.7]);
  return (
    <AbsoluteFill style={{ background: "#030303", overflow: "hidden" }}>
      <XView e={e} faces={faces} lights={lights} flash={0.8} amb={0.07} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {voice && vq ? (
          <g opacity={P(f, foodAt - 20, 8) * (1 - P(f, openAt - 6, 6))}>
            {Array.from({ length: 16 }).map((_, i) => {
              const h = 6 + Math.abs(Math.sin(f / 2.5 + i * 0.8) * Math.sin(f / 7 + i)) * 34;
              return <rect key={i} x={vq.x - 64 + i * 8} y={vq.y - h / 2 - 60} width={4} height={h} fill={CREAM} opacity={0.85} />;
            })}
            <text x={vq.x} y={vq.y - 110} textAnchor="middle" fill={CREAM} fontFamily={MONO} fontSize={18} letterSpacing={4} style={{ paintOrder: "stroke", stroke: "#000", strokeWidth: 4 }}>
              VOZ · CELA 3B
            </text>
            {f >= foodAt ? (
              <text x={vq.x} y={vq.y + 4} textAnchor="middle" fill="rgba(242,240,247,0.85)" fontFamily={MONO} fontSize={20} letterSpacing={2} fontStyle="italic" style={{ paintOrder: "stroke", stroke: "#000", strokeWidth: 4 }} opacity={P(f, foodAt, 8)}>
                “…isso aqui é comida?…”
              </text>
            ) : null}
          </g>
        ) : null}
        {CELLS.map(({ side, y: cy }, i) => {
          const q = proj(e, [side < 0 ? -1.66 : 1.66, cy - 1.6, 2.35]);
          return q && q.d < 14 ? (
            <text key={i} x={q.x} y={q.y} textAnchor="middle" fill={side === BCELL.side && cy === BCELL.y ? AMB : "rgba(242,240,247,0.55)"} fontFamily={MONO} fontSize={Math.max(11, Math.min(22, 120 / q.d))} letterSpacing={2} style={{ paintOrder: "stroke", stroke: "#000", strokeWidth: 3 }}>
              {`CELA ${Math.floor(i / 2) + 1}${side < 0 ? "A" : "B"}`}
            </text>
          ) : null;
        })}
        {f >= barneyAt ? <XMarker e={e} x={2.9} y={BCELL.y + 0.3} label="BARNEY" col={AMB} f={f} o={P(f, barneyAt, 10)} sub={f >= aliveAt ? "VIVO" : undefined} /> : null}
        {f >= threeAt ? (
          <>
            {/* os dois Combine no fim do corredor: um cai com a espingarda, o outro com o contêiner */}
            {[[0.55, 16.4, shotAt + 6], [-0.5, 16.9, ggAt + 40]].map(([x, yy, die], k) => (
              <XMarker key={"cb" + k} e={e} x={x} y={yy} label="COMBINE" sub={f >= die ? "✕ ABATIDO" : "BLOQUEIA A SAÍDA"} col={f >= die ? "#7a7f86" : "#ff5d4d"} f={f} o={P(f, threeAt + 6, 10) * (1 - P(f, die + 14, 14))} />
            ))}
            <XMarker e={e} x={-0.6} y={y + 2.6} label="BARNEY" sub={f >= shotAt ? "ESPINGARDA" : undefined} col={AMB} f={f} o={P(f, threeAt + 10, 10)} />
            <XMarker e={e} x={0.8 - 0.6 * P(f, forceAt, 14)} y={y + 3.4 + (17.4 - (y + 3.4)) * P(f, forceAt, 12)} label="DOG" sub={f >= forceAt ? "FORÇA BRUTA" : undefined} col={ICE} f={f} o={P(f, threeAt + 14, 10)} />
            {/* o tiro de espingarda: clarão no cano e o leque de chumbo */}
            {f >= shotAt && f < shotAt + 8 ? (() => {
              const a = proj(e, [-0.5, y + 2.4, 1.3]);
              const b = proj(e, [0.55, 16.4, 1.3]);
              if (!a || !b) return null;
              const k = (f - shotAt) / 8;
              return (
                <g>
                  <circle cx={a.x} cy={a.y} r={60 * (1 - k) + 10} fill="rgba(255,220,140,0.95)" style={{ filter: "blur(6px)" }} />
                  {Array.from({ length: 9 }).map((_, i) => <line key={i} x1={a.x + (b.x - a.x) * k * 0.6} y1={a.y + (b.y - a.y) * k * 0.6} x2={a.x + (b.x - a.x) * Math.min(1, k + 0.3) + (i - 4) * 6} y2={a.y + (b.y - a.y) * Math.min(1, k + 0.3) + (i % 3 - 1) * 6} stroke="#ffe0a0" strokeWidth={2} opacity={1 - k} />)}
                </g>
              );
            })() : null}
            {/* a Gravity Gun: o feixe laranja segura o contêiner e dispara */}
            {f >= ggAt && f < ggAt + 32 ? (() => {
              const b = proj(e, [crateP[0], crateP[1], crateP[2] + 0.3]);
              if (!b) return null;
              const shoot = f >= ggAt + 28;
              return (
                <g>
                  <line x1={1300} y1={1000} x2={b.x} y2={b.y} stroke="rgba(255,150,40,0.5)" strokeWidth={shoot ? 26 : 14} style={{ filter: "blur(5px)" }} />
                  <line x1={1300} y1={1000} x2={b.x} y2={b.y} stroke="#ffe2b0" strokeWidth={2.5} />
                  <circle cx={b.x} cy={b.y} r={50} fill="none" stroke="#ffb060" strokeWidth={2} opacity={0.7} />
                </g>
              );
            })() : null}
          </>
        ) : null}
        {/* a porta arrebentada: a luz de fora entra */}
        {blast > 0 ? (() => {
          const q = proj(e, [0, 18.4, 1.2]);
          return q ? <ellipse cx={q.x} cy={q.y} rx={260 * blast} ry={320 * blast} fill="rgba(255,240,210,0.55)" style={{ filter: "blur(30px)" }} opacity={1 - P(f, forceAt + 40, 30) * 0.5} /> : null;
        })() : null}
      </svg>
      {card > 0.01 ? (
        <div style={{ position: "absolute", left: 90, top: 150, width: 560, padding: "20px 24px", borderRadius: 14, background: "rgba(14,10,4,0.88)", border: `1.5px solid ${AMB}`, fontFamily: MONO, opacity: card, transform: `translateX(${(1 - card) * -60}px)` }}>
          <div style={{ fontSize: 15, letterSpacing: 5, color: AMB }}>H.E.V. · IDENTIFICAÇÃO</div>
          <div style={{ display: "flex", gap: 18, marginTop: 14 }}>
            <div style={{ position: "relative", width: 150, height: 190, borderRadius: 8, overflow: "hidden", border: `1px solid ${AMB}`, background: "#0a0612" }}>
              <Img src={staticFile("hl3silh/empe.png")} style={{ position: "absolute", left: "50%", top: 10, height: 180, transform: "translateX(-50%)", filter: "sepia(1) saturate(4) hue-rotate(-25deg) brightness(1.2) contrast(1.2)" }} />
              <div style={{ position: "absolute", left: 6, bottom: 4, fontSize: 11, letterSpacing: 2, color: AMB }}>CAPTURA TÉRMICA</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 36, color: TXT }}>{decode("Barney Calhoun", f, barneyAt, 2)}</div>
              <div style={{ fontSize: 14, letterSpacing: 2, color: "rgba(242,240,247,0.65)", marginTop: 4 }}>EX-SEGURANÇA · BLACK MESA</div>
              <div style={{ fontSize: 14, letterSpacing: 2, color: "rgba(242,240,247,0.65)" }}>EX-PROTEÇÃO CIVIL · INFILTRADO</div>
              <div style={{ marginTop: 10 }}>
                {field(olderAt, "IDADE", "MAIS VELHO")}
                {field(wornAt, "ESTADO", "ACABADO")}
                {field(angryAt, "HUMOR", "PUTO DA VIDA")}
                {field(aliveAt, "SINAIS VITAIS", "VIVO ✓", GREEN)}
              </div>
            </div>
          </div>
          {f >= beerAt ? (
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 16, padding: "10px 14px", borderRadius: 10, border: "1px dashed rgba(255,178,46,0.6)", opacity: P(f, beerAt, 8), transform: `scale(${1.15 - 0.15 * P(f, beerAt, 10)})` }}>
              <BeerIcon />
              <div>
                <div style={{ fontSize: 14, letterSpacing: 3, color: AMB }}>PENDÊNCIA</div>
                <div style={{ fontSize: 20, letterSpacing: 2, color: TXT }}>1 CERVEJA · GORDON DEVE</div>
              </div>
              <Img src={staticFile("hl3silh/bm_logo.svg")} style={{ width: 54, height: 54, marginLeft: "auto", filter: "invert(1) opacity(0.7)" }} />
            </div>
          ) : null}
        </div>
      ) : null}
      {f >= threeAt ? (
        <div style={{ position: "absolute", right: 90, top: 130, fontFamily: MONO, opacity: P(f, threeAt, 8) }}>
          <div style={{ fontSize: 18, letterSpacing: 6, color: CREAM, textAlign: "right" }}>A FUGA · A TRÊS</div>
          {(
            [
              ["BARNEY", "ESPINGARDA", shotAt, AMB],
              ["GORDON", "GRAVITY GUN", ggAt, ORANGE],
              ["DOG", "FORÇA BRUTA", forceAt, ICE],
            ] as [string, string, number, string][]
          ).map(([who, w, t0, c]) =>
            f >= t0 ? (
              <div key={who} style={{ display: "flex", justifyContent: "space-between", gap: 40, padding: "10px 16px", marginTop: 8, background: "rgba(8,8,10,0.75)", borderLeft: `3px solid ${c}`, fontSize: 20, letterSpacing: 4, color: TXT, opacity: P(f, t0, 6) }}>
                <span style={{ color: c }}>{who}</span>
                <span>{w}</span>
              </div>
            ) : null,
          )}
        </div>
      ) : null}
      <Hud f={f} yaw={e.yaw} eye={e} blips={[{ x: 2.9, y: BCELL.y }]} msg={f < foodAt ? "ALA DE DETENÇÃO" : f < openAt ? "ALGUÉM RECLAMANDO" : undefined} msgCol={CREAM} />
      <AbsoluteFill style={{ background: "#000", opacity: interpolate(f, [life - 6, life], [0, 1], C), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ================================================================================================= 7 · o gesto (POV do Barney)
// a sala de interrogatório pelos olhos do Barney, preso na cadeira (luz forte em cima, mesa, porta à frente). A porta
// abre em contraluz: a Alyx (sombra comprida no chão + marcador) e o Advisor flutuando atrás. Checklist: libertou ✗,
// falou ✗, só olhou ✓. O gesto: ícone de mão em inserto; "o mesmo de Black Mesa" (logo + o mesmo gesto, =); "fica
// tranquilo". Depois o quadro de provas: as autorizações carimbadas × a ficha do gesto; o medidor de certeza recua.
const buildInterro = (): XF[] => {
  const g = mk();
  g.room(-3, 3, -1, 6, 3.0, [48, 52, 54], [34, 36, 38], [20, 22, 24], [{ side: "N", c: 0, w: 1.6, h: 2.4 }], 1.5);
  g.box(-1.2, 1.0, 0, 2.4, 1.0, 0.78, [60, 62, 64]); // a mesa
  g.box(-0.3, 4.6, 0, 0.6, 0.6, 0.48, [50, 52, 54]); // a cadeira vazia do outro lado
  g.box(-2.9, 2.4, 1.2, 0.04, 1.6, 0.9, [120, 140, 150], { emit: 0.15 }); // espelho/vidro
  g.box(-0.02, 1.48, 2.2, 0.04, 0.04, 0.8, [20, 20, 20]); // o fio da lâmpada
  g.prism(0, 1.5, 1.98, 2.2, 0.32, 10, [70, 72, 70]); // a cúpula
  g.box(-0.12, 1.38, 1.96, 0.24, 0.24, 0.03, [255, 240, 200], { emit: 0.95 }); // a lâmpada
  for (let x = -2.4; x <= 2.4; x += 1.2) if (Math.abs(x) > 1) g.box(x, 5.97, 0, 0.06, 0.04, 3.0, [36, 40, 42]); // nervuras da parede do fundo
  // 09/10 (pedido dele: o vão da porta era um retângulo branco chapado, "oco"): o corredor de verdade atrás da porta,
  // com a luz no fundo (a contraluz vem dele)
  for (let y = 6; y < 11; y += 1) {
    g.quad([-0.8, y, 0], [0.8, y, 0], [0.8, y + 1, 0], [-0.8, y + 1, 0], [52, 56, 60], [0, 0, 1]);
    g.quad([-0.8, y, 0], [-0.8, y + 1, 0], [-0.8, y + 1, 2.4], [-0.8, y, 2.4], [70, 76, 82], [1, 0, 0]);
    g.quad([0.8, y + 1, 0], [0.8, y, 0], [0.8, y, 2.4], [0.8, y + 1, 2.4], [70, 76, 82], [-1, 0, 0]);
    g.quad([-0.8, y, 2.4], [-0.8, y + 1, 2.4], [0.8, y + 1, 2.4], [0.8, y, 2.4], [40, 42, 46], [0, 0, -1]);
  }
  g.quad([0.8, 11, 0], [-0.8, 11, 0], [-0.8, 11, 2.4], [0.8, 11, 2.4], [215, 228, 245], [0, -1, 0], { emit: 0.85 });
  return g.F;
};
// a mão (forma 'pan_tool' do Material Icons, Apache 2.0): palma aberta, quatro dedos e o polegar, cheia, com contorno de luz
const HAND_D = "M23 5.5V20c0 2.2-1.8 4-4 4h-7.3c-1.08 0-2.1-.43-2.85-1.19L1 14.83s1.26-1.23 1.3-1.25c.22-.19.49-.29.79-.29.22 0 .42.06.6.16.04.01 4.31 2.46 4.31 2.46V4c0-.83.67-1.5 1.5-1.5S11 3.17 11 4v7h1V1.5c0-.83.67-1.5 1.5-1.5S15 .67 15 1.5V11h1V2.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5V11h1V5.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5z";
const Hand: React.FC<{ s?: number; wave?: number; col?: string }> = ({ s = 1, wave = 0, col = CREAM }) => (
  <svg width={140 * s} height={140 * s} viewBox="-70 -70 140 140" style={{ overflow: "visible" }}>
    {/* o gesto de "fica tranquilo": a palma desce devagar e volta */}
    <g transform={`translate(0 ${-6 + wave * 12}) rotate(${-4 + wave * 6})`}>
      <g transform="translate(-50 -58) scale(4.2)">
        <path d={HAND_D} fill={col} opacity={0.18} transform="translate(0.4 0.5)" />
        <path d={HAND_D} fill={col} style={{ filter: `drop-shadow(0 0 2px ${col})` }} />
      </g>
    </g>
    {[0, 1, 2].map((k) => (
      <path key={k} d={`M ${-46 + k * 6} ${52 + k * 7} q 46 ${10 + k * 3} 92 0`} fill="none" stroke={col} strokeWidth={2} opacity={(0.2 + 0.2 * k) * (0.5 + 0.5 * wave)} strokeDasharray="4 6" />
    ))}
  </svg>
);
export const HLXInterrogation: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [enterAt, advAt, notFreeAt, saidAt, lookAt, gestAt, bmAt, calmAt, doubtAt, proofAt, hintAt, simpleAt] = ["enterAt", "advAt", "notFreeAt", "saidAt", "lookAt", "gestAt", "bmAt", "calmAt", "doubtAt", "proofAt", "hintAt", "simpleAt"].map((k) => at(p, k));
  const G = useMemo(() => buildInterro(), []);
  const door = P(f, enterAt, 20);
  const e: Eye = { x: 0.05 * Math.sin(f / 50), y: -0.4, z: 1.18 + 0.01 * Math.sin(f / 23), yaw: keys(f, [[0, -0.18], [enterAt - 10, 0], [life, 0.02]]), pitch: keys(f, [[0, -0.02], [enterAt, 0.04], [life, 0.04]]), F: 900 };
  const lights: XL[] = [
    { x: 0, y: 1.4, z: 2.8, col: [235, 235, 220], k: 0.55, r: 4.5 },
    { x: 0, y: 6.4, z: 1.6, col: [200, 220, 255], k: 1.0 * door, r: 7 },
    { x: 0, y: 7.5, z: 2.4, col: [200, 150, 255], k: f >= advAt ? 0.35 + 0.1 * Math.sin(f / 7) : 0, r: 6 },
  ];
  const board = P(f, doubtAt, 14);
  const dq = [proj(e, [-0.8, 6.0, 0]), proj(e, [0.8, 6.0, 0]), proj(e, [0.8, 6.0, 2.4]), proj(e, [-0.8, 6.0, 2.4])];
  const al = proj(e, [0, 5.4, 0]);
  const alT = proj(e, [0, 5.4, 1.7]);
  const sh = proj(e, [0, 1.6, 0]);
  const adv = proj(e, [1.15, 4.7, 1.95]);
  const advS = adv ? 700 / adv.d : 0;
  // 11/10: o Advisor 3D do jogo atrás da Alyx, olhando para o Barney (a câmera)
  const AS = useAdvScene([{ pos: [1.15, 4.7, 1.95], look: [e.x, e.y, 1.3], reach: 0.15, show: f >= advAt }], f, 1.9);
  const certain = interpolate(f, [hintAt, simpleAt + 30], [100, 72], { ...C, easing: Easing.out(Easing.cubic) });
  return (
    <AbsoluteFill style={{ background: "#020202", overflow: "hidden" }}>
      <AbsoluteFill style={{ filter: `blur(${board * 6}px) brightness(${1 - board * 0.6})` }}>
        {/* a porta de correr: a folha entra na parede quando abre (a sala e o corredor desenhados por distância real —
            a mesa não fica mais oca) */}
        <XView e={e} faces={G.concat(mk().F, (() => { const d = mk(); d.box(-0.8 + 1.62 * door, 5.92, 0, 1.6, 0.1, 2.4, [62, 66, 70]); d.box(-0.75 + 1.62 * door, 5.9, 1.9, 0.5, 0.02, 0.08, [120, 200, 230], { emit: 0.7 }); return d.F; })())} lights={lights} flash={0.6} amb={0.08} solid extras={AS.extras} glLights={AS.lights} />
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          {/* a contraluz do corredor entrando pelo vão (no chão da sala) */}
          {dq.every((q) => q) && door > 0 ? (() => { const a = proj(e, [-0.8, 6, 0.01]), b = proj(e, [0.8, 6, 0.01]), c2 = proj(e, [1.2, 3.6, 0.01]), d2 = proj(e, [-1.2, 3.6, 0.01]); return a && b && c2 && d2 ? <polygon points={`${a.x},${a.y} ${b.x},${b.y} ${c2.x},${c2.y} ${d2.x},${d2.y}`} fill={`rgba(225,235,255,${0.22 * door})`} style={{ filter: "blur(10px)" }} /> : null; })() : null}
          {/* a Alyx em contraluz: só a sombra comprida no chão + o marcador (sem desenhar a pessoa) */}
          {f >= enterAt + 14 && al && sh ? (
            <g opacity={P(f, enterAt + 14, 12)}>


            </g>
          ) : null}
          {adv && f >= advAt ? (
            <g opacity={P(f, advAt, 14)}>
              {AS.ready ? null : <AdvisorArt x={adv.x} y={adv.y + Math.sin(f / 30) * 5} w={advS * 2.0} f={f} lit={0.7} id="intr" />}
              <text x={adv.x + advS * 1.1} y={adv.y - advS * 0.4} fill={VIO} fontFamily={MONO} fontSize={18} letterSpacing={4}>ADVISOR</text>
            </g>
          ) : null}
          {/* 10/10 (pedido dele: o marcador da Alyx atrás da mesa aparecia por cima dela): a mesa tampa o marcador —
              máscara com a silhueta da mesa (tampo + frente) vista do olho */}
          {(() => {
            const tb = ([[-1.2, 2.0, 0.78], [1.2, 2.0, 0.78], [1.2, 1.0, 0.78], [1.2, 1.0, 0], [-1.2, 1.0, 0], [-1.2, 1.0, 0.78]] as V3[]).map((v) => proj(e, v));
            return (
              <defs>
                <mask id="intrTable" maskUnits="userSpaceOnUse" x={0} y={0} width={1920} height={1080}>
                  <rect width={1920} height={1080} fill="#fff" />
                  {tb.every((q) => q) ? <polygon points={tb.map((q) => `${q!.x},${q!.y}`).join(" ")} fill="#000" /> : null}
                </mask>
              </defs>
            );
          })()}
          {f >= enterAt + 14 ? <g mask="url(#intrTable)"><XMarker e={e} x={keys(f, [[enterAt + 14, 0], [enterAt + 40, -0.7]])} y={keys(f, [[enterAt + 14, 6.3], [enterAt + 40, 4.3]])} label="ALYX" col={ORANGE} f={f} o={P(f, enterAt + 18, 10)} sub={f >= lookAt ? "SÓ OLHA" : undefined} /></g> : null}
        </svg>
        {/* o cone da lâmpada sobre a mesa */}
        {(() => {
          const l0 = proj(e, [0, 1.5, 1.96]);
          const l1 = proj(e, [-1.0, 1.5, 0.8]);
          const l2 = proj(e, [1.0, 1.5, 0.8]);
          return l0 && l1 && l2 ? (
            <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
              <polygon points={`${l0.x - 8},${l0.y} ${l0.x + 8},${l0.y} ${l2.x},${l2.y} ${l1.x},${l1.y}`} fill="rgba(255,240,200,0.10)" style={{ filter: "blur(8px)" }} />
            </svg>
          ) : null;
        })()}
        {/* o que ela fez (e não fez) */}
        {f >= notFreeAt ? (
          <div style={{ position: "absolute", right: 90, top: 140, width: 400, fontFamily: MONO }}>
            {(
              [
                ["LIBERTOU", "✗", notFreeAt, RED],
                ["DISSE ALGUMA COISA", "✗", saidAt, RED],
                ["SÓ FICOU OLHANDO", "✓", lookAt, CREAM],
              ] as [string, string, number, string][]
            ).map(([k, v, t0, c]) =>
              f >= t0 ? (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "10px 16px", marginTop: 8, background: "rgba(8,8,10,0.78)", borderLeft: `3px solid ${c}`, fontSize: 20, letterSpacing: 4, color: TXT, opacity: P(f, t0, 6) }}>
                  <span>{k}</span>
                  <span style={{ color: c }}>{v}</span>
                </div>
              ) : null,
            )}
          </div>
        ) : null}
        {/* o gesto: inserto com a mão; depois o mesmo gesto em Black Mesa */}
        {f >= gestAt && f < doubtAt ? (
          <div style={{ position: "absolute", left: 90, bottom: 130, display: "flex", alignItems: "center", gap: 26, opacity: P(f, gestAt, 8) }}>
            <div style={{ padding: "14px 18px", borderRadius: 14, background: "rgba(10,8,4,0.85)", border: `1.5px solid ${ORANGE}`, textAlign: "center" }}>
              <Hand wave={Math.sin((f - gestAt) / 6) * 0.5 + 0.5} col={ORANGE} />
              <div style={{ fontFamily: MONO, fontSize: 15, letterSpacing: 4, color: ORANGE }}>AGORA · A ALYX</div>
            </div>
            {f >= bmAt ? (
              <>
                <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 70, color: CREAM, opacity: P(f, bmAt, 8) }}>=</div>
                <div style={{ padding: "14px 18px", borderRadius: 14, background: "rgba(10,10,12,0.85)", border: "1.5px solid rgba(242,240,247,0.5)", textAlign: "center", opacity: P(f, bmAt, 8), transform: `translateX(${(1 - P(f, bmAt, 12)) * -40}px)` }}>
                  <div style={{ position: "relative" }}>
                    <Hand wave={Math.sin((f - bmAt) / 6) * 0.5 + 0.5} col={TXT} />
                    <Img src={staticFile("hl3silh/bm_logo.svg")} style={{ position: "absolute", right: -6, top: -6, width: 44, height: 44, filter: "invert(1) opacity(0.75)" }} />
                  </div>
                  <div style={{ fontFamily: MONO, fontSize: 15, letterSpacing: 4, color: TXT }}>BLACK MESA · O BARNEY</div>
                </div>
              </>
            ) : null}
          </div>
        ) : null}
        {f >= calmAt && f < doubtAt ? <div style={{ position: "absolute", left: 0, right: 0, top: 110, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 76, color: TXT, textShadow: "0 8px 40px #000", opacity: P(f, calmAt, 8) }}>“Fica tranquilo.”</div> : null}
      </AbsoluteFill>
      {/* o quadro: provas × indício, e a certeza que recua */}
      {board > 0.01 ? (
        <AbsoluteFill style={{ opacity: board }}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 90, textAlign: "center", fontFamily: MONO, fontSize: 22, letterSpacing: 8, color: CREAM }}>{decode("A DÚVIDA QUE PRECISA FICAR", f, doubtAt, 2)}</div>
          <div style={{ position: "absolute", left: 200, top: 220, width: 640 }}>
            <div style={{ fontFamily: MONO, fontSize: 18, letterSpacing: 6, color: RED, opacity: P(f, proofAt, 8) }}>PROVAS · ELA ESTÁ AJUDANDO OS COMBINE</div>
            {["ORDENS RECENTES", "MOVIMENTAÇÃO DE TROPAS", "SALTOS DO BOREALIS", "A SALA DO ADVISOR"].map((t, i) => {
              const t0 = proofAt + i * 5;
              return f >= t0 ? (
                <div key={t} style={{ position: "relative", marginTop: 16, marginLeft: i * 14, padding: "18px 22px", borderRadius: 8, background: "rgba(240,236,226,0.95)", color: "#1a1612", fontFamily: MONO, fontSize: 20, letterSpacing: 3, transform: `rotate(${[-2, 1.5, -1, 2][i]}deg) translateY(${(1 - P(f, t0, 8)) * -30}px)`, opacity: P(f, t0, 6), boxShadow: "0 12px 30px rgba(0,0,0,0.6)" }}>
                  {t}
                  <span style={{ position: "absolute", right: 14, top: 12, padding: "2px 8px", border: `2px solid ${RED}`, color: RED, fontSize: 14, transform: "rotate(-6deg)" }}>A. VANCE</span>
                </div>
              ) : null;
            })}
          </div>
          {f >= hintAt ? (
            <div style={{ position: "absolute", right: 220, top: 300, width: 380, padding: "20px", borderRadius: 12, background: "rgba(14,10,4,0.9)", border: `1.5px dashed ${ORANGE}`, textAlign: "center", opacity: P(f, hintAt, 8), transform: `rotate(3deg) scale(${1.1 - 0.1 * P(f, hintAt, 10)})` }}>
              <Hand col={ORANGE} wave={0.5 + 0.5 * Math.sin(f / 8)} />
              <div style={{ fontFamily: MONO, fontSize: 18, letterSpacing: 4, color: ORANGE, marginTop: 6 }}>UM GESTO · “FICA TRANQUILO”</div>
              <div style={{ fontFamily: MONO, fontSize: 14, letterSpacing: 3, color: "rgba(242,240,247,0.65)", marginTop: 6 }}>UMA PEQUENA INDICAÇÃO</div>
            </div>
          ) : null}
          {f >= hintAt ? (
            <div style={{ position: "absolute", left: 560, right: 560, bottom: 110, fontFamily: MONO, opacity: P(f, hintAt + 6, 10) }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, letterSpacing: 4, color: CREAM }}>
                <span>ELA TRAIU A RESISTÊNCIA</span>
                <span>{`${Math.round(certain)}%`}</span>
              </div>
              <div style={{ height: 10, marginTop: 8, borderRadius: 5, background: "rgba(242,240,247,0.12)" }}>
                <div style={{ height: "100%", width: `${certain}%`, borderRadius: 5, background: RED }} />
              </div>
              {f >= simpleAt ? <div style={{ textAlign: "center", marginTop: 14, fontSize: 18, letterSpacing: 5, color: ORANGE, opacity: P(f, simpleAt, 8) }}>TALVEZ NÃO SEJA TÃO SIMPLES</div> : null}
            </div>
          ) : null}
        </AbsoluteFill>
      ) : null}
      {board < 0.99 ? <Hud f={f} yaw={e.yaw} eye={e} blips={[{ x: 0, y: 5.4 }, { x: 0.4, y: 7.4, hot: true }]} msg={f < enterAt ? "O RELATO DO BARNEY · SALA DE INTERROGATÓRIO" : undefined} msgCol={CREAM} o={1 - board} /> : null}
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ================================================================================================= 7 · a fenda reabre em Xen (POV)
// numa ilha de Xen (o mesmo mundo da queda), o Gordon e o Dog esperam; faíscas onde a abertura vai surgir; a fenda
// reabre de pé no ar e, DENTRO dela, aparece o outro lado: a instalação Combine (imagem real). Eles atravessam: a câmera
// entra no anel e estoura em clarão.
export const HLXXenRift: React.FC<PR> = (p) => {
  // 09/10 (pedido dele: tem que ser o MESMO lugar onde eles acharam a ruptura): o salão das ruínas, a mesma fenda em pé
  // sobre o tablado. Gordon e o Dog esperam ao lado, ela reabre e os dois atravessam (o Dog na frente).
  const f = useCurrentFrame();
  const life = p.life;
  const [waitAt, reAt, crossAt] = ["waitAt", "reAt", "crossAt"].map((k) => at(p, k));
  const G = useMemo(() => buildRiftHall(), []);
  const open = IO((f - reAt) / 22);
  const go = IO((f - crossAt) / 18);
  const e: Eye = { x: -0.5 + 0.5 * go, y: 5.4 + (RIFT_Y - 0.4 - 5.4) * go, z: 1.7 + 0.02 * Math.sin(f / 9), yaw: keys(f, [[0, 0.12], [reAt, 0.0], [life, 0.0]]), pitch: keys(f, [[0, 0.02], [reAt, 0.05], [crossAt, 0.03]]), F: 930 };
  const dog = IO((f - crossAt + 10) / 16);
  const flash = interpolate(f, [crossAt + 10, crossAt + 17, life], [0, 1, 1], C);
  const top = proj(e, [RIFT_C[0], RIFT_Y, RIFT_C[2] + 2.3]);
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#050605" }}>
      <RiftHall e={e} f={f} openK={open} hot={open} G={G} />
      {/* o Dog ao lado, esperando — e entra primeiro */}
      <HoloAt e={e} x={2.7 - 2.5 * dog} y={9.0 + (RIFT_Y + 0.6 - 9.0) * dog} z={0} h={3.2} src="hl3silh/dog_holo.png" ar={832 / 1000} reveal={1} o={0.95 * (1 - P(f, crossAt + 6, 6))} glitch={false} f={f} glow="rgba(160,225,255,0.7)" breath={1 + 0.02 * Math.sin(f / 7)} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {top && go < 0.3 ? (
          <text x={top.x} y={top.y} textAnchor="middle" fill="#e4c8ff" fontFamily={MONO} fontSize={20} letterSpacing={5} style={{ paintOrder: "stroke", stroke: "#000", strokeWidth: 4 }} opacity={P(f, reAt + 10, 10) * (1 - go * 3)}>
            A ABERTURA REAPARECE
          </text>
        ) : null}
      </svg>
      <Hud f={f} yaw={e.yaw} eye={e} blips={[{ x: 2.7, y: 9.0 }]} msg={f >= crossAt ? "ATRAVESSANDO" : f >= reAt ? undefined : "ESPERANDO A ABERTURA"} msgCol="#e4c8ff" o={1 - flash} />
      <AbsoluteFill style={{ background: "#fff", opacity: flash * 0.95, pointerEvents: "none" }} />
      <AbsoluteFill style={{ background: "#000", opacity: interpolate(f, [0, 6], [1, 0], C), pointerEvents: "none" }} />
      <FilmLook />
      {void waitAt}
    </AbsoluteFill>
  );
};

// ================================================================================================= 6 · as últimas falas do Breen (POV)
// a mesma sala do casulo (aprovada): o Advisor-larva no líquido. As frases dele em legenda grande; "pela primeira vez ele
// não tenta" → convencer / negociar / defender / justificar, riscados um a um; [E] DESLIGAR OS APARELHOS; o silêncio do
// Gordon; o riso fraco (onda da voz tremendo); "Eu acreditei neles." / "Ninguém realmente volta."
export const HLXBreenLast: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [saysAt, diedAt, fallAt, onlyAt, firstAt, convAt, negoAt, defendAt, justAt, askAt, endAt, silentAt, laughAt, believedAt, nobodyAt] = ["saysAt", "diedAt", "fallAt", "onlyAt", "firstAt", "convAt", "negoAt", "defendAt", "justAt", "askAt", "endAt", "silentAt", "laughAt", "believedAt", "nobodyAt"].map((k) => at(p, k));
  const quotes: [number, number, string][] = [
    [diedAt, fallAt, "“Eu morri naquela Cidadela, Freeman.”"],
    [fallAt, onlyAt, "“Eu nem me lembro de cair.”"],
    [onlyAt, firstAt, "“Só isso aqui é o que continuou.”"],
    [believedAt, nobodyAt, "“Eu acreditei neles.”"],
    [nobodyAt, life, "“Ninguém realmente volta.”"],
  ];
  const q = quotes.find(([a, b]) => f >= a && f < b);
  const nots: [string, number][] = [["CONVENCER NINGUÉM", convAt], ["NEGOCIAR", negoAt], ["DEFENDER OS COMBINE", defendAt], ["JUSTIFICAR O QUE FEZ", justAt]];
  const speaking = (f >= diedAt && f < firstAt) || (f >= laughAt && f < life);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {/* 08/10: continua a aproximação da cena anterior (mesmo ponto de câmera na emenda), sem subir para o teto */}
      <HLXPod {...({ life, final: 1, podAt: 0, cablesAt: 0, larvalAt: 0, looksAt: -60, advAt: 1e9, voiceAt: 1e9, freemanAt: 1e9, breenAt: 0, believesAt: 1e9, mossAt: 1e9, cam: (fr: number) => podPush(fr, life, 4.5, 4.9) } as unknown as PR)} />
      {/* 08/10 (pedido dele: nada de legenda branca no meio do POV): a voz dele é um painel de rádio do HEV — a onda e a
          transcrição digitada, no canto; no riso a onda treme */}
      {speaking || q ? (
        <div style={{ position: "absolute", left: 90, top: 150, width: 600, padding: "14px 18px", borderRadius: 12, background: "rgba(14,10,6,0.88)", border: `1.5px solid ${ORANGE}`, fontFamily: MONO }}>
          <div style={{ fontSize: 15, letterSpacing: 5, color: ORANGE }}>VOZ · WALLACE BREEN</div>
          <svg width={564} height={70} style={{ marginTop: 6 }}>
            {Array.from({ length: 70 }).map((_, i) => {
              const laugh = f >= laughAt && f < believedAt;
              const h = speaking ? 3 + Math.abs(Math.sin(f / (laugh ? 1.6 : 3.2) + i * 0.7) * Math.sin(f / 7 + i * 0.3)) * (laugh ? 26 : 40) * (0.5 + 0.5 * Math.sin(i / 6)) : 2;
              return <rect key={i} x={i * 8} y={35 - h / 2} width={5} height={h} fill={ORANGE} opacity={0.8} />;
            })}
          </svg>
          <div style={{ fontSize: 14, letterSpacing: 3, color: "rgba(255,178,46,0.75)" }}>{f >= laughAt && f < believedAt ? "RISO BAIXO · QUASE SEM FORÇA" : "A VOZ MAL SE SUSTENTA"}</div>
          {q ? (
            <div style={{ marginTop: 10, fontSize: 24, lineHeight: 1.35, letterSpacing: 1, color: TXT }}>
              {q[2].slice(0, Math.max(0, Math.floor((f - q[0]) * 1.6)))}
              <span style={{ opacity: Math.floor(f / 8) % 2 }}>_</span>
            </div>
          ) : null}
        </div>
      ) : null}
      {/* pela primeira vez, ele não tenta */}
      {f >= firstAt && f < askAt + 20 ? (
        <div style={{ position: "absolute", right: 80, top: 140, width: 620, fontFamily: MONO, opacity: P(f, firstAt, 8) * (1 - P(f, askAt + 6, 12)) }}>
          <div style={{ fontSize: 24, letterSpacing: 5, color: CREAM }}>PELA PRIMEIRA VEZ, ELE NÃO TENTA</div>
          {nots.map(([t, t0]) =>
            f >= t0 ? (
              <div key={t} style={{ position: "relative", marginTop: 12, padding: "12px 16px", background: "rgba(8,8,10,0.8)", borderLeft: `3px solid ${RED}`, fontSize: 30, letterSpacing: 4, color: "rgba(242,240,247,0.75)", opacity: P(f, t0, 6) }}>
                {t}
                <span style={{ position: "absolute", left: 12, right: 12, top: "50%", height: 3, background: RED, transformOrigin: "left", transform: `scaleX(${P(f, t0 + 6, 8)})` }} />
              </div>
            ) : null,
          )}
        </div>
      ) : null}
      {/* o pedido: desligar os aparelhos */}
      {f >= askAt && f < silentAt + 30 ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 690, display: "flex", justifyContent: "center", opacity: P(f, askAt, 8) * (1 - P(f, silentAt + 10, 14)) }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 22px", background: "rgba(10,8,2,0.78)", border: `1.5px solid ${AMB}`, borderRadius: 10, fontFamily: MONO, color: AMB }}>
            <span style={{ padding: "2px 10px", border: `1.5px solid ${AMB}`, borderRadius: 6, fontSize: 22 }}>E</span>
            <span style={{ fontSize: 22, letterSpacing: 3 }}>DESLIGAR OS APARELHOS</span>
            {f >= endAt ? <span style={{ fontSize: 16, letterSpacing: 3, color: CREAM, opacity: P(f, endAt, 8) }}>· DEIXAR AQUILO TERMINAR DE VEZ</span> : null}
          </div>
        </div>
      ) : null}
      {f >= silentAt && f < laughAt ? <div style={{ position: "absolute", left: 0, right: 0, top: 120, textAlign: "center", fontFamily: MONO, fontSize: 24, letterSpacing: 8, color: "rgba(242,240,247,0.8)", opacity: P(f, silentAt, 8) }}>GORDON NÃO RESPONDE</div> : null}
      {void saysAt}
    </AbsoluteFill>
  );
};

// ================================================================================================= 6 · o laboratório da Aperture (POV)
// no lugar das câmaras do Portal (não era isso que a fala dizia): o laboratório dos anos 50 da Aperture. À direita, o
// quadro-negro com o ESBOÇO A GIZ da tecnologia Combine e o recorte do Borealis preso; à esquerda, na bancada, a CÓPIA
// que a Aperture construiu a partir dele (o painel em branco e laranja) → ARQUITETURA / EQUIPAMENTOS; no fundo, a cadeira com o capacete ligada por cabos ao
// mainframe → o princípio (uma consciência em outro suporte) → a tela: PROJETO · PRESERVAR A MENTE DE CAVE JOHNSON → o
// pulso corre pelos cabos da cadeira ao mainframe → INTELIGÊNCIA ARTIFICIAL → a plaquinha da cadeira: CAROLINE.
const buildCaveLab = (): XF[] => {
  const g = mk();
  // sala: paredes creme, rodapé de madeira, piso de linóleo xadrez, teto com luminárias
  g.room(-5, 5, 0, 12, 3.4, [196, 188, 166], [92, 84, 70], [150, 146, 132], [], 2);
  for (const x of [-5, 4.9]) for (let y = 0; y < 12; y += 2) g.box(x, y, 0, 0.1, 2, 1.0, [96, 64, 38]);
  for (let x = -5; x < 5; x += 2) g.box(x, 11.9, 0, 2, 0.1, 1.0, [96, 64, 38]);
  for (let y = 2; y < 12; y += 3) g.box(-0.9, y, 3.32, 1.8, 0.3, 0.06, [255, 244, 214], { emit: 0.85 });
  // a placa da Aperture no fundo (o texto vai por cima)
  g.box(-1.9, 11.85, 2.9, 3.8, 0.05, 0.4, [40, 40, 44]);
  // ---- direita: o quadro-negro na parede (o esboço a giz vai por cima), moldura de madeira e a calha do giz
  g.box(4.78, 3.55, 1.05, 0.12, 2.9, 1.7, [92, 62, 36]);
  g.box(4.74, 3.65, 1.15, 0.05, 2.7, 1.5, [30, 48, 40]);
  g.box(4.6, 3.6, 1.0, 0.2, 2.8, 0.06, [92, 62, 36]);
  g.box(4.66, 4.2, 1.06, 0.06, 0.1, 0.03, [235, 235, 225]);
  // ---- esquerda: a bancada com a cópia da Aperture (mesma forma, branco + laranja) e ferramentas
  g.box(-4.7, 4.0, 0, 1.6, 2.6, 0.95, [120, 84, 50]);
  g.box(-4.4, 4.9, 0.95, 1.0, 0.18, 1.6, [222, 218, 206], { tag: "apanel" });
  for (let k = 0; k < 4; k++) g.box(-4.3 + k * 0.24, 4.88, 1.15, 0.07, 0.03, 1.2, [255, 150, 40], { emit: 0.75, tag: "aslit" });
  g.box(-4.5, 6.0, 0.95, 0.5, 0.35, 0.18, [60, 62, 66]);
  g.box(-4.2, 4.2, 0.95, 0.3, 0.3, 0.3, [150, 40, 30]);
  // ---- fundo: o mainframe (quatro gabinetes com fitas e lâmpadas) e a cadeira com o capacete
  for (let k = 0; k < 4; k++) {
    g.box(-3.4 + k * 1.75, 10.9, 0, 1.6, 0.9, 2.6, [176, 172, 158]);
    g.box(-3.3 + k * 1.75, 10.88, 1.5, 0.6, 0.02, 0.6, [30, 30, 32]);
    g.box(-2.6 + k * 1.75, 10.88, 1.5, 0.6, 0.02, 0.6, [30, 30, 32]);
    for (let j = 0; j < 5; j++) g.box(-3.3 + k * 1.75 + j * 0.28, 10.88, 0.5, 0.12, 0.02, 0.07, [255, 120, 50], { emit: 0.6, tag: "lamp" });
  }
  g.box(-0.55, 10.86, 2.15, 1.1, 0.04, 0.6, [20, 60, 30], { emit: 0.35, tag: "crt" });
  for (const cx of [-1.2, -0.4, 0.4, 1.2]) {
    g.box(cx * 1.4 - 0.1, 10.8, 0.9, 0.2, 0.1, 0.2, [60, 60, 64]);
    g.box(cx * 1.4 - 0.05, 10.79, 0.95, 0.1, 0.02, 0.1, [255, 150, 60], { emit: 0.6, tag: "sock" });
  }
  // cadeira: base, assento, encosto, braços; o capacete é um aro acima do encosto
  // 08/10 (pedido dele: o assento sumia de perto): o tampo do pé ficava na MESMA altura do assento e a ordenação o
  // desenhava por cima; agora o pé é baixo e uma haste fina sobe até logo abaixo do assento
  g.prism(0, 8.0, 0, 0.16, 0.3, 10, [60, 60, 64]);
  g.box(-0.06, 7.94, 0.16, 0.12, 0.12, 0.17, [54, 54, 58]);
  g.box(-0.45, 7.6, 0.35, 0.9, 0.8, 0.14, [150, 54, 40]);
  g.box(-0.45, 8.3, 0.49, 0.9, 0.14, 0.95, [150, 54, 40]);
  g.box(-0.6, 7.6, 0.49, 0.15, 0.7, 0.25, [70, 70, 74]);
  g.box(0.45, 7.6, 0.49, 0.15, 0.7, 0.25, [70, 70, 74]);
  g.prism(0, 8.25, 1.5, 1.68, 0.3, 14, [190, 190, 196], { tag: "helmet" });
  g.box(-0.05, 8.35, 1.44, 0.1, 0.1, 0.24, [90, 90, 96]);
  g.box(-0.18, 8.44, 1.3, 0.36, 0.2, 0.26, [70, 70, 76]);
  return g.F;
};
export const HLXCaveLab: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [caveAt, tecAt, anomAt, apAt, archAt, equipAt, princAt, planAt, mindAt, aiAt, carolAt] = ["caveAt", "tecAt", "anomAt", "apAt", "archAt", "equipAt", "princAt", "planAt", "mindAt", "aiAt", "carolAt"].map((k) => at(p, k));
  const G = useMemo(() => buildCaveLab(), []);
  const yaw = keys(f, [
    [0, 0.08],
    [tecAt - 8, 0.08],
    [tecAt + 16, 0.86],
    [apAt - 6, 0.86],
    [apAt + 22, -0.62],
    [princAt - 6, -0.62],
    [princAt + 26, 0],
  ]);
  const y = keys(f, [
    [0, 0.6],
    [tecAt, 1.1],
    [princAt, 1.5],
    [planAt + 10, 4.6],
    [carolAt + 30, 5.4],
  ]);
  const pitch = keys(f, [
    [0, 0.0],
    [tecAt + 16, -0.02],
    [princAt, -0.12],
    [planAt + 10, 0.02],
    [carolAt, -0.06],
  ]);
  const e: Eye = { x: 0.1 * Math.sin(f / 70), y, z: 1.65 + 0.02 * Math.sin(f / 9), yaw, pitch, F: 980 };
  const live = G.map((fc) =>
    fc.tag === "sock"
      ? { ...fc, emit: f >= mindAt ? 0.9 : 0.35 }
      : fc.tag === "crt"
        ? { ...fc, emit: f >= planAt ? 0.75 : 0.3 }
        : fc.tag === "lamp"
          ? { ...fc, emit: f >= aiAt ? 0.4 + 0.6 * (Math.sin(f / 3 + fc.p[0][0] * 7) > 0 ? 1 : 0.2) : 0.5 }
          : fc.tag === "helmet" && f >= mindAt
            ? { ...fc, col: [190, 230, 255] as RGB, emit: 0.55 + 0.3 * Math.sin(f / 4) }
            : fc,
  );
  const lights: XL[] = [
    { x: 0, y: 6, z: 3.2, col: [255, 236, 200], k: 0.55, r: 9 },
    { x: 3.6, y: 5.0, z: 2.2, col: [255, 240, 210], k: 0.3, r: 3 },
    { x: 0, y: 10.6, z: 2.4, col: [120, 255, 140], k: f >= planAt ? 0.3 : 0.08, r: 4 },
  ];
  // chamada que aponta para um ponto 3D real: anel no alvo → linha → rótulo
  const call = (pt: V3, from: number, until: number, text: string, sub: string | undefined, col: string, dx: number, dy: number) => {
    if (f < from || f >= until) return null;
    const q = proj(e, pt);
    if (!q) return null;
    const o = P(f, from, 8) * (1 - P(f, until - 8, 8));
    const lx = q.x + dx;
    const ly = q.y + dy;
    const k = P(f, from, 12);
    const end = dx >= 0 ? "start" : "end";
    return (
      <g opacity={o}>
        <circle cx={q.x} cy={q.y} r={10 + 3 * Math.sin(f / 6)} fill="none" stroke={col} strokeWidth={2} />
        <circle cx={q.x} cy={q.y} r={4} fill={col} />
        <line x1={q.x} y1={q.y} x2={q.x + dx * k} y2={q.y + dy * k} stroke={col} strokeWidth={1.6} />
        <text x={lx + (dx >= 0 ? 10 : -10)} y={ly - 6} textAnchor={end} fill={col} fontFamily={MONO} fontSize={22} letterSpacing={4} opacity={k}>
          {text}
        </text>
        {sub ? (
          <text x={lx + (dx >= 0 ? 10 : -10)} y={ly + 22} textAnchor={end} fill="rgba(242,240,247,0.75)" fontFamily={MONO} fontSize={15} letterSpacing={2} opacity={k}>
            {sub}
          </text>
        ) : null}
      </g>
    );
  };
  // os cabos da cadeira ao mainframe; o pulso corre por eles na "mente"
  const cables = [-1.2, -0.4, 0.4, 1.2].map((cx) => {
    const a = proj(e, [cx * 0.12, 8.64, 1.42]);
    const m = proj(e, [cx * 0.8, 9.7, 0.05]);
    const b = proj(e, [cx * 1.4, 10.78, 1.0]);
    return a && m && b ? { a, m, b } : null;
  });
  const sign = proj(e, [0, 11.83, 3.1]);
  const crt = proj(e, [0, 10.84, 2.2]);
  const plate = proj(e, [0, 7.58, 0.62]);
  const typed = (s: string, t0: number) => s.slice(0, Math.max(0, Math.floor((f - t0) * 1.4)));
  return (
    <AbsoluteFill style={{ background: "#050403", overflow: "hidden" }}>
      <XView e={e} faces={live} lights={lights} flash={0.5} amb={0.32} solid />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {cables.map((c, i) =>
          c ? (
            <g key={i}>
              <path d={`M ${c.a.x} ${c.a.y} Q ${c.m.x} ${c.m.y + 40} ${c.b.x} ${c.b.y}`} fill="none" stroke="#141414" strokeWidth={Math.max(2, 30 / c.m.d)} />
              {f >= mindAt ? <path d={`M ${c.a.x} ${c.a.y} Q ${c.m.x} ${c.m.y + 40} ${c.b.x} ${c.b.y}`} fill="none" stroke={ICE} strokeWidth={Math.max(2, 18 / c.m.d)} strokeDasharray="10 60" strokeDashoffset={-(f - mindAt) * 6 - i * 17} opacity={0.9} /> : null}
            </g>
          ) : null,
        )}
        {/* os rolos de fita dos gabinetes: giram devagar; na "inteligência artificial" disparam */}
        {Array.from({ length: 8 }).map((_, i) => {
          const q = proj(e, [-3.0 + Math.floor(i / 2) * 1.75 + (i % 2) * 0.7, 10.86, 1.8]);
          if (!q) return null;
          const r = (0.22 * 980) / q.d;
          const ang = (f * (f >= aiAt ? 0.35 : 0.05) * (i % 2 ? 1 : -1)) % (Math.PI * 2);
          return (
            <g key={"r" + i}>
              <circle cx={q.x} cy={q.y} r={r} fill="#5a5a5e" stroke="#2a2a2c" strokeWidth={1.5} />
              <circle cx={q.x} cy={q.y} r={r * 0.62} fill="#3a2a1c" />
              <circle cx={q.x} cy={q.y} r={r * 0.2} fill="#c8c8cc" />
              {[0, 1, 2].map((k) => (
                <line key={k} x1={q.x} y1={q.y} x2={q.x + Math.cos(ang + (k * Math.PI * 2) / 3) * r * 0.55} y2={q.y + Math.sin(ang + (k * Math.PI * 2) / 3) * r * 0.55} stroke="#c8c8cc" strokeWidth={Math.max(1, r * 0.08)} />
              ))}
            </g>
          );
        })}
        {sign ? (
          <text x={sign.x} y={sign.y + 110 / sign.d} textAnchor="middle" fill="#f2efe6" fontFamily={FONT} fontWeight={800} fontSize={Math.max(9, 300 / sign.d)} letterSpacing={3}>
            APERTURE SCIENCE
          </text>
        ) : null}
        {/* o esboço a giz: o painel Combine (contorno, as frestas, cotas e interrogações) + o recorte do Borealis preso */}
        {(() => {
          const B = (u: number, v: number): V3 => [4.73, 3.75 + u, 1.25 + v];
          const pts = (l: [number, number][]) => l.map(([u, v]) => proj(e, B(u, v))).filter((q): q is NonNullable<typeof q> => !!q);
          const path = (l: [number, number][]) => {
            const q = pts(l);
            return q.length === l.length ? q.map((c, k) => `${k ? "L" : "M"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(" ") : "";
          };
          const dr = (k: number) => P(f, tecAt + k * 5, 14);
          const chalk = { fill: "none", stroke: "rgba(236,236,226,0.85)", strokeWidth: 2.2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
          const L: [number, number][][] = [
            [[0.2, 0.15], [0.85, 0.15], [0.85, 1.25], [0.2, 1.25], [0.2, 0.15]],
            [[0.3, 0.25], [0.3, 1.15]], [[0.45, 0.25], [0.45, 1.15]], [[0.6, 0.25], [0.6, 1.15]], [[0.75, 0.25], [0.75, 1.15]],
            [[0.2, 1.36], [0.85, 1.36]], [[0.2, 1.31], [0.2, 1.41]], [[0.85, 1.31], [0.85, 1.41]],
            [[0.95, 0.7], [1.3, 0.7], [1.22, 0.76]], [[1.3, 0.7], [1.22, 0.64]],
            [[1.38, 0.4], [1.62, 0.4], [1.74, 0.6], [1.62, 0.8], [1.38, 0.8], [1.26, 0.6], [1.38, 0.4]],
          ];
          const clipQ = pts([[1.85, 0.55], [2.5, 0.55], [2.5, 1.3], [1.85, 1.3]]);
          const cl = proj(e, B(2.17, 0.92));
          const lab = proj(e, B(0.52, 1.36));
          const q2 = proj(e, B(1.5, 0.6));
          return f >= tecAt - 4 ? (
            <g>
              {L.map((l, k) => {
                const d = path(l);
                return d ? <path key={k} d={d} {...chalk} pathLength={1} strokeDasharray={`${dr(Math.min(k, 6))} 1`} /> : null;
              })}
              {lab ? <text x={lab.x} y={lab.y - 8} textAnchor="middle" fill="rgba(236,236,226,0.85)" fontFamily="'Caveat', 'Segoe Print', cursive" fontSize={Math.max(12, 150 / lab.d)} opacity={dr(6)}>???</text> : null}
              {q2 ? <text x={q2.x} y={q2.y + 6} textAnchor="middle" fill="rgba(236,236,226,0.8)" fontFamily="'Caveat', 'Segoe Print', cursive" fontSize={Math.max(10, 120 / q2.d)} opacity={dr(8)}>?</text> : null}
              {f >= anomAt && clipQ.length === 4 && cl ? (
                <g opacity={P(f, anomAt, 6)} transform={`translate(0 ${(1 - P(f, anomAt, 8)) * -30})`}>
                  <polygon points={clipQ.map((c) => `${c.x},${c.y}`).join(" ")} fill="#e9e2cf" stroke="#9a8e70" strokeWidth={1} />
                  <path d={`M ${cl.x - 260 / cl.d} ${cl.y + 30 / cl.d} L ${cl.x + 220 / cl.d} ${cl.y + 30 / cl.d} L ${cl.x + 160 / cl.d} ${cl.y - 60 / cl.d} L ${cl.x - 120 / cl.d} ${cl.y - 60 / cl.d} Z M ${cl.x - 40 / cl.d} ${cl.y - 60 / cl.d} L ${cl.x - 20 / cl.d} ${cl.y - 150 / cl.d} L ${cl.x + 40 / cl.d} ${cl.y - 150 / cl.d} L ${cl.x + 50 / cl.d} ${cl.y - 60 / cl.d}`} fill="#3a3a3e" />
                  <text x={cl.x} y={cl.y + 150 / cl.d} textAnchor="middle" fill="#2a2418" fontFamily={MONO} fontSize={Math.max(8, 90 / cl.d)} letterSpacing={1}>BOREALIS</text>
                  <circle cx={(clipQ[0].x + clipQ[1].x) / 2} cy={(clipQ[0].y + clipQ[1].y) / 2 + 6} r={Math.max(3, 40 / cl.d)} fill="#c0392b" />
                </g>
              ) : null}
            </g>
          ) : null;
        })()}
        {call([4.73, 4.27, 1.95], tecAt + 14, apAt, "TECNOLOGIA COMBINE", "ESBOÇO NO QUADRO", TEAL, -300, -190)}
        {call([4.73, 5.92, 2.17], anomAt + 6, apAt, "BOREALIS · ANOMALIA", "DE ONDE VEIO A IDEIA", ORANGE, -320, 120)}
        {call([-3.9, 4.88, 1.75], apAt + 10, princAt, "CÓPIA APERTURE", "CONSTRUÍDA A PARTIR DO ESBOÇO", AMB, 260, -170)}
        {call([-3.9, 4.88, 1.2], archAt, princAt, "ARQUITETURA", undefined, AMB, 300, 30)}
        {call([-4.25, 6.1, 1.05], equipAt, princAt, "EQUIPAMENTOS", undefined, AMB, 300, 130)}
        {call([0, 8.25, 1.6], princAt + 10, planAt + 4, "O PRINCÍPIO", "UMA CONSCIÊNCIA EM OUTRO SUPORTE", VIO, 300, -150)}
        {plate && f >= carolAt ? (
          <g opacity={P(f, carolAt, 8)}>
            <rect x={plate.x - 600 / plate.d} y={plate.y - 160 / plate.d} width={1200 / plate.d} height={320 / plate.d} fill="#1a1208" stroke={ORANGE} strokeWidth={2} />
            <text x={plate.x} y={plate.y + 70 / plate.d} textAnchor="middle" fill={ORANGE} fontFamily={MONO} fontSize={Math.max(14, 200 / plate.d)} letterSpacing={5}>
              CAROLINE
            </text>
          </g>
        ) : null}
      </svg>
      {crt && f >= planAt ? (
        <div style={{ position: "absolute", left: crt.x, top: crt.y, transform: `translate(-50%, -40%) scale(${Math.min(1.25, 4 / crt.d)})`, width: 520, padding: "16px 22px", background: "rgba(6,22,10,0.88)", border: "2px solid #6dff8a", borderRadius: 8, fontFamily: MONO, color: "#7dff95", boxShadow: "0 0 40px rgba(109,255,138,0.35)", opacity: P(f, planAt, 6) }}>
          <div style={{ fontSize: 15, letterSpacing: 4, opacity: 0.75 }}>APERTURE SCIENCE · PROJETO</div>
          <div style={{ fontSize: 24, letterSpacing: 2, marginTop: 8, minHeight: 62 }}>{typed("PRESERVAR A MENTE DE CAVE JOHNSON", planAt)}</div>
          {f >= aiAt ? <div style={{ fontSize: 24, letterSpacing: 2, marginTop: 6, color: "#e9ffe9" }}>{"→ " + typed("INTELIGÊNCIA ARTIFICIAL", aiAt)}</div> : null}
          {f >= carolAt ? <div style={{ fontSize: 18, letterSpacing: 3, marginTop: 8, color: ORANGE }}>VOLUNTÁRIA: CAROLINE</div> : null}
        </div>
      ) : null}
      <Hud f={f} yaw={e.yaw} eye={e} blips={[{ x: 4.6, y: 5.0, hot: f >= tecAt && f < apAt }, { x: -3.9, y: 5 }, { x: 0, y: 8, hot: f >= princAt }]} msg={f >= caveAt && f < tecAt ? "APERTURE SCIENCE · ANOS 50 · CAVE JOHNSON" : undefined} msgCol={AMB} />
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ================================================================================================= Xen visto de fora (por uma porta)
// o mesmo Xen da queda (aprovado): céu de nebulosa, névoa, ilhas com torres, pilares, flora e pólen — para encaixar dentro
// de uma passagem; `e` é o olho em coordenadas de Xen (quem chama faz a paralaxe), `crit` = criaturas cruzando em silhueta.
export const XenVista: React.FC<{ e: Eye; f: number; crit?: { src: string; ar: number; h: number; x: number; y: number; z: number; flip?: boolean }[] }> = ({ e, f, crit = [] }) => {
  const G = useMemo(() => buildXen(), []);
  const lights: XL[] = [{ x: 40, y: 120, z: 60, col: [255, 170, 120], k: 0.9, r: 260 }];
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#2e2234" }}>
      <XenSky yaw={e.yaw} pitch={e.pitch} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <filter id="xvMist" x="-20%" y="-200%" width="140%" height="500%">
            <feGaussianBlur stdDeviation="40" />
          </filter>
        </defs>
        {Array.from({ length: 4 }).map((_, i) => (
          <ellipse key={"mi" + i} cx={960 + Math.sin(f / 90 + i) * 300} cy={420 + i * 160 + e.pitch * 300} rx={1300} ry={46} fill="rgba(255,200,180,0.09)" filter="url(#xvMist)" />
        ))}
      </svg>
      <XView e={e} faces={G} lights={lights} flash={0.2} amb={0.32} seam="rgba(20,8,10,0.4)" />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {ISL.concat(ISL2).map(([ix, iy, iz, r], i) =>
          Array.from({ length: 9 }).map((_, k) => {
            const a = rnd(i * 31 + k) * Math.PI * 2;
            const rr = r * 0.62 * rnd(i * 17 + k);
            const kind = k % 3;
            const hgt = kind === 2 ? 1.6 + 1.4 * rnd(k + i) : 0.6 + 0.6 * rnd(k + i);
            const b = proj(e, [ix + Math.cos(a) * rr, iy + Math.sin(a) * rr, iz]);
            const m = proj(e, [ix + Math.cos(a) * rr + Math.sin(f / 30 + k) * 0.12, iy + Math.sin(a) * rr, iz + hgt * 0.55]);
            const t = proj(e, [ix + Math.cos(a) * rr + Math.sin(f / 26 + k) * 0.18, iy + Math.sin(a) * rr, iz + hgt]);
            if (!b || !t || !m || b.d > 90) return null;
            const w = Math.max(1, 10 / b.d);
            if (kind === 1) return <path key={`${i}-${k}`} d={`M ${b.x} ${b.y} Q ${m.x + 30 / m.d} ${m.y} ${t.x} ${t.y}`} fill="none" stroke="#c46a8a" strokeWidth={w * 1.4} strokeLinecap="round" opacity={0.85} />;
            return (
              <g key={`${i}-${k}`}>
                <line x1={b.x} y1={b.y} x2={t.x} y2={t.y} stroke={kind === 2 ? "#4f7a5a" : "#6fe0a0"} strokeWidth={w * (kind === 2 ? 1.8 : 1)} opacity={0.85} />
                <circle cx={t.x} cy={t.y} r={Math.max(1.5, (kind === 2 ? 40 : 14) / t.d)} fill={kind === 2 ? "#3f8a5c" : "#b7ffd8"} opacity={kind === 2 ? 0.85 : 0.6 + 0.4 * Math.sin(f / 9 + k)} />
              </g>
            );
          }),
        )}
        {Array.from({ length: 40 }).map((_, i) => {
          const q = proj(e, [-20 + rnd(i) * 40, 6 + rnd(i * 3) * 60, rnd(i * 7) * 40 + Math.sin(f / 40 + i) * 0.6]);
          return q && q.d < 80 ? <circle key={"o" + i} cx={q.x} cy={q.y} r={Math.max(1.2, 30 / q.d)} fill="#ffe7a8" opacity={0.35 + 0.3 * Math.sin(f / 11 + i)} /> : null;
        })}
      </svg>
      {crit.map((c, k) => {
        const b = proj(e, [c.x, c.y, c.z]);
        const t = proj(e, [c.x, c.y, c.z + c.h]);
        if (!b || !t) return null;
        const H = b.y - t.y;
        const bob = Math.abs(Math.sin(f / 4 + k)) * H * 0.04;
        return (
          <Img key={k} src={staticFile(c.src)} style={{ position: "absolute", left: b.x - (H * c.ar) / 2, top: t.y - bob, height: H, width: H * c.ar, transform: c.flip ? "scaleX(-1)" : undefined, filter: "drop-shadow(0 0 3px rgba(255,210,160,0.8))" }} />
        );
      })}
    </AbsoluteFill>
  );
};

// ================================================================================================= crachá da Alyx (H.E.V.)
// no lugar da silhueta (reprovada): o crachá de identificação do HEV, como o do Barney — foto do jogo (Ep2, 1080p),
// nome, ficha e um status que muda com a cena. Posição absoluta (left/top em px da tela).
export const AlyxBadge: React.FC<{ f: number; at: number; status: string; statusCol?: string; left?: number; top?: number; lines?: string[] }> = ({ f, at, status, statusCol = ORANGE, left = 90, top = 150, lines = ["RESISTÊNCIA · WHITE FOREST", "FILHA DE ELI VANCE"] }) => {
  const o = P(f, at, 10);
  if (f < at) return null;
  return (
    <div style={{ position: "absolute", left, top, width: 520, padding: "18px 22px", borderRadius: 14, background: "rgba(14,10,4,0.88)", border: `1.5px solid ${AMB}`, fontFamily: MONO, opacity: o, transform: `translateX(${(1 - P(f, at, 14)) * -60}px)` }}>
      <div style={{ fontSize: 15, letterSpacing: 5, color: AMB }}>H.E.V. · IDENTIFICAÇÃO</div>
      <div style={{ display: "flex", gap: 18, marginTop: 14 }}>
        <div style={{ position: "relative", width: 150, height: 188, borderRadius: 8, overflow: "hidden", border: `1px solid ${AMB}`, background: "#0a0612" }}>
          <Img src={staticFile("hl3silh/alyx_badge.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 40%" }} />
          <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.12) 0 2px, rgba(0,0,0,0) 2px 4px)" }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 36, color: TXT }}>{decode("Alyx Vance", f, at, 1.6)}</div>
          {lines.map((l) => (
            <div key={l} style={{ fontSize: 14, letterSpacing: 2, color: "rgba(242,240,247,0.65)", marginTop: 4 }}>{l}</div>
          ))}
          <div style={{ marginTop: 14, padding: "8px 12px", borderLeft: `3px solid ${statusCol}`, background: "rgba(8,8,10,0.6)", fontSize: 18, letterSpacing: 3, color: statusCol }}>{status}</div>
        </div>
      </div>
    </div>
  );
};

// ================================================================================================= corredor do navio (POV, motor mk)
// corredor de 4,4 m com anteparos a cada 6 m (moldura + soleira), canos no teto e placas de gelo nas paredes
export const buildShipHall = (len = 30): XF[] => {
  const g = mk();
  g.room(-2.2, 2.2, 0, len, 3.0, [70, 76, 78], [52, 54, 54], [38, 40, 42], [], 2);
  for (let y = 6; y < len; y += 6) {
    g.box(-2.2, y, 0, 0.9, 0.25, 3.0, [48, 52, 54]);
    g.box(1.3, y, 0, 0.9, 0.25, 3.0, [48, 52, 54]);
    g.box(-1.3, y, 2.4, 2.6, 0.25, 0.6, [48, 52, 54]);
    g.box(-1.3, y, 0, 2.6, 0.25, 0.22, [44, 46, 48]);
  }
  g.box(-1.6, 0, 2.7, 0.18, len, 0.18, [60, 62, 64]);
  g.box(1.3, 0, 2.6, 0.24, len, 0.24, [56, 58, 60]);
  for (let y = 1; y < len; y += 4.6) g.box(-2.19, y, 1.3, 0.02, 1.4, 1.0, [120, 150, 160]);
  for (let y = 3; y < len; y += 6) g.box(-0.3, y, 2.96, 0.6, 0.6, 0.04, [255, 236, 200], { emit: 0.7 });
  return g.F;
};

// 11/10 v3 (pedidos dele: canos atravessando parede, costelas "desconexas", cano solto): o corredor planejado como um
// perfil só. O casco é um octógono achatado (paredes, chanfros, teto). Costelas e anteparos são MOLDURAS desse mesmo
// perfil (deslocado para dentro), peça contínua com as quinas fechadas. Tudo que corre pelo teto passa por dentro do
// vão do anteparo (o vão é o perfil deslocado 0,6 m) — conferido na conta, não no olho.
const HALL_W = 2.2;
const HALL_H = 3.1;
const HALL_C = 0.55;
// o perfil (x, z) no sentido horário visto de frente, do chão esquerdo ao chão direito
const hallProfile = (inset: number): [number, number][] => {
  const W = HALL_W, H = HALL_H, C = HALL_C;
  const P: [number, number][] = [[-W, 0], [-W, H - C], [-W + C, H], [W - C, H], [W, H - C], [W, 0]];
  if (!inset) return P;
  // desloca cada segmento para dentro e cruza os vizinhos (quinas em esquadro, sem frestas)
  const segs = P.slice(0, -1).map((a, i) => {
    const b = P[i + 1];
    const dx = b[0] - a[0], dz = b[1] - a[1];
    const L = Math.hypot(dx, dz);
    const nx = dz / L, nz = -dx / L; // normal para dentro (perfil horário)
    return [[a[0] + nx * inset, a[1] + nz * inset], [b[0] + nx * inset, b[1] + nz * inset]] as [number, number][];
  });
  const cross = (s1: [number, number][], s2: [number, number][]): [number, number] => {
    const [p, p2] = s1, [q, q2] = s2;
    const r = [p2[0] - p[0], p2[1] - p[1]], s = [q2[0] - q[0], q2[1] - q[1]];
    const d = r[0] * s[1] - r[1] * s[0];
    const t = ((q[0] - p[0]) * s[1] - (q[1] - p[1]) * s[0]) / d;
    return [p[0] + r[0] * t, p[1] + r[1] * t];
  };
  const out: [number, number][] = [[segs[0][0][0], 0]];
  for (let i = 0; i < segs.length - 1; i++) out.push(cross(segs[i], segs[i + 1]));
  out.push([segs[segs.length - 1][1][0], 0]);
  return out;
};
// moldura: entre o perfil do casco e o perfil deslocado, com espessura em y (y0..y1)
const hallFrame = (g: ReturnType<typeof mk>, y0: number, y1: number, inset: number, col: RGB) => {
  const A = hallProfile(0), B = hallProfile(inset);
  for (let i = 0; i < A.length - 1; i++) {
    const a0 = A[i], a1 = A[i + 1], b0 = B[i], b1 = B[i + 1];
    const k = 0.92 + 0.08 * (i % 2);
    const c: RGB = [col[0] * k, col[1] * k, col[2] * k];
    // as duas faces (frente/trás) e a face de dentro
    g.quad([a0[0], y0, a0[1]], [a1[0], y0, a1[1]], [b1[0], y0, b1[1]], [b0[0], y0, b0[1]], c, [0, -1, 0]);
    g.quad([a0[0], y1, a0[1]], [b0[0], y1, b0[1]], [b1[0], y1, b1[1]], [a1[0], y1, a1[1]], c, [0, 1, 0]);
    const dx = b1[0] - b0[0], dz = b1[1] - b0[1];
    const L = Math.hypot(dx, dz) || 1;
    g.quad([b0[0], y0, b0[1]], [b1[0], y0, b1[1]], [b1[0], y1, b1[1]], [b0[0], y1, b0[1]], [c[0] * 0.85, c[1] * 0.85, c[2] * 0.85], [dz / L, 0, -dx / L]);
  }
};
export const buildShipHall2 = (len = 30): XF[] => {
  const g = mk();
  const W = HALL_W, H = HALL_H, C = HALL_C;
  const wall: RGB = [74, 80, 82];
  const wallD: RGB = [58, 63, 66];
  const floor: RGB = [50, 52, 52];
  for (let y = 0; y < len; y += 1.5) {
    const y1 = y + 1.5;
    const alt = Math.floor(y / 1.5) % 2 ? 1 : 0.96;
    const k = (c: RGB): RGB => [c[0] * alt, c[1] * alt, c[2] * alt];
    g.quad([-W, y, 0], [-0.55, y, 0], [-0.55, y1, 0], [-W, y1, 0], k(floor), [0, 0, 1], { tag: "floor" });
    g.quad([0.55, y, 0], [W, y, 0], [W, y1, 0], [0.55, y1, 0], k(floor), [0, 0, 1], { tag: "floor" });
    g.quad([-0.55, y, -0.02], [0.55, y, -0.02], [0.55, y1, -0.02], [-0.55, y1, -0.02], [34, 36, 37], [0, 0, 1], { tag: "floor" });
    for (const s of [-1, 1]) {
      const x = s * W;
      const n: V3 = [-s, 0, 0];
      g.quad([x, y, 0], [x, y1, 0], [x, y1, 0.35], [x, y, 0.35], k(wallD), n);
      g.quad([x, y, 0.35], [x, y1, 0.35], [x, y1, 2.2], [x, y, 2.2], k(wall), n);
      g.quad([x, y, 2.2], [x, y1, 2.2], [x, y1, H - C], [x, y, H - C], k(wallD), n);
      g.quad([x, y, H - C], [x, y1, H - C], [x - s * C, y1, H], [x - s * C, y, H], k(wallD), [-s * 0.7, 0, -0.7]);
    }
    g.quad([-W + C, y, H], [W - C, y, H], [W - C, y1, H], [-W + C, y1, H], k([48, 50, 53]), [0, 0, -1]);
  }
  // faixa de aviso no rodapé (fora dos anteparos)
  for (let y = 0.4; y < len; y += 6)
    for (const s of [-1, 1])
      for (let i = 0; i < 6; i++) {
        const y0 = y + i * 0.22;
        const x = s * (W - 0.005);
        g.quad([x, y0, 0.05], [x, y0 + 0.11, 0.05], [x, y0 + 0.11, 0.3], [x, y0, 0.3], i % 2 ? [30, 30, 30] : [196, 156, 40], [-s, 0, 0]);
      }
  // costelas a cada 3 m (moldura do perfil, 16 cm para dentro) e anteparos a cada 12 m (moldura de 60 cm, com a soleira)
  for (let y = 3; y < len; y += 3) {
    if (y % 12 === 0) {
      hallFrame(g, y - 0.2, y + 0.2, 0.6, [56, 60, 64]);
      g.box(-W + 0.6, y - 0.2, 0, 2 * (W - 0.6), 0.4, 0.12, [40, 42, 44]);
      // o aro claro do vão (faixa fina na face de quem chega, seguindo o perfil)
      const A2 = hallProfile(0.6), B2 = hallProfile(0.66);
      for (let i = 0; i < A2.length - 1; i++)
        g.quad([A2[i][0], y - 0.21, A2[i][1]], [A2[i + 1][0], y - 0.21, A2[i + 1][1]], [B2[i + 1][0], y - 0.21, B2[i + 1][1]], [B2[i][0], y - 0.21, B2[i][1]], [110, 116, 118], [0, -1, 0]);
    } else hallFrame(g, y - 0.12, y + 0.12, 0.16, [60, 64, 68]);
  }
  // teto: a bandeja de cabos (esquerda) e os dois canos (direita) correm por DENTRO do vão dos anteparos
  // (vão: topo em z = H − 0,6 = 2,5 até x = ±1,40) — bandeja z 2,28…2,40, canos até z 2,45
  g.box(-1.3, 0, 2.28, 0.46, len, 0.04, [40, 42, 44]);
  for (let i = 0; i < 4; i++) g.box(-1.26 + i * 0.1, 0, 2.32, 0.06, len, 0.06, [[22, 22, 24], [70, 30, 24], [24, 26, 30], [80, 70, 40]][i] as RGB);
  for (const [x, r, c, z] of [[0.98, 0.07, [92, 96, 98], 2.36], [1.2, 0.05, [120, 70, 40], 2.38]] as [number, number, RGB, number][])
    for (let y = 0; y < len; y += 1.5) g.box(x - r, y, z - r, 2 * r, 1.5, 2 * r, c);
  // suportes: barra embaixo e tirantes até o teto, entre as costelas (y = 1,5 + 3k), nunca dentro de um anteparo
  for (let y = 1.5; y < len; y += 3) {
    g.box(0.86, y - 0.04, 2.22, 0.44, 0.08, 0.05, [36, 38, 40]);
    g.box(1.26, y - 0.03, 2.22, 0.05, 0.06, H - 2.22, [36, 38, 40]);
    g.box(-1.32, y - 0.03, 2.28, 0.04, 0.06, H - 2.28, [36, 38, 40]);
    g.box(-0.86, y - 0.03, 2.28, 0.04, 0.06, H - 2.28, [36, 38, 40]);
  }
  // luminárias em gaiola no meio do teto (entre as costelas)
  for (let y = 1.5; y < len; y += 3) {
    g.box(-0.45, y - 0.12, H - 0.12, 0.9, 0.24, 0.12, [34, 36, 38]);
    g.box(-0.4, y - 0.07, H - 0.16, 0.8, 0.14, 0.04, [255, 238, 205], { emit: 0.85 });
    for (const dx of [-0.42, -0.14, 0.14, 0.4]) g.box(dx - 0.01, y - 0.1, H - 0.2, 0.02, 0.2, 0.08, [26, 26, 28]);
  }
  // na parede, só dentro dos vãos entre costelas e longe dos anteparos: quadro elétrico (esq.) e caixa de válvula (dir.)
  // 12/10 (pedido dele: a caixa com o vermelho parecia mal modelada): quadro elétrico de verdade — caixa com tampa
  // recuada, aletas de ventilação, dobradiças, fecho, placa de aviso amarela, o LED de status e o eletroduto subindo
  for (let y = 4.5; y < len - 1; y += 6) {
    if (Math.abs(((y + 6) % 12) - 6) < 1) continue;
    const x = -W;
    g.box(x, y - 0.38, 0.95, 0.18, 0.76, 0.9, [70, 78, 74]);
    g.box(x + 0.18, y - 0.33, 1.0, 0.012, 0.66, 0.8, [84, 92, 88]);
    for (let k = 0; k < 5; k++) g.box(x + 0.19, y - 0.22, 1.08 + k * 0.05, 0.01, 0.3, 0.018, [40, 44, 42]);
    for (const z of [1.08, 1.68]) g.box(x + 0.19, y - 0.36, z, 0.02, 0.03, 0.08, [50, 54, 52]);
    g.box(x + 0.195, y + 0.24, 1.36, 0.03, 0.04, 0.12, [40, 42, 42]);
    g.box(x + 0.192, y + 0.06, 1.5, 0.01, 0.2, 0.14, [214, 176, 52]);
    g.box(x + 0.198, y + 0.13, 1.54, 0.006, 0.06, 0.06, [30, 30, 30]);
    g.box(x + 0.19, y + 0.24, 1.74, 0.02, 0.04, 0.04, [90, 220, 120], { emit: 0.7 });
    g.box(x + 0.04, y - 0.05, 1.85, 0.08, 0.08, H - 1.85, [56, 60, 62]);
  }
  for (let y = 7.5; y < len - 1; y += 6) {
    if (Math.abs(((y + 6) % 12) - 6) < 1) continue;
    g.box(W - 0.2, y - 0.25, 1.2, 0.2, 0.5, 0.5, [70, 66, 50]);
    g.prism(W - 0.3, y, 1.7, 1.76, 0.12, 8, [150, 40, 30]);
    g.box(W - 0.26, y - 0.03, 1.7, 0.06, 0.06, 0.06, [90, 90, 90]);
  }
  return g.F;
};

// ================================================================================================= 5C · o objetivo muda (POV)
// o corredor do navio com a Alyx à frente (marcador). O crachá dela: SINAIS INSTÁVEIS → "EFEITO DA ESTASE?" → NÃO É SÓ
// A ESTASE. O painel de objetivos do HEV: OBJETIVO ATUALIZADO → a Aperture entra e cai para secundário → ENCONTRAR O NÚCLEO
// entra no topo → o waypoint acende no fundo do corredor → a linha da Alyx até ele: POR QUE ELA SABE?
export const HLXObjective: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [stasisAt, changeAt, apertureAt, urgentAt, coreAt, whyAt] = ["stasisAt", "changeAt", "apertureAt", "urgentAt", "coreAt", "whyAt"].map((k) => at(p, k));
  const G = useMemo(() => buildShipHall2(40), []);
  const y = 2 + 2.2 * Math.min(1, f / Math.max(1, life));
  const e: Eye = { x: 0.08 * Math.sin(f / 50), y, z: 1.65 + 0.02 * Math.sin(f / 8), yaw: keys(f, [[0, 0.06], [coreAt - 10, 0.06], [coreAt + 20, 0], [whyAt + 10, -0.04]]), pitch: -0.02, F: 960 };
  const lights: XL[] = [{ x: 0, y: y + 4, z: 2.6, col: [255, 236, 200], k: 0.5, r: 8 }, { x: 0, y: 33, z: 1.5, col: [255, 160, 60], k: f >= coreAt ? 0.6 : 0, r: 6 }];
  const wp = proj(e, [0, 34, 1.4]);
  const al = proj(e, [0.7, y + 4.2, 1.72]);
  const status = f >= stasisAt + 24 ? "NÃO É SÓ A ESTASE" : f >= stasisAt ? "EFEITO DA ESTASE?" : "SINAIS INSTÁVEIS";
  const obj: { t: string; at: number; main: boolean }[] = [
    { t: "TECNOLOGIA DA APERTURE", at: apertureAt, main: f < urgentAt },
    { t: "ENCONTRAR O NÚCLEO", at: urgentAt, main: true },
  ];
  return (
    <AbsoluteFill style={{ background: "#020304", overflow: "hidden" }}>
      <XView e={e} faces={G} lights={lights} flash={0.9} amb={0.12} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <XMarker e={e} x={0.7} y={y + 4.2} label="ALYX" col={f >= stasisAt + 24 ? RED : ORANGE} f={f} o={P(f, 4, 10)} sub={f >= whyAt ? "POR QUE ELA SABE?" : status} />
        {/* o waypoint do núcleo no fundo do corredor */}
        {f >= coreAt && wp ? (
          <g opacity={P(f, coreAt, 10)}>
            {[0, 1, 2].map((k) => {
              const t = ((f - coreAt) / 30 + k / 3) % 1;
              return <circle key={k} cx={wp.x} cy={wp.y} r={10 + t * 60} fill="none" stroke={ORANGE} strokeWidth={2} opacity={1 - t} />;
            })}
            <polygon points={`${wp.x},${wp.y - 18} ${wp.x + 14},${wp.y} ${wp.x},${wp.y + 18} ${wp.x - 14},${wp.y}`} fill={ORANGE} />
            <text x={wp.x} y={wp.y - 34} textAnchor="middle" fill={ORANGE} fontFamily={MONO} fontSize={20} letterSpacing={4}>NÚCLEO · {Math.max(120, Math.round(340 - (f - coreAt) * 0.6))} m</text>
          </g>
        ) : null}
        {/* a pergunta: a linha da Alyx até o núcleo */}
        {f >= whyAt && wp && al ? <path d={`M ${al.x} ${al.y} Q ${(al.x + wp.x) / 2} ${Math.min(al.y, wp.y) - 120} ${wp.x} ${wp.y}`} fill="none" stroke={ORANGE} strokeWidth={2} strokeDasharray="6 8" strokeDashoffset={-f * 2} opacity={P(f, whyAt, 10)} /> : null}
      </svg>
      {/* o painel de objetivos do HEV */}
      {f >= changeAt ? (
        <div style={{ position: "absolute", right: 90, top: 130, width: 560, padding: "18px 22px", borderRadius: 14, background: "rgba(14,10,4,0.88)", border: `1.5px solid ${AMB}`, fontFamily: MONO, opacity: P(f, changeAt, 8), transform: `translateX(${(1 - P(f, changeAt, 14)) * 60}px)` }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, letterSpacing: 5, color: AMB }}>
            <span>H.E.V. · OBJETIVOS</span>
            <span style={{ color: f < changeAt + 40 && Math.floor(f / 6) % 2 ? TXT : AMB }}>ATUALIZADO</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", marginTop: 12 }}>
            {[...obj].sort((a, b) => Number(b.main) - Number(a.main) || b.at - a.at).filter((o) => f >= o.at).map((o) => (
              <div key={o.t} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", marginTop: 8, borderLeft: `3px solid ${o.main ? ORANGE : "rgba(242,240,247,0.3)"}`, background: o.main ? "rgba(255,150,60,0.12)" : "rgba(8,8,10,0.5)", opacity: P(f, o.at, 8), transform: `translateY(${(1 - P(f, o.at, 12)) * -20}px)` }}>
                <span style={{ color: o.main ? ORANGE : "rgba(242,240,247,0.45)", fontSize: 18 }}>◆</span>
                <div>
                  <div style={{ fontSize: 13, letterSpacing: 3, color: o.main ? ORANGE : "rgba(242,240,247,0.45)" }}>{o.main ? (o.t === "ENCONTRAR O NÚCLEO" ? "PRINCIPAL · URGENTE" : "PRINCIPAL") : "SECUNDÁRIO"}</div>
                  <div style={{ fontSize: 22, letterSpacing: 2, color: o.main ? TXT : "rgba(242,240,247,0.5)", marginTop: 2 }}>{o.t}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      <Hud f={f} yaw={e.yaw} eye={e} blips={f >= coreAt ? [{ x: 0.7, y: y + 4.2 }, { x: 0, y: 34, hot: true }] : [{ x: 0.7, y: y + 4.2 }]} msg={f >= changeAt && f < urgentAt ? "O OBJETIVO MUDA" : undefined} msgCol={AMB} />
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ================================================================================================= 5C · vira mecânica (POV)
// um corredor com três pontos e o seletor de fase do HEV embaixo (−20 ANOS · PRESENTE · +20 ANOS). O seletor anda e o
// corredor muda junto: a passagem bloqueada por entulho (presente) está livre em +20; a parede que o Gordon quebrou
// (presente) volta inteira antes do dano; o pedestal vazio (presente) tem a máquina funcionando em outra fase. Na
// troca, o estado novo entra piscando com o contorno em wireframe.
const MECH_A = 7;
const MECH_B = 15;
const MECH_C = 23;
const buildMechStatic = (): XF[] => {
  const g = mk();
  g.room(-2.2, 2.2, 0, 30, 3.0, [70, 76, 78], [52, 54, 54], [38, 40, 42], [{ side: "E", c: MECH_B, w: 2.2, h: 2.6 }], 2);
  for (const y of [MECH_A, MECH_C + 3]) {
    g.box(-2.2, y, 0, 0.9, 0.25, 3.0, [48, 52, 54]);
    g.box(1.3, y, 0, 0.9, 0.25, 3.0, [48, 52, 54]);
    g.box(-1.3, y, 2.4, 2.6, 0.25, 0.6, [48, 52, 54]);
  }
  // o nicho à direita (atrás da parede B)
  g.room(2.2, 4.6, MECH_B - 1.1, MECH_B + 1.1, 2.6, [60, 64, 66], [46, 48, 48], [34, 36, 38], [{ side: "W", c: MECH_B, w: 2.2, h: 2.6 }], 1.1);
  g.box(3.6, MECH_B - 0.6, 0, 0.8, 1.2, 1.1, [90, 60, 40]);
  // o pedestal C
  g.box(-0.7, MECH_C - 0.7, 0, 1.4, 1.4, 0.25, [56, 58, 60]);
  for (let y = 3; y < 30; y += 6) g.box(-0.3, y, 2.96, 0.6, 0.6, 0.04, [255, 236, 200], { emit: 0.7 });
  return g.F;
};
const buildDebris = (): XF[] => {
  const g = mk();
  [[-1.2, 0, 0.9, 0.8, 0.7], [0.1, 0.1, 1.1, 0.9, 0.9], [-0.6, -0.3, 0.8, 0.7, 1.5], [0.5, -0.2, 0.7, 0.6, 1.8], [-1.3, 0.2, 2.6, 0.2, 0.25]].forEach(([x, dy, w, d, z], i) =>
    g.box(x, MECH_A - 0.6 + dy, i === 4 ? 1.6 : z - (i > 1 ? 0.7 : z), w, d, i === 4 ? 0.25 : i > 1 ? 0.7 : z, i === 4 ? [80, 70, 60] : [74 + i * 6, 70 + i * 4, 62]),
  );
  return g.F;
};
const buildWall = (broken: boolean): XF[] => {
  const g = mk();
  const x = 2.2;
  if (!broken) {
    g.quad([x - 0.01, MECH_B + 1.1, 0], [x - 0.01, MECH_B - 1.1, 0], [x - 0.01, MECH_B - 1.1, 2.6], [x - 0.01, MECH_B + 1.1, 2.6], [78, 82, 84], [-1, 0, 0]);
    g.box(x - 0.06, MECH_B - 1.1, 1.2, 0.05, 2.2, 0.08, [56, 58, 60]);
  } else {
    // pedaços que sobraram nas bordas do buraco
    g.quad([x - 0.01, MECH_B + 1.1, 0], [x - 0.01, MECH_B + 0.6, 0], [x - 0.01, MECH_B + 0.75, 2.6], [x - 0.01, MECH_B + 1.1, 2.6], [78, 82, 84], [-1, 0, 0]);
    g.quad([x - 0.01, MECH_B - 0.6, 0], [x - 0.01, MECH_B - 1.1, 0], [x - 0.01, MECH_B - 1.1, 2.6], [x - 0.01, MECH_B - 0.8, 2.6], [78, 82, 84], [-1, 0, 0]);
    g.quad([x - 0.01, MECH_B + 0.75, 2.6], [x - 0.01, MECH_B + 0.5, 2.1], [x - 0.01, MECH_B - 0.55, 2.2], [x - 0.01, MECH_B - 0.8, 2.6], [78, 82, 84], [-1, 0, 0]);
    [[1.6, MECH_B - 0.4, 0.4], [1.4, MECH_B + 0.3, 0.3], [1.8, MECH_B + 0.1, 0.25]].forEach(([bx, by, s]) => g.box(bx, by, 0, s, s, s * 0.6, [70, 74, 76]));
  }
  return g.F;
};
const buildMachine = (): XF[] => {
  const g = mk();
  g.box(-0.55, MECH_C - 0.45, 0.25, 1.1, 0.9, 1.3, [60, 70, 76]);
  g.box(-0.45, MECH_C - 0.47, 0.9, 0.9, 0.02, 0.5, [80, 230, 210], { emit: 0.7, tag: "scr" });
  g.prism(0, MECH_C, 1.55, 1.75, 0.35, 10, [70, 80, 86]);
  g.prism(0, MECH_C, 1.75, 2.3, 0.12, 8, [255, 178, 46], { emit: 0.8, tag: "core" });
  return g.F;
};
export const HLXPhaseMech: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [mechAt, passAt, openAt, wallAt, backAt, equipAt, workAt, notAt, sameAt, prevAt, aheadAt] = ["mechAt", "passAt", "openAt", "wallAt", "backAt", "equipAt", "workAt", "notAt", "sameAt", "prevAt", "aheadAt"].map((k) => at(p, k));
  const S = useMemo(() => buildMechStatic(), []);
  const DEB = useMemo(() => buildDebris(), []);
  const WALL = useMemo(() => buildWall(false), []);
  const HOLE = useMemo(() => buildWall(true), []);
  const MAC = useMemo(() => buildMachine(), []);
  // o seletor: −1 (antes do dano) · 0 (presente) · +1 (20 anos depois / outra fase)
  const knob = keys(f, [
    [0, 0], [openAt - 8, 0], [openAt + 10, 1], [wallAt - 8, 1], [wallAt + 10, 0], [backAt - 4, 0], [backAt + 14, -1],
    [equipAt - 8, -1], [equipAt + 10, 0], [workAt - 6, 0], [workAt + 12, 1], [sameAt - 6, 1], [sameAt + 10, 0],
    [prevAt - 6, 0], [prevAt + 12, -1], [aheadAt - 6, -1], [aheadAt + 14, 1],
  ]);
  const ph = Math.round(knob);
  // câmera: vê A → vira para B → anda até C → recua para ver tudo
  const yy = keys(f, [[0, 1.0], [wallAt - 10, 1.5], [wallAt + 20, 9.5], [equipAt - 10, 10.5], [equipAt + 24, 15.5], [notAt, 16.5], [sameAt, 4]]);
  const yaw = keys(f, [[0, 0], [wallAt - 10, 0], [wallAt + 20, 0.62], [equipAt - 10, 0.62], [equipAt + 24, 0], [life, 0.05]]);
  const e: Eye = { x: 0.1 * Math.sin(f / 60), y: yy, z: 1.65, yaw, pitch: -0.06, F: 960 };
  // a troca: o estado novo pisca por alguns quadros (com contorno)
  const lastSwitch = [openAt, wallAt, backAt, equipAt, workAt, sameAt, prevAt, aheadAt].filter((t) => f >= t).pop() ?? -100;
  const blink = f - lastSwitch < 14 && rnd(Math.floor(f / 2) * 7) > 0.5;
  const debrisOn = ph < 1;
  const wallBroken = f >= wallAt && ph >= 0;
  const macOn = f >= equipAt ? ph !== 0 : ph === 1 || ph === -1;
  const faces = [...S, ...(debrisOn ? DEB : []), ...(wallBroken ? HOLE : WALL), ...(macOn ? MAC : [])];
  const tint = ph === 1 ? [140, 200, 255] : ph === -1 ? [255, 190, 120] : [255, 236, 200];
  const lights: XL[] = [
    { x: 0, y: yy + 4, z: 2.6, col: tint as RGB, k: 0.55, r: 9 },
    { x: 0, y: MECH_C, z: 2, col: [255, 178, 46], k: macOn ? 0.5 : 0, r: 4 },
  ];
  const label = (pt: V3, text: string, col: string, show: boolean, sub?: string) => {
    const q = proj(e, pt);
    if (!q || !show) return null;
    return (
      <g>
        <circle cx={q.x} cy={q.y} r={8} fill={col} />
        <line x1={q.x} y1={q.y} x2={q.x} y2={q.y - 90} stroke={col} strokeWidth={1.6} />
        <text x={q.x + 10} y={q.y - 96} fill={col} fontFamily={MONO} fontSize={20} letterSpacing={4}>{text}</text>
        {sub ? <text x={q.x + 10} y={q.y - 72} fill="rgba(242,240,247,0.7)" fontFamily={MONO} fontSize={15} letterSpacing={2}>{sub}</text> : null}
      </g>
    );
  };
  const phName = ph === 1 ? "+20 ANOS" : ph === -1 ? "ANTES DO DANO" : "PRESENTE";
  return (
    <AbsoluteFill style={{ background: "#020304", overflow: "hidden" }}>
      <XView e={e} faces={faces} lights={lights} flash={0.9} amb={0.14} seam={blink ? "rgba(159,230,255,0.9)" : "rgba(0,0,0,0.32)"} />
      {blink ? <AbsoluteFill style={{ background: "rgba(159,230,255,0.06)" }} /> : null}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {label([0, MECH_A, 1.6], debrisOn ? "PASSAGEM BLOQUEADA" : "PASSAGEM ABERTA", debrisOn ? RED : GREEN, f >= passAt && f < wallAt + 10, debrisOn ? "PRESENTE" : "20 ANOS DEPOIS")}
        {label([2.2, MECH_B, 1.4], wallBroken ? "PAREDE DESTRUÍDA" : "A PAREDE VOLTOU", wallBroken ? RED : AMB, f >= wallAt + 10 && f < equipAt, wallBroken ? "O GORDON QUEBROU" : "O SETOR VOLTOU A ANTES DO DANO")}
        {label([0, MECH_C, 1.2], macOn ? "FUNCIONANDO" : "NÃO EXISTE MAIS", macOn ? GREEN : RED, f >= equipAt && f < notAt, macOn ? "EM OUTRA FASE" : "PRESENTE")}
      </svg>
      {/* a frase: não é regeneração, é o mesmo lugar */}
      {f >= notAt ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 170, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 64, color: TXT, textShadow: "0 8px 40px #000" }}>
          <span style={{ opacity: P(f, notAt, 8), position: "relative" }}>
            o Borealis se regenerando
            <span style={{ position: "absolute", left: 0, top: "52%", height: 6, width: `${100 * P(f, notAt + 10, 10)}%`, background: RED }} />
          </span>
          {f >= sameAt ? <div style={{ fontSize: 54, color: ICE, marginTop: 14, opacity: P(f, sameAt, 8) }}>o mesmo lugar, em outro momento</div> : null}
        </div>
      ) : null}
      {/* o seletor de fase do HEV */}
      <div style={{ position: "absolute", left: 960 - 380, bottom: 150, width: 760, opacity: P(f, mechAt, 10), fontFamily: MONO }}>
        <div style={{ textAlign: "center", fontSize: 15, letterSpacing: 5, color: AMB }}>H.E.V. · FASE DO SETOR · <span style={{ color: ph === 1 ? ICE : ph === -1 ? AMB : TXT }}>{phName}</span></div>
        <div style={{ position: "relative", height: 40, marginTop: 10 }}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 18, height: 4, background: "rgba(255,178,46,0.35)" }} />
          {[-1, 0, 1].map((k) => <div key={k} style={{ position: "absolute", left: `${50 + k * 50}%`, top: 10, width: 2, height: 20, background: AMB, transform: "translateX(-1px)" }} />)}
          <div style={{ position: "absolute", left: `${50 + knob * 50}%`, top: 6, width: 28, height: 28, borderRadius: 14, background: ORANGE, transform: "translateX(-14px)", boxShadow: "0 0 18px rgba(255,150,60,0.8)" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, letterSpacing: 3, color: "rgba(242,240,247,0.7)" }}>
          <span>ANTES DO DANO</span>
          <span>PRESENTE</span>
          <span>+20 ANOS</span>
        </div>
      </div>
      <Hud f={f} yaw={e.yaw} eye={e} blips={[{ x: 0, y: MECH_A }, { x: 2.2, y: MECH_B }, { x: 0, y: MECH_C }]} msg={f >= mechAt && f < passAt + 20 ? "VIRA MECÂNICA" : f >= prevAt && f < aheadAt ? "VOLTANDO AO ESTADO ANTERIOR" : f >= aheadAt ? "AVANÇANDO NA HISTÓRIA" : undefined} msgCol={AMB} />
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ================================================================================================= 6 · a ironia (POV)
// o laboratório da Aperture (a cadeira, a tela PRESERVAR A MENTE DE CAVE JOHNSON): Cave passou a vida tentando continuar
// → corte em "Breen conseguiu" para o casulo (o Advisor-Breen) → a voz dele num medidor que mal se sustenta → a palavra
// que ele repete digitada no vidro: CONTINUIDADE → "imortalidade" riscada → os sinais do corpo vão a zero ("o corpo podia
// terminar") → um pulso de luz sobe pelos cabos para fora do casulo ("alguma coisa continuaria").
export const HLXIrony: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [ironyAt, caveAt, breenAt, begAt, bodyAt, repeatAt, wordAt, promAt, notImmAt, contAt, endAt, goesAt] = ["ironyAt", "caveAt", "breenAt", "begAt", "bodyAt", "repeatAt", "wordAt", "promAt", "notImmAt", "contAt", "endAt", "goesAt"].map((k) => at(p, k));
  const cut = Math.round(breenAt - 4);
  const g = f - cut;
  const vol = f >= bodyAt ? 0.25 + 0.35 * Math.abs(Math.sin(f / 3.2)) * (rnd(Math.floor(f / 2)) > 0.3 ? 1 : 0.1) : 0.8;
  const flat = interpolate(f, [endAt - 4, endAt + 30], [0, 1], C);
  const word = (s: string, t0: number) => s.slice(0, Math.max(0, Math.floor((f - t0) * 0.8)));
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Sequence from={0} durationInFrames={Math.max(1, cut)} layout="none">
        <AbsoluteFill>
          <HLXCaveLab life={cut} caveAt={-900} tecAt={-800} anomAt={-700} apAt={-600} archAt={-500} equipAt={-400} princAt={-300} planAt={-200} mindAt={1e9} aiAt={-150} carolAt={1e9} />
          {f >= caveAt ? (
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 170, textAlign: "center", fontFamily: MONO, fontSize: 22, letterSpacing: 6, color: AMB, opacity: P(f, caveAt, 10) }}>CAVE JOHNSON · A VIDA INTEIRA PROCURANDO UM JEITO DE CONTINUAR</div>
          ) : null}
          {f >= ironyAt ? <div style={{ position: "absolute", left: 80, top: 110, fontFamily: MONO, fontSize: 20, letterSpacing: 6, color: ORANGE, opacity: P(f, ironyAt, 10) }}>UMA IRONIA ABSURDA</div> : null}
        </AbsoluteFill>
      </Sequence>
      <Sequence from={cut} layout="none">
        <AbsoluteFill>
          {/* 08/10 (pedido dele): os tempos zerados do casulo deixavam as chaves da câmera fora de ordem — ela subia para o
              teto e voltava de estalo. Agora uma aproximação lenta e contínua, que termina onde a cena seguinte começa */}
          <HLXPod {...({ life: life - cut, final: 1, podAt: 0, cablesAt: 0, larvalAt: 0, looksAt: -60, advAt: 1e9, voiceAt: 1e9, freemanAt: 1e9, breenAt: 0, believesAt: 1e9, mossAt: 1e9, cam: (fr: number) => podPush(fr, life - cut, 4.0, 4.5) } as unknown as PR)} />
          {/* BREEN · CONSEGUIU */}
          {f >= breenAt && f < bodyAt ? (
            <div style={{ position: "absolute", left: 90, top: 150, padding: "14px 20px", borderRadius: 12, background: "rgba(14,10,6,0.88)", border: `1.5px solid ${ORANGE}`, fontFamily: MONO, opacity: P(f, breenAt, 8) }}>
              <div style={{ fontSize: 15, letterSpacing: 5, color: ORANGE }}>WALLACE BREEN</div>
              <div style={{ fontSize: 28, letterSpacing: 3, color: TXT, marginTop: 6 }}>CONSEGUIU CONTINUAR</div>
              {f >= begAt ? <div style={{ fontSize: 20, letterSpacing: 3, color: RED, marginTop: 8, opacity: P(f, begAt, 8) }}>E IMPLORA PARA MORRER</div> : null}
            </div>
          ) : null}
          {/* a voz que mal se sustenta */}
          {f >= bodyAt ? (
            <div style={{ position: "absolute", left: 90, top: 150, width: 460, padding: "14px 18px", borderRadius: 12, background: "rgba(14,10,6,0.88)", border: `1.5px solid ${ORANGE}`, fontFamily: MONO, opacity: P(f, bodyAt, 8) }}>
              <div style={{ fontSize: 15, letterSpacing: 5, color: ORANGE }}>VOZ · WALLACE BREEN</div>
              <svg width={424} height={90} style={{ marginTop: 8 }}>
                {Array.from({ length: 53 }).map((_, k) => {
                  const h = Math.max(2, 80 * vol * (0.3 + 0.7 * Math.abs(Math.sin(k * 0.7 + f / 3))) * (1 - flat));
                  return <rect key={k} x={k * 8} y={45 - h / 2} width={5} height={h} fill={ORANGE} opacity={0.85} />;
                })}
              </svg>
              <div style={{ fontSize: 14, letterSpacing: 3, color: "rgba(242,240,247,0.7)" }}>{flat > 0.9 ? "SEM SINAL" : "SINAL INSTÁVEL · O CORPO MAL SUSTENTA"}</div>
            </div>
          ) : null}
          {/* 08/10 (pedido dele): nada de palavra grande no meio do POV — a palavra que ele repete fica na TRANSCRIÇÃO do
              painel de voz (dentro do HUD), e "imortalidade" é riscada ali mesmo */}
          {f >= wordAt ? (
            <div style={{ position: "absolute", left: 90, top: 330, width: 460, padding: "12px 18px", borderRadius: 12, background: "rgba(6,14,14,0.88)", border: `1.5px solid ${TEAL}`, fontFamily: MONO, opacity: P(f, wordAt, 8) }}>
              <div style={{ fontSize: 14, letterSpacing: 5, color: TEAL }}>TRANSCRIÇÃO · A PALAVRA QUE ELE REPETE</div>
              <div style={{ fontSize: 34, letterSpacing: 5, color: TXT, marginTop: 8 }}>
                {word("CONTINUIDADE", wordAt)}
                <span style={{ opacity: Math.floor(f / 8) % 2 }}>_</span>
              </div>
              {f >= promAt ? <div style={{ fontSize: 14, letterSpacing: 3, color: AMB, marginTop: 8, opacity: P(f, promAt, 8) }}>O QUE PROMETERAM A ELE</div> : null}
              {f >= notImmAt ? (
                <div style={{ fontSize: 22, letterSpacing: 3, color: "rgba(242,240,247,0.55)", marginTop: 6, position: "relative", display: "inline-block", opacity: P(f, notImmAt, 8) }}>
                  IMORTALIDADE
                  <span style={{ position: "absolute", left: 0, top: "52%", height: 3, width: `${100 * P(f, notImmAt + 8, 10)}%`, background: RED }} />
                </div>
              ) : null}
            </div>
          ) : null}
          {/* o corpo termina (sinais vitais a zero) e alguma coisa sobe pelos cabos */}
          {f >= endAt ? (
            <div style={{ position: "absolute", right: 90, top: 150, width: 380, padding: "14px 18px", borderRadius: 12, background: "rgba(14,4,4,0.88)", border: `1.5px solid ${RED}`, fontFamily: MONO, opacity: P(f, endAt, 8) }}>
              <div style={{ fontSize: 15, letterSpacing: 5, color: RED }}>O CORPO</div>
              <div style={{ fontSize: 30, letterSpacing: 3, color: RED, marginTop: 6 }}>{Math.round(48 * (1 - flat))} BPM</div>
            </div>
          ) : null}
          {f >= goesAt ? (
            <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
              {[-260, -90, 90, 260].map((dx, k) => {
                const t = Math.min(1, (f - goesAt - k * 3) / 30);
                if (t <= 0) return null;
                const x0 = 960 + dx * 0.3;
                const y0 = 470;
                const x1 = 960 + dx * 2.4;
                const y1 = -40;
                const px = x0 + (x1 - x0) * t;
                const py = y0 + (y1 - y0) * t - Math.sin(t * Math.PI) * 60;
                return (
                  <g key={k}>
                    <circle cx={px} cy={py} r={9} fill="#e9fffa" style={{ filter: "drop-shadow(0 0 12px #4fe3d0) drop-shadow(0 0 26px #4fe3d0)" }} />
                  </g>
                );
              })}
              <text x={960} y={980} textAnchor="middle" fill={TEAL} fontFamily={MONO} fontSize={22} letterSpacing={6} opacity={P(f, goesAt + 6, 10)}>ALGUMA COISA DELE CONTINUARIA</text>
            </svg>
          ) : null}
        </AbsoluteFill>
      </Sequence>
      {void contAt}
      {void repeatAt}
    </AbsoluteFill>
  );
};

// ================================================================================================= 6 · a Mossman nos terminais (POV)
// a sala do casulo, virada para os consoles: a Mossman (marcador) no terminal; a tela flutuando sobre o console com os
// arquivos sendo copiados e o envio para o Kleiner; a Alyx (marcador) parada atrás, em silêncio. `mode` 1 = a cópia às
// pressas: as quatro categorias enchendo, a contagem até a próxima fase, e a sala começa a piscar de fase no fim.
export const HLXUplink: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const mode = p.mode ?? 0;
  const [termAt, copyAt, cryptAt, notesAt, kleinerAt, alyxAt, silentAt, contAt, recAt, expAt, calcAt, phaseAt] = ["termAt", "copyAt", "cryptAt", "notesAt", "kleinerAt", "alyxAt", "silentAt", "contAt", "recAt", "expAt", "calcAt", "phaseAt"].map((k) => at(p, k));
  const G = useMemo(() => buildPodRoom(), []);
  const yaw = keys(f, [[0, mode ? 0.62 : 0.2], [Math.min(termAt, copyAt), 0.62], [mode ? 1e9 : alyxAt - 6, 0.62], [mode ? 1e9 : alyxAt + 24, -0.2], [mode ? 1e9 : contAt, -0.2], [mode ? 1e9 : contAt + 20, 0.3]]);
  const e: Eye = { x: 0.5, y: 2.6, z: 1.65 + 0.02 * Math.sin(f / 9), yaw, pitch: -0.05, F: 980 };
  const flick = mode && f >= phaseAt - 30 ? (rnd(Math.floor(f / 2) * 3) > 0.7 ? 1 : 0) : 0;
  const lights: XL[] = [
    { x: 4.2, y: 5.6, z: 1.6, col: [60, 200, 220], k: 0.5, r: 4 },
    { x: 0, y: 9.2, z: 1.6, col: [60, 255, 225], k: 0.3, r: 6.5 },
    ...(flick ? [{ x: 0.5, y: 4, z: 2.4, col: [199, 155, 255] as RGB, k: 0.9, r: 8 }] : []),
  ];
  // 12/10: o mesmo casulo da cena anterior (vidro e aros 3D, a larva dentro)
  const upDeco = useMemo(() => makePodDeco(), []);
  const [UPOD] = useAdvisors(1, 1.75, true);
  if (UPOD) {
    placeAdvisor(UPOD, [0, 9.25, 1.5 + 0.04 * Math.sin(f / 30)], [e.x, e.y, 1.5], 0.95);
    UPOD.pose(f / 30, 0);
  }
  const upL = useMemo(() => {
    const pl = new THREE.PointLight("#e0fff8", 150, 12, 1.2);
    pl.position.set(0.5, 2.0, -8.0);
    return [...advLightsFor([0.8, 6.0, 3.4], "#e8fff8", "#a8d8d0", 2.2, [0, 9.2, 1.5]), pl];
  }, []);
  const scr = proj(e, [4.15, 5.6, 2.25]);
  const files: [string, number][] = mode
    ? [["REGISTROS COMBINE", recAt], ["EXPERIMENTOS", expAt], ["CÁLCULOS DO BOREALIS", calcAt], ["ANOTAÇÕES ESTRANHAS DO NAVIO", notesAt]]
    : [["inst_combine_01.enc", cryptAt], ["inst_combine_02.enc", cryptAt + 6], ["hospedeiro_seq.enc", cryptAt + 12], ["anotacoes_navio.img", notesAt]];
  const bar = (t0: number, d: number) => interpolate(f, [t0, t0 + d], [0, 1], C);
  const send = bar(kleinerAt, mode ? 50 : 70);
  const left = mode ? Math.max(0, Math.round(40 - (f - copyAt) / 30 * 2.2)) : 0;
  return (
    <AbsoluteFill style={{ background: "#020304", overflow: "hidden" }}>
      <XView e={e} faces={G} lights={lights} flash={1.0} amb={0.08} hide={(fc) => fc.tag === "pod"} extras={UPOD ? [UPOD.root, upDeco] : [upDeco]} glLights={UPOD ? upL : []} />
      {flick ? <AbsoluteFill style={{ background: "rgba(199,155,255,0.12)" }} /> : null}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <XMarker e={e} x={3.3} y={5.6} label="MOSSMAN" col={ICE} f={f} o={P(f, 4, 10)} sub={f >= copyAt ? "COPIANDO" : "NOS TERMINAIS"} />
        {scr && f >= Math.min(termAt, copyAt) - 10 ? (
          <g opacity={P(f, Math.min(termAt, copyAt) - 10, 10)}>
            <circle cx={scr.x} cy={scr.y} r={8} fill="none" stroke={TEAL} strokeWidth={2} />
            <line x1={scr.x} y1={scr.y} x2={1220} y2={300} stroke={TEAL} strokeWidth={1.6} />
          </g>
        ) : null}
        {!mode && f >= alyxAt ? <XMarker e={e} x={-2.2} y={4.2} label="ALYX" col={ORANGE} f={f} o={P(f, alyxAt, 10)} sub={f >= silentAt ? "EM SILÊNCIO" : "ACOMPANHA"} /> : null}
      </svg>
      {/* a tela do terminal sobre o console */}
      {scr && f >= Math.min(termAt, copyAt) - 10 ? (
        <div style={{ position: "absolute", left: 1220, top: 190, width: 620, padding: "18px 22px", borderRadius: 10, background: "rgba(4,18,20,0.9)", border: `1.5px solid ${TEAL}`, fontFamily: MONO, color: TEAL, boxShadow: "0 0 40px rgba(79,227,208,0.25)", opacity: P(f, Math.min(termAt, copyAt) - 10, 10) }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, letterSpacing: 4 }}>
            <span>TERMINAL COMBINE · CÓPIA</span>
            {mode ? <span style={{ color: left < 12 ? RED : AMB }}>{`FASE EM ${left}s`}</span> : null}
          </div>
          {files.map(([n, t0], k) => (
            <div key={n} style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10, opacity: f >= t0 ? 1 : 0.25 }}>
              <span style={{ width: 22, color: bar(t0, 40) >= 1 ? GREEN : AMB }}>{bar(t0, 40) >= 1 ? "✓" : f >= t0 ? "▸" : "·"}</span>
              <span style={{ flex: 1, fontSize: mode ? 18 : 17, letterSpacing: 2, color: k === 3 ? AMB : TXT }}>{n}</span>
              <div style={{ width: 160, height: 6, background: "rgba(79,227,208,0.15)" }}>
                <div style={{ width: `${100 * bar(t0, 40)}%`, height: "100%", background: k === 3 ? AMB : TEAL }} />
              </div>
            </div>
          ))}
          {f >= kleinerAt ? (
            <div style={{ marginTop: 16, padding: "10px 12px", border: `1px dashed ${AMB}`, borderRadius: 8, color: AMB, opacity: P(f, kleinerAt, 8) }}>
              <div style={{ fontSize: 16, letterSpacing: 3 }}>{send >= 1 ? "ENVIADO" : "ENVIANDO"} → DR. KLEINER · WHITE FOREST</div>
              <div style={{ height: 6, marginTop: 8, background: "rgba(255,178,46,0.2)" }}>
                <div style={{ width: `${100 * send}%`, height: "100%", background: AMB }} />
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
      {!mode && f >= contAt ? <div style={{ position: "absolute", left: 0, right: 0, bottom: 170, textAlign: "center", fontFamily: MONO, fontSize: 22, letterSpacing: 6, color: TXT, opacity: P(f, contAt, 10) }}>E A HISTÓRIA CONTINUA</div> : null}
      <Hud f={f} yaw={e.yaw} eye={e} blips={mode ? [{ x: 3.3, y: 5.6, hot: true }] : [{ x: 3.3, y: 5.6, hot: true }, { x: -2.2, y: 4.2 }]} msg={mode && f >= phaseAt - 30 ? "O BOREALIS VAI SAIR DE FASE" : undefined} msgCol={VIO} />
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};
