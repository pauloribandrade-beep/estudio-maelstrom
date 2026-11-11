import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { FONT } from "./overlays";
import { C, rnd } from "./hl3";

// Virada 1D → 2A, versão rápida (2026-10-01): a fenda some (implode) e "GAMEPLAY" bate na tela no impacto.
// Tempos em QUADROS relativos à cena.

// ---------------------------------------------------------------------------------------------
// FENDA QUE IMPLODE (lane 2, no escuro): fio de luz que cresce e tremula com partículas sendo puxadas;
// em `hitAt` encolhe num ponto de luz em ~4 quadros e some (o título entra no mesmo quadro).
// ---------------------------------------------------------------------------------------------
export const HLRiftCollapse: React.FC<{ life: number; hitAt: number }> = ({ life, hitAt }) => {
  const f = useCurrentFrame();
  void life;
  const b = interpolate(f, [0, hitAt], [0, 1], { ...C, easing: Easing.in(Easing.cubic) });
  const after = f - hitAt;
  const col = after >= 0 ? interpolate(after, [0, 4], [0, 1], { ...C, easing: Easing.in(Easing.cubic) }) : 0; // implode
  const gone = after >= 0 ? interpolate(after, [3, 8], [1, 0], C) : 1;
  const flick = 0.82 + 0.18 * Math.sin(f * 1.7) * Math.sin(f * 0.53);
  const w = (2 + 22 * b * b) * (1 - col);
  const h = (160 + 900 * b) * (1 - col) + 8 * col;
  const motes = Array.from({ length: 34 }).map((_, k) => {
    const side = k % 2 ? 1 : -1;
    const ph = (f * (0.008 + 0.022 * b) + rnd(k + 5)) % 1;
    const x0 = 960 + side * (180 + rnd(k + 9) * 620);
    const y = 540 + (rnd(k + 13) - 0.5) * 760 * (1 - 0.4 * ph);
    return { x: x0 + (960 - x0) * ph, y, o: b * Math.sin(ph * Math.PI) * 0.9 * (1 - col), s: 1.5 + rnd(k + 17) * 2.5 };
  });
  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity: gone }}>
      {motes.map((p, k) => (
        <div key={k} style={{ position: "absolute", left: p.x, top: p.y, width: p.s, height: p.s, borderRadius: "50%", background: "#aaffe6", boxShadow: "0 0 8px #5fe0c4", opacity: p.o }} />
      ))}
      <div style={{ position: "absolute", left: 960 - 520, top: 540 - 520, width: 1040, height: 1040, borderRadius: "50%", background: "radial-gradient(closest-side, rgba(95,224,196,0.28), rgba(95,224,196,0))", opacity: (0.35 + 0.65 * b) * flick * (1 - col) }} />
      <div
        style={{
          position: "absolute",
          left: 960 - w / 2,
          top: 540 - h / 2,
          width: w,
          height: h,
          borderRadius: w,
          background: "linear-gradient(180deg, rgba(170,255,230,0) 0%, #e9fff8 30%, #e9fff8 70%, rgba(170,255,230,0) 100%)",
          boxShadow: `0 0 ${30 + 60 * b}px ${8 + 20 * b}px rgba(95,224,196,${0.55 * flick}), 0 0 ${140 * b}px ${30 * b}px rgba(60,170,255,${0.3 * b})`,
          opacity: Math.min(1, 0.4 + b) * flick,
        }}
      />
      {/* o ponto final da implosão */}
      {after >= 0 ? <div style={{ position: "absolute", left: 960 - 40, top: 540 - 40, width: 80, height: 80, borderRadius: "50%", background: "radial-gradient(closest-side, #ffffff, rgba(150,255,230,0))", opacity: interpolate(after, [0, 3, 7], [0, 1, 0], C) }} /> : null}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// TÍTULO COM IMPACTO: as letras batem vindo de perto (rastro + separação de cor que assenta), tremida,
