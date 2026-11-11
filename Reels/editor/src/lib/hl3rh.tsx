// =================================================================================================
// HL3 · REFORMULAÇÃO · 5A/5B "a hipótese" e "os dados de perto" (06/10/2026)
//  · HLRHypothesis: o modelo antigo (vieram de OUTRO LUGAR → ERRADO) → tira de filme (cronofotografia): a mesma
//    criatura quadro a quadro, mesma assinatura → as exposições se sobrepõem num eixo do tempo → ONDE gira e vira
//    QUANDO → os dias dela tentando entender
//  · HLRCloseData: espectrograma em cascata; a faixa curta acende (4,1 s); as marcas dos Flickers; a lupa sobre a
//    faixa; 310 m contra os registros antigos (dezenas de km)
// =================================================================================================
import React, { useLayoutEffect, useMemo, useRef } from "react";
import { AbsoluteFill, Easing, interpolate, staticFile, useCurrentFrame } from "remotion";
import { FONT, MONO } from "./overlays";
import { C, HL, rnd } from "./hl3";
import { FilmLook } from "./hl3r";
import { Glitch } from "./hl3rs";

const RED = "#ff5d4d";
const CREAM = "#ffe2b0";
const ICE = "#9fe6ff";
const MAG = "#ff3df0";
const TYPE = "'Courier New', monospace";
const ORANGE = HL.orange;
const TXT = HL.text;
const P = (f: number, at: number, d = 12) => interpolate(f, [at, at + d], [0, 1], { ...C, easing: Easing.out(Easing.cubic) });
const IO = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

// contorno simplificado do Ártico (ilhas/costas) para o mapa do modelo antigo
const COAST = [
  "M 300 640 Q 420 560 560 600 T 820 560 Q 900 520 980 560 L 1040 640",
  "M 1100 600 Q 1200 520 1320 560 T 1560 520 Q 1640 540 1700 620",
  "M 620 380 Q 700 330 780 360 Q 820 400 760 430 Q 680 440 620 380 Z",
  "M 1180 340 Q 1260 300 1330 330 Q 1350 370 1290 390 Q 1220 400 1180 340 Z",
];

