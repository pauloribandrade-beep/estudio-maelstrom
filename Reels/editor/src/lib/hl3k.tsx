import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { loadFont as loadCaveat } from "@remotion/google-fonts/Caveat";
import { FONT, MONO } from "./overlays";
import { C, rnd } from "./hl3";

// Parte 3 (a história) — telas DENTRO do mundo do jogo (2026-10-02): o status do traje HEV por cima da imagem real,
// o mapa estratégico Overwatch dos Combine, o terminal CRT do Kleiner e o cartão da regra nº 1 (único lugar com
// traço à mão). Tempos em QUADROS relativos à cena.
const { fontFamily: HAND } = loadCaveat();
const P = (f: number, at: number, d = 10) => interpolate(f, [at, at + d], [0, 1], { ...C, easing: Easing.out(Easing.cubic) });
const flickIn = (f: number, at: number) => {
  const d = f - at;
  if (d < 0) return 0;
  if (d < 8) return [0.2, 1, 0.3, 1, 0.6, 1, 0.85, 1][d];
  return 1;
};

// =============================================================================================== HEV status
// fichas no estilo do painel do HL2 (caixas âmbar translúcidas no canto), cada uma entra piscando
export const HLHevStatus: React.FC<{ life: number; items?: { k: string; v: string; tone?: "ok" | "bad" | "warn"; at: number }[]; prioAt?: number; prio?: string }> = ({ life, items = [], prioAt = 1e9, prio = "" }) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [life - 10, life], [1, 0], C);
  const AMB = "#ffb22e";
  const col = { ok: "#bfff9a", bad: "#ff5d4d", warn: "#ffd04d" } as const;
  return (
    <AbsoluteFill style={{ opacity: o, pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: 70, bottom: 90, display: "flex", flexDirection: "column", gap: 14 }}>
        {[...items, ...(prio ? [{ k: "PRIORIDADE", v: prio, tone: "warn" as const, at: prioAt, prio: true }] : [])].map((it, i) => {
          const a = flickIn(f, it.at);
          const sl = P(f, it.at, 8);
          const isP = "prio" in it;
          return (
            <div key={i} style={{ opacity: a, transform: `translateX(${(1 - sl) * -40}px)`, display: "flex", alignItems: "center", gap: 18, padding: "12px 22px", borderRadius: 12, background: isP ? "rgba(70,40,4,0.7)" : "rgba(40,24,4,0.55)", border: isP ? `2px solid ${AMB}` : "1px solid rgba(255,178,46,0.35)", boxShadow: isP ? "0 0 26px rgba(255,178,46,0.3)" : undefined, backdropFilter: "blur(2px)", minWidth: 470 }}>
              <span style={{ width: 12, height: 12, borderRadius: 6, background: isP ? AMB : col[it.tone ?? "ok"], boxShadow: `0 0 12px ${isP ? AMB : col[it.tone ?? "ok"]}`, opacity: it.tone === "warn" && !isP ? (Math.floor((f - it.at) / 10) % 2 ? 0.35 : 1) : 1 }} />
              <span style={{ fontFamily: MONO, fontSize: 24, letterSpacing: 5, color: AMB, flex: 1 }}>{it.k}</span>
              <span style={{ fontFamily: MONO, fontSize: 26, letterSpacing: 4, fontWeight: 700, color: isP ? AMB : col[it.tone ?? "ok"] }}>{it.v}</span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// =============================================================================================== mapa Overwatch
// hemisfério norte visto do polo (o Ártico no centro). Costas bem simplificadas (pontilhado), grade de latitude e
// longitude, marcadores com rótulo. Telas: White Forest (zoom) → mundo → super portal fecha → tropas/synths/advisors →
// a linha para o overworld se rompe → encurralados → todos convergem para o Ártico. No 3B (`borealisAt`), o alvo
// BOREALIS no Ártico com a janela, e as setas Combine chegando ao mesmo ponto.
const COAST: [number, number][][] = [
  [[70, -160], [62, -166], [58, -152], [56, -134], [49, -125], [40, -124], [32, -117], [23, -110], [18, -104], [15, -92], [21, -87], [26, -81], [30, -81], [35, -76], [41, -70], [45, -62], [52, -56], [58, -62], [63, -70], [68, -80], [73, -90], [76, -105], [72, -125], [70, -142]],
  [[60, -44], [65, -40], [71, -22], [78, -18], [83, -32], [82, -60], [77, -70], [70, -54], [64, -51]],
  [[36, -6], [43, -9], [48, -4], [51, 2], [54, 8], [58, 6], [63, 5], [70, 20], [71, 32], [69, 44], [73, 58], [77, 100], [74, 130], [72, 150], [69, 170], [65, -172], [60, 165], [56, 158], [50, 143], [43, 135], [38, 127], [31, 121], [23, 114], [17, 107], [10, 99], [14, 80], [22, 70], [25, 58], [27, 50], [21, 40], [31, 32], [36, 28], [38, 16], [40, 3]],
];
const R0 = 470;
const polar = (lat: number, lon: number): [number, number] => {
  const r = ((90 - lat) / 80) * R0;
  const a = ((lon - 20) * Math.PI) / 180;
  return [Math.sin(a) * r, Math.cos(a) * r];
};
// White Forest fica nas montanhas logo ao norte da City 17 (Outlands)
const PLACES = { wf: [55, 27] as [number, number], c17: [50, 24] as [number, number], arctic: [90, 0] as [number, number] };
export const HLOverwatchMap: React.FC<{
  life: number;
  wfAt?: number;
  worldAt?: number;
  portalAt?: number;
  unitsAt?: number;
  lostAt?: number;
  trapAt?: number;
  arcticAt?: number;
  borealisAt?: number;
  combineAt?: number;
  diveAt?: number;
}> = ({ life, wfAt = 0, worldAt = 1e9, portalAt = 1e9, unitsAt = 1e9, lostAt = 1e9, trapAt = 1e9, arcticAt = 1e9, borealisAt = 1e9, combineAt = 1e9, diveAt }) => {
  const f = useCurrentFrame();
  const HUD = "#c6f7ff";
  const RED = "#ff5566";
  // sem fade (o fundo roxo aparecia): entra com uma varredura de cima para baixo sobre o fundo escuro e corta seco
  const sv = interpolate(f, [0, 14], [0, 1], { ...C, easing: Easing.inOut(Easing.cubic) });
  // câmera nunca parada: chega mergulhando, o mapa gira devagar em volta do polo e vai se aproximando
  const rot = f * 0.05;
  const intro = interpolate(f, [0, 18], [1.4, 1], { ...C, easing: Easing.out(Easing.cubic) });
  const drift = 1 + 0.07 * (f / Math.max(life, 1));
  const pr = (lat: number, lon: number) => polar(lat, lon + rot);
  // zoom: começa em White Forest e abre para o mundo
  const zw = interpolate(f, [worldAt, worldAt + 40], [0, 1], { ...C, easing: Easing.inOut(Easing.cubic) });
  const [wx, wy] = pr(...PLACES.wf);
  const sc = (2.6 - 1.6 * zw) * intro * drift;
  const cx = 960 - wx * (1 - zw) * sc;
  const cy = 560 - wy * (1 - zw) * sc;
  const T = (lat: number, lon: number): [number, number] => {
    const [x, y] = pr(lat, lon);
    return [cx + x * sc, cy + y * sc];
  };
  // radar: um feixe gira em volta do polo e acende o pontilhado por onde passa
  const swA = f * 3.2;
  const glint = (x: number, y: number) => {
    const th = (Math.atan2(x - cx, -(y - cy)) * 180) / Math.PI;
    const d = (((swA - th) % 360) + 360) % 360;
    return d < 50 ? 1 - d / 50 : 0;
  };
  // mira trava em White Forest quando a cena abre nele
  const zoomed = worldAt > wfAt + 10;
  const lockAt = wfAt + 18;
  const rs = interpolate(f, [wfAt + 2, lockAt], [120, 34], { ...C, easing: Easing.out(Easing.cubic) });
  const locked = f >= lockAt;
  // saída: mergulha no Ártico e estoura em branco gelado — o feed Combine (céu do Ártico) entra daí
  const dv = diveAt === undefined ? 0 : interpolate(f, [diveAt, life], [0, 1], { ...C, easing: Easing.in(Easing.cubic) });
  // unidades Combine: espalhadas pelos continentes; no `arcticAt` todas andam para o centro
  const units = Array.from({ length: 26 }).map((_, i) => {
    const lat = 28 + rnd(i * 3 + 1) * 40;
    const lon = -170 + rnd(i * 7 + 2) * 340;
    const kind = i % 6 === 0 ? "ADV" : i % 3 === 0 ? "SYN" : "TRP";
    return { lat, lon, kind, d: rnd(i * 11) * 25 };
  });
  const go = (u: { d: number }) => interpolate(f, [arcticAt + u.d, arcticAt + u.d + 70], [0, 1], { ...C, easing: Easing.inOut(Easing.cubic) });
  const portalR = f < portalAt ? 1 : interpolate(f, [portalAt, portalAt + 24], [1, 0], { ...C, easing: Easing.in(Easing.cubic) });
  const [px, py] = T(...PLACES.c17);
  const lost = f >= lostAt;
  const trap = f >= trapAt && f < arcticAt + 20;
  const [ax, ay] = T(...PLACES.arctic);
  const tc = `${String(Math.floor(f / 30 / 60) + 4).padStart(2, "0")}:${String(Math.floor(f / 30) % 60).padStart(2, "0")}:${String(f % 30).padStart(2, "0")}`;
  const coast = COAST.map((poly) => {
    const pts: [number, number][] = [];
    for (let k = 0; k < poly.length; k++) {
      const a = poly[k];
      const b = poly[(k + 1) % poly.length];
      for (let s = 0; s < 6; s++) {
        const u = s / 6;
        pts.push(T(a[0] + (b[0] - a[0]) * u, a[1] + (((b[1] - a[1] + 540) % 360) - 180) * u));
      }
    }
    return pts;
  });
  const dk = 1 + 9 * dv * dv;
  const camT = `translate(${ax + (960 - ax) * dv}px, ${ay + (540 - ay) * dv}px) scale(${dk}) translate(${-ax}px, ${-ay}px)`;
  const rx = wx * sc + cx;
  const ry = wy * sc + cy;
  const deg = (v: number, n: number) => (locked ? v : v + (rnd(Math.floor(f / 2) + n) - 0.5) * 40).toFixed(1);
  return (
    <AbsoluteFill style={{ background: "#031014" }}>
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, #0a2a33 0%, #031014 75%)", clipPath: `inset(0 0 ${(1 - sv) * 100}% 0)` }}>
      <div style={{ position: "absolute", inset: 0, transformOrigin: "0 0", transform: dv > 0 ? camT : undefined }}>
      {/* feixe do radar */}
      <div style={{ position: "absolute", left: cx - 1700, top: cy - 1700, width: 3400, height: 3400, borderRadius: "50%", background: `conic-gradient(from ${swA - 50}deg, rgba(198,247,255,0) 0deg, rgba(198,247,255,0.13) 49deg, rgba(198,247,255,0.35) 50deg, rgba(198,247,255,0) 50.4deg)` }} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        {/* grade polar */}
        <g stroke={HUD} fill="none" opacity={0.18}>
          {[10, 25, 40, 55, 70].map((lat) => {
            const r = ((90 - lat) / 80) * R0 * sc;
            return <circle key={lat} cx={cx} cy={cy} r={r} />;
          })}
          {Array.from({ length: 12 }).map((_, k) => {
            const [x2, y2] = T(10, k * 30);
            return <line key={k} x1={cx} y1={cy} x2={x2} y2={y2} />;
          })}
        </g>
        {/* costas pontilhadas */}
        {coast.map((pts, k) => (
          <g key={k} fill={HUD}>
            {pts.map(([x, y], j) => {
              const g = glint(x, y);
              return <circle key={j} cx={x} cy={y} r={1.8 + 1.4 * g} opacity={0.45 + 0.55 * g} />;
            })}
          </g>
        ))}
        {/* super portal sobre City 17 + linha para o overworld */}
        {portalR > 0.01 ? (
          <g>
            <circle cx={px} cy={py} r={34 * portalR + 4 * Math.sin(f / 3)} fill="none" stroke="#8fe8ff" strokeWidth={3} opacity={0.9} />
            <circle cx={px} cy={py} r={18 * portalR} fill="#8fe8ff" opacity={0.35} />
          </g>
        ) : null}
        {f >= unitsAt - 10 ? (
          <g>
            <line x1={px} y1={py} x2={px + 260} y2={60} stroke={lost ? RED : "#8fe8ff"} strokeWidth={2.5} strokeDasharray={lost ? "6 14" : "10 6"} opacity={lost ? (Math.floor(f / 4) % 2 ? 0.2 : 0.7) * (1 - P(f, lostAt + 30, 20)) : 0.85} />
            <text x={px + 270} y={56} fill={lost ? RED : "#8fe8ff"} fontFamily={MONO} fontSize={20} letterSpacing={4} opacity={1 - P(f, lostAt + 30, 20)}>
              OVERWORLD
            </text>
          </g>
        ) : null}
        {/* unidades */}
        {f >= unitsAt
          ? units.map((u, i) => {
              const g2 = go(u);
              const [ux, uy] = T(u.lat + (90 - u.lat) * g2 * 0.97, u.lon);
              const jit = trap ? Math.sin(f * 0.8 + i) * 2 : 0;
              const a = flickIn(f, unitsAt + (i % 8) * 2);
              return (
                <g key={i} opacity={a}>
                  {u.kind === "ADV" ? <polygon points={`${ux + jit},${uy - 9} ${ux + 8 + jit},${uy + 6} ${ux - 8 + jit},${uy + 6}`} fill={RED} /> : u.kind === "SYN" ? <rect x={ux - 6 + jit} y={uy - 6} width={12} height={12} fill="none" stroke={RED} strokeWidth={2.5} /> : <circle cx={ux + jit} cy={uy} r={5} fill={RED} />}
                </g>
              );
            })
          : null}
        {/* White Forest */}
        <g opacity={P(f, wfAt, 10) * (1 - P(f, unitsAt, 14) * 0.5)}>
          <circle cx={rx} cy={ry} r={10} fill="none" stroke="#ffd04d" strokeWidth={3} />
          <circle cx={rx} cy={ry} r={22 + 6 * Math.sin(f / 6)} fill="none" stroke="#ffd04d" strokeWidth={1.5} opacity={0.6} />
          <text x={rx + 30} y={ry + 8} fill="#ffd04d" fontFamily={MONO} fontSize={24} letterSpacing={5}>
            WHITE FOREST
          </text>
          {zoomed ? (
            <g opacity={1 - zw}>
              {/* mira: quatro cantos fecham girando e travam */}
              <g transform={`translate(${rx} ${ry}) rotate(${locked ? 0 : 45 * (1 - (120 - rs) / 86)})`} stroke="#ffd04d" strokeWidth={3} fill="none" opacity={locked ? (f - lockAt < 6 ? [1, 0.3, 1, 0.3, 1, 1][f - lockAt] : 0.9) : 0.75}>
                {[[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy], k) => (
                  <path key={k} d={`M ${sx * rs} ${sy * (rs - 14)} L ${sx * rs} ${sy * rs} L ${sx * (rs - 14)} ${sy * rs}`} />
                ))}
              </g>
              <text x={rx + 30} y={ry + 40} fill="#ffd04d" fontFamily={MONO} fontSize={18} letterSpacing={4} opacity={0.8}>
                {deg(46.2, 1)}°N · {deg(118.4, 9)}°W {locked ? "· SINAL FIXO" : "· BUSCANDO"}
              </text>
            </g>
          ) : null}
        </g>
        <text x={px + 44} y={py + 8} fill={HUD} fontFamily={MONO} fontSize={18} letterSpacing={4} opacity={P(f, worldAt + 30, 10)}>
          CITY 17
        </text>
        {/* destino: Ártico */}
        {f >= arcticAt ? (
          <g>
            <circle cx={ax} cy={ay} r={40 + 10 * Math.sin(f / 5)} fill="none" stroke={RED} strokeWidth={3} opacity={0.9} />
            <circle cx={ax} cy={ay} r={70 + 14 * Math.sin(f / 7)} fill="none" stroke={RED} strokeWidth={1.5} opacity={0.5} />
          </g>
        ) : null}
        {f >= borealisAt ? (
          <g>
            <circle cx={ax} cy={ay} r={26} fill="none" stroke="#ffd04d" strokeWidth={3} />
            <text x={ax + 40} y={ay - 30} fill="#ffd04d" fontFamily={MONO} fontSize={24} letterSpacing={5} opacity={flickIn(f, borealisAt)}>
              BOREALIS · JANELA
            </text>
          </g>
        ) : null}
        {f >= combineAt
          ? Array.from({ length: 10 }).map((_, i) => {
              const a = (i / 10) * Math.PI * 2 + 0.3;
              const u = interpolate(f, [combineAt + i * 3, combineAt + i * 3 + 50], [0, 1], { ...C, easing: Easing.out(Easing.cubic) });
              const r = 520 - 440 * u;
              const x = ax + Math.cos(a) * r;
              const y = ay + Math.sin(a) * r * 0.9;
              return <path key={i} d={`M ${x} ${y} l ${-Math.cos(a) * 26} ${-Math.sin(a) * 26}`} stroke={RED} strokeWidth={5} strokeLinecap="round" opacity={0.9} />;
            })
          : null}
      </svg>
      </div>
      {/* painel */}
      <AbsoluteFill style={{ background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.25) 0 1px, rgba(0,0,0,0) 1px 3px)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", left: 90, top: 70, fontFamily: MONO, color: HUD, letterSpacing: 4, lineHeight: 1.5 }}>
        <div style={{ fontSize: 26 }}>OVERWATCH ◆ MAPA ESTRATÉGICO</div>
        <div style={{ fontSize: 18, opacity: 0.7 }}>HEMISFÉRIO NORTE · PROJEÇÃO POLAR</div>
      </div>
      <div style={{ position: "absolute", right: 90, top: 70, fontFamily: MONO, color: HUD, letterSpacing: 4, fontSize: 20, textAlign: "right", opacity: 0.8 }}>{tc}</div>
      <div style={{ position: "absolute", left: 90, bottom: 80, fontFamily: MONO, color: HUD, letterSpacing: 3, fontSize: 20, lineHeight: 1.7 }}>
        {f >= portalAt + 20 ? <div style={{ opacity: flickIn(f, portalAt + 20) }}>SUPER PORTAL · <span style={{ color: RED }}>FECHADO</span></div> : null}
        {f >= unitsAt ? (
          <div style={{ opacity: flickIn(f, unitsAt) }}>
            <span style={{ color: RED }}>●</span> TROPAS <span style={{ color: RED, marginLeft: 18 }}>□</span> SYNTHS <span style={{ color: RED, marginLeft: 18 }}>▲</span> ADVISORS
          </div>
        ) : null}
        {f >= lostAt ? <div style={{ opacity: flickIn(f, lostAt), color: RED }}>CONTATO COM O OVERWORLD · PERDIDO · SEM REFORÇOS</div> : null}
      </div>
      {trap ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 160, textAlign: "center", fontFamily: MONO, fontSize: 40, letterSpacing: 16, color: RED, opacity: Math.floor(f / 8) % 2 ? 0.55 : 1 }}>ENCURRALADOS</div>
      ) : null}
      {f >= arcticAt ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: ay + 100, textAlign: "center", fontFamily: MONO, fontSize: 34, letterSpacing: 14, color: RED, opacity: flickIn(f, arcticAt + 30) * (1 - dv) }}>DESTINO · ÁRTICO</div>
      ) : null}
      {f >= combineAt ? (
        <div style={{ position: "absolute", right: 90, bottom: 80, fontFamily: MONO, fontSize: 24, letterSpacing: 6, color: RED, textAlign: "right", opacity: flickIn(f, combineAt + 20) }}>OVERWATCH · MESMO ALVO · MESMA JANELA</div>
      ) : null}
    </AbsoluteFill>
      {/* linha da varredura de entrada */}
      {sv < 1 ? <div style={{ position: "absolute", left: 0, right: 0, top: sv * 1080 - 2, height: 4, background: HUD, boxShadow: `0 0 24px 6px rgba(198,247,255,0.6)`, opacity: 0.9 }} /> : null}
      {/* estouro gelado no fim do mergulho */}
      {dv > 0 ? <AbsoluteFill style={{ background: "#dfe9ee", opacity: interpolate(dv, [0.55, 1], [0, 1], C) }} /> : null}
    </AbsoluteFill>
  );
};

