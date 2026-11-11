import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { FONT, MONO } from "./overlays";
import { C, rnd } from "./hl3";

// Virada 1D → 2A (2026-10-01): O TRAJE HEV LIGANDO. A parte 2 é sobre o jogador no controle, então a virada é
// "vestir o traje": tela preta → visor liga (varredura) → log de inicialização → HUD laranja do Half-Life acende
// peça por peça (SAÚDE e TRAJE contando até 100, munição) → a mira se forma e trava → IMPACTO: "GAMEPLAY" bate no
// centro, enquadrado pelo HUD, que fica vivo até a fala. Tempos em QUADROS relativos à cena.

const AMBER = "#ffa31a";
const AMBER_DIM = "rgba(255,163,26,0.55)";
const glowA = (a = 1) => `0 0 ${10 * a}px rgba(255,163,26,${0.75 * a}), 0 0 ${28 * a}px rgba(255,140,0,${0.35 * a})`;

// liga com o "piscar" de lâmpada fria do HUD
const powerOn = (f: number, at: number) => {
  if (f < at) return 0;
  const k = f - at;
  const flick = [1, 0.15, 0.9, 0.3, 1, 0.7, 1][Math.min(6, k)] ?? 1;
  return Math.min(1, flick);
};

const Cross: React.FC<{ size: number; o: number }> = ({ size, o }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" style={{ opacity: o, filter: `drop-shadow(0 0 6px ${AMBER})` }}>
    <path d="M15 4 H25 V15 H36 V25 H25 V36 H15 V25 H4 V15 H15 Z" fill={AMBER} />
  </svg>
);
const Suit: React.FC<{ size: number; o: number }> = ({ size, o }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" style={{ opacity: o, filter: `drop-shadow(0 0 6px ${AMBER})` }}>
    <path d="M20 3 L35 9 V20 C35 29 28 35 20 38 C12 35 5 29 5 20 V9 Z" fill="none" stroke={AMBER} strokeWidth={4} />
    <path d="M20 10 L29 13.5 V20 C29 25.5 25 29 20 31 C15 29 11 25.5 11 20 V13.5 Z" fill={AMBER} />
  </svg>
);

const Num: React.FC<{ v: number; o: number; size?: number }> = ({ v, o, size = 74 }) => (
  <span style={{ fontFamily: MONO, fontWeight: 800, fontSize: size, color: AMBER, letterSpacing: 2, opacity: o, textShadow: glowA(o), fontVariantNumeric: "tabular-nums" }}>{String(Math.round(v)).padStart(3, " ")}</span>
);

