// =================================================================================================
// HL3 · REFORMULAÇÃO · 5A "a Mossman" e "o relato" (06/10/2026)
//  · HLRMossman: a descida no elevador (parallax vertical, vigas com marcas de tiro, subnível −1…−4, equipe) → a
//    escotilha lacrada abre → o bunker dela: paredes de mapas, horários e cálculos (fios vermelhos, monitores rodando,
//    impressora) · VIVA / FERIDA / EXAUSTA / TRANCADA como batidas · ALYX × MOSSMAN: a linha de tensão → arrebenta
//  · HLRReport: o relato como um sismógrafo de papel: a pena desenha o sinal; a janela longa esperada × o pico real de
//    4 s (o navio pisca); o navio some e as marcas dos Flickers continuam no papel
// =================================================================================================
import React, { useMemo } from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { FONT, MONO } from "./overlays";
import { C, HL, rnd } from "./hl3";
import { FilmLook } from "./hl3r";

const RED = "#ff5d4d";
const AMB = "#ffb22e";
const CREAM = "#ffe2b0";
const ICE = "#9fe6ff";
const GREEN = "#8dffa8";
const MAG = "#ff3df0";
const ORANGE = HL.orange;
const TXT = HL.text;
const P = (f: number, at: number, d = 12) => interpolate(f, [at, at + d], [0, 1], { ...C, easing: Easing.out(Easing.cubic) });
const IO = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

// ---------------------------------------------------------------- papéis nas paredes do bunker
type Paper = { x: number; y: number; w: number; h: number; z: number; kind: "map" | "time" | "calc" | "note"; rot: number };
const PAPERS: Paper[] = (() => {
  const out: Paper[] = [];
  const kinds: Paper["kind"][] = ["map", "calc", "time", "note", "calc", "map", "note", "time", "calc"];
  for (let i = 0; i < 34; i++) {
    const z = i < 12 ? 0.55 : i < 24 ? 0.8 : 1.05;
    out.push({ x: -300 + rnd(i * 3.7) * 2500, y: 90 + rnd(i * 5.1) * 760, w: 150 + rnd(i * 2.3) * 160, h: 110 + rnd(i * 4.9) * 140, z, kind: kinds[i % kinds.length], rot: (rnd(i * 1.9) - 0.5) * 8 });
  }
  return out;
})();
const PaperArt: React.FC<{ p: Paper; f: number; i: number; hot?: string }> = ({ p, f, i, hot }) => {
  const ink = "rgba(40,36,30,0.75)";
  return (
    <div style={{ position: "absolute", left: p.x, top: p.y, width: p.w, height: p.h, transform: `rotate(${p.rot}deg)`, background: p.kind === "map" ? "#d9d2bd" : "#e8e2d2", boxShadow: hot ? `0 0 0 4px ${hot}, 0 10px 30px rgba(0,0,0,0.6)` : "0 10px 30px rgba(0,0,0,0.6)", overflow: "hidden" }}>
      <svg width={p.w} height={p.h} style={{ position: "absolute", inset: 0 }}>
        {p.kind === "map" ? (
          <g>
            {Array.from({ length: 6 }).map((_, k) => (
              <path key={k} d={`M 0 ${p.h * (0.15 + k * 0.14)} Q ${p.w * 0.3} ${p.h * (0.1 + k * 0.15) + 14 * Math.sin(i + k)} ${p.w * 0.6} ${p.h * (0.18 + k * 0.13)} T ${p.w} ${p.h * (0.12 + k * 0.15)}`} fill="none" stroke="rgba(60,90,110,0.55)" strokeWidth={1.2} />
            ))}
            <circle cx={p.w * (0.3 + rnd(i) * 0.4)} cy={p.h * (0.3 + rnd(i * 2) * 0.4)} r={7} fill="none" stroke="#b3261e" strokeWidth={2.4} />
            <line x1={0} y1={p.h * 0.5} x2={p.w} y2={p.h * 0.5} stroke="rgba(40,36,30,0.25)" />
            <line x1={p.w * 0.5} y1={0} x2={p.w * 0.5} y2={p.h} stroke="rgba(40,36,30,0.25)" />
          </g>
        ) : p.kind === "time" ? (
          <g>
            {Array.from({ length: 7 }).map((_, k) => (
              <g key={k}>
                <line x1={8} x2={p.w - 8} y1={18 + k * ((p.h - 24) / 7)} y2={18 + k * ((p.h - 24) / 7)} stroke="rgba(40,36,30,0.3)" />
                <text x={10} y={14 + k * ((p.h - 24) / 7)} fontFamily={MONO} fontSize={10} fill={ink}>{`${String(2 + k).padStart(2, "0")}:${String((k * 17) % 60).padStart(2, "0")}`}</text>
                <rect x={60} y={8 + k * ((p.h - 24) / 7)} width={(p.w - 80) * rnd(i * 7 + k)} height={6} fill={k === 3 ? "#b3261e" : "rgba(60,90,110,0.5)"} />
              </g>
            ))}
          </g>
        ) : p.kind === "calc" ? (
          <g>
            {Array.from({ length: 8 }).map((_, k) => (
              <text key={k} x={8} y={18 + k * ((p.h - 10) / 8)} fontFamily={MONO} fontSize={11} fill={ink}>
                {["Δt = 4,1 s", "f(t) ≠ f(t−τ)", "τ ≈ 0,38", "ψ = 2π·t/T", "Σ eco = 12", "T₀ + 14 min?", "λ → 0", "x(t+τ) = x(t)"][(k + i) % 8]}
              </text>
            ))}
          </g>
        ) : (
          <g>
            {Array.from({ length: 6 }).map((_, k) => (
              <line key={k} x1={10} x2={10 + (p.w - 30) * (0.5 + rnd(i * 3 + k) * 0.5)} y1={20 + k * 16} y2={20 + k * 16} stroke={ink} strokeWidth={1.4} />
            ))}
          </g>
        )}
      </svg>
      {/* alfinete */}
      <div style={{ position: "absolute", left: p.w / 2 - 6, top: 6, width: 12, height: 12, borderRadius: 6, background: "#b3261e", boxShadow: "0 2px 4px rgba(0,0,0,0.6)" }} />
      {void f}
    </div>
  );
};