// =============================================================================================== terminal do Kleiner
// monitor CRT bege do laboratório, fósforo verde. A tela troca de "modo" nos `beats` (com a varredura de CRT):
// packet · moss · layers · clear · map · signal · wrong · pattern · cycle · predict · window
// d: quadros até o ruído sumir (signal/cycle); calc: lockAt/wfAt/riskAt em quadros da cena
type Beat = { at: number; mode: string; d?: number; lockAt?: number; wfAt?: number; riskAt?: number };
const GREEN = "#8dffa8";
const DIM = "rgba(141,255,168,0.35)";
const PINS: [number, number][] = [
  [-210, -120],
  [120, -170],
  [250, 40],
  [-60, 140],
  [-260, 60],
  [60, -10],
];
const ShipMark: React.FC<{ x: number; y: number; s?: number; o?: number }> = ({ x, y, s = 1, o = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>
    <path d="M -34 6 L 30 6 L 40 -4 L 22 -4 L 18 -14 L -6 -14 L -10 -22 L -16 -22 L -18 -4 L -34 -4 Z" fill="none" stroke={GREEN} strokeWidth={2.4} />
  </g>
);
const Screen: React.FC<{ mode: string; t: number; f: number; d?: number; b?: Beat }> = ({ mode, t, f, d = 12, b }) => {
  const W2 = 1240;
  const H2 = 700;
  const head = (txt: string) => (
    <text x={40} y={60} fill={GREEN} fontFamily={MONO} fontSize={30} letterSpacing={6}>
      {txt}
    </text>
  );
  const wave = (y0: number, amp: number, noise: number, seed: number, w = W2 - 120) => {
    const pts: string[] = [];
    for (let i = 0; i <= 240; i++) {
      const x = 60 + (w * i) / 240;
      const u = i / 240;
      const clean = Math.sin(u * 30 + f * 0.15 + seed) * 0.6 + Math.sin(u * 7 + seed) * 0.4;
      const n = (rnd(i * 13 + Math.floor(f / 2) * 7 + seed) - 0.5) * 2;
      pts.push(`${i ? "L" : "M"} ${x.toFixed(1)} ${(y0 + (clean * (1 - noise) + n * noise) * amp).toFixed(1)}`);
    }
    return <path d={pts.join(" ")} fill="none" stroke={GREEN} strokeWidth={2.4} />;
  };
  const arcticMap = (children?: React.ReactNode) => (
    <g transform={`translate(${W2 / 2} ${H2 / 2 + 30})`}>
      {[80, 160, 240].map((r) => (
        <circle key={r} r={r} fill="none" stroke={DIM} strokeWidth={1.4} />
      ))}
      {Array.from({ length: 8 }).map((_, k) => (
        <line key={k} x1={0} y1={0} x2={Math.cos((k / 8) * Math.PI * 2) * 300} y2={Math.sin((k / 8) * Math.PI * 2) * 300} stroke={DIM} strokeWidth={1} />
      ))}
      <path d="M -300 -40 Q -240 -90 -170 -70 T -40 -110 T 90 -90 T 220 -130 T 310 -60" fill="none" stroke={GREEN} strokeWidth={1.6} strokeDasharray="3 6" opacity={0.6} />
      <path d="M -310 120 Q -200 90 -120 150 T 60 170 T 210 120 T 320 160" fill="none" stroke={GREEN} strokeWidth={1.6} strokeDasharray="3 6" opacity={0.6} />
      {children}
    </g>
  );
  if (mode === "packet") {
    const lines = Array.from({ length: 13 }).map((_, i) => {
      const row = Math.floor(t / 2) + i;
      return Array.from({ length: 12 }).map((__, j) => Math.floor(rnd(row * 31 + j) * 255).toString(16).toUpperCase().padStart(2, "0")).join(" ");
    });
    const prog = Math.min(1, t / 90);
    return (
      <svg width={W2} height={H2}>
        {head("PACOTE DE DADOS · CIDADELA")}
        {lines.map((l, i) => (
          <text key={i} x={40} y={120 + i * 38} fill={i === 12 ? GREEN : DIM} fontFamily={MONO} fontSize={24} letterSpacing={3}>
            {`${(0x4a00 + (Math.floor(t / 2) + i) * 16).toString(16).toUpperCase()}  ${l}`}
          </text>
        ))}
        <rect x={40} y={H2 - 60} width={W2 - 80} height={14} fill="none" stroke={GREEN} />
        <rect x={40} y={H2 - 60} width={(W2 - 80) * prog} height={14} fill={GREEN} />
        <text x={W2 - 40} y={H2 - 74} textAnchor="end" fill={GREEN} fontFamily={MONO} fontSize={22} letterSpacing={4}>
          DECODIFICANDO {Math.round(prog * 100)}%
        </text>
      </svg>
    );
  }
  if (mode === "moss" || mode === "layers" || mode === "clear") {
    const split = mode === "moss" ? 0 : mode === "clear" ? 1 : interpolate(t, [0, 24], [0, 1], { ...C, easing: Easing.inOut(Easing.cubic) });
    const clr = mode === "clear" ? interpolate(t, [10, 70], [0, 1], C) : 0;
    const names = ["COORDENADAS", "IMAGENS", "DADOS DO NAVIO"];
    return (
      <svg width={W2} height={H2}>
        {head(mode === "clear" ? "SUPER PORTAL · OFFLINE · INTERFERÊNCIA ↓" : "TRANSMISSÃO · J. MOSSMAN")}
        {mode === "moss" || split < 1 ? wave(360, 120, 0.55, 1) : null}
        {mode === "moss" ? (
          <text x={W2 / 2} y={600} textAnchor="middle" fill={GREEN} fontFamily={MONO} fontSize={44} letterSpacing={18} opacity={P(t, 20, 12)}>
            BOREALIS
          </text>
        ) : null}
        {split > 0
          ? names.map((n, k) => {
              const y = 360 + (k - 1) * 170 * split;
              return (
                <g key={n} opacity={split}>
                  {wave(y, 34, 0.7 - 0.6 * clr, 3 + k * 2)}
                  <text x={60} y={y - 48} fill={GREEN} fontFamily={MONO} fontSize={22} letterSpacing={5}>
                    {n}
                  </text>
                  {k === 0 ? (
                    <text x={W2 - 60} y={y - 48} textAnchor="end" fill={GREEN} fontFamily={MONO} fontSize={20} letterSpacing={3}>
                      {`${(78 + rnd(Math.floor(t / 4)) * 9).toFixed(2)}°N  ${(rnd(Math.floor(t / 4) + 9) * 40).toFixed(2)}°W`}
                    </text>
                  ) : k === 1 ? (
                    <ShipMark x={W2 - 160} y={y - 54} s={0.9} o={0.6 + 0.4 * clr} />
                  ) : (
                    <text x={W2 - 60} y={y - 48} textAnchor="end" fill={GREEN} fontFamily={MONO} fontSize={20} letterSpacing={3}>
                      {`REG ${String(100 + Math.floor(t / 3) % 900)} · CASCO · CARGA`}
                    </text>
                  )}
                </g>
              );
            })
          : null}
        {mode === "clear" ? (
          <g opacity={clr}>
            {Array.from({ length: 9 }).map((_, k) => (
              <circle key={k} cx={180 + k * 110} cy={640} r={6 + (k % 3 === 0 ? 4 : 0)} fill={GREEN} opacity={0.4 + 0.6 * Math.max(0, Math.sin(f * 0.2 - k))} />
            ))}
            <text x={W2 / 2} y={690} textAnchor="middle" fill={GREEN} fontFamily={MONO} fontSize={22} letterSpacing={8}>
              PADRÃO NÃO IDENTIFICADO
            </text>
          </g>
        ) : null}
      </svg>
    );
  }
  if (mode === "map" || mode === "wrong" || mode === "pattern" || mode === "predict") {
    const strike = mode === "wrong" ? P(t, 8, 10) : mode === "pattern" || mode === "predict" ? 1 : 0;
    const re = mode === "wrong" ? P(t, 22, 10) : mode === "pattern" || mode === "predict" ? 1 : 0;
    const days = ["+3 D", "+11 D", "+19 D", "+26 D", "+34 D", "+41 D"];
    return (
      <svg width={W2} height={H2}>
        <text x={40} y={60} fill={GREEN} fontFamily={MONO} fontSize={30} letterSpacing={6}>
          ÁRTICO ·
        </text>
        <text x={210} y={60} fill={GREEN} fontFamily={MONO} fontSize={30} letterSpacing={6} opacity={1 - re * 0.6}>
          ONDE ESTÁ
        </text>
        <line x1={205} y1={50} x2={205 + 230 * strike} y2={50} stroke="#ff6b6b" strokeWidth={4} />
        <text x={470} y={60} fill={GREEN} fontFamily={MONO} fontSize={30} letterSpacing={6} opacity={re}>
          ONDE VAI APARECER
        </text>
        {arcticMap(
          <>
            {PINS.map(([x, y], k) => {
              const onShip = mode === "map" ? Math.floor((t + k * 17) / 20) % 3 === 0 : mode === "pattern" ? Math.floor(t / 14) % PINS.length === k : false;
              return (
                <g key={k} opacity={P(t, k * 4, 8)}>
                  <circle cx={x} cy={y} r={7} fill={GREEN} />
                  <circle cx={x} cy={y} r={16} fill="none" stroke={GREEN} strokeWidth={1.4} opacity={0.5} />
                  {onShip ? <ShipMark x={x} y={y - 30} s={0.8} o={0.85} /> : null}
                  {re > 0 ? (
                    <text x={x + 22} y={y + 6} fill={GREEN} fontFamily={MONO} fontSize={18} letterSpacing={2} opacity={re}>
                      {days[k]}
                    </text>
                  ) : null}
                  {mode === "pattern" ? <rect x={x - 20} y={y + 20} width={10 + ((k * 13) % 30)} height={5} fill={GREEN} opacity={0.7} /> : null}
                </g>
              );
            })}
            {mode === "pattern" || mode === "predict" ? (
              <path d={`M ${PINS.map(([x, y]) => `${x} ${y}`).join(" L ")}`} fill="none" stroke={GREEN} strokeWidth={1.8} strokeDasharray="8 8" pathLength={1} style={{ strokeDasharray: "0.02 0.015" }} opacity={mode === "pattern" ? P(t, 10, 40) : 1} />
            ) : null}
            {mode === "predict" ? (
              <g>
                <circle cx={150} cy={210} r={10 + 3 * Math.sin(f / 4)} fill="#ffd04d" />
                <circle cx={150} cy={210} r={30 + 10 * Math.sin(f / 5)} fill="none" stroke="#ffd04d" strokeWidth={2} />
                <text x={120} y={258} textAnchor="end" fill="#ffd04d" fontFamily={MONO} fontSize={22} letterSpacing={3} opacity={P(t, 10, 10)}>
                  PRÓXIMA · 81°12'N · EM 6 DIAS
                </text>
              </g>
            ) : null}
          </>,
        )}
        {mode === "map" ? (
          <text x={W2 / 2} y={H2 - 30} textAnchor="middle" fill={GREEN} fontFamily={MONO} fontSize={22} letterSpacing={6} opacity={P(t, 30, 10)}>
            NAVIO · NÃO ESTÁ PARADO
          </text>
        ) : null}
      </svg>
    );
  }
  if (mode === "signal" || mode === "cycle") {
    const clean = interpolate(t, [d, d + 48], [0, 1], { ...C, easing: Easing.inOut(Easing.cubic) });
    return (
      <svg width={W2} height={H2}>
        {head(mode === "signal" ? "NOVOS SINAIS · BOREALIS" : "CICLO · APARECE / SOME")}
        {mode === "signal" ? (
          <>
            {Array.from({ length: 64 }).map((_, k) => {
              const peak = Math.exp(-((k - 22) ** 2) / 8) + 0.7 * Math.exp(-((k - 41) ** 2) / 10);
              const nz = rnd(k * 7 + Math.floor(f / 2)) * (1 - clean) * 0.9;
              const h = (peak * 0.9 + nz + 0.05) * 420;
              return <rect key={k} x={60 + k * 17.5} y={600 - h} width={11} height={h} fill={GREEN} opacity={0.85} />;
            })}
            <text x={W2 - 40} y={110} textAnchor="end" fill={GREEN} fontFamily={MONO} fontSize={22} letterSpacing={4}>
              INTERFERÊNCIA COMBINE {Math.round((1 - clean) * 92 + 4)}%
            </text>
          </>
        ) : (
          <>
            {(() => {
              const pts: string[] = [];
              for (let i = 0; i <= 300; i++) {
                const x = 60 + ((W2 - 120) * i) / 300;
                const ph = ((i / 300) * 5 + f * 0.01) % 1;
                const pulse = ph < 0.22 ? 1 : 0;
                const n = (rnd(i * 17 + Math.floor(f / 2)) - 0.5) * 2 * (1 - clean);
                pts.push(`${i ? "L" : "M"} ${x.toFixed(1)} ${(420 - pulse * 160 * (0.3 + 0.7 * clean) + n * 150).toFixed(1)}`);
              }
              return <path d={pts.join(" ")} fill="none" stroke={GREEN} strokeWidth={2.6} />;
            })()}
            <text x={W2 / 2} y={640} textAnchor="middle" fill={GREEN} fontFamily={MONO} fontSize={24} letterSpacing={6} opacity={1 - clean}>
              RUÍDO · SUPER PORTAL
            </text>
            <text x={W2 / 2} y={640} textAnchor="middle" fill={GREEN} fontFamily={MONO} fontSize={24} letterSpacing={6} opacity={clean}>
              O CICLO ESTAVA LÁ
            </text>
          </>
        )}
      </svg>
    );
  }
  if (mode === "theft") {
    // 3C: o Kleiner confere os arquivos depois da emboscada. A verificação passa bloco a bloco; a partir de `d` quadros
    // os blocos roubados falham (somem em ruído) e o rodapé fecha em CÁLCULOS INCOMPLETOS.
    const names = ["CÁLCULO 01 · CICLO", "CÁLCULO 02 · COORDENADAS", "CÁLCULO 03 · JANELA", "CÁLCULO 04 · DURAÇÃO", "CÁLCULO 05 · PREVISÃO", "CÁLCULO 06 · ROTA", "CÁLCULO 07 · CASCO", "CÁLCULO 08 · NÚCLEO"];
    const gone = [2, 4, 5];
    const chk = Math.min(names.length, Math.floor(t / 5));
    const fail = t >= d;
    return (
      <svg width={W2} height={H2}>
        {head("ARQUIVOS · BOREALIS · VERIFICANDO")}
        {names.map((n, k) => {
          const y = 120 + k * 62;
          const lost = gone.includes(k) && fail && t >= d + gone.indexOf(k) * 7;
          const lt = lost ? t - d - gone.indexOf(k) * 7 : 0;
          const ok = k < chk && !lost;
          const jit = lost && lt < 10 ? (rnd(f * 7 + k) - 0.5) * 8 : 0;
          return (
            <g key={k} opacity={k < chk || lost ? 1 : 0.25} transform={`translate(${jit} 0)`}>
              <text x={60} y={y} fill={lost ? "#ff6b6b" : GREEN} fontFamily={MONO} fontSize={24} letterSpacing={3} opacity={lost ? (lt < 10 ? (Math.floor(lt / 2) % 2 ? 0.2 : 1) : 0.85) : 1}>
                {n}
              </text>
              <rect x={660} y={y - 20} width={360} height={18} fill="none" stroke={lost ? "#ff6b6b" : DIM} strokeWidth={1.5} />
              <rect x={660} y={y - 20} width={lost ? 360 * Math.max(0, 1 - lt / 8) : ok ? 360 : 0} height={18} fill={lost ? "#ff6b6b" : GREEN} opacity={0.8} />
              <text x={1050} y={y} fill={lost ? "#ff6b6b" : GREEN} fontFamily={MONO} fontSize={20} letterSpacing={3}>
                {lost ? "AUSENTE" : ok ? "OK" : ""}
              </text>
            </g>
          );
        })}
        <text x={W2 / 2} y={H2 - 34} textAnchor="middle" fill={fail ? "#ff6b6b" : GREEN} fontFamily={MONO} fontSize={26} letterSpacing={8} opacity={fail ? (t >= d + 24 ? 1 : 0) : 0.7}>
          {fail ? "CÁLCULOS INCOMPLETOS · 3 DE 8 ROUBADOS" : ""}
        </text>
      </svg>
    );
  }
  if (mode === "calc") {
    // 3C (pedido do Paulo: no lugar do contador genérico): o Kleiner CALCULA a próxima manifestação. As entradas
    // (ciclo, coordenadas da Mossman, interferência removida) entram digitadas; o resíduo do cálculo cai até
    // convergir; os dígitos param no resultado em `lockAt` e seguem contando; WHITE FOREST: PERMANECER → RISCO.
    const lock = (b?.lockAt ?? 1e9) - (b?.at ?? 0);
    const wf = (b?.wfAt ?? 1e9) - (b?.at ?? 0);
    const risk = (b?.riskAt ?? 1e9) - (b?.at ?? 0);
    const locked = t >= lock;
    const inputs = [
      ["CICLO OBSERVADO", "7 REGISTROS"],
      ["COORDENADAS · MOSSMAN", "6 PONTOS"],
      ["INTERFERÊNCIA DO PORTAL", "REMOVIDA"],
    ];
    // resultado: 06d 04:12:34 e conta para baixo depois de fechar
    const left = 6 * 86400 + 4 * 3600 + 12 * 60 + 34 - (locked ? Math.floor((t - lock) / 30) : 0);
    const dd = Math.floor(left / 86400);
    const hh = Math.floor((left % 86400) / 3600);
    const mm = Math.floor((left % 3600) / 60);
    const ss = left % 60;
    const final = [dd, hh, mm, ss].map((v) => String(v).padStart(2, "0"));
    const digits = final.map((v, k) => (locked ? v : String(Math.floor(rnd(Math.floor(f / 2) * 13 + k * 7) * 60)).padStart(2, "0")));
    // resíduo: oscila e encolhe até zero no lockAt
    const pts: string[] = [];
    const T = Math.max(1, Math.min(t, lock));
    for (let i = 0; i <= 120; i++) {
      const u = (i / 120) * T;
      const amp = Math.max(0, 1 - u / Math.max(1, lock)) ** 1.4;
      const y = 515 + Math.sin(u * 0.55) * 46 * amp + (rnd(i * 3 + 1) - 0.5) * 10 * amp;
      pts.push(`${i ? "L" : "M"} ${(680 + (i / 120) * 480 * (T / Math.max(1, lock))).toFixed(1)} ${y.toFixed(1)}`);
    }
    const rk = P(t, risk, 10);
    return (
      <svg width={W2} height={H2}>
        {head(locked ? "BOREALIS · PRÓXIMA MANIFESTAÇÃO · CALCULADA" : "BOREALIS · PRÓXIMA MANIFESTAÇÃO · CALCULANDO")}
        {inputs.map(([k, v], i) => {
          const at = 6 + i * 9;
          const n = Math.floor(interpolate(t, [at, at + 10], [0, k.length], C));
          return t >= at ? (
            <g key={i}>
              <text x={60} y={140 + i * 46} fill={GREEN} fontFamily={MONO} fontSize={22} letterSpacing={3}>
                {k.slice(0, n)}
              </text>
              <text x={820} y={140 + i * 46} textAnchor="end" fill={GREEN} fontFamily={MONO} fontSize={22} letterSpacing={3} opacity={t >= at + 12 ? 1 : 0}>
                {v} ✓
              </text>
            </g>
          ) : null;
        })}
        {/* o número */}
        <text x={W2 / 2} y={360} textAnchor="middle" fill={locked ? "#eaffef" : GREEN} fontFamily={MONO} fontSize={96} letterSpacing={6} opacity={locked ? 1 : 0.75} style={{ filter: locked ? "drop-shadow(0 0 10px rgba(141,255,168,0.8))" : undefined }}>
          {`${digits[0]}d ${digits[1]}:${digits[2]}:${digits[3]}`}
        </text>
        {locked ? <rect x={W2 / 2 - 400} y={268} width={800} height={118} fill="none" stroke={GREEN} strokeWidth={2.5} opacity={flickIn(f - (b?.at ?? 0), lock)} /> : null}
        <text x={W2 / 2} y={420} textAnchor="middle" fill={GREEN} fontFamily={MONO} fontSize={20} letterSpacing={6} opacity={0.75}>
          {locked ? "CONVERGÊNCIA 99,7% · ATÉ A PRÓXIMA MANIFESTAÇÃO" : `ITERAÇÃO ${String(Math.min(9999, 40 + t * 37)).padStart(4, "0")} · RESÍDUO ${(Math.max(0, 1 - t / Math.max(1, lock)) * 0.9).toFixed(3)}`}
        </text>
        {/* o resíduo caindo (gráfico) */}
        <text x={60} y={500} fill={DIM} fontFamily={MONO} fontSize={18} letterSpacing={4}>
          RESÍDUO DO CÁLCULO
        </text>
        <line x1={680} y1={515} x2={1160} y2={515} stroke={DIM} strokeWidth={1} />
        <path d={pts.join(" ")} fill="none" stroke={GREEN} strokeWidth={2} />
        {/* a decisão */}
        {t >= wf ? (
          <g opacity={flickIn(f - (b?.at ?? 0), wf)}>
            <rect x={60} y={588} width={W2 - 120} height={64} rx={6} fill={rk > 0 ? "rgba(255,107,107,0.10)" : "rgba(141,255,168,0.06)"} stroke={rk > 0 ? "#ff6b6b" : DIM} strokeWidth={1.5} />
            <text x={90} y={630} fill={GREEN} fontFamily={MONO} fontSize={26} letterSpacing={5}>
              WHITE FOREST
            </text>
            <text x={W2 - 330} y={630} textAnchor="end" fill={GREEN} fontFamily={MONO} fontSize={26} letterSpacing={5} opacity={1 - rk * 0.5}>
              PERMANECER
            </text>
            {rk > 0 ? <line x1={W2 - 560} y1={622} x2={W2 - 560 + 236 * rk} y2={622} stroke="#ff6b6b" strokeWidth={4} /> : null}
            {rk > 0 ? (
              <text x={W2 - 90} y={630} textAnchor="end" fill="#ff6b6b" fontFamily={MONO} fontSize={30} letterSpacing={8} opacity={t >= risk + 8 ? (Math.floor(t / 8) % 2 ? 0.55 : 1) : 0}>
                RISCO
              </text>
            ) : null}
          </g>
        ) : null}
      </svg>
    );
  }
  if (mode === "window") {
    const show = P(t, 0, 30);
    const big = P(t, 30, 16);
    return (
      <svg width={W2} height={H2}>
        {head("MANIFESTAÇÕES · DURAÇÃO")}
        <line x1={60} y1={420} x2={W2 - 60} y2={420} stroke={DIM} strokeWidth={2} />
        {[90, 230, 330, 470, 560, 690].map((x, k) => (
          <rect key={k} x={x} y={380} width={14 + (k % 2) * 8} height={40} fill={GREEN} opacity={show} />
        ))}
        <rect x={830} y={300 + (1 - big) * 80} width={300 * big} height={120 - (1 - big) * 80} fill="rgba(255,208,77,0.85)" />
        <text x={980} y={280} textAnchor="middle" fill="#ffd04d" fontFamily={MONO} fontSize={32} letterSpacing={12} opacity={big}>
          JANELA
        </text>
        <text x={W2 - 70} y={500} textAnchor="end" fill="#ffd04d" fontFamily={MONO} fontSize={22} letterSpacing={4} opacity={P(t, 46, 10)}>
          EM POUCOS DIAS · TEMPO PARA ENTRAR
        </text>
      </svg>
    );
  }
  return null;
};
// powerOn/powerOff = false quando dois terminais vêm colados (vira só troca de tela, sem desligar e religar)
export const HLTerminal: React.FC<{ life: number; beats?: Beat[]; tag?: string; powerOn?: boolean; powerOff?: boolean }> = ({ life, beats = [], tag = "KLEINER · WHITE FOREST", powerOn = true, powerOff = true }) => {
  const f = useCurrentFrame();
  // sem fade (o fundo roxo vazava): o tubo LIGA (linha que abre, clarão) e no fim DESLIGA (fecha em linha → ponto)
  const on = powerOn ? interpolate(f, [0, 8], [0, 1], { ...C, easing: Easing.out(Easing.cubic) }) : 1;
  const offY = powerOff ? interpolate(f, [life - 9, life - 4], [1, 0.012], { ...C, easing: Easing.in(Easing.cubic) }) : 1;
  const offX = powerOff ? interpolate(f, [life - 4, life - 1], [1, 0.012], { ...C, easing: Easing.in(Easing.cubic) }) : 1;
  const sy = Math.min(0.012 + 0.988 * on, offY);
  const flash = Math.max(1 - on, 1 - offY) * (f < life - 1 ? 1 : 0);
  const cur = beats.reduce<Beat | null>((acc, b) => (f >= b.at ? b : acc), null);
  const t = cur ? f - cur.at : 0;
  const wipe = cur && t < 7 ? 1 - t / 7 : 0; // varredura do CRT na troca de tela
  const push = 1 + interpolate(f, [0, life], [0, 0.05], C);
  const flick = 0.94 + 0.06 * Math.sin(f * 1.7) * Math.sin(f * 0.37);
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 40%, #2a2620 0%, #0c0b09 80%)" }}>
      <div style={{ position: "absolute", left: 960 - 760, top: 540 - 470, width: 1520, height: 940, transform: `scale(${push})`, transformOrigin: "50% 50%" }}>
        {/* gabinete bege */}
        <div style={{ position: "absolute", inset: 0, borderRadius: 48, background: "linear-gradient(160deg, #cfc6ae, #a79d84 60%, #8c836c)", boxShadow: "0 60px 140px rgba(0,0,0,0.75), inset 0 4px 0 rgba(255,255,255,0.25)" }} />
        <div style={{ position: "absolute", left: 80, top: 70, width: 1360, height: 780, borderRadius: 60, background: "#1b1a16", boxShadow: "inset 0 0 40px rgba(0,0,0,0.9)" }} />
        {/* tela */}
        <div style={{ position: "absolute", left: 140, top: 110, width: 1240, height: 700, borderRadius: 40, overflow: "hidden", background: "radial-gradient(ellipse at 50% 50%, #0c2414 0%, #031008 85%)", opacity: flick, filter: "drop-shadow(0 0 6px rgba(141,255,168,0.35))", transform: `scale(${offX}, ${sy})` }}>
          {cur ? <Screen mode={cur.mode} t={t} f={f} d={cur.d} b={cur} /> : null}
          <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.32) 0 2px, rgba(0,0,0,0) 2px 4px)" }} />
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.6) 100%)" }} />
          <div style={{ position: "absolute", left: 0, right: 0, top: ((f * 9) % 900) - 100, height: 90, background: "linear-gradient(180deg, rgba(141,255,168,0), rgba(141,255,168,0.06), rgba(141,255,168,0))" }} />
          {wipe > 0 ? <div style={{ position: "absolute", left: 0, right: 0, top: 350 - 350 * wipe, height: 700 * wipe, background: "#031008", borderTop: "2px solid rgba(141,255,168,0.8)", borderBottom: "2px solid rgba(141,255,168,0.8)" }} /> : null}
          <div style={{ position: "absolute", left: -200, top: -300, width: 900, height: 600, borderRadius: "50%", background: "radial-gradient(closest-side, rgba(255,255,255,0.07), rgba(255,255,255,0))" }} />
          {flash > 0.01 ? <div style={{ position: "absolute", inset: 0, background: "#e6ffef", opacity: flash * 0.9 }} /> : null}
        </div>
        <div style={{ position: "absolute", left: 140, bottom: 34, fontFamily: MONO, fontSize: 18, letterSpacing: 6, color: "#4b4536" }}>{tag}</div>
        <div style={{ position: "absolute", right: 150, bottom: 38, width: 14, height: 14, borderRadius: 7, background: "#7dff9a", boxShadow: "0 0 12px #7dff9a" }} />
      </div>
    </AbsoluteFill>
  );
};

