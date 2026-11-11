// 05/11 (pedido dele: "aqui não precisa ser a TV, faz meio que um rádio"): as despedidas pelo rádio na neve.
// O Ártico (os mesmos planos 3D) vira o fundo, escuro e frio; em primeiro plano o rádio da Resistência, grande, com o
// visor mostrando quem fala (retrato, nome, canal) e a onda da voz; a frase entra ao lado. No fim o rádio fica mudo:
// a luz apaga, o visor vira chiado e "SEM SINAL".
import React from "react";
import { AbsoluteFill, Easing, Img, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Clip } from "./hl3";
import { FONT, MONO } from "./overlays";

const C = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const P = (f: number, a: number, d = 12) => interpolate(f, [a, a + d], [0, 1], { ...C, easing: Easing.out(Easing.cubic) });
const rnd = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

type Shot = { src: string; from: number; at: number; dur: number; fx?: string; xf?: number };
type Card = { at: number; outAt: number; img: string; name: string; sub?: string; sub2?: string; sub2At?: number; col?: string; quote?: string; quoteAt?: number; quoteOutAt?: number };
type Stamp = { at: number; outAt: number; text: string; sub?: string; col?: string };

const SNOW = Array.from({ length: 140 }).map((_, i) => ({ x: rnd(i) * 1920, y0: rnd(i + 9) * 1080, v: 0.6 + rnd(i + 3) * 1.6, r: 1 + rnd(i + 5) * 2.6, w: rnd(i + 7) * 6.28 }));

