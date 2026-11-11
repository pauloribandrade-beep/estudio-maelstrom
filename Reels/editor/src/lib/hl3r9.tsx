// =================================================================================================
// HL3 · MÓDULO 9 (60:31 → 69:12), refeito em 07/10/2026 no padrão da primeira hora: POV do Gordon (motor de hl3rx) como
// base, objetos físicos com nexo (mapa de papel na mesa, barbante preso de verdade, rádio no painel), footage só quando é
// exatamente o que a fala diz, 2D concreto no resto. Pessoas = marcador com crachá na bandeira (nunca silhueta de gente).
// =================================================================================================
import React, { useMemo } from "react";
import { AbsoluteFill, Easing, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { FONT, MONO } from "./overlays";
import { Snd } from "./palco";
import { HLSpace, C, Clip, HL, rnd } from "./hl3";
import { FilmLook, decode } from "./hl3r";
import { FinalsFork } from "./hl3fim";
import { OutroIntro } from "./hl3chap";
import { Eye, Hud, V3, proj } from "./hl3rf";
import { ArcticBase, IcoComb, buildBorealis } from "./hl3rw";
import { HLRMaze } from "./hl3rb";
import { Ecg } from "./hl3t";
import { VisAlyxAge, VisCitadel } from "./hl3y";
import { HLTramEnding } from "./hl3z";
import { ShipProfile } from "./hl3rd";
import { TwoWays3D } from "./hl3r10";
import { useAdvisors, placeAdvisor, useAdvScene, W3 } from "./advgl";
import { HL10Pattern } from "./hl3r16";
import { HL10MindRun } from "./hl3r12";
import { HL13AscAfter } from "./hl3r20";
import { HL14ColAfter } from "./hl3r24";
import * as THREE from "three";
import { borealisEdges } from "./hl3r9s";
import { useGLB, placeGLB } from "./glbgl";
import { useRealStriders, useHla } from "./strider3d";
import { XF, XL, RGB, mk, XView, XMarker, keys, fadeIO, quadMatrix3d, FlagBadge, SilhouetteAt, XenVista, buildShipHall, buildShipHall2, AdvisorArt, occluded, stemBase, CombineScreen, buildPodRoom, PodRingsView } from "./hl3rx";

const RED = "#ff5d4d";
const AMB = "#ffb22e";
const CREAM = "#ffe2b0";
const ICE = "#9fe6ff";
const VIO = "#c79bff";
const GREEN = "#8dffa8";
const ORANGE = HL.orange;
const TXT = HL.text;
const P = (f: number, at: number, d = 12) => interpolate(f, [at, at + d], [0, 1], { ...C, easing: Easing.out(Easing.cubic) });
type PR = Record<string, number> & { life: number };
const at = (p: PR, k: string) => (p[k] as number | undefined) ?? 1e9;
const ats = (p: PR, ks: string[]) => ks.map((k) => at(p, k));


// frase de impacto (no lugar do texto branco seco): placa escura com barra de cor, revelada da esquerda, palavras subindo,
// sublinhado que corre. pos/at = top ou bottom em px; col = a cor da barra; t0 = quando entra.
const ImpactBox: React.FC<{ top?: number; bottom?: number; size?: number; col?: string; t0?: number; v?: number; children: React.ReactNode }> = ({ top, bottom, size = 52, col = "#ffd27a", t0 = 0, v, children }) => {
  const f = useCurrentFrame();
  const k = P(f, t0, 14);
  const s2 = Math.min(size, 50) * 0.92;
  // estilos diferentes (não o mesmo cartão repetido): escolhido pela cena ou pelo instante
  const txt = typeof children === "string" ? children : null;
  const vv = (v ?? Math.floor(Math.abs(t0) * 7.3) % 5) % 5;
  const wrap = (el: React.ReactNode) => <div style={{ position: "absolute", left: 0, right: 0, top, bottom, display: "flex", justifyContent: "center", pointerEvents: "none" }}>{el}</div>;
  const words = txt ? txt.split(" ") : [];
  if (vv === 1 && txt) {
    // marca-texto: cada palavra entra e uma faixa de cor passa por trás dela
    return wrap(
      <div style={{ maxWidth: 1500, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: s2 * 1.05, lineHeight: 1.3 }}>
        {words.map((w, n) => {
          const kw = P(f, t0 + n * 3, 8);
          return (
            <span key={n} style={{ position: "relative", display: "inline-block", margin: "0 8px", color: "#0b0d12", opacity: kw, transform: `translateY(${(1 - kw) * 20}px)` }}>
              <span style={{ position: "absolute", left: -6, right: -6, top: "8%", bottom: "4%", background: col, transform: `scaleX(${P(f, t0 + n * 3 + 2, 8)})`, transformOrigin: "0 50%", zIndex: 0 }} />
              <span style={{ position: "relative", zIndex: 1 }}>{w}</span>
            </span>
          );
        })}
      </div>,
    );
  }
  if (vv === 2) {
    // carimbo: borda grossa, girado, entra batendo
    return wrap(
      <div style={{ padding: "12px 28px", border: `5px solid ${col}`, color: col, fontFamily: MONO, fontWeight: 700, fontSize: s2 * 0.82, letterSpacing: 4, textTransform: "uppercase", textAlign: "center", maxWidth: 1400, transform: `rotate(-3deg) scale(${1.35 - 0.35 * P(f, t0, 7)})`, opacity: P(f, t0, 4), background: "rgba(8,6,4,0.55)", boxShadow: `0 0 30px ${col}55` }}>{children}</div>,
    );
  }
  if (vv === 3 && txt) {
    // terminal: digitando, com cursor
    const n = Math.floor((f - t0) * 1.6);
    return wrap(
      <div style={{ padding: "16px 24px", borderRadius: 8, background: "rgba(4,16,14,0.9)", border: `1.5px solid ${col}`, fontFamily: MONO, fontSize: s2 * 0.78, letterSpacing: 2, color: col, maxWidth: 1500, boxShadow: `0 0 30px ${col}33`, opacity: P(f, t0, 4) }}>
        <span style={{ opacity: 0.6 }}>&gt; </span>{txt.slice(0, Math.max(0, n))}<span style={{ opacity: Math.floor(f / 8) % 2 }}>▌</span>
      </div>,
    );
  }
  if (vv === 4 && txt) {
    // palavras caindo uma a uma, a última na cor de destaque, com uma linha fina embaixo
    return wrap(
      <div style={{ textAlign: "center", maxWidth: 1500 }}>
        <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: s2 * 1.1, lineHeight: 1.2, textShadow: "0 8px 30px rgba(0,0,0,0.9)" }}>
          {words.map((w, n) => {
            const kw = P(f, t0 + n * 4, 10);
            return <span key={n} style={{ display: "inline-block", margin: "0 9px", color: n === words.length - 1 ? col : "#f6f2ea", opacity: kw, transform: `translateY(${(1 - kw) * -40}px) rotate(${(1 - kw) * (n % 2 ? 6 : -6)}deg)` }}>{w}</span>;
          })}
        </div>
        <div style={{ height: 2, margin: "12px auto 0", width: `${60 * P(f, t0 + words.length * 4, 16)}%`, background: col }} />
      </div>,
    );
  }
  // 0: placa escura com barra de cor, revelada da esquerda
  return wrap(
    <div style={{ position: "relative", padding: "16px 30px 20px 34px", background: "linear-gradient(90deg, rgba(6,8,12,0.94), rgba(10,12,18,0.82))", boxShadow: "0 18px 50px rgba(0,0,0,0.55)", borderRadius: 6, clipPath: `inset(0 ${100 - 100 * k}% 0 0)`, maxWidth: 1500 }}>
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 6, background: col, boxShadow: `0 0 18px ${col}` }} />
      <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: s2, lineHeight: 1.15, color: "#f6f2ea", letterSpacing: -0.5, textAlign: "center", transform: `translateY(${(1 - k) * 14}px)`, filter: `blur(${(1 - k) * 4}px)` }}>{children}</div>
      <div style={{ height: 3, marginTop: 10, width: `${100 * P(f, t0 + 8, 18)}%`, background: `linear-gradient(90deg, ${col}, rgba(255,255,255,0))` }} />
    </div>,
  );
};

// ---------------------------------------------------------------- frases na tela: cada uma com a animação do que ela diz
// (no lugar do texto branco seco; pouco texto, uma ideia por vez). kind:
//  shot    — o texto inteiro aparece; um tiro o racha ao meio e as duas metades descolam
//  glitch  — interferência: o texto se divide em fatias deslocadas e cores separadas, e some falhando
//  strike  — a frase aparece; a palavra `hit` é riscada em vermelho e cai
//  light   — um feixe de luz varre da esquerda e o texto nasce dentro dele (quente, sem caixa)
//  type    — terminal: letra por letra, com cursor
//  quote   — as aspas grandes se desenham, a fala entra em itálico; `who` em baixo
//  tremble — cada letra treme sozinha, frio
//  split   — duas partes (separadas por " | ") vêm uma de cada lado e se encostam no meio
//  rise    — as palavras sobem e se desfazem em partículas para cima (continuar, ascensão)
export const Kin: React.FC<{ kind: "shot" | "glitch" | "strike" | "light" | "type" | "quote" | "tremble" | "split" | "rise"; t0: number; text: string; top?: number; bottom?: number; size?: number; col?: string; hit?: string; who?: string; until?: number }> = ({ kind, t0, text, top, bottom, size = 52, col = "#ffd27a", hit, who, until = 1e9 }) => {
  const f = useCurrentFrame();
  const g = f - t0;
  if (g < 0 || f >= until) return null;
  const out = 1 - P(f, until - 10, 10);
  const base: React.CSSProperties = { fontFamily: FONT, fontWeight: 800, fontSize: size, lineHeight: 1.15, letterSpacing: -0.5, textShadow: "0 6px 30px rgba(0,0,0,0.9)" };
  // o momento da frase: a cena atrás desfoca e escurece, e a frase fica sozinha no centro
  void top; void bottom;
  const foc = P(f, t0 - 4, 10) * out;
  const wrap = (el: React.ReactNode) => (
    <>
      <AbsoluteFill style={{ backdropFilter: `blur(${10 * foc}px) brightness(${1 - 0.55 * foc}) saturate(${1 - 0.4 * foc})`, WebkitBackdropFilter: `blur(${10 * foc}px) brightness(${1 - 0.55 * foc})`, pointerEvents: "none" }} />
      <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 50%, rgba(0,0,0,${0.15 * foc}), rgba(0,0,0,${0.45 * foc}) 80%)`, pointerEvents: "none" }} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", pointerEvents: "none", opacity: out }}>{el}</AbsoluteFill>
    </>
  );
  const words = text.split(" ");
  if (kind === "shot") {
    const hitF = 10;
    const crack = g >= hitF ? P(f, t0 + hitF, 18) : 0;
    const piece = (clip: string, dx: number, dy: number, rot: number) => (
      <div style={{ position: "absolute", inset: 0, clipPath: clip, transform: `translate(${dx * crack}px, ${dy * crack}px) rotate(${rot * crack}deg)`, color: "#f6f2ea", ...base }}>{text}</div>
    );
    return wrap(
      <div style={{ position: "relative", padding: "0 20px", opacity: P(f, t0, 4) }}>
        <div style={{ ...base, visibility: "hidden" }}>{text}</div>
        {piece("polygon(0 0, 54% 0, 47% 100%, 0 100%)", -26, 10, -3)}
        {piece("polygon(54% 0, 100% 0, 100% 100%, 47% 100%)", 24, -6, 2)}
        {g >= hitF && g < hitF + 6 ? <div style={{ position: "absolute", left: "50%", top: "50%", width: 120, height: 120, marginLeft: -60, marginTop: -60, borderRadius: 60, background: "radial-gradient(circle, #fff6d8, rgba(255,210,120,0))" }} /> : null}
        {g >= hitF ? <svg style={{ position: "absolute", left: "50%", top: "50%", overflow: "visible" }} width={1} height={1}>{Array.from({ length: 7 }).map((_, k) => { const a = (k / 7) * Math.PI * 2; return <line key={k} x1={0} y1={0} x2={Math.cos(a) * 70 * P(f, t0 + hitF, 8)} y2={Math.sin(a) * 50 * P(f, t0 + hitF, 8)} stroke="#f6f2ea" strokeWidth={2} />; })}</svg> : null}
      </div>,
    );
  }
  if (kind === "glitch") {
    const live = P(f, t0, 6);
    const n = 6;
    return wrap(
      <div style={{ position: "relative" }}>
        <div style={{ ...base, visibility: "hidden" }}>{text}</div>
        {Array.from({ length: n }).map((_, k) => {
          // falha forte só na entrada; depois assenta legível, com um soluço raro
          const calm = P(f, t0 + 14, 10);
          const burst = 0.4 + 0.6 * (1 - calm) + (rnd(Math.floor(f / 3) * 11) > 0.93 ? 0.6 : 0);
          const jit = rnd(k * 13 + Math.floor(f / 2)) > 0.6 ? (rnd(k + f) - 0.5) * 40 * burst : 0;
          return (
            <div key={k} style={{ position: "absolute", inset: 0, clipPath: `inset(${(k / n) * 100}% 0 ${100 - ((k + 1) / n) * 100}% 0)`, transform: `translateX(${jit}px)` }}>
              <div style={{ position: "absolute", inset: 0, ...base, color: "rgba(255,60,80,0.8)", transform: `translateX(${-4 * burst}px)`, mixBlendMode: "screen", opacity: Math.min(1, burst) }}>{text}</div>
              <div style={{ position: "absolute", inset: 0, ...base, color: "rgba(60,200,255,0.8)", transform: `translateX(${4 * burst}px)`, mixBlendMode: "screen", opacity: Math.min(1, burst) }}>{text}</div>
              <div style={{ position: "absolute", inset: 0, ...base, color: "#f2efe6", opacity: burst > 0.5 && rnd(Math.floor(f / 3) + k) < 0.15 ? 0.2 : live }}>{text}</div>
            </div>
          );
        })}
      </div>,
    );
  }
  if (kind === "strike") {
    return wrap(
      <div style={{ ...base, color: "#f6f2ea", textAlign: "center" }}>
        {words.map((w, k) => {
          const isHit = hit && w.replace(/[.,]/g, "") === hit;
          const kw = P(f, t0 + k * 3, 8);
          const s2 = isHit ? P(f, t0 + 26, 10) : 0;
          const drop = 0;
          return (
            <span key={k} style={{ position: "relative", display: "inline-block", margin: "0 9px", opacity: kw * (1 - 0.6 * drop), color: isHit && s2 > 0.5 ? "rgba(246,242,234,0.55)" : undefined, transform: `translateY(${(1 - kw) * 16 + drop * 40}px) rotate(${drop * 8}deg)` }}>
              {w}
              {isHit ? <span style={{ position: "absolute", left: -4, right: -4, top: "52%", height: 6, background: col, transform: `scaleX(${s2})`, transformOrigin: "0 50%" }} /> : null}
            </span>
          );
        })}
      </div>,
    );
  }
  if (kind === "light") {
    const sweep = P(f, t0, 30);
    return wrap(
      <div style={{ position: "relative", padding: "10px 40px" }}>
        <div style={{ position: "absolute", left: `${-20 + sweep * 120}%`, top: -40, bottom: -40, width: 180, background: `linear-gradient(90deg, rgba(255,240,200,0), ${col}66, rgba(255,240,200,0))`, filter: "blur(10px)" }} />
        <div style={{ ...base, color: "#fff8ec", textShadow: `0 0 30px ${col}aa, 0 6px 30px rgba(0,0,0,0.8)`, clipPath: `inset(0 ${100 - sweep * 100}% 0 0)` }}>{text}</div>
      </div>,
    );
  }
  if (kind === "type") {
    const n = Math.floor(g * 1.4);
    return wrap(
      <div style={{ fontFamily: MONO, fontSize: size * 0.62, letterSpacing: 3, color: col, textShadow: `0 0 18px ${col}88` }}>
        {text.slice(0, Math.max(0, n))}
        <span style={{ opacity: Math.floor(f / 8) % 2 }}>▌</span>
      </div>,
    );
  }
  if (kind === "quote") {
    const q = P(f, t0, 12);
    return wrap(
      <div style={{ position: "relative", maxWidth: 1300, padding: "0 70px", textAlign: "center" }}>
        <div style={{ position: "absolute", left: 0, top: -30, fontFamily: "Georgia, serif", fontSize: 140, color: col, opacity: q, transform: `translateY(${(1 - q) * -30}px)` }}>“</div>
        <div style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: "italic", fontSize: size * 0.9, lineHeight: 1.25, color: "#f6f2ea", textShadow: "0 6px 30px rgba(0,0,0,0.9)", opacity: P(f, t0 + 6, 10), transform: `translateY(${(1 - P(f, t0 + 6, 12)) * 12}px)` }}>{text.replace(/[“”]/g, "")}</div>
        {who ? <div style={{ fontFamily: MONO, fontSize: 16, letterSpacing: 5, color: col, marginTop: 12, opacity: P(f, t0 + 16, 10) }}>— {who}</div> : null}
      </div>,
    );
  }
  if (kind === "tremble") {
    return wrap(
      <div style={{ ...base, color: "#dfefff", textShadow: "0 0 20px rgba(159,230,255,0.5), 0 6px 30px rgba(0,0,0,0.9)" }}>
        {text.split("").map((c, k) => (
          <span key={k} style={{ display: "inline-block", whiteSpace: "pre", opacity: P(f, t0 + k * 0.8, 6), transform: `translate(${(rnd(k * 7 + f) - 0.5) * 4}px, ${(rnd(k * 3 + f * 1.3) - 0.5) * 5}px)` }}>{c}</span>
        ))}
      </div>,
    );
  }
  if (kind === "split") {
    const [a, b] = text.split(" | ");
    const k = P(f, t0, 16);
    return wrap(
      <div style={{ display: "flex", gap: 24, alignItems: "baseline", ...base }}>
        <span style={{ color: "#9fe6ff", transform: `translateX(${(1 - k) * -500}px)`, opacity: k }}>{a}</span>
        <span style={{ color: col, transform: `translateX(${(1 - k) * 500}px)`, opacity: k }}>{b}</span>
      </div>,
    );
  }
  // rise
  return wrap(
    <div style={{ ...base, color: "#fff4dc" }}>
      {words.map((w, k) => {
        const kw = P(f, t0 + k * 4, 14);
        const up = P(f, (until < 1e8 ? until - 30 : t0 + 140) + k * 3, 24);
        return (
          <span key={k} style={{ position: "relative", display: "inline-block", margin: "0 10px", opacity: kw * (1 - up), transform: `translateY(${(1 - kw) * 30 - up * 60}px)`, filter: `blur(${up * 6}px)`, textShadow: `0 0 24px ${col}` }}>
            {w}
            {up > 0 ? Array.from({ length: 6 }).map((_, j) => <span key={j} style={{ position: "absolute", left: `${rnd(j + k * 9) * 100}%`, top: `${-up * 80 - rnd(j * 3 + k) * 40}%`, width: 4, height: 4, borderRadius: 2, background: col }} />) : null}
          </span>
        );
      })}
    </div>,
  );
};
// chamada que aponta para um ponto 3D real: anel no alvo → linha → rótulo (igual à do laboratório da Cave)
export const Call: React.FC<{ e: Eye; f: number; pt: V3; from: number; until?: number; text: string; sub?: string; col: string; dx: number; dy: number }> = ({ e, f, pt, from, until = 1e9, text, sub, col, dx, dy }) => {
  if (f < from || f >= until) return null;
  const q = proj(e, pt);
  if (!q) return null;
  const o = P(f, from, 8) * (1 - P(f, until - 8, 8));
  const k = P(f, from, 12);
  const end = dx >= 0 ? "start" : "end";
  const lx = q.x + dx + (dx >= 0 ? 10 : -10);
  const ly = q.y + dy;
  return (
    <g opacity={o}>
      <circle cx={q.x} cy={q.y} r={10 + 3 * Math.sin(f / 6)} fill="none" stroke={col} strokeWidth={2} />
      <circle cx={q.x} cy={q.y} r={4} fill={col} />
      <line x1={q.x} y1={q.y} x2={q.x + dx * k} y2={q.y + dy * k} stroke={col} strokeWidth={1.6} />
      <text x={lx} y={ly - 6} textAnchor={end} fill={col} fontFamily={MONO} fontSize={22} letterSpacing={4} opacity={k} style={{ paintOrder: "stroke", stroke: "rgba(0,0,0,0.85)", strokeWidth: 5 }}>
        {text}
      </text>
      {sub ? (
        <text x={lx} y={ly + 22} textAnchor={end} fill="rgba(242,240,247,0.8)" fontFamily={MONO} fontSize={15} letterSpacing={2} opacity={k} style={{ paintOrder: "stroke", stroke: "rgba(0,0,0,0.85)", strokeWidth: 4 }}>
          {sub}
        </text>
      ) : null}
    </g>
  );
};

// prende um elemento HTML w×h num retângulo 3D (cantos: sup-esq, sup-dir, inf-dir, inf-esq) com perspectiva
const Pinned: React.FC<{ e: Eye; w: number; h: number; corners: [V3, V3, V3, V3]; o?: number; children: React.ReactNode }> = ({ e, w, h, corners, o = 1, children }) => {
  const q = corners.map((v) => proj(e, v));
  if (q.some((v) => !v || v.d < 0.25) || o <= 0) return null;
  const m = quadMatrix3d(w, h, q.map((v) => [v!.x, v!.y]) as [number, number][]);
  if (!m) return null;
  // 13/10 (o mapa sumia por baixo em alguns quadros): camada própria do navegador, sem recorte de perspectiva
  return <div style={{ position: "absolute", left: 0, top: 0, width: w, height: h, transformOrigin: "0 0", transform: m, opacity: o }}>{children}</div>;
};

// ================================================================================================= 60:31 a rota (sala de comando)
// sala de comando no navio da resistência: um MAPA DE PAPEL em cima da mesa, debaixo da luminária. Os Combine se mexem (setas a
// caneta vermelha) → os arquivos da Mossman em cima do mapa → as coordenadas datilografadas → um barbante vermelho preso do
// arquivo até um alfinete no mapa: a instalação, no caminho a lápis verde da próxima manifestação → "o problema é chegar":
// entre a frota e a instalação, a faixa da tundra hachurada a vermelho → a câmera vai até a janela: lá fora, a tundra à noite,
// holofotes Combine varrendo o gelo, aurora no céu · objetivo do HEV: ATRAVESSAR A TUNDRA.
const MW = 1600;
const MH = 1035;
const MAP_X0 = -1.7;
const MAP_X1 = 1.7;
const MAP_Y0 = 4.15;
const MAP_Y1 = 6.35;
const MAP_Z = 0.905;
const mapPt = (u: number, v: number, z = MAP_Z): V3 => [MAP_X0 + ((MAP_X1 - MAP_X0) * u) / MW, MAP_Y1 - ((MAP_Y1 - MAP_Y0) * v) / MH, z];
const COAST: [number, number][] = [[0, 690], [120, 700], [230, 660], [330, 690], [420, 640], [540, 655], [640, 610], [760, 630], [880, 585], [990, 600], [1110, 560], [1240, 575], [1360, 530], [1480, 545], [1600, 520]];
const SHIP_UV: [number, number] = [470, 300];
const INST_UV: [number, number] = [1080, 330];
const FLEET_UV: [number, number] = [300, 860];
const NEXT: [number, number][] = [SHIP_UV, [640, 280], [820, 300], [960, 318], INST_UV, [1240, 355], [1420, 400]];
const BELT: [number, number][] = [[260, 640], [470, 560], [700, 500], [930, 430], [1120, 400], [1180, 470], [960, 545], [720, 600], [500, 660], [320, 720]];
const pd = (l: [number, number][], close = false) => l.map(([x, y], i) => `${i ? "L" : "M"} ${x} ${y}`).join(" ") + (close ? " Z" : "");

const TableMap: React.FC<{ f: number; moveAt: number; pathAt: number; whereAt: number; probAt: number; beltAt: number }> = ({ f, moveAt, pathAt, whereAt, probAt, beltAt }) => {
  const ink = "#24405e";
  const pencil = (t0: number, d = 30) => ({ pathLength: 1, strokeDasharray: `${P(f, t0, d)} 1` });
  return (
    <svg width={MW} height={MH} viewBox={`0 0 ${MW} ${MH}`}>
      <defs>
        <filter id="m9paper" x="0" y="0" width="1" height="1">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={3} />
          <feColorMatrix values="0 0 0 0 0.35  0 0 0 0 0.3  0 0 0 0 0.2  0 0 0 0.16 0" />
        </filter>
        <radialGradient id="m9lamp" cx="0.5" cy="0.55" r="0.75">
          <stop offset="0" stopColor="rgba(255,240,200,0)" />
          <stop offset="0.7" stopColor="rgba(60,40,10,0.22)" />
          <stop offset="1" stopColor="rgba(30,20,6,0.55)" />
        </radialGradient>
        <pattern id="m9hatch" width="22" height="22" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
          <line x1="0" y1="0" x2="0" y2="22" stroke="rgba(178,34,24,0.75)" strokeWidth="3" />
        </pattern>
      </defs>
      <rect width={MW} height={MH} fill="#d8ccab" />
      <rect width={MW} height={MH} filter="url(#m9paper)" />
      {/* dobras do papel */}
      <line x1={MW / 2} y1={0} x2={MW / 2} y2={MH} stroke="rgba(90,70,40,0.25)" strokeWidth={3} />
      <line x1={0} y1={MH / 2} x2={MW} y2={MH / 2} stroke="rgba(90,70,40,0.2)" strokeWidth={3} />
      {/* grade e o mar */}
      {Array.from({ length: 9 }).map((_, i) => <line key={"g" + i} x1={i * 200} y1={0} x2={i * 200} y2={MH} stroke="rgba(36,64,94,0.18)" strokeWidth={1.5} />)}
      {Array.from({ length: 6 }).map((_, i) => <line key={"h" + i} x1={0} y1={i * 200} x2={MW} y2={i * 200} stroke="rgba(36,64,94,0.18)" strokeWidth={1.5} />)}
      {/* o mar (10/10: a mancha chapada cinza parecia bug): aguada azul que esmaece longe da costa, sombreado de costa e
          ondinhas a caneta — o papel continua aparecendo por baixo */}
      <defs>
        <linearGradient id="m9sea" x1="0" y1="520" x2="0" y2={MH} gradientUnits="userSpaceOnUse">
          {/* 10/10: azul transparente sobre o creme virava cinza — azul-claro de carta náutica, quase opaco */}
          <stop offset="0" stopColor="#a9d0e6" stopOpacity={0.95} />
          <stop offset="0.4" stopColor="#bcdcec" stopOpacity={0.9} />
          <stop offset="1" stopColor="#c8e2ee" stopOpacity={0.88} />
        </linearGradient>
      </defs>
      <path d={`${pd(COAST)} L ${MW} ${MH} L 0 ${MH} Z`} fill="url(#m9sea)" />
      <path d={pd(COAST.map(([x, y]) => [x, y + 10] as [number, number]))} fill="none" stroke="#86b9d8" strokeOpacity={0.8} strokeWidth={22} strokeLinejoin="round" />
      {[24, 52, 86].map((dy, k) => <path key={k} d={pd(COAST.map(([x, y]) => [x, y + dy] as [number, number]))} fill="none" stroke={`rgba(36,64,94,${0.32 - k * 0.07})`} strokeWidth={1.4} strokeDasharray="10 8" />)}
      {Array.from({ length: 16 }).map((_, k) => {
        const x = 80 + ((k * 397) % 1440);
        const y = 790 + ((k * 131) % 200);
        return <path key={"w" + k} d={`M ${x} ${y} q 9 -7 18 0 t 18 0`} fill="none" stroke="rgba(36,64,94,0.3)" strokeWidth={1.6} />;
      })}
      <path d={pd(COAST)} fill="none" stroke={ink} strokeWidth={6} />
      {/* curvas de nível no gelo */}
      {[0, 1, 2, 3].map((k) => (
        <path key={"c" + k} d={`M ${-40} ${520 - k * 90} C 300 ${470 - k * 110}, 700 ${520 - k * 70}, 1000 ${460 - k * 90} S 1500 ${400 - k * 80}, 1680 ${430 - k * 85}`} fill="none" stroke="rgba(36,64,94,0.22)" strokeWidth={1.6} />
      ))}
      <text x={1520} y={980} textAnchor="end" fill="rgba(36,64,94,0.75)" fontFamily="'Courier New', monospace" fontSize={34} letterSpacing={10}>MAR</text>
      <text x={120} y={110} fill="rgba(36,64,94,0.75)" fontFamily="'Courier New', monospace" fontSize={34} letterSpacing={10}>GELO · ÁRTICO</text>
      {/* a frota da resistência (λ a caneta) */}
      <g transform={`translate(${FLEET_UV[0]} ${FLEET_UV[1]})`}>
        {[[-60, 10], [0, 0], [60, 14]].map(([dx, dy], k) => <path key={k} d={`M ${dx - 34} ${dy} L ${dx + 26} ${dy} L ${dx + 36} ${dy - 8} L ${dx + 30} ${dy + 10} L ${dx - 30} ${dy + 10} Z`} fill="none" stroke={ink} strokeWidth={3.5} />)}
        <text x={0} y={-30} textAnchor="middle" fill="#8a5a10" fontFamily="Georgia, serif" fontSize={54} fontWeight={700}>λ</text>
        <text x={0} y={78} textAnchor="middle" fill={ink} fontFamily="'Courier New', monospace" fontSize={42} fontWeight={700} letterSpacing={4}>FROTA</text>
      </g>
      {/* o Borealis (lápis verde) */}
      <g transform={`translate(${SHIP_UV[0]} ${SHIP_UV[1]})`}>
        <circle r={62 + 4 * Math.sin(f / 7)} fill="none" stroke="#2f7a3a" strokeWidth={4} strokeDasharray="14 10" />
        <path d="M -40 0 L 30 0 L 42 -8 L 36 10 L -34 10 Z" fill="rgba(47,122,58,0.2)" stroke="#2f7a3a" strokeWidth={3.5} />
        <text x={0} y={-84} textAnchor="middle" fill="#2f7a3a" fontFamily="'Courier New', monospace" fontSize={44} fontWeight={700} letterSpacing={4}>BOREALIS</text>
      </g>
      {/* os Combine se mexendo (setas a caneta vermelha) */}
      {f >= moveAt
        ? [[1260, 150], [860, 90], [1460, 260]].map(([x, y], k) => {
            const tx = SHIP_UV[0] + 110;
            const ty = SHIP_UV[1] - 40 + k * 30;
            const d = `M ${x} ${y} Q ${(x + tx) / 2} ${Math.min(y, ty) - 60} ${tx} ${ty}`;
            return (
              <g key={k}>
                <path d={d} fill="none" stroke="#b22218" strokeWidth={4} {...pencil(moveAt + k * 5, 26)} />
                <polygon points="0,-9 18,0 0,9" fill="#b22218" transform={`translate(${tx} ${ty}) rotate(${(Math.atan2(ty - Math.min(y, ty) + 60, tx - (x + tx) / 2) * 180) / Math.PI})`} opacity={P(f, moveAt + k * 5 + 22, 4)} />
                <circle cx={x} cy={y} r={14} fill="#b22218" opacity={P(f, moveAt + k * 5, 4)} />
              </g>
            );
          })
        : null}
      {/* o caminho da próxima manifestação (lápis verde, tracejado) */}
      {f >= pathAt ? <path d={pd(NEXT)} fill="none" stroke="#2f7a3a" strokeWidth={5} strokeDasharray="22 14" strokeLinecap="round" opacity={0.9} style={{ clipPath: `inset(0 ${100 - 100 * P(f, pathAt, 40)}% 0 0)` }} /> : null}
      {f >= pathAt + 20 ? <text x={1260} y={330} fill="#2f7a3a" fontFamily="'Courier New', monospace" fontSize={34} fontWeight={700} letterSpacing={3} opacity={P(f, pathAt + 20, 10)}>PRÓXIMA MANIFESTAÇÃO →</text> : null}
      {/* a instalação: um quadradinho a caneta e o círculo em volta quando "é ali" */}
      <g transform={`translate(${INST_UV[0]} ${INST_UV[1]})`} opacity={P(f, pathAt + 10, 10)}>
        <rect x={-26} y={-26} width={52} height={52} fill="rgba(178,34,24,0.15)" stroke="#b22218" strokeWidth={4} />
        <path d="M -12 -12 L 12 -12 L 12 -4 L -4 -4 L -4 4 L 12 4 L 12 12 L -12 12 Z" fill="#b22218" />
        {f >= whereAt ? <circle r={70} fill="none" stroke="#b22218" strokeWidth={5} pathLength={1} strokeDasharray={`${P(f, whereAt, 18)} 1`} transform="rotate(-90)" /> : null}
        {f >= whereAt ? <circle r={84} fill="none" stroke="#b22218" strokeWidth={3} pathLength={1} strokeDasharray={`${P(f, whereAt + 8, 18)} 1`} transform="rotate(-70)" /> : null}
      </g>
      {/* a distância da frota até a instalação */}
      {f >= probAt ? (
        <g opacity={P(f, probAt, 10)}>
          <path d={`M ${FLEET_UV[0] + 40} ${FLEET_UV[1] - 40} L ${INST_UV[0] - 30} ${INST_UV[1] + 34}`} fill="none" stroke="#5a4a2a" strokeWidth={3} strokeDasharray="6 10" />
          <text x={(FLEET_UV[0] + INST_UV[0]) / 2 + 30} y={(FLEET_UV[1] + INST_UV[1]) / 2 + 40} fill="#5a4a2a" fontFamily="'Courier New', monospace" fontSize={42} fontWeight={700}>?</text>
        </g>
      ) : null}
      {/* a faixa da tundra controlada pelos Combine */}
      {f >= beltAt ? (
        <g opacity={P(f, beltAt, 16)}>
          <path d={pd(BELT, true)} fill="url(#m9hatch)" stroke="#b22218" strokeWidth={4} />
          {[[420, 640], [640, 560], [860, 480], [1060, 440], [740, 600]].map(([x, y], k) => (
            <g key={k} transform={`translate(${x} ${y})`} opacity={P(f, beltAt + 8 + k * 3, 6)}>
              <polygon points="0,-20 17,-10 17,10 0,20 -17,10 -17,-10" fill="#e8dcbc" stroke="#b22218" strokeWidth={3.5} />
              <path d="M -7 -8 L 7 -8 L 7 -2 L -2 -2 L -2 2 L 7 2 L 7 8 L -7 8 Z" fill="#b22218" />
            </g>
          ))}
          <text x={600} y={760} fill="#b22218" fontFamily="'Courier New', monospace" fontSize={44} fontWeight={700} letterSpacing={6} transform="rotate(-14 600 760)">TUNDRA · COMBINE</text>
        </g>
      ) : null}
      {/* a luz da luminária: o centro claro, as bordas mais escuras */}
      <rect width={MW} height={MH} fill="url(#m9lamp)" />
    </svg>
  );
};

const hideCeil = (fc: XF) => fc.p.every((q) => q[2] >= 2.9);
const buildWarRoom = (): XF[] => {
  const g = mk();
  // casco de navio: aço escuro esverdeado, piso de chapa, teto com vigas
  g.room(-5, 5, 0, 10, 3.2, [44, 48, 46], [34, 32, 30], [22, 24, 24], [{ side: "N", c: 0, w: 3.6, h: 2.6 }]);
  // peitoril e montantes da janela
  g.box(-1.8, 9.82, 0, 3.6, 0.18, 1.0, [40, 44, 42]);
  g.box(-1.8, 9.82, 2.55, 3.6, 0.18, 0.65, [40, 44, 42]);
  [-1.85, 1.7].forEach((x) => g.box(x, 9.82, 1.0, 0.14, 0.2, 1.6, [30, 32, 32]));
  // vigas do teto e nervuras
  for (let y = 1; y < 10; y += 2.2) g.box(-5, y, 2.95, 10, 0.22, 0.25, [30, 32, 32]);
  for (let y = 0.6; y < 10; y += 1.6) {
    g.box(-5, y, 0, 0.18, 0.16, 3.2, [36, 40, 38]);
    g.box(4.82, y, 0, 0.18, 0.16, 3.2, [36, 40, 38]);
  }
  // a mesa (madeira) e as pernas
  g.box(-1.82, 4.03, 0.82, 3.64, 2.44, 0.08, [128, 96, 64], { tag: "table" });
  [[-1.85, 4.1], [1.75, 4.1], [-1.85, 6.35], [1.75, 6.35]].forEach(([x, y]) => g.box(x, y, 0, 0.1, 0.1, 0.82, [60, 44, 30]));
  // a luminária pendurada
  g.prism(0, 5.25, 2.05, 2.3, 0.42, 10, [60, 64, 60]);
  g.quad([-0.3, 5.0, 2.049], [0.3, 5.0, 2.049], [0.3, 5.5, 2.049], [-0.3, 5.5, 2.049], [255, 230, 180], [0, 0, -1], { emit: 1 });
  g.box(-0.02, 5.23, 2.3, 0.04, 0.04, 0.9, [20, 20, 20]);
  // armários e caixotes nas laterais
  g.box(-4.9, 1.2, 0, 0.7, 2.4, 1.9, [56, 62, 54]);
  g.box(4.2, 7.4, 0, 0.7, 1.8, 2.1, [56, 62, 54]);
  g.box(3.2, 1.0, 0, 1.0, 1.0, 0.8, [84, 66, 40]);
  g.box(3.4, 1.2, 0.8, 0.7, 0.7, 0.6, [80, 62, 38]);
  return g.F;
};

// lá fora pela janela: tundra à noite, aurora, holofotes Combine varrendo o gelo e as luzes de uma base ao longe
const Outside: React.FC<{ e: Eye; f: number; lightsOn: number }> = ({ e, f, lightsOn }) => {
  const hz = proj(e, [0, 400, 0]);
  const H = hz ? hz.y : 540;
  const base = [-40, -28, -16, -6, 6, 18, 30].map((x, i) => ({ q: proj(e, [x, 300 + (i % 3) * 18, 0]), qt: proj(e, [x, 300 + (i % 3) * 18, 4 + (i % 2) * 5]), i }));
  const lamps = [-46, -18, 12, 40].map((x, i) => ({ q: proj(e, [x, 280 + i * 12, 9]), i }));
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, #030914 0%, #0a1c2e ${Math.max(5, (H / 1080) * 100 - 30)}%, #1b3a52 ${(H / 1080) * 100}%, #2b4558 ${(H / 1080) * 100 + 0.3}%, #1a2a36 ${(H / 1080) * 100 + 14}%, #0c141a 100%)` }} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <filter id="m9blur"><feGaussianBlur stdDeviation="22" /></filter>
          <filter id="m9blur2"><feGaussianBlur stdDeviation="6" /></filter>
          <linearGradient id="m9aur" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="rgba(90,255,180,0)" />
            <stop offset="0.55" stopColor="rgba(90,255,180,0.7)" />
            <stop offset="1" stopColor="rgba(60,200,255,0)" />
          </linearGradient>
        </defs>
        {Array.from({ length: 90 }).map((_, i) => <circle key={i} cx={rnd(i) * 1920} cy={rnd(i * 3) * (H - 60)} r={0.7 + rnd(i * 5) * 1.2} fill="#fff" opacity={0.3 + 0.5 * rnd(i * 7)} />)}
        {/* a aurora em cortinas */}
        {[0, 1, 2, 3].map((k) => (
          <path key={k} d={`M -200 ${H - 460 + k * 50} C 300 ${H - 600 + 50 * Math.sin(f / 50 + k)}, 900 ${H - 360 + 40 * Math.sin(f / 40 + k * 2)}, 1400 ${H - 520 + k * 30} S 2100 ${H - 420 + k * 20}, 2300 ${H - 470}`} fill="none" stroke="url(#m9aur)" strokeWidth={160 - k * 30} filter="url(#m9blur)" opacity={0.75 - k * 0.12} />
        ))}
        {Array.from({ length: 26 }).map((_, i) => {
          const x = i * 80 + 20 * Math.sin(f / 30 + i);
          return <line key={"r" + i} x1={x} y1={H - 520 + 60 * Math.sin(i * 0.7 + f / 45)} x2={x + 10} y2={H - 330 + 30 * Math.sin(i)} stroke="rgba(140,255,200,0.12)" strokeWidth={10} filter="url(#m9blur2)" />;
        })}
        {/* relevo do gelo e a planície */}
        <path d={`M 0 ${H + 2} ${Array.from({ length: 25 }).map((_, i) => `L ${i * 80} ${H - 4 - rnd(i + 3) * 30}`).join(" ")} L 1920 ${H + 2} Z`} fill="#18283a" />
        {Array.from({ length: 14 }).map((_, i) => {
          const yy = H + 8 + Math.pow(i / 14, 2) * 600;
          return <line key={"p" + i} x1={0} y1={yy} x2={1920} y2={yy + 6 * Math.sin(i)} stroke="rgba(200,230,255,0.06)" strokeWidth={1 + i * 0.4} />;
        })}
        {/* a base Combine no horizonte: blocos escuros com luzes ciano e vermelhas */}
        {base.map(({ q, qt, i }) =>
          q && qt ? (
            <g key={i}>
              <rect x={q.x - (q.y - qt.y) * 0.6} y={qt.y} width={(q.y - qt.y) * 1.2} height={q.y - qt.y} fill="#081016" stroke="rgba(120,220,255,0.35)" strokeWidth={1} />
              <rect x={q.x - (q.y - qt.y) * 0.4} y={qt.y + (q.y - qt.y) * 0.3} width={(q.y - qt.y) * 0.8} height={2} fill={i % 3 ? "#7fe8ff" : RED} opacity={0.85} style={{ filter: `drop-shadow(0 0 5px ${i % 3 ? "#7fe8ff" : RED})` }} />
            </g>
          ) : null,
        )}
        {(() => {
          const t = proj(e, [4, 330, 0]);
          const tt = proj(e, [4, 330, 34]);
          if (!t || !tt) return null;
          const w = Math.max(6, (t.y - tt.y) * 0.09);
          return (
            <g>
              <path d={`M ${t.x - w} ${t.y} L ${t.x - w * 0.45} ${tt.y + (t.y - tt.y) * 0.18} L ${t.x} ${tt.y} L ${t.x + w * 0.45} ${tt.y + (t.y - tt.y) * 0.18} L ${t.x + w} ${t.y} Z`} fill="#060a0e" stroke="rgba(120,220,255,0.45)" strokeWidth={1.2} />
              <circle cx={t.x} cy={tt.y + 4} r={4} fill={RED} opacity={0.4 + 0.6 * (Math.sin(f / 6) > 0 ? 1 : 0)} style={{ filter: "drop-shadow(0 0 8px #ff5d4d)" }} />
            </g>
          );
        })()}
        {/* holofotes varrendo o gelo */}
        {lamps.map(({ q, i }) => {
          if (!q) return null;
          const sx = q.x + 420 * Math.sin(f / 36 + i * 1.9);
          return (
            <g key={"l" + i} opacity={lightsOn}>
              <path d={`M ${q.x} ${q.y} L ${sx - 90} ${1080} L ${sx + 90} ${1080} Z`} fill="rgba(200,245,255,0.1)" />
              <ellipse cx={sx} cy={H + 120} rx={110} ry={22} fill="rgba(220,250,255,0.14)" filter="url(#m9blur2)" />
              <circle cx={q.x} cy={q.y} r={4} fill="#e8fbff" style={{ filter: "drop-shadow(0 0 10px #9fe6ff)" }} />
            </g>
          );
        })}
        {/* neve caindo lá fora */}
        {Array.from({ length: 120 }).map((_, i) => {
          const x = (rnd(i * 13) * 2200 + f * (1.2 + rnd(i) * 1.5)) % 2200 - 140;
          const y = (rnd(i * 17) * 1200 + f * (2.2 + rnd(i * 3) * 2.5)) % 1200 - 60;
          return <circle key={"s" + i} cx={x} cy={y} r={0.8 + rnd(i * 5) * 1.6} fill="#e8f4ff" opacity={0.35 + 0.35 * rnd(i * 9)} />;
        })}
      </svg>
    </AbsoluteFill>
  );
};

export const HL9WarTable: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [moveAt, knowAt, coordAt, pathAt, whereAt, hereAt, probAt, beltAt, actionAt] = ats(p, ["moveAt", "knowAt", "coordAt", "pathAt", "whereAt", "hereAt", "probAt", "beltAt", "actionAt"]);
  const G = useMemo(() => buildWarRoom(), []);
  const win = IOx((f - actionAt) / 50);
  const yaw = keys(f, [[0, -0.04], [coordAt - 6, -0.02], [coordAt + 14, 0.2], [pathAt - 4, 0.2], [pathAt + 18, 0.04], [probAt, 0.0], [actionAt, 0.0], [actionAt + 50, 0.02]]);
  // 09/10 (pedido dele): a câmera mais de cima — o mapa estava de lado demais
  const pitch = keys(f, [[0, -0.86], [coordAt + 14, -0.98], [pathAt + 18, -0.9], [probAt + 20, -0.94], [actionAt, -0.94], [actionAt + 50, 0.06]]);
  const y = keys(f, [[0, 2.75], [moveAt + 40, 3.05], [coordAt + 14, 3.2], [probAt, 3.15], [probAt + 30, 2.75], [actionAt, 2.75], [actionAt + 55, 7.6]]);
  const z = keys(f, [[0, 3.0], [probAt + 30, 3.25], [actionAt, 3.25], [actionAt + 55, 1.6]]);
  const e: Eye = { x: 0.03 * Math.sin(f / 60), y, z: z + 0.015 * Math.sin(f / 11), yaw, pitch, F: 1250 };
  const sway = 0;
  const live = G;
  const lights: XL[] = [
    { x: sway, y: 5.25, z: 1.95, col: [255, 226, 170], k: 1.0, r: 3.6 },
    { x: 0, y: 9.4, z: 1.8, col: [130, 210, 255], k: 0.35, r: 5 },
  ];
  const fileC: [V3, V3, V3, V3] = [[0.5, 4.86, 0.915], [1.6, 4.92, 0.915], [1.64, 4.2, 0.915], [0.54, 4.14, 0.915]];
  const filePin: V3 = [1.2, 4.62, 0.92];
  const instPin = mapPt(INST_UV[0], INST_UV[1], 0.93);
  const fileIn = P(f, knowAt, 14);
  const typed = (s: string, t0: number) => s.slice(0, Math.max(0, Math.floor((f - t0) * 0.9)));
  // o barbante: do alfinete do arquivo até o alfinete da instalação, esticado logo acima da mesa
  const str = f >= coordAt + 26 ? P(f, coordAt + 26, 24) : 0;
  const strA = proj(e, filePin);
  const strB = proj(e, [filePin[0] + (instPin[0] - filePin[0]) * str, filePin[1] + (instPin[1] - filePin[1]) * str, 0.935]);
  const pinHead = (pt: V3, col: string) => {
    const q = proj(e, pt);
    const top = proj(e, [pt[0], pt[1], pt[2] + 0.07]);
    if (!q || !top) return null;
    return (
      <g>
        <line x1={q.x} y1={q.y} x2={top.x} y2={top.y} stroke="#cfcfcf" strokeWidth={1.6} />
        <circle cx={top.x} cy={top.y} r={Math.max(3, 34 / top.d)} fill={col} stroke="rgba(0,0,0,0.5)" strokeWidth={1} />
      </g>
    );
  };
  return (
    <AbsoluteFill style={{ background: "#040505", overflow: "hidden" }}>
      <Outside e={e} f={f} lightsOn={0.6 + 0.4 * win} />
      {/* 06/11 (ele: as sombras piscam quando a câmera mexe): a lanterna da câmera (flash) era calculada só nos cantos de
          placas enormes (mesa, piso) e acendia/apagava a placa inteira a cada movimento. Sala iluminada pela luminária: sem lanterna. */}
      {/* 07/11 (a causa de verdade do "pisca"): a câmera sobe até z≈3,25 e o teto da sala está em 3,2 (vigas 2,95–3,2). Ela
          atravessava o teto e as vigas, que entravam e saíam da frente da mesa com o balanço. Enquanto ela está lá em cima olhando
          para a mesa, o teto e as vigas (tudo acima de 2,9 m) não são desenhados; na ida até a janela, embaixo, voltam. */}
      <XView e={e} faces={live} lights={lights} flash={0} amb={0.2} seam="rgba(0,0,0,0.35)" hide={e.z > 2.6 ? hideCeil : undefined} />
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <Pinned e={e} w={MW} h={MH} corners={[mapPt(0, 0), mapPt(MW, 0), mapPt(MW, MH), mapPt(0, MH)]}>
          <TableMap f={f} moveAt={moveAt} pathAt={pathAt} whereAt={whereAt} probAt={probAt} beltAt={beltAt} />
        </Pinned>
        {f >= knowAt ? (
          <Pinned
            e={e}
            w={440}
            h={300}
            o={fileIn}
            corners={fileC.map((v) => [v[0] + (1 - fileIn) * 0.6, v[1] - (1 - fileIn) * 0.4, v[2]] as V3) as [V3, V3, V3, V3]}
          >
            <div style={{ width: 440, height: 300, background: "#efe6cf", boxShadow: "0 18px 30px rgba(0,0,0,0.55)", padding: "22px 26px", boxSizing: "border-box", fontFamily: "'Courier New', monospace", color: "#2a2418" }}>
              <div style={{ fontSize: 15, letterSpacing: 3, borderBottom: "2px solid #2a2418", paddingBottom: 6 }}>ARQUIVOS · J. MOSSMAN · BOREALIS</div>
              {[0, 1, 2].map((k) => <div key={k} style={{ height: 8, marginTop: 14, width: `${88 - k * 14}%`, background: "rgba(42,36,24,0.25)" }} />)}
              <div style={{ marginTop: 22, fontSize: 30, fontWeight: 700, letterSpacing: 2, color: "#7a1810", minHeight: 40 }}>{typed("78°14'N · 15°38'E", coordAt)}</div>
              <div style={{ fontSize: 14, letterSpacing: 2, marginTop: 6, opacity: P(f, coordAt + 18, 8) }}>INSTALAÇÃO COMBINE · SETOR DA TUNDRA</div>
              <div style={{ position: "absolute", right: 22, bottom: 20, padding: "4px 10px", border: "3px solid rgba(160,30,20,0.8)", color: "rgba(160,30,20,0.85)", fontSize: 16, letterSpacing: 4, transform: "rotate(-8deg)", opacity: P(f, coordAt + 10, 6) }}>CONFIDENCIAL</div>
            </div>
          </Pinned>
        ) : null}
      </div>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {str > 0 && strA && strB ? (
          <g>
            <line x1={strA.x + 3} y1={strA.y + 5} x2={strB.x + 3} y2={strB.y + 5} stroke="rgba(0,0,0,0.35)" strokeWidth={3} />
            <line x1={strA.x} y1={strA.y} x2={strB.x} y2={strB.y} stroke="#c0281c" strokeWidth={2.6} />
          </g>
        ) : null}
        {f >= coordAt + 20 ? pinHead(filePin, "#d6332a") : null}
        {str > 0.98 ? pinHead(instPin, "#d6332a") : null}
        <Call e={e} f={f} pt={instPin} from={hereAt} until={actionAt} text="INSTALAÇÃO COMBINE" sub="O QUE OS ADVISORS FAZEM COM O CATALISADOR" col={RED} dx={230} dy={-90} />
        <Call e={e} f={f} pt={mapPt(FLEET_UV[0], FLEET_UV[1], 0.93)} from={probAt + 6} until={actionAt} text="A FROTA" sub="O PROBLEMA É CHEGAR" col={AMB} dx={150} dy={150} />
      </svg>
      {/* objetivo do HEV quando a câmera chega à janela */}
      {f >= actionAt + 34 ? (
        <div style={{ position: "absolute", left: 110, top: 150, padding: "14px 22px", background: "rgba(10,8,2,0.72)", border: `1.5px solid ${AMB}`, borderRadius: 10, fontFamily: MONO, color: AMB, opacity: P(f, actionAt + 34, 10) }}>
          <div style={{ fontSize: 15, letterSpacing: 5, opacity: 0.8 }}>NOVO OBJETIVO</div>
          <div style={{ fontSize: 28, letterSpacing: 3, marginTop: 6 }}>ATRAVESSAR A TUNDRA</div>
          <div style={{ fontSize: 16, letterSpacing: 3, marginTop: 6, color: CREAM }}>ATÉ A INSTALAÇÃO COMBINE</div>
        </div>
      ) : null}
      <Hud f={f} yaw={e.yaw} eye={e} blips={[{ x: 1.2, y: 5.3, hot: f >= hereAt && f < actionAt }]} msg={f < moveAt + 50 ? "NAVIO DA RESISTÊNCIA · SALA DE COMANDO" : f >= moveAt && f < knowAt + 20 ? "RÁDIO · BOREALIS REAPARECEU · COMBINE EM MOVIMENTO" : undefined} msgCol={f >= moveAt ? RED : AMB} />
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};
const IOx = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
void ICE;
void GREEN;
void TXT;
void FONT;
export type { RGB };

// ================================================================================================= 61:02 o comboio
// 1) footage (The Closure, cutscene sem HUD): o blindado na neve → o caminhão visto de trás → a coluna na nevasca; os crachás
//    de quem está na coluna entram numa faixa embaixo, cada um na sua palavra (sem apontar para ninguém no vídeo).
// 2) "no começo é quase uma corrida" → corte para o POV dentro do buggy, na nevasca: caminhões à frente com as lanternas,
//    neblina na distância → gunships passam baixo com holofote e rajada → Hunters nos flancos → Striders ao longe → a coluna
//    abandona a rota principal (curva) → o gelo parte embaixo dos caminhões (rachaduras e água preta) com o tranco.
const SKY_STARS = Array.from({ length: 110 }).map((_, i) => [rnd(i * 3 + 1) * 1920, rnd(i * 7 + 2), 0.6 + rnd(i * 11) * 1.4, 0.3 + 0.5 * rnd(i * 13)]);
const NightSky: React.FC<{ e: Eye; f: number }> = ({ e, f }) => {
  const hz = proj(e, [0, 900, 0]);
  const H = hz ? hz.y : 540;
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, #03080f 0%, #0c1c2a ${Math.max(5, (H / 1080) * 100 - 30)}%, #2a4052 ${(H / 1080) * 100}%, #3a4e5c ${(H / 1080) * 100 + 0.2}%, #24323c 100%)` }} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <filter id="c9blur"><feGaussianBlur stdDeviation="26" /></filter>
          <linearGradient id="c9aur" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="rgba(90,255,180,0)" />
            <stop offset="0.55" stopColor="rgba(90,255,180,0.45)" />
            <stop offset="1" stopColor="rgba(60,200,255,0)" />
          </linearGradient>
        </defs>
        {SKY_STARS.map(([x, y, r, o], i) => <circle key={i} cx={(x - e.yaw * 900 + 3840) % 1920} cy={y * (H - 40)} r={r} fill="#fff" opacity={o * 0.6} />)}
        {[0, 1].map((k) => (
          <path key={k} d={`M -300 ${H - 420 + k * 60} C 300 ${H - 540 + 50 * Math.sin(f / 50 + k)}, 900 ${H - 330 + 40 * Math.sin(f / 40 + k * 2)}, 1400 ${H - 480 + k * 30} S 2100 ${H - 400}, 2400 ${H - 450}`} fill="none" stroke="url(#c9aur)" strokeWidth={150 - k * 40} filter="url(#c9blur)" opacity={0.6 - k * 0.2} transform={`translate(${-e.yaw * 900} 0)`} />
        ))}
        <path d={`M -100 ${H + 2} ${Array.from({ length: 30 }).map((_, i) => `L ${i * 75 - 100} ${H - 3 - rnd(i + 9) * 26}`).join(" ")} L 2100 ${H + 2} Z`} fill="#2a3a46" transform={`translate(${-e.yaw * 500} 0)`} />
      </svg>
    </AbsoluteFill>
  );
};
// a bandeira (crachá) presa num ponto 3D, com a haste até ele
export const FlagAt: React.FC<{ e: Eye; pt: V3; label: string; col: string; f: number; o?: number; sub?: string }> = ({ e, pt, label, col, f, o = 1, sub }) => {
  const b = proj(e, pt);
  const t = proj(e, [pt[0], pt[1], pt[2] + 1.6]);
  if (!b || !t || o <= 0) return null;
  if (occluded(e, [pt[0], pt[1], pt[2] + 1.9]) && occluded(e, [pt[0], pt[1], pt[2] + 0.9])) return null;
  const k = Math.max(0.7, Math.min(1.2, 9 / b.d));
  const sb = stemBase(e, pt[0], pt[1], pt[2], 1.6);
  const b2 = sb.hidden ? proj(e, [pt[0], pt[1], sb.z]) ?? b : b;
  return (
    <g opacity={o}>
      {/* 30/10 (ele: uns tinham o círculo na base e outros não): todo marcador tem o mesmo anel tracejado no chão */}
      {sb.hidden ? null : <ellipse cx={b.x} cy={b.y} rx={26 * Math.max(0.5, Math.min(2, 6 / b.d))} ry={7 * Math.max(0.5, Math.min(2, 6 / b.d))} fill="none" stroke={col} strokeWidth={1.6} strokeDasharray="5 4" strokeDashoffset={-f} />}
      <line x1={b2.x} y1={b2.y} x2={t.x} y2={t.y} stroke={col} strokeWidth={2} />
      {sb.hidden ? null : <circle cx={b.x} cy={b.y} r={4} fill={col} />}
      <FlagBadge cx={t.x} by={t.y} k={k} label={label} col={col} f={f} sub={sub} />
    </g>
  );
};
const GS_YAW = Math.PI; // o nariz do modelo aponta para −z
// 12/10: o gunship de perfil (nariz para a esquerda) — corpo de inseto segmentado, a cabeça com o olho azul, o canhão
// na barriga, as asinhas, a cauda com o rotor vertical, o rotor de cima borrado; inclina com o vento
// 13/10 (pedido dele: o gunship não tinha nada a ver com o de Half-Life): o gunship do HL2 de perfil — corpo longo e
// orgânico de casca branca em placas (como um camarão), o bulbo do nariz com o canhão de pulso fino apontando para a
// frente, a barriga aberta com a maquinaria ciano acesa, o "olho" sensor roxo-azulado no flanco, as duas nadadeiras
// finas penduradas e, atrás, a cauda que se curva num laço oval com o rotor girando dentro (não há rotor em cima)
const GunshipSide: React.FC<{ x: number; y: number; s: number; bank: number; f: number }> = ({ x, y, s, bank, f }) => {
  const rot = (f * 41) % 360;
  const blade = (a: number) => {
    const r = (a * Math.PI) / 180;
    return <line key={a} x1={4.6 + Math.cos(r) * 0.12} y1={-0.2 + Math.sin(r) * 0.95} x2={4.6 - Math.cos(r) * 0.12} y2={-0.2 - Math.sin(r) * 0.95} stroke="rgba(40,46,52,0.55)" strokeWidth={0.09} />;
  };
  const shell = "#9aa29a", shellD = "#6a726c", line = "#3a423e"; // a casca branca no escuro da nevasca
  return (
    <g transform={`translate(${x} ${y}) rotate(${bank}) scale(${s / 1})`}>
      <g style={{ filter: "drop-shadow(0 0.2px 0.6px rgba(0,0,0,0.6))" }}>
        {/* a cauda em laço com o rotor dentro */}
        <path d="M 2.6 -0.55 C 3.4 -1.4, 5.2 -1.6, 5.7 -0.6 C 6.1 0.3, 5.3 1.15, 4.4 1.05 C 3.6 0.95, 3.2 0.4, 3.0 0.15" fill="none" stroke={shell} strokeWidth={0.42} strokeLinecap="round" />
        <path d="M 2.6 -0.55 C 3.4 -1.4, 5.2 -1.6, 5.7 -0.6 C 6.1 0.3, 5.3 1.15, 4.4 1.05" fill="none" stroke={shellD} strokeWidth={0.1} />
        <ellipse cx={4.6} cy={-0.2} rx={0.85} ry={1.0} fill="rgba(200,215,225,0.22)" />
        {[0, 60, 120].map((k) => blade(rot + k))}
        <circle cx={4.6} cy={-0.2} r={0.16} fill="#3a4246" />
        {/* espinhos da ponta da cauda */}
        <path d="M 5.8 -0.7 L 6.5 -1.0 M 5.7 0.4 L 6.3 0.7" stroke={shellD} strokeWidth={0.06} />
        {/* o corpo: casca branca em placas */}
        <path d="M -4.9 0.05 C -4.9 -0.7, -3.8 -1.05, -2.2 -1.0 C -0.4 -0.95, 1.6 -0.85, 2.9 -0.45 C 3.3 -0.2, 3.3 0.15, 2.9 0.3 C 1.6 0.7, -0.4 0.85, -2.2 0.85 C -3.8 0.85, -4.9 0.65, -4.9 0.05 Z" fill={shell} stroke={line} strokeWidth={0.05} />
        {[-3.6, -2.7, -1.8, -0.9, 0, 0.9, 1.8, 2.5].map((t, i) => <path key={i} d={`M ${t} ${-0.98 + Math.abs(t) * 0.04} C ${t + 0.22} -0.4, ${t + 0.22} 0.3, ${t} ${0.82 - Math.abs(t) * 0.05}`} fill="none" stroke={shellD} strokeWidth={0.05} />)}
        {/* sombra da barriga */}
        <path d="M -4.4 0.45 C -2.6 0.8, 0.8 0.75, 2.8 0.3" fill="none" stroke="rgba(80,90,88,0.5)" strokeWidth={0.22} strokeLinecap="round" />
        {/* a barriga aberta: maquinaria ciano acesa */}
        <path d="M -2.6 0.55 C -1.6 0.95, 0.4 0.95, 1.2 0.6 L 1.0 0.32 C 0.2 0.55, -1.4 0.55, -2.4 0.3 Z" fill="#0f2a30" />
        {[-2.2, -1.7, -1.2, -0.7, -0.2, 0.3, 0.8].map((t, i) => <rect key={i} x={t} y={0.42} width={0.28} height={0.22} rx={0.04} fill={i % 2 ? "#5fe6f0" : "#2fb8cc"} opacity={0.85 + 0.15 * Math.sin(f / 5 + i)} />)}
        <path d="M -2.4 0.36 C -1.4 0.6, 0.2 0.6, 1.0 0.36" fill="none" stroke="#9ff6ff" strokeWidth={0.04} style={{ filter: "drop-shadow(0 0 0.15px #5fe6f0)" }} />
        {/* o sensor roxo-azulado no flanco */}
        <ellipse cx={0.6} cy={-0.3} rx={0.42} ry={0.32} fill="#3a3270" stroke="#2a224a" strokeWidth={0.05} />
        <ellipse cx={0.5} cy={-0.38} rx={0.16} ry={0.1} fill="rgba(200,190,255,0.6)" />
        {/* as nadadeiras finas penduradas */}
        <path d="M -1.2 0.75 C -1.3 1.3, -1.1 1.8, -0.9 2.0 L -0.75 1.95 C -0.9 1.6, -0.95 1.2, -0.85 0.8 Z" fill={shell} stroke={line} strokeWidth={0.03} />
        <path d="M 0.9 0.7 C 0.85 1.2, 1.05 1.55, 1.2 1.7 L 1.32 1.62 C 1.2 1.3, 1.15 1.0, 1.2 0.68 Z" fill={shellD} stroke={line} strokeWidth={0.03} />
        <path d="M -0.95 1.95 L -1.1 2.4 M 1.25 1.65 L 1.2 2.05" stroke="#2a3030" strokeWidth={0.04} />
        {/* o bulbo do nariz e o canhão de pulso */}
        <ellipse cx={-4.85} cy={0.08} rx={0.5} ry={0.48} fill="#c8cbbf" stroke={line} strokeWidth={0.05} />
        <path d="M -5.2 0.25 L -7.2 0.75" stroke="#14181a" strokeWidth={0.1} strokeLinecap="round" />
        <path d="M -5.0 0.2 L -5.4 0.3" stroke="#3a4044" strokeWidth={0.22} />
        {/* brilho de cima */}
        <path d="M -3.8 -0.88 C -2 -1.02, 0.4 -0.95, 2.2 -0.68" fill="none" stroke="rgba(220,235,240,0.4)" strokeWidth={0.1} strokeLinecap="round" />
      </g>
    </g>
  );
};
// os Striders no mundo (x, distância à frente quando aparecem): o comboio passa por eles até o fim da cena
const HUNT_W: [number, number][] = [[-7.5, 14], [8, 18], [-11, 25]];
const STRID_W: [number, number][] = [[-50, 520], [60, 580], [-72, 640]];
const STRID_V = 0.3;
const STRID_FACE = 0;
const CVCLIP = "videos/hl3_M01_R/clips/f_convoy_hq.mp4";
export const HL9Convoy: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [buggyAt, dogAt, barneyAt, vargaAt, raceAt, gunAt, flankAt, stridAt, offAt, crackAt] = ats(p, ["buggyAt", "dogAt", "barneyAt", "vargaAt", "raceAt", "gunAt", "flankAt", "stridAt", "offAt", "crackAt"]);
  // 08/10 (pedido dele: só footage canônica — a nevasca era do The Closure): POV no buggy desde o começo
  const pov = true;
  const lf = f * 0.7;
  // velocidade (m/quadro) e distância percorrida
  const v = 0.7 + 0.25 * P(f, raceAt + 10, 50);
  const distOf = (l: number) => l * 0.7 + Math.max(0, l - 10) * 0.25 * Math.min(1, Math.max(0, l - 10) / 50) * 0.5;
  const dist = distOf(lf);
  const turn = IOx((f - offAt) / 60);
  const jolt = f >= crackAt ? Math.sin(f * 2.1) * 0.014 * (1 - P(f, crackAt + 50, 30)) : 0;
  const shake = jolt + (f >= gunAt && f < gunAt + 40 ? Math.sin(f * 2.7) * 0.006 : 0);
  const bump = 0.012 * Math.sin(f * 0.9) + 0.006 * Math.sin(f * 2.3);
  const yaw = 0.05 * Math.sin(f / 70) + turn * 0.3 + shake;
  const e: Eye = { x: 0, y: 0, z: 1.35 + bump, yaw, pitch: -0.03 + shake * 0.6, F: 1050 };
  const g = mk();
  const trucks = [
    { x: -3.2, y: 13 },
    { x: 1.6, y: 23 },
    { x: -1.4, y: 34 },
    { x: 2.4, y: 46 },
  ].map((t, i) => ({ x: t.x + Math.sin(f / 40 + i * 1.3) * 0.4 + turn * (2 + i * 2.4), y: t.y + Math.sin(f / 55 + i) * 0.7 - P(f, raceAt + 10, 60) * i * 1.4, w: 2.3, d: 5.2, h: 2.4 }));
  if (pov) {
    // o chão: neve em placas pequenas, quase uniformes, rolando; sulcos; montinhos de neve e pedras
    const T = 4;
    const off = dist % T;
    for (let iy = 0; iy < 26; iy++)
      for (let ix = -10; ix < 10; ix++) {
        const y0 = iy * T - off;
        const x0 = ix * T;
        const n = rnd(ix * 31 + (iy + Math.floor(dist / T)) * 17);
        const k = 0.94 + n * 0.08;
        g.quad([x0, y0, 0], [x0 + T, y0, 0], [x0 + T, y0 + T, 0], [x0, y0 + T, 0], [150 * k, 166 * k, 180 * k], [0, 0, 1], { tag: "ice" });
      }
    for (let iy = 0; iy < 26; iy++) {
      const y0 = iy * T - off;
      [-1.0, 0.8].forEach((x) => g.quad([x, y0, 0.01], [x + 0.26, y0, 0.01], [x + 0.26, y0 + T, 0.01], [x, y0 + T, 0.01], [96, 110, 122], [0, 0, 1]));
    }
    for (let k = 0; k < 26; k++) {
      const base = Math.floor(dist / 6);
      const id = base + k;
      const y = id * 6 - dist + 6;
      const x = (rnd(id * 13) - 0.5) * 50;
      if (Math.abs(x) < 4) continue;
      const big = rnd(id * 7) > 0.75;
      if (big) g.prism(x, y, 0, 0.5 + rnd(id * 3) * 0.9, 0.7 + rnd(id) * 0.8, 5, [34, 38, 42], undefined, rnd(id * 7));
      else g.prism(x, y, 0, 0.18 + rnd(id * 5) * 0.25, 1.4 + rnd(id * 9), 7, [120, 134, 148]);
    }
    // a coluna: cabine na frente + carroceria com lona; lanternas acesas atrás
    trucks.forEach((t) => {
      g.box(t.x, t.y, 0.55, t.w, t.d - 1.6, 1.85, [30, 33, 30]);
      g.box(t.x + 0.05, t.y + 0.15, 2.4, t.w - 0.1, t.d - 1.9, 0.5, [52, 52, 44]);
      g.box(t.x + 0.15, t.y + t.d - 1.6, 0.55, t.w - 0.3, 1.6, 1.5, [36, 40, 36]);
      g.box(t.x - 0.05, t.y - 0.18, 0.42, t.w + 0.1, 0.18, 0.16, [18, 18, 18]);
      [t.w / 2 - 0.03].forEach((dx) => g.quad([t.x + dx, t.y - 0.012, 0.6], [t.x + dx + 0.06, t.y - 0.012, 0.6], [t.x + dx + 0.06, t.y - 0.012, 2.35], [t.x + dx, t.y - 0.012, 2.35], [14, 15, 14], [0, -1, 0]));
      [0.35, 1.2, 2.05].forEach((dy) => g.box(t.x + 0.02, t.y + 0.15 + dy, 2.4, t.w - 0.04, 0.08, 0.56, [34, 34, 28]));
      [0.2, t.w - 0.5].forEach((dx) => g.quad([t.x + dx, t.y - 0.01, 0.75], [t.x + dx + 0.3, t.y - 0.01, 0.75], [t.x + dx + 0.3, t.y - 0.01, 0.98], [t.x + dx, t.y - 0.01, 0.98], [255, 60, 40], [0, -1, 0], { emit: 1 }));
      [[0.15, 0.4], [t.w - 0.55, 0.4], [0.15, t.d - 1.2], [t.w - 0.55, t.d - 1.2]].forEach(([dx, dy]) => g.box(t.x + dx, t.y + dy, 0, 0.4, 0.8, 0.6, [16, 16, 16]));
    });
  }
  const lights: XL[] = [
    { x: 0, y: 5, z: 1.0, col: [255, 236, 200], k: 0.55, r: 12 },
    ...trucks.map((t) => ({ x: t.x + t.w / 2, y: t.y - 0.6, z: 0.9, col: [255, 70, 50] as RGB, k: 0.35, r: 5 })),
  ];
  // 06/11 (ele: o comboio não deixa os gunships e os striders para trás): eles ficam PARADOS no mundo, à frente; o
  // comboio avança e passa por eles, que somem para trás. Posição relativa = posição no mundo − o quanto o buggy andou.
  const distAt = (fr: number) => distOf(Math.max(0, fr) * 0.7);
  const gunships = [0, 1].map((k) => {
    const t0 = gunAt + k * 16;
    const t = (f - t0) / 85;
    if (t < 0) return null;
    const yRel = [46, 58][k] - (dist - distAt(t0));
    if (yRel < -2) return null;
    const drop = 1 - P(f, t0, 30);
    return { c: [[-13, 15][k] + Math.sin(f / 23 + k) * 0.8, yRel, [10, 12.5][k] + drop * 8 + Math.sin(f / 17 + k) * 0.4] as V3, t, k };
  });
  gunships.forEach((gs) => gs && lights.push({ x: gs.c[0] - 2, y: gs.c[1] - 8, z: 0.6, col: [220, 245, 255], k: 0.9, r: 9 }));
  // 12/10 (pedido dele: gunships 2D horrorosos): o gunship 3D (public/hl3models/gunship.glb) na mesma cena com
  // profundidade, voando baixo para a esquerda, com leve balanço; o holofote, as rajadas e o rótulo continuam por cima
  // 12/10 (ele: o 3D não funcionou) → de volta ao 2D, refeito (GunshipSide)
  const GS: THREE.Group[] = [];
  void useGLB;
  const gsExtras: THREE.Object3D[] = [];
  gunships.forEach((gs, i) => {
    if (!gs || !GS[i]) return;
    placeGLB(GS[i], gs.c, [gs.c[0] - 10, gs.c[1] + 0.8, gs.c[2] - 0.8], GS_YAW, 0.12 * Math.sin(f / 18 + i), -0.08);
    gsExtras.push(GS[i]);
  });
  const RSs = useRealStriders(3, 52);
  const stExtras: THREE.Object3D[] = [];
  // 07/11 (ele: os striders aparecem do nada, já grandes, e piscam): eles existem desde o começo da cena, a ~500–640 m,
  // minúsculos na nevasca, e vêm andando NA DIREÇÃO do comboio (0,3 m/quadro) — vão crescendo até passarem ao lado.
  const stridY = (y: number) => y - dist - STRID_V * f;
  STRID_W.forEach(([x, y], i) => {
      const R = RSs[i];
      if (!R) return;
      const yRel = stridY(y);
      if (yRel < -30) return;
      R.root.position.set(x, 0, -yRel);
      R.root.rotation.y = STRID_FACE;
      R.root.visible = true;
      R.set("walk", f / 30 + i * 1.3);
      R.root.updateMatrixWorld(true);
      stExtras.push(R.root);
    });
  // 06/11 (pedido dele): os Hunters do Episode Two em 3D (public/hl3models/hunter_ep2.glb, extraído do jogo com o
  // SourceIO), galopando com a animação do próprio jogo (canterN) ao lado da coluna; quando o buggy acelera, ficam para trás.
  const HUN = useHla("hunter_ep2.glb", 3, 2.9, { run: "@canterN", walk: "@walkN" });
  // 07/11: na nevasca à noite eles saíam pretos — mais luz própria pela textura
  useMemo(() => HUN.forEach((A) => A.root.traverse((o) => {
    const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
    if (m && "emissiveIntensity" in m && m.map) { m.emissiveIntensity = 1.1; m.needsUpdate = true; }
  })), [HUN]);
  const hunExtras: THREE.Object3D[] = [];
  const hunPos = HUNT_W.map(([x, y], k) => {
    const t0 = flankAt + k * 6;
    const come = P(f, t0, 40);
    const back = Math.pow(Math.max(0, f - offAt) / 30, 2) * 6;
    return { k, t0, x: x + Math.sin(f / 9 + k) * 0.4 + turn * 2.5, y: y - 14 * (1 - come) - back, o: P(f, t0, 10) };
  });
  if (f >= flankAt)
    hunPos.forEach((h) => {
      const A = HUN[h.k];
      if (!A || f < h.t0 || h.y < -4) return;
      A.root.position.set(h.x, 0, -h.y);
      A.root.rotation.y = Math.PI / 2 + Math.sin(f / 13 + h.k) * 0.08;
      A.set("run", (f - h.t0) / 30 + h.k * 0.31);
      A.root.updateMatrixWorld(true);
      hunExtras.push(A.root);
    });
  const gsLights = useMemo(() => {
    const d = new THREE.DirectionalLight("#dfeaff", 2.4);
    d.position.set(-20, 40, 10);
    return [new THREE.HemisphereLight("#cfe0ff", "#1c2228", 1.4), d];
  }, []);
  const snow = Array.from({ length: 220 }).map((_, i) => {
    const sp = (rnd(i * 5) * 34 + dist * (1.1 + rnd(i) * 0.5) + lf * 0.1) % 34;
    const yy = 34 - sp + 0.6;
    const xx = (rnd(i * 7) - 0.5) * 22 + Math.sin(f / 9 + i) * 0.3;
    const zz = rnd(i * 11) * 6;
    return { a: proj(e, [xx, yy, zz]), b: proj(e, [xx + 0.25, yy + 0.5 + v * 1.4, zz + 0.05]), i };
  });
  const drifts = pov
    ? Array.from({ length: 90 }).map((_, i) => {
        const L0 = 70;
        const yy = ((rnd(i * 3) * L0 - dist) % L0 + L0) % L0 + 0.8;
        const xx = (rnd(i * 7) - 0.5) * 34;
        const ln = 1.5 + rnd(i * 11) * 4;
        return { a: proj(e, [xx, yy, 0.02]), b: proj(e, [xx + 0.1, yy + ln, 0.02]), w: 0.03 + rnd(i * 13) * 0.06, i };
      })
    : [];
  const hz = proj(e, [0, 600, 0]);
  const H = hz ? hz.y : 540;
  const crack = P(f, crackAt, 40);
  // rachaduras no gelo (polilinhas no chão) e a água preta abrindo
  const cracks: { pts: V3[]; w: number }[] = [];
  if (f >= crackAt)
    for (let k = 0; k < 14; k++) {
      // as de perto nascem uma atrás da outra à frente e vêm na direção do buggy; as outras, embaixo dos caminhões
      const near = k < 9;
      const born = crackAt + (near ? k * 7 : 0);
      if (f < born) continue;
      const t0 = trucks[k % 3];
      let x = near ? (k - 2) * 1.6 + (rnd(k) - 0.5) : t0.x + t0.w / 2 + (rnd(k) - 0.5) * 1.5;
      let y = near ? 16 + rnd(k * 3) * 6 : t0.y + 1 + rnd(k * 3) * 2;
      const slide = dist - distOf(Math.max(0, born - raceAt));
      y -= slide * (near ? 1 : 0.35);
      const pts: V3[] = [[x, y, 0.02]];
      const ang = near ? Math.PI / 2 + (rnd(k * 5) - 0.5) * 1.4 : (k % 2 ? 0.2 : Math.PI - 0.2) + (rnd(k * 5) - 0.5) * 0.6;
      for (let st = 0; st < 14; st++) {
        x += Math.cos(ang + (rnd(k * 9 + st) - 0.5) * 1.5) * (near ? 0.9 : 0.6);
        y += Math.sin(ang + (rnd(k * 11 + st) - 0.5) * 1.5) * (near ? 0.9 : 0.6);
        pts.push([x, y, 0.02]);
      }
      cracks.push({ pts: pts.slice(0, 1 + Math.round(P(f, born + (near ? 0 : 8), 24) * 14)), w: near ? 0.035 : 0.025 });
    }
  const flank = P(f, flankAt, 14);
  const roster: [number, string, string][] = [[buggyAt, "GORDON", "BUGGY"], [dogAt, "DOG", "POR FORA"], [barneyAt, "BARNEY", "PRIMEIROS VEÍCULOS"], [vargaAt, "VARGA", "RETAGUARDA"]];
  return (
    <AbsoluteFill style={{ background: "#050a10", overflow: "hidden" }}>
      {!pov ? (
        <AbsoluteFill>
          {[
            [0, barneyAt, 13.2],
            [barneyAt, vargaAt, 46.0],
            [vargaAt, raceAt + 2, 60.0],
          ].map(([a, b, from], i) => (
            <Sequence key={i} from={Math.round(a)} durationInFrames={Math.max(1, Math.round(b - a))} premountFor={20}>
              <AbsoluteFill style={{ transform: `scale(${1.02 + 0.03 * ((f - a) / Math.max(1, b - a))})`, filter: "saturate(0.8) contrast(1.08) brightness(0.95)" }}>
                <Clip src={CVCLIP} from={from} />
              </AbsoluteFill>
            </Sequence>
          ))}
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
            <rect x={0} y={860} width={1920} height={220} fill="url(#c9fade)" />
            <defs>
              <linearGradient id="c9fade" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="rgba(0,0,0,0)" />
                <stop offset="1" stopColor="rgba(0,0,0,0.75)" />
              </linearGradient>
            </defs>
            {roster.map(([t0, n, sub], i) =>
              f >= t0 ? (
                <g key={n} opacity={P(f, t0, 8)} transform={`translate(0 ${(1 - P(f, t0, 10)) * 30})`}>
                  <FlagBadge cx={190 + i * 250} by={1000} k={0.95} label={n} col={AMB} f={f} />
                  <text x={190 + i * 250} y={1030} textAnchor="middle" fill="rgba(242,240,247,0.85)" fontFamily={MONO} fontSize={15} letterSpacing={3}>{sub}</text>
                </g>
              ) : null,
            )}
          </svg>
          <div style={{ position: "absolute", left: 110, top: 90, fontFamily: MONO, color: AMB, fontSize: 18, letterSpacing: 6, opacity: P(f, 4, 10) }}>A COLUNA · TUNDRA</div>
        </AbsoluteFill>
      ) : (
        <AbsoluteFill>
          <NightSky e={e} f={f} />
          {/* 12/10: os Striders do jogo (Half-Life: Alyx), andando na nevasca ao longe */}
          {!RSs.length
            ? STRID_W.map(([x, y], k) => (
                <SilhouetteAt key={"st" + k} e={e} x={x} y={stridY(y)} h={[50, 56, 64][k]} src="hl3silh/strider_peca.png" ar={439 / 640} f={f} o={0.9} rim="rgba(150,220,255,0.3)" top="#16222c" bot="#0a1016" />
              ))
            : null}
          <XView e={e} faces={g.F} lights={lights} flash={0.35} amb={0.2} seam="rgba(0,0,0,0)" extras={[...gsExtras, ...stExtras, ...hunExtras]} glLights={stExtras.length || gsExtras.length || hunExtras.length ? gsLights : []} />
          {/* neblina da nevasca: clareia e engole a distância, perto do horizonte */}
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, rgba(70,90,106,0) ${Math.max(0, (H / 1080) * 100 - 16)}%, rgba(70,90,106,0.55) ${(H / 1080) * 100}%, rgba(70,90,106,0.18) ${(H / 1080) * 100 + 9}%, rgba(70,90,106,0) ${(H / 1080) * 100 + 22}%)` }} />
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            {drifts.map(({ a, b, w, i }) => (a && b ? <line key={"d" + i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="rgba(215,232,248,0.16)" strokeWidth={Math.max(1, (w * 1050) / a.d)} strokeLinecap="round" /> : null))}
            {cracks.map((c, k) => {
              const q = c.pts.map((pt) => proj(e, pt)).filter((x): x is NonNullable<typeof x> => !!x);
              if (q.length < 2) return null;
              const d = q.map((c2, i) => `${i ? "L" : "M"} ${c2.x.toFixed(1)} ${c2.y.toFixed(1)}`).join(" ");
              const wpx = Math.max(1.2, (c.w * 1050) / q[0].d);
              // água preta abrindo nas rachaduras de perto (faixa que alarga em volta do traço)
              const water = k % 3 === 0 && c.pts.length > 4 ? (() => {
                const hw = 0.3 * P(f, crackAt + 10 + k * 7, 30);
                const L = c.pts.slice(0, 6).map((pt) => proj(e, [pt[0] - hw, pt[1], 0.015]));
                const R = c.pts.slice(0, 6).map((pt) => proj(e, [pt[0] + hw, pt[1], 0.015])).reverse();
                const all = [...L, ...R];
                return all.every((v) => v) ? all.map((v) => `${v!.x},${v!.y}`).join(" ") : null;
              })() : null;
              return (
                <g key={k}>
                  {water ? <polygon points={water} fill="#04080c" stroke="rgba(190,225,255,0.45)" strokeWidth={1.2} /> : null}
                  <path d={d} fill="none" stroke="#06090c" strokeWidth={wpx} strokeLinejoin="miter" />
                  <path d={d} fill="none" stroke="rgba(205,235,255,0.55)" strokeWidth={1} transform="translate(1 -1)" />
                  {q.slice(2).filter((_, i) => i % 3 === 0).map((v, i) => (
                    <line key={i} x1={v.x} y1={v.y} x2={v.x + (rnd(k * 31 + i) - 0.5) * 60} y2={v.y + (rnd(k * 17 + i) - 0.3) * 18} stroke="#06090c" strokeWidth={Math.max(1, wpx * 0.6)} />
                  ))}
                </g>
              );
            })}
            {snow.map(({ a, b, i }) => (a && b ? <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="rgba(235,245,255,0.7)" strokeWidth={Math.max(1, 4 / a.d)} strokeLinecap="round" /> : null))}
            {gunships.map((gs) => {
              if (!gs) return null;
              const q = proj(e, gs.c);
              if (!q) return null;
              const s = 1000 / q.d;
              const gnd = proj(e, [gs.c[0] - 2, gs.c[1] - 8, 0]);
              const firing = gnd && f >= gunAt + 10 && gs.t > 0.15 && gs.t < 0.8;
              const bank = 6 * Math.sin(f / 21 + gs.k) - 4;
              const muzzle = { x: q.x - s * 3.4, y: q.y + s * 1.0 };
              return (
                <g key={gs.k}>
                  {/* o holofote varrendo o gelo */}
                  <defs>
                    <linearGradient id={`gsCone${gs.k}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="rgba(225,245,255,0.42)" /><stop offset="0.5" stopColor="rgba(215,242,255,0.14)" /><stop offset="1" stopColor="rgba(215,242,255,0.04)" /></linearGradient>
                    <radialGradient id={`gsPool${gs.k}`}><stop offset="0" stopColor="rgba(240,250,255,0.55)" /><stop offset="0.6" stopColor="rgba(225,245,255,0.18)" /><stop offset="1" stopColor="rgba(225,245,255,0)" /></radialGradient>
                  </defs>
                  {gnd ? <path d={`M ${q.x - s * 4.3} ${q.y + s * 0.3} L ${gnd.x - 120} ${gnd.y + 26} L ${gnd.x + 100} ${gnd.y + 26} Z`} fill={`url(#gsCone${gs.k})`} style={{ mixBlendMode: "screen" }} /> : null}
                  {gnd ? <ellipse cx={gnd.x - 10} cy={gnd.y + 26} rx={170} ry={34} fill={`url(#gsPool${gs.k})`} style={{ mixBlendMode: "screen" }} /> : null}
                  {/* as rajadas: projéteis curtos correndo do canhão ao chão e os impactos levantando neve */}
                  {firing && gnd
                    ? [0, 1, 2, 3, 4].map((r) => {
                        const ph = ((f - gunAt) * 0.22 + r * 0.2) % 1;
                        const tx = gnd.x - 90 + ((r * 47) % 160), ty = gnd.y + 22 + ((r * 13) % 18);
                        const ax = muzzle.x + (tx - muzzle.x) * ph, ay = muzzle.y + (ty - muzzle.y) * ph;
                        const bx = muzzle.x + (tx - muzzle.x) * Math.min(1, ph + 0.08), by = muzzle.y + (ty - muzzle.y) * Math.min(1, ph + 0.08);
                        const hit = ph > 0.86;
                        return (
                          <g key={r}>
                            <line x1={ax} y1={ay} x2={bx} y2={by} stroke="#bfe9ff" strokeWidth={3} strokeLinecap="round" style={{ filter: "drop-shadow(0 0 5px #8fd8ff)" }} />
                            {hit ? <ellipse cx={tx} cy={ty} rx={10 + 30 * (ph - 0.86) * 7} ry={4 + 10 * (ph - 0.86) * 7} fill="rgba(240,248,255,0.55)" /> : null}
                          </g>
                        );
                      })
                    : null}
                  {firing && (f - gunAt) % 4 < 2 ? <circle cx={muzzle.x} cy={muzzle.y} r={Math.max(4, s * 0.45)} fill="#e6f6ff" style={{ filter: "drop-shadow(0 0 10px #9fe6ff)" }} /> : null}
                  <GunshipSide x={q.x} y={q.y} s={s} bank={bank} f={f + gs.k * 7} />
                  {gs.k === 0 && gs.t > 0.12 && gs.t < 0.85 ? (
                    <text x={q.x} y={q.y - s * 2.4} textAnchor="middle" fill={RED} fontFamily={MONO} fontSize={22} letterSpacing={5} style={{ paintOrder: "stroke", stroke: "#000", strokeWidth: 5 }}>
                      GUNSHIP
                    </text>
                  ) : null}
                </g>
              );
            })}
            <FlagAt e={e} pt={[trucks[1].x + 1.15, trucks[1].y + 1, trucks[1].h + 0.6]} label="BARNEY" col={AMB} f={f} o={1 - P(f, gunAt, 12)} />
            {f >= crackAt ? (
              <text x={960} y={260} textAnchor="middle" fill={RED} fontFamily={MONO} fontSize={28} letterSpacing={8} opacity={P(f, crackAt + 6, 8)} style={{ paintOrder: "stroke", stroke: "#000", strokeWidth: 5 }}>
                O GELO ESTÁ PARTINDO
              </text>
            ) : null}
          </svg>
          {f >= flankAt && HUN.length ? (
            <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
              {hunPos.slice(0, 2).map((h) => {
                const q = h.y > 1 ? proj(e, [h.x, h.y, 3.4]) : null;
                return q && f >= h.t0 ? <text key={h.k} x={q.x} y={q.y} textAnchor="middle" fill={RED} fontFamily={MONO} fontSize={18} letterSpacing={4} opacity={h.o * (1 - P(f, offAt + 20, 15))} style={{ paintOrder: "stroke", stroke: "#000", strokeWidth: 4 }}>HUNTER</text> : null;
              })}
            </svg>
          ) : null}
          {f >= flankAt && !HUN.length
            ? [[-8.5, 15, 1], [9, 19, -1], [-12, 27, 1]].map(([x, y, s], k) => (
                <SilhouetteAt key={"h" + k} e={e} x={x + Math.sin(f / 9 + k) * 0.4 + turn * 2.5} y={y - P(f, flankAt + k * 6, 40) * 3} h={2.9} src="hl3silh/hunter_peca.png" ar={480 / 512} f={f} o={flank * (1 - P(f, offAt + 30, 20))} flip={s < 0} rim="rgba(120,200,255,0.6)" top="#1c2632" bot="#06090c" eye={[s > 0 ? 0.62 : 0.38, 0.27, "#9fe6ff"]} bob={Math.abs(Math.sin(f / 3.5 + k)) * -6} label={k < 2 ? "HUNTER" : undefined} labelCol={RED} />
              ))
            : null}
          {/* o buggy: santantônio, painel e o velocímetro */}
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none", transform: `translate(${shake * 400}px, ${bump * 120}px)` }}>
            <defs>
              <linearGradient id="c9tube" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#0c0c0c" />
                <stop offset="0.45" stopColor="#4a4a46" />
                <stop offset="1" stopColor="#141414" />
              </linearGradient>
            </defs>
            <path d="M 120 1080 L 330 -40" stroke="#0a0a0a" strokeWidth={64} />
            <path d="M 120 1080 L 330 -40" stroke="url(#c9tube)" strokeWidth={48} />
            <path d="M 1800 1080 L 1590 -40" stroke="#0a0a0a" strokeWidth={64} />
            <path d="M 1800 1080 L 1590 -40" stroke="url(#c9tube)" strokeWidth={48} />
            <path d="M -20 22 Q 960 -14 1940 22" stroke="#0a0a0a" strokeWidth={56} fill="none" />
            <path d="M -40 1000 Q 960 900 1960 1000 L 1960 1100 L -40 1100 Z" fill="#141210" />
            <path d="M -40 1000 Q 960 900 1960 1000" fill="none" stroke="#3a3530" strokeWidth={6} />
            <g transform="translate(960 1000)">
              <circle r={70} fill="#0c0b0a" stroke="#4a443c" strokeWidth={4} />
              {Array.from({ length: 11 }).map((_, i) => <line key={i} x1={0} y1={-60} x2={0} y2={-50} stroke="#d8cfb8" strokeWidth={2} transform={`rotate(${-120 + i * 24})`} />)}
              <line x1={0} y1={0} x2={0} y2={-52} stroke={ORANGE} strokeWidth={4} transform={`rotate(${-120 + 240 * Math.min(1, v / 1.0) + Math.sin(f / 3) * 3})`} />
              <text y={30} textAnchor="middle" fill="#d8cfb8" fontFamily={MONO} fontSize={18}>{Math.round(v * 30 * 3.6)} KM/H</text>
            </g>
          </svg>
          {/* o retrovisor: a retaguarda (Varga) */}
          <div style={{ position: "absolute", left: 960 - 190, top: 66, width: 380, height: 118, borderRadius: 16, overflow: "hidden", border: "6px solid #0c0c0c", background: "linear-gradient(180deg,#0a1a28,#1e3040 55%,#33444e)", boxShadow: "0 8px 20px rgba(0,0,0,0.6)" }}>
            {[0, 1, 2].map((k) => (
              <div key={k} style={{ position: "absolute", left: 80 + k * 90 + Math.sin(f / 30 + k) * 8, top: 62 - k * 6, display: "flex", gap: 14 - k * 3 }}>
                {[0, 1].map((j) => <div key={j} style={{ width: 12 - k * 3, height: 8 - k * 2, borderRadius: 4, background: "#fff6d8", boxShadow: "0 0 14px 4px rgba(255,240,190,0.7)" }} />)}
              </div>
            ))}
            <div style={{ position: "absolute", left: 10, top: 8, fontFamily: MONO, fontSize: 13, letterSpacing: 3, color: AMB }}>RETAGUARDA · VARGA</div>
          </div>
          <Hud
            f={f}
            yaw={e.yaw}
            eye={e}
            blips={[...trucks.map((t) => ({ x: t.x + 1, y: t.y })), ...(f >= flankAt ? [{ x: -8.5, y: 15, hot: true }, { x: 9, y: 19, hot: true }] : [])]}
            msg={f >= offAt ? "ROTA PRINCIPAL ✕ · DESVIO PELO GELO FINO" : f < gunAt ? "QUASE UMA CORRIDA" : undefined}
            msgCol={f >= offAt ? RED : AMB}
          />
          {/* o corte de entrada no POV: clarão de neve */}
          <AbsoluteFill style={{ background: "#dfeaf2", opacity: Math.max(0, 1 - lf / 7) * 0.8, pointerEvents: "none" }} />
        </AbsoluteFill>
      )}
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life), pointerEvents: "none" }} />
      {f < raceAt + 40 ? (
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: 1 - P(f, raceAt + 20, 20) }}>
          {roster.map(([t0, n, sub], i) =>
            f >= t0 ? (
              <g key={n} opacity={P(f, t0, 8)} transform={`translate(0 ${(1 - P(f, t0, 10)) * 30})`}>
                <FlagBadge cx={240 + i * 170} by={880} k={0.8} label={n} col={AMB} f={f} />
                <text x={240 + i * 170} y={906} textAnchor="middle" fill="rgba(242,240,247,0.85)" fontFamily={MONO} fontSize={13} letterSpacing={2} style={{ paintOrder: "stroke", stroke: "#000", strokeWidth: 4 }}>{sub}</text>
              </g>
            ) : null,
          )}
          <text x={170} y={730} fill={AMB} fontFamily={MONO} fontSize={16} letterSpacing={5} opacity={P(f, 4, 10)}>A COLUNA · TUNDRA</text>
        </svg>
      ) : null}
      <FilmLook />
    </AbsoluteFill>
  );
};

// ================================================================================================= 58:00 o Kleiner e os arquivos
// footage real (só a tomada do Kleiner, 0,58×) com chamadas RASTREADAS no vídeo (Kleiner na testa · os arquivos na tela do
// computador) → em "até aqui a gente já sabe" a câmera mergulha na tela rastreada e o arquivo aberto toma o quadro: "OS COMBINE
// ESTÃO TRABALHANDO NO BOREALIS" é digitado e recebe o carimbo CONFIRMADO; "O QUE ELES QUEREM ALCANÇAR" fica embaralhado,
// ainda criptografado · MAIS ADIANTE.
type Trk = [number, number, number][];
const trkAt = (tr: Trk, ts: number): [number, number] => {
  let j = 0;
  while (j < tr.length - 2 && tr[j + 1][0] < ts) j++;
  const [t0, x0, y0] = tr[j];
  const [t1, x1, y1] = tr[Math.min(tr.length - 1, j + 1)];
  const u = t1 > t0 ? Math.max(0, Math.min(1, (ts - t0) / (t1 - t0))) : 0;
  return [x0 + (x1 - x0) * u, y0 + (y1 - y0) * u];
};
// 08/10 (pedido dele: só footage canônica — o clipe do Kleiner era render SFM de canal de lore): o laboratório em POV
const buildMossFilesLab = (): XF[] => {
  const g = mk();
  g.room(-4, 4, 0, 8, 3.0, [92, 84, 70], [60, 54, 46], [40, 38, 34], [], 2);
  g.box(-1.6, 5.4, 0, 3.2, 1.0, 0.78, [96, 74, 52]); // a mesa
  g.box(-0.55, 5.6, 0.78, 1.1, 0.75, 0.75, [180, 176, 160]); // o monitor CRT
  g.quad([-0.45, 5.58, 0.86], [0.45, 5.58, 0.86], [0.45, 5.58, 1.46], [-0.45, 5.58, 1.46], [90, 255, 140], [0, -1, 0], { emit: 0.55, tag: "crt" });
  g.box(-0.5, 5.2, 0.78, 1.0, 0.3, 0.04, [60, 58, 52]); // teclado
  for (let k = 0; k < 3; k++) g.box(-3.9, 1.2 + k * 2.1, 0, 0.6, 1.8, 2.2, [70, 62, 50]); // estantes
  for (let k = 0; k < 9; k++) g.box(-3.32, 1.3 + (k % 3) * 2.1 + rnd(k) * 0.6, 0.6 + Math.floor(k / 3) * 0.6, 0.02, 0.3 + rnd(k * 3) * 0.4, 0.4, [140 + rnd(k) * 60, 90, 60]);
  g.box(2.6, 4.6, 0, 1.2, 2.4, 1.0, [84, 88, 90]); // bancada
  for (let k = 0; k < 4; k++) g.box(2.7 + k * 0.25, 4.9, 1.0, 0.12, 0.12, 0.3, [120, 200, 230], { emit: 0.3 });
  g.box(-0.2, 3.6, 2.96, 0.4, 0.4, 0.04, [255, 230, 180], { emit: 0.9 }); // lâmpada
  return g.F;
};
const GLY = "▓▒░█▚▞◆◇■□";
const scramble = (s: string, f: number, seed: number) => s.split("").map((c, i) => (c === " " ? " " : GLY[Math.floor(rnd(i * 7 + seed + Math.floor(f / 3)) * GLY.length)])).join("");
export const HL7KleinerFiles: React.FC<PR & { ktrk?: Trk; mtrk?: Trk; from?: number; rate?: number }> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [savedAt, knowAt, workAt, boreAt, aheadAt, findAt, reachAt] = ats(p, ["savedAt", "knowAt", "workAt", "boreAt", "aheadAt", "findAt", "reachAt"]);
  const ktrk = p.ktrk ?? [[0, 580, 144]];
  const mtrk = p.mtrk ?? [[0, 1264, 580]];
  const from = p.from ?? 1.27;
  const rate = p.rate ?? 0.58;
  const ts = f / 30;
  const push = 1 + 0.03 * Math.min(1, f / Math.max(1, knowAt));
  const zt = knowAt - 16;
  const zoom = IOx((f - zt) / 20);
  const [mx0, my0] = trkAt(mtrk, Math.min(ts, zt / 30));
  const mx = 960 + (mx0 - 960) * push;
  const my = 540 + (my0 - 540) * push;
  const sc = push * (1 + 7 * zoom);
  const crt = P(f, knowAt - 6, 10);
  const LAB = useMemo(() => buildMossFilesLab(), []);
  const lab: Eye = { x: 0.15 * Math.sin(f / 60) * (1 - zoom), y: keys(f, [[0, 1.0], [zt, 3.6], [zt + 20, 5.2]]), z: keys(f, [[0, 1.6], [zt, 1.5], [zt + 20, 1.16]]), yaw: keys(f, [[0, 0.12], [zt, 0.02], [zt + 20, 0]]), pitch: keys(f, [[0, -0.1], [zt, -0.08], [zt + 20, 0]]), F: 960 };
  const marks = [
    { trk: ktrk, oy: -48, at: 6, text: "KLEINER", sub: undefined as string | undefined, col: ICE, dx: -240, dy: 30 },
    { trk: mtrk, oy: 0, at: 11, text: "ARQUIVOS DA MOSSMAN", sub: "PARTE ABERTA", col: ORANGE, dx: 216, dy: -150 },
  ];
  const typed = (s: string, t0: number, cps = 1.1) => s.slice(0, Math.max(0, Math.floor((f - t0) * cps)));
  const L1 = "OS COMBINE ESTÃO TRABALHANDO NO BOREALIS";
  const L2 = "O QUE ELES QUEREM ALCANÇAR";
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      {crt < 1 ? (
        <AbsoluteFill style={{ filter: `brightness(${1 + zoom * 0.4}) blur(${zoom * 2}px)` }}>
          <XView e={lab} faces={LAB} lights={[{ x: -0.2, y: 3.6, z: 2.8, col: [255, 226, 180], k: 0.6, r: 8 }, { x: 0, y: 5.3, z: 1.2, col: [90, 255, 140], k: 0.35, r: 3 }]} flash={0.4} amb={0.14} />
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: 1 - P(f, zt, 8) }}>
            <XMarker e={lab} x={1.1} y={4.9} label="KLEINER" col={ICE} f={f} o={P(f, 6, 10)} sub={f >= savedAt ? "ABRIU PARTE DOS ARQUIVOS" : undefined} />
            {(() => {
              const q = proj(lab, [0, 5.58, 1.16]);
              if (!q || f < 11) return null;
              const k = P(f, 11, 10);
              return (
                <g opacity={k}>
                  <circle cx={q.x} cy={q.y} r={18} fill="none" stroke={ORANGE} strokeWidth={2.5} />
                  <line x1={q.x - 14} y1={q.y - 12} x2={q.x - 200} y2={q.y - 150} stroke={ORANGE} strokeWidth={2} />
                  <text x={q.x - 210} y={q.y - 158} textAnchor="end" fill={ORANGE} fontFamily={MONO} fontSize={20} letterSpacing={4} style={{ paintOrder: "stroke", stroke: "#000", strokeWidth: 5 }}>ARQUIVOS DA MOSSMAN</text>
                  <text x={q.x - 210} y={q.y - 134} textAnchor="end" fill="rgba(242,240,247,0.8)" fontFamily={MONO} fontSize={15} letterSpacing={3} style={{ paintOrder: "stroke", stroke: "#000", strokeWidth: 4 }}>PARTE ABERTA</text>
                </g>
              );
            })()}
          </svg>
        </AbsoluteFill>
      ) : null}
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(8,16,24,0.35) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 65%, rgba(4,6,10,0.75) 100%)", opacity: 1 - crt, pointerEvents: "none" }} />
      {/* as chamadas rastreadas (somem no mergulho) */}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: 0 }}>
        {[].map((m: (typeof marks)[number], i: number) => {
          if (f < m.at) return null;
          const [vx, vy] = trkAt(m.trk, ts);
          const x = 960 + (vx - 960) * push;
          const y = 540 + (vy + m.oy - 540) * push;
          let lx = x + m.dx;
          if (lx > 1640) lx = x - Math.abs(m.dx);
          if (lx < 140) lx = x + Math.abs(m.dx);
          const ly = Math.max(120, Math.min(860, y + m.dy));
          const k = P(f, m.at, 10);
          const left = lx < x;
          return (
            <g key={i} opacity={k}>
              <circle cx={x} cy={y} r={16 * (1.4 - 0.4 * k)} fill="none" stroke={m.col} strokeWidth={2.5} />
              <circle cx={x} cy={y} r={4} fill={m.col} />
              <polyline points={`${x},${y} ${x + (lx - x) * 0.55},${ly} ${lx},${ly}`} fill="none" stroke={m.col} strokeWidth={2} />
              <text x={lx + (left ? -10 : 10)} y={ly - 8} textAnchor={left ? "end" : "start"} fill={m.col} fontFamily={MONO} fontSize={20} letterSpacing={4} style={{ paintOrder: "stroke", stroke: "rgba(0,0,0,0.85)", strokeWidth: 5 }}>
                {m.text}
              </text>
              {m.sub ? (
                <text x={lx + (left ? -10 : 10)} y={ly + 16} textAnchor={left ? "end" : "start"} fill="rgba(242,240,247,0.8)" fontFamily={MONO} fontSize={15} letterSpacing={3} style={{ paintOrder: "stroke", stroke: "rgba(0,0,0,0.85)", strokeWidth: 4 }}>
                  {m.sub}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
      {/* a tela do computador: o arquivo aberto */}
      {crt > 0 ? (
        <AbsoluteFill style={{ opacity: crt, background: "radial-gradient(ellipse at 50% 50%, #0b1a12 0%, #050c08 70%, #020403 100%)" }}>
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
            {Array.from({ length: 270 }).map((_, i) => <rect key={i} x={0} y={i * 4} width={1920} height={1.4} fill="rgba(0,0,0,0.28)" />)}
          </svg>
          <div style={{ position: "absolute", left: 200, top: 250, right: 200, fontFamily: "'Courier New', monospace", color: "#7dff9a", textShadow: "0 0 8px rgba(125,255,154,0.55)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22, letterSpacing: 4, opacity: 0.85 }}>
              <span>BLACK MESA EAST · TERMINAL 2</span>
              <span>ARQUIVOS · DRA. J. MOSSMAN</span>
            </div>
            <div style={{ height: 2, background: "rgba(125,255,154,0.5)", margin: "14px 0 24px" }} />
            <div style={{ fontSize: 22, letterSpacing: 3, opacity: 0.9 }}>DESCRIPTOGRAFADO</div>
            <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 10 }}>
              <div style={{ flex: 1, height: 22, border: "2px solid rgba(125,255,154,0.7)", padding: 3 }}>
                <div style={{ height: "100%", width: `${38 * P(f, knowAt, 30)}%`, background: "repeating-linear-gradient(90deg, #7dff9a 0 14px, transparent 14px 18px)" }} />
              </div>
              <div style={{ fontSize: 26, width: 90, textAlign: "right" }}>{Math.round(38 * P(f, knowAt, 30))}%</div>
            </div>
            {/* o que já se sabe */}
            <div style={{ marginTop: 64, fontSize: 46, letterSpacing: 2, position: "relative", minHeight: 56 }}>
              <span style={{ opacity: 0.7 }}>{f >= workAt - 20 ? "> " : ""}</span>
              {typed(L1, workAt - 20, 1.3)}
              {f >= workAt - 20 && f < boreAt && Math.floor(f / 8) % 2 ? <span>▌</span> : null}
              {f >= boreAt ? (
                <span style={{ position: "absolute", right: 0, top: -14, padding: "6px 16px", border: "4px solid #7dff9a", fontSize: 28, letterSpacing: 6, transform: `rotate(-6deg) scale(${1.6 - 0.6 * P(f, boreAt, 6)})`, opacity: P(f, boreAt, 6) }}>CONFIRMADO ✓</span>
              ) : null}
            </div>
            {/* o que ainda falta: o objetivo embaralhado */}
            {f >= aheadAt - 6 ? (
              <div style={{ marginTop: 50, opacity: P(f, aheadAt - 6, 8) }}>
                <div style={{ fontSize: 46, letterSpacing: 2 }}>
                  <span style={{ opacity: 0.7 }}>{"> "}</span>
                  {L2}
                  <span style={{ color: "#ffd27a", textShadow: "0 0 12px rgba(255,210,122,0.8)", opacity: f >= reachAt ? 1 : 0.0 }}>{" ?"}</span>
                </div>
                <div style={{ marginTop: 14, fontSize: 40, letterSpacing: 6, color: "rgba(125,255,154,0.55)" }}>{scramble("PROJETO ████ · OBJETIVO ██████████", f, f >= findAt ? 3 : 1)}</div>
                <div style={{ marginTop: 18, display: "inline-block", padding: "6px 14px", border: "2px solid rgba(255,210,122,0.8)", color: "#ffd27a", fontSize: 22, letterSpacing: 5, textShadow: "none" }}>AINDA CRIPTOGRAFADO · MAIS ADIANTE</div>
              </div>
            ) : null}
          </div>
          {/* vinheta da tela de tubo */}
          <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.75) 100%)", pointerEvents: "none" }} />
        </AbsoluteFill>
      ) : null}
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 64, background: "#000", opacity: 1 - crt }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 64, background: "#000", opacity: 1 - crt }} />
      {f >= savedAt && f < knowAt - 10 ? (
        <div style={{ position: "absolute", left: 140, right: 140, bottom: 140, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 50, color: TXT, textShadow: "0 8px 40px rgba(0,0,0,0.9)", opacity: P(f, savedAt, 8) * (1 - P(f, knowAt - 18, 8)) }}>
          os arquivos que a Mossman morreu tentando salvar
        </div>
      ) : null}
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life, 6), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ================================================================================================= 55:56 o vazamento (POV)
// um corredor do Borealis: SINCRONIA estável → cai (luzes piscam) → no chão, a FERIDA brilha embaixo do navio; na parede, as
// marcas dos Vortigaunts apontando para ela → o anteparo do fundo racha e Xen (o mesmo da queda) aparece pela rachadura, partículas
// entram → um console Combine: "[E] IR PARA XEN" riscado (não existe esse botão) → a varredura do HEV marca a RUPTURA → dois
// emissores Combine prendem as bordas com feixes: MANTEVE ABERTA · a Alyx ali → a câmera vira para ela: o que ela sabe × o que mostra.
const LEAK_Y = 18;
const RIFT: [number, number][] = [[-0.2, 0.25], [0.35, 0.1], [0.6, 0.55], [0.95, 0.75], [0.7, 1.25], [1.05, 1.7], [0.55, 2.15], [0.1, 1.95], [-0.45, 2.25], [-0.8, 1.7], [-1.05, 1.15], [-0.7, 0.8], [-0.95, 0.35]];
const FISSURE: [number, number][] = [[0.3, 6.5], [-0.2, 8.0], [0.4, 9.4], [-0.3, 11.0], [0.25, 12.6], [-0.15, 14.2], [0.35, 15.8], [0.0, 17.6]];
export const HL7Leak: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [syncAt, woundAt, vortAt, leakAt, weightAt, buttonAt, recogAt, openAt, jumpAt, betterAt, hideAt] = ats(p, ["syncAt", "woundAt", "vortAt", "leakAt", "weightAt", "buttonAt", "recogAt", "openAt", "jumpAt", "betterAt", "hideAt"]);
  const G = useMemo(() => {
    const g = mk();
    g.F.push(...buildShipHall2(LEAK_Y));
    // o console Combine na parede direita (tela ciano) e os dois emissores diante do anteparo
    g.box(1.55, 11.2, 0.8, 0.62, 1.0, 0.95, [40, 46, 52]);
    g.quad([1.549, 11.3, 1.0], [1.549, 12.1, 1.0], [1.549, 12.1, 1.65], [1.549, 11.3, 1.65], [80, 225, 245], [-1, 0, 0], { emit: 0.55, tag: "scr" });
    [-1.25, 1.25].forEach((x) => {
      g.prism(x, LEAK_Y - 0.7, 0, 1.5, 0.16, 6, [44, 50, 58], undefined, 0.3);
      g.prism(x, LEAK_Y - 0.7, 1.5, 1.62, 0.24, 6, [255, 150, 60], { emit: 0.2, tag: "emit" }, 0.3);
    });
    return g.F;
  }, []);
  const sync = f < syncAt ? 98 : Math.max(14, 98 - (f - syncAt) * 4);
  const flick = f >= syncAt && f < leakAt + 40 ? (rnd(Math.floor(f / 2)) > 0.82 ? 0.25 : 1) : 1;
  const crack = P(f, leakAt, 40);
  const hold = P(f, openAt, 14);
  const wob = hold > 0.9 ? 0.02 : 0.12 * (1 - hold * 0.8);
  const yaw = keys(f, [[0, 0], [woundAt - 6, 0], [vortAt + 30, -0.38], [leakAt - 6, -0.1], [leakAt + 18, 0], [buttonAt - 4, 0], [buttonAt + 16, 0.5], [recogAt, 0.5], [recogAt + 18, 0.02], [jumpAt, 0.02], [jumpAt + 22, -0.42], [life, -0.44]]);
  const pitch = keys(f, [[0, -0.02], [woundAt - 4, -0.02], [woundAt + 16, -0.5], [vortAt + 30, -0.18], [leakAt + 10, 0.02], [life, 0.0]]);
  const y = keys(f, [[0, 2.5], [leakAt, 5.0], [openAt, 8.5], [life, 9.2]]);
  const e: Eye = { x: 0.05 * Math.sin(f / 50), y, z: 1.65 + 0.02 * Math.sin(f / 9), yaw, pitch, F: 960 };
  const live = G.map((fc) =>
    fc.tag === "emit" ? { ...fc, emit: f >= openAt ? 0.95 : 0.2 } : fc.tag === "scr" ? { ...fc, emit: f >= buttonAt ? 0.7 + 0.2 * Math.sin(f / 5) : 0.45 } : fc.emit ? { ...fc, emit: (fc.emit ?? 0) * flick } : fc,
  );
  const lights: XL[] = [
    { x: 0, y: y + 4, z: 2.6, col: [255, 236, 200], k: 0.45 * flick, r: 8 },
    { x: 0, y: LEAK_Y - 0.6, z: 1.3, col: [255, 196, 140], k: 0.9 * crack, r: 9 },
    { x: 0, y: 11, z: 0.2, col: [255, 110, 60], k: f >= woundAt ? 0.35 + 0.1 * Math.sin(f / 6) : 0, r: 6 },
    { x: 1.4, y: 11.7, z: 1.3, col: [80, 225, 245], k: 0.25, r: 2.5 },
    { x: 0, y: y + 2, z: 2.8, col: [255, 50, 40], k: f >= syncAt && f < openAt ? (Math.sin(f / 4) > 0 ? 0.55 : 0.05) : 0, r: 9 },
    { x: 0, y: LEAK_Y - 3, z: 0.6, col: [255, 200, 150], k: 0.55 * crack, r: 12 },
  ];
  // a rachadura no anteparo (polígono irregular que cresce do centro) e o Xen do outro lado
  const riftPts = RIFT.map(([u, v]) => {
    const k = crack * (1 + wob * Math.sin(f / 3 + u * 5));
    return proj(e, [u * k * 1.55, LEAK_Y - 0.02, Math.max(0.08, Math.min(2.9, 1.3 + (v - 1.15) * k * 1.3))]);
  });
  const riftOk = crack > 0.02 && riftPts.every((q) => q);
  const hole = riftOk ? `polygon(${riftPts.map((q) => `${q!.x.toFixed(0)}px ${q!.y.toFixed(0)}px`).join(", ")})` : "polygon(0 0,0 0,0 0)";
  const xe: Eye = { x: e.x * 3, y: -4 + (e.y - 6) * 1.5, z: 7.6, yaw: e.yaw, pitch: 0.06 + e.pitch, F: 900 };
  const fiss = FISSURE.map(([x, yy]) => proj(e, [x, yy, 0.02]));
  const alyx: [number, number] = [-0.9, LEAK_Y - 2.2];
  const emitTop = [-1.25, 1.25].map((x) => proj(e, [x, LEAK_Y - 0.7, 1.56]));
  const scan = P(f, recogAt, 10) * (1 - P(f, openAt + 20, 10));
  const rc = proj(e, [0, LEAK_Y, 1.3]);
  return (
    <AbsoluteFill style={{ background: "#020304", overflow: "hidden" }}>
      <XView e={e} faces={live} lights={lights} flash={0.85} amb={0.11} />
      {riftOk ? (
        <AbsoluteFill style={{ clipPath: hole, opacity: crack }}>
          <XenVista e={xe} f={f} />
        </AbsoluteFill>
      ) : null}
      {/* os Vortigaunts (a silhueta aprovada, contorno verde, olho vermelho) junto da ferida, olhando para o chão */}
      {f >= vortAt && f < leakAt + 30 ? (
        <AbsoluteFill style={{ pointerEvents: "none" }}>
          {[[-1.3, 12.4, false], [1.15, 13.6, true]].map(([x, yy, fl], k) => (
            <SilhouetteAt key={k} e={e} x={x as number} y={yy as number} h={1.9} src="hl3silh/vort_silh.png" ar={270 / 400} f={f} o={P(f, vortAt + k * 8, 14) * (1 - P(f, leakAt + 10, 18))} flip={fl as boolean} rim="rgba(141,255,168,0.75)" top="#2e3a28" bot="#0a0f0a" label={k === 0 ? "VORTIGAUNTS" : undefined} labelCol={GREEN} sub={k === 0 ? "PERCEBEM A FERIDA" : undefined} />
          ))}
        </AbsoluteFill>
      ) : null}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <defs>
          <filter id="lk9glow"><feGaussianBlur stdDeviation="6" /></filter>
        </defs>
        {/* a ferida embaixo do navio: o brilho escapa pelas emendas do piso e por uma rachadura fina no meio */}
        {f >= woundAt ? (
          <g opacity={P(f, woundAt, 18)}>
            {[8, 10, 12, 14, 16].map((yy, k) => {
              const cx = FISSURE[Math.min(FISSURE.length - 1, k + 1)][0];
              const l = proj(e, [cx - 1.0, yy, 0.012]);
              const r = proj(e, [cx + 1.0, yy, 0.012]);
              if (!l || !r) return null;
              const pul = 0.6 + 0.4 * Math.sin(f / 6 + k);
              return (
                <g key={k}>
                  <line x1={l.x} y1={l.y} x2={r.x} y2={r.y} stroke="rgba(255,120,60,0.7)" strokeWidth={Math.max(4, 120 / l.d)} filter="url(#lk9glow)" opacity={pul} />
                  <line x1={l.x} y1={l.y} x2={r.x} y2={r.y} stroke="#ffc090" strokeWidth={Math.max(1, 18 / l.d)} opacity={pul} />
                </g>
              );
            })}
            {fiss.every((q) => q) ? <polyline points={fiss.map((q) => `${q!.x},${q!.y}`).join(" ")} fill="none" stroke="rgba(255,150,90,0.8)" strokeWidth={1.6} /> : null}
            {fiss.every((q) => q) ? <polyline points={fiss.map((q) => `${q!.x},${q!.y}`).join(" ")} fill="none" stroke="rgba(255,110,60,0.35)" strokeWidth={10} filter="url(#lk9glow)" /> : null}
          </g>
        ) : null}
        {/* a borda viva da rachadura e as partículas de Xen entrando */}
        {riftOk ? (
          <g opacity={crack}>
            <polygon points={riftPts.map((q) => `${q!.x},${q!.y}`).join(" ")} fill="none" stroke="rgba(199,155,255,0.8)" strokeWidth={10} filter="url(#lk9glow)" />
            <polygon points={riftPts.map((q) => `${q!.x},${q!.y}`).join(" ")} fill="none" stroke="#f0e2ff" strokeWidth={2.5} />
            {Array.from({ length: 40 }).map((_, i) => {
              const t = ((f - leakAt) / 90 + rnd(i * 3)) % 1;
              const q = proj(e, [(rnd(i) - 0.5) * 1.6 + Math.sin(f / 20 + i) * 0.3, LEAK_Y - 0.1 - t * 7, 0.6 + rnd(i * 5) * 1.4 + t * 0.4]);
              return q ? <circle key={i} cx={q.x} cy={q.y} r={Math.max(1, 30 / q.d)} fill={i % 3 ? "#ffd9a0" : "#c79bff"} opacity={(1 - t) * 0.8} /> : null;
            })}
          </g>
        ) : null}
        {/* os emissores prendendo as bordas: feixes laranja até a borda */}
        {hold > 0 && riftOk
          ? emitTop.map((q, k) => {
              const edge = riftPts[k === 0 ? 10 : 3];
              return q && edge ? (
                <g key={k} opacity={hold}>
                  <line x1={q.x} y1={q.y} x2={edge.x} y2={edge.y} stroke="rgba(255,160,70,0.6)" strokeWidth={10} filter="url(#lk9glow)" />
                  <line x1={q.x} y1={q.y} x2={edge.x} y2={edge.y} stroke="#ffd29a" strokeWidth={2.5} />
                </g>
              ) : null;
            })
          : null}
        {/* a varredura do HEV marcando a ruptura */}
        {scan > 0 && rc ? (
          <g opacity={scan} stroke={ICE} fill="none" strokeWidth={2.5}>
            {[[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy], k) => {
              const w = 3600 / rc.d;
              const h = 3200 / rc.d;
              const x = rc.x + sx * w * 0.5;
              const yy = rc.y + sy * h * 0.5;
              return <path key={k} d={`M ${x} ${yy - sy * 40} L ${x} ${yy} L ${x - sx * 40} ${yy}`} />;
            })}
            <line x1={rc.x - 1100 / rc.d} x2={rc.x + 1100 / rc.d} y1={rc.y - 1000 / rc.d + ((f - recogAt) * 9) % (2000 / rc.d)} y2={rc.y - 1000 / rc.d + ((f - recogAt) * 9) % (2000 / rc.d)} opacity={0.6} />
            <text x={rc.x + 1150 / rc.d} y={rc.y - 1000 / rc.d + 20} fill={ICE} stroke="none" fontFamily={MONO} fontSize={20} letterSpacing={4} style={{ paintOrder: "stroke", stroke: "#000", strokeWidth: 4 }}>
              RUPTURA · INSTÁVEL
            </text>
          </g>
        ) : null}
        <Call e={e} f={f} pt={[0.2, 11.6, 0.02]} from={woundAt + 8} until={leakAt} text="A FERIDA" sub="EMBAIXO DO NAVIO" col={ORANGE} dx={260} dy={-120} />
        <Call e={e} f={f} pt={[0.6, LEAK_Y, 1.8]} from={leakAt + 24} until={buttonAt} text="A FRONTEIRA COM XEN" sub="VAZA PARA DENTRO · TEMPORÁRIO" col={VIO} dx={260} dy={-160} />
        <Call e={e} f={f} pt={[1.25, LEAK_Y - 0.7, 1.56]} from={openAt + 10} until={jumpAt + 10} text="MANTEVE ABERTA" sub="ELA PRENDEU AS BORDAS" col={AMB} dx={220} dy={-150} />
        <XMarker e={e} x={alyx[0]} y={alyx[1]} label="ALYX" col={ORANGE} f={f} o={P(f, weightAt, 12)} sub={f >= betterAt ? "ENTENDE MAIS DO QUE MOSTRA" : f >= openAt ? "SOUBE O QUE FAZER" : undefined} />
      </svg>
      {/* o botão que não existe: o aviso de jogo riscado */}
      {f >= buttonAt && f < openAt
        ? (() => {
            const q = proj(e, [1.5, 11.7, 1.33]);
            if (!q) return null;
            const o = P(f, buttonAt + 6, 8);
            return (
              <div style={{ position: "absolute", left: q.x, top: q.y, transform: "translate(-8%, -160%)", opacity: o, display: "flex", alignItems: "center", gap: 14, padding: "10px 18px", background: "rgba(10,8,2,0.75)", border: `1.5px solid ${AMB}`, borderRadius: 10, fontFamily: MONO, color: AMB, whiteSpace: "nowrap" }}>
                <span style={{ padding: "2px 10px", border: `1.5px solid ${AMB}`, borderRadius: 6, fontSize: 22 }}>E</span>
                <span style={{ fontSize: 22, letterSpacing: 3 }}>IR PARA XEN</span>
                <span style={{ position: "absolute", left: -8, right: -8, top: "50%", height: 4, background: RED, transformOrigin: "left", transform: `scaleX(${P(f, buttonAt + 16, 8)}) rotate(-4deg)` }} />
                {f >= buttonAt + 24 ? <span style={{ position: "absolute", left: 0, right: 0, top: "115%", textAlign: "center", color: RED, fontSize: 16, letterSpacing: 4 }}>ESSE BOTÃO NÃO EXISTE</span> : null}
              </div>
            );
          })()
        : null}
      {/* o medidor de sincronia do HEV */}
      <div style={{ position: "absolute", right: 90, top: 120, width: 380, padding: "12px 16px", borderRadius: 10, background: "rgba(8,8,10,0.7)", border: `1.5px solid ${sync < 50 ? RED : ICE}`, fontFamily: MONO }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, letterSpacing: 4, color: sync < 50 ? RED : ICE }}>
          <span>SINCRONIA COM O PRESENTE</span>
          <span>{Math.round(sync)}%</span>
        </div>
        <div style={{ marginTop: 8, height: 10, background: "rgba(242,240,247,0.12)" }}>
          <div style={{ height: "100%", width: `${sync}%`, background: sync < 50 ? RED : ICE }} />
        </div>
      </div>
      {/* o que ela sabe × o que ela mostra (scanner do HEV, quando a câmera vira para a Alyx) */}
      {f >= betterAt ? (
        <div style={{ position: "absolute", left: 110, bottom: 190, width: 520, padding: "16px 20px", borderRadius: 12, background: "rgba(14,10,4,0.86)", border: `1.5px solid ${ORANGE}`, fontFamily: MONO, opacity: P(f, betterAt, 10) }}>
          <div style={{ fontSize: 15, letterSpacing: 5, color: ORANGE }}>H.E.V. · ALYX VANCE · DESDE O GRANDE SALTO</div>
          {[
            ["O QUE ELA ENTENDE DO BOREALIS", 0.9, betterAt + 6, ORANGE],
            ["O QUE ELA DEIXA O GORDON PERCEBER", 0.18, hideAt, "rgba(242,240,247,0.7)"],
          ].map(([t, v, t0, c]) => (
            <div key={t as string} style={{ marginTop: 12, opacity: P(f, t0 as number, 8) }}>
              <div style={{ fontSize: 16, letterSpacing: 3, color: TXT }}>{t as string}</div>
              <div style={{ marginTop: 6, height: 12, background: "rgba(242,240,247,0.1)" }}>
                <div style={{ height: "100%", width: `${100 * (v as number) * P(f, t0 as number, 24)}%`, background: c as string }} />
              </div>
            </div>
          ))}
        </div>
      ) : null}
      <Hud f={f} yaw={e.yaw} eye={e} blips={[{ x: alyx[0], y: alyx[1], hot: f >= weightAt }]} msg={f < syncAt + 10 ? "O BOREALIS NÃO VIAJA PARA XEN" : f < woundAt ? "SINCRONIA CAINDO" : undefined} msgCol={f < syncAt + 10 ? ICE : RED} />
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ================================================================================================= 61:28 eles chegam antes (replay tático 3D)
// um tabuleiro de gelo visto do alto (cristas, um desfiladeiro com ponte), peças âmbar = resistência, peças vermelhas = Combine.
// "uma diferença": REPLAY TÁTICO → "parecem saber": setas vermelhas tracejadas aparecem À FRENTE das peças âmbar (o movimento
// previsto) → Varga muda de rota → no fim da rota nova, um esquadrão JÁ ESPERANDO → Barney vai pela ponte lateral → a equipe
// Combine chega antes (cronômetros) → a emboscada armada em U no desfiladeiro → as tropas contornam: NÃO ENTRAM.
const pieceR = (g: ReturnType<typeof mk>, x: number, y: number, col: RGB, s = 1) => {
  g.prism(x, y, 0, 0.5 * s, 0.55 * s, 6, [col[0] * 0.5, col[1] * 0.5, col[2] * 0.5], undefined, 0.5);
  g.prism(x, y, 0.5 * s, 1.0 * s, 0.38 * s, 6, col, { emit: 0.35 }, 0.5);
};
const pieceA = (g: ReturnType<typeof mk>, x: number, y: number, s = 1) => {
  g.prism(x, y, 0, 0.45 * s, 0.5 * s, 10, [110, 70, 20]);
  g.prism(x, y, 0.45 * s, 0.85 * s, 0.32 * s, 10, [255, 178, 46], { emit: 0.35 });
};
const lerp2 = (a: [number, number], b: [number, number], t: number): [number, number] => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const alongP = (pts: [number, number][], t: number): [number, number] => {
  const n = pts.length - 1;
  const u = Math.max(0, Math.min(0.9999, t)) * n;
  const i = Math.floor(u);
  return lerp2(pts[i], pts[i + 1], u - i);
};
// os três lances, em pontos diferentes do tabuleiro
const V_A: [number, number][] = [[-14, 4], [-10, 10], [-8, 16]];
const V_B: [number, number][] = [[-14, 4], [-17, 10], [-20, 15]];
const B_PATH: [number, number][] = [[2, 2], [4, 8], [6, 13]];
const C_PATH: [number, number][] = [[16, 22], [11, 18], [7, 14]];
const AMB_C: [number, number] = [18, 6];
const SKIP: [number, number][] = [[30, 0], [24, 3], [22, 10], [26, 13], [32, 14]];
export const HL9Predicted: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [diffAt, knowAt, vargaAt, waitAt, barneyAt, firstAt, ambAt, skipAt] = ats(p, ["diffAt", "knowAt", "vargaAt", "waitAt", "barneyAt", "firstAt", "ambAt", "skipAt"]);
  void diffAt;
  // câmera: no alto, olhando para baixo; vai de lance em lance
  // mira o centro de cada lance: câmera 10 m atrás e 9 m acima do alvo
  const tx = keys(f, [[0, -14], [vargaAt - 10, -17], [barneyAt - 6, -17], [barneyAt + 24, 5.5], [ambAt - 6, 5.5], [ambAt + 24, 22], [life, 22.5]]);
  const cx = tx;
  const ty = keys(f, [[0, 9], [vargaAt - 10, 13.5], [barneyAt - 6, 13.5], [barneyAt + 24, 12], [ambAt - 6, 12], [ambAt + 24, 8.5], [life, 8.5]]);
  const cy = ty - 8;
  const e: Eye = { x: cx, y: cy, z: 7.5 + 0.15 * Math.sin(f / 40), yaw: 0.03 * Math.sin(f / 90), pitch: -0.75, F: 1150 };
  const g = mk();
  // a mesa tática (holográfica, escura): placas de ardósia, cristas baixas, o desfiladeiro e a ponte lateral
  for (let x = -30; x < 40; x += 5)
    for (let y = -6; y < 36; y += 5) {
      const k = 0.94 + rnd(x * 3 + y * 7) * 0.08;
      g.quad([x, y, 0], [x + 5, y, 0], [x + 5, y + 5, 0], [x, y + 5, 0], [34 * k, 46 * k, 58 * k], [0, 0, 1]);
    }
  for (let i = 0; i < 12; i++) g.prism(-28 + rnd(i * 5) * 66, -4 + rnd(i * 9) * 38, 0, 0.25 + rnd(i) * 0.5, 1.2 + rnd(i * 3) * 1.8, 7, [52, 66, 80], undefined, rnd(i * 7));
  g.box(-30, 11.2, -0.01, 70, 1.6, 0.02, [8, 12, 16]);
  g.box(5.0, 11.0, 0, 2.4, 2.0, 0.18, [120, 90, 40], { emit: 0.35 });
  // lance 1: a coluna do Varga muda de rota; o esquadrão já está no fim da rota nova
  const vA = P(f, vargaAt - 30, 60);
  const turn = P(f, vargaAt, 30);
  const vpos = turn > 0 ? alongP(V_B, Math.min(1, (f - vargaAt) / 70) * 0.8) : alongP(V_A, vA * 0.35);
  [0, 1, 2].forEach((k) => pieceA(g, vpos[0] - k * 0.9, vpos[1] - k * 1.3));
  if (f >= waitAt - 30) [[-20.5, 15.2], [-19.2, 16.4], [-21.4, 16.8]].forEach(([x, y]) => pieceR(g, x, y, [255, 80, 70]));
  // lance 2: Barney vai pela ponte; a equipe Combine chega antes
  const bt = P(f, barneyAt, 110);
  const ct = P(f, barneyAt + 10, 70);
  const bpos = alongP(B_PATH, bt * 0.85);
  const cpos = alongP(C_PATH, ct);
  [0, 1].forEach((k) => pieceA(g, bpos[0] - k * 0.7, bpos[1] - k * 1.1));
  [0, 1, 2].forEach((k) => pieceR(g, cpos[0] + k * 0.8, cpos[1] + k * 0.6, [255, 80, 70]));
  // lance 3: a emboscada em U; as tropas contornam
  [[-3, 0], [-2, 2.4], [0, 3.4], [2, 2.4], [3, 0]].forEach(([dx, dy]) => pieceA(g, AMB_C[0] + dx, AMB_C[1] + dy, 0.9));
  const st = P(f, ambAt + 10, 90);
  const spos = alongP(SKIP, st);
  [0, 1, 2].forEach((k) => pieceR(g, spos[0] + k * 0.7, spos[1] - k * 0.5, [255, 80, 70]));
  const lights: XL[] = [{ x: cx, y: cy + 10, z: 8, col: [200, 230, 255], k: 0.5, r: 30 }];
  const pathD3 = (pts: [number, number][], t = 1) => {
    const n = Math.max(2, Math.round(t * 24));
    const q = Array.from({ length: n }).map((_, i) => proj(e, [...alongP(pts, (i / (n - 1)) * t), 0.05] as V3));
    return q.every((v) => v) ? q.map((v, i) => `${i ? "L" : "M"} ${v!.x.toFixed(1)} ${v!.y.toFixed(1)}`).join(" ") : "";
  };
  const timer = (pt: V3, label: string, secs: number, col: string, o: number) => {
    const q = proj(e, pt);
    if (!q || o <= 0) return null;
    return (
      <g opacity={o}>
        <rect x={q.x - 90} y={q.y - 74} width={180} height={44} rx={8} fill="rgba(8,8,10,0.85)" stroke={col} strokeWidth={2} />
        <text x={q.x} y={q.y - 46} textAnchor="middle" fill={col} fontFamily={MONO} fontSize={20} letterSpacing={3}>{label} {Math.max(0, secs).toFixed(0).padStart(2, "0")}s</text>
      </g>
    );
  };
  return (
    <AbsoluteFill style={{ background: "#0a121a", overflow: "hidden" }}>
      <XView e={e} faces={g.F} lights={lights} flash={0} amb={0.75} seam="rgba(0,0,0,0.2)" />
      {/* o relevo em curvas de nível e a grade da mesa (linhas acesas no plano) */}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {Array.from({ length: 15 }).map((_, i) => {
          const x = -30 + i * 5;
          const a2 = proj(e, [x, -6, 0.01]);
          const b2 = proj(e, [x, 36, 0.01]);
          return a2 && b2 ? <line key={"gx" + i} x1={a2.x} y1={a2.y} x2={b2.x} y2={b2.y} stroke="rgba(120,220,255,0.12)" strokeWidth={1} /> : null;
        })}
        {Array.from({ length: 9 }).map((_, i) => {
          const y = -6 + i * 5;
          const a2 = proj(e, [-30, y, 0.01]);
          const b2 = proj(e, [40, y, 0.01]);
          return a2 && b2 ? <line key={"gy" + i} x1={a2.x} y1={a2.y} x2={b2.x} y2={b2.y} stroke="rgba(120,220,255,0.12)" strokeWidth={1} /> : null;
        })}
        {Array.from({ length: 7 }).map((_, k) => {
          const pts = Array.from({ length: 40 }).map((_, i) => proj(e, [-30 + i * 1.8, 20 + k * 2.4 + Math.sin(i * 0.4 + k) * 1.6, 0.02]));
          return pts.every((v) => v) ? <polyline key={"c" + k} points={pts.map((v) => `${v!.x},${v!.y}`).join(" ")} fill="none" stroke="rgba(120,220,255,0.22)" strokeWidth={1.2} /> : null;
        })}
        {[11.2, 12.8].map((y, k) => {
          const a2 = proj(e, [-30, y, 0.02]);
          const b2 = proj(e, [40, y, 0.02]);
          return a2 && b2 ? <line key={"r" + k} x1={a2.x} y1={a2.y} x2={b2.x} y2={b2.y} stroke="rgba(120,220,255,0.55)" strokeWidth={1.6} /> : null;
        })}
        {(() => {
          const q = proj(e, [-26, 12, 0.05]);
          return q ? <text x={q.x} y={q.y + 6} fill="rgba(120,220,255,0.7)" fontFamily={MONO} fontSize={16} letterSpacing={4}>DESFILADEIRO</text> : null;
        })()}
      </svg>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {/* o movimento previsto: setas vermelhas tracejadas à frente das peças âmbar */}
        {f >= knowAt ? <path d={pathD3(turn > 0 ? V_B : V_A)} fill="none" stroke={RED} strokeWidth={3} strokeDasharray="10 9" opacity={P(f, knowAt, 10) * 0.9} /> : null}
        {f >= vargaAt && turn > 0 ? <path d={pathD3(V_A, 1)} fill="none" stroke="rgba(255,178,46,0.35)" strokeWidth={2} strokeDasharray="4 8" /> : null}
        {f >= barneyAt ? <path d={pathD3(B_PATH)} fill="none" stroke={AMB} strokeWidth={3} strokeDasharray="10 9" opacity={0.8} /> : null}
        {f >= barneyAt ? <path d={pathD3(C_PATH, ct)} fill="none" stroke={RED} strokeWidth={3} opacity={0.9} /> : null}
        {f >= ambAt ? <path d={pathD3(SKIP, st)} fill="none" stroke={RED} strokeWidth={3} opacity={0.9} /> : null}
        {f >= skipAt ? <path d={pathD3([[30, 0], [21, 4], [AMB_C[0], AMB_C[1] + 1]])} fill="none" stroke="rgba(255,93,77,0.5)" strokeWidth={2} strokeDasharray="5 8" /> : null}
        <FlagAt e={e} pt={[vpos[0], vpos[1], 0.9]} label="VARGA" col={AMB} f={f} o={P(f, vargaAt - 20, 10) * (1 - P(f, barneyAt, 10))} sub={turn > 0 ? "MUDA DE ROTA" : undefined} />
        <Call e={e} f={f} pt={[-20.4, 16, 1.0]} from={waitAt} until={barneyAt + 6} text="JÁ ESPERANDO" sub="ANTES DA COLUNA CHEGAR" col={RED} dx={-240} dy={-140} />
        <FlagAt e={e} pt={[bpos[0], bpos[1], 0.9]} label="BARNEY" col={AMB} f={f} o={P(f, barneyAt, 10) * (1 - P(f, ambAt, 10))} sub="PONTE LATERAL" />
        {f >= barneyAt + 10 && f < ambAt ? timer([6.2, 12, 0.3], "COMBINE", 12 - (f - barneyAt - 10) / 6, RED, P(f, barneyAt + 10, 8)) : null}
        {f >= barneyAt + 10 && f < ambAt ? timer([3.2, 7, 0.3], "BARNEY", 19 - (f - barneyAt - 10) / 6, AMB, P(f, barneyAt + 10, 8)) : null}
        <Call e={e} f={f} pt={[6.2, 12, 0.4]} from={firstAt} until={ambAt} text="CHEGAM ANTES" col={RED} dx={240} dy={-150} />
        <Call e={e} f={f} pt={[AMB_C[0], AMB_C[1] + 1.6, 0.6]} from={ambAt + 6} until={life} text="EMBOSCADA" sub="A RESISTÊNCIA ESPERANDO" col={AMB} dx={-260} dy={-130} />
        <Call e={e} f={f} pt={[spos[0], spos[1], 0.8]} from={skipAt} until={life} text="NÃO ENTRAM" sub="AS TROPAS CONTORNAM" col={RED} dx={200} dy={-160} />
      </svg>
      {/* o painel do replay */}
      <div style={{ position: "absolute", left: 90, top: 100, padding: "12px 18px", borderRadius: 10, background: "rgba(8,8,10,0.75)", border: `1.5px solid ${ICE}`, fontFamily: MONO }}>
        <div style={{ fontSize: 15, letterSpacing: 5, color: ICE }}>REPLAY TÁTICO · TUNDRA</div>
        <div style={{ fontSize: 22, letterSpacing: 3, color: TXT, marginTop: 6 }}>{f >= knowAt ? "ELES SABEM O PRÓXIMO MOVIMENTO" : "DESSA VEZ É DIFERENTE"}</div>
        <div style={{ display: "flex", gap: 18, marginTop: 10, fontSize: 14, letterSpacing: 3 }}>
          <span style={{ color: AMB }}>● RESISTÊNCIA</span>
          <span style={{ color: RED }}>⬢ COMBINE</span>
          {f >= knowAt ? <span style={{ color: RED, opacity: P(f, knowAt, 8) }}>┅ PREVISTO</span> : null}
        </div>
      </div>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 65%, rgba(0,0,0,0.45) 100%)", pointerEvents: "none" }} />
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ================================================================================================= 61:28 eles chegam antes (terminal Overwatch)
// visto DO LADO DOS COMBINE: a tela de um terminal Overwatch (o mesmo visual aprovado do litoral) com o mapa tático da tundra.
// "parecem saber" → MODELO DE COMPORTAMENTO · RESISTÊNCIA carregado → cada movimento aparece PREVISTO (vetor tracejado) antes
// de acontecer: Varga muda de rota → a unidade JÁ POSICIONADA no fim da rota nova; Barney → ponte lateral: INTERCEPTAR, as duas
// chegadas correndo (os Combine antes); a emboscada → DETECTADA · NÃO ENTRAR (a rota contorna). Embaixo: ORIGEM DAS ORDENS ▒▒▒▒.
const CYC = "#5ff3ff";
const OW_X0 = 90;
const OW_Y0 = 210;
const OW_W = 1140;
const OW_H = 770;
type P2 = [number, number];
const owPath = (pts: P2[], t = 1) => {
  const segs = pts.slice(1).map((q, i) => Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1]));
  const L = segs.reduce((a, b) => a + b, 0);
  let d = Math.max(0, Math.min(1, t)) * L;
  const out: P2[] = [pts[0]];
  for (let i = 0; i < segs.length; i++) {
    if (d >= segs[i]) {
      out.push(pts[i + 1]);
      d -= segs[i];
    } else {
      const k = d / Math.max(0.001, segs[i]);
      out.push([pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k]);
      break;
    }
  }
  return out;
};
const owD = (pts: P2[]) => pts.map((q, i) => `${i ? "L" : "M"} ${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join(" ");
const owEnd = (pts: P2[], t: number) => owPath(pts, t)[owPath(pts, t).length - 1];
const OW_VA: P2[] = [[160, 860], [300, 760], [420, 640]];
const OW_VB: P2[] = [[160, 860], [250, 700], [230, 520], [280, 400]];
const OW_BR: P2[] = [[520, 900], [600, 760], [640, 600]];
const OW_CB: P2[] = [[900, 380], [760, 470], [655, 585]];
const OW_AMB: P2 = [880, 760];
const OW_SK: P2[] = [[1180, 900], [1000, 860], [960, 700], [1050, 560], [1180, 520]];
const OwUnit: React.FC<{ x: number; y: number; col: string; comb?: boolean; o?: number; label?: string }> = ({ x, y, col, comb, o = 1, label }) => (
  <g opacity={o} transform={`translate(${x} ${y}) scale(1.4)`}>
    {comb ? <polygon points="0,-15 13,-7.5 13,7.5 0,15 -13,7.5 -13,-7.5" fill="rgba(40,8,8,0.85)" stroke={col} strokeWidth={2.5} /> : <polygon points="0,-15 14,11 -14,11" fill="rgba(40,24,4,0.85)" stroke={col} strokeWidth={2.5} />}
    {label ? <text x={20} y={6} fill={col} fontFamily={MONO} fontSize={17} letterSpacing={3} style={{ paintOrder: "stroke", stroke: "#04101a", strokeWidth: 4 }}>{label}</text> : null}
  </g>
);
export const HL9Overwatch: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [diffAt, knowAt, vargaAt, waitAt, barneyAt, firstAt, ambAt, skipAt] = ats(p, ["diffAt", "knowAt", "vargaAt", "waitAt", "barneyAt", "firstAt", "ambAt", "skipAt"]);
  const ui = P(f, diffAt, 12);
  // Varga: segue a rota A, a previsão aparece, ele vira para a B
  const vPred = P(f, vargaAt - 24, 18);
  const vTurn = P(f, vargaAt, 50);
  const vpos = f < vargaAt ? owEnd(OW_VA, 0.3 * P(f, diffAt, 60)) : owEnd(OW_VB, 0.25 + 0.75 * vTurn * 0.85);
  // Barney × a equipe Combine até a ponte
  const bT = P(f, barneyAt, 120);
  const cT = P(f, barneyAt + 8, 70);
  const bpos = owEnd(OW_BR, bT * 0.82);
  const cpos = owEnd(OW_CB, cT);
  const sT = P(f, ambAt + 10, 80);
  const spos = owEnd(OW_SK, sT);
  const card = (t0: number, title: string, body: string, col = CYC, stamp?: string, stampAt = 1e9) =>
    f >= t0 ? (
      <div style={{ position: "relative", padding: "14px 18px", background: "linear-gradient(160deg, rgba(20,60,84,0.85), rgba(6,22,32,0.92))", clipPath: "polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px)", boxShadow: `inset 0 0 0 1.5px ${col}`, opacity: P(f, t0, 8), transform: `translateX(${(1 - P(f, t0, 10)) * 40}px)`, marginBottom: 14 }}>
        <div style={{ fontFamily: MONO, fontSize: 16, letterSpacing: 4, color: col }}>{decode(title, f, t0, 2.4)}</div>
        <div style={{ fontFamily: MONO, fontSize: 22, letterSpacing: 2, color: "#dff8ff", marginTop: 6 }}>{decode(body, f, t0 + 4, 2.4)}</div>
        {stamp && f >= stampAt ? <div style={{ position: "absolute", right: 14, top: 10, padding: "3px 10px", border: `2px solid ${RED}`, color: RED, fontFamily: MONO, fontSize: 15, letterSpacing: 3, transform: `rotate(-5deg) scale(${1.4 - 0.4 * P(f, stampAt, 6)})`, opacity: P(f, stampAt, 6) }}>{stamp}</div> : null}
      </div>
    ) : null;
  return (
    <AbsoluteFill style={{ background: "#020608", overflow: "hidden" }}>
      <AbsoluteFill style={{ opacity: ui, background: "radial-gradient(ellipse at 50% 38%, #0d2a3c 0%, #04101a 75%)" }}>
        <AbsoluteFill style={{ backgroundImage: "linear-gradient(rgba(159,230,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(159,230,255,0.06) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
        <div style={{ position: "absolute", left: 90, top: 70, fontFamily: MONO, color: CYC, letterSpacing: 6 }}>
          <div style={{ fontSize: 22 }}>{decode("OVERWATCH · SETOR TUNDRA · OFENSIVA", f, diffAt, 2)}</div>
          <div style={{ fontSize: 15, color: "rgba(159,230,255,0.6)", marginTop: 6 }}>{f >= knowAt ? "MODELO DE COMPORTAMENTO · RESISTÊNCIA · PRECISÃO 97%" : "MONITORANDO A COLUNA DA RESISTÊNCIA"}</div>
        </div>
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          {Array.from({ length: 52 }).map((_, i) => {
            const v = rnd(i * 7 + Math.floor(f / 6));
            return <rect key={i} x={90 + i * 33} y={160} width={v > 0.5 ? 14 : 7} height={v > 0.75 ? 14 : 8} fill={CYC} opacity={0.2 + 0.35 * rnd(i)} />;
          })}
          <line x1={90} x2={1830} y1={182} y2={182} stroke={CYC} strokeWidth={1} opacity={0.35} />
          {/* o mapa tático: moldura chanfrada, grade hexagonal, relevo, o desfiladeiro e a ponte */}
          <path d={`M ${OW_X0 + 24} ${OW_Y0} H ${OW_X0 + OW_W} V ${OW_Y0 + OW_H - 24} L ${OW_X0 + OW_W - 24} ${OW_Y0 + OW_H} H ${OW_X0} V ${OW_Y0 + 24} Z`} fill="rgba(4,16,26,0.7)" stroke={CYC} strokeWidth={1.5} />
          {Array.from({ length: 13 }).map((_, i) =>
            Array.from({ length: 9 }).map((_, j) => {
              const x = OW_X0 + 50 + i * 86 + (j % 2) * 43;
              const y = OW_Y0 + 50 + j * 80;
              return <polygon key={`${i}-${j}`} points={Array.from({ length: 6 }).map((_, k) => `${x + Math.cos((k / 6) * Math.PI * 2) * 40},${y + Math.sin((k / 6) * Math.PI * 2) * 40}`).join(" ")} fill="none" stroke="rgba(95,243,255,0.07)" />;
            }),
          )}
          {[0, 1, 2, 3, 4].map((k) => (
            <path key={"rv" + k} d={`M ${OW_X0} ${OW_Y0 + 160 + k * 120} C ${OW_X0 + 300} ${OW_Y0 + 100 + k * 120}, ${OW_X0 + 700} ${OW_Y0 + 220 + k * 110}, ${OW_X0 + OW_W} ${OW_Y0 + 150 + k * 120}`} fill="none" stroke="rgba(95,243,255,0.13)" strokeWidth={1.2} />
          ))}
          <path d={`M ${OW_X0} ${OW_Y0 + 400} C ${OW_X0 + 400} ${OW_Y0 + 360}, ${OW_X0 + 700} ${OW_Y0 + 430}, ${OW_X0 + OW_W} ${OW_Y0 + 380}`} fill="none" stroke="rgba(95,243,255,0.5)" strokeWidth={14} opacity={0.25} />
          <path d={`M ${OW_X0} ${OW_Y0 + 400} C ${OW_X0 + 400} ${OW_Y0 + 360}, ${OW_X0 + 700} ${OW_Y0 + 430}, ${OW_X0 + OW_W} ${OW_Y0 + 380}`} fill="none" stroke={CYC} strokeWidth={1.5} strokeDasharray="3 6" />
          <text x={OW_X0 + 20} y={OW_Y0 + 380} fill="rgba(95,243,255,0.7)" fontFamily={MONO} fontSize={15} letterSpacing={4}>DESFILADEIRO</text>
          <rect x={622} y={570} width={40} height={30} fill="none" stroke={AMB} strokeWidth={2} transform="rotate(-8 642 585)" />
          <text x={672} y={612} fill={AMB} fontFamily={MONO} fontSize={14} letterSpacing={3}>PONTE LATERAL</text>
          {/* a varredura passando pelo mapa */}
          <rect x={OW_X0 + ((f * 6) % OW_W)} y={OW_Y0 + 2} width={3} height={OW_H - 4} fill={CYC} opacity={0.18} />
          <rect x={OW_X0 + ((f * 6) % OW_W) - 60} y={OW_Y0 + 2} width={60} height={OW_H - 4} fill="url(#owSweep)" />
          <defs>
            <linearGradient id="owSweep" x1="0" x2="1">
              <stop offset="0" stopColor="rgba(95,243,255,0)" />
              <stop offset="1" stopColor="rgba(95,243,255,0.08)" />
            </linearGradient>
          </defs>
          {/* lance 1 · Varga */}
          <path d={owD(OW_VA)} fill="none" stroke="rgba(255,178,46,0.5)" strokeWidth={2.5} strokeDasharray={f >= vargaAt ? "4 8" : "0"} />
          {vPred > 0 ? <path d={owD(owPath(OW_VB, vPred))} fill="none" stroke={CYC} strokeWidth={4} strokeDasharray="14 9" /> : null}
          {vPred > 0 ? <text x={180} y={520} fill={CYC} fontFamily={MONO} fontSize={16} letterSpacing={3} opacity={vPred}>PREVISTO · ROTA B</text> : null}
          {f >= vargaAt ? <path d={owD(owPath(OW_VB, 0.25 + 0.75 * vTurn * 0.85))} fill="none" stroke={AMB} strokeWidth={4} /> : null}
          <OwUnit x={vpos[0]} y={vpos[1]} col={AMB} label="VARGA" o={P(f, diffAt + 6, 8)} />
          {f >= waitAt - 6 ? [[280, 400], [310, 380], [252, 378]].map(([x, y], k) => <OwUnit key={k} x={x} y={y} col={RED} comb o={P(f, waitAt - 6 + k * 3, 6)} />) : null}
          {f >= waitAt ? <text x={330} y={400} fill={RED} fontFamily={MONO} fontSize={17} letterSpacing={3} opacity={P(f, waitAt, 8)} style={{ paintOrder: "stroke", stroke: "#04101a", strokeWidth: 4 }}>UNIDADE 4 · JÁ POSICIONADA</text> : null}
          {/* lance 2 · Barney e a ponte */}
          {f >= barneyAt - 20 ? <path d={owD(owPath(OW_BR, P(f, barneyAt - 20, 16)))} fill="none" stroke={CYC} strokeWidth={4} strokeDasharray="14 9" /> : null}
          {f >= barneyAt ? <path d={owD(owPath(OW_BR, bT * 0.82))} fill="none" stroke={AMB} strokeWidth={4} /> : null}
          {f >= barneyAt ? <path d={owD(owPath(OW_CB, cT))} fill="none" stroke={RED} strokeWidth={4} /> : null}
          <OwUnit x={bpos[0]} y={bpos[1]} col={AMB} label="BARNEY" o={P(f, barneyAt - 10, 8)} />
          {f >= barneyAt ? [0, 1, 2].map((k) => <OwUnit key={k} x={cpos[0] + k * 22} y={cpos[1] - k * 14} col={RED} comb o={P(f, barneyAt + k * 3, 6)} />) : null}
          {f >= firstAt ? <text x={690} y={560} fill={RED} fontFamily={MONO} fontSize={17} letterSpacing={3} opacity={P(f, firstAt, 8)} style={{ paintOrder: "stroke", stroke: "#04101a", strokeWidth: 4 }}>INTERCEPTADO · CHEGARAM ANTES</text> : null}
          {/* lance 3 · a emboscada */}
          {f >= ambAt - 10
            ? [[-60, 0], [-40, -40], [0, -60], [40, -40], [60, 0]].map(([dx, dy], k) => <OwUnit key={k} x={OW_AMB[0] + dx} y={OW_AMB[1] + dy} col={AMB} o={P(f, ambAt - 10 + k * 2, 6)} />)
            : null}
          {f >= ambAt ? <circle cx={OW_AMB[0]} cy={OW_AMB[1] - 30} r={95} fill="rgba(255,93,77,0.06)" stroke={RED} strokeWidth={2} strokeDasharray="8 7" opacity={P(f, ambAt, 10)} /> : null}
          {f >= ambAt ? <text x={OW_AMB[0] - 95} y={OW_AMB[1] + 80} fill={RED} fontFamily={MONO} fontSize={17} letterSpacing={3} opacity={P(f, ambAt + 6, 8)}>EMBOSCADA DETECTADA</text> : null}
          {f >= ambAt + 10 ? <path d={owD(owPath(OW_SK, sT))} fill="none" stroke={RED} strokeWidth={4} /> : null}
          {f >= ambAt + 10 ? [0, 1, 2].map((k) => <OwUnit key={k} x={spos[0] + k * 20} y={spos[1] + k * 12} col={RED} comb />) : null}
          {f >= skipAt ? <text x={1010} y={500} fill={RED} fontFamily={MONO} fontSize={17} letterSpacing={3} opacity={P(f, skipAt, 8)} style={{ paintOrder: "stroke", stroke: "#04101a", strokeWidth: 4 }}>NÃO ENTRAR · CONTORNAR</text> : null}
        </svg>
        {/* o registro à direita: cada previsão vira um cartão */}
        <div style={{ position: "absolute", left: 1270, right: 90, top: 210 }}>
          {card(knowAt, "MODELO CARREGADO", "RESISTÊNCIA · TUNDRA", CYC)}
          {card(vargaAt - 24, "PREVISÃO · 96%", "VARGA MUDA PARA A ROTA B", CYC, "JÁ POSICIONADA", waitAt)}
          {card(barneyAt - 20, "PREVISÃO · 94%", "BARNEY · PONTE LATERAL", CYC, "INTERCEPTAR", firstAt)}
          {card(ambAt - 6, "DETECTADO", "EMBOSCADA NO DESFILADEIRO", RED, "NÃO ENTRAR", skipAt)}
        </div>
        {/* quem manda as ordens: ainda escondido (a voz vem a seguir) */}
        {f >= skipAt ? (
          <div style={{ position: "absolute", left: 1270, right: 90, bottom: 100, padding: "12px 16px", border: `1.5px solid ${ORANGE}`, background: "rgba(20,10,4,0.75)", fontFamily: MONO, opacity: P(f, skipAt + 6, 10) }}>
            <div style={{ fontSize: 15, letterSpacing: 4, color: ORANGE }}>ORIGEM DAS ORDENS</div>
            <div style={{ fontSize: 26, letterSpacing: 6, color: "#ffd8a8", marginTop: 4 }}>{scramble("COORDENAÇÃO ███", f, 5)}</div>
          </div>
        ) : null}
        <AbsoluteFill style={{ background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.18) 0 2px, transparent 2px 4px)", pointerEvents: "none" }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ================================================================================================= 61:50 a voz nas frequências (o rádio)
// o rádio de campanha da resistência, de perto (painel de metal, parafusos, dial, ponteiro, tela de onda): "começa a ouvir" → o
// dial varre e a onda é só ruído → "frequências interceptadas" → trava em 148.2 MHz · CANAL COMBINE → a onda vira VOZ → "é a
// Alyx" → a identificação de voz abre o crachá (ALYX VANCE · 99%) → "coordenando a ofensiva": o "COORDENAÇÃO ███" decifra em A. VANCE.
export const HL9Radio: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [hearAt, freqAt, isAt, coordAt] = ats(p, ["hearAt", "freqAt", "isAt", "coordAt"]);
  const lock = P(f, freqAt, 14);
  const freq = 120 + ((f * 1.7) % 60) * (1 - lock) + 28.2 * lock;
  const voice = P(f, freqAt + 8, 10);
  const id = P(f, isAt, 12);
  const push = 1 + 0.05 * (f / Math.max(1, life));
  const W = 1500;
  const H = 640;
  const wave = Array.from({ length: 160 }).map((_, i) => {
    const n = (rnd(i * 13 + Math.floor(f / 2)) - 0.5) * 70 * (1 - voice);
    const env = Math.abs(Math.sin(i / 9 + f / 7)) * Math.abs(Math.sin(i / 23 + f / 13));
    const v = Math.sin(i * 0.9 + f * 0.8) * 120 * env * voice;
    return `${i * 4.6},${110 + n + v}`;
  });
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, #1a1712 0%, #070605 80%)", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 960 - W / 2, top: 540 - H / 2 + 20, width: W, height: H, transform: `translateX(${-250 * id}px) scale(${push * (1 - 0.14 * id)}) perspective(1600px) rotateX(8deg)`, transformOrigin: "50% 50%" }}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
          <defs>
            <linearGradient id="rdMetal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#4a4c40" />
              <stop offset="0.5" stopColor="#36382e" />
              <stop offset="1" stopColor="#24251e" />
            </linearGradient>
            <radialGradient id="rdKnob" cx="0.4" cy="0.35" r="0.7">
              <stop offset="0" stopColor="#5a5a54" />
              <stop offset="1" stopColor="#141412" />
            </radialGradient>
            <filter id="rdNoise" x="0" y="0" width="1" height="1">
              <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={9} />
              <feColorMatrix values="0 0 0 0 0.1  0 0 0 0 0.1  0 0 0 0 0.08  0 0 0 0.35 0" />
            </filter>
          </defs>
          {/* o corpo do rádio */}
          <rect x={0} y={0} width={W} height={H} rx={26} fill="url(#rdMetal)" stroke="#121310" strokeWidth={6} />
          <rect x={0} y={0} width={W} height={H} rx={26} filter="url(#rdNoise)" />
          <rect x={14} y={14} width={W - 28} height={H - 28} rx={18} fill="none" stroke="rgba(255,255,230,0.08)" strokeWidth={2} />
          {[[40, 40], [W - 40, 40], [40, H - 40], [W - 40, H - 40]].map(([x, y], k) => (
            <g key={k}>
              <circle cx={x} cy={y} r={11} fill="#2a2b24" stroke="#5a5c50" strokeWidth={2} />
              <line x1={x - 7} y1={y} x2={x + 7} y2={y} stroke="#14150f" strokeWidth={2.5} transform={`rotate(${k * 37} ${x} ${y})`} />
            </g>
          ))}
          <text x={80} y={92} fill="#c8c2a6" fontFamily="'Courier New', monospace" fontSize={26} letterSpacing={6}>λ  RÁDIO DE CAMPANHA · RX-7</text>
          {/* a escala de frequência com o ponteiro */}
          <rect x={80} y={130} width={860} height={140} rx={10} fill="#0e0d09" stroke="#5a5c50" strokeWidth={3} />
          <rect x={86} y={136} width={848} height={128} rx={8} fill="rgba(255,190,90,0.1)" />
          {Array.from({ length: 61 }).map((_, i) => (
            <g key={i}>
              <line x1={110 + i * 13.3} y1={150} x2={110 + i * 13.3} y2={i % 5 ? 172 : 190} stroke="#e8d6a0" strokeWidth={i % 5 ? 1.5 : 2.5} opacity={0.85} />
              {i % 10 === 0 ? <text x={110 + i * 13.3} y={220} textAnchor="middle" fill="#e8d6a0" fontFamily="'Courier New', monospace" fontSize={20}>{120 + i}</text> : null}
            </g>
          ))}
          <line x1={110 + (freq - 120) * 13.3} y1={140} x2={110 + (freq - 120) * 13.3} y2={258} stroke="#ff5a3a" strokeWidth={4} style={{ filter: "drop-shadow(0 0 6px #ff5a3a)" }} />
          <text x={910} y={252} textAnchor="end" fill="#e8d6a0" fontFamily="'Courier New', monospace" fontSize={18} letterSpacing={3}>MHz</text>
          {/* a tela de onda */}
          <rect x={80} y={300} width={860} height={250} rx={10} fill="#04100a" stroke="#5a5c50" strokeWidth={3} />
          {Array.from({ length: 9 }).map((_, i) => <line key={i} x1={80} x2={940} y1={318 + i * 26} y2={318 + i * 26} stroke="rgba(120,255,160,0.07)" />)}
          <g transform="translate(100 315)">
            <polyline points={wave.join(" ")} fill="none" stroke={voice > 0.5 ? "#7dff9a" : "rgba(125,255,154,0.6)"} strokeWidth={2.5} style={{ filter: "drop-shadow(0 0 5px rgba(125,255,154,0.8))" }} />
          </g>
          <text x={100} y={535} fill="#7dff9a" fontFamily="'Courier New', monospace" fontSize={20} letterSpacing={4}>{f < freqAt ? "VARRENDO · RUÍDO" : voice > 0.5 ? "VOZ · CANAL COMBINE INTERCEPTADO" : "TRAVANDO…"}</text>
          {/* o visor digital e os botões */}
          <rect x={990} y={130} width={430} height={110} rx={10} fill="#0a0806" stroke="#5a5c50" strokeWidth={3} />
          <text x={1400} y={208} textAnchor="end" fill={lock > 0.95 ? "#ffb066" : "#a07a40"} fontFamily="'Courier New', monospace" fontSize={64} fontWeight={700} style={{ filter: lock > 0.95 ? "drop-shadow(0 0 8px #ffb066)" : undefined }}>
            {freq.toFixed(1)}
          </text>
          {lock > 0.95 ? <text x={1010} y={160} fill="#ffb066" fontFamily="'Courier New', monospace" fontSize={18} letterSpacing={3}>TRAVADO · COMBINE</text> : null}
          {[0, 1].map((k) => {
            const x = 1080 + k * 230;
            const ang = k === 0 ? f * 6 * (1 - lock) + lock * 140 : 30 + 20 * Math.sin(f / 20);
            return (
              <g key={k}>
                <circle cx={x} cy={390} r={78} fill="url(#rdKnob)" stroke="#0a0a08" strokeWidth={4} />
                {Array.from({ length: 24 }).map((_, i) => <line key={i} x1={x} y1={390 - 78} x2={x} y2={390 - 70} stroke="#3a3a34" strokeWidth={3} transform={`rotate(${i * 15} ${x} 390)`} />)}
                <line x1={x} y1={390} x2={x} y2={330} stroke="#e8d6a0" strokeWidth={5} strokeLinecap="round" transform={`rotate(${ang} ${x} 390)`} />
                <text x={x} y={500} textAnchor="middle" fill="#c8c2a6" fontFamily="'Courier New', monospace" fontSize={18} letterSpacing={4}>{k === 0 ? "SINTONIA" : "VOLUME"}</text>
              </g>
            );
          })}
          <circle cx={1430} cy={560} r={12} fill={voice > 0.5 ? "#ff5a3a" : "#3a1a10"} style={{ filter: voice > 0.5 ? "drop-shadow(0 0 10px #ff5a3a)" : undefined }} opacity={voice > 0.5 && Math.floor(f / 6) % 2 ? 1 : 0.6} />
          <text x={1405} y={566} textAnchor="end" fill="#c8c2a6" fontFamily="'Courier New', monospace" fontSize={16} letterSpacing={3}>REC</text>
        </svg>
      </div>
      {/* a identificação de voz: o crachá da Alyx */}
      {f >= isAt ? (
        <div style={{ position: "absolute", left: 1330, top: 380, width: 520, display: "flex", gap: 18, padding: 16, borderRadius: 14, background: "rgba(14,10,4,0.92)", border: `2px solid ${ORANGE}`, boxShadow: "0 20px 60px rgba(0,0,0,0.7)", opacity: id, transform: `translateY(${(1 - id) * 40}px)` }}>
          <div style={{ width: 150, height: 180, borderRadius: 8, overflow: "hidden", flexShrink: 0, border: `2px solid ${ORANGE}`, backgroundImage: `url(${staticFile("hl3silh/alyx_badge.jpg")})`, backgroundSize: "cover", backgroundPosition: "50% 30%" }} />
          <div style={{ fontFamily: MONO }}>
            <div style={{ fontSize: 15, letterSpacing: 4, color: ORANGE }}>IDENTIFICAÇÃO DE VOZ</div>
            <div style={{ fontSize: 34, letterSpacing: 3, color: TXT, marginTop: 8 }}>ALYX VANCE</div>
            <div style={{ fontSize: 22, letterSpacing: 3, color: ORANGE, marginTop: 4 }}>{Math.round(99 * id)}%</div>
            {f >= coordAt ? (
              <div style={{ marginTop: 12, opacity: P(f, coordAt, 8) }}>
                <div style={{ fontSize: 14, letterSpacing: 3, color: "rgba(242,240,247,0.65)" }}>ORIGEM DAS ORDENS</div>
                <div style={{ fontSize: 20, letterSpacing: 3, color: "#ffd8a8", marginTop: 4 }}>{decode("A. VANCE · COORDENANDO A OFENSIVA", f, coordAt, 2.4)}</div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
      {f >= hearAt && f < isAt ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 70, textAlign: "center", fontFamily: MONO, fontSize: 20, letterSpacing: 8, color: CREAM, opacity: P(f, hearAt, 8) * (1 - P(f, isAt - 8, 8)) }}>
          {f >= freqAt ? "FREQUÊNCIAS INTERCEPTADAS" : "UMA VOZ NO RÁDIO"}
        </div>
      ) : null}
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life, 6), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ================================================================================================= 62:00 a janela (a impressão do Kleiner)
// POV na bancada do Kleiner (navio da resistência): a impressora matricial cospe o papel com a reconstrução — a linha do tempo a
// partir de GORDON CAI EM XEN, a curva de sincronia do Borealis oscilando em volta da linha do PRESENTE → "não permaneceu no
// Borealis" → a primeira vez que a curva toca o presente: a JANELA (o Kleiner circula a caneta vermelha) → o crachá da Alyx preso
// com clipe nesse ponto: SAIU COM OS ADVISORS → datilografado: FUNÇÃO: ______ · "muito específica" grifado duas vezes.
const PW = 1000;
const PH = 700;
const SyncPaper: React.FC<{ f: number; rebuildAt: number; xenAt: number; stayAt: number; windowAt: number; leftAt: number; roleAt: number; specAt: number }> = ({ f, rebuildAt, xenAt, stayAt, windowAt, leftAt, roleAt, specAt }) => {
  const printed = P(f, rebuildAt, 130);
  const curve = Array.from({ length: 120 }).map((_, i) => {
    const x = 120 + i * 7;
    const t = i / 119;
    const amp = 150 * (1 - t * 0.55);
    const y = 300 - amp * Math.sin(t * 9 + 0.6) * (0.6 + 0.4 * Math.cos(t * 3));
    return [x, Math.min(y, 300 + amp)] as [number, number];
  });
  // a primeira vez que encosta no presente (y ≈ 300 subindo), perto do meio
  const wi = curve.findIndex(([x, y], i) => i > 30 && Math.abs(y - 300) < 10);
  const wx = curve[Math.max(0, wi)][0];
  const ink = "#1c2a44";
  return (
    <svg width={PW} height={PH} viewBox={`0 0 ${PW} ${PH}`}>
      <defs>
        <clipPath id="spPrint">
          <rect x={0} y={0} width={PW} height={PH * printed} />
        </clipPath>
        <pattern id="spHoles" width="40" height="40" patternUnits="userSpaceOnUse">
          <circle cx={20} cy={20} r={7} fill="#2a2620" />
        </pattern>
      </defs>
      <rect width={PW} height={PH} fill="#ece6d4" />
      {Array.from({ length: 18 }).map((_, i) => <rect key={i} x={0} y={i * 40} width={PW} height={20} fill="rgba(150,190,150,0.13)" />)}
      <rect x={0} y={0} width={40} height={PH} fill="url(#spHoles)" />
      <rect x={PW - 40} y={0} width={40} height={PH} fill="url(#spHoles)" />
      <g clipPath="url(#spPrint)" fontFamily="'Courier New', monospace">
        <text x={80} y={60} fill={ink} fontSize={24} letterSpacing={4}>RECONSTRUÇÃO · SINCRONIA DO BOREALIS</text>
        <text x={80} y={90} fill={ink} fontSize={16} letterSpacing={3} opacity={0.75}>DR. I. KLEINER · DADOS PARCIAIS</text>
        <line x1={110} y1={300} x2={960} y2={300} stroke={ink} strokeWidth={2} strokeDasharray="8 6" />
        <text x={960} y={290} textAnchor="end" fill={ink} fontSize={16} letterSpacing={3}>PRESENTE</text>
        <line x1={120} y1={130} x2={120} y2={480} stroke={ink} strokeWidth={2.5} />
        <text x={128} y={500} fill={ink} fontSize={16} letterSpacing={2}>GORDON CAI EM XEN</text>
        <polyline points={curve.map(([x, y]) => `${x},${y}`).join(" ")} fill="none" stroke={ink} strokeWidth={3} strokeDasharray="2 3" />
        {/* "não permaneceu no Borealis": o trecho dentro do navio termina na janela */}
        <text x={150} y={560} fill={ink} fontSize={18} letterSpacing={2} opacity={P(f, stayAt, 8)}>ALYX · NO BOREALIS ──────────►</text>
      </g>
      {/* as anotações à mão (caneta vermelha) */}
      {f >= windowAt ? <ellipse cx={wx} cy={300} rx={46} ry={30} fill="none" stroke="#b8261c" strokeWidth={4} pathLength={1} strokeDasharray={`${P(f, windowAt, 14)} 1`} transform={`rotate(-8 ${wx} 300)`} /> : null}
      {f >= windowAt + 8 ? <text x={wx - 30} y={250} fill="#b8261c" fontFamily="'Caveat', 'Segoe Print', cursive" fontSize={38} opacity={P(f, windowAt + 8, 8)}>janela!</text> : null}
      {f >= xenAt ? <path d="M 118 470 l 0 -30 M 106 452 l 12 -14 l 12 14" stroke="#b8261c" strokeWidth={3} fill="none" opacity={P(f, xenAt, 8)} /> : null}
      {f >= leftAt ? <path d={`M ${wx} 330 C ${wx + 20} 400, ${wx + 60} 420, ${wx + 120} 440`} stroke="#b8261c" strokeWidth={3} fill="none" pathLength={1} strokeDasharray={`${P(f, leftAt, 12)} 1`} /> : null}
      {f >= leftAt + 6 ? <text x={wx + 130} y={452} fill="#b8261c" fontFamily="'Caveat', 'Segoe Print', cursive" fontSize={34} opacity={P(f, leftAt + 6, 8)}>saiu c/ os Advisors</text> : null}
      {/* datilografado: a função */}
      {f >= roleAt ? (
        <g fontFamily="'Courier New', monospace">
          <text x={80} y={630} fill={ink} fontSize={30} letterSpacing={3}>{"FUNÇÃO: ".slice(0, Math.max(0, Math.floor((f - roleAt) * 0.7)))}</text>
          {f >= roleAt + 14 ? <line x1={250} y1={634} x2={250 + 380 * P(f, roleAt + 14, 16)} y2={634} stroke={ink} strokeWidth={2.5} /> : null}
          {f >= specAt ? <text x={660} y={628} fill="#b8261c" fontFamily="'Caveat', 'Segoe Print', cursive" fontSize={36} opacity={P(f, specAt, 8)}>muito específica</text> : null}
          {f >= specAt + 6 ? <path d="M 660 640 l 230 -4 M 664 652 l 222 -3" stroke="#b8261c" strokeWidth={3} fill="none" pathLength={1} strokeDasharray={`${P(f, specAt + 6, 10)} 1`} /> : null}
        </g>
      ) : null}
    </svg>
  );
};
export const HL9SyncPrint: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [rebuildAt, xenAt, stayAt, windowAt, leftAt, roleAt, specAt] = ats(p, ["rebuildAt", "xenAt", "stayAt", "windowAt", "leftAt", "roleAt", "specAt"]);
  const G = useMemo(() => {
    const g = mk();
    g.room(-4, 4, 0, 6, 3, [62, 58, 50], [44, 38, 32], [30, 28, 26]);
    g.box(-2.2, 2.4, 0.85, 4.4, 1.6, 0.08, [88, 64, 42]);
    [[-2.1, 2.5], [2.1, 2.5], [-2.1, 3.9], [2.1, 3.9]].forEach(([x, y]) => g.box(x - 0.05, y - 0.05, 0, 0.1, 0.1, 0.85, [50, 38, 28]));
    // a impressora matricial no fundo da bancada
    g.box(-0.75, 3.35, 0.93, 1.5, 0.55, 0.32, [170, 164, 146]);
    g.box(-0.6, 3.36, 1.25, 1.2, 0.08, 0.04, [40, 40, 38]);
    g.quad([0.55, 3.349, 1.05], [0.65, 3.349, 1.05], [0.65, 3.349, 1.1], [0.55, 3.349, 1.1], [255, 120, 60], [0, -1, 0], { emit: 0.9, tag: "led" });
    // a luminária e a parede de trás com prateleiras
    g.box(1.6, 3.6, 0.93, 0.25, 0.25, 0.06, [30, 30, 30]);
    g.box(1.69, 3.69, 0.99, 0.06, 0.06, 0.8, [30, 30, 30]);
    g.prism(1.72, 3.5, 1.7, 1.86, 0.2, 8, [200, 60, 40]);
    for (let z = 1.4; z < 2.8; z += 0.55) g.box(-3.8, 5.6, z, 7.6, 0.4, 0.05, [70, 56, 40]);
    for (let i = 0; i < 14; i++) g.box(-3.6 + i * 0.52, 5.62, 1.45 + (i % 3) * 0.55, 0.3, 0.3, 0.34 + rnd(i) * 0.14, [90 + rnd(i) * 60, 70 + rnd(i * 3) * 40, 50]);
    return g.F;
  }, []);
  // perto do papel: começa olhando a impressora (o papel saindo) e desce acompanhando a impressão
  const e: Eye = { x: 0.03 * Math.sin(f / 60), y: keys(f, [[0, 2.15], [windowAt, 2.05], [life, 2.12]]), z: keys(f, [[0, 1.85], [life, 1.78]]), yaw: keys(f, [[0, 0.0], [leftAt, 0.03], [life, 0.02]]), pitch: keys(f, [[0, -0.55], [xenAt + 20, -0.8], [life, -0.84]]), F: 1150 };
  const live = G.map((fc) => (fc.tag === "led" ? { ...fc, emit: Math.floor(f / 5) % 2 && f < rebuildAt + 130 ? 1 : 0.35 } : fc));
  const lights: XL[] = [
    { x: 1.7, y: 3.3, z: 1.6, col: [255, 226, 170], k: 1.0, r: 3.2 },
    { x: 0, y: 1.0, z: 2.8, col: [200, 210, 230], k: 0.25, r: 6 },
  ];
  // o papel sai da impressora e vem deitado na bancada, na direção do Gordon
  const feed = P(f, rebuildAt, 130);
  const paperC: [V3, V3, V3, V3] = [[-0.62, 3.34, 0.94], [0.62, 3.34, 0.94], [0.62, 3.34 - 0.87 * Math.max(0.05, feed), 0.94], [-0.62, 3.34 - 0.87 * Math.max(0.05, feed), 0.94]];
  // a foto da Alyx presa com clipe no ponto da janela (no papel)
  const clipPt: V3 = [0.02, 3.34 - 0.87 * 0.47, 0.95];
  return (
    <AbsoluteFill style={{ background: "#050403", overflow: "hidden" }}>
      <XView e={e} faces={live} lights={lights} flash={0.15} amb={0.2} />
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <Pinned e={e} w={PW} h={Math.round(PH * Math.max(0.05, feed))} corners={paperC}>
          <div style={{ width: PW, height: Math.round(PH * Math.max(0.05, feed)), overflow: "hidden", boxShadow: "0 18px 30px rgba(0,0,0,0.5)" }}>
            <div style={{ transform: `translateY(${-PH * (1 - Math.max(0.05, feed))}px)` }}>
              <SyncPaper f={f} rebuildAt={rebuildAt} xenAt={xenAt} stayAt={stayAt} windowAt={windowAt} leftAt={leftAt} roleAt={roleAt} specAt={specAt} />
            </div>
          </div>
        </Pinned>
        {f >= leftAt
          ? (() => {
              const c: [V3, V3, V3, V3] = [[clipPt[0] + 0.1, clipPt[1] + 0.02, 0.952], [clipPt[0] + 0.3, clipPt[1] + 0.05, 0.952], [clipPt[0] + 0.32, clipPt[1] - 0.2, 0.952], [clipPt[0] + 0.12, clipPt[1] - 0.23, 0.952]];
              return (
                <Pinned e={e} w={220} h={270} corners={c} o={P(f, leftAt, 8)}>
                  <div style={{ width: 220, height: 270, background: "#f4f0e6", padding: 10, boxSizing: "border-box", boxShadow: "0 10px 20px rgba(0,0,0,0.45)", position: "relative" }}>
                    <div style={{ width: 200, height: 200, backgroundImage: `url(${staticFile("hl3silh/alyx_badge.jpg")})`, backgroundSize: "cover", backgroundPosition: "50% 30%" }} />
                    <div style={{ fontFamily: "'Courier New', monospace", fontSize: 18, letterSpacing: 2, color: "#2a2418", marginTop: 10, textAlign: "center" }}>A. VANCE</div>
                    <div style={{ position: "absolute", left: 90, top: -18, width: 26, height: 60, border: "4px solid #9aa0a6", borderRadius: 13 }} />
                  </div>
                </Pinned>
              );
            })()
          : null}
      </div>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      </svg>
      <Hud f={f} yaw={e.yaw} eye={e} blips={[]} msg={f < xenAt ? "LABORATÓRIO DO KLEINER · NAVIO DA RESISTÊNCIA" : undefined} msgCol={AMB} />
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ================================================================================================= módulo 9 · leva B (62:15 → 64:50)
const PHOTO: Record<string, string> = { ALYX: "hl3silh/alyx_badge.jpg", GORDON: "hl3silh/gordon_retrato.png", ELI: "hl3silh/eli_retrato.png", BARNEY: "hl3silh/barney_badge.jpg", VARGA: "hl3silh/varga_retrato.png", KLEINER: "hl3silh/kleiner_retrato.png" };
// ficha com foto (o retrato real) e anotações à mão
const Dossier: React.FC<{ f: number; at: number; name: string; note?: string; noteAt?: number; x: number; y: number; w?: number; rot?: number; col?: string; o?: number }> = ({ f, at: t0, name, note, noteAt = 1e9, x, y, w = 300, rot = 0, col = AMB, o = 1 }) => {
  if (f < t0) return null;
  const k = P(f, t0, 12);
  const h = w * 1.28;
  return (
    <div style={{ position: "absolute", left: x - w / 2, top: y - h / 2, width: w, height: h, opacity: k * o, transform: `rotate(${rot}deg) translateY(${(1 - k) * 40}px)`, background: "#efe6cf", padding: 14, boxSizing: "border-box", boxShadow: "0 24px 50px rgba(0,0,0,0.65)" }}>
      <div style={{ width: "100%", height: w * 0.86, backgroundImage: `url(${staticFile(PHOTO[name] ?? PHOTO.ALYX)})`, backgroundSize: "cover", backgroundPosition: "50% 28%", filter: "contrast(1.05)" }} />
      <div style={{ fontFamily: "'Courier New', monospace", fontSize: w * 0.075, letterSpacing: 3, color: "#2a2418", marginTop: 8, borderBottom: `3px solid ${col}`, paddingBottom: 4 }}>{name}</div>
      {note && f >= noteAt ? (
        // 09/10 (pedido dele: desalinhada e ilegível em cima do branco): a nota numa etiqueta escura logo ABAIXO do card,
        // centrada e reta (o card gira, a etiqueta desfaz o giro)
        <div style={{ position: "absolute", left: w / 2 - w * 0.75, top: h + 16, width: w * 1.5, textAlign: "center", transform: `rotate(${-rot}deg)`, opacity: P(f, noteAt, 10) }}>
          <span style={{ display: "inline-block", padding: "6px 14px 8px", borderRadius: 8, background: "rgba(10,8,6,0.88)", border: `1.5px solid ${col}`, fontFamily: "'Caveat', 'Segoe Print', cursive", fontSize: w * 0.115, lineHeight: 1.1, color: "#ffc58a" }}>
            {note.slice(0, Math.max(0, Math.floor((f - noteAt) * 1.6)))}
          </span>
        </div>
      ) : null}
    </div>
  );
};

// ---------------------------------------------------------------- 62:15 ela conhece as pessoas
const GH_PATH: [number, number][] = [[260, 880], [360, 760], [520, 760], [600, 620], [780, 600], [860, 460], [1060, 450], [1160, 320], [1380, 300], [1500, 220]];
export const HL9KnowsThem: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [proveAt, knowAt, teamsAt, warAt, goodAt, notAt, peopleAt, barneyAt, eliAt, gordAt, ghostAt] = ats(p, ["proveAt", "knowAt", "teamsAt", "warAt", "goodAt", "notAt", "peopleAt", "barneyAt", "eliAt", "gordAt", "ghostAt"]);
  void proveAt;
  const drift = Math.sin(f / 80) * 10;
  const phase1 = 1 - P(f, peopleAt - 10, 14);
  const phase2 = P(f, peopleAt - 6, 14) * (1 - P(f, ghostAt - 8, 14));
  const ghost = P(f, ghostAt - 4, 14);
  const ax = keys(f, [[0, 960], [teamsAt, 960], [teamsAt + 20, 520], [warAt, 520], [warAt + 20, 700]]);
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, #141018 0%, #050407 80%)", overflow: "hidden" }}>
      {/* fase 1: o crachá, quem ela conhece, as outras equipes, a guerra de fora */}
      {phase1 > 0.01 ? (
        <AbsoluteFill style={{ opacity: phase1, transform: `translate(${drift}px, 70px) scale(1.32)`, transformOrigin: `${ax}px 380px` /* 09/10: o lambda vazava pelo topo */ }}>
          {f >= teamsAt ? (
            <AbsoluteFill style={{ opacity: 0.55 * P(f, teamsAt, 16), transform: "scale(1.05)" }}>
              <ArcticBase f={f} seed={4} y0={260} />
            </AbsoluteFill>
          ) : null}
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
            {f >= teamsAt
              ? [[1300, 360, "BOREALIS"], [1560, 520, "INSTALAÇÃO"], [1180, 560, "INSTALAÇÃO"], [1460, 300, ""]].map(([x, y, l], k) => (
                  <g key={k} opacity={P(f, teamsAt + 8 + k * 5, 8)}>
                    <IcoComb x={x as number} y={y as number} s={1.2} />
                    {l ? <text x={(x as number) + 30} y={(y as number) + 6} fill={RED} fontFamily={MONO} fontSize={16} letterSpacing={3} style={{ paintOrder: "stroke", stroke: "#000", strokeWidth: 4 }}>{l as string}</text> : null}
                  </g>
                ))
              : null}
            {f >= teamsAt + 14 ? <text x={1180} y={240} fill={RED} fontFamily={MONO} fontSize={18} letterSpacing={5} opacity={P(f, teamsAt + 14, 8)}>OUTRAS EQUIPES · BOREALIS E ÁRTICO</text> : null}
            {/* a guerra do lado de fora: a frente de batalha */}
            {f >= warAt ? <path d="M 200 760 C 400 700, 600 820, 820 740 S 1100 820, 1300 760" fill="none" stroke={ORANGE} strokeWidth={4} strokeDasharray={`${1300 * P(f, warAt, 20)} 1300`} /> : null}
            {f >= warAt + 8 ? <text x={220} y={820} fill={ORANGE} fontFamily={MONO} fontSize={18} letterSpacing={5} opacity={P(f, warAt + 8, 8)}>A GUERRA · DO LADO DE FORA · ELA COORDENA</text> : null}
            {/* quem ela conhece: linhas até ela */}
            {f >= knowAt
              ? [[ax - 380, 300], [ax + 380, 300], [ax, 120]].map(([x, y], k) => <line key={k} x1={ax} y1={470} x2={x} y2={y + 80} stroke="rgba(255,178,46,0.4)" strokeWidth={2} strokeDasharray="6 6" opacity={P(f, knowAt + k * 5, 10) * (1 - P(f, teamsAt, 10))} />)
              : null}
          </svg>
          {f >= knowAt && f < teamsAt + 12
            ? [["GORDON", -380, 300], ["ELI", 380, 300]].map(([n, dx, y], k) => (
                <div key={n as string} style={{ position: "absolute", left: ax + (dx as number) - 80, top: (y as number) - 60, width: 160, opacity: P(f, knowAt + k * 5, 10) * (1 - P(f, teamsAt, 10)) }}>
                  <svg width={160} height={180} style={{ overflow: "visible" }}>
                    <FlagBadge cx={80} by={170} k={1.3} label={n as string} col={AMB} f={f} />
                  </svg>
                </div>
              ))
            : null}
          {f >= knowAt + 10 && f < teamsAt + 12 ? (
            <div style={{ position: "absolute", left: ax - 70, top: 70, width: 140, height: 140, borderRadius: "50%", border: `3px solid ${AMB}`, background: "rgba(30,18,4,0.9)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Georgia, serif", fontSize: 80, fontWeight: 700, color: AMB, opacity: P(f, knowAt + 10, 10) * (1 - P(f, teamsAt, 10)) }}>λ</div>
          ) : null}
          {/* o crachá da Alyx: lealdade a provar */}
          <div style={{ position: "absolute", left: ax - 170, top: 380, width: 340, padding: 14, borderRadius: 12, background: "rgba(14,10,4,0.92)", border: `2px solid ${ORANGE}`, boxShadow: "0 20px 50px rgba(0,0,0,0.7)", display: "flex", gap: 14, opacity: P(f, 4, 12) }}>
            <div style={{ width: 110, height: 140, borderRadius: 8, flexShrink: 0, backgroundImage: `url(${staticFile(PHOTO.ALYX)})`, backgroundSize: "cover", backgroundPosition: "50% 28%", border: `2px solid ${ORANGE}` }} />
            <div style={{ fontFamily: MONO }}>
              <div style={{ fontSize: 14, letterSpacing: 4, color: ORANGE }}>ALYX VANCE</div>
              <div style={{ fontSize: 13, letterSpacing: 3, color: "rgba(242,240,247,0.7)", marginTop: 10 }}>LEALDADE AOS COMBINE</div>
              <div style={{ marginTop: 6, height: 10, width: 170, border: "1px solid rgba(242,240,247,0.5)" }}>
                <div style={{ height: "100%", width: `${Math.min(100, 8 + 92 * P(f, goodAt, 40))}%`, background: f >= goodAt ? ORANGE : "rgba(255,150,60,0.5)" }} />
              </div>
              <div style={{ fontSize: 14, letterSpacing: 3, color: f >= goodAt ? ORANGE : CREAM, marginTop: 8 }}>{f >= goodAt ? "PROVADA EM CAMPO" : "A PROVAR"}</div>
            </div>
          </div>
          {/* assustadoramente boa: o placar; não é estratégia */}
          {f >= goodAt ? (
            <div style={{ position: "absolute", right: 110, top: 640, width: 460, padding: "16px 20px", borderRadius: 12, background: "rgba(8,8,10,0.85)", border: `1.5px solid ${ORANGE}`, fontFamily: MONO, opacity: P(f, goodAt, 8) }}>
              {[["ROTAS PREVISTAS", "9 / 9"], ["EMBOSCADAS EVITADAS", "4 / 4"], ["PERDAS COMBINE", "MÍNIMAS"]].map(([a, b], k) => (
                <div key={a} style={{ display: "flex", justifyContent: "space-between", fontSize: 20, letterSpacing: 3, color: TXT, marginTop: k ? 8 : 0, opacity: P(f, goodAt + k * 5, 6) }}>
                  <span>{a}</span>
                  <span style={{ color: ORANGE }}>{b}</span>
                </div>
              ))}
              {f >= notAt ? (
                <div style={{ position: "relative", marginTop: 14, fontSize: 22, letterSpacing: 4, color: "rgba(242,240,247,0.6)", opacity: P(f, notAt, 8) }}>
                  GRANDE ESTRATEGISTA
                  <div style={{ position: "absolute", left: -4, right: 120, top: "50%", height: 3, background: RED, transform: `scaleX(${P(f, notAt + 6, 8)})`, transformOrigin: "left" }} />
                </div>
              ) : null}
            </div>
          ) : null}
        </AbsoluteFill>
      ) : null}
      {/* fase 2: as fichas — ela conhece aquelas pessoas */}
      {phase2 > 0.01 ? (
        <AbsoluteFill style={{ opacity: phase2, background: "radial-gradient(ellipse at 50% 40%, rgba(60,40,20,0.4), rgba(0,0,0,0) 70%)" }}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 80, textAlign: "center", fontFamily: MONO, fontSize: 20, letterSpacing: 8, color: CREAM, opacity: P(f, peopleAt, 8) }}>ELA CONHECE AQUELAS PESSOAS</div>
          <Dossier f={f} at={barneyAt - 4} name="BARNEY" note="pensa nos outros primeiro · sempre a ponte" noteAt={barneyAt + 8} x={430} y={460} rot={-5} />
          <Dossier f={f} at={eliAt - 4} name="ELI" note="não larga uma posição com feridos" noteAt={eliAt + 8} x={960} y={430} rot={2} />
          <Dossier f={f} at={gordAt - 4} name="GORDON" note="vai pelo caminho que ninguém atravessa" noteAt={gordAt + 8} x={1490} y={470} rot={5} />
        </AbsoluteFill>
      ) : null}
      {/* fase 3 (09/10, pedido dele: a animação estava feia): o mapa tático da batalha visto de cima, com relevo em curvas
          de nível; a rota da Resistência passa por 4 pontos; o "fantasma" de quem já terminou a fase chega antes em CADA
          ponto (rastro branco), o Gordon chega depois; cada ponto marca o tempo dela × o dele (+ em vermelho). */}
      {ghost > 0.01
        ? (() => {
            const CPS: [number, number, string][] = [[330, 800, "A PONTE"], [760, 640, "O DESFILADEIRO"], [1180, 520, "O PORTÃO"], [1600, 330, "A TORRE"]];
            const ROUTE: [number, number][] = [[150, 900], [330, 800], [520, 760], [760, 640], [960, 610], [1180, 520], [1400, 460], [1600, 330], [1760, 260]];
            const T0 = ghostAt;
            const span = Math.max(40, life - T0 - 12);
            const tg = Math.min(1, Math.max(0, (f - T0) / (span * 0.78)));
            const td = Math.min(1, Math.max(0, (f - T0 - span * 0.16) / (span * 0.84)));
            const segLen = (pts: [number, number][]) => pts.slice(1).reduce((s2, q, i) => s2 + Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1]), 0);
            const total = segLen(ROUTE);
            const cpT = CPS.map(([x, y]) => {
              const k = ROUTE.findIndex((q) => q[0] === x && q[1] === y);
              return segLen(ROUTE.slice(0, k + 1)) / total;
            });
            const gp = alongP(ROUTE, tg);
            const dp = alongP(ROUTE, td);
            const fmt = (u: number) => {
              const sec = 9.2 + u * 41.3;
              return `${String(Math.floor(sec / 60)).padStart(2, "0")}:${(sec % 60).toFixed(2).padStart(5, "0")}`;
            };
            return (
              <AbsoluteFill style={{ opacity: ghost, background: "radial-gradient(ellipse at 50% 55%, #0d1a16 0%, #050807 80%)" }}>
                <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
                  <defs>
                    <filter id="khGlow"><feGaussianBlur stdDeviation="6" /></filter>
                  </defs>
                  {/* relevo em curvas de nível */}
                  {Array.from({ length: 14 }).map((_, i) => (
                    <ellipse key={i} cx={980 + Math.sin(i) * 60} cy={560 + Math.cos(i * 0.7) * 30} rx={180 + i * 70} ry={90 + i * 34} fill="none" stroke="rgba(141,255,168,0.07)" strokeWidth={1.4} transform={`rotate(-18 960 540)`} />
                  ))}
                  {Array.from({ length: 24 }).map((_, i) => <line key={"g" + i} x1={i * 84} x2={i * 84} y1={0} y2={1080} stroke="rgba(141,255,168,0.04)" />)}
                  {/* a rota */}
                  <path d={pd(ROUTE)} fill="none" stroke="rgba(242,240,247,0.18)" strokeWidth={26} strokeLinejoin="round" strokeLinecap="round" />
                  <path d={pd(ROUTE)} fill="none" stroke="rgba(242,240,247,0.45)" strokeWidth={2} strokeDasharray="10 12" strokeDashoffset={-f * 1.5} />
                  {/* os pontos de checagem e os tempos */}
                  {CPS.map(([x, y, name], k) => {
                    const gHit = tg >= cpT[k];
                    const dHit = td >= cpT[k];
                    const up = k % 2 === 0;
                    return (
                      <g key={name}>
                        <circle cx={x} cy={y} r={22} fill="rgba(5,8,7,0.9)" stroke={dHit ? ORANGE : gHit ? "#e8f4ff" : "rgba(242,240,247,0.35)"} strokeWidth={3} />
                        <text x={x} y={y + 6} textAnchor="middle" fill={dHit ? ORANGE : "rgba(242,240,247,0.7)"} fontFamily={MONO} fontSize={16}>{k + 1}</text>
                        <text x={x} y={up ? y - 74 : y + 56} textAnchor="middle" fill="rgba(242,240,247,0.8)" fontFamily={MONO} fontSize={15} letterSpacing={3}>{name}</text>
                        {gHit ? <text x={x} y={up ? y - 50 : y + 80} textAnchor="middle" fill="#e8f4ff" fontFamily={MONO} fontSize={16} letterSpacing={2} opacity={P(f, T0 + cpT[k] * span * 0.78, 6)}>{`ELA ${fmt(cpT[k])}`}</text> : null}
                        {dHit ? <text x={x} y={up ? y - 30 : y + 100} textAnchor="middle" fill={RED} fontFamily={MONO} fontSize={16} letterSpacing={2} opacity={P(f, T0 + span * 0.16 + cpT[k] * span * 0.84, 6)}>{`GORDON +${(1.1 + k * 0.6).toFixed(1)}s`}</text> : null}
                      </g>
                    );
                  })}
                  {/* o fantasma: branco translúcido com rastro */}
                  {Array.from({ length: 22 }).map((_, i) => {
                    const q = alongP(ROUTE, Math.max(0, tg - i * 0.008));
                    return <circle key={i} cx={q[0]} cy={q[1]} r={13 - i * 0.45} fill="rgba(235,245,255,0.9)" opacity={(1 - i / 22) * 0.32} />;
                  })}
                  <circle cx={gp[0]} cy={gp[1]} r={22} fill="rgba(235,245,255,0.75)" filter="url(#khGlow)" />
                  <circle cx={gp[0]} cy={gp[1]} r={10} fill="#ffffff" />
                  {/* o Gordon */}
                  <circle cx={dp[0]} cy={dp[1]} r={13} fill={ORANGE} stroke="#140a02" strokeWidth={3} />
                  <path d={`M ${dp[0] - 6} ${dp[1] + 4} L ${dp[0]} ${dp[1] - 7} L ${dp[0] + 6} ${dp[1] + 4}`} fill="none" stroke="#140a02" strokeWidth={2.5} />
                </svg>
                {/* a legenda e o relógio, num canto só (nada sobreposto) */}
                <div style={{ position: "absolute", left: 90, top: 110, padding: "16px 22px", borderRadius: 12, background: "rgba(8,10,9,0.86)", border: "1.5px solid rgba(235,245,255,0.55)", fontFamily: MONO, color: "#e8f4ff", width: 470 }}>
                  <div style={{ fontSize: 15, letterSpacing: 5, opacity: 0.8 }}>MELHOR TEMPO · DE QUEM JÁ TERMINOU A FASE</div>
                  <div style={{ fontSize: 40, letterSpacing: 4, marginTop: 6 }}>{fmt(tg)}</div>
                  <div style={{ display: "flex", gap: 22, marginTop: 10, fontSize: 15, letterSpacing: 3 }}>
                    <span><span style={{ display: "inline-block", width: 12, height: 12, borderRadius: 6, background: "#ffffff", boxShadow: "0 0 8px #fff", marginRight: 8 }} />FANTASMA</span>
                    <span style={{ color: ORANGE }}><span style={{ display: "inline-block", width: 12, height: 12, borderRadius: 6, background: ORANGE, marginRight: 8 }} />GORDON</span>
                  </div>
                </div>
              </AbsoluteFill>
            );
          })()
        : null}
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 62:55 as ordens estranhas (POV na batalha)
export const HL9Orders: React.FC<PR> = (p) => {
  // 09/10 (pedido dele: genérico, o "tanque" feio, coisas sumindo do nada, Strider e gunship feios — reestruturar): a
  // batalha no MESMO mapa tático da cena anterior (linguagem de interface, inclinado em perspectiva). Tudo que aparece
  // fica até o fim ou sai com movimento claro: a Resistência (laranja) presa entre o Strider (norte) e a artilharia
  // Combine (leste); os esquadrões fecham o cerco; a ordem da Alyx entra na fita → 3 esquadrões saem em fila para o setor 9
  // (vazio) e abre a passagem (seta verde) por onde o Gordon passa. "Acontece de novo": a ofensiva para antes do fim
  // (seta que trava), o gunship desvia (rota que curva), a patrulha que vencia recua.
  const f = useCurrentFrame();
  const life = p.life;
  const [notAt, stuckAt, loseAt, cercoAt, orderAt, leaveAt, guardAt, openAt, againAt, offAt, gunAt, patAt] = ats(p, ["notAt", "stuckAt", "loseAt", "cercoAt", "orderAt", "leaveAt", "guardAt", "openAt", "againAt", "offAt", "gunAt", "patAt"]);
  void notAt;
  const RES: [number, number] = [860, 600]; // a Resistência
  const STR: [number, number] = [900, 250]; // o Strider
  const ART: [number, number] = [1420, 560]; // a artilharia
  const SEC9: [number, number] = [1560, 900]; // o setor 9 (sem ameaça)
  const GAP: [number, number] = [520, 380]; // a passagem
  const tilt = 34 - 6 * P(f, againAt, 40);
  const zoom = 1.05 + 0.08 * P(f, stuckAt, 60) - 0.06 * P(f, againAt, 40);
  const cx = interpolate(f, [0, openAt, openAt + 40, life], [0, 0, 120, 60], C);
  // esquadrões: 6 em volta; 3 (os da ordem) saem em fila para o setor 9
  const SQ: [number, number][] = [[620, 520], [700, 760], [1040, 790], [1130, 640], [1060, 430], [700, 400]];
  const leaving = [2, 3, 4];
  const close = P(f, cercoAt, 70);
  const sq = SQ.map(([x, y], k) => {
    const cx0 = RES[0] + (x - RES[0]) * (1.25 - 0.45 * close);
    const cy0 = RES[1] + (y - RES[1]) * (1.25 - 0.45 * close);
    const li = leaving.indexOf(k);
    if (li < 0) return { x: cx0, y: cy0, gone: false };
    const u = IOx((f - leaveAt - li * 10) / 50);
    return { x: cx0 + (SEC9[0] + (li - 1) * 50 - cx0) * u, y: cy0 + (SEC9[1] - cx0 * 0 - cy0) * u, gone: u > 0 };
  });
  const firing = f >= stuckAt && f < offAt;
  const pulse = firing ? ((f - stuckAt) % 22) / 22 : -1;
  const open = P(f, openAt, 20);
  const gord = IOx((f - openAt - 12) / 60);
  const off = P(f, offAt - 6, 30);
  const gs = Math.max(0, (f - gunAt) / 80);
  const pat = IOx((f - patAt) / 50);
  const orders: [number, string][] = [
    [orderAt, "UNIDADES 3–5 · ABANDONAR POSIÇÃO"],
    [guardAt, "PROTEGER SETOR 9 · SEM AMEAÇA"],
    [offAt, "OFENSIVA · SUSPENDER"],
    [gunAt, "GUNSHIP · MUDAR DE ROTA"],
    [patAt, "PATRULHA 2 · RECUAR"],
  ];
  const IcoSquad: React.FC<{ x: number; y: number; o?: number }> = ({ x, y, o = 1 }) => (
    <g transform={`translate(${x} ${y})`} opacity={o}>
      <rect x={-17} y={-11} width={34} height={22} rx={3} fill="rgba(40,8,8,0.9)" stroke={RED} strokeWidth={2.5} />
      <path d="M -17 -11 L 17 11 M 17 -11 L -17 11" stroke={RED} strokeWidth={2} />
    </g>
  );
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 55%, #0d1a16 0%, #050807 80%)", overflow: "hidden", perspective: 1600 }}>
      <AbsoluteFill style={{ transform: `translateX(${-cx}px) rotateX(${tilt}deg) scale(${zoom})`, transformOrigin: "50% 60%" }}>
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          <defs>
            <filter id="ordGlow"><feGaussianBlur stdDeviation="5" /></filter>
            <marker id="ordArr" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M 0 0 L 10 5 L 0 10 Z" fill={GREEN} /></marker>
            <marker id="ordArrR" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M 0 0 L 10 5 L 0 10 Z" fill={RED} /></marker>
          </defs>
          {/* o terreno: curvas de nível, grade, o rio e a encosta */}
          {Array.from({ length: 16 }).map((_, i) => (
            <ellipse key={i} cx={980 + Math.sin(i) * 60} cy={560 + Math.cos(i * 0.7) * 30} rx={160 + i * 72} ry={84 + i * 36} fill="none" stroke="rgba(141,255,168,0.08)" strokeWidth={1.4} transform="rotate(-18 960 540)" />
          ))}
          {Array.from({ length: 24 }).map((_, i) => <line key={"v" + i} x1={i * 84} x2={i * 84} y1={0} y2={1080} stroke="rgba(141,255,168,0.05)" />)}
          {Array.from({ length: 14 }).map((_, i) => <line key={"h" + i} x1={0} x2={1920} y1={i * 84} y2={i * 84} stroke="rgba(141,255,168,0.05)" />)}
          <path d="M 0 960 C 400 900 700 1000 1100 960 S 1700 880 1920 920" fill="none" stroke="rgba(120,180,220,0.35)" strokeWidth={14} />
          {/* o setor 9 (vazio) */}
          <rect x={SEC9[0] - 110} y={SEC9[1] - 70} width={220} height={140} rx={8} fill="none" stroke="rgba(242,240,247,0.3)" strokeWidth={2} strokeDasharray="8 8" />
          <text x={SEC9[0]} y={SEC9[1] - 84} textAnchor="middle" fill="rgba(242,240,247,0.6)" fontFamily={MONO} fontSize={18} letterSpacing={4}>SETOR 9 · SEM AMEAÇA</text>
          {/* o Strider (norte): ícone de tripé visto de cima */}
          <g transform={`translate(${STR[0]} ${STR[1]})`} opacity={P(f, stuckAt, 14)}>
            <circle r={32} fill="rgba(40,8,8,0.9)" stroke={RED} strokeWidth={3} />
            {[0, 1, 2].map((k) => {
              const a = (k / 3) * Math.PI * 2 - Math.PI / 2 + Math.sin(f / 30) * 0.05;
              return <line key={k} x1={Math.cos(a) * 32} y1={Math.sin(a) * 32} x2={Math.cos(a) * 92} y2={Math.sin(a) * 92} stroke={RED} strokeWidth={5} strokeLinecap="round" />;
            })}
            <circle r={9} fill="#9fe6ff" />
            <text y={-110} textAnchor="middle" fill={RED} fontFamily={MONO} fontSize={22} letterSpacing={5}>STRIDER</text>
          </g>
          {/* a artilharia (leste): bloco com o cano apontado para a Resistência */}
          <g transform={`translate(${ART[0]} ${ART[1]})`} opacity={P(f, stuckAt + 6, 14)}>
            <rect x={-40} y={-40} width={80} height={80} rx={6} fill="rgba(40,8,8,0.9)" stroke={RED} strokeWidth={3} />
            <g transform={`rotate(${(Math.atan2(RES[1] - ART[1], RES[0] - ART[0]) * 180) / Math.PI})`}>
              <rect x={20} y={-8} width={90 - 14 * (1 - off) * (pulse >= 0 && pulse < 0.15 ? 1 : 0)} height={16} rx={3} fill={RED} />
            </g>
            <text y={74} textAnchor="middle" fill={RED} fontFamily={MONO} fontSize={20} letterSpacing={4}>{f >= offAt ? "ARTILHARIA · PAROU" : "ARTILHARIA COMBINE"}</text>
          </g>
          {/* os disparos: projéteis da artilharia caindo perto da Resistência (param na ordem) */}
          {pulse >= 0 ? (() => {
            const u = pulse / 0.6;
            if (u > 1) {
              const ex = (pulse - 0.6) / 0.4;
              return <circle cx={RES[0] + 60} cy={RES[1] - 40} r={20 + ex * 70} fill="none" stroke="#ffc46a" strokeWidth={4 * (1 - ex)} opacity={1 - ex} />;
            }
            const x = ART[0] + (RES[0] + 60 - ART[0]) * u, y = ART[1] + (RES[1] - 40 - ART[1]) * u - Math.sin(u * Math.PI) * 120;
            return <circle cx={x} cy={y} r={8} fill="#ffe08a" filter="url(#ordGlow)" />;
          })() : null}
          {/* o cerco */}
          {f >= cercoAt ? <circle cx={RES[0]} cy={RES[1]} r={340 - 150 * close + 160 * P(f, leaveAt + 20, 40)} fill="none" stroke={RED} strokeWidth={3} strokeDasharray="14 10" strokeDashoffset={f} opacity={P(f, cercoAt, 10) * (1 - P(f, openAt, 20))} /> : null}
          {/* os esquadrões */}
          {f >= stuckAt ? sq.map((s2, k) => <IcoSquad key={k} x={s2.x} y={s2.y} o={P(f, stuckAt + k * 4, 10)} />) : null}
          {/* as rotas dos que saem */}
          {f >= leaveAt
            ? leaving.map((k, li) => {
                const from = SQ[k];
                const x0 = RES[0] + (from[0] - RES[0]) * 0.8, y0 = RES[1] + (from[1] - RES[1]) * 0.8;
                return <path key={k} d={`M ${x0} ${y0} Q ${(x0 + SEC9[0]) / 2 + 80} ${(y0 + SEC9[1]) / 2 - 40} ${SEC9[0] + (li - 1) * 50} ${SEC9[1]}`} fill="none" stroke="rgba(255,93,77,0.6)" strokeWidth={2} strokeDasharray="6 8" markerEnd="url(#ordArrR)" opacity={P(f, leaveAt + li * 10, 10)} />;
              })
            : null}
          {/* a passagem que abre e o Gordon passando */}
          {open > 0 ? (
            <g opacity={open}>
              <path d={`M ${RES[0] - 40} ${RES[1] - 30} Q ${(RES[0] + GAP[0]) / 2 - 20} ${(RES[1] + GAP[1]) / 2 + 30} ${GAP[0]} ${GAP[1]}`} fill="none" stroke={GREEN} strokeWidth={5} strokeDasharray={`${700 * open} 700`} markerEnd="url(#ordArr)" style={{ filter: "drop-shadow(0 0 8px #8dffa8)" }} />
              <text x={GAP[0] - 20} y={GAP[1] - 30} textAnchor="middle" fill={GREEN} fontFamily={MONO} fontSize={20} letterSpacing={4}>A PASSAGEM QUE O GORDON PRECISAVA</text>
            </g>
          ) : null}
          {/* a Resistência (e o Gordon saindo pela passagem) */}
          <g transform={`translate(${RES[0]} ${RES[1]})`}>
            <circle r={46} fill="rgba(40,24,4,0.9)" stroke={ORANGE} strokeWidth={3} />
            <text y={9} textAnchor="middle" fill={ORANGE} fontFamily="Georgia, serif" fontSize={34} fontWeight={700}>λ</text>
            <text y={76} textAnchor="middle" fill={ORANGE} fontFamily={MONO} fontSize={20} letterSpacing={4}>RESISTÊNCIA</text>
          </g>
          {gord > 0 ? (() => {
            const u = gord;
            const x = (1 - u) * (1 - u) * (RES[0] - 40) + 2 * (1 - u) * u * ((RES[0] + GAP[0]) / 2 - 20) + u * u * GAP[0];
            const y = (1 - u) * (1 - u) * (RES[1] - 30) + 2 * (1 - u) * u * ((RES[1] + GAP[1]) / 2 + 30) + u * u * GAP[1];
            return (
              <g>
                <circle cx={x} cy={y} r={15} fill={ORANGE} stroke="#140a02" strokeWidth={3} />
                <text x={x + 24} y={y + 6} fill={ORANGE} fontFamily={MONO} fontSize={18} letterSpacing={3}>GORDON</text>
              </g>
            );
          })() : null}
          {/* acontece de novo: a ofensiva que para antes de terminar */}
          {f >= againAt ? (
            <g opacity={P(f, againAt, 10)}>
              <path d={`M 1820 760 L ${1820 - 300 * P(f, againAt, 30)} ${760 - 60 * P(f, againAt, 30)}`} fill="none" stroke={RED} strokeWidth={8} markerEnd="url(#ordArrR)" />
              {f >= offAt ? <path d="M 1490 680 l 40 40 m 0 -40 l -40 40" stroke="#f2f0f7" strokeWidth={6} opacity={P(f, offAt, 8)} /> : null}
              <text x={1740} y={672} textAnchor="middle" fill={RED} fontFamily={MONO} fontSize={18} letterSpacing={3}>{f >= offAt ? "OFENSIVA · PAROU ANTES" : "OFENSIVA COMBINE"}</text>
            </g>
          ) : null}
          {/* o gunship: vem em linha reta e curva para longe */}
          {f >= gunAt ? (() => {
            const pts = Array.from({ length: 30 }).map((_, i) => {
              const u = (i / 29) * Math.min(1, gs);
              return [160 + 560 * u - 900 * Math.max(0, u - 0.5) ** 2, 220 + 200 * u - 1100 * Math.max(0, u - 0.5) ** 2] as [number, number];
            });
            const h = pts[pts.length - 1];
            const pv = pts[Math.max(0, pts.length - 3)];
            const ang = (Math.atan2(h[1] - pv[1], h[0] - pv[0]) * 180) / Math.PI;
            return (
              <g opacity={P(f, gunAt, 8)}>
                <polyline points={pts.map((q) => q.join(",")).join(" ")} fill="none" stroke="rgba(255,93,77,0.55)" strokeWidth={3} strokeDasharray="8 8" />
                <g transform={`translate(${h[0]} ${h[1]}) rotate(${ang})`}>
                  <path d="M 28 0 L -18 -12 L -28 -4 L -40 -8 L -34 0 L -40 8 L -28 4 L -18 12 Z" fill="rgba(40,8,8,0.95)" stroke={RED} strokeWidth={2.5} />
                </g>
                <text x={150} y={190} fill={RED} fontFamily={MONO} fontSize={18} letterSpacing={4}>GUNSHIP · MUDA DE ROTA</text>
              </g>
            );
          })() : null}
          {/* a patrulha que vencia e recua */}
          {f >= patAt ? (
            <g opacity={P(f, patAt, 8)}>
              <IcoSquad x={380 + 200 * (1 - pat)} y={700 + 40 * (1 - pat)} />
              <path d={`M 600 740 L ${600 - 220 * pat} ${740 - 40 * pat}`} fill="none" stroke="rgba(255,93,77,0.7)" strokeWidth={3} markerEnd="url(#ordArrR)" />
              <text x={420} y={660} textAnchor="middle" fill={RED} fontFamily={MONO} fontSize={18} letterSpacing={3}>PATRULHA · RECUA VENCENDO</text>
            </g>
          ) : null}
        </svg>
      </AbsoluteFill>
      {/* a fita das ordens interceptadas (assinadas) */}
      {f >= orderAt ? (
        <div style={{ position: "absolute", right: 80, top: 120, width: 620, padding: "14px 18px", background: "linear-gradient(160deg, rgba(20,60,84,0.9), rgba(6,22,32,0.94))", clipPath: "polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px)", boxShadow: `inset 0 0 0 1.5px ${CYC}`, fontFamily: MONO, opacity: P(f, orderAt, 8) }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, letterSpacing: 4, color: CYC }}>
            <span>ORDENS INTERCEPTADAS</span>
            <span style={{ color: ORANGE }}>ASSINADO · A. VANCE</span>
          </div>
          {orders.filter(([t0]) => f >= t0).map(([t0, txt], i) => (
            <div key={i} style={{ marginTop: 10, fontSize: 19, letterSpacing: 2, color: "#dff8ff", opacity: P(f, t0, 8) }}>{`› ${decode(txt, f, t0, 2.4)}`}</div>
          ))}
        </div>
      ) : null}
      <div style={{ position: "absolute", left: 80, top: 110, fontFamily: MONO, letterSpacing: 6 }}>
        <div style={{ fontSize: 20, color: f >= againAt ? CREAM : RED }}>{f >= againAt ? "ACONTECE DE NOVO" : f >= openAt ? "ABRE A PASSAGEM" : f >= orderAt ? "UMA ORDEM DA ALYX" : f >= loseAt ? "ELES DEVERIAM PERDER ALI" : "ALGUMA COISA NÃO FECHA"}</div>
        <div style={{ fontSize: 15, color: "rgba(242,240,247,0.6)", marginTop: 6 }}>MAPA TÁTICO · A BATALHA</div>
      </div>
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 63:29 três leituras
export const HL9ThreeReads: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [vargaAt, eliAt, kleinerAt] = ats(p, ["vargaAt", "eliAt", "kleinerAt"]);
  const cards: [string, number, string, string][] = [
    ["VARGA", vargaAt, "“ela está brincando com a gente”", RED],
    ["ELI", eliAt, "“ainda tem alguma coisa da minha filha tentando ajudar”", AMB],
    ["KLEINER", kleinerAt, "não tem certeza de nada", ICE],
  ];
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, #14110c 0%, #050404 80%)", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 100, textAlign: "center", fontFamily: MONO, fontSize: 20, letterSpacing: 8, color: CREAM, opacity: P(f, 2, 10) }}>TRÊS LEITURAS DA MESMA ALYX</div>
      {cards.map(([n, t0, q, col], i) => {
        const speaking = f >= t0 && (i === 2 || f < cards[i + 1][1]);
        const k = P(f, t0, 12);
        return (
          <div key={n} style={{ position: "absolute", left: 230 + i * 520, top: 230, width: 420, opacity: f >= t0 ? 0.35 + 0.65 * (speaking ? 1 : 0.6) * k : 0.18, transform: `translateY(${(1 - k) * 30}px) scale(${speaking ? 1.04 : 1})` }}>
            <div style={{ width: 420, height: 420, borderRadius: 14, overflow: "hidden", border: `3px solid ${col}`, backgroundImage: `url(${staticFile(PHOTO[n])})`, backgroundSize: "cover", backgroundPosition: "50% 30%", filter: speaking ? "none" : "grayscale(0.7) brightness(0.7)" }} />
            <div style={{ marginTop: 12, padding: "8px 14px", background: col, color: "#0a0806", fontFamily: MONO, fontWeight: 700, fontSize: 20, letterSpacing: 5 }}>{n}</div>
            <svg width={420} height={60} style={{ marginTop: 8 }}>
              {Array.from({ length: 42 }).map((_, j) => {
                const h = speaking ? 4 + Math.abs(Math.sin(f / 2.6 + j * 0.7) * Math.sin(f / 7 + j * 0.3)) * 44 : 3;
                return <rect key={j} x={j * 10} y={30 - h / 2} width={5} height={h} fill={col} opacity={0.8} />;
              })}
            </svg>
            {f >= t0 + 6 ? <div style={{ marginTop: 8, fontFamily: FONT, fontWeight: 800, fontSize: 30, lineHeight: 1.15, color: TXT, opacity: P(f, t0 + 6, 8) }}>{i === 2 ? <span>{q} <span style={{ color: ICE }}>?</span></span> : q}</div> : null}
          </div>
        );
      })}
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life, 6), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 63:38 o procedimento (tela do Kleiner)
export const HL9Procedure: React.FC<PR> = (p) => {
  // 09/10 (pedido dele: texto demais e simples demais): o procedimento vira uma MÁQUINA — um anel Combine de 12 travas
  // que precisa acender inteiro. À esquerda a Alyx; cada cálculo dela é um pulso laranja que corre pelo cabo até o anel;
  // as travas acendem (verde) quando a etapa executa; no erro a trava trinca em vermelho e apaga; a correção acende de
  // novo; falha antes do fim. A última trava — o FIM — nunca acende. No centro, UMA palavra por vez.
  const f = useCurrentFrame();
  const life = p.life;
  const [listenAt, patAt, calcAt, execAt, advAt, wrongAt, recalcAt, corrAt, moreAt, failAt, watchAt, sayAt, notStopAt, notEndAt] = ats(p, ["listenAt", "patAt", "calcAt", "execAt", "advAt", "wrongAt", "recalcAt", "corrAt", "moreAt", "failAt", "watchAt", "sayAt", "notStopAt", "notEndAt"]);
  void listenAt;
  void recalcAt;
  const prog = (t: number) => {
    let v = 0;
    v += 3 * P(t, execAt, 24);
    v += 1 * P(t, advAt, 16);
    v -= 1 * P(t, wrongAt, 8);
    v += 3 * P(t, moreAt, 24);
    v -= 1 * P(t, failAt, 8);
    v += 2 * P(t, watchAt, 40);
    v -= 1 * P(t, watchAt + 50, 8);
    v += 1.8 * P(t, sayAt, 50);
    return Math.min(10.8, v);
  };
  const lit = prog(f);
  const CX = 1040, CY = 560, R = 270, NS = 12;
  const err = (f >= wrongAt && f < wrongAt + 24) || (f >= failAt && f < failAt + 24) || (f >= watchAt + 50 && f < watchAt + 74);
  const errSeg = f >= watchAt + 50 ? Math.floor(prog(watchAt + 49)) - 1 : f >= failAt ? Math.floor(prog(failAt - 1)) - 1 : Math.floor(prog(wrongAt - 1)) - 1;
  const ALYX: [number, number] = [260, 560];
  const packets = [calcAt, corrAt, watchAt + 10, sayAt + 10];
  const state = f >= notStopAt ? "" : f >= watchAt + 50 ? "FALHA DE NOVO" : f >= watchAt ? "AVANÇA DE NOVO" : f >= failAt ? "FALHA ANTES DO FIM" : f >= moreAt ? "AVANÇO" : f >= corrAt ? "CORREÇÃO · A. VANCE" : f >= wrongAt ? "ERRO · RECALCULANDO" : f >= execAt ? "ETAPA EXECUTADA" : f >= calcAt ? "CÁLCULO RECEBIDO" : f >= patAt ? "PROCEDIMENTO · CATALISADOR" : "";
  const stCol = f >= watchAt + 50 ? RED : f >= watchAt ? GREEN : f >= failAt || (f >= wrongAt && f < corrAt) ? RED : f >= corrAt && f < moreAt ? ORANGE : f >= calcAt && f < execAt ? ORANGE : GREEN;
  const arc = (a0: number, a1: number, r0: number, r1: number) => {
    const p0 = [CX + Math.cos(a0) * r1, CY + Math.sin(a0) * r1], p1 = [CX + Math.cos(a1) * r1, CY + Math.sin(a1) * r1];
    const p2 = [CX + Math.cos(a1) * r0, CY + Math.sin(a1) * r0], p3 = [CX + Math.cos(a0) * r0, CY + Math.sin(a0) * r0];
    return `M ${p0[0]} ${p0[1]} A ${r1} ${r1} 0 0 1 ${p1[0]} ${p1[1]} L ${p2[0]} ${p2[1]} A ${r0} ${r0} 0 0 0 ${p3[0]} ${p3[1]} Z`;
  };
  const spin = f / 300;
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 55% 50%, #0b1a12 0%, #050c08 70%, #020403 100%)", overflow: "hidden" }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <filter id="prGlow"><feGaussianBlur stdDeviation="6" /></filter>
        </defs>
        {Array.from({ length: 270 }).map((_, i) => <rect key={i} x={0} y={i * 4} width={1920} height={1.4} fill="rgba(0,0,0,0.22)" />)}
        {/* o cabo da Alyx até o anel */}
        <path d={`M ${ALYX[0] + 110} ${ALYX[1]} C 560 ${ALYX[1] - 60} 640 ${CY + 60} ${CX - R - 30} ${CY}`} fill="none" stroke="rgba(255,152,40,0.28)" strokeWidth={4} />
        {packets.map((t0, k) => {
          if (f < t0 || f > t0 + 26) return null;
          const u = (f - t0) / 24;
          const x = (1 - u) ** 3 * (ALYX[0] + 110) + 3 * (1 - u) ** 2 * u * 560 + 3 * (1 - u) * u * u * 640 + u ** 3 * (CX - R - 30);
          const y = (1 - u) ** 3 * ALYX[1] + 3 * (1 - u) ** 2 * u * (ALYX[1] - 60) + 3 * (1 - u) * u * u * (CY + 60) + u ** 3 * CY;
          return (
            <g key={k}>
              <circle cx={x} cy={y} r={22} fill={ORANGE} opacity={0.45} filter="url(#prGlow)" />
              <circle cx={x} cy={y} r={9} fill="#ffe2b0" />
            </g>
          );
        })}
        {/* o anel: 12 travas; a última é o FIM */}
        <g transform={`rotate(${spin * 2} ${CX} ${CY})`}>
          <circle cx={CX} cy={CY} r={R + 46} fill="none" stroke="rgba(125,255,154,0.18)" strokeWidth={2} strokeDasharray="4 10" />
        </g>
        {Array.from({ length: NS }).map((_, i) => {
          const a0 = -Math.PI / 2 + (i / NS) * Math.PI * 2 + 0.03;
          const a1 = -Math.PI / 2 + ((i + 1) / NS) * Math.PI * 2 - 0.03;
          const fin = i === NS - 1;
          const fill = fin ? 0 : Math.max(0, Math.min(1, lit - i));
          const bad = err && i === errSeg;
          return (
            <g key={i}>
              <path d={arc(a0, a1, R - 40, R + 26)} fill={fin ? "rgba(40,30,8,0.6)" : "rgba(10,24,16,0.85)"} stroke={fin ? "#ffd27a" : "rgba(125,255,154,0.35)"} strokeWidth={fin ? 2.5 : 1.5} strokeDasharray={fin ? "8 6" : undefined} />
              {fill > 0 ? <path d={arc(a0, a0 + (a1 - a0) * fill, R - 34, R + 20)} fill="#7dff9a" opacity={0.85} style={{ filter: "drop-shadow(0 0 8px rgba(125,255,154,0.8))" }} /> : null}
              {bad ? <path d={arc(a0, a1, R - 34, R + 20)} fill={RED} opacity={0.85} style={{ filter: "drop-shadow(0 0 10px #ff5d4d)" }} /> : null}
              {fin ? <text x={CX + Math.cos((a0 + a1) / 2) * (R - 7)} y={CY + Math.sin((a0 + a1) / 2) * (R - 7) + 8} textAnchor="middle" fill="#ffd27a" fontFamily={MONO} fontSize={22} letterSpacing={3}>FIM</text> : null}
            </g>
          );
        })}
        {/* o miolo */}
        <circle cx={CX} cy={CY} r={R - 60} fill="rgba(4,12,8,0.92)" stroke="rgba(125,255,154,0.45)" strokeWidth={2} />
        {f < notStopAt ? (
          <g>
            <text x={CX} y={CY - 10} textAnchor="middle" fill="#e9ffe9" fontFamily={MONO} fontSize={84} letterSpacing={2}>{`${Math.round((lit / 12) * 100)}%`}</text>
            <text x={CX} y={CY + 50} textAnchor="middle" fill={stCol} fontFamily={MONO} fontSize={22} letterSpacing={4}>{state}</text>
          </g>
        ) : (
          <g opacity={P(f, notStopAt, 10)}>
            <text x={CX} y={CY - 20} textAnchor="middle" fill="#ffd27a" fontFamily={MONO} fontSize={28} letterSpacing={3}>NÃO IMPEDE</text>
            <text x={CX} y={CY + 16} textAnchor="middle" fill="#ffd27a" fontFamily={MONO} fontSize={28} letterSpacing={3}>O AVANÇO</text>
            {f >= notEndAt ? (
              <g opacity={P(f, notEndAt, 8)}>
                <text x={CX} y={CY + 64} textAnchor="middle" fill={RED} fontFamily={MONO} fontSize={22} letterSpacing={3}>NEM DEIXA</text>
                <text x={CX} y={CY + 94} textAnchor="middle" fill={RED} fontFamily={MONO} fontSize={22} letterSpacing={3}>CHEGAR AO FIM</text>
              </g>
            ) : null}
          </g>
        )}
        <text x={CX} y={CY + R + 90} textAnchor="middle" fill="rgba(125,255,154,0.7)" fontFamily={MONO} fontSize={18} letterSpacing={5} opacity={P(f, patAt, 10)}>TRANSMISSÕES DOS ADVISORS · O PROCEDIMENTO DO CATALISADOR</text>
      </svg>
      {/* a Alyx, a origem dos cálculos */}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: P(f, calcAt - 20, 12) }}>
        <FlagBadge cx={ALYX[0]} by={ALYX[1] + 70} k={1.15} label="ALYX" col={ORANGE} f={f} sub="OS CÁLCULOS" />
      </svg>
      {f >= sayAt - 10 ? (
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: P(f, sayAt - 10, 10) }}>
          <FlagBadge cx={1480} by={900} k={1.1} label="KLEINER" col={ICE} f={f} sub="A ÚNICA COISA QUE ELE AFIRMA" />
        </svg>
      ) : null}
      {err ? <AbsoluteFill style={{ background: "rgba(255,60,40,0.1)" }} /> : null}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.75) 100%)", pointerEvents: "none" }} />
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 64:11 o posto avançado (POV → footage do Interlude → POV no topo)
const TowerGeo = (g: ReturnType<typeof mk>, lit: number) => {
  // a torre Combine no fim da estrada de gelo: base sextavada, três níveis, canhões, luz vermelha no topo
  g.prism(0, 60, 0, 6, 6, 6, [30, 34, 40], undefined, 0.5);
  for (let lv = 0; lv < 3; lv++) {
    g.prism(0, 60, 6 + lv * 9, 14 + lv * 9, 4.6 - lv * 0.9, 6, [36, 40, 48], undefined, 0.5);
    g.prism(0, 60, 14 + lv * 9 - 0.6, 14 + lv * 9, 4.9 - lv * 0.9, 6, [90, 230, 250], { emit: 0.5 * lit }, 0.5);
  }
  g.prism(0, 60, 33, 38, 0.6, 6, [30, 34, 40]);
  g.prism(0, 60, 38, 38.8, 0.9, 6, [255, 60, 40], { emit: 0.9 });
  [[-9, 52], [9, 52], [-12, 62], [12, 62]].forEach(([x, y]) => {
    g.box(x - 1.2, y - 1.2, 0, 2.4, 2.4, 1.4, [38, 42, 48]);
    g.box(x - 0.2, y - 3.5, 1.1, 0.4, 3.0, 0.4, [28, 30, 36]);
  });
};
// 08/10 (pedido dele: só footage canônica — a subida era do Interlude, jogo de fã): a subida em POV dentro da torre.
// Um poço Combine quadrado com passarelas em espiral; as torretas de cada setor (luz vermelha) apagam para verde quando
// desligadas; um campo de força some para o Dog passar; um caixote Combine voa da Gravity Gun até a última torreta.
const TowerInside: React.FC<{ f: number; enterAt: number; defAt: number; dogAt: number; gravAt: number; topAt: number }> = ({ f, enterAt, defAt, dogAt, gravAt, topAt }) => {
  // corte lateral da torre (como o mapa de uma fase): andares, a escada em zigue-zague, o Gordon subindo; as torretas de
  // cada setor apagam de vermelho para verde; o campo de força some para o Dog; o caixote da Gravity Gun na última torreta
  const X0 = 560;
  const X1 = 1360;
  const FL = [930, 770, 610, 450, 290]; // pisos (y), de baixo para cima
  const t = Math.max(0, Math.min(1, (f - enterAt) / Math.max(1, topAt - enterAt)));
  // a rota do Gordon: em cada andar atravessa e sobe a escada do lado oposto
  const R: [number, number][] = [];
  FL.forEach((y, i) => {
    const left = i % 2 === 0;
    R.push([left ? X0 + 60 : X1 - 60, y - 10]);
    R.push([left ? X1 - 110 : X0 + 110, y - 10]);
  });
  const segL = R.slice(1).map((q, i) => Math.hypot(q[0] - R[i][0], q[1] - R[i][1]));
  const tot = segL.reduce((a, b) => a + b, 0);
  let d = t * tot;
  let gx = R[0][0];
  let gy = R[0][1];
  for (let i = 0; i < segL.length; i++) {
    if (d <= segL[i]) {
      const k = d / segL[i];
      gx = R[i][0] + (R[i + 1][0] - R[i][0]) * k;
      gy = R[i][1] + (R[i + 1][1] - R[i][1]) * k;
      break;
    }
    d -= segL[i];
    gx = R[i + 1][0];
    gy = R[i + 1][1];
  }
  const TUR: [number, number][] = [[X1 - 40, FL[1]], [X0 + 40, FL[2]], [X1 - 40, FL[3]], [X0 + 40, FL[4]]];
  const offAt = (i: number) => defAt + i * 18;
  const dead = (i: number) => f >= offAt(i);
  const fieldOn = f < dogAt + 14;
  const crate = P(f, gravAt + 6, 16);
  const smashed = crate >= 1;
  const hit = f >= gravAt + 22 && f < gravAt + 32;
  const tw = (y: number) => 1 - (930 - y) / 2400; // a torre afina para cima
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 60%, #0c1820 0%, #03060a 80%)" }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {/* o casco da torre (afinando), placas Combine e faixas de luz */}
        <path d={`M ${X0 - 70} 990 L ${960 - 400 * tw(130) - 40} 130 L ${960 + 400 * tw(130) + 40} 130 L ${X1 + 70} 990 Z`} fill="#0e161c" stroke="#3a5562" strokeWidth={3} />
        {Array.from({ length: 12 }).map((_, i) => <line key={i} x1={X0 - 40 + i * 78} y1={980} x2={960 + (X0 - 40 + i * 78 - 960) * tw(140)} y2={140} stroke="rgba(95,243,255,0.07)" strokeWidth={2} />)}
        {[200, 360, 520, 680, 840].map((y) => <line key={y} x1={960 - 430 * tw(y)} x2={960 + 430 * tw(y)} y1={y} y2={y} stroke="rgba(95,243,255,0.35)" strokeWidth={2} strokeDasharray="10 14" />)}
        {/* os pisos e as escadas */}
        {FL.map((y, i) => (
          <g key={i}>
            <rect x={960 - 400 * tw(y)} y={y} width={800 * tw(y)} height={10} fill="#3a4650" />
            {i < FL.length - 1 ? (
              <polyline points={`${i % 2 === 0 ? X1 - 110 : X0 + 110},${y} ${i % 2 === 0 ? X1 - 60 : X0 + 60},${FL[i + 1]}`} fill="none" stroke="#5a6a76" strokeWidth={6} strokeDasharray="4 6" />
            ) : null}
            <text x={960 + 410 * tw(y) + 20} y={y - 20} fill="rgba(242,240,247,0.55)" fontFamily={MONO} fontSize={16} letterSpacing={3}>{`NÍVEL ${i + 1}`}</text>
          </g>
        ))}
        {/* as torretas */}
        {TUR.map(([x, y], i) => {
          if (i === 3 && smashed) return <g key={i}><rect x={x - 20} y={y - 14} width={40} height={14} fill="#2a2e32" transform={`rotate(14 ${x} ${y})`} /></g>;
          const col = dead(i) ? GREEN : RED;
          return (
            <g key={i}>
              <rect x={x - 18} y={y - 46} width={36} height={46} rx={4} fill="#1c2228" stroke={col} strokeWidth={2} />
              <circle cx={x} cy={y - 30} r={7} fill={col} style={{ filter: `drop-shadow(0 0 8px ${col})` }} />
              {!dead(i) && f >= enterAt ? <line x1={x} y1={y - 30} x2={x + (i % 2 ? 200 : -200)} y2={y - 26} stroke="rgba(255,93,77,0.35)" strokeWidth={2} strokeDasharray="6 8" /> : null}
              <text x={x + (i % 2 ? 30 : -30)} y={y - 54} textAnchor={i % 2 ? "start" : "end"} fill={col} fontFamily={MONO} fontSize={16} letterSpacing={3} opacity={f >= defAt - 10 ? 1 : 0.5}>{dead(i) ? `SETOR ${i + 1} · DESLIGADO` : `TORRETA · SETOR ${i + 1}`}</text>
            </g>
          );
        })}
        {/* o campo de força no nível 3 que segura o Dog */}
        {fieldOn ? <rect x={960 - 40} y={FL[2] - 120} width={14} height={120} fill={Math.floor(f / 3) % 4 ? "rgba(120,220,255,0.55)" : "rgba(120,220,255,0.2)"} style={{ filter: "drop-shadow(0 0 10px #78dcff)" }} /> : null}
        {/* o caixote da Gravity Gun */}
        {f >= gravAt && !smashed
          ? (() => {
              const x = gx + (TUR[3][0] - gx) * crate;
              const y = gy - 40 + (TUR[3][1] - 30 - gy + 40) * crate - Math.sin(crate * Math.PI) * 60;
              return <rect x={x - 16} y={y - 16} width={32} height={32} fill="#5a646e" stroke="#9fe6ff" strokeWidth={2} transform={`rotate(${crate * 300} ${x} ${y})`} />;
            })()
          : null}
        {hit ? <circle cx={TUR[3][0]} cy={TUR[3][1] - 30} r={30 + (f - gravAt - 22) * 8} fill="none" stroke="#ffd27a" strokeWidth={4} opacity={1 - (f - gravAt - 22) / 10} /> : null}
        {/* o caminho já feito */}
        <polyline points={R.map(([x, y]) => `${x},${y}`).join(" ")} fill="none" stroke="rgba(255,152,40,0.18)" strokeWidth={3} strokeDasharray="6 8" />
      </svg>
      {/* os crachás: Gordon subindo, o Dog no nível 3 */}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <line x1={gx} y1={gy + 10} x2={gx} y2={gy - 30} stroke={ORANGE} strokeWidth={2} />
        <FlagBadge cx={gx} by={gy - 30} k={0.7} label="GORDON" col={ORANGE} f={f} />
        {f >= dogAt - 20 ? (
          <g opacity={P(f, dogAt - 20, 10)}>
            <line x1={960 - 120} y1={FL[2] - 10} x2={960 - 120} y2={FL[2] - 50} stroke={ICE} strokeWidth={2} />
            <FlagBadge cx={960 - 120} by={FL[2] - 50} k={0.7} label="DOG" col={ICE} f={f} sub={fieldOn ? "PRESO NO CAMPO" : "CAMINHO ABERTO"} />
          </g>
        ) : null}
      </svg>
      <div style={{ position: "absolute", right: 90, top: 140, fontFamily: MONO, letterSpacing: 5, color: "rgba(242,240,247,0.7)", fontSize: 16 }}>A TORRE · CORTE</div>
    </AbsoluteFill>
  );
};
export const HL9Tower: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [reachAt, towerAt, roadAt, strAt, troopAt, enterAt, hl2At, climbAt, defAt, dogAt, gravAt, topAt, waitAt, fallAt, groupAt] = ats(p, ["reachAt", "towerAt", "roadAt", "strAt", "troopAt", "enterAt", "hl2At", "climbAt", "defAt", "dogAt", "gravAt", "topAt", "waitAt", "fallAt", "groupAt"]);
  void reachAt;
  void towerAt;
  void hl2At;
  const foot = f >= enterAt && f < topAt;
  const top = f >= topAt;
  // POV de chegada: parado no fim da estrada, olhando a torre
  const eA: Eye = { x: 0, y: keys(f, [[0, 0], [enterAt, 8]]), z: 1.4, yaw: keys(f, [[0, 0.02], [strAt, -0.06], [enterAt, 0]]), pitch: keys(f, [[0, 0.05], [towerAt + 30, 0.2], [roadAt, 0.05], [enterAt, 0.12]]), F: 1000 };
  // POV no topo: alto, o Strider na altura dos olhos; embaixo, a coluna presa no gelo
  const eB: Eye = { x: 0, y: 55.5, z: 36, yaw: Math.PI + keys(f, [[topAt, 0.1], [waitAt, 0.1], [waitAt + 20, 0.0], [fallAt, 0.0]]), pitch: keys(f, [[topAt, 0.0], [waitAt, 0.0], [waitAt + 20, -0.55], [fallAt, -0.55], [fallAt + 30, -0.4]]), F: 1000 };
  const e = top ? eB : eA;
  const g = mk();
  if (!foot) {
    // 09/10 (pedido dele: do topo o chão lá embaixo não renderizava): o gelo cobre tudo o que a câmera do topo enxerga
    const S5 = top ? 10 : 5;
    for (let ix = top ? -14 : -16; ix < (top ? 14 : 16); ix++)
      for (let iy = top ? -14 : -4; iy < (top ? 8 : 22); iy++) {
        const k = 0.94 + rnd(ix * 31 + iy * 17) * 0.08;
        g.quad([ix * S5, iy * S5, 0], [ix * S5 + S5, iy * S5, 0], [ix * S5 + S5, iy * S5 + S5, 0], [ix * S5, iy * S5 + S5, 0], [146 * k, 162 * k, 178 * k], [0, 0, 1]);
      }
    // a estrada de gelo (sulcos) até a torre
    for (let y = 0; y < 52; y += 4) [-1.2, 1.0].forEach((x) => g.quad([x, y, 0.01], [x + 0.3, y, 0.01], [x + 0.3, y + 4, 0.01], [x, y + 4, 0.01], [96, 110, 122], [0, 0, 1]));
    if (!top) TowerGeo(g, 1);
    else {
      // só a plataforma do topo e o parapeito na beirada, embaixo/na frente da câmera
      g.quad([-4, 55.4, 34.9], [4, 55.4, 34.9], [4, 62, 34.9], [-4, 62, 34.9], [40, 44, 50], [0, 0, 1]);
      g.box(-4, 55.25, 34.9, 0.12, 0.12, 0.9, [30, 34, 40]);
      g.box(3.88, 55.25, 34.9, 0.12, 0.12, 0.9, [30, 34, 40]);
      g.box(-4, 55.28, 35.72, 8, 0.06, 0.04, [26, 30, 34]);
    }
    // a coluna parada lá embaixo (vista do topo)
    if (top)
      [[-2, 22], [1.5, 16], [-1, 10], [2, 4]].forEach(([x, y]) => {
        g.box(x, y, 0.4, 2.2, 4.6, 2.0, [44, 48, 44]);
        [0.25, 1.65].forEach((dx) => g.quad([x + dx, y + 4.61, 0.8], [x + dx + 0.35, y + 4.61, 0.8], [x + dx + 0.35, y + 4.61, 1.1], [x + dx, y + 4.61, 1.1], [255, 240, 190], [0, 1, 0], { emit: 1 }));
      });
  }
  const lights: XL[] = [{ x: 0, y: 58, z: 20, col: [90, 230, 250], k: 0.5, r: 30 }, { x: 0, y: 60, z: 38, col: [255, 60, 40], k: 0.8, r: 14 }, ...(top ? [[-1, 26], [1, 18], [0, 12], [2, 8]].map(([x, y]) => ({ x, y, z: 1, col: [255, 236, 190] as RGB, k: 0.9, r: 7 })) : [])];
  const strDown = P(f, fallAt, 40);
  const flash = f >= fallAt && f < fallAt + 12 ? 1 - (f - fallAt) / 12 : 0;
  const objs: [number, string][] = [
    [climbAt, "SUBIR A ESTRUTURA POR DENTRO"],
    [defAt, "DESLIGAR AS DEFESAS · SETOR POR SETOR"],
    [dogAt, "ABRIR CAMINHO PARA O DOG"],
    [gravAt, "GRAVITY GUN · O EQUIPAMENTO VIRA ARMA"],
    [topAt, "NO TOPO · DERRUBAR O STRIDER"],
  ];
  return (
    <AbsoluteFill style={{ background: "#050a10", overflow: "hidden" }}>
      {!foot ? (
        <AbsoluteFill>
          <NightSky e={e} f={f} />
          {/* o Strider guardando a entrada (na chegada) e no topo (na altura dos olhos), caindo no fim */}
          {!top && f >= strAt ? <SilhouetteAt e={e} x={-7} y={50} h={24} src="hl3silh/strider_peca.png" ar={439 / 640} f={f} o={P(f, strAt, 14)} rim="rgba(150,220,255,0.4)" top="#16222c" bot="#0a1016" label="STRIDER" sub="NA ENTRADA" labelCol={RED} /> : null}
          <XView e={e} faces={g.F} lights={lights} flash={0.2} amb={top ? 0.4 : 0.28} seam="rgba(0,0,0,0.12)" />
          {/* 09/10 (pedido dele: o Strider ficava parado na tela quando a câmera olhava para baixo): o Strider em pé NO
              GELO, na frente da torre, com a cabeça na altura do topo — acompanha a perspectiva; na queda as pernas dobram */}
          {top ? (
            <SilhouetteAt e={e} x={-13} y={26} h={35 * (1 - 0.72 * strDown)} src="hl3silh/strider_peca.png" ar={(439 / 640) * (1 + 0.6 * strDown)} f={f} o={1 - P(f, fallAt + 46, 18)} rim="rgba(150,220,255,0.45)" top="#1a2630" bot="#070b0e" label={f < fallAt ? "STRIDER" : undefined} labelCol={RED} />
          ) : null}
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            {!top ? <Call e={e} f={f} pt={[0, 60, 30]} from={towerAt + 20} until={enterAt} text="POSTO AVANÇADO · TORRE COMBINE" sub="PROTEGE A INSTALAÇÃO" col={RED} dx={240} dy={-80} /> : null}
            {!top && f >= roadAt ? <text x={960} y={980} textAnchor="middle" fill={CREAM} fontFamily={MONO} fontSize={20} letterSpacing={6} opacity={P(f, roadAt, 8) * (1 - P(f, strAt, 8))}>A ESTRADA DE GELO TERMINA AQUI</text> : null}
            {!top && f >= troopAt
              ? [[3.5, 60, 9], [-3, 60, 18], [2, 60, 26]].map(([x, y, z], k) => {
                  const q = proj(e, [x, y - 4, z]);
                  return q ? (
                    <g key={k} opacity={P(f, troopAt + k * 4, 8)}>
                      <IcoComb x={q.x} y={q.y} s={0.8} />
                      {k === 0 ? <text x={q.x + 24} y={q.y + 6} fill={RED} fontFamily={MONO} fontSize={16} letterSpacing={3} style={{ paintOrder: "stroke", stroke: "#000", strokeWidth: 4 }}>TROPAS NOS NÍVEIS</text> : null}
                    </g>
                  ) : null;
                })
              : null}
            {top && f >= waitAt ? <Call e={e} f={f} pt={[0, 13, 1.5]} from={waitAt + 16} until={groupAt + 30} text="A COLUNA" sub="PRESA NO GELO, ESPERANDO" col={AMB} dx={260} dy={-120} /> : null}
            {top && f >= groupAt ? <FlagAt e={e} pt={[2, 4, 2.4]} label="VARGA" col={AMB} f={f} o={P(f, groupAt, 10)} sub="TRAZ O RESTANTE" /> : null}
          </svg>
        </AbsoluteFill>
      ) : (
        <TowerInside f={f} enterAt={enterAt} defAt={defAt} dogAt={dogAt} gravAt={gravAt} topAt={topAt} />
      )}
      {/* os objetivos do HEV (sobre o footage e no topo) */}
      {f >= climbAt ? (
        <div style={{ position: "absolute", left: 90, top: 110, width: 600, padding: "16px 20px", borderRadius: 12, background: "rgba(14,10,4,0.82)", border: `1.5px solid ${AMB}`, fontFamily: MONO }}>
          <div style={{ fontSize: 15, letterSpacing: 5, color: AMB }}>H.E.V. · OBJETIVOS · POSTO AVANÇADO</div>
          {objs.filter(([t0]) => f >= t0).map(([t0, txt], i, arr) => {
            const done = i < arr.length - 1 || f >= fallAt;
            return (
              <div key={txt} style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10, fontSize: 19, letterSpacing: 2, color: done ? "rgba(242,240,247,0.55)" : TXT, opacity: P(f, t0, 8) }}>
                <span style={{ width: 22, height: 22, borderRadius: 4, border: `2px solid ${done ? GREEN : AMB}`, display: "inline-flex", alignItems: "center", justifyContent: "center", color: GREEN, fontSize: 16 }}>{done ? "✓" : ""}</span>
                {txt}
              </div>
            );
          })}
        </div>
      ) : null}
      {flash > 0 ? <AbsoluteFill style={{ background: `rgba(255,240,220,${flash * 0.85})` }} /> : null}
      {!foot ? <Hud f={f} yaw={e.yaw} eye={e} blips={[]} msg={top && f >= fallAt ? "O POSTO CAIU" : top ? "O TOPO DA TORRE" : undefined} msgCol={top && f >= fallAt ? GREEN : RED} /> : null}
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life) + (Math.abs(f - enterAt) < 4 || Math.abs(f - topAt) < 4 ? 0.9 : 0), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ================================================================================================= módulo 9 · leva C (1:04:49 → 1:06:20)
// o Borealis em linhas 3D (holograma): casco, convés, a ilha de comando na popa, o guindaste e 6 seções; núcleo no meio
type Seg3 = [V3, V3];
const BOR_SEGS_OLD = (() => {
  const S: { a: V3; b: V3; sec: number }[] = [];
  const L = 40;
  const hull = (y: number, w: number, z: number): V3[] => [[-w, y, z], [w, y, z]];
  const xs = [0, 6, 12, 18, 24, 30, 36, 40];
  const wAt = (y: number) => (y < 6 ? 2 + y * 0.45 : 4.7);
  for (let i = 0; i < xs.length - 1; i++) {
    const y0 = xs[i] - L / 2;
    const y1 = xs[i + 1] - L / 2;
    const w0 = wAt(xs[i]);
    const w1 = wAt(xs[i + 1]);
    const sec = Math.min(5, Math.floor(i * 0.86));
    ([[0, 0], [5, 5]] as [number, number][]).forEach(([za, zb]) => {
      S.push({ a: [-w0, y0, za], b: [-w1, y1, zb], sec });
      S.push({ a: [w0, y0, za], b: [w1, y1, zb], sec });
    });
    S.push({ a: [-w0, y0, 0], b: [-w0, y0, 5], sec });
    S.push({ a: [w0, y0, 0], b: [w0, y0, 5], sec });
    S.push({ a: [-w0, y0, 5], b: [w0, y0, 5], sec });
    S.push({ a: [-w0, y0, 0], b: [w0, y0, 0], sec });
    // o corredor central da seção
    S.push({ a: [-0.8, y0, 2.4], b: [-0.8, y1, 2.4], sec: 10 + i });
    S.push({ a: [0.8, y0, 2.4], b: [0.8, y1, 2.4], sec: 10 + i });
    void hull;
  }
  // a ilha de comando na popa e o guindaste
  const box = (x0: number, y0: number, z0: number, w: number, d: number, h: number, sec: number) => {
    const P8: V3[] = [[x0, y0, z0], [x0 + w, y0, z0], [x0 + w, y0 + d, z0], [x0, y0 + d, z0], [x0, y0, z0 + h], [x0 + w, y0, z0 + h], [x0 + w, y0 + d, z0 + h], [x0, y0 + d, z0 + h]];
    [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]].forEach(([i, j]) => S.push({ a: P8[i], b: P8[j], sec }));
  };
  box(-3.5, 12, 5, 7, 6, 6, 5);
  box(-2, 13.5, 11, 4, 3, 3, 5);
  S.push({ a: [0, -6, 5], b: [0, -6, 14], sec: 2 });
  S.push({ a: [0, -6, 14], b: [0, -14, 9], sec: 2 });
  return S;
})();
// 12/10: o holograma é o Borealis 3D do vídeo (as arestas do modelo), na escala do antigo (comprimento 40, quilha em 0);
// seções 0–5 da proa (−y) à popa (+y, a superestrutura); os dois trilhos do corredor central (seções 10+) continuam
let BOR_CACHE: { a: V3; b: V3; sec: number }[] | null = null;
const borSegs = () => {
  if (BOR_CACHE) return BOR_CACHE;
  const s = 40 / 116;
  const S: { a: V3; b: V3; sec: number }[] = [];
  for (const [ax, ay, az, bx, by, bz] of borealisEdges()) {
    const A: V3 = [-az * s, -(ax - 2) * s, (ay + 8.5) * s];
    const B: V3 = [-bz * s, -(bx - 2) * s, (by + 8.5) * s];
    const my = (A[1] + B[1]) / 2;
    S.push({ a: A, b: B, sec: Math.max(0, Math.min(5, Math.floor(((my + 20) / 40) * 6))) });
  }
  BOR_SEGS_OLD.filter((q) => q.sec >= 10).forEach((q) => S.push(q));
  BOR_CACHE = S;
  return S;
};
// o navio deitado de lado (comprimento no eixo x da cena), girando em torno do eixo vertical (rot), deslocado dx no comprimento
const BorealisHolo: React.FC<{ e: Eye; f: number; c: V3; k: number; show: (sec: number) => number; tint?: (sec: number) => string; core?: number; o?: number; dx?: number; rot?: number }> = ({ e, f, c, k, show, tint, core = 0, o = 1, dx = 0, rot = 0 }) => {
  const cs = Math.cos(rot);
  const sn = Math.sin(rot);
  const P3 = (v: V3): V3 => {
    const lx = v[1] + dx;
    const ly = -v[0];
    return [c[0] + (lx * cs - ly * sn) * k, c[1] + (lx * sn + ly * cs) * k, c[2] + v[2] * k];
  };
  const cp = proj(e, P3([0, 0, 2.4]));
  return (
    <g opacity={o}>
      {borSegs().map((s, i) => {
        const v = show(s.sec);
        if (v <= 0.01) return null;
        const a = proj(e, P3(s.a));
        const b = proj(e, P3(s.b));
        if (!a || !b) return null;
        const col = tint ? tint(s.sec) : CYC;
        return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={col} strokeWidth={s.sec >= 10 ? 1.4 : 1.2} opacity={v * (s.sec >= 10 ? 0.6 : 0.75)} />;
      })}
      {core > 0 && cp ? (
        <g opacity={core}>
          <circle cx={cp.x} cy={cp.y} r={26 + 4 * Math.sin(f / 5)} fill="rgba(255,210,122,0.18)" />
          <circle cx={cp.x} cy={cp.y} r={9} fill="#ffe2a0" style={{ filter: "drop-shadow(0 0 12px #ffd27a)" }} />
        </g>
      ) : null}
    </g>
  );
};
const buildLab = (): XF[] => {
  const g = mk();
  g.room(-6, 6, 0, 12, 3.4, [38, 44, 50], [26, 30, 34], [20, 22, 26], [{ side: "S", c: 0, w: 2.2, h: 2.4 }]);
  for (let y = 1; y < 12; y += 2.2) {
    g.box(-6, y, 0, 0.3, 0.3, 3.4, [24, 28, 32]);
    g.box(5.7, y, 0, 0.3, 0.3, 3.4, [24, 28, 32]);
    g.box(-5.69, y + 0.6, 1.0, 0.02, 0.9, 1.2, [80, 225, 245], { emit: 0.35 });
    g.box(5.67, y + 0.6, 1.0, 0.02, 0.9, 1.2, [80, 225, 245], { emit: 0.35 });
  }
  // o projetor no meio da sala
  g.prism(0, 6, 0, 0.9, 1.2, 8, [34, 38, 44]);
  g.prism(0, 6, 0.9, 1.0, 0.9, 8, [90, 230, 250], { emit: 0.7, tag: "proj" });
  // os consoles do fundo
  for (let i = -2; i <= 2; i++) {
    g.box(i * 2 - 0.7, 10.6, 0, 1.4, 0.8, 1.0, [40, 46, 52]);
    g.quad([i * 2 - 0.65, 10.6, 1.0], [i * 2 + 0.65, 10.6, 1.0], [i * 2 + 0.65, 11.0, 1.6], [i * 2 - 0.65, 11.0, 1.6], [22, 26, 30], [0, -0.7, 0.7]);
  }
  return g.F;
};
export const HL9Lab: React.FC<PR & { mode?: number }> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const mode = p.mode ?? 0;
  const [labAt, infoAt, yearsAt, chaosAt, corrAt, hullAt, decAt, moveAt, sigAt, coreAt, epochAt, fixAt] = ats(p, ["labAt", "infoAt", "yearsAt", "chaosAt", "corrAt", "hullAt", "decAt", "moveAt", "sigAt", "coreAt", "epochAt", "fixAt"]);
  const [notAt, backAt, coreAt2, bothAt, outAt, onlyAt] = ats(p, ["notAt", "backAt", "coreAt", "bothAt", "outAt", "onlyAt"]);
  void labAt;
  void decAt;
  const G = useMemo(() => buildLab(), []);
  const on = mode ? 1 : P(f, infoAt, 10);
  const e: Eye = { x: 0.05 * Math.sin(f / 60), y: keys(f, [[0, 0.8], [mode ? 1e9 : infoAt, 2.3], [life, 2.6]]), z: 1.7, yaw: keys(f, [[0, 0.06], [life, -0.04]]), pitch: keys(f, [[0, 0.0], [mode ? 0 : infoAt + 20, 0.08], [life, 0.08]]), F: 1000 };
  const live = G.map((fc) => (fc.tag === "proj" ? { ...fc, emit: on > 0 ? 0.5 + 0.4 * on : 0.15 } : fc));
  const lights: XL[] = [{ x: 0, y: 6, z: 2.4, col: [90, 230, 250], k: 0.6 * on, r: 7 }, { x: 0, y: 2, z: 3.2, col: [200, 210, 230], k: 0.2, r: 8 }];
  // o caos: cada seção pisca com o seu ritmo; o corredor some e volta; a popa vira "décadas atrás"; o navio pula
  const chaos = mode ? 0 : P(f, chaosAt, 10);
  const flick = (sec: number) => (chaos > 0 ? (rnd(sec * 13 + Math.floor((f + sec * 7) / (6 + (sec % 4) * 3))) > 0.35 ? 1 : 0.15) : 1);
  const corrGone = !mode && f >= corrAt && f < hullAt && Math.floor((f - corrAt) / 14) % 2 === 1;
  const show = (sec: number) => {
    if (mode) return 1;
    if (sec === 12 && corrGone) return 0;
    return on * (sec >= 10 ? (chaos > 0 ? flick(sec) : 1) : flick(sec));
  };
  const oldHull = !mode && f >= hullAt;
  const tint = (sec: number) => (oldHull && (sec === 4 || sec === 5) ? "#ffb066" : CYC);
  const jump = !mode && f >= moveAt && f < sigAt ? [0, 6, -4, 3][Math.floor((f - moveAt) / 12) % 4] : 0;
  const coreOn = mode ? P(f, coreAt2, 10) : P(f, coreAt, 12);
  // o modo "voltou": danos vermelhos que somem quando o tempo volta
  const rewind = mode ? P(f, backAt, 40) : 0;
  const reads = Math.round(interpolate(f, [yearsAt, yearsAt + 50], [0, 14970], C));
  const holoC: V3 = [0, 6, 1.45];
  return (
    <AbsoluteFill style={{ background: "#030507", overflow: "hidden" }}>
      <XView e={e} faces={live} lights={lights} flash={0.2} amb={0.14} />
      <ConsoleScreens e={e} f={f} quads={[-2, -1, 0, 1, 2].map((i) => [[i * 2 - 0.6, 10.97, 1.57], [i * 2 + 0.6, 10.97, 1.57], [i * 2 + 0.6, 10.63, 1.04], [i * 2 - 0.6, 10.63, 1.04]] as [V3, V3, V3, V3])} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {/* o feixe do projetor */}
        {on > 0 ? (() => {
          const a = proj(e, [0, 6, 1.0]);
          const l = proj(e, [-1.8, 6, 2.9]);
          const r = proj(e, [1.8, 6, 2.9]);
          return a && l && r ? <polygon points={`${a.x},${a.y} ${l.x},${l.y} ${r.x},${r.y}`} fill="rgba(95,243,255,0.07)" opacity={on} /> : null;
        })() : null}
        {on > 0 ? <BorealisHolo e={e} f={f} c={holoC} k={0.085} show={show} tint={tint} core={coreOn} dx={jump} o={on} rot={0.35 + f / 400} /> : null}
        {/* os danos do ataque (modo voltou): somem quando o estado volta */}
        {mode && rewind < 1
          ? [[-1.5, -8, 4], [2, 2, 5], [-2, 10, 3]].map((v, k) => {
              const r = 0.35 + f / 400;
              const lx = v[1];
              const ly = -v[0];
              const q = proj(e, [holoC[0] + (lx * Math.cos(r) - ly * Math.sin(r)) * 0.085, holoC[1] + (lx * Math.sin(r) + ly * Math.cos(r)) * 0.085, holoC[2] + v[2] * 0.085]);
              return q ? <circle key={k} cx={q.x} cy={q.y} r={18} fill="rgba(255,60,40,0.35)" stroke={RED} strokeWidth={2} opacity={1 - rewind} /> : null;
            })
          : null}
        {/* chamadas */}
        {!mode ? <Call e={e} f={f} pt={[holoC[0] - 0.07, holoC[1] + 0.3 * 0, holoC[2] + 0.2]} from={corrAt} until={hullAt} text={corrGone ? "LEITURA 8813 · O CORREDOR SUMIU" : "LEITURA 8812 · O CORREDOR EXISTE"} col={CYC} dx={-300} dy={-170} /> : null}
        {!mode ? <Call e={e} f={f} pt={[holoC[0], holoC[1] + 1.2, holoC[2] + 0.6]} from={hullAt + 4} until={moveAt} text="ESTA PARTE · DÉCADAS ATRÁS" sub="O RESTO · NO PRESENTE" col="#ffb066" dx={240} dy={-170} /> : null}
        {!mode && f >= moveAt && f < sigAt ? <text x={960} y={250} textAnchor="middle" fill={CYC} fontFamily={MONO} fontSize={22} letterSpacing={6}>O NAVIO INTEIRO MUDA DE POSIÇÃO</text> : null}
        <Call e={e} f={f} pt={[holoC[0], holoC[1], holoC[2] + 0.2]} from={mode ? coreAt2 : coreAt + 6} until={life} text={mode ? "O NÚCLEO · EXATAMENTE ONDE ESTAVA" : "O NÚCLEO"} sub={mode ? "78.3° · 15.7° · MESMA LEITURA" : f >= fixAt ? "PRESO AO MESMO PONTO" : "NÃO ACOMPANHA O RESTO"} col="#ffd27a" dx={260} dy={110} />
        <XMarker e={e} x={-2.4} y={6.4} label="KLEINER" col={ICE} f={f} o={P(f, 6, 10)} />
        <XMarker e={e} x={2.5} y={6.8} label="MAGNUSSON" col={ICE} f={f} o={P(f, 12, 10)} />
      </svg>
      {/* o painel dos registros (Combine) */}
      {f >= (mode ? 0 : infoAt) ? (
        <div style={{ position: "absolute", left: 90, top: 120, width: 520, padding: "14px 18px", background: "linear-gradient(160deg, rgba(20,60,84,0.88), rgba(6,22,32,0.92))", clipPath: "polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px)", boxShadow: `inset 0 0 0 1.5px ${CYC}`, fontFamily: MONO, color: "#dff8ff", opacity: mode ? 1 : P(f, infoAt, 8) }}>
          <div style={{ fontSize: 15, letterSpacing: 4, color: CYC }}>{mode ? "BOREALIS · DEPOIS DO ATAQUE" : "REGISTROS TEMPORAIS · BOREALIS"}</div>
          {!mode ? (
            <>
              <div style={{ fontSize: 22, letterSpacing: 2, marginTop: 8 }}>{f >= yearsAt ? `LEITURAS: ${reads.toLocaleString("pt-BR")} · 6 ANOS` : "O QUE A MOSSMAN NÃO CONSEGUIU LEVAR"}</div>
              {f >= sigAt ? (
                <svg width={480} height={130} style={{ marginTop: 10 }}>
                  {[0, 1, 2, 3].map((k) => (
                    <polyline key={k} points={Array.from({ length: 60 }).map((_, i) => `${i * 8},${18 + k * 30 + (k === 3 ? 0 : (rnd(i * 7 + k * 31 + Math.floor(f / 3)) - 0.5) * 22)}`).join(" ")} fill="none" stroke={k === 3 ? "#ffd27a" : "rgba(95,243,255,0.55)"} strokeWidth={k === 3 ? 3 : 1.5} />
                  ))}
                  <text x={474} y={112} textAnchor="end" fill="#ffd27a" fontSize={14} letterSpacing={2}>UM SINAL NÃO ACOMPANHA</text>
                </svg>
              ) : null}
              {f >= epochAt ? <div style={{ fontSize: 18, letterSpacing: 3, color: "#ffd27a", marginTop: 6 }}>{`ÉPOCA: ${["1979", "2001", "2026", "1985", "PRESENTE"][Math.floor((f - epochAt) / 8) % 5]} · NÚCLEO: FIXO`}</div> : null}
            </>
          ) : (
            <>
              <div style={{ fontSize: 22, letterSpacing: 2, marginTop: 8 }}>{f >= backAt ? "NÃO SE RECONSTRUIU · VOLTOU" : "O CASCO REAPARECEU INTEIRO"}</div>
              <div style={{ marginTop: 10, height: 10, background: "rgba(95,243,255,0.15)", position: "relative" }}>
                <div style={{ position: "absolute", left: `${90 - 70 * rewind}%`, top: -5, width: 4, height: 20, background: "#ffd27a" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, letterSpacing: 2, marginTop: 6, color: "rgba(223,248,255,0.7)" }}>
                <span>ANTES DO ATAQUE</span>
                <span>DEPOIS</span>
              </div>
              {f >= bothAt ? (
                <div style={{ marginTop: 14, opacity: P(f, bothAt, 8) }}>
                  <div style={{ fontSize: 15, letterSpacing: 3, color: CYC }}>DUAS COISAS PROVADAS</div>
                  {f >= outAt ? <div style={{ fontSize: 22, letterSpacing: 2, marginTop: 6, color: RED, opacity: P(f, outAt, 8) }}>✕ DESTRUIR POR FORA NÃO RESOLVE</div> : null}
                  {f >= onlyAt ? <div style={{ fontSize: 22, letterSpacing: 2, marginTop: 6, color: "#ffd27a", opacity: P(f, onlyAt, 8) }}>✓ O NÚCLEO · O ÚNICO PONTO FIXO</div> : null}
                </div>
              ) : null}
            </>
          )}
        </div>
      ) : null}
      <Hud f={f} yaw={e.yaw} eye={e} blips={[{ x: -2.4, y: 6.4 }, { x: 2.5, y: 6.8 }]} msg={!mode && f < infoAt ? "LABORATÓRIO · BASE COMBINE CAPTURADA" : mode && f < backAt ? "O CASCO NÃO SE RECONSTRUIU" : undefined} msgCol={CYC} />
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 1:05:21 a assinatura (osciloscópio)
export const HL9Signature: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [cmpAt, sameAt, woundAt, sinceAt] = ats(p, ["cmpAt", "sameAt", "woundAt", "sinceAt"]);
  void cmpAt;
  const merge = P(f, sameAt - 10, 30);
  const sig = (i: number, ph: number) => 26 * Math.sin(i * 0.22 + ph) + 18 * Math.sin(i * 0.57 + ph * 1.7) + 10 * Math.sin(i * 1.3);
  const pts = (y0: number, ph: number, noise: number) => Array.from({ length: 200 }).map((_, i) => `${200 + i * 7.6},${y0 + sig(i, ph) + (rnd(i * 13 + Math.floor(f / 2)) - 0.5) * noise}`).join(" ");
  const yA = 360 + 150 * merge;
  const yB = 720 - 210 * merge;
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, #0b1a12 0%, #050c08 70%, #020403 100%)", overflow: "hidden" }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {Array.from({ length: 11 }).map((_, i) => <line key={"v" + i} x1={200 + i * 152} x2={200 + i * 152} y1={180} y2={900} stroke="rgba(125,255,154,0.1)" />)}
        {Array.from({ length: 7 }).map((_, i) => <line key={"h" + i} x1={200} x2={1720} y1={180 + i * 120} y2={180 + i * 120} stroke="rgba(125,255,154,0.1)" />)}
        <polyline points={pts(yA, f / 10, 10 * (1 - merge))} fill="none" stroke="#7dff9a" strokeWidth={3} style={{ filter: "drop-shadow(0 0 6px rgba(125,255,154,0.8))" }} />
        <polyline points={pts(yB, f / 10, 14 * (1 - merge))} fill="none" stroke="#ffd27a" strokeWidth={3} style={{ filter: "drop-shadow(0 0 6px rgba(255,210,122,0.7))" }} opacity={0.9} />
        <text x={200} y={yA - 60} fill="#7dff9a" fontFamily="'Courier New', monospace" fontSize={22} letterSpacing={4} opacity={1 - merge * 0.6}>NÚCLEO DO BOREALIS · AGORA</text>
        <text x={200} y={yB + 80} fill="#ffd27a" fontFamily="'Courier New', monospace" fontSize={22} letterSpacing={4} opacity={1 - merge * 0.6}>BLACK MESA · RESSONÂNCIA EM CASCATA · ARQUIVO</text>
        {f >= sameAt ? <text x={960} y={250} textAnchor="middle" fill={TXT} fontFamily="'Courier New', monospace" fontSize={34} letterSpacing={6} opacity={P(f, sameAt + 10, 8)}>{`CORRESPONDÊNCIA ${Math.min(99.98, 60 + 40 * P(f, sameAt, 30)).toFixed(2)}%`}</text> : null}
        {f >= woundAt ? <text x={960} y={980} textAnchor="middle" fill={RED} fontFamily={FONT} fontWeight={800} fontSize={64} opacity={P(f, woundAt, 10)}>a ferida</text> : null}
      </svg>
      <div style={{ position: "absolute", left: 200, top: 100, display: "flex", alignItems: "center", gap: 14, fontFamily: MONO, color: "#7dff9a", fontSize: 18, letterSpacing: 4 }}>
        <div style={{ width: 46, height: 46, backgroundImage: `url(${staticFile("hl3silh/bm_logo.svg")})`, backgroundSize: "contain", backgroundRepeat: "no-repeat", filter: "invert(1) sepia(1) saturate(4) hue-rotate(60deg)" }} />
        DR. I. KLEINER · COMPARAÇÃO DE ASSINATURA
      </div>
      {f >= sinceAt - 20 ? (
        <AbsoluteFill style={{ pointerEvents: "none" }}>
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: P(f, sinceAt - 20, 12) }}>
            <text x={1700} y={860} textAnchor="end" fill={GREEN} fontFamily={MONO} fontSize={18} letterSpacing={4}>O QUE OS VORTIGAUNTS CHAMAM DE FERIDA</text>
          </svg>
          <div style={{ position: "absolute", left: 1520, top: 560, width: 190, height: 280, opacity: P(f, sinceAt - 20, 12), filter: "drop-shadow(0 0 6px rgba(141,255,168,0.8))" }}>
            <div style={{ position: "absolute", inset: 0, WebkitMaskImage: `url(${staticFile("hl3silh/vort_silh.png")})`, maskImage: `url(${staticFile("hl3silh/vort_silh.png")})`, WebkitMaskSize: "100% 100%", maskSize: "100% 100%", background: "linear-gradient(180deg, #2e3a28, #0a0f0a 85%)" }} />
            <div style={{ position: "absolute", left: "84%", top: "13%", width: 7, height: 7, borderRadius: "50%", background: "#ff4a3a", boxShadow: "0 0 8px #ff4a3a" }} />
          </div>
        </AbsoluteFill>
      ) : null}
      {Array.from({ length: 1 }).map((_, i) => <AbsoluteFill key={i} style={{ background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.22) 0 2px, transparent 2px 4px)", pointerEvents: "none" }} />)}
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life, 6), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 1:05:37 o núcleo ancorado
export const HL9Anchor: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [slideAt, notAt, stuckAt, sceneAt] = ats(p, ["slideAt", "notAt", "stuckAt", "sceneAt"]);
  void slideAt;
  const e: Eye = { x: 0, y: -40, z: 7, yaw: 0, pitch: -0.05, F: 1000 };
  const t = f / 30;
  const offs = [-34, -17, 0, 17, 34].map((d, i) => d + 8 * Math.sin(t * 0.9 + i));
  const rew = P(f, sceneAt, 20);
  const coreS = proj(e, [0, 0, 2.4 * 0.55]);
  const woundL = proj(e, [-20, 0, -4]);
  const woundR = proj(e, [20, 0, -4]);
  const woundC = proj(e, [0, 0, -4]);
  return (
    <AbsoluteFill style={{ background: "#03060a", overflow: "hidden" }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <filter id="anGlow"><feGaussianBlur stdDeviation="8" /></filter>
        </defs>
        {/* a linha do tempo embaixo */}
        {Array.from({ length: 9 }).map((_, i) => {
          const q = proj(e, [-32 + i * 8, 0, -7]);
          return q ? (
            <g key={i}>
              <line x1={q.x} y1={q.y - 8} x2={q.x} y2={q.y + 8} stroke="rgba(242,240,247,0.4)" />
              <text x={q.x} y={q.y + 30} textAnchor="middle" fill="rgba(242,240,247,0.45)" fontFamily={MONO} fontSize={15}>{1970 + i * 8}</text>
            </g>
          ) : null;
        })}
        {/* a ferida embaixo */}
        {woundL && woundR && woundC ? (
          <g>
            <path d={`M ${woundL.x} ${woundL.y} Q ${woundC.x} ${woundC.y + 30} ${woundR.x} ${woundR.y}`} fill="none" stroke="rgba(255,110,60,0.6)" strokeWidth={30} filter="url(#anGlow)" />
            <path d={`M ${woundL.x} ${woundL.y} Q ${woundC.x} ${woundC.y + 30} ${woundR.x} ${woundR.y}`} fill="none" stroke="#ffb27a" strokeWidth={3} />
            <text x={woundR.x - 10} y={woundR.y + 40} textAnchor="end" fill={ORANGE} fontFamily={MONO} fontSize={18} letterSpacing={4}>A FERIDA</text>
          </g>
        ) : null}
        {/* o navio deslizando no tempo: cópias fantasmas */}
        {offs.map((d, i) => (
          <BorealisHolo key={i} e={e} f={f} c={[0, 0, 0]} k={0.55} show={() => 1} dx={d} o={(i === 2 ? 0.95 : 0.3) * (1 - rew * 0.6)} tint={() => (i === 2 ? CYC : "rgba(95,243,255,0.6)")} rot={0.12} />
        ))}
        {/* o núcleo preso: não acompanha */}
        {coreS && woundC ? (
          <g opacity={P(f, notAt, 10)}>
            <line x1={coreS.x} y1={coreS.y} x2={woundC.x} y2={woundC.y + 14} stroke="#ffd27a" strokeWidth={3} strokeDasharray="10 6" />
            <circle cx={coreS.x} cy={coreS.y} r={30 + 4 * Math.sin(f / 5)} fill="rgba(255,210,122,0.2)" />
            <circle cx={coreS.x} cy={coreS.y} r={12} fill="#ffe2a0" style={{ filter: "drop-shadow(0 0 14px #ffd27a)" }} />
            <text x={coreS.x + 40} y={coreS.y - 30} fill="#ffd27a" fontFamily={MONO} fontSize={22} letterSpacing={4}>O NÚCLEO NÃO ACOMPANHA</text>
            {f >= stuckAt ? <text x={coreS.x + 40} y={coreS.y} fill={TXT} fontFamily={MONO} fontSize={18} letterSpacing={3} opacity={P(f, stuckAt, 8)}>PRESO À FERIDA</text> : null}
          </g>
        ) : null}
        <text x={120} y={150} fill={CYC} fontFamily={MONO} fontSize={18} letterSpacing={5}>O BOREALIS DESLIZA PELO TEMPO</text>
      </svg>
      {/* a fita voltando (para o replay) */}
      {rew > 0 ? (
        <AbsoluteFill style={{ background: `rgba(10,14,20,${rew * 0.5})` }}>
          {Array.from({ length: 6 }).map((_, i) => <div key={i} style={{ position: "absolute", left: 0, right: 0, top: ((f * 23 + i * 190) % 1080), height: 10 + i * 3, background: "rgba(255,255,255,0.12)" }} />)}
          <div style={{ position: "absolute", left: 120, top: 100, fontFamily: MONO, fontSize: 30, color: TXT, letterSpacing: 6, opacity: rew }}>◀◀ 37:05</div>
        </AbsoluteFill>
      ) : null}
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life, 6), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 1:05:49 o replay da cena do labirinto (37:05)
export const HL9Replay: React.FC<PR & { inner?: PR; skip?: number; innerLife?: number }> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [nowAt, diffAt] = ats(p, ["nowAt", "diffAt"]);
  const skip = Math.round((p.skip ?? 24) * 30);
  const innerLife = Math.round((p.innerLife ?? 37.4) * 30);
  const inner = (p.inner ?? {}) as PR;
  const tape = Math.max(0, 1 - f / 10);
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <AbsoluteFill style={{ filter: `saturate(${0.6 + 0.2 * P(f, nowAt, 12)}) contrast(1.05) brightness(0.92)` }}>
        <Sequence from={-skip} durationInFrames={innerLife}>
          <HLRMaze {...inner} life={innerLife} />
        </Sequence>
      </AbsoluteFill>
      {/* a fita: linhas e o rótulo do replay */}
      <AbsoluteFill style={{ background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.2) 0 2px, transparent 2px 4px)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: ((f * 17) % 1080), height: 14, background: "rgba(255,255,255,0.07)" }} />
      <div style={{ position: "absolute", left: 110, top: 90, fontFamily: MONO, color: TXT, letterSpacing: 6, textShadow: "0 2px 8px #000" }}>
        <div style={{ fontSize: 24 }}>▶ REPLAY · 37:05</div>
        <div style={{ fontSize: 15, color: "rgba(242,240,247,0.7)", marginTop: 6 }}>QUANDO ELES ENTRARAM NO BOREALIS</div>
      </div>
      {f >= nowAt ? (
        <div style={{ position: "absolute", right: 110, top: 150, width: 560, padding: "16px 20px", borderRadius: 12, background: "rgba(14,10,4,0.88)", border: "1.5px solid #ffd27a", fontFamily: MONO, opacity: P(f, nowAt, 8) }}>
          <div style={{ fontSize: 15, letterSpacing: 5, color: "#ffd27a" }}>AGORA ELES ENTENDEM</div>
          <div style={{ fontSize: 24, letterSpacing: 2, color: TXT, marginTop: 8 }}>ELA SÓ SABIA</div>
          {f >= diffAt ? <div style={{ fontSize: 24, letterSpacing: 2, color: "#ffd27a", marginTop: 8, opacity: P(f, diffAt, 8) }}>O NÚCLEO SEMPRE FOI DIFERENTE DO RESTO DO NAVIO</div> : null}
        </div>
      ) : null}
      {tape > 0 ? <AbsoluteFill style={{ background: `rgba(20,24,30,${tape * 0.8})` }} /> : null}
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life, 6), pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 1:06:00 o alvo (a planta do Borealis na mesa da sala de comando)
const BPW = 1600;
const BPH = 1035;
const Blueprint: React.FC<{ f: number; conclAt: number; partAt: number; hitAt: number; butAt: number; outAt: number; calcAt: number }> = ({ f, conclAt, partAt, hitAt, butAt, outAt, calcAt }) => {
  // 12/10 (pedido dele: título ilegível; o desenho do navio eram caixas): a planta do quebra-gelo de verdade — o mesmo
  // Borealis do 3D (popa à esquerda com a superestrutura, proa inclinada à direita), conveses e anteparas numeradas, o
  // compartimento do núcleo, régua de cavernas, cota e carimbo. Título grande no canto de baixo (a bússola cobre o alto).
  const ink = "#e8f2ff";
  const dim = "rgba(232,242,255,0.55)";
  const CF = "'Courier New', monospace";
  const hullD = "M 140 470 L 146 600 Q 150 636 214 640 L 1240 640 Q 1372 640 1404 588 L 1492 444 L 1300 462 L 140 470 Z";
  const core: [number, number] = [700, 586];
  return (
    <svg width={BPW} height={BPH} viewBox={`0 0 ${BPW} ${BPH}`}>
      <defs>
        <clipPath id="bpHull">
          <path d={hullD} />
        </clipPath>
        <pattern id="bpHatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="10" stroke="rgba(232,242,255,0.22)" strokeWidth="2" />
        </pattern>
      </defs>
      <rect width={BPW} height={BPH} fill="#1d3f6c" />
      {Array.from({ length: 33 }).map((_, i) => <line key={"v" + i} x1={i * 50} x2={i * 50} y1={0} y2={BPH} stroke="rgba(232,242,255,0.07)" />)}
      {Array.from({ length: 21 }).map((_, i) => <line key={"h" + i} x1={0} x2={BPW} y1={i * 50} y2={i * 50} stroke="rgba(232,242,255,0.07)" />)}
      <rect x={30} y={30} width={BPW - 60} height={BPH - 60} fill="none" stroke={dim} strokeWidth={2} />
      {/* o casco: obras vivas hachuradas, conveses, anteparas */}
      <g clipPath="url(#bpHull)">
        <rect x={100} y={560} width={1420} height={100} fill="url(#bpHatch)" />
        {[520, 594].map((y) => <line key={y} x1={100} x2={1520} y1={y} y2={y} stroke={ink} strokeWidth={1.6} opacity={0.75} />)}
        {[300, 460, 620, 780, 940, 1100, 1260].map((x) => <line key={x} x1={x} y1={440} x2={x} y2={660} stroke={ink} strokeWidth={2} opacity={0.8} />)}
        {/* o compartimento do núcleo (entre as anteparas 3 e 4, embaixo) */}
        <rect x={628} y={526} width={144} height={110} fill="rgba(255,210,122,0.12)" stroke={ink} strokeWidth={2} />
      </g>
      <path d={hullD} fill="none" stroke={ink} strokeWidth={4} />
      <line x1={120} y1={560} x2={1450} y2={560} stroke={ink} strokeWidth={1.5} strokeDasharray="14 8" opacity={0.8} />
      <text x={1456} y={566} fill={dim} fontFamily={CF} fontSize={16}>LA</text>
      {Array.from({ length: 30 }).map((_, i) => <circle key={i} cx={200 + i * 40} cy={500} r={5} fill="none" stroke={ink} strokeWidth={1.4} opacity={0.8} />)}
      {/* amurada */}
      <path d="M 140 470 L 140 452 L 1300 444 L 1492 426 L 1492 444" fill="none" stroke={ink} strokeWidth={1.6} opacity={0.8} />
      {/* superestrutura (3 andares + ponte), chaminé, mastro e radar */}
      <path d="M 190 452 L 190 400 L 470 400 L 470 452 M 210 400 L 210 348 L 446 348 L 446 400 M 232 348 L 232 304 L 420 304 L 420 348 M 250 304 L 250 262 L 430 262 L 430 304" fill="none" stroke={ink} strokeWidth={3} />
      {[0, 1, 2].map((t) => Array.from({ length: 8 - t }).map((_, i) => <rect key={t + "w" + i} x={206 + t * 22 + i * 32} y={414 - t * 52} width={18} height={12} fill="none" stroke={ink} strokeWidth={1.4} opacity={0.85} />))}
      {Array.from({ length: 7 }).map((_, i) => <rect key={"b" + i} x={262 + i * 23} y={272} width={16} height={14} fill="rgba(232,242,255,0.18)" stroke={ink} strokeWidth={1.4} />)}
      <path d="M 300 262 L 290 190 L 360 190 L 352 262" fill="none" stroke={ink} strokeWidth={3} />
      <rect x={291} y={206} width={67} height={14} fill="rgba(232,90,70,0.5)" stroke={ink} strokeWidth={1.4} />
      <path d="M 410 262 L 410 150 M 380 166 L 440 166 M 396 150 L 424 150" fill="none" stroke={ink} strokeWidth={2.5} />
      {/* guindastes, contêineres, escotilhas, castelo de proa e mastro de vante */}
      {[560, 1180].map((x, k) => (
        <g key={x}>
          <path d={`M ${x} 444 L ${x} 392 L ${x + 18} 392 L ${x + 18} 444 M ${x + 9} 392 L ${x + (k ? -130 : 150)} 320`} fill="none" stroke={ink} strokeWidth={2.5} />
          <line x1={x + (k ? -130 : 150)} y1={320} x2={x + (k ? -130 : 150)} y2={420} stroke={ink} strokeWidth={1} strokeDasharray="4 4" />
        </g>
      ))}
      {[[620, 0], [690, 0], [760, 0], [830, 0], [620, 1], [760, 1]].map(([x, r], i) => <rect key={"c" + i} x={x} y={418 - r * 28} width={66} height={26} fill="none" stroke={ink} strokeWidth={1.8} />)}
      {[1010, 1090].map((x) => <rect key={x} x={x} y={430} width={60} height={14} fill="none" stroke={ink} strokeWidth={1.8} />)}
      <path d="M 1360 440 L 1360 414 L 1480 404 L 1480 428" fill="none" stroke={ink} strokeWidth={2.5} />
      <path d="M 1420 410 L 1420 300 M 1404 316 L 1436 316" fill="none" stroke={ink} strokeWidth={2} />
      {/* o núcleo */}
      <circle cx={core[0]} cy={core[1]} r={24} fill="none" stroke={ink} strokeWidth={3} />
      <circle cx={core[0]} cy={core[1]} r={8} fill={ink} />
      <text x={core[0]} y={666} textAnchor="middle" fill={ink} fontFamily={CF} fontSize={22} letterSpacing={3}>NÚCLEO</text>
      {/* régua de cavernas e cota */}
      {Array.from({ length: 28 }).map((_, i) => (
        <g key={"fr" + i}>
          <line x1={140 + i * 50} y1={690} x2={140 + i * 50} y2={i % 4 ? 700 : 710} stroke={dim} strokeWidth={1.5} />
          {i % 4 === 0 ? <text x={140 + i * 50} y={730} textAnchor="middle" fill={dim} fontFamily={CF} fontSize={15}>{`FR ${i * 6}`}</text> : null}
        </g>
      ))}
      <path d="M 140 770 L 1492 770 M 140 760 L 140 780 M 1492 760 L 1492 780" stroke={dim} strokeWidth={1.5} />
      <text x={816} y={762} textAnchor="middle" fill={dim} fontFamily={CF} fontSize={18}>L = 128,4 m</text>
      {/* título e carimbo */}
      <text x={70} y={860} fill={ink} fontFamily={CF} fontSize={46} fontWeight={700} letterSpacing={6}>ABS BOREALIS</text>
      <text x={70} y={906} fill={ink} fontFamily={CF} fontSize={26} letterSpacing={5}>CORTE LONGITUDINAL</text>
      <text x={70} y={944} fill={dim} fontFamily={CF} fontSize={20} letterSpacing={4}>APERTURE SCIENCE · PROJETO 1979</text>
      <g transform="translate(1180 820)">
        <rect width={360} height={160} fill="none" stroke={dim} strokeWidth={2} />
        <line x1={0} y1={50} x2={360} y2={50} stroke={dim} />
        <line x1={0} y1={100} x2={360} y2={100} stroke={dim} />
        <line x1={180} y1={50} x2={180} y2={160} stroke={dim} />
        <text x={14} y={34} fill={ink} fontFamily={CF} fontSize={18}>ENGENHARIA NAVAL</text>
        <text x={14} y={82} fill={dim} fontFamily={CF} fontSize={15}>FOLHA 3/12</text>
        <text x={194} y={82} fill={dim} fontFamily={CF} fontSize={15}>ESC 1:200</text>
        <text x={14} y={134} fill={dim} fontFamily={CF} fontSize={15}>REV · C</text>
        <text x={194} y={134} fill="rgba(232,90,70,0.8)" fontFamily={CF} fontSize={15}>CONFIDENCIAL</text>
      </g>
      {/* o Eli marca a caneta vermelha */}
      {f >= conclAt ? <circle cx={core[0]} cy={core[1]} r={66} fill="none" stroke="#e8382c" strokeWidth={6} pathLength={1} strokeDasharray={`${P(f, conclAt, 16)} 1`} transform={`rotate(-80 ${core[0]} ${core[1]})`} /> : null}
      {f >= partAt ? <text x={790} y={720} fill="#ff6a5a" fontFamily="'Caveat', 'Segoe Print', cursive" fontSize={50} opacity={P(f, partAt, 8)}>não escapa para outro momento</text> : null}
      {f >= hitAt ? <text x={560} y={300} fill="#ff6a5a" fontFamily="'Caveat', 'Segoe Print', cursive" fontSize={70} fontWeight={700} opacity={P(f, hitAt, 8)}>ALVO</text> : null}
      {f >= hitAt ? <path d={`M 640 312 Q 690 400 ${core[0]} ${core[1] - 70}`} fill="none" stroke="#ff6a5a" strokeWidth={4} opacity={P(f, hitAt + 6, 8)} /> : null}
      {f >= butAt
        ? [[260, 520], [520, 540], [980, 540], [1300, 520], [1450, 520], [880, 470]].map(([x, y], k) => (
            <g key={k} opacity={P(f, butAt + k * 4, 8)}>
              <path d={`M ${x} ${y} l ${x < 760 ? -50 : 50} ${y < 500 ? -60 : 60}`} stroke="#ffb066" strokeWidth={5} />
              <path d={`M ${x - 14} ${y - 14} l 28 28 M ${x + 14} ${y - 14} l -28 28`} stroke="#ffb066" strokeWidth={5} />
            </g>
          ))
        : null}
      {f >= outAt ? <text x={830} y={230} fill="#ffb066" fontFamily="'Caveat', 'Segoe Print', cursive" fontSize={56} opacity={P(f, outAt, 8)}>plano A: destruir por fora</text> : null}
      {f >= calcAt ? <text x={860} y={286} fill="#ffb066" fontFamily="'Caveat', 'Segoe Print', cursive" fontSize={40} opacity={P(f, calcAt, 8)}>(só p/ confirmar os cálculos)</text> : null}
    </svg>
  );
};
export const HL9Target: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [eliAt, conclAt, partAt, hitAt, butAt, outAt, calcAt] = ats(p, ["eliAt", "conclAt", "partAt", "hitAt", "butAt", "outAt", "calcAt"]);
  void eliAt;
  const G = useMemo(() => buildWarRoom(), []);
  const e: Eye = { x: 0.03 * Math.sin(f / 60), y: keys(f, [[0, 3.0], [conclAt, 3.2], [butAt, 3.0], [life, 2.9]]), z: keys(f, [[0, 3.0], [life, 3.1]]), yaw: keys(f, [[0, 0], [hitAt, 0.04], [butAt + 10, -0.02], [outAt, 0.12], [life, 0.12]]), pitch: keys(f, [[0, -0.9], [life, -0.94]]), F: 1250 }; // 09/10: mais de cima
  const lights: XL[] = [{ x: 0.04 * Math.sin(f / 34), y: 5.25, z: 1.95, col: [255, 226, 170], k: 1.0, r: 3.6 }, { x: 0, y: 9.4, z: 1.8, col: [130, 210, 255], k: 0.3, r: 5 }];
  return (
    <AbsoluteFill style={{ background: "#040505", overflow: "hidden" }}>
      <Outside e={e} f={f} lightsOn={0.6} />
      {/* 09/10 (pedido dele: a moldura amarela da mesa sumia): ordem por distância real + sem faces de costas */}
      <XView e={e} faces={G} lights={lights} flash={0.15} amb={0.16} seam="rgba(0,0,0,0.35)" solid />
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <Pinned e={e} w={BPW} h={BPH} corners={[mapPt(0, 0), mapPt(BPW, 0), mapPt(BPW, BPH), mapPt(0, BPH)]}>
          <Blueprint f={f} conclAt={conclAt} partAt={partAt} hitAt={hitAt} butAt={butAt} outAt={outAt} calcAt={calcAt} />
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 55%, rgba(255,240,200,0) 0%, rgba(20,14,4,0.35) 75%, rgba(10,8,2,0.6) 100%)" }} />
        </Pinned>
      </div>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <FlagBadge cx={1790} by={560} k={1.0} label="ELI" col={AMB} f={f} />
      </svg>
      <Hud f={f} yaw={e.yaw} eye={e} blips={[]} msg={f < conclAt ? "SALA DE COMANDO · OS DADOS DO KLEINER" : undefined} msgCol={AMB} />
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ================================================================================================= módulo 9 · leva C, parte 2 (1:06:20 → 1:09:12)
// o Borealis visto do gelo, à noite (casco, ilha de comando, guindastes); dano: seções escuras/caídas e marcas de queimado
const shipNight = (g: ReturnType<typeof mk>, y0: number, o: { collapse?: number; scars?: boolean } = {}) => {
  const hull: RGB = [40, 44, 48];
  for (let i = 0; i < 6; i++) {
    const x = -60 + i * 20;
    const drop = i === 3 ? (o.collapse ?? 0) * 6 : 0;
    g.box(x, y0, 0 - drop, 20, 16, 14, i === 3 && (o.collapse ?? 0) > 0 ? [26, 24, 22] : hull);
  }
  g.box(-58, y0 + 2, 14, 116, 12, 0.6, [52, 56, 60]);
  g.box(30, y0 + 3, 14, 18, 10, 14, [48, 52, 56]);
  g.box(34, y0 + 4, 28, 10, 8, 5, [44, 48, 52]);
  [[-30, 0], [-6, 0]].forEach(([x]) => {
    g.box(x, y0 + 7, 14, 1.2, 1.2, 18, [36, 40, 44]);
    g.box(x - 12, y0 + 7, 30, 13, 1, 1, [36, 40, 44]);
  });
  // as luzes do casco
  for (let i = 0; i < 18; i++) g.quad([-56 + i * 6.5, y0 - 0.05, 10], [-55 + i * 6.5, y0 - 0.05, 10], [-55 + i * 6.5, y0 - 0.05, 11], [-56 + i * 6.5, y0 - 0.05, 11], [255, 220, 150], [0, -1, 0], { emit: 0.7 });
  if (o.scars) [[-44, 6, 6, 5], [-8, 9, 8, 4], [22, 4, 5, 6]].forEach(([x, z, w, h]) => g.quad([x, y0 - 0.06, z], [x + w, y0 - 0.06, z + 0.8], [x + w - 0.6, y0 - 0.06, z + h], [x - 0.4, y0 - 0.06, z + h - 0.6], [14, 12, 10], [0, -1, 0], { tag: "scar" }));
};
const iceField = (g: ReturnType<typeof mk>) => {
  for (let ix = -14; ix < 14; ix++)
    for (let iy = -2; iy < 12; iy++) {
      const k = 0.94 + rnd(ix * 31 + iy * 17) * 0.08;
      g.quad([ix * 20, iy * 20, 0], [ix * 20 + 20, iy * 20, 0], [ix * 20 + 20, iy * 20 + 20, 0], [ix * 20, iy * 20 + 20, 0], [140 * k, 156 * k, 172 * k], [0, 0, 1]);
    }
};
const Boom: React.FC<{ e: Eye; pt: V3; f: number; t0: number; s?: number }> = ({ e, pt, f, t0, s = 1 }) => {
  if (f < t0 || f > t0 + 40) return null;
  const q = proj(e, pt);
  if (!q) return null;
  const k = (f - t0) / 40;
  const r = ((6 + 22 * Math.sqrt(k)) * 1000 * s) / q.d;
  return (
    <g opacity={1 - k}>
      <circle cx={q.x} cy={q.y} r={r} fill="rgba(255,170,60,0.55)" style={{ filter: "blur(4px)" }} />
      <circle cx={q.x} cy={q.y} r={r * 0.5} fill="#fff1c8" />
      <circle cx={q.x} cy={q.y - r * 0.6 * k} r={r * 1.3 * k} fill="rgba(40,36,34,0.5)" />
    </g>
  );
};

// ---------------------------------------------------------------- 1:06:06 o ataque total (refeito 09/10)
// pedido dele: "genérico, sem clareza de que é um navio de verdade, coisas surgindo do nada" — refeito com calma:
// o Borealis é o MESMO modelo sólido do resto do vídeo (casco quebra-gelo, superestrutura, guindastes), visto de lado
// sobre o gelo; a Resistência numa crista de neve à frente: cada peça SOBE de trás da crista quando é nomeada (canhões
// com rodas e cano apontado, caixas de explosivos, a artilharia improvisada, dois aviões remendados que cruzam o céu).
// O navio surge em fase (pisca, onda de distorção), todos atiram ao mesmo tempo (traçantes até pontos reais do casco),
// o casco rasga (meia-nau escurece e queima), a proa INTEIRA tomba e afunda no gelo, explosões nos conveses, e o navio
// some piscando de fase. HL9Silent: o MESMO navio volta inteiro, com as marcas exatamente nos mesmos lugares.
const BK = 4.0; // escala do modelo
const BY = 50; // distância do navio
const BZB = 0.45 * BK; // a quilha um pouco enterrada no gelo
// pontos do casco (modelo) onde os tiros batem e as marcas ficam
const B_HITS: [number, number, number][] = [[-2.2, -1.26, 0.6], [0.6, -1.26, 0.4], [1.8, -1.26, 0.7], [-4.2, -1.06, 1.6], [3.4, -1.1, 0.5], [-0.8, -1.26, 0.2]];
const bw = (m: [number, number, number]): V3 => [m[0] * BK, BY + m[1] * BK, m[2] * BK + BZB];
// o navio no mundo: escala, posição; proa (x > 2.3) tomba em torno da junta; meia-nau queimada
const placeBorealis = (faces: XF[], o: { collapse?: number; burn?: number; scars?: boolean }): XF[] => {
  const col = o.collapse ?? 0;
  const ang = -0.42 * col;
  const piv = [2.3, 0.0];
  return faces.map((fc) => {
    const cx = fc.p.reduce((s, q) => s + q[0], 0) / fc.p.length;
    const bow = cx > piv[0];
    const P = fc.p.map((q) => {
      let x = q[0], z = q[2];
      if (bow && col > 0) {
        const dx = x - piv[0], dz = z - piv[1];
        x = piv[0] + dx * Math.cos(ang) - dz * Math.sin(ang);
        z = piv[1] + dx * Math.sin(ang) + dz * Math.cos(ang) - 1.2 * col;
      }
      return [x * BK, BY + q[1] * BK, z * BK + BZB] as V3;
    });
    let c = fc.col;
    const mid = cx > -0.8 && cx < 2.3;
    if ((o.burn ?? 0) > 0 && mid) {
      const k = 1 - 0.65 * (o.burn ?? 0);
      c = [c[0] * k + 20 * (o.burn ?? 0), c[1] * k, c[2] * k];
    }
    if (o.scars && fc.n[1] < -0.5 && (mid || B_HITS.some((h) => Math.abs(cx - h[0]) < 0.5))) c = [c[0] * 0.55 + 14, c[1] * 0.5, c[2] * 0.48];
    return { ...fc, p: P, col: c };
  });
};
// tubo de 4 lados entre dois pontos (o cano dos canhões)
const beam = (g: ReturnType<typeof mk>, a: V3, b: V3, r: number, col: RGB) => {
  const d: V3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const L = Math.hypot(d[0], d[1], d[2]) || 1;
  const u: V3 = [d[0] / L, d[1] / L, d[2] / L];
  const s1: V3 = Math.abs(u[2]) < 0.9 ? [u[1], -u[0], 0] : [1, 0, 0];
  const l1 = Math.hypot(s1[0], s1[1], s1[2]) || 1;
  const v1: V3 = [s1[0] / l1, s1[1] / l1, s1[2] / l1];
  const v2: V3 = [u[1] * v1[2] - u[2] * v1[1], u[2] * v1[0] - u[0] * v1[2], u[0] * v1[1] - u[1] * v1[0]];
  const cs = [[1, 1], [-1, 1], [-1, -1], [1, -1]].map(([i, j]) => [v1[0] * i * r + v2[0] * j * r, v1[1] * i * r + v2[1] * j * r, v1[2] * i * r + v2[2] * j * r]);
  for (let k = 0; k < 4; k++) {
    const c0 = cs[k], c1 = cs[(k + 1) % 4];
    const n: V3 = [(c0[0] + c1[0]) / 2, (c0[1] + c1[1]) / 2, (c0[2] + c1[2]) / 2];
    g.quad([a[0] + c0[0], a[1] + c0[1], a[2] + c0[2]], [a[0] + c1[0], a[1] + c1[1], a[2] + c1[2]], [b[0] + c1[0], b[1] + c1[1], b[2] + c1[2]], [b[0] + c0[0], b[1] + c0[1], b[2] + c0[2]], col, n);
  }
};
export const HL9Barrage: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [prepAt, cannonAt, explAt, artAt, airAt, surgeAt, fireAt, workAt, tearAt, collapseAt, deckAt, goneAt] = ats(p, ["prepAt", "cannonAt", "explAt", "artAt", "airAt", "surgeAt", "fireAt", "workAt", "tearAt", "collapseAt", "deckAt", "goneAt"]);
  void prepAt;
  const SHIP = useMemo(() => buildBorealis(), []);
  const shake = f >= fireAt && f < goneAt + 10 ? Math.sin(f * 2.4) * 0.004 : 0;
  // câmera: atrás da crista, olhando as peças subirem (perto) → levanta para o navio quando ele surge
  const e: Eye = { x: keys(f, [[0, -6], [airAt, -2], [surgeAt, 0], [life, 1]]), y: -4, z: keys(f, [[0, 3.2], [surgeAt, 4.2], [life, 4.4]]), yaw: keys(f, [[0, -0.18], [airAt, 0.0], [life, 0.03]]) + shake, pitch: keys(f, [[0, -0.12], [airAt - 10, -0.04], [surgeAt, 0.03], [life, 0.04]]), F: 1000 };
  const g = mk();
  // o gelo e a crista de neve onde a Resistência se posiciona
  for (let ix = -10; ix < 10; ix++)
    for (let iy = -1; iy < 9; iy++) {
      const k = 0.94 + rnd(ix * 31 + iy * 17) * 0.08;
      g.quad([ix * 20, iy * 20, 0], [ix * 20 + 20, iy * 20, 0], [ix * 20 + 20, iy * 20 + 20, 0], [ix * 20, iy * 20 + 20, 0], [140 * k, 156 * k, 172 * k], [0, 0, 1], { tag: "floor" });
    }
  g.quad([-60, 8, 0], [60, 8, 0], [60, 10, 1.4], [-60, 10, 1.4], [196, 206, 216], [0, -0.6, 0.8]);
  g.quad([-60, 10, 1.4], [60, 10, 1.4], [60, 13, 0], [-60, 13, 0], [176, 186, 196], [0, 0.6, 0.8]);
  // as peças: cada uma sobe de trás da crista quando é nomeada (nada aparece do nada)
  const up = (t0: number) => -2.2 * (1 - IOx((f - t0) / 22));
  const CAN: [number, number, number][] = [[-16, 12, cannonAt], [-6, 12.4, cannonAt + 8], [6, 12.2, cannonAt + 16], [15, 12.6, cannonAt + 24]];
  const aim = (x: number, y: number, z: number) => {
    const t = bw(B_HITS[0]);
    const d = [t[0] - x, t[1] - y, t[2] - z];
    const L = Math.hypot(d[0], d[1], d[2]);
    return [x + (d[0] / L) * 3.4, y + (d[1] / L) * 3.4, z + (d[2] / L) * 3.4 + 1.0] as V3;
  };
  CAN.forEach(([x, y, t0]) => {
    if (f < t0 - 2) return;
    const z = up(t0) + 1.2;
    g.box(x - 1.0, y - 0.8, z, 2.0, 1.6, 0.6, [62, 58, 46]);
    g.prism(x - 1.05, y, z - 0.1, z + 0.02, 0.55, 8, [30, 30, 28], undefined, 0);
    g.prism(x + 1.05, y, z - 0.1, z + 0.02, 0.55, 8, [30, 30, 28], undefined, 0);
    beam(g, [x, y, z + 0.8], aim(x, y, z + 0.8), 0.16, [40, 42, 40]);
  });
  if (f >= explAt - 2) [[-11, 12.4], [-10, 12.8], [10.6, 12.5]].forEach(([x, y], k) => {
    const z = up(explAt + k * 4) + 1.2;
    g.box(x - 0.45, y - 0.35, z, 0.9, 0.7, 0.6, [120, 92, 50]);
    g.box(x - 0.46, y - 0.36, z + 0.25, 0.92, 0.72, 0.1, [190, 50, 36]);
  });
  const ART: [number, number, number][] = [[-24, 13, artAt], [23, 13, artAt + 8]];
  ART.forEach(([x, y, t0]) => {
    if (f < t0 - 2) return;
    const z = up(t0) + 1.2;
    g.box(x - 1.4, y - 1.4, z, 2.8, 2.8, 0.9, [58, 50, 40]);
    for (let k = 0; k < 4; k++) beam(g, [x - 0.9 + k * 0.6, y, z + 0.9], [x - 0.9 + k * 0.6, y + 1.6, z + 2.3], 0.18, [70, 66, 58]);
  });
  // os aviões remendados (3D), cruzando da esquerda para a direita, mal voando
  const planes = [0, 1].map((k) => {
    const t = (f - airAt - k * 22) / 150;
    if (t < 0 || t > 1.3) return null;
    return { x: -60 + t * 100, y: 40 + k * 12, z: 16 + k * 5 + Math.sin(t * 11 + k) * 0.8, roll: Math.sin(t * 7 + k) * 0.2 };
  });
  planes.forEach((pl) => {
    if (!pl) return;
    g.box(pl.x - 2.2, pl.y - 0.35, pl.z - 0.35, 4.4, 0.7, 0.7, [70, 74, 66]);
    g.box(pl.x - 0.5, pl.y - 3.6, pl.z + pl.roll * 3 - 0.06, 1.2, 7.2, 0.12, [86, 90, 80]);
    g.box(pl.x - 2.2, pl.y - 1.2, pl.z - 0.06, 0.6, 2.4, 0.1, [86, 90, 80]);
    g.box(pl.x - 2.2, pl.y - 0.05, pl.z, 0.6, 0.1, 1.0, [86, 90, 80]);
  });
  // o navio
  const ship = f >= surgeAt - 2 && f < goneAt + 24;
  const collapse = P(f, collapseAt, 40);
  const burn = P(f, tearAt, 30);
  const phaseIn = P(f, surgeAt, 16);
  const flick = f >= surgeAt && f < surgeAt + 30 ? (rnd(Math.floor(f / 2)) > 0.6 ? 0.35 : 1) : f >= goneAt ? (rnd(Math.floor(f / 2) + 5) > 0.5 ? 0.25 : 1) * (1 - P(f, goneAt, 22)) : 1;
  const shipF = ship ? placeBorealis(SHIP, { collapse, burn }) : [];
  const lights: XL[] = [
    { x: -40, y: -60, z: 60, col: [190, 210, 235], k: 0.7, r: 220 },
    ...(ship && f >= fireAt ? [{ x: 2 * BK, y: BY - 6, z: 6, col: [255, 160, 70] as RGB, k: 0.6 + 0.35 * Math.sin(f / 2), r: 40 }] : []),
  ];
  const surgeFlash = f >= surgeAt && f < surgeAt + 14 ? 1 - (f - surgeAt) / 14 : 0;
  const goneFlash = f >= goneAt && f < goneAt + 18 ? 1 - (f - goneAt) / 18 : 0;
  const inv: [number, string][] = [[cannonAt, "CANHÕES RECUPERADOS · 4"], [explAt, "EXPLOSIVOS"], [artAt, "ARTILHARIA IMPROVISADA"], [airAt, "AERONAVES · MAL VOAM"]];
  const ctr = proj(e, [0.3 * BK, BY, 1.6 * BK + BZB]);
  return (
    <AbsoluteFill style={{ background: "#050a10", overflow: "hidden" }}>
      <NightSky e={e} f={f} />
      {/* camadas: o gelo (chão) → o navio → a crista e as peças da Resistência (na frente) */}
      <XView e={e} faces={g.F.filter((fc) => fc.tag === "floor")} lights={lights} flash={0.2} amb={0.3} seam="rgba(0,0,0,0.12)" />
      {ship ? (
        <div style={{ position: "absolute", inset: 0, opacity: phaseIn * flick }}>
          <XView e={e} faces={shipF} lights={lights} flash={0.15} amb={0.32} seam="rgba(0,0,0,0.25)" solid />
        </div>
      ) : null}
      <XView e={e} faces={g.F.filter((fc) => fc.tag !== "floor")} lights={lights} flash={0.2} amb={0.3} seam="rgba(0,0,0,0.12)" solid />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {/* a onda de fase quando ele surge */}
        {ctr && f >= surgeAt && f < surgeAt + 30
          ? [0, 8].map((d) => {
              const u = (f - surgeAt - d) / 22;
              return u > 0 && u < 1 ? <ellipse key={d} cx={ctr.x} cy={ctr.y} rx={300 + u * 900} ry={90 + u * 260} fill="none" stroke="rgba(180,255,220,0.8)" strokeWidth={6 * (1 - u)} opacity={1 - u} /> : null;
            })
          : null}
        {/* traçantes até pontos reais do casco */}
        {f >= fireAt && f < goneAt
          ? CAN.map(([x, y], k) => {
              if ((f + k * 5) % 12 > 4) return null;
              const a = proj(e, aim(x, y, 2.0));
              const b = proj(e, bw(B_HITS[(k + Math.floor(f / 12)) % B_HITS.length]));
              return a && b ? <line key={k} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="rgba(255,220,130,0.9)" strokeWidth={2.5} /> : null;
            })
          : null}
        {f >= fireAt && f < goneAt
          ? ART.map(([x, y], k) => {
              const t = ((f - fireAt + k * 9) % 24) / 24;
              const a = [x, y + 1.6, 3.6], b = bw(B_HITS[(k * 3 + Math.floor((f - fireAt) / 24)) % B_HITS.length]);
              const q = proj(e, [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t + Math.sin(t * Math.PI) * 14]);
              return q ? <circle key={"r" + k} cx={q.x} cy={q.y} r={4} fill="#ffe08a" style={{ filter: "drop-shadow(0 0 6px #ffb040)" }} /> : null;
            })
          : null}
        {f >= fireAt && f < goneAt ? B_HITS.map((h, k) => [0, 1, 2].map((r) => <Boom key={`${k}${r}`} e={e} pt={bw(h)} f={f} t0={fireAt + k * 7 + r * 40 + Math.round(rnd(k + r) * 6)} s={0.22} />)) : null}
        {f >= tearAt ? <Boom e={e} pt={bw([0.8, -1.2, 0.6])} f={f} t0={tearAt} s={0.55} /> : null}
        {f >= collapseAt ? <Boom e={e} pt={bw([2.4, -1.2, 0.2])} f={f} t0={collapseAt + 6} s={0.6} /> : null}
        {f >= deckAt ? [0, 1, 2, 3].map((k) => <Boom key={"d" + k} e={e} pt={bw([-4.4 + k * 1.6, 0, 1.4 + (k === 0 ? 1.5 : 0)])} f={f} t0={deckAt + k * 6} s={0.4} />) : null}
        {/* fogo na meia-nau rasgada */}
        {f >= tearAt && f < goneAt
          ? Array.from({ length: 10 }).map((_, k) => {
              const q = proj(e, bw([-0.6 + rnd(k) * 2.8, -1.1, 0.7 + rnd(k * 3) * 0.4]));
              if (!q) return null;
              const h = (20 + 30 * rnd(k * 5)) * (1 + 0.3 * Math.sin(f / 3 + k));
              return <ellipse key={"fg" + k} cx={q.x} cy={q.y - h / 2} rx={h * 0.3} ry={h / 2} fill="rgba(255,150,50,0.7)" style={{ filter: "blur(3px)" }} opacity={burn} />;
            })
          : null}
        {ship ? <Call e={e} f={f} pt={bw([-4.2, 0, 4.4])} from={surgeAt + 8} until={fireAt + 10} text="O BOREALIS SURGE SOBRE O GELO" col={CYC} dx={300} dy={-110} /> : null}
        {f >= collapseAt && ship ? <Call e={e} f={f} pt={bw([4.6, 0, 0.4 - collapse * 0.8])} from={collapseAt + 10} until={goneAt} text="A PROA INTEIRA DESABA" col={RED} dx={200} dy={-160} /> : null}
        {f >= workAt && f < tearAt ? <text x={960} y={250} textAnchor="middle" fill={AMB} fontFamily={MONO} fontSize={22} letterSpacing={6} opacity={P(f, workAt, 8)}>POR ALGUNS MINUTOS · PARECE FUNCIONAR</text> : null}
        {f >= goneAt + 14 ? <text x={960} y={250} textAnchor="middle" fill={TXT} fontFamily={MONO} fontSize={24} letterSpacing={8} opacity={P(f, goneAt + 14, 8)}>O BOREALIS DESAPARECE</text> : null}
      </svg>
      {/* o inventário: cada linha entra junto com a peça que sobe */}
      <div style={{ position: "absolute", left: 90, top: 120, width: 480, padding: "14px 18px", borderRadius: 10, background: "rgba(14,10,4,0.82)", border: `1.5px solid ${AMB}`, fontFamily: MONO, opacity: P(f, 4, 10) * (1 - P(f, surgeAt + 20, 14)) }}>
        <div style={{ fontSize: 15, letterSpacing: 5, color: AMB }}>A RESISTÊNCIA · TUDO O QUE FICA DE PÉ</div>
        {inv.filter(([t0]) => f >= t0).map(([t0, txt]) => (
          <div key={txt} style={{ display: "flex", gap: 10, marginTop: 10, fontSize: 19, letterSpacing: 2, color: TXT, opacity: P(f, t0, 8) }}>
            <span style={{ color: GREEN }}>✓</span>
            {txt}
          </div>
        ))}
      </div>
      {surgeFlash > 0 ? <AbsoluteFill style={{ background: `rgba(180,255,220,${surgeFlash * 0.5})` }} /> : null}
      {goneFlash > 0 ? <AbsoluteFill style={{ background: `rgba(255,240,220,${goneFlash * 0.6})` }} /> : null}
      <Hud f={f} yaw={e.yaw} eye={e} blips={[]} msg={f < surgeAt ? "A PRÓXIMA MANIFESTAÇÃO" : f < fireAt ? "TODOS AO MESMO TEMPO" : undefined} msgCol={AMB} />
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 1:06:45 o silêncio (três dias) → o Borealis volta inteiro
export const HL9Silent: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [d1At, d2At, d3At, eliAt, beepAt, backAt, marksAt] = ats(p, ["d1At", "d2At", "d3At", "eliAt", "beepAt", "backAt", "marksAt"]);
  const day = f >= d3At ? 3 : f >= d2At ? 2 : f >= d1At ? 1 : 0;
  const pov = f >= backAt;
  const e: Eye = { x: 0, y: 0, z: 1.6, yaw: 0.02, pitch: 0.05, F: 1000 };
  // 09/10: a mesma câmera da crista do ataque
  const eS: Eye = { x: 1, y: -4, z: 4.4, yaw: 0.03, pitch: 0.04, F: 1000 };
  const g = mk();
  const SHIPS = useMemo(() => buildBorealis(), []);
  if (pov) {
    iceField(g);
  }
  // 09/10: o MESMO navio do ataque, inteiro, com as marcas nos mesmos lugares
  const shipBack = pov ? placeBorealis(SHIPS, { scars: true }) : [];
  const flash = f >= backAt && f < backAt + 14 ? 1 - (f - backAt) / 14 : 0;
  return (
    <AbsoluteFill style={{ background: "#050403", overflow: "hidden" }}>
      {!pov ? (
        <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, #14110c 0%, #050404 80%)" }}>
          {/* o calendário na parede */}
          <div style={{ position: "absolute", left: 230, top: 260, width: 380, height: 460, background: "#efe6cf", boxShadow: "0 20px 40px rgba(0,0,0,0.6)", fontFamily: "'Courier New', monospace", color: "#2a2418" }}>
            <div style={{ height: 80, background: "#8a2a1e", color: "#f4ece0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, letterSpacing: 6 }}>SEM SINAL</div>
            <div style={{ textAlign: "center", fontSize: 220, fontWeight: 700, marginTop: 30, transform: `rotateX(${day > 0 ? 0 : 0}deg)` }}>{day || "–"}</div>
            <div style={{ textAlign: "center", fontSize: 30, letterSpacing: 8 }}>{day ? (day === 1 ? "DIA" : "DIAS") : ""}</div>
          </div>
          {/* o osciloscópio do Kleiner */}
          <div style={{ position: "absolute", left: 760, top: 240, width: 940, height: 500, borderRadius: 16, background: "#04100a", border: "6px solid #2a2b24" }}>
            <svg width={928} height={488} style={{ position: "absolute", inset: 0 }}>
              {Array.from({ length: 9 }).map((_, i) => <line key={i} x1={0} x2={928} y1={i * 61} y2={i * 61} stroke="rgba(125,255,154,0.08)" />)}
              <polyline
                points={Array.from({ length: 160 }).map((_, i) => {
                  const x = i * 5.8;
                  const ph = ((x - (f - beepAt) * 12) % 300 + 300) % 300;
                  const spike = f >= beepAt && ph < 18 ? Math.sin((ph / 18) * Math.PI * 2) * 150 : 0;
                  return `${x},${244 - spike + (rnd(i + Math.floor(f / 3)) - 0.5) * 3}`;
                }).join(" ")}
                fill="none"
                stroke="#7dff9a"
                strokeWidth={3}
                style={{ filter: "drop-shadow(0 0 6px rgba(125,255,154,0.8))" }}
              />
              <text x={20} y={40} fill="#7dff9a" fontFamily="'Courier New', monospace" fontSize={20} letterSpacing={4}>{f >= beepAt ? "SINAL DO BOREALIS · DETECTADO" : "SINAL DO BOREALIS · NENHUM"}</text>
              <circle cx={890} cy={36} r={12} fill={f >= beepAt && Math.floor(f / 5) % 2 ? "#ff5a3a" : "#3a1a10"} style={{ filter: f >= beepAt ? "drop-shadow(0 0 10px #ff5a3a)" : undefined }} />
            </svg>
          </div>
          {f >= eliAt ? (
            <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: P(f, eliAt, 10) }}>
              <FlagBadge cx={1480} by={980} k={1.1} label="ELI" col={AMB} f={f} sub="TALVEZ TENHA ACABADO" />
            </svg>
          ) : null}
          <div style={{ position: "absolute", left: 0, right: 0, top: 120, textAlign: "center", fontFamily: MONO, fontSize: 22, letterSpacing: 10, color: CREAM, opacity: P(f, 2, 10) }}>SILÊNCIO</div>
        </AbsoluteFill>
      ) : (
        <AbsoluteFill>
          <NightSky e={e} f={f} />
          <XView e={eS} faces={g.F} lights={[{ x: -40, y: -60, z: 60, col: [190, 210, 235], k: 0.7, r: 220 }]} flash={0.2} amb={0.3} seam="rgba(0,0,0,0.12)" />
          <XView e={eS} faces={shipBack} lights={[{ x: -40, y: -60, z: 60, col: [190, 210, 235], k: 0.7, r: 220 }]} flash={0.15} amb={0.32} seam="rgba(0,0,0,0.25)" solid />
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            <Call e={eS} f={f} pt={bw([-4.2, 0, 4.4])} from={backAt + 8} until={life} text="O BOREALIS REAPARECE · INTEIRO" col={CYC} dx={-300} dy={-120} />
            {f >= marksAt
              ? [B_HITS[0], B_HITS[1], B_HITS[4]].map((h, k) => <Call key={k} e={eS} f={f} pt={bw(h)} from={marksAt + k * 5} until={life} text={k === 0 ? "AS MESMAS MARCAS" : ""} sub={k === 0 ? "DE ANTES DO ATAQUE" : undefined} col={RED} dx={k === 0 ? -160 : 40} dy={k === 0 ? 150 : 120} />)
              : null}
          </svg>
          {flash > 0 ? <AbsoluteFill style={{ background: `rgba(180,255,220,${flash * 0.6})` }} /> : null}
        </AbsoluteFill>
      )}
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life, 6), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 1:07:25 a rede da Union (a Terra, os nós, a hipótese, a prova)
const CITIES: [number, number, number][] = [
  [40.7, -74, 1], [34, -118, 0], [41.9, -87.6, 0], [19.4, -99.1, 1], [-23.5, -46.6, 1], [-34.6, -58.4, 0], [4.7, -74, 0], [-12, -77, 0], [51.5, -0.1, 2], [48.8, 2.3, 1], [52.5, 13.4, 0], [55.7, 37.6, 1], [41, 29, 0], [30, 31.2, 1], [-1.3, 36.8, 0], [6.5, 3.4, 0], [-33.9, 18.4, 0],
  [28.6, 77.2, 1], [19, 72.8, 0], [39.9, 116.4, 2], [31.2, 121.5, 1], [35.7, 139.7, 1], [37.5, 127, 0], [1.3, 103.8, 0], [-6.2, 106.8, 0], [-33.9, 151.2, 1], [14.6, 121, 0], [64.1, -21.9, 0], [61.2, -149.9, 0], [45.5, -73.6, 0], [25.2, 55.3, 0], [59.9, 30.3, 0], [37.9, 23.7, 0], [-4.3, 15.3, 0], [33.7, 73.1, 0],
];
const Globe: React.FC<{ f: number; cx: number; cy: number; R: number; rot: number; nodes: number; links: number; sync: number; hit: number; o?: number }> = ({ f, cx, cy, R, rot, nodes, links, sync, hit, o = 1 }) => {
  const P2 = (lat: number, lon: number) => {
    const la = (lat * Math.PI) / 180;
    const lo = ((lon + rot) * Math.PI) / 180;
    const x = Math.cos(la) * Math.sin(lo);
    const y = Math.sin(la);
    const z = Math.cos(la) * Math.cos(lo);
    return { x: cx + x * R, y: cy - y * R, z };
  };
  const pts = CITIES.map(([la, lo, t]) => ({ ...P2(la, lo), t }));
  const pulse = 0.5 + 0.5 * Math.sin(f / 6);
  return (
    <g opacity={o}>
      <defs>
        <radialGradient id="glbG" cx="0.4" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#123a5a" />
          <stop offset="1" stopColor="#040c16" />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={R} fill="url(#glbG)" stroke="rgba(95,243,255,0.45)" strokeWidth={2} />
      {[-60, -30, 0, 30, 60].map((la) => {
        const ry = R * Math.cos((la * Math.PI) / 180);
        return <ellipse key={la} cx={cx} cy={cy - R * Math.sin((la * Math.PI) / 180)} rx={ry} ry={ry * 0.12} fill="none" stroke="rgba(95,243,255,0.12)" />;
      })}
      {Array.from({ length: 12 }).map((_, i) => {
        const lo = i * 30 + rot;
        const rx = Math.abs(R * Math.sin((lo * Math.PI) / 180));
        return <ellipse key={i} cx={cx} cy={cy} rx={rx} ry={R} fill="none" stroke="rgba(95,243,255,0.1)" />;
      })}
      {/* as ligações da rede (só entre nós visíveis próximos) */}
      {links > 0
        ? pts.map((a, i) =>
            pts.slice(i + 1).map((b, j) => {
              if (a.z < 0 || b.z < 0) return null;
              const d = Math.hypot(a.x - b.x, a.y - b.y);
              if (d > R * 0.6) return null;
              return <line key={`${i}-${j}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={VIO} strokeWidth={1.2} opacity={links * 0.45 * (0.4 + 0.6 * a.z)} />;
            }),
          )
        : null}
      {pts.map((q, i) =>
        q.z > -0.05 && nodes > 0 ? (
          <g key={i} opacity={nodes * (0.4 + 0.6 * Math.max(0, q.z))}>
            {hit > 0 ? <circle cx={q.x} cy={q.y} r={(q.t + 2) * 7 * (1 + hit * pulse)} fill="none" stroke="#ffd27a" strokeWidth={2} opacity={hit} /> : null}
            <circle cx={q.x} cy={q.y} r={q.t === 2 ? 9 : q.t === 1 ? 6 : 3.5} fill={q.t === 2 ? VIO : q.t === 1 ? "#7fe8ff" : CYC} opacity={sync > 0 ? 0.6 + 0.4 * pulse : 1} style={{ filter: q.t === 2 ? `drop-shadow(0 0 8px ${VIO})` : undefined }} />
          </g>
        ) : null,
      )}
    </g>
  );
};
export const HL9UnionNet: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [baseAt, isoAt, netAt, soldAt, synthAt, advAt, sigAt, hypAt, riftAt, findAt, loadAt, nodesAt, notAt, selfAt, mathAt, existsAt, oneAt, modelAt, cantAt, needAt, possAt, twoAt, destAt, useAt] = ats(p, ["baseAt", "isoAt", "netAt", "soldAt", "synthAt", "advAt", "sigAt", "hypAt", "riftAt", "findAt", "loadAt", "nodesAt", "notAt", "selfAt", "mathAt", "existsAt", "oneAt", "modelAt", "cantAt", "needAt", "possAt", "twoAt", "destAt", "useAt"]);
  void baseAt;
  const rot = -40 + f * 0.12;
  const phA = 1 - P(f, mathAt - 6, 14);
  const phB = P(f, mathAt - 6, 14) * (1 - P(f, twoAt - 8, 14));
  const phC = P(f, twoAt - 8, 14);
  const gx = keys(f, [[0, 960], [hypAt, 960], [hypAt + 24, 1180]]);
  const borX = 330;
  const borY = 800;
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, #0a1420 0%, #03060a 80%)", overflow: "hidden" }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {Array.from({ length: 120 }).map((_, i) => <circle key={i} cx={rnd(i) * 1920} cy={rnd(i * 3) * 1080} r={0.6 + rnd(i * 5)} fill="#fff" opacity={0.25 + 0.4 * rnd(i * 7)} />)}
      </svg>
      {phA > 0.01 ? (
        <AbsoluteFill style={{ opacity: phA }}>
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
            {/* o elo com o Overworld cortado */}
            {f >= isoAt ? (
              <g opacity={P(f, isoAt, 10)}>
                <path d={`M ${gx} ${540 - 330} L ${gx} 60`} stroke="rgba(199,155,255,0.5)" strokeWidth={4} strokeDasharray="6 8" />
                <path d={`M ${gx - 22} 140 l 44 -30 M ${gx + 22} 140 l -44 -30`} stroke={RED} strokeWidth={5} />
                <text x={gx + 40} y={110} fill={RED} fontFamily={MONO} fontSize={18} letterSpacing={4}>OVERWORLD · SUPERPORTAL FECHADO</text>
              </g>
            ) : null}
            <Globe f={f} cx={gx} cy={560} R={320} rot={rot} nodes={P(f, netAt, 20)} links={P(f, netAt + 10, 30)} sync={f >= sigAt ? 1 : 0} hit={f >= nodesAt ? P(f, nodesAt, 20) : 0} />
            {/* a hipótese: o Borealis e a fenda procurando a assinatura */}
            {f >= hypAt ? (
              <g opacity={P(f, hypAt, 12)}>
                <path d={`M ${borX - 60} ${borY} L ${borX + 50} ${borY} L ${borX + 64} ${borY - 10} L ${borX + 56} ${borY + 14} L ${borX - 54} ${borY + 14} Z`} fill="rgba(6,24,14,0.9)" stroke={GREEN} strokeWidth={2.5} />
                <text x={borX} y={borY + 50} textAnchor="middle" fill={GREEN} fontFamily={MONO} fontSize={18} letterSpacing={4}>BOREALIS</text>
                {f >= riftAt ? <ellipse cx={borX + 120} cy={borY} rx={22 + 6 * Math.sin(f / 5)} ry={48} fill="rgba(199,155,255,0.15)" stroke={VIO} strokeWidth={3} /> : null}
                {f >= riftAt ? <text x={borX + 120} y={borY - 70} textAnchor="middle" fill={VIO} fontFamily={MONO} fontSize={16} letterSpacing={3}>A FENDA</text> : null}
              </g>
            ) : null}
            {f >= loadAt
              ? CITIES.slice(0, 18).map(([la, lo], i) => {
                  const lat = (la * Math.PI) / 180;
                  const lon = ((lo + rot) * Math.PI) / 180;
                  const z = Math.cos(lat) * Math.cos(lon);
                  if (z < 0.1) return null;
                  const x = gx + Math.cos(lat) * Math.sin(lon) * 320;
                  const y = 560 - Math.sin(lat) * 320;
                  const k = P(f, loadAt + i * 2, 16);
                  return <path key={i} d={`M ${borX + 140} ${borY} Q ${(borX + x) / 2 + 80} ${Math.min(borY, y) - 120} ${borX + 140 + (x - borX - 140) * k} ${borY + (y - borY) * k}`} fill="none" stroke="#ffd27a" strokeWidth={1.6} opacity={0.6} />;
                })
              : null}
          </svg>
          {/* as legendas */}
          <div style={{ position: "absolute", left: 90, top: 110, width: 540, fontFamily: MONO }}>
            <div style={{ fontSize: 16, letterSpacing: 5, color: CYC }}>BASE COMBINE CAPTURADA · KLEINER E MAGNUSSON</div>
            {f >= netAt ? <div style={{ fontSize: 30, letterSpacing: 2, color: TXT, marginTop: 10, opacity: P(f, netAt, 8) }}>A REDE LOCAL DA UNION</div> : null}
            {[[soldAt, "CADA SOLDADO · UM NÓ", CYC], [synthAt, "CADA SYNTH · UM NÓ", "#7fe8ff"], [advAt, "OS ADVISORS · OS NÓS MAIS FORTES", VIO]].map(([t0, txt, col]) =>
              f >= (t0 as number) && f < hypAt + 10 ? (
                <div key={txt as string} style={{ fontSize: 20, letterSpacing: 3, color: col as string, marginTop: 10, opacity: P(f, t0 as number, 8) }}>● {txt as string}</div>
              ) : null,
            )}
            {f >= sigAt && f < hypAt + 10 ? <div style={{ fontSize: 20, letterSpacing: 3, color: "#ffd27a", marginTop: 14, opacity: P(f, sigAt, 8) }}>∿ UMA ASSINATURA COMUM</div> : null}
          </div>
          {f >= hypAt ? (
            <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: P(f, hypAt, 10) }}>
              <FlagBadge cx={borX} by={borY - 60} k={0.9} label="MAGNUSSON" col={ICE} f={f} sub="A HIPÓTESE" />
            </svg>
          ) : null}
          {f >= findAt ? (
            <div style={{ position: "absolute", left: 90, top: 330, width: 600, fontFamily: MONO, opacity: P(f, findAt, 8) }}>
              <div style={{ fontSize: 22, letterSpacing: 2, color: TXT }}>A FENDA NÃO PRECISA PROCURAR UM LUGAR</div>
              <div style={{ fontSize: 26, letterSpacing: 2, color: "#ffd27a", marginTop: 8 }}>PODE PROCURAR UMA ASSINATURA</div>
              {f >= notAt ? (
                <div style={{ display: "flex", gap: 18, marginTop: 18, fontSize: 20, letterSpacing: 3, opacity: P(f, notAt, 8) }}>
                  <span style={{ color: "rgba(242,240,247,0.5)", textDecoration: "line-through" }}>UMA BASE</span>
                  <span style={{ color: "rgba(242,240,247,0.5)", textDecoration: "line-through" }}>UMA CIDADE</span>
                  {f >= selfAt ? <span style={{ color: VIO, opacity: P(f, selfAt, 8) }}>OS PRÓPRIOS COMBINE</span> : null}
                </div>
              ) : null}
            </div>
          ) : null}
        </AbsoluteFill>
      ) : null}
      {/* a prova do Kleiner: o quadro com a equação e as verificações */}
      {phB > 0.01 ? (
        <AbsoluteFill style={{ opacity: phB }}>
          <div style={{ position: "absolute", left: 200, top: 150, right: 200, height: 600, background: "#16201c", border: "10px solid #3a2c1c", boxShadow: "0 30px 60px rgba(0,0,0,0.7)", fontFamily: "'Caveat', 'Segoe Print', cursive", color: "rgba(236,236,226,0.9)" }}>
            <div style={{ position: "absolute", left: 60, top: 40, fontSize: 64 }}>{"Σ nós · Ψ(assinatura) → rede única".slice(0, Math.max(0, Math.floor((f - mathAt) * 1.4)))}</div>
            {[[existsAt, "a assinatura existe", "✓", GREEN], [oneAt, "a rede responde como uma estrutura só", "✓", GREEN], [modelAt, "o modelo diz que pode funcionar", "✓", GREEN], [cantAt, "testar", "✗", RED]].map(([t0, txt, mk2, col], i) =>
              f >= (t0 as number) ? (
                <div key={i} style={{ position: "absolute", left: 80, top: 160 + i * 90, fontSize: 52, opacity: P(f, t0 as number, 8) }}>
                  <span style={{ color: col as string, marginRight: 24 }}>{mk2 as string}</span>
                  {txt as string}
                </div>
              ) : null,
            )}
            {f >= needAt ? (
              <div style={{ position: "absolute", right: 60, top: 170, width: 520, padding: 20, border: "3px dashed rgba(236,236,226,0.6)", fontSize: 44, opacity: P(f, needAt, 8) }}>
                precisa de:
                {["o núcleo", "o sistema estabilizado", "o catalisador funcionando"].map((t2, i) => (
                  <div key={t2} style={{ fontSize: 40, marginTop: 6, opacity: P(f, needAt + 12 + i * 10, 8) }}>🔒 {t2}</div>
                ))}
              </div>
            ) : null}
            {f >= possAt ? <div style={{ position: "absolute", right: 70, bottom: 30, fontSize: 52, color: "#ffd27a", opacity: P(f, possAt, 8) }}>= só uma possibilidade</div> : null}
          </div>
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
            <FlagBadge cx={1760} by={1010} k={1.0} label="KLEINER" col={ICE} f={f} sub="A MATEMÁTICA" />
          </svg>
        </AbsoluteFill>
      ) : null}
      {/* as duas formas de terminar a guerra (11/10: refeito em 3D — o Borealis no gelo, as cargas × o feixe até a torre) */}
      {phC > 0.01 ? (
        <AbsoluteFill style={{ opacity: phC }}>
          <TwoWays3D f={f} t0={twoAt - 8} destAt={destAt} useAt={useAt} life={life} />
        </AbsoluteFill>
      ) : null}
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 1:08:46 o destino (o procedimento avança; ela leva eles devagar)
export const HL9SlowRoute: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [probAt, workAt, instrAt, advAt, leadAt, slowAt, backAt, destAt] = ats(p, ["probAt", "workAt", "instrAt", "advAt", "leadAt", "slowAt", "backAt", "destAt"]);
  void probAt;
  const maze = P(f, leadAt - 6, 16);
  const prog = 0.3 + 0.55 * P(f, workAt, Math.max(30, leadAt - workAt));
  const MZ: [number, number][] = [[260, 900], [260, 760], [420, 760], [420, 620], [300, 620], [300, 480], [560, 480], [560, 340], [760, 340], [760, 520], [940, 520], [940, 260], [1180, 260], [1180, 440], [1380, 440], [1380, 300], [1560, 300]];
  const walk = P(f, leadAt, Math.max(30, life - leadAt)) * 0.82;
  const pos = alongP(MZ, walk);
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, #0b1a12 0%, #050c08 70%, #020403 100%)", overflow: "hidden" }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {Array.from({ length: 270 }).map((_, i) => <rect key={i} x={0} y={i * 4} width={1920} height={1.4} fill="rgba(0,0,0,0.25)" />)}
        <g fontFamily="'Courier New', monospace">
          <text x={240} y={150} fill="#7dff9a" fontSize={24} letterSpacing={4}>{maze > 0.5 ? "PARA ONDE ELA ESTÁ LEVANDO ELES" : "O PROCEDIMENTO · CONTINUA"}</text>
          {/* o procedimento: cada vez mais avançado */}
          <g opacity={1 - maze}>
            <rect x={240} y={420} width={1440} height={60} fill="none" stroke="rgba(125,255,154,0.6)" strokeWidth={3} />
            <rect x={246} y={426} width={1428 * prog} height={48} fill="repeating-linear-gradient(90deg, #7dff9a 0 14px, transparent 14px 18px)" style={{ fill: "#7dff9a" }} opacity={0.85} />
            <text x={1680} y={530} textAnchor="end" fill="#7dff9a" fontSize={30}>{Math.round(prog * 100)}%</text>
            {f >= instrAt ? <text x={240} y={560} fill="#ffb066" fontSize={26} letterSpacing={3} opacity={P(f, instrAt, 8)}>INSTRUÇÕES · A. VANCE → ADVISORS</text> : null}
            {f >= advAt ? <text x={240} y={610} fill="#7dff9a" fontSize={26} letterSpacing={3} opacity={P(f, advAt, 8)}>MESMO DEPOIS DAS FALHAS · CADA VEZ MAIS AVANÇADO</text> : null}
            <line x1={1680} y1={400} x2={1680} y2={500} stroke="#ffd27a" strokeWidth={3} strokeDasharray="6 6" />
            <text x={1690} y={395} fill="#ffd27a" fontSize={20}>FIM</text>
          </g>
          {/* o labirinto do navio: o caminho lento até um destino que ninguém sabe */}
          {maze > 0 ? (
            <g opacity={maze}>
              {MZ.slice(1).map((q, i) => {
                const a = MZ[i];
                const nx = a[0] === q[0] ? 60 : 0;
                const ny = a[1] === q[1] ? 60 : 0;
                return (
                  <g key={i} stroke="rgba(125,255,154,0.45)" strokeWidth={2}>
                    <line x1={a[0] - nx} y1={a[1] - ny} x2={q[0] - nx} y2={q[1] - ny} />
                    <line x1={a[0] + nx} y1={a[1] + ny} x2={q[0] + nx} y2={q[1] + ny} />
                  </g>
                );
              })}
              <path d={owD(owPath(MZ, walk))} fill="none" stroke="#ffb066" strokeWidth={4} strokeDasharray="10 8" />
              <circle cx={pos[0]} cy={pos[1]} r={14} fill="#ffb066" />
              <text x={pos[0] + 24} y={pos[1] - 18} fill="#ffb066" fontSize={20} letterSpacing={3}>ALYX + ADVISORS</text>
              {f >= slowAt ? <text x={pos[0] + 24} y={pos[1] + 8} fill="rgba(255,176,102,0.8)" fontSize={16} letterSpacing={3}>DEVAGAR</text> : null}
              <circle cx={1560} cy={300} r={46 + 6 * Math.sin(f / 5)} fill="none" stroke="#ffd27a" strokeWidth={3} strokeDasharray="8 6" />
              <text x={1560} y={316} textAnchor="middle" fill="#ffd27a" fontSize={52} fontWeight={700}>?</text>
              {f >= destAt ? <text x={1560} y={390} textAnchor="middle" fill="#ffd27a" fontSize={20} letterSpacing={4} opacity={P(f, destAt, 8)}>QUAL É O DESTINO</text> : null}
            </g>
          ) : null}
        </g>
      </svg>
      {f >= backAt ? (
        <div style={{ position: "absolute", left: 240, bottom: 140, padding: "14px 22px", background: "rgba(10,8,2,0.82)", border: `1.5px solid ${AMB}`, borderRadius: 10, fontFamily: MONO, color: AMB, opacity: P(f, backAt, 10) }}>
          <div style={{ fontSize: 15, letterSpacing: 5, opacity: 0.8 }}>NOVO OBJETIVO</div>
          <div style={{ fontSize: 28, letterSpacing: 3, marginTop: 6 }}>VOLTAR PARA DENTRO DO BOREALIS</div>
          <div style={{ fontSize: 16, letterSpacing: 3, marginTop: 6, color: CREAM }}>ANTES QUE SEJA TARDE DEMAIS</div>
        </div>
      ) : null}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.75) 100%)", pointerEvents: "none" }} />
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ================================================================================================= MÓDULO 10 · leva A (1:09:12 → 1:11:30)
// ---------------------------------------------------------------- 1:09:12 a invasão (POV no gelo, o casco em raio-x)
export const HL10Invasion: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [planAt, teamsAt, instrAt, stuckAt, invAt, backAt, advAt, alyxAt, gordAt, routeAt] = ats(p, ["planAt", "teamsAt", "instrAt", "stuckAt", "invAt", "backAt", "advAt", "alyxAt", "gordAt", "routeAt"]);
  void planAt;
  const e: Eye = { x: 0, y: keys(f, [[0, 0], [invAt, 6], [routeAt, 8]]), z: 1.6, yaw: keys(f, [[0, 0.0], [routeAt - 6, 0.0], [routeAt + 24, -2.6], [life, -2.6]]), pitch: keys(f, [[0, 0.06], [routeAt, 0.06], [routeAt + 24, -0.08]]), F: 1000 };
  const g = mk();
  iceField(g);
  shipNight(g, 90);
  const xray = P(f, teamsAt, 20) * (1 - P(f, invAt + 30, 20));
  const lights: XL[] = [{ x: 0, y: 85, z: 10, col: [200, 220, 240], k: 0.3, r: 70 }];
  // compartimentos internos (projetados no casco) com as equipes Combine
  const comps = [-50, -30, -10, 10, 30].map((x, i) => ({ x, i }));
  const prog = 0.62;
  const routePts: V3[] = [[0, 2, 0.05], [-6, -20, 0.05], [-14, -60, 0.05], [-20, -120, 0.05]];
  return (
    <AbsoluteFill style={{ background: "#050a10", overflow: "hidden" }}>
      <NightSky e={e} f={f} />
      <XView e={e} faces={g.F} lights={lights} flash={0.2} amb={0.28} seam="rgba(0,0,0,0.15)" />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {/* o raio-x: as salas lá dentro, as equipes trabalhando */}
        {xray > 0
          ? comps.map(({ x, i }) => {
              const c = [proj(e, [x + 1, 89.9, 2]), proj(e, [x + 19, 89.9, 2]), proj(e, [x + 19, 89.9, 12]), proj(e, [x + 1, 89.9, 12])];
              if (c.some((q) => !q)) return null;
              return (
                <g key={i} opacity={xray}>
                  <polygon points={c.map((q) => `${q!.x},${q!.y}`).join(" ")} fill="rgba(95,243,255,0.08)" stroke={CYC} strokeWidth={1.5} strokeDasharray="6 5" />
                  {f >= teamsAt + 10 + i * 3 ? <IcoComb x={(c[0]!.x + c[1]!.x) / 2} y={(c[0]!.y + c[2]!.y) / 2} s={0.8} o={P(f, teamsAt + 10 + i * 3, 8)} /> : null}
                </g>
              );
            })
          : null}
        {f >= teamsAt + 20 && xray > 0 ? <Call e={e} f={f} pt={[-20, 89.9, 9]} from={teamsAt + 20} until={invAt} text="EQUIPES COMBINE · DENTRO DO NAVIO" sub={f >= instrAt ? "EXECUTANDO AS INSTRUÇÕES DELA" : "A PESQUISA CONTINUOU"} col={RED} dx={-260} dy={-170} /> : null}
        {/* a invasão: a resistência avançando até a brecha no casco */}
        {f >= invAt
          ? [[-8, 20], [-3, 26], [3, 22], [9, 28], [-12, 32]].map(([x, y], k) => {
              const t = P(f, invAt + k * 4, 60);
              const a = proj(e, [x, y + t * 50, 0.05]);
              const b = proj(e, [x * 0.4, 88, 0.05]);
              return a && b ? (
                <g key={k} opacity={P(f, invAt + k * 4, 8) * (1 - P(f, routeAt, 10))}>
                  <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={AMB} strokeWidth={2} strokeDasharray="8 8" strokeDashoffset={-f * 2} />
                  <circle cx={a.x} cy={a.y} r={6} fill={AMB} />
                </g>
              ) : null;
            })
          : null}
        {f >= invAt ? <Call e={e} f={f} pt={[0, 89.9, 3]} from={invAt + 10} until={routeAt} text="A BRECHA · A INVASÃO" col={AMB} dx={240} dy={-120} /> : null}
        {/* a Alyx voltando para dentro pelo outro lado */}
        {f >= backAt && f < routeAt ? <FlagAt e={e} pt={[46, 92, 15]} label="ALYX" col={ORANGE} f={f} o={P(f, backAt, 10)} sub="VOLTA PARA DENTRO" /> : null}
        {f >= gordAt && f < routeAt ? <FlagAt e={e} pt={[0, 30 + P(f, gordAt, 60) * 40, 0.4]} label="GORDON" col={AMB} f={f} o={P(f, gordAt, 10)} sub="ENTRA COM A RESISTÊNCIA" /> : null}
        {/* a rota aberta no gelo (vista para trás): Barney, Varga e Eli segurando */}
        {f >= routeAt ? (() => {
          const q = routePts.map((v) => proj(e, v));
          if (q.some((v) => !v)) return null;
          return (
            <g opacity={P(f, routeAt + 16, 12)}>
              <polyline points={q.map((v) => `${v!.x},${v!.y}`).join(" ")} fill="none" stroke={AMB} strokeWidth={5} strokeDasharray="14 10" strokeDashoffset={-f * 3} />
            </g>
          );
        })() : null}
        {f >= routeAt ? (["BARNEY", "VARGA", "ELI"] as const).map((n, k) => <FlagAt key={n} e={e} pt={[[-4, -10, -16][k] + 3, [-18, -50, -90][k], 0.4]} label={n} col={AMB} f={f} o={P(f, routeAt + 20 + k * 6, 10)} sub={k === 0 ? "MANTÊM A ROTA ABERTA" : undefined} />) : null}
      </svg>
      {/* a etapa travada sem ela */}
      {f >= stuckAt && f < invAt + 30 ? (
        <div style={{ position: "absolute", left: 90, top: 120, width: 520, padding: "14px 18px", background: "linear-gradient(160deg, rgba(20,60,84,0.88), rgba(6,22,32,0.92))", clipPath: "polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px)", boxShadow: `inset 0 0 0 1.5px ${CYC}`, fontFamily: MONO, opacity: P(f, stuckAt, 8) * (1 - P(f, invAt + 20, 10)) }}>
          <div style={{ fontSize: 15, letterSpacing: 4, color: CYC }}>PROCEDIMENTO · EQUIPES DO BOREALIS</div>
          <div style={{ marginTop: 10, height: 14, background: "rgba(95,243,255,0.15)" }}>
            <div style={{ height: "100%", width: `${prog * 100}%`, background: CYC }} />
          </div>
          <div style={{ fontSize: 20, letterSpacing: 2, color: RED, marginTop: 10 }}>PRÓXIMA ETAPA · NÃO AVANÇA SEM ELA</div>
        </div>
      ) : null}
      {/* duas leituras da volta dela */}
      {f >= advAt && f < gordAt + 20
        ? [
            [advAt, "PARA OS ADVISORS", "a única capaz de conduzir as próximas etapas", VIO, 0],
            [alyxAt, "PARA A ALYX", "a oportunidade que ela estava esperando", ORANGE, 1],
          ].map(([t0, h, b, col, i]) =>
            f >= (t0 as number) ? (
              <div key={h as string} style={{ position: "absolute", left: (i as number) === 0 ? 120 : 1080, top: 640, width: 720, padding: "18px 22px", borderRadius: 12, background: "rgba(10,8,12,0.88)", border: `2px solid ${col as string}`, fontFamily: MONO, opacity: P(f, t0 as number, 8) * (1 - P(f, gordAt + 10, 10)) }}>
                <div style={{ fontSize: 16, letterSpacing: 5, color: col as string }}>{h as string}</div>
                <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 36, color: TXT, marginTop: 8 }}>{b as string}</div>
              </div>
            ) : null,
          )
        : null}
      {f >= advAt && f < gordAt + 20 ? (
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: P(f, advAt, 10) * (1 - P(f, gordAt + 10, 10)) }}>
          <AdvisorArt x={720} y={560} w={190} f={f} lit={0.7} id="inv" flip />
        </svg>
      ) : null}
      <Hud f={f} yaw={e.yaw} eye={e} blips={[]} msg={f < teamsAt ? "O PLANO MUDA · DESSA VEZ ELES VÃO ENTRAR" : f >= routeAt + 10 ? "A ROTA PELO GELO" : undefined} msgCol={AMB} />
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 1:09:55 a sala que troca de época
// 11/10 (pedido dele: genérica, coisas piscando, perspectiva estranha): a MESMA sala nas duas épocas, bem mais detalhada,
// e a troca deixa de piscar — uma onda de luz nasce na porta do fundo e se espalha pela sala; por onde ela passa, a época
// muda (o resto continua na outra). Combine com crachá.
const ERA_W = 5;
const ERA_L = 13;
const buildEraRoom = (aperture: boolean): XF[] => {
  const g = mk();
  if (aperture) {
    // Aperture 1979: lambri de madeira embaixo, parede bege, forro de placas com luminárias, carpete
    g.room(-ERA_W, ERA_W, 0, ERA_L, 3.2, [196, 188, 166], [104, 86, 64], [214, 210, 198], [{ side: "N", c: 0, w: 2.0, h: 2.4 }], 1.0);
    for (let y = 0; y < ERA_L; y += 1.0) {
      g.box(-ERA_W, y, 0, 0.06, 1.0, 1.1, [120, 84, 50]);
      g.box(ERA_W - 0.06, y, 0, 0.06, 1.0, 1.1, [120, 84, 50]);
    }
    g.box(-ERA_W, 0, 1.1, 0.08, ERA_L, 0.06, [80, 56, 34]);
    g.box(ERA_W - 0.08, 0, 1.1, 0.08, ERA_L, 0.06, [80, 56, 34]);
    for (let y = 1.5; y < ERA_L; y += 3) for (const x of [-2.4, 0.6]) g.box(x, y, 3.17, 1.8, 0.6, 0.02, [255, 250, 232], { emit: 0.9 });
    // mesas com terminais de fósforo verde, cadeiras, arquivos de aço, os computadores de fita, o quadro-negro, a planta
    [[-3.2, 4.5], [0.4, 4.5], [-3.2, 8.0], [0.4, 8.0]].forEach(([x, y], k) => {
      g.box(x, y, 0, 1.8, 0.9, 0.74, [150, 116, 78]);
      g.box(x + 0.05, y + 0.05, 0.74, 1.7, 0.8, 0.04, [170, 134, 92]);
      g.box(x + 0.6, y + 0.35, 0.78, 0.6, 0.5, 0.45, [206, 200, 182]);
      g.quad([x + 0.66, y + 0.34, 0.86], [x + 1.14, y + 0.34, 0.86], [x + 1.14, y + 0.34, 1.16], [x + 0.66, y + 0.34, 1.16], [110, 255, 140], [0, -1, 0], { emit: 0.55 });
      g.box(x + 0.5, y + 0.12, 0.78, 0.7, 0.2, 0.04, [220, 214, 196]);
      g.box(x + 0.6, y - 0.6, 0, 0.5, 0.5, 0.45, [60, 70, 96]);
      g.box(x + 0.6, y - 0.6, 0.45, 0.5, 0.08, 0.5, [60, 70, 96]);
      void k;
    });
    for (let i = 0; i < 3; i++) g.box(ERA_W - 0.62, 2 + i * 0.62, 0, 0.56, 0.58, 1.35, [150, 154, 150]);
    for (let i = 0; i < 4; i++) {
      const y = 6.4 + i * 1.3;
      g.box(-ERA_W + 0.06, y, 0, 0.7, 1.1, 2.1, [176, 172, 160]);
      g.quad([-ERA_W + 0.77, y + 0.12, 1.3], [-ERA_W + 0.77, y + 0.98, 1.3], [-ERA_W + 0.77, y + 0.98, 1.85], [-ERA_W + 0.77, y + 0.12, 1.85], [60, 58, 54], [1, 0, 0]);
      g.quad([-ERA_W + 0.77, y + 0.2, 0.4], [-ERA_W + 0.77, y + 0.9, 0.4], [-ERA_W + 0.77, y + 0.9, 0.9], [-ERA_W + 0.77, y + 0.2, 0.9], [210, 120, 60], [1, 0, 0], { emit: 0.25 });
    }
    g.box(ERA_W - 0.05, 6.6, 1.0, 0.04, 2.6, 1.3, [36, 52, 40]);
    g.box(ERA_W - 0.08, 6.5, 0.95, 0.06, 2.8, 0.06, [120, 84, 50]);
    g.prism(3.9, 11.6, 0, 0.5, 0.28, 10, [150, 90, 60]);
    g.prism(3.9, 11.6, 0.5, 1.3, 0.45, 8, [60, 120, 60]);
  } else {
    // agora (Combine): a mesma sala tomada — revestimento escuro, barricadas, caixotes, luz de emergência, campo de força
    g.room(-ERA_W, ERA_W, 0, ERA_L, 3.2, [40, 44, 50], [30, 30, 32], [22, 22, 24], [{ side: "N", c: 0, w: 2.0, h: 2.4 }], 1.0);
    for (let y = 0.5; y < ERA_L; y += 2.2)
      [-1, 1].forEach((s) => {
        g.box(s > 0 ? ERA_W - 0.3 : -ERA_W, y, 0, 0.3, 0.4, 3.2, [26, 30, 36]);
        g.box(s > 0 ? ERA_W - 0.32 : -ERA_W + 0.3, y + 0.05, 2.4, 0.03, 0.3, 0.1, [255, 60, 40], { emit: 0.6 });
      });
    g.box(-3.5, 6, 0, 2.6, 0.4, 1.2, [40, 44, 50]);
    g.box(-3.3, 5.98, 0.95, 2.2, 0.03, 0.05, [80, 220, 230], { emit: 0.6 });
    g.box(1.2, 7.6, 0, 2.6, 0.4, 1.2, [40, 44, 50]);
    g.box(1.4, 7.58, 0.95, 2.2, 0.03, 0.05, [80, 220, 230], { emit: 0.6 });
    // 13/10: contêineres Combine (não caixote bege) e as luminárias de verdade: faixa branca fria + a luz vermelha de alarme
    [[-1, 4.2, 1], [2.6, 3.2, 1.1], [-4.2, 10.4, 0.9], [3.6, 10.8, 1.0]].forEach(([x, y, s]) => combineCrate(g, x + s / 2, y + s / 2, 0, s));
    for (let y = 2; y < ERA_L; y += 3) {
      g.box(-0.45, y, 3.1, 0.9, 0.35, 0.1, [40, 44, 50]);
      g.box(-0.4, y + 0.04, 3.09, 0.8, 0.27, 0.01, [220, 236, 255], { emit: 0.75 });
      g.box(0.5, y + 0.1, 3.08, 0.14, 0.14, 0.12, [255, 50, 40], { emit: 0.85 });
    }
    g.box(-1.0, ERA_L - 0.02, 0, 2.0, 0.04, 2.4, [90, 220, 240], { emit: 0.35 });
  }
  // a verga em cima da porta do fundo (o vão da sala subia até o teto e cortava a placa)
  g.quad([1.0, ERA_L - 0.01, 2.4], [-1.0, ERA_L - 0.01, 2.4], [-1.0, ERA_L - 0.01, 3.2], [1.0, ERA_L - 0.01, 3.2], aperture ? [200, 192, 172] : [40, 44, 50], [0, -1, 0]);
  return g.F;
};
export const HL10EraFlip: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [worseAt, jumpsAt, corrAt, troopAt, apAt] = ats(p, ["worseAt", "jumpsAt", "corrAt", "troopAt", "apAt"]);
  void worseAt;
  const A = useMemo(() => buildEraRoom(true), []);
  const B = useMemo(() => buildEraRoom(false), []);
  const e: Eye = { x: 0.05 * Math.sin(f / 40), y: keys(f, [[0, 0.6], [life, 2.2]]), z: 1.65, yaw: keys(f, [[0, 0.04], [troopAt, -0.04], [life, 0.02]]) + (f >= corrAt && f < apAt ? Math.sin(f * 2.2) * 0.004 : 0), pitch: 0, F: 960 };
  // 11/10 (pedido dele: o círculo abrindo e fechando ficou ruim): uma VARREDURA de lado, como o wireframe do começo do
  // vídeo — uma lâmina que atravessa a sala; do lado de lá dela a sala está na outra época. Saltos curtos (só um trecho da
  // sala), o corredor inteiro no meio do combate, e no fim a sala volta inteira para 1979.
  const sweep = (t0: number, d: number, depth: number) => (f >= t0 && f < t0 + d ? Math.sin(((f - t0) / d) * Math.PI) * depth : 0);
  // fração da sala (a partir da porta do fundo) que está em 1979
  const frac = Math.max(sweep(jumpsAt, 34, 0.25), sweep(jumpsAt + 40, 30, 0.18), sweep(corrAt, 80, 1.0), P(f, apAt, 40) * 1.02);
  const front = ERA_L * (1 - frac); // y da lâmina
  const aperture = frac > 1.0;
  const lights: (ap: boolean) => XL[] = (ap) => (ap ? [{ x: 0, y: 6, z: 3, col: [255, 244, 220], k: 0.8, r: 14 }] : [{ x: 0, y: 6, z: 3, col: [255, 70, 50], k: 0.5 + 0.12 * Math.sin(f / 10), r: 12 }, { x: 0, y: 3.5, z: 3, col: [210, 225, 245], k: 0.55, r: 8 }, { x: 0, y: 9.5, z: 3, col: [210, 225, 245], k: 0.45, r: 8 }, { x: 0, y: 12, z: 1.5, col: [90, 220, 240], k: 0.4, r: 6 }]);
  const cyOf = (fc: XF) => fc.p.reduce((s, q) => s + q[1], 0) / fc.p.length;
  const facesNow: XF[] = [
    ...B.filter((fc) => cyOf(fc) <= front),
    ...A.filter((fc) => cyOf(fc) > front),
    // a lâmina: contorno aceso da seção da sala onde está a frente
    ...(frac > 0.01 && frac < 1
      ? ([[-ERA_W, 0], [ERA_W, 0], [ERA_W, 3.2], [-ERA_W, 3.2]] as [number, number][]).map((q, i, arr) => {
          const r = arr[(i + 1) % arr.length];
          return { p: [[q[0], front, q[1]], [r[0], front, r[1]], [r[0], front + 0.02, r[1]], [q[0], front + 0.02, q[1]]] as V3[], col: [200, 240, 255] as RGB, n: [0, -1, 0] as V3, nofill: true, edge: [210, 245, 255] as RGB };
        })
      : []),
  ];
  const lightsNow = frac > 0.5 ? lights(true) : lights(false);
  const troops = f >= troopAt;
  const door = proj(e, [0, ERA_L, 1.2]) ?? { x: 960, y: 520, d: 10 };
  void door;
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <XView e={e} faces={facesNow} lights={lightsNow} flash={0.6} amb={frac > 0.5 ? 0.42 : 0.2} />
      {frac > 0.15 ? (() => {
        const q = proj(e, [0, ERA_L - 0.02, 2.75]);
        return q ? <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}><text x={q.x} y={q.y} textAnchor="middle" fill="#2a2a2a" fontFamily={FONT} fontWeight={800} fontSize={Math.max(10, 320 / q.d)} letterSpacing={3}>APERTURE SCIENCE</text></svg> : null;
      })() : null}
      {/* o brilho da lâmina (fino, sem desfoque pesado) */}
      {frac > 0.01 && frac < 1 ? (() => {
        const a = proj(e, [-ERA_W, front, 0]), b = proj(e, [ERA_W, front, 0]), c2 = proj(e, [ERA_W, front, 3.2]), d = proj(e, [-ERA_W, front, 3.2]);
        return a && b && c2 && d ? <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}><polygon points={`${a.x},${a.y} ${b.x},${b.y} ${c2.x},${c2.y} ${d.x},${d.y}`} fill="rgba(200,240,255,0.08)" stroke="rgba(220,250,255,0.9)" strokeWidth={3} /></svg> : null;
      })() : null}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {/* a tropa Combine tomando a sala (crachá com foto); some quando a onda passa por ela */}
        {troops
          ? ([[-2.4, 6.8, "OTA · 21"], [2.4, 8.4, "OTA · 22"], [-0.6, 10.2, "OTA · 23"]] as [number, number, string][]).map(([x, y, sub], k) => {
              const gone = y > front ? 0 : 1;
              return <Pin key={k} e={e} x={x} y={y} col={RED} f={f} who="combine" text="COMBINE" sub={sub} o={P(f, troopAt + k * 4, 8) * gone} h={1.8 + (k % 2) * 0.4} />;
            })
          : null}
        {/* 13/10 (pedido dele: os tiros zoados): rajadas de pulso Combine (ciano), cada soldado no seu ritmo — clarão no cano,
            o traçante curto voando até a cobertura, faíscas onde bate */}
        {troops && frac < 0.05
          ? ([[-2.4, 6.8], [2.4, 8.4], [-0.6, 10.2]] as [number, number][]).flatMap(([x, y], k) => {
              const ph = (f + k * 9) % 22;
              if (ph > 7 || f < troopAt + 10 + k * 6) return [];
              const a = proj(e, [x + 0.25, y - 0.3, 1.35]);
              const hit: V3 = [-1.2 + k * 1.3, 4.0 + (k % 2) * 0.6, 1.0 + 0.25 * rnd(Math.floor((f + k * 9) / 22) * 7 + k)];
              const b = proj(e, hit);
              if (!a || !b) return [];
              const t = ph / 7;
              const x0 = a.x + (b.x - a.x) * t, y0 = a.y + (b.y - a.y) * t, x1 = a.x + (b.x - a.x) * Math.min(1, t + 0.28), y1 = a.y + (b.y - a.y) * Math.min(1, t + 0.28);
              const out: React.ReactNode[] = [<line key={"tr" + k} x1={x0} y1={y0} x2={x1} y2={y1} stroke="#e6fbff" strokeWidth={4} strokeLinecap="round" style={{ filter: "drop-shadow(0 0 7px #5fe6ff)" }} />];
              if (ph < 2) out.push(<circle key={"mz" + k} cx={a.x} cy={a.y} r={14} fill="rgba(170,240,255,0.95)" style={{ filter: "blur(3px)" }} />);
              if (ph >= 5) Array.from({ length: 6 }).forEach((_, i) => { const an = rnd(i + k * 13 + f) * Math.PI * 2; out.push(<line key={`sp${k}${i}`} x1={b.x} y1={b.y} x2={b.x + Math.cos(an) * 22} y2={b.y + Math.sin(an) * 22 - 8} stroke="#bff6ff" strokeWidth={2} />); });
              return out;
            })
          : null}
      </svg>
      <div style={{ position: "absolute", right: 100, top: 120, padding: "10px 16px", borderRadius: 8, background: "rgba(8,8,10,0.8)", border: `1.5px solid ${aperture ? "#7dff9a" : RED}`, fontFamily: MONO, fontSize: 22, letterSpacing: 4, color: aperture ? "#7dff9a" : RED }}>
        {aperture ? "1979 · APERTURE" : frac > 0.01 ? "AS DUAS ÉPOCAS · AO MESMO TEMPO" : "AGORA · COMBINE"}
      </div>
      <Hud f={f} yaw={e.yaw} eye={e} blips={troops && !aperture ? [{ x: -2.4, y: 6.8, hot: true }, { x: 2.4, y: 8.4, hot: true }] : []} msg={f < jumpsAt ? "POR DENTRO · PIOR QUE ANTES" : aperture ? "A MESMA SALA · OUTRA ÉPOCA" : f >= corrAt && f < troopAt ? "O CORREDOR MUDA DE ÉPOCA NO MEIO DO COMBATE" : f >= jumpsAt && f < corrAt ? "OS SALTOS · CADA VEZ MAIS FREQUENTES" : undefined} msgCol={aperture ? "#7dff9a" : RED} />
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};


// telas Combine de verdade sobre os consoles (inclinadas, com moldura): cantos sup-esq, sup-dir, inf-dir, inf-esq
// 12/10 (pedido dele: tela em cima de tela, fora de perspectiva; o visor vermelho feio): as telas são desenhadas por cima
// do 3D, então vão da mais longe para a mais perto e a que está atrás de outro console (pontos dela escondidos pela
// geometria) não é desenhada; no alerta a tela continua azul Combine e ganha a faixa e a moldura vermelhas piscando
export const ConsoleScreens: React.FC<{ e: Eye; f: number; quads: [V3, V3, V3, V3][]; alert?: boolean }> = ({ e, f, quads, alert }) => {
  const dist = (q: [V3, V3, V3, V3]) => Math.hypot((q[0][0] + q[2][0]) / 2 - e.x, (q[0][1] + q[2][1]) / 2 - e.y);
  const order = quads.map((q, i) => ({ q, i, d: dist(q) })).sort((x, y) => y.d - x.d);
  const hidden = (q: [V3, V3, V3, V3]) => {
    const c: V3 = [(q[0][0] + q[2][0]) / 2, (q[0][1] + q[2][1]) / 2, (q[0][2] + q[2][2]) / 2 + 0.04];
    const pts: V3[] = [c, ...q.map((v) => [v[0] + (c[0] - v[0]) * 0.15, v[1] + (c[1] - v[1]) * 0.15, v[2] + 0.04] as V3)];
    return pts.filter((pt) => occluded(e, pt, 0.12)).length >= 2;
  };
  const blink = alert && Math.floor(f / 12) % 2 === 0;
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {order.map(({ q, i }) =>
        hidden(q) ? null : (
          <Pinned key={i} e={e} w={400} h={300} corners={q}>
            <div style={{ width: 400, height: 300, position: "relative" }}>
              <CombineScreen f={f + i * 29} big={i === 0} />
              {alert ? <div style={{ position: "absolute", left: 10, right: 10, top: 10, height: 22, background: blink ? "rgba(255,70,50,0.85)" : "rgba(255,70,50,0.35)", fontFamily: MONO, fontSize: 13, letterSpacing: 4, color: "#fff", textAlign: "center", lineHeight: "22px" }}>ALERTA · INVASÃO</div> : null}
              <div style={{ position: "absolute", inset: 0, boxShadow: `inset 0 0 0 10px #1a1e22, inset 0 0 0 12px ${alert ? (blink ? "rgba(255,70,50,0.9)" : "rgba(255,70,50,0.4)") : "rgba(0,0,0,0)"}, inset 0 0 30px rgba(0,0,0,0.6)` }} />
            </div>
          </Pinned>
        ),
      )}
    </div>
  );
};
// holograma de arame girando (icosaedro + anéis), projetado no 3D, em cima da mesa holográfica
const ICO: V3[] = (() => {
  const t = (1 + Math.sqrt(5)) / 2;
  return ([[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]] as V3[]).map((v) => {
    const L = Math.hypot(v[0], v[1], v[2]);
    return [v[0] / L, v[1] / L, v[2] / L] as V3;
  });
})();
const ICO_E: [number, number][] = (() => {
  const out: [number, number][] = [];
  for (let i = 0; i < 12; i++)
    for (let j = i + 1; j < 12; j++) {
      const d = Math.hypot(ICO[i][0] - ICO[j][0], ICO[i][1] - ICO[j][1], ICO[i][2] - ICO[j][2]);
      if (d < 1.1) out.push([i, j]);
    }
  return out;
})();
export const HoloCore: React.FC<{ e: Eye; f: number; c: V3; r: number; col: string }> = ({ e, f, c, r, col }) => {
  // de perto demais (a câmera passando ao lado da mesa) o arame tomaria a tela: some
  const near = Math.hypot(e.x - c[0], e.y - c[1]);
  if (near < 3.2) return null;
  const a = f / 45;
  const rot = (v: V3): V3 => [c[0] + r * (v[0] * Math.cos(a) - v[1] * Math.sin(a)), c[1] + r * (v[0] * Math.sin(a) + v[1] * Math.cos(a)), c[2] + r * v[2]];
  const P2 = ICO.map((v) => proj(e, rot(v)));
  const ring = (k: number, tilt: number) =>
    Array.from({ length: 33 }).map((_, i) => {
      const t = (i / 32) * Math.PI * 2 + f / (30 + k * 7);
      const rr = r * (1.35 + k * 0.18);
      return proj(e, [c[0] + Math.cos(t) * rr, c[1] + Math.sin(t) * rr * Math.cos(tilt), c[2] + Math.sin(t) * rr * Math.sin(tilt)]);
    });
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none", mixBlendMode: "screen" }}>
      {ICO_E.map(([i, j], k) => (P2[i] && P2[j] ? <line key={k} x1={P2[i]!.x} y1={P2[i]!.y} x2={P2[j]!.x} y2={P2[j]!.y} stroke={col} strokeWidth={1.6} opacity={0.8} /> : null))}
      {[0, 1, 2].map((k) => {
        const q = ring(k, 0.4 + k * 0.5);
        return q.every((v) => v) ? <polyline key={k} points={q.map((v) => `${v!.x},${v!.y}`).join(" ")} fill="none" stroke={col} strokeWidth={1.2} opacity={0.55} /> : null;
      })}
    </svg>
  );
};
// ---------------------------------------------------------------- 1:10:11 / 1:10:42 a sala de controle pelo vidro
// contêiner de metal Combine: corpo grafite, quinas reforçadas, faixa ciano acesa e a tampa mais escura
const combineCrate = (g: ReturnType<typeof mk>, x: number, y: number, z: number, s: number) => {
  const h = s * 0.85;
  g.box(x - s / 2, y - s / 2, z, s, s, h, [56, 62, 70]);
  g.box(x - s / 2 - 0.02, y - s / 2 - 0.02, z + h - 0.06, s + 0.04, s + 0.04, 0.08, [34, 38, 44]);
  g.box(x - s / 2 - 0.02, y - s / 2 - 0.02, z, s + 0.04, s + 0.04, 0.07, [34, 38, 44]);
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy]) => g.box(x + sx * (s / 2) - 0.05 - (sx > 0 ? 0 : -0.0), y + sy * (s / 2) - 0.05, z, 0.1, 0.1, h, [30, 34, 40]));
  g.box(x - s / 2 - 0.01, y - s / 2 - 0.012, z + h * 0.55, s + 0.02, 0.02, 0.05, [90, 220, 235], { emit: 0.7 });
  g.box(x - s / 2 - 0.012, y - s / 2 - 0.01, z + h * 0.55, 0.02, s + 0.02, 0.05, [90, 220, 235], { emit: 0.7 });
};
export const buildGlassRoom = (): XF[] => {
  // 11/10 (pedidos dele): sem o pilar (o montante da janela ficava bem na frente da câmera e a coluna do procedimento
  // atrás); o Gordon escondido atrás de uma PAREDE de verdade (à esquerda, em primeiro plano); a janela do fundo é uma
  // janela inteira para a sala dos motores (antes era um retângulo de luz "deslocado" atrás da Alyx); sala mais detalhada.
  const g = mk();
  // galeria (y 0…4) + sala de controle (y 4…16); vão no fundo para a sala dos motores
  g.room(-6, 6, 0, 16, 3.6, [34, 38, 44], [26, 28, 32], [20, 22, 26], [{ side: "N", c: 0, w: 12, h: 3.2 }]);
  // a parede da janela (y = 3,95): peitoril com o vão da porta da esquerda (x −5,6…−4,4), travessa em cima
  g.box(-6, 3.95, 0, 0.4, 0.1, 0.9, [30, 32, 36]);
  g.box(-4.4, 3.95, 0, 10.4, 0.1, 0.9, [30, 32, 36]);
  g.box(-6, 3.95, 3.2, 12, 0.1, 0.4, [30, 32, 36]);
  [2.4, 4.8].forEach((x) => g.box(x - 0.07, 3.95, 0.9, 0.14, 0.1, 2.3, [30, 32, 36]));
  // a parede que esconde o Gordon (do vão da porta até perto do meio), com faixa de aviso e cabos
  g.box(-4.4, 3.0, 0, 3.5, 0.95, 3.6, [44, 48, 54]);
  g.box(-0.95, 3.0, 0, 0.08, 0.95, 3.6, [60, 64, 70]);
  g.box(-0.93, 2.98, 1.1, 0.06, 0.06, 0.16, [220, 170, 40], { emit: 0.25 });
  for (let i = 0; i < 3; i++) g.box(-1.2 - i * 0.12, 2.96, 0, 0.05, 0.05, 3.6, [24, 26, 28]);
  // consoles Combine (os quatro) com o painel de trás e a régua de luz
  [[-3.6, 8], [3.6, 8], [-2, 11], [2, 11]].forEach(([x, y]) => {
    g.box(x - 0.8, y - 0.4, 0, 1.6, 0.8, 1.0, [40, 46, 52]);
    g.quad([x - 0.75, y - 0.35, 1.0], [x + 0.75, y - 0.35, 1.0], [x + 0.75, y + 0.2, 1.55], [x - 0.75, y + 0.2, 1.55], [22, 26, 30], [0, -0.7, 0.7]);
    // 12/10 (pedido dele: a tela sem grossura): a mesa inclinada fechada dos lados (cunha maciça até o painel de trás),
    // a borda de baixo levantada e a moldura em volta da tela
    [-1, 1].forEach((s) => g.quad([x + s * 0.75, y - 0.35, 1.0], [x + s * 0.75, y + 0.25, 1.0], [x + s * 0.75, y + 0.25, 1.6], [x + s * 0.75, y + 0.2, 1.6], [34, 38, 44], [s, 0, 0]));
    g.quad([x - 0.75, y + 0.2, 1.55], [x + 0.75, y + 0.2, 1.55], [x + 0.75, y + 0.25, 1.6], [x - 0.75, y + 0.25, 1.6], [34, 38, 44], [0, 0, 1]);
    g.box(x - 0.8, y - 0.42, 0.97, 1.6, 0.1, 0.09, [30, 34, 40]);
    [-1, 1].forEach((s) => g.box(x + s * 0.71 - 0.04, y - 0.34, 1.0, 0.08, 0.52, 0.08, [26, 30, 34]));
    g.box(x - 0.85, y + 0.25, 1.0, 1.7, 0.12, 0.7, [30, 34, 40]);
    g.box(x - 0.7, y - 0.42, 0.98, 1.4, 0.04, 0.03, [90, 220, 240], { emit: 0.6 });
  });
  // a mesa holográfica baixa no centro (sem pilar): tablado octogonal com a borda acesa
  g.prism(0, 10, 0, 0.8, 1.5, 8, [36, 42, 48], undefined, Math.PI / 8);
  g.prism(0, 10, 0.8, 0.84, 1.42, 8, [70, 220, 240], { emit: 0.55, tag: "ring" }, Math.PI / 8);
  // nervuras e faixas de luz nas paredes laterais; vigas e tubos no teto
  for (let y = 5; y < 16; y += 2.5)
    [-1, 1].forEach((s) => {
      g.box(s > 0 ? 5.7 : -6, y, 0, 0.3, 0.35, 3.6, [24, 28, 32]);
      g.box(s > 0 ? 5.68 : -5.72, y + 0.6, 2.2, 0.04, 0.8, 0.1, [80, 220, 230], { emit: 0.5 });
    });
  for (let y = 5; y < 16; y += 2.5) g.box(-6, y, 3.38, 12, 0.25, 0.22, [24, 26, 30]);
  [-3.5, 3.5].forEach((x) => g.box(x - 0.08, 4, 3.15, 0.16, 12, 0.16, [44, 48, 54]));
  // caixotes (inteiros, com cinta) e uma barreira Combine
  // 12/10 (pedido dele: caixotes bege de madeira sem sentido numa sala Combine): contêineres de metal Combine
  [[4.6, 12.6, 0.9], [5.0, 6.0, 0.8]].forEach(([x, y, s]) => combineCrate(g, x, y, 0, s));
  g.box(-1.0, 13.6, 0, 2.0, 0.25, 1.1, [34, 40, 48]);
  g.box(-0.7, 13.58, 0.9, 1.4, 0.03, 0.05, [80, 220, 230], { emit: 0.6 });
  // o fundo (y = 15,9): peitoril com o vão da porta (x −5,4…−4,2), travessa e montantes — a janela da sala dos motores
  g.box(-6, 15.9, 0, 0.6, 0.12, 0.8, [30, 32, 36]);
  g.box(-4.2, 15.9, 0, 10.2, 0.12, 0.8, [30, 32, 36]);
  g.box(-6, 15.9, 3.2, 12, 0.12, 0.4, [30, 32, 36]);
  [-4.2, -1.4, 1.4, 4.2].forEach((x) => g.box(x - 0.08, 15.9, 0.8, 0.16, 0.12, 2.4, [30, 32, 36]));
  // a sala dos motores (y 16…25): dois motores verticais com anéis acesos, passarela da porta até o fundo
  g.room(-6, 6, 16, 25, 4.2, [26, 30, 34], [22, 24, 26], [14, 16, 18], [{ side: "S", c: 0, w: 12, h: 4.2 }]);
  [[-2.4, 21], [2.8, 21]].forEach(([x, y]) => {
    g.prism(x, y, 0, 4.2, 1.5, 16, [56, 62, 70]);
    [0.8, 1.9, 3.0].forEach((z) => g.prism(x, y, z, z + 0.18, 1.56, 16, [150, 240, 255], { emit: 0.75 }));
  });
  g.box(-5.3, 16, 0.01, 1.2, 8.5, 0.05, [44, 48, 52]);
  for (let y = 16.6; y < 24.5; y += 1.2) g.box(-4.08, y, 0, 0.05, 0.05, 1.0, [60, 64, 70]);
  g.box(-4.1, 16, 0.98, 0.06, 8.6, 0.05, [60, 64, 70]);
  return g.F;
};
export const HL10Glass: React.FC<PR & { mode?: number; frozen?: number }> = (p) => {
  const f0 = useCurrentFrame();
  const f = p.frozen !== undefined ? Math.round(p.frozen * 30) + (f0 % 1) : f0;
  const life = p.life;
  const mode = p.mode ?? 0;
  const [patAt, advAt, calcAt, execAt, failAt, closeAt, ctrlAt, editAt, sendAt, recvAt, fail2At, purpAt] = ats(p, ["patAt", "advAt", "calcAt", "execAt", "failAt", "closeAt", "ctrlAt", "editAt", "sendAt", "recvAt", "fail2At", "purpAt"]);
  const [seeAt, snapAt, turnAt, stableAt, enoughAt, noFakeAt, glassAt, gmanAt, liftAt, aimAt, radioAt] = ats(p, ["seeAt", "snapAt", "turnAt", "stableAt", "enoughAt", "noFakeAt", "glassAt", "gmanAt", "liftAt", "aimAt", "radioAt"]);
  void patAt;
  void seeAt;
  void stableAt;
  const G = useMemo(() => buildGlassRoom(), []);
  const near = mode ? 1 : P(f, closeAt, 40);
  // 12/10 (pedido dele: um terço da tela preto): a câmera ao centro da janela (antes ficava atrás da parede maciça)
  const e: Eye = { x: 1.1 + 0.04 * Math.sin(f0 / 60), y: 1.2 + 1.6 * near, z: 1.65, yaw: mode ? keys(f, [[0, 0.0], [glassAt, 0.0], [glassAt + 20, 0.06], [liftAt, 0.0]]) : keys(f, [[0, 0.04], [ctrlAt, 0.0], [life, -0.02]]), pitch: mode ? keys(f, [[0, 0.02], [liftAt, 0.02], [liftAt + 20, 0.12]]) : 0.02, F: 1000 };
  const failing = (!mode && ((f >= failAt && f < failAt + 20) || (f >= fail2At && f < fail2At + 24))) || (mode && f >= snapAt && f < snapAt + 8);
  const isFar = (fc: XF) => fc.p.every((q) => q[1] >= 15.85);
  // a moldura do vidro (peitoril, travessa e montantes) fica NA FRENTE do Advisor e das telas: camada própria por cima
  const isFrame = (fc: XF) => fc.p.every((q) => q[1] >= 3.9 && q[1] <= 4.1);
  const live = G.map((fc) => (fc.tag === "ring" ? { ...fc, col: (failing ? [255, 60, 40] : [70, 220, 240]) as RGB, emit: 0.45 + 0.2 * Math.sin(f0 / 6) } : fc));
  const lights: XL[] = [{ x: 0, y: 10, z: 2.6, col: failing ? [255, 60, 40] : [90, 220, 240], k: 0.7, r: 9 }, { x: 0, y: 2, z: 3, col: [120, 130, 150], k: 0.15, r: 6 }, { x: 0, y: 19, z: 2.4, col: [170, 240, 255], k: 0.9, r: 9 }];
  const lift = mode ? P(f, liftAt, 30) : 0;
  const alyxPt: [number, number] = [2, 7.4];
  const advP = proj(e, [-1.2, 9.2, 2.3 + 0.08 * Math.sin(f0 / 20)]);
  const turn = mode ? IOx((f - turnAt) / 50) : 0;
  const link = (!mode && f >= recvAt && f < recvAt + 24) || (!mode && f >= calcAt && f < execAt) || (mode && f < snapAt);
  const alyxTop = proj(e, [alyxPt[0], alyxPt[1], 1.75 + lift * 1.2]);
  const seq = ["Ω7", "Δ3", "Ψ1", "Λ9"];
  const edited = !mode && f >= editAt + 10;
  // 11/10: Advisor 3D — olha a Alyx; quando percebe (modo 1) vira para o vidro, e ergue a Alyx com a garra
  const AS = useAdvScene([{ pos: [-1.2, 9.2, 2.3], look: turn > 0.5 ? [e.x, e.y, 1.8] : [2, 7.4, 1.6], reach: mode ? 0.2 + 0.7 * lift : 0.15 }], f0, 2.2);
  return (
    <AbsoluteFill style={{ background: "#020304", overflow: "hidden" }}>
      <XView e={e} faces={live.filter(isFar)} lights={lights} flash={0.4} amb={0.12} />
      {/* a sombra do G-Man depois do vidro do fundo, na sala dos motores */}
      {mode && f >= gmanAt ? (() => {
        const b = proj(e, [0.25, 18.2, 0]);
        const t = proj(e, [0.25, 18.2, 1.9]);
        const w4 = [proj(e, [-1.4, 15.89, 3.2]), proj(e, [1.4, 15.89, 3.2]), proj(e, [1.4, 15.89, 0.8]), proj(e, [-1.4, 15.89, 0.8])];
        if (!b || !t || w4.some((q) => !q)) return null;
        const h = (b.y - t.y) * 1.12;
        const clip = `polygon(${w4.map((q) => `${q!.x.toFixed(0)}px ${q!.y.toFixed(0)}px`).join(", ")})`;
        return (
          <div style={{ position: "absolute", inset: 0, clipPath: clip }}>
          <div style={{ position: "absolute", left: b.x - h * 0.19, top: t.y - h * 0.04, width: h * 0.37, height: h, opacity: P(f, gmanAt, 14) * (1 - P(f, liftAt + 10, 12)), filter: "drop-shadow(0 0 3px rgba(220,240,255,0.7)) drop-shadow(0 0 10px rgba(190,230,240,0.45))" }}>
            <div style={{ position: "absolute", inset: 0, WebkitMaskImage: `url(${staticFile("hl3silh/gman_silh.png")})`, maskImage: `url(${staticFile("hl3silh/gman_silh.png")})`, WebkitMaskSize: "100% 100%", maskSize: "100% 100%", background: "linear-gradient(180deg, #1a1e22, #07090b 80%)" }} />
          </div>
          </div>
        );
      })() : null}
      <XView e={e} faces={live.filter((fc) => !isFar(fc) && !isFrame(fc))} lights={lights} flash={0.4} amb={0.12} solid extras={AS.extras} glLights={AS.lights} />
      <ConsoleScreens e={e} f={f0} alert={!!failing} quads={[[-3.6, 8], [3.6, 8], [-2, 11], [2, 11]].map(([x, y]) => [[x - 0.68, y + 0.16, 1.52], [x + 0.68, y + 0.16, 1.52], [x + 0.68, y - 0.31, 1.04], [x - 0.68, y - 0.31, 1.04]] as [V3, V3, V3, V3])} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {advP && !AS.ready ? <g transform={`translate(${advP.x} ${advP.y}) scale(${1 - 2 * turn} 1) translate(${-advP.x} ${-advP.y})`}><AdvisorArt x={advP.x} y={advP.y} w={Math.min(420, 1300 / advP.d)} f={f0} lit={0.8} id="glass" /></g> : null}
      </svg>
      <XView e={e} faces={live.filter(isFrame)} lights={lights} flash={0.4} amb={0.12} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {/* o vidro: reflexos */}
        {(() => {
          const a = proj(e, [-6, 4, 0.9]);
          const b = proj(e, [6, 4, 3.2]);
          return a && b ? (
            <g opacity={0.5 * (1 - near * 0.4)}>
              <path d={`M ${a.x + 200} ${b.y} L ${a.x + 340} ${b.y} L ${a.x + 140} ${a.y} L ${a.x} ${a.y} Z`} fill="rgba(200,230,255,0.06)" />
              <path d={`M ${b.x - 500} ${b.y} L ${b.x - 440} ${b.y} L ${b.x - 640} ${a.y} L ${b.x - 700} ${a.y} Z`} fill="rgba(200,230,255,0.05)" />
            </g>
          ) : null;
        })()}
        {/* o Advisor (vira devagar quando percebe) e o canal com a Alyx */}
        {link && advP && alyxTop ? <line x1={alyxTop.x} y1={alyxTop.y + 40} x2={advP.x} y2={advP.y} stroke={mode ? VIO : "#ffd27a"} strokeWidth={2.5} strokeDasharray="8 8" strokeDashoffset={-f0 * 3} opacity={0.8} /> : null}
        {mode && f >= snapAt && f < snapAt + 10 && advP && alyxTop ? <line x1={(alyxTop.x + advP.x) / 2 - 30} y1={(alyxTop.y + advP.y) / 2} x2={(alyxTop.x + advP.x) / 2 + 30} y2={(alyxTop.y + advP.y) / 2 + 10} stroke={RED} strokeWidth={5} /> : null}
        {/* a telecinese erguendo a Alyx */}
        {lift > 0 && alyxTop && advP ? (
          <g opacity={lift}>
            {[0, 1, 2].map((k) => {
              const t = ((f0 / 20 + k / 3) % 1);
              return <ellipse key={k} cx={alyxTop.x} cy={alyxTop.y + 60} rx={40 + t * 50} ry={14 + t * 18} fill="none" stroke={VIO} strokeWidth={2} opacity={1 - t} />;
            })}
            <path d={`M ${advP.x} ${advP.y} Q ${(advP.x + alyxTop.x) / 2} ${Math.min(advP.y, alyxTop.y) - 80} ${alyxTop.x} ${alyxTop.y + 40}`} fill="none" stroke={VIO} strokeWidth={3} opacity={0.6} />
          </g>
        ) : null}
        <FlagAt e={e} pt={[alyxPt[0], alyxPt[1], 0.15 + lift * 1.2]} label="ALYX" col={ORANGE} f={f0} sub={mode ? (lift > 0.5 ? "ERGUIDA NO AR" : f >= glassAt ? "OLHA PARA OS MOTORES" : undefined) : f >= editAt ? "ALTERA A SEQUÊNCIA" : f >= calcAt ? "ENTREGA O CÁLCULO" : undefined} />
        {/* os soldados mirando */}
        {/* os soldados Combine (crachá com foto); no fim apontam para ela */}
        {/* 12/10 (pedido dele: crachás em cima de estruturas): só onde o PISO aparece para a câmera — o pé do crachá atrás de
            um console fazia a haste "nascer" em cima dele */}
        {([[-3.05, 12.5, "OTA · 04"], [2.75, 6.4, "OTA · 11"], [4.6, 13.2, "OTA · 07"]] as [number, number, string][]).map(([x, y, sub], k) => {
          const q = proj(e, [x, y, 1.3]);
          const aim = mode && f >= aimAt && alyxTop;
          return (
            <g key={k}>
              {aim && q ? <line x1={q.x} y1={q.y} x2={alyxTop!.x} y2={alyxTop!.y + 50} stroke="rgba(255,60,40,0.8)" strokeWidth={1.6} opacity={P(f, aimAt + k * 3, 8)} /> : null}
              <Pin e={e} x={x} y={y} col={RED} f={f0} who="combine" text="COMBINE" sub={aim ? "MIRANDO" : sub} h={1.9 + (k % 2) * 0.5} />
            </g>
          );
        })}
        {mode && f >= gmanAt ? <Call e={e} f={f} pt={[3.6, 15.4, 2.7]} from={gmanAt + 10} until={liftAt + 10} text="POR ALGUNS SEGUNDOS" sub="OBSERVANDO" col={CREAM} dx={-300} dy={-60} /> : null}
      </svg>
      {/* o zoom do HEV na tela dela: a sequência alterada antes de enviar */}
      {!mode && f >= ctrlAt ? (
        <div style={{ position: "absolute", right: 90, top: 130, width: 560, padding: "16px 20px", background: "linear-gradient(160deg, rgba(20,60,84,0.9), rgba(6,22,32,0.94))", clipPath: "polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px)", boxShadow: `inset 0 0 0 1.5px ${CYC}`, fontFamily: MONO, opacity: P(f, ctrlAt, 8) }}>
          <div style={{ fontSize: 15, letterSpacing: 4, color: CYC }}>H.E.V. · ZOOM · CONSOLE DA ALYX</div>
          <div style={{ display: "flex", gap: 14, marginTop: 14 }}>
            {seq.map((s2, i) => {
              const ch = i === 2 && f >= editAt;
              return (
                <div key={i} style={{ padding: "10px 14px", border: `2px solid ${ch ? ORANGE : "rgba(95,243,255,0.6)"}`, color: ch ? ORANGE : "#dff8ff", fontSize: 34, letterSpacing: 2, transform: ch && f < editAt + 10 ? `translateY(${Math.sin(f) * 3}px)` : undefined }}>
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
      {/* o procedimento (antes do zoom): avança, falha perto do fim */}
      {!mode && f >= advAt && f < ctrlAt ? (
        <div style={{ position: "absolute", left: 90, top: 130, width: 520, padding: "14px 18px", borderRadius: 10, background: "rgba(8,8,10,0.8)", border: `1.5px solid ${CYC}`, fontFamily: MONO, opacity: P(f, advAt, 8) * (1 - P(f, ctrlAt - 8, 8)) }}>
          <div style={{ fontSize: 15, letterSpacing: 4, color: CYC }}>O MESMO PADRÃO</div>
          {[[calcAt, "CÁLCULO · A. VANCE", ORANGE], [execAt, "OS ADVISORS EXECUTAM", VIO], [failAt, "FALHA · POUCO ANTES DA CONCLUSÃO", RED]].map(([t0, txt, col]) =>
            f >= (t0 as number) ? <div key={txt as string} style={{ fontSize: 20, letterSpacing: 2, color: col as string, marginTop: 8, opacity: P(f, t0 as number, 6) }}>› {txt as string}</div> : null,
          )}
          {f >= closeAt ? <div style={{ fontSize: 16, letterSpacing: 3, color: CREAM, marginTop: 12, opacity: P(f, closeAt, 8) }}>DESSA VEZ GORDON ESTÁ PERTO O SUFICIENTE</div> : null}
        </div>
      ) : null}
      {/* modo "perceberam": o estado da manifestação e do procedimento */}
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
      {failing ? <AbsoluteFill style={{ background: "rgba(255,40,30,0.1)", pointerEvents: "none" }} /> : null}
      <Hud f={f0} yaw={e.yaw} eye={e} blips={[{ x: alyxPt[0], y: alyxPt[1], hot: mode === 1 }]} msg={!mode && f < advAt ? "NO MEIO DO CAOS · O MESMO PADRÃO" : undefined} msgCol={CREAM} />
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f0, life), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 1:11:16 o Eli no rádio (a sala ao fundo, desfocada)
export const HL10EliPlea: React.FC<PR & { inner?: PR; frozenAt?: number }> = (p) => {
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
        <HL10Pattern {...inner} mode={1} frozen={(p.frozenAt ?? 990) / 30} life={1e6} />
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

// ================================================================================================= MÓDULO 10 · leva B (1:11:29 → 1:13:13)
// 11/10 (pedidos dele: caixas sem tampa, Combine como setinhas, o Gordon "do nada" com a Alyx; o 3D three.js reprovado):
// a luta e a mão acontecem NA MESMA sala de controle da cena do vidro (motor POV de sempre). O Gordon entra pela porta da
// galeria, atravessa a sala lutando até a Alyx suspensa ao lado do console dela e sai com ela pela porta do fundo, pela
// passarela entre os motores. Caixotes inteiros (desenho por distância real), Combine com crachá, Advisors no desenho
// aprovado.
export const CONSOLE_QUADS = [[-3.6, 8], [3.6, 8], [-2, 11], [2, 11]].map(([x, y]) => [[x - 0.68, y + 0.16, 1.52], [x + 0.68, y + 0.16, 1.52], [x + 0.68, y - 0.31, 1.04], [x - 0.68, y - 0.31, 1.04]] as [V3, V3, V3, V3]);
const ALYX_HOLD: [number, number] = [1.6, 12.4]; // onde ela fica suspensa (ao lado do console dela)
const ADV_HOLD: V3 = [-0.2, 13.6, 2.9]; // o Advisor que a segura
const ADV_FIGHT: V3 = [-4.0, 11.2, 2.7]; // o Advisor que luta
const ENEMY: [number, number, string][] = [[2.8, 16.4, "OTA · 04"], [-0.4, 17.0, "OTA · 07"], [4.9, 9.2, "OTA · 11"]];
type Crate = { p: V3; s: number; r?: number };
const crateFaces = (cs: Crate[]) => {
  const g = mk();
  cs.forEach((c) => combineCrate(g, c.p[0], c.p[1], c.p[2], c.s));
  return g.F;
};
const advAt3 = (e: Eye, p: V3, f: number, k: number, o = 1, lit = 0.8, flip = false) => {
  const q = proj(e, [p[0], p[1], p[2] + 0.08 * Math.sin(f / 20 + k)]);
  if (!q || o <= 0) return null;
  return <AdvisorArt key={"adv" + k} x={q.x} y={q.y} w={Math.min(520, 1500 / q.d)} f={f} lit={lit} id={`gl${k}`} o={o} flip={flip} />;
};
// ================================================================================================= 1:11:16 a luta · leitura tática
// 13/10 (pedido dele: apagar a cena POV 3D inteira da luta — Advisors atravessando o teto, luta tosca — e reformular): a
// luta vista de cima como replay tático. A sala de comando em planta (paredes cortadas baixas, consoles e a mesa em volume),
// a câmera acompanhando o Gordon; o Gordon é a marca λ com o cone de visão, os Combine são crachás vermelhos, os Advisors
// marcadores violeta com o raio da telecinese no chão, a Alyx presa no raio de um deles. Traçantes de verdade, soldados
// caindo, contêineres voando com sombra no chão (altura legível), a Gravity Gun puxando e devolvendo, o Advisor empurrado
// e perdendo o controle. Tudo em vetor projetado — nada atravessa nada.
type P3 = [number, number, number];
const FM_SOL: [number, number, string][] = [[-1.6, 13.4, "OTA · 04"], [2.6, 15.2, "OTA · 07"], [4.6, 9.4, "OTA · 11"]];
const FM_ADV_HOLD: P3 = [-0.2, 13.6, 2.7];
const FM_ADV_FIGHT: P3 = [-3.6, 11.4, 2.6];
const FM_ALYX: P3 = [1.6, 12.4, 1.2];
const FM_CONS: [number, number][] = [[-3.6, 8], [3.6, 8], [-2, 11], [2, 11]];
// 05/11 (pendência "a luta do Gordon para salvar a Alyx ainda fraca"): por cima da planta, a camada de JOGO. O HUD do HEV
// leva os golpes (vida e traje caem no "preso na parede" e no contêiner arremessado), indicador de dano vermelho na borda,
// a arma na mão muda (SMG → GRAVITY GUN), o feed de abates no canto, o título de cada momento entrando com peso e, quando
// a Gravity Gun devolve o contêiner, a câmera lenta (cor some, faixas de cinema) até o impacto no Advisor.
const fightPunch = (f: number, hit1: number, back: number, hit2: number) => {
  const k = (a: number, d: number, m: number) => (f >= a && f < a + d ? m * (1 - (f - a) / d) : 0);
  return 1 + k(hit1, 14, 0.05) + k(back, 8, 0.03) + k(hit2, 18, 0.07) + 0.04 * fightSlow(f, back, hit2);
};
const fightSlow = (f: number, back: number, hit2: number) => (f >= back - 6 && f < hit2 + 20 ? Math.min(1, (f - back + 6) / 6, (hit2 + 20 - f) / 10) : 0);
const FightFeel: React.FC<{
  f: number; life: number; holoK: number; pinned: boolean; solDie: number[];
  t: { cmdAt: number; enemAt: number; fightAt: number; ripAt: number; pinAt: number; throwAt: number; ggAt: number; backAt: number; spaceAt: number; ctrlAt: number; hitAt: number };
}> = ({ f, life, holoK, pinned, solDie, t }) => {
  if (holoK > 0.6) return null;
  const vis = 1 - holoK;
  const hit1 = t.throwAt + 14;
  // vida e traje: tiros de raspão, a parede, o contêiner; um kit no "abrindo espaço"
  const hp = Math.round(interpolate(f, [t.enemAt, t.fightAt, t.pinAt, t.pinAt + 20, hit1, hit1 + 8, t.spaceAt, t.spaceAt + 20], [100, 92, 88, 71, 70, 38, 38, 63], C));
  const ar = Math.round(interpolate(f, [t.enemAt, t.fightAt, t.pinAt, t.pinAt + 20, hit1, hit1 + 8], [85, 70, 66, 48, 47, 12], C));
  const hurt = Math.max(
    f >= t.pinAt && f < t.pinAt + 24 ? 1 - (f - t.pinAt) / 24 : 0,
    f >= hit1 && f < hit1 + 30 ? 1 - (f - hit1) / 30 : 0,
    f >= t.enemAt && f < t.fightAt && Math.floor(f / 9) % 3 === 0 ? 0.35 : 0,
  );
  const low = hp < 50;
  const gg = f >= t.ggAt;
  const slow = fightSlow(f, t.backAt, t.hitAt);
  // títulos de cada momento (entram grandes e assentam)
  const beats: [number, number, string, string][] = [
    [t.ripAt, t.pinAt, "ARRANCAM O CENÁRIO", "#c79bff"],
    [t.pinAt, t.throwAt, "PRESO NA PAREDE", "#c79bff"],
    [t.throwAt, t.ggAt, "ARREMESSAM", "#ff5d4d"],
    [t.ggAt, t.backAt, "GRAVITY GUN", "#ffb22e"],
    [t.backAt, t.spaceAt, "DEVOLVE", "#ffb22e"],
    [t.spaceAt, t.ctrlAt, "ABRE ESPAÇO", "#ffb22e"],
    [t.ctrlAt, life, "ELES PERDEM O CONTROLE", "#ff5d4d"],
  ];
  const beat = beats.filter(([a, b]) => f >= a && f < b).pop();
  const feed: [number, string, string][] = [
    ...solDie.filter((d) => d < 1e5).map((d, i) => [d, `GORDON  ✕  OTA · ${["04", "07", "11"][i]}`, "#f2f0f7"] as [number, string, string]),
    [t.hitAt, "GORDON  ⟲  ADVISOR · GRAVITY GUN", "#ffb22e"],
  ];
  const liveFeed = feed.filter(([a]) => f >= a && f < a + 150);
  const HUDC = low ? "#ff5d4d" : "#ffb22e";
  return (
    <AbsoluteFill style={{ opacity: vis, pointerEvents: "none" }}>
      {/* dano: borda vermelha + seta de onde veio */}
      {hurt > 0 ? <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 50%, rgba(255,30,20,${0.55 * hurt}) 100%)` }} /> : null}
      {hurt > 0.3 ? <div style={{ position: "absolute", left: pinned ? 70 : 1780, top: 470, width: 0, height: 0, borderTop: "36px solid transparent", borderBottom: "36px solid transparent", [pinned ? "borderRight" : "borderLeft"]: `46px solid rgba(255,60,40,${hurt})` } as React.CSSProperties} /> : null}
      {/* câmera lenta: faixas de cinema */}
      {slow > 0 ? (
        <>
          <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 90 * slow, background: "#000" }} />
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 90 * slow, background: "#000" }} />
        </>
      ) : null}
      {/* o título do momento */}
      {beat ? (
        <div key={beat[2]} style={{ position: "absolute", left: 0, right: 0, bottom: 150, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 84, letterSpacing: 4, color: beat[3], textShadow: `0 0 30px ${beat[3]}88, 0 6px 24px #000`, transform: `scale(${1.6 - 0.6 * P(f, beat[0], 8)})`, opacity: P(f, beat[0], 6) * (1 - P(f, beat[1] - 8, 8)) }}>{beat[2]}</div>
      ) : null}
      {/* HUD do HEV */}
      <div style={{ position: "absolute", left: 70, bottom: 54, display: "flex", gap: 48, fontFamily: MONO, color: HUDC, textShadow: `0 0 14px ${HUDC}99`, opacity: P(f, t.cmdAt, 10) }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 12 }}>
          <span style={{ fontSize: 40, opacity: low && Math.floor(f / 8) % 2 ? 0.3 : 0.9 }}>✚</span>
          <span style={{ fontSize: 76, fontWeight: 700, lineHeight: 1 }}>{hp}</span>
          <span style={{ fontSize: 18, letterSpacing: 4, marginBottom: 8 }}>VIDA</span>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 12, color: "#ffb22e" }}>
          <span style={{ fontSize: 76, fontWeight: 700, lineHeight: 1 }}>{ar}</span>
          <span style={{ fontSize: 18, letterSpacing: 4, marginBottom: 8 }}>TRAJE</span>
        </div>
      </div>
      <div style={{ position: "absolute", right: 70, bottom: 54, textAlign: "right", fontFamily: MONO, color: "#ffb22e", textShadow: "0 0 14px #ffb22e99", opacity: P(f, t.cmdAt, 10) }}>
        <div style={{ fontSize: 18, letterSpacing: 5 }}>{gg ? "ARMA · GRAVITY GUN" : "ARMA · SMG"}</div>
        <div style={{ fontSize: 66, fontWeight: 700, lineHeight: 1.1 }}>{gg ? (f >= t.backAt ? "PUNT" : "SEGURANDO") : `${Math.max(4, 45 - Math.floor(Math.max(0, f - t.enemAt) / 7))} / 135`}</div>
      </div>
      {/* feed de abates */}
      <div style={{ position: "absolute", right: 70, top: 190, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
        {liveFeed.map(([a, s, c]) => (
          <div key={s} style={{ padding: "6px 14px", borderRadius: 6, background: "rgba(0,0,0,0.6)", border: `1px solid ${c}55`, fontFamily: MONO, fontSize: 17, letterSpacing: 3, color: c, opacity: P(f, a, 6) * (1 - P(f, a + 130, 20)), transform: `translateX(${30 * (1 - P(f, a, 8))}px)` }}>{s}</div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
export const HL10FightMap: React.FC<PR & { inner?: PR; frozenAt?: number }> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  // 30/10 (ele: "parece que muda totalmente" da cena anterior): a luta abre no mesmo holograma em que o Eli pediu ajuda
  // (a última imagem: Alyx erguida, miras nela, o Gordon no vidro), sai do desfoque do rádio, o Gordon atravessa o vidro
  // e a câmera mergulha na sala; daí a planta da luta, com o mesmo fundo e o mesmo painel dos Advisors
  const holoOut = at(p, "cmdAt") - 4;
  const holoK = 1 - interpolate(f, [holoOut - 26, holoOut], [0, 1], { ...C, easing: Easing.inOut(Easing.cubic) });
  const [cmdAt, enemAt, advAt, notScrAt, fightAt, ripAt, pinAt, throwAt, coverAt, ggAt, backAt, spaceAt, ctrlAt] = ["cmdAt", "enemAt", "advAt", "notScrAt", "fightAt", "ripAt", "pinAt", "throwAt", "coverAt", "ggAt", "backAt", "spaceAt", "ctrlAt"].map((k) => at(p, k));
  const kk = (ks: [number, number][]) => interpolate(f, ks.map((x) => x[0]), ks.map((x) => x[1]), { ...C, easing: Easing.inOut(Easing.sin) });
  // o Gordon (no chão)
  const gx = kk([[0, -5.0], [cmdAt, -5.0], [fightAt, -4.6], [pinAt - 2, -4.4], [pinAt + 8, -5.55], [throwAt + 24, -5.5], [ggAt, -4.7], [spaceAt, -4.1], [spaceAt + 45, -2.3], [life, -1.6]]);
  const gy = kk([[0, 1.0], [cmdAt, 2.4], [fightAt, 4.4], [pinAt - 2, 5.0], [pinAt + 8, 5.4], [throwAt + 24, 5.4], [ggAt, 5.8], [spaceAt, 6.4], [spaceAt + 45, 7.0], [life, 8.6]]);
  const pinned = f >= pinAt && f < throwAt + 24;
  const hitCam = f >= throwAt + 14 && f < throwAt + 26 ? 1 - (f - throwAt - 14) / 12 : 0;
  const shake = (pinned ? 0.06 : 0) * Math.sin(f * 2.3) + hitCam * 0.12 * Math.sin(f * 3.1);
  // a câmera: atrás e acima do Gordon, olhando para onde ele vai
  // enquadra entre o Gordon e a Alyx (a ação toda no meio)
  const T: P3 = [gx * 0.62 + FM_ALYX[0] * 0.38 - 0.3 + shake, gy * 0.62 + FM_ALYX[1] * 0.38 + 0.3, 0.5];
  const Cm: P3 = [T[0] - 2.2, T[1] - 7.0, 7.8];
  const fwd = (() => { const d = [T[0] - Cm[0], T[1] - Cm[1], T[2] - Cm[2]]; const L = Math.hypot(d[0], d[1], d[2]); return [d[0] / L, d[1] / L, d[2] / L] as P3; })();
  const rgt = (() => { const r = [fwd[1], -fwd[0], 0]; const L = Math.hypot(r[0], r[1]); return [r[0] / L, r[1] / L, 0] as P3; })();
  const upv: P3 = [rgt[1] * fwd[2] - rgt[2] * fwd[1], rgt[2] * fwd[0] - rgt[0] * fwd[2], rgt[0] * fwd[1] - rgt[1] * fwd[0]];
  const FP = 1250;
  const pj = (q: P3) => {
    const d = [q[0] - Cm[0], q[1] - Cm[1], q[2] - Cm[2]];
    const z = d[0] * fwd[0] + d[1] * fwd[1] + d[2] * fwd[2];
    if (z < 0.5) return null;
    const x = d[0] * rgt[0] + d[1] * rgt[1] + d[2] * rgt[2];
    const y = d[0] * upv[0] + d[1] * upv[1] + d[2] * upv[2];
    return { x: 960 + (FP * x) / z, y: 560 - (FP * y) / z, d: z };
  };
  const poly = (pts: P3[]) => {
    const q = pts.map(pj);
    if (q.some((v) => !v)) return null;
    return q.map((v) => `${v!.x.toFixed(1)},${v!.y.toFixed(1)}`).join(" ");
  };
  const ln = (a: P3, b: P3, key: string, col: string, w = 1.5, o = 1, dash?: string) => {
    const A = pj(a), B = pj(b);
    return A && B ? <line key={key} x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke={col} strokeWidth={w} opacity={o} strokeDasharray={dash} /> : null;
  };
  // caixas em volume (consoles, mesa, contêineres): faces visíveis, da mais longe para a mais perto
  const box = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, fill: string, edge: string, key: string, o = 1) => {
    const v: P3[] = [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]];
    const faces: [number[], P3][] = [[[4, 5, 6, 7], [0, 0, 1]], [[0, 1, 5, 4], [0, -1, 0]], [[1, 2, 6, 5], [1, 0, 0]], [[2, 3, 7, 6], [0, 1, 0]], [[3, 0, 4, 7], [-1, 0, 0]]];
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, cz = (z0 + z1) / 2;
    const out: React.ReactNode[] = [];
    faces.forEach(([ix, n], i) => {
      const c: P3 = [cx + (n[0] * (x1 - x0)) / 2, cy + (n[1] * (y1 - y0)) / 2, cz + (n[2] * (z1 - z0)) / 2];
      const toC = [Cm[0] - c[0], Cm[1] - c[1], Cm[2] - c[2]];
      if (toC[0] * n[0] + toC[1] * n[1] + toC[2] * n[2] <= 0) return;
      const s = poly(ix.map((k) => v[k]));
      if (!s) return;
      const shade = n[2] ? 1 : n[1] ? 0.72 : 0.58;
      out.push(<polygon key={key + i} points={s} fill={fill} stroke={edge} strokeWidth={1.2} style={{ filter: `brightness(${shade})` }} opacity={o} />);
    });
    return <g key={key}>{out}</g>;
  };
  // ---------------------------------------------------------------- o estado da luta
  // 29/10 (ele cortou "e desmontar as próprias coberturas"): sem a etapa da cobertura (coverAt >= ggAt), o contêiner do
  // canto fica no lugar e o soldado atrás dele não cai
  const hasCover = coverAt < ggAt;
  const SOL_DIE = [fightAt + 22, fightAt + 62, hasCover ? coverAt + 40 : 1e6];
  const lift = P(f, ripAt, 30), flyIn = P(f, throwAt, 14), grab = P(f, ggAt + 8, 20), punt = P(f, backAt, 10);
  const hitAt = backAt + 10;
  const aBase: P3 = [-1.4, 12.2, 0], aHover: P3 = [-1.6, 11.4, 1.8], landP: P3 = [-4.4, 6.6, 0];
  const holdP: P3 = [gx + 0.9, gy + 1.6, 1.1];
  const advHit: P3 = [FM_ADV_FIGHT[0] + 0.3, FM_ADV_FIGHT[1] - 0.6, 2.0];
  const L3 = (a: P3, b: P3, k: number): P3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
  let cA: P3;
  if (f < ripAt) cA = aBase;
  else if (f < throwAt) cA = L3(aBase, [aHover[0], aHover[1], aHover[2] + 0.1 * Math.sin(f / 8)], lift);
  else if (f < throwAt + 14) cA = L3(aHover, [gx + 0.4, gy + 0.6, 1.2], flyIn);
  else if (f < ggAt + 8) { const k = P(f, throwAt + 14, 10); cA = L3([gx + 0.4, gy + 0.6, 1.2], landP, k); }
  else if (f < backAt) cA = L3(landP, holdP, grab);
  else if (f < hitAt + 2) cA = L3(holdP, advHit, punt);
  else { const k = P(f, hitAt + 2, 24); cA = [advHit[0] - 0.8 * k, advHit[1] + 0.5 * k, Math.max(0, advHit[2] * (1 - k * k))]; }
  const cover = hasCover ? P(f, coverAt, 18) : 0;
  const cB: P3 = [4.0 - cover * 3.2, 9.0 + cover * 2.2, Math.sin(cover * Math.PI) * 2.0];
  const knock = f >= hitAt ? P(f, hitAt, 12) * (1 - P(f, hitAt + 40, 40) * 0.5) : 0;
  const lose = P(f, ctrlAt, 20);
  const advF: P3 = [FM_ADV_FIGHT[0] - knock * 0.8 + lose * Math.sin(f / 3.2) * 0.25, FM_ADV_FIGHT[1] + knock * 1.4, FM_ADV_FIGHT[2] - lose * 1.0];
  // ---------------------------------------------------------------- os elementos desenhados
  const avatar = (q: P3, img: string, col: string, r: number, key: string, o = 1, ring?: string, sub?: string) => {
    const b = pj([q[0], q[1], 0]), t = pj(q);
    if (!b || !t || o <= 0) return null;
    const s = Math.max(0.6, Math.min(1.5, 11 / t.d));
    const R = r * s;
    return (
      <g key={key} opacity={o}>
        <ellipse cx={b.x} cy={b.y} rx={R * 0.9} ry={R * 0.3} fill="rgba(0,0,0,0.45)" />
        {q[2] > 0.2 ? <line x1={b.x} y1={b.y} x2={t.x} y2={t.y + R} stroke={col} strokeWidth={1.5} strokeDasharray={q[2] > 1.5 ? "4 4" : undefined} opacity={0.8} /> : null}
        <defs>
          <clipPath id={`cl${key}`}>
            <circle cx={t.x} cy={t.y} r={R} />
          </clipPath>
        </defs>
        <circle cx={t.x} cy={t.y} r={R + 3} fill="#05070a" stroke={ring ?? col} strokeWidth={3} />
        <image href={staticFile(img)} x={t.x - R} y={t.y - R} width={R * 2} height={R * 2} preserveAspectRatio="xMidYMid slice" clipPath={`url(#cl${key})`} />
        {sub ? (
          <text x={t.x + R + 8} y={t.y + 5} fill={col} fontFamily={MONO} fontSize={Math.max(11, 14 * s)} letterSpacing={2} style={{ paintOrder: "stroke", stroke: "#000", strokeWidth: 4 }}>
            {sub}
          </text>
        ) : null}
      </g>
    );
  };
  const advMark = (q: P3, key: string, o: number, flick = 0) => {
    const b = pj([q[0], q[1], 0]), t = pj(q);
    if (!b || !t) return null;
    const s = Math.max(0.7, Math.min(1.6, 11 / t.d));
    const R = 44 * s;
    const ringO = flick > 0 && Math.floor(f / 3) % 2 ? 0.25 : 1;
    // o raio da telecinese no chão (anéis que respiram)
    const rings = [0, 1, 2].map((k) => {
      const tt = ((f / 30 + k / 3) % 1);
      const rr = 1.2 + tt * 1.6;
      const pts = Array.from({ length: 32 }).map((_, i) => { const a = (i / 32) * Math.PI * 2; return pj([q[0] + Math.cos(a) * rr, q[1] + Math.sin(a) * rr, 0.02]); });
      if (pts.some((v) => !v)) return null;
      return <polygon key={k} points={pts.map((v) => `${v!.x},${v!.y}`).join(" ")} fill="none" stroke="#b48cff" strokeWidth={1.6} opacity={(1 - tt) * 0.6 * ringO * (1 - flick * 0.6)} />;
    });
    return (
      <g key={key} opacity={o}>
        {rings}
        <line x1={b.x} y1={b.y} x2={t.x} y2={t.y + R * 0.6} stroke="#b48cff" strokeWidth={1.5} strokeDasharray="4 4" opacity={0.7} />
        <circle cx={t.x} cy={t.y} r={R * 1.25} fill="rgba(180,140,255,0.18)" style={{ filter: "blur(6px)" }} opacity={ringO} />
        <circle cx={t.x} cy={t.y} r={R * 0.9} fill="#2a0f5c" stroke="#c79bff" strokeWidth={3} opacity={ringO * 0.9 + 0.1} />
        <image href={staticFile("hl3silh/advisor_mask.png")} x={t.x - R * 0.75} y={t.y - R * 0.6} width={R * 1.5} height={R * 1.2} preserveAspectRatio="xMidYMid meet" style={{ filter: "brightness(0) invert(0.85) sepia(1) hue-rotate(220deg) saturate(3)" }} />
      </g>
    );
  };
  const aura = (q: P3, col: string, k: number, key: string) => {
    const t = pj([q[0], q[1], q[2] + 0.45]);
    if (!t || k <= 0) return null;
    const s = Math.max(0.6, 12 / t.d);
    return (
      <g key={key} opacity={k}>
        <circle cx={t.x} cy={t.y} r={46 * s} fill={col} opacity={0.22} style={{ filter: "blur(10px)" }} />
        {[0, 1].map((r) => { const tt = ((f / 12 + r / 2) % 1); return <circle key={r} cx={t.x} cy={t.y} r={(30 + tt * 26) * s} fill="none" stroke={col} strokeWidth={2} opacity={(1 - tt) * 0.8} />; })}
      </g>
    );
  };
  const G0: P3 = [gx, gy, 0];
  const gP = pj(G0);
  const gTop = pj([gx, gy, 1.5]);
  // traçantes: dos soldados no Gordon; do Gordon no soldado que vai cair
  const tracers: React.ReactNode[] = [];
  FM_SOL.forEach(([x, y], k) => {
    if (f < enemAt + k * 6 || f >= SOL_DIE[k]) return;
    const ph = (f + k * 7) % 12;
    if (ph > 4) return;
    const a: P3 = [x, y, 1.3], b: P3 = [gx + (k - 1) * 0.4, gy + 0.2, 1.3];
    const t = ph / 4;
    tracers.push(<g key={"te" + k} style={{ filter: "drop-shadow(0 0 6px #5fe6ff)" }}>{ln(L3(a, b, t * 0.8), L3(a, b, Math.min(1, t * 0.8 + 0.3)), "tl" + k, "#dffaff", 5, 1)}</g>);
    const m = pj(a);
    if (m && ph < 2) tracers.push(<circle key={"tm" + k} cx={m.x} cy={m.y} r={9} fill="rgba(160,240,255,0.9)" style={{ filter: "blur(2px)" }} />);
  });
  FM_SOL.forEach(([x, y], k) => {
    const die = SOL_DIE[k];
    if (f < die - 16 || f > die) return;
    if (((f - die) % 4 + 4) % 4 > 1) return;
    tracers.push(<g key={"tg" + k} style={{ filter: "drop-shadow(0 0 6px #ffb050)" }}>{ln([gx, gy, 1.3], [x, y, 1.3], "tgl" + k, "#ffe6b0", 4, 0.95)}</g>);
    const m = pj([gx, gy, 1.3]);
    if (m) tracers.push(<circle key={"tgm" + k} cx={m.x} cy={m.y} r={14} fill="rgba(255,210,120,0.9)" style={{ filter: "blur(3px)" }} />);
  });
  // a Gravity Gun
  const ggEls: React.ReactNode[] = [];
  if (f >= ggAt && f < backAt) {
    const A = pj([gx, gy, 1.2]), B = pj([cA[0], cA[1], cA[2] + 0.4]);
    if (A && B) {
      ggEls.push(<line key="gb" x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke="rgba(255,150,40,0.5)" strokeWidth={14} style={{ filter: "blur(5px)" }} />);
      ggEls.push(<line key="gc" x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke="#ffe2b0" strokeWidth={2.5} />);
      [0, 1, 2].forEach((k) => { const t = ((f / 10 + k / 3) % 1); ggEls.push(<circle key={"gp" + k} cx={A.x + (B.x - A.x) * t} cy={A.y + (B.y - A.y) * t} r={5} fill="#fff1d0" />); });
    }
  }
  if (f >= backAt && f < backAt + 10) {
    const A = pj([gx, gy, 1.2]);
    const k = (f - backAt) / 10;
    if (A) ggEls.push(<circle key="pr" cx={A.x} cy={A.y} r={20 + 220 * k} fill="none" stroke="#ffd29a" strokeWidth={4} opacity={1 - k} />);
  }
  if (f >= hitAt && f < hitAt + 24) {
    const H2 = pj(advHit);
    const k = (f - hitAt) / 24;
    if (H2) {
      ggEls.push(<circle key="hf" cx={H2.x} cy={H2.y} r={30 + 110 * k} fill="rgba(240,220,255,0.6)" opacity={1 - k} style={{ filter: "blur(8px)" }} />);
      Array.from({ length: 14 }).forEach((_, i) => { const a = (i / 14) * Math.PI * 2; ggEls.push(<line key={"hs" + i} x1={H2.x} y1={H2.y} x2={H2.x + Math.cos(a) * (30 + 170 * k)} y2={H2.y + Math.sin(a) * (30 + 170 * k)} stroke={i % 2 ? "#e6c8ff" : "#fff2d8"} strokeWidth={2.5} opacity={1 - k} />); });
    }
  }
  // o impacto do contêiner nele
  const impact = f >= throwAt + 14 && f < throwAt + 26;
  // a sala: chão com grade, paredes cortadas baixas, consoles, a mesa
  const room: React.ReactNode[] = [];
  // o piso da sala aceso de leve (antes era um vazio escuro)
  { const fl = poly([[-6, 3.95, 0], [6, 3.95, 0], [6, 15.9, 0], [-6, 15.9, 0]]); if (fl) room.push(<polygon key="floor" points={fl} fill="rgba(40,90,90,0.22)" />); }
  { const fl2 = poly([[-6, 1, 0], [-4.3, 1, 0], [-4.3, 3.95, 0], [-6, 3.95, 0]]); if (fl2) room.push(<polygon key="floor2" points={fl2} fill="rgba(40,90,90,0.16)" />); }
  for (let x = -6; x <= 6; x += 1) room.push(ln([x, 1, 0], [x, 16, 0], "gx" + x, "rgba(95,243,208,0.10)", 1));
  for (let y = 1; y <= 16; y += 1) room.push(ln([-6, y, 0], [6, y, 0], "gy" + y, "rgba(95,243,208,0.10)", 1));
  const wall = (a: [number, number], b: [number, number], key: string) => {
    const s = poly([[a[0], a[1], 0], [b[0], b[1], 0], [b[0], b[1], 0.5], [a[0], a[1], 0.5]]);
    const top = poly([[a[0], a[1], 0.5], [b[0], b[1], 0.5], [b[0], b[1], 0.5], [a[0], a[1], 0.5]]);
    return s ? <g key={key}><polygon points={s} fill="#0c1a1c" stroke="#5ff3d0" strokeWidth={1.4} opacity={0.9} />{top ? null : null}</g> : null;
  };
  // o corredor de entrada e a sala
  room.push(wall([-6, 1], [-6, 15.9], "w1"), wall([6, 4], [6, 15.9], "w2"), wall([-6, 15.9], [-4.6, 15.9], "w3"), wall([-3.4, 15.9], [6, 15.9], "w4"), wall([-4.3, 1], [-4.3, 3.95], "w5"), wall([-4.3, 3.95], [6, 3.95], "w6"));
  room.push(ln([-4.3, 3.97, 0.5], [6, 3.97, 0.5], "glass", "rgba(140,230,255,0.9)", 2.5));
  const vols: { d: number; el: React.ReactNode }[] = [];
  const addBox = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, fill: string, edge: string, key: string, o = 1) => {
    const c = pj([(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2]);
    if (c) vols.push({ d: c.d, el: box(x0, y0, z0, x1, y1, z1, fill, edge, key, o) });
  };
  FM_CONS.forEach(([x, y], i) => addBox(x - 0.8, y - 0.4, 0, x + 0.8, y + 0.4, 1.0, "#16252a", "#5ff3d0", "cs" + i));
  addBox(-0.9, 9.1, 0, 0.9, 10.9, 0.8, "#12242a", "#4fdcc4", "hub");
  // os contêineres (com sombra no chão para ler a altura)
  const crate = (q: P3, key: string, col: string) => {
    const sh = pj([q[0], q[1], 0]);
    if (sh && q[2] > 0.05) room.push(<ellipse key={key + "sh"} cx={sh.x} cy={sh.y} rx={30 * Math.max(0.6, 11 / sh.d)} ry={10 * Math.max(0.6, 11 / sh.d)} fill="rgba(0,0,0,0.55)" />);
    addBox(q[0] - 0.4, q[1] - 0.4, q[2], q[0] + 0.4, q[1] + 0.4, q[2] + 0.7, "#2a3038", col, key);
  };
  crate(cA, "cA", "#8fe8f0");
  crate(cB, "cB", "#8fe8f0");
  vols.sort((a, b) => b.d - a.d);
  // o caminho e o cone de visão do Gordon
  const trail: string[] = [];
  for (let k = 0; k <= 40; k++) {
    const ff = Math.max(0, f - k * 4);
    const x = interpolate(ff, [0, cmdAt, fightAt, pinAt - 2, pinAt + 8, throwAt + 24, ggAt, spaceAt, spaceAt + 45, life], [-5.0, -5.0, -4.6, -4.4, -5.55, -5.5, -4.7, -4.1, -2.3, -1.6], { ...C, easing: Easing.inOut(Easing.sin) });
    const y = interpolate(ff, [0, cmdAt, fightAt, pinAt - 2, pinAt + 8, throwAt + 24, ggAt, spaceAt, spaceAt + 45, life], [1.0, 2.4, 4.4, 5.0, 5.4, 5.4, 5.8, 6.4, 7.0, 8.6], { ...C, easing: Easing.inOut(Easing.sin) });
    const q = pj([x, y, 0.02]);
    if (q) trail.push(`${q.x.toFixed(1)},${q.y.toFixed(1)}`);
  }
  const look = Math.atan2(FM_ALYX[0] - gx, FM_ALYX[1] - gy);
  const cone = poly([[gx, gy, 0.03], [gx + Math.sin(look - 0.45) * 3.2, gy + Math.cos(look - 0.45) * 3.2, 0.03], [gx + Math.sin(look + 0.45) * 3.2, gy + Math.cos(look + 0.45) * 3.2, 0.03]]);
  const msg = f < cmdAt ? "UMA DAS PARTES JOGÁVEIS MAIS IMPORTANTES" : pinned ? "PRESO CONTRA A PAREDE" : f >= ripAt && f < pinAt ? "ARRANCAM PARTE DO CENÁRIO" : f >= throwAt && f < coverAt ? "ARREMESSAM OBJETOS" : f >= coverAt && f < ggAt ? "DESMONTAM A COBERTURA" : f >= ggAt && f < backAt ? "GRAVITY GUN" : f >= backAt && f < spaceAt ? "DEVOLVENDO OS DESTROÇOS" : f >= spaceAt && f < ctrlAt ? "ABRINDO ESPAÇO" : f >= ctrlAt ? "ELES PERDEM O CONTROLE" : "";
  const stab = 1 - lose;
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 40%, #071c1a 0%, #020707 75%)", overflow: "hidden" }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: 1 - holoK, transform: `scale(${(0.86 + 0.14 * (1 - holoK)) * fightPunch(f, throwAt + 14, backAt, hitAt)}) translate(${hitCam * 14 * Math.sin(f * 3.7)}px, ${hitCam * 10 * Math.cos(f * 4.1)}px)`, filter: `saturate(${1 - 0.6 * fightSlow(f, backAt, hitAt)})`, transformOrigin: "50% 50%" }}>
        {room}
        {(() => { const q = pj([5.8, 4.3, 0]); return q ? <text x={q.x} y={q.y + 22} textAnchor="end" fill={ORANGE} fontFamily={MONO} fontSize={14} letterSpacing={3} style={{ paintOrder: "stroke", stroke: "#000", strokeWidth: 4 }}>SALA DE CONTROLE</text> : null; })()}
        {cone ? <polygon points={cone} fill="rgba(255,178,46,0.12)" stroke="rgba(255,178,46,0.4)" strokeWidth={1} /> : null}
        <polyline points={trail.join(" ")} fill="none" stroke="rgba(255,178,46,0.6)" strokeWidth={2} strokeDasharray="6 6" />
        {vols.map((v, i) => <g key={i}>{v.el}</g>)}
        {/* a Alyx presa no ar pelo Advisor */}
        {aura(FM_ALYX, "#c79bff", 0.9 * (1 - 0.5 * lose), "alyxA")}
        {avatar(FM_ALYX, "hl3silh/alyx_badge.jpg", ORANGE, 38, "alyx", 1, "#c79bff", "ALYX · SUSPENSA")}
        {advMark(FM_ADV_HOLD, "advH", 1)}
        {advMark(advF, "advF", 1, lose)}
        {/* os soldados */}
        {FM_SOL.map(([x, y, n], k) => {
          const die = SOL_DIE[k];
          const down = P(f, die, 12);
          return avatar([x, y, 1.5 * (1 - 0.7 * down)], "hl3silh/combine_badge.jpg", f >= die ? "#7a7f86" : RED, 32, "sol" + k, P(f, cmdAt + k * 6, 10) * (1 - P(f, die + 20, 16)), undefined, f >= die ? "✕ ABATIDO" : f >= enemAt ? "ATIRANDO" : n);
        })}
        {/* o que a telecinese segura / o que a Gravity Gun segura */}
        {f >= ripAt && f < throwAt + 12 ? aura(cA, "#c79bff", P(f, ripAt, 8), "auA") : null}
        {hasCover && f >= coverAt && f < coverAt + 20 ? aura(cB, "#c79bff", 1 - P(f, coverAt + 12, 8), "auB") : null}
        {f >= ggAt + 8 && f < backAt + 4 ? aura(cA, "#ffb060", P(f, ggAt + 8, 8), "auG") : null}
        {tracers}
        {ggEls}
        {/* o Gordon */}
        {gP && gTop ? (
          <g>
            <ellipse cx={gP.x} cy={gP.y} rx={26} ry={9} fill="none" stroke={AMB} strokeWidth={2} />
            <line x1={gP.x} y1={gP.y} x2={gTop.x} y2={gTop.y + 22} stroke={AMB} strokeWidth={2} />
            <circle cx={gTop.x} cy={gTop.y} r={22} fill="#120c02" stroke={AMB} strokeWidth={3} />
            <text x={gTop.x} y={gTop.y + 9} textAnchor="middle" fill={AMB} fontFamily="Georgia, serif" fontSize={28} fontWeight={700}>λ</text>
            <text x={gTop.x + 30} y={gTop.y + 5} fill={AMB} fontFamily={MONO} fontSize={14} letterSpacing={3} style={{ paintOrder: "stroke", stroke: "#000", strokeWidth: 4 }}>GORDON</text>
          </g>
        ) : null}
        {f >= ctrlAt ? (() => { const q = pj(advF); return q ? <g opacity={P(f, ctrlAt, 10)}><line x1={q.x} y1={q.y} x2={q.x - 200} y2={q.y - 110} stroke={AMB} strokeWidth={1.6} /><text x={q.x - 210} y={q.y - 118} textAnchor="end" fill={AMB} fontFamily={MONO} fontSize={20} letterSpacing={4} style={{ paintOrder: "stroke", stroke: "#000", strokeWidth: 5 }}>PERDE O CONTROLE</text><text x={q.x - 210} y={q.y - 94} textAnchor="end" fill="#f2f0f7" fontFamily={MONO} fontSize={14} letterSpacing={2} style={{ paintOrder: "stroke", stroke: "#000", strokeWidth: 4 }}>O MOMENTO DE ATACAR</text></g> : null; })() : null}
      </svg>
      {impact ? <AbsoluteFill style={{ background: `rgba(255,255,255,${0.35 * (1 - (f - throwAt - 14) / 12)})`, pointerEvents: "none" }} /> : null}
      {pinned ? <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 45%, rgba(120,60,200,0.4) 100%)", pointerEvents: "none" }} /> : null}
      {/* o painel do HEV e a legenda do momento */}
      {f >= cmdAt ? (
        <div style={{ position: "absolute", left: 80, top: 90, width: 540, padding: "14px 18px", borderRadius: 12, background: "rgba(14,10,4,0.82)", border: `1.5px solid ${AMB}`, fontFamily: MONO, opacity: P(f, cmdAt, 8) * (1 - P(f, fightAt + 40, 12)) }}>
          <div style={{ fontSize: 15, letterSpacing: 5, color: AMB }}>H.E.V. · OBJETIVO</div>
          <div style={{ fontSize: 22, letterSpacing: 2, color: TXT, marginTop: 6 }}>ABRIR CAMINHO ATÉ A ALYX</div>
          {f >= notScrAt ? (
            <div style={{ position: "relative", fontSize: 18, letterSpacing: 3, color: "rgba(242,240,247,0.6)", marginTop: 10, opacity: P(f, notScrAt, 8) }}>
              SEQUÊNCIA ROTEIRIZADA
              <div style={{ position: "absolute", left: -4, right: 200, top: "50%", height: 3, background: RED, transform: `scaleX(${P(f, notScrAt + 6, 8)})`, transformOrigin: "left" }} />
            </div>
          ) : null}
          {f >= notScrAt + 14 ? <div style={{ fontSize: 18, letterSpacing: 3, color: VIO, marginTop: 6, opacity: P(f, notScrAt + 14, 8) }}>OS ADVISORS LUTAM DE VERDADE</div> : null}
        </div>
      ) : null}
      {/* o mesmo painel dos Advisors da cena do holograma: estável até eles perderem o controle */}
      <div style={{ position: "absolute", right: 70, top: 70, width: 420, padding: "12px 16px", borderRadius: 10, background: "rgba(4,14,14,0.78)", border: `1.5px solid ${f >= ctrlAt ? RED : VIO}`, fontFamily: MONO, opacity: 1 - holoK }}>
        <div style={{ fontSize: 13, letterSpacing: 4, color: f >= ctrlAt ? RED : VIO }}>{f >= ctrlAt ? "MANIFESTAÇÃO · INSTÁVEL" : "MANIFESTAÇÃO · ESTÁVEL"}</div>
        <div style={{ position: "relative", height: 12, marginTop: 8, background: "rgba(255,255,255,0.08)", borderRadius: 6 }}>
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${(0.94 * stab + 0.2 * (1 - stab) + (f >= ctrlAt ? 0.06 * Math.sin(f * 1.7) : 0.02 * Math.sin(f / 20))) * 100}%`, background: f >= ctrlAt ? RED : VIO, borderRadius: 6 }} />
        </div>
        <div style={{ fontSize: 14, letterSpacing: 2, color: "#e8fff4", marginTop: 6 }}>{f >= ctrlAt ? "ELES PERDEM O CONTROLE" : f >= notScrAt ? "OS ADVISORS LUTAM" : "SEGURANDO A ALYX"}</div>
      </div>
      {holoK > 0 ? (
        <AbsoluteFill style={{ opacity: holoK, transform: `scale(${1 + 0.5 * (1 - holoK)})`, transformOrigin: "30% 55%", filter: `blur(${7 * (1 - P(f, 0, 14))}px) brightness(${0.42 + 0.58 * P(f, 0, 14)})` }}>
          <HL10Pattern {...((p.inner ?? {}) as PR)} mode={1} frozen={(p.frozenAt ?? 990) / 30} life={1e6} gorGo={interpolate(f, [8, holoOut - 10], [0, 1], { ...C, easing: Easing.inOut(Easing.sin) })} {...({ gorSub: "ATRAVESSA O VIDRO" } as unknown as { gorSub: number })} />
        </AbsoluteFill>
      ) : null}
      {msg && f < ripAt ? <div key={msg} style={{ position: "absolute", left: 0, right: 0, top: 40, textAlign: "center", fontFamily: MONO, fontSize: 20, letterSpacing: 8, color: pinned ? VIO : AMB, textShadow: "0 2px 10px #000" }}>{msg}</div> : null}
      <Snd at={pinAt} name="tick" file="mf_punch.wav" vol={0.35} />
      <Snd at={throwAt + 14} name="tick" file="tc_hits_05_impact.wav" vol={0.4} />
      <Snd at={ggAt + 6} name="tick" file="hl_gravidade_dispara.wav" vol={0.3} />
      <Snd at={hitAt} name="tick" file="tc_hits_02_deep.wav" vol={0.45} />
      <Snd at={hitAt + 2} name="tick" file="metal_clank.wav" vol={0.3} />
      <FightFeel f={f} life={life} holoK={holoK} t={{ cmdAt, enemAt, fightAt, ripAt, pinAt, throwAt, ggAt, backAt, spaceAt, ctrlAt, hitAt }} solDie={SOL_DIE} pinned={pinned} />
      <AbsoluteFill style={{ boxShadow: "inset 0 0 200px rgba(0,0,0,0.85)", pointerEvents: "none" }} />
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

export const HL10Fight: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [cmdAt, enemAt, advAt, notScrAt, fightAt, ripAt, pinAt, throwAt, coverAt, ggAt, backAt, spaceAt, ctrlAt] = ats(p, ["cmdAt", "enemAt", "advAt", "notScrAt", "fightAt", "ripAt", "pinAt", "throwAt", "coverAt", "ggAt", "backAt", "spaceAt", "ctrlAt"]);
  const G = useMemo(() => buildGlassRoom(), []);
  // 12/10 v3 (pedido dele: Advisor surgindo do nada, Alyx lá no fundo, Combine que não atiram, Gravity Gun porca, o
  // Advisor só piscando, arco roxo sem sentido): a luta coreografada no tempo da fala.
  //  · os dois Advisors e a Alyx suspensa estão na sala desde que a porta abre; os Combine já estão atrás dos consoles
  //  · "soldados": eles abrem fogo (traçantes ciano, clarão no cano, faísca na parede ao lado dele)
  //  · "lutando": o Gordon atira de volta e derruba um por um (o crachá tomba e apaga)
  //  · "arrancar parte do cenário": o Advisor arranca um contêiner do chão (aura violeta em volta do objeto)
  //  · "prender contra paredes": a tela é empurrada contra a parede, tudo treme
  //  · "jogar objetos": o contêiner vem na câmera, impacto, cai na frente dele
  //  · "desmontar as coberturas": o contêiner na frente do último soldado é arrancado; ele fica exposto e cai
  //  · Gravity Gun: o feixe laranja pega o contêiner caído, ele sobe e fica preso na frente da câmera; o disparo
  //    (clarão, anel de choque) o devolve no Advisor, que é arremessado para trás, gira e solta faíscas
  //  · "abrindo espaço": o Gordon avança entre os consoles até perto da Alyx (onde a cena seguinte começa)
  //  · "perdem o controle": o Advisor cambaleia, afunda, a aura apaga aos trancos
  const pinned = f >= pinAt && f < throwAt + 24;
  const hitCam = f >= throwAt + 14 && f < throwAt + 24 ? 1 - (f - throwAt - 14) / 10 : 0;
  const shake = pinned ? Math.sin(f * 2.5) * 0.012 : hitCam * Math.sin(f * 3.1) * 0.05 + (f >= fightAt ? Math.sin(f * 1.7) * 0.003 : 0);
  const e: Eye = {
    x: keys(f, [[0, -5.0], [cmdAt, -5.0], [fightAt, -4.6], [pinAt - 2, -4.4], [pinAt + 8, -5.55], [throwAt + 24, -5.5], [ggAt, -4.7], [spaceAt, -4.1], [spaceAt + 45, -2.3], [life, -1.6]]),
    y: keys(f, [[0, 1.0], [cmdAt, 2.4], [fightAt, 4.4], [pinAt - 2, 5.0], [pinAt + 8, 5.4], [throwAt + 24, 5.4], [ggAt, 5.8], [spaceAt, 6.4], [spaceAt + 45, 7.0], [life, 8.6]]),
    z: 1.65,
    yaw: keys(f, [[0, 0], [cmdAt, 0.15], [enemAt, 0.35], [advAt, 0.25], [fightAt, 0.4], [ripAt, 0.3], [pinAt, 0.5], [coverAt, 0.7], [ggAt, 0.45], [backAt, 0.35], [spaceAt, 0.45], [life, 0.5]]) + shake,
    pitch: keys(f, [[0, 0.02], [advAt, 0.08], [ggAt, 0.02], [life, 0.06]]) + hitCam * 0.04,
    F: 980,
  };
  const fwd = (d: number, z: number, side = 0): V3 => [e.x + Math.sin(e.yaw) * d + Math.cos(e.yaw) * side, e.y + Math.cos(e.yaw) * d - Math.sin(e.yaw) * side, z];
  // ---- os soldados: [x, y, morre em]
  const SOL: [number, number, number, string][] = [[-1.6, 13.4, fightAt + 22, "OTA · 04"], [2.6, 15.2, fightAt + 62, "OTA · 07"], [4.6, 9.4, coverAt + 40, "OTA · 11"]];
  // ---- os contêineres
  const lift = P(f, ripAt, 30);
  const flyIn = P(f, throwAt, 14);
  const aBase: V3 = [-1.4, 12.2, 0];
  const aHover: V3 = [-1.4, 11.6, 1.7 + 0.08 * Math.sin(f / 8)];
  const landP: V3 = useMemo(() => [-4.0, 6.8, 0] as V3, []);
  const grab = P(f, ggAt + 8, 20);
  const hold: V3 = fwd(2.8, 1.35, 0.35);
  const punt = P(f, backAt, 10);
  const hitAt = backAt + 10;
  const advHit: V3 = [ADV_FIGHT[0] + 0.5, ADV_FIGHT[1] - 0.9, ADV_FIGHT[2] - 0.6];
  const lerp3 = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
  let cA: V3;
  if (f < ripAt) cA = aBase;
  else if (f < throwAt) cA = lerp3(aBase, aHover, lift);
  else if (f < throwAt + 14) cA = lerp3(aHover, fwd(1.1, 1.3), flyIn);
  else if (f < ggAt + 8) cA = landP;
  else if (f < backAt) cA = lerp3(landP, [hold[0], hold[1], hold[2] + 0.05 * Math.sin(f / 4)], grab);
  else if (f < hitAt + 2) cA = lerp3(hold, advHit, punt);
  else {
    const k = P(f, hitAt + 2, 26);
    cA = [advHit[0] - 0.6 * k, advHit[1] + 0.4 * k, Math.max(0, advHit[2] * (1 - k * k))];
  }
  const cover = P(f, coverAt, 18);
  const cB: V3 = [4.2 - cover * 3.6, 9.0 + cover * 1.8, Math.sin(cover * Math.PI) * 2.2];
  const crates: Crate[] = [{ p: cA, s: 0.75 }, { p: cB, s: 0.85 }];
  const faces = G.concat(crateFaces(crates));
  const lights: XL[] = [{ x: 0, y: 10, z: 2.6, col: [90, 220, 240], k: 0.6, r: 9 }, { x: -4, y: 6, z: 3, col: [200, 210, 220], k: 0.35, r: 7 }, { x: 0, y: 19, z: 2.4, col: [170, 240, 255], k: 0.9, r: 9 }, { x: 0, y: 10, z: 3, col: [255, 60, 40], k: f >= cmdAt ? 0.3 + 0.2 * Math.sin(f / 4) : 0, r: 12 }];
  // ---- os Advisors: o que luta vira para o Gordon, é arremessado pela batida e no fim perde o controle
  const knock = f >= hitAt ? P(f, hitAt, 14) * (1 - P(f, hitAt + 40, 40) * 0.6) : 0;
  const lose = P(f, ctrlAt, 20);
  const wob = lose * Math.sin(f / 3.2) * 0.22;
  const advPos: V3 = [ADV_FIGHT[0] + knock * -0.6 + wob, ADV_FIGHT[1] + knock * 1.6, ADV_FIGHT[2] + knock * 0.4 - lose * 0.9];
  const advLook: V3 = f >= hitAt && f < hitAt + 30 ? [advPos[0] + 2, advPos[1] + 3, advPos[2] + 1.5] : [e.x, e.y, 1.6 + (lose ? -1.2 * lose : 0)];
  const AS = useAdvScene([
    { pos: ADV_HOLD, look: [ALYX_HOLD[0], ALYX_HOLD[1], 1.6], reach: 0.8 },
    { pos: advPos, look: advLook, reach: lose > 0 ? 0.1 + 0.3 * Math.abs(Math.sin(f / 5)) : f >= ripAt ? 0.7 + 0.3 * Math.sin(f / 7) : 0.3 + 0.2 * P(f, advAt, 20), yaw: knock * 0.8 * Math.sin(f / 6) },
  ], f, 2.4);
  const fightKey = useMemo(() => {
    const out: THREE.Light[] = [];
    [ADV_FIGHT, ADV_HOLD].forEach((A) => {
      const key = new THREE.PointLight("#f0ecff", 70, 10, 1.1);
      key.position.copy(W3([A[0] - 1.6, A[1] - 2.6, A[2] + 1.0]));
      const rim = new THREE.PointLight("#9fe6ff", 45, 9, 1.1);
      rim.position.copy(W3([A[0] + 1.4, A[1] + 1.6, A[2] + 1.4]));
      const under = new THREE.PointLight("#b48cff", 30, 6, 1.2);
      under.position.copy(W3([A[0], A[1] - 0.6, A[2] - 1.4]));
      out.push(key, rim, under);
    });
    return out;
  }, []);
  // ---- efeitos projetados
  const pq = (v: V3) => proj(e, v);
  const muzzleG = { x: 1330, y: 930 }; // a arma do Gordon (canto de baixo, à direita)
  const shotsE: React.ReactNode[] = [];
  SOL.forEach(([x, y, die], k) => {
    if (f < enemAt + k * 6 || f >= die) return;
    const ph = (f + k * 7) % 12;
    if (ph > 3) return;
    const a = pq([x, y, 1.35]);
    if (!a) return;
    const tgt = { x: 960 + (k - 1) * 220 + Math.sin(f) * 40, y: 560 + Math.cos(f * 1.3) * 60 };
    const t = ph / 3;
    const x1 = a.x + (tgt.x - a.x) * Math.min(1, t + 0.35), y1 = a.y + (tgt.y - a.y) * Math.min(1, t + 0.35);
    const x0 = a.x + (tgt.x - a.x) * t, y0 = a.y + (tgt.y - a.y) * t;
    shotsE.push(
      <g key={"e" + k}>
        <circle cx={a.x} cy={a.y} r={10 + 6 * (1 - t)} fill="rgba(160,240,255,0.9)" style={{ filter: "blur(2px)" }} opacity={1 - t} />
        <line x1={x0} y1={y0} x2={x1} y2={y1} stroke="#bff6ff" strokeWidth={4} strokeLinecap="round" style={{ filter: "drop-shadow(0 0 6px #5fe6ff)" }} />
        {ph === 3 ? <circle cx={tgt.x} cy={tgt.y} r={14} fill="rgba(220,250,255,0.8)" style={{ filter: "blur(3px)" }} /> : null}
      </g>,
    );
  });
  // o Gordon atira: rajadas curtas em quem vai cair
  const shotsG: React.ReactNode[] = [];
  SOL.forEach(([x, y, die], k) => {
    if (f < die - 16 || f > die) return;
    if ((f - die) % 4 !== 0 && (f - die) % 4 !== -1) return;
    const b = pq([x, y, 1.3]);
    if (!b) return;
    shotsG.push(
      <g key={"g" + k}>
        <circle cx={muzzleG.x} cy={muzzleG.y} r={46} fill="rgba(255,210,120,0.85)" style={{ filter: "blur(8px)" }} />
        <line x1={muzzleG.x} y1={muzzleG.y} x2={muzzleG.x + (b.x - muzzleG.x) * 0.55} y2={muzzleG.y + (b.y - muzzleG.y) * 0.55} stroke="#ffe0a0" strokeWidth={3} />
        <circle cx={b.x} cy={b.y} r={12} fill="rgba(255,230,170,0.9)" style={{ filter: "blur(2px)" }} />
      </g>,
    );
  });
  const auraAt = (v: V3, col: string, k: number) => {
    const q = pq([v[0], v[1], v[2] + 0.4]);
    if (!q || k <= 0) return null;
    const s = Math.min(260, 900 / q.d);
    return (
      <g opacity={k}>
        <ellipse cx={q.x} cy={q.y} rx={s * 0.75} ry={s * 0.62} fill={col} opacity={0.28} style={{ filter: "blur(14px)" }} />
        {[0, 1, 2].map((r) => {
          const t = ((f / 14 + r / 3) % 1 + 1) % 1;
          return <ellipse key={r} cx={q.x} cy={q.y} rx={s * (0.5 + t * 0.45)} ry={s * (0.42 + t * 0.4)} fill="none" stroke={col} strokeWidth={2} opacity={(1 - t) * 0.7} />;
        })}
        {Array.from({ length: 10 }).map((_, i) => {
          const a = i * 0.63 + f / 9;
          const rr = s * (0.55 + 0.15 * Math.sin(f / 5 + i));
          return <circle key={"p" + i} cx={q.x + Math.cos(a) * rr} cy={q.y + Math.sin(a) * rr * 0.8} r={2.2} fill={col} opacity={0.8} />;
        })}
      </g>
    );
  };
  // a Gravity Gun: feixe laranja vivo com pulsos até o contêiner; no disparo, clarão e anel de choque
  const gg = (() => {
    if (f < ggAt || f > hitAt + 30) return null;
    const q = pq([cA[0], cA[1], cA[2] + 0.4]);
    const els: React.ReactNode[] = [];
    if (q && f < backAt) {
      const pts = Array.from({ length: 18 }).map((_, i) => {
        const t = i / 17;
        const j = (rnd(Math.floor(f / 2) * 31 + i) - 0.5) * 18 * Math.sin(t * Math.PI);
        return `${(muzzleG.x + (q.x - muzzleG.x) * t + j).toFixed(1)},${(muzzleG.y + (q.y - muzzleG.y) * t - Math.sin(t * Math.PI) * 30 + j * 0.6).toFixed(1)}`;
      }).join(" ");
      els.push(<polyline key="gb" points={pts} fill="none" stroke="rgba(255,150,40,0.45)" strokeWidth={16} strokeLinejoin="round" style={{ filter: "blur(5px)" }} />);
      els.push(<polyline key="gc" points={pts} fill="none" stroke="#ffe2b0" strokeWidth={2.5} strokeLinejoin="round" />);
      [0, 1, 2, 3].forEach((k) => {
        const t = ((f / 10 + k / 4) % 1);
        els.push(<circle key={"gp" + k} cx={muzzleG.x + (q.x - muzzleG.x) * t} cy={muzzleG.y + (q.y - muzzleG.y) * t - Math.sin(t * Math.PI) * 30} r={6} fill="#fff1d0" style={{ filter: "drop-shadow(0 0 8px #ff9a3c)" }} />);
      });
      els.push(<circle key="gm" cx={muzzleG.x} cy={muzzleG.y} r={30 + 6 * Math.sin(f / 3)} fill="rgba(255,170,60,0.6)" style={{ filter: "blur(8px)" }} />);
    }
    if (f >= backAt && f < backAt + 10) {
      const k = (f - backAt) / 10;
      els.push(<circle key="pf" cx={muzzleG.x} cy={muzzleG.y} r={90 * (1 - k) + 30} fill="rgba(255,240,210,0.95)" opacity={1 - k} style={{ filter: "blur(10px)" }} />);
      els.push(<circle key="pr" cx={muzzleG.x} cy={muzzleG.y} r={40 + 360 * k} fill="none" stroke="#ffd29a" strokeWidth={5} opacity={1 - k} />);
      if (q) els.push(<line key="pt" x1={muzzleG.x} y1={muzzleG.y} x2={q.x} y2={q.y} stroke="rgba(255,236,200,0.8)" strokeWidth={10 * (1 - k)} style={{ filter: "blur(2px)" }} />);
    }
    if (f >= hitAt && f < hitAt + 26) {
      const hq = pq(advHit);
      const k = (f - hitAt) / 26;
      if (hq)
        Array.from({ length: 16 }).forEach((_, i) => {
          const a = (i / 16) * Math.PI * 2;
          els.push(<line key={"hs" + i} x1={hq.x} y1={hq.y} x2={hq.x + Math.cos(a) * (40 + 220 * k)} y2={hq.y + Math.sin(a) * (40 + 220 * k)} stroke={i % 2 ? "#e6c8ff" : "#fff2d8"} strokeWidth={3} opacity={1 - k} />);
        });
      if (hq) els.push(<circle key="hf" cx={hq.x} cy={hq.y} r={140 * (1 - k) + 20} fill="rgba(240,220,255,0.8)" opacity={1 - k} style={{ filter: "blur(12px)" }} />);
    }
    return <g>{els}</g>;
  })();
  const impactCam = f >= throwAt + 14 && f < throwAt + 22;
  return (
    <AbsoluteFill style={{ background: "#020304", overflow: "hidden" }}>
      <XView e={e} faces={faces} lights={lights} flash={0.8} amb={0.16} solid extras={AS.extras} glLights={AS.ready ? [...AS.lights, ...fightKey] : []} />
      <ConsoleScreens e={e} f={f} quads={CONSOLE_QUADS} alert />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {/* a Alyx suspensa pela telecinese (aura dela) */}
        {occluded(e, [ALYX_HOLD[0], ALYX_HOLD[1], 2.0]) ? null : auraAt([ALYX_HOLD[0], ALYX_HOLD[1], 1.0], "#c79bff", 0.85 * (1 - 0.5 * lose))}
        <FlagAt e={e} pt={[ALYX_HOLD[0], ALYX_HOLD[1], 1.2]} label="ALYX" col={ORANGE} f={f} sub="SUSPENSA NO AR" />
        {/* o que o Advisor segura: aura violeta em volta do objeto (sem fio no ar) */}
        {f >= ripAt && f < throwAt + 12 ? auraAt(cA, "#c79bff", P(f, ripAt, 10)) : null}
        {f >= coverAt && f < coverAt + 20 ? auraAt(cB, "#c79bff", 1 - P(f, coverAt + 12, 8)) : null}
        {/* o que a Gravity Gun segura: aura laranja */}
        {f >= ggAt + 8 && f < backAt + 4 ? auraAt(cA, "#ffb060", P(f, ggAt + 8, 8)) : null}
        {/* os soldados: atiram; caem quando o Gordon acerta */}
        {f >= cmdAt
          ? SOL.map(([x, y, die, sub], k) => {
              const down = P(f, die, 14);
              return (
                <g key={k} opacity={P(f, cmdAt + k * 4, 8) * (1 - P(f, die + 16, 14))}>
                  <Pin e={e} x={x} y={y} col={RED} f={f} who="combine" text="COMBINE" sub={f >= die ? "✕ ABATIDO" : f >= enemAt ? "ATIRANDO" : sub} h={(1.9 + (k % 2) * 0.4) * (1 - 0.75 * down)} />
                </g>
              );
            })
          : null}
        {shotsE}
        {shotsG}
        {gg}
        {f >= ctrlAt ? <Call e={e} f={f} pt={advPos} from={ctrlAt} until={life} text="PERDE O CONTROLE" sub="O MOMENTO DE ATACAR" col={AMB} dx={-280} dy={-120} /> : null}
      </svg>
      {impactCam ? <AbsoluteFill style={{ background: `rgba(255,255,255,${0.5 * (1 - (f - throwAt - 14) / 8)})`, pointerEvents: "none" }} /> : null}
      {f >= cmdAt ? (
        <div style={{ position: "absolute", left: 90, top: 110, width: 560, padding: "14px 18px", borderRadius: 12, background: "rgba(14,10,4,0.82)", border: `1.5px solid ${AMB}`, fontFamily: MONO, opacity: P(f, cmdAt, 8) * (1 - P(f, fightAt + 40, 12)) }}>
          <div style={{ fontSize: 15, letterSpacing: 5, color: AMB }}>H.E.V. · OBJETIVO</div>
          <div style={{ fontSize: 22, letterSpacing: 2, color: TXT, marginTop: 6 }}>ABRIR CAMINHO ATÉ A ALYX</div>
          {f >= notScrAt ? (
            <div style={{ position: "relative", fontSize: 18, letterSpacing: 3, color: "rgba(242,240,247,0.6)", marginTop: 10, opacity: P(f, notScrAt, 8) }}>
              SEQUÊNCIA ROTEIRIZADA
              <div style={{ position: "absolute", left: -4, right: 200, top: "50%", height: 3, background: RED, transform: `scaleX(${P(f, notScrAt + 6, 8)})`, transformOrigin: "left" }} />
            </div>
          ) : null}
          {f >= notScrAt + 14 ? <div style={{ fontSize: 18, letterSpacing: 3, color: VIO, marginTop: 6, opacity: P(f, notScrAt + 14, 8) }}>OS ADVISORS LUTAM DE VERDADE</div> : null}
        </div>
      ) : null}
      {f >= ggAt ? (
        <div style={{ position: "absolute", right: 300, bottom: 250, padding: "10px 16px", borderRadius: 8, background: "rgba(10,8,2,0.78)", border: `1.5px solid ${AMB}`, fontFamily: MONO, fontSize: 22, letterSpacing: 4, color: AMB, opacity: P(f, ggAt, 6) * (1 - P(f, spaceAt, 10)) }}>
          ◆ GRAVITY GUN
        </div>
      ) : null}
      {pinned ? <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 40%, rgba(120,60,200,0.45) 100%)", pointerEvents: "none" }} /> : null}
      <Hud f={f} yaw={e.yaw} eye={e} blips={[{ x: advPos[0], y: advPos[1], hot: true }, { x: ALYX_HOLD[0], y: ALYX_HOLD[1] }]} msg={f < cmdAt ? "UMA DAS PARTES JOGÁVEIS MAIS IMPORTANTES" : pinned ? "PRESO CONTRA A PAREDE" : f >= ripAt && f < pinAt ? "ARRANCAM PARTE DO CENÁRIO" : f >= throwAt && f < coverAt ? "ARREMESSAM OBJETOS" : f >= coverAt && f < ggAt ? "DESMONTAM A COBERTURA" : f >= backAt && f < spaceAt ? "DEVOLVENDO OS DESTROÇOS" : f >= spaceAt && f < ctrlAt ? "ABRINDO ESPAÇO" : undefined} msgCol={pinned ? VIO : AMB} />
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 1:12:02 a mão (a mesma sala; depois a passarela)
export const HL10Hand: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [downAt, fallAt, handAt, lookAt, acceptAt, noSorryAt, minAt, knowAt, endAt, gunAt, runAt, sideAt] = ats(p, ["downAt", "fallAt", "handAt", "lookAt", "acceptAt", "noSorryAt", "minAt", "knowAt", "endAt", "gunAt", "runAt", "sideAt"]);
  const G = useMemo(() => buildGlassRoom(), []);
  // 12/10 (pedido dele: eles corriam para uma parede que não dava em nada): passam pela porta do fundo e a corrida segue
  // no corredor do navio (o mesmo da cena seguinte, a das telas), lado a lado
  const H = useMemo(() => buildShipHall2(40), []);
  const HALL = runAt + 44;
  const inHall = f >= HALL;
  const run = P(f, runAt, 10);
  const bob = run > 0 ? Math.abs(Math.sin(f / 4)) * 0.05 : 0;
  // continua de onde a luta parou (−2,6 · 8,0) → chega perto dela → corre até a porta do fundo e entra na passarela
  const ex = keys(f, [[0, -1.6], [handAt, 0.6], [runAt, 0.6], [runAt + 40, -3.6], [runAt + 70, -4.8], [life, -4.8]]);
  const ey = keys(f, [[0, 8.6], [handAt, 10.6], [runAt, 10.6], [runAt + 40, 13.6], [runAt + 70, 16.6], [life, 22.5]]);
  const e0: Eye = {
    x: ex,
    y: ey,
    z: 1.65 + bob,
    yaw: keys(f, [[0, 0.5], [downAt, 0.35], [handAt, 0.45], [acceptAt + 10, 0.45], [runAt, 0.45], [runAt + 24, -0.75], [runAt + 60, -0.1], [life, 0]]),
    pitch: keys(f, [[0, 0.12], [fallAt, 0.1], [fallAt + 14, -0.12], [handAt, -0.22], [acceptAt + 10, -0.02], [life, 0]]) + (f >= downAt - 4 && f < downAt + 8 ? 0.05 * (1 - (f - downAt + 4) / 12) : 0),
    F: 980,
  };
  const hy = 2 + Math.max(0, f - HALL) * 0.075;
  const e: Eye = inHall ? { x: -0.4 + 0.08 * Math.sin(f / 13), y: hy, z: 1.65 + Math.abs(Math.sin(f / 4.5)) * 0.05, yaw: 0.06 + 0.02 * Math.sin(f / 37), pitch: -0.03, F: 960 } : e0;
  const hallLamps: XL[] = Array.from({ length: 14 }).map((_, i) => 1.5 + i * 3).filter((ly) => ly > hy - 4 && ly < hy + 18).map((ly) => ({ x: 0, y: ly, z: 2.9, col: [255, 232, 196] as RGB, k: 1.0, r: 4.6 }));
  const lifted = 1 - IOx((f - fallAt) / 14);
  // 30/10 (ele: o Gordon derrubando o Advisor estava seco e sem lógica): o mesmo golpe da luta. A Gravity Gun pega o
  // destroço caído no chão, segura na frente dele e dispara no Advisor; o impacto o joga para trás e para baixo, o
  // campo que segura a Alyx falha aos trancos e ela cai na fala
  const ggA = Math.max(8, downAt - 56), puntT = downAt - 4, hitT = downAt + 2;
  const fw3 = (d: number, z: number, side = 0): V3 => [e0.x + Math.sin(e0.yaw) * d + Math.cos(e0.yaw) * side, e0.y + Math.cos(e0.yaw) * d - Math.sin(e0.yaw) * side, z];
  const debFloor: V3 = [-1.3, 10.7, 0];
  const advChest: V3 = [ADV_HOLD[0], ADV_HOLD[1] - 0.5, ADV_HOLD[2] - 0.3];
  const L3h = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
  let deb: V3;
  if (f < ggA) deb = debFloor;
  else if (f < puntT) { const hold = fw3(2.4, 1.3, 0.35); deb = L3h(debFloor, [hold[0], hold[1], hold[2] + 0.05 * Math.sin(f / 4)], P(f, ggA, 16)); }
  else if (f < hitT) deb = L3h(fw3(2.4, 1.3, 0.35), advChest, (f - puntT) / (hitT - puntT));
  else { const k = P(f, hitT, 22); deb = [advChest[0] + 0.7 * k, advChest[1] + 0.4 * k, Math.max(0, advChest[2] * (1 - k * k))]; }
  const advDown = P(f, hitT, 26);
  const advBack = P(f, hitT, 10);
  const lights: XL[] = [{ x: 0, y: 10, z: 2.6, col: [90, 220, 240], k: 0.5, r: 9 }, { x: 0, y: 19, z: 2.4, col: [170, 240, 255], k: 0.9, r: 9 }, { x: 2.5, y: 7, z: 3, col: [190, 140, 255], k: lifted * 0.5, r: 6 }, { x: 0, y: 10, z: 3, col: [255, 60, 40], k: 0.3 + 0.2 * Math.sin(f / 4), r: 12 }];
  // a Alyx: suspensa → cai → aceita a mão → corre à frente dele
  const runK = P(f, runAt, 30);
  const alyxX = inHall ? 0.75 : run > 0 ? e.x + Math.sin(e.yaw) * 2.6 - Math.cos(e.yaw) * 0.5 : ALYX_HOLD[0];
  const alyxY = inHall ? hy + 1.6 + 0.2 * Math.sin(f / 20) : run > 0 ? e.y + Math.cos(e.yaw) * 2.6 + Math.sin(e.yaw) * 0.5 : ALYX_HOLD[1];
  const alyxZ = run > 0 ? 0 : 1.2 * lifted;
  const gripped = f >= ggA && f < hitT ? 0.04 * Math.sin(f * 1.9) : 0; // o Advisor percebe e se agita antes do disparo
  const advPosH: V3 = [ADV_HOLD[0] + 0.4 * advBack + gripped, ADV_HOLD[1] + 1.1 * advBack, ADV_HOLD[2] + 0.3 * Math.sin(advBack * Math.PI) - advDown * 2.3];
  const advQ = proj(e, advPosH);
  const AS = useAdvScene([{ pos: advPosH, look: [ALYX_HOLD[0], ALYX_HOLD[1], 1.2 - advDown * 2], reach: 0.8 * (1 - advDown), show: advDown < 1 }], f, 2.4);
  const muzzleH = { x: 1330, y: 930 };
  const debQ = proj(e, [deb[0], deb[1], deb[2] + 0.4]);
  const fieldO = f >= hitT && f < fallAt ? (Math.floor(f / 3) % 2 ? 0.25 : 1) : 1; // o campo dela falhando aos trancos
  const secs = Math.max(0, 300 - Math.floor((f - minAt) / 30));
  void runK;
  void H;
  // o cronômetro sai antes do corte (a cena seguinte não tem ele)
  const timer = f >= minAt ? (
    <div style={{ position: "absolute", right: 110, top: 140, width: 520, padding: "14px 18px", borderRadius: 12, background: "rgba(14,10,4,0.86)", border: `1.5px solid ${RED}`, fontFamily: MONO, opacity: P(f, minAt, 8) * (1 - P(f, life - 40, 20)) }}>
      <div style={{ fontSize: 15, letterSpacing: 5, color: RED }}>POUCOS MINUTOS</div>
      <div style={{ fontSize: 48, letterSpacing: 4, color: TXT, marginTop: 4 }}>{`${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`}</div>
      {f >= knowAt ? <div style={{ fontSize: 18, letterSpacing: 3, color: VIO, marginTop: 8, opacity: P(f, knowAt, 8) }}>OS ADVISORS SABEM</div> : null}
      {f >= endAt ? <div style={{ fontSize: 18, letterSpacing: 2, color: CREAM, marginTop: 6, opacity: P(f, endAt, 8) }}>SE TERMINAREM SOZINHOS · TUDO ACABA ANTES DO NÚCLEO</div> : null}
    </div>
  ) : null;
  // 30/10 (ele: corte seco do "lado a lado" para a agente, as telas surgindo do nada): o corredor da corrida é o mesmo
  // da cena seguinte, rodando "antes da hora" (fo negativo) — mesmas telas, mesma câmera, e o corte não aparece
  if (inHall)
    return (
      <AbsoluteFill style={{ background: "#020304", overflow: "hidden" }}>
        <HL10MindRun p={{ life: 1e6 } as PR} part="agent" fo={-life} preMsg={f >= life - 24 ? undefined : f >= sideAt ? "LADO A LADO · PELA PRIMEIRA VEZ DESDE O SALTO" : "PARA O NÚCLEO"} preSub={f >= life - 55 ? "ANDANDO · FALANDO" : f >= sideAt ? "LADO A LADO" : "ARMADA"} />
        {timer}
        <AbsoluteFill style={{ background: "#000", opacity: interpolate(f, [HALL - 8, HALL, HALL + 8], [0, 1, 0], C), pointerEvents: "none" }} />
      </AbsoluteFill>
    );
  return (
    <AbsoluteFill style={{ background: "#020304", overflow: "hidden" }}>
      {inHall ? (
        <XView e={e} faces={H} lights={hallLamps} flash={0.35} amb={0.13} seam="rgba(0,0,0,0.18)" gl smooth />
      ) : (
        <>
          <XView e={e} faces={f < hitT + 40 ? G.concat(crateFaces([{ p: deb, s: 0.7 }])) : G} lights={lights} flash={0.8} amb={0.12} solid extras={AS.extras} glLights={AS.lights} />
          <ConsoleScreens e={e} f={f} quads={CONSOLE_QUADS} alert />
        </>
      )}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        
        {/* a Gravity Gun: o feixe vivo até o destroço, o disparo e o impacto no Advisor */}
        {f >= ggA && f < puntT && debQ ? (() => {
          const pts = Array.from({ length: 18 }).map((_, i) => {
            const t = i / 17;
            const j = (rnd(Math.floor(f / 2) * 31 + i) - 0.5) * 18 * Math.sin(t * Math.PI);
            return `${(muzzleH.x + (debQ.x - muzzleH.x) * t + j).toFixed(1)},${(muzzleH.y + (debQ.y - muzzleH.y) * t - Math.sin(t * Math.PI) * 30 + j * 0.6).toFixed(1)}`;
          }).join(" ");
          return (
            <g>
              <polyline points={pts} fill="none" stroke="rgba(255,150,40,0.45)" strokeWidth={16} strokeLinejoin="round" style={{ filter: "blur(5px)" }} />
              <polyline points={pts} fill="none" stroke="#ffe2b0" strokeWidth={2.5} strokeLinejoin="round" />
              {[0, 1, 2, 3].map((k) => { const t = (f / 10 + k / 4) % 1; return <circle key={k} cx={muzzleH.x + (debQ.x - muzzleH.x) * t} cy={muzzleH.y + (debQ.y - muzzleH.y) * t - Math.sin(t * Math.PI) * 30} r={6} fill="#fff1d0" style={{ filter: "drop-shadow(0 0 8px #ff9a3c)" }} />; })}
              <circle cx={muzzleH.x} cy={muzzleH.y} r={30 + 6 * Math.sin(f / 3)} fill="rgba(255,170,60,0.6)" style={{ filter: "blur(8px)" }} />
              <circle cx={debQ.x} cy={debQ.y} r={70} fill="rgba(255,170,60,0.18)" style={{ filter: "blur(10px)" }} />
            </g>
          );
        })() : null}
        {f >= puntT && f < puntT + 10 ? (() => {
          const k = (f - puntT) / 10;
          return (
            <g>
              <circle cx={muzzleH.x} cy={muzzleH.y} r={90 * (1 - k) + 30} fill="rgba(255,240,210,0.95)" opacity={1 - k} style={{ filter: "blur(10px)" }} />
              <circle cx={muzzleH.x} cy={muzzleH.y} r={40 + 360 * k} fill="none" stroke="#ffd29a" strokeWidth={5} opacity={1 - k} />
              {debQ ? <line x1={muzzleH.x} y1={muzzleH.y} x2={debQ.x} y2={debQ.y} stroke="rgba(255,236,200,0.8)" strokeWidth={10 * (1 - k)} style={{ filter: "blur(2px)" }} /> : null}
            </g>
          );
        })() : null}
        {f >= hitT && f < hitT + 26 && advQ ? (() => {
          const k = (f - hitT) / 26;
          return (
            <g>
              <circle cx={advQ.x} cy={advQ.y} r={140 * (1 - k) + 20} fill="rgba(240,220,255,0.8)" opacity={1 - k} style={{ filter: "blur(12px)" }} />
              {Array.from({ length: 16 }).map((_, i) => { const a = (i / 16) * Math.PI * 2; return <line key={i} x1={advQ.x} y1={advQ.y} x2={advQ.x + Math.cos(a) * (40 + 220 * k)} y2={advQ.y + Math.sin(a) * (40 + 220 * k)} stroke={i % 2 ? "#e6c8ff" : "#fff2d8"} strokeWidth={3} opacity={1 - k} />; })}
            </g>
          );
        })() : null}
        {lifted > 0.05 ? (() => {
          const q = proj(e, [ALYX_HOLD[0], ALYX_HOLD[1], alyxZ + 1.2]);
          return q ? [0, 1, 2].map((k) => { const t = (f / 20 + k / 3) % 1; return <ellipse key={k} cx={q.x} cy={q.y + 80} rx={50 + t * 50} ry={16 + t * 16} fill="none" stroke={VIO} strokeWidth={2} opacity={(1 - t) * lifted * fieldO} />; }) : null;
        })() : null}
        <FlagAt e={e} pt={[alyxX, alyxY, alyxZ]} label="ALYX" col={ORANGE} f={f} sub={f >= sideAt ? "LADO A LADO" : f >= gunAt ? "ARMADA" : f >= acceptAt ? "ACEITA A MÃO" : f >= lookAt ? "OLHA PARA A MÃO" : lifted > 0.5 ? "SUSPENSA NO AR" : undefined} />
        <Call e={e} f={f} pt={[ADV_HOLD[0], ADV_HOLD[1], ADV_HOLD[2] - 0.4]} from={downAt + 4} until={Math.min(fallAt + 20, HALL)} text="GORDON DERRUBA O ADVISOR" col={AMB} dx={300} dy={-110} />
      </svg>
      {f >= ggA && f < fallAt ? (
        <div style={{ position: "absolute", right: 300, bottom: 250, padding: "10px 16px", borderRadius: 8, background: "rgba(10,8,2,0.78)", border: `1.5px solid ${AMB}`, fontFamily: MONO, fontSize: 22, letterSpacing: 4, color: AMB, opacity: P(f, ggA, 6) * (1 - P(f, fallAt - 10, 10)) }}>
          ◆ GRAVITY GUN
        </div>
      ) : null}
      {f >= handAt && f < noSorryAt + 10 ? (
        <div style={{ position: "absolute", left: "50%", top: 700, transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: 14, padding: "12px 22px", background: "rgba(10,8,2,0.8)", border: `1.5px solid ${AMB}`, borderRadius: 10, fontFamily: MONO, color: AMB, opacity: P(f, handAt, 8) * (1 - P(f, noSorryAt, 10)) }}>
          <span style={{ padding: "2px 10px", border: `1.5px solid ${AMB}`, borderRadius: 6, fontSize: 24, background: f >= acceptAt ? AMB : "transparent", color: f >= acceptAt ? "#0a0806" : AMB }}>E</span>
          <span style={{ fontSize: 24, letterSpacing: 3 }}>{f >= acceptAt ? "ELA ACEITA A MÃO" : "ESTENDER A MÃO"}</span>
        </div>
      ) : null}
      {f >= noSorryAt && f < runAt + 30 ? (
        <div style={{ position: "absolute", left: 110, top: 150, width: 520, fontFamily: MONO, opacity: P(f, noSorryAt, 8) * (1 - P(f, runAt + 10, 12)) }}>
          {["PEDIR DESCULPAS", "EXPLICAR TUDO"].map((t2, i) => (
            <div key={t2} style={{ position: "relative", marginTop: i ? 10 : 0, padding: "10px 14px", background: "rgba(8,8,10,0.8)", borderLeft: `3px solid ${RED}`, fontSize: 22, letterSpacing: 3, color: "rgba(242,240,247,0.7)" }}>
              {t2}
              <span style={{ position: "absolute", left: 10, right: 10, top: "50%", height: 3, background: RED, transform: `scaleX(${P(f, noSorryAt + 6 + i * 6, 8)})`, transformOrigin: "left" }} />
            </div>
          ))}
        </div>
      ) : null}
      {timer}
      {/* 12/10: a frase branca solta embaixo saiu (regra: nada de frase branca no meio do POV) → vai para a mensagem do HUD */}
      <Hud f={f} yaw={e.yaw} eye={e} blips={[{ x: alyxX, y: alyxY }]} msg={f >= sideAt ? "LADO A LADO · PELA PRIMEIRA VEZ DESDE O SALTO" : f >= runAt ? "PARA O NÚCLEO" : f >= puntT && f < fallAt ? "DISPARO NO ADVISOR" : f >= ggA && f < puntT ? "GRAVITY GUN · PEGA O DESTROÇO" : undefined} msgCol={AMB} />
      <AbsoluteFill style={{ background: "#000", opacity: Math.max(interpolate(f, [0, 8], [1, 0], C), interpolate(f, [HALL - 8, HALL, HALL + 8], [0, 1, 0], C)), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 1:12:36 a agente dentro dela (o crachá com uma segunda camada)
export const HL10Agent: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [talkAt, notJustAt, leftAt, partAt] = ats(p, ["talkAt", "notJustAt", "leftAt", "partAt"]);
  void talkAt;
  const scan = P(f, leftAt - 4, 40);
  const W = 520;
  const H = 640;
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, #12101a 0%, #040306 80%)", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 960 - W / 2 - 220, top: 540 - H / 2, width: W, height: H, borderRadius: 18, overflow: "hidden", border: `3px solid ${ORANGE}`, boxShadow: "0 30px 80px rgba(0,0,0,0.8)" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${staticFile("hl3silh/alyx_badge.jpg")})`, backgroundSize: "cover", backgroundPosition: "50% 28%" }} />
        {/* a camada escondida: o que o G-Man deixou (duotone frio + a maleta) */}
        <div style={{ position: "absolute", inset: 0, clipPath: `inset(0 0 ${100 - scan * 100}% 0)` }}>
          <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${staticFile("hl3silh/alyx_badge.jpg")})`, backgroundSize: "cover", backgroundPosition: "50% 28%", filter: "grayscale(1) contrast(1.4) brightness(0.55) sepia(1) hue-rotate(160deg) saturate(2)" }} />
          <div style={{ position: "absolute", left: "80%", top: "66%", width: 90, height: 250, transform: "translate(-50%, -50%)", opacity: 0.55, WebkitMaskImage: `url(${staticFile("hl3silh/gman_silh.png")})`, maskImage: `url(${staticFile("hl3silh/gman_silh.png")})`, WebkitMaskSize: "100% 100%", maskSize: "100% 100%", background: "#cfe8ff" }} />
        </div>
        {scan > 0 && scan < 1 ? <div style={{ position: "absolute", left: 0, right: 0, top: `${scan * 100}%`, height: 4, background: "#9fe6ff", boxShadow: "0 0 18px #9fe6ff" }} /> : null}
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "12px 16px", background: scan > 0.9 ? "#9fe6ff" : ORANGE, color: "#0a0806", fontFamily: MONO, fontSize: 22, fontWeight: 700, letterSpacing: 5 }}>{scan > 0.9 ? "ALYX VANCE · + AGENTE" : "ALYX VANCE"}</div>
      </div>
      <div style={{ position: "absolute", left: 1090, top: 300, width: 720, fontFamily: MONO }}>
        {f >= notJustAt ? (
          <div style={{ position: "relative", fontSize: 26, letterSpacing: 3, color: "rgba(242,240,247,0.6)", opacity: P(f, notJustAt, 8) }}>
            SÓ LEVOU AS MEMÓRIAS
            <div style={{ position: "absolute", left: -4, right: 300, top: "50%", height: 3, background: RED, transform: `scaleX(${P(f, notJustAt + 8, 8)})`, transformOrigin: "left" }} />
          </div>
        ) : null}
        {f >= leftAt ? <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 56, color: TXT, marginTop: 20, opacity: P(f, leftAt, 8) }}>deixou alguma coisa dentro dela</div> : null}
        {f >= partAt ? (
          <div style={{ marginTop: 26, padding: "14px 18px", border: "1.5px solid #9fe6ff", borderRadius: 10, background: "rgba(8,16,24,0.8)", opacity: P(f, partAt, 8) }}>
            <div style={{ fontSize: 16, letterSpacing: 5, color: "#9fe6ff" }}>UMA PARTE · ADORMECIDA</div>
            <div style={{ fontSize: 24, letterSpacing: 2, color: TXT, marginTop: 6 }}>CRIADA PARA DESPERTAR NO MOMENTO CERTO</div>
          </div>
        ) : null}
      </div>
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life, 6), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 1:12:53 o bloqueio (o muro das memórias)
export const HL10Block: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [walkAt, backAt, sleepAt, ritAt, painAt, imgAt, knowAt, jumpAt] = ats(p, ["walkAt", "backAt", "sleepAt", "ritAt", "painAt", "imgAt", "knowAt", "jumpAt"]);
  void walkAt;
  const crack = P(f, ritAt, 70);
  const blast = P(f, jumpAt, 14);
  const flash = f >= jumpAt && f < jumpAt + 12 ? 1 - (f - jumpAt) / 12 : 0;
  const tiles = Array.from({ length: 48 }).map((_, i) => ({ c: i % 12, r: Math.floor(i / 12), k: i }));
  const chips: [number, string][] = [[painAt, "DORES"], [painAt + 14, "LAPSOS"], [imgAt, "IMAGENS"], [knowAt, "SABER SEM SABER DE ONDE VEM"]];
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, #10121a 0%, #030406 80%)", overflow: "hidden" }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <filter id="blkGlow"><feGaussianBlur stdDeviation="6" /></filter>
        </defs>
        {/* os blocos que vão acendendo deixam vazar as memórias (o pai, o Dog, Xen) */}
        <clipPath id="blkLit">
          {tiles.filter(({ k }) => rnd(k * 7) < crack * 0.7).map(({ c, r, k }) => <rect key={k} x={300 + c * 110 + 4} y={260 + r * 110 + 4} width={92} height={92} rx={4} />)}
        </clipPath>
        {/* o muro: memórias bloqueadas (placas escuras com fragmentos da Alyx atrás) */}
        {tiles.map(({ c, r, k }) => {
          const x = 300 + c * 110;
          const y = 260 + r * 110;
          const fly = blast * (60 + rnd(k) * 400);
          const ang = rnd(k * 3) * Math.PI * 2;
          const lit = rnd(k * 7) < crack * 0.7;
          return (
            <g key={k} transform={`translate(${Math.cos(ang) * fly} ${Math.sin(ang) * fly}) rotate(${blast * (rnd(k * 5) - 0.5) * 120} ${x + 50} ${y + 50})`} opacity={1 - blast * 0.85}>
              <rect x={x} y={y} width={100} height={100} rx={6} fill={lit ? "rgba(77,255,192,0.06)" : "#141820"} stroke={lit ? "#4dffc0" : "#2a303a"} strokeWidth={2} />
            </g>
          );
        })}
        {crack > 0 ? (
          <g clipPath="url(#blkLit)" opacity={0.75 * (1 - blast)}>
            <image href={staticFile("hl3silh/xen_ceu.jpg")} x={300} y={260} width={1320} height={440} preserveAspectRatio="xMidYMid slice" />
            <image href={staticFile("hl3silh/eli_retrato.png")} x={330} y={240} width={420} height={480} preserveAspectRatio="xMidYMid slice" />
            <image href={staticFile("hl3silh/dog_badge.jpg")} x={1180} y={250} width={420} height={460} preserveAspectRatio="xMidYMid meet" />
            <rect x={300} y={260} width={1320} height={440} fill="rgba(77,255,192,0.22)" />
          </g>
        ) : null}
        {/* as rachaduras verdes do ritual: saem do cadeado e se ramificam */}
        <clipPath id="blkWall"><rect x={300} y={260} width={1310} height={430} /></clipPath>
        {f >= ritAt ? (
          <g clipPath="url(#blkWall)" opacity={1 - blast}>
            {Array.from({ length: 9 }).map((_, k) => {
              const a = (k / 9) * Math.PI * 2 + rnd(k * 13) * 0.4;
              let x = 960, y = 500;
              const pts: string[] = [`${x},${y}`];
              const br: string[] = [];
              for (let i = 1; i <= 9; i++) {
                const st = 50 + rnd(k * 17 + i) * 40;
                const aa = a + (rnd(k * 29 + i) - 0.5) * 0.9;
                x += Math.cos(aa) * st; y += Math.sin(aa) * st * 0.7;
                pts.push(`${Math.round(x)},${Math.round(y)}`);
                if (i === 4) br.push(`${Math.round(x)},${Math.round(y)} ${Math.round(x + Math.cos(a + 0.9) * 90)},${Math.round(y + Math.sin(a + 0.9) * 60)} ${Math.round(x + Math.cos(a + 0.6) * 150)},${Math.round(y + Math.sin(a + 0.7) * 110)}`);
              }
              const L = 700;
              const g0 = Math.max(0, Math.min(1, crack * 1.4 - rnd(k * 7) * 0.4));
              return (
                <g key={k}>
                  <polyline points={pts.join(" ")} fill="none" stroke="#4dffc0" strokeWidth={8} opacity={0.35} filter="url(#blkGlow)" strokeDasharray={`${L * g0} ${L}`} />
                  <polyline points={pts.join(" ")} fill="none" stroke="#c8ffe8" strokeWidth={2.2} strokeDasharray={`${L * g0} ${L}`} />
                  {g0 > 0.55 ? br.map((b, j) => <polyline key={j} points={b} fill="none" stroke="#9fffd8" strokeWidth={1.6} opacity={(g0 - 0.55) * 2.2} />) : null}
                </g>
              );
            })}
          </g>
        ) : null}
        {/* o cadeado no meio */}
        <g transform={`translate(960 480) scale(${1 + blast * 0.5})`} opacity={1 - blast}>
          <rect x={-60} y={-20} width={120} height={100} rx={12} fill="#1a1e26" stroke="#9fe6ff" strokeWidth={4} />
          <path d="M -36 -20 v -34 a 36 36 0 0 1 72 0 v 34" fill="none" stroke="#9fe6ff" strokeWidth={8} />
          <circle cx={0} cy={28} r={10} fill="#9fe6ff" />
        </g>
      </svg>
      <div style={{ position: "absolute", left: 300, top: 150, fontFamily: MONO, fontSize: 18, letterSpacing: 6, color: "#9fe6ff", opacity: P(f, 4, 10) }}>
        {f >= sleepAt ? "A AGENTE · ADORMECIDA" : "DEVOLVIDA SEM LEMBRAR"}
      </div>
      {f >= ritAt ? <div style={{ position: "absolute", left: 300, top: 190, fontFamily: MONO, fontSize: 18, letterSpacing: 5, color: "#4dffc0", opacity: P(f, ritAt, 8) }}>O RITUAL DOS VORTIGAUNTS COMEÇA A QUEBRAR O BLOQUEIO</div> : null}
      <div style={{ position: "absolute", left: 300, top: 760, display: "flex", gap: 14, flexWrap: "wrap", width: 1320 }}>
        {chips.filter(([t0]) => f >= t0).map(([t0, txt]) => (
          <div key={txt} style={{ padding: "10px 16px", borderRadius: 8, background: "rgba(8,20,16,0.85)", border: "1.5px solid #4dffc0", fontFamily: MONO, fontSize: 22, letterSpacing: 3, color: "#c8ffe8", opacity: P(f, t0, 8) * (1 - blast * 0.6) }}>{txt}</div>
        ))}
      </div>
      {f >= jumpAt ? <div style={{ position: "absolute", left: 0, right: 0, top: 440, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 84, color: TXT, opacity: P(f, jumpAt + 6, 8) }}>o grande salto</div> : null}
      {flash > 0 ? <AbsoluteFill style={{ background: `rgba(230,255,245,${flash * 0.8})` }} /> : null}
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life, 6), pointerEvents: "none" }} />
      <FilmLook />
      {void backAt}
    </AbsoluteFill>
  );
};

// ================================================================================================= MÓDULO 10 · leva C (1:13:19 → 1:16:50)
// as janelas das outras versões (o que o G-Man mostrou para a Alyx): conteúdo 2D concreto dentro de cada janela
const BADGE = "hl3silh/alyx_badge.jpg";
const CitadelPath = "M 0 0 L 18 -40 L 26 -150 L 34 -230 L 38 -300 L 42 -230 L 50 -150 L 58 -40 L 76 0 Z";
type VKind = "line" | "route" | "win" | "lose" | "union";
const VersionPanel: React.FC<{ f: number; kind: VKind; v: number; title: string; lit?: number }> = ({ f, kind, v, title, lit = 1 }) => {
  const W = 480;
  const H = 300;
  const routes: [number, number][][] = [
    [[40, 250], [120, 210], [230, 220], [330, 150], [400, 120]],
    [[40, 250], [90, 140], [200, 90], [310, 100], [400, 120]],
    [[40, 250], [170, 260], [300, 230], [360, 170], [400, 120]],
  ];
  const head = (col: string) => (
    <div style={{ position: "absolute", left: 0, right: 0, top: 0, padding: "8px 14px", background: "rgba(0,0,0,0.55)", fontFamily: MONO, fontSize: 18, letterSpacing: 4, color: col }}>{title}</div>
  );
  return (
    <div style={{ width: W, height: H, position: "relative", overflow: "hidden", background: "#0a0c10", boxShadow: `inset 0 0 0 3px rgba(220,235,255,${0.25 + 0.35 * lit})`, filter: `brightness(${0.55 + 0.45 * lit})` }}>
      {kind === "line" || kind === "union" ? (
        <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${staticFile(BADGE)})`, backgroundSize: "cover", backgroundPosition: `50% ${20 + v * 10}%`, filter: kind === "union" ? "grayscale(1) contrast(1.3) brightness(0.7) sepia(1) hue-rotate(-30deg) saturate(2.2)" : `grayscale(${0.3 + v * 0.2}) brightness(0.8) hue-rotate(${v * 40}deg)` }} />
      ) : null}
      {kind === "union" ? (
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          <rect x={300} y={60} width={160} height={210} fill="rgba(30,6,6,0.75)" stroke={RED} strokeWidth={2} />
          <IcoComb x={380} y={120} s={1.3} />
          <text x={380} y={200} textAnchor="middle" fill={RED} fontFamily={MONO} fontSize={22} letterSpacing={4}>UNION</text>
          <text x={380} y={232} textAnchor="middle" fill="rgba(255,200,190,0.8)" fontFamily={MONO} fontSize={14} letterSpacing={3}>A. VANCE</text>
        </svg>
      ) : null}
      {kind === "route" ? (
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          <rect width={W} height={H} fill="#0d1a24" />
          {Array.from({ length: 9 }).map((_, i) => <line key={i} x1={0} y1={40 + i * 30} x2={W} y2={40 + i * 30} stroke="rgba(159,230,255,0.08)" />)}
          <path d="M 0 280 Q 120 250 240 270 T 480 255 L 480 300 L 0 300 Z" fill="rgba(159,230,255,0.08)" />
          <path d={pd(routes[v % 3])} fill="none" stroke={AMB} strokeWidth={3} strokeDasharray={`${P(f, 0, 1) * 600} 600`} />
          <circle cx={40} cy={250} r={7} fill={GREEN} />
          <g transform="translate(400 120)">
            <ellipse rx={34} ry={12} fill="rgba(159,230,255,0.15)" stroke={ICE} strokeWidth={2} />
            <rect x={-22} y={-8} width={44} height={10} fill={ICE} opacity={0.7} />
          </g>
          <text x={400} y={156} textAnchor="middle" fill={ICE} fontFamily={MONO} fontSize={14} letterSpacing={3}>BOREALIS</text>
        </svg>
      ) : null}
      {kind === "win" || kind === "lose" ? (
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          <defs>
            <linearGradient id={`vsky${kind}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={kind === "win" ? "#3a5a70" : "#3a0c0a"} />
              <stop offset="1" stopColor={kind === "win" ? "#c8b48a" : "#120404"} />
            </linearGradient>
          </defs>
          <rect width={W} height={H} fill={`url(#vsky${kind})`} />
          {/* a Cidadela: inteira (perde) ou partida ao meio e caindo (vence) */}
          {kind === "lose" ? (
            <g transform="translate(202 280)">
              <path d={CitadelPath} fill="#0c0e12" stroke="rgba(160,200,230,0.5)" strokeWidth={1.5} />
              <circle cx={38} cy={-255} r={4} fill={RED} opacity={0.6 + 0.4 * Math.sin(f / 6)} />
            </g>
          ) : (
            <g transform="translate(202 280)">
              <path d="M 0 0 L 18 -40 L 26 -150 L 76 -150 L 58 -40 L 76 0 Z" fill="#20262c" stroke="rgba(255,240,200,0.5)" strokeWidth={1.5} />
              <g transform="translate(40 -150) rotate(24) translate(-40 150)">
                <path d="M 26 -158 L 34 -230 L 38 -300 L 42 -230 L 50 -158 Z" fill="#20262c" stroke="rgba(255,240,200,0.5)" strokeWidth={1.5} />
              </g>
              {[0, 1, 2, 3].map((k) => <circle key={k} cx={50 + k * 14} cy={-150 - k * 10} r={10 + k * 5} fill="rgba(120,110,100,0.4)" />)}
            </g>
          )}
          <path d="M 0 280 L 90 262 L 160 274 L 330 266 L 480 280 L 480 300 L 0 300 Z" fill="#06070a" />
          {kind === "lose" ? [100, 330, 400].map((x, k) => <IcoComb key={k} x={x} y={240} s={0.6} />) : [80, 360].map((x, k) => <circle key={k} cx={x} cy={248} r={9} fill={GREEN} />)}
        </svg>
      ) : null}
      {head(kind === "lose" || kind === "union" ? RED : kind === "win" ? GREEN : kind === "route" ? AMB : CREAM)}
    </div>
  );
};
type Win = { x: number; y: number; kind: VKind; v: number; title: string; at: number };
export const HL10Lines: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [importAt, tookAt, biggerAt, linearAt, versAt, sawAt, winAt, loseAt, closeAt, notAt, patAt, sameAt, buildAt, missAt, piecesAt, catAt, lockAt, origAt] = ats(p, ["importAt", "tookAt", "biggerAt", "linearAt", "versAt", "sawAt", "winAt", "loseAt", "closeAt", "notAt", "patAt", "sameAt", "buildAt", "missAt", "piecesAt", "catAt", "lockAt", "origAt"]);
  void catAt;
  // os galhos: saem da vida linear em y = 6, abrem em leque e voltam ao MESMO PONTO (o Borealis) em y = 44
  const NB = 7;
  const END: V3 = [0, 44, 0];
  const branch = (b: number, t: number): V3 => {
    const off = (b - (NB - 1) / 2) * 3.4;
    const y = 6 + t * 38;
    const sp = Math.sin(Math.PI * Math.min(1, t * 1.05)) * (1 - Math.max(0, t - 0.8) * 2.5);
    return [off * Math.max(0, sp) + 0.6 * Math.sin(t * 9 + b), y, 0];
  };
  const wins: Win[] = [
    { x: 0, y: 0, kind: "line", v: 0, title: "OUTRA LINHA", at: versAt + 20 },
    { x: 0, y: 0, kind: "line", v: 1, title: "OUTRA ESCOLHA", at: versAt + 40 },
    { x: 0, y: 0, kind: "line", v: 2, title: "OUTRO FUTURO", at: versAt + 60 },
    { x: 0, y: 0, kind: "route", v: 0, title: "ROTA A · BOREALIS", at: sawAt },
    { x: 0, y: 0, kind: "route", v: 1, title: "ROTA B · BOREALIS", at: sawAt + 18 },
    { x: 0, y: 0, kind: "route", v: 2, title: "ROTA C · BOREALIS", at: sawAt + 36 },
    { x: 0, y: 0, kind: "win", v: 0, title: "A HUMANIDADE VENCE", at: winAt },
    { x: 0, y: 0, kind: "lose", v: 0, title: "A HUMANIDADE PERDE", at: loseAt },
    { x: 0, y: 0, kind: "union", v: 0, title: "PRÓXIMA DA UNION", at: closeAt },
  ];
  // onde cada janela fica: em cima de um galho, cada vez mais longe (a câmera vai passando por elas)
  // a câmera anda devagar entre os galhos; cada janela nasce ~6,5 m à frente dela, alternando os lados (a última no centro)
  const walk = (patAt - versAt) / 30;
  const KE: [number, number][] = [[0, -3], [linearAt, -2], [versAt, 1], [patAt, 1 + walk * 0.42], [patAt + 60, 2], [buildAt, 2], [life, 2]];
  wins.forEach((w, i) => {
    w.y = keys(w.at, KE) + 6.5 + (i % 3) * 1.2;
    w.x = i === wins.length - 1 ? 0 : (i % 2 ? 1 : -1) * (2.3 + 0.5 * rnd(i * 3));
  });
  const rise = IOx((f - patAt) / 60);
  const build = IOx((f - buildAt) / 40);
  const ey = keys(f, KE);
  const e: Eye = { x: 0.1 * Math.sin(f / 70), y: ey, z: 1.7 + rise * 22, yaw: 0.04 * Math.sin(f / 90), pitch: keys(f, [[0, -0.12], [versAt, -0.1], [closeAt, -0.08], [patAt, -0.08], [patAt + 60, -0.92], [buildAt, -0.92], [life, -0.92]]), F: 1000 };
  const dark = P(f, lockAt, 20);
  const gm = P(f, tookAt, 20) * (1 - P(f, versAt, 30));
  const AY = 3;
  const bt = (f - buildAt) / 40;
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 40%, #121a22 0%, #05070a 70%, #020304 100%)", overflow: "hidden" }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <defs>
          <filter id="lnGlow"><feGaussianBlur stdDeviation="4" /></filter>
        </defs>
        {/* o chão do vazio: grade que some ao longe */}
        {Array.from({ length: 25 }).map((_, i) => {
          const y = -4 + i * 2.2;
          const a = proj(e, [-30, y, 0]);
          const b = proj(e, [30, y, 0]);
          return a && b ? <line key={`h${i}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="rgba(159,230,255,0.07)" strokeWidth={1} /> : null;
        })}
        {/* a vida linear: uma linha só, saindo dos pés da Alyx */}
        {f >= linearAt ? (() => {
          const a = proj(e, [0, AY, 0]);
          const b = proj(e, [0, AY + P(f, linearAt, 40) * 6, 0]);
          return a && b ? <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={CREAM} strokeWidth={4} opacity={1 - build} /> : null;
        })() : null}
        {/* os galhos: as outras versões */}
        {f >= versAt
          ? Array.from({ length: NB }).map((_, b) => {
              const g0 = P(f, versAt + b * 4, 60);
              const pts: string[] = [];
              for (let i = 0; i <= 40; i++) {
                const t = (i / 40) * (f >= sameAt ? 1 : 0.86) * g0;
                const q = proj(e, branch(b, t));
                if (q) pts.push(`${q.x.toFixed(0)},${q.y.toFixed(0)}`);
              }
              const hot = f >= sameAt;
              return (
                <g key={b} opacity={1 - build * 0.85}>
                  <polyline points={pts.join(" ")} fill="none" stroke={hot ? "#ffd27a" : "#9fe6ff"} strokeWidth={8} opacity={0.25} filter="url(#lnGlow)" />
                  <polyline points={pts.join(" ")} fill="none" stroke={hot ? "#ffe2a0" : "#bfefff"} strokeWidth={2.4} />
                </g>
              );
            })
          : null}
        {/* O PADRÃO: em cada galho, o ponto que muda (vermelho) */}
        {f >= patAt + 40
          ? Array.from({ length: NB }).map((_, b) => {
              const q = proj(e, branch(b, 0.35 + rnd(b * 5) * 0.35));
              return q ? (
                <g key={b} opacity={P(f, patAt + 40 + b * 4, 8) * (1 - build)}>
                  <circle cx={q.x} cy={q.y} r={11} fill="rgba(40,6,6,0.9)" stroke={RED} strokeWidth={2.5} />
                  <text x={q.x} y={q.y + 6} textAnchor="middle" fill={RED} fontFamily={MONO} fontSize={17}>≠</text>
                </g>
              ) : null;
            })
          : null}
        {/* o mesmo ponto: o Borealis no fim de todas as linhas */}
        {f >= sameAt - 10 ? <BorealisHolo e={e} f={f} c={[END[0], END[1] + 1, 0.4]} k={0.5} show={() => P(f, sameAt - 10, 30) * (1 - build)} core={P(f, sameAt + 10, 20) * (1 - build)} rot={Math.PI / 2} /> : null}
        <Call e={e} f={f} pt={branch(3, 0.6)} from={patAt + 50} until={sameAt} text="O QUE MUDA" sub="DE UMA LINHA PARA OUTRA" col={RED} dx={-240} dy={150} />
        <Call e={e} f={f} pt={[END[0], END[1], 0.5]} from={sameAt + 6} until={buildAt} text="O MESMO PONTO" sub="O BOREALIS · O CATALISADOR" col={AMB} dx={280} dy={-60} />
        <FlagAt e={e} pt={[0, AY, 0]} label="ALYX" col={ORANGE} f={f} o={P(f, importAt + 6, 10) * (1 - P(f, versAt + 30, 20))} sub={f >= linearAt ? "A VIDA LINEAR" : f >= tookAt ? "LEVADA PELO G-MAN" : undefined} />
      </svg>
      {/* o G-Man ao longe, no vazio */}
      {gm > 0 ? (() => {
        const b = proj(e, [1.8, 10, 0]);
        const t = proj(e, [1.8, 10, 1.9]);
        if (!b || !t) return null;
        const h = b.y - t.y;
        return (
          <div style={{ position: "absolute", left: b.x - h * 0.185, top: t.y, width: h * 0.37, height: h, opacity: gm, filter: "drop-shadow(0 0 4px rgba(220,240,255,0.6)) drop-shadow(0 0 16px rgba(190,230,240,0.35))" }}>
            <div style={{ position: "absolute", inset: 0, WebkitMaskImage: `url(${staticFile("hl3silh/gman_silh.png")})`, maskImage: `url(${staticFile("hl3silh/gman_silh.png")})`, WebkitMaskSize: "100% 100%", maskSize: "100% 100%", background: "linear-gradient(180deg, #2a3036, #07090b 80%)" }} />
          </div>
        );
      })() : null}
      {/* as janelas: em pé sobre os galhos; quando ele constrói a agente, todas voam para o centro */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {wins.map((w, i) => ({ w, i })).sort((a, b) => b.w.y - a.w.y).map(({ w, i }) => {
          if (f < w.at) return null;
          const up = P(f, w.at, 16);
          const ww = 2.4;
          const hh = 1.5;
          const z0 = 0.4 + hh * up * 0;
          let c: V3 = [w.x, w.y, z0];
          let s = up;
          if (build > 0) {
            // voa para um ponto logo à frente da câmera (vista de cima), encolhendo
            const tgt: V3 = [(i - 4) * 0.25, ey + 6.5, e.z - 8];
            const u = IOx(bt * 1.2 - i * 0.03);
            c = [c[0] + (tgt[0] - c[0]) * u, c[1] + (tgt[1] - c[1]) * u, c[2] + (tgt[2] - c[2]) * u];
            s = up * (1 - u * 0.6);
            if (u >= 0.99) return null;
          }
          const cs: [V3, V3, V3, V3] = [[c[0] - ww / 2 * s, c[1], c[2] + hh * s], [c[0] + ww / 2 * s, c[1], c[2] + hh * s], [c[0] + ww / 2 * s, c[1], c[2]], [c[0] - ww / 2 * s, c[1], c[2]]];
          // de cima, a janela deitaria: depois do PADRÃO elas ficam de frente para a câmera (giram junto)
          const tilt = rise;
          const cs2 = cs.map((v) => [v[0], v[1] - (v[2] - c[2]) * tilt, c[2] + (v[2] - c[2]) * (1 - tilt)] as V3) as [V3, V3, V3, V3];
          return (
            <Pinned key={i} e={e} w={480} h={300} corners={cs2} o={(1 - dark) * Math.min(1, up * 2) * (rise > 0 || build > 0 ? 1 : Math.max(0, Math.min(1, (w.y - ey - 3) / 1.5)))}>
              <VersionPanel f={f - w.at} kind={w.kind} v={w.v} title={w.title} lit={f >= patAt ? 0.6 : 1} />
            </Pinned>
          );
        })}
      </div>
      {/* a agente montada a partir das linhas */}
      {f >= buildAt + 28 ? (() => {
        const a = P(f, buildAt + 28, 16);
        const orig = P(f, origAt, 20);
        return (
          <div style={{ position: "absolute", left: 960 - 190, top: 170, width: 380, height: 480, transform: `scale(${0.8 + 0.2 * a})`, opacity: a }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: 14, overflow: "hidden", border: `3px solid ${orig > 0.5 ? ORANGE : ICE}`, boxShadow: `0 0 40px ${orig > 0.5 ? "rgba(255,140,40,0.35)" : "rgba(159,230,255,0.35)"}` }}>
              <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${staticFile(BADGE)})`, backgroundSize: "cover", backgroundPosition: "50% 28%" }} />
              <div style={{ position: "absolute", inset: 0, opacity: 1 - orig, backgroundImage: `url(${staticFile(BADGE)})`, backgroundSize: "cover", backgroundPosition: "50% 28%", filter: "grayscale(1) contrast(1.4) brightness(0.55) sepia(1) hue-rotate(160deg) saturate(2)" }} />
              <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "10px 14px", background: orig > 0.5 ? ORANGE : ICE, color: "#0a0806", fontFamily: MONO, fontSize: 20, fontWeight: 700, letterSpacing: 4 }}>{orig > 0.5 ? "ALYX VANCE · ORIGINAL" : "A AGENTE · VERSÃO FUNCIONAL"}</div>
              {/* o bloqueio: as correntes e o cadeado por cima */}
              {f >= lockAt ? (
                <svg width={380} height={480} style={{ position: "absolute", inset: 0, opacity: P(f, lockAt, 8) * (1 - P(f, origAt, 16)) }}>
                  <line x1={0} y1={120} x2={380} y2={360} stroke="#9fb4c4" strokeWidth={10} strokeDasharray="22 8" />
                  <line x1={380} y1={120} x2={0} y2={360} stroke="#9fb4c4" strokeWidth={10} strokeDasharray="22 8" />
                  <g transform={`translate(190 250) scale(${1.3 - 0.3 * P(f, lockAt, 8)})`}>
                    <rect x={-46} y={-14} width={92} height={78} rx={10} fill="#1a1e26" stroke={ICE} strokeWidth={4} />
                    <path d="M -28 -14 v -26 a 28 28 0 0 1 56 0 v 26" fill="none" stroke={ICE} strokeWidth={7} />
                  </g>
                </svg>
              ) : null}
            </div>
          </div>
        );
      })() : null}
      {/* a missão da agente */}
      {f >= missAt ? (
        <div style={{ position: "absolute", left: 1240, top: 230, width: 560, padding: "16px 20px", borderRadius: 12, background: "rgba(8,16,24,0.86)", border: `1.5px solid ${ICE}`, fontFamily: MONO, opacity: P(f, missAt, 8) * (1 - P(f, lockAt, 12)) }}>
          <div style={{ fontSize: 15, letterSpacing: 5, color: ICE }}>MISSÃO</div>
          <div style={{ fontSize: 22, letterSpacing: 2, color: TXT, marginTop: 8 }}>▸ LEVAR AS PEÇAS CERTAS ATÉ O BOREALIS</div>
          {f >= piecesAt ? <div style={{ fontSize: 22, letterSpacing: 2, color: TXT, marginTop: 8, opacity: P(f, piecesAt, 8) }}>▸ GARANTIR QUE O PROCEDIMENTO CHEGUE AO CATALISADOR</div> : null}
        </div>
      ) : null}
      {/* as frases do G-Man (o que ele fez) */}
      <div style={{ position: "absolute", left: 110, top: 120, width: 700, fontFamily: MONO }}>
        {f >= biggerAt && f < versAt + 20 ? (
          <div style={{ opacity: P(f, biggerAt, 8) * (1 - P(f, versAt, 20)) }}>
            <div style={{ position: "relative", display: "inline-block", fontSize: 24, letterSpacing: 3, color: "rgba(242,240,247,0.6)" }}>
              APAGAR ALGUMAS MEMÓRIAS
              <div style={{ position: "absolute", left: -4, right: -4, top: "50%", height: 3, background: RED, transform: `scaleX(${P(f, biggerAt + 8, 8)})`, transformOrigin: "left" }} />
            </div>
            <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 48, color: TXT, marginTop: 10, opacity: P(f, biggerAt + 18, 8) }}>algo muito maior</div>
          </div>
        ) : null}
        {f >= versAt && f < notAt ? <div style={{ fontSize: 22, letterSpacing: 4, color: ICE, opacity: P(f, versAt, 10) * (1 - P(f, notAt - 10, 10)) }}>VERSÕES DA PRÓPRIA VIDA</div> : null}
        {f >= notAt && f < patAt + 20 ? (
          <div style={{ position: "relative", display: "inline-block", fontSize: 24, letterSpacing: 3, color: "rgba(242,240,247,0.65)", opacity: P(f, notAt, 8) * (1 - P(f, patAt + 4, 14)) }}>
            TODAS AS ALYX VIRAM A MESMA PESSOA
            <div style={{ position: "absolute", left: -4, right: -4, top: "50%", height: 3, background: RED, transform: `scaleX(${P(f, notAt + 12, 8)})`, transformOrigin: "left" }} />
          </div>
        ) : null}
        {f >= patAt && f < buildAt ? <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 52, color: TXT, opacity: P(f, patAt + 10, 10) * (1 - P(f, buildAt - 10, 10)) }}>conhecer o padrão</div> : null}
      </div>
      {f < tookAt + 10 ? <div style={{ position: "absolute", left: 110, top: 130, fontFamily: MONO, fontSize: 22, letterSpacing: 6, color: ICE, opacity: P(f, importAt, 10) * (1 - P(f, tookAt, 10)) }}>A AGENTE NÃO APARECEU DO NADA</div> : null}
      {f >= tookAt && f < biggerAt + 10 ? <div style={{ position: "absolute", left: 0, right: 0, bottom: 170, textAlign: "center", fontFamily: MONO, fontSize: 22, letterSpacing: 8, color: CREAM, opacity: P(f, tookAt, 10) * (1 - P(f, biggerAt, 10)) }}>O G-MAN LEVOU A ALYX</div> : null}
      {f >= lockAt ? <div style={{ position: "absolute", left: 0, right: 0, bottom: 200, textAlign: "center", fontFamily: MONO, fontSize: 22, letterSpacing: 8, color: f >= origAt ? CREAM : ICE, opacity: P(f, lockAt + 6, 8) }}>{f >= origAt ? "A ALYX ORIGINAL VOLTOU" : "AS MEMÓRIAS · BLOQUEADAS"}</div> : null}
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 1:14:28 as três camadas na mesma pessoa
const Badge: React.FC<{ x: number; y: number; w: number; mode: "orig" | "agent"; label: string; o?: number; rot?: number; glow?: number }> = ({ x, y, w, mode, label, o = 1, rot = 0, glow = 0 }) => {
  const h = w * 1.25;
  const col = mode === "agent" ? ICE : ORANGE;
  return (
    <div style={{ position: "absolute", left: x - w / 2, top: y - h / 2, width: w, height: h, opacity: o, transform: `rotate(${rot}deg)`, borderRadius: 14, overflow: "hidden", border: `3px solid ${col}`, boxShadow: `0 24px 60px rgba(0,0,0,0.7), 0 0 ${30 * glow}px ${col}` }}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${staticFile(BADGE)})`, backgroundSize: "cover", backgroundPosition: "50% 28%", filter: mode === "agent" ? "grayscale(1) contrast(1.4) brightness(0.55) sepia(1) hue-rotate(160deg) saturate(2)" : undefined }} />
      {mode === "agent" ? <div style={{ position: "absolute", left: "80%", top: "64%", width: w * 0.17, height: w * 0.47, transform: "translate(-50%, -50%)", opacity: 0.55, WebkitMaskImage: `url(${staticFile("hl3silh/gman_silh.png")})`, maskImage: `url(${staticFile("hl3silh/gman_silh.png")})`, WebkitMaskSize: "100% 100%", maskSize: "100% 100%", background: "#cfe8ff" }} /> : null}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: `${w * 0.02}px ${w * 0.03}px`, background: col, color: "#0a0806", fontFamily: MONO, fontSize: w * 0.042, fontWeight: 700, letterSpacing: w * 0.008 }}>{label}</div>
    </div>
  );
};
export const HL10Three: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [funcAt, ritAt, lapsAt, neverAt, jumpAt, threeAt, expAt, wokeAt, errAt, knewAt, roleAt, outAt, warAt, routesAt, calcAt, neverAllAt] = ats(p, ["funcAt", "ritAt", "lapsAt", "neverAt", "jumpAt", "threeAt", "expAt", "wokeAt", "errAt", "knewAt", "roleAt", "outAt", "warAt", "routesAt", "calcAt", "neverAllAt"]);
  void funcAt;
  const term = f >= outAt;
  const flash = f >= jumpAt && f < jumpAt + 12 ? 1 - (f - jumpAt) / 12 : 0;
  // fase A: o crachá com a camada adormecida embaixo; o ritual; os lapsos
  const A = f < jumpAt;
  const dorm = 0.35 + 0.25 * Math.sin(f / 9);
  const laps: [VKind, number, string][] = [["union", 0, "PRÓXIMA DA UNION"], ["route", 1, "ROTA B · BOREALIS"], ["lose", 0, "A HUMANIDADE PERDE"]];
  // fase B: as três partes lado a lado → convergem
  const conv = IOx((f - threeAt) / 30);
  const t3 = [jumpAt + 70, jumpAt + 140, jumpAt + 225];
  const xs = [520, 960, 1400].map((x) => x + (960 - x) * conv);
  const mask = IOx((f - knewAt) / 26);
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, #12101a 0%, #040306 80%)", overflow: "hidden" }}>
      {!term && A ? (
        <>
          {/* os Vortigaunts nas bordas, a energia verde chegando ao crachá */}
          {f >= ritAt
            ? [[150, false], [1770, true]].map(([x, fl], k) => (
                <div key={k} style={{ position: "absolute", left: (x as number) - 135, top: 420, width: 270, height: 400, opacity: P(f, ritAt + k * 6, 14), transform: fl ? "scaleX(-1)" : undefined, filter: "drop-shadow(0 0 4px rgba(141,255,168,0.75)) drop-shadow(0 0 14px rgba(141,255,168,0.5))" }}>
                  <div style={{ position: "absolute", inset: 0, WebkitMaskImage: `url(${staticFile("hl3silh/vort_silh.png")})`, maskImage: `url(${staticFile("hl3silh/vort_silh.png")})`, WebkitMaskSize: "100% 100%", maskSize: "100% 100%", background: "linear-gradient(180deg, #2e3a28, #0a0f0a 85%)" }} />
                </div>
              ))
            : null}
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            <defs><filter id="thGlow"><feGaussianBlur stdDeviation="5" /></filter></defs>
            {f >= ritAt + 10
              ? [[260, 560, 760, 520], [1660, 560, 1160, 520]].map(([x1, y1, x2, y2], k) => {
                  const d = `M ${x1} ${y1} C ${x1 + (x2 - x1) * 0.3} ${y1 - 160}, ${x2 - (x2 - x1) * 0.3} ${y2 - 160}, ${x2} ${y2}`;
                  const o = P(f, ritAt + 10 + k * 5, 12);
                  return (
                    <g key={k} opacity={o}>
                      <path d={d} fill="none" stroke="#4dffc0" strokeWidth={12} opacity={0.3} filter="url(#thGlow)" />
                      <path d={d} fill="none" stroke="#c8ffe8" strokeWidth={2.5} strokeDasharray="14 10" strokeDashoffset={-f * 4} />
                    </g>
                  );
                })
              : null}
          </svg>
          <div style={{ position: "absolute", left: 960 - 200, top: 290, width: 400, height: 500 }}>
            {/* a agente adormecida: um segundo crachá escondido atrás do dela; só as bordas aparecem e brilham quando o ritual começa */}
            <Badge x={200 + 34} y={250 + 26} w={400} mode="agent" label="A AGENTE" rot={5} glow={dorm * 0.6 + P(f, ritAt, 40) * 0.8} o={0.95} />
            <Badge x={200} y={250} w={400} mode="orig" label="ALYX VANCE" />
          </div>
          <div style={{ position: "absolute", left: 960 - 200, top: 812, padding: "8px 14px", borderRadius: 8, border: `1.5px solid ${ICE}`, background: "rgba(8,16,24,0.85)", fontFamily: MONO, fontSize: 20, letterSpacing: 3, color: ICE }}>A AGENTE · ESPERANDO O GATILHO</div>
          {/* os lapsos: fotos de coisas que nunca aconteceram com ESTA Alyx */}
          {laps.map(([kind, v, title], k) => {
            const t0 = lapsAt + k * 14;
            if (f < t0) return null;
            const a = P(f, t0, 14);
            const x = 1380 + k * 30;
            const y = 160 + k * 200;
            return (
              <div key={k} style={{ position: "absolute", left: 960 + (x - 960) * a - 240 * 0.62, top: 520 + (y - 520) * a, width: 480, height: 300, transform: `scale(${0.62}) rotate(${(k - 1) * 4}deg)`, transformOrigin: "0 0", opacity: a }}>
                <VersionPanel f={f - t0} kind={kind} v={v} title={title} />
                {f >= neverAt + k * 6 ? (
                  <div style={{ position: "absolute", right: 16, bottom: 18, padding: "6px 12px", border: `4px solid ${RED}`, color: RED, fontFamily: MONO, fontSize: 24, fontWeight: 700, letterSpacing: 3, transform: `rotate(-8deg) scale(${1.4 - 0.4 * P(f, neverAt + k * 6, 6)})`, background: "rgba(20,4,4,0.6)", opacity: P(f, neverAt + k * 6, 6) }}>NUNCA ACONTECEU</div>
                ) : null}
              </div>
            );
          })}
          {f >= neverAt + 20 ? <div style={{ position: "absolute", left: 1330, top: 930, fontFamily: MONO, fontSize: 20, letterSpacing: 4, color: RED, opacity: P(f, neverAt + 20, 8) }}>COM ESTA ALYX</div> : null}
          {f >= lapsAt ? <div style={{ position: "absolute", left: 110, top: 140, fontFamily: MONO, fontSize: 22, letterSpacing: 4, color: "#4dffc0", opacity: P(f, lapsAt, 8) }}>OS LAPSOS NÃO ERAM LEMBRANÇAS ANTIGAS</div> : f >= ritAt ? <div style={{ position: "absolute", left: 110, top: 140, fontFamily: MONO, fontSize: 22, letterSpacing: 4, color: "#4dffc0", opacity: P(f, ritAt, 8) }}>O RITUAL TRAZ DE VOLTA O QUE O G-MAN SEPAROU</div> : null}
        </>
      ) : null}
      {!term && !A ? (
        <>
          {/* as três: a original, as vidas (as janelas), a agente */}
          {f < threeAt + 30 ? (
            <>
              {f >= t3[0] ? <Badge x={xs[0]} y={500} w={340} mode="orig" label="A ALYX ORIGINAL" o={P(f, t3[0], 10) * (1 - conv * 0.9)} rot={-3 * (1 - conv)} /> : null}
              {f >= t3[1] ? (
                <div style={{ position: "absolute", left: xs[1] - 170, top: 500 - 212, width: 340, height: 425, opacity: P(f, t3[1], 10) * (1 - conv * 0.9) }}>
                  {[0, 1, 2].map((k) => (
                    <div key={k} style={{ position: "absolute", left: 0, top: k * 120, width: 480, height: 300, transform: `scale(0.708) rotate(${(k - 1) * 3}deg)`, transformOrigin: "0 0" }}>
                      <VersionPanel f={f} kind={(["line", "route", "win"] as VKind[])[k]} v={k} title={["OUTRA LINHA", "OUTRA ROTA", "OUTRO FUTURO"][k]} />
                    </div>
                  ))}
                  <div style={{ position: "absolute", left: 0, right: 0, bottom: -44, textAlign: "center", fontFamily: MONO, fontSize: 18, letterSpacing: 3, color: CREAM }}>AS VIDAS QUE ELE MOSTROU</div>
                </div>
              ) : null}
              {f >= t3[2] ? <Badge x={xs[2]} y={500} w={340} mode="agent" label="A AGENTE" o={P(f, t3[2], 10) * (1 - conv * 0.9)} rot={3 * (1 - conv)} /> : null}
            </>
          ) : null}
          {f >= threeAt + 20 ? (
            <>
              {/* uma única pessoa: a original por cima, a agente por trás (vira máscara quando ela interpreta o papel) */}
              <Badge x={960 - mask * 300} y={500} w={420} mode="orig" label="ALYX · INTEIRA" o={P(f, threeAt + 20, 10)} glow={P(f, wokeAt, 20)} />
              {f >= knewAt ? <Badge x={960 - mask * 300 + 60 * mask} y={500 - 10 * mask} w={420} mode="agent" label="O PAPEL · A AGENTE" o={0.92 * mask} rot={-4 * mask} /> : null}
            </>
          ) : null}
          {f >= threeAt ? <div style={{ position: "absolute", left: 0, right: 0, top: 120, textAlign: "center", fontFamily: MONO, fontSize: 22, letterSpacing: 8, color: CREAM, opacity: P(f, threeAt, 10) * (1 - P(f, expAt, 10)) }}>AS TRÊS CONVERGIRAM NUMA ÚNICA PESSOA</div> : null}
          {/* o que o G-Man esperava × o que acordou */}
          {f >= expAt && f < knewAt + 10 ? (
            <div style={{ position: "absolute", left: 1260, top: 300, width: 520, padding: "18px 22px", borderRadius: 12, background: "rgba(10,12,16,0.88)", border: "1.5px solid rgba(207,232,255,0.6)", fontFamily: MONO, opacity: P(f, expAt, 8) * (1 - P(f, knewAt, 10)) }}>
              <div style={{ fontSize: 15, letterSpacing: 5, color: "rgba(207,232,255,0.8)" }}>O PLANO DO G-MAN</div>
              <div style={{ fontSize: 22, letterSpacing: 2, color: TXT, marginTop: 10 }}>ESPERADO · ACORDAR A AGENTE</div>
              {f >= wokeAt ? <div style={{ fontSize: 22, letterSpacing: 2, color: ORANGE, marginTop: 8, opacity: P(f, wokeAt, 8) }}>ACORDOU · A ALYX INTEIRA</div> : null}
              {f >= errAt ? <div style={{ display: "inline-block", marginTop: 16, padding: "6px 14px", border: `4px solid ${RED}`, color: RED, fontSize: 28, fontWeight: 700, letterSpacing: 4, transform: `rotate(-6deg) scale(${1.4 - 0.4 * P(f, errAt, 6)})`, opacity: P(f, errAt, 6) }}>O ERRO DELE</div> : null}
            </div>
          ) : null}
          {f >= knewAt ? (
            <div style={{ position: "absolute", left: 1060, top: 300, width: 700, fontFamily: MONO }}>
              {[[knewAt, "COMO A AGENTE DEVIA AGIR", ICE], [knewAt + 50, "O QUE OS ADVISORS ESPERAVAM", VIO], [knewAt + 95, "O QUE O G-MAN ESPERAVA", "#cfe8ff"]].map(([t0, s, c]) =>
                f >= (t0 as number) ? <div key={s as string} style={{ marginTop: 12, padding: "10px 14px", background: "rgba(8,8,12,0.8)", borderLeft: `3px solid ${c}`, fontSize: 22, letterSpacing: 3, color: TXT, opacity: P(f, t0 as number, 8) }}>ELA SABIA · {s as string}</div> : null,
              )}
              {f >= roleAt ? <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 56, color: TXT, marginTop: 26, opacity: P(f, roleAt, 8) }}>interpretou o papel</div> : null}
            </div>
          ) : null}
          {f < t3[0] + 16 ? <div style={{ position: "absolute", left: 0, right: 0, top: 470, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 72, color: TXT, opacity: P(f, jumpAt + 4, 8) * (1 - P(f, t3[0], 14)) }}>tudo voltou de uma vez</div> : null}
          {flash > 0 ? <AbsoluteFill style={{ background: `rgba(230,255,245,${flash * 0.85})` }} /> : null}
        </>
      ) : null}
      {term ? (() => {
        // o terminal Combine: o que a "agente" entregou
        const rows: [number, string, string][] = [
          [outAt + 6, "A. VANCE · SAÍDA DO BOREALIS · COM OS ADVISORS", "OK"],
          [warAt, "COORDENAÇÃO DA GUERRA · ACEITA", "OK"],
          [routesAt, "ROTAS · ENVIADAS", "OK"],
          [calcAt, "CÁLCULOS · ENVIADOS", "OK"],
          [calcAt + 60, "UNIDADES · CONDUZIDAS AO PONTO", "OK"],
        ];
        const pct = f >= neverAllAt ? 87 : Math.min(87, Math.floor(P(f, outAt, (neverAllAt - outAt)) * 87));
        return (
          <AbsoluteFill style={{ background: "#03080b" }}>
            <div style={{ position: "absolute", left: 220, top: 140, width: 1480, height: 800, border: `2px solid rgba(159,230,255,0.5)`, borderRadius: 10, background: "linear-gradient(180deg, rgba(10,28,36,0.9), rgba(4,12,16,0.95))", fontFamily: MONO, color: ICE, padding: "28px 40px", boxSizing: "border-box", opacity: P(f, outAt, 10) }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18, letterSpacing: 6, borderBottom: "1px solid rgba(159,230,255,0.3)", paddingBottom: 12 }}>
                <span>OVERWATCH · CANAL DOS ADVISORS</span>
                <span style={{ color: VIO }}>FONTE · A. VANCE</span>
              </div>
              {rows.map(([t0, s, ok], i) =>
                f >= t0 ? (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 30, letterSpacing: 3, marginTop: 26, color: TXT, opacity: P(f, t0, 6) }}>
                    <span>{s.slice(0, Math.max(0, Math.floor((f - t0) * 2.2)))}</span>
                    <span style={{ color: GREEN, opacity: P(f, t0 + 14, 4) }}>{ok}</span>
                  </div>
                ) : null,
              )}
              <div style={{ position: "absolute", left: 40, right: 40, bottom: 60 }}>
                <div style={{ fontSize: 18, letterSpacing: 5 }}>PACOTE COMPLETO DO PROCEDIMENTO</div>
                <div style={{ position: "relative", height: 30, marginTop: 10, border: "1.5px solid rgba(159,230,255,0.6)" }}>
                  <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${pct}%`, background: "rgba(159,230,255,0.55)" }} />
                  {f >= neverAllAt ? <div style={{ position: "absolute", left: "87%", right: 0, top: 0, bottom: 0, background: `repeating-linear-gradient(45deg, rgba(255,93,77,0.75) 0 10px, rgba(40,6,6,0.9) 10px 20px)`, opacity: P(f, neverAllAt, 8) }} /> : null}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontSize: 26, letterSpacing: 3 }}>
                  <span>{pct}%</span>
                  {f >= neverAllAt ? <span style={{ color: RED, opacity: P(f, neverAllAt, 8) }}>RETIDO · ELA NUNCA ENTREGOU TUDO</span> : null}
                </div>
              </div>
            </div>
          </AbsoluteFill>
        );
      })() : null}
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life, 6), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 1:15:36 o ritmo (na sala de controle do Borealis, atrás do console dela)
const RaceBoard: React.FC<{ f: number; ctrlAt: number; closeAt: number; wrongAt: number; enoughAt: number; pointAt: number }> = ({ f, ctrlAt, closeAt, wrongAt, enoughAt, pointAt }) => {
  const W = 1000;
  const H = 520;
  // o avanço dos Combine (0..1) com os recuos que ela provoca; o Gordon anda sempre no mesmo passo
  const gord = Math.min(0.92, 0.18 + Math.max(0, f - ctrlAt) * 0.0009);
  const back1 = P(f, wrongAt, 20) * 0.14;
  const comb = Math.min(0.9, 0.2 + Math.min(1, Math.max(0, f - ctrlAt) / Math.max(1, closeAt - ctrlAt)) * 0.22 + Math.max(0, f - wrongAt - 30) * 0.0006 - back1 + P(f, enoughAt, 30) * 0.12);
  const fin = P(f, pointAt, 40);
  const cx = comb + (0.86 - comb) * fin;
  const gx = gord + (0.9 - gord) * fin;
  const X = (u: number) => 60 + u * (W - 120);
  const red = f >= wrongAt && f < enoughAt;
  return (
    <div style={{ width: W, height: H, position: "relative", background: "linear-gradient(180deg, rgba(10,28,36,0.95), rgba(4,12,16,0.97))", border: "3px solid rgba(159,230,255,0.5)", fontFamily: MONO, color: ICE, boxSizing: "border-box" }}>
      <div style={{ position: "absolute", left: 30, top: 22, fontSize: 22, letterSpacing: 6 }}>PROCEDIMENTO · CATALISADOR</div>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        {Array.from({ length: 7 }).map((_, i) => {
          const x0 = X(i / 7);
          const cur = Math.floor(cx * 7) === i;
          return (
            <g key={i}>
              <rect x={x0 + 4} y={110} width={(W - 120) / 7 - 8} height={90} fill={cx * 7 > i + 1 ? "rgba(159,230,255,0.35)" : cur ? (red ? "rgba(255,93,77,0.4)" : "rgba(159,230,255,0.18)") : "rgba(159,230,255,0.05)"} stroke={cur && red ? RED : "rgba(159,230,255,0.5)"} strokeWidth={2} />
              <text x={x0 + (W - 120) / 14} y={165} textAnchor="middle" fill={TXT} fontFamily={MONO} fontSize={22}>{`ETAPA ${i + 1}`}</text>
            </g>
          );
        })}
        {/* o cursor dos Combine */}
        <line x1={X(cx)} y1={96} x2={X(cx)} y2={214} stroke={VIO} strokeWidth={4} />
        <IcoComb x={X(cx)} y={82} s={0.6} col={VIO} />
        {/* a trilha do Gordon até o núcleo */}
        <line x1={X(0)} y1={330} x2={X(1)} y2={330} stroke="rgba(255,178,46,0.4)" strokeWidth={3} strokeDasharray="10 8" />
        <circle cx={X(gx)} cy={330} r={14} fill="rgba(30,18,4,0.9)" stroke={AMB} strokeWidth={3} />
        <text x={X(gx)} y={336} textAnchor="middle" fill={AMB} fontFamily={MONO} fontSize={16}>λ</text>
        <text x={X(0)} y={300} fill={AMB} fontFamily={MONO} fontSize={18} letterSpacing={3}>GORDON · ATÉ O NÚCLEO</text>
        {/* o ponto certo: a linha onde os dois têm que chegar juntos */}
        {f >= pointAt ? (
          <g opacity={P(f, pointAt, 10)}>
            <line x1={X(0.88)} y1={90} x2={X(0.88)} y2={360} stroke="#ffd27a" strokeWidth={3} strokeDasharray="6 6" />
            <text x={X(0.88)} y={392} textAnchor="middle" fill="#ffd27a" fontFamily={MONO} fontSize={18} letterSpacing={3}>O PONTO CERTO</text>
          </g>
        ) : null}
      </svg>
      {red ? (
        <div style={{ position: "absolute", left: 30, bottom: 26, display: "flex", gap: 12 }}>
          {[[wrongAt, "CICLO LIGEIRAMENTE ERRADO"], [wrongAt + 50, "REPETIR ETAPA"], [wrongAt + 90, "RECALIBRAR"], [wrongAt + 125, "TEMPO PERDIDO"]].map(([t0, s]) =>
            f >= (t0 as number) ? <div key={s as string} style={{ padding: "8px 12px", border: `1.5px solid ${RED}`, color: RED, fontSize: 18, letterSpacing: 2, background: "rgba(30,6,6,0.6)", opacity: P(f, t0 as number, 6) }}>{s as string}</div> : null,
          )}
        </div>
      ) : f >= enoughAt && f < pointAt ? (
        <div style={{ position: "absolute", left: 30, bottom: 26, padding: "8px 12px", border: `1.5px solid ${GREEN}`, color: GREEN, fontSize: 18, letterSpacing: 2, opacity: P(f, enoughAt, 6) }}>INFORMAÇÃO SUFICIENTE PARA CONTINUAR</div>
      ) : f >= pointAt ? (
        <div style={{ position: "absolute", left: 30, bottom: 26, padding: "8px 12px", border: `1.5px solid ${AMB}`, color: AMB, fontSize: 18, letterSpacing: 2, opacity: P(f, pointAt + 20, 6) }}>NUNCA ANTES DO GORDON</div>
      ) : null}
    </div>
  );
};
const WarBoard: React.FC<{ f: number; troopsAt: number; posAt: number; eliAt: number; aliveAt: number; over: number }> = ({ f, troopsAt, posAt, eliAt, aliveAt, over }) => {
  // 11/10 (pedido dele: mapa sem sentido, coisa apontando para nada): um mapa tático simples e legível — a linha de frente
  // no meio; a Resistência (verde) à esquerda; três esquadrões Combine (vermelho, com nome) à direita. Cada seta sai de um
  // esquadrão e termina na posição para onde ele RECUOU (o ícone anda junto); os dois postos Combine da frente ficam
  // vazios ("ABANDONADO"); o Eli no meio dos seus, os tiros passando ao lado.
  const W = 1000;
  const H = 560;
  const FRONT = 560;
  const res: [number, number, string][] = [[200, 220, ""], [420, 250, ""], [180, 450, ""], [430, 430, ""], [300, 470, ""]];
  const sq: [number, number, number, number, string][] = [[650, 200, 860, 190, "ESQUADRÃO 1"], [660, 320, 880, 320, "ESQUADRÃO 2"], [650, 440, 860, 450, "ESQUADRÃO 3"]];
  const posts: [number, number, string][] = [[610, 262, "POSTO 7"], [610, 384, "POSTO 9"]];
  const ELI: [number, number] = [330, 330];
  const ret = P(f, troopsAt, 40);
  const ico = (x: number, y: number, col: string) => (
    <g transform={`translate(${x} ${y})`}>
      <polygon points="0,-15 13,-7.5 13,7.5 0,15 -13,7.5 -13,-7.5" fill="rgba(30,6,6,0.95)" stroke={col} strokeWidth={2.5} />
      <path d="M -6 -6 L 6 -6 L 6 -2 L -2 -2 L -2 2 L 6 2 L 6 6 L -6 6 Z" fill={col} />
    </g>
  );
  return (
    <div style={{ width: W, height: H, position: "relative", background: "linear-gradient(180deg, rgba(10,28,36,0.95), rgba(4,12,16,0.97))", border: `3px solid ${over > 0.5 ? RED : "rgba(159,230,255,0.5)"}`, fontFamily: MONO, color: ICE, boxSizing: "border-box", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 30, top: 18, fontSize: 22, letterSpacing: 6 }}>A GUERRA · SOB COORDENAÇÃO DE A. VANCE</div>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        {Array.from({ length: 10 }).map((_, i) => <line key={i} x1={i * 100} y1={70} x2={i * 100} y2={H} stroke="rgba(159,230,255,0.06)" />)}
        {Array.from({ length: 5 }).map((_, i) => <line key={"h" + i} x1={0} y1={90 + i * 100} x2={W} y2={90 + i * 100} stroke="rgba(159,230,255,0.06)" />)}
        {/* a linha de frente */}
        <line x1={FRONT} y1={70} x2={FRONT} y2={H - 20} stroke="rgba(242,240,247,0.35)" strokeWidth={2} strokeDasharray="10 8" />
        <text x={FRONT} y={88} textAnchor="middle" fill="rgba(242,240,247,0.6)" fontFamily={MONO} fontSize={14} letterSpacing={4}>LINHA DE FRENTE</text>
        <text x={40} y={118} fill={GREEN} fontFamily={MONO} fontSize={16} letterSpacing={4}>RESISTÊNCIA</text>
        <text x={W - 40} y={118} textAnchor="end" fill={RED} fontFamily={MONO} fontSize={16} letterSpacing={4}>COMBINE</text>
        {res.map(([x, y], k) => (
          <g key={k}>
            {f >= aliveAt ? <circle cx={x} cy={y} r={14 + 10 * (((f - aliveAt) / 30 + k / 5) % 1)} fill="none" stroke={GREEN} strokeWidth={2} opacity={1 - (((f - aliveAt) / 30 + k / 5) % 1)} /> : null}
            <circle cx={x} cy={y} r={11} fill="rgba(6,30,12,0.9)" stroke={GREEN} strokeWidth={2.5} />
          </g>
        ))}
        {/* os esquadrões: avançavam até a frente… e recuam (a seta vai do lugar de onde saíram até onde param) */}
        {sq.map(([x0, y0, x1, y1, name], k) => {
          const x = x0 + (x1 - x0) * ret, y = y0 + (y1 - y0) * ret;
          return (
            <g key={k}>
              {f >= troopsAt ? (
                <g opacity={P(f, troopsAt, 8)}>
                  <line x1={x0} y1={y0} x2={x - 18} y2={y} stroke={RED} strokeWidth={3} strokeDasharray="8 6" />
                  <circle cx={x0} cy={y0} r={5} fill={RED} />
                </g>
              ) : null}
              {ico(x, y, RED)}
              <text x={x} y={y - 24} textAnchor="middle" fill={RED} fontFamily={MONO} fontSize={14} letterSpacing={2}>{name}</text>
              {f >= troopsAt + 30 ? <text x={x} y={y + 34} textAnchor="middle" fill="rgba(255,150,130,0.9)" fontFamily={MONO} fontSize={13} letterSpacing={2} opacity={P(f, troopsAt + 30, 8)}>RECUOU</text> : null}
            </g>
          );
        })}
        {f >= troopsAt + 10 ? <text x={W - 30} y={540} textAnchor="end" fill={RED} fontFamily={MONO} fontSize={18} letterSpacing={3} opacity={P(f, troopsAt + 10, 8)}>RECUARAM · PODIAM VENCER</text> : null}
        {/* os postos da frente: abandonados na hora errada */}
        {posts.map(([x, y, name], k) => {
          const ab = P(f, posAt + k * 10, 10);
          return (
            <g key={k}>
              <rect x={x - 18} y={y - 18} width={36} height={36} fill={ab > 0.5 ? "rgba(40,10,10,0.3)" : "rgba(40,10,10,0.9)"} stroke={RED} strokeWidth={2} strokeDasharray={ab > 0.5 ? "4 4" : undefined} />
              <text x={x} y={y - 26} textAnchor="middle" fill="rgba(255,150,130,0.9)" fontFamily={MONO} fontSize={13} letterSpacing={2}>{name}</text>
              {ab > 0 ? <text x={x} y={y + 38} textAnchor="middle" fill={RED} fontFamily={MONO} fontSize={14} letterSpacing={2} opacity={ab}>ABANDONADO</text> : null}
            </g>
          );
        })}
        {/* o Eli entre os seus: os tiros vêm do lado Combine e passam ao lado */}
        {f >= eliAt ? (
          <g opacity={P(f, eliAt, 8)}>
            {[[-40, -60], [50, -50], [-50, 55], [45, 60]].map(([dx, dy], k) => {
              const t = P(f, eliAt + 8 + k * 7, 10);
              const sx = FRONT + 20, sy = ELI[1] + dy * 1.4;
              return <line key={k} x1={sx} y1={sy} x2={sx + (ELI[0] + dx - sx) * t} y2={sy + (ELI[1] + dy - sy) * t} stroke={RED} strokeWidth={2} strokeDasharray="6 5" />;
            })}
            <circle cx={ELI[0]} cy={ELI[1]} r={30} fill="none" stroke={GREEN} strokeWidth={2} strokeDasharray="4 5" />
            <image href={staticFile("hl3silh/eli_retrato.png")} x={ELI[0] - 22} y={ELI[1] - 22} width={44} height={44} clipPath="url(#wbEli)" />
            <clipPath id="wbEli"><circle cx={ELI[0]} cy={ELI[1]} r={22} /></clipPath>
            <circle cx={ELI[0]} cy={ELI[1]} r={22} fill="none" stroke={ORANGE} strokeWidth={2.5} />
            <text x={ELI[0] - 40} y={ELI[1] - 6} textAnchor="end" fill={ORANGE} fontFamily={MONO} fontSize={16} letterSpacing={3}>ELI</text>
            <text x={ELI[0] - 40} y={ELI[1] + 16} textAnchor="end" fill={ORANGE} fontFamily={MONO} fontSize={13} letterSpacing={2}>NUNCA ATINGIDO</text>
          </g>
        ) : null}
        {f >= aliveAt ? <text x={30} y={540} fill={GREEN} fontFamily={MONO} fontSize={18} letterSpacing={4} opacity={P(f, aliveAt, 8)}>TODOS VIVOS · TEMPO SUFICIENTE</text> : null}
      </svg>
    </div>
  );
};
export const HL10Rhythm: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [needAt, equipAt, resAt, advAt, ctrlAt, closeAt, wrongAt, enoughAt, pointAt, warAt, troopsAt, posAt, eliAt, aliveAt, overAt] = ats(p, ["needAt", "equipAt", "resAt", "advAt", "ctrlAt", "closeAt", "wrongAt", "enoughAt", "pointAt", "warAt", "troopsAt", "posAt", "eliAt", "aliveAt", "overAt"]);
  const G = useMemo(() => buildGlassRoom(), []);
  const over = P(f, overAt, 20);
  // 12/10 (pedido dele: poluído, a Alyx atrás do Advisor, informação demais): planta pensada. A Alyx no console do fundo à
  // direita (2, 11), o Advisor sobre a mesa holográfica, à esquerda (−1,3; 10,2), virado para ela — os dois separados no
  // quadro. Os painéis ficam um de cada lado, longe o bastante para a câmera ver UM por vez, sem a Alyx e o Advisor juntos.
  const yaw = keys(f, [[0, 0.0], [ctrlAt - 4, 0.0], [ctrlAt + 24, 1.12], [warAt - 4, 1.12], [warAt + 30, -1.12], [overAt - 4, -1.12], [overAt + 30, 0.0], [life, 0.0]]);
  const e: Eye = { x: 0.3 + 0.04 * Math.sin(f / 60), y: 5.0, z: 1.7, yaw, pitch: keys(f, [[0, -0.05], [ctrlAt + 24, 0.0], [overAt + 30, -0.04]]), F: 1000 };
  const isFar = (fc: XF) => fc.p.every((q) => q[1] >= 15.85);
  const live = G.map((fc) => (fc.tag === "col" ? { ...fc, col: (over > 0.5 ? [150, 40, 30] : [30, 96, 116]) as RGB, emit: 0.12 + 0.06 * Math.sin(f / (over > 0.5 ? 3 : 6)) } : fc));
  const lights: XL[] = [{ x: 0, y: 10, z: 2.6, col: over > 0.5 ? [255, 60, 40] : [90, 220, 240], k: 0.7, r: 9 }, { x: 0, y: 4, z: 3, col: [120, 130, 150], k: 0.25, r: 7 }];
  // anéis de energia subindo pela coluna do procedimento (mais rápidos quando eles terminam sem ela)
  const rings = Array.from({ length: 3 }).map((_, k) => {
    const ph = (f / (over > 0.5 ? 14 : 40) + k / 3) % 1;
    const z = 0.2 + ph * 3.2;
    const a = proj(e, [-0.55, 10, z]);
    const b = proj(e, [0.55, 10, z]);
    if (z > 1.9) return null;
    return a && b ? <ellipse key={k} cx={(a.x + b.x) / 2} cy={a.y} rx={Math.abs(b.x - a.x) / 2 + 4} ry={Math.max(3, Math.abs(b.x - a.x) * 0.12)} fill="none" stroke={over > 0.5 ? "#ff7a5a" : "#9fe6ff"} strokeWidth={2} opacity={0.8 * Math.sin(ph * Math.PI)} /> : null;
  });
  const ALYX: V3 = [2.0, 10.25, 0.15];
  const ADV: V3 = [-1.3, 10.2, 2.35];
  const advP = proj(e, ADV);
  const AS = useAdvScene([{ pos: ADV, look: [ALYX[0], ALYX[1], 1.5], reach: f >= ctrlAt && f < overAt ? 0.35 : 0.1 }], f, 2.0);
  // as duas telas de vidro da sala, em pé, viradas para quem está atrás do console dela (direita: o ritmo · esquerda: a guerra)
  const screenAt = (sx: number, w: number, h: number): [V3, V3, V3, V3] => {
    const dx = sx * Math.sin(1.12);
    const dy = Math.cos(1.12);
    const c: V3 = [0.3 + dx * 3.5, 5.0 + dy * 3.5, 2.0];
    const r: [number, number] = [dy, -dx];
    return [[c[0] - r[0] * w / 2, c[1] - r[1] * w / 2, c[2] + h / 2], [c[0] + r[0] * w / 2, c[1] + r[1] * w / 2, c[2] + h / 2], [c[0] + r[0] * w / 2, c[1] + r[1] * w / 2, c[2] - h / 2], [c[0] - r[0] * w / 2, c[1] - r[1] * w / 2, c[2] - h / 2]];
  };
  const R = screenAt(1, 3.9, 2.03);
  const L = screenAt(-1, 3.9, 2.18);
  return (
    <AbsoluteFill style={{ background: "#020304", overflow: "hidden" }}>
      <XView e={e} faces={live.filter(isFar)} lights={lights} flash={0.4} amb={0.14} />
      <XView e={e} faces={live.filter((fc) => !isFar(fc))} lights={lights} flash={0.4} amb={0.14} extras={AS.extras} glLights={AS.lights} />
      <ConsoleScreens e={e} f={f} alert={over > 0.5} quads={[[-3.6, 8], [3.6, 8], [-2, 11], [2, 11]].map(([x, y]) => [[x - 0.68, y + 0.16, 1.52], [x + 0.68, y + 0.16, 1.52], [x + 0.68, y - 0.31, 1.04], [x - 0.68, y - 0.31, 1.04]] as [V3, V3, V3, V3])} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>{rings}</svg>
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <Pinned e={e} w={1000} h={520} corners={R}>
          <RaceBoard f={f} ctrlAt={ctrlAt} closeAt={closeAt} wrongAt={wrongAt} enoughAt={enoughAt} pointAt={pointAt} />
        </Pinned>
        <Pinned e={e} w={1000} h={560} corners={L}>
          <WarBoard f={f} troopsAt={troopsAt} posAt={posAt} eliAt={eliAt} aliveAt={aliveAt} over={over} />
        </Pinned>
      </div>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {advP && !AS.ready ? <AdvisorArt x={advP.x} y={advP.y} w={Math.min(420, 1300 / advP.d)} f={f} lit={0.8} id="rhy" /> : null}
        <FlagAt e={e} pt={ALYX} label="ALYX" col={ORANGE} f={f} o={1 - over} />
        {/* uma chamada por vez (cada uma sai quando a próxima entra) */}
        <Call e={e} f={f} pt={[3.6, 7.6, 1.0]} from={equipAt} until={Math.min(resAt, ctrlAt)} text="OS EQUIPAMENTOS" col={ICE} dx={-60} dy={-260} />
        <Call e={e} f={f} pt={[-2, 11.4, 1.6]} from={resAt} until={Math.min(advAt, ctrlAt)} text="DÉCADAS DE PESQUISA" col={ICE} dx={-200} dy={-200} />
        <Call e={e} f={f} pt={[0, 10, 0.9]} from={advAt} until={ctrlAt} text="O PROCEDIMENTO AVANÇANDO" col={ICE} dx={120} dy={240} />
        {over > 0 ? <Call e={e} f={f} pt={[2.0, 10.6, 1.3]} from={overAt + 30} until={life} text="O CONSOLE DELA · VAZIO" sub="VÃO TERMINAR SEM ELA" col={RED} dx={200} dy={-200} /> : null}
      </svg>
      {f >= needAt && f < ctrlAt + 10 ? <div style={{ position: "absolute", left: 110, top: 150, fontFamily: MONO, fontSize: 22, letterSpacing: 4, color: CREAM, opacity: P(f, needAt, 8) * (1 - P(f, ctrlAt, 10)) }}>ELA PRECISAVA DOS COMBINE</div> : null}
      {f >= overAt ? (
        <div style={{ position: "absolute", left: 110, top: 140, padding: "14px 18px", borderRadius: 12, background: "rgba(20,4,4,0.85)", border: `1.5px solid ${RED}`, fontFamily: MONO, opacity: P(f, overAt + 6, 8) }}>
          <div style={{ fontSize: 15, letterSpacing: 5, color: RED }}>O DISFARCE ACABOU</div>
          <div style={{ fontSize: 22, letterSpacing: 2, color: TXT, marginTop: 6 }}>OS ADVISORS PERCEBERAM</div>
        </div>
      ) : null}
      <Hud f={f} yaw={e.yaw} eye={e} blips={[{ x: 2.0, y: 10.25 }]} msg={f < needAt ? "BOREALIS · SALA DE CONTROLE" : f >= ctrlAt && f < closeAt + 20 ? "ELA CONTROLA O RITMO" : f >= warAt && f < troopsAt + 10 ? "ISSO EXPLICA A GUERRA" : undefined} msgCol={AMB} />
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 1:16:30 para o núcleo (POV correndo atrás da Alyx)
export const HL10CoreRun: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [timeAt, goAt, sameAt, againAt, qAt, q2At, q3At] = ats(p, ["timeAt", "goAt", "sameAt", "againAt", "qAt", "q2At", "q3At"]);
  void timeAt;
  void againAt;
  const G = useMemo(() => buildShipHall2(CORE_HALL).concat(blastDoor(0)), []);
  const run = P(f, goAt, 16);
  const y = 2 + Math.max(0, f - goAt) * 0.055 * run;
  const e: Eye = { x: 0.1 * Math.sin(f / 13) * run, y, z: 1.65 + Math.abs(Math.sin(f / 4.5)) * 0.05 * run, yaw: 0.02 * Math.sin(f / 37), pitch: -0.02, F: 960 };
  // 11/10: uma luz por luminária (poças de luz no chão e nas paredes) + o brilho do núcleo no fundo
  const lamps: XL[] = Array.from({ length: 22 }).map((_, i) => 1.5 + i * 3).filter((ly) => ly > y - 3 && ly < y + 18).map((ly) => ({ x: 0, y: ly, z: 2.9, col: [255, 232, 196] as RGB, k: 1.0, r: 4.6 }));
  const lights: XL[] = [...lamps, { x: 0, y: CORE_HALL - 1, z: 1.5, col: [255, 150, 50], k: 0.6, r: 8 }];
  const ay = y + 3.2;
  // 11/10 (pedido dele: a silhueta do G-Man no corredor ficou mal feita): fica só na fala
  const gm = 0 * P(f, q3At + 6, 20);
  return (
    <AbsoluteFill style={{ background: "#020304", overflow: "hidden" }}>
      <XView e={e} faces={G} lights={lights} flash={0.35} amb={0.13} seam="rgba(0,0,0,0.18)" gl smooth />
      {/* no fim do corredor, contra a luz do núcleo: a sombra do G-Man */}
      {gm > 0 ? (() => {
        const b = proj(e, [0.2, 41, 0]);
        const t = proj(e, [0.2, 41, 1.9]);
        if (!b || !t) return null;
        const h = b.y - t.y;
        return (
          <div style={{ position: "absolute", left: b.x - h * 0.185, top: t.y, width: h * 0.37, height: h, opacity: gm, filter: "drop-shadow(0 0 3px rgba(255,200,140,0.7)) drop-shadow(0 0 12px rgba(255,170,90,0.45))" }}>
            <div style={{ position: "absolute", inset: 0, WebkitMaskImage: `url(${staticFile("hl3silh/gman_silh.png")})`, maskImage: `url(${staticFile("hl3silh/gman_silh.png")})`, WebkitMaskSize: "100% 100%", maskSize: "100% 100%", background: "linear-gradient(180deg, #1a1612, #050404 80%)" }} />
          </div>
        );
      })() : null}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {(() => {
          const q = proj(e, [0, CORE_HALL - 0.4, 1.4]);
          return q ? (
            <g opacity={0.9}>
              <circle cx={q.x} cy={q.y} r={16 + 3 * Math.sin(f / 5)} fill="none" stroke={AMB} strokeWidth={2.5} />
              <text x={q.x} y={q.y - 30} textAnchor="middle" fill={AMB} fontFamily={MONO} fontSize={18} letterSpacing={4}>O NÚCLEO</text>
            </g>
          ) : null;
        })()}
        <FlagAt e={e} pt={[0.7, ay, 0]} label="ALYX" col={ORANGE} f={f} sub={f >= sameAt ? "DO MESMO LADO" : f >= goAt ? "ARMADA" : "POUCO TEMPO"} />
      </svg>
      {f >= qAt ? (
        <div style={{ position: "absolute", left: 110, top: 150, width: 820, fontFamily: MONO }}>
          <div style={{ position: "relative", display: "inline-block", fontSize: 26, letterSpacing: 3, color: "rgba(242,240,247,0.6)", opacity: P(f, qAt, 8) }}>
            ? A ALYX TRAIU A RESISTÊNCIA
            <div style={{ position: "absolute", left: -4, right: -4, top: "50%", height: 3, background: RED, transform: `scaleX(${P(f, qAt + 30, 8)})`, transformOrigin: "left" }} />
          </div>
          {f >= q2At ? <div style={{ marginTop: 18, padding: "12px 16px", background: "rgba(10,8,2,0.82)", borderLeft: `3px solid ${AMB}`, fontSize: 26, letterSpacing: 2, color: TXT, opacity: P(f, q2At, 8) }}>? O QUE ELA VAI FAZER NO NÚCLEO</div> : null}
          {f >= q3At ? <div style={{ marginTop: 12, padding: "12px 16px", background: "rgba(10,10,14,0.82)", borderLeft: "3px solid #cfe8ff", fontSize: 26, letterSpacing: 2, color: TXT, opacity: P(f, q3At, 8) }}>? POR QUE O G-MAN PRECISAVA QUE TUDO CHEGASSE AQUI</div> : null}
        </div>
      ) : null}
      {f >= goAt && f < qAt ? <div style={{ position: "absolute", left: 110, top: 150, padding: "14px 22px", background: "rgba(10,8,2,0.72)", border: `1.5px solid ${AMB}`, borderRadius: 10, fontFamily: MONO, color: AMB, opacity: P(f, goAt, 10) * (1 - P(f, qAt - 8, 8)) }}><div style={{ fontSize: 15, letterSpacing: 5, opacity: 0.8 }}>OBJETIVO</div><div style={{ fontSize: 28, letterSpacing: 3, marginTop: 6 }}>CHEGAR AO NÚCLEO</div></div> : null}
      <Hud f={f} yaw={e.yaw} eye={e} blips={[{ x: 0.7, y: ay }]} msg={f >= sameAt && f < qAt ? "LUTANDO DO MESMO LADO DE NOVO" : undefined} msgCol={AMB} />
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ================================================================================================= MÓDULO 11 (1:16:50 → 1:19:27)
// o núcleo (esfera dourada) e a ferida (rachadura laranja no fundo do poço), na mesma linguagem dos módulos 9/10
const CoreOrb: React.FC<{ e: Eye; f: number; c: V3; R: number; o?: number; hot?: number; id: string }> = ({ e, f, c, R, o = 1, hot = 0, id }) => {
  const q = proj(e, c);
  if (!q || o <= 0) return null;
  const r = (R * e.F) / q.d;
  const pul = 1 + 0.03 * Math.sin(f / 5) + hot * 0.06 * Math.sin(f / 2);
  return (
    <g opacity={o}>
      <defs>
        <radialGradient id={`orb${id}`} cx="0.42" cy="0.38" r="0.62">
          <stop offset="0" stopColor="#fffaf0" />
          <stop offset="0.35" stopColor="#ffe2a0" />
          <stop offset="0.75" stopColor="#ffb84a" />
          <stop offset="1" stopColor="#c2701c" />
        </radialGradient>
        <radialGradient id={`orbh${id}`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0.45" stopColor="rgba(255,210,122,0.45)" />
          <stop offset="1" stopColor="rgba(255,210,122,0)" />
        </radialGradient>
      </defs>
      <circle cx={q.x} cy={q.y} r={r * (2.3 + hot * 0.6) * pul} fill={`url(#orbh${id})`} />
      <circle cx={q.x} cy={q.y} r={r * pul} fill={`url(#orb${id})`} />
      {/* faixas de energia girando na superfície */}
      {[0, 1, 2].map((k) => (
        <ellipse key={k} cx={q.x} cy={q.y} rx={r * pul * 0.98} ry={r * pul * (0.25 + 0.2 * Math.sin(f / 30 + k * 2))} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={1.4} transform={`rotate(${f * 0.6 + k * 60} ${q.x} ${q.y})`} />
      ))}
    </g>
  );
};
export const PIT_Z = -2.2;
export const CORE: V3 = [0, 13, 3.0];
const WOUND: [number, number][] = [[-7.5, 15.6], [-5.8, 14.9], [-4.2, 15.4], [-2.6, 14.7], [-1.2, 15.3], [0, 14.8], [1.3, 15.4], [2.8, 14.6], [4.1, 15.3], [5.6, 14.8], [7.5, 15.5]];
export const buildCoreRoom = (mech = false): XF[] => {
  const g = mk();
  // 11/10 (pedido dele: a câmara do núcleo horrorosa — caixa lisa): o poço do núcleo planejado. Planta octogonal
  // (retângulo 18 × 20 m com cantos chanfrados de 3 m), do fundo do poço (z = PIT_Z) até o teto (z = 10). Paredes em
  // painéis com pilastras a cada 2 m; uma passarela de serviço contornando as paredes a z = 4 (com guarda-corpo);
  // faixas de luz; no teto, o anel de onde descem os três braços que seguram o núcleo. No fundo do poço, a ferida é
  // uma rachadura de luz no próprio piso (faces acesas), não um desenho por cima. A entrada (laje, ponte, plataforma)
  // fica onde sempre esteve, então todas as cenas da câmara continuam batendo.
  const OCT: [number, number][] = [[-9, 0], [-9, 17], [-6, 20], [6, 20], [9, 17], [9, 0]];
  const ZT = 10;
  const wallC: RGB = [46, 50, 56];
  const wallD: RGB = [34, 37, 42];
  for (let i = 0; i < OCT.length - 1; i++) {
    const [ax, ay] = OCT[i], [bx, by] = OCT[i + 1];
    const L = Math.hypot(bx - ax, by - ay);
    const nx = (by - ay) / L, ny = -(bx - ax) / L; // normal para dentro (sentido horário em planta)
    const n: V3 = [nx, ny, 0];
    const steps = Math.max(1, Math.round(L / 2));
    for (let s = 0; s < steps; s++) {
      const t0 = s / steps, t1 = (s + 1) / steps;
      const x0 = ax + (bx - ax) * t0, y0 = ay + (by - ay) * t0, x1 = ax + (bx - ax) * t1, y1 = ay + (by - ay) * t1;
      // faixas: base escura do poço, painel, faixa da passarela, painel alto, cimalha
      const bands: [number, number, RGB][] = [[PIT_Z, -0.6, wallD], [-0.6, 3.6, wallC], [3.6, 4.4, wallD], [4.4, 8.6, [42, 46, 52]], [8.6, ZT, wallD]];
      bands.forEach(([za, zb, c]) => {
        const k = s % 2 ? 1 : 0.94;
        g.quad([x0, y0, za], [x1, y1, za], [x1, y1, zb], [x0, y0, zb], [c[0] * k, c[1] * k, c[2] * k], n);
      });
      // pilastra na junta (de cima a baixo), saindo 0,2 m da parede: frente + dois lados
      const tx = (bx - ax) / L, ty = (by - ay) / L;
      const P0: V3 = [x0 - tx * 0.18, y0 - ty * 0.18, 0], P1: V3 = [x0 + tx * 0.18, y0 + ty * 0.18, 0];
      const off = (q: V3, z: number, d: number): V3 => [q[0] + nx * d, q[1] + ny * d, z];
      g.quad(off(P0, PIT_Z, 0.2), off(P1, PIT_Z, 0.2), off(P1, ZT, 0.2), off(P0, ZT, 0.2), [30, 33, 37], n);
      g.quad(off(P0, PIT_Z, 0), off(P0, PIT_Z, 0.2), off(P0, ZT, 0.2), off(P0, ZT, 0), [26, 28, 32], [-tx, -ty, 0]);
      g.quad(off(P1, PIT_Z, 0.2), off(P1, PIT_Z, 0), off(P1, ZT, 0), off(P1, ZT, 0.2), [26, 28, 32], [tx, ty, 0]);
      // luz de serviço acima da passarela, no meio de cada painel
      const mx = (x0 + x1) / 2 + nx * 0.05, my = (y0 + y1) / 2 + ny * 0.05;
      if (ay > 2 || by > 2) g.quad([mx - (bx - ax) / L * 0.35, my - (by - ay) / L * 0.35, 7.6], [mx + (bx - ax) / L * 0.35, my + (by - ay) / L * 0.35, 7.6], [mx + (bx - ax) / L * 0.35, my + (by - ay) / L * 0.35, 7.8], [mx - (bx - ax) / L * 0.35, my - (by - ay) / L * 0.35, 7.8], [255, 226, 180], n, { emit: 0.8 });
    }
    // a passarela de serviço a z = 4 (piso de 0,9 m saindo da parede) com o guarda-corpo
    if (!(ay === 0 && by === 0)) {
      const ix0 = ax + nx * 0.9, iy0 = ay + ny * 0.9, ix1 = bx + nx * 0.9, iy1 = by + ny * 0.9;
      g.quad([ax, ay, 4], [bx, by, 4], [ix1, iy1, 4], [ix0, iy0, 4], [48, 52, 58], [0, 0, 1]);
      g.quad([ax, ay, 3.85], [ix0, iy0, 3.85], [ix1, iy1, 3.85], [bx, by, 3.85], [30, 32, 36], [0, 0, -1]);
      g.quad([ix0, iy0, 3.85], [ix1, iy1, 3.85], [ix1, iy1, 4], [ix0, iy0, 4], [40, 44, 50], [nx, ny, 0]);
      g.quad([ix0, iy0, 4.95], [ix1, iy1, 4.95], [ix1, iy1, 5.02], [ix0, iy0, 5.02], [80, 86, 92], [nx, ny, 0]);
      for (let s = 0; s <= Math.round(L / 1.5); s++) {
        const t = s / Math.round(L / 1.5);
        const qx = ix0 + (ix1 - ix0) * t, qy = iy0 + (iy1 - iy0) * t;
        g.box(qx - 0.03, qy - 0.03, 4, 0.06, 0.06, 1.0, [80, 86, 92]);
      }
    }
  }
  // a parede da entrada (y = 0): fechada, com o vão da porta blindada no meio (x −1,6…1,6, até z 2,5)
  for (const [xa, xb] of [[-9, -1.6], [1.6, 9]]) g.quad([xa, 0, PIT_Z], [xb, 0, PIT_Z], [xb, 0, ZT], [xa, 0, ZT], wallD, [0, 1, 0]);
  g.quad([-1.6, 0, 2.5], [1.6, 0, 2.5], [1.6, 0, ZT], [-1.6, 0, ZT], wallD, [0, 1, 0]);
  g.quad([-1.6, 0, PIT_Z], [1.6, 0, PIT_Z], [1.6, 0, -0.4], [-1.6, 0, -0.4], wallD, [0, 1, 0]);
  // a frente da laje de entrada (o degrau até o fundo do poço) e os pilares sob a ponte
  g.quad([-9, 6, PIT_Z], [9, 6, PIT_Z], [9, 6, -0.4], [-9, 6, -0.4], [38, 41, 46], [0, 1, 0]);
  for (const y of [7.2, 8.6]) for (const x of [-0.7, 0.6]) g.box(x, y, PIT_Z, 0.12, 0.12, PIT_Z * -1 - 0.3, [40, 44, 50]);
  // teto escuro em placas + o anel de onde descem os três braços que seguram o núcleo
  for (let y = 0; y < 20; y += 4) for (let x = -9; x < 9; x += 4.5) g.quad([x, y, ZT], [x, y + 4, ZT], [x + 4.5, y + 4, ZT], [x + 4.5, y, ZT], (x + y) % 8 ? [24, 26, 30] : [28, 30, 34], [0, 0, -1]);
  g.prism(0, 13, 8.8, ZT, 3.3, 24, [44, 48, 56]);
  g.prism(0, 13, 8.6, 8.8, 3.35, 24, [255, 170, 90], { emit: 0.35 });
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI * 2 + Math.PI / 2;
    const top: V3 = [Math.cos(a) * 3.0, 13 + Math.sin(a) * 3.0, 8.7];
    const mid: V3 = [Math.cos(a) * 2.6, 13 + Math.sin(a) * 2.6, 5.4];
    const end: V3 = [Math.cos(a) * 1.55, 13 + Math.sin(a) * 1.55, 3.9];
    const beam = (p0: V3, p1: V3, w: number, col: RGB) => {
      const ux = -Math.sin(a) * w, uy = Math.cos(a) * w;
      g.quad([p0[0] - ux, p0[1] - uy, p0[2]], [p0[0] + ux, p0[1] + uy, p0[2]], [p1[0] + ux, p1[1] + uy, p1[2]], [p1[0] - ux, p1[1] - uy, p1[2]], col, [-Math.cos(a), -Math.sin(a), 0]);
      g.quad([p0[0] - ux, p0[1] - uy, p0[2] - 0.3], [p0[0] - ux, p0[1] - uy, p0[2]], [p1[0] - ux, p1[1] - uy, p1[2]], [p1[0] - ux, p1[1] - uy, p1[2] - 0.3], [col[0] * 0.8, col[1] * 0.8, col[2] * 0.8], [-Math.sin(a), Math.cos(a), 0]);
      g.quad([p0[0] + ux, p0[1] + uy, p0[2]], [p0[0] + ux, p0[1] + uy, p0[2] - 0.3], [p1[0] + ux, p1[1] + uy, p1[2] - 0.3], [p1[0] + ux, p1[1] + uy, p1[2]], [col[0] * 0.8, col[1] * 0.8, col[2] * 0.8], [Math.sin(a), -Math.cos(a), 0]);
    };
    beam(top, mid, 0.22, [62, 66, 72]);
    beam(mid, end, 0.16, [70, 74, 80]);
    g.box(mid[0] - 0.2, mid[1] - 0.2, mid[2] - 0.3, 0.4, 0.4, 0.4, [36, 38, 42]);
    // a garra: duas placas encostando no núcleo, com a luz laranja
    g.box(end[0] - 0.12, end[1] - 0.12, end[2] - 0.5, 0.24, 0.24, 0.5, [255, 150, 70], { emit: 0.55 });
  }
  // o fundo do poço: grade em placas; a ferida é uma rachadura acesa NO piso, seguindo o traçado de sempre
  for (let y = 6; y < 20; y += 2) for (let x = -9; x < 9; x += 2) g.quad([x, y, PIT_Z], [x + 2, y, PIT_Z], [x + 2, y + 2, PIT_Z], [x, y + 2, PIT_Z], (x + y) % 4 ? [30, 32, 34] : [34, 36, 38], [0, 0, 1], { tag: "floor" });
  for (let i = 0; i < WOUND.length - 1; i++) {
    const [ax, ay] = WOUND[i], [bx, by] = WOUND[i + 1];
    const w0 = 0.12 + 0.1 * Math.sin(i * 1.7), w1 = 0.12 + 0.1 * Math.sin((i + 1) * 1.7);
    g.quad([ax, ay - w0, PIT_Z + 0.02], [bx, by - w1, PIT_Z + 0.02], [bx, by + w1, PIT_Z + 0.02], [ax, ay + w0, PIT_Z + 0.02], [255, 196, 140], [0, 0, 1], { emit: 0.95, tag: "wound" });
    g.quad([ax, ay - w0 * 3, PIT_Z + 0.015], [bx, by - w1 * 3, PIT_Z + 0.015], [bx, by + w1 * 3, PIT_Z + 0.015], [ax, ay + w0 * 3, PIT_Z + 0.015], [200, 80, 40], [0, 0, 1], { emit: 0.6, tag: "wound" });
  }
  // a laje de entrada e a passarela até a plataforma diante do núcleo
  g.box(-9, 0, -0.4, 18, 6, 0.4, [44, 48, 54], { tag: "near" });
  g.box(-0.9, 6, -0.3, 1.8, 3.6, 0.3, [52, 56, 62], { tag: "near" });
  g.box(-1.4, 9.6, -0.3, 2.8, 0.5, 0.3, [52, 56, 62], { tag: "near" });
  if (!mech) [-0.95, 0.85].forEach((x) => g.box(x, 6, 0, 0.1, 3.6, 0.9, [70, 76, 84], { tag: "near" }));
  else {
    // os dois caminhos físicos da sala (módulo 12): à esquerda o sistema que completa o uso do Borealis, à direita o
    // mecanismo que segura o núcleo e pode lançá-lo contra a ferida; passarelas laterais saindo da ponte
    [-0.95, 0.85].forEach((x) => {
      g.box(x, 6, 0, 0.1, 1.5, 0.9, [70, 76, 84], { tag: "near" });
      g.box(x, 8.3, 0, 0.1, 1.3, 0.9, [70, 76, 84], { tag: "near" });
    });
    g.box(-3.8, 7.6, -0.3, 2.9, 0.6, 0.3, [52, 56, 62], { tag: "near" });
    g.box(0.9, 7.6, -0.3, 2.9, 0.6, 0.3, [52, 56, 62], { tag: "near" });
    g.box(-6.2, 6.6, -0.35, 2.4, 2.8, 0.35, [48, 52, 58], { tag: "near" });
    g.box(3.8, 6.6, -0.35, 2.4, 2.8, 0.35, [48, 52, 58], { tag: "near" });
    // 12/10 (pedido dele: tudo de 1:17 em diante refeito; os mecanismos eram caixas): os dois caminhos físicos.
    // ESQUERDA · o sistema que completa o uso do Borealis: console Combine em degraus, painel inclinado aceso, aletas,
    // a chave-mestra iluminada, cabos descendo para o poço e o duto de energia até o teto (anéis ciano)
    const N = { tag: "near" };
    g.box(-6.2, 7.2, 0, 1.6, 1.6, 0.2, [34, 38, 44], N);
    g.box(-6.0, 7.35, 0.2, 1.25, 1.3, 0.85, [42, 48, 56], N);
    g.box(-5.95, 7.4, 1.05, 1.15, 1.2, 0.08, [60, 66, 74], N);
    // 30/10 (ele: a parte azul embaixo da tela ficava cortada pela metade quando o Gordon chegava perto): o painel
    // ciano antigo cruzava a tela do console (planos diferentes, um atravessando o outro). Agora a tela (LEFT_SCR) fica
    // num gabinete em cunha só dela: a frente inclinada atrás da tela, a frente de baixo vertical com o filete aceso,
    // as costas e as laterais fechadas até o console
    {
      const A: [number, number] = [-4.98, 1.565], B: [number, number] = [-4.535, 0.98], Cc: [number, number] = [-4.535, 0.72], D: [number, number] = [-4.98, 1.05];
      const y0 = 7.48, y1 = 8.52;
      const v = (q: [number, number], y: number): V3 => [q[0], y, q[1]];
      const dark: RGB = [26, 30, 34];
      g.quad(v(A, y0), v(A, y1), v(B, y1), v(B, y0), dark, [0.81, 0, 0.59], N);
      g.quad(v(B, y0), v(B, y1), v(Cc, y1), v(Cc, y0), [32, 36, 42], [1, 0, 0], N);
      g.quad(v(D, y0), v(D, y1), v(A, y1), v(A, y0), [22, 25, 29], [-1, 0, 0], N);
      g.quad(v(Cc, y0), v(Cc, y1), v(D, y1), v(D, y0), [18, 20, 24], [-0.59, 0, -0.81], N);
      g.quad(v(A, y0), v(B, y0), v(Cc, y0), v(D, y0), [30, 34, 40], [0, -1, 0], N);
      g.quad(v(A, y1), v(D, y1), v(Cc, y1), v(B, y1), [30, 34, 40], [0, 1, 0], N);
      g.quad([-4.53, 7.62, 0.9], [-4.53, 8.38, 0.9], [-4.53, 8.38, 0.86], [-4.53, 7.62, 0.86], [70, 210, 230], [1, 0, 0], { emit: 0.55, tag: "mechL" });
    }
    for (const y of [7.2, 8.7]) g.box(-6.05, y - 0.04, 0.2, 1.3, 0.08, 1.7, [30, 34, 40], N);
    for (const y of [7.2, 8.7]) g.box(-5.4, y - 0.05, 0.6, 0.04, 0.1, 1.1, [90, 230, 250], { emit: 0.5, tag: "mechL" });
    // a chave-mestra: um cilindro com o anel aceso, em cima do console
    g.prism(-5.5, 8.0, 1.13, 1.55, 0.14, 10, [70, 76, 84], N);
    g.prism(-5.5, 8.0, 1.4, 1.46, 0.17, 10, [120, 240, 255], { emit: 0.8, tag: "mechL" });
    g.box(-5.58, 7.75, 1.52, 0.16, 0.5, 0.08, [80, 86, 94], N);
    // cabos do console até a borda do poço
    for (const dz of [0.25, 0.45]) g.box(-6.15, 6.6, dz, 0.08, 0.6, 0.08, [20, 22, 26], N);
    g.prism(-5.9, 8.0, PIT_Z, 8.6, 0.3, 8, [44, 48, 56], N);
    // 30/10 (ele: o Varga entrava e saía "pela parede"): a plataforma do console ganha uma ponte até a parede da
    // esquerda e uma porta de serviço (vão escuro, batentes, verga com o filete aceso), entre duas pilastras
    g.box(-9, 6.65, -0.3, 2.8, 0.8, 0.3, [50, 54, 60], N);
    g.box(-9, 6.62, 0.9, 2.8, 0.04, 0.04, [80, 86, 94], N);
    g.box(-9, 7.43, 0.9, 2.8, 0.04, 0.04, [80, 86, 94], N);
    for (let x = -8.6; x < -6.2; x += 0.8) for (const y of [6.62, 7.43]) g.box(x, y, 0, 0.04, 0.04, 0.9, [70, 76, 84], N);
    g.quad([-8.985, 6.78, 0], [-8.985, 7.82, 0], [-8.985, 7.82, 2.3], [-8.985, 6.78, 2.3], [6, 7, 9], [1, 0, 0], N);
    g.quad([-8.98, 6.82, 0.01], [-8.98, 7.78, 0.01], [-8.6, 7.78, 0.01], [-8.6, 6.82, 0.01], [90, 200, 220], [0, 0, 1], { emit: 0.35, tag: "near" });
    g.box(-9, 6.66, 0, 0.2, 0.12, 2.42, [62, 68, 76], N);
    g.box(-9, 7.82, 0, 0.2, 0.12, 2.42, [62, 68, 76], N);
    g.box(-9, 6.66, 2.3, 0.2, 1.28, 0.22, [62, 68, 76], N);
    g.quad([-8.795, 6.8, 2.36], [-8.795, 7.8, 2.36], [-8.795, 7.8, 2.44], [-8.795, 6.8, 2.44], [120, 240, 255], [1, 0, 0], { emit: 0.85, tag: "near" });
    [1.6, 3.2, 4.8, 6.4].forEach((z) => g.prism(-5.9, 8.0, z, z + 0.14, 0.34, 8, [90, 230, 250], { emit: 0.6, tag: "mechL" }));
    // DIREITA · o lançador do núcleo: base com faixa de aviso, a alavanca em T no trilho, o pistão hidráulico que vai
    // até o braço que segura o núcleo (com as presilhas laranja)
    g.box(4.2, 7.3, 0, 1.3, 1.3, 0.18, [40, 38, 36], N);
    for (let i = 0; i < 6; i++) g.box(4.2 + i * 0.217, 7.28, 0.04, 0.11, 0.02, 0.1, i % 2 ? [24, 24, 24] : [210, 170, 40], N);
    g.box(4.4, 7.5, 0.18, 0.9, 0.9, 0.9, [56, 52, 48], N);
    g.box(4.45, 7.55, 1.08, 0.8, 0.8, 0.05, [72, 68, 62], N);
    g.box(4.79, 7.6, 1.13, 0.12, 0.7, 0.04, [16, 16, 18], N);
    g.box(4.8, 7.9, 1.1, 0.1, 0.1, 0.55, [255, 140, 60], { emit: 0.7, tag: "mechR" });
    g.box(4.62, 7.88, 1.62, 0.46, 0.14, 0.1, [255, 140, 60], { emit: 0.7, tag: "mechR" });
    // o pistão: da base da coluna até o braço
    g.prism(3.6, 13, PIT_Z, 8.6, 0.35, 8, [46, 50, 58]);
    g.prism(3.6, 13, 0.6, 2.7, 0.48, 8, [70, 74, 80]);
    g.prism(3.6, 13, 0.6, 0.8, 0.56, 8, [255, 140, 60], { emit: 0.5, tag: "mechR" });
    g.box(1.3, 12.8, 2.8, 2.3, 0.4, 0.4, [70, 64, 58]);
    g.box(1.3, 12.78, 2.92, 2.3, 0.02, 0.16, [255, 140, 60], { emit: 0.8, tag: "mechR" });
    for (const x of [1.4, 2.4]) g.box(x, 12.72, 2.7, 0.18, 0.52, 0.6, [255, 140, 60], { emit: 0.4, tag: "mechR" });
    // a saliência no fundo, à direita (onde o G-Man fica parado)
    g.box(4.6, 18.4, -0.3, 2.8, 1.4, 0.3, [44, 48, 54]);
  }
  // os quatro pilares Combine em volta do núcleo, com os emissores apontados para ele
  [[-3.2, 9.8], [3.2, 9.8], [-3.2, 16.2], [3.2, 16.2]].forEach(([x, y]) => {
    g.prism(x, y, PIT_Z, 8.6, 0.38, 8, [46, 50, 58]);
    g.box(x - 0.35, y - 0.35, 2.6, 0.7, 0.7, 0.8, [60, 66, 76]);
    g.prism(x, y, 3.4, 3.55, 0.42, 8, [190, 140, 255], { emit: 0.55 });
  });
  return g.F;
};
export type CoreOpts = { amb?: number; rings?: [number, number, number]; ringO?: number; labels?: number[]; beam?: number; wound?: number; arcs?: number; push?: number; hot?: number; spin?: number; mL?: number; mR?: number; extras?: THREE.Object3D[]; glLights?: THREE.Light[]; coreK?: number };
const RING_R = [2.0, 2.35, 2.7];
const RING_COL = [ICE, "#ffd27a", "#ff8a5a"];
const RING_LAB = ["BOREALIS", "NÚCLEO", "FERIDA"];
const ringPt = (k: number, th: number, spin: number): V3 => {
  const ph = (k * Math.PI) / 3 + spin;
  const u: V3 = [Math.cos(ph), Math.sin(ph), 0];
  const R = RING_R[k];
  return [CORE[0] + R * Math.cos(th) * u[0], CORE[1] + R * Math.cos(th) * u[1], CORE[2] + R * Math.sin(th)];
};
export const CoreRoom: React.FC<{ e: Eye; f: number; G: XF[]; o: CoreOpts; children?: React.ReactNode }> = ({ e, f, G: G0, o, children }) => {
  const { rings, ringO = 0, labels = [], beam = 0, wound = 1, arcs = 0, push = 0, hot = 0, spin = f / 400, mL = 0, mR = 0 } = o;
  // 30/10: coreK < 1 encolhe o núcleo (a esfera, a aura, as motas e a luz dele); 0 = o núcleo não existe mais
  const coreK = o.coreK ?? 1;
  const G = G0.map((fc) => (fc.tag === "mechL" && mL ? { ...fc, emit: 0.35 + 0.65 * mL * (0.8 + 0.2 * Math.sin(f / 4)) } : fc.tag === "mechR" && mR ? { ...fc, emit: 0.4 + 0.6 * mR * (0.8 + 0.2 * Math.sin(f / 4)) } : fc.tag === "wound" ? { ...fc, emit: (fc.emit ?? 0.9) * Math.max(0.12, wound) * (0.85 + 0.15 * Math.sin(f / 6)) } : fc));
  const isFar = (fc: XF) => fc.tag !== "near" && (fc.p.every((q) => q[1] >= 13.2) || fc.p.every((q) => q[2] <= 0.01));
  // 11/10: luz do núcleo, a ferida acendendo o fundo do poço, e as luzes de serviço da passarela
  const lights: XL[] = [{ x: 0, y: 13, z: 3, col: [255, 214, 140], k: (1.1 + hot * 0.4) * (0.25 + 0.75 * coreK), r: 13 }, { x: 0, y: 15, z: PIT_Z + 0.4, col: [255, 120, 60], k: 0.9 * wound, r: 9 }, { x: 0, y: 3, z: 3, col: [150, 160, 180], k: 0.35, r: 8 }, { x: -7.5, y: 12, z: 7.4, col: [255, 226, 180], k: 0.5, r: 7 }, { x: 7.5, y: 12, z: 7.4, col: [255, 226, 180], k: 0.5, r: 7 }, { x: 0, y: 19, z: 7.4, col: [255, 226, 180], k: 0.5, r: 7 }];
  const cq = proj(e, CORE);
  const segs = (front: boolean) =>
    rings && ringO > 0
      ? rings.map((ang, k) => {
          const out: React.ReactNode[] = [];
          const N = 56;
          for (let i = 0; i < N; i++) {
            const a = proj(e, ringPt(k, (i / N) * Math.PI * 2, spin));
            const b = proj(e, ringPt(k, ((i + 1) / N) * Math.PI * 2, spin));
            if (!a || !b || !cq) continue;
            const isF = (a.d + b.d) / 2 < cq.d;
            if (isF !== front) continue;
            out.push(<line key={`${k}-${i}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={RING_COL[k]} strokeWidth={front ? 3.2 : 2} opacity={ringO * (front ? 0.95 : 0.5)} />);
          }
          // o entalhe de cada anel (alinhado = embaixo, apontando para a ferida)
          const n = proj(e, ringPt(k, ang, spin));
          if (n && cq && n.d < cq.d === front) {
            out.push(<rect key={`n${k}`} x={n.x - 9} y={n.y - 9} width={18} height={18} transform={`rotate(45 ${n.x} ${n.y})`} fill={RING_COL[k]} stroke="#0a0806" strokeWidth={2} opacity={ringO} />);
          }
          return <g key={k}>{out}</g>;
        })
      : null;
  const wq = WOUND.map(([x, y]) => proj(e, [x, y, PIT_Z + 0.01]));
  const woundOk = wq.every((q) => q);
  const beamTop = proj(e, [CORE[0], CORE[1], CORE[2] - 1.3]);
  const beamBot = proj(e, [CORE[0], 14.8, PIT_Z + 0.02]);
  return (
    <>
      {/* 11/10: a câmara inteira num desenho só, com profundidade de verdade (a ferida faz parte do piso) */}
      <XView e={e} faces={G} lights={lights} flash={0.4} amb={o.amb ?? 0.12} seam="rgba(0,0,0,0.2)" gl smooth extras={o.extras} glLights={o.glLights} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <defs>
          <filter id="crGlow"><feGaussianBlur stdDeviation="7" /></filter>
          <radialGradient id="crAura"><stop offset="0" stopColor="rgba(255,200,120,0.32)" /><stop offset="0.45" stopColor="rgba(255,150,70,0.12)" /><stop offset="1" stopColor="rgba(255,120,50,0)" /></radialGradient>
        </defs>
        {void woundOk}
        {/* os arcos entre o núcleo e a ferida (o núcleo reagindo) */}
        {arcs > 0 && cq
          ? [0, 1, 2, 3].map((k) => {
              const w = wq[2 + k * 2];
              if (!w) return null;
              const pts = Array.from({ length: 9 }).map((_, i) => {
                const t = i / 8;
                const j = i === 0 || i === 8 ? 0 : (rnd(k * 31 + i + Math.floor(f / 2) * 7) - 0.5) * 60;
                return `${cq.x + (w.x - cq.x) * t + j},${cq.y + (w.y - cq.y) * t}`;
              });
              return (
                <g key={k} opacity={arcs * (rnd(k + Math.floor(f / 3)) > 0.3 ? 1 : 0.2)}>
                  <polyline points={pts.join(" ")} fill="none" stroke="rgba(255,190,110,0.6)" strokeWidth={8} filter="url(#crGlow)" />
                  <polyline points={pts.join(" ")} fill="none" stroke="#fff0d0" strokeWidth={1.8} />
                </g>
              );
            })
          : null}
        {beam > 0 && beamTop && beamBot ? (
          <g opacity={beam}>
            <line x1={beamTop.x} y1={beamTop.y} x2={beamBot.x} y2={beamBot.y} stroke="rgba(255,226,160,0.6)" strokeWidth={40} filter="url(#crGlow)" />
            <line x1={beamTop.x} y1={beamTop.y} x2={beamBot.x} y2={beamBot.y} stroke="#fffaf0" strokeWidth={5} />
          </g>
        ) : null}
        {/* a aura: brilho largo, motas de luz espiralando para o núcleo e ondas de calor (11/10, pedido dele) */}
        {cq && coreK > 0.01 ? (
          <g style={{ mixBlendMode: "screen" }} opacity={coreK}>
            <circle cx={cq.x} cy={cq.y} r={(4.2 * coreK * e.F) / cq.d} fill="url(#crAura)" />
            {Array.from({ length: 46 }).map((_, i) => {
              const t = ((f / (90 + (i % 7) * 12) + rnd(i * 3)) % 1);
              const R = 1.4 + (1 - t) * (2.6 + rnd(i * 5) * 2.4);
              const a = rnd(i * 7) * Math.PI * 2 + t * 4;
              const el = (rnd(i * 11) - 0.5) * 1.6;
              const q = proj(e, [CORE[0] + Math.cos(a) * R, CORE[1] + Math.sin(a) * R, CORE[2] + el * R * 0.5]);
              return q ? <circle key={i} cx={q.x} cy={q.y} r={Math.min(3, Math.max(1, (0.05 * e.F) / q.d))} fill="#ffe6b8" opacity={Math.sin(t * Math.PI) * 0.85} /> : null;
            })}
            {[0, 1, 2].map((k) => {
              const t = ((f / 70 + k / 3) % 1);
              return <circle key={"h" + k} cx={cq.x} cy={cq.y} r={((1.3 + t * 2.4) * e.F) / cq.d} fill="none" stroke="rgba(255,190,110,0.35)" strokeWidth={2} opacity={1 - t} />;
            })}
          </g>
        ) : null}
        {segs(false)}
        {coreK > 0.02 ? <CoreOrb e={e} f={f} c={CORE} R={1.25 * coreK} hot={hot} id="cr" /> : null}
        {segs(true)}
        {/* os emissores Combine empurrando os anéis */}
        {push > 0
          ? [[-3.2, 9.8], [3.2, 9.8], [-3.2, 16.2], [3.2, 16.2]].map(([x, y], k) => {
              const a = proj(e, [x, y, 3.48]);
              const b = proj(e, ringPt(k % 3, Math.PI * (k < 2 ? 0.15 : 0.85), spin));
              return a && b ? (
                <g key={k} opacity={push}>
                  <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="rgba(199,155,255,0.55)" strokeWidth={12} filter="url(#crGlow)" />
                  <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#efe2ff" strokeWidth={2} strokeDasharray="12 8" strokeDashoffset={-f * 4} />
                </g>
              ) : null;
            })
          : null}
      </svg>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {void isFar}
        {rings && ringO > 0
          ? labels.map((k) => {
              const q = proj(e, ringPt(k, 0.18 + k * 0.35, spin));
              return q ? (
                <g key={k} opacity={ringO}>
                  <rect x={q.x + 14} y={q.y - 16} width={RING_LAB[k].length * 13 + 22} height={30} rx={6} fill="rgba(6,8,12,0.82)" stroke={RING_COL[k]} strokeWidth={1.5} />
                  <text x={q.x + 25} y={q.y + 5} fill={RING_COL[k]} fontFamily={MONO} fontSize={18} letterSpacing={3}>{RING_LAB[k]}</text>
                </g>
              ) : null;
            })
          : null}
        {children}
      </svg>
    </>
  );
};
export const coreEye = (f: number, o: { y?: number; pitch?: number; yaw?: number; shake?: number } = {}): Eye => {
  const sh = o.shake ?? 0;
  return { x: 0.05 * Math.sin(f / 60) + sh * (rnd(Math.floor(f)) - 0.5) * 0.08, y: o.y ?? 4.6, z: 1.65 + sh * (rnd(Math.floor(f) + 9) - 0.5) * 0.06, yaw: o.yaw ?? 0, pitch: (o.pitch ?? 0.08) + sh * (rnd(Math.floor(f) + 3) - 0.5) * 0.02, F: 1000 };
};
// alinhamento: entalhes espalhados (0) → todos embaixo (1)
const notches = (u: number): [number, number, number] => {
  const base: [number, number, number] = [0.35, 2.2, 4.1];
  const tgt = -Math.PI / 2 + Math.PI * 2;
  return base.map((b) => b + (tgt - b) * u) as [number, number, number];
};

// ---------------------------------------------------------------- 1:16:38 mais fundo no navio (11/10, refeito)
// continua o MESMO corredor da corrida (de onde ela parou), no motor com profundidade de verdade.
// · as paredes saem de fase: trechos da parede se degradam (a tinta enferruja, as chapas se soltam e afastam, e onde a
//   fase "abre" a chapa vira arame violeta e mostra o vazio atrás) — devagar, nada pisca
// · a Aperture por segundos: uma varredura corre pela parede e, atrás dela, a mesma parede vira o painel branco da
//   Aperture com a faixa laranja; depois a varredura volta e devolve o casco
// · o corredor some e volta: lá na frente o corredor inteiro se desfaz em arame (o piso onde eles pisam fica), eles
//   param; a fase devolve o corredor e eles seguem
// · a porta blindada do fim abre: a luz do núcleo invade; o núcleo preso à ferida
const AperturePanel: React.FC<{ o: number }> = ({ o }) => (
  <div style={{ width: 600, height: 300, position: "relative", opacity: o, background: "#e8e6e0", backgroundImage: "linear-gradient(rgba(0,0,0,0.35) 2px, transparent 2px), linear-gradient(90deg, rgba(0,0,0,0.35) 2px, transparent 2px)", backgroundSize: "75px 75px" }}>
    <div style={{ position: "absolute", left: 0, right: 0, top: 120, height: 26, background: "#f08a1c" }} />
    <div style={{ position: "absolute", left: 24, top: 182, fontFamily: FONT, fontWeight: 700, fontSize: 26, color: "#2a2a2a", letterSpacing: 2 }}>APERTURE SCIENCE</div>
    <div style={{ position: "absolute", left: 24, top: 216, fontFamily: MONO, fontSize: 16, color: "#4a4a4a", letterSpacing: 3 }}>ENRICHMENT CENTER · 1979</div>
  </div>
);
export const CORE_HALL = 66;
const AP_WHITE: RGB = [214, 212, 204];
const segOf = (fc: XF) => {
  const n = fc.p.length;
  const cx = fc.p.reduce((s, q) => s + q[0], 0) / n;
  const cy = fc.p.reduce((s, q) => s + q[1], 0) / n;
  const cz = fc.p.reduce((s, q) => s + q[2], 0) / n;
  return { cx, cy, cz };
};
const blastDoor = (open: number): XF[] => {
  const g = mk();
  const Y = CORE_HALL;
  // moldura grossa da porta (anteparo) e as duas folhas que correm para os lados
  g.box(-2.2, Y - 0.3, 0, 0.6, 0.6, 3.1, [40, 44, 47]);
  g.box(1.6, Y - 0.3, 0, 0.6, 0.6, 3.1, [40, 44, 47]);
  g.box(-1.6, Y - 0.3, 2.5, 3.2, 0.6, 0.6, [40, 44, 47]);
  for (const s of [-1, 1]) {
    const x0 = s < 0 ? -1.6 - open * 1.5 : 0 + open * 1.5;
    g.box(x0, Y - 0.12, 0, 1.6, 0.24, 2.5, [70, 74, 72]);
    // faixas de aviso nas folhas
    for (let i = 0; i < 5; i++) g.box(x0 + 0.1 + i * 0.3, Y - 0.13, 1.1, 0.15, 0.01, 0.3, i % 2 ? [30, 30, 30] : [196, 156, 40]);
    g.box(x0 + (s < 0 ? 1.45 : 0.05), Y - 0.14, 0.2, 0.1, 0.02, 2.1, [50, 52, 54]);
  }
  // a luz vermelha de "porta selada" vira verde quando abre
  g.box(-0.15, Y - 0.32, 2.75, 0.3, 0.04, 0.12, open > 0.02 ? [90, 255, 140] : [255, 60, 40], { emit: 0.9 });
  return g.F;
};
// 30/10 (ele: "a Aperture por segundos" era só um logo colado na parede, sem sentido): agora a parede da esquerda sai de
// fase e vira a janela de observação de uma câmara de teste da Aperture, lá embaixo — painéis brancos, os dois portais,
// o cubo em cima do botão. Ele olha para o lado, a janela fecha e ele volta a olhar para a frente antes do corredor sumir
const testChamber = (R: number): XF[] => {
  const g = mk();
  const x0 = -9, x1 = -2.26, y0 = R - 0.6, y1 = R + 6.6, z0 = -1.6, z1 = 4.2;
  // piso escuro em placas
  for (let x = x0; x < x1; x += 1)
    for (let y = y0; y < y1; y += 1) {
      const k = (Math.floor(x) + Math.floor(y)) % 2 ? 1 : 0.9;
      g.quad([x, y, z0], [Math.min(x + 1, x1), y, z0], [Math.min(x + 1, x1), Math.min(y + 1, y1), z0], [x, Math.min(y + 1, y1), z0], [86 * k, 90 * k, 94 * k], [0, 0, 1]);
    }
  // paredes brancas em painéis (a do fundo e as duas das pontas) e o teto escuro
  for (let y = y0; y < y1; y += 1)
    for (let z = z0; z < z1; z += 1) {
      const k = (Math.floor(y) + Math.floor(z)) % 2 ? 1 : 0.93;
      g.quad([x0, Math.min(y + 1, y1), z], [x0, y, z], [x0, y, Math.min(z + 1, z1)], [x0, Math.min(y + 1, y1), Math.min(z + 1, z1)], [214 * k, 213 * k, 207 * k], [1, 0, 0]);
    }
  for (let x = x0; x < x1; x += 1)
    for (let z = z0; z < z1; z += 1) {
      const k = (Math.floor(x) + Math.floor(z)) % 2 ? 1 : 0.93;
      const xb = Math.min(x + 1, x1), zb = Math.min(z + 1, z1);
      g.quad([x, y0, z], [xb, y0, z], [xb, y0, zb], [x, y0, zb], [206 * k, 205 * k, 199 * k], [0, 1, 0]);
      g.quad([xb, y1, z], [x, y1, z], [x, y1, zb], [xb, y1, zb], [206 * k, 205 * k, 199 * k], [0, -1, 0]);
    }
  g.quad([x0, y0, z1], [x0, y1, z1], [x1, y1, z1], [x1, y0, z1], [56, 58, 60], [0, 0, -1]);
  // os portais: laranja na parede do fundo, azul na da ponta
  const oval = (c: V3, ax: V3, ay: V3, rx: number, ry: number, col: RGB, n: V3) => {
    const pts = (k: number) => Array.from({ length: 20 }).map((_, i) => { const a = (i / 20) * Math.PI * 2; return [c[0] + ax[0] * Math.cos(a) * rx * k + ay[0] * Math.sin(a) * ry * k, c[1] + ax[1] * Math.cos(a) * rx * k + ay[1] * Math.sin(a) * ry * k, c[2] + ax[2] * Math.cos(a) * rx * k + ay[2] * Math.sin(a) * ry * k] as V3; });
    g.F.push({ p: pts(1.12), col: [col[0] * 0.5, col[1] * 0.5, col[2] * 0.5], n, emit: 0.6 });
    g.F.push({ p: pts(1).map((q) => [q[0] + n[0] * 0.01, q[1] + n[1] * 0.01, q[2] + n[2] * 0.01] as V3), col, n, emit: 1 });
  };
  oval([x0 + 0.02, R + 1.4, z0 + 1.05], [0, 1, 0], [0, 0, 1], 0.55, 1.0, [255, 150, 40], [1, 0, 0]);
  oval([-5.0, y1 - 0.02, z0 + 1.05], [1, 0, 0], [0, 0, 1], 0.55, 1.0, [70, 170, 255], [0, -1, 0]);
  // o botão grande e o cubo em cima dele
  g.prism(-5.6, R + 3.2, z0, z0 + 0.1, 0.7, 16, [70, 72, 76]);
  g.prism(-5.6, R + 3.2, z0 + 0.1, z0 + 0.2, 0.55, 16, [210, 40, 36], { emit: 0.35 });
  g.box(-5.95, R + 2.85, z0 + 0.2, 0.7, 0.7, 0.7, [150, 152, 158]);
  for (const [dx, dy, w, d] of [[-0.36, 0, 0.02, 0.3], [0.34, 0, 0.02, 0.3], [0, -0.36, 0.3, 0.02], [0, 0.34, 0.3, 0.02]] as [number, number, number, number][])
    g.box(-5.6 + dx - w / 2 + (dx ? 0 : 0), R + 3.2 + dy - d / 2, z0 + 0.4, w, d, 0.3, [255, 150, 200], { emit: 0.7 });
  // as luminárias do teto
  for (const y of [R + 1, R + 3.2, R + 5.4]) g.box(-6.2, y - 0.2, z1 - 0.08, 2.2, 0.4, 0.06, [255, 255, 248], { emit: 0.95 });
  return g.F;
};
export const HL11Deep: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [deepAt, rulesAt, phaseAt, apAt, corrAt, coreAt, woundAt] = ats(p, ["deepAt", "rulesAt", "phaseAt", "apAt", "corrAt", "coreAt", "woundAt"]);
  void deepAt;
  const G = useMemo(() => buildShipHall2(CORE_HALL), []);
  // eles param quando o corredor some e retomam quando volta
  const halt = P(f, corrAt, 14) * (1 - P(f, corrAt + 70, 16));
  // o olhar para a janela da câmara de teste (entra em "Parte da Aperture", sai antes de "corredores inteiros somem")
  const lookAt = (fr: number) => interpolate(fr, [apAt - 4, apAt + 16, corrAt - 24, corrAt - 4], [0, 1, 1, 0], { ...C, easing: Easing.inOut(Easing.sin) });
  const pace = (fr: number) => {
    let s = 0;
    for (let i = 0; i < fr; i += 1) s += 0.042 * (1 - 0.6 * lookAt(i)) * (1 - (i >= corrAt && i < corrAt + 86 ? Math.min(1, (i - corrAt) / 14, (corrAt + 86 - i) / 16) : 0));
    return s;
  };
  const y = Math.min(CORE_HALL - 3.2, 32.3 + pace(Math.min(f, coreAt)));
  const look = lookAt(f);
  // a janela: dois vãos entre costelas na parede da esquerda, um pouco à frente de onde ele está quando ela abre
  const winR = Math.ceil((32.3 + pace(apAt) + 1.0) / 3) * 3;
  const winO = P(f, apAt, 12) * (1 - P(f, corrAt - 20, 12));
  const bob = (1 - halt) * Math.abs(Math.sin(f / 7)) * 0.03;
  const e: Eye = { x: 0.08 * Math.sin(f / 40), y, z: 1.65 + bob, yaw: 0.03 * Math.sin(f / 50) - 0.62 * look, pitch: keys(f, [[0, -0.02], [woundAt - 6, -0.02], [woundAt + 20, -0.08]]) - 0.14 * look, F: 960 };
  const open = P(f, coreAt, 40);
  // o corredor some (arame) a partir de uma frente que vem de longe até perto deles, e volta
  const vg = f - corrAt;
  const vFront = vg < 0 ? 1e9 : vg < 20 ? CORE_HALL - (vg / 20) * (CORE_HALL - (y + 6)) : vg < 56 ? y + 6 : vg < 80 ? y + 6 + ((vg - 56) / 24) * (CORE_HALL - y - 6) : 1e9;
  const faces: XF[] = [];
  for (const fc of G) {
    const { cx, cy, cz } = segOf(fc);
    const isFloor = cz < 0.05 && Math.abs(fc.n[2]) > 0.9;
    // 1) o corredor some (menos o piso perto deles)
    if (cy > vFront && !(isFloor && cy < y + 10)) {
      faces.push({ ...fc, nofill: true, edge: [150, 110, 230] });
      continue;
    }
    // 2) a janela da câmara de teste: a parede da esquerda sai de fase (arame) e abre; as costelas ficam como montantes
    if (winO > 0 && cx < -1.85 && cz > 0.3 && cz < 2.3 && cy > winR && cy < winR + 6 && Math.abs(cy - Math.round(cy / 3) * 3) > 0.2) {
      if (winO < 0.97) faces.push({ ...fc, nofill: true, edge: [170, 120, 240] });
      continue;
    }
    // 3) as paredes saindo de fase: degradação por trecho (lenta), chapa se afasta, e onde abre vira arame
    if (f >= phaseAt && Math.abs(cx) > 1.85 && cz > 0.3 && !isFloor) {
      const gid = Math.floor(cy / 1.5) * 2 + (cx > 0 ? 1 : 0);
      const ph = Math.max(0, Math.sin((f - phaseAt) / 38 + gid * 2.1)) * Math.min(1, (f - phaseAt) / 30) * (rnd(gid * 7) > 0.45 ? 1 : 0);
      if (ph > 0.01) {
        const out = Math.sign(cx) * ph * 0.28;
        const tilt = ph * 0.18 * (rnd(gid) - 0.5);
        const pp = fc.p.map((q) => [q[0] + out + tilt * (q[2] - cz), q[1] + tilt * 0.4, q[2] - ph * 0.06] as V3);
        const k = 1 - 0.45 * ph;
        const rust: RGB = [fc.col[0] * k + 34 * ph, fc.col[1] * k + 14 * ph, fc.col[2] * k];
        if (ph > 0.72) faces.push({ ...fc, p: pp, nofill: true, edge: [170, 120, 240] });
        else faces.push({ ...fc, p: pp, col: rust });
        continue;
      }
    }
    faces.push(fc);
  }
  faces.push(...blastDoor(open));
  if (winO > 0) faces.push(...testChamber(winR));
  const lamps: XL[] = Array.from({ length: 22 }).map((_, i) => 1.5 + i * 3).filter((ly) => ly > y - 3 && ly < y + 18).map((ly) => ({ x: 0, y: ly, z: 2.9, col: [255, 232, 196] as RGB, k: 0.95 * (ly > vFront ? 0 : 1), r: 4.6 }));
  const lights: XL[] = [...lamps, { x: 0, y: CORE_HALL + 2, z: 1.6, col: [255, 160, 70], k: 0.25 + 1.4 * open, r: 9 + 8 * open }, ...(winO > 0 ? [{ x: -5.6, y: winR + 3.2, z: 3.4, col: [255, 255, 248] as RGB, k: 1.3 * winO, r: 9 }] : [])];
  const alyx: V3 = [0.7, y + 3, 0];
  // a abertura da porta (para recortar o núcleo e a ferida lá dentro)
  const d4 = ([[-1.5 * open, CORE_HALL, 2.5], [1.5 * open, CORE_HALL, 2.5], [1.5 * open, CORE_HALL, 0], [-1.5 * open, CORE_HALL, 0]] as V3[]).map((v) => proj(e, v));
  const doorClip = open > 0.02 && d4.every((q) => q) ? `polygon(${d4.map((q) => `${q!.x.toFixed(0)}px ${q!.y.toFixed(0)}px`).join(", ")})` : null;
  const msg = f < rulesAt ? "AS REGIÕES MAIS PROFUNDAS DO BOREALIS" : f < phaseAt ? "O NAVIO DEIXA DE OBEDECER AS PRÓPRIAS REGRAS" : f >= phaseAt && f < apAt ? "AS PAREDES ENTRAM E SAEM DE FASE" : f >= apAt && f < corrAt ? "A APERTURE · UMA CÂMARA DE TESTE, POR SEGUNDOS" : f >= corrAt && f < corrAt + 80 ? (vg < 56 ? "O CORREDOR SOME" : "E VOLTA") : f >= coreAt && f < woundAt ? "O NÚCLEO" : f >= woundAt ? "PRESO À MESMA ANOMALIA · A FERIDA" : undefined;
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, #1a1028 0%, #07050c 60%, #020204 100%)", overflow: "hidden" }}>
      {/* o vazio violeta atrás das paredes que saem de fase */}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {Array.from({ length: 70 }).map((_, i) => <circle key={i} cx={rnd(i) * 1920} cy={rnd(i * 3) * 1080} r={1 + rnd(i * 7) * 2} fill="#c79bff" opacity={0.25 + 0.25 * Math.sin(f / 20 + i)} />)}
      </svg>
      {/* lá dentro, pela porta: a câmara do núcleo (luz quente, o núcleo e a ferida), recortada na abertura */}
      {doorClip ? (
        <div style={{ position: "absolute", inset: 0, clipPath: doorClip, background: "radial-gradient(ellipse at 50% 45%, #6a3a14 0%, #2a1408 55%, #0c0604 100%)" }}>
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
            <CoreOrb e={e} f={f} c={[0, CORE_HALL + 10, 2.0]} R={1.4} o={P(f, coreAt + 6, 20)} id="dp" />
            {f >= woundAt
              ? (() => {
                  const a = proj(e, [-4, CORE_HALL + 10.4, -0.4]);
                  const b = proj(e, [4, CORE_HALL + 10.4, -0.4]);
                  const m = proj(e, [0, CORE_HALL + 10, -0.42]);
                  return a && b && m ? (
                    <g opacity={P(f, woundAt, 16)}>
                      <path d={`M ${a.x} ${a.y} L ${(a.x + m.x) / 2} ${m.y + 6} L ${m.x} ${m.y - 3} L ${(m.x + b.x) / 2} ${m.y + 5} L ${b.x} ${b.y}`} fill="none" stroke="rgba(255,110,60,0.7)" strokeWidth={22} />
                      <path d={`M ${a.x} ${a.y} L ${(a.x + m.x) / 2} ${m.y + 6} L ${m.x} ${m.y - 3} L ${(m.x + b.x) / 2} ${m.y + 5} L ${b.x} ${b.y}`} fill="none" stroke="#ffd0a0" strokeWidth={3} />
                    </g>
                  ) : null;
                })()
              : null}
          </svg>
        </div>
      ) : null}
      <XView e={e} faces={faces} lights={lights} flash={0.35} amb={0.13} seam="rgba(0,0,0,0.18)" gl smooth />
      {/* a placa da câmara, na parede do fundo (só com a janela aberta) */}
      {winO > 0.5 ? (
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <Pinned e={e} w={600} h={330} o={P(f, apAt + 8, 10) * (1 - P(f, corrAt - 22, 8))} corners={[[-8.97, winR + 2.6, 2.9], [-8.97, winR + 5.2, 2.9], [-8.97, winR + 5.2, 1.47], [-8.97, winR + 2.6, 1.47]]}>
            <div style={{ width: 600, height: 330, background: "#e9e7e1", fontFamily: FONT, color: "#2a2a2a", padding: "24px 30px", boxSizing: "border-box" }}>
              <div style={{ fontWeight: 800, fontSize: 150, lineHeight: 1 }}>07</div>
              <div style={{ height: 6, background: "#2a2a2a", margin: "14px 0" }} />
              <div style={{ fontWeight: 700, fontSize: 34, letterSpacing: 2 }}>APERTURE SCIENCE</div>
              <div style={{ fontFamily: MONO, fontSize: 20, letterSpacing: 3, color: "#555", marginTop: 6 }}>CÂMARA DE TESTE · 07</div>
            </div>
          </Pinned>
        </div>
      ) : null}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <FlagAt e={e} pt={alyx} label="ALYX" col={ORANGE} f={f} sub={f >= coreAt ? "O NÚCLEO" : halt > 0.5 ? "PARA" : f >= phaseAt ? "NÃO PARA" : undefined} />
      </svg>
      <Hud f={f} yaw={e.yaw} eye={e} blips={[{ x: alyx[0], y: alyx[1] }]} msg={msg} msgCol={f >= apAt && f < corrAt ? AMB : f >= coreAt ? ORANGE : VIO} />
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 1:17:13 / 1:17:37 o catalisador é um estado (três anéis em volta do núcleo)
export const HL11State: React.FC<PR & { mode?: number }> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const mode = p.mode ?? 0;
  const [explAt, notMachAt, stateAt, threeAt, borAt, coreAt, woundAt] = ats(p, ["explAt", "notMachAt", "stateAt", "threeAt", "borAt", "coreAt", "woundAt"]);
  const [needAt, pushAt, earlyAt, notYetAt, firstAt] = ats(p, ["needAt", "pushAt", "earlyAt", "notYetAt", "firstAt"]);
  void explAt;
  const G = useMemo(() => buildCoreRoom(), []);
  const e = { ...coreEye(f, { y: mode ? 3.4 : keys(f, [[0, 3.2], [life, 4.4]]), pitch: mode ? 0.04 : keys(f, [[0, 0.06], [woundAt - 6, 0.06], [woundAt + 20, -0.24], [life, -0.22]]) }), F: mode ? 820 : 1000 };
  const ringO = mode ? 1 : P(f, threeAt, 16);
  const labels = mode ? [0, 1, 2] : [borAt, coreAt, woundAt].map((t, k) => (f >= t ? k : -1)).filter((k) => k >= 0);
  // modo 1: os Combine empurrando o alinhamento; cedo demais nada acontece
  const al = mode ? Math.min(0.62, P(f, pushAt, 120) * 0.5 + P(f, firstAt, 60) * 0.12) : 0;
  const early = mode && f >= earlyAt && f < notYetAt + 40;
  const pct = Math.round(al * 100);
  // 11/10: os Advisors 3D (só na parte em que os Combine empurram o alinhamento), flutuando na altura da passarela,
  // um de cada lado, virados para o núcleo; os braços se estendem quando empurram
  const ADV = useAdvisors(mode ? 2 : 0, 3.4);
  const advPos: [number, number, number][] = [[-2.9, 8.4, 2.6], [3.0, 9.0, 2.3]];
  const reach = mode ? P(f, pushAt, 30) * (early ? 0.4 : 1) : 0;
  ADV.forEach((A, i) => {
    const pp = advPos[i];
    // de três quartos: o corpo atravessado, a máscara virada entre o núcleo e quem chega (dá para ver o rosto)
    placeAdvisor(A, [pp[0], pp[1], pp[2] + 0.12 * Math.sin(f / 22 + i * 2)], [-pp[0] * 0.6, 7.0, CORE[2] - 0.2]);
    A.pose(f / 30 + i * 3.1, reach);
  });
  const advGlow = useMemo(() => [0, 1].map(() => new THREE.PointLight("#b07cff", 0, 8, 1.6)), []);
  const advKey = useMemo(() => {
    const d = new THREE.DirectionalLight("#ffd9a8", 3.2);
    d.position.set(CORE[0], CORE[2] + 1, -CORE[1]);
    d.target.position.set(0, 2, -12);
    return d;
  }, []);
  const advLights = ADV.length ? [new THREE.AmbientLight("#9aa6b4", 1.6), new THREE.HemisphereLight("#cfd8e0", "#1a1410", 1.2), new THREE.PointLight("#ffcc88", 260, 30, 1.0), advKey, ...advGlow] : [];
  if (advLights[1]) (advLights[1] as THREE.PointLight).position.copy(new THREE.Vector3(CORE[0], CORE[2], -CORE[1]));
  advGlow.forEach((L, i) => {
    L.intensity = 20 * reach;
    L.position.set(advPos[i][0], advPos[i][2] - 1.2, -advPos[i][1]);
  });
  return (
    <AbsoluteFill style={{ background: "#020304", overflow: "hidden" }}>
      <CoreRoom e={e} f={f} G={G} o={{ rings: notches(al), ringO, labels, wound: mode ? 1 : P(f, woundAt, 14) * 0.9 + 0.1, push: mode ? P(f, pushAt, 12) : 0, extras: ADV.map((A) => A.root), glLights: advLights }}>
        {/* a "máquina escondida" que não existe */}
        {/* 11/10: o card 'máquina escondida' saiu (pedido dele) */}
        <FlagAt e={e} pt={[-0.6, 6.4, 0]} label="ALYX" col={ORANGE} f={f} sub={mode ? (early ? "CEDO DEMAIS" : "PRECISAVA DOS COMBINE") : "EXPLICA"} />
      </CoreRoom>
      {!mode && f >= stateAt ? (
        <div style={{ position: "absolute", left: 110, top: 140, fontFamily: MONO, opacity: P(f, stateAt, 8) }}>
          <div style={{ fontSize: 18, letterSpacing: 5, color: "#ffd27a" }}>O CATALISADOR</div>
          <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 60, color: TXT, marginTop: 4 }}>é um estado</div>
          {f >= threeAt ? <div style={{ fontSize: 20, letterSpacing: 3, color: CREAM, marginTop: 8, opacity: P(f, threeAt, 8) }}>TRÊS COISAS ALINHADAS AO MESMO TEMPO</div> : null}
        </div>
      ) : null}
      {mode ? (
        <div style={{ position: "absolute", right: 110, top: 140, width: 470, padding: "14px 18px", borderRadius: 12, background: "rgba(8,10,14,0.86)", border: `1.5px solid ${early ? RED : "#ffd27a"}`, fontFamily: MONO }}>
          <div style={{ fontSize: 15, letterSpacing: 5, color: "#ffd27a" }}>ALINHAMENTO</div>
          <div style={{ position: "relative", height: 18, marginTop: 10, border: "1.5px solid rgba(255,210,122,0.6)" }}>
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${pct}%`, background: "rgba(255,210,122,0.6)" }} />
          </div>
          <div style={{ fontSize: 28, letterSpacing: 3, color: TXT, marginTop: 6 }}>{pct}%</div>
          {f >= earlyAt ? <div style={{ fontSize: 18, letterSpacing: 2, color: RED, marginTop: 6, opacity: P(f, earlyAt, 8) }}>CHEGAR CEDO DEMAIS · NADA ACONTECE</div> : null}
          {f >= notYetAt ? <div style={{ fontSize: 18, letterSpacing: 2, color: CREAM, marginTop: 6, opacity: P(f, notYetAt, 8) }}>O MOMENTO AINDA NÃO EXISTIA</div> : null}
          {f >= firstAt ? <div style={{ fontSize: 18, letterSpacing: 2, color: VIO, marginTop: 6, opacity: P(f, firstAt, 8) }}>OS COMBINE PRECISAVAM AVANÇAR PRIMEIRO</div> : null}
        </div>
      ) : null}
      {mode && f >= needAt && f < pushAt + 20 ? <div style={{ position: "absolute", left: 110, top: 140, fontFamily: MONO, fontSize: 22, letterSpacing: 4, color: CREAM, opacity: P(f, needAt + 4, 8) * (1 - P(f, pushAt + 6, 10)) }}>POR ISSO ELA PRECISAVA DOS COMBINE</div> : null}
      <Hud f={f} yaw={e.yaw} eye={e} blips={[{ x: -0.6, y: 6.4 }]} msg={!mode && f < notMachAt ? "A CÂMARA DO NÚCLEO" : undefined} msgCol={AMB} />
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 1:17:55 / 1:18:22 o tabuleiro do G-Man (peças no tempo e entre linhas)
const BW = 1600;
const BH = 1000;
const BX0 = -1.7;
const BX1 = 1.7;
const BY0 = 3.0;
const BY1 = 5.6;
const BZ = 0.9;
const LANE_V = [250, 500, 750];
const bPt = (u: number, v: number, z = BZ): V3 => [BX0 + (BX1 - BX0) * u, BY1 - ((BY1 - BY0) * v) / BH, z];
const laneU = (u: number) => 0.1 + u * 0.72;
const BoardTop: React.FC<{ f: number; lit: number; wrong: number; lock: number; last: number }> = ({ f, lit, wrong, lock, last }) => (
  <svg width={BW} height={BH} viewBox={`0 0 ${BW} ${BH}`}>
    <rect width={BW} height={BH} fill="#0d1014" />
    <rect x={10} y={10} width={BW - 20} height={BH - 20} fill="none" stroke="rgba(207,232,255,0.35)" strokeWidth={4} />
    {LANE_V.map((v, k) => (
      <g key={k}>
        <line x1={BW * 0.1} y1={v} x2={BW * 0.82} y2={v} stroke={`rgba(207,232,255,${0.25 + 0.5 * lit})`} strokeWidth={6} />
        {Array.from({ length: 7 }).map((_, i) => (
          <g key={i}>
            <rect x={BW * laneU(i / 6) - 34} y={v - 34} width={68} height={68} rx={8} fill="rgba(207,232,255,0.05)" stroke="rgba(207,232,255,0.35)" strokeWidth={2.5} />
            {k === 2 && i === 3 ? <rect x={BW * laneU(i / 6) - 34} y={v - 34} width={68} height={68} rx={8} fill={`rgba(255,93,77,${0.5 * wrong})`} stroke={RED} strokeWidth={3} opacity={wrong} /> : null}
          </g>
        ))}
        <text x={BW * 0.03} y={v + 12} fill="rgba(207,232,255,0.75)" fontFamily={MONO} fontSize={34} letterSpacing={4}>{["A", "B", "C"][k]}</text>
      </g>
    ))}
    {/* as linhas convergem para a última casa: o Borealis / o catalisador */}
    {LANE_V.map((v, k) => <path key={k} d={`M ${BW * 0.82} ${v} Q ${BW * 0.86} ${v} ${BW * 0.88} 500`} fill="none" stroke={`rgba(255,210,122,${0.3 + 0.5 * last})`} strokeWidth={6} />)}
    <circle cx={BW * 0.92} cy={500} r={78} fill={`rgba(255,210,122,${0.12 + 0.3 * last})`} stroke="#ffd27a" strokeWidth={5} />
    <text x={BW * 0.92} y={612} textAnchor="middle" fill="#ffd27a" fontFamily={MONO} fontSize={30} letterSpacing={4}>CATALISADOR</text>
    {lock > 0 ? <circle cx={BW * 0.92} cy={500} r={100} fill="none" stroke="rgba(207,232,255,0.8)" strokeWidth={6} strokeDasharray="14 10" opacity={lock} transform={`rotate(${f} ${BW * 0.92} 500)`} /> : null}
    {Array.from({ length: 7 }).map((_, i) => <text key={i} x={BW * laneU(i / 6)} y={BH - 50} textAnchor="middle" fill="rgba(207,232,255,0.4)" fontFamily={MONO} fontSize={24}>{["1979", "1998", "2004", "2007", "2010", "2020", "2026"][i]}</text>)}
  </svg>
);
type Piece = { label: string; col: string; img?: string; u: number; v: number; h: number };
const Token: React.FC<{ e: Eye; pc: Piece; o?: number }> = ({ e, pc, o = 1 }) => {
  const base = bPt(pc.u, pc.v, BZ + pc.h);
  const b = proj(e, base);
  const t = proj(e, [base[0], base[1], base[2] + 0.13]);
  const rx = proj(e, [base[0] + 0.1, base[1], base[2]]);
  const gs = proj(e, bPt(pc.u, pc.v, BZ + 0.002));
  if (!b || !t || !rx || !gs) return null;
  const R = Math.abs(rx.x - b.x);
  const ry = R * 0.45;
  return (
    <g opacity={o}>
      {pc.h > 0.01 ? <ellipse cx={gs.x} cy={gs.y} rx={R} ry={ry} fill="rgba(0,0,0,0.45)" /> : null}
      <path d={`M ${b.x - R} ${b.y} L ${t.x - R} ${t.y} A ${R} ${ry} 0 0 0 ${t.x + R} ${t.y} L ${b.x + R} ${b.y} A ${R} ${ry} 0 0 1 ${b.x - R} ${b.y} Z`} fill="#1a1c22" stroke={pc.col} strokeWidth={2} />
      <ellipse cx={t.x} cy={t.y} rx={R} ry={ry} fill="#2a2e36" stroke={pc.col} strokeWidth={2.5} />
      {/* o crachá da peça, de pé em cima dela */}
      {/* o crachá em pé (retrato: o rosto inteiro, a versão deitada cortava nos olhos) */}
      <g transform={`translate(${t.x} ${t.y - 76}) scale(1.4)`}>
        <rect x={-36} y={-84} width={72} height={114} rx={8} fill="rgba(8,8,10,0.88)" stroke={pc.col} strokeWidth={2} />
        {pc.img ? (
          <>
            <clipPath id={`tk${pc.label}`}><rect x={-31} y={-79} width={62} height={76} rx={5} /></clipPath>
            <image href={staticFile(pc.img)} x={-31} y={-79} width={62} height={76} preserveAspectRatio="xMidYMid slice" clipPath={`url(#tk${pc.label})`} />
          </>
        ) : (
          <text x={0} y={-30} textAnchor="middle" fill={pc.col} fontFamily={FONT} fontWeight={800} fontSize={34}>{pc.label === "GORDON" ? "λ" : "◆"}</text>
        )}
        <text x={0} y={18} textAnchor="middle" fill={pc.col} fontFamily={MONO} fontSize={12} letterSpacing={1.5}>{pc.label}</text>
        <line x1={0} y1={30} x2={0} y2={54} stroke={pc.col} strokeWidth={1.5} />
      </g>
    </g>
  );
};
// o movimento de uma peça entre duas casas: sobe, atravessa, desce
const hop = (f: number, t0: number, d: number, a: [number, number], b: [number, number]): [number, number, number] => {
  const u = IOx((f - t0) / d);
  return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, Math.sin(Math.PI * u) * 0.3];
};
const seqHop = (f: number, moves: { t: number; d: number; to: [number, number] }[], start: [number, number]): [number, number, number] => {
  let cur = start;
  for (const m of moves) {
    if (f < m.t) return [cur[0], cur[1], 0];
    if (f < m.t + m.d) return hop(f, m.t, m.d, cur, m.to);
    cur = m.to;
  }
  return [cur[0], cur[1], 0];
};
export const HL11Board: React.FC<PR & { mode?: number }> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const mode = p.mode ?? 0;
  const [askAt, whyAt, diffAt, moveAt, outAt, inAt, wrongAt, alyxAt, linesAt] = ats(p, ["askAt", "whyAt", "diffAt", "moveAt", "outAt", "inAt", "wrongAt", "alyxAt", "linesAt"]);
  const [cantAt, prepAt, allAt, lastAt, needAt] = ats(p, ["cantAt", "prepAt", "allAt", "lastAt", "needAt"]);
  void askAt;
  const e: Eye = { x: 0.05 * Math.sin(f / 70), y: keys(f, [[0, 1.5], [life, 1.8]]), z: 2.3, yaw: 0, pitch: -0.5, F: 1080 };
  const U = (i: number) => laneU(i / 6);
  const V = (k: number) => LANE_V[k];
  // posições iniciais (modo 0) e finais (fim do modo 0 = começo do modo 1)
  const gord0: [number, number] = [U(1), V(0)];
  const alyx0: [number, number] = [U(2), V(1)];
  const adv0: [number, number] = [U(1), V(2)];
  const gord1: [number, number] = [U(3), V(0)];
  const alyx1: [number, number] = [U(4), V(2)];
  const adv1: [number, number] = [U(3), V(2)];
  let G3: [number, number, number];
  let A3: [number, number, number];
  let D3: [number, number, number];
  if (!mode) {
    G3 = seqHop(f, [{ t: moveAt, d: 26, to: gord1 }], gord0);
    A3 = seqHop(f, [{ t: outAt, d: 1e-3, to: alyx0 }, { t: inAt - 10, d: 22, to: [U(5), V(1)] }, { t: alyxAt, d: 18, to: [U(5), V(0)] }, { t: alyxAt + 26, d: 18, to: alyx1 }], alyx0);
    if (f >= outAt && f < inAt - 10) A3 = [alyx0[0], alyx0[1], 0.32 * P(f, outAt, 12)];
    D3 = seqHop(f, [{ t: wrongAt - 8, d: 20, to: adv1 }], adv0);
  } else {
    // modo 1: ele prepara o cenário — Gordon, Alyx e os Advisors encostam na última casa
    G3 = seqHop(f, [{ t: prepAt + 30, d: 26, to: [U(6), V(1)] }], gord1);
    A3 = seqHop(f, [{ t: prepAt + 75, d: 26, to: [U(6), V(0)] }], alyx1);
    D3 = seqHop(f, [{ t: prepAt + 125, d: 26, to: [U(6), V(2)] }], adv1);
  }
  const toU = (x: number) => x / BW;
  const toV = (y: number) => y;
  const pcs: Piece[] = [
    { label: "GORDON", col: AMB, u: toU(BW * G3[0]), v: toV(G3[1]), h: G3[2] },
    { label: "ALYX", col: ORANGE, img: "hl3silh/alyx_badge.jpg", u: toU(BW * A3[0]), v: toV(A3[1]), h: A3[2] },
    { label: "ADVISORS", col: VIO, u: toU(BW * D3[0]), v: toV(D3[1]), h: D3[2] },
  ];
  // a peça que ele tenta pôr no catalisador e é repelida
  const tryU = mode && f >= cantAt + 10 ? Math.min(0.86, 0.6 + P(f, cantAt + 10, 30) * 0.26) - P(f, cantAt + 42, 16) * 0.2 : 0;
  const lockFl = mode && f >= cantAt + 40 && f < cantAt + 52;
  const lit = mode ? 0.5 : P(f, linesAt, 12);
  const gmTop = proj(e, [0, 7.6, 1.85]);
  const gmBot = proj(e, [0, 7.6, 0]);
  const stepA = proj(e, bPt(U(6) + 0.02, V(1), BZ + 0.2));
  const stepB = proj(e, bPt(0.92, 500, BZ + 0.05));
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 30%, #121a22 0%, #05070a 70%, #020304 100%)", overflow: "hidden" }}>
      {/* o G-Man atrás do tabuleiro */}
      {gmTop && gmBot ? (() => {
        const h = gmBot.y - gmTop.y;
        return (
          <div style={{ position: "absolute", left: gmTop.x - h * 0.185, top: gmTop.y, width: h * 0.37, height: h, opacity: P(f, 0, 14), filter: "drop-shadow(0 0 4px rgba(220,240,255,0.55)) drop-shadow(0 0 18px rgba(190,230,240,0.3))" }}>
            <div style={{ position: "absolute", inset: 0, WebkitMaskImage: `url(${staticFile("hl3silh/gman_silh.png")})`, maskImage: `url(${staticFile("hl3silh/gman_silh.png")})`, WebkitMaskSize: "100% 100%", maskSize: "100% 100%", background: "linear-gradient(180deg, #2a3036, #07090b 80%)" }} />
          </div>
        );
      })() : null}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <Pinned e={e} w={BW} h={BH} corners={[bPt(0, 0), bPt(1, 0), bPt(1, BH), bPt(0, BH)]}>
          <BoardTop f={f} lit={lit} wrong={!mode ? P(f, wrongAt, 8) : 0} lock={mode ? P(f, cantAt, 12) * (lockFl ? (Math.floor(f / 2) % 2 ? 1 : 0.3) : 1) : 0} last={mode ? P(f, lastAt, 14) : 0} />
        </Pinned>
      </div>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {[...pcs].sort((a, b) => a.v - b.v).map((pc) => <Token key={pc.label} e={e} pc={pc} />)}
        {mode && f >= cantAt + 10 && f < cantAt + 70 ? <Token e={e} pc={{ label: "G-MAN", col: "#cfe8ff", u: tryU, v: 500, h: 0.25 }} o={1 - P(f, cantAt + 56, 12)} /> : null}
        {lockFl ? (() => {
          const q = proj(e, bPt(0.92, 500, BZ + 0.1));
          return q ? <circle cx={q.x} cy={q.y} r={120} fill="rgba(255,93,77,0.25)" stroke={RED} strokeWidth={4} /> : null;
        })() : null}
        {mode && f >= lastAt && stepA && stepB ? (
          <g opacity={P(f, lastAt, 10)}>
            <path d={`M ${stepA.x} ${stepA.y} Q ${(stepA.x + stepB.x) / 2} ${Math.min(stepA.y, stepB.y) - 80} ${stepB.x} ${stepB.y}`} fill="none" stroke="#ffd27a" strokeWidth={4} strokeDasharray="12 8" strokeDashoffset={-f * 3} />
          </g>
        ) : null}
      </svg>
      {/* as chamadas do que ele consegue fazer (modo 0) e do que não consegue (modo 1) */}
      <div style={{ position: "absolute", left: 100, top: 110, width: 640, fontFamily: MONO }}>
        {!mode && f >= whyAt && f < diffAt + 20 ? (
          <div style={{ padding: "12px 16px", background: "rgba(10,8,2,0.82)", borderLeft: `3px solid ${AMB}`, fontSize: 22, letterSpacing: 2, color: TXT, opacity: P(f, whyAt, 8) * (1 - P(f, diffAt + 6, 10)) }}>? SE O G-MAN SABIA TANTO, POR QUE NÃO FEZ ACONTECER</div>
        ) : null}
        {!mode
          ? ([[moveAt, "MOVE PEÇAS", "#cfe8ff"], [outAt, "TIRA ALGUÉM DE UM MOMENTO", "#cfe8ff"], [inAt, "DEVOLVE EM OUTRO", "#cfe8ff"], [wrongAt, "PÕE ONDE NÃO DEVERIA ESTAR", RED], [linesAt, "ENTRE LINHAS TEMPORAIS", "#ffd27a"]] as [number, string, string][]).map(([t0, s, c]) =>
              f >= t0 ? <div key={s} style={{ marginTop: 10, padding: "8px 14px", background: "rgba(8,10,14,0.82)", borderLeft: `3px solid ${c}`, fontSize: 20, letterSpacing: 3, color: TXT, opacity: P(f, t0, 8) }}>{s}</div> : null,
            )
          : null}
        {mode
          ? ([[cantAt, "ELE NÃO PODE COMPLETAR O CATALISADOR", RED], [prepAt, "PREPARA O CENÁRIO", "#cfe8ff"], [allAt, "TODO MUNDO NO LUGAR CERTO", GREEN], [lastAt, "O ÚLTIMO PASSO · DENTRO DAQUELA REALIDADE", "#ffd27a"]] as [number, string, string][]).map(([t0, s, c]) =>
              f >= t0 ? <div key={s} style={{ marginTop: 10, padding: "8px 14px", background: "rgba(8,10,14,0.82)", borderLeft: `3px solid ${c}`, fontSize: 20, letterSpacing: 3, color: TXT, opacity: P(f, t0, 8) }}>{s}</div> : null,
            )
          : null}
      </div>
      {!mode && f >= alyxAt && f < linesAt + 10 ? <div style={{ position: "absolute", right: 110, top: 150, fontFamily: MONO, fontSize: 20, letterSpacing: 4, color: ORANGE, opacity: P(f, alyxAt, 8) * (1 - P(f, linesAt, 10)) }}>COMO ACONTECEU COM A ALYX</div> : null}
      {mode && f >= needAt ? <div style={{ position: "absolute", left: 0, right: 0, bottom: 120, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 54, color: TXT, opacity: P(f, needAt, 8) }}>alguém precisa fazer por ele</div> : null}
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 1:18:49 a escolha precisava existir
export const HL11Choice: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [undAt, obeyAt, ensureAt, choiceAt] = ats(p, ["undAt", "obeyAt", "ensureAt", "choiceAt"]);
  void undAt;
  const G = useMemo(() => buildCoreRoom(), []);
  const e = coreEye(f, { y: keys(f, [[0, 5.6], [life, 7.4]]), pitch: keys(f, [[0, 0.04], [choiceAt - 10, 0.04], [choiceAt + 20, -0.04]]) });
  const ch = P(f, choiceAt, 30);
  const path = (side: number) => {
    const pts: string[] = [];
    for (let i = 0; i <= 30; i++) {
      const t = (i / 30) * ch;
      const q = proj(e, [side * (0.3 + 4.2 * Math.sin((t * Math.PI) / 2)), 10.2 + t * 6.5, 0.05]);
      if (q) pts.push(`${q.x.toFixed(0)},${q.y.toFixed(0)}`);
    }
    return pts.join(" ");
  };
  return (
    <AbsoluteFill style={{ background: "#020304", overflow: "hidden" }}>
      <CoreRoom e={e} f={f} G={G} o={{ rings: notches(0.62), ringO: 0.55, wound: 1 }}>
        {ch > 0 ? [-1, 1].map((s) => (
          <g key={s}>
            <polyline points={path(s)} fill="none" stroke={s < 0 ? "rgba(159,230,255,0.45)" : "rgba(255,210,122,0.45)"} strokeWidth={14} style={{ filter: "blur(5px)" }} />
            <polyline points={path(s)} fill="none" stroke={s < 0 ? ICE : "#ffd27a"} strokeWidth={3} />
            {ch > 0.95 ? (() => {
              const q = proj(e, [s * 4.5, 16.7, 0.05]);
              return q ? <circle cx={q.x} cy={q.y} r={10 + 3 * Math.sin(f / 5)} fill="none" stroke={s < 0 ? ICE : "#ffd27a"} strokeWidth={3} /> : null;
            })() : null}
          </g>
        )) : null}
        <FlagAt e={e} pt={[-0.9, 9.6, 0]} label="ALYX" col={ORANGE} f={f} sub="ENTENDE O TAMANHO DO QUE ACONTECEU" />
        {ch > 0.9 ? <text x={960} y={980} textAnchor="middle" fill={CREAM} fontFamily={MONO} fontSize={22} letterSpacing={8} opacity={P(f, choiceAt + 26, 10)}>A ESCOLHA EXISTE</text> : null}
      </CoreRoom>
      <div style={{ position: "absolute", right: 110, top: 140, width: 560, padding: "16px 20px", borderRadius: 12, background: "rgba(239,230,207,0.95)", color: "#2a2418", fontFamily: "'Courier New', monospace", boxShadow: "0 18px 40px rgba(0,0,0,0.6)", opacity: P(f, 6, 10) }}>
        <div style={{ fontSize: 15, letterSpacing: 4, borderBottom: "2px solid #2a2418", paddingBottom: 6 }}>A. VANCE · PREPARADA PARA</div>
        <div style={{ position: "relative", fontSize: 24, letterSpacing: 2, marginTop: 14 }}>
          OBEDECER O G-MAN
          {f >= obeyAt ? <div style={{ position: "absolute", left: -4, right: 120, top: "50%", height: 3, background: "#b02018", transform: `scaleX(${P(f, obeyAt + 6, 8)})`, transformOrigin: "left" }} /> : null}
        </div>
        {f >= ensureAt ? <div style={{ fontSize: 24, letterSpacing: 2, marginTop: 10, color: "#7a1810", opacity: P(f, ensureAt, 8) }}>GARANTIR QUE ALGUÉM CHEGASSE ATÉ AQUI</div> : null}
        {f >= choiceAt ? <div style={{ fontSize: 24, letterSpacing: 2, marginTop: 10, fontWeight: 700, opacity: P(f, choiceAt, 8) }}>QUE A ESCOLHA EXISTISSE</div> : null}
      </div>
      <Hud f={f} yaw={e.yaw} eye={e} blips={[{ x: -0.9, y: 9.6 }]} />
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 1:19:02 o alinhamento começou
export const HL11Align: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [shakeAt, radioAt, neverAt, reactAt, beganAt, closeAt, notAt, startAt, decideAt] = ats(p, ["shakeAt", "radioAt", "neverAt", "reactAt", "beganAt", "closeAt", "notAt", "startAt", "decideAt"]);
  const G = useMemo(() => buildCoreRoom(), []);
  const sh = f >= shakeAt ? Math.max(0, 1 - (f - shakeAt) / 50) * 1.4 + (f >= beganAt ? 0.35 : 0.15) : 0;
  const e = coreEye(f, { y: 7.2, shake: sh, pitch: keys(f, [[0, 0.04], [reactAt - 6, 0.04], [reactAt + 18, -0.3], [beganAt + 10, -0.3], [beganAt + 36, 0.02]]) });
  const al = 0.62 + P(f, beganAt, 60) * 0.3 + P(f, startAt, 40) * 0.08;
  const locked = al >= 0.995;
  const vals = Array.from({ length: 48 }).map((_, i) => {
    const base = 0.25 + 0.12 * Math.sin(i * 0.7 + f / 5);
    const sp = f >= neverAt ? Math.max(0, Math.sin((i - 30) / 4)) * (0.6 + 0.3 * Math.sin(f / 3)) : 0;
    return Math.min(1.25, base + sp);
  });
  return (
    <AbsoluteFill style={{ background: "#020304", overflow: "hidden" }}>
      <CoreRoom e={e} f={f} G={G} o={{ rings: notches(al), ringO: 1, labels: [0, 1, 2], wound: 1 + P(f, reactAt, 20) * 0.4, arcs: P(f, reactAt, 10), push: f >= closeAt ? P(f, closeAt, 12) : 0, beam: locked ? P(f, startAt + 40, 14) : 0, hot: P(f, reactAt, 30) }}>
        {/* poeira caindo do teto quando o navio treme */}
        {f >= shakeAt
          ? Array.from({ length: 40 }).map((_, i) => {
              const t = ((f - shakeAt) / 50 + rnd(i * 3)) % 1;
              return <rect key={i} x={rnd(i) * 1920} y={-20 + t * 1120} width={2} height={8 + rnd(i * 5) * 14} fill="rgba(220,210,190,0.5)" opacity={(1 - t) * Math.min(1, sh)} />;
            })
          : null}
        <Call e={e} f={f} pt={[2.8, 14.6, PIT_Z + 0.05]} from={reactAt + 10} until={beganAt + 20} text="O NÚCLEO REAGE À FERIDA" col={ORANGE} dx={-340} dy={-130} />
        <Call e={e} f={f} pt={[3.2, 9.8, 3.48]} from={closeAt + 6} until={notAt + 10} text="OS COMBINE" sub="PERTO O SUFICIENTE" col={VIO} dx={180} dy={-150} />
        <FlagAt e={e} pt={[-0.9, 9.6, 0]} label="ALYX" col={ORANGE} f={f} sub={f >= startAt ? "JÁ ESTÁ COMEÇANDO" : undefined} />
      </CoreRoom>
      {/* o rádio do Kleiner e os instrumentos */}
      {f >= radioAt ? (
        <div style={{ position: "absolute", left: 100, top: 120, width: 560, padding: "14px 18px", borderRadius: 12, background: "rgba(10,12,16,0.88)", border: `1.5px solid ${AMB}`, fontFamily: MONO, opacity: P(f, radioAt, 8) * (1 - P(f, notAt, 14)) }}>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <div style={{ width: 70, height: 70, borderRadius: 8, overflow: "hidden", border: `2px solid ${AMB}`, backgroundImage: `url(${staticFile("hl3silh/kleiner_retrato.png")})`, backgroundSize: "cover", backgroundPosition: "50% 30%" }} />
            <div>
              <div style={{ fontSize: 15, letterSpacing: 5, color: AMB }}>RÁDIO · DR. KLEINER</div>
              <div style={{ fontSize: 20, letterSpacing: 2, color: TXT, marginTop: 4 }}>OS INSTRUMENTOS ACABARAM DE REGISTRAR</div>
            </div>
          </div>
          {f >= neverAt ? (
            <div style={{ marginTop: 12, opacity: P(f, neverAt, 8) }}>
              <svg width={520} height={110}>
                <line x1={0} y1={30} x2={520} y2={30} stroke="rgba(255,93,77,0.6)" strokeDasharray="6 6" />
                <text x={518} y={24} textAnchor="end" fill={RED} fontFamily={MONO} fontSize={13} letterSpacing={2}>LIMITE DA ESCALA</text>
                {vals.map((v, i) => <rect key={i} x={i * 10.8} y={110 - v * 80} width={7} height={v * 80} fill={v > 1 ? RED : "#ffd27a"} />)}
              </svg>
              <div style={{ fontSize: 18, letterSpacing: 3, color: RED, marginTop: 4 }}>ALGO NUNCA VISTO ANTES</div>
            </div>
          ) : null}
        </div>
      ) : null}
      {f >= notAt ? (
        <div style={{ position: "absolute", left: 100, top: 130, width: 680, fontFamily: MONO }}>
          <div style={{ position: "relative", display: "inline-block", fontSize: 24, letterSpacing: 3, color: "rgba(242,240,247,0.6)", opacity: P(f, notAt, 8) }}>
            IMPEDIR QUE O CATALISADOR EXISTA
            <div style={{ position: "absolute", left: -4, right: -4, top: "50%", height: 3, background: RED, transform: `scaleX(${P(f, notAt + 10, 8)})`, transformOrigin: "left" }} />
          </div>
          {f >= decideAt ? (
            <div style={{ marginTop: 22, padding: "14px 22px", background: "rgba(10,8,2,0.82)", border: `1.5px solid ${AMB}`, borderRadius: 10, color: AMB, opacity: P(f, decideAt, 8) }}>
              <div style={{ fontSize: 15, letterSpacing: 5, opacity: 0.8 }}>NOVO OBJETIVO</div>
              <div style={{ fontSize: 30, letterSpacing: 3, marginTop: 6 }}>DECIDIR O QUE FAZER COM ELE</div>
            </div>
          ) : null}
        </div>
      ) : null}
      {f >= beganAt && f < notAt ? <div style={{ position: "absolute", right: 110, top: 150, fontFamily: MONO, fontSize: 22, letterSpacing: 6, color: "#ffd27a", opacity: P(f, beganAt, 8) * (1 - P(f, notAt - 8, 8)) }}>O ALINHAMENTO COMEÇOU · {Math.round(al * 100)}%</div> : null}
      {f >= startAt ? <div style={{ position: "absolute", right: 110, top: 150, fontFamily: MONO, fontSize: 22, letterSpacing: 6, color: "#ffd27a", opacity: P(f, startAt, 8) }}>ALINHAMENTO · {Math.round(al * 100)}%</div> : null}
      <Hud f={f} yaw={e.yaw} eye={e} blips={[{ x: -0.9, y: 9.6 }]} msg={f >= shakeAt && f < radioAt ? "O NAVIO INTEIRO TREME" : undefined} msgCol={RED} />
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ================================================================================================= MÓDULO 12 · leva A (1:19:27 → 1:22:05)
// o Borealis de perfil (silhueta do navio de pesquisa) para as telas 2D
const BorealisSide: React.FC<{ x: number; y: number; s?: number; col?: string; o?: number }> = ({ x, y, s = 1, col = ICE, o = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>
    <path d="M -120 0 L 110 0 L 135 -26 L 96 -22 L -112 -22 Z" fill="rgba(10,30,40,0.9)" stroke={col} strokeWidth={2.4} />
    <path d="M -70 -22 L -70 -52 L 10 -52 L 22 -36 L 22 -22" fill="rgba(10,30,40,0.9)" stroke={col} strokeWidth={2.2} />
    <rect x={-58} y={-46} width={12} height={8} fill={col} opacity={0.6} />
    <rect x={-38} y={-46} width={12} height={8} fill={col} opacity={0.6} />
    <rect x={-18} y={-46} width={12} height={8} fill={col} opacity={0.6} />
    <line x1={-40} y1={-52} x2={-40} y2={-80} stroke={col} strokeWidth={2} />
    <path d="M 40 -22 L 60 -60 L 80 -22" fill="none" stroke={col} strokeWidth={2} />
  </g>
);
const PersonCard: React.FC<{ f: number; at: number; img: string; name: string; line: string; col?: string; x: number; y: number; strike?: string; strikeAt?: number; after?: string }> = ({ f, at: t0, img, name, line, col = AMB, x, y, strike, strikeAt = 1e9, after }) =>
  f >= t0 ? (
    <div style={{ position: "absolute", left: x, top: y + (1 - P(f, t0, 12)) * 40, width: 500, display: "flex", gap: 14, padding: 14, borderRadius: 12, background: "rgba(10,10,12,0.92)", border: `1.5px solid ${col}`, boxShadow: "0 18px 40px rgba(0,0,0,0.6)", fontFamily: MONO, opacity: P(f, t0, 12) }}>
      <div style={{ width: 96, height: 112, flexShrink: 0, borderRadius: 8, overflow: "hidden", border: `2px solid ${col}`, backgroundImage: `url(${staticFile(img)})`, backgroundSize: "cover", backgroundPosition: "50% 25%" }} />
      <div>
        <div style={{ fontSize: 16, letterSpacing: 5, color: col }}>{name}</div>
        <div style={{ fontSize: 22, letterSpacing: 2, color: TXT, marginTop: 8 }}>{line}</div>
        {strike ? (
          <div style={{ position: "relative", display: "inline-block", fontSize: 18, letterSpacing: 2, color: "rgba(242,240,247,0.65)", marginTop: 8 }}>
            {strike}
            {f >= strikeAt ? <div style={{ position: "absolute", left: -3, right: -3, top: "50%", height: 3, background: RED, transform: `scaleX(${P(f, strikeAt, 8)})`, transformOrigin: "left" }} /> : null}
          </div>
        ) : null}
        {after && f >= strikeAt + 8 ? <div style={{ fontSize: 20, letterSpacing: 2, color: col, marginTop: 6, opacity: P(f, strikeAt + 8, 8) }}>{after}</div> : null}
      </div>
    </div>
  ) : null;
// ---------------------------------------------------------------- 1:19:27 o catalisador como arma (o link do Kleiner no HEV)
export const HL12Weapon: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [alignAt, instrAt, crossAt, notOnlyAt, againstAt, fireAt, weaponAt, structAt, solAt, klAt, magAt, eliAt, destroyAt, useAt] = ats(p, ["alignAt", "instrAt", "crossAt", "notOnlyAt", "againstAt", "fireAt", "weaponAt", "structAt", "solAt", "klAt", "magAt", "eliAt", "destroyAt", "useAt"]);
  void alignAt;
  const G = useMemo(() => buildCoreRoom(), []);
  const e = coreEye(f, { y: 7.2, shake: 0.25, pitch: 0.04 });
  const pan = P(f, instrAt, 18);
  const cross = P(f, crossAt, 30);
  const wav = (i: number, k: number) => 0.5 + 0.32 * Math.sin(i * 0.33 + k) * Math.sin(i * 0.07 + 1.3) + 0.08 * Math.sin(i * 1.7 + f / 4);
  const W2 = 700;
  const H2 = 210;
  const ptsA = Array.from({ length: 70 }).map((_, i) => `${(i / 69) * W2},${H2 - wav(i, 0) * H2}`).join(" ");
  const ptsB = Array.from({ length: 70 }).map((_, i) => `${(i / 69) * W2},${H2 - wav(i, 0) * H2 + (1 - cross) * 40 * Math.sin(i / 6)}`).join(" ");
  const sch = P(f, weaponAt, 16);
  const beam = P(f, weaponAt + 18, 24);
  const hit = P(f, structAt, 16);
  const dim = pan * (1 - P(f, klAt + 10, 20) * 0.3);
  return (
    <AbsoluteFill style={{ background: "#020304", overflow: "hidden" }}>
      <CoreRoom e={e} f={f} G={G} o={{ rings: notches(0.93), ringO: 1, labels: [], wound: 1.2, arcs: 0.5, push: 1, hot: 0.6 }} />
      <AbsoluteFill style={{ background: `rgba(2,3,4,${0.55 * dim})` }} />
      {/* o painel do HEV com o link do Kleiner */}
      {f >= instrAt ? (
        <div style={{ position: "absolute", left: 160, top: 110, width: 1600, height: 640, borderRadius: 14, border: `1.5px solid ${AMB}`, background: "linear-gradient(180deg, rgba(20,14,4,0.82), rgba(8,6,2,0.9))", fontFamily: MONO, color: AMB, transform: `scale(${0.6 + 0.4 * pan})`, transformOrigin: "10% 10%", opacity: pan, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 22px", borderBottom: "1px solid rgba(255,178,46,0.35)" }}>
            <div style={{ width: 46, height: 46, borderRadius: 6, overflow: "hidden", border: `2px solid ${AMB}`, backgroundImage: `url(${staticFile("hl3silh/kleiner_retrato.png")})`, backgroundSize: "cover", backgroundPosition: "50% 30%" }} />
            <span style={{ fontSize: 18, letterSpacing: 6 }}>LINK · DR. KLEINER · OS INSTRUMENTOS ACOMPANHAM O PROCESSO INTEIRO</span>
          </div>
          {f < weaponAt + 10 ? (
            <svg width={1600} height={580} style={{ position: "absolute", left: 0, top: 70, opacity: 1 - sch }}>
              <g transform="translate(60 40)">
                <text x={0} y={-10} fill={AMB} fontFamily={MONO} fontSize={16} letterSpacing={4}>LEITURA DO NÚCLEO · AGORA</text>
                <rect x={0} y={0} width={W2} height={H2} fill="rgba(255,178,46,0.04)" stroke="rgba(255,178,46,0.35)" />
                <polyline points={ptsA} fill="none" stroke="#ffd27a" strokeWidth={2.5} />
              </g>
              <g transform={`translate(${840 - cross * 780} ${40})`}>
                <text x={0} y={-10} fill={CREAM} fontFamily={MONO} fontSize={16} letterSpacing={4} opacity={f >= crossAt ? 1 : 0.4}>ARQUIVOS · J. MOSSMAN</text>
                <rect x={0} y={0} width={W2} height={H2} fill={cross > 0.9 ? "transparent" : "rgba(239,230,207,0.08)"} stroke="rgba(239,230,207,0.4)" />
                <polyline points={ptsB} fill="none" stroke={CREAM} strokeWidth={2} strokeDasharray="8 5" />
              </g>
              {cross > 0.95 ? <text x={60} y={300} fill={GREEN} fontFamily={MONO} fontSize={20} letterSpacing={4} opacity={P(f, crossAt + 30, 8)}>✓ AS DUAS CURVAS CORRESPONDEM</text> : null}
              {/* o catalisador: para o que os Advisors querem / contra eles */}
              {f >= notOnlyAt ? (
                <g transform="translate(60 360)" opacity={P(f, notOnlyAt, 10)}>
                  <rect x={0} y={0} width={300} height={70} rx={10} fill="rgba(255,210,122,0.1)" stroke="#ffd27a" strokeWidth={2} />
                  <text x={150} y={45} textAnchor="middle" fill="#ffd27a" fontFamily={MONO} fontSize={22} letterSpacing={4}>O CATALISADOR</text>
                  <path d="M 300 35 L 520 -10" stroke={VIO} strokeWidth={3} />
                  <text x={530} y={-4} fill={VIO} fontFamily={MONO} fontSize={20} letterSpacing={3}>O QUE OS ADVISORS QUEREM</text>
                  {f >= againstAt ? (
                    <g opacity={P(f, againstAt, 10)}>
                      <path d="M 300 35 L 520 90" stroke={AMB} strokeWidth={3} />
                      <text x={530} y={96} fill={AMB} fontFamily={MONO} fontSize={20} letterSpacing={3}>A MESMA CONDIÇÃO · CONTRA ELES</text>
                    </g>
                  ) : null}
                  {f >= fireAt ? (
                    <g opacity={P(f, fireAt, 10)}>
                      <rect x={1060} y={50} width={380} height={70} rx={10} fill="rgba(255,93,77,0.1)" stroke={RED} strokeWidth={2} />
                      <text x={1250} y={94} textAnchor="middle" fill={RED} fontFamily={MONO} fontSize={20} letterSpacing={3}>SE CONTROLAREM O DISPARO</text>
                    </g>
                  ) : null}
                </g>
              ) : null}
            </svg>
          ) : null}
          {/* o esquema: o Borealis disparando contra a estrutura Combine na Terra */}
          {sch > 0 ? (
            <svg width={1600} height={580} style={{ position: "absolute", left: 0, top: 70, opacity: sch }}>
              <BorealisSide x={300} y={330} s={1.6} col={ICE} />
              <text x={300} y={420} textAnchor="middle" fill={ICE} fontFamily={MONO} fontSize={20} letterSpacing={4}>O BOREALIS</text>
              {beam > 0 ? (
                <g>
                  <path d={`M 520 260 Q 820 ${120} ${520 + 600 * beam} ${260 - 10 * beam}`} fill="none" stroke="rgba(255,210,122,0.55)" strokeWidth={18} style={{ filter: "blur(6px)" }} />
                  <path d={`M 520 260 Q 820 ${120} ${520 + 600 * beam} ${260 - 10 * beam}`} fill="none" stroke="#fff0c8" strokeWidth={3} />
                </g>
              ) : null}
              <Globe f={f} cx={1240} cy={280} R={180} rot={f * 0.25} nodes={1} links={1} sync={0} hit={hit} />
              {f >= structAt ? <text x={1240} y={510} textAnchor="middle" fill="#ffd27a" fontFamily={MONO} fontSize={20} letterSpacing={3} opacity={P(f, structAt, 8)}>A ESTRUTURA COMBINE NA TERRA</text> : null}
              <text x={60} y={60} fill={AMB} fontFamily={FONT} fontWeight={800} fontSize={54}>o Borealis pode virar uma arma</text>
            </svg>
          ) : null}
        </div>
      ) : null}
      {f >= solAt ? <div style={{ position: "absolute", left: 0, right: 0, top: 780, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 60, color: TXT, opacity: P(f, solAt, 10) * (1 - P(f, klAt, 12)) }}>a solução que todo mundo procurou?</div> : null}
      <PersonCard f={f} at={klAt} img="hl3silh/kleiner_retrato.png" name="DR. KLEINER" line="VÊ UMA CHANCE DE VENCER" x={110} y={770} />
      <PersonCard f={f} at={magAt} img="hl3silh/magnusson_badge.jpg" name="DR. MAGNUSSON" line="COMO ESTABILIZAR O SISTEMA" x={710} y={770} />
      <PersonCard f={f} at={eliAt} img="hl3silh/eli_retrato.png" name="ELI VANCE" line="HESITA" x={1310} y={770} strike="DESTRUIR O BOREALIS" strikeAt={useAt} after="USAR PRIMEIRO · ACABAR COM OS COMBINE" />
      {f >= destroyAt && f < useAt + 20 ? <div style={{ position: "absolute", left: 1310, top: 930, fontFamily: MONO, fontSize: 16, letterSpacing: 3, color: CREAM, opacity: P(f, destroyAt, 8) * (1 - P(f, useAt + 8, 10)) }}>O QUE ELE SEMPRE QUIS</div> : null}
      <Hud f={f} yaw={e.yaw} eye={e} blips={[]} msg={f < instrAt ? "O ALINHAMENTO COMEÇOU" : undefined} msgCol="#ffd27a" />
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 1:20:19 a Alyx diz não (quem controla depois)
export const HL12Holds: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [noAt, notTimeAt, seenAt, weaponAt, afterAt, ifAt, notSolveAt, whoAt, todayAt, genAt, specAt, combAt, quoteAt, quote2At] = ats(p, ["noAt", "notTimeAt", "seenAt", "weaponAt", "afterAt", "ifAt", "notSolveAt", "whoAt", "todayAt", "genAt", "specAt", "combAt", "quoteAt", "quote2At"]);
  void noAt;
  const G = useMemo(() => buildCoreRoom(), []);
  const e = coreEye(f, { y: keys(f, [[0, 6.6], [quoteAt, 5.4], [life, 5.2]]), shake: 0.15, pitch: keys(f, [[0, 0.04], [afterAt, 0.04], [afterAt + 20, 0.0]]) });
  const owners: [number, string, string][] = [[todayAt, "A RESISTÊNCIA · HOJE", AMB], [genAt, "OUTRA GERAÇÃO", CREAM], [specAt, "OUTRA ESPÉCIE", GREEN], [combAt, "OS COMBINE · DE VOLTA", RED]];
  const cur = owners.filter(([t0]) => f >= t0).pop();
  const q = proj(e, CORE);
  const quote = f >= quoteAt;
  return (
    <AbsoluteFill style={{ background: "#020304", overflow: "hidden" }}>
      <CoreRoom e={e} f={f} G={G} o={{ rings: notches(0.93), ringO: f >= ifAt ? 1 : 0.6, labels: f >= ifAt && f < notSolveAt + 30 ? [0, 1, 2] : [], wound: 1.1, push: 0.6, hot: 0.4 }}>
        {/* o que a resistência vê: a mira de uma arma em cima do núcleo */}
        {f >= weaponAt && f < afterAt + 20 && q ? (
          <g opacity={P(f, weaponAt, 8) * (1 - P(f, afterAt + 6, 14))}>
            <circle cx={q.x} cy={q.y} r={260} fill="none" stroke={AMB} strokeWidth={2.5} />
            <circle cx={q.x} cy={q.y} r={180} fill="none" stroke={AMB} strokeWidth={1.5} strokeDasharray="10 8" />
            {[0, 1, 2, 3].map((k) => {
              const a = (k * Math.PI) / 2;
              return <line key={k} x1={q.x + Math.cos(a) * 200} y1={q.y + Math.sin(a) * 200} x2={q.x + Math.cos(a) * 300} y2={q.y + Math.sin(a) * 300} stroke={AMB} strokeWidth={3} />;
            })}
            <text x={q.x} y={q.y - 290} textAnchor="middle" fill={AMB} fontFamily={MONO} fontSize={22} letterSpacing={5}>A RESISTÊNCIA VÊ UMA ARMA</text>
          </g>
        ) : null}
        <FlagAt e={e} pt={[-0.9, 9.6, 0]} label="ALYX" col={ORANGE} f={f} sub={f >= afterAt ? "OLHA O QUE VEM DEPOIS" : f >= seenAt ? "JÁ VIU ESSA ESCOLHA" : f >= notTimeAt ? "NÃO É PARA GANHAR TEMPO" : "NÃO"} />
      </CoreRoom>
      {/* ela já viu essa escolha: as janelas das outras versões piscam atrás dela */}
      {f >= seenAt && f < weaponAt + 10 ? (
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: P(f, seenAt, 10) * (1 - P(f, weaponAt, 10)) }}>
          {([["union", 0, "PRÓXIMA DA UNION", 1180, 160], ["lose", 0, "A HUMANIDADE PERDE", 1320, 420], ["win", 0, "A HUMANIDADE VENCE", 1160, 680]] as [VKind, number, string, number, number][]).map(([k, v, t2, x, y], i) => (
            <div key={i} style={{ position: "absolute", left: x, top: y, width: 480, height: 300, transform: "scale(0.62)", transformOrigin: "0 0", opacity: rnd(Math.floor(f / 4) + i * 5) > 0.2 ? 0.85 : 0.35 }}>
              <VersionPanel f={f - seenAt} kind={k} v={v} title={t2} lit={0.7} />
            </div>
          ))}
        </div>
      ) : null}
      {/* o que vem depois: a placa de quem controla o Borealis vai trocando */}
      {f >= afterAt && !quote ? (
        <div style={{ position: "absolute", left: 110, top: 130, width: 700, fontFamily: MONO, opacity: P(f, afterAt, 10) * (1 - P(f, quoteAt - 10, 10)) }}>
          <div style={{ fontSize: 18, letterSpacing: 5, color: CREAM }}>A ALYX OLHA PARA O QUE ACONTECE DEPOIS</div>
          {f >= ifAt ? <div style={{ fontSize: 20, letterSpacing: 2, color: TXT, marginTop: 14, opacity: P(f, ifAt, 8) }}>SE USAREM O CATALISADOR E DEIXAREM BOREALIS, NÚCLEO E FERIDA EXISTINDO</div> : null}
          {f >= notSolveAt ? <div style={{ fontSize: 22, letterSpacing: 3, color: RED, marginTop: 12, opacity: P(f, notSolveAt, 8) }}>NÃO RESOLVERAM O PROBLEMA</div> : null}
          {f >= whoAt ? <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 46, color: TXT, marginTop: 10, opacity: P(f, whoAt, 8) }}>só mudaram quem controla</div> : null}
        </div>
      ) : null}
      {f >= todayAt && !quote ? (
        <div style={{ position: "absolute", left: 1220, top: 640, width: 560, fontFamily: MONO, opacity: P(f, todayAt, 8) * (1 - P(f, quoteAt - 10, 10)) }}>
          <div style={{ padding: "12px 16px", borderRadius: 10, background: "rgba(8,8,10,0.9)", border: `2px solid ${cur ? cur[2] : AMB}` }}>
            <div style={{ fontSize: 15, letterSpacing: 5, color: "rgba(242,240,247,0.6)" }}>CONTROLE DO BOREALIS</div>
            <div key={cur ? cur[1] : ""} style={{ fontSize: 28, letterSpacing: 3, color: cur ? cur[2] : AMB, marginTop: 6 }}>{cur ? cur[1] : ""}</div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            {owners.map(([t0, s, c]) => <div key={s} style={{ flex: 1, height: 8, borderRadius: 4, background: f >= t0 ? c : "rgba(242,240,247,0.12)" }} />)}
          </div>
        </div>
      ) : null}
      {/* a frase dela */}
      {quote ? (
        <AbsoluteFill style={{ background: `rgba(2,3,4,${0.82 * P(f, quoteAt, 12)})`, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 180px", fontFamily: FONT }}>
          <div style={{ fontSize: 22, letterSpacing: 6, color: ORANGE, fontFamily: MONO, opacity: P(f, quoteAt, 8) }}>ALYX</div>
          <div style={{ fontWeight: 800, fontSize: 56, color: TXT, marginTop: 12, opacity: P(f, quoteAt + 4, 10) }}>vocês estão olhando para uma arma.</div>
          {f >= quote2At ? <div style={{ fontWeight: 800, fontSize: 56, color: CREAM, marginTop: 14, opacity: P(f, quote2At, 10) }}>eu estou olhando para todas as vezes que alguém decidiu que seria a última pessoa a usá-la.</div> : null}
        </AbsoluteFill>
      ) : null}
      <Hud f={f} yaw={e.yaw} eye={e} blips={[{ x: -0.9, y: 9.6 }]} />
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 1:20:59 a pergunta do Varga (os registros de continuidade)
const REC_LINES = [
  "PROC. 7-Ψ · CONDIÇÃO DE ALINHAMENTO · REGISTRO 0412",
  "SUJEITO · RESPOSTA À ANOMALIA · ESTÁVEL",
  "OBJETIVO DECLARADO · CONTINUIDADE",
  "FASE SEGUINTE · ASCENSÃO",
  "AMOSTRAS · CONSCIÊNCIAS PRESERVADAS FORA DO CORPO",
  "OBSERVAÇÃO · RESULTADO NÃO VERIFICADO",
  "REGISTRO ENCERRADO · ACESSO RESTRITO AOS ADVISORS",
];
const REC_HOT = ["CONTINUIDADE", "ASCENSÃO", "CONSCIÊNCIAS PRESERVADAS FORA DO CORPO"];
export const HL12Varga: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [attAt, warAt, recAt, woundAt, askAt, qAt, silAt, promAt] = ats(p, ["attAt", "warAt", "recAt", "woundAt", "askAt", "qAt", "silAt", "promAt"]);
  void attAt;
  const sil = f >= silAt;
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 40% 45%, #0e1418 0%, #040607 80%)", overflow: "hidden" }}>
      {/* o terminal com os registros que chegaram junto com os dados */}
      <div style={{ position: "absolute", left: 120, top: 120, width: 1060, height: 700, borderRadius: 10, border: "2px solid rgba(159,230,255,0.45)", background: "linear-gradient(180deg, rgba(10,26,32,0.92), rgba(4,12,16,0.95))", fontFamily: MONO, color: ICE, padding: "26px 32px", boxSizing: "border-box" }}>
        <div style={{ fontSize: 16, letterSpacing: 6, borderBottom: "1px solid rgba(159,230,255,0.3)", paddingBottom: 10 }}>REGISTROS · BOREALIS · DADOS DA MOSSMAN</div>
        {f < recAt ? (
          <div style={{ display: "flex", gap: 14, marginTop: 40, opacity: P(f, warAt, 8) }}>
            {["GUERRA", "TECNOLOGIA", "ACABAR COM OS COMBINE"].map((s, i) => <div key={s} style={{ padding: "10px 16px", border: `1.5px solid ${AMB}`, color: AMB, fontSize: 22, letterSpacing: 3, opacity: P(f, warAt + i * 8, 8) }}>{s}</div>)}
          </div>
        ) : (
          REC_LINES.map((ln, i) => {
            const t0 = recAt + i * 12;
            if (f < t0) return null;
            const hot = REC_HOT.find((h) => ln.includes(h));
            const typed = ln.slice(0, Math.floor((f - t0) * 3));
            const lit = hot && f >= t0 + 20;
            return (
              <div key={i} style={{ fontSize: 24, letterSpacing: 2, marginTop: 22, color: TXT }}>
                {lit && hot ? (
                  <>
                    {ln.split(hot)[0]}
                    <span style={{ background: "rgba(255,178,46,0.25)", color: AMB, padding: "0 6px", boxShadow: `0 0 0 1.5px ${AMB}` }}>{hot}</span>
                    {ln.split(hot)[1]}
                  </>
                ) : (
                  typed
                )}
              </div>
            );
          })
        )}
      </div>
      {/* o Varga ouvindo pelo rádio */}
      <div style={{ position: "absolute", left: 1260, top: 160, width: 540, padding: 18, borderRadius: 12, background: "rgba(10,10,12,0.92)", border: `1.5px solid ${ORANGE}`, fontFamily: MONO }}>
        <div style={{ display: "flex", gap: 16 }}>
          <div style={{ width: 130, height: 150, borderRadius: 8, overflow: "hidden", border: `2px solid ${ORANGE}`, backgroundImage: `url(${staticFile("hl3silh/varga_retrato.png")})`, backgroundSize: "cover", backgroundPosition: "50% 25%" }} />
          <div>
            <div style={{ fontSize: 16, letterSpacing: 5, color: ORANGE }}>VARGA · NO RÁDIO</div>
            <div style={{ fontSize: 20, letterSpacing: 2, color: TXT, marginTop: 10 }}>{f >= woundAt ? "TOCA NA FERIDA QUE ELE CARREGA" : "COMEÇA A PRESTAR ATENÇÃO"}</div>
          </div>
        </div>
        <svg width={500} height={70} style={{ marginTop: 14 }}>
          {Array.from({ length: 50 }).map((_, i) => {
            const talk = f >= askAt && f < silAt;
            const v = talk ? 0.2 + 0.8 * Math.abs(Math.sin(i * 0.9 + f / 2) * Math.sin(i * 0.31 + f / 7)) : 0.04;
            return <rect key={i} x={i * 10} y={35 - v * 30} width={6} height={Math.max(2, v * 60)} fill={talk ? ORANGE : "rgba(242,240,247,0.3)"} />;
          })}
        </svg>
        {sil ? <div style={{ fontSize: 16, letterSpacing: 4, color: "rgba(242,240,247,0.6)", marginTop: 6, opacity: P(f, silAt, 8) }}>SILÊNCIO NO RÁDIO · NINGUÉM RESPONDE</div> : null}
      </div>
      {f >= qAt ? (
        <div style={{ position: "absolute", left: 120, right: 120, top: 860, fontFamily: FONT, fontWeight: 800, fontSize: 54, color: TXT, opacity: P(f, qAt, 10) }}>
          “se o corpo termina, alguma coisa pode continuar?”
        </div>
      ) : null}
      {f >= promAt ? (
        <div style={{ position: "absolute", left: 1260, top: 560, width: 540, padding: "14px 18px", borderRadius: 12, background: "rgba(16,10,24,0.9)", border: `1.5px solid ${VIO}`, fontFamily: MONO, opacity: P(f, promAt, 10) }}>
          <svg width={500} height={120}>
            <AdvisorArt x={90} y={60} w={150} f={f} lit={0.8} id="vgp" />
            <text x={190} y={52} fill={VIO} fontFamily={MONO} fontSize={18} letterSpacing={3}>A PROMESSA QUE OS</text>
            <text x={190} y={80} fill={VIO} fontFamily={MONO} fontSize={18} letterSpacing={3}>ADVISORS PERSEGUEM</text>
          </svg>
        </div>
      ) : null}
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life, 6), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 1:21:30 o que os Advisors acreditam: a porta
export const HL12Door: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [explAt, dontAt, truthAt, contAt, escAt, bodyAt, worldAt, lifeAt, perpAt, neverAt, maybeAt, doorAt, broughtAt] = ats(p, ["explAt", "dontAt", "truthAt", "contAt", "escAt", "bodyAt", "worldAt", "lifeAt", "perpAt", "neverAt", "maybeAt", "doorAt", "broughtAt"]);
  void explAt;
  const G = useMemo(() => buildCoreRoom(), []);
  const e = coreEye(f, { y: keys(f, [[0, 4.4], [life, 6.0]]), pitch: 0.05 });
  const cq = proj(e, CORE);
  const fog = P(f, dontAt, 20);
  const door = P(f, doorAt, 20);
  const adv = proj(e, [-1.6, 10.6, 2.4 + 0.08 * Math.sin(f / 20)]);
  const AS = useAdvScene([{ pos: [-1.6, 10.6, 2.4], look: [CORE[0], CORE[1], CORE[2]], reach: 0.3 }], f, 2.4);
  const chips: [number, string][] = [[bodyAt, "DE UM CORPO"], [worldAt, "DE UM MUNDO"], [lifeAt, "DE UMA VIDA"]];
  return (
    <AbsoluteFill style={{ background: "#020304", overflow: "hidden" }}>
      <CoreRoom e={e} f={f} G={G} o={{ rings: notches(0.93), ringO: 0.8, wound: 1, hot: 0.3, extras: AS.extras, glLights: AS.lights }}>
        {/* do outro lado do catalisador: névoa, um ponto de interrogação; quando vira "a porta", o anel maior acende como um portal */}
        {cq && fog > 0 ? (
          <g>
            <defs>
              <radialGradient id="drFog" cx="0.5" cy="0.5" r="0.5">
                <stop offset="0" stopColor="rgba(220,230,240,0.55)" />
                <stop offset="0.7" stopColor="rgba(160,170,190,0.18)" />
                <stop offset="1" stopColor="rgba(160,170,190,0)" />
              </radialGradient>
            </defs>
            <circle cx={cq.x + 8 * Math.sin(f / 30)} cy={cq.y} r={300} fill="url(#drFog)" opacity={fog * 0.8} />
            <text x={cq.x} y={cq.y + 40} textAnchor="middle" fill="rgba(242,240,247,0.85)" fontFamily={FONT} fontWeight={800} fontSize={120} opacity={fog * (1 - door * 0.6)}>?</text>
          </g>
        ) : null}
        {door > 0 && cq ? (
          <g opacity={door}>
            <ellipse cx={cq.x} cy={cq.y} rx={330} ry={360} fill="none" stroke="#ffd27a" strokeWidth={8} style={{ filter: "drop-shadow(0 0 16px #ffd27a)" }} />
            <text x={cq.x} y={cq.y - 380} textAnchor="middle" fill="#ffd27a" fontFamily={MONO} fontSize={24} letterSpacing={6}>A PORTA</text>
          </g>
        ) : null}
        {/* o Advisor diante dela, e o caminho que a crença fez até aqui */}
        {adv && !AS.ready ? <AdvisorArt x={adv.x} y={adv.y} w={Math.min(320, 1100 / adv.d)} f={f} lit={0.7} id="door" o={0.85} /> : null}
        {f >= broughtAt && adv ? (
          <path d={`M -40 ${adv.y + 300} Q ${adv.x * 0.5} ${adv.y + 260} ${adv.x - 40} ${adv.y + 20}`} fill="none" stroke={VIO} strokeWidth={3} strokeDasharray="10 8" strokeDashoffset={-f * 3} opacity={P(f, broughtAt, 12)} />
        ) : null}
      </CoreRoom>
      <div style={{ position: "absolute", left: 100, top: 120, width: 660, fontFamily: MONO }}>
        {f >= dontAt ? <div style={{ fontSize: 22, letterSpacing: 3, color: TXT, opacity: P(f, dontAt, 8) }}>OS ADVISORS NÃO SABEM O QUE EXISTE DO OUTRO LADO</div> : null}
        {f >= truthAt ? <div style={{ fontSize: 18, letterSpacing: 3, color: "rgba(242,240,247,0.65)", marginTop: 8, opacity: P(f, truthAt, 8) }}>NEM A VERDADE COMPLETA</div> : null}
        {f >= contAt ? <div style={{ marginTop: 18, padding: "10px 14px", borderLeft: `3px solid ${VIO}`, background: "rgba(16,10,24,0.85)", fontSize: 22, letterSpacing: 3, color: VIO, opacity: P(f, contAt, 8) }}>SÓ SABEM: UMA POSSIBILIDADE DE CONTINUIDADE</div> : null}
        {f >= escAt ? <div style={{ fontSize: 18, letterSpacing: 3, color: CREAM, marginTop: 16, opacity: P(f, escAt, 8) }}>ESCAPAR DAS LIMITAÇÕES</div> : null}
        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
          {chips.map(([t0, s]) =>
            f >= t0 ? (
              <div key={s} style={{ position: "relative", padding: "8px 12px", border: "1.5px dashed rgba(242,240,247,0.6)", fontSize: 18, letterSpacing: 2, color: TXT, opacity: P(f, t0, 8) * (1 - P(f, t0 + 24, 20) * 0.5) }}>{s}</div>
            ) : null,
          )}
        </div>
        {f >= perpAt ? <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 52, color: VIO, marginTop: 18, opacity: P(f, perpAt, 8) }}>perpetuidade</div> : null}
        {f >= neverAt ? <div style={{ fontSize: 20, letterSpacing: 3, color: RED, marginTop: 10, opacity: P(f, neverAt, 8) }}>NUNCA TIVERAM CERTEZA DE COMO CHEGAR LÁ</div> : null}
        {f >= maybeAt ? <div style={{ fontSize: 18, letterSpacing: 3, color: "rgba(242,240,247,0.7)", marginTop: 8, opacity: P(f, maybeAt, 8) }}>TALVEZ NEM ENTENDAM O QUE PERSEGUEM</div> : null}
      </div>
      {f >= broughtAt ? <div style={{ position: "absolute", left: 0, right: 0, bottom: 150, textAlign: "center", fontFamily: MONO, fontSize: 22, letterSpacing: 6, color: CREAM, opacity: P(f, broughtAt + 6, 10) }}>FOI ESSA CRENÇA QUE TROUXE ELES ATÉ AQUI</div> : null}
      <Hud f={f} yaw={e.yaw} eye={e} blips={[]} />
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ================================================================================================= MÓDULO 12 · leva B (1:22:06 → 1:24:16)
// várias Terras, cada uma numa linha; os Combine pulam de mundo em mundo na MESMA linha, os empregadores entre as linhas
const ELINES = [7, 9.5, 12, 14.5, 17];
const EX0 = -7.5;
const EX1 = 8.5;
const MiniEarth: React.FC<{ e: Eye; pt: V3; R: number; o?: number; id: string }> = ({ e, pt, R, o = 1, id }) => {
  const q = proj(e, pt);
  if (!q || o <= 0) return null;
  const r = (R * e.F) / q.d;
  return (
    <g opacity={o}>
      <defs>
        <radialGradient id={`me${id}`} cx="0.38" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#5fa8d8" />
          <stop offset="0.6" stopColor="#1d4a72" />
          <stop offset="1" stopColor="#081626" />
        </radialGradient>
      </defs>
      <circle cx={q.x} cy={q.y} r={r} fill={`url(#me${id})`} stroke="rgba(159,230,255,0.6)" strokeWidth={1.5} />
      <path d={`M ${q.x - r * 0.5} ${q.y - r * 0.2} q ${r * 0.3} ${-r * 0.4} ${r * 0.6} ${-r * 0.1} q ${r * 0.1} ${r * 0.4} ${-r * 0.3} ${r * 0.5} Z`} fill="rgba(120,200,140,0.55)" />
    </g>
  );
};
export const HL12Employers: React.FC<PR & { mode?: number }> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const mode = p.mode ?? 0;
  const [aloneAt, empAt, notOneAt] = ats(p, ["aloneAt", "empAt", "notOneAt"]);
  const [combAt, possAt, interAt, takeAt, giveAt, deathAt, infoAt, pushAt, doorAt] = ats(p, ["combAt", "possAt", "interAt", "takeAt", "giveAt", "deathAt", "infoAt", "pushAt", "doorAt"]);
  const rise = mode ? 1 : IOx((f - aloneAt) / 50);
  const e: Eye = { x: 0.1 * Math.sin(f / 80), y: keys(f, [[0, 2.2], [life, mode ? 1.2 : 1.8]]) - rise * 3.2, z: 1.7 + rise * 5.5, yaw: 0, pitch: -0.05 - rise * 0.32, F: 1000 };
  const lines = mode ? 1 : P(f, notOneAt, 30);
  const conv = mode ? IOx((f - pushAt) / 60) : 0;
  const CAT: V3 = [EX1 + 1.5, 12, 0.6];
  const lineY = (k: number, x: number) => {
    const u = Math.max(0, Math.min(1, (x - 1) / (EX1 - 1)));
    const s = u * u * (3 - 2 * u);
    return ELINES[k] + (CAT[1] - ELINES[k]) * s * conv;
  };
  const LP = (k: number, x: number): V3 => [x, lineY(k, x), 0];
  // os eventos de interferência (modo 1)
  const tk = mode ? P(f, takeAt, 14) : 0;
  const gv = mode ? P(f, giveAt, 14) : 0;
  const dth = mode ? P(f, deathAt + 14, 12) : 0;
  const inf = mode ? P(f, infoAt, 14) : 0;
  const comb = mode ? Math.max(0, f - combAt) / 30 : 0;
  const combX = EX0 + 1 + ((comb * 3) % (EX1 - EX0 - 2));
  const poss = mode ? Math.max(0, f - possAt) / 30 : 0;
  const possK = Math.floor(poss * 1.6) % ELINES.length;
  const gq = proj(e, [-1.2, 4.4, 0]);
  const gt = proj(e, [-1.2, 4.4, 1.85]);
  const empO = mode ? 1 : P(f, empAt, 30);
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 30%, #121a22 0%, #05070a 70%, #020304 100%)", overflow: "hidden" }}>
      {/* os empregadores: uma presença enorme por trás de tudo, fora das linhas (anéis de luz fria, sem forma) */}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <defs>
          <radialGradient id="empG" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="rgba(207,232,255,0.22)" />
            <stop offset="1" stopColor="rgba(207,232,255,0)" />
          </radialGradient>
        </defs>
        <g opacity={empO}>
          <ellipse cx={960} cy={150} rx={1000} ry={330} fill="url(#empG)" />
          <ellipse cx={960} cy={150} rx={520} ry={150} fill="url(#empG)" />
          {Array.from({ length: 14 }).map((_, k) => <line key={`c${k}`} x1={260 + k * 108} y1={0} x2={300 + k * 104} y2={420} stroke="rgba(207,232,255,0.12)" strokeWidth={30 + 20 * Math.sin(f / 40 + k)} style={{ filter: "blur(14px)" }} />)}
          {[0, 1, 2, 3, 4].map((k) => {
            const t = ((f / 120 + k / 5) % 1);
            return <ellipse key={k} cx={960} cy={150} rx={200 + t * 800} ry={50 + t * 200} fill="none" stroke="rgba(207,232,255,0.75)" strokeWidth={2} opacity={(1 - t) * 0.8} />;
          })}
          <text x={960} y={70} textAnchor="middle" fill="rgba(207,232,255,0.85)" fontFamily={MONO} fontSize={22} letterSpacing={10}>OS EMPREGADORES</text>
        </g>
        {/* as linhas e as Terras */}
        {lines > 0
          ? ELINES.map((_, k) => {
              const pts: string[] = [];
              for (let i = 0; i <= 40; i++) {
                const x = EX0 + ((EX1 - EX0) * i) / 40 * Math.min(1, lines * 1.2 - k * 0.08);
                const q = proj(e, LP(k, x));
                if (q) pts.push(`${q.x.toFixed(0)},${q.y.toFixed(0)}`);
              }
              return (
                <g key={k}>
                  <polyline points={pts.join(" ")} fill="none" stroke={conv > 0.5 ? "#ffd27a" : "#9fe6ff"} strokeWidth={6} opacity={0.22} style={{ filter: "blur(3px)" }} />
                  <polyline points={pts.join(" ")} fill="none" stroke={conv > 0.5 ? "#ffe2a0" : "#bfefff"} strokeWidth={2} />
                </g>
              );
            })
          : null}
        {lines > 0 ? ELINES.map((y, k) => <MiniEarth key={k} e={e} pt={[EX0 - 0.6, y, 0.5]} R={0.5} o={P(f, (mode ? 0 : notOneAt) + k * 5, 10)} id={`e${k}`} />) : null}
        {/* os Combine: na mesma linha, de mundo em mundo */}
        {mode && f >= combAt
          ? (() => {
              const q = proj(e, LP(2, combX));
              return q ? (
                <g>
                  <IcoComb x={q.x} y={q.y - 26} s={0.8} />
                  {[0, 1, 2].map((i) => {
                    const pq = proj(e, LP(2, EX0 + 2 + i * 5));
                    return pq ? <ellipse key={i} cx={pq.x} cy={pq.y - 20} rx={22} ry={34} fill="none" stroke={RED} strokeWidth={2} opacity={0.6} /> : null;
                  })}
                </g>
              ) : null;
            })()
          : null}
        {/* os empregadores: entre as linhas */}
        {mode && f >= possAt
          ? (() => {
              const a = proj(e, LP(possK, 2.5));
              const b = proj(e, LP((possK + 1) % ELINES.length, 2.5));
              return a && b ? (
                <g>
                  <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#cfe8ff" strokeWidth={2} strokeDasharray="6 6" />
                  <circle cx={a.x + (b.x - a.x) * ((poss * 1.6) % 1)} cy={a.y + (b.y - a.y) * ((poss * 1.6) % 1)} r={9} fill="#cfe8ff" style={{ filter: "drop-shadow(0 0 8px #cfe8ff)" }} />
                </g>
              ) : null;
            })()
          : null}
        {/* a interferência: pessoa retirada · outra devolvida · a morte que não acontece · a informação no lugar certo */}
        {mode && f >= takeAt
          ? (() => {
              const a = proj(e, [LP(1, 0)[0], LP(1, 0)[1], 0.3 + tk * 1.2]);
              return a ? (
                <g opacity={1 - tk * 0.9}>
                  <circle cx={a.x} cy={a.y} r={12} fill={ORANGE} />
                  <text x={a.x + 18} y={a.y + 6} fill={ORANGE} fontFamily={MONO} fontSize={16} letterSpacing={2}>RETIRADA</text>
                </g>
              ) : null;
            })()
          : null}
        {mode && f >= giveAt
          ? (() => {
              const a = proj(e, [LP(3, 3)[0], LP(3, 3)[1], 0.3 + (1 - gv) * 1.2]);
              return a ? (
                <g opacity={gv}>
                  <circle cx={a.x} cy={a.y} r={12} fill={AMB} />
                  <text x={a.x + 18} y={a.y + 6} fill={AMB} fontFamily={MONO} fontSize={16} letterSpacing={2}>DEVOLVIDA</text>
                </g>
              ) : null;
            })()
          : null}
        {mode && f >= deathAt
          ? (() => {
              const a = proj(e, LP(0, 4.5));
              return a ? (
                <g opacity={P(f, deathAt, 8)}>
                  <circle cx={a.x} cy={a.y} r={16} fill={dth > 0.5 ? "rgba(6,30,12,0.9)" : "rgba(40,6,6,0.9)"} stroke={dth > 0.5 ? GREEN : RED} strokeWidth={2.5} />
                  <text x={a.x} y={a.y + 6} textAnchor="middle" fill={dth > 0.5 ? GREEN : RED} fontFamily={MONO} fontSize={16}>{dth > 0.5 ? "✓" : "✕"}</text>
                  <text x={a.x + 24} y={a.y + 6} fill={dth > 0.5 ? GREEN : RED} fontFamily={MONO} fontSize={16} letterSpacing={2}>{dth > 0.5 ? "A MORTE NÃO ACONTECE" : "MORTE"}</text>
                </g>
              ) : null;
            })()
          : null}
        {mode && f >= infoAt
          ? (() => {
              const a = proj(e, [LP(4, 1.5)[0], LP(4, 1.5)[1], 0.05 + (1 - inf) * 1.5]);
              return a ? (
                <g opacity={inf}>
                  <rect x={a.x - 14} y={a.y - 34} width={28} height={36} fill="#efe6cf" stroke="#2a2418" strokeWidth={1.5} />
                  {[0, 1, 2].map((i) => <line key={i} x1={a.x - 8} y1={a.y - 26 + i * 8} x2={a.x + 8} y2={a.y - 26 + i * 8} stroke="#2a2418" strokeWidth={1.2} />)}
                  <text x={a.x + 22} y={a.y - 10} fill={CREAM} fontFamily={MONO} fontSize={16} letterSpacing={2}>UMA INFORMAÇÃO · NO LUGAR CERTO</text>
                </g>
              ) : null;
            })()
          : null}
        {mode && f >= pushAt - 10 ? <CoreOrb e={e} f={f} c={CAT} R={0.55} o={P(f, pushAt + 20, 20)} id="emp" /> : null}
        {mode && f >= doorAt ? <Call e={e} f={f} pt={CAT} from={doorAt} until={life} text="O CATALISADOR" col="#ffd27a" dx={-260} dy={-160} /> : null}
      </svg>
      {/* o G-Man, pequeno, na frente de tudo */}
      {gq && gt ? (() => {
        const h = gq.y - gt.y;
        return (
          <div style={{ position: "absolute", left: gq.x - h * 0.185, top: gt.y, width: h * 0.37, height: h, filter: "drop-shadow(0 0 4px rgba(220,240,255,0.6)) drop-shadow(0 0 16px rgba(190,230,240,0.35))" }}>
            <div style={{ position: "absolute", inset: 0, WebkitMaskImage: `url(${staticFile("hl3silh/gman_silh.png")})`, maskImage: `url(${staticFile("hl3silh/gman_silh.png")})`, WebkitMaskSize: "100% 100%", maskSize: "100% 100%", background: "linear-gradient(180deg, #2a3036, #07090b 80%)" }} />
          </div>
        );
      })() : null}
      <div style={{ position: "absolute", left: 100, top: 130, width: 720, fontFamily: MONO }}>
        {!mode && f >= aloneAt ? <div style={{ fontSize: 24, letterSpacing: 4, color: TXT, opacity: P(f, aloneAt, 8) }}>O G-MAN NÃO TRABALHA SOZINHO</div> : null}
        {!mode
          ? ([[notOneAt, "NÃO PERTENCEM A UMA ÚNICA TERRA"], [notOneAt + 50, "NEM A UM UNIVERSO ESPECÍFICO"], [notOneAt + 100, "NEM A UMA ÚNICA VERSÃO DA HISTÓRIA"]] as [number, string][]).map(([t0, s]) =>
              f >= t0 ? <div key={s} style={{ marginTop: 12, padding: "8px 14px", borderLeft: "3px solid #cfe8ff", background: "rgba(8,10,14,0.82)", fontSize: 20, letterSpacing: 3, color: TXT, opacity: P(f, t0, 8) }}>{s}</div> : null,
            )
          : null}
        {mode
          ? ([[combAt, "OS COMBINE ATRAVESSAM MUNDOS", RED], [possAt, "OS EMPREGADORES ATRAVESSAM POSSIBILIDADES", "#cfe8ff"], [interAt, "E INTERFEREM", AMB], [pushAt, "EMPURRADAS NA MESMA DIREÇÃO", "#ffd27a"]] as [number, string, string][]).map(([t0, s, c]) =>
              f >= t0 ? <div key={s} style={{ marginTop: 12, padding: "8px 14px", borderLeft: `3px solid ${c}`, background: "rgba(8,10,14,0.82)", fontSize: 20, letterSpacing: 3, color: TXT, opacity: P(f, t0, 8) }}>{s}</div> : null,
            )
          : null}
      </div>
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 1:23:02 a convergência (o tabuleiro se reorganiza até a mesma porta)
export const HL12Conv: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [notSameAt, gordAt, eliAt, alyxAt, boardAt, doorAt, needAt, notHandsAt, piecesAt, someoneAt] = ats(p, ["notSameAt", "gordAt", "eliAt", "alyxAt", "boardAt", "doorAt", "needAt", "notHandsAt", "piecesAt", "someoneAt"]);
  void notSameAt;
  const e: Eye = { x: 0.05 * Math.sin(f / 70), y: keys(f, [[0, 1.5], [life, 1.8]]), z: 2.3, yaw: 0, pitch: -0.5, F: 1080 };
  const U = (i: number) => laneU(i / 6);
  const V = (k: number) => LANE_V[k];
  // Gordon: dois caminhos diferentes (fantasma) · Eli: vivo/morto · Alyx: muda de linha; depois o tabuleiro empurra todos até a porta
  const gAlt = Math.floor(Math.max(0, f - gordAt) / 24) % 2;
  const G3 = seqHop(f, [{ t: gordAt, d: 20, to: [U(2), V(gAlt ? 2 : 0)] }, { t: gordAt + 24, d: 20, to: [U(3), V(0)] }, { t: boardAt + 10, d: 30, to: [U(5), V(1)] }, { t: someoneAt, d: 26, to: [U(6), V(1)] }], [U(1), V(0)]);
  const eliDead = f >= eliAt && Math.floor((f - eliAt) / 16) % 2 === 1 && f < boardAt;
  const E3 = seqHop(f, [{ t: boardAt + 22, d: 30, to: [U(5), V(2)] }], [U(2), V(2)]);
  const A3 = seqHop(f, [{ t: alyxAt, d: 16, to: [U(3), V(2)] }, { t: alyxAt + 20, d: 16, to: [U(4), V(0)] }, { t: boardAt + 34, d: 30, to: [U(5), V(0)] }, { t: piecesAt, d: 20, to: [U(5) + 0.03, V(1) - 120] }], [U(2), V(1)]);
  const pcs: Piece[] = [
    { label: "GORDON", col: AMB, u: G3[0], v: G3[1], h: G3[2] },
    { label: eliDead ? "ELI · MORTO" : "ELI · VIVO", col: eliDead ? RED : GREEN, img: "hl3silh/eli_retrato.png", u: E3[0], v: E3[1], h: E3[2] },
    { label: "ALYX", col: ORANGE, img: "hl3silh/alyx_badge.jpg", u: A3[0], v: A3[1], h: A3[2] },
  ];
  const shove = P(f, boardAt, 30);
  const tryU = f >= notHandsAt ? Math.min(0.86, 0.6 + P(f, notHandsAt, 26) * 0.26) - P(f, notHandsAt + 34, 14) * 0.2 : 0;
  const lockFl = f >= notHandsAt + 30 && f < notHandsAt + 42;
  const gmTop = proj(e, [0, 7.6, 1.85]);
  const gmBot = proj(e, [0, 7.6, 0]);
  const aq = proj(e, bPt(A3[0], A3[1], BZ + 0.3));
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 30%, #121a22 0%, #05070a 70%, #020304 100%)", overflow: "hidden" }}>
      {gmTop && gmBot ? (() => {
        const h = gmBot.y - gmTop.y;
        return (
          <div style={{ position: "absolute", left: gmTop.x - h * 0.185, top: gmTop.y, width: h * 0.37, height: h, filter: "drop-shadow(0 0 4px rgba(220,240,255,0.55)) drop-shadow(0 0 18px rgba(190,230,240,0.3))" }}>
            <div style={{ position: "absolute", inset: 0, WebkitMaskImage: `url(${staticFile("hl3silh/gman_silh.png")})`, maskImage: `url(${staticFile("hl3silh/gman_silh.png")})`, WebkitMaskSize: "100% 100%", maskSize: "100% 100%", background: "linear-gradient(180deg, #2a3036, #07090b 80%)" }} />
          </div>
        );
      })() : null}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", transform: `translateY(${Math.sin(shove * Math.PI) * -10}px)` }}>
        <Pinned e={e} w={BW} h={BH} corners={[bPt(0, 0), bPt(1, 0), bPt(1, BH), bPt(0, BH)]}>
          <BoardTop f={f} lit={0.4 + 0.6 * P(f, doorAt, 12)} wrong={0} lock={f >= notHandsAt ? P(f, notHandsAt, 10) * (lockFl ? (Math.floor(f / 2) % 2 ? 1 : 0.3) : 1) : 0} last={P(f, doorAt, 14)} />
        </Pinned>
      </div>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {/* o outro caminho do Gordon (fantasma) */}
        {f >= gordAt && f < boardAt ? (() => {
          const a = proj(e, bPt(U(1), V(0), BZ + 0.02));
          const b = proj(e, bPt(U(3), V(2), BZ + 0.02));
          const c = proj(e, bPt(U(3), V(0), BZ + 0.02));
          return a && b && c ? (
            <g opacity={0.7}>
              <path d={`M ${a.x} ${a.y} L ${c.x} ${c.y}`} stroke={AMB} strokeWidth={2.5} strokeDasharray="8 6" />
              <path d={`M ${a.x} ${a.y} L ${b.x} ${b.y}`} stroke={AMB} strokeWidth={2.5} strokeDasharray="8 6" />
            </g>
          ) : null;
        })() : null}
        {[...pcs].sort((a, b) => a.v - b.v).map((pc) => <Token key={pc.label} e={e} pc={pc} />)}
        {f >= notHandsAt && f < notHandsAt + 60 ? <Token e={e} pc={{ label: "G-MAN", col: "#cfe8ff", u: tryU, v: 500, h: 0.25 }} o={1 - P(f, notHandsAt + 46, 12)} /> : null}
        {lockFl ? (() => {
          const q = proj(e, bPt(0.92, 500, BZ + 0.1));
          return q ? <circle cx={q.x} cy={q.y} r={120} fill="rgba(255,93,77,0.25)" stroke={RED} strokeWidth={4} /> : null;
        })() : null}
        {f >= needAt && aq ? <circle cx={aq.x} cy={aq.y - 70} r={70 + 6 * Math.sin(f / 5)} fill="none" stroke={ORANGE} strokeWidth={3} opacity={P(f, needAt, 10) * 0.9} /> : null}
      </svg>
      <div style={{ position: "absolute", left: 100, top: 110, width: 660, fontFamily: MONO }}>
        {([[notSameAt, "NÃO ACONTECE TUDO IGUAL", "rgba(242,240,247,0.8)"], [gordAt, "GORDON · DECISÕES DIFERENTES", AMB], [eliAt, "ELI · MORRE OU SOBREVIVE", GREEN], [alyxAt, "ALYX · CAMINHOS DIFERENTES", ORANGE]] as [number, string, string][]).map(([t0, s, c]) =>
          f >= t0 && f < boardAt + 20 ? <div key={s} style={{ marginTop: 10, padding: "8px 14px", borderLeft: `3px solid ${c}`, background: "rgba(8,10,14,0.82)", fontSize: 20, letterSpacing: 3, color: TXT, opacity: P(f, t0, 8) * (1 - P(f, boardAt + 6, 12)) }}>{s}</div> : null,
        )}
        {([[boardAt, "ALGO REORGANIZA O TABULEIRO", "#cfe8ff"], [doorAt, "ATÉ A MESMA PORTA", "#ffd27a"], [needAt, "POR ISSO O G-MAN PRECISAVA DELA", ORANGE], [notHandsAt, "NÃO PARA ATIVAR COM AS PRÓPRIAS MÃOS", RED], [piecesAt, "PARA AS PEÇAS CONTINUAREM AVANÇANDO", AMB]] as [number, string, string][]).map(([t0, s, c]) =>
          f >= t0 ? <div key={s} style={{ marginTop: 10, padding: "8px 14px", borderLeft: `3px solid ${c}`, background: "rgba(8,10,14,0.82)", fontSize: 20, letterSpacing: 3, color: TXT, opacity: P(f, t0, 8) }}>{s}</div> : null,
        )}
      </div>
      {f >= someoneAt ? <div style={{ position: "absolute", left: 0, right: 0, bottom: 120, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 54, color: TXT, opacity: P(f, someoneAt + 10, 8) }}>até que alguém fizesse isso por ele</div> : null}
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 1:23:28 a névoa (os futuros que os Vortigaunts enxergam acabam ali)
const TRAILS = Array.from({ length: 11 }).map((_, k) => ({ x0: (k - 5) * 0.12, x1: (k - 5) * 1.1 + Math.sin(k * 3) * 0.5, w: 1 + Math.floor(rnd(k * 7) * 4) }));
export const HL12Mist: React.FC<PR & { mode?: number }> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const mode = p.mode ?? 0;
  const [vortAt, mistAt, stasisAt, gmanAt, nowAt, notAt, absAt, futAt, pathAt, nothingAt] = ats(p, ["vortAt", "mistAt", "stasisAt", "gmanAt", "nowAt", "notAt", "absAt", "futAt", "pathAt", "nothingAt"]);
  const [firstAt, vort2At, alyxAt, gman2At] = ats(p, ["firstAt", "vortAt", "alyxAt", "gmanAt"]);
  void vortAt;
  void firstAt;
  const e: Eye = { x: 0.05 * Math.sin(f / 70), y: mode ? -2.5 : keys(f, [[0, -1.5], [absAt, -1.0], [absAt + 40, -1.6], [life, -1.2]]), z: 1.8 + (mode ? 0 : P(f, absAt, 40) * 1.6), yaw: 0, pitch: mode ? -0.12 : -0.08 - P(f, absAt, 40) * 0.14, F: 1000 };
  const ALY: V3 = [0, 4, 0];
  const MIST_Y = 15;
  // a névoa: primeiro em volta dela; quando ela entende, a névoa se revela como o ponto onde os caminhos acabam
  const move = mode ? 1 : IOx((f - absAt) / 40);
  const trails = mode ? 1 : P(f, futAt, 40);
  const mq = proj(e, [0, 4 + (MIST_Y - 4) * move, 1.0]);
  const fogR = mq ? (2.2 + move * 9) * e.F / mq.d : 0;
  const green = "#4dffc0";
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 55%, #08221a 0%, #030a08 70%, #010302 100%)", overflow: "hidden" }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <defs>
          <filter id="msGlow"><feGaussianBlur stdDeviation="4" /></filter>
          <radialGradient id="msFog" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="rgba(235,245,240,0.85)" />
            <stop offset="0.6" stopColor="rgba(210,230,222,0.45)" />
            <stop offset="1" stopColor="rgba(210,230,222,0)" />
          </radialGradient>
        </defs>
        {/* o chão da vortessência */}
        {Array.from({ length: 16 }).map((_, i) => {
          const a = proj(e, [-14, i * 2, 0]);
          const b = proj(e, [14, i * 2, 0]);
          return a && b ? <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="rgba(77,255,192,0.07)" /> : null;
        })}
        {/* os caminhos: quanto mais vezes aconteceu, mais grosso o rastro; todos acabam na névoa */}
        {trails > 0
          ? TRAILS.map((tr, k) => {
              const pts: string[] = [];
              for (let i = 0; i <= 24; i++) {
                const t = (i / 24) * trails;
                const y = ALY[1] + (MIST_Y - ALY[1]) * t;
                const x = tr.x0 + (tr.x1 - tr.x0) * t * t;
                const q = proj(e, [x, y, 0.02]);
                if (q) pts.push(`${q.x.toFixed(0)},${q.y.toFixed(0)}`);
              }
              const hot = f >= pathAt && tr.w >= 3;
              return (
                <g key={k}>
                  <polyline points={pts.join(" ")} fill="none" stroke={green} strokeWidth={tr.w * 4} opacity={0.18} filter="url(#msGlow)" />
                  <polyline points={pts.join(" ")} fill="none" stroke={hot ? "#e0fff2" : green} strokeWidth={tr.w * 1.1} opacity={0.85} />
                </g>
              );
            })
          : null}
        {f >= pathAt && !mode ? <text x={1820} y={560} textAnchor="end" fill="#c8ffe8" fontFamily={MONO} fontSize={18} letterSpacing={3} opacity={P(f, pathAt, 8)}>ACONTECEU VEZES SUFICIENTES · DEIXOU UM CAMINHO</text> : null}
        {mq && f >= mistAt ? <circle cx={mq.x} cy={mq.y} r={fogR} fill="url(#msFog)" opacity={P(f, mistAt, 16) * (0.75 + 0.1 * Math.sin(f / 20))} /> : null}
        {mode || f >= nothingAt ? (() => {
          const q = proj(e, [0, MIST_Y + 0.5, 1.2]);
          return q ? <text x={q.x} y={q.y - 140} textAnchor="middle" fill="#0b2a20" fontFamily={MONO} fontSize={26} letterSpacing={8} opacity={mode ? 1 : P(f, nothingAt, 10)}>DEPOIS DAQUI · NADA</text> : null;
        })() : null}
        <FlagAt e={e} pt={ALY} label="ALYX" col={ORANGE} f={f} o={mode ? P(f, alyxAt, 8) : 1} sub={mode ? "?" : f >= absAt ? "A AUSÊNCIA DEPOIS DELA" : f >= mistAt ? "A NÉVOA EM VOLTA DELA" : undefined} />
      </svg>
      {/* os Vortigaunts enxergando (silhuetas nas bordas, como nas cenas anteriores) */}
      <AbsoluteFill style={{ pointerEvents: "none" }}>
        {[[-3.2, 2.2, false], [3.4, 2.6, true]].map(([x, y, fl], k) => (
          <SilhouetteAt key={k} e={e} x={x as number} y={y as number} h={1.9} src="hl3silh/vort_silh.png" ar={270 / 400} f={f} o={mode ? P(f, vort2At, 10) : 1} flip={fl as boolean} rim="rgba(141,255,168,0.75)" top="#2e3a28" bot="#0a0f0a" label={k === 0 ? "VORTIGAUNTS" : undefined} labelCol={GREEN} sub={k === 0 ? (mode ? "?" : "ENXERGAM PELA VORTESSÊNCIA") : undefined} />
        ))}
      </AbsoluteFill>
      {mode ? (() => {
        const b = proj(e, [4.6, MIST_Y - 1.5, 0]);
        const t = proj(e, [4.6, MIST_Y - 1.5, 1.85]);
        if (!b || !t) return null;
        const h = b.y - t.y;
        return (
          <div style={{ position: "absolute", left: b.x - h * 0.185, top: t.y, width: h * 0.37, height: h, opacity: P(f, gman2At, 10) * 0.85 }}>
            <div style={{ position: "absolute", inset: 0, WebkitMaskImage: `url(${staticFile("hl3silh/gman_silh.png")})`, maskImage: `url(${staticFile("hl3silh/gman_silh.png")})`, WebkitMaskSize: "100% 100%", maskSize: "100% 100%", background: "linear-gradient(180deg, #1a201e, #07090b 80%)" }} />
            <div style={{ position: "absolute", left: "100%", top: 0, marginLeft: 10, fontFamily: MONO, fontSize: 18, letterSpacing: 3, color: "#0b2a20", whiteSpace: "nowrap" }}>G-MAN · ?</div>
          </div>
        );
      })() : null}
      {!mode ? (
        <div style={{ position: "absolute", left: 100, top: 130, width: 640, fontFamily: MONO }}>
          {([[stasisAt, "A ESTASE?"], [gmanAt, "O G-MAN?"]] as [number, string][]).map(([t0, s]) =>
            f >= t0 && f < absAt + 20 ? (
              <div key={s} style={{ position: "relative", display: "inline-block", marginRight: 14, padding: "8px 14px", border: "1.5px solid rgba(242,240,247,0.5)", fontSize: 22, letterSpacing: 3, color: TXT, opacity: P(f, t0, 8) * (1 - P(f, absAt + 6, 12)) }}>
                {s}
                {f >= notAt ? <div style={{ position: "absolute", left: 4, right: 4, top: "50%", height: 3, background: RED, transform: `scaleX(${P(f, notAt, 8)})`, transformOrigin: "left" }} /> : null}
              </div>
            ) : null,
          )}
          {f >= nowAt && f < absAt + 20 ? <div style={{ fontSize: 20, letterSpacing: 3, color: "#c8ffe8", marginTop: 14, opacity: P(f, nowAt, 8) * (1 - P(f, absAt + 6, 12)) }}>AGORA A ALYX ENTENDE</div> : null}
          {f >= absAt ? <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 50, color: TXT, opacity: P(f, absAt + 10, 10) }}>não era uma coisa em volta dela</div> : null}
          {f >= absAt + 40 ? <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 50, color: "#c8ffe8", marginTop: 6, opacity: P(f, absAt + 40, 10) }}>era a ausência de alguma coisa depois</div> : null}
          {f >= futAt ? <div style={{ fontSize: 18, letterSpacing: 3, color: "#c8ffe8", marginTop: 16, opacity: P(f, futAt, 8) }}>OS FUTUROS QUE OS VORTIGAUNTS PERCEBEM</div> : null}
        </div>
      ) : (
        <div style={{ position: "absolute", left: 0, right: 0, top: 120, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 60, color: TXT, opacity: P(f, 4, 10) }}>ninguém sabe o que vem depois</div>
      )}
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ================================================================================================= MÓDULO 12 · leva C (1:24:16 → 1:27:55)
const LEFT_SCR: [V3, V3, V3, V3] = [[-4.95, 7.55, 1.55], [-4.95, 8.45, 1.55], [-4.55, 8.45, 1.0], [-4.55, 7.55, 1.0]];
export const MECH_L: V3 = [-5.2, 8.0, 1.4];
export const MECH_R: V3 = [4.85, 7.95, 1.4];
export const ARM_R: V3 = [2.4, 13, 3.0];
// a simulação do colapso (no link do Kleiner): o núcleo cai na ferida, a ferida se fecha puxando o espaço preso a ela — e a Terra
const CollapseSim: React.FC<{ f: number; ifAt: number; notOnlyAt: number; woundAt: number; earthAt: number }> = ({ f, ifAt, notOnlyAt, woundAt, earthAt }) => {
  const W = 1500;
  const H = 520;
  const drop = P(f, ifAt + 10, 40);
  const gone = P(f, notOnlyAt, 30);
  const close = P(f, woundAt, 70);
  const earth = P(f, earthAt, 50);
  const cx = 750;
  const wy = 400;
  const pull = (x: number, y: number): [number, number] => {
    const dx = x - cx;
    const dy = y - wy;
    const k = close * Math.exp(-(dx * dx) / (2 * 420 * 420)) * 0.85;
    return [x - dx * k * 0.6, y - dy * k];
  };
  const grid: string[] = [];
  for (let gy = 40; gy <= 500; gy += 46) {
    const pts: string[] = [];
    for (let gx = 0; gx <= W; gx += 30) {
      const [x, y] = pull(gx, gy);
      pts.push(`${x.toFixed(0)},${y.toFixed(0)}`);
    }
    grid.push(pts.join(" "));
  }
  const [ex, ey] = pull(1180, 160);
  const egx = ex + (cx - ex) * earth;
  const egy = ey + (wy - ey) * earth;
  return (
    <svg width={W} height={H}>
      {grid.map((g, i) => <polyline key={i} points={g} fill="none" stroke="rgba(159,230,255,0.22)" strokeWidth={1.2} />)}
      {/* a ferida (fecha) */}
      <path d={`M ${cx - 520 * (1 - close)} ${wy} L ${cx - 200 * (1 - close)} ${wy + 10} L ${cx} ${wy - 4} L ${cx + 220 * (1 - close)} ${wy + 8} L ${cx + 520 * (1 - close)} ${wy}`} fill="none" stroke="rgba(255,110,60,0.7)" strokeWidth={24} style={{ filter: "blur(6px)" }} opacity={1 - close * 0.7} />
      <path d={`M ${cx - 520 * (1 - close)} ${wy} L ${cx - 200 * (1 - close)} ${wy + 10} L ${cx} ${wy - 4} L ${cx + 220 * (1 - close)} ${wy + 8} L ${cx + 520 * (1 - close)} ${wy}`} fill="none" stroke="#ffc090" strokeWidth={3} opacity={1 - close * 0.6} />
      {/* o Borealis em cima, o núcleo caindo */}
      <BorealisSide x={cx} y={180} s={1.2} col={ICE} o={1 - gone} />
      <circle cx={cx} cy={200 + drop * 190} r={22 * (1 - close * 0.8)} fill="#ffe2a0" style={{ filter: "drop-shadow(0 0 14px #ffd27a)" }} opacity={1 - close} />
      {/* a Terra, presa ao mesmo espaço */}
      <g opacity={1 - earth * 0.9}>
        <circle cx={egx} cy={egy} r={60 * (1 - earth * 0.85)} fill="#1d4a72" stroke="rgba(159,230,255,0.7)" strokeWidth={2} />
        <path d={`M ${egx - 26} ${egy - 10} q 14 -20 30 -6 q 6 18 -14 26 Z`} fill="rgba(120,200,140,0.6)" transform={`scale(${1 - earth * 0.85})`} style={{ transformOrigin: `${egx}px ${egy}px` }} />
      </g>
      <text x={1180} y={260} textAnchor="middle" fill={ICE} fontFamily={MONO} fontSize={18} letterSpacing={4} opacity={1 - earth}>A TERRA</text>
      {f >= notOnlyAt ? <text x={cx} y={120} textAnchor="middle" fill={RED} fontFamily={MONO} fontSize={20} letterSpacing={4} opacity={P(f, notOnlyAt, 8)}>NÃO É SÓ O BOREALIS QUE DESAPARECE</text> : null}
      {f >= woundAt ? <text x={cx} y={470} textAnchor="middle" fill={ORANGE} fontFamily={MONO} fontSize={18} letterSpacing={3} opacity={P(f, woundAt, 8)}>A FERIDA SE FECHA · LEVANDO O ESPAÇO PRESO A ELA</text> : null}
    </svg>
  );
};
export const HL12Price: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [calcAt, wayAt, closeAt, priceAt, ifAt, notOnlyAt, woundAt, earthAt, eliSilAt, eliAskAt, lostAt, worldAt, otherAt, mossAt, useAt, sealAt, alyxAt, onceAt, vargaAt, eliCardAt, alyxCardAt, vargaCardAt] = ats(p, ["calcAt", "wayAt", "closeAt", "priceAt", "ifAt", "notOnlyAt", "woundAt", "earthAt", "eliSilAt", "eliAskAt", "lostAt", "worldAt", "otherAt", "mossAt", "useAt", "sealAt", "alyxAt", "onceAt", "vargaAt", "eliCardAt", "alyxCardAt", "vargaCardAt"]);
  void calcAt;
  const G = useMemo(() => buildCoreRoom(true), []);
  const e = coreEye(f, { y: 4.6, shake: 0.2, pitch: 0.06 });
  const sim = f < eliSilAt;
  const panO = P(f, 4, 14) * (1 - P(f, eliSilAt, 14));
  const eliTalk = f >= eliAskAt && f < alyxAt;
  const cards = f >= eliCardAt;
  return (
    <AbsoluteFill style={{ background: "#020304", overflow: "hidden" }}>
      <CoreRoom e={e} f={f} G={G} o={{ rings: notches(0.95), ringO: 1, wound: 1.2, arcs: 0.4, push: 0.8, hot: 0.6 }} />
      <AbsoluteFill style={{ background: `rgba(2,3,4,${0.5 * Math.max(panO, cards ? 0.8 : 0.45)})` }} />
      {/* a última conta do Kleiner */}
      {sim ? (
        <div style={{ position: "absolute", left: 210, top: 100, width: 1500, borderRadius: 14, border: `1.5px solid ${AMB}`, background: "linear-gradient(180deg, rgba(20,14,4,0.86), rgba(8,6,2,0.92))", fontFamily: MONO, color: AMB, opacity: panO, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 22px", borderBottom: "1px solid rgba(255,178,46,0.35)" }}>
            <div style={{ width: 42, height: 42, borderRadius: 6, overflow: "hidden", border: `2px solid ${AMB}`, backgroundImage: `url(${staticFile("hl3silh/kleiner_retrato.png")})`, backgroundSize: "cover", backgroundPosition: "50% 30%" }} />
            <span style={{ fontSize: 18, letterSpacing: 6 }}>DR. KLEINER · A ÚLTIMA CONTA</span>
            {f >= wayAt ? <span style={{ marginLeft: "auto", fontSize: 18, letterSpacing: 3, color: GREEN, opacity: P(f, wayAt, 8) }}>EXISTE UM JEITO DE DESTRUIR O NÚCLEO</span> : null}
          </div>
          {f >= closeAt ? <div style={{ padding: "10px 22px 0", fontSize: 20, letterSpacing: 3, color: CREAM, opacity: P(f, closeAt, 8) }}>COLAPSAR O NÚCLEO CONTRA A FERIDA · FECHAR AQUILO DE UMA VEZ</div> : null}
          {f >= priceAt ? <div style={{ padding: "8px 22px 0", fontSize: 22, letterSpacing: 4, color: RED, opacity: P(f, priceAt, 8) }}>EXISTE UM PREÇO</div> : null}
          <CollapseSim f={f} ifAt={ifAt} notOnlyAt={notOnlyAt} woundAt={woundAt} earthAt={earthAt} />
        </div>
      ) : null}
      {f >= earthAt && f < eliSilAt + 20 ? <div style={{ position: "absolute", left: 0, right: 0, top: 860, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 64, color: TXT, opacity: P(f, earthAt + 30, 10) * (1 - P(f, eliSilAt + 6, 12)) }}>e a Terra vai junto</div> : null}
      {/* o Eli no rádio: silêncio, depois o pedido */}
      {f >= eliSilAt && !cards ? (
        <div style={{ position: "absolute", left: 120, top: 120, width: 760, padding: 20, borderRadius: 14, background: "rgba(10,10,12,0.92)", border: `1.5px solid ${ORANGE}`, fontFamily: MONO, opacity: P(f, eliSilAt, 10) * (1 - P(f, eliCardAt - 8, 10)) }}>
          <div style={{ display: "flex", gap: 18 }}>
            <div style={{ width: 150, height: 170, borderRadius: 10, overflow: "hidden", border: `2px solid ${ORANGE}`, backgroundImage: `url(${staticFile("hl3silh/eli_retrato.png")})`, backgroundSize: "cover", backgroundPosition: "50% 30%" }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, letterSpacing: 5, color: ORANGE }}>RÁDIO · ELI VANCE</div>
              <svg width={540} height={60} style={{ marginTop: 10 }}>
                {Array.from({ length: 54 }).map((_, i) => {
                  const v = eliTalk ? 0.15 + 0.85 * Math.abs(Math.sin(i * 0.8 + f / 2) * Math.sin(i * 0.27 + f / 6)) : 0.03;
                  return <rect key={i} x={i * 10} y={30 - v * 26} width={6} height={Math.max(2, v * 52)} fill={eliTalk ? ORANGE : "rgba(242,240,247,0.3)"} />;
                })}
              </svg>
              {f < eliAskAt ? <div style={{ fontSize: 18, letterSpacing: 3, color: "rgba(242,240,247,0.6)", marginTop: 8 }}>SILÊNCIO · ELE QUE SEMPRE DISSE: DESTRUAM O BOREALIS</div> : null}
            </div>
          </div>
          {([[eliAskAt, "GORDON · NÃO FAÇA ISSO"], [lostAt, "JÁ PERDI A ALYX UMA VEZ"], [worldAt, "NÃO VOU PERDER O MUNDO INTEIRO"], [otherAt, "DEVE EXISTIR OUTRA SAÍDA"]] as [number, string][]).map(([t0, s2]) =>
            f >= t0 ? <div key={s2} style={{ marginTop: 10, padding: "8px 14px", borderLeft: `3px solid ${ORANGE}`, background: "rgba(20,12,6,0.7)", fontSize: 22, letterSpacing: 2, color: TXT, opacity: P(f, t0, 8) }}>{s2}</div> : null,
          )}
        </div>
      ) : null}
      {f >= mossAt && !cards ? (
        <div style={{ position: "absolute", left: 980, top: 140, width: 800, fontFamily: MONO, opacity: P(f, mossAt, 10) * (1 - P(f, eliCardAt - 8, 10)) }}>
          <div style={{ display: "flex", gap: 16, alignItems: "center", padding: 16, borderRadius: 12, background: "rgba(10,10,12,0.9)", border: "1.5px solid rgba(239,230,207,0.6)" }}>
            <div style={{ width: 90, height: 104, borderRadius: 8, overflow: "hidden", border: "2px solid rgba(239,230,207,0.7)", backgroundImage: `url(${staticFile("hl3silh/mossman_badge.jpg")})`, backgroundSize: "cover", backgroundPosition: "50% 25%" }} />
            <div>
              <div style={{ fontSize: 15, letterSpacing: 5, color: CREAM }}>O QUE A MOSSMAN DISSE DESDE O COMEÇO</div>
              <div style={{ fontSize: 26, letterSpacing: 2, color: TXT, marginTop: 6 }}>O BOREALIS É UMA ARMA</div>
            </div>
          </div>
          {f >= useAt ? <div style={{ marginTop: 14, padding: "10px 14px", borderLeft: `3px solid ${AMB}`, background: "rgba(20,14,4,0.8)", fontSize: 22, letterSpacing: 2, color: TXT, opacity: P(f, useAt, 8) }}>CONTRA OS COMBINE · ACABAR COM A OCUPAÇÃO DA TERRA</div> : null}
          {f >= sealAt ? <div style={{ display: "inline-block", marginTop: 16, padding: "8px 16px", border: `3px solid ${GREEN}`, color: GREEN, fontSize: 24, fontWeight: 700, letterSpacing: 3, transform: `rotate(-4deg) scale(${1.3 - 0.3 * P(f, sealAt, 6)})`, opacity: P(f, sealAt, 6) }}>PROMESSA · SELAR O BOREALIS DEPOIS</div> : null}
        </div>
      ) : null}
      {f >= alyxAt && !cards ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 760, textAlign: "center", fontFamily: FONT, opacity: P(f, alyxAt, 10) * (1 - P(f, vargaAt, 12)) }}>
          <div style={{ fontFamily: MONO, fontSize: 20, letterSpacing: 6, color: ORANGE }}>ALYX</div>
          <div style={{ fontWeight: 800, fontSize: 50, color: TXT, marginTop: 8 }}>esse é exatamente o problema</div>
          {f >= onceAt ? <div style={{ fontWeight: 800, fontSize: 42, color: CREAM, marginTop: 6, opacity: P(f, onceAt, 8) }}>todo mundo acredita que vai usar a arma só uma vez</div> : null}
        </div>
      ) : null}
      {f >= vargaAt && !cards ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 800, display: "flex", justifyContent: "center", fontFamily: MONO, opacity: P(f, vargaAt, 10) }}>
          <div style={{ display: "flex", gap: 14, alignItems: "center", padding: 14, borderRadius: 12, background: "rgba(10,10,12,0.92)", border: `1.5px solid ${ORANGE}` }}>
            <div style={{ width: 70, height: 80, borderRadius: 8, overflow: "hidden", border: `2px solid ${ORANGE}`, backgroundImage: `url(${staticFile("hl3silh/varga_retrato.png")})`, backgroundSize: "cover", backgroundPosition: "50% 25%" }} />
            <div style={{ fontSize: 20, letterSpacing: 3, color: TXT }}>VARGA · CONTINUA OLHANDO OS REGISTROS DE CONTINUIDADE · AGORA POR OUTRO MOTIVO</div>
          </div>
        </div>
      ) : null}
      {/* o mesmo Borealis, três coisas */}
      {cards ? (
        <div style={{ position: "absolute", left: 110, right: 110, top: 250, display: "flex", gap: 30, fontFamily: MONO }}>
          {([[eliCardAt, "hl3silh/eli_retrato.png", "PARA O ELI", "A CHAVE PARA SALVAR A TERRA", ORANGE], [alyxCardAt, "hl3silh/alyx_badge.jpg", "PARA A ALYX", "DESTRUIR ANTES QUE ALGUÉM CONTINUE O CICLO", ORANGE], [vargaCardAt, "hl3silh/varga_retrato.png", "PARA O VARGA", "UMA PORTA PARA ALGO QUE ELE JÁ TINHA PERDIDO", ORANGE]] as [number, string, string, string, string][]).map(([t0, img, who, what, c], i) => (
            <div key={i} style={{ flex: 1, display: "flex", gap: 18, padding: 18, borderRadius: 14, background: "rgba(10,10,12,0.92)", border: `1.5px solid ${c}`, opacity: f >= t0 ? P(f, t0, 10) : 0, transform: `translateY(${(1 - P(f, t0, 12)) * 40}px)` }}>
              {/* retrato em pé: o rosto inteiro (o cartão largo cortava só olhos e nariz) */}
              <div style={{ flex: "0 0 210px", height: 262, borderRadius: 10, overflow: "hidden", border: `2px solid ${c}`, backgroundImage: `url(${staticFile(img)})`, backgroundSize: "cover", backgroundPosition: "50% 30%" }} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <div style={{ fontSize: 15, letterSpacing: 4, color: c }}>{who} · O BOREALIS É</div>
                <div style={{ fontSize: 25, letterSpacing: 2, color: TXT, marginTop: 10, lineHeight: 1.25 }}>{what}</div>
              </div>
            </div>
          ))}
        </div>
      ) : null}
      <Hud f={f} yaw={e.yaw} eye={e} blips={[]} />
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 1:25:33 / 1:27:26 os dois caminhos físicos da sala
export const HL12Room: React.FC<PR & { mode?: number }> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const mode = p.mode ?? 0;
  const [barneyAt, advAt, almostAt, twoAt, useAt, colAt] = ats(p, ["barneyAt", "advAt", "almostAt", "twoAt", "useAt", "colAt"]);
  const [noMenuAt, pathsAt, leftAt, rightAt, gmanAt, waitAt] = ats(p, ["noMenuAt", "pathsAt", "leftAt", "rightAt", "gmanAt", "waitAt"]);
  void barneyAt;
  const G = useMemo(() => buildCoreRoom(true), []);
  const L0 = mode ? leftAt : useAt;
  const R0 = mode ? rightAt : colAt;
  const yaw = mode
    ? keys(f, [[0, 0], [leftAt - 4, 0], [leftAt + 22, -0.72], [rightAt - 4, -0.72], [rightAt + 26, 0.7], [gmanAt - 6, 0.7], [gmanAt + 26, 0.12], [life, 0.1]])
    : keys(f, [[0, 0], [useAt - 4, 0], [useAt + 22, -0.72], [colAt - 4, -0.72], [colAt + 26, 0.7], [life - 30, 0.7], [life, 0.35]]);
  const e = coreEye(f, { y: 3.2, shake: 0.12, yaw, pitch: keys(f, [[0, 0.04], [gmanAt - 6, 0.04], [gmanAt + 26, 0.08]]) });
  const al = 0.95 + P(f, mode ? 0 : almostAt, 40) * 0.035;
  const gq = proj(e, [6.0, 19.0, 0]);
  const gt = proj(e, [6.0, 19.0, 1.85]);
  const advIn = (k: number): [number, number, number] => { const [x, y, z] = [[-5.5, 18.5, 6.4], [5.8, 19, 6.8]][k]; return [x - (1 - P(f, advAt, 120)) * 1.5 * (k ? -1 : 1), y, z]; };
  const AS = useAdvScene([0, 1].map((k) => ({ pos: advIn(k), look: [CORE[0], CORE[1], CORE[2]] as [number, number, number], reach: 0.5, show: !mode && f >= advAt + k * 10 })), f, 2.6);
  return (
    <AbsoluteFill style={{ background: "#020304", overflow: "hidden" }}>
      <CoreRoom e={e} f={f} G={G} o={{ rings: notches(al), ringO: 1, wound: 1.2, arcs: 0.3, push: 0.9, hot: 0.6, mL: f >= L0 ? P(f, L0, 12) : 0, mR: f >= R0 ? P(f, R0, 12) : 0, extras: AS.extras, glLights: AS.lights }}>
        {/* os Advisors avançando pelo outro lado (no alto do fundo) */}
        {!mode && f >= advAt
          ? [[-5.5, 18.5, 6.4], [5.8, 19, 6.8]].map(([x, y, z], k) => {
              const q = proj(e, [x - (1 - P(f, advAt, 120)) * 1.5 * (k ? -1 : 1), y, z]);
              return q && !AS.ready ? <AdvisorArt key={k} x={q.x} y={q.y} w={Math.min(240, 900 / q.d)} f={f} lit={0.6} id={`rm${k}`} o={P(f, advAt + k * 10, 14)} flip={k === 1} /> : null;
            })
          : null}
        <Call e={e} f={f} pt={MECH_L} from={L0 + 10} until={mode ? rightAt : colAt} text={mode ? "O SISTEMA QUE COMPLETA O USO DO BOREALIS" : "USAR O CATALISADOR"} sub={mode ? undefined : "ACABAR COM OS COMBINE NA TERRA · CONFIAR QUE NINGUÉM VAI USAR DE NOVO"} col={ICE} dx={160} dy={-220} />
        <Call e={e} f={f} pt={MECH_R} from={R0 + 14} until={mode ? gmanAt : life} text={mode ? "O MECANISMO QUE LANÇA O NÚCLEO CONTRA A FERIDA" : "COLAPSAR O NÚCLEO"} sub={mode ? undefined : "QUEBRAR A CONVERGÊNCIA · SACRIFICAR A TERRA · SEM GARANTIA"} col={ORANGE} dx={-140} dy={-300} />
        {R0 < 1e8 ? <Call e={e} f={f} pt={ARM_R} from={R0 + 30} until={mode ? gmanAt : life} text="O BRAÇO QUE SEGURA O NÚCLEO" col={ORANGE} dx={220} dy={170} /> : null}
        <FlagAt e={e} pt={[-0.5, 7.0, 0]} label="ALYX" col={ORANGE} f={f} sub={mode ? undefined : "SEGURA O ALINHAMENTO"} />
      </CoreRoom>
      <ConsoleScreens e={e} f={f} quads={[LEFT_SCR]} />
      {/* modo 1: sem menu na tela */}
      {mode && f < pathsAt + 20 ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 460, display: "flex", justifyContent: "center", gap: 40, fontFamily: MONO, opacity: P(f, 4, 8) * (1 - P(f, pathsAt, 16)), filter: `blur(${P(f, noMenuAt + 20, 20) * 8}px)` }}>
          {["USAR O BOREALIS", "COLAPSAR O NÚCLEO"].map((s2) => (
            <div key={s2} style={{ position: "relative", padding: "18px 30px", border: "2px solid rgba(242,240,247,0.7)", background: "rgba(10,10,12,0.75)", fontSize: 26, letterSpacing: 4, color: TXT }}>
              [ {s2} ]
              {f >= noMenuAt ? <div style={{ position: "absolute", left: -6, right: -6, top: "50%", height: 4, background: RED, transform: `scaleX(${P(f, noMenuAt, 8)})`, transformOrigin: "left" }} /> : null}
            </div>
          ))}
        </div>
      ) : null}
      {mode && f >= noMenuAt && f < pathsAt + 30 ? <div style={{ position: "absolute", left: 0, right: 0, top: 600, textAlign: "center", fontFamily: MONO, fontSize: 22, letterSpacing: 8, color: CREAM, opacity: P(f, noMenuAt + 6, 8) * (1 - P(f, pathsAt + 14, 12)) }}>SEM MENU · SEM OPÇÕES ESCRITAS NA TELA</div> : null}
      {mode && f >= pathsAt && f < leftAt + 10 ? <div style={{ position: "absolute", left: 0, right: 0, top: 150, textAlign: "center", fontFamily: MONO, fontSize: 22, letterSpacing: 8, color: AMB, opacity: P(f, pathsAt, 8) * (1 - P(f, leftAt, 10)) }}>DOIS CAMINHOS FÍSICOS DENTRO DA SALA</div> : null}
      {/* o G-Man no fundo da sala, escondido, parado */}
      {mode && f >= gmanAt && gq && gt ? (() => {
        const h = gq.y - gt.y;
        return (
          <div style={{ position: "absolute", left: gq.x - h * 0.185, top: gt.y, width: h * 0.37, height: h, opacity: P(f, gmanAt, 24) * 0.9, filter: "drop-shadow(0 0 3px rgba(255,210,140,0.5))" }}>
            <div style={{ position: "absolute", inset: 0, WebkitMaskImage: `url(${staticFile("hl3silh/gman_silh.png")})`, maskImage: `url(${staticFile("hl3silh/gman_silh.png")})`, WebkitMaskSize: "100% 100%", maskSize: "100% 100%", background: "linear-gradient(180deg, #1a1612, #050404 80%)" }} />
          </div>
        );
      })() : null}
      {mode && f >= gmanAt + 30 && gq ? (
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <line x1={gq.x - 20} y1={gq.y - 120} x2={gq.x - 150} y2={gq.y - 230} stroke="rgba(207,232,255,0.7)" strokeWidth={1.5} opacity={P(f, gmanAt + 30, 10)} />
          <text x={gq.x - 160} y={gq.y - 236} textAnchor="end" fill="rgba(207,232,255,0.9)" fontFamily={MONO} fontSize={18} letterSpacing={3} opacity={P(f, gmanAt + 30, 10)}>{f >= waitAt ? "ESPERANDO, TAMBÉM" : "NÃO APONTA · NÃO INTERFERE"}</text>
        </svg>
      ) : null}
      {!mode && f >= almostAt ? <div style={{ position: "absolute", right: 110, top: 150, fontFamily: MONO, fontSize: 22, letterSpacing: 6, color: "#ffd27a", opacity: P(f, almostAt, 8) }}>ALINHAMENTO · {Math.round(al * 100)}% · QUASE COMPLETO</div> : null}
      {!mode && f >= twoAt && f < useAt + 10 ? <div style={{ position: "absolute", left: 0, right: 0, top: 200, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 60, color: TXT, opacity: P(f, twoAt, 8) * (1 - P(f, useAt, 10)) }}>duas possibilidades</div> : null}
      <Hud f={f} yaw={e.yaw} eye={e} blips={mode ? [] : [{ x: -1.5, y: 1.5 }, { x: 0.2, y: 0.8 }, { x: 1.4, y: 1.4 }, { x: -5, y: 19, hot: true }, { x: 5.6, y: 19, hot: true }]} msg={!mode && f < advAt ? "BARNEY E OS REBELDES · NA ENTRADA DO NÚCLEO" : !mode && f < almostAt ? "OS ADVISORS TAMBÉM AVANÇAM" : undefined} msgCol={!mode && f < advAt ? GREEN : VIO} />
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 1:26:03 o último passo é dele
export const HL12Last: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [certAt, firstAt, doubtAt, gmanAt, builtAt, memAt, usedAt, proofAt, refuseAt, s1At, s2At, s3At, lastAt, stillAt, askAt, clearAt, bothAt, colAt, useAt, promAt, finalAt] = ats(p, ["certAt", "firstAt", "doubtAt", "gmanAt", "builtAt", "memAt", "usedAt", "proofAt", "refuseAt", "s1At", "s2At", "s3At", "lastAt", "stillAt", "askAt", "clearAt", "bothAt", "colAt", "useAt", "promAt", "finalAt"]);
  const G = useMemo(() => buildCoreRoom(true), []);
  const yaw = keys(f, [[0, -0.06], [bothAt - 4, -0.06], [bothAt + 20, 0], [colAt - 4, 0], [colAt + 22, 0.75], [useAt - 4, 0.75], [useAt + 24, -0.78], [promAt - 4, -0.78], [promAt + 24, -0.05], [life, -0.05]]);
  const e = coreEye(f, { y: 3.6, shake: 0.1, yaw, pitch: keys(f, [[0, -0.02], [life, -0.02]]) });
  const split = P(f, doubtAt, 20);
  const ask = f >= askAt && f < clearAt + 10;
  const card = f < bothAt;
  return (
    <AbsoluteFill style={{ background: "#020304", overflow: "hidden" }}>
      <CoreRoom e={e} f={f} G={G} o={{ rings: notches(0.97), ringO: 1, wound: 1.2, arcs: 0.3, push: 0.9, hot: 0.6, mL: f >= useAt ? P(f, useAt, 12) : f >= bothAt ? 0.5 : 0, mR: f >= colAt ? P(f, colAt, 12) : f >= bothAt ? 0.5 : 0 }}>
        <FlagAt e={e} pt={[-0.5, 6.4, 0]} label="ALYX" col={ORANGE} f={f} sub={f >= lastAt ? "O ÚLTIMO PASSO É SEU" : f >= refuseAt ? "SE RECUSA A ESCOLHER" : f >= certAt ? "AINDA ACREDITA: DESTRUIR" : undefined} />
        <Call e={e} f={f} pt={MECH_R} from={colAt + 16} until={useAt} text="COLAPSAR" sub="ELA COMPLETA A SEQUÊNCIA" col={ORANGE} dx={-160} dy={-280} />
        <Call e={e} f={f} pt={MECH_L} from={useAt + 18} until={promAt} text="USAR COMO ARMA" sub="ELA REDIRECIONA O PROCEDIMENTO" col={ICE} dx={160} dy={-200} />
      </CoreRoom>
      <ConsoleScreens e={e} f={f} quads={[LEFT_SCR]} />
      {/* a certeza dela: é dela ou do G-Man? o crachá dividido entre a original e a agente */}
      {card ? (
        <div style={{ position: "absolute", right: 140, top: 140, width: 360, height: 450, opacity: P(f, 6, 12) * (1 - P(f, bothAt - 12, 12)) }}>
          {split > 0 ? <Badge x={180 - split * 190} y={225 + split * 20} w={360} mode="agent" label="A AGENTE" rot={-6 * split} glow={0.5 * split} o={split} /> : null}
          <Badge x={180} y={225} w={360} mode="orig" label="ALYX VANCE" glow={0.2} />
          <div style={{ position: "absolute", left: -220, right: 0, top: 470, textAlign: "right", fontFamily: MONO, fontSize: 18, letterSpacing: 3, color: TXT }}>{f >= gmanAt ? "DELA · OU A ÚLTIMA COISA QUE ELE DEIXOU?" : f >= doubtAt ? "ESSA CERTEZA É DELA?" : "A CERTEZA: DESTRUIR O NÚCLEO"}</div>
        </div>
      ) : null}
      {card ? (
        <div style={{ position: "absolute", left: 100, top: 130, width: 720, fontFamily: MONO, opacity: 1 - P(f, bothAt - 12, 12) }}>
          {f >= firstAt && f < refuseAt ? <div style={{ fontSize: 20, letterSpacing: 3, color: CREAM, opacity: P(f, firstAt, 8) * (1 - P(f, refuseAt - 8, 8)) }}>PELA PRIMEIRA VEZ · ALGO QUE ELA NÃO CONSEGUE RESPONDER</div> : null}
          {f >= builtAt && f < refuseAt ? <div style={{ marginTop: 14, padding: "8px 14px", borderLeft: "3px solid #cfe8ff", background: "rgba(8,10,14,0.85)", fontSize: 20, letterSpacing: 2, color: TXT, opacity: P(f, builtAt, 8) * (1 - P(f, refuseAt - 8, 8)) }}>ELE CONSTRUIU A AGENTE PARA LEVAR TUDO ATÉ ESTE MOMENTO</div> : null}
          {f < refuseAt
            ? ([[memAt, "RECUPEROU AS PRÓPRIAS MEMÓRIAS", "✓", GREEN], [usedAt, "USOU A AGENTE CONTRA ELE", "✓", GREEN], [proofAt, "PROVAR QUE DESTRUIR NÃO FAZ PARTE DO PLANO", "?", RED]] as [number, string, string, string][]).map(([t0, s2, mk2, c]) =>
                f >= t0 ? <div key={s2} style={{ display: "flex", gap: 12, marginTop: 10, fontSize: 20, letterSpacing: 2, color: TXT, opacity: P(f, t0, 8) * (1 - P(f, refuseAt - 8, 8)) }}><span style={{ color: c, width: 24 }}>{mk2}</span>{s2}</div> : null,
              )
            : null}
          {f >= refuseAt ? <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 48, color: TXT, opacity: P(f, refuseAt, 8) }}>ela se recusa a fazer a última escolha</div> : null}
          {([[s1At, "LEVOU O GORDON ATÉ ALI"], [s2At, "MANTEVE OS COMBINE AVANÇANDO"], [s3At, "SEGUROU O PROCEDIMENTO ATÉ O MOMENTO CERTO"]] as [number, string][]).map(([t0, s2]) =>
            f >= t0 ? <div key={s2} style={{ display: "flex", gap: 12, marginTop: 10, fontSize: 20, letterSpacing: 2, color: TXT, opacity: P(f, t0, 8) }}><span style={{ color: ORANGE, width: 24 }}>✓</span>FOI ELA QUEM {s2}</div> : null,
          )}
          {f >= lastAt ? (
            <div style={{ marginTop: 20, padding: "12px 20px", background: "rgba(10,8,2,0.82)", border: `1.5px solid ${AMB}`, borderRadius: 10, color: AMB, opacity: P(f, lastAt, 8) }}>
              <div style={{ fontSize: 15, letterSpacing: 5, opacity: 0.8 }}>O ÚLTIMO PASSO</div>
              <div style={{ fontSize: 26, letterSpacing: 3, marginTop: 4 }}>PRECISA SER DO GORDON</div>
            </div>
          ) : null}
        </div>
      ) : null}
      {/* o pedido */}
      {ask ? (
        <AbsoluteFill style={{ background: `rgba(2,3,4,${0.75 * P(f, askAt, 12) * (1 - P(f, clearAt, 10))})`, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 200px", fontFamily: FONT, opacity: 1 - P(f, clearAt, 10) }}>
          {f >= stillAt ? <div style={{ fontFamily: MONO, fontSize: 18, letterSpacing: 5, color: CREAM }}>ELA AINDA QUER DESTRUIR · AINDA ACREDITA QUE É A ÚNICA SAÍDA</div> : null}
          <div style={{ fontFamily: MONO, fontSize: 22, letterSpacing: 6, color: ORANGE, marginTop: 24 }}>ALYX</div>
          <div style={{ fontWeight: 800, fontSize: 64, color: TXT, marginTop: 10 }}>“Gordon, por favor, confie em mim mais uma vez.”</div>
        </AbsoluteFill>
      ) : null}
      {f >= stillAt && f < askAt ? <div style={{ position: "absolute", left: 0, right: 0, top: 860, textAlign: "center", fontFamily: MONO, fontSize: 20, letterSpacing: 5, color: CREAM, opacity: P(f, stillAt, 8) }}>ELA AINDA QUER DESTRUIR · AINDA ACREDITA QUE É A ÚNICA SAÍDA</div> : null}
      {f >= clearAt && f < bothAt + 30 ? <div style={{ position: "absolute", left: 0, right: 0, top: 150, textAlign: "center", fontFamily: MONO, fontSize: 22, letterSpacing: 5, color: TXT, opacity: P(f, clearAt + 4, 8) * (1 - P(f, bothAt + 16, 12)) }}>SE ELE ESCOLHER O CONTRÁRIO · ELA NÃO VAI IMPEDIR</div> : null}
      {f >= bothAt && f < promAt ? <div style={{ position: "absolute", left: 0, right: 0, top: 150, textAlign: "center", fontFamily: MONO, fontSize: 22, letterSpacing: 5, color: AMB, opacity: P(f, bothAt + 16, 8) }}>ELA SABE OPERAR OS DOIS CAMINHOS</div> : null}
      {f >= promAt ? (
        <div style={{ position: "absolute", left: 100, top: 130, width: 900, fontFamily: MONO, opacity: P(f, promAt, 8) }}>
          <div style={{ position: "relative", display: "inline-block", fontSize: 24, letterSpacing: 3, color: "rgba(242,240,247,0.6)" }}>
            PROMETE CONCORDAR
            <div style={{ position: "absolute", left: -4, right: -4, top: "50%", height: 3, background: RED, transform: `scaleX(${P(f, promAt + 10, 8)})`, transformOrigin: "left" }} />
          </div>
          <div style={{ fontSize: 26, letterSpacing: 3, color: TXT, marginTop: 10, opacity: P(f, promAt + 24, 8) }}>SÓ PROMETE NÃO ESCOLHER POR ELE</div>
          {f >= finalAt ? <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 46, color: CREAM, marginTop: 22, opacity: P(f, finalAt, 10) }}>talvez a única decisão que o G-Man não controla seja a que não vem dela</div> : null}
        </div>
      ) : null}
      <Hud f={f} yaw={e.yaw} eye={e} blips={[{ x: -0.5, y: 6.4 }]} />
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ================================================================================================= MÓDULO 13 · leva A (1:27:55 → 1:30:48)
// ---------------------------------------------------------------- 1:27:55 no lugar do jogador (a sala parada, os dois mecanismos, o comentário)
export const HL13Call: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [stopAt, playerAt, twoAt, useAt, destAt, beforeAt, commAt, nowAt, backAt, reactAt, feelAt, easyAt, noneAt] = ats(p, ["stopAt", "playerAt", "twoAt", "useAt", "destAt", "beforeAt", "commAt", "nowAt", "backAt", "reactAt", "feelAt", "easyAt", "noneAt"]);
  const G = useMemo(() => buildCoreRoom(true), []);
  // a mira do jogador indo de um mecanismo para o outro
  const yaw = keys(f, [[0, 0.1], [useAt - 6, 0.1], [useAt + 20, -0.72], [destAt - 6, -0.72], [destAt + 22, 0.7], [beforeAt, 0.7], [beforeAt + 30, 0.0], [life, 0.0]]);
  const e = coreEye(f, { y: 3.2, yaw, pitch: 0.04 });
  const pause = P(f, stopAt, 10);
  const box = f >= commAt;
  const typed = (s: string, t0: number, rate = 1.1) => s.slice(0, Math.max(0, Math.floor((f - t0) * rate)));
  return (
    <AbsoluteFill style={{ background: "#020304", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, filter: `saturate(${1 - pause * 0.6}) brightness(${1 - pause * 0.25})` }}>
        {/* a sala congelada: os anéis param (spin fixo) */}
        <CoreRoom e={e} f={stopAt < 1e8 ? Math.min(f, stopAt) : f} G={G} o={{ rings: notches(0.985), ringO: 1, wound: 1.2, push: 0.9, hot: 0.6, spin: 0.4, mL: f >= useAt ? P(f, useAt, 12) : 0.2, mR: f >= destAt ? P(f, destAt, 12) : 0.2 }}>
          <FlagAt e={e} pt={[-0.5, 7.0, 0]} label="ALYX" col={ORANGE} f={f} />
          <Call e={e} f={f} pt={MECH_L} from={useAt + 8} until={beforeAt + 20} text="USAR O BOREALIS COMO ARMA" sub="ACABAR COM OS COMBINE · SALVAR QUEM AINDA ESTÁ VIVO · CONFIAR QUE A HUMANIDADE NÃO REPETE O ERRO" col={ICE} dx={160} dy={-230} />
          <Call e={e} f={f} pt={MECH_R} from={destAt + 8} until={beforeAt + 20} text="DESTRUIR O NÚCLEO CONTRA A FERIDA" sub="QUEBRAR O CICLO · LEVAR A TERRA JUNTO · SEM SABER SE FUNCIONA" col={ORANGE} dx={-160} dy={-300} />
        </CoreRoom>
        <ConsoleScreens e={e} f={Math.min(f, stopAt)} quads={[LEFT_SCR]} />
      </div>
      {pause > 0 ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 110, textAlign: "center", fontFamily: MONO, fontSize: 20, letterSpacing: 12, color: "rgba(242,240,247,0.75)", opacity: pause * (1 - P(f, commAt, 10)) }}>❚❚ A HISTÓRIA PARA AQUI</div>
      ) : null}
      <Kin kind="type" t0={playerAt} until={twoAt} bottom={150} size={60} col={ORANGE} text="> você é o jogador" />
      {/* 30/10 (ele: partes faladas sem representação, sem exagerar): "duas possibilidades" = os dois lados acendendo; "antes
          de mostrar os dois finais" = os dois finais lacrados; no comentário, "fácil dizer que escolheria diferente",
          "volta no seu comentário" (o vídeo chega ao fim e volta) e "nenhuma das duas parecia certa" */}
      {f >= twoAt && f < useAt + 10 ? (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 150, display: "flex", justifyContent: "center", gap: 28, fontFamily: MONO, opacity: P(f, twoAt, 10) * (1 - P(f, useAt, 10)) }}>
          {([["◀ 1", ICE], ["2 ▶", ORANGE]] as [string, string][]).map(([t, col], i) => (
            <div key={i} style={{ padding: "14px 34px", border: `2px solid ${col}`, borderRadius: 10, background: "rgba(4,8,10,0.8)", color: col, fontSize: 40, letterSpacing: 6, transform: `scale(${0.9 + 0.1 * P(f, twoAt + i * 8, 10)})`, opacity: P(f, twoAt + i * 8, 10) }}>{t}</div>
          ))}
          <div style={{ position: "absolute", top: -44, fontSize: 22, letterSpacing: 8, color: CREAM }}>DUAS POSSIBILIDADES</div>
        </div>
      ) : null}
      {f >= beforeAt && f < commAt + 12 ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 380, display: "flex", justifyContent: "center", gap: 60, fontFamily: MONO, opacity: P(f, beforeAt + 14, 12) * (1 - P(f, commAt, 10)) }}>
          {(["FINAL 1", "FINAL 2"] as string[]).map((t, i) => (
            <div key={i} style={{ width: 360, height: 210, borderRadius: 14, background: "rgba(8,8,10,0.92)", border: "1.5px solid rgba(242,240,247,0.3)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, opacity: P(f, beforeAt + 14 + i * 10, 10) }}>
              <svg width={44} height={52} viewBox="0 0 44 52">
                <path d="M10 22 V14 a12 12 0 0 1 24 0 V22" fill="none" stroke={CREAM} strokeWidth={4} />
                <rect x={4} y={22} width={36} height={28} rx={4} fill={CREAM} />
              </svg>
              <div style={{ fontSize: 30, letterSpacing: 8, color: CREAM }}>{t}</div>
              <div style={{ fontSize: 15, letterSpacing: 5, color: "rgba(242,240,247,0.5)" }}>AINDA NÃO</div>
            </div>
          ))}
        </div>
      ) : null}

      {/* o campo de comentário (genérico, sem marca) */}
      {box ? (
        <AbsoluteFill style={{ background: `rgba(2,3,4,${0.72 * P(f, commAt, 12)})` }}>
          <div style={{ position: "absolute", left: 360, top: 330, width: 1200, padding: "26px 30px", borderRadius: 16, background: "rgba(16,16,20,0.96)", border: "1.5px solid rgba(242,240,247,0.25)", fontFamily: FONT, opacity: P(f, commAt, 12) }}>
            <div style={{ display: "flex", gap: 18, alignItems: "flex-start" }}>
              <div style={{ width: 56, height: 56, borderRadius: 28, background: "linear-gradient(135deg, #ffb22e, #c2701c)", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 18, color: "rgba(242,240,247,0.5)" }}>Adicione um comentário…</div>
                <div style={{ fontFamily: MONO, fontSize: 30, letterSpacing: 1, color: TXT, marginTop: 10, minHeight: 44 }}>
                  {typed("Eu escolheria ", commAt + 12)}
                  {f >= commAt + 30 ? <span style={{ color: AMB }}>{typed("______", commAt + 30, 0.5)}</span> : null}
                  {f >= commAt + 44 ? typed(" porque ", commAt + 44) : null}
                  {f >= commAt + 56 ? <span style={{ color: AMB }}>{typed("______", commAt + 56, 0.5)}</span> : null}
                  <span style={{ opacity: Math.floor(f / 15) % 2 ? 1 : 0 }}>▌</span>
                </div>
                <div style={{ height: 2, background: "rgba(242,240,247,0.35)", marginTop: 8 }} />
              </div>
            </div>
            {f >= nowAt ? <div style={{ marginTop: 22, fontFamily: MONO, fontSize: 20, letterSpacing: 4, color: AMB, opacity: P(f, nowAt, 8) }}>AGORA · ANTES DE VER A CONSEQUÊNCIA</div> : null}
            {f >= easyAt ? (
              <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 16, fontFamily: MONO, fontSize: 20, letterSpacing: 4, opacity: P(f, easyAt, 8) * (1 - 0.5 * P(f, backAt, 10)) }}>
                <span style={{ position: "relative", color: "rgba(242,240,247,0.55)" }}>
                  “EU ESCOLHERIA DIFERENTE”
                  <span style={{ position: "absolute", left: -4, right: -4, top: "50%", height: 3, background: RED, transform: `scaleX(${P(f, easyAt + 16, 12)})`, transformOrigin: "left" }} />
                </span>
                <span style={{ color: RED, fontSize: 16, opacity: P(f, easyAt + 24, 8) }}>DEPOIS DE SABER · FÁCIL DEMAIS</span>
              </div>
            ) : null}
            {f >= backAt ? (
              <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 16, fontFamily: MONO, fontSize: 20, letterSpacing: 4, color: CREAM, opacity: P(f, backAt, 8) }}>
                <span>NO FIM DO VÍDEO · VOLTE NO SEU COMENTÁRIO</span>
                {/* o vídeo correndo até o fim e a seta de volta */}
                <span style={{ position: "relative", width: 170, height: 6, borderRadius: 3, background: "rgba(242,240,247,0.2)" }}>
                  <span style={{ position: "absolute", left: 0, top: 0, bottom: 0, borderRadius: 3, background: RED, width: `${100 * P(f, backAt + 6, 40)}%` }} />
                </span>
                <span style={{ color: AMB, fontSize: 28, opacity: P(f, backAt + 46, 8), transform: `translateX(${-12 * P(f, backAt + 46, 14)}px)` }}>↩</span>
              </div>
            ) : null}
            {f >= reactAt ? <div style={{ marginTop: 10, fontFamily: MONO, fontSize: 20, letterSpacing: 4, color: TXT, opacity: P(f, reactAt, 8) }}>AINDA ESCOLHERIA A MESMA COISA?</div> : null}
          </div>
          {f >= noneAt ? (
            <div style={{ position: "absolute", left: 0, right: 0, top: 690, display: "flex", justifyContent: "center", gap: 40, fontFamily: MONO, opacity: P(f, noneAt, 10) }}>
              {([["USAR O BOREALIS", ICE], ["DESTRUIR O NÚCLEO", ORANGE]] as [string, string][]).map(([t, col], i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 20px", border: `1.5px solid ${col}`, borderRadius: 8, background: "rgba(4,8,10,0.85)", color: col, fontSize: 20, letterSpacing: 4 }}>
                  <span style={{ width: 22, height: 22, border: `2px solid ${col}`, borderRadius: 4, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>?</span>
                  {t}
                </div>
              ))}
            </div>
          ) : null}
          <Kin kind="quote" t0={feelAt} top={780} size={42} col="#ffd27a" text="você só escolhe e vive com aquilo" />
        </AbsoluteFill>
      ) : null}
      <Hud f={f} yaw={e.yaw} eye={e} blips={[]} />
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 1:29:03 o redirecionamento (Gordon nos controles físicos, Alyx segura o núcleo)
export const HL13Redirect: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [notAt, insideAt, limitAt, twoAt, colAt, useAt, saveAt, stopAt, helpAt, holdAt, ctrlAt, flowAt, turnAt, shotAt] = ats(p, ["notAt", "insideAt", "limitAt", "twoAt", "colAt", "useAt", "saveAt", "stopAt", "helpAt", "holdAt", "ctrlAt", "flowAt", "turnAt", "shotAt"]);
  void notAt;
  void insideAt;
  const G = useMemo(() => buildCoreRoom(true), []);
  // a câmera: o núcleo → a alavanca (colapso) → interrompe → anda até o console → mexe → volta para o núcleo e o disparo
  const yaw = keys(f, [[0, 0], [colAt - 4, 0], [colAt + 20, 0.7], [stopAt + 30, 0.7], [helpAt + 10, -0.72], [flowAt, -0.72], [flowAt + 24, 0], [life, 0]]);
  const ey = keys(f, [[0, 3.2], [helpAt, 3.2], [ctrlAt, 6.4], [flowAt, 6.4], [flowAt + 30, 3.6], [life, 3.4]]);
  const ex = keys(f, [[0, 0], [helpAt, 0], [ctrlAt, -2.4], [flowAt, -2.4], [flowAt + 30, 0], [life, 0]]);
  const e0 = coreEye(f, { y: ey, yaw, pitch: keys(f, [[0, 0.04], [shotAt - 6, 0.04], [shotAt + 20, 0.2], [life, 0.22]]), shake: f >= shotAt ? 0.6 : 0.1 });
  const e: Eye = { ...e0, x: e0.x + ex };
  const stopped = f >= stopAt;
  const reconf = P(f, ctrlAt + 20, 60);
  const shot = P(f, shotAt, 14);
  const flash = f >= shotAt && f < shotAt + 10 ? 1 - (f - shotAt) / 10 : 0;
  const top = proj(e, [CORE[0], CORE[1], 8.6]);
  const cq = proj(e, CORE);
  return (
    <AbsoluteFill style={{ background: "#020304", overflow: "hidden" }}>
      <CoreRoom e={e} f={f} G={G} o={{ rings: notches(0.985 + P(f, flowAt, 40) * 0.015), ringO: 1, wound: 1.2 - shot * 0.6, arcs: stopped ? 0 : 0.5, push: 0.9, hot: 0.6 + shot * 0.6, mL: f >= ctrlAt ? 0.6 + 0.4 * reconf : 0.2, mR: stopped ? 0.05 : P(f, colAt, 12), beam: 0 }}>
        {/* em vez de descer para a ferida, a energia sobe: o disparo */}
        {shot > 0 && top && cq ? (
          <g opacity={shot}>
            <line x1={cq.x} y1={cq.y} x2={top.x} y2={top.y - 400} stroke="rgba(159,230,255,0.6)" strokeWidth={70} style={{ filter: "blur(14px)" }} />
            <line x1={cq.x} y1={cq.y} x2={top.x} y2={top.y - 400} stroke="#f0fbff" strokeWidth={10} />
          </g>
        ) : null}
        <FlagAt e={e} pt={[-0.5, 7.0, 0]} label="ALYX" col={ORANGE} f={f} sub={f >= holdAt ? "MANTÉM O NÚCLEO ESTÁVEL" : f >= limitAt ? "NO LIMITE DO ALINHAMENTO" : undefined} />
        {f >= colAt && f < saveAt ? <Call e={e} f={f} pt={MECH_R} from={colAt + 8} until={saveAt} text="UMA FAZ O NÚCLEO COLAPSAR CONTRA A FERIDA" col={ORANGE} dx={-160} dy={-300} /> : null}
        {stopped && f < helpAt + 10 ? (() => {
          const q = proj(e, MECH_R);
          return q ? (
            <g opacity={P(f, stopAt, 6) * (1 - P(f, helpAt, 10))}>
              <line x1={q.x - 60} y1={q.y - 60} x2={q.x + 60} y2={q.y + 60} stroke={RED} strokeWidth={8} />
              <line x1={q.x + 60} y1={q.y - 60} x2={q.x - 60} y2={q.y + 60} stroke={RED} strokeWidth={8} />
              <text x={q.x} y={q.y - 90} textAnchor="middle" fill={RED} fontFamily={MONO} fontSize={22} letterSpacing={4}>SEQUÊNCIA DO COLAPSO · INTERROMPIDA</text>
            </g>
          ) : null;
        })() : null}
      </CoreRoom>
      <ConsoleScreens e={e} f={f} quads={[LEFT_SCR]} alert={false} />
      {/* o console: a configuração final muda de COLAPSO para DISPARO */}
      {f >= ctrlAt && f < flowAt + 20 ? (
        <div style={{ position: "absolute", right: 120, top: 150, width: 560, padding: "16px 20px", borderRadius: 12, background: "rgba(8,18,24,0.9)", border: `1.5px solid ${ICE}`, fontFamily: MONO, opacity: P(f, ctrlAt, 10) * (1 - P(f, flowAt + 6, 12)) }}>
          <div style={{ fontSize: 15, letterSpacing: 5, color: ICE }}>CONFIGURAÇÃO FINAL DO SISTEMA</div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 12, fontSize: 28, letterSpacing: 3 }}>
            <span style={{ position: "relative", color: "rgba(242,240,247,0.6)" }}>
              COLAPSO
              <span style={{ position: "absolute", left: -4, right: -4, top: "50%", height: 3, background: RED, transform: `scaleX(${reconf})`, transformOrigin: "left" }} />
            </span>
            <span style={{ color: ICE }}>→</span>
            <span style={{ color: ICE, opacity: reconf }}>DISPARO</span>
          </div>
          <div style={{ position: "relative", height: 14, marginTop: 14, border: "1.5px solid rgba(159,230,255,0.6)" }}>
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${reconf * 100}%`, background: "rgba(159,230,255,0.6)" }} />
          </div>
        </div>
      ) : null}
      {f >= ctrlAt && f < flowAt ? (
        <div style={{ position: "absolute", left: "50%", top: 700, transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: 14, padding: "12px 22px", background: "rgba(10,8,2,0.8)", border: `1.5px solid ${AMB}`, borderRadius: 10, fontFamily: MONO, color: AMB, opacity: P(f, ctrlAt, 8) }}>
          <span style={{ padding: "2px 10px", border: `1.5px solid ${AMB}`, borderRadius: 6, fontSize: 24, background: Math.floor(f / 12) % 2 ? AMB : "transparent", color: Math.floor(f / 12) % 2 ? "#0a0806" : AMB }}>E</span>
          <span style={{ fontSize: 24, letterSpacing: 3 }}>OS CONTROLES FÍSICOS DA SALA</span>
        </div>
      ) : null}
      <div style={{ position: "absolute", left: 100, top: 130, width: 720, fontFamily: MONO }}>
        {f < twoAt + 20 ? <div style={{ fontSize: 20, letterSpacing: 4, color: CREAM, opacity: P(f, 6, 10) * (1 - P(f, twoAt + 6, 12)) }}>A DECISÃO ACONTECE DENTRO DO NÚCLEO</div> : null}
        {f >= twoAt && f < saveAt ? <div style={{ fontSize: 20, letterSpacing: 4, color: TXT, opacity: P(f, twoAt, 8) * (1 - P(f, saveAt - 6, 8)) }}>DUAS MANEIRAS DE COMPLETAR O PROCEDIMENTO</div> : null}
        {f >= useAt && f < saveAt ? <div style={{ fontSize: 18, letterSpacing: 3, color: ICE, marginTop: 10, opacity: P(f, useAt, 8) * (1 - P(f, saveAt - 6, 8)) }}>OU USAR O BOREALIS NO MESMO INSTANTE</div> : null}
        {f >= saveAt ? (
          <div style={{ padding: "12px 20px", background: "rgba(10,8,2,0.82)", border: `1.5px solid ${AMB}`, borderRadius: 10, color: AMB, opacity: P(f, saveAt, 8) * (1 - P(f, shotAt, 10)) }}>
            <div style={{ fontSize: 15, letterSpacing: 5, opacity: 0.8 }}>ESCOLHA DO GORDON</div>
            <div style={{ fontSize: 28, letterSpacing: 3, marginTop: 4 }}>SALVAR A TERRA</div>
          </div>
        ) : null}
        {f >= helpAt && f < ctrlAt + 10 ? <div style={{ fontSize: 18, letterSpacing: 3, color: ICE, marginTop: 12, opacity: P(f, helpAt, 8) }}>AJUDAR A ALYX A REDIRECIONAR O MECANISMO</div> : null}
        {f >= flowAt && f < shotAt + 10 ? <div style={{ fontSize: 20, letterSpacing: 3, color: "#ffd27a", marginTop: 14, opacity: P(f, flowAt, 8) }}>O ALINHAMENTO CONTINUA · 100%</div> : null}
        {f >= turnAt && f < shotAt + 10 ? <div style={{ position: "relative", display: "inline-block", fontSize: 20, letterSpacing: 3, color: "rgba(242,240,247,0.65)", marginTop: 10, opacity: P(f, turnAt, 8) }}>DEVOLVER A ENERGIA CONTRA A FERIDA<span style={{ position: "absolute", left: -4, right: -4, top: "50%", height: 3, background: RED, transform: `scaleX(${P(f, turnAt + 8, 8)})`, transformOrigin: "left" }} /></div> : null}
      </div>
      <Kin kind="light" t0={shotAt + 4} bottom={160} size={66} col="#ffb0a0" text="um disparo" />
      {flash > 0 ? <AbsoluteFill style={{ background: `rgba(230,250,255,${flash * 0.85})` }} /> : null}
      <Hud f={f} yaw={e.yaw} eye={e} blips={[{ x: -0.5, y: 7.0 }]} msg={f < twoAt && f >= 6 ? "SEM MENU NA TELA" : undefined} msgCol={AMB} />
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 1:29:44 a remoção (a assinatura da rede local · os feeds das câmeras Combine perdendo os alvos)
const GunshipSil: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M -70 0 Q -30 -16 30 -10 L 70 -4 L 40 6 Q -20 14 -70 0 Z" fill="#0c0e10" />
    <path d="M -10 -12 L -40 -40 M 10 -12 L 40 -40" stroke="#0c0e10" strokeWidth={6} />
    <ellipse cx={0} cy={-44} rx={60} ry={4} fill="rgba(200,220,230,0.15)" />
    <circle cx={52} cy={-4} r={3} fill={RED} />
  </g>
);
const Rupture: React.FC<{ cx: number; cy: number; h: number; t: number }> = ({ cx, cy, h, t }) => {
  if (t <= 0 || t >= 1) return null;
  const w = Math.sin(t * Math.PI) * h * 0.35;
  return (
    <g>
      <ellipse cx={cx} cy={cy} rx={w * 1.6} ry={h * 0.75} fill="rgba(199,155,255,0.25)" style={{ filter: "blur(10px)" }} />
      <ellipse cx={cx} cy={cy} rx={w} ry={h * 0.6} fill="rgba(240,230,255,0.9)" />
      <ellipse cx={cx} cy={cy} rx={w * 0.4} ry={h * 0.45} fill="#ffffff" />
    </g>
  );
};
const CctvFeed: React.FC<{ f: number; x: number; y: number; title: string; at: number; tR: number; kind: "strider" | "gunship" | "soldiers" | "synth" | "advisor" }> = ({ f, x, y, title, at: t0, tR, kind }) => {
  if (f < t0) return null;
  const W = 540;
  const H = 320;
  const rt = (f - tR) / 18;
  const gone = f >= tR + 9;
  const lost = f >= tR + 24;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: W, height: H, borderRadius: 6, overflow: "hidden", border: `2px solid ${lost ? RED : "rgba(159,230,255,0.5)"}`, background: "#0a1014", opacity: P(f, t0, 8) }}>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id={`cc${title}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#5a7484" />
            <stop offset="0.7" stopColor="#2a3a44" />
            <stop offset="1" stopColor="#141c22" />
          </linearGradient>
        </defs>
        <rect width={W} height={H} fill={`url(#cc${title})`} />
        {/* a cidade ao fundo */}
        <path d={`M 0 250 ${Array.from({ length: 18 }).map((_, i) => `L ${i * 32} ${200 - rnd(i * 3 + title.length) * 90} L ${i * 32 + 26} ${200 - rnd(i * 3 + title.length) * 90}`).join(" ")} L ${W} 250 L ${W} ${H} L 0 ${H} Z`} fill="#1a242a" />
        <rect x={0} y={250} width={W} height={70} fill="#1e282e" />
        {!gone && kind === "strider" ? (
          <g fill="none" stroke="#050607" strokeLinecap="round">
            <path d="M 236 92 L 196 170 L 172 252" strokeWidth={7} />
            <path d="M 300 92 L 352 168 L 372 252" strokeWidth={7} />
            <path d="M 268 100 L 286 178 L 262 252" strokeWidth={6} />
            <ellipse cx={268} cy={84} rx={56} ry={20} fill="#050607" stroke="none" />
            <path d="M 316 84 L 342 96" strokeWidth={6} />
            <circle cx={238} cy={88} r={4} fill={RED} stroke="none" />
          </g>
        ) : null}
        {!gone && kind === "gunship" ? <GunshipSil x={270} y={110 + Math.sin(f / 10) * 4} s={1.4} /> : null}
        {!gone && kind === "soldiers" ? [150, 220, 290, 360].map((sx, i) => <g key={i}><rect x={sx - 8} y={200} width={16} height={46} fill="#0c0e10" /><circle cx={sx} cy={192} r={9} fill="#0c0e10" /><circle cx={sx + 3} cy={191} r={2.5} fill={RED} /></g>) : null}
        {!gone && kind === "synth" ? <image href={staticFile("hl3silh/hunter_peca.png")} x={180} y={90} width={180} height={170} preserveAspectRatio="xMidYMid meet" style={{ filter: "brightness(0)" }} /> : null}
        {!gone && kind === "advisor" ? <AdvisorArt x={270} y={140} w={220} f={f} lit={0.5} id={`cc${title}`} /> : null}
        <Rupture cx={270} cy={kind === "gunship" ? 110 : kind === "soldiers" ? 220 : 160} h={kind === "soldiers" ? 120 : 200} t={rt} />
        {Array.from({ length: 30 }).map((_, i) => <line key={i} x1={0} y1={i * 11 + ((f * 2) % 11)} x2={W} y2={i * 11 + ((f * 2) % 11)} stroke="rgba(0,0,0,0.25)" />)}
      </svg>
      <div style={{ position: "absolute", left: 10, top: 8, fontFamily: MONO, fontSize: 14, letterSpacing: 3, color: ICE }}>● {title}</div>
      <div style={{ position: "absolute", right: 10, top: 8, fontFamily: MONO, fontSize: 14, letterSpacing: 2, color: "rgba(159,230,255,0.7)" }}>{`00:${String(Math.floor(f / 30) % 60).padStart(2, "0")}:${String(f % 30).padStart(2, "0")}`}</div>
      {lost ? <div style={{ position: "absolute", left: 0, right: 0, bottom: 14, textAlign: "center", fontFamily: MONO, fontSize: 18, letterSpacing: 4, color: RED, opacity: P(f, tR + 24, 6) }}>ALVO · SEM SINAL</div> : null}
    </div>
  );
};
// 12/10 (pedido dele: do 1:17 ao fim refeito; as câmeras com prédios toscos): a ficha de rastreio Overwatch de cada unidade
// — a unidade em holograma (linhas de varredura dentro da silhueta: o gunship e o Advisor são o próprio modelo 3D
// renderizado), coordenadas e sinal; na hora dela, uma ruptura violeta a arranca e o status vira SINAL PERDIDO · DESLOCADO
const UnitTrack: React.FC<{ f: number; x: number; y: number; w?: number; h?: number; title: string; unit: string; mask?: string; at: number; tR: number; col?: string; count?: number; total?: number }> = ({ f, x, y, w = 560, h = 330, title, unit, mask, at, tR, col = "#7fe8ff", count, total }) => {
  const k = P(f, at, 10);
  if (k <= 0) return null;
  const rip = P(f, tR, 18);
  const gone = f >= tR + 18;
  const ph = (f % 90) / 90;
  const cx = w / 2, cy = h * 0.5;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, opacity: k, borderRadius: 10, background: "linear-gradient(180deg, rgba(10,18,24,0.94), rgba(4,8,12,0.96))", border: `1.5px solid ${gone ? RED : "rgba(127,232,255,0.45)"}`, overflow: "hidden", fontFamily: MONO }}>
      <div style={{ position: "absolute", left: 12, top: 10, fontSize: 13, letterSpacing: 3, color: "rgba(159,230,255,0.75)" }}>OVERWATCH · RASTREIO · {title}</div>
      <div style={{ position: "absolute", right: 12, top: 10, fontSize: 13, letterSpacing: 2, color: gone ? RED : "#8dffa8" }}>{gone ? "● SEM SINAL" : "● ATIVO"}</div>
      {/* a grade e a mira */}
      <svg width={w} height={h} style={{ position: "absolute", inset: 0 }}>
        {Array.from({ length: 12 }).map((_, i) => <line key={i} x1={i * 50} y1={34} x2={i * 50} y2={h - 30} stroke="rgba(127,232,255,0.06)" />)}
        {Array.from({ length: 6 }).map((_, i) => <line key={"h" + i} x1={0} y1={40 + i * 50} x2={w} y2={40 + i * 50} stroke="rgba(127,232,255,0.06)" />)}
        {!gone ? <rect x={cx - 120} y={cy - 92} width={240} height={184} fill="none" stroke="rgba(255,93,77,0.6)" strokeWidth={1.5} strokeDasharray="12 8" /> : null}
        {rip > 0 && rip < 1 ? [0, 1, 2].map((r) => <circle key={r} cx={cx} cy={cy} r={20 + (200 + r * 60) * rip} fill="none" stroke={VIO} strokeWidth={4 - r} opacity={(1 - rip) * (1 - r * 0.25)} />) : null}
        {rip > 0 ? <circle cx={cx} cy={cy} r={60 * Math.sin(rip * Math.PI)} fill="rgba(220,190,255,0.5)" /> : null}
      </svg>
      {/* a unidade em holograma */}
      {/* 12/10 (pedido dele: o Combine tem milhares na Terra, não uma unidade): o enxame em profundidade — fileiras que somem
          no fundo da grade, cada uma menor e mais apagada; na ruptura elas são arrancadas em onda, da frente para o fundo */}
      {mask && total !== undefined ? (
        <div style={{ position: "absolute", left: 0, top: 34, width: w, height: h - 70, overflow: "hidden" }}>
          {Array.from({ length: 5 }).flatMap((_, r) => {
            const n = 5 + r * 3, s = 1 - r * 0.17, yy = h - 150 - r * 34 - (1 - s) * 40;
            return Array.from({ length: n }).map((__, i) => {
              const xx = w / 2 + (i - (n - 1) / 2) * (110 * s) + (r % 2) * 14;
              const tOut = tR + r * 6 + Math.abs(i - (n - 1) / 2) * 1.5 + rnd(r * 31 + i) * 6;
              const rr = P(f, tOut, 10);
              const ww = 120 * s, hh = 84 * s;
              if (rr >= 1) return null;
              return (
                <div key={r + "_" + i} style={{ position: "absolute", left: xx - ww / 2, top: yy - hh / 2, width: ww, height: hh, opacity: (1 - r * 0.15) * (1 - rr), transform: `scaleY(${1 - rr * 0.9}) scaleX(${1 + rr * 0.4})`, filter: `drop-shadow(0 0 ${4 * s}px ${col})` }}>
                  <div style={{ position: "absolute", inset: 0, WebkitMaskImage: `url(${staticFile(mask)})`, maskImage: `url(${staticFile(mask)})`, WebkitMaskSize: "contain", maskSize: "contain", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", background: `repeating-linear-gradient(0deg, ${col} 0 2px, rgba(127,232,255,0.15) 2px 4px)` }} />
                  {rr > 0 ? <div style={{ position: "absolute", left: "50%", top: "50%", width: 30 * s, height: 30 * s, marginLeft: -15 * s, marginTop: -15 * s, borderRadius: "50%", background: `radial-gradient(circle, rgba(230,200,255,${0.9 * Math.sin(rr * Math.PI)}), rgba(199,155,255,0))` }} /> : null}
                </div>
              );
            });
          }).reverse()}
          <div style={{ position: "absolute", left: 0, right: 0, top: 8, textAlign: "center", fontFamily: MONO, fontSize: 26, letterSpacing: 3, color: gone ? RED : "#e9f9ff", textShadow: "0 2px 10px #000" }}>
            {Math.max(0, Math.round(total * (1 - P(f, tR, 46)))).toLocaleString("pt-BR")}
            <span style={{ fontSize: 13, letterSpacing: 3, color: "rgba(159,230,255,0.7)", marginLeft: 10 }}>NA TERRA</span>
          </div>
        </div>
      ) : null}
      {mask && total === undefined && !gone ? (
        <div style={{ position: "absolute", left: cx - 150, top: cy - 100, width: 300, height: 200, transform: `scaleY(${1 - rip * 0.9}) scaleX(${1 + rip * 0.4})`, opacity: 1 - rip, filter: `drop-shadow(0 0 6px ${col})` }}>
          <div style={{ position: "absolute", inset: 0, WebkitMaskImage: `url(${staticFile(mask)})`, maskImage: `url(${staticFile(mask)})`, WebkitMaskSize: "contain", maskSize: "contain", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", background: `repeating-linear-gradient(0deg, ${col} 0 2px, rgba(127,232,255,0.18) 2px 5px)` }} />
          <div style={{ position: "absolute", left: 0, right: 0, top: `${ph * 100}%`, height: 3, background: "rgba(255,255,255,0.6)", WebkitMaskImage: `url(${staticFile(mask)})`, maskImage: `url(${staticFile(mask)})`, WebkitMaskSize: "300px 200px", maskSize: "300px 200px", WebkitMaskPosition: `0 ${-ph * 200}px`, maskPosition: `0 ${-ph * 200}px` }} />
        </div>
      ) : null}
      {count !== undefined ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: cy - 70, textAlign: "center", opacity: 1 - rip * 0.2 }}>
          <div style={{ display: "inline-flex", gap: 4, flexWrap: "wrap", width: 330, justifyContent: "center" }}>
            {Array.from({ length: 36 }).map((_, i) => {
              const out = f >= tR + (i % 9) * 2 + Math.floor(i / 9) * 3;
              return <div key={i} style={{ width: 30, height: 30, borderRadius: 3, backgroundImage: `url(${staticFile("hl3silh/combine_badge.jpg")})`, backgroundSize: "cover", backgroundPosition: "50% 30%", filter: "grayscale(0.4) sepia(0.2) hue-rotate(160deg)", opacity: out ? 0.08 : 0.9, border: `1px solid ${out ? RED : "rgba(127,232,255,0.5)"}` }} />;
            })}
          </div>
          <div style={{ fontSize: 20, letterSpacing: 3, color: gone ? RED : TXT, marginTop: 8 }}>{`${Math.max(0, Math.round(count * (1 - P(f, tR, 46)))).toLocaleString("pt-BR")} NA TERRA`}</div>
        </div>
      ) : null}
      <div style={{ position: "absolute", left: 14, bottom: 12, fontSize: 15, letterSpacing: 2, color: gone ? "rgba(242,240,247,0.5)" : TXT }}>{unit}</div>
      <div style={{ position: "absolute", right: 14, bottom: 12, fontSize: 13, letterSpacing: 1, color: gone ? RED : "rgba(159,230,255,0.75)" }}>{gone ? "SINAL PERDIDO · DESLOCADO" : `SINAL ${(92 - (f % 7)).toString()}%`}</div>
    </div>
  );
};
export const HL13Removal: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [hypAt, netAt, notOwAt, sigAt, loadAt, idAt, nodeAt, seqAt, fireAt, nobodyAt, ruptAt, striderAt, gunAt, soldAt, synthAt, advAt, noBoomAt, removeAt] = ats(p, ["hypAt", "netAt", "notOwAt", "sigAt", "loadAt", "idAt", "nodeAt", "seqAt", "fireAt", "nobodyAt", "ruptAt", "striderAt", "gunAt", "soldAt", "synthAt", "advAt", "noBoomAt", "removeAt"]);
  void hypAt;
  const feeds = f >= ruptAt - 20;
  const nodes = Math.max(0, Math.round(1337600 * (1 - P(f, ruptAt, (removeAt - ruptAt) || 60))));
  const hit = P(f, ruptAt, 30);
  const sigW = (i: number) => 0.5 + 0.3 * Math.sin(i * 0.5) * Math.cos(i * 0.13) + 0.15 * Math.sin(i * 1.9);
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, #0c141a 0%, #030507 80%)", overflow: "hidden" }}>
      {/* a hipótese do Kleiner e do Magnusson: a rede local da Union na Terra */}
      {!feeds ? (
        <>
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
            <Globe f={f} cx={1280} cy={540} R={340} rot={f * 0.2} nodes={P(f, netAt, 20)} links={P(f, netAt + 10, 30) * (f >= notOwAt ? 1 : 1)} sync={f >= sigAt ? 1 : 0} hit={f >= ruptAt ? hit : 0} o={1} />
            {f >= notOwAt ? (
              <g opacity={P(f, notOwAt, 10)}>
                <line x1={1280} y1={180} x2={1280} y2={40} stroke={VIO} strokeWidth={3} strokeDasharray="10 8" />
                <line x1={1240} y1={90} x2={1320} y2={130} stroke={RED} strokeWidth={6} />
                <text x={1300} y={70} fill={RED} fontFamily={MONO} fontSize={18} letterSpacing={3}>O SUPER PORTAL DE WHITE FOREST CORTOU O CONTATO</text>
              </g>
            ) : null}
            {f >= fireAt ? <line x1={1280} y1={-20} x2={1280 + 120} y2={420} stroke="rgba(159,230,255,0.7)" strokeWidth={10} opacity={1 - P(f, fireAt + 20, 20)} /> : null}
          </svg>
          <div style={{ position: "absolute", left: 100, top: 120, width: 760, fontFamily: MONO }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              {["hl3silh/kleiner_retrato.png", "hl3silh/magnusson_badge.jpg"].map((img) => <div key={img} style={{ width: 60, height: 70, borderRadius: 6, overflow: "hidden", border: `2px solid ${AMB}`, backgroundImage: `url(${staticFile(img)})`, backgroundSize: "cover", backgroundPosition: "50% 25%" }} />)}
              <div style={{ fontSize: 16, letterSpacing: 5, color: AMB }}>A HIPÓTESE · KLEINER E MAGNUSSON</div>
            </div>
            {f >= netAt ? <div style={{ marginTop: 18, fontSize: 22, letterSpacing: 2, color: TXT, opacity: P(f, netAt, 8) }}>OS COMBINE PRESOS NA TERRA · AINDA LIGADOS POR UMA REDE LOCAL DA UNION</div> : null}
            {f >= sigAt ? (
              <div style={{ marginTop: 18, padding: "12px 16px", borderRadius: 10, border: `1.5px solid ${VIO}`, background: "rgba(16,10,24,0.85)", opacity: P(f, sigAt, 8) }}>
                <div style={{ fontSize: 15, letterSpacing: 5, color: VIO }}>ASSINATURA COMUM · SOLDADOS · SYNTHS · ADVISORS</div>
                <svg width={700} height={70} style={{ marginTop: 8 }}>
                  <polyline points={Array.from({ length: 80 }).map((_, i) => `${i * 8.8},${60 - sigW(i) * 50}`).join(" ")} fill="none" stroke={VIO} strokeWidth={2.5} />
                </svg>
              </div>
            ) : null}
            {f >= loadAt ? (
              <div style={{ marginTop: 18, padding: "12px 16px", borderRadius: 10, border: `1.5px solid ${ICE}`, background: "rgba(8,18,24,0.85)", opacity: P(f, loadAt, 8) }}>
                <div style={{ fontSize: 15, letterSpacing: 5, color: ICE }}>BOREALIS · CARREGANDO</div>
                <div style={{ position: "relative", height: 12, marginTop: 8, border: "1.5px solid rgba(159,230,255,0.6)" }}>
                  <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${P(f, loadAt, 60) * 100}%`, background: "rgba(159,230,255,0.6)" }} />
                </div>
                {f >= idAt ? (
                  <div style={{ display: "flex", gap: 16, alignItems: "center", marginTop: 10, fontSize: 20, letterSpacing: 2, color: TXT, opacity: P(f, idAt, 8) }}>
                    <span style={{ position: "relative", color: "rgba(242,240,247,0.6)" }}>COORDENADA<span style={{ position: "absolute", left: -3, right: -3, top: "50%", height: 3, background: RED, transform: `scaleX(${P(f, idAt + 8, 8)})`, transformOrigin: "left" }} /></span>
                    <span style={{ color: ICE }}>→ IDENTIFICAÇÃO</span>
                  </div>
                ) : null}
                {f >= nodeAt ? <div style={{ fontSize: 18, letterSpacing: 2, color: ICE, marginTop: 8, opacity: P(f, nodeAt, 8) }}>A FENDA PROCURA QUALQUER NÓ QUE AINDA RESPONDA</div> : null}
              </div>
            ) : null}
            {f >= seqAt ? <div style={{ marginTop: 16, fontSize: 20, letterSpacing: 3, color: AMB, opacity: P(f, seqAt, 8) }}>GORDON COMPLETA A SEQUÊNCIA · ALYX MANTÉM O NÚCLEO ESTÁVEL</div> : null}
            {f >= fireAt ? <div style={{ display: "inline-block", marginTop: 18, padding: "12px 20px", background: "rgba(16,10,24,0.88)", borderLeft: `4px solid ${VIO}`, fontSize: 34, letterSpacing: 6, color: VIO, opacity: P(f, fireAt, 8) }}>O BOREALIS DISPARA</div> : null}
            {f >= nobodyAt ? <div style={{ fontSize: 18, letterSpacing: 3, color: "rgba(242,240,247,0.7)", marginTop: 8, opacity: P(f, nobodyAt, 8) }}>POR ALGUNS SEGUNDOS · NINGUÉM SABE SE A TEORIA ESTAVA CERTA</div> : null}
          </div>
        </>
      ) : null}
      {/* as câmeras Combine: os alvos sendo arrancados um a um */}
      {feeds ? (
        <>
          <UnitTrack f={f} x={100} y={130} title="CIDADES" unit="STRIDERS" total={4812} mask="hl3silh/strider_peca.png" at={ruptAt - 20} tR={striderAt + 10} />
          <UnitTrack f={f} x={690} y={130} title="ESPAÇO AÉREO" unit="GUNSHIPS" total={9640} mask="hl3silh/gunship_mask.png" at={ruptAt - 14} tR={gunAt + 10} />
          <UnitTrack f={f} x={1280} y={130} title="GUARNIÇÕES" unit="SOLDADOS" count={1284730} at={ruptAt - 8} tR={soldAt + 10} />
          <UnitTrack f={f} x={395} y={500} title="PERÍMETROS" unit="HUNTERS · SYNTHS" total={38200} mask="hl3silh/hunter_peca.png" at={ruptAt - 2} tR={synthAt + 10} />
          <UnitTrack f={f} x={985} y={500} title="CIDADELAS" unit="ADVISORS · NÓS PRINCIPAIS" total={214} mask="hl3silh/advisor_mask.png" col="#c79bff" at={ruptAt + 4} tR={advAt + 12} />
          {f >= advAt + 20 ? <div style={{ position: "absolute", left: 985, top: 840, width: 540, fontFamily: MONO, fontSize: 16, letterSpacing: 3, color: VIO, opacity: P(f, advAt + 20, 8) }}>OS ADVISORS · OS NÓS MAIS FORTES DA REDE</div> : null}
        </>
      ) : null}
      {f >= ruptAt ? <div style={{ position: "absolute", right: 110, top: 60, fontFamily: MONO, fontSize: 26, letterSpacing: 4, color: nodes > 0 ? VIO : RED, opacity: P(f, ruptAt, 8) }}>NÓS ATIVOS DA UNION · {nodes.toLocaleString("pt-BR")}</div> : null}
      {f >= noBoomAt ? (
        <div style={{ position: "absolute", left: 100, bottom: 110, fontFamily: MONO, opacity: P(f, noBoomAt, 8) }}>
          <div style={{ position: "relative", display: "inline-block", fontSize: 22, letterSpacing: 3, color: "rgba(242,240,247,0.65)" }}>UMA EXPLOSÃO DESTRUINDO TUDO<span style={{ position: "absolute", left: -4, right: -4, top: "50%", height: 3, background: RED, transform: `scaleX(${P(f, noBoomAt + 8, 8)})`, transformOrigin: "left" }} /></div>
          {f >= removeAt ? <div style={{ display: "inline-block", marginTop: 10, padding: "10px 18px", background: "rgba(16,10,24,0.88)", borderLeft: `4px solid ${VIO}`, fontSize: 28, letterSpacing: 4, color: VIO, opacity: P(f, removeAt, 8) }}>O BOREALIS REMOVE OS COMBINE DA TERRA</div> : null}
        </div>
      ) : null}
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life, 6), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ================================================================================================= MÓDULO 13 · leva B
// ---------------------------------------------------------------- 1:30:49 a Terra livre (laboratório do Kleiner, POV)
// o Kleiner (bandeira com crachá) diante do monitor da mesa: um soldado Combine some do sinal — TRANSFERIDO, não morto →
// DESTINO: ? (mundo fronteira? um lugar no tempo? sem volta) → "isso deixa de importar": a tela apaga → a câmera vira para a
// parede de monitores: os feeds Combine (Cidadela, Nova Prospekt, Overwatch…) caem um por um, as transmissões param, as
// instalações ficam mudas → o mapa da Terra no telão: as zonas de ocupação apagam (100% → 0%), com o que continua lá fora
// num canto (Overworld · outros mundos · outras linhas) → a câmera vai até a janela: a persiana sobe e entra a luz do dia.
// 12/10 (pedido dele: o monitor desalinhado e torto, "parece uma cela", escuro demais): o laboratório do Kleiner de
// verdade — paredes claras de azulejo, luminárias acesas, bancada com instrumentos e frascos acesos, prateleiras; o monitor
// da mesa virou um monitor de fato (moldura fina, gabinete, pescoço e pé), com a tela colada na face da frente.
const KMON = { x: -4.09, y0: 3.62, y1: 4.78, z0: 1.03, z1: 1.73 };
const WALL_DX = -0.375;
const FEED_Q: [number, number][] = [[-4.4, 1.85], [-4.4, 0.75], [-2.85, 1.85], [-2.85, 0.75], [2.2, 1.85], [2.2, 0.75], [3.75, 1.85], [3.75, 0.75]];
const buildKleinerLab = (): XF[] => {
  const g = mk();
  g.room(-5, 5, 0, 10, 3.2, [150, 146, 134], [96, 88, 76], [128, 126, 120], [], 1);
  // rodapé e faixa de azulejo escuro (como o laboratório de City 17)
  g.box(-5, 0, 0, 0.04, 10, 0.9, [92, 110, 104]);
  g.box(4.96, 0, 0, 0.04, 10, 0.9, [92, 110, 104]);
  // a parede de monitores (fundo): oito molduras (quatro de cada lado); o telão no meio
  // 30/10 (ele: uma tela saindo da borda e faltando uma embaixo à direita): o conjunto ia até x = 5,15, entrando na
  // parede lateral (x = 5) — agora centrado (−4,775 … 4,775) e com a quarta moldura da direita
  const bez = (x: number, z: number, w: number, h: number) => g.box(x + WALL_DX, 9.82, z, w, 0.18, h, [34, 36, 40]);
  FEED_Q.forEach(([x, z]) => bez(x, z, 1.4, 0.95));
  bez(-1.3, 0.9, 3.35, 2.0);
  g.box(-5, 9.2, 0, 10, 0.6, 0.72, [96, 80, 60]);
  // a mesa do Kleiner (esquerda): tampo, pés, gaveteiro
  g.box(-4.6, 3.0, 0.72, 1.6, 2.6, 0.06, [120, 92, 62]);
  [[-4.55, 3.05], [-3.1, 3.05], [-4.55, 5.45], [-3.1, 5.45]].forEach(([x, y]) => g.box(x, y, 0, 0.08, 0.08, 0.72, [70, 70, 74]));
  g.box(-4.55, 4.9, 0, 0.6, 0.6, 0.7, [104, 82, 58]);
  // o monitor: gabinete atrás, moldura fina, pescoço e pé
  g.box(-4.48, 3.78, 1.1, 0.3, 0.84, 0.56, [58, 60, 64]);
  g.box(-4.2, KMON.y0 - 0.06, KMON.z0 - 0.06, 0.11, KMON.y1 - KMON.y0 + 0.12, KMON.z1 - KMON.z0 + 0.12, [44, 46, 50]);
  g.box(-4.22, 4.15, 0.78, 0.1, 0.1, 0.22, [50, 52, 56]);
  g.box(-4.36, 3.92, 0.78, 0.4, 0.56, 0.03, [50, 52, 56]);
  // teclado, papéis e a luminária
  g.box(-3.72, 3.85, 0.78, 0.22, 0.7, 0.03, [40, 42, 46]);
  g.box(-3.6, 4.75, 0.78, 0.3, 0.4, 0.01, [235, 230, 214]);
  g.box(-3.55, 3.2, 0.78, 0.26, 0.34, 0.01, [235, 230, 214]);
  g.box(-4.4, 5.2, 0.78, 0.14, 0.14, 0.5, [60, 60, 64]);
  g.box(-4.4, 5.12, 1.24, 0.3, 0.3, 0.1, [255, 220, 150], { emit: 0.7 });
  // a bancada da direita com os instrumentos e os frascos acesos
  g.box(3.8, 2.4, 0, 1.2, 3.4, 0.9, [118, 120, 116]);
  g.box(3.8, 2.4, 0.9, 1.2, 3.4, 0.05, [70, 74, 72]);
  g.box(4.1, 2.7, 0.95, 0.7, 0.6, 0.5, [52, 56, 60]);
  g.box(4.12, 2.75, 1.1, 0.02, 0.5, 0.25, [140, 255, 190], { emit: 0.55 });
  g.box(4.1, 3.6, 0.95, 0.6, 0.9, 0.35, [62, 66, 70]);
  [[4.2, 4.7, [120, 230, 255]], [4.35, 4.95, [190, 255, 150]], [4.2, 5.2, [255, 200, 120]], [4.45, 5.4, [120, 230, 255]]].forEach(([x, y, col]) =>
    g.box(x as number, y as number, 0.95, 0.1, 0.1, 0.24, col as RGB, { emit: 0.65 }),
  );
  // as prateleiras com caixas
  g.box(-5, 6.4, 0, 0.5, 2.0, 2.1, [96, 86, 70]);
  [0.5, 1.1, 1.7].forEach((z, i) => {
    g.box(-4.98, 6.45, z, 0.46, 1.9, 0.04, [70, 62, 52]);
    g.box(-4.9, 6.6 + i * 0.3, z + 0.04, 0.34, 0.5, 0.36, [[160, 130, 90], [110, 120, 130], [150, 140, 110]][i] as RGB);
    g.box(-4.9, 7.5 - i * 0.2, z + 0.04, 0.3, 0.4, 0.28, [[120, 110, 90], [170, 150, 110], [100, 110, 100]][i] as RGB);
  });
  g.box(4.4, 7.4, 0, 0.6, 1.6, 1.8, [96, 86, 70]);
  // a janela (direita) com a persiana de metal
  g.box(4.88, 3.4, 1.0, 0.12, 3.2, 0.12, [60, 60, 64]);
  g.box(4.88, 3.4, 2.62, 0.12, 3.2, 0.12, [60, 60, 64]);
  // as luminárias do teto (acesas)
  for (let y = 1.5; y < 10; y += 2.5) {
    g.box(-2.2, y, 3.12, 0.5, 1.4, 0.06, [255, 244, 220], { emit: 0.9 });
    g.box(1.7, y, 3.12, 0.5, 1.4, 0.06, [255, 244, 220], { emit: 0.9 });
  }
  return g.F;
};
const FEEDS = ["CIDADELA · CITY 17", "NOVA PROSPEKT", "OVERWATCH · RÁDIO", "NEXUS · DISTRITO 4", "CAÇA-NAVES 06", "ÁRTICO · POSTO 9", "STRIDER · ESCOLTA", "PORTO · CANAIS"];
const OCC: [number, number][] = [[-0.55, 0.3], [-0.3, -0.25], [0.15, 0.35], [0.4, -0.1], [-0.05, 0.05], [0.55, 0.4], [-0.45, -0.5], [0.25, -0.45], [0.62, 0.05], [-0.7, 0.05]];
export const HL13Free: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [notDeadAt, whereAt, frontAt, timeAt, matterAt, worksAt, txAt, fallAt, muteAt, endAt, notOwAt, otherAt, goneAt, freeAt] = ats(p, ["notDeadAt", "whereAt", "frontAt", "timeAt", "matterAt", "worksAt", "txAt", "fallAt", "muteAt", "endAt", "notOwAt", "otherAt", "goneAt", "freeAt"]);
  void notDeadAt;
  void fallAt;
  const G = useMemo(() => buildKleinerLab(), []);
  // começa na mesa do Kleiner (o monitor de perto) → recua até o meio da sala de frente para a parede → a janela
  // 30/10 (ele: o telão de longe não dava para ler): de "a ocupação acaba" até "foram embora" a câmera chega perto do
  // telão (de frente, centrada nele) e só depois volta e vira para a janela
  const TX = 0.375 + WALL_DX;
  const closeA = endAt - 40, closeB = goneAt + 40;
  const yaw = keys(f, [[0, -1.05], [matterAt + 10, -1.05], [worksAt + 6, 0], [closeB, 0], [freeAt + 26, 0.95], [life, 1.0]]);
  const ey = keys(f, [[0, 3.1], [matterAt + 10, 3.1], [worksAt + 6, 1.6], [closeA, 2.6], [closeA + 36, 6.7], [closeB, 6.8], [freeAt + 30, 3.8]]);
  const ex = keys(f, [[0, -2.5], [matterAt + 10, -2.5], [worksAt + 6, 0.6], [closeA, 0.6], [closeA + 36, TX], [closeB, TX], [freeAt + 30, 0.6], [life, 0.6]]);
  const pitch = keys(f, [[0, -0.13], [matterAt + 10, -0.13], [worksAt + 6, 0.02], [closeA, 0.02], [closeA + 36, 0.11], [closeB, 0.11], [freeAt + 20, 0.04]]);
  const FF = keys(f, [[closeA, 980], [closeA + 36, 1060], [closeB, 1060], [freeAt + 30, 980]]);
  const e: Eye = { x: ex + 0.05 * Math.sin(f / 60), y: ey, z: 1.55, yaw, pitch, F: FF };
  const shutter = P(f, freeAt, 40);
  const day = shutter;
  const lights: XL[] = [
    { x: -2, y: 3.5, z: 3.0, col: [255, 240, 214], k: 0.9, r: 7 },
    { x: 1.7, y: 6, z: 3.0, col: [255, 240, 214], k: 0.8, r: 7 },
    { x: -4.3, y: 5.2, z: 1.2, col: [255, 214, 150], k: 0.5, r: 3 },
    { x: 0, y: 9.4, z: 1.8, col: [120, 220, 255], k: 0.35 * (1 - P(f, muteAt, 20)), r: 6 },
    { x: 4.6, y: 5.0, z: 1.8, col: [255, 240, 210], k: 1.2 * day, r: 9 },
  ];
  // cada feed cai num instante entre a teoria funcionar e as instalações calarem
  const dropT = (k: number) => worksAt + 30 + ((muteAt + 20 - worksAt - 30) * k) / FEEDS.length;
  const occ = 1 - P(f, endAt, 50);
  const pct = Math.round(100 * occ);
  const deskQ: [V3, V3, V3, V3] = [[KMON.x, KMON.y0, KMON.z1], [KMON.x, KMON.y1, KMON.z1], [KMON.x, KMON.y1, KMON.z0], [KMON.x, KMON.y0, KMON.z0]];
  return (
    <AbsoluteFill style={{ background: "#040405", overflow: "hidden" }}>
      <XView e={e} faces={G} lights={lights} flash={0.5} amb={0.36 + 0.2 * day} />
      {/* o monitor da mesa do Kleiner */}
      <Pinned e={e} w={480} h={300} corners={deskQ}>
        <div style={{ width: 480, height: 300, background: "#061a12", fontFamily: MONO, color: "#8dffa8", padding: 18, boxSizing: "border-box", opacity: 1 - 0.75 * P(f, matterAt, 14) }}>
          <div style={{ fontSize: 15, letterSpacing: 3, opacity: 0.8 }}>RASTREIO · UNIDADE CP-0417</div>
          <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 14 }}>
            <svg width={130} height={130}>
              <circle cx={65} cy={65} r={50 - 30 * P(f, 10, 30)} fill="none" stroke="#c79bff" strokeWidth={3} opacity={P(f, 6, 10)} />
              <circle cx={65} cy={65} r={8} fill="#8dffa8" opacity={1 - P(f, 20, 20)} />
              <polygon points="65,30 72,48 58,48" fill="#8dffa8" opacity={1 - P(f, 20, 20)} />
            </svg>
            <div>
              <div style={{ fontSize: 26, letterSpacing: 2, color: "#e9ffe9" }}>TRANSFERIDO</div>
              <div style={{ fontSize: 18, letterSpacing: 2, marginTop: 6 }}>SINAIS VITAIS ✓ · NÃO MORTO</div>
            </div>
          </div>
          {f >= whereAt ? <div style={{ fontSize: 22, letterSpacing: 3, marginTop: 10, color: "#ffd27a" }}>DESTINO: ?</div> : null}
          <div style={{ display: "flex", gap: 10, marginTop: 8, fontSize: 14, letterSpacing: 2 }}>
            {f >= frontAt ? <span style={{ padding: "4px 8px", border: "1px solid #ffd27a", color: "#ffd27a" }}>MUNDO FRONTEIRA?</span> : null}
            {f >= timeAt ? <span style={{ padding: "4px 8px", border: "1px solid #ffd27a", color: "#ffd27a" }}>UM LUGAR NO TEMPO?</span> : null}
            {f >= timeAt + 40 ? <span style={{ padding: "4px 8px", border: "1px solid #ff5d4d", color: "#ff5d4d" }}>SEM VOLTA</span> : null}
          </div>
        </div>
      </Pinned>
      {/* os feeds Combine na parede */}
      {FEED_Q.map(([x, z], k) => {
        const d = dropT(k);
        const dead = f >= d + 12;
        const glitch = f >= d && f < d + 12;
        return (
          <Pinned key={k} e={e} w={400} h={270} corners={[[x + WALL_DX + 0.08, 9.8, z + 0.88], [x + WALL_DX + 1.32, 9.8, z + 0.88], [x + WALL_DX + 1.32, 9.8, z + 0.07], [x + WALL_DX + 0.08, 9.8, z + 0.07]]}>
            <div style={{ width: 400, height: 270, position: "relative", overflow: "hidden", background: "#02060a" }}>
              {!dead ? <div style={{ position: "absolute", inset: 0, opacity: glitch ? (rnd(f * 3 + k) > 0.5 ? 1 : 0.2) : 1 }}><CombineScreen f={f + k * 13} /></div> : null}
              {glitch ? <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(0deg, rgba(255,255,255,0.25) 0 2px, rgba(0,0,0,0) 2px 5px)" }} /> : null}
              <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "6px 10px", background: "rgba(0,0,0,0.65)", fontFamily: MONO, fontSize: 16, letterSpacing: 2, color: dead ? "#ff5d4d" : "#9fe6ff" }}>{dead ? `${FEEDS[k]} · MUDO` : FEEDS[k]}</div>
            </div>
          </Pinned>
        );
      })}
      {/* o telão: a Terra e a ocupação */}
      {/* 30/10 (ele: de longe não dava para entender, e o "foram embora" ficava em cima do card vermelho): a câmera chega
          perto do telão; à esquerda a Terra (as marcas Combine apagam em "acaba" e, em "foram embora", saem da Terra para o
          lado de fora); à direita, separado por uma divisória, o que continua lá fora — Overworld, outros mundos, outras
          linhas, cada um com o seu desenho e os Combine ainda lá; a frase final vai no cabeçalho, sem cobrir nada */}
      <Pinned e={e} w={700} h={420} corners={[[-1.22 + WALL_DX, 9.8, 2.84], [1.97 + WALL_DX, 9.8, 2.84], [1.97 + WALL_DX, 9.8, 0.96], [-1.22 + WALL_DX, 9.8, 0.96]]}>
        {(() => {
          const EX = 200, EY = 222, R = 140;
          const gone = P(f, goneAt, 40);
          const freeK = P(f, goneAt + 20, 20);
          const ROWS: [number, string][] = [[notOwAt, "OVERWORLD"], [notOwAt + 81, "OUTROS MUNDOS"], [otherAt, "OUTRAS LINHAS"]];
          const rowY = (k: number) => 132 + k * 96;
          return (
            <svg width={700} height={420} style={{ background: "#020a14" }}>
              {/* cabeçalho */}
              <rect x={0} y={0} width={700} height={56} fill={gone > 0.5 ? "rgba(20,60,34,0.9)" : "rgba(10,26,40,0.9)"} />
              <text x={20} y={36} fill={gone > 0.5 ? "#8dffa8" : "#9fe6ff"} fontFamily={MONO} fontSize={gone > 0.5 ? 20 : 18} letterSpacing={3} opacity={gone > 0.5 ? P(f, goneAt + 20, 10) : 1}>{gone > 0.5 ? "OS COMBINE DA TERRA · FORAM EMBORA" : "TERRA · OCUPAÇÃO COMBINE"}</text>
              {gone <= 0.5 ? <text x={372} y={38} textAnchor="end" fill={pct > 0 ? "#ff5d4d" : "#8dffa8"} fontFamily={MONO} fontSize={28}>{pct}%</text> : null}
              {/* a Terra */}
              <g transform={`translate(${EX} ${EY})`}>
                <circle r={R + 14} fill={`rgba(141,255,168,${0.18 * freeK})`} />
                <circle r={R} fill={`rgba(${Math.round(40 + 20 * freeK)},${Math.round(110 + 60 * freeK)},${Math.round(170 - 40 * freeK)},0.3)`} stroke={freeK > 0.5 ? "#8dffa8" : "#5aa9ff"} strokeWidth={2} />
                {[-120, -60, 0, 60, 120].map((v) => <ellipse key={"m" + v} rx={Math.abs(R * Math.cos((v * Math.PI) / 360))} ry={R} fill="none" stroke="rgba(90,169,255,0.3)" />)}
                {[-0.65, -0.32, 0, 0.32, 0.65].map((v) => <line key={"p" + v} x1={-R * Math.sqrt(1 - v * v)} x2={R * Math.sqrt(1 - v * v)} y1={v * R} y2={v * R} stroke="rgba(90,169,255,0.3)" />)}
              </g>
              {/* as marcas Combine: acesas → apagadas (acaba) → saem da Terra para o lado de fora (foram embora) */}
              {OCC.map(([u, v], k) => {
                const off = P(f, endAt + k * 4, 14);
                const go = P(f, goneAt + k * 3, 34);
                const x0 = EX + u * R, y0 = EY + v * R;
                const x1 = 560, y1 = rowY(k % 3);
                const x = x0 + (x1 - x0) * go, y = y0 + (y1 - y0) * go - Math.sin(go * Math.PI) * 50;
                return (
                  <g key={k} opacity={1 - P(f, goneAt + k * 3 + 26, 8)}>
                    {go > 0 && go < 1 ? <line x1={x0 + (x - x0) * 0.6} y1={y0 + (y - y0) * 0.6} x2={x} y2={y} stroke="rgba(255,93,77,0.5)" strokeWidth={2} strokeDasharray="4 4" /> : null}
                    <g transform={`translate(${x} ${y}) scale(${1 - 0.4 * go})`}>
                      <circle r={20} fill={`rgba(255,93,77,${0.28 * (1 - off)})`} stroke="#ff5d4d" strokeWidth={2} strokeOpacity={1 - 0.6 * off} />
                      <g opacity={1 - 0.6 * off}><IcoComb x={0} y={0} s={0.46} /></g>
                    </g>
                  </g>
                );
              })}
              <text x={EX} y={400} textAnchor="middle" fill={freeK > 0.5 ? "#8dffa8" : "rgba(242,240,247,0.7)"} fontFamily={MONO} fontSize={16} letterSpacing={4} opacity={P(f, endAt + 30, 10)}>{freeK > 0.5 ? "TERRA · SEM OCUPAÇÃO" : "A OCUPAÇÃO ACABA"}</text>
              {/* a divisória e o que continua lá fora */}
              {f >= notOwAt ? (
                <g opacity={P(f, notOwAt, 10)}>
                  <line x1={392} y1={70} x2={392} y2={404} stroke="rgba(255,138,122,0.4)" strokeDasharray="6 6" strokeWidth={1.5} />
                  <text x={412} y={92} fill="#ff8a7a" fontFamily={MONO} fontSize={14} letterSpacing={3}>LÁ FORA · CONTINUA</text>
                  {ROWS.map(([t, lab], k) => {
                    const kk = P(f, t, 10);
                    const cy = rowY(k);
                    return (
                      <g key={lab} opacity={kk} transform={`translate(${12 * (1 - kk)} 0)`}>
                        <rect x={406} y={cy - 38} width={282} height={78} rx={6} fill="rgba(30,6,6,0.7)" stroke="rgba(255,93,77,0.6)" />
                        {k === 0 ? (
                          <g>
                            <circle cx={446} cy={cy} r={22} fill="rgba(199,155,255,0.35)" stroke="#c79bff" strokeWidth={2} />
                            <ellipse cx={446} cy={cy} rx={34} ry={8} fill="none" stroke="#c79bff" strokeWidth={1.5} transform={`rotate(-18 446 ${cy})`} />
                          </g>
                        ) : k === 1 ? (
                          <g>
                            {[[430, cy - 10, 10], [452, cy + 8, 13], [470, cy - 14, 8]].map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill="rgba(90,169,255,0.3)" stroke="#5aa9ff" />)}
                            {[[430, cy - 10], [452, cy + 8], [470, cy - 14]].map(([x, y], i) => <circle key={"d" + i} cx={x + 4} cy={y - 3} r={3} fill="#ff5d4d" />)}
                          </g>
                        ) : (
                          <g>
                            {[-16, -6, 4, 14].map((dy, i) => <path key={i} d={`M 418 ${cy} C 438 ${cy} 444 ${cy + dy} 480 ${cy + dy * 1.4}`} fill="none" stroke="#9fe6ff" strokeWidth={1.8} />)}
                            {[-16, 4].map((dy, i) => <circle key={"d" + i} cx={480} cy={cy + dy * 1.4} r={3.5} fill="#ff5d4d" />)}
                          </g>
                        )}
                        <text x={496} y={cy - 4} fill="#ffd2c8" fontFamily={MONO} fontSize={17} letterSpacing={2}>{lab}</text>
                        <text x={496} y={cy + 20} fill="#ff5d4d" fontFamily={MONO} fontSize={12} letterSpacing={2}>COMBINE · INTACTOS</text>
                      </g>
                    );
                  })}
                </g>
              ) : null}
            </svg>
          );
        })()}
      </Pinned>
      {/* a persiana e a luz do dia */}
      {(() => {
        const a = proj(e, [4.95, 3.4, 2.62]);
        const b = proj(e, [4.95, 6.6, 2.62]);
        const c = proj(e, [4.95, 6.6, 1.12]);
        const d = proj(e, [4.95, 3.4, 1.12]);
        if (!a || !b || !c || !d) return null;
        const lift = shutter;
        const yTop = (q: { y: number }, r: { y: number }) => q.y + (r.y - q.y) * (1 - lift);
        return (
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            <polygon points={`${a.x},${a.y} ${b.x},${b.y} ${c.x},${c.y} ${d.x},${d.y}`} fill={`rgba(255,246,222,${0.15 + 0.85 * day})`} style={{ filter: day > 0 ? "drop-shadow(0 0 40px rgba(255,240,200,0.9))" : undefined }} />
            {lift < 1 ? (
              <g>
                <polygon points={`${a.x},${a.y} ${b.x},${b.y} ${c.x},${yTop(b, c)} ${d.x},${yTop(a, d)}`} fill="#5a5c62" stroke="#2a2b30" strokeWidth={2} />
                {Array.from({ length: 10 }).map((_, k) => {
                  const t = (k + 1) / 11;
                  const l = { x: a.x, y: a.y + (yTop(a, d) - a.y) * t };
                  const r = { x: b.x, y: b.y + (yTop(b, c) - b.y) * t };
                  return <line key={k} x1={l.x} y1={l.y} x2={r.x} y2={r.y} stroke="#3a3c42" strokeWidth={2} />;
                })}
              </g>
            ) : null}
          </svg>
        );
      })()}
      {day > 0 ? <AbsoluteFill style={{ background: "radial-gradient(ellipse at 85% 45%, rgba(255,244,214,0.55), rgba(255,244,214,0) 60%)", opacity: day, pointerEvents: "none" }} /> : null}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <Pin e={e} x={-4.0} y={5.75} h={1.75} col={ICE} f={f} who="kleiner" text="KLEINER" o={P(f, 4, 10) * (1 - P(f, freeAt - 10, 12))} sub={f >= worksAt ? "A TEORIA FUNCIONOU" : f >= matterAt ? "ISSO DEIXA DE IMPORTAR" : "NÃO ESTÃO SENDO MORTOS"} />
      </svg>
      {f >= freeAt + 10 ? (
        <Kin kind="light" t0={freeAt + 10} bottom={170} size={66} col="#ffe2a0" text="a humanidade está livre" />
      ) : null}
      <Hud f={f} yaw={e.yaw} eye={e} blips={[{ x: -3.9, y: 5.0 }]} msg={f >= txAt && f < endAt ? "AS TRANSMISSÕES PARAM" : f >= endAt && f < freeAt ? "A OCUPAÇÃO ACABA" : undefined} msgCol={f >= endAt ? GREEN : ICE} o={1 - day * 0.7} />
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 1:31:29 a vitória (POV, o jogador no controle)
// o corredor do Borealis com gente entendendo o que aconteceu: dois chorando, dois abraçados, um soldado Combine com a arma
// largada no chão → o Barney (bandeira com crachá) vem até o Gordon: a cerveja → corte para a câmara do núcleo: a Alyx em
// silêncio perto do núcleo → "Gordon não destruiu o problema; confiou que a humanidade saberia parar" → o Eli se ajoelha ao
// lado dela → a promessa (destruir as armas que sobraram · esconder o Borealis) → ela acredita → só Alyx, de novo.
// pessoa sem nome (cidadão, rebelde, soldado Combine): a mesma bandeira com crachá, com a foto do tipo de personagem
// cada pessoa com um rosto diferente (nunca repetir o mesmo rebelde/cidadão na mesma cena) e SÓ ROSTO DE FRENTE
const WHO: Record<string, string> = { kleiner: "hl3silh/kleiner_retrato.png", combine: "hl3silh/combine_badge.jpg", rebel: "hl3silh/rebelde_badge.jpg", rebel2: "hl3silh/rebelde2_badge.jpg", rebel3: "hl3silh/rebelde3_badge.jpg", rebel7: "hl3silh/rebelde7_badge.jpg", rebel8: "hl3silh/rebelde8_badge.jpg", cit2: "hl3silh/cidada_badge.jpg" };
const WHO_LABEL: Record<string, string> = { kleiner: "KLEINER", combine: "COMBINE", rebel: "REBELDE", rebel2: "REBELDE", rebel3: "REBELDE", rebel7: "REBELDE", rebel8: "REBELDE", cit2: "CIDADÃ" };
export const Pin: React.FC<{ e: Eye; x: number; y: number; col: string; f: number; o?: number; text?: string; sub?: string; who?: string; h?: number; z?: number }> = ({ e, x, y, col, f, o = 1, text, sub, who = "cit2", h = 1.6, z = 0 }) => {
  const b = proj(e, [x, y, z]);
  const t = proj(e, [x, y, z + h]);
  if (!b || !t || o <= 0) return null;
  if (occluded(e, [x, y, z + h + 0.3]) && occluded(e, [x, y, z + Math.min(h, 1.0)])) return null;
  const s = Math.max(0.5, Math.min(2, 6 / b.d));
  const k = Math.max(0.6, Math.min(1.05, 8 / b.d));
  const sb = stemBase(e, x, y, z, h);
  const b2 = sb.hidden ? proj(e, [x, y, sb.z]) ?? b : b;
  return (
    <g opacity={o}>
      {sb.hidden ? null : <ellipse cx={b.x} cy={b.y} rx={26 * s} ry={7 * s} fill="none" stroke={col} strokeWidth={1.6} strokeDasharray="5 4" strokeDashoffset={-f} />}
      <line x1={b2.x} y1={b2.y} x2={t.x} y2={t.y} stroke={col} strokeWidth={2} />
      {sb.hidden ? null : <circle cx={b.x} cy={b.y} r={4} fill={col} />}
      <FlagBadge cx={t.x} by={t.y} k={k} label={text ?? WHO_LABEL[who]} col={col} f={f} sub={sub} photo={WHO[who]} />
    </g>
  );
};
export const HL13Victory: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [ctrlAt, walkAt, cryAt, hugAt, dropAt, barneyAt, beerAt, alyxAt, notAt, trustAt, eliAt, promAt, weapAt, hideAt, believeAt, againAt] = ats(p, ["ctrlAt", "walkAt", "cryAt", "hugAt", "dropAt", "barneyAt", "beerAt", "alyxAt", "notAt", "trustAt", "eliAt", "promAt", "weapAt", "hideAt", "believeAt", "againAt"]);
  void ctrlAt;
  const H = useMemo(() => {
    const g = mk();
    g.F.push(...buildShipHall2(40));
    // a arma largada no chão
    g.box(1.0, 12.4, 0.02, 0.9, 0.12, 0.1, [30, 32, 34]);
    g.box(1.6, 12.38, 0.02, 0.18, 0.16, 0.22, [30, 32, 34]);
    return g.F;
  }, []);
  const CR = useMemo(() => buildCoreRoom(true), []);
  const cut = Math.round(alyxAt - 6);
  // parte 1: o corredor (o jogador anda)
  const hy = keys(f, [[0, 1.2], [walkAt, 1.4], [barneyAt, 9.0], [cut, 9.6]]);
  const hyaw = keys(f, [[0, 0], [cryAt, -0.25], [hugAt + 10, 0.2], [dropAt + 20, 0.2], [barneyAt, 0], [cut, 0]]);
  const he: Eye = { x: 0.1 * Math.sin(f / 40), y: hy, z: 1.65 + (f >= walkAt && f < barneyAt ? 0.03 * Math.sin(f / 4.5) : 0), yaw: hyaw, pitch: -0.03, F: 960 };
  const bY = keys(f, [[barneyAt, 16], [beerAt, 11.2], [cut, 11]]);
  // parte 2: a câmara do núcleo
  const g2 = f - cut;
  const ce = coreEye(f, { y: keys(f, [[cut, 3.0], [eliAt, 3.6], [life, 4.0]]), yaw: keys(f, [[cut, 0], [life, -0.03]]), pitch: 0.04 });
  const believe = P(f, believeAt, 16);
  const alyxCol = f >= againAt ? ORANGE : f >= believeAt ? GREEN : ORANGE;
  const promise: [string, number][] = [["DESTRUIR AS ARMAS QUE SOBRARAM", weapAt], ["ESCONDER O BOREALIS", hideAt], ["NUNCA MAIS USAR", hideAt + 30]];
  return (
    <AbsoluteFill style={{ background: "#020304", overflow: "hidden" }}>
      {f < cut ? (
        <>
          <XView e={he} faces={H} lights={[{ x: 0, y: hy + 4, z: 2.6, col: [255, 236, 200], k: 0.55, r: 9 }, { x: 0, y: 14, z: 2, col: [255, 214, 140], k: 0.3, r: 6 }]} flash={0.8} amb={0.14} />
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            <Pin e={he} x={-1.4} y={8.5} col={ICE} f={f} o={P(f, cryAt, 10)} who="cit2" sub="CHORANDO" />
            <Pin e={he} x={-1.0} y={10.4} col={ICE} f={f} o={P(f, cryAt + 8, 10)} who="rebel7" sub="CHORANDO" />
            {f >= hugAt ? (() => {
              const a = proj(he, [0.3, 10.0, 1.2]);
              const b = proj(he, [1.3, 10.0, 1.2]);
              return a && b ? <path d={`M ${a.x} ${a.y} Q ${(a.x + b.x) / 2} ${Math.min(a.y, b.y) - 30} ${b.x} ${b.y}`} fill="none" stroke={GREEN} strokeWidth={2.4} opacity={P(f, hugAt + 6, 10)} /> : null;
            })() : null}
            <Pin e={he} x={0.3} y={10.0} col={GREEN} f={f} o={P(f, hugAt, 10)} who="rebel3" />
            <Pin e={he} x={1.3} y={10.0} h={2.3} col={GREEN} f={f} o={P(f, hugAt + 4, 10)} who="rebel8" sub="ABRAÇADOS" />
            {/* 30/10 (ele: não sobra Combine nenhum na Terra — humano ou não, todos tinham a assinatura e foram embora):
                quem larga a arma é um soldado da resistência, na altura de gente (antes era um Combine de 3 m) */}
            <Pin e={he} x={1.9} y={13.2} col={GREEN} f={f} o={P(f, dropAt, 10)} who="rebel2" text="REBELDE" sub={f >= dropAt + 10 ? "SOLDADO · LARGOU A ARMA" : "SOLDADO"} />
            {f >= dropAt + 10 ? (() => {
              const q = proj(he, [1.4, 12.45, 0.06]);
              return q ? <g opacity={P(f, dropAt + 10, 8)}><circle cx={q.x} cy={q.y} r={14} fill="none" stroke={GREEN} strokeWidth={2} /><circle cx={q.x} cy={q.y} r={4} fill={GREEN} /></g> : null;
            })() : null}
            {f >= barneyAt ? <XMarker e={he} x={0.3} y={bY} label="BARNEY" col={AMB} f={f} o={P(f, barneyAt, 10)} sub={f >= beerAt ? "A CERVEJA" : "ENCONTRA O GORDON"} /> : null}
          </svg>
          {f >= beerAt ? (
            <Kin kind="quote" t0={beerAt} bottom={170} size={46} col={AMB} who="BARNEY" text="Agora você finalmente vai ter que pagar aquela cerveja." />
          ) : null}
          <Hud f={f} yaw={he.yaw} eye={he} blips={f >= barneyAt ? [{ x: 0.3, y: bY, hot: true }] : []} msg={f < cryAt ? "VOCÊ NO CONTROLE" : f >= cryAt && f < barneyAt ? "AS PESSOAS ENTENDEM O QUE ACONTECEU" : undefined} msgCol={GREEN} />
        </>
      ) : (
        <>
          <CoreRoom e={ce} f={f} G={CR} o={{ rings: notches(1), ringO: 0.7, wound: 0.5, arcs: 0, push: 0.2, hot: 0.3, mL: 0.25, mR: 0.05, beam: 0 }}>
            <FlagAt e={ce} pt={[-0.5, 7.0, 0]} label="ALYX" col={alyxCol} f={f} sub={f >= againAt ? "SÓ ALYX, DE NOVO" : f >= believeAt ? "ACREDITA NELE" : "EM SILÊNCIO"} />
            {f >= eliAt ? <FlagAt e={ce} pt={[0.45, 6.6, 0]} label="ELI" col={AMB} f={f} o={P(f, eliAt, 10)} sub="AJOELHADO AO LADO DELA" /> : null}
          </CoreRoom>
          {f >= notAt && f < eliAt ? (
            <><Kin kind="strike" t0={notAt} until={trustAt} hit="destruiu" bottom={170} size={48} col={RED} text="Gordon não destruiu o problema." /><Kin kind="light" t0={trustAt} bottom={170} size={48} col="#ffe2a0" text="confiou que a humanidade saberia parar" /></>
          ) : null}
          {f >= promAt ? (
            <div style={{ position: "absolute", right: 90, top: 140, width: 520, padding: "16px 20px", borderRadius: 12, background: "rgba(14,10,4,0.88)", border: `1.5px solid ${AMB}`, fontFamily: MONO, opacity: P(f, promAt, 8) * (1 - P(f, againAt, 14)), transform: `translateX(${(1 - P(f, promAt, 12)) * 50}px)` }}>
              <div style={{ fontSize: 15, letterSpacing: 4, color: AMB }}>A PROMESSA DE ELI · DESSA VEZ VAI SER DIFERENTE</div>
              {promise.map(([t, t0]) => (
                <div key={t} style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 10, fontSize: 20, letterSpacing: 2, color: TXT, opacity: P(f, t0, 8) }}>
                  <span style={{ color: believe > 0.5 ? GREEN : AMB }}>{believe > 0.5 ? "✓" : "□"}</span>
                  {t}
                </div>
              ))}
            </div>
          ) : null}
          <Hud f={f} yaw={ce.yaw} eye={ce} blips={[{ x: -0.5, y: 7.0, hot: true }]} msg={f >= believeAt ? "POR ALGUNS SEGUNDOS, ELA ACREDITA" : "ALYX · PERTO DO NÚCLEO"} msgCol={f >= believeAt ? GREEN : ORANGE} />
          {void g2}
        </>
      )}
      <AbsoluteFill style={{ background: "#000", opacity: Math.max(fadeIO(f, life), f >= cut - 6 && f < cut + 6 ? 1 - Math.abs(f - cut) / 6 : 0), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 1:32:12 o disparo (câmara do núcleo, POV)
// a câmera na laje, virada para a esquerda: a plataforma do console (o sistema) e o núcleo à direita. O Varga entra pela
// passarela do console com três homens → o dossiê da Mossman (ASCENSÃO · PERPETUIDADE · CONTINUIDADE DA CONSCIÊNCIA) → o
// que cada um vê (Eli: uma arma, enterrar · Alyx: um ciclo, quebrar · Varga: a tecnologia, a filha) → "por que destruir?"
// → a última exceção (Cave Johnson → Wallace Breen → Varga) → a Alyx fica entre ele e o console → o disparo vem de um dos
// homens → a bandeira dela cai → o Eli vai até ela → o tiroteio (Barney e os rebeldes do outro lado, traçantes) → o
// Borealis entra e sai de fase → o Varga é atingido e foge → o Eli no chão com ela; o Gordon não conseguiu fazer nada.
const SH_CONSOLE: V3 = [-5.2, 8.0, 0];
export const HL13Shot: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [noTouchAt, enterAt, filesAt, eliAt, alyxAt, seesAt, daughterAt, askAt, preserveAt, seenAt, exceptAt, standAt, vargaAt, breakAt, shotAt, fallAt, diesAt, worseAt, notWinAt, fightAt, phaseAt, fleeAt, eliArmsAt, nothingAt] = ats(p, ["noTouchAt", "enterAt", "filesAt", "eliAt", "alyxAt", "seesAt", "daughterAt", "askAt", "preserveAt", "seenAt", "exceptAt", "standAt", "vargaAt", "breakAt", "shotAt", "fallAt", "diesAt", "worseAt", "notWinAt", "fightAt", "phaseAt", "fleeAt", "eliArmsAt", "nothingAt"]);
  const G = useMemo(() => buildCoreRoom(true), []);
  const fighting = f >= fightAt && f < eliArmsAt;
  const shake = (f >= shotAt && f < shotAt + 20 ? 0.9 : 0) + (fighting ? 0.35 : 0) + (f >= breakAt && f < shotAt ? 0.12 : 0);
  const e0 = coreEye(f, { y: keys(f, [[0, 3.0], [standAt, 3.4], [nothingAt, 3.4], [life, 3.9]]), yaw: keys(f, [[0, -0.2], [enterAt - 6, -0.2], [enterAt + 24, -0.52], [enterAt + 110, -0.4], [fightAt, -0.45], [fightAt + 30, -0.05], [fleeAt - 10, -0.05], [fleeAt + 30, -0.55], [life, -0.5]]), pitch: keys(f, [[0, 0.04], [fallAt, 0.04], [fallAt + 20, -0.02], [life, -0.02]]), shake });
  const e: Eye = { ...e0, x: e0.x + 0.6 };
  // o Varga e os homens: entram pela passarela do console; ele avança para o sistema; atingido, recua e some
  // 30/10 (ele: o Varga e os homens dele fora da plataforma): a plataforma do console vai de x −6,2 a −3,8 e de y 6,6 a
  // 9,4, com o console ocupando x −6,2…−4,6 / y 7,2…8,8 — eles andam só na faixa livre (a da frente e a do lado da
  // passarela), sem passar da borda
  // entra pela porta de serviço da parede da esquerda, atravessa a ponte e sai por ela de novo
  const vx = keys(f, [[0, -8.75], [enterAt, -8.75], [enterAt + 100, -4.05], [breakAt, -4.05], [breakAt + 40, -4.3], [fleeAt, -4.4], [fleeAt + 75, -8.85]]);
  const vO = P(f, enterAt, 10) * (1 - P(f, fleeAt + 66, 10));
  // na borda da frente da plataforma do console (o duto e o console ficam atrás deles)
  // no fundo da plataforma, à direita do Varga na tela (fora da linha do console e do duto)
  // 30/10 (ele: os dois ficaram um atrás do outro, card em cima de card): visto da laje, cada um numa direção diferente —
  // um no canto do fundo (perto da passarela), o outro na faixa da frente, à esquerda do Varga (~10° entre cada marcador)
  const men: [number, number][] = [[-3.95, 9.2], [-5.6, 6.75]];
  const MEN_WHO = ["rebel", "rebel2"];
  // os leais ao Eli na passarela da direita, ao lado do Barney (dentro do quadro quando a câmera vira)
  const LOYAL: [number, number][] = [[1.6, 7.9], [2.6, 7.9]];
  const menO = P(f, enterAt + 10, 12) * (1 - P(f, fleeAt + 20, 20));
  // a Alyx: perto do núcleo → entre o Varga e o console → cai
  const ax = keys(f, [[0, -0.5], [standAt, -0.5], [standAt + 30, -1.4], [breakAt, -1.4], [breakAt + 40, -2.7], [life, -2.7]]);
  const ay = keys(f, [[0, 7.0], [standAt, 7.0], [standAt + 30, 7.8], [life, 7.8]]);
  const fall = P(f, fallAt, 14);
  // 12/10: o Eli do lado direito da laje (no meio, o crachá dele ficava em cima do núcleo)
  const ex = keys(f, [[0, 1.3], [fallAt + 20, 1.3], [fallAt + 70, ax + 0.6], [life, ax + 0.6]]);
  const ey2 = keys(f, [[0, 5.4], [fallAt + 20, 5.4], [fallAt + 70, ay + 0.1], [life, ay + 0.1]]);
  const shooter: V3 = [men[1][0], men[1][1], 1.3];
  const flash = f >= shotAt && f < shotAt + 6 ? 1 - (f - shotAt) / 6 : 0;
  const phase = f >= phaseAt && f < fleeAt + 20 && rnd(Math.floor(f / 3) * 7) > 0.6;
  const hot = 0.3 + 0.5 * P(f, preserveAt, 20) * (1 - P(f, standAt, 20));
  const quote = (a: number, b: number, t: string, col = TXT) =>
    f >= a && f < b ? <Kin kind="quote" t0={a} until={b} bottom={160} size={42} col={col === TXT ? "#ffd27a" : col} text={t} /> : null;
  // cada carimbo um pouco antes da palavra (o dossiê já entrou em "arquivos")
  const files: [string, number][] = [["ASCENSÃO", filesAt - 4], ["PERPETUIDADE", filesAt + 23], ["CONTINUIDADE DA CONSCIÊNCIA", filesAt + 51]];
  const chain: [string, string, number][] = [["CAVE JOHNSON", "“só a minha mente”", exceptAt], ["WALLACE BREEN", "“só eu continuo”", exceptAt + 45], ["VARGA", "“só a minha filha”", exceptAt + 90]];
  return (
    <AbsoluteFill style={{ background: "#020304", overflow: "hidden" }}>
      <CoreRoom e={e} f={f} G={G} o={{ rings: notches(1), ringO: 0.7, wound: 0.5, arcs: phase ? 0.8 : 0, push: 0.2, hot, mL: f >= breakAt && f < fleeAt ? 0.6 : 0.25, mR: 0.05, beam: 0 }}>
        {/* a ligação que o Varga vê: dele até o núcleo */}
        {f >= seesAt && f < standAt ? (() => {
          const a = proj(e, [vx, 7.05, 1.6]);
          const b = proj(e, CORE);
          return a && b ? (
            <g opacity={P(f, seesAt, 10) * (1 - P(f, standAt - 10, 10))}>
              <path d={`M ${a.x} ${a.y} Q ${(a.x + b.x) / 2} ${Math.min(a.y, b.y) - 120} ${b.x} ${b.y}`} fill="none" stroke={AMB} strokeWidth={2} strokeDasharray="6 8" strokeDashoffset={-f * 2} />
              <text x={(a.x + b.x) / 2} y={Math.min(a.y, b.y) - 80} textAnchor="middle" fill={AMB} fontFamily={MONO} fontSize={20} letterSpacing={4} style={{ paintOrder: "stroke", stroke: "#000", strokeWidth: 4 }}>{f >= daughterAt ? "PODERIA TER SALVADO A FILHA" : "A TECNOLOGIA"}</text>
            </g>
          ) : null;
        })() : null}
        {/* os homens dele */}
        {men.map(([x, y], k) => (
          <Pin key={k} e={e} x={x} y={y} h={2.3} col="#c9a46a" f={f} o={menO} who={MEN_WHO[k]} text="COM O VARGA" />
        ))}
        {/* o disparo: o clarão na mão de um dos homens e o traçante até a Alyx */}
        {f >= shotAt && f < shotAt + 10 ? (() => {
          const s = proj(e, shooter);
          const t = proj(e, [ax, ay, 1.2]);
          return s && t ? (
            <g>
              <circle cx={s.x} cy={s.y} r={22 * flash + 4} fill="#fff2c0" style={{ filter: "drop-shadow(0 0 20px #ffd27a)" }} />
              <line x1={s.x} y1={s.y} x2={t.x} y2={t.y} stroke="#fff2c0" strokeWidth={3} opacity={1 - (f - shotAt) / 10} />
            </g>
          ) : null;
        })() : null}
        {/* o tiroteio: o Barney e os rebeldes leais do outro lado; traçantes cruzando */}
        {f >= fightAt ? (
          <>
            <FlagAt e={e} pt={[3.6, 7.9, 0]} label="BARNEY" col={AMB} f={f} o={P(f, fightAt, 10)} sub={f < eliArmsAt ? "REAGE" : undefined} />
            {LOYAL.map(([x, y], k) => <Pin key={"r" + k} e={e} x={x} y={y} col={GREEN} f={f} o={P(f, fightAt + 6 + k * 4, 10)} who={k ? "rebel7" : "rebel3"} text="LEAL AO ELI" />)}
            {fighting
              ? Array.from({ length: 4 }).map((_, k) => {
                  if (rnd(Math.floor(f / 3) * 11 + k) < 0.55) return null;
                  const fromL = k % 2 === 0;
                  const A = fromL ? men[k % 2] : LOYAL[k % 2];
                  const B = fromL ? LOYAL[(k + 1) % 2] : men[(k + 1) % 2];
                  const a = proj(e, [A[0], A[1], 1.3]);
                  const b = proj(e, [B[0], B[1], 1.3]);
                  return a && b ? <line key={"t" + k} x1={a.x} y1={a.y} x2={a.x + (b.x - a.x) * 0.7} y2={a.y + (b.y - a.y) * 0.7} stroke="#ffe7a0" strokeWidth={2} opacity={0.9} /> : null;
                })
              : null}
          </>
        ) : null}
        {/* o Varga */}
        <FlagAt e={e} pt={[vx, 7.05, 0]} label="VARGA" col={f >= fleeAt ? RED : AMB} f={f} o={vO} sub={f >= fleeAt ? "ATINGIDO · FOGE · PERDE O NAVIO" : f >= notWinAt ? "TAMBÉM NÃO VENCE" : f >= vargaAt && f < shotAt ? "RESPONDE" : f >= seesAt && f < standAt ? "VÊ OUTRA COISA" : f >= filesAt && f < eliAt ? "LEU DEMAIS OS ARQUIVOS" : undefined} />
        {/* o Eli: diante do núcleo → vai até ela */}
        <FlagAt e={e} pt={[ex, ey2, 0]} label="ELI" col={AMB} f={f} o={P(f, 6, 10)} sub={f >= eliArmsAt ? "COM ALYX NOS BRAÇOS" : f >= fallAt + 20 ? "NA FRENTE DO PRÓPRIO ELI" : f >= eliAt && f < alyxAt ? "UMA ARMA · ENTERRAR" : undefined} />
        {/* a Alyx: a bandeira cai e apaga */}
        <FlagAt e={e} pt={[ax, ay, -1.45 * fall]} label="ALYX" col={fall > 0 ? `rgba(160,160,160,${1 - 0.3 * fall})` : f >= standAt ? RED : ORANGE} f={f} sub={fall > 0 ? undefined : f >= standAt && f < shotAt ? "SE LEVANTA" : f >= seenAt && f < standAt ? "JÁ VIU ESSE RACIOCÍNIO" : f >= alyxAt && f < seesAt ? "UM CICLO · QUEBRAR" : undefined} />
        {/* o console que o Varga quer alcançar */}
        {f >= breakAt && f < shotAt + 20 ? <Call e={e} f={f} pt={[SH_CONSOLE[0], SH_CONSOLE[1], 1.2]} from={breakAt} until={shotAt + 20} text="O SISTEMA" col={RED} dx={-120} dy={-200} /> : null}
      </CoreRoom>
      {phase ? <AbsoluteFill style={{ background: "rgba(150,110,255,0.16)", mixBlendMode: "screen", pointerEvents: "none" }} /> : null}
      {flash > 0 ? <AbsoluteFill style={{ background: `rgba(255,248,226,${0.55 * flash})`, pointerEvents: "none" }} /> : null}
      {/* o dossiê da Mossman nas mãos dele */}
      {f >= filesAt - 36 && f < seenAt ? (
        <div style={{ position: "absolute", left: 60, top: 70, width: 400, zoom: 0.85, padding: "18px 22px", background: "#e8dfc6", borderRadius: 4, boxShadow: "0 20px 60px rgba(0,0,0,0.6)", fontFamily: "'Courier New', monospace", color: "#2a2418", transform: `rotate(-2deg) translateX(${(1 - P(f, filesAt - 36, 14)) * -80}px)`, opacity: P(f, filesAt - 36, 10) * (1 - P(f, seenAt - 10, 10)) }}>
          <div style={{ fontSize: 15, letterSpacing: 3 }}>ARQUIVOS · J. MOSSMAN · CONFIDENCIAL</div>
          {files.map(([t, t0]) => (
            <div key={t} style={{ marginTop: 12, display: "inline-block", marginRight: 10, padding: "4px 10px", border: "3px solid #b22218", color: "#b22218", fontWeight: 700, fontSize: 22, letterSpacing: 2, transform: `rotate(${t0 % 2 ? -3 : 2}deg) scale(${f >= t0 ? 1.15 - 0.15 * P(f, t0, 8) : 0})`, opacity: P(f, t0, 4) }}>{t}</div>
          ))}
          {f >= daughterAt ? (
            <div style={{ marginTop: 16, padding: "10px 12px", background: "#f4eed9", border: "1px solid #8a7a5a", fontSize: 17, opacity: P(f, daughterAt, 8) }}>
              anotado à mão, por cima: <span style={{ fontFamily: "'Segoe Print', cursive", color: "#1d3a6a", fontSize: 20 }}>“ela não precisava ter morrido”</span>
            </div>
          ) : null}
        </div>
      ) : null}
      {/* a última exceção: sempre começa assim */}
      {f >= exceptAt && f < standAt ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 120, display: "flex", justifyContent: "center", gap: 18, fontFamily: MONO, opacity: 1 - P(f, standAt - 10, 10) }}>
          {chain.map(([n, q, t0], k) => (
            <div key={n} style={{ display: "flex", alignItems: "center", gap: 18, opacity: P(f, t0, 10) }}>
              <div style={{ padding: "12px 16px", borderRadius: 10, background: "rgba(14,10,4,0.88)", border: `1.5px solid ${k === 2 ? RED : AMB}`, minWidth: 250 }}>
                <div style={{ fontSize: 13, letterSpacing: 3, color: AMB }}>A ÚLTIMA EXCEÇÃO</div>
                <div style={{ fontSize: 22, letterSpacing: 2, color: TXT, marginTop: 4 }}>{n}</div>
                <div style={{ fontSize: 16, color: k === 2 ? RED : "#ffe2b0", marginTop: 4 }}>{q}</div>
              </div>
              {k < 2 ? <span style={{ color: AMB, fontSize: 28, opacity: P(f, chain[k + 1][2], 8) }}>→</span> : null}
            </div>
          ))}
        </div>
      ) : null}
      {quote(askAt, preserveAt, "“Por que destruir? Por que não estudar?”", "#ffe2b0")}
      {quote(preserveAt, seenAt, "“Se existe uma chance real de preservar uma consciência, por que ninguém deveria tentar?”", "#ffe2b0")}
      {/* 30/10 (ele: a frase do Varga ficava atrás do crachá da Alyx): as duas falas viram citação embaixo, com quem fala */}
      {f >= noTouchAt && f < vargaAt ? <Kin kind="quote" t0={noTouchAt} until={vargaAt} bottom={160} size={42} col={ORANGE} who="ALYX" text="Ninguém mais vai tocar no núcleo." /> : null}
      {f >= vargaAt && f < breakAt ? <Kin kind="quote" t0={vargaAt} until={breakAt} bottom={160} size={42} col={AMB} who="VARGA" text="Você já decidiu coisa demais por todo mundo." /> : null}
      {quote(diesAt, worseAt, "Morre porque um homem não consegue aceitar que algumas coisas terminam.")}
      {quote(worseAt, notWinAt, "No primeiro momento em que tinha se permitido acreditar que talvez estivesse errada.")}
      <Hud f={f} yaw={e.yaw} eye={e} blips={[{ x: vx, y: 7.0, hot: f < fleeAt }, { x: ax, y: ay }]} msg={f >= nothingAt ? "GORDON · NÃO CONSEGUIU FAZER NADA" : f >= phaseAt && f < fleeAt ? "O BOREALIS ENTRA E SAI DE FASE" : f >= fightAt && f < phaseAt ? "O NÚCLEO VIRA UM TIROTEIO" : f >= enterAt && f < filesAt ? "VARGA ENTRA NO NÚCLEO" : undefined} msgCol={f >= nothingAt ? TXT : f >= phaseAt ? VIO : f >= fightAt ? RED : AMB} o={1 - 0.5 * P(f, nothingAt, 30)} />
      <AbsoluteFill style={{ background: "#000", opacity: Math.max(fadeIO(f, life), 0.45 * P(f, nothingAt, 60)), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ================================================================================================= MÓDULO 13 · leva D
// ---------------------------------------------------------------- 1:33:56 / 1:35:13 / 1:36:25 o tempo para (POV, a câmara congelada)
// a câmara do núcleo parada no meio do tiroteio: os traçantes presos no ar, o clarão congelado, a poeira imóvel, tudo em tom
// frio. O G-Man (a silhueta de terno, a mesma do tabuleiro) atravessa a passarela até o Gordon. As falas dele em itálico.
// modo 0: ele olha o Varga congelado no meio da fuga, depois a Alyx · modo 1: "Combine. Humanos." — os dois uniformes na
// balança, iguais; "para quem observa de fora" — a câmera recua e a sala vira uma janela no vazio, ele do lado de fora ·
// modo 2: ele chega perto ("não acredita em mim?") → "veja com seus próprios olhos": o espaço-tempo estica para frente.
const FZ_TRACERS: [V3, V3][] = [[[-3.6, 9.3, 1.3], [1.6, 7.9, 1.3]], [[1.6, 7.9, 1.25], [-4.6, 9.4, 1.35]], [[2.6, 7.9, 1.3], [-3.6, 9.3, 1.25]], [[-4.6, 9.4, 1.32], [2.6, 7.9, 1.28]]];
const GmanAt: React.FC<{ e: Eye; x: number; y: number; o?: number; glow?: number }> = ({ e, x, y, o = 1, glow = 0.55 }) => {
  const top = proj(e, [x, y, 1.88]);
  const bot = proj(e, [x, y, 0]);
  if (!top || !bot || o <= 0) return null;
  const h = bot.y - top.y;
  return (
    <div style={{ position: "absolute", left: top.x - h * 0.185, top: top.y, width: h * 0.37, height: h, opacity: o, filter: `drop-shadow(0 0 4px rgba(220,240,255,${glow})) drop-shadow(0 0 18px rgba(190,230,240,${glow * 0.55}))` }}>
      <div style={{ position: "absolute", inset: 0, WebkitMaskImage: `url(${staticFile("hl3silh/gman_silh.png")})`, maskImage: `url(${staticFile("hl3silh/gman_silh.png")})`, WebkitMaskSize: "100% 100%", maskSize: "100% 100%", background: "linear-gradient(180deg, #2a3036, #07090b 80%)" }} />
    </div>
  );
};
export const HL13Freeze: React.FC<PR & { mode?: number; lines?: string[]; note?: string }> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const mode = p.mode ?? 0;
  const lines: string[] = (p.lines as unknown as string[]) ?? [];
  const L = lines.map((_, k) => at(p, `l${k}At`));
  const [gmanAt, noteAt] = ats(p, ["gmanAt", "noteAt"]);
  const G = useMemo(() => buildCoreRoom(true), []);
  // o G-Man: modo 0 atravessa a passarela até o Gordon; modos 1/2 já está perto (no 2 chega mais)
  const gy = mode === 0 ? keys(f, [[0, 9.6], [gmanAt, 9.6], [L[0] ?? gmanAt + 200, 5.6], [life, 5.4]]) : mode === 1 ? 5.4 : keys(f, [[0, 5.4], [L[2] ?? 1e9, 5.4], [(L[2] ?? 1e9) + 40, 4.7]]);
  const gx = mode === 0 ? keys(f, [[0, -0.3], [gmanAt, -0.3], [L[0] ?? gmanAt + 200, 0.15]]) : 0.15;
  const gO = mode === 0 ? P(f, gmanAt, 24) : 1;
  // recuar para fora (modo 1, última fala): a sala vira uma janela no vazio
  const out = mode === 1 ? IOx((f - (L[3] ?? 1e9) + 6) / 40) : 0;
  // o salto no espaço-tempo (modo 2, última fala)
  const warp = mode === 2 ? Math.max(0, (f - (L[3] ?? 1e9) - 20) / Math.max(1, life - (L[3] ?? 0) - 20)) : 0;
  // modo 0: a câmera acompanha o olhar dele — o Varga congelado (esquerda), depois a Alyx, e volta
  const L1 = L[1] ?? 1e9;
  const yawK: [number, number][] = mode === 0 && L1 < 1e8 ? [[0, -0.12], [L1 - 150, -0.12], [L1 - 125, -0.5], [L1 - 80, -0.5], [L1 - 60, -0.3], [L1 + 20, -0.3], [L1 + 50, -0.12], [life, -0.1]] : [[0, -0.12], [life, -0.1]];
  const e0 = coreEye(f, { y: 3.4, yaw: keys(f, yawK), pitch: 0.02 });
  const e: Eye = { ...e0, x: e0.x + 0.6, y: e0.y + warp * 6 };
  const say = L.findIndex((t, k) => f >= t && f < (L[k + 1] ?? life));
  const lookV = mode === 0 && L[1] ? P(f, L[1] - 135, 10) * (1 - P(f, L[1] - 70, 10)) : 0;
  const lookA = mode === 0 && L[1] ? P(f, L[1] - 70, 10) * (1 - P(f, L[1] + 30, 10)) : 0;
  const both = mode === 1 && L[1] ? P(f, L[1], 10) * (1 - P(f, L[2] ?? 1e9, 10)) : 0;
  const room = (
    <AbsoluteFill style={{ filter: "saturate(0.22) brightness(0.82) contrast(1.05)" }}>
      <CoreRoom e={e} f={0} G={G} o={{ rings: notches(1), ringO: 0.7, wound: 0.5, arcs: 0, push: 0.2, hot: 0.3, mL: 0.6, mR: 0.05, beam: 0, spin: 0 }}>
        {/* os traçantes e os clarões presos no ar */}
        {(mode === 3 ? [] : FZ_TRACERS).map(([a3, b3], k) => {
          const a = proj(e, a3);
          const b = proj(e, b3);
          const u = 0.35 + 0.15 * k;
          return a && b ? <line key={k} x1={a.x + (b.x - a.x) * (u - 0.18)} y1={a.y + (b.y - a.y) * (u - 0.18)} x2={a.x + (b.x - a.x) * u} y2={a.y + (b.y - a.y) * u} stroke="#fff4c8" strokeWidth={3} /> : null;
        })}
        {(mode === 3 ? [] : [[-4.6, 9.4, 1.32], [1.6, 7.9, 1.3]]).map((v, k) => {
          const q = proj(e, v as V3);
          return q ? <circle key={"fl" + k} cx={q.x} cy={q.y} r={16} fill="#fff6d8" opacity={0.8} style={{ filter: "drop-shadow(0 0 14px #ffd27a)" }} /> : null;
        })}
        {/* a poeira parada no ar */}
        {Array.from({ length: 60 }).map((_, i) => {
          const q = proj(e, [-5 + rnd(i) * 10, 5 + rnd(i * 3) * 6, 0.3 + rnd(i * 7) * 3]);
          return q ? <circle key={"d" + i} cx={q.x} cy={q.y} r={Math.max(1, 6 / q.d)} fill="#e8f4ff" opacity={0.5} /> : null;
        })}
        {/* as bandeiras congeladas (no modo 3, depois do evento, a sala está vazia) */}
        {mode !== 3 ? <>
        <FlagAt e={e} pt={[-4.4, 7.0, 0]} label="VARGA" col={lookV > 0 ? "#cfe8ff" : "#7d8790"} f={0} sub={lookV > 0.5 ? "CONGELADO NA FUGA" : undefined} />
        <FlagAt e={e} pt={[-2.7, 7.8, -1.45]} label="ALYX" col={lookA > 0 ? "#cfe8ff" : "#7d8790"} f={0} sub={lookA > 0.5 ? "PARADA ONDE CAIU" : undefined} />
        <FlagAt e={e} pt={[-2.2, 7.5, 0]} label="ELI" col="#7d8790" f={0} />
        <FlagAt e={e} pt={[3.6, 7.9, 0]} label="BARNEY" col="#7d8790" f={0} />
        </> : null}
      </CoreRoom>
      <GmanAt e={e} x={gx} y={gy} o={gO} glow={0.55 + 0.25 * Math.sin(f / 20)} />
    </AbsoluteFill>
  );
  return (
    <AbsoluteFill style={{ background: "#03050a", overflow: "hidden" }}>
      {/* o vazio em volta (aparece quando a câmera sai da sala) */}
      {out > 0 ? (
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          {Array.from({ length: 140 }).map((_, i) => <circle key={i} cx={rnd(i) * 1920} cy={rnd(i * 3) * 1080} r={0.6 + rnd(i * 5) * 1.4} fill="#cfe8ff" opacity={0.25 + 0.4 * rnd(i * 7)} />)}
        </svg>
      ) : null}
      <AbsoluteFill style={{ transform: `scale(${1 - 0.62 * out + warp * 0.8})`, transformOrigin: "50% 48%", filter: warp > 0 ? `blur(${warp * 6}px) brightness(${1 + warp * 1.5})` : undefined, boxShadow: out > 0 ? `0 0 0 ${3 / Math.max(0.4, 1 - 0.62 * out)}px rgba(207,232,255,${out})` : undefined, borderRadius: out > 0 ? 18 * out : 0, overflow: "hidden" }}>
        {room}
      </AbsoluteFill>
      {/* do lado de fora da janela, o G-Man observa */}
      {out > 0 ? (
        <div style={{ position: "absolute", left: 1500, top: 300, width: 200, height: 540, opacity: out, filter: "drop-shadow(0 0 6px rgba(220,240,255,0.6)) drop-shadow(0 0 24px rgba(190,230,240,0.3))" }}>
          <div style={{ position: "absolute", inset: 0, WebkitMaskImage: `url(${staticFile("hl3silh/gman_silh.png")})`, maskImage: `url(${staticFile("hl3silh/gman_silh.png")})`, WebkitMaskSize: "100% 100%", maskSize: "100% 100%", background: "linear-gradient(180deg, #2a3036, #07090b 80%)" }} />
        </div>
      ) : null}
      {out > 0.5 ? <div style={{ position: "absolute", left: 0, right: 0, top: 120, textAlign: "center", fontFamily: MONO, fontSize: 20, letterSpacing: 6, color: "#cfe8ff", opacity: P(f, (L[3] ?? 0) + 30, 10) }}>DENTRO DA HISTÓRIA · E QUEM OBSERVA DE FORA</div> : null}
      {/* "Combine. Humanos." — os dois uniformes na balança, iguais */}
      {both > 0 ? (
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: both }}>
          <line x1={660} y1={430} x2={1260} y2={430} stroke="#cfe8ff" strokeWidth={4} />
          <polygon points="960,430 940,480 980,480" fill="#cfe8ff" />
          {[["hl3silh/combine_badge.jpg", "COMBINE", 660, RED], ["hl3silh/rebelde_badge.jpg", "HUMANOS", 1260, GREEN]].map(([img, n, x, c]) => (
            <g key={n as string} transform={`translate(${x} 430)`}>
              <line x1={0} y1={0} x2={0} y2={-30} stroke="#cfe8ff" strokeWidth={2} />
              <rect x={-80} y={-250} width={160} height={220} rx={10} fill="rgba(8,8,10,0.9)" stroke={c as string} strokeWidth={2.5} />
              <clipPath id={`bal${n}`}><rect x={-70} y={-240} width={140} height={168} rx={6} /></clipPath>
              <image href={staticFile(img as string)} x={-70} y={-240} width={140} height={168} preserveAspectRatio="xMidYMid slice" clipPath={`url(#bal${n})`} />
              <text x={0} y={-46} textAnchor="middle" fill={c as string} fontFamily={MONO} fontSize={18} letterSpacing={3}>{n as string}</text>
            </g>
          ))}
          <text x={960} y={540} textAnchor="middle" fill="#cfe8ff" fontFamily={MONO} fontSize={18} letterSpacing={5}>SEM PREFERÊNCIA PELO UNIFORME</text>
        </svg>
      ) : null}
      {/* a fala dele */}
      {say >= 0 && warp < 0.5 ? (
        <div style={{ position: "absolute", left: 220, right: 220, bottom: 150, textAlign: "center", fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: "italic", fontSize: 46, lineHeight: 1.25, color: "#f2ead8", textShadow: "0 4px 30px #000", opacity: P(f, L[say], 10) }}>{lines[say]}</div>
      ) : null}
      {mode === 0 && f >= noteAt && p.note ? (
        <div style={{ position: "absolute", right: 110, top: 120, padding: "10px 16px", border: "2px dashed #ffd27a", borderRadius: 8, fontFamily: MONO, fontSize: 18, letterSpacing: 3, color: "#ffd27a", transform: "rotate(3deg)", opacity: P(f, noteAt, 8) }}>EU SÓ TENTEI IMITAR O G-MAN</div>
      ) : null}
      {f < 40 && mode === 0 ? <div style={{ position: "absolute", left: 0, right: 0, top: 120, textAlign: "center", fontFamily: MONO, fontSize: 22, letterSpacing: 8, color: "#cfe8ff", opacity: P(f, 4, 10) * (1 - P(f, 30, 10)) }}>O TEMPO PARA</div> : null}
      {warp > 0 ? <AbsoluteFill style={{ background: `rgba(235,245,255,${Math.min(1, warp * 1.2)})`, pointerEvents: "none" }} /> : null}
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 1:35:03 / 1:35:38 os participantes (o tabuleiro do G-Man)
// o mesmo tabuleiro aprovado: trilhos A/B/C, os anos, o catalisador no fim. Modo 0: a peça COMBINE avança e volta (ele nunca
// precisou que vencessem) · a peça HUMANOS também (nunca precisou que perdessem). Modo 1: ALGUÉM tem que chegar ao
// catalisador → a convergência continua → a peça que chega troca de COMBINE para HUMANOS sem mudar o destino ("apenas
// alterou os participantes") → a releitura: ajudou o Gordon, deixou Advisors morrerem, Combine perderem, a Alyx contra
// eles → nunca trabalhou para lado nenhum → a história nos trilhos (os trilhos acendem) → a maior vitória (verde).
export const HL13Board: React.FC<PR & { mode?: number }> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const mode = p.mode ?? 0;
  const [combAt, humAt, neverAt, whatAt, contAt, altAt, rereadAt, helpAt, advAt, loseAt, alyxAt, sidesAt, railsAt, victAt] = ats(p, ["combAt", "humAt", "neverAt", "whatAt", "contAt", "altAt", "rereadAt", "helpAt", "advAt", "loseAt", "alyxAt", "sidesAt", "railsAt", "victAt"]);
  const e: Eye = { x: 0.05 * Math.sin(f / 70), y: keys(f, [[0, 1.5], [life, 1.8]]), z: 2.3, yaw: 0, pitch: -0.5, F: 1080 };
  const U = (i: number) => laneU(i / 6);
  const V = (k: number) => LANE_V[k];
  const CAT: [number, number] = [0.92, 500];
  const pcs: Piece[] = [];
  let swap = 0;
  if (!mode) {
    // COMBINE (trilho A) avança e volta; HUMANOS (trilho C) avança e volta
    const c = seqHop(f, [{ t: combAt + 10, d: 30, to: [U(5), V(0)] }, { t: combAt + 46, d: 24, to: [U(2), V(0)] }], [U(2), V(0)]);
    const h = seqHop(f, [{ t: humAt + 10, d: 30, to: [U(5), V(2)] }, { t: humAt + 46, d: 24, to: [U(2), V(2)] }], [U(2), V(2)]);
    pcs.push({ label: "COMBINE", col: RED, img: "hl3silh/combine_badge.jpg", u: c[0], v: c[1], h: c[2] });
    pcs.push({ label: "HUMANOS", col: GREEN, img: "hl3silh/rebelde_badge.jpg", u: h[0], v: h[1], h: h[2] });
  } else {
    // ALGUÉM (trilho B) vai até o catalisador; em "alterou os participantes" a peça troca de uniforme no caminho
    const s = seqHop(f, [{ t: whatAt + 6, d: 60, to: [U(5), V(1)] }, { t: altAt + 30, d: 30, to: [CAT[0] - 0.05, CAT[1]] }], [U(1), V(1)]);
    swap = P(f, altAt, 14);
    pcs.push({ label: swap > 0.5 ? "HUMANOS" : "COMBINE", col: swap > 0.5 ? (f >= victAt ? GREEN : GREEN) : RED, img: swap > 0.5 ? "hl3silh/rebelde_badge.jpg" : "hl3silh/combine_badge.jpg", u: s[0], v: s[1], h: s[2] });
    if (f >= rereadAt) {
      const g = seqHop(f, [{ t: helpAt, d: 24, to: [U(4), V(0)] }], [U(3), V(0)]);
      pcs.push({ label: "GORDON", col: AMB, u: g[0], v: g[1], h: g[2] });
      if (f < advAt + 30) pcs.push({ label: "ADVISORS", col: VIO, u: U(3), v: V(2), h: 0 });
      pcs.push({ label: "ALYX", col: ORANGE, img: "hl3silh/alyx_badge.jpg", ...((): { u: number; v: number; h: number } => { const a = seqHop(f, [{ t: alyxAt, d: 24, to: [U(4), V(2)] }], [U(5), V(0)]); return { u: a[0], v: a[1], h: a[2] }; })() });
    }
  }
  if (mode === 2) {
    // modo 2: a peça humana parada no catalisador — o destino continua; só mudou quem chegou
    pcs.length = 0;
    pcs.push({ label: "HUMANOS", col: GREEN, img: "hl3silh/rebelde_badge.jpg", u: CAT[0] - 0.05, v: CAT[1], h: 0 });
    const ghost = 1 - P(f, altAt, 16);
    if (ghost > 0) pcs.push({ label: "COMBINE", col: RED, img: "hl3silh/combine_badge.jpg", u: U(5), v: V(1), h: 0.25 * ghost });
  }
  if (mode === 3) {
    // as linhas em paralelo: cada trilho num ponto diferente da própria história, todos indo para o mesmo catalisador
    const [ourAt, warAt, wonAt, bmAt] = ats(p, ["ourAt", "warAt", "wonAt", "bmAt"]);
    pcs.length = 0;
    if (f >= ourAt) {
      pcs.push({ label: "HUMANOS", col: GREEN, img: "hl3silh/rebelde_badge.jpg", u: CAT[0] - 0.08, v: V(0) + 60, h: 0 });
      pcs.push({ label: "COMBINE", col: "#b8c4cc", img: "hl3silh/combine_badge.jpg", u: CAT[0] - 0.16, v: V(0) + 60, h: 0 });
    }
    if (f >= warAt) pcs.push({ label: "GUERRA", col: RED, img: "hl3silh/rebelde3_badge.jpg", u: U(3), v: V(1), h: 0.05 * Math.abs(Math.sin(f / 5)) });
    if (f >= wonAt) pcs.push({ label: "COMBINE VENCEU", col: RED, img: "hl3silh/combine_badge.jpg", u: U(5), v: V(2), h: 0 });
    if (f >= bmAt) pcs.push({ label: "BLACK MESA", col: AMB, u: U(0), v: V(2) - 100, h: 0 });
  }
  let swanK = 0;
  if (mode === 4) {
    // o cisne negro: os trilhos B e C chegam ao catalisador; o A (o nosso) termina antes, numa casa preta
    const [oursAt, swanAt, neverAt, archAt] = ats(p, ["oursAt", "swanAt", "neverAt", "archAt"]);
    void neverAt; void archAt;
    pcs.length = 0;
    pcs.push({ label: "HUMANOS", col: GREEN, img: "hl3silh/rebelde_badge.jpg", u: CAT[0] - 0.06, v: V(1), h: 0 });
    pcs.push({ label: "COMBINE", col: "#b8c4cc", img: "hl3silh/combine_badge.jpg", u: CAT[0] - 0.06, v: V(2), h: 0 });
    if (f >= oursAt) pcs.push({ label: "GORDON", col: AMB, u: U(5), v: V(0), h: 0 });
    swanK = P(f, swanAt, 20);
  }
  const lit = mode === 3 ? 0.4 + 0.6 * P(f, at(p, "shareAt"), 20) : mode ? 0.4 + 0.6 * P(f, railsAt, 20) : 0.5;
  const last = mode === 3 ? 0.3 + 0.7 * P(f, at(p, "sameAt"), 20) : mode ? 0.3 + 0.7 * P(f, victAt, 20) : 0.2;
  const tag = (t0: number, t1: number, text: string, col: string) => (f >= t0 && f < t1 ? <div key={text} style={{ marginTop: 10, padding: "8px 14px", background: "rgba(8,10,14,0.82)", borderLeft: `3px solid ${col}`, fontSize: 20, letterSpacing: 3, color: TXT, opacity: P(f, t0, 8) }}>{text}</div> : null);
  const gmTop = proj(e, [0, 7.6, 1.85]);
  const gmBot = proj(e, [0, 7.6, 0]);
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 30%, #121a22 0%, #05070a 70%, #020304 100%)", overflow: "hidden" }}>
      {gmTop && gmBot ? (() => {
        const h = gmBot.y - gmTop.y;
        const neutral = mode ? P(f, sidesAt, 14) * (1 - P(f, railsAt + 20, 14)) : 0;
        return (
          <div style={{ position: "absolute", left: gmTop.x - h * 0.185, top: gmTop.y, width: h * 0.37, height: h, opacity: P(f, 0, 14), filter: `drop-shadow(0 0 ${4 + 10 * neutral}px rgba(220,240,255,0.7)) drop-shadow(0 0 18px rgba(190,230,240,0.3))` }}>
            <div style={{ position: "absolute", inset: 0, WebkitMaskImage: `url(${staticFile("hl3silh/gman_silh.png")})`, maskImage: `url(${staticFile("hl3silh/gman_silh.png")})`, WebkitMaskSize: "100% 100%", maskSize: "100% 100%", background: "linear-gradient(180deg, #2a3036, #07090b 80%)" }} />
          </div>
        );
      })() : null}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <Pinned e={e} w={BW} h={BH} corners={[bPt(0, 0), bPt(1, 0), bPt(1, BH), bPt(0, BH)]}>
          <BoardTop f={f} lit={lit} wrong={0} lock={0} last={last} />
        </Pinned>
      </div>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {[...pcs].sort((a, b) => a.v - b.v).map((pc) => <Token key={pc.label} e={e} pc={pc} />)}
        {mode === 4 && swanK > 0 ? (() => {
          const q = proj(e, bPt(U(6), V(0), BZ + 0.01));
          const q2 = proj(e, bPt(U(6), V(0), BZ + 0.5));
          return q && q2 ? <g opacity={swanK}><ellipse cx={q.x} cy={q.y} rx={46} ry={20} fill="#000" stroke="#ff5d4d" strokeWidth={3} /><text x={q2.x} y={q2.y - 20} textAnchor="middle" fill="#f2efe6" fontFamily={MONO} fontSize={20} letterSpacing={4} style={{ paintOrder: "stroke", stroke: "#000", strokeWidth: 5 }}>O CISNE NEGRO</text></g> : null;
        })() : null}
        {/* "a convergência continua": o anel pulsando no catalisador */}
        {mode >= 3 ? null : mode && f >= contAt
          ? [0, 1, 2].map((k) => {
              const q = proj(e, bPt(CAT[0], CAT[1], BZ + 0.01));
              const t = ((f - contAt) / 40 + k / 3) % 1;
              return q ? <ellipse key={k} cx={q.x} cy={q.y} rx={60 + t * 160} ry={(60 + t * 160) * 0.45} fill="none" stroke="#ffd27a" strokeWidth={3} opacity={(1 - t) * 0.8} /> : null;
            })
          : null}
        {/* a troca de uniforme: um clarão na peça */}
        {mode && swap > 0 && swap < 1 ? (() => {
          const q = proj(e, bPt(pcs[0].u, pcs[0].v, BZ + 0.3));
          return q ? <circle cx={q.x} cy={q.y - 80} r={90 * (1 - swap) + 20} fill="none" stroke="#fff" strokeWidth={4} opacity={1 - swap} /> : null;
        })() : null}
      </svg>
      <div style={{ position: "absolute", left: 100, top: 110, width: 700, fontFamily: MONO }}>
        {mode === 4 ? (
          <>
            {tag(at(p, "linesAt"), life, "TODAS AS LINHAS CHEGAVAM AO MESMO EVENTO", "#cfe8ff")}
            {tag(at(p, "oursAt"), life, "A NOSSA TERMINA SEM O CATALISADOR", RED)}
            {tag(at(p, "swanAt"), life, "A EXCEÇÃO · O CISNE NEGRO", "#f2efe6")}
            {tag(at(p, "neverAt"), life, "✕ OS COMBINE VENCEREM · ✕ A HUMANIDADE VENCER", "rgba(242,240,247,0.6)")}
            {tag(at(p, "whatAt"), life, "O QUE IMPORTAVA: QUE O CATALISADOR ACONTECESSE", "#ffd27a")}
            {tag(at(p, "archAt"), life, "A ARQUITETURA DOS EMPREGADORES", VIO)}
          </>
        ) : mode === 3 ? (
          <>
            {tag(at(p, "diffAt"), life, "AS LINHAS EXISTEM EM PARALELO", "#cfe8ff")}
            {tag(at(p, "ourAt"), life, "A NOSSA · HUMANOS E COMBINE NO CATALISADOR", GREEN)}
            {tag(at(p, "warAt"), life, "OUTRA · A GUERRA AINDA ACONTECENDO", RED)}
            {tag(at(p, "wonAt"), life, "OUTRA · OS COMBINE VENCERAM HÁ SÉCULOS", RED)}
            {tag(at(p, "bmAt"), life, "OUTRA · BLACK MESA NEM ACONTECEU AINDA", AMB)}
            {tag(at(p, "shareAt"), life, "O QUE COMPARTILHAM: A CONVERGÊNCIA", "#ffd27a")}
          </>
        ) : mode === 2 ? (
          <>
            {tag(0, life, "O DESTINO CONTINUA O MESMO", "#ffd27a")}
            {tag(altAt, life, "SÓ MUDOU QUEM CHEGARIA LÁ", GREEN)}
          </>
        ) : !mode ? (
          <>
            {tag(combAt, life, "✕ NUNCA PRECISOU QUE OS COMBINE GANHASSEM", RED)}
            {tag(humAt, life, "✕ NEM QUE A HUMANIDADE PERDESSE", GREEN)}
            {tag(neverAt, life, "O QUE IMPORTA É OUTRA COISA", "#ffd27a")}
          </>
        ) : (
          <>
            {tag(whatAt, rereadAt, "ALGUÉM PRECISA CHEGAR AO CATALISADOR", "#ffd27a")}
            {tag(contAt, rereadAt, "A CONVERGÊNCIA CONTINUA", "#ffd27a")}
            {tag(altAt, rereadAt, "NÃO IMPEDIU O RESULTADO · SÓ TROCOU OS PARTICIPANTES", "#cfe8ff")}
            {tag(helpAt, sidesAt, "ÀS VEZES AJUDOU O GORDON", AMB)}
            {tag(advAt, sidesAt, "DEIXOU ADVISORS MORREREM", VIO)}
            {tag(loseAt, sidesAt, "DEIXOU OS COMBINE PERDEREM BATALHAS", RED)}
            {tag(alyxAt, sidesAt, "PÔS A ALYX CONTRA OS COMBINE", ORANGE)}
            {tag(sidesAt, life, "NUNCA TRABALHOU PARA NENHUM DOS LADOS", "#cfe8ff")}
            {tag(railsAt, life, "O TRABALHO DELE: A HISTÓRIA NOS TRILHOS", "#ffd27a")}
          </>
        )}
      </div>
      {mode === 1 ? <Kin kind="light" t0={victAt} bottom={110} size={50} col="#ffe2a0" text="a maior vitória da história para a humanidade" /> : null}
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ================================================================================================= MÓDULO 13 · leva E1
// ---------------------------------------------------------------- 1:36:51 o tempo corre (POV parado, o mundo envelhece)
// do alto, o Gordon parado com o G-Man ao lado (silhueta, à direita): o vale e o gelo em time-lapse — o céu passa dias e
// noites, o ano sobe (2032 → 2190). No gelo, o Borealis: o véu cobre o navio, os códigos afundam no gelo. No vale: os depósitos
// de armas desabam (Eli cumpre a promessa), a cidade cresce, a célula do Varga vira manchas vermelhas que se espalham (ele
// some, a ideia fica), Eli e Barney envelhecem e somem, o monumento da Alyx com o Dog ao lado, a cidade vira Combine
// (energia, transporte, medicina, armas), os crachás das pessoas viram máscaras → o véu cai e o Borealis volta.
const FUT_B = Array.from({ length: 34 }).map((_, i) => ({ x: 720 + i * 33 + (rnd(i * 3.1) - 0.5) * 14, w: 22 + rnd(i * 5.7) * 22, h: 40 + rnd(i * 7.3) * 120, comb: rnd(i * 9.1) > 0.55 }));
export const HL13Future: React.FC<PR & { events?: { k: string; c: string }[]; y0?: number; y1?: number }> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const E = Array.from({ length: 12 }).map((_, k) => at(p, `e${k}At`));
  const [runAt] = ats(p, ["runAt"]);
  const evs = (p.events as unknown as { k: string; c: string }[]) ?? [];
  const y0 = (p.y0 as number | undefined) ?? 2032;
  const y1 = (p.y1 as number | undefined) ?? 2190;
  const year = Math.round(interpolate(f, [runAt, life - 20], [y0, y1], C));
  // o dia passando (um ciclo a cada ~3 s)
  const day = 0.5 + 0.5 * Math.sin((f / 90) * Math.PI * 2 - Math.PI / 2);
  const sunA = ((f / 90) % 1) * Math.PI;
  const skyTop = `rgb(${Math.round(10 + 50 * day)},${Math.round(14 + 80 * day)},${Math.round(30 + 120 * day)})`;
  const skyBot = `rgb(${Math.round(30 + 150 * day)},${Math.round(30 + 120 * day)},${Math.round(40 + 90 * day)})`;
  const grow = interpolate(f, [E[3], E[9]], [0.15, 1], C) + 0.6 * P(f, E[9], 120);
  const comb = P(f, E[9], 60);
  const veil = P(f, E[1], 30) * (1 - P(f, E[11] + 10, 20));
  const veilDrop = f >= E[11] && f < E[11] + 30;
  const red = interpolate(f, [E[4], E[6], E[10] + 60], [0, 0.4, 1], C);
  const masks = P(f, E[10], 30);
  const ev = E.reduce((acc, t, k) => (f >= t ? k : acc), -1);
  const card = (x: number, img: string, n: string, gone: number, sub: string) => (
    <g transform={`translate(${x} 120)`} opacity={1 - 0.75 * gone}>
      <rect x={0} y={0} width={110} height={150} rx={8} fill="rgba(8,8,10,0.85)" stroke={gone > 0.5 ? "#6d747c" : AMB} strokeWidth={2} />
      <clipPath id={`fu${n}`}><rect x={6} y={6} width={98} height={112} rx={5} /></clipPath>
      <image href={staticFile(img)} x={6} y={6} width={98} height={112} preserveAspectRatio="xMidYMid slice" clipPath={`url(#fu${n})`} style={{ filter: `grayscale(${gone}) brightness(${1 - 0.3 * gone})` }} />
      <text x={55} y={136} textAnchor="middle" fill={gone > 0.5 ? "#9aa3ab" : AMB} fontFamily={MONO} fontSize={13} letterSpacing={2}>{n}</text>
      {sub ? <text x={55} y={170} textAnchor="middle" fill="rgba(242,240,247,0.75)" fontFamily={MONO} fontSize={12} letterSpacing={1}>{sub}</text> : null}
    </g>
  );
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="fuSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={skyTop} />
            <stop offset="1" stopColor={skyBot} />
          </linearGradient>
          <radialGradient id="fuVeil" cx="0.5" cy="0.8" r="0.7">
            <stop offset="0" stopColor="rgba(159,230,255,0.05)" />
            <stop offset="0.8" stopColor="rgba(159,230,255,0.22)" />
            <stop offset="1" stopColor="rgba(159,230,255,0.5)" />
          </radialGradient>
        </defs>
        <rect width={1920} height={1080} fill="url(#fuSky)" />
        {/* estrelas à noite, o sol cruzando de dia */}
        {Array.from({ length: 90 }).map((_, i) => <circle key={"s" + i} cx={rnd(i) * 1920} cy={rnd(i * 3) * 420} r={0.8 + rnd(i * 5)} fill="#fff" opacity={(1 - day) * 0.7} />)}
        <circle cx={160 + Math.cos(Math.PI - sunA) * -800 + 800} cy={460 - Math.sin(sunA) * 360} r={34} fill="#fff4d6" opacity={day} style={{ filter: "drop-shadow(0 0 30px #ffe2a0)" }} />
        {/* as montanhas */}
        <path d="M 0 520 L 180 430 L 330 500 L 520 400 L 700 490 L 900 420 L 1120 500 L 1350 410 L 1600 490 L 1920 430 L 1920 640 L 0 640 Z" fill={`rgb(${Math.round(40 + 40 * day)},${Math.round(48 + 50 * day)},${Math.round(62 + 60 * day)})`} />
        <path d="M 0 600 L 260 540 L 520 600 L 760 560 L 1000 610 L 1300 570 L 1600 620 L 1920 580 L 1920 700 L 0 700 Z" fill={`rgb(${Math.round(30 + 30 * day)},${Math.round(36 + 36 * day)},${Math.round(46 + 44 * day)})`} />
        {/* o gelo à esquerda e o Borealis */}
        <path d="M 0 640 L 640 640 L 700 700 L 0 720 Z" fill={`rgb(${Math.round(150 + 80 * day)},${Math.round(170 + 70 * day)},${Math.round(190 + 60 * day)})`} />
        <g transform="translate(90 548) scale(0.42)" opacity={1 - 0.85 * veil}>
          <ShipProfile stroke="#2a3038" fill="#5a3630" rust={0.4} />
        </g>
        {f >= E[11] ? <g transform="translate(90 548) scale(0.42)" opacity={P(f, E[11] + 10, 20)} style={{ filter: "drop-shadow(0 0 16px #9fe6ff)" }}><ShipProfile stroke="#9fe6ff" fill="rgba(90,54,48,0.9)" rust={0.4} /></g> : null}
        {veil > 0 ? <ellipse cx={300} cy={672} rx={260} ry={150} fill="url(#fuVeil)" stroke="#cfefff" strokeWidth={2} opacity={veil * (veilDrop ? (Math.floor(f / 3) % 2 ? 1 : 0.2) : 1)} strokeDasharray="10 6" strokeDashoffset={-f} /> : null}
        {veil > 0.3 ? <text x={300} y={510} textAnchor="middle" fill="#cfefff" fontFamily={MONO} fontSize={16} letterSpacing={4} opacity={veil}>O VÉU</text> : null}
        {/* os códigos afundando no gelo */}
        {f >= E[2] ? (() => {
          const sink = P(f, E[2] + 10, 50);
          return (
            <g opacity={1 - 0.6 * sink}>
              <rect x={580} y={650 + sink * 30} width={36} height={24} rx={3} fill="#3a3c44" stroke="#ffd27a" strokeWidth={2} />
              <text x={598} y={640} textAnchor="middle" fill="#ffd27a" fontFamily={MONO} fontSize={14} letterSpacing={2} opacity={P(f, E[2], 10)}>CÓDIGOS · NO GELO</text>
            </g>
          );
        })() : null}
        {/* o vale: os depósitos de armas (desabam) e a cidade */}
        <path d="M 640 700 L 1920 680 L 1920 1080 L 640 1080 Z" fill={`rgb(${Math.round(36 + 30 * day)},${Math.round(40 + 30 * day)},${Math.round(36 + 26 * day)})`} />
        {[860, 1210, 1580].map((x, k) => {
          const fall = P(f, E[0] + k * 12, 18);
          return (
            <g key={"dep" + k}>
              <rect x={x} y={760 - 150 * (1 - fall)} width={36} height={150 * (1 - fall)} fill="#22262c" stroke="#9fe6ff" strokeWidth={1.5} opacity={1 - fall * 0.8} />
              {f >= E[0] + k * 12 && f < E[0] + k * 12 + 10 ? <circle cx={x + 18} cy={700} r={60} fill="#ffe2a0" opacity={1 - (f - E[0] - k * 12) / 10} /> : null}
            </g>
          );
        })}
        {FUT_B.map((b, i) => {
          const h = b.h * grow * (b.comb ? 1 + 1.8 * comb : 1);
          const cTop = b.comb && comb > 0.5;
          return (
            <g key={"b" + i}>
              <rect x={b.x} y={770 - h} width={b.w * (cTop ? 0.7 : 1)} height={h} fill={comb > 0.5 ? "#1c2026" : `rgb(${Math.round(60 + 40 * day)},${Math.round(56 + 36 * day)},${Math.round(50 + 30 * day)})`} stroke={comb > 0.5 ? "#4fb8d8" : "none"} strokeWidth={1} />
              {Array.from({ length: Math.floor(h / 18) }).map((_, j) => (
                <rect key={j} x={b.x + 4} y={770 - h + 6 + j * 18} width={b.w * (cTop ? 0.7 : 1) - 8} height={4} fill={comb > 0.5 ? "#9fe6ff" : "#ffd88a"} opacity={(1 - day) * 0.8 * (rnd(i * 13 + j) > 0.3 ? 1 : 0.2)} />
              ))}
            </g>
          );
        })}
        {/* a seita do Varga: manchas vermelhas que se espalham pela cidade */}
        {Array.from({ length: 30 }).map((_, i) => (i / 30 < red ? <circle key={"r" + i} cx={740 + rnd(i * 7.7) * 1120} cy={720 + rnd(i * 3.3) * 70} r={4 + rnd(i) * 4} fill="#ff5d4d" opacity={0.8} style={{ filter: "drop-shadow(0 0 6px #ff5d4d)" }} /> : null))}
        {/* o monumento da Alyx, o Dog ao lado */}
        {f >= E[8] ? (
          <g opacity={P(f, E[8], 14)}>
            <rect x={1000} y={820} width={120} height={70} fill="#8a8478" stroke="#3a3630" strokeWidth={2} />
            <rect x={1020} y={760} width={80} height={60} fill="#a29a8c" />
            <rect x={1012} y={846} width={96} height={22} fill="#2a2620" />
            <text x={1060} y={862} textAnchor="middle" fill="#ffd27a" fontFamily={MONO} fontSize={13} letterSpacing={2}>ALYX VANCE</text>
            <g transform="translate(1160 700)">
              <rect x={-45} y={-60} width={90} height={110} rx={7} fill="rgba(8,8,10,0.88)" stroke={ICE} strokeWidth={2} />
              <clipPath id="fuDog"><rect x={-40} y={-55} width={80} height={80} rx={5} /></clipPath>
              <image href={staticFile("hl3silh/dog_badge.jpg")} x={-40} y={-55} width={80} height={80} preserveAspectRatio="xMidYMid slice" clipPath="url(#fuDog)" />
              <text x={0} y={42} textAnchor="middle" fill={ICE} fontFamily={MONO} fontSize={13} letterSpacing={2}>DOG</text>
              <line x1={0} y1={50} x2={0} y2={150} stroke={ICE} strokeWidth={1.5} />
            </g>
          </g>
        ) : null}
        {/* os usos da tecnologia Combine */}
        {f >= E[9] ? ["ENERGIA", "TRANSPORTE", "MEDICINA", "ARMAMENTO"].map((t, k) => (
          <g key={t} opacity={P(f, E[9] + k * 18, 10)}>
            <line x1={820 + k * 260} y1={600} x2={820 + k * 260} y2={560} stroke="#4fb8d8" strokeWidth={1.5} />
            <text x={820 + k * 260} y={550} textAnchor="middle" fill="#9fe6ff" fontFamily={MONO} fontSize={16} letterSpacing={3}>{t}</text>
          </g>
        )) : null}
        {/* as pessoas: os crachás viram máscaras */}
        {f >= E[3] ? ["hl3silh/rebelde_badge.jpg", "hl3silh/rebelde2_badge.jpg", "hl3silh/cidada_badge.jpg", "hl3silh/rebelde8_badge.jpg", "hl3silh/rebelde3_badge.jpg"].map((img, k) => {
          const m = P(f, E[10] + k * 8, 10);
          return (
            <g key={"pp" + k} transform={`translate(${720 + k * 180} 930)`} opacity={P(f, E[3] + k * 6, 10)}>
              <rect x={-36} y={-50} width={72} height={92} rx={6} fill="rgba(8,8,10,0.88)" stroke={m > 0.5 ? "#9aa3ab" : GREEN} strokeWidth={2} />
              <clipPath id={`pp${k}`}><rect x={-31} y={-45} width={62} height={62} rx={4} /></clipPath>
              <image href={staticFile(m > 0.5 ? "hl3silh/combine_badge.jpg" : img)} x={-31} y={-45} width={62} height={62} preserveAspectRatio="xMidYMid slice" clipPath={`url(#pp${k})`} />
              <text x={0} y={32} textAnchor="middle" fill={m > 0.5 ? "#9aa3ab" : GREEN} fontFamily={MONO} fontSize={11} letterSpacing={1.5}>{m > 0.5 ? "MÁSCARA" : "CIDADÃO"}</text>
            </g>
          );
        }) : null}
        {/* Eli, Barney e o Varga: envelhecem e somem */}
        {card(80, "hl3silh/eli_retrato.png", "ELI", P(f, E[7], 40), f >= E[7] ? "ENVELHECE" : "CUMPRE A PROMESSA")}
        {card(210, "hl3silh/barney_badge.jpg", "BARNEY", P(f, E[7] + 30, 40), f >= E[7] + 30 ? "ENVELHECE" : "AO LADO DO ELI")}
        {f >= E[4] ? card(340, "hl3silh/varga_retrato.png", "VARGA", P(f, E[6], 30), f >= E[6] ? "A IDEIA SOBREVIVE" : f >= E[5] ? "ARQUIVOS = ESCRITURA" : "UMA CÉLULA") : null}
      </svg>
      {/* o G-Man ao lado do Gordon (primeiro plano, à direita) */}
      <div style={{ position: "absolute", right: 30, top: 300, width: 290, height: 790, opacity: P(f, 0, 20), filter: "drop-shadow(0 0 4px rgba(220,240,255,0.5)) drop-shadow(0 0 20px rgba(190,230,240,0.25))" }}>
        <div style={{ position: "absolute", inset: 0, WebkitMaskImage: `url(${staticFile("hl3silh/gman_silh.png")})`, maskImage: `url(${staticFile("hl3silh/gman_silh.png")})`, WebkitMaskSize: "100% 100%", maskSize: "100% 100%", background: "linear-gradient(180deg, #2a3036, #07090b 80%)" }} />
      </div>
      {/* o ano e o acontecimento */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 50, textAlign: "center", fontFamily: MONO, color: "#f2efe6" }}>
        <div style={{ fontSize: 16, letterSpacing: 8, opacity: 0.75 }}>O TEMPO CORRE · GORDON PARADO NO MESMO LUGAR</div>
        <div style={{ fontSize: 64, letterSpacing: 6, marginTop: 6, textShadow: "0 4px 24px #000" }}>{year}</div>
      </div>
      {ev >= 0 && evs[ev] ? (
        <div style={{ position: "absolute", left: 80, bottom: 120, padding: "12px 18px", background: "rgba(8,10,14,0.85)", borderLeft: `4px solid ${evs[ev].c}`, fontFamily: MONO, fontSize: 24, letterSpacing: 3, color: TXT, opacity: P(f, E[ev], 8) }}>{evs[ev].k}</div>
      ) : null}
      <Kin kind="quote" t0={E[10] + 40} until={E[11]} bottom={230} size={46} col={RED} who="BARNEY" text="Às vezes a máscara gruda." />
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 1:39:01 a escada da continuidade (POV, a sala da cápsula no futuro)
// a mesma sala da cápsula, séculos depois. Dentro do vidro, degrau por degrau: salvar alguém que morreria (o monitor
// cardíaco volta) → prolongar vidas (a idade sobe) → preservar os importantes (os crachás que "não podem se perder") → a
// consciência separada do corpo (o corpo apaga, a luz fica) → séculos → a mesma pergunta dos Advisors: o ocupante da
// cápsula vira um Advisor. "Se podemos continuar, por que aceitar o fim?"
export const HL13Ladder: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [studyAt, s1At, s2At, s3At, s4At, centAt, qAt] = ats(p, ["studyAt", "s1At", "s2At", "s3At", "s4At", "centAt", "qAt"]);
  void studyAt;
  const G = useMemo(() => buildPodRoom(), []);
  const e: Eye = { x: 0.1 * Math.sin(f / 70), y: keys(f, [[0, 3.0], [life, 4.4]]), z: 1.65, yaw: 0, pitch: 0.02, F: 980 };
  const lights: XL[] = [{ x: 0, y: 9.2, z: 1.6, col: [60, 255, 225], k: 0.45, r: 6.5 }, { x: -4.9, y: 7.6, z: 2.4, col: [120, 240, 220], k: 0.25, r: 4 }];
  const c = proj(e, [0, 9.2, 1.55]);
  const step = f >= qAt ? 5 : f >= s4At ? 4 : f >= s3At ? 3 : f >= s2At ? 2 : f >= s1At ? 1 : 0;
  const yr = Math.round(interpolate(f, [0, centAt, life], [2200, 2260, 2600], C));
  const age = Math.round(interpolate(f, [s2At, s3At], [82, 214], C));
  // 11/10: no degrau 5 a larva do Advisor 3D aparece DENTRO do casulo (vidro de verdade)
  const AS = useAdvScene([{ pos: [0, 9.25, 1.5], look: [e.x + 2, e.y, 1.6], reach: 0, show: step >= 5 }], f, 1.75, true);
  const glassM = useMemo(() => {
    const g2 = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, 2.15, 48, 1, true), new THREE.MeshPhysicalMaterial({ color: "#bffff4", roughness: 0.05, transparent: true, opacity: 0.14, depthWrite: false }));
    g2.position.set(0, 0.45 + 2.15 / 2, -9.2);
    return g2;
  }, []);
  const ladL = useMemo(() => {
    const pl = new THREE.PointLight("#e0fff8", 150, 12, 1.2);
    pl.position.set(0.5, 2.0, -8.0);
    return [pl];
  }, []);
  const steps: [number, string][] = [[s1At, "SALVAR ALGUÉM QUE MORRERIA"], [s2At, "PROLONGAR VIDAS"], [s3At, "PRESERVAR QUEM É IMPORTANTE DEMAIS"], [s4At, "CONSCIÊNCIA ≠ CORPO"]];
  return (
    <AbsoluteFill style={{ background: "#020304", overflow: "hidden" }}>
      <XView e={e} faces={G} lights={lights} flash={0.9} amb={0.08} hide={step >= 5 && AS.ready ? (fc) => fc.tag === "pod" : undefined} extras={step >= 5 ? [...AS.extras, glassM] : []} glLights={step >= 5 ? [...AS.lights, ...ladL] : []} />
      <PodRingsView e={e} noMid={step >= 5} />
      {c ? (() => {
        const u = 900 / c.d;
        return (
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            <defs>
              <clipPath id="ldIn"><ellipse cx={c.x} cy={c.y} rx={u * 0.56} ry={u * 0.95} /></clipPath>
            </defs>
            <ellipse cx={c.x} cy={c.y} rx={u * 0.56} ry={u * 0.95} fill="rgba(4,30,30,0.85)" />
            <g clipPath="url(#ldIn)">
              {step >= 1 && step < 4 ? (
                <polyline points={Array.from({ length: 60 }).map((_, k) => { const xx = c.x - u * 0.5 + k * (u / 60); const ph = ((k * 6 - f * 5) % 120 + 120) % 120; return `${xx},${c.y - u * 0.55 - (ph < 10 ? Math.sin((ph / 10) * Math.PI * 2) * u * 0.08 : 0)}`; }).join(" ")} fill="none" stroke="#8dffa8" strokeWidth={3} />
              ) : null}
              {/* o corpo: um vulto deitado de luz fraca; some no degrau 4 */}
              {step < 5 ? <ellipse cx={c.x} cy={c.y + u * 0.15} rx={u * 0.18} ry={u * 0.55} fill="rgba(200,230,230,0.25)" opacity={1 - P(f, s4At, 20)} /> : null}
              {step >= 4 && step < 5 ? <circle cx={c.x} cy={c.y - u * 0.25} r={u * (0.12 + 0.02 * Math.sin(f / 6))} fill="#e9fffa" opacity={0.9} style={{ filter: "drop-shadow(0 0 20px #4fe3d0)" }} /> : null}
              {step >= 5 && !AS.ready ? <AdvisorArt x={c.x} y={c.y + u * 0.05} w={u * 1.12} f={f} fold={1} lit={0.8} id="ldr" o={P(f, qAt, 20)} /> : null}
            </g>
            <ellipse cx={c.x} cy={c.y} rx={u * 0.56} ry={u * 0.95} fill="none" stroke="rgba(160,255,240,0.45)" strokeWidth={2} />
            {step === 2 ? <text x={c.x + u * 0.7} y={c.y - u * 0.2} fill="#8dffa8" fontFamily={MONO} fontSize={26} letterSpacing={3}>IDADE · {age}</text> : null}
            {step === 5 ? <text x={c.x + u * 0.7} y={c.y - u * 0.3} fill={VIO} fontFamily={MONO} fontSize={22} letterSpacing={4} opacity={P(f, qAt + 10, 10)}>A MESMA PERGUNTA DOS ADVISORS</text> : null}
          </svg>
        );
      })() : null}
      {/* os importantes demais para perder */}
      {step === 3 ? (
        <div style={{ position: "absolute", right: 120, top: 200, display: "flex", gap: 14, opacity: P(f, s3At, 10) }}>
          {["hl3silh/rebelde3_badge.jpg", "hl3silh/rebelde8_badge.jpg", "hl3silh/cidada_badge.jpg"].map((img, k) => (
            <div key={k} style={{ width: 110, height: 150, borderRadius: 8, overflow: "hidden", border: `2px solid ${AMB}`, backgroundImage: `url(${staticFile(img)})`, backgroundSize: "cover", backgroundPosition: "50% 30%", opacity: P(f, s3At + k * 6, 8) }} />
          ))}
        </div>
      ) : null}
      {/* a escada */}
      <div style={{ position: "absolute", left: 90, top: 140, fontFamily: MONO }}>
        <div style={{ fontSize: 15, letterSpacing: 5, color: "#9fe6ff" }}>ESTUDOS DO BOREALIS · {yr}</div>
        {steps.map(([t0, s], k) => (f >= t0 ? <div key={s} style={{ marginTop: 10, marginLeft: k * 28, padding: "8px 14px", background: "rgba(8,10,14,0.85)", borderLeft: `3px solid ${k === 3 ? VIO : "#9fe6ff"}`, fontSize: 21, letterSpacing: 3, color: TXT, opacity: P(f, t0, 8) }}>{`${k + 1} · ${s}`}</div> : null))}
        {f >= centAt ? <div style={{ marginTop: 14, marginLeft: 4 * 28, fontSize: 18, letterSpacing: 5, color: "#ffd27a", opacity: P(f, centAt, 8) }}>SÉCULOS SE PASSAM</div> : null}
      </div>
      <Kin kind="rise" t0={qAt + 20} bottom={130} size={48} col={VIO} text="Se podemos continuar, por que aceitar o fim?" />
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ================================================================================================= MÓDULO 13 · leva E2
// ---------------------------------------------------------------- 1:39:24 a nova União (a cidade → a câmara do núcleo)
// a nova Cidadela subindo no horizonte da cidade → corte para a câmara do núcleo reativada, séculos depois: o console do
// procedimento acende vermelho (FALTA UMA ETAPA), o dossiê da Mossman com buracos, o crachá da Alyx apagado (MORTA) →
// um sinal sai pelo duto ("fora daqui") e volta: entram crachás Combine pela passarela da direita e humanos pela da
// esquerda → TEM: O BOREALIS × TEM: O CONHECIMENTO → os dois se encontram na ponte (a aliança) → "CONTINUAR" → o G-Man
// (silhueta) no fundo, observando → humanos e Combine trabalhando lado a lado nos consoles (cálculos, sequências).
// 12/10 (ele: crachás flutuando): de pé nas passarelas laterais (z = 4), não sobre o poço
const UN_H: [number, number, string][] = [[-8.3, 9.0, "rebel"], [-8.3, 11.4, "rebel2"], [-8.3, 13.8, "rebel7"]];
const UN_C: [number, number, string][] = [[8.3, 9.0, "combine"], [8.3, 11.4, "combine"], [8.3, 13.8, "combine"]];
// 13/10 (pedido dele: a Cidadela em 2D horrível): na linguagem da malha — a cidade em caixas de linhas sobre o vale de
// malha, e no meio a nova Cidadela subindo em anéis e nervuras (a mesma silhueta escalonada e inclinada da Cidadela),
// com a câmera subindo devagar e girando em volta
const CitadelScan: React.FC<{ f: number; grow: number; notHum: number }> = ({ f, grow, notHum }) => {
  const ang = -0.5 + f / 400, R = 80 + 50 * grow, camY = 10 + 22 * grow;
  const cam: V3 = [Math.sin(ang) * R, -Math.cos(ang) * R, camY];
  const tgt: V3 = [0, 0, 8 + 26 * grow];
  const fw = (() => { const d = [tgt[0] - cam[0], tgt[1] - cam[1], tgt[2] - cam[2]]; const L = Math.hypot(d[0], d[1], d[2]); return [d[0] / L, d[1] / L, d[2] / L] as V3; })();
  const rg = (() => { const r = [fw[1], -fw[0], 0]; const L = Math.hypot(r[0], r[1]); return [r[0] / L, r[1] / L, 0] as V3; })();
  const up: V3 = [rg[1] * fw[2] - rg[2] * fw[1], rg[2] * fw[0] - rg[0] * fw[2], rg[0] * fw[1] - rg[1] * fw[0]];
  const pj = (q: V3) => { const d = [q[0] - cam[0], q[1] - cam[1], q[2] - cam[2]]; const z = d[0] * fw[0] + d[1] * fw[1] + d[2] * fw[2]; if (z < 0.5) return null; return { x: 960 + (1100 * (d[0] * rg[0] + d[1] * rg[1] + d[2] * rg[2])) / z, y: 540 - (1100 * (d[0] * up[0] + d[1] * up[1] + d[2] * up[2])) / z }; };
  const L = (a: V3, b: V3, col: string, w: number, o: number, k: string) => { const A = pj(a), B = pj(b); return A && B ? <line key={k} x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke={col} strokeWidth={w} opacity={o} /> : null; };
  const els: React.ReactNode[] = [];
  for (let y = -60; y <= 60; y += 4) {
    const pts = [] as string[];
    for (let x = -60; x <= 60; x += 4) { const q = pj([x, y, 0.4 * Math.sin(x * 0.2 + y * 0.15)]); if (q) pts.push(`${q.x.toFixed(1)},${q.y.toFixed(1)}`); }
    els.push(<polyline key={"g" + y} points={pts.join(" ")} fill="none" stroke="#5ff3d0" strokeWidth={1} opacity={0.18} />);
  }
  // a cidade
  for (let i = 0; i < 46; i++) {
    const a = rnd(i * 3) * Math.PI * 2, r = 12 + rnd(i * 7) * 40;
    const x = Math.cos(a) * r, y = Math.sin(a) * r, h = 3 + rnd(i * 11) * 10, w = 2 + rnd(i * 13) * 2.5;
    const v: V3[] = [[x - w, y - w, 0], [x + w, y - w, 0], [x + w, y + w, 0], [x - w, y + w, 0]];
    for (let k = 0; k < 4; k++) {
      els.push(L(v[k], v[(k + 1) % 4], "#4fb8d8", 1, 0.5, `cb${i}${k}`));
      els.push(L([v[k][0], v[k][1], h], [v[(k + 1) % 4][0], v[(k + 1) % 4][1], h], "#4fb8d8", 1, 0.5, `ct${i}${k}`));
      els.push(L(v[k], [v[k][0], v[k][1], h], "#4fb8d8", 1, 0.4, `cv${i}${k}`));
    }
  }
  // a Cidadela: tronco escalonado, inclinado, com anéis e nervuras
  const H = 70 * grow;
  // a silhueta da Cidadela: base larga, afunila em degraus, a coroa de placas no alto
  const rad = (z: number) => (z < 8 ? 9 - z * 0.3 : 6.6 - (z - 8) * 0.07) - (z > H - 6 ? (z - (H - 6)) * 0.35 : 0);
  for (let k = 0; k < 18; k++) {
    const a0 = (k / 18) * Math.PI * 2;
    els.push(L([Math.cos(a0) * rad(0), Math.sin(a0) * rad(0), 0], [Math.cos(a0) * rad(H) + H * 0.04, Math.sin(a0) * rad(H), H], "#9fe6ff", 1.4, 0.75, "rib" + k));
  }
  for (let z = 0; z < H; z += 4) {
    const ring: V3[] = Array.from({ length: 33 }).map((_, i) => { const a0 = (i / 32) * Math.PI * 2; return [Math.cos(a0) * rad(z) + z * 0.04, Math.sin(a0) * rad(z), z] as V3; });
    for (let i = 0; i < 32; i++) els.push(L(ring[i], ring[i + 1], z % 12 === 0 ? "#dff8ff" : "#9fe6ff", z % 12 === 0 ? 2 : 1, z % 12 === 0 ? 0.9 : 0.5, `rg${z}_${i}`));
  }
  const topQ = pj([H * 0.04, 0, H + 2]);
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 35%, #0a1a24 0%, #03060a 75%)" }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {els}
        {topQ ? <circle cx={topQ.x} cy={topQ.y} r={10 + 4 * Math.sin(f / 6)} fill="#dff8ff" style={{ filter: "drop-shadow(0 0 14px #9fe6ff)" }} /> : null}
        {topQ ? (
          <g>
            <line x1={topQ.x} y1={topQ.y} x2={topQ.x + 180} y2={topQ.y - 60} stroke="#9fe6ff" strokeWidth={1.4} />
            <text x={topQ.x + 190} y={topQ.y - 64} fill="#9fe6ff" fontFamily={MONO} fontSize={22} letterSpacing={6} style={{ paintOrder: "stroke", stroke: "#000", strokeWidth: 5 }}>A NOVA CIDADELA</text>
            <text x={topQ.x + 190} y={topQ.y - 38} fill="#ffe2b0" fontFamily={MONO} fontSize={16} letterSpacing={3} opacity={notHum} style={{ paintOrder: "stroke", stroke: "#000", strokeWidth: 4 }}>NÃO É SÓ UMA CÓPIA FEITA POR HUMANOS</text>
          </g>
        ) : null}
      </svg>
      <AbsoluteFill style={{ boxShadow: "inset 0 0 220px rgba(0,0,0,0.85)", pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};
export const HL13Union: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [citAt, notHumAt, probAt, reactAt, rebuildAt, woundAt, cantAt, filesAt, deadAt, neverAt, seekAt, partAt, alsoAt, neitherAt, humHasAt, combHasAt, alliAt, notForgotAt, sameAt, contAt, centerAt, gmanAt, workAt] = ats(p, ["citAt", "notHumAt", "probAt", "reactAt", "rebuildAt", "woundAt", "cantAt", "filesAt", "deadAt", "neverAt", "seekAt", "partAt", "alsoAt", "neitherAt", "humHasAt", "combHasAt", "alliAt", "notForgotAt", "sameAt", "contAt", "centerAt", "gmanAt", "workAt"]);
  void citAt; void neverAt; void notForgotAt;
  const G = useMemo(() => buildCoreRoom(true), []);
  const inside = f >= probAt - 6;
  const cg = P(f, 0, 140);
  // a câmara: o núcleo → (o sinal sai) → as duas passarelas → a ponte
  const e0 = coreEye(f, { y: keys(f, [[probAt, 3.0], [seekAt, 3.0], [alliAt, 3.4], [life, 3.8]]), yaw: keys(f, [[probAt, 0], [filesAt - 6, 0], [filesAt + 20, -0.35], [deadAt + 40, -0.35], [seekAt, 0], [life, 0]]), pitch: keys(f, [[probAt, 0.04], [seekAt, 0.04], [seekAt + 20, 0.3], [partAt, 0.3], [partAt + 20, 0.04], [life, 0.04]]) });
  const e: Eye = { ...e0, x: e0.x + 0.2 };
  const meet = P(f, alliAt, 50);
  const hx = (x: number) => x + (-0.7 - x) * meet * 0.6;
  const cx = (x: number) => x + (0.7 - x) * meet * 0.6;
  const fail = f >= cantAt && f < seekAt;
  const sig = f >= seekAt && f < partAt + 20;
  const top = proj(e, [-5.9, 8.0, 8.6]);
  return (
    <AbsoluteFill style={{ background: "#03050a", overflow: "hidden" }}>
      {!inside ? (
        <CitadelScan f={f} grow={cg} notHum={f >= notHumAt ? P(f, notHumAt, 8) : 0} />
      ) : (
        <CoreRoom e={e} f={f} G={G} o={{ rings: notches(f >= workAt ? 0.9 + 0.1 * Math.sin(f / 40) : 0.7), ringO: 0.8, wound: 1, arcs: f >= woundAt && f < cantAt ? 0.5 : 0, push: 0.4, hot: 0.4, mL: fail ? (Math.floor(f / 6) % 2 ? 1 : 0.2) : 0.5 + (f >= workAt ? 0.4 : 0), mR: 0.05, beam: 0 }}>
          {/* o sinal subindo pelo duto e voltando */}
          {sig && top ? (() => {
            const b0 = proj(e, [-5.9, 8.0, 1.0]);
            if (!b0) return null;
            const t = ((f - seekAt) / 24) % 1;
            const up = f < partAt;
            const y = up ? b0.y + (top.y - b0.y) * t : top.y + (b0.y - top.y) * t;
            return <circle cx={b0.x + (top.x - b0.x) * (up ? t : 1 - t)} cy={y} r={10} fill={up ? "#9fe6ff" : "#ff8a7a"} style={{ filter: `drop-shadow(0 0 14px ${up ? "#9fe6ff" : "#ff5d4d"})` }} />;
          })() : null}
          {f >= seekAt && f < partAt + 30 ? <Call e={e} f={f} pt={[-5.9, 8.0, 5.0]} from={seekAt + 6} until={partAt + 30} text={f >= partAt ? "ENCONTRAM · COMO PARCEIROS" : "PROCURAM OS COMBINE · FORA DAQUI"} col={f >= partAt ? GREEN : ICE} dx={260} dy={-60} /> : null}
          {/* os humanos (esquerda) e os Combine (direita), indo se encontrar na ponte */}
          {f >= rebuildAt ? UN_H.map(([x, y, w], k) => <Pin key={"h" + k} e={e} x={x} y={y} z={4} h={1.4} col={GREEN} f={f} o={P(f, rebuildAt + k * 6, 10)} who={w} text="HUMANO" />) : null}
          {f >= partAt ? UN_C.map(([x, y], k) => <Pin key={"c" + k} e={e} x={x} y={y} z={4} h={1.4} col="#b8c4cc" f={f} o={P(f, partAt + k * 8, 10)} who="combine" text="COMBINE" />) : null}
          {f >= alliAt && meet > 0.9 ? (() => {
            const a = proj(e, [-0.3, 7.5, 1.0]);
            const b = proj(e, [0.3, 7.5, 1.0]);
            return a && b ? <g opacity={P(f, alliAt + 50, 10)}><line x1={a.x - 60} y1={a.y} x2={b.x + 60} y2={b.y} stroke="#ffd27a" strokeWidth={4} /><text x={(a.x + b.x) / 2} y={a.y - 18} textAnchor="middle" fill="#ffd27a" fontFamily={MONO} fontSize={20} letterSpacing={5}>A ALIANÇA</text></g> : null;
          })() : null}
        </CoreRoom>
      )}
      {/* o console do procedimento */}
      {inside && f >= reactAt && f < seekAt ? (
        <div style={{ position: "absolute", left: 90, top: 140, width: 520, padding: "16px 20px", borderRadius: 10, background: "rgba(14,6,6,0.9)", border: `1.5px solid ${fail ? RED : "#9fe6ff"}`, fontFamily: MONO, color: TXT, opacity: P(f, reactAt, 8) }}>
          <div style={{ fontSize: 15, letterSpacing: 4, color: fail ? RED : "#9fe6ff" }}>BOREALIS · PROCEDIMENTO</div>
          {([["NAVIO REATIVADO", reactAt], ["SISTEMA RECONSTRUÍDO", rebuildAt], ["A FERIDA ALCANÇADA", woundAt]] as [string, number][]).map(([t, t0]) => (f >= t0 ? <div key={t} style={{ marginTop: 8, fontSize: 19, letterSpacing: 2, color: GREEN }}>✓ {t}</div> : null))}
          {f >= cantAt ? <div style={{ marginTop: 10, fontSize: 22, letterSpacing: 2, color: RED }}>✕ COMPLETAR O PROCEDIMENTO · ETAPA DESCONHECIDA</div> : null}
          {f >= filesAt ? <div style={{ marginTop: 12, padding: "8px 10px", background: "#e8dfc6", color: "#2a2418", fontFamily: "'Courier New', monospace", fontSize: 15, opacity: P(f, filesAt, 8) }}>ARQUIVOS J. MOSSMAN · <span style={{ background: "#1a1a1a", color: "#1a1a1a" }}>████████</span> páginas faltando</div> : null}
        </div>
      ) : null}
      {inside && f >= deadAt && f < seekAt ? (
        <div style={{ position: "absolute", right: 120, top: 160, width: 170, padding: 10, borderRadius: 10, background: "rgba(8,8,10,0.88)", border: "1.5px solid #6d747c", fontFamily: MONO, opacity: P(f, deadAt, 8) }}>
          <div style={{ height: 180, borderRadius: 6, backgroundImage: `url(${staticFile("hl3silh/alyx_badge.jpg")})`, backgroundSize: "cover", backgroundPosition: "50% 30%", filter: "grayscale(1) brightness(0.7)" }} />
          <div style={{ fontSize: 14, letterSpacing: 3, color: "#9aa3ab", marginTop: 8 }}>ALYX VANCE · MORTA</div>
          <div style={{ fontSize: 12, letterSpacing: 1, color: "rgba(242,240,247,0.6)", marginTop: 4 }}>O QUE ELA SABIA NUNCA ESTEVE NA TERRA</div>
        </div>
      ) : null}
      {/* o que cada lado tem */}
      {inside && f >= humHasAt && f < sameAt + 30 ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 130, display: "flex", justifyContent: "center", gap: 40, fontFamily: MONO, opacity: 1 - P(f, sameAt + 20, 10) }}>
          <div style={{ padding: "12px 18px", borderLeft: `3px solid ${GREEN}`, background: "rgba(8,10,14,0.85)", fontSize: 20, letterSpacing: 3, color: TXT }}>HUMANIDADE · TEM O BOREALIS</div>
          {f >= combHasAt ? <div style={{ padding: "12px 18px", borderLeft: "3px solid #b8c4cc", background: "rgba(8,10,14,0.85)", fontSize: 20, letterSpacing: 3, color: TXT, opacity: P(f, combHasAt, 8) }}>COMBINE · TÊM O CONHECIMENTO</div> : null}
        </div>
      ) : null}
      {inside && f >= alsoAt && f < humHasAt ? <div style={{ position: "absolute", left: 0, right: 0, top: 130, textAlign: "center", fontFamily: MONO, fontSize: 20, letterSpacing: 4, color: VIO, opacity: P(f, alsoAt, 8) }}>OS COMBINE TAMBÉM QUEREM O CATALISADOR{f >= neitherAt ? " · NENHUM DOS DOIS TEM TUDO SOZINHO" : ""}</div> : null}
      {inside ? <Kin kind="rise" t0={contAt} until={gmanAt} bottom={150} size={70} col="#ffd27a" text="continuar" /> : null}
      {/* o G-Man no fundo, observando */}
      {inside && f >= gmanAt ? <GmanAt e={e} x={0.1} y={9.85} o={P(f, gmanAt, 20)} /> : null}
      {inside && f >= gmanAt && f < workAt ? <div style={{ position: "absolute", left: 0, right: 0, bottom: 150, textAlign: "center", fontFamily: MONO, fontSize: 22, letterSpacing: 5, color: "#cfe8ff", opacity: P(f, gmanAt + 10, 10) }}>O G-MAN OBSERVA · SEM INTERFERIR</div> : null}
      {inside && f >= workAt ? (
        <div style={{ position: "absolute", left: 90, bottom: 130, width: 560, padding: "12px 16px", borderRadius: 10, background: "rgba(6,16,20,0.88)", border: "1.5px solid #9fe6ff", fontFamily: MONO, color: "#9fe6ff", opacity: P(f, workAt, 8) }}>
          <div style={{ fontSize: 14, letterSpacing: 4 }}>HUMANOS + COMBINE · BOREALIS</div>
          {["RECONSTRUINDO OS CÁLCULOS", "TESTANDO NOVAS SEQUÊNCIAS", "PERPETUIDADE · ?"].map((t, k) => <div key={t} style={{ marginTop: 6, fontSize: 18, letterSpacing: 2, color: TXT, opacity: P(f, workAt + 40 + k * 45, 8) }}>▸ {t}</div>)}
        </div>
      ) : null}
      {inside && f < probAt + 10 ? <AbsoluteFill style={{ background: "#000", opacity: 1 - P(f, probAt - 6, 10), pointerEvents: "none" }} /> : null}
      <Hud f={f} yaw={e.yaw} eye={e} blips={[]} msg={inside && fail ? "FALTA UMA ETAPA" : undefined} msgCol={RED} o={inside ? 1 : 0} />
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 1:40:52 a ascensão (a câmara do núcleo)
// os anéis alinham de novo (BOREALIS · NÚCLEO · FERIDA) → o catalisador: o feixe desce até a ferida → nenhuma porta (os
// rótulos riscados) → a energia sobe pela ferida e envolve quem está perto: as bandeiras de humanos, Combine e o Advisor
// perdem o contorno na luz e somem → quem ficou (crachás atrás) com "?" → o que passam a acreditar (carimbos entre aspas) →
// a verdade: o laço dos anéis volta a alinhar, de novo e de novo · A CONVERGÊNCIA CONTINUA INTACTA.
export const HL13Ascend: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [againAt, catAt, noDoorAt, strangeAt, crossAt, envAt, mixAt, fadeAt, goneAt, nobodyAt, proofAt, believeAt, truthAt, neverAt, eventAt, intactAt] = ats(p, ["againAt", "catAt", "noDoorAt", "strangeAt", "crossAt", "envAt", "mixAt", "fadeAt", "goneAt", "nobodyAt", "proofAt", "believeAt", "truthAt", "neverAt", "eventAt", "intactAt"]);
  void againAt; void strangeAt; void proofAt; void believeAt; void truthAt; void neverAt; void eventAt; void intactAt;
  const G = useMemo(() => buildCoreRoom(true), []);
  const align = P(f, 0, 100);
  // 30/10 (ele: a câmara vazia ficava quase um minuto): logo depois que o núcleo se apaga, corta para o que vem depois
  const cutAt = nobodyAt + 45;
  // 30/10 (ele: depois do catalisador o núcleo se extingue; a luz envolve todo mundo e depois ele encolhe e some): o
  // núcleo encolhe enquanto a luz recua e implode num ponto; daí em diante a câmara fica sem ele (sem o feixe repetido)
  const shrink = interpolate(f, [goneAt + 30, goneAt + 100], [0, 1], { ...C, easing: Easing.in(Easing.cubic) });
  const coreK = 1 - shrink;
  const beam = P(f, catAt, 12) * (1 - P(f, goneAt + 30, 30));
  const glow = P(f, crossAt, 30) * (1 - P(f, goneAt + 40, 40));
  const dissolve = P(f, mixAt, 60);
  const gone = P(f, fadeAt, 70);
  const e0 = coreEye(f, { y: keys(f, [[0, 3.6], [envAt, 3.2], [nobodyAt, 2.6], [life, 2.8]]), yaw: 0, pitch: keys(f, [[0, 0.04], [catAt, 0.04], [catAt + 20, -0.1], [envAt, 0.04], [life, 0.04]]), shake: f >= catAt && f < goneAt ? 0.4 : 0 });
  const e: Eye = { ...e0, x: e0.x };
  const near: [number, number, string, string][] = [[-1.8, 7.6, "rebel", GREEN], [-0.7, 7.9, "rebel3", GREEN], [0.8, 7.8, "combine", "#b8c4cc"], [1.9, 7.6, "combine", "#b8c4cc"]];
  const stay: [number, number, string][] = [[-3.4, 5.2, "rebel8"], [3.0, 5.2, "rebel2"]];
  const AS = useAdvScene([{ pos: [3.4, 10.2, 4.2], look: [CORE[0], CORE[1], CORE[2]], reach: 0.6, show: f < fadeAt + 40 }], f, 2.4);
  return (
    <AbsoluteFill style={{ background: "#020304", overflow: "hidden" }}>
      {f < cutAt + 16 ? <>
      <CoreRoom e={e} f={f} G={G} o={{ rings: notches(align), ringO: 1 - shrink, wound: (1 + glow * 1.4) * (1 - 0.6 * shrink), arcs: glow * (1 - shrink), push: 0.9 * (1 - shrink), hot: 0.5 + glow, mL: 0.6, mR: 0.05, beam, coreK, extras: AS.extras, glLights: AS.lights }}>
        {/* o fim do núcleo: o último ponto de luz e uma onda que se fecha */}
        {shrink > 0.85 && f < goneAt + 130 ? (() => {
          const q = proj(e, CORE);
          if (!q) return null;
          const t = P(f, goneAt + 96, 30);
          return (
            <g>
              <circle cx={q.x} cy={q.y} r={6 * (1 - t) + 1} fill="#fffaf0" opacity={1 - t} />
              <circle cx={q.x} cy={q.y} r={40 + 260 * t} fill="none" stroke="#ffe2b0" strokeWidth={3} opacity={0.7 * (1 - t)} />
            </g>
          );
        })() : null}
        {f >= goneAt + 100 && f < nobodyAt + 60 ? (() => {
          const q = proj(e, CORE);
          return q ? <text x={q.x} y={q.y - 40} textAnchor="middle" fill="#cfd6da" fontFamily={MONO} fontSize={20} letterSpacing={5} opacity={P(f, goneAt + 104, 12) * (1 - P(f, nobodyAt + 40, 20))}>O NÚCLEO SE APAGA</text> : null;
        })() : null}
        {/* quem está perto: perde o contorno na luz e some */}
        {near.map(([x, y, w, c], k) => (
          <g key={k} style={{ filter: `blur(${dissolve * 6}px)` }}>
            <Pin e={e} x={x} y={y} h={1.6 + (k % 2) * 0.7} col={c} f={f} o={1 - gone} who={w} text={w === "combine" ? "COMBINE" : "HUMANO"} />
          </g>
        ))}
        {f < goneAt + 60 ? (() => {
          const q = proj(e, [3.4, 10.2, 4.2]);
          return q ? <g opacity={1 - gone} style={{ filter: `blur(${dissolve * 6}px)` }}>{AS.ready ? null : <AdvisorArt x={q.x} y={q.y} w={900 / q.d * 1.4} f={f} lit={0.8} id="asc" />}<text x={q.x + 120} y={q.y - 60} fill={VIO} fontFamily={MONO} fontSize={18} letterSpacing={4}>ADVISOR</text></g> : null;
        })() : null}
        {/* quem ficou olhando */}
        {f >= nobodyAt ? stay.map(([x, y, w], k) => <Pin key={"s" + k} e={e} x={x} y={y} h={1.6} col="#cfe8ff" f={f} o={P(f, nobodyAt + k * 6, 10)} who={w} text="QUEM FICOU" sub="?" />) : null}
      </CoreRoom>
      {glow > 0 ? <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 60%, rgba(255,240,210,${0.55 * glow}), rgba(255,240,210,0) 60%)`, pointerEvents: "none" }} /> : null}
      {/* 12/10 (pedido dele: o desaparecimento mais contínuo): a luz sai do núcleo, cresce até cegar a câmara inteira e
          absorve todo mundo; depois recua devagar e mostra a sala vazia */}
      {(() => {
        const up = interpolate(f, [mixAt, fadeAt + 40], [0, 1], { ...C, easing: Easing.in(Easing.quad) });
        const down = interpolate(f, [goneAt + 10, goneAt + 70], [0, 1], { ...C, easing: Easing.out(Easing.cubic) });
        const k = up * (1 - down);
        if (k <= 0.001) return null;
        const cq = proj(e, CORE);
        const cx = cq ? cq.x : 960, cy = cq ? cq.y : 420;
        const r = 120 + 2200 * k;
        return (
          <AbsoluteFill style={{ pointerEvents: "none" }}>
            <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
              <defs>
                <radialGradient id="ascWhite" cx={cx} cy={cy} r={r} gradientUnits="userSpaceOnUse">
                  <stop offset="0" stopColor="#fffdf6" stopOpacity={Math.min(1, 0.6 + k)} />
                  <stop offset="0.55" stopColor="#fff2d8" stopOpacity={Math.min(1, k * 1.4)} />
                  <stop offset="1" stopColor="#ffe2b0" stopOpacity={0} />
                </radialGradient>
              </defs>
              {/* raios puxados para o núcleo */}
              {Array.from({ length: 28 }).map((_, i) => {
                const a = (i / 28) * Math.PI * 2 + i * 0.37;
                const ph = ((f * 0.02 + i * 0.13) % 1);
                const R0 = 1300 * (1 - ph), R1 = R0 * 0.82;
                return <line key={i} x1={cx + Math.cos(a) * R0} y1={cy + Math.sin(a) * R0} x2={cx + Math.cos(a) * R1} y2={cy + Math.sin(a) * R1} stroke="#fff6e0" strokeWidth={2 + 3 * ph} opacity={0.6 * Math.min(1, k * 2) * (1 - down)} />;
              })}
              <rect width={1920} height={1080} fill="url(#ascWhite)" />
              <rect width={1920} height={1080} fill="#fff8ea" opacity={Math.pow(k, 2.2)} />
            </svg>
          </AbsoluteFill>
        );
      })()}
      {/* nenhuma porta */}
      {f >= noDoorAt && f < crossAt ? (
        <div style={{ position: "absolute", left: 90, top: 140, fontFamily: MONO }}>
          {["UMA PORTA", "UM CAMINHO VISÍVEL", "UMA DIMENSÃO SUPERIOR", "UMA RESPOSTA"].map((t, k) => (
            <div key={t} style={{ marginTop: 8, padding: "6px 12px", background: "rgba(8,10,14,0.85)", fontSize: 20, letterSpacing: 3, color: "rgba(242,240,247,0.7)", position: "relative", opacity: P(f, noDoorAt + k * 25, 8) }}>
              {t}
              <span style={{ position: "absolute", left: 6, right: 6, top: "50%", height: 3, background: RED, transform: `scaleX(${P(f, noDoorAt + k * 25 + 10, 8)})`, transformOrigin: "0 50%" }} />
            </div>
          ))}
        </div>
      ) : null}
      <Hud f={f} yaw={e.yaw} eye={e} blips={[]} msg={f < catAt ? "O ALINHAMENTO · DE NOVO" : f < noDoorAt ? "O CATALISADOR ACONTECE" : f >= mixAt && f < nobodyAt ? "AS FORMAS SE MISTURAM COM A LUZ" : undefined} msgCol="#ffd27a" o={1 - glow * 0.6} />
      </> : null}
      {f >= cutAt ? <AbsoluteFill style={{ opacity: P(f, cutAt, 16) }}><HL13AscAfter {...p} cutAt={cutAt} /></AbsoluteFill> : null}
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 1:43:23 a humanidade deixa a Terra (antes do corte do bonde)
// a Terra de cima, a nova Cidadela no limbo do planeta: as naves da nova União (humanos + Combine, os dois crachás nas
// laterais) sobem em fila até o anel do catalisador e atravessam · "a linha chegou exatamente onde precisava" · corte.
// Depois do corte, o bonde de Black Mesa (HLTramEnding, footage aprovado) segue igual.
export const HL13Leave: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [leaveAt, workAt, reachAt, cutAt] = ats(p, ["leaveAt", "workAt", "reachAt", "cutAt"]);
  const ships = Array.from({ length: 14 }).map((_, i) => {
    const t0 = leaveAt + i * 16;
    const u = Math.max(0, Math.min(1, (f - t0) / 150));
    const x = 960 + (rnd(i * 3.3) - 0.5) * 900 * (1 - u) + (rnd(i * 7.1) - 0.5) * 40 * u;
    const y = 900 - u * 700;
    return { x, y, s: 1 - 0.75 * u, o: f >= t0 ? (u >= 0.98 ? 0 : 1) : 0, comb: i % 2 === 1 };
  });
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {f >= cutAt ? <HLTramEnding {...(p as unknown as Record<string, number>)} life={life} /> : (
        <AbsoluteFill style={{ opacity: 1 - P(f, cutAt - 10, 10) }}>
          <svg width={1920} height={1080}>
            {/* 12/10 (do 1:17 ao fim refeito): a Terra de verdade vista da órbita — oceano com terminador, continentes,
                nuvens, as luzes das cidades no lado noturno, a atmosfera; a nova Cidadela subindo do horizonte; as naves
                (cargueiros humanos e naves Combine) em silhueta com propulsores, subindo em fila para o anel */}
            <defs>
              <radialGradient id="lvOcean" cx="0.32" cy="0.18" r="0.9"><stop offset="0" stopColor="#4f86b8" /><stop offset="0.45" stopColor="#1d4a78" /><stop offset="0.75" stopColor="#0c2240" /><stop offset="1" stopColor="#040a16" /></radialGradient>
              <linearGradient id="lvNight" x1="0" y1="0" x2="1" y2="0"><stop offset="0.5" stopColor="rgba(2,4,10,0)" /><stop offset="0.72" stopColor="rgba(2,4,10,0.75)" /><stop offset="1" stopColor="rgba(2,4,10,0.95)" /></linearGradient>
              <radialGradient id="lvAtmo" cx="0.5" cy="1.0" r="0.62"><stop offset="0.86" stopColor="rgba(120,190,255,0)" /><stop offset="0.93" stopColor="rgba(140,205,255,0.55)" /><stop offset="1" stopColor="rgba(140,205,255,0)" /></radialGradient>
              <radialGradient id="lvRing" cx="0.5" cy="0.5" r="0.5"><stop offset="0.6" stopColor="rgba(255,210,122,0)" /><stop offset="0.85" stopColor="rgba(255,210,122,0.5)" /><stop offset="1" stopColor="rgba(255,210,122,0)" /></radialGradient>
              <clipPath id="lvDisc"><ellipse cx={960} cy={1760} rx={1560} ry={980} /></clipPath>
              <filter id="lvSoft"><feGaussianBlur stdDeviation="6" /></filter>
              <filter id="lvGlow"><feGaussianBlur stdDeviation="3" /></filter>
            </defs>
            {Array.from({ length: 220 }).map((_, i) => <circle key={i} cx={rnd(i) * 1920} cy={rnd(i * 3) * 760} r={0.5 + rnd(i * 5) * 1.4} fill="#fff" opacity={0.25 + 0.6 * rnd(i * 7)} />)}
            {/* a atmosfera em volta */}
            <ellipse cx={960} cy={1760} rx={1640} ry={1060} fill="url(#lvAtmo)" />
            <g clipPath="url(#lvDisc)">
              <ellipse cx={960} cy={1760} rx={1560} ry={980} fill="url(#lvOcean)" />
              {/* continentes (manchas irregulares) */}
              {[[520, 880, 260, 70, -0.1], [820, 840, 180, 46, 0.15], [1180, 900, 300, 80, -0.05], [1480, 860, 160, 50, 0.2], [300, 960, 200, 60, 0.1], [980, 960, 240, 50, 0]].map(([x, y, rx, ry, r], i) => (
                <g key={i} transform={`rotate(${(r as number) * 57} ${x} ${y})`}>
                  <ellipse cx={x} cy={y} rx={rx} ry={ry} fill="#4e6a3e" opacity={0.85} />
                  <ellipse cx={(x as number) + (rx as number) * 0.3} cy={(y as number) - (ry as number) * 0.2} rx={(rx as number) * 0.55} ry={(ry as number) * 0.6} fill="#7a7048" opacity={0.7} />
                </g>
              ))}
              {/* nuvens */}
              {Array.from({ length: 26 }).map((_, i) => <ellipse key={i} cx={(rnd(i * 9) * 2000 + f * 0.15) % 2000 - 40} cy={810 + rnd(i * 4) * 230} rx={60 + rnd(i) * 140} ry={10 + rnd(i * 2) * 16} fill="#e8f0f6" opacity={0.35 + 0.3 * rnd(i * 6)} filter="url(#lvSoft)" />)}
              {/* o lado da noite e as luzes das cidades */}
              <rect x={0} y={700} width={1920} height={400} fill="url(#lvNight)" />
              {Array.from({ length: 140 }).map((_, i) => {
                const x = 1250 + rnd(i * 11) * 640, y = 800 + rnd(i * 13) * 260;
                return <circle key={"c" + i} cx={x} cy={y} r={0.8 + rnd(i) * 1.6} fill="#ffd28a" opacity={0.5 + 0.5 * rnd(i * 3)} />;
              })}
            </g>
            <ellipse cx={960} cy={1760} rx={1560} ry={980} fill="none" stroke="rgba(170,215,255,0.8)" strokeWidth={3} filter="url(#lvGlow)" />
            {/* a nova Cidadela, uma lâmina subindo do horizonte, com as faixas acesas */}
            <path d="M 930 790 L 950 600 L 958 560 L 966 600 L 990 790 Z" fill="#141a20" stroke="#9fe6ff" strokeWidth={1.5} />
            {[640, 680, 720, 760].map((y) => <line key={y} x1={950 - (y - 600) * 0.1} y1={y} x2={968 + (y - 600) * 0.12} y2={y} stroke="#5ff3ff" strokeWidth={2} opacity={0.8} />)}
            {/* o anel do catalisador lá em cima */}
            <ellipse cx={960} cy={190} rx={260 + 10 * Math.sin(f / 9)} ry={70} fill="url(#lvRing)" stroke="#ffd27a" strokeWidth={4} opacity={P(f, leaveAt, 20)} />
            {ships.map((s, i) => (s.o ? (
              <g key={i} transform={`translate(${s.x} ${s.y}) scale(${s.s * 1.3})`}>
                {/* o rastro do propulsor */}
                <path d={`M -4 18 L 0 ${60 + 20 * rnd(i + Math.floor(f / 3))} L 4 18 Z`} fill={s.comb ? "rgba(159,230,255,0.55)" : "rgba(255,178,46,0.6)"} filter="url(#lvGlow)" />
                {s.comb ? (
                  // nave Combine: lâmina com nervuras e a luz ciano
                  <g>
                    <path d="M 0 -34 L 10 -8 L 18 14 L 6 10 L 0 18 L -6 10 L -18 14 L -10 -8 Z" fill="#1c2228" stroke="#6f8796" strokeWidth={1.4} />
                    <path d="M 0 -26 L 0 12 M -9 0 L 9 0" stroke="#5ff3ff" strokeWidth={1.6} />
                  </g>
                ) : (
                  // cargueiro humano: casco com asas curtas, janelas e o motor
                  <g>
                    <path d="M -8 -30 Q 0 -40 8 -30 L 10 12 L 22 18 L 10 20 L 6 24 L -6 24 L -10 20 L -22 18 L -10 12 Z" fill="#5a5850" stroke="#cfc6ae" strokeWidth={1.4} />
                    {[-18, -10, -2].map((y) => <rect key={y} x={-3} y={y} width={6} height={4} fill="#ffd28a" />)}
                  </g>
                )}
                <circle cx={0} cy={20} r={4} fill={s.comb ? "#9fe6ff" : "#ffb22e"} />
              </g>
            ) : null))}
          </svg>
          {/* quem vai: os dois crachás */}
          {f >= leaveAt ? (
            <div style={{ position: "absolute", left: 90, top: 330, display: "flex", flexDirection: "column", gap: 14, opacity: P(f, leaveAt, 10) }}>
              {[["hl3silh/rebelde_badge.jpg", "HUMANIDADE", GREEN], ["hl3silh/combine_badge.jpg", "COMBINE", "#b8c4cc"]].map(([img, n, c]) => (
                <div key={n} style={{ display: "flex", alignItems: "center", gap: 12, padding: 8, borderRadius: 10, background: "rgba(8,8,10,0.85)", border: `1.5px solid ${c}`, fontFamily: MONO, fontSize: 16, letterSpacing: 3, color: c }}>
                  <div style={{ width: 70, height: 86, borderRadius: 6, backgroundImage: `url(${staticFile(img)})`, backgroundSize: "cover", backgroundPosition: "50% 30%" }} />
                  {n}
                </div>
              ))}
            </div>
          ) : null}
          <div style={{ position: "absolute", left: 0, right: 0, top: 290, textAlign: "center", fontFamily: MONO }}>
            {f >= leaveAt ? <div style={{ fontSize: 24, letterSpacing: 6, color: "#f2efe6", opacity: P(f, leaveAt, 10) }}>A HUMANIDADE DEIXA A TERRA PARA TRÁS</div> : null}
            {f >= workAt ? <div style={{ fontSize: 18, letterSpacing: 4, color: "#ffd27a", marginTop: 10, opacity: P(f, workAt, 10) }}>QUEM VENCEU OS COMBINE PASSOU A TRABALHAR COM ELES</div> : null}
            {f >= reachAt ? <div style={{ fontSize: 18, letterSpacing: 4, color: GREEN, marginTop: 8, opacity: P(f, reachAt, 10) }}>A LINHA CHEGOU EXATAMENTE ONDE PRECISAVA</div> : null}
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

// ================================================================================================= MÓDULO 14 · leva A (final 2 · A Névoa)
// painel de rádio do HEV: um crachá falando (a onda de voz) — usado no colapso (Kleiner, Eli) e na fuga (Barney, Kleiner, Magnusson)
export const RadioCard: React.FC<{ f: number; at: number; until?: number; img?: string; name: string; text: string; col: string; x?: number; y?: number; mute?: boolean }> = ({ f, at: t0, until = 1e9, img, name, text, col, x = 90, y = 140, mute }) => {
  if (f < t0 || f >= until) return null;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: 500, display: "flex", gap: 14, padding: 12, borderRadius: 12, background: "rgba(10,8,4,0.9)", border: `1.5px solid ${col}`, fontFamily: MONO, opacity: P(f, t0, 8) * (1 - P(f, until - 8, 8)), transform: `translateX(${(1 - P(f, t0, 12)) * -50}px)` }}>
      <div style={{ flex: "0 0 92px", height: 112, borderRadius: 8, border: `1px solid ${col}`, background: "#0a0612", backgroundImage: img ? `url(${staticFile(img)})` : undefined, backgroundSize: "cover", backgroundPosition: "50% 30%", display: "flex", alignItems: "center", justifyContent: "center", color: col, fontSize: 34, fontFamily: FONT, fontWeight: 800 }}>{img ? null : name[0]}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, letterSpacing: 4, color: col }}>RÁDIO · {name}</div>
        <svg width={360} height={34} style={{ marginTop: 6 }}>
          {Array.from({ length: 45 }).map((_, k) => {
            const h = mute ? 2 : Math.max(2, 30 * Math.abs(Math.sin(k * 0.7 + f / 3)) * (0.4 + 0.6 * rnd(k + Math.floor(f / 3))));
            return <rect key={k} x={k * 8} y={17 - h / 2} width={5} height={h} fill={col} opacity={0.85} />;
          })}
        </svg>
        <div style={{ fontSize: 19, letterSpacing: 2, color: TXT, marginTop: 4, lineHeight: 1.3 }}>{text}</div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- 1:44:02 o colapso (câmara do núcleo)
// a Alyx não hesita: volta ao núcleo e prepara a sequência (bandeira dela na plataforma) → o Gordon nos controles físicos: a
// câmera vira para a direita, a ALAVANCA DO BRAÇO laranja (o mecanismo do colapso, aprovado no módulo 12) desce → o núcleo
// é empurrado contra a ferida (a esfera de luz desce pelo poço) → a última peça → o Borealis morre: setores somem e voltam
// (a sala pisca de fase), rachaduras na tela (o gelo), destroços flutuando (a gravidade falha) → rádio do Kleiner: a ferida
// está se fechando · a Terra vai junto → rádio do Eli, mudo por segundos → "Alyx."
export const HL14Collapse: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [noHesAt, seqAt, contraAt, mechAt, colAt, pieceAt, dieAt, hullAt, iceAt, gravAt, kleinerAt, earthAt, eliAt, alyxAt] = ats(p, ["noHesAt", "seqAt", "contraAt", "mechAt", "colAt", "pieceAt", "dieAt", "hullAt", "iceAt", "gravAt", "kleinerAt", "earthAt", "eliAt", "alyxAt"]);
  const G = useMemo(() => buildCoreRoom(true), []);
  const yaw = keys(f, [[0, 0], [mechAt - 8, 0], [mechAt + 20, 0.62], [colAt + 30, 0.62], [colAt + 60, 0], [life, 0]]);
  const dying = f >= dieAt;
  const shake = dying ? 0.5 + 0.5 * P(f, gravAt, 60) : f >= colAt ? 0.3 : 0.08;
  const e = coreEye(f, { y: 3.2, yaw, pitch: keys(f, [[0, 0.04], [colAt + 60, 0.04], [colAt + 90, -0.05], [life, -0.05]]), shake });
  const lever = P(f, colAt - 4, 20);
  const sink = P(f, colAt + 10, 120);
  const phase = dying && rnd(Math.floor(f / 4) * 7) > 0.72;
  const cq = proj(e, [CORE[0], CORE[1], CORE[2] - sink * (CORE[2] - PIT_Z - 0.4)]);
  const lev = proj(e, [MECH_R[0], MECH_R[1], MECH_R[2] - lever * 0.5]);
  // 31/10 (ele: "só fica uma grande parte do vídeo pulsando"): de "em vez de redirecionar a energia" em diante, os planos
  // próprios de cada trecho (hl3r24); a câmara do núcleo fica só no começo, até o Gordon nos controles e a Alyx no alinhamento
  const planAt = at(p, "planAt");
  if (f >= planAt + 14) return <HL14ColAfter {...p} />;
  return (
    <AbsoluteFill style={{ background: "#020304", overflow: "hidden" }}>
      {f >= planAt ? <AbsoluteFill style={{ zIndex: 5, opacity: P(f, planAt, 14) }}><HL14ColAfter {...p} /></AbsoluteFill> : null}
      <CoreRoom e={e} f={f} G={G} o={{ rings: notches(0.95), ringO: 1 - 0.6 * sink, wound: 1.2 + sink * 1.2, arcs: f >= contraAt ? 0.4 + sink : 0, push: 0, hot: 0.4 + sink, mL: 0.2, mR: f >= mechAt ? 0.6 + 0.4 * lever : 0.2, beam: 0, spin: f / 400 * (1 + 4 * sink) }}>
        <FlagAt e={e} pt={[-0.5, 7.0, 0]} label="ALYX" col={ORANGE} f={f} o={P(f, noHesAt - 10, 10)} sub={f >= pieceAt && f < dieAt + 30 ? "ENCAIXA A ÚLTIMA PEÇA" : f >= seqAt ? "PREPARA A SEQUÊNCIA" : "NÃO HESITA"} />
        {f >= mechAt && lev ? (
          <g opacity={P(f, mechAt, 10)}>
            <rect x={lev.x - 10} y={lev.y - 60} width={20} height={70} fill="#ff8a3c" stroke="#3a1a08" strokeWidth={3} />
            <circle cx={lev.x} cy={lev.y - 66} r={14} fill="#ffb066" stroke="#3a1a08" strokeWidth={3} />
          </g>
        ) : null}
        {f >= mechAt && f < colAt + 40 ? <Call e={e} f={f} pt={MECH_R} from={mechAt + 6} until={colAt + 40} text="OS CONTROLES FÍSICOS" sub="O BRAÇO QUE SEGURA O NÚCLEO" col={ORANGE} dx={-320} dy={-220} /> : null}
        {/* o núcleo descendo contra a ferida */}
        {f >= colAt && cq ? (
          <g>
            <circle cx={cq.x} cy={cq.y} r={70 + 20 * Math.sin(f / 3)} fill="rgba(255,190,110,0.35)" style={{ filter: "blur(10px)" }} />
            <circle cx={cq.x} cy={cq.y} r={26} fill="#fff1d0" style={{ filter: "drop-shadow(0 0 30px #ffb066)" }} />
          </g>
        ) : null}
        {f >= contraAt && f < colAt ? <Call e={e} f={f} pt={[CORE[0], 14.8, PIT_Z + 0.1]} from={contraAt} until={colAt} text="O CONTRÁRIO" sub="O NÚCLEO CONTRA A PRÓPRIA FERIDA" col={RED} dx={260} dy={-120} /> : null}
        {/* a gravidade falha: destroços subindo */}
        {f >= gravAt
          ? Array.from({ length: 26 }).map((_, i) => {
              const up = ((f - gravAt) * (0.004 + rnd(i) * 0.006)) % 4;
              const q = proj(e, [-5 + rnd(i * 3) * 10, 4 + rnd(i * 7) * 8, rnd(i * 5) * 1.2 + up]);
              return q ? <rect key={i} x={q.x} y={q.y} width={Math.max(3, 40 / q.d)} height={Math.max(2, 24 / q.d)} fill="#3a3e46" stroke="#6a7078" strokeWidth={1} transform={`rotate(${(f + i * 30) % 360} ${q.x} ${q.y})`} /> : null;
            })
          : null}
      </CoreRoom>
      {phase ? <AbsoluteFill style={{ background: "rgba(150,110,255,0.2)", mixBlendMode: "screen", pointerEvents: "none" }} /> : null}
      {/* o gelo racha: rachaduras pela tela */}
      {f >= iceAt ? (
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          {[[200, 0, 520, 380, 470, 620], [1720, 1080, 1440, 760, 1500, 540], [1920, 200, 1600, 330, 1520, 520]].map((c, k) => (
            <polyline key={k} points={`${c[0]},${c[1]} ${c[2]},${c[3]} ${c[4]},${c[5]}`} fill="none" stroke="rgba(220,240,255,0.7)" strokeWidth={2.5} pathLength={1} strokeDasharray={`${P(f, iceAt + k * 6, 20)} 1`} />
          ))}
        </svg>
      ) : null}
      {f >= hullAt && f < iceAt + 20 ? <div style={{ position: "absolute", left: 0, right: 0, top: 120, textAlign: "center", fontFamily: MONO, fontSize: 22, letterSpacing: 6, color: VIO, opacity: P(f, hullAt, 8) }}>SEM EXPLOSÃO · SETORES SOMEM E VOLTAM EM ESTADOS DIFERENTES</div> : null}
      <RadioCard f={f} at={kleinerAt} until={eliAt} img="hl3silh/kleiner_retrato.png" name="DR. KLEINER" text={f >= earthAt ? "…não está se fechando sozinha. A Terra está indo junto." : "A ferida… está finalmente se fechando!"} col={f >= earthAt ? RED : ICE} />
      <RadioCard f={f} at={eliAt} img="hl3silh/eli_retrato.png" name="ELI VANCE" text={f >= alyxAt ? "“Alyx.”" : "…"} col={AMB} mute={f < alyxAt} />
      <Hud f={f} yaw={e.yaw} eye={e} blips={[{ x: -0.5, y: 7.0, hot: true }]} msg={f >= dieAt && f < hullAt ? "O BOREALIS COMEÇA A MORRER" : f >= colAt && f < dieAt ? "O NÚCLEO CONTRA A FERIDA" : undefined} msgCol={RED} />
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 1:45:11 a fuga (POV no corredor, o final é jogável)
// o corredor do navio se desmontando (pisca de fase, pedaços faltando) com a câmera correndo; o painel de objetivos do HEV
// muda um por vez e cada objetivo falha; os rádios: Barney (evacuação), Kleiner (rotas de segundos), Magnusson (o foguete).
export const HL14Escape: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [playAt, unravelAt, barneyAt, kleinerAt, magAt, o1At, o2At, o3At, o4At, failAt, notLostAt] = ats(p, ["playAt", "unravelAt", "barneyAt", "kleinerAt", "magAt", "o1At", "o2At", "o3At", "o4At", "failAt", "notLostAt"]);
  const H = useMemo(() => buildShipHall2(160), []);
  const run = f >= playAt;
  const y = 1 + (run ? (f - playAt) * 0.06 : 0);
  const e: Eye = { x: 0.15 * Math.sin(f / 9), y, z: 1.6 + (run ? 0.05 * Math.abs(Math.sin(f / 4)) : 0), yaw: 0.04 * Math.sin(f / 23), pitch: -0.03, F: 960 };
  const un = P(f, unravelAt, 60);
  const flick = un > 0 && rnd(Math.floor(f / 3) * 11) > 0.75;
  // 12/10 (pedido dele: a mesma falha de fase de antes, não buracos pretos): as chapas das paredes e do teto se degradam,
  // se afastam e, no pico, viram só a aresta violeta — atrás delas o vazio estrelado
  const phased = H.map((fc) => {
    if (un <= 0) return fc;
    const cx = fc.p.reduce((s2, q) => s2 + q[0], 0) / fc.p.length;
    const cy = fc.p.reduce((s2, q) => s2 + q[1], 0) / fc.p.length;
    const cz = fc.p.reduce((s2, q) => s2 + q[2], 0) / fc.p.length;
    if (fc.tag === "floor" || (Math.abs(cx) < 1.85 && cz < 2.9)) return fc;
    const gid = Math.floor(cy / 1.5) * 2 + (cx > 0 ? 1 : 0) + (cz > 2.9 ? 7 : 0);
    const ph = Math.max(0, Math.sin((f - unravelAt) / 34 + gid * 2.1)) * un * (rnd(gid * 7) > 0.4 ? 1 : 0);
    if (ph <= 0.01) return fc;
    const nx = cz > 2.9 ? 0 : Math.sign(cx), nz = cz > 2.9 ? 1 : 0;
    const tilt = ph * 0.18 * (rnd(gid) - 0.5);
    const pp = fc.p.map((q) => [q[0] + nx * ph * 0.3 + tilt * (q[2] - cz), q[1] + tilt * 0.4, q[2] + nz * ph * 0.3 - ph * 0.05] as V3);
    const k = 1 - 0.45 * ph;
    if (ph > 0.72) return { ...fc, p: pp, nofill: true, edge: [170, 120, 240] as RGB };
    return { ...fc, p: pp, col: [fc.col[0] * k + 34 * ph, fc.col[1] * k + 14 * ph, fc.col[2] * k] as RGB };
  });
  const objs: [string, number][] = [["CHEGAR ATÉ A SAÍDA", o1At], ["ALCANÇAR UM PONTO DE EVACUAÇÃO", o2At], ["MANTER UM CORREDOR ABERTO", o3At], ["ESPERAR A NAVE", o4At]];
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, #1a1028 0%, #07050c 60%, #020204 100%)", overflow: "hidden" }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {Array.from({ length: 70 }).map((_, i) => <circle key={i} cx={rnd(i) * 1920} cy={rnd(i * 3) * 1080} r={1 + rnd(i * 7) * 2} fill="#c79bff" opacity={0.25 + 0.25 * Math.sin(f / 20 + i)} />)}
      </svg>
      <XView e={e} faces={phased} lights={Array.from({ length: 30 }).map((_, i) => 1.5 + i * 3).filter((ly) => ly > y - 3 && ly < y + 18).map((ly) => ({ x: 0, y: ly, z: 2.9, col: (flick ? [199, 155, 255] : [255, 232, 196]) as RGB, k: 1.0, r: 4.6 }))} flash={0.35} amb={0.13} seam="rgba(0,0,0,0.18)" gl smooth />
      {flick ? <AbsoluteFill style={{ background: "rgba(150,110,255,0.14)", pointerEvents: "none" }} /> : null}
      <RadioCard f={f} at={barneyAt} until={kleinerAt} img="hl3silh/barney_badge.jpg" name="BARNEY" text="Evacuação! Todo mundo pros veículos!" col={AMB} />
      <RadioCard f={f} at={kleinerAt} until={magAt} img="hl3silh/kleiner_retrato.png" name="DR. KLEINER" text={`Rota válida por ${Math.max(0, (6 - (f - kleinerAt) / 30)).toFixed(1)} s…`} col={ICE} />
      <RadioCard f={f} at={magAt} until={o1At} img="hl3silh/magnusson_badge.jpg" name="MAGNUSSON" text="Os sistemas do foguete de White Forest… ainda deve haver um jeito!" col={GREEN} />
      {f >= o1At ? (
        <div style={{ position: "absolute", right: 90, top: 130, width: 520, padding: "16px 20px", borderRadius: 12, background: "rgba(14,10,4,0.88)", border: `1.5px solid ${AMB}`, fontFamily: MONO, opacity: P(f, o1At, 8) }}>
          <div style={{ fontSize: 15, letterSpacing: 4, color: AMB }}>H.E.V. · OBJETIVOS</div>
          {objs.map(([t, t0], k) => {
            const failed = f >= (k < 3 ? objs[k + 1][1] : failAt);
            return f >= t0 ? (
              <div key={t} style={{ marginTop: 10, padding: "8px 12px", borderLeft: `3px solid ${failed ? RED : AMB}`, background: failed ? "rgba(40,6,6,0.6)" : "rgba(30,20,4,0.6)", fontSize: 19, letterSpacing: 2, color: failed ? "rgba(242,240,247,0.5)" : TXT, display: "flex", justifyContent: "space-between", opacity: P(f, t0, 6) }}>
                <span style={{ textDecoration: failed ? "line-through" : undefined }}>{t}</span>
                {failed ? <span style={{ color: RED }}>FALHOU</span> : null}
              </div>
            ) : null;
          })}
        </div>
      ) : null}
      
      <Hud f={f} yaw={e.yaw} eye={e} blips={[]} msg={f >= playAt && f < barneyAt ? "O FINAL INTEIRO É JOGÁVEL" : undefined} msgCol={GREEN} />
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 1:45:53 o Ártico se desfaz (a tundra de fora)
// a tundra à noite com o Borealis ao fundo piscando: placas de gelo sobem devagar, ilhas de Xen arrancadas da Terra sobem
// junto (rocha com torres), formigas-leão saem dos ninhos e não atacam, headcrabs fogem, soldados Combine parados, sem alvo;
// "tudo com medo da mesma coisa".
const ARC_CHUNKS = Array.from({ length: 16 }).map((_, i) => ({ x: 80 + rnd(i * 3.1) * 1760, w: 60 + rnd(i * 5.3) * 180, h: 18 + rnd(i * 7.7) * 30, sp: 0.5 + rnd(i * 2.2), d: rnd(i * 9.1) * 40 }));
export const HL14Arctic: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [startAt, iceAt, xenAt, creatAt, combAt, fearAt] = ats(p, ["startAt", "iceAt", "xenAt", "creatAt", "combAt", "fearAt"]);
  void startAt;
  const flick = rnd(Math.floor(f / 5) * 3) > 0.7;
  const crit = (src: string, ar: number, x: number, y: number, h: number, t0: number, vx: number, flip = false) => {
    if (f < t0) return null;
    const dx = (f - t0) * vx;
    return <image key={src + x} href={staticFile(src)} x={x + dx} y={y - h - Math.abs(Math.sin((f - t0) / 3)) * 4} width={h * ar} height={h} transform={flip ? `translate(${2 * (x + dx) + h * ar} 0) scale(-1 1)` : undefined} style={{ filter: "drop-shadow(0 0 4px rgba(200,220,255,0.6))" }} opacity={P(f, t0, 8)} />;
  };
  return (
    <AbsoluteFill style={{ background: "#05070c", overflow: "hidden" }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="arSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0a0e1a" /><stop offset="0.7" stopColor="#2a2240" /><stop offset="1" stopColor="#4a3a5a" /></linearGradient>
        </defs>
        <rect width={1920} height={1080} fill="url(#arSky)" />
        {Array.from({ length: 120 }).map((_, i) => <circle key={i} cx={rnd(i) * 1920} cy={rnd(i * 3) * 500} r={0.6 + rnd(i * 5) * 1.3} fill="#fff" opacity={0.3 + 0.4 * rnd(i * 7)} />)}
        {/* o céu se desfazendo: faixas de luz */}
        {Array.from({ length: 5 }).map((_, k) => <path key={k} d={`M 0 ${140 + k * 60} Q 960 ${80 + k * 60 + 40 * Math.sin(f / 30 + k)} 1920 ${150 + k * 60}`} fill="none" stroke="rgba(199,155,255,0.25)" strokeWidth={10} style={{ filter: "blur(6px)" }} />)}
        {/* o Borealis ao fundo, piscando */}
        <g transform="translate(1180 560) scale(0.5)" opacity={flick ? 0.25 : 0.9}><ShipProfile stroke="#3a3038" fill="#5a3630" rust={0.4} /></g>
        {/* o gelo */}
        <path d="M 0 700 L 1920 680 L 1920 1080 L 0 1080 Z" fill="#c8d6e4" />
        <path d="M 0 700 L 1920 680" stroke="#8aa0b8" strokeWidth={3} />
        {/* placas de gelo subindo */}
        {ARC_CHUNKS.map((c, i) => {
          const up = f >= iceAt + c.d ? (f - iceAt - c.d) * c.sp * 0.4 : 0;
          return <polygon key={i} points={`${c.x},${760 - up} ${c.x + c.w},${752 - up} ${c.x + c.w * 0.9},${760 + c.h - up} ${c.x + c.w * 0.1},${764 + c.h - up}`} fill="#dbe6f0" stroke="#7d93ab" strokeWidth={2} opacity={f >= iceAt + c.d ? 1 : 0} />;
        })}
        {/* ilhas de Xen arrancadas, com as torres */}
        {f >= xenAt
          ? [[420, 1.0], [980, 1.4], [1540, 0.8]].map(([x, s], k) => {
              const up = (f - xenAt - k * 10) * 0.7;
              if (up < 0) return null;
              return (
                <g key={k} transform={`translate(${x} ${800 - up}) scale(${s})`}>
                  <path d="M -90 0 L 90 0 L 50 50 L 0 110 L -50 50 Z" fill="#5c4a3a" stroke="#3a2a1e" strokeWidth={3} />
                  <path d="M -90 0 L 90 0 L 80 -10 L -80 -10 Z" fill="#6a7a50" />
                  {[-40, 0, 45].map((dx, j) => <path key={j} d={`M ${dx - 6} -10 L ${dx} ${-80 - j * 20} L ${dx + 6} -10 Z`} fill="#5a6a4e" stroke="#3a4a30" strokeWidth={2} />)}
                  {[-40, 0, 45].map((dx, j) => <circle key={"c" + j} cx={dx} cy={-84 - j * 20} r={5} fill="#cfe8ff" style={{ filter: "drop-shadow(0 0 8px #cfe8ff)" }} />)}
                </g>
              );
            })
          : null}
        {/* as criaturas fugindo, sem atacar */}
        {crit("hl3silh/antlion_silh.png", 449 / 528, 120, 860, 150, creatAt, 3.2)}
        {crit("hl3silh/antlion_silh.png", 449 / 528, 300, 900, 120, creatAt + 10, 3.6)}
        {crit("hl3silh/headcrab_silh.png", 471 / 516, 1500, 940, 70, creatAt + 30, -4.0, true)}
        {crit("hl3silh/headcrab_silh.png", 471 / 516, 1650, 980, 60, creatAt + 40, -4.6, true)}
        {crit("hl3silh/houndeye_silh.png", 766 / 864, 700, 880, 110, creatAt + 20, 2.4)}
      </svg>
      {/* os Combine que restam: parados, sem saber contra quem lutar */}
      {f >= combAt ? (
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          {[1100, 1260].map((x, k) => (
            <g key={k} opacity={P(f, combAt + k * 8, 10)}>
              <line x1={x} y1={1000} x2={x} y2={830} stroke="#b8c4cc" strokeWidth={2} />
              <FlagBadge cx={x} by={830} k={0.9} label="COMBINE" col="#b8c4cc" f={f} photo="hl3silh/combine_badge.jpg" sub={k === 1 ? "SEM ALVO" : undefined} />
            </g>
          ))}
        </svg>
      ) : null}
      <div style={{ position: "absolute", left: 90, top: 110, fontFamily: MONO }}>
        {([[iceAt, "O GELO DEIXA O CHÃO", ICE], [xenAt, "FRAGMENTOS DE XEN ARRANCADOS DA TERRA", ORANGE], [creatAt, "AS CRIATURAS FOGEM · NINGUÉM ATACA", GREEN], [combAt, "OS COMBINE NÃO SABEM CONTRA QUEM LUTAR", "#b8c4cc"]] as [number, string, string][]).map(([t0, s, c]) => (f >= t0 ? <div key={s} style={{ marginTop: 10, padding: "8px 14px", background: "rgba(8,10,14,0.82)", borderLeft: `3px solid ${c}`, fontSize: 20, letterSpacing: 3, color: TXT, opacity: P(f, t0, 8) }}>{s}</div> : null))}
      </div>
      <Kin kind="light" t0={fearAt} bottom={120} size={52} col="#bfe6ff" text="tudo com medo da mesma coisa" />
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 1:46:19 o Varga na neve (POV, a fuga passa por ele)
// a neve e o céu se dobrando; a bandeira do Varga parada, os arquivos da Mossman nas mãos (folhas soltas voando) → ele olha o
// céu → "cheguei tão perto" → o Gordon continua: a câmera passa por ele e ele fica para trás.
export const HL14Varga: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [filesAt, skyAt, seeAt, closeAt, loseAt, goAt] = ats(p, ["filesAt", "skyAt", "seeAt", "closeAt", "loseAt", "goAt"]);
  void seeAt;
  const pass = P(f, goAt, 60);
  const vx = 960 - pass * 1400;
  const vy = 720 + pass * 120;
  const k = 1.6 + pass * 0.6;
  return (
    <AbsoluteFill style={{ background: "#05070c", overflow: "hidden" }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <defs><linearGradient id="vgSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0a0e1a" /><stop offset="1" stopColor="#3a3450" /></linearGradient></defs>
        <rect width={1920} height={1080} fill="url(#vgSky)" />
        {/* o céu se dobrando */}
        {Array.from({ length: 8 }).map((_, j) => <path key={j} d={`M 0 ${90 + j * 50} Q 960 ${40 + j * 50 + 60 * P(f, skyAt, 80) * Math.sin(f / 25 + j)} 1920 ${100 + j * 50}`} fill="none" stroke="rgba(199,155,255,0.22)" strokeWidth={6} style={{ filter: "blur(3px)" }} />)}
        <path d="M 0 760 Q 960 700 1920 760 L 1920 1080 L 0 1080 Z" fill="#d4dee8" />
        {/* neve caindo */}
        {Array.from({ length: 140 }).map((_, i) => <circle key={"s" + i} cx={(rnd(i) * 1920 + f * (1 + rnd(i * 3)) * 0.6) % 1920} cy={(rnd(i * 7) * 1080 + f * (2 + rnd(i * 5) * 2)) % 1080} r={1 + rnd(i * 9) * 2} fill="#fff" opacity={0.7} />)}
        {/* as folhas dos arquivos voando */}
        {f >= filesAt ? Array.from({ length: 7 }).map((_, i) => {
          const t = (f - filesAt - i * 12) / 120;
          if (t < 0) return null;
          return <rect key={"p" + i} x={vx + 40 + t * 900 + i * 20} y={vy - 120 - t * 300 - Math.sin(t * 6 + i) * 40} width={34} height={44} fill="#e8dfc6" stroke="#8a7a5a" strokeWidth={1} transform={`rotate(${t * 400 + i * 40} ${vx + 57 + t * 900 + i * 20} ${vy - 98 - t * 300})`} opacity={1 - t} />;
        }) : null}
        <line x1={vx} y1={vy + 40} x2={vx} y2={vy - 160 * k} stroke={AMB} strokeWidth={2} />
        <ellipse cx={vx} cy={vy + 40} rx={40 * k} ry={10 * k} fill="none" stroke={AMB} strokeWidth={1.6} strokeDasharray="5 4" />
        <FlagBadge cx={vx} by={vy - 160 * k} k={k} label="VARGA" col={AMB} f={f} photo="hl3silh/varga_retrato.png" sub={f >= loseAt && f < goAt ? "NÃO PEDE AJUDA" : f >= skyAt ? "OLHA O CÉU" : f >= filesAt ? "OS ARQUIVOS DA MOSSMAN" : "SOZINHO NA NEVE"} />
      </svg>
      <Kin kind="quote" t0={closeAt} until={goAt + 30} bottom={150} size={50} col={AMB} who="VARGA" text="Cheguei tão perto." />
      <Hud f={f} yaw={0} eye={{ x: 0, y: 0, z: 1.6, yaw: 0, pitch: 0, F: 900 }} blips={[]} msg={f >= goAt ? "GORDON CONTINUA" : undefined} msgCol={GREEN} />
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ================================================================================================= MÓDULO 14 · leva B
// ---------------------------------------------------------------- 1:46:37 / 1:49:04 os Advisors param · o pânico
// a parede de feeds Combine: quatro casulos em pontos diferentes da Terra, um Advisor em cada; no meio, o sinal da
// PERPETUIDADE (a promessa) → os quatro param no mesmo instante (luzes apagam juntas) → o sinal vira linha reta → modo 1: o
// pânico — os braços abrem, tudo em vermelho, os feeds tremendo; "o inevitável não é mais".
const ADV_FEEDS = ["CIDADE 17", "NOVA PROSPEKT", "ÁRTICO · POSTO 9", "CIDADE 08"];
// 03/11 (pedido dele: "tá muito monótona, uns 40 segundos parado nisso"): com `feeds`, os painéis passam a mostrar o
// Advisor do Episode Two em 3D (um plano por casulo, todos param no mesmo quadro); abre com `introSrc` em tela cheia
// (ele sente primeiro) e no `closeAt` a câmera entra no feed do Ártico e fica nele de perto (`closeSrc`) até o fim.
// `feedsAt`/`closeClipAt` = segundo da cena em que o quadro 0 de cada clipe acontece (os clipes seguem o relógio da cena).
type AdvVid = { introSrc?: string; feeds?: string[]; closeSrc?: string; feedsAt?: number; closeClipAt?: number; gridAt?: number; closeAt?: number };
export const HL14Advisors: React.FC<PR & { mode?: number } & AdvVid> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const mode = p.mode ?? 0;
  const [feelAt, stopAt, goneAt, perpAt, sciAt, convAt, notAt, panicAt, failAt, inevAt] = ats(p, ["feelAt", "stopAt", "goneAt", "perpAt", "sciAt", "convAt", "notAt", "panicAt", "failAt", "inevAt"]);
  const vid = !!p.feeds && !mode;
  const gridAt = p.gridAt ?? 0;
  const closeAt = p.closeAt ?? 1e9;
  const feedsAt = p.feedsAt ?? 0;
  const closeClipAt = p.closeClipAt ?? 0;
  const intro = vid && p.introSrc ? 1 - P(f, gridAt, 10) : 0;
  const zin = vid && p.closeSrc ? P(f, closeAt, 30) : 0;
  const zE = zin * zin * (3 - 2 * zin);
  const stopped = mode ? 1 : P(f, stopAt, 6);
  const flat = mode ? 1 : P(f, goneAt, 20);
  const panic = mode ? P(f, panicAt, 8) : 0;
  const shakeX = panic > 0 ? (rnd(f * 3) - 0.5) * 8 * panic : 0;
  return (
    <AbsoluteFill style={{ background: "#03060a", overflow: "hidden" }}>
      {/* 13/10 (pedido dele: começava mexendo e do nada parava): a câmera nunca para — avança devagar sobre os casulos em
          perspectiva, e os fios da promessa (de cada Advisor até a luz no centro) afinam e arrebentam quando ela some */}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 2 }}>
        {(() => {
          const cx = 960, cy = 470;
          const fade = mode ? 1 : P(f, goneAt, 40);
          const pts = [[850, 330], [1070, 330], [850, 610], [1070, 610]];
          return (
            <g>
              <circle cx={cx} cy={cy} r={60 + 10 * Math.sin(f / 9)} fill={`rgba(220,200,255,${0.5 * (1 - fade)})`} style={{ filter: "blur(18px)" }} />
              <circle cx={cx} cy={cy} r={14 * (1 - fade) + 2} fill={fade > 0.9 ? "rgba(255,93,77,0.6)" : "#f4ecff"} />
              {pts.map(([x, y], k) => {
                const brk = mode ? 1 : P(f, goneAt + k * 6, 14);
                const mx = x + (cx - x) * 0.5, my = y + (cy - y) * 0.5;
                return (
                  <g key={k}>
                    <line x1={x} y1={y} x2={x + (mx - x) * (1 - brk * 0.3)} y2={y + (my - y) * (1 - brk * 0.3)} stroke={VIO} strokeWidth={3 * (1 - brk * 0.6)} opacity={0.8 - 0.5 * brk} strokeDasharray={brk > 0 ? "6 6" : undefined} strokeDashoffset={-f} />
                    <line x1={cx} y1={cy} x2={cx + (mx - cx) * (1 - brk * 0.5)} y2={cy + (my - cy) * (1 - brk * 0.5)} stroke={VIO} strokeWidth={3 * (1 - brk * 0.6)} opacity={0.8 - 0.6 * brk} />
                  </g>
                );
              })}
            </g>
          );
        })()}
      </svg>
      <div style={{ position: "absolute", left: 160, top: 120, right: 160, bottom: 200, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 110, transform: `perspective(1800px) rotateX(${(mode ? 4 : 10) - 6 * Math.min(1, f / Math.max(1, life))}deg) rotateY(${2.5 * Math.sin(f / 90)}deg) scale(${1 + 0.12 * Math.min(1, f / Math.max(1, life))}) translateX(${shakeX}px)`, transformOrigin: "50% 45%", opacity: 0.94 }}>
        {ADV_FEEDS.map((n, k) => (
          <div key={n} style={{ position: "relative", borderRadius: 10, overflow: "hidden", border: `2px solid ${panic > 0.5 ? RED : "rgba(159,230,255,0.5)"}`, background: panic > 0.5 ? "#1a0606" : "#061418" }}>
            <svg width="100%" height="100%" viewBox="0 0 760 340" preserveAspectRatio="xMidYMid slice">
              {Array.from({ length: 30 }).map((_, i) => <line key={i} x1={0} x2={760} y1={i * 12} y2={i * 12} stroke="rgba(0,0,0,0.25)" />)}
            </svg>
            {vid && p.feeds?.[k] ? (
              <>
                <Sequence from={feedsAt} premountFor={30}>
                  <Clip src={p.feeds[k]} from={0} style={{ filter: `saturate(0.7) contrast(1.1) brightness(${1 - 0.25 * stopped})` }} />
                </Sequence>
                <AbsoluteFill style={{ background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.22) 0 2px, rgba(0,0,0,0) 2px 4px)", pointerEvents: "none" }} />
                {f >= stopAt && f < stopAt + 12 && rnd(f * 7 + k) > 0.4 ? <AbsoluteFill style={{ background: "rgba(255,255,255,0.12)" }} /> : null}
              </>
            ) : null}
            {/* 12/10: o Advisor do modelo 3D em holograma de varredura (no lugar do desenho 2D); parado = imóvel; pânico = treme */}
            {vid ? null : (() => {
              const col = panic > 0.5 ? "#ff6a5a" : "#7ff0e0";
              const bob = mode ? (rnd(f * 5 + k) - 0.5) * 10 * panic : stopped > 0.5 ? 0 : 6 * Math.sin(f / 18 + k);
              const ph = ((f + k * 20) % 60) / 60;
              return (
                <div style={{ position: "absolute", left: "50%", top: "50%", width: 300, height: 212, transform: `translate(-50%, calc(-50% + ${bob}px)) ${k % 2 ? "scaleX(-1)" : ""}`, opacity: mode ? 0.95 : 0.95 - 0.35 * stopped, filter: `drop-shadow(0 0 8px ${col})` }}>
                  <div style={{ position: "absolute", inset: 0, WebkitMaskImage: `url(${staticFile("hl3silh/advisor_mask.png")})`, maskImage: `url(${staticFile("hl3silh/advisor_mask.png")})`, WebkitMaskSize: "contain", maskSize: "contain", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", background: `repeating-linear-gradient(0deg, ${col} 0 2px, rgba(127,240,224,0.15) 2px 5px)` }} />
                  <div style={{ position: "absolute", left: 0, right: 0, top: `${(stopped < 0.5 || mode ? ph : ((f + k * 20) % 180) / 180) * 100}%`, height: 3, background: `rgba(255,255,255,${stopped < 0.5 || mode ? 0.5 : 0.25})` }} />
                </div>
              );
            })()}
            <div style={{ position: "absolute", left: 12, top: 10, fontFamily: MONO, fontSize: 15, letterSpacing: 3, color: panic > 0.5 ? RED : "#9fe6ff" }}>ADVISOR · {n}</div>
            <div style={{ position: "absolute", right: 12, top: 10, fontFamily: MONO, fontSize: 15, letterSpacing: 3, color: stopped > 0.5 ? (panic > 0.5 ? RED : "#ffd27a") : GREEN }}>{panic > 0.5 ? "PÂNICO" : stopped > 0.5 ? "PAROU" : "ATIVO"}</div>
          </div>
        ))}
      </div>
      {/* tela cheia: abre com o Advisor vivo; no fim a câmera entra no feed do Ártico (sai do painel de baixo à esquerda) */}
      {intro > 0 ? (
        <AbsoluteFill style={{ opacity: intro, zIndex: 3 }}>
          <Clip src={p.introSrc!} from={0} />
          <AbsoluteFill style={{ background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.12) 0 2px, rgba(0,0,0,0) 2px 4px)" }} />
          <div style={{ position: "absolute", left: 40, top: 30, fontFamily: MONO, fontSize: 18, letterSpacing: 4, color: "#9fe6ff" }}>ADVISOR · {ADV_FEEDS[0]}</div>
          <div style={{ position: "absolute", right: 40, top: 30, fontFamily: MONO, fontSize: 18, letterSpacing: 4, color: GREEN }}>● ATIVO</div>
        </AbsoluteFill>
      ) : null}
      {zin > 0 ? (
        <AbsoluteFill style={{ zIndex: 3, transformOrigin: "0 0", transform: `translate(${532 * (1 - zE) + 960 * zE - 960 * (0.39 + 0.61 * zE)}px, ${717 * (1 - zE) + 540 * zE - 540 * (0.39 + 0.61 * zE)}px) scale(${0.39 + 0.61 * zE})`, opacity: Math.min(1, zin * 3), borderRadius: 10 * (1 - zE), overflow: "hidden" }}>
          <Sequence from={closeClipAt} premountFor={30}>
            <Clip src={p.closeSrc!} from={0} style={{ filter: "saturate(0.8) contrast(1.08)" }} />
          </Sequence>
          <AbsoluteFill style={{ background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.12) 0 2px, rgba(0,0,0,0) 2px 4px)" }} />
          <div style={{ position: "absolute", left: 40, top: 30, fontFamily: MONO, fontSize: 18, letterSpacing: 4, color: "#9fe6ff" }}>ADVISOR · {ADV_FEEDS[2]}</div>
          <div style={{ position: "absolute", right: 40, top: 30, fontFamily: MONO, fontSize: 18, letterSpacing: 4, color: "#ffd27a" }}>{f >= notAt ? "SEM SINAL" : "PAROU"}</div>
        </AbsoluteFill>
      ) : null}
      {/* o sinal da perpetuidade */}
      <div style={{ position: "absolute", zIndex: 4, left: 160, right: 160, bottom: 70, height: 110, padding: "10px 16px", borderRadius: 10, background: "rgba(8,10,14,0.9)", border: `1.5px solid ${flat > 0.5 ? RED : VIO}`, fontFamily: MONO }}>
        <div style={{ fontSize: 14, letterSpacing: 4, color: flat > 0.5 ? RED : VIO }}>{mode ? "A CONVICÇÃO DE ERAS · FALHOU" : f >= convAt ? "A CONVICÇÃO: NO FIM, O EVENTO ACONTECERIA" : f >= sciAt ? "NUNCA FOI UMA CERTEZA CIENTÍFICA" : "A PROMESSA DE PERPETUIDADE"}</div>
        <svg width={1560} height={60}>
          <polyline points={Array.from({ length: 160 }).map((_, i) => `${i * 10},${30 + (1 - flat) * Math.sin(i * 0.35 + f / 5) * 22}`).join(" ")} fill="none" stroke={flat > 0.5 ? RED : VIO} strokeWidth={3} style={{ filter: `drop-shadow(0 0 6px ${flat > 0.5 ? "#ff5d4d" : "#c79bff"})` }} />
        </svg>
      </div>
      {!mode && f >= feelAt && f < stopAt + 20 ? <div style={{ position: "absolute", zIndex: 4, left: 0, right: 0, top: 50, textAlign: "center", fontFamily: MONO, fontSize: 20, letterSpacing: 6, color: "#9fe6ff", opacity: P(f, feelAt, 8) }}>OS ADVISORS SENTEM PRIMEIRO</div> : null}
      {!mode && f >= stopAt ? <div style={{ position: "absolute", zIndex: 4, left: 0, right: 0, top: 50, textAlign: "center", fontFamily: MONO, fontSize: 20, letterSpacing: 6, color: "#ffd27a", opacity: P(f, stopAt + 20, 8) }}>{f >= goneAt ? "ALGO QUE SEMPRE ESTEVE PRESENTE DESAPARECEU" : "TODOS PARAM AO MESMO TEMPO · SEM ORDEM"}</div> : null}
      
      {mode && f >= failAt ? <div style={{ position: "absolute", zIndex: 4, left: 0, right: 0, top: 50, textAlign: "center", fontFamily: MONO, fontSize: 20, letterSpacing: 6, color: RED, opacity: P(f, failAt, 8) }}>NÃO É UMA ORDEM · É PÂNICO</div> : null}
      {mode ? <Kin kind="strike" t0={inevAt} hit="inevitável" top={460} size={56} col={RED} text="o inevitável não é mais" /> : null}
      {panic > 0 && rnd(Math.floor(f / 2)) > 0.7 ? <AbsoluteFill style={{ background: "rgba(255,40,30,0.12)", pointerEvents: "none" }} /> : null}
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 1:48:14 o G-Man falha (o corredor congelado)
// o corredor do navio parado no meio da fuga, em tom frio; o G-Man aparece como sempre → "Sr. Freeman" → a frase para → a
// imagem dele falha (fica em dois lugares, a cor separa) → tenta continuar → some no meio da frase, sem corredor, sem
// estase → "eles perderam".
export const HL14Glitch: React.FC<PR & { lines?: string[] }> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const lines: string[] = (p.lines as unknown as string[]) ?? [];
  const [stopAt, gmanAt, l0At, l1At, cutAt, glitchAt, l2At, goneAt, lostAt] = ats(p, ["stopAt", "gmanAt", "l0At", "l1At", "cutAt", "glitchAt", "l2At", "goneAt", "lostAt"]);
  const H = useMemo(() => buildShipHall2(40), []);
  const frozen = f >= stopAt;
  const e: Eye = { x: 0, y: frozen ? 6 + 0.06 * (stopAt) / 30 : 6 + f * 0.06 / 30 * 30 / 30, z: 1.6, yaw: 0, pitch: -0.03, F: 960 };
  const g = f >= glitchAt && f < goneAt ? 1 : 0;
  const twin = g && Math.floor(f / 5) % 2 === 0;
  const gO = P(f, gmanAt, 14) * (f >= goneAt ? 0 : 1) * (g && rnd(Math.floor(f / 2) * 9) > 0.8 ? 0.2 : 1);
  const say = f >= l2At ? 2 : f >= l1At && f < cutAt ? 1 : f >= l0At && f < l1At ? 0 : -1;
  const sil = (dx: number, col: string, o: number) => {
    const top = proj(e, [dx, 10, 1.88]);
    const bot = proj(e, [dx, 10, 0]);
    if (!top || !bot) return null;
    const h = bot.y - top.y;
    return (
      <div style={{ position: "absolute", left: top.x - h * 0.185, top: top.y, width: h * 0.37, height: h, opacity: o, mixBlendMode: col === "none" ? undefined : "screen", filter: col === "none" ? "drop-shadow(0 0 4px rgba(220,240,255,0.55)) drop-shadow(0 0 18px rgba(190,230,240,0.3))" : undefined }}>
        <div style={{ position: "absolute", inset: 0, WebkitMaskImage: `url(${staticFile("hl3silh/gman_silh.png")})`, maskImage: `url(${staticFile("hl3silh/gman_silh.png")})`, WebkitMaskSize: "100% 100%", maskSize: "100% 100%", background: col === "none" ? "linear-gradient(180deg, #2a3036, #07090b 80%)" : col }} />
      </div>
    );
  };
  return (
    <AbsoluteFill style={{ background: "#020304", overflow: "hidden" }}>
      <AbsoluteFill style={{ filter: frozen ? "saturate(0.2) brightness(0.8)" : undefined }}>
        <XView e={e} faces={H} lights={[1.5, 4.5, 7.5, 10.5, 13.5, 16.5, 19.5].map((ly) => ({ x: 0, y: ly, z: 2.9, col: [255, 232, 196] as RGB, k: 1.0, r: 4.6 }))} flash={0.35} amb={0.13} seam="rgba(0,0,0,0.18)" />
      </AbsoluteFill>
      {f >= gmanAt ? (
        <>
          {g ? sil(-0.25, "rgba(255,40,60,0.6)", gO) : null}
          {g ? sil(0.25, "rgba(40,200,255,0.6)", gO) : null}
          {sil(twin ? 1.6 : 0, "none", gO)}
          {twin ? sil(-1.4, "none", gO * 0.7) : null}
        </>
      ) : null}
      {g ? <AbsoluteFill style={{ background: `repeating-linear-gradient(0deg, rgba(255,255,255,${0.04 + 0.06 * rnd(f)}) 0 2px, rgba(0,0,0,0) 2px ${4 + Math.floor(rnd(f * 3) * 6)}px)`, pointerEvents: "none" }} /> : null}
      {say >= 0 ? <div style={{ position: "absolute", left: 220, right: 220, bottom: 150, textAlign: "center", fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: "italic", fontSize: 46, color: "#f2ead8", textShadow: "0 4px 30px #000", opacity: P(f, [l0At, l1At, l2At][say], 10) * (say === 2 && f >= goneAt ? 0 : 1), transform: g ? `translateX(${(rnd(f) - 0.5) * 14}px)` : undefined }}>{lines[say]}</div> : null}
      {f >= goneAt && f < lostAt ? <div style={{ position: "absolute", left: 0, right: 0, top: 130, textAlign: "center", fontFamily: MONO, fontSize: 20, letterSpacing: 6, color: "#cfe8ff", opacity: P(f, goneAt + 20, 10) }}>SEM DESPEDIDA · SEM CORREDOR · SEM ESTASE</div> : null}
      <Kin kind="glitch" t0={lostAt} top={440} size={64} text="eles perderam" />
      {f < stopAt + 30 && f >= stopAt ? <div style={{ position: "absolute", left: 0, right: 0, top: 130, textAlign: "center", fontFamily: MONO, fontSize: 22, letterSpacing: 8, color: "#cfe8ff", opacity: P(f, stopAt, 6) }}>O TEMPO PARA</div> : null}
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 1:49:21 as despedidas pelo rádio / 1:49:48 o reencontro e a luz verde
// a neve, o céu se dobrando; modo 0: os rádios um a um (Magnusson, Kleiner, Barney com a risada) e o rádio fica mudo ·
// modo 1: um portal se abre na neve (anel azul-branco) e a Alyx atravessa até o Eli (o Dog junto) → o abraço (as bandeiras
// juntas) → o Gordon sozinho, a câmera anda → o céu se dobra, o chão abre em luz → a energia verde dos Vortigaunts envolve
// a tela → luz → ele some.
const SnowSky: React.FC<{ f: number; fold: number; open: number }> = ({ f, fold, open }) => (
  <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
    <defs><linearGradient id="snSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0a0e1a" /><stop offset="1" stopColor="#3a3450" /></linearGradient></defs>
    <rect width={1920} height={1080} fill="url(#snSky)" />
    {Array.from({ length: 8 }).map((_, j) => <path key={j} d={`M 0 ${90 + j * 50} Q 960 ${40 + j * 50 + 120 * fold * Math.sin(f / 25 + j)} 1920 ${100 + j * 50}`} fill="none" stroke="rgba(199,155,255,0.25)" strokeWidth={6 + 8 * fold} style={{ filter: "blur(3px)" }} />)}
    <path d="M 0 760 Q 960 700 1920 760 L 1920 1080 L 0 1080 Z" fill="#d4dee8" />
    {open > 0 ? Array.from({ length: 6 }).map((_, k) => <path key={k} d={`M ${300 + k * 260} 1080 L ${360 + k * 260 + 40 * Math.sin(k)} ${1080 - 300 * open} L ${420 + k * 260} 1080 Z`} fill="#fff8e6" opacity={0.8 * open} style={{ filter: "blur(4px)" }} />) : null}
    {Array.from({ length: 140 }).map((_, i) => <circle key={"s" + i} cx={(rnd(i) * 1920 + f * (1 + rnd(i * 3)) * 0.6) % 1920} cy={(rnd(i * 7) * 1080 + f * (2 + rnd(i * 5) * 2)) % 1080} r={1 + rnd(i * 9) * 2} fill="#fff" opacity={0.7} />)}
  </svg>
);
const Flag2D: React.FC<{ x: number; y: number; k: number; label: string; col: string; f: number; o?: number; sub?: string; photo?: string }> = ({ x, y, k, label, col, f, o = 1, sub, photo }) => (
  <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: o, pointerEvents: "none" }}>
    <line x1={x} y1={y} x2={x} y2={y - 170 * k} stroke={col} strokeWidth={2} />
    <ellipse cx={x} cy={y} rx={34 * k} ry={9 * k} fill="none" stroke={col} strokeWidth={1.6} strokeDasharray="5 4" strokeDashoffset={-f} />
    <FlagBadge cx={x} by={y - 170 * k} k={k} label={label} col={col} f={f} sub={sub} photo={photo} />
  </svg>
);
export const SnowGreen: React.FC<{ f: number; greenAt: number; green: number }> = ({ f, greenAt, green }) => (
  <>
      {green > 0 ? (
      <AbsoluteFill style={{ pointerEvents: "none" }}>
        <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 55%, rgba(141,255,168,${0.05 + 0.35 * green}), rgba(10,40,20,${0.6 * green}) 75%)` }} />
        {/* os Vortigaunts aparecem na luz em volta do Gordon, arcos das mãos até ele */}
        {[[260, 1.0, false], [620, 0.8, false], [1300, 0.8, true], [1660, 1.0, true]].map(([x, s3, fl], k) => {
          const o = P(f, greenAt + k * 10, 20);
          const h = 640 * (s3 as number);
          return (
            <div key={k} style={{ position: "absolute", left: (x as number) - (h * 270) / 400 / 2, top: 1080 - h + 40, width: (h * 270) / 400, height: h, opacity: o, transform: fl ? "scaleX(-1)" : undefined, filter: "drop-shadow(0 0 10px #8dffa8) drop-shadow(0 0 30px rgba(141,255,168,0.6))" }}>
              <div style={{ position: "absolute", inset: 0, WebkitMaskImage: `url(${staticFile("hl3silh/vort_silh.png")})`, maskImage: `url(${staticFile("hl3silh/vort_silh.png")})`, WebkitMaskSize: "100% 100%", maskSize: "100% 100%", background: "linear-gradient(180deg, #2e4a36, #06100a 85%)" }} />
              <div style={{ position: "absolute", left: "84%", top: "13%", width: 12, height: 12, marginLeft: -6, borderRadius: 6, background: "#ff4a3a", boxShadow: "0 0 14px #ff4a3a" }} />
            </div>
          );
        })}
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          {[[400, 760], [740, 820], [1180, 820], [1520, 760]].map(([hx, hy], j) =>
            f >= greenAt + j * 10 + 12 ? (
              <polyline key={j} points={Array.from({ length: 10 }).map((_, k) => { const u = k / 9; const jx = k === 0 || k === 9 ? 0 : (rnd(Math.floor(f / 2) * 13 + k * 7 + j * 31) - 0.5) * 50; const jy = k === 0 || k === 9 ? 0 : (rnd(Math.floor(f / 2) * 17 + k * 5 + j * 19) - 0.5) * 50; return `${hx + (960 - hx) * u + jx},${hy + (560 - hy) * u + jy}`; }).join(" ")} fill="none" stroke="#d8ffe4" strokeWidth={3} style={{ filter: "drop-shadow(0 0 10px #8dffa8)" }} />
            ) : null,
          )}
          <circle cx={960} cy={560} r={30 + 60 * green} fill="rgba(220,255,230,0.6)" style={{ filter: "blur(14px)" }} />
        </svg>
      </AbsoluteFill>
    ) : null}
  </>
);
export const HL14Snow: React.FC<PR & { mode?: number }> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const mode = p.mode ?? 0;
  const [magAt, kleinerAt, barneyAt, laughAt, muteAt] = ats(p, ["magAt", "kleinerAt", "barneyAt", "laughAt", "muteAt"]);
  const [portalAt, lastAt, throughAt, dogAt, talkAt, knowsAt, hugAt, aloneAt, foldAt, greenAt, lightAt, vanishAt] = ats(p, ["portalAt", "lastAt", "throughAt", "dogAt", "talkAt", "knowsAt", "hugAt", "aloneAt", "foldAt", "greenAt", "lightAt", "vanishAt"]);
  void lastAt; void talkAt;
  const fold = mode ? P(f, foldAt, 60) : 0.3;
  const open = mode ? P(f, foldAt + 60, 80) : 0;
  const portal = mode ? P(f, portalAt, 20) * (1 - P(f, throughAt + 40, 30)) : 0;
  const away = mode ? P(f, aloneAt, 80) : 0;
  const hug = mode ? P(f, hugAt, 30) : 0;
  const green = mode ? P(f, greenAt, 60) : 0;
  const white = mode ? P(f, lightAt, 40) : 0;
  const ax = mode ? (f < throughAt ? 1240 : 1240 - 140 * P(f, throughAt, 30) - 40 * hug) : 0;
  return (
    <AbsoluteFill style={{ background: "#05070c", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${1 + away * 0.35}) translateX(${away * -120}px)`, transformOrigin: "50% 70%" }}>
        <SnowSky f={f} fold={fold} open={open} />
        {mode && portal > 0 ? (
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
            <ellipse cx={1260} cy={620} rx={90 * portal} ry={170 * portal} fill="rgba(220,240,255,0.85)" stroke="#9fe6ff" strokeWidth={6} style={{ filter: "drop-shadow(0 0 30px #9fe6ff)" }} />
          </svg>
        ) : null}
        {mode ? (
          <>
            <Flag2D x={1000 + 40 * hug} y={800} k={1.3} label="ELI" col={AMB} f={f} o={P(f, 4, 10)} sub={hug > 0.5 ? "ABRAÇA A FILHA" : undefined} />
            {f >= dogAt ? <Flag2D x={880} y={830} k={1.1} label="DOG" col={ICE} f={f} o={P(f, dogAt, 10)} sub={hug > 0.5 ? "DEITA AO LADO" : undefined} /> : null}
            {f >= throughAt - 10 ? <Flag2D x={ax} y={800} k={1.3} label="ALYX" col={ORANGE} f={f} o={P(f, throughAt - 10, 10)} sub={f >= knowsAt && f < hugAt ? "O CATALISADOR NÃO ACONTECEU" : undefined} /> : null}
          </>
        ) : null}
      </AbsoluteFill>
      {!mode ? (
        <>
          <RadioCard f={f} at={magAt} until={kleinerAt} img="hl3silh/magnusson_badge.jpg" name="MAGNUSSON" text="Dessa vez, o foguete não vai salvar ninguém." col={GREEN} x={710} y={300} />
          <RadioCard f={f} at={kleinerAt} until={barneyAt} img="hl3silh/kleiner_retrato.png" name="DR. KLEINER" text="Obrigado, Gordon. Foi uma honra." col={ICE} x={710} y={300} />
          <RadioCard f={f} at={barneyAt} until={muteAt + 20} img="hl3silh/barney_badge.jpg" name="BARNEY" text={f >= laughAt ? "…ha. A cerveja fica pra outra vida." : "Pelo jeito aquela cerveja…"} col={AMB} x={710} y={300} mute={f >= muteAt} />
          {f >= muteAt ? <div style={{ position: "absolute", left: 0, right: 0, top: 560, textAlign: "center", fontFamily: MONO, fontSize: 22, letterSpacing: 8, color: "rgba(242,240,247,0.7)", opacity: P(f, muteAt + 10, 10) }}>RÁDIO · SEM SINAL</div> : null}
          {f < magAt ? <div style={{ position: "absolute", left: 0, right: 0, top: 130, textAlign: "center", fontFamily: MONO, fontSize: 20, letterSpacing: 6, color: "#cfe8ff", opacity: P(f, 4, 10) }}>A FUGA FICA MAIS SILENCIOSA</div> : null}
        </>
      ) : null}
      {mode && f >= portalAt && f < throughAt + 30 ? <div style={{ position: "absolute", left: 0, right: 0, top: 130, textAlign: "center", fontFamily: MONO, fontSize: 20, letterSpacing: 6, color: "#9fe6ff", opacity: P(f, portalAt, 8) }}>A ÚLTIMA COISA QUE O NAVIO CONSEGUE FAZER · UM PORTAL ATÉ O ELI</div> : null}
      {mode && f >= aloneAt && f < greenAt ? <div style={{ position: "absolute", left: 0, right: 0, top: 130, textAlign: "center", fontFamily: MONO, fontSize: 20, letterSpacing: 6, color: "#cfe8ff", opacity: P(f, aloneAt, 8) }}>{f >= foldAt ? "O CÉU SE DOBRA · O CHÃO ABRE EM LUZ" : "GORDON SEGUE SOZINHO"}</div> : null}
      {green > 0 ? (
        <AbsoluteFill style={{ pointerEvents: "none" }}>
          <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 55%, rgba(141,255,168,${0.05 + 0.35 * green}), rgba(10,40,20,${0.6 * green}) 75%)` }} />
          {/* os Vortigaunts aparecem na luz em volta do Gordon, arcos das mãos até ele */}
          {[[260, 1.0, false], [620, 0.8, false], [1300, 0.8, true], [1660, 1.0, true]].map(([x, s3, fl], k) => {
            const o = P(f, greenAt + k * 10, 20);
            const h = 640 * (s3 as number);
            return (
              <div key={k} style={{ position: "absolute", left: (x as number) - (h * 270) / 400 / 2, top: 1080 - h + 40, width: (h * 270) / 400, height: h, opacity: o, transform: fl ? "scaleX(-1)" : undefined, filter: "drop-shadow(0 0 10px #8dffa8) drop-shadow(0 0 30px rgba(141,255,168,0.6))" }}>
                <div style={{ position: "absolute", inset: 0, WebkitMaskImage: `url(${staticFile("hl3silh/vort_silh.png")})`, maskImage: `url(${staticFile("hl3silh/vort_silh.png")})`, WebkitMaskSize: "100% 100%", maskSize: "100% 100%", background: "linear-gradient(180deg, #2e4a36, #06100a 85%)" }} />
                <div style={{ position: "absolute", left: "84%", top: "13%", width: 12, height: 12, marginLeft: -6, borderRadius: 6, background: "#ff4a3a", boxShadow: "0 0 14px #ff4a3a" }} />
              </div>
            );
          })}
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
            {[[400, 760], [740, 820], [1180, 820], [1520, 760]].map(([hx, hy], j) =>
              f >= greenAt + j * 10 + 12 ? (
                <polyline key={j} points={Array.from({ length: 10 }).map((_, k) => { const u = k / 9; const jx = k === 0 || k === 9 ? 0 : (rnd(Math.floor(f / 2) * 13 + k * 7 + j * 31) - 0.5) * 50; const jy = k === 0 || k === 9 ? 0 : (rnd(Math.floor(f / 2) * 17 + k * 5 + j * 19) - 0.5) * 50; return `${hx + (960 - hx) * u + jx},${hy + (560 - hy) * u + jy}`; }).join(" ")} fill="none" stroke="#d8ffe4" strokeWidth={3} style={{ filter: "drop-shadow(0 0 10px #8dffa8)" }} />
              ) : null,
            )}
            <circle cx={960} cy={560} r={30 + 60 * green} fill="rgba(220,255,230,0.6)" style={{ filter: "blur(14px)" }} />
          </svg>
        </AbsoluteFill>
      ) : null}
      {white > 0 ? <AbsoluteFill style={{ background: `rgba(240,255,244,${white})`, pointerEvents: "none" }} /> : null}
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life) * (mode ? (f > life - 10 ? 1 : 0) : 1), pointerEvents: "none" }} />
      <FilmLook />
      {void vanishAt}
    </AbsoluteFill>
  );
};


// ================================================================================================= MÓDULO 15 · o fechamento
const CHALK = "rgba(236,236,226,0.88)";
const HANDF = "'Caveat', 'Segoe Print', cursive";
const Board: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill style={{ background: "#141210" }}>
    <div style={{ position: "absolute", left: 60, top: 50, right: 60, bottom: 50, borderRadius: 8, background: "radial-gradient(ellipse at 50% 40%, #2c4238 0%, #1e3029 70%, #172520 100%)", border: "14px solid #5a3f26", boxShadow: "inset 0 0 80px rgba(0,0,0,0.6), 0 20px 60px rgba(0,0,0,0.6)" }}>{children}</div>
  </AbsoluteFill>
);
export const Gman2D: React.FC<{ x: number; y: number; h: number; o?: number }> = ({ x, y, h, o = 1 }) => (
  <div style={{ position: "absolute", left: x - h * 0.185, top: y - h, width: h * 0.37, height: h, opacity: o, filter: "drop-shadow(0 0 4px rgba(220,240,255,0.55)) drop-shadow(0 0 18px rgba(190,230,240,0.3))" }}>
    <div style={{ position: "absolute", inset: 0, WebkitMaskImage: `url(${staticFile("hl3silh/gman_silh.png")})`, maskImage: `url(${staticFile("hl3silh/gman_silh.png")})`, WebkitMaskSize: "100% 100%", maskSize: "100% 100%", background: "linear-gradient(180deg, #2a3036, #07090b 80%)" }} />
  </div>
);
const Photo: React.FC<{ x: number; y: number; w: number; h: number; img: string; label: string; col: string; o?: number; rot?: number; gray?: boolean }> = ({ x, y, w, h, img, label, col, o = 1, rot = 0, gray }) => (
  <div style={{ position: "absolute", left: x - w / 2, top: y - h / 2, width: w, padding: 6, background: "#e8e2d2", boxShadow: "0 10px 26px rgba(0,0,0,0.5)", transform: `rotate(${rot}deg)`, opacity: o }}>
    <div style={{ height: h - 34, backgroundImage: `url(${staticFile(img)})`, backgroundSize: "cover", backgroundPosition: "50% 30%", filter: gray ? "grayscale(1)" : undefined }} />
    <div style={{ fontFamily: MONO, fontSize: 13, letterSpacing: 2, color: "#2a2418", textAlign: "center", marginTop: 6 }}>{label}</div>
    <div style={{ position: "absolute", left: "50%", top: -8, width: 14, height: 14, borderRadius: 7, background: col, transform: "translateX(-50%)", boxShadow: "0 2px 4px rgba(0,0,0,0.5)" }} />
  </div>
);

// ---------------------------------------------------------------- 1:51:52 as ideias simples (o quadro-negro)
// o quadro de giz onde a história nasceu: no meio o Borealis desenhado a giz → "um lugar para brincar com o tempo" →
// "não um multiverso" (riscado) → o navio preso à própria história: passado · presente · futuro se encostando → daí sai o
// resto, um cartão preso por vez com barbante até o navio: a ferida, o núcleo, o catalisador, a perpetuidade, o G-Man (a
// maleta), as linhas → embaixo, os dois finais: muda o vencedor × impede o evento.
export const HL15Ideas: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [bigAt, simpleAt, shipAt, multiAt, boundAt, pastAt, touchAt, chainAt, woundAt, coreAt, catAt, perpAt, gmanAt, linesAt, f1At, f2At] = ats(p, ["bigAt", "simpleAt", "shipAt", "multiAt", "boundAt", "pastAt", "touchAt", "chainAt", "woundAt", "coreAt", "catAt", "perpAt", "gmanAt", "linesAt", "f1At", "f2At"]);
  const draw = (t0: number, d = 30) => ({ pathLength: 1, strokeDasharray: `${P(f, t0, d)} 1` });
  const cards: [number, number, number, string, string][] = [[woundAt, 360, 300, "A FERIDA DE BLACK MESA", "#ff8a5a"], [coreAt, 360, 470, "O NÚCLEO PRESO A ELA", "#ffd27a"], [catAt, 1440, 290, "O CATALISADOR", "#ffd27a"], [perpAt, 1450, 450, "A PERPETUIDADE", VIO], [linesAt, 1450, 610, "AS LINHAS · O MESMO EVENTO", ICE]];
  return (
    <Board>
      <svg width={1800} height={980} style={{ position: "absolute", inset: 0 }}>
        {/* o que a história ficou: palavras a giz espalhadas, riscadas quando "no fundo, ideias simples" */}
        {f >= bigAt && f < shipAt + 30 ? ["REGRAS", "VIAGEM NO TEMPO", "BOREALIS", "G-MAN", "COMBINE", "VORTIGAUNTS", "CATALISADOR"].map((w, k) => (
          <text key={w} x={180 + (k % 4) * 400} y={150 + Math.floor(k / 4) * 70} fill={CHALK} fontFamily={HANDF} fontSize={46} opacity={P(f, bigAt + k * 6, 8) * (1 - P(f, shipAt, 20))}>{w}</text>
        )) : null}
        {/* o Borealis a giz no meio */}
        {f >= shipAt ? (
          <g transform="translate(560 330) scale(0.7)" opacity={P(f, shipAt, 10)}>
            <path d="M 20 210 L 70 290 L 900 290 L 985 200 L 940 196 L 930 210 Z" fill="none" stroke={CHALK} strokeWidth={5} {...draw(shipAt, 40)} />
            <path d="M 120 210 L 120 150 L 260 150 L 260 120 L 420 120 L 420 210" fill="none" stroke={CHALK} strokeWidth={4} {...draw(shipAt + 20, 30)} />
            <text x={420} y={360} fill={CHALK} fontFamily={HANDF} fontSize={64}>BOREALIS</text>
          </g>
        ) : null}
        {f >= multiAt ? (
          <g opacity={P(f, multiAt, 8)}>
            <text x={250} y={820} fill={CHALK} fontFamily={HANDF} fontSize={44}>um multiverso onde tudo se desfaz</text>
            <line x1={240} y1={808} x2={240 + 620 * P(f, multiAt + 20, 14)} y2={808} stroke="#ff8a7a" strokeWidth={5} />
          </g>
        ) : null}
        {f >= boundAt ? <text x={1000} y={820} fill="#ffd27a" fontFamily={HANDF} fontSize={46} opacity={P(f, boundAt, 8)}>o navio preso à própria história</text> : null}
        {/* passado · presente · futuro se encostando */}
        {f >= pastAt ? ["passado", "presente", "futuro"].map((w, k) => (
          <g key={w} opacity={P(f, pastAt + k * 6, 8)}>
            <ellipse cx={720 + k * 180 - (f >= touchAt ? (k - 1) * 50 * P(f, touchAt, 20) : 0)} cy={640} rx={110} ry={46} fill="none" stroke={CHALK} strokeWidth={3} />
            <text x={720 + k * 180 - (f >= touchAt ? (k - 1) * 50 * P(f, touchAt, 20) : 0)} y={652} textAnchor="middle" fill={CHALK} fontFamily={HANDF} fontSize={34}>{w}</text>
          </g>
        )) : null}
        {/* os barbantes de cada cartão até o navio */}
        {cards.map(([t0, x, y, , c], k) => (f >= t0 ? <line key={k} x1={x} y1={y} x2={x < 900 ? 640 : 1220} y2={480} stroke="#c0392b" strokeWidth={2.5} opacity={P(f, t0, 10)} /> : null))}
      </svg>
      {cards.map(([t0, x, y, t, c], k) => (f >= t0 ? (
        <div key={t} style={{ position: "absolute", left: x - 150, top: y - 34, width: 300, padding: "10px 14px", background: "#efe7d2", boxShadow: "0 8px 20px rgba(0,0,0,0.5)", transform: `rotate(${k % 2 ? 2 : -2}deg) scale(${1.15 - 0.15 * P(f, t0, 8)})`, opacity: P(f, t0, 6), fontFamily: MONO, fontSize: 18, letterSpacing: 2, color: "#2a2418", textAlign: "center" }}>
          {t}
          <div style={{ position: "absolute", left: "50%", top: -8, width: 14, height: 14, borderRadius: 7, background: c, transform: "translateX(-50%)" }} />
        </div>
      ) : null))}
      {f >= gmanAt ? (
        <>
          <Gman2D x={1660} y={930} h={300} o={P(f, gmanAt, 12) * (1 - P(f, f1At - 10, 10))} />
          {f < f1At ? <div style={{ position: "absolute", left: 1060, top: 760, width: 480, textAlign: "right", fontFamily: HANDF, fontSize: 36, color: CHALK, opacity: P(f, gmanAt + 10, 10) }}>mexe nas peças · não faz a última jogada</div> : null}
        </>
      ) : null}
      {f >= chainAt && f < woundAt ? <div style={{ position: "absolute", left: 0, right: 0, top: 70, textAlign: "center", fontFamily: HANDF, fontSize: 48, color: "#ffd27a", opacity: P(f, chainAt, 8) }}>daí veio praticamente todo o resto</div> : null}
      {f >= simpleAt && f < shipAt ? <div style={{ position: "absolute", left: 0, right: 0, top: 380, textAlign: "center", fontFamily: HANDF, fontSize: 60, color: "#ffd27a", opacity: P(f, simpleAt, 8) }}>no fundo, ideias simples</div> : null}
      {f >= f1At ? (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 60, display: "flex", justifyContent: "center", gap: 40 }}>
          {([[f1At, "FINAL 1", "muda o vencedor · o evento continua", ICE], [f2At, "FINAL 2", "impede o evento · uma história que termina sem ele", GREEN]] as [number, string, string, string][]).map(([t0, n, d, c]) => (
            <div key={n} style={{ width: 520, padding: "12px 18px", background: "#efe7d2", boxShadow: "0 8px 20px rgba(0,0,0,0.5)", opacity: P(f, t0, 8), transform: `rotate(${n === "FINAL 1" ? -1.5 : 1.5}deg)` }}>
              <div style={{ fontFamily: MONO, fontSize: 15, letterSpacing: 4, color: c === ICE ? "#2a5a7a" : "#2a6a3a" }}>{n}</div>
              <div style={{ fontFamily: HANDF, fontSize: 34, color: "#2a2418" }}>{d}</div>
            </div>
          ))}
        </div>
      ) : null}
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life), pointerEvents: "none" }} />
      <FilmLook />
    </Board>
  );
};


// ---------------------------------------------------------------- 1:54:55 a ironia (o espelho)
// o G-Man (silhueta) de um lado, o crachá da Alyx do outro, e no meio o mesmo encontro (HALF-LIFE: ALYX · o cofre) com uma
// linha de cada um chegando nele → cada lado com o porquê → o carimbo TEORIA → os "talvez" → "e tudo bem".
export const HL15Irony: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [gmanAt, alyxAt, bothAt, gWhyAt, aWhyAt, theoryAt, maybeAt, okAt] = ats(p, ["gmanAt", "alyxAt", "bothAt", "gWhyAt", "aWhyAt", "theoryAt", "maybeAt", "okAt"]);
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, rgba(4,3,10,0) 30%, rgba(4,3,10,0.6) 100%)", overflow: "hidden" }}>
      {/* 05/11 (pedido dele): de volta ao fundo roxo da nebulosa, como no começo e no fim */}
      <Gman2D x={420} y={900} h={600} o={P(f, gmanAt, 14) * (1 - 0.6 * P(f, theoryAt, 20))} />
      {f >= alyxAt ? (
        <div style={{ position: "absolute", right: 260, top: 300, width: 300, padding: 10, borderRadius: 12, background: "rgba(10,8,4,0.9)", border: `2px solid ${ORANGE}`, opacity: P(f, alyxAt, 12) * (1 - 0.6 * P(f, theoryAt, 20)) }}>
          <div style={{ height: 340, borderRadius: 8, backgroundImage: `url(${staticFile("hl3silh/alyx_badge.jpg")})`, backgroundSize: "cover", backgroundPosition: "50% 30%" }} />
          <div style={{ fontFamily: MONO, fontSize: 16, letterSpacing: 4, color: ORANGE, textAlign: "center", marginTop: 8 }}>ALYX VANCE</div>
        </div>
      ) : null}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: 1 - 0.6 * P(f, theoryAt, 20) }}>
        {f >= bothAt ? (
          <g opacity={P(f, bothAt, 10)}>
            <path d="M 560 520 Q 760 420 860 520" fill="none" stroke="#cfe8ff" strokeWidth={3} strokeDasharray="10 8" strokeDashoffset={-f * 2} />
            <path d="M 1360 520 Q 1160 420 1060 520" fill="none" stroke={ORANGE} strokeWidth={3} strokeDasharray="10 8" strokeDashoffset={-f * 2} />
            <rect x={860} y={460} width={200} height={130} rx={10} fill="rgba(8,10,14,0.9)" stroke="#ffd27a" strokeWidth={2} />
            <text x={960} y={515} textAnchor="middle" fill="#ffd27a" fontFamily={MONO} fontSize={16} letterSpacing={3}>O ENCONTRO</text>
            <text x={960} y={545} textAnchor="middle" fill={TXT} fontFamily={MONO} fontSize={15} letterSpacing={2}>HALF-LIFE: ALYX</text>
            <text x={960} y={570} textAnchor="middle" fill={TXT} fontFamily={MONO} fontSize={13} letterSpacing={2}>O COFRE</text>
          </g>
        ) : null}
      </svg>
      {f >= gWhyAt ? <div style={{ position: "absolute", left: 140, top: 160, width: 520, fontFamily: MONO, fontSize: 20, letterSpacing: 2, color: "#cfe8ff", opacity: P(f, gWhyAt, 8) * (1 - 0.6 * P(f, theoryAt, 20)) }}>O G-MAN GARANTE O NASCIMENTO DA AGENTE DELE</div> : null}
      {f >= aWhyAt ? <div style={{ position: "absolute", right: 140, top: 160, width: 560, textAlign: "right", fontFamily: MONO, fontSize: 20, letterSpacing: 2, color: ORANGE, opacity: P(f, aWhyAt, 8) * (1 - 0.6 * P(f, theoryAt, 20)) }}>A ALYX GARANTE A PESSOA QUE PODE DERROTÁ-LO</div> : null}
      {f >= theoryAt ? <div style={{ position: "absolute", left: 0, right: 0, top: 440, textAlign: "center" }}><span style={{ display: "inline-block", padding: "12px 30px", border: "5px solid #ffd27a", color: "#ffd27a", fontFamily: MONO, fontSize: 64, letterSpacing: 10, transform: `rotate(-6deg) scale(${1.4 - 0.4 * P(f, theoryAt, 8)})`, opacity: P(f, theoryAt, 4) }}>TEORIA</span></div> : null}
      {f >= maybeAt ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 640, textAlign: "center", fontFamily: MONO, fontSize: 20, letterSpacing: 3, color: "rgba(242,240,247,0.75)" }}>
          {["TALVEZ NÃO SEJA A ALYX", "TALVEZ NUNCA SEJA EXPLICADO", "TALVEZ NADA A VER COM O VERDADEIRO HALF-LIFE 3"].map((t, k) => <div key={t} style={{ marginTop: 8, opacity: P(f, maybeAt + k * 40, 8) }}>{t}</div>)}
        </div>
      ) : null}
      
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 1:55:50 o Half-Life 3 que eu gostaria de jogar
// o Borealis no gelo ao entardecer (o mesmo navio do vídeo) e o painel de objetivos do HEV: cada desejo vira um objetivo
// marcado → "não uma resposta para cada pergunta" → OBJETIVO FINAL: UM FINAL DIGNO → "já valeu".
export const HL15Wish: React.FC<PR & { noBg?: boolean }> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [askAt, w1At, w2At, w3At, w4At, w5At, noAnsAt, worthyAt, worthAt] = ats(p, ["askAt", "w1At", "w2At", "w3At", "w4At", "w5At", "noAnsAt", "worthyAt", "worthAt"]);
  const wishes: [number, string][] = [[w1At, "UM BOREALIS QUE JUSTIFIQUE 20 ANOS DE MISTÉRIO"], [w2At, "UM G-MAN COMPREENSÍVEL PARA TEORIAS · ESTRANHO DEMAIS PARA EXPLICAR"], [w3At, "COMBINE MAIS DO QUE O IMPÉRIO MALIGNO"], [w4At, "A ALYX COM CONSEQUÊNCIA REAL DEPOIS DE ALYX"], [w5At, "UM JOGO QUE ENCERRE A HISTÓRIA DE VEZ"]];
  return (
    <AbsoluteFill style={{ background: p.noBg ? "transparent" : "#000", overflow: "hidden" }}>
      {p.noBg ? null : <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <defs><linearGradient id="wsSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1a2234" /><stop offset="0.65" stopColor="#c07a4a" /><stop offset="1" stopColor="#f0c890" /></linearGradient></defs>
        <rect width={1920} height={1080} fill="url(#wsSky)" />
        <circle cx={1500} cy={640} r={80} fill="#ffe8c0" opacity={0.9} style={{ filter: "drop-shadow(0 0 60px #ffd090)" }} />
        <path d="M 0 700 L 1920 680 L 1920 1080 L 0 1080 Z" fill="#dfe4ea" />
        <g transform="translate(240 470) scale(1.05)"><ShipProfile stroke="#2a2a30" fill="#5a3630" rust={0.5} /></g>
      </svg>}
      <Kin kind="type" t0={askAt} until={w1At} top={140} size={64} col={AMB} text="que Half-Life 3 eu gostaria de jogar?" />
      {f >= w1At ? (
        <div style={{ position: "absolute", right: 90, top: 100, width: 720, padding: "18px 22px", borderRadius: 12, background: p.noBg ? "rgba(16,10,32,0.55)" : "rgba(14,10,4,0.88)", backdropFilter: p.noBg ? "blur(16px)" : undefined, border: `1.5px solid ${AMB}`, fontFamily: MONO, opacity: P(f, w1At, 8) }}>
          <div style={{ fontSize: 15, letterSpacing: 4, color: AMB }}>H.E.V. · O HALF-LIFE 3 QUE EU GOSTARIA DE JOGAR</div>
          {wishes.map(([t0, s]) => (f >= t0 ? (
            <div key={s} style={{ display: "flex", gap: 12, marginTop: 10, fontSize: 19, letterSpacing: 2, color: TXT, opacity: P(f, t0, 8) }}>
              <span style={{ color: GREEN }}>{f >= t0 + 30 ? "✓" : "□"}</span>{s}
            </div>
          ) : null))}
          {f >= noAnsAt ? <div style={{ marginTop: 14, fontSize: 17, letterSpacing: 2, color: "rgba(242,240,247,0.6)", textDecoration: "line-through", opacity: P(f, noAnsAt, 8) }}>UMA RESPOSTA PARA CADA PERGUNTA</div> : null}
          {f >= worthyAt ? <div style={{ marginTop: 12, padding: "10px 12px", borderLeft: "3px solid #ffd27a", background: "rgba(40,30,6,0.6)", fontSize: 24, letterSpacing: 3, color: "#ffd27a", opacity: P(f, worthyAt, 8) }}>OBJETIVO FINAL: UM FINAL DIGNO</div> : null}
        </div>
      ) : null}
      <Kin kind="light" t0={worthAt + 40} bottom={110} size={54} col="#ffe2a0" text="pra mim, já valeu" />
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};


// ---------------------------------------------------------------- 1:56:48 o comentário (o fim)
// as duas opções do próximo vídeo como cartões → "volta naquele comentário" → o comentário do começo dos finais reaparece
// (a escolha alternando) com os dois finais e o que cada um custou → "você escolheria a mesma coisa?" → "eu ainda não tenho
// certeza".
// os cartazes do próximo vídeo (encerramento)
// 12/10 (pedido dele: o cartaz desenhado não ficou bom; liberou arte de fã): a arte "To Los Angeles" de Margaux Doury
// (ArtStation, fan art) — a Ellie a cavalo na neve sob as placas da estrada; a câmera anda devagar da placa LOS ANGELES ·
// NO HOPE até ela; neve caindo por cima; o título embaixo sobre a faixa escura.
// 13/10 (pedido dele: a arte anterior não ficou boa): o pôster de fã de Haykel Mhadbi (ArtStation) — a Ellie tocando
// violão diante da cidade tomada pelo verde ao pôr do sol; o "III" entra embaixo do título da própria arte
const PosterTLOU: React.FC<{ f: number; t0: number }> = ({ f, t0 }) => {
  const g = f - t0;
  const zoom = 1.04 + 0.05 * Math.min(1, Math.max(0, g / 400));
  return (
    <div style={{ position: "relative", width: 520, height: 700, borderRadius: 10, overflow: "hidden", boxShadow: "0 30px 80px rgba(0,0,0,0.7)", background: "#2a1c10" }}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${staticFile("hl3silh/tlou_fan_poster.jpg")})`, backgroundSize: "cover", backgroundPosition: "50% 50%", transform: `scale(${zoom})` }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 90, background: "linear-gradient(180deg, rgba(20,12,4,0.7), rgba(20,12,4,0))" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 26, textAlign: "center", fontFamily: MONO, fontSize: 17, letterSpacing: 8, color: "rgba(255,240,215,0.92)" }}>COMO EU FARIA</div>
      {/* 05/11 (pedido dele: nada de "três pauzinhos" no meio; o nome escrito embaixo, como na Ruptura) */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 170, background: "linear-gradient(0deg, rgba(20,12,4,0.92) 45%, rgba(20,12,4,0))", opacity: P(f, t0 + 26, 14) }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 40, textAlign: "center", color: "#f6efe2", opacity: P(f, t0 + 26, 14), transform: `translateY(${(1 - P(f, t0 + 26, 16)) * 16}px)` }}>
        <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 50, letterSpacing: 5, textShadow: "0 4px 18px rgba(0,0,0,0.6)" }}>THE LAST OF US</div>
        <div style={{ fontFamily: MONO, fontSize: 18, letterSpacing: 5, color: "rgba(255,240,215,0.85)", marginTop: 4 }}>PARTE III</div>
      </div>
      <div style={{ position: "absolute", right: 12, bottom: 10, fontFamily: MONO, fontSize: 10, letterSpacing: 1, color: "rgba(255,240,215,0.6)" }}>arte de fã · Haykel Mhadbi</div>
    </div>
  );
};
// a entrada de cada cartaz: vira como uma carta (giro em Y), assenta e um brilho atravessa
const PosterIn: React.FC<{ f: number; t0: number; side: number; children: React.ReactNode }> = ({ f, t0, side, children }) => {
  if (f < t0) return null;
  const k = interpolate(f, [t0, t0 + 22], [0, 1], { ...C, easing: Easing.out(Easing.back(1.2)) });
  const sweep = interpolate(f, [t0 + 18, t0 + 40], [-0.4, 1.4], C);
  return (
    <div style={{ position: "relative", transform: `perspective(1600px) rotateY(${side * (1 - k) * 95}deg) translateY(${(1 - k) * 30}px) rotate(${side * 1.5 * k}deg)`, opacity: Math.min(1, k * 2), transformOrigin: side < 0 ? "100% 50%" : "0% 50%" }}>
      {children}
      {sweep > -0.4 && sweep < 1.4 ? <div style={{ position: "absolute", inset: 0, borderRadius: 10, overflow: "hidden", pointerEvents: "none" }}><div style={{ position: "absolute", top: -100, bottom: -100, width: 140, left: `${sweep * 100}%`, transform: "rotate(18deg)", background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.35), rgba(255,255,255,0))" }} /></div> : null}
    </div>
  );
};
// 29/10 (pendência dele: a arte da Ruptura desenhada não combinava com a do TLOU): o pôster de fã de Santiago Bruni
// (ArtStation) — os funcionários da Lumon em miniatura sobre o teclado; mesmo tratamento do cartaz do TLOU (zoom lento,
// rótulo em cima, crédito embaixo) e o nome do próximo vídeo entra numa faixa embaixo, como o "III"
const PosterSev: React.FC<{ f: number; t0: number }> = ({ f, t0 }) => {
  if (f < t0) return null;
  const g = f - t0;
  const zoom = 1.04 + 0.05 * Math.min(1, Math.max(0, g / 400));
  const k = P(f, t0 + 26, 14);
  return (
    <div style={{ position: "relative", width: 520, height: 700, borderRadius: 10, overflow: "hidden", boxShadow: "0 30px 80px rgba(0,0,0,0.7)", background: "#e9ece6" }}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${staticFile("hl3silh/sev_fan_poster.jpg")})`, backgroundSize: "cover", backgroundPosition: "50% 40%", transform: `scale(${zoom})` }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 90, background: "linear-gradient(180deg, rgba(8,16,34,0.7), rgba(8,16,34,0))" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 26, textAlign: "center", fontFamily: MONO, fontSize: 17, letterSpacing: 8, color: "rgba(235,242,255,0.92)" }}>A LORE DE</div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 170, background: "linear-gradient(0deg, rgba(8,16,34,0.92) 45%, rgba(8,16,34,0))", opacity: k }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 40, textAlign: "center", color: "#f2f5fb", opacity: k, transform: `translateY(${(1 - P(f, t0 + 26, 16)) * 16}px)` }}>
        <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 56, letterSpacing: 6, textShadow: "0 4px 18px rgba(0,0,0,0.6)" }}>RUPTURA</div>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 14, marginTop: 4, fontFamily: MONO, fontSize: 18, letterSpacing: 4, color: "rgba(235,242,255,0.85)" }}>
          <span style={{ fontFamily: "Georgia, serif", fontSize: 34, color: "#ff8a1c" }}>λ</span>
          × HALF-LIFE × PORTAL
        </div>
      </div>
      <div style={{ position: "absolute", right: 12, bottom: 10, fontFamily: MONO, fontSize: 10, letterSpacing: 1, color: "rgba(235,242,255,0.6)" }}>arte de fã · Santiago Bruni</div>
    </div>
  );
};
export const HL15Outro: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [funAt, hopeAt, nextAt, tlouAt, sevAt, backAt, askAt, unsureAt] = ats(p, ["funAt", "hopeAt", "nextAt", "tlouAt", "sevAt", "backAt", "askAt", "unsureAt"]);
  void funAt;
  const [madeAt, planAt, whichAt] = ats(p, ["madeAt", "planAt", "whichAt"]);
  return (
    <AbsoluteFill style={{ background: "#04030a", overflow: "hidden" }}>
      {/* 12/10 (pendência dele: o encerramento eram só dois cards): de volta à nebulosa roxa da abertura — a viagem
          desacelera até quase parar, e os cards ficam em vidro por cima */}
      <AbsoluteFill style={{ opacity: 0.9 }}>
        <HLSpace speed={Math.max(0.12, 1 - P(f, backAt, 60) * 0.85)} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(4,3,10,0) 30%, rgba(4,3,10,0.55) 100%)" }} />
      {f < backAt ? (
        <>
          {/* 05/11: o roxo vazio antes dos cartazes ganha o mosaico, o comentário e o próximo vídeo */}
          {madeAt < 1e8 ? <OutroIntro f={f} madeAt={madeAt} hopeAt={hopeAt} commentAt={nextAt} planAt={planAt} whichAt={whichAt} endAt={tlouAt} scenes={340} /> : null}
          {/* 12/10 (pedido dele: os cards do próximo vídeo fracos e genéricos): dois cartazes com a identidade de cada tema */}
          {f >= nextAt ? (
            <div style={{ position: "absolute", left: 0, right: 0, top: 150, height: 720 }}>
              {/* a primeira chega no meio; 29/10: ela termina de abrir espaço para a esquerda ANTES de a Ruptura virar (não encavalam)
                  e o × aparece entre as duas */}
              <div style={{ position: "absolute", top: 0, left: 960 - 260 - interpolate(f, [sevAt - 18, sevAt + 2], [0, 320], { ...C, easing: Easing.inOut(Easing.cubic) }) }}>
                <PosterIn f={f} t0={tlouAt} side={-1}><PosterTLOU f={f} t0={tlouAt} /></PosterIn>
              </div>
              <div style={{ position: "absolute", top: 0, left: 960 + 60 }}>
                <PosterIn f={f} t0={sevAt} side={1}><PosterSev f={f} t0={sevAt} /></PosterIn>
              </div>
              {f >= sevAt + 10 ? <div style={{ position: "absolute", left: 960 - 30, top: 310, width: 60, textAlign: "center", fontFamily: MONO, fontSize: 54, color: "#ffe2b0", opacity: P(f, sevAt + 10, 10), transform: `scale(${1.4 - 0.4 * P(f, sevAt + 10, 12)})`, textShadow: "0 0 18px rgba(255,200,120,0.6)" }}>×</div> : null}
            </div>
          ) : null}
          {f >= sevAt + 30 ? <div style={{ position: "absolute", left: 0, right: 0, bottom: 120, textAlign: "center", fontFamily: MONO, fontSize: 24, letterSpacing: 8, color: "#ffe2b0", textShadow: "0 2px 10px #000", opacity: P(f, sevAt + 30, 12) }}>QUAL PRIMEIRO? · COMENTA</div> : null}
        </>
      ) : (
        <>
          {/* 05/11 (pedido dele: os cards dos dois finais estavam ruins): o garfo com os dois planetas */}
          <FinalsFork f={f} backAt={backAt} askAt={askAt} unsureAt={unsureAt} />
        </>
      )}
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ================================================================================================= refeitos em POV (08/10)
// ---------------------------------------------------------------- 1:53:10 a mulher misteriosa (POV no salão do cofre)
// o salão Combine do cofre de Half-Life: Alyx: o cubo suspenso por vigas no fundo, com as arestas acesas; um console Combine
// à direita com duas telas. Na primeira: VOZ NÃO IDENTIFICADA e a frase ("movam o cofre"); na segunda: a comparação com a
// voz da Alyx (94%). Dois Advisors (desenho aprovado) junto do cofre — "não a veem". Na volta no tempo, o salão pisca de
// fase e a bandeira da Alyx (crachá) aparece ao lado do console: ALYX · DO FUTURO; os objetivos dela no painel do HEV.
const buildVaultHall = (): XF[] => {
  const g = mk();
  g.room(-9, 9, 0, 22, 9, [30, 34, 40], [24, 26, 30], [16, 18, 22], [], 3);
  for (let y = 2; y < 22; y += 3) {
    g.box(-9, y, 0, 0.4, 0.5, 9, [20, 24, 28]);
    g.box(8.6, y, 0, 0.4, 0.5, 9, [20, 24, 28]);
  }
  // o cofre: cubo escuro com arestas acesas, suspenso por quatro vigas
  g.box(-1.6, 14.4, 2.4, 3.2, 3.2, 3.2, [70, 92, 116], { tag: "vault" });
  // as faces do cofre com faixas acesas (o padrão Combine)
  for (let k = 0; k < 3; k++) {
    g.box(-1.5, 14.38, 2.9 + k * 1.0, 3.0, 0.02, 0.08, [120, 200, 255], { emit: 0.8 });
    g.box(-1.62, 14.5, 2.9 + k * 1.0, 0.02, 3.0, 0.08, [120, 200, 255], { emit: 0.8 });
  }
  for (const [x, y] of [[-1.6, 14.4], [1.6, 14.4], [-1.6, 17.6], [1.6, 17.6]] as [number, number][]) {
    g.box(x - 0.06, y - 0.06, 5.6, 0.12, 0.12, 3.4, [60, 66, 72]);
    g.box(x - 0.05, y - 0.05, 2.4, 0.1, 0.1, 3.2, [90, 170, 255], { emit: 0.7 });
  }
  g.box(-1.6, 14.4, 5.55, 3.2, 0.06, 0.06, [90, 170, 255], { emit: 0.7 });
  g.box(-1.6, 14.4, 2.4, 3.2, 0.06, 0.06, [90, 170, 255], { emit: 0.7 });
  // a plataforma embaixo e a passarela até ela
  g.box(-3, 13, 0, 6, 6, 0.5, [36, 40, 46]);
  g.box(-1, 4, 0, 2, 9, 0.2, [40, 44, 50]);
  // o console Combine à direita, com duas telas inclinadas
  g.box(2.6, 6.4, 0, 2.4, 1.0, 1.0, [40, 46, 52]);
  g.quad([2.7, 6.45, 1.0], [3.75, 6.45, 1.0], [3.75, 6.9, 1.7], [2.7, 6.9, 1.7], [18, 22, 26], [0, -0.7, 0.7]);
  g.quad([3.85, 6.45, 1.0], [4.9, 6.45, 1.0], [4.9, 6.9, 1.7], [3.85, 6.9, 1.7], [18, 22, 26], [0, -0.7, 0.7]);
  return g.F;
};
export const HL15Woman: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [womanAt, presAt, voiceAt, moveAt, knowsAt, advAt, lineAt, backAt, ensureAt, vaultAt, knowAt, trustAt, meetAt] = ats(p, ["womanAt", "presAt", "voiceAt", "moveAt", "knowsAt", "advAt", "lineAt", "backAt", "ensureAt", "vaultAt", "knowAt", "trustAt", "meetAt"]);
  void presAt; void knowAt;
  const G = useMemo(() => buildVaultHall(), []);
  const yaw = keys(f, [[0, 0], [womanAt - 10, 0], [womanAt + 20, 0.42], [advAt - 10, 0.42], [advAt + 20, -0.05], [backAt - 10, -0.05], [backAt + 20, 0.3], [ensureAt, 0.3], [ensureAt + 30, 0.05]]);
  const ey = keys(f, [[0, 0.5], [womanAt, 2.6], [life, 3.4]]);
  const e: Eye = { x: 0.1 * Math.sin(f / 70), y: ey, z: 1.7, yaw, pitch: keys(f, [[0, 0.12], [womanAt, 0.02], [advAt, 0.16], [backAt, 0.02]]), F: 980 };
  const phase = f >= backAt && f < backAt + 50 && rnd(Math.floor(f / 3) * 5) > 0.55;
  const lights: XL[] = [{ x: 0, y: 16, z: 4, col: [110, 180, 255], k: 1.0, r: 16 }, { x: 0, y: 4, z: 6, col: [160, 180, 210], k: 0.4, r: 14 }, { x: 3.8, y: 6.6, z: 1.6, col: [95, 243, 255], k: 0.45, r: 4 }, ...(phase ? [{ x: 0, y: 6, z: 2, col: [199, 155, 255] as RGB, k: 0.9, r: 10 }] : [])];
  const wave = (seed: number, col: string) => (
    <svg width={460} height={70}><polyline points={Array.from({ length: 92 }).map((_, i) => `${i * 5},${35 + Math.sin(i * 0.42 + seed) * 22 * (0.5 + 0.5 * Math.sin(i * 0.11 + f / 9))}`).join(" ")} fill="none" stroke={col} strokeWidth={3} /></svg>
  );
  const pct = Math.min(94, Math.round(P(f, voiceAt + 10, 40) * 94));
  const AS = useAdvScene([[-3.2, 15.5, 4.6], [3.0, 16.5, 5.0]].map((v, k) => ({ pos: v as [number, number, number], look: [0, 14.4, 3.0] as [number, number, number], reach: 0.3, show: f >= advAt - 20 + k * 8 })), f, 2.6);
  return (
    <AbsoluteFill style={{ background: "#020406", overflow: "hidden" }}>
      <XView e={e} faces={G} lights={lights} flash={0.8} amb={0.26} extras={AS.extras} glLights={AS.lights} />
      {phase ? <AbsoluteFill style={{ background: "rgba(150,110,255,0.16)", mixBlendMode: "screen", pointerEvents: "none" }} /> : null}
      {/* as duas telas do console */}
      <Pinned e={e} w={500} h={300} corners={[[2.72, 6.88, 1.69], [3.73, 6.88, 1.69], [3.73, 6.47, 1.02], [2.72, 6.47, 1.02]]} o={P(f, womanAt - 20, 10)}>
        <div style={{ width: 500, height: 300, background: "#04141a", padding: 18, boxSizing: "border-box", fontFamily: MONO, color: "#5ff3ff" }}>
          <div style={{ fontSize: 17, letterSpacing: 3 }}>VOZ NÃO IDENTIFICADA</div>
          {wave(0, "#5ff3ff")}
          {f >= moveAt ? <div style={{ fontSize: 22, color: "#e9fbff", marginTop: 6 }}>“Movam o cofre antes que seja tarde.”</div> : null}
        </div>
      </Pinned>
      <Pinned e={e} w={500} h={300} corners={[[3.87, 6.88, 1.69], [4.88, 6.88, 1.69], [4.88, 6.47, 1.02], [3.87, 6.47, 1.02]]} o={P(f, voiceAt, 10)}>
        <div style={{ width: 500, height: 300, background: "#140e04", padding: 16, boxSizing: "border-box", fontFamily: MONO, color: AMB, display: "flex", gap: 14 }}>
          <div style={{ flex: "0 0 140px", backgroundImage: `url(${staticFile("hl3silh/alyx_badge.jpg")})`, backgroundSize: "cover", backgroundPosition: "50% 30%", borderRadius: 6 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, letterSpacing: 3 }}>COMPARAÇÃO · ALYX VANCE</div>
            <div style={{ fontSize: 64, color: "#fff2d0", marginTop: 26 }}>{pct}%</div>
            <div style={{ fontSize: 15, letterSpacing: 3 }}>DE SEMELHANÇA</div>
          </div>
        </div>
      </Pinned>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <Call e={e} f={f} pt={[0, 14.4, 4.0]} from={8} until={womanAt} text="O COFRE" sub="HALF-LIFE: ALYX" col="#9fd8ff" dx={260} dy={-180} />
        {/* os Advisors junto do cofre: não a veem */}
        {f >= advAt - 20 ? [[-3.2, 15.5, 4.6], [3.0, 16.5, 5.0]].map((v, k) => {
          const q = proj(e, v as V3);
          return q && !AS.ready ? <g key={k} opacity={P(f, advAt - 20 + k * 8, 12)}><AdvisorArt x={q.x} y={q.y + Math.sin(f / 30 + k) * 6} w={(900 / q.d) * 3.2} f={f + k * 40} lit={0.7} id={`vh${k}`} flip={k === 1} /></g> : null;
        }) : null}
        {f >= advAt ? <Call e={e} f={f} pt={[-3.2, 15.5, 4.6]} from={advAt + 4} until={lineAt} text="OS ADVISORS" sub="NÃO A VEEM" col={VIO} dx={-60} dy={-200} /> : null}
        {f >= knowsAt && f < advAt ? <Call e={e} f={f} pt={[3.3, 6.7, 1.5]} from={knowsAt} until={advAt} text="COMO SE SOUBESSE O QUE VAI ACONTECER" col="#ffd27a" dx={-420} dy={-260} /> : null}
        {/* a Alyx do futuro, ao lado do console */}
        {f >= backAt + 20 ? <FlagAt e={e} pt={[1.6, 6.0, 0]} label="ALYX" col={ORANGE} f={f} o={P(f, backAt + 20, 12)} sub={f >= meetAt ? "A JOVEM ALYX PRECISA ENCONTRAR O G-MAN" : f >= trustAt ? "GANHAR A CONFIANÇA DELES" : f >= vaultAt ? "ACONSELHA MOVER O COFRE" : "DO FUTURO · PELO BOREALIS"} /> : null}
        {f >= backAt && f < backAt + 20 ? (() => {
          const q = proj(e, [1.6, 6.0, 1.0]);
          return q ? <circle cx={q.x} cy={q.y} r={(f - backAt) * 12} fill="none" stroke="#e8d8ff" strokeWidth={4} opacity={1 - (f - backAt) / 20} style={{ filter: "drop-shadow(0 0 16px #c79bff)" }} /> : null;
        })() : null}
      </svg>
      
      {f >= ensureAt ? (
        <div style={{ position: "absolute", left: 90, top: 120, width: 560, padding: "16px 20px", borderRadius: 12, background: "rgba(14,10,4,0.88)", border: `1.5px solid ${AMB}`, fontFamily: MONO, opacity: P(f, ensureAt, 8) }}>
          <div style={{ fontSize: 15, letterSpacing: 4, color: AMB }}>OBJETIVO DELA</div>
          <div style={{ marginTop: 8, fontSize: 18, letterSpacing: 2, color: "rgba(242,240,247,0.55)", textDecoration: "line-through", textDecorationColor: RED }}>MUDAR A HISTÓRIA</div>
          {([[ensureAt, "GARANTIR QUE ELA ACONTEÇA", "#ffd27a"], [vaultAt, "ACONSELHAR MOVER O COFRE", ICE], [trustAt, "GANHAR A CONFIANÇA DELES", ICE], [meetAt, "A JOVEM ALYX ENCONTRA O G-MAN", ORANGE]] as [number, string, string][]).map(([t0, s2, c]) => (f >= t0 ? <div key={s2} style={{ marginTop: 8, padding: "6px 10px", borderLeft: `3px solid ${c}`, fontSize: 19, letterSpacing: 2, color: TXT, opacity: P(f, t0, 8) }}>{s2}</div> : null))}
        </div>
      ) : null}
      <Hud f={f} yaw={e.yaw} eye={e} blips={[{ x: 0, y: 16 }]} msg={f >= womanAt && f < voiceAt ? "UMA PRESENÇA LIGADA AOS COMBINE" : undefined} msgCol="#9fd8ff" />
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 1:50:43 o mundo dos Vortigaunts (POV)
// a mesma linguagem do POV: chão de terra e capim, cabanas redondas, cristais acesos, canteiros, uma árvore de copa; céu do
// fim de tarde com dois sóis. Os Vortigaunts (silhueta aprovada, contorno verde, olho vermelho) andando, cultivando,
// conversando; um passa e oferece comida; a câmera chega ao Vortigaunt velho sentado e senta ao lado (desce) → a névoa no
// horizonte se abre sobre um vazio claro → os dois finais → a tela escurece.
// 12/10 (pendência dele: o mundo dos Vortigaunts fraco e feio): uma aldeia de verdade. Relva em placas com tons variados
// e leve ondulação, a trilha de lajes que a câmera percorre, cabanas de barro (base em pedra, parede, beiral, teto em
// anéis, a porta escura virada para a trilha), cercas de varas nos canteiros, uma fogueira com pedras, árvores de copa
// em camadas, aglomerados de cristais acesos e colinas no fundo fechando o horizonte.
const buildVortWorld = (): XF[] => {
  const g = mk();
  // cone liso (fatias finas) — telhados, cristais, copas
  const cone = (x: number, y: number, z0: number, h: number, r0: number, r1: number, col: RGB, o?: { emit?: number }, n = 24, step = 0.06) => {
    const k = Math.max(2, Math.round(h / step));
    for (let i = 0; i < k; i++) {
      const t = i / k, t2 = (i + 1) / k;
      g.prism(x, y, z0 + h * t, z0 + h * t2, r0 + (r1 - r0) * (t + t2) / 2, n, col, o);
    }
  };
  const hgt = (x: number, y: number) => 0.35 * Math.sin(x * 0.21 + y * 0.07) * Math.sin(y * 0.13 - x * 0.05) + 0.12 * Math.sin(x * 0.7 + y * 0.5) + (Math.abs(x) > 18 ? (Math.abs(x) - 18) * 0.08 : 0);
  for (let x = -40; x < 40; x += 1)
    for (let y = -4; y < 90; y += 1) {
      const v = rnd(x * 3.1 + y * 7.7);
      const path = Math.abs(x + 0.5 - Math.sin(y * 0.12) * 1.2) < 1.1 && y < 20;
      const w2 = 0.5 + 0.5 * Math.sin(x * 0.3 + y * 0.17);
      const c: RGB = path ? [118, 104, 82] : [74 + 22 * w2 + 8 * v, 94 + 14 * w2 + 6 * v, 50 + 10 * w2];
      g.quad([x, y, hgt(x, y)], [x + 1, y, hgt(x + 1, y)], [x + 1, y + 1, hgt(x + 1, y + 1)], [x, y + 1, hgt(x, y + 1)], c, [0, 0, 1], { tag: "floor" });
    }
  // as lajes da trilha
  for (let y = -2; y < 19; y += 1.1) {
    const cx = Math.sin(y * 0.12) * 1.2;
    const k = 0.9 + 0.15 * rnd(y * 13);
    g.quad([cx - 0.5, y, 0.03 + hgt(cx, y)], [cx + 0.55, y + 0.05, 0.03 + hgt(cx, y)], [cx + 0.5, y + 0.85, 0.03 + hgt(cx, y)], [cx - 0.45, y + 0.8, 0.03 + hgt(cx, y)], [150 * k, 140 * k, 120 * k], [0, 0, 1], { tag: "floor" });
  }
  // cabanas
  const hut = (x: number, y: number, r: number, face: number) => {
    g.prism(x, y, 0, 0.35, r * 1.06, 28, [96, 90, 80]);
    g.prism(x, y, 0.35, 1.7, r, 28, [140, 104, 68]);
    g.prism(x, y, 1.0, 1.08, r * 1.01, 28, [110, 80, 52]);
    g.prism(x, y, 1.7, 1.86, r * 1.18, 28, [86, 66, 42]);
    cone(x, y, 1.86, 1.7, r * 1.15, 0.12, [98, 78, 48]);
    for (let k = 0; k < 4; k++) g.prism(x, y, 2.0 + k * 0.38, 2.05 + k * 0.38, r * 1.12 * (1 - (k * 0.38 + 0.14) / 1.7), 28, [74, 58, 36]);
    g.prism(x, y, 3.46, 3.8, 0.12, 6, [70, 54, 36]);
    // a porta (escura) e a soleira, virada para a trilha
    const dx = Math.cos(face), dy = Math.sin(face);
    const px = x + dx * (r + 0.01), py = y + dy * (r + 0.01);
    const tx = -dy * 0.42, ty = dx * 0.42;
    g.quad([px - tx, py - ty, 0.35], [px + tx, py + ty, 0.35], [px + tx, py + ty, 1.45], [px - tx, py - ty, 1.45], [24, 18, 12], [dx, dy, 0]);
    g.quad([px - tx * 1.2, py - ty * 1.2, 0.02], [px + tx * 1.2, py + ty * 1.2, 0.02], [px + tx * 1.2 + dx * 0.5, py + ty * 1.2 + dy * 0.5, 0.02], [px - tx * 1.2 + dx * 0.5, py - ty * 1.2 + dy * 0.5, 0.02], [120, 112, 96], [0, 0, 1]);
  };
  for (const [x, y, r] of [[-7, 14, 1.8], [-10, 22, 2.2], [8, 20, 2.0], [11, 30, 2.6], [-4, 34, 2.0], [-14, 40, 2.4], [16, 44, 2.2]] as [number, number, number][]) hut(x, y, r, Math.atan2(-y + 14, -x) );
  // cristais em aglomerados
  for (const [x, y, h] of [[-3, 10, 1.4], [4, 12, 1.0], [-12, 30, 2.2], [14, 16, 1.6], [2, 40, 2.6], [-18, 18, 1.8], [19, 26, 2.0]] as [number, number, number][])
    for (let k = 0; k < 4; k++) {
      const a = k * 1.7, d = k ? 0.35 : 0;
      cone(x + Math.cos(a) * d, y + Math.sin(a) * d, 0, h * (k ? 0.6 + 0.1 * k : 1), 0.2 + (k ? 0 : 0.08), 0.01, [140, 230, 200], { emit: 0.75 }, 6, 0.12);
    }
  // canteiros com cerca de varas
  for (let k = 0; k < 6; k++) g.box(-6 + k * 1.3, 6.5, 0, 0.8, 4, 0.18, [60, 78, 34]);
  for (let k = 0; k < 6; k++) for (let j = 0; j < 5; j++) g.box(-5.8 + k * 1.3 + 0.1 * j, 6.7 + j * 0.8, 0.18, 0.12, 0.12, 0.22 + 0.06 * rnd(k * 5 + j), [70, 120, 50]);
  for (let y = 6.3; y <= 10.7; y += 0.55) for (const x of [-6.3, 1.5]) g.box(x, y, 0, 0.06, 0.06, 0.8, [92, 70, 46]);
  for (const x of [-6.3, 1.5]) for (const z of [0.35, 0.7]) g.box(x - 0.02, 6.3, z, 0.08, 4.4, 0.05, [92, 70, 46]);
  // a fogueira
  for (let k = 0; k < 9; k++) {
    const a = (k / 9) * Math.PI * 2;
    g.box(-2.4 + Math.cos(a) * 0.7 - 0.12, 15.5 + Math.sin(a) * 0.7 - 0.1, 0, 0.24, 0.2, 0.18, [96, 92, 86]);
  }
  g.prism(-2.4, 15.5, 0, 0.5, 0.28, 6, [255, 160, 60], { emit: 0.9 });
  g.prism(-2.4, 15.5, 0.5, 0.85, 0.14, 6, [255, 220, 120], { emit: 1 });
  // árvores de copa em camadas
  const tree = (x: number, y: number, h: number, r: number) => {
    g.prism(x, y, 0, h, 0.22 + r * 0.05, 8, [80, 60, 40]);
    // copa arredondada (meia esfera em fatias)
    for (let i = 0; i < 14; i++) {
      const t = i / 14, t2 = (i + 1) / 14;
      const tm = (t + t2) / 2;
      const rr = r * Math.sqrt(Math.max(0, 1 - Math.pow(tm * 1.9 - 0.9, 2)));
      g.prism(x, y, h + t * r * 0.95 - 0.3, h + t2 * r * 0.95 - 0.3, Math.max(0.05, rr) * (1 + 0.08 * Math.sin(i * 1.3)), 24, [62 + 26 * t, 98 + 26 * t, 60 + 16 * t]);
    }
  };
  tree(6, 9, 3.2, 2.4);
  tree(-15, 12, 3.8, 2.0);
  tree(17, 36, 4.2, 2.6);
  tree(-20, 48, 3.6, 2.2);
  tree(4, 56, 4.0, 2.8);
  // a pedra onde o velho está sentado
  g.prism(1.2, 18, 0, 0.5, 0.9, 8, [96, 92, 84]);
  g.prism(-0.4, 18.3, 0, 0.45, 0.8, 8, [92, 88, 80]);
  // colinas no fundo
  for (let i = 0; i < 9; i++) {
    const x0 = -90 + i * 22, w = 30 + rnd(i) * 20, h = 6 + rnd(i * 3) * 9;
    g.F.push({ p: [[x0, 86, 0], [x0 + w, 86, 0], [x0 + w / 2 + 3, 86, h]], col: [70 + 6 * (i % 2), 88, 66], n: [0, -1, 0] });
  }
  return g.F;
};
export const HL14VortWorld: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [wakeAt, noAt, workAt, nobodyAt, foodAt, playAt, oldAt, sitAt, mistAt, nobodySawAt, vortAt, diffAt, f1At, f2At, darkAt, notGmanAt, noStasisAt, futureAt] = ats(p, ["wakeAt", "noAt", "workAt", "nobodyAt", "foodAt", "playAt", "oldAt", "sitAt", "mistAt", "nobodySawAt", "vortAt", "diffAt", "f1At", "f2At", "darkAt", "notGmanAt", "noStasisAt", "futureAt"]);
  void playAt; void diffAt;
  const G = useMemo(() => buildVortWorld(), []);
  const sit = P(f, sitAt, 40);
  const ey = keys(f, [[0, 0], [playAt, 0.5], [oldAt, 13.0], [sitAt, 16.4], [life, 16.6]]);
  const yaw = keys(f, [[0, -0.15], [workAt, -0.3], [nobodyAt, 0.35], [foodAt, 0.05], [oldAt, 0.0], [sitAt, -0.08], [mistAt, 0.0]]);
  const e: Eye = { x: keys(f, [[0, 0], [sitAt, -0.4]]), y: ey, z: 1.65 - 0.65 * sit + (f > playAt && f < sitAt ? 0.03 * Math.abs(Math.sin(f / 4.5)) : 0), yaw, pitch: keys(f, [[0, -0.08], [wakeAt + 40, 0.0], [sitAt, 0.02], [mistAt, 0.05]]), F: 960 };
  const lights: XL[] = [{ x: 20, y: 80, z: 30, col: [255, 214, 150], k: 0.8, r: 140 }];
  const wake = P(f, wakeAt, 45);
  const mist = P(f, mistAt, 120);
  const dark = P(f, darkAt, 40);
  const V = (x: number, y: number, h: number, t0: number, label?: string, sub?: string, flip?: boolean, walk = 0) => (f >= t0 ? <SilhouetteAt key={`${x}-${y}`} e={e} x={x + walk * Math.min(1, (f - t0) / 300) * 3} y={y} h={h} src="hl3silh/vort_silh.png" ar={270 / 400} f={f + x * 10} o={P(f, t0, 14)} flip={flip} rim="rgba(141,255,168,0.85)" top="#3c4a36" bot="#080c08" label={label} labelCol={GREEN} sub={sub} bob={walk ? Math.abs(Math.sin((f - t0) / 7)) * -6 : 0} /> : null);
  const horizon = proj(e, [0, 200, 0]);
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <AbsoluteFill style={{ opacity: wake }}>
        <AbsoluteFill style={{ background: "linear-gradient(180deg, #1c3a3a 0%, #6a7a52 45%, #d8b070 70%, #d8b070 100%)" }} />
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          <circle cx={1350 - e.yaw * 900} cy={300} r={70} fill="#fff1c8" opacity={0.9} style={{ filter: "drop-shadow(0 0 40px #ffe2a0)" }} />
          <circle cx={560 - e.yaw * 900} cy={190} r={34} fill="#cfe8d8" opacity={0.6} />
          {horizon ? (
            <g>
              <rect x={0} y={horizon.y - 50} width={1920} height={90} fill="rgba(235,232,220,0.85)" style={{ filter: "blur(14px)" }} opacity={1 - 0.4 * mist} />
              {mist > 0 ? <ellipse cx={960 - e.yaw * 900} cy={horizon.y - 10} rx={460 * mist} ry={80 * mist} fill="rgba(250,250,245,0.95)" style={{ filter: "blur(10px)" }} /> : null}
            </g>
          ) : null}
        </svg>
        <XView e={e} faces={G} lights={lights} flash={0.2} amb={0.45} seam="rgba(20,16,8,0.06)" gl smooth />
        {V(-4.5, 7.2, 1.7, workAt, "CULTIVANDO")}
        {V(-2.6, 8.2, 1.6, workAt + 10)}
        {V(9.0, 15.0, 1.8, nobodyAt, "CONVERSANDO", undefined, true)}
        {V(10.2, 15.6, 1.8, nobodyAt + 6)}
        {V(-8.0, 26, 1.8, noAt, undefined, undefined, false, 1)}
        {f >= foodAt && f < oldAt ? V(1.6, ey + 3.2, 1.8, foodAt, "OFERECE COMIDA", "E CONTINUA ANDANDO", false, 1) : null}
        {f >= oldAt ? V(0.4, 18.1, 1.25, oldAt, "O VORTIGAUNT VELHO", f >= vortAt ? "NÃO SABE SE FOI UMA VITÓRIA" : "OLHANDO O CÉU") : null}
      </AbsoluteFill>
      
      
      <Kin kind="light" t0={nobodySawAt} until={f1At} top={120} size={46} col="#fff6e0" text="pela primeira vez, ninguém viu o que vem depois" />
      {f >= f1At && f < darkAt + 20 ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 150, display: "flex", justifyContent: "center", gap: 40, fontFamily: MONO, opacity: 1 - P(f, darkAt, 20) }}>
          {([[f1At, "FINAL 1", "SALVA A TERRA", "RECEBE A CERTEZA DE QUE ESCOLHEU ERRADO", "#9fe6ff"], [f2At, "FINAL 2", "PERDE A TERRA", "NUNCA RECEBE A CONFIRMAÇÃO DE QUE ESCOLHEU CERTO", GREEN]] as [number, string, string, string, string][]).map(([t0, n, a, b, c]) => (
            <div key={n} style={{ width: 460, padding: "16px 20px", borderRadius: 12, background: "rgba(8,10,14,0.88)", border: `1.5px solid ${c}`, opacity: P(f, t0, 10) }}>
              <div style={{ fontSize: 14, letterSpacing: 4, color: c }}>{n}</div>
              <div style={{ fontSize: 26, letterSpacing: 2, color: TXT, marginTop: 6 }}>{a}</div>
              <div style={{ fontSize: 16, letterSpacing: 2, color: "rgba(242,240,247,0.75)", marginTop: 6 }}>{b}</div>
            </div>
          ))}
        </div>
      ) : null}
      {dark > 0 ? (
        <AbsoluteFill style={{ background: `rgba(0,0,0,${dark})` }}>
          <Kin kind="glitch" t0={notGmanAt} until={futureAt} top={430} size={46} text="não é o G-Man que vem buscar o Gordon" />
          
          <Kin kind="rise" t0={futureAt} top={480} size={54} col={GREEN} text="um futuro que ninguém conseguiu prever" />
        </AbsoluteFill>
      ) : null}
      <Hud f={f} yaw={e.yaw} eye={e} blips={[{ x: 0.4, y: 18.1, hot: f >= oldAt }]} msg={f >= playAt && f < oldAt ? "O FINAL AINDA É JOGÁVEL" : undefined} msgCol={GREEN} o={(1 - dark) * wake} />
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ================================================================================================= MÓDULO 4B refeito (08/10/2026)
// 28:38 a ferida · 28:56 as visões · 29:25 os lapsos · 29:41 a névoa — POV na estação e no gelo, Vortigaunts = silhueta
// verde (aprovada), Alyx = marcador, G-Man = sombra. Pedido dele: "o que os Vortigaunts sentem" melhor, corredor da Aperture
// e céu de Xen que façam sentido, o ritual interrompido sem genérico, os lapsos com muito mais esforço, a névoa bonita.
const buildStationRoom = (): XF[] => {
  const g = mk();
  g.room(-4, 4, 0, 9, 2.9, [74, 66, 56], [54, 46, 38], [40, 36, 30]);
  // o catre com cobertor, onde a Alyx está
  g.box(-1.0, 4.5, 0, 2.0, 1.7, 0.4, [60, 50, 40]);
  g.box(-0.95, 4.55, 0.4, 1.9, 1.6, 0.1, [96, 78, 60]);
  g.box(-0.9, 5.75, 0.5, 1.8, 0.4, 0.12, [150, 140, 120]);
  // caixotes, uma bancada com o lampião, a janela escura ao fundo
  g.box(2.5, 7.0, 0, 1.0, 1.0, 0.9, [98, 78, 50]);
  g.box(2.7, 7.2, 0.9, 0.7, 0.7, 0.6, [90, 72, 46]);
  g.box(-3.7, 6.2, 0, 0.8, 1.8, 0.85, [82, 66, 46]);
  g.box(-3.55, 6.9, 0.85, 0.22, 0.22, 0.34, [255, 196, 120], { emit: 0.9 });
  g.quad([-1.3, 8.99, 1.2], [1.3, 8.99, 1.2], [1.3, 8.99, 2.2], [-1.3, 8.99, 2.2], [24, 40, 62], [0, -1, 0], { emit: 0.25 });
  [-1.31, -0.02, 1.29].forEach((x) => g.box(x - 0.03, 8.95, 1.2, 0.06, 0.05, 1.0, [40, 34, 28]));
  return g.F;
};
const ALYX_C: V3 = [0, 5.25, 0.62];
const VORT_A: [number, number] = [-2.15, 5.9];
const VORT_B: [number, number] = [2.15, 5.75];
const roomEye = (f: number, o: { y?: number; pitch?: number; yaw?: number } = {}): Eye => ({ x: 0.06 * Math.sin(f / 70), y: o.y ?? 0.6, z: 1.75 + 0.01 * Math.sin(f / 9), yaw: o.yaw ?? 0.02 * Math.sin(f / 90), pitch: o.pitch ?? -0.2, F: 1000 });
const roomLights = (f: number, ritual: number, red = 0): XL[] => [
  { x: -3.4, y: 6.9, z: 1.4, col: [255, 190, 120], k: 0.75 + 0.05 * Math.sin(f / 4), r: 6 },
  { x: 0, y: 5.2, z: 1.6, col: red > 0.5 ? [255, 90, 70] : [110, 255, 170], k: 0.55 * ritual, r: 5 },
];
// o campo dos Vortigaunts (vortessência) envolvendo a Alyx. hole = o rasgo escuro no peito dela (as linhas DESVIAM dele);
// red = um dos Vortigaunts percebe (as linhas dele ficam vermelhas); snap = o campo se parte e vira poeira
const VortField: React.FC<{ e: Eye; f: number; power: number; hole: number; red?: number; snap?: number; vortsAt: [number, number][]; seeOnly?: number }> = ({ e, f, power, hole, red = 0, snap = 0, vortsAt }) => {
  const c = proj(e, ALYX_C);
  if (!c || power <= 0) return null;
  const R = (0.42 * e.F) / c.d; // raio do rasgo na tela
  const rh = R * hole;
  const lines: React.ReactNode[] = [];
  vortsAt.forEach(([vx, vy], vi) => {
    const h = proj(e, [vx + (vx < 0 ? 0.35 : -0.35), vy, 1.15]);
    if (!h) return;
    for (let k = 0; k < 9; k++) {
      const pts: [number, number][] = [];
      const spread = (k - 4) * 0.13;
      for (let i = 0; i <= 28; i++) {
        const t = i / 28;
        let x = h.x + (c.x - h.x) * t;
        let y = h.y + (c.y - h.y) * t + Math.sin(t * Math.PI) * spread * 260 + Math.sin(t * 9 + f / 9 + k) * 6 * (1 - t);
        // ao chegar perto do rasgo, a linha contorna em vez de atravessar
        const dx = x - c.x;
        const dy = y - c.y;
        const dd = Math.hypot(dx, dy);
        if (rh > 2 && dd < rh * 1.35) {
          const push = (rh * 1.35 - dd) * 1.05;
          x += (dx / (dd + 1e-6)) * push;
          y += (dy / (dd + 1e-6)) * push;
        }
        if (snap > 0) {
          x += (rnd(vi * 97 + k * 13 + i) - 0.5) * 260 * snap;
          y += (rnd(vi * 53 + k * 7 + i) - 0.3) * 200 * snap;
        }
        pts.push([x, y]);
      }
      const isRed = vi === 0 && red > 0 && Math.floor(f / 3) % 3 !== 0;
      const col = isRed ? "#ff6a50" : "#8dffa8";
      const d = pts.map(([x, y], i) => `${i ? "L" : "M"} ${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
      lines.push(
        <g key={`${vi}-${k}`} opacity={power * (1 - snap)}>
          <path d={d} fill="none" stroke={col} strokeWidth={5} opacity={0.16} style={{ filter: "blur(3px)" }} />
          <path d={d} fill="none" stroke={col} strokeWidth={1.4} strokeDasharray="14 10" strokeDashoffset={-f * (2.4 + k * 0.2)} opacity={0.85} />
        </g>,
      );
    }
  });
  // o rasgo: borda irregular que respira, por dentro nada (o campo não entra)
  const edge = Array.from({ length: 48 }).map((_, i) => {
    const a = (i / 48) * Math.PI * 2;
    const r = rh * (0.82 + 0.22 * rnd(i * 7 + Math.floor(f / 6)) + 0.06 * Math.sin(f / 7 + i));
    return `${(c.x + Math.cos(a) * r).toFixed(1)},${(c.y + Math.sin(a) * r * 0.78).toFixed(1)}`;
  });
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <defs>
        <radialGradient id="vfHole" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="rgba(0,0,0,0.95)" />
          <stop offset="0.75" stopColor="rgba(6,2,10,0.85)" />
          <stop offset="1" stopColor="rgba(6,2,10,0)" />
        </radialGradient>
      </defs>
      {[0, 1, 2].map((k) => {
        const t = ((f / 40 + k / 3) % 1);
        return <ellipse key={k} cx={c.x} cy={c.y} rx={R * (1.6 + t * 2.4)} ry={R * (1.0 + t * 1.5)} fill="none" stroke="#8dffa8" strokeWidth={1.5} opacity={(1 - t) * 0.5 * power * (1 - snap)} />;
      })}
      {lines}
      {hole > 0.02 ? (
        <g opacity={hole * (1 - snap)}>
          <ellipse cx={c.x} cy={c.y} rx={rh * 1.1} ry={rh * 0.86} fill="url(#vfHole)" />
          <polygon points={edge.join(" ")} fill="rgba(2,0,4,0.9)" stroke="#c79bff" strokeWidth={1.6} opacity={0.9} />
        </g>
      ) : null}
      {snap > 0
        ? Array.from({ length: 70 }).map((_, i) => {
            const a = rnd(i * 3) * Math.PI * 2;
            const r = R * (1 + rnd(i * 5) * 4) * (0.4 + snap);
            return <circle key={i} cx={c.x + Math.cos(a) * r} cy={c.y + Math.sin(a) * r * 0.7 - snap * 60 * rnd(i)} r={1.6} fill="#8dffa8" opacity={(1 - snap) * 0.8} />;
          })
        : null}
    </svg>
  );
};
const Vorts: React.FC<{ e: Eye; f: number; at: [number, number][]; o?: number; label?: string; sub?: string; eyes?: number }> = ({ e, f, at, o = 1, label, sub, eyes = 0 }) => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    {at.map(([x, y], k) => (
      <SilhouetteAt key={k} e={e} x={x} y={y} h={1.85} src="hl3silh/vort_silh.png" ar={270 / 400} f={f} o={o} flip={x > 0} rim="rgba(141,255,168,0.8)" top="#2e3a28" bot="#0a0f0a" label={k === 0 ? label : undefined} labelCol={GREEN} sub={k === 0 ? sub : undefined} />
    ))}
  </AbsoluteFill>
);
const HevScan: React.FC<{ f: number; at: number; nothingAt: number; o?: number }> = ({ f, at: t0, nothingAt, o = 1 }) =>
  f >= t0 ? (
    <div style={{ position: "absolute", left: 90, top: 110, width: 430, padding: "14px 18px", borderRadius: 10, background: "rgba(14,10,4,0.82)", border: `1.5px solid ${AMB}`, fontFamily: MONO, color: AMB, opacity: P(f, t0, 10) * o }}>
      <div style={{ fontSize: 14, letterSpacing: 5 }}>H.E.V. · SCAN · ALYX VANCE</div>
      <svg width={394} height={46} style={{ marginTop: 8 }}>
        <polyline points={Array.from({ length: 80 }).map((_, i) => { const ph = ((i * 5 + f * 3) % 120) / 120; const y = ph > 0.46 && ph < 0.5 ? 6 : ph > 0.5 && ph < 0.53 ? 40 : 24 + 2 * Math.sin(i / 3); return `${i * 5},${y}`; }).join(" ")} fill="none" stroke={AMB} strokeWidth={1.6} />
      </svg>
      {[["PULSO", "52 BPM"], ["TEMPERATURA", "36,1 °C"], ["LESÕES", "NENHUMA"]].map(([k, v]) => (
        <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 16, letterSpacing: 3, marginTop: 6, color: CREAM }}><span style={{ color: AMB }}>{k}</span><span>{v}</span></div>
      ))}
      {f >= nothingAt ? <div style={{ fontSize: 20, letterSpacing: 4, color: "#bfff9a", marginTop: 10, opacity: P(f, nothingAt, 8) }}>NADA DETECTADO</div> : null}
    </div>
  ) : null;

// ---------------------------------------------------------------- 28:38 a ferida (o que os Vortigaunts sentem)
export const HL4WoundField: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [auraAt, woundAt, feelAt, seeAt] = ats(p, ["auraAt", "woundAt", "feelAt", "seeAt"]);
  const G = useMemo(() => buildStationRoom(), []);
  const e = roomEye(f, { y: keys(f, [[0, 0.4], [life, 1.0]]) });
  const power = P(f, auraAt, 24);
  const hole = P(f, woundAt, 30);
  const c = proj(e, ALYX_C);
  return (
    <AbsoluteFill style={{ background: "#050404", overflow: "hidden" }}>
      <XView e={e} faces={G} lights={roomLights(f, power)} flash={0.4} amb={0.16} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <FlagAt e={e} pt={[0, 5.05, 0.5]} label="ALYX" col={ORANGE} f={f} sub="INCONSCIENTE" />
      </svg>
      <Vorts e={e} f={f} at={[VORT_A, VORT_B]} label="VORTIGAUNTS" sub="O CAMPO DELES" />
      <VortField e={e} f={f} power={power} hole={hole} vortsAt={[VORT_A, VORT_B]} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {c ? <Call e={e} f={f} pt={ALYX_C} from={woundAt + 20} until={life} text="ALGO FICOU NELA" sub="DEPOIS DO TEMPO COM O G-MAN" col={VIO} dx={440} dy={-300} /> : null}
      </svg>
      <HevScan f={f} at={auraAt + 6} nothingAt={seeAt} />
      {f >= feelAt ? (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 150, display: "flex", justifyContent: "center", gap: 18, fontFamily: MONO, fontSize: 22, letterSpacing: 5 }}>
          <span style={{ padding: "8px 16px", border: "1.5px solid #8dffa8", color: "#8dffa8", borderRadius: 8, background: "rgba(6,20,12,0.8)", opacity: P(f, feelAt, 8) }}>ELES SENTEM</span>
          {f >= seeAt ? <span style={{ position: "relative", padding: "8px 16px", border: "1.5px solid rgba(242,240,247,0.5)", color: "rgba(242,240,247,0.7)", borderRadius: 8, background: "rgba(10,10,12,0.8)", opacity: P(f, seeAt, 8) }}>VER<span style={{ position: "absolute", left: 8, right: 8, top: "50%", height: 3, background: RED, transform: `scaleX(${P(f, seeAt + 6, 8)})`, transformOrigin: "left" }} /></span> : null}
        </div>
      ) : null}
      <Hud f={f} yaw={e.yaw} eye={e} blips={[{ x: 0, y: 5.25 }]} msg={f < woundAt ? "OS VORTIGAUNTS QUE ACOMPANHAM O GRUPO" : undefined} msgCol={GREEN} />
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// as visões novas: o corredor da Aperture (POV andando, painéis brancos, luz fria) e o céu de Xen (o mesmo XenVista do vídeo)
const buildApertureHall = (): XF[] => {
  const g = mk();
  const L = 40;
  for (let y = 0; y < L; y += 2) {
    for (let z = 0; z < 4; z += 1) {
      const k = 0.92 + rnd(y * 7 + z) * 0.1;
      g.quad([-2, y, z], [-2, y + 2, z], [-2, y + 2, z + 1], [-2, y, z + 1], [214 * k, 214 * k, 208 * k], [1, 0, 0]);
      g.quad([2, y + 2, z], [2, y, z], [2, y, z + 1], [2, y + 2, z + 1], [214 * k, 214 * k, 208 * k], [-1, 0, 0]);
    }
    g.quad([-2, y, 0], [2, y, 0], [2, y + 2, 0], [-2, y + 2, 0], [86, 88, 90], [0, 0, 1]);
    g.quad([-2, y + 2, 4], [2, y + 2, 4], [2, y, 4], [-2, y, 4], [60, 62, 64], [0, 0, -1]);
    if (y % 6 === 0) g.quad([-0.6, y + 0.2, 3.99], [0.6, y + 0.2, 3.99], [0.6, y + 1.6, 3.99], [-0.6, y + 1.6, 3.99], [240, 248, 255], [0, 0, -1], { emit: 1 });
    // a faixa laranja na parede (o padrão da Aperture)
    g.quad([-1.99, y, 0.9], [-1.99, y + 2, 0.9], [-1.99, y + 2, 1.05], [-1.99, y, 1.05], [240, 140, 40], [1, 0, 0], { emit: 0.5 });
    g.quad([1.99, y + 2, 0.9], [1.99, y, 0.9], [1.99, y, 1.05], [1.99, y + 2, 1.05], [240, 140, 40], [-1, 0, 0], { emit: 0.5 });
  }
  g.quad([-2, L, 0], [2, L, 0], [2, L, 4], [-2, L, 4], [30, 120, 200], [0, -1, 0], { emit: 0.6 });
  return g.F;
};
const VisAperture: React.FC<{ f: number; at: number }> = ({ f, at: t0 }) => {
  const G = useMemo(() => buildApertureHall(), []);
  const t = f - t0;
  const e: Eye = { x: 0.1 * Math.sin(t / 30), y: 2 + ((t * 0.09) % 26), z: 1.7, yaw: 0.04 * Math.sin(t / 50), pitch: -0.02, F: 960 };
  return (
    <AbsoluteFill style={{ background: "#0c0e10" }}>
      <XView e={e} faces={G} lights={[{ x: 0, y: e.y + 5, z: 3.6, col: [235, 245, 255], k: 0.9, r: 12 }]} flash={0.7} amb={0.25} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {(() => {
          const q = proj(e, [-1.98, e.y + 6, 2.2]);
          return q ? <text x={q.x + 10} y={q.y} fill="#4a4a4a" fontFamily={FONT} fontWeight={700} fontSize={Math.min(48, Math.max(14, 300 / q.d))}>APERTURE SCIENCE</text> : null;
        })()}
      </svg>
    </AbsoluteFill>
  );
};
const VisXen: React.FC<{ f: number; at: number }> = ({ f, at: t0 }) => {
  const t = f - t0;
  const e: Eye = { x: 0, y: -10 + t * 0.12, z: 6, yaw: 0.05 + t * 0.0012, pitch: 0.12, F: 900 };
  return <XenVista e={e} f={f} />;
};
// ---------------------------------------------------------------- 28:56 as visões · o G-Man na borda · o ritual interrompido
type Vis4 = { src: string; from: number; label: string; at: number; rate?: number; ui?: string };
export const HL4Visions: React.FC<PR & { frags?: Vis4[] }> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const frags = (p.frags as Vis4[] | undefined) ?? [];
  const [rushAt, gmanAt, noticeAt, breakAt] = ats(p, ["rushAt", "gmanAt", "noticeAt", "breakAt"]);
  const G = useMemo(() => buildStationRoom(), []);
  const firstAt = frags.length ? frags[0].at : 1e9;
  const uiOf = (i: number) => ["alyxAge", "citadel", "aperture", "xen"][i] ?? "alyxAge";
  const roomPhase = f < firstAt || f >= noticeAt;
  const voidPhase = f >= gmanAt && f < noticeAt;
  const rush = f >= rushAt && f < gmanAt;
  let cur = -1;
  frags.forEach((v, i) => {
    if (f >= v.at) cur = i;
  });
  if (rush) cur = Math.floor((f - rushAt) / 6) % Math.max(1, frags.length);
  const cutAge = cur >= 0 ? (rush ? (f - rushAt) % 6 : f - frags[cur].at) : 99;
  const glitch = cutAge < 5 ? 1 - cutAge / 5 : 0;
  const broken = f >= breakAt;
  const vortA: [number, number] = [VORT_A[0] - P(f, breakAt, 30) * 1.4, VORT_A[1] + P(f, breakAt, 30) * 0.6];
  const e = roomEye(f, { y: 0.8 });
  const renderVis = (i: number, at: number) => {
    const ui = uiOf(i);
    if (ui === "alyxAge") return <VisAlyxAge f={f} at={at} />;
    if (ui === "citadel") return <VisCitadel f={f} at={at} />;
    if (ui === "aperture") return <VisAperture f={f} at={at} />;
    return <VisXen f={f} at={at} />;
  };
  // o vazio verde das visões, onde ficam os quadros e, na borda, ele
  const ve: Eye = { x: 0.05 * Math.sin(f / 80), y: keys(f, [[gmanAt, 0], [noticeAt, 3.2]]), z: 1.65, yaw: 0, pitch: -0.07, F: 1000 };
  // a galeria das visões: quadros inclinados para o corredor, dos dois lados; ele fica no fim do corredor
  const frames: { c: V3; side: number }[] = [
    { c: [-2.4, 5.5, 1.75], side: -1 },
    { c: [2.4, 7.5, 1.75], side: 1 },
    { c: [-2.4, 9.5, 1.75], side: -1 },
    { c: [2.4, 11.5, 1.75], side: 1 },
  ];
  const GM: V3 = [0.15, 16.5, 0];
  const quadOf = (c: V3, side: number): [V3, V3, V3, V3] => {
    const w = 2.7;
    const h = w * 0.5625;
    const phi = (40 * Math.PI) / 180;
    const u: V3 = side < 0 ? [Math.cos(phi), Math.sin(phi), 0] : [Math.cos(phi), -Math.sin(phi), 0];
    const L: V3 = [c[0] - (u[0] * w) / 2, c[1] - (u[1] * w) / 2, 0];
    const Rr: V3 = [c[0] + (u[0] * w) / 2, c[1] + (u[1] * w) / 2, 0];
    return [[L[0], L[1], c[2] + h / 2], [Rr[0], Rr[1], c[2] + h / 2], [Rr[0], Rr[1], c[2] - h / 2], [L[0], L[1], c[2] - h / 2]];
  };
  return (
    <AbsoluteFill style={{ background: "#020304", overflow: "hidden" }}>
      {roomPhase ? (
        <>
          <XView e={e} faces={G} lights={roomLights(f, broken ? 1 - P(f, breakAt, 20) : 1, f >= noticeAt && !broken ? 1 : 0)} flash={0.4} amb={0.16} />
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            <FlagAt e={e} pt={[0, 5.05, 0.5]} label="ALYX" col={ORANGE} f={f} sub={broken ? "RITUAL INTERROMPIDO" : "O RITUAL"} />
          </svg>
          <Vorts e={e} f={f} at={[vortA, VORT_B]} label={f >= noticeAt ? "UM VORTIGAUNT" : "VORTIGAUNTS"} sub={broken ? "SE AFASTA DELA" : f >= noticeAt ? "PERCEBE ALGUMA COISA" : "O RITUAL"} eyes={f >= noticeAt && !broken ? 1 : 0} />
          <VortField e={e} f={f} power={broken ? 1 : P(f, 0, 16)} hole={0.85} red={f >= noticeAt ? 1 : 0} snap={P(f, breakAt, 24)} vortsAt={[vortA, VORT_B]} />
          {f < firstAt ? <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 50%, rgba(80,255,150,${0.25 * P(f, firstAt - 20, 20)}) 0%, rgba(0,0,0,0) 60%)` }} /> : null}
        </>
      ) : null}
      {/* as visões em tela cheia, com o tom verde do ritual e o corte com falha */}
      {!roomPhase && !voidPhase && cur >= 0 ? (
        <AbsoluteFill style={{ filter: `sepia(0.35) hue-rotate(${70 + glitch * 40}deg) saturate(1.1) contrast(1.1)`, transform: `scale(${1.04 + cutAge * 0.0006}) translateX(${(rnd(f) - 0.5) * 50 * glitch}px)` }}>
          {renderVis(cur, rush ? f - cutAge : frags[cur].at)}
        </AbsoluteFill>
      ) : null}
      {!roomPhase && !voidPhase && cur >= 0 && !rush ? (
        <div key={cur} style={{ position: "absolute", left: 110, bottom: 130, fontFamily: MONO, color: "#d8ffe4", textShadow: "0 4px 20px #000", opacity: P(f, frags[cur].at, 6) }}>
          <div style={{ fontSize: 16, letterSpacing: 6, color: GREEN, opacity: 0.85 }}>VISÃO {String(cur + 1).padStart(2, "0")}</div>
          <div style={{ fontSize: 50, letterSpacing: 4 }}>{frags[cur].label}</div>
        </div>
      ) : null}
      {voidPhase ? (
        <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 44%, #0a2014 0%, #030805 62%, #010302 100%)" }}>
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
            <defs>
              <radialGradient id="gmGlow" cx="0.5" cy="0.5" r="0.5">
                <stop offset="0" stopColor="rgba(190,255,215,0.35)" />
                <stop offset="1" stopColor="rgba(190,255,215,0)" />
              </radialGradient>
            </defs>
            {/* o chão do vazio: linhas que somem no escuro, até os pés dele */}
            {Array.from({ length: 22 }).map((_, k) => {
              const y = 1 + k * 0.9;
              const a = proj(ve, [-3.2, y, 0]);
              const b = proj(ve, [3.2, y, 0]);
              return a && b ? <line key={`h${k}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#8dffa8" strokeWidth={1} opacity={0.12 * (1 - k / 22)} /> : null;
            })}
            {[-3.2, -1.6, 0, 1.6, 3.2].map((x, k) => {
              const a = proj(ve, [x, 1, 0]);
              const b = proj(ve, [x * 0.2, 20, 0]);
              return a && b ? <line key={`v${k}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#8dffa8" strokeWidth={1} opacity={0.07} /> : null;
            })}
            {/* a luz fraca atrás dele, e a poça de luz no chão */}
            {(() => {
              const q = proj(ve, [GM[0], GM[1] + 1.2, 1.3]);
              const fl = proj(ve, [GM[0], GM[1], 0]);
              return q && fl ? (
                <g opacity={P(f, gmanAt + 6, 30)}>
                  <ellipse cx={q.x} cy={q.y} rx={260} ry={300} fill="url(#gmGlow)" />
                  <ellipse cx={fl.x} cy={fl.y} rx={90} ry={14} fill="rgba(190,255,215,0.18)" />
                </g>
              ) : null;
            })()}
          </svg>
          {/* os quadros das visões dos dois lados, inclinados para o corredor */}
          <div style={{ position: "absolute", inset: 0 }}>
            {[...frames.keys()].reverse().map((i) => {
              const fr = frames[i];
              return (
                <Pinned key={i} e={ve} w={1920} h={1080} corners={quadOf(fr.c, fr.side)} o={(0.9 - 0.12 * i) * (0.85 + 0.15 * Math.sin(f / 11 + i))}>
                  <div style={{ width: 1920, height: 1080, position: "relative", overflow: "hidden", filter: "sepia(0.4) hue-rotate(70deg) brightness(0.9)" }}>
                    {renderVis(i, frags[i] ? frags[i].at : 0)}
                    <div style={{ position: "absolute", inset: 0, boxShadow: "inset 0 0 0 8px rgba(141,255,168,0.55)" }} />
                  </div>
                </Pinned>
              );
            })}
          </div>
          {/* no fim do corredor: ele, parado, em pé no chão */}
          {(() => {
            const b = proj(ve, GM);
            const t = proj(ve, [GM[0], GM[1], 1.85]);
            if (!b || !t) return null;
            const h = b.y - t.y;
            return (
              <div style={{ position: "absolute", left: b.x - h * 0.185, top: t.y, width: h * 0.37, height: h, opacity: P(f, gmanAt + 10, 40), filter: "drop-shadow(0 0 2px rgba(220,255,230,0.7)) drop-shadow(0 0 10px rgba(141,255,168,0.35))" }}>
                <div style={{ position: "absolute", inset: 0, WebkitMaskImage: `url(${staticFile("hl3silh/gman_silh.png")})`, maskImage: `url(${staticFile("hl3silh/gman_silh.png")})`, WebkitMaskSize: "100% 100%", maskSize: "100% 100%", background: "linear-gradient(180deg, #121a16, #020403 80%)" }} />
              </div>
            );
          })()}
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 120, textAlign: "center", fontFamily: MONO }}>
            <div style={{ fontSize: 16, letterSpacing: 8, color: GREEN, opacity: P(f, gmanAt + 30, 12) }}>NA BORDA DE TUDO ISSO</div>
            <div style={{ fontSize: 20, letterSpacing: 5, color: CREAM, marginTop: 8, opacity: P(f, gmanAt + 70, 12) }}>NÃO INTERFERE · NÃO FALA · SÓ ESPERA</div>
          </div>
        </AbsoluteFill>
      ) : null}
      {roomPhase ? <Hud f={f} yaw={e.yaw} eye={e} blips={[{ x: 0, y: 5.25 }]} msg={f >= noticeAt && !broken ? "UM VORTIGAUNT PERCEBE ALGUMA COISA" : undefined} msgCol={RED} /> : null}
      <AbsoluteFill style={{ background: "#e8fff0", opacity: interpolate(f, [breakAt, breakAt + 1, breakAt + 8], [0, 0.5, 0], C), pointerEvents: "none" }} />
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 29:25 os lapsos (fragmentos que saem dela: pessoas, lugares, os Vortigaunts estranhos)
const PersonFile: React.FC<{ f: number; seed: number; name: string }> = ({ f, seed, name }) => (
  <div style={{ width: 230, padding: 12, background: "rgba(8,14,10,0.92)", border: `1.5px solid ${RED}`, borderRadius: 8, fontFamily: MONO }}>
    <div style={{ height: 150, position: "relative", overflow: "hidden", background: "#050806", border: "1px solid rgba(255,93,77,0.4)" }}>
      {Array.from({ length: 15 }).map((_, j) => <div key={j} style={{ position: "absolute", left: 0, right: 0, top: j * 10, height: 10, background: `rgba(255,140,120,${0.04 + 0.14 * rnd(j + seed * 31 + Math.floor(f / 2) * 5)})`, transform: `translateX(${(rnd(j * 3 + f + seed) - 0.5) * 24}px)` }} />)}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 8, textAlign: "center", fontSize: 12, letterSpacing: 2, color: RED }}>FOTO · SEM REGISTRO</div>
    </div>
    <div style={{ fontSize: 13, letterSpacing: 3, color: "rgba(242,240,247,0.6)", marginTop: 8 }}>ELA CHAMA PELO NOME</div>
    <div style={{ fontSize: 20, letterSpacing: 2, color: CREAM, marginTop: 2 }}>{name}</div>
  </div>
);
const PlaceCard: React.FC<{ f: number; kind: number }> = ({ f, kind }) => (
  <div style={{ width: 260, padding: 10, background: "#efe6cf", borderRadius: 4, boxShadow: "0 14px 30px rgba(0,0,0,0.6)", transform: `rotate(${(kind - 1) * 4}deg)` }}>
    <div style={{ height: 150, position: "relative", overflow: "hidden", background: "#111" }}>
      {kind === 0 ? <div style={{ transform: "scale(0.4)", transformOrigin: "0 0" }}><AperturePanel o={1} /></div> : null}
      {kind === 1 ? (
        <svg width={240} height={150}>
          <defs><radialGradient id={`xc${kind}`} cx="0.6" cy="0.3" r="0.9"><stop offset="0" stopColor="#c86a5a" /><stop offset="0.5" stopColor="#5a3260" /><stop offset="1" stopColor="#1a1024" /></radialGradient></defs>
          <rect width={240} height={150} fill={`url(#xc${kind})`} />
          {[[40, 70, 34], [130, 50, 22], [190, 90, 40]].map(([x, y, r], i) => <g key={i}><ellipse cx={x} cy={y} rx={r} ry={r * 0.35} fill="#2a1a2a" /><path d={`M ${x - r * 0.8} ${y} Q ${x} ${y + r * 1.2} ${x + r * 0.8} ${y}`} fill="#1a101a" /></g>)}
          {Array.from({ length: 30 }).map((_, i) => <circle key={i} cx={rnd(i) * 240} cy={rnd(i * 3) * 60} r={0.8} fill="#fff" opacity={0.6} />)}
        </svg>
      ) : null}
      {kind === 2 ? <div style={{ transform: "scale(0.125)", transformOrigin: "0 0", width: 1920, height: 1080 }}><VisCitadel f={f} at={f - 60} /></div> : null}
    </div>
    <div style={{ fontFamily: "'Courier New', monospace", fontSize: 15, color: "#2a2418", marginTop: 6 }}>{["“eu já estive aqui”", "“eu conheço esse céu”", "“essa não é a de City 17”"][kind]}</div>
  </div>
);
export const HL4Lapses: React.FC<PR & { rows?: { k: string; v: string; at: number }[] }> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [wakeAt, worseAt] = ats(p, ["wakeAt", "worseAt"]);
  const rows = (p.rows as { k: string; v: string; at: number }[] | undefined) ?? [];
  const G = useMemo(() => buildStationRoom(), []);
  const e = roomEye(f, { y: keys(f, [[0, 0.5], [life, 1.1]]), pitch: -0.18 });
  const worse = f >= worseAt;
  const strange = rows[2] ? f >= rows[2].at : false;
  const back = strange ? P(f, rows[2].at, 40) : 0;
  const vA: [number, number] = [VORT_A[0] - back * 0.9, VORT_A[1] + back * 0.9];
  const vB: [number, number] = [VORT_B[0] + back * 0.9, VORT_B[1] + back * 0.7];
  const c = proj(e, [0, 5.05, 1.0]);
  const fly = (t0: number, dx: number, dy: number) => {
    const u = P(f, t0, 16);
    return c ? { left: c.x + dx * u, top: c.y + dy * u, opacity: u, transform: `translate(-50%, -50%) scale(${0.4 + 0.6 * u})` } : { display: "none" };
  };
  return (
    <AbsoluteFill style={{ background: "#050404", overflow: "hidden" }}>
      <XView e={e} faces={G} lights={roomLights(f, strange ? 0.5 + 0.5 * (Math.floor(f / 4) % 2) : 0.4, strange ? 1 : 0)} flash={0.4} amb={0.18} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <FlagAt e={e} pt={[0, 5.05, 0.55]} label="ALYX" col={ORANGE} f={f} sub={worse ? "LAPSOS · PIORANDO" : "ACORDOU · PARECE MELHOR"} />
      </svg>
      <Vorts e={e} f={f} at={[vA, vB]} o={0.95} label={strange ? "VORTIGAUNTS" : undefined} sub={strange ? "AGEM DE UM JEITO ESTRANHO" : undefined} eyes={strange ? 1 : 0} />
      {/* o pulso dela no HEV */}
      <div style={{ position: "absolute", left: 90, bottom: 150, width: 430, padding: "14px 18px", borderRadius: 10, background: "rgba(14,10,4,0.82)", border: `1.5px solid ${worse ? RED : AMB}`, fontFamily: MONO, opacity: P(f, wakeAt, 10) }}>
        <div style={{ fontSize: 14, letterSpacing: 5, color: AMB }}>H.E.V. · ALYX VANCE · DEPOIS DO RITUAL</div>
        <Ecg f={f} bpm={worse ? 108 : 70} jitter={worse ? 1 : 0} col={worse ? RED : "#bfff9a"} w={394} h={54} />
        <div style={{ fontSize: 18, letterSpacing: 3, color: worse ? RED : "#bfff9a", marginTop: 4 }}>{worse ? "OS LAPSOS FICAM PIORES" : "ESTÁVEL"}</div>
      </div>
      {/* os fragmentos saindo dela */}
      {rows[0] && f >= rows[0].at
        ? ["NÃO CONSTA", "NUNCA EXISTIU AQUI", "?"].map((nm, i) => (
            <div key={i} style={{ position: "absolute", ...fly(rows[0].at + i * 6, -620 + i * 250, -230 + i * 40) }}>
              <PersonFile f={f} seed={i} name={nm} />
            </div>
          ))
        : null}
      {rows[1] && f >= rows[1].at
        ? [0, 1, 2].map((i) => (
            <div key={i} style={{ position: "absolute", ...fly(rows[1].at + i * 6, 280 + i * 230, -260 + i * 110) }}>
              <PlaceCard f={f} kind={i} />
            </div>
          ))
        : null}
      {worse ? <div style={{ position: "absolute", right: 90, top: 120, fontFamily: MONO, fontSize: 16, letterSpacing: 6, color: RED, opacity: P(f, worseAt, 8) }}>REGISTRO DE LAPSOS</div> : null}
      {rows.map((r, i) => {
        if (f < r.at || !c) return null;
        const pos = [{ left: c.x - 620, top: c.y - 420 }, { left: c.x + 300, top: c.y - 430 }, { left: c.x - 160, top: c.y + 250 }][i] ?? { left: 0, top: 0 };
        return (
          <div key={i} style={{ position: "absolute", ...pos, padding: "6px 12px", borderLeft: `3px solid ${RED}`, background: "rgba(30,6,6,0.8)", fontFamily: MONO, opacity: P(f, r.at, 8) }}>
            <div style={{ fontSize: 12, letterSpacing: 4, color: RED }}>{r.k}</div>
            <div style={{ fontSize: 18, letterSpacing: 2, color: CREAM }}>{r.v}</div>
          </div>
        );
      })}
      <Hud f={f} yaw={e.yaw} eye={e} blips={[{ x: 0, y: 5.25 }]} />
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 29:41 a névoa (lá fora, à noite, no gelo: o que eles sentem adiante)
const FOG_D = 120; // distância do banco de névoa ao norte (m)
const FOG_SECTOR = [Math.PI * 0.36, Math.PI * 0.64]; // ângulos (a partir do leste) que dão na névoa
export const HL4VortSight: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [tryAt, askAt, senseAt, dirAt, fogAt, goneAt, afterAt, neverAt] = ats(p, ["tryAt", "askAt", "senseAt", "dirAt", "fogAt", "goneAt", "afterAt", "neverAt"]);
  void tryAt;
  const G = useMemo(() => {
    const g = mk();
    iceField(g);
    // a estação atrás e umas pedras/montes de neve no caminho
    [[-14, 26, 3], [11, 34, 2.4], [-30, 60, 4], [26, 70, 3.2], [-6, 46, 1.6]].forEach(([x, y, s]) => g.prism(x, y, 0, s * 0.5, s, 7, [176, 190, 204]));
    return g.F;
  }, []);
  const e: Eye = { x: 0, y: keys(f, [[0, -2], [life, 1]]), z: 1.7, yaw: keys(f, [[0, 0.05], [dirAt - 6, 0.05], [dirAt + 30, 0.0], [life, 0.0]]), pitch: keys(f, [[0, -0.05], [senseAt, -0.05], [senseAt + 30, -0.09], [fogAt, -0.04], [life, -0.03]]), F: 1000 };
  const V0: V3 = [0, 6, 0];
  const nodes: { pt: V3; k: string }[] = [
    { pt: [-12, 30, 0], k: "GELO FINO" },
    { pt: [16, 42, 0], k: "ABRIGO" },
    { pt: [-34, 62, 0], k: "ÁGUA ABERTA" },
    { pt: [40, 84, 0], k: "CRIATURAS" },
    { pt: [-6, 70, 0], k: "PASSAGEM" },
  ];
  const fog = P(f, fogAt, 30);
  const gone = P(f, goneAt, 20);
  const pulses = f >= senseAt ? [0, 1, 2, 3, 4, 5].map((k) => ((f - senseAt) / 75 + k / 6) % 1) : [];
  const ringPts = (r: number, cut: boolean) => {
    const segs: string[][] = [[]];
    for (let i = 0; i <= 90; i++) {
      const a = (i / 90) * Math.PI;
      const inFog = a > FOG_SECTOR[0] && a < FOG_SECTOR[1];
      if (cut && inFog && r > FOG_D * 0.92) {
        if (segs[segs.length - 1].length) segs.push([]);
        continue;
      }
      const q = proj(e, [V0[0] + Math.cos(a) * r, V0[1] + Math.sin(a) * r, 0.05]);
      if (q) segs[segs.length - 1].push(`${q.x.toFixed(0)},${q.y.toFixed(0)}`);
    }
    return segs.filter((s) => s.length > 1);
  };
  // o banco de névoa: camadas suaves, deslizando devagar, mais densas na direção do norte
  const fogLayer = (k: number) => {
    const a = proj(e, [-90, FOG_D + k * 8, 3 + k * 4]);
    const b = proj(e, [90, FOG_D + k * 8, 3 + k * 4]);
    const m = proj(e, [0, FOG_D + k * 8, 0]);
    if (!a || !b || !m) return null;
    const cx = (a.x + b.x) / 2 + Math.sin(f / 80 + k) * 40;
    return <ellipse key={k} cx={cx} cy={m.y - (a.y - m.y) * 0.2 - k * 6} rx={(b.x - a.x) * (0.36 + 0.05 * k)} ry={Math.max(40, (m.y - a.y) * (1.2 + 0.3 * k))} fill={`rgba(206,220,226,${(0.22 - k * 0.025) * fog})`} filter="url(#fgBlur)" />;
  };
  return (
    <AbsoluteFill style={{ background: "#03080f", overflow: "hidden" }}>
      <NightSky e={e} f={f} />
      <XView e={e} faces={G} lights={[{ x: 0, y: 4, z: 6, col: [150, 190, 230], k: 0.35, r: 40 }]} flash={0.3} amb={0.3} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <defs><filter id="fgBlur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="38" /></filter></defs>
        {[0, 1, 2, 3, 4, 5].map(fogLayer)}
        {/* os pulsos: atravessam o gelo e marcam o que encontram; na direção da névoa, morrem nela */}
        {pulses.map((u, k) =>
          ringPts(u * 150, f >= fogAt).map((s, j) => <polyline key={`${k}-${j}`} points={s.join(" ")} fill="none" stroke="#8dffa8" strokeWidth={2} opacity={(1 - u) * 0.75} style={{ filter: "drop-shadow(0 0 4px #8dffa8)" }} />),
        )}
        {f >= senseAt
          ? nodes.map((n, i) => {
              const dist = Math.hypot(n.pt[0] - V0[0], n.pt[1] - V0[1]);
              const reach = senseAt + (dist / 150) * 75;
              if (f < reach) return null;
              const q = proj(e, n.pt);
              return q ? (
                <g key={i} opacity={P(f, reach, 8)}>
                  <circle cx={q.x} cy={q.y} r={7} fill="none" stroke="#8dffa8" strokeWidth={2} />
                  <line x1={q.x} y1={q.y} x2={q.x} y2={q.y - 40} stroke="#8dffa8" strokeWidth={1.2} />
                  <text x={q.x + 6} y={q.y - 46} fill="#c8ffe8" fontFamily={MONO} fontSize={15} letterSpacing={3}>{n.k}</text>
                </g>
              ) : null;
            })
          : null}
        {/* a direção: uma seta no gelo apontando para a névoa */}
        {f >= dirAt ? (() => {
          const a = proj(e, [0, 14, 0.05]);
          const b = proj(e, [0, FOG_D * 0.85, 0.05]);
          return a && b ? <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#c8ffe8" strokeWidth={2} strokeDasharray="12 10" opacity={P(f, dirAt, 12) * 0.8} /> : null;
        })() : null}
        {f >= goneAt ? (() => {
          const q = proj(e, [0, FOG_D, 6]);
          return q ? <text x={q.x} y={q.y} textAnchor="middle" fill="#e8f2f4" fontFamily={MONO} fontSize={22} letterSpacing={8} opacity={P(f, goneAt, 10)}>TUDO SOME</text> : null;
        })() : null}
      </svg>
      <Vorts e={e} f={f} at={[[-1.6, 5], [1.5, 5.6]]} label="VORTIGAUNTS" sub={f >= senseAt ? "SENTEM UM POUCO DO QUE EXISTE ADIANTE" : "TENTAM ENXERGAR O CAMINHO"} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <FlagAt e={e} pt={[0.3, 3.4, 0]} label="ALYX" col={ORANGE} f={f} o={P(f, askAt - 6, 8)} sub={f >= askAt && f < senseAt ? "“O QUE VOCÊS ESTÃO VENDO?”" : undefined} />
      </svg>
      <div style={{ position: "absolute", left: 90, top: 120, fontFamily: MONO }}>
        {f >= afterAt ? <div style={{ fontSize: 20, letterSpacing: 4, color: CREAM, opacity: P(f, afterAt, 8) }}>NÃO CONSEGUEM VER O QUE EXISTE DEPOIS</div> : null}
        {f >= neverAt ? <div style={{ fontSize: 18, letterSpacing: 4, color: "#c8ffe8", marginTop: 8, opacity: P(f, neverAt, 8) }}>NUNCA ENCONTRARAM NADA PARECIDO</div> : null}
      </div>
      <Hud f={f} yaw={e.yaw} eye={e} blips={[{ x: -1.6, y: 5 }, { x: 1.5, y: 5.6 }]} msg={f >= dirAt && f < goneAt ? "NAQUELA DIREÇÃO · NORTE" : undefined} msgCol={GREEN} />
      <AbsoluteFill style={{ background: "#000", opacity: fadeIO(f, life), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};
