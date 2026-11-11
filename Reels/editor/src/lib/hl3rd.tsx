// =================================================================================================
// HL3 · REFORMULAÇÃO · 5B "fora de sincronia" (06/10/2026)
//  1) o modelo antigo: globo do Ártico (vista do polo) com o navio piscando em lugares diferentes
//  2) o registro da noite: trilhas EMISSÃO / RECEPÇÃO — um sinal chega ANTES de sair (seta volta no tempo); o
//     EVENTO 12 se repete +2,4 s; os Flickers em eco numa terceira trilha
//  3) não é LUGAR: é TEMPO — "FORA DE SINCRONIA" com as letras defasadas; o navio rasga em fatias de tempo
//  4) o navio de perfil partido em seções, cada uma num tempo (+4 s, −12 anos, −30 anos) com o desgaste da época
//  5) CÓPIAS → ECOS: a criatura com rastros que decaem no eixo do tempo
//  6) os dados: um filtro de defasagem varre o fluxo e acende o que ela agora sabe procurar
// =================================================================================================
import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { FONT, MONO } from "./overlays";
import { C, HL, rnd } from "./hl3";
import { FilmLook } from "./hl3r";
import { Glitch } from "./hl3rs";

const RED = "#ff5d4d";
const CREAM = "#ffe2b0";
const ICE = "#9fe6ff";
const MAG = "#ff3df0";
const ORANGE = HL.orange;
const TXT = HL.text;
const P = (f: number, at: number, d = 12) => interpolate(f, [at, at + d], [0, 1], { ...C, easing: Easing.out(Easing.cubic) });
const IO = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

// ---------------------------------------------------------------- o navio de perfil (Borealis), 1000 × 300
export const ShipProfile: React.FC<{ stroke: string; fill: string; rust?: number; w?: number; seed?: number }> = ({ stroke, fill, rust = 0, w = 2, seed = 0 }) => (
  <g strokeLinejoin="round">
    {/* casco */}
    <path d="M 20 210 L 70 290 L 900 290 L 985 200 L 940 196 L 930 210 Z" fill={fill} stroke={stroke} strokeWidth={w} />
    <line x1={60} y1={262} x2={920} y2={262} stroke={stroke} strokeWidth={w * 0.6} opacity={0.6} />
    {/* convés e porões */}
    {[0, 1, 2, 3].map((k) => (
      <rect key={k} x={300 + k * 140} y={176} width={110} height={34} fill={fill} stroke={stroke} strokeWidth={w * 0.8} />
    ))}
    {/* superestrutura da popa */}
    <path d="M 70 210 L 70 110 L 250 110 L 250 210 Z" fill={fill} stroke={stroke} strokeWidth={w} />
    <path d="M 90 110 L 90 70 L 230 70 L 230 110" fill={fill} stroke={stroke} strokeWidth={w} />
    <path d="M 110 70 L 110 40 L 200 40 L 200 70" fill={fill} stroke={stroke} strokeWidth={w} />
    {Array.from({ length: 7 }).map((_, k) => (
      <rect key={"j" + k} x={84 + k * 23} y={124} width={14} height={10} fill={stroke} opacity={0.55} />
    ))}
    {Array.from({ length: 5 }).map((_, k) => (
      <rect key={"j2" + k} x={104 + k * 23} y={82} width={14} height={9} fill={stroke} opacity={0.55} />
    ))}
    {/* chaminé e mastro */}
    <path d="M 260 210 L 260 120 L 296 120 L 300 210" fill={fill} stroke={stroke} strokeWidth={w} />
    <line x1={155} y1={40} x2={155} y2={0} stroke={stroke} strokeWidth={w} />
    <line x1={135} y1={14} x2={175} y2={14} stroke={stroke} strokeWidth={w * 0.8} />
    {/* guindastes */}
    {[380, 660].map((x, k) => (
      <g key={"g" + k}>
        <line x1={x} y1={176} x2={x} y2={70} stroke={stroke} strokeWidth={w} />
        <line x1={x} y1={76} x2={x + 150} y2={140} stroke={stroke} strokeWidth={w} />
        <line x1={x + 150} y1={140} x2={x + 150} y2={168} stroke={stroke} strokeWidth={w * 0.6} />
      </g>
    ))}
    {/* proa e mastro da frente */}
    <line x1={900} y1={196} x2={900} y2={110} stroke={stroke} strokeWidth={w} />
    <line x1={900} y1={110} x2={960} y2={196} stroke={stroke} strokeWidth={w * 0.6} />
    {/* ferrugem / desgaste (manchas escorrendo) */}
    {rust > 0
      ? Array.from({ length: 26 }).map((_, k) => {
          const x = 40 + rnd(k * 3.1 + seed) * 900;
          const y = 200 + rnd(k * 5.7 + seed) * 70;
          const h = 10 + rnd(k * 2.3 + seed) * 40 * rust;
          return <rect key={"r" + k} x={x} y={y} width={3 + rnd(k) * 6} height={h} fill="rgba(140,62,24,0.75)" opacity={rust} />;
        })
      : null}
  </g>
);