export const HLHevBoot: React.FC<{ life: number; hitAt: number; title?: string; split?: number; hud?: boolean; glitchAt?: number[] }> = ({ life, hitAt, title = "GAMEPLAY", split = 4, hud = true, glitchAt = [] }) => {
  const f = useCurrentFrame();
  const H = hitAt;
  const after = f - H;
  const out = interpolate(f, [life - 12, life], [1, 0], C);
  // varredura do visor ligando (topo → base) e a curvatura escura do capacete
  // log de inicialização (canto superior esquerdo), uma linha a cada ~9 quadros
  const LOG = ["H.E.V. MARK IV · INICIALIZANDO", "MONITOR DE SINAIS VITAIS ........ OK", "SISTEMA DE MUNIÇÃO ............... OK", "DEFESA ATMOSFÉRICA ............... OK", "PROTEÇÃO CONTRA RADIAÇÃO ......... OK"];
  const logAt = (i: number) => H + 6 + i * 6;
  // HUD: saúde, traje e munição acendem e contam
  // o HUD só acende DEPOIS do impacto (antes, só o log dos sinais vitais no alto)
  const hpAt = H + 10;
  const suitAt = H + 16;
  const ammoAt = H + 22;
  const hp = interpolate(f, [hpAt + 2, hpAt + 26], [0, 100], { ...C, easing: Easing.out(Easing.quad) });
  const suit = interpolate(f, [suitAt + 2, suitAt + 30], [0, 100], { ...C, easing: Easing.out(Easing.quad) });
  const ammo = interpolate(f, [ammoAt + 2, ammoAt + 14], [0, 18], C);
  const reserve = interpolate(f, [ammoAt + 6, ammoAt + 18], [0, 150], C);
  const pulse = after >= 0 ? interpolate(after, [0, 16], [0, 1], { ...C, easing: Easing.out(Easing.cubic) }) : 0;
  // impacto: título bate, flash âmbar-branco, tremida
  const hold = Math.max(1, life - H);
  const away = after >= 0 ? interpolate(after, [6, hold], [0, 1], { ...C, easing: Easing.inOut(Easing.sin) }) : 0; // vai se afastando (contínuo até o fim)
  const ts = after >= 0 ? interpolate(after, [0, 6], [1.8, 1], { ...C, easing: Easing.out(Easing.cubic) }) * (1 - 0.42 * away) : 0;
  const track = 8 + 34 * away; // letras se espaçam enquanto afasta
  const sweep = after >= 0 ? interpolate(after, [12, 40], [-0.3, 1.3], { ...C, easing: Easing.inOut(Easing.cubic) }) : -1;
  const tblur = after >= 0 ? interpolate(after, [0, 6], [12, 0], C) : 0;
  const flash = 0; // o lampejo do golpe agora é da brasa roxa (HLEmberBeat)
  const shake = after >= 0 && after < 12 ? (1 - after / 12) * 16 : 0;
  const sx = shake ? (rnd(f * 7) - 0.5) * shake : 0;
  const sy = shake ? (rnd(f * 13) - 0.5) * shake : 0;
  // HUD vivo: leve tremulação de visor
  const live = 0.92 + 0.08 * Math.sin(f * 0.9) * Math.sin(f * 0.37);
  const swayX = Math.sin(f / 23) * 6 + Math.sin(f / 9.7) * 1.5;
  const swayY = Math.cos(f / 29) * 4;
  const swayS = 1 + 0.008 * Math.sin(f / 31);
  const glitch = after >= 0 && after < 9 ? [1, 0.25, 1, 0.5, 1, 0.7, 1, 0.85, 1][after] : 1;
  const gx = after >= 0 && after < 9 ? (rnd(f * 3) - 0.5) * 24 : 0;
  const chroma = after >= 0 ? interpolate(after, [0, 10], [5, 0], C) : 0;
  const hpO = powerOn(f, hpAt) * live;
  const suitO = powerOn(f, suitAt) * live;
  const ammoO = powerOn(f, ammoAt) * live;
  return (
    <AbsoluteFill style={{ opacity: out, background: "transparent", transform: `translate(${sx}px, ${sy}px)` }}>
      {/* depois do impacto o fundo é a nebulosa do vídeo (HLSpace, atrás de todas as cenas) */}
      {hud ? (
        <>
      <AbsoluteFill
        style={{
          transform: `translate(${swayX + gx}px, ${swayY}px) scale(${swayS})`,
          opacity: glitch,
          filter: chroma > 0.2 ? `drop-shadow(${chroma}px 0 0 rgba(0,210,255,0.6)) drop-shadow(${-chroma}px 0 0 rgba(255,60,60,0.6))` : undefined,
        }}
      >
      {/* log de inicialização */}
      <div style={{ position: "absolute", left: 80, top: 70 }}>
        {LOG.map((l, i) => {
          const at = logAt(i);
          if (f < at) return null;
          const n = Math.min(l.length, Math.floor((f - at) * 3.2));
          const fadeLog = interpolate(f, [at + 30, at + 60], [1, 0.45], C);
          return (
            <div key={i} style={{ fontFamily: MONO, fontSize: 21, letterSpacing: 2, color: i === 0 ? AMBER : AMBER_DIM, textShadow: i === 0 ? glowA(0.6) : undefined, marginBottom: 8, opacity: fadeLog }}>
              {l.slice(0, n)}
              {n < l.length ? <span style={{ opacity: Math.floor(f / 3) % 2 ? 1 : 0 }}>█</span> : null}
            </div>
          );
        })}
      </div>

      {/* SAÚDE (canto inferior esquerdo) */}
      <div style={{ position: "absolute", left: 80, bottom: 70, display: "flex", alignItems: "center", gap: 16 }}>
        <Cross size={54} o={hpO} />
        <Num v={hp} o={hpO} />
      </div>
      {/* TRAJE */}
      <div style={{ position: "absolute", left: 420, bottom: 70, display: "flex", alignItems: "center", gap: 16 }}>
        <Suit size={54} o={suitO} />
        <Num v={suit} o={suitO} />
        <div style={{ width: 150, height: 14, border: `2px solid ${AMBER}`, opacity: suitO, boxShadow: glowA(0.4) }}>
          <div style={{ width: `${suit}%`, height: "100%", background: AMBER }} />
        </div>
      </div>
      {/* MUNIÇÃO (canto inferior direito) */}
      <div style={{ position: "absolute", right: 80, bottom: 70, display: "flex", alignItems: "center", gap: 18, opacity: ammoO }}>
        <Num v={ammo} o={1} />
        <div style={{ width: 4, height: 56, background: AMBER, boxShadow: glowA(0.6) }} />
        <Num v={reserve} o={1} size={56} />
        <svg width={64} height={40} viewBox="0 0 64 40" style={{ filter: `drop-shadow(0 0 6px ${AMBER})` }}>
          <path d="M4 14 H44 L56 20 L44 26 H4 Z" fill={AMBER} />
          <rect x={4} y={14} width={10} height={12} fill="#020203" opacity={0.35} />
        </svg>
      </div>

      </AbsoluteFill>
        </>
      ) : null}
      {/* o título, enquadrado pelo HUD */}
      {after >= 0 ? (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", transform: `scale(${ts})`, filter: tblur > 0.2 ? `blur(${tblur}px)` : undefined }}>
          {/* GAME em osso, PLAY em âmbar (o brilho passa pelas duas partes) */}
          <div
            style={{
              fontFamily: FONT,
              fontWeight: 900,
              fontSize: 210,
              letterSpacing: track,
              lineHeight: 1,
              whiteSpace: "nowrap",
              filter: `drop-shadow(0 0 ${8 * (1 - 0.5 * away)}px rgba(150,60,20,0.35)) drop-shadow(0 14px 40px rgba(0,0,0,0.95))`,
              opacity: 1 - 0.15 * away,
            }}
          >
            {[
              { t: title.slice(0, split), base: "#d9d2c6", hi: "#f6eee0" },
              { t: title.slice(split), base: AMBER, hi: "#ffd9a0" },
            ].map((p, i) => {
              const g = i === 1 ? glitchAt.find((g0) => after >= g0 && after < g0 + 4) : undefined;
              const k = g !== undefined ? after - g : -1;
              const swaps: Record<number, string[]> = { 0: ["P", "L", "Δ", "Y"], 1: ["P", "|", "A", "¥"], 2: ["Р", "L", "A", "Y"], 3: ["P", "L", "A", "Y"] };
              const txt = k >= 0 ? (swaps[k] ?? p.t.split("")).join("") : p.t;
              const jx = k >= 0 && k < 3 ? [7, -5, 3][k] : 0;
              return (
              <span
                key={i}
                style={{
                  display: "inline-block",
                  transform: `translateX(${jx}px)`,
                  filter: k >= 0 && k < 3 ? "drop-shadow(4px 0 0 rgba(0,210,255,0.55)) drop-shadow(-4px 0 0 rgba(255,50,50,0.55))" : undefined,
                  backgroundImage: `linear-gradient(100deg, ${p.base} 0%, ${p.base} ${Math.max(0, sweep * 100 - 6)}%, ${p.hi} ${sweep * 100}%, ${p.base} ${Math.min(100, sweep * 100 + 6)}%, ${p.base} 100%)`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {txt}
              </span>
              );
            })}
          </div>
        </AbsoluteFill>
      ) : null}
      <AbsoluteFill style={{ background: "#7a3a12", opacity: flash, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};