type MP = { life: number; partyAt?: number; underAt?: number; foundAt?: number; nameAt?: number; aliveAt?: number; hurtAt?: number; tiredAt?: number; lockAt?: number; mapsAt?: number; hoursAt?: number; calcAt?: number; stillAt?: number; tenseAt?: number; argueAt?: number; explainAt?: number };
export const HLRMossman: React.FC<MP> = (p) => {
  const f = useCurrentFrame();
  const a = (v?: number) => v ?? 1e9;
  const [partyAt, underAt, foundAt, nameAt, aliveAt, hurtAt, tiredAt, lockAt, mapsAt, hoursAt, calcAt, stillAt, tenseAt, argueAt, explainAt] = [p.partyAt, p.underAt, p.foundAt, p.nameAt, p.aliveAt, p.hurtAt, p.tiredAt, p.lockAt, p.mapsAt, p.hoursAt, p.calcAt, p.stillAt, p.tenseAt, p.argueAt, p.explainAt].map(a);
  const life = p.life;
  // ---------------- a descida
  const stopAt = underAt + 30;
  const speed = interpolate(f, [0, 12, underAt, stopAt], [0, 1, 1, 0], C);
  // distância percorrida (integral da velocidade, aproximada)
  const dist = useMemo(() => {
    const out: number[] = [0];
    for (let k = 1; k <= 2000; k++) out.push(out[k - 1] + interpolate(k, [0, 12, underAt, stopAt], [0, 1, 1, 0], C) * 26);
    return out;
  }, [underAt, stopAt]);
  const Y = dist[Math.min(2000, Math.max(0, f))];
  const level = Math.min(4, 1 + Math.floor(Y / 1000));
  const jolt = f >= stopAt && f < stopAt + 10 ? Math.sin((f - stopAt) * 2.2) * (1 - (f - stopAt) / 10) * 14 : 0;
  const door = P(f, Math.min(foundAt - 40, underAt + 34), 10); // a escotilha aparece quando o elevador para
  const wheel = IO((f - foundAt + 8) / 16);
  const open = IO((f - foundAt + 2) / 14);
  const inside = f >= foundAt + 12;
  // ---------------- o bunker
  const t = f - (foundAt + 12);
  const camX = -t * 1.1;
  const dim = P(f, tenseAt - 10, 20);
  const tense = P(f, tenseAt, 16);
  const snap = P(f, explainAt, 8);
  const hl = (k: Paper["kind"]) => (k === "map" && f >= mapsAt && f < stillAt + 20 ? AMB : k === "time" && f >= hoursAt && f < stillAt + 20 ? ICE : k === "calc" && f >= calcAt && f < stillAt + 20 ? GREEN : undefined);
  // números que continuam rodando
  const run = Math.floor(2214 + Math.max(0, f - calcAt) * 3.7);
  return (
    <AbsoluteFill style={{ background: "#030405", overflow: "hidden" }}>
      {!inside ? (
        <AbsoluteFill style={{ transform: `translateY(${jolt}px)` }}>
          {/* poço: parede do fundo (lenta), vigas (rápidas) */}
          <AbsoluteFill style={{ background: "linear-gradient(90deg, #07090b 0%, #10151a 30%, #10151a 70%, #07090b 100%)" }} />
          {Array.from({ length: 30 }).map((_, i) => {
            const y = ((i * 220 - Y * 0.35) % 6600 + 6600) % 6600 - 600;
            return <div key={"w" + i} style={{ position: "absolute", left: 360, right: 360, top: y, height: 3, background: "rgba(159,230,255,0.06)" }} />;
          })}
          {/* cabos do elevador */}
          {[880, 1040].map((x) => (
            <div key={x} style={{ position: "absolute", left: x, top: 0, width: 3, height: 1080, background: "repeating-linear-gradient(180deg, #2a3138 0 8px, #12171b 8px 16px)", backgroundPositionY: `${Y * 1.0}px` }} />
          ))}
          {/* vigas com marcas da batalha */}
          {Array.from({ length: 14 }).map((_, i) => {
            const y = ((i * 520 - Y) % 7280 + 7280) % 7280 - 700;
            const side = i % 2;
            return (
              <div key={"b" + i} style={{ position: "absolute", left: side ? 1200 : 0, width: 720, top: y, height: 70, background: "linear-gradient(180deg, #2b343b, #161b1f)", borderTop: "2px solid #3d4850" }}>
                {Array.from({ length: 4 }).map((_, k) => (
                  <div key={k} style={{ position: "absolute", left: 80 + k * 150 + rnd(i * 4 + k) * 40, top: 22 + rnd(i + k) * 20, width: 12, height: 12, borderRadius: 6, background: "#050505", boxShadow: "0 0 0 3px rgba(150,150,140,0.25)" }} />
                ))}
                {rnd(i * 7.7) > 0.5 ? <div style={{ position: "absolute", left: 240, top: 10, width: 260, height: 50, background: "radial-gradient(ellipse, rgba(0,0,0,0.6), rgba(0,0,0,0))" }} /> : null}
              </div>
            );
          })}
          {/* placas de subnível passando */}
          {[1, 2, 3, 4].map((n) => {
            const y = n * 1000 - Y + 420;
            if (y < -200 || y > 1300) return null;
            return (
              <div key={n} style={{ position: "absolute", left: 420, top: y, opacity: 1 - door, padding: "8px 20px", border: "3px solid #c9a23a", color: "#c9a23a", fontFamily: MONO, fontSize: 38, letterSpacing: 6 }}>
                SUBNÍVEL −{n}
              </div>
            );
          })}
          {/* luz giratória vermelha */}
          <AbsoluteFill style={{ background: `radial-gradient(ellipse at ${50 + 40 * Math.sin(f / 7)}% 10%, rgba(255,60,40,0.16) 0%, rgba(0,0,0,0) 45%)` }} />
          {/* a cabine (grade em primeiro plano) */}
          <AbsoluteFill style={{ background: "repeating-linear-gradient(90deg, rgba(0,0,0,0) 0 118px, rgba(10,12,14,0.85) 118px 130px)", opacity: 0.55 }} />
          {/* profundidade */}
          <div style={{ position: "absolute", right: 90, top: 380, textAlign: "right", fontFamily: MONO, color: AMB }}>
            <div style={{ fontSize: 16, letterSpacing: 6 }}>PROFUNDIDADE</div>
            <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 150, lineHeight: 1 }}>−{level}</div>
            <div style={{ fontSize: 18, letterSpacing: 4 }}>{f >= stopAt ? "PARADO" : "DESCENDO"}</div>
          </div>
          {/* a equipe */}
          <div style={{ position: "absolute", left: 90, top: 380, display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              ["GORDON", AMB, 0],
              ["ALYX", ORANGE, 0.4],
              ["VORTIGAUNT", GREEN, 0.9],
              ["VORTIGAUNT", GREEN, 1.1],
            ].map(([n, c, d], i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 16px", background: "rgba(6,8,10,0.8)", borderLeft: `4px solid ${c}`, fontFamily: MONO, fontSize: 22, letterSpacing: 4, color: TXT, opacity: P(f, partyAt + (d as number) * 30, 8), transform: `translateX(${(1 - P(f, partyAt + (d as number) * 30, 10)) * -40}px)` }}>
                <span style={{ width: 10, height: 10, borderRadius: 5, background: c as string }} />
                {n}
              </div>
            ))}
          </div>
          {/* a escotilha lacrada */}
          {door > 0 ? (
            <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: door }}>
              <div style={{ position: "relative", width: 640, height: 640, transform: `scale(${1 + open * 2.6})`, opacity: 1 - open * 0.9 }}>
                <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "radial-gradient(circle, #3a454d 0%, #20272d 60%, #11161a 100%)", boxShadow: "0 0 0 18px #0b0e11, 0 0 80px rgba(0,0,0,0.9)" }} />
                {Array.from({ length: 16 }).map((_, k) => (
                  <div key={k} style={{ position: "absolute", left: 320 - 9 + Math.cos((k / 16) * Math.PI * 2) * 290, top: 320 - 9 + Math.sin((k / 16) * Math.PI * 2) * 290, width: 18, height: 18, borderRadius: 9, background: "#55606a" }} />
                ))}
                <svg width={640} height={640} style={{ position: "absolute", inset: 0, transform: `rotate(${wheel * 270}deg)` }}>
                  <circle cx={320} cy={320} r={130} fill="none" stroke="#8a949c" strokeWidth={18} />
                  {[0, 1, 2, 3].map((k) => (
                    <line key={k} x1={320} y1={320} x2={320 + Math.cos((k * Math.PI) / 2) * 130} y2={320 + Math.sin((k * Math.PI) / 2) * 130} stroke="#8a949c" strokeWidth={16} />
                  ))}
                  <circle cx={320} cy={320} r={34} fill="#6d777f" />
                </svg>
                <div style={{ position: "absolute", left: 0, right: 0, top: 560, textAlign: "center", fontFamily: MONO, fontSize: 22, letterSpacing: 6, color: RED, opacity: 1 - wheel }}>LACRADA POR DENTRO</div>
              </div>
              <AbsoluteFill style={{ background: "#fff", opacity: open > 0.6 ? (open - 0.6) * 2 : 0 }} />
            </AbsoluteFill>
          ) : null}
        </AbsoluteFill>
      ) : (
        <AbsoluteFill>
          {/* o bunker: papéis em três profundidades (parallax) */}
          <AbsoluteFill style={{ background: "radial-gradient(ellipse at 40% 45%, #2a2418 0%, #120f0a 55%, #060504 100%)", opacity: 1 - dim * 0.6 }}>
            {PAPERS.map((pp, i) => (
              <div key={i} style={{ position: "absolute", inset: 0, transform: `translateX(${camX * pp.z}px) scale(${0.85 + pp.z * 0.2})`, filter: pp.z < 0.7 ? "blur(1.5px) brightness(0.6)" : pp.z > 1 ? "brightness(1.05)" : "brightness(0.85)" }}>
                <PaperArt p={pp} f={f} i={i} hot={hl(pp.kind)} />
              </div>
            ))}
            {/* fios vermelhos entre os papéis do meio */}
            <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, transform: `translateX(${camX * 0.8}px)` }}>
              {PAPERS.filter((pp) => pp.z === 0.8).map((pp, i, arr) => {
                const q = arr[(i + 3) % arr.length];
                return <line key={i} x1={pp.x + pp.w / 2} y1={pp.y + 12} x2={q.x + q.w / 2} y2={q.y + 12} stroke="#b3261e" strokeWidth={1.6} opacity={0.75} />;
              })}
            </svg>
            {/* luz da luminária */}
            <AbsoluteFill style={{ background: "radial-gradient(ellipse at 38% 30%, rgba(255,220,160,0.18) 0%, rgba(0,0,0,0) 50%)" }} />
          </AbsoluteFill>
          {/* monitores com cálculos rodando */}
          <div style={{ position: "absolute", right: 120, top: 120, width: 520, padding: "18px 22px", background: "rgba(4,14,8,0.92)", border: "1px solid rgba(141,255,168,0.5)", borderRadius: 10, fontFamily: MONO, color: GREEN, opacity: P(f, calcAt - 6, 10) * (1 - dim * 0.7) }}>
            <div style={{ fontSize: 14, letterSpacing: 5, opacity: 0.8 }}>CÁLCULO EM EXECUÇÃO</div>
            <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 64 }}>#{run.toLocaleString("pt-BR")}</div>
            {Array.from({ length: 5 }).map((_, k) => (
              <div key={k} style={{ fontSize: 15, letterSpacing: 2, opacity: 0.5 + 0.1 * k }}>{`τ=${(0.38 + rnd(Math.floor(f / 4) + k) * 0.02).toFixed(4)}  Δ=${(rnd(Math.floor(f / 3) * 2 + k) * 9).toFixed(3)}  eco=${12 + k}`}</div>
            ))}
            {f >= stillAt ? <div style={{ marginTop: 8, fontSize: 14, letterSpacing: 4, color: CREAM }}>NÃO PAROU DEPOIS DO ATAQUE</div> : null}
          </div>
          {/* sombra atrás do nome */}
          <AbsoluteFill style={{ background: "linear-gradient(0deg, rgba(4,3,2,0.92) 0%, rgba(4,3,2,0.6) 26%, rgba(0,0,0,0) 46%)", opacity: 1 - dim, pointerEvents: "none" }} />
          {/* o nome */}
          <div style={{ position: "absolute", left: 90, bottom: 150, opacity: P(f, nameAt, 10) * (1 - dim), transform: `translateY(${(1 - P(f, nameAt, 12)) * 30}px)` }}>
            <div style={{ fontFamily: MONO, fontSize: 18, letterSpacing: 6, color: ICE }}>ENCONTRADA · SUBNÍVEL −4</div>
            <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 110, letterSpacing: -3, color: TXT, lineHeight: 1 }}>Judith Mossman</div>
          </div>
          {/* as quatro batidas */}
          <div style={{ position: "absolute", left: 90, bottom: 60, display: "flex", gap: 16, opacity: 1 - dim }}>
            {[
              ["VIVA", GREEN, aliveAt],
              ["FERIDA", RED, hurtAt],
              ["EXAUSTA", AMB, tiredAt],
              ["TRANCADA", CREAM, lockAt],
            ].map(([l, c, at]) => (
              <div key={l as string} style={{ padding: "8px 18px", border: `2px solid ${c}`, borderRadius: 8, fontFamily: MONO, fontSize: 22, letterSpacing: 5, color: c as string, background: "rgba(6,6,6,0.75)", opacity: P(f, at as number, 6), transform: `scale(${1.3 - 0.3 * P(f, at as number, 8)})` }}>
                {l}
              </div>
            ))}
          </div>
          {/* VIVA: a linha do batimento atravessa a tela */}
          {f >= aliveAt && f < hurtAt + 20 ? (
            <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: 1 - P(f, hurtAt + 8, 12) }}>
              <polyline
                points={Array.from({ length: 97 })
                  .map((_, k) => {
                    const x = k * 20;
                    const ph = (k + 6) % 24;
                    const y = 560 + (ph === 10 ? -140 : ph === 11 ? 120 : ph === 12 ? -40 : 0);
                    return `${x},${y}`;
                  })
                  .join(" ")}
                fill="none"
                stroke={GREEN}
                strokeWidth={4}
                strokeDasharray={`${2400 * P(f, aliveAt, 14)} 2400`}
                style={{ filter: "drop-shadow(0 0 8px #8dffa8)" }}
              />
            </svg>
          ) : null}
          {/* FERIDA: pulso vermelho */}
          {f >= hurtAt && f < tiredAt + 10 ? <AbsoluteFill style={{ background: "radial-gradient(ellipse at 0% 60%, rgba(255,40,30,0.35) 0%, rgba(0,0,0,0) 55%)", opacity: 0.5 + 0.5 * Math.sin((f - hurtAt) / 3) }} /> : null}
          {/* EXAUSTA: bateria acabando */}
          {f >= tiredAt && f < lockAt + 14 ? (
            <div style={{ position: "absolute", left: 860, top: 430, width: 220, height: 90, border: `4px solid ${AMB}`, borderRadius: 10, opacity: 1 - P(f, lockAt + 4, 10) }}>
              <div style={{ position: "absolute", right: -18, top: 28, width: 14, height: 34, background: AMB, borderRadius: 3 }} />
              <div style={{ position: "absolute", left: 8, top: 8, bottom: 8, width: `${Math.max(6, 92 - 86 * P(f, tiredAt, 18))}%`, background: AMB, borderRadius: 4 }} />
            </div>
          ) : null}
          {/* TRANCADA: só a etiqueta (as grades laterais fechando saíram a pedido dele, 08/10: não faziam sentido) */}
          {/* rótulos: mapas / horários / cálculos */}
          {[
            ["MAPAS", AMB, mapsAt],
            ["HORÁRIOS", ICE, hoursAt],
            ["CÁLCULOS", GREEN, calcAt],
          ].map(([l, c, at], k) => (f >= (at as number) && f < tenseAt ? (
            <div key={l as string} style={{ position: "absolute", left: 90, top: 80 + k * 78, fontFamily: FONT, fontWeight: 800, fontSize: 64, color: c as string, opacity: P(f, at as number, 8) * (1 - dim), textShadow: "0 6px 30px rgba(0,0,0,0.8)" }}>
              {l}
            </div>
          ) : null))}
          {/* ALYX × MOSSMAN */}
          {tense > 0 ? (
            <AbsoluteFill>
              <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
                {snap < 1
                  ? (() => {
                      const amp = 8 + 30 * tense + 60 * P(f, argueAt, 20);
                      const pts = Array.from({ length: 41 }).map((_, k) => {
                        const x = 640 + (k / 40) * 640;
                        const y = 540 + (k === 0 || k === 40 ? 0 : (rnd(k * 3.3 + Math.floor(f / 2)) - 0.5) * amp);
                        return `${x},${y}`;
                      });
                      return <polyline points={pts.join(" ")} fill="none" stroke={RED} strokeWidth={3} opacity={1 - snap} style={{ filter: "drop-shadow(0 0 10px #ff5d4d)" }} />;
                    })()
                  : null}
                {snap > 0
                  ? [0, 1].map((k) => (
                      <line key={k} x1={k ? 1280 : 640} y1={540} x2={k ? 1280 - 200 * (1 - snap * 0.6) : 640 + 200 * (1 - snap * 0.6)} y2={540 + 160 * snap} stroke={RED} strokeWidth={3} opacity={1 - snap} />
                    ))
                  : null}
              </svg>
              {[
                ["ALYX VANCE", ORANGE, 380, "PERDEU O PAI"],
                ["JUDITH MOSSMAN", ICE, 1540, "NOVA PROSPEKT · A TRAIÇÃO"],
              ].map(([n, c, x, s]) => (
                <div key={n as string} style={{ position: "absolute", left: (x as number) - 260, width: 520, top: 470, textAlign: "center", opacity: tense }}>
                  <div style={{ width: 22, height: 22, borderRadius: 11, background: c as string, margin: "0 auto 14px", boxShadow: `0 0 30px ${c}` }} />
                  <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 58, color: TXT, lineHeight: 1 }}>{n}</div>
                  <div style={{ fontFamily: MONO, fontSize: 16, letterSpacing: 4, color: c as string, marginTop: 10, opacity: P(f, tenseAt + 14, 10) }}>{s}</div>
                </div>
              ))}
              <div style={{ position: "absolute", left: 0, right: 0, top: 640, textAlign: "center", fontFamily: MONO, fontSize: 22, letterSpacing: 8, color: snap > 0 ? CREAM : RED, opacity: P(f, tenseAt + 6, 10) }}>{snap > 0 ? "ANTES DA DISCUSSÃO: O RELATO" : "REENCONTRO · TENSO"}</div>
            </AbsoluteFill>
          ) : null}
          <AbsoluteFill style={{ background: "#fff", opacity: f < foundAt + 20 ? 1 - (f - foundAt - 12) / 8 : 0, pointerEvents: "none" }} />
        </AbsoluteFill>
      )}
      <AbsoluteFill style={{ background: "#000", opacity: interpolate(f, [life - 6, life], [0, 1], C), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- o relato: sismógrafo de papel
const shipPath = "M -150 24 L 120 24 L 150 -4 L 96 -4 L 84 -30 L 30 -30 L 22 -58 L 6 -58 L 6 -30 L -40 -30 L -48 -46 L -70 -46 L -76 -4 L -150 -4 Z";
type RP = { life: number; txAt?: number; shipAt?: number; longAt?: number; secsAt?: number; goneAt?: number; stayAt?: number };
export const HLRReport: React.FC<RP> = (p) => {
  const f = useCurrentFrame();
  const a = (v?: number) => v ?? 1e9;
  const [txAt, shipAt, longAt, secsAt, goneAt, stayAt] = [p.txAt, p.shipAt, p.longAt, p.secsAt, p.goneAt, p.stayAt].map(a);
  const life = p.life;
  // papel corre da direita para a esquerda; a pena fica em x = 1400
  const PEN = 1400;
  const pxPerF = 9;
  const sig = (q: number) => {
    // q = quadro em que o ponto foi desenhado
    const base = Math.sin(q * 0.9) * 6 + (rnd(q * 1.7) - 0.5) * 10;
    const tx = q >= txAt && q < txAt + 10 ? Math.sin((q - txAt) * 1.4) * 70 : 0;
    const ship = q >= shipAt && q < shipAt + 4 * 30 ? -260 * Math.min(1, (q - shipAt) / 4) * Math.min(1, (shipAt + 120 - q) / 6) + (rnd(q) - 0.5) * 60 : 0;
    const fl = q >= goneAt ? (rnd(Math.floor(q / 3) * 5.1) > 0.82 ? -90 * rnd(q) : 0) : 0;
    return base + tx + ship + fl;
  };
  const pts: string[] = [];
  for (let q = Math.max(0, f - 170); q <= f; q++) {
    const x = PEN - (f - q) * pxPerF;
    pts.push(`${x.toFixed(1)},${(620 + sig(q)).toFixed(1)}`);
  }
  const xOf = (q: number) => PEN - (f - q) * pxPerF;
  const long = P(f, longAt, 14);
  const secs = P(f, secsAt, 10);
  const shipOn = f >= shipAt && f < goneAt;
  const shipVis = shipOn ? (f < shipAt + 6 ? (f - shipAt) / 6 : rnd(Math.floor(f / 2) * 3.3) > 0.2 ? 1 : 0.35) : f >= goneAt && f < goneAt + 6 ? 1 - (f - goneAt) / 6 : 0;
  return (
    <AbsoluteFill style={{ background: "#0b0907", overflow: "hidden" }}>
      {/* o papel */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 300, height: 640, background: "#e9e2cf", boxShadow: "0 0 80px rgba(0,0,0,0.8)" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(150,70,60,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(150,70,60,0.18) 1px, transparent 1px)", backgroundSize: "60px 60px", backgroundPosition: `${(-f * pxPerF) % 60}px 0` }} />
      </div>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {/* a janela longa esperada (sombreada) */}
        {f >= longAt
          ? (() => {
              const x0 = xOf(shipAt);
              return (
                <g opacity={long}>
                  <rect x={x0} y={330} width={3000} height={580} fill="rgba(60,110,140,0.16)" stroke="rgba(60,110,140,0.6)" strokeWidth={2} strokeDasharray="10 8" />
                  <text x={Math.max(60, x0 + 20)} y={372} fontFamily={MONO} fontSize={20} letterSpacing={4} fill="#2e5d75">
                    JANELA ESPERADA · ~14 MIN →
                  </text>
                </g>
              );
            })()
          : null}
        {/* o pico real: 4 s */}
        {f >= secsAt
          ? (() => {
              const x0 = xOf(shipAt);
              const x1 = xOf(shipAt + 120);
              return (
                <g opacity={secs}>
                  <rect x={x0} y={330} width={Math.max(4, x1 - x0)} height={580} fill="rgba(179,38,30,0.14)" stroke="#b3261e" strokeWidth={3} />
                  <text x={x0 + 10} y={900} fontFamily={MONO} fontSize={22} letterSpacing={4} fill="#b3261e">
                    REAL · 4 S
                  </text>
                </g>
              );
            })()
          : null}
        {/* a tinta */}
        <polyline points={pts.join(" ")} fill="none" stroke="#1d1a17" strokeWidth={3} strokeLinejoin="round" />
        {/* marcas dos Flickers que ficaram */}
        {f >= goneAt
          ? Array.from({ length: 12 }).map((_, k) => {
              const q = goneAt + k * 7;
              if (q > f) return null;
              const x = xOf(q);
              return (
                <g key={k}>
                  <line x1={x} x2={x} y1={560} y2={680} stroke={MAG} strokeWidth={2} opacity={0.8} />
                  <circle cx={x} cy={560} r={5} fill={MAG} />
                </g>
              );
            })
          : null}
        {/* a pena */}
        <line x1={PEN} y1={160} x2={PEN} y2={620 + sig(f)} stroke="#6a6258" strokeWidth={4} />
        <circle cx={PEN} cy={620 + sig(f)} r={8} fill="#1d1a17" />
        {/* marca da transmissão */}
        {f >= txAt ? (
          <g opacity={P(f, txAt, 8)}>
            <line x1={xOf(txAt)} x2={xOf(txAt)} y1={330} y2={910} stroke="#2e5d75" strokeWidth={2} />
            <text x={xOf(txAt) + 8} y={930} fontFamily={MONO} fontSize={18} letterSpacing={3} fill={CREAM}>
              TRANSMISSÃO
            </text>
          </g>
        ) : null}
      </svg>
      {/* o navio aparece por cima do pico */}
      {shipVis > 0 ? (
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          <g transform={`translate(${Math.max(320, Math.min(1500, xOf(shipAt + 40)))} 200) scale(1.6)`} opacity={shipVis}>
            <path d={shipPath} fill="rgba(159,230,255,0.12)" stroke={ICE} strokeWidth={2.2} />
          </g>
          <text x={Math.max(320, Math.min(1500, xOf(shipAt + 40)))} y={280} textAnchor="middle" fontFamily={MONO} fontSize={20} letterSpacing={5} fill={ICE} opacity={shipVis}>
            BOREALIS
          </text>
        </svg>
      ) : null}
      {/* cabeçalho */}
      <div style={{ position: "absolute", left: 80, top: 60, fontFamily: MONO, letterSpacing: 6 }}>
        <div style={{ fontSize: 22, color: CREAM }}>REGISTRO DA MOSSMAN · NOITE DO ATAQUE</div>
        <div style={{ fontSize: 16, color: "rgba(242,240,247,0.6)", marginTop: 6 }}>SENSOR DE CAMPO · 310 M</div>
      </div>
      {f >= stayAt ? (
        <div style={{ position: "absolute", right: 90, top: 60, textAlign: "right", opacity: P(f, stayAt, 10) }}>
          <div style={{ fontFamily: MONO, fontSize: 16, letterSpacing: 6, color: MAG }}>O NAVIO FOI EMBORA</div>
          <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 72, color: TXT, lineHeight: 1 }}>os Flickers ficaram</div>
        </div>
      ) : f >= secsAt ? (
        <div style={{ position: "absolute", right: 90, top: 60, textAlign: "right", opacity: secs }}>
          <div style={{ fontFamily: MONO, fontSize: 16, letterSpacing: 6, color: "#ff8d80" }}>NÃO FOI A JANELA LONGA</div>
          <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 72, color: TXT, lineHeight: 1 }}>só alguns segundos</div>
        </div>
      ) : null}
      <AbsoluteFill style={{ background: "#000", opacity: interpolate(f, [0, 8], [1, 0], C) + interpolate(f, [life - 6, life], [0, 1], C), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};
