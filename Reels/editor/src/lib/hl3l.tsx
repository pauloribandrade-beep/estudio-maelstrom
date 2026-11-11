import React, { useContext, useMemo } from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { FONT, MONO } from "./overlays";
import { C, Clip, HL, rnd } from "./hl3";
import { Canvas3D } from "./hl3j";
import { LiteCtx } from "./sfx-ctx";

// Parte 3C (a saída de White Forest, o Varga, a fogueira, o Vortigaunt, o ataque, a Alyx na neve). Cenas feitas do
// zero sem personagem desenhado: interface, luz, matéria e tipografia; gente só em imagem real (jogo ou vídeo real).
// Tempos em QUADROS relativos à cena (o registry converte `at`, `...At`, `dur`).

const P = (f: number, at: number, d = 12) => interpolate(f, [at, at + d], [0, 1], { ...C, easing: Easing.out(Easing.cubic) });
const flickIn = (f: number, at: number) => {
  const d = f - at;
  if (d < 0) return 0;
  return d < 7 ? [0.25, 1, 0.35, 1, 0.7, 1, 0.9][d] : 1;
};
const AMB = "#ffb22e";
const ICE = "#c6f7ff";
const RED = "#ff5566";
const pad2 = (n: number) => String(Math.max(0, Math.floor(n))).padStart(2, "0");

// neve fina caindo (fundo das telas de interface da 3C): sempre em movimento, nunca o roxo parado
const Snowfall: React.FC<{ f: number; n?: number; o?: number; freezeAt?: number; wind?: number }> = ({ f, n = 90, o = 0.5, freezeAt = 1e9, wind = 0.6 }) => {
  const ff = Math.min(f, freezeAt);
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
      {Array.from({ length: n }).map((_, i) => {
        const sp = 0.6 + rnd(i * 3) * 1.6;
        const y = ((rnd(i * 7) * 1180 + ff * sp * 1.4) % 1180) - 50;
        const x = (rnd(i * 11) * 2100 + ff * sp * wind + Math.sin(ff / 40 + i) * 14) % 2000 - 40;
        const r = 0.8 + rnd(i * 13) * 2.2;
        return <circle key={i} cx={x} cy={y} r={r} fill="#e8f2ff" opacity={o * (0.35 + rnd(i * 17) * 0.65)} />;
      })}
    </svg>
  );
};

