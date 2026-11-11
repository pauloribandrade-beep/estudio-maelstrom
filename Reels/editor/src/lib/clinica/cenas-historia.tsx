import React from "react";
import { Easing, interpolate } from "remotion";
import { Snd } from "../palco";
import { CX, Float, clamp, lock, sp } from "../cenas-metafora";
import { Chip, DStage, PAL } from "../cenas-dinamicas";
import { Clock, Copy, Heart, Music, ShieldCheck, UserPlus } from "lucide-react";
import { ZALE } from "../theme";
import { Bust, blinkAt } from "./personagens";

// CENAS COM A PERSONAGEM (a mesma paciente conta a história inteira). Ilustração feita em código com acabamento
// (personagens.tsx) + luz de cena, nuvem com volume, materiais (aço escovado, madeira) e câmera.

// luz de cena: um foco quente atrás do personagem (dá profundidade e separa do fundo)
const Spot: React.FC<{ x: number; y: number; r?: number; color?: string; o?: number }> = ({ x, y, r = 420, color = "255,214,170", o = 0.22 }) => (
  <div style={{ position: "absolute", left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: r, background: `radial-gradient(circle, rgba(${color},${o}) 0%, rgba(${color},0) 70%)` }} />
);

// nuvem de pensamento com volume (várias bolhas com degradê e sombra)
const Cloud: React.FC<{ x: number; y: number; w: number; h: number; t: number; on: number }> = ({ x, y, w, h, t, on }) => {
  const puffs = [
    [0.18, 0.62, 0.3],
    [0.36, 0.38, 0.36],
    [0.6, 0.32, 0.4],
    [0.82, 0.52, 0.3],
    [0.5, 0.7, 0.36],
    [0.28, 0.72, 0.26],
    [0.74, 0.74, 0.26],
  ];
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: "absolute", left: x, top: y, overflow: "visible", opacity: on, transform: `scale(${(0.6 + 0.4 * lock(on)).toFixed(3)})`, transformOrigin: "20% 90%" }}>
      <defs>
        <radialGradient id="cloudG" cx="40%" cy="30%" r="80%">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#dfe2f1" />
        </radialGradient>
        <filter id="cloudSh" x="-30%" y="-30%" width="160%" height="170%">
          <feDropShadow dx="0" dy="22" stdDeviation="20" floodColor="#000" floodOpacity="0.45" />
        </filter>
      </defs>
      <g filter="url(#cloudSh)">
        {puffs.map(([px, py, pr], k) => (
          <circle key={k} cx={px * w} cy={py * h + Math.sin(t / 18 + k) * 3} r={pr * h} fill="url(#cloudG)" />
        ))}
      </g>
    </svg>
  );
};