// =============================================================================================== cartão da regra
// o caderno dos 23 fundamentos: o cartão "01" entra VIRADO em `inAt`; em `revealAt` vira e mostra "Regra 01 · O relógio
// do Borealis" com um relógio desenhado à mão cujo ponteiro é o próprio navio (some e aparece no giro).
export const HLRuleCard: React.FC<{ life: number; inAt?: number; revealAt?: number; num?: string; title?: string; art?: "clock" | "sectors" | "arrow" | "infinity" | "worlds" | "parallel" | "leak" | "catalyst" | "anchor" | "agent" | "break" | "mask" | "align" | "pieces" | "noentry"; lines?: string[] }> = ({ life, inAt = 0, revealAt = 1e9, num = "01", title = "O relógio do Borealis", art = "clock", lines = ["aparece", "some", "segue um ciclo"] }) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [life - 12, life], [1, 0], C);
  const enter = interpolate(f, [inAt, inAt + 22], [0, 1], { ...C, easing: Easing.out(Easing.back(1.2)) });
  const flip = interpolate(f, [revealAt, revealAt + 18], [0, 1], { ...C, easing: Easing.inOut(Easing.cubic) });
  const back = flip < 0.5;
  const draw = interpolate(f, [revealAt + 16, revealAt + 60], [0, 1], { ...C, easing: Easing.out(Easing.cubic) });
  const ang = revealAt + 41 < life ? interpolate(f, [revealAt + 40, life], [-90, 270], C) : -90; // cartão que não vira: ponteiro parado
  const shipVis = Math.floor((ang + 90) / 45) % 2 === 0 ? 1 : 0.15;
  const paper = "linear-gradient(170deg, #eee6d2, #ddd2b6)";
  // 09/10 (pedido dele: "não tem um efeito de escrita das regras"): da regra 02 em diante o título e as linhas são
  // ESCRITOS à mão — a ponta da caneta corre pelo texto revelando a tinta, no ritmo que cabe no tempo do cartão.
  // A regra 01 (relógio, no trecho aprovado) fica como está.
  const hand = art !== "clock";
  const tStart = revealAt + 14;
  const lineChars = lines.map((l) => l.length);
  const needT = title.length * 1.3;
  const needL = lineChars.reduce((a, b) => a + b * 0.9 + 6, 0);
  const avail = Math.max(20, life - 16 - tStart - 8);
  const kSp = Math.min(1, avail / (needT + 8 + needL));
  const tDur = needT * kSp;
  const lStarts = lines.map((_, k) => tStart + tDur + 8 * kSp + lineChars.slice(0, k).reduce((a, b) => a + b * 0.9 * kSp + 6 * kSp, 0));
  const lDur = lineChars.map((c) => c * 0.9 * kSp);
  const prog = (t0: number, d: number) => Math.max(0, Math.min(1, (f - t0) / Math.max(1, d)));
  const Written: React.FC<{ id: string; text: string; x: number; y: number; fs: number; col: string; t0: number; d: number }> = ({ id, text, x, y, fs, col, t0, d }) => {
    const pr = prog(t0, d);
    if (pr <= 0) return null;
    const w = text.length * fs * 0.47;
    const nx = x + w * pr;
    const ny = y - fs * 0.28 + Math.sin(f * 1.7) * fs * 0.12;
    return (
      <g>
        <defs>
          <clipPath id={`wr${id}`}>
            <rect x={x - 10} y={y - fs * 1.1} width={w * pr + 10} height={fs * 1.5} />
          </clipPath>
        </defs>
        <text x={x} y={y} fontFamily={HAND} fontSize={fs} fill={col} clipPath={`url(#wr${id})`}>
          {text}
        </text>
        {pr < 1 ? (
          <g>
            <line x1={nx} y1={ny} x2={nx + fs * 0.9} y2={ny - fs * 1.4} stroke="#2a2a30" strokeWidth={Math.max(4, fs * 0.12)} strokeLinecap="round" opacity={0.85} />
            <circle cx={nx} cy={ny} r={Math.max(2.5, fs * 0.05)} fill={col} />
          </g>
        ) : null}
      </g>
    );
  };
  return (
    <AbsoluteFill style={{ opacity: o, perspective: 1600 }}>
      <div style={{ position: "absolute", left: 960 - 420, top: 540 - 300, width: 840, height: 600, transform: `translateY(${(1 - enter) * 700}px) rotateZ(${(1 - enter) * -8 - 2}deg) rotateY(${flip * 180}deg)`, transformStyle: "preserve-3d" }}>
        {/* verso: só o número */}
        <div style={{ position: "absolute", inset: 0, borderRadius: 22, background: paper, boxShadow: "0 50px 130px rgba(0,0,0,0.65)", backfaceVisibility: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: HAND, fontSize: 260, color: "#b3121b", opacity: back ? 1 : 0 }}>{num}</div>
        {/* frente: a regra + relógio */}
        <div style={{ position: "absolute", inset: 0, borderRadius: 22, background: paper, boxShadow: "0 50px 130px rgba(0,0,0,0.65)", backfaceVisibility: "hidden", transform: "rotateY(180deg)", opacity: back ? 0 : 1 }}>
          <div style={{ position: "absolute", left: 50, top: 34, fontFamily: HAND, fontSize: 58, color: "#b3121b" }}>regra {num}</div>
          {hand ? null : <div style={{ position: "absolute", left: 50, top: 100, fontFamily: HAND, fontSize: 70, color: "#1c2a6e" }}>{title.slice(0, Math.max(0, Math.floor((f - revealAt - 14) / 1.2)))}</div>}
          <svg width={840} height={600} style={{ position: "absolute", inset: 0 }}>
            {art === "clock" ? (
              <g transform="translate(600 380)">
                <circle r={150} fill="none" stroke="#1c2a6e" strokeWidth={6} pathLength={1} strokeDasharray="1" strokeDashoffset={1 - draw} strokeLinecap="round" />
                {Array.from({ length: 12 }).map((_, k) => {
                  const a = (k / 12) * Math.PI * 2;
                  return <line key={k} x1={Math.cos(a) * 128} y1={Math.sin(a) * 128} x2={Math.cos(a) * 146} y2={Math.sin(a) * 146} stroke="#1c2a6e" strokeWidth={k % 3 === 0 ? 6 : 3} opacity={P(f, revealAt + 30 + k, 6)} strokeLinecap="round" />;
                })}
                <g transform={`rotate(${ang})`} opacity={P(f, revealAt + 44, 8)}>
                  <line x1={0} y1={0} x2={104} y2={0} stroke="#b3121b" strokeWidth={5} strokeLinecap="round" />
                  <g transform="translate(110 0) rotate(90) scale(1.3)" opacity={shipVis}>
                    <path d="M -26 5 L 22 5 L 30 -3 L 16 -3 L 13 -11 L -5 -11 L -8 -17 L -12 -17 L -14 -3 L -26 -3 Z" fill="#b3121b" />
                  </g>
                </g>
                <circle r={9} fill="#b3121b" opacity={P(f, revealAt + 44, 8)} />
              </g>
            ) : art === "arrow" ? (
              // a linha do tempo e uma seta que leva uma caixinha de um ponto para outro (para trás)
              <g transform="translate(440 330)">
                <line x1={0} x2={360} y1={60} y2={60} stroke="#1c2a6e" strokeWidth={5} strokeLinecap="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - draw} />
                <circle cx={40} cy={60} r={9} fill="#1c2a6e" opacity={P(f, revealAt + 40, 6)} />
                <circle cx={320} cy={60} r={9} fill="#b3121b" opacity={P(f, revealAt + 44, 6)} />
                <path d="M 320 46 C 260 -40 100 -40 50 40" fill="none" stroke="#b3121b" strokeWidth={4} strokeLinecap="round" opacity={P(f, revealAt + 50, 10)} />
                <path d="M 50 40 l -4 -18 m 4 18 l 16 -8" stroke="#b3121b" strokeWidth={4} strokeLinecap="round" opacity={P(f, revealAt + 56, 6)} />
                <rect x={170 - 14 + Math.sin(f / 10) * 4} y={-26} width={28} height={22} fill="none" stroke="#1c2a6e" strokeWidth={3} opacity={P(f, revealAt + 60, 8)} />
              </g>
            ) : art === "worlds" ? (
              <g transform="translate(600 360)">
                {[[-120, -30], [0, -90], [110, 10]].map(([x, y], i) => (
                  <circle key={i} cx={x} cy={y} r={42} fill="none" stroke="#1c2a6e" strokeWidth={5} opacity={P(f, revealAt + 30 + i * 6, 8)} />
                ))}
                <path d="M -82 -45 L -38 -75 M 38 -70 L 78 -15 M -78 -20 L 68 5" stroke="#1c2a6e" strokeWidth={3} strokeDasharray="8 8" opacity={P(f, revealAt + 50, 8)} />
                <line x1={-170} x2={190} y1={90} y2={90} stroke="#b3121b" strokeWidth={5} strokeLinecap="round" opacity={P(f, revealAt + 60, 8)} />
                <text x={10} y={130} textAnchor="middle" fontFamily={HAND} fontSize={30} fill="#b3121b" opacity={P(f, revealAt + 66, 8)}>tempo ≠ mundos</text>
              </g>
            ) : art === "parallel" ? (
              <g transform="translate(600 330)">
                {[0, 1, 2].map((i) => (
                  <line key={i} x1={-180} x2={180} y1={-60 + i * 60} y2={-60 + i * 60} stroke="#1c2a6e" strokeWidth={5} strokeLinecap="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - P(f, revealAt + 30 + i * 6, 14)} />
                ))}
                <path d="M -10 -40 L 10 -20 M 10 -40 L -10 -20 M -10 20 L 10 40 M 10 20 L -10 40" stroke="#b3121b" strokeWidth={5} strokeLinecap="round" opacity={P(f, revealAt + 60, 8)} />
              </g>
            ) : art === "leak" ? (
              <g transform="translate(600 350)">
                <path d="M -20 -120 L 10 -60 L -15 0 L 20 60 L -5 120" fill="none" stroke="#b3121b" strokeWidth={6} strokeLinecap="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - draw} />
                {[0, 1, 2, 3].map((i) => (
                  <circle key={i} cx={-60 - ((f / 2 + i * 20) % 80)} cy={-40 + i * 30} r={6} fill="#1c2a6e" opacity={P(f, revealAt + 50, 8)} />
                ))}
                <text x={70} y={-90} fontFamily={HAND} fontSize={34} fill="#1c2a6e" opacity={P(f, revealAt + 56, 8)}>Xen</text>
              </g>
            ) : art === "align" ? (
              // três elipses que vão se alinhando numa só
              <g transform="translate(600 340)">
                {[110, 80, 50].map((r, k) => {
                  const t = Math.min(1, Math.max(0, (f - revealAt - 30) / 60));
                  return <ellipse key={k} rx={r} ry={r * (0.25 + 0.75 * t)} fill="none" stroke={k === 1 ? "#b3121b" : "#1c2a6e"} strokeWidth={5} transform={`rotate(${(1 - t) * (k * 50 - 50)})`} opacity={P(f, revealAt + 30 + k * 6, 8)} />;
                })}
              </g>
            ) : art === "pieces" ? (
              // um tabuleiro 3x3 e uma peça que pula de casa em casa
              <g transform="translate(540 260)">
                {Array.from({ length: 9 }).map((_, k) => (
                  <rect key={k} x={(k % 3) * 60} y={Math.floor(k / 3) * 60} width={60} height={60} fill="none" stroke="#1c2a6e" strokeWidth={3} opacity={P(f, revealAt + 30 + k * 2, 6)} />
                ))}
                <circle cx={30 + (Math.floor(f / 20) % 3) * 60} cy={30 + (Math.floor(f / 33) % 3) * 60} r={16} fill="#b3121b" opacity={P(f, revealAt + 50, 8)} />
              </g>
            ) : art === "noentry" ? (
              // a casa do centro com barreira: um X em volta
              <g transform="translate(600 340)">
                <rect x={-60} y={-60} width={120} height={120} fill="none" stroke="#1c2a6e" strokeWidth={5} pathLength={1} strokeDasharray="1" strokeDashoffset={1 - draw} />
                <line x1={-90} y1={-90} x2={90} y2={90} stroke="#b3121b" strokeWidth={6} strokeLinecap="round" opacity={P(f, revealAt + 50, 8)} />
                <line x1={90} y1={-90} x2={-90} y2={90} stroke="#b3121b" strokeWidth={6} strokeLinecap="round" opacity={P(f, revealAt + 56, 8)} />
              </g>
            ) : art === "agent" ? (
              // um círculo (ela) com um ponto escondido dentro (a agente) que pisca devagar
              <g transform="translate(600 340)">
                <circle r={110} fill="none" stroke="#1c2a6e" strokeWidth={6} pathLength={1} strokeDasharray="1" strokeDashoffset={1 - draw} />
                <circle r={22 + 4 * Math.sin(f / 10)} fill="#b3121b" opacity={P(f, revealAt + 44, 10) * (0.5 + 0.5 * Math.sin(f / 14))} />
                <path d="M 150 -120 l 40 -20 l 0 34 l -40 0 Z" fill="none" stroke="#1c2a6e" strokeWidth={4} opacity={P(f, revealAt + 50, 8)} />
              </g>
            ) : art === "break" ? (
              // uma parede com rachadura que se abre; duas bolinhas atravessam
              <g transform="translate(600 340)">
                <rect x={-20} y={-130} width={40} height={260} fill="none" stroke="#1c2a6e" strokeWidth={5} opacity={P(f, revealAt + 30, 8)} />
                <path d="M -20 -60 l 18 14 l -10 20 l 24 14 l -8 24" fill="none" stroke="#b3121b" strokeWidth={5} pathLength={1} strokeDasharray="1" strokeDashoffset={1 - draw} />
                <circle cx={-80 + 160 * ((f / 40) % 1)} cy={-20} r={10} fill="#1c2a6e" opacity={P(f, revealAt + 56, 8)} />
                <circle cx={-80 + 160 * (((f + 20) / 40) % 1)} cy={30} r={10} fill="#b3121b" opacity={P(f, revealAt + 60, 8)} />
              </g>
            ) : art === "mask" ? (
              // uma máscara (contorno) sobre um rosto vazio + um ponteiro de ritmo
              <g transform="translate(600 330)">
                <path d="M -70 -60 C -70 -110 70 -110 70 -60 L 74 20 C 66 70 30 96 0 100 C -30 96 -66 70 -74 20 Z" fill="none" stroke="#1c2a6e" strokeWidth={5} pathLength={1} strokeDasharray="1" strokeDashoffset={1 - draw} />
                <ellipse cx={-28} cy={-20} rx={18} ry={11} fill="none" stroke="#1c2a6e" strokeWidth={4} opacity={P(f, revealAt + 40, 8)} />
                <ellipse cx={28} cy={-20} rx={18} ry={11} fill="none" stroke="#1c2a6e" strokeWidth={4} opacity={P(f, revealAt + 40, 8)} />
                <line x1={150} y1={60} x2={150 + Math.sin(f / 12) * 50} y2={-10} stroke="#b3121b" strokeWidth={5} strokeLinecap="round" opacity={P(f, revealAt + 54, 8)} />
              </g>
            ) : art === "anchor" ? (
              // o navio desliza na linha do tempo; o núcleo fica amarrado num ponto fixo (a ferida)
              <g transform="translate(600 330)">
                <line x1={-200} x2={200} y1={60} y2={60} stroke="#1c2a6e" strokeWidth={4} strokeLinecap="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - draw} />
                <g transform={`translate(${Math.sin(f / 14) * 120} 0)`} opacity={P(f, revealAt + 30, 8)}>
                  <path d="M -40 10 L 34 10 L 42 -2 L 22 -2 L 18 -14 L -6 -14 L -10 -22 L -16 -22 L -18 -2 L -40 -2 Z" fill="none" stroke="#1c2a6e" strokeWidth={4} strokeLinejoin="round" />
                </g>
                <path d={`M ${Math.sin(f / 14) * 120} 4 Q ${Math.sin(f / 14) * 60} 120 0 150`} fill="none" stroke="#b3121b" strokeWidth={4} strokeLinecap="round" opacity={P(f, revealAt + 44, 8)} />
                <path d="M 0 126 C 12 140 -8 152 0 176 C -12 160 8 146 0 126 Z" fill="#b3121b" opacity={P(f, revealAt + 50, 8)} />
              </g>
            ) : art === "catalyst" ? (
              // o navio pequeno à esquerda; a seta passa reto por ele e vai num núcleo maior: o catalisador
              <g transform="translate(600 350)">
                <path d="M -230 10 L -150 10 L -140 -4 L -165 -4 L -170 -18 L -200 -18 L -205 -4 L -230 -4 Z" fill="none" stroke="#1c2a6e" strokeWidth={4} strokeLinejoin="round" opacity={P(f, revealAt + 30, 8)} />
                <path d="M -130 4 C -60 -30 0 -30 60 0" fill="none" stroke="#b3121b" strokeWidth={4} strokeLinecap="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - draw} />
                <circle cx={130} cy={0} r={46 + 4 * Math.sin(f / 6)} fill="none" stroke="#b3121b" strokeWidth={6} opacity={P(f, revealAt + 44, 8)} />
                {Array.from({ length: 10 }).map((_, k) => {
                  const a = (k / 10) * Math.PI * 2 + f / 40;
                  return <line key={k} x1={130 + Math.cos(a) * 60} y1={Math.sin(a) * 60} x2={130 + Math.cos(a) * (84 + 6 * Math.sin(f / 5 + k))} y2={Math.sin(a) * (84 + 6 * Math.sin(f / 5 + k))} stroke="#b3121b" strokeWidth={4} strokeLinecap="round" opacity={P(f, revealAt + 50 + k, 6)} />;
                })}
                <text x={130} y={12} textAnchor="middle" fontFamily={HAND} fontSize={36} fill="#1c2a6e" opacity={P(f, revealAt + 56, 8)}>?</text>
              </g>
            ) : art === "infinity" ? (
              <g transform="translate(610 360)">
                <path d="M 0 0 C 60 -90 150 -90 150 0 C 150 90 60 90 0 0 C -60 -90 -150 -90 -150 0 C -150 90 -60 90 0 0 Z" fill="none" stroke="#1c2a6e" strokeWidth={6} strokeLinecap="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - draw} />
                <circle r={8} fill="#b3121b" transform={`translate(${150 * Math.sin(f / 15)} ${60 * Math.sin(f / 7.5)})`} opacity={P(f, revealAt + 50, 8)} />
              </g>
            ) : (
              // o navio dividido em setores, cada um com a sua época (rabiscado à mão)
              <g transform="translate(430 300)">
                <path d="M 0 140 L 360 140 L 390 100 L 330 100 L 320 60 L 260 60 L 250 30 L 230 30 L 225 100 L 0 100 Z" fill="none" stroke="#1c2a6e" strokeWidth={5} strokeLinejoin="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - draw} />
                {[90, 180, 270].map((x, k) => (
                  <line key={k} x1={x} y1={100} x2={x} y2={140} stroke="#1c2a6e" strokeWidth={3} strokeDasharray="6 6" opacity={P(f, revealAt + 40 + k * 4, 6)} />
                ))}
                {["hoje", "−30", "+20", "−12"].map((t, k) => (
                  <text key={k} x={45 + k * 90} y={180} textAnchor="middle" fontFamily={HAND} fontSize={32} fill={k % 2 ? "#b3121b" : "#1c2a6e"} opacity={P(f, revealAt + 50 + k * 6, 8)} transform={`rotate(${(k % 2 ? -4 : 3) + Math.sin(f / 8 + k) * (f > revealAt + 80 ? 3 : 0)} ${45 + k * 90} 170)`}>
                    {t}
                  </text>
                ))}
              </g>
            )}
            {lines.map((l, k) => (
              <text key={l} x={60} y={300 + k * 60} fontFamily={HAND} fontSize={40} fill={k === lines.length - 1 ? "#b3121b" : "#1c2a6e"} opacity={P(f, revealAt + 64 + k * 8, 10)}>
                {art === "clock" ? l : ""}
              </text>
            ))}
            {hand ? <Written id={`t${num}`} text={title} x={50} y={172} fs={70} col="#1c2a6e" t0={tStart} d={tDur} /> : null}
            {hand ? lines.map((l, k) => <Written key={"s" + l} id={`l${num}${k}`} text={l} x={60} y={520 + k * 44} fs={34} col={k === lines.length - 1 ? "#b3121b" : "#1c2a6e"} t0={lStarts[k]} d={lDur[k]} />) : null}
          </svg>
        </div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 70, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 30, letterSpacing: 10, color: "rgba(242,240,247,0.55)", opacity: P(f, inAt + 10, 12) }}>23 FUNDAMENTOS</div>
    </AbsoluteFill>
  );
};

