import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { FONT, MONO } from "./overlays";
import { C, HL, INOUT, OUT, lerp, rnd } from "./hl3";

// Cenas da 1C ("por que a Valve demorou"). Tempos das props em QUADROS relativos à cena.
const E = (e: (t: number) => number) => ({ ...C, easing: e });
const BACK = E(Easing.out(Easing.back(1.6)));
const mono = (size: number, color = HL.dim, ls = 4): React.CSSProperties => ({ fontFamily: MONO, fontSize: size, letterSpacing: ls, textTransform: "uppercase", color });
const glass = (glow = 0): React.CSSProperties => ({
  background: `linear-gradient(160deg, rgba(255,255,255,${0.1 + 0.08 * glow}) 0%, rgba(255,255,255,0.025) 55%, rgba(107,63,212,${0.08 + 0.12 * glow}) 100%)`,
  border: `1px solid rgba(255,255,255,${0.16 + 0.3 * glow})`,
  boxShadow: `inset 0 1px 0 rgba(255,255,255,0.14), 0 40px 100px rgba(0,0,0,0.55), 0 0 ${60 * glow}px rgba(159,216,255,${0.3 * glow})`,
  backdropFilter: "blur(16px)",
  borderRadius: 24,
});
const fadeLife = (f: number, life: number, a = 12, b = 12) => Math.min(lerp(f, 0, a, 0, 1, OUT), lerp(f, life - b, life, 1, 0));
const typed = (text: string, f: number, at: number, cps = 1.4) => text.slice(0, Math.max(0, Math.floor((f - at) / cps)));

