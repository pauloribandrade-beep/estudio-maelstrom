// =================================================================================================
// HL3 · REFORMULAÇÃO · 5C "dentro do Borealis: as fases" (06/10/2026)
//  · HLRPhaseRooms: a MESMA sala em corte (casa de bonecas); uma frente de tempo varre e troca a época:
//    destruída → 1987 funcionando (rastros de gente correndo, longa exposição) → abandonada → muda de novo
//  · HLRSectorBoard: o navio de perfil fatiado em setores, cada um com um ano girando (painel de aeroporto)
//  · HLRPhaseMech: três cartões de mecânica (passagem +20 anos / parede que volta / máquina em outra fase) e um
//    seletor de tempo que vai e volta; REGENERANDO riscado → O MESMO LUGAR
//  · HLRXenDoor: primeira pessoa no corredor do navio; a passagem do fundo abre para Xen; raízes invadem; sombras
//    atravessam; fecha; MOSSMAN ? ALYX ?
//  · HLRRadio: a fala do Kleiner em blocos e forma de onda; fora de sincronia: atrasa, repete, embaralha, some
//  · HLRAlyxGuide: o navio em corte longitudinal; o caminho do grupo; o medidor de reconhecimento cresce perto das
//    partes antigas da Aperture
// =================================================================================================
import React, { useMemo } from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { FONT, MONO } from "./overlays";
import { C, HL, rnd } from "./hl3";
import { FilmLook } from "./hl3r";
import { ShipProfile } from "./hl3rd";
import { Eye, Hud, Lights, RoomView, proj } from "./hl3rf";
import { buildShipCorridor } from "./hl3rb";
import { XenVista } from "./hl3rx";

const RED = "#ff5d4d";
const CREAM = "#ffe2b0";
const ICE = "#9fe6ff";
const GREEN = "#8dffa8";
const MAG = "#ff3df0";
const ORANGE = HL.orange;
const AMB = "#ffb22e";
const APT = "#f39a1c";
const TXT = HL.text;
const P = (f: number, at: number, d = 12) => interpolate(f, [at, at + d], [0, 1], { ...C, easing: Easing.out(Easing.cubic) });
const IO = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const fade = (f: number, life: number) => interpolate(f, [0, 6], [1, 0], C) + interpolate(f, [life - 6, life], [0, 1], C);