// flash, faixa de luz horizontal e faíscas; depois um brilho passa pelas letras e fica a borda acesa.
// ---------------------------------------------------------------------------------------------
export const HLTitleSlam: React.FC<{ life: number; title?: string }> = ({ life, title = "GAMEPLAY" }) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [life - 12, life], [1, 0], C);
  const s = interpolate(f, [0, 6], [1.9, 1], { ...C, easing: Easing.out(Easing.cubic) });
  const settle = 1 + interpolate(f, [6, 12], [-0.03, 0], { ...C, easing: Easing.out(Easing.quad) }) + interpolate(f, [12, life], [0, 0.05], C);
  const split = interpolate(f, [0, 12], [26, 0], { ...C, easing: Easing.out(Easing.cubic) }); // separação de cor
  const blur = interpolate(f, [0, 6], [14, 0], C);
  const shake = f < 12 ? (1 - f / 12) * 18 : 0;
  const sx = shake ? (rnd(f * 7) - 0.5) * shake : 0;
  const sy = shake ? (rnd(f * 13) - 0.5) * shake : 0;
  const flash = interpolate(f, [0, 1, 9], [0.85, 0.55, 0], C);
  const band = interpolate(f, [0, 14], [0, 1], { ...C, easing: Easing.out(Easing.cubic) });
  const sweep = interpolate(f, [16, 40], [-0.3, 1.3], { ...C, easing: Easing.inOut(Easing.cubic) }); // brilho que passa
  const glow = interpolate(f, [0, 10, 30], [1, 0.75, 0.45], C) + 0.05 * Math.sin(f / 9);
  const text: React.CSSProperties = { fontFamily: FONT, fontWeight: 900, fontSize: 230, letterSpacing: 6, lineHeight: 1, whiteSpace: "nowrap" };
  const sparks = Array.from({ length: 46 }).map((_, k) => {
    const ang = rnd(k + 400) * Math.PI * 2;
    const v = 10 + rnd(k + 401) * 34;
    const lifeK = 14 + rnd(k + 402) * 22;
    const t = f;
    return { x: 960 + Math.cos(ang) * v * t * 1.6, y: 540 + Math.sin(ang) * v * t * 0.7 + 0.4 * t * t, o: Math.max(0, 1 - t / lifeK), s: 2 + rnd(k + 403) * 4, c: k % 3 ? "#9ff7e2" : "#ffb070" };
  });
  return (
    <AbsoluteFill style={{ opacity: o, transform: `translate(${sx}px, ${sy}px)`, pointerEvents: "none" }}>
      {/* faixa de luz horizontal do impacto */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 540 - 4 - 160 * band, height: 8 + 320 * band, background: "linear-gradient(180deg, rgba(126,240,212,0), rgba(126,240,212,0.35) 50%, rgba(126,240,212,0))", opacity: 1 - band }} />
      <div style={{ position: "absolute", left: 960 - 900, top: 540 - 380, width: 1800, height: 760, borderRadius: "50%", background: "radial-gradient(closest-side, rgba(70,210,180,0.3), rgba(70,210,180,0))", opacity: glow }} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", transform: `scale(${s * settle})`, filter: blur > 0.2 ? `blur(${blur}px)` : undefined }}>
        {/* separação de cor (assenta em ~12 quadros) */}
        <div style={{ ...text, position: "absolute", color: "rgba(80,230,200,0.75)", transform: `translateX(${-split}px)`, opacity: split > 0.5 ? 1 : 0 }}>{title}</div>
        <div style={{ ...text, position: "absolute", color: "rgba(255,150,70,0.7)", transform: `translateX(${split}px)`, opacity: split > 0.5 ? 1 : 0 }}>{title}</div>
        {/* letras: branco com borda verde-azulada acesa e um brilho que passa uma vez */}
        <div
          style={{
            ...text,
            position: "relative",
            color: "#f4fffc",
            backgroundImage: `linear-gradient(100deg, #f4fffc 0%, #f4fffc ${Math.max(0, sweep * 100 - 8)}%, #ffffff ${sweep * 100}%, #f4fffc ${Math.min(100, sweep * 100 + 8)}%, #f4fffc 100%)`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            filter: `drop-shadow(0 0 ${10 + 30 * glow}px rgba(95,224,196,${0.55 * glow + 0.25})) drop-shadow(0 10px 50px rgba(0,0,0,0.8))`,
          }}
        >
          {title}
        </div>
      </AbsoluteFill>
      {sparks.map((p, k) => (p.o > 0 ? <div key={k} style={{ position: "absolute", left: p.x, top: p.y, width: p.s, height: p.s, borderRadius: "50%", background: p.c, boxShadow: `0 0 10px ${p.c}`, opacity: p.o }} /> : null))}
      <AbsoluteFill style={{ background: "#f2fffb", opacity: flash }} />
    </AbsoluteFill>
  );
};
