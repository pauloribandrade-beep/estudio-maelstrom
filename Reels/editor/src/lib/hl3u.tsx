import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { MONO } from "./overlays";
import { C, rnd } from "./hl3";

// 3C · A JANELA CURTA: linha do tempo das manifestações do Borealis (o sinal registrado pela resistência). A câmera
// desliza do passado (picos antigos, irregulares) até AGORA; o colchete da JANELA acende entre agora e a próxima
// aparição prevista; no "curta" a câmera aperta nele e o tempo restante pisca; no "aparecer de novo" o pico do
// Borealis acende. Fundo: a aurora que dá nome ao navio, bem apagada. Tempos em QUADROS.

const AMB = "#ffb22e";
const GRN = "#8dffa8";
const P = (f: number, at: number, d = 12) => interpolate(f, [at, at + d], [0, 1], { ...C, easing: Easing.out(Easing.cubic) });
const flickIn = (f: number, at: number) => {
  const d = f - at;
  if (d < 0) return 0;
  return d < 7 ? [0.25, 1, 0.35, 1, 0.7, 1, 0.9][d] : 1;
};

// eixo em "dias" (1 dia = 60 px no mundo); AGORA no dia 0; a próxima aparição no dia +6
const DAY = 60;
const NOW = 0;
const NEXT = 6;
const PAST = [-41, -36.5, -29, -25.5, -18, -13.2, -7]; // manifestações antigas (intervalos que encurtam)