// =============================================================================================== a corrida
// "a viagem para o Ártico deixa de ser uma expedição e vira uma corrida": o mesmo mapa polar do Overwatch. A
// Resistência sai de White Forest (linha âmbar com a ficha λ), o Combine sai de City 17 (linha vermelha); os dois
// apontam para o Ártico. No "expedição" o rótulo é riscado; na "corrida" os dois disparam (rastro), o placar de
// distância conta para baixo e o centro pulsa. Tempos em QUADROS.
export const HLRaceMap: React.FC<{ life: number; strikeAt?: number; raceAt?: number }> = ({ life, strikeAt = 1e9, raceAt = 1e9 }) => {
  const f = useCurrentFrame();
  const HUD = "#c6f7ff";
  const RED = "#ff5566";
  const AMB = "#ffb22e";
  const rot = f * 0.04;
  const zoom = interpolate(f, [0, life], [1.08, 1.3], { ...C, easing: Easing.inOut(Easing.sin) });
  const pr = (lat: number, lon: number) => polar(lat, lon + rot);
  const [ax0, ay0] = pr(...PLACES.arctic);
  const cx = 960 - ax0 * zoom;
  const cy = 545 - ay0 * zoom;
  const T = (lat: number, lon: number): [number, number] => {
    const [x, y] = pr(lat, lon);
    return [cx + x * zoom, cy + y * zoom];
  };
  const race = P(f, raceAt, 10);
  // avanço: devagar (expedição) e depois disparando (corrida); cada lado com o seu ritmo
  const slow = (k: number) => interpolate(f, [0, raceAt], [0, k], { ...C });
  const fast = (k: number) => interpolate(f, [raceAt, life], [0, k], { ...C, easing: Easing.out(Easing.quad) });
  const uRes = 0.1 + slow(0.16) + fast(0.34);
  const uCmb = 0.08 + slow(0.12) + fast(0.4);
  const routeR = (u: number): [number, number] => T(46 + (89 - 46) * u, -118 + 10 * Math.sin(u * 3));
  const routeC = (u: number): [number, number] => T(50 + (89 - 50) * u, 24 - 14 * Math.sin(u * 2.4));
  const path = (fn: (u: number) => [number, number], u1: number) => {
    const pts: string[] = [];
    for (let i = 0; i <= 40; i++) {
      const [x, y] = fn((i / 40) * u1);
      pts.push(`${i ? "L" : "M"} ${x.toFixed(1)} ${y.toFixed(1)}`);
    }
    return pts.join(" ");
  };
  const coast = COAST.map((poly) => {
    const pts: [number, number][] = [];
    for (let k = 0; k < poly.length; k++) {
      const a = poly[k];
      const b = poly[(k + 1) % poly.length];
      for (let s = 0; s < 6; s++) {
        const u = s / 6;
        pts.push(T(a[0] + (b[0] - a[0]) * u, a[1] + (((b[1] - a[1] + 540) % 360) - 180) * u));
      }
    }
    return pts;
  });
  const [ax, ay] = T(...PLACES.arctic);
  const [rx, ry] = routeR(uRes);
  const [kx, ky] = routeC(uCmb);
  const strike = P(f, strikeAt, 8);
  const kmR = Math.round(3840 * (1 - uRes) + 120);
  const kmC = Math.round(4120 * (1 - uCmb) + 120);
  const streak = (fn: (u: number) => [number, number], u: number, col: string) =>
    race > 0
      ? Array.from({ length: 6 }).map((_, j) => {
          const [x1, y1] = fn(Math.max(0, u - 0.02 - j * 0.025));
          const [x2, y2] = fn(Math.max(0, u - 0.035 - j * 0.025));
          return <line key={j} x1={x1} y1={y1} x2={x2} y2={y2} stroke={col} strokeWidth={6 - j * 0.8} opacity={(0.8 - j * 0.12) * race} strokeLinecap="round" />;
        })
      : null;
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 55%, #0a2a33 0%, #031014 75%)" }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <g stroke={HUD} fill="none" opacity={0.16}>
          {[40, 55, 70, 80].map((lat) => (
            <circle key={lat} cx={ax} cy={ay} r={((90 - lat) / 80) * R0 * zoom} />
          ))}
          {Array.from({ length: 12 }).map((_, k) => {
            const [x2, y2] = T(30, k * 30);
            return <line key={k} x1={ax} y1={ay} x2={x2} y2={y2} />;
          })}
        </g>
        {coast.map((pts, k) => (
          <g key={k} fill={HUD} opacity={0.5}>
            {pts.map(([x, y], j) => (
              <circle key={j} cx={x} cy={y} r={1.8} />
            ))}
          </g>
        ))}
        {/* o que falta (tracejado apagado) e o que já andou (cheio) */}
        <path d={path(routeR, 1)} fill="none" stroke={AMB} strokeWidth={2} strokeDasharray="6 10" opacity={0.3} />
        <path d={path(routeC, 1)} fill="none" stroke={RED} strokeWidth={2} strokeDasharray="6 10" opacity={0.3} />
        <path d={path(routeR, uRes)} fill="none" stroke={AMB} strokeWidth={5} style={{ filter: "drop-shadow(0 0 8px rgba(255,178,46,0.8))" }} />
        <path d={path(routeC, uCmb)} fill="none" stroke={RED} strokeWidth={5} style={{ filter: "drop-shadow(0 0 8px rgba(255,85,102,0.8))" }} />
        {streak(routeR, uRes, AMB)}
        {streak(routeC, uCmb, RED)}
        {/* marcadores */}
        <g transform={`translate(${rx} ${ry})`}>
          <circle r={20} fill="#2a1406" stroke={AMB} strokeWidth={3} />
          <text y={9} textAnchor="middle" fill={AMB} fontFamily="Georgia, serif" fontSize={26} fontWeight={700}>
            λ
          </text>
          <text x={32} y={-22} fill={AMB} fontFamily={MONO} fontSize={20} letterSpacing={4}>
            RESISTÊNCIA
          </text>
        </g>
        <g transform={`translate(${kx} ${ky})`}>
          <polygon points="0,-18 16,12 -16,12" fill={RED} />
          <text x={26} y={-16} fill={RED} fontFamily={MONO} fontSize={20} letterSpacing={4}>
            COMBINE
          </text>
        </g>
        {/* o alvo no centro */}
        <circle cx={ax} cy={ay} r={30 + 8 * Math.sin(f / 4) + race * 10 * Math.sin(f / 2)} fill="none" stroke="#ffd04d" strokeWidth={3} />
        <text x={ax} y={ay - 50} textAnchor="middle" fill="#ffd04d" fontFamily={MONO} fontSize={24} letterSpacing={6}>
          BOREALIS
        </text>
      </svg>
      {/* EXPEDIÇÃO (riscada) → CORRIDA */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 150, textAlign: "center", fontFamily: MONO, letterSpacing: 18 }}>
        <span style={{ position: "relative", fontSize: 46, color: HUD, opacity: 1 - race * 0.6 }}>
          EXPEDIÇÃO
          <span style={{ position: "absolute", left: -10, top: "52%", height: 6, width: `${strike * 104}%`, background: RED }} />
        </span>
      </div>
      {race > 0 ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 210, textAlign: "center", fontFamily: MONO, fontSize: 90, fontWeight: 700, letterSpacing: 26, color: "#ffd04d", transform: `scale(${1.3 - race * 0.3})`, opacity: race }}>CORRIDA</div>
      ) : null}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 90, display: "flex", justifyContent: "center", gap: 120, fontFamily: MONO, fontSize: 30, letterSpacing: 4 }}>
        <span style={{ color: AMB }}>λ RESISTÊNCIA · {kmR.toLocaleString("pt-BR")} km</span>
        <span style={{ color: RED }}>▲ COMBINE · {kmC.toLocaleString("pt-BR")} km</span>
      </div>
      <div style={{ position: "absolute", left: 90, top: 70, fontFamily: MONO, color: HUD, letterSpacing: 4, lineHeight: 1.5 }}>
        <div style={{ fontSize: 26 }}>OVERWATCH ◆ MAPA ESTRATÉGICO</div>
        <div style={{ fontSize: 18, opacity: 0.7 }}>DESTINO COMUM · ÁRTICO</div>
      </div>
      <AbsoluteFill style={{ background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.25) 0 1px, rgba(0,0,0,0) 1px 3px)", pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};