// ============ H1. ninguém ajudou ela a pensar em alguém ============
// A paciente olha para cima, pensativa; a nuvem de pensamento abre e rostos borrados passam sem se definir;
// em `emptyAt` a nuvem fica vazia e aparece a interrogação desenhada.
export const ThinkNoOne: React.FC<{ life: number; cloudAt?: number; ghostsAt?: number; emptyAt?: number }> = ({ life, cloudAt = 10, ghostsAt = 40, emptyAt = 110 }) => (
  <DStage life={life}>
    {(f, fps) => {
      const on = sp(f, fps, 0, { damping: 14, stiffness: 120, mass: 1 });
      const cl = sp(f, fps, cloudAt, { damping: 12, stiffness: 150, mass: 0.8 });
      const empty = interpolate(f, [emptyAt, emptyAt + 24], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
      const push = 1 + 0.05 * (f / life);
      const ghosts = [0, 1, 2];
      const ghostCycle = 30;
      return (
        <div style={{ position: "absolute", inset: 0, transformOrigin: "700px 380px", transform: `scale(${push.toFixed(4)})` }}>
          <Spot x={300} y={640} r={460} />
          <Float f={f} amp={3}>
            {/* bolhas que ligam a cabeça à nuvem */}
            {[0, 1, 2].map((k) => {
              const b = sp(f, fps, cloudAt - 8 + k * 3);
              return <div key={k} style={{ position: "absolute", left: 400 + k * 44, top: 470 - k * 52, width: 26 + k * 14, height: 26 + k * 14, borderRadius: 40, background: "radial-gradient(circle at 35% 30%, #fff, #dfe2f1)", boxShadow: "0 10px 20px rgba(0,0,0,0.35)", opacity: b, transform: `scale(${b.toFixed(3)})` }} />;
            })}
            <Cloud x={470} y={140} w={520} h={330} t={f} on={cl} />
            {/* rostos que passam pela cabeça dela sem se definir (borrados, sem cor) */}
            {cl > 0.5
              ? ghosts.map((k) => {
                  const local = f - ghostsAt - k * ghostCycle * 0.66;
                  const ph = ((local % (ghostCycle * 2)) + ghostCycle * 2) % (ghostCycle * 2);
                  const a = local < 0 ? 0 : Math.sin((ph / (ghostCycle * 2)) * Math.PI) * (1 - empty);
                  return (
                    <svg key={k} width={110} height={120} viewBox="0 0 110 120" style={{ position: "absolute", left: 580 + k * 115, top: 215 + (k % 2) * 34, opacity: a * 0.8, filter: `blur(${(3 + (1 - a) * 5).toFixed(1)}px)` }}>
                      <circle cx={55} cy={40} r={26} fill="#b8bfd9" />
                      <path d="M12,120 C14,86 34,72 55,72 C76,72 96,86 98,120 Z" fill="#b8bfd9" />
                    </svg>
                  );
                })
              : null}
            {/* a interrogação desenhada quando fica vazio */}
            {empty > 0 ? (
              <svg width={200} height={240} viewBox="0 0 100 120" style={{ position: "absolute", left: 640, top: 175, overflow: "visible" }}>
                <path d="M30,36 C30,14 70,10 72,34 C74,52 50,54 50,74" fill="none" stroke="#9aa3c7" strokeWidth={11} strokeLinecap="round" strokeDasharray={140} strokeDashoffset={140 * (1 - empty)} />
                <circle cx={50} cy={96} r={7} fill="#9aa3c7" opacity={empty > 0.8 ? (empty - 0.8) * 5 : 0} />
              </svg>
            ) : null}
            {/* a paciente */}
            <div style={{ position: "absolute", left: 60, top: 400 - (1 - on) * -60, opacity: Math.min(1, on * 1.5) }}>
              <Bust who="paciente" pose={{ t: f, blink: blinkAt(f, 7), lookX: 0.75, lookY: -0.85, brow: 0.5 - empty * 0.9, smile: 0.05 - empty * 0.35, tilt: -7 }} size={430} />
            </div>
          </Float>
          <Snd at={cloudAt} name="pop" k="cloud" />
          {ghosts.map((k) => (
            <Snd key={k} at={Math.round(ghostsAt + k * ghostCycle * 0.66 + ghostCycle / 2)} name="tick" file="tick.wav" vol={0.15} k="ghost" />
          ))}
          <Snd at={emptyAt} name="error" k="empty-thought" />
        </div>
      );
    }}
  </DStage>
);

// ============ H2. o "Claro!" fica no elevador ============
// Cabine iluminada, a paciente sorrindo diz "Claro!"; as portas de aço escovado fecham e o andar desce.
export const ElevatorScene: React.FC<{ life: number; claroAt?: number; closeAt?: number; floors?: number }> = ({ life, claroAt = 20, closeAt = 90, floors = 5 }) => (
  <DStage life={life}>
    {(f, fps) => {
      const on = sp(f, fps, 0, { damping: 14, stiffness: 120, mass: 1 });
      const cl = sp(f, fps, claroAt, { damping: 10, stiffness: 200, mass: 0.6 });
      const talk = f >= claroAt && f < claroAt + 12 ? Math.sin(((f - claroAt) / 12) * Math.PI) * 0.7 : 0;
      const close = interpolate(f, [closeAt, closeAt + 18], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
      const bump = f > closeAt + 18 ? Math.exp(-(f - closeAt - 18) / 4) * Math.sin((f - closeAt - 18) * 1.6) * 5 : 0;
      const floor = Math.max(0, floors - Math.floor(Math.max(0, f - closeAt - 20) / 9));
      const push = 1 + 0.06 * (f / life);
      const W = 600;
      const X = CX - W / 2;
      const T = 230;
      const H = 640;
      const sheen = ((f * 6) % 900) - 300;
      return (
        <div style={{ position: "absolute", inset: 0, transformOrigin: `${CX}px 520px`, transform: `scale(${push.toFixed(4)})`, opacity: Math.min(1, on * 1.4) }}>
          <Spot x={CX} y={520} r={520} color="255,236,200" o={0.14} />
          {/* moldura de pedra/metal com o painel */}
          <div style={{ position: "absolute", left: X - 56, top: T - 110, width: W + 112, height: H + 150, borderRadius: 22, background: "linear-gradient(180deg,#4a4f57,#2a2d33)", boxShadow: "0 50px 90px rgba(0,0,0,0.65), inset 0 2px 0 rgba(255,255,255,0.12)" }} />
          <div style={{ position: "absolute", left: CX - 95, top: T - 88, width: 190, height: 62, borderRadius: 12, background: "#070907", border: "3px solid #1b1d1b", display: "flex", alignItems: "center", justifyContent: "center", gap: 12, fontFamily: "ui-monospace, Consolas, monospace", fontSize: 44, fontWeight: 900, color: "#ff5a3c", textShadow: "0 0 12px #ff5a3c" }}>
            <span style={{ fontSize: 30, opacity: close > 0.5 ? 1 : 0.25 }}>▼</span>
            {floor}
          </div>
          {/* interior da cabine */}
          <div style={{ position: "absolute", left: X, top: T, width: W, height: H, overflow: "hidden", transform: `translateY(${bump.toFixed(2)}px)` }}>
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,#f3e6cf 0%,#d9c7a6 60%,#b9a585 100%)" }} />
            {/* painéis da parede e luz do teto */}
            {[0, 1, 2, 3].map((k) => (
              <div key={k} style={{ position: "absolute", left: 30 + k * 140, top: 40, width: 120, height: 470, borderRadius: 8, background: "linear-gradient(180deg,rgba(255,255,255,0.35),rgba(255,255,255,0.05))", boxShadow: "inset 0 0 0 2px rgba(120,90,50,0.18)" }} />
            ))}
            <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 22, background: "linear-gradient(#fffaf0,#e9dcc2)", boxShadow: "0 0 60px 30px rgba(255,244,214,0.7)" }} />
            <div style={{ position: "absolute", left: 20, right: 20, top: 400, height: 14, borderRadius: 7, background: "linear-gradient(#e6e6e6,#9a9a9a)", boxShadow: "0 6px 10px rgba(0,0,0,0.25)" }} />
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 90, background: "linear-gradient(#8f7d63,#6b5b45)" }} />
            <div style={{ position: "absolute", left: W / 2 - 205, top: 150 }}>
              <Bust who="paciente" pose={{ t: f, blink: blinkAt(f, 3), smile: 1, blush: 0.7, open: talk, lookX: 0.2, brow: 0.3 }} size={410} />
            </div>
            {cl > 0 ? (
              <div style={{ position: "absolute", left: W / 2 + 70, top: 90, padding: "18px 32px", background: "#fff", borderRadius: "34px 34px 34px 8px", fontSize: 56, fontWeight: 900, color: "#161616", boxShadow: "0 18px 36px rgba(0,0,0,0.35)", transform: `scale(${(0.5 + 0.5 * lock(cl)).toFixed(3)}) rotate(-3deg)`, transformOrigin: "0% 100%", opacity: Math.min(1, cl * 2) }}>
                Claro!
              </div>
            ) : null}
            {/* portas de aço escovado */}
            {[0, 1].map((k) => (
              <div
                key={k}
                style={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  width: W / 2 + 2,
                  left: k === 0 ? -W / 2 + (W / 2) * close : W - (W / 2) * close,
                  background: "repeating-linear-gradient(90deg, rgba(255,255,255,0.06) 0 2px, rgba(0,0,0,0.05) 2px 4px), linear-gradient(90deg,#8e979f,#dde2e6 40%,#a7b0b7 70%,#7d868d)",
                  boxShadow: k === 0 ? "inset -4px 0 0 rgba(0,0,0,0.35), 8px 0 18px rgba(0,0,0,0.25)" : "inset 4px 0 0 rgba(0,0,0,0.35), -8px 0 18px rgba(0,0,0,0.25)",
                  overflow: "hidden",
                }}
              >
                <div style={{ position: "absolute", top: -200, left: sheen - (k ? W / 2 : 0), width: 70, height: H + 400, background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.35), rgba(255,255,255,0))", transform: "rotate(14deg)" }} />
              </div>
            ))}
          </div>
          <div style={{ position: "absolute", left: X - 56, top: T + H, width: W + 112, height: 22, background: "linear-gradient(#5b6168,#2a2d33)", borderRadius: "0 0 22px 22px" }} />
          <Snd at={claroAt} name="pop" k="claro" />
          <Snd at={closeAt} name="switch" k="elevator" />
          <Snd at={closeAt + 18} name="thud" k="elevator-close" />
        </div>
      );
    }}
  </DStage>
);