// ============================================================================================ contador da janela
// "Com o momento da próxima manifestação calculado…": painel da resistência com a contagem regressiva até o Borealis
// aparecer. `lockAt`: o cálculo fecha (os dígitos travam) · `wfAt`: WHITE FOREST · PERMANECER · `riskAt`: vira RISCO ·
// `windowAt`: a janela curta acende na régua · `goAt`: "a resistência começa a se mover" (MOVER).
// `elapsed` (s): quanto a contagem já andou antes desta cena (a 2ª aparição continua de onde a 1ª parou)
export const HLCountdown: React.FC<{ life: number; lockAt?: number; wfAt?: number; riskAt?: number; windowAt?: number; goAt?: number; days?: number; elapsed?: number }> = ({ life, lockAt = 1e9, wfAt = 1e9, riskAt = 1e9, windowAt = 1e9, goAt = 1e9, days = 6, elapsed = 0 }) => {
  const f = useCurrentFrame();
  const enter = P(f, 0, 16);
  // antes de travar, os dígitos "procuram" (embaralham); depois contam para trás de verdade, segundo a segundo
  const locked = f >= lockAt;
  const total = days * 86400 + 4 * 3600 + 12 * 60 + 37 - elapsed - Math.max(0, f - lockAt) / 30;
  const scr = (k: number) => Math.floor(rnd(Math.floor(f / 2) * 7 + k) * 60);
  const D = locked ? Math.floor(total / 86400) : scr(1) % 10;
  const H = locked ? Math.floor((total % 86400) / 3600) : scr(2) % 24;
  const M = locked ? Math.floor((total % 3600) / 60) : scr(3);
  const S = locked ? Math.floor(total % 60) : scr(4);
  const lockFlash = interpolate(f, [lockAt, lockAt + 2, lockAt + 14], [0, 1, 0], C);
  const risk = f >= riskAt;
  const wp = P(f, windowAt, 20);
  const go = P(f, goAt, 14);
  const cam = 1 + 0.04 * (f / Math.max(1, life));
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, #0c1620 0%, #04070b 75%)" }}>
      <Snowfall f={f} n={70} o={0.35} />
      <AbsoluteFill style={{ transform: `scale(${cam * (0.92 + 0.08 * enter)})`, opacity: enter }}>
        {/* anel do relógio: gira devagar atrás dos dígitos; a janela é o arco aceso */}
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          <g transform={`translate(960 430) rotate(${f * 0.25})`}>
            <circle r={430} fill="none" stroke="rgba(255,178,46,0.12)" strokeWidth={2} />
            <circle r={400} fill="none" stroke="rgba(255,178,46,0.08)" strokeWidth={26} strokeDasharray="2 14" />
            {Array.from({ length: 60 }).map((_, k) => {
              const a = (k / 60) * Math.PI * 2;
              const L = k % 5 === 0 ? 22 : 9;
              return <line key={k} x1={Math.cos(a) * 430} y1={Math.sin(a) * 430} x2={Math.cos(a) * (430 - L)} y2={Math.sin(a) * (430 - L)} stroke="rgba(255,178,46,0.35)" strokeWidth={k % 5 === 0 ? 2.5 : 1.2} />;
            })}
          </g>
          <circle cx={960} cy={430} r={455} fill="none" stroke={AMB} strokeWidth={5} pathLength={1} strokeDasharray={`${0.06 + 0.06 * wp} 1`} strokeDashoffset={-0.62} transform="rotate(-90 960 430)" opacity={0.35 + 0.65 * Math.max(wp, locked ? 0.4 : 0)} style={{ filter: "drop-shadow(0 0 14px rgba(255,178,46,0.8))" }} />
        </svg>
        <div style={{ position: "absolute", left: 960 - 660, top: 250, width: 1320, textAlign: "center" }}>
          <div style={{ fontFamily: MONO, fontSize: 26, letterSpacing: 10, color: AMB, opacity: 0.9 }}>BOREALIS · PRÓXIMA MANIFESTAÇÃO</div>
          <div style={{ marginTop: 26, fontFamily: MONO, fontWeight: 700, fontSize: 168, letterSpacing: 6, color: locked ? "#fff2d6" : "rgba(255,242,214,0.55)", textShadow: `0 0 ${40 + 80 * lockFlash}px rgba(255,178,46,${0.35 + 0.5 * lockFlash})`, fontVariantNumeric: "tabular-nums" }}>
            {pad2(D)}
            <span style={{ fontSize: 60, letterSpacing: 2, color: AMB }}>D </span>
            {pad2(H)}:{pad2(M)}:{pad2(S)}
          </div>
          <div style={{ marginTop: 6, fontFamily: MONO, fontSize: 22, letterSpacing: 8, color: locked ? AMB : "rgba(255,178,46,0.45)" }}>{locked ? "CÁLCULO FECHADO · DADOS DA MOSSMAN" : "CALCULANDO…"}</div>
          {/* régua do tempo: a janela é um trecho curto aceso */}
          <div style={{ position: "relative", margin: "54px auto 0", width: 1100, height: 70 }}>
            <div style={{ position: "absolute", left: 0, right: 0, top: 34, height: 2, background: "rgba(255,178,46,0.35)" }} />
            {Array.from({ length: 23 }).map((_, k) => (
              <div key={k} style={{ position: "absolute", left: k * 50, top: k % 5 === 0 ? 22 : 28, width: 2, height: k % 5 === 0 ? 26 : 14, background: "rgba(255,178,46,0.45)" }} />
            ))}
            <div style={{ position: "absolute", left: 640, top: 18 - 8 * wp, width: 90, height: 34 + 16 * wp, borderRadius: 6, background: `rgba(255,178,46,${0.25 + 0.6 * wp})`, boxShadow: `0 0 ${50 * wp}px rgba(255,178,46,${0.7 * wp})` }} />
            <div style={{ position: "absolute", left: 600, width: 170, top: -34, textAlign: "center", fontFamily: MONO, fontSize: 20, letterSpacing: 6, color: AMB, opacity: wp }}>JANELA CURTA</div>
            <div style={{ position: "absolute", left: 0, top: 54, fontFamily: MONO, fontSize: 16, letterSpacing: 4, color: "rgba(255,178,46,0.6)" }}>HOJE</div>
          </div>
        </div>
        {/* White Forest: ficar parado */}
        <div style={{ position: "absolute", left: 960 - 430, top: 800, width: 860, display: "flex", alignItems: "center", gap: 18, padding: "16px 26px", borderRadius: 14, background: risk ? "rgba(70,10,14,0.7)" : "rgba(40,24,4,0.6)", border: `1px solid ${risk ? "rgba(255,85,102,0.7)" : "rgba(255,178,46,0.4)"}`, opacity: flickIn(f, wfAt) * (1 - go * 0.6) }}>
          <span style={{ width: 12, height: 12, borderRadius: 6, background: risk ? RED : AMB, boxShadow: `0 0 12px ${risk ? RED : AMB}`, opacity: risk && Math.floor((f - riskAt) / 8) % 2 ? 0.3 : 1 }} />
          <span style={{ fontFamily: MONO, fontSize: 24, letterSpacing: 5, color: AMB, flex: 1 }}>WHITE FOREST</span>
          <span style={{ fontFamily: MONO, fontSize: 24, letterSpacing: 5, fontWeight: 700, color: risk ? RED : AMB }}>{f >= goAt ? "MOVER" : risk ? "PERMANECER · RISCO" : "PERMANECER"}</span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ============================================================================================ rota no mapa topográfico
// Mapa de campo da resistência (curvas de nível, neve) inclinado em 3D. A rota sai de WHITE FOREST e sobe para o
// NORTE desenhando; o comboio anda por ela. `splitAt`: "um dos primeiros grupos" (o comboio vira vários pontos) ·
// `northAt`: chega no rótulo NORTE.
const contour = (cx: number, cy: number, r: number, seed: number) => {
  const pts: string[] = [];
  for (let k = 0; k <= 72; k++) {
    const a = (k / 72) * Math.PI * 2;
    const rr = r * (1 + 0.18 * Math.sin(a * 3 + seed) + 0.1 * Math.sin(a * 5 + seed * 2) + 0.06 * Math.sin(a * 9 + seed * 3));
    pts.push(`${k ? "L" : "M"} ${(cx + Math.cos(a) * rr * 1.25).toFixed(1)} ${(cy + Math.sin(a) * rr).toFixed(1)}`);
  }
  return pts.join(" ") + " Z";
};
const ROUTE: [number, number][] = [
  [700, 1180],
  [760, 1040],
  [720, 900],
  [820, 780],
  [900, 640],
  [870, 500],
  [960, 380],
  [1040, 250],
  [1010, 120],
];
const routeAt = (u: number): [number, number] => {
  const t = Math.min(0.9999, Math.max(0, u)) * (ROUTE.length - 1);
  const i = Math.floor(t);
  const k = t - i;
  return [ROUTE[i][0] + (ROUTE[i + 1][0] - ROUTE[i][0]) * k, ROUTE[i][1] + (ROUTE[i + 1][1] - ROUTE[i][1]) * k];
};
export const HLTopoRoute: React.FC<{ life: number; splitAt?: number; northAt?: number; diveAt?: number }> = ({ life, splitAt = 1e9, northAt = 1e9, diveAt = 1e9 }) => {
  const f = useCurrentFrame();
  const draw = interpolate(f, [2, Math.min(northAt, life - 4)], [0, 1], { ...C, easing: Easing.inOut(Easing.cubic) });
  const tilt = 34 - 6 * (f / life);
  // a câmera ANDA com o comboio (segue a ponta da rota com um pouco de atraso) e, no fim, mergulha nele
  const [fx0, fy0] = routeAt(Math.max(0, draw - 0.04));
  const dive = interpolate(f, [diveAt, life], [0, 1], { ...C, easing: Easing.in(Easing.cubic) });
  const zoomR = 1.12 + 0.12 * (f / life) + dive * 2.6;
  const hills = [
    [520, 520, 9],
    [1300, 380, 11],
    [1120, 820, 7],
    [380, 980, 6],
    [1500, 1000, 8],
    // além da área do mapa (a câmera anda e não pode mostrar a borda)
    [-300, 200, 10],
    [900, -350, 12],
    [2200, 300, 9],
    [-250, 1300, 8],
    [2300, 1350, 10],
    [800, 1650, 9],
    [1800, -250, 8],
  ];
  const routeD = ROUTE.map(([x, y], k) => `${k ? "L" : "M"} ${x} ${y}`).join(" ");
  const [hx, hy] = routeAt(draw);
  const split = P(f, splitAt, 20);
  return (
    <AbsoluteFill style={{ background: "#05080c", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, perspective: 1400, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1300, transformOrigin: `${fx0}px ${fy0}px`, transform: `translate(${960 - fx0}px, ${560 - fy0}px) rotateX(${tilt * (1 - dive * 0.6)}deg) scale(${zoomR})` }}>
        <svg width={1920} height={1300} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          <defs>
            <radialGradient id="topoSnow" cx="50%" cy="40%" r="70%">
              <stop offset="0%" stopColor="#1a2632" />
              <stop offset="100%" stopColor="#070b10" />
            </radialGradient>
          </defs>
          <rect x={-1500} y={-1500} width={4920} height={4300} fill="#101a24" />
          {hills.map(([cx, cy, n], h) =>
            Array.from({ length: n }).map((_, k) => <path key={`${h}-${k}`} d={contour(cx, cy, 40 + k * 34, h * 2.3 + k * 0.4)} fill="none" stroke="#9fd8ff" strokeWidth={k % 4 === 0 ? 1.6 : 0.9} opacity={0.12 + (k % 4 === 0 ? 0.12 : 0)} />),
          )}
          {/* rota: a parte já percorrida em âmbar, o resto tracejado apagado */}
          <path d={routeD} fill="none" stroke="rgba(255,178,46,0.25)" strokeWidth={3} strokeDasharray="6 12" />
          <path d={routeD} fill="none" stroke={AMB} strokeWidth={5} pathLength={1} strokeDasharray={`${draw} 1`} style={{ filter: "drop-shadow(0 0 10px rgba(255,178,46,0.8))" }} />
          {/* comboio: um ponto que vira um grupo */}
          {Array.from({ length: 5 }).map((_, k) => {
            const [x, y] = routeAt(draw - k * 0.018 * split);
            return <circle key={k} cx={x} cy={y} r={k === 0 ? 11 : 7 * split} fill="#fff2d6" opacity={k === 0 ? 1 : split} style={{ filter: "drop-shadow(0 0 8px #ffb22e)" }} />;
          })}
          <circle cx={hx} cy={hy} r={26 + 6 * Math.sin(f / 5)} fill="none" stroke={AMB} strokeWidth={2} opacity={0.6} />
          <g transform={`translate(${ROUTE[0][0] + 30} ${ROUTE[1][1] + 10})`}>
            <rect x={-6} y={-6} width={12} height={12} fill={AMB} />
            <text x={22} y={8} fill={AMB} fontFamily={MONO} fontSize={26} letterSpacing={6}>
              WHITE FOREST
            </text>
          </g>
          <g transform={`translate(${ROUTE[ROUTE.length - 1][0] + 170} 70)`} opacity={P(f, northAt - 6, 12)}>
            <path d="M 0 -40 L 18 0 L 0 -8 L -18 0 Z" fill={AMB} />
            <text x={0} y={40} textAnchor="middle" fill={AMB} fontFamily={MONO} fontSize={30} letterSpacing={10}>
              NORTE
            </text>
          </g>
        </svg>
      </div>
      </div>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, #05080c 0%, rgba(5,8,12,0) 28%, rgba(5,8,12,0) 75%, #05080c 100%)" }} />
      {dive > 0 ? <AbsoluteFill style={{ background: "#fff2d6", opacity: interpolate(dive, [0.55, 1], [0, 0.95], C) }} /> : null}
      <div style={{ position: "absolute", left: 90, top: 70, zIndex: 5, fontFamily: MONO, color: AMB, letterSpacing: 5, fontSize: 22, lineHeight: 1.6 }}>
        <div>RESISTÊNCIA · MAPA DE CAMPO</div>
        <div style={{ opacity: 0.6, fontSize: 18 }}>COMBOIO 01 · SAÍDA DE WHITE FOREST</div>
      </div>
    </AbsoluteFill>
  );
};

// ============================================================================================ ficha de carga (por cima)
// Cartão de vidro sobre a estrada: cada item da carga entra carimbado na palavra; o último (DADOS) com cadeado.
export const HLManifest: React.FC<{ life: number; items?: { k: string; v: string; at: number; key?: boolean }[]; title?: string }> = ({ life, items = [], title = "CARGA · COMBOIO 01" }) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [0, 10, life - 10, life], [0, 1, 1, 0], C);
  const slide = P(f, 0, 16);
  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity: o }}>
      <div style={{ position: "absolute", right: 110, top: 200, width: 640, transform: `translateX(${(1 - slide) * 60}px)`, borderRadius: 22, padding: "30px 36px 20px", background: "rgba(10,12,16,0.62)", border: "1px solid rgba(255,178,46,0.35)", boxShadow: "0 40px 120px rgba(0,0,0,0.6)", backdropFilter: "blur(14px)" }}>
        <div style={{ fontFamily: MONO, fontSize: 20, letterSpacing: 7, color: AMB }}>{title}</div>
        <div style={{ height: 1, background: "rgba(255,178,46,0.3)", margin: "16px 0 10px" }} />
        {items.map((it, i) => {
          const a = flickIn(f, it.at);
          const st = interpolate(f, [it.at, it.at + 4], [1.6, 1], { ...C, easing: Easing.out(Easing.back(2)) });
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 0", borderBottom: i < items.length - 1 ? "1px solid rgba(255,255,255,0.07)" : undefined, opacity: f >= it.at ? 1 : 0.18 }}>
              <span style={{ fontFamily: MONO, fontSize: 18, color: "rgba(255,178,46,0.6)", width: 34 }}>{String(i + 1).padStart(2, "0")}</span>
              <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 34, color: HL.text, flex: 1 }}>{it.k}</span>
              <span style={{ fontFamily: MONO, fontSize: 17, letterSpacing: 3, color: it.key ? "#fff2d6" : "rgba(242,240,247,0.6)", opacity: a, transform: `scale(${f >= it.at ? st : 1}) rotate(-4deg)`, border: `2px solid ${it.key ? AMB : "rgba(255,178,46,0.55)"}`, borderRadius: 6, padding: "4px 10px", background: it.key ? "rgba(255,178,46,0.18)" : undefined }}>
                {it.key ? "🔒 " : ""}
                {it.v}
              </span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ============================================================================================ dossiê do Varga
// Ficha da resistência: um REGISTRO EM VÍDEO (silhueta real à luz do fogo, de costas, frio e granulado, rodando devagar)
// e os campos que ele vai ganhando na fala, ligados ao registro por linhas. `nameAt` / campos `at`. Nada de foto parada.
export const HLDossierVarga: React.FC<{ life: number; src?: string; rate?: number; nameAt?: number; fields?: { k: string; v: string; at: number }[] }> = ({ life, src, rate = 1, nameAt = 0, fields = [] }) => {
  const f = useCurrentFrame();
  const enter = P(f, 0, 18);
  const push = 1 + 0.06 * (f / Math.max(1, life));
  const scan = (f * 6) % 520;
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 40% 50%, #121820 0%, #05070b 75%)" }}>
      <Snowfall f={f} n={50} o={0.25} />
      {/* foto: imagem real congelada, fria, com varredura */}
      <div style={{ position: "absolute", left: 150, top: 230, width: 760, height: 520, borderRadius: 18, overflow: "hidden", opacity: enter, transform: `translateX(${(1 - enter) * -40}px)`, boxShadow: "0 40px 120px rgba(0,0,0,0.7)", border: "1px solid rgba(255,178,46,0.3)" }}>
        {src ? (
          <div style={{ position: "absolute", inset: 0, transform: `scale(${push})`, filter: "grayscale(0.45) sepia(0.3) contrast(1.12) brightness(1.55)" }}>
            <Clip src={src} from={0} rate={rate} />
          </div>
        ) : (
          // sem foto: a Resistência não guarda rosto de ninguém — só o contorno de ficha vazia, chiado e o carimbo
          <div style={{ position: "absolute", inset: 0, background: "#0d1014" }}>
            <svg width={760} height={520} style={{ position: "absolute", inset: 0 }}>
              {Array.from({ length: 70 }).map((_, i) => (
                <rect key={i} x={0} y={(rnd(i * 3 + Math.floor(f / 2)) * 520) | 0} width={760} height={1 + ((rnd(i * 7) * 3) | 0)} fill="#ffb22e" opacity={0.04 + rnd(i * 11 + Math.floor(f / 2)) * 0.06} />
              ))}
              <circle cx={380} cy={200} r={78} fill="none" stroke="rgba(255,178,46,0.35)" strokeWidth={3} strokeDasharray="10 10" />
              <path d="M 220 470 Q 230 330 380 318 Q 530 330 540 470" fill="none" stroke="rgba(255,178,46,0.35)" strokeWidth={3} strokeDasharray="10 10" />
              <text x={380} y={214} textAnchor="middle" fill="rgba(255,178,46,0.6)" fontFamily={MONO} fontSize={60}>?</text>
            </svg>
            <div style={{ position: "absolute", left: 0, right: 0, top: 236, textAlign: "center", transform: `rotate(-6deg) scale(${1.4 - P(f, 10, 10) * 0.4})`, opacity: P(f, 10, 10) }}>
              <span style={{ display: "inline-block", border: `4px solid ${RED}`, borderRadius: 6, padding: "10px 24px", fontFamily: MONO, fontSize: 34, fontWeight: 700, letterSpacing: 8, color: RED, background: "rgba(30,6,8,0.6)" }}>SEM REGISTRO VISUAL</span>
            </div>
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 34, textAlign: "center", fontFamily: MONO, fontSize: 16, letterSpacing: 4, color: "rgba(255,178,46,0.6)" }}>POR SEGURANÇA, A RESISTÊNCIA NÃO GUARDA ROSTOS</div>
          </div>
        )}
        <div style={{ position: "absolute", left: 0, right: 0, top: scan - 40, height: 40, background: "linear-gradient(180deg, rgba(255,178,46,0), rgba(255,178,46,0.12), rgba(255,178,46,0))" }} />
        <div style={{ position: "absolute", left: 18, top: 16, fontFamily: MONO, fontSize: 16, letterSpacing: 4, color: AMB }}>REGISTRO · RESISTÊNCIA</div>
        {[
          [20, 20],
          [740, 20],
          [20, 500],
          [740, 500],
        ].map(([x, y], k) => (
          <div key={k} style={{ position: "absolute", left: x - 10, top: y - 10, width: 20, height: 20, borderLeft: k % 2 ? undefined : `2px solid ${AMB}`, borderRight: k % 2 ? `2px solid ${AMB}` : undefined, borderTop: k < 2 ? `2px solid ${AMB}` : undefined, borderBottom: k >= 2 ? `2px solid ${AMB}` : undefined, opacity: 0.8 }} />
        ))}
      </div>
      {/* nome + campos */}
      <div style={{ position: "absolute", left: 1010, top: 240, width: 780 }}>
        <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 132, letterSpacing: -4, color: HL.text, lineHeight: 1, opacity: P(f, nameAt, 10), transform: `translateY(${(1 - P(f, nameAt, 14)) * 30}px)`, textShadow: "0 10px 60px rgba(0,0,0,0.8)" }}>Varga</div>
        <div style={{ height: 2, width: 140 * P(f, nameAt + 6, 20), background: AMB, boxShadow: `0 0 16px ${AMB}`, margin: "22px 0 30px" }} />
        {fields.map((fl, i) => (
          <div key={i} style={{ marginBottom: 26, opacity: flickIn(f, fl.at), transform: `translateX(${(1 - P(f, fl.at, 12)) * 30}px)` }}>
            <div style={{ fontFamily: MONO, fontSize: 18, letterSpacing: 6, color: "rgba(255,178,46,0.7)" }}>{fl.k}</div>
            <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 40, color: HL.text, marginTop: 4 }}>{fl.v}</div>
          </div>
        ))}
      </div>
      {/* linhas de chamada da foto para cada campo */}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {fields.map((fl, i) => {
          const p = P(f, fl.at, 14);
          const y = 418 + i * 108 + 20;
          return <path key={i} d={`M 910 ${490} L ${960} ${y} L ${960 + 40 * p} ${y}`} fill="none" stroke={AMB} strokeWidth={1.5} opacity={0.55 * p} pathLength={1} strokeDasharray={`${p} 1`} />;
        })}
      </svg>
    </AbsoluteFill>
  );
};

