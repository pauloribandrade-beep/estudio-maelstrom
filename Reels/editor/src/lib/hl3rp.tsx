// =================================================================================================
// HL3 · REFORMULAÇÃO · 5B "a previsão" e "a espera" (06/10/2026)
//  · HLRForecast: o ciclo do Kleiner (manifestações periódicas, a próxima janela longa projetada) → as leituras da
//    Mossman estreitam a incerteza → mapa de gelo do Ártico: a elipse de uma região inteira encolhe até um ponto
//    (coordenadas) → a hora (±40 min → ±3 min) → o comboio segue até lá → espera
//  · HLRWait: campo de gelo em camadas, o snowcat com faróis, time-lapse das estrelas (os minutos passam), o
//    relógio zera no instante previsto; a mira no gelo vazio: LUZ ✕ · PORTAL ✕ · DISTORÇÃO ✕
// =================================================================================================
import React, { useMemo } from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { FONT, MONO } from "./overlays";
import { C, HL, rnd } from "./hl3";
import { FilmLook } from "./hl3r";

const RED = "#ff5d4d";
const CREAM = "#ffe2b0";
const ICE = "#9fe6ff";
const GREEN = "#8dffa8";
const ORANGE = HL.orange;
const AMB = "#ffb22e";
const TXT = HL.text;
const P = (f: number, at: number, d = 12) => interpolate(f, [at, at + d], [0, 1], { ...C, easing: Easing.out(Easing.cubic) });
const IO = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

// ---------------------------------------------------------------- mapa de gelo (placas e rachaduras)
const IceMap: React.FC<{ seed?: number }> = ({ seed = 0 }) => {
  const cracks = useMemo(
    () =>
      Array.from({ length: 70 }).map((_, i) => {
        let x = rnd(i * 3.1 + seed) * 2200 - 140;
        let y = rnd(i * 5.3 + seed) * 1300 - 110;
        const pts: string[] = [`${x.toFixed(0)},${y.toFixed(0)}`];
        const ang0 = rnd(i * 7.7) * Math.PI * 2;
        for (let k = 0; k < 7; k++) {
          const a = ang0 + (rnd(i * 11 + k) - 0.5) * 1.4;
          const l = 40 + rnd(i * 13 + k) * 110;
          x += Math.cos(a) * l;
          y += Math.sin(a) * l;
          pts.push(`${x.toFixed(0)},${y.toFixed(0)}`);
        }
        return pts.join(" ");
      }),
    [seed],
  );
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
      <defs>
        <radialGradient id="iceG" cx="50%" cy="45%" r="70%">
          <stop offset="0" stopColor="#1b2f3a" />
          <stop offset="1" stopColor="#081218" />
        </radialGradient>
      </defs>
      <rect width={1920} height={1080} fill="url(#iceG)" />
      {cracks.map((d, i) => (
        <polyline key={i} points={d} fill="none" stroke={i % 5 === 0 ? "rgba(200,235,250,0.28)" : "rgba(159,230,255,0.12)"} strokeWidth={i % 5 === 0 ? 2 : 1} />
      ))}
      {/* água aberta (canais escuros) */}
      {[0, 1, 2].map((k) => (
        <path key={k} d={`M ${-50 + k * 700} ${200 + k * 300} q 300 ${80 - k * 40} 600 ${20 + k * 30} t 700 ${-60 + k * 20}`} fill="none" stroke="rgba(2,8,12,0.75)" strokeWidth={14 - k * 3} />
      ))}
    </svg>
  );
};