// ---------------------------------------------------------------- isométrico
const K = 66;
const iso = (x: number, y: number, z: number, ox = 900, oy = 400): [number, number] => [ox + (x - y) * 0.866 * K, oy + (x + y) * 0.5 * K - z * K];
const isoPts = (ps: [number, number, number][], ox?: number, oy?: number) => ps.map((p) => iso(p[0], p[1], p[2], ox, oy).map((v) => v.toFixed(1)).join(",")).join(" ");
type Era = { floor: string; wallL: string; wallR: string; top: string; side1: string; side2: string; line: string; label: string; year: string; light: number };
const ERAS: Era[] = [
  { floor: "#2a2825", wallL: "#3d3630", wallR: "#332d28", top: "#4d443b", side1: "#3a322b", side2: "#2e2822", line: "rgba(255,93,77,0.5)", label: "DESTRUÍDO", year: "HOJE", light: 0.35 },
  { floor: "#cbc6bb", wallL: "#ebe7df", wallR: "#dcd7cd", top: "#f4f1ea", side1: "#d9d4ca", side2: "#c8c2b6", line: "rgba(243,154,28,0.8)", label: "FUNCIONANDO", year: "1987", light: 1 },
  { floor: "#57534b", wallL: "#6e6a61", wallR: "#625e56", top: "#8a867c", side1: "#6a665d", side2: "#5c5850", line: "rgba(159,230,255,0.35)", label: "ABANDONADO", year: "1994", light: 0.55 },
  { floor: "#26302f", wallL: "#35413f", wallR: "#2d3836", top: "#4c5a57", side1: "#3a4643", side2: "#303b39", line: "rgba(255,61,240,0.5)", label: "OUTRA FASE", year: "????", light: 0.5 },
];
// sala: 10 × 8, paredes em x=0 (esquerda) e y=0 (fundo), altura 4
const FURN: [number, number, number, number, number][] = [
  [1, 1, 3, 1.2, 1], // bancada
  [5, 1, 3, 1.2, 1],
  [1.2, 4, 1.2, 2.4, 1.6], // armário
  [6, 4.5, 2, 1.6, 0.8], // mesa
  [8.6, 1, 1, 1, 2.2], // rack
];
const Room: React.FC<{ era: Era; f: number; ei: number }> = ({ era, f, ei }) => {
  const box = (x: number, y: number, w: number, d: number, h: number, k: number, tilt = 0) => (
    <g key={`b${k}`} transform={tilt ? `rotate(${tilt} ${iso(x + w / 2, y + d / 2, 0)[0]} ${iso(x + w / 2, y + d / 2, 0)[1]})` : undefined}>
      <polygon points={isoPts([[x, y + d, 0], [x + w, y + d, 0], [x + w, y + d, h], [x, y + d, h]])} fill={era.side1} stroke={era.line} strokeWidth={1} />
      <polygon points={isoPts([[x + w, y, 0], [x + w, y + d, 0], [x + w, y + d, h], [x + w, y, h]])} fill={era.side2} stroke={era.line} strokeWidth={1} />
      <polygon points={isoPts([[x, y, h], [x + w, y, h], [x + w, y + d, h], [x, y + d, h]])} fill={era.top} stroke={era.line} strokeWidth={1} />
    </g>
  );
  return (
    <g>
      <polygon points={isoPts([[0, 0, 0], [10, 0, 0], [10, 8, 0], [0, 8, 0]])} fill={era.floor} stroke={era.line} />
      <polygon points={isoPts([[0, 0, 0], [0, 8, 0], [0, 8, 4], [0, 0, 4]])} fill={era.wallL} stroke={era.line} />
      <polygon points={isoPts([[0, 0, 0], [10, 0, 0], [10, 0, 4], [0, 0, 4]])} fill={era.wallR} stroke={era.line} />
      {/* painéis na parede do fundo */}
      {Array.from({ length: 5 }).map((_, k) => (
        <polyline key={"pn" + k} points={isoPts([[k * 2, 0, 0], [k * 2, 0, 4]])} stroke={era.line} strokeWidth={1} opacity={0.6} />
      ))}
      {/* logotipo / placa */}
      {ei === 1 ? (
        <g>
          <polygon points={isoPts([[3.6, 0.02, 2.4], [6.4, 0.02, 2.4], [6.4, 0.02, 3.4], [3.6, 0.02, 3.4]])} fill={APT} />
          
        </g>
      ) : null}
      {/* porta na parede esquerda */}
      <polygon points={isoPts([[0, 5.5, 0], [0, 7, 0], [0, 7, 2.6], [0, 5.5, 2.6]])} fill={ei === 1 ? "#f6f2e8" : "#0c0c0c"} stroke={era.line} />
      {FURN.map(([x, y, w, d, h], k) => box(x, y, w, d, h, k, ei === 0 && k % 2 === 0 ? (k === 0 ? 8 : -6) : 0))}
      {/* monitores (1987: acesos) */}
      {[2, 6].map((x, k) => (
        <polygon key={"mn" + k} points={isoPts([[x, 1.3, 1], [x + 0.9, 1.3, 1], [x + 0.9, 1.3, 1.7], [x, 1.3, 1.7]])} fill={ei === 1 ? (Math.floor(f / 8 + k) % 3 ? "#4cff9a" : "#2ec27a") : ei === 3 ? MAG : "#111"} opacity={ei === 1 ? 0.9 : 0.6} />
      ))}
      {/* destruído: entulho e rachaduras */}
      {ei === 0
        ? Array.from({ length: 14 }).map((_, k) => {
            const x = 1 + rnd(k * 3.1) * 8;
            const y = 2.5 + rnd(k * 5.3) * 5;
            const s = 0.2 + rnd(k) * 0.4;
            return <polygon key={"d" + k} points={isoPts([[x, y, 0], [x + s, y, 0], [x + s, y + s, s * 0.6], [x, y + s, s * 0.4]])} fill="#3d342c" stroke="rgba(255,93,77,0.4)" />;
          })
        : null}
      {/* abandonado: lençóis sobre os móveis */}
      {ei === 2
        ? FURN.slice(0, 3).map(([x, y, w, d, h], k) => <polygon key={"s" + k} points={isoPts([[x - 0.1, y - 0.1, h + 0.05], [x + w + 0.1, y - 0.1, h + 0.05], [x + w + 0.2, y + d + 0.1, 0.2], [x - 0.2, y + d + 0.1, 0.3]])} fill="rgba(230,226,215,0.75)" />)
        : null}
      {/* luz ambiente da época */}
      <polygon points={isoPts([[0, 0, 4], [10, 0, 4], [10, 8, 0], [0, 8, 0]])} fill={ei === 1 ? "rgba(255,250,235,0.08)" : "rgba(0,0,0,0)"} />
    </g>
  );
};
type PRP = { life: number; hardAt?: number; notAt?: number; destAt?: number; doorAt?: number; decAt?: number; staffAt?: number; aheadAt?: number; abandAt?: number; againAt?: number; insideAt?: number };
export const HLRPhaseRooms: React.FC<PRP> = (p) => {
  const f = useCurrentFrame();
  const a = (v?: number) => v ?? 1e9;
  const [hardAt, notAt, destAt, doorAt, decAt, staffAt, aheadAt, abandAt, againAt, insideAt] = [p.hardAt, p.notAt, p.destAt, p.doorAt, p.decAt, p.staffAt, p.aheadAt, p.abandAt, p.againAt, p.insideAt].map(a);
  const life = p.life;
  // sequência de épocas e quando cada troca começa
  const swaps = [decAt, abandAt, againAt];
  let ei = 0;
  for (let k = 0; k < swaps.length; k++) if (f >= swaps[k] + 26) ei = k + 1;
  const curSwap = swaps.findIndex((s) => f >= s && f < s + 26);
  const sweep = curSwap >= 0 ? IO((f - swaps[curSwap]) / 26) : 0;
  const fromE = curSwap >= 0 ? curSwap : ei;
  const toE = curSwap >= 0 ? curSwap + 1 : ei;
  const SX = 380 + sweep * 1160;
  const flick = ei === 0 && rnd(Math.floor(f / 3)) > 0.85 ? 0.6 : 1;
  const intro = P(f, 0, 20);
  // rastros de gente (1987)
  const trails = useMemo(() => Array.from({ length: 7 }).map((_, i) => ({ y: 2.6 + i * 0.75, sp: 0.06 + rnd(i * 3.3) * 0.05, ph: rnd(i * 7.1) * 10, dir: i % 2 ? 1 : -1 })), []);
  const group = [
    [6.8, 6.4, AMB],
    [7.6, 6.9, ORANGE],
    [6.2, 7.2, ICE],
  ] as const;
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 55%, #10161c 0%, #040608 78%)", overflow: "hidden" }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: intro * flick }}>
        <defs>
          <clipPath id="eraNew">
            <rect x={0} y={0} width={SX} height={1080} />
          </clipPath>
          <clipPath id="eraOld">
            <rect x={SX} y={0} width={1920 - SX} height={1080} />
          </clipPath>
        </defs>
        <g clipPath={curSwap >= 0 ? "url(#eraOld)" : undefined}>
          <Room era={ERAS[fromE]} f={f} ei={fromE} />
        </g>
        {curSwap >= 0 ? (
          <g clipPath="url(#eraNew)">
            <Room era={ERAS[toE]} f={f} ei={toE} />
          </g>
        ) : null}
        {/* rastros de gente (longa exposição) quando a sala está em 1987 */}
        {(ei === 1 || toE === 1) && f >= staffAt - 10
          ? trails.map((tr, i) => {
              const head = ((f * tr.sp + tr.ph) % 12) - 1;
              const x0 = tr.dir > 0 ? head : 10 - head;
              const pts: string[] = [];
              for (let k = 0; k < 14; k++) {
                const xx = x0 - tr.dir * k * 0.28;
                if (xx < 0 || xx > 10) continue;
                const [sx, sy] = iso(xx, tr.y, 1.6 + Math.sin(k + i) * 0.05);
                pts.push(`${sx.toFixed(1)},${sy.toFixed(1)}`);
              }
              return pts.length > 1 ? <polyline key={i} points={pts.join(" ")} fill="none" stroke="rgba(255,240,210,0.55)" strokeWidth={10} strokeLinecap="round" opacity={(ei === 1 ? 1 : sweep) * P(f, staffAt - 10, 12)} style={{ filter: "blur(3px)" }} /> : null;
            })
          : null}
        {/* a frente do tempo */}
        {curSwap >= 0 ? (
          <g>
            <line x1={SX} x2={SX} y1={0} y2={1080} stroke={CREAM} strokeWidth={3} />
            <rect x={SX - 60} y={0} width={60} height={1080} fill="url(#sweepG)" opacity={0.5} />
            <defs>
              <linearGradient id="sweepG" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0" stopColor="rgba(255,226,176,0)" />
                <stop offset="1" stopColor="rgba(255,226,176,0.35)" />
              </linearGradient>
            </defs>
          </g>
        ) : null}
        {/* o grupo dentro da sala (no fim) */}
        {f >= abandAt
          ? group.map(([x, y, c], i) => {
              const [sx, sy] = iso(x, y, 0.1);
              return (
                <g key={i} opacity={P(f, abandAt + i * 4, 8)}>
                  <ellipse cx={sx} cy={sy} rx={16} ry={8} fill="rgba(0,0,0,0.35)" />
                  <circle cx={sx} cy={sy - 14} r={9} fill={c} />
                </g>
              );
            })
          : null}
      </svg>
      {/* rótulos */}
      <div style={{ position: "absolute", left: 80, top: 70, fontFamily: MONO, letterSpacing: 6, opacity: intro }}>
        <div style={{ fontSize: 20, color: ICE }}>O MESMO SETOR · SALA 3-B</div>
        <div style={{ fontSize: 15, color: "rgba(242,240,247,0.6)", marginTop: 6 }}>{f >= notAt ? "O NAVIO NÃO FICA NO MESMO MOMENTO" : "PROCURAR QUALQUER COISA AQUI É DIFÍCIL"}</div>
      </div>
      <div style={{ position: "absolute", right: 90, top: 70, textAlign: "right", opacity: P(f, destAt - 6, 10) }}>
        <div style={{ fontFamily: MONO, fontSize: 16, letterSpacing: 6, color: ERAS[curSwap >= 0 && sweep > 0.5 ? toE : ei].line.replace(/0\.\d+\)/, "1)") }}>{ERAS[curSwap >= 0 && sweep > 0.5 ? toE : ei].label}</div>
        <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 120, color: TXT, lineHeight: 1 }}>{ERAS[curSwap >= 0 && sweep > 0.5 ? toE : ei].year}</div>
      </div>
      {f >= insideAt - 20 ? (
        <div style={{ position: "absolute", left: 80, bottom: 80, opacity: P(f, insideAt - 20, 10) }}>
          <div style={{ fontFamily: MONO, fontSize: 16, letterSpacing: 6, color: ORANGE }}>COM O GRUPO DENTRO</div>
          <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 64, color: TXT, lineHeight: 1 }}>a sala muda de novo</div>
        </div>
      ) : f >= staffAt ? (
        <div style={{ position: "absolute", left: 80, bottom: 80, opacity: P(f, staffAt, 10) * (1 - P(f, aheadAt, 10)) }}>
          <div style={{ fontFamily: MONO, fontSize: 16, letterSpacing: 6, color: APT }}>DÉCADAS ANTES</div>
          <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 64, color: TXT, lineHeight: 1 }}>funcionários da Aperture correndo</div>
        </div>
      ) : null}
      <AbsoluteFill style={{ background: "#000", opacity: fade(f, life), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- os setores: painel de anos
type SBP = { life: number; sectorsAt?: number; syncAt?: number; erasAt?: number; historyAt?: number };
const YEARS = ["1979", "1984", "1987", "1991", "1994", "1998", "2003", "2009", "2015", "2020", "HOJE"];
export const HLRSectorBoard: React.FC<SBP> = (p) => {
  const f = useCurrentFrame();
  const a = (v?: number) => v ?? 1e9;
  const [sectorsAt, syncAt, erasAt] = [p.sectorsAt, p.syncAt, p.erasAt].map(a);
  const life = p.life;
  const S = 1.5;
  const X0 = 960 - 500 * S;
  const Y0 = 520 - 150 * S;
  const N = 10;
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, #0b1218 0%, #030507 78%)", overflow: "hidden" }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <defs>
          {Array.from({ length: N }).map((_, k) => (
            <clipPath key={k} id={`sb${k}`}>
              <rect x={k * 100} y={-40} width={100} height={400} />
            </clipPath>
          ))}
        </defs>
        {Array.from({ length: N }).map((_, k) => {
          const on = P(f, sectorsAt + k * 2, 8);
          const flipping = f >= syncAt ? Math.floor((f - syncAt) / (5 + (k % 3) * 2) + k * 1.7) : 0;
          const yi = (k * 3 + flipping) % YEARS.length;
          const hue = (yi / YEARS.length) * 160 + 180;
          const dy = f >= syncAt ? Math.sin((f + k * 11) / 9) * 6 : 0;
          return (
            <g key={k} opacity={on}>
              <g transform={`translate(${X0} ${Y0 + dy}) scale(${S})`} clipPath={`url(#sb${k})`}>
                <ShipProfile stroke={`hsl(${hue},70%,72%)`} fill={`hsla(${hue},60%,50%,0.10)`} rust={yi < 4 ? 0 : (yi - 3) / 8} seed={k} />
              </g>
              <line x1={X0 + k * 100 * S} x2={X0 + k * 100 * S} y1={Y0 - 30} y2={Y0 + 300 * S + 20} stroke="rgba(242,240,247,0.18)" strokeDasharray="4 6" />
              {/* plaquinha do ano (painel de aeroporto) */}
              <g transform={`translate(${X0 + (k + 0.5) * 100 * S} ${Y0 + 300 * S + 60})`}>
                <rect x={-58} y={-26} width={116} height={52} rx={6} fill="#0b0d10" stroke={`hsl(${hue},70%,60%)`} strokeWidth={1.5} />
                <line x1={-58} x2={58} y1={0} y2={0} stroke="#000" strokeWidth={2} />
                <text x={0} y={11} textAnchor="middle" fill={TXT} fontFamily={MONO} fontSize={26} letterSpacing={2} transform={f >= syncAt && (f + k * 3) % (5 + (k % 3) * 2) < 2 ? "scale(1 0.4)" : undefined}>
                  {f >= syncAt ? YEARS[yi] : "HOJE"}
                </text>
              </g>
            </g>
          );
        })}
      </svg>
      <div style={{ position: "absolute", left: 80, top: 70, fontFamily: MONO, letterSpacing: 6 }}>
        <div style={{ fontSize: 20, color: ICE }}>SETORES DO BOREALIS</div>
        <div style={{ fontSize: 15, color: "rgba(242,240,247,0.6)", marginTop: 6, opacity: P(f, erasAt, 10) }}>CADA UM NUMA ÉPOCA DA PRÓPRIA HISTÓRIA</div>
      </div>
      <AbsoluteFill style={{ background: "#000", opacity: fade(f, life), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- a mecânica
type MCP = { life: number; mechAt?: number; passAt?: number; openAt?: number; wallAt?: number; backAt?: number; equipAt?: number; workAt?: number; notAt?: number; sameAt?: number; prevAt?: number; aheadAt?: number };
export const HLRPhaseMech: React.FC<MCP> = (p) => {
  const f = useCurrentFrame();
  const a = (v?: number) => v ?? 1e9;
  const [mechAt, passAt, openAt, wallAt, backAt, equipAt, workAt, notAt, sameAt, prevAt, aheadAt] = [p.mechAt, p.passAt, p.openAt, p.wallAt, p.backAt, p.equipAt, p.workAt, p.notAt, p.sameAt, p.prevAt, p.aheadAt].map(a);
  const life = p.life;
  const cardsOut = P(f, notAt - 6, 14);
  // seletor de tempo (−1 = antes do dano, 0 = presente, +1 = +20 anos)
  const slider = (() => {
    if (f < passAt) return 0;
    if (f < wallAt) return interpolate(f, [passAt + 20, openAt], [0, 1], C);
    if (f < equipAt) return interpolate(f, [wallAt + 40, backAt], [1, -1], C);
    if (f < notAt) return interpolate(f, [equipAt + 20, workAt], [-1, 0.6], C);
    if (f < prevAt) return 0.6;
    if (f < aheadAt) return interpolate(f, [prevAt - 10, prevAt + 20], [0.6, -1], C);
    return interpolate(f, [aheadAt - 10, aheadAt + 30], [-1, 1], C);
  })();
  const card = (i: number, title: string, sub: string, active: boolean, body: React.ReactNode) => (
    <div style={{ position: "absolute", left: 120 + i * 580, top: 200, width: 520, height: 440, borderRadius: 18, background: active ? "rgba(26,22,14,0.85)" : "rgba(12,16,20,0.7)", border: `1px solid ${active ? AMB : "rgba(159,230,255,0.25)"}`, boxShadow: active ? "0 0 50px rgba(255,178,46,0.15), 0 30px 70px rgba(0,0,0,0.5)" : "0 20px 50px rgba(0,0,0,0.4)", overflow: "hidden", opacity: P(f, mechAt + i * 6, 12) * (1 - cardsOut), transform: `translateY(${(1 - P(f, mechAt + i * 6, 14)) * 40}px) scale(${active ? 1.02 : 0.98})` }}>
      <svg width={520} height={330} style={{ position: "absolute", left: 0, top: 0 }}>
        {body}
      </svg>
      <div style={{ position: "absolute", left: 22, bottom: 20, right: 22 }}>
        <div style={{ fontFamily: MONO, fontSize: 14, letterSpacing: 4, color: active ? AMB : ICE }}>{sub}</div>
        <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 32, color: TXT, lineHeight: 1.1, marginTop: 4 }}>{title}</div>
      </div>
    </div>
  );
  const open = P(f, openAt - 10, 14);
  const hole = f >= wallAt + 14 && f < backAt ? 1 : 0;
  const working = P(f, workAt - 10, 12);
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 40%, #11161c 0%, #040608 78%)", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 120, top: 80, fontFamily: MONO, fontSize: 22, letterSpacing: 8, color: AMB, opacity: P(f, 0, 10) * (1 - cardsOut) }}>VIRA MECÂNICA</div>
      {/* 1) passagem */}
      {card(0, "Passagem bloqueada → aberta", "+20 ANOS", f >= passAt && f < wallAt, (
        <g>
          <rect x={60} y={40} width={400} height={250} fill="#151a1f" />
          <rect x={190} y={90} width={140} height={200} fill={`rgba(255,226,176,${0.08 + 0.4 * open})`} stroke="#3a4650" strokeWidth={4} />
          {Array.from({ length: 9 }).map((_, k) => (
            <rect key={k} x={185 + (k % 3) * 50 + rnd(k) * 10} y={190 + Math.floor(k / 3) * 34 - 40 * open * (1 + rnd(k * 2))} width={44} height={30} fill="#4a3f34" opacity={1 - open} transform={`rotate(${(rnd(k * 3) - 0.5) * 30 * (1 + open)} ${205 + (k % 3) * 50} ${205 + Math.floor(k / 3) * 34})`} />
          ))}
        </g>
      ))}
      {/* 2) parede */}
      {card(1, "A parede destruída volta", "ANTES DO DANO", f >= wallAt && f < equipAt, (
        <g>
          <rect x={60} y={40} width={400} height={250} fill="#151a1f" />
          <rect x={120} y={60} width={280} height={220} fill="#2e353c" stroke="#3d4852" strokeWidth={3} />
          {hole ? <path d="M 220 140 L 260 110 L 310 150 L 300 210 L 240 220 L 205 180 Z" fill="#05070a" stroke="#58636c" strokeWidth={3} /> : null}
          {f >= wallAt && f < wallAt + 14
            ? [0, 1, 2].map((k) => <circle key={k} cx={240 + k * 25} cy={160 + (k % 2) * 20} r={14 * (1 - (f - wallAt) / 14) + 3} fill="#fff1c4" />)
            : null}
          {f >= backAt && f < backAt + 10 ? <rect x={120} y={60} width={280} height={220} fill="none" stroke={ICE} strokeWidth={4} opacity={1 - (f - backAt) / 10} /> : null}
        </g>
      ))}
      {/* 3) máquina */}
      {card(2, "A máquina que não existe mais funciona", "OUTRA FASE", f >= equipAt && f < notAt, (
        <g>
          <rect x={60} y={40} width={400} height={250} fill="#151a1f" />
          <rect x={150} y={90} width={220} height={170} rx={10} fill={working > 0.5 ? "#2c3a36" : "#1f2326"} stroke={working > 0.5 ? GREEN : "#3a4249"} strokeWidth={3} />
          <g transform={`translate(215 175) rotate(${working * f * 14})`}>
            {[0, 1, 2, 3].map((k) => (
              <rect key={k} x={-4} y={-46} width={8} height={46} fill={working > 0.5 ? "#9fe6c8" : "#444"} transform={`rotate(${k * 90})`} />
            ))}
          </g>
          {[0, 1, 2].map((k) => (
            <circle key={k} cx={300} cy={130 + k * 30} r={8} fill={working > 0.5 ? (Math.floor(f / 6 + k) % 2 ? GREEN : AMB) : "#222"} />
          ))}
        </g>
      ))}
      {/* REGENERANDO → O MESMO LUGAR */}
      {cardsOut > 0 ? (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 10 }}>
          <div style={{ position: "relative", fontFamily: FONT, fontWeight: 800, fontSize: 110, color: TXT, opacity: cardsOut * (f >= sameAt ? 0.35 : 1) }}>
            se regenerando
            <div style={{ position: "absolute", left: -10, right: -10, top: "55%", height: 9, background: RED, transform: `scaleX(${P(f, notAt + 26, 10)})`, transformOrigin: "left" }} />
          </div>
          {f >= sameAt ? <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 120, color: ORANGE, opacity: P(f, sameAt, 10) }}>o mesmo lugar</div> : null}
        </AbsoluteFill>
      ) : null}
      {/* o seletor de tempo */}
      <div style={{ position: "absolute", left: 220, right: 220, bottom: 110, height: 80, opacity: P(f, passAt - 10, 12) }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 38, height: 4, background: "rgba(242,240,247,0.25)", borderRadius: 2 }} />
        {[
          [-1, f >= aheadAt - 10 ? "ESTADO ANTERIOR" : "ANTES DO DANO"],
          [0, "PRESENTE"],
          [1, f >= aheadAt - 10 ? "AVANÇANDO" : "+20 ANOS"],
        ].map(([v, l]) => (
          <div key={l as string} style={{ position: "absolute", left: `${((v as number) + 1) * 50}%`, top: 0, transform: "translateX(-50%)", textAlign: "center", fontFamily: MONO, fontSize: 15, letterSpacing: 3, color: "rgba(242,240,247,0.65)" }}>
            {l}
            <div style={{ width: 2, height: 16, background: "rgba(242,240,247,0.4)", margin: "6px auto 0" }} />
          </div>
        ))}
        <div style={{ position: "absolute", left: `${(slider + 1) * 50}%`, top: 26, width: 28, height: 28, marginLeft: -14, borderRadius: 14, background: AMB, boxShadow: "0 0 20px rgba(255,178,46,0.7)" }} />
      </div>
      <AbsoluteFill style={{ background: "#000", opacity: fade(f, life), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- a porta para Xen
type XP = { life: number; strangeAt?: number; doorAt?: number; xenAt?: number; vinesAt?: number; creatAt?: number; goneAt?: number; nobodyAt?: number; mossAt?: number; alyxAt?: number; knowAt?: number };
export const HLRXenDoor: React.FC<XP> = (p) => {
  const f = useCurrentFrame();
  const a = (v?: number) => v ?? 1e9;
  const [strangeAt, doorAt, xenAt, vinesAt, creatAt, goneAt, nobodyAt, mossAt, alyxAt, knowAt] = [p.strangeAt, p.doorAt, p.xenAt, p.vinesAt, p.creatAt, p.goneAt, p.nobodyAt, p.mossAt, p.alyxAt, p.knowAt].map(a);
  const life = p.life;
  const faces = useMemo(() => buildShipCorridor(), []);
  const e: Eye = { x: 0, y: 24.2 + 0.8 * P(f, doorAt, 60) - 0.7 * P(f, xenAt, 40), z: 1.7 + Math.sin(f / 5) * 0.02, yaw: Math.sin(f / 80) * 0.03, pitch: -0.02, F: 900 };
  const open = f >= xenAt ? P(f, xenAt, 10) * (1 - P(f, goneAt, 8)) : 0;
  const L: Lights = { flash: 0.7, lamps: 0.2, red: 0, strobe: open * 0.08 };
  // a passagem do fundo (anteparo em y = 30)
  const c0 = proj(e, [-1.3, 30, 0]);
  const c1 = proj(e, [1.3, 30, 0]);
  const c2 = proj(e, [1.3, 30, 2.4]);
  const c3 = proj(e, [-1.3, 30, 2.4]);
  const grow = P(f, vinesAt, 60) * (1 - P(f, goneAt, 12));
  const doorUp = IO((f - doorAt - 4) / 26);
  // o olho em Xen acompanha o do corredor (paralaxe); a ilha mais próxima fica no meio do vão
  const xe: Eye = { x: e.x * 3, y: -4 + (e.y - 25) * 3, z: 7.6, yaw: e.yaw, pitch: 0.06, F: 900 };
  const ct = (f - creatAt) / Math.max(30, goneAt - creatAt);
  const crit = f >= creatAt && f < goneAt ? [
    { src: "hl3silh/houndeye_silh.png", ar: 766 / 864, h: 1.1, x: -2.6 + 5.2 * ct, y: 14, z: 6.05 },
    { src: "hl3silh/bullsquid_silh.png", ar: 780 / 346, h: 0.8, x: 2.8 - 5.6 * Math.max(0, ct - 0.15), y: 15.2, z: 6.05 },
  ] : [];
  const hole = c0 && c1 && c2 && c3 ? `polygon(${c0.x}px ${c0.y}px, ${c1.x}px ${c1.y}px, ${c2.x}px ${c2.y}px, ${c3.x}px ${c3.y}px)` : "polygon(0 0, 0 0, 0 0)";
  const flash = f >= xenAt && f < xenAt + 10 ? 1 - (f - xenAt) / 10 : 0;
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <RoomView e={e} L={L} f={f} faces={faces} />
      {/* Xen pelo vão (o mesmo Xen da queda), com as criaturas cruzando em silhueta */}
      {open > 0 ? (
        <AbsoluteFill style={{ clipPath: hole, opacity: open }}>
          <XenVista e={xe} f={f} crit={crit} />
          <AbsoluteFill style={{ background: `rgba(255,236,200,${flash * 0.8})` }} />
        </AbsoluteFill>
      ) : null}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {/* a porta do anteparo sobe para dentro do teto (o que está atrás é escuro até virar Xen) */}
        {c0 && c1 && c2 && c3 && doorUp < 1 && f >= doorAt - 30 ? (() => {
          const zb = 2.4 * doorUp;
          const a = proj(e, [-1.3, 29.98, zb]);
          const b = proj(e, [1.3, 29.98, zb]);
          if (!a || !b) return null;
          return (
            <g>
              <polygon points={`${a.x},${a.y} ${b.x},${b.y} ${c2.x},${c2.y} ${c3.x},${c3.y}`} fill="#34363d" stroke="#101014" strokeWidth={2} />
              {[0.4, 0.8, 1.2, 1.6, 2.0].filter((z) => z > zb).map((z) => {
                const l = proj(e, [-1.3, 29.97, z]);
                const r = proj(e, [1.3, 29.97, z]);
                return l && r ? <line key={z} x1={l.x} y1={l.y} x2={r.x} y2={r.y} stroke="#24252b" strokeWidth={1.5} /> : null;
              })}
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#e8b830" strokeWidth={4} />
            </g>
          );
        })() : null}
        {/* a luz quente de Xen vazando no corredor */}
        {open > 0 && c0 && c1 ? <polygon points={`${c0.x},${c0.y} ${c1.x},${c1.y} ${1560},${1080} ${360},${1080}`} fill="rgba(255,196,120,0.1)" opacity={open} /> : null}
        {/* a vegetação de Xen invadindo: o musgo das ilhas se espalha pelo chão a partir do vão, e em cima dele crescem
            as plantas (caule de luz com bulbo, arvorezinha de copa, broto rosado) */}
        {grow > 0
          ? (() => {
              const L = grow * 5.2;
              const hw = (y: number) => Math.min(2.18, 1.1 + (30 - y) * 0.45);
              const edgeL: string[] = [];
              const edgeR: string[] = [];
              for (let k = 0; k <= 20; k++) {
                const y = 30 - (k / 20) * L;
                const tip = k === 20 ? 0.55 : 1;
                const wob = 1 + 0.12 * Math.sin(k * 1.7 + f / 30) + 0.08 * Math.sin(k * 3.9);
                const l = proj(e, [-hw(y) * wob * tip, y, 0.02]);
                const r = proj(e, [hw(y) * (2 - wob) * tip, y, 0.02]);
                if (l) edgeL.push(`${l.x.toFixed(1)},${l.y.toFixed(1)}`);
                if (r) edgeR.push(`${r.x.toFixed(1)},${r.y.toFixed(1)}`);
              }
              const near = proj(e, [0, 30 - L, 0]);
              const far = proj(e, [0, 30, 0]);
              const spots = Array.from({ length: 26 }).map((_, i) => {
                const y = 30 - rnd(i * 3.7) * L * 0.95;
                const x = (rnd(i * 1.9) - 0.5) * 2 * hw(y) * 0.85;
                const q = proj(e, [x, y, 0.03]);
                return q ? <ellipse key={i} cx={q.x} cy={q.y} rx={Math.max(1.5, 50 / q.d)} ry={Math.max(1, 16 / q.d)} fill={i % 3 ? "#3e5030" : "#9fe8b8"} opacity={i % 3 ? 0.8 : 0.45 + 0.35 * Math.sin(f / 9 + i)} /> : null;
              });
              const veins = Array.from({ length: 7 }).map((_, i) => {
                const pts: string[] = [];
                for (let k = 0; k <= 10; k++) {
                  const y = 30 - (k / 10) * L * 0.9;
                  const q = proj(e, [(i - 3) * 0.5 + Math.sin(k * 0.9 + i) * 0.25, y, 0.03]);
                  if (q) pts.push(`${q.x.toFixed(1)},${q.y.toFixed(1)}`);
                }
                return <polyline key={i} points={pts.join(" ")} fill="none" stroke="#3a4c2a" strokeWidth={2} opacity={0.6} />;
              });
              const plants = Array.from({ length: 13 }).map((_, i) => {
                const y = 30 - (0.05 + 0.5 * rnd(i * 5.1)) * 5.2;
                if (30 - y > L) return null;
                const x = (rnd(i * 2.3) - 0.5) * 2 * hw(y) * 0.8;
                const kind = i % 3;
                const up = P(f, vinesAt + (30 - y) * 9 + 6, 24);
                const H = (kind === 0 ? 0.9 + 0.5 * rnd(i) : kind === 1 ? 0.8 + 0.4 * rnd(i) : 0.35) * up;
                const sway = Math.sin(f / 26 + i) * 0.06;
                const b = proj(e, [x, y, 0.02]);
                const t = proj(e, [x + sway, y, H]);
                if (!b || !t || up <= 0) return null;
                const w = Math.max(1.5, 40 / b.d);
                if (kind === 2)
                  return (
                    <g key={i}>
                      {[-1, 0, 1].map((s) => {
                        const tt = proj(e, [x + s * 0.12 + sway, y, H]);
                        return tt ? <path key={s} d={`M ${b.x} ${b.y} Q ${b.x + s * 8} ${(b.y + tt.y) / 2} ${tt.x} ${tt.y}`} fill="none" stroke="#c46a8a" strokeWidth={w * 0.8} strokeLinecap="round" /> : null;
                      })}
                    </g>
                  );
                return (
                  <g key={i}>
                    <line x1={b.x} y1={b.y} x2={t.x} y2={t.y} stroke={kind === 0 ? "#7fbf8a" : "#4f7a5a"} strokeWidth={w * (kind === 1 ? 1.6 : 0.9)} strokeLinecap="round" />
                    {kind === 0 ? (
                      <g>
                        <circle cx={t.x} cy={t.y} r={Math.max(2, 70 / t.d)} fill="rgba(183,255,216,0.25)" />
                        <circle cx={t.x} cy={t.y} r={Math.max(1.5, 34 / t.d)} fill="#d8ffe8" opacity={0.75 + 0.25 * Math.sin(f / 7 + i)} />
                      </g>
                    ) : (
                      <g>
                        <ellipse cx={t.x} cy={t.y} rx={Math.max(3, 150 / t.d)} ry={Math.max(2, 70 / t.d)} fill="#3f6e4a" />
                        <ellipse cx={t.x - 30 / t.d} cy={t.y - 20 / t.d} rx={Math.max(2, 80 / t.d)} ry={Math.max(1, 30 / t.d)} fill="#5f9a62" />
                        <circle cx={t.x} cy={t.y + 30 / t.d} r={Math.max(1, 14 / t.d)} fill="#d8ffb0" opacity={0.8} />
                      </g>
                    )}
                  </g>
                );
              });
              return (
                <g>
                  <defs>
                    <linearGradient id="xenMoss" x1="0" y1={far ? far.y : 0} x2="0" y2={near ? near.y : 1080} gradientUnits="userSpaceOnUse">
                      <stop offset="0" stopColor="#4c6038" />
                      <stop offset="1" stopColor="#222c1a" />
                    </linearGradient>
                  </defs>
                  <polygon points={edgeL.concat(edgeR.reverse()).join(" ")} fill="url(#xenMoss)" stroke="#2c3a20" strokeWidth={3} />
                  {veins}
                  {spots}
                  {plants}
                </g>
              );
            })()
          : null}
        {/* etiquetas */}
        {f >= creatAt && f < goneAt && c1 && c2 ? (
          <text x={c1.x + 20} y={c2.y + 30} fill={GREEN} fontFamily={MONO} fontSize={18} letterSpacing={3}>
            FORMAS DE VIDA · XEN
          </text>
        ) : null}
      </svg>
      <Hud f={f} yaw={e.yaw} eye={e} blips={f >= creatAt && f < goneAt ? [{ x: 0, y: 31 }, { x: 0.6, y: 33 }] : []} msg={f >= goneAt ? "SINAL PERDIDO" : f >= xenAt ? "XEN" : f >= doorAt ? "PASSAGEM · FASE DESCONHECIDA" : f >= strangeAt ? "MUDANÇAS MAIS ESTRANHAS" : undefined} msgCol={f >= xenAt && f < goneAt ? GREEN : ICE} o={P(f, 4, 10)} />
      {f >= nobodyAt ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 380, display: "flex", justifyContent: "center", gap: 30 }}>
          {[
            ["MOSSMAN", ICE, mossAt],
            ["ALYX", ORANGE, alyxAt],
          ].map(([n, c, at]) => (
            <div key={n as string} style={{ padding: "12px 26px", borderRadius: 12, background: "rgba(6,8,10,0.8)", border: `2px solid ${c}`, fontFamily: MONO, fontSize: 26, letterSpacing: 5, color: c as string, opacity: P(f, at as number, 8) }}>
              {n} ?
            </div>
          ))}
        </div>
      ) : null}
      {f >= knowAt - 20 ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 480, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 60, color: TXT, opacity: P(f, knowAt - 20, 10) }}>só sabem que está acontecendo</div>
      ) : null}
      <AbsoluteFill style={{ background: "#000", opacity: fade(f, life), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- o rádio do Kleiner
type RDP = { life: number; logicAt?: number; alignAt?: number; talkAt?: number; desyncAt?: number; delayAt?: number; repeatAt?: number; orderAt?: number; goneAt?: number };
const KW = ["Gordon,", "se", "puder", "me", "ouvir,", "sigam", "para", "o", "setor", "sete.", "Repito:", "setor", "sete."];
export const HLRRadio: React.FC<RDP> = (p) => {
  const f = useCurrentFrame();
  const a = (v?: number) => v ?? 1e9;
  const [logicAt, alignAt, talkAt, desyncAt, delayAt, repeatAt, orderAt, goneAt] = [p.logicAt, p.alignAt, p.talkAt, p.desyncAt, p.delayAt, p.repeatAt, p.orderAt, p.goneAt].map(a);
  const life = p.life;
  const out = P(f, desyncAt, 20); // 0 = alinhado, 1 = fora
  const needle = -60 + 60 * P(f, alignAt, 14) + (f >= desyncAt ? Math.sin(f / 4) * 40 * out + 30 * out : 0);
  const gone = P(f, goneAt, 20);
  // palavras: alinhado → em ordem; atrasar → cada uma chega mais tarde; repetir → duplicadas; fora de ordem → embaralha
  const words = useMemo(() => {
    const list = KW.map((w, i) => ({ w, i, at: 0 }));
    return list;
  }, []);
  const chips: { w: string; x: number; y: number; o: number; c: string }[] = [];
  words.forEach((wd, i) => {
    let at = talkAt + i * 5;
    if (f >= delayAt && i >= 3) at += (i - 2) * 6 * P(f, delayAt, 20);
    let slot = i;
    if (f >= orderAt) slot = [4, 0, 9, 2, 6, 1, 11, 3, 12, 5, 8, 7, 10][i];
    const t = P(f, at, 6);
    if (t <= 0) return;
    const sx = slot % 7;
    const sy = Math.floor(slot / 7);
    const shuffleT = P(f, orderAt, 18);
    const bx = 240 + (i % 7) * 210;
    const by = 640 + Math.floor(i / 7) * 90;
    chips.push({ w: wd.w, x: bx + (240 + sx * 210 - bx) * shuffleT, y: by + (640 + sy * 90 - by) * shuffleT, o: t * (1 - gone), c: f >= desyncAt ? CREAM : GREEN });
    if (f >= repeatAt && (i === 5 || i === 8)) chips.push({ w: wd.w, x: bx + 60, y: by - 46, o: P(f, repeatAt + i, 6) * 0.6 * (1 - gone), c: RED });
  });
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, #121614 0%, #040605 78%)", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 80, top: 70, fontFamily: MONO, letterSpacing: 6 }}>
        <div style={{ fontSize: 22, color: GREEN }}>RÁDIO · KLEINER</div>
        <div style={{ fontSize: 15, color: "rgba(242,240,247,0.6)", marginTop: 6, opacity: P(f, logicAt - 10, 10) }}>ATÉ O RÁDIO OBEDECE A FASE DO NAVIO</div>
      </div>
      {/* medidor de sincronia */}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <g transform="translate(1560 300)">
          <path d="M -150 0 A 150 150 0 0 1 150 0" fill="none" stroke="rgba(242,240,247,0.25)" strokeWidth={14} />
          <path d="M -40 -145 A 150 150 0 0 1 40 -145" fill="none" stroke={GREEN} strokeWidth={14} />
          <line x1={0} y1={0} x2={Math.sin((needle * Math.PI) / 180) * 140} y2={-Math.cos((needle * Math.PI) / 180) * 140} stroke={f >= desyncAt ? RED : GREEN} strokeWidth={5} strokeLinecap="round" />
          <circle r={10} fill={TXT} />
          <text y={44} textAnchor="middle" fill={f >= desyncAt ? RED : GREEN} fontFamily={MONO} fontSize={18} letterSpacing={4}>
            {gone > 0.5 ? "SEM SINAL" : f >= desyncAt ? "FORA DE SINCRONIA" : f >= alignAt ? "ALINHADO COM O PRESENTE" : "SINCRONIA"}
          </text>
        </g>
        {/* forma de onda da voz */}
        <polyline
          points={Array.from({ length: 220 })
            .map((_, i) => {
              const x = 160 + i * 5.6;
              const talking = f >= talkAt ? 1 : 0.15;
              const echo = f >= delayAt ? Math.sin((i - 30) * 0.5 + f * 0.6) * 18 * out : 0;
              const v = (Math.sin(i * 0.9 + f * 0.8) * 30 + Math.sin(i * 0.31 + f * 0.37) * 22) * talking * (0.4 + 0.6 * Math.abs(Math.sin(i / 17 + f / 9))) * (1 - gone) + echo * (1 - gone);
              return `${x},${(450 + v).toFixed(1)}`;
            })
            .join(" ")}
          fill="none"
          stroke={f >= desyncAt ? CREAM : GREEN}
          strokeWidth={2.5}
        />
      </svg>
      {/* as palavras */}
      {chips.map((c, k) => (
        <div key={k} style={{ position: "absolute", left: c.x, top: c.y, padding: "8px 16px", borderRadius: 8, background: "rgba(6,10,8,0.85)", border: `1px solid ${c.c}`, fontFamily: FONT, fontWeight: 800, fontSize: 34, color: c.c, opacity: c.o, whiteSpace: "nowrap" }}>
          {c.w}
        </div>
      ))}
      <div style={{ position: "absolute", left: 240, top: 580, fontFamily: MONO, fontSize: 16, letterSpacing: 5, color: f >= desyncAt ? RED : GREEN, opacity: P(f, talkAt - 6, 8) }}>
        {gone > 0.5 ? "DESAPARECE" : f >= orderAt ? "FORA DE ORDEM" : f >= repeatAt ? "REPETE FRASES" : f >= delayAt ? "ATRASA" : "FALA NORMALMENTE"}
      </div>
      <AbsoluteFill style={{ background: "#000", opacity: fade(f, life), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- a Alyx guia: o navio em corte e o reconhecimento
type GP = { life: number; guideAt?: number; notAt?: number; stopAt?: number; chooseAt?: number; forgetAt?: number; clearAt?: number; recogAt?: number; closerAt?: number; aptAt?: number; strongAt?: number };
export const HLRAlyxGuide: React.FC<GP> = (p) => {
  const f = useCurrentFrame();
  const a = (v?: number) => v ?? 1e9;
  const [guideAt, notAt, stopAt, chooseAt, forgetAt, clearAt, recogAt, closerAt, aptAt, strongAt] = [p.guideAt, p.notAt, p.stopAt, p.chooseAt, p.forgetAt, p.clearAt, p.recogAt, p.closerAt, p.aptAt, p.strongAt].map(a);
  const life = p.life;
  const S = 1.7;
  const X0 = 960 - 500 * S;
  const Y0 = 470 - 150 * S;
  // caminho pelo convés (coordenadas locais do perfil 1000 × 300)
  const PATH: [number, number][] = [[120, 190], [220, 190], [300, 200], [420, 196], [520, 200], [600, 196], [700, 200], [800, 196], [860, 200]];
  const prog = interpolate(f, [guideAt - 20, stopAt, stopAt + 25, life - 10], [0, 0.3, 0.3, 1], C);
  const along = (t: number) => {
    const L = PATH.length - 1;
    const x = t * L;
    const i = Math.min(L - 1, Math.floor(x));
    const k = x - i;
    return [PATH[i][0] + (PATH[i + 1][0] - PATH[i][0]) * k, PATH[i][1] + (PATH[i + 1][1] - PATH[i][1]) * k];
  };
  const [gx, gy] = along(prog);
  const APX0 = 600;
  const near = Math.max(0, Math.min(1, (gx - 380) / (APX0 - 380)));
  const amp = (f >= recogAt ? 0.25 + 0.75 * near : 0.12 + 0.1 * near) * (f >= strongAt ? 1.25 : 1);
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, #0b1218 0%, #030507 78%)", overflow: "hidden" }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <g transform={`translate(${X0} ${Y0}) scale(${S})`}>
          <ShipProfile stroke="rgba(159,230,255,0.55)" fill="rgba(159,230,255,0.04)" w={1.4} />
          {/* conveses */}
          {[160, 200, 240].map((y) => (
            <line key={y} x1={60} x2={930} y1={y} y2={y} stroke="rgba(159,230,255,0.18)" strokeWidth={1} />
          ))}
          {/* partes antigas da Aperture */}
          <rect x={APX0} y={150} width={300} height={110} fill={`rgba(243,154,28,${0.08 + 0.12 * (f >= aptAt ? 0.5 + 0.5 * Math.sin(f / 6) : 0)})`} stroke={APT} strokeWidth={1.2} strokeDasharray="6 4" opacity={P(f, closerAt - 20, 14)} />
          <text x={APX0 + 150} y={145} textAnchor="middle" fill={APT} fontFamily={MONO} fontSize={11} letterSpacing={2} opacity={P(f, closerAt - 20, 14)}>
            APERTURE · PARTES ANTIGAS
          </text>
          {/* o caminho */}
          <polyline points={PATH.filter((q) => q[0] <= gx).concat([[gx, gy]]).map((q) => q.join(",")).join(" ")} fill="none" stroke={ORANGE} strokeWidth={2} strokeDasharray="4 4" />
          {/* paradas e escolhas */}
          {f >= stopAt ? (
            <g opacity={P(f, stopAt, 8)}>
              <circle cx={along(0.3)[0]} cy={along(0.3)[1]} r={9} fill="none" stroke={CREAM} strokeWidth={1.5} />
              <text x={along(0.3)[0]} y={along(0.3)[1] - 14} textAnchor="middle" fill={CREAM} fontFamily={MONO} fontSize={10} letterSpacing={2}>
                PAROU
              </text>
            </g>
          ) : null}
          {f >= chooseAt ? (
            <g opacity={P(f, chooseAt, 8)}>
              <path d={`M ${along(0.42)[0]} ${along(0.42)[1]} l 30 -36`} stroke={ORANGE} strokeWidth={1.5} />
              <text x={along(0.42)[0] + 34} y={along(0.42)[1] - 40} fill={ORANGE} fontFamily={MONO} fontSize={10} letterSpacing={2}>
                {f >= forgetAt ? "POR QUE ESSE?" : "ESCOLHEU"}
              </text>
            </g>
          ) : null}
          {/* a Alyx */}
          <g transform={`translate(${gx} ${gy})`}>
            <circle r={7} fill={ORANGE} />
            <circle r={12 + amp * 30 * (0.5 + 0.5 * Math.sin(f / 4))} fill="none" stroke={ORANGE} strokeWidth={1.2} opacity={0.6} />
            <circle cx={-14} cy={4} r={4} fill={AMB} />
            <circle cx={-22} cy={6} r={4} fill={ICE} />
          </g>
        </g>
        {/* medidor de reconhecimento */}
        <g transform="translate(160 860)" opacity={P(f, clearAt - 10, 14)}>
          <text x={0} y={-60} fill={ORANGE} fontFamily={MONO} fontSize={16} letterSpacing={5}>
            ALGO NELA RECONHECE O NAVIO
          </text>
          <line x1={0} x2={1600} y1={0} y2={0} stroke="rgba(242,240,247,0.2)" />
          <polyline
            points={Array.from({ length: 320 })
              .map((_, i) => {
                const x = i * 5;
                const v = Math.sin(i * 0.35 - f * 0.3) * 60 * amp * (0.5 + 0.5 * Math.sin(i * 0.05 + f * 0.05));
                return `${x},${v.toFixed(1)}`;
              })
              .join(" ")}
            fill="none"
            stroke={ORANGE}
            strokeWidth={2.5}
          />
        </g>
      </svg>
      <div style={{ position: "absolute", left: 80, top: 70, fontFamily: MONO, letterSpacing: 6 }}>
        <div style={{ fontSize: 20, color: ICE }}>A ALYX GUIA O GRUPO</div>
        <div style={{ fontSize: 15, color: "rgba(242,240,247,0.6)", marginTop: 6, opacity: P(f, notAt, 10) }}>NÃO PERFEITAMENTE</div>
      </div>
      {f >= strongAt ? (
        <div style={{ position: "absolute", right: 90, top: 70, textAlign: "right", opacity: P(f, strongAt - 10, 10) }}>
          <div style={{ fontFamily: MONO, fontSize: 16, letterSpacing: 6, color: APT }}>PERTO DA APERTURE</div>
          <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 72, color: TXT, lineHeight: 1 }}>mais forte</div>
        </div>
      ) : null}
      <AbsoluteFill style={{ background: "#000", opacity: fade(f, life), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};