// ---------------------------------------------------------------------------------------------
// PERGUNTA RISCADA: q1 digitada em HUD, riscada em `strikeAt`; q2 se escreve embaixo em laranja.
export const HLStrikeQ: React.FC<{ life: number; label?: string; q1: string; q1At: number; strikeAt: number; q2: string; q2At: number }> = ({ life, label = "a pergunta", q1, q1At, strikeAt, q2, q2At }) => {
  const f = useCurrentFrame();
  const o = fadeLife(f, life);
  const st = lerp(f, strikeAt, strikeAt + 10, 0, 1, OUT);
  const dim = lerp(f, strikeAt + 4, strikeAt + 16, 1, 0.38, C);
  const up = lerp(f, q2At - 4, q2At + 12, 0, 1, INOUT);
  const t1 = typed(q1, f, q1At, 1.2);
  const t2 = typed(q2, f, q2At, 1.1);
  return (
    <AbsoluteFill style={{ opacity: o, alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", top: 300 - up * 70, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ ...mono(20, HL.orange, 10), opacity: lerp(f, 0, 14, 0, 1, OUT) }}>{label}</div>
        <div style={{ position: "relative", display: "inline-block", marginTop: 20, fontFamily: FONT, fontWeight: 750, fontSize: 96 - up * 26, color: HL.text, opacity: dim }}>
          {t1}
          {t1.length < q1.length && f >= q1At ? <span style={{ color: HL.orange }}>▍</span> : null}
          <div style={{ position: "absolute", left: -10, top: "54%", height: 6, width: `calc(${st * 100}% + ${20 * st}px)`, opacity: st > 0 ? 1 : 0, background: "#ff3b30", borderRadius: 3, boxShadow: "0 0 18px rgba(255,59,48,0.6)" }} />
        </div>
      </div>
      {f >= q2At ? (
        <div style={{ position: "absolute", top: 470, left: 140, right: 140, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 84, lineHeight: 1.1, color: HL.orange, textShadow: "0 0 40px rgba(255,138,31,0.35)" }}>
          {t2}
          {t2.length < q2.length ? <span style={{ color: HL.text }}>▍</span> : null}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// TEXTO GRANDE: uma frase em tipografia, palavra por palavra; `sub` opcional embaixo.
export const HLBigText: React.FC<{ life: number; text: string; at?: number; size?: number; sub?: string; subAt?: number; color?: string; impact?: boolean }> = ({ life, text, at = 4, size = 104, sub, subAt = 30, color = HL.text, impact }) => {
  const f = useCurrentFrame();
  const o = fadeLife(f, life);
  const words = text.split(" ");
  const slam = impact ? lerp(f, 0, 9, 1.25, 1, E(Easing.out(Easing.cubic))) : 1;
  const push = slam * (1 + lerp(f, 0, life, 0, 0.04, C));
  const ring = impact ? lerp(f, 0, 22, 0, 1, OUT) : 1;
  return (
    <AbsoluteFill style={{ opacity: o, alignItems: "center", justifyContent: "center" }}>
      {impact ? <div style={{ position: "absolute", left: 960 - 1100 * ring, top: 540 - 1100 * ring, width: 2200 * ring, height: 2200 * ring, borderRadius: "50%", border: `${5 * (1 - ring) + 1}px solid rgba(255,190,130,${0.6 * (1 - ring)})` }} /> : null}
      {impact ? <AbsoluteFill style={{ background: "#fff", opacity: interpolate(f, [0, 2, 10], [0.35, 0.2, 0], C) }} /> : null}
      <div style={{ position: "absolute", width: 1300, height: 600, borderRadius: "50%", background: "radial-gradient(closest-side, rgba(107,63,212,0.32), rgba(107,63,212,0))" }} />
      <div style={{ maxWidth: 1500, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: size, lineHeight: 1.08, letterSpacing: -2, color, transform: `scale(${push})` }}>
        {words.map((w, i) => {
          const p = impact ? 1 : lerp(f, at + i * 3, at + i * 3 + 14, 0, 1, OUT);
          return (
            <span key={i} style={{ display: "inline-block", whiteSpace: "pre", opacity: p, transform: `translateY(${(1 - p) * 30}px)`, filter: p < 1 ? `blur(${(1 - p) * 10}px)` : undefined }}>
              {w + (i < words.length - 1 ? " " : "")}
            </span>
          );
        })}
      </div>
      {sub ? <div style={{ position: "absolute", top: 760, left: 0, right: 0, textAlign: "center", ...mono(24, HL.dim, 7), opacity: lerp(f, subAt, subAt + 14, 0, 1, OUT) }}>{sub}</div> : null}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// MIGRAÇÃO DA EQUIPE: pontinhos (desenvolvedores) no bloco "Episode Three" migram para "Left 4 Dead".
export const HLTeamMove: React.FC<{ life: number; moveAt?: number; from?: string; to?: string }> = ({ life, moveAt = 90, from = "Episode Three", to = "Left 4 Dead" }) => {
  const f = useCurrentFrame();
  const o = fadeLife(f, life);
  const N = 36;
  const box = (x: number, label: string, glow: number) => (
    <div style={{ position: "absolute", left: x - 260, top: 330, width: 520, height: 420, ...glass(glow) }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 440, textAlign: "center", fontFamily: FONT, fontWeight: 750, fontSize: 46, color: HL.text }}>{label}</div>
    </div>
  );
  const moved = lerp(f, moveAt, moveAt + 40, 0, 1, C);
  return (
    <AbsoluteFill style={{ opacity: o }}>
      {box(560, from, 0.15 * (1 - moved))}
      {box(1360, to, 0.15 + 0.5 * moved)}
      {Array.from({ length: N }).map((_, i) => {
        const col = i % 6;
        const row = Math.floor(i / 6);
        const sx = 560 - 175 + col * 70;
        const sy = 380 + row * 60;
        const go = i % 9 === 0 ? 0 : lerp(f, moveAt + i * 0.9, moveAt + i * 0.9 + 22, 0, 1, E(Easing.inOut(Easing.cubic)));
        const x = sx + go * 800;
        const y = sy - Math.sin(go * Math.PI) * 120;
        const enter = lerp(f, 4 + i * 0.6, 14 + i * 0.6, 0, 1, BACK);
        return <div key={i} style={{ position: "absolute", left: x - 11, top: y - 11, width: 22, height: 22, borderRadius: 22, background: go > 0.5 ? HL.orange : HL.ice, boxShadow: `0 0 14px ${go > 0.5 ? "rgba(255,138,31,0.7)" : "rgba(159,216,255,0.7)"}`, transform: `scale(${enter})` }} />;
      })}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// JANELA QUE SE FECHA: uma janela de luz se estreita até fechar; "Episode Three" apaga junto.
export const HLWindowClose: React.FC<{ life: number; closeAt?: number; labelAt?: number; l4dAt?: number; turnAt?: number }> = ({ life, labelAt = 18, l4dAt = 36, turnAt = 50 }) => {
  // linha do tempo 2004 → 2012. O trecho Episode Two → Episode Three acende em azul-claro neon pulsante,
  // com "janela de inovação" embaixo. O ponto do Left 4 Dead surge do nada no meio dela e o laranja se
  // espalha a partir dele, tomando o trecho; o rótulo da janela some.
  const f = useCurrentFrame();
  const o = fadeLife(f, life, 8, 10);
  const X0 = 260;
  const X1 = 1660;
  const Y = 500;
  const yr = (y: number) => X0 + ((y - 2004) / 8) * (X1 - X0);
  const wa = yr(2007);
  const wb = yr(2010.2);
  const l4d = yr(2008.85);
  const grow = lerp(f, 2, 22, 0, 1, E(Easing.inOut(Easing.cubic)));
  const pulse = 0.75 + 0.25 * Math.sin(f / 5);
  const lab = lerp(f, labelAt, labelAt + 12, 0, 1, OUT) * lerp(f, turnAt + 4, turnAt + 16, 1, 0);
  const dot = lerp(f, l4dAt, l4dAt + 12, 0, 1, OUT);
  const turn = lerp(f, turnAt, turnAt + 18, 0, 1, E(Easing.inOut(Easing.cubic)));
  const oa = l4d - (l4d - wa) * turn;
  const ob = l4d + (wb - l4d) * turn;
  const gone = turn > 0.9;
  const glow = (rgb: string, k: number) => `0 0 ${10 * k}px rgba(${rgb},0.95), 0 0 ${28 * k}px rgba(${rgb},0.6), 0 0 ${60 * k}px rgba(${rgb},0.3)`;
  const marks: [number, string][] = [
    [2004, "Half-Life 2"],
    [2007, "Episode Two"],
    [2012, ""],
  ];
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <div style={{ position: "absolute", left: X0, width: X1 - X0, top: Y - 1, height: 2, background: "rgba(255,255,255,0.25)" }} />
      {/* janela: trecho em azul neon pulsante */}
      <div style={{ position: "absolute", left: wa, top: Y - 3, width: (wb - wa) * grow, height: 6, borderRadius: 6, background: HL.ice, boxShadow: glow("159,216,255", pulse), opacity: 1 - turn * 0.999 }} />
      {/* o laranja do Left 4 Dead toma o trecho a partir do ponto */}
      {turn > 0 ? <div style={{ position: "absolute", left: oa, top: Y - 3, width: ob - oa, height: 6, borderRadius: 6, background: HL.orange, boxShadow: glow("255,138,31", 0.9 + 0.2 * Math.sin(f / 5)) }} /> : null}
      <div style={{ position: "absolute", left: wa, width: wb - wa, top: Y + 70, textAlign: "center", ...mono(22, HL.ice, 8), opacity: lab, textShadow: "0 0 18px rgba(159,216,255,0.6)" }}>janela de inovação</div>
      {marks.map(([y, t], i) => (
        <div key={i} style={{ position: "absolute", left: yr(y), top: Y }}>
          <div style={{ position: "absolute", left: -6, top: -6, width: 12, height: 12, borderRadius: 12, background: "#fff" }} />
          <div style={{ position: "absolute", left: -120, width: 240, top: -62, textAlign: "center", ...mono(16, HL.dim, 3) }}>{y}</div>
          {t ? <div style={{ position: "absolute", left: -120, width: 240, top: 22, textAlign: "center", fontFamily: FONT, fontSize: 26, color: HL.text }}>{t}</div> : null}
        </div>
      ))}
      <div style={{ position: "absolute", left: l4d, top: Y, opacity: dot }}>
        <div style={{ position: "absolute", left: -11, top: -11, width: 22, height: 22, borderRadius: 22, background: HL.orange, boxShadow: glow("255,138,31", 1), transform: `scale(${0.4 + 0.6 * dot})` }} />
        <div style={{ position: "absolute", left: -140, width: 280, top: -78, textAlign: "center", fontFamily: FONT, fontWeight: 700, fontSize: 30, color: HL.orange, transform: `translateY(${(1 - dot) * 10}px)` }}>Left 4 Dead</div>
      </div>
      <div style={{ position: "absolute", left: wb, top: Y }}>
        <div style={{ position: "absolute", left: -9, top: -9, width: 18, height: 18, borderRadius: 18, border: "2px dashed rgba(255,255,255,0.6)", opacity: 1 - turn * 0.6 }} />
        <div style={{ position: "absolute", left: -140, width: 280, top: 22, textAlign: "center", fontFamily: FONT, fontSize: 26, color: gone ? "rgba(242,240,247,0.35)" : HL.text, textDecoration: gone ? "line-through" : undefined }}>Episode Three</div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// BARRA DE PROGRESSO que enche e TRAVA em `stuckAt` (glitch), com rótulo e pergunta embaixo.
export const HLProgress: React.FC<{ life: number; label?: string; target?: number; stuckAt?: number; question?: string; qAt?: number }> = ({ life, label = "Episode Three", target = 0.9, stuckAt = 120, question, qAt = 150 }) => {
  const f = useCurrentFrame();
  const o = fadeLife(f, life);
  const p = lerp(f, 10, stuckAt, 0, target, E(Easing.out(Easing.cubic)));
  const stuck = f >= stuckAt;
  const g = stuck ? interpolate(f - stuckAt, [0, 2, 5, 10], [1, 0.4, 1, 0], C) : 0;
  const jit = g > 0 ? (rnd(f) - 0.5) * 16 * g : 0;
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <div style={{ position: "absolute", left: 360, right: 360, top: 400, transform: `translateX(${jit}px)` }}>
        <div style={{ display: "flex", justifyContent: "space-between", ...mono(22, HL.text, 6) }}>
          <span>{label}</span>
          <span style={{ color: stuck ? "#ff8a7a" : HL.orange }}>{Math.round(p * 100)}%</span>
        </div>
        <div style={{ marginTop: 18, height: 26, borderRadius: 13, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.18)", overflow: "hidden" }}>
          <div style={{ width: `${p * 100}%`, height: "100%", background: stuck ? "linear-gradient(90deg, #ff8a1f, #ff5a3c)" : "linear-gradient(90deg, rgba(159,216,255,0.7), #ff8a1f)", boxShadow: "0 0 24px rgba(255,138,31,0.55)" }} />
        </div>
        <div style={{ marginTop: 18, ...mono(18, stuck ? "#ff8a7a" : HL.dim, 5), opacity: stuck ? 1 : 0.7 }}>{stuck ? "travado" : "em desenvolvimento"}</div>
      </div>
      {question ? <div style={{ position: "absolute", left: 0, right: 0, top: 640, textAlign: "center", fontFamily: FONT, fontWeight: 750, fontSize: 62, color: HL.text, opacity: lerp(f, qAt, qAt + 14, 0, 1, OUT) }}>{question}</div> : null}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// LAMBDA RACHADO: λ laranja girando devagar; em `crackAt` uma rachadura atravessa.
export const HLLambda: React.FC<{ life: number; crackAt?: number; label?: string }> = ({ life, label = "a maldição do Half-Life" }) => {
  // a maldição contada em anos: barras dos intervalos entre os lançamentos principais;
  // a última (até hoje) continua crescendo enquanto a cena dura
  const f = useCurrentFrame();
  const o = fadeLife(f, life, 8, 8);
  const gaps: [string, number][] = [
    ["1998 → 2004", 6],
    ["2004 → 2007", 3],
    ["2007 → 2020", 13],
    ["2020 → hoje", 6.5],
  ];
  const maxW = 900;
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 200, textAlign: "center", ...mono(24, HL.orange, 10) }}>{label}</div>
      {gaps.map(([lab, y], i) => {
        const a = 4 + i * 6;
        const last = i === gaps.length - 1;
        const g = lerp(f, a, a + 16, 0, 1, E(Easing.out(Easing.cubic)));
        const extra = last ? lerp(f, a + 16, life, 0, 0.12, C) : 0;
        const w = (y / 13) * maxW * (g + extra);
        return (
          <div key={i} style={{ position: "absolute", left: 960 - 560, top: 320 + i * 120, display: "flex", alignItems: "center", gap: 30, opacity: Math.min(1, g * 2) }}>
            <div style={{ width: 230, textAlign: "right", ...mono(20, HL.dim, 3) }}>{lab}</div>
            <div
              style={{
                width: w,
                height: 34,
                borderRadius: 6,
                background: last ? "linear-gradient(90deg, #ff8a1f, #ff5a3c)" : "linear-gradient(90deg, rgba(159,216,255,0.5), rgba(159,216,255,0.85))",
                boxShadow: last ? "0 0 24px rgba(255,138,31,0.55)" : undefined,
              }}
            />
            <div style={{ fontFamily: FONT, fontWeight: 750, fontSize: 34, color: last ? HL.orange : HL.text }}>{last ? "6,5+ anos" : `${y} anos`}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// SALTO DE ANOS: "2007" → "2020" (o número rola) e "13 anos" embaixo.
export const HLYearJump: React.FC<{ life: number; from?: number; to?: number; rollAt?: number; label?: string }> = ({ life, from = 2007, to = 2020, rollAt = 20, label = "13 anos depois" }) => {
  const f = useCurrentFrame();
  const o = fadeLife(f, life);
  const v = Math.round(lerp(f, rollAt, rollAt + 30, from, to, E(Easing.inOut(Easing.cubic))));
  const lab = lerp(f, rollAt + 26, rollAt + 40, 0, 1, OUT);
  return (
    <AbsoluteFill style={{ opacity: o, alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontFamily: MONO, fontWeight: 600, fontSize: 230, color: v >= to ? HL.orange : HL.text, letterSpacing: 6 }}>{v}</div>
      <div style={{ position: "absolute", top: 700, ...mono(30, HL.text, 12), opacity: lab }}>{label}</div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// PADRÃO: HL1 → HL2 → Alyx → ? com a inovação de cada um; o "?" acende em `qAt`.
export const HLPattern: React.FC<{ life: number; items: { title: string; year: string; tag: string; at: number }[]; qAt?: number; qLabel?: string }> = ({ life, items, qAt = 200, qLabel = "algo novo" }) => {
  const f = useCurrentFrame();
  const o = fadeLife(f, life);
  const all = [...items, { title: "?", year: "", tag: qLabel, at: qAt }];
  const X0 = 260;
  const X1 = 1660;
  const line = lerp(f, 0, 30, 0, 1, OUT);
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <div style={{ position: "absolute", left: X0, width: (X1 - X0) * line, top: 560, height: 2, background: "linear-gradient(90deg, rgba(159,216,255,0.6), rgba(255,138,31,0.8))" }} />
      {all.map((it, i) => {
        const x = X0 + (i / (all.length - 1)) * (X1 - X0);
        const e = lerp(f, it.at, it.at + 14, 0, 1, BACK);
        const q = i === all.length - 1;
        return (
          <div key={i} style={{ position: "absolute", left: x, top: 560, opacity: Math.min(1, e) }}>
            <div style={{ position: "absolute", left: -12, top: -12, width: 24, height: 24, borderRadius: 24, background: q ? HL.orange : HL.ice, boxShadow: `0 0 20px ${q ? "rgba(255,138,31,0.8)" : "rgba(159,216,255,0.7)"}`, transform: `scale(${e})` }} />
            <div style={{ position: "absolute", left: -170, width: 340, top: -190, textAlign: "center" }}>
              <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: q ? 110 : 46, lineHeight: 1, color: q ? HL.orange : HL.text }}>{it.title}</div>
              {it.year ? <div style={{ ...mono(18, HL.dim, 5), marginTop: 8 }}>{it.year}</div> : null}
            </div>
            <div style={{ position: "absolute", left: -170, width: 340, top: 40, textAlign: "center", ...mono(22, q ? HL.orange : HL.text, 5) }}>{it.tag}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// CHECKLIST HUD: itens entram marcados ✓; em `failAt` (ou por item `failAt`) viram ✕ e risca;
// `verdict` aparece embaixo.
export const HLChecklist: React.FC<{ life: number; title?: string; items: { text: string; at: number; failAt?: number }[]; failAt?: number; verdict?: string; verdictAt?: number }> = ({ life, title, items, failAt = 1e9, verdict, verdictAt = 1e9 }) => {
  const f = useCurrentFrame();
  const o = fadeLife(f, life);
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <div style={{ position: "absolute", left: 960 - 520, top: 260, width: 1040, padding: "40px 50px", ...glass(0.15) }}>
        {title ? <div style={{ ...mono(22, HL.orange, 8), marginBottom: 26 }}>{title}</div> : null}
        {items.map((it, i) => {
          const e = lerp(f, it.at, it.at + 12, 0, 1, BACK);
          const fa = it.failAt ?? failAt;
          const bad = lerp(f, fa, fa + 8, 0, 1, OUT);
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 26, marginBottom: 24, opacity: Math.min(1, e), transform: `translateX(${(1 - Math.min(1, e)) * 40}px)` }}>
              <div style={{ width: 54, height: 54, borderRadius: 12, border: `2px solid ${bad > 0.5 ? "#ff3b30" : HL.ice}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT, fontWeight: 900, fontSize: 36, color: bad > 0.5 ? "#ff3b30" : HL.ice }}>{bad > 0.5 ? "✕" : "✓"}</div>
              <div style={{ position: "relative", fontFamily: FONT, fontWeight: 650, fontSize: 46, color: HL.text, opacity: 1 - bad * 0.45 }}>
                {it.text}
                <div style={{ position: "absolute", left: -6, top: "55%", height: 4, width: `calc(${bad * 100}% + ${12 * bad}px)`, opacity: bad > 0 ? 1 : 0, background: "#ff3b30", borderRadius: 2 }} />
              </div>
            </div>
          );
        })}
      </div>
      {verdict ? <div style={{ position: "absolute", left: 0, right: 0, top: 820, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 60, color: "#ff8a7a", opacity: lerp(f, verdictAt, verdictAt + 12, 0, 1, OUT) }}>{verdict}</div> : null}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// "HALF-LIFE" + "3" que se aproxima devagar e nunca encaixa (treme na borda).
export const HLThree: React.FC<{ life: number; at?: number }> = ({ life, at = 6 }) => {
  const f = useCurrentFrame();
  const o = fadeLife(f, life);
  const hl = lerp(f, at, at + 16, 0, 1, OUT);
  const app = lerp(f, at + 10, life - 10, 0, 1, E(Easing.out(Easing.quad)));
  const x = 520 * (1 - app) + 30;
  const shake = app > 0.9 ? (rnd(f) - 0.5) * 6 : 0;
  return (
    <AbsoluteFill style={{ opacity: o, alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", alignItems: "baseline", fontFamily: FONT, fontWeight: 800, fontSize: 200, letterSpacing: -8, color: HL.text }}>
        <span style={{ opacity: hl }}>Half-Life</span>
        <span style={{ display: "inline-block", marginLeft: x + shake, color: HL.orange, opacity: Math.min(1, app * 2), textShadow: "0 0 50px rgba(255,138,31,0.5)" }}>3</span>
      </div>
      <div style={{ position: "absolute", top: 760, ...mono(24, HL.dim, 8), opacity: lerp(f, at + 30, at + 44, 0, 1, OUT) }}>precisa de um motivo</div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// CADERNO ABERTO: vidro com linhas se escrevendo em `lines[].at` (as com `no` vêm riscadas).
export const HLNotebook: React.FC<{ life: number; title?: string; lines: { text: string; at: number; no?: boolean }[] }> = ({ life, title = "caderno aberto", lines }) => {
  const f = useCurrentFrame();
  const o = fadeLife(f, life, 14, 10);
  const e = lerp(f, 0, 20, 0, 1, OUT);
  return (
    <AbsoluteFill style={{ opacity: o, perspective: 1400 }}>
      <div style={{ position: "absolute", left: 960 - 620, top: 170, width: 1240, height: 740, ...glass(0.12), transform: `translateZ(${(1 - e) * -500}px) rotateX(${(1 - e) * 12}deg)`, padding: "50px 70px", boxSizing: "border-box" }}>
        <div style={{ ...mono(20, HL.orange, 8) }}>{title}</div>
        {lines.map((l, i) => {
          if (f < l.at) return null;
          const t = typed(l.text, f, l.at, 1.1);
          const st = l.no ? lerp(f, l.at + l.text.length * 1.1, l.at + l.text.length * 1.1 + 10, 0, 1, OUT) : 0;
          return (
            <div key={i} style={{ position: "relative", width: "fit-content", marginTop: 34, fontFamily: FONT, fontWeight: 650, fontSize: 50, color: l.no ? "rgba(242,240,247,0.6)" : HL.text, borderBottom: "1px dashed rgba(255,255,255,0.15)", paddingBottom: 10 }}>
              {t}
              {t.length < l.text.length ? <span style={{ color: HL.orange }}>▍</span> : null}
              {l.no ? <div style={{ position: "absolute", left: -6, top: "48%", height: 4, width: `${st * 100}%`, background: "#ff3b30" }} /> : null}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// QUADROS DE VÍDEO: 3 vidros com vídeo entrando um por um, cada um com rótulo (sem loop: trecho corre uma vez).
export { HLPanes } from "./hl3d-panes";

// ---------------------------------------------------------------------------------------------
// SALTO (trilha de cima): túnel de luz radial + clarão no pico (`hitAt`), que abre revelando a cena nova.
export const HLJump: React.FC<{ life: number; hitAt?: number }> = ({ life, hitAt = 12 }) => {
  const f = useCurrentFrame();
  void life;
  const u = f - hitAt;
  const tunnel = interpolate(u, [-14, 0, 10], [0, 1, 0], C);
  const flash = interpolate(u, [-3, 0, 4, 16], [0, 0.9, 0.6, 0], { ...C, easing: Easing.out(Easing.quad) });
  const ring = lerp(u, 0, 18, 0, 1, OUT);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 50%, rgba(0,0,0,0) ${30 - tunnel * 25}%, rgba(120,80,255,${0.35 * tunnel}) 60%, rgba(5,4,10,${0.6 * tunnel}) 100%)` }} />
      {Array.from({ length: 28 }).map((_, i) => {
        const a = (i / 28) * Math.PI * 2 + rnd(i) * 0.2;
        const len = 300 + tunnel * 700;
        return <div key={i} style={{ position: "absolute", left: 960, top: 540, width: len, height: 2 + rnd(i + 3) * 3, transformOrigin: "0 50%", transform: `rotate(${a}rad) translateX(${120 + (1 - tunnel) * 400}px)`, background: `linear-gradient(90deg, rgba(255,255,255,0), rgba(${i % 3 ? "200,220,255" : "255,170,90"},${0.8 * tunnel}))` }} />;
      })}
      {u >= 0 ? <div style={{ position: "absolute", left: 960 - 1400 * ring, top: 540 - 1400 * ring, width: 2800 * ring, height: 2800 * ring, borderRadius: "50%", border: `${6 * (1 - ring) + 1}px solid rgba(200,220,255,${0.7 * (1 - ring)})` }} /> : null}
      <AbsoluteFill style={{ background: "#f4f0ff", opacity: flash }} />
    </AbsoluteFill>
  );
};