// ============================================================================================ frase do Varga (por cima)
// A fala dele em tipografia grande sobre o fogo, palavra por palavra no tempo da voz. `markFrom..markTo` (índices) ganham
// marca-texto em `markAt`; em `pinAt` a frase encolhe, sobe para o canto e vira a etiqueta GUARDE ISSO.
export const HLQuote: React.FC<{ life: number; words?: { w: string; at: number }[]; size?: number; markFrom?: number; markTo?: number; markAt?: number; pinAt?: number; outAt?: number; italic?: boolean }> = ({ life, words = [], size = 80, markFrom = -1, markTo = -1, markAt = 1e9, pinAt = 1e9, outAt = 1e9 }) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [life - 10, life], [1, 0], C) * interpolate(f, [outAt, outAt + 12], [1, 0], C);
  const pin = interpolate(f, [pinAt, pinAt + 26], [0, 1], { ...C, easing: Easing.inOut(Easing.cubic) });
  const mark = interpolate(f, [markAt, markAt + 16], [0, 1], { ...C, easing: Easing.inOut(Easing.quad) });
  const tag = P(f, pinAt + 20, 12);
  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity: o }}>
      <div
        style={{
          position: "absolute",
          left: 960 - 760,
          top: 540,
          width: 1520,
          transformOrigin: "100% 0%",
          transform: `translate(${pin * 640}px, ${-120 - pin * 330}px) scale(${1 - pin * 0.66})`,
          textAlign: "center",
          fontFamily: FONT,
          fontWeight: 700,
          fontSize: size,
          lineHeight: 1.16,
          letterSpacing: -1.5,
          color: "#fbf3e6",
          textShadow: "0 0 40px rgba(255,140,40,0.35), 0 8px 40px rgba(0,0,0,0.85)",
          padding: pin > 0.01 ? `${24 * pin}px ${30 * pin}px` : 0,
          borderRadius: 26 * pin,
          background: pin > 0.01 ? `rgba(10,10,12,${0.75 * pin})` : undefined,
          border: pin > 0.01 ? `${2 * pin}px solid rgba(255,178,46,${0.7 * pin})` : undefined,
        }}
      >
        {words.map((wd, i) => {
          const p = P(f, wd.at, 9);
          const marked = i >= markFrom && i <= markTo;
          const mp = marked ? Math.min(1, Math.max(0, mark * (markTo - markFrom + 1) - (i - markFrom))) : 0;
          return (
            <span key={i} style={{ position: "relative", display: "inline-block", whiteSpace: "pre", opacity: p, transform: `translateY(${(1 - p) * 18}px)`, filter: p < 1 ? `blur(${(1 - p) * 8}px)` : undefined }}>
              {marked ? <span style={{ position: "absolute", left: -4, right: -4, top: "18%", bottom: "8%", background: "rgba(255,170,40,0.55)", transformOrigin: "0 50%", transform: `scaleX(${mp})`, borderRadius: 6, zIndex: -1, mixBlendMode: "screen" }} /> : null}
              {wd.w}
              {i < words.length - 1 ? " " : ""}
            </span>
          );
        })}
      </div>
      {tag > 0 ? (
        <div style={{ position: "absolute", right: 120, top: 92, fontFamily: MONO, fontSize: 22, letterSpacing: 8, color: AMB, opacity: tag, transform: `translateY(${(1 - tag) * 10}px)` }}>📌 GUARDE ISSO</div>
      ) : null}
    </AbsoluteFill>
  );
};