type FP = { life: number; cycleAt?: number; nextAt?: number; mossAt?: number; aboveAt?: number; shrinkAt?: number; regionAt?: number; pointAt?: number; hourAt?: number; goAt?: number; waitAt?: number };
export const HLRForecast: React.FC<FP> = (p) => {
  const f = useCurrentFrame();
  const a = (v?: number) => v ?? 1e9;
  const [cycleAt, nextAt, mossAt, aboveAt, shrinkAt, regionAt, pointAt, hourAt, goAt, waitAt] = [p.cycleAt, p.nextAt, p.mossAt, p.aboveAt, p.shrinkAt, p.regionAt, p.pointAt, p.hourAt, p.goAt, p.waitAt].map(a);
  const life = p.life;
  // ---------------- 1) o ciclo
  const chart = P(f, 4, 14) * (1 - P(f, shrinkAt - 10, 14));
  const X = (d: number) => 160 + d * 26; // dias → x
  const spikes = [3, 9.5, 16, 22.5, 29, 35.5, 42, 48.5];
  const longs = [16, 42];
  const nextX = X(55);
  const draw = P(f, 8, Math.max(30, cycleAt + 20 - 8));
  const cone = 1 - 0.85 * P(f, mossAt, 50);
  // ---------------- 2) o mapa
  const map = P(f, shrinkAt - 10, 16);
  const R = interpolate(f, [regionAt, pointAt + 6], [520, 26], { ...C, easing: Easing.inOut(Easing.cubic) });
  const zoom = 1 + 1.1 * IO((f - pointAt) / 40);
  const PX = 1120;
  const PY = 520;
  const pm = Math.round(40 - 37 * P(f, hourAt, 30));
  const route = P(f, goAt, 46);
  const st = { x: 520, y: 760 };
  return (
    <AbsoluteFill style={{ background: "#05080b", overflow: "hidden" }}>
      {/* 1) o ciclo do Kleiner */}
      {chart > 0 ? (
        <AbsoluteFill style={{ opacity: chart }}>
          <div style={{ position: "absolute", left: 80, top: 70, fontFamily: MONO, letterSpacing: 6 }}>
            <div style={{ fontSize: 22, color: ICE }}>O CICLO DAS MANIFESTAÇÕES · KLEINER</div>
            <div style={{ fontSize: 16, color: "rgba(242,240,247,0.6)", marginTop: 6 }}>DIAS →</div>
          </div>
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
            <line x1={140} x2={1800} y1={700} y2={700} stroke="rgba(242,240,247,0.35)" strokeWidth={2} />
            {/* o ciclo (onda) desenhando */}
            <polyline
              points={Array.from({ length: 220 })
                .map((_, i) => {
                  const d = i * 0.25;
                  const y = 700 - 40 - 30 * Math.sin((d / 6.5) * Math.PI * 2);
                  return `${X(d).toFixed(1)},${y.toFixed(1)}`;
                })
                .join(" ")}
              fill="none"
              stroke="rgba(159,230,255,0.35)"
              strokeWidth={2}
              strokeDasharray={`${3000 * draw} 3000`}
            />
            {spikes.map((d, k) => {
              const big = longs.includes(d);
              const o = P(f, Math.min(cycleAt, 12 + k * 9), 8);
              return <rect key={k} x={X(d) - (big ? 26 : 4)} y={700 - (big ? 240 : 120)} width={big ? 52 : 8} height={big ? 240 : 120} rx={3} fill={big ? "rgba(159,230,255,0.35)" : ICE} opacity={o} />;
            })}
            {/* a próxima janela longa (projetada) */}
            {f >= nextAt ? (
              <g opacity={P(f, nextAt, 12)}>
                <line x1={X(49)} x2={nextX} y1={700} y2={700} stroke={ORANGE} strokeWidth={2} strokeDasharray="8 8" />
                {/* incerteza: a faixa se estreita com as leituras da Mossman */}
                <rect x={nextX - 160 * cone} y={420} width={320 * cone} height={280} fill="rgba(255,152,40,0.10)" stroke="rgba(255,152,40,0.5)" strokeDasharray="6 6" />
                <rect x={nextX - 26} y={460} width={52} height={240} rx={3} fill="none" stroke={ORANGE} strokeWidth={3} strokeDasharray="10 6" />
                <text x={nextX} y={440} textAnchor="middle" fill={ORANGE} fontFamily={MONO} fontSize={18} letterSpacing={4}>
                  PRÓXIMA JANELA LONGA
                </text>
              </g>
            ) : null}
          </svg>
          {f >= mossAt ? (
            <div style={{ position: "absolute", right: 90, top: 150, width: 520, textAlign: "right", opacity: P(f, mossAt, 10) }}>
              <div style={{ fontFamily: MONO, fontSize: 16, letterSpacing: 6, color: CREAM }}>+ LEITURAS DA MOSSMAN · 310 M</div>
              <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 60, color: TXT, lineHeight: 1.05 }}>{f >= aboveAt ? "em cima do fenômeno" : "a incerteza encolhe"}</div>
            </div>
          ) : null}
        </AbsoluteFill>
      ) : null}
      {/* 2) o mapa: região → ponto */}
      {map > 0 ? (
        <AbsoluteFill style={{ opacity: map }}>
          <AbsoluteFill style={{ transform: `scale(${zoom})`, transformOrigin: `${PX}px ${PY}px` }}>
            <IceMap />
            <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
              {/* grade de coordenadas */}
              {Array.from({ length: 9 }).map((_, k) => (
                <line key={"v" + k} x1={k * 240} x2={k * 240} y1={0} y2={1080} stroke="rgba(159,230,255,0.06)" />
              ))}
              {Array.from({ length: 6 }).map((_, k) => (
                <line key={"h" + k} x1={0} x2={1920} y1={k * 216} y2={k * 216} stroke="rgba(159,230,255,0.06)" />
              ))}
              {/* a estação */}
              <circle cx={st.x} cy={st.y} r={9 / zoom} fill={CREAM} />
              <text x={st.x + 14} y={st.y + 5} fill={CREAM} fontFamily={MONO} fontSize={16 / zoom} letterSpacing={3}>
                ESTAÇÃO
              </text>
              {/* a elipse da previsão */}
              <ellipse cx={PX} cy={PY} rx={R * 1.4} ry={R} fill="rgba(255,93,77,0.10)" stroke={RED} strokeWidth={2.5 / zoom} strokeDasharray={`${10 / zoom} ${8 / zoom}`} />
              {f >= pointAt ? (
                <g opacity={P(f, pointAt, 8)}>
                  <circle cx={PX} cy={PY} r={8 / zoom} fill={ORANGE} />
                  <circle cx={PX} cy={PY} r={(18 + 8 * Math.sin(f / 5)) / zoom} fill="none" stroke={ORANGE} strokeWidth={2 / zoom} />
                  <line x1={PX - 60 / zoom} x2={PX + 60 / zoom} y1={PY} y2={PY} stroke={ORANGE} strokeWidth={1.5 / zoom} />
                  <line x1={PX} x2={PX} y1={PY - 60 / zoom} y2={PY + 60 / zoom} stroke={ORANGE} strokeWidth={1.5 / zoom} />
                </g>
              ) : null}
              {/* a rota do comboio */}
              {route > 0
                ? (() => {
                    const pts: [number, number][] = [];
                    for (let i = 0; i <= 30; i++) {
                      const t = i / 30;
                      pts.push([st.x + (PX - st.x) * t + Math.sin(t * Math.PI * 2) * 40, st.y + (PY - st.y) * t + Math.sin(t * Math.PI) * -60]);
                    }
                    const n = Math.max(1, Math.round(30 * route));
                    const cur = pts[n];
                    return (
                      <g>
                        <polyline points={pts.slice(0, n + 1).map((q) => q.join(",")).join(" ")} fill="none" stroke={AMB} strokeWidth={3 / zoom} strokeDasharray={`${8 / zoom} ${6 / zoom}`} />
                        <rect x={cur[0] - 9 / zoom} y={cur[1] - 6 / zoom} width={18 / zoom} height={12 / zoom} rx={3 / zoom} fill={AMB} />
                      </g>
                    );
                  })()
                : null}
            </svg>
          </AbsoluteFill>
          {/* rótulos fixos na tela */}
          <div style={{ position: "absolute", left: 80, top: 70, fontFamily: MONO, letterSpacing: 6 }}>
            <div style={{ fontSize: 22, color: f >= pointAt ? ORANGE : RED }}>{f >= pointAt ? "UM PONTO NO GELO" : "UMA REGIÃO INTEIRA DO ÁRTICO"}</div>
            <div style={{ fontSize: 16, color: "rgba(242,240,247,0.65)", marginTop: 6 }}>{f >= pointAt ? "78°14′N · 24°02′L" : `RAIO ${Math.round(R * 0.9)} KM`}</div>
          </div>
          {f >= hourAt ? (
            <div style={{ position: "absolute", right: 90, top: 70, textAlign: "right", opacity: P(f, hourAt, 10) }}>
              <div style={{ fontFamily: MONO, fontSize: 16, letterSpacing: 6, color: CREAM }}>HORA ESTIMADA</div>
              <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 110, color: TXT, lineHeight: 1 }}>04:12</div>
              <div style={{ fontFamily: MONO, fontSize: 24, letterSpacing: 4, color: ORANGE }}>± {pm} MIN</div>
            </div>
          ) : null}
          {f >= goAt ? (
            <div style={{ position: "absolute", left: 80, bottom: 80, opacity: P(f, goAt, 10) }}>
              <div style={{ fontFamily: MONO, fontSize: 16, letterSpacing: 6, color: AMB }}>{f >= waitAt ? "NO PONTO" : "A EXPEDIÇÃO SEGUE"}</div>
              <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 72, color: TXT, lineHeight: 1 }}>{f >= waitAt ? "e espera" : "até lá"}</div>
            </div>
          ) : null}
        </AbsoluteFill>
      ) : null}
      <AbsoluteFill style={{ background: "#000", opacity: interpolate(f, [0, 6], [1, 0], C) + interpolate(f, [life - 6, life], [0, 1], C), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- a espera
type WP = { life: number; senseAt?: number; minAt?: number; nothingAt?: number; nowAt?: number; lightAt?: number; portalAt?: number; airAt?: number };
const ridge = (seed: number, base: number, amp: number) => {
  let d = `M -20 1100 L -20 ${base} `;
  for (let x = -20; x <= 1960; x += 20) d += `L ${x} ${(base - amp * (0.5 + 0.5 * Math.sin(x / 140 + seed) * Math.sin(x / 57 + seed * 2))).toFixed(1)} `;
  return d + "L 1960 1100 Z";
};
export const HLRWait: React.FC<WP> = (p) => {
  const f = useCurrentFrame();
  const a = (v?: number) => v ?? 1e9;
  const [senseAt, minAt, nothingAt, nowAt, lightAt, portalAt, airAt] = [p.senseAt, p.minAt, p.nothingAt, p.nowAt, p.lightAt, p.portalAt, p.airAt].map(a);
  const life = p.life;
  const stars = useMemo(() => Array.from({ length: 180 }).map((_, i) => ({ r: 80 + rnd(i * 2.3) * 1300, a: rnd(i * 4.1) * Math.PI * 2, s: 0.8 + rnd(i * 6.1) * 1.6 })), []);
  // time-lapse: as estrelas giram rápido enquanto os minutos passam
  const lapse = interpolate(f, [minAt - 6, minAt + 10, nowAt - 10, nowAt], [0, 1, 1, 0], C);
  const spin = useMemo(() => {
    const out = [0];
    for (let k = 1; k < 600; k++) out.push(out[k - 1] + 0.0006 + 0.012 * interpolate(k, [minAt - 6, minAt + 10, nowAt - 10, nowAt], [0, 1, 1, 0], C));
    return out;
  }, [minAt, nowAt]);
  const ang = spin[Math.min(599, Math.max(0, f))];
  // relógio
  const T = Math.max(0, f < minAt ? 180 - f / 30 : interpolate(f, [minAt, nowAt], [180 - minAt / 30, 0], C));
  const clock = `T−${String(Math.floor(T / 60)).padStart(2, "0")}:${String(Math.floor(T % 60)).padStart(2, "0")}`;
  const zero = f >= nowAt;
  const push = IO((f - nowAt) / 50);
  const checks = [
    ["LUZ", lightAt],
    ["PORTAL", portalAt],
    ["DISTORÇÃO", airAt],
  ] as const;
  return (
    <AbsoluteFill style={{ background: "#03060a", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${1 + 0.12 * push})`, transformOrigin: "60% 62%" }}>
        {/* céu: estrelas girando em volta do polo (rastros no time-lapse) */}
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          <defs>
            <linearGradient id="skyW" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#02040a" />
              <stop offset="0.7" stopColor="#0b1a26" />
            </linearGradient>
          </defs>
          <rect width={1920} height={1080} fill="url(#skyW)" />
          {/* aurora fraca */}
          <path d={`M -100 ${300 + Math.sin(f / 40) * 20} C 400 160, 900 360, 2000 220 L 2000 420 C 1100 520, 600 330, -100 480 Z`} fill="rgba(141,255,168,0.06)" />
          {stars.map((s, i) => {
            const cx = 960;
            const cy = -260;
            const a0 = s.a + ang;
            const x = cx + Math.cos(a0) * s.r;
            const y = cy + Math.sin(a0) * s.r * 0.9;
            if (y > 720) return null;
            const trail = lapse * 0.5;
            const x2 = cx + Math.cos(a0 - trail) * s.r;
            const y2 = cy + Math.sin(a0 - trail) * s.r * 0.9;
            return trail > 0.01 ? <path key={i} d={`M ${x2} ${y2} A ${s.r} ${s.r * 0.9} 0 0 1 ${x} ${y}`} fill="none" stroke="#e6f2ff" strokeWidth={s.s * 0.8} opacity={0.6} /> : <circle key={i} cx={x} cy={y} r={s.s} fill="#e6f2ff" opacity={0.7} />;
          })}
          {/* camadas de gelo */}
          <path d={ridge(1.2, 700, 40)} fill="#0e1d27" />
          <path d={ridge(2.7, 760, 34)} fill="#0b1720" />
          <path d={ridge(4.1, 840, 26)} fill="#081118" />
          {/* o ponto previsto no gelo */}
          <g transform="translate(1150 735)">
            <ellipse rx={260} ry={36} fill="none" stroke={zero ? ORANGE : "rgba(255,152,40,0.4)"} strokeWidth={2} strokeDasharray="10 8" />
            {zero ? <ellipse rx={260 + 30 * Math.sin(f / 6)} ry={36 + 4 * Math.sin(f / 6)} fill="none" stroke={ORANGE} strokeWidth={1} opacity={0.5} /> : null}
          </g>
          {/* o snowcat em primeiro plano com faróis */}
          <g transform="translate(40 860)">
            <path d="M 0 60 L 20 0 L 200 0 L 230 30 L 260 30 L 270 60 Z" fill="#05090c" stroke="rgba(159,230,255,0.25)" />
            <rect x={-10} y={60} width={290} height={34} rx={14} fill="#04070a" stroke="rgba(159,230,255,0.2)" />
            <path d={`M 268 40 L 1100 ${-160 + Math.sin(f / 30) * 6} L 1100 ${10 + Math.sin(f / 30) * 6} Z`} fill="rgba(255,244,210,0.07)" />
            <circle cx={266} cy={40} r={6} fill="#fff4d0" />
          </g>
          {/* neve passando */}
          {Array.from({ length: 90 }).map((_, i) => {
            const x = (((rnd(i * 2.1) * 2100 + f * (3 + rnd(i) * 5)) % 2100) + 2100) % 2100 - 90;
            const y = (((rnd(i * 3.7) * 1100 + f * (1 + rnd(i * 5) * 2)) % 1100) + 1100) % 1100;
            return <circle key={"n" + i} cx={x} cy={y} r={0.8 + rnd(i * 7) * 1.8} fill="#eaf6ff" opacity={0.35} />;
          })}
        </svg>
      </AbsoluteFill>
      {/* relógio do Borealis (some suave nos últimos 12 quadros: a chegada começa no mesmo gelo, sem texto) */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 120, textAlign: "center", opacity: 1 - P(f, life - 12, 12) }}>
        <div style={{ fontFamily: MONO, fontSize: 20, letterSpacing: 8, color: f >= senseAt ? ORANGE : "rgba(242,240,247,0.6)" }}>{f >= senseAt ? "O RELÓGIO DO BOREALIS VOLTA A FAZER SENTIDO" : "RELÓGIO DO BOREALIS"}</div>
        <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 170, letterSpacing: -4, color: zero ? CREAM : TXT, lineHeight: 1, textShadow: zero ? "0 0 50px rgba(255,226,176,0.45)" : undefined }}>{clock}</div>
        {f >= nothingAt && f < nowAt ? <div style={{ fontFamily: MONO, fontSize: 22, letterSpacing: 8, color: ICE, opacity: P(f, nothingAt, 8) }}>NADA ACONTECE</div> : null}
        {zero ? <div style={{ fontFamily: MONO, fontSize: 22, letterSpacing: 8, color: ORANGE, opacity: P(f, nowAt, 8) }}>O INSTANTE PREVISTO</div> : null}
      </div>
      {/* as checagens: nada */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 90, display: "flex", justifyContent: "center", gap: 40, opacity: 1 - P(f, life - 12, 12) }}>
        {checks.map(([k, at]) => {
          const on = P(f, at, 8);
          return (
            <div key={k} style={{ width: 300, padding: "14px 20px", borderRadius: 10, background: "rgba(4,8,12,0.72)", border: `1px solid ${on > 0 ? "rgba(255,93,77,0.7)" : "rgba(159,230,255,0.2)"}`, opacity: zero ? 1 : 0.3, display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: MONO }}>
              <span style={{ fontSize: 20, letterSpacing: 5, color: ICE }}>{k}</span>
              <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 40, color: RED, opacity: on, transform: `scale(${1.6 - 0.6 * on})` }}>✕</span>
            </div>
          );
        })}
      </div>
      <AbsoluteFill style={{ background: "#000", opacity: interpolate(f, [0, 6], [1, 0], C), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};