export const HLWindow: React.FC<{ life: number; knowAt?: number; windowAt?: number; shortAt?: number; shipAt?: number }> = ({ life, knowAt = 0, windowAt = 1e9, shortAt = 1e9, shipAt = 1e9 }) => {
  const f = useCurrentFrame();
  // câmera: desliza do passado até AGORA (rápido e freia), depois aperta na janela
  const slide = interpolate(f, [0, Math.min(windowAt, life * 0.55)], [0, 1], { ...C, easing: Easing.out(Easing.cubic) });
  // no "curta" a câmera AFASTA: o histórico longo aparece inteiro e a janela vira uma faixa fina à direita
  const out = P(f, shortAt, 26);
  const camDay = -38 + (NOW + 3 + 38) * slide - out * 17;
  const zoom = 1.1 - out * 0.7 + interpolate(f, [0, life], [0, 0.04], C);
  const sx = (day: number) => 960 + (day - camDay) * DAY * zoom;
  const Y = 660;
  // sinal: ruído de fundo + picos nas manifestações (o do futuro só acende no fim)
  const sig: string[] = [];
  for (let x = -40; x <= 1960; x += 6) {
    const day = camDay + (x - 960) / (DAY * zoom);
    let h = (rnd(Math.floor(day * 9) + 3) - 0.5) * 10 * (0.6 + 0.4 * Math.sin(f / 4 + day));
    for (const p of PAST) h -= 250 * Math.exp(-(((day - p) * 3.2 * Math.max(0.55, zoom)) ** 2));
    if (day < NOW + 0.1) {
      sig.push(`${sig.length ? "L" : "M"} ${x} ${Y + h}`);
    }
  }
  const ship = P(f, shipAt, 10);
  const nx = sx(NEXT);
  const nowx = sx(NOW);
  const win = P(f, windowAt, 16);
  const short = P(f, shortAt, 14);
  const blink = f >= shortAt ? (Math.floor((f - shortAt) / 8) % 2 ? 0.55 : 1) : 1;
  return (
    <AbsoluteFill style={{ background: "#03070b", overflow: "hidden" }}>
      {/* a aurora ao fundo, bem apagada, ondulando */}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="aurW" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3fe0a0" stopOpacity="0" />
            <stop offset="55%" stopColor="#3fe0a0" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#3fe0a0" stopOpacity="0" />
          </linearGradient>
        </defs>
        {Array.from({ length: 34 }).map((_, i) => {
          const x = ((i * 61 - f * 0.8) % 2100) - 90;
          const h = 260 + 120 * Math.sin(i * 1.7 + f / 40);
          return <rect key={i} x={x} y={120 + 40 * Math.sin(i * 0.9 + f / 50)} width={28} height={h} fill="url(#aurW)" opacity={0.5 + 0.5 * Math.sin(i + f / 30)} />;
        })}
      </svg>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {/* régua dos dias */}
        {Array.from({ length: 80 }).map((_, i) => {
          const day = Math.floor(camDay) - 40 + i;
          const x = sx(day);
          if (x < -20 || x > 1940) return null;
          const big = day % 5 === 0;
          return (
            <g key={day}>
              <line x1={x} y1={Y + 120} x2={x} y2={Y + (big ? 96 : 108)} stroke={AMB} strokeWidth={big ? 2 : 1} opacity={0.5} />
              {big ? (
                <text x={x} y={Y + 150} textAnchor="middle" fill={AMB} fontFamily={MONO} fontSize={18} letterSpacing={2} opacity={0.6}>
                  {day === 0 ? "D0" : day > 0 ? `D+${day}` : `D${day}`}
                </text>
              ) : null}
            </g>
          );
        })}
        <line x1={0} y1={Y + 120} x2={1920} y2={Y + 120} stroke={AMB} strokeWidth={1.5} opacity={0.4} />
        {/* o sinal registrado */}
        <path d={sig.join(" ")} fill="none" stroke={GRN} strokeWidth={2.5} opacity={0.85} style={{ filter: "drop-shadow(0 0 6px rgba(141,255,168,0.6))" }} />
        {PAST.map((p, i) => {
          const x = sx(p);
          if (x < -50 || x > 1970) return null;
          return (
            <text key={i} x={x} y={Y - 270} textAnchor="middle" fill={GRN} fontFamily={MONO} fontSize={15} letterSpacing={3} opacity={0.55 * Math.max(0, 1 - out * 2)}>
              MANIFESTAÇÃO
            </text>
          );
        })}
        {/* a janela: de AGORA até a próxima aparição */}
        {win > 0 ? (
          <g opacity={win}>
            <rect x={nowx} y={Y - 260} width={Math.max(0, (nx - nowx) * win)} height={380} fill={AMB} opacity={0.1 + 0.06 * short * blink} />
            <path d={`M ${nowx} ${Y - 270} L ${nowx} ${Y - 290} L ${nowx + (nx - nowx) * win} ${Y - 290} L ${nowx + (nx - nowx) * win} ${Y - 270}`} fill="none" stroke={AMB} strokeWidth={4} />
            <text x={(nowx + nx) / 2} y={Y - 306} textAnchor="middle" fill={AMB} fontFamily={MONO} fontSize={30} letterSpacing={10} opacity={blink}>
              {short > 0.5 ? "JANELA CURTA" : "JANELA"}
            </text>
            {short > 0 ? (
              <text x={(nowx + nx) / 2} y={Y - 360} textAnchor="middle" fill={AMB} fontFamily={MONO} fontSize={56} fontWeight={700} letterSpacing={6} opacity={short * blink}>
                6d 04h 12m
              </text>
            ) : null}
          </g>
        ) : null}
        {/* AGORA */}
        <line x1={nowx} y1={Y - 260} x2={nowx} y2={Y + 120} stroke="#ffe2b0" strokeWidth={3} opacity={P(f, knowAt, 10)} />
        <text x={nowx - 14} y={Y + 190} textAnchor="end" fill="#ffe2b0" fontFamily={MONO} fontSize={22} letterSpacing={6} opacity={P(f, knowAt, 10)}>
          AGORA
        </text>
        {/* a próxima aparição: tracejada até acender */}
        <line x1={nx} y1={Y - 260} x2={nx} y2={Y + 120} stroke={GRN} strokeWidth={ship > 0 ? 4 : 2} strokeDasharray={ship > 0 ? undefined : "8 10"} opacity={0.4 + 0.6 * Math.max(win, ship)} />
        {ship > 0 ? (
          <g>
            <path d={`M ${nx - 40} ${Y} Q ${nx} ${Y - 240 * ship} ${nx + 40} ${Y}`} fill="none" stroke={GRN} strokeWidth={4} style={{ filter: "drop-shadow(0 0 14px rgba(141,255,168,0.9))" }} />
            <circle cx={nx} cy={Y - 120 * ship} r={40 + 30 * (1 - ship) + 6 * Math.sin(f / 3)} fill="none" stroke={GRN} strokeWidth={2} opacity={0.7} />
          </g>
        ) : null}
        <text x={nx + 18} y={Y - 236} fill={GRN} fontFamily={MONO} fontSize={22} letterSpacing={6} opacity={Math.max(win * 0.7, flickIn(f, shipAt))}>
          {ship > 0 ? "BOREALIS · APARECE" : "PRÓXIMA · PREVISTA"}
        </text>
      </svg>
      <div style={{ position: "absolute", left: 90, top: 70, fontFamily: MONO, color: AMB, letterSpacing: 5, fontSize: 22, lineHeight: 1.6 }}>
        <div>RESISTÊNCIA · SINAL DO BOREALIS</div>
        <div style={{ opacity: 0.6, fontSize: 18 }}>REGISTRO DAS MANIFESTAÇÕES · PREVISÃO</div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 120, display: "flex", justifyContent: "center", gap: 70, fontFamily: MONO, fontSize: 22, letterSpacing: 4, color: AMB, opacity: P(f, windowAt + 6, 12) }}>
        <span>MANIFESTAÇÕES REGISTRADAS · 7</span>
        <span>INTERVALO · ENCURTANDO</span>
        <span style={{ color: GRN }}>PRÓXIMA · D+6</span>
      </div>
      <AbsoluteFill style={{ background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.18) 0 2px, rgba(0,0,0,0) 2px 4px)", pointerEvents: "none" }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.6) 100%)", pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};