// ============================================================================================ a ferida (shader)
// "Ali o mundo abriu, a ferida ficou, o que caiu nela ainda cai. A ferida pode fechar, mas o corpo que leva a ferida
// vai com ela." Chão de rocha escura visto de cima; uma fenda RASGA (`openAt`), fica brilhando por dentro (`scarAt`),
// destroços caem nela sem parar (`fallAt`), ela FECHA (`closeAt`) e o chão em volta afunda junto, para o escuro
// (`sinkAt`). Só imagem: nada explica o que é a ferida.
const WOUND_FS = `
uniform float uT; uniform float uOpen; uniform float uGlow; uniform float uFall; uniform float uSink; uniform vec2 uRes; varying vec2 vUv;
${"" /* ruído */}
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
float noise(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1.,0.)),u.x), mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),u.x), u.y); }
float fbm(vec2 p){ float v=0., a=.5; for(int i=0;i<6;i++){ v+=a*noise(p); p*=2.02; a*=.5; } return v; }
void main(){
  vec2 uv = (vUv - .5) * vec2(uRes.x / uRes.y, 1.);
  // o chão afunda: tudo se puxa para o centro e escurece
  uv *= 1. + uSink * 1.6;
  float rock = fbm(uv * 3.2) * .7 + fbm(uv * 11.) * .3;
  vec3 col = mix(vec3(.04,.045,.05), vec3(.20,.21,.22), rock);
  col *= .55 + .45 * smoothstep(-.6, .2, -length(uv) + .4);
  // a fenda: uma linha torta que atravessa a tela
  float x = uv.x + (fbm(vec2(uv.y * 2.5, 1.7)) - .5) * .55 + (fbm(vec2(uv.y * 9., 4.1)) - .5) * .08;
  float w = uOpen * (.035 + .05 * fbm(vec2(uv.y * 4., 7.))) * smoothstep(.62, .25, abs(uv.y));
  float d = abs(x);
  float inside = 1. - smoothstep(w * .6, w, d);
  float rim = exp(-pow(max(0., d - w * .7) / (.012 + .05 * uGlow), 2.));
  // dentro: profundidade escura com luz verde de Xen pulsando lá no fundo
  float pulse = .75 + .25 * sin(uT * 1.7) + .1 * sin(uT * 4.3);
  vec3 deep = mix(vec3(.0,.02,.01), vec3(.35,1.,.55) * pulse, exp(-d / max(.001, w) * 1.4) * uGlow);
  col = mix(col, deep, inside);
  col += vec3(.45,1.,.6) * rim * uGlow * .55 * (1. - inside) * smoothstep(.62, .25, abs(uv.y));
  // rachaduras finas saindo da fenda
  float cr = smoothstep(.985, 1., fbm(uv * 18. + 3.) ) * exp(-d * 6.) * uOpen;
  col += vec3(.3,.9,.5) * cr * uGlow * .7;
  // poeira que cai para dentro: pontos que andam em direção à fenda e somem nela (nunca chegam ao fundo)
  for (int k = 0; k < 28; k++) {
    float fk = float(k);
    float s = hash(vec2(fk, 3.1));
    float ph = fract(uT * (.05 + .07 * hash(vec2(fk, 9.2))) + s);
    float side = hash(vec2(fk, 5.5)) > .5 ? 1. : -1.;
    vec2 p0 = vec2(side * (.25 + .5 * hash(vec2(fk, 1.3))), (hash(vec2(fk, 2.7)) - .5) * .9);
    vec2 p = mix(p0, vec2(0., p0.y * .9), ph);
    float sz = (.009 + .012 * hash(vec2(fk, 8.8))) * (1. - ph * .85);
    float dot_ = smoothstep(sz, sz * .3, length(uv - p));
    col = mix(col, vec3(.5,.52,.5) * (1. - ph) + vec3(.2,.8,.4) * ph * uGlow, dot_ * uFall * (1. - ph * .6));
  }
  col *= 1. - uSink * .92;
  gl_FragColor = vec4(col, 1.);
}`;
const WoundPlane: React.FC<{ f: number; open: number; glow: number; fall: number; sink: number }> = ({ f, open, glow, fall, sink }) => {
  const { viewport } = useThree();
  const mat = useMemo(() => new THREE.ShaderMaterial({ vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }`, fragmentShader: WOUND_FS, uniforms: { uT: { value: 0 }, uOpen: { value: 0 }, uGlow: { value: 0 }, uFall: { value: 0 }, uSink: { value: 0 }, uRes: { value: new THREE.Vector2(1920, 1080) } }, depthTest: false }), []);
  mat.uniforms.uT.value = f / 30;
  mat.uniforms.uOpen.value = open;
  mat.uniforms.uGlow.value = glow;
  mat.uniforms.uFall.value = fall;
  mat.uniforms.uSink.value = sink;
  void viewport;
  return (
    <mesh frustumCulled={false} material={mat}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  );
};
export const HLWound: React.FC<{ life: number; openAt?: number; scarAt?: number; fallAt?: number; closeAt?: number; sinkAt?: number }> = ({ life, openAt = 6, scarAt = 1e9, fallAt = 1e9, closeAt = 1e9, sinkAt = 1e9 }) => {
  const f = useCurrentFrame();
  const lite = useContext(LiteCtx);
  const opening = interpolate(f, [openAt, openAt + 5, openAt + 20], [0, 0.75, 1], C);
  const closing = interpolate(f, [closeAt, closeAt + 40], [1, 0], { ...C, easing: Easing.inOut(Easing.cubic) });
  const open = opening * closing;
  const glow = interpolate(f, [openAt, openAt + 30, scarAt, scarAt + 20], [0.4, 0.75, 0.75, 1], C) * (0.3 + 0.7 * closing);
  const fall = P(f, fallAt, 30) * closing;
  const sink = interpolate(f, [sinkAt, life], [0, 1], { ...C, easing: Easing.in(Easing.cubic) });
  const shake = f >= openAt && f < openAt + 14 ? (1 - (f - openAt) / 14) * 14 : f >= closeAt + 34 && f < closeAt + 46 ? (1 - (f - closeAt - 34) / 12) * 10 : 0;
  const sx = shake ? (rnd(f * 7) - 0.5) * shake : 0;
  const sy = shake ? (rnd(f * 13) - 0.5) * shake : 0;
  const cam = 1.04 + 0.08 * (f / Math.max(1, life));
  return (
    <AbsoluteFill style={{ background: "#020303", transform: `translate(${sx}px, ${sy}px) scale(${cam})` }}>
      <Canvas3D f={f} lite={lite} fov={40} pos={[0, 0, 2]} near={0.1} far={10}>
        <WoundPlane f={f} open={open} glow={glow} fall={fall} sink={sink} />
      </Canvas3D>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.75) 100%)" }} />
    </AbsoluteFill>
  );
};

// ============================================================================================ varredura Combine
// Interface Overwatch (mesma língua do mapa): a busca passa pelos alvos do acampamento e só trava na CARGA. `skipAt`:
// os rebeldes são marcados como IGNORAR · `lockAt`: DADOS · WHITE FOREST trava · `radioAt`: ordem interceptada.
export const HLCombineScan: React.FC<{ life: number; skipAt?: number; lockAt?: number; radioAt?: number }> = ({ life, skipAt = 1e9, lockAt = 1e9, radioAt = 1e9 }) => {
  const f = useCurrentFrame();
  const enter = P(f, 0, 10);
  const targets = [
    { x: 380, y: 560, label: "REBELDE", w: 120, h: 230 },
    { x: 610, y: 600, label: "REBELDE", w: 110, h: 210 },
    { x: 1460, y: 590, label: "VORTIGAUNT", w: 150, h: 240 },
    { x: 980, y: 700, label: "CARGA", w: 260, h: 150, key: true },
  ];
  const lk = P(f, lockAt, 12);
  const sweep = (f * 14) % 2200 - 140;
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 55%, #0a2a33 0%, #031014 80%)", opacity: enter }}>
      {/* silhuetas do acampamento na visão noturna (formas, não personagens) */}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <path d="M 0 760 Q 480 700 960 735 T 1920 720 L 1920 1080 L 0 1080 Z" fill="#05181d" />
        {Array.from({ length: 26 }).map((_, i) => {
          const x = rnd(i * 5) * 1920;
          const h = 260 + rnd(i * 9) * 380;
          return <path key={i} d={`M ${x} ${760} L ${x - 40 - rnd(i) * 30} ${760} L ${x} ${760 - h} L ${x + 40 + rnd(i) * 30} ${760} Z`} fill="#061f25" opacity={0.9} />;
        })}
        {/* fogo apagado: brasa fria no meio */}
        <ellipse cx={980} cy={790} rx={60} ry={14} fill="#1b6b6f" opacity={0.5} />
        {targets.map((t, i) => {
          const seen = f >= i * 6 + 4;
          const ign = !t.key && f >= skipAt;
          const lock = t.key ? lk : 0;
          const col = t.key ? (lock > 0 ? RED : ICE) : ign ? "rgba(198,247,255,0.35)" : ICE;
          const s = 1 + (t.key ? (1 - lock) * 0.25 * Math.sin(f / 3) : 0);
          return (
            <g key={i} opacity={seen ? flickIn(f, i * 6 + 4) : 0}>
              <rect x={t.x - (t.w / 2) * s} y={t.y - (t.h / 2) * s} width={t.w * s} height={t.h * s} fill="none" stroke={col} strokeWidth={t.key && lock > 0 ? 4 : 2} strokeDasharray={ign ? "6 8" : undefined} />
              <text x={t.x - t.w / 2} y={t.y - t.h / 2 - 14} fill={col} fontFamily={MONO} fontSize={18} letterSpacing={4}>
                {t.label}
                {ign ? " · IGNORAR" : t.key && lock > 0.5 ? " · DADOS · WHITE FOREST" : ""}
              </text>
              {t.key && lock > 0 ? <circle cx={t.x} cy={t.y} r={120 - 80 * lock} fill="none" stroke={RED} strokeWidth={2} opacity={1 - lock * 0.5} /> : null}
            </g>
          );
        })}
      </svg>
      <div style={{ position: "absolute", left: sweep, top: 0, width: 140, height: 1080, background: "linear-gradient(90deg, rgba(198,247,255,0), rgba(198,247,255,0.08), rgba(198,247,255,0))" }} />
      <AbsoluteFill style={{ background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.22) 0 1px, rgba(0,0,0,0) 1px 3px)" }} />
      <div style={{ position: "absolute", left: 90, top: 70, fontFamily: MONO, color: ICE, letterSpacing: 4, lineHeight: 1.5 }}>
        <div style={{ fontSize: 26 }}>OVERWATCH ◆ BUSCA DE ALVO</div>
        <div style={{ fontSize: 18, opacity: 0.7 }}>OBJETIVO: RECUPERAR · NÃO EXTERMINAR</div>
      </div>
      {f >= radioAt ? (
        <div style={{ position: "absolute", left: 90, bottom: 90, fontFamily: MONO, fontSize: 24, letterSpacing: 5, color: RED, opacity: flickIn(f, radioAt) }}>
          ▮ RÁDIO INTERCEPTADO · “PROTEGER OS DADOS · NÃO DANIFICAR O ARQUIVO”
        </div>
      ) : null}
      <div style={{ position: "absolute", right: 90, top: 70, fontFamily: MONO, color: ICE, letterSpacing: 4, fontSize: 20, opacity: 0.8 }}>{`${pad2(f / 30 / 60 + 2)}:${pad2((f / 30) % 60)}:${pad2(f % 30)}`}</div>
      {void life}
    </AbsoluteFill>
  );
};

// ============================================================================================ a vantagem some
// Duas trilhas até o BOREALIS: a resistência sai na frente; em `loseAt` o roubo puxa os Combine para o mesmo ponto
// ("agora não tem mais"); em `bothAt` os dois marcadores chegam juntos na janela.
export const HLAdvantage: React.FC<{ life: number; loseAt?: number; bothAt?: number }> = ({ life, loseAt = 1e9, bothAt = 1e9 }) => {
  const f = useCurrentFrame();
  const enter = P(f, 0, 14);
  const res = interpolate(f, [4, 40], [0, 0.62], { ...C, easing: Easing.out(Easing.cubic) }) + interpolate(f, [bothAt, bothAt + 40], [0, 0.3], { ...C, easing: Easing.inOut(Easing.cubic) });
  const cmb = interpolate(f, [4, 40], [0, 0.18], { ...C, easing: Easing.out(Easing.cubic) }) + interpolate(f, [loseAt, loseAt + 18], [0, 0.44], { ...C, easing: Easing.out(Easing.exp) }) + interpolate(f, [bothAt, bothAt + 40], [0, 0.3], { ...C, easing: Easing.inOut(Easing.cubic) });
  const lost = P(f, loseAt + 10, 12);
  const X0 = 300;
  const X1 = 1620;
  const lane = (y: number, v: number, col: string, label: string) => (
    <g>
      <line x1={X0} y1={y} x2={X1} y2={y} stroke="rgba(255,255,255,0.12)" strokeWidth={3} />
      <line x1={X0} y1={y} x2={X0 + (X1 - X0) * v} y2={y} stroke={col} strokeWidth={6} style={{ filter: `drop-shadow(0 0 10px ${col})` }} />
      <circle cx={X0 + (X1 - X0) * v} cy={y} r={14} fill={col} />
      <text x={X0 - 30} y={y + 8} textAnchor="end" fill={col} fontFamily={MONO} fontSize={24} letterSpacing={6}>
        {label}
      </text>
    </g>
  );
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, #0b121a 0%, #04060a 80%)", opacity: enter }}>
      <Snowfall f={f} n={40} o={0.2} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {lane(470, res, AMB, "RESISTÊNCIA")}
        {lane(640, cmb, RED, "COMBINE")}
        <line x1={X1} y1={380} x2={X1} y2={730} stroke="#fff2d6" strokeWidth={2} strokeDasharray="8 8" />
        <text x={X1} y={350} textAnchor="middle" fill="#fff2d6" fontFamily={MONO} fontSize={26} letterSpacing={8}>
          BOREALIS
        </text>
        {/* a distância entre os dois = a vantagem */}
        {f < loseAt + 24 ? (
          <g opacity={1 - lost}>
            <line x1={X0 + (X1 - X0) * cmb} y1={555} x2={X0 + (X1 - X0) * res} y2={555} stroke={AMB} strokeWidth={2} />
            <text x={X0 + ((X1 - X0) * (cmb + res)) / 2} y={540} textAnchor="middle" fill={AMB} fontFamily={MONO} fontSize={22} letterSpacing={6}>
              VANTAGEM
            </text>
          </g>
        ) : null}
      </svg>
      <div style={{ position: "absolute", left: 0, right: 0, top: 820, textAlign: "center", fontFamily: MONO, fontSize: 30, letterSpacing: 12, color: RED, opacity: lost * (f < bothAt ? 1 : 0.4) }}>VANTAGEM · PERDIDA</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 880, textAlign: "center", fontFamily: MONO, fontSize: 24, letterSpacing: 8, color: "#fff2d6", opacity: P(f, bothAt + 20, 14) }}>MESMO DESTINO · MESMA JANELA</div>
      {void life}
    </AbsoluteFill>
  );
};

// ============================================================================================ expedição → corrida
// "deixa de ser uma expedição e vira uma corrida": EXPEDIÇÃO entra calma e larga; em `strikeAt` um traço a risca e ela
// encolhe; em `raceAt` CORRIDA rasga a tela da esquerda para a direita com rastros de velocidade.
export const HLRace: React.FC<{ life: number; strikeAt?: number; raceAt?: number }> = ({ life, strikeAt = 1e9, raceAt = 1e9 }) => {
  const f = useCurrentFrame();
  const e = P(f, 0, 16);
  const strike = interpolate(f, [strikeAt, strikeAt + 8], [0, 1], { ...C, easing: Easing.out(Easing.cubic) });
  const away = P(f, raceAt - 4, 10);
  const run = interpolate(f, [raceAt, raceAt + 8], [-1400, 0], { ...C, easing: Easing.out(Easing.exp) });
  const settle = 1 + interpolate(f, [raceAt + 8, life], [0, 0.05], C);
  const blur = f >= raceAt && f < raceAt + 8 ? (1 - (f - raceAt) / 8) * 18 : 0;
  return (
    <AbsoluteFill style={{ background: "#04060a", overflow: "hidden" }}>
      <Snowfall f={f * (f >= raceAt ? 4 : 1)} n={120} o={0.4} wind={f >= raceAt ? 9 : 0.6} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 410, textAlign: "center", fontFamily: FONT, fontWeight: 300, fontSize: 150, letterSpacing: 30 * e, color: "rgba(242,240,247,0.85)", opacity: e * (1 - away), transform: `scale(${1 - 0.15 * strike})` }}>
        <span style={{ position: "relative" }}>
          EXPEDIÇÃO
          <span style={{ position: "absolute", left: -20, right: -20, top: "52%", height: 10, background: RED, transformOrigin: "0 50%", transform: `scaleX(${strike})`, boxShadow: `0 0 20px ${RED}` }} />
        </span>
      </div>
      {f >= raceAt ? (
        <>
          {Array.from({ length: 14 }).map((_, i) => (
            <div key={i} style={{ position: "absolute", left: run - 300 - rnd(i) * 600, top: 380 + rnd(i * 3) * 320, width: 900 + rnd(i * 5) * 700, height: 2 + rnd(i * 7) * 4, background: `linear-gradient(90deg, rgba(255,138,31,0), rgba(255,138,31,${0.3 + rnd(i) * 0.5}))`, opacity: 1 - P(f, raceAt + 6, 30) * 0.8 }} />
          ))}
          <div style={{ position: "absolute", left: 0, right: 0, top: 360, textAlign: "center", fontFamily: FONT, fontWeight: 900, fontStyle: "italic", fontSize: 260, letterSpacing: -6, color: HL.orange, transform: `translateX(${run}px) skewX(-8deg) scale(${settle})`, filter: blur ? `blur(${blur}px)` : undefined, textShadow: "0 0 90px rgba(255,138,31,0.6), 0 14px 60px rgba(0,0,0,0.85)" }}>CORRIDA</div>
        </>
      ) : null}
    </AbsoluteFill>
  );
};

// ============================================================================================ tundra (3D)
// Patrulha na neve: câmera de primeira pessoa andando numa nevasca, terreno ondulado, pedras, neblina branca. Ao longe,
// uma figura parada (só a forma escura, sem rosto). `freezeAt`: a neve PARA no ar (silêncio) · `nearAt`: a câmera se
// aproxima e a vista vai clareando · `clearAt`: nítido (corta para a Alyx real).
type Tundra = ReturnType<typeof buildTundra>;
const TUNDRAS = new Map<boolean, Tundra>();
const th = (x: number, z: number) => Math.sin(x * 0.045) * 2.2 + Math.cos(z * 0.038 + 1) * 1.8 + Math.sin(x * 0.13 + z * 0.09) * 0.6;
const buildTundra = (lite: boolean) => {
  const root = new THREE.Group();
  const N = lite ? 110 : 220;
  const gg = new THREE.PlaneGeometry(500, 500, N, N);
  gg.rotateX(-Math.PI / 2);
  const gp = gg.getAttribute("position") as THREE.BufferAttribute;
  for (let i = 0; i < gp.count; i++) gp.setY(i, th(gp.getX(i), gp.getZ(i)) + (rnd(i) - 0.5) * 0.08);
  gg.computeVertexNormals();
  root.add(new THREE.Mesh(gg, new THREE.MeshStandardMaterial({ color: "#e9eef3", roughness: 0.96 })));
  const rockG = new THREE.DodecahedronGeometry(1, 1);
  const rockM = new THREE.MeshStandardMaterial({ color: "#6e7781", roughness: 0.9, flatShading: true });
  for (let i = 0; i < (lite ? 30 : 80); i++) {
    const x = (rnd(i * 3) - 0.5) * 160;
    const z = -rnd(i * 5) * 240 + 20;
    if (Math.abs(x) < 6 && z < 0 && z > -120) continue;
    const s = 0.3 + rnd(i * 7) * 1.6;
    const m = new THREE.Mesh(rockG, rockM);
    m.position.set(x, th(x, z) + s * 0.25, z);
    m.scale.set(s * (1 + rnd(i)), s * 0.6, s);
    m.rotation.set(rnd(i), rnd(i + 2) * 3, 0);
    root.add(m);
  }
  // a figura: uma forma escura e fina, de pé, longe (lida como pessoa na neblina; nunca de perto)
  const fig = new THREE.Group();
  const dark = new THREE.MeshStandardMaterial({ color: "#1b1d22", roughness: 1 });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.95, 6, 12), dark);
  body.position.y = 0.95;
  body.scale.set(1, 1, 0.8);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 12), dark);
  head.position.y = 1.72;
  const legs = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.7, 4, 8), dark);
  legs.position.set(0.08, 0.38, 0);
  const legs2 = legs.clone();
  legs2.position.x = -0.08;
  fig.add(body, head, legs, legs2);
  fig.position.set(0.6, th(0.6, -70), -70);
  root.add(fig);
  // nevasca: muitos flocos numa caixa em volta da câmera
  const NS = lite ? 1500 : 5000;
  const sg = new THREE.BufferGeometry();
  sg.setAttribute("position", new THREE.BufferAttribute(new Float32Array(NS * 3), 3));
  const snow = new THREE.Points(sg, new THREE.PointsMaterial({ color: "#ffffff", size: 0.07, sizeAttenuation: true, transparent: true, opacity: 0.85, depthWrite: false }));
  snow.frustumCulled = false;
  root.add(snow);
  root.add(new THREE.HemisphereLight("#dfe9f5", "#8a96a3", 1.1));
  const sun = new THREE.DirectionalLight("#ffffff", 0.6);
  sun.position.set(-30, 40, 20);
  root.add(sun);
  return { root, snow, NS, fig };
};
const TundraScene: React.FC<{ f: number; life: number; freezeAt: number; nearAt: number; clearAt: number; lite: boolean }> = ({ f, life, freezeAt, nearAt, clearAt, lite }) => {
  const { camera, scene } = useThree();
  const W = useMemo(() => {
    let w = TUNDRAS.get(lite);
    if (!w) TUNDRAS.set(lite, (w = buildTundra(lite)));
    return w;
  }, [lite]);
  const clear = interpolate(f, [nearAt, clearAt], [0, 1], { ...C, easing: Easing.inOut(Easing.cubic) });
  scene.background = new THREE.Color("#c9d3dd");
  scene.fog = new THREE.FogExp2("#c9d3dd", 0.05 - 0.032 * clear);
  // andando: avança devagar com o balanço do passo; perto do fim acelera em direção à figura
  const walk = (f / 30) * 1.1;
  const near = interpolate(f, [nearAt, life], [0, 1], { ...C, easing: Easing.inOut(Easing.cubic) });
  const z = 6 - walk - near * 50;
  const bob = Math.sin((f / 30) * 5.2) * 0.05 * (1 - near * 0.6);
  camera.position.set(Math.sin(f / 90) * 0.4, th(0, z) + 1.65 + bob, z);
  camera.lookAt(0.6, th(0.6, -70) + 1.2, -70);
  // neve: vento forte de lado; em `freezeAt` congela no ar (a física para)
  const ff = Math.min(f, freezeAt);
  const pos = (W.snow.geometry.getAttribute("position") as THREE.BufferAttribute).array as Float32Array;
  for (let i = 0; i < W.NS; i++) {
    const sx = rnd(i * 3) * 40 - 20;
    const sy = rnd(i * 7) * 12;
    const sz = rnd(i * 11) * 40 - 20;
    const sp = 0.6 + rnd(i * 13);
    const yy = (((sy - ff * 0.05 * sp) % 12) + 12) % 12;
    const xx = ((((sx + ff * 0.22 * sp + Math.sin(ff / 20 + i) * 0.3) % 40) + 40) % 40) - 20;
    const fz = f >= freezeAt;
    const zb = fz ? z0Freeze(freezeAt) : z;
    pos[i * 3] = (fz ? 0 : camera.position.x) + xx;
    pos[i * 3 + 1] = (fz ? th(0, zb) + 1.65 : camera.position.y) - 6 + yy;
    pos[i * 3 + 2] = zb + sz;
  }
  W.snow.geometry.getAttribute("position").needsUpdate = true;
  return <primitive object={W.root} dispose={null} />;
};
// com a neve parada, os flocos ficam presos no lugar do mundo (a câmera passa por eles)
const z0Freeze = (freezeAt: number) => 6 - (freezeAt / 30) * 1.1;
export const HLTundra: React.FC<{ life: number; freezeAt?: number; nearAt?: number; clearAt?: number }> = ({ life, freezeAt = 1e9, nearAt = 1e9, clearAt = 1e9 }) => {
  const f = useCurrentFrame();
  const lite = useContext(LiteCtx);
  const clear = interpolate(f, [nearAt, clearAt], [0, 1], { ...C, easing: Easing.inOut(Easing.cubic) });
  const blur = 3.2 * (1 - clear);
  return (
    <AbsoluteFill style={{ background: "#c9d3dd" }}>
      <AbsoluteFill style={{ filter: blur > 0.05 ? `blur(${blur}px)` : undefined }}>
        <Canvas3D f={f} lite={lite} fov={50} pos={[0, 2, 6]} near={0.05} far={400}>
          <TundraScene f={f} life={life} freezeAt={freezeAt} nearAt={nearAt} clearAt={clearAt} lite={lite} />
        </Canvas3D>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0) 45%, rgba(120,135,150,0.5) 100%)" }} />
    </AbsoluteFill>
  );
};

void Img;
void staticFile;