export const HL14Radio: React.FC<{ life: number; shots: Shot[]; cards?: Card[]; stamps?: Stamp[]; muteAt?: number; feed?: string; sector?: string; glitch?: unknown; tags?: unknown }> = ({ life, shots, cards = [], stamps = [], muteAt }) => {
  const f = useCurrentFrame();
  // quem está no rádio agora
  const cur = [...cards].reverse().find((c) => f >= c.at) ?? null;
  const live = cur && f < cur.outAt ? cur : null;
  const mute = muteAt ?? (cards.length ? cards[cards.length - 1].sub2At ?? 1e9 : 1e9);
  const dead = f >= mute;
  const talking = !!live && !dead && f >= (live.quoteAt ?? live.at) && f < (live.quoteOutAt ?? live.outAt);
  const col = dead ? "#ff5a4a" : live?.col ?? "#9fe6ff";
  const inK = P(f, 0, 18);
  const fadeOut = interpolate(f, [life - 10, life], [0, 1], C);
  // a voz: amplitude que oscila enquanto alguém fala
  const amp = talking ? 0.55 + 0.45 * Math.abs(Math.sin(f / 3.1) * Math.sin(f / 7.3 + 1)) : dead ? 0 : 0.06;
  // o rádio: posição e leve balanço da mão
  const RX = 250, RY = 120;
  const sway = Math.sin(f / 45) * 4;
  return (
    <AbsoluteFill style={{ background: "#020407", overflow: "hidden" }}>
      {/* o Ártico ao fundo, escuro, frio e um pouco desfocado */}
      <AbsoluteFill style={{ filter: "blur(2px) brightness(0.8) saturate(0.85)", transform: `scale(${1.08 + 0.04 * (f / Math.max(1, life))})` }}>
        {shots.map((s, i) => {
          const nx = shots[i + 1];
          const hold = nx ? Math.max(16, (nx.xf ?? 0) + 4) : 0;
          return (
            <Sequence key={i} from={s.at} durationInFrames={Math.max(1, (i === shots.length - 1 ? Math.max(s.dur, life - s.at) : s.dur) + hold)} premountFor={30}>
              <AbsoluteFill style={{ opacity: s.fx === "fade" ? interpolate(f - s.at, [0, s.xf ?? 14], [0, 1], C) : 1 }}>
                <Clip src={s.src} from={s.from} style={{ objectFit: "cover" }} />
              </AbsoluteFill>
            </Sequence>
          );
        })}
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "linear-gradient(90deg, rgba(2,4,8,0.7) 0%, rgba(2,4,8,0.15) 45%, rgba(2,4,8,0.55) 100%)" }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 80% 75% at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.75) 100%)" }} />
      {/* neve caindo na frente */}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {SNOW.map((s, i) => {
          const y = (s.y0 + f * s.v * 2.2) % 1120 - 20;
          return <circle key={i} cx={s.x + Math.sin(f / 30 + s.w) * 18} cy={y} r={s.r} fill="#e8f4ff" opacity={0.35 + 0.4 * (s.r / 3.6)} />;
        })}
      </svg>
      {/* o rádio da Resistência */}
      <div style={{ position: "absolute", left: RX, top: RY + (1 - inK) * 120, width: 520, height: 880, opacity: inK, transform: `rotate(${-4 + sway * 0.2}deg)`, transformOrigin: "50% 100%" }}>
        <svg width={520} height={880} viewBox="0 0 520 880" style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          <defs>
            <linearGradient id="rdBody" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#1b1f1d" />
              <stop offset="0.5" stopColor="#2f3531" />
              <stop offset="1" stopColor="#161a18" />
            </linearGradient>
            <linearGradient id="rdTop" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#3a413c" />
              <stop offset="1" stopColor="#222724" />
            </linearGradient>
          </defs>
          {/* antena */}
          <rect x={360} y={-60} width={34} height={210} rx={14} fill="#111413" stroke="#2a302c" strokeWidth={3} />
          <rect x={366} y={-50} width={22} height={40} rx={8} fill="#1d2220" />
          {/* botões em cima */}
          <rect x={110} y={110} width={70} height={46} rx={10} fill="#2a2f2c" stroke="#3d4540" strokeWidth={3} />
          <rect x={210} y={118} width={44} height={38} rx={8} fill="#2a2f2c" stroke="#3d4540" strokeWidth={3} />
          <circle cx={290} cy={136} r={11} fill={dead ? "#2a0d0a" : talking ? "#ff4030" : "#4a1410"} style={{ filter: talking && !dead ? "drop-shadow(0 0 10px #ff4030)" : undefined }} />
          {/* corpo */}
          <rect x={40} y={150} width={440} height={720} rx={46} fill="url(#rdBody)" stroke="#3b433e" strokeWidth={4} />
          <rect x={58} y={168} width={404} height={120} rx={30} fill="url(#rdTop)" />
          {/* faixa laranja gasta da Resistência */}
          <rect x={40} y={300} width={440} height={34} fill="#b8641c" opacity={0.85} />
          {Array.from({ length: 14 }).map((_, i) => <rect key={i} x={50 + rnd(i * 3) * 400} y={302 + rnd(i * 5) * 26} width={8 + rnd(i * 7) * 30} height={3 + rnd(i) * 5} fill="#2a2f2c" opacity={0.7} />)}
          <text x={66} y={326} fill="#1a1205" fontFamily={MONO} fontSize={20} letterSpacing={6} fontWeight={700}>RESISTÊNCIA · CH 3</text>
          {/* lambda pintado */}
          <text x={418} y={248} textAnchor="middle" fill="#d9822b" fontFamily="Georgia, serif" fontSize={64} opacity={0.85}>λ</text>
          {/* moldura do visor */}
          <rect x={70} y={360} width={380} height={250} rx={18} fill="#0b0e0d" stroke="#454d48" strokeWidth={4} />
          {/* alto-falante */}
          {Array.from({ length: 9 }).map((_, i) => (
            <rect key={i} x={96} y={650 + i * 22} width={328} height={10} rx={5} fill="#0e1110" stroke="#262c29" strokeWidth={1.5} />
          ))}
          {/* botão lateral (PTT) */}
          <rect x={18} y={420} width={30} height={150} rx={12} fill="#232826" stroke="#3a423d" strokeWidth={3} />
          {/* parafusos */}
          {[[72, 190], [448, 190], [72, 838], [448, 838]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={7} fill="#454d48" />)}
        </svg>
        {/* o visor: quem fala */}
        <div style={{ position: "absolute", left: 82, top: 372, width: 356, height: 226, borderRadius: 10, overflow: "hidden", background: dead ? "#0a0505" : "#06140f", boxShadow: `inset 0 0 40px rgba(0,0,0,0.8), 0 0 ${talking ? 26 : 10}px ${dead ? "rgba(255,90,74,0.25)" : "rgba(120,255,190,0.18)"}` }}>
          {dead ? (
            <>
              <AbsoluteFill style={{ background: `repeating-linear-gradient(${f % 2 ? 0 : 180}deg, rgba(255,255,255,${0.06 + 0.1 * rnd(f)}) 0 2px, rgba(0,0,0,0) 2px ${3 + Math.floor(rnd(f * 3) * 4)}px)` }} />
              <div style={{ position: "absolute", left: 0, right: 0, top: 82, textAlign: "center", fontFamily: MONO, fontSize: 34, letterSpacing: 8, color: "#ff5a4a", opacity: 0.6 + 0.4 * (Math.floor(f / 8) % 2) }}>SEM SINAL</div>
            </>
          ) : (
            <>
              <div style={{ position: "absolute", left: 14, top: 10, right: 14, display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 15, letterSpacing: 3, color: "#7dffbe" }}>
                <span>CH 3 · 147.80</span>
                <span>{[0, 1, 2, 3].map((k) => <span key={k} style={{ display: "inline-block", width: 6, height: 6 + k * 4, marginLeft: 3, background: k < (live ? 4 : 1) ? "#7dffbe" : "#1d3a2c", verticalAlign: "bottom" }} />)}</span>
              </div>
              {live ? (
                <div style={{ position: "absolute", left: 14, top: 40, right: 14, display: "flex", gap: 14, alignItems: "center", opacity: P(f, live.at, 8) }}>
                  <div style={{ width: 96, height: 112, borderRadius: 6, overflow: "hidden", border: `2px solid ${col}`, filter: "grayscale(0.4) contrast(1.1)" }}>
                    <Img src={staticFile(live.img)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  <div style={{ fontFamily: MONO, color: "#dfffee" }}>
                    <div style={{ fontSize: 13, letterSpacing: 3, color: "#7dffbe" }}>RECEBENDO</div>
                    <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 30, letterSpacing: 1, color: "#f2fff8", marginTop: 4 }}>{live.name}</div>
                  </div>
                </div>
              ) : (
                <div style={{ position: "absolute", left: 0, right: 0, top: 90, textAlign: "center", fontFamily: MONO, fontSize: 18, letterSpacing: 5, color: "#3f8a66" }}>AGUARDANDO…</div>
              )}
              {/* a onda da voz */}
              <svg width={356} height={60} style={{ position: "absolute", left: 0, bottom: 6 }}>
                <polyline
                  points={Array.from({ length: 72 }).map((_, i) => `${i * 5},${30 + Math.sin(i * 0.55 + f * 0.9) * 24 * amp * (0.4 + 0.6 * Math.abs(Math.sin(i * 0.13 + f / 11)))}`).join(" ")}
                  fill="none"
                  stroke="#7dffbe"
                  strokeWidth={2.5}
                />
              </svg>
              <AbsoluteFill style={{ background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.25) 0 2px, rgba(0,0,0,0) 2px 4px)" }} />
            </>
          )}
        </div>
      </div>
      {/* a frase, ao lado do rádio */}
      {cards.map((c, i) => {
        const a = c.quoteAt ?? c.at, b = c.quoteOutAt ?? c.outAt;
        if (!c.quote || f < a || f > b + 12) return null;
        const o = P(f, a, 12) * (1 - interpolate(f, [b, b + 12], [0, 1], C));
        return (
          <div key={i} style={{ position: "absolute", left: 900, right: 120, top: 360, opacity: o, transform: `translateY(${(1 - P(f, a, 16)) * 20}px)` }}>
            <div style={{ fontFamily: MONO, fontSize: 18, letterSpacing: 6, color: c.col ?? "#9fe6ff" }}>{c.name} · {c.sub ?? "PELO RÁDIO"}</div>
            <div style={{ width: 80, height: 3, background: c.col ?? "#9fe6ff", margin: "14px 0 22px", opacity: 0.8 }} />
            <div style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: "italic", fontSize: 58, lineHeight: 1.2, color: "#f3f1ea", textShadow: "0 4px 24px rgba(0,0,0,0.8)" }}>“{c.quote}”</div>
          </div>
        );
      })}
      {/* carimbos (a abertura e o "sem sinal") */}
      {stamps.map((s, i) => (f >= s.at && f < s.outAt + 10 ? (
        <div key={i} style={{ position: "absolute", left: 900, right: 120, top: s.col ? 760 : 200, fontFamily: MONO, fontSize: 30, letterSpacing: 8, color: s.col ?? "#cfe8ff", opacity: P(f, s.at, 10) * (1 - interpolate(f, [s.outAt, s.outAt + 10], [0, 1], C)), textShadow: "0 2px 14px rgba(0,0,0,0.9)" }}>
          {s.text}
          {s.sub ? <div style={{ fontSize: 18, letterSpacing: 5, marginTop: 8, opacity: 0.75 }}>{s.sub}</div> : null}
        </div>
      ) : null))}
      <AbsoluteFill style={{ background: "#000", opacity: fadeOut, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};
