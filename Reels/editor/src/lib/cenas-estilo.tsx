import React from "react";
import { Easing, Img, interpolate, staticFile } from "remotion";
import { Building2 } from "lucide-react";
import { Snd } from "./palco";
import { Float, clamp, lock, rnd, sp } from "./cenas-metafora";
import { Chip, DStage, PAL } from "./cenas-dinamicas";

// ESTILOS ADULTOS (2026-09-28: personagem cartunesca foi rejeitada). Duas linguagens:
//  A) "editorial com luz": pessoas como silhuetas de vidro sem rosto, ligadas por linhas de luz, com profundidade
//  B) "foto real + motion": foto de banco livre (Unsplash) com a mesma rede de luz e interface animadas por cima

// silhueta de vidro (cabeça + ombros), sem rosto; `lit` acende a borda
export const GlassPerson: React.FC<{ x: number; y: number; s: number; lit?: number; dim?: number; color?: string }> = ({ x, y, s, lit = 0, dim = 0, color = "#ffd9b0" }) => (
  <svg width={s} height={s * 1.1} viewBox="0 0 100 110" style={{ position: "absolute", left: x - s / 2, top: y - s * 0.55, overflow: "visible", opacity: 1 - dim * 0.65, filter: dim > 0 ? `blur(${(dim * 3).toFixed(1)}px)` : undefined }}>
    <defs>
      <linearGradient id={`gp-${Math.round(x)}-${Math.round(y)}`} x1="0.2" y1="0" x2="0.8" y2="1">
        <stop offset="0" stopColor="#ffffff" stopOpacity="0.32" />
        <stop offset="1" stopColor="#ffffff" stopOpacity="0.06" />
      </linearGradient>
    </defs>
    <circle cx={50} cy={32} r={22} fill={`url(#gp-${Math.round(x)}-${Math.round(y)})`} stroke={lit > 0 ? color : "rgba(255,255,255,0.35)"} strokeWidth={1.6 + lit * 1.6} style={{ filter: lit > 0 ? `drop-shadow(0 0 ${(8 * lit).toFixed(1)}px ${color})` : undefined }} />
    <path d="M10,110 C12,76 30,62 50,62 C70,62 88,76 90,110 Z" fill={`url(#gp-${Math.round(x)}-${Math.round(y)})`} stroke={lit > 0 ? color : "rgba(255,255,255,0.35)"} strokeWidth={1.6 + lit * 1.6} style={{ filter: lit > 0 ? `drop-shadow(0 0 ${(8 * lit).toFixed(1)}px ${color})` : undefined }} />
    <ellipse cx={42} cy={22} rx={8} ry={5} fill="rgba(255,255,255,0.35)" transform="rotate(-30 42 22)" />
  </svg>
);

// linha de luz entre dois pontos com um pulso andando por ela
const LightLine: React.FC<{ a: [number, number]; b: [number, number]; t: number; draw: number; color: string; pulse?: boolean; dashed?: boolean; fail?: number }> = ({ a, b, t, draw, color, pulse, dashed, fail = 0 }) => {
  const mx = (a[0] + b[0]) / 2;
  const my = Math.min(a[1], b[1]) - 60;
  const d = `M${a[0]},${a[1]} Q${mx},${my} ${b[0]},${b[1]}`;
  const L = 900;
  const p = (t % 40) / 40;
  const q = (u: number) => [(1 - u) * (1 - u) * a[0] + 2 * (1 - u) * u * mx + u * u * b[0], (1 - u) * (1 - u) * a[1] + 2 * (1 - u) * u * my + u * u * b[1]];
  const [px, py] = q(p);
  return (
    <g opacity={1 - fail}>
      <path d={d} fill="none" stroke={color} strokeWidth={dashed ? 3 : 6} strokeDasharray={dashed ? "10 12" : `${L}`} strokeDashoffset={dashed ? 0 : L * (1 - draw)} strokeLinecap="round" opacity={dashed ? draw * 0.7 : 1} style={{ filter: dashed ? undefined : `drop-shadow(0 0 10px ${color})` }} />
      {pulse && draw >= 1 ? <circle cx={px} cy={py} r={9} fill="#fff" style={{ filter: `drop-shadow(0 0 12px ${color})` }} /> : null}
    </g>
  );
};

