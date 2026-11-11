// =================================================================================================
// HL3 · REFORMULAÇÃO · 5A "o massacre" (06/10/2026). Usa a estação modelada (hl3rs):
//  1) corte em 3 níveis empilhados: quanto mais fundo, mais Flickers (1 → 4 → 12) e mais difícil achar a ancorada
//  2) transição: a gravação REBOBINA até a noite do ataque (02:07)
//  3) replay tático: esquadrões Combine entram e limpam salas (LIMPA) → criaturas surgem dentro das salas limpas,
//     atrás das barricadas e em salas sem acesso → os soldados caem (lista de baixas) → INVASÃO vira MASSACRE
// =================================================================================================
import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { FONT, MONO } from "./overlays";
import { C, HL, rnd } from "./hl3";
import { FilmLook } from "./hl3r";
import { Cam, Glitch, Key, PP, ROOMS, St, Station, camAt, pr } from "./hl3rs";

const RED = "#ff5d4d";
const AMB = "#ffb22e";
const CREAM = "#ffe2b0";
const ICE = "#9fe6ff";
const CYAN = "#5ff3ff";
const GREEN = "#8dffa8";
const MAG = "#ff3df0";
const TXT = HL.text;
const P = (f: number, at: number, d = 12) => interpolate(f, [at, at + d], [0, 1], { ...C, easing: Easing.out(Easing.cubic) });

type Props = { life: number; deepAt?: number; whichAt?: number; stateAt?: number; replayAt?: number; clearAt?: number; wrongAt?: number; insideAt?: number; barrAt?: number; noPathAt?: number; invAt?: number; massAt?: number };

const DECK = 22; // distância entre níveis
const FL2: [number, number][] = [[-22, -14], [-6, -3], [6, -15], [18, 9]];
const FL3: [number, number][] = [[-26, -16], [-20, -10], [-12, -14], [-4, -3], [3, -16], [9, -12], [14, -3], [20, -15], [-24, 8], [-8, 6], [4, 7], [22, 12]];
const ANCH3 = 6; // índice da ancorada no nível 3

// esquadrões: caminho (x, y) e sala que limpam
type Sq = { path: [number, number][]; room: number; name: string };
const SQ: Sq[] = [
  { path: [[40, 9], [29, 9], [20, 9], [17, 11]], room: 8, name: "ESQ. 1" },
  { path: [[-42, -3], [-31, -3], [-22, -3], [-22, -13]], room: 0, name: "ESQ. 2" },
  { path: [[-42, -3], [-31, -3], [-6, -3], [-6, -13]], room: 1, name: "ESQ. 3" },
  { path: [[40, 9], [29, 9], [24, -3], [8, -3], [8, -13]], room: 2, name: "ESQ. 4" },
];
// postos nas barricadas (corredor)
const POSTS: [number, number][] = [[-17, -2], [-11, -4], [3, -2], [24.5, -3.6]];
const along = (path: [number, number][], t: number): [number, number] => {
  const seg: number[] = [];
  let tot = 0;
  for (let i = 1; i < path.length; i++) {
    const l = Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]);
    seg.push(l);
    tot += l;
  }
  let d = Math.max(0, Math.min(1, t)) * tot;
  for (let i = 0; i < seg.length; i++) {
    if (d <= seg[i]) {
      const k = d / seg[i];
      return [path[i][0] + (path[i + 1][0] - path[i][0]) * k, path[i][1] + (path[i + 1][1] - path[i][1]) * k];
    }
    d -= seg[i];
  }
  return path[path.length - 1];
};