type DP = { life: number; logAt?: number; earlyAt?: number; repAt?: number; flickAt?: number; notMoveAt?: number; syncAt?: number; partsAt?: number; secAt?: number; yearAt?: number; decAt?: number; presentAt?: number; multAt?: number; notCopyAt?: number; echoAt?: number; dataAt?: number; knowAt?: number };
export const HLRDesync: React.FC<DP> = (p) => {
  const f = useCurrentFrame();
  const a = (v?: number) => v ?? 1e9;
  const [logAt, earlyAt, repAt, flickAt, notMoveAt, syncAt, partsAt, secAt, yearAt, decAt, presentAt, multAt, notCopyAt, echoAt, dataAt, knowAt] = [p.logAt, p.earlyAt, p.repAt, p.flickAt, p.notMoveAt, p.syncAt, p.partsAt, p.secAt, p.yearAt, p.decAt, p.presentAt, p.multAt, p.notCopyAt, p.echoAt, p.dataAt, p.knowAt].map(a);
  const life = p.life;
  // ---------------- 1) o globo
  const globe = 1 - P(f, logAt, 16);
  const rot = f * 0.004;
  const pings = [
    { lat: 78, lon: 20, at: 18 },
    { lat: 72, lon: 140, at: 40 },
    { lat: 81, lon: -60, at: 62 },
    { lat: 69, lon: -150, at: 84 },
    { lat: 75, lon: 90, at: 106 },
  ];
  const polar = (lat: number, lon: number): [number, number] => {
    const r = ((90 - lat) / 35) * 380;
    return [960 + r * Math.cos(lon * (Math.PI / 180) + rot), 560 + r * Math.sin(lon * (Math.PI / 180) + rot)];
  };
  // ---------------- 2) as trilhas
  const log = P(f, logAt, 16) * (1 - P(f, notMoveAt, 14));
  const TX = (s: number) => 220 + s * 85; // segundos → x
  // ---------------- 3) FORA DE SINCRONIA
  const sync = P(f, notMoveAt, 12) * (1 - P(f, partsAt, 14));
  const word = "FORA DE SINCRONIA";
  // ---------------- 4) as seções do navio
  const parts = P(f, partsAt, 16) * (1 - P(f, multAt, 14));
  const SECS = [
    { x0: 0, x1: 300, at: secAt, dy: -40, dx: 30, label: "+4 S", rust: 0, col: ICE, tint: "rgba(159,230,255,0.10)" },
    { x0: 300, x1: 580, at: yearAt, dy: 60, dx: -40, label: "−12 ANOS", rust: 0.6, col: "#e7b98a", tint: "rgba(231,185,138,0.10)" },
    { x0: 580, x1: 1000, at: decAt, dy: -20, dx: 60, label: "−30 ANOS", rust: 1, col: "#c98f6a", tint: "rgba(201,143,106,0.12)" },
  ];
  // ---------------- 5) ecos
  const echo = P(f, multAt, 14) * (1 - P(f, dataAt, 14));
  const nEcho = Math.min(7, Math.floor(Math.max(0, f - multAt) / 6));
  // ---------------- 6) os dados
  const data = P(f, dataAt, 14);
  const scan = interpolate(f, [knowAt - 20, knowAt + 30], [0, 1], { ...C, easing: Easing.inOut(Easing.quad) });
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, #0b1218 0%, #030507 78%)", overflow: "hidden" }}>
      {/* 1) o globo */}
      {globe > 0 ? (
        <AbsoluteFill style={{ opacity: globe, transform: `translateY(${-200 * (1 - globe)}px) scale(${1 - 0.2 * (1 - globe)})` }}>
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
            <circle cx={960} cy={560} r={420} fill="rgba(159,230,255,0.03)" stroke="rgba(159,230,255,0.35)" strokeWidth={2} />
            {[60, 70, 80].map((lat) => (
              <circle key={lat} cx={960} cy={560} r={((90 - lat) / 35) * 380} fill="none" stroke="rgba(159,230,255,0.14)" />
            ))}
            {Array.from({ length: 12 }).map((_, k) => {
              const [x, y] = polar(55, k * 30);
              return <line key={k} x1={960} y1={560} x2={x} y2={y} stroke="rgba(159,230,255,0.1)" />;
            })}
            {/* costas aproximadas */}
            {/* costa do Ártico (anel suave) e duas ilhas */}
            <polygon
              points={Array.from({ length: 61 })
                .map((_, j) => {
                  const lon = j * 6;
                  const [x, y] = polar(68 + 3.5 * Math.sin(lon * 0.05 + 1) + 2 * Math.sin(lon * 0.13), lon);
                  return `${x.toFixed(1)},${y.toFixed(1)}`;
                })
                .join(" ")}
              fill="none"
              stroke="rgba(159,230,255,0.45)"
              strokeWidth={2}
            />
            {[
              [77, 40, 4],
              [80, 250, 3],
            ].map(([la, lo, r], k) => (
              <polygon
                key={"il" + k}
                points={Array.from({ length: 13 })
                  .map((_, j) => {
                    const [x, y] = polar(la + Math.sin((j / 12) * Math.PI * 2) * 1.2, lo + Math.cos((j / 12) * Math.PI * 2) * r * (1 + 0.2 * Math.sin(j * 2)));
                    return `${x.toFixed(1)},${y.toFixed(1)}`;
                  })
                  .join(" ")}
                fill="rgba(159,230,255,0.08)"
                stroke="rgba(159,230,255,0.4)"
                strokeWidth={1.5}
              />
            ))}
            {pings.map((pg, k) => {
              if (f < pg.at) return null;
              const [x, y] = polar(pg.lat, pg.lon);
              const t = f - pg.at;
              const on = t < 20;
              return (
                <g key={k}>
                  <circle cx={x} cy={y} r={10 + (t % 30) * 2} fill="none" stroke={ICE} strokeWidth={2} opacity={Math.max(0, 1 - (t % 30) / 30) * (on ? 1 : 0.3)} />
                  <g transform={`translate(${x - 30} ${y - 18}) scale(0.06)`} opacity={on ? 1 : 0.25}>
                    <ShipProfile stroke={ICE} fill="rgba(159,230,255,0.15)" w={20} />
                  </g>
                </g>
              );
            })}
          </svg>
          <div style={{ position: "absolute", left: 80, top: 70, fontFamily: MONO, fontSize: 20, letterSpacing: 6, color: ICE }}>MODELO ATÉ ENTÃO · O NAVIO SALTA DE LUGAR</div>
        </AbsoluteFill>
      ) : null}
      {/* 2) o registro: emissão / recepção / Flickers */}
      {log > 0 ? (
        <AbsoluteFill style={{ opacity: log }}>
          <div style={{ position: "absolute", left: 80, top: 70, fontFamily: MONO, fontSize: 20, letterSpacing: 6, color: CREAM }}>OS REGISTROS DAQUELA NOITE</div>
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
            {[
              ["EMISSÃO", 330],
              ["RECEPÇÃO", 560],
              ["FLICKERS", 790],
            ].map(([n, y], k) => (
              <g key={k} opacity={k === 2 ? P(f, flickAt, 10) : 1}>
                <line x1={200} x2={1760} y1={y as number} y2={y as number} stroke="rgba(242,240,247,0.3)" strokeWidth={2} />
                <text x={200} y={(y as number) - 24} fill="rgba(242,240,247,0.7)" fontFamily={MONO} fontSize={16} letterSpacing={5}>
                  {n}
                </text>
              </g>
            ))}
            {Array.from({ length: 19 }).map((_, k) => (
              <g key={"t" + k}>
                <line x1={TX(k)} x2={TX(k)} y1={880} y2={892} stroke="rgba(242,240,247,0.4)" />
                <text x={TX(k)} y={914} textAnchor="middle" fill="rgba(242,240,247,0.45)" fontFamily={MONO} fontSize={13}>{`${k}s`}</text>
              </g>
            ))}
            {/* pulsos normais */}
            {[1, 3, 5].map((s, k) => (
              <g key={"n" + k} opacity={P(f, logAt + 10 + k * 6, 8)}>
                <rect x={TX(s) - 4} y={300} width={8} height={30} fill={ICE} />
                <rect x={TX(s + 0.6) - 4} y={530} width={8} height={30} fill={ICE} />
                <line x1={TX(s)} y1={334} x2={TX(s + 0.6)} y2={528} stroke="rgba(159,230,255,0.4)" strokeDasharray="4 5" />
              </g>
            ))}
            {/* o sinal que chega ANTES de sair */}
            {f >= earlyAt ? (
              <g opacity={P(f, earlyAt, 10)}>
                <rect x={TX(11) - 5} y={296} width={10} height={34} fill={CREAM} />
                <rect x={TX(8) - 5} y={526} width={10} height={34} fill={RED} />
                {(() => {
                  const e = P(f, earlyAt + 6, 20);
                  const x2 = TX(11) + (TX(8) - TX(11)) * e;
                  const y2 = 334 + (522 - 334) * e;
                  return (
                    <g>
                      <path d={`M ${TX(11)} 334 Q ${TX(12.5)} 440 ${x2} ${y2}`} fill="none" stroke={RED} strokeWidth={3} />
                      {e > 0.95 ? <path d={`M ${TX(8)} 522 l 4 -16 l 10 10 Z`} fill={RED} /> : null}
                    </g>
                  );
                })()}
                <text x={TX(8) - 10} y={606} fill={RED} fontFamily={MONO} fontSize={18} letterSpacing={3} opacity={P(f, earlyAt + 22, 8)}>
                  RECEBIDO 3,1 S ANTES DE SER EMITIDO
                </text>
              </g>
            ) : null}
            {/* o EVENTO 12 se repete */}
            {f >= repAt ? (
              <g>
                <g opacity={P(f, repAt, 8)}>
                  <rect x={TX(14)} y={520} width={TX(15.2) - TX(14)} height={44} rx={6} fill="rgba(159,230,255,0.18)" stroke={ICE} strokeWidth={2} />
                  <text x={TX(14) + 10} y={548} fill={ICE} fontFamily={MONO} fontSize={16} letterSpacing={2}>
                    EVENTO 12
                  </text>
                </g>
                <g opacity={P(f, repAt + 20, 8)}>
                  <rect x={TX(16.4)} y={520} width={TX(17.6) - TX(16.4)} height={44} rx={6} fill="rgba(159,230,255,0.08)" stroke={ICE} strokeWidth={2} strokeDasharray="8 5" />
                  <text x={TX(16.4) + 10} y={548} fill={ICE} fontFamily={MONO} fontSize={16} letterSpacing={2}>
                    EVENTO 12
                  </text>
                  <path d={`M ${TX(15.2)} 500 Q ${(TX(15.2) + TX(16.4)) / 2} 470 ${TX(16.4)} 500`} fill="none" stroke={CREAM} strokeWidth={2} />
                  <text x={(TX(15.2) + TX(16.4)) / 2} y={462} textAnchor="middle" fill={CREAM} fontFamily={MONO} fontSize={18} letterSpacing={2}>
                    +2,4 S
                  </text>
                </g>
              </g>
            ) : null}
            {/* Flickers em eco */}
            {f >= flickAt
              ? Array.from({ length: 8 }).map((_, k) => {
                  const x = TX(2 + k * 2);
                  return (
                    <g key={"e" + k} opacity={P(f, flickAt + k * 3, 6) * (1 - k * 0.08)}>
                      <Glitch f={f + k * 7} x={x} y={770} s={0.5} seed={3} />
                    </g>
                  );
                })
              : null}
          </svg>
        </AbsoluteFill>
      ) : null}
      {/* 3) não é lugar: é tempo */}
      {sync > 0 ? (
        <AbsoluteFill style={{ opacity: sync }}>
          {/* o navio rasgando em fatias horizontais de tempo */}
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
            <defs>
              {Array.from({ length: 8 }).map((_, k) => (
                <clipPath key={k} id={`slice${k}`}>
                  <rect x={0} y={k * 40} width={1000} height={40} />
                </clipPath>
              ))}
            </defs>
            {Array.from({ length: 8 }).map((_, k) => {
              const d = P(f, syncAt, 30) * (rnd(k * 3.3) - 0.5) * 260 + (f >= syncAt ? Math.sin((f + k * 9) / 7) * 10 : 0);
              return (
                <g key={k} transform={`translate(${460 + d} 600)`} clipPath={`url(#slice${k})`} opacity={0.85}>
                  <ShipProfile stroke={ICE} fill="rgba(159,230,255,0.08)" />
                </g>
              );
            })}
          </svg>
          {/* "não é lugar" */}
          <div style={{ position: "absolute", left: 80, top: 90, fontFamily: MONO, fontSize: 20, letterSpacing: 6, color: CREAM, opacity: 1 - P(f, syncAt, 10) }}>
            NÃO ESTÁ <span style={{ textDecoration: "line-through", textDecorationColor: RED }}>MUDANDO DE LUGAR</span>
          </div>
          {f >= syncAt - 4 ? (
            <div style={{ position: "absolute", left: 0, right: 0, top: 230, display: "flex", justifyContent: "center", fontFamily: FONT, fontWeight: 800, fontSize: 132, letterSpacing: -3 }}>
              {word.split("").map((ch, k) => {
                const t = P(f, syncAt + k * 1.5, 10);
                const lag = Math.sin((f - k * 4) / 5) * 8 * P(f, syncAt + 20, 20);
                return (
                  <span key={k} style={{ position: "relative", display: "inline-block", color: TXT, opacity: t, transform: `translateX(${lag}px) translateY(${(1 - t) * 30}px)`, whiteSpace: "pre" }}>
                    {ch}
                    <span style={{ position: "absolute", left: 0, top: 0, color: "transparent", WebkitTextStroke: `1.5px ${ORANGE}`, transform: `translateX(${-lag * 2.5}px)`, opacity: 0.7 }}>{ch}</span>
                  </span>
                );
              })}
            </div>
          ) : null}
          {f >= syncAt ? <div style={{ position: "absolute", left: 0, right: 0, top: 400, textAlign: "center", fontFamily: MONO, fontSize: 24, letterSpacing: 10, color: ORANGE, opacity: P(f, syncAt + 26, 10) }}>COM O TEMPO</div> : null}
        </AbsoluteFill>
      ) : null}
      {/* 4) as seções do navio em tempos diferentes */}
      {parts > 0 ? (
        <AbsoluteFill style={{ opacity: parts }}>
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
            <defs>
              {SECS.map((s, k) => (
                <clipPath key={k} id={`sec${k}`}>
                  <rect x={s.x0} y={-40} width={s.x1 - s.x0} height={400} />
                </clipPath>
              ))}
            </defs>
            {/* linha do PRESENTE */}
            <line x1={0} x2={1920} y1={720} y2={720} stroke="rgba(242,240,247,0.25)" strokeWidth={2} strokeDasharray="10 8" />
            <text x={80} y={706} fill="rgba(242,240,247,0.6)" fontFamily={MONO} fontSize={16} letterSpacing={5}>
              {f >= presentAt ? "O PRESENTE ↓" : "LINHA D'ÁGUA"}
            </text>
            {SECS.map((s, k) => {
              const e = P(f, s.at, 18);
              const jit = e > 0 ? Math.sin((f + k * 13) / 6) * 3 : 0;
              return (
                <g key={k}>
                  {/* fantasma no lugar certo */}
                  {e > 0 ? (
                    <g transform="translate(460 430)" clipPath={`url(#sec${k})`} opacity={0.18}>
                      <ShipProfile stroke="rgba(242,240,247,0.6)" fill="none" w={1.5} />
                    </g>
                  ) : null}
                  <g transform={`translate(${460 + s.dx * e + jit} ${430 + s.dy * e})`} clipPath={`url(#sec${k})`}>
                    <ShipProfile stroke={e > 0 ? s.col : ICE} fill={e > 0 ? s.tint : "rgba(159,230,255,0.08)"} rust={s.rust * e} seed={k * 11} />
                  </g>
                  {e > 0 ? (
                    <g opacity={e}>
                      <line x1={460 + (s.x0 + s.x1) / 2 + s.dx} y1={430 + s.dy - 10} x2={460 + (s.x0 + s.x1) / 2 + s.dx} y2={300 + (k % 2) * 40} stroke={s.col} strokeWidth={1.5} />
                      <text x={460 + (s.x0 + s.x1) / 2 + s.dx} y={286 + (k % 2) * 40} textAnchor="middle" fill={s.col} fontFamily={FONT} fontWeight={800} fontSize={54}>
                        {s.label}
                      </text>
                    </g>
                  ) : null}
                </g>
              );
            })}
          </svg>
          <div style={{ position: "absolute", left: 80, top: 70, fontFamily: MONO, fontSize: 20, letterSpacing: 6, color: CREAM }}>PARTES DO NAVIO · FORA DO PRESENTE</div>
        </AbsoluteFill>
      ) : null}
      {/* 5) cópias → ecos */}
      {echo > 0 ? (
        <AbsoluteFill style={{ opacity: echo }}>
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
            <line x1={240} x2={1680} y1={760} y2={760} stroke="rgba(242,240,247,0.35)" strokeWidth={2} />
            <text x={1680} y={796} textAnchor="end" fill="rgba(242,240,247,0.55)" fontFamily={MONO} fontSize={16} letterSpacing={4}>
              TEMPO →
            </text>
            {Array.from({ length: nEcho + 1 }).map((_, k) => {
              const x = 420 + k * 170;
              const o = Math.pow(0.82, k);
              return (
                <g key={k} opacity={o}>
                  {f >= echoAt ? [0, 1, 2].map((j) => <circle key={j} cx={x} cy={640} r={30 + (((f - echoAt) * 2 + j * 25 + k * 9) % 75)} fill="none" stroke={MAG} strokeWidth={2} opacity={1 - (((f - echoAt) * 2 + j * 25 + k * 9) % 75) / 75} />) : null}
                  <Glitch f={f + k * 4} x={x} y={640} s={1.2} seed={3} />
                  <line x1={x} x2={x} y1={748} y2={772} stroke={CREAM} strokeWidth={2} />
                </g>
              );
            })}
          </svg>
          <div style={{ position: "absolute", left: 0, right: 0, top: 170, display: "flex", justifyContent: "center", gap: 70, alignItems: "baseline" }}>
            <div style={{ position: "relative", fontFamily: FONT, fontWeight: 800, fontSize: 120, color: TXT, opacity: P(f, multAt + 10, 10) * (f >= echoAt ? 0.4 : 1) }}>
              CÓPIAS
              <div style={{ position: "absolute", left: -8, right: -8, top: "52%", height: 9, background: RED, transform: `scaleX(${P(f, notCopyAt, 8)})`, transformOrigin: "left" }} />
            </div>
            {f >= echoAt ? <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 150, color: MAG, opacity: P(f, echoAt, 8), transform: `scale(${1.3 - 0.3 * P(f, echoAt, 10)})`, textShadow: "0 0 40px rgba(255,61,240,0.4)" }}>ECOS</div> : null}
          </div>
        </AbsoluteFill>
      ) : null}
      {/* 6) os dados: o filtro de defasagem */}
      {data > 0 ? (
        <AbsoluteFill style={{ opacity: data }}>
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
            {Array.from({ length: 14 }).map((_, r) => {
              const y = 210 + r * 52;
              const pts = Array.from({ length: 80 }).map((__, i) => {
                const x = 160 + i * 20;
                const v = Math.sin(i * 0.35 + r) * 8 + (rnd(i * 7 + r * 31 + Math.floor((f - dataAt) / 3) * 0) - 0.5) * 18;
                return `${x},${(y + v).toFixed(1)}`;
              });
              const hit = r % 3 === 1;
              return (
                <g key={r}>
                  <polyline points={pts.join(" ")} fill="none" stroke={hit && scan > (r / 14) ? CREAM : "rgba(159,230,255,0.35)"} strokeWidth={hit && scan > r / 14 ? 2.6 : 1.4} />
                  {hit && scan > r / 14 ? (
                    <text x={1790} y={y + 6} textAnchor="end" fill={CREAM} fontFamily={MONO} fontSize={14} letterSpacing={2}>
                      τ = 0,38 s
                    </text>
                  ) : null}
                </g>
              );
            })}
            {/* o filtro varrendo */}
            {scan > 0 && scan < 1 ? <rect x={150} y={180 + scan * 740 - 30} width={1640} height={60} fill="rgba(255,178,46,0.08)" stroke="rgba(255,178,46,0.6)" strokeWidth={2} /> : null}
          </svg>
          <div style={{ position: "absolute", left: 80, top: 70, fontFamily: MONO, fontSize: 20, letterSpacing: 6, color: f >= knowAt - 20 ? ORANGE : ICE }}>{f >= knowAt - 20 ? "FILTRO · DEFASAGEM NO TEMPO" : "AINDA NÃO ENTENDE TUDO"}</div>
          {f >= knowAt ? (
            <div style={{ position: "absolute", right: 90, bottom: 80, textAlign: "right", opacity: P(f, knowAt, 10) }}>
              <div style={{ fontFamily: MONO, fontSize: 16, letterSpacing: 6, color: ORANGE }}>AGORA ELA SABE</div>
              <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 72, color: TXT, lineHeight: 1 }}>o que procurar</div>
            </div>
          ) : null}
        </AbsoluteFill>
      ) : null}
      <AbsoluteFill style={{ background: "#000", opacity: interpolate(f, [0, 6], [1, 0], C) + interpolate(f, [life - 6, life], [0, 1], C), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};