type HP = { life: number; wrongAt?: number; notAt?: number; sameAt?: number; momAt?: number; ifAt?: number; whereAt?: number; whenAt?: number; daysAt?: number };
export const HLRHypothesis: React.FC<HP> = (p) => {
  const f = useCurrentFrame();
  const a = (v?: number) => v ?? 1e9;
  const [wrongAt, notAt, sameAt, momAt, ifAt, whereAt, whenAt, daysAt] = [p.wrongAt, p.notAt, p.sameAt, p.momAt, p.ifAt, p.whereAt, p.whenAt, p.daysAt].map(a);
  const life = p.life;
  // ---------------- o modelo antigo: o mapa
  const map = 1 - P(f, notAt, 14);
  const wrong = P(f, wrongAt + 90, 8);
  // ---------------- a tira de filme
  const strip = P(f, notAt, 16) * (1 - P(f, momAt + 20, 16));
  const stripX = 1920 - 2600 * IO((f - notAt) / 70) - Math.max(0, f - notAt - 70) * 1.2;
  const FR = 9;
  const fw = 300;
  const merge = IO((f - momAt) / 30);
  // ---------------- ONDE → QUANDO
  const words = P(f, whereAt - 6, 10);
  const flip = IO((f - whenAt) / 14);
  const days = Math.min(6, Math.max(0, Math.floor((f - daysAt) / 7) + 1));
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, #10141a 0%, #050608 75%)", overflow: "hidden" }}>
      {/* o modelo antigo: o quadro de investigação da Mossman (pedido dele 08/10: as setas "outro lugar?" eram genéricas).
          Mapa de papel do Ártico com a estação; em volta, as fotos dos lugares de onde se achava que os Flickers vinham;
          barbantes até a estação, os Flickers descendo por eles; o carimbo ERRADO por cima do quadro */}
      {map > 0 ? (
        <AbsoluteFill style={{ opacity: map, perspective: 1600 }}>
          <div style={{ position: "absolute", inset: 0, transform: `rotateX(9deg) scale(${1.02 + Math.min(f, 200) * 0.0004 + (1 - map) * 0.15})`, transformOrigin: "50% 60%" }}>
            <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
              <defs>
                <filter id="hyCork"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves={3} seed={7} /><feColorMatrix values="0 0 0 0 0.42  0 0 0 0 0.3  0 0 0 0 0.18  0 0 0 0.55 0" /></filter>
                <radialGradient id="hyLamp" cx="0.5" cy="0.42" r="0.7"><stop offset="0" stopColor="rgba(255,220,160,0.18)" /><stop offset="1" stopColor="rgba(0,0,0,0.75)" /></radialGradient>
                <radialGradient id="hyXen" cx="0.62" cy="0.3" r="0.9"><stop offset="0" stopColor="#d8846a" /><stop offset="0.5" stopColor="#5e3466" /><stop offset="1" stopColor="#170e22" /></radialGradient>
                <radialGradient id="hyPortal" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor="#ffffff" /><stop offset="0.35" stopColor="#9fe6ff" /><stop offset="0.7" stopColor="#2a6a90" /><stop offset="1" stopColor="#0a1620" /></radialGradient>
              </defs>
              <rect x={150} y={70} width={1620} height={930} rx={10} fill="#5a4026" />
              <rect x={150} y={70} width={1620} height={930} rx={10} filter="url(#hyCork)" />
              {/* o mapa de papel do Ártico, com a estação */}
              <g transform="rotate(-1.5 960 560)">
                <rect x={690} y={390} width={540} height={350} fill="#e6dcc0" />
                <path d="M 700 600 Q 780 560 860 590 T 1010 570 Q 1080 540 1140 580 L 1220 600" fill="none" stroke="#3a4a5a" strokeWidth={2.5} />
                <path d="M 780 470 Q 830 440 880 460 Q 900 490 860 505 Q 810 510 780 470 Z" fill="rgba(58,74,90,0.15)" stroke="#3a4a5a" strokeWidth={2} />
                <path d="M 1060 455 Q 1110 430 1150 450 Q 1160 478 1120 490 Q 1080 492 1060 455 Z" fill="rgba(58,74,90,0.15)" stroke="#3a4a5a" strokeWidth={2} />
                {Array.from({ length: 6 }).map((_, k) => <line key={k} x1={690 + k * 90} y1={390} x2={690 + k * 90} y2={740} stroke="rgba(58,74,90,0.15)" />)}
                <text x={705} y={418} fill="#3a2a18" fontFamily={TYPE} fontSize={16} letterSpacing={2}>ÁRTICO · SETOR DA ESTAÇÃO</text>
                <circle cx={960} cy={560} r={14} fill="none" stroke="#a01a10" strokeWidth={3} />
                <text x={982} y={566} fill="#7a1810" fontFamily={TYPE} fontSize={18} fontWeight={700}>ESTAÇÃO</text>
              </g>
              {/* as fotos dos "outros lugares" */}
              {([
                [300, 150, -5, "XEN?"],
                [1380, 140, 4, "OUTRO MUNDO?"],
                [260, 700, 3, "BLACK MESA · 1998?"],
                [1420, 690, -4, "PORTAL DE WHITE FOREST?"],
              ] as [number, number, number, string][]).map(([x, y, r, lab], i) => {
                const show = P(f, 4 + i * 7, 12);
                return (
                  <g key={i} transform={`rotate(${r} ${x + 110} ${y + 120})`} opacity={show}>
                    <rect x={x + 6} y={y + 8} width={220} height={250} fill="rgba(0,0,0,0.45)" />
                    <rect x={x} y={y} width={220} height={250} fill="#f1ece0" />
                    <clipPath id={`hyc${i}`}><rect x={x + 12} y={y + 12} width={196} height={180} /></clipPath>
                    <g clipPath={`url(#hyc${i})`}>
                      {i === 0 ? (
                        <g>
                          <rect x={x + 12} y={y + 12} width={196} height={180} fill="url(#hyXen)" />
                          {[[50, 90, 26], [120, 70, 18], [160, 120, 30]].map(([cx, cy, rr], k) => (
                            <g key={k}>
                              <ellipse cx={x + 12 + cx} cy={y + 12 + cy} rx={rr} ry={rr * 0.32} fill="#2c1a2e" />
                              <path d={`M ${x + 12 + cx - rr * 0.8} ${y + 12 + cy} Q ${x + 12 + cx} ${y + 12 + cy + rr * 1.3} ${x + 12 + cx + rr * 0.8} ${y + 12 + cy}`} fill="#1a0f1c" />
                            </g>
                          ))}
                          {Array.from({ length: 20 }).map((_, k) => <circle key={k} cx={x + 12 + rnd(k) * 196} cy={y + 12 + rnd(k * 3) * 60} r={0.9} fill="#fff" opacity={0.7} />)}
                        </g>
                      ) : null}
                      {i === 1 ? (
                        <g>
                          <rect x={x + 12} y={y + 12} width={196} height={180} fill="#1e2a26" />
                          <circle cx={x + 60} cy={y + 60} r={22} fill="#c8d8b0" opacity={0.8} />
                          <circle cx={x + 100} cy={y + 46} r={9} fill="#e8c890" opacity={0.8} />
                          {Array.from({ length: 9 }).map((_, k) => <rect key={k} x={x + 14 + k * 22} y={y + 192 - 30 - rnd(k * 5) * 90} width={12} height={30 + rnd(k * 5) * 90} fill="#0c1210" />)}
                        </g>
                      ) : null}
                      {i === 2 ? (
                        <g>
                          <rect x={x + 12} y={y + 12} width={196} height={180} fill="#2a2a26" />
                          <image href={staticFile("hl3silh/bm_logo.svg")} x={x + 50} y={y + 36} width={120} height={120} opacity={0.75} />
                        </g>
                      ) : null}
                      {i === 3 ? (
                        <g>
                          <rect x={x + 12} y={y + 12} width={196} height={180} fill="#0c141a" />
                          <ellipse cx={x + 110} cy={y + 100} rx={60 + 4 * Math.sin(f / 6)} ry={70 + 4 * Math.sin(f / 6)} fill="url(#hyPortal)" />
                          <rect x={x + 12} y={y + 160} width={196} height={32} fill="#1a1e22" />
                        </g>
                      ) : null}
                    </g>
                    <text x={x + 110} y={y + 228} textAnchor="middle" fill="#2a2418" fontFamily={TYPE} fontSize={17} fontWeight={700}>{lab}</text>
                  </g>
                );
              })}
              {/* os barbantes até a estação, e os Flickers descendo por eles */}
              {([[410, 280], [1490, 270], [370, 830], [1530, 820]] as [number, number][]).map(([x, y], i) => {
                const draw = P(f, 12 + i * 7, 20);
                const ex = 960;
                const ey = 560;
                const mx = (x + ex) / 2;
                const my = (y + ey) / 2 + 40;
                const at = (u: number) => [(1 - u) * (1 - u) * x + 2 * (1 - u) * u * mx + u * u * ex, (1 - u) * (1 - u) * y + 2 * (1 - u) * u * my + u * u * ey];
                const pts = Array.from({ length: 21 }).map((_, k) => at((k / 20) * draw));
                const fu = ((f - 30 - i * 9) / 60) % 1;
                const [fx, fy] = at(Math.max(0, fu));
                return (
                  <g key={i}>
                    <polyline points={pts.map(([a2, b2]) => `${a2.toFixed(0)},${(b2 + 4).toFixed(0)}`).join(" ")} fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth={3} />
                    <polyline points={pts.map(([a2, b2]) => `${a2.toFixed(0)},${b2.toFixed(0)}`).join(" ")} fill="none" stroke="#c0281c" strokeWidth={2.6} />
                    <circle cx={x} cy={y} r={8} fill="#d6332a" stroke="rgba(0,0,0,0.5)" />
                    {f >= 30 + i * 9 && draw >= 1 ? <Glitch f={f + i * 7} x={fx} y={fy} s={0.55} seed={3 + i} /> : null}
                  </g>
                );
              })}
              <circle cx={960} cy={560} r={9} fill="#d6332a" stroke="rgba(0,0,0,0.5)" />
              <rect x={150} y={70} width={1620} height={930} rx={10} fill="url(#hyLamp)" />
            </svg>
          </div>
          <div style={{ position: "absolute", left: 80, top: 40, fontFamily: MONO, fontSize: 20, letterSpacing: 6, color: ICE }}>O MODELO ANTIGO · OS FLICKERS VIERAM DE FORA</div>
          {wrong > 0 ? (
            <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
              <div style={{ padding: "10px 40px", border: `8px solid ${RED}`, color: RED, fontFamily: FONT, fontWeight: 800, fontSize: 130, letterSpacing: 4, transform: `rotate(-8deg) scale(${1.6 - 0.6 * wrong})`, opacity: wrong, background: "rgba(10,4,4,0.5)" }}>ERRADO</div>
            </AbsoluteFill>
          ) : null}
        </AbsoluteFill>
      ) : null}
      {/* a tira de filme */}
      {strip > 0 ? (
        <AbsoluteFill style={{ opacity: strip }}>
          <div style={{ position: "absolute", left: stripX * (1 - merge), top: 330, height: 360, width: FR * (fw + 30) + 60, background: "#0d0c0a", boxShadow: "0 20px 60px rgba(0,0,0,0.7)" }}>
            {[8, 330].map((y) => (
              <div key={y} style={{ position: "absolute", left: 0, right: 0, top: y, height: 22, backgroundImage: "repeating-linear-gradient(90deg, rgba(0,0,0,0) 0 18px, #e9e2cf 18px 34px, rgba(0,0,0,0) 34px 52px)", opacity: 0.85, borderRadius: 3 }} />
            ))}
            {Array.from({ length: FR }).map((_, k) => {
              const x = 30 + k * (fw + 30);
              const show = P(f, notAt + 16 + k * 3, 8);
              return (
                <div key={k} style={{ position: "absolute", left: x, top: 44, width: fw, height: 272, background: "linear-gradient(180deg, #2a2620, #14120f)", overflow: "hidden", opacity: show }}>
                  <svg width={fw} height={272} style={{ position: "absolute", inset: 0 }}>
                    <line x1={0} x2={fw} y1={220} y2={220} stroke="rgba(233,226,207,0.25)" />
                    <Glitch f={f} x={90 + k * 16} y={170} s={1.1} seed={3} />
                  </svg>
                  <div style={{ position: "absolute", left: 10, bottom: 8, fontFamily: MONO, fontSize: 16, letterSpacing: 2, color: CREAM }}>{`T+${(k * 0.4).toFixed(1).replace(".", ",")} s`}</div>
                  {f >= sameAt ? <div style={{ position: "absolute", right: 10, top: 8, fontFamily: MONO, fontSize: 15, letterSpacing: 2, color: MAG, opacity: P(f, sameAt + k * 2, 6) }}>7F·2C</div> : null}
                </div>
              );
            })}
          </div>
          {f >= sameAt ? (
            <div style={{ position: "absolute", left: 80, top: 160, opacity: P(f, sameAt, 10) * (1 - merge) }}>
              <div style={{ fontFamily: MONO, fontSize: 16, letterSpacing: 6, color: MAG }}>MESMA ASSINATURA EM TODOS OS QUADROS</div>
              <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 72, color: TXT, lineHeight: 1 }}>a mesma criatura</div>
            </div>
          ) : null}
        </AbsoluteFill>
      ) : null}
      {/* as exposições se sobrepõem: um eixo do tempo */}
      {f >= momAt && f < whereAt + 20 ? (
        <AbsoluteFill style={{ opacity: P(f, momAt, 14) * (1 - P(f, ifAt, 14) * 0.75) }}>
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
            <line x1={260} x2={1660} y1={760} y2={760} stroke="rgba(242,240,247,0.5)" strokeWidth={2} />
            <path d="M 1660 760 l -14 -8 l 0 16 Z" fill="rgba(242,240,247,0.5)" />
            {Array.from({ length: 6 }).map((_, k) => {
              const x = 560 + k * 170 * merge;
              return (
                <g key={k} opacity={1 - k * 0.12}>
                  <Glitch f={f + k * 5} x={x} y={640} s={1.6} seed={3} />
                  <line x1={x} x2={x} y1={748} y2={772} stroke={CREAM} strokeWidth={2} />
                  <text x={x} y={800} textAnchor="middle" fill={CREAM} fontFamily={MONO} fontSize={16} letterSpacing={2} opacity={merge}>{`T+${(k * 0.4).toFixed(1).replace(".", ",")}`}</text>
                </g>
              );
            })}
            <text x={1660} y={800} textAnchor="end" fill="rgba(242,240,247,0.6)" fontFamily={MONO} fontSize={16} letterSpacing={4}>
              TEMPO →
            </text>
          </svg>
          <div style={{ position: "absolute", left: 80, top: 160 }}>
            <div style={{ fontFamily: MONO, fontSize: 16, letterSpacing: 6, color: CREAM }}>NÃO SÃO VÁRIAS</div>
            <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 72, color: TXT, lineHeight: 1 }}>em momentos diferentes</div>
          </div>
        </AbsoluteFill>
      ) : null}
      {/* ONDE → QUANDO */}
      {words > 0 ? (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", perspective: 1400 }}>
          <div style={{ position: "relative", width: 1200, height: 260, transformStyle: "preserve-3d", transform: `rotateX(${flip * 180}deg)`, opacity: words }}>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT, fontWeight: 800, fontSize: 240, letterSpacing: -8, color: TXT, backfaceVisibility: "hidden" }}>ONDE</div>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT, fontWeight: 800, fontSize: 240, letterSpacing: -8, color: ORANGE, backfaceVisibility: "hidden", transform: "rotateX(180deg)" }}>QUANDO</div>
          </div>
          {f >= daysAt ? (
            <div style={{ position: "absolute", top: 720, display: "flex", gap: 14, alignItems: "center", opacity: P(f, daysAt, 8) }}>
              <span style={{ fontFamily: MONO, fontSize: 20, letterSpacing: 6, color: CREAM }}>OS ÚLTIMOS DIAS DELA</span>
              {Array.from({ length: 6 }).map((_, k) => (
                <div key={k} style={{ width: 54, height: 70, borderRadius: 6, background: k < days ? "#e9e2cf" : "rgba(233,226,207,0.12)", color: "#1d1a17", fontFamily: FONT, fontWeight: 800, fontSize: 34, display: "flex", alignItems: "center", justifyContent: "center", transform: `rotateX(${k === days - 1 ? (1 - P(f, daysAt + k * 7, 6)) * 90 : 0}deg)` }}>
                  {k < days ? k + 1 : ""}
                </div>
              ))}
            </div>
          ) : null}
        </AbsoluteFill>
      ) : null}
      <AbsoluteFill style={{ background: "#000", opacity: interpolate(f, [0, 6], [1, 0], C) + interpolate(f, [life - 6, life], [0, 1], C), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- os dados de perto
// cascata desenhada em canvas (milhares de células por quadro em SVG pesavam na prévia)
const Waterfall: React.FC<{ rows: number[][]; scroll: number; ROWS: number; rowH: number; W0: number; CW: number; col: (v: number) => string }> = ({ rows, scroll, ROWS, rowH, W0, CW, col }) => {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useLayoutEffect(() => {
    const c = ref.current;
    if (!c) return;
    const g = c.getContext("2d");
    if (!g) return;
    g.clearRect(0, 0, c.width, c.height);
    for (let i = 0; i < ROWS; i++) {
      const row = rows[(i + scroll) % rows.length];
      for (let b = 0; b < row.length; b++) {
        g.fillStyle = col(row[b]);
        g.fillRect(b * CW, i * rowH, CW + 0.6, rowH + 0.6);
      }
    }
  }, [rows, scroll, ROWS, rowH, CW, col]);
  return <canvas ref={ref} width={Math.ceil(rows[0].length * CW)} height={ROWS * rowH} style={{ position: "absolute", left: W0, top: 140 }} />;
};
type DP = { life: number; manifAt?: number; flickAt?: number; gaveAt?: number; secsAt?: number; neverAt?: number; closeAt?: number };
const BINS = 64;
export const HLRCloseData: React.FC<DP> = (p) => {
  const f = useCurrentFrame();
  const a = (v?: number) => v ?? 1e9;
  const [manifAt, flickAt, gaveAt, secsAt, neverAt, closeAt] = [p.manifAt, p.flickAt, p.gaveAt, p.secsAt, p.neverAt, p.closeAt].map(a);
  const life = p.life;
  // cascata: cada linha é um instante; a faixa de 4,1 s (linhas 40..80 a partir do começo) é forte
  const ROWS = 110;
  const rowH = 6;
  const band = (r: number) => r >= 40 && r < 82;
  const rows = useMemo(
    () =>
      Array.from({ length: 240 }).map((_, r) =>
        Array.from({ length: BINS }).map((__, b) => {
          const n = rnd(r * 131 + b * 7.3);
          const hot = band(r) ? 0.45 + 0.55 * Math.exp(-Math.pow((b - 22 - Math.sin(r / 4) * 6) / 7, 2)) + 0.3 * Math.exp(-Math.pow((b - 44) / 4, 2)) : 0;
          return Math.min(1, 0.08 + n * 0.18 + hot);
        }),
      ),
    [],
  );
  const scroll = Math.floor(Math.min(28, f * 0.2)); // a faixa desce até o meio da tela e fica
  const col = (v: number) => {
    const r = Math.round(20 + 235 * Math.min(1, v * 1.4));
    const g = Math.round(20 + 180 * Math.max(0, v - 0.35) * 1.6);
    const b = Math.round(40 + 120 * (1 - v));
    return `rgb(${r},${g},${b})`;
  };
  const W0 = 160;
  const CW = 1100 / BINS;
  const bandY0 = 140 + (40 - scroll) * rowH;
  const lens = P(f, neverAt, 16);
  const near = P(f, closeAt - 30, 20);
  return (
    <AbsoluteFill style={{ background: "#05070a", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 80, top: 56, fontFamily: MONO, letterSpacing: 6 }}>
        <div style={{ fontSize: 22, color: ICE }}>SENSORES DA MOSSMAN · A MANIFESTAÇÃO CURTA</div>
        <div style={{ fontSize: 16, color: "rgba(242,240,247,0.6)", marginTop: 6 }}>CASCATA DE FREQUÊNCIAS · TEMPO ↓</div>
      </div>
      <Waterfall rows={rows} scroll={scroll} ROWS={ROWS} rowH={rowH} W0={W0} CW={CW} col={col} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <rect x={W0} y={140} width={1100} height={ROWS * rowH} fill="none" stroke="rgba(159,230,255,0.35)" />
        {/* a faixa curta */}
        {f >= gaveAt ? (
          <g opacity={P(f, gaveAt, 10)}>
            <rect x={W0 - 14} y={bandY0} width={1128} height={42 * rowH} fill="none" stroke={CREAM} strokeWidth={3} />
            <text x={W0} y={bandY0 - 14} fill={CREAM} fontFamily={MONO} fontSize={20} letterSpacing={3}>
              4,1 S
            </text>
            <text x={W0 + 90} y={bandY0 - 14} fill="rgba(255,226,176,0.75)" fontFamily={MONO} fontSize={16} letterSpacing={2}>
              {`${Math.round(12882 * P(f, secsAt, 20)).toLocaleString("pt-BR")} AMOSTRAS`}
            </text>
          </g>
        ) : null}
        {/* marcas dos Flickers (depois da faixa) */}
        {f >= flickAt
          ? Array.from({ length: 9 }).map((_, k) => {
              const y = bandY0 + 42 * rowH + 20 + k * 22;
              if (y > 140 + ROWS * rowH - 4) return null;
              return <circle key={k} cx={W0 + (8 + rnd(k * 3.1) * 50) * CW} cy={y} r={6} fill={MAG} opacity={P(f, flickAt + k * 2, 6)} />;
            })
          : null}
        {/* a lupa */}
        {lens > 0
          ? (() => {
              const cx = W0 + 22 * CW;
              const cy = bandY0 + 20 * rowH;
              const R = 170 * lens;
              return (
                <g>
                  <defs>
                    <clipPath id="lensClip">
                      <circle cx={cx} cy={cy} r={R} />
                    </clipPath>
                  </defs>
                  <g clipPath="url(#lensClip)">
                    <rect x={cx - R} y={cy - R} width={R * 2} height={R * 2} fill="#0a0c10" />
                    {Array.from({ length: 24 }).map((_, i) =>
                      Array.from({ length: 16 }).map((__, b) => {
                        const v = rows[(40 + 10 + i) % rows.length][14 + b];
                        return <rect key={`L${i}-${b}`} x={cx - R + b * ((2 * R) / 16)} y={cy - R + i * ((2 * R) / 24)} width={(2 * R) / 16 + 0.5} height={(2 * R) / 24 + 0.5} fill={col(v)} />;
                      }),
                    )}
                  </g>
                  <circle cx={cx} cy={cy} r={R} fill="none" stroke={CREAM} strokeWidth={4} />
                  <line x1={cx + R * 0.7} y1={cy + R * 0.7} x2={cx + R * 1.15} y2={cy + R * 1.15} stroke={CREAM} strokeWidth={10} strokeLinecap="round" />
                </g>
              );
            })()
          : null}
      </svg>
      {/* a distância: 310 m contra dezenas de km */}
      <div style={{ position: "absolute", right: 90, top: 200, width: 460, fontFamily: MONO, opacity: P(f, manifAt, 10) }}>
        <div style={{ fontSize: 16, letterSpacing: 5, color: "rgba(242,240,247,0.65)" }}>DISTÂNCIA DO FENÔMENO</div>
        {[
          ["REGISTROS ANTIGOS", "~ 40 KM", 1, "rgba(159,230,255,0.5)"],
          ["ESTA NOITE", "310 M", 0.04, CREAM],
        ].map(([l, v, w, c], k) => (
          <div key={k} style={{ marginTop: 22, opacity: k === 1 ? near : 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, letterSpacing: 3, color: c as string }}>
              <span>{l}</span>
              <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 40 }}>{v}</span>
            </div>
            <div style={{ height: 10, marginTop: 6, background: "rgba(242,240,247,0.1)", borderRadius: 5 }}>
              <div style={{ height: 10, width: `${(w as number) * 100 * (k === 1 ? near : P(f, manifAt, 20))}%`, minWidth: k === 1 ? 8 * near : 0, background: c as string, borderRadius: 5 }} />
            </div>
          </div>
        ))}
        {near > 0 ? <div style={{ marginTop: 26, fontFamily: FONT, fontWeight: 800, fontSize: 52, color: TXT, lineHeight: 1.05, opacity: near }}>nunca tão de perto</div> : null}
      </div>
      <AbsoluteFill style={{ background: "#000", opacity: interpolate(f, [0, 6], [1, 0], C) + interpolate(f, [life - 5, life], [0, 1], C), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};