// ---------- peças de desenho reutilizáveis ----------
const Twinkle: React.FC<{ x: number; y: number; s: number; t: number; phase?: number; color?: string }> = ({ x, y, s, t, phase = 0, color = "#fff6d6" }) => {
  const a = 0.5 + 0.5 * Math.sin(t / 6 + phase);
  return (
    <svg width={s} height={s} viewBox="0 0 20 20" style={{ position: "absolute", left: x - s / 2, top: y - s / 2, opacity: a, transform: `scale(${(0.7 + 0.5 * a).toFixed(3)}) rotate(${(t * 2 + phase * 30).toFixed(1)}deg)`, filter: `drop-shadow(0 0 6px ${color})` }}>
      <path d="M10,0 C11,7 13,9 20,10 C13,11 11,13 10,20 C9,13 7,11 0,10 C7,9 9,7 10,0 Z" fill={color} />
    </svg>
  );
};

// cápsula de medidor com vidro e brilho
const Meter: React.FC<{ x: number; y: number; w: number; label: string; icon: React.ReactNode; value: number; color: [string, string]; on: number; shake?: number; number?: string }> = ({ x, y, w, label, icon, value, color, on, shake = 0, number }) => (
  <div style={{ position: "absolute", left: x + shake, top: y, width: w, opacity: Math.min(1, on * 1.5), transform: `translateY(${((1 - on) * 30).toFixed(1)}px)` }}>
    <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#fff", fontSize: 34, fontWeight: 800, marginBottom: 14 }}>
      {icon}
      {label}
      {number !== undefined ? <span style={{ marginLeft: "auto", fontSize: 58, fontWeight: 900, color: value < 0.02 ? "#ff6a52" : "#fff" }}>{number}</span> : null}
    </div>
    <div style={{ position: "relative", height: 70, borderRadius: 35, background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.14))", boxShadow: "inset 0 4px 12px rgba(0,0,0,0.55), 0 20px 40px rgba(0,0,0,0.4)", border: "2px solid rgba(255,255,255,0.14)", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${Math.max(0, value) * 100}%`, borderRadius: 35, background: `linear-gradient(90deg, ${color[0]}, ${color[1]})`, boxShadow: `0 0 30px ${color[1]}88` }} />
      <div style={{ position: "absolute", left: 18, right: 18, top: 8, height: 16, borderRadius: 8, background: "linear-gradient(180deg, rgba(255,255,255,0.45), rgba(255,255,255,0))" }} />
      {value < 0.02 ? <div style={{ position: "absolute", inset: 10, borderRadius: 30, border: "3px dashed rgba(255,255,255,0.22)" }} /> : null}
    </div>
  </div>
);