// ============ A. abertura na rede de luz ============
export const OpenNetwork: React.FC<{ life: number; loveAt?: number; neverAt?: number; photo?: string }> = ({ life, loveAt = 30, neverAt = 80, photo }) => (
  <DStage life={life}>
    {(f, fps) => {
      const on = sp(f, fps, 0, { damping: 14, stiffness: 120, mass: 1 });
      const love = interpolate(f, [loveAt, loveAt + 18], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
      const never = f - neverAt;
      const tries = never >= 0 ? interpolate(never, [0, 16], [0, 1], clamp) : 0;
      const fail = never >= 20 ? interpolate(never, [20, 34], [0, 1], clamp) : 0;
      const P: [number, number] = [620, 520];
      const C: [number, number] = [190, 420];
      const friends: [number, number][] = [
        [880, 260],
        [960, 520],
        [860, 760],
        [470, 790],
        [700, 230],
      ];
      const push = 1 + 0.06 * (f / life);
      return (
        <div style={{ position: "absolute", inset: 0, transformOrigin: `${P[0]}px ${P[1]}px`, transform: `scale(${push.toFixed(4)})` }}>
          <div style={{ position: "absolute", left: P[0] - 380, top: P[1] - 380, width: 760, height: 760, borderRadius: 380, background: `radial-gradient(circle, rgba(255,190,150,${(0.12 + 0.14 * love).toFixed(3)}), rgba(255,190,150,0) 70%)` }} />
          <Float f={f} amp={3}>
            <svg width={1080} height={980} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
              <LightLine a={C} b={P} t={f} draw={love} color="#ff9f7a" pulse />
              {friends.map((fr, k) => (
                <LightLine key={k} a={P} b={fr} t={f} draw={tries} color="rgba(255,255,255,0.8)" dashed fail={fail} />
              ))}
            </svg>
            {/* a clínica */}
            <div style={{ position: "absolute", left: C[0] - 80, top: C[1] - 80, width: 160, height: 160, borderRadius: 40, background: "linear-gradient(145deg, rgba(255,255,255,0.18), rgba(255,255,255,0.04))", border: "1.5px solid rgba(255,255,255,0.3)", boxShadow: "0 30px 60px rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(6px)", opacity: Math.min(1, on * 1.4) }}>
              <Building2 size={80} color="#ffd2b8" strokeWidth={1.6} />
            </div>
            {/* amigas ao redor: apagadas, desfocadas (ficam mais longe) */}
            {friends.map((fr, k) => (
              <GlassPerson key={k} x={fr[0]} y={fr[1]} s={110 + rnd(k) * 30} dim={0.55 + rnd(k + 2) * 0.3} />
            ))}
            {/* ela: foto real (estilo B) ou silhueta de vidro (estilo A) */}
            {photo ? (
              <div style={{ position: "absolute", left: P[0] - 170, top: P[1] - 210, width: 340, height: 420, borderRadius: 40, overflow: "hidden", boxShadow: `0 40px 80px rgba(0,0,0,0.6), 0 0 0 3px rgba(255,190,150,${(0.3 + 0.6 * love).toFixed(2)}), 0 0 ${(50 * love).toFixed(0)}px rgba(255,160,120,0.6)`, opacity: Math.min(1, on * 1.4), transform: `scale(${(0.9 + 0.1 * lock(on)).toFixed(3)})` }}>
                <Img src={staticFile(photo)} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${(1.08 + 0.06 * (f / life)).toFixed(4)})` }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(0,0,0,0.35))" }} />
              </div>
            ) : (
              <GlassPerson x={P[0]} y={P[1]} s={260} lit={love} />
            )}
            <div style={{ position: "absolute", left: C[0] - 110, top: C[1] + 100, width: 220, display: "flex", justifyContent: "center" }}>
              <Chip text="amou o resultado" on={sp(f, fps, loveAt + 6)} color="#ff9f7a" />
            </div>
            <div style={{ position: "absolute", left: P[0] - 150, top: P[1] + 230, width: 300, display: "flex", justifyContent: "center" }}>
              <Chip text="nunca indicou" on={sp(f, fps, neverAt + 22)} color="#9aa3ad" />
            </div>
          </Float>
          <Snd at={loveAt} name="switch" k="love-line" />
          <Snd at={neverAt + 20} name="error" k="never" />
        </div>
      );
    }}
  </DStage>
);