const Unit: React.FC<{ x: number; y: number; dead: number; label?: string; s?: number }> = ({ x, y, dead, label, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {dead < 1 ? (
      <g opacity={1 - dead}>
        <path d="M -12 -9 L 12 -9 L 8 10 L 0 16 L -8 10 Z" fill="#0a1214" stroke={CYAN} strokeWidth={1.8} />
        <circle cx={-4.5} cy={0} r={3.2} fill={CYAN} />
        <circle cx={4.5} cy={0} r={3.2} fill={CYAN} />
      </g>
    ) : null}
    {dead > 0 ? (
      <g opacity={dead} stroke={RED} strokeWidth={3.2}>
        <line x1={-9} y1={-9} x2={9} y2={9} />
        <line x1={9} y1={-9} x2={-9} y2={9} />
      </g>
    ) : null}
    {label && dead < 1 ? (
      <text x={0} y={-16} textAnchor="middle" fill={CYAN} fontFamily={MONO} fontSize={11} letterSpacing={2} opacity={0.8}>
        {label}
      </text>
    ) : null}
  </g>
);

export const HLRAttackReplay: React.FC<Props> = (p) => {
  const f = useCurrentFrame();
  const a = (v?: number) => v ?? 1e9;
  const [deepAt, whichAt, stateAt, replayAt, clearAt, wrongAt, insideAt, barrAt, noPathAt, invAt, massAt] = [p.deepAt, p.whichAt, p.stateAt, p.replayAt, p.clearAt, p.wrongAt, p.insideAt, p.barrAt, p.noPathAt, p.invAt, p.massAt].map(a);
  const life = p.life;
  const replay = f >= replayAt + 14;
  // ---------------- parte 1: os níveis
  const keys: Key[] = [
    [0, 0, -3, 0, -0.55, 0.8, 115],
    [deepAt, 0, -3, -DECK * 0.5, -0.6, 0.52, 150],
    [deepAt + 40, 0, -3, -DECK, -0.66, 0.5, 150],
    [whichAt, 0, -3, -2 * DECK, -0.74, 0.78, 96],
    [stateAt, 0, -3, -2 * DECK, -0.78, 0.84, 92],
    [replayAt, 0, -3, 0, -0.5, 0.95, 110],
    [life, 0, -3, 0, -0.5, 0.95, 110],
  ];
  const cam = camAt(f, keys);
  const deckCam = (k: number): Cam => ({ ...cam, tz: cam.tz + k * DECK });
  const intact: St = { f, build: () => 1, ruin: 0, marks: 0, gear: 1, bodies: 0, lock: 0, holes: 0 };
  const ruined: St = { ...intact, ruin: 1, marks: 1, bodies: 1, lite: true };
  // ---------------- parte 3: o replay
  const rcam: Cam = { tx: 0, ty: -2, tz: 0, yaw: -0.32 + (f - replayAt) * 0.0009, pitch: 1.08, dist: 84 - 8 * P(f, invAt, 40), F: 1150 };
  const go = (k: number) => interpolate(f, [replayAt + 20 + k * 6, clearAt + 26 + k * 4], [0, 1], { ...C, easing: Easing.inOut(Easing.quad) });
  const clearT = (k: number) => clearAt + 18 + k * 8;
  // ordem das baixas: cada soldado tem a sua vez (a partir das criaturas dentro das salas limpas)
  const units: { x: number; y: number; id: string; dieAt: number }[] = [];
  SQ.forEach((sq, k) => {
    const t = go(k);
    for (let u = 0; u < 3; u++) {
      const [x, y] = along(sq.path, t - u * 0.04);
      const ox = (u - 1) * 1.4;
      units.push({ x: x + ox, y: y + (u - 1) * 0.6, id: `OTA-${String(k * 3 + u + 2).padStart(2, "0")}`, dieAt: 0 });
    }
  });
  POSTS.forEach(([x, y], i) => units.push({ x, y, id: `OTA-${String(14 + i).padStart(2, "0")}`, dieAt: 0 }));
  const order = [3, 4, 0, 6, 1, 7, 12, 13, 9, 2, 14, 5, 10, 15, 8, 11];
  const span = Math.max(30, massAt - insideAt - 10);
  order.forEach((ui, n) => {
    if (units[ui]) units[ui].dieAt = insideAt + 10 + (n / order.length) * span;
  });
  const deadK = (u: { dieAt: number }) => (f >= u.dieAt ? Math.min(1, (f - u.dieAt) / 6) : 0);
  const kills = units.filter((u) => f >= u.dieAt).sort((u, v) => u.dieAt - v.dieAt);
  // criaturas no replay
  const flicks: { x: number; y: number; at: number; tag: string }[] = [
    { x: -21, y: -15, at: insideAt, tag: "SALA LIMPA" },
    { x: -5, y: -15.5, at: insideAt + 6, tag: "SALA LIMPA" },
    { x: 18.5, y: 13.5, at: insideAt + 12, tag: "SALA LIMPA" },
    { x: -16.2, y: -1.4, at: barrAt, tag: "ATRÁS DA BARRICADA" },
    { x: 4.2, y: -1.2, at: barrAt + 8, tag: "ATRÁS DA BARRICADA" },
    { x: -9, y: 7, at: noPathAt, tag: "SEM ACESSO" },
    { x: 3, y: 6.5, at: noPathAt + 7, tag: "SEM ACESSO" },
    { x: 22, y: -14, at: noPathAt + 14, tag: "SEM ACESSO" },
  ];
  // relógio da reconstrução
  const clockS = 7 * 60 + Math.max(0, (f - replayAt - 14) / 30) * 14;
  const clock = `02:${String(Math.floor(clockS / 60)).padStart(2, "0")}:${String(Math.floor(clockS % 60)).padStart(2, "0")}`;
  const rew = f >= replayAt && f < replayAt + 18 ? (f - replayAt) / 18 : -1;
  const inv = P(f, invAt, 10);
  const mass = P(f, massAt, 8);
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 55%, #08131a 0%, #020507 78%)", overflow: "hidden" }}>
      {/* ---------------- parte 1: os 3 níveis */}
      {!replay ? (
        <AbsoluteFill style={{ opacity: 1 - P(f, replayAt, 8) }}>
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
            {[2, 1, 0].map((k) => (
              <g key={k} opacity={(k === 0 ? 1 : P(f, deepAt + k * 14, 16)) * Math.max(0.22, 1 - Math.abs(k - -cam.tz / DECK) * 0.8)}>
                <Station c={deckCam(k)} s={k === 0 ? ruined : { ...ruined, lite: true }} />
              </g>
            ))}
            {/* hastes entre níveis */}
            {[[-30, -20], [28, -20], [-30, 18], [28, 18]].map(([x, y], i) => (
              <polyline key={i} points={PP(cam, [[x, y, 0], [x, y, -2 * DECK]])} stroke="rgba(159,230,255,0.18)" strokeDasharray="4 6" fill="none" />
            ))}
            {/* Flickers por nível */}
            {[[[-8, -3]], FL2, FL3].map((list, k) =>
              (list as [number, number][]).map(([x, y], i) => {
                const at = k === 0 ? 10 : deepAt + k * 16 + i * 2;
                if (f < at) return null;
                const q = pr(deckCam(k), x, y, 0.8);
                if (q[2] < 2) return null;
                const hot = (k === 0 && i === 0) || (k === 2 && i === ANCH3);
                return (
                  <g key={`${k}-${i}`}>
                    {hot && f < whichAt ? <circle cx={q[0]} cy={q[1]} r={9} fill={CREAM} /> : <Glitch f={f} x={q[0]} y={q[1]} s={0.32} seed={k * 20 + i} />}
                  </g>
                );
              }),
            )}
            {/* qual delas? a mira pula entre as candidatas */}
            {f >= whichAt && f < replayAt
              ? (() => {
                  const n = Math.floor((f - whichAt) / 5) % FL3.length;
                  const [x, y] = FL3[n];
                  const q = pr(deckCam(2), x, y, 0.8);
                  return (
                    <g>
                      <rect x={q[0] - 28} y={q[1] - 40} width={56} height={70} fill="none" stroke={CREAM} strokeWidth={2.5} strokeDasharray="8 5" />
                      <text x={q[0] + 36} y={q[1] - 26} fill={CREAM} fontFamily={MONO} fontSize={16} letterSpacing={3}>
                        ANCORADA?
                      </text>
                    </g>
                  );
                })()
              : null}
          </svg>
          {/* rótulos dos níveis */}
          <div style={{ position: "absolute", left: 80, top: 160, display: "flex", flexDirection: "column", gap: 26, fontFamily: MONO }}>
            {[
              ["NÍVEL 1", "1"],
              ["NÍVEL 2", "4"],
              ["NÍVEL 3", "12"],
            ].map(([n, c], k) => (
              <div key={n} style={{ opacity: k === 0 ? P(f, 6, 10) : P(f, deepAt + k * 16, 10) }}>
                <div style={{ fontSize: 15, letterSpacing: 5, color: ICE }}>{n}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                  <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 58, color: k === 2 ? MAG : TXT }}>{c}</span>
                  <span style={{ fontSize: 15, letterSpacing: 3, color: "rgba(242,240,247,0.6)" }}>{k === 0 ? "FLICKER" : "FLICKERS"}</span>
                </div>
              </div>
            ))}
          </div>
          {f >= whichAt ? (
            <div style={{ position: "absolute", right: 90, top: 150, textAlign: "right", opacity: P(f, whichAt, 10) * (1 - P(f, stateAt, 10)) }}>
              <div style={{ fontFamily: MONO, fontSize: 16, letterSpacing: 6, color: CREAM }}>NÍVEL 3 · 12 CONTATOS</div>
              <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 64, color: TXT, lineHeight: 1.05 }}>Qual delas é a ancorada?</div>
            </div>
          ) : null}
          {f >= stateAt ? (
            <div style={{ position: "absolute", right: 90, top: 150, textAlign: "right", opacity: P(f, stateAt, 10) }}>
              <div style={{ fontFamily: MONO, fontSize: 16, letterSpacing: 6, color: RED }}>O ESTADO DA ESTAÇÃO</div>
              <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 64, color: TXT, lineHeight: 1.05 }}>começa a fazer sentido</div>
            </div>
          ) : null}
        </AbsoluteFill>
      ) : null}
      {/* ---------------- parte 2: rebobina */}
      {rew >= 0 ? (
        <AbsoluteFill style={{ pointerEvents: "none" }}>
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} style={{ position: "absolute", left: 0, right: 0, top: `${(rnd(i * 3.1 + Math.floor(f / 2)) * 100).toFixed(1)}%`, height: 6 + rnd(i + f) * 26, background: "rgba(220,240,255,0.16)", transform: `translateX(${(rnd(i * 7 + f) - 0.5) * 300}px)` }} />
          ))}
          <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontFamily: MONO, fontSize: 20, letterSpacing: 8, color: CREAM }}>◀◀ REBOBINANDO</div>
            <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 120, color: TXT, letterSpacing: -2 }}>{`02:${String(Math.round(41 - 34 * rew)).padStart(2, "0")}:${String(Math.floor(rnd(f) * 60)).padStart(2, "0")}`}</div>
          </AbsoluteFill>
        </AbsoluteFill>
      ) : null}
      {/* ---------------- parte 3: o replay */}
      {replay ? (
        <AbsoluteFill style={{ opacity: P(f, replayAt + 14, 8) }}>
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: 1 - 0.55 * inv }}>
            <Station c={rcam} s={{ ...intact, marks: P(f, replayAt + 30, 30) }} />
            {/* salas limpas (verde) */}
            {SQ.map((sq, k) => {
              const r = ROOMS[sq.room];
              const c = P(f, clearT(k), 10);
              if (c <= 0) return null;
              const bad = f >= insideAt + k * 6;
              const pts = PP(rcam, [[r.x, r.y, 0.05], [r.x + r.w, r.y, 0.05], [r.x + r.w, r.y + r.h, 0.05], [r.x, r.y + r.h, 0.05]]);
              const q = pr(rcam, r.x + r.w / 2, r.y + r.h / 2, 0.1);
              return (
                <g key={k}>
                  <polygon points={pts} fill={bad ? "rgba(255,61,240,0.14)" : "rgba(141,255,168,0.16)"} stroke={bad ? MAG : GREEN} strokeWidth={2} opacity={c} />
                  <text x={q[0]} y={q[1] + 34} textAnchor="middle" fill={bad ? MAG : GREEN} fontFamily={MONO} fontSize={18} letterSpacing={4} opacity={c}>
                    {bad ? "LIMPA?" : "LIMPA ✓"}
                  </text>
                </g>
              );
            })}
            {/* rastros dos esquadrões */}
            {SQ.map((sq, k) => {
              const t = go(k);
              const pts: [number, number, number][] = [];
              for (let i = 0; i <= 20; i++) {
                const [x, y] = along(sq.path, (i / 20) * t);
                pts.push([x, y, 0.1]);
              }
              return <polyline key={"tr" + k} points={PP(rcam, pts)} fill="none" stroke={CYAN} strokeWidth={2} opacity={0.35} strokeDasharray="6 6" />;
            })}
            {/* criaturas */}
            {flicks.map((fl, i) => {
              if (f < fl.at) return null;
              const q = pr(rcam, fl.x, fl.y, 0.5);
              return (
                <g key={"fl" + i}>
                  <Glitch f={f} x={q[0]} y={q[1]} s={0.42} seed={40 + i} />
                  <text x={q[0] + 18} y={q[1] - 30} fill={MAG} fontFamily={MONO} fontSize={13} letterSpacing={2} opacity={P(f, fl.at + 4, 8) * (1 - P(f, fl.at + 40, 10)) * (1 - inv)}>
                    {fl.tag}
                  </text>
                </g>
              );
            })}
            {/* tiros dos soldados nas criaturas */}
            {units.map((u, i) => {
              if (f < insideAt || f >= u.dieAt || (f + i * 2) % 7 > 1) return null;
              const near = flicks.filter((fl) => f >= fl.at).sort((A, B) => Math.hypot(A.x - u.x, A.y - u.y) - Math.hypot(B.x - u.x, B.y - u.y))[0];
              if (!near) return null;
              const a0 = pr(rcam, u.x, u.y, 0.6);
              const b0 = pr(rcam, near.x + (rnd(f + i) - 0.5) * 2, near.y + (rnd(f + i * 3) - 0.5) * 2, 0.6);
              return <line key={"sh" + i} x1={a0[0]} y1={a0[1]} x2={b0[0]} y2={b0[1]} stroke="#ffe6a0" strokeWidth={1.8} opacity={0.85} />;
            })}
            {/* soldados */}
            {units.map((u, i) => {
              const q = pr(rcam, u.x, u.y, 0.6);
              const vis = i < 12 ? P(f, replayAt + 20 + Math.floor(i / 3) * 6, 6) : P(f, replayAt + 34, 8);
              if (vis <= 0) return null;
              return (
                <g key={"u" + i} opacity={vis}>
                  <Unit x={q[0]} y={q[1]} dead={deadK(u)} label={f < insideAt && i % 3 === 0 ? SQ[Math.floor(i / 3)]?.name : undefined} />
                </g>
              );
            })}
          </svg>
          {/* cabeçalho e relógio */}
          <div style={{ position: "absolute", left: 80, top: 60, fontFamily: MONO, letterSpacing: 6, opacity: 1 - inv }}>
            <div style={{ fontSize: 22, color: f >= wrongAt ? RED : ICE }}>RECONSTRUÇÃO · NOITE DO ATAQUE</div>
            <div style={{ fontSize: 16, color: "rgba(242,240,247,0.65)", marginTop: 6 }}>ALVO DOS COMBINE · DRA. MOSSMAN</div>
          </div>
          <div style={{ position: "absolute", right: 80, top: 52, fontFamily: FONT, fontWeight: 800, fontSize: 56, color: f >= wrongAt ? RED : TXT, opacity: 1 - inv }}>{clock}</div>
          {/* linha do tempo do ataque */}
          <div style={{ position: "absolute", left: 80, right: 80, bottom: 70, height: 60, opacity: 1 - inv }}>
            <div style={{ position: "absolute", left: 0, right: 0, top: 28, height: 2, background: "rgba(242,240,247,0.25)" }} />
            <div style={{ position: "absolute", left: 0, top: 26, height: 6, width: `${Math.min(100, ((f - replayAt - 14) / (massAt - replayAt - 14)) * 100)}%`, background: f >= wrongAt ? RED : CYAN, borderRadius: 3 }} />
            {[
              [clearT(0), "SALAS LIMPAS", GREEN],
              [wrongAt, "ALGO ACONTECE", RED],
              [insideAt, "DENTRO DAS SALAS", MAG],
              [barrAt, "ATRÁS DAS BARRICADAS", MAG],
              [noPathAt, "SEM ACESSO", MAG],
            ].map(([t, l, c], i) => {
              const x = (((t as number) - replayAt - 14) / (massAt - replayAt - 14)) * 100;
              return f >= (t as number) ? (
                <div key={i} style={{ position: "absolute", left: `${x}%`, top: 0, transform: "translateX(-50%)", textAlign: "center", opacity: P(f, t as number, 8) }}>
                  <div style={{ width: 2, height: 18, background: c as string, margin: "0 auto" }} />
                  <div style={{ fontFamily: MONO, fontSize: 12, letterSpacing: 2, color: c as string, marginTop: 20, whiteSpace: "nowrap" }}>{l}</div>
                </div>
              ) : null;
            })}
          </div>
          {/* lista de baixas */}
          {kills.length ? (
            <div style={{ position: "absolute", right: 80, top: 150, width: 300, fontFamily: MONO, opacity: 1 - inv }}>
              <div style={{ fontSize: 14, letterSpacing: 5, color: RED, marginBottom: 8 }}>BAIXAS · {kills.length}</div>
              {kills.slice(-9).map((u) => (
                <div key={u.id} style={{ display: "flex", justifyContent: "space-between", padding: "5px 12px", marginBottom: 4, background: "rgba(40,6,4,0.6)", borderLeft: `3px solid ${RED}`, fontSize: 15, letterSpacing: 2, color: TXT, opacity: P(f, u.dieAt, 6), transform: `translateX(${(1 - P(f, u.dieAt, 8)) * 40}px)` }}>
                  <span>{u.id}</span>
                  <span style={{ color: RED }}>KIA</span>
                </div>
              ))}
            </div>
          ) : null}
          {/* INVASÃO → MASSACRE */}
          {inv > 0 ? (
            <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", transform: mass > 0 && f < massAt + 8 ? `translate(${(rnd(f) - 0.5) * 16}px, ${(rnd(f * 2) - 0.5) * 12}px)` : undefined }}>
              <div style={{ position: "relative", fontFamily: FONT, fontWeight: 800, fontSize: 150, letterSpacing: -4, color: TXT, opacity: inv * (1 - 0.6 * mass), transform: `translateY(${-90 * mass}px) scale(${1 - 0.3 * mass})` }}>
                INVASÃO
                <div style={{ position: "absolute", left: -10, right: -10, top: "52%", height: 10, background: RED, transform: `scaleX(${mass})`, transformOrigin: "left" }} />
              </div>
              {mass > 0 ? <div style={{ position: "absolute", top: 520, fontFamily: FONT, fontWeight: 800, fontSize: 190, letterSpacing: -5, color: RED, opacity: mass, transform: `scale(${1.25 - 0.25 * mass})`, textShadow: "0 0 60px rgba(255,93,77,0.45)" }}>MASSACRE</div> : null}
            </AbsoluteFill>
          ) : null}
        </AbsoluteFill>
      ) : null}
      <AbsoluteFill style={{ background: "#000", opacity: interpolate(f, [life - 8, life], [0, 1], C), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};