// ============ H3. abertura: amou o resultado (cheio) x indicou (zero) ============
export const LoveMeters: React.FC<{ life: number; loveAt?: number; zeroAt?: number }> = ({ life, loveAt = 30, zeroAt = 80 }) => (
  <DStage life={life}>
    {(f, fps) => {
      const on = sp(f, fps, 0, { damping: 14, stiffness: 120, mass: 1 });
      const love = interpolate(f, [loveAt, loveAt + 26], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
      const z = sp(f, fps, zeroAt);
      const zt = f - zeroAt;
      const shake = zt >= 0 && zt < 16 ? Math.sin(zt * 2.2) * (16 - zt) * 0.9 : 0;
      const push = 1 + 0.05 * (f / life);
      return (
        <div style={{ position: "absolute", inset: 0, transformOrigin: "540px 520px", transform: `scale(${push.toFixed(4)})` }}>
          <Spot x={250} y={600} r={430} o={0.24} />
          <Float f={f} amp={3}>
            <div style={{ position: "absolute", left: 20, top: 360, opacity: Math.min(1, on * 1.4), transform: `translateY(${((1 - on) * 60).toFixed(1)}px)` }}>
              <Bust who="paciente" pose={{ t: f, blink: blinkAt(f, 11), smile: 0.4 + 0.6 * love, blush: love, lookX: 0.35, tilt: -3 + love * 4 }} size={420} />
            </div>
            {love > 0.05 ? [0, 1, 2, 3, 4].map((k) => <Twinkle key={k} x={[120, 360, 90, 380, 240][k]} y={[440, 420, 610, 620, 380][k]} s={[34, 26, 22, 30, 20][k]} t={f} phase={k * 1.7} />) : null}
            <Meter x={520} y={330} w={500} label="amou o resultado" value={love} color={["#ff7aa2", "#ff4d7e"]} on={sp(f, fps, loveAt - 6)} icon={<Heart size={40} color="#ff4d7e" fill="#ff4d7e" />} />
            <Meter x={520} y={560} w={500} label="indicou" value={0} color={[PAL.teal, PAL.teal]} on={z} shake={shake} number="0" icon={<UserPlus size={40} color="#9aa3ad" />} />
          </Float>
          <Snd at={loveAt + 20} name="ding" k="love-full" />
          <Snd at={zeroAt} name="error" k="zero" />
        </div>
      );
    }}
  </DStage>
);

// fachada de clínica desenhada (parede, vitrine acesa, toldo listrado, placa com cruz, porta)
const Clinic: React.FC<{ x: number; y: number; w: number; tint: string; on: number; t: number; k: number }> = ({ x, y, w, tint, on, t, k }) => {
  const h = w * 1.25;
  const flicker = 0.9 + 0.1 * Math.sin(t / 9 + k);
  return (
    <div style={{ position: "absolute", left: x, top: y - (1 - on) * 80, width: w, height: h, opacity: Math.min(1, on * 1.4) }}>
      <div style={{ position: "absolute", left: -w * 0.08, right: -w * 0.08, bottom: -18, height: 30, borderRadius: "50%", background: "rgba(0,0,0,0.5)", filter: "blur(10px)" }} />
      <div style={{ position: "absolute", inset: 0, borderRadius: "14px 14px 4px 4px", background: "linear-gradient(180deg,#f4efe6,#d6cdbd)", boxShadow: "inset -14px 0 0 rgba(0,0,0,0.07), 0 30px 50px rgba(0,0,0,0.45)" }} />
      {/* placa */}
      <div style={{ position: "absolute", left: w * 0.14, right: w * 0.14, top: h * 0.05, height: h * 0.14, borderRadius: 10, background: "#fff", boxShadow: "0 6px 14px rgba(0,0,0,0.2)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <svg width={w * 0.13} height={w * 0.13} viewBox="0 0 10 10">
          <path d="M3.5,0 H6.5 V3.5 H10 V6.5 H6.5 V10 H3.5 V6.5 H0 V3.5 H3.5 Z" fill={tint} />
        </svg>
        <span style={{ color: "#2a2a2a", fontSize: w * 0.12, fontWeight: 900 }}>clínica</span>
      </div>
      {/* toldo listrado */}
      <svg width={w} height={h * 0.13} viewBox={`0 0 ${w} 40`} preserveAspectRatio="none" style={{ position: "absolute", left: 0, top: h * 0.24 }}>
        {Array.from({ length: 7 }).map((_, i) => (
          <path key={i} d={`M${(i * w) / 7},0 H${((i + 1) * w) / 7} V28 Q${((i + 0.5) * w) / 7},40 ${(i * w) / 7},28 Z`} fill={i % 2 ? "#fff" : tint} />
        ))}
      </svg>
      {/* vitrine com luz quente */}
      <div style={{ position: "absolute", left: w * 0.1, width: w * 0.46, top: h * 0.42, height: h * 0.32, borderRadius: 6, background: `radial-gradient(circle at 40% 40%, rgba(255,226,170,${flicker}), rgba(214,170,110,0.9))`, border: "6px solid #b7ab98", boxShadow: "0 0 30px rgba(255,210,150,0.4)" }}>
        <div style={{ position: "absolute", left: "15%", bottom: 0, width: "30%", height: "55%", borderRadius: "40px 40px 0 0", background: "rgba(120,80,40,0.35)" }} />
      </div>
      {/* porta */}
      <div style={{ position: "absolute", right: w * 0.1, width: w * 0.26, top: h * 0.42, bottom: 0, background: "linear-gradient(90deg,#34485a,#4f677c)", border: "6px solid #b7ab98", borderBottom: "none", borderRadius: "6px 6px 0 0" }}>
        <div style={{ position: "absolute", right: 8, top: "50%", width: 8, height: 8, borderRadius: 4, background: "#e9c15b" }} />
      </div>
    </div>
  );
};

// ============ H4. a culpa não é dela: toda clínica pede do mesmo jeito (o mesmo bilhete, ao mesmo tempo) ============
export const SameWayStreet: React.FC<{ life: number; notFaultAt?: number; streetAt?: number; sameAt?: number }> = ({ life, notFaultAt = 12, streetAt = 50, sameAt = 150 }) => (
  <DStage life={life}>
    {(f, fps) => {
      const on = sp(f, fps, 0, { damping: 14, stiffness: 120, mass: 1 });
      const nf = sp(f, fps, notFaultAt);
      const back = interpolate(f, [streetAt, streetAt + 24], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
      const cols = [PAL.teal, "#f08a7e", PAL.violet];
      // o bilhete: sai das três portas no MESMO quadro e pula em sincronia
      const st = f - sameAt;
      const note = st >= 0 ? sp(f, fps, sameAt, { damping: 9, stiffness: 180, mass: 0.6 }) : 0;
      const hop = st >= 0 ? Math.abs(Math.sin(st / 7)) * 26 : 0;
      const same = sp(f, fps, sameAt + 10);
      const W = 290;
      return (
        <div style={{ position: "absolute", inset: 0 }}>
          {/* 1) ela, com luz dourada: a culpa não é dela */}
          <div style={{ position: "absolute", inset: 0, opacity: 1 - back, transform: `scale(${(1 - back * 0.35).toFixed(3)})`, transformOrigin: "540px 560px" }}>
            <Spot x={540} y={560} r={420} color="255,210,120" o={0.3} />
            <div style={{ position: "absolute", left: 540 - 200, top: 300, opacity: Math.min(1, on * 1.4) }}>
              <Bust who="paciente" pose={{ t: f, blink: blinkAt(f, 21), smile: 0.35, brow: 0.2 }} size={400} />
            </div>
            <div style={{ position: "absolute", left: 0, right: 0, top: 205, display: "flex", justifyContent: "center" }}>
              <Chip text="a culpa não é dela" on={nf} color={PAL.gold} icon={ShieldCheck} />
            </div>
          </div>
          {/* 2) a câmera recua: a rua de clínicas */}
          {back > 0 ? (
            <div style={{ position: "absolute", inset: 0, opacity: back, transform: `scale(${(1.25 - 0.25 * back).toFixed(3)})`, transformOrigin: "540px 600px" }}>
              <Spot x={540} y={620} r={600} color="255,220,170" o={0.12} />
              {[0, 1, 2].map((k) => (
                <React.Fragment key={k}>
                  <Clinic x={70 + k * (W + 45)} y={330} w={W} tint={cols[k]} on={sp(f, fps, streetAt + 4 + k * 5)} t={f} k={k} />
                  {note > 0 ? (
                    <div style={{ position: "absolute", left: 70 + k * (W + 45) + W * 0.62, top: 330 + W * 1.25 * 0.55 - 70 * note - hop, width: 86, height: 62, transform: `scale(${(0.4 + 0.6 * lock(note)).toFixed(3)}) rotate(-6deg)` }}>
                      <svg width={86} height={62} viewBox="0 0 86 62" style={{ filter: "drop-shadow(0 12px 14px rgba(0,0,0,0.45))" }}>
                        <rect x={2} y={2} width={82} height={58} rx={8} fill="#fffdf6" />
                        <path d="M2,10 L43,36 L84,10" fill="none" stroke="#d8cfbd" strokeWidth={4} />
                        <rect x={30} y={40} width={26} height={8} rx={4} fill={PAL.gold} />
                      </svg>
                    </div>
                  ) : null}
                </React.Fragment>
              ))}
              <div style={{ position: "absolute", left: 0, right: 0, top: 215, display: "flex", justifyContent: "center" }}>
                <Chip text="do mesmo jeito" on={same} color="#f08a7e" icon={Copy} />
              </div>
            </div>
          ) : null}
          <Snd at={notFaultAt} name="pop" k="nofault" />
          {[0, 1, 2].map((k) => (
            <Snd key={k} at={streetAt + 4 + k * 5} name="pop" k="clinic" />
          ))}
          <Snd at={sameAt} name="tick" file="tick.wav" vol={0.3} k="same-note" />
          <Snd at={sameAt + 10} name="pop" k="same-chip" />
        </div>
      );
    }}
  </DStage>
);

// ============ H5. conduzida (batuta de maestro) e começa pelo momento certo (cronômetro com a faixa dourada) ============
export const ConductClock: React.FC<{ life: number; batonAt?: number; clockAt?: number; momentAt?: number }> = ({ life, batonAt = 10, clockAt = 50, momentAt = 100 }) => (
  <DStage life={life}>
    {(f, fps) => {
      const b = interpolate(f, [batonAt, batonAt + 34], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
      const ck = sp(f, fps, clockAt, { damping: 13, stiffness: 140, mass: 0.9 });
      // o ponteiro gira e chega na faixa dourada exatamente no "momento certo"
      const GOLD = [300, 336]; // graus (0 = topo)
      const ang = interpolate(f, [clockAt, momentAt], [10, (GOLD[0] + GOLD[1]) / 2], { ...clamp, easing: Easing.inOut(Easing.cubic) });
      const m = sp(f, fps, momentAt, { damping: 10, stiffness: 180, mass: 0.7 });
      const CXk = 700;
      const CYk = 500;
      const R = 230;
      // rastro de luz da batuta (curva de regência)
      const path = "M160,700 C220,520 360,760 420,560 C470,400 560,520 600,470";
      const tipT = b;
      const bx = 160 + (600 - 160) * tipT;
      const by = 700 - 230 * Math.sin(tipT * Math.PI * 0.95) - 60 * tipT;
      const arc = (a0: number, a1: number, r: number) => {
        const p = (a: number) => [CXk + r * Math.sin((a * Math.PI) / 180), CYk - r * Math.cos((a * Math.PI) / 180)];
        const [x0, y0] = p(a0);
        const [x1, y1] = p(a1);
        return `M${CXk},${CYk} L${x0},${y0} A${r},${r} 0 0 1 ${x1},${y1} Z`;
      };
      return (
        <div style={{ position: "absolute", inset: 0, transformOrigin: `${CXk}px ${CYk}px`, transform: `scale(${(1 + 0.05 * (f / life)).toFixed(4)})` }}>
          <Spot x={CXk} y={CYk} r={420} color="255,210,120" o={0.18 + 0.2 * m} />
          <Float f={f} amp={3}>
            <svg width={1080} height={980} style={{ position: "absolute", left: 0, top: 0 }}>
              <defs>
                <linearGradient id="ribbon" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0" stopColor={PAL.teal} stopOpacity="0" />
                  <stop offset="1" stopColor={PAL.gold} />
                </linearGradient>
                <radialGradient id="clockFace" cx="45%" cy="40%" r="70%">
                  <stop offset="0" stopColor="#ffffff" />
                  <stop offset="1" stopColor="#dde3ea" />
                </radialGradient>
                <linearGradient id="clockRing" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#f3f5f7" />
                  <stop offset="0.5" stopColor="#8e98a2" />
                  <stop offset="1" stopColor="#d8dde2" />
                </linearGradient>
              </defs>
              <path d={path} fill="none" stroke="url(#ribbon)" strokeWidth={14} strokeLinecap="round" strokeDasharray={900} strokeDashoffset={900 * (1 - b)} style={{ filter: `drop-shadow(0 0 14px ${PAL.gold})` }} />
              {/* cronômetro */}
              <g opacity={Math.min(1, ck * 1.4)} transform={`translate(${CXk} ${CYk}) scale(${(0.6 + 0.4 * lock(ck)).toFixed(3)}) translate(${-CXk} ${-CYk})`}>
                <ellipse cx={CXk} cy={CYk + R + 40} rx={R * 0.9} ry={22} fill="rgba(0,0,0,0.45)" />
                <rect x={CXk - 34} y={CYk - R - 70} width={68} height={52} rx={12} fill="url(#clockRing)" />
                <rect x={CXk - 16} y={CYk - R - 30} width={32} height={30} fill="#9aa3ad" />
                <circle cx={CXk} cy={CYk} r={R + 26} fill="url(#clockRing)" />
                <circle cx={CXk} cy={CYk} r={R} fill="url(#clockFace)" />
                <path d={arc(GOLD[0], GOLD[1], R - 10)} fill={PAL.gold} opacity={0.55 + 0.45 * m} />
                {Array.from({ length: 60 }).map((_, i) => {
                  const a = (i * 6 * Math.PI) / 180;
                  const L2 = i % 5 === 0 ? 26 : 12;
                  return <line key={i} x1={CXk + (R - 14) * Math.sin(a)} y1={CYk - (R - 14) * Math.cos(a)} x2={CXk + (R - 14 - L2) * Math.sin(a)} y2={CYk - (R - 14 - L2) * Math.cos(a)} stroke="#3b4652" strokeWidth={i % 5 === 0 ? 6 : 3} strokeLinecap="round" />;
                })}
                <line x1={CXk} y1={CYk} x2={CXk + (R - 40) * Math.sin((ang * Math.PI) / 180)} y2={CYk - (R - 40) * Math.cos((ang * Math.PI) / 180)} stroke={ZALE.red} strokeWidth={9} strokeLinecap="round" />
                <circle cx={CXk} cy={CYk} r={18} fill={ZALE.red} />
                <circle cx={CXk} cy={CYk} r={7} fill="#fff" />
                <ellipse cx={CXk - 70} cy={CYk - 110} rx={120} ry={46} fill="rgba(255,255,255,0.35)" transform={`rotate(-30 ${CXk - 70} ${CYk - 110})`} />
              </g>
              {/* batuta */}
              {b > 0 && b < 1 ? (
                <g transform={`translate(${bx} ${by}) rotate(-35)`}>
                  <rect x={-6} y={-150} width={12} height={150} rx={6} fill="#f7f7f7" />
                  <rect x={-14} y={0} width={28} height={60} rx={12} fill="#b98a55" />
                  <circle cx={0} cy={-150} r={7} fill="#fff" style={{ filter: `drop-shadow(0 0 10px ${PAL.gold})` }} />
                </g>
              ) : null}
            </svg>
            <div style={{ position: "absolute", left: 90, top: 205 }}>
              <Chip text="conduzida" on={sp(f, fps, batonAt + 6)} color={PAL.teal} icon={Music} />
            </div>
            {m > 0 ? (
              <div style={{ position: "absolute", left: CXk - 150, top: CYk + R + 70, width: 300, display: "flex", justifyContent: "center" }}>
                <Chip text="momento certo" on={m} color={PAL.gold} icon={Clock} />
              </div>
            ) : null}
          </Float>
          <Snd at={batonAt} name="switch" k="baton" />
          {[0, 1, 2, 3].map((k) => (
            <Snd key={k} at={Math.round(clockAt + ((momentAt - clockAt) * (k + 1)) / 5)} name="tick" file="tick.wav" vol={0.14} k="clock" />
          ))}
          <Snd at={momentAt} name="ding" k="moment" />
        </div>
      );
    }}
  </DStage>
);

// ============ H6. o espelho: fala que amou, vê a evolução; nunca na reclamação ou na dúvida ============
export const MirrorStory: React.FC<{ life: number; loveAt?: number; glowAt?: number; complaintAt?: number; doubtAt?: number }> = ({ life, loveAt = 60, glowAt = 130, complaintAt = 210, doubtAt = 255 }) => (
  <DStage life={life}>
    {(f, fps) => {
      const on = sp(f, fps, 0, { damping: 14, stiffness: 120, mass: 1 });
      const love = sp(f, fps, loveAt);
      const glow = interpolate(f, [glowAt, glowAt + 24], [0, 1], clamp);
      const c1 = sp(f, fps, complaintAt);
      const c2 = sp(f, fps, doubtAt);
      const x1 = interpolate(f, [complaintAt + 14, complaintAt + 22], [0, 1], clamp);
      const x2 = interpolate(f, [doubtAt + 14, doubtAt + 22], [0, 1], clamp);
      const bad = Math.max(interpolate(f, [complaintAt - 4, complaintAt + 6], [0, 1], clamp), 0);
      // expressão: feliz -> franze (reclamação) -> dúvida
      const inDoubt = f >= doubtAt;
      const pose = {
        t: f,
        blink: blinkAt(f, 5),
        lookX: 0.8,
        smile: bad > 0 ? (inDoubt ? -0.1 : -0.55) : 0.5 + 0.5 * glow,
        brow: bad > 0 ? (inDoubt ? 0.7 : -0.8) : 0.25,
        blush: glow * (1 - bad),
        open: f >= loveAt && f < loveAt + 12 ? Math.sin(((f - loveAt) / 12) * Math.PI) * 0.6 : 0,
        tilt: inDoubt ? 6 : -2,
      };
      const MX = 610;
      const MY = 230;
      const MW = 380;
      const MH = 560;
      const sweep = ((f - glowAt) % 60) / 60;
      const Bubble2: React.FC<{ on: number; strike: number; y: number; children: React.ReactNode }> = ({ on: o, strike, y, children }) => (
        <div style={{ position: "absolute", left: 250, top: y, width: 170, height: 120, borderRadius: "60px 60px 60px 12px", background: "#fff", boxShadow: "0 20px 40px rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", opacity: Math.min(1, o * 1.5), transform: `scale(${(0.5 + 0.5 * lock(o)).toFixed(3)})`, transformOrigin: "0% 100%" }}>
          {children}
          {strike > 0 ? (
            <svg width={170} height={120} style={{ position: "absolute", left: 0, top: 0 }}>
              <line x1={20} y1={20} x2={20 + 130 * strike} y2={20 + 80 * strike} stroke={ZALE.red} strokeWidth={10} strokeLinecap="round" />
              <line x1={150} y1={20} x2={150 - 130 * strike} y2={20 + 80 * strike} stroke={ZALE.red} strokeWidth={10} strokeLinecap="round" />
            </svg>
          ) : null}
        </div>
      );
      return (
        <div style={{ position: "absolute", inset: 0, transformOrigin: "540px 520px", transform: `scale(${(1 + 0.05 * (f / life)).toFixed(4)})`, opacity: Math.min(1, on * 1.4) }}>
          <Spot x={300} y={620} r={420} o={0.2} />
          {/* espelho de parede */}
          <div style={{ position: "absolute", left: MX - 22, top: MY - 22, width: MW + 44, height: MH + 44, borderRadius: 190, background: "linear-gradient(135deg,#f6dc8e,#a67c1a 45%,#f6dc8e 70%,#8d6614)", boxShadow: "0 40px 80px rgba(0,0,0,0.6)" }} />
          <div style={{ position: "absolute", left: MX, top: MY, width: MW, height: MH, borderRadius: 170, overflow: "hidden", background: "linear-gradient(160deg,#dbe8ee,#9fb9c4)" }}>
            {/* o reflexo dela (espelhado), mais frio; ganha brilho na "evolução" */}
            <div style={{ position: "absolute", left: MW / 2 - 175, top: 150, transform: "scaleX(-1)", filter: `saturate(${(0.75 + 0.6 * glow).toFixed(2)}) brightness(${(0.92 + 0.18 * glow).toFixed(2)})` }}>
              <Bust who="paciente" pose={{ ...pose, lookX: 0.8 }} size={350} />
            </div>
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(160deg, rgba(255,255,255,0.18), rgba(255,255,255,0) 50%)" }} />
            {glow > 0 ? <div style={{ position: "absolute", left: -200 + sweep * 800, top: -120, width: 110, height: MH + 300, background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.6), rgba(255,255,255,0))", transform: "rotate(18deg)", opacity: glow * (1 - bad) }} /> : null}
          </div>
          {glow > 0 && bad < 0.5 ? [0, 1, 2, 3].map((k) => <Twinkle key={k} x={[MX + 60, MX + MW - 50, MX + 90, MX + MW - 80][k]} y={[MY + 120, MY + 200, MY + 420, MY + 470][k]} s={[34, 26, 24, 30][k]} t={f} phase={k * 1.9} />) : null}
          {/* ela */}
          <div style={{ position: "absolute", left: 20, top: 400 }}>
            <Bust who="paciente" pose={pose} size={400} />
          </div>
          {/* o que ela diz: amou (coração); depois reclamação e dúvida, riscadas */}
          {love > 0 && f < complaintAt - 4 ? (
            <Bubble2 on={love} strike={0} y={250}>
              <Heart size={70} color="#ff4d7e" fill="#ff4d7e" />
            </Bubble2>
          ) : null}
          {c1 > 0 && f < doubtAt - 4 ? (
            <Bubble2 on={c1} strike={x1} y={250}>
              <svg width={90} height={60} viewBox="0 0 90 60">
                <path d="M5,40 L20,15 L35,42 L50,12 L65,42 L85,18" fill="none" stroke="#c0392b" strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Bubble2>
          ) : null}
          {c2 > 0 ? (
            <Bubble2 on={c2} strike={x2} y={250}>
              <span style={{ fontSize: 90, fontWeight: 900, color: "#5b6b8c" }}>?</span>
            </Bubble2>
          ) : null}
          <div style={{ position: "absolute", left: 60, top: 185, display: "flex", gap: 12 }}>
            {f >= complaintAt ? <Chip text={inDoubt ? "dúvida" : "reclamação"} on={inDoubt ? c2 : c1} color={ZALE.red} strike={inDoubt ? x2 : x1} /> : null}
          </div>
          <Snd at={loveAt} name="pop" k="love" />
          <Snd at={glowAt} name="glass" k="mirror" />
          <Snd at={complaintAt} name="pop" k="bad-moment" />
          <Snd at={complaintAt + 14} name="tick" file="pen_stroke.wav" vol={0.35} k="pen" />
          <Snd at={doubtAt} name="pop" k="bad-moment" />
          <Snd at={doubtAt + 14} name="tick" file="pen_stroke.wav" vol={0.35} k="pen" />
        </div>
      );
    }}
  </DStage>
);
