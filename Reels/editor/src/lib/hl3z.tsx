import React from "react";
import { AbsoluteFill, Easing, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { MONO } from "./overlays";
import { C, Clip, rnd } from "./hl3";
import { Corners, Ecg } from "./hl3t";
import { loadFont as loadCaveatZ } from "@remotion/google-fonts/Caveat";
const { fontFamily: HANDZ } = loadCaveatZ();

// 5A/5B · A ESTAÇÃO DA MOSSMAN, OS FLICKERS, O BOREALIS. Linguagem de interface do HEV (planta em wireframe 3D, câmeras
// de segurança, varredura), nada de personagem desenhado; as criaturas são anomalias (distorção que pisca). Tempos em QUADROS.
const AMB = "#ffb22e";
const CREAM = "#ffe2b0";
const RED = "#ff5d4d";
const ICE = "#9fe6ff";
const GREEN = "#8dffa8";
const P = (f: number, at: number, d = 12) => interpolate(f, [at, at + d], [0, 1], { ...C, easing: Easing.out(Easing.cubic) });
const IO = (f: number, a: number, b: number, d = 10) => Math.min(P(f, a, d), 1 - P(f, b, d));
const flickIn = (f: number, at: number) => {
  const t = f - at;
  if (t < 0) return 0;
  if (t > 6) return 1;
  return [0.6, 0, 1, 0.3, 1, 0.7, 1][t];
};

// ---------------------------------------------------------------------------------------------------- câmera 3D simples
type Cam = { fx: number; fy: number; yaw: number; pitch: number; dist: number; cx?: number; cy?: number; F?: number };
const proj = (c: Cam, x: number, y: number, z: number) => {
  const dx = x - c.fx;
  const dy = y - c.fy;
  const cy_ = Math.cos(c.yaw);
  const sy_ = Math.sin(c.yaw);
  const rx = dx * cy_ - dy * sy_;
  const ry = dx * sy_ + dy * cy_;
  const cp = Math.cos(c.pitch);
  const sp = Math.sin(c.pitch);
  const scrY = -ry * sp - z * cp;
  const depth = c.dist + ry * cp - z * sp;
  const k = (c.F ?? 1100) / Math.max(1, depth);
  return [(c.cx ?? 960) + rx * k, (c.cy ?? 560) + scrY * k, depth] as const;
};
const pts = (c: Cam, ps: [number, number, number][]) => ps.map((p) => proj(c, p[0], p[1], p[2])).map((q) => `${q[0].toFixed(1)},${q[1].toFixed(1)}`).join(" ");

// a anomalia (Flicker): distorção que pisca, com separação de cor; nada de corpo desenhado
const Flick: React.FC<{ f: number; x: number; y: number; s: number; o?: number; seed?: number; hot?: boolean }> = ({ f, x, y, s, o = 1, seed = 0, hot = false }) => {
  if (o <= 0.01) return null;
  const blink = rnd(Math.floor(f / 2) * 7.1 + seed) > 0.12 ? 1 : 0.2;
  const j = (rnd(f * 3.3 + seed) - 0.5) * 6 * s;
  // um rasgo vertical no ar (lente estreita), cortado por faixas de glitch que escorregam para os lados
  const H = 120 * s;
  const Wd = 26 * s;
  const shape = (dx: number, col: string, op: number) => (
    <g transform={`translate(${x + dx + j} ${y})`} opacity={op}>
      <path d={`M 0 ${-H / 2 - 20 * s} Q ${Wd} ${-H / 6} ${Wd * 0.4} ${H / 2} Q 0 ${H / 2 + 14 * s} ${-Wd * 0.4} ${H / 2} Q ${-Wd} ${-H / 6} 0 ${-H / 2 - 20 * s} Z`} fill={col} />
      {Array.from({ length: 6 }).map((_, k) => {
        const yy = -H / 2 + (k + 0.5) * (H / 6) + (rnd(k + Math.floor(f / 3) + seed) - 0.5) * 10 * s;
        const off = (rnd(k * 3.7 + Math.floor(f / 2) + seed) - 0.5) * 50 * s;
        return <rect key={k} x={-Wd * 0.9 + off} y={yy} width={Wd * 1.8} height={4 * s + rnd(k + f) * 5 * s} fill={col} />;
      })}
    </g>
  );
  return (
    <g opacity={o * blink} filter="url(#flickWarp)">
      {shape(-4 * s, "rgba(255,40,80,0.55)", 1)}
      {shape(4 * s, "rgba(40,220,255,0.55)", 1)}
      {shape(0, hot ? "rgba(255,240,220,0.85)" : "rgba(200,230,240,0.6)", 1)}
    </g>
  );
};
const FlickDefs: React.FC<{ f: number }> = ({ f }) => (
  <defs>
    <filter id="flickWarp" x="-50%" y="-50%" width="200%" height="200%">
      <feTurbulence type="fractalNoise" baseFrequency="0.06 0.25" numOctaves={2} seed={Math.floor(f / 2) % 40} result="n" />
      <feDisplacementMap in="SourceGraphic" in2="n" scale={18} />
      <feGaussianBlur stdDeviation={0.6} />
    </filter>
  </defs>
);

// colchete de alvo do HEV
const Bracket: React.FC<{ x: number; y: number; w: number; h: number; col: string; o?: number; label?: string; sub?: string }> = ({ x, y, w, h, col, o = 1, label, sub }) => {
  const k = 16;
  return (
    <g opacity={o}>
      {[
        [x - w / 2, y - h / 2, 1, 1],
        [x + w / 2, y - h / 2, -1, 1],
        [x - w / 2, y + h / 2, 1, -1],
        [x + w / 2, y + h / 2, -1, -1],
      ].map(([px, py, sx, sy], i) => (
        <path key={i} d={`M ${px} ${py + sy * k} L ${px} ${py} L ${px + sx * k} ${py}`} fill="none" stroke={col} strokeWidth={2.5} />
      ))}
      {label ? (
        <text x={x - w / 2} y={y - h / 2 - 12} fill={col} fontFamily={MONO} fontSize={16} letterSpacing={3}>
          {label}
        </text>
      ) : null}
      {sub ? (
        <text x={x - w / 2} y={y + h / 2 + 22} fill={col} fontFamily={MONO} fontSize={14} letterSpacing={2} opacity={0.8}>
          {sub}
        </text>
      ) : null}
    </g>
  );
};

// ============================================================================================ 1) a estação destruída
// planta da estação em wireframe 3D, câmera girando devagar. Ela se desenha; o dano aparece; marcas Combine,
// equipamentos largados e corpos pelos corredores; a hipótese óbvia. Depois o Gordon entra fundo e a hipótese racha:
// salas trancadas por dentro com mortos, disparos numa parede sem ninguém, e as câmeras de segurança: cada grupo atira
// num lugar diferente contra o MESMO alvo.
type Room = { x: number; y: number; w: number; h: number; n: string; ruin?: boolean };
const ROOMS: Room[] = [
  { x: -30, y: -20, w: 16, h: 12, n: "LABORATÓRIO", ruin: true },
  { x: -12, y: -20, w: 12, h: 12, n: "RÁDIO" },
  { x: 2, y: -20, w: 12, h: 12, n: "DEPÓSITO", ruin: true },
  { x: 16, y: -20, w: 12, h: 12, n: "ALOJAMENTO" },
  { x: -30, y: -6, w: 58, h: 6, n: "CORREDOR A" },
  { x: -30, y: 2, w: 14, h: 14, n: "GERADOR" },
  { x: -14, y: 2, w: 10, h: 10, n: "SALA 4" },
  { x: -2, y: 2, w: 10, h: 10, n: "SALA 5" },
  { x: 10, y: 2, w: 18, h: 16, n: "HANGAR", ruin: true },
];
const HW = 3;
export const HLStationScan: React.FC<{ life: number; ruinAt?: number; markAt?: number; gearAt?: number; bodyAt?: number; hypAt?: number; deepAt?: number; lockAt?: number; shotsAt?: number; camAt?: number; sameAt?: number }> = ({
  life,
  ruinAt = 1e9,
  markAt = 1e9,
  gearAt = 1e9,
  bodyAt = 1e9,
  hypAt = 1e9,
  deepAt = 1e9,
  lockAt = 1e9,
  shotsAt = 1e9,
  camAt = 1e9,
  sameAt = 1e9,
}) => {
  const f = useCurrentFrame();
  void life;
  // câmera: visão geral → sala trancada → parede dos disparos
  const toLock = P(f, lockAt - 6, 30);
  const toShot = P(f, shotsAt - 6, 30);
  const fx = interpolate(toLock, [0, 1], [0, -4]) * (1 - toShot) + toShot * 14;
  const fy = interpolate(toLock, [0, 1], [-2, 6]) * (1 - toShot) + toShot * -3;
  const cam: Cam = { fx, fy, yaw: -0.42 + f * 0.0016, pitch: 0.95 - 0.12 * Math.max(toLock, toShot), dist: 78 - 34 * Math.max(toLock, toShot), cy: 600 };
  const draw = (i: number) => P(f, 4 + i * 5, 22);
  const cctv = P(f, camAt, 12);
  const box = (r: Room, i: number) => {
    const d = draw(i);
    if (d <= 0) return null;
    const { x, y, w, h } = r;
    const fl: [number, number, number][] = [[x, y, 0], [x + w, y, 0], [x + w, y + h, 0], [x, y + h, 0], [x, y, 0]];
    const tp: [number, number, number][] = fl.map((p) => [p[0], p[1], HW * d]);
    const ruin = r.ruin && f >= ruinAt;
    const col = ruin ? "rgba(255,93,77,0.8)" : "rgba(159,230,255,0.75)";
    return (
      <g key={i}>
        <polygon points={pts(cam, fl.slice(0, 4))} fill={ruin ? "rgba(255,93,77,0.06)" : "rgba(159,230,255,0.04)"} />
        <polyline points={pts(cam, fl)} fill="none" stroke={col} strokeWidth={1.6} opacity={d} />
        <polyline points={pts(cam, tp)} fill="none" stroke={col} strokeWidth={1.2} opacity={0.6 * d} strokeDasharray={ruin ? "10 7 3 9" : undefined} />
        {fl.slice(0, 4).map((p, k) => (
          <polyline key={k} points={pts(cam, [p, [p[0], p[1], HW * d]])} stroke={col} strokeWidth={1} opacity={0.5 * d} />
        ))}
        {(() => {
          const c = proj(cam, x + w / 2, y + h / 2, 0);
          return (
            <text x={c[0]} y={c[1]} textAnchor="middle" fill={col} fontFamily={MONO} fontSize={13} letterSpacing={3} opacity={0.75 * d * (1 - cctv)}>
              {r.n}
            </text>
          );
        })()}
      </g>
    );
  };
  // marcas
  const marks: [number, number][] = [[-24, -15], [-6, -12], [8, -15], [-20, -3], [6, -3], [18, 8], [24, 12], [-26, 8]];
  const gear: [number, number][] = [[-27, -17], [10, -17], [20, 14], [-22, 12], [14, 6]];
  const bodies: [number, number][] = [[-16, -3], [-4, -4], [2, -2], [12, -4], [20, -3]];
  const lockedKia: [number, number][] = [[-11, 6], [-7, 8], [3, 5]];
  const gx = interpolate(f, [deepAt, deepAt + 70], [-33, 4], { ...C, easing: Easing.inOut(Easing.quad) });
  const gpos = proj(cam, f >= deepAt ? gx : -33, -3, 0);
  const hyp = P(f, hypAt, 10);
  const crack = f >= deepAt + 30;
  // impactos na parede norte do corredor (y = -6, plano vertical)
  const hits: [number, number][] = [[10, 1.2], [11.5, 2.1], [12.2, 1.6], [13.8, 2.4], [15, 1.1], [16.3, 1.9], [17.2, 2.6]];
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 55%, #08131a 0%, #020507 75%)", overflow: "hidden" }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: 1 - 0.75 * cctv }}>
        {/* grade do chão */}
        {Array.from({ length: 17 }).map((_, i) => (
          <polyline key={"g" + i} points={pts(cam, [[-40 + i * 5, -30, 0], [-40 + i * 5, 26, 0]])} stroke="rgba(159,230,255,0.06)" />
        ))}
        {Array.from({ length: 12 }).map((_, i) => (
          <polyline key={"h" + i} points={pts(cam, [[-40, -30 + i * 5, 0], [40, -30 + i * 5, 0]])} stroke="rgba(159,230,255,0.06)" />
        ))}
        {ROOMS.map(box)}
        {/* marcas Combine */}
        {marks.map(([x, y], i) => {
          const a = P(f, markAt + i * 3, 8);
          if (a <= 0) return null;
          const p = proj(cam, x, y, 0.2);
          return (
            <g key={"m" + i} transform={`translate(${p[0]} ${p[1]}) scale(${0.6 + 0.4 * a})`} opacity={a}>
              <path d="M -12 -6 L 0 6 L 12 -6 M -12 -14 L 0 -2 L 12 -14" fill="none" stroke={RED} strokeWidth={3} />
            </g>
          );
        })}
        {gear.map(([x, y], i) => {
          const a = P(f, gearAt + i * 3, 8);
          if (a <= 0) return null;
          const p = proj(cam, x, y, 0.3);
          return <rect key={"e" + i} x={p[0] - 8} y={p[1] - 8} width={16} height={16} fill="none" stroke={AMB} strokeWidth={2} opacity={a} transform={`rotate(${20 * i} ${p[0]} ${p[1]})`} />;
        })}
        {bodies.map(([x, y], i) => {
          const a = P(f, bodyAt + i * 3, 8);
          if (a <= 0) return null;
          const p = proj(cam, x, y, 0.1);
          return (
            <g key={"b" + i} opacity={a}>
              <path d={`M ${p[0] - 7} ${p[1] - 7} L ${p[0] + 7} ${p[1] + 7} M ${p[0] + 7} ${p[1] - 7} L ${p[0] - 7} ${p[1] + 7}`} stroke={ICE} strokeWidth={2.5} />
              {i === 2 ? (
                <text x={p[0] + 12} y={p[1] - 10} fill={ICE} fontFamily={MONO} fontSize={13} letterSpacing={2}>
                  KIA · OVERWATCH
                </text>
              ) : null}
            </g>
          );
        })}
        {/* salas trancadas: cadeado nas portas e os mortos lá dentro */}
        {f >= lockAt
          ? [
              [-9, 2],
              [3, 2],
            ].map(([x, y], i) => {
              const p = proj(cam, x, y, 1.4);
              const a = P(f, lockAt + 10 + i * 6, 8);
              return (
                <g key={"l" + i} opacity={a} transform={`translate(${p[0]} ${p[1]})`}>
                  <rect x={-11} y={-4} width={22} height={18} rx={3} fill="#05090c" stroke={AMB} strokeWidth={2.5} />
                  <path d="M -7 -4 L -7 -11 A 7 7 0 0 1 7 -11 L 7 -4" fill="none" stroke={AMB} strokeWidth={2.5} />
                </g>
              );
            })
          : null}
        {f >= lockAt
          ? lockedKia.map(([x, y], i) => {
              const p = proj(cam, x, y, 0.1);
              const a = P(f, lockAt + 22 + i * 4, 8);
              return <path key={"k" + i} opacity={a} d={`M ${p[0] - 9} ${p[1] - 9} L ${p[0] + 9} ${p[1] + 9} M ${p[0] + 9} ${p[1] - 9} L ${p[0] - 9} ${p[1] + 9}`} stroke={RED} strokeWidth={3} />;
            })
          : null}
        {/* disparos numa parede sem ninguém */}
        {f >= shotsAt
          ? hits.map(([x, z], i) => {
              const a = P(f, shotsAt + 14 + i * 3, 6);
              const p = proj(cam, x, -6, z);
              const o = proj(cam, 13.5, -2.5, 1.5);
              return (
                <g key={"s" + i} opacity={a}>
                  <line x1={o[0]} y1={o[1]} x2={p[0]} y2={p[1]} stroke={RED} strokeWidth={1} strokeDasharray="4 6" opacity={0.6} />
                  <circle cx={p[0]} cy={p[1]} r={5} fill="none" stroke={RED} strokeWidth={2} />
                  <circle cx={p[0]} cy={p[1]} r={1.5} fill={RED} />
                </g>
              );
            })
          : null}
        {f >= shotsAt + 30
          ? (() => {
              const o = proj(cam, 13.5, -2.5, 1.5);
              return (
                <g opacity={P(f, shotsAt + 30, 10)}>
                  <circle cx={o[0]} cy={o[1]} r={22 + 3 * Math.sin(f / 4)} fill="none" stroke={CREAM} strokeWidth={2} strokeDasharray="5 5" />
                  <text x={o[0]} y={o[1] + 7} textAnchor="middle" fill={CREAM} fontFamily={MONO} fontSize={20}>
                    ?
                  </text>
                  <text x={o[0] + 34} y={o[1] + 6} fill={CREAM} fontFamily={MONO} fontSize={16} letterSpacing={3}>
                    ORIGEM · NINGUÉM
                  </text>
                </g>
              );
            })()
          : null}
        {/* o Gordon (marcador do HEV) */}
        <g transform={`translate(${gpos[0]} ${gpos[1]})`} opacity={P(f, 20, 12)}>
          <path d="M 0 -12 L 10 8 L -10 8 Z" fill={AMB} />
          <circle r={20 + 3 * Math.sin(f / 5)} fill="none" stroke={AMB} strokeWidth={1.5} opacity={0.5} />
          <text x={16} y={-14} fill={AMB} fontFamily={MONO} fontSize={14} letterSpacing={3}>
            GORDON
          </text>
        </g>
      </svg>
      {/* cabeçalho */}
      <div style={{ position: "absolute", left: 70, top: 56, fontFamily: MONO, color: ICE, letterSpacing: 6, opacity: 1 - cctv }}>
        <div style={{ fontSize: 22 }}>H.E.V. · VARREDURA · ESTAÇÃO DE PESQUISA</div>
        <div style={{ fontSize: 16, opacity: 0.7, marginTop: 6 }}>ÚLTIMO POSTO CONHECIDO · DRA. MOSSMAN</div>
      </div>
      {/* a hipótese, depois rachada */}
      {f >= hypAt && f < camAt + 10 ? (
        <div style={{ position: "absolute", right: 70, top: 160, width: 470, padding: "16px 20px", background: "rgba(3,8,12,0.86)", border: `1px solid ${crack ? RED : AMB}`, borderRadius: 8, fontFamily: MONO, opacity: hyp * (1 - cctv) }}>
          <div style={{ fontSize: 14, letterSpacing: 5, color: crack ? RED : AMB }}>HIPÓTESE</div>
          <div style={{ fontSize: 26, letterSpacing: 2, color: CREAM, marginTop: 6, lineHeight: 1.25, textDecoration: crack ? "line-through" : undefined, textDecorationColor: RED }}>OS COMBINE CHEGARAM DEPOIS DA TRANSMISSÃO E TOMARAM A ESTAÇÃO</div>
          <div style={{ fontSize: 18, letterSpacing: 4, color: crack ? RED : GREEN, marginTop: 10 }}>{crack ? "INCONSISTENTE" : "PROVÁVEL ✓"}</div>
        </div>
      ) : null}
      {f >= lockAt && f < shotsAt ? (
        <div style={{ position: "absolute", left: 70, bottom: 90, fontFamily: MONO, opacity: P(f, lockAt + 22, 10) }}>
          <div style={{ fontSize: 16, letterSpacing: 5, color: AMB }}>SALAS 4 E 5 · TRANCADAS POR DENTRO</div>
          <div style={{ fontSize: 30, letterSpacing: 3, color: CREAM }}>3 SOLDADOS MORTOS LÁ DENTRO</div>
        </div>
      ) : null}
      {f >= shotsAt + 14 && f < camAt ? (
        <div style={{ position: "absolute", left: 70, bottom: 90, fontFamily: MONO, opacity: P(f, shotsAt + 14, 10) }}>
          <div style={{ fontSize: 16, letterSpacing: 5, color: RED }}>CORREDOR A · PAREDE NORTE</div>
          <div style={{ fontSize: 30, letterSpacing: 3, color: CREAM }}>7 IMPACTOS · NENHUM ALVO</div>
        </div>
      ) : null}
      {/* câmeras de segurança: cada grupo atira num lugar, contra o mesmo alvo */}
      {cctv > 0 ? (
        <AbsoluteFill style={{ opacity: cctv, padding: "150px 120px 90px", display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: 22, boxSizing: "border-box" }}>
          {[0, 1, 2, 3].map((k) => {
            const tgt: [number, number] = [[330, 110], [90, 220], [480, 250], [250, 60]][k] as [number, number];
            const sold: [number, number][] = [[120 + k * 20, 260], [180, 300 - k * 10], [90, 150 + k * 12]];
            const fire = f >= camAt + 40 + k * 4;
            return (
              <div key={k} style={{ position: "relative", border: "1px solid rgba(159,230,255,0.35)", background: "#05090b", overflow: "hidden" }}>
                <svg width="100%" height="100%" viewBox="0 0 640 340" preserveAspectRatio="none" style={{ position: "absolute", inset: 0 }}>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <line key={i} x1={0} x2={640} y1={i * 45} y2={i * 45} stroke="rgba(159,230,255,0.06)" />
                  ))}
                  <rect x={40} y={30} width={560} height={280} fill="none" stroke="rgba(159,230,255,0.35)" strokeWidth={2} />
                  {sold.map(([sx, sy], i) => (
                    <g key={i}>
                      {fire && Math.floor((f + i * 3 + k) / 3) % 2 ? <line x1={sx} y1={sy} x2={tgt[0] + (rnd(f + i) - 0.5) * 30} y2={tgt[1] + (rnd(f + i + 9) - 0.5) * 30} stroke="#ffd27a" strokeWidth={2} /> : null}
                      <circle cx={sx} cy={sy} r={8} fill={RED} />
                    </g>
                  ))}
                  <circle cx={tgt[0]} cy={tgt[1]} r={18 + 3 * Math.sin(f / 4)} fill="none" stroke={CREAM} strokeWidth={2} strokeDasharray="5 4" />
                  <text x={tgt[0] + 26} y={tgt[1] + 6} fill={f >= sameAt ? RED : CREAM} fontFamily={MONO} fontSize={22} letterSpacing={2}>
                    {f >= sameAt ? "ALVO 01" : "ALVO"}
                  </text>
                </svg>
                <div style={{ position: "absolute", left: 10, top: 8, fontFamily: MONO, fontSize: 14, letterSpacing: 3, color: ICE, opacity: 0.8 }}>{`CAM 0${k + 1} · ${["HANGAR", "CORREDOR A", "DEPÓSITO", "GERADOR"][k]}`}</div>
                <div style={{ position: "absolute", right: 10, top: 8, fontFamily: MONO, fontSize: 14, color: RED, display: "flex", gap: 6, alignItems: "center" }}>
                  <span style={{ width: 9, height: 9, borderRadius: 5, background: RED, opacity: Math.floor(f / 12) % 2 ? 1 : 0.3 }} />
                  REC
                </div>
                {/* chiado de gravação */}
                <div style={{ position: "absolute", left: 0, right: 0, top: `${(f * 3 + k * 40) % 100}%`, height: 3, background: "rgba(200,230,240,0.12)" }} />
              </div>
            );
          })}
        </AbsoluteFill>
      ) : null}
      {cctv > 0 ? (
        <div style={{ position: "absolute", left: 120, top: 70, fontFamily: MONO, fontSize: 22, letterSpacing: 5, color: f >= sameAt ? RED : ICE, opacity: cctv }}>
          {f >= sameAt ? "4 CÂMERAS · 4 LUGARES · O MESMO ALVO" : "GRAVAÇÕES DE SEGURANÇA · NOITE DO ATAQUE"}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ============================================================================================ 2) a primeira criatura
// visão do HEV num corredor em wireframe, a câmera andando. No fim do corredor uma anomalia aparece e some; a câmera
// vira para a sala do lado e ela está lá, e a primeira continua no fim do corredor; depois várias, com a mesma
// assinatura; corte seco para o nome: FLICKERS.
export const HLFlickerFirst: React.FC<{ life: number; appearAt?: number; goneAt?: number; againAt?: number; stillAt?: number; manyAt?: number; titleAt?: number }> = ({
  life,
  appearAt = 1e9,
  goneAt = 1e9,
  againAt = 1e9,
  stillAt = 1e9,
  manyAt = 1e9,
  titleAt = 1e9,
}) => {
  const f = useCurrentFrame();
  void life;
  const title = f >= titleAt;
  const turn = P(f, againAt - 4, 22); // a câmera vira para a direita
  const walk = f * 0.05;
  const shiftX = -520 * turn;
  // corredor: quadros em profundidade
  const frames = Array.from({ length: 12 }).map((_, i) => {
    const z = ((i * 4 - walk) % 48 + 48) % 48 + 2;
    const k = 700 / z;
    return { z, k };
  });
  const endP = { x: 960 + shiftX, y: 560 };
  const sideP = { x: 1500 + shiftX * 0.35, y: 600 };
  const f1 = (f >= appearAt && f < goneAt) || f >= stillAt ? 1 : 0;
  const f2 = f >= againAt ? 1 : 0;
  const many = P(f, manyAt, 8);
  const extra = [
    { x: 700 + shiftX * 0.5, y: 620, s: 0.9 },
    { x: 1250 + shiftX * 0.5, y: 540, s: 0.55 },
    { x: 1720 + shiftX * 0.2, y: 660, s: 1.2 },
  ];
  if (title) {
    const t = f - titleAt;
    const sp = Math.max(0, 1 - t / 10) * 30;
    return (
      <AbsoluteFill style={{ background: "#020304", alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "relative", fontFamily: MONO, fontSize: 190, letterSpacing: 40, color: CREAM }}>
          <span style={{ position: "absolute", left: -sp, top: 0, color: "rgba(255,40,80,0.7)" }}>FLICKERS</span>
          <span style={{ position: "absolute", left: sp, top: 0, color: "rgba(40,220,255,0.7)" }}>FLICKERS</span>
          <span style={{ position: "relative", opacity: rnd(Math.floor(f / 2)) > 0.1 ? 1 : 0.3 }}>FLICKERS</span>
        </div>
        <div style={{ position: "absolute", bottom: 330, fontFamily: MONO, fontSize: 22, letterSpacing: 8, color: ICE, opacity: P(f, titleAt + 10, 10) }}>CLASSIFICAÇÃO DO HEV · ENTIDADE NÃO CATALOGADA</div>
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={{ background: "#03070a", overflow: "hidden" }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <FlickDefs f={f} />
        <g transform={`translate(${shiftX} 0)`}>
          {frames.map(({ z, k }, i) => {
            const w = 3.2 * k;
            const h = 2.6 * k;
            return <rect key={i} x={960 - w / 2} y={560 - h / 2} width={w} height={h} fill="none" stroke="rgba(159,230,255,0.75)" strokeWidth={Math.min(3.5, 0.6 + k * 0.9)} opacity={Math.min(1, 10 / z)} />;
          })}
          {/* linhas de fuga */}
          {[-1, 1].map((sx) =>
            [-1, 1].map((sy) => <line key={`${sx}${sy}`} x1={960 + sx * 1300} y1={560 + sy * 1050} x2={960 + sx * 18} y2={560 + sy * 14} stroke="rgba(159,230,255,0.45)" strokeWidth={2} />),
          )}
          {/* a sala do lado (aparece quando a câmera vira) */}
          <rect x={1540} y={300} width={520} height={560} fill="none" stroke="rgba(159,230,255,0.5)" strokeWidth={2} opacity={turn} />
        </g>
        <Flick f={f} x={endP.x} y={endP.y} s={0.6} o={f1} seed={1} />
        <Flick f={f} x={sideP.x} y={sideP.y} s={1.3} o={f2} seed={2} />
        {extra.map((e, i) => (
          <Flick key={i} f={f} x={e.x} y={e.y} s={e.s} o={many * (rnd(i + Math.floor(f / 5)) > 0.2 ? 1 : 0)} seed={3 + i} />
        ))}
        {/* colchetes */}
        {f1 ? <Bracket x={endP.x} y={endP.y - 8} w={70} h={100} col={RED} label="CONTATO 01" /> : null}
        {f >= goneAt && f < stillAt ? <Bracket x={endP.x} y={endP.y - 8} w={70} h={100} col="rgba(255,93,77,0.4)" label="SINAL PERDIDO" /> : null}
        {f2 ? <Bracket x={sideP.x} y={sideP.y - 18} w={150} h={210} col={RED} label="CONTATO 02" sub={f >= stillAt ? "MESMA ASSINATURA DO 01" : undefined} o={flickIn(f, againAt)} /> : null}
        {many > 0
          ? extra.map((e, i) => <Bracket key={i} x={e.x} y={e.y - 12} w={120 * e.s} h={170 * e.s} col={RED} label={`0${3 + i}`} o={flickIn(f, manyAt + i * 3)} />)
          : null}
      </svg>
      <div style={{ position: "absolute", left: 70, top: 56, fontFamily: MONO, color: ICE, letterSpacing: 6 }}>
        <div style={{ fontSize: 22 }}>H.E.V. · RASTREAMENTO</div>
      </div>
      <div style={{ position: "absolute", right: 70, top: 56, fontFamily: MONO, textAlign: "right", color: f >= manyAt ? RED : f >= appearAt ? RED : ICE, letterSpacing: 5 }}>
        <div style={{ fontSize: 16, opacity: 0.8 }}>CONTATOS</div>
        <div style={{ fontSize: 54 }}>{f >= manyAt ? 5 : f >= againAt ? (f >= stillAt ? 2 : 1) : f >= appearAt && f < goneAt ? 1 : 0}</div>
        {f >= manyAt ? <div style={{ fontSize: 16, letterSpacing: 3, opacity: P(f, manyAt + 12, 10) }}>ASSINATURAS DISTINTAS: 1</div> : null}
      </div>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(0,0,0,0.7) 100%)" }} />
    </AbsoluteFill>
  );
};

// ============================================================================================ 3) a versão ancorada
// planta de uma sala vista de cima, câmera girando. Cinco cópias. Uma deixa pegadas, empurra uma caixa e é a única de
// onde sai som; as outras levam tiro, viram estática e voltam. Trava na ancorada; o Gordon mira e mata; todas somem.
export const HLFlickerAnchor: React.FC<{ life: number; copiesAt?: number; oddAt?: number; stepsAt?: number; pushAt?: number; soundAt?: number; othersAt?: number; hitAt?: number; backAt?: number; anchorAt?: number; aimAt?: number; killAt?: number; goneAt?: number }> = ({
  life,
  copiesAt = 0,
  oddAt = 1e9,
  stepsAt = 1e9,
  pushAt = 1e9,
  soundAt = 1e9,
  othersAt = 1e9,
  hitAt = 1e9,
  backAt = 1e9,
  anchorAt = 1e9,
  aimAt = 1e9,
  killAt = 1e9,
  goneAt = 1e9,
}) => {
  const f = useCurrentFrame();
  void life;
  void othersAt;
  void IO;
  const cam: Cam = { fx: 0, fy: 0, yaw: 0.3 + f * 0.0012, pitch: 0.9, dist: 46, cy: 600 };
  // a ancorada anda (pegadas) de A até B
  const walkT = interpolate(f, [stepsAt - 10, aimAt], [0, 1], C);
  const ax = -8 + 14 * walkT;
  const ay = 6 - 9 * walkT + 1.5 * Math.sin(walkT * 6);
  const copies: [number, number][] = [[-12, -8], [9, -9], [12, 8], [-14, 9]];
  const hit = f >= hitAt && f < backAt;
  const dead = f >= killAt;
  const gone = P(f, goneAt, 8);
  const odd = f >= oddAt;
  const lock = P(f, anchorAt, 10);
  const crate = interpolate(f, [pushAt, pushAt + 20], [0, 2.6], { ...C, easing: Easing.out(Easing.cubic) });
  const aim = interpolate(f, [aimAt, killAt - 2], [0, 1], { ...C, easing: Easing.inOut(Easing.cubic) });
  const A = proj(cam, ax, ay, 0);
  const cross = { x: 1500 + (A[0] - 1500) * aim, y: 300 + (A[1] - 300) * aim };
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 55%, #08131a 0%, #020507 75%)", overflow: "hidden" }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <FlickDefs f={f} />
        {/* a sala */}
        <polygon points={pts(cam, [[-18, -14, 0], [18, -14, 0], [18, 14, 0], [-18, 14, 0]])} fill="rgba(159,230,255,0.035)" stroke="rgba(159,230,255,0.6)" strokeWidth={2} />
        {Array.from({ length: 7 }).map((_, i) => (
          <polyline key={i} points={pts(cam, [[-18 + i * 6, -14, 0], [-18 + i * 6, 14, 0]])} stroke="rgba(159,230,255,0.07)" />
        ))}
        {[[-18, -14], [18, -14], [18, 14], [-18, 14]].map(([x, y], i) => (
          <polyline key={"v" + i} points={pts(cam, [[x, y, 0], [x, y, 3]])} stroke="rgba(159,230,255,0.4)" />
        ))}
        {/* a caixa que ela empurra */}
        {(() => {
          const x0 = 2 + crate;
          const y0 = -2 - crate * 0.4;
          const b: [number, number, number][] = [[x0, y0, 0], [x0 + 2, y0, 0], [x0 + 2, y0 + 2, 0], [x0, y0 + 2, 0], [x0, y0, 0]];
          return (
            <g>
              <polyline points={pts(cam, b)} fill="none" stroke={AMB} strokeWidth={2} />
              <polyline points={pts(cam, b.map((p) => [p[0], p[1], 1.6] as [number, number, number]))} fill="none" stroke={AMB} strokeWidth={2} />
              {b.slice(0, 4).map((p, i) => (
                <polyline key={i} points={pts(cam, [p, [p[0], p[1], 1.6]])} stroke={AMB} strokeWidth={1.5} />
              ))}
            </g>
          );
        })()}
        {/* pegadas: só da ancorada */}
        {f >= stepsAt
          ? Array.from({ length: Math.floor(walkT * 16) }).map((_, i) => {
              const t = i / 16;
              const x = -8 + 14 * t;
              const y = 6 - 9 * t + 1.5 * Math.sin(t * 6) + (i % 2 ? 0.5 : -0.5);
              const p = proj(cam, x, y, 0);
              return <ellipse key={i} cx={p[0]} cy={p[1]} rx={5} ry={3} fill={AMB} opacity={0.35 + 0.5 * (i / 16)} />;
            })
          : null}
        {/* som dos passos: anéis saindo só dela */}
        {f >= soundAt && !dead
          ? [0, 1, 2].map((k) => {
              const ph = ((f - soundAt) / 24 + k / 3) % 1;
              return <ellipse key={k} cx={A[0]} cy={A[1]} rx={20 + ph * 120} ry={(20 + ph * 120) * 0.55} fill="none" stroke={CREAM} strokeWidth={2} opacity={1 - ph} />;
            })
          : null}
        {/* as cópias */}
        {copies.map(([x, y], i) => {
          const p = proj(cam, x + Math.sin(f / 20 + i) * 0.6, y, 0);
          const a = P(f, copiesAt + i * 4, 6) * (1 - gone);
          const h = hit && i % 2 === 0;
          return (
            <g key={i}>
              <Flick f={f} x={p[0]} y={p[1] - 40} s={0.75} o={h ? 0.25 : a} seed={10 + i} />
              {h ? <circle cx={p[0]} cy={p[1] - 40} r={30 + (f - hitAt) * 3} fill="none" stroke="#ffd27a" strokeWidth={2} opacity={Math.max(0, 1 - (f - hitAt) / 14)} /> : null}
              {f >= hitAt && f < hitAt + 6 && i % 2 === 0 ? <line x1={1500} y1={1080} x2={p[0]} y2={p[1] - 40} stroke="#ffd27a" strokeWidth={2} /> : null}
              {f >= backAt && f < backAt + 30 && i % 2 === 0 ? (
                <text x={p[0] + 30} y={p[1] - 70} fill={RED} fontFamily={MONO} fontSize={15} letterSpacing={3} opacity={flickIn(f, backAt)}>
                  VOLTOU
                </text>
              ) : null}
            </g>
          );
        })}
        {/* a ancorada */}
        <Flick f={f} x={A[0]} y={A[1] - 40} s={0.8} o={dead ? 1 - P(f, killAt, 6) : P(f, copiesAt, 6)} seed={20} hot={odd} />
        {odd && !dead ? <Bracket x={A[0]} y={A[1] - 44} w={90} h={130} col={lock > 0 ? CREAM : AMB} o={P(f, oddAt, 8)} label={lock > 0 ? "ANCORADA" : "COMPORTAMENTO DIFERENTE"} /> : null}
        {/* o colapso: as cópias somem puxadas para onde estava a ancorada */}
        {f >= goneAt && f < goneAt + 14
          ? copies.map(([x, y], i) => {
              const p = proj(cam, x, y, 0);
              return <line key={"c" + i} x1={p[0]} y1={p[1] - 40} x2={A[0]} y2={A[1] - 40} stroke={ICE} strokeWidth={2} opacity={1 - (f - goneAt) / 14} />;
            })
          : null}
        {/* a mira do HEV */}
        {f >= aimAt && !(f > killAt + 20) ? (
          <g transform={`translate(${cross.x} ${cross.y})`} opacity={P(f, aimAt, 6)}>
            <circle r={36} fill="none" stroke={RED} strokeWidth={2.5} />
            <line x1={-52} x2={-14} y1={0} y2={0} stroke={RED} strokeWidth={2.5} />
            <line x1={14} x2={52} y1={0} y2={0} stroke={RED} strokeWidth={2.5} />
            <line y1={-52} y2={-14} x1={0} x2={0} stroke={RED} strokeWidth={2.5} />
            <line y1={14} y2={52} x1={0} x2={0} stroke={RED} strokeWidth={2.5} />
          </g>
        ) : null}
      </svg>
      <AbsoluteFill style={{ background: "#fff3e2", opacity: interpolate(f, [killAt, killAt + 1, killAt + 6], [0, 0.5, 0], C), pointerEvents: "none" }} />
      <div style={{ position: "absolute", left: 70, top: 56, fontFamily: MONO, color: ICE, letterSpacing: 6 }}>
        <div style={{ fontSize: 22 }}>H.E.V. · ANÁLISE DE COMBATE</div>
      </div>
      {/* painel: o que muda em uma só */}
      <div style={{ position: "absolute", right: 70, top: 150, width: 420, fontFamily: MONO, display: "flex", flexDirection: "column", gap: 10 }}>
        {[
          { k: "PEGADAS", at: stepsAt },
          { k: "MOVE OBJETOS", at: pushAt },
          { k: "SOM DOS PASSOS", at: soundAt },
        ].map((r, i) =>
          f >= r.at ? (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 16px", background: "rgba(20,12,4,0.8)", border: `1px solid ${AMB}`, borderRadius: 6, opacity: flickIn(f, r.at) }}>
              <span style={{ fontSize: 20, letterSpacing: 3, color: CREAM }}>{r.k}</span>
              <span style={{ fontSize: 18, letterSpacing: 2, color: AMB }}>SÓ 1 DE 5</span>
            </div>
          ) : null,
        )}
        {f >= backAt ? (
          <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 16px", background: "rgba(40,6,6,0.8)", border: `1px solid ${RED}`, borderRadius: 6, opacity: flickIn(f, backAt) }}>
            <span style={{ fontSize: 20, letterSpacing: 3, color: CREAM }}>AS OUTRAS</span>
            <span style={{ fontSize: 18, letterSpacing: 2, color: RED }}>SEMPRE VOLTAM</span>
          </div>
        ) : null}
      </div>
      {f >= goneAt ? (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 110, textAlign: "center", fontFamily: MONO, opacity: P(f, goneAt + 4, 10) }}>
          <div style={{ fontSize: 18, letterSpacing: 6, color: ICE }}>ANCORADA ELIMINADA</div>
          <div style={{ fontSize: 46, letterSpacing: 6, color: CREAM }}>CONTATOS: 0</div>
        </div>
      ) : null}
      <Corners col={ICE} o={0.35} />
    </AbsoluteFill>
  );
};

// ============================================================================================ 4) leitura do cenário → o massacre
// (a) os níveis da estação empilhados: quanto mais fundo, mais contatos e mais difícil achar a real; (b) o replay do
// ataque na planta: esquadrões Combine entram atrás da Mossman e limpam as salas (verde); depois criaturas surgem DENTRO
// das salas limpas, atrás das barricadas e em salas sem acesso; os esquadrões caem um a um: invasão → massacre.
export const HLAttackReplay: React.FC<{ life: number; deepAt?: number; whichAt?: number; stateAt?: number; replayAt?: number; clearAt?: number; wrongAt?: number; insideAt?: number; barrAt?: number; noPathAt?: number; invAt?: number; massAt?: number }> = ({
  life,
  deepAt = 1e9,
  whichAt = 1e9,
  stateAt = 1e9,
  replayAt = 1e9,
  clearAt = 1e9,
  wrongAt = 1e9,
  insideAt = 1e9,
  barrAt = 1e9,
  noPathAt = 1e9,
  invAt = 1e9,
  massAt = 1e9,
}) => {
  const f = useCurrentFrame();
  void life;
  const plan = P(f, replayAt - 8, 14);
  // (a) níveis
  const lv = [
    { n: "NÍVEL 1", c: 3 },
    { n: "NÍVEL 2", c: 9 },
    { n: "NÍVEL 3", c: 26 },
  ];
  const depth = interpolate(f, [deepAt, deepAt + 70], [0, 2], { ...C, easing: Easing.inOut(Easing.quad) });
  const camA: Cam = { fx: 0, fy: 0, yaw: -0.5 + f * 0.002, pitch: 0.6, dist: 90, cy: 520 };
  // (b) replay
  const cam: Cam = { fx: 0, fy: -2, yaw: -0.3 + f * 0.0014, pitch: 0.95, dist: 74, cy: 600 };
  const squads = [
    { path: [[-36, -3], [-24, -3], [-24, -14]] as [number, number][], room: 0 },
    { path: [[-36, -3], [-6, -3], [-6, -14]] as [number, number][], room: 1 },
    { path: [[-36, -3], [8, -3], [8, -14]] as [number, number][], room: 2 },
    { path: [[-36, -3], [-22, -3], [-22, 9]] as [number, number][], room: 5 },
    { path: [[-36, -3], [18, -3], [18, 9]] as [number, number][], room: 8 },
  ];
  const along = (pth: [number, number][], t: number) => {
    const L = pth.length - 1;
    const k = Math.min(L - 1, Math.floor(t * L));
    const u = t * L - k;
    return [pth[k][0] + (pth[k + 1][0] - pth[k][0]) * u, pth[k][1] + (pth[k + 1][1] - pth[k][1]) * u];
  };
  const go = interpolate(f, [replayAt + 6, clearAt + 30], [0, 1], { ...C, easing: Easing.inOut(Easing.quad) });
  const cleared = (i: number) => f >= clearAt + i * 8;
  const ghosts: { x: number; y: number; at: number }[] = [
    { x: -24, y: -15, at: insideAt },
    { x: 8, y: -13, at: insideAt + 6 },
    { x: -20, y: 10, at: insideAt + 12 },
    { x: -2, y: -2, at: barrAt },
    { x: 14, y: -1.5, at: barrAt + 6 },
    { x: -9, y: 7, at: noPathAt },
    { x: 3, y: 6, at: noPathAt + 6 },
  ];
  const fallen = (i: number) => f >= insideAt + 20 + i * 34;
  const alive = squads.filter((_, i) => !fallen(i)).length;
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 55%, #08131a 0%, #020507 75%)", overflow: "hidden" }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <FlickDefs f={f} />
        {/* (a) os níveis empilhados */}
        <g opacity={1 - plan}>
          {lv.map((l, i) => {
            const z = -i * 9;
            const c: [number, number, number][] = [[-26, -16, z], [26, -16, z], [26, 16, z], [-26, 16, z], [-26, -16, z]];
            const on = depth >= i - 0.3;
            const p = proj(camA, 28, -16, z);
            return (
              <g key={i}>
                <polyline points={pts(camA, c)} fill={on ? "rgba(159,230,255,0.05)" : "none"} stroke={on ? ICE : "rgba(159,230,255,0.3)"} strokeWidth={on ? 2 : 1} />
                <text x={p[0] + 14} y={p[1]} fill={on ? ICE : "rgba(159,230,255,0.4)"} fontFamily={MONO} fontSize={18} letterSpacing={4}>
                  {l.n}
                </text>
                <text x={p[0] + 14} y={p[1] + 26} fill={RED} fontFamily={MONO} fontSize={18} letterSpacing={3} opacity={on ? 1 : 0}>
                  {`${l.c} CONTATOS`}
                </text>
                {on
                  ? Array.from({ length: Math.min(l.c, 14) }).map((_, k) => {
                      const q = proj(camA, -22 + rnd(k * 3.1 + i) * 44, -13 + rnd(k * 7.7 + i) * 26, z);
                      return <Flick key={k} f={f} x={q[0]} y={q[1] - 16} s={0.22} o={rnd(k + Math.floor(f / 4) + i) > 0.3 ? 1 : 0} seed={k + i * 20} />;
                    })
                  : null}
              </g>
            );
          })}
          {(() => {
            const q = proj(camA, 0, 0, -depth * 9);
            return (
              <g transform={`translate(${q[0]} ${q[1]})`}>
                <path d="M 0 -12 L 10 8 L -10 8 Z" fill={AMB} />
                <text x={16} y={-12} fill={AMB} fontFamily={MONO} fontSize={14} letterSpacing={3}>
                  GORDON
                </text>
              </g>
            );
          })()}
        </g>
        {/* (b) o replay na planta */}
        <g opacity={plan}>
          {ROOMS.map((r, i) => {
            const fl: [number, number, number][] = [[r.x, r.y, 0], [r.x + r.w, r.y, 0], [r.x + r.w, r.y + r.h, 0], [r.x, r.y + r.h, 0], [r.x, r.y, 0]];
            const sq = squads.findIndex((s) => s.room === i);
            const cl = sq >= 0 && cleared(sq);
            const hot = ghosts.some((g) => f >= g.at && g.x >= r.x && g.x <= r.x + r.w && g.y >= r.y && g.y <= r.y + r.h);
            const col = hot ? RED : cl ? GREEN : "rgba(159,230,255,0.6)";
            const c = proj(cam, r.x + r.w / 2, r.y + r.h / 2, 0);
            return (
              <g key={i}>
                <polygon points={pts(cam, fl.slice(0, 4))} fill={hot ? "rgba(255,93,77,0.08)" : cl ? "rgba(141,255,168,0.07)" : "rgba(159,230,255,0.03)"} />
                <polyline points={pts(cam, fl)} fill="none" stroke={col} strokeWidth={1.6} />
                {cl ? (
                  <text x={c[0]} y={c[1]} textAnchor="middle" fill={hot ? RED : GREEN} fontFamily={MONO} fontSize={13} letterSpacing={3}>
                    {hot ? "LIMPA?" : "LIMPA ✓"}
                  </text>
                ) : null}
              </g>
            );
          })}
          {/* barricadas */}
          {f >= barrAt - 10
            ? [
                [[-4, -6], [-4, 0]],
                [[12, -6], [12, 0]],
              ].map((b, i) => <polyline key={"br" + i} points={pts(cam, b.map(([x, y]) => [x, y, 0.4] as [number, number, number]))} stroke={AMB} strokeWidth={5} opacity={P(f, barrAt - 10, 8)} />)
            : null}
          {/* salas sem acesso (seladas) */}
          {f >= noPathAt - 6
            ? [6, 7].map((i) => {
                const r = ROOMS[i];
                const c = proj(cam, r.x + r.w / 2, r.y + r.h - 1.5, 0);
                return (
                  <text key={"sl" + i} x={c[0]} y={c[1]} textAnchor="middle" fill={AMB} fontFamily={MONO} fontSize={13} letterSpacing={3} opacity={P(f, noPathAt - 6, 8)}>
                    SEM ACESSO
                  </text>
                );
              })
            : null}
          {/* esquadrões */}
          {squads.map((s, i) => {
            const [x, y] = along(s.path, Math.min(1, go * (1 + i * 0.06)));
            const p = proj(cam, x, y, 0);
            const dead = fallen(i);
            return (
              <g key={"sq" + i} transform={`translate(${p[0]} ${p[1]})`} opacity={P(f, replayAt + i * 3, 8)}>
                {dead ? (
                  <path d="M -9 -9 L 9 9 M 9 -9 L -9 9" stroke={RED} strokeWidth={3} />
                ) : (
                  <>
                    <path d="M 0 -11 L 10 7 L -10 7 Z" fill={RED} />
                    <circle r={18} fill="none" stroke={RED} strokeWidth={1.5} opacity={0.4} />
                  </>
                )}
              </g>
            );
          })}
          {/* as criaturas que surgem onde não deveriam */}
          {ghosts.map((g, i) => {
            if (f < g.at) return null;
            const p = proj(cam, g.x, g.y, 0);
            return (
              <g key={"gh" + i}>
                <Flick f={f} x={p[0]} y={p[1] - 22} s={0.32} seed={30 + i} />
                <circle cx={p[0]} cy={p[1]} r={16 + 30 * Math.max(0, 1 - (f - g.at) / 12)} fill="none" stroke={RED} strokeWidth={2} opacity={Math.max(0, 1 - (f - g.at) / 12)} />
              </g>
            );
          })}
          {/* destino: a Mossman */}
          {(() => {
            const p = proj(cam, 0, 16, 0);
            return (
              <g opacity={P(f, replayAt + 10, 10)}>
                <circle cx={p[0]} cy={p[1]} r={14 + 3 * Math.sin(f / 5)} fill="none" stroke={ICE} strokeWidth={2} strokeDasharray="4 4" />
                <text x={p[0] + 22} y={p[1] + 6} fill={ICE} fontFamily={MONO} fontSize={15} letterSpacing={3}>
                  ALVO DO ATAQUE · MOSSMAN
                </text>
              </g>
            );
          })()}
        </g>
      </svg>
      <div style={{ position: "absolute", left: 70, top: 56, fontFamily: MONO, color: ICE, letterSpacing: 6 }}>
        <div style={{ fontSize: 22 }}>{plan > 0.5 ? "H.E.V. · RECONSTRUÇÃO DO ATAQUE" : "H.E.V. · NÍVEIS DA ESTAÇÃO"}</div>
      </div>
      {f >= whichAt && plan < 0.5 ? (
        <div style={{ position: "absolute", right: 80, top: 170, textAlign: "right", fontFamily: MONO, opacity: P(f, whichAt, 8) * (1 - plan) }}>
          <div style={{ fontSize: 16, letterSpacing: 5, color: RED }}>QUAL DELAS É A ANCORADA?</div>
          <div style={{ fontSize: 40, letterSpacing: 4, color: CREAM }}>{f >= stateAt ? "ISSO EXPLICA A ESTAÇÃO" : "CADA VEZ MAIS DIFÍCIL"}</div>
        </div>
      ) : null}
      {plan > 0 ? (
        <div style={{ position: "absolute", right: 70, top: 56, textAlign: "right", fontFamily: MONO, opacity: plan }}>
          <div style={{ fontSize: 16, letterSpacing: 5, color: RED, opacity: 0.85 }}>ESQUADRÕES OVERWATCH</div>
          <div style={{ fontSize: 56, letterSpacing: 4, color: alive ? CREAM : RED }}>{`${alive}/5`}</div>
          {f >= wrongAt ? <div style={{ fontSize: 16, letterSpacing: 4, color: RED, opacity: flickIn(f, wrongAt) }}>ALGUMA COISA ACONTECEU</div> : null}
        </div>
      ) : null}
      {f >= invAt ? (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 100, textAlign: "center", fontFamily: MONO, display: "flex", justifyContent: "center", gap: 40, alignItems: "baseline" }}>
          <span style={{ fontSize: 46, letterSpacing: 8, color: CREAM, textDecoration: f >= massAt ? "line-through" : undefined, textDecorationColor: RED, opacity: P(f, invAt, 8) }}>INVASÃO</span>
          {f >= massAt ? <span style={{ fontSize: 66, letterSpacing: 10, color: RED, opacity: flickIn(f, massAt) }}>MASSACRE</span> : null}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ============================================================================================ 5) a descida → a Mossman
// corte vertical: o grupo desce pelos níveis subterrâneos até uma sala isolada. A ficha da Mossman no HEV (sem foto):
// VIVA (pulso), FERIDA, EXAUSTA, TRANCADA; em volta, mapas, horários e cálculos que continuam rodando sozinhos.
// O reencontro com a Alyx: dois sinais, uma linha de tensão entre eles; e ela começa o relato.
export const HLMossmanFound: React.FC<{ life: number; downAt?: number; foundAt?: number; aliveAt?: number; hurtAt?: number; tiredAt?: number; lockAt?: number; calcAt?: number; tenseAt?: number; explainAt?: number }> = ({
  life,
  downAt = 0,
  foundAt = 1e9,
  aliveAt = 1e9,
  hurtAt = 1e9,
  tiredAt = 1e9,
  lockAt = 1e9,
  calcAt = 1e9,
  tenseAt = 1e9,
  explainAt = 1e9,
}) => {
  const f = useCurrentFrame();
  void life;
  const card = P(f, foundAt, 12);
  const down = interpolate(f, [downAt, foundAt - 4], [0, 1], { ...C, easing: Easing.inOut(Easing.quad) });
  const LV = [200, 420, 640, 860];
  const gy = 140 + down * 760;
  const tense = P(f, tenseAt, 10);
  const calcs = Array.from({ length: 9 }).map((_, i) => {
    const v = (Math.floor(f / 3) + i * 7) % 97;
    return [`T+${String(Math.floor(f / 30) + 4 * 3600 + i * 37).padStart(6, "0")}`, `Δφ ${(Math.sin(f / 13 + i) * 9.31).toFixed(3)}`, `λ ${(v * 0.137).toFixed(2)}`][i % 3];
  });
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 40% 55%, #0a1218 0%, #020406 75%)", overflow: "hidden" }}>
      {/* corte vertical da descida */}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: 1 - 0.75 * card }}>
        <rect x={300} y={100} width={160} height={880} fill="rgba(159,230,255,0.03)" stroke="rgba(159,230,255,0.5)" strokeWidth={2} />
        {LV.map((y, i) => (
          <g key={i}>
            <line x1={120} x2={760} y1={y} y2={y} stroke="rgba(159,230,255,0.35)" strokeWidth={1.5} />
            <text x={120} y={y - 10} fill={ICE} fontFamily={MONO} fontSize={16} letterSpacing={4} opacity={0.7}>{`SUBNÍVEL −${i + 1}`}</text>
          </g>
        ))}
        <rect x={500} y={LV[3] + 20} width={360} height={110} fill="rgba(255,178,46,0.06)" stroke={AMB} strokeWidth={2} strokeDasharray="8 6" />
        <text x={520} y={LV[3] + 54} fill={AMB} fontFamily={MONO} fontSize={16} letterSpacing={4}>SALA ISOLADA · LACRADA</text>
        <g transform={`translate(380 ${gy})`}>
          <circle r={14} fill={AMB} />
          <circle r={26 + 4 * Math.sin(f / 4)} fill="none" stroke={AMB} strokeWidth={2} opacity={0.5} />
          <text x={36} y={6} fill={CREAM} fontFamily={MONO} fontSize={16} letterSpacing={3}>
            GORDON · ALYX · VORTIGAUNTS
          </text>
        </g>
      </svg>
      {/* cálculos rodando em volta */}
      {f >= calcAt
        ? calcs.map((c, i) => (
            <div key={i} style={{ position: "absolute", left: 1240 + (i % 3) * 210, top: 140 + Math.floor(i / 3) * 34, fontFamily: MONO, fontSize: 18, color: ICE, opacity: 0.5 * P(f, calcAt + i * 2, 8) }}>
              {c}
            </div>
          ))
        : null}
      {f >= calcAt ? (
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: P(f, calcAt, 12) * 0.8 }}>
          {/* um mapa com rota que continua sendo redesenhada e uma curva de horários */}
          <rect x={1240} y={270} width={600} height={300} fill="none" stroke="rgba(159,230,255,0.35)" />
          {Array.from({ length: 6 }).map((_, i) => (
            <path key={i} d={`M ${1250} ${300 + i * 45} C ${1400} ${280 + i * 45 + 30 * Math.sin(f / 30 + i)} ${1600} ${320 + i * 45 - 30 * Math.cos(f / 25 + i)} ${1830} ${300 + i * 45}`} fill="none" stroke="rgba(159,230,255,0.25)" />
          ))}
          <polyline points={Array.from({ length: 40 }).map((_, i) => `${1250 + i * 15},${520 - 60 * Math.abs(Math.sin(i * 0.5 + f / 15))}`).join(" ")} fill="none" stroke={AMB} strokeWidth={2} />
          <circle cx={1540 + 120 * Math.sin(f / 40)} cy={400} r={8} fill={RED} />
          <text x={1250} y={262} fill={ICE} fontFamily={MONO} fontSize={15} letterSpacing={4}>
            CÁLCULOS · AINDA RODANDO
          </text>
        </svg>
      ) : null}
      {/* a ficha da Mossman */}
      {card > 0 ? (
        <div style={{ position: "absolute", left: 140, top: 200, width: 900, padding: "26px 30px", background: "rgba(4,10,14,0.9)", border: `1px solid ${ICE}`, borderRadius: 10, fontFamily: MONO, opacity: card, transform: `translateY(${(1 - card) * 20}px)` }}>
          <div style={{ fontSize: 16, letterSpacing: 6, color: ICE, opacity: 0.8 }}>H.E.V. · CONTATO IDENTIFICADO</div>
          <div style={{ fontSize: 60, letterSpacing: 4, color: CREAM, marginTop: 6 }}>DRA. JUDITH MOSSMAN</div>
          <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {[
              { k: "VIVA", at: aliveAt, c: GREEN, v: <Ecg f={f} bpm={96} jitter={0.4} col={GREEN} w={380} h={60} /> },
              { k: "FERIDA", at: hurtAt, c: RED, v: <div style={{ fontSize: 20, color: CREAM }}>FERIMENTO · CONTIDO</div> },
              { k: "EXAUSTA", at: tiredAt, c: AMB, v: <div style={{ height: 14, background: "rgba(255,178,46,0.15)", position: "relative" }}><div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${18 - 4 * Math.sin(f / 20)}%`, background: AMB }} /></div> },
              { k: "TRANCADA", at: lockAt, c: AMB, v: <div style={{ fontSize: 20, color: CREAM }}>POR DENTRO · SUBNÍVEL −4</div> },
            ].map((r, i) => (
              <div key={i} style={{ padding: "12px 16px", border: `1px solid ${f >= r.at ? r.c : "rgba(255,255,255,0.1)"}`, borderRadius: 6, opacity: f >= r.at ? flickIn(f, r.at) : 0.15, minHeight: 92 }}>
                <div style={{ fontSize: 22, letterSpacing: 6, color: r.c, marginBottom: 8 }}>{r.k}</div>
                {f >= r.at ? r.v : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}
      {/* o reencontro com a Alyx: tensão */}
      {f >= tenseAt ? (
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: tense }}>
          <circle cx={1300} cy={820} r={14} fill={ICE} />
          <text x={1300} y={870} textAnchor="middle" fill={ICE} fontFamily={MONO} fontSize={18} letterSpacing={4}>
            ALYX
          </text>
          <circle cx={1760} cy={820} r={14} fill={CREAM} />
          <text x={1760} y={870} textAnchor="middle" fill={CREAM} fontFamily={MONO} fontSize={18} letterSpacing={4}>
            MOSSMAN
          </text>
          <polyline points={Array.from({ length: 30 }).map((_, i) => `${1320 + i * 14.5},${820 + (i % 2 ? -1 : 1) * (6 + 10 * rnd(i + Math.floor(f / 2)))}`).join(" ")} fill="none" stroke={RED} strokeWidth={2.5} />
          <text x={1530} y={780} textAnchor="middle" fill={RED} fontFamily={MONO} fontSize={16} letterSpacing={5}>
            TENSÃO
          </text>
        </svg>
      ) : null}
      {f >= explainAt ? (
        <div style={{ position: "absolute", left: 140, bottom: 70, fontFamily: MONO, fontSize: 26, letterSpacing: 6, color: CREAM, opacity: P(f, explainAt, 8) }}>
          {"MOSSMAN · RELATO DA NOITE DO ATAQUE"}
          <span style={{ opacity: Math.floor(f / 12) % 2 ? 1 : 0 }}>▮</span>
        </div>
      ) : null}
      <div style={{ position: "absolute", left: 70, top: 56, fontFamily: MONO, color: ICE, letterSpacing: 6, opacity: 1 - card }}>
        <div style={{ fontSize: 22 }}>H.E.V. · DESCIDA · NÍVEIS SUBTERRÂNEOS</div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------------- o Borealis em wireframe
// cargueiro: casco com proa afinando, convés, superestrutura na popa com chaminé, guindaste e contêineres. Em metros.
const hullW = (x: number) => (x > 22 ? 8 * Math.max(0, 1 - (x - 22) / 20) ** 0.8 : x < -36 ? 8 - (-36 - x) * 0.6 : 8);
type Seg3 = [number, number, number][];
const shipGeo = (() => {
  const L: { p: Seg3; part: number }[] = [];
  const xs = Array.from({ length: 21 }).map((_, i) => -40 + i * 4.1);
  // contornos do convés (z=7) e da linha d'água (z=0), dos dois lados
  for (const z of [7, 0, -2.5]) {
    for (const s of [-1, 1]) L.push({ p: xs.map((x) => [x, s * hullW(x) * (z < 7 ? 0.92 : 1), z]), part: x0part(0) });
  }
  // cavernas (cortes transversais)
  xs.forEach((x, i) => {
    if (i % 2) return;
    const w = hullW(x);
    L.push({ p: [[x, -w, 7], [x, -w * 0.92, 0], [x, -w * 0.7, -2.5], [x, w * 0.7, -2.5], [x, w * 0.92, 0], [x, w, 7]], part: x0part(x) });
  });
  // superestrutura
  const box = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, part: number) => {
    const b: Seg3 = [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], [x0, y0, z0]];
    const t: Seg3 = b.map((q) => [q[0], q[1], z1]);
    L.push({ p: b, part }, { p: t, part });
    b.slice(0, 4).forEach((q) => L.push({ p: [q, [q[0], q[1], z1]], part }));
  };
  box(-38, -24, -6.5, 6.5, 7, 18, 1);
  box(-36, -27, -7.5, 7.5, 18, 21, 1);
  box(-33, -30, -1.5, 1.5, 21, 27, 1);
  // contêineres
  [-16, -8, 0, 8].forEach((x, i) => box(x, x + 6, -5, 5, 7, 7 + 2.6 * (1 + (i % 2)), 2));
  // guindaste
  L.push({ p: [[14, 0, 7], [14, 0, 20], [26, 3, 18]], part: 3 });
  return L;
  function x0part(x: number) {
    return x > 18 ? 3 : x < -22 ? 1 : 2;
  }
})();
const PART_COL = [ICE, "#7fd6ff", "#ffd27a", "#c79bff"];
const Ship: React.FC<{ cam: Cam; o?: number; parts?: boolean; col?: string; dx?: number; dy?: number; sc?: number; draw?: number }> = ({ cam, o = 1, parts = false, col = ICE, dx = 0, dy = 0, sc = 1, draw = 1 }) => (
  <g opacity={o}>
    {shipGeo.map((s, i) =>
      i / shipGeo.length <= draw ? (
        <polyline key={i} points={pts(cam, s.p.map(([x, y, z]) => [x * sc + dx, y * sc + dy, z * sc] as [number, number, number]))} fill="none" stroke={parts ? PART_COL[s.part] : col} strokeWidth={1.4} strokeLinejoin="round" />
      ) : null,
    )}
  </g>
);

// mapa esquemático do Ártico (linhas de costa fixas + grade polar) — compartilhado
const ArcticMap: React.FC<{ f: number; o?: number }> = ({ f, o = 1 }) => (
  <g opacity={o}>
    {[140, 260, 380].map((r) => (
      <circle key={r} cx={960} cy={560} r={r} fill="none" stroke="rgba(159,230,255,0.12)" />
    ))}
    {Array.from({ length: 12 }).map((_, i) => {
      const a = (i / 12) * Math.PI * 2;
      return <line key={i} x1={960} y1={560} x2={960 + Math.cos(a) * 420} y2={560 + Math.sin(a) * 420} stroke="rgba(159,230,255,0.08)" />;
    })}
    <path d="M 520 880 C 600 780 560 700 650 640 C 720 590 690 520 760 470 M 1400 860 C 1330 760 1390 700 1320 630 C 1280 580 1330 520 1270 470 M 700 260 C 780 230 860 250 940 220 C 1020 200 1110 240 1190 230" fill="none" stroke="rgba(159,230,255,0.45)" strokeWidth={2} />
    <text x={960} y={566} textAnchor="middle" fill="rgba(159,230,255,0.4)" fontFamily={MONO} fontSize={14} letterSpacing={4}>
      ÁRTICO
    </text>
    {void f}
  </g>
);

// ============================================================================================ 6) o relato: a manifestação curta
// gráfico da noite do ataque: a transmissão, o pico do Borealis (só alguns segundos, contra a janela longa esperada),
// o pico some e sobram pontos vermelhos (os Flickers). Depois o mapa: o modelo antigo (o navio salta de ponto em ponto)
// e o novo (quando ele aparece, outros lugares aparecem junto, sobrepostos). Fecha com os dias de cálculo dela.
export const HLShortManifest: React.FC<{ life: number; txAt?: number; shipAt?: number; longAt?: number; secsAt?: number; goneAt?: number; wrongAt?: number; togetherAt?: number; daysAt?: number }> = ({
  life,
  txAt = 0,
  shipAt = 1e9,
  longAt = 1e9,
  secsAt = 1e9,
  goneAt = 1e9,
  wrongAt = 1e9,
  togetherAt = 1e9,
  daysAt = 1e9,
}) => {
  const f = useCurrentFrame();
  void life;
  const map = P(f, wrongAt - 4, 14);
  const X0 = 180;
  const X1 = 1740;
  const Y = 640;
  const spikeX = 760;
  const spike = f >= shipAt ? (f < goneAt ? P(f, shipAt, 4) : 1 - P(f, goneAt, 6)) : 0;
  const residue = Array.from({ length: 26 }).map((_, i) => ({ x: spikeX + 20 + rnd(i * 3.3) * 820, y: Y - 40 - rnd(i * 5.1) * 180, at: goneAt + 4 + i * 2 }));
  // modelo antigo: saltos
  const pins: [number, number][] = [[700, 420], [1180, 380], [860, 760], [1260, 700], [620, 600]];
  const hopT = (f - wrongAt) / 26;
  const hk = Math.max(0, Math.floor(hopT)) % pins.length;
  const hu = hopT - Math.floor(hopT);
  const from = pins[hk];
  const to = pins[(hk + 1) % pins.length];
  const sx = from[0] + (to[0] - from[0]) * Math.min(1, hu * 2);
  const sy = from[1] + (to[1] - from[1]) * Math.min(1, hu * 2) - Math.sin(Math.min(1, hu * 2) * Math.PI) * 80;
  const tog = P(f, togetherAt, 12);
  const days = Math.min(6, Math.max(0, Math.floor((f - daysAt) / 12) + 1));
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, #0a1218 0%, #020406 75%)", overflow: "hidden" }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <FlickDefs f={f} />
        {/* gráfico da noite */}
        <g opacity={1 - map}>
          <line x1={X0} x2={X1} y1={Y} y2={Y} stroke="rgba(159,230,255,0.5)" strokeWidth={2} />
          {Array.from({ length: 13 }).map((_, i) => (
            <g key={i}>
              <line x1={X0 + i * 130} x2={X0 + i * 130} y1={Y} y2={Y + 10} stroke="rgba(159,230,255,0.5)" />
              <text x={X0 + i * 130} y={Y + 32} textAnchor="middle" fill="rgba(159,230,255,0.45)" fontFamily={MONO} fontSize={13}>{`${String(21 + Math.floor(i / 2)).padStart(2, "0")}:${i % 2 ? "30" : "00"}`}</text>
            </g>
          ))}
          {/* a transmissão */}
          <g opacity={P(f, txAt, 8)}>
            <line x1={440} x2={440} y1={Y} y2={Y - 140} stroke={AMB} strokeWidth={2} strokeDasharray="5 5" />
            <text x={448} y={Y - 148} fill={AMB} fontFamily={MONO} fontSize={16} letterSpacing={3}>
              TRANSMISSÃO
            </text>
          </g>
          {/* a janela longa esperada */}
          <g opacity={P(f, longAt, 10)}>
            <rect x={spikeX - 10} y={Y - 300} width={760} height={300} fill="rgba(159,230,255,0.05)" stroke={ICE} strokeDasharray="8 6" />
            <text x={spikeX + 740} y={Y - 312} textAnchor="end" fill={ICE} fontFamily={MONO} fontSize={18} letterSpacing={3}>
              ESPERADA · JANELA LONGA
            </text>
          </g>
          {/* o pico real */}
          <path d={`M ${spikeX - 30} ${Y} L ${spikeX - 6} ${Y} L ${spikeX} ${Y - 380 * spike} L ${spikeX + 6} ${Y} L ${spikeX + 30} ${Y}`} fill="none" stroke={CREAM} strokeWidth={3} />
          {f >= shipAt ? (
            <text x={spikeX - 16} y={Y - 392} textAnchor="end" fill={CREAM} fontFamily={MONO} fontSize={18} letterSpacing={3} opacity={P(f, shipAt, 6)}>
              BOREALIS
            </text>
          ) : null}
          {f >= secsAt ? (
            <text x={spikeX - 16} y={Y - 352} textAnchor="end" fill={RED} fontFamily={MONO} fontSize={30} letterSpacing={3} opacity={flickIn(f, secsAt)}>
              REAL: 4 SEGUNDOS
            </text>
          ) : null}
          {/* o que ficou */}
          {residue.map((r, i) => (f >= r.at ? <Flick key={i} f={f} x={r.x} y={r.y} s={0.18} seed={i} /> : null))}
          {f >= goneAt + 30 ? (
            <text x={spikeX + 300} y={Y - 260} fill={RED} fontFamily={MONO} fontSize={22} letterSpacing={4} opacity={P(f, goneAt + 30, 8)}>
              O NAVIO SUMIU · OS FLICKERS FICARAM
            </text>
          ) : null}
        </g>
        {/* o mapa: modelo antigo × novo */}
        <g opacity={map}>
          <ArcticMap f={f} />
          {pins.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={7} fill="none" stroke={ICE} strokeWidth={2} />
          ))}
          {f < togetherAt ? (
            <g>
              <circle cx={sx} cy={sy} r={12} fill={CREAM} />
              <path d={`M ${from[0]} ${from[1]} Q ${(from[0] + to[0]) / 2} ${(from[1] + to[1]) / 2 - 120} ${to[0]} ${to[1]}`} fill="none" stroke={CREAM} strokeWidth={1.5} strokeDasharray="6 6" opacity={0.6} />
            </g>
          ) : (
            <g>
              <circle cx={960} cy={560} r={14} fill={CREAM} />
              {/* outros lugares aparecendo junto, sobrepostos */}
              {[
                { d: "M -120 -80 L 120 -80 L 120 80 L -120 80 Z M -120 0 L 120 0 M 0 -80 L 0 80", c: AMB, r: 8 },
                { d: "M -150 40 Q 0 -160 150 40 Z M -90 40 L -90 -20 M 90 40 L 90 -20", c: "#c79bff", r: -12 },
                { d: "M -60 -140 L 60 -140 L 90 140 L -90 140 Z M -30 -140 L -30 140 M 30 -140 L 30 140", c: GREEN, r: 20 },
              ].map((g, i) => (
                <path key={i} d={g.d} transform={`translate(${960 + (rnd(f + i) - 0.5) * 4} ${560}) rotate(${g.r}) scale(${0.6 + 0.4 * P(f, togetherAt + i * 4, 10)})`} fill="none" stroke={g.c} strokeWidth={2} opacity={P(f, togetherAt + i * 4, 10) * (0.6 + 0.4 * Math.sin(f / 5 + i))} />
              ))}
            </g>
          )}
        </g>
      </svg>
      <div style={{ position: "absolute", left: 70, top: 56, fontFamily: MONO, color: ICE, letterSpacing: 6 }}>
        <div style={{ fontSize: 22 }}>{map > 0.5 ? "REGISTROS DA DRA. MOSSMAN · MODELO" : "REGISTROS DA DRA. MOSSMAN · NOITE DO ATAQUE"}</div>
      </div>
      {map > 0 ? (
        <div style={{ position: "absolute", left: 70, bottom: 80, fontFamily: MONO, opacity: map }}>
          <div style={{ fontSize: 16, letterSpacing: 5, color: f >= togetherAt ? AMB : ICE }}>{f >= togetherAt ? "MODELO NOVO" : "MODELO ANTIGO"}</div>
          <div style={{ fontSize: 34, letterSpacing: 3, color: CREAM, textDecoration: f >= togetherAt ? undefined : undefined }}>{f >= togetherAt ? "QUANDO ELE APARECE, OUTROS LUGARES APARECEM JUNTO" : "O NAVIO SALTA DE UM LUGAR PARA OUTRO"}</div>
        </div>
      ) : null}
      {f >= daysAt ? (
        <div style={{ position: "absolute", right: 70, top: 150, fontFamily: MONO, textAlign: "right", opacity: P(f, daysAt, 8) }}>
          <div style={{ fontSize: 16, letterSpacing: 5, color: AMB }}>TENTANDO PROVAR</div>
          <div style={{ fontSize: 50, letterSpacing: 4, color: CREAM }}>{`DIA ${days}`}</div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ============================================================================================ 7) os segundos de perto
// os sensores dela gravaram a manifestação a poucos metros. O modelo dos saltos não bate: o navio aparece em partes
// com assinaturas diferentes, cada uma ligada a uma posição incompatível; e duas coisas ocupam o mesmo espaço.
export const HLCloseData: React.FC<{ life: number; dataAt?: number; closeAt?: number; hopAt?: number; noAt?: number; partsAt?: number; posAt?: number; sameAt?: number }> = ({
  life,
  dataAt = 0,
  closeAt = 1e9,
  hopAt = 1e9,
  noAt = 1e9,
  partsAt = 1e9,
  posAt = 1e9,
  sameAt = 1e9,
}) => {
  const f = useCurrentFrame();
  void life;
  const shipOn = P(f, partsAt - 6, 14);
  const cam: Cam = { fx: -4, fy: 0, yaw: -0.65 + f * 0.0016, pitch: 0.42, dist: 120, cy: 600, F: 1000 };
  const pinsHop: [number, number][] = [[620, 420], [1300, 380], [900, 760], [1400, 720]];
  const hopT = (f - hopAt) / 20;
  const hk = Math.max(0, Math.floor(hopT)) % pinsHop.length;
  const posPins: { x: number; y: number; part: number; n: string }[] = [
    { x: 1560, y: 230, part: 1, n: "POS. 1 · 81°N" },
    { x: 1700, y: 520, part: 2, n: "POS. 2 · ?" },
    { x: 1560, y: 820, part: 3, n: "POS. 3 · 2.300 km" },
  ];
  const same = f >= sameAt;
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 45% 50%, #0a1218 0%, #020406 75%)", overflow: "hidden" }}>
      {/* sensores gravando de perto */}
      {f < hopAt ? (
        <AbsoluteFill style={{ padding: "170px 140px", boxSizing: "border-box", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28, opacity: P(f, dataAt, 10) }}>
          {["CAMPO", "GRAVITACIONAL", "ESPECTRO", "TÉRMICO"].map((n, k) => (
            <div key={k} style={{ border: "1px solid rgba(159,230,255,0.35)", background: "#04080b", position: "relative", fontFamily: MONO }}>
              <div style={{ position: "absolute", left: 12, top: 8, fontSize: 15, letterSpacing: 4, color: ICE }}>{`SENSOR · ${n}`}</div>
              <svg width="100%" height="100%" viewBox="0 0 700 300" preserveAspectRatio="none" style={{ position: "absolute", inset: 0 }}>
                <polyline points={Array.from({ length: 140 }).map((_, i) => `${i * 5},${150 + (i > 50 && i < 80 ? 110 : 18) * Math.sin(i * (0.4 + k * 0.13) + f / 4) * rnd(i + k)}`).join(" ")} fill="none" stroke={k % 2 ? AMB : ICE} strokeWidth={2} />
                <rect x={250} y={0} width={150} height={300} fill="rgba(255,226,176,0.08)" />
              </svg>
              <div style={{ position: "absolute", left: 270, bottom: 8, fontSize: 13, letterSpacing: 3, color: CREAM }}>4,2 s GRAVADOS</div>
            </div>
          ))}
        </AbsoluteFill>
      ) : null}
      {f >= closeAt && f < hopAt ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 88, textAlign: "center", fontFamily: MONO, opacity: P(f, closeAt, 8) }}>
          <span style={{ fontSize: 18, letterSpacing: 5, color: ICE }}>DISTÂNCIA DO FENÔMENO </span>
          <span style={{ fontSize: 40, letterSpacing: 4, color: CREAM }}>310 m</span>
          <span style={{ fontSize: 18, letterSpacing: 5, color: GREEN }}> · A MAIS PERTO JÁ REGISTRADA</span>
        </div>
      ) : null}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {/* modelo dos saltos, que não bate */}
        {f >= hopAt && f < partsAt ? (
          <g opacity={P(f, hopAt, 10) * (1 - P(f, partsAt - 6, 10))}>
            <ArcticMap f={f} />
            {pinsHop.map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r={7} fill="none" stroke={ICE} strokeWidth={2} />
            ))}
            <circle cx={pinsHop[hk][0]} cy={pinsHop[hk][1]} r={13} fill={CREAM} />
            {f >= noAt ? (
              <g opacity={flickIn(f, noAt)}>
                <line x1={560} y1={300} x2={1360} y2={840} stroke={RED} strokeWidth={10} strokeLinecap="round" />
                <line x1={1360} y1={300} x2={560} y2={840} stroke={RED} strokeWidth={10} strokeLinecap="round" />
                <text x={960} y={260} textAnchor="middle" fill={RED} fontFamily={MONO} fontSize={30} letterSpacing={6}>
                  OS REGISTROS NÃO BATEM
                </text>
              </g>
            ) : null}
          </g>
        ) : null}
        {/* o navio em partes, cada uma com uma assinatura */}
        {f >= partsAt - 6 ? (
          <g opacity={shipOn}>
            <Ship cam={cam} parts={!same} col={ICE} />
            {same ? (
              <g opacity={0.55 + 0.45 * Math.sin(f / 3)}>
                <Ship cam={{ ...cam, yaw: cam.yaw + 0.04 }} col={AMB} dx={3} dy={-1} sc={1.02} />
              </g>
            ) : null}
            {!same
              ? [
                  { x: -31, y: 0, z: 22, k: 1, n: "ASSINATURA A" },
                  { x: -4, y: 0, z: 12, k: 2, n: "ASSINATURA B" },
                  { x: 30, y: 0, z: 9, k: 3, n: "ASSINATURA C" },
                ].map((t, i) => {
                  const p = proj(cam, t.x, t.y, t.z);
                  const pin = posPins[i];
                  return (
                    <g key={i} opacity={P(f, partsAt + i * 6, 8)}>
                      <circle cx={p[0]} cy={p[1]} r={6} fill={PART_COL[t.k]} />
                      <text x={p[0] - 40} y={p[1] - 18} fill={PART_COL[t.k]} fontFamily={MONO} fontSize={16} letterSpacing={3}>
                        {t.n}
                      </text>
                      {f >= posAt ? (
                        <g opacity={P(f, posAt + i * 6, 10)}>
                          <line x1={p[0]} y1={p[1]} x2={pin.x} y2={pin.y} stroke={PART_COL[t.k]} strokeWidth={1.5} strokeDasharray="6 6" />
                          <circle cx={pin.x} cy={pin.y} r={9} fill="none" stroke={PART_COL[t.k]} strokeWidth={2} />
                          <text x={pin.x + 16} y={pin.y + 6} fill={PART_COL[t.k]} fontFamily={MONO} fontSize={16} letterSpacing={3}>
                            {pin.n}
                          </text>
                        </g>
                      ) : null}
                    </g>
                  );
                })
              : null}
          </g>
        ) : null}
      </svg>
      {same ? (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 100, textAlign: "center", fontFamily: MONO, opacity: P(f, sameAt, 10) }}>
          <div style={{ fontSize: 18, letterSpacing: 6, color: AMB }}>INSTRUMENTOS DA INSTALAÇÃO</div>
          <div style={{ fontSize: 40, letterSpacing: 4, color: CREAM }}>MESMO ESPAÇO · LUGARES DIFERENTES</div>
        </div>
      ) : null}
      {f >= posAt && !same ? (
        <div style={{ position: "absolute", left: 70, bottom: 90, fontFamily: MONO, fontSize: 26, letterSpacing: 4, color: RED, opacity: P(f, posAt + 20, 10) }}>
          POSIÇÕES INCOMPATÍVEIS ENTRE SI
        </div>
      ) : null}
      <div style={{ position: "absolute", left: 70, top: 56, fontFamily: MONO, color: ICE, letterSpacing: 6 }}>
        <div style={{ fontSize: 22 }}>REGISTROS DA DRA. MOSSMAN · A MANIFESTAÇÃO DE PERTO</div>
      </div>
    </AbsoluteFill>
  );
};

// ============================================================================================ 8) a conclusão: sobreposição
// "não está viajando": o modelo dos saltos se apaga. Dois lugares (duas grades, gelo e âmbar) deslizam um sobre o outro
// por alguns instantes; na faixa sobreposta surgem os Flickers; quando os lugares se separam, alguns ficam do lado errado.
export const HLOverlap: React.FC<{ life: number; notAt?: number; overAt?: number; flickAt?: number; trapAt?: number }> = ({ life, notAt = 0, overAt = 1e9, flickAt = 1e9, trapAt = 1e9 }) => {
  const f = useCurrentFrame();
  void life;
  const inn = P(f, overAt, 24);
  const out = P(f, trapAt + 6, 22);
  const off = 560 * (1 - inn) + 560 * out; // distância de cada lugar ao centro
  const A = { x: 960 - 140 - off, y: 540 };
  const B = { x: 960 + 140 + off, y: 540 };
  const grid = (cx: number, cy: number, col: string, n: string) => (
    <g>
      <rect x={cx - 360} y={cy - 300} width={720} height={600} fill={col === ICE ? "rgba(159,230,255,0.05)" : "rgba(255,178,46,0.05)"} stroke={col} strokeWidth={2} />
      {Array.from({ length: 9 }).map((_, i) => (
        <line key={"x" + i} x1={cx - 360 + i * 90} x2={cx - 360 + i * 90} y1={cy - 300} y2={cy + 300} stroke={col} strokeWidth={1} opacity={0.25} />
      ))}
      {Array.from({ length: 7 }).map((_, i) => (
        <line key={"y" + i} x1={cx - 360} x2={cx + 360} y1={cy - 300 + i * 100} y2={cy - 300 + i * 100} stroke={col} strokeWidth={1} opacity={0.25} />
      ))}
      <text x={cx - 350} y={cy - 312} fill={col} fontFamily={MONO} fontSize={18} letterSpacing={5}>
        {n}
      </text>
    </g>
  );
  const ov = Math.max(0, 720 - Math.abs(B.x - A.x));
  const ovX = (A.x + B.x) / 2;
  const blips = Array.from({ length: 8 }).map((_, i) => ({ dx: (rnd(i * 3.1) - 0.5) * 0.9, dy: (rnd(i * 7.7) - 0.5) * 500, side: i % 3 === 0 ? "B" : "A", wrong: i % 3 === 0 }));
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, #0a1218 0%, #020406 75%)", overflow: "hidden" }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <FlickDefs f={f} />
        {f >= overAt - 6 ? (
          <g opacity={P(f, overAt - 6, 10)}>
            {grid(A.x, A.y, ICE, "LUGAR A")}
            {grid(B.x, B.y, AMB, "LUGAR B")}
            {ov > 0 ? <rect x={ovX - ov / 2} y={240} width={ov} height={600} fill="rgba(255,226,176,0.1)" stroke={CREAM} strokeWidth={2} strokeDasharray="6 6" /> : null}
            {/* os Flickers nascem na faixa sobreposta; quando separa, alguns ficam no lado errado */}
            {f >= flickAt
              ? blips.map((b, i) => {
                  const sep = f >= trapAt + 6;
                  const base = sep ? (b.side === "A" ? A.x + 280 : B.x - 280) : ovX + b.dx * Math.max(ov, 60);
                  const y = 540 + b.dy;
                  return (
                    <g key={i}>
                      <Flick f={f} x={base} y={y} s={0.35} seed={i} o={P(f, flickAt + i * 3, 6)} />
                      {sep && b.wrong ? (
                        <text x={base + 24} y={y - 20} fill={RED} fontFamily={MONO} fontSize={15} letterSpacing={3} opacity={P(f, trapAt + 20, 8)}>
                          LADO ERRADO
                        </text>
                      ) : null}
                    </g>
                  );
                })
              : null}
          </g>
        ) : null}
      </svg>
      {/* a conclusão */}
      <div style={{ position: "absolute", left: 0, right: 0, top: f >= overAt ? 80 : 420, textAlign: "center", fontFamily: MONO, opacity: P(f, notAt, 10), transition: "none" }}>
        <div style={{ fontSize: f >= overAt ? 18 : 22, letterSpacing: 6, color: AMB }}>CONCLUSÃO DA DRA. MOSSMAN</div>
        <div style={{ fontSize: f >= overAt ? 30 : 64, letterSpacing: 6, color: CREAM }}>{f >= overAt ? "O NAVIO SOBREPÕE LUGARES" : "O BOREALIS NÃO ESTÁ VIAJANDO"}</div>
      </div>
      {f >= flickAt ? (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 70, textAlign: "center", fontFamily: MONO, fontSize: 24, letterSpacing: 5, color: f >= trapAt ? RED : CREAM, opacity: P(f, flickAt, 8) }}>
          {f >= trapAt ? "QUANDO A SOBREPOSIÇÃO TERMINA, ALGUNS FICAM PRESOS DO LADO ERRADO" : "OS FLICKERS NASCEM NA SOBREPOSIÇÃO"}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ============================================================================================ 9) é o mesmo navio
// três Borealis lado a lado (a pergunta da Alyx); a hesitação; eles se fundem num só: MESMO NAVIO. Ela olha de novo:
// rastros chegam ao navio de várias direções — ORIGEM: ? — e o que dá para afirmar fica num card.
export const HLSameShip: React.FC<{ life: number; askAt?: number; hesAt?: number; oneAt?: number; againAt?: number; originAt?: number; allAt?: number; nextAt?: number }> = ({
  life,
  askAt = 0,
  hesAt = 1e9,
  oneAt = 1e9,
  againAt = 1e9,
  originAt = 1e9,
  allAt = 1e9,
  nextAt = 1e9,
}) => {
  const f = useCurrentFrame();
  void life;
  const merge = P(f, oneAt, 20);
  const cam = (dx: number): Cam => ({ fx: 0, fy: 0, yaw: -0.7 + f * 0.0015, pitch: 0.4, dist: 170 - 40 * merge, cy: 600, cx: 960 + dx * (1 - merge), F: 1000 });
  const scan = f >= againAt && f < originAt ? ((f - againAt) * 14) % 1100 : -1;
  const trails = [
    { a: -2.6, c: ICE },
    { a: -0.4, c: AMB },
    { a: 1.9, c: "#c79bff" },
  ];
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, #0a1218 0%, #020406 75%)", overflow: "hidden" }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {[-560, 0, 560].map((dx, i) => (
          <Ship key={i} cam={cam(dx)} o={(i === 1 ? 1 : 1 - merge) * P(f, askAt + i * 4, 10)} col={ICE} />
        ))}
        {f >= hesAt && f < oneAt
          ? [-560, 0, 560].map((dx, i) => (
              <text key={i} x={960 + dx} y={330} textAnchor="middle" fill={CREAM} fontFamily={MONO} fontSize={40} opacity={Math.floor(f / 10) % 2 ? 1 : 0.3}>
                ?
              </text>
            ))
          : null}
        {scan >= 0 ? <line x1={420 + scan} x2={420 + scan} y1={200} y2={900} stroke={CREAM} strokeWidth={2} opacity={0.6} /> : null}
        {f >= originAt
          ? trails.map((t, i) => {
              const a = P(f, originAt + i * 6, 16);
              const x0 = 960 + Math.cos(t.a) * 800;
              const y0 = 560 + Math.sin(t.a) * 420;
              return (
                <g key={i} opacity={a}>
                  <path d={`M ${x0} ${y0} Q ${960 + Math.cos(t.a + 0.6) * 380} ${560 + Math.sin(t.a + 0.6) * 260} ${960} ${560}`} fill="none" stroke={t.c} strokeWidth={2.5} strokeDasharray="10 8" strokeDashoffset={-f * 2} />
                  <text x={x0 + (x0 < 960 ? 20 : -150)} y={y0 + (y0 < 560 ? 40 : -20)} fill={t.c} fontFamily={MONO} fontSize={20} letterSpacing={4}>
                    ORIGEM ?
                  </text>
                </g>
              );
            })
          : null}
      </svg>
      <div style={{ position: "absolute", left: 70, top: 56, fontFamily: MONO, color: ICE, letterSpacing: 6 }}>
        <div style={{ fontSize: 22 }}>{f >= oneAt ? "DRA. MOSSMAN · RESPOSTA" : "ALYX · PERGUNTA"}</div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 110, textAlign: "center", fontFamily: MONO }}>
        {f < oneAt ? (
          <div style={{ fontSize: 46, letterSpacing: 6, color: CREAM, opacity: P(f, askAt, 10) }}>{"EXISTEM VÁRIOS BOREALIS?"}</div>
        ) : f < allAt ? (
          <div style={{ fontSize: 56, letterSpacing: 8, color: CREAM, opacity: flickIn(f, oneAt) }}>{f >= originAt ? "DE ONDE ELE VEM?" : "NÃO. É O MESMO NAVIO."}</div>
        ) : (
          <div style={{ display: "inline-block", padding: "16px 26px", border: `1px solid ${AMB}`, background: "rgba(20,12,4,0.85)", borderRadius: 8, opacity: P(f, allAt, 8) * (1 - P(f, nextAt + 20, 12)) }}>
            <div style={{ fontSize: 22, letterSpacing: 4, color: GREEN }}>CONFIRMADO · UM SÓ NAVIO</div>
            <div style={{ fontSize: 22, letterSpacing: 4, color: RED, marginTop: 6 }}>ORIGEM · INDEFINIDA</div>
          </div>
        )}
      </div>
      {f >= nextAt ? (
        <div style={{ position: "absolute", right: 70, top: 160, fontFamily: MONO, fontSize: 24, letterSpacing: 5, color: AMB, opacity: P(f, nextAt, 10) }}>
          MAS OS DADOS PERMITEM UMA COISA →
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ============================================================================================ 10) a previsão
// o ciclo do Kleiner (pulsos curtos e a próxima janela longa marcada); com as leituras da Mossman, a região inteira do
// Ártico encolhe até um ponto no gelo, e aparece a hora. A expedição vai até lá e espera.
export const HLForecast: React.FC<{ life: number; cycleAt?: number; nextAt?: number; mossAt?: number; shrinkAt?: number; pointAt?: number; hourAt?: number; goAt?: number; waitAt?: number }> = ({
  life,
  cycleAt = 0,
  nextAt = 1e9,
  mossAt = 1e9,
  shrinkAt = 1e9,
  pointAt = 1e9,
  hourAt = 1e9,
  goAt = 1e9,
  waitAt = 1e9,
}) => {
  const f = useCurrentFrame();
  void life;
  const map = P(f, mossAt - 4, 14);
  const shrink = interpolate(f, [shrinkAt, pointAt], [1, 0.03], { ...C, easing: Easing.inOut(Easing.cubic) });
  const PT = { x: 1060, y: 470 };
  const go = interpolate(f, [goAt, waitAt], [0, 1], { ...C, easing: Easing.inOut(Easing.quad) });
  const gx = 700 + (PT.x - 700) * go;
  const gy = 820 + (PT.y - 820) * go;
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, #0a1218 0%, #020406 75%)", overflow: "hidden" }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {/* o ciclo do Kleiner */}
        <g opacity={1 - map}>
          <circle cx={960} cy={560} r={330} fill="none" stroke="rgba(126,231,135,0.35)" strokeWidth={2} />
          {Array.from({ length: 36 }).map((_, i) => {
            const a = (i / 36) * Math.PI * 2 - Math.PI / 2;
            const lit = P(f, cycleAt + i * 1.2, 4);
            return <line key={i} x1={960 + Math.cos(a) * 300} y1={560 + Math.sin(a) * 300} x2={960 + Math.cos(a) * 345} y2={560 + Math.sin(a) * 345} stroke={GREEN} strokeWidth={i % 6 === 0 ? 4 : 2} opacity={0.2 + 0.8 * lit} />;
          })}
          {f >= nextAt
            ? (() => {
                const a0 = (27 / 36) * Math.PI * 2 - Math.PI / 2;
                const a1 = (31 / 36) * Math.PI * 2 - Math.PI / 2;
                const r = 380;
                return (
                  <g opacity={P(f, nextAt, 10)}>
                    <path d={`M ${960 + Math.cos(a0) * r} ${560 + Math.sin(a0) * r} A ${r} ${r} 0 0 1 ${960 + Math.cos(a1) * r} ${560 + Math.sin(a1) * r}`} fill="none" stroke={CREAM} strokeWidth={14} />
                    <text x={960 + Math.cos((a0 + a1) / 2) * (r + 40) - 120} y={560 + Math.sin((a0 + a1) / 2) * (r + 40)} fill={CREAM} fontFamily={MONO} fontSize={20} letterSpacing={4}>
                      PRÓXIMA JANELA LONGA
                    </text>
                  </g>
                );
              })()
            : null}
          <text x={960} y={570} textAnchor="middle" fill={GREEN} fontFamily={MONO} fontSize={22} letterSpacing={5}>
            CICLO · KLEINER
          </text>
        </g>
        {/* o mapa: a região encolhe até um ponto */}
        <g opacity={map}>
          <ArcticMap f={f} />
          <ellipse cx={PT.x} cy={PT.y} rx={430 * shrink} ry={280 * shrink} fill="rgba(255,93,77,0.1)" stroke={RED} strokeWidth={2} strokeDasharray="8 6" />
          {f >= pointAt ? (
            <g opacity={P(f, pointAt, 8)}>
              <circle cx={PT.x} cy={PT.y} r={10} fill={CREAM} />
              <circle cx={PT.x} cy={PT.y} r={22 + 10 * ((f % 30) / 30)} fill="none" stroke={CREAM} strokeWidth={2} opacity={1 - (f % 30) / 30} />
              <text x={PT.x + 30} y={PT.y - 10} fill={CREAM} fontFamily={MONO} fontSize={20} letterSpacing={4}>
                PONTO NO GELO · 84°12′N
              </text>
            </g>
          ) : null}
          {f >= goAt ? (
            <g transform={`translate(${gx} ${gy})`}>
              <path d="M 0 -12 L 10 8 L -10 8 Z" fill={AMB} />
              <text x={18} y={4} fill={AMB} fontFamily={MONO} fontSize={16} letterSpacing={3}>
                EXPEDIÇÃO
              </text>
            </g>
          ) : null}
        </g>
      </svg>
      <div style={{ position: "absolute", left: 70, top: 56, fontFamily: MONO, color: map > 0.5 ? ICE : GREEN, letterSpacing: 6 }}>
        <div style={{ fontSize: 22 }}>{map > 0.5 ? "PREVISÃO · KLEINER + LEITURAS DA MOSSMAN" : "RÁDIO · DR. KLEINER"}</div>
      </div>
      {map > 0 ? (
        <div style={{ position: "absolute", right: 70, top: 150, textAlign: "right", fontFamily: MONO, opacity: map }}>
          <div style={{ fontSize: 16, letterSpacing: 5, color: RED }}>ÁREA PREVISTA</div>
          <div style={{ fontSize: 44, letterSpacing: 3, color: CREAM }}>{`${Math.max(0.4, Math.round(1200000 * shrink * shrink) / 1000).toLocaleString("pt-BR")} km²`}</div>
          {f >= hourAt ? (
            <div style={{ marginTop: 14, opacity: flickIn(f, hourAt) }}>
              <div style={{ fontSize: 16, letterSpacing: 5, color: AMB }}>HORA ESTIMADA</div>
              <div style={{ fontSize: 60, letterSpacing: 4, color: CREAM }}>04:17</div>
            </div>
          ) : null}
        </div>
      ) : null}
      {f >= waitAt ? (
        <div style={{ position: "absolute", left: 70, bottom: 80, fontFamily: MONO, fontSize: 30, letterSpacing: 8, color: AMB, opacity: P(f, waitAt, 8) }}>
          ESPERANDO<span style={{ opacity: Math.floor(f / 10) % 2 ? 1 : 0.2 }}>…</span>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ============================================================================================ 11) o Borealis aparece
// o relógio corre e nada acontece; o instante previsto; luz, portal, distorção: NADA. O gelo vazio... e no quadro
// seguinte o Borealis está lá (sem clarão: ele simplesmente está). Preso no gelo; o fantasma do gelo vazio de segundos
// atrás; a janela calculada; a câmera entra pelo casco.
export const HLBorealisArrive: React.FC<{ life: number; minAt?: number; nowAt?: number; lightAt?: number; portalAt?: number; airAt?: number; iceAt?: number; shipAt?: number; stuckAt?: number; notAt?: number; winAt?: number; enterAt?: number; skipF?: number }> = ({
  life: lifeIn,
  skipF = 0,
  minAt = 1e9,
  nowAt = 1e9,
  lightAt = 1e9,
  portalAt = 1e9,
  airAt = 1e9,
  iceAt = 1e9,
  shipAt = 1e9,
  stuckAt = 1e9,
  notAt = 1e9,
  winAt = 1e9,
  enterAt = 1e9,
}) => {
  const f = useCurrentFrame() + skipF;
  const life = lifeIn + skipF;
  const iceView = f >= iceAt;
  const ship = f >= shipAt;
  // relógio: devagar → corre (os minutos passam) → zera no instante
  const secs = f < minAt ? 180 - f / 30 : f < nowAt ? interpolate(f, [minAt, nowAt], [180 - minAt / 30, 0], C) : 0;
  const clock = `T−${String(Math.floor(secs / 60)).padStart(2, "0")}:${String(Math.floor(secs % 60)).padStart(2, "0")}`;
  const push = interpolate(f, [shipAt, enterAt], [0, 1], C);
  const enter = interpolate(f, [enterAt, life], [0, 1], { ...C, easing: Easing.in(Easing.cubic) });
  const cam: Cam = { fx: -2 + 20 * enter, fy: 0, yaw: -0.85 + 0.25 * push + f * 0.0005, pitch: 0.18 + 0.05 * push, dist: 112 - 30 * push - 70 * enter, cy: 700, F: 1100 };
  const win = 41 * 60 - Math.max(0, f - winAt) / 30;
  return (
    <AbsoluteFill style={{ background: iceView ? "linear-gradient(180deg, #0b1820 0%, #0a1419 55%, #101c22 100%)" : "radial-gradient(ellipse at 50% 50%, #0a1218 0%, #020406 75%)", overflow: "hidden" }}>
      {!iceView ? (
        <>
          <div style={{ position: "absolute", left: 0, right: 0, top: 250, textAlign: "center", fontFamily: MONO }}>
            <div style={{ fontSize: 22, letterSpacing: 8, color: GREEN }}>RELÓGIO DO BOREALIS</div>
            <div style={{ fontSize: 180, letterSpacing: 10, color: f >= nowAt ? CREAM : GREEN, textShadow: f >= nowAt ? "0 0 40px rgba(255,226,176,0.5)" : undefined }}>{clock}</div>
            {f >= minAt && f < nowAt ? <div style={{ fontSize: 22, letterSpacing: 6, color: ICE, opacity: 0.8 }}>NADA ACONTECE</div> : null}
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 660, display: "flex", justifyContent: "center", gap: 60, fontFamily: MONO }}>
            {[
              { k: "LUZ", at: lightAt },
              { k: "PORTAL", at: portalAt },
              { k: "DISTORÇÃO", at: airAt },
            ].map((r, i) => (
              <div key={i} style={{ width: 300, padding: "14px 18px", border: `1px solid ${f >= r.at ? ICE : "rgba(159,230,255,0.2)"}`, borderRadius: 8, opacity: f >= nowAt ? 1 : 0.3 }}>
                <div style={{ fontSize: 18, letterSpacing: 5, color: ICE }}>{r.k}</div>
                <svg width={264} height={30}>
                  <line x1={0} x2={264} y1={15} y2={15} stroke={ICE} strokeWidth={2} opacity={0.6} />
                </svg>
                <div style={{ fontSize: 26, letterSpacing: 4, color: CREAM, opacity: f >= r.at ? flickIn(f, r.at) : 0 }}>NADA</div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          {/* o gelo: grade em perspectiva até o horizonte */}
          {Array.from({ length: 24 }).map((_, i) => (
            <polyline key={"a" + i} points={pts(cam, [[-200, -120 + i * 10, 0], [200, -120 + i * 10, 0]])} stroke="rgba(200,230,240,0.12)" />
          ))}
          {Array.from({ length: 24 }).map((_, i) => (
            <polyline key={"b" + i} points={pts(cam, [[-200 + i * 17, -120, 0], [-200 + i * 17, 120, 0]])} stroke="rgba(200,230,240,0.12)" />
          ))}
          {/* o fantasma do gelo vazio */}
          {ship ? (
            <g opacity={f >= notAt ? 0.6 + 0.4 * Math.sin(f / 4) : 1}>
              <Ship cam={cam} col={f >= notAt && Math.floor(f / 6) % 3 === 0 ? "rgba(159,230,255,0.25)" : ICE} />
              {/* gelo acumulado no casco */}
              {Array.from({ length: 16 }).map((_, i) => {
                const x = -38 + i * 5;
                const w = hullW(x);
                return <polyline key={i} points={pts(cam, [[x - 2, -w - 2, 0], [x, -w - 0.5, 1.2 + rnd(i) * 1.5], [x + 2, -w - 2, 0]])} fill="rgba(220,240,250,0.15)" stroke="rgba(220,240,250,0.6)" strokeWidth={1} />;
              })}
            </g>
          ) : null}
          {ship ? (
            (() => {
              const a = proj(cam, -40, 0, 0);
              const b = proj(cam, 42, 0, 0);
              const t = proj(cam, -31, 0, 27);
              const x0 = Math.min(a[0], b[0], t[0]) - 30;
              const x1 = Math.max(a[0], b[0], t[0]) + 30;
              const y0 = Math.min(t[1], a[1], b[1]) - 30;
              const y1 = Math.max(a[1], b[1]) + 60;
              return (
                <g opacity={1 - enter}>
                  <Bracket x={(x0 + x1) / 2} y={(y0 + y1) / 2} w={x1 - x0} h={y1 - y0} col={CREAM} label="BOREALIS" sub={f >= stuckAt ? "CARGUEIRO · PRESO NO GELO" : undefined} />
                </g>
              );
            })()
          ) : null}
        </svg>
      )}
      {iceView && !ship ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 200, textAlign: "center", fontFamily: MONO, fontSize: 22, letterSpacing: 8, color: ICE, opacity: 0.8 }}>EXTENSÃO VAZIA DE GELO</div>
      ) : null}
      {f >= notAt && f < winAt ? (
        <div style={{ position: "absolute", left: 70, bottom: 90, fontFamily: MONO, opacity: P(f, notAt, 8) }}>
          <div style={{ fontSize: 16, letterSpacing: 5, color: RED }}>REGISTRO DE 4 SEGUNDOS ATRÁS</div>
          <div style={{ fontSize: 30, letterSpacing: 3, color: CREAM }}>ESTE PONTO ESTAVA VAZIO</div>
        </div>
      ) : null}
      {f >= winAt ? (
        <div style={{ position: "absolute", right: 70, top: 140, textAlign: "right", fontFamily: MONO, opacity: P(f, winAt, 8) * (1 - enter) }}>
          <div style={{ fontSize: 16, letterSpacing: 5, color: GREEN }}>JANELA · CÁLCULO DA MOSSMAN</div>
          <div style={{ fontSize: 60, letterSpacing: 4, color: CREAM }}>{`${String(Math.floor(win / 60)).padStart(2, "0")}:${String(Math.floor(win % 60)).padStart(2, "0")}`}</div>
          <div style={{ fontSize: 18, letterSpacing: 4, color: GREEN }}>TEMPO SUFICIENTE PARA ENTRAR</div>
        </div>
      ) : null}
      <div style={{ position: "absolute", left: 70, top: 56, fontFamily: MONO, color: ICE, letterSpacing: 6, opacity: 1 - enter }}>
        <div style={{ fontSize: 22 }}>{iceView ? "H.E.V. · PONTO PREVISTO" : "EXPEDIÇÃO · ESPERA"}</div>
      </div>
      <AbsoluteFill style={{ background: "#000", opacity: interpolate(f, [life - 26, life - 4], [0, 1], C) }} />
    </AbsoluteFill>
  );
};

// ============================================================================================ 4C · 1) a cadeia de memórias
// as memórias da Alyx acendem numa corrente, cada uma com a imagem real dela (as que existem) ou só o nome; a corrente
// para no G-Man. O intervalo: para o mundo, 3 dias (barra cheia); para ela, nada (barra vazia) até ela reaparecer na
// neve. Depois do ritual o intervalo racha e "vaza": sobem memórias que não são dela — um lugar, uma pessoa e um
// evento com data que ainda não chegou. Contador: perdidas 0 × a mais subindo.
type MNode = { label: string; at: number; clip?: { src: string; from: number } };
export const HLMemoryChain: React.FC<{ life: number; nodes?: MNode[]; whoAt?: number; stopAt?: number; worldAt?: number; alyxAt?: number; snowAt?: number; leakAt?: number; placeAt?: number; personAt?: number; futureAt?: number; oppAt?: number }> = ({
  life,
  nodes = [],
  whoAt = 1e9,
  stopAt = 1e9,
  worldAt = 1e9,
  alyxAt = 1e9,
  snowAt = 1e9,
  leakAt = 1e9,
  placeAt = 1e9,
  personAt = 1e9,
  futureAt = 1e9,
  oppAt = 1e9,
}) => {
  const f = useCurrentFrame();
  void life;
  const Y = 420;
  const X0 = 90;
  const STEP = 172;
  const CW = 156;
  const CH = 104;
  const lastX = X0 + (nodes.length - 1) * STEP + CW;
  const voidX0 = lastX + 10;
  const snowX = 1745;
  const leak = P(f, leakAt, 20);
  const extra = Math.max(0, Math.floor((f - oppAt) / 4));
  const ghosts = [
    { k: "LUGAR", v: "ONDE NUNCA ESTEVE", at: placeAt, x: 1150, sub: "COORD. DESCONHECIDAS" },
    { k: "PESSOA", v: "QUE NUNCA CONHECEU", at: personAt, x: 1400, sub: "NÃO CONSTA NA RESISTÊNCIA" },
    { k: "EVENTO", v: "QUE AINDA NÃO ACONTECEU", at: futureAt, x: 1650, sub: "DATA · DEPOIS DE HOJE" },
  ];
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, #0b141a 0%, #020406 75%)", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 70, top: 56, fontFamily: MONO, color: ICE, letterSpacing: 6 }}>
        <div style={{ fontSize: 22 }}>MEMÓRIA · ALYX VANCE</div>
        <div style={{ fontSize: 16, opacity: 0.7, marginTop: 6 }}>CONTINUIDADE</div>
      </div>
      {(() => {
        const first = nodes[0]?.at ?? 1e9;
        const o = P(f, 4, 12) * (1 - P(f, first - 8, 10));
        if (o <= 0) return null;
        return (
          <div style={{ position: "absolute", left: 0, right: 0, top: 360, textAlign: "center", fontFamily: MONO, opacity: o }}>
            <div style={{ fontSize: 52, letterSpacing: 4, color: CREAM, lineHeight: 1.3 }}>ATÉ ONDE A MEMÓRIA<br />FAZ PARTE DE QUEM A GENTE É?</div>
            {f >= whoAt ? <div style={{ marginTop: 30, fontSize: 26, letterSpacing: 6, color: ICE, opacity: P(f, whoAt, 8) }}>A ALYX LEMBRA DE QUEM ELA É</div> : null}
          </div>
        );
      })()}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {/* a linha da corrente */}
        <line opacity={f >= (nodes[0]?.at ?? 1e9) ? 0.6 : 0} x1={X0} x2={X0 + (nodes.length - 1) * STEP * Math.min(1, nodes.filter((n) => f >= n.at).length / Math.max(1, nodes.length)) + CW / 2} y1={Y + CH / 2} y2={Y + CH / 2} stroke={ICE} strokeWidth={2} />
        {/* o intervalo */}
        {f >= stopAt ? (
          <g opacity={P(f, stopAt, 10)}>
            <line x1={voidX0} x2={snowX - 10} y1={Y + CH / 2} y2={Y + CH / 2} stroke={RED} strokeWidth={3} strokeDasharray="10 8" />
            <text x={(voidX0 + snowX) / 2} y={Y + CH / 2 - 16} textAnchor="middle" fill={RED} fontFamily={MONO} fontSize={16} letterSpacing={4}>
              INTERVALO
            </text>
            {/* rachaduras e o vazamento */}
            {leak > 0
              ? Array.from({ length: 22 }).map((_, i) => {
                  const t = ((f - leakAt) * 0.012 + rnd(i * 3.3)) % 1;
                  const x = voidX0 + 20 + rnd(i * 7.1) * (snowX - voidX0 - 40);
                  return <circle key={i} cx={x + Math.sin(t * 6 + i) * 10} cy={Y + CH / 2 - t * 260} r={2 + rnd(i) * 2.5} fill="#c79bff" opacity={leak * (1 - t)} />;
                })
              : null}
            {leak > 0 ? <polyline points={Array.from({ length: 12 }).map((_, i) => `${voidX0 + i * ((snowX - voidX0) / 11)},${Y + CH / 2 + (i % 2 ? -10 : 8) * leak}`).join(" ")} fill="none" stroke="#c79bff" strokeWidth={2} opacity={leak} /> : null}
          </g>
        ) : null}
        {/* memórias que não são dela, subindo do intervalo */}
        {ghosts.map((g, i) =>
          f >= g.at ? (
            <g key={i} opacity={flickIn(f, g.at)}>
              <line x1={g.x} x2={g.x} y1={Y + CH / 2} y2={250} stroke="#c79bff" strokeWidth={1.5} strokeDasharray="4 6" opacity={0.6} />
            </g>
          ) : null,
        )}
      </svg>
      {/* os nós */}
      {nodes.map((n, i) => {
        if (f < n.at) return null;
        const a = P(f, n.at, 8);
        return (
          <div key={i} style={{ position: "absolute", left: X0 + i * STEP, top: Y, width: CW, height: CH, border: `1px solid ${f >= stopAt && i === nodes.length - 1 ? RED : ICE}`, background: "#05090c", overflow: "hidden", opacity: a, transform: `translateY(${(1 - a) * 16}px)` }}>
            {n.clip ? (
              <Sequence from={Math.round(n.at)} layout="none">
                <div style={{ position: "absolute", inset: 0, filter: "saturate(0.6) brightness(0.85)" }}>
                  <Clip src={n.clip.src} from={n.clip.from} rate={0.7} />
                </div>
              </Sequence>
            ) : null}
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "4px 8px", background: "rgba(2,4,6,0.75)", fontFamily: MONO, fontSize: 14, letterSpacing: 2, color: CREAM }}>{n.label}</div>
          </div>
        );
      })}
      {/* a neve: onde ela reaparece */}
      {f >= snowAt ? (
        <div style={{ position: "absolute", left: snowX, top: Y, width: CW - 20, height: CH, border: `1px solid ${ICE}`, background: "linear-gradient(180deg, #1a2a33, #0b1419)", fontFamily: MONO, opacity: P(f, snowAt, 8) }}>
          {Array.from({ length: 14 }).map((_, k) => (
            <div key={k} style={{ position: "absolute", left: (rnd(k * 3) * 130) % 130, top: ((rnd(k * 5) * 100 + f * (1 + rnd(k))) % 100), width: 3, height: 3, borderRadius: 2, background: "#e8f4fa" }} />
          ))}
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "4px 8px", background: "rgba(2,4,6,0.75)", fontSize: 14, letterSpacing: 2, color: CREAM }}>A NEVE</div>
        </div>
      ) : null}
      {/* para o mundo × para ela */}
      {f >= worldAt ? (
        <div style={{ position: "absolute", left: 160, top: 640, width: 1600, fontFamily: MONO }}>
          {[
            { k: "PARA TODO MUNDO", at: worldAt, fill: 1, v: "3 DIAS", c: AMB },
            { k: "PARA A ALYX", at: alyxAt, fill: 0, v: "NADA", c: ICE },
          ].map((r, i) =>
            f >= r.at ? (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 22, opacity: P(f, r.at, 8) }}>
                <div style={{ width: 300, fontSize: 20, letterSpacing: 4, color: r.c }}>{r.k}</div>
                <div style={{ flex: 1, height: 22, border: `1px solid ${r.c}`, position: "relative" }}>
                  <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${100 * r.fill * P(f, r.at, 30)}%`, background: r.c, opacity: 0.8 }} />
                </div>
                <div style={{ width: 160, fontSize: 34, letterSpacing: 3, color: CREAM }}>{r.v}</div>
              </div>
            ) : null,
          )}
        </div>
      ) : null}
      {/* os cards das memórias estranhas */}
      {ghosts.map((g, i) =>
        f >= g.at ? (
          <div key={i} style={{ position: "absolute", left: g.x - 115, top: 150, width: 230, padding: "10px 12px", border: "1px solid #c79bff", background: "rgba(20,8,30,0.85)", fontFamily: MONO, opacity: flickIn(f, g.at), transform: `translateX(${(rnd(f + i) - 0.5) * (f < g.at + 8 ? 14 : 2)}px)` }}>
            <div style={{ fontSize: 14, letterSpacing: 4, color: "#c79bff" }}>{g.k}</div>
            <div style={{ fontSize: 18, letterSpacing: 2, color: CREAM, marginTop: 4 }}>{g.v}</div>
            <div style={{ fontSize: 12, letterSpacing: 2, color: "#c79bff", opacity: 0.8, marginTop: 6 }}>{g.sub}</div>
          </div>
        ) : null,
      )}
      {f >= oppAt ? (
        <div style={{ position: "absolute", left: 160, bottom: 70, right: 160, display: "flex", justifyContent: "space-between", fontFamily: MONO, opacity: P(f, oppAt, 10) }}>
          <div>
            <div style={{ fontSize: 16, letterSpacing: 5, color: ICE }}>MEMÓRIAS PERDIDAS</div>
            <div style={{ fontSize: 56, color: CREAM }}>0</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 16, letterSpacing: 5, color: "#c79bff" }}>MEMÓRIAS QUE NÃO SÃO DELA</div>
            <div style={{ fontSize: 56, color: "#e2c9ff" }}>{`+${3 + extra}`}</div>
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ============================================================================================ 4C · 2) a pergunta muda
// um seletor de perguntas girando (cilindro): "onde ela esteve?" é riscada e gira para cima; entra "de onde vieram essas
// memórias?"; depois a principal, em vermelho: "o que o G-Man fez com ela?". Resposta: campo vazio. No fim, o Borealis
// em wireframe surge adiante e a câmera vai até ele.
export const HLQuestionShift: React.FC<{ life: number; q1At?: number; q2At?: number; q3At?: number; noAt?: number; alyxAt?: number; borAt?: number; goAt?: number; bare?: boolean }> = ({
  life,
  bare = false,
  q1At = 0,
  q2At = 1e9,
  q3At = 1e9,
  noAt = 1e9,
  alyxAt = 1e9,
  borAt = 1e9,
  goAt = 1e9,
}) => {
  const f = useCurrentFrame();
  const Q = [
    { t: "ONDE ELA ESTEVE DURANTE ESSES TRÊS DIAS?", at: q1At, c: CREAM },
    { t: "DE ONDE VIERAM ESSAS MEMÓRIAS?", at: q2At, c: "#e2c9ff" },
    { t: "O QUE O G-MAN FEZ COM ELA?", at: q3At, c: RED },
  ];
  const pos = interpolate(f, [q2At, q2At + 14, q3At, q3At + 14], [0, 1, 1, 2], { ...C, easing: Easing.inOut(Easing.cubic) });
  const bor = P(f, borAt, 20);
  const go = interpolate(f, [goAt, life], [0, 1], { ...C, easing: Easing.in(Easing.cubic) });
  const cam: Cam = { fx: 0, fy: 0, yaw: -0.6 + f * 0.002, pitch: 0.25, dist: 260 - 200 * go, cy: 620, F: 1000 };
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, #0b141a 0%, #020406 75%)", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 70, top: 56, fontFamily: MONO, color: ICE, letterSpacing: 6, opacity: bare ? 0 : 1 - bor }}>
        <div style={{ fontSize: 22 }}>A PERGUNTA</div>
      </div>
      {/* o cilindro de perguntas */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 300, height: 300, perspective: 1200, opacity: 1 - bor }}>
        {Q.map((q, i) => {
          if (f < q.at) return null;
          const d = i - pos; // 0 = de frente
          const strike = i === 0 && f >= q2At;
          return (
            <div key={i} style={{ position: "absolute", left: 0, right: 0, top: 110, textAlign: "center", fontFamily: MONO, fontSize: i === 2 ? 70 : 54, letterSpacing: 4, color: q.c, transform: `rotateX(${d * 55}deg) translateZ(160px)`, transformOrigin: "50% 50% -160px", opacity: Math.max(0, 1 - Math.abs(d) * 0.75) * P(f, q.at, 8), backfaceVisibility: "hidden" }}>
              <span style={{ textDecoration: strike ? "line-through" : undefined, textDecorationColor: RED, textDecorationThickness: 4 }}>{q.t}</span>
            </div>
          );
        })}
      </div>
      {f >= noAt ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 800, display: "flex", justifyContent: "center", gap: 60, fontFamily: MONO, opacity: P(f, noAt, 8) * (1 - bor) }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <span style={{ fontSize: 20, letterSpacing: 5, color: ICE }}>RESPOSTA</span>
            <span style={{ width: 420, height: 54, border: `1px solid ${ICE}`, display: "inline-flex", alignItems: "center", padding: "0 14px" }}>
              <span style={{ width: 16, height: 30, background: CREAM, opacity: Math.floor(f / 12) % 2 ? 1 : 0 }} />
            </span>
          </div>
          {f >= alyxAt ? <div style={{ alignSelf: "center", fontSize: 22, letterSpacing: 4, color: ICE, opacity: flickIn(f, alyxAt) }}>NEM A ALYX SABE</div> : null}
        </div>
      ) : null}
      {/* o Borealis adiante */}
      {bor > 0 ? (
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: bor }}>
          {Array.from({ length: 16 }).map((_, i) => (
            <polyline key={i} points={pts(cam, [[-300, -150 + i * 20, 0], [300, -150 + i * 20, 0]])} stroke="rgba(200,230,240,0.08)" />
          ))}
          <Ship cam={cam} col={ICE} />
          <text x={960} y={250} textAnchor="middle" fill={CREAM} fontFamily={MONO} fontSize={26} letterSpacing={10} opacity={1 - go}>
            ANTES: O BOREALIS
          </text>
        </svg>
      ) : null}
      <AbsoluteFill style={{ background: "#000", opacity: interpolate(f, [life - 10, life], [0, 1], C) }} />
    </AbsoluteFill>
  );
};

// ============================================================================================ 5A' · a hipótese: ecos no tempo
// eixo do tempo (não um mapa): o mesmo Flicker em T, T+0,4 s, T+0,8 s — mesma assinatura, momentos ligeiramente diferentes.
// Depois a pergunta muda de ONDE (riscado) para QUANDO, e os dias de cálculo dela.
export const HLEchoHypothesis: React.FC<{ life: number; wrongAt?: number; notAt?: number; sameAt?: number; momAt?: number; ifAt?: number; whereAt?: number; whenAt?: number; daysAt?: number }> = ({
  life,
  wrongAt = 0,
  notAt = 1e9,
  sameAt = 1e9,
  momAt = 1e9,
  ifAt = 1e9,
  whereAt = 1e9,
  whenAt = 1e9,
  daysAt = 1e9,
}) => {
  const f = useCurrentFrame();
  void life;
  const X0 = 220;
  const X1 = 1700;
  const Y = 560;
  const echoes = [0, 1, 2, 3];
  const spread = P(f, momAt, 30);
  const ex = (i: number) => 760 + i * 230 * spread;
  const q = P(f, ifAt, 12);
  const days = Math.min(6, Math.max(0, Math.floor((f - daysAt) / 10) + 1));
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, #0a1218 0%, #020406 75%)", overflow: "hidden" }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: 1 - 0.85 * q }}>
        <FlickDefs f={f} />
        {/* o eixo do tempo */}
        <line x1={X0} x2={X1} y1={Y + 120} y2={Y + 120} stroke="rgba(159,230,255,0.5)" strokeWidth={2} />
        <path d={`M ${X1} ${Y + 120} l -14 -8 l 0 16 Z`} fill="rgba(159,230,255,0.5)" />
        <text x={X1 - 10} y={Y + 150} textAnchor="end" fill={ICE} fontFamily={MONO} fontSize={16} letterSpacing={4}>
          TEMPO →
        </text>
        {/* "não vieram de outro lugar": o pino de outro lugar se apaga */}
        {f >= notAt ? (
          <g opacity={1 - P(f, notAt + 20, 12)}>
            <circle cx={360} cy={300} r={10} fill="none" stroke={AMB} strokeWidth={2} />
            <text x={380} y={306} fill={AMB} fontFamily={MONO} fontSize={18} letterSpacing={3}>
              OUTRO LUGAR?
            </text>
            <line x1={340} x2={590} y1={290} y2={310} stroke={RED} strokeWidth={4} opacity={P(f, notAt + 6, 6)} />
          </g>
        ) : null}
        {/* o mesmo, em momentos ligeiramente diferentes */}
        {echoes.map((i) => {
          if (f < sameAt && i > 0) return null;
          const x = ex(i);
          const o = i === 0 ? P(f, wrongAt, 10) : P(f, sameAt + i * 3, 8) * (1 - 0.18 * i);
          return (
            <g key={i}>
              <Flick f={f - i * 7} x={x} y={Y} s={0.9} o={o} seed={1} />
              <line x1={x} x2={x} y1={Y + 70} y2={Y + 120} stroke={ICE} strokeWidth={1.5} strokeDasharray="4 4" opacity={o} />
              <text x={x} y={Y + 180} textAnchor="middle" fill={i ? ICE : CREAM} fontFamily={MONO} fontSize={20} letterSpacing={2} opacity={o}>
                {i ? `T + ${(i * 0.4).toFixed(1).replace(".", ",")} s` : "T"}
              </text>
              {f >= sameAt ? (
                <text x={x} y={Y - 110} textAnchor="middle" fill={i ? "rgba(255,226,176,0.7)" : CREAM} fontFamily={MONO} fontSize={15} letterSpacing={3} opacity={o}>
                  ID 0417
                </text>
              ) : null}
            </g>
          );
        })}
        {f >= sameAt ? (
          <text x={960} y={250} textAnchor="middle" fill={CREAM} fontFamily={MONO} fontSize={30} letterSpacing={5} opacity={P(f, sameAt + 10, 10)}>
            A MESMA CRIATURA
          </text>
        ) : null}
        {f >= momAt ? (
          <text x={960} y={290} textAnchor="middle" fill={ICE} fontFamily={MONO} fontSize={20} letterSpacing={5} opacity={P(f, momAt + 10, 10)}>
            EM MOMENTOS LIGEIRAMENTE DIFERENTES
          </text>
        ) : null}
      </svg>
      {/* ONDE → QUANDO */}
      {q > 0 ? (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 10, fontFamily: MONO, opacity: q }}>
          <div style={{ fontSize: 18, letterSpacing: 6, color: AMB }}>HIPÓTESE DA DRA. MOSSMAN</div>
          <div style={{ display: "flex", gap: 70, alignItems: "baseline", marginTop: 16 }}>
            <span style={{ fontSize: 90, letterSpacing: 8, color: f >= whenAt ? "rgba(255,226,176,0.35)" : CREAM, textDecoration: f >= whenAt ? "line-through" : undefined, textDecorationColor: RED, opacity: P(f, whereAt, 8) }}>ONDE</span>
            {f >= whenAt ? <span style={{ fontSize: 130, letterSpacing: 10, color: ICE, textShadow: "0 0 40px rgba(159,230,255,0.4)", opacity: flickIn(f, whenAt) }}>QUANDO</span> : null}
          </div>
          {f >= daysAt ? <div style={{ marginTop: 30, fontSize: 24, letterSpacing: 6, color: AMB, opacity: P(f, daysAt, 8) }}>{`TENTANDO ENTENDER · DIA ${days}`}</div> : null}
        </AbsoluteFill>
      ) : null}
      <div style={{ position: "absolute", left: 70, top: 56, fontFamily: MONO, color: ICE, letterSpacing: 6 }}>
        <div style={{ fontSize: 22 }}>REGISTROS DA DRA. MOSSMAN · OS FLICKERS</div>
      </div>
    </AbsoluteFill>
  );
};

// ============================================================================================ 5B' · fora de sincronia
// (1) o registro dos sinais: um chega ANTES de ser emitido; outro evento se repete com segundos de diferença; o Flicker
// aparece em eco. (2) "não está mudando de lugar" → "saindo de sincronia com o tempo": o navio em wireframe, cada parte
// com seu próprio relógio (+4 s, −12 anos, −30 anos). (3) os Flickers: não cópias, ecos. (4) ela ainda não entende,
// mas sabe o que procurar: o filtro DEFASAGEM varre os dados.
export const HLTimeDesync: React.FC<{ life: number; logAt?: number; earlyAt?: number; repAt?: number; flickAt?: number; placeAt?: number; syncAt?: number; partsAt?: number; secAt?: number; yearAt?: number; decAt?: number; echoAt?: number; notCopyAt?: number; echoWAt?: number; dataAt?: number }> = ({
  life,
  logAt = 1e9,
  earlyAt = 1e9,
  repAt = 1e9,
  flickAt = 1e9,
  placeAt = 1e9,
  syncAt = 1e9,
  partsAt = 1e9,
  secAt = 1e9,
  yearAt = 1e9,
  decAt = 1e9,
  echoAt = 1e9,
  notCopyAt = 1e9,
  echoWAt = 1e9,
  dataAt = 1e9,
}) => {
  const f = useCurrentFrame();
  void life;
  void placeAt;
  void partsAt;
  const ph = f < syncAt ? (f < logAt ? 0 : 1) : f < echoAt ? 2 : f < dataAt ? 3 : 4;
  const cam: Cam = { fx: -4, fy: 0, yaw: -0.65 + f * 0.0016, pitch: 0.36, dist: 125, cy: 610, F: 1000 };
  // fase 0: o modelo que parecia certo (saltos num mapa)
  const pins: [number, number][] = [[700, 420], [1180, 380], [860, 760], [1260, 700]];
  const hk = Math.max(0, Math.floor(f / 20)) % pins.length;
  const rows = [
    { k: "SINAL 07", e: "04:12:09", r: "04:12:06", d: "−3 s", c: RED, at: earlyAt, note: "RECEBIDO ANTES DE SER EMITIDO" },
    { k: "EVENTO 12", e: "04:12:31", r: "04:12:31", d: "", c: ICE, at: repAt, note: "" },
    { k: "EVENTO 12", e: "04:12:31", r: "04:12:33", d: "+2,4 s", c: AMB, at: repAt + 18, note: "O MESMO EVENTO, DE NOVO" },
  ];
  const tags = [
    { x: -31, z: 24, t: "+4 SEGUNDOS", at: secAt, c: ICE },
    { x: -2, z: 13, t: "−12 ANOS", at: yearAt, c: AMB },
    { x: 30, z: 10, t: "−30 ANOS", at: decAt, c: "#c79bff" },
  ];
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, #0a1218 0%, #020406 75%)", overflow: "hidden" }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <FlickDefs f={f} />
        {ph === 0 ? (
          <g>
            <ArcticMap f={f} />
            {pins.map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r={7} fill="none" stroke={ICE} strokeWidth={2} />
            ))}
            <circle cx={pins[hk][0]} cy={pins[hk][1]} r={13} fill={CREAM} />
          </g>
        ) : null}
        {/* fase 2: o navio, cada parte num tempo */}
        {ph === 2 ? (
          <g>
            <Ship cam={cam} col={ICE} />
            {tags.map((t, i) => {
              if (f < t.at) return null;
              const p = proj(cam, t.x, 0, t.z);
              const jit = Math.floor(f / 3) % 7 === i ? (rnd(f) - 0.5) * 10 : 0;
              return (
                <g key={i} opacity={flickIn(f, t.at)}>
                  <Ship cam={{ ...cam }} col={t.c} o={0.25 + 0.15 * Math.sin(f / 4 + i)} dx={i === 0 ? 0.6 : i === 1 ? -0.8 : 1.2} />
                  <circle cx={p[0]} cy={p[1]} r={6} fill={t.c} />
                  <line x1={p[0]} y1={p[1]} x2={520 + i * 440 + jit} y2={300} stroke={t.c} strokeWidth={1.5} strokeDasharray="5 5" />
                  <rect x={520 + i * 440 - 120 + jit} y={254} width={240} height={46} fill="rgba(4,8,10,0.85)" stroke={t.c} />
                  <text x={520 + i * 440 + jit} y={285} textAnchor="middle" fill={t.c} fontFamily={MONO} fontSize={22} letterSpacing={3}>
                    {t.t}
                  </text>
                </g>
              );
            })}
          </g>
        ) : null}
        {/* fase 3: ecos, não cópias */}
        {ph === 3 ? (
          <g>
            {[0, 1, 2, 3, 4].map((i) => (
              <g key={i}>
                <Flick f={f - i * 6} x={960 - i * 150} y={560} s={1.1 - i * 0.08} o={(i === 0 ? 1 : 0.75 - i * 0.13) * P(f, echoAt + i * 3, 8)} seed={4} hot={i === 0} />
                {i > 0 ? (
                  <text x={960 - i * 150} y={700} textAnchor="middle" fill={ICE} fontFamily={MONO} fontSize={16} letterSpacing={2} opacity={P(f, echoAt + i * 3 + 6, 8)}>
                    {`ECO −${(i * 0.5).toFixed(1).replace(".", ",")} s`}
                  </text>
                ) : (
                  <text x={960} y={700} textAnchor="middle" fill={CREAM} fontFamily={MONO} fontSize={16} letterSpacing={2}>
                    AGORA
                  </text>
                )}
              </g>
            ))}
            {f >= notCopyAt ? (
              <g opacity={flickIn(f, notCopyAt)}>
                <text x={960} y={300} textAnchor="middle" fill="rgba(255,226,176,0.5)" fontFamily={MONO} fontSize={44} letterSpacing={8} textDecoration="line-through">
                  CÓPIAS
                </text>
              </g>
            ) : null}
            {f >= echoWAt ? (
              <text x={960} y={370} textAnchor="middle" fill={ICE} fontFamily={MONO} fontSize={60} letterSpacing={10} opacity={flickIn(f, echoWAt)}>
                ECOS
              </text>
            ) : null}
          </g>
        ) : null}
      </svg>
      {/* fase 1: o registro dos sinais */}
      {ph === 1 ? (
        <div style={{ position: "absolute", left: 160, top: 220, width: 1600, fontFamily: MONO }}>
          <div style={{ display: "grid", gridTemplateColumns: "220px 260px 260px 160px 1fr", fontSize: 16, letterSpacing: 4, color: ICE, opacity: 0.7, paddingBottom: 10, borderBottom: "1px solid rgba(159,230,255,0.3)" }}>
            <span>REGISTRO</span>
            <span>EMITIDO</span>
            <span>RECEBIDO</span>
            <span>Δ</span>
            <span />
          </div>
          {rows.map((r, i) =>
            f >= r.at ? (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "220px 260px 260px 160px 1fr", alignItems: "center", fontSize: 30, letterSpacing: 2, color: CREAM, padding: "18px 0", borderBottom: "1px solid rgba(159,230,255,0.12)", opacity: flickIn(f, r.at) }}>
                <span style={{ color: r.c, fontSize: 22 }}>{r.k}</span>
                <span>{r.e}</span>
                <span style={{ color: r.d ? r.c : CREAM }}>{r.r}</span>
                <span style={{ color: r.c }}>{r.d}</span>
                <span style={{ fontSize: 18, letterSpacing: 3, color: r.c }}>{r.note}</span>
              </div>
            ) : null,
          )}
          {f >= flickAt ? (
            <div style={{ marginTop: 40, display: "flex", alignItems: "center", gap: 30, opacity: P(f, flickAt, 8) }}>
              <span style={{ fontSize: 18, letterSpacing: 5, color: AMB }}>E OS FLICKERS</span>
              <svg width={600} height={150}>
                <FlickDefs f={f} />
                {[0, 1, 2].map((i) => (
                  <Flick key={i} f={f - i * 8} x={90 + i * 170} y={80} s={0.55} o={1 - i * 0.25} seed={7} />
                ))}
              </svg>
              <span style={{ fontSize: 22, letterSpacing: 4, color: CREAM }}>A MESMA SUSPEITA</span>
            </div>
          ) : null}
        </div>
      ) : null}
      {/* títulos por fase */}
      <div style={{ position: "absolute", left: 70, top: 56, fontFamily: MONO, color: ICE, letterSpacing: 6 }}>
        <div style={{ fontSize: 22 }}>{["REGISTROS · O QUE PARECIA", "REGISTROS · A NOITE DO ATAQUE", "CONCLUSÃO DA DRA. MOSSMAN", "OS FLICKERS", "DADOS DA DRA. MOSSMAN"][ph]}</div>
      </div>
      {ph === 0 ? (
        <div style={{ position: "absolute", left: 70, bottom: 80, fontFamily: MONO, fontSize: 30, letterSpacing: 3, color: CREAM }}>APARECENDO EM LUGARES DIFERENTES?</div>
      ) : null}
      {ph === 2 ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 130, textAlign: "center", fontFamily: MONO }}>
          {f < syncAt + 70 ? <div style={{ fontSize: 24, letterSpacing: 6, color: "rgba(255,226,176,0.6)", textDecoration: "line-through", textDecorationColor: RED }}>MUDANDO DE LUGAR</div> : null}
          <div style={{ fontSize: 46, letterSpacing: 6, color: CREAM, opacity: P(f, syncAt + 62, 10) }}>FORA DE SINCRONIA COM O TEMPO</div>
        </div>
      ) : null}
      {ph === 4 ? (
        <AbsoluteFill style={{ padding: "170px 140px 120px", boxSizing: "border-box", fontFamily: MONO }}>
          <div style={{ position: "relative", height: "100%", border: "1px solid rgba(159,230,255,0.3)", background: "#04080b", overflow: "hidden" }}>
            {Array.from({ length: 22 }).map((_, i) => {
              const hit = [3, 8, 13, 17].includes(i);
              const scanY = ((f - dataAt) * 9) % 760;
              const lit = hit && scanY > i * 34;
              return (
                <div key={i} style={{ position: "absolute", left: 20, right: 20, top: 14 + i * 34, height: 28, display: "flex", gap: 30, fontSize: 18, color: lit ? CREAM : "rgba(159,230,255,0.45)", background: lit ? "rgba(255,178,46,0.15)" : undefined, alignItems: "center" }}>
                  <span>{`04:${String(12 + Math.floor(i / 6)).padStart(2, "0")}:${String((i * 7) % 60).padStart(2, "0")}`}</span>
                  <span>{`SETOR ${String.fromCharCode(65 + (i % 6))}`}</span>
                  <span>{`φ ${(Math.sin(i * 1.7) * 3.2).toFixed(3)}`}</span>
                  <span style={{ color: lit ? AMB : undefined }}>{lit ? `DEFASAGEM ${["+4 s", "−12 a", "+0,8 s", "−30 a"][[3, 8, 13, 17].indexOf(i)]}` : "—"}</span>
                </div>
              );
            })}
            <div style={{ position: "absolute", left: 0, right: 0, top: ((f - dataAt) * 9) % 760, height: 2, background: AMB, boxShadow: `0 0 12px ${AMB}` }} />
          </div>
          <div style={{ position: "absolute", left: 140, top: 110, fontSize: 22, letterSpacing: 5, color: AMB }}>FILTRO · DEFASAGEM NO TEMPO</div>
          <div style={{ position: "absolute", right: 140, bottom: 60, fontSize: 18, letterSpacing: 4, color: ICE }}>COMO FUNCIONA · AINDA NÃO SE SABE</div>
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};

// ============================================================================================ 5C · ferramentas comuns
// corredor do navio em wireframe 3D (primeira pessoa, câmera andando). state: 0 destruído, 1 funcionando, 2 abandonado.
const ShipCorridor: React.FC<{ f: number; walk: number; state: number; glitch?: number; door?: number; doorCol?: string }> = ({ f, walk, state, glitch = 0, door = -1, doorCol = ICE }) => {
  const col = state === 1 ? "rgba(255,226,176,0.85)" : state === 2 ? "rgba(159,230,255,0.45)" : "rgba(159,230,255,0.7)";
  const frames = Array.from({ length: 14 }).map((_, i) => {
    const z = ((i * 3.5 - walk) % 49 + 49) % 49 + 1.5;
    return { z, k: 650 / z, i };
  });
  const jx = glitch ? (rnd(f * 3) - 0.5) * 40 * glitch : 0;
  return (
    <g transform={`translate(${jx} 0)`}>
      {frames.map(({ z, k, i }) => {
        const w = 3.2 * k;
        const h = 2.4 * k;
        const broken = state === 0 && i % 3 === 1;
        return (
          <g key={i} opacity={Math.min(1, 9 / z)}>
            {broken ? (
              <path d={`M ${960 - w / 2} ${560 + h / 2} L ${960 - w / 2} ${560 - h / 2 + h * 0.2} L ${960 - w / 4} ${560 - h / 2} M ${960 + w / 8} ${560 - h / 2} L ${960 + w / 2} ${560 - h / 2} L ${960 + w / 2} ${560 + h / 4}`} fill="none" stroke={RED} strokeWidth={Math.min(3, 0.6 + k * 0.6)} />
            ) : (
              <rect x={960 - w / 2} y={560 - h / 2} width={w} height={h} fill="none" stroke={col} strokeWidth={Math.min(3, 0.6 + k * 0.6)} />
            )}
            {state === 1 ? <rect x={960 - w * 0.2} y={560 - h / 2 + 2} width={w * 0.4} height={Math.max(1, k * 0.08)} fill="rgba(255,226,176,0.6)" /> : null}
          </g>
        );
      })}
      {[-1, 1].map((sx) => [-1, 1].map((sy) => <line key={`${sx}${sy}`} x1={960 + sx * 1300} y1={560 + sy * 980} x2={960 + sx * 20} y2={560 + sy * 15} stroke={col} strokeWidth={1.5} opacity={0.5} />))}
      {door >= 0 ? <rect x={960 - 110} y={560 - 180} width={220} height={330} fill={doorCol === GREEN ? "rgba(60,255,140,0.06)" : "rgba(4,8,10,0.6)"} stroke={doorCol} strokeWidth={3} opacity={door} /> : null}
    </g>
  );
};

// ============================================================================================ 5C · 1) entram no Borealis
export const HLBorealisEnter: React.FC<{ life: number; missAt?: number; techAt?: number; telAt?: number; workAt?: number; whatAt?: number }> = ({ life, missAt = 1e9, techAt = 1e9, telAt = 1e9, workAt = 1e9, whatAt = 1e9 }) => {
  const f = useCurrentFrame();
  void life;
  const rows = [
    { t: "CHEGAR AO NAVIO ANTES DO COMBINE", at: missAt, done: true },
    { t: "ENCONTRAR A TECNOLOGIA DA APERTURE", at: techAt },
    { t: "HIPÓTESE MOSSMAN · SISTEMAS DE TELEPORTE", at: telAt },
    { t: "ACHAR UMA PARTE QUE AINDA FUNCIONE", at: workAt },
    { t: "ENTENDER O QUE ACONTECEU AQUI", at: whatAt },
  ];
  return (
    <AbsoluteFill style={{ background: "#03070a", overflow: "hidden" }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <ShipCorridor f={f} walk={f * 0.06} state={2} />
      </svg>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,0.75) 100%)" }} />
      <div style={{ position: "absolute", left: 70, top: 56, fontFamily: MONO, color: ICE, letterSpacing: 6 }}>
        <div style={{ fontSize: 22 }}>H.E.V. · DENTRO DO BOREALIS</div>
      </div>
      <div style={{ position: "absolute", right: 70, top: 150, width: 640, padding: "18px 22px", background: "rgba(3,8,12,0.88)", border: `1px solid ${AMB}`, borderRadius: 8, fontFamily: MONO, opacity: P(f, missAt - 10, 10) }}>
        <div style={{ fontSize: 15, letterSpacing: 5, color: AMB, marginBottom: 10 }}>OBJETIVOS DA EXPEDIÇÃO</div>
        {rows.map((r, i) =>
          f >= r.at ? (
            <div key={i} style={{ display: "flex", gap: 14, alignItems: "center", fontSize: 21, letterSpacing: 2, color: CREAM, padding: "8px 0", opacity: flickIn(f, r.at) }}>
              <span style={{ width: 22, height: 22, border: `2px solid ${r.done ? GREEN : AMB}`, display: "inline-flex", alignItems: "center", justifyContent: "center", color: GREEN, fontSize: 18 }}>{r.done ? "✓" : ""}</span>
              {r.t}
            </div>
          ) : null,
        )}
      </div>
    </AbsoluteFill>
  );
};

// ============================================================================================ 5C · 2) a Alyx piora e guia
// planta dos corredores vista de cima: o grupo anda; a Alyx (azul) para como se reconhecesse o lugar; olha para a porta
// antes da porta mudar de fase; a linha do caminho aparece adiante dela; na bifurcação: rota da Mossman (labs) × a dela
// (o núcleo); a pergunta; a pausa; a frase dela.
export const HLAlyxKnows: React.FC<{ life: number; lapseAt?: number; stopAt?: number; doorAt?: number; pathAt?: number; forkAt?: number; mossAt?: number; alyxAt?: number; askAt?: number; pauseAt?: number; lineAt?: number }> = ({
  life,
  lapseAt = 0,
  stopAt = 1e9,
  doorAt = 1e9,
  pathAt = 1e9,
  forkAt = 1e9,
  mossAt = 1e9,
  alyxAt = 1e9,
  askAt = 1e9,
  pauseAt = 1e9,
  lineAt = 1e9,
}) => {
  const f = useCurrentFrame();
  void life;
  const cam: Cam = { fx: 0, fy: 2, yaw: 0.2 + f * 0.0008, pitch: 1.0, dist: 70, cy: 600 };
  // caminho: do sul até a bifurcação
  const walk = interpolate(f, [0, stopAt, stopAt + 40, forkAt], [0, 0.35, 0.35, 1], C);
  const ay = 22 - walk * 30;
  const A = proj(cam, 0, ay, 0);
  const corr: [number, number][] = [[-3, 26], [3, 26], [3, -8], [-3, -8]];
  const doorPhase = f >= doorAt + 36 ? 1 : 0;
  const door = proj(cam, 3, 4, 1.5);
  const lapses = Math.min(7, Math.max(0, 2 + Math.floor((f - lapseAt) / 150)));
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 55%, #08131a 0%, #020507 75%)", overflow: "hidden" }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {/* corredor principal + bifurcação */}
        <polygon points={pts(cam, corr.map(([x, y]) => [x, y, 0] as [number, number, number]))} fill="rgba(159,230,255,0.04)" stroke="rgba(159,230,255,0.55)" strokeWidth={2} />
        <polygon points={pts(cam, [[-3, -8, 0], [-20, -20, 0], [-16, -25, 0], [0, -13, 0]])} fill={f >= mossAt ? "rgba(255,178,46,0.07)" : "rgba(159,230,255,0.03)"} stroke={f >= mossAt ? AMB : "rgba(159,230,255,0.5)"} strokeWidth={2} />
        <polygon points={pts(cam, [[3, -8, 0], [20, -20, 0], [16, -25, 0], [0, -13, 0]])} fill={f >= alyxAt ? "rgba(159,230,255,0.08)" : "rgba(159,230,255,0.03)"} stroke={f >= alyxAt ? ICE : "rgba(159,230,255,0.5)"} strokeWidth={2} />
        {f >= mossAt ? (
          (() => {
            const p = proj(cam, -18, -24, 0);
            return (
              <text x={p[0] - 40} y={p[1] - 16} textAnchor="end" fill={AMB} fontFamily={MONO} fontSize={20} letterSpacing={3} opacity={P(f, mossAt, 8)}>
                MOSSMAN · LABS DA APERTURE
              </text>
            );
          })()
        ) : null}
        {f >= alyxAt ? (
          (() => {
            const p = proj(cam, 18, -24, 0);
            return (
              <text x={p[0] + 40} y={p[1] - 16} fill={ICE} fontFamily={MONO} fontSize={20} letterSpacing={3} opacity={P(f, alyxAt, 8)}>
                ALYX · O NÚCLEO
              </text>
            );
          })()
        ) : null}
        {/* a porta que muda de fase */}
        {f >= doorAt - 10 ? (
          <g opacity={P(f, doorAt - 10, 8)}>
            <rect x={door[0] - 10} y={door[1] - 30} width={20} height={44} fill={doorPhase ? "rgba(255,226,176,0.3)" : "none"} stroke={doorPhase ? CREAM : ICE} strokeWidth={3} />
            <line x1={A[0]} y1={A[1]} x2={door[0]} y2={door[1] - 8} stroke={ICE} strokeWidth={1.5} strokeDasharray="5 5" opacity={f < doorAt + 60 ? 1 : 0} />
            <text x={door[0] + 26} y={door[1] - 20} fill={doorPhase ? CREAM : ICE} fontFamily={MONO} fontSize={16} letterSpacing={3}>
              {doorPhase ? "PORTA · MUDOU DE FASE" : `ALYX OLHOU · T−${Math.max(0, (doorAt + 36 - f) / 30).toFixed(1).replace(".", ",")} s`}
            </text>
          </g>
        ) : null}
        {/* o caminho que ela parece saber */}
        {f >= pathAt ? <polyline points={pts(cam, [[0, ay, 0.05], [0, -8, 0.05], [10, -16, 0.05], [18, -22, 0.05]])} fill="none" stroke={ICE} strokeWidth={3} strokeDasharray="12 10" strokeDashoffset={-f * 2} opacity={P(f, pathAt, 10) * 0.8} /> : null}
        {/* o grupo */}
        {[
          [-1.4, 2.4, AMB, "GORDON"],
          [1.4, 3.2, GREEN, "λ"],
          [-0.6, 4.4, CREAM, "MOSSMAN"],
        ].map(([dx, dy, c, n], i) => {
          const p = proj(cam, dx as number, ay + (dy as number), 0);
          return (
            <g key={i}>
              <circle cx={p[0]} cy={p[1]} r={8} fill={c as string} />
              <text x={p[0] + 12} y={p[1] + 18} fill={c as string} fontFamily={MONO} fontSize={13} letterSpacing={2}>
                {n}
              </text>
            </g>
          );
        })}
        <circle cx={A[0]} cy={A[1]} r={11} fill={ICE} />
        <circle cx={A[0]} cy={A[1]} r={20 + 4 * Math.sin(f / 4)} fill="none" stroke={ICE} strokeWidth={2} opacity={0.5} />
        <text x={A[0] + 18} y={A[1] - 14} fill={ICE} fontFamily={MONO} fontSize={16} letterSpacing={3}>
          ALYX
        </text>
        {f >= stopAt && f < stopAt + 70 ? (
          <text x={A[0] + 18} y={A[1] + 30} fill={CREAM} fontFamily={MONO} fontSize={16} letterSpacing={3} opacity={flickIn(f, stopAt)}>
            PAROU · RECONHECIMENTO?
          </text>
        ) : null}
      </svg>
      <div style={{ position: "absolute", left: 70, top: 56, fontFamily: MONO, color: ICE, letterSpacing: 6 }}>
        <div style={{ fontSize: 22 }}>H.E.V. · ESCOLTA · ALYX VANCE</div>
      </div>
      <div style={{ position: "absolute", right: 70, top: 56, textAlign: "right", fontFamily: MONO }}>
        <div style={{ fontSize: 16, letterSpacing: 5, color: RED }}>LAPSOS</div>
        <div style={{ fontSize: 52, color: CREAM }}>{lapses}</div>
      </div>
      {/* a pergunta, a pausa e a resposta */}
      {f >= askAt ? (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 90, textAlign: "center", fontFamily: MONO }}>
          {f < lineAt ? (
            <>
              <div style={{ fontSize: 26, letterSpacing: 3, color: AMB, opacity: P(f, askAt, 8) }}>MOSSMAN · “COMO VOCÊ SABE DESSE NÚCLEO?”</div>
              {f >= pauseAt ? <div style={{ fontSize: 40, color: ICE, marginTop: 10, opacity: Math.floor(f / 10) % 2 ? 1 : 0.3 }}>…</div> : null}
            </>
          ) : (
            <div style={{ fontSize: 40, letterSpacing: 2, color: ICE, textShadow: "0 0 20px rgba(159,230,255,0.4)", opacity: P(f, lineAt, 8) }}>
              ALYX · “{typedS(f, lineAt, "Eu não sei. Eu só sei que a gente precisa chegar lá.")}”
            </div>
          )}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
const typedS = (f: number, at: number, s: string, cps = 1.5) => s.slice(0, Math.max(0, Math.floor((f - at) * cps)));

// ============================================================================================ 5C · 3) o objetivo muda
export const HLObjectiveShift: React.FC<{ life: number; firstAt?: number; stasisAt?: number; changeAt?: number; stillAt?: number; urgentAt?: number; coreAt?: number; whyAt?: number }> = ({
  life,
  firstAt = 0,
  stasisAt = 1e9,
  changeAt = 1e9,
  stillAt = 1e9,
  urgentAt = 1e9,
  coreAt = 1e9,
  whyAt = 1e9,
}) => {
  const f = useCurrentFrame();
  void life;
  const swap = P(f, changeAt, 20);
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, #0b141a 0%, #020406 75%)", overflow: "hidden", fontFamily: MONO }}>
      <div style={{ position: "absolute", left: 70, top: 56, color: ICE, letterSpacing: 6, fontSize: 22 }}>H.E.V. · OBJETIVOS</div>
      {/* a ficha dela: causa provável */}
      <div style={{ position: "absolute", left: 140, top: 180, width: 700, padding: "20px 24px", border: `1px solid ${ICE}`, background: "rgba(3,8,12,0.88)", borderRadius: 8, opacity: P(f, firstAt, 10) }}>
        <div style={{ fontSize: 15, letterSpacing: 5, color: ICE }}>ALYX VANCE · CAUSA PROVÁVEL DOS LAPSOS</div>
        <div style={{ fontSize: 34, letterSpacing: 2, color: f >= stasisAt + 30 ? "rgba(255,226,176,0.4)" : CREAM, marginTop: 10, textDecoration: f >= stasisAt + 30 ? "line-through" : undefined, textDecorationColor: RED }}>EFEITO DA ESTASE</div>
        {f >= stasisAt + 30 ? <div style={{ fontSize: 34, color: RED, marginTop: 6, opacity: flickIn(f, stasisAt + 30) }}>NÃO SÓ ISSO</div> : null}
      </div>
      {/* a lista de objetivos: a antiga desce, a nova sobe */}
      <div style={{ position: "absolute", left: 140, top: 470, width: 1640 }}>
        <div style={{ fontSize: 15, letterSpacing: 5, color: AMB, marginBottom: 14, opacity: P(f, changeAt - 6, 8) }}>PRIORIDADE</div>
        {[
          { t: "RESPOSTAS SOBRE A TECNOLOGIA DA APERTURE", k: 0, at: stillAt },
          { t: "O NÚCLEO · ONDE FICA", k: 1, at: coreAt },
          { t: "POR QUE A ALYX SABE QUE ELE IMPORTA", k: 2, at: whyAt },
        ].map((r) => {
          const y = r.k === 0 ? 0 + 150 * swap : (r.k - 1) * 75;
          const show = r.k === 0 ? P(f, changeAt - 6, 8) : P(f, r.at, 8);
          return (
            <div key={r.k} style={{ position: "absolute", left: 0, top: y, display: "flex", gap: 20, alignItems: "center", fontSize: r.k ? 40 : 30, letterSpacing: 3, color: r.k ? ICE : f >= stillAt ? "rgba(255,226,176,0.55)" : CREAM, opacity: show }}>
              <span style={{ width: 46, fontSize: 22, color: r.k ? RED : AMB }}>{r.k ? `0${r.k}` : swap > 0.5 ? "03" : "01"}</span>
              {r.t}
              {r.k === 0 && f >= stillAt ? <span style={{ fontSize: 16, letterSpacing: 4, color: AMB }}>· CONTINUA</span> : null}
            </div>
          );
        })}
      </div>
      {f >= urgentAt ? <div style={{ position: "absolute", right: 140, top: 470, fontSize: 18, letterSpacing: 5, color: RED, opacity: flickIn(f, urgentAt) }}>MAIS URGENTE</div> : null}
    </AbsoluteFill>
  );
};

// ============================================================================================ 5C · 4) o navio não fica no mesmo momento
// corredor destruído → a porta abre → o mesmo setor décadas antes, funcionando, gente da Aperture passando (rastros de
// contato do HEV, sem desenhar ninguém) → a mesma sala abandonada → muda de novo com o grupo dentro.
export const HLPhaseRooms: React.FC<{ life: number; momentAt?: number; corrAt?: number; doorAt?: number; pastAt?: number; staffAt?: number; abanAt?: number; againAt?: number; insideAt?: number }> = ({
  life,
  momentAt = 1e9,
  corrAt = 1e9,
  doorAt = 1e9,
  pastAt = 1e9,
  staffAt = 1e9,
  abanAt = 1e9,
  againAt = 1e9,
  insideAt = 1e9,
}) => {
  const f = useCurrentFrame();
  void life;
  void insideAt;
  const state = f >= againAt ? (Math.floor((f - againAt) / 14) % 2 ? 1 : 2) : f >= abanAt ? 2 : f >= pastAt ? 1 : 0;
  const glitch = [pastAt, abanAt, againAt].some((t) => f >= t && f < t + 8) ? 1 : 0;
  const year = state === 1 ? "−30 ANOS" : state === 2 ? "ABANDONADA · ?" : "PRESENTE";
  const door = f >= doorAt && f < pastAt ? P(f, doorAt, 6) : 0;
  return (
    <AbsoluteFill style={{ background: state === 1 ? "radial-gradient(ellipse at 50% 50%, #191307 0%, #050403 75%)" : "#03070a", overflow: "hidden" }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <ShipCorridor f={f} walk={f * 0.05} state={state} glitch={glitch} door={door} />
        {/* gente da Aperture: contatos rápidos atravessando (só no passado) */}
        {state === 1 && f >= staffAt
          ? [0, 1, 2, 3].map((i) => {
              const t = ((f - staffAt) / 50 + i * 0.27) % 1;
              const x = 300 + t * 1320;
              const y = 600 + i * 40 - 60;
              return (
                <g key={i}>
                  <line x1={x - 120} y1={y} x2={x} y2={y} stroke="rgba(255,226,176,0.35)" strokeWidth={6} strokeLinecap="round" />
                  <circle cx={x} cy={y} r={9} fill={CREAM} />
                </g>
              );
            })
          : null}
      </svg>
      <AbsoluteFill style={{ background: `rgba(255,255,255,${glitch * 0.12})` }} />
      <div style={{ position: "absolute", left: 70, top: 56, fontFamily: MONO, color: ICE, letterSpacing: 6 }}>
        <div style={{ fontSize: 22 }}>H.E.V. · SETOR C-4</div>
      </div>
      <div style={{ position: "absolute", right: 70, top: 56, textAlign: "right", fontFamily: MONO }}>
        <div style={{ fontSize: 16, letterSpacing: 5, color: AMB }}>ÉPOCA DO SETOR</div>
        <div style={{ fontSize: 46, letterSpacing: 4, color: state === 1 ? CREAM : state === 2 ? ICE : RED, opacity: f >= corrAt ? 1 : 0 }}>{year}</div>
        {state === 1 && f >= staffAt ? <div style={{ fontSize: 18, letterSpacing: 4, color: CREAM, opacity: P(f, staffAt, 8) }}>CONTATOS: FUNCIONÁRIOS DA APERTURE</div> : null}
        {f >= againAt ? <div style={{ fontSize: 18, letterSpacing: 4, color: RED, opacity: P(f, againAt + 20, 8) }}>COM O GRUPO DENTRO</div> : null}
      </div>
      {f >= momentAt && f < corrAt + 20 ? (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 110, textAlign: "center", fontFamily: MONO, fontSize: 30, letterSpacing: 6, color: CREAM, opacity: P(f, momentAt, 8) }}>O NAVIO NÃO PERMANECE NO MESMO MOMENTO</div>
      ) : null}
    </AbsoluteFill>
  );
};

// ============================================================================================ 5C · 5) os setores em épocas diferentes
export const HLSectorEras: React.FC<{ life: number; inAt?: number; syncAt?: number }> = ({ life, inAt = 0, syncAt = 1e9 }) => {
  const f = useCurrentFrame();
  void life;
  const cam: Cam = { fx: -4, fy: 0, yaw: -0.55 + f * 0.0018, pitch: 0.38, dist: 120, cy: 620, F: 1000 };
  const secs = [
    { x0: -40, x1: -22, c: ICE, y: "PRESENTE" },
    { x0: -22, x1: -4, c: AMB, y: "−30 ANOS" },
    { x0: -4, x1: 14, c: "#c79bff", y: "+20 ANOS" },
    { x0: 14, x1: 42, c: GREEN, y: "−12 ANOS" },
  ];
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, #0a1218 0%, #020406 75%)", overflow: "hidden" }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <Ship cam={cam} col="rgba(159,230,255,0.35)" o={P(f, inAt, 10)} />
        {secs.map((s, i) => {
          const on = f >= syncAt ? (Math.floor((f - syncAt) / (11 + i * 4)) % 2 ? 1 : 0.35) : P(f, inAt + i * 6, 8);
          const a = proj(cam, s.x0, -9, -2);
          const b = proj(cam, s.x1, 9, 8);
          const c = proj(cam, (s.x0 + s.x1) / 2, 0, 8);
          return (
            <g key={i} opacity={on}>
              <polygon points={pts(cam, [[s.x0, -9, 8], [s.x1, -9, 8], [s.x1, 9, 8], [s.x0, 9, 8]])} fill={s.c} fillOpacity={0.14} stroke={s.c} strokeWidth={2} />
              <text x={c[0]} y={c[1] - 60 - i * 26} textAnchor="middle" fill={s.c} fontFamily={MONO} fontSize={20} letterSpacing={3}>
                {s.y}
              </text>
              {void a}
              {void b}
            </g>
          );
        })}
      </svg>
      <div style={{ position: "absolute", left: 70, top: 56, fontFamily: MONO, color: ICE, letterSpacing: 6, fontSize: 22 }}>BOREALIS · SETORES</div>
      {f >= syncAt ? <div style={{ position: "absolute", left: 0, right: 0, bottom: 100, textAlign: "center", fontFamily: MONO, fontSize: 28, letterSpacing: 5, color: CREAM, opacity: P(f, syncAt, 8) }}>ENTRAM E SAEM DE SINCRONIA COM A PRÓPRIA HISTÓRIA</div> : null}
    </AbsoluteFill>
  );
};

// ============================================================================================ 5C · 6) isso vira mecânica
// três janelas de jogo (wireframe): passagem bloqueada × aberta 20 anos depois; parede destruída que volta; equipamento
// que só funciona em outra fase. Depois a linha de estados de um setor indo para trás e às vezes para frente.
export const HLPhaseMechanics: React.FC<{ life: number; mechAt?: number; passAt?: number; wallAt?: number; equipAt?: number; notAt?: number; backAt?: number; fwdAt?: number }> = ({
  life,
  mechAt = 0,
  passAt = 1e9,
  wallAt = 1e9,
  equipAt = 1e9,
  notAt = 1e9,
  backAt = 1e9,
  fwdAt = 1e9,
}) => {
  const f = useCurrentFrame();
  void life;
  const line = P(f, notAt, 12);
  const pos = f < backAt ? 2 : f < fwdAt ? interpolate(f, [backAt, backAt + 30], [2, 0.6], C) : interpolate(f, [fwdAt, fwdAt + 30], [0.6, 3.4], C) - (f > fwdAt + 50 ? interpolate(f, [fwdAt + 50, fwdAt + 80], [0, 1.4], C) : 0);
  const panel = (i: number, at: number, title: string, a: string, b: string, draw: (ph: number) => React.ReactNode) => {
    const ph = Math.floor((f - at - 30) / 40) % 2 === 1 && f > at + 30 ? 1 : 0;
    return (
      <div key={i} style={{ position: "absolute", left: 120 + i * 570, top: 210, width: 540, height: 470, border: `1px solid ${f >= at ? ICE : "rgba(159,230,255,0.15)"}`, background: "#04080b", opacity: (f >= at ? P(f, at, 8) : 0.25) * (1 - line), fontFamily: MONO }}>
        <svg width={540} height={360} style={{ position: "absolute", left: 0, top: 50 }}>
          {draw(ph)}
        </svg>
        <div style={{ position: "absolute", left: 14, top: 12, fontSize: 15, letterSpacing: 3, color: ICE }}>{title}</div>
        <div style={{ position: "absolute", left: 14, bottom: 14, fontSize: 18, letterSpacing: 3, color: ph ? AMB : CREAM }}>{ph ? b : a}</div>
      </div>
    );
  };
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, #0a1218 0%, #020406 75%)", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 70, top: 56, fontFamily: MONO, color: ICE, letterSpacing: 6, fontSize: 22, opacity: P(f, mechAt, 8) }}>REGRA 2 · NO JOGO</div>
      {panel(0, passAt, "PASSAGEM", "PRESENTE · BLOQUEADA", "+20 ANOS · ABERTA", (ph) => (
        <g>
          <rect x={170} y={60} width={200} height={260} fill="none" stroke={ICE} strokeWidth={3} />
          {ph ? null : Array.from({ length: 6 }).map((_, k) => <line key={k} x1={170} y1={90 + k * 40} x2={370} y2={70 + k * 44} stroke={RED} strokeWidth={6} />)}
          {ph ? <path d="M 270 320 L 270 120" stroke={AMB} strokeWidth={4} strokeDasharray="10 8" /> : null}
        </g>
      ))}
      {panel(1, wallAt, "PAREDE", "DESTRUÍDA PELO GORDON", "SETOR VOLTOU · ANTES DO DANO", (ph) => (
        <g>
          {ph ? (
            <rect x={110} y={70} width={320} height={240} fill="rgba(159,230,255,0.06)" stroke={ICE} strokeWidth={3} />
          ) : (
            <>
              <path d="M 110 310 L 110 70 L 220 70 L 200 150 L 250 200 L 230 310 Z" fill="none" stroke={ICE} strokeWidth={3} />
              <path d="M 330 70 L 430 70 L 430 310 L 320 310 L 340 220 L 300 160 Z" fill="none" stroke={ICE} strokeWidth={3} />
              {Array.from({ length: 10 }).map((_, k) => <rect key={k} x={230 + rnd(k) * 90} y={240 + rnd(k * 3) * 60} width={12} height={10} fill={RED} opacity={0.7} />)}
            </>
          )}
        </g>
      ))}
      {panel(2, equipAt, "EQUIPAMENTO", "PRESENTE · NÃO EXISTE MAIS", "OUTRA FASE · FUNCIONANDO", (ph) => (
        <g>
          <rect x={180} y={110} width={180} height={190} fill="none" stroke={ph ? AMB : "rgba(159,230,255,0.25)"} strokeWidth={3} strokeDasharray={ph ? undefined : "8 8"} />
          {ph ? <circle cx={270} cy={170} r={34 + 6 * Math.sin(f / 4)} fill="none" stroke={AMB} strokeWidth={3} /> : null}
          {ph ? <rect x={210} y={240} width={120} height={14} fill={GREEN} opacity={0.6 + 0.4 * Math.sin(f / 3)} /> : null}
        </g>
      ))}
      {/* a linha de estados */}
      {line > 0 ? (
        <div style={{ position: "absolute", left: 160, right: 160, top: 400, fontFamily: MONO, opacity: line }}>
          <div style={{ fontSize: 22, letterSpacing: 5, color: "rgba(255,226,176,0.6)", textAlign: "center", textDecoration: "line-through", textDecorationColor: RED, marginBottom: 50 }}>SE REGENERANDO</div>
          <div style={{ position: "relative", height: 4, background: "rgba(159,230,255,0.4)" }}>
            {["ANTES DO DANO", "DANO", "PRESENTE", "DEPOIS"].map((t, i) => (
              <div key={i} style={{ position: "absolute", left: `${(i / 3) * 100}%`, top: -8, transform: "translateX(-50%)", textAlign: "center" }}>
                <div style={{ width: 20, height: 20, borderRadius: 10, border: `2px solid ${ICE}`, background: "#04080b", margin: "0 auto" }} />
                <div style={{ marginTop: 14, fontSize: 18, letterSpacing: 3, color: ICE, whiteSpace: "nowrap" }}>{t}</div>
              </div>
            ))}
            <div style={{ position: "absolute", left: `${(Math.max(0, Math.min(3, pos)) / 3) * 100}%`, top: -22, width: 4, height: 48, background: CREAM, boxShadow: `0 0 14px ${CREAM}`, transform: "translateX(-2px)" }} />
          </div>
          <div style={{ marginTop: 90, textAlign: "center", fontSize: 30, letterSpacing: 4, color: CREAM }}>O MESMO LUGAR, EM OUTRO MOMENTO DA PRÓPRIA HISTÓRIA</div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ============================================================================================ 5C · 7) uma porta que abre para Xen
export const HLXenDoor: React.FC<{ life: number; strangeAt?: number; doorAt?: number; xenAt?: number; plantAt?: number; critAt?: number; goneAt?: number; noAt?: number }> = ({
  life,
  strangeAt = 0,
  doorAt = 1e9,
  xenAt = 1e9,
  plantAt = 1e9,
  critAt = 1e9,
  goneAt = 1e9,
  noAt = 1e9,
}) => {
  const f = useCurrentFrame();
  void life;
  void strangeAt;
  const open = f >= xenAt && f < goneAt ? 1 : 0;
  const grow = P(f, plantAt, 30) * (1 - P(f, goneAt, 10));
  return (
    <AbsoluteFill style={{ background: "#03070a", overflow: "hidden" }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <FlickDefs f={f} />
        <ShipCorridor f={f} walk={f * 0.03} state={2} door={f >= doorAt ? 1 : 0} doorCol={open ? GREEN : ICE} />
        {open ? (
          <g>
            <rect x={850} y={380} width={220} height={330} fill="rgba(40,10,60,0.6)" />
            {Array.from({ length: 9 }).map((_, i) => (
              <circle key={i} cx={870 + rnd(i * 2.2) * 180} cy={400 + rnd(i * 5.1) * 290} r={3 + rnd(i) * 6} fill="#d4ff6a" opacity={0.6 + 0.4 * Math.sin(f / 5 + i)} />
            ))}
          </g>
        ) : null}
        {/* a vegetação de Xen invadindo o corredor (tentáculos que crescem a partir da porta) */}
        {grow > 0
          ? Array.from({ length: 14 }).map((_, i) => {
              const a = -Math.PI / 2 + (i / 13 - 0.5) * 2.6;
              const L = (160 + rnd(i * 3.3) * 420) * grow;
              const x0 = 960 + Math.cos(a) * 60;
              const y0 = 700;
              const cx1 = x0 + Math.cos(a) * L * 0.5 + Math.sin(f / 20 + i) * 30;
              const cy1 = y0 + 40 + (i % 2 ? 1 : -1) * 30;
              const x1 = x0 + Math.cos(a) * L * 1.4;
              const y1 = y0 + 120 + rnd(i) * 220 * grow;
              return <path key={i} d={`M ${x0} ${y0} Q ${cx1} ${cy1} ${x1} ${y1}`} fill="none" stroke={i % 3 ? "#7fd36a" : "#c79bff"} strokeWidth={3 + rnd(i) * 4} strokeLinecap="round" opacity={0.8} />;
            })
          : null}
        {/* criaturas atravessando: contatos que cruzam a tela */}
        {f >= critAt && f < goneAt
          ? [0, 1].map((i) => {
              const t = Math.min(1, (f - critAt - i * 10) / 50);
              if (t < 0) return null;
              return <Flick key={i} f={f} x={980 - 200 + t * (i ? -700 : 900)} y={640 + i * 60} s={0.9} seed={i + 9} />;
            })
          : null}
      </svg>
      <AbsoluteFill style={{ background: `rgba(160,255,120,${f >= goneAt && f < goneAt + 6 ? 0.15 : 0})` }} />
      <div style={{ position: "absolute", left: 70, top: 56, fontFamily: MONO, color: ICE, letterSpacing: 6, fontSize: 22 }}>H.E.V. · SETOR D-1</div>
      <div style={{ position: "absolute", right: 70, top: 56, textAlign: "right", fontFamily: MONO }}>
        <div style={{ fontSize: 16, letterSpacing: 5, color: open ? GREEN : AMB }}>DO OUTRO LADO DA PORTA</div>
        <div style={{ fontSize: 46, letterSpacing: 4, color: open ? "#d4ff6a" : CREAM }}>{open ? "XEN" : f >= goneAt ? "NAVIO · DE NOVO" : "UMA ÉPOCA DO NAVIO"}</div>
      </div>
      {f >= noAt ? (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 90, display: "flex", justifyContent: "center", gap: 60, fontFamily: MONO, fontSize: 26, letterSpacing: 4, opacity: P(f, noAt, 8) }}>
          <span style={{ color: AMB }}>MOSSMAN · ?</span>
          <span style={{ color: ICE }}>ALYX · ?</span>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ============================================================================================ 5C · 8) o rádio do Kleiner
export const HLRadioDesync: React.FC<{ life: number; radioAt?: number; okAt?: number; outAt?: number; lateAt?: number; repAt?: number; orderAt?: number; lostAt?: number }> = ({
  life,
  radioAt = 0,
  okAt = 1e9,
  outAt = 1e9,
  lateAt = 1e9,
  repAt = 1e9,
  orderAt = 1e9,
  lostAt = 1e9,
}) => {
  const f = useCurrentFrame();
  void life;
  const synced = f < outAt;
  const lost = f >= lostAt;
  const lines = [
    { n: 1, t: "Gordon, está me ouvindo?", at: okAt, delay: 0 },
    { n: 2, t: "…o setor à frente parece estável…", at: lateAt, delay: 2.6 },
    { n: 2, t: "…o setor à frente parece estável…", at: repAt, delay: 3.1, rep: true },
    { n: 4, t: "…não confiem nas portas…", at: orderAt, delay: 1.2, ord: true },
    { n: 3, t: "…Alyx, cuidado com…", at: orderAt + 12, delay: 4.4, ord: true },
  ];
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, #0a1410 0%, #020504 75%)", overflow: "hidden", fontFamily: MONO }}>
      <div style={{ position: "absolute", left: 70, top: 56, color: GREEN, letterSpacing: 6, fontSize: 22, opacity: P(f, radioAt, 8) }}>RÁDIO · DR. KLEINER</div>
      <div style={{ position: "absolute", right: 70, top: 56, textAlign: "right" }}>
        <div style={{ fontSize: 16, letterSpacing: 5, color: lost ? RED : synced ? GREEN : AMB }}>SINCRONIA DA REGIÃO</div>
        <div style={{ fontSize: 46, letterSpacing: 4, color: lost ? RED : synced ? GREEN : AMB }}>{lost ? "SEM SINAL" : synced ? "ALINHADO" : "FORA"}</div>
      </div>
      <svg width={1920} height={260} style={{ position: "absolute", left: 0, top: 170 }}>
        <polyline points={Array.from({ length: 160 }).map((_, i) => `${100 + i * 11},${130 + (lost ? 0 : (synced ? 40 : 70) * Math.sin(i * 0.5 + f / 3) * rnd(i + Math.floor(f / (synced ? 2 : 1))) * (synced || rnd(i * 3 + f) > 0.4 ? 1 : 0))}`).join(" ")} fill="none" stroke={lost ? RED : synced ? GREEN : AMB} strokeWidth={2.5} />
        {!synced && !lost ? <polyline points={Array.from({ length: 160 }).map((_, i) => `${100 + i * 11 + 60},${130 + 50 * Math.sin(i * 0.5 + (f - 20) / 3) * rnd(i + Math.floor((f - 20) / 1))}`).join(" ")} fill="none" stroke={AMB} strokeWidth={1.5} opacity={0.4} /> : null}
      </svg>
      <div style={{ position: "absolute", left: 160, top: 470, width: 1600 }}>
        <div style={{ fontSize: 15, letterSpacing: 5, color: GREEN, opacity: 0.7, marginBottom: 12 }}>TRANSCRIÇÃO · ORDEM DE CHEGADA</div>
        {lines.map((l, i) =>
          f >= l.at && !lost ? (
            <div key={i} style={{ display: "flex", gap: 24, alignItems: "baseline", padding: "10px 0", borderBottom: "1px solid rgba(141,255,168,0.12)", opacity: flickIn(f, l.at) }}>
              <span style={{ width: 70, fontSize: 18, color: l.ord ? RED : GREEN }}>{`#${l.n}`}</span>
              <span style={{ flex: 1, fontSize: 30, letterSpacing: 1, color: CREAM }}>{l.t}</span>
              <span style={{ width: 300, fontSize: 18, letterSpacing: 3, color: l.rep || l.ord ? RED : l.delay ? AMB : GREEN }}>{l.rep ? "REPETIDA" : l.ord ? "FORA DE ORDEM" : l.delay ? `ATRASO +${l.delay.toFixed(1).replace(".", ",")} s` : "AO VIVO"}</span>
            </div>
          ) : null,
        )}
        {lost ? <div style={{ fontSize: 40, letterSpacing: 8, color: RED, textAlign: "center", marginTop: 40, opacity: flickIn(f, lostAt) }}>…</div> : null}
      </div>
    </AbsoluteFill>
  );
};

// ============================================================================================ 5C · 9) ela reconhece o navio
export const HLAlyxRecognizes: React.FC<{ life: number; guideAt?: number; stopAt?: number; chooseAt?: number; forgetAt?: number; recAt?: number; nearAt?: number; strongAt?: number }> = ({
  life,
  guideAt = 0,
  stopAt = 1e9,
  chooseAt = 1e9,
  forgetAt = 1e9,
  recAt = 1e9,
  nearAt = 1e9,
  strongAt = 1e9,
}) => {
  const f = useCurrentFrame();
  const cam: Cam = { fx: 0, fy: 0, yaw: 0.3 + f * 0.0012, pitch: 1.0, dist: 80, cy: 560 };
  // labirinto de corredores
  const segs: [number, number, number, number][] = [[-24, 18, -24, 4], [-24, 4, -8, 4], [-8, 4, -8, -10], [-8, -10, 8, -10], [8, -10, 8, 2], [8, -10, 22, -10], [22, -10, 22, -22], [-8, 4, 6, 14], [-24, 4, -30, -6]];
  const route: [number, number][] = [[-24, 18], [-24, 4], [-8, 4], [-8, -10], [8, -10], [22, -10], [22, -22]];
  const prog = interpolate(f, [guideAt, life - 20], [0, 1], C);
  const hold = f >= stopAt && f < stopAt + 25 ? 1 : 0;
  const L = route.length - 1;
  const t = Math.min(0.999, prog) * L;
  const k = Math.floor(t);
  const u = hold ? 0 : t - k;
  const ax = route[k][0] + (route[k + 1][0] - route[k][0]) * u;
  const ay = route[k][1] + (route[k + 1][1] - route[k][1]) * u;
  const A = proj(cam, ax, ay, 0);
  const rec = interpolate(f, [recAt, strongAt + 40], [0.15, 1], C);
  const dist = Math.max(0, Math.round(interpolate(f, [nearAt, life], [420, 40], C)));
  const goal = proj(cam, 22, -22, 0);
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 55%, #08131a 0%, #020507 75%)", overflow: "hidden" }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {segs.map(([x0, y0, x1, y1], i) => (
          <polyline key={i} points={pts(cam, [[x0, y0, 0], [x1, y1, 0]])} stroke="rgba(159,230,255,0.4)" strokeWidth={22} strokeLinecap="square" opacity={0.35} />
        ))}
        {segs.map(([x0, y0, x1, y1], i) => (
          <polyline key={"l" + i} points={pts(cam, [[x0, y0, 0], [x1, y1, 0]])} stroke="rgba(159,230,255,0.6)" strokeWidth={1.5} />
        ))}
        {/* o setor antigo da Aperture */}
        <g opacity={P(f, nearAt, 10)}>
          <circle cx={goal[0]} cy={goal[1]} r={30 + 14 * rec * Math.sin(f / 4)} fill="none" stroke={AMB} strokeWidth={2} />
          <text x={goal[0] + 40} y={goal[1] + 6} fill={AMB} fontFamily={MONO} fontSize={18} letterSpacing={3}>
            APERTURE · PARTES ANTIGAS
          </text>
        </g>
        {/* rastro do grupo e a Alyx na frente */}
        <circle cx={A[0]} cy={A[1]} r={11} fill={ICE} />
        <circle cx={A[0]} cy={A[1]} r={22 + 10 * rec * Math.abs(Math.sin(f / 6))} fill="none" stroke={ICE} strokeWidth={2} opacity={0.6} />
        <text x={A[0] + 18} y={A[1] - 14} fill={ICE} fontFamily={MONO} fontSize={16} letterSpacing={3}>
          ALYX · GUIANDO
        </text>
        {f >= stopAt && f < stopAt + 30 ? (
          <text x={A[0] + 18} y={A[1] + 26} fill={CREAM} fontFamily={MONO} fontSize={15} letterSpacing={3}>
            PAROU
          </text>
        ) : null}
        {f >= forgetAt && f < forgetAt + 50 ? (
          <text x={A[0] + 18} y={A[1] + 26} fill={RED} fontFamily={MONO} fontSize={15} letterSpacing={3} opacity={flickIn(f, forgetAt)}>
            POR QUE ESSE CAMINHO? · NÃO SABE
          </text>
        ) : null}
        {f >= chooseAt && f < forgetAt
          ? (() => {
              const p = proj(cam, 8, 2, 0);
              return <line x1={A[0]} y1={A[1]} x2={p[0]} y2={p[1]} stroke={RED} strokeWidth={2} strokeDasharray="5 5" />;
            })()
          : null}
      </svg>
      <div style={{ position: "absolute", left: 70, top: 56, fontFamily: MONO, color: ICE, letterSpacing: 6, fontSize: 22 }}>H.E.V. · ESCOLTA · ALYX VANCE</div>
      <div style={{ position: "absolute", right: 70, top: 150, width: 460, fontFamily: MONO, opacity: P(f, recAt, 10) }}>
        <div style={{ fontSize: 16, letterSpacing: 5, color: ICE }}>RECONHECIMENTO DO NAVIO</div>
        <div style={{ height: 20, border: `1px solid ${ICE}`, marginTop: 10, position: "relative" }}>
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${rec * 100}%`, background: rec > 0.8 ? RED : ICE }} />
        </div>
        {f >= nearAt ? <div style={{ marginTop: 16, fontSize: 18, letterSpacing: 4, color: AMB }}>{`DISTÂNCIA DAS PARTES ANTIGAS · ${dist} m`}</div> : null}
      </div>
    </AbsoluteFill>
  );
};

// ============================================================================================ 5D · 1) o protótipo da IA
// terminal da Aperture com a óptica (o "olho" de interface: anel e ponto), acordando no navio quebrado; ela acha que
// os testes continuam; câmara de testes antiga em wireframe; os protocolos dão erro.
export const HLGladosProto: React.FC<{ life: number; findAt?: number; aiAt?: number; gladAt?: number; testAt?: number; chamberAt?: number; protoAt?: number; brokeAt?: number }> = ({
  life,
  findAt = 0,
  aiAt = 1e9,
  gladAt = 1e9,
  testAt = 1e9,
  chamberAt = 1e9,
  protoAt = 1e9,
  brokeAt = 1e9,
}) => {
  const f = useCurrentFrame();
  void life;
  const eye = P(f, aiAt, 20);
  const chamber = P(f, chamberAt, 16);
  const cam: Cam = { fx: 0, fy: 0, yaw: -0.5 + f * 0.002, pitch: 0.45, dist: 60, cx: 1350, cy: 600, F: 900 };
  const box = (x0: number, y0: number, z0: number, s: number, h = s): [number, number, number][][] => {
    const b: [number, number, number][] = [[x0, y0, z0], [x0 + s, y0, z0], [x0 + s, y0 + s, z0], [x0, y0 + s, z0], [x0, y0, z0]];
    return [b, b.map((p) => [p[0], p[1], z0 + h] as [number, number, number]), ...b.slice(0, 4).map((p) => [p, [p[0], p[1], z0 + h]] as [number, number, number][])];
  };
  const log = [
    { t: "TESTE 07 · INICIAR", at: testAt, c: CREAM },
    { t: "TESTE 07 · INDIVÍDUO: GORDON F.", at: testAt + 20, c: CREAM },
    { t: "PROTOCOLO 12 · ABRIR PORTAL", at: protoAt, c: AMB },
    { t: "ERRO · CÂMARA INEXISTENTE", at: protoAt + 16, c: RED },
    { t: "PROTOCOLO 13 · REINICIAR TESTE", at: brokeAt, c: AMB },
    { t: "ERRO · ERRO · ERRO", at: brokeAt + 14, c: RED },
  ];
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 30% 50%, #0f1113 0%, #030405 75%)", overflow: "hidden", fontFamily: MONO }}>
      <div style={{ position: "absolute", left: 70, top: 56, color: ICE, letterSpacing: 6, fontSize: 22 }}>H.E.V. · SETOR APERTURE · EQUIPAMENTO ANTIGO</div>
      {/* a óptica */}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <g transform="translate(480 470)" opacity={P(f, findAt, 12)}>
          <circle r={190} fill="none" stroke="rgba(220,220,225,0.5)" strokeWidth={3} />
          <circle r={150} fill="none" stroke="rgba(220,220,225,0.35)" strokeWidth={14} strokeDasharray="30 12" transform={`rotate(${f * 0.4})`} />
          <circle r={70 * eye} fill="none" stroke="#ffcf6a" strokeWidth={3} opacity={eye} />
          <circle r={26 * eye} fill="#ffcf6a" opacity={eye * (0.7 + 0.3 * Math.sin(f / 7))} style={{ filter: "drop-shadow(0 0 18px #ffb000)" }} />
          {f >= brokeAt ? <circle r={26} fill={RED} opacity={Math.floor(f / 5) % 2 ? 0.8 : 0} /> : null}
        </g>
        {/* câmara de testes */}
        <g opacity={chamber}>
          {box(-10, -10, 0, 20, 12).map((p, i) => (
            <polyline key={i} points={pts(cam, p)} fill="none" stroke="rgba(235,235,240,0.75)" strokeWidth={1.6} />
          ))}
          {Array.from({ length: 5 }).map((_, i) => (
            <polyline key={"g" + i} points={pts(cam, [[-10 + i * 5, -10, 0], [-10 + i * 5, 10, 0]])} stroke="rgba(235,235,240,0.25)" />
          ))}
          {box(-2, -2, 0, 4, 4).map((p, i) => (
            <polyline key={"c" + i} points={pts(cam, p)} fill="none" stroke={AMB} strokeWidth={2} />
          ))}
          {(() => {
            const p = proj(cam, 10, -4, 6);
            return <ellipse cx={p[0]} cy={p[1]} rx={18} ry={34} fill="none" stroke={f >= protoAt + 16 ? RED : "#5fb8ff"} strokeWidth={4} opacity={0.4 + 0.6 * Math.abs(Math.sin(f / 6))} />;
          })()}
        </g>
      </svg>
      <div style={{ position: "absolute", left: 230, top: 720, width: 520, textAlign: "center", opacity: P(f, aiAt, 10) }}>
        <div style={{ fontSize: 16, letterSpacing: 5, color: "#ffcf6a" }}>SISTEMA EXPERIMENTAL DE IA</div>
        <div style={{ fontSize: 26, letterSpacing: 3, color: CREAM, marginTop: 6 }}>APERTURE SCIENCE · PROTÓTIPO</div>
        {f >= gladAt ? <div style={{ fontSize: 18, letterSpacing: 4, color: AMB, marginTop: 8, opacity: P(f, gladAt, 8) }}>VERSÃO PRIMITIVA DA GLaDOS</div> : null}
      </div>
      <div style={{ position: "absolute", left: 1000, top: 820, width: 800 }}>
        {log.map((l, i) =>
          f >= l.at ? (
            <div key={i} style={{ fontSize: 20, letterSpacing: 2, color: l.c, opacity: flickIn(f, l.at), marginTop: 4 }}>
              {"> " + l.t}
            </div>
          ) : null,
        )}
      </div>
    </AbsoluteFill>
  );
};

// ============================================================================================ 5D · 2) os arquivos do Cave Johnson
export const HLCaveFiles: React.FC<{ life: number; filesAt?: number; caveAt?: number; firstAt?: number; infoAt?: number; projAt?: number; imgAt?: number; dataAt?: number; combAt?: number; beforeAt?: number; notInvAt?: number; futAt?: number; caveDidAt?: number; copyAt?: number }> = ({
  life,
  filesAt = 0,
  caveAt = 1e9,
  firstAt = 1e9,
  infoAt = 1e9,
  projAt = 1e9,
  imgAt = 1e9,
  dataAt = 1e9,
  combAt = 1e9,
  beforeAt = 1e9,
  notInvAt = 1e9,
  futAt = 1e9,
  caveDidAt = 1e9,
  copyAt = 1e9,
}) => {
  const f = useCurrentFrame();
  void life;
  void filesAt;
  void firstAt;
  const tl = P(f, beforeAt, 14);
  const copy = interpolate(f, [copyAt, copyAt + 26], [0, 100], C);
  const docs = [
    { k: "PROJETOS", at: projAt },
    { k: "IMAGENS", at: imgAt },
    { k: "DADOS", at: dataAt },
  ];
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, #121008 0%, #040302 75%)", overflow: "hidden", fontFamily: MONO }}>
      <div style={{ position: "absolute", left: 70, top: 56, color: AMB, letterSpacing: 6, fontSize: 22 }}>ARQUIVOS DO SISTEMA · APERTURE</div>
      {/* a gravação */}
      {f >= caveAt ? (
        <div style={{ position: "absolute", left: 140, top: 150, width: 760, padding: "16px 20px", border: `1px solid ${AMB}`, background: "rgba(14,10,4,0.85)", borderRadius: 8, opacity: P(f, caveAt, 8) * (1 - tl * 0.6) }}>
          <div style={{ fontSize: 15, letterSpacing: 5, color: AMB }}>GRAVAÇÃO · CAVE JOHNSON · TESTES COM O BOREALIS</div>
          <svg width={720} height={70} style={{ display: "block", marginTop: 10 }}>
            {Array.from({ length: 90 }).map((_, i) => {
              const h = 4 + 56 * Math.abs(Math.sin(i * 0.37 + f * 0.4)) * rnd(i + Math.floor(f / 2));
              return <rect key={i} x={i * 8} y={35 - h / 2} width={4} height={h} fill={AMB} opacity={0.8} />;
            })}
          </svg>
          {f >= infoAt ? <div style={{ fontSize: 20, letterSpacing: 2, color: CREAM, marginTop: 8, opacity: P(f, infoAt, 8) }}>INFORMAÇÃO QUE NÃO PODERIA EXISTIR NAQUELA ÉPOCA</div> : null}
        </div>
      ) : null}
      {/* documentos: a tecnologia que o jogador reconhece */}
      <div style={{ position: "absolute", left: 140, top: 400, display: "flex", gap: 30, opacity: 1 - tl }}>
        {docs.map((d, i) =>
          f >= d.at ? (
            <div key={i} style={{ width: 300, height: 260, border: `1px solid ${f >= combAt ? RED : AMB}`, background: "#0b0905", position: "relative", opacity: flickIn(f, d.at), transform: `rotate(${(i - 1) * 2}deg)` }}>
              <svg width={300} height={220} style={{ position: "absolute", top: 30 }}>
                {i === 0 ? (
                  <g stroke={f >= combAt ? RED : ICE} strokeWidth={2} fill="none">
                    <path d="M 150 20 L 190 200 L 110 200 Z" />
                    <path d="M 120 160 L 180 160 M 130 120 L 170 120 M 140 80 L 160 80" />
                  </g>
                ) : i === 1 ? (
                  <g stroke={f >= combAt ? RED : ICE} strokeWidth={2} fill="none">
                    <rect x={50} y={40} width={200} height={140} />
                    <path d="M 60 170 L 120 90 L 160 130 L 200 70 L 240 170" />
                  </g>
                ) : (
                  <g fill={f >= combAt ? RED : ICE}>
                    {Array.from({ length: 8 }).map((_, k) => (
                      <rect key={k} x={40} y={30 + k * 20} width={60 + rnd(k) * 160} height={8} opacity={0.7} />
                    ))}
                  </g>
                )}
              </svg>
              <div style={{ position: "absolute", left: 10, top: 8, fontSize: 15, letterSpacing: 4, color: AMB }}>{d.k}</div>
            </div>
          ) : null,
        )}
      </div>
      {f >= combAt ? (
        <div style={{ position: "absolute", left: 1150, top: 470, padding: "10px 22px", border: `3px solid ${RED}`, color: RED, fontSize: 40, letterSpacing: 6, transform: `rotate(-6deg) scale(${1 + (1 - P(f, combAt, 6)) * 0.5})`, opacity: P(f, combAt, 6) * (1 - tl) }}>TECNOLOGIA COMBINE</div>
      ) : null}
      {/* linha do tempo: gravação antes da invasão; a informação veio do futuro */}
      {tl > 0 ? (
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: tl }}>
          <line x1={160} x2={1760} y1={640} y2={640} stroke="rgba(255,226,176,0.5)" strokeWidth={2} />
          {[
            { x: 420, t: "GRAVAÇÃO · CAVE JOHNSON", c: AMB },
            { x: 1060, t: "INVASÃO DA TERRA", c: RED },
            { x: 1580, t: "TECNOLOGIA COMBINE NA TERRA", c: "#c79bff" },
          ].map((p, i) => (
            <g key={i} opacity={P(f, beforeAt + i * 6, 8)}>
              <circle cx={p.x} cy={640} r={10} fill={p.c} />
              <text x={p.x} y={i === 1 ? 690 : 600} textAnchor="middle" fill={p.c} fontFamily={MONO} fontSize={18} letterSpacing={3}>
                {p.t}
              </text>
            </g>
          ))}
          {f >= futAt ? <path d={`M 1580 620 C 1300 ${400 - 60 * Math.sin(f / 8)} 700 ${400 + 30 * Math.sin(f / 9)} 430 620`} fill="none" stroke="#c79bff" strokeWidth={4} strokeDasharray="14 10" strokeDashoffset={f * 3} opacity={P(f, futAt, 10)} /> : null}
          {f >= futAt ? (
            <text x={1000} y={400} textAnchor="middle" fill="#e2c9ff" fontFamily={MONO} fontSize={24} letterSpacing={5} opacity={P(f, futAt + 8, 10)}>
              O BOREALIS TROUXE A INFORMAÇÃO DO FUTURO
            </text>
          ) : null}
          {f >= notInvAt ? (
            <text x={420} y={760} textAnchor="middle" fill={CREAM} fontFamily={MONO} fontSize={20} letterSpacing={3} opacity={P(f, notInvAt, 8)}>
              A APERTURE NÃO INVENTOU
            </text>
          ) : null}
        </svg>
      ) : null}
      {f >= caveDidAt ? (
        <div style={{ position: "absolute", left: 160, bottom: 90, width: 700, opacity: P(f, caveDidAt, 8) }}>
          <div style={{ fontSize: 18, letterSpacing: 5, color: AMB }}>ORDEM DE CAVE JOHNSON</div>
          <div style={{ fontSize: 34, letterSpacing: 3, color: CREAM, marginTop: 6 }}>COPIAR TUDO</div>
          <div style={{ height: 14, border: `1px solid ${AMB}`, marginTop: 10, position: "relative" }}>
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${copy}%`, background: AMB }} />
          </div>
          <div style={{ fontSize: 16, color: AMB, marginTop: 6 }}>{`${Math.round(copy)}%`}</div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ============================================================================================ 5D · 3) a arquitetura parecida
export const HLArchMatch: React.FC<{ life: number; portalAt?: number; techAt?: number; alignAt?: number; whyAt?: number }> = ({ life, portalAt = 0, techAt = 1e9, alignAt = 1e9, whyAt = 1e9 }) => {
  const f = useCurrentFrame();
  void life;
  const slide = P(f, alignAt, 24);
  const shape = (col: string, k: number) => (
    <g stroke={col} strokeWidth={2.5} fill="none">
      <rect x={-150} y={-160} width={300} height={320} />
      {Array.from({ length: 6 }).map((_, i) => (
        <line key={i} x1={-150} x2={150} y1={-160 + i * 64} y2={-160 + i * 64 + (k ? 18 : 0)} opacity={0.6} />
      ))}
      <path d={k ? "M -90 160 L -60 -100 L 60 -100 L 90 160" : "M -80 160 L -60 -90 L 60 -90 L 80 160"} />
      <circle cx={0} cy={-30} r={k ? 46 : 42} />
    </g>
  );
  const ax = 620 + 340 * slide;
  const bx = 1300 - 340 * slide;
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, #0a1218 0%, #020406 75%)", overflow: "hidden", fontFamily: MONO }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <g transform={`translate(${ax} 540)`} opacity={P(f, portalAt, 10)}>
          {shape("rgba(235,235,240,0.85)", 0)}
        </g>
        <g transform={`translate(${bx} 540)`} opacity={P(f, techAt, 10)}>
          {shape(RED, 1)}
        </g>
      </svg>
      <div style={{ position: "absolute", left: 470 + 340 * slide, top: 200, width: 300, textAlign: "center", fontSize: 20, letterSpacing: 5, color: CREAM, opacity: P(f, portalAt, 10) * (1 - slide) }}>APERTURE · PORTAL</div>
      <div style={{ position: "absolute", left: 1150 - 340 * slide, top: 200, width: 300, textAlign: "center", fontSize: 20, letterSpacing: 5, color: RED, opacity: P(f, techAt, 10) * (1 - slide) }}>COMBINE</div>
      {f >= alignAt ? <div style={{ position: "absolute", left: 0, right: 0, top: 170, textAlign: "center", fontSize: 26, letterSpacing: 6, color: CREAM, opacity: P(f, alignAt + 20, 10) }}>COMPATIBILIDADE DE PROJETO · 93%</div> : null}
      {f >= whyAt ? <div style={{ position: "absolute", left: 0, right: 0, bottom: 110, textAlign: "center", fontSize: 40, letterSpacing: 6, color: AMB, opacity: P(f, whyAt, 10) }}>A RESPOSTA DO PORQUÊ</div> : null}
    </AbsoluteFill>
  );
};

// ============================================================================================ 5D · 4) as anotações do futuro
export const HLFutureNotes: React.FC<{ life: number; strangeAt?: number; calcAt?: number; routeAt?: number; handAt?: number; sheAt?: number; mossAt?: number; avoidAt?: number }> = ({
  life,
  strangeAt = 0,
  calcAt = 1e9,
  routeAt = 1e9,
  handAt = 1e9,
  sheAt = 1e9,
  mossAt = 1e9,
  avoidAt = 1e9,
}) => {
  const f = useCurrentFrame();
  void life;
  void strangeAt;
  const paper = "linear-gradient(170deg, #e9e2cf, #d6cab0)";
  const match = interpolate(f, [handAt, handAt + 40], [0, 94], C);
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, #121008 0%, #040302 75%)", overflow: "hidden", fontFamily: MONO }}>
      <div style={{ position: "absolute", left: 70, top: 56, color: AMB, letterSpacing: 6, fontSize: 22 }}>ENCONTRADO NO NAVIO</div>
      {f >= calcAt ? (
        <div style={{ position: "absolute", left: 160, top: 170, width: 640, height: 430, background: paper, borderRadius: 6, transform: "rotate(-3deg)", boxShadow: "0 30px 80px rgba(0,0,0,0.6)", opacity: P(f, calcAt, 10), fontFamily: HANDZ, color: "#1c2a6e", padding: 30, boxSizing: "border-box" }}>
          <div style={{ fontSize: 30 }}>T₀ = janela 3 · Δφ = 0,0417</div>
          <div style={{ fontSize: 30, marginTop: 14 }}>∫ fase(t) dt → setor C ~ 4,2 s</div>
          <div style={{ fontSize: 30, marginTop: 14 }}>se casco atrasar: −12 a</div>
          <div style={{ fontSize: 34, marginTop: 24, color: "#b3121b" }}>
            data: <span style={{ background: "#b3121b", color: "transparent" }}>12/03/20··</span> (DEPOIS)
          </div>
        </div>
      ) : null}
      {f >= routeAt ? (
        <div style={{ position: "absolute", left: 860, top: 210, width: 560, height: 400, background: paper, borderRadius: 6, transform: "rotate(4deg)", boxShadow: "0 30px 80px rgba(0,0,0,0.6)", opacity: P(f, routeAt, 10) }}>
          <svg width={560} height={400}>
            <path d="M 60 340 L 60 200 L 220 200 L 220 90 L 420 90 L 420 260 L 500 260" fill="none" stroke="#1c2a6e" strokeWidth={4} strokeDasharray="12 8" />
            <circle cx={500} cy={260} r={18} fill="none" stroke="#b3121b" strokeWidth={4} />
            <text x={300} y={60} fontFamily={HANDZ} fontSize={28} fill="#1c2a6e">
              rota → núcleo
            </text>
          </svg>
        </div>
      ) : null}
      {f >= handAt ? (
        <div style={{ position: "absolute", left: 1460, top: 250, width: 360, padding: "16px 18px", border: `1px solid ${ICE}`, background: "rgba(3,8,12,0.9)", borderRadius: 8, opacity: P(f, handAt, 8) }}>
          <div style={{ fontSize: 15, letterSpacing: 4, color: ICE }}>CALIGRAFIA</div>
          <div style={{ fontSize: 18, color: CREAM, marginTop: 6 }}>COMPARADA COM: ALYX VANCE</div>
          <div style={{ fontSize: 60, color: match > 90 ? RED : ICE, marginTop: 6 }}>{`${Math.round(match)}%`}</div>
        </div>
      ) : null}
      <div style={{ position: "absolute", left: 160, bottom: 80, display: "flex", gap: 40 }}>
        {[
          { k: "ELA PERCEBE", at: sheAt, c: ICE },
          { k: "A MOSSMAN TAMBÉM", at: mossAt, c: CREAM },
          { k: "A ALYX EVITA O ASSUNTO", at: avoidAt, c: RED },
        ].map((t, i) =>
          f >= t.at ? (
            <div key={i} style={{ padding: "10px 18px", border: `1px solid ${t.c}`, color: t.c, fontSize: 22, letterSpacing: 3, opacity: flickIn(f, t.at) }}>
              {t.k}
            </div>
          ) : null,
        )}
      </div>
    </AbsoluteFill>
  );
};

// ============================================================================================ 5D · 5) os lapsos o tempo inteiro
export const HLLapseLoop: React.FC<{ life: number; allAt?: number; doorAt?: number; beforeAt?: number; phraseAt?: number; stopAt?: number; memAt?: number }> = ({ life, allAt = 0, doorAt = 1e9, beforeAt = 1e9, phraseAt = 1e9, stopAt = 1e9, memAt = 1e9 }) => {
  const f = useCurrentFrame();
  void life;
  const n = Math.min(40, 12 + Math.max(0, Math.floor((f - allAt) / 40)));
  const cut = f >= stopAt;
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, #0b141a 0%, #020406 75%)", overflow: "hidden", fontFamily: MONO }}>
      <div style={{ position: "absolute", left: 70, top: 56, color: ICE, letterSpacing: 6, fontSize: 22 }}>H.E.V. · ESCOLTA · ALYX VANCE</div>
      <div style={{ position: "absolute", right: 70, top: 56, textAlign: "right" }}>
        <div style={{ fontSize: 16, letterSpacing: 5, color: RED }}>LAPSOS</div>
        <div style={{ fontSize: 60, color: CREAM }}>{n}</div>
      </div>
      {/* a porta: ela sabe antes */}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: P(f, doorAt, 10) * (1 - P(f, phraseAt - 4, 10)) }}>
        <rect x={860} y={300} width={200} height={340} fill={f >= beforeAt + 30 ? "rgba(255,226,176,0.15)" : "none"} stroke={f >= beforeAt + 30 ? CREAM : ICE} strokeWidth={3} />
        <line x1={500} y1={560} x2={860} y2={470} stroke={ICE} strokeWidth={2} strokeDasharray="6 6" opacity={f >= beforeAt ? 1 : 0} />
        <circle cx={500} cy={560} r={14} fill={ICE} />
        <text x={500} y={610} textAnchor="middle" fill={ICE} fontFamily={MONO} fontSize={18} letterSpacing={3}>
          ALYX
        </text>
        <text x={1090} y={470} fill={f >= beforeAt + 30 ? CREAM : ICE} fontFamily={MONO} fontSize={20} letterSpacing={3}>
          {f >= beforeAt + 30 ? "ABRIU" : f >= beforeAt ? `ELA OLHOU · T−${Math.max(0, (beforeAt + 30 - f) / 30).toFixed(1).replace(".", ",")} s` : ""}
        </text>
      </svg>
      {/* a frase que para no meio: a onda da voz dela corta seco */}
      {f >= phraseAt ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 380, textAlign: "center", opacity: P(f, phraseAt, 8) }}>
          <div style={{ fontSize: 16, letterSpacing: 5, color: ICE }}>ÁUDIO CAPTADO · ALYX</div>
          <svg width={1100} height={160} style={{ display: "block", margin: "16px auto 0" }}>
            {Array.from({ length: 120 }).map((_, i) => {
              const tx = phraseAt + i * 0.5;
              const live = f >= tx && (!cut || tx < stopAt);
              const h = live ? 10 + 110 * Math.abs(Math.sin(i * 0.45)) * rnd(i * 3.1) : 2;
              return <rect key={i} x={i * 9} y={80 - h / 2} width={5} height={h} fill={live ? ICE : "rgba(159,230,255,0.2)"} />;
            })}
          </svg>
          {cut ? <div style={{ fontSize: 34, letterSpacing: 6, color: RED, marginTop: 14, opacity: flickIn(f, stopAt) }}>FRASE INTERROMPIDA</div> : null}
          {f >= memAt ? <div style={{ fontSize: 20, letterSpacing: 4, color: "#c79bff", marginTop: 16, opacity: P(f, memAt, 8) }}>COMO SE LEMBRASSE DE ALGO QUE AINDA NÃO ACONTECEU</div> : null}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ============================================================================================ 5D · 6) o grande salto
// o navio inteiro treme (wireframe tremendo), corredores somem, portas trocam de lugar, o rádio vira ruído; o medidor de
// fase sai da escala; uma força puxa o navio; o SALTO (o quadro estica e some). Depois o corredor e, no fundo, passa uma
// maleta (a dele) — sem desenhar ninguém.
export const HLBigJump: React.FC<{ life: number; shakeAt?: number; corrAt?: number; doorsAt?: number; radioAt?: number; notAt?: number; pullAt?: number; jumpAt?: number; seeAt?: number; caseAt?: number; whoAt?: number }> = ({
  life,
  shakeAt = 0,
  corrAt = 1e9,
  doorsAt = 1e9,
  radioAt = 1e9,
  notAt = 1e9,
  pullAt = 1e9,
  jumpAt = 1e9,
  seeAt = 1e9,
  caseAt = 1e9,
  whoAt = 1e9,
}) => {
  const f = useCurrentFrame();
  void life;
  const after = f >= seeAt;
  const sh = f >= shakeAt && f < jumpAt + 10 ? 6 + 14 * P(f, pullAt, 30) : 0;
  const cam: Cam = { fx: -4 + (rnd(f) - 0.5) * sh * 0.1, fy: 0, yaw: -0.6 + (rnd(f + 3) - 0.5) * sh * 0.004, pitch: 0.36, dist: 130 - 40 * P(f, pullAt, 40), cy: 620, F: 1000 };
  const jump = interpolate(f, [jumpAt, jumpAt + 14], [0, 1], C);
  const phase = Math.min(1, interpolate(f, [shakeAt, notAt], [0.4, 1.4], C));
  if (after) {
    const t = interpolate(f, [caseAt, caseAt + 50], [0, 1], C);
    return (
      <AbsoluteFill style={{ background: "#03070a", overflow: "hidden" }}>
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          <ShipCorridor f={f} walk={f * 0.04} state={2} />
          {/* a maleta passando no fundo do corredor */}
          {f >= caseAt ? (
            <g transform={`translate(${880 + t * 160} 600)`} opacity={t > 0 && t < 1 ? 1 : 0}>
              <rect x={-16} y={-10} width={32} height={22} fill="none" stroke={CREAM} strokeWidth={2} />
              <path d="M -6 -10 L -6 -15 L 6 -15 L 6 -10" fill="none" stroke={CREAM} strokeWidth={2} />
            </g>
          ) : null}
          {f >= caseAt + 8 ? <Bracket x={880 + Math.min(1, t) * 160} y={598} w={70} h={56} col={RED} o={t < 1 ? 1 : 1 - P(f, caseAt + 50, 10)} label="?" /> : null}
        </svg>
        <div style={{ position: "absolute", left: 70, top: 56, fontFamily: MONO, color: ICE, letterSpacing: 6, fontSize: 22 }}>H.E.V. · DEPOIS DO SALTO</div>
        {f >= whoAt ? <div style={{ position: "absolute", left: 0, right: 0, bottom: 110, textAlign: "center", fontFamily: MONO, fontSize: 24, letterSpacing: 6, color: CREAM, opacity: P(f, whoAt, 10) }}>TERNO · MALETA</div> : null}
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, #0a1218 0%, #020406 75%)", overflow: "hidden" }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, transform: `scaleX(${1 + jump * 3}) scaleY(${1 - jump * 0.9})`, opacity: 1 - jump }}>
        <Ship cam={cam} col={f >= notAt ? RED : ICE} />
        {/* corredores somem */}
        {f >= corrAt
          ? Array.from({ length: 6 }).map((_, i) => {
              const p = proj(cam, -30 + i * 12, 0, 8);
              const on = Math.floor((f + i * 7) / 9) % 3 !== 0;
              return <rect key={i} x={p[0] - 30} y={p[1] - 6} width={60} height={12} fill={on ? "rgba(159,230,255,0.25)" : "none"} stroke={on ? ICE : "rgba(159,230,255,0.15)"} />;
            })
          : null}
        {/* portas trocam de lugar */}
        {f >= doorsAt
          ? [0, 1, 2].map((i) => {
              const slot = (i + Math.floor((f - doorsAt) / 12)) % 3;
              const p = proj(cam, -20 + slot * 18, -8, 4);
              return <rect key={i} x={p[0] - 8} y={p[1] - 16} width={16} height={28} fill="none" stroke={AMB} strokeWidth={2.5} />;
            })
          : null}
        {/* a força que puxa */}
        {f >= pullAt
          ? Array.from({ length: 8 }).map((_, i) => {
              const y = 380 + i * 50;
              const x0 = 1900 - ((f * 22 + i * 140) % 700);
              return <line key={i} x1={x0} y1={y} x2={x0 + 160} y2={y} stroke="#c79bff" strokeWidth={2} opacity={0.6} />;
            })
          : null}
      </svg>
      <AbsoluteFill style={{ background: "#ffffff", opacity: interpolate(f, [jumpAt + 8, jumpAt + 12, jumpAt + 30], [0, 0.9, 0], C) }} />
      <div style={{ position: "absolute", left: 70, top: 56, fontFamily: MONO, color: f >= notAt ? RED : ICE, letterSpacing: 6, fontSize: 22 }}>BOREALIS · MUDANÇA DE FASE</div>
      {/* medidor de fase */}
      <div style={{ position: "absolute", right: 70, top: 150, width: 380, fontFamily: MONO, opacity: 1 - jump }}>
        <div style={{ fontSize: 15, letterSpacing: 4, color: ICE }}>AMPLITUDE DA FASE</div>
        <div style={{ height: 22, border: `1px solid ${ICE}`, marginTop: 8, position: "relative", overflow: "visible" }}>
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${Math.min(100, phase * 100)}%`, background: phase > 0.9 ? RED : ICE }} />
          <div style={{ position: "absolute", left: "70%", top: -6, bottom: -6, width: 2, background: CREAM }} />
        </div>
        <div style={{ fontSize: 16, letterSpacing: 3, color: f >= notAt ? RED : CREAM, marginTop: 8 }}>{f >= notAt ? "FORA DA ESCALA · NÃO É UMA MUDANÇA NORMAL" : "LIMITE NORMAL ▏"}</div>
        {f >= radioAt ? <div style={{ fontSize: 16, letterSpacing: 3, color: RED, marginTop: 8, opacity: flickIn(f, radioAt) }}>RÁDIO · KLEINER: SÓ RUÍDO</div> : null}
      </div>
      {f >= jumpAt - 20 && f < jumpAt + 6 ? <div style={{ position: "absolute", left: 0, right: 0, top: 480, textAlign: "center", fontFamily: MONO, fontSize: 70, letterSpacing: 16, color: CREAM, opacity: P(f, jumpAt - 20, 8) }}>O GRANDE SALTO</div> : null}
    </AbsoluteFill>
  );
};

// ============================================================================================ 5D · 7) depois do salto
export const HLAfterJump: React.FC<{ life: number; darkAt?: number; backAt?: number; kneelAt?: number; breathAt?: number; upAt?: number; okAt?: number; changedAt?: number }> = ({
  life,
  darkAt = 0,
  backAt = 1e9,
  kneelAt = 1e9,
  breathAt = 1e9,
  upAt = 1e9,
  okAt = 1e9,
  changedAt = 1e9,
}) => {
  const f = useCurrentFrame();
  void life;
  void darkAt;
  const on = f >= backAt;
  const status = f >= upAt ? "DE PÉ" : f >= kneelAt ? "DE JOELHOS NO CHÃO" : "—";
  const changed = f >= changedAt;
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden", fontFamily: MONO }}>
      {!on ? (
        <div style={{ position: "absolute", left: 70, bottom: 70, fontSize: 16, letterSpacing: 4, color: "rgba(159,230,255,0.4)" }}>H.E.V. · SEM SINAL</div>
      ) : (
        <>
          <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, #0b141a 0%, #020406 75%)", opacity: P(f, backAt, 12) }} />
          <div style={{ position: "absolute", left: 70, top: 56, color: ICE, letterSpacing: 6, fontSize: 22, opacity: flickIn(f, backAt) }}>H.E.V. · REINICIANDO · ESCOLTA</div>
          <div style={{ position: "absolute", left: 460, top: 260, width: 1000, padding: "24px 28px", border: `1px solid ${changed ? "#c79bff" : ICE}`, background: "rgba(3,8,12,0.9)", borderRadius: 10, opacity: P(f, kneelAt - 4, 10) }}>
            <div style={{ fontSize: 16, letterSpacing: 5, color: ICE }}>ALYX VANCE</div>
            <div style={{ fontSize: 48, letterSpacing: 3, color: CREAM, marginTop: 8 }}>{status}</div>
            <div style={{ marginTop: 18 }}>
              <Ecg f={f} bpm={f >= breathAt ? 68 : 120} jitter={changed ? 0 : 0.6} col={changed ? "#c79bff" : ICE} w={940} h={90} />
            </div>
            {f >= breathAt ? <div style={{ fontSize: 20, letterSpacing: 4, color: ICE, marginTop: 8, opacity: P(f, breathAt, 8) }}>RESPIRAÇÃO · DESACELERANDO</div> : null}
            {f >= okAt ? <div style={{ fontSize: 26, letterSpacing: 4, color: CREAM, marginTop: 14, opacity: P(f, okAt, 8) }}>DIZ QUE ESTÁ BEM</div> : null}
          </div>
          {changed ? <div style={{ position: "absolute", left: 0, right: 0, bottom: 110, textAlign: "center", fontSize: 30, letterSpacing: 8, color: "#e2c9ff", opacity: P(f, changedAt + 10, 10) }}>ALGUMA COISA MUDOU NELA</div> : null}
        </>
      )}
    </AbsoluteFill>
  );
};

// ============================================================================================ 6 · 1) a Alyx "melhor"
export const HLAlyxBetter: React.FC<{ life: number; betterAt?: number; headAt?: number; phraseAt?: number; solvedAt?: number; notAt?: number; answerAt?: number; corrAt?: number; crabAt?: number; insecAt?: number; actAt?: number; gameAt?: number }> = ({
  life,
  betterAt = 0,
  headAt = 1e9,
  phraseAt = 1e9,
  solvedAt = 1e9,
  notAt = 1e9,
  answerAt = 1e9,
  corrAt = 1e9,
  crabAt = 1e9,
  insecAt = 1e9,
  actAt = 1e9,
  gameAt = 1e9,
}) => {
  const f = useCurrentFrame();
  void life;
  void betterAt;
  const wrong = f >= notAt;
  const ph = f < notAt ? 0 : f < insecAt ? 1 : 2;
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, #0b141a 0%, #020406 75%)", overflow: "hidden", fontFamily: MONO }}>
      <div style={{ position: "absolute", left: 70, top: 56, color: ICE, letterSpacing: 6, fontSize: 22 }}>H.E.V. · ALYX VANCE · DEPOIS DO SALTO</div>
      {ph === 0 ? (
        <div style={{ position: "absolute", left: 420, top: 220, width: 1080 }}>
          {[
            { k: "DORES DE CABEÇA", v: "0", at: headAt },
            { k: "FRASES INTERROMPIDAS", v: "0", at: phraseAt },
            { k: "LAPSOS", v: "0", at: phraseAt + 12 },
          ].map((r, i) =>
            f >= r.at ? (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "18px 22px", borderBottom: "1px solid rgba(141,255,168,0.2)", opacity: flickIn(f, r.at) }}>
                <span style={{ fontSize: 28, letterSpacing: 3, color: CREAM }}>{r.k}</span>
                <span style={{ fontSize: 34, color: GREEN }}>{r.v}</span>
              </div>
            ) : null,
          )}
          {f >= solvedAt ? <div style={{ marginTop: 30, fontSize: 34, letterSpacing: 5, color: GREEN, textAlign: "center", opacity: P(f, solvedAt, 10) }}>ESTADO · RESOLVIDO?</div> : null}
        </div>
      ) : null}
      {ph === 1 ? (
        <div style={{ position: "absolute", left: 160, right: 160, top: 180 }}>
          <div style={{ fontSize: 30, letterSpacing: 6, color: RED, textAlign: "center", opacity: P(f, notAt, 8) }}>NÃO FOI ISSO</div>
          {/* respostas antes da pergunta terminar */}
          {f >= answerAt ? (
            <div style={{ marginTop: 50, opacity: P(f, answerAt, 8) }}>
              <div style={{ fontSize: 16, letterSpacing: 5, color: CREAM }}>MOSSMAN · FALANDO</div>
              <div style={{ height: 22, marginTop: 8, position: "relative", background: "rgba(255,226,176,0.1)" }}>
                <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${Math.min(100, (f - answerAt) * 2.2)}%`, background: "rgba(255,226,176,0.6)" }} />
              </div>
              <div style={{ fontSize: 16, letterSpacing: 5, color: ICE, marginTop: 16 }}>ALYX · RESPONDENDO</div>
              <div style={{ height: 22, marginTop: 8, position: "relative", background: "rgba(159,230,255,0.1)" }}>
                <div style={{ position: "absolute", left: "38%", top: 0, bottom: 0, width: `${Math.max(0, Math.min(62, (f - answerAt - 20) * 2.2))}%`, background: ICE }} />
              </div>
              <div style={{ fontSize: 18, letterSpacing: 4, color: RED, marginTop: 8 }}>ELA RESPONDE ANTES DA PERGUNTA TERMINAR</div>
            </div>
          ) : null}
          <div style={{ display: "flex", gap: 40, marginTop: 50 }}>
            {f >= corrAt ? (
              <div style={{ flex: 1, padding: "16px 20px", border: `1px solid ${ICE}`, opacity: flickIn(f, corrAt) }}>
                <div style={{ fontSize: 15, letterSpacing: 4, color: ICE }}>CORREDOR B · MUDANÇA DE FASE</div>
                <div style={{ fontSize: 26, color: CREAM, marginTop: 6 }}>ALYX AVISOU 2,1 s ANTES</div>
              </div>
            ) : null}
            {f >= crabAt ? (
              <div style={{ flex: 1, padding: "16px 20px", border: `1px solid ${AMB}`, opacity: flickIn(f, crabAt) }}>
                <div style={{ fontSize: 15, letterSpacing: 4, color: AMB }}>COMBATE · HEADCRAB</div>
                <div style={{ fontSize: 26, color: CREAM, marginTop: 6 }}>ABATIDO 0,4 s ANTES DO SALTO</div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
      {ph === 2 ? (
        <div style={{ position: "absolute", left: 160, right: 160, top: 260, textAlign: "center" }}>
          <div style={{ fontSize: 18, letterSpacing: 5, color: ICE }}>INSEGURANÇA</div>
          <div style={{ height: 24, border: `1px solid ${ICE}`, margin: "12px auto 0", width: 900, position: "relative" }}>
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${100 * (1 - P(f, insecAt, 40))}%`, background: ICE }} />
          </div>
          {f >= actAt ? <div style={{ marginTop: 50, fontSize: 40, letterSpacing: 4, color: CREAM, opacity: P(f, actAt, 8) }}>AGE COMO SE JÁ CONHECESSE O NAVIO</div> : null}
          {f >= gameAt ? <div style={{ marginTop: 30, fontSize: 22, letterSpacing: 5, color: "#c79bff", opacity: P(f, gameAt, 8) }}>O JOGO NÃO EXPLICA · SÓ DEIXA PERCEBER</div> : null}
        </div>
      ) : null}
      {wrong ? null : null}
    </AbsoluteFill>
  );
};

// ============================================================================================ 6 · 2) a base Combine dentro do casco
export const HLCombineBase: React.FC<{ life: number; baseAt?: number; hullAt?: number; logAt?: number; longAt?: number; forceAt?: number; failAt?: number }> = ({ life, baseAt = 0, hullAt = 1e9, logAt = 1e9, longAt = 1e9, forceAt = 1e9, failAt = 1e9 }) => {
  const f = useCurrentFrame();
  void life;
  const cam: Cam = { fx: -4, fy: 0, yaw: -0.55 + f * 0.0016, pitch: 0.38, dist: 115, cy: 640, F: 1000 };
  const prog = Math.min(87, interpolate(f, [forceAt, forceAt + 50], [0, 87], C));
  const comb: [number, number, number][][] = [
    [[-12, -5, 0], [8, -5, 0], [10, 0, 0], [8, 5, 0], [-12, 5, 0], [-14, 0, 0], [-12, -5, 0]],
    [[-12, -5, 6], [8, -5, 6], [10, 0, 6], [8, 5, 6], [-12, 5, 6], [-14, 0, 6], [-12, -5, 6]],
    [[-2, 0, 6], [-2, 0, 14], [2, 0, 18]],
  ];
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, #0a1218 0%, #020406 75%)", overflow: "hidden", fontFamily: MONO }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <Ship cam={cam} col="rgba(159,230,255,0.4)" />
        <g opacity={P(f, hullAt, 12)}>
          {comb.map((c, i) => (
            <polyline key={i} points={pts(cam, c)} fill={i === 0 ? "rgba(255,93,77,0.12)" : "none"} stroke={RED} strokeWidth={2.5} />
          ))}
          {[[-12, -5], [8, -5], [8, 5], [-12, 5]].map(([x, y], i) => (
            <polyline key={"v" + i} points={pts(cam, [[x, y, 0], [x, y, 6]])} stroke={RED} strokeWidth={2} />
          ))}
        </g>
      </svg>
      <div style={{ position: "absolute", left: 70, top: 56, color: RED, letterSpacing: 6, fontSize: 22, opacity: P(f, baseAt, 8) }}>INSTALAÇÃO COMBINE · PRESA EM UMA FASE</div>
      {f >= hullAt ? <div style={{ position: "absolute", left: 70, top: 96, color: CREAM, letterSpacing: 4, fontSize: 18, opacity: P(f, hullAt, 8) }}>BASE INTEIRA DENTRO DO CASCO</div> : null}
      {f >= logAt ? (
        <div style={{ position: "absolute", right: 70, top: 150, width: 520, padding: "16px 20px", border: `1px solid ${RED}`, background: "rgba(14,4,4,0.85)", borderRadius: 8, opacity: P(f, logAt, 8) }}>
          <div style={{ fontSize: 15, letterSpacing: 4, color: RED }}>REGISTROS COMBINE · BOREALIS</div>
          {f >= longAt ? <div style={{ fontSize: 22, color: CREAM, marginTop: 10, opacity: P(f, longAt, 8) }}>ESTUDO INICIADO · MUITO ANTES DO ESPERADO</div> : null}
          {f >= forceAt ? (
            <div style={{ marginTop: 16, opacity: P(f, forceAt, 8) }}>
              <div style={{ fontSize: 16, letterSpacing: 3, color: CREAM }}>FORÇAR O NAVIO ATÉ O ESTADO ALVO</div>
              <div style={{ height: 16, border: `1px solid ${RED}`, marginTop: 8, position: "relative" }}>
                <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${prog}%`, background: RED }} />
              </div>
              <div style={{ fontSize: 18, color: f >= failAt ? RED : CREAM, marginTop: 6 }}>{f >= failAt ? `${Math.round(prog)}% · PROCESSO INCOMPLETO` : `${Math.round(prog)}%`}</div>
            </div>
          ) : null}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ============================================================================================ 6 · 3) o Breen
// um compartimento (cápsula) em wireframe, um "corpo" que nunca terminou: só a estrutura de suporte vazia com a barra de
// construção parada; a consciência dele é um sinal de fala fraco num monitor. Sem rosto, sem corpo desenhado.
export const HLBreenPod: React.FC<{ life: number; nobodyAt?: number; breenAt?: number; leftAt?: number; mindAt?: number; hl2At?: number; stuckAt?: number; wordAt?: number; beliefAt?: number; erredAt?: number }> = ({
  life,
  nobodyAt = 0,
  breenAt = 1e9,
  leftAt = 1e9,
  mindAt = 1e9,
  hl2At = 1e9,
  stuckAt = 1e9,
  wordAt = 1e9,
  beliefAt = 1e9,
  erredAt = 1e9,
}) => {
  const f = useCurrentFrame();
  void life;
  void nobodyAt;
  const pod = P(f, breenAt, 14);
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 40% 50%, #101418 0%, #020304 75%)", overflow: "hidden", fontFamily: MONO }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: pod }}>
        {/* a cápsula */}
        <ellipse cx={560} cy={540} rx={190} ry={340} fill="rgba(159,230,255,0.04)" stroke={ICE} strokeWidth={3} />
        <ellipse cx={560} cy={540} rx={150} ry={300} fill="none" stroke="rgba(159,230,255,0.3)" strokeWidth={1.5} strokeDasharray="6 8" />
        {/* a estrutura de suporte vazia (o corpo que nunca terminou) */}
        {Array.from({ length: 9 }).map((_, i) => (
          <line key={i} x1={480} x2={640} y1={330 + i * 50} y2={330 + i * 50} stroke={AMB} strokeWidth={2} opacity={i < 4 ? 0.8 : 0.2} strokeDasharray={i < 4 ? undefined : "4 8"} />
        ))}
        <line x1={560} x2={560} y1={300} y2={780} stroke={AMB} strokeWidth={2} opacity={0.5} />
        {/* bolhas do líquido */}
        {Array.from({ length: 10 }).map((_, i) => (
          <circle key={"b" + i} cx={460 + rnd(i * 3) * 200} cy={820 - ((f * (1 + rnd(i)) + i * 60) % 520)} r={2 + rnd(i) * 3} fill="rgba(159,230,255,0.4)" />
        ))}
      </svg>
      <div style={{ position: "absolute", left: 70, top: 56, color: ICE, letterSpacing: 6, fontSize: 22 }}>INSTALAÇÃO COMBINE · NÚCLEO</div>
      {f >= breenAt ? (
        <div style={{ position: "absolute", left: 900, top: 170, width: 860, opacity: pod }}>
          <div style={{ fontSize: 16, letterSpacing: 5, color: ICE }}>OCUPANTE</div>
          <div style={{ fontSize: 64, letterSpacing: 4, color: CREAM }}>DR. WALLACE BREEN</div>
          {f >= leftAt ? <div style={{ fontSize: 22, letterSpacing: 4, color: AMB, marginTop: 6, opacity: P(f, leftAt, 8) }}>O QUE SOBROU DELE</div> : null}
          {f >= mindAt ? (
            <div style={{ marginTop: 26, opacity: P(f, mindAt, 8) }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18, letterSpacing: 3, color: CREAM }}>
                <span>CONSCIÊNCIA</span>
                <span style={{ color: GREEN }}>PRESERVADA</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18, letterSpacing: 3, color: CREAM, marginTop: 10 }}>
                <span>CORPO</span>
                <span style={{ color: RED }}>CONSTRUÇÃO PARADA · 38%</span>
              </div>
            </div>
          ) : null}
          {f >= hl2At ? <div style={{ fontSize: 20, letterSpacing: 3, color: "rgba(255,226,176,0.7)", marginTop: 26, opacity: P(f, hl2At, 8) }}>HALF-LIFE 2 · “A HUMANIDADE PRECISA ACEITAR OS COMBINE”</div> : null}
          {f >= stuckAt ? (
            <div style={{ marginTop: 22, opacity: P(f, stuckAt, 8) }}>
              <div style={{ fontSize: 16, letterSpacing: 5, color: ICE }}>FALA · SINAL FRACO</div>
              <svg width={820} height={70}>
                {Array.from({ length: 100 }).map((_, i) => {
                  const h = 2 + 26 * Math.abs(Math.sin(i * 0.5 + f * 0.3)) * rnd(i + Math.floor(f / 3)) * (rnd(Math.floor(f / 8) + i * 0.1) > 0.4 ? 1 : 0.1);
                  return <rect key={i} x={i * 8} y={35 - h / 2} width={4} height={h} fill={ICE} opacity={0.7} />;
                })}
              </svg>
            </div>
          ) : null}
        </div>
      ) : null}
      {f >= wordAt && f < erredAt ? (
        <div style={{ position: "absolute", left: 900, bottom: 150, width: 860, opacity: P(f, wordAt, 8) }}>
          <div style={{ fontSize: 16, letterSpacing: 5, color: AMB }}>REPETE · PALAVRA DELES</div>
          <div style={{ fontSize: 66, letterSpacing: 8, color: CREAM, transform: `translateX(${(rnd(Math.floor(f / 3)) - 0.5) * 6}px)` }}>CONTINUIDADE</div>
          {f >= beliefAt ? <div style={{ fontSize: 20, letterSpacing: 3, color: ICE, marginTop: 10, opacity: P(f, beliefAt, 8) }}>ACREDITOU: EXISTIR DEPOIS DA MORTE</div> : null}
        </div>
      ) : null}
      {f >= erredAt ? (
        <div style={{ position: "absolute", left: 900, bottom: 150, width: 860, opacity: P(f, erredAt, 8) }}>
          <div style={{ fontSize: 16, letterSpacing: 5, color: AMB }}>OLHA PARA O GORDON</div>
          <div style={{ fontSize: 56, letterSpacing: 6, color: RED }}>ADMITE QUE ERROU</div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ============================================================================================ 6 · 4) perpetuidade
export const HLPerpetuity: React.FC<{ life: number; spaceAt?: number; worldsAt?: number; dimAt?: number; nextAt?: number; endAt?: number; unclearAt?: number; believeAt?: number; linkAt?: number }> = ({
  life,
  spaceAt = 0,
  worldsAt = 1e9,
  dimAt = 1e9,
  nextAt = 1e9,
  endAt = 1e9,
  unclearAt = 1e9,
  believeAt = 1e9,
  linkAt = 1e9,
}) => {
  const f = useCurrentFrame();
  void life;
  const rows = [
    { k: "ESPAÇO", at: spaceAt },
    { k: "MUNDOS", at: worldsAt },
    { k: "DIMENSÕES", at: dimAt },
  ];
  const cam: Cam = { fx: 0, fy: 0, yaw: -0.6 + f * 0.002, pitch: 0.35, dist: 190, cx: 1420, cy: 640, F: 1000 };
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 40% 50%, #140808 0%, #040202 75%)", overflow: "hidden", fontFamily: MONO }}>
      <div style={{ position: "absolute", left: 70, top: 56, color: RED, letterSpacing: 6, fontSize: 22 }}>COMBINE · CONQUISTADO</div>
      <div style={{ position: "absolute", left: 160, top: 200, width: 760 }}>
        {rows.map((r, i) =>
          f >= r.at ? (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 40, letterSpacing: 6, color: CREAM, padding: "14px 0", borderBottom: "1px solid rgba(255,93,77,0.25)", opacity: flickIn(f, r.at) }}>
              <span>{r.k}</span>
              <span style={{ color: RED }}>✓</span>
            </div>
          ) : null,
        )}
        {f >= nextAt ? (
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 54, letterSpacing: 8, color: RED, padding: "26px 0", opacity: flickIn(f, nextAt) }}>
            <span>{f >= endAt ? "O PRÓPRIO FIM" : "PRÓXIMO LIMITE"}</span>
            <span>?</span>
          </div>
        ) : null}
      </div>
      {f >= unclearAt ? (
        <div style={{ position: "absolute", left: 160, bottom: 120, width: 860, opacity: P(f, unclearAt, 8) }}>
          <div style={{ fontSize: 22, letterSpacing: 4, color: "rgba(255,226,176,0.7)" }}>VERDADE?  ·  NÃO SE SABE</div>
          {f >= believeAt ? <div style={{ fontSize: 30, letterSpacing: 4, color: CREAM, marginTop: 10, opacity: P(f, believeAt, 8) }}>ELES ACREDITAM NISSO</div> : null}
        </div>
      ) : null}
      {f >= linkAt ? (
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: P(f, linkAt, 12) }}>
          <Ship cam={cam} col={ICE} />
          <path d="M 760 880 C 1000 980 1200 900 1300 760" fill="none" stroke={RED} strokeWidth={3} strokeDasharray="10 8" strokeDashoffset={-f * 2} />
          <text x={1420} y={330} textAnchor="middle" fill={RED} fontFamily={MONO} fontSize={20} letterSpacing={4}>
            LIGADO A ESSA CRENÇA
          </text>
        </svg>
      ) : null}
    </AbsoluteFill>
  );
};

// ============================================================================================ 6 · 5) a Mossman copia tudo
export const HLDataCopy: React.FC<{ life: number; copyAt?: number; recAt?: number; expAt?: number; calcAt?: number; notesAt?: number; sendAt?: number; phaseAt?: number }> = ({
  life,
  copyAt = 0,
  recAt = 1e9,
  expAt = 1e9,
  calcAt = 1e9,
  notesAt = 1e9,
  sendAt = 1e9,
  phaseAt = 1e9,
}) => {
  const f = useCurrentFrame();
  void life;
  const items = [
    { k: "REGISTROS COMBINE", at: recAt },
    { k: "EXPERIMENTOS", at: expAt },
    { k: "CÁLCULOS DO BOREALIS", at: calcAt },
    { k: "ANOTAÇÕES ESTRANHAS", at: notesAt },
  ];
  const up = interpolate(f, [sendAt, life], [0, 64], C);
  const ph = Math.max(0, (life - f) / 30 + 6);
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, #0b141a 0%, #020406 75%)", overflow: "hidden", fontFamily: MONO }}>
      <div style={{ position: "absolute", left: 70, top: 56, color: CREAM, letterSpacing: 6, fontSize: 22, opacity: P(f, copyAt, 8) }}>DRA. MOSSMAN · COPIANDO</div>
      <div style={{ position: "absolute", left: 160, top: 180, width: 900 }}>
        {items.map((it, i) =>
          f >= it.at ? (
            <div key={i} style={{ marginBottom: 26, opacity: P(f, it.at, 8) }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24, letterSpacing: 3, color: i === 3 ? "#e2c9ff" : CREAM }}>
                <span>{it.k}</span>
                <span>{`${Math.round(Math.min(100, (f - it.at) * 3))}%`}</span>
              </div>
              <div style={{ height: 12, background: "rgba(159,230,255,0.12)", marginTop: 8, position: "relative" }}>
                <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${Math.min(100, (f - it.at) * 3)}%`, background: i === 3 ? "#c79bff" : ICE }} />
              </div>
            </div>
          ) : null,
        )}
      </div>
      {f >= sendAt ? (
        <div style={{ position: "absolute", right: 120, top: 200, width: 560, padding: "18px 22px", border: `1px solid ${GREEN}`, background: "rgba(4,14,8,0.88)", borderRadius: 8, opacity: P(f, sendAt, 8) }}>
          <div style={{ fontSize: 15, letterSpacing: 4, color: GREEN }}>ENVIO · DR. KLEINER</div>
          <div style={{ height: 16, border: `1px solid ${GREEN}`, marginTop: 10, position: "relative" }}>
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${up}%`, background: GREEN }} />
          </div>
          <div style={{ fontSize: 18, color: CREAM, marginTop: 8 }}>{`${Math.round(up)}%`}</div>
          {f >= phaseAt ? (
            <div style={{ marginTop: 16, opacity: P(f, phaseAt, 8) }}>
              <div style={{ fontSize: 15, letterSpacing: 4, color: AMB }}>PRÓXIMA MUDANÇA DE FASE</div>
              <div style={{ fontSize: 46, color: AMB }}>{`00:${String(Math.floor(ph)).padStart(2, "0")}`}</div>
            </div>
          ) : null}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ============================================================================================ 6 · 6) a emboscada
export const HLAmbush: React.FC<{ life: number; arriveAt?: number; notRandAt?: number; pathAt?: number; vulnAt?: number; huntAt?: number; ambushAt?: number; hitAt?: number; handAt?: number; sayAt?: number; quoteAt?: number; elAt?: number; dieAt?: number }> = ({
  life,
  arriveAt = 0,
  notRandAt = 1e9,
  pathAt = 1e9,
  vulnAt = 1e9,
  huntAt = 1e9,
  ambushAt = 1e9,
  hitAt = 1e9,
  handAt = 1e9,
  sayAt = 1e9,
  quoteAt = 1e9,
  elAt = 1e9,
  dieAt = 1e9,
}) => {
  const f = useCurrentFrame();
  void life;
  void notRandAt;
  void sayAt;
  const quote = f >= quoteAt;
  const cam: Cam = { fx: 0, fy: 0, yaw: 0.25 + f * 0.0012, pitch: 1.0, dist: 66, cy: 560 };
  const ent = interpolate(f, [pathAt, pathAt + 60], [0, 1], C);
  const squad = [0, 1, 2].map((i) => proj(cam, -24 + 14 * ent + i * 1.5, -2 + i * 1.2, 0));
  const hunt = [0, 1].map((i) => proj(cam, 6 + i * 4, -14 + 9 * P(f, huntAt, 30), 0));
  const group = [
    { x: 4, y: 4, c: AMB, n: "GORDON" },
    { x: 6, y: 6, c: CREAM, n: "MOSSMAN" },
    { x: 2, y: 7, c: ICE, n: "ALYX" },
  ];
  const hit = f >= hitAt;
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 55%, #08131a 0%, #020507 75%)", overflow: "hidden", fontFamily: MONO }}>
      {!quote ? (
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          <polygon points={pts(cam, [[-26, -4, 0], [0, -4, 0], [0, 0, 0], [-26, 0, 0]])} fill="rgba(255,93,77,0.06)" stroke={f >= pathAt ? RED : "rgba(159,230,255,0.4)"} strokeWidth={2} />
          <polygon points={pts(cam, [[0, -6, 0], [14, -6, 0], [14, 12, 0], [0, 12, 0]])} fill="rgba(159,230,255,0.04)" stroke="rgba(159,230,255,0.55)" strokeWidth={2} />
          <polygon points={pts(cam, [[4, -18, 0], [14, -18, 0], [14, -6, 0], [4, -6, 0]])} fill="rgba(159,230,255,0.03)" stroke={f >= huntAt ? RED : "rgba(159,230,255,0.4)"} strokeWidth={2} />
          {(() => {
            const p = proj(cam, -13, -6, 0);
            return f >= pathAt ? <text x={p[0]} y={p[1]} textAnchor="middle" fill={RED} fontFamily={MONO} fontSize={15} letterSpacing={3}>ÚNICO CAMINHO</text> : null;
          })()}
          {(() => {
            const p = proj(cam, 9, -19, 0);
            return f >= huntAt ? <text x={p[0]} y={p[1] - 6} textAnchor="middle" fill={RED} fontFamily={MONO} fontSize={15} letterSpacing={3}>CONVÉS</text> : null;
          })()}
          {group.map((g, i) => {
            const p = proj(cam, g.x, g.y, 0);
            const dead = i === 1 && hit;
            return (
              <g key={i}>
                {dead ? <path d={`M ${p[0] - 9} ${p[1] - 9} L ${p[0] + 9} ${p[1] + 9} M ${p[0] + 9} ${p[1] - 9} L ${p[0] - 9} ${p[1] + 9}`} stroke={RED} strokeWidth={3} /> : <circle cx={p[0]} cy={p[1]} r={9} fill={g.c} />}
                <text x={p[0] + 14} y={p[1] + 18} fill={dead ? RED : g.c} fontFamily={MONO} fontSize={14} letterSpacing={2}>
                  {g.n}
                </text>
              </g>
            );
          })}
          {f >= arriveAt
            ? squad.map((p, i) => (
                <g key={"s" + i}>
                  <path d={`M ${p[0]} ${p[1] - 10} L ${p[0] + 9} ${p[1] + 7} L ${p[0] - 9} ${p[1] + 7} Z`} fill={RED} />
                  {f >= ambushAt && Math.floor((f + i * 3) / 3) % 2 ? <line x1={p[0]} y1={p[1]} x2={proj(cam, 5, 5, 0)[0]} y2={proj(cam, 5, 5, 0)[1]} stroke="#ffd27a" strokeWidth={1.5} /> : null}
                </g>
              ))
            : null}
          {f >= huntAt
            ? hunt.map((p, i) => (
                <g key={"h" + i}>
                  <path d={`M ${p[0] - 12} ${p[1] + 8} L ${p[0]} ${p[1] - 14} L ${p[0] + 12} ${p[1] + 8} Z`} fill="none" stroke={RED} strokeWidth={3} />
                  <text x={p[0] + 16} y={p[1]} fill={RED} fontFamily={MONO} fontSize={13} letterSpacing={2}>
                    HUNTER
                  </text>
                </g>
              ))
            : null}
          {f >= handAt
            ? (() => {
                const a = proj(cam, 6, 6, 0);
                const b = proj(cam, 4, 4, 0);
                const t = Math.min(1, (f - handAt) / 30);
                return <rect x={a[0] + (b[0] - a[0]) * t - 8} y={a[1] + (b[1] - a[1]) * t - 6} width={16} height={12} fill={GREEN} />;
              })()
            : null}
        </svg>
      ) : null}
      {!quote ? (
        <>
          <div style={{ position: "absolute", left: 70, top: 56, color: RED, letterSpacing: 6, fontSize: 22 }}>H.E.V. · CONTATO HOSTIL</div>
          {f >= vulnAt ? <div style={{ position: "absolute", right: 70, top: 56, color: RED, letterSpacing: 5, fontSize: 18, opacity: P(f, vulnAt, 8) }}>GRUPO · VULNERÁVEL</div> : null}
          {f >= ambushAt ? <div style={{ position: "absolute", left: 0, right: 0, bottom: 110, textAlign: "center", color: RED, letterSpacing: 10, fontSize: 40, opacity: P(f, ambushAt, 8) }}>EMBOSCADA</div> : null}
          {hit ? (
            <div style={{ position: "absolute", right: 70, bottom: 80, width: 460, padding: "14px 18px", border: `1px solid ${RED}`, background: "rgba(40,6,6,0.9)", borderRadius: 8, opacity: P(f, hitAt, 6) }}>
              <div style={{ fontSize: 15, letterSpacing: 4, color: RED }}>DRA. MOSSMAN · ATINGIDA</div>
              <Ecg f={f} bpm={hit ? 130 : 80} jitter={1} col={RED} w={420} h={60} />
            </div>
          ) : null}
        </>
      ) : (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column", background: "#040202" }}>
          <div style={{ fontSize: 18, letterSpacing: 6, color: RED }}>DRA. MOSSMAN · ÚLTIMAS PALAVRAS</div>
          <div style={{ fontSize: 50, color: CREAM, marginTop: 24, maxWidth: 1500, textAlign: "center", lineHeight: 1.35 }}>
            “{typedS(f, quoteAt, "Gordon, o Borealis é uma arma.", 1.2)}
            {f >= elAt ? <span style={{ color: RED }}>{" " + typedS(f, elAt, "E você não pode deixar o Eli destruí-lo.", 1.4)}</span> : null}”
          </div>
          <div style={{ width: 900, marginTop: 50, opacity: 0.8 }}>
            <Ecg f={f} bpm={f >= dieAt ? 0.01 : 44} jitter={f >= dieAt ? 0 : 1} col={RED} w={900} h={80} />
          </div>
          {f >= dieAt ? <div style={{ fontSize: 20, letterSpacing: 5, color: RED, marginTop: 16, opacity: P(f, dieAt, 10) }}>SEM EXPLICAR O QUE QUIS DIZER</div> : null}
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

// ============================================================================================ 6 · 7) a segunda ruptura
export const HLRupture2: React.FC<{ life: number; ruptAt?: number; phaseAt?: number; otherAt?: number; vanishAt?: number; holdAt?: number; couldAt?: number; lookAAt?: number; lookGAt?: number; hesAt?: number; dropAt?: number; closeAt?: number; turnAt?: number; leaveAt?: number; betrayAt?: number; doorAt?: number; offAt?: number }> = ({
  life,
  ruptAt = 0,
  phaseAt = 1e9,
  otherAt = 1e9,
  vanishAt = 1e9,
  holdAt = 1e9,
  couldAt = 1e9,
  lookAAt = 1e9,
  lookGAt = 1e9,
  hesAt = 1e9,
  dropAt = 1e9,
  closeAt = 1e9,
  turnAt = 1e9,
  leaveAt = 1e9,
  betrayAt = 1e9,
  doorAt = 1e9,
  offAt = 1e9,
}) => {
  const f = useCurrentFrame();
  void life;
  void ruptAt;
  void couldAt;
  const cam: Cam = { fx: 0, fy: 0, yaw: 0.1 + f * 0.001, pitch: 1.0, dist: 62, cy: 560 };
  const holding = f >= holdAt && f < dropAt;
  const gap = f < vanishAt ? 1 : holding ? 0.8 : f >= dropAt ? Math.max(0, 0.8 - P(f, dropAt, 20) * 0.8) : 1 - P(f, vanishAt, 20) * 0.2;
  const P1 = proj(cam, 0, -2, 0);
  const alyx = proj(cam, 0, -12, 0);
  const gordon = proj(cam, 0, 8, 0);
  const vort = proj(cam, 4, 0, 0);
  const vg = P(f, leaveAt, 60);
  const look = f >= lookGAt && f < dropAt ? gordon : f >= lookAAt && f < dropAt ? alyx : null;
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 55%, #08131a 0%, #020507 75%)", overflow: "hidden", fontFamily: MONO }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {/* dois lados do navio e a passagem entre eles */}
        <polygon points={pts(cam, [[-14, -20, 0], [14, -20, 0], [14, -5, 0], [-14, -5, 0]])} fill={f >= phaseAt ? "rgba(199,155,255,0.06)" : "rgba(159,230,255,0.03)"} stroke={f >= phaseAt ? "#c79bff" : "rgba(159,230,255,0.5)"} strokeWidth={2} />
        <polygon points={pts(cam, [[-14, 1, 0], [14, 1, 0], [14, 16, 0], [-14, 16, 0]])} fill="rgba(159,230,255,0.03)" stroke="rgba(159,230,255,0.5)" strokeWidth={2} />
        {gap > 0 ? <polygon points={pts(cam, [[-3 * gap, -5, 0], [3 * gap, -5, 0], [3 * gap, 1, 0], [-3 * gap, 1, 0]])} fill={holding ? "rgba(60,255,140,0.18)" : "rgba(159,230,255,0.08)"} stroke={holding ? GREEN : ICE} strokeWidth={2} /> : null}
        {holding ? <circle cx={P1[0]} cy={P1[1]} r={40 + 6 * Math.sin(f / 3)} fill="none" stroke={GREEN} strokeWidth={3} opacity={0.7} /> : null}
        {/* Alyx do outro lado */}
        <circle cx={alyx[0]} cy={alyx[1]} r={11} fill={ICE} opacity={f >= otherAt ? 1 : 0.5} />
        <text x={alyx[0] + 16} y={alyx[1] - 12} fill={ICE} fontFamily={MONO} fontSize={16} letterSpacing={3}>
          ALYX
        </text>
        <circle cx={gordon[0]} cy={gordon[1]} r={11} fill={AMB} />
        <text x={gordon[0] + 16} y={gordon[1] + 20} fill={AMB} fontFamily={MONO} fontSize={16} letterSpacing={3}>
          GORDON
        </text>
        {/* o Vortigaunt que segura */}
        <text x={vort[0] + 40 * vg} y={vort[1] + 200 * vg} textAnchor="middle" dominantBaseline="central" fill={GREEN} fontFamily={MONO} fontSize={34} opacity={1 - vg * 0.7}>
          λ
        </text>
        {[1, 2, 3].map((i) => (
          <text key={i} x={vort[0] + 40 + i * 30 + 60 * vg} y={vort[1] + 40 + i * 10 + 240 * vg} textAnchor="middle" fill={GREEN} fontFamily={MONO} fontSize={26} opacity={(1 - vg * 0.8) * 0.8}>
            λ
          </text>
        ))}
        {look ? <line x1={vort[0]} y1={vort[1]} x2={look[0]} y2={look[1]} stroke={GREEN} strokeWidth={1.5} strokeDasharray="5 5" /> : null}
        {/* a porta com a luz deles, no fundo */}
        {f >= doorAt && f < offAt + 8 ? (
          (() => {
            const p = proj(cam, 13, 20, 0);
            return <rect x={p[0] - 16} y={p[1] - 40} width={32} height={50} fill="rgba(141,255,168,0.4)" stroke={GREEN} strokeWidth={2} opacity={f >= offAt ? 1 - (f - offAt) / 8 : 0.6 + 0.4 * Math.sin(f / 3)} style={{ filter: "drop-shadow(0 0 16px #3dff8a)" }} />;
          })()
        ) : null}
      </svg>
      <div style={{ position: "absolute", left: 70, top: 56, color: f >= phaseAt ? "#c79bff" : ICE, letterSpacing: 6, fontSize: 22 }}>{f >= phaseAt ? "BOREALIS · MUDANÇA DE FASE NO MEIO DO GRUPO" : "A SEGUNDA RUPTURA"}</div>
      <div style={{ position: "absolute", right: 70, top: 56, textAlign: "right" }}>
        <div style={{ fontSize: 16, letterSpacing: 5, color: GREEN }}>PASSAGEM</div>
        <div style={{ fontSize: 42, color: holding ? GREEN : f >= closeAt ? RED : CREAM }}>{f >= closeAt ? "FECHADA" : holding ? "MANTIDA ABERTA" : f >= vanishAt ? "DESAPARECENDO" : "ABERTA"}</div>
        {f >= hesAt && f < dropAt ? <div style={{ fontSize: 18, letterSpacing: 4, color: AMB, opacity: Math.floor(f / 10) % 2 ? 1 : 0.4 }}>HESITA…</div> : null}
        {f >= dropAt && f < closeAt + 30 ? <div style={{ fontSize: 18, letterSpacing: 4, color: RED, opacity: flickIn(f, dropAt) }}>SOLTOU</div> : null}
      </div>
      {f >= turnAt ? (
        <div style={{ position: "absolute", left: 70, bottom: 80, opacity: P(f, turnAt, 8) }}>
          <div style={{ fontSize: 18, letterSpacing: 5, color: GREEN }}>VORTIGAUNTS · SE AFASTANDO</div>
          <div style={{ fontSize: 22, letterSpacing: 3, color: CREAM }}>SEM NENHUMA EXPLICAÇÃO</div>
        </div>
      ) : null}
      {f >= betrayAt && f < doorAt ? <div style={{ position: "absolute", left: 0, right: 0, top: 470, textAlign: "center", fontSize: 64, letterSpacing: 14, color: RED, opacity: P(f, betrayAt, 10) }}>TRAIÇÃO</div> : null}
    </AbsoluteFill>
  );
};

// ============================================================================================ 6 · 8) o que sobrou
export const HLAftermath: React.FC<{ life: number; aliveAt?: number; deadAt?: number; goneAt?: number; gordonAt?: number; filesAt?: number; findAt?: number; hidesAt?: number; turnAt?: number }> = ({
  life,
  aliveAt = 0,
  deadAt = 1e9,
  goneAt = 1e9,
  gordonAt = 1e9,
  filesAt = 1e9,
  findAt = 1e9,
  hidesAt = 1e9,
  turnAt = 1e9,
}) => {
  const f = useCurrentFrame();
  const cards = [
    { k: "ALYX VANCE", v: "VIVA", at: aliveAt, c: ICE },
    { k: "DRA. MOSSMAN", v: "MORTA", at: deadAt, c: RED },
    { k: "VORTIGAUNTS", v: "FORAM EMBORA", at: goneAt, c: GREEN },
  ];
  const fade = interpolate(f, [life - 30, life], [1, 0], C);
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, #0b141a 0%, #020406 75%)", overflow: "hidden", fontFamily: MONO, opacity: fade }}>
      <div style={{ position: "absolute", left: 160, right: 160, top: 160, display: "flex", gap: 40 }}>
        {cards.map((c, i) =>
          f >= c.at ? (
            <div key={i} style={{ flex: 1, padding: "20px 24px", border: `1px solid ${c.c}`, background: "rgba(3,8,12,0.88)", borderRadius: 8, opacity: flickIn(f, c.at) }}>
              <div style={{ fontSize: 16, letterSpacing: 5, color: c.c }}>{c.k}</div>
              <div style={{ fontSize: 40, letterSpacing: 4, color: CREAM, marginTop: 8 }}>{c.v}</div>
            </div>
          ) : null,
        )}
      </div>
      {f >= gordonAt ? (
        <div style={{ position: "absolute", left: 160, top: 420, width: 1600, opacity: P(f, gordonAt, 10) }}>
          <div style={{ fontSize: 18, letterSpacing: 5, color: AMB }}>GORDON FREEMAN</div>
          <div style={{ fontSize: 34, letterSpacing: 3, color: CREAM, marginTop: 8 }}>DENTRO DE UM NAVIO QUEBRADO NO TEMPO</div>
          {f >= filesAt ? <div style={{ fontSize: 24, letterSpacing: 3, color: GREEN, marginTop: 14, opacity: P(f, filesAt, 8) }}>▣ ARQUIVOS DA MOSSMAN · NÃO DECIFRADOS</div> : null}
          {f >= findAt ? <div style={{ fontSize: 24, letterSpacing: 3, color: ICE, marginTop: 14, opacity: P(f, findAt, 8) }}>OBJETIVO · REENCONTRAR A ALYX</div> : null}
          {f >= hidesAt ? <div style={{ fontSize: 22, letterSpacing: 3, color: "#c79bff", marginTop: 14, opacity: P(f, hidesAt, 8) }}>ELA NÃO ESTÁ CONTANDO TUDO O QUE SABE</div> : null}
        </div>
      ) : null}
      {f >= turnAt ? <div style={{ position: "absolute", left: 0, right: 0, bottom: 120, textAlign: "center", fontSize: 40, letterSpacing: 8, color: CREAM, opacity: P(f, turnAt, 12) }}>A HISTÓRIA MUDA DE DIREÇÃO</div> : null}
    </AbsoluteFill>
  );
};

// ============================================================================================ 7 · utilitários
const CardRow: React.FC<{ f: number; at: number; k: string; v: string; c?: string }> = ({ f, at, k, v, c = CREAM }) =>
  f >= at ? (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 18px", borderBottom: "1px solid rgba(159,230,255,0.15)", opacity: flickIn(f, at), fontFamily: MONO }}>
      <span style={{ fontSize: 22, letterSpacing: 3, color: ICE }}>{k}</span>
      <span style={{ fontSize: 24, letterSpacing: 3, color: c }}>{v}</span>
    </div>
  ) : null;

// ============================================================================================ 7 · 1) as coordenadas vazadas
export const HLLeakedCoords: React.FC<{ life: number; searchAt?: number; oddAt?: number; preciseAt?: number; troopsAt?: number; beforeAt?: number; someoneAt?: number; signalAt?: number; roomAt?: number }> = ({
  life,
  searchAt = 0,
  oddAt = 1e9,
  preciseAt = 1e9,
  troopsAt = 1e9,
  beforeAt = 1e9,
  someoneAt = 1e9,
  signalAt = 1e9,
  roomAt = 1e9,
}) => {
  const f = useCurrentFrame();
  void life;
  void searchAt;
  void oddAt;
  const pts2: [number, number][] = [[620, 380], [1300, 420], [900, 760], [1420, 700]];
  const idx = Math.max(0, Math.floor((f - preciseAt) / 45)) % pts2.length;
  const tr = (f - preciseAt) % 45;
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, #0a1218 0%, #020406 75%)", overflow: "hidden", fontFamily: MONO }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <ArcticMap f={f} />
        {pts2.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={9} fill="none" stroke="rgba(159,230,255,0.5)" strokeWidth={2} />
        ))}
        {f >= preciseAt
          ? (() => {
              const [x, y] = pts2[idx];
              return (
                <g>
                  {/* os Combine chegam ANTES: triângulos vermelhos já no ponto; o navio só depois */}
                  {[0, 1, 2].map((k) => (
                    <path key={k} d={`M ${x - 30 + k * 30} ${y - 40} l 10 18 l -20 0 Z`} fill={RED} opacity={P(f, preciseAt + idx * 45, 6)} />
                  ))}
                  <circle cx={x} cy={y} r={14 + (tr > 22 ? 0 : 0)} fill={tr > 22 ? CREAM : "none"} stroke={CREAM} strokeWidth={2} opacity={tr > 22 ? 1 : 0.3} />
                  {f >= beforeAt ? (
                    <text x={x + 40} y={y - 30} fill={RED} fontFamily={MONO} fontSize={16} letterSpacing={3}>
                      {tr > 22 ? "BOREALIS · CHEGOU" : "TROPAS · JÁ ESPERANDO"}
                    </text>
                  ) : null}
                </g>
              );
            })()
          : null}
        {/* o sinal: alguém passando as coordenadas */}
        {f >= signalAt ? <path d={`M 1700 900 C 1500 ${700 + 40 * Math.sin(f / 8)} 1200 600 ${1000} 520`} fill="none" stroke={AMB} strokeWidth={3} strokeDasharray="10 8" strokeDashoffset={-f * 3} opacity={P(f, signalAt, 10)} /> : null}
        {f >= roomAt ? (
          <g opacity={P(f, roomAt, 8)}>
            <rect x={940} y={480} width={120} height={80} fill="rgba(255,178,46,0.1)" stroke={AMB} strokeWidth={2} />
            <text x={1000} y={600} textAnchor="middle" fill={AMB} fontFamily={MONO} fontSize={16} letterSpacing={3}>
              SALA DE CONTROLE
            </text>
          </g>
        ) : null}
      </svg>
      <div style={{ position: "absolute", left: 70, top: 56, color: ICE, letterSpacing: 6, fontSize: 22 }}>H.E.V. · SALTOS DO BOREALIS × TROPAS COMBINE</div>
      {f >= troopsAt ? <div style={{ position: "absolute", right: 70, top: 56, color: RED, letterSpacing: 4, fontSize: 18, opacity: P(f, troopsAt, 8) }}>PRECISÃO DOS COMBINE · 4/4 SALTOS</div> : null}
      {f >= someoneAt ? <div style={{ position: "absolute", left: 0, right: 0, bottom: 100, textAlign: "center", color: AMB, letterSpacing: 6, fontSize: 34, opacity: P(f, someoneAt, 8) }}>ALGUÉM ESTÁ PASSANDO AS COORDENADAS</div> : null}
    </AbsoluteFill>
  );
};

// ============================================================================================ 7 · 2) a Alyx com o Advisor → a fenda → a queda
export const HLAlyxAdvisor: React.FC<{ life: number; doorAt?: number; notHeldAt?: number; notIntAt?: number; talkAt?: number; seesAt?: number; nobodyAt?: number; saysAt?: number; consoleAt?: number; riftAt?: number; holdsAt?: number; xenAt?: number; triesAt?: number; floorAt?: number; fallAt?: number }> = ({
  life,
  doorAt = 0,
  notHeldAt = 1e9,
  notIntAt = 1e9,
  talkAt = 1e9,
  seesAt = 1e9,
  nobodyAt = 1e9,
  saysAt = 1e9,
  consoleAt = 1e9,
  riftAt = 1e9,
  holdsAt = 1e9,
  xenAt = 1e9,
  triesAt = 1e9,
  floorAt = 1e9,
  fallAt = 1e9,
}) => {
  const f = useCurrentFrame();
  void life;
  void nobodyAt;
  const cam: Cam = { fx: 0, fy: 0, yaw: 0.2 + f * 0.001, pitch: 0.95, dist: 56, cy: 560 };
  const A = proj(cam, -3, -4, 0);
  const ADV = proj(cam, 5, -7, 0);
  const G = proj(cam, -2, 12, 0);
  const D = proj(cam, 1, 13, 0);
  const rift = P(f, riftAt, 20);
  const falling = f >= fallAt;
  const fall = interpolate(f, [fallAt, life], [0, 1], C);
  const R = proj(cam, 0, 4, 0);
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, #0d0c12 0%, #030305 75%)", overflow: "hidden", fontFamily: MONO }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, transform: falling ? `translateY(${-fall * 600}px) scale(${1 - fall * 0.5})` : undefined, opacity: 1 - fall }}>
        <polygon points={pts(cam, [[-12, -12, 0], [12, -12, 0], [12, 16, 0], [-12, 16, 0]])} fill="rgba(159,230,255,0.03)" stroke="rgba(159,230,255,0.5)" strokeWidth={2} />
        {/* a fenda no chão */}
        {rift > 0 ? <ellipse cx={R[0]} cy={R[1]} rx={160 * rift + (f >= floorAt ? 120 * P(f, floorAt, 20) : 0)} ry={50 * rift + (f >= floorAt ? 50 * P(f, floorAt, 20) : 0)} fill={f >= xenAt ? "rgba(90,40,120,0.55)" : "rgba(0,0,0,0.7)"} stroke={f >= xenAt ? "#c79bff" : ICE} strokeWidth={3} /> : null}
        {f >= xenAt
          ? Array.from({ length: 10 }).map((_, i) => <circle key={i} cx={R[0] - 120 + rnd(i * 2.3) * 240} cy={R[1] - 30 + rnd(i * 4.1) * 60} r={2 + rnd(i) * 4} fill="#d4ff6a" opacity={0.6 + 0.4 * Math.sin(f / 4 + i)} />)
          : null}
        {f >= holdsAt ? <line x1={A[0]} y1={A[1]} x2={R[0]} y2={R[1]} stroke={ICE} strokeWidth={3} strokeDasharray="6 6" /> : null}
        {/* o Advisor: contato grande, sem desenho */}
        <g opacity={P(f, doorAt + 10, 10)}>
          <circle cx={ADV[0]} cy={ADV[1]} r={36 + 4 * Math.sin(f / 6)} fill="rgba(255,93,77,0.15)" stroke={RED} strokeWidth={3} />
          <circle cx={ADV[0]} cy={ADV[1]} r={12} fill={RED} />
          <text x={ADV[0] + 46} y={ADV[1] - 20} fill={RED} fontFamily={MONO} fontSize={18} letterSpacing={3}>
            ADVISOR
          </text>
        </g>
        {f >= talkAt && f < consoleAt ? <path d={`M ${A[0] + 14} ${A[1]} Q ${(A[0] + ADV[0]) / 2} ${A[1] - 60} ${ADV[0] - 30} ${ADV[1]}`} fill="none" stroke={CREAM} strokeWidth={2} strokeDasharray="4 6" strokeDashoffset={-f * 2} /> : null}
        <circle cx={A[0]} cy={A[1]} r={12} fill={ICE} />
        <text x={A[0] - 20} y={A[1] - 22} textAnchor="end" fill={ICE} fontFamily={MONO} fontSize={18} letterSpacing={3}>
          ALYX
        </text>
        {f >= consoleAt ? <rect x={A[0] - 70} y={A[1] - 6} width={30} height={14} fill="none" stroke={AMB} strokeWidth={2} /> : null}
        <circle cx={G[0]} cy={G[1] + (f >= triesAt ? -60 * P(f, triesAt, 20) : 0)} r={11} fill={AMB} />
        <text x={G[0] + 16} y={G[1] + 20} fill={AMB} fontFamily={MONO} fontSize={16} letterSpacing={3}>
          GORDON
        </text>
        <circle cx={D[0]} cy={D[1]} r={10} fill="#2a2f35" stroke={CREAM} strokeWidth={2} />
        <text x={D[0] + 16} y={D[1] + 20} fill={CREAM} fontFamily={MONO} fontSize={14} letterSpacing={3}>
          DOG
        </text>
      </svg>
      {falling ? (
        <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 60%, rgba(120,60,160,${0.6 * fall}) 0%, rgba(10,4,16,${fall}) 70%)` }}>
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} style={{ position: "absolute", left: `${rnd(i * 3.3) * 100}%`, top: `${((rnd(i * 5.5) * 100 - fall * 300 * (0.5 + rnd(i))) % 100 + 100) % 100}%`, width: 3, height: 40, background: "rgba(212,255,106,0.5)" }} />
          ))}
          <div style={{ position: "absolute", left: 0, right: 0, top: 480, textAlign: "center", fontSize: 40, letterSpacing: 10, color: "#e2c9ff", opacity: P(f, fallAt + 6, 10) }}>CAINDO EM XEN</div>
        </AbsoluteFill>
      ) : null}
      <div style={{ position: "absolute", left: 70, top: 56, color: ICE, letterSpacing: 6, fontSize: 22 }}>H.E.V. · SALA DE CONTROLE</div>
      {!falling ? (
        <div style={{ position: "absolute", right: 70, top: 150, width: 520 }}>
          <CardRow f={f} at={notHeldAt} k="PRESA" v="NÃO" c={GREEN} />
          <CardRow f={f} at={notIntAt} k="INTERROGADA" v="NÃO" c={GREEN} />
          <CardRow f={f} at={talkAt} k="CONVERSANDO COM ELE" v="SIM" c={RED} />
          <CardRow f={f} at={seesAt} k="VIU O GORDON" v="SIM" />
          <CardRow f={f} at={saysAt} k="DIZ" v="“AINDA NÃO ENTENDERIA”" c={ICE} />
          <CardRow f={f} at={holdsAt} k="A FENDA" v="ELA SEGURA" c={ICE} />
          <CardRow f={f} at={xenAt} k="DO OUTRO LADO" v="XEN" c="#d4ff6a" />
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ============================================================================================ 7 · 3) de volta às raízes: Xen
export const HLXenRoots: React.FC<{ life: number; rootsAt?: number; notCampAt?: number; notCorrAt?: number; apartAt?: number; aloneAt?: number; islandsAt?: number; dogAt?: number; meetAt?: number }> = ({
  life,
  rootsAt = 0,
  notCampAt = 1e9,
  notCorrAt = 1e9,
  apartAt = 1e9,
  aloneAt = 1e9,
  islandsAt = 1e9,
  dogAt = 1e9,
  meetAt = 1e9,
}) => {
  const f = useCurrentFrame();
  void life;
  const map = P(f, apartAt, 14);
  const isl = [
    [400, 600, 120],
    [760, 420, 90],
    [1100, 640, 140],
    [1460, 380, 100],
    [1700, 700, 80],
  ];
  const gx = interpolate(f, [aloneAt, meetAt], [400, 1100], C);
  const gy = interpolate(f, [aloneAt, meetAt], [560, 600], C);
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 40%, #241433 0%, #07030c 75%)", overflow: "hidden", fontFamily: MONO }}>
      {map < 1 ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 300, textAlign: "center", opacity: (1 - map) * P(f, rootsAt, 10) }}>
          <div style={{ fontSize: 22, letterSpacing: 8, color: "#e2c9ff" }}>XEN · DE VOLTA ÀS RAÍZES DE HALF-LIFE</div>
          <div style={{ marginTop: 40, display: "flex", flexDirection: "column", gap: 18, alignItems: "center" }}>
            {f >= notCampAt ? <div style={{ fontSize: 34, letterSpacing: 4, color: "rgba(255,226,176,0.6)", textDecoration: "line-through", textDecorationColor: RED, opacity: flickIn(f, notCampAt) }}>UMA SEGUNDA CAMPANHA INTEIRA</div> : null}
            {f >= notCorrAt ? <div style={{ fontSize: 34, letterSpacing: 4, color: "rgba(255,226,176,0.6)", textDecoration: "line-through", textDecorationColor: RED, opacity: flickIn(f, notCorrAt) }}>DOIS CORREDORES E UM MURAL</div> : null}
          </div>
        </div>
      ) : null}
      {map > 0 ? (
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: map }}>
          {isl.map(([x, y, r], i) => (
            <g key={i} transform={`translate(${x} ${y + 10 * Math.sin(f / 30 + i)})`} opacity={f >= islandsAt || i === 0 ? 1 : 0.3}>
              <ellipse rx={r} ry={r * 0.32} fill="rgba(120,80,160,0.25)" stroke="#c79bff" strokeWidth={2} />
              <path d={`M ${-r * 0.8} 0 L ${-r * 0.3} ${r * 0.9} L ${r * 0.2} ${r * 0.6} L ${r * 0.7} 0`} fill="none" stroke="#c79bff" strokeWidth={1.5} opacity={0.6} />
            </g>
          ))}
          <circle cx={gx} cy={gy - 40} r={11} fill={AMB} />
          <text x={gx + 16} y={gy - 54} fill={AMB} fontFamily={MONO} fontSize={16} letterSpacing={3}>
            GORDON · SOZINHO
          </text>
          {f >= dogAt
            ? [0, 1, 2].map((k) => {
                const ph = ((f - dogAt) / 30 + k / 3) % 1;
                return <circle key={k} cx={1460} cy={340} r={20 + ph * 90} fill="none" stroke={CREAM} strokeWidth={2} opacity={1 - ph} />;
              })
            : null}
          {f >= dogAt ? (
            <text x={1500} y={300} fill={CREAM} fontFamily={MONO} fontSize={16} letterSpacing={3}>
              {f >= meetAt ? "DOG · REENCONTRO" : "DOG · DESTRUINDO ALGO AO LONGE"}
            </text>
          ) : null}
        </svg>
      ) : null}
      <div style={{ position: "absolute", left: 70, top: 56, color: "#c79bff", letterSpacing: 6, fontSize: 22 }}>H.E.V. · XEN</div>
    </AbsoluteFill>
  );
};

// ============================================================================================ 7 · 4) as criaturas clássicas
export const HLXenBestiary: React.FC<{ life: number; classicAt?: number; houndAt?: number; bullAt?: number; barnAt?: number }> = ({ life, classicAt = 0, houndAt = 1e9, bullAt = 1e9, barnAt = 1e9 }) => {
  const f = useCurrentFrame();
  void life;
  const cards = [
    { k: "HOUNDEYE", v: "CAÇA EM GRUPO", at: houndAt, draw: <g>{[0, 1, 2].map((i) => <circle key={i} cx={110} cy={110} r={20 + (((f / 2 + i * 10) % 30) / 30) * 80} fill="none" stroke="#d4ff6a" strokeWidth={2} opacity={1 - ((f / 2 + i * 10) % 30) / 30} />)}</g> },
    { k: "BULLSQUID", v: "PÂNTANOS", at: bullAt, draw: <path d={`M 30 170 Q 110 ${40 + 10 * Math.sin(f / 6)} 190 170`} fill="none" stroke="#d4ff6a" strokeWidth={4} strokeDasharray="8 8" strokeDashoffset={-f * 2} /> },
    { k: "BARNACLE", v: "PENDURADO · SEM CHÃO EMBAIXO", at: barnAt, draw: <g><line x1={20} x2={200} y1={20} y2={20} stroke="#c79bff" strokeWidth={4} /><line x1={110} x2={110} y1={20} y2={70 + 90 * Math.abs(Math.sin(f / 15))} stroke="#d4ff6a" strokeWidth={3} /></g> },
  ];
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 40%, #241433 0%, #07030c 75%)", overflow: "hidden", fontFamily: MONO }}>
      <div style={{ position: "absolute", left: 70, top: 56, color: "#c79bff", letterSpacing: 6, fontSize: 22, opacity: P(f, classicAt, 8) }}>H.E.V. · FAUNA DE XEN · CONTATOS CLÁSSICOS</div>
      <div style={{ position: "absolute", left: 160, right: 160, top: 260, display: "flex", gap: 40 }}>
        {cards.map((c, i) =>
          f >= c.at ? (
            <div key={i} style={{ flex: 1, border: "1px solid #c79bff", background: "rgba(20,8,30,0.85)", borderRadius: 8, opacity: flickIn(f, c.at) }}>
              <svg width="100%" height={240} viewBox="0 0 220 220">
                {c.draw}
              </svg>
              <div style={{ padding: "0 20px 20px" }}>
                <div style={{ fontSize: 30, letterSpacing: 4, color: CREAM }}>{c.k}</div>
                <div style={{ fontSize: 18, letterSpacing: 3, color: "#c79bff", marginTop: 6 }}>{c.v}</div>
              </div>
            </div>
          ) : null,
        )}
      </div>
    </AbsoluteFill>
  );
};

// ============================================================================================ 7 · 5) a colmeia e a criatura maior
export const HLHiveBoss: React.FC<{ life: number; hiveAt?: number; wakeAt?: number; holdAt?: number; padsAt?: number; gunAt?: number; physAt?: number; notAmmoAt?: number }> = ({
  life,
  hiveAt = 0,
  wakeAt = 1e9,
  holdAt = 1e9,
  padsAt = 1e9,
  gunAt = 1e9,
  physAt = 1e9,
  notAmmoAt = 1e9,
}) => {
  const f = useCurrentFrame();
  void life;
  void hiveAt;
  const boss = P(f, wakeAt, 20);
  const fallT = f >= physAt ? ((f - physAt) % 60) / 60 : -1;
  const jump = f >= padsAt ? Math.abs(Math.sin((f - padsAt) / 12)) : 0;
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 70%, #2a1c08 0%, #070402 75%)", overflow: "hidden", fontFamily: MONO }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {/* a colmeia: câmaras em favo */}
        {Array.from({ length: 14 }).map((_, i) => {
          const x = 200 + (i % 7) * 240;
          const y = 160 + Math.floor(i / 7) * 140;
          return <path key={i} d={`M ${x} ${y} l 60 -35 l 60 35 l 0 70 l -60 35 l -60 -35 Z`} fill="none" stroke="rgba(255,178,46,0.35)" strokeWidth={2} />;
        })}
        <line x1={0} x2={1920} y1={900} y2={900} stroke="rgba(255,178,46,0.5)" strokeWidth={2} />
        {/* a criatura maior: contato enorme */}
        {boss > 0 ? (
          <g transform={`translate(960 ${760 - 40 * boss})`}>
            <ellipse rx={220 * boss} ry={110 * boss} fill="rgba(255,93,77,0.15)" stroke={RED} strokeWidth={4} />
            <circle r={26} fill={RED} opacity={boss} />
            <text y={-140 * boss - 10} textAnchor="middle" fill={RED} fontFamily={MONO} fontSize={22} letterSpacing={4} opacity={boss}>
              CONTATO · GUARDIÃ DA COLMEIA
            </text>
          </g>
        ) : null}
        {/* o Dog segurando: cabo de força */}
        {f >= holdAt ? (
          <g opacity={P(f, holdAt, 8)}>
            <line x1={640} y1={860} x2={760} y2={760} stroke={CREAM} strokeWidth={5} />
            <circle cx={640} cy={860} r={18} fill="#2a2f35" stroke={CREAM} strokeWidth={3} />
            <text x={560} y={910} fill={CREAM} fontFamily={MONO} fontSize={18} letterSpacing={3}>
              DOG · SEGURA
            </text>
          </g>
        ) : null}
        {/* plataformas de salto e o Gordon */}
        {f >= padsAt ? (
          <g opacity={P(f, padsAt, 8)}>
            {[1300, 1480, 1640].map((x, i) => (
              <ellipse key={i} cx={x} cy={880 - i * 120} rx={50} ry={12} fill="none" stroke="#d4ff6a" strokeWidth={3} />
            ))}
            <circle cx={1300 + jump * 340} cy={860 - jump * 260} r={12} fill={AMB} />
            <text x={1310 + jump * 340} y={830 - jump * 260} fill={AMB} fontFamily={MONO} fontSize={16} letterSpacing={3}>
              GORDON
            </text>
          </g>
        ) : null}
        {/* a Gravity Gun derrubando partes da estrutura em cima dela */}
        {f >= gunAt ? <line x1={1640} y1={520} x2={1100} y2={300} stroke="#ffcf6a" strokeWidth={3} strokeDasharray="10 8" opacity={Math.floor(f / 4) % 2 ? 1 : 0.4} /> : null}
        {fallT >= 0 ? <path d={`M ${1050} ${280 + fallT * 440} l 80 0 l -20 50 l -60 0 Z`} fill="none" stroke="#ffcf6a" strokeWidth={3} /> : null}
      </svg>
      <div style={{ position: "absolute", left: 70, top: 56, color: AMB, letterSpacing: 6, fontSize: 22 }}>H.E.V. · COLMEIA ANTIGA DE ANTLIONS</div>
      {f >= notAmmoAt ? (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 90, textAlign: "center", opacity: P(f, notAmmoAt, 8) }}>
          <span style={{ fontSize: 30, letterSpacing: 4, color: "rgba(255,226,176,0.5)", textDecoration: "line-through", textDecorationColor: RED }}>DESCARREGAR MUNIÇÃO</span>
          <span style={{ fontSize: 34, letterSpacing: 4, color: "#ffcf6a", marginLeft: 40 }}>USAR A FÍSICA</span>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ============================================================================================ 7 · 6) o observatório Vortigaunt
export const HLObservatory: React.FC<{ life: number; calmAt?: number; ruinsAt?: number; obsAt?: number; stonesAt?: number; lightAt?: number; memAt?: number; worldsAt?: number; earthAt?: number; xenAt?: number; otherAt?: number; pathsAt?: number; combAt?: number; equipAt?: number; twoAt?: number }> = ({
  life,
  calmAt = 0,
  ruinsAt = 1e9,
  obsAt = 1e9,
  stonesAt = 1e9,
  lightAt = 1e9,
  memAt = 1e9,
  worldsAt = 1e9,
  earthAt = 1e9,
  xenAt = 1e9,
  otherAt = 1e9,
  pathsAt = 1e9,
  combAt = 1e9,
  equipAt = 1e9,
  twoAt = 1e9,
}) => {
  const f = useCurrentFrame();
  void life;
  void calmAt;
  void obsAt;
  void memAt;
  const W = [
    { x: 620, y: 420, r: 70, c: "#7fd6ff", n: "TERRA", at: earthAt },
    { x: 1300, y: 400, r: 80, c: "#d4ff6a", n: "XEN", at: xenAt },
    { x: 960, y: 700, r: 60, c: "#c79bff", n: "?", at: otherAt },
    { x: 1560, y: 700, r: 50, c: "#ffcf6a", n: "?", at: otherAt + 8 },
    { x: 380, y: 720, r: 45, c: "#9fe6ff", n: "?", at: otherAt + 14 },
  ];
  const links: [number, number][] = [[0, 1], [0, 2], [1, 3], [2, 3], [0, 4]];
  const stones = P(f, stonesAt, 20);
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, #0d1a12 0%, #020504 75%)", overflow: "hidden", fontFamily: MONO }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {/* pedras e cristais suspensos */}
        {Array.from({ length: 18 }).map((_, i) => {
          const a = (i / 18) * Math.PI * 2 + f * 0.003;
          const x = 960 + Math.cos(a) * 520;
          const y = 560 + Math.sin(a) * 300 + 8 * Math.sin(f / 20 + i);
          const lit = f >= lightAt && i % 3 === 0;
          return <path key={i} d={`M ${x} ${y - 16} L ${x + 9} ${y} L ${x} ${y + 16} L ${x - 9} ${y} Z`} fill={lit ? GREEN : "rgba(141,255,168,0.15)"} stroke={GREEN} strokeWidth={1.5} opacity={stones} style={lit ? { filter: "drop-shadow(0 0 10px #3dff8a)" } : undefined} />;
        })}
        {/* os mundos */}
        {f >= worldsAt
          ? links.map(([a, b], i) => (
              <line key={"l" + i} x1={W[a].x} y1={W[a].y} x2={W[b].x} y2={W[b].y} stroke={f >= combAt ? RED : GREEN} strokeWidth={2} strokeDasharray="8 8" opacity={P(f, pathsAt + i * 4, 10)} />
            ))
          : null}
        {W.map((w, i) =>
          f >= w.at ? (
            <g key={i} opacity={P(f, w.at, 10)}>
              <circle cx={w.x} cy={w.y} r={w.r} fill="none" stroke={w.c} strokeWidth={3} />
              <ellipse cx={w.x} cy={w.y} rx={w.r} ry={w.r * 0.3} fill="none" stroke={w.c} strokeWidth={1} opacity={0.5} transform={`rotate(${f * 0.4} ${w.x} ${w.y})`} />
              <text x={w.x} y={w.y + w.r + 30} textAnchor="middle" fill={w.c} fontFamily={MONO} fontSize={18} letterSpacing={4}>
                {w.n}
              </text>
            </g>
          ) : null,
        )}
        {/* os Combine atravessando as conexões */}
        {f >= combAt
          ? links.map(([a, b], i) => {
              const t = ((f - combAt) / 50 + i * 0.2) % 1;
              return <path key={"c" + i} d={`M ${W[a].x + (W[b].x - W[a].x) * t} ${W[a].y + (W[b].y - W[a].y) * t - 10} l 10 18 l -20 0 Z`} fill={RED} />;
            })
          : null}
        {f >= equipAt ? (
          <g opacity={P(f, equipAt, 8)}>
            <rect x={860} y={930} width={200} height={50} fill="rgba(255,93,77,0.1)" stroke={RED} strokeWidth={2} />
            <text x={960} y={962} textAnchor="middle" fill={RED} fontFamily={MONO} fontSize={16} letterSpacing={3}>
              EQUIPAMENTO COMBINE · RECENTE
            </text>
          </g>
        ) : null}
      </svg>
      <div style={{ position: "absolute", left: 70, top: 56, color: GREEN, letterSpacing: 6, fontSize: 22, opacity: P(f, ruinsAt, 8) }}>RUÍNAS VORTIGAUNT · OBSERVATÓRIO</div>
      {f >= lightAt && f < worldsAt ? <div style={{ position: "absolute", left: 0, right: 0, bottom: 110, textAlign: "center", color: GREEN, letterSpacing: 5, fontSize: 26, opacity: P(f, lightAt, 8) }}>UMA MEMÓRIA PRESERVADA PELA VORTESSÊNCIA</div> : null}
      {f >= twoAt ? <div style={{ position: "absolute", left: 0, right: 0, bottom: 60, textAlign: "center", color: CREAM, letterSpacing: 5, fontSize: 26, opacity: P(f, twoAt, 8) }}>DUAS COISAS QUE PARECIAM IGUAIS</div> : null}
    </AbsoluteFill>
  );
};

// ============================================================================================ 7 · 7) universo × linha do tempo (Regras 5 e 6 no mesmo quadro)
export const HLUniverseVsTime: React.FC<{ life: number; uniAt?: number; altAt?: number; firstAt?: number; r6At?: number; crossAt?: number; notAt?: number; empireAt?: number; storyAt?: number }> = ({
  life,
  uniAt = 0,
  altAt = 1e9,
  firstAt = 1e9,
  r6At = 1e9,
  crossAt = 1e9,
  notAt = 1e9,
  empireAt = 1e9,
  storyAt = 1e9,
}) => {
  const f = useCurrentFrame();
  void life;
  void firstAt;
  void empireAt;
  // esquerda: uma realidade com vários mundos ligados; direita: outra realidade inteira (linha alternativa), sem ponte
  const box = (x: number, y: number, label: string, col: string, k: number) => (
    <g>
      <rect x={x} y={y} width={560} height={420} rx={14} fill="rgba(255,255,255,0.02)" stroke={col} strokeWidth={2.5} />
      <text x={x + 20} y={y + 36} fill={col} fontFamily={MONO} fontSize={18} letterSpacing={4}>
        {label}
      </text>
      {[[x + 140, y + 160], [x + 400, y + 150], [x + 270, y + 320]].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={42} fill="none" stroke={col} strokeWidth={2} opacity={0.8} />
      ))}
      <path d={`M ${x + 182} ${y + 160} L ${x + 358} ${y + 150} M ${x + 160} ${y + 196} L ${x + 240} ${y + 288} M ${x + 380} ${y + 190} L ${x + 300} ${y + 288}`} stroke={col} strokeWidth={1.5} strokeDasharray="6 6" />
      {k === 0 && f >= crossAt
        ? [0, 1].map((i) => {
            const t = ((f - crossAt) / 40 + i * 0.5) % 1;
            return <path key={i} d={`M ${x + 182 + 176 * t} ${y + 155 - 10 * t} l 10 18 l -20 0 Z`} fill={RED} />;
          })
        : null}
    </g>
  );
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, #0a1218 0%, #020406 75%)", overflow: "hidden", fontFamily: MONO }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <g opacity={P(f, uniAt, 10)}>{box(220, 300, "UMA REALIDADE · VÁRIOS MUNDOS", ICE, 0)}</g>
        <g opacity={P(f, altAt, 10)}>{box(1140, 300, "LINHA ALTERNATIVA · OUTRA REALIDADE INTEIRA", "#c79bff", 1)}</g>
        {f >= notAt ? (
          <g opacity={P(f, notAt, 8)}>
            <path d="M 800 510 L 1120 510" stroke={RED} strokeWidth={4} strokeDasharray="12 10" />
            <path d="M 940 470 L 980 550 M 980 470 L 940 550" stroke={RED} strokeWidth={6} />
            <text x={960} y={600} textAnchor="middle" fill={RED} fontFamily={MONO} fontSize={18} letterSpacing={4}>
              OS COMBINE NÃO ATRAVESSAM
            </text>
          </g>
        ) : null}
      </svg>
      <div style={{ position: "absolute", left: 70, top: 56, color: ICE, letterSpacing: 6, fontSize: 22 }}>{f >= r6At ? "REGRA 6" : "REGRA 5"}</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 160, textAlign: "center", fontSize: 30, letterSpacing: 4, color: CREAM }}>
        {f >= r6At ? "OS COMBINE ATRAVESSAM UNIVERSOS E DIMENSÕES · NÃO LINHAS TEMPORAIS" : "UNIVERSO E LINHA DO TEMPO NÃO SÃO A MESMA COISA"}
      </div>
      {f >= storyAt ? <div style={{ position: "absolute", left: 0, right: 0, bottom: 110, textAlign: "center", fontSize: 26, letterSpacing: 4, color: "#e2c9ff", opacity: P(f, storyAt, 8) }}>PRESOS À PRÓPRIA HISTÓRIA</div> : null}
    </AbsoluteFill>
  );
};

// ============================================================================================ 7 · 8) a parede das versões (Regra 7) e quem observa de fora
export const HLVersionsWall: React.FC<{ life: number; wallAt?: number; sameAt?: number; personAt?: number; battleAt?: number; endAt?: number; noPassAt?: number; r7At?: number; ifAt?: number; dominateAt?: number; manAt?: number; outsideAt?: number; laterAt?: number }> = ({
  life,
  wallAt = 0,
  sameAt = 1e9,
  personAt = 1e9,
  battleAt = 1e9,
  endAt = 1e9,
  noPassAt = 1e9,
  r7At = 1e9,
  ifAt = 1e9,
  dominateAt = 1e9,
  manAt = 1e9,
  outsideAt = 1e9,
  laterAt = 1e9,
}) => {
  const f = useCurrentFrame();
  void life;
  void ifAt;
  void dominateAt;
  const rows = 4;
  const glyphs = (r: number) => {
    const n = r === 1 ? 2 : 3; // numa versão uma figura não existe
    return Array.from({ length: n }).map((_, i) => <circle key={i} cx={220 + i * 90} cy={0} r={14} fill="none" stroke="#e7d9b8" strokeWidth={3} opacity={f >= personAt || r !== 1 || i < 2 ? 1 : 0} />);
  };
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, #17130c 0%, #050403 75%)", overflow: "hidden", fontFamily: MONO }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {Array.from({ length: rows }).map((_, r) => {
          const y = 230 + r * 170;
          const on = P(f, sameAt + r * 6, 10);
          const won = r % 2 === 0;
          return (
            <g key={r} opacity={on * P(f, wallAt, 10)}>
              <rect x={300} y={y - 60} width={1200} height={120} fill="rgba(231,217,184,0.05)" stroke="#e7d9b8" strokeWidth={2} />
              <g transform={`translate(300 ${y})`}>
                {/* o mesmo lugar: uma torre e um portal */}
                <path d="M 60 40 L 60 -40 L 110 -40 L 110 40" fill="none" stroke="#e7d9b8" strokeWidth={2} />
                {glyphs(r)}
                {/* a batalha: o resultado muda */}
                {f >= battleAt ? <path d={won ? "M 600 10 L 640 -30 L 680 10" : "M 600 -30 L 640 10 L 680 -30"} fill="none" stroke={won ? GREEN : RED} strokeWidth={3} /> : null}
                {/* figuras que chegam ao fim ou somem antes */}
                {f >= endAt ? <line x1={760} x2={r === 2 ? 960 : 1150} y1={0} y2={0} stroke="#e7d9b8" strokeWidth={3} /> : null}
                {f >= endAt && r === 2 ? <text x={980} y={6} fill={RED} fontFamily={MONO} fontSize={14} letterSpacing={2}>SOME ANTES</text> : null}
              </g>
              {f >= noPassAt && r < rows - 1 ? <text x={1530} y={y + 90} fill={RED} fontFamily={MONO} fontSize={14} letterSpacing={2} opacity={P(f, noPassAt, 8)}>SEM PASSAGEM</text> : null}
            </g>
          );
        })}
        {/* o homem de terno, desenhado do lado de fora: só a maleta e o olhar sobre todas */}
        {f >= manAt ? (
          <g opacity={P(f, manAt, 10)}>
            <rect x={1640} y={520} width={50} height={36} fill="none" stroke={CREAM} strokeWidth={3} />
            <path d="M 1655 520 L 1655 510 L 1675 510 L 1675 520" fill="none" stroke={CREAM} strokeWidth={3} />
            {f >= outsideAt ? [0, 1, 2, 3].map((r) => <line key={r} x1={1640} y1={538} x2={1500} y2={230 + r * 170} stroke={CREAM} strokeWidth={1} strokeDasharray="4 6" opacity={0.6} />) : null}
          </g>
        ) : null}
      </svg>
      <div style={{ position: "absolute", left: 70, top: 56, color: "#e7d9b8", letterSpacing: 6, fontSize: 22 }}>{f >= r7At ? "REGRA 7 · LINHAS ALTERNATIVAS NÃO COMPARTILHAM INFORMAÇÃO" : "RUÍNAS · UMA PAREDE MUITO MAIS ANTIGA"}</div>
      {f >= manAt ? <div style={{ position: "absolute", right: 90, top: 600, width: 260, textAlign: "center", color: CREAM, letterSpacing: 3, fontSize: 16, opacity: P(f, outsideAt, 8) }}>DO LADO DE FORA · OBSERVANDO</div> : null}
      {f >= laterAt ? <div style={{ position: "absolute", left: 0, right: 0, bottom: 60, textAlign: "center", color: "rgba(255,226,176,0.7)", letterSpacing: 5, fontSize: 22, opacity: P(f, laterAt, 8) }}>(A GENTE VOLTA NISSO DAQUI A POUCO)</div> : null}
    </AbsoluteFill>
  );
};

// ============================================================================================ 7 · 9) a fenda que abre sozinha (Regra 8)
export const HLXenLeak: React.FC<{ life: number; riftAt?: number; aloneAt?: number; equipAt?: number; sigAt?: number; qAt?: number; r8At?: number; leakAt?: number; woundAt?: number; alyxAt?: number; heldAt?: number; knowsAt?: number }> = ({
  life,
  riftAt = 0,
  aloneAt = 1e9,
  equipAt = 1e9,
  sigAt = 1e9,
  qAt = 1e9,
  r8At = 1e9,
  leakAt = 1e9,
  woundAt = 1e9,
  alyxAt = 1e9,
  heldAt = 1e9,
  knowsAt = 1e9,
}) => {
  const f = useCurrentFrame();
  void life;
  void riftAt;
  const on = f >= aloneAt ? (Math.floor((f - aloneAt) / 40) % 2 === 0 ? 1 : 0.1) : 1;
  const ph2 = f >= r8At;
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, #170d22 0%, #050208 75%)", overflow: "hidden", fontFamily: MONO }}>
      {!ph2 ? (
        <>
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
            <ellipse cx={700} cy={560} rx={200} ry={90} fill="rgba(90,40,120,0.5)" stroke="#c79bff" strokeWidth={3} opacity={on} />
            {f >= equipAt ? <rect x={1000} y={600} width={160} height={90} fill="none" stroke={RED} strokeWidth={2} opacity={P(f, equipAt, 8)} /> : null}
            {f >= equipAt ? <text x={1080} y={720} textAnchor="middle" fill={RED} fontFamily={MONO} fontSize={14} letterSpacing={2}>COMBINE · REGISTRANDO</text> : null}
            {f >= sigAt ? (
              <g opacity={P(f, sigAt, 8)}>
                <polyline points={Array.from({ length: 80 }).map((_, i) => `${1200 + i * 8},${300 + 30 * Math.sin(i * 0.5 + f / 3) * rnd(i)}`).join(" ")} fill="none" stroke="#c79bff" strokeWidth={2} />
                <polyline points={Array.from({ length: 80 }).map((_, i) => `${1200 + i * 8},${420 + 30 * Math.sin(i * 0.5 + f / 3) * rnd(i)}`).join(" ")} fill="none" stroke={ICE} strokeWidth={2} />
                <text x={1200} y={270} fill="#c79bff" fontFamily={MONO} fontSize={14} letterSpacing={2}>FENDA</text>
                <text x={1200} y={390} fill={ICE} fontFamily={MONO} fontSize={14} letterSpacing={2}>BOREALIS FORA DE SINCRONIA</text>
                <text x={1200} y={500} fill={CREAM} fontFamily={MONO} fontSize={18} letterSpacing={3}>MESMA ASSINATURA</text>
              </g>
            ) : null}
          </svg>
          {f >= qAt ? <div style={{ position: "absolute", left: 0, right: 0, bottom: 100, textAlign: "center", fontSize: 36, letterSpacing: 4, color: CREAM, opacity: P(f, qAt, 8) }}>SE É TEMPORAL, POR QUE ABRE PARA XEN?</div> : null}
        </>
      ) : (
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          {/* a ferida: o navio perto de uma rachadura; a fronteira de Xen vaza para dentro */}
          <rect x={300} y={420} width={700} height={200} rx={20} fill="none" stroke={ICE} strokeWidth={3} />
          <text x={320} y={460} fill={ICE} fontFamily={MONO} fontSize={16} letterSpacing={3}>BOREALIS · FORA DE SINCRONIA</text>
          <path d="M 1150 300 L 1180 420 L 1140 520 L 1190 640 L 1160 780" fill="none" stroke={RED} strokeWidth={4} opacity={P(f, woundAt, 10)} />
          <text x={1210} y={300} fill={RED} fontFamily={MONO} fontSize={16} letterSpacing={3} opacity={P(f, woundAt, 10)}>A FERIDA</text>
          <rect x={1300} y={300} width={400} height={480} fill="rgba(120,60,160,0.15)" stroke="#c79bff" strokeWidth={2} />
          <text x={1320} y={340} fill="#c79bff" fontFamily={MONO} fontSize={16} letterSpacing={3}>XEN</text>
          {f >= leakAt
            ? Array.from({ length: 12 }).map((_, i) => {
                const t = ((f - leakAt) / 40 + i / 12) % 1;
                return <circle key={i} cx={1300 - t * 320} cy={420 + (i % 6) * 40} r={4} fill="#d4ff6a" opacity={1 - t} />;
              })
            : null}
        </svg>
      )}
      <div style={{ position: "absolute", left: 70, top: 56, color: "#c79bff", letterSpacing: 6, fontSize: 22 }}>{ph2 ? "REGRA 8 · XEN NÃO É O DESTINO · É UM VAZAMENTO DA FERIDA" : "RUÍNAS · UMA FENDA QUE ABRE SOZINHA"}</div>
      {ph2 && f >= alyxAt ? (
        <div style={{ position: "absolute", left: 300, bottom: 90, width: 1320, opacity: P(f, alyxAt, 8) }}>
          <div style={{ fontSize: 30, letterSpacing: 3, color: "rgba(255,226,176,0.5)", textDecoration: "line-through", textDecorationColor: RED }}>ALYX APERTOU UM BOTÃO “XEN”</div>
          {f >= heldAt ? <div style={{ fontSize: 30, letterSpacing: 3, color: ICE, marginTop: 8, opacity: P(f, heldAt, 8) }}>ELA RECONHECEU A RUPTURA E MANTEVE ABERTA</div> : null}
          {f >= knowsAt ? <div style={{ fontSize: 24, letterSpacing: 3, color: "#e2c9ff", marginTop: 8, opacity: P(f, knowsAt, 8) }}>ENTENDE O BOREALIS MELHOR DO QUE DEIXA O GORDON PERCEBER</div> : null}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ============================================================================================ 7 · 10) a base no litoral: ordens autorizadas pela Alyx
export const HLCoastOrders: React.FC<{ life: number; crossAt?: number; notShipAt?: number; baseAt?: number; notAloneAt?: number; ordersAt?: number; troopsAt?: number; coordAt?: number; authAt?: number; noFakeAt?: number; workAt?: number }> = ({
  life,
  crossAt = 0,
  notShipAt = 1e9,
  baseAt = 1e9,
  notAloneAt = 1e9,
  ordersAt = 1e9,
  troopsAt = 1e9,
  coordAt = 1e9,
  authAt = 1e9,
  noFakeAt = 1e9,
  workAt = 1e9,
}) => {
  const f = useCurrentFrame();
  void life;
  void crossAt;
  void notAloneAt;
  const rows = [
    { t: "ORDEM 4471 · MOVIMENTAÇÃO DE TROPAS · SETOR 9", at: troopsAt },
    { t: "ORDEM 4478 · COORDENADAS · SALTO 12 DO BOREALIS", at: coordAt },
    { t: "ORDEM 4480 · COORDENADAS · SALTO 13 DO BOREALIS", at: coordAt + 10 },
  ];
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, #170808 0%, #050202 75%)", overflow: "hidden", fontFamily: MONO }}>
      <div style={{ position: "absolute", left: 70, top: 56, color: RED, letterSpacing: 6, fontSize: 22 }}>{f >= baseAt ? "INSTALAÇÃO COMBINE · LITORAL DO ÁRTICO" : "ATRAVESSANDO A FENDA"}</div>
      {f >= notShipAt && f < baseAt ? <div style={{ position: "absolute", left: 0, right: 0, top: 480, textAlign: "center", fontSize: 40, letterSpacing: 6, color: "rgba(255,226,176,0.6)", textDecoration: "line-through", textDecorationColor: RED, opacity: P(f, notShipAt, 8) }}>DE VOLTA AO NAVIO</div> : null}
      {f >= ordersAt ? (
        <div style={{ position: "absolute", left: 200, top: 200, width: 1520, padding: "20px 24px", border: `1px solid ${RED}`, background: "rgba(14,4,4,0.9)", borderRadius: 8, opacity: P(f, ordersAt, 8) }}>
          <div style={{ fontSize: 16, letterSpacing: 5, color: RED }}>TERMINAL · ORDENS RECENTES</div>
          {rows.map((r, i) =>
            f >= r.at ? (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 24, color: CREAM, padding: "14px 0", borderBottom: "1px solid rgba(255,93,77,0.2)", opacity: flickIn(f, r.at) }}>
                <span>{r.t}</span>
                {f >= authAt ? <span style={{ padding: "4px 12px", border: `2px solid ${ICE}`, color: ICE, fontSize: 18, letterSpacing: 3, transform: "rotate(-3deg)", opacity: P(f, authAt + i * 4, 6) }}>AUTORIZADO · ALYX VANCE</span> : null}
              </div>
            ) : null,
          )}
        </div>
      ) : null}
      {f >= workAt ? <div style={{ position: "absolute", left: 0, right: 0, bottom: 110, textAlign: "center", fontSize: 40, letterSpacing: 6, color: RED, opacity: P(f, workAt, 8) }}>ELA ESTÁ TRABALHANDO COM OS COMBINE</div> : null}
      {f >= noFakeAt && f < workAt ? <div style={{ position: "absolute", left: 0, right: 0, bottom: 110, textAlign: "center", fontSize: 26, letterSpacing: 4, color: CREAM, opacity: P(f, noFakeAt, 8) }}>NÃO FOI UM MAL-ENTENDIDO</div> : null}
    </AbsoluteFill>
  );
};

// ============================================================================================ 7 · 11) o Barney
export const HLBarneyCell: React.FC<{ life: number; escapeAt?: number; wingAt?: number; foodAt?: number; openAt?: number; barneyAt?: number; olderAt?: number; wreckAt?: number; angryAt?: number; aliveAt?: number; beerAt?: number; threeAt?: number; shotAt?: number; gunAt?: number; dogAt?: number }> = ({
  life,
  escapeAt = 0,
  wingAt = 1e9,
  foodAt = 1e9,
  openAt = 1e9,
  barneyAt = 1e9,
  olderAt = 1e9,
  wreckAt = 1e9,
  angryAt = 1e9,
  aliveAt = 1e9,
  beerAt = 1e9,
  threeAt = 1e9,
  shotAt = 1e9,
  gunAt = 1e9,
  dogAt = 1e9,
}) => {
  const f = useCurrentFrame();
  void life;
  void escapeAt;
  const team = f >= threeAt;
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, #0f0d0a 0%, #040303 75%)", overflow: "hidden", fontFamily: MONO }}>
      <div style={{ position: "absolute", left: 70, top: 56, color: AMB, letterSpacing: 6, fontSize: 22, opacity: P(f, wingAt, 8) }}>ALA DE DETENÇÃO</div>
      {!team ? (
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          {Array.from({ length: 6 }).map((_, i) => {
            const x = 220 + i * 260;
            const open = i === 3 && f >= openAt;
            return (
              <g key={i} opacity={P(f, wingAt + i * 3, 8)}>
                <rect x={x} y={300} width={200} height={300} fill="none" stroke="rgba(255,178,46,0.5)" strokeWidth={2} />
                {Array.from({ length: 6 }).map((_, k) => (
                  <line key={k} x1={x + 20 + k * 32 + (open ? 180 * P(f, openAt, 14) : 0)} x2={x + 20 + k * 32 + (open ? 180 * P(f, openAt, 14) : 0)} y1={300} y2={600} stroke={AMB} strokeWidth={3} opacity={open ? 1 - P(f, openAt, 14) * 0.7 : 1} />
                ))}
              </g>
            );
          })}
          {f >= foodAt && f < openAt + 10 ? (
            <g opacity={P(f, foodAt, 8)}>
              <polyline points={Array.from({ length: 50 }).map((_, i) => `${1000 + i * 8},${700 + 24 * Math.sin(i * 0.8 + f / 2) * rnd(i + Math.floor(f / 2))}`).join(" ")} fill="none" stroke={AMB} strokeWidth={2} />
              <text x={1000} y={760} fill={AMB} fontFamily={MONO} fontSize={16} letterSpacing={3}>
                ALGUÉM RECLAMANDO DA COMIDA
              </text>
            </g>
          ) : null}
        </svg>
      ) : null}
      {f >= barneyAt && !team ? (
        <div style={{ position: "absolute", left: 560, top: 640, width: 800, padding: "18px 22px", border: `1px solid ${ICE}`, background: "rgba(3,8,12,0.92)", borderRadius: 8, opacity: P(f, barneyAt, 8) }}>
          <div style={{ fontSize: 15, letterSpacing: 5, color: ICE }}>DETENTO IDENTIFICADO</div>
          <div style={{ fontSize: 48, letterSpacing: 4, color: CREAM }}>BARNEY CALHOUN</div>
          <div style={{ display: "flex", gap: 24, marginTop: 10, fontSize: 18, letterSpacing: 3 }}>
            {f >= olderAt ? <span style={{ color: AMB }}>MAIS VELHO</span> : null}
            {f >= wreckAt ? <span style={{ color: AMB }}>ACABADO</span> : null}
            {f >= angryAt ? <span style={{ color: RED }}>HUMOR · PÉSSIMO</span> : null}
            {f >= aliveAt ? <span style={{ color: GREEN }}>VIVO</span> : null}
          </div>
          {f >= beerAt ? <div style={{ fontSize: 22, letterSpacing: 3, color: "#ffcf6a", marginTop: 12, opacity: P(f, beerAt, 8) }}>DÍVIDA PENDENTE · 1 CERVEJA (GORDON)</div> : null}
        </div>
      ) : null}
      {team ? (
        <div style={{ position: "absolute", left: 160, right: 160, top: 300, display: "flex", gap: 40 }}>
          {[
            { k: "BARNEY", v: "ESPINGARDA", at: shotAt, c: ICE },
            { k: "GORDON", v: "GRAVITY GUN", at: gunAt, c: AMB },
            { k: "DOG", v: "FORÇA BRUTA", at: dogAt, c: CREAM },
          ].map((m, i) => (
            <div key={i} style={{ flex: 1, padding: "24px 26px", border: `1px solid ${m.c}`, background: "rgba(3,8,12,0.88)", borderRadius: 8, opacity: f >= m.at ? flickIn(f, m.at) : 0.15 }}>
              <div style={{ fontSize: 36, letterSpacing: 4, color: m.c }}>{m.k}</div>
              <div style={{ fontSize: 20, letterSpacing: 3, color: CREAM, marginTop: 8 }}>{m.v}</div>
            </div>
          ))}
          <div style={{ position: "absolute", left: 0, right: 0, top: -90, textAlign: "center", fontSize: 26, letterSpacing: 6, color: AMB }}>A FUGA · A TRÊS</div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ============================================================================================ 7 · 12) o gesto
export const HLGesture: React.FC<{ life: number; sawAt?: number; roomAt?: number; advAt?: number; notFreeAt?: number; silentAt?: number; gestAt?: number; knewAt?: number; bmAt?: number; calmAt?: number; doubtAt?: number; proofAt?: number; hintAt?: number }> = ({
  life,
  sawAt = 0,
  roomAt = 1e9,
  advAt = 1e9,
  notFreeAt = 1e9,
  silentAt = 1e9,
  gestAt = 1e9,
  knewAt = 1e9,
  bmAt = 1e9,
  calmAt = 1e9,
  doubtAt = 1e9,
  proofAt = 1e9,
  hintAt = 1e9,
}) => {
  const f = useCurrentFrame();
  void life;
  void sawAt;
  const scale = f >= doubtAt;
  const tilt = f >= hintAt ? -14 + 6 * P(f, hintAt, 20) : f >= proofAt ? -14 * P(f, proofAt, 20) : 0;
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, #0b141a 0%, #020406 75%)", overflow: "hidden", fontFamily: MONO }}>
      <div style={{ position: "absolute", left: 70, top: 56, color: AMB, letterSpacing: 6, fontSize: 22 }}>RELATO DO BARNEY</div>
      {!scale ? (
        <div style={{ position: "absolute", left: 300, top: 220, width: 1320 }}>
          <CardRow f={f} at={roomAt} k="SALA" v="INTERROGATÓRIO" />
          <CardRow f={f} at={advAt} k="ALYX ENTROU" v="COM UM ADVISOR" c={RED} />
          <CardRow f={f} at={notFreeAt} k="TENTOU LIBERTÁ-LO" v="NÃO" c={RED} />
          <CardRow f={f} at={silentAt} k="DISSE ALGUMA COISA" v="NÃO · SÓ OLHOU" />
          <CardRow f={f} at={gestAt} k="ANTES DE SAIR" v="UM GESTO PEQUENO COM A MÃO" c={ICE} />
          {f >= knewAt ? (
            <div style={{ marginTop: 40, textAlign: "center", opacity: P(f, knewAt, 8) }}>
              <div style={{ fontSize: 20, letterSpacing: 5, color: ICE }}>O BARNEY RECONHECEU</div>
              {f >= bmAt ? <div style={{ fontSize: 26, letterSpacing: 4, color: CREAM, marginTop: 10, opacity: P(f, bmAt, 8) }}>O GESTO QUE ELE USAVA COM A ALYX EM BLACK MESA</div> : null}
              {f >= calmAt ? <div style={{ fontSize: 56, letterSpacing: 6, color: ICE, marginTop: 16, opacity: P(f, calmAt, 8) }}>“FICA TRANQUILO”</div> : null}
            </div>
          ) : null}
        </div>
      ) : (
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          <g transform={`translate(960 560) rotate(${tilt})`}>
            <line x1={-500} x2={500} y1={0} y2={0} stroke={CREAM} strokeWidth={4} />
            <rect x={-560} y={-110} width={220} height={100} fill="rgba(255,93,77,0.12)" stroke={RED} strokeWidth={2} opacity={P(f, proofAt, 8)} />
            <text x={-450} y={-52} textAnchor="middle" fill={RED} fontFamily={MONO} fontSize={18} letterSpacing={3} opacity={P(f, proofAt, 8)}>PROVAS</text>
            <rect x={340} y={-70} width={220} height={60} fill="rgba(159,230,255,0.12)" stroke={ICE} strokeWidth={2} opacity={P(f, hintAt, 8)} />
            <text x={450} y={-32} textAnchor="middle" fill={ICE} fontFamily={MONO} fontSize={18} letterSpacing={3} opacity={P(f, hintAt, 8)}>UM GESTO</text>
          </g>
          <path d="M 940 600 L 960 560 L 980 600 Z" fill={CREAM} />
          <text x={960} y={760} textAnchor="middle" fill={CREAM} fontFamily={MONO} fontSize={26} letterSpacing={5}>A DÚVIDA CONTINUA</text>
        </svg>
      )}
    </AbsoluteFill>
  );
};

// ============================================================================================ 7 · 13) a frota
export const HLFleetFiles: React.FC<{ life: number; stealAt?: number; fleetAt?: number; kleinerAt?: number; filesAt?: number; knowAt?: number; nextAt?: number }> = ({ life, stealAt = 0, fleetAt = 1e9, kleinerAt = 1e9, filesAt = 1e9, knowAt = 1e9, nextAt = 1e9 }) => {
  const f = useCurrentFrame();
  const go = interpolate(f, [stealAt, fleetAt + 20], [0, 1], { ...C, easing: Easing.inOut(Easing.quad) });
  const opened = Math.round(interpolate(f, [filesAt, filesAt + 60], [0, 37], C));
  const fade = interpolate(f, [life - 30, life], [1, 0], C);
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, #0a1218 0%, #020406 75%)", overflow: "hidden", fontFamily: MONO, opacity: fade }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: 1 - P(f, kleinerAt, 12) * 0.7 }}>
        <path d="M 0 860 C 400 820 800 900 1200 850 C 1500 820 1700 870 1920 840 L 1920 1080 L 0 1080 Z" fill="#16301f" stroke="rgba(141,255,168,0.35)" strokeWidth={3} />
        {[0, 1, 2, 3, 4, 5].map((k) => (
          <rect key={k} x={1200 + k * 60} y={810 + (k % 2) * 10} width={44} height={20} rx={3} fill="#2a1d0c" stroke={AMB} strokeWidth={2} />
        ))}
        <text x={1200} y={790} fill={AMB} fontFamily={MONO} fontSize={18} letterSpacing={3} opacity={P(f, fleetAt, 8)}>
          FROTA DA RESISTÊNCIA
        </text>
        <g transform={`translate(${200 + go * 1100} ${420 + go * 360})`}>
          <path d="M -40 0 L 40 0 L 30 -18 L -30 -18 Z" fill="none" stroke={RED} strokeWidth={3} />
          <text x={50} y={-6} fill={CREAM} fontFamily={MONO} fontSize={16} letterSpacing={3}>
            TRANSPORTE ROUBADO
          </text>
        </g>
      </svg>
      {f >= kleinerAt ? (
        <div style={{ position: "absolute", left: 300, top: 260, width: 1320, padding: "22px 26px", border: `1px solid ${GREEN}`, background: "rgba(4,14,8,0.9)", borderRadius: 8, opacity: P(f, kleinerAt, 10) }}>
          <div style={{ fontSize: 16, letterSpacing: 5, color: GREEN }}>DR. KLEINER · ARQUIVOS DA DRA. MOSSMAN</div>
          <div style={{ fontSize: 40, color: CREAM, marginTop: 10 }}>{`${opened}% DECIFRADO`}</div>
          <div style={{ height: 16, border: `1px solid ${GREEN}`, marginTop: 10, position: "relative" }}>
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${opened}%`, background: GREEN }} />
          </div>
          {f >= knowAt ? <div style={{ fontSize: 24, letterSpacing: 3, color: CREAM, marginTop: 24, opacity: P(f, knowAt, 8) }}>SABEMOS · OS COMBINE ESTÃO TRABALHANDO NO BOREALIS</div> : null}
          {f >= nextAt ? <div style={{ fontSize: 24, letterSpacing: 3, color: RED, marginTop: 10, opacity: P(f, nextAt, 8) }}>A SEGUIR · O QUE ELES ESTÃO TENTANDO ALCANÇAR</div> : null}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ============================================================================================ 4C · 0) a órbita da memória
// núcleo de identidade com fragmentos orbitando, presos por um fio (continuidade). Na pergunta: um fragmento cai, o fio
// arrebenta e o núcleo vira "?"; ele volta. "A Alyx lembra de quem ela é": o núcleo vira ALYX VANCE e cada memória entra
// em TELA CHEIA (vídeo real) e encolhe até virar um fragmento na órbita. "A memória para aí": a órbita congela e abre um
// vazio escuro depois do último fragmento.
type OFrag = { label: string; at: number; src: string; from: number; pos?: string; bright?: number; rate?: number };
export const HLMemoryOrbit: React.FC<{ life: number; qAt?: number; dropAt?: number; backAt?: number; whoAt?: number; frags?: OFrag[]; stopAt?: number }> = ({
  life,
  qAt = 0,
  dropAt = 1e9,
  backAt = 1e9,
  whoAt = 1e9,
  frags = [],
  stopAt = 1e9,
}) => {
  const f = useCurrentFrame();
  void life;
  const CX = 960;
  const CY = 560;
  const RX = 520;
  const RY = 300;
  const frozen = f >= stopAt;
  const spin = (frozen ? stopAt : f) * 0.004;
  const N = Math.max(frags.length, 8);
  const slot = (i: number) => {
    const a = -Math.PI / 2 + (i / N) * Math.PI * 2 + spin;
    return { x: CX + Math.cos(a) * RX, y: CY + Math.sin(a) * RY, z: Math.sin(a) };
  };
  // fase da pergunta: fragmentos genéricos (só luz), um cai e volta
  const demo = f < whoAt;
  const demoN = 6;
  const dropped = f >= dropAt && f < backAt;
  const dropT = P(f, dropAt, 16) * (1 - P(f, backAt, 14));
  const who = P(f, whoAt, 14);
  const shown = frags.filter((q) => f >= q.at);
  const cur = shown.length ? shown[shown.length - 1] : null;
  const curIdx = shown.length - 1;
  const fly = cur ? P(f, cur.at + 9, 18) : 1; // 0 = tela cheia, 1 = no lugar
  const R = 78;
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 52%, #0e1a24 0%, #020406 72%)", overflow: "hidden", fontFamily: MONO }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <ellipse cx={CX} cy={CY} rx={RX} ry={RY} fill="none" stroke="rgba(159,230,255,0.12)" strokeWidth={2} strokeDasharray="4 10" />
        {/* o fio da continuidade */}
        {demo
          ? Array.from({ length: demoN }).map((_, i) => {
              const a = slot(i * (N / demoN));
              const b = slot(((i + 1) % demoN) * (N / demoN));
              const broken = dropped && (i === 1 || i === 2);
              return broken ? null : <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={ICE} strokeWidth={2} opacity={0.5 * P(f, qAt + i * 4, 10)} />;
            })
          : shown.map((q, i) => {
              if (i === 0) return null;
              const a = slot(i - 1);
              const b = slot(i);
              return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={ICE} strokeWidth={2.5} opacity={i === curIdx ? fly * 0.8 : 0.8} />;
            })}
        {/* o vazio depois da última memória */}
        {frozen
          ? (() => {
              const a0 = -Math.PI / 2 + (shown.length / N) * Math.PI * 2 + spin - 0.25;
              const a1 = -Math.PI / 2 + Math.PI * 2 + spin - 0.25;
              const path = Array.from({ length: 30 })
                .map((_, k) => {
                  const a = a0 + ((a1 - a0) * k) / 29;
                  return `${k ? "L" : "M"} ${CX + Math.cos(a) * RX} ${CY + Math.sin(a) * RY}`;
                })
                .join(" ");
              return <path d={path} fill="none" stroke={RED} strokeWidth={6} strokeDasharray="14 10" opacity={P(f, stopAt, 12)} />;
            })()
          : null}
        {/* núcleo */}
        <circle cx={CX} cy={CY} r={110 + 6 * Math.sin(f / 8)} fill="rgba(159,230,255,0.06)" stroke={dropped ? RED : ICE} strokeWidth={3} />
        <circle cx={CX} cy={CY} r={140 + 10 * Math.sin(f / 11)} fill="none" stroke={ICE} strokeWidth={1} opacity={0.3} />
        {/* fragmentos genéricos da pergunta */}
        {demo
          ? Array.from({ length: demoN }).map((_, i) => {
              const s = slot(i * (N / demoN));
              const fall = i === 2 ? dropT : 0;
              return (
                <g key={i} opacity={P(f, qAt + i * 4, 10) * (1 - who) * (1 - fall * 0.8)}>
                  <circle cx={s.x} cy={s.y + fall * 300} r={46} fill={`hsla(${190 + i * 22},60%,60%,0.18)`} stroke={ICE} strokeWidth={2} />
                  <circle cx={s.x} cy={s.y + fall * 300} r={20} fill={`hsla(${190 + i * 22},70%,70%,0.35)`} />
                </g>
              );
            })
          : null}
      </svg>
      {/* memórias reais nos lugares (as já assentadas) */}
      {!demo
        ? shown.map((q, i) => {
            if (i === curIdx && fly < 1) return null;
            const s = slot(i);
            return (
              <div key={i} style={{ position: "absolute", left: s.x - R, top: s.y - R, width: R * 2, height: R * 2, borderRadius: R, overflow: "hidden", border: `3px solid ${ICE}`, boxShadow: "0 0 24px rgba(159,230,255,0.35)" }}>
                <Sequence from={Math.round(q.at)} layout="none">
                  <div style={{ position: "absolute", inset: 0, filter: `saturate(0.7) brightness(${q.bright ?? 1})` }}>
                    <Clip src={q.src} from={q.from} rate={q.rate ?? 0.7} style={{ objectPosition: q.pos ?? "50% 50%" }} />
                  </div>
                </Sequence>
              </div>
            );
          })
        : null}
      {/* rótulos das memórias assentadas */}
      {!demo && fly > 0.8
        ? shown.map((q, i) => {
            if (i === curIdx && fly < 1) return null;
            const s = slot(i);
            return (
              <div key={"t" + i} style={{ position: "absolute", left: s.x - 120, top: s.y + R + 8, width: 240, textAlign: "center", fontSize: 15, letterSpacing: 3, color: CREAM, textShadow: "0 2px 8px #000" }}>
                {q.label}
              </div>
            );
          })
        : null}
      {/* centro */}
      <div style={{ position: "absolute", left: CX - 140, top: CY - 40, width: 280, textAlign: "center", opacity: demo ? 1 : Math.max(0, (fly - 0.6) / 0.4) }}>
        {demo ? (
          <div style={{ fontSize: dropped ? 70 : 20, letterSpacing: 4, color: dropped ? RED : ICE, opacity: dropped ? (Math.floor(f / 4) % 2 ? 1 : 0.4) : P(f, qAt, 10) }}>{dropped ? "?" : "QUEM A GENTE É"}</div>
        ) : (
          <>
            <div style={{ fontSize: 14, letterSpacing: 5, color: ICE, opacity: who }}>IDENTIDADE</div>
            <div style={{ fontSize: 30, letterSpacing: 4, color: CREAM, opacity: who }}>ALYX VANCE</div>
          </>
        )}
      </div>
      {/* a pergunta, pequena, em cima */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 70, textAlign: "center", fontSize: 26, letterSpacing: 5, color: CREAM, opacity: P(f, qAt, 10) * (1 - who) }}>ATÉ ONDE A MEMÓRIA FAZ PARTE DE QUEM A GENTE É?</div>
      {dropped ? <div style={{ position: "absolute", left: 0, right: 0, top: 120, textAlign: "center", fontSize: 18, letterSpacing: 5, color: RED }}>SEM ESSA MEMÓRIA, O FIO ARREBENTA</div> : null}
      {frozen ? <div style={{ position: "absolute", left: 0, right: 0, bottom: 80, textAlign: "center", fontSize: 34, letterSpacing: 6, color: RED, opacity: P(f, stopAt + 8, 10) }}>A MEMÓRIA DELA PARA AQUI</div> : null}
      {/* a memória que acabou de entrar: tela cheia → encolhe até o lugar */}
      {!demo && cur && fly < 1
        ? (() => {
            const s = slot(curIdx);
            const w = 1920 + (R * 2 - 1920) * fly;
            const h = 1080 + (R * 2 - 1080) * fly;
            const x = (s.x - R) * fly;
            const y = (s.y - R) * fly;
            return (
              <div style={{ position: "absolute", left: x, top: y, width: w, height: h, borderRadius: R * fly, overflow: "hidden", border: `3px solid rgba(159,230,255,${fly})` }}>
                <Sequence from={Math.round(cur.at)} layout="none">
                  <div style={{ position: "absolute", inset: 0, filter: `brightness(${1 + ((cur.bright ?? 1) - 1) * fly})` }}>
                    <Clip src={cur.src} from={cur.from} rate={cur.rate ?? 0.7} style={{ objectPosition: cur.pos ?? "50% 50%" }} />
                  </div>
                </Sequence>
                <div style={{ position: "absolute", left: 0, right: 0, bottom: 120 * (1 - fly) + 10, textAlign: "center", fontSize: 70 - 50 * fly, letterSpacing: 6, color: CREAM, textShadow: "0 4px 24px #000" }}>{cur.label}</div>
              </div>
            );
          })()
        : null}
      <div style={{ position: "absolute", left: 70, top: 56, fontFamily: MONO, color: ICE, letterSpacing: 6, fontSize: 20, opacity: who }}>MEMÓRIA · ALYX VANCE</div>
    </AbsoluteFill>
  );
};

// ============================================================================================ 6 · 3a) a instalação presa
// o navio em wireframe com a instalação Combine (vermelha) presa no casco; depois quatro monitores do HEV entram, um por
// fala: relógios × registros (semanas × décadas), contatos (soldados zumbis de armadura), equipamentos sem operador e as
// marcas na parede (riscos de contagem que não param de aparecer).
const MonBox: React.FC<{ f: number; at: number; x: number; y: number; w: number; h: number; title: string; col?: string; children?: React.ReactNode }> = ({ f, at, x, y, w, h, title, col = ICE, children }) =>
  f >= at ? (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, border: `1px solid ${col}`, background: "rgba(4,10,14,0.86)", borderRadius: 8, overflow: "hidden", opacity: flickIn(f, at), transform: `scale(${0.94 + 0.06 * P(f, at, 10)})` }}>
      <div style={{ position: "absolute", left: 16, top: 12, fontSize: 15, letterSpacing: 4, color: col, fontFamily: MONO }}>{title}</div>
      {children}
    </div>
  ) : null;

export const HLStuckBase: React.FC<{ life: number; hullAt?: number; clocksAt?: number; logsAt?: number; zombAt?: number; armorAt?: number; gearAt?: number; marksAt?: number; longAt?: number }> = ({
  life,
  hullAt = 0,
  clocksAt = 1e9,
  logsAt = 1e9,
  zombAt = 1e9,
  armorAt = 1e9,
  gearAt = 1e9,
  marksAt = 1e9,
  longAt = 1e9,
}) => {
  const f = useCurrentFrame();
  void life;
  const cam: Cam = { fx: -4, fy: 0, yaw: -0.5 + f * 0.0015, pitch: 0.4, dist: 120 - 30 * P(f, 0, 120), cx: 470, cy: 620, F: 900 };
  const comb: [number, number, number][][] = [
    [[-12, -5, 0], [8, -5, 0], [10, 0, 0], [8, 5, 0], [-12, 5, 0], [-14, 0, 0], [-12, -5, 0]],
    [[-12, -5, 6], [8, -5, 6], [10, 0, 6], [8, 5, 6], [-12, 5, 6], [-14, 0, 6], [-12, -5, 6]],
  ];
  // relógio: ponteiro rodando rápido; registros: anos rolando
  const ang = (f - clocksAt) * 0.22;
  const yrs = Math.floor(interpolate(f, [logsAt, logsAt + 40], [1, 34], C));
  // zumbis de armadura: pontos que arrastam
  const zs = [0, 1, 2].map((i) => ({ x: 120 + i * 120 + Math.sin((f + i * 40) / 30) * 18, y: 150 + i * 50 + ((f * 0.15 + i * 30) % 60) }));
  // marcas na parede: riscos de 5 em 5, cada vez mais rápido
  const nMarks = Math.floor(Math.max(0, f - marksAt) * 0.6 + Math.max(0, f - longAt) * 2.2);
  const marks = Math.min(nMarks, 120);
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 30% 55%, #140a08 0%, #030202 75%)", overflow: "hidden", fontFamily: MONO }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <Ship cam={cam} col="rgba(159,230,255,0.55)" draw={P(f, 0, 30)} />
        <g opacity={P(f, hullAt, 12) * (0.75 + 0.25 * Math.sin(f / 6))}>
          {comb.map((c, i) => (
            <polyline key={i} points={pts(cam, c)} fill={i === 0 ? "rgba(255,93,77,0.16)" : "none"} stroke={RED} strokeWidth={2.5} />
          ))}
          {[[-12, -5], [8, -5], [8, 5], [-12, 5]].map(([x, y], i) => (
            <polyline key={"v" + i} points={pts(cam, [[x, y, 0], [x, y, 6]])} stroke={RED} strokeWidth={2} />
          ))}
        </g>
        {f >= hullAt
          ? (() => {
              const [x, y] = proj(cam, -2, 0, 6);
              return (
                <g opacity={P(f, hullAt + 6, 10)}>
                  <line x1={x} y1={y} x2={x + 60} y2={y - 150} stroke={RED} strokeWidth={1.5} />
                  <line x1={x + 60} y1={y - 150} x2={x + 330} y2={y - 150} stroke={RED} strokeWidth={1.5} />
                  <text x={x + 66} y={y - 162} fill={RED} fontFamily={MONO} fontSize={17} letterSpacing={3}>
                    INSTALAÇÃO · PRESA AO CASCO
                  </text>
                </g>
              );
            })()
          : null}
      </svg>
      <div style={{ position: "absolute", left: 70, top: 56, color: RED, letterSpacing: 6, fontSize: 22, opacity: P(f, 0, 8) }}>BOREALIS · CONVÉS INFERIOR</div>
      {/* 1) relógios × registros */}
      <MonBox f={f} at={clocksAt} x={940} y={130} w={440} h={400} title="TEMPO · LEITURAS" col={AMB}>
        <svg width={440} height={400} style={{ position: "absolute", inset: 0 }}>
          <circle cx={120} cy={190} r={74} fill="none" stroke={AMB} strokeWidth={2.5} />
          {Array.from({ length: 12 }).map((_, i) => {
            const a = (i / 12) * Math.PI * 2;
            return <line key={i} x1={120 + Math.cos(a) * 64} y1={190 + Math.sin(a) * 64} x2={120 + Math.cos(a) * 72} y2={190 + Math.sin(a) * 72} stroke={AMB} strokeWidth={2} />;
          })}
          <line x1={120} y1={190} x2={120 + Math.sin(ang) * 58} y2={190 - Math.cos(ang) * 58} stroke={CREAM} strokeWidth={3} />
          <line x1={120} y1={190} x2={120 + Math.sin(ang / 12) * 38} y2={190 - Math.cos(ang / 12) * 38} stroke={CREAM} strokeWidth={4} />
          <text x={120} y={308} textAnchor="middle" fill={CREAM} fontFamily={MONO} fontSize={18} letterSpacing={3}>RELÓGIOS</text>
          <text x={120} y={340} textAnchor="middle" fill={AMB} fontFamily={MONO} fontSize={26} letterSpacing={3}>SEMANAS</text>
          <line x1={225} y1={80} x2={225} y2={360} stroke="rgba(255,178,46,0.3)" />
        </svg>
        {f >= logsAt ? (
          <div style={{ position: "absolute", left: 245, top: 70, width: 180, opacity: P(f, logsAt, 8) }}>
            {Array.from({ length: 6 }).map((_, i) => {
              const y = Math.max(1, yrs - 5 + i);
              return (
                <div key={i} style={{ fontSize: 17, color: i === 5 ? CREAM : "rgba(255,226,176,0.45)", letterSpacing: 2, padding: "4px 0", borderBottom: "1px solid rgba(255,178,46,0.15)" }}>
                  {`REG · ANO ${String(y).padStart(2, "0")}`}
                </div>
              );
            })}
            <div style={{ fontSize: 18, letterSpacing: 3, color: CREAM, marginTop: 22, textAlign: "center" }}>REGISTROS</div>
            <div style={{ fontSize: 26, letterSpacing: 3, color: RED, marginTop: 6, textAlign: "center", opacity: P(f, logsAt + 20, 8) }}>DÉCADAS</div>
          </div>
        ) : null}
      </MonBox>
      {/* 2) contatos: soldados zumbis */}
      <MonBox f={f} at={zombAt} x={1410} y={130} w={440} h={400} title="CONTATOS · HOSTIS" col={RED}>
        <svg width={440} height={400} style={{ position: "absolute", inset: 0 }}>
          <circle cx={220} cy={220} r={150} fill="none" stroke="rgba(255,93,77,0.25)" />
          <circle cx={220} cy={220} r={90} fill="none" stroke="rgba(255,93,77,0.2)" />
          <line x1={220} y1={220} x2={220 + Math.cos(f / 12) * 150} y2={220 + Math.sin(f / 12) * 150} stroke={RED} strokeWidth={2} opacity={0.6} />
          {zs.map((z, i) => (
            <g key={i} opacity={P(f, zombAt + i * 6, 8)}>
              <circle cx={z.x} cy={z.y} r={8} fill={RED} opacity={0.4 + 0.6 * Math.abs(Math.sin((f + i * 9) / 7))} />
              <circle cx={z.x} cy={z.y} r={16} fill="none" stroke={RED} strokeWidth={1.5} />
            </g>
          ))}
        </svg>
        <div style={{ position: "absolute", left: 16, bottom: 46, fontSize: 18, letterSpacing: 3, color: CREAM }}>SOLDADOS COMBINE</div>
        <div style={{ position: "absolute", left: 16, bottom: 16, fontSize: 18, letterSpacing: 3, color: RED, opacity: P(f, armorAt, 8) }}>{f >= armorAt ? "ZUMBIS · AINDA DE ARMADURA" : "SINAL VITAL · NENHUM"}</div>
      </MonBox>
      {/* 3) equipamentos sem operador */}
      <MonBox f={f} at={gearAt} x={940} y={560} w={440} h={400} title="EQUIPAMENTOS" col={ICE}>
        <div style={{ position: "absolute", left: 22, right: 22, top: 70 }}>
          {[0, 1, 2, 3].map((i) => {
            const v = 30 + 60 * Math.abs(Math.sin((f + i * 23) / (10 + i * 3)));
            return (
              <div key={i} style={{ marginBottom: 22 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, letterSpacing: 2, color: CREAM }}>
                  <span>{["BOMBA 02", "GERADOR B", "SCANNER 7", "PRENSA"][i]}</span>
                  <span style={{ color: GREEN }}>OPERANDO</span>
                </div>
                <div style={{ height: 10, background: "rgba(159,230,255,0.12)", marginTop: 6, position: "relative" }}>
                  <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${v}%`, background: ICE }} />
                </div>
              </div>
            );
          })}
          <div style={{ fontSize: 20, letterSpacing: 4, color: AMB, marginTop: 6, opacity: Math.floor(f / 15) % 2 ? 1 : 0.35 }}>OPERADOR · NENHUM</div>
        </div>
      </MonBox>
      {/* 4) marcas na parede */}
      <MonBox f={f} at={marksAt} x={1410} y={560} w={440} h={400} title="PAREDE · SALA 3" col={CREAM}>
        <svg width={440} height={400} style={{ position: "absolute", inset: 0 }}>
          {Array.from({ length: marks }).map((_, i) => {
            const g = Math.floor(i / 5);
            const k = i % 5;
            const gx = 30 + (g % 6) * 66;
            const gy = 70 + Math.floor(g / 6) * 62;
            const jit = (rnd(i * 1.7) - 0.5) * 4;
            return k < 4 ? (
              <line key={i} x1={gx + k * 11 + jit} y1={gy} x2={gx + k * 11 - jit} y2={gy + 42} stroke="rgba(255,226,176,0.85)" strokeWidth={3} strokeLinecap="round" />
            ) : (
              <line key={i} x1={gx - 6} y1={gy + 34} x2={gx + 42} y2={gy + 6} stroke={CREAM} strokeWidth={3} strokeLinecap="round" />
            );
          })}
        </svg>
        <div style={{ position: "absolute", left: 16, bottom: 16, fontSize: 18, letterSpacing: 3, color: f >= longAt ? RED : CREAM }}>{f >= longAt ? `${marks} DIAS · TEMPO DEMAIS` : "QUEM FICOU PRESO AQUI"}</div>
      </MonBox>
    </AbsoluteFill>
  );
};

// ============================================================================================ 6 · 3b) o que sobrou do Breen
// a estrutura Combine com cabos (sem corpo desenhado): um suporte vertical com um núcleo de luz âmbar, cabos pulsando.
// A voz é um monitor de fala embaixo. À direita, um painel que muda por fala: identificação → terminais da Mossman →
// linha do tempo (Cidadela cai, transferência interrompida, parte da consciência vai para os sistemas) → continuidade.
const BreenRig: React.FC<{ f: number; o: number; core: number; cx?: number }> = ({ f, o, core, cx = 450 }) => {
  const cables = Array.from({ length: 9 }).map((_, i) => {
    const sx = cx - 380 + i * 95;
    const ex = cx - 60 + (i % 3) * 60;
    const ey = 330 + Math.floor(i / 3) * 120;
    return { d: `M ${sx} 90 C ${sx} ${260 + i * 12} ${ex + (sx - ex) * 0.2} ${ey - 140} ${ex} ${ey}`, i };
  });
  return (
    <g opacity={o}>
      {cables.map((c) => (
        <g key={c.i}>
          <path d={c.d} fill="none" stroke="rgba(159,230,255,0.35)" strokeWidth={3} />
          <path d={c.d} fill="none" stroke={ICE} strokeWidth={3} strokeDasharray="10 120" strokeDashoffset={-(f * 3 + c.i * 37)} opacity={0.9} />
        </g>
      ))}
      {/* o suporte */}
      <rect x={cx - 110} y={300} width={220} height={430} rx={18} fill="rgba(159,230,255,0.04)" stroke={ICE} strokeWidth={3} />
      {Array.from({ length: 8 }).map((_, i) => (
        <line key={i} x1={cx - 90} x2={cx + 90} y1={340 + i * 50} y2={340 + i * 50} stroke={AMB} strokeWidth={1.5} opacity={0.35} strokeDasharray="5 7" />
      ))}
      <line x1={cx - 140} y1={740} x2={cx + 140} y2={740} stroke={ICE} strokeWidth={3} />
      {/* o núcleo: a mente que ficou */}
      <circle cx={cx} cy={470} r={40 + 6 * Math.sin(f / 7)} fill={`rgba(255,178,46,${0.12 + 0.3 * core})`} stroke={AMB} strokeWidth={2} opacity={0.4 + 0.6 * core} />
      <circle cx={cx} cy={470} r={14} fill={AMB} opacity={(0.3 + 0.7 * core) * (0.7 + 0.3 * Math.sin(f / 4))} />
    </g>
  );
};
const VoiceStrip: React.FC<{ f: number; w: number; h: number; amp: number; col?: string; seed?: number }> = ({ f, w, h, amp, col = ICE, seed = 0 }) => (
  <svg width={w} height={h} style={{ display: "block" }}>
    {Array.from({ length: Math.floor(w / 8) }).map((_, i) => {
      const v = (2 + (h * 0.8 - 2) * Math.abs(Math.sin(i * 0.45 + f * 0.35)) * rnd(i + Math.floor(f / 3) + seed)) * amp;
      const hh = Math.max(2, v);
      return <rect key={i} x={i * 8} y={h / 2 - hh / 2} width={4} height={hh} fill={col} opacity={0.8} />;
    })}
  </svg>
);

export const HLBreenRemains: React.FC<{
  life: number;
  cablesAt?: number;
  nearAt?: number;
  voiceAt?: number;
  nameAt?: number;
  idAt?: number;
  mindAt?: number;
  mossAt?: number;
  termAt?: number;
  findAt?: number;
  deadAt?: number;
  citAt?: number;
  xferAt?: number;
  hostAt?: number;
  cutAt?: number;
  conscAt?: number;
  sysAt?: number;
  keptAt?: number;
  neverAt?: number;
  weakAt?: number;
  repAt?: number;
  wordAt?: number;
  promAt?: number;
  bodyAt?: number;
  goesAt?: number;
}> = (p) => {
  const f = useCurrentFrame();
  const N = 1e9;
  const a = (v?: number) => v ?? N;
  void p.life;
  // fala do "Freeman": pico curto na voz
  const voice = f >= a(p.voiceAt) ? 0.15 + (f >= a(p.nameAt) && f < a(p.nameAt) + 25 ? 0.85 : 0.1 * Math.abs(Math.sin(f / 9))) : 0.03;
  const core = P(f, a(p.idAt), 14);
  const near = P(f, a(p.nearAt), 50);
  // fases do painel
  const ph = f >= a(p.weakAt) ? 3 : f >= a(p.deadAt) ? 2 : f >= a(p.mossAt) ? 1 : f >= a(p.idAt) ? 0 : -1;
  const X0 = 980;
  const line = 1500;
  const xf = interpolate(f, [a(p.xferAt), a(p.cutAt)], [0, 1], C);
  const cut = f >= a(p.cutAt);
  const barEnd = cut ? line : 1150 + (line - 1150) * xf;
  const termLines = [
    { at: a(p.termAt), s: "> suporte_vital.sys · ATIVO" },
    { at: a(p.termAt) + 18, s: "> transf_consciencia.log" },
    { at: a(p.termAt) + 36, s: "> sujeito: W. BREEN" },
    { at: a(p.findAt), s: "> O QUE ACONTECEU:" },
  ];
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 25% 50%, #0d1418 0%, #020304 75%)", overflow: "hidden", fontFamily: MONO }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <BreenRig f={f} o={P(f, 0, 20)} core={core} />
        {/* cabos se acendem */}
        <rect x={0} y={0} width={900} height={1080} fill="rgba(2,3,4,0.5)" opacity={1 - P(f, a(p.cablesAt), 20)} />
        {/* o Gordon se aproxima: mira do HEV fecha na estrutura */}
        {f >= a(p.nearAt) ? <Bracket x={450} y={500} w={560 - 300 * near} h={640 - 300 * near} col={AMB} o={P(f, a(p.nearAt), 8) * (1 - P(f, a(p.mossAt), 12))} label={`DIST ${Math.max(2, Math.round(14 - 12 * near))} m`} /> : null}
      </svg>
      <div style={{ position: "absolute", left: 70, top: 56, color: ICE, letterSpacing: 6, fontSize: 22 }}>INSTALAÇÃO · SALA DO FUNDO</div>
      {/* a voz */}
      <div style={{ position: "absolute", left: 70, top: 830, width: 760, opacity: P(f, a(p.voiceAt) - 10, 10) }}>
        <div style={{ fontSize: 15, letterSpacing: 5, color: ICE }}>{f >= a(p.weakAt) ? "VOZ · SINAL FRACO" : "VOZ · QUASE IRRECONHECÍVEL"}</div>
        <VoiceStrip f={f} w={760} h={110} amp={f >= a(p.weakAt) ? 0.18 : voice} />
        {f >= a(p.nameAt) && f < a(p.mossAt) ? <div style={{ position: "absolute", left: 300, top: -46, fontSize: 40, letterSpacing: 8, color: CREAM, opacity: flickIn(f, a(p.nameAt)) }}>“FREEMAN”</div> : null}
      </div>
      {/* 0) identificação */}
      {ph === 0 ? (
        <div style={{ position: "absolute", left: X0, top: 220, width: 820, padding: "26px 30px", border: `1px solid ${AMB}`, borderRadius: 10, background: "rgba(14,10,4,0.85)", opacity: P(f, a(p.idAt), 10) * (1 - P(f, a(p.mossAt) - 8, 8)) }}>
          <div style={{ fontSize: 16, letterSpacing: 5, color: AMB }}>IDENTIFICAÇÃO · PADRÃO NEURAL</div>
          <div style={{ fontSize: 64, letterSpacing: 4, color: CREAM, marginTop: 10 }}>DR. WALLACE BREEN</div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22, letterSpacing: 3, color: CREAM, marginTop: 26 }}>
            <span>CORRESPONDÊNCIA</span>
            <span style={{ color: AMB }}>{`${Math.round(interpolate(f, [a(p.idAt), a(p.idAt) + 40], [0, 62], C))}%`}</span>
          </div>
          <div style={{ height: 14, border: `1px solid ${AMB}`, marginTop: 10, position: "relative" }}>
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${interpolate(f, [a(p.idAt), a(p.idAt) + 40], [0, 62], C)}%`, background: AMB }} />
          </div>
          {f >= a(p.mindAt) ? <div style={{ fontSize: 24, letterSpacing: 4, color: ICE, marginTop: 24, opacity: P(f, a(p.mindAt), 8) }}>ALGUMA COISA QUE AINDA CARREGA A MENTE DELE</div> : null}
        </div>
      ) : null}
      {/* 1) Mossman nos terminais */}
      {ph === 1 ? (
        <div style={{ position: "absolute", left: X0, top: 200, width: 820, opacity: P(f, a(p.mossAt), 10) }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <svg width={60} height={60}>
              <circle cx={30} cy={30} r={22} fill="none" stroke={GREEN} strokeWidth={2} />
              <circle cx={30} cy={30} r={8} fill={GREEN} opacity={0.5 + 0.5 * Math.sin(f / 5)} />
            </svg>
            <div>
              <div style={{ fontSize: 15, letterSpacing: 5, color: GREEN }}>CONTATO · ALIADO</div>
              <div style={{ fontSize: 34, letterSpacing: 4, color: CREAM }}>DRA. JUDITH MOSSMAN</div>
            </div>
          </div>
          <div style={{ fontSize: 20, letterSpacing: 3, color: "rgba(255,226,176,0.7)", marginTop: 14 }}>{f >= a(p.termAt) ? "ACESSANDO OS TERMINAIS" : "PARADA · SEM ACREDITAR"}</div>
          <div style={{ marginTop: 26, padding: "18px 22px", border: `1px solid ${GREEN}`, background: "rgba(4,14,8,0.85)", borderRadius: 8, minHeight: 230 }}>
            {termLines.map((l, i) =>
              f >= l.at ? (
                <div key={i} style={{ fontSize: i === 3 ? 30 : 22, color: i === 3 ? CREAM : GREEN, letterSpacing: 2, marginBottom: 12 }}>
                  {typedS(f, l.at, l.s, 1.6)}
                  {f - l.at < l.s.length / 1.6 && Math.floor(f / 6) % 2 ? "▌" : ""}
                </div>
              ) : null,
            )}
          </div>
        </div>
      ) : null}
      {/* 2) a linha do tempo da transferência */}
      {ph === 2 ? (
        <>
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: P(f, a(p.deadAt), 10) }}>
            <line x1={X0} y1={330} x2={1840} y2={330} stroke="rgba(255,226,176,0.4)" strokeWidth={2} />
            {/* a queda da Cidadela */}
            <line x1={line} y1={180} x2={line} y2={900} stroke={RED} strokeWidth={2.5} strokeDasharray="8 6" />
            <g transform={`translate(${line} 330)`}>
              <line x1={-18} y1={-18} x2={18} y2={18} stroke={RED} strokeWidth={4} />
              <line x1={18} y1={-18} x2={-18} y2={18} stroke={RED} strokeWidth={4} />
            </g>
            <text x={line + 28} y={300} fill={RED} fontFamily={MONO} fontSize={20} letterSpacing={3}>BREEN · MORTO</text>
            {f >= a(p.citAt) ? <text x={line + 28} y={210} fill={CREAM} fontFamily={MONO} fontSize={22} letterSpacing={3} opacity={P(f, a(p.citAt), 8)}>QUEDA DA CIDADELA</text> : null}
            {f >= a(p.citAt) ? <text x={line + 28} y={240} fill="rgba(255,226,176,0.6)" fontFamily={MONO} fontSize={16} letterSpacing={3} opacity={P(f, a(p.citAt) + 8, 8)}>REATOR DESTRUÍDO</text> : null}
            {/* a transferência */}
            {f >= a(p.xferAt) ? (
              <g opacity={P(f, a(p.xferAt), 8)}>
                <text x={1000} y={455} fill={ICE} fontFamily={MONO} fontSize={18} letterSpacing={3}>TRANSFERÊNCIA DE CONSCIÊNCIA</text>
                <rect x={1000} y={470} width={1500 - 1000} height={26} fill="none" stroke="rgba(159,230,255,0.3)" />
                <rect x={1000} y={470} width={Math.max(0, barEnd - 1000)} height={26} fill={ICE} opacity={0.85} />
                {/* destino */}
                <rect x={1640} y={440} width={200} height={86} rx={8} fill="rgba(159,230,255,0.05)" stroke={f >= a(p.neverAt) ? RED : ICE} strokeWidth={2} strokeDasharray={cut ? "6 6" : undefined} />
                <text x={1740} y={476} textAnchor="middle" fill={CREAM} fontFamily={MONO} fontSize={16} letterSpacing={2} opacity={P(f, a(p.hostAt), 8)}>CORPO</text>
                <text x={1740} y={500} textAnchor="middle" fill={CREAM} fontFamily={MONO} fontSize={16} letterSpacing={2} opacity={P(f, a(p.hostAt), 8)}>HOSPEDEIRO</text>
                {f >= a(p.neverAt) ? <text x={1740} y={556} textAnchor="middle" fill={RED} fontFamily={MONO} fontSize={16} letterSpacing={2} opacity={flickIn(f, a(p.neverAt))}>NUNCA CONCLUÍDA</text> : null}
              </g>
            ) : null}
            {cut ? (
              <g opacity={flickIn(f, a(p.cutAt))}>
                <path d={`M ${line} 462 l -10 10 l 12 8 l -10 10 l 10 12`} fill="none" stroke={RED} strokeWidth={4} />
                <text x={line - 10} y={540} textAnchor="end" fill={RED} fontFamily={MONO} fontSize={20} letterSpacing={3}>INTERROMPIDA NO MEIO</text>
              </g>
            ) : null}
            {/* parte da consciência vaza para os sistemas Combine */}
            {f >= a(p.conscAt)
              ? Array.from({ length: 14 }).map((_, i) => {
                  const t = (((f - a(p.conscAt)) * 0.02 + i / 14) % 1);
                  const x = line - 30 + Math.sin(i * 2.1 + t * 4) * 20;
                  const y = 500 + t * 210;
                  return <circle key={i} cx={x} cy={y} r={4} fill={AMB} opacity={P(f, a(p.conscAt), 10) * (1 - t * 0.6)} />;
                })
              : null}
            {f >= a(p.sysAt) ? (
              <g opacity={P(f, a(p.sysAt), 10)}>
                <rect x={line - 230} y={720} width={400} height={120} rx={10} fill="rgba(255,93,77,0.08)" stroke={RED} strokeWidth={2.5} />
                <text x={line - 30} y={772} textAnchor="middle" fill={RED} fontFamily={MONO} fontSize={22} letterSpacing={4}>SISTEMAS COMBINE</text>
                <text x={line - 30} y={808} textAnchor="middle" fill={AMB} fontFamily={MONO} fontSize={17} letterSpacing={3}>CONSCIÊNCIA PARCIAL</text>
              </g>
            ) : null}
            {f >= a(p.keptAt) ? (
              <g transform={`translate(${line + 270} 790) rotate(-8) scale(${1.4 - 0.4 * P(f, a(p.keptAt), 8)})`} opacity={P(f, a(p.keptAt), 6)}>
                <rect x={-120} y={-28} width={240} height={56} fill="none" stroke={GREEN} strokeWidth={3} />
                <text x={0} y={10} textAnchor="middle" fill={GREEN} fontFamily={MONO} fontSize={26} letterSpacing={5}>PRESERVADA</text>
              </g>
            ) : null}
          </svg>
        </>
      ) : null}
      {/* 3) o corpo mal sustenta a voz · continuidade */}
      {ph === 3 ? (
        <div style={{ position: "absolute", left: X0, top: 180, width: 840, opacity: P(f, a(p.weakAt), 10) }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 20, letterSpacing: 3, color: CREAM }}>
            <span>SUSTENTAÇÃO DA VOZ</span>
            <span style={{ color: RED }}>{`${Math.round(9 + 3 * Math.sin(f / 5))}%`}</span>
          </div>
          <div style={{ height: 14, border: `1px solid ${RED}`, marginTop: 10, position: "relative" }}>
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${9 + 3 * Math.sin(f / 5)}%`, background: RED }} />
          </div>
          {f >= a(p.repAt) ? (
            <div style={{ marginTop: 50, position: "relative", height: 220, opacity: P(f, a(p.repAt), 8) }}>
              <div style={{ fontSize: 16, letterSpacing: 5, color: AMB }}>REPETE · EM LOOP</div>
              {f >= a(p.wordAt)
                ? [3, 2, 1, 0].map((k) => {
                    const t = ((f - a(p.wordAt)) / 40 + k * 0.25) % 1;
                    return (
                      <div key={k} style={{ position: "absolute", left: 0, top: 40 + t * 120, fontSize: 70, letterSpacing: 8, color: CREAM, opacity: (1 - t) * 0.9 * P(f, a(p.wordAt), 6), transform: `translateX(${(rnd(Math.floor(f / 3) + k) - 0.5) * 6}px)` }}>
                        CONTINUIDADE
                      </div>
                    );
                  })
                : null}
            </div>
          ) : null}
          {f >= a(p.promAt) ? (
            <div style={{ marginTop: 20, padding: "16px 20px", border: `1px solid ${ICE}`, borderRadius: 8, background: "rgba(4,10,14,0.88)", opacity: P(f, a(p.promAt), 8) }}>
              <div style={{ fontSize: 15, letterSpacing: 5, color: ICE }}>A PROMESSA DOS COMBINE</div>
              {f >= a(p.bodyAt) ? (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 28, letterSpacing: 4, color: CREAM, marginTop: 12, opacity: P(f, a(p.bodyAt), 8) }}>
                  <span>O CORPO</span>
                  <span style={{ color: RED }}>PODE MORRER</span>
                </div>
              ) : null}
              {f >= a(p.goesAt) ? (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 28, letterSpacing: 4, color: CREAM, marginTop: 8, opacity: P(f, a(p.goesAt), 8) }}>
                  <span>ELE</span>
                  <span style={{ color: GREEN }}>CONTINUA</span>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ============================================================================================ 6 · 3c) as últimas falas do Breen
// a voz dele atravessa a tela; as frases dele aparecem digitadas; o que ele NÃO faz é riscado; o pedido vira um comando de
// desligar; o Gordon é um contato do HEV com a caixa de resposta vazia; no fim a identidade dele fica sem confirmação.
export const HLBreenLast: React.FC<{
  life: number;
  q1At?: number;
  pauseAt?: number;
  q2At?: number;
  firstAt?: number;
  negAt?: number;
  convAt?: number;
  justAt?: number;
  askAt?: number;
  offAt?: number;
  dieAt?: number;
  gordAt?: number;
  neverAt?: number;
  laughAt?: number;
  q3At?: number;
  nobodyAt?: number;
  doubtAt?: number;
  selfAt?: number;
  defAt?: number;
  q1t?: string;
  q2t?: string;
  q3t?: string;
  q3bt?: string;
  ask?: string;
  die?: string;
}> = (p) => {
  const f = useCurrentFrame();
  const N = 1e9;
  const a = (v?: number) => v ?? N;
  void p.life;
  const paused = f >= a(p.pauseAt) && f < a(p.q2At) - 6;
  const laughing = f >= a(p.laughAt) && f < a(p.q3At);
  const amp = paused ? 0.02 : laughing ? (Math.floor(f / 5) % 2 ? 0.5 : 0.08) : 0.32;
  const quote = f >= a(p.q3At) ? 3 : f >= a(p.firstAt) ? 0 : f >= a(p.q2At) ? 2 : f >= a(p.q1At) ? 1 : 0;
  const nots = [
    { k: "NEGOCIAR", at: a(p.negAt) },
    { k: "CONVENCER", at: a(p.convAt) },
    ...(p.defAt !== undefined ? [{ k: "DEFENDER OS COMBINE", at: a(p.defAt) }] : []),
    { k: "JUSTIFICAR", at: a(p.justAt) },
  ].sort((x, y) => x.at - y.at);
  const midOut = 1 - P(f, a(p.askAt) - 6, 8);
  const match = f >= a(p.selfAt) ? (Math.floor(f / 4) % 3 === 0 ? "62%" : "?") : "62%";
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, #0e1114 0%, #020304 75%)", overflow: "hidden", fontFamily: MONO }}>
      <div style={{ position: "absolute", left: 70, top: 56, color: AMB, letterSpacing: 6, fontSize: 22 }}>W. BREEN · CANAL DE VOZ</div>
      <div style={{ position: "absolute", left: 70, top: 120, opacity: P(f, 0, 10) }}>
        <VoiceStrip f={f} w={1780} h={130} amp={amp} col={laughing ? AMB : ICE} seed={3} />
        {paused ? <div style={{ position: "absolute", left: 820, top: 46, fontSize: 24, letterSpacing: 8, color: AMB }}>PAUSA</div> : null}
        {laughing ? <div style={{ position: "absolute", left: 790, top: -36, fontSize: 18, letterSpacing: 6, color: AMB }}>RISO · QUASE SEM FORÇA</div> : null}
      </div>
      {/* frases digitadas */}
      {quote > 0 ? (
        <div style={{ position: "absolute", left: 70, right: 70, top: 330, textAlign: "center" }}>
          {quote === 1 ? <div style={{ fontSize: 58, letterSpacing: 3, color: CREAM }}>{`“${typedS(f, a(p.q1At), p.q1t ?? "EU MORRI NAQUELA CIDADELA, FREEMAN.", 1.3)}”`}</div> : null}
          {quote === 2 ? <div style={{ fontSize: 66, letterSpacing: 3, color: CREAM }}>{`“${typedS(f, a(p.q2At), p.q2t ?? "ISSO AQUI SÓ CONTINUOU.", 1.1)}”`}</div> : null}
          {quote === 3 ? (
            <>
              <div style={{ fontSize: 52, letterSpacing: 3, color: CREAM }}>{`“${typedS(f, a(p.q3At), p.q3t ?? "EU ACREDITEI NELES, GORDON.", 1.2)}”`}</div>
              {f >= a(p.nobodyAt) ? <div style={{ fontSize: 66, letterSpacing: 6, color: RED, marginTop: 18, opacity: flickIn(f, a(p.nobodyAt)) }}>{p.q3bt ?? "NINGUÉM VOLTA."}</div> : null}
            </>
          ) : null}
        </div>
      ) : null}
      {/* o que ele não faz mais */}
      {f >= a(p.firstAt) && f < a(p.askAt) + 2 ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 360, opacity: P(f, a(p.firstAt), 8) * midOut }}>
          <div style={{ textAlign: "center", fontSize: 18, letterSpacing: 6, color: ICE }}>PELA PRIMEIRA VEZ</div>
          <div style={{ display: "flex", justifyContent: "center", gap: nots.length > 3 ? 28 : 60, marginTop: 30 }}>
            {nots.map((n, i) => {
              const s = P(f, n.at + 6, 10);
              return (
                <div key={i} style={{ position: "relative", padding: "16px 30px", border: "1px solid rgba(255,226,176,0.4)", borderRadius: 8, fontSize: nots.length > 3 ? 30 : 40, letterSpacing: nots.length > 3 ? 3 : 5, color: f >= n.at ? "rgba(255,226,176,0.55)" : CREAM, opacity: f >= n.at - 20 ? 1 : 0.25 }}>
                  {n.k}
                  <div style={{ position: "absolute", left: 10, top: "50%", height: 5, width: `calc(${s * 100}% - 20px)`, background: RED }} />
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
      {/* o pedido */}
      {f >= a(p.askAt) && f < a(p.laughAt) ? (
        <div style={{ position: "absolute", left: 260, top: 360, width: 940, whiteSpace: "nowrap", opacity: P(f, a(p.askAt), 10) * (1 - P(f, a(p.laughAt) - 8, 8)) }}>
          <div style={{ fontSize: 18, letterSpacing: 6, color: AMB }}>O ÚNICO PEDIDO</div>
          <div style={{ display: "flex", alignItems: "center", gap: 26, marginTop: 18, padding: "22px 28px", border: `2px solid ${f >= a(p.offAt) ? RED : AMB}`, borderRadius: 12, background: "rgba(20,6,4,0.8)" }}>
            <svg width={70} height={70}>
              <path d="M 22 18 A 24 24 0 1 0 48 18" fill="none" stroke={RED} strokeWidth={5} strokeLinecap="round" />
              <line x1={35} y1={8} x2={35} y2={34} stroke={RED} strokeWidth={5} strokeLinecap="round" />
            </svg>
            <div style={{ fontSize: 44, letterSpacing: 4, color: CREAM, opacity: P(f, a(p.offAt), 8) }}>DESLIGAR OS APARELHOS</div>
          </div>
          {f >= a(p.dieAt) ? <div style={{ fontSize: 28, letterSpacing: 4, color: RED, marginTop: 20, opacity: P(f, a(p.dieAt), 8) }}>{p.die ?? "MORRER MAIS UMA VEZ"}</div> : null}
        </div>
      ) : null}
      {/* o Gordon: caixa de resposta vazia */}
      {f >= a(p.gordAt) ? (
        <div style={{ position: "absolute", right: 90, top: 380, width: 520, padding: "18px 22px", border: `1px solid ${AMB}`, borderRadius: 10, background: "rgba(14,10,4,0.85)", opacity: P(f, a(p.gordAt), 10) * (1 - P(f, a(p.laughAt) + 20, 10)) }}>
          <div style={{ fontSize: 15, letterSpacing: 5, color: AMB }}>GORDON FREEMAN · RESPOSTA</div>
          <div style={{ marginTop: 14, height: 70, border: "1px solid rgba(255,178,46,0.35)", borderRadius: 6, padding: "14px 16px", fontSize: 32, color: CREAM }}>{Math.floor(f / 12) % 2 ? "▌" : ""}</div>
          {f >= a(p.neverAt) ? <div style={{ fontSize: 20, letterSpacing: 4, color: "rgba(255,226,176,0.7)", marginTop: 12, opacity: P(f, a(p.neverAt), 8) }}>ELE NUNCA RESPONDE</div> : null}
        </div>
      ) : null}
      {/* identidade sem confirmação */}
      {f >= a(p.doubtAt) ? (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 150, display: "flex", justifyContent: "center", opacity: P(f, a(p.doubtAt), 10) }}>
          <div style={{ width: 760, padding: "18px 26px", border: `1px solid ${f >= a(p.selfAt) ? RED : AMB}`, borderRadius: 10, background: "rgba(14,8,4,0.88)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22, letterSpacing: 4, color: CREAM }}>
              <span>IDENTIDADE · W. BREEN</span>
              <span style={{ color: f >= a(p.selfAt) ? RED : AMB }}>{match}</span>
            </div>
            {f >= a(p.selfAt) ? <div style={{ fontSize: 30, letterSpacing: 5, color: RED, marginTop: 10, opacity: flickIn(f, a(p.selfAt)) }}>NÃO CONFIRMADA · NEM POR ELE</div> : null}
          </div>
        </div>
      ) : null}
      {/* o suporte continua batendo */}
      <div style={{ position: "absolute", left: 70, bottom: 40, opacity: 0.8 }}>
        <div style={{ fontSize: 14, letterSpacing: 4, color: GREEN }}>SUPORTE · ATIVO</div>
        <Ecg f={f} bpm={44} jitter={0.6} col={GREEN} w={340} h={60} />
      </div>
    </AbsoluteFill>
  );
};

// ============================================================================================ 6 · 3d) a escolha do jogador
// tela de escolha sem cronômetro: DESLIGAR O SUPORTE × SAIR DA SALA. O cursor passa de uma para a outra; elas encolhem
// (escolha pequena); a linha da história segue igual; o jogo grava a decisão.
export const HLBreenChoice: React.FC<{ life: number; freeAt?: number; aAt?: number; bAt?: number; smallAt?: number; sameAt?: number; logAt?: number; bSub?: string }> = ({
  bSub = "BREEN FICA ALI",
  life,
  freeAt = 0,
  aAt = 1e9,
  bAt = 1e9,
  smallAt = 1e9,
  sameAt = 1e9,
  logAt = 1e9,
}) => {
  const f = useCurrentFrame();
  void life;
  const sm = P(f, smallAt, 18);
  const sc = 1 - 0.38 * sm;
  const ty = -230 * sm;
  const sel = f >= bAt ? (f >= smallAt ? (Math.floor(f / 40) % 2) : 1) : 0;
  const card = (i: number, at: number, title: string, flat: boolean) =>
    f >= at ? (
      <div style={{ width: 600, padding: "26px 30px", border: `2px solid ${sel === i ? AMB : "rgba(255,226,176,0.3)"}`, borderRadius: 14, background: sel === i ? "rgba(30,20,6,0.9)" : "rgba(8,8,8,0.85)", opacity: flickIn(f, at), boxShadow: sel === i ? "0 0 40px rgba(255,178,46,0.25)" : "none" }}>
        <div style={{ fontSize: 16, letterSpacing: 5, color: AMB }}>{i === 0 ? "OPÇÃO A" : "OPÇÃO B"}</div>
        <div style={{ fontSize: 42, letterSpacing: 4, color: CREAM, marginTop: 8 }}>{title}</div>
        <div style={{ marginTop: 18 }}>
          {flat ? (
            <svg width={540} height={60}>
              <polyline points={`0,30 ${Math.min(540, (f - at) * 12)},30`} fill="none" stroke={RED} strokeWidth={2.5} />
            </svg>
          ) : (
            <Ecg f={f} bpm={44} jitter={0.6} col={GREEN} w={540} h={60} />
          )}
        </div>
        <div style={{ fontSize: 18, letterSpacing: 3, color: flat ? RED : GREEN, marginTop: 6 }}>{flat ? "BREEN MORRE" : bSub}</div>
      </div>
    ) : null;
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, #12100a 0%, #030302 75%)", overflow: "hidden", fontFamily: MONO }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 110, textAlign: "center", opacity: P(f, freeAt, 10) * (1 - sm) }}>
        <div style={{ fontSize: 22, letterSpacing: 8, color: AMB }}>ESCOLHA DO JOGADOR</div>
        <div style={{ fontSize: 18, letterSpacing: 5, color: "rgba(255,226,176,0.6)", marginTop: 10 }}>SEM CRONÔMETRO · NADA TE OBRIGA</div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 330, display: "flex", justifyContent: "center", gap: 60, transform: `translateY(${ty}px) scale(${sc})` }}>
        {card(0, aAt, "DESLIGAR O SUPORTE", true)}
        {card(1, bAt, "SAIR DA SALA", false)}
      </div>
      {f >= sameAt ? (
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: P(f, sameAt, 10) }}>
          <line x1={160} y1={700} x2={1760} y2={700} stroke={CREAM} strokeWidth={3} strokeDasharray={`${Math.min(1600, (f - sameAt) * 40)} 2000`} />
          <path d="M 760 700 C 820 640 900 640 960 700" fill="none" stroke={RED} strokeWidth={2.5} opacity={0.8} />
          <path d="M 760 700 C 820 760 900 760 960 700" fill="none" stroke={GREEN} strokeWidth={2.5} opacity={0.8} />
          <circle cx={760} cy={700} r={8} fill={AMB} />
          <circle cx={960} cy={700} r={8} fill={AMB} />
          <text x={960} y={800} textAnchor="middle" fill={CREAM} fontFamily={MONO} fontSize={22} letterSpacing={5}>O RUMO DA HISTÓRIA · O MESMO</text>
        </svg>
      ) : null}
      {f >= logAt ? (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 110, display: "flex", justifyContent: "center", opacity: P(f, logAt, 8) }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "14px 26px", border: `1px solid ${GREEN}`, borderRadius: 10, background: "rgba(4,14,8,0.88)" }}>
            <svg width={44} height={44}>
              <circle cx={22} cy={22} r={16} fill="none" stroke="rgba(141,255,168,0.25)" strokeWidth={4} />
              <circle cx={22} cy={22} r={16} fill="none" stroke={GREEN} strokeWidth={4} strokeDasharray={`${Math.min(100, (f - logAt) * 5)} 100`} transform="rotate(-90 22 22)" />
            </svg>
            <div style={{ fontSize: 26, letterSpacing: 5, color: GREEN }}>{f - logAt > 20 ? "DECISÃO REGISTRADA" : "REGISTRANDO…"}</div>
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ============================================================================================ 8 · 1) os arquivos corrompidos
// a grade dos arquivos da Mossman decodificando em onda; a maioria vira estática vermelha. Depois três perguntas, cada uma
// com o seu objeto (o navio em wireframe, o contato da Alyx, um cadeado) recebem SEM DADOS.
const GLY = "⟊⟒⌇⍜⏃⌖⟟⋔⍀⊑⏁⋏⟓⌰⟒⍙⎅⏚";
export const HLCorruptFiles: React.FC<{ life: number; corrAt?: number; leftAt?: number; howAt?: number; alyxAt?: number; ansAt?: number }> = ({ life, corrAt = 0, leftAt = 1e9, howAt = 1e9, alyxAt = 1e9, ansAt = 1e9 }) => {
  const f = useCurrentFrame();
  void life;
  const COLS = 16;
  const ROWS = 9;
  const side = P(f, leftAt - 4, 22); // a grade vai para a esquerda
  const gx = 160 - 60 * side;
  const sc = 1 - 0.38 * side;
  const integ = Math.round(interpolate(f, [corrAt, corrAt + 70], [100, 38], C));
  const cam: Cam = { fx: 0, fy: 0, yaw: -0.5 + f * 0.004, pitch: 0.42, dist: 120, cx: 1430, cy: 300, F: 520 };
  const qs = [
    { at: howAt, k: "COMO O BOREALIS FUNCIONA", y: 210 },
    { at: alyxAt, k: "O QUE ACONTECEU COM A ALYX", y: 520 },
    { at: ansAt, k: "A RESPOSTA QUE TODOS QUERIAM", y: 800 },
  ];
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 40% 50%, #0b1218 0%, #020304 75%)", overflow: "hidden", fontFamily: MONO }}>
      <div style={{ position: "absolute", left: 70, top: 56, color: ICE, letterSpacing: 6, fontSize: 22 }}>DR. KLEINER · ARQUIVOS DA MOSSMAN</div>
      <div style={{ position: "absolute", left: 70, top: 92, color: integ < 60 ? RED : CREAM, letterSpacing: 4, fontSize: 18 }}>{`INTEGRIDADE ${integ}%`}</div>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <g transform={`translate(${gx} 170) scale(${sc})`}>
          {Array.from({ length: COLS * ROWS }).map((_, i) => {
            const c = i % COLS;
            const r = Math.floor(i / COLS);
            const t0 = corrAt + (c + r) * 2.2;
            const bad = rnd(i * 1.37) < 0.62;
            const on = P(f, t0, 6);
            const dead = bad && f > t0 + 8;
            const jx = dead ? (rnd(Math.floor(f / 2) + i) - 0.5) * 8 : 0;
            return (
              <g key={i} opacity={on}>
                <rect x={c * 98 + jx} y={r * 88} width={84} height={72} rx={6} fill={dead ? "rgba(255,93,77,0.12)" : "rgba(159,230,255,0.08)"} stroke={dead ? RED : ICE} strokeWidth={1.5} />
                {dead ? (
                  Array.from({ length: 4 }).map((__, k) => <rect key={k} x={c * 98 + 6 + rnd(i + k + Math.floor(f / 3)) * 40} y={r * 88 + 8 + k * 15} width={10 + rnd(i * k + Math.floor(f / 2)) * 40} height={6} fill={RED} opacity={0.6} />)
                ) : (
                  <text x={c * 98 + 42} y={r * 88 + 44} textAnchor="middle" fill={ICE} fontFamily={MONO} fontSize={18}>
                    {GLY[(i * 7) % GLY.length] + GLY[(i * 3) % GLY.length]}
                  </text>
                )}
              </g>
            );
          })}
        </g>
        {/* o navio: sem dados de funcionamento */}
        {f >= howAt ? (
          <g opacity={P(f, howAt, 10)}>
            <Ship cam={cam} col={f >= howAt + 30 ? "rgba(255,93,77,0.7)" : ICE} draw={P(f, howAt, 26)} />
            <line x1={1180} x2={1700} y1={220 + ((f - howAt) * 4) % 160} y2={220 + ((f - howAt) * 4) % 160} stroke={ICE} strokeWidth={2} opacity={f < howAt + 30 ? 0.8 : 0} />
          </g>
        ) : null}
        {/* a Alyx: contato que não fecha */}
        {f >= alyxAt ? (
          <g transform="translate(1430 540)" opacity={P(f, alyxAt, 10)}>
            {[60, 90, 120].map((r, k) => (
              <circle key={k} r={r + 6 * Math.sin(f / 8 + k)} fill="none" stroke={k === 0 ? AMB : "rgba(255,178,46,0.3)"} strokeWidth={2} strokeDasharray={k ? "6 10" : undefined} />
            ))}
            <circle r={18} fill={AMB} opacity={rnd(Math.floor(f / 3)) > 0.35 ? 0.9 : 0.1} />
            <text x={0} y={-140} textAnchor="middle" fill={AMB} fontFamily={MONO} fontSize={16} letterSpacing={4}>ALYX VANCE</text>
          </g>
        ) : null}
        {/* a resposta: cadeado */}
        {f >= ansAt ? (
          <g transform="translate(1430 820)" opacity={P(f, ansAt, 10)}>
            <path d="M -34 -10 L -34 -40 A 34 34 0 0 1 34 -40 L 34 -10" fill="none" stroke={CREAM} strokeWidth={6} />
            <rect x={-54} y={-12} width={108} height={84} rx={10} fill="rgba(255,226,176,0.06)" stroke={CREAM} strokeWidth={4} />
            <text x={0} y={46} textAnchor="middle" fill={CREAM} fontFamily={MONO} fontSize={40}>?</text>
          </g>
        ) : null}
      </svg>
      {qs.map((q, i) =>
        f >= q.at ? (
          <div key={i} style={{ position: "absolute", left: 1640, top: q.y - 30, width: 260, opacity: P(f, q.at, 8) }}>
            <div style={{ fontSize: 15, letterSpacing: 3, color: CREAM }}>{q.k}</div>
            <div style={{ fontSize: 26, letterSpacing: 4, color: RED, marginTop: 8, opacity: flickIn(f, q.at + 24) }}>SEM DADOS</div>
          </div>
        ) : null,
      )}
    </AbsoluteFill>
  );
};

// ============================================================================================ 8 · 2) a palavra que se repete
// o registro Combine rolando em glifos; a mesma sequência acende várias vezes (contador); no nome, os destaques voam para o
// centro, se fundem, e os glifos se decodificam letra a letra em CATALISADOR.
const CAT_G = "⏃⟒⌇⍜";
export const HLCatalystWord: React.FC<{ life: number; logAt?: number; nameAt?: number }> = ({ life, logAt = 0, nameAt = 1e9 }) => {
  const f = useCurrentFrame();
  void life;
  const ROWS = 20;
  const scroll = (f - logAt) * 1.4;
  const merge = P(f, nameAt, 20);
  const hits: { x: number; y: number; at: number }[] = [];
  const rows = Array.from({ length: ROWS }).map((_, r) => {
    const idx = r + Math.floor(scroll / 48);
    const y = 150 + r * 48 - (scroll % 48);
    const hasHit = rnd(idx * 2.3) < 0.45;
    const pos = Math.floor(rnd(idx * 5.1) * 30);
    const txt = Array.from({ length: 44 }).map((__, k) => (hasHit && k >= pos && k < pos + 4 ? CAT_G[k - pos] : GLY[Math.floor(rnd(idx * 31 + k) * GLY.length)])).join("");
    if (hasHit) hits.push({ x: 160 + pos * 30, y, at: logAt + idx * 4 });
    return { y, txt, hasHit, pos };
  });
  const count = Math.min(212, Math.max(0, Math.floor((f - logAt) * 0.9)));
  const word = "CATALISADOR";
  const dec = Math.floor(Math.max(0, f - nameAt - 14) / 2);
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, #140808 0%, #030202 75%)", overflow: "hidden", fontFamily: MONO }}>
      <div style={{ position: "absolute", left: 70, top: 56, color: RED, letterSpacing: 6, fontSize: 22 }}>REGISTRO COMBINE · VARREDURA</div>
      <div style={{ position: "absolute", right: 70, top: 56, color: AMB, letterSpacing: 4, fontSize: 22 }}>{`OCORRÊNCIAS ${count}`}</div>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - 0.75 * merge }}>
        {rows.map((r, i) => (
          <div key={i} style={{ position: "absolute", left: 160, top: r.y, fontSize: 26, letterSpacing: 8, color: "rgba(255,93,77,0.45)", whiteSpace: "nowrap" }}>
            {r.txt}
          </div>
        ))}
      </div>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {hits.map((h, i) => {
          if (h.y < 120 || h.y > 1060) return null;
          const tx = h.x + (960 - 60 - h.x) * merge;
          const ty = h.y + (540 - h.y) * merge;
          return <rect key={i} x={tx - 8} y={ty + 2} width={136} height={40} rx={4} fill="rgba(255,178,46,0.12)" stroke={AMB} strokeWidth={2} opacity={(1 - merge * 0.9) * (0.6 + 0.4 * Math.sin(f / 5 + i))} />;
        })}
        {f >= nameAt ? <circle cx={960} cy={560} r={40 + (f - nameAt) * 14} fill="none" stroke={AMB} strokeWidth={3} opacity={Math.max(0, 1 - (f - nameAt) / 30)} /> : null}
      </svg>
      {f >= nameAt ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 480, textAlign: "center", fontSize: 120, letterSpacing: 18, color: CREAM, textShadow: "0 0 40px rgba(255,178,46,0.5)", opacity: P(f, nameAt + 8, 8) }}>
          {word
            .split("")
            .map((ch, k) => (k < dec ? ch : GLY[(k * 5 + Math.floor(f / 2)) % GLY.length]))
            .join("")}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ============================================================================================ 8 · 3) o alvo real
// os dois registros (palavra × experimentos) se cruzam; a hipótese antiga é um diagrama: Combine → Borealis → teleporte;
// "não era isso" racha a seta; o teleporte encolhe e cai (consequência menor); a seta atravessa o navio e vai num núcleo
// maior escondido à direita: o catalisador.
export const HLRealTarget: React.FC<{ life: number; crossAt?: number; noticeAt?: number; assumeAt?: number; tpAt?: number; notAt?: number; notOnlyAt?: number; advAt?: number; minorAt?: number; realAt?: number; catAt?: number }> = ({
  life,
  crossAt = 0,
  noticeAt = 1e9,
  assumeAt = 1e9,
  tpAt = 1e9,
  notAt = 1e9,
  notOnlyAt = 1e9,
  advAt = 1e9,
  minorAt = 1e9,
  realAt = 1e9,
  catAt = 1e9,
}) => {
  const f = useCurrentFrame();
  void life;
  const diag = P(f, assumeAt, 14);
  const cross = 1 - P(f, assumeAt - 10, 10);
  const cam: Cam = { fx: 0, fy: 0, yaw: -0.4 + f * 0.003, pitch: 0.4, dist: 150, cx: 820, cy: 520, F: 560 };
  const tpShrink = P(f, notOnlyAt, 20);
  const tpX = 1320 - 0 * tpShrink;
  const tpY = 520 + 300 * tpShrink;
  const tpR = 110 - 60 * tpShrink;
  const slide = P(f, realAt, 30); // a câmera desliza para a direita
  const ox = -360 * slide;
  const reach = P(f, realAt + 6, 30);
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, #0d1116 0%, #020304 75%)", overflow: "hidden", fontFamily: MONO }}>
      {/* 1) os registros se cruzam */}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: cross }}>
        {Array.from({ length: 7 }).map((_, i) => {
          const t = P(f, crossAt + i * 3, 40);
          return (
            <g key={i}>
              <path d={`M 120 ${200 + i * 100} C 600 ${200 + i * 100} 700 540 960 540`} fill="none" stroke={AMB} strokeWidth={2} pathLength={1} strokeDasharray="1" strokeDashoffset={1 - t} opacity={0.6} />
              <path d={`M 1800 ${200 + i * 100} C 1320 ${200 + i * 100} 1220 540 960 540`} fill="none" stroke={GREEN} strokeWidth={2} pathLength={1} strokeDasharray="1" strokeDashoffset={1 - t} opacity={0.6} />
            </g>
          );
        })}
        <text x={120} y={160} fill={AMB} fontFamily={MONO} fontSize={20} letterSpacing={4}>“CATALISADOR” · REGISTRO COMBINE</text>
        <text x={1800} y={160} textAnchor="end" fill={GREEN} fontFamily={MONO} fontSize={20} letterSpacing={4}>EXPERIMENTOS · ROUBADOS PELA MOSSMAN</text>
        {f >= noticeAt ? (
          <g opacity={P(f, noticeAt, 6)}>
            <circle cx={960} cy={540} r={20 + 10 * Math.sin(f / 4)} fill={CREAM} opacity={0.8} />
            <circle cx={960} cy={540} r={30 + (f - noticeAt) * 6} fill="none" stroke={CREAM} strokeWidth={2} opacity={Math.max(0, 1 - (f - noticeAt) / 25)} />
          </g>
        ) : null}
      </svg>
      {/* 2) o diagrama */}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: diag }}>
        <g transform={`translate(${ox} 0)`}>
          {/* Combine */}
          <polygon points={Array.from({ length: 6 }).map((_, k) => `${300 + Math.cos((k / 6) * Math.PI * 2) * 70},${520 + Math.sin((k / 6) * Math.PI * 2) * 70}`).join(" ")} fill="rgba(255,93,77,0.1)" stroke={RED} strokeWidth={3} />
          <text x={300} y={528} textAnchor="middle" fill={RED} fontFamily={MONO} fontSize={18} letterSpacing={3}>COMBINE</text>
          <line x1={380} y1={520} x2={640} y2={520} stroke={RED} strokeWidth={3} strokeDasharray="10 8" strokeDashoffset={-f * 2} />
          <Ship cam={cam} col={ICE} />
          <text x={820} y={680} textAnchor="middle" fill={ICE} fontFamily={MONO} fontSize={18} letterSpacing={4}>BOREALIS</text>
          {/* teleporte */}
          {f >= tpAt ? (
            <g opacity={P(f, tpAt, 10)}>
              <path d={`M 1000 520 C 1100 ${520 + 140 * tpShrink} 1160 ${tpY} ${tpX - tpR} ${tpY}`} fill="none" stroke={f >= notAt ? "rgba(255,226,176,0.35)" : CREAM} strokeWidth={3} strokeDasharray="10 8" />
              {[0, 1, 2].map((k) => (
                <ellipse key={k} cx={tpX} cy={tpY} rx={tpR - k * 18} ry={(tpR - k * 18) * 0.55} fill="none" stroke={ICE} strokeWidth={3 - k} opacity={0.9 - k * 0.25} transform={`rotate(${f * (2 + k)} ${tpX} ${tpY})`} />
              ))}
              <text x={tpX} y={tpY - tpR * 0.55 - 20} textAnchor="middle" fill={CREAM} fontFamily={MONO} fontSize={18 - 4 * tpShrink} letterSpacing={3}>TELEPORTE · APERTURE</text>
              {f < notAt ? <text x={tpX} y={tpY + tpR * 0.55 + 36} textAnchor="middle" fill="rgba(255,226,176,0.6)" fontFamily={MONO} fontSize={15} letterSpacing={3}>O QUE TODO MUNDO ACHAVA</text> : null}
              {f >= minorAt ? <text x={tpX} y={tpY + tpR * 0.55 + 34} textAnchor="middle" fill={AMB} fontFamily={MONO} fontSize={16} letterSpacing={3} opacity={P(f, minorAt, 8)}>CONSEQUÊNCIA MENOR</text> : null}
            </g>
          ) : null}
          {f >= notAt && f < notOnlyAt + 10 ? (
            <g transform="translate(1110 470)" opacity={flickIn(f, notAt) * (1 - P(f, notOnlyAt, 10))}>
              <line x1={-26} y1={-26} x2={26} y2={26} stroke={RED} strokeWidth={6} />
              <line x1={26} y1={-26} x2={-26} y2={26} stroke={RED} strokeWidth={6} />
            </g>
          ) : null}
          {/* o alvo real */}
          {f >= realAt ? (
            <g>
              <line x1={1000} y1={500} x2={1000 + (1880 - 1000) * reach} y2={500} stroke={AMB} strokeWidth={4} />
              <circle cx={1960} cy={500} r={(170 + 10 * Math.sin(f / 7)) * P(f, catAt - 10, 20)} fill="rgba(255,178,46,0.12)" stroke={AMB} strokeWidth={4} />
              {Array.from({ length: 16 }).map((_, k) => {
                const a = (k / 16) * Math.PI * 2 + f / 50;
                const r0 = 190;
                const r1 = 230 + 20 * Math.sin(f / 6 + k);
                return <line key={k} x1={1960 + Math.cos(a) * r0} y1={500 + Math.sin(a) * r0} x2={1960 + Math.cos(a) * r1} y2={500 + Math.sin(a) * r1} stroke={AMB} strokeWidth={3} opacity={P(f, catAt + k, 6)} />;
              })}
              <text x={1960} y={512} textAnchor="middle" fill={CREAM} fontFamily={MONO} fontSize={34} letterSpacing={6} opacity={P(f, catAt, 10)}>CATALISADOR</text>
              <text x={1960} y={790} textAnchor="middle" fill={AMB} fontFamily={MONO} fontSize={18} letterSpacing={4} opacity={P(f, catAt + 10, 10)}>O OBJETIVO REAL</text>
            </g>
          ) : null}
        </g>
      </svg>
      {/* registro dos Advisors */}
      {f >= advAt ? (
        <div style={{ position: "absolute", left: 70, top: 56, padding: "12px 18px", border: `1px solid ${AMB}`, borderRadius: 8, background: "rgba(14,10,4,0.85)", opacity: P(f, advAt, 8) }}>
          <div style={{ fontSize: 15, letterSpacing: 5, color: AMB }}>REGISTRO DOS ADVISORS</div>
          <div style={{ fontSize: 20, letterSpacing: 3, color: CREAM, marginTop: 6 }}>{typedS(f, advAt + 6, "TELEPORTE: EFEITO COLATERAL", 1.5)}</div>
        </div>
      ) : null}
      {f >= notOnlyAt && f < realAt ? <div style={{ position: "absolute", left: 0, right: 0, bottom: 90, textAlign: "center", fontSize: 30, letterSpacing: 6, color: RED, opacity: flickIn(f, notOnlyAt) }}>NÃO ERA SÓ ISSO</div> : null}
    </AbsoluteFill>
  );
};

// ============================================================================================ 8 · 5) o procedimento incompleto
// prancheta azul: a planta de um aparelho desconhecido se desenha em camadas; os três itens roubados (referências,
// coordenadas, experimentos) encaixam nas bordas; a lista do procedimento tem os passos finais arrancados, e a planta para
// no meio com o quadrante faltando piscando.
export const HLBlueprint: React.FC<{ life: number; probAt?: number; refAt?: number; coordAt?: number; expAt?: number; incAt?: number }> = ({ life, probAt = 0, refAt = 1e9, coordAt = 1e9, expAt = 1e9, incAt = 1e9 }) => {
  const f = useCurrentFrame();
  void life;
  const BL = "#7fb8ff";
  const stop = f >= incAt ? 0.62 : 1;
  const draw = Math.min(stop, interpolate(f, [probAt, probAt + 200], [0, 1], C));
  const CX = 760;
  const CY = 560;
  const rings = [260, 200, 140, 80];
  const steps = ["ALINHAR NÚCLEO", "SINCRONIZAR FASE", "ABRIR CAMPO", "", "", "", ""];
  const items = [
    { at: refAt, k: "REFERÊNCIAS", x: 1240, y: 220 },
    { at: coordAt, k: "COORDENADAS", x: 1240, y: 330 },
    { at: expAt, k: "EXPERIMENTOS", x: 1240, y: 440 },
  ];
  return (
    <AbsoluteFill style={{ background: "#06101e", overflow: "hidden", fontFamily: MONO }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {Array.from({ length: 40 }).map((_, i) => (
          <line key={"v" + i} x1={i * 50} x2={i * 50} y1={0} y2={1080} stroke="rgba(127,184,255,0.07)" />
        ))}
        {Array.from({ length: 22 }).map((_, i) => (
          <line key={"h" + i} x1={0} x2={1920} y1={i * 50} y2={i * 50} stroke="rgba(127,184,255,0.07)" />
        ))}
        {rings.map((r, k) => (
          <circle key={k} cx={CX} cy={CY} r={r} fill="none" stroke={BL} strokeWidth={k === 0 ? 3 : 2} pathLength={1} strokeDasharray="1" strokeDashoffset={1 - Math.min(1, Math.max(0, draw * 4 - k * 0.6))} transform={`rotate(-90 ${CX} ${CY})`} />
        ))}
        {Array.from({ length: 12 }).map((_, k) => {
          const a = (k / 12) * Math.PI * 2 - Math.PI / 2;
          const vis = k / 12 < draw;
          return vis ? <line key={k} x1={CX + Math.cos(a) * 80} y1={CY + Math.sin(a) * 80} x2={CX + Math.cos(a) * 260} y2={CY + Math.sin(a) * 260} stroke={BL} strokeWidth={1.5} strokeDasharray="6 6" /> : null;
        })}
        {/* cotas */}
        <line x1={CX - 260} y1={CY + 320} x2={CX + 260} y2={CY + 320} stroke={BL} strokeWidth={1.5} opacity={P(f, probAt + 30, 10)} />
        <text x={CX} y={CY + 350} textAnchor="middle" fill={BL} fontFamily={MONO} fontSize={16} letterSpacing={3} opacity={P(f, probAt + 30, 10)}>Ø ??? · FUNÇÃO NÃO DESCRITA</text>
        {f >= incAt ? (
          <path d={`M ${CX} ${CY} L ${CX + Math.cos(0.62 * Math.PI * 2 - Math.PI / 2) * 270} ${CY + Math.sin(0.62 * Math.PI * 2 - Math.PI / 2) * 270} A 270 270 0 0 1 ${CX} ${CY - 270} Z`} fill="rgba(255,93,77,0.12)" stroke={RED} strokeWidth={2} strokeDasharray="10 8" opacity={Math.floor(f / 10) % 2 ? 1 : 0.4} />
        ) : null}
        {items.map((it, i) =>
          f >= it.at ? <path key={i} d={`M ${it.x} ${it.y + 30} C ${it.x - 150} ${it.y + 30} ${CX + 300} ${CY - 200 + i * 120} ${CX + 200} ${CY - 160 + i * 140}`} fill="none" stroke={GREEN} strokeWidth={2} pathLength={1} strokeDasharray="1" strokeDashoffset={1 - P(f, it.at + 4, 16)} /> : null,
        )}
      </svg>
      <div style={{ position: "absolute", left: 70, top: 56, color: BL, letterSpacing: 6, fontSize: 22 }}>CATALISADOR · PLANTA RECONSTRUÍDA</div>
      {items.map((it, i) =>
        f >= it.at ? (
          <div key={i} style={{ position: "absolute", left: it.x, top: it.y, width: 300, padding: "14px 18px", border: `1px solid ${GREEN}`, borderRadius: 8, background: "rgba(4,14,8,0.85)", opacity: flickIn(f, it.at), transform: `translateX(${(1 - P(f, it.at, 12)) * 80}px)` }}>
            <div style={{ fontSize: 20, letterSpacing: 4, color: GREEN }}>{`✓ ${it.k}`}</div>
          </div>
        ) : null,
      )}
      <div style={{ position: "absolute", left: 1240, top: 580, width: 560, padding: "16px 20px", border: `1px solid ${f >= incAt ? RED : BL}`, borderRadius: 8, background: "rgba(6,12,24,0.9)", opacity: P(f, refAt - 10, 10) }}>
        <div style={{ fontSize: 15, letterSpacing: 5, color: f >= incAt ? RED : BL }}>PROCEDIMENTO</div>
        {steps.map((s, k) => (
          <div key={k} style={{ display: "flex", gap: 14, fontSize: 19, letterSpacing: 2, marginTop: 8, color: s ? CREAM : RED, opacity: f >= incAt || k < 3 ? 1 : 0.2 }}>
            <span>{`0${k + 1}`}</span>
            <span>{s || (f >= incAt ? "▒▒▒▒▒ AUSENTE" : "")}</span>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ============================================================================================ 8 · 6) o Ártico: a instalação, a anomalia, a corrida
// um mapa só, com câmera contínua: a coordenada voa e trava numa instalação ativa (zoom); linha para os experimentos;
// a câmera abre para o mapa inteiro com a frota; o radar varre e acha a anomalia; o Borealis volta a aparecer; colunas
// Combine marcham até ele; o plano muda: a rota do Gordon até a instalação e a corrida dos dois lados.
export const HLArcticRace: React.FC<{ life: number; coordAt?: number; pinAt?: number; labAt?: number; restAt?: number; decideAt?: number; radarAt?: number; shipAt?: number; combAt?: number; planAt?: number; ansAt?: number; raceAt?: number }> = ({
  life,
  coordAt = 0,
  pinAt = 1e9,
  labAt = 1e9,
  restAt = 1e9,
  decideAt = 1e9,
  radarAt = 1e9,
  shipAt = 1e9,
  combAt = 1e9,
  planAt = 1e9,
  ansAt = 1e9,
  raceAt = 1e9,
}) => {
  const f = useCurrentFrame();
  void life;
  const FAC = { x: 1340, y: 330 };
  const FLEET = { x: 520, y: 820 };
  const SHIP = { x: 1060, y: 600 };
  // câmera: (centro x, centro y, zoom)
  const zin = P(f, pinAt, 30) * (1 - P(f, decideAt - 6, 34));
  const camX = 960 + (FAC.x - 960) * zin;
  const camY = 540 + (FAC.y - 540) * zin;
  const z = 1 + 1.1 * zin;
  const T = `translate(960 540) scale(${z}) translate(${-camX} ${-camY})`;
  // a cruz de coordenada voando
  const fly = P(f, coordAt, 40);
  const crossX = 300 + (FAC.x - 300) * fly;
  const crossY = 200 + (FAC.y - 200) * fly;
  const sweep = (f - radarAt) * 0.06;
  const shipIn = P(f, shipAt, 30);
  const march = P(f, combAt, 160);
  const cols = [0, 1, 2, 3].map((i) => {
    const sx = 1980 + i * 30;
    const sy = 640 + i * 90;
    return { x: sx + (SHIP.x + 120 - sx) * march, y: sy + (SHIP.y - 40 + i * 20 - sy) * march };
  });
  const route = P(f, planAt, 40);
  const race = Math.max(0, f - raceAt);
  const gPct = Math.min(100, race * 0.9);
  const cPct = Math.min(100, 30 + race * 0.75);
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, #0a141c 0%, #020406 78%)", overflow: "hidden", fontFamily: MONO }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <g transform={T}>
          {Array.from({ length: 28 }).map((_, i) => (
            <line key={"g" + i} x1={i * 72} x2={i * 72} y1={0} y2={1080} stroke="rgba(159,230,255,0.05)" />
          ))}
          {Array.from({ length: 16 }).map((_, i) => (
            <line key={"h" + i} x1={0} x2={1920} y1={i * 72} y2={i * 72} stroke="rgba(159,230,255,0.05)" />
          ))}
          {/* costas e gelo */}
          <path d="M 0 960 C 200 900 300 980 460 900 C 600 840 700 930 820 880 L 820 1080 L 0 1080 Z" fill="rgba(159,230,255,0.05)" stroke="rgba(159,230,255,0.45)" strokeWidth={2} />
          <path d="M 1180 140 C 1260 220 1420 200 1500 260 C 1580 320 1700 300 1920 280 L 1920 0 L 1120 0 Z" fill="rgba(159,230,255,0.05)" stroke="rgba(159,230,255,0.45)" strokeWidth={2} />
          {Array.from({ length: 14 }).map((_, i) => (
            <path key={"ice" + i} d={`M ${200 + rnd(i) * 1500} ${300 + rnd(i * 3) * 500} l ${30 + rnd(i * 7) * 40} ${-10 + rnd(i * 9) * 20} l ${-10} ${20} Z`} fill="none" stroke="rgba(159,230,255,0.2)" />
          ))}
          {/* a instalação */}
          {f >= pinAt ? (
            <g transform={`translate(${FAC.x} ${FAC.y})`} opacity={P(f, pinAt, 10)}>
              <rect x={-40} y={-24} width={80} height={48} fill="rgba(255,178,46,0.12)" stroke={AMB} strokeWidth={2.5} />
              <rect x={-20} y={-50} width={30} height={26} fill="none" stroke={AMB} strokeWidth={2} />
              <line x1={30} y1={-24} x2={30} y2={-70} stroke={AMB} strokeWidth={2} />
              <circle cx={30} cy={-74} r={4} fill={AMB} opacity={Math.floor(f / 10) % 2 ? 1 : 0.2} />
              <circle r={70 + ((f - pinAt) % 40) * 2} fill="none" stroke={AMB} strokeWidth={1.5} opacity={1 - ((f - pinAt) % 40) / 40} />
              <text x={0} y={52} textAnchor="middle" fill={AMB} fontFamily={MONO} fontSize={13} letterSpacing={3}>INSTALAÇÃO · ATIVA</text>
            </g>
          ) : null}
          {f >= labAt ? (
            <g opacity={P(f, labAt, 10) * (1 - P(f, decideAt, 10))}>
              <path d={`M ${FAC.x - 40} ${FAC.y + 10} C ${FAC.x - 140} ${FAC.y + 60} ${FAC.x - 160} ${FAC.y + 140} ${FAC.x - 210} ${FAC.y + 150}`} fill="none" stroke={GREEN} strokeWidth={1.5} strokeDasharray="5 5" strokeDashoffset={-f} />
              <text x={FAC.x - 220} y={FAC.y + 172} textAnchor="end" fill={GREEN} fontFamily={MONO} fontSize={11} letterSpacing={2}>ORIGEM DOS EXPERIMENTOS</text>
            </g>
          ) : null}
          {f >= restAt && f < decideAt ? <text x={FAC.x} y={FAC.y - 96} textAnchor="middle" fill={CREAM} fontFamily={MONO} fontSize={14} letterSpacing={3} opacity={P(f, restAt, 8)}>O RESTO DA RESPOSTA?</text> : null}
          {/* a frota */}
          {f >= decideAt ? (
            <g transform={`translate(${FLEET.x} ${FLEET.y})`} opacity={P(f, decideAt, 10)}>
              {[0, 1, 2].map((k) => (
                <path key={k} d={`M ${-30 + k * 26} ${k * 10} l 18 0 l 6 -6 l -30 0 Z`} fill={GREEN} opacity={0.8} />
              ))}
              <text x={0} y={44} textAnchor="middle" fill={GREEN} fontFamily={MONO} fontSize={15} letterSpacing={3}>FROTA · RESISTÊNCIA</text>
              {f < planAt ? <text x={0} y={66} textAnchor="middle" fill="rgba(141,255,168,0.6)" fontFamily={MONO} fontSize={13} letterSpacing={3}>{"DECIDINDO" + ".".repeat(Math.floor(f / 10) % 4)}</text> : null}
            </g>
          ) : null}
          {/* radar */}
          {f >= radarAt ? (
            <g opacity={P(f, radarAt, 10)}>
              {[200, 400, 600].map((r) => (
                <circle key={r} cx={FLEET.x} cy={FLEET.y} r={r} fill="none" stroke="rgba(141,255,168,0.15)" />
              ))}
              <path d={`M ${FLEET.x} ${FLEET.y} L ${FLEET.x + Math.cos(sweep) * 900} ${FLEET.y + Math.sin(sweep) * 900} A 900 900 0 0 0 ${FLEET.x + Math.cos(sweep - 0.25) * 900} ${FLEET.y + Math.sin(sweep - 0.25) * 900} Z`} fill="rgba(141,255,168,0.08)" />
              <line x1={FLEET.x} y1={FLEET.y} x2={FLEET.x + Math.cos(sweep) * 900} y2={FLEET.y + Math.sin(sweep) * 900} stroke={GREEN} strokeWidth={2} opacity={0.7} />
              <circle cx={SHIP.x} cy={SHIP.y} r={10 + 30 * shipIn} fill="none" stroke={RED} strokeWidth={3} opacity={rnd(Math.floor(f / 3)) > 0.3 ? 1 : 0.2} />
              <text x={SHIP.x} y={SHIP.y - 60 - 30 * shipIn} textAnchor="middle" fill={RED} fontFamily={MONO} fontSize={16} letterSpacing={4}>ANOMALIA</text>
            </g>
          ) : null}
          {f >= shipAt ? (
            <g transform={`translate(${SHIP.x} ${SHIP.y}) scale(${1.6})`} opacity={shipIn * (rnd(Math.floor(f / 2)) > 0.15 ? 1 : 0.3)}>
              <path d="M -60 10 L 50 10 L 64 -6 L 34 -6 L 28 -22 L -10 -22 L -16 -34 L -24 -34 L -28 -6 L -60 -6 Z" fill="rgba(159,230,255,0.1)" stroke={ICE} strokeWidth={2} />
              <text x={0} y={36} textAnchor="middle" fill={ICE} fontFamily={MONO} fontSize={10} letterSpacing={3}>BOREALIS</text>
            </g>
          ) : null}
          {/* colunas Combine */}
          {f >= combAt
            ? cols.map((c, i) => (
                <g key={i} transform={`translate(${c.x} ${c.y}) rotate(${(Math.atan2(SHIP.y - c.y, SHIP.x - c.x) * 180) / Math.PI})`} opacity={P(f, combAt + i * 5, 8)}>
                  {[0, 1, 2].map((k) => (
                    <path key={k} d={`M ${-k * 22} -9 l 14 9 l -14 9`} fill="none" stroke={RED} strokeWidth={3} />
                  ))}
                </g>
              ))
            : null}
          {/* a rota do Gordon */}
          {f >= planAt ? (
            <path d={`M ${FLEET.x + 30} ${FLEET.y - 20} C ${FLEET.x + 300} ${FLEET.y - 300} ${FAC.x - 400} ${FAC.y + 200} ${FAC.x - 40} ${FAC.y + 20}`} fill="none" stroke={AMB} strokeWidth={4} pathLength={1} strokeDasharray="1" strokeDashoffset={1 - route} />
          ) : null}
          {f >= raceAt
            ? (() => {
                const t = gPct / 100;
                const b = (u: number, p0: number, p1: number, p2: number, p3: number) => (1 - u) ** 3 * p0 + 3 * (1 - u) ** 2 * u * p1 + 3 * (1 - u) * u * u * p2 + u ** 3 * p3;
                const x = b(t * 0.85, FLEET.x + 30, FLEET.x + 300, FAC.x - 400, FAC.x - 40);
                const y = b(t * 0.85, FLEET.y - 20, FLEET.y - 300, FAC.y + 200, FAC.y + 20);
                return <circle cx={x} cy={y} r={9} fill={AMB} stroke={CREAM} strokeWidth={2} />;
              })()
            : null}
        </g>
        {/* a cruz da coordenada (fora da câmera) */}
        {f < pinAt + 20 ? (
          <g transform={`translate(${f >= pinAt ? 960 : crossX} ${f >= pinAt ? 540 : crossY})`} opacity={P(f, coordAt, 8) * (1 - P(f, pinAt + 6, 14))}>
            <circle r={40} fill="none" stroke={AMB} strokeWidth={2} />
            <line x1={-60} x2={60} y1={0} y2={0} stroke={AMB} strokeWidth={1.5} />
            <line y1={-60} y2={60} x1={0} x2={0} stroke={AMB} strokeWidth={1.5} />
          </g>
        ) : null}
      </svg>
      <div style={{ position: "absolute", left: 70, top: 56, color: ICE, letterSpacing: 6, fontSize: 22 }}>{f >= radarAt ? "RADAR DA FROTA" : "ÁRTICO · COORDENADA 3 DE 11"}</div>
      {f < decideAt ? <div style={{ position: "absolute", left: 70, top: 92, color: AMB, letterSpacing: 4, fontSize: 20, opacity: P(f, coordAt, 8) }}>{typedS(f, coordAt + 4, "78°14'N  ·  15°38'E", 1.4)}</div> : null}
      {f >= planAt ? <div style={{ position: "absolute", left: 0, right: 0, top: 120, textAlign: "center", fontSize: 30, letterSpacing: 8, color: AMB, opacity: flickIn(f, planAt) * (1 - P(f, raceAt, 10)) }}>O PLANO MUDA</div> : null}
      {f >= raceAt ? (
        <div style={{ position: "absolute", left: 1220, bottom: 70, width: 620, padding: "16px 20px", border: "1px solid rgba(255,226,176,0.3)", borderRadius: 8, background: "rgba(4,8,10,0.88)", opacity: P(f, raceAt, 8) }}>
          {[
            { k: "GORDON → INSTALAÇÃO", v: gPct, c: AMB },
            { k: "COMBINE → BOREALIS", v: cPct, c: RED },
          ].map((r, i) => (
            <div key={i} style={{ marginTop: i ? 14 : 0 }}>
              <div style={{ fontSize: 17, letterSpacing: 3, color: r.c }}>{r.k}</div>
              <div style={{ height: 12, background: "rgba(255,255,255,0.08)", marginTop: 6, position: "relative" }}>
                <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${r.v}%`, background: r.c }} />
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ================================================================================================ MÓDULO 9 · utilidades
const VIO = "#c79bff";
const BG9 = (c = "#0a141c") => `radial-gradient(ellipse at 50% 50%, ${c} 0%, #020406 78%)`;
const Title9: React.FC<{ t: string; col?: string; o?: number }> = ({ t, col = ICE, o = 1 }) => <div style={{ position: "absolute", left: 70, top: 56, color: col, letterSpacing: 6, fontSize: 22, fontFamily: MONO, opacity: o }}>{t}</div>;
const Chev: React.FC<{ x: number; y: number; a: number; col?: string; o?: number; n?: number }> = ({ x, y, a, col = RED, o = 1, n = 2 }) => (
  <g transform={`translate(${x} ${y}) rotate(${a})`} opacity={o}>
    {Array.from({ length: n }).map((_, k) => (
      <path key={k} d={`M ${-k * 16} -8 l 12 8 l -12 8`} fill="none" stroke={col} strokeWidth={3} />
    ))}
  </g>
);
const ShipSide: React.FC<{ x: number; y: number; s?: number; col?: string; o?: number; fill?: string }> = ({ x, y, s = 1, col = ICE, o = 1, fill = "rgba(159,230,255,0.08)" }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>
    <path d="M -60 10 L 50 10 L 64 -6 L 34 -6 L 28 -22 L -10 -22 L -16 -34 L -24 -34 L -28 -6 L -60 -6 Z" fill={fill} stroke={col} strokeWidth={2 / s} />
  </g>
);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// ============================================================================================ 9 · 1) o caminho da manifestação
// o Borealis pisca de volta; colunas Combine partem; a trilha das próximas aparições (navios-fantasma pontilhados) cruza o
// mapa e a instalação está bem em cima dela. "É ali": trava. "O problema é chegar": a distância da frota e a faixa da
// tundra controlada (vermelha, hachurada, com patrulhas).
export const HLManifestPath: React.FC<{ life: number; moveAt?: number; knowAt?: number; coordAt?: number; pathAt?: number; whereAt?: number; hereAt?: number; probAt?: number; beltAt?: number; actionAt?: number }> = ({
  life,
  moveAt = 1e9,
  knowAt = 1e9,
  coordAt = 1e9,
  pathAt = 1e9,
  whereAt = 1e9,
  hereAt = 1e9,
  probAt = 1e9,
  beltAt = 1e9,
  actionAt = 1e9,
}) => {
  const f = useCurrentFrame();
  void life;
  const SHIP = { x: 360, y: 430 };
  const FAC = { x: 1420, y: 360 };
  const FLEET = { x: 330, y: 900 };
  const ghosts = [0, 1, 2, 3, 4].map((i) => ({ x: lerp(SHIP.x + 230, 1700, i / 4), y: lerp(SHIP.y - 10, 300, i / 4) + Math.sin(i * 1.4) * 40 }));
  const push = P(f, actionAt, 40);
  const T = `translate(960 540) scale(${1 + 0.18 * push}) translate(${-960 - 120 * push} ${-540 - 60 * push})`;
  const march = P(f, moveAt, 120);
  return (
    <AbsoluteFill style={{ background: BG9(), overflow: "hidden", fontFamily: MONO }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <g transform={T}>
          {Array.from({ length: 28 }).map((_, i) => (
            <line key={"g" + i} x1={i * 72} x2={i * 72} y1={0} y2={1080} stroke="rgba(159,230,255,0.05)" />
          ))}
          {Array.from({ length: 16 }).map((_, i) => (
            <line key={"h" + i} x1={0} x2={1920} y1={i * 72} y2={i * 72} stroke="rgba(159,230,255,0.05)" />
          ))}
          <path d="M 0 980 C 220 930 360 1000 520 940 C 640 900 760 960 860 930 L 860 1080 L 0 1080 Z" fill="rgba(159,230,255,0.05)" stroke="rgba(159,230,255,0.4)" strokeWidth={2} />
          {/* o Borealis volta */}
          <ShipSide x={SHIP.x} y={SHIP.y} s={1.6} o={P(f, 0, 10) * (rnd(Math.floor(f / 2)) > 0.12 ? 1 : 0.3)} />
          <circle cx={SHIP.x} cy={SHIP.y} r={60 + (f % 40) * 3} fill="none" stroke={ICE} strokeWidth={1.5} opacity={1 - (f % 40) / 40} />
          {/* colunas Combine */}
          {f >= moveAt ? [0, 1, 2].map((i) => <Chev key={i} x={lerp(1900, SHIP.x + 140, march) + i * 30} y={lerp(720 + i * 60, SHIP.y + 40 + i * 30, march)} a={200} o={P(f, moveAt + i * 4, 8)} n={3} />) : null}
          {/* a frota também sabe */}
          {f >= knowAt ? (
            <g opacity={P(f, knowAt, 10)}>
              {[0, 1, 2].map((k) => (
                <path key={k} d={`M ${FLEET.x - 30 + k * 26} ${FLEET.y + k * 10} l 18 0 l 6 -6 l -30 0 Z`} fill={GREEN} />
              ))}
              <text x={FLEET.x} y={FLEET.y + 46} textAnchor="middle" fill={GREEN} fontFamily={MONO} fontSize={15} letterSpacing={3}>FROTA · RESISTÊNCIA</text>
            </g>
          ) : null}
          {/* as próximas aparições */}
          {f >= pathAt
            ? ghosts.map((g, i) => (
                <g key={i} opacity={P(f, pathAt + i * 5, 8) * 0.8}>
                  <ShipSide x={g.x} y={g.y} s={0.9} col="rgba(159,230,255,0.6)" fill="none" />
                  {i < 4 ? <line x1={g.x + 60} y1={g.y} x2={ghosts[i + 1].x - 60} y2={ghosts[i + 1].y} stroke="rgba(159,230,255,0.4)" strokeDasharray="4 8" /> : null}
                </g>
              ))
            : null}
          {f >= pathAt ? <text x={ghosts[3].x} y={ghosts[3].y - 50} textAnchor="middle" fill={ICE} fontFamily={MONO} fontSize={14} letterSpacing={3} opacity={P(f, pathAt + 20, 8)}>PRÓXIMA MANIFESTAÇÃO</text> : null}
          {/* a instalação no caminho */}
          {f >= coordAt ? (
            <g transform={`translate(${FAC.x} ${FAC.y})`} opacity={P(f, coordAt, 10)}>
              <rect x={-36} y={-22} width={72} height={44} fill="rgba(255,93,77,0.12)" stroke={RED} strokeWidth={2.5} />
              <rect x={-16} y={-46} width={26} height={24} fill="none" stroke={RED} strokeWidth={2} />
              <text x={0} y={48} textAnchor="middle" fill={RED} fontFamily={MONO} fontSize={13} letterSpacing={3}>INSTALAÇÃO COMBINE</text>
            </g>
          ) : null}
          {f >= hereAt ? (
            <g transform={`translate(${FAC.x} ${FAC.y})`}>
              <circle r={lerp(200, 70, P(f, hereAt, 14))} fill="none" stroke={AMB} strokeWidth={3} />
              {[0, 1, 2, 3].map((k) => (
                <line key={k} x1={0} y1={-84} x2={0} y2={-104} stroke={AMB} strokeWidth={3} transform={`rotate(${k * 90})`} />
              ))}
            </g>
          ) : null}
          {/* a distância */}
          {f >= probAt ? (
            <g opacity={P(f, probAt, 10)}>
              <line x1={FLEET.x + 40} y1={FLEET.y - 20} x2={FAC.x - 40} y2={FAC.y + 30} stroke={CREAM} strokeWidth={2} strokeDasharray="6 8" />
              <text x={(FLEET.x + FAC.x) / 2 + 30} y={(FLEET.y + FAC.y) / 2 + 40} fill={CREAM} fontFamily={MONO} fontSize={18} letterSpacing={3}>{`${Math.round(interpolate(f, [probAt, probAt + 30], [0, 312], C))} KM`}</text>
            </g>
          ) : null}
          {/* a faixa controlada */}
          {f >= beltAt ? (
            <g opacity={P(f, beltAt, 14)}>
              <defs>
                <pattern id="hatch9" width="18" height="18" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                  <line x1={0} y1={0} x2={0} y2={18} stroke="rgba(255,93,77,0.45)" strokeWidth={4} />
                </pattern>
              </defs>
              <path d="M 560 0 L 980 0 L 1180 1080 L 760 1080 Z" fill="url(#hatch9)" stroke={RED} strokeWidth={2} />
              {[0, 1, 2, 3].map((k) => {
                const t = ((f - beltAt) * 0.008 + k * 0.25) % 1;
                return <circle key={k} cx={lerp(640, 1100, t) + (k % 2) * 40} cy={lerp(60, 1020, t)} r={7} fill={RED} />;
              })}
              <text x={870} y={140} textAnchor="middle" fill={RED} fontFamily={MONO} fontSize={18} letterSpacing={4}>TUNDRA · CONTROLE COMBINE</text>
            </g>
          ) : null}
          {f >= actionAt ? <path d={`M ${FLEET.x + 40} ${FLEET.y - 40} C 700 760 900 520 ${FAC.x - 60} ${FAC.y + 40}`} fill="none" stroke={AMB} strokeWidth={6} pathLength={1} strokeDasharray="1" strokeDashoffset={1 - P(f, actionAt, 40)} /> : null}
        </g>
      </svg>
      <Title9 t={f >= beltAt ? "ENTRE A FROTA E A INSTALAÇÃO" : "BOREALIS · REAPARECEU"} />
      {f >= whereAt && f < probAt ? (
        <div style={{ position: "absolute", right: 80, top: 520, width: 520, padding: "16px 20px", border: `1px solid ${AMB}`, borderRadius: 8, background: "rgba(14,10,4,0.88)", opacity: P(f, whereAt, 8) }}>
          <div style={{ fontSize: 15, letterSpacing: 4, color: AMB }}>O QUE OS ADVISORS FAZEM</div>
          <div style={{ fontSize: 28, letterSpacing: 4, color: CREAM, marginTop: 6 }}>COM O CATALISADOR</div>
          {f >= hereAt ? <div style={{ fontSize: 22, letterSpacing: 4, color: AMB, marginTop: 10, opacity: flickIn(f, hereAt) }}>→ ESTÁ ALI</div> : null}
        </div>
      ) : null}
      {f >= actionAt ? <div style={{ position: "absolute", left: 0, right: 0, bottom: 70, textAlign: "center", fontSize: 30, letterSpacing: 8, color: AMB, opacity: flickIn(f, actionAt) }}>SEQUÊNCIA DE AÇÃO</div> : null}
    </AbsoluteFill>
  );
};

// ============================================================================================ 9 · 2) o comboio no gelo
// vista de cima, o gelo correndo por baixo; o comboio monta: buggy na frente (com a referência do HL2 num quadro), Dog por
// fora, Barney com os veículos, Varga na retaguarda. A corrida acelera; sombras de gunships cruzam, hunters nos flancos,
// striders ao longe; a rota principal fecha e o comboio desvia para o gelo que racha embaixo dele.
export const HLConvoy: React.FC<{ life: number; buggyAt?: number; dogAt?: number; barneyAt?: number; vargaAt?: number; raceAt?: number; gunAt?: number; flankAt?: number; stridAt?: number; offAt?: number; crackAt?: number }> = ({
  life,
  buggyAt = 0,
  dogAt = 1e9,
  barneyAt = 1e9,
  vargaAt = 1e9,
  raceAt = 1e9,
  gunAt = 1e9,
  flankAt = 1e9,
  stridAt = 1e9,
  offAt = 1e9,
  crackAt = 1e9,
}) => {
  const f = useCurrentFrame();
  void life;
  const speed = 4 + 10 * P(f, raceAt, 40);
  // deslocamento acumulado (aprox.: integra a velocidade)
  const dist = f * 4 + Math.max(0, f - raceAt) * 10 * 0.9;
  const veer = P(f, offAt + 20, 50) * 190;
  const Y = 520 + veer;
  const units = [
    { at: buggyAt, x: 1230, y: Y, w: 46, h: 26, c: AMB, n: "BUGGY · GORDON" },
    { at: barneyAt, x: 1090, y: Y, w: 60, h: 30, c: CREAM, n: "BARNEY" },
    { at: barneyAt + 4, x: 1000, y: Y + 8, w: 60, h: 30, c: CREAM, n: "" },
    { at: barneyAt + 8, x: 910, y: Y - 6, w: 60, h: 30, c: CREAM, n: "" },
    { at: vargaAt, x: 760, y: Y, w: 70, h: 34, c: GREEN, n: "VARGA · RETAGUARDA" },
    { at: vargaAt + 5, x: 670, y: Y + 10, w: 70, h: 34, c: GREEN, n: "" },
  ];
  const dogY = Y - 80 + Math.sin(f / 4) * 6;
  return (
    <AbsoluteFill style={{ background: "#0b131a", overflow: "hidden", fontFamily: MONO }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {/* o gelo correndo */}
        {Array.from({ length: 40 }).map((_, i) => {
          const x = ((i * 173 - dist * (0.6 + rnd(i) * 0.6)) % 2100 + 2100) % 2100 - 90;
          const y = 60 + rnd(i * 3.1) * 960;
          return <path key={i} d={`M ${x} ${y} l ${40 + rnd(i) * 80} ${-6 + rnd(i * 2) * 12}`} stroke="rgba(159,230,255,0.18)" strokeWidth={2} />;
        })}
        {f >= raceAt
          ? Array.from({ length: 18 }).map((_, i) => {
              const x = ((i * 211 - dist * 2) % 2100 + 2100) % 2100 - 90;
              return <line key={"s" + i} x1={x} x2={x + 140} y1={Y - 120 + rnd(i) * 260} y2={Y - 120 + rnd(i) * 260} stroke="rgba(255,226,176,0.25)" strokeWidth={1.5} opacity={P(f, raceAt, 20)} />;
            })
          : null}
        {/* a rota principal */}
        <line x1={0} x2={1920} y1={520} y2={520} stroke={f >= offAt ? RED : "rgba(255,226,176,0.25)"} strokeWidth={2} strokeDasharray="14 12" strokeDashoffset={dist} />
        {f >= offAt ? <text x={1500} y={500} fill={RED} fontFamily={MONO} fontSize={16} letterSpacing={3} opacity={flickIn(f, offAt)}>ROTA PRINCIPAL · BLOQUEADA</text> : null}
        {/* o gelo racha */}
        {f >= crackAt
          ? Array.from({ length: 9 }).map((_, i) => {
              const x0 = 420 + i * 140;
              const g = P(f, crackAt + i * 4, 20);
              return <path key={"c" + i} d={`M ${x0} ${Y + 40} l ${30 * g} ${60 * g} l ${-24 * g} ${50 * g} l ${40 * g} ${70 * g}`} fill="none" stroke={ICE} strokeWidth={2.5} />;
            })
          : null}
        {/* veículos (grupo ampliado em volta do comboio) */}
        <g transform={`translate(900 ${Y}) scale(1.75) translate(-900 ${-Y})`}>
        {units.map((u, i) =>
          f >= u.at ? (
            <g key={i} transform={`translate(${u.x + (1 - P(f, u.at, 16)) * -300} ${u.y + Math.sin((f + i * 9) / 7) * 3})`} opacity={P(f, u.at, 8)}>
              <rect x={-u.w / 2} y={-u.h / 2} width={u.w} height={u.h} rx={6} fill="rgba(0,0,0,0.4)" stroke={u.c} strokeWidth={2.5} />
              <line x1={u.w / 2} x2={u.w / 2 + 26} y1={0} y2={0} stroke={u.c} strokeWidth={1.5} opacity={0.5} />
              {u.n ? (
                <text x={0} y={-u.h / 2 - 14} textAnchor="middle" fill={u.c} fontFamily={MONO} fontSize={15} letterSpacing={3}>
                  {u.n}
                </text>
              ) : null}
            </g>
          ) : null,
        )}
        {/* o Dog por fora */}
        {f >= dogAt ? (
          <g opacity={P(f, dogAt, 8)}>
            <circle cx={1150} cy={dogY} r={14} fill={GREEN} opacity={0.85} />
            <circle cx={1150} cy={dogY} r={24} fill="none" stroke={GREEN} strokeWidth={1.5} />
            <text x={1150} y={dogY - 34} textAnchor="middle" fill={GREEN} fontFamily={MONO} fontSize={15} letterSpacing={3}>DOG · POR FORA</text>
          </g>
        ) : null}
        </g>
        {/* gunships */}
        {f >= gunAt
          ? [0, 1].map((k) => {
              const t = ((f - gunAt - k * 30) / 70) % 1.4;
              if (t < 0) return null;
              const x = lerp(-200, 2100, t / 1.4);
              const y = 180 + k * 120;
              return (
                <g key={"gs" + k}>
                  <ellipse cx={x} cy={y} rx={90} ry={22} fill="rgba(255,93,77,0.18)" stroke={RED} strokeWidth={1.5} />
                  <line x1={x} y1={y + 20} x2={x - 60} y2={Y - 30} stroke={RED} strokeWidth={1.5} strokeDasharray="6 10" opacity={Math.floor(f / 3) % 2 ? 0.9 : 0.2} />
                  <text x={x} y={y - 30} textAnchor="middle" fill={RED} fontFamily={MONO} fontSize={13} letterSpacing={3}>GUNSHIP</text>
                </g>
              );
            })
          : null}
        {/* hunters nos flancos */}
        {f >= flankAt
          ? [0, 1, 2, 3].map((k) => {
              const top = k % 2 === 0;
              const x = 700 + k * 180 + Math.sin((f + k * 20) / 12) * 30;
              const y = top ? Y - 250 : Y + 230;
              return (
                <g key={"h" + k} transform={`translate(${x} ${y})`} opacity={P(f, flankAt + k * 5, 8)}>
                  <path d="M -12 10 L 0 -14 L 12 10 Z" fill="rgba(255,93,77,0.3)" stroke={RED} strokeWidth={2} />
                  {k < 2 ? <text x={0} y={top ? -24 : 32} textAnchor="middle" fill={RED} fontFamily={MONO} fontSize={12} letterSpacing={3}>HUNTER</text> : null}
                </g>
              );
            })
          : null}
        {/* striders ao longe */}
        {f >= stridAt
          ? [0, 1].map((k) => {
              const x = 1780 - k * 110 - Math.max(0, f - stridAt) * 0.5;
              const y = 160 + k * 60;
              return (
                <g key={"st" + k} transform={`translate(${x} ${y})`} opacity={P(f, stridAt + k * 8, 10)}>
                  <circle r={30 + 8 * Math.sin(f / 6 + k)} fill="none" stroke={RED} strokeWidth={2} />
                  <circle r={6} fill={RED} />
                  <text x={0} y={-44} textAnchor="middle" fill={RED} fontFamily={MONO} fontSize={13} letterSpacing={3}>STRIDER</text>
                </g>
              );
            })
          : null}
      </svg>
      <Title9 t="COMBOIO · TUNDRA" col={AMB} />
      <div style={{ position: "absolute", left: 70, bottom: 60, fontSize: 18, letterSpacing: 4, color: CREAM, opacity: P(f, raceAt, 10) }}>{`VELOCIDADE ${Math.round(40 + speed * 6)} KM/H`}</div>
      {/* referência HL2 do buggy */}
      {f >= buggyAt && f < dogAt + 20 ? (
        <div style={{ position: "absolute", right: 70, top: 120, width: 480, height: 270, border: `2px solid ${AMB}`, borderRadius: 10, overflow: "hidden", opacity: P(f, buggyAt, 10) * (1 - P(f, dogAt + 10, 10)) }}>
          <Sequence from={Math.round(buggyAt)} premountFor={30}>
            <Clip src="videos/hl3_M01_1C/clips/hl2_buggy.mp4" from={1} />
          </Sequence>
          <div style={{ position: "absolute", left: 10, bottom: 8, fontSize: 13, letterSpacing: 3, color: CREAM, textShadow: "0 2px 6px #000" }}>REF · HALF-LIFE 2</div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ============================================================================================ 9 · 3) eles chegam antes
// mapa tático: toda rota que o Varga escolhe já tem alguém esperando no fim; na ponte lateral do Barney a equipe Combine
// chega primeiro (corrida de dois pontos); a emboscada é um círculo e as tropas contornam ele.
export const HLPredicted: React.FC<{ life: number; diffAt?: number; knowAt?: number; vargaAt?: number; waitAt?: number; barneyAt?: number; firstAt?: number; ambAt?: number; skipAt?: number }> = ({
  life,
  diffAt = 0,
  knowAt = 1e9,
  vargaAt = 1e9,
  waitAt = 1e9,
  barneyAt = 1e9,
  firstAt = 1e9,
  ambAt = 1e9,
  skipAt = 1e9,
}) => {
  const f = useCurrentFrame();
  void life;
  // rotas do Varga (três tentativas, cada uma termina num vermelho)
  const tries = [0, 1, 2].map((k) => ({ at: vargaAt + k * 18, y: 300 + k * 140 }));
  const bt = P(f, barneyAt, 60);
  const ct = P(f, barneyAt + 6, 40);
  const ambT = P(f, skipAt, 70);
  return (
    <AbsoluteFill style={{ background: BG9("#0c1218"), overflow: "hidden", fontFamily: MONO }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {Array.from({ length: 28 }).map((_, i) => (
          <line key={i} x1={i * 72} x2={i * 72} y1={0} y2={1080} stroke="rgba(159,230,255,0.04)" />
        ))}
        {/* a fenda com as pontes */}
        <path d="M 1200 0 C 1160 200 1260 380 1200 560 C 1150 720 1250 900 1210 1080" fill="none" stroke="rgba(159,230,255,0.5)" strokeWidth={3} />
        <path d="M 1260 0 C 1220 200 1320 380 1260 560 C 1210 720 1310 900 1270 1080" fill="none" stroke="rgba(159,230,255,0.5)" strokeWidth={3} />
        {/* rotas do Varga */}
        {tries.map((t, k) =>
          f >= t.at ? (
            <g key={k}>
              <path d={`M 200 600 C 420 600 520 ${t.y} 760 ${t.y}`} fill="none" stroke={AMB} strokeWidth={3} strokeDasharray="10 8" pathLength={1} strokeDashoffset={0} opacity={P(f, t.at, 8) * (k === 2 || f < tries[k + 1].at ? 1 : 0.35)} />
              <circle cx={780} cy={t.y} r={14} fill={RED} opacity={P(f, Math.max(t.at + 6, waitAt), 6)} />
              {f >= waitAt ? <text x={810} y={t.y + 6} fill={RED} fontFamily={MONO} fontSize={14} letterSpacing={2} opacity={P(f, Math.max(t.at + 8, waitAt), 6)}>JÁ ESPERANDO</text> : null}
            </g>
          ) : null,
        )}
        {f >= vargaAt ? <text x={200} y={640} textAnchor="middle" fill={AMB} fontFamily={MONO} fontSize={14} letterSpacing={3}>VARGA</text> : null}
        {/* a ponte lateral do Barney */}
        {f >= barneyAt ? (
          <g>
            <rect x={1170} y={840} width={130} height={22} fill="none" stroke={ICE} strokeWidth={2} />
            <text x={1235} y={830} textAnchor="middle" fill={ICE} fontFamily={MONO} fontSize={13} letterSpacing={3}>PONTE LATERAL</text>
            <circle cx={lerp(700, 1150, bt)} cy={lerp(980, 852, bt)} r={12} fill={CREAM} />
            <text x={lerp(700, 1150, bt)} y={lerp(980, 852, bt) + 34} textAnchor="middle" fill={CREAM} fontFamily={MONO} fontSize={13} letterSpacing={3}>BARNEY</text>
            <circle cx={lerp(1700, 1320, ct)} cy={lerp(700, 852, ct)} r={12} fill={RED} />
            {f >= firstAt ? <text x={1340} y={900} fill={RED} fontFamily={MONO} fontSize={16} letterSpacing={3} opacity={flickIn(f, firstAt)}>COMBINE · CHEGOU ANTES</text> : null}
          </g>
        ) : null}
        {/* a emboscada que ninguém pisa */}
        {f >= ambAt ? (
          <g opacity={P(f, ambAt, 10)}>
            <circle cx={1600} cy={330} r={120} fill="rgba(255,178,46,0.08)" stroke={AMB} strokeWidth={2.5} strokeDasharray="8 8" />
            <text x={1600} y={336} textAnchor="middle" fill={AMB} fontFamily={MONO} fontSize={16} letterSpacing={4}>EMBOSCADA</text>
            {f >= skipAt
              ? [0, 1, 2].map((k) => {
                  const a = Math.PI + ambT * Math.PI + k * 0.18;
                  return <circle key={k} cx={1600 + Math.cos(a) * 170} cy={330 + Math.sin(a) * 170} r={9} fill={RED} />;
                })
              : null}
            {f >= skipAt ? <path d="M 1430 330 A 170 170 0 0 1 1770 330" fill="none" stroke={RED} strokeWidth={1.5} strokeDasharray="4 6" opacity={0.6} /> : null}
          </g>
        ) : null}
      </svg>
      <Title9 t="TÁTICO · TUNDRA" o={P(f, diffAt, 8)} />
      {f >= knowAt ? <div style={{ position: "absolute", left: 0, right: 0, top: 110, textAlign: "center", fontSize: 34, letterSpacing: 8, color: RED, opacity: flickIn(f, knowAt) }}>ELES SABEM O PRÓXIMO MOVIMENTO</div> : null}
    </AbsoluteFill>
  );
};

// ============================================================================================ 9 · 4) a voz interceptada
// o dial varre as frequências no chiado; trava numa; a forma de onda vira voz; a impressão vocal fecha: ALYX VANCE; ela
// vira um nó no centro ligado a todas as unidades Combine (a ofensiva sai dela).
export const HLInterceptAlyx: React.FC<{ life: number; hearAt?: number; freqAt?: number; isAt?: number; coordAt?: number }> = ({ life, hearAt = 0, freqAt = 1e9, isAt = 1e9, coordAt = 1e9 }) => {
  const f = useCurrentFrame();
  void life;
  const locked = f >= freqAt;
  const needle = locked ? 142.7 : 120 + 40 * (0.5 + 0.5 * Math.sin((f - hearAt) / 14)) + (rnd(Math.floor(f / 3)) - 0.5) * 2;
  const net = P(f, coordAt, 20);
  const units = Array.from({ length: 12 }).map((_, i) => ({ a: (i / 12) * Math.PI * 2 + 0.2, r: 300 + rnd(i * 4) * 150 }));
  return (
    <AbsoluteFill style={{ background: BG9("#0e0c14"), overflow: "hidden", fontFamily: MONO }}>
      <Title9 t="FREQUÊNCIAS COMBINE · INTERCEPTAÇÃO" col={GREEN} />
      {/* dial */}
      <div style={{ position: "absolute", left: 160, right: 160, top: 150, height: 90, borderTop: "1px solid rgba(141,255,168,0.3)", borderBottom: "1px solid rgba(141,255,168,0.3)", opacity: 1 - net * 0.7 }}>
        <svg width={1600} height={90}>
          {Array.from({ length: 81 }).map((_, i) => (
            <line key={i} x1={i * 20} x2={i * 20} y1={0} y2={i % 5 === 0 ? 30 : 14} stroke={GREEN} opacity={0.5} />
          ))}
          {[110, 120, 130, 140, 150, 160].map((v) => (
            <text key={v} x={((v - 110) / 50) * 1600} y={60} textAnchor="middle" fill={GREEN} fontFamily={MONO} fontSize={14} opacity={0.7}>
              {v}
            </text>
          ))}
          <line x1={((needle - 110) / 50) * 1600} x2={((needle - 110) / 50) * 1600} y1={0} y2={90} stroke={locked ? AMB : RED} strokeWidth={3} />
        </svg>
      </div>
      <div style={{ position: "absolute", left: 160, top: 260, fontSize: 22, letterSpacing: 4, color: locked ? AMB : "rgba(141,255,168,0.7)", opacity: 1 - net * 0.7 }}>{locked ? "142.7 MHz · TRAVADA" : `${needle.toFixed(1)} MHz · BUSCANDO`}</div>
      {/* forma de onda */}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: 1 - net * 0.8 }}>
        {Array.from({ length: 200 }).map((_, i) => {
          const noise = (rnd(i + f * 1.3) - 0.5) * 50;
          const voice = Math.sin(i * 0.3 + f * 0.4) * 90 * Math.abs(Math.sin(i * 0.05 + f * 0.07)) * (rnd(Math.floor(f / 5) + i * 0.01) > 0.3 ? 1 : 0.2);
          const h = Math.abs(locked ? voice * P(f, freqAt, 12) + noise * (1 - P(f, freqAt, 12)) : noise) + 2;
          return <rect key={i} x={160 + i * 8} y={480 - h / 2} width={4} height={h} fill={locked ? AMB : GREEN} opacity={0.75} />;
        })}
      </svg>
      {/* impressão vocal */}
      {f >= isAt ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: f >= coordAt ? 470 - 400 * net : 640, display: "flex", justifyContent: "center", opacity: P(f, isAt, 8) }}>
          <div style={{ padding: "16px 30px", border: `2px solid ${AMB}`, borderRadius: 12, background: "rgba(14,10,4,0.9)", textAlign: "center", transform: `scale(${1 - 0.3 * net})` }}>
            <div style={{ fontSize: 16, letterSpacing: 5, color: AMB }}>{`IMPRESSÃO VOCAL · ${Math.round(interpolate(f, [isAt, isAt + 20], [40, 98], C))}%`}</div>
            <div style={{ fontSize: 60, letterSpacing: 8, color: CREAM, marginTop: 6 }}>ALYX VANCE</div>
          </div>
        </div>
      ) : null}
      {/* ela comanda a ofensiva */}
      {f >= coordAt ? (
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: net }}>
          {units.map((u, i) => {
            const x = 960 + Math.cos(u.a) * u.r * 1.4;
            const y = 600 + Math.sin(u.a) * u.r * 0.8;
            const t = ((f - coordAt) / 30 + i * 0.13) % 1;
            return (
              <g key={i}>
                <line x1={960} y1={600} x2={x} y2={y} stroke={AMB} strokeWidth={1.5} opacity={0.5} />
                <circle cx={lerp(960, x, t)} cy={lerp(600, y, t)} r={4} fill={AMB} />
                <Chev x={x} y={y} a={(Math.atan2(y - 600, x - 960) * 180) / Math.PI} n={2} />
              </g>
            );
          })}
          <circle cx={960} cy={600} r={40 + 4 * Math.sin(f / 5)} fill="rgba(255,178,46,0.2)" stroke={AMB} strokeWidth={3} />
          <text x={960} y={1000} textAnchor="middle" fill={AMB} fontFamily={MONO} fontSize={26} letterSpacing={6}>ELA COORDENA A OFENSIVA</text>
        </svg>
      ) : null}
    </AbsoluteFill>
  );
};

// ============================================================================================ 9 · 5) o que o Kleiner reconstrói
// linha do tempo: o Gordon cai em Xen (o ponto dele desce por um portal); a Alyx fica no navio; a fase do navio é uma onda
// que encosta na linha do presente (a janela); ela sai junto com os Advisors; a função dela chega tarjada.
export const HLAlyxTimeline: React.FC<{ life: number; rebuildAt?: number; xenAt?: number; stayAt?: number; windowAt?: number; leftAt?: number; roleAt?: number; specAt?: number }> = ({
  life,
  rebuildAt = 0,
  xenAt = 1e9,
  stayAt = 1e9,
  windowAt = 1e9,
  leftAt = 1e9,
  roleAt = 1e9,
  specAt = 1e9,
}) => {
  const f = useCurrentFrame();
  void life;
  const PY = 620; // a linha do presente
  const SX = 760;
  const SY = 400;
  const wave = (x: number) => PY - 220 + Math.sin(x / 120 - f * 0.03) * 180 * (1 - 0.0 * x);
  const wx = 1180; // onde a onda toca o presente
  const out = P(f, leftAt, 50);
  return (
    <AbsoluteFill style={{ background: BG9(), overflow: "hidden", fontFamily: MONO }}>
      <Title9 t="DR. KLEINER · RECONSTRUÇÃO" o={P(f, rebuildAt, 8)} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <line x1={100} x2={1820} y1={PY} y2={PY} stroke={CREAM} strokeWidth={2.5} opacity={0.7} />
        <text x={1820} y={PY + 30} textAnchor="end" fill={CREAM} fontFamily={MONO} fontSize={15} letterSpacing={4} opacity={0.7}>PRESENTE</text>
        {/* o Gordon cai em Xen */}
        {f >= xenAt ? (
          <g opacity={P(f, xenAt, 8)}>
            <ellipse cx={360} cy={PY + 160} rx={80} ry={24} fill="rgba(141,255,168,0.12)" stroke={GREEN} strokeWidth={2} />
            <circle cx={360} cy={lerp(PY - 40, PY + 160, P(f, xenAt + 6, 24))} r={11} fill={AMB} opacity={1 - P(f, xenAt + 26, 8)} />
            <text x={360} y={PY + 220} textAnchor="middle" fill={GREEN} fontFamily={MONO} fontSize={15} letterSpacing={3}>GORDON · CAI EM XEN</text>
          </g>
        ) : null}
        {/* o navio e a fase dele */}
        {f >= stayAt ? (
          <g opacity={P(f, stayAt, 10)}>
            <path d={Array.from({ length: 80 }).map((_, i) => `${i ? "L" : "M"} ${500 + i * 18} ${wave(500 + i * 18)}`).join(" ")} fill="none" stroke="rgba(159,230,255,0.5)" strokeWidth={2} />
            <ShipSide x={SX} y={SY} s={1.4} />
            <text x={SX} y={SY - 70} textAnchor="middle" fill={ICE} fontFamily={MONO} fontSize={15} letterSpacing={3}>BOREALIS · FORA DE FASE</text>
            <circle cx={lerp(SX, wx + 300, out)} cy={lerp(SY, PY, out)} r={11} fill={AMB} />
            <text x={lerp(SX, wx + 300, out)} y={lerp(SY, PY, out) - 22} textAnchor="middle" fill={AMB} fontFamily={MONO} fontSize={14} letterSpacing={3}>ALYX</text>
          </g>
        ) : null}
        {/* a janela */}
        {f >= windowAt ? (
          <g opacity={P(f, windowAt, 8)}>
            <rect x={wx - 50} y={PY - 260} width={100} height={300} fill="rgba(255,178,46,0.08)" stroke={AMB} strokeWidth={2} strokeDasharray="8 6" />
            <text x={wx} y={PY - 276} textAnchor="middle" fill={AMB} fontFamily={MONO} fontSize={15} letterSpacing={3}>JANELA DE SINCRONIA</text>
          </g>
        ) : null}
        {/* os Advisors saem com ela */}
        {f >= leftAt
          ? [0, 1, 2].map((k) => {
              const t = P(f, leftAt + 4 + k * 4, 50);
              const x = lerp(SX + 40 + k * 30, wx + 260 + k * 60, t);
              const y = lerp(SY - 20, PY - 40 - k * 30, t);
              return <path key={k} d={`M ${x} ${y - 14} L ${x + 14} ${y + 10} L ${x - 14} ${y + 10} Z`} fill="rgba(199,155,255,0.25)" stroke={VIO} strokeWidth={2} />;
            })
          : null}
        {f >= leftAt ? <text x={wx + 330} y={PY - 150} textAnchor="middle" fill={VIO} fontFamily={MONO} fontSize={14} letterSpacing={3} opacity={P(f, leftAt + 30, 8)}>ADVISORS</text> : null}
      </svg>
      {f >= roleAt ? (
        <div style={{ position: "absolute", right: 100, top: 720, width: 560, padding: "16px 22px", border: `1px solid ${RED}`, borderRadius: 8, background: "rgba(14,4,4,0.88)", opacity: P(f, roleAt, 8) }}>
          <div style={{ fontSize: 15, letterSpacing: 5, color: RED }}>COMBINE · FUNÇÃO ATRIBUÍDA</div>
          <div style={{ fontSize: 28, letterSpacing: 4, color: CREAM, marginTop: 8 }}>{f >= specAt ? "████████ ESPECÍFICA" : "████████████"}</div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ============================================================================================ 9 · 6) ela conhece todo mundo
// prova de lealdade; três dossiês (Barney, Eli, Gordon): o caminho previsto (pontilhado) é desenhado e o real cai em cima;
// no fim, a corrida contra um fantasma: alguém que já terminou essa fase corre na frente.
export const HLKnowsThem: React.FC<{ life: number; proveAt?: number; knowAt?: number; teamsAt?: number; warAt?: number; goodAt?: number; notAt?: number; peopleAt?: number; barneyAt?: number; eliAt?: number; gordAt?: number; ghostAt?: number }> = ({
  life,
  proveAt = 0,
  knowAt = 1e9,
  teamsAt = 1e9,
  warAt = 1e9,
  goodAt = 1e9,
  notAt = 1e9,
  peopleAt = 1e9,
  barneyAt = 1e9,
  eliAt = 1e9,
  gordAt = 1e9,
  ghostAt = 1e9,
}) => {
  const f = useCurrentFrame();
  void life;
  const ph = f >= ghostAt ? 2 : f >= barneyAt ? 1 : 0;
  const prof = [
    { at: barneyAt, n: "BARNEY", tag: "COMO ELE PENSA", c: CREAM, path: "M 40 200 C 120 120 200 220 280 140 L 380 120" },
    { at: eliAt, n: "ELI", tag: "VAI INSISTIR NA POSIÇÃO", c: GREEN, path: "M 40 160 L 140 160 L 140 160 L 380 160" },
    { at: gordAt, n: "GORDON", tag: "O CAMINHO IMPOSSÍVEL", c: AMB, path: "M 40 220 C 100 60 200 260 260 80 C 300 0 340 200 380 60" },
  ];
  const lane = (y: number, col: string, t: number, ghost: boolean) => <circle cx={lerp(160, 1760, t)} cy={y} r={14} fill={ghost ? "rgba(199,155,255,0.35)" : col} stroke={ghost ? VIO : "none"} strokeWidth={2} />;
  const gt = Math.max(0, f - ghostAt);
  return (
    <AbsoluteFill style={{ background: BG9("#100c08"), overflow: "hidden", fontFamily: MONO }}>
      {ph === 0 ? (
        <>
          <Title9 t="ALYX · PROVA DE LEALDADE" col={AMB} />
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
            {/* ela no centro, ligada a quem ela conhece */}
            <circle cx={760} cy={560} r={46} fill="rgba(255,178,46,0.2)" stroke={AMB} strokeWidth={3} />
            <text x={760} y={640} textAnchor="middle" fill={AMB} fontFamily={MONO} fontSize={16} letterSpacing={4}>ALYX</text>
            {[
              { n: "GORDON", x: 400, y: 300 },
              { n: "ELI", x: 400, y: 820 },
              { n: "RESISTÊNCIA", x: 1100, y: 840 },
            ].map((p, i) =>
              f >= knowAt + i * 6 ? (
                <g key={i} opacity={P(f, knowAt + i * 6, 8)}>
                  <line x1={760} y1={560} x2={p.x} y2={p.y} stroke={AMB} strokeWidth={2} strokeDasharray="6 6" strokeDashoffset={-f} />
                  <circle cx={p.x} cy={p.y} r={30} fill="none" stroke={CREAM} strokeWidth={2} />
                  <text x={p.x} y={p.y + 54} textAnchor="middle" fill={CREAM} fontFamily={MONO} fontSize={15} letterSpacing={3}>{p.n}</text>
                </g>
              ) : null,
            )}
            {/* as equipes no navio × ela do lado de fora */}
            {f >= teamsAt ? (
              <g opacity={P(f, teamsAt, 8)}>
                <ShipSide x={1500} y={300} s={1.3} />
                <text x={1500} y={370} textAnchor="middle" fill={ICE} fontFamily={MONO} fontSize={14} letterSpacing={3}>EQUIPES · BOREALIS + INSTALAÇÕES</text>
              </g>
            ) : null}
            {f >= warAt ? (
              <g opacity={P(f, warAt, 8)}>
                <rect x={1320} y={470} width={380} height={170} rx={10} fill="rgba(255,93,77,0.08)" stroke={RED} strokeWidth={2} />
                <text x={1510} y={510} textAnchor="middle" fill={RED} fontFamily={MONO} fontSize={15} letterSpacing={3}>A GUERRA DO LADO DE FORA</text>
                {[0, 1, 2, 3, 4].map((k) => (
                  <Chev key={k} x={1380 + k * 64} y={580} a={0} />
                ))}
                <path d="M 806 560 C 1000 560 1150 560 1318 556" fill="none" stroke={AMB} strokeWidth={3} pathLength={1} strokeDasharray="1" strokeDashoffset={1 - P(f, warAt + 6, 20)} />
              </g>
            ) : null}
          </svg>
          {f >= goodAt ? (
            <div style={{ position: "absolute", left: 1320, top: 690, width: 380, opacity: P(f, goodAt, 8) }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18, letterSpacing: 3, color: CREAM }}>
                <span>EFICIÊNCIA</span>
                <span style={{ color: RED }}>{`${Math.round(interpolate(f, [goodAt, goodAt + 30], [0, 94], C))}%`}</span>
              </div>
              <div style={{ height: 12, border: `1px solid ${RED}`, marginTop: 8, position: "relative" }}>
                <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${interpolate(f, [goodAt, goodAt + 30], [0, 94], C)}%`, background: RED }} />
              </div>
              {f >= notAt ? (
                <div style={{ marginTop: 18, fontSize: 18, letterSpacing: 3, opacity: P(f, notAt, 8) }}>
                  <div style={{ color: "rgba(255,226,176,0.5)", textDecoration: "line-through" }}>GRANDE ESTRATEGISTA</div>
                  {f >= peopleAt ? <div style={{ color: AMB, marginTop: 6 }}>CONHECE AS PESSOAS</div> : null}
                </div>
              ) : null}
            </div>
          ) : null}
        </>
      ) : null}
      {ph === 1 ? (
        <>
          <Title9 t="ALYX · O QUE ELA SABE" col={AMB} />
          <div style={{ position: "absolute", left: 90, right: 90, top: 200, display: "flex", gap: 40, justifyContent: "center" }}>
            {prof.map((p, i) =>
              f >= p.at ? (
                <div key={i} style={{ width: 520, height: 540, padding: 22, border: `1px solid ${p.c}`, borderRadius: 12, background: "rgba(8,8,8,0.85)", opacity: flickIn(f, p.at), position: "relative" }}>
                  <div style={{ fontSize: 15, letterSpacing: 5, color: "rgba(255,226,176,0.6)" }}>DOSSIÊ</div>
                  <div style={{ fontSize: 46, letterSpacing: 6, color: p.c }}>{p.n}</div>
                  <svg width={420} height={280} style={{ marginTop: 20 }}>
                    <path d={p.path} fill="none" stroke={VIO} strokeWidth={3} strokeDasharray="8 8" pathLength={1} />
                    <path d={p.path} fill="none" stroke={p.c} strokeWidth={4} pathLength={1} strokeDasharray="1" strokeDashoffset={1 - P(f, p.at + 16, 30)} />
                  </svg>
                  <div style={{ display: "flex", gap: 20, fontSize: 13, letterSpacing: 3 }}>
                    <span style={{ color: VIO }}>- - PREVISTO</span>
                    <span style={{ color: p.c }}>— REAL</span>
                  </div>
                  <div style={{ fontSize: 22, letterSpacing: 3, color: CREAM, marginTop: 14 }}>{p.tag}</div>
                  {f >= p.at + 46 ? <div style={{ position: "absolute", right: 20, top: 24, fontSize: 18, letterSpacing: 3, color: GREEN, opacity: flickIn(f, p.at + 46) }}>100% ✓</div> : null}
                </div>
              ) : null,
            )}
          </div>
        </>
      ) : null}
      {ph === 2 ? (
        <>
          <Title9 t="CORRIDA · CONTRA QUEM JÁ TERMINOU A FASE" col={VIO} />
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
            {[420, 640].map((y) => (
              <line key={y} x1={160} x2={1760} y1={y} y2={y} stroke="rgba(255,226,176,0.2)" strokeWidth={2} />
            ))}
            <line x1={1760} x2={1760} y1={360} y2={700} stroke={CREAM} strokeWidth={3} strokeDasharray="10 8" />
            <text x={1760} y={340} textAnchor="middle" fill={CREAM} fontFamily={MONO} fontSize={15} letterSpacing={4}>FIM DA FASE</text>
            {lane(420, AMB, Math.min(1, 0.55 + gt * 0.004), true)}
            {lane(640, AMB, Math.min(0.85, gt * 0.006), false)}
            <text x={160} y={385} fill={VIO} fontFamily={MONO} fontSize={15} letterSpacing={3}>FANTASMA · ALYX</text>
            <text x={160} y={605} fill={AMB} fontFamily={MONO} fontSize={15} letterSpacing={3}>RESISTÊNCIA</text>
            {/* o rastro do fantasma: a rota exata já marcada */}
            <path d={`M 160 640 L ${lerp(160, 1760, Math.min(1, 0.55 + gt * 0.004))} 640`} stroke={VIO} strokeWidth={2} strokeDasharray="4 10" opacity={0.6} />
          </svg>
        </>
      ) : null}
    </AbsoluteFill>
  );
};

// ============================================================================================ 9 · 7) as ordens estranhas
// presos entre um Strider e uma artilharia, o cerco vermelho fecha; chega a ordem da Alyx; parte das tropas abandona e
// vai guardar um ponto vazio; o anel abre e a rota do Gordon passa pela brecha. Depois o registro dos outros casos.
export const HLStrangeOrders: React.FC<{ life: number; notAt?: number; stuckAt?: number; loseAt?: number; cercoAt?: number; orderAt?: number; leaveAt?: number; guardAt?: number; openAt?: number; againAt?: number; offAt?: number; gunAt?: number; patAt?: number }> = ({
  life,
  notAt = 0,
  stuckAt = 1e9,
  loseAt = 1e9,
  cercoAt = 1e9,
  orderAt = 1e9,
  leaveAt = 1e9,
  guardAt = 1e9,
  openAt = 1e9,
  againAt = 1e9,
  offAt = 1e9,
  gunAt = 1e9,
  patAt = 1e9,
}) => {
  const f = useCurrentFrame();
  void life;
  const CX = 820;
  const CY = 580;
  const ringR = lerp(420, 190, P(f, cercoAt, 40));
  const leave = P(f, leaveAt, 50);
  const N = 14;
  const gapA0 = -0.3;
  const gapA1 = 0.9;
  const log = [
    { at: offAt, k: "OFENSIVA COMBINE · PAROU ANTES DO FIM" },
    { at: gunAt, k: "GUNSHIP · MUDOU DE ROTA" },
    { at: patAt, k: "PATRULHA VENCENDO · RECUOU" },
  ];
  const side = P(f, againAt, 20);
  return (
    <AbsoluteFill style={{ background: BG9("#120a08"), overflow: "hidden", fontFamily: MONO }}>
      <Title9 t={f >= notAt + 30 ? "ALGUMA COISA NÃO FECHA" : "TUNDRA · COMBATE"} col={RED} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <g transform={`translate(${-260 * side} 0)`}>
          {/* a resistência no meio */}
          {f >= stuckAt
            ? [0, 1, 2, 3, 4].map((k) => (
                <circle key={k} cx={CX - 40 + (k % 3) * 40} cy={CY - 20 + Math.floor(k / 3) * 40} r={11} fill={k === 0 ? AMB : GREEN} opacity={P(f, stuckAt, 8)} />
              ))
            : null}
          {/* strider e artilharia */}
          {f >= stuckAt ? (
            <g opacity={P(f, stuckAt, 10)}>
              <circle cx={CX} cy={CY - 330} r={36 + 6 * Math.sin(f / 6)} fill="none" stroke={RED} strokeWidth={2.5} />
              <circle cx={CX} cy={CY - 330} r={8} fill={RED} />
              <text x={CX} y={CY - 384} textAnchor="middle" fill={RED} fontFamily={MONO} fontSize={14} letterSpacing={3}>STRIDER</text>
              <rect x={CX + 300} y={CY - 30} width={70} height={44} fill="rgba(255,93,77,0.12)" stroke={RED} strokeWidth={2.5} />
              <line x1={CX + 300} y1={CY - 10} x2={CX + 250} y2={CY - 40} stroke={RED} strokeWidth={4} />
              <text x={CX + 335} y={CY + 44} textAnchor="middle" fill={RED} fontFamily={MONO} fontSize={14} letterSpacing={3}>ARTILHARIA</text>
            </g>
          ) : null}
          {/* o cerco */}
          {f >= cercoAt
            ? Array.from({ length: N }).map((_, i) => {
                const a = (i / N) * Math.PI * 2;
                const inGap = a > gapA0 + Math.PI * 1.5 - 1 && a < gapA1 + Math.PI * 1.5 - 1;
                const goes = inGap ? leave : 0;
                const x = lerp(CX + Math.cos(a) * ringR, 300 + (i % 3) * 40, goes);
                const y = lerp(CY + Math.sin(a) * ringR, 180 + (i % 2) * 40, goes);
                return <circle key={i} cx={x} cy={y} r={10} fill={RED} opacity={P(f, cercoAt + i, 6)} />;
              })
            : null}
          {f >= loseAt && f < orderAt ? <text x={CX} y={CY + 300} textAnchor="middle" fill={RED} fontFamily={MONO} fontSize={22} letterSpacing={5} opacity={flickIn(f, loseAt)}>DEVERIAM PERDER AQUI</text> : null}
          {/* o ponto que ninguém ameaça */}
          {f >= guardAt ? (
            <g opacity={P(f, guardAt, 8)}>
              <rect x={260} y={140} width={180} height={120} fill="none" stroke={RED} strokeWidth={2} strokeDasharray="6 6" />
              <text x={350} y={290} textAnchor="middle" fill={RED} fontFamily={MONO} fontSize={13} letterSpacing={3}>PONTO K-7 · SEM AMEAÇA</text>
              <text x={350} y={215} textAnchor="middle" fill={CREAM} fontFamily={MONO} fontSize={36}>?</text>
            </g>
          ) : null}
          {/* a brecha */}
          {f >= openAt ? <path d={`M ${CX} ${CY} C ${CX + 120} ${CY + 200} ${CX + 260} ${CY + 300} ${CX + 520} ${CY + 380}`} fill="none" stroke={AMB} strokeWidth={5} pathLength={1} strokeDasharray="1" strokeDashoffset={1 - P(f, openAt, 30)} /> : null}
          {f >= openAt ? <text x={CX + 540} y={CY + 400} fill={AMB} fontFamily={MONO} fontSize={16} letterSpacing={3} opacity={P(f, openAt + 20, 8)}>A PASSAGEM DO GORDON</text> : null}
        </g>
      </svg>
      {f >= orderAt && f < againAt ? (
        <div style={{ position: "absolute", right: 90, top: 150, width: 520, padding: "18px 22px", border: `2px solid ${AMB}`, borderRadius: 10, background: "rgba(14,10,4,0.92)", opacity: flickIn(f, orderAt) }}>
          <div style={{ fontSize: 15, letterSpacing: 5, color: AMB }}>ORDEM · ORIGEM: ALYX VANCE</div>
          <div style={{ fontSize: 24, letterSpacing: 3, color: CREAM, marginTop: 10 }}>{typedS(f, orderAt + 6, "ABANDONAR POSIÇÃO.", 1.6)}</div>
          <div style={{ fontSize: 24, letterSpacing: 3, color: CREAM, marginTop: 6 }}>{typedS(f, Math.max(orderAt + 30, guardAt), "PROTEGER PONTO K-7.", 1.6)}</div>
        </div>
      ) : null}
      {f >= againAt ? (
        <div style={{ position: "absolute", right: 90, top: 200, width: 640, opacity: P(f, againAt, 8) }}>
          <div style={{ fontSize: 16, letterSpacing: 5, color: RED }}>MAIS ADIANTE · DE NOVO</div>
          {log.map((l, i) =>
            f >= l.at ? (
              <div key={i} style={{ marginTop: 16, padding: "14px 18px", border: `1px solid ${RED}`, borderRadius: 8, background: "rgba(14,4,4,0.85)", fontSize: 22, letterSpacing: 3, color: CREAM, opacity: flickIn(f, l.at), transform: `translateX(${(1 - P(f, l.at, 10)) * 60}px)` }}>
                {l.k}
              </div>
            ) : null,
          )}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ============================================================================================ 9 · 8) três leituras
// um mostrador só, "INTENÇÃO DA ALYX", de HOSTIL a AJUDA: o ponteiro vai para onde cada um acha (Varga → hostil, Eli →
// ajuda, Kleiner → não para).
export const HLThreeReads: React.FC<{ life: number; vargaAt?: number; eliAt?: number; kleinerAt?: number }> = ({ life, vargaAt = 0, eliAt = 1e9, kleinerAt = 1e9 }) => {
  const f = useCurrentFrame();
  void life;
  const who = f >= kleinerAt ? 2 : f >= eliAt ? 1 : 0;
  const target = who === 0 ? -70 : who === 1 ? 70 : Math.sin((f - kleinerAt) / 9) * 65;
  const prev = who === 0 ? 0 : who === 1 ? -70 : 70;
  const at = [vargaAt, eliAt, kleinerAt][who];
  const ang = who === 2 ? lerp(prev, target, P(f, at, 12)) : lerp(prev, target, P(f, at, 18));
  const people = [
    { n: "VARGA", q: "ELA ESTÁ BRINCANDO COM ELES", c: RED },
    { n: "ELI", q: "AINDA EXISTE ALGO DA FILHA DELE", c: GREEN },
    { n: "KLEINER", q: "NÃO TEM CERTEZA DE NADA", c: ICE },
  ];
  const p = people[who];
  return (
    <AbsoluteFill style={{ background: BG9("#0c0c10"), overflow: "hidden", fontFamily: MONO }}>
      <Title9 t="INTENÇÃO DA ALYX · TRÊS LEITURAS" col={CREAM} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="gauge9" x1="0" x2="1">
            <stop offset="0" stopColor={RED} />
            <stop offset="0.5" stopColor={AMB} />
            <stop offset="1" stopColor={GREEN} />
          </linearGradient>
        </defs>
        <path d="M 560 700 A 400 400 0 0 1 1360 700" fill="none" stroke="url(#gauge9)" strokeWidth={30} strokeLinecap="round" opacity={0.85} />
        {Array.from({ length: 13 }).map((_, k) => {
          const a = Math.PI + (k / 12) * Math.PI;
          return <line key={k} x1={960 + Math.cos(a) * 350} y1={700 + Math.sin(a) * 350} x2={960 + Math.cos(a) * 372} y2={700 + Math.sin(a) * 372} stroke={CREAM} strokeWidth={2} opacity={0.5} />;
        })}
        <text x={560} y={760} textAnchor="middle" fill={RED} fontFamily={MONO} fontSize={20} letterSpacing={4}>HOSTIL</text>
        <text x={1360} y={760} textAnchor="middle" fill={GREEN} fontFamily={MONO} fontSize={20} letterSpacing={4}>AJUDA</text>
        <g transform={`translate(960 700) rotate(${ang})`}>
          <line x1={0} y1={0} x2={0} y2={-330} stroke={CREAM} strokeWidth={6} strokeLinecap="round" />
        </g>
        <circle cx={960} cy={700} r={18} fill={CREAM} />
      </svg>
      <div key={who} style={{ position: "absolute", left: 0, right: 0, top: 790, textAlign: "center", opacity: P(f, at, 8) }}>
        <div style={{ fontSize: 22, letterSpacing: 8, color: p.c }}>{p.n}</div>
        <div style={{ fontSize: 40, letterSpacing: 4, color: CREAM, marginTop: 8 }}>{p.q}</div>
      </div>
      <div style={{ position: "absolute", right: 80, top: 140, display: "flex", gap: 14 }}>
        {people.map((q, i) => (
          <div key={i} style={{ padding: "8px 14px", border: `1px solid ${q.c}`, borderRadius: 6, fontSize: 15, letterSpacing: 3, color: q.c, opacity: i === who ? 1 : i < who ? 0.4 : 0.15 }}>
            {q.n}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ============================================================================================ 9 · 9) o procedimento que nunca termina
// gráfico de progresso com a linha FIM no topo: cada cálculo da Alyx (cápsula voando) faz subir um degrau, cada falha
// derruba um pouco; com o tempo vira um dente-de-serra subindo devagar que NUNCA toca o FIM.
const procCurve = (f: number, ev: { calcAt: number; execAt: number; advAt: number; wrongAt: number; corrAt: number; moreAt: number; failAt: number; watchAt: number }) => {
  let v = 18;
  const step = (at: number, d: number, dur = 10) => (v += d * P(f, at, dur));
  step(ev.execAt, 14);
  step(ev.advAt, 10);
  step(ev.wrongAt, -12, 6);
  step(ev.corrAt, 6);
  step(ev.moreAt, 14);
  step(ev.failAt, -10, 6);
  // depois: ciclos de sobe e cai, tendendo a ~94
  if (f > ev.watchAt) {
    const t = (f - ev.watchAt) / 30;
    const cyc = t / 1.6;
    const k = Math.floor(cyc);
    const fr = cyc - k;
    const base = 40 + 54 * (1 - Math.exp(-k * 0.45));
    const up = fr < 0.7 ? fr / 0.7 : 1 - (fr - 0.7) / 0.3 * 0.6;
    v = lerp(v, base + 6 * up, Math.min(1, t / 1.2));
  }
  return Math.min(97, v);
};
export const HLProcedureLoop: React.FC<{ life: number; listenAt?: number; patAt?: number; calcAt?: number; execAt?: number; advAt?: number; wrongAt?: number; recalcAt?: number; corrAt?: number; moreAt?: number; failAt?: number; watchAt?: number; sayAt?: number; notStopAt?: number; notEndAt?: number }> = (p) => {
  const f = useCurrentFrame();
  const N = 1e9;
  const a = (v?: number) => v ?? N;
  void p.life;
  const ev = { calcAt: a(p.calcAt), execAt: a(p.execAt), advAt: a(p.advAt), wrongAt: a(p.wrongAt), corrAt: a(p.corrAt), moreAt: a(p.moreAt), failAt: a(p.failAt), watchAt: a(p.watchAt) };
  const X0 = 200;
  const X1 = 1500;
  const Y0 = 900;
  const Y1 = 260;
  const t0 = a(p.patAt);
  const span = Math.max(60, p.life - t0);
  const pts: string[] = [];
  for (let ff = t0; ff <= Math.min(f, t0 + span); ff += 2) {
    const x = lerp(X0, X1, (ff - t0) / span);
    const y = lerp(Y0, Y1, procCurve(ff, ev) / 100);
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  const cur = procCurve(f, ev);
  const curX = lerp(X0, X1, Math.min(1, (f - t0) / span));
  const curY = lerp(Y0, Y1, cur / 100);
  const pills = [
    { at: ev.calcAt, k: "CÁLCULO · ALYX" },
    { at: ev.corrAt, k: "CORREÇÃO · ALYX" },
  ];
  const marks = [
    { at: ev.execAt, k: "ETAPA EXECUTADA", c: GREEN },
    { at: ev.wrongAt, k: "ERRO", c: RED },
    { at: a(p.recalcAt), k: "RECÁLCULO", c: AMB },
    { at: ev.failAt, k: "FALHA ANTES DO FIM", c: RED },
  ];
  return (
    <AbsoluteFill style={{ background: BG9("#0d0a14"), overflow: "hidden", fontFamily: MONO }}>
      <Title9 t={f >= a(p.patAt) ? "PROCEDIMENTO DO CATALISADOR" : "DR. KLEINER · ESCUTA"} col={VIO} />
      {f < a(p.patAt) ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 360, textAlign: "center", opacity: P(f, a(p.listenAt), 10) }}>
          <div style={{ fontSize: 18, letterSpacing: 6, color: VIO }}>TRANSMISSÕES · ADVISORS</div>
          <svg width={1200} height={160} style={{ marginTop: 20 }}>
            {Array.from({ length: 150 }).map((_, i) => {
              const h = 4 + 60 * Math.abs(Math.sin(i * 0.21 + f * 0.25)) * rnd(i + Math.floor(f / 4));
              return <rect key={i} x={i * 8} y={80 - h / 2} width={4} height={h} fill={VIO} opacity={0.7} />;
            })}
          </svg>
          <div style={{ fontSize: 22, letterSpacing: 4, color: CREAM, marginTop: 14 }}>→ PESQUISAS NO BOREALIS</div>
        </div>
      ) : (
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: P(f, a(p.patAt), 10) }}>
          <line x1={X0} x2={X0} y1={Y0} y2={Y1 - 60} stroke="rgba(255,226,176,0.3)" />
          <line x1={X0} x2={X1} y1={Y0} y2={Y0} stroke="rgba(255,226,176,0.3)" />
          <line x1={X0} x2={X1 + 120} y1={Y1} y2={Y1} stroke={RED} strokeWidth={3} strokeDasharray="14 10" />
          <text x={X1 + 130} y={Y1 + 8} fill={RED} fontFamily={MONO} fontSize={22} letterSpacing={5}>FIM</text>
          <polyline points={pts.join(" ")} fill="none" stroke={VIO} strokeWidth={4} strokeLinejoin="round" />
          <circle cx={curX} cy={curY} r={9} fill={VIO} />
          {marks.map((m, i) =>
            f >= m.at && m.at < N ? (
              <g key={i} opacity={P(f, m.at, 6) * (1 - P(f, m.at + 60, 10))}>
                <text x={curX} y={curY - 30} textAnchor="middle" fill={m.c} fontFamily={MONO} fontSize={18} letterSpacing={3}>
                  {m.k}
                </text>
              </g>
            ) : null,
          )}
          {pills.map((q, i) =>
            f >= q.at && f < q.at + 30 ? (
              <g key={"p" + i} transform={`translate(${lerp(1800, curX, P(f, q.at, 24))} ${lerp(160, curY, P(f, q.at, 24))})`}>
                <rect x={-110} y={-20} width={220} height={40} rx={20} fill="rgba(255,178,46,0.15)" stroke={AMB} strokeWidth={2} />
                <text x={0} y={7} textAnchor="middle" fill={AMB} fontFamily={MONO} fontSize={15} letterSpacing={2}>
                  {q.k}
                </text>
              </g>
            ) : null,
          )}
          {f >= a(p.notStopAt) ? (
            <g opacity={P(f, a(p.notStopAt), 10)}>
              <path d={`M ${X0 + 100} ${Y0 - 60} L ${X1 - 100} ${Y1 + 120}`} stroke={GREEN} strokeWidth={3} strokeDasharray="10 10" />
              <text x={X0 + 200} y={Y0 - 120} fill={GREEN} fontFamily={MONO} fontSize={20} letterSpacing={4}>NÃO IMPEDE DE AVANÇAR</text>
            </g>
          ) : null}
          {f >= a(p.notEndAt) ? (
            <g opacity={P(f, a(p.notEndAt), 10)}>
              <rect x={curX - 40} y={Y1} width={80} height={Math.max(4, curY - Y1)} fill="rgba(255,93,77,0.2)" stroke={RED} strokeWidth={2} />
              <text x={curX - 60} y={Y1 - 20} textAnchor="end" fill={RED} fontFamily={MONO} fontSize={20} letterSpacing={4}>NÃO DEIXA CHEGAR</text>
            </g>
          ) : null}
        </svg>
      )}
      {f >= a(p.sayAt) && f < a(p.notStopAt) ? <div style={{ position: "absolute", right: 90, top: 140, fontSize: 18, letterSpacing: 4, color: ICE, opacity: P(f, a(p.sayAt), 8) }}>KLEINER · A ÚNICA CERTEZA</div> : null}
    </AbsoluteFill>
  );
};

// ============================================================================================ 9 · 10) a torre
// a torre Combine em wireframe girando, canhões na base, o strider na entrada, níveis internos com tropas. Gordon e Dog
// entram; o marcador sobe nível a nível desligando as defesas (vermelho → cinza); uma parede abre para o Dog; a gravity
// gun arremessa um canhão; no topo a barra do strider cai; o posto cai e o comboio que esperava no gelo entra.
export const HLTowerAssault: React.FC<{ life: number; reachAt?: number; roadAt?: number; towerAt?: number; strAt?: number; troopAt?: number; enterAt?: number; hl2At?: number; climbAt?: number; defAt?: number; dogAt?: number; gravAt?: number; topAt?: number; waitAt?: number; fallAt?: number; groupAt?: number }> = (p) => {
  const f = useCurrentFrame();
  const N = 1e9;
  const a = (v?: number) => v ?? N;
  void p.life;
  const cam: Cam = { fx: 0, fy: 0, yaw: 0.5 + f * 0.003, pitch: 0.3, dist: 95, cx: 760, cy: 880, F: 1250 };
  const LV = 5;
  const H = 9;
  const R = 9;
  const ring = (z: number, r = R): [number, number, number][] => Array.from({ length: 9 }).map((_, k) => [Math.cos((k / 8) * Math.PI * 2) * r, Math.sin((k / 8) * Math.PI * 2) * r, z]);
  const climb = interpolate(f, [a(p.climbAt), a(p.topAt)], [0, LV - 1], C);
  const level = f >= a(p.enterAt) ? climb : -1;
  const off = (i: number) => f >= a(p.defAt) && i <= Math.floor(climb);
  const fallen = f >= a(p.fallAt);
  const strHp = f >= a(p.topAt) ? Math.max(0, 100 - (f - a(p.topAt)) * 1.8) : 100;
  const [mx, my] = proj(cam, R * 0.4, 0, Math.max(0, level) * H + 2);
  const gT = P(f, a(p.gravAt), 26);
  const [cx0, cy0] = proj(cam, 14, 6, 0);
  const [sx, sy] = proj(cam, 0, -16, 0);
  const convoy = P(f, a(p.groupAt), 50);
  return (
    <AbsoluteFill style={{ background: BG9("#0c1116"), overflow: "hidden", fontFamily: MONO }}>
      <Title9 t={fallen ? "POSTO AVANÇADO · CAPTURADO" : "POSTO AVANÇADO · TORRE COMBINE"} col={fallen ? GREEN : RED} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {/* a estrada de gelo */}
        <polyline points={pts(cam, [[0, -80, 0], [0, -14, 0]])} stroke={CREAM} strokeWidth={3} strokeDasharray="10 8" opacity={P(f, a(p.roadAt), 10)} />
        {/* níveis */}
        {Array.from({ length: LV + 1 }).map((_, i) => (
          <polyline key={i} points={pts(cam, ring(i * H))} fill={i < LV && off(i) ? "rgba(140,140,140,0.06)" : i < LV ? "rgba(255,93,77,0.05)" : "none"} stroke={fallen ? GREEN : i < LV && off(i) ? "rgba(180,180,180,0.6)" : RED} strokeWidth={2} opacity={P(f, a(p.towerAt) + i * 3, 8)} />
        ))}
        {Array.from({ length: 8 }).map((_, k) => (
          <polyline key={"v" + k} points={pts(cam, [ring(0)[k], ring(LV * H)[k]])} stroke={fallen ? GREEN : RED} strokeWidth={1.5} opacity={P(f, a(p.towerAt), 10) * 0.7} />
        ))}
        {/* canhões na base */}
        {[0, 1, 2, 3].map((k) => {
          const ang = (k / 4) * Math.PI * 2 + 0.4;
          const x = Math.cos(ang) * 16;
          const y = Math.sin(ang) * 16;
          const thrown = k === 1 && f >= a(p.gravAt);
          if (thrown && gT >= 1) return null;
          const [px, py] = proj(cam, x, y, 0);
          const tx = thrown ? lerp(px, sx, gT) : px;
          const ty = thrown ? lerp(py, sy, gT) - Math.sin(gT * Math.PI) * 220 : py;
          return <rect key={k} x={tx - 14} y={ty - 10} width={28} height={20} fill="rgba(255,93,77,0.2)" stroke={RED} strokeWidth={2} opacity={P(f, a(p.towerAt) + 10, 8)} transform={thrown ? `rotate(${gT * 400} ${tx} ${ty})` : undefined} />;
        })}
        {f >= a(p.gravAt) && gT < 1 ? <line x1={mx} y1={my} x2={lerp(cx0, sx, gT)} y2={lerp(cy0, sy, gT) - Math.sin(gT * Math.PI) * 220} stroke="#ffcf5a" strokeWidth={3} opacity={0.7} /> : null}
        {f >= a(p.gravAt) + 26 && f < a(p.gravAt) + 40 ? <circle cx={sx} cy={sy} r={(f - a(p.gravAt) - 26) * 8} fill="none" stroke="#ffcf5a" strokeWidth={4} /> : null}
        {/* strider na entrada */}
        {f >= a(p.strAt) && strHp > 0 ? (
          <g opacity={P(f, a(p.strAt), 8)}>
            <circle cx={sx} cy={sy - 60} r={38 + 5 * Math.sin(f / 6)} fill="none" stroke={RED} strokeWidth={2.5} />
            <circle cx={sx} cy={sy - 60} r={8} fill={RED} />
            {[-1, 0, 1].map((k) => (
              <line key={k} x1={sx} y1={sy - 52} x2={sx + k * 40} y2={sy + 10} stroke={RED} strokeWidth={2} />
            ))}
            <text x={sx} y={sy - 112} textAnchor="middle" fill={RED} fontFamily={MONO} fontSize={14} letterSpacing={3}>STRIDER · ENTRADA</text>
          </g>
        ) : null}
        {/* tropas nos níveis */}
        {f >= a(p.troopAt)
          ? Array.from({ length: 10 }).map((_, k) => {
              const lv = k % LV;
              if (off(lv) || fallen) return null;
              const ang = k * 1.7 + f * 0.01;
              const [tx, ty] = proj(cam, Math.cos(ang) * 5, Math.sin(ang) * 5, lv * H + 2);
              return <circle key={k} cx={tx} cy={ty} r={5} fill={RED} opacity={P(f, a(p.troopAt) + k * 2, 6)} />;
            })
          : null}
        {/* Gordon + Dog */}
        {f >= a(p.enterAt) && !fallen ? (
          <g>
            <circle cx={mx} cy={my} r={10} fill={AMB} />
            <circle cx={mx + 20} cy={my + 8} r={8} fill={GREEN} />
            <text x={mx + 30} y={my - 18} fill={AMB} fontFamily={MONO} fontSize={14} letterSpacing={3}>{`GORDON + DOG · NÍVEL ${Math.max(1, Math.floor(climb) + 1)}`}</text>
          </g>
        ) : null}
        {/* o comboio esperando no gelo */}
        {f >= a(p.waitAt)
          ? [0, 1, 2, 3, 4].map((k) => {
              const [vx, vy] = proj(cam, 0, lerp(-70 + k * 7, -22 + k * 2, convoy), 0);
              return <rect key={k} x={vx - 16} y={vy - 9} width={32} height={18} rx={4} fill="none" stroke={GREEN} strokeWidth={2} opacity={P(f, a(p.waitAt) + k * 3, 6)} />;
            })
          : null}
      </svg>
      {f >= a(p.hl2At) && f < a(p.topAt) ? (
        <div style={{ position: "absolute", right: 90, top: 150, width: 520, opacity: P(f, a(p.hl2At), 8) }}>
          <div style={{ fontSize: 16, letterSpacing: 5, color: AMB }}>SEQUÊNCIA ESTILO HALF-LIFE 2</div>
          {[
            { at: a(p.climbAt), k: "SUBIR POR DENTRO" },
            { at: a(p.defAt), k: "DESLIGAR AS DEFESAS POR SETOR" },
            { at: a(p.dogAt), k: "ABRIR CAMINHO PRO DOG" },
            { at: a(p.gravAt), k: "GRAVITY GUN · EQUIPAMENTO VIRA ARMA" },
          ].map((s, i) =>
            f >= s.at ? (
              <div key={i} style={{ marginTop: 14, fontSize: 22, letterSpacing: 3, color: CREAM, opacity: flickIn(f, s.at) }}>
                {`0${i + 1} · ${s.k}`}
              </div>
            ) : null,
          )}
        </div>
      ) : null}
      {f >= a(p.topAt) && !fallen ? (
        <div style={{ position: "absolute", right: 90, top: 150, width: 520, opacity: P(f, a(p.topAt), 8) }}>
          <div style={{ fontSize: 16, letterSpacing: 5, color: RED }}>TOPO · STRIDER</div>
          <div style={{ height: 18, border: `1px solid ${RED}`, marginTop: 10, position: "relative" }}>
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${strHp}%`, background: RED }} />
          </div>
          {f >= a(p.waitAt) ? <div style={{ fontSize: 20, letterSpacing: 3, color: GREEN, marginTop: 18, opacity: P(f, a(p.waitAt), 8) }}>COLUNA · PRESA NO GELO, ESPERANDO</div> : null}
        </div>
      ) : null}
      {fallen ? <div style={{ position: "absolute", right: 90, top: 150, fontSize: 30, letterSpacing: 6, color: GREEN, opacity: flickIn(f, a(p.fallAt)) }}>{f >= a(p.groupAt) ? "VARGA · TRAZ O GRUPO" : "O POSTO CAIU"}</div> : null}
    </AbsoluteFill>
  );
};

// ============================================================================================ 9 · 11) as leituras temporais
// Kleiner e Magnusson nos laboratórios; o arquivo dos Combine: o navio em wireframe com trechos piscando (um corredor
// existe e some), uma parte do casco com data de décadas atrás, o navio inteiro pulando de posição. Só o núcleo fica:
// um ponto preso por uma linha vertical que não sai do lugar quando o navio pula.
export const HLTemporalScans: React.FC<{ life: number; labAt?: number; infoAt?: number; yearsAt?: number; chaosAt?: number; corrAt?: number; hullAt?: number; decAt?: number; moveAt?: number; sigAt?: number; coreAt?: number; epochAt?: number; fixAt?: number }> = (p) => {
  const f = useCurrentFrame();
  const N = 1e9;
  const a = (v?: number) => v ?? N;
  void p.life;
  const jumps = f >= a(p.moveAt) ? Math.floor((f - a(p.moveAt)) / 26) : 0;
  const dx = f >= a(p.moveAt) ? (rnd(jumps * 3.3) - 0.5) * 30 : 0;
  const dy = f >= a(p.moveAt) ? (rnd(jumps * 5.1) - 0.5) * 16 : 0;
  const cam: Cam = { fx: 0, fy: 0, yaw: -0.55 + f * 0.0012, pitch: 0.4, dist: 120, cx: 820, cy: 600, F: 950 };
  const [kx, ky] = proj(cam, 0, 0, 3);
  const corrOn = Math.floor(f / 18) % 2 === 0;
  const reading = 14212 + Math.floor(Math.max(0, f - a(p.infoAt)) * 2.3);
  return (
    <AbsoluteFill style={{ background: BG9("#0a1118"), overflow: "hidden", fontFamily: MONO }}>
      <Title9 t="LABORATÓRIOS · POSTO AVANÇADO" />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <g opacity={P(f, a(p.infoAt), 12)}>
          <Ship cam={cam} col={f >= a(p.chaosAt) && rnd(Math.floor(f / 4)) > 0.85 ? "rgba(255,93,77,0.6)" : "rgba(159,230,255,0.6)"} dx={dx} dy={dy} />
          {/* corredor que existe e some */}
          {f >= a(p.corrAt) ? <polyline points={pts(cam, [[-20 + dx, -3 + dy, 3], [10 + dx, -3 + dy, 3]])} stroke={corrOn ? GREEN : "rgba(0,0,0,0)"} strokeWidth={6} /> : null}
          {/* parte do casco com outra data */}
          {f >= a(p.hullAt)
            ? (() => {
                const [hx, hy] = proj(cam, 22 + dx, 6 + dy, 2);
                return (
                  <g opacity={P(f, a(p.hullAt), 8)}>
                    <circle cx={hx} cy={hy} r={34} fill="rgba(255,178,46,0.12)" stroke={AMB} strokeWidth={2} />
                    {f >= a(p.decAt) ? <text x={hx} y={hy - 48} textAnchor="middle" fill={AMB} fontFamily={MONO} fontSize={16} letterSpacing={3}>CASCO · 1974</text> : null}
                  </g>
                );
              })()
            : null}
          {/* o núcleo preso no lugar */}
          {f >= a(p.coreAt) ? (
            <g opacity={P(f, a(p.coreAt), 10)}>
              <line x1={kx} y1={ky} x2={kx} y2={1040} stroke={GREEN} strokeWidth={2} strokeDasharray="6 6" />
              <circle cx={kx} cy={ky} r={14 + 3 * Math.sin(f / 4)} fill={GREEN} />
              <circle cx={kx} cy={ky} r={30 + ((f - a(p.coreAt)) % 30)} fill="none" stroke={GREEN} strokeWidth={2} opacity={1 - ((f - a(p.coreAt)) % 30) / 30} />
              <text x={kx + 30} y={ky - 30} fill={GREEN} fontFamily={MONO} fontSize={18} letterSpacing={4}>NÚCLEO</text>
              {f >= a(p.fixAt) ? <text x={kx + 30} y={ky - 6} fill={GREEN} fontFamily={MONO} fontSize={14} letterSpacing={3} opacity={P(f, a(p.fixAt), 8)}>MESMO PONTO · SEMPRE</text> : null}
            </g>
          ) : null}
        </g>
      </svg>
      {f >= a(p.labAt) ? (
        <div style={{ position: "absolute", left: 70, top: 100, display: "flex", gap: 14, opacity: P(f, a(p.labAt), 8) }}>
          {["DR. KLEINER", "DR. MAGNUSSON"].map((n) => (
            <div key={n} style={{ padding: "6px 12px", border: `1px solid ${GREEN}`, borderRadius: 6, fontSize: 15, letterSpacing: 3, color: GREEN }}>
              {n}
            </div>
          ))}
        </div>
      ) : null}
      {f >= a(p.infoAt) ? (
        <div style={{ position: "absolute", right: 70, top: 150, width: 500, padding: "16px 20px", border: `1px solid ${ICE}`, borderRadius: 8, background: "rgba(4,10,14,0.88)", opacity: P(f, a(p.infoAt), 8) }}>
          <div style={{ fontSize: 15, letterSpacing: 4, color: ICE }}>REGISTRO COMBINE · MUDANÇAS TEMPORAIS</div>
          <div style={{ fontSize: 30, letterSpacing: 3, color: CREAM, marginTop: 8 }}>{`${reading.toLocaleString("pt-BR")} LEITURAS`}</div>
          {f >= a(p.yearsAt) ? <div style={{ fontSize: 18, letterSpacing: 3, color: "rgba(255,226,176,0.7)", marginTop: 6, opacity: P(f, a(p.yearsAt), 8) }}>ANOS DE OBSERVAÇÃO</div> : null}
          {f >= a(p.chaosAt) ? (
            <div style={{ marginTop: 14, fontSize: 16, letterSpacing: 2, opacity: P(f, a(p.chaosAt), 8) }}>
              {[
                { at: a(p.corrAt), k: `#${reading - 1} CORREDOR C-4 · PRESENTE`, c: GREEN },
                { at: a(p.corrAt) + 14, k: `#${reading} CORREDOR C-4 · AUSENTE`, c: RED },
                { at: a(p.decAt), k: `#${reading + 1} CASCO POPA · DATA 1974`, c: AMB },
                { at: a(p.moveAt), k: `#${reading + 2} NAVIO · POSIÇÃO ALTERADA`, c: ICE },
              ].map((r, i) =>
                f >= r.at ? (
                  <div key={i} style={{ color: r.c, marginTop: 6 }}>
                    {r.k}
                  </div>
                ) : null,
              )}
            </div>
          ) : null}
          {f >= a(p.sigAt) ? <div style={{ fontSize: 18, letterSpacing: 3, color: GREEN, marginTop: 14, opacity: P(f, a(p.sigAt), 8) }}>UM SINAL NÃO ACOMPANHA</div> : null}
        </div>
      ) : null}
      {f >= a(p.epochAt) ? <div style={{ position: "absolute", left: 70, bottom: 60, fontSize: 18, letterSpacing: 4, color: AMB, opacity: P(f, a(p.epochAt), 8) }}>{`ÉPOCA DO NAVIO: ${[1974, 2011, 1998, 2036, 1962][jumps % 5]}`}</div> : null}
    </AbsoluteFill>
  );
};

// ============================================================================================ 9 · 12) a assinatura
// duas ondas: o núcleo do Borealis e o registro de Black Mesa; a de baixo desliza até casar com a de cima; elas se fundem
// e a onda abre um rasgo vertical verde: a ferida.
const sig = (x: number, ph = 0) => Math.sin(x * 0.03 + ph) * 40 + Math.sin(x * 0.071 + ph * 2) * 26 + (Math.abs(((x + ph * 30) % 180) - 90) < 6 ? -70 : 0);
export const HLSignatureMatch: React.FC<{ life: number; cmpAt?: number; sameAt?: number; woundAt?: number; sinceAt?: number }> = ({ life, cmpAt = 0, sameAt = 1e9, woundAt = 1e9, sinceAt = 1e9 }) => {
  const f = useCurrentFrame();
  void life;
  const off = lerp(220, 0, P(f, cmpAt + 10, Math.max(20, sameAt - cmpAt - 10)));
  const merge = P(f, sameAt, 16);
  const wound = P(f, woundAt, 30);
  const path = (y: number, o: number) => Array.from({ length: 170 }).map((_, i) => `${i ? "L" : "M"} ${200 + i * 9} ${y + sig(i * 9 + o) * (1 - wound * 0.8)}`).join(" ");
  const yTop = lerp(380, 540, merge);
  const yBot = lerp(720, 540, merge);
  return (
    <AbsoluteFill style={{ background: BG9("#08120c"), overflow: "hidden", fontFamily: MONO }}>
      <Title9 t="ASSINATURA · COMPARAÇÃO" col={GREEN} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <path d={path(yTop, 0)} fill="none" stroke={ICE} strokeWidth={3} opacity={1 - wound} />
        <path d={path(yBot, off)} fill="none" stroke={AMB} strokeWidth={3} opacity={1 - wound} />
        {merge < 1 ? (
          <>
            <text x={200} y={yTop - 90} fill={ICE} fontFamily={MONO} fontSize={18} letterSpacing={4} opacity={1 - merge}>NÚCLEO · BOREALIS</text>
            <text x={200} y={yBot + 110} fill={AMB} fontFamily={MONO} fontSize={18} letterSpacing={4} opacity={1 - merge}>BLACK MESA · RESSONÂNCIA EM CASCATA</text>
          </>
        ) : null}
        {f >= sameAt ? <text x={960} y={760} textAnchor="middle" fill={GREEN} fontFamily={MONO} fontSize={30} letterSpacing={6} opacity={P(f, sameAt + 6, 8) * (1 - wound)}>CORRESPONDÊNCIA 100%</text> : null}
        {/* a ferida */}
        {f >= woundAt ? (
          <g opacity={wound}>
            {[0, 1, 2].map((k) => (
              <path key={k} d={`M 960 ${260 - k * 20} C ${1000 + k * 14 + Math.sin(f / 6) * 8} 420 ${930 - k * 10} 620 ${960} ${820 + k * 20} C ${920 - k * 14} 620 ${990 + k * 10} 420 960 ${260 - k * 20} Z`} fill={k === 0 ? "rgba(141,255,168,0.25)" : "none"} stroke={GREEN} strokeWidth={3 - k} opacity={1 - k * 0.3} />
            ))}
            {Array.from({ length: 16 }).map((_, i) => {
              const t = ((f - woundAt) / 50 + i / 16) % 1;
              return <circle key={i} cx={960 + Math.sin(i * 2.3) * 120 * t} cy={540 + Math.cos(i * 1.7) * 260 * t} r={3} fill={GREEN} opacity={1 - t} />;
            })}
            <text x={960} y={920} textAnchor="middle" fill={GREEN} fontFamily={MONO} fontSize={34} letterSpacing={8}>A FERIDA</text>
            {f >= sinceAt ? <text x={960} y={965} textAnchor="middle" fill="rgba(141,255,168,0.7)" fontFamily={MONO} fontSize={18} letterSpacing={4} opacity={P(f, sinceAt, 8)}>COMO OS VORTIGAUNTS CHAMAM · DESDE O COMEÇO</text> : null}
          </g>
        ) : null}
      </svg>
    </AbsoluteFill>
  );
};

// ============================================================================================ 9 · 13) ancorado
// o eixo do tempo com anos; o navio desliza para lá e para cá; o núcleo é puxado por uma linha esticada até a ferida, que
// não sai do lugar. No fim a tela "rebobina" (passagem para a lembrança).
export const HLCoreAnchor: React.FC<{ life: number; slideAt?: number; notAt?: number; stuckAt?: number; sceneAt?: number }> = ({ life, slideAt = 0, notAt = 1e9, stuckAt = 1e9, sceneAt = 1e9 }) => {
  const f = useCurrentFrame();
  const W = { x: 960, y: 820 };
  const sx = 960 + Math.sin((f - slideAt) / 26) * 520 * P(f, slideAt, 20);
  const sy = 420;
  const rew = P(f, sceneAt, Math.max(10, life - sceneAt));
  return (
    <AbsoluteFill style={{ background: BG9(), overflow: "hidden", fontFamily: MONO }}>
      <Title9 t="O NÚCLEO · ANCORADO" col={GREEN} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, filter: rew > 0 ? `sepia(${rew}) contrast(${1 + rew * 0.3})` : undefined }}>
        <line x1={120} x2={1800} y1={sy + 120} y2={sy + 120} stroke="rgba(255,226,176,0.4)" strokeWidth={2} />
        {[1940, 1970, 2000, 2030, 2060].map((y, i) => (
          <g key={y}>
            <line x1={260 + i * 350} x2={260 + i * 350} y1={sy + 110} y2={sy + 130} stroke={CREAM} opacity={0.6} />
            <text x={260 + i * 350} y={sy + 160} textAnchor="middle" fill={CREAM} fontFamily={MONO} fontSize={16} opacity={0.6}>
              {y}
            </text>
          </g>
        ))}
        <ShipSide x={sx} y={sy} s={2.4} />
        {/* a linha até a ferida */}
        {f >= notAt ? <path d={`M ${sx} ${sy + 4} Q ${(sx + W.x) / 2} ${sy + 200} ${W.x} ${W.y}`} fill="none" stroke={GREEN} strokeWidth={3} opacity={P(f, notAt, 10)} /> : null}
        <circle cx={sx} cy={sy + 4} r={10} fill={GREEN} />
        {f >= notAt ? (
          <g opacity={P(f, notAt, 10)}>
            <path d={`M ${W.x} ${W.y - 70} C ${W.x + 30} ${W.y - 20} ${W.x - 20} ${W.y + 20} ${W.x} ${W.y + 70} C ${W.x - 30} ${W.y + 20} ${W.x + 20} ${W.y - 20} ${W.x} ${W.y - 70} Z`} fill="rgba(141,255,168,0.25)" stroke={GREEN} strokeWidth={2} />
            <text x={W.x + 50} y={W.y + 8} fill={GREEN} fontFamily={MONO} fontSize={18} letterSpacing={4}>A FERIDA</text>
          </g>
        ) : null}
        {f >= stuckAt ? <text x={W.x} y={W.y + 120} textAnchor="middle" fill={GREEN} fontFamily={MONO} fontSize={24} letterSpacing={5} opacity={P(f, stuckAt, 8)}>O NÚCLEO CONTINUA PRESO</text> : null}
        {/* rebobinar */}
        {f >= sceneAt
          ? Array.from({ length: 8 }).map((_, i) => <rect key={i} x={0} y={((f * 23 + i * 140) % 1080)} width={1920} height={6 + rnd(i + f) * 10} fill="rgba(255,255,255,0.12)" />)
          : null}
      </svg>
      {f >= sceneAt ? <div style={{ position: "absolute", right: 80, top: 56, fontSize: 26, letterSpacing: 6, color: CREAM, opacity: Math.floor(f / 8) % 2 ? 1 : 0.3 }}>◀◀ VOLTANDO</div> : null}
    </AbsoluteFill>
  );
};

// ============================================================================================ 9 · 14) a lembrança
// a cena antiga (HLAlyxKnows, do 5C) tocando de novo como gravação: sépia, linhas de VHS, "REPLAY". No "agora eles
// entendem", o núcleo é destacado por cima.
export const HLRewind: React.FC<{ life: number; nowAt?: number; diffAt?: number }> = ({ life, nowAt = 1e9, diffAt = 1e9 }) => {
  const f = useCurrentFrame();
  void life;
  const S = (s: number) => Math.round(s * 30);
  const start = S(24.5);
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden", fontFamily: MONO }}>
      <AbsoluteFill style={{ filter: `sepia(0.75) saturate(0.8) contrast(1.05) brightness(${f >= nowAt ? 0.3 : 0.9}) blur(${f >= nowAt ? 3 * P(f, nowAt, 12) : 0}px)` }}>
        <Sequence from={-start} layout="none">
          <HLAlyxKnows life={S(38.94)} lapseAt={S(3)} stopAt={S(7.9)} doorAt={S(11.8)} pathAt={S(14.87)} forkAt={S(20.2)} mossAt={S(21.94)} alyxAt={S(25.44)} askAt={S(29.17)} pauseAt={S(32.534)} lineAt={S(35.74)} />
        </Sequence>
      </AbsoluteFill>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} style={{ position: "absolute", left: 0, right: 0, top: (f * 7 + i * 230) % 1080, height: 3, background: "rgba(255,255,255,0.08)" }} />
      ))}
      <div style={{ position: "absolute", right: 70, top: 56, fontSize: 24, letterSpacing: 6, color: CREAM, opacity: Math.floor(f / 15) % 2 ? 1 : 0.4 }}>● REPLAY · 5C</div>
      {f >= nowAt ? (
        <div style={{ position: "absolute", left: 360, right: 360, top: 360, padding: "30px 0", textAlign: "center", background: "rgba(2,6,4,0.82)", border: `1px solid ${GREEN}`, borderRadius: 12, opacity: P(f, nowAt, 10) }}>
          <div style={{ fontSize: 22, letterSpacing: 8, color: GREEN }}>AGORA ELES ENTENDEM</div>
          <div style={{ fontSize: 60, letterSpacing: 8, color: CREAM, marginTop: 12 }}>O NÚCLEO</div>
          {f >= diffAt ? <div style={{ fontSize: 24, letterSpacing: 5, color: GREEN, marginTop: 14, opacity: P(f, diffAt, 8) }}>SEMPRE FOI DIFERENTE DO RESTO DO NAVIO</div> : null}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ============================================================================================ 9 · 15) o alvo
// o navio em wireframe; a mira desce e trava no núcleo (o único ponto que não escapa). "Mas antes": a mira abre para o
// casco inteiro: PLANO A, destruir por fora, só para confirmar os cálculos.
export const HLTargetCore: React.FC<{ life: number; eliAt?: number; conclAt?: number; partAt?: number; hitAt?: number; butAt?: number; outAt?: number; calcAt?: number }> = ({ life, eliAt = 0, conclAt = 1e9, partAt = 1e9, hitAt = 1e9, butAt = 1e9, outAt = 1e9, calcAt = 1e9 }) => {
  const f = useCurrentFrame();
  void life;
  const cam: Cam = { fx: 0, fy: 0, yaw: -0.4 + f * 0.002, pitch: 0.38, dist: 110, cx: 900, cy: 600, F: 1000 };
  const [kx, ky] = proj(cam, 0, 0, 3);
  const lock = P(f, partAt, 30);
  const wide = P(f, butAt, 20);
  const cx = lerp(lerp(1500, kx, lock), 900, wide);
  const cy = lerp(lerp(200, ky, lock), 560, wide);
  const r = lerp(lerp(160, 50, lock), 420, wide);
  return (
    <AbsoluteFill style={{ background: BG9(), overflow: "hidden", fontFamily: MONO }}>
      <Title9 t="ELI · ANÁLISE" col={AMB} o={P(f, eliAt, 8)} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <Ship cam={cam} col={f >= outAt ? "rgba(255,93,77,0.7)" : "rgba(159,230,255,0.6)"} />
        <circle cx={kx} cy={ky} r={12} fill={GREEN} />
        {f >= conclAt ? (
          <g>
            <circle cx={cx} cy={cy} r={r} fill="none" stroke={f >= butAt ? RED : AMB} strokeWidth={3} />
            {[0, 1, 2, 3].map((k) => (
              <line key={k} x1={cx} y1={cy - r - 10} x2={cx} y2={cy - r - 40} stroke={f >= butAt ? RED : AMB} strokeWidth={3} transform={`rotate(${k * 90} ${cx} ${cy})`} />
            ))}
          </g>
        ) : null}
        {f >= hitAt && f < butAt ? <text x={kx + 70} y={ky - 60} fill={AMB} fontFamily={MONO} fontSize={22} letterSpacing={5} opacity={flickIn(f, hitAt)}>ALVO · NÚCLEO</text> : null}
      </svg>
      {f >= butAt ? (
        <div style={{ position: "absolute", right: 80, top: 150, width: 520, padding: "18px 22px", border: `1px solid ${RED}`, borderRadius: 10, background: "rgba(14,4,4,0.88)", opacity: P(f, butAt, 8) }}>
          <div style={{ fontSize: 15, letterSpacing: 5, color: RED }}>ANTES · PLANO A</div>
          {f >= outAt ? <div style={{ fontSize: 34, letterSpacing: 4, color: CREAM, marginTop: 8, opacity: P(f, outAt, 8) }}>DESTRUIR POR FORA</div> : null}
          {f >= calcAt ? <div style={{ fontSize: 20, letterSpacing: 3, color: AMB, marginTop: 10, opacity: P(f, calcAt, 8) }}>OBJETIVO: CONFIRMAR OS CÁLCULOS</div> : null}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ============================================================================================ 9 · 16) o bombardeio
// o arsenal entra peça por peça (canhões, explosivos, artilharia, aeronaves remendadas); o Borealis surge sobre o gelo;
// tudo dispara junto; o casco rasga, um bloco do navio despenca, explosões atravessam; o navio some no meio da fumaça.
const SHIP_SEGS: [number, number, number, number][] = [
  [-60, 10, 50, 10],
  [50, 10, 64, -6],
  [64, -6, 34, -6],
  [34, -6, 28, -22],
  [28, -22, -10, -22],
  [-10, -22, -16, -34],
  [-16, -34, -24, -34],
  [-24, -34, -28, -6],
  [-28, -6, -60, -6],
  [-60, -6, -60, 10],
];
export const HLBarrage: React.FC<{ life: number; prepAt?: number; cannonAt?: number; explAt?: number; artAt?: number; airAt?: number; surgeAt?: number; fireAt?: number; workAt?: number; tearAt?: number; collapseAt?: number; deckAt?: number; goneAt?: number }> = (p) => {
  const f = useCurrentFrame();
  const N = 1e9;
  const a = (v?: number) => v ?? N;
  void p.life;
  const inv = [
    { at: a(p.cannonAt), k: "CANHÕES", icon: "M -26 6 L 14 -6 L 16 2 L -24 14 Z M -20 10 A 10 10 0 1 0 -19.9 10" },
    { at: a(p.explAt), k: "EXPLOSIVOS", icon: "M -14 -16 L 14 -16 L 14 18 L -14 18 Z M 0 -16 L 6 -28" },
    { at: a(p.artAt), k: "ARTILHARIA", icon: "M -26 14 L 26 14 M -10 14 L 14 -22 M -18 14 L -18 4 L 6 4" },
    { at: a(p.airAt), k: "AERONAVES", icon: "M -28 0 L 28 0 M -6 -16 L 4 0 L -6 16 M 22 -8 L 26 0 L 22 8" },
  ];
  const scene = P(f, a(p.surgeAt), 14);
  const SX = 1150;
  const SY = 640;
  const S = 5;
  const tear = P(f, a(p.tearAt), 20);
  const coll = P(f, a(p.collapseAt), 30);
  const gone = P(f, a(p.goneAt), 24);
  return (
    <AbsoluteFill style={{ background: BG9("#0d0f12"), overflow: "hidden", fontFamily: MONO }}>
      <Title9 t={f >= a(p.surgeAt) ? "ATAQUE TOTAL · BOREALIS SOBRE O GELO" : "ARSENAL DA RESISTÊNCIA"} col={AMB} />
      {/* arsenal */}
      <div style={{ position: "absolute", left: 0, right: 0, top: f >= a(p.surgeAt) ? 110 : 380, display: "flex", justifyContent: "center", gap: 40, transform: `scale(${1 - 0.45 * scene})`, transformOrigin: "50% 0" }}>
        {inv.map((it, i) =>
          f >= it.at ? (
            <div key={i} style={{ width: 230, padding: "20px 0", border: `1px solid ${AMB}`, borderRadius: 10, background: "rgba(14,10,4,0.85)", textAlign: "center", opacity: flickIn(f, it.at), transform: `translateY(${(1 - P(f, it.at, 10)) * 50}px)` }}>
              <svg width={100} height={70}>
                <g transform="translate(50 35) scale(1.3)">
                  <path d={it.icon} fill="none" stroke={CREAM} strokeWidth={2.5} strokeLinecap="round" />
                </g>
              </svg>
              <div style={{ fontSize: 20, letterSpacing: 4, color: CREAM, marginTop: 6 }}>{it.k}</div>
              {i === 3 ? <div style={{ fontSize: 13, letterSpacing: 2, color: RED, marginTop: 6 }}>MAL DEVERIAM VOAR</div> : null}
            </div>
          ) : null,
        )}
      </div>
      {f >= a(p.surgeAt) ? (
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: scene }}>
          <line x1={0} x2={1920} y1={SY + 70} y2={SY + 70} stroke="rgba(159,230,255,0.4)" strokeWidth={2} />
          {/* o navio, segmento a segmento */}
          <g opacity={1 - gone} transform={`translate(${(rnd(Math.floor(f / 2)) - 0.5) * 10 * tear} 0)`}>
            {SHIP_SEGS.map(([x1, y1, x2, y2], i) => {
              const falls = i >= 4 && i <= 7;
              const fy = falls ? coll * 260 : 0;
              const rot = falls ? coll * (i - 5) * 25 : 0;
              const mx = SX + ((x1 + x2) / 2) * S;
              const my = SY + ((y1 + y2) / 2) * S;
              return (
                <line key={i} x1={SX + x1 * S} y1={SY + y1 * S + fy} x2={SX + x2 * S} y2={SY + y2 * S + fy} stroke={i < 3 && tear > 0 ? AMB : ICE} strokeWidth={3} transform={`rotate(${rot} ${mx} ${my + fy})`} />
              );
            })}
            {/* rasgo no casco */}
            {tear > 0 ? <path d={`M ${SX - 100} ${SY + 50} l 30 -40 l 20 30 l 30 -50 l 20 40`} fill="none" stroke={RED} strokeWidth={4} opacity={tear} /> : null}
          </g>
          {/* disparos */}
          {f >= a(p.fireAt) && f < a(p.goneAt) + 20
            ? Array.from({ length: 10 }).map((_, i) => {
                const t = (((f - a(p.fireAt)) / 24 + i / 10) % 1);
                const x0 = 80 + (i % 4) * 60;
                const y0 = 900 - (i % 3) * 40;
                const x = lerp(x0, SX - 200 + (i % 5) * 90, t);
                const y = lerp(y0, SY - 60 + (i % 3) * 40, t) - Math.sin(t * Math.PI) * 300;
                return <circle key={i} cx={x} cy={y} r={4} fill="#ffcf5a" />;
              })
            : null}
          {/* explosões */}
          {f >= a(p.fireAt)
            ? Array.from({ length: 8 }).map((_, i) => {
                const at = a(p.fireAt) + 20 + i * 14;
                const t = (f - at) / 20;
                if (t < 0 || t > 1) return null;
                return <circle key={"e" + i} cx={SX - 250 + rnd(i * 3) * 500} cy={SY - 120 + rnd(i * 7) * 160} r={20 + t * 110} fill={`rgba(255,${150 - t * 100},60,${0.5 * (1 - t)})`} stroke="#ffcf5a" strokeWidth={2} opacity={1 - t} />;
              })
            : null}
          {/* fumaça */}
          {f >= a(p.deckAt)
            ? Array.from({ length: 24 }).map((_, i) => {
                const t = (((f - a(p.deckAt)) / 80 + i / 24) % 1);
                return <circle key={"s" + i} cx={SX - 300 + rnd(i) * 600 + t * 60} cy={SY - t * 400} r={30 + t * 60} fill="rgba(120,120,120,0.12)" />;
              })
            : null}
          {f >= a(p.workAt) && f < a(p.goneAt) ? <text x={SX} y={SY + 130} textAnchor="middle" fill={GREEN} fontFamily={MONO} fontSize={22} letterSpacing={5} opacity={P(f, a(p.workAt), 8)}>{`CASCO ${Math.max(12, Math.round(100 - (f - a(p.workAt)) * 0.5))}%`}</text> : null}
          {f >= a(p.goneAt) ? <text x={SX} y={SY + 130} textAnchor="middle" fill={RED} fontFamily={MONO} fontSize={26} letterSpacing={6} opacity={P(f, a(p.goneAt) + 10, 8)}>SINAL PERDIDO</text> : null}
        </svg>
      ) : null}
    </AbsoluteFill>
  );
};

// ============================================================================================ 9 · 17) os dias de silêncio
// monitor do Kleiner: linha reta, o contador de dias vira (1, 2, 3), NENHUM SINAL. O Eli acha que acabou. Os instrumentos
// apitam: picos; o navio aparece inteiro; as mesmas marcas de antes (comparação lado a lado).
export const HLSilentDays: React.FC<{ life: number; d1At?: number; d2At?: number; d3At?: number; eliAt?: number; beepAt?: number; backAt?: number; marksAt?: number }> = ({ life, d1At = 1e9, d2At = 1e9, d3At = 1e9, eliAt = 1e9, beepAt = 1e9, backAt = 1e9, marksAt = 1e9 }) => {
  const f = useCurrentFrame();
  void life;
  const day = f >= d3At ? 3 : f >= d2At ? 2 : f >= d1At ? 1 : 0;
  const dayAt = [0, d1At, d2At, d3At][day];
  const beep = f >= beepAt;
  const scratches = (x: number, y: number, s: number) =>
    [0, 1, 2, 3, 4].map((k) => <line key={k} x1={x + (-40 + k * 22) * s} y1={y - 10 * s} x2={x + (-30 + k * 22) * s} y2={y + 6 * s} stroke={RED} strokeWidth={2} />);
  return (
    <AbsoluteFill style={{ background: BG9("#080c10"), overflow: "hidden", fontFamily: MONO }}>
      <Title9 t="DR. KLEINER · MONITOR DO BOREALIS" col={beep ? AMB : "rgba(159,230,255,0.6)"} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <polyline
          points={Array.from({ length: 200 })
            .map((_, i) => {
              const x = 120 + i * 8.4;
              const spike = beep && ((i + Math.floor((f - beepAt) * 2)) % 40) < 3 ? -180 * (((i + Math.floor((f - beepAt) * 2)) % 40) === 1 ? 1 : 0.4) : 0;
              return `${x},${beep && f < backAt + 30 ? 300 + spike : 300 + (rnd(i + f) - 0.5) * 3}`;
            })
            .join(" ")}
          fill="none"
          stroke={beep ? AMB : "rgba(159,230,255,0.5)"}
          strokeWidth={3}
        />
        {f >= backAt ? (
          <g opacity={P(f, backAt, 12)}>
            <ShipSide x={760} y={700} s={3.6} />
            {f >= marksAt ? scratches(760, 700, 2) : null}
            {f >= marksAt ? (
              <g opacity={P(f, marksAt + 10, 10)}>
                <ShipSide x={1460} y={700} s={2} col="rgba(255,226,176,0.6)" fill="none" />
                {scratches(1460, 700, 1.1)}
                <text x={1460} y={800} textAnchor="middle" fill={CREAM} fontFamily={MONO} fontSize={15} letterSpacing={3}>ANTES DO ATAQUE</text>
                <text x={760} y={860} textAnchor="middle" fill={AMB} fontFamily={MONO} fontSize={15} letterSpacing={3}>AGORA</text>
                <text x={1110} y={710} textAnchor="middle" fill={GREEN} fontFamily={MONO} fontSize={40}>=</text>
              </g>
            ) : null}
          </g>
        ) : null}
      </svg>
      {day > 0 && f < beepAt ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 460, textAlign: "center" }}>
          <div key={day} style={{ fontSize: 150, letterSpacing: 10, color: CREAM, transform: `rotateX(${(1 - P(f, dayAt, 8)) * 90}deg)` }}>{`DIA ${day}`}</div>
          {day === 3 ? <div style={{ fontSize: 28, letterSpacing: 8, color: RED, marginTop: 10, opacity: P(f, d3At + 10, 8) }}>NENHUM SINAL</div> : null}
          {f >= eliAt ? <div style={{ fontSize: 22, letterSpacing: 5, color: GREEN, marginTop: 30, opacity: P(f, eliAt, 8) }}>ELI · TALVEZ TENHA ACABADO</div> : null}
        </div>
      ) : null}
      {f >= backAt ? <div style={{ position: "absolute", right: 80, top: 140, fontSize: 30, letterSpacing: 6, color: AMB, opacity: flickIn(f, backAt) }}>BOREALIS · INTEIRO</div> : null}
    </AbsoluteFill>
  );
};

// ============================================================================================ 9 · 18) voltou, não se reconstruiu
// linha do tempo de estados: INTACTO (antes) → DESTRUÍDO (agora); a seta pula de volta: o navio reaparece no estado
// anterior; o núcleo, num trilho de baixo, não se move. Fecha com o resultado do teste: ✗ por fora · ✓ o núcleo.
export const HLStateBack: React.FC<{ life: number; notAt?: number; backAt?: number; coreAt?: number; bothAt?: number; outAt?: number; onlyAt?: number }> = ({ life, notAt = 0, backAt = 1e9, coreAt = 1e9, bothAt = 1e9, outAt = 1e9, onlyAt = 1e9 }) => {
  const f = useCurrentFrame();
  void life;
  const jump = P(f, backAt, 30);
  return (
    <AbsoluteFill style={{ background: BG9(), overflow: "hidden", fontFamily: MONO }}>
      <Title9 t="O QUE O TESTE PROVOU" col={ICE} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <line x1={200} x2={1720} y1={400} y2={400} stroke="rgba(255,226,176,0.4)" strokeWidth={2} />
        {[
          { x: 520, t: "ANTES · INTACTO", c: ICE },
          { x: 1400, t: "ATAQUE · DESTRUÍDO", c: RED },
        ].map((s, i) => (
          <g key={i}>
            <circle cx={s.x} cy={400} r={9} fill={s.c} />
            <text x={s.x} y={450} textAnchor="middle" fill={s.c} fontFamily={MONO} fontSize={16} letterSpacing={3}>{s.t}</text>
          </g>
        ))}
        {/* o navio destruído (some) e o intacto (volta) */}
        <g opacity={1 - jump}>
          <ShipSide x={1400} y={300} s={1.8} col={RED} fill="rgba(255,93,77,0.08)" />
          <path d="M 1340 290 l 30 -30 l 20 30 l 25 -40" stroke={RED} strokeWidth={3} fill="none" />
        </g>
        {f >= notAt ? <text x={1400} y={210} textAnchor="middle" fill={CREAM} fontFamily={MONO} fontSize={18} letterSpacing={3} opacity={P(f, notAt, 8) * (1 - jump)}>RECONSTRUIU? ✗</text> : null}
        {f >= backAt ? (
          <g>
            <path d={`M 1400 250 C 1200 ${120} 720 120 560 250`} fill="none" stroke={AMB} strokeWidth={3} pathLength={1} strokeDasharray="1" strokeDashoffset={1 - jump} />
            <ShipSide x={lerp(1400, 520, jump)} y={lerp(300, 300, jump)} s={1.8} o={jump} />
            <text x={960} y={140} textAnchor="middle" fill={AMB} fontFamily={MONO} fontSize={20} letterSpacing={4} opacity={jump}>VOLTOU AO ESTADO ANTERIOR</text>
          </g>
        ) : null}
        {/* o núcleo no trilho de baixo */}
        {f >= coreAt ? (
          <g opacity={P(f, coreAt, 10)}>
            <line x1={200} x2={1720} y1={600} y2={600} stroke="rgba(141,255,168,0.3)" strokeWidth={2} />
            <circle cx={1400} cy={600} r={14} fill={GREEN} />
            <text x={1400} y={650} textAnchor="middle" fill={GREEN} fontFamily={MONO} fontSize={16} letterSpacing={3}>NÚCLEO · NO MESMO LUGAR</text>
          </g>
        ) : null}
      </svg>
      {f >= bothAt ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 740, display: "flex", justifyContent: "center", gap: 40, opacity: P(f, bothAt, 8) }}>
          {[
            { at: outAt, k: "DESTRUIR POR FORA", v: "✗ NÃO RESOLVE", c: RED },
            { at: onlyAt, k: "O NÚCLEO", v: "✓ ÚNICO PONTO FIXO", c: GREEN },
          ].map((r, i) =>
            f >= r.at ? (
              <div key={i} style={{ width: 560, padding: "18px 22px", border: `2px solid ${r.c}`, borderRadius: 10, background: "rgba(6,6,6,0.88)", opacity: flickIn(f, r.at) }}>
                <div style={{ fontSize: 18, letterSpacing: 4, color: CREAM }}>{r.k}</div>
                <div style={{ fontSize: 34, letterSpacing: 4, color: r.c, marginTop: 6 }}>{r.v}</div>
              </div>
            ) : null,
          )}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ============================================================================================ 9 · 19) para onde ela leva
// o gráfico do procedimento continua subindo devagar; a curva é extrapolada para fora da tela até um DESTINO ???; no fim a
// câmera mergulha no navio em wireframe: de volta ao Borealis.
export const HLSlowRoute: React.FC<{ life: number; probAt?: number; workAt?: number; instrAt?: number; advAt?: number; leadAt?: number; slowAt?: number; backAt?: number; destAt?: number }> = ({ life, probAt = 0, workAt = 1e9, instrAt = 1e9, advAt = 1e9, leadAt = 1e9, slowAt = 1e9, backAt = 1e9, destAt = 1e9 }) => {
  const f = useCurrentFrame();
  const dive = P(f, backAt, Math.max(20, life - backAt));
  const cam: Cam = { fx: 0, fy: 0, yaw: -0.5 + f * 0.003, pitch: 0.38, dist: lerp(140, 18, dive), cx: 960, cy: 560, F: 1000 };
  const prog = Math.min(1, Math.max(0, (f - workAt) / Math.max(30, slowAt - workAt)));
  const curve = Array.from({ length: 60 }).map((_, i) => {
    const t = i / 59;
    return `${200 + t * 1100},${900 - (Math.log(1 + 6 * t) / Math.log(7)) * 520 + Math.sin(t * 40) * 10}`;
  });
  const shown = Math.floor(curve.length * prog);
  return (
    <AbsoluteFill style={{ background: BG9("#0d0a14"), overflow: "hidden", fontFamily: MONO }}>
      <Title9 t={f >= backAt ? "DE VOLTA AO BOREALIS" : "AINDA EXISTE UM PROBLEMA"} col={f >= backAt ? ICE : VIO} o={P(f, probAt, 8)} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: 1 - dive }}>
        <polyline points={curve.slice(0, Math.max(2, shown)).join(" ")} fill="none" stroke={VIO} strokeWidth={4} />
        {f >= instrAt ? <text x={260} y={300} fill={AMB} fontFamily={MONO} fontSize={18} letterSpacing={3} opacity={P(f, instrAt, 8)}>INSTRUÇÕES · ALYX → ADVISORS</text> : null}
        {f >= advAt ? <text x={260} y={340} fill={VIO} fontFamily={MONO} fontSize={18} letterSpacing={3} opacity={P(f, advAt, 8)}>PROCEDIMENTO · CADA VEZ MAIS AVANÇADO</text> : null}
        {f >= leadAt ? <path d="M 1300 380 C 1500 300 1700 200 1960 120" fill="none" stroke={AMB} strokeWidth={3} strokeDasharray="10 10" pathLength={1} strokeDashoffset={-f * 0.01} opacity={P(f, leadAt, 10)} /> : null}
        {f >= leadAt ? <text x={1640} y={150} textAnchor="middle" fill={AMB} fontFamily={MONO} fontSize={26} letterSpacing={6} opacity={P(f, leadAt + 8, 8)}>DESTINO ???</text> : null}
        {f >= slowAt ? <text x={960} y={1000} textAnchor="middle" fill={CREAM} fontFamily={MONO} fontSize={24} letterSpacing={6} opacity={P(f, slowAt, 8)}>DEVAGAR</text> : null}
      </svg>
      {f >= backAt ? (
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: P(f, backAt, 12) }}>
          <Ship cam={cam} col={ICE} />
        </svg>
      ) : null}
      {f >= destAt ? <div style={{ position: "absolute", left: 0, right: 0, bottom: 90, textAlign: "center", fontSize: 30, letterSpacing: 8, color: AMB, opacity: P(f, destAt, 8) }}>ANTES QUE SEJA TARDE DEMAIS</div> : null}
    </AbsoluteFill>
  );
};

// ============================================================================================ 6 · BREEN v3 · 1) a criatura larval
// a estrutura com cabos (BreenRig) agora segura um casulo larval em wireframe (segmentos que respiram, sem rosto). A
// varredura do HEV classifica: ORGANISMO LARVAL · ASSOCIADO AOS ADVISORS. Então o casulo "vira" (a varredura troca de cor),
// a voz dá o pico do "Freeman", e a identificação abre: algo que ACREDITA ser Wallace Breen. A Mossman fica parada.
const Larva: React.FC<{ f: number; x: number; y: number; s?: number; col?: string; o?: number; turn?: number }> = ({ f, x, y, s = 1, col = AMB, o = 1, turn = 0 }) => (
  <g transform={`translate(${x} ${y}) scale(${s}) rotate(${-8 + turn * 20})`} opacity={o}>
    {Array.from({ length: 7 }).map((_, k) => {
      const w = 46 - Math.abs(k - 2.5) * 8 + 3 * Math.sin(f / 9 + k * 0.8);
      return <ellipse key={k} cx={0} cy={-120 + k * 38} rx={w} ry={22} fill="rgba(255,178,46,0.06)" stroke={col} strokeWidth={2} opacity={0.9 - k * 0.06} />;
    })}
    <path d="M -10 140 C -30 170 30 190 0 220" fill="none" stroke={col} strokeWidth={2} opacity={0.6} />
  </g>
);
export const HLBreengrub: React.FC<{ life: number; rigAt?: number; larvaAt?: number; advAt?: number; lookAt?: number; voiceAt?: number; nameAt?: number; clearAt?: number; isAt?: number; believeAt?: number; mossAt?: number }> = (p) => {
  const f = useCurrentFrame();
  const N = 1e9;
  const a = (v?: number) => v ?? N;
  void p.life;
  const scan = f >= a(p.larvaAt) && f < a(p.isAt);
  const scanY = 260 + ((f - a(p.larvaAt)) * 6) % 480;
  const turn = P(f, a(p.lookAt), 16);
  const voice = f >= a(p.voiceAt) ? (f >= a(p.nameAt) && f < a(p.nameAt) + 25 ? 1 : 0.15 + 0.1 * Math.abs(Math.sin(f / 9))) : 0.03;
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 25% 50%, #0d1418 0%, #020304 75%)", overflow: "hidden", fontFamily: MONO }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <BreenRig f={f} o={P(f, a(p.rigAt), 20)} core={0} />
        {f >= a(p.larvaAt) ? <Larva f={f} x={450} y={500} s={1.1} o={P(f, a(p.larvaAt), 14)} turn={turn} col={f >= a(p.lookAt) ? CREAM : AMB} /> : null}
        {scan ? <line x1={260} x2={640} y1={scanY} y2={scanY} stroke={f >= a(p.lookAt) ? RED : GREEN} strokeWidth={2} opacity={0.8} /> : null}
        {/* "ela olha para o Gordon": a mira do HEV vira alvo dela */}
        {f >= a(p.lookAt) && f < a(p.isAt) ? <Bracket x={450} y={500} w={420} h={560} col={RED} o={flickIn(f, a(p.lookAt))} label="ORIENTAÇÃO · GORDON" /> : null}
      </svg>
      <div style={{ position: "absolute", left: 70, top: 56, color: ICE, letterSpacing: 6, fontSize: 22 }}>INSTALAÇÃO · SALA DO FUNDO</div>
      {f >= a(p.larvaAt) && f < a(p.isAt) ? (
        <div style={{ position: "absolute", left: 960, top: 230, width: 820, padding: "22px 26px", border: `1px solid ${GREEN}`, borderRadius: 10, background: "rgba(4,14,8,0.85)", opacity: P(f, a(p.larvaAt), 10) }}>
          <div style={{ fontSize: 16, letterSpacing: 5, color: GREEN }}>HEV · VARREDURA BIOLÓGICA</div>
          <div style={{ fontSize: 40, letterSpacing: 4, color: CREAM, marginTop: 10 }}>ORGANISMO LARVAL</div>
          {f >= a(p.advAt) ? <div style={{ fontSize: 22, letterSpacing: 3, color: VIO, marginTop: 12, opacity: P(f, a(p.advAt), 8) }}>ESPÉCIE ASSOCIADA AOS ADVISORS</div> : null}
          {f >= a(p.lookAt) ? <div style={{ fontSize: 24, letterSpacing: 4, color: RED, marginTop: 16, opacity: flickIn(f, a(p.lookAt)) }}>ATIVIDADE CONSCIENTE DETECTADA</div> : null}
        </div>
      ) : null}
      <div style={{ position: "absolute", left: 70, top: 830, width: 760, opacity: P(f, a(p.voiceAt) - 10, 10) }}>
        <div style={{ fontSize: 15, letterSpacing: 5, color: ICE }}>VOZ · QUASE IRRECONHECÍVEL</div>
        <VoiceStrip f={f} w={760} h={110} amp={voice} />
        {f >= a(p.nameAt) && f < a(p.mossAt) ? <div style={{ position: "absolute", left: 300, top: -46, fontSize: 40, letterSpacing: 8, color: CREAM, opacity: flickIn(f, a(p.nameAt)) }}>“FREEMAN”</div> : null}
      </div>
      {f >= a(p.isAt) ? (
        <div style={{ position: "absolute", left: 960, top: 220, width: 820, padding: "26px 30px", border: `1px solid ${AMB}`, borderRadius: 10, background: "rgba(14,10,4,0.88)", opacity: P(f, a(p.isAt), 10) }}>
          <div style={{ fontSize: 16, letterSpacing: 5, color: AMB }}>{f >= a(p.clearAt) ? "IDENTIFICAÇÃO" : "IDENTIFICANDO…"}</div>
          <div style={{ fontSize: 64, letterSpacing: 4, color: CREAM, marginTop: 10 }}>{f >= a(p.believeAt) ? "“WALLACE BREEN”" : "DR. WALLACE BREEN"}</div>
          {f >= a(p.believeAt) ? <div style={{ fontSize: 24, letterSpacing: 4, color: ICE, marginTop: 18, opacity: P(f, a(p.believeAt), 8) }}>ALGO QUE ACREDITA SER ELE</div> : null}
          {f >= a(p.mossAt) ? (
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 26, opacity: P(f, a(p.mossAt), 8) }}>
              <svg width={44} height={44}>
                <circle cx={22} cy={22} r={16} fill="none" stroke={GREEN} strokeWidth={2} />
                <circle cx={22} cy={22} r={6} fill={GREEN} />
              </svg>
              <div style={{ fontSize: 20, letterSpacing: 3, color: GREEN }}>MOSSMAN · PARADA · SEM ENTENDER</div>
            </div>
          ) : null}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ============================================================================================ 6 · BREEN v3 · 2) os Shu'ulathoi
// os terminais revelam a tecnologia; os Vortigaunts dão o nome (glifo verde); uma ficha de referência "fora dos jogos"
// (Marc Laidlaw · Epistle 3) desliza; a espécie: corpos espalhados no mapa ligados por fios de luz; os fios formam uma nuvem
// (mente coletiva) e dentro dela flutuam CONHECIMENTO, MEMÓRIA, CULTURA; os corpos esmaecem e a nuvem continua.
export const HLHiveMind: React.FC<{ life: number; termAt?: number; techAt?: number; vortAt?: number; nameAt?: number; laidAt?: number; ep3At?: number; versAt?: number; psyAt?: number; sepAt?: number; linkAt?: number; cloudAt?: number; knowAt?: number; bodyAt?: number }> = (p) => {
  const f = useCurrentFrame();
  const N = 1e9;
  const a = (v?: number) => v ?? N;
  void p.life;
  const bodies = Array.from({ length: 9 }).map((_, i) => ({ x: 300 + (i % 3) * 600 + (rnd(i * 3) - 0.5) * 220, y: 260 + Math.floor(i / 3) * 280 + (rnd(i * 7) - 0.5) * 120 }));
  const sp = P(f, a(p.versAt), 16);
  const fade = P(f, a(p.bodyAt), 30);
  const cloud = P(f, a(p.cloudAt), 30);
  const toks = [
    { k: "CONHECIMENTO", at: a(p.knowAt) },
    { k: "MEMÓRIA", at: a(p.knowAt) + 14 },
    { k: "CULTURA", at: a(p.knowAt) + 28 },
  ];
  return (
    <AbsoluteFill style={{ background: BG9("#0a1210"), overflow: "hidden", fontFamily: MONO }}>
      {/* fase 1: terminais + o nome */}
      {sp < 1 ? (
        <div style={{ position: "absolute", inset: 0, opacity: 1 - sp }}>
          <Title9 t="TERMINAIS · TECNOLOGIA COMBINE" col={GREEN} />
          <div style={{ position: "absolute", left: 120, top: 160, width: 760, padding: "18px 22px", border: `1px solid ${GREEN}`, borderRadius: 8, background: "rgba(4,14,8,0.85)", opacity: P(f, a(p.termAt), 8) }}>
            {["> host_bodies.sys", "> transferencia_consciencia.log", "> especie_portadora: ????"].map((l, i) => (
              <div key={i} style={{ fontSize: 22, color: GREEN, letterSpacing: 2, marginBottom: 10 }}>
                {typedS(f, a(p.termAt) + i * 16, l, 1.6)}
              </div>
            ))}
            {f >= a(p.techAt) ? <div style={{ fontSize: 26, color: CREAM, letterSpacing: 3, marginTop: 10, opacity: P(f, a(p.techAt), 8) }}>MUDA O SIGNIFICADO DA CENA</div> : null}
          </div>
          {f >= a(p.vortAt) ? (
            <div style={{ position: "absolute", left: 120, top: 520, width: 760, opacity: P(f, a(p.vortAt), 10) }}>
              <div style={{ fontSize: 16, letterSpacing: 5, color: GREEN }}>VORTIGAUNTS · NOME DA ESPÉCIE DOS ADVISORS</div>
              <svg width={760} height={120}>
                {Array.from({ length: 14 }).map((_, i) => (
                  <path key={i} d={`M ${30 + i * 52} 60 q 14 -${20 + rnd(i) * 30} 28 0 q -14 ${20 + rnd(i * 2) * 30} -28 0`} fill="none" stroke={GREEN} strokeWidth={2.5} opacity={P(f, a(p.vortAt) + i * 2, 6)} />
                ))}
              </svg>
              {f >= a(p.nameAt) ? <div style={{ fontSize: 76, letterSpacing: 10, color: CREAM, opacity: flickIn(f, a(p.nameAt)), textShadow: "0 0 30px rgba(141,255,168,0.4)" }}>SHU'ULATHOI</div> : null}
            </div>
          ) : null}
          {f >= a(p.laidAt) ? (
            <div style={{ position: "absolute", right: 120, top: 220, width: 560, height: 640, background: "linear-gradient(170deg, #eee6d2, #ddd2b6)", borderRadius: 8, boxShadow: "0 40px 120px rgba(0,0,0,0.6)", transform: `translateX(${(1 - P(f, a(p.laidAt), 18)) * 700}px) rotate(3deg)`, padding: "40px 44px", color: "#1c2a6e", fontFamily: MONO }}>
              <div style={{ fontSize: 16, letterSpacing: 4, color: "#b3121b" }}>REFERÊNCIA · FORA DOS JOGOS</div>
              <div style={{ fontSize: 40, letterSpacing: 2, marginTop: 20 }}>MARC LAIDLAW</div>
              {f >= a(p.ep3At) ? <div style={{ fontSize: 22, letterSpacing: 2, marginTop: 14, opacity: P(f, a(p.ep3At), 8) }}>O CONCEITO QUE PODERIA TER SIDO O EPISÓDIO 3</div> : null}
              {Array.from({ length: 9 }).map((_, k) => (
                <div key={k} style={{ height: 8, width: `${60 + rnd(k * 3) * 35}%`, background: "rgba(28,42,110,0.25)", marginTop: k ? 16 : 40 }} />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
      {/* fase 2: a espécie */}
      {sp > 0 ? (
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: sp }}>
          {/* a nuvem coletiva */}
          {cloud > 0
            ? Array.from({ length: 30 }).map((_, i) => (
                <circle key={"c" + i} cx={960 + Math.cos(i * 2.4 + f / 80) * (200 + (i % 5) * 70)} cy={540 + Math.sin(i * 1.9 + f / 90) * (120 + (i % 4) * 50)} r={60 + (i % 3) * 30} fill="rgba(141,255,168,0.05)" opacity={cloud} />
              ))
            : null}
          {/* fios entre os corpos */}
          {f >= a(p.linkAt)
            ? bodies.map((b, i) =>
                bodies.slice(i + 1).map((c, j) =>
                  (i + j) % 2 === 0 ? <line key={i + "-" + j} x1={b.x} y1={b.y} x2={c.x} y2={c.y} stroke={GREEN} strokeWidth={1.2} opacity={P(f, a(p.linkAt) + (i + j) * 2, 10) * (0.35 + 0.25 * Math.sin(f / 7 + i + j))} /> : null,
                ),
              )
            : null}
          {/* os corpos (casulos larvais pequenos) */}
          {bodies.map((b, i) => (
            <g key={i} opacity={P(f, a(p.versAt) + i * 3, 8) * (1 - fade * 0.85)}>
              <Larva f={f + i * 10} x={b.x} y={b.y} s={0.5} col={GREEN} />
            </g>
          ))}
          {f >= a(p.sepAt) && f < a(p.linkAt) + 20
            ? bodies.slice(0, 3).map((b, i) => <line key={"d" + i} x1={b.x} y1={b.y + 80} x2={bodies[i + 3].x} y2={bodies[i + 3].y - 40} stroke={CREAM} strokeDasharray="4 8" opacity={P(f, a(p.sepAt), 8) * 0.6} />)
            : null}
          {toks.map((t, i) =>
            f >= t.at ? (
              <text key={t.k} x={760 + i * 200} y={560 + Math.sin(f / 15 + i) * 20} textAnchor="middle" fill={CREAM} fontFamily={MONO} fontSize={26} letterSpacing={5} opacity={flickIn(f, t.at)}>
                {t.k}
              </text>
            ) : null,
          )}
        </svg>
      ) : null}
      {sp > 0 ? <Title9 t={f >= a(p.cloudAt) ? "SHU'ULATHOI · MENTE COLETIVA" : f >= a(p.psyAt) ? "SHU'ULATHOI · ESPÉCIE PSÍQUICA" : "SHU'ULATHOI · ANTES DO COMBINE"} col={GREEN} o={sp} /> : null}
      {f >= a(p.bodyAt) ? <div style={{ position: "absolute", left: 0, right: 0, bottom: 80, textAlign: "center", fontSize: 26, letterSpacing: 6, color: GREEN, opacity: P(f, a(p.bodyAt), 10) }}>SEM DEPENDER DO CORPO</div> : null}
    </AbsoluteFill>
  );
};

// ============================================================================================ 6 · BREEN v3 · 3) host bodies
// a moldura vermelha do Combine fecha sobre a rede; vira linha de produção: casulos em fila numa esteira; cápsulas de
// consciência (luz âmbar) descem para dentro de cada um, com o modo marcado (PRESERVAR · COPIAR · IMPRIMIR). Depois os
// Advisors: cada casulo com um "?" dentro: quem está aí dentro? RECIPIENTES.
export const HLHostBodies: React.FC<{ life: number; conqAt?: number; techAt?: number; larvAt?: number; hostAt?: number; recAt?: number; modeAt?: number; advAt?: number; whoAt?: number; moreAt?: number; cmdAt?: number; vesselAt?: number }> = (p) => {
  const f = useCurrentFrame();
  const N = 1e9;
  const a = (v?: number) => v ?? N;
  void p.life;
  const adv = P(f, a(p.advAt), 20);
  const belt = (f - a(p.larvAt)) * 1.2;
  const modes = ["PRESERVAR", "COPIAR", "IMPRIMIR"];
  return (
    <AbsoluteFill style={{ background: BG9("#120a08"), overflow: "hidden", fontFamily: MONO }}>
      <Title9 t={adv > 0.5 ? "ADVISORS · O QUE EXISTE DENTRO" : "COMBINE · TECNOLOGIA DE HOSPEDEIROS"} col={adv > 0.5 ? VIO : RED} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {/* a conquista: moldura fechando */}
        {f < a(p.larvAt) + 20 ? (
          <g opacity={1 - P(f, a(p.larvAt), 20)}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Larva key={i} f={f + i * 7} x={460 + i * 200} y={540} s={0.4} col={GREEN} />
            ))}
            <rect x={lerp(100, 360, P(f, a(p.conqAt), 30))} y={lerp(120, 300, P(f, a(p.conqAt), 30))} width={lerp(1720, 1200, P(f, a(p.conqAt), 30))} height={lerp(840, 480, P(f, a(p.conqAt), 30))} fill="none" stroke={RED} strokeWidth={4} opacity={P(f, a(p.conqAt), 10)} />
            {f >= a(p.techAt) ? <text x={960} y={280} textAnchor="middle" fill={RED} fontFamily={MONO} fontSize={24} letterSpacing={6} opacity={P(f, a(p.techAt), 8)}>BIOLOGIA → TECNOLOGIA</text> : null}
          </g>
        ) : null}
        {/* a esteira */}
        {f >= a(p.larvAt) ? (
          <g opacity={P(f, a(p.larvAt), 14) * (1 - adv)}>
            <line x1={0} x2={1920} y1={760} y2={760} stroke="rgba(255,93,77,0.5)" strokeWidth={3} />
            {Array.from({ length: 7 }).map((_, i) => {
              const x = ((i * 300 + belt) % 2100) - 100;
              const k = Math.floor((i * 300 + belt) / 2100) + i;
              const m = modes[k % 3];
              const drop = P(f, a(p.recAt) + i * 8, 20);
              return (
                <g key={i}>
                  <rect x={x - 70} y={420} width={140} height={340} rx={14} fill="rgba(255,93,77,0.05)" stroke={RED} strokeWidth={2} />
                  <Larva f={f + i * 9} x={x} y={600} s={0.42} col={AMB} />
                  {f >= a(p.recAt) ? <circle cx={x} cy={lerp(300, 560, drop)} r={14} fill={AMB} opacity={drop < 1 ? 1 : 0.5 + 0.5 * Math.sin(f / 5 + i)} /> : null}
                  {f >= a(p.modeAt) ? (
                    <text x={x} y={800} textAnchor="middle" fill={CREAM} fontFamily={MONO} fontSize={16} letterSpacing={3} opacity={P(f, a(p.modeAt) + i * 4, 8)}>
                      {m}
                    </text>
                  ) : null}
                </g>
              );
            })}
            {f >= a(p.hostAt) ? <text x={960} y={330} textAnchor="middle" fill={AMB} fontFamily={MONO} fontSize={36} letterSpacing={8} opacity={flickIn(f, a(p.hostAt))}>HOST BODIES</text> : null}
            {f >= a(p.recAt) ? <text x={960} y={375} textAnchor="middle" fill={CREAM} fontFamily={MONO} fontSize={18} letterSpacing={4} opacity={P(f, a(p.recAt), 8)}>RECIPIENTES PARA OUTRAS CONSCIÊNCIAS</text> : null}
          </g>
        ) : null}
        {/* os Advisors como recipientes */}
        {adv > 0
          ? [0, 1, 2, 3, 4].map((i) => {
              const x = 360 + i * 300;
              return (
                <g key={"a" + i} opacity={adv * P(f, a(p.advAt) + i * 4, 8)}>
                  <Larva f={f + i * 13} x={x} y={560} s={0.6} col={VIO} />
                  {f >= a(p.whoAt) ? (
                    <text x={x} y={520} textAnchor="middle" fill={CREAM} fontFamily={MONO} fontSize={54} opacity={0.6 + 0.4 * Math.sin(f / 8 + i)}>
                      ?
                    </text>
                  ) : null}
                </g>
              );
            })
          : null}
      </svg>
      {f >= a(p.whoAt) ? <div style={{ position: "absolute", left: 0, right: 0, top: 150, textAlign: "center", fontSize: 26, letterSpacing: 6, color: CREAM, opacity: P(f, a(p.whoAt), 8) * (f >= a(p.moreAt) ? 0.5 : 1) }}>QUEM EXISTE DENTRO DE CADA UM?</div> : null}
      {f >= a(p.moreAt) ? (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 110, display: "flex", justifyContent: "center", gap: 40, opacity: P(f, a(p.moreAt), 8) }}>
          <div style={{ padding: "14px 22px", border: "1px solid rgba(255,226,176,0.4)", borderRadius: 8, fontSize: 24, letterSpacing: 4, color: f >= a(p.vesselAt) ? "rgba(255,226,176,0.4)" : CREAM, textDecoration: f >= a(p.vesselAt) ? "line-through" : "none" }}>{f >= a(p.cmdAt) ? "ESPÉCIE ALIENÍGENA NO COMANDO" : "ESPÉCIE ALIENÍGENA"}</div>
          {f >= a(p.vesselAt) ? <div style={{ padding: "14px 22px", border: `2px solid ${VIO}`, borderRadius: 8, fontSize: 30, letterSpacing: 6, color: VIO, opacity: flickIn(f, a(p.vesselAt)) }}>RECIPIENTES</div> : null}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ============================================================================================ 6 · BREEN v3 · 4) o registro do Breen
// linha do tempo: BACKUP DA MENTE (bem antes) → QUEDA DA CIDADELA (o original morre, ✝) → a oferta dos Advisors (seta que
// não chega no corpo: NUNCA SALVOU) → do backup sai uma linha por baixo até um casulo hospedeiro: IMPRESSÃO. Duas fichas:
// W. BREEN · ORIGINAL (morto) × W. BREEN · VERSÃO (continuou existindo).
export const HLBreenRecord: React.FC<{ life: number; recAt?: number; diedAt?: number; offerAt?: number; neverAt?: number; backupAt?: number; afterAt?: number; printAt?: number; notAt?: number; versAt?: number }> = (p) => {
  const f = useCurrentFrame();
  const N = 1e9;
  const a = (v?: number) => v ?? N;
  void p.life;
  const Y = 440;
  const XB = 380;
  const XC = 1100;
  const XH = 1560;
  const cards = P(f, a(p.notAt), 20);
  return (
    <AbsoluteFill style={{ background: BG9("#0e0c0a"), overflow: "hidden", fontFamily: MONO }}>
      <Title9 t="MOSSMAN · REGISTRO · W. BREEN" col={GREEN} o={P(f, a(p.recAt), 8)} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: 1 - cards * 0.55 }}>
        <line x1={160} x2={1780} y1={Y} y2={Y} stroke="rgba(255,226,176,0.4)" strokeWidth={2} />
        {/* a queda */}
        {f >= a(p.diedAt) ? (
          <g opacity={P(f, a(p.diedAt), 8)}>
            <line x1={XC} x2={XC} y1={Y - 120} y2={Y + 260} stroke={RED} strokeWidth={2} strokeDasharray="8 6" />
            <circle cx={XC} cy={Y} r={12} fill={RED} />
            <text x={XC} y={Y - 140} textAnchor="middle" fill={RED} fontFamily={MONO} fontSize={20} letterSpacing={3}>QUEDA DA CIDADELA</text>
            <text x={XC} y={Y + 40} textAnchor="middle" fill={RED} fontFamily={MONO} fontSize={16} letterSpacing={3}>BREEN ORIGINAL ✝</text>
          </g>
        ) : null}
        {/* a oferta que não salvou */}
        {f >= a(p.offerAt) ? (
          <g opacity={P(f, a(p.offerAt), 8)}>
            <path d={`M ${XC - 260} ${Y - 60} C ${XC - 160} ${Y - 110} ${XC - 60} ${Y - 90} ${XC - 20} ${Y - 30}`} fill="none" stroke={VIO} strokeWidth={3} strokeDasharray="8 6" />
            <text x={XC - 270} y={Y - 74} textAnchor="end" fill={VIO} fontFamily={MONO} fontSize={15} letterSpacing={3}>OFERTA DOS ADVISORS · FIM DO HL2</text>
            {f >= a(p.neverAt) ? (
              <g opacity={flickIn(f, a(p.neverAt))}>
                <line x1={XC - 44} y1={Y - 54} x2={XC - 4} y2={Y - 14} stroke={RED} strokeWidth={4} />
                <line x1={XC - 4} y1={Y - 54} x2={XC - 44} y2={Y - 14} stroke={RED} strokeWidth={4} />
                <text x={XC - 24} y={Y - 74} textAnchor="middle" fill={RED} fontFamily={MONO} fontSize={14} letterSpacing={3}>NUNCA SALVOU O CORPO</text>
              </g>
            ) : null}
          </g>
        ) : null}
        {/* o backup antigo */}
        {f >= a(p.backupAt) ? (
          <g opacity={P(f, a(p.backupAt), 10)}>
            <circle cx={XB} cy={Y} r={30 + 4 * Math.sin(f / 6)} fill="rgba(255,178,46,0.15)" stroke={AMB} strokeWidth={3} />
            <text x={XB} y={Y + 70} textAnchor="middle" fill={AMB} fontFamily={MONO} fontSize={18} letterSpacing={3}>CÓPIA ANTERIOR DA MENTE</text>
            <text x={XB} y={Y - 52} textAnchor="middle" fill="rgba(255,226,176,0.6)" fontFamily={MONO} fontSize={14} letterSpacing={3}>PRESERVADA PELOS COMBINE</text>
          </g>
        ) : null}
        {/* depois da morte: impressão no hospedeiro */}
        {f >= a(p.afterAt) ? (
          <g>
            <path d={`M ${XB} ${Y + 30} C ${XB + 200} ${Y + 300} ${XH - 300} ${Y + 300} ${XH} ${Y + 120}`} fill="none" stroke={AMB} strokeWidth={4} pathLength={1} strokeDasharray="1" strokeDashoffset={1 - P(f, a(p.afterAt), 40)} />
            <circle cx={lerp(XB, XH, P(f, a(p.afterAt), 40))} cy={Y + 30 + Math.sin(P(f, a(p.afterAt), 40) * Math.PI) * 220} r={10} fill={AMB} />
          </g>
        ) : null}
        {f >= a(p.printAt) ? (
          <g opacity={P(f, a(p.printAt), 10)}>
            <Larva f={f} x={XH} y={Y + 10} s={0.5} col={AMB} />
            <text x={XH} y={Y + 190} textAnchor="middle" fill={AMB} fontFamily={MONO} fontSize={18} letterSpacing={3}>IMPRESSA · CORPO HOSPEDEIRO</text>
          </g>
        ) : null}
      </svg>
      {cards > 0 ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 620, display: "flex", justifyContent: "center", gap: 60, opacity: cards }}>
          <div style={{ width: 600, padding: "20px 26px", border: `1px solid ${RED}`, borderRadius: 10, background: "rgba(14,4,4,0.9)" }}>
            <div style={{ fontSize: 15, letterSpacing: 5, color: RED }}>W. BREEN · ORIGINAL</div>
            <div style={{ fontSize: 30, letterSpacing: 3, color: "rgba(255,226,176,0.55)", marginTop: 8, textDecoration: "line-through" }}>SOBREVIVEU À CIDADELA</div>
            <div style={{ fontSize: 24, letterSpacing: 3, color: RED, marginTop: 8 }}>MORREU NA QUEDA</div>
          </div>
          {f >= a(p.versAt) ? (
            <div style={{ width: 600, padding: "20px 26px", border: `2px solid ${AMB}`, borderRadius: 10, background: "rgba(14,10,4,0.92)", opacity: flickIn(f, a(p.versAt)) }}>
              <div style={{ fontSize: 15, letterSpacing: 5, color: AMB }}>W. BREEN · VERSÃO</div>
              <div style={{ fontSize: 30, letterSpacing: 3, color: CREAM, marginTop: 8 }}>CONTINUOU EXISTINDO</div>
              <div style={{ fontSize: 24, letterSpacing: 3, color: AMB, marginTop: 8 }}>DEPOIS QUE O ORIGINAL MORREU</div>
            </div>
          ) : null}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ============================================================================================ 6 · BREEN v3 · 5) Cave, Caroline, GLaDOS
// callback das gravações do Cave: a linha COMBINE (host bodies) → BOREALIS (anomalias) → APERTURE; no nó da Aperture entram
// ARQUITETURA ✓ EQUIPAMENTOS ✓ e uma terceira gaveta: UMA MENTE EM OUTRO SUPORTE ?; dela sai a cadeia CAVE JOHNSON →
// CAROLINE → GLaDOS (o olho em anel). No fim, "tecnologia que nem compreendia": o fio da cadeia treme.
export const HLCaveLineage: React.FC<{ life: number; againAt?: number; caveAt?: number; borAt?: number; archAt?: number; mindAt?: number; planAt?: number; carAt?: number; gladAt?: number; tryAt?: number; notUndAt?: number }> = (p) => {
  const f = useCurrentFrame();
  const N = 1e9;
  const a = (v?: number) => v ?? N;
  void p.life;
  const Y = 300;
  const nodes = [
    { x: 300, t: "COMBINE", s: "HOST BODIES", c: RED, at: a(p.againAt) },
    { x: 760, t: "BOREALIS", s: "ANOMALIAS", c: ICE, at: a(p.borAt) },
    { x: 1240, t: "APERTURE", s: "CAVE JOHNSON · DÉCADAS ANTES", c: AMB, at: a(p.caveAt) },
  ];
  const chain = [
    { x: 560, t: "CAVE JOHNSON", at: a(p.planAt) },
    { x: 1000, t: "CAROLINE", at: a(p.carAt) },
    { x: 1440, t: "GLaDOS", at: a(p.gladAt) },
  ];
  const shake = f >= a(p.notUndAt) ? (rnd(Math.floor(f / 2)) - 0.5) * 6 : 0;
  return (
    <AbsoluteFill style={{ background: BG9("#100d08"), overflow: "hidden", fontFamily: MONO }}>
      <Title9 t="CALLBACK · AS GRAVAÇÕES DO CAVE" col={AMB} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {nodes.map((n, i) =>
          f >= n.at ? (
            <g key={i} opacity={P(f, n.at, 10)}>
              {i > 0 ? <line x1={nodes[i - 1].x + 70} y1={Y} x2={n.x - 70} y2={Y} stroke={n.c} strokeWidth={3} strokeDasharray="10 8" strokeDashoffset={-f * 2} /> : null}
              <circle cx={n.x} cy={Y} r={56} fill="rgba(0,0,0,0.4)" stroke={n.c} strokeWidth={3} />
              <text x={n.x} y={Y + 7} textAnchor="middle" fill={n.c} fontFamily={MONO} fontSize={17} letterSpacing={3}>{n.t}</text>
              <text x={n.x} y={Y + 92} textAnchor="middle" fill="rgba(255,226,176,0.65)" fontFamily={MONO} fontSize={13} letterSpacing={3}>{n.s}</text>
            </g>
          ) : null,
        )}
        {/* a cadeia */}
        {chain.map((c, i) =>
          f >= c.at ? (
            <g key={"c" + i} opacity={P(f, c.at, 10)} transform={`translate(${shake} 0)`}>
              {i === 0 ? <path d={`M 1240 ${Y + 120} C 1240 ${Y + 260} ${c.x} ${Y + 220} ${c.x} ${Y + 330}`} fill="none" stroke={AMB} strokeWidth={3} /> : <line x1={chain[i - 1].x + 80} y1={Y + 400} x2={c.x - 80} y2={Y + 400} stroke={AMB} strokeWidth={3} />}
              {i < 2 ? (
                <rect x={c.x - 80} y={Y + 340} width={160} height={120} rx={10} fill="rgba(255,178,46,0.06)" stroke={AMB} strokeWidth={2} />
              ) : (
                <g>
                  <circle cx={c.x} cy={Y + 400} r={64} fill="rgba(0,0,0,0.5)" stroke={CREAM} strokeWidth={3} />
                  <circle cx={c.x} cy={Y + 400} r={22} fill={AMB} opacity={0.6 + 0.4 * Math.sin(f / 6)} />
                  <circle cx={c.x} cy={Y + 400} r={36} fill="none" stroke={AMB} strokeWidth={2} />
                </g>
              )}
              <text x={c.x} y={Y + 500} textAnchor="middle" fill={i === 2 ? CREAM : AMB} fontFamily={MONO} fontSize={20} letterSpacing={4}>{c.t}</text>
            </g>
          ) : null,
        )}
      </svg>
      {/* o que a Aperture copiou */}
      {f >= a(p.archAt) ? (
        <div style={{ position: "absolute", right: 80, top: 120, width: 400, opacity: P(f, a(p.archAt), 8) }}>
          <div style={{ fontSize: 15, letterSpacing: 5, color: AMB }}>A APERTURE COPIOU</div>
          {[
            { k: "ARQUITETURA", ok: true, at: a(p.archAt) },
            { k: "EQUIPAMENTOS", ok: true, at: a(p.archAt) + 20 },
            { k: "UMA MENTE EM OUTRO SUPORTE", ok: false, at: a(p.mindAt) },
          ].map((r, i) =>
            f >= r.at ? (
              <div key={i} style={{ marginTop: 10, padding: "10px 14px", border: `1px solid ${r.ok ? GREEN : AMB}`, borderRadius: 6, fontSize: r.ok ? 18 : 20, letterSpacing: 2, color: r.ok ? GREEN : CREAM, opacity: flickIn(f, r.at), background: r.ok ? "transparent" : "rgba(255,178,46,0.1)" }}>
                {r.ok ? `✓ ${r.k}` : `? ${r.k}`}
              </div>
            ) : null,
          )}
        </div>
      ) : null}
      {f >= a(p.tryAt) ? (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 70, textAlign: "center", opacity: P(f, a(p.tryAt), 8) }}>
          <div style={{ fontSize: 22, letterSpacing: 5, color: CREAM }}>UMA TENTATIVA DE REPRODUZIR</div>
          {f >= a(p.notUndAt) ? <div style={{ fontSize: 28, letterSpacing: 5, color: RED, marginTop: 8, opacity: P(f, a(p.notUndAt), 8) }}>UMA TECNOLOGIA QUE ELA NEM COMPREENDIA</div> : null}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ============================================================================================ 6 · BREEN v3 · 6) a ironia + continuidade
// duas colunas: CAVE (a vida inteira procurando continuar · ✗) e BREEN (conseguiu ✓ → implorando para morrer). Depois a
// palavra: IMORTALIDADE riscada, CONTINUIDADE em eco; a promessa (o corpo termina · algo continua).
export const HLIrony: React.FC<{ life: number; ironyAt?: number; caveAt?: number; breenAt?: number; begAt?: number; bodyAt?: number; wordAt?: number; promAt?: number; notImmAt?: number; contAt?: number; endAt?: number; goesAt?: number }> = (p) => {
  const f = useCurrentFrame();
  const N = 1e9;
  const a = (v?: number) => v ?? N;
  void p.life;
  const ph2 = P(f, a(p.bodyAt), 16);
  return (
    <AbsoluteFill style={{ background: BG9("#0c0a08"), overflow: "hidden", fontFamily: MONO }}>
      <Title9 t={ph2 > 0.5 ? "W. BREEN · A PALAVRA" : "UMA IRONIA ABSURDA"} col={AMB} o={P(f, a(p.ironyAt), 8)} />
      {ph2 < 1 ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 220, display: "flex", justifyContent: "center", gap: 80, opacity: 1 - ph2 }}>
          {[
            { at: a(p.caveAt), n: "CAVE JOHNSON", k: "A VIDA INTEIRA PROCURANDO CONTINUAR", v: "✗", c: AMB },
            { at: a(p.breenAt), n: "WALLACE BREEN", k: "CONSEGUIU", v: "✓", c: CREAM },
          ].map((col, i) =>
            f >= col.at ? (
              <div key={i} style={{ width: 640, minHeight: 420, padding: "28px 30px", border: `1px solid ${col.c}`, borderRadius: 12, background: "rgba(8,8,8,0.85)", opacity: flickIn(f, col.at) }}>
                <div style={{ fontSize: 18, letterSpacing: 6, color: col.c }}>{col.n}</div>
                <div style={{ fontSize: 30, letterSpacing: 3, color: CREAM, marginTop: 20 }}>{col.k}</div>
                <div style={{ fontSize: 90, color: i ? GREEN : RED, marginTop: 20 }}>{col.v}</div>
                {i === 1 && f >= a(p.begAt) ? <div style={{ fontSize: 30, letterSpacing: 4, color: RED, marginTop: 6, opacity: flickIn(f, a(p.begAt)) }}>E AGORA IMPLORA PARA MORRER</div> : null}
              </div>
            ) : null,
          )}
        </div>
      ) : null}
      {ph2 > 0 ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 160, textAlign: "center", opacity: ph2 }}>
          <div style={{ width: 760, margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18, letterSpacing: 3, color: CREAM }}>
              <span>SUSTENTAÇÃO DA VOZ</span>
              <span style={{ color: RED }}>{`${Math.round(9 + 3 * Math.sin(f / 5))}%`}</span>
            </div>
            <div style={{ height: 12, border: `1px solid ${RED}`, marginTop: 8, position: "relative" }}>
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${9 + 3 * Math.sin(f / 5)}%`, background: RED }} />
            </div>
          </div>
          {f >= a(p.notImmAt) ? <div style={{ fontSize: 48, letterSpacing: 8, color: "rgba(255,226,176,0.4)", marginTop: 60, textDecoration: "line-through", opacity: P(f, a(p.notImmAt), 8) }}>IMORTALIDADE</div> : null}
          {f >= a(p.wordAt) ? (
            <div style={{ position: "relative", height: 200, marginTop: 20 }}>
              {[3, 2, 1, 0].map((k) => {
                const t = ((f - a(p.wordAt)) / 40 + k * 0.25) % 1;
                return (
                  <div key={k} style={{ position: "absolute", left: 0, right: 0, top: t * 110, fontSize: 80, letterSpacing: 10, color: CREAM, opacity: (1 - t) * 0.9 * P(f, a(p.wordAt), 6) }}>
                    CONTINUIDADE
                  </div>
                );
              })}
            </div>
          ) : null}
          {f >= a(p.promAt) ? (
            <div style={{ width: 760, margin: "10px auto 0", padding: "16px 20px", border: `1px solid ${ICE}`, borderRadius: 8, background: "rgba(4,10,14,0.88)", opacity: P(f, a(p.promAt), 8), textAlign: "left" }}>
              <div style={{ fontSize: 15, letterSpacing: 5, color: ICE }}>O QUE PROMETERAM</div>
              {f >= a(p.endAt) ? (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 26, letterSpacing: 4, color: CREAM, marginTop: 10, opacity: P(f, a(p.endAt), 8) }}>
                  <span>O CORPO</span>
                  <span style={{ color: RED }}>PODE TERMINAR</span>
                </div>
              ) : null}
              {f >= a(p.goesAt) ? (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 26, letterSpacing: 4, color: CREAM, marginTop: 6, opacity: P(f, a(p.goesAt), 8) }}>
                  <span>ALGO DELE</span>
                  <span style={{ color: GREEN }}>CONTINUA</span>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ============================================================================================ 6 · BREEN v3 · 7) continuar ≠ sobreviver
// o símbolo da perpetuidade (∞, o mesmo da Regra 4) perde o brilho e racha; embaixo, duas barras: CONTINUAR (cheia) ×
// SOBREVIVER (vazia); o ECG do suporte continua batendo fraco.
export const HLContinueVsSurvive: React.FC<{ life: number; firstAt?: number; perpAt?: number; whyAt?: number; gotAt?: number; contAt?: number; survAt?: number }> = (p) => {
  const f = useCurrentFrame();
  const N = 1e9;
  const a = (v?: number) => v ?? N;
  void p.life;
  const dim = P(f, a(p.perpAt) + 30, 40);
  const crack = P(f, a(p.whyAt), 20);
  return (
    <AbsoluteFill style={{ background: BG9("#0c0a10"), overflow: "hidden", fontFamily: MONO }}>
      <Title9 t="A PERPETUIDADE · DE PERTO" col={VIO} o={P(f, a(p.firstAt), 8)} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <g transform="translate(960 380) scale(2.2)" opacity={P(f, a(p.firstAt), 14)}>
          <path d="M 0 0 C 60 -90 150 -90 150 0 C 150 90 60 90 0 0 C -60 -90 -150 -90 -150 0 C -150 90 -60 90 0 0 Z" fill="none" stroke={`rgba(199,155,255,${1 - dim * 0.7})`} strokeWidth={5} style={{ filter: `drop-shadow(0 0 ${12 * (1 - dim)}px ${VIO})` }} />
          {crack > 0 ? <path d="M 96 -60 l -12 22 l 16 10 l -14 24 l 10 20" fill="none" stroke={RED} strokeWidth={3} opacity={crack} /> : null}
        </g>
        {f >= a(p.perpAt) ? <text x={960} y={620} textAnchor="middle" fill={VIO} fontFamily={MONO} fontSize={22} letterSpacing={6} opacity={P(f, a(p.perpAt), 8) * (1 - dim * 0.6)}>A GRANDE PROMESSA DOS COMBINE</text> : null}
      </svg>
      {f >= a(p.gotAt) ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 680, textAlign: "center", fontSize: 24, letterSpacing: 4, color: CREAM, opacity: P(f, a(p.gotAt), 8) * (f >= a(p.contAt) ? 0.5 : 1) }}>GORDON OLHA PARA QUEM CONSEGUIU EXATAMENTE ISSO</div>
      ) : null}
      {f >= a(p.contAt) ? (
        <div style={{ position: "absolute", left: 460, right: 460, top: 760, opacity: P(f, a(p.contAt), 8) }}>
          {[
            { k: "CONTINUAR", v: 100, c: GREEN, at: a(p.contAt) },
            { k: "SOBREVIVER", v: 0, c: RED, at: a(p.survAt) },
          ].map((r, i) =>
            f >= r.at ? (
              <div key={i} style={{ marginTop: i ? 20 : 0, opacity: P(f, r.at, 8) }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24, letterSpacing: 5, color: r.c }}>
                  <span>{r.k}</span>
                  <span>{r.v ? "✓" : "✗"}</span>
                </div>
                <div style={{ height: 14, border: `1px solid ${r.c}`, marginTop: 8, position: "relative" }}>
                  <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${r.v * P(f, r.at, 20)}%`, background: r.c }} />
                </div>
              </div>
            ) : null,
          )}
        </div>
      ) : null}
      <div style={{ position: "absolute", left: 70, bottom: 40, opacity: 0.8 }}>
        <div style={{ fontSize: 14, letterSpacing: 4, color: GREEN }}>SUPORTE · ATIVO</div>
        <Ecg f={f} bpm={40} jitter={0.8} col={GREEN} w={340} h={60} />
      </div>
    </AbsoluteFill>
  );
};

// ============================================================================================ 6 · BREEN v3 · 8) depois do Breen
// a Mossman volta aos terminais: as pastas criptografadas e as anotações descem num funil até o ícone do Kleiner (envio);
// do lado, o contato da Alyx com a linha de voz reta: ela acompanha em silêncio. No "pouco depois" a tela esfria.
export const HLAfterBreen: React.FC<{ life: number; backAt?: number; copyAt?: number; notesAt?: number; alyxAt?: number; laterAt?: number }> = (p) => {
  const f = useCurrentFrame();
  const N = 1e9;
  const a = (v?: number) => v ?? N;
  const files = Array.from({ length: 8 }).map((_, i) => ({ at: a(p.copyAt) + i * 6, k: i < 5 ? `ARQ-${(4417 + i * 31).toString(16).toUpperCase()} · CRIPT.` : `ANOTAÇÃO ${i - 4}`, note: i >= 5 }));
  const cool = P(f, a(p.laterAt), 30);
  return (
    <AbsoluteFill style={{ background: BG9("#08120c"), overflow: "hidden", fontFamily: MONO, filter: cool > 0 ? `saturate(${1 - cool * 0.6}) brightness(${1 - cool * 0.3})` : undefined }}>
      <Title9 t="MOSSMAN · DE VOLTA AOS TERMINAIS" col={GREEN} o={P(f, a(p.backAt), 8)} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {files.map((fl, i) => {
          if (f < fl.at || (fl.note && f < a(p.notesAt))) return null;
          const t = Math.min(1, (f - Math.max(fl.at, fl.note ? a(p.notesAt) + (i - 5) * 6 : 0)) / 40);
          const x = lerp(220 + (i % 4) * 150, 1180, t);
          const y = lerp(260 + Math.floor(i / 4) * 120, 560, t);
          return (
            <g key={i} opacity={1 - t * 0.6}>
              <rect x={x - 60} y={y - 30} width={120} height={60} rx={6} fill={fl.note ? "rgba(199,155,255,0.12)" : "rgba(141,255,168,0.1)"} stroke={fl.note ? VIO : GREEN} strokeWidth={2} />
              <text x={x} y={y + 5} textAnchor="middle" fill={CREAM} fontFamily={MONO} fontSize={11} letterSpacing={1}>{fl.k}</text>
            </g>
          );
        })}
        <path d="M 1100 420 L 1260 520 L 1260 600 L 1100 700" fill="none" stroke="rgba(141,255,168,0.4)" strokeWidth={2} />
        <circle cx={1380} cy={560} r={60} fill="rgba(141,255,168,0.08)" stroke={GREEN} strokeWidth={3} />
        <text x={1380} y={566} textAnchor="middle" fill={GREEN} fontFamily={MONO} fontSize={16} letterSpacing={3}>KLEINER</text>
        <text x={1380} y={650} textAnchor="middle" fill={CREAM} fontFamily={MONO} fontSize={16} letterSpacing={3}>{`ENVIO ${Math.min(100, Math.round(Math.max(0, f - a(p.copyAt)) * 0.9))}%`}</text>
      </svg>
      {f >= a(p.alyxAt) ? (
        <div style={{ position: "absolute", right: 90, top: 760, width: 520, padding: "14px 18px", border: `1px solid ${AMB}`, borderRadius: 8, background: "rgba(14,10,4,0.88)", opacity: P(f, a(p.alyxAt), 10) }}>
          <div style={{ fontSize: 15, letterSpacing: 5, color: AMB }}>ALYX VANCE · ACOMPANHANDO</div>
          <svg width={480} height={40} style={{ marginTop: 8 }}>
            <line x1={0} x2={480} y1={20} y2={20} stroke={AMB} strokeWidth={2} opacity={0.6} />
          </svg>
          <div style={{ fontSize: 18, letterSpacing: 4, color: "rgba(255,226,176,0.7)" }}>EM SILÊNCIO</div>
        </div>
      ) : null}
      {void p.life}
    </AbsoluteFill>
  );
};

// ============================================================================================ 7→8 · Barney: a máscara gruda
// a noite na frota (fogueira = brilho âmbar no canto). A máscara da Proteção Civil (objeto, wireframe) e uma ficha de
// identidade que gira: de um lado UNIDADE CP, do outro BARNEY CALHOUN · RESISTÊNCIA. Depois a ficha da Alyx gira do mesmo
// jeito. "Viu gente começar fingindo": uma fila de fichas girando cada vez mais devagar, até algumas pararem presas do lado
// da máscara (A MÁSCARA GRUDA). No fim, a ficha da Alyx gira sem parar entre as duas possibilidades.
const CPMask: React.FC<{ x: number; y: number; s?: number; col?: string; o?: number }> = ({ x, y, s = 1, col = ICE, o = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o} fill="none" stroke={col} strokeWidth={2.5 / s} strokeLinejoin="round">
    <path d="M -60 -70 C -60 -110 60 -110 60 -70 L 64 10 C 60 60 30 90 0 96 C -30 90 -60 60 -64 10 Z" />
    <ellipse cx={-26} cy={-30} rx={20} ry={14} />
    <ellipse cx={26} cy={-30} rx={20} ry={14} />
    <path d="M -22 40 L 22 40 L 18 78 L -18 78 Z" />
    {[48, 58, 68].map((yy) => (
      <line key={yy} x1={-16} x2={16} y1={yy} y2={yy} />
    ))}
    <path d="M -64 -10 L -86 -4 M 64 -10 L 86 -4" />
  </g>
);
const DualCard: React.FC<{ x: number; y: number; w?: number; h?: number; spin: number; front: [string, string]; back: [string, string]; fc?: string; bc?: string; o?: number; glue?: number }> = ({ x, y, w = 420, h = 250, spin, front, back, fc = CREAM, bc = RED, o = 1, glue = 0 }) => {
  const c = Math.cos(spin);
  const showBack = c < 0;
  const [t1, t2] = showBack ? back : front;
  const col = showBack ? bc : fc;
  return (
    <div style={{ position: "absolute", left: x - w / 2, top: y - h / 2, width: w, height: h, opacity: o, transform: `scaleX(${Math.max(0.02, Math.abs(c))})` }}>
      <div style={{ position: "absolute", inset: 0, border: `2px solid ${col}`, borderRadius: 12, background: showBack ? "rgba(20,6,6,0.92)" : "rgba(10,10,8,0.92)", padding: "18px 22px", fontFamily: MONO }}>
        <div style={{ fontSize: Math.round(h * 0.07), letterSpacing: 4, color: col }}>{t2}</div>
        <div style={{ fontSize: Math.round(h * 0.15), letterSpacing: 3, color: CREAM, marginTop: h * 0.08 }}>{t1}</div>
        {glue > 0 && showBack ? <div style={{ position: "absolute", left: 0, right: 0, bottom: h * 0.08, textAlign: "center", fontSize: Math.round(h * 0.08), letterSpacing: 4, color: RED, opacity: glue }}>PRESA</div> : null}
      </div>
    </div>
  );
};
export const HLMaskGlue: React.FC<{ life: number; nightAt?: number; uniAt?: number; fakeAt?: number; helpAt?: number; sameAt?: number; usingAt?: number; seriousAt?: number; sawAt?: number; survAt?: number; lostAt?: number; glueAt?: number; twoAt?: number; optAAt?: number; optBAt?: number }> = (p) => {
  const f = useCurrentFrame();
  const N = 1e9;
  const a = (v?: number) => v ?? N;
  void p.life;
  const ph = f >= a(p.twoAt) ? 3 : f >= a(p.sawAt) ? 2 : f >= a(p.sameAt) ? 1 : 0;
  const fire = 0.5 + 0.2 * Math.sin(f / 5) + 0.1 * Math.sin(f / 2.3);
  const bSpin = f >= a(p.fakeAt) ? (f - a(p.fakeAt)) * 0.06 : 0;
  const aSpin = (f - a(p.sameAt)) * (f >= a(p.seriousAt) ? 0.03 : 0.07);
  return (
    <AbsoluteFill style={{ backgroundColor: "#05070a", backgroundImage: "radial-gradient(ellipse at 15% 90%, rgba(255,140,40,0.18) 0%, rgba(5,7,10,1) 55%)", overflow: "hidden", fontFamily: MONO }}>
      <div style={{ position: "absolute", left: -120, bottom: -140, width: 520, height: 420, borderRadius: "50%", background: `radial-gradient(circle, rgba(255,150,50,${0.35 * fire}) 0%, rgba(0,0,0,0) 70%)` }} />
      <Title9 t={ph === 3 ? "DUAS POSSIBILIDADES" : "FROTA DA RESISTÊNCIA · NOITE"} col={AMB} o={P(f, a(p.nightAt), 8)} />
      {ph === 0 ? (
        <>
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
            {f >= a(p.uniAt) ? <CPMask x={560} y={500} s={2.6} col={f >= a(p.helpAt) ? "rgba(159,230,255,0.45)" : ICE} o={P(f, a(p.uniAt), 12)} /> : null}
          </svg>
          {f >= a(p.nightAt) ? (
            <div style={{ position: "absolute", left: 1000, top: 200, width: 760, padding: "18px 22px", border: "1px solid rgba(255,178,46,0.5)", borderRadius: 10, background: "rgba(14,10,4,0.85)", opacity: P(f, a(p.nightAt), 10) }}>
              <div style={{ fontSize: 15, letterSpacing: 5, color: AMB }}>BARNEY · CONVERSA COM GORDON</div>
              <div style={{ fontSize: 24, letterSpacing: 3, color: CREAM, marginTop: 8 }}>UM JEITO DIFERENTE DE OLHAR PARA A ALYX</div>
            </div>
          ) : null}
          {f >= a(p.uniAt) ? <DualCard x={1380} y={600} spin={bSpin} front={["BARNEY CALHOUN", "RESISTÊNCIA · POR DENTRO"]} back={["UNIDADE CP", "PROTEÇÃO CIVIL · COMBINE"]} o={P(f, a(p.uniAt), 10)} /> : null}
          {f >= a(p.fakeAt) ? <div style={{ position: "absolute", left: 1000, top: 800, fontSize: 20, letterSpacing: 4, color: "rgba(255,226,176,0.7)", opacity: P(f, a(p.fakeAt), 8) }}>{f >= a(p.helpAt) ? "FINGIA SERVIR · AJUDAVA A RESISTÊNCIA" : "ANOS DE UNIFORME"}</div> : null}
        </>
      ) : null}
      {ph === 1 ? (
        <>
          <DualCard x={560} y={540} w={380} h={230} spin={bSpin} front={["BARNEY", "RESISTÊNCIA"]} back={["UNIDADE CP", "COMBINE"]} o={0.55} />
          <DualCard x={1260} y={540} w={520} h={300} spin={aSpin} front={["ALYX VANCE", "RESISTÊNCIA ?"]} back={["ALYX VANCE", "COORDENAÇÃO COMBINE"]} fc={AMB} o={P(f, a(p.sameAt), 10)} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 160, textAlign: "center", fontSize: 26, letterSpacing: 5, color: CREAM, opacity: P(f, a(p.sameAt), 8) }}>{f >= a(p.usingAt) ? "SÓ USANDO ELES?" : "A MESMA COISA?"}</div>
          {f >= a(p.seriousAt) ? <div style={{ position: "absolute", left: 0, right: 0, bottom: 140, textAlign: "center", fontSize: 20, letterSpacing: 5, color: "rgba(255,226,176,0.6)", opacity: P(f, a(p.seriousAt), 8) }}>BARNEY FICA SÉRIO</div> : null}
        </>
      ) : null}
      {ph === 2 ? (
        <>
          {Array.from({ length: 6 }).map((_, i) => {
            const stuck = i % 3 !== 1 && f >= a(p.glueAt) + i * 6;
            const slow = Math.max(0.004, 0.09 - Math.max(0, f - a(p.lostAt)) * 0.0012 * (1 + i * 0.3));
            const sp = stuck ? Math.PI : (f - a(p.sawAt)) * slow + i;
            return <DualCard key={i} x={330 + (i % 3) * 630} y={i < 3 ? 380 : 720} w={330} h={200} spin={sp} front={[`CIDADÃO ${17 + i * 4}`, "FINGINDO"]} back={["UNIDADE CP", "MÁSCARA"]} o={P(f, a(p.sawAt) + i * 4, 8)} glue={stuck ? P(f, a(p.glueAt) + i * 6, 8) : 0} />;
          })}
          <div style={{ position: "absolute", left: 0, right: 0, top: 130, textAlign: "center", fontSize: 22, letterSpacing: 5, color: CREAM, opacity: P(f, a(p.survAt), 8) }}>{f >= a(p.lostAt) ? "ONDE TERMINA A ATUAÇÃO · ONDE COMEÇA A PESSOA" : "A MÁSCARA SÓ PRA SOBREVIVER"}</div>
          {f >= a(p.glueAt) ? <div style={{ position: "absolute", left: 0, right: 0, bottom: 70, textAlign: "center", fontSize: 44, letterSpacing: 10, color: RED, opacity: flickIn(f, a(p.glueAt)) }}>ÀS VEZES A MÁSCARA GRUDA</div> : null}
        </>
      ) : null}
      {ph === 3 ? (
        <>
          <DualCard x={960} y={520} w={540} h={310} spin={(f - a(p.twoAt)) * 0.05} front={["ALYX VANCE", "ENGANANDO OS COMBINE"]} back={["ALYX VANCE", "ACREDITANDO NO PAPEL"]} fc={GREEN} />
          {f >= a(p.optAAt) ? <div style={{ position: "absolute", left: 100, top: 500, width: 320, fontSize: 22, letterSpacing: 4, color: GREEN, opacity: P(f, a(p.optAAt), 8) }}>← ENGANANDO OS COMBINE</div> : null}
          {f >= a(p.optBAt) ? <div style={{ position: "absolute", right: 100, top: 500, width: 340, textAlign: "right", fontSize: 22, letterSpacing: 4, color: RED, opacity: P(f, a(p.optBAt), 8) }}>ACREDITANDO NO PAPEL →</div> : null}
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 110, textAlign: "center", fontSize: 18, letterSpacing: 5, color: "rgba(255,226,176,0.6)" }}>GORDON NÃO RESPONDE · O JOGO TAMBÉM NÃO</div>
        </>
      ) : null}
    </AbsoluteFill>
  );
};

// ================================================================================================ MÓDULO 10
// ---------------------------------------------------------------------------------------------- 10 · 1) a invasão
// corte do navio em wireframe: equipes Combine dentro das salas (pontos vermelhos) recebendo pacotes de instrução que vêm
// de fora (ALYX); a barra do procedimento trava; o ponto da Alyx volta para dentro; duas leituras (Advisors × Alyx); o
// esquadrão do Gordon entra por baixo; lá fora, no gelo, a rota verde do Barney/Varga/Eli fica aberta.
export const HLInvasion: React.FC<{ life: number; planAt?: number; teamsAt?: number; instrAt?: number; stuckAt?: number; invAt?: number; backAt?: number; advAt?: number; alyxAt?: number; gordAt?: number; routeAt?: number }> = (p) => {
  const f = useCurrentFrame();
  const N = 1e9;
  const a = (v?: number) => v ?? N;
  void p.life;
  const SX = 960;
  const SY = 470;
  const rooms = [
    [-520, -60],
    [-330, -60],
    [-140, -60],
    [50, -60],
    [240, -60],
    [-430, 60],
    [-230, 60],
    [-30, 60],
    [170, 60],
    [370, 60],
  ];
  const prog = Math.min(76, interpolate(f, [a(p.instrAt), a(p.stuckAt)], [40, 76], C));
  const back = P(f, a(p.backAt), 40);
  const sq = P(f, a(p.gordAt), 60);
  return (
    <AbsoluteFill style={{ background: BG9("#0b1016"), overflow: "hidden", fontFamily: MONO }}>
      <Title9 t={f >= a(p.gordAt) ? "INVASÃO · BOREALIS" : "BOREALIS · POR DENTRO"} col={f >= a(p.gordAt) ? AMB : ICE} o={P(f, a(p.planAt), 8)} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {/* casco em corte */}
        <path d={`M ${SX - 700} ${SY + 150} L ${SX + 560} ${SY + 150} L ${SX + 680} ${SY + 20} L ${SX + 600} ${SY - 140} L ${SX - 640} ${SY - 140} Z`} fill="rgba(159,230,255,0.04)" stroke={ICE} strokeWidth={2.5} />
        {rooms.map(([x, y], i) => (
          <rect key={i} x={SX + x} y={SY + y - 50} width={170} height={100} fill="none" stroke="rgba(159,230,255,0.35)" strokeWidth={1.5} />
        ))}
        {/* equipes Combine */}
        {f >= a(p.teamsAt)
          ? rooms.map(([x, y], i) => (
              <g key={"t" + i} opacity={P(f, a(p.teamsAt) + i * 2, 8)}>
                {[0, 1].map((k) => (
                  <circle key={k} cx={SX + x + 60 + k * 40 + Math.sin(f / 20 + i + k) * 8} cy={SY + y + Math.cos(f / 25 + i) * 10} r={7} fill={RED} />
                ))}
              </g>
            ))
          : null}
        {/* instruções de fora */}
        {f >= a(p.instrAt) && f < a(p.backAt)
          ? Array.from({ length: 6 }).map((_, i) => {
              const t = ((f - a(p.instrAt)) / 50 + i / 6) % 1;
              const r = rooms[(i * 3) % rooms.length];
              return <circle key={"i" + i} cx={lerp(1840, SX + r[0] + 85, t)} cy={lerp(160, SY + r[1], t)} r={6} fill={AMB} opacity={1 - t * 0.4} />;
            })
          : null}
        {f >= a(p.instrAt) && f < a(p.backAt) ? <text x={1840} y={140} textAnchor="end" fill={AMB} fontFamily={MONO} fontSize={16} letterSpacing={3}>INSTRUÇÕES · ALYX</text> : null}
        {/* a Alyx volta para dentro */}
        {f >= a(p.backAt) ? (
          <g>
            <circle cx={lerp(1840, SX + 420, back)} cy={lerp(160, SY + 10, back)} r={13} fill={AMB} />
            <circle cx={lerp(1840, SX + 420, back)} cy={lerp(160, SY + 10, back)} r={24} fill="none" stroke={AMB} strokeWidth={2} />
            <text x={lerp(1840, SX + 420, back)} y={lerp(160, SY + 10, back) - 32} textAnchor="middle" fill={AMB} fontFamily={MONO} fontSize={15} letterSpacing={3}>ALYX</text>
          </g>
        ) : null}
        {/* o esquadrão do Gordon */}
        {f >= a(p.gordAt)
          ? [0, 1, 2, 3, 4].map((k) => <circle key={"g" + k} cx={SX - 600 + 160 * sq + k * 26} cy={lerp(SY + 320, SY + 120, sq)} r={k ? 8 : 11} fill={k ? GREEN : AMB} opacity={P(f, a(p.gordAt) + k * 3, 6)} />)
          : null}
        {f >= a(p.gordAt) ? <text x={SX - 600 + 160 * sq} y={lerp(SY + 320, SY + 120, sq) + 40} fill={AMB} fontFamily={MONO} fontSize={15} letterSpacing={3}>GORDON + RESISTÊNCIA</text> : null}
        {/* o gelo e a rota aberta */}
        <line x1={0} x2={1920} y1={SY + 200} y2={SY + 200} stroke="rgba(159,230,255,0.3)" strokeWidth={2} />
        {f >= a(p.routeAt) ? (
          <g opacity={P(f, a(p.routeAt), 10)}>
            <path d={`M 80 ${SY + 400} C 400 ${SY + 330} 700 ${SY + 300} ${SX - 600} ${SY + 210}`} fill="none" stroke={GREEN} strokeWidth={4} strokeDasharray="14 10" strokeDashoffset={-f * 2} />
            <text x={120} y={SY + 450} fill={GREEN} fontFamily={MONO} fontSize={16} letterSpacing={3}>BARNEY · VARGA · ELI · ROTA PELO GELO</text>
          </g>
        ) : null}
      </svg>
      {/* barra do procedimento */}
      {f >= a(p.instrAt) ? (
        <div style={{ position: "absolute", left: 70, top: 110, width: 520, opacity: P(f, a(p.instrAt), 8) }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, letterSpacing: 3, color: VIO }}>
            <span>PROCEDIMENTO · EQUIPES INTERNAS</span>
            <span style={{ color: f >= a(p.stuckAt) ? RED : VIO }}>{f >= a(p.stuckAt) ? "TRAVADO" : `${Math.round(prog)}%`}</span>
          </div>
          <div style={{ height: 12, border: `1px solid ${VIO}`, marginTop: 8, position: "relative" }}>
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${prog}%`, background: f >= a(p.stuckAt) && Math.floor(f / 10) % 2 ? RED : VIO }} />
          </div>
        </div>
      ) : null}
      {f >= a(p.advAt) && f < a(p.gordAt) + 30 ? (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 70, display: "flex", justifyContent: "center", gap: 40, opacity: P(f, a(p.advAt), 8) * (1 - P(f, a(p.gordAt) + 20, 10)) }}>
          <div style={{ padding: "12px 20px", border: `1px solid ${VIO}`, borderRadius: 8, fontSize: 20, letterSpacing: 3, color: VIO, background: "rgba(10,6,14,0.85)" }}>ADVISORS · “SÓ ELA CONDUZ AS PRÓXIMAS ETAPAS”</div>
          {f >= a(p.alyxAt) ? <div style={{ padding: "12px 20px", border: `1px solid ${AMB}`, borderRadius: 8, fontSize: 20, letterSpacing: 3, color: AMB, background: "rgba(14,10,4,0.85)", opacity: flickIn(f, a(p.alyxAt)) }}>ALYX · A OPORTUNIDADE QUE ESPERAVA</div> : null}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------- 10 · 2) a sala que troca de época
// uma sala em perspectiva: alterna entre OCUPAÇÃO COMBINE (vermelha, tropas, painéis) e APERTURE (azulejos brancos, placa
// de teste, anos 70) com glitch; o contador de ano pula. Os saltos ficam mais frequentes.
export const HLEraFlip: React.FC<{ life: number; worseAt?: number; jumpsAt?: number; corrAt?: number; troopAt?: number; apAt?: number }> = (p) => {
  const f = useCurrentFrame();
  const N = 1e9;
  const a = (v?: number) => v ?? N;
  void p.life;
  const period = f >= a(p.jumpsAt) ? 34 : 70;
  const forceAp = f >= a(p.apAt);
  const ph = forceAp ? ((f - a(p.apAt)) % 60 < 44 ? 1 : 0) : f >= a(p.troopAt) ? 0 : Math.floor(f / period) % 2;
  const glitch = (!forceAp && f < a(p.troopAt) && (f % period) < 5) || (forceAp && ((f - a(p.apAt)) % 60 < 4 || ((f - a(p.apAt)) % 60 >= 44 && (f - a(p.apAt)) % 60 < 48)));
  const ap = ph === 1;
  const col = ap ? "#e8eef2" : RED;
  const vp = { x: 960, y: 500 };
  const box = (k: number) => {
    const s = 1 - k * 0.22;
    return { x0: vp.x - 820 * s, x1: vp.x + 820 * s, y0: vp.y - 420 * s, y1: vp.y + 460 * s };
  };
  const jx = glitch ? (rnd(f) - 0.5) * 40 : 0;
  return (
    <AbsoluteFill style={{ background: ap ? "radial-gradient(ellipse at 50% 45%, #1a1e22 0%, #07090b 80%)" : BG9("#140808"), overflow: "hidden", fontFamily: MONO }}>
      <Title9 t={ap ? "SALA C-12 · APERTURE SCIENCE · 1974" : "SALA C-12 · OCUPAÇÃO COMBINE · AGORA"} col={ap ? "#e8eef2" : RED} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, transform: `translateX(${jx}px)` }}>
        {[0, 1, 2, 3].map((k) => {
          const b = box(k);
          return <rect key={k} x={b.x0} y={b.y0} width={b.x1 - b.x0} height={b.y1 - b.y0} fill="none" stroke={col} strokeWidth={2} opacity={0.7 - k * 0.12} />;
        })}
        {[
          [0, 0],
          [1, 0],
          [0, 1],
          [1, 1],
        ].map(([sx, sy], i) => {
          const b0 = box(0);
          const b3 = box(3);
          return <line key={i} x1={sx ? b0.x1 : b0.x0} y1={sy ? b0.y1 : b0.y0} x2={sx ? b3.x1 : b3.x0} y2={sy ? b3.y1 : b3.y0} stroke={col} strokeWidth={2} opacity={0.6} />;
        })}
        {ap ? (
          <g>
            {/* azulejos */}
            {Array.from({ length: 10 }).map((_, i) => (
              <line key={i} x1={box(3).x0 + i * ((box(3).x1 - box(3).x0) / 10)} x2={box(3).x0 + i * ((box(3).x1 - box(3).x0) / 10)} y1={box(3).y0} y2={box(3).y1} stroke="rgba(232,238,242,0.25)" />
            ))}
            {Array.from({ length: 6 }).map((_, i) => (
              <line key={"h" + i} y1={box(3).y0 + i * ((box(3).y1 - box(3).y0) / 6)} y2={box(3).y0 + i * ((box(3).y1 - box(3).y0) / 6)} x1={box(3).x0} x2={box(3).x1} stroke="rgba(232,238,242,0.25)" />
            ))}
            <rect x={vp.x - 120} y={vp.y - 150} width={240} height={160} fill="rgba(232,238,242,0.08)" stroke="#e8eef2" strokeWidth={2} />
            <text x={vp.x} y={vp.y - 90} textAnchor="middle" fill="#e8eef2" fontFamily={MONO} fontSize={40}>07</text>
            <text x={vp.x} y={vp.y - 40} textAnchor="middle" fill="#e8eef2" fontFamily={MONO} fontSize={14} letterSpacing={3}>CÂMARA DE TESTE</text>
          </g>
        ) : (
          <g>
            {[-260, 0, 260].map((dx, i) => (
              <rect key={i} x={vp.x + dx - 50} y={vp.y - 220} width={100} height={170} fill="rgba(255,93,77,0.08)" stroke={RED} strokeWidth={2} />
            ))}
            {f >= a(p.troopAt) || true
              ? Array.from({ length: 6 }).map((_, i) => <circle key={"s" + i} cx={vp.x - 300 + i * 120 + Math.sin(f / 9 + i) * 10} cy={vp.y + 230 + (i % 2) * 40} r={12} fill={RED} />)
              : null}
          </g>
        )}
        {glitch ? <rect x={0} y={rnd(f) * 1000} width={1920} height={30 + rnd(f * 2) * 60} fill={ap ? "rgba(255,93,77,0.3)" : "rgba(232,238,242,0.3)"} /> : null}
      </svg>
      <div style={{ position: "absolute", right: 70, top: 56, fontSize: 48, letterSpacing: 6, color: col }}>{ap ? "1974" : "2026"}</div>
      {f >= a(p.jumpsAt) ? <div style={{ position: "absolute", left: 70, bottom: 60, fontSize: 18, letterSpacing: 4, color: AMB, opacity: P(f, a(p.jumpsAt), 8) }}>{`SALTOS · ${Math.round(interpolate(f, [a(p.jumpsAt), a(p.jumpsAt) + 60], [3, 11], C))} POR MINUTO`}</div> : null}
      {f >= a(p.corrAt) ? <div style={{ position: "absolute", right: 70, bottom: 60, fontSize: 18, letterSpacing: 4, color: CREAM, opacity: P(f, a(p.corrAt), 8) }}>NO MEIO DO COMBATE</div> : null}
      {void p.worseAt}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------- 10 · 3) a sequência alterada
// a sala de controle: o gráfico do procedimento num canto; o console mostra a sequência que a Alyx vai mandar; o cursor
// dela troca UMA linha (diff vermelho), envia; o Advisor executa exatamente aquilo; FALHA; carimbo: DE PROPÓSITO.
export const HLAlteredSeq: React.FC<{ life: number; patAt?: number; advAt?: number; calcAt?: number; execAt?: number; failAt?: number; closeAt?: number; ctrlAt?: number; editAt?: number; sendAt?: number; recvAt?: number; fail2At?: number; purpAt?: number }> = (p) => {
  const f = useCurrentFrame();
  const N = 1e9;
  const a = (v?: number) => v ?? N;
  void p.life;
  const lines = ["FASE 7.2 · ALINHAR NÚCLEO", "CICLO 0.4417 · SINCRONIA", "CAMPO · 88.0 · ABRIR", "CICLO 0.2093 · DESLOCAR", "PONTE · SELAR", "FASE 7.3 · CONFIRMAR"];
  const edited = f >= a(p.editAt);
  const sent = P(f, a(p.sendAt), 30);
  const failed = f >= a(p.fail2At);
  return (
    <AbsoluteFill style={{ background: BG9("#0c0a12"), overflow: "hidden", fontFamily: MONO }}>
      <Title9 t={f >= a(p.ctrlAt) ? "SALA DE CONTROLE · BOREALIS" : "O PADRÃO DAS TRANSMISSÕES"} col={VIO} />
      {/* o padrão (antes da sala) */}
      {f < a(p.ctrlAt) ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 300, display: "flex", justifyContent: "center", gap: 30, opacity: P(f, a(p.patAt), 8) }}>
          {[
            { at: a(p.advAt), k: "ADVISORS AVANÇAM", c: VIO },
            { at: a(p.calcAt), k: "ALYX ENTREGA O CÁLCULO", c: AMB },
            { at: a(p.execAt), k: "ELES EXECUTAM", c: CREAM },
            { at: a(p.failAt), k: "FALHA ANTES DO FIM", c: RED },
          ].map((s, i) =>
            f >= s.at ? (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 30, opacity: flickIn(f, s.at) }}>
                <div style={{ padding: "18px 22px", border: `2px solid ${s.c}`, borderRadius: 10, fontSize: 22, letterSpacing: 3, color: s.c, background: "rgba(8,8,10,0.85)", width: 260, textAlign: "center" }}>{s.k}</div>
                {i < 3 ? <div style={{ fontSize: 30, color: "rgba(255,226,176,0.5)" }}>→</div> : null}
              </div>
            ) : null,
          )}
        </div>
      ) : null}
      {f >= a(p.closeAt) && f < a(p.ctrlAt) ? <div style={{ position: "absolute", left: 0, right: 0, top: 560, textAlign: "center", fontSize: 30, letterSpacing: 6, color: AMB, opacity: P(f, a(p.closeAt), 8) }}>DESSA VEZ, GORDON ESTÁ PERTO</div> : null}
      {/* a sala de controle */}
      {f >= a(p.ctrlAt) ? (
        <>
          <div style={{ position: "absolute", left: 160, top: 170, width: 900, padding: "22px 26px", border: `1px solid ${AMB}`, borderRadius: 10, background: "rgba(10,8,4,0.9)", opacity: P(f, a(p.ctrlAt), 10) }}>
            <div style={{ fontSize: 15, letterSpacing: 5, color: AMB }}>SEQUÊNCIA · OPERADORA: ALYX VANCE</div>
            {lines.map((l, i) => {
              const target = i === 3;
              const txt = target && edited ? "CICLO 0.2096 · DESLOCAR" : l;
              return (
                <div key={i} style={{ display: "flex", gap: 16, fontSize: 24, letterSpacing: 2, marginTop: 12, color: target && edited ? RED : CREAM, background: target && edited ? "rgba(255,93,77,0.12)" : "transparent", padding: "2px 6px" }}>
                  <span style={{ color: "rgba(255,226,176,0.4)" }}>{`0${i + 1}`}</span>
                  <span>{txt}</span>
                  {target && edited ? <span style={{ color: RED, marginLeft: "auto" }}>Δ +0.0003</span> : null}
                </div>
              );
            })}
            {f >= a(p.editAt) - 20 && f < a(p.editAt) ? <div style={{ position: "absolute", left: 120, top: 210, width: 3, height: 30, background: AMB, opacity: Math.floor(f / 5) % 2 }} /> : null}
          </div>
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
            {f >= a(p.sendAt) ? (
              <g>
                <line x1={1060} y1={420} x2={1500} y2={420} stroke={AMB} strokeWidth={2} strokeDasharray="8 8" />
                <circle cx={lerp(1060, 1500, sent)} cy={420} r={10} fill={AMB} />
              </g>
            ) : null}
            {f >= a(p.recvAt) ? (
              <g opacity={P(f, a(p.recvAt), 8)}>
                <path d="M 1600 360 L 1660 470 L 1540 470 Z" fill="rgba(199,155,255,0.2)" stroke={VIO} strokeWidth={3} />
                <text x={1600} y={510} textAnchor="middle" fill={VIO} fontFamily={MONO} fontSize={16} letterSpacing={3}>ADVISOR · EXECUTA</text>
              </g>
            ) : null}
          </svg>
          {failed ? <div style={{ position: "absolute", right: 120, top: 600, width: 460, padding: "14px 18px", border: `2px solid ${RED}`, borderRadius: 8, fontSize: 28, letterSpacing: 4, color: RED, background: "rgba(14,4,4,0.9)", opacity: flickIn(f, a(p.fail2At)) }}>PROCEDIMENTO · FALHOU</div> : null}
          {f >= a(p.purpAt) ? (
            <div style={{ position: "absolute", left: 360, top: 720, padding: "10px 26px", border: `4px solid ${AMB}`, color: AMB, fontSize: 54, letterSpacing: 8, transform: `rotate(-6deg) scale(${1 + (1 - P(f, a(p.purpAt), 6)) * 0.5})`, opacity: P(f, a(p.purpAt), 6) }}>DE PROPÓSITO</div>
          ) : null}
        </>
      ) : null}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------- 10 · 4) eles percebem
// o canal entre a Alyx e os Advisors (linha) parte com um estalo; o triângulo do Advisor gira devagar para ela; o medidor de
// estabilidade sobe (manifestação estável); CONFIANÇA cai a zero; atrás do vidro, a silhueta da maleta do G-Man, parada;
// anéis de telecinese erguem o ponto da Alyx; as tropas apontam (chevrons virando); o rádio do Eli abre.
export const HLCaught: React.FC<{ life: number; seeAt?: number; snapAt?: number; turnAt?: number; stableAt?: number; enoughAt?: number; noFakeAt?: number; glassAt?: number; gmanAt?: number; liftAt?: number; aimAt?: number; radioAt?: number }> = (p) => {
  const f = useCurrentFrame();
  const N = 1e9;
  const a = (v?: number) => v ?? N;
  void p.life;
  const AX = 760;
  const AY = 620;
  const VX = 1180;
  const VY = 560;
  const lift = P(f, a(p.liftAt), 40);
  const ay = AY - 180 * lift + (lift > 0.9 ? Math.sin(f / 10) * 6 : 0);
  const turn = interpolate(f, [a(p.turnAt), a(p.turnAt) + 60], [140, 0], C);
  const snapped = f >= a(p.snapAt);
  return (
    <AbsoluteFill style={{ background: BG9("#0d0a12"), overflow: "hidden", fontFamily: MONO }}>
      <Title9 t="OS ADVISORS PERCEBEM" col={VIO} o={P(f, a(p.seeAt), 8)} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {/* o vidro e a maleta */}
        {f >= a(p.glassAt) ? (
          <g opacity={P(f, a(p.glassAt), 14)}>
            <rect x={1420} y={180} width={400} height={560} fill="rgba(159,230,255,0.04)" stroke="rgba(159,230,255,0.4)" strokeWidth={2} />
            {[0, 1, 2].map((k) => (
              <line key={k} x1={1440 + k * 90} y1={200} x2={1520 + k * 90} y2={720} stroke="rgba(159,230,255,0.08)" strokeWidth={14} />
            ))}
            <text x={1620} y={170} textAnchor="middle" fill="rgba(159,230,255,0.6)" fontFamily={MONO} fontSize={14} letterSpacing={3}>MOTORES · DO OUTRO LADO DO VIDRO</text>
            {f >= a(p.gmanAt) ? (
              <g opacity={P(f, a(p.gmanAt), 20) * (0.6 + 0.4 * Math.sin(f / 30))}>
                <rect x={1585} y={560} width={70} height={52} rx={4} fill="none" stroke={CREAM} strokeWidth={2.5} />
                <path d="M 1605 560 L 1605 548 L 1635 548 L 1635 560" fill="none" stroke={CREAM} strokeWidth={2.5} />
                <line x1={1620} y1={612} x2={1620} y2={680} stroke="rgba(255,226,176,0.3)" strokeWidth={2} strokeDasharray="4 6" />
                <text x={1620} y={705} textAnchor="middle" fill={CREAM} fontFamily={MONO} fontSize={14} letterSpacing={3}>OBSERVANDO</text>
              </g>
            ) : null}
          </g>
        ) : null}
        {/* o canal */}
        {!snapped ? <line x1={AX} y1={AY} x2={VX} y2={VY} stroke={AMB} strokeWidth={3} strokeDasharray="10 8" strokeDashoffset={-f * 2} /> : null}
        {snapped && f < a(p.snapAt) + 20 ? (
          <g opacity={1 - (f - a(p.snapAt)) / 20}>
            <line x1={AX} y1={AY} x2={(AX + VX) / 2 - 20} y2={(AY + VY) / 2 + 30} stroke={RED} strokeWidth={3} />
            <line x1={(AX + VX) / 2 + 20} y1={(AY + VY) / 2 - 30} x2={VX} y2={VY} stroke={RED} strokeWidth={3} />
            <circle cx={(AX + VX) / 2} cy={(AY + VY) / 2} r={(f - a(p.snapAt)) * 4} fill="none" stroke={RED} strokeWidth={3} />
          </g>
        ) : null}
        {/* o Advisor */}
        <g transform={`translate(${VX} ${VY}) rotate(${turn})`}>
          <path d="M 0 -50 L 44 36 L -44 36 Z" fill="rgba(199,155,255,0.2)" stroke={VIO} strokeWidth={3} />
          <line x1={0} y1={-50} x2={0} y2={-90} stroke={VIO} strokeWidth={3} />
        </g>
        <text x={VX} y={VY + 80} textAnchor="middle" fill={VIO} fontFamily={MONO} fontSize={15} letterSpacing={3}>ADVISOR</text>
        {/* telecinese */}
        {f >= a(p.liftAt) ? [0, 1, 2].map((k) => <circle key={k} cx={AX} cy={ay} r={30 + ((f - a(p.liftAt) + k * 12) % 36) * 2} fill="none" stroke={VIO} strokeWidth={2} opacity={1 - (((f - a(p.liftAt) + k * 12) % 36) / 36)} />) : null}
        {f >= a(p.liftAt) ? <path d={`M ${VX - 30} ${VY} C ${VX - 200} ${VY - 120} ${AX + 160} ${ay - 60} ${AX + 20} ${ay}`} fill="none" stroke={VIO} strokeWidth={2} strokeDasharray="4 6" opacity={0.7} /> : null}
        <circle cx={AX} cy={ay} r={14} fill={AMB} />
        <text x={AX} y={ay - 30} textAnchor="middle" fill={AMB} fontFamily={MONO} fontSize={15} letterSpacing={3}>ALYX</text>
        {/* tropas */}
        {f >= a(p.aimAt)
          ? Array.from({ length: 6 }).map((_, i) => {
              const ang = Math.PI * 0.15 + (i / 5) * Math.PI * 0.7;
              const x = AX + Math.cos(ang) * 330;
              const y = AY + 120 + Math.sin(ang) * 140;
              return <Chev key={i} x={x} y={y} a={(Math.atan2(ay - y, AX - x) * 180) / Math.PI} n={2} o={P(f, a(p.aimAt) + i * 3, 6)} />;
            })
          : null}
      </svg>
      {/* medidores */}
      <div style={{ position: "absolute", left: 70, top: 120, width: 460 }}>
        {f >= a(p.stableAt) ? (
          <div style={{ opacity: P(f, a(p.stableAt), 8) }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, letterSpacing: 3, color: ICE }}>
              <span>MANIFESTAÇÃO · ESTABILIDADE</span>
              <span>{`${Math.round(interpolate(f, [a(p.stableAt), a(p.stableAt) + 40], [60, 92], C))}%`}</span>
            </div>
            <div style={{ height: 10, border: `1px solid ${ICE}`, marginTop: 6, position: "relative" }}>
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${interpolate(f, [a(p.stableAt), a(p.stableAt) + 40], [60, 92], C)}%`, background: ICE }} />
            </div>
          </div>
        ) : null}
        {f >= a(p.enoughAt) ? <div style={{ fontSize: 16, letterSpacing: 3, color: VIO, marginTop: 14, opacity: P(f, a(p.enoughAt), 8) }}>PROCEDIMENTO · AVANÇADO O SUFICIENTE</div> : null}
        {f >= a(p.noFakeAt) ? (
          <div style={{ marginTop: 14, opacity: P(f, a(p.noFakeAt), 8) }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, letterSpacing: 3, color: RED }}>
              <span>CONFIANÇA NA ALYX</span>
              <span>{`${Math.round(interpolate(f, [a(p.noFakeAt), a(p.noFakeAt) + 30], [80, 0], C))}%`}</span>
            </div>
            <div style={{ height: 10, border: `1px solid ${RED}`, marginTop: 6, position: "relative" }}>
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${interpolate(f, [a(p.noFakeAt), a(p.noFakeAt) + 30], [80, 0], C)}%`, background: RED }} />
            </div>
          </div>
        ) : null}
      </div>
      {f >= a(p.radioAt) ? (
        <div style={{ position: "absolute", left: 70, bottom: 60, width: 560, padding: "12px 16px", border: `1px solid ${GREEN}`, borderRadius: 8, background: "rgba(4,14,8,0.88)", opacity: P(f, a(p.radioAt), 8) }}>
          <div style={{ fontSize: 15, letterSpacing: 4, color: GREEN }}>RÁDIO · ELI VANCE · CANAL ABERTO</div>
          <VoiceStrip f={f} w={520} h={50} amp={0.6} col={GREEN} seed={9} />
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------- 10 · 5) o pedido do Eli
// o rádio do Eli ocupa a tela (clipe real do EP2 num quadro); três perguntas piscam (AJUDANDO? ENGANANDO? AINDA ESTÁ ALI?);
// todas se apagam e fica uma linha: AINDA É A FILHA DELE.
export const HLEliPlea: React.FC<{ life: number; pleaAt?: number; lostAt?: number; helpAt?: number; foolAt?: number; stillAt?: number; daughterAt?: number }> = (p) => {
  const f = useCurrentFrame();
  const N = 1e9;
  const a = (v?: number) => v ?? N;
  void p.life;
  const qs = [
    { at: a(p.helpAt), k: "AJUDANDO OS COMBINE?" },
    { at: a(p.foolAt), k: "ENGANANDO ELES?" },
    { at: a(p.stillAt), k: "AINDA EXISTE ALGO DELA ALI?" },
  ];
  const fade = P(f, a(p.daughterAt), 14);
  return (
    <AbsoluteFill style={{ background: BG9("#08120c"), overflow: "hidden", fontFamily: MONO }}>
      <Title9 t="RÁDIO · ELI VANCE" col={GREEN} />
      <div style={{ position: "absolute", left: 120, top: 150, width: 720, height: 405, border: `2px solid ${GREEN}`, borderRadius: 10, overflow: "hidden", opacity: P(f, 0, 12) }}>
        <Sequence from={0} premountFor={30}>
          <div style={{ position: "absolute", inset: 0, filter: "brightness(1.6) saturate(0.7)" }}>
            <Clip src="videos/hl3_M01_1A2/clips/ep2_eli.mp4" from={2} rate={0.6} />
          </div>
        </Sequence>
        <div style={{ position: "absolute", left: 10, bottom: 8, fontSize: 13, letterSpacing: 3, color: CREAM, textShadow: "0 2px 6px #000" }}>REF · EPISODE TWO</div>
      </div>
      <div style={{ position: "absolute", left: 120, top: 590, width: 720 }}>
        <VoiceStrip f={f} w={720} h={90} amp={f >= a(p.pleaAt) ? 0.8 : 0.3} col={GREEN} seed={4} />
        {f >= a(p.pleaAt) ? <div style={{ fontSize: 30, letterSpacing: 5, color: CREAM, marginTop: 10, opacity: flickIn(f, a(p.pleaAt)) }}>“SALVA A ALYX, GORDON”</div> : null}
      </div>
      <div style={{ position: "absolute", left: 960, top: 200, width: 860 }}>
        {f >= a(p.lostAt) ? <div style={{ fontSize: 18, letterSpacing: 5, color: GREEN, opacity: P(f, a(p.lostAt), 8) * (1 - fade) }}>ELE NÃO ENTENDE MAIS O QUE ESTÁ ACONTECENDO</div> : null}
        {qs.map((q, i) =>
          f >= q.at ? (
            <div key={i} style={{ fontSize: 38, letterSpacing: 4, color: CREAM, marginTop: 26, opacity: flickIn(f, q.at) * (1 - fade * 0.8), textDecoration: fade > 0.5 ? "line-through" : "none" }}>
              {q.k}
            </div>
          ) : null,
        )}
        {f >= a(p.daughterAt) ? <div style={{ fontSize: 52, letterSpacing: 6, color: AMB, marginTop: 50, opacity: fade }}>AINDA É A FILHA DELE</div> : null}
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------- 10 · 6) a luta contra os Advisors
// arena vista de cima: coberturas (blocos) e dois Advisors; linhas de telecinese arrancam blocos das paredes, arremessam,
// prendem o ponto do Gordon contra a parede (flash); a gravity gun devolve um destroço (feixe âmbar) e acerta; o medidor
// CONTROLE do Advisor cai e abre uma janela de ataque.
export const HLAdvisorFight: React.FC<{ life: number; playAt?: number; cmdAt?: number; enemAt?: number; advAt?: number; notScrAt?: number; fightAt?: number; ripAt?: number; pinAt?: number; throwAt?: number; coverAt?: number; ggAt?: number; backAt?: number; spaceAt?: number; ctrlAt?: number }> = (p) => {
  const f = useCurrentFrame();
  const N = 1e9;
  const a = (v?: number) => v ?? N;
  void p.life;
  const blocks = Array.from({ length: 10 }).map((_, i) => ({ x: 360 + (i % 5) * 300, y: i < 5 ? 330 : 760 }));
  const adv = [
    { x: 1380, y: 520 },
    { x: 560, y: 540 },
  ];
  const G = { x: 960, y: 560 };
  const pinned = f >= a(p.pinAt) && f < a(p.pinAt) + 40;
  const gx = pinned ? lerp(G.x, 960, P(f, a(p.pinAt), 10)) : G.x + Math.sin(f / 16) * 40;
  const gy = pinned ? lerp(G.y, 300, P(f, a(p.pinAt), 10)) : G.y + Math.cos(f / 20) * 30;
  const ctrl = f >= a(p.backAt) ? Math.max(15, 100 - (f - a(p.backAt)) * 1.4) : 100;
  return (
    <AbsoluteFill style={{ background: BG9("#0e0a12"), overflow: "hidden", fontFamily: MONO }}>
      <Title9 t={f >= a(p.ggAt) ? "GRAVITY GUN · CONTRA ELES" : f >= a(p.fightAt) ? "ELES ESTÃO LUTANDO" : "CENTRO DE COMANDO · CAMINHO"} col={f >= a(p.ggAt) ? AMB : VIO} o={P(f, a(p.playAt), 8)} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <rect x={200} y={200} width={1520} height={720} fill="none" stroke="rgba(199,155,255,0.35)" strokeWidth={3} />
        {/* blocos / coberturas */}
        {blocks.map((b, i) => {
          const ripped = f >= a(p.ripAt) + i * 8 && i % 2 === 0 && f >= a(p.ripAt);
          const thrown = f >= a(p.throwAt) && i % 4 === 0;
          const t = thrown ? Math.min(1, (f - a(p.throwAt) - i * 2) / 30) : 0;
          const lifted = ripped ? Math.min(1, (f - a(p.ripAt) - i * 8) / 20) : 0;
          const x = thrown ? lerp(b.x, gx, Math.max(0, t)) : b.x + Math.sin(f / 4 + i) * 4 * lifted;
          const y = thrown ? lerp(b.y - 40 * lifted, gy, Math.max(0, t)) : b.y - 40 * lifted;
          const gone = f >= a(p.coverAt) && i % 3 === 1 ? P(f, a(p.coverAt) + i * 4, 12) : 0;
          return <rect key={i} x={x - 50} y={y - 30} width={100} height={60} fill="rgba(255,226,176,0.06)" stroke={lifted > 0 ? VIO : CREAM} strokeWidth={2} opacity={1 - gone} transform={gone ? `rotate(${gone * 60} ${x} ${y})` : undefined} />;
        })}
        {/* advisors */}
        {f >= a(p.advAt)
          ? adv.map((v, i) => (
              <g key={i} opacity={P(f, a(p.advAt) + i * 6, 8)}>
                <path d={`M ${v.x} ${v.y - 40} L ${v.x + 36} ${v.y + 30} L ${v.x - 36} ${v.y + 30} Z`} fill="rgba(199,155,255,0.22)" stroke={VIO} strokeWidth={3} />
                {f >= a(p.ripAt) ? <line x1={v.x} y1={v.y} x2={blocks[i * 2].x} y2={blocks[i * 2].y - 40} stroke={VIO} strokeWidth={2} strokeDasharray="4 6" opacity={0.6 + 0.4 * Math.sin(f / 3)} /> : null}
              </g>
            ))
          : null}
        {/* soldados e hunters (contatos) */}
        {f >= a(p.enemAt) && f < a(p.advAt) + 30
          ? Array.from({ length: 5 }).map((_, i) => <Chev key={i} x={1500 - i * 60} y={260 + i * 120} a={180} n={2} o={P(f, a(p.enemAt) + i * 3, 6) * (1 - P(f, a(p.advAt) + 20, 10))} />)
          : null}
        {/* Gordon */}
        <circle cx={gx} cy={gy} r={14} fill={AMB} />
        {pinned ? <circle cx={gx} cy={gy} r={30 + (f - a(p.pinAt)) * 2} fill="none" stroke={RED} strokeWidth={3} opacity={1 - (f - a(p.pinAt)) / 40} /> : null}
        {pinned ? <text x={gx} y={gy - 34} textAnchor="middle" fill={RED} fontFamily={MONO} fontSize={16} letterSpacing={3}>PRESO NA PAREDE</text> : null}
        {/* gravity gun: devolve destroço */}
        {f >= a(p.backAt) && f < a(p.backAt) + 30
          ? (() => {
              const t = (f - a(p.backAt)) / 30;
              return (
                <g>
                  <line x1={gx} y1={gy} x2={lerp(gx, adv[0].x, t)} y2={lerp(gy, adv[0].y, t)} stroke="#ffcf5a" strokeWidth={4} opacity={0.8} />
                  <rect x={lerp(gx, adv[0].x, t) - 30} y={lerp(gy, adv[0].y, t) - 20} width={60} height={40} fill="rgba(255,207,90,0.3)" stroke="#ffcf5a" strokeWidth={2} transform={`rotate(${t * 300} ${lerp(gx, adv[0].x, t)} ${lerp(gy, adv[0].y, t)})`} />
                </g>
              );
            })()
          : null}
        {f >= a(p.backAt) + 30 && f < a(p.backAt) + 50 ? <circle cx={adv[0].x} cy={adv[0].y} r={(f - a(p.backAt) - 30) * 6} fill="none" stroke="#ffcf5a" strokeWidth={4} /> : null}
      </svg>
      {f >= a(p.notScrAt) && f < a(p.ggAt) ? <div style={{ position: "absolute", left: 0, right: 0, bottom: 60, textAlign: "center", fontSize: 22, letterSpacing: 5, color: VIO, opacity: P(f, a(p.notScrAt), 8) }}>NÃO É MAIS UMA SEQUÊNCIA ROTEIRIZADA</div> : null}
      {f >= a(p.backAt) ? (
        <div style={{ position: "absolute", right: 80, top: 110, width: 420, opacity: P(f, a(p.backAt), 8) }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, letterSpacing: 3, color: VIO }}>
            <span>ADVISOR · CONTROLE</span>
            <span>{`${Math.round(ctrl)}%`}</span>
          </div>
          <div style={{ height: 12, border: `1px solid ${VIO}`, marginTop: 6, position: "relative" }}>
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${ctrl}%`, background: VIO }} />
          </div>
          {f >= a(p.ctrlAt) ? <div style={{ fontSize: 20, letterSpacing: 4, color: AMB, marginTop: 12, opacity: flickIn(f, a(p.ctrlAt)) }}>JANELA · ELE PERDEU O CONTROLE</div> : null}
        </div>
      ) : null}
      {void p.cmdAt}
      {void p.spaceAt}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------- 10 · 7) a mão estendida
// a Alyx suspensa (anéis); o Advisor que a segura cai (X); ela desce; um prompt de jogo "[E] ESTENDER A MÃO" com anel de
// segurar que enche devagar (a hesitação dela) até ACEITO. Depois: POUCOS MINUTOS (relógio), a corrida do procedimento
// contra a distância até o núcleo, e os dois pontos correndo juntos: LADO A LADO.
export const HLHandOffer: React.FC<{ life: number; reachAt?: number; downAt?: number; fallAt?: number; handAt?: number; lookAt?: number; acceptAt?: number; noSorryAt?: number; minAt?: number; knowAt?: number; endAt?: number; gunAt?: number; runAt?: number; sideAt?: number }> = (p) => {
  const f = useCurrentFrame();
  const N = 1e9;
  const a = (v?: number) => v ?? N;
  void p.life;
  const fall = P(f, a(p.fallAt), 14);
  const ay = lerp(380, 640, fall);
  const hold = f >= a(p.handAt) ? Math.min(1, (f - a(p.handAt)) / Math.max(10, a(p.acceptAt) - a(p.handAt))) : 0;
  const run = f >= a(p.runAt);
  const ph2 = P(f, a(p.knowAt), 14);
  return (
    <AbsoluteFill style={{ background: BG9("#0c0a10"), overflow: "hidden", fontFamily: MONO }}>
      <Title9 t={run ? "LADO A LADO" : "ALYX"} col={AMB} o={P(f, a(p.reachAt), 8)} />
      {ph2 < 1 ? (
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: 1 - ph2 }}>
          {/* o Advisor */}
          <g opacity={1 - P(f, a(p.downAt) + 10, 20)} transform={`translate(1240 ${lerp(360, 760, P(f, a(p.downAt), 24))}) rotate(${P(f, a(p.downAt), 24) * 120})`}>
            <path d="M 0 -50 L 44 36 L -44 36 Z" fill="rgba(199,155,255,0.2)" stroke={VIO} strokeWidth={3} />
          </g>
          {f >= a(p.downAt) && f < a(p.downAt) + 30 ? (
            <g transform="translate(1240 360)" opacity={1 - (f - a(p.downAt)) / 30}>
              <line x1={-40} y1={-40} x2={40} y2={40} stroke={AMB} strokeWidth={6} />
              <line x1={40} y1={-40} x2={-40} y2={40} stroke={AMB} strokeWidth={6} />
            </g>
          ) : null}
          {/* Alyx suspensa → no chão */}
          {fall < 1 ? [0, 1, 2].map((k) => <circle key={k} cx={760} cy={ay} r={30 + ((f + k * 12) % 36) * 2} fill="none" stroke={VIO} strokeWidth={2} opacity={(1 - fall) * (1 - ((f + k * 12) % 36) / 36)} />) : null}
          <circle cx={760} cy={ay} r={16} fill={AMB} />
          <text x={760} y={ay - 34} textAnchor="middle" fill={AMB} fontFamily={MONO} fontSize={16} letterSpacing={3}>ALYX</text>
          {/* Gordon */}
          {f >= a(p.handAt) ? (
            <g>
              <circle cx={1000} cy={640} r={16} fill={CREAM} />
              <text x={1000} y={606} textAnchor="middle" fill={CREAM} fontFamily={MONO} fontSize={16} letterSpacing={3}>GORDON</text>
              <line x1={984} y1={640} x2={lerp(984, 800, P(f, a(p.handAt), 12))} y2={640} stroke={CREAM} strokeWidth={3} strokeDasharray="6 6" />
            </g>
          ) : null}
        </svg>
      ) : null}
      {/* o prompt */}
      {f >= a(p.handAt) && ph2 < 1 ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 760, display: "flex", justifyContent: "center", opacity: P(f, a(p.handAt), 8) * (1 - ph2) }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18, padding: "14px 24px", border: `1px solid ${CREAM}`, borderRadius: 10, background: "rgba(8,8,8,0.85)" }}>
            <svg width={60} height={60}>
              <circle cx={30} cy={30} r={24} fill="none" stroke="rgba(255,226,176,0.25)" strokeWidth={5} />
              <circle cx={30} cy={30} r={24} fill="none" stroke={f >= a(p.acceptAt) ? GREEN : AMB} strokeWidth={5} strokeDasharray={`${hold * 151} 151`} transform="rotate(-90 30 30)" />
              <text x={30} y={37} textAnchor="middle" fill={CREAM} fontFamily={MONO} fontSize={20}>E</text>
            </svg>
            <div style={{ fontSize: 26, letterSpacing: 4, color: f >= a(p.acceptAt) ? GREEN : CREAM }}>{f >= a(p.acceptAt) ? "ACEITO" : f >= a(p.lookAt) ? "ELA OLHA PARA A MÃO…" : "ESTENDER A MÃO"}</div>
          </div>
        </div>
      ) : null}
      {f >= a(p.noSorryAt) && ph2 < 1 ? (
        <div style={{ position: "absolute", right: 90, top: 150, width: 440, opacity: P(f, a(p.noSorryAt), 8) * (1 - ph2) }}>
          <div style={{ fontSize: 22, letterSpacing: 3, color: "rgba(255,226,176,0.45)", textDecoration: "line-through" }}>DESCULPAS</div>
          <div style={{ fontSize: 22, letterSpacing: 3, color: "rgba(255,226,176,0.45)", textDecoration: "line-through", marginTop: 8 }}>EXPLICAÇÕES</div>
          {f >= a(p.minAt) ? <div style={{ fontSize: 30, letterSpacing: 4, color: RED, marginTop: 16, opacity: flickIn(f, a(p.minAt)) }}>“TEMOS POUCOS MINUTOS”</div> : null}
        </div>
      ) : null}
      {/* fase 2: a corrida */}
      {ph2 > 0 ? (
        <div style={{ position: "absolute", inset: 0, opacity: ph2 }}>
          <div style={{ position: "absolute", left: 260, right: 260, top: 230 }}>
            {[
              { k: "ADVISORS · PROCEDIMENTO SOZINHOS", v: Math.min(96, 70 + Math.max(0, f - a(p.knowAt)) * 0.12), c: VIO },
              { k: "GORDON + ALYX · ATÉ O NÚCLEO", v: Math.min(90, 20 + Math.max(0, f - a(p.runAt)) * 0.25), c: AMB },
            ].map((r, i) => (
              <div key={i} style={{ marginTop: i ? 26 : 0 }}>
                <div style={{ fontSize: 20, letterSpacing: 4, color: r.c }}>{r.k}</div>
                <div style={{ height: 16, border: `1px solid ${r.c}`, marginTop: 8, position: "relative" }}>
                  <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${r.v}%`, background: r.c }} />
                </div>
              </div>
            ))}
            {f >= a(p.endAt) ? <div style={{ fontSize: 26, letterSpacing: 5, color: RED, marginTop: 30, opacity: flickIn(f, a(p.endAt)), textAlign: "center" }}>SE ELES TERMINAREM PRIMEIRO, TUDO ACABA</div> : null}
          </div>
          {run ? (
            <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
              {Array.from({ length: 16 }).map((_, i) => {
                const x = ((i * 140 - (f - a(p.runAt)) * 9) % 2100 + 2100) % 2100 - 90;
                return <line key={i} x1={x} x2={x + 80} y1={760 + (i % 3) * 30} y2={760 + (i % 3) * 30} stroke="rgba(255,226,176,0.2)" strokeWidth={2} />;
              })}
              <circle cx={900} cy={780 + Math.sin(f / 3) * 4} r={16} fill={CREAM} />
              <circle cx={980} cy={790 + Math.cos(f / 3) * 4} r={16} fill={AMB} />
              {f >= a(p.gunAt) ? <line x1={996} y1={790} x2={1030} y2={784} stroke={AMB} strokeWidth={4} /> : null}
              {f >= a(p.sideAt) ? <text x={940} y={870} textAnchor="middle" fill={AMB} fontFamily={MONO} fontSize={24} letterSpacing={6} opacity={P(f, a(p.sideAt), 8)}>PRIMEIRA VEZ DESDE O GRANDE SALTO</text> : null}
            </svg>
          ) : null}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------- 10 · 8) a agente
// o anel de identidade da Alyx; o G-Man (a maleta) deposita uma semente violeta lá dentro; a semente fica dormente (pulso
// lento) com o rótulo "DESPERTAR NO MOMENTO CERTO".
export const HLAgentInside: React.FC<{ life: number; talkAt?: number; notJustAt?: number; leftAt?: number; partAt?: number }> = (p) => {
  const f = useCurrentFrame();
  const N = 1e9;
  const a = (v?: number) => v ?? N;
  void p.life;
  const drop = P(f, a(p.leftAt), 40);
  return (
    <AbsoluteFill style={{ background: BG9("#0c0a12"), overflow: "hidden", fontFamily: MONO }}>
      <Title9 t="ALYX · DURANTE A CORRIDA" col={AMB} o={P(f, a(p.talkAt), 8)} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {[200, 150, 100].map((r, k) => (
          <circle key={k} cx={960} cy={560} r={r + 4 * Math.sin(f / 10 + k)} fill={k === 2 ? "rgba(255,178,46,0.06)" : "none"} stroke={AMB} strokeWidth={k === 0 ? 3 : 1.5} opacity={0.8 - k * 0.2} />
        ))}
        <text x={960} y={330} textAnchor="middle" fill={AMB} fontFamily={MONO} fontSize={18} letterSpacing={5}>ALYX VANCE</text>
        {/* memórias levadas (fragmentos saindo) */}
        {f >= a(p.notJustAt)
          ? Array.from({ length: 8 }).map((_, i) => {
              const t = Math.min(1, (f - a(p.notJustAt) - i * 3) / 40);
              if (t <= 0) return null;
              const ang = (i / 8) * Math.PI * 2;
              return <circle key={i} cx={960 + Math.cos(ang) * (120 + t * 500)} cy={560 + Math.sin(ang) * (120 + t * 300)} r={8} fill={ICE} opacity={1 - t} />;
            })
          : null}
        {/* a maleta e a semente */}
        {f >= a(p.leftAt) ? (
          <g>
            <g opacity={1 - P(f, a(p.leftAt) + 40, 20)} transform={`translate(${lerp(1500, 1100, drop)} ${lerp(220, 380, drop)})`}>
              <rect x={-36} y={-26} width={72} height={52} rx={4} fill="none" stroke={CREAM} strokeWidth={2.5} />
              <path d="M -14 -26 L -14 -38 L 14 -38 L 14 -26" fill="none" stroke={CREAM} strokeWidth={2.5} />
            </g>
            <circle cx={lerp(1100, 960, P(f, a(p.leftAt) + 20, 30))} cy={lerp(380, 560, P(f, a(p.leftAt) + 20, 30))} r={14 + 4 * Math.sin(f / 14)} fill={VIO} opacity={0.6 + 0.4 * Math.sin(f / 20)} />
          </g>
        ) : null}
        {f >= a(p.partAt) ? (
          <g opacity={P(f, a(p.partAt), 10)}>
            <circle cx={960} cy={560} r={44 + ((f - a(p.partAt)) % 60)} fill="none" stroke={VIO} strokeWidth={2} opacity={1 - ((f - a(p.partAt)) % 60) / 60} />
            <text x={960} y={830} textAnchor="middle" fill={VIO} fontFamily={MONO} fontSize={26} letterSpacing={6}>DORMENTE · DESPERTAR NO MOMENTO CERTO</text>
          </g>
        ) : null}
      </svg>
      {f >= a(p.notJustAt) && f < a(p.leftAt) + 20 ? <div style={{ position: "absolute", left: 0, right: 0, top: 160, textAlign: "center", fontSize: 24, letterSpacing: 5, color: "rgba(159,230,255,0.7)", opacity: P(f, a(p.notJustAt), 8) }}>NÃO SÓ LEVOU AS MEMÓRIAS</div> : null}
      {f >= a(p.leftAt) + 20 ? <div style={{ position: "absolute", left: 0, right: 0, top: 160, textAlign: "center", fontSize: 30, letterSpacing: 6, color: VIO, opacity: P(f, a(p.leftAt) + 20, 8) }}>ELE DEIXOU ALGUMA COISA DENTRO DELA</div> : null}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------- 10 · 9) o bloqueio
// uma parede (bloqueio) entre a Alyx (esquerda) e o que estava guardado (direita); o ritual (verde) bate na parede; a cada
// sintoma (DORES · LAPSOS · IMAGENS · SABERES) uma rachadura; no grande salto a parede estoura e duas coisas atravessam
// juntas: MEMÓRIAS (gelo) e AGENTE (violeta).
export const HLBlockBreak: React.FC<{ life: number; walkAt?: number; backAt?: number; sleepAt?: number; ritAt?: number; painAt?: number; imgAt?: number; knowAt?: number; jumpAt?: number }> = (p) => {
  const f = useCurrentFrame();
  const N = 1e9;
  const a = (v?: number) => v ?? N;
  void p.life;
  const syms = [
    { at: a(p.painAt), k: "DORES", y: 300 },
    { at: a(p.painAt) + 20, k: "LAPSOS", y: 440 },
    { at: a(p.imgAt), k: "IMAGENS", y: 580 },
    { at: a(p.knowAt), k: "SABER SEM SABER DE ONDE", y: 720 },
  ];
  const boom = P(f, a(p.jumpAt), 20);
  return (
    <AbsoluteFill style={{ background: BG9("#0a0c10"), overflow: "hidden", fontFamily: MONO }}>
      <Title9 t="O BLOQUEIO" col={ICE} o={P(f, a(p.walkAt), 8)} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {/* Alyx */}
        <circle cx={420} cy={540} r={30} fill="rgba(255,178,46,0.15)" stroke={AMB} strokeWidth={3} />
        <text x={420} y={600} textAnchor="middle" fill={AMB} fontFamily={MONO} fontSize={16} letterSpacing={3}>ALYX · DEVOLVIDA</text>
        {/* a parede */}
        {boom < 1 ? (
          <g opacity={1 - boom}>
            <rect x={900} y={200} width={60} height={680} fill="rgba(159,230,255,0.08)" stroke={ICE} strokeWidth={3} />
            {syms.map((s, i) => (f >= s.at ? <path key={i} d={`M 900 ${s.y} l 20 14 l -10 18 l 26 12 l -8 22 l 32 6`} fill="none" stroke={RED} strokeWidth={3} opacity={P(f, s.at, 8)} /> : null))}
          </g>
        ) : null}
        {boom > 0
          ? Array.from({ length: 14 }).map((_, i) => (
              <rect key={i} x={900 + (rnd(i) - 0.3) * 400 * boom} y={200 + i * 48 + (rnd(i * 3) - 0.5) * 200 * boom} width={60} height={44} fill="rgba(159,230,255,0.1)" stroke={ICE} strokeWidth={2} opacity={1 - boom} transform={`rotate(${(rnd(i * 7) - 0.5) * 180 * boom} ${930} ${222 + i * 48})`} />
            ))
          : null}
        {/* o que estava guardado */}
        <g opacity={P(f, a(p.sleepAt), 10)}>
          <circle cx={lerp(1380, 520, boom)} cy={lerp(460, 520, boom)} r={26} fill={ICE} opacity={0.4 + 0.6 * boom} />
          <circle cx={lerp(1440, 560, boom)} cy={lerp(640, 570, boom)} r={22} fill={VIO} opacity={0.4 + 0.6 * boom} />
          <text x={lerp(1380, 520, boom)} y={lerp(460, 520, boom) - 40} textAnchor="middle" fill={ICE} fontFamily={MONO} fontSize={16} letterSpacing={3}>MEMÓRIAS</text>
          <text x={lerp(1440, 560, boom)} y={lerp(640, 570, boom) + 50} textAnchor="middle" fill={VIO} fontFamily={MONO} fontSize={16} letterSpacing={3}>{f >= a(p.jumpAt) ? "AGENTE · ATIVA" : "AGENTE · ADORMECIDA"}</text>
        </g>
        {/* o ritual */}
        {f >= a(p.ritAt) && boom < 1
          ? Array.from({ length: 6 }).map((_, i) => {
              const t = ((f - a(p.ritAt)) / 30 + i / 6) % 1;
              return <circle key={"r" + i} cx={lerp(460, 890, t)} cy={300 + i * 90} r={6} fill={GREEN} opacity={1 - t * 0.5} />;
            })
          : null}
        {f >= a(p.ritAt) ? <text x={640} y={250} textAnchor="middle" fill={GREEN} fontFamily={MONO} fontSize={16} letterSpacing={3} opacity={P(f, a(p.ritAt), 8) * (1 - boom)}>RITUAL DOS VORTIGAUNTS</text> : null}
      </svg>
      {syms.map((s, i) => (f >= s.at && boom < 1 ? <div key={i} style={{ position: "absolute", left: 1000, top: s.y - 14, fontSize: 22, letterSpacing: 4, color: RED, opacity: flickIn(f, s.at) }}>{s.k}</div> : null))}
      {f >= a(p.jumpAt) ? <div style={{ position: "absolute", left: 0, right: 0, bottom: 90, textAlign: "center", fontSize: 34, letterSpacing: 8, color: CREAM, opacity: P(f, a(p.jumpAt), 8) }}>O GRANDE SALTO</div> : null}
      {void p.backAt}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------- 10 · 10) as linhas
// várias linhas do tempo (versões da vida dela) que se ramificam; o marcador da Alyx atravessa de uma para outra; cada uma
// termina num rótulo (VENCE · PERDE · PRÓXIMA DOS COMBINE); todas convergem para o mesmo ponto (BOREALIS); o padrão acende;
// os fragmentos de todas as linhas se juntam num núcleo violeta: A AGENTE · MISSÃO; cadeado: BLOQUEADO; a Alyx volta à
// linha original.
export const HLLinesTraversal: React.FC<{ life: number; importAt?: number; tookAt?: number; biggerAt?: number; linearAt?: number; versAt?: number; sawAt?: number; winAt?: number; loseAt?: number; closeAt?: number; notAt?: number; patAt?: number; sameAt?: number; buildAt?: number; missAt?: number; piecesAt?: number; catAt?: number; lockAt?: number; origAt?: number }> = (p) => {
  const f = useCurrentFrame();
  const N = 1e9;
  const a = (v?: number) => v ?? N;
  void p.life;
  const L = 7;
  const X0 = 160;
  const X1 = 1520;
  const CY = 540;
  const conv = { x: 1620, y: CY };
  const lineY = (i: number, x: number) => {
    const t = (x - X0) / (X1 - X0);
    const spread = Math.sin(Math.PI * Math.min(1, t * 1.15)) * (i - (L - 1) / 2) * 90;
    return CY + spread;
  };
  const path = (i: number) => Array.from({ length: 40 }).map((_, k) => {
    const x = X0 + ((X1 - X0) * k) / 39;
    return `${k ? "L" : "M"} ${x} ${lineY(i, x)}`;
  }).join(" ") + ` L ${conv.x} ${conv.y}`;
  const tr = P(f, a(p.versAt), Math.max(60, a(p.notAt) - a(p.versAt)));
  const lane = Math.min(L - 1, Math.floor(tr * L));
  const mx = X0 + (X1 - X0) * (0.25 + ((tr * L) % 1) * 0.6);
  const my = lineY(lane, mx);
  const tags = [
    { i: 0, k: "A HUMANIDADE VENCE", at: a(p.winAt), c: GREEN },
    { i: 6, k: "A HUMANIDADE PERDE", at: a(p.loseAt), c: RED },
    { i: 4, k: "MAIS PRÓXIMA DOS COMBINE", at: a(p.closeAt), c: VIO },
  ];
  const build = P(f, a(p.buildAt), 40);
  const locked = f >= a(p.lockAt);
  return (
    <AbsoluteFill style={{ background: BG9("#0c0a12"), overflow: "hidden", fontFamily: MONO }}>
      <Title9 t={f >= a(p.buildAt) ? "A AGENTE · CONSTRUÍDA" : "O QUE O G-MAN FEZ COM ELA"} col={f >= a(p.buildAt) ? VIO : CREAM} o={P(f, a(p.importAt), 8)} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {/* a linha que ela conhecia */}
        <line x1={X0} x2={X1} y1={CY} y2={CY} stroke={AMB} strokeWidth={3} opacity={P(f, a(p.linearAt), 10) * (f >= a(p.versAt) ? 0.4 : 1)} />
        {f >= a(p.linearAt) && f < a(p.versAt) ? <text x={X0} y={CY - 20} fill={AMB} fontFamily={MONO} fontSize={16} letterSpacing={3}>A EXPERIÊNCIA LINEAR</text> : null}
        {/* as versões */}
        {f >= a(p.versAt)
          ? Array.from({ length: L }).map((_, i) => (
              <path key={i} d={path(i)} fill="none" stroke={f >= a(p.patAt) ? (f >= a(p.sameAt) ? CREAM : ICE) : "rgba(159,230,255,0.45)"} strokeWidth={f >= a(p.patAt) ? 2.5 : 1.8} pathLength={1} strokeDasharray="1" strokeDashoffset={1 - P(f, a(p.versAt) + i * 4, 30)} opacity={1 - build * 0.6} />
            ))
          : null}
        {tags.map((t, k) =>
          f >= t.at ? (
            <text key={k} x={X1 - 140} y={lineY(t.i, X1 - 140) + (t.i < 3 ? -14 : 24)} textAnchor="middle" fill={t.c} fontFamily={MONO} fontSize={16} letterSpacing={3} opacity={flickIn(f, t.at) * (1 - build)}>
              {t.k}
            </text>
          ) : null,
        )}
        {/* a Alyx atravessando */}
        {f >= a(p.versAt) && f < a(p.buildAt) ? <circle cx={mx} cy={my} r={12} fill={AMB} /> : null}
        {/* o mesmo ponto */}
        {f >= a(p.sameAt) ? (
          <g opacity={P(f, a(p.sameAt), 10)}>
            <circle cx={conv.x} cy={conv.y} r={30 + 4 * Math.sin(f / 6)} fill="rgba(255,226,176,0.12)" stroke={CREAM} strokeWidth={3} />
            <text x={conv.x} y={conv.y + 60} textAnchor="middle" fill={CREAM} fontFamily={MONO} fontSize={16} letterSpacing={3}>O MESMO PONTO</text>
          </g>
        ) : null}
        {/* a agente montada com fragmentos de todas */}
        {f >= a(p.buildAt) ? (
          <g>
            {Array.from({ length: 14 }).map((_, i) => {
              const sx = X0 + (rnd(i) * (X1 - X0));
              const sy = lineY(i % L, sx);
              return <circle key={i} cx={lerp(sx, 960, build)} cy={lerp(sy, 540, build)} r={6} fill={VIO} opacity={0.8} />;
            })}
            <circle cx={960} cy={540} r={60 * build + 4 * Math.sin(f / 8)} fill="rgba(199,155,255,0.15)" stroke={VIO} strokeWidth={3} />
          </g>
        ) : null}
        {locked ? (
          <g transform="translate(960 540)" opacity={P(f, a(p.lockAt), 8)}>
            <path d="M -22 -6 L -22 -26 A 22 22 0 0 1 22 -26 L 22 -6" fill="none" stroke={CREAM} strokeWidth={5} />
            <rect x={-34} y={-8} width={68} height={52} rx={8} fill="rgba(0,0,0,0.6)" stroke={CREAM} strokeWidth={3} />
          </g>
        ) : null}
      </svg>
      {f >= a(p.missAt) ? (
        <div style={{ position: "absolute", right: 80, top: 760, width: 560, padding: "16px 20px", border: `1px solid ${VIO}`, borderRadius: 10, background: "rgba(10,6,14,0.9)", opacity: P(f, a(p.missAt), 8) }}>
          <div style={{ fontSize: 15, letterSpacing: 5, color: VIO }}>MISSÃO DA AGENTE</div>
          {f >= a(p.piecesAt) ? <div style={{ fontSize: 22, letterSpacing: 3, color: CREAM, marginTop: 8, opacity: P(f, a(p.piecesAt), 8) }}>LEVAR AS PEÇAS CERTAS ATÉ O BOREALIS</div> : null}
          {f >= a(p.catAt) ? <div style={{ fontSize: 22, letterSpacing: 3, color: AMB, marginTop: 6, opacity: P(f, a(p.catAt), 8) }}>O PROCEDIMENTO ATÉ O CATALISADOR</div> : null}
        </div>
      ) : null}
      {f >= a(p.origAt) ? <div style={{ position: "absolute", left: 80, top: 760, fontSize: 24, letterSpacing: 4, color: AMB, opacity: P(f, a(p.origAt), 8) }}>A ALYX ORIGINAL VOLTOU</div> : null}
      {void p.tookAt}
      {void p.biggerAt}
      {void p.sawAt}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------- 10 · 11) três numa só
// três correntes (ORIGINAL âmbar · AS VIDAS gelo · A AGENTE violeta) convergem num anel: UMA ALYX INTEIRA. Ficha do G-Man:
// ESPERADO: A AGENTE × ACORDOU: A ALYX INTEIRA → ERRO. Depois ela "veste" a agente: lista do que entregou (✓) e o que nunca
// entregou (TUDO ✗).
export const HLThreeConverge: React.FC<{ life: number; funcAt?: number; ritAt?: number; lapsAt?: number; neverAt?: number; jumpAt?: number; threeAt?: number; expAt?: number; wokeAt?: number; errAt?: number; knewAt?: number; roleAt?: number; outAt?: number; warAt?: number; routesAt?: number; calcAt?: number; neverAllAt?: number }> = (p) => {
  const f = useCurrentFrame();
  const N = 1e9;
  const a = (v?: number) => v ?? N;
  void p.life;
  const conv = P(f, a(p.jumpAt), 40);
  const ph2 = P(f, a(p.roleAt), 16);
  const streams = [
    { c: AMB, k: "A ALYX ORIGINAL", y0: 260 },
    { c: ICE, k: "AS VIDAS QUE ELA EXPERIMENTOU", y0: 540 },
    { c: VIO, k: "A AGENTE", y0: 820 },
  ];
  const items = [
    { at: a(p.outAt), k: "SAIU DO BOREALIS COM OS ADVISORS" },
    { at: a(p.warAt), k: "COORDENOU A GUERRA" },
    { at: a(p.routesAt), k: "ENTREGOU ROTAS" },
    { at: a(p.calcAt), k: "PASSOU CÁLCULOS" },
  ];
  return (
    <AbsoluteFill style={{ background: BG9("#0c0a12"), overflow: "hidden", fontFamily: MONO }}>
      <Title9 t={ph2 > 0.5 ? "ELA INTERPRETOU O PAPEL" : "O GATILHO"} col={AMB} o={P(f, a(p.funcAt), 8)} />
      {ph2 < 1 ? (
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: 1 - ph2 }}>
          {streams.map((s, i) =>
            f >= a(p.funcAt) + i * 10 ? (
              <g key={i}>
                <path d={`M 120 ${s.y0} C 600 ${s.y0} ${700 + 200 * (1 - conv)} ${lerp(s.y0, 540, conv)} ${lerp(900, 1180, conv)} ${lerp(s.y0, 540, conv)}`} fill="none" stroke={s.c} strokeWidth={4} opacity={0.85} strokeDasharray={i === 2 && f < a(p.ritAt) ? "6 10" : undefined} />
                <text x={140} y={s.y0 - 16} fill={s.c} fontFamily={MONO} fontSize={18} letterSpacing={3}>{s.k}</text>
              </g>
            ) : null,
          )}
          {f >= a(p.lapsAt) && f < a(p.jumpAt) ? <text x={700} y={420} textAnchor="middle" fill={ICE} fontFamily={MONO} fontSize={16} letterSpacing={3} opacity={P(f, a(p.lapsAt), 8)}>{f >= a(p.neverAt) ? "LEMBRANÇAS DO QUE NUNCA ACONTECEU COM ELA" : "OS LAPSOS"}</text> : null}
          {f >= a(p.threeAt) ? (
            <g opacity={P(f, a(p.threeAt), 10)}>
              <circle cx={1180} cy={540} r={70 + 4 * Math.sin(f / 6)} fill="rgba(255,226,176,0.1)" stroke={CREAM} strokeWidth={4} />
              <text x={1180} y={548} textAnchor="middle" fill={CREAM} fontFamily={MONO} fontSize={16} letterSpacing={3}>UMA PESSOA</text>
            </g>
          ) : null}
        </svg>
      ) : null}
      {f >= a(p.expAt) && ph2 < 1 ? (
        <div style={{ position: "absolute", right: 80, top: 160, width: 460, padding: "16px 20px", border: `1px solid ${CREAM}`, borderRadius: 10, background: "rgba(8,8,8,0.9)", opacity: P(f, a(p.expAt), 8) * (1 - ph2) }}>
          <div style={{ fontSize: 15, letterSpacing: 5, color: CREAM }}>G-MAN · EXPECTATIVA</div>
          <div style={{ fontSize: 22, letterSpacing: 3, color: VIO, marginTop: 10 }}>ESPERADO: A AGENTE</div>
          {f >= a(p.wokeAt) ? <div style={{ fontSize: 22, letterSpacing: 3, color: AMB, marginTop: 6, opacity: flickIn(f, a(p.wokeAt)) }}>ACORDOU: UMA ALYX INTEIRA</div> : null}
          {f >= a(p.errAt) ? <div style={{ fontSize: 34, letterSpacing: 6, color: RED, marginTop: 12, opacity: flickIn(f, a(p.errAt)) }}>O ERRO DELE</div> : null}
        </div>
      ) : null}
      {ph2 > 0 ? (
        <div style={{ position: "absolute", inset: 0, opacity: ph2 }}>
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
            <circle cx={520} cy={540} r={90} fill="rgba(255,178,46,0.08)" stroke={AMB} strokeWidth={3} />
            <circle cx={520} cy={540} r={120} fill="none" stroke={VIO} strokeWidth={6} strokeDasharray="20 12" strokeDashoffset={-f} />
            <text x={520} y={548} textAnchor="middle" fill={AMB} fontFamily={MONO} fontSize={18} letterSpacing={3}>ALYX</text>
            <text x={520} y={700} textAnchor="middle" fill={VIO} fontFamily={MONO} fontSize={16} letterSpacing={3}>“A AGENTE” · O PAPEL</text>
          </svg>
          <div style={{ position: "absolute", left: 860, top: 230, width: 860 }}>
            {f >= a(p.knewAt) ? <div style={{ fontSize: 18, letterSpacing: 4, color: "rgba(255,226,176,0.7)" }}>ELA SABIA O QUE OS ADVISORS E O G-MAN ESPERAVAM</div> : null}
            {items.map((it, i) =>
              f >= it.at ? (
                <div key={i} style={{ fontSize: 28, letterSpacing: 3, color: CREAM, marginTop: 18, opacity: flickIn(f, it.at) }}>
                  {`✓ ${it.k}`}
                </div>
              ) : null,
            )}
            {f >= a(p.neverAllAt) ? <div style={{ fontSize: 40, letterSpacing: 5, color: RED, marginTop: 30, opacity: flickIn(f, a(p.neverAllAt)) }}>✗ NUNCA ENTREGOU TUDO</div> : null}
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------- 10 · 12) o ritmo
// um dial de ritmo (a mão dela) que gira para um lado e para o outro; o gráfico abaixo: a curva dos Combine sempre logo
// atrás da curva do Gordon (nunca passa); quando encosta, um dente (ciclo errado) faz ela recuar. Depois os casos da guerra
// voltam como fichas (tropas recuando · posição abandonada · ELI ✓ nunca atingido) e: MANTER TODO MUNDO VIVO.
export const HLRhythm: React.FC<{ life: number; needAt?: number; equipAt?: number; resAt?: number; advAt?: number; ctrlAt?: number; closeAt?: number; wrongAt?: number; enoughAt?: number; pointAt?: number; warAt?: number; troopsAt?: number; posAt?: number; eliAt?: number; aliveAt?: number; overAt?: number }> = (p) => {
  const f = useCurrentFrame();
  const N = 1e9;
  const a = (v?: number) => v ?? N;
  void p.life;
  const ph2 = P(f, a(p.warAt), 16);
  const t0 = a(p.ctrlAt);
  const X0 = 300;
  const X1 = 1600;
  const Y0 = 900;
  const Y1 = 420;
  const span = 300;
  const gordon = (ff: number) => Math.min(95, 20 + (ff - t0) * 0.25);
  const comb = (ff: number) => {
    const g = gordon(ff);
    const saw = ((ff - t0) % 70) / 70;
    return Math.max(10, g - 4 - saw * 10);
  };
  const ptsG: string[] = [];
  const ptsC: string[] = [];
  for (let ff = t0; ff <= Math.min(f, t0 + span); ff += 3) {
    const x = lerp(X0, X1, (ff - t0) / span);
    ptsG.push(`${x},${lerp(Y0, Y1, gordon(ff) / 100)}`);
    ptsC.push(`${x},${lerp(Y0, Y1, comb(ff) / 100)}`);
  }
  const dial = Math.sin((f - t0) / 18) * 50;
  const needs = [
    { at: a(p.needAt), k: "OS COMBINE" },
    { at: a(p.equipAt), k: "OS EQUIPAMENTOS" },
    { at: a(p.resAt), k: "DÉCADAS DE PESQUISA" },
    { at: a(p.advAt), k: "O PROCEDIMENTO AVANÇANDO" },
  ];
  return (
    <AbsoluteFill style={{ background: BG9("#0d0a12"), overflow: "hidden", fontFamily: MONO }}>
      <Title9 t={ph2 > 0.5 ? "ISSO EXPLICA A GUERRA" : f >= a(p.ctrlAt) ? "ELA CONTROLA O RITMO" : "ELA PRECISAVA DELES"} col={AMB} />
      {f < a(p.ctrlAt) ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 300, display: "flex", justifyContent: "center", gap: 30 }}>
          {needs.map((n, i) =>
            f >= n.at ? (
              <div key={i} style={{ padding: "18px 22px", border: `1px solid ${AMB}`, borderRadius: 10, fontSize: 22, letterSpacing: 3, color: CREAM, background: "rgba(14,10,4,0.85)", opacity: flickIn(f, n.at), width: 300, textAlign: "center" }}>
                {n.k}
              </div>
            ) : null,
          )}
        </div>
      ) : null}
      {f >= a(p.ctrlAt) && ph2 < 1 ? (
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: 1 - ph2 }}>
          {/* o dial */}
          <g transform="translate(960 250)">
            <path d="M -120 0 A 120 120 0 0 1 120 0" fill="none" stroke="rgba(255,226,176,0.3)" strokeWidth={10} />
            <line x1={0} y1={0} x2={Math.sin((dial * Math.PI) / 180) * 110} y2={-Math.cos((dial * Math.PI) / 180) * 110} stroke={AMB} strokeWidth={6} strokeLinecap="round" />
            <circle r={12} fill={AMB} />
            <text x={0} y={40} textAnchor="middle" fill={AMB} fontFamily={MONO} fontSize={16} letterSpacing={4}>RITMO · ALYX</text>
          </g>
          <line x1={X0} x2={X0} y1={Y0} y2={Y1 - 40} stroke="rgba(255,226,176,0.3)" />
          <line x1={X0} x2={X1} y1={Y0} y2={Y0} stroke="rgba(255,226,176,0.3)" />
          <polyline points={ptsG.join(" ")} fill="none" stroke={AMB} strokeWidth={4} />
          <polyline points={ptsC.join(" ")} fill="none" stroke={RED} strokeWidth={3} />
          <text x={X1 + 20} y={lerp(Y0, Y1, gordon(f) / 100)} fill={AMB} fontFamily={MONO} fontSize={16} letterSpacing={3}>GORDON</text>
          <text x={X1 + 20} y={lerp(Y0, Y1, comb(f) / 100) + 24} fill={RED} fontFamily={MONO} fontSize={16} letterSpacing={3}>COMBINE</text>
          {f >= a(p.wrongAt) ? <text x={960} y={Y0 + 50} textAnchor="middle" fill={RED} fontFamily={MONO} fontSize={18} letterSpacing={4} opacity={P(f, a(p.wrongAt), 8)}>CICLO LIGEIRAMENTE ERRADO · REPETIR · RECALIBRAR</text> : null}
          {f >= a(p.pointAt) ? <text x={960} y={Y0 + 90} textAnchor="middle" fill={CREAM} fontFamily={MONO} fontSize={20} letterSpacing={4} opacity={P(f, a(p.pointAt), 8)}>ATÉ O PONTO CERTO · NUNCA ANTES DO GORDON</text> : null}
        </svg>
      ) : null}
      {ph2 > 0 ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 240, display: "flex", justifyContent: "center", gap: 30, opacity: ph2 }}>
          {[
            { at: a(p.troopsAt), k: "TROPAS RECUANDO QUANDO PODIAM VENCER", c: RED },
            { at: a(p.posAt), k: "POSIÇÕES ABANDONADAS NA HORA ERRADA", c: RED },
            { at: a(p.eliAt), k: "ELI NUNCA ATINGIDO", c: GREEN },
          ].map((c, i) =>
            f >= c.at ? (
              <div key={i} style={{ width: 400, padding: "18px 22px", border: `2px solid ${c.c}`, borderRadius: 10, fontSize: 22, letterSpacing: 3, color: CREAM, background: "rgba(8,8,8,0.9)", opacity: flickIn(f, c.at) }}>
                {c.k}
              </div>
            ) : null,
          )}
        </div>
      ) : null}
      {f >= a(p.aliveAt) ? <div style={{ position: "absolute", left: 0, right: 0, top: 560, textAlign: "center", fontSize: 40, letterSpacing: 6, color: GREEN, opacity: P(f, a(p.aliveAt), 8) * (1 - P(f, a(p.overAt), 10)) }}>MANTER TODO MUNDO VIVO</div> : null}
      {f >= a(p.overAt) ? <div style={{ position: "absolute", left: 0, right: 0, top: 560, textAlign: "center", fontSize: 40, letterSpacing: 6, color: RED, opacity: flickIn(f, a(p.overAt)) }}>O DISFARCE ACABOU</div> : null}
      {void p.closeAt}
      {void p.enoughAt}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------- 10 · 13) para o núcleo
// o corredor do navio em perspectiva (ShipCorridor) com os dois correndo; no fim do corredor o núcleo brilha; as duas
// perguntas aparecem uma de cada vez.
export const HLCoreRun: React.FC<{ life: number; timeAt?: number; goAt?: number; sameAt?: number; againAt?: number; qAt?: number; q2At?: number; q3At?: number }> = (p) => {
  const f = useCurrentFrame();
  const N = 1e9;
  const a = (v?: number) => v ?? N;
  void p.life;
  const walk = Math.max(0, f - a(p.goAt)) * 0.35;
  return (
    <AbsoluteFill style={{ background: "#03060a", overflow: "hidden", fontFamily: MONO }}>
      <ShipCorridor f={f} walk={walk} state={0} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <circle cx={960} cy={520} r={30 + 6 * Math.sin(f / 5) + Math.min(60, walk * 0.4)} fill="rgba(141,255,168,0.18)" stroke={GREEN} strokeWidth={3} />
        <text x={960} y={470 - Math.min(60, walk * 0.4)} textAnchor="middle" fill={GREEN} fontFamily={MONO} fontSize={16} letterSpacing={4}>NÚCLEO</text>
        <circle cx={900} cy={880 + Math.sin(f / 3) * 5} r={18} fill={CREAM} />
        <circle cx={1020} cy={880 + Math.cos(f / 3) * 5} r={18} fill={AMB} />
        {f >= a(p.sameAt) ? <text x={960} y={960} textAnchor="middle" fill={AMB} fontFamily={MONO} fontSize={22} letterSpacing={6} opacity={P(f, a(p.sameAt), 8) * (1 - P(f, a(p.qAt), 10))}>{f >= a(p.againAt) ? "DO MESMO LADO · DE NOVO" : "DO MESMO LADO"}</text> : null}
      </svg>
      <Title9 t={f >= a(p.timeAt) ? "POUCO TEMPO · A CAMINHO DO NÚCLEO" : "BOREALIS"} col={AMB} />
      {f >= a(p.qAt) ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 150, textAlign: "center" }}>
          <div style={{ fontSize: 26, letterSpacing: 5, color: "rgba(255,226,176,0.5)", textDecoration: "line-through", opacity: P(f, a(p.qAt), 8) }}>ELA TRAIU A RESISTÊNCIA?</div>
          {f >= a(p.q2At) ? <div style={{ fontSize: 40, letterSpacing: 4, color: CREAM, marginTop: 20, opacity: flickIn(f, a(p.q2At)) }}>O QUE ELA QUER FAZER NO NÚCLEO?</div> : null}
          {f >= a(p.q3At) ? <div style={{ fontSize: 30, letterSpacing: 4, color: AMB, marginTop: 14, opacity: flickIn(f, a(p.q3At)) }}>POR QUE O G-MAN PRECISAVA QUE TUDO CHEGASSE AQUI?</div> : null}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------- 9 · assinatura) a rede Combine
// mapa da Terra (grade) com pontos vermelhos: cada soldado/synth/Advisor é um nó (Advisors maiores); linhas finas formam
// a rede local da Union; a rede pulsa em fase: a ASSINATURA (forma de onda única); hipótese do Magnusson: uma fenda do
// Borealis (anel) que procura a assinatura em vez de um lugar (não aponta para base nem cidade); a matemática do Kleiner
// (✓); a lista do que falta para testar (Borealis · núcleo · sistema estabilizado · catalisador) com cadeado; e a escolha:
// DESTRUIR O BOREALIS × USÁ-LO CONTRA O COMBINE.
export const HLUnionNet: React.FC<{ life: number; baseAt?: number; isoAt?: number; netAt?: number; soldAt?: number; synthAt?: number; advAt?: number; sigAt?: number; hypAt?: number; riftAt?: number; findAt?: number; loadAt?: number; nodesAt?: number; notAt?: number; selfAt?: number; mathAt?: number; existsAt?: number; oneAt?: number; modelAt?: number; cantAt?: number; needAt?: number; possAt?: number; twoAt?: number; destAt?: number; useAt?: number }> = (p) => {
  const f = useCurrentFrame();
  const N = 1e9;
  const a = (v?: number) => v ?? N;
  void p.life;
  const nodes = Array.from({ length: 48 }).map((_, i) => ({ x: 160 + rnd(i * 1.3) * 1600, y: 180 + rnd(i * 2.7) * 680, k: i % 9 === 0 ? 2 : i % 3 === 0 ? 1 : 0 }));
  const pulse = f >= a(p.sigAt) ? 0.5 + 0.5 * Math.sin(f / 6) : 0;
  const ph = f >= a(p.twoAt) ? 3 : f >= a(p.mathAt) ? 2 : 0;
  const rift = P(f, a(p.riftAt), 20);
  return (
    <AbsoluteFill style={{ background: BG9("#100808"), overflow: "hidden", fontFamily: MONO }}>
      <Title9 t={ph === 3 ? "DUAS FORMAS DE TERMINAR A GUERRA" : ph === 2 ? "DR. KLEINER · A MATEMÁTICA" : "BASE COMBINE CAPTURADA · KLEINER E MAGNUSSON"} col={ph === 2 ? GREEN : RED} />
      {ph < 2 ? (
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          {Array.from({ length: 27 }).map((_, i) => (
            <line key={"g" + i} x1={i * 72} x2={i * 72} y1={0} y2={1080} stroke="rgba(255,93,77,0.04)" />
          ))}
          {/* Overworld cortada */}
          {f >= a(p.isoAt) ? (
            <g opacity={P(f, a(p.isoAt), 10)}>
              <line x1={960} y1={20} x2={960} y2={140} stroke="rgba(255,93,77,0.3)" strokeWidth={2} strokeDasharray="6 6" />
              <line x1={940} y1={60} x2={980} y2={100} stroke={RED} strokeWidth={4} />
              <line x1={980} y1={60} x2={940} y2={100} stroke={RED} strokeWidth={4} />
              <text x={1000} y={90} fill={RED} fontFamily={MONO} fontSize={14} letterSpacing={3}>OVERWORLD · SEM CONTATO</text>
            </g>
          ) : null}
          {/* a rede */}
          {f >= a(p.netAt)
            ? nodes.map((n, i) =>
                nodes.slice(i + 1, i + 3).map((m, j) => <line key={i + "-" + j} x1={n.x} y1={n.y} x2={m.x} y2={m.y} stroke={RED} strokeWidth={1} opacity={P(f, a(p.netAt) + i, 10) * (0.25 + 0.4 * pulse)} />),
              )
            : null}
          {nodes.map((n, i) => {
            const at = n.k === 2 ? a(p.advAt) : n.k === 1 ? a(p.synthAt) : a(p.soldAt);
            if (f < at) return null;
            const r = n.k === 2 ? 14 : n.k === 1 ? 8 : 5;
            const found = f >= a(p.nodesAt) && rift > 0;
            return (
              <g key={"n" + i} opacity={P(f, at + (i % 6) * 2, 8)}>
                <circle cx={n.x} cy={n.y} r={r + pulse * (n.k === 2 ? 6 : 2)} fill={n.k === 2 ? VIO : RED} />
                {found && i % 4 === 0 ? <circle cx={n.x} cy={n.y} r={r + 12} fill="none" stroke={AMB} strokeWidth={2} opacity={0.8} /> : null}
              </g>
            );
          })}
          {/* a fenda que procura a assinatura */}
          {rift > 0 ? (
            <g opacity={rift}>
              <ellipse cx={960} cy={540} rx={90 + 10 * Math.sin(f / 7)} ry={40} fill="rgba(159,230,255,0.12)" stroke={ICE} strokeWidth={3} />
              {f >= a(p.findAt)
                ? nodes.filter((_, i) => i % 4 === 0).map((n, i) => <line key={"s" + i} x1={960} y1={540} x2={lerp(960, n.x, P(f, a(p.findAt) + i * 2, 20))} y2={lerp(540, n.y, P(f, a(p.findAt) + i * 2, 20))} stroke={AMB} strokeWidth={1.5} strokeDasharray="4 6" />)
                : null}
              <text x={960} y={610} textAnchor="middle" fill={ICE} fontFamily={MONO} fontSize={15} letterSpacing={3}>FENDA DO BOREALIS · HIPÓTESE</text>
            </g>
          ) : null}
        </svg>
      ) : null}
      {/* legendas da rede */}
      {ph < 2 ? (
        <div style={{ position: "absolute", left: 70, top: 110, display: "flex", gap: 20 }}>
          {[
            { at: a(p.soldAt), k: "SOLDADO = NÓ", c: RED },
            { at: a(p.synthAt), k: "SYNTH = NÓ", c: RED },
            { at: a(p.advAt), k: "ADVISOR = NÓ MAIS FORTE", c: VIO },
          ].map((l, i) =>
            f >= l.at ? (
              <div key={i} style={{ padding: "6px 12px", border: `1px solid ${l.c}`, borderRadius: 6, fontSize: 15, letterSpacing: 3, color: l.c, opacity: flickIn(f, l.at) }}>
                {l.k}
              </div>
            ) : null,
          )}
        </div>
      ) : null}
      {f >= a(p.sigAt) && ph < 2 ? (
        <div style={{ position: "absolute", left: 70, bottom: 60, width: 560, opacity: P(f, a(p.sigAt), 8) }}>
          <div style={{ fontSize: 15, letterSpacing: 4, color: RED }}>REDE LOCAL DA UNION · ASSINATURA COMUM</div>
          <svg width={560} height={60}>
            <polyline points={Array.from({ length: 70 }).map((_, i) => `${i * 8},${30 + Math.sin(i * 0.5 + f * 0.2) * 18 * (0.6 + 0.4 * pulse)}`).join(" ")} fill="none" stroke={RED} strokeWidth={2.5} />
          </svg>
        </div>
      ) : null}
      {f >= a(p.hypAt) && ph < 2 ? (
        <div style={{ position: "absolute", right: 70, bottom: 60, width: 560, padding: "12px 16px", border: `1px solid ${ICE}`, borderRadius: 8, background: "rgba(4,10,14,0.9)", opacity: P(f, a(p.hypAt), 8) }}>
          <div style={{ fontSize: 15, letterSpacing: 4, color: ICE }}>MAGNUSSON · HIPÓTESE</div>
          <div style={{ fontSize: 20, letterSpacing: 2, color: CREAM, marginTop: 6 }}>{f >= a(p.loadAt) ? "CARREGAR A ASSINATURA NO SISTEMA DO BOREALIS" : "UMA FENDA QUE PROCURA UMA ASSINATURA"}</div>
          {f >= a(p.notAt) ? <div style={{ fontSize: 18, letterSpacing: 2, color: "rgba(255,226,176,0.5)", marginTop: 6, textDecoration: "line-through", opacity: P(f, a(p.notAt), 8) }}>NÃO UMA BASE · NÃO UMA CIDADE</div> : null}
          {f >= a(p.selfAt) ? <div style={{ fontSize: 22, letterSpacing: 3, color: AMB, marginTop: 6, opacity: flickIn(f, a(p.selfAt)) }}>OS PRÓPRIOS COMBINE</div> : null}
        </div>
      ) : null}
      {/* a matemática e o que falta */}
      {ph === 2 ? (
        <div style={{ position: "absolute", inset: 0 }}>
          <div style={{ position: "absolute", left: 140, top: 180, width: 760 }}>
            {[
              { at: a(p.existsAt), k: "A ASSINATURA EXISTE" },
              { at: a(p.oneAt), k: "A REDE RESPONDE COMO UMA ESTRUTURA ÚNICA" },
              { at: a(p.modelAt), k: "O PRINCÍPIO PODE FUNCIONAR" },
            ].map((r, i) =>
              f >= r.at ? (
                <div key={i} style={{ fontSize: 28, letterSpacing: 3, color: GREEN, marginTop: 22, opacity: flickIn(f, r.at) }}>
                  {`✓ ${r.k}`}
                </div>
              ) : null,
            )}
            <svg width={760} height={180} style={{ marginTop: 30, opacity: P(f, a(p.mathAt), 10) }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <text key={i} x={10} y={30 + i * 34} fill="rgba(141,255,168,0.6)" fontFamily={MONO} fontSize={20}>
                  {["Σ nᵢ · ψ(t)", "∂S/∂t = −κ ∇²ψ", "‖ψ_Union‖ ≈ 1", "R(φ) → nós", "teste: ———"][i]}
                </text>
              ))}
            </svg>
          </div>
          {f >= a(p.cantAt) ? (
            <div style={{ position: "absolute", right: 100, top: 200, width: 640, padding: "20px 24px", border: `2px solid ${RED}`, borderRadius: 10, background: "rgba(14,4,4,0.9)", opacity: P(f, a(p.cantAt), 8) }}>
              <div style={{ fontSize: 18, letterSpacing: 5, color: RED }}>TESTE · IMPOSSÍVEL AGORA</div>
              {f >= a(p.needAt)
                ? ["ACESSO AO BOREALIS", "O NÚCLEO", "O SISTEMA ESTABILIZADO", "O CATALISADOR FUNCIONANDO"].map((k, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 24, letterSpacing: 3, color: CREAM, marginTop: 14, opacity: P(f, a(p.needAt) + i * 12, 8) }}>
                      <span>{k}</span>
                      <span style={{ color: RED }}>✗</span>
                    </div>
                  ))
                : null}
              {f >= a(p.possAt) ? <div style={{ fontSize: 22, letterSpacing: 4, color: AMB, marginTop: 20, opacity: P(f, a(p.possAt), 8) }}>FICA SÓ COMO UMA POSSIBILIDADE</div> : null}
            </div>
          ) : null}
        </div>
      ) : null}
      {/* a escolha */}
      {ph === 3 ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 330, display: "flex", justifyContent: "center", gap: 60 }}>
          {[
            { at: a(p.destAt), k: "DESTRUIR O BOREALIS", c: RED },
            { at: a(p.useAt), k: "USAR O BOREALIS CONTRA O COMBINE", c: AMB },
          ].map((o, i) =>
            f >= o.at ? (
              <div key={i} style={{ width: 620, padding: "34px 30px", border: `2px solid ${o.c}`, borderRadius: 14, fontSize: 38, letterSpacing: 4, color: o.c, background: "rgba(8,8,8,0.9)", textAlign: "center", opacity: flickIn(f, o.at) }}>
                {o.k}
              </div>
            ) : null,
          )}
        </div>
      ) : null}
      {void p.baseAt}
      {void p.isoAt}
    </AbsoluteFill>
  );
};

// ================================================================================================ MÓDULO 11
// ---------------------------------------------------------------------------------------------- 11 · 1) mais fundo
// o navio em wireframe com a câmera entrando; perto do núcleo tudo desobedece: paredes deslocadas (fora de fase), flashes
// brancos da Aperture, corredores que somem e voltam; no centro, o núcleo amarrado à ferida.
export const HLDeepCore: React.FC<{ life: number; deepAt?: number; rulesAt?: number; phaseAt?: number; apAt?: number; corrAt?: number; coreAt?: number; woundAt?: number }> = (p) => {
  const f = useCurrentFrame();
  const N = 1e9;
  const a = (v?: number) => v ?? N;
  void p.life;
  const dive = P(f, 0, 300);
  const cam: Cam = { fx: 0, fy: 0, yaw: -0.5 + f * 0.003, pitch: 0.36, dist: lerp(140, 85, dive), cx: 960, cy: 560, F: 1000 };
  const phase = f >= a(p.phaseAt);
  const ap = f >= a(p.apAt) && Math.floor(f / 23) % 3 === 0;
  const corrOff = f >= a(p.corrAt) && Math.floor(f / 17) % 2 === 0;
  const [kx, ky] = proj(cam, 0, 0, 3);
  return (
    <AbsoluteFill style={{ background: ap ? "radial-gradient(ellipse at 50% 50%, #1c2024 0%, #06080a 80%)" : BG9("#0a1016"), overflow: "hidden", fontFamily: MONO }}>
      <Title9 t={f >= a(p.coreAt) ? "O NÚCLEO" : "REGIÕES MAIS PROFUNDAS DO BOREALIS"} col={ICE} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <Ship cam={cam} col={ap ? "rgba(232,238,242,0.8)" : "rgba(159,230,255,0.55)"} />
        {phase ? <Ship cam={{ ...cam, cx: 960 + Math.sin(f / 5) * 18, cy: 560 + Math.cos(f / 7) * 10 }} col="rgba(255,93,77,0.35)" /> : null}
        {f >= a(p.corrAt) ? <polyline points={pts(cam, [[-18, 2, 3], [14, 2, 3]])} stroke={corrOff ? "rgba(0,0,0,0)" : GREEN} strokeWidth={5} /> : null}
        {f >= a(p.coreAt) ? (
          <g opacity={P(f, a(p.coreAt), 12)}>
            <circle cx={kx} cy={ky} r={16 + 4 * Math.sin(f / 4)} fill={GREEN} />
            <line x1={kx} y1={ky} x2={kx} y2={1040} stroke={GREEN} strokeWidth={2} strokeDasharray="6 6" />
          </g>
        ) : null}
        {f >= a(p.woundAt) ? (
          <g opacity={P(f, a(p.woundAt), 12)}>
            <path d={`M ${kx} 900 C ${kx + 30} 950 ${kx - 20} 990 ${kx} 1060 C ${kx - 30} 990 ${kx + 20} 950 ${kx} 900 Z`} fill="rgba(141,255,168,0.25)" stroke={GREEN} strokeWidth={2} />
            <text x={kx + 50} y={990} fill={GREEN} fontFamily={MONO} fontSize={18} letterSpacing={4}>A FERIDA</text>
          </g>
        ) : null}
      </svg>
      <div style={{ position: "absolute", right: 70, top: 120, width: 420 }}>
        {[
          { at: a(p.rulesAt), k: "O NAVIO DESOBEDECE AS PRÓPRIAS REGRAS", c: CREAM },
          { at: a(p.phaseAt), k: "PAREDES FORA DE FASE", c: RED },
          { at: a(p.apAt), k: "APERTURE · POR SEGUNDOS", c: "#e8eef2" },
          { at: a(p.corrAt), k: "CORREDORES SOMEM E VOLTAM", c: GREEN },
        ].map((r, i) =>
          f >= r.at ? (
            <div key={i} style={{ fontSize: 18, letterSpacing: 3, color: r.c, marginTop: 12, opacity: flickIn(f, r.at) }}>
              {r.k}
            </div>
          ) : null,
        )}
      </div>
      {void p.deepAt}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------- 11 · 2) o catalisador é um estado
// três anéis (BOREALIS · NÚCLEO · FERIDA) girando em eixos diferentes; ALINHAMENTO em %; "não é uma máquina" risca uma
// caixa; depois setas vermelhas (os Combine) empurram os anéis para a condição; CEDO DEMAIS = NADA na linha do tempo.
const Rings3: React.FC<{ f: number; align: number; cx?: number; cy?: number; s?: number; glow?: number }> = ({ f, align, cx = 960, cy = 540, s = 1, glow = 0 }) => {
  const R = [
    { r: 260, c: ICE, k: "BOREALIS", sp: 0.011 },
    { r: 190, c: GREEN, k: "NÚCLEO", sp: -0.017 },
    { r: 120, c: VIO, k: "FERIDA", sp: 0.023 },
  ];
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`}>
      {R.map((q, i) => {
        const tilt = (1 - align) * (40 + i * 25) * Math.sin(f * q.sp + i);
        const rot = (1 - align) * f * q.sp * 57;
        return (
          <g key={i} transform={`rotate(${rot})`}>
            <ellipse rx={q.r} ry={q.r * Math.max(0.12, Math.cos((tilt * Math.PI) / 180))} fill="none" stroke={q.c} strokeWidth={3 + glow * 3} style={glow ? { filter: `drop-shadow(0 0 ${8 * glow}px ${q.c})` } : undefined} />
            <circle cx={q.r} cy={0} r={8} fill={q.c} />
            <text x={q.r + 16} y={6} fill={q.c} fontFamily={MONO} fontSize={16} letterSpacing={3} transform={`rotate(${-rot} ${q.r + 16} 0)`}>
              {q.k}
            </text>
          </g>
        );
      })}
      {glow > 0 ? <circle r={40 + 20 * glow + 6 * Math.sin(f / 4)} fill={`rgba(255,226,176,${0.2 * glow})`} stroke={CREAM} strokeWidth={2} /> : null}
    </g>
  );
};
export const HLCatalystState: React.FC<{ life: number; explAt?: number; notMachAt?: number; stateAt?: number; threeAt?: number; borAt?: number; coreAt?: number; woundAt?: number; needAt?: number; pushAt?: number; earlyAt?: number; notYetAt?: number; firstAt?: number }> = (p) => {
  const f = useCurrentFrame();
  const N = 1e9;
  const a = (v?: number) => v ?? N;
  void p.life;
  const align = f >= a(p.pushAt) ? Math.min(0.85, 0.3 + (f - a(p.pushAt)) * 0.004) : f >= a(p.threeAt) ? 0.3 : 0;
  return (
    <AbsoluteFill style={{ background: BG9("#0b0b12"), overflow: "hidden", fontFamily: MONO }}>
      <Title9 t={f >= a(p.needAt) ? "POR QUE ELA PRECISAVA DOS COMBINE" : "O CATALISADOR"} col={AMB} o={P(f, a(p.explAt), 8)} />
      {f >= a(p.notMachAt) && f < a(p.stateAt) + 30 ? (
        <div style={{ position: "absolute", left: 120, top: 200, width: 420, padding: "18px 22px", border: "1px solid rgba(255,226,176,0.4)", borderRadius: 10, opacity: P(f, a(p.notMachAt), 8) * (1 - P(f, a(p.stateAt) + 20, 10)) }}>
          <div style={{ fontSize: 26, letterSpacing: 3, color: "rgba(255,226,176,0.6)", textDecoration: f >= a(p.notMachAt) + 20 ? "line-through" : "none" }}>UMA MÁQUINA ESCONDIDA</div>
        </div>
      ) : null}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: P(f, a(p.stateAt), 14) }}>
        <Rings3 f={f} align={align} />
        {f >= a(p.pushAt)
          ? [0, 1, 2, 3].map((k) => {
              const ang = (k / 4) * Math.PI * 2 + f / 60;
              return <Chev key={k} x={960 + Math.cos(ang) * 360} y={540 + Math.sin(ang) * 360} a={(ang * 180) / Math.PI + 180} n={3} o={P(f, a(p.pushAt) + k * 4, 8)} />;
            })
          : null}
      </svg>
      {f >= a(p.stateAt) ? (
        <div style={{ position: "absolute", left: 70, bottom: 80, opacity: P(f, a(p.stateAt), 8) }}>
          <div style={{ fontSize: 18, letterSpacing: 5, color: CREAM }}>UM ESTADO · UM MOMENTO</div>
          <div style={{ fontSize: 40, letterSpacing: 4, color: AMB, marginTop: 6 }}>{`ALINHAMENTO ${Math.round(align * 100)}%`}</div>
        </div>
      ) : null}
      {f >= a(p.earlyAt) ? (
        <div style={{ position: "absolute", right: 70, bottom: 80, width: 520, padding: "14px 18px", border: `1px solid ${RED}`, borderRadius: 8, background: "rgba(14,4,4,0.88)", opacity: P(f, a(p.earlyAt), 8) }}>
          <div style={{ fontSize: 20, letterSpacing: 3, color: CREAM }}>CHEGAR AO NÚCLEO CEDO DEMAIS</div>
          <div style={{ fontSize: 26, letterSpacing: 4, color: RED, marginTop: 6 }}>= NADA</div>
          {f >= a(p.notYetAt) ? <div style={{ fontSize: 18, letterSpacing: 3, color: "rgba(255,226,176,0.7)", marginTop: 6, opacity: P(f, a(p.notYetAt), 8) }}>O MOMENTO AINDA NÃO EXISTIA</div> : null}
          {f >= a(p.firstAt) ? <div style={{ fontSize: 18, letterSpacing: 3, color: RED, marginTop: 6, opacity: P(f, a(p.firstAt), 8) }}>OS COMBINE PRECISAVAM AVANÇAR PRIMEIRO</div> : null}
        </div>
      ) : null}
      {void p.borAt}
      {void p.coreAt}
      {void p.woundAt}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------- 11 · 3) o tabuleiro do tempo
// um tabuleiro: colunas = momentos (ÉPOCAS), linhas = linhas temporais. A maleta do G-Man pega peças (GORDON · ALYX ·
// ADVISORS) e move entre colunas e linhas; a casa central (CATALISADOR) tem uma barreira: a mão dele não entra; as peças se
// juntam em volta e a casa só acende quando uma peça de DENTRO entra.
export const HLTimeBoard: React.FC<{ life: number; askAt?: number; whyAt?: number; diffAt?: number; moveAt?: number; outAt?: number; inAt?: number; wrongAt?: number; alyxAt?: number; linesAt?: number; cantAt?: number; prepAt?: number; allAt?: number; lastAt?: number; needAt?: number }> = (p) => {
  const f = useCurrentFrame();
  const N = 1e9;
  const a = (v?: number) => v ?? N;
  void p.life;
  const COLS = 7;
  const ROWS = 5;
  const X0 = 400;
  const Y0 = 220;
  const S = 120;
  const cell = (c: number, r: number) => ({ x: X0 + c * S + S / 2, y: Y0 + r * S + S / 2 });
  const center = cell(3, 2);
  const pieces = [
    { k: "GORDON", c: CREAM, from: cell(0, 4), to: cell(2, 2), at: a(p.moveAt) },
    { k: "ALYX", c: AMB, from: cell(6, 0), to: cell(4, 2), at: a(p.alyxAt) },
    { k: "ADVISORS", c: VIO, from: cell(6, 4), to: cell(3, 3), at: a(p.prepAt) + 20 },
  ];
  const cant = f >= a(p.cantAt);
  // a maleta acompanha a peça em movimento
  const active = [...pieces].reverse().find((q) => f >= q.at) || null;
  const tA = active ? P(f, active.at, 30) : 0;
  const hand = active ? { x: lerp(active.from.x, active.to.x, tA), y: lerp(active.from.y, active.to.y, tA) - 60 } : { x: 1500, y: 160 };
  const tryIn = f >= a(p.lastAt) ? Math.min(1, (f - a(p.lastAt)) / 30) : 0;
  const hx = cant && f >= a(p.lastAt) ? lerp(hand.x, center.x, Math.min(tryIn, 0.7)) + (tryIn > 0.65 ? Math.sin(f) * 6 : 0) : hand.x;
  const hy = cant && f >= a(p.lastAt) ? lerp(hand.y, center.y - 60, Math.min(tryIn, 0.7)) : hand.y;
  return (
    <AbsoluteFill style={{ background: BG9("#0c0b08"), overflow: "hidden", fontFamily: MONO }}>
      <Title9 t={cant ? "O QUE ELE NÃO CONSEGUE" : f >= a(p.diffAt) ? "O QUE O G-MAN CONSEGUE" : "SE O G-MAN SABIA TANTO…"} col={CREAM} o={P(f, a(p.askAt), 8)} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: P(f, a(p.diffAt) - 20, 14) }}>
        {Array.from({ length: COLS * ROWS }).map((_, i) => {
          const c = i % COLS;
          const r = Math.floor(i / COLS);
          const isC = c === 3 && r === 2;
          return <rect key={i} x={X0 + c * S} y={Y0 + r * S} width={S} height={S} fill={isC ? `rgba(255,178,46,${cant ? 0.1 + 0.05 * Math.sin(f / 6) : 0.05})` : (c + r) % 2 ? "rgba(255,226,176,0.03)" : "rgba(255,226,176,0.07)"} stroke={isC ? AMB : "rgba(255,226,176,0.18)"} strokeWidth={isC ? 3 : 1} />;
        })}
        <text x={X0} y={Y0 - 20} fill="rgba(255,226,176,0.6)" fontFamily={MONO} fontSize={14} letterSpacing={3}>MOMENTOS →</text>
        {f >= a(p.linesAt) ? <text x={X0 - 20} y={Y0 + S * ROWS} fill="rgba(255,226,176,0.6)" fontFamily={MONO} fontSize={14} letterSpacing={3} transform={`rotate(-90 ${X0 - 20} ${Y0 + S * ROWS})`} opacity={P(f, a(p.linesAt), 8)}>LINHAS TEMPORAIS →</text> : null}
        <text x={center.x} y={center.y + 6} textAnchor="middle" fill={AMB} fontFamily={MONO} fontSize={13} letterSpacing={2}>CATALISADOR</text>
        {cant ? <rect x={center.x - S / 2 - 6} y={center.y - S / 2 - 6} width={S + 12} height={S + 12} fill="none" stroke={RED} strokeWidth={3} strokeDasharray="8 6" opacity={0.6 + 0.4 * Math.sin(f / 5)} /> : null}
        {pieces.map((q, i) =>
          f >= q.at ? (
            <g key={i}>
              <circle cx={lerp(q.from.x, q.to.x, P(f, q.at, 30))} cy={lerp(q.from.y, q.to.y, P(f, q.at, 30))} r={26} fill="rgba(0,0,0,0.5)" stroke={q.c} strokeWidth={3} />
              <text x={lerp(q.from.x, q.to.x, P(f, q.at, 30))} y={lerp(q.from.y, q.to.y, P(f, q.at, 30)) + 48} textAnchor="middle" fill={q.c} fontFamily={MONO} fontSize={13} letterSpacing={2}>
                {q.k}
              </text>
            </g>
          ) : null,
        )}
        {/* "tirar de um momento e devolver em outro": rastro da peça da Alyx */}
        {f >= a(p.outAt) ? <path d={`M ${cell(6, 0).x} ${cell(6, 0).y} C ${cell(6, 0).x + 160} ${cell(1, 0).y - 120} ${cell(1, 4).x - 200} ${cell(1, 4).y} ${cell(4, 2).x} ${cell(4, 2).y}`} fill="none" stroke={AMB} strokeWidth={2} strokeDasharray="5 7" opacity={P(f, a(p.outAt), 10) * 0.7} /> : null}
        {/* a maleta */}
        {f >= a(p.diffAt) ? (
          <g transform={`translate(${hx} ${hy})`}>
            <rect x={-30} y={-22} width={60} height={44} rx={4} fill="rgba(0,0,0,0.6)" stroke={CREAM} strokeWidth={2.5} />
            <path d="M -12 -22 L -12 -32 L 12 -32 L 12 -22" fill="none" stroke={CREAM} strokeWidth={2.5} />
          </g>
        ) : null}
        {cant && tryIn > 0.65 ? <text x={center.x} y={center.y - 110} textAnchor="middle" fill={RED} fontFamily={MONO} fontSize={18} letterSpacing={4}>NÃO ENTRA</text> : null}
      </svg>
      <div style={{ position: "absolute", right: 60, top: 200, width: 380 }}>
        {[
          { at: a(p.moveAt), k: "MOVE PEÇAS", c: CREAM },
          { at: a(p.outAt), k: "TIRA DE UM MOMENTO", c: CREAM },
          { at: a(p.inAt), k: "DEVOLVE EM OUTRO", c: CREAM },
          { at: a(p.wrongAt), k: "PEÇA ONDE NÃO DEVERIA ESTAR", c: AMB },
          { at: a(p.linesAt), k: "ENTRE LINHAS TEMPORAIS", c: ICE },
          { at: a(p.cantAt), k: "✗ COMPLETAR O CATALISADOR", c: RED },
          { at: a(p.needAt), k: "PRECISA DE ALGUÉM DE DENTRO", c: GREEN },
        ].map((r, i) =>
          f >= r.at ? (
            <div key={i} style={{ fontSize: 19, letterSpacing: 3, color: r.c, marginTop: 14, opacity: flickIn(f, r.at) }}>
              {r.k}
            </div>
          ) : null,
        )}
      </div>
      {f >= a(p.whyAt) && f < a(p.diffAt) ? <div style={{ position: "absolute", left: 0, right: 0, top: 480, textAlign: "center", fontSize: 40, letterSpacing: 4, color: CREAM, opacity: P(f, a(p.whyAt), 8) }}>…POR QUE ELE NÃO FEZ ACONTECER?</div> : null}
      {void p.allAt}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------- 11 · 4) a escolha precisa existir
// caminhos que vêm de vários lados e se juntam num ponto; ali o caminho se abre em dois (A ESCOLHA). O ponto da Alyx não
// "obedece" (risca OBEDECER), ele leva alguém até o ponto: GARANTIR QUE A ESCOLHA EXISTA.
export const HLChoiceExists: React.FC<{ life: number; undAt?: number; obeyAt?: number; ensureAt?: number; choiceAt?: number }> = (p) => {
  const f = useCurrentFrame();
  const N = 1e9;
  const a = (v?: number) => v ?? N;
  void p.life;
  const PT = { x: 1100, y: 540 };
  const lead = P(f, a(p.ensureAt), 60);
  return (
    <AbsoluteFill style={{ background: BG9("#0c0a10"), overflow: "hidden", fontFamily: MONO }}>
      <Title9 t="O TAMANHO DO QUE ACONTECEU COM ELA" col={AMB} o={P(f, a(p.undAt), 8)} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {[180, 380, 700, 900].map((y, i) => (
          <path key={i} d={`M 120 ${y} C 500 ${y} 800 ${PT.y} ${PT.x} ${PT.y}`} fill="none" stroke="rgba(255,226,176,0.3)" strokeWidth={2} />
        ))}
        {f >= a(p.choiceAt) ? (
          <g opacity={P(f, a(p.choiceAt), 10)}>
            <path d={`M ${PT.x} ${PT.y} C ${PT.x + 200} ${PT.y} ${PT.x + 300} ${PT.y - 200} ${PT.x + 600} ${PT.y - 240}`} fill="none" stroke={RED} strokeWidth={4} />
            <path d={`M ${PT.x} ${PT.y} C ${PT.x + 200} ${PT.y} ${PT.x + 300} ${PT.y + 200} ${PT.x + 600} ${PT.y + 240}`} fill="none" stroke={AMB} strokeWidth={4} />
            <text x={PT.x + 40} y={PT.y - 40} fill={CREAM} fontFamily={MONO} fontSize={26} letterSpacing={6}>A ESCOLHA</text>
          </g>
        ) : null}
        <circle cx={PT.x} cy={PT.y} r={14} fill={CREAM} />
        {/* Alyx levando alguém (Gordon) até o ponto */}
        <circle cx={lerp(240, PT.x - 60, lead)} cy={lerp(700, PT.y + 20, lead)} r={12} fill={AMB} />
        <circle cx={lerp(200, PT.x - 100, lead)} cy={lerp(720, PT.y + 30, lead)} r={12} fill={CREAM} opacity={P(f, a(p.ensureAt), 10)} />
      </svg>
      <div style={{ position: "absolute", left: 120, top: 150 }}>
        {f >= a(p.obeyAt) ? <div style={{ fontSize: 30, letterSpacing: 4, color: "rgba(255,226,176,0.45)", textDecoration: "line-through", opacity: P(f, a(p.obeyAt), 8) }}>PREPARADA PARA OBEDECER O G-MAN</div> : null}
        {f >= a(p.ensureAt) ? <div style={{ fontSize: 34, letterSpacing: 4, color: AMB, marginTop: 14, opacity: P(f, a(p.ensureAt), 8) }}>PREPARADA PARA LEVAR ALGUÉM ATÉ ALI</div> : null}
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------- 11 · 5) o alinhamento começou
// o navio treme (tela inteira); o rádio do Kleiner; os três anéis entram em alinhamento e o centro acende: CATALISADOR ·
// INICIANDO; "impedir" é riscado; fica: O QUE FAZER COM ELE?
export const HLAlignStart: React.FC<{ life: number; shakeAt?: number; radioAt?: number; neverAt?: number; reactAt?: number; beganAt?: number; closeAt?: number; notAt?: number; startAt?: number; decideAt?: number }> = (p) => {
  const f = useCurrentFrame();
  const N = 1e9;
  const a = (v?: number) => v ?? N;
  void p.life;
  const shake = f >= a(p.shakeAt) && f < a(p.shakeAt) + 50 ? (1 - (f - a(p.shakeAt)) / 50) * 14 : f >= a(p.beganAt) ? 3 : 0;
  const align = f >= a(p.beganAt) ? Math.min(1, 0.7 + (f - a(p.beganAt)) * 0.004) : 0.55;
  const glow = f >= a(p.startAt) ? P(f, a(p.startAt), 40) : 0;
  return (
    <AbsoluteFill style={{ background: BG9("#0c0a0c"), overflow: "hidden", fontFamily: MONO, transform: `translate(${(rnd(f) - 0.5) * shake}px, ${(rnd(f * 2) - 0.5) * shake}px)` }}>
      <Title9 t={f >= a(p.startAt) ? "CATALISADOR · INICIANDO" : "O NAVIO TREME"} col={f >= a(p.startAt) ? CREAM : RED} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <Rings3 f={f} align={align} cx={1180} cy={560} s={0.9} glow={glow} />
      </svg>
      {f >= a(p.radioAt) ? (
        <div style={{ position: "absolute", left: 70, top: 140, width: 560, padding: "14px 18px", border: `1px solid ${GREEN}`, borderRadius: 8, background: "rgba(4,14,8,0.88)", opacity: P(f, a(p.radioAt), 8) }}>
          <div style={{ fontSize: 15, letterSpacing: 4, color: GREEN }}>RÁDIO · DR. KLEINER</div>
          <VoiceStrip f={f} w={520} h={50} amp={0.6} col={GREEN} seed={12} />
          {f >= a(p.neverAt) ? <div style={{ fontSize: 20, letterSpacing: 3, color: CREAM, marginTop: 8, opacity: P(f, a(p.neverAt), 8) }}>ALGO NUNCA VISTO ANTES</div> : null}
          {f >= a(p.reactAt) ? <div style={{ fontSize: 20, letterSpacing: 3, color: GREEN, marginTop: 6, opacity: P(f, a(p.reactAt), 8) }}>O NÚCLEO REAGE À FERIDA</div> : null}
          {f >= a(p.beganAt) ? <div style={{ fontSize: 24, letterSpacing: 4, color: AMB, marginTop: 6, opacity: flickIn(f, a(p.beganAt)) }}>O ALINHAMENTO COMEÇOU</div> : null}
          {f >= a(p.closeAt) ? <div style={{ fontSize: 18, letterSpacing: 3, color: RED, marginTop: 6, opacity: P(f, a(p.closeAt), 8) }}>OS COMBINE CHEGARAM PERTO O SUFICIENTE</div> : null}
        </div>
      ) : null}
      {f >= a(p.notAt) ? (
        <div style={{ position: "absolute", left: 70, bottom: 120, opacity: P(f, a(p.notAt), 8) }}>
          <div style={{ fontSize: 28, letterSpacing: 4, color: "rgba(255,226,176,0.45)", textDecoration: "line-through" }}>IMPEDIR QUE ELE EXISTA</div>
          {f >= a(p.decideAt) ? <div style={{ fontSize: 46, letterSpacing: 5, color: CREAM, marginTop: 14, opacity: flickIn(f, a(p.decideAt)) }}>O QUE FAZER COM ELE?</div> : null}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ================================================================================================ MÓDULO 12
// ---------------------------------------------------------------------------------------------- 12 · 1) a arma
// os três anéis alinhando à esquerda; os dados da Mossman cruzam; a mesma condição vira uma mira que aponta para a rede
// Combine na Terra (pontos vermelhos à direita); CONTROLAR O DISPARO; e três reações: Kleiner (VENCER), Magnusson
// (ESTABILIZAR), Eli (hesita: destruir × usar primeiro).
export const HLWeaponReveal: React.FC<{ life: number; alignAt?: number; instrAt?: number; crossAt?: number; notOnlyAt?: number; againstAt?: number; fireAt?: number; weaponAt?: number; structAt?: number; solAt?: number; klAt?: number; magAt?: number; eliAt?: number; destroyAt?: number; useAt?: number }> = (p) => {
  const f = useCurrentFrame();
  const N = 1e9;
  const a = (v?: number) => v ?? N;
  void p.life;
  const aim = P(f, a(p.againstAt), 30);
  const nodes = Array.from({ length: 30 }).map((_, i) => ({ x: 1250 + rnd(i * 1.3) * 560, y: 220 + rnd(i * 2.1) * 600, big: i % 7 === 0 }));
  const ph2 = P(f, a(p.solAt) + 30, 16);
  return (
    <AbsoluteFill style={{ background: BG9("#0c0a0c"), overflow: "hidden", fontFamily: MONO }}>
      <Title9 t={ph2 > 0.5 ? "POR ALGUNS SEGUNDOS" : f >= a(p.weaponAt) ? "O BOREALIS COMO ARMA" : "O ALINHAMENTO · AO VIVO"} col={f >= a(p.weaponAt) ? RED : AMB} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: 1 - ph2 * 0.7 }}>
        <Rings3 f={f} align={0.8} cx={520} cy={540} s={0.7} glow={0.3} />
        {f >= a(p.crossAt) ? <text x={520} y={880} textAnchor="middle" fill={GREEN} fontFamily={MONO} fontSize={16} letterSpacing={3} opacity={P(f, a(p.crossAt), 8)}>× DADOS DA MOSSMAN</text> : null}
        {/* a rede Combine */}
        {f >= a(p.againstAt) ? nodes.map((n, i) => <circle key={i} cx={n.x} cy={n.y} r={n.big ? 10 : 5} fill={n.big ? VIO : RED} opacity={P(f, a(p.againstAt) + i, 6)} />) : null}
        {f >= a(p.againstAt) ? <text x={1530} y={190} textAnchor="middle" fill={RED} fontFamily={MONO} fontSize={16} letterSpacing={3} opacity={P(f, a(p.againstAt), 8)}>ESTRUTURA COMBINE · TERRA</text> : null}
        {/* a mira */}
        {aim > 0 ? (
          <g>
            <line x1={720} y1={540} x2={lerp(720, 1530, aim)} y2={540} stroke={RED} strokeWidth={3} strokeDasharray="12 8" strokeDashoffset={-f * 3} />
            <circle cx={1530} cy={540} r={lerp(300, 120, P(f, a(p.fireAt), 20))} fill="none" stroke={RED} strokeWidth={3} opacity={aim} />
            {[0, 1, 2, 3].map((k) => (
              <line key={k} x1={1530} y1={540 - 130} x2={1530} y2={540 - 170} stroke={RED} strokeWidth={3} transform={`rotate(${k * 90} 1530 540)`} opacity={P(f, a(p.fireAt), 10)} />
            ))}
          </g>
        ) : null}
      </svg>
      <div style={{ position: "absolute", left: 70, top: 110, width: 600 }}>
        {[
          { at: a(p.instrAt), k: "KLEINER ACOMPANHA PELOS INSTRUMENTOS", c: GREEN },
          { at: a(p.notOnlyAt), k: "NÃO SERVE SÓ PARA OS ADVISORS", c: CREAM },
          { at: a(p.againstAt), k: "A MESMA CONDIÇÃO · CONTRA ELES", c: RED },
          { at: a(p.fireAt), k: "SE CONTROLAREM O DISPARO", c: AMB },
        ].map((r, i) =>
          f >= r.at && ph2 < 1 ? (
            <div key={i} style={{ fontSize: 18, letterSpacing: 3, color: r.c, marginTop: 12, opacity: flickIn(f, r.at) * (1 - ph2) }}>
              {r.k}
            </div>
          ) : null,
        )}
      </div>
      {ph2 > 0 ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 300, display: "flex", justifyContent: "center", gap: 36, opacity: ph2 }}>
          {[
            { at: a(p.klAt), n: "KLEINER", k: "UMA CHANCE DE VENCER", c: GREEN },
            { at: a(p.magAt), n: "MAGNUSSON", k: "ESTABILIZAR O SISTEMA", c: ICE },
            { at: a(p.eliAt), n: "ELI", k: f >= a(p.useAt) ? "USAR PRIMEIRO?" : "HESITA", c: AMB },
          ].map((c, i) =>
            f >= c.at ? (
              <div key={i} style={{ width: 460, padding: "24px 26px", border: `2px solid ${c.c}`, borderRadius: 12, background: "rgba(8,8,8,0.9)", opacity: flickIn(f, c.at) }}>
                <div style={{ fontSize: 18, letterSpacing: 6, color: c.c }}>{c.n}</div>
                <div style={{ fontSize: 30, letterSpacing: 3, color: CREAM, marginTop: 12 }}>{c.k}</div>
                {i === 2 && f >= a(p.destroyAt) ? <div style={{ fontSize: 18, letterSpacing: 3, color: "rgba(255,226,176,0.5)", marginTop: 10, textDecoration: f >= a(p.useAt) ? "line-through" : "none" }}>SEMPRE QUIS DESTRUIR O BOREALIS</div> : null}
              </div>
            ) : null,
          )}
        </div>
      ) : null}
      {void p.alignAt}
      {void p.weaponAt}
      {void p.structAt}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------- 12 · 2) a Alyx diz não
// um NÃO grande; depois a linha do tempo de quem segura o gatilho: HOJE · A RESISTÊNCIA → OUTRA GERAÇÃO → OUTRA ESPÉCIE →
// OS PRÓPRIOS COMBINE (o gatilho passa de mão em mão); a frase dela digitada.
export const HLWhoHolds: React.FC<{ life: number; noAt?: number; notTimeAt?: number; seenAt?: number; weaponAt?: number; afterAt?: number; ifAt?: number; notSolveAt?: number; whoAt?: number; todayAt?: number; genAt?: number; specAt?: number; combAt?: number; quoteAt?: number; quote2At?: number }> = (p) => {
  const f = useCurrentFrame();
  const N = 1e9;
  const a = (v?: number) => v ?? N;
  void p.life;
  const steps = [
    { at: a(p.todayAt), k: "HOJE · A RESISTÊNCIA", c: GREEN },
    { at: a(p.genAt), k: "OUTRA GERAÇÃO", c: CREAM },
    { at: a(p.specAt), k: "OUTRA ESPÉCIE", c: ICE },
    { at: a(p.combAt), k: "OS PRÓPRIOS COMBINE", c: RED },
  ];
  const shown = steps.filter((s) => f >= s.at).length;
  const ph = f >= a(p.quoteAt) ? 2 : f >= a(p.ifAt) ? 1 : 0;
  return (
    <AbsoluteFill style={{ background: BG9("#100c08"), overflow: "hidden", fontFamily: MONO }}>
      <Title9 t={ph === 1 ? "O QUE ACONTECE DEPOIS" : "ALYX"} col={AMB} />
      {ph === 0 ? (
        <>
          <div style={{ position: "absolute", left: 0, right: 0, top: 300, textAlign: "center", fontSize: 220, letterSpacing: 20, color: AMB, opacity: P(f, a(p.noAt), 6), transform: `scale(${1 + (1 - P(f, a(p.noAt), 8)) * 0.3})` }}>NÃO</div>
          {f >= a(p.notTimeAt) ? <div style={{ position: "absolute", left: 0, right: 0, top: 640, textAlign: "center", fontSize: 24, letterSpacing: 4, color: "rgba(255,226,176,0.45)", textDecoration: "line-through", opacity: P(f, a(p.notTimeAt), 8) }}>GANHAR TEMPO</div> : null}
          {f >= a(p.seenAt) ? <div style={{ position: "absolute", left: 0, right: 0, top: 690, textAlign: "center", fontSize: 30, letterSpacing: 4, color: CREAM, opacity: P(f, a(p.seenAt), 8) }}>ALGUÉM QUE JÁ VIU ESSA ESCOLHA ANTES</div> : null}
          {f >= a(p.weaponAt) ? (
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 110, display: "flex", justifyContent: "center", gap: 60, opacity: P(f, a(p.weaponAt), 8) }}>
              <div style={{ fontSize: 24, letterSpacing: 3, color: RED }}>A RESISTÊNCIA VÊ · UMA ARMA</div>
              {f >= a(p.afterAt) ? <div style={{ fontSize: 24, letterSpacing: 3, color: AMB, opacity: flickIn(f, a(p.afterAt)) }}>ALYX VÊ · O QUE VEM DEPOIS</div> : null}
            </div>
          ) : null}
        </>
      ) : null}
      {ph === 1 ? (
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          <line x1={160} x2={1760} y1={560} y2={560} stroke="rgba(255,226,176,0.35)" strokeWidth={2} />
          {steps.map((s, i) =>
            f >= s.at ? (
              <g key={i} opacity={flickIn(f, s.at)}>
                <circle cx={300 + i * 440} cy={560} r={34} fill="rgba(0,0,0,0.5)" stroke={s.c} strokeWidth={3} />
                <text x={300 + i * 440} y={630} textAnchor="middle" fill={s.c} fontFamily={MONO} fontSize={18} letterSpacing={3}>{s.k}</text>
              </g>
            ) : null,
          )}
          {/* o gatilho passando */}
          {shown > 0 ? (
            <g transform={`translate(${300 + (shown - 1) * 440} 460)`}>
              <rect x={-40} y={-20} width={80} height={36} rx={6} fill="rgba(255,93,77,0.2)" stroke={RED} strokeWidth={2.5} />
              <text x={0} y={5} textAnchor="middle" fill={RED} fontFamily={MONO} fontSize={12} letterSpacing={2}>GATILHO</text>
            </g>
          ) : null}
          {f >= a(p.notSolveAt) ? <text x={960} y={300} textAnchor="middle" fill={CREAM} fontFamily={MONO} fontSize={26} letterSpacing={4} opacity={P(f, a(p.notSolveAt), 8)}>{f >= a(p.whoAt) ? "SÓ MUDA QUEM CONTROLA" : "BOREALIS · NÚCLEO · FERIDA CONTINUAM EXISTINDO"}</text> : null}
        </svg>
      ) : null}
      {ph === 2 ? (
        <div style={{ position: "absolute", left: 160, right: 160, top: 330 }}>
          <div style={{ fontSize: 48, letterSpacing: 3, color: CREAM }}>{`“${typedS(f, a(p.quoteAt), "VOCÊS ESTÃO OLHANDO PARA UMA ARMA.", 1.3)}”`}</div>
          {f >= a(p.quote2At) ? <div style={{ fontSize: 40, letterSpacing: 3, color: AMB, marginTop: 30 }}>{`“${typedS(f, a(p.quote2At), "EU ESTOU OLHANDO PARA TODAS AS VEZES QUE ALGUÉM DECIDIU QUE SERIA A ÚLTIMA PESSOA A USÁ-LA.", 1.6)}”`}</div> : null}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------- 12 · 3) a pergunta do Varga
// os registros rolam; três palavras acendem (CONTINUIDADE · ASCENSÃO · CONSCIÊNCIAS FORA DO CORPO); o contato do Varga
// (verde) chega perto; a pergunta dele digitada; ninguém responde (linhas de resposta vazias).
export const HLVargaQ: React.FC<{ life: number; attAt?: number; warAt?: number; recAt?: number; woundAt?: number; askAt?: number; qAt?: number; silAt?: number; promAt?: number }> = (p) => {
  const f = useCurrentFrame();
  const N = 1e9;
  const a = (v?: number) => v ?? N;
  void p.life;
  const words = [
    { k: "CONTINUIDADE", x: 520, y: 330, at: a(p.recAt) },
    { k: "ASCENSÃO", x: 1100, y: 420, at: a(p.recAt) + 20 },
    { k: "CONSCIÊNCIAS PRESERVADAS FORA DO CORPO", x: 760, y: 560, at: a(p.recAt) + 40 },
  ];
  return (
    <AbsoluteFill style={{ background: BG9("#08100c"), overflow: "hidden", fontFamily: MONO }}>
      <Title9 t={f >= a(p.askAt) ? "VARGA · UMA PERGUNTA" : "VARGA"} col={GREEN} o={P(f, a(p.attAt), 8)} />
      {f >= a(p.warAt) && f < a(p.askAt) ? (
        <div style={{ position: "absolute", left: 120, top: 140, fontSize: 20, letterSpacing: 3, color: "rgba(255,226,176,0.6)", opacity: P(f, a(p.warAt), 8) }}>
          ATÉ ALI: GUERRA · TECNOLOGIA · UMA FORMA DE ACABAR COM OS COMBINE
        </div>
      ) : null}
      <div style={{ position: "absolute", inset: 0, opacity: f >= a(p.askAt) ? 0.25 : 1 }}>
        {Array.from({ length: 16 }).map((_, i) => (
          <div key={i} style={{ position: "absolute", left: 120, top: 200 + i * 44 - ((f * 0.8) % 44), fontSize: 18, letterSpacing: 4, color: "rgba(141,255,168,0.18)", whiteSpace: "nowrap" }}>
            {`REG.${(8800 + i * 37).toString(16).toUpperCase()} · ${GLY.slice(i % 6, (i % 6) + 8)} · ${GLY.slice(3, 9)} · ${GLY.slice(i % 4, (i % 4) + 6)}`}
          </div>
        ))}
        {words.map((w, i) =>
          f >= w.at ? (
            <div key={i} style={{ position: "absolute", left: w.x, top: w.y, padding: "8px 16px", border: `2px solid ${AMB}`, borderRadius: 6, fontSize: 30, letterSpacing: 4, color: CREAM, background: "rgba(14,10,4,0.9)", opacity: flickIn(f, w.at) }}>
              {w.k}
            </div>
          ) : null,
        )}
      </div>
      {f >= a(p.woundAt) && f < a(p.askAt) ? <div style={{ position: "absolute", left: 0, right: 0, bottom: 100, textAlign: "center", fontSize: 24, letterSpacing: 4, color: GREEN, opacity: P(f, a(p.woundAt), 8) }}>TOCA NA FERIDA QUE ELE CARREGA DESDE O COMEÇO</div> : null}
      {f >= a(p.qAt) ? (
        <div style={{ position: "absolute", left: 200, right: 200, top: 380, textAlign: "center" }}>
          <div style={{ fontSize: 60, letterSpacing: 3, color: CREAM }}>{`“${typedS(f, a(p.qAt), "SE O CORPO TERMINA, ALGUMA COISA PODE CONTINUAR?", 1.2)}”`}</div>
          {f >= a(p.silAt) ? (
            <div style={{ marginTop: 50, opacity: P(f, a(p.silAt), 8) }}>
              {[0, 1, 2].map((k) => (
                <div key={k} style={{ height: 3, width: 700, margin: "18px auto", background: "rgba(255,226,176,0.15)" }} />
              ))}
              <div style={{ fontSize: 20, letterSpacing: 5, color: "rgba(255,226,176,0.6)" }}>NINGUÉM RESPONDE</div>
            </div>
          ) : null}
        </div>
      ) : null}
      {void p.promAt}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------- 12 · 4) a porta
// uma porta de luz no centro; do outro lado só "?"; os Advisors (triângulos) caminham até ela; três limites riscados ao lado
// (UM CORPO · UM MUNDO · UMA VIDA); PERPETUIDADE escrita no batente; "nunca tiveram certeza de como chegar"; A CRENÇA os trouxe.
export const HLBeliefDoor: React.FC<{ life: number; explAt?: number; dontAt?: number; truthAt?: number; contAt?: number; escAt?: number; bodyAt?: number; worldAt?: number; lifeAt?: number; perpAt?: number; neverAt?: number; maybeAt?: number; doorAt?: number; broughtAt?: number }> = (p) => {
  const f = useCurrentFrame();
  const N = 1e9;
  const a = (v?: number) => v ?? N;
  void p.life;
  const walk = P(f, a(p.broughtAt) - 120, 200);
  return (
    <AbsoluteFill style={{ background: BG9("#0c0a12"), overflow: "hidden", fontFamily: MONO }}>
      <Title9 t="O QUE OS COMBINE ACREDITAM" col={VIO} o={P(f, a(p.explAt), 8)} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <rect x={1180} y={240} width={300} height={560} fill={`rgba(255,226,176,${0.06 + 0.04 * Math.sin(f / 8)})`} stroke={CREAM} strokeWidth={3} opacity={P(f, a(p.dontAt), 14)} />
        <text x={1330} y={560} textAnchor="middle" fill={CREAM} fontFamily={MONO} fontSize={120} opacity={P(f, a(p.dontAt), 14) * (0.5 + 0.3 * Math.sin(f / 10))}>?</text>
        {f >= a(p.perpAt) ? <text x={1330} y={225} textAnchor="middle" fill={VIO} fontFamily={MONO} fontSize={20} letterSpacing={6} opacity={P(f, a(p.perpAt), 8)}>PERPETUIDADE</text> : null}
        {f >= a(p.doorAt) ? <text x={1330} y={850} textAnchor="middle" fill={AMB} fontFamily={MONO} fontSize={22} letterSpacing={6} opacity={P(f, a(p.doorAt), 8)}>CATALISADOR = A PORTA</text> : null}
        {[0, 1, 2, 3, 4].map((k) => {
          const x = lerp(200 + k * 120, 1050 + (k % 2) * 40, walk);
          const y = 520 + (k - 2) * 70;
          return <path key={k} d={`M ${x} ${y - 26} L ${x + 22} ${y + 18} L ${x - 22} ${y + 18} Z`} fill="rgba(199,155,255,0.22)" stroke={VIO} strokeWidth={2.5} opacity={P(f, a(p.contAt) + k * 4, 8)} />;
        })}
      </svg>
      <div style={{ position: "absolute", left: 120, top: 160, width: 700 }}>
        {f >= a(p.truthAt) ? <div style={{ fontSize: 22, letterSpacing: 3, color: "rgba(255,226,176,0.6)", opacity: P(f, a(p.truthAt), 8) }}>NÃO SABEM A VERDADE COMPLETA</div> : null}
        {f >= a(p.contAt) ? <div style={{ fontSize: 30, letterSpacing: 4, color: VIO, marginTop: 14, opacity: P(f, a(p.contAt), 8) }}>SÓ UMA POSSIBILIDADE DE CONTINUIDADE</div> : null}
        {f >= a(p.escAt) ? <div style={{ fontSize: 18, letterSpacing: 4, color: CREAM, marginTop: 24, opacity: P(f, a(p.escAt), 8) }}>ESCAPAR DOS LIMITES DE</div> : null}
        {[
          { at: a(p.bodyAt), k: "UM CORPO" },
          { at: a(p.worldAt), k: "UM MUNDO" },
          { at: a(p.lifeAt), k: "UMA VIDA" },
        ].map((r, i) =>
          f >= r.at ? (
            <div key={i} style={{ fontSize: 34, letterSpacing: 5, color: "rgba(255,226,176,0.6)", marginTop: 10, textDecoration: "line-through", opacity: flickIn(f, r.at) }}>
              {r.k}
            </div>
          ) : null,
        )}
      </div>
      {f >= a(p.neverAt) ? (
        <div style={{ position: "absolute", left: 120, bottom: 110, width: 900, opacity: P(f, a(p.neverAt), 8) }}>
          <div style={{ fontSize: 24, letterSpacing: 3, color: RED }}>NUNCA TIVERAM CERTEZA DE COMO CHEGAR LÁ</div>
          {f >= a(p.maybeAt) ? <div style={{ fontSize: 20, letterSpacing: 3, color: "rgba(255,226,176,0.7)", marginTop: 8, opacity: P(f, a(p.maybeAt), 8) }}>TALVEZ NEM ENTENDAM O QUE ESTÃO PERSEGUINDO</div> : null}
          {f >= a(p.broughtAt) ? <div style={{ fontSize: 30, letterSpacing: 5, color: VIO, marginTop: 14, opacity: flickIn(f, a(p.broughtAt)) }}>FOI A CRENÇA QUE OS TROUXE ATÉ AQUI</div> : null}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------- 12 · 5) os empregadores
// a maleta do G-Man no centro; acima dela, fora do quadro das linhas, uma faixa escura (OS EMPREGADORES) que não pertence
// a nenhuma linha. As linhas do tempo correm por baixo; "mãos" (setas pálidas) descem de fora e mexem nelas: tira uma
// peça, devolve outra, apaga uma morte, acende uma informação. As linhas mudam mas todas são empurradas para a mesma porta.
export const HLEmployers: React.FC<{ life: number; aboveAt?: number; aloneAt?: number; empAt?: number; notOneAt?: number; outAt?: number; combAt?: number; possAt?: number; interAt?: number; takeAt?: number; giveAt?: number; deathAt?: number; infoAt?: number; pushAt?: number; doorAt?: number }> = (p) => {
  const f = useCurrentFrame();
  const N = 1e9;
  const a = (v?: number) => v ?? N;
  void p.life;
  const L = 6;
  const Y0 = 520;
  const door = { x: 1720, y: 760 };
  const ly = (i: number, x: number) => {
    const t = (x - 120) / (door.x - 120);
    const push = f >= a(p.pushAt) ? P(f, a(p.pushAt), 60) : 0;
    const base = Y0 + i * 80;
    return lerp(base + Math.sin(x / 140 + i) * 20 * (1 - push), lerp(base, door.y, t * t), push);
  };
  const acts = [
    { at: a(p.takeAt), k: "ALGUÉM É RETIRADO", x: 520, i: 1, c: AMB },
    { at: a(p.giveAt), k: "OUTRO É DEVOLVIDO", x: 820, i: 3, c: CREAM },
    { at: a(p.deathAt), k: "UMA MORTE NÃO ACONTECE", x: 1100, i: 2, c: GREEN },
    { at: a(p.infoAt), k: "UMA INFORMAÇÃO NO LUGAR CERTO", x: 1380, i: 4, c: ICE },
  ];
  return (
    <AbsoluteFill style={{ background: BG9("#0a0a0c"), overflow: "hidden", fontFamily: MONO }}>
      <Title9 t="ACIMA DO G-MAN" col={CREAM} o={P(f, a(p.aboveAt), 8)} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {/* os empregadores: fora das linhas */}
        {f >= a(p.empAt) ? (
          <g opacity={P(f, a(p.empAt), 20)}>
            <rect x={0} y={90} width={1920} height={200} fill="rgba(0,0,0,0.6)" stroke="rgba(255,226,176,0.25)" />
            {Array.from({ length: 40 }).map((_, i) => (
              <circle key={i} cx={(i * 97 + f * 0.3) % 1920} cy={130 + rnd(i) * 120} r={1.5 + rnd(i * 3) * 2} fill="rgba(255,226,176,0.5)" />
            ))}
            <text x={960} y={200} textAnchor="middle" fill={CREAM} fontFamily={MONO} fontSize={28} letterSpacing={12}>OS EMPREGADORES</text>
          </g>
        ) : null}
        {/* a maleta */}
        <g transform="translate(960 380)" opacity={P(f, a(p.aboveAt), 10)}>
          <rect x={-36} y={-26} width={72} height={52} rx={4} fill="rgba(0,0,0,0.6)" stroke={CREAM} strokeWidth={2.5} />
          <path d="M -14 -26 L -14 -38 L 14 -38 L 14 -26" fill="none" stroke={CREAM} strokeWidth={2.5} />
          {f >= a(p.aloneAt) ? <line x1={0} y1={-40} x2={0} y2={-90} stroke="rgba(255,226,176,0.5)" strokeDasharray="4 6" /> : null}
        </g>
        {/* as linhas */}
        {f >= a(p.possAt)
          ? Array.from({ length: L }).map((_, i) => <path key={i} d={Array.from({ length: 50 }).map((_, k) => { const x = 120 + ((door.x - 120) * k) / 49; return `${k ? "L" : "M"} ${x} ${ly(i, x)}`; }).join(" ")} fill="none" stroke="rgba(159,230,255,0.5)" strokeWidth={2} opacity={P(f, a(p.possAt) + i * 4, 10)} />)
          : null}
        {/* as interferências */}
        {acts.map((ac, k) =>
          f >= ac.at ? (
            <g key={k} opacity={flickIn(f, ac.at)}>
              <line x1={ac.x} y1={290} x2={ac.x} y2={lerp(290, ly(ac.i, ac.x) - 12, P(f, ac.at, 14))} stroke="rgba(255,226,176,0.6)" strokeWidth={2} />
              <circle cx={ac.x} cy={ly(ac.i, ac.x)} r={10} fill={ac.c} />
              <text x={ac.x} y={ly(ac.i, ac.x) + 34} textAnchor="middle" fill={ac.c} fontFamily={MONO} fontSize={14} letterSpacing={2}>{ac.k}</text>
            </g>
          ) : null,
        )}
        {f >= a(p.doorAt) ? (
          <g opacity={P(f, a(p.doorAt), 10)}>
            <rect x={door.x - 30} y={door.y - 60} width={60} height={120} fill="rgba(255,178,46,0.15)" stroke={AMB} strokeWidth={3} />
            <text x={door.x} y={door.y + 90} textAnchor="middle" fill={AMB} fontFamily={MONO} fontSize={16} letterSpacing={3}>CATALISADOR</text>
          </g>
        ) : null}
      </svg>
      <div style={{ position: "absolute", left: 70, top: 300, width: 560 }}>
        {[
          { at: a(p.notOneAt), k: "NÃO PERTENCEM A UMA TERRA · A UM UNIVERSO · A UMA VERSÃO", c: CREAM },
          { at: a(p.combAt), k: "COMBINE: ATRAVESSAM MUNDOS", c: RED },
          { at: a(p.possAt), k: "EMPREGADORES: ATRAVESSAM POSSIBILIDADES", c: AMB },
        ].map((r, i) =>
          f >= r.at && f < a(p.interAt) + 30 ? (
            <div key={i} style={{ fontSize: 18, letterSpacing: 3, color: r.c, marginTop: 12, opacity: flickIn(f, r.at) * (1 - P(f, a(p.interAt) + 20, 10)) }}>
              {r.k}
            </div>
          ) : null,
        )}
      </div>
      {f >= a(p.interAt) ? <div style={{ position: "absolute", left: 0, right: 0, top: 310, textAlign: "center", fontSize: 26, letterSpacing: 6, color: AMB, opacity: P(f, a(p.interAt), 8) }}>ELES INTERFEREM</div> : null}
      {void p.outAt}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------- 12 · 6) linhas de convergência
// as variações aparecem como ramos (GORDON DECIDE DIFERENTE · ELI MORRE / SOBREVIVE · ALYX SEGUE OUTRO CAMINHO) e uma mão
// pálida reorganiza o tabuleiro: os ramos se curvam de volta para a mesma porta. A maleta empurra as peças até ali, sem
// tocar a porta: "até que alguém faça isso por ele".
export const HLConvergence: React.FC<{ life: number; notSameAt?: number; gordAt?: number; eliAt?: number; alyxAt?: number; boardAt?: number; doorAt?: number; needAt?: number; notHandsAt?: number; piecesAt?: number; someoneAt?: number }> = (p) => {
  const f = useCurrentFrame();
  const N = 1e9;
  const a = (v?: number) => v ?? N;
  void p.life;
  const door = { x: 1680, y: 540 };
  const bend = P(f, a(p.boardAt), 50);
  const br = [
    { at: a(p.gordAt), k: "GORDON DECIDE DIFERENTE", y: 260, c: CREAM },
    { at: a(p.eliAt), k: "ELI MORRE · OU SOBREVIVE", y: 440, c: GREEN },
    { at: a(p.alyxAt), k: "ALYX SEGUE OUTRO CAMINHO", y: 820, c: AMB },
  ];
  const push = P(f, a(p.piecesAt), 60);
  return (
    <AbsoluteFill style={{ background: BG9("#0c0a08"), overflow: "hidden", fontFamily: MONO }}>
      <Title9 t="AS LINHAS DE CONVERGÊNCIA" col={AMB} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <line x1={120} x2={door.x} y1={540} y2={540} stroke="rgba(255,226,176,0.5)" strokeWidth={3} />
        {br.map((b, i) =>
          f >= b.at ? (
            <g key={i} opacity={flickIn(f, b.at)}>
              <path d={`M ${400 + i * 200} 540 C ${700 + i * 150} ${b.y} ${1300} ${b.y} ${lerp(1700, door.x, bend)} ${lerp(b.y, door.y, bend)}`} fill="none" stroke={b.c} strokeWidth={3} />
              <text x={900 + i * 100} y={b.y + (b.y < 540 ? -16 : 30)} fill={b.c} fontFamily={MONO} fontSize={16} letterSpacing={3}>{b.k}</text>
            </g>
          ) : null,
        )}
        {f >= a(p.boardAt) ? <text x={960} y={980} textAnchor="middle" fill="rgba(255,226,176,0.7)" fontFamily={MONO} fontSize={20} letterSpacing={5} opacity={P(f, a(p.boardAt), 8)}>ALGUMA COISA REORGANIZA O TABULEIRO</text> : null}
        <g opacity={P(f, a(p.doorAt), 10)}>
          <rect x={door.x - 34} y={door.y - 70} width={68} height={140} fill="rgba(255,178,46,0.15)" stroke={AMB} strokeWidth={3} />
          <text x={door.x} y={door.y + 100} textAnchor="middle" fill={AMB} fontFamily={MONO} fontSize={16} letterSpacing={3}>A MESMA PORTA</text>
        </g>
        {/* a maleta empurrando as peças */}
        {f >= a(p.needAt) ? (
          <g>
            {[0, 1, 2].map((k) => (
              <circle key={k} cx={lerp(600 + k * 60, door.x - 120 - k * 40, push)} cy={540 + (k - 1) * 40} r={14} fill={[CREAM, AMB, VIO][k]} />
            ))}
            <g transform={`translate(${lerp(500, door.x - 260, push)} 450)`}>
              <rect x={-30} y={-22} width={60} height={44} rx={4} fill="rgba(0,0,0,0.6)" stroke={CREAM} strokeWidth={2.5} />
            </g>
          </g>
        ) : null}
        {f >= a(p.notHandsAt) ? <text x={door.x - 160} y={door.y - 110} textAnchor="middle" fill={RED} fontFamily={MONO} fontSize={16} letterSpacing={3} opacity={P(f, a(p.notHandsAt), 8)}>NÃO COM AS PRÓPRIAS MÃOS</text> : null}
        {f >= a(p.someoneAt) ? <text x={door.x - 160} y={door.y + 150} textAnchor="middle" fill={GREEN} fontFamily={MONO} fontSize={18} letterSpacing={3} opacity={P(f, a(p.someoneAt), 8)}>ATÉ QUE ALGUÉM FAÇA POR ELE</text> : null}
      </svg>
      {f >= a(p.notSameAt) ? <div style={{ position: "absolute", left: 70, top: 110, fontSize: 20, letterSpacing: 3, color: "rgba(255,226,176,0.7)", opacity: P(f, a(p.notSameAt), 8) }}>NÃO SIGNIFICA QUE TUDO ACONTECE IGUAL</div> : null}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------- 12 · 7) a névoa
// o contato da Alyx com a névoa em volta (como no começo do vídeo); três leituras riscadas (ÊXTASE · G-MAN) até a certa;
// depois, os futuros vistos pelos Vortigaunts como trilhas gastas à frente dela; todas terminam numa parede de névoa
// (ruído): depois dali ninguém vê nada.
export const HLMistLimit: React.FC<{ life: number; vortAt?: number; mistAt?: number; stasisAt?: number; gmanAt?: number; nowAt?: number; notAt?: number; absAt?: number; futAt?: number; pathAt?: number; nothingAt?: number }> = (p) => {
  const f = useCurrentFrame();
  const N = 1e9;
  const a = (v?: number) => v ?? N;
  void p.life;
  const ph2 = P(f, a(p.futAt), 20);
  const AX = 360;
  const wallX = 1300;
  return (
    <AbsoluteFill style={{ background: BG9("#08100c"), overflow: "hidden", fontFamily: MONO }}>
      <Title9 t={ph2 > 0.5 ? "O QUE OS VORTIGAUNTS ENXERGAVAM" : "A NÉVOA EM VOLTA DA ALYX"} col={GREEN} o={P(f, a(p.vortAt), 8)} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <filter id="mist12">
            <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves={3} seed={Math.floor(f / 3) % 50} />
            <feColorMatrix values="0 0 0 0 0.75  0 0 0 0 0.85  0 0 0 0 0.8  0 0 0 0.9 -0.15" />
          </filter>
        </defs>
        {/* Alyx + névoa */}
        <g transform={`translate(${lerp(960, AX, ph2)} 540)`}>
          <circle r={110} filter="url(#mist12)" opacity={P(f, a(p.mistAt), 20) * (1 - ph2 * 0.6)} />
          <circle r={18} fill={AMB} />
          <text y={-40} textAnchor="middle" fill={AMB} fontFamily={MONO} fontSize={16} letterSpacing={3}>ALYX</text>
        </g>
        {/* futuros */}
        {ph2 > 0
          ? Array.from({ length: 9 }).map((_, i) => {
              const y = 260 + i * 70;
              return <path key={i} d={`M ${AX + 30} 540 C ${AX + 300} 540 ${AX + 500} ${y} ${wallX} ${y}`} fill="none" stroke={GREEN} strokeWidth={2 + (i % 3)} opacity={ph2 * (0.3 + 0.5 * P(f, a(p.pathAt) + i * 3, 10))} />;
            })
          : null}
        {ph2 > 0 ? (
          <g opacity={P(f, a(p.nothingAt), 20)}>
            <rect x={wallX} y={0} width={1920 - wallX} height={1080} filter="url(#mist12)" />
            <text x={wallX + 300} y={540} textAnchor="middle" fill="rgba(4,8,6,0.9)" fontFamily={MONO} fontSize={30} letterSpacing={8}>NADA</text>
          </g>
        ) : null}
      </svg>
      {ph2 < 1 ? (
        <div style={{ position: "absolute", right: 120, top: 260, width: 600, opacity: 1 - ph2 }}>
          {[
            { at: a(p.stasisAt), k: "EFEITO DO ÊXTASE", x: true },
            { at: a(p.gmanAt), k: "ALGO DO G-MAN", x: true },
            { at: a(p.notAt), k: "NÃO ERA ALGO EM VOLTA DELA", x: true },
            { at: a(p.absAt), k: "ERA A AUSÊNCIA DE ALGO DEPOIS DELA", x: false },
          ].map((r, i) =>
            f >= r.at ? (
              <div key={i} style={{ fontSize: r.x ? 24 : 32, letterSpacing: 3, color: r.x ? "rgba(255,226,176,0.5)" : GREEN, marginTop: 18, textDecoration: r.x && f >= (i < 2 ? a(p.nowAt) : a(p.absAt)) ? "line-through" : "none", opacity: flickIn(f, r.at) }}>
                {r.k}
              </div>
            ) : null,
          )}
        </div>
      ) : null}
      {f >= a(p.pathAt) ? <div style={{ position: "absolute", left: 420, bottom: 90, fontSize: 20, letterSpacing: 3, color: GREEN, opacity: P(f, a(p.pathAt), 8) }}>COISAS QUE JÁ ACONTECERAM VEZES SUFICIENTES PARA DEIXAR UM CAMINHO</div> : null}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------- 12 · 8) ninguém sabe
// tela quase vazia: três nomes riscados um a um (VORTIGAUNTS · ALYX · G-MAN?) e a frase NINGUÉM SABE O QUE VEM DEPOIS.
export const HLNobodyKnows: React.FC<{ life: number; firstAt?: number; vortAt?: number; alyxAt?: number; gmanAt?: number }> = (p) => {
  const f = useCurrentFrame();
  const N = 1e9;
  const a = (v?: number) => v ?? N;
  void p.life;
  return (
    <AbsoluteFill style={{ background: "#040505", overflow: "hidden", fontFamily: MONO }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 360, textAlign: "center", fontSize: 50, letterSpacing: 8, color: CREAM, opacity: P(f, a(p.firstAt), 14) }}>NINGUÉM SABE O QUE VEM DEPOIS</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 500, display: "flex", justifyContent: "center", gap: 60 }}>
        {[
          { at: a(p.vortAt), k: "OS VORTIGAUNTS", c: GREEN },
          { at: a(p.alyxAt), k: "A ALYX", c: AMB },
          { at: a(p.gmanAt), k: "TALVEZ NEM O G-MAN", c: CREAM },
        ].map((n, i) =>
          f >= n.at ? (
            <div key={i} style={{ fontSize: 28, letterSpacing: 4, color: n.c, opacity: flickIn(f, n.at), textDecoration: "line-through" }}>
              {n.k}
            </div>
          ) : null,
        )}
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------- 12 · 9) o preço
// a conta do Kleiner termina (equações); o núcleo cai contra a ferida; a ferida se fecha puxando o espaço preso a ela; o
// globo da Terra (wireframe) encolhe para dentro: A TERRA VAI JUNTO. Depois três fichas: o que o Borealis virou para ELI
// (a chave para salvar a Terra), ALYX (destruir antes do ciclo continuar) e VARGA (uma porta para algo que perdeu).
export const HLPrice: React.FC<{ life: number; calcAt?: number; wayAt?: number; closeAt?: number; priceAt?: number; ifAt?: number; notOnlyAt?: number; woundAt?: number; earthAt?: number; eliSilAt?: number; eliAskAt?: number; lostAt?: number; worldAt?: number; otherAt?: number; mossAt?: number; useAt?: number; sealAt?: number; alyxAt?: number; onceAt?: number; vargaAt?: number; eliCardAt?: number; alyxCardAt?: number; vargaCardAt?: number }> = (p) => {
  const f = useCurrentFrame();
  const N = 1e9;
  const a = (v?: number) => v ?? N;
  void p.life;
  const col = P(f, a(p.ifAt), 40);
  const close = P(f, a(p.woundAt), 50);
  const earth = P(f, a(p.earthAt), 60);
  const ph = f >= a(p.vargaAt) ? 3 : f >= a(p.eliSilAt) ? 2 : f >= a(p.ifAt) ? 1 : 0;
  const globe = (cx: number, cy: number, r: number, o: number) => (
    <g opacity={o}>
      <circle cx={cx} cy={cy} r={r} fill="rgba(159,230,255,0.06)" stroke={ICE} strokeWidth={2} />
      {[-0.6, -0.3, 0, 0.3, 0.6].map((k, i) => (
        <ellipse key={i} cx={cx} cy={cy + k * r} rx={r * Math.sqrt(1 - k * k)} ry={r * 0.08} fill="none" stroke="rgba(159,230,255,0.5)" />
      ))}
      {[0, 1, 2].map((k) => (
        <ellipse key={"m" + k} cx={cx} cy={cy} rx={r * Math.abs(Math.cos(f / 50 + k))} ry={r} fill="none" stroke="rgba(159,230,255,0.4)" />
      ))}
    </g>
  );
  return (
    <AbsoluteFill style={{ background: BG9("#0c0a0a"), overflow: "hidden", fontFamily: MONO }}>
      <Title9 t={ph === 3 ? "O QUE O BOREALIS VIROU PARA CADA UM" : ph === 2 ? "ELI" : ph === 1 ? "O PREÇO" : "A ÚLTIMA CONTA DO KLEINER"} col={ph === 1 ? RED : AMB} />
      {ph === 0 ? (
        <div style={{ position: "absolute", left: 160, top: 220, width: 900 }}>
          {["ψ_núcleo(t₀) · F_ferida", "Δφ → 0  ⇒  colapso", "∮ ferida · dS = 0", "fechamento: t = t_catalisador"].map((l, i) => (
            <div key={i} style={{ fontSize: 34, color: GREEN, marginTop: 24, opacity: P(f, a(p.calcAt) + i * 12, 8) }}>
              {l}
            </div>
          ))}
          {f >= a(p.wayAt) ? <div style={{ fontSize: 30, letterSpacing: 4, color: CREAM, marginTop: 40, opacity: P(f, a(p.wayAt), 8) }}>EXISTE UM JEITO DE DESTRUIR O NÚCLEO CONTRA A FERIDA</div> : null}
          {f >= a(p.priceAt) ? <div style={{ fontSize: 30, letterSpacing: 4, color: RED, marginTop: 14, opacity: flickIn(f, a(p.priceAt)) }}>SÓ QUE EXISTE UM PREÇO</div> : null}
        </div>
      ) : null}
      {ph === 1 ? (
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          {/* a ferida */}
          <path d={`M 960 ${280 + 200 * close} C ${1000 - 30 * close} 450 ${930} 620 960 ${820 - 200 * close} C ${920} 620 ${990 - 30 * close} 450 960 ${280 + 200 * close} Z`} fill="rgba(141,255,168,0.25)" stroke={GREEN} strokeWidth={3} />
          {/* o núcleo cai */}
          <circle cx={lerp(560, 960, col)} cy={lerp(300, 540, col)} r={22} fill={GREEN} opacity={1 - close} />
          {/* a Terra puxada */}
          {globe(lerp(1400, 960, earth), 540, lerp(220, 0, earth), 1 - earth * 0.9)}
          {f >= a(p.earthAt) ? <text x={960} y={960} textAnchor="middle" fill={RED} fontFamily={MONO} fontSize={40} letterSpacing={8} opacity={flickIn(f, a(p.earthAt))}>A TERRA VAI JUNTO</text> : null}
          {f >= a(p.notOnlyAt) ? <text x={960} y={160} textAnchor="middle" fill={CREAM} fontFamily={MONO} fontSize={22} letterSpacing={4} opacity={P(f, a(p.notOnlyAt), 8)}>NÃO É SÓ O BOREALIS QUE DESAPARECE</text> : null}
        </svg>
      ) : null}
      {ph === 2 ? (
        <div style={{ position: "absolute", left: 160, top: 220, width: 1600 }}>
          {[
            { at: a(p.eliAskAt), k: "PEDE PARA O GORDON NÃO FAZER", c: GREEN },
            { at: a(p.lostAt), k: "JÁ PERDEU A ALYX UMA VEZ", c: CREAM },
            { at: a(p.worldAt), k: "NÃO VAI PERDER O MUNDO INTEIRO TAMBÉM", c: CREAM },
            { at: a(p.otherAt), k: "DEVE EXISTIR OUTRA SAÍDA", c: AMB },
            { at: a(p.mossAt), k: "“O BOREALIS É UMA ARMA” · MOSSMAN", c: ICE },
            { at: a(p.useAt), k: "USAR CONTRA OS COMBINE · ACABAR COM A OCUPAÇÃO", c: RED },
            { at: a(p.sealAt), k: "DEPOIS SELAR · FAZER TUDO DIFERENTE", c: AMB },
          ].map((r, i) =>
            f >= r.at ? (
              <div key={i} style={{ fontSize: 30, letterSpacing: 3, color: r.c, marginTop: 18, opacity: flickIn(f, r.at) }}>
                {r.k}
              </div>
            ) : null,
          )}
          {f >= a(p.alyxAt) ? (
            <div style={{ marginTop: 40, padding: "16px 22px", border: `2px solid ${AMB}`, borderRadius: 10, background: "rgba(14,10,4,0.9)", fontSize: 30, letterSpacing: 3, color: CREAM, opacity: P(f, a(p.alyxAt), 8) }}>
              ALYX: {f >= a(p.onceAt) ? "“TODO MUNDO ACREDITA QUE VAI USAR A ARMA SÓ UMA VEZ.”" : "“ESSE É EXATAMENTE O PROBLEMA.”"}
            </div>
          ) : null}
        </div>
      ) : null}
      {ph === 3 ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 300, display: "flex", justifyContent: "center", gap: 36 }}>
          {[
            { at: a(p.eliCardAt), n: "ELI", k: "A CHAVE PARA SALVAR A TERRA", c: GREEN },
            { at: a(p.alyxCardAt), n: "ALYX", k: "DESTRUIR ANTES QUE O CICLO CONTINUE", c: AMB },
            { at: a(p.vargaCardAt), n: "VARGA", k: "UMA PORTA PARA ALGO QUE ELE PERDEU", c: VIO },
          ].map((c, i) =>
            f >= c.at ? (
              <div key={i} style={{ width: 500, padding: "26px 28px", border: `2px solid ${c.c}`, borderRadius: 12, background: "rgba(8,8,8,0.9)", opacity: flickIn(f, c.at) }}>
                <div style={{ fontSize: 18, letterSpacing: 6, color: c.c }}>{c.n}</div>
                <div style={{ fontSize: 30, letterSpacing: 3, color: CREAM, marginTop: 12 }}>{c.k}</div>
              </div>
            ) : null,
          )}
        </div>
      ) : null}
      {void p.closeAt}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------- 12 · 10) a sala da escolha
// vista de cima da sala do núcleo: Barney e os rebeldes chegam pela entrada; os Advisors avançam do outro lado; o
// alinhamento quase completo; dois caminhos físicos acendem (USAR · âmbar à esquerda; COLAPSAR · verde à direita); sem menu;
// a Alyx pede; no fundo da sala, a maleta aparece e fica parada.
export const HLChoiceRoom: React.FC<{ life: number; barneyAt?: number; advAt?: number; almostAt?: number; twoAt?: number; useAt?: number; colAt?: number; alyxAt?: number; pleaseAt?: number; choiceAt?: number; noMenuAt?: number; pathsAt?: number; leftAt?: number; rightAt?: number; gmanAt?: number; waitAt?: number }> = (p) => {
  const f = useCurrentFrame();
  const N = 1e9;
  const a = (v?: number) => v ?? N;
  void p.life;
  const G = { x: 960, y: 620 };
  const al = f >= a(p.almostAt) ? Math.min(98, 80 + (f - a(p.almostAt)) * 0.05) : 70;
  const paths = P(f, a(p.pathsAt), 30);
  return (
    <AbsoluteFill style={{ background: BG9("#0a0a0c"), overflow: "hidden", fontFamily: MONO }}>
      <Title9 t={f >= a(p.choiceAt) ? "SEM MENU" : "A SALA DO NÚCLEO"} col={CREAM} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <rect x={260} y={160} width={1400} height={820} fill="rgba(255,255,255,0.02)" stroke="rgba(255,226,176,0.3)" strokeWidth={3} />
        {/* o núcleo no centro de cima */}
        <circle cx={960} cy={330} r={40 + 6 * Math.sin(f / 5)} fill="rgba(141,255,168,0.2)" stroke={GREEN} strokeWidth={3} />
        <text x={960} y={260} textAnchor="middle" fill={GREEN} fontFamily={MONO} fontSize={16} letterSpacing={3}>{`NÚCLEO · ALINHAMENTO ${Math.round(al)}%`}</text>
        {/* os dois caminhos */}
        {paths > 0 ? (
          <g>
            <path d={`M ${G.x - 30} ${G.y} C 700 ${G.y} 520 500 ${lerp(G.x, 420, paths)} ${lerp(G.y, 360, paths)}`} fill="none" stroke={AMB} strokeWidth={6} opacity={0.6 + 0.4 * Math.sin(f / 8)} />
            <path d={`M ${G.x + 30} ${G.y} C 1220 ${G.y} 1400 500 ${lerp(G.x, 1500, paths)} ${lerp(G.y, 360, paths)}`} fill="none" stroke={GREEN} strokeWidth={6} opacity={0.6 + 0.4 * Math.sin(f / 8 + 2)} />
            {f >= a(p.leftAt) ? (
              <g opacity={P(f, a(p.leftAt), 10)}>
                <rect x={360} y={300} width={120} height={80} fill="rgba(255,178,46,0.12)" stroke={AMB} strokeWidth={3} />
                <text x={420} y={420} textAnchor="middle" fill={AMB} fontFamily={MONO} fontSize={15} letterSpacing={3}>SISTEMA DE USO</text>
              </g>
            ) : null}
            {f >= a(p.rightAt) ? (
              <g opacity={P(f, a(p.rightAt), 10)}>
                <rect x={1440} y={300} width={120} height={80} fill="rgba(141,255,168,0.12)" stroke={GREEN} strokeWidth={3} />
                <text x={1500} y={420} textAnchor="middle" fill={GREEN} fontFamily={MONO} fontSize={15} letterSpacing={3}>LANÇAR O NÚCLEO</text>
              </g>
            ) : null}
          </g>
        ) : null}
        {/* rebeldes / advisors */}
        {f >= a(p.barneyAt) ? [0, 1, 2, 3].map((k) => <circle key={k} cx={lerp(300, 620 + k * 40, P(f, a(p.barneyAt), 50))} cy={900 - k * 10} r={10} fill={GREEN} opacity={0.9} />) : null}
        {f >= a(p.advAt) ? [0, 1, 2].map((k) => <path key={k} d={`M ${lerp(1640, 1320 - k * 50, P(f, a(p.advAt), 80))} ${880 - k * 30} l 18 30 l -36 0 Z`} fill="rgba(199,155,255,0.25)" stroke={VIO} strokeWidth={2.5} />) : null}
        {/* Gordon e Alyx */}
        <circle cx={G.x} cy={G.y} r={16} fill={CREAM} />
        <circle cx={G.x + 50} cy={G.y + 30} r={14} fill={AMB} />
        {/* o G-Man (maleta) no fundo */}
        {f >= a(p.gmanAt) ? (
          <g opacity={P(f, a(p.gmanAt), 40) * 0.75} transform="translate(960 930)">
            <rect x={-26} y={-18} width={52} height={36} rx={3} fill="none" stroke={CREAM} strokeWidth={2} />
            <path d="M -10 -18 L -10 -26 L 10 -26 L 10 -18" fill="none" stroke={CREAM} strokeWidth={2} />
          </g>
        ) : null}
      </svg>
      {f >= a(p.twoAt) && f < a(p.alyxAt) ? (
        <div style={{ position: "absolute", left: 70, top: 120, width: 560, opacity: P(f, a(p.twoAt), 8) }}>
          {f >= a(p.useAt) ? <div style={{ fontSize: 20, letterSpacing: 3, color: AMB, opacity: P(f, a(p.useAt), 8) }}>USAR · ACABAR COM OS COMBINE AGORA · CONFIAR QUE NINGUÉM USA DE NOVO</div> : null}
          {f >= a(p.colAt) ? <div style={{ fontSize: 20, letterSpacing: 3, color: GREEN, marginTop: 14, opacity: P(f, a(p.colAt), 8) }}>COLAPSAR · QUEBRAR A CONVERGÊNCIA · SACRIFICAR A TERRA · SEM GARANTIA</div> : null}
        </div>
      ) : null}
      {f >= a(p.alyxAt) && f < a(p.choiceAt) ? <div style={{ position: "absolute", left: 0, right: 0, bottom: 60, textAlign: "center", fontSize: 40, letterSpacing: 3, color: AMB, opacity: P(f, a(p.alyxAt), 8) }}>{f >= a(p.pleaseAt) ? "“GORDON, POR FAVOR. CONFIA EM MIM MAIS UMA VEZ.”" : "ALYX OLHA PRO GORDON"}</div> : null}
      {f >= a(p.noMenuAt) ? <div style={{ position: "absolute", right: 70, top: 120, fontSize: 18, letterSpacing: 4, color: "rgba(255,226,176,0.6)", opacity: P(f, a(p.noMenuAt), 8) }}>NENHUMA OPÇÃO ESCRITA NA TELA</div> : null}
      {f >= a(p.waitAt) ? <div style={{ position: "absolute", left: 0, right: 0, bottom: 60, textAlign: "center", fontSize: 26, letterSpacing: 5, color: CREAM, opacity: P(f, a(p.waitAt), 8) }}>TALVEZ ELE TAMBÉM ESTEJA ESPERANDO PARA DESCOBRIR</div> : null}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------- 12B) e você?
// um campo de comentário genérico (sem marca) com as duas escolhas como botões; o cursor digita "EU ESCOLHERIA ___
// PORQUE ___"; depois um marcador "VOLTE AQUI DEPOIS DO VÍDEO".
export const HLCommentCall: React.FC<{ life: number; stopAt?: number; playerAt?: number; twoAt?: number; useAt?: number; destAt?: number; beforeAt?: number; commAt?: number; nowAt?: number; backAt?: number; reactAt?: number; feelAt?: number }> = (p) => {
  const f = useCurrentFrame();
  const N = 1e9;
  const a = (v?: number) => v ?? N;
  void p.life;
  const sel = f >= a(p.commAt) ? Math.floor((f - a(p.commAt)) / 45) % 2 : -1;
  return (
    <AbsoluteFill style={{ background: BG9("#0c0b0a"), overflow: "hidden", fontFamily: MONO }}>
      <Title9 t="NO LUGAR DO JOGADOR" col={AMB} o={P(f, a(p.stopAt), 8)} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 200, display: "flex", justifyContent: "center", gap: 50 }}>
        {[
          { at: a(p.useAt), k: "USAR O BOREALIS COMO ARMA", s: "SALVAR QUEM AINDA ESTÁ VIVO · CONFIAR NO DEPOIS", c: AMB },
          { at: a(p.destAt), k: "DESTRUIR O NÚCLEO CONTRA A FERIDA", s: "QUEBRAR O CICLO · LEVAR A TERRA JUNTO", c: GREEN },
        ].map((o, i) =>
          f >= o.at ? (
            <div key={i} style={{ width: 640, padding: "26px 28px", border: `2px solid ${sel === i ? CREAM : o.c}`, borderRadius: 14, background: sel === i ? "rgba(255,226,176,0.08)" : "rgba(8,8,8,0.9)", opacity: flickIn(f, o.at) }}>
              <div style={{ fontSize: 30, letterSpacing: 3, color: o.c }}>{o.k}</div>
              <div style={{ fontSize: 18, letterSpacing: 3, color: "rgba(255,226,176,0.7)", marginTop: 10 }}>{o.s}</div>
            </div>
          ) : null,
        )}
      </div>
      {f >= a(p.commAt) ? (
        <div style={{ position: "absolute", left: 360, right: 360, top: 560, padding: "22px 26px", border: "1px solid rgba(255,226,176,0.35)", borderRadius: 12, background: "rgba(16,16,16,0.95)", opacity: P(f, a(p.commAt), 8) }}>
          <div style={{ fontSize: 16, letterSpacing: 4, color: "rgba(255,226,176,0.6)" }}>ADICIONE UM COMENTÁRIO…</div>
          <div style={{ fontSize: 30, letterSpacing: 2, color: CREAM, marginTop: 14 }}>
            {typedS(f, a(p.commAt) + 10, "EU ESCOLHERIA ________ PORQUE ________", 1.1)}
            {Math.floor(f / 12) % 2 ? "▌" : ""}
          </div>
        </div>
      ) : null}
      {f >= a(p.nowAt) ? <div style={{ position: "absolute", left: 0, right: 0, top: 790, textAlign: "center", fontSize: 26, letterSpacing: 6, color: RED, opacity: P(f, a(p.nowAt), 8) * (1 - P(f, a(p.backAt), 10)) }}>AGORA · ANTES DE VER A CONSEQUÊNCIA</div> : null}
      {f >= a(p.backAt) ? <div style={{ position: "absolute", left: 0, right: 0, top: 790, textAlign: "center", fontSize: 26, letterSpacing: 6, color: AMB, opacity: P(f, a(p.backAt), 8) }}>DEPOIS DO VÍDEO · VOLTE NO SEU COMENTÁRIO</div> : null}
      {f >= a(p.feelAt) ? <div style={{ position: "absolute", left: 0, right: 0, bottom: 80, textAlign: "center", fontSize: 30, letterSpacing: 5, color: CREAM, opacity: P(f, a(p.feelAt), 8) }}>VOCÊ SÓ ESCOLHE. E DEPOIS VIVE COM AQUILO.</div> : null}
      {void p.playerAt}
      {void p.twoAt}
      {void p.beforeAt}
      {void p.reactAt}
    </AbsoluteFill>
  );
};

// ================================================================================================ MÓDULO 13 · FINAL 1
// ---------------------------------------------------------------------------------------------- F1 · 0) o título
// 30/10 (ele: na minha imitação do G-Man, corta para o IShowSpeed rindo de boca fechada e depois volta): corte seco
// para o vídeo em tela cheia, com um soco de zoom na entrada e um push lento enquanto ele segura o riso; sai seco também
export const HLMemeCut: React.FC<{ life: number; src: string; trim?: number; volume?: number; tag?: string }> = ({ life, src, trim = 0, volume = 0, tag }) => {
  const f = useCurrentFrame();
  const punch = interpolate(f, [0, 5], [1.18, 1.02], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const push = interpolate(f, [5, Math.max(6, life)], [0, 0.07], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const flash = 1 - P(f, 0, 4);
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${punch + push})` }}>
        <OffthreadVideo src={staticFile(src)} startFrom={Math.round(trim * 30)} muted={volume === 0} volume={volume} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)" }} />
      {tag ? <div style={{ position: "absolute", left: 60, bottom: 54, fontFamily: MONO, fontSize: 22, letterSpacing: 5, color: "rgba(242,240,247,0.75)" }}>{tag}</div> : null}
      <AbsoluteFill style={{ background: "#fff", opacity: 0.35 * flash }} />
    </AbsoluteFill>
  );
};

export const HLFinalTitle: React.FC<{ life: number; num?: string; name?: string; subAt?: number; col?: string }> = ({ life, num = "1", name = "A UNIÃO", subAt = 20, col = AMB }) => {
  const f = useCurrentFrame();
  const o = P(f, 0, 20) * (1 - P(f, life - 14, 14));
  // 30/10 (ele: o letreiro passava rápido; tem que ficar mais, reverberando, criando antecipação): empurra devagar
  // para dentro o tempo todo, o brilho respira, e o nome solta ecos que se abrem e somem (o "reverb" do braam)
  const push = interpolate(f, [0, Math.max(1, life)], [1, 1.07], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const breath = 0.5 + 0.5 * Math.sin((f - subAt) / 14);
  const echoes = [0, 34, 68].map((d) => {
    const t = (f - subAt - 12 - d) / 60;
    return t > 0 && t < 1 ? t : -1;
  });
  return (
    // 30/10 (ele: entre o letreiro e a Alyx aparecia a nebulosa do fundo geral): o preto fica sempre opaco; só o
    // conteúdo entra e sai, então a passagem é preto → letreiro → preto → cena, sem nada por baixo vazando
    <AbsoluteFill style={{ background: "#020203", overflow: "hidden", fontFamily: MONO }}>
      <AbsoluteFill style={{ opacity: o }}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 52%, ${col}${Math.round(18 + 14 * breath * P(f, subAt, 20)).toString(16).padStart(2, "0")} 0%, rgba(0,0,0,0) 55%)` }} />
      {/* 30/10 (3ª, ele: nada de arte do Borealis; elementos visuais nossos): a convergência se desfaz em névoa.
          Os três anéis gelados do alinhamento giram atrás do nome e se partem em arcos que se afastam; as quatro linhas do
          tempo entram pelos lados e se desmancham em partículas; tudo vira uma nuvem de partículas macias (gradiente
          radial, sem filtro, sem bordas) que deriva devagar em camadas */}
      {num === "2" ? (() => {
        const brk = P(f, subAt + 6, 70);
        void 0;
        const dots0 = Array.from({ length: 0 }).map((_, i) => {
          const layer = i % 3;
          const sp = 0.25 + layer * 0.35;
          const w = 2200;
          const x = (((i * 173.3) % w) + f * sp) % w - 140;
          const y = 120 + ((i * 97.7) % 900) + Math.sin((f + i * 17) / (60 + layer * 20)) * 14;
          const r = 30 + ((i * 37) % 110) * (0.6 + layer * 0.3);
          const dense = 0.5 + 0.5 * (y / 1080);
          return <circle key={i} cx={x} cy={y} r={r} fill="url(#nvDot)" opacity={(0.05 + 0.05 * layer) * dense * (0.4 + 0.6 * P(f, 0, 40))} />;
        });
        const arcs: React.ReactNode[] = [];
        [[320, 0.36, 1], [250, 0.36, -1], [180, 0.36, 1]].forEach(([R, q, dir], k) => {
          const n = 10 + k * 2;
          for (let j = 0; j < n; j++) {
            const a0 = (j / n) * Math.PI * 2 + f * 0.004 * dir, a1 = a0 + (Math.PI * 2) / n * 0.78;
            const out = brk * (40 + ((j * 53 + k * 31) % 120));
            const mid = (a0 + a1) / 2;
            const dx = Math.cos(mid) * out, dy = Math.sin(mid) * out * q + brk * ((j % 3) - 1) * 20;
            const pts: string[] = [];
            for (let t = 0; t <= 12; t++) {
              const a = a0 + ((a1 - a0) * t) / 12;
              pts.push(`${(960 + dx + Math.cos(a) * R).toFixed(1)},${(545 + dy + Math.sin(a) * R * q).toFixed(1)}`);
            }
            arcs.push(<polyline key={k + "-" + j} points={pts.join(" ")} fill="none" stroke={k === 1 ? "#eaf8ff" : col} strokeWidth={3 - k * 0.5} opacity={(0.75 - 0.15 * k) * (1 - 0.75 * brk)} />);
          }
        });
        return (
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
            <defs>
              <radialGradient id="nvBand"><stop offset="0" stopColor="#bfe2f0" stopOpacity={0.28} /><stop offset="0.6" stopColor="#bfe2f0" stopOpacity={0.1} /><stop offset="1" stopColor="#bfe2f0" stopOpacity={0} /></radialGradient>
              <radialGradient id="nvDot"><stop offset="0" stopColor="#d6f0fb" stopOpacity={1} /><stop offset="0.5" stopColor="#bfe6f6" stopOpacity={0.35} /><stop offset="1" stopColor="#bfe6f6" stopOpacity={0} /></radialGradient>
              <linearGradient id="nvLine" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor={col} stopOpacity={0.8} /><stop offset="1" stopColor={col} stopOpacity={0} /></linearGradient>
              <linearGradient id="nvLineR" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stopColor={col} stopOpacity={0.8} /><stop offset="1" stopColor={col} stopOpacity={0} /></linearGradient>
            </defs>
            <rect width={1920} height={1080} fill="#03070b" />
            {/* as linhas do tempo entrando e se desmanchando */}
            {[300, 450, 640, 800].map((y, k) => {
              const left = k % 2 === 0;
              const len = 560 * P(f, k * 6, 50);
              return (
                <g key={k}>
                  <line x1={left ? 0 : 1920} y1={y} x2={left ? len : 1920 - len} y2={y} stroke={`url(#${left ? "nvLine" : "nvLineR"})`} strokeWidth={2.5} />
                  {Array.from({ length: 16 }).map((_, j) => {
                    const t = (((f + j * 9 + k * 13) % 90) / 90);
                    const x0 = left ? len : 1920 - len;
                    const x = x0 + (left ? 1 : -1) * t * 220;
                    return <circle key={j} cx={x} cy={y + Math.sin(j * 2.1 + f / 20) * 18 * t} r={1.5 + 1.5 * (1 - t)} fill="#eaf8ff" opacity={0.6 * (1 - t) * P(f, k * 6 + 30, 20)} />;
                  })}
                </g>
              );
            })}
            {/* 30/10 (4ª, ele: a névoa espalhada pela tela toda não ficou boa): um banco de névoa só, baixo, em faixas largas
                e lisas, que sobe devagar até engolir a base dos anéis; o alto fica limpo */}
            <g transform={`translate(0 ${120 * (1 - P(f, 0, Math.max(1, life)))})`}>
              {[[980, 0.35, 1300, 120, 0.3], [900, 0.6, 1100, 110, -0.4], [830, 0.25, 1400, 100, 0.5], [760, 0.7, 1000, 80, -0.3], [700, 0.45, 900, 60, 0.35]].map(([y, x0, rx, ry, sp], i) => (
                <ellipse key={i} cx={1920 * (x0 as number) + f * (sp as number)} cy={y} rx={rx} ry={ry} fill="url(#nvBand)" opacity={(0.9 - i * 0.12) * P(f, i * 4, 30)} />
              ))}
              <rect x={0} y={990} width={1920} height={200} fill="#9ccbe0" opacity={0.08} />
            </g>
            {arcs}
            {/* o centro: o ponto da convergência apagando */}
            <circle cx={960} cy={545} r={60 + 40 * brk} fill="url(#nvDot)" opacity={0.5 * (1 - 0.7 * brk)} />
            {/* neve fina e as faíscas dos arcos */}
            {Array.from({ length: 80 }).map((_, i) => {
              const x = ((i * 211.7) % 1920) + Math.sin((f + i * 13) / 30) * 24, y = ((i * 97.3 + f * (0.9 + (i % 4) * 0.4)) % 1140) - 30;
              return <circle key={"s" + i} cx={x} cy={y} r={0.8 + (i % 3) * 0.6} fill="#eaf8ff" opacity={0.4} />;
            })}
            <rect width={1920} height={1080} fill="url(#nvVig)" />
            <defs><radialGradient id="nvVig" cx="50%" cy="50%" r="70%"><stop offset="0.55" stopColor="#000" stopOpacity={0} /><stop offset="1" stopColor="#000" stopOpacity={0.75} /></radialGradient></defs>
          </svg>
        );
      })() : null}
      {/* 30/10 (ele: os letreiros dos finais estavam genéricos): cada final tem a sua imagem por trás do nome.
          Final 1 · A União: o emblema humano (lambda) e o Combine vêm dos lados e se fundem num anel dourado (o catalisador).
          Final 2 · A Névoa: camadas de névoa gelada atravessando, neve caindo e o Borealis aparecendo e sumindo dentro dela. */}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {num === "2" ? null : (
          (() => {
            // 30/10 (2ª, ele: os ícones não faziam sentido e o lambda ficou feio): sem emblemas. Duas correntes de luz, a
            // humanidade (verde) e o Combine (ciano), vêm dos lados ondulando, se entrelaçam como uma trança no centro e
            // ali viram uma só cor, o dourado do catalisador, que abre os anéis atrás do nome
            const m = interpolate(f, [0, subAt + 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
            const ring = P(f, subAt + 26, 40);
            const mix = (c1: [number, number, number], c2: [number, number, number], t: number) => `rgb(${c1.map((v, i) => Math.round(v + (c2[i] - v) * t)).join(",")})`;
            const G: [number, number, number] = [141, 255, 168], CY: [number, number, number] = [159, 230, 255], AU: [number, number, number] = [255, 210, 122];
            const strand = (side: -1 | 1, base: [number, number, number]) => {
              const out: React.ReactNode[] = [];
              const N = 70;
              for (let i = 0; i < N; i++) {
                const u = i / (N - 1); // 0 = borda, 1 = centro
                if (u > m) break;
                const x = 960 + side * (1000 * (1 - u));
                const amp = 120 * (1 - u) + 40;
                const ph = u * 9 - f * 0.08 + (side > 0 ? Math.PI : 0);
                const y = 545 + Math.sin(ph) * amp * 0.5;
                const front = Math.cos(ph) > 0;
                const toGold = Math.max(0, (u - 0.7) / 0.3) * (0.4 + 0.6 * ring);
                const c = mix(base, AU, toGold);
                out.push(<circle key={i} cx={x} cy={y} r={(front ? 5 : 3) * (0.6 + 0.8 * u)} fill={c} opacity={(front ? 0.9 : 0.4) * (0.3 + 0.7 * u)} />);
                if (i % 2 === 0) out.push(<circle key={"g" + i} cx={x} cy={y} r={18 * (0.5 + u)} fill={c} opacity={0.06} />);
              }
              return out;
            };
            return (
              <g>
                {/* poeira ao fundo */}
                {Array.from({ length: 70 }).map((_, i) => <circle key={"d" + i} cx={(i * 263.1 + f * 0.3) % 1920} cy={(i * 131.7) % 1080} r={0.8 + (i % 3) * 0.5} fill="#ffe2b0" opacity={0.18} />)}
                {strand(-1, G)}
                {strand(1, CY)}
                {/* o encontro: o catalisador */}
                <circle cx={960} cy={545} r={30 + 70 * ring} fill={col} opacity={0.12 + 0.1 * ring} />
                {ring > 0
                  ? [1, 0.78, 0.56].map((sc, i) => <ellipse key={i} cx={960} cy={545} rx={360 * sc * ring} ry={360 * sc * ring * 0.34} fill="none" stroke={i % 2 ? "#fff2d8" : col} strokeWidth={2.5} opacity={0.55 * ring} strokeDasharray={`${70 + i * 24} 16`} strokeDashoffset={(f * (i % 2 ? -4 : 5)) % 500} />)
                  : null}
                <text x={480} y={860} textAnchor="middle" fill="#8dffa8" fontFamily={MONO} fontSize={16} letterSpacing={8} opacity={0.55 * P(f, 10, 20) * (1 - ring)}>HUMANIDADE</text>
                <text x={1440} y={860} textAnchor="middle" fill="#9fe6ff" fontFamily={MONO} fontSize={16} letterSpacing={8} opacity={0.55 * P(f, 10, 20) * (1 - ring)}>COMBINE</text>
              </g>
            );
          })()
        )}
      </svg>
      <AbsoluteFill style={{ transform: `scale(${push})` }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 420, textAlign: "center", fontSize: 26, letterSpacing: 20, color: "rgba(255,226,176,0.6)" }}>{`FINAL ${num}`}</div>
      {echoes.map((t, i) =>
        t >= 0 ? (
          <div key={i} style={{ position: "absolute", left: 0, right: 0, top: 470, textAlign: "center", fontSize: 110, letterSpacing: 24, color: col, opacity: 0.35 * (1 - t), transform: `scale(${1 + 0.18 * t})`, filter: `blur(${2 + 6 * t}px)` }}>{name}</div>
        ) : null,
      )}
      <div style={{ position: "absolute", left: 0, right: 0, top: 470, textAlign: "center", fontSize: 110, letterSpacing: 24, color: col, opacity: P(f, subAt, 20), textShadow: `0 0 ${30 + 30 * breath}px ${col}66` }}>{name}</div>
      <div style={{ position: "absolute", left: 760, right: 760, top: 640, height: 2, background: col, transform: `scaleX(${P(f, subAt + 10, 30) + 0.6 * P(f, subAt + 40, 90)})`, opacity: 0.6 }} />
      </AbsoluteFill>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------- F1 · 1) o redirecionamento
// a sala do núcleo vista de cima: o caminho verde (colapso) acende primeiro (a sequência que a Alyx preparou); Gordon vai
// para os controles físicos (âmbar) e INTERROMPE; o fluxo de energia que ia para a ferida faz uma curva e vira um feixe
// para fora: o disparo. A Alyx segura o núcleo estável (anel).
export const HLRedirect: React.FC<{ life: number; notAt?: number; insideAt?: number; limitAt?: number; twoAt?: number; colAt?: number; useAt?: number; saveAt?: number; stopAt?: number; helpAt?: number; holdAt?: number; ctrlAt?: number; flowAt?: number; turnAt?: number; shotAt?: number }> = (p) => {
  const f = useCurrentFrame();
  const N = 1e9;
  const a = (v?: number) => v ?? N;
  void p.life;
  const C0 = { x: 960, y: 420 };
  const W = { x: 960, y: 860 };
  const turn = P(f, a(p.turnAt), 40);
  const flowPts = Array.from({ length: 10 }).map((_, i) => {
    const t = ((f - a(p.flowAt)) / 40 + i / 10) % 1;
    const toWound = { x: lerp(C0.x, W.x, t), y: lerp(C0.y, W.y, t) };
    const toOut = { x: lerp(C0.x, 1900, t), y: lerp(C0.y, 200, t) - Math.sin(t * Math.PI) * 80 };
    return { x: lerp(toWound.x, toOut.x, turn), y: lerp(toWound.y, toOut.y, turn) };
  });
  return (
    <AbsoluteFill style={{ background: BG9("#0a0a0c"), overflow: "hidden", fontFamily: MONO }}>
      <Title9 t={f >= a(p.shotAt) ? "O DISPARO" : f >= a(p.stopAt) ? "GORDON · CONTROLES FÍSICOS" : "O NÚCLEO · NO LIMITE"} col={f >= a(p.stopAt) ? AMB : GREEN} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <rect x={300} y={180} width={1320} height={820} fill="none" stroke="rgba(255,226,176,0.25)" strokeWidth={3} />
        {/* núcleo */}
        <circle cx={C0.x} cy={C0.y} r={46 + 6 * Math.sin(f / 5)} fill="rgba(141,255,168,0.2)" stroke={GREEN} strokeWidth={3} />
        {f >= a(p.holdAt) ? <circle cx={C0.x} cy={C0.y} r={80 + 4 * Math.sin(f / 7)} fill="none" stroke={AMB} strokeWidth={3} strokeDasharray="10 8" strokeDashoffset={-f} /> : null}
        {f >= a(p.holdAt) ? <text x={C0.x + 100} y={C0.y - 70} fill={AMB} fontFamily={MONO} fontSize={16} letterSpacing={3} opacity={P(f, a(p.holdAt), 8)}>ALYX · ESTABILIZANDO</text> : null}
        {/* ferida */}
        <path d={`M ${W.x} ${W.y - 60} C ${W.x + 30} ${W.y - 10} ${W.x - 20} ${W.y + 30} ${W.x} ${W.y + 70} C ${W.x - 30} ${W.y + 30} ${W.x + 20} ${W.y - 10} ${W.x} ${W.y - 60} Z`} fill="rgba(141,255,168,0.2)" stroke={GREEN} strokeWidth={2} />
        {/* caminho do colapso */}
        {f >= a(p.colAt) ? <line x1={C0.x} y1={C0.y + 50} x2={W.x} y2={W.y - 60} stroke={GREEN} strokeWidth={5} strokeDasharray="12 8" opacity={(1 - turn) * (0.6 + 0.4 * Math.sin(f / 6))} /> : null}
        {f >= a(p.colAt) && turn < 1 ? <text x={W.x + 60} y={W.y} fill={GREEN} fontFamily={MONO} fontSize={16} letterSpacing={3} opacity={1 - turn}>SEQUÊNCIA DO COLAPSO</text> : null}
        {f >= a(p.stopAt) ? (
          <g opacity={flickIn(f, a(p.stopAt)) * (1 - turn)}>
            <line x1={C0.x - 30} y1={(C0.y + W.y) / 2 - 30} x2={C0.x + 30} y2={(C0.y + W.y) / 2 + 30} stroke={RED} strokeWidth={6} />
            <line x1={C0.x + 30} y1={(C0.y + W.y) / 2 - 30} x2={C0.x - 30} y2={(C0.y + W.y) / 2 + 30} stroke={RED} strokeWidth={6} />
          </g>
        ) : null}
        {/* controles físicos */}
        {f >= a(p.ctrlAt) ? (
          <g opacity={P(f, a(p.ctrlAt), 10)}>
            <rect x={360} y={360} width={160} height={110} fill="rgba(255,178,46,0.12)" stroke={AMB} strokeWidth={3} />
            {[0, 1, 2].map((k) => (
              <rect key={k} x={380 + k * 46} y={395 + (Math.floor(f / 10 + k) % 2) * 20} width={30} height={30} fill={AMB} opacity={0.7} />
            ))}
            <circle cx={560} cy={420} r={14} fill={CREAM} />
            <text x={440} y={500} textAnchor="middle" fill={AMB} fontFamily={MONO} fontSize={15} letterSpacing={3}>GORDON · CONFIGURAÇÃO FINAL</text>
          </g>
        ) : null}
        {/* a energia */}
        {f >= a(p.flowAt) ? flowPts.map((q, i) => <circle key={i} cx={q.x} cy={q.y} r={7} fill={turn > 0.5 ? AMB : GREEN} opacity={0.9} />) : null}
        {f >= a(p.shotAt) ? <line x1={C0.x} y1={C0.y} x2={1920} y2={160} stroke={AMB} strokeWidth={8 + 4 * Math.sin(f / 3)} opacity={P(f, a(p.shotAt), 6)} style={{ filter: `drop-shadow(0 0 12px ${AMB})` }} /> : null}
      </svg>
      {f >= a(p.notAt) && f < a(p.colAt) ? <div style={{ position: "absolute", left: 0, right: 0, bottom: 90, textAlign: "center", fontSize: 26, letterSpacing: 5, color: "rgba(255,226,176,0.6)", opacity: P(f, a(p.notAt), 8) }}>NENHUMA OPÇÃO NA TELA · A DECISÃO É DENTRO DO NÚCLEO</div> : null}
      {f >= a(p.useAt) && f < a(p.stopAt) ? <div style={{ position: "absolute", right: 80, top: 140, fontSize: 20, letterSpacing: 3, color: AMB, opacity: P(f, a(p.useAt), 8) }}>OU · USAR O MESMO INSTANTE</div> : null}
      {void p.insideAt}
      {void p.limitAt}
      {void p.twoAt}
      {void p.saveAt}
      {void p.helpAt}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------- F1 · 2) a remoção
// o mapa da Terra com os nós da Union; a assinatura é carregada (CÓDIGO DE IDENTIFICAÇÃO, não coordenada); o disparo: anéis de
// ruptura aparecem em vários pontos e os nós somem um a um (rótulos STRIDER · GUNSHIP · SOLDADOS · SYNTHS · ADVISORS);
// contador de nós caindo; SEM EXPLOSÃO.
export const HLRemoval: React.FC<{ life: number; hypAt?: number; netAt?: number; notOwAt?: number; sigAt?: number; loadAt?: number; idAt?: number; nodeAt?: number; seqAt?: number; fireAt?: number; nobodyAt?: number; ruptAt?: number; striderAt?: number; gunAt?: number; soldAt?: number; synthAt?: number; advAt?: number; noBoomAt?: number; removeAt?: number }> = (p) => {
  const f = useCurrentFrame();
  const N = 1e9;
  const a = (v?: number) => v ?? N;
  void p.life;
  const nodes = Array.from({ length: 70 }).map((_, i) => ({ x: 140 + rnd(i * 1.7) * 1640, y: 200 + rnd(i * 3.1) * 660, k: i % 9 === 0 ? 2 : i % 4 === 0 ? 1 : 0, at: a(p.ruptAt) + rnd(i * 5.3) * Math.max(60, a(p.removeAt) - a(p.ruptAt)) }));
  const alive = nodes.filter((n) => !(f >= n.at && f >= a(p.ruptAt))).length;
  const tags = [
    { at: a(p.striderAt), k: "STRIDER · DESAPARECE NA RUA", x: 420, y: 330 },
    { at: a(p.gunAt), k: "GUNSHIP · SOME DO CÉU", x: 1300, y: 260 },
    { at: a(p.soldAt), k: "SOLDADOS · INSTALAÇÕES INTEIRAS", x: 760, y: 700 },
    { at: a(p.synthAt), k: "SYNTHS · JUNTOS", x: 1500, y: 640 },
    { at: a(p.advAt), k: "ADVISORS · OS NÓS MAIS FORTES", x: 960, y: 460 },
  ];
  return (
    <AbsoluteFill style={{ background: BG9("#0e0808"), overflow: "hidden", fontFamily: MONO }}>
      <Title9 t={f >= a(p.fireAt) ? "O BOREALIS DISPARA" : "A HIPÓTESE · REDE LOCAL DA UNION"} col={f >= a(p.fireAt) ? AMB : RED} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {nodes.map((n, i) =>
          nodes.slice(i + 1, i + 2).map((m, j) => {
            const gone = (f >= n.at || f >= m.at) && f >= a(p.ruptAt);
            return gone ? null : <line key={i + "-" + j} x1={n.x} y1={n.y} x2={m.x} y2={m.y} stroke={RED} strokeWidth={1} opacity={P(f, a(p.netAt), 20) * 0.35} />;
          }),
        )}
        {nodes.map((n, i) => {
          const gone = f >= n.at && f >= a(p.ruptAt);
          const t = gone ? Math.min(1, (f - n.at) / 18) : 0;
          if (t >= 1) return null;
          return (
            <g key={"n" + i} opacity={P(f, a(p.netAt) + (i % 10), 8)}>
              <circle cx={n.x} cy={n.y} r={(n.k === 2 ? 12 : n.k === 1 ? 7 : 4) * (1 - t)} fill={n.k === 2 ? VIO : RED} />
              {gone ? <circle cx={n.x} cy={n.y} r={8 + t * 40} fill="none" stroke={AMB} strokeWidth={2} opacity={1 - t} /> : null}
            </g>
          );
        })}
      </svg>
      {f >= a(p.sigAt) && f < a(p.fireAt) ? (
        <div style={{ position: "absolute", right: 80, top: 140, width: 520, padding: "16px 20px", border: `1px solid ${AMB}`, borderRadius: 8, background: "rgba(14,10,4,0.9)", opacity: P(f, a(p.sigAt), 8) }}>
          <div style={{ fontSize: 15, letterSpacing: 4, color: AMB }}>{f >= a(p.loadAt) ? "BOREALIS · CARREGANDO" : "ASSINATURA COMUM"}</div>
          {f >= a(p.idAt) ? <div style={{ fontSize: 22, letterSpacing: 3, color: CREAM, marginTop: 8, opacity: P(f, a(p.idAt), 8) }}>IDENTIFICAÇÃO · NÃO COORDENADA</div> : null}
          {f >= a(p.nodeAt) ? <div style={{ fontSize: 18, letterSpacing: 3, color: RED, marginTop: 6, opacity: P(f, a(p.nodeAt), 8) }}>ALVO: QUALQUER NÓ QUE RESPONDA</div> : null}
        </div>
      ) : null}
      {f >= a(p.notOwAt) && f < a(p.sigAt) ? <div style={{ position: "absolute", left: 70, top: 110, fontSize: 18, letterSpacing: 3, color: "rgba(255,226,176,0.6)", opacity: P(f, a(p.notOwAt), 8) }}>NÃO A OVERWORLD · O SUPERPORTAL CORTOU</div> : null}
      {tags.map((t, i) => (f >= t.at ? <div key={i} style={{ position: "absolute", left: t.x, top: t.y, fontSize: 16, letterSpacing: 3, color: AMB, opacity: flickIn(f, t.at) * (1 - P(f, t.at + 90, 20)), textShadow: "0 2px 6px #000" }}>{t.k}</div> : null))}
      {f >= a(p.ruptAt) ? <div style={{ position: "absolute", right: 80, bottom: 70, fontSize: 30, letterSpacing: 4, color: RED }}>{`NÓS ATIVOS ${alive}`}</div> : null}
      {f >= a(p.noBoomAt) ? <div style={{ position: "absolute", left: 80, bottom: 70, fontSize: 26, letterSpacing: 5, color: CREAM, opacity: P(f, a(p.noBoomAt), 8) }}>{f >= a(p.removeAt) ? "O BOREALIS REMOVE OS COMBINE DA TERRA" : "SEM EXPLOSÃO"}</div> : null}
      {f >= a(p.nobodyAt) && f < a(p.ruptAt) ? <div style={{ position: "absolute", left: 0, right: 0, top: 480, textAlign: "center", fontSize: 30, letterSpacing: 6, color: CREAM, opacity: P(f, a(p.nobodyAt), 8) }}>NINGUÉM SABE SE A TEORIA ESTAVA CERTA</div> : null}
      {void p.hypAt}
      {void p.seqAt}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------- F1 · 3) livre
// os nós que sumiram viram setas para fora do mapa (MUNDO FRONTEIRA? · ALGUM LUGAR NO TEMPO?); as transmissões param (ondas
// caindo em linha reta), instalações ficam mudas; contador da ocupação chega a zero; ressalvas (não destrói a Overworld,
// nem outros mundos, nem outras linhas); A HUMANIDADE ESTÁ LIVRE.
export const HLFreeEarth: React.FC<{ life: number; notDeadAt?: number; whereAt?: number; frontAt?: number; timeAt?: number; matterAt?: number; worksAt?: number; fallAt?: number; txAt?: number; muteAt?: number; endAt?: number; notOwAt?: number; otherAt?: number; goneAt?: number; freeAt?: number }> = (p) => {
  const f = useCurrentFrame();
  const N = 1e9;
  const a = (v?: number) => v ?? N;
  void p.life;
  const occ = f >= a(p.endAt) ? 0 : f >= a(p.fallAt) ? Math.max(0, Math.round(100 - (f - a(p.fallAt)) * 0.6)) : 100;
  const free = P(f, a(p.freeAt), 30);
  return (
    <AbsoluteFill style={{ background: free > 0 ? `radial-gradient(ellipse at 50% 60%, rgba(255,226,176,${0.12 * free}) 0%, #050505 70%)` : BG9("#0a0a0a"), overflow: "hidden", fontFamily: MONO }}>
      <Title9 t={free > 0.5 ? "A TERRA" : "DR. KLEINER · PARA ONDE?"} col={free > 0.5 ? CREAM : GREEN} />
      {free < 1 ? (
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: 1 - free }}>
          {f >= a(p.whereAt)
            ? Array.from({ length: 12 }).map((_, i) => {
                const t = ((f - a(p.whereAt)) / 60 + i / 12) % 1;
                const y = 200 + i * 55;
                return <line key={i} x1={lerp(500, 1700, t)} y1={y} x2={lerp(500, 1700, t) + 60} y2={y} stroke={RED} strokeWidth={2} opacity={1 - t} />;
              })
            : null}
          {f >= a(p.frontAt) ? <text x={1700} y={300} textAnchor="end" fill={ICE} fontFamily={MONO} fontSize={20} letterSpacing={4} opacity={P(f, a(p.frontAt), 8)}>UM MUNDO FRONTEIRA?</text> : null}
          {f >= a(p.timeAt) ? <text x={1700} y={360} textAnchor="end" fill={VIO} fontFamily={MONO} fontSize={20} letterSpacing={4} opacity={P(f, a(p.timeAt), 8)}>ALGUM LUGAR NO TEMPO?</text> : null}
          {f >= a(p.txAt)
            ? Array.from({ length: 5 }).map((_, i) => {
                const flat = P(f, a(p.txAt) + i * 8, 20);
                return <polyline key={"w" + i} points={Array.from({ length: 60 }).map((__, k) => `${200 + k * 10},${700 + i * 50 + Math.sin(k * 0.6 + f * 0.3) * 16 * (1 - flat)}`).join(" ")} fill="none" stroke={RED} strokeWidth={2} opacity={0.7} />;
              })
            : null}
          {f >= a(p.txAt) ? <text x={200} y={680} fill={RED} fontFamily={MONO} fontSize={16} letterSpacing={3}>TRANSMISSÕES · INSTALAÇÕES</text> : null}
        </svg>
      ) : null}
      {f >= a(p.notDeadAt) && free < 1 ? <div style={{ position: "absolute", left: 120, top: 180, width: 700, fontSize: 30, letterSpacing: 4, color: CREAM, opacity: P(f, a(p.notDeadAt), 8) * (1 - free) }}>NÃO ESTÃO SENDO MORTOS · ESTÃO SENDO DESLOCADOS</div> : null}
      {f >= a(p.fallAt) && free < 1 ? (
        <div style={{ position: "absolute", right: 120, bottom: 120, width: 560, opacity: P(f, a(p.fallAt), 8) * (1 - free) }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 20, letterSpacing: 3, color: RED }}>
            <span>OCUPAÇÃO COMBINE · TERRA</span>
            <span>{`${occ}%`}</span>
          </div>
          <div style={{ height: 14, border: `1px solid ${RED}`, marginTop: 8, position: "relative" }}>
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${occ}%`, background: RED }} />
          </div>
          {f >= a(p.notOwAt) ? <div style={{ fontSize: 16, letterSpacing: 3, color: "rgba(255,226,176,0.6)", marginTop: 14, opacity: P(f, a(p.notOwAt), 8) }}>A OVERWORLD CONTINUA · OUTROS MUNDOS · OUTRAS LINHAS</div> : null}
        </div>
      ) : null}
      {free > 0 ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 400, textAlign: "center", opacity: free }}>
          <div style={{ fontSize: 24, letterSpacing: 8, color: "rgba(255,226,176,0.7)" }}>PELA PRIMEIRA VEZ DESDE A GUERRA DAS SETE HORAS</div>
          <div style={{ fontSize: 96, letterSpacing: 14, color: CREAM, marginTop: 20, textShadow: "0 0 40px rgba(255,226,176,0.4)" }}>A HUMANIDADE ESTÁ LIVRE</div>
        </div>
      ) : null}
      {void p.matterAt}
      {void p.worksAt}
      {void p.muteAt}
      {void p.otherAt}
      {void p.goneAt}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------- F1 · 4) a vitória
// o jogador no controle: o Borealis visto de cima, pontos de pessoas (abraços = pontos que se juntam, armas largadas =
// traços que caem); Barney chega ao Gordon (a cerveja!); a Alyx parada perto do núcleo (ponto âmbar sozinho); o Eli se
// ajoelha ao lado; as promessas; e por alguns segundos o rótulo dela muda para ALYX (sem "agente").
export const HLVictoryWalk: React.FC<{ life: number; ctrlAt?: number; walkAt?: number; cryAt?: number; hugAt?: number; dropAt?: number; barneyAt?: number; beerAt?: number; alyxAt?: number; notAt?: number; trustAt?: number; eliAt?: number; promAt?: number; weapAt?: number; hideAt?: number; believeAt?: number; againAt?: number }> = (p) => {
  const f = useCurrentFrame();
  const N = 1e9;
  const a = (v?: number) => v ?? N;
  void p.life;
  const ppl = Array.from({ length: 26 }).map((_, i) => ({ x: 300 + rnd(i * 1.3) * 1000, y: 260 + rnd(i * 2.7) * 560 }));
  const hug = P(f, a(p.hugAt), 30);
  const ph2 = P(f, a(p.alyxAt), 20);
  const G = { x: lerp(260, 820, P(f, a(p.walkAt), 300)), y: 600 };
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, #12100a 0%, #040403 80%)", overflow: "hidden", fontFamily: MONO }}>
      <Title9 t={ph2 > 0.5 ? "ALYX · PERTO DO NÚCLEO" : "A VITÓRIA · NO CONTROLE DO JOGADOR"} col={AMB} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {ph2 < 1
          ? ppl.map((q, i) => {
              const pair = i % 2 === 0 && i + 1 < ppl.length ? ppl[i + 1] : null;
              const x = pair ? lerp(q.x, (q.x + pair.x) / 2 - 8, hug) : q.x;
              const y = pair ? lerp(q.y, (q.y + pair.y) / 2, hug) : q.y;
              return (
                <g key={i} opacity={1 - ph2}>
                  <circle cx={x + Math.sin(f / 9 + i) * 3} cy={y} r={8} fill={i % 5 === 0 ? RED : CREAM} opacity={0.85} />
                  {i % 5 === 0 && f >= a(p.dropAt) ? <line x1={x + 10} y1={y + lerp(-10, 20, P(f, a(p.dropAt) + i, 14))} x2={x + 26} y2={y + lerp(-4, 22, P(f, a(p.dropAt) + i, 14))} stroke={RED} strokeWidth={3} /> : null}
                  {f >= a(p.cryAt) && i % 7 === 3 ? <circle cx={x} cy={y} r={14 + 4 * Math.sin(f / 5 + i)} fill="none" stroke={ICE} strokeWidth={1.5} opacity={0.6} /> : null}
                </g>
              );
            })
          : null}
        {ph2 < 1 ? <circle cx={G.x} cy={G.y} r={13} fill={AMB} opacity={1 - ph2} /> : null}
        {f >= a(p.barneyAt) && ph2 < 1 ? <circle cx={G.x + lerp(300, 34, P(f, a(p.barneyAt), 30))} cy={G.y - 10} r={12} fill={GREEN} opacity={1 - ph2} /> : null}
        {/* fase 2: o núcleo, a Alyx e o Eli */}
        {ph2 > 0 ? (
          <g opacity={ph2}>
            <circle cx={1100} cy={460} r={60 + 6 * Math.sin(f / 6)} fill="rgba(141,255,168,0.12)" stroke={GREEN} strokeWidth={3} />
            <circle cx={980} cy={600} r={16} fill={AMB} />
            <text x={980} y={650} textAnchor="middle" fill={AMB} fontFamily={MONO} fontSize={16} letterSpacing={3}>{f >= a(p.againAt) ? "ALYX" : "ALYX · EM SILÊNCIO"}</text>
            {f >= a(p.eliAt) ? <circle cx={lerp(700, 940, P(f, a(p.eliAt), 30))} cy={lerp(700, 620, P(f, a(p.eliAt), 30))} r={14} fill={GREEN} /> : null}
            {f >= a(p.eliAt) ? <text x={lerp(700, 900, P(f, a(p.eliAt), 30))} y={lerp(740, 700, P(f, a(p.eliAt), 30))} textAnchor="middle" fill={GREEN} fontFamily={MONO} fontSize={15} letterSpacing={3}>ELI</text> : null}
          </g>
        ) : null}
      </svg>
      {f >= a(p.beerAt) && ph2 < 1 ? (
        <div style={{ position: "absolute", right: 120, top: 200, width: 500, padding: "16px 20px", border: `1px solid ${GREEN}`, borderRadius: 10, background: "rgba(4,14,8,0.9)", opacity: P(f, a(p.beerAt), 8) * (1 - ph2) }}>
          <div style={{ fontSize: 15, letterSpacing: 4, color: GREEN }}>BARNEY</div>
          <div style={{ fontSize: 30, letterSpacing: 3, color: CREAM, marginTop: 8 }}>“AGORA VOCÊ VAI TER QUE PAGAR AQUELA CERVEJA.”</div>
        </div>
      ) : null}
      {ph2 > 0 ? (
        <div style={{ position: "absolute", left: 120, top: 180, width: 680, opacity: ph2 }}>
          {f >= a(p.notAt) ? <div style={{ fontSize: 24, letterSpacing: 3, color: "rgba(255,226,176,0.7)", opacity: P(f, a(p.notAt), 8) }}>GORDON NÃO DESTRUIU O PROBLEMA</div> : null}
          {f >= a(p.trustAt) ? <div style={{ fontSize: 28, letterSpacing: 3, color: CREAM, marginTop: 12, opacity: P(f, a(p.trustAt), 8) }}>CONFIOU QUE A HUMANIDADE SABERIA PARAR</div> : null}
          {f >= a(p.promAt) ? (
            <div style={{ marginTop: 30, padding: "14px 18px", border: `1px solid ${GREEN}`, borderRadius: 8, background: "rgba(4,14,8,0.88)", opacity: P(f, a(p.promAt), 8) }}>
              <div style={{ fontSize: 15, letterSpacing: 4, color: GREEN }}>A PROMESSA DO ELI</div>
              {f >= a(p.weapAt) ? <div style={{ fontSize: 20, letterSpacing: 3, color: CREAM, marginTop: 8 }}>DESTRUIR AS ARMAS QUE SOBRARAM</div> : null}
              {f >= a(p.hideAt) ? <div style={{ fontSize: 20, letterSpacing: 3, color: CREAM, marginTop: 6 }}>ESCONDER O BOREALIS · NUNCA MAIS USAR</div> : null}
            </div>
          ) : null}
          {f >= a(p.believeAt) ? <div style={{ fontSize: 24, letterSpacing: 4, color: AMB, marginTop: 24, opacity: P(f, a(p.believeAt), 8) }}>POR ALGUNS SEGUNDOS, ELA ACREDITA NELE</div> : null}
        </div>
      ) : null}
      {void p.ctrlAt}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------- F1 · 5) o tiro
// o Varga (contato vermelho) entra com homens; o arquivo dele (ASCENSÃO · PERPETUIDADE · CONTINUIDADE DA CONSCIÊNCIA); três
// leituras do Borealis (ELI: enterrar · ALYX: quebrar o ciclo · VARGA: a filha); a pergunta dele; ela se levanta; a briga;
// O DISPARO (linha vermelha); o monitor de sinais vitais da Alyx cai até a linha reta; tiroteio; Varga foge ferido;
// "Eli no chão com a Alyx nos braços".
export const HLVargaShot: React.FC<{ life: number; enterAt?: number; filesAt?: number; eliAt?: number; alyxAt?: number; seesAt?: number; daughterAt?: number; askAt?: number; preserveAt?: number; seenAt?: number; exceptAt?: number; standAt?: number; vargaAt?: number; breakAt?: number; shotAt?: number; fallAt?: number; diesAt?: number; worseAt?: number; notWinAt?: number; fightAt?: number; phaseAt?: number; fleeAt?: number; eliArmsAt?: number; nothingAt?: number }> = (p) => {
  const f = useCurrentFrame();
  const N = 1e9;
  const a = (v?: number) => v ?? N;
  void p.life;
  const shot = f >= a(p.shotAt);
  const bpm = shot ? Math.max(0, 70 - (f - a(p.shotAt)) * 0.35) : 72;
  const flat = shot && bpm <= 2;
  const ph = f >= a(p.fightAt) ? 2 : f >= a(p.askAt) ? 1 : 0;
  const V = { x: lerp(1900, 1380, P(f, a(p.enterAt), 40)), y: 520 };
  const A = { x: 900, y: lerp(560, 600, P(f, a(p.fallAt), 10)) };
  return (
    <AbsoluteFill style={{ background: BG9(shot ? "#120606" : "#0c0a08"), overflow: "hidden", fontFamily: MONO }}>
      <Title9 t={shot ? "ALYX VANCE · SINAIS VITAIS" : "VARGA ENTRA NO NÚCLEO"} col={shot ? RED : CREAM} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {/* a cena (contatos) */}
        <circle cx={A.x} cy={A.y} r={16} fill={AMB} opacity={f >= a(p.diesAt) ? 0.4 : 1} />
        <text x={A.x} y={A.y - 30} textAnchor="middle" fill={AMB} fontFamily={MONO} fontSize={15} letterSpacing={3}>ALYX</text>
        <circle cx={760} cy={640} r={13} fill={CREAM} />
        <text x={760} y={680} textAnchor="middle" fill={CREAM} fontFamily={MONO} fontSize={14} letterSpacing={3}>GORDON</text>
        <circle cx={f >= a(p.eliArmsAt) ? A.x - 30 : 1040} cy={f >= a(p.eliArmsAt) ? A.y + 10 : 640} r={13} fill={GREEN} />
        <text x={f >= a(p.eliArmsAt) ? A.x - 30 : 1040} y={(f >= a(p.eliArmsAt) ? A.y + 10 : 640) + 40} textAnchor="middle" fill={GREEN} fontFamily={MONO} fontSize={14} letterSpacing={3}>ELI</text>
        {f >= a(p.enterAt) && f < a(p.fleeAt) + 40 ? (
          <g opacity={1 - P(f, a(p.fleeAt), 30)}>
            <circle cx={V.x + (f >= a(p.fleeAt) ? (f - a(p.fleeAt)) * 8 : 0)} cy={V.y} r={14} fill={RED} />
            {[0, 1, 2].map((k) => (
              <circle key={k} cx={V.x + 50 + k * 30 + (f >= a(p.fleeAt) ? (f - a(p.fleeAt)) * 8 : 0)} cy={V.y + 40 - k * 20} r={9} fill="rgba(255,93,77,0.6)" />
            ))}
            <text x={V.x} y={V.y - 30} textAnchor="middle" fill={RED} fontFamily={MONO} fontSize={15} letterSpacing={3}>{f >= a(p.fleeAt) ? "VARGA · FERIDO · FOGE" : "VARGA"}</text>
          </g>
        ) : null}
        {shot && f < a(p.shotAt) + 8 ? <line x1={V.x - 20} y1={V.y} x2={A.x + 16} y2={A.y} stroke={RED} strokeWidth={4} /> : null}
        {f >= a(p.fightAt)
          ? Array.from({ length: 10 }).map((_, i) => {
              const t = ((f - a(p.fightAt)) / 10 + i * 0.37) % 1;
              const fromLeft = i % 2 === 0;
              return <line key={i} x1={fromLeft ? lerp(300, 1300, t) : lerp(1700, 700, t)} y1={300 + i * 50} x2={fromLeft ? lerp(300, 1300, t) + 30 : lerp(1700, 700, t) - 30} y2={300 + i * 50} stroke={fromLeft ? GREEN : RED} strokeWidth={2} />;
            })
          : null}
        {f >= a(p.phaseAt) ? <rect x={0} y={0} width={1920} height={1080} fill="rgba(159,230,255,0.06)" opacity={Math.floor(f / 7) % 2} /> : null}
      </svg>
      {/* monitor */}
      {shot ? (
        <div style={{ position: "absolute", left: 120, bottom: 120, width: 760 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 20, letterSpacing: 4, color: flat ? RED : GREEN }}>
            <span>ALYX VANCE</span>
            <span>{flat ? "—" : `${Math.round(bpm)} BPM`}</span>
          </div>
          {flat ? (
            <svg width={760} height={90}>
              <line x1={0} x2={760} y1={45} y2={45} stroke={RED} strokeWidth={3} />
            </svg>
          ) : (
            <Ecg f={f} bpm={Math.max(10, bpm)} jitter={1.4} col={GREEN} w={760} h={90} />
          )}
        </div>
      ) : null}
      {/* textos */}
      {ph === 0 && f >= a(p.filesAt) ? (
        <div style={{ position: "absolute", right: 80, top: 140, width: 560, opacity: P(f, a(p.filesAt), 8) }}>
          <div style={{ fontSize: 15, letterSpacing: 4, color: RED }}>OS ARQUIVOS QUE O VARGA LEU</div>
          {["ASCENSÃO", "PERPETUIDADE", "CONTINUIDADE DA CONSCIÊNCIA"].map((k, i) => (
            <div key={i} style={{ fontSize: 26, letterSpacing: 4, color: CREAM, marginTop: 10, opacity: P(f, a(p.filesAt) + 20 + i * 15, 8) }}>
              {k}
            </div>
          ))}
          {f >= a(p.eliAt) ? <div style={{ fontSize: 18, letterSpacing: 3, color: GREEN, marginTop: 20 }}>ELI · UMA ARMA PARA ENTERRAR</div> : null}
          {f >= a(p.alyxAt) ? <div style={{ fontSize: 18, letterSpacing: 3, color: AMB, marginTop: 6 }}>ALYX · O CENTRO DE UM CICLO</div> : null}
          {f >= a(p.seesAt) ? <div style={{ fontSize: 22, letterSpacing: 3, color: RED, marginTop: 6 }}>{f >= a(p.daughterAt) ? "VARGA · O QUE PODERIA TER SALVO A FILHA DELE" : "VARGA · OUTRA COISA"}</div> : null}
        </div>
      ) : null}
      {ph === 1 && !shot ? (
        <div style={{ position: "absolute", left: 120, top: 150, width: 1000 }}>
          <div style={{ fontSize: 34, letterSpacing: 3, color: RED }}>{`“${typedS(f, a(p.askAt), "POR QUE DESTRUIR? POR QUE NÃO ESTUDAR?", 1.3)}”`}</div>
          {f >= a(p.preserveAt) ? <div style={{ fontSize: 26, letterSpacing: 3, color: CREAM, marginTop: 14 }}>{`“${typedS(f, a(p.preserveAt), "SE DÁ PARA PRESERVAR UMA CONSCIÊNCIA, POR QUE NINGUÉM DEVERIA TENTAR?", 1.5)}”`}</div> : null}
          {f >= a(p.exceptAt) ? <div style={{ fontSize: 24, letterSpacing: 3, color: AMB, marginTop: 30, opacity: P(f, a(p.exceptAt), 8) }}>ALYX JÁ VIU ESSE RACIOCÍNIO · “A ÚLTIMA EXCEÇÃO”</div> : null}
          {f >= a(p.standAt) ? <div style={{ fontSize: 30, letterSpacing: 3, color: AMB, marginTop: 14, opacity: P(f, a(p.standAt), 8) }}>“NINGUÉM MAIS VAI TOCAR NO NÚCLEO.”</div> : null}
          {f >= a(p.vargaAt) ? <div style={{ fontSize: 26, letterSpacing: 3, color: RED, marginTop: 14, opacity: P(f, a(p.vargaAt), 8) }}>“VOCÊ JÁ DECIDIU COISA DEMAIS POR TODO MUNDO.”</div> : null}
        </div>
      ) : null}
      {f >= a(p.worseAt) && f < a(p.fightAt) ? <div style={{ position: "absolute", right: 80, top: 160, width: 680, fontSize: 24, letterSpacing: 3, color: CREAM, opacity: P(f, a(p.worseAt), 8) }}>NO PRIMEIRO MOMENTO EM QUE ELA SE PERMITIU ACREDITAR QUE ESTAVA ERRADA</div> : null}
      {f >= a(p.nothingAt) ? <div style={{ position: "absolute", right: 80, top: 160, width: 600, fontSize: 28, letterSpacing: 4, color: CREAM, opacity: P(f, a(p.nothingAt), 8) }}>GORDON NÃO CONSEGUE FAZER NADA</div> : null}
      {void p.seenAt}
      {void p.breakAt}
      {void p.notWinAt}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------- F1 · 6) o G-Man
// tudo congela: o ruído some, as balas (traços) param no ar, a imagem fica dessaturada; a maleta entra e se aproxima; as
// falas dele aparecem em letras finas no centro, uma de cada vez (sem rosto). Lista opcional de itens (frases).
export const HLGmanFreeze: React.FC<{ life: number; stopAt?: number; gmanAt?: number; lines?: string[]; l0At?: number; l1At?: number; l2At?: number; l3At?: number; l4At?: number; l5At?: number; l6At?: number; l7At?: number; l8At?: number; l9At?: number; note?: string; noteAt?: number }> = (p) => {
  const f = useCurrentFrame();
  const N = 1e9;
  const a = (v?: number) => v ?? N;
  void p.life;
  const lines = p.lines ?? [];
  const ats = [p.l0At, p.l1At, p.l2At, p.l3At, p.l4At, p.l5At, p.l6At, p.l7At, p.l8At, p.l9At].map(a);
  let cur = -1;
  ats.forEach((t, i) => {
    if (i < lines.length && f >= t) cur = i;
  });
  const g = P(f, a(p.gmanAt), 60);
  return (
    <AbsoluteFill style={{ background: "#060607", overflow: "hidden", fontFamily: MONO }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {/* balas congeladas */}
        {Array.from({ length: 14 }).map((_, i) => (
          <line key={i} x1={200 + rnd(i) * 1500} y1={200 + rnd(i * 3) * 700} x2={240 + rnd(i) * 1500} y2={200 + rnd(i * 3) * 700} stroke={i % 2 ? "rgba(255,93,77,0.5)" : "rgba(141,255,168,0.5)"} strokeWidth={2} opacity={P(f, a(p.stopAt), 10) * 0.8} />
        ))}
        {/* a maleta */}
        {f >= a(p.gmanAt) ? (
          <g transform={`translate(${lerp(1700, 1260, g)} ${lerp(900, 760, g)}) scale(${lerp(0.6, 1.4, g)})`} opacity={P(f, a(p.gmanAt), 20)}>
            <rect x={-36} y={-26} width={72} height={52} rx={4} fill="rgba(0,0,0,0.6)" stroke={CREAM} strokeWidth={2.5} />
            <path d="M -14 -26 L -14 -38 L 14 -38 L 14 -26" fill="none" stroke={CREAM} strokeWidth={2.5} />
          </g>
        ) : null}
      </svg>
      {f >= a(p.stopAt) ? <div style={{ position: "absolute", left: 70, top: 56, fontSize: 22, letterSpacing: 8, color: "rgba(255,226,176,0.5)", opacity: P(f, a(p.stopAt), 10) }}>O TEMPO PARA</div> : null}
      {cur >= 0 ? (
        <div key={cur} style={{ position: "absolute", left: 200, right: 200, top: 380, textAlign: "center", fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: "italic", fontSize: 54, lineHeight: 1.3, color: CREAM, opacity: P(f, ats[cur], 14), letterSpacing: 1 }}>
          {lines[cur]}
        </div>
      ) : null}
      {p.note && f >= a(p.noteAt) ? (
        <div style={{ position: "absolute", right: 120, bottom: 120, padding: "10px 18px", border: `2px solid ${AMB}`, color: AMB, fontSize: 22, letterSpacing: 4, transform: "rotate(-4deg)", opacity: P(f, a(p.noteAt), 8) }}>{p.note}</div>
      ) : null}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------- F1 · 7) os participantes
// um tabuleiro com peças do mesmo formato em duas cores (COMBINE vermelho · HUMANOS âmbar); a casa do fim (CATALISADOR); as
// peças vermelhas saem e as âmbar ocupam o mesmo caminho até a mesma casa: PARTICIPANTES TROCADOS · RESULTADO IGUAL. Depois
// a releitura da série: fichas (ajudou Gordon · deixou Advisors morrerem · Combine perderam · Alyx contra os Combine) e o
// rótulo NUNCA TRABALHOU PARA NENHUM LADO · A HISTÓRIA NOS TRILHOS.
export const HLParticipants: React.FC<{ life: number; neverAt?: number; uniAt?: number; combAt?: number; humAt?: number; insideAt?: number; outsideAt?: number; whatAt?: number; contAt?: number; refuseAt?: number; convAt?: number; notAt?: number; altAt?: number; rereadAt?: number; helpAt?: number; advAt?: number; loseAt?: number; alyxAt?: number; sidesAt?: number; railsAt?: number; victAt?: number }> = (p) => {
  const f = useCurrentFrame();
  const N = 1e9;
  const a = (v?: number) => v ?? N;
  void p.life;
  const swap = P(f, a(p.altAt), 60);
  const ph2 = P(f, a(p.rereadAt), 16);
  const path = (t: number) => ({ x: lerp(300, 1500, t), y: 540 + Math.sin(t * Math.PI * 2) * 120 });
  return (
    <AbsoluteFill style={{ background: BG9("#0c0b08"), overflow: "hidden", fontFamily: MONO }}>
      <Title9 t={ph2 > 0.5 ? "RELENDO A SÉRIE" : "O QUE O G-MAN QUER"} col={CREAM} />
      {ph2 < 1 ? (
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: 1 - ph2 }}>
          <path d={Array.from({ length: 40 }).map((_, k) => { const q = path(k / 39); return `${k ? "L" : "M"} ${q.x} ${q.y}`; }).join(" ")} fill="none" stroke="rgba(255,226,176,0.3)" strokeWidth={3} strokeDasharray="8 10" />
          <rect x={1520} y={480} width={120} height={120} fill="rgba(255,178,46,0.12)" stroke={AMB} strokeWidth={3} />
          <text x={1580} y={630} textAnchor="middle" fill={AMB} fontFamily={MONO} fontSize={14} letterSpacing={3}>CATALISADOR</text>
          {[0, 1, 2, 3].map((k) => {
            const t = Math.min(0.95, ((f / 300 + k * 0.2) % 1));
            const q = path(t);
            return (
              <g key={k}>
                <circle cx={q.x} cy={q.y - 20} r={20} fill="none" stroke={RED} strokeWidth={3} opacity={(1 - swap) * P(f, a(p.combAt), 10)} />
                <circle cx={q.x} cy={q.y + 20} r={20} fill="none" stroke={AMB} strokeWidth={3} opacity={swap > 0 ? swap : P(f, a(p.humAt), 10) * 0.4} />
              </g>
            );
          })}
          {f >= a(p.combAt) ? <text x={300} y={350} fill={RED} fontFamily={MONO} fontSize={18} letterSpacing={4} opacity={1 - swap}>COMBINE</text> : null}
          {f >= a(p.humAt) ? <text x={300} y={760} fill={AMB} fontFamily={MONO} fontSize={18} letterSpacing={4}>HUMANOS</text> : null}
        </svg>
      ) : null}
      {ph2 < 1 ? (
        <div style={{ position: "absolute", left: 120, top: 130, width: 1600, opacity: 1 - ph2 }}>
          {f >= a(p.neverAt) ? <div style={{ fontSize: 22, letterSpacing: 3, color: CREAM, opacity: P(f, a(p.neverAt), 8) }}>NUNCA PRECISOU QUE OS COMBINE GANHASSEM · NEM QUE A HUMANIDADE PERDESSE</div> : null}
          {f >= a(p.whatAt) ? <div style={{ fontSize: 22, letterSpacing: 3, color: AMB, marginTop: 10, opacity: P(f, a(p.whatAt), 8) }}>O QUE IMPORTA: QUE ALGUÉM CHEGUE AO CATALISADOR · QUE ALGUÉM SE RECUSE A ACEITAR O PRÓPRIO FIM</div> : null}
        </div>
      ) : null}
      {f >= a(p.altAt) && ph2 < 1 ? <div style={{ position: "absolute", left: 0, right: 0, bottom: 90, textAlign: "center", fontSize: 34, letterSpacing: 5, color: CREAM, opacity: P(f, a(p.altAt), 8) * (1 - ph2) }}>“O SENHOR NÃO IMPEDIU RESULTADOS. APENAS ALTEROU OS PARTICIPANTES.”</div> : null}
      {ph2 > 0 ? (
        <div style={{ position: "absolute", inset: 0, opacity: ph2 }}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 220, display: "flex", justifyContent: "center", gap: 26 }}>
            {[
              { at: a(p.helpAt), k: "AJUDOU O GORDON" },
              { at: a(p.advAt), k: "DEIXOU ADVISORS MORREREM" },
              { at: a(p.loseAt), k: "DEIXOU OS COMBINE PERDEREM" },
              { at: a(p.alyxAt), k: "PÔS A ALYX CONTRA OS COMBINE" },
            ].map((c, i) =>
              f >= c.at ? (
                <div key={i} style={{ width: 360, padding: "22px 20px", border: "1px solid rgba(255,226,176,0.4)", borderRadius: 10, background: "rgba(8,8,8,0.9)", fontSize: 22, letterSpacing: 3, color: CREAM, opacity: flickIn(f, c.at), transform: `rotate(${(i - 1.5) * 1.5}deg)` }}>
                  {c.k}
                </div>
              ) : null,
            )}
          </div>
          {f >= a(p.sidesAt) ? <div style={{ position: "absolute", left: 0, right: 0, top: 480, textAlign: "center", fontSize: 40, letterSpacing: 6, color: AMB, opacity: P(f, a(p.sidesAt), 8) }}>NUNCA TRABALHOU PARA NENHUM DOS LADOS</div> : null}
          {f >= a(p.railsAt) ? <div style={{ position: "absolute", left: 0, right: 0, top: 560, textAlign: "center", fontSize: 28, letterSpacing: 6, color: CREAM, opacity: P(f, a(p.railsAt), 8) }}>O TRABALHO: MANTER A HISTÓRIA NOS TRILHOS</div> : null}
          {f >= a(p.victAt) ? <div style={{ position: "absolute", left: 0, right: 0, top: 680, textAlign: "center", fontSize: 24, letterSpacing: 4, color: GREEN, opacity: P(f, a(p.victAt), 8) }}>E O GORDON ACABOU DE ENTREGAR A MAIOR VITÓRIA DA HUMANIDADE</div> : null}
        </div>
      ) : null}
      {void p.uniAt}
      {void p.insideAt}
      {void p.outsideAt}
      {void p.contAt}
      {void p.refuseAt}
      {void p.convAt}
      {void p.notAt}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------- F1 · 8) o futuro corre
// um contador de anos acelerando; a silhueta da cidade (wireframe) cresce de casas para torres e por fim espigões; eventos
// entram numa linha do tempo à direita, cada um com ano: VÉU NO BOREALIS · CÓDIGOS NO GELO · A CÉLULA DO VARGA · A ESTÁTUA
// DA ALYX (com o Dog) · TECNOLOGIA COMBINE · AS MÁSCARAS · O VÉU CAI. Prop "events" com {at, k, c}.
type FEv = { k: string; at: number; c?: string };
export const HLFutureRun: React.FC<{ life: number; startAt?: number; runAt?: number; y0?: number; y1?: number; events?: FEv[]; e0At?: number; e1At?: number; e2At?: number; e3At?: number; e4At?: number; e5At?: number; e6At?: number; e7At?: number; e8At?: number; e9At?: number; e10At?: number; e11At?: number; statueAt?: number; masksAt?: number; veilAt?: number }> = (p) => {
  const f = useCurrentFrame();
  const N = 1e9;
  const a = (v?: number) => v ?? N;
  const life = p.life;
  const evs = (p.events ?? []).map((e, i) => ({ ...e, at: a([p.e0At, p.e1At, p.e2At, p.e3At, p.e4At, p.e5At, p.e6At, p.e7At, p.e8At, p.e9At, p.e10At, p.e11At][i]) }));
  const t = interpolate(f, [a(p.runAt), life], [0, 1], C);
  const year = Math.floor(lerp(p.y0 ?? 2026, p.y1 ?? 2300, Math.pow(t, 1.6)));
  const growth = t;
  const shown = evs.filter((e) => f >= e.at).slice(-7);
  return (
    <AbsoluteFill style={{ background: BG9("#0a0c10"), overflow: "hidden", fontFamily: MONO }}>
      <Title9 t="O TEMPO CORRE · GORDON PARADO NO MESMO LUGAR" col={ICE} o={P(f, a(p.startAt), 8)} />
      <div style={{ position: "absolute", left: 70, top: 110, fontSize: 90, letterSpacing: 6, color: CREAM, opacity: P(f, a(p.runAt), 10) }}>{year}</div>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <line x1={0} x2={1200} y1={900} y2={900} stroke="rgba(159,230,255,0.4)" strokeWidth={2} />
        {Array.from({ length: 22 }).map((_, i) => {
          const base = 30 + rnd(i) * 60;
          const h = base + growth * (80 + rnd(i * 3) * 380) * (i % 5 === 2 ? 1.6 : 1);
          const x = 60 + i * 52;
          return <rect key={i} x={x} y={900 - h} width={40} height={h} fill="rgba(159,230,255,0.05)" stroke={growth > 0.8 && i % 5 === 2 ? RED : "rgba(159,230,255,0.6)"} strokeWidth={1.5} />;
        })}
        {/* a nova cidadela (fim) */}
        {growth > 0.6 ? <path d={`M 600 900 L 640 ${900 - 620 * (growth - 0.6) * 2.5} L 680 900 Z`} fill="rgba(255,93,77,0.08)" stroke={RED} strokeWidth={2} /> : null}
        {/* a estátua da Alyx + Dog */}
        {f >= a(p.statueAt) ? (
          <g transform="translate(980 900)" opacity={P(f, a(p.statueAt), 14)}>
            <rect x={-30} y={-24} width={60} height={24} fill="none" stroke={CREAM} strokeWidth={2} />
            <path d="M -12 -24 L -14 -120 L 0 -150 L 14 -120 L 12 -24 Z" fill="rgba(255,226,176,0.06)" stroke={CREAM} strokeWidth={2} />
            <text x={0} y={22} textAnchor="middle" fill={CREAM} fontFamily={MONO} fontSize={11} letterSpacing={2}>ALYX VANCE</text>
            <circle cx={46} cy={-14} r={10} fill={GREEN} opacity={1 - P(f, a(p.statueAt) + 300, 60)} />
          </g>
        ) : null}
        {/* máscaras */}
        {f >= a(p.masksAt)
          ? Array.from({ length: 8 }).map((_, i) => (
              <g key={"m" + i} transform={`translate(${120 + i * 120} ${940}) scale(0.18)`} opacity={P(f, a(p.masksAt) + i * 4, 8)}>
                <path d="M -60 -70 C -60 -110 60 -110 60 -70 L 64 10 C 60 60 30 90 0 96 C -30 90 -60 60 -64 10 Z" fill="none" stroke={RED} strokeWidth={10} />
              </g>
            ))
          : null}
        {f >= a(p.veilAt) ? <rect x={0} y={0} width={1920} height={1080} fill="rgba(159,230,255,0.08)" opacity={Math.max(0, 1 - (f - a(p.veilAt)) / 30)} /> : null}
      </svg>
      <div style={{ position: "absolute", right: 70, top: 120, width: 600 }}>
        {shown.map((e, i) => (
          <div key={e.k} style={{ display: "flex", gap: 16, marginTop: 14, padding: "10px 14px", border: `1px solid ${e.c ?? ICE}`, borderRadius: 8, background: "rgba(4,8,12,0.88)", opacity: flickIn(f, e.at) * (0.5 + 0.5 * (i / Math.max(1, shown.length - 1))) }}>
            <span style={{ fontSize: 16, letterSpacing: 2, color: "rgba(255,226,176,0.6)", width: 70 }}>{Math.floor(lerp(p.y0 ?? 2026, p.y1 ?? 2300, Math.pow(interpolate(e.at, [a(p.runAt), life], [0, 1], C), 1.6)))}</span>
            <span style={{ fontSize: 19, letterSpacing: 2, color: e.c ?? CREAM }}>{e.k}</span>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------- F1 · 9) a escada da continuidade
// degraus subindo (SALVAR ALGUÉM QUE MORRERIA → PROLONGAR VIDAS → PRESERVAR OS IMPORTANTES → CONSCIÊNCIA ≠ CORPO); no topo
// a pergunta dos Advisors: SE PODEMOS CONTINUAR, POR QUE ACEITAR O FIM?
export const HLContinuityLadder: React.FC<{ life: number; studyAt?: number; s1At?: number; s2At?: number; s3At?: number; s4At?: number; centAt?: number; qAt?: number }> = (p) => {
  const f = useCurrentFrame();
  const N = 1e9;
  const a = (v?: number) => v ?? N;
  void p.life;
  const steps = [
    { at: a(p.s1At), k: "SALVAR ALGUÉM QUE MORRERIA" },
    { at: a(p.s2At), k: "PROLONGAR VIDAS" },
    { at: a(p.s3At), k: "PRESERVAR QUEM É IMPORTANTE DEMAIS" },
    { at: a(p.s4At), k: "CONSCIÊNCIA ≠ CORPO" },
  ];
  return (
    <AbsoluteFill style={{ background: BG9("#0c0a10"), overflow: "hidden", fontFamily: MONO }}>
      <Title9 t="A HUMANIDADE VOLTA A ESTUDAR O BOREALIS" col={VIO} o={P(f, a(p.studyAt), 8)} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {steps.map((s, i) =>
          f >= s.at ? (
            <g key={i} opacity={flickIn(f, s.at)}>
              <path d={`M ${260 + i * 340} ${880 - i * 150} L ${600 + i * 340} ${880 - i * 150} L ${600 + i * 340} ${730 - i * 150}`} fill="none" stroke={i === 3 ? VIO : CREAM} strokeWidth={4} />
              <text x={280 + i * 340} y={860 - i * 150} fill={i === 3 ? VIO : CREAM} fontFamily={MONO} fontSize={18} letterSpacing={2}>{s.k}</text>
            </g>
          ) : null,
        )}
      </svg>
      {f >= a(p.qAt) ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 180, textAlign: "center", opacity: P(f, a(p.qAt), 10) }}>
          <div style={{ fontSize: 22, letterSpacing: 6, color: "rgba(199,155,255,0.7)" }}>A MESMA PERGUNTA DOS ADVISORS</div>
          <div style={{ fontSize: 52, letterSpacing: 4, color: CREAM, marginTop: 10 }}>SE PODEMOS CONTINUAR, POR QUE ACEITAR O FIM?</div>
        </div>
      ) : null}
      {f >= a(p.centAt) && f < a(p.qAt) ? <div style={{ position: "absolute", left: 70, top: 110, fontSize: 30, letterSpacing: 6, color: CREAM, opacity: P(f, a(p.centAt), 8) }}>SÉCULOS SE PASSAM</div> : null}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------- F1 · 10) a nova união
// duas metades: HUMANIDADE (âmbar, com o Borealis) × COMBINE (vermelho, com o conhecimento que falta); uma lista do que cada
// lado não tem; as metades se aproximam e formam a nova Cidadela (espigão bicolor): A NOVA UNIÃO; a maleta observa ao lado.
export const HLNewUnion: React.FC<{ life: number; citAt?: number; notHumAt?: number; probAt?: number; reactAt?: number; rebuildAt?: number; woundAt?: number; cantAt?: number; filesAt?: number; deadAt?: number; neverAt?: number; seekAt?: number; partAt?: number; alsoAt?: number; neitherAt?: number; humHasAt?: number; combHasAt?: number; alliAt?: number; notForgotAt?: number; sameAt?: number; contAt?: number; centerAt?: number; gmanAt?: number; workAt?: number }> = (p) => {
  const f = useCurrentFrame();
  const N = 1e9;
  const a = (v?: number) => v ?? N;
  void p.life;
  const join = P(f, a(p.alliAt), 60);
  const spire = P(f, a(p.centerAt), 60);
  return (
    <AbsoluteFill style={{ background: BG9("#0c0909"), overflow: "hidden", fontFamily: MONO }}>
      <Title9 t={spire > 0.5 ? "A NOVA CIDADELA · A NOVA UNIÃO" : "UMA NOVA CIDADELA"} col={spire > 0.5 ? CREAM : RED} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <g transform={`translate(${lerp(-260, 0, join)} 0)`}>
          <rect x={360} y={340} width={360} height={420} rx={14} fill="rgba(255,178,46,0.06)" stroke={AMB} strokeWidth={3} opacity={P(f, a(p.probAt), 10)} />
          <text x={540} y={380} textAnchor="middle" fill={AMB} fontFamily={MONO} fontSize={20} letterSpacing={4}>HUMANIDADE</text>
          {f >= a(p.humHasAt) ? <text x={540} y={560} textAnchor="middle" fill={CREAM} fontFamily={MONO} fontSize={18} letterSpacing={3}>TEM: O BOREALIS</text> : null}
          {f >= a(p.cantAt) ? <text x={540} y={620} textAnchor="middle" fill={RED} fontFamily={MONO} fontSize={16} letterSpacing={2}>NÃO SABE COMPLETAR</text> : null}
        </g>
        <g transform={`translate(${lerp(260, 0, join)} 0)`}>
          <rect x={1200} y={340} width={360} height={420} rx={14} fill="rgba(255,93,77,0.06)" stroke={RED} strokeWidth={3} opacity={P(f, a(p.seekAt), 10)} />
          <text x={1380} y={380} textAnchor="middle" fill={RED} fontFamily={MONO} fontSize={20} letterSpacing={4}>COMBINE</text>
          {f >= a(p.combHasAt) ? <text x={1380} y={560} textAnchor="middle" fill={CREAM} fontFamily={MONO} fontSize={18} letterSpacing={3}>TEM: O CONHECIMENTO</text> : null}
          {f >= a(p.alsoAt) ? <text x={1380} y={620} textAnchor="middle" fill={VIO} fontFamily={MONO} fontSize={16} letterSpacing={2}>TAMBÉM QUER A PERPETUIDADE</text> : null}
        </g>
        {spire > 0 ? (
          <g opacity={spire}>
            <path d={`M 900 900 L 960 ${900 - 700 * spire} L 960 900 Z`} fill="rgba(255,178,46,0.1)" stroke={AMB} strokeWidth={2} />
            <path d={`M 1020 900 L 960 ${900 - 700 * spire} L 960 900 Z`} fill="rgba(255,93,77,0.1)" stroke={RED} strokeWidth={2} />
          </g>
        ) : null}
        {f >= a(p.gmanAt) ? (
          <g transform="translate(1600 860)" opacity={P(f, a(p.gmanAt), 20) * 0.8}>
            <rect x={-26} y={-18} width={52} height={36} rx={3} fill="none" stroke={CREAM} strokeWidth={2} />
            <path d="M -10 -18 L -10 -26 L 10 -26 L 10 -18" fill="none" stroke={CREAM} strokeWidth={2} />
            <text x={0} y={40} textAnchor="middle" fill={CREAM} fontFamily={MONO} fontSize={12} letterSpacing={2}>OBSERVA</text>
          </g>
        ) : null}
      </svg>
      <div style={{ position: "absolute", left: 120, top: 140, width: 1700 }}>
        {[
          { at: a(p.notHumAt), k: "NÃO É SÓ UMA CÓPIA FEITA POR HUMANOS", c: CREAM },
          { at: a(p.filesAt), k: "OS ARQUIVOS DA MOSSMAN NÃO TÊM TUDO · A ALYX ESTÁ MORTA", c: RED },
          { at: a(p.partAt), k: "NÃO COMO CONQUISTADORES · COMO PARCEIROS", c: AMB },
          { at: a(p.notForgotAt), k: "NÃO PORQUE ESQUECERAM A GUERRA · PORQUE QUEREM A MESMA COISA: CONTINUAR", c: VIO },
        ]
          .filter((r) => f >= r.at)
          .slice(-1)
          .map((r, i) => (
            <div key={r.k} style={{ fontSize: 24, letterSpacing: 3, color: r.c, opacity: flickIn(f, r.at) }}>
              {r.k}
            </div>
          ))}
      </div>
      {void p.citAt}
      {void p.reactAt}
      {void p.rebuildAt}
      {void p.woundAt}
      {void p.deadAt}
      {void p.neverAt}
      {void p.neitherAt}
      {void p.sameAt}
      {void p.contAt}
      {void p.workAt}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------- F1 · 11) a "ascensão"
// os três anéis alinham; o centro acende; os pontos (humanos âmbar · Combine vermelho · Advisors violeta) em volta se
// espalham em luz e somem; NÃO EXISTE PORTA; quem ficou: "PROVA"; e a verdade: o catalisador nunca precisou conceder nada;
// só o evento importava: A CONVERGÊNCIA CONTINUA INTACTA.
export const HLAscension: React.FC<{ life: number; againAt?: number; catAt?: number; noDoorAt?: number; strangeAt?: number; crossAt?: number; envAt?: number; mixAt?: number; fadeAt?: number; goneAt?: number; nobodyAt?: number; proofAt?: number; believeAt?: number; truthAt?: number; neverAt?: number; eventAt?: number; intactAt?: number }> = (p) => {
  const f = useCurrentFrame();
  const N = 1e9;
  const a = (v?: number) => v ?? N;
  void p.life;
  const glow = P(f, a(p.catAt), 40);
  const fade = P(f, a(p.fadeAt), 60);
  const dots = Array.from({ length: 36 }).map((_, i) => ({ ang: (i / 36) * Math.PI * 2, r: 300 + (i % 4) * 40, c: i % 3 === 0 ? RED : i % 5 === 0 ? VIO : AMB }));
  const ph2 = P(f, a(p.truthAt), 20);
  return (
    <AbsoluteFill style={{ background: BG9("#0a0a0c"), overflow: "hidden", fontFamily: MONO }}>
      <Title9 t={ph2 > 0.5 ? "A VERDADE" : f >= a(p.catAt) ? "O CATALISADOR ACONTECE" : "O ALINHAMENTO · DE NOVO"} col={ph2 > 0.5 ? CREAM : AMB} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: 1 - ph2 * 0.75 }}>
        <Rings3 f={f} align={Math.min(1, 0.7 + P(f, a(p.againAt), 120) * 0.3)} glow={glow} />
        {f >= a(p.envAt)
          ? dots.map((d, i) => {
              const m = P(f, a(p.mixAt) + (i % 6) * 4, 30);
              const r = lerp(d.r, d.r * 0.3, m);
              const op = 1 - fade;
              return <circle key={i} cx={960 + Math.cos(d.ang + f / 200) * r} cy={540 + Math.sin(d.ang + f / 200) * r * 0.7} r={8 + m * 10} fill={d.c} opacity={op * (0.5 + 0.5 * (1 - m))} style={{ filter: `blur(${m * 4}px)` }} />;
            })
          : null}
      </svg>
      {f >= a(p.noDoorAt) && ph2 < 1 ? <div style={{ position: "absolute", left: 70, top: 110, fontSize: 24, letterSpacing: 4, color: "rgba(255,226,176,0.6)", opacity: P(f, a(p.noDoorAt), 8) }}>NÃO EXISTE PORTA · NENHUMA DIMENSÃO · NENHUMA RESPOSTA</div> : null}
      {f >= a(p.goneAt) && ph2 < 1 ? <div style={{ position: "absolute", left: 0, right: 0, bottom: 120, textAlign: "center", fontSize: 30, letterSpacing: 5, color: CREAM, opacity: P(f, a(p.goneAt), 8) }}>ELES SIMPLESMENTE DEIXAM DE ESTAR ALI</div> : null}
      {f >= a(p.nobodyAt) && ph2 < 1 ? <div style={{ position: "absolute", right: 70, top: 110, width: 520, fontSize: 18, letterSpacing: 3, color: "rgba(255,226,176,0.6)", opacity: P(f, a(p.nobodyAt), 8) }}>MORRERAM? FORAM TRANSPORTADOS? ALCANÇARAM A PERPETUIDADE? NINGUÉM VOLTA PARA EXPLICAR</div> : null}
      {f >= a(p.proofAt) && ph2 < 1 ? <div style={{ position: "absolute", left: 0, right: 0, top: 200, textAlign: "center", fontSize: 40, letterSpacing: 6, color: VIO, opacity: P(f, a(p.proofAt), 8) }}>PARA QUEM FICA: A PROVA</div> : null}
      {ph2 > 0 ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 360, textAlign: "center", opacity: ph2 }}>
          {f >= a(p.neverAt) ? <div style={{ fontSize: 34, letterSpacing: 4, color: "rgba(255,226,176,0.5)", textDecoration: "line-through" }}>CONCEDER PERPETUIDADE A ALGUÉM</div> : null}
          {f >= a(p.eventAt) ? <div style={{ fontSize: 40, letterSpacing: 4, color: CREAM, marginTop: 24, opacity: P(f, a(p.eventAt), 8) }}>SÓ IMPORTAVA QUE O EVENTO ACONTECESSE</div> : null}
          {f >= a(p.intactAt) ? <div style={{ fontSize: 44, letterSpacing: 6, color: AMB, marginTop: 24, opacity: flickIn(f, a(p.intactAt)) }}>A CONVERGÊNCIA CONTINUA INTACTA</div> : null}
        </div>
      ) : null}
      {void p.strangeAt}
      {void p.crossAt}
      {void p.believeAt}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------- F1 · 12) linhas em paralelo
// várias linhas horizontais, cada uma num ponto diferente (marcador): NOSSA (humanos + Combine no catalisador) · OUTRA (a
// guerra ainda) · OUTRA (Combine venceram há séculos) · OUTRA (Black Mesa ainda nem aconteceu). Todas desenhadas até o
// MESMO EVENTO à direita (coluna âmbar).
export const HLParallelLines: React.FC<{ life: number; ourAt?: number; warAt?: number; wonAt?: number; bmAt?: number; diffAt?: number; shareAt?: number; sameAt?: number; enoughAt?: number }> = (p) => {
  const f = useCurrentFrame();
  const N = 1e9;
  const a = (v?: number) => v ?? N;
  void p.life;
  const L = [
    { at: a(p.ourAt), k: "A NOSSA · HUMANOS E COMBINE NO CATALISADOR", pos: 0.92, c: AMB },
    { at: a(p.warAt), k: "OUTRA · A GUERRA AINDA ACONTECENDO", pos: 0.55, c: GREEN },
    { at: a(p.wonAt), k: "OUTRA · OS COMBINE VENCERAM HÁ SÉCULOS", pos: 0.75, c: RED },
    { at: a(p.bmAt), k: "OUTRA · BLACK MESA AINDA NEM ACONTECEU", pos: 0.08, c: ICE },
  ];
  return (
    <AbsoluteFill style={{ background: BG9("#0a0a0c"), overflow: "hidden", fontFamily: MONO }}>
      <Title9 t="LINHAS EM PARALELO" col={CREAM} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {f >= a(p.sameAt) ? <rect x={1660} y={180} width={60} height={760} fill="rgba(255,178,46,0.12)" stroke={AMB} strokeWidth={2} opacity={P(f, a(p.sameAt), 10)} /> : null}
        {f >= a(p.sameAt) ? <text x={1690} y={170} textAnchor="middle" fill={AMB} fontFamily={MONO} fontSize={14} letterSpacing={3} opacity={P(f, a(p.sameAt), 10)}>O MESMO EVENTO</text> : null}
        {L.map((l, i) =>
          f >= l.at ? (
            <g key={i} opacity={flickIn(f, l.at)}>
              <line x1={160} x2={1690} y1={260 + i * 190} y2={260 + i * 190} stroke="rgba(255,226,176,0.3)" strokeWidth={2} strokeDasharray={f >= a(p.shareAt) ? undefined : "6 8"} />
              <circle cx={lerp(160, 1660, l.pos)} cy={260 + i * 190} r={14} fill={l.c} />
              <text x={160} y={240 + i * 190} fill={l.c} fontFamily={MONO} fontSize={18} letterSpacing={3}>{l.k}</text>
            </g>
          ) : null,
        )}
      </svg>
      {f >= a(p.shareAt) ? <div style={{ position: "absolute", left: 0, right: 0, bottom: 70, textAlign: "center", fontSize: 26, letterSpacing: 5, color: CREAM, opacity: P(f, a(p.shareAt), 8) }}>O QUE ELAS COMPARTILHAM NÃO É O TEMPO · É A CONVERGÊNCIA</div> : null}
      {void p.diffAt}
      {void p.enoughAt}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------- F1 · 13) o bonde
// a humanidade deixa a Terra (rótulos), a linha chegou onde precisava; corte seco para OUTRA REALIDADE: o clipe real do bonde
// de Black Mesa (HL1); "um homem de óculos indo trabalhar"; a maleta na plataforma; o bonde segue.
export const HLTramEnding: React.FC<{ life: number; leaveAt?: number; workAt?: number; reachAt?: number; cutAt?: number; tramAt?: number; signAt?: number; manAt?: number; gmanAt?: number; goAt?: number }> = (p) => {
  const f = useCurrentFrame();
  const N = 1e9;
  const a = (v?: number) => v ?? N;
  const life = p.life;
  const cut = f >= a(p.cutAt);
  return (
    <AbsoluteFill style={{ background: "#030304", overflow: "hidden", fontFamily: MONO }}>
      {!cut ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 360, textAlign: "center" }}>
          {f >= a(p.leaveAt) ? <div style={{ fontSize: 34, letterSpacing: 6, color: CREAM, opacity: P(f, a(p.leaveAt), 8) }}>A HUMANIDADE DEIXA A TERRA PARA TRÁS</div> : null}
          {f >= a(p.workAt) ? <div style={{ fontSize: 26, letterSpacing: 5, color: AMB, marginTop: 20, opacity: P(f, a(p.workAt), 8) }}>QUEM VENCEU OS COMBINE PASSOU A TRABALHAR COM ELES</div> : null}
          {f >= a(p.reachAt) ? <div style={{ fontSize: 26, letterSpacing: 5, color: "rgba(255,226,176,0.7)", marginTop: 20, opacity: P(f, a(p.reachAt), 8) }}>A LINHA CHEGOU EXATAMENTE ONDE PRECISAVA</div> : null}
        </div>
      ) : (
        <>
          {/* bonde (16 s) e bonde2 (12 s) a 0,8×: 20 s + 15 s */}
          <Sequence from={Math.round(a(p.cutAt))} durationInFrames={600} premountFor={30}>
            <div style={{ position: "absolute", inset: 0, filter: "contrast(1.05) saturate(0.85)" }}>
              <Clip src="videos/hl3_M01_1C/clips/hl1_bonde.mp4" from={0} rate={0.8} />
            </div>
          </Sequence>
          <Sequence from={Math.round(a(p.cutAt)) + 600} premountFor={30}>
            <div style={{ position: "absolute", inset: 0, filter: "contrast(1.05) saturate(0.85)" }}>
              <Clip src="videos/hl3_M01_1C/clips/hl1_bonde2.mp4" from={0} rate={0.8} />
            </div>
          </Sequence>
          <div style={{ position: "absolute", inset: 0, background: "#000", opacity: Math.max(0, 1 - Math.abs(f - (a(p.cutAt) + 600)) / 8) }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 70%, rgba(0,0,0,0.6) 100%)" }} />
          <div style={{ position: "absolute", left: 70, top: 56, fontSize: 22, letterSpacing: 8, color: "rgba(255,226,176,0.85)", opacity: P(f, a(p.cutAt), 10) * (1 - P(f, a(p.tramAt), 20)) }}>OUTRA REALIDADE · OUTRA LINHA DO TEMPO</div>
          {f >= a(p.signAt) ? <div style={{ position: "absolute", left: 70, bottom: 80, fontSize: 30, letterSpacing: 10, color: CREAM, opacity: P(f, a(p.signAt), 10) * (1 - P(f, a(p.manAt) + 20, 20)), textShadow: "0 2px 10px #000" }}>BLACK MESA</div> : null}
          {f >= a(p.gmanAt) ? (
            <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
              <g transform="translate(1700 860)" opacity={P(f, a(p.gmanAt), 20)}>
                <rect x={-30} y={-22} width={60} height={44} rx={3} fill="rgba(0,0,0,0.5)" stroke={CREAM} strokeWidth={2.5} />
                <path d="M -12 -22 L -12 -32 L 12 -32 L 12 -22" fill="none" stroke={CREAM} strokeWidth={2.5} />
              </g>
            </svg>
          ) : null}
          <div style={{ position: "absolute", inset: 0, background: "#000", opacity: P(f, life - 40, 40) }} />
        </>
      )}
      {void p.goAt}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------- 12 · a última escolha é do Gordon
// a certeza da Alyx (DESTRUIR O NÚCLEO) se divide em duas cópias: DELA × DEIXADA PELO G-MAN; a checagem (memórias ✓, agente
// contra ele ✓, prova —); a trilha dos passos dela (✓ ✓ ✓) com o último espaço vazio piscando: GORDON; o pedido; os dois
// caminhos que ela sabe operar; a promessa; a linha final.
export const HLLastStep: React.FC<{ life: number; certAt?: number; firstAt?: number; doubtAt?: number; gmanAt?: number; builtAt?: number; memAt?: number; usedAt?: number; proofAt?: number; refuseAt?: number; s1At?: number; s2At?: number; s3At?: number; lastAt?: number; stillAt?: number; askAt?: number; clearAt?: number; bothAt?: number; colAt?: number; useAt?: number; promAt?: number; finalAt?: number }> = (p) => {
  const f = useCurrentFrame();
  const N = 1e9;
  const a = (v?: number) => v ?? N;
  void p.life;
  const ph = f >= a(p.bothAt) ? 2 : f >= a(p.refuseAt) ? 1 : 0;
  const split = P(f, a(p.doubtAt), 30);
  const slot = 0.5 + 0.5 * Math.sin(f / 5);
  const card = (x: number, y: number, w: number, col: string, top: string, body: string, o: number, extra?: React.ReactNode) => (
    <div style={{ position: "absolute", left: x, top: y, width: w, padding: "18px 22px", border: `1px solid ${col}`, borderRadius: 10, background: "rgba(8,8,8,0.9)", opacity: o, boxShadow: `0 0 30px ${col}22` }}>
      <div style={{ fontSize: 15, letterSpacing: 4, color: col }}>{top}</div>
      <div style={{ fontSize: 30, letterSpacing: 3, color: CREAM, marginTop: 8 }}>{body}</div>
      {extra}
    </div>
  );
  return (
    <AbsoluteFill style={{ background: BG9("#0c0a08"), overflow: "hidden", fontFamily: MONO }}>
      <Title9 t={ph === 2 ? "OS DOIS CAMINHOS · ELA SABE OPERAR OS DOIS" : ph === 1 ? "O ÚLTIMO PASSO" : "ALYX · A CERTEZA"} col={AMB} />
      {ph === 0 ? (
        <>
          {card(lerp(660, 260, split), 220, 600, AMB, "DELA?", "DESTRUIR O NÚCLEO É A ÚNICA SAÍDA", P(f, a(p.certAt), 10))}
          {split > 0
            ? card(
                lerp(660, 1060, split),
                220,
                600,
                "rgba(255,226,176,0.5)",
                "OU DEIXADA PELO G-MAN?",
                "DESTRUIR O NÚCLEO É A ÚNICA SAÍDA",
                split * (0.55 + 0.25 * Math.sin(f / 4)),
                f >= a(p.gmanAt) ? (
                  <svg width={60} height={44} style={{ position: "absolute", right: 18, top: 14 }}>
                    <rect x={6} y={12} width={48} height={28} rx={3} fill="none" stroke={CREAM} strokeWidth={2} />
                    <path d="M 22 12 L 22 5 L 38 5 L 38 12" fill="none" stroke={CREAM} strokeWidth={2} />
                  </svg>
                ) : null,
              )
            : null}
          {f >= a(p.firstAt) && f < a(p.doubtAt) ? <div style={{ position: "absolute", left: 0, right: 0, top: 480, textAlign: "center", fontSize: 26, letterSpacing: 4, color: "rgba(255,226,176,0.7)", opacity: P(f, a(p.firstAt), 8) }}>PELA PRIMEIRA VEZ · UMA PERGUNTA QUE ELA NÃO RESPONDE</div> : null}
          {f >= a(p.builtAt) ? <div style={{ position: "absolute", left: 0, right: 0, top: 500, textAlign: "center", fontSize: 26, letterSpacing: 4, color: CREAM, opacity: P(f, a(p.builtAt), 8) }}>ELE CONSTRUIU A AGENTE PARA LEVAR TUDO ATÉ AQUI</div> : null}
          <div style={{ position: "absolute", left: 560, top: 600, width: 800 }}>
            {[
              { at: a(p.memAt), k: "MEMÓRIAS RECUPERADAS", ok: true },
              { at: a(p.usedAt), k: "A AGENTE USADA CONTRA ELE", ok: true },
              { at: a(p.proofAt), k: "PROVA DE QUE DESTRUIR NÃO É O PLANO", ok: false },
            ].map((r, i) =>
              f >= r.at ? (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid rgba(255,226,176,0.15)", fontSize: 22, letterSpacing: 3, color: CREAM, opacity: flickIn(f, r.at) }}>
                  <span>{r.k}</span>
                  <span style={{ color: r.ok ? GREEN : RED, opacity: r.ok ? 1 : 0.4 + 0.6 * slot }}>{r.ok ? "✓" : "SEM PROVA"}</span>
                </div>
              ) : null,
            )}
          </div>
        </>
      ) : null}
      {ph === 1 ? (
        <>
          <div style={{ position: "absolute", left: 0, right: 0, top: 160, textAlign: "center", fontSize: 30, letterSpacing: 5, color: CREAM, opacity: P(f, a(p.refuseAt), 8) }}>ELA SE RECUSA A FAZER A ÚLTIMA ESCOLHA</div>
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
            {[a(p.s1At), a(p.s2At), a(p.s3At), a(p.lastAt)].map((t, i) => {
              const x = 300 + i * 440;
              const last = i === 3;
              return f >= t ? (
                <g key={i} opacity={P(f, t, 10)}>
                  {i > 0 ? <line x1={x - 380} x2={x - 60} y1={460} y2={460} stroke={last ? AMB : "rgba(255,226,176,0.5)"} strokeWidth={3} strokeDasharray={last ? "10 8" : undefined} strokeDashoffset={-f} /> : null}
                  <circle cx={x} cy={460} r={44} fill={last ? `rgba(255,178,46,${0.08 + 0.12 * slot})` : "rgba(141,255,168,0.12)"} stroke={last ? AMB : GREEN} strokeWidth={3} strokeDasharray={last ? "6 6" : undefined} />
                  <text x={x} y={472} textAnchor="middle" fill={last ? AMB : GREEN} fontFamily={MONO} fontSize={30}>
                    {last ? "?" : "✓"}
                  </text>
                </g>
              ) : null;
            })}
          </svg>
          {[
            { at: a(p.s1At), k: "LEVOU O GORDON ATÉ ALI" },
            { at: a(p.s2At), k: "MANTEVE OS COMBINE AVANÇANDO" },
            { at: a(p.s3At), k: "SEGUROU O PROCEDIMENTO" },
            { at: a(p.lastAt), k: "O ÚLTIMO PASSO · GORDON" },
          ].map((s, i) =>
            f >= s.at ? (
              <div key={i} style={{ position: "absolute", left: 100 + i * 440, width: 400, top: 540, textAlign: "center", fontSize: 18, letterSpacing: 3, color: i === 3 ? AMB : CREAM, opacity: P(f, s.at, 10) }}>
                {s.k}
              </div>
            ) : null,
          )}
          {f >= a(p.stillAt) && f < a(p.askAt) ? <div style={{ position: "absolute", left: 0, right: 0, top: 700, textAlign: "center", fontSize: 24, letterSpacing: 4, color: "rgba(255,226,176,0.7)", opacity: P(f, a(p.stillAt), 8) }}>ELA AINDA QUER DESTRUIR · AINDA ACREDITA QUE É A ÚNICA SAÍDA</div> : null}
          {f >= a(p.askAt) ? <div style={{ position: "absolute", left: 0, right: 0, top: 690, textAlign: "center", fontSize: 38, letterSpacing: 3, color: AMB }}>{`“${typedS(f, a(p.askAt), "GORDON, POR FAVOR, CONFIE EM MIM MAIS UMA VEZ.", 1.2)}”`}</div> : null}
          {f >= a(p.clearAt) ? <div style={{ position: "absolute", left: 0, right: 0, top: 790, textAlign: "center", fontSize: 26, letterSpacing: 4, color: CREAM, opacity: P(f, a(p.clearAt), 8) }}>SE ELE ESCOLHER O CONTRÁRIO, ELA NÃO VAI IMPEDIR</div> : null}
        </>
      ) : null}
      {ph === 2 ? (
        <>
          {card(200, 260, 680, GREEN, "COLAPSAR O NÚCLEO CONTRA A FERIDA", "ELA COMPLETA A SEQUÊNCIA", P(f, a(p.colAt), 10))}
          {card(1040, 260, 680, AMB, "USAR O BOREALIS COMO ARMA", "ELA REDIRECIONA O PROCEDIMENTO", P(f, a(p.useAt), 10))}
          {f >= a(p.promAt) ? (
            <div style={{ position: "absolute", left: 0, right: 0, top: 560, textAlign: "center", opacity: P(f, a(p.promAt), 8) }}>
              <div style={{ fontSize: 26, letterSpacing: 4, color: "rgba(255,226,176,0.5)", textDecoration: "line-through" }}>CONCORDAR COM A ESCOLHA</div>
              <div style={{ fontSize: 34, letterSpacing: 4, color: CREAM, marginTop: 14 }}>SÓ PROMETE NÃO ESCOLHER POR ELE</div>
            </div>
          ) : null}
          {f >= a(p.finalAt) ? <div style={{ position: "absolute", left: 160, right: 160, top: 800, textAlign: "center", fontSize: 26, letterSpacing: 3, color: AMB, opacity: P(f, a(p.finalAt), 10) }}>TALVEZ A ÚNICA DECISÃO QUE O G-MAN NÃO CONSIGA CONTROLAR SEJA UMA QUE NÃO VENHA DELA</div> : null}
        </>
      ) : null}
    </AbsoluteFill>
  );
};

// ================================================================================================ MÓDULO 14 · FINAL 2 · A NÉVOA
const Brief: React.FC<{ x: number; y: number; s?: number; o?: number; col?: string }> = ({ x, y, s = 1, o = 1, col = CREAM }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>
    <rect x={-30} y={-22} width={60} height={44} rx={3} fill="rgba(0,0,0,0.55)" stroke={col} strokeWidth={2.5} />
    <path d="M -12 -22 L -12 -32 L 12 -32 L 12 -22" fill="none" stroke={col} strokeWidth={2.5} />
  </g>
);
type Beat = { k: string; c?: string; at: number };
const pickBeats = (f: number, p: Record<string, unknown>, keys: { k: string; c?: string; key: string }[]): Beat[] =>
  keys.map((b) => ({ k: b.k, c: b.c, at: (p[b.key] as number | undefined) ?? 1e9 })).filter((b) => f >= b.at);
const BeatLine: React.FC<{ f: number; b?: Beat; top?: number; size?: number }> = ({ f, b, top = 880, size = 30 }) =>
  b ? (
    <div key={b.k} style={{ position: "absolute", left: 120, right: 120, top, textAlign: "center", fontFamily: MONO, fontSize: size, letterSpacing: 4, color: b.c ?? CREAM, opacity: flickIn(f, b.at), textShadow: "0 2px 12px #000" }}>
      {b.k}
    </div>
  ) : null;

// ---------------------------------------------------------------------------------------------- F2 · 1) o colapso
// a sala vista de cima: os três anéis (BOREALIS · NÚCLEO · FERIDA) param de girar juntos e despencam uns sobre os outros;
// Alyx encaixa a última peça; o casco: setores (retângulos) somem e voltam diferentes; rachaduras no gelo; partículas
// sobem (gravidade falha); rádio do Kleiner; a Terra (contorno) apagando junto.
export const HLCoreCollapse: React.FC<Record<string, number> & { life: number }> = (p) => {
  const f = useCurrentFrame();
  const a = (k: string) => p[k] ?? 1e9;
  const fall = P(f, a("contraAt"), 60);
  const col = P(f, a("colAt"), 50);
  const dying = f >= a("dieAt");
  const earth = 1 - P(f, a("earthAt"), 120);
  const beats = pickBeats(f, p, [
    { k: "ELA NÃO HESITA", c: AMB, key: "noHesAt" },
    { k: "ALYX PREPARA A SEQUÊNCIA · GORDON NOS CONTROLES", c: AMB, key: "seqAt" },
    { k: "O CONTRÁRIO · O NÚCLEO CONTRA A PRÓPRIA FERIDA", c: GREEN, key: "contraAt" },
    { k: "DEIXAM DE SER UM MECANISMO", c: CREAM, key: "mechAt" },
    { k: "ALYX ENCAIXA A ÚLTIMA PEÇA", c: AMB, key: "pieceAt" },
    { k: "O BOREALIS COMEÇA A MORRER", c: RED, key: "dieAt" },
    { k: "SEM EXPLOSÃO · O CASCO PERDE ESTABILIDADE", c: CREAM, key: "hullAt" },
    { k: "KLEINER · A FERIDA ESTÁ SE FECHANDO", c: GREEN, key: "kleinerAt" },
    { k: "NÃO SOZINHA · A TERRA ESTÁ INDO JUNTO", c: RED, key: "earthAt" },
    { k: "ELI · EM SILÊNCIO", c: GREEN, key: "eliAt" },
    { k: "“ALYX.”", c: GREEN, key: "alyxAt" },
  ]);
  return (
    <AbsoluteFill style={{ background: BG9(dying ? "#0c0808" : "#080a0c"), overflow: "hidden", fontFamily: MONO }}>
      <Title9 t={dying ? "O BOREALIS · MORRENDO" : "O NÚCLEO · O CAMINHO DA ALYX"} col={dying ? RED : AMB} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {/* setores do casco */}
        {f >= a("hullAt")
          ? Array.from({ length: 24 }).map((_, i) => {
              const on = Math.floor((f + i * 37) / (20 + (i % 5) * 9)) % 3 !== 0;
              const x = 120 + (i % 8) * 220;
              const y = 160 + Math.floor(i / 8) * 300;
              return <rect key={i} x={x} y={y + (on ? 0 : 14)} width={160 + (on ? 0 : 30)} height={70} fill="none" stroke={on ? "rgba(159,230,255,0.25)" : "rgba(199,155,255,0.5)"} strokeWidth={1.5} strokeDasharray={on ? undefined : "6 6"} />;
            })
          : null}
        {/* rachaduras */}
        {f >= a("iceAt")
          ? Array.from({ length: 7 }).map((_, i) => {
              const len = P(f, a("iceAt") + i * 6, 30);
              const x0 = 200 + i * 240;
              return <polyline key={"c" + i} points={`${x0},1080 ${x0 + 30},${1080 - 120 * len} ${x0 - 20},${1080 - 220 * len} ${x0 + 40},${1080 - 300 * len}`} fill="none" stroke={ICE} strokeWidth={2} opacity={0.7} />;
            })
          : null}
        {/* gravidade */}
        {f >= a("gravAt")
          ? Array.from({ length: 40 }).map((_, i) => {
              const t = (f - a("gravAt")) * (0.6 + rnd(i) * 1.2);
              return <circle key={"g" + i} cx={100 + rnd(i * 3) * 1720} cy={1060 - (t % 1100)} r={2 + rnd(i * 7) * 3} fill={CREAM} opacity={0.5} />;
            })
          : null}
        {/* os anéis */}
        <g transform={`translate(0 ${fall * 120})`}>
          <Rings3 f={dying ? 0 : f} align={Math.max(0, 0.95 - col)} cx={960} cy={lerp(460, 560, col)} s={lerp(1, 0.55, col)} glow={P(f, a("pieceAt"), 20) * (dying ? 0.5 + 0.5 * Math.sin(f / 3) : 1)} />
        </g>
        {/* a Terra */}
        {f >= a("earthAt") ? <circle cx={1700} cy={880} r={90} fill="none" stroke={ICE} strokeWidth={3} opacity={earth} strokeDasharray={`${560 * earth} 600`} /> : null}
        {f >= a("earthAt") ? <text x={1700} y={1000} textAnchor="middle" fill={ICE} fontFamily={MONO} fontSize={16} letterSpacing={4} opacity={0.4 + 0.6 * earth}>TERRA</text> : null}
      </svg>
      <BeatLine f={f} b={beats[beats.length - 1]} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------- F2 · 2) objetivos que falham
// HUD de jogo: o controle volta; objetivos aparecem um por vez no canto e cada um falha (risca + FALHOU); fichas da
// resistência (Barney evacuação · Kleiner rotas com contagem curta · Magnusson foguete); a realidade desmontando em volta.
export const HLObjectivesFail: React.FC<Record<string, number> & { life: number }> = (p) => {
  const f = useCurrentFrame();
  const a = (k: string) => p[k] ?? 1e9;
  const objs = [
    { k: "CHEGUE ATÉ A SAÍDA", at: a("o1At") },
    { k: "ALCANCE UM PONTO DE EVACUAÇÃO", at: a("o2At") },
    { k: "MANTENHA UM CORREDOR ABERTO", at: a("o3At") },
    { k: "ESPERE A NAVE", at: a("o4At") },
  ];
  const failAt = a("failAt");
  const crew = [
    { k: "BARNEY", v: "ORGANIZA A EVACUAÇÃO", c: GREEN, at: a("barneyAt") },
    { k: "KLEINER", v: `ROTA VÁLIDA · ${Math.max(0, 3 - ((f - a("kleinerAt")) / 30) % 4).toFixed(1)} s`, c: ICE, at: a("kleinerAt") },
    { k: "MAGNUSSON", v: "SISTEMAS DO FOGUETE DE WHITE FOREST", c: AMB, at: a("magAt") },
  ];
  return (
    <AbsoluteFill style={{ background: BG9("#0a0b0d"), overflow: "hidden", fontFamily: MONO }}>
      <Title9 t={f >= a("playAt") ? "O FINAL INTEIRO É JOGÁVEL" : "O JOGO DEVOLVE O CONTROLE"} col={CREAM} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {Array.from({ length: 18 }).map((_, i) => {
          const y = 120 + i * 55;
          const off = Math.sin(f / 15 + i) * 30 * P(f, a("unravelAt"), 60);
          return <line key={i} x1={0} x2={1920} y1={y + off} y2={y - off} stroke="rgba(159,230,255,0.08)" strokeWidth={2} />;
        })}
        <circle cx={960} cy={760} r={10} fill={AMB} />
        <text x={960} y={800} textAnchor="middle" fill={AMB} fontFamily={MONO} fontSize={14} letterSpacing={3}>GORDON</text>
      </svg>
      <div style={{ position: "absolute", right: 80, top: 130, width: 640 }}>
        <div style={{ fontSize: 15, letterSpacing: 5, color: "rgba(255,226,176,0.6)", marginBottom: 10 }}>OBJETIVOS</div>
        {objs.map((o, i) => {
          if (f < o.at) return null;
          const failed = f >= (i < 3 ? objs[i + 1].at - 15 : failAt);
          return (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "12px 16px", marginTop: 8, border: `1px solid ${failed ? RED : AMB}`, borderRadius: 6, background: "rgba(10,8,6,0.85)", opacity: flickIn(f, o.at) }}>
              <span style={{ fontSize: 22, letterSpacing: 3, color: failed ? "rgba(255,226,176,0.45)" : CREAM, textDecoration: failed ? "line-through" : "none" }}>{o.k}</span>
              {failed ? <span style={{ fontSize: 18, letterSpacing: 3, color: RED }}>FALHOU</span> : null}
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", left: 80, top: 140, width: 620 }}>
        {crew.map((c, i) =>
          f >= c.at ? (
            <div key={i} style={{ padding: "12px 16px", marginTop: 10, borderLeft: `3px solid ${c.c}`, background: "rgba(8,8,8,0.8)", opacity: P(f, c.at, 8) }}>
              <div style={{ fontSize: 14, letterSpacing: 4, color: c.c }}>{c.k}</div>
              <div style={{ fontSize: 22, letterSpacing: 2, color: CREAM, marginTop: 4 }}>{c.v}</div>
            </div>
          ) : null,
        )}
      </div>
      {f >= a("notLostAt") ? <div style={{ position: "absolute", left: 0, right: 0, bottom: 90, textAlign: "center", fontSize: 28, letterSpacing: 4, color: CREAM, opacity: P(f, a("notLostAt"), 8) }}>NÃO PORQUE GORDON PERDEU · NÃO EXISTE MAIS UM CAMINHO PARA VENCER</div> : null}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------- F2 · 3) o Ártico se desfaz
// blocos de gelo (polígonos ICE) e fragmentos de Xen (violeta) sobem lentamente; criaturas como contatos que se espalham sem
// atacar; Combine sem alvo (mira girando); TUDO COM MEDO DA MESMA COISA.
export const HLArcticUnravel: React.FC<Record<string, number> & { life: number }> = (p) => {
  const f = useCurrentFrame();
  const a = (k: string) => p[k] ?? 1e9;
  const beats = pickBeats(f, p, [
    { k: "O ÁRTICO SE DESFAZ JUNTO COM O NAVIO", c: ICE, key: "startAt" },
    { k: "FRAGMENTOS DE XEN · ARRANCADOS DA TERRA", c: VIO, key: "xenAt" },
    { k: "ANTLIONS SAEM DOS NINHOS · HEADCRABS FOGEM", c: AMB, key: "creatAt" },
    { k: "OS COMBINE NÃO SABEM MAIS CONTRA QUEM LUTAR", c: RED, key: "combAt" },
    { k: "PELA PRIMEIRA VEZ · TUDO COM MEDO DA MESMA COISA", c: CREAM, key: "fearAt" },
  ]);
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 100%, #0e1820 0%, #03060a 75%)", overflow: "hidden", fontFamily: MONO }}>
      <Title9 t="O ÁRTICO" col={ICE} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {Array.from({ length: 16 }).map((_, i) => {
          const isX = i % 4 === 0;
          const st = isX ? a("xenAt") : a("iceAt");
          const rise = f >= st ? (f - st) * (0.4 + rnd(i) * 0.5) : 0;
          const x = 80 + rnd(i * 2.1) * 1760;
          const y = 960 - rise;
          const r = 30 + rnd(i * 4.3) * 50;
          const pts = Array.from({ length: 6 }).map((__, k) => { const an = (k / 6) * Math.PI * 2 + f / (200 + i * 20); const rr = r * (0.7 + 0.3 * rnd(i * 10 + k)); return `${x + Math.cos(an) * rr},${y + Math.sin(an) * rr * 0.6}`; }).join(" ");
          return <polygon key={i} points={pts} fill={isX ? "rgba(199,155,255,0.12)" : "rgba(159,230,255,0.08)"} stroke={isX ? VIO : ICE} strokeWidth={2} opacity={f >= st ? 0.9 : 0.35} />;
        })}
        {f >= a("creatAt")
          ? Array.from({ length: 14 }).map((_, i) => {
              const t = (f - a("creatAt")) / 90;
              const an = rnd(i * 9) * Math.PI * 2;
              return <circle key={"k" + i} cx={960 + Math.cos(an) * (80 + t * 300)} cy={820 + Math.sin(an) * (40 + t * 120)} r={6} fill={i % 2 ? AMB : GREEN} opacity={Math.max(0, 1 - t * 0.5)} />;
            })
          : null}
        {f >= a("combAt")
          ? [0, 1, 2].map((k) => (
              <g key={"m" + k} transform={`translate(${520 + k * 440} 380) rotate(${f * (2 + k)})`} opacity={P(f, a("combAt"), 10)}>
                <circle r={34} fill="none" stroke={RED} strokeWidth={2} />
                <line x1={-46} x2={46} y1={0} y2={0} stroke={RED} strokeWidth={2} />
                <line y1={-46} y2={46} x1={0} x2={0} stroke={RED} strokeWidth={2} />
              </g>
            ))
          : null}
      </svg>
      <BeatLine f={f} b={beats[beats.length - 1]} top={150} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------- F2 · 4) Varga na neve
export const HLVargaSnow: React.FC<Record<string, number> & { life: number }> = (p) => {
  const f = useCurrentFrame();
  const a = (k: string) => p[k] ?? 1e9;
  const G = { x: lerp(200, 1800, P(f, a("goAt"), 240)), y: 700 };
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 30%, #141820 0%, #04060a 80%)", overflow: "hidden", fontFamily: MONO }}>
      <Title9 t="VARGA · SOZINHO NA NEVE" col={RED} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {Array.from({ length: 80 }).map((_, i) => (
          <circle key={i} cx={(rnd(i) * 1920 + f * (0.4 + rnd(i * 2))) % 1920} cy={(rnd(i * 3) * 1080 + f * (1 + rnd(i * 5))) % 1080} r={1.5 + rnd(i * 7) * 2} fill={CREAM} opacity={0.35} />
        ))}
        {Array.from({ length: 6 }).map((_, i) => (
          <path key={"s" + i} d={`M 0 ${120 + i * 40} Q 960 ${80 + i * 40 + Math.sin(f / 30 + i) * 60} 1920 ${120 + i * 40}`} fill="none" stroke="rgba(199,155,255,0.25)" strokeWidth={2} opacity={P(f, a("skyAt"), 30)} />
        ))}
        <circle cx={960} cy={620} r={16} fill={RED} />
        <rect x={985} y={600} width={28} height={36} fill="none" stroke={CREAM} strokeWidth={2} opacity={P(f, a("filesAt"), 10)} />
        <text x={960} y={590} textAnchor="middle" fill={RED} fontFamily={MONO} fontSize={16} letterSpacing={3}>VARGA</text>
        {f >= a("filesAt") ? <text x={1030} y={660} fill={CREAM} fontFamily={MONO} fontSize={13} letterSpacing={2} opacity={0.7}>ARQUIVOS DA MOSSMAN</text> : null}
        {f >= a("seeAt") ? <circle cx={G.x} cy={G.y} r={11} fill={AMB} /> : null}
      </svg>
      {f >= a("closeAt") ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 260, textAlign: "center", opacity: P(f, a("closeAt"), 8) }}>
          <div style={{ fontSize: 40, letterSpacing: 3, color: RED }}>{`“${typedS(f, a("closeAt"), "CHEGUEI TÃO PERTO.", 1.2)}”`}</div>
          {f >= a("loseAt") ? <div style={{ fontSize: 26, letterSpacing: 3, color: CREAM, marginTop: 14 }}>{typedS(f, a("loseAt"), "DE UMA MANEIRA DE NUNCA MAIS PERDER NINGUÉM", 1.4)}</div> : null}
        </div>
      ) : null}
      {f >= a("goAt") ? <div style={{ position: "absolute", left: 0, right: 0, bottom: 100, textAlign: "center", fontSize: 24, letterSpacing: 4, color: "rgba(255,226,176,0.7)", opacity: P(f, a("goAt"), 8) }}>NÃO PEDE AJUDA · GORDON CONTINUA</div> : null}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------- F2 · 5) os Advisors param
// mapa com nós violeta pulsando; todos param ao mesmo tempo (o pulso congela); barra A PROMESSA DE PERPETUIDADE caindo para
// zero; NESSA LINHA · NÃO VAI ACONTECER; com panicAt: os nós tremem e piscam em vermelho (o grito: pânico).
export const HLAdvisorsStop: React.FC<Record<string, number> & { life: number }> = (p) => {
  const f = useCurrentFrame();
  const a = (k: string) => p[k] ?? 1e9;
  const stop = f >= a("stopAt");
  const panic = f >= a("panicAt");
  const prom = 1 - P(f, a("goneAt"), 90);
  const beats = pickBeats(f, p, [
    { k: "OS ADVISORS SENTEM PRIMEIRO", c: VIO, key: "feelAt" },
    { k: "TODOS PARAM AO MESMO TEMPO · NÃO É UMA ORDEM", c: VIO, key: "stopAt" },
    { k: "ALGO QUE SEMPRE ESTEVE PRESENTE DESAPARECEU", c: CREAM, key: "goneAt" },
    { k: "NUNCA FOI UMA CERTEZA CIENTÍFICA", c: CREAM, key: "sciAt" },
    { k: "SÓ A CONVICÇÃO DE QUE O EVENTO ACONTECERIA", c: AMB, key: "convAt" },
    { k: "NESSA LINHA · PELA PRIMEIRA VEZ · NÃO VAI ACONTECER", c: RED, key: "notAt" },
    { k: "OS ADVISORS GRITAM · NÃO É UMA ORDEM · É PÂNICO", c: RED, key: "panicAt" },
    { k: "A CONVICÇÃO DE ERAS ACABOU DE FALHAR", c: RED, key: "failAt" },
    { k: "O INEVITÁVEL NÃO É MAIS", c: CREAM, key: "inevAt" },
  ]);
  return (
    <AbsoluteFill style={{ background: BG9("#0c0a10"), overflow: "hidden", fontFamily: MONO }}>
      <Title9 t={panic ? "OS ADVISORS · PÂNICO" : "OS ADVISORS"} col={panic ? RED : VIO} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {Array.from({ length: 22 }).map((_, i) => {
          const x = 160 + rnd(i * 1.9) * 1600 + (panic ? Math.sin(f * 1.7 + i) * 6 : 0);
          const y = 200 + rnd(i * 2.3) * 560 + (panic ? Math.cos(f * 1.3 + i) * 6 : 0);
          const ph = stop ? (a("stopAt") / 10 + i) : f / 10 + i;
          const r = 10 + 4 * Math.sin(ph);
          const c = panic && Math.floor(f / 4 + i) % 2 ? RED : VIO;
          return (
            <g key={i} opacity={P(f, a("feelAt") - 30, 20)}>
              <circle cx={x} cy={y} r={r} fill={c} opacity={0.8} />
              <circle cx={x} cy={y} r={r + 14 + (stop ? 0 : (f + i * 7) % 30)} fill="none" stroke={c} strokeWidth={1.5} opacity={stop ? 0.25 : 0.5 * (1 - ((f + i * 7) % 30) / 30)} />
            </g>
          );
        })}
      </svg>
      {f >= a("perpAt") ? (
        <div style={{ position: "absolute", left: 560, right: 560, top: 820, opacity: P(f, a("perpAt"), 10) }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, letterSpacing: 4, color: VIO }}>
            <span>A PROMESSA DE PERPETUIDADE</span>
            <span>{`${Math.round(prom * 100)}%`}</span>
          </div>
          <div style={{ height: 10, border: `1px solid ${VIO}`, marginTop: 6, position: "relative" }}>
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${prom * 100}%`, background: VIO }} />
          </div>
        </div>
      ) : null}
      <BeatLine f={f} b={beats[beats.length - 1]} top={130} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------- F2 · 6) o cisne negro
// várias linhas correndo até a mesma coluna (O EVENTO); a nossa (branca) para antes, a ponta fica preta: SEM CATALISADOR;
// depois a lista do que nunca importou (riscada) e o que importava; a arquitetura dos empregadores (grade) com uma peça faltando.
export const HLBlackSwan: React.FC<Record<string, number> & { life: number }> = (p) => {
  const f = useCurrentFrame();
  const a = (k: string) => p[k] ?? 1e9;
  const ph2 = P(f, a("neverAt"), 16);
  return (
    <AbsoluteFill style={{ background: BG9("#0a0a0c"), overflow: "hidden", fontFamily: MONO }}>
      <Title9 t={ph2 > 0.5 ? "O QUE IMPORTAVA" : f >= a("swanAt") ? "O CISNE NEGRO" : "A EXCEÇÃO"} col={CREAM} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: 1 - ph2 * 0.85 }}>
        <rect x={1640} y={160} width={60} height={760} fill="rgba(255,178,46,0.12)" stroke={AMB} strokeWidth={2} />
        <text x={1670} y={150} textAnchor="middle" fill={AMB} fontFamily={MONO} fontSize={14} letterSpacing={3}>O CATALISADOR</text>
        {Array.from({ length: 7 }).map((_, i) => {
          const ours = i === 3;
          const y = 200 + i * 110;
          const reach = P(f, a("linesAt") + i * 5, 60);
          const end = ours ? lerp(160, 1180, P(f, a("oursAt"), 40)) : lerp(160, 1640, reach);
          const wav = Array.from({ length: 30 }).map((__, k) => { const x = lerp(160, end, k / 29); return `${x},${y + Math.sin(k * 0.7 + i) * (ours ? 4 : 10) * (1 - k / 29)}`; }).join(" ");
          return (
            <g key={i}>
              <polyline points={wav} fill="none" stroke={ours ? CREAM : "rgba(255,226,176,0.35)"} strokeWidth={ours ? 4 : 2} />
              {ours && f >= a("swanAt") ? <circle cx={end} cy={y} r={14} fill="#000" stroke={CREAM} strokeWidth={3} /> : null}
              {ours && f >= a("swanAt") ? <text x={end + 30} y={y + 6} fill={CREAM} fontFamily={MONO} fontSize={18} letterSpacing={3}>SEM CATALISADOR</text> : null}
            </g>
          );
        })}
      </svg>
      {f >= a("diffAt") && ph2 < 1 ? <div style={{ position: "absolute", left: 120, top: 120, fontSize: 20, letterSpacing: 3, color: "rgba(255,226,176,0.7)", opacity: P(f, a("diffAt"), 8) * (1 - ph2) }}>CAMINHOS DIFERENTES · VENCEDORES DIFERENTES · TEMPOS DIFERENTES · O MESMO EVENTO</div> : null}
      {ph2 > 0 ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 240, textAlign: "center", opacity: ph2 }}>
          {[
            { k: "OS COMBINE VENCEREM", at: a("neverAt") },
            { k: "A HUMANIDADE VENCER", at: a("humAt") },
            { k: "ALGUÉM ALCANÇAR A PERPETUIDADE", at: a("perpAt") },
          ].map((r, i) => (f >= r.at ? <div key={i} style={{ fontSize: 30, letterSpacing: 4, color: "rgba(255,226,176,0.45)", textDecoration: "line-through", marginTop: 12 }}>{r.k}</div> : null))}
          {f >= a("whatAt") ? <div style={{ fontSize: 44, letterSpacing: 5, color: AMB, marginTop: 40, opacity: P(f, a("whatAt"), 8) }}>QUE O CATALISADOR ACONTECESSE</div> : null}
          {f >= a("archAt") ? (
            <svg width={600} height={160} style={{ marginTop: 30 }}>
              {Array.from({ length: 24 }).map((_, k) => {
                const missing = k === 13;
                return <rect key={k} x={10 + (k % 8) * 72} y={10 + Math.floor(k / 8) * 48} width={62} height={38} fill={missing ? "none" : "rgba(199,155,255,0.15)"} stroke={missing ? RED : VIO} strokeWidth={2} strokeDasharray={missing ? "6 5" : undefined} opacity={missing ? 0.5 + 0.5 * Math.sin(f / 5) : 1} />;
              })}
            </svg>
          ) : null}
          {f >= a("archAt") ? <div style={{ fontSize: 18, letterSpacing: 4, color: VIO }}>A ARQUITETURA DOS EMPREGADORES</div> : null}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------- F2 · 7) o G-Man falha
// como o HLGmanFreeze, mas a maleta duplica (dois lugares ao mesmo tempo), a fala corta no meio e ele some sem corredor.
export const HLGmanGlitch: React.FC<{ life: number; lines?: string[]; stopAt?: number; gmanAt?: number; l0At?: number; l1At?: number; l2At?: number; l3At?: number; cutAt?: number; glitchAt?: number; goneAt?: number; noteAt?: number; lostAt?: number }> = (p) => {
  const f = useCurrentFrame();
  const a = (v?: number) => v ?? 1e9;
  const lines = p.lines ?? [];
  const ats = [p.l0At, p.l1At, p.l2At, p.l3At].map(a);
  let cur = -1;
  ats.forEach((t, i) => { if (i < lines.length && f >= t) cur = i; });
  const gone = f >= a(p.goneAt);
  const gl = f >= a(p.glitchAt) && !gone;
  const jit = gl ? (Math.floor(f / 3) % 2 ? 1 : 0) : 0;
  const cut = f >= a(p.cutAt) && cur >= 0;
  const txt = cur >= 0 ? lines[cur] : "";
  const shown = cut && cur === lines.length - 1 ? txt.slice(0, Math.max(0, Math.min(txt.length, Math.floor((a(p.goneAt) - ats[cur]) * 1.2)))) : txt;
  return (
    <AbsoluteFill style={{ background: "#060607", overflow: "hidden", fontFamily: MONO }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {!gone && f >= a(p.gmanAt) ? <Brief x={1260 + jit * 14} y={760} s={1.4} o={gl ? 0.5 + 0.5 * Math.sin(f) : 1} /> : null}
        {gl ? <Brief x={520} y={700} s={1.2} o={0.3 + 0.3 * Math.sin(f / 2)} /> : null}
        {gl ? <rect x={0} y={(f * 37) % 1080} width={1920} height={6} fill="rgba(255,226,176,0.15)" /> : null}
      </svg>
      {f >= a(p.stopAt) ? <div style={{ position: "absolute", left: 70, top: 56, fontSize: 22, letterSpacing: 8, color: "rgba(255,226,176,0.5)" }}>O TEMPO PARA</div> : null}
      {cur >= 0 && !gone ? (
        <div style={{ position: "absolute", left: 200 + jit * 6, right: 200, top: 380, textAlign: "center", fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: "italic", fontSize: 54, lineHeight: 1.3, color: CREAM, opacity: P(f, ats[cur], 14) }}>
          {shown}
        </div>
      ) : null}
      {gone ? <div style={{ position: "absolute", left: 0, right: 0, top: 460, textAlign: "center", fontSize: 26, letterSpacing: 8, color: "rgba(255,226,176,0.6)", opacity: P(f, a(p.goneAt), 20) }}>SEM DESPEDIDA · SEM CORREDOR · SEM ÊXTASE</div> : null}
      {f >= a(p.lostAt) ? <div style={{ position: "absolute", left: 0, right: 0, top: 560, textAlign: "center", fontSize: 40, letterSpacing: 6, color: AMB, opacity: P(f, a(p.lostAt), 10) }}>ELES PERDERAM</div> : null}
      {void p.noteAt}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------- F2 · 8) as despedidas pelo rádio
export const HLRadioGoodbye: React.FC<Record<string, number> & { life: number }> = (p) => {
  const f = useCurrentFrame();
  const a = (k: string) => p[k] ?? 1e9;
  const R = [
    { k: "MAGNUSSON", v: "DESSA VEZ, O FOGUETE NÃO VAI SALVAR NINGUÉM", c: AMB, at: a("magAt") },
    { k: "KLEINER", v: "SEM CÁLCULOS · SÓ AGRADECE AO GORDON", c: ICE, at: a("kleinerAt") },
    { k: "BARNEY", v: "“AQUELA CERVEJA VAI FICAR PRA OUTRA VIDA.”", c: GREEN, at: a("barneyAt") },
  ];
  const mute = f >= a("muteAt");
  return (
    <AbsoluteFill style={{ background: BG9("#0a0a0a"), overflow: "hidden", fontFamily: MONO }}>
      <Title9 t={mute ? "O RÁDIO FICA MUDO" : "A FUGA FICA MAIS SILENCIOSA"} col={CREAM} />
      {R.map((r, i) => {
        if (f < r.at) return null;
        const live = !mute && (i === R.length - 1 || f < R[i + 1].at);
        return (
          <div key={i} style={{ position: "absolute", left: 260, right: 260, top: 220 + i * 210, padding: "20px 26px", border: `1px solid ${live ? r.c : "rgba(255,226,176,0.2)"}`, borderRadius: 10, background: "rgba(8,8,8,0.88)", opacity: flickIn(f, r.at) * (live ? 1 : 0.45) }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, letterSpacing: 4, color: r.c }}>
              <span>{r.k}</span>
              <span>{live ? "● NO AR" : "○ SEM SINAL"}</span>
            </div>
            <div style={{ fontSize: 30, letterSpacing: 2, color: CREAM, marginTop: 10 }}>{r.v}</div>
            <svg width={1300} height={30} style={{ marginTop: 8 }}>
              <polyline points={Array.from({ length: 120 }).map((_, k) => `${k * 11},${15 + (live ? Math.sin(k * 0.8 + f * 0.6) * 10 * rnd(k + Math.floor(f / 3)) : 0)}`).join(" ")} fill="none" stroke={r.c} strokeWidth={2} opacity={0.7} />
            </svg>
          </div>
        );
      })}
      {f >= a("laughAt") && !mute ? <div style={{ position: "absolute", right: 280, top: 650, fontSize: 18, letterSpacing: 3, color: GREEN }}>(UMA RISADA CURTA)</div> : null}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------- F2 · 9) o reencontro e a luz verde
// um portal (anel âmbar) abre na neve; o ponto da Alyx sai e chega ao Eli (verde) e ao Dog; os dois se juntam; Gordon segue
// sozinho para a direita; o céu dobra (linhas curvando), o chão abre em luz; anéis verdes (Vortigaunt) envolvem o ponto dele
// e tudo vira branco.
export const HLPortalReunion: React.FC<Record<string, number> & { life: number }> = (p) => {
  const f = useCurrentFrame();
  const a = (k: string) => p[k] ?? 1e9;
  const out = P(f, a("throughAt"), 40);
  const A = { x: lerp(560, 860, out), y: 640 };
  const G = { x: lerp(1000, 1500, P(f, a("aloneAt"), 200)), y: 600 };
  const fold = P(f, a("foldAt"), 90);
  const green = P(f, a("greenAt"), 60);
  const white = P(f, a("vanishAt"), 30);
  const beats = pickBeats(f, p, [
    { k: "ALYX ABRE UMA PASSAGEM ATÉ ELI", c: AMB, key: "portalAt" },
    { k: "A ÚLTIMA COISA QUE O NAVIO CONSEGUE FAZER", c: ICE, key: "lastAt" },
    { k: "ELA ENCONTRA O PAI NA NEVE · DOG ESTÁ COM ELE", c: GREEN, key: "throughAt" },
    { k: "SEM GRANDE CONVERSA · SEM JUSTIFICATIVA", c: CREAM, key: "talkAt" },
    { k: "SÓ SABE QUE O CATALISADOR NÃO ACONTECEU", c: AMB, key: "knowsAt" },
    { k: "GORDON SEGUE SOZINHO", c: CREAM, key: "aloneAt" },
    { k: "O CÉU SE DOBRA · O CHÃO ABRE EM LUZ", c: ICE, key: "foldAt" },
    { k: "A MESMA ENERGIA VORTIGAUNT DO EPISÓDIO 1", c: GREEN, key: "greenAt" },
    { k: "SEM EXPLICAÇÃO · SÓ LUZ", c: GREEN, key: "lightAt" },
  ]);
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 30%, #121820 0%, #04060a 80%)", overflow: "hidden", fontFamily: MONO }}>
      <Title9 t="A NEVE" col={ICE} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <path key={i} d={`M 0 ${100 + i * 50} Q 960 ${100 + i * 50 + fold * (200 + i * 30)} 1920 ${100 + i * 50}`} fill="none" stroke="rgba(159,230,255,0.25)" strokeWidth={2} />
        ))}
        {fold > 0 ? <rect x={0} y={lerp(1080, 760, fold)} width={1920} height={400} fill="rgba(255,248,230,0.12)" /> : null}
        {f >= a("portalAt") ? <ellipse cx={560} cy={620} rx={60 * P(f, a("portalAt"), 20)} ry={90 * P(f, a("portalAt"), 20)} fill="rgba(255,178,46,0.1)" stroke={AMB} strokeWidth={3} opacity={1 - P(f, a("talkAt"), 30)} /> : null}
        {f >= a("throughAt") ? <circle cx={A.x} cy={A.y} r={13} fill={AMB} /> : null}
        <circle cx={900} cy={650} r={13} fill={GREEN} opacity={P(f, a("portalAt"), 20)} />
        <circle cx={940} cy={675} r={9} fill={CREAM} opacity={P(f, a("portalAt"), 20) * (f >= a("dogAt") ? 1 : 0.5)} />
        {f >= a("hugAt") ? <circle cx={880} cy={648} r={40 + 3 * Math.sin(f / 8)} fill="none" stroke={AMB} strokeWidth={1.5} opacity={0.5} /> : null}
        <circle cx={G.x} cy={G.y} r={11} fill={AMB} opacity={f >= a("aloneAt") ? 1 : 0.6} />
        {green > 0 ? [0, 1, 2].map((k) => <circle key={k} cx={G.x} cy={G.y} r={30 + k * 26 + 6 * Math.sin(f / 5 + k)} fill="none" stroke={GREEN} strokeWidth={3} opacity={green * 0.8} />) : null}
      </svg>
      <div style={{ position: "absolute", inset: 0, background: "#fffaf0", opacity: white }} />
      <BeatLine f={f} b={beats[beats.length - 1]} top={140} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------- F2 · 10) o mundo dos Vortigaunts
// um planeta calmo: céu em gradiente suave, horizonte, pontos verdes andando devagar; SEM RUÍNAS · SEM COMBINE · SEM BOREALIS;
// o Vortigaunt velho sentado (ponto verde maior parado) e o Gordon ao lado; a névoa no horizonte se abre sobre NADA; a fala
// dele; a comparação dos dois finais; a tela escurece.
export const HLVortWorld: React.FC<Record<string, number> & { life: number }> = (p) => {
  const f = useCurrentFrame();
  const a = (k: string) => p[k] ?? 1e9;
  const mist = P(f, a("mistAt"), 120);
  const cmp = P(f, a("diffAt"), 16);
  const dark = P(f, a("darkAt"), 40);
  const beats = pickBeats(f, p, [
    { k: "UM PLANETA CALMO", c: GREEN, key: "wakeAt" },
    { k: "SEM RUÍNAS · SEM COMBINE · SEM BOREALIS", c: CREAM, key: "noAt" },
    { k: "VORTIGAUNTS TRABALHANDO · CULTIVANDO · CONVERSANDO", c: GREEN, key: "workAt" },
    { k: "NINGUÉM COMEMORA · NINGUÉM EXPLICA", c: CREAM, key: "nobodyAt" },
    { k: "UM VORTIGAUNT OFERECE COMIDA E CONTINUA ANDANDO", c: GREEN, key: "foodAt" },
    { k: "O FINAL AINDA É JOGÁVEL", c: AMB, key: "playAt" },
    { k: "O VORTIGAUNT VELHO · OLHANDO PARA O CÉU", c: GREEN, key: "oldAt" },
    { k: "A NÉVOA SE ABRE · NENHUM FUTURO CONHECIDO ATRÁS DELA", c: ICE, key: "mistAt" },
    { k: "NINGUÉM VIU O QUE VEM DEPOIS", c: ICE, key: "nobodySawAt" },
    { k: "“NÃO SEI SE FOI UMA VITÓRIA. NÃO SEI O QUE NASCEU.”", c: GREEN, key: "vortAt" },
  ]);
  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #0d1a1a 0%, #1a2a22 55%, #0a120e 100%)", overflow: "hidden", fontFamily: MONO }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: 1 - cmp }}>
        <path d="M 0 700 Q 480 660 960 690 T 1920 680 L 1920 1080 L 0 1080 Z" fill="rgba(141,255,168,0.06)" stroke="rgba(141,255,168,0.3)" strokeWidth={2} />
        {Array.from({ length: 6 }).map((_, i) => <rect key={"m" + i} x={lerp(1100, 700, mist) + i * 30} y={560 + i * 18} width={lerp(600, 1200, mist) - i * 60} height={14} rx={7} fill="rgba(220,240,255,0.08)" opacity={1 - mist * 0.9} />)}
        {Array.from({ length: 12 }).map((_, i) => {
          const x = (200 + i * 140 + f * (0.3 + rnd(i) * 0.4)) % 1920;
          return <circle key={i} cx={x} cy={760 + rnd(i * 3) * 160} r={9} fill={GREEN} opacity={P(f, a("workAt"), 20) * 0.7} />;
        })}
        {f >= a("oldAt") ? <circle cx={880} cy={820} r={14} fill={GREEN} /> : null}
        {f >= a("sitAt") ? <circle cx={930} cy={826} r={11} fill={AMB} /> : null}
      </svg>
      {cmp > 0 ? (
        <div style={{ position: "absolute", inset: 0, display: "flex", justifyContent: "center", alignItems: "center", gap: 60, opacity: cmp * (1 - dark) }}>
          {[
            { t: "FINAL 1", a: "SALVA A TERRA", b: "RECEBE A CERTEZA DE QUE ESCOLHEU ERRADO", c: AMB, at: a("f1At") },
            { t: "FINAL 2", a: "PERDE A TERRA INTEIRA", b: "NUNCA RECEBE A CONFIRMAÇÃO DE QUE ESCOLHEU CERTO", c: ICE, at: a("f2At") },
          ].map((c, i) =>
            f >= c.at ? (
              <div key={i} style={{ width: 640, padding: "28px 30px", border: `1px solid ${c.c}`, borderRadius: 12, background: "rgba(6,8,8,0.9)", opacity: flickIn(f, c.at) }}>
                <div style={{ fontSize: 18, letterSpacing: 6, color: c.c }}>{c.t}</div>
                <div style={{ fontSize: 34, letterSpacing: 3, color: CREAM, marginTop: 12 }}>{c.a}</div>
                <div style={{ fontSize: 22, letterSpacing: 2, color: "rgba(255,226,176,0.75)", marginTop: 12 }}>{c.b}</div>
              </div>
            ) : null,
          )}
        </div>
      ) : null}
      {cmp < 1 ? <BeatLine f={f} b={beats[beats.length - 1]} top={140} /> : null}
      <div style={{ position: "absolute", inset: 0, background: "#000", opacity: dark }} />
      {f >= a("notGmanAt") ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 420, textAlign: "center", opacity: P(f, a("notGmanAt"), 14) }}>
          <div style={{ fontSize: 28, letterSpacing: 5, color: "rgba(255,226,176,0.7)" }}>NÃO É O G-MAN QUE VEM BUSCAR O GORDON</div>
          {f >= a("noStasisAt") ? <div style={{ fontSize: 24, letterSpacing: 5, color: "rgba(255,226,176,0.5)", marginTop: 16 }}>SEM ÊXTASE · SEM PRÓXIMA MISSÃO</div> : null}
          {f >= a("futureAt") ? <div style={{ fontSize: 40, letterSpacing: 5, color: CREAM, marginTop: 30, opacity: P(f, a("futureAt"), 14) }}>SÓ UM FUTURO QUE NINGUÉM CONSEGUIU PREVER</div> : null}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ================================================================================================ MÓDULO 15 · EPÍLOGO
// ---------------------------------------------------------------------------------------------- 15 · 1) de volta às ideias simples
// nuvem de conceitos que se recolhe; o multiverso riscado; três círculos (PASSADO · PRESENTE · FUTURO) que se encostam
// dentro do contorno de um navio; a corrente de ideias (FERIDA → NÚCLEO → CATALISADOR → PERPETUIDADE → G-MAN → LINHAS);
// os dois finais em uma linha cada.
export const HLSimpleIdeas: React.FC<Record<string, number> & { life: number }> = (p) => {
  const f = useCurrentFrame();
  const a = (k: string) => p[k] ?? 1e9;
  const words = ["REGRAS", "VIAGEM NO TEMPO", "BOREALIS", "G-MAN", "COMBINE", "VORTIGAUNTS", "CATALISADOR", "LINHAS", "PERPETUIDADE", "ADVISORS", "NÉVOA"];
  const shrink = P(f, a("simpleAt"), 40);
  const ph = f >= a("chainAt") ? 2 : f >= a("shipAt") ? 1 : 0;
  const chain = [
    { k: "A FERIDA DE BLACK MESA", at: a("woundAt") },
    { k: "O NÚCLEO PRESO A ELA", at: a("coreAt") },
    { k: "O CATALISADOR", at: a("catAt") },
    { k: "A PERPETUIDADE", at: a("perpAt") },
    { k: "O G-MAN SEM A ÚLTIMA JOGADA", at: a("gmanAt") },
    { k: "LINHAS · O MESMO ACONTECIMENTO", at: a("linesAt") },
  ];
  return (
    <AbsoluteFill style={{ background: BG9("#0a0a0c"), overflow: "hidden", fontFamily: MONO }}>
      <Title9 t={ph === 2 ? "DE ONDE SAIU A MITOLOGIA" : ph === 1 ? "O BOREALIS · UM LUGAR PARA BRINCAR COM O TEMPO" : "DEPOIS DISSO TUDO"} col={CREAM} />
      {ph === 0
        ? words.map((w, i) => {
            const an = (i / words.length) * Math.PI * 2 + f / 400;
            const r = lerp(380, 60, shrink);
            return (
              <div key={w} style={{ position: "absolute", left: 960 + Math.cos(an) * r * 1.4 - 150, top: 520 + Math.sin(an) * r - 16, width: 300, textAlign: "center", fontSize: 26, letterSpacing: 4, color: CREAM, opacity: P(f, a("bigAt") + i * 3, 10) * (1 - shrink) }}>
                {w}
              </div>
            );
          })
        : null}
      {ph === 0 && f >= a("simpleAt") ? <div style={{ position: "absolute", left: 0, right: 0, top: 500, textAlign: "center", fontSize: 34, letterSpacing: 5, color: AMB, opacity: shrink }}>ALGUMAS IDEIAS SIMPLES</div> : null}
      {ph === 1 ? (
        <>
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
            <path d="M 360 600 L 520 440 L 1400 440 L 1560 600 L 1400 760 L 520 760 Z" fill="rgba(159,230,255,0.04)" stroke={ICE} strokeWidth={2} opacity={P(f, a("shipAt"), 20)} />
            {["PASSADO", "PRESENTE", "FUTURO"].map((k, i) => {
              const touch = P(f, a("touchAt"), 60);
              const x = 960 + (i - 1) * lerp(330, 150, touch);
              return (
                <g key={k} opacity={P(f, a("pastAt") + i * 8, 12)}>
                  <circle cx={x} cy={600} r={110} fill={["rgba(199,155,255,0.12)", "rgba(255,178,46,0.12)", "rgba(159,230,255,0.12)"][i]} stroke={[VIO, AMB, ICE][i]} strokeWidth={2.5} />
                  <text x={x} y={606} textAnchor="middle" fill={CREAM} fontFamily={MONO} fontSize={18} letterSpacing={4}>{k}</text>
                </g>
              );
            })}
          </svg>
          {f >= a("multiAt") ? <div style={{ position: "absolute", left: 0, right: 0, top: 220, textAlign: "center", fontSize: 28, letterSpacing: 4, color: "rgba(255,226,176,0.5)", textDecoration: f >= a("multiAt") + 30 ? "line-through" : "none" }}>UM MULTIVERSO ONDE QUALQUER COISA PODE SER DESFEITA</div> : null}
          {f >= a("boundAt") ? <div style={{ position: "absolute", left: 0, right: 0, top: 830, textAlign: "center", fontSize: 30, letterSpacing: 4, color: ICE, opacity: P(f, a("boundAt"), 8) }}>UM NAVIO PRESO À PRÓPRIA HISTÓRIA</div> : null}
        </>
      ) : null}
      {ph === 2 ? (
        <>
          <div style={{ position: "absolute", left: 120, top: 200, width: 900 }}>
            {chain.map((c, i) =>
              f >= c.at ? (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 16, opacity: flickIn(f, c.at) }}>
                  <span style={{ fontSize: 18, color: AMB }}>{i ? "↓" : "●"}</span>
                  <span style={{ fontSize: 28, letterSpacing: 3, color: CREAM }}>{c.k}</span>
                </div>
              ) : null,
            )}
          </div>
          <div style={{ position: "absolute", right: 120, top: 300, width: 640 }}>
            {f >= a("f1At") ? <div style={{ padding: "18px 22px", border: `1px solid ${AMB}`, borderRadius: 10, opacity: P(f, a("f1At"), 8) }}><div style={{ fontSize: 16, letterSpacing: 5, color: AMB }}>FINAL 1</div><div style={{ fontSize: 26, letterSpacing: 2, color: CREAM, marginTop: 6 }}>MUDA O VENCEDOR · O EVENTO CONTINUA</div></div> : null}
            {f >= a("f2At") ? <div style={{ padding: "18px 22px", border: `1px solid ${ICE}`, borderRadius: 10, marginTop: 20, opacity: P(f, a("f2At"), 8) }}><div style={{ fontSize: 16, letterSpacing: 5, color: ICE }}>FINAL 2</div><div style={{ fontSize: 26, letterSpacing: 2, color: CREAM, marginTop: 6 }}>IMPEDE O EVENTO</div></div> : null}
          </div>
        </>
      ) : null}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------- 15 · 2) a mulher misteriosa
// a ideia que veio antes de tudo: um arquivo de áudio (forma de onda) da MULHER MISTERIOSA comparada com a voz da ALYX
// (duas ondas, semelhança subindo); depois a linha do tempo com o Borealis levando uma Alyx de volta até HALF-LIFE: ALYX; os
// passos dela (aconselha mover o cofre · sabendo que não vão · ganhar confiança · anos antes); O ENCONTRO COM O G-MAN.
export const HLMysteryWoman: React.FC<Record<string, number> & { life: number }> = (p) => {
  const f = useCurrentFrame();
  const a = (k: string) => p[k] ?? 1e9;
  const ph = f >= a("lineAt") ? 1 : 0;
  const sim = Math.min(94, Math.round(P(f, a("voiceAt"), 120) * 94));
  const wave = (seed: number, col: string, y: number) => (
    <polyline points={Array.from({ length: 200 }).map((_, k) => `${200 + k * 7.6},${y + Math.sin(k * 0.35 + seed) * 30 * (0.4 + 0.6 * Math.abs(Math.sin(k * 0.07 + seed + f / 40)))}`).join(" ")} fill="none" stroke={col} strokeWidth={2.5} />
  );
  return (
    <AbsoluteFill style={{ background: BG9("#0c0a08"), overflow: "hidden", fontFamily: MONO }}>
      <Title9 t={ph ? "UMA ALYX · NÃO DAQUELE MOMENTO" : "HALF-LIFE: ALYX · PERTO DO COFRE"} col={AMB} />
      {ph === 0 ? (
        <>
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
            {f >= a("womanAt") ? wave(1, RED, 380) : null}
            {f >= a("voiceAt") ? wave(1.3, AMB, 620) : null}
          </svg>
          {f >= a("womanAt") ? <div style={{ position: "absolute", left: 200, top: 300, fontSize: 18, letterSpacing: 4, color: RED }}>{f >= a("presAt") ? "MULHER MISTERIOSA · LIGADA AOS COMBINE · QUASE SÓ UMA PRESENÇA" : "MULHER MISTERIOSA · LIGADA AOS COMBINE"}</div> : null}
          {f >= a("voiceAt") ? <div style={{ position: "absolute", left: 200, top: 540, fontSize: 18, letterSpacing: 4, color: AMB }}>ALYX VANCE</div> : null}
          {f >= a("voiceAt") ? <div style={{ position: "absolute", right: 200, top: 470, fontSize: 40, letterSpacing: 4, color: CREAM }}>{`SEMELHANÇA ${sim}%`}</div> : null}
          {f >= a("moveAt") ? <div style={{ position: "absolute", left: 0, right: 0, bottom: 120, textAlign: "center", fontSize: 28, letterSpacing: 4, color: CREAM, opacity: P(f, a("moveAt"), 8) }}>{f >= a("knowsAt") ? "COMO SE SOUBESSE O QUE VAI ACONTECER" : "MOVER O COFRE ANTES QUE SEJA TARDE DEMAIS"}</div> : null}
          {f >= a("advAt") ? <div style={{ position: "absolute", left: 0, right: 0, bottom: 70, textAlign: "center", fontSize: 20, letterSpacing: 4, color: VIO, opacity: P(f, a("advAt"), 8) }}>ELA SABIA QUE OS ADVISORS NÃO IAM VER ELA</div> : null}
        </>
      ) : (
        <>
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
            <line x1={160} x2={1760} y1={560} y2={560} stroke="rgba(255,226,176,0.35)" strokeWidth={3} />
            {[
              { x: 380, k: "HALF-LIFE: ALYX", c: AMB },
              { x: 980, k: "HALF-LIFE 2", c: CREAM },
              { x: 1560, k: "O BOREALIS", c: ICE },
            ].map((m, i) => (
              <g key={i}>
                <circle cx={m.x} cy={560} r={14} fill={m.c} />
                <text x={m.x} y={610} textAnchor="middle" fill={m.c} fontFamily={MONO} fontSize={18} letterSpacing={3}>{m.k}</text>
              </g>
            ))}
            {f >= a("backAt") ? <path d={`M 1560 530 Q 970 ${300 - 40 * Math.sin(f / 20)} 380 530`} fill="none" stroke={AMB} strokeWidth={4} strokeDasharray="14 10" strokeDashoffset={f * 2} opacity={P(f, a("backAt"), 20)} /> : null}
            {f >= a("backAt") ? <text x={970} y={330} textAnchor="middle" fill={AMB} fontFamily={MONO} fontSize={18} letterSpacing={3}>MATÉRIA LEVADA A OUTRO PONTO DA MESMA LINHA</text> : null}
          </svg>
          <div style={{ position: "absolute", left: 160, right: 160, top: 680, display: "flex", gap: 20, justifyContent: "center" }}>
            {[
              { k: "NÃO PARA MUDAR · PARA GARANTIR", at: a("ensureAt") },
              { k: "ACONSELHA MOVER O COFRE", at: a("vaultAt") },
              { k: "SABENDO QUE NÃO VÃO MOVER", at: a("knowAt") },
              { k: "GANHAR A CONFIANÇA DELES", at: a("trustAt") },
              { k: "A ALYX MAIS JOVEM ENCONTRA O G-MAN", at: a("meetAt") },
            ].map((s, i) =>
              f >= s.at ? (
                <div key={i} style={{ width: 300, padding: "16px 18px", border: "1px solid rgba(255,178,46,0.5)", borderRadius: 8, background: "rgba(10,8,6,0.88)", fontSize: 18, letterSpacing: 2, color: i === 4 ? AMB : CREAM, opacity: flickIn(f, s.at) }}>
                  {s.k}
                </div>
              ) : null,
            )}
          </div>
        </>
      )}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------- 15 · 3) a ironia
// duas colunas espelhadas que precisam do MESMO ENCONTRO no centro: G-MAN (maleta) × ALYX (ponto âmbar); embaixo de cada uma o
// que ela garante; depois o carimbo TEORIA e as ressalvas.
export const HLMirrorIrony: React.FC<Record<string, number> & { life: number }> = (p) => {
  const f = useCurrentFrame();
  const a = (k: string) => p[k] ?? 1e9;
  const ph2 = P(f, a("theoryAt"), 16);
  return (
    <AbsoluteFill style={{ background: BG9("#0a0a0c"), overflow: "hidden", fontFamily: MONO }}>
      <Title9 t={ph2 > 0.5 ? "SÓ UMA TEORIA" : "UMA IRONIA BONITA"} col={CREAM} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: 1 - ph2 * 0.8 }}>
        <Brief x={460} y={420} s={2} o={P(f, a("gmanAt"), 12)} />
        <circle cx={1460} cy={420} r={40} fill="rgba(255,178,46,0.15)" stroke={AMB} strokeWidth={3} opacity={P(f, a("alyxAt"), 12)} />
        {f >= a("bothAt") ? (
          <g opacity={P(f, a("bothAt"), 20)}>
            <line x1={540} x2={880} y1={420} y2={520} stroke={CREAM} strokeWidth={2} strokeDasharray="8 8" strokeDashoffset={-f} />
            <line x1={1380} x2={1040} y1={420} y2={520} stroke={AMB} strokeWidth={2} strokeDasharray="8 8" strokeDashoffset={-f} />
            <rect x={860} y={490} width={200} height={70} rx={8} fill="rgba(8,8,8,0.9)" stroke={CREAM} strokeWidth={2} />
            <text x={960} y={532} textAnchor="middle" fill={CREAM} fontFamily={MONO} fontSize={16} letterSpacing={3}>O ENCONTRO</text>
          </g>
        ) : null}
      </svg>
      {ph2 < 1 ? (
        <>
          {f >= a("gmanAt") ? <div style={{ position: "absolute", left: 160, width: 600, top: 640, textAlign: "center", fontSize: 22, letterSpacing: 3, color: CREAM, opacity: 1 - ph2 }}>{f >= a("gWhyAt") ? "GARANTE O NASCIMENTO DA AGENTE DELE" : "MANIPULA OS ACONTECIMENTOS PARA PRESERVAR A ESTRUTURA"}</div> : null}
          {f >= a("alyxAt") ? <div style={{ position: "absolute", right: 160, width: 600, top: 640, textAlign: "center", fontSize: 22, letterSpacing: 3, color: AMB, opacity: 1 - ph2 }}>{f >= a("aWhyAt") ? "GARANTE O NASCIMENTO DE QUEM PODE DERROTÁ-LO" : "USA A MESMA LÓGICA CONTRA ELE"}</div> : null}
        </>
      ) : null}
      {ph2 > 0 ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 300, textAlign: "center", opacity: ph2 }}>
          <div style={{ display: "inline-block", padding: "10px 28px", border: `3px solid ${AMB}`, color: AMB, fontSize: 56, letterSpacing: 10, transform: "rotate(-4deg)" }}>TEORIA</div>
          {f >= a("maybeAt") ? <div style={{ fontSize: 26, letterSpacing: 4, color: "rgba(255,226,176,0.7)", marginTop: 50 }}>TALVEZ NÃO SEJA A ALYX · TALVEZ NUNCA SEJA EXPLICADO</div> : null}
          {f >= a("okAt") ? <div style={{ fontSize: 40, letterSpacing: 5, color: CREAM, marginTop: 30, opacity: P(f, a("okAt"), 8) }}>E TUDO BEM</div> : null}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------- 15 · 4) o Half-Life 3 que eu gostaria de jogar
// uma ficha de jogo (lista de desejos) marcando item por item; no fim: UM FINAL DIGNO.
export const HLWishList: React.FC<Record<string, number> & { life: number }> = (p) => {
  const f = useCurrentFrame();
  const a = (k: string) => p[k] ?? 1e9;
  const items = [
    { k: "UM BOREALIS QUE JUSTIFIQUE 20 ANOS DE MISTÉRIO", at: a("w1At") },
    { k: "UM G-MAN COMPREENSÍVEL PARA TEORIAS · ESTRANHO DEMAIS PARA EXPLICAR", at: a("w2At") },
    { k: "COMBINE MAIS DO QUE UM IMPÉRIO MALIGNO", at: a("w3At") },
    { k: "UMA ALYX COM CONSEQUÊNCIA REAL", at: a("w4At") },
    { k: "UM JOGO QUE REALMENTE TERMINE · SEM HALF-LIFE 4", at: a("w5At") },
  ];
  const dig = P(f, a("worthyAt"), 20);
  return (
    <AbsoluteFill style={{ background: BG9("#0c0a08"), overflow: "hidden", fontFamily: MONO }}>
      <Title9 t="O HALF-LIFE 3 QUE EU GOSTARIA DE JOGAR" col={AMB} o={P(f, a("askAt"), 10)} />
      <div style={{ position: "absolute", left: 300, right: 300, top: 180, opacity: 1 - dig * 0.8 }}>
        {items.map((it, i) =>
          f >= it.at ? (
            <div key={i} style={{ display: "flex", gap: 20, alignItems: "center", padding: "16px 0", borderBottom: "1px solid rgba(255,226,176,0.15)", opacity: flickIn(f, it.at) }}>
              <span style={{ width: 34, height: 34, border: `2px solid ${AMB}`, borderRadius: 6, display: "inline-flex", alignItems: "center", justifyContent: "center", color: AMB, fontSize: 24 }}>{f >= it.at + 12 ? "✓" : ""}</span>
              <span style={{ fontSize: 26, letterSpacing: 2, color: CREAM }}>{it.k}</span>
            </div>
          ) : null,
        )}
      </div>
      {f >= a("noAnsAt") && dig < 1 ? <div style={{ position: "absolute", left: 0, right: 0, bottom: 110, textAlign: "center", fontSize: 24, letterSpacing: 4, color: "rgba(255,226,176,0.6)", opacity: P(f, a("noAnsAt"), 8) }}>NÃO UMA RESPOSTA PARA CADA PERGUNTA</div> : null}
      {dig > 0 ? <div style={{ position: "absolute", left: 0, right: 0, top: 460, textAlign: "center", fontSize: 90, letterSpacing: 12, color: CREAM, opacity: dig, textShadow: "0 0 40px rgba(255,226,176,0.35)" }}>UM FINAL DIGNO</div> : null}
      {f >= a("worthAt") ? <div style={{ position: "absolute", left: 0, right: 0, top: 620, textAlign: "center", fontSize: 26, letterSpacing: 5, color: AMB, opacity: P(f, a("worthAt"), 10) }}>SE VOCÊ IMAGINOU ESSE JOGO EXISTINDO · JÁ VALEU</div> : null}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------- 15 · 5) obrigado + próximos vídeos + volta ao comentário
// agradecimento; COMENTA: três cartões de próximos vídeos; depois o comentário de antes dos finais (caixa com as duas opções)
// e a pergunta; termina na frase dele e escurece.
export const HLOutroComment: React.FC<Record<string, number> & { life: number }> = (p) => {
  const f = useCurrentFrame();
  const a = (k: string) => p[k] ?? 1e9;
  const life = p.life;
  const ph = f >= a("backAt") ? 2 : f >= a("nextAt") ? 1 : 0;
  return (
    <AbsoluteFill style={{ background: BG9("#0a0a0c"), overflow: "hidden", fontFamily: MONO }}>
      <Title9 t={ph === 2 ? "O COMENTÁRIO DE ANTES DOS FINAIS" : ph === 1 ? "PRÓXIMOS VÍDEOS" : "OBRIGADO"} col={CREAM} />
      {ph === 0 ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 420, textAlign: "center" }}>
          <div style={{ fontSize: 40, letterSpacing: 5, color: CREAM, opacity: P(f, a("funAt"), 10) }}>CONSTRUÍDO DETALHE A DETALHE</div>
          {f >= a("hopeAt") ? <div style={{ fontSize: 26, letterSpacing: 4, color: AMB, marginTop: 24 }}>ESPERO QUE VOCÊ TENHA GOSTADO</div> : null}
        </div>
      ) : null}
      {ph === 1 ? (
        <>
          <div style={{ position: "absolute", left: 0, right: 0, top: 170, textAlign: "center", fontSize: 26, letterSpacing: 4, color: AMB }}>ME CONTA NOS COMENTÁRIOS · QUAL PRIMEIRO?</div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 360, display: "flex", justifyContent: "center", gap: 40 }}>
            {[
              { k: "COMO EU FARIA", v: "THE LAST OF US 3", at: a("tlouAt") },
              { k: "A LORE DE", v: "RUPTURA", s: "E O QUE ELA TEM A VER COM HALF-LIFE E PORTAL", at: a("sevAt") },
            ].map((c, i) =>
              f >= c.at ? (
                <div key={i} style={{ width: 560, padding: "30px 30px", border: "1px solid rgba(255,226,176,0.4)", borderRadius: 12, background: "rgba(8,8,8,0.9)", opacity: flickIn(f, c.at) }}>
                  <div style={{ fontSize: 18, letterSpacing: 5, color: "rgba(255,226,176,0.6)" }}>{c.k}</div>
                  <div style={{ fontSize: 46, letterSpacing: 4, color: CREAM, marginTop: 10 }}>{c.v}</div>
                  {c.s ? <div style={{ fontSize: 18, letterSpacing: 2, color: AMB, marginTop: 10 }}>{c.s}</div> : null}
                </div>
              ) : null,
            )}
          </div>
        </>
      ) : null}
      {ph === 2 ? (
        <>
          <div style={{ position: "absolute", left: 460, right: 460, top: 220, padding: "24px 28px", border: "1px solid rgba(255,226,176,0.4)", borderRadius: 12, background: "rgba(8,8,8,0.9)" }}>
            <div style={{ fontSize: 15, letterSpacing: 4, color: "rgba(255,226,176,0.6)" }}>SEU COMENTÁRIO · ANTES DOS FINAIS</div>
            <div style={{ display: "flex", gap: 20, marginTop: 16 }}>
              {[
                { k: "USAR O BOREALIS", c: AMB },
                { k: "DESTRUIR O NÚCLEO", c: ICE },
              ].map((o, i) => (
                <div key={i} style={{ flex: 1, padding: "16px", border: `1px solid ${o.c}`, borderRadius: 8, fontSize: 22, letterSpacing: 3, color: o.c, textAlign: "center", opacity: 0.6 + 0.4 * Math.sin(f / 10 + i * 3) }}>
                  {o.k}
                </div>
              ))}
            </div>
          </div>
          {f >= a("askAt") ? <div style={{ position: "absolute", left: 0, right: 0, top: 560, textAlign: "center", fontSize: 50, letterSpacing: 4, color: CREAM, opacity: P(f, a("askAt"), 10) }}>VOCÊ ESCOLHERIA A MESMA COISA?</div> : null}
          {f >= a("unsureAt") ? <div style={{ position: "absolute", left: 0, right: 0, top: 680, textAlign: "center", fontSize: 26, letterSpacing: 4, color: AMB, opacity: P(f, a("unsureAt"), 10) }}>EU AINDA NÃO TENHO CERTEZA SE EU ESCOLHERIA</div> : null}
        </>
      ) : null}
      <div style={{ position: "absolute", inset: 0, background: "#000", opacity: P(f, life - 60, 60) }} />
    </AbsoluteFill>
  );
};
