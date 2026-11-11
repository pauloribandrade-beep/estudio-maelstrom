import React from "react";
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Check, Megaphone, Smartphone, Sparkles, User } from "lucide-react";
import { FONT } from "./overlays";
import { ZALE } from "./theme";
import { SEAM, Snd, SndSpan, STAGE } from "./palco";

import { TX } from "./textos";
// CENAS DE METÁFORA do vídeo "a paciente que nunca mais voltou" (padrão aprovado em 2026-09-28: objeto
// reconhecível + ação física em cada fala; ver cenas-metafora.tsx). Objetos que voltam no fim para fechar a
// história: o cartão de retorno (em branco -> preenchido), a lista de contatos (parada -> uma por uma) e a
// ficha da paciente (desbota -> volta a ter cor). Tempos em frames relativos à Sequence.

export const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
export const CX = 540;
export const CY = (STAGE.y0 + STAGE.y1) / 2;
const HAND = "'Segoe Print', 'Bradley Hand', 'Comic Sans MS', cursive";
export const PAPER = "#FBF7EE";
const WA_GREEN = "#005c4b";
export const sp = (f: number, fps: number, at = 0, k = { damping: 15, stiffness: 170, mass: 0.8 }) => (f < at ? 0 : spring({ frame: f - at, fps, config: k }));
const lock = (p: number) => (p > 0.997 ? 1 : p);
export const ease = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });

export const Stage: React.FC<{ life: number; children: (f: number, fps: number) => React.ReactNode }> = ({ life, children }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const out = interpolate(f, [life - 7, life], [1, 0], { ...clamp, easing: Easing.in(Easing.cubic) });
  return <AbsoluteFill style={{ height: SEAM, opacity: out, fontFamily: FONT, overflow: "hidden" }}>{children(f, fps)}</AbsoluteFill>;
};
export const Float: React.FC<{ f: number; amp?: number; children: React.ReactNode }> = ({ f, amp = 6, children }) => (
  <div style={{ position: "absolute", inset: 0, transform: `translate3d(0, ${(Math.sin(f / 24) * amp).toFixed(3)}px, 0)`, willChange: "transform", backfaceVisibility: "hidden" }}>{children}</div>
);
// texto aparecendo letra a letra (escrita/digitação), sem mexer no layout (o resto fica invisível)
const Typed: React.FC<{ text: string; f: number; at: number; dur: number; cursor?: boolean }> = ({ text, f, at, dur, cursor }) => {
  const n = Math.round(interpolate(f, [at, at + dur], [0, text.length], clamp));
  return (
    <>
      {text.slice(0, n)}
      {cursor && n < text.length && f >= at ? <span style={{ opacity: Math.floor(f / 8) % 2 ? 0 : 1 }}>|</span> : null}
      <span style={{ opacity: 0 }}>{text.slice(n)}</span>
    </>
  );
};
export const Label: React.FC<{ text: string; top: number; on: number; red?: boolean }> = ({ text, top, on, red }) => (
  <div style={{ position: "absolute", left: 0, right: 0, top, textAlign: "center", opacity: on, transform: `translateY(${(1 - on) * 14}px)` }}>
    <span style={{ background: red ? ZALE.red : "rgba(255,255,255,0.1)", color: "#fff", fontSize: 42, fontWeight: 800, padding: "10px 24px", borderRadius: 14 }}>{text}</span>
  </div>
);

// ============ 2. avaliação: 1 estrela "não gostou?" -> 5 estrelas ============
const StarSvg: React.FC<{ on: number; size: number }> = ({ on, size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.4l-5.9 3.2 1.3-6.6-4.9-4.6 6.6-.8z" fill={on > 0.5 ? "#fbbf24" : "rgba(255,255,255,0.12)"} stroke={on > 0.5 ? "#f59e0b" : "rgba(255,255,255,0.3)"} strokeWidth={1} />
  </svg>
);
export const StarFlip: React.FC<{ life: number; askAt?: number; flipAt: number; ask?: string; answer?: string }> = ({ life, askAt = 6, flipAt, ask = "não gostou?", answer = "não é isso" }) => (
  <Stage life={life}>
    {(f, fps) => {
      const on = sp(f, fps);
      const q = sp(f, fps, askAt);
      return (
        <Float f={f}>
          <div style={{ position: "absolute", left: CX - 380, top: CY - 190, width: 760, background: "#1c1c20", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 30, padding: "40px 40px 44px", opacity: on, transform: `translate3d(0, ${(1 - on) * 40}px, 0)`, boxShadow: "0 30px 80px rgba(0,0,0,0.6)" }}>
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 30, fontWeight: 700, textAlign: "center" }}>{TX.avaliacao}</div>
            <div style={{ display: "flex", justifyContent: "center", gap: 14, marginTop: 26 }}>
              {[0, 1, 2, 3, 4].map((k) => {
                const lit = k === 0 ? 1 : f >= flipAt + (k - 1) * 4 ? 1 : 0;
                const pop = k > 0 && f >= flipAt + (k - 1) * 4 ? 1 + 0.35 * Math.max(0, 1 - (f - flipAt - (k - 1) * 4) / 6) : 1;
                return (
                  <div key={k} style={{ transform: `scale(${pop.toFixed(3)})` }}>
                    <StarSvg on={lit} size={112} />
                    {k > 0 ? <Snd at={flipAt + (k - 1) * 4} name="tick" k="star" /> : null}
                  </div>
                );
              })}
            </div>
            <div style={{ position: "relative", height: 70, marginTop: 26, textAlign: "center", fontSize: 50, fontWeight: 900 }}>
              <span style={{ position: "absolute", left: 0, right: 0, color: "#fff", opacity: q * (f < flipAt ? 1 : 0), textDecoration: f >= flipAt ? "line-through" : "none" }}>{ask}</span>
              <span style={{ position: "absolute", left: 0, right: 0, color: ZALE.redBright, opacity: f >= flipAt + 14 ? sp(f, fps, flipAt + 14) : 0 }}>{answer}</span>
            </div>
          </div>
          <Snd at={2} name="pop" k="card-in" />
          <Snd at={askAt} name="tick" k="ask" />
          <Snd at={flipAt + 16} name="ding" k="stars-done" />
        </Float>
      );
    }}
  </Stage>
);

// ============ 3. pegadas que param: falta o próximo passo ============
const Foot: React.FC<{ right?: boolean; color: string; dashed?: boolean }> = ({ right, color, dashed }) => (
  <svg width={70} height={120} viewBox="0 0 70 120" style={{ transform: right ? "scaleX(-1)" : undefined }}>
    <path d="M35 42 C18 42 12 62 14 82 C16 104 26 116 38 116 C50 116 56 102 55 84 C54 64 50 42 35 42 Z" fill={dashed ? "none" : color} stroke={dashed ? color : "none"} strokeWidth={4} strokeDasharray={dashed ? "8 7" : undefined} />
    {[
      [14, 30, 9],
      [27, 20, 8],
      [40, 17, 7.5],
      [52, 20, 6.5],
      [61, 28, 5.5],
    ].map(([x, y, r], i) => (
      <circle key={i} cx={x} cy={y} r={r} fill={dashed ? "none" : color} stroke={dashed ? color : "none"} strokeWidth={3} strokeDasharray={dashed ? "5 5" : undefined} />
    ))}
  </svg>
);
export const Footsteps: React.FC<{ life: number; stepAt?: number; steps?: number; every?: number; gapAt: number; label?: string }> = ({ life, stepAt = 4, steps = 5, every = 9, gapAt, label = "próximo passo?" }) => (
  <Stage life={life}>
    {(f, fps) => {
      const pts = Array.from({ length: steps + 1 }, (_, i) => {
        const t = i / steps;
        return { x: 260 + t * 520 + (i % 2 ? 60 : -60), y: 790 - t * 470, r: i % 2 === 1 };
      });
      const gap = sp(f, fps, gapAt, { damping: 11, stiffness: 180, mass: 0.7 });
      const pulse = 1 + 0.07 * Math.sin((f - gapAt) / 4);
      return (
        <Float f={f} amp={4}>
          {pts.map((p, i) => {
            const last = i === steps;
            const on = last ? gap : sp(f, fps, stepAt + i * every, { damping: 18, stiffness: 220, mass: 0.6 });
            return (
              <div key={i} style={{ position: "absolute", left: p.x - 35, top: p.y - 60, opacity: on * (last ? 1 : 0.35 + 0.65 * (i + 1) / steps), transform: `rotate(28deg) scale(${(last ? gap * pulse : 0.8 + 0.2 * lock(on)) * 1.7})` }}>
                <Foot right={p.r} color={last ? ZALE.redBright : "#e8e2da"} dashed={last} />
                {last && gap > 0 ? <div style={{ position: "absolute", left: 16, top: 44, color: ZALE.redBright, fontSize: 56, fontWeight: 900, transform: "rotate(-28deg)" }}>?</div> : null}
                {/* passo de verdade (Kenney footstep_wood), alternando pé esquerdo/direito; o "tap" de 0,02 s quase não se ouvia */}
                {!last ? <Snd at={stepAt + i * every} name="step" v={i % 2 ? 1 : 3} /> : null}
              </div>
            );
          })}
          <Label text={label} top={pts[steps].y + 150} on={gap} red />
          <Snd at={gapAt} name="error" k="no-step" />
        </Float>
      );
    }}
  </Stage>
);

// ============ 4 e 12. cartão de retorno (em branco / preenchido e carimbado) ============
export const ReturnCard: React.FC<{
  life: number;
  fields?: { label: string; value?: string; at?: number; dur?: number; focusAt?: number }[];
  stampAt?: number;
  stamp?: string;
}> = ({ life, fields = [], stampAt, stamp = "marcado" }) => (
  <Stage life={life}>
    {(f, fps) => {
      const on = sp(f, fps, 0, { damping: 15, stiffness: 140, mass: 0.9 });
      const st = stampAt !== undefined ? sp(f, fps, stampAt, { damping: 10, stiffness: 230, mass: 0.6 }) : 0;
      const W = 820;
      return (
        <Float f={f}>
          <div style={{ position: "absolute", left: CX - W / 2, top: CY - 250, width: W, background: PAPER, borderRadius: 22, overflow: "hidden", boxShadow: "0 36px 90px rgba(0,0,0,0.6)", opacity: Math.min(1, on * 2), transform: `translate3d(0, ${(1 - on) * 60}px, 0) rotate(-1.5deg)` }}>
            <div style={{ background: ZALE.red, color: "#fff", padding: "22px 34px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 34, fontWeight: 900, letterSpacing: 3 }}>CARTÃO DE RETORNO</span>
              <Sparkles size={34} />
            </div>
            <div style={{ padding: "26px 40px 40px" }}>
              {fields.map((fl, i) => {
                const focus = fl.focusAt !== undefined && f >= fl.focusAt && !(fl.value && fl.at !== undefined && f >= fl.at);
                const blink = Math.floor(f / 9) % 2 === 0;
                return (
                  <div key={i} style={{ display: "flex", alignItems: "flex-end", gap: 18, height: 96, borderBottom: `3px ${focus ? "solid" : "dashed"} ${focus ? ZALE.red : "rgba(60,40,20,0.3)"}` }}>
                    <span style={{ width: 170, color: "rgba(20,20,20,0.55)", fontSize: 32, fontWeight: 800, paddingBottom: 12 }}>{fl.label}</span>
                    <span style={{ flex: 1, color: "#1d3a8a", fontFamily: HAND, fontSize: 46, paddingBottom: 8, whiteSpace: "nowrap", overflow: "hidden" }}>
                      {fl.value && fl.at !== undefined ? <Typed text={fl.value} f={f} at={fl.at} dur={fl.dur ?? 18} /> : null}
                      {focus && blink ? <span style={{ color: ZALE.red, fontFamily: FONT, fontWeight: 300 }}>|</span> : null}
                    </span>
                    {fl.value && fl.at !== undefined ? <SndSpan at={fl.at} dur={fl.dur ?? 18} name="write" vol={0.22} /> : null}
                    {fl.focusAt !== undefined ? <Snd at={fl.focusAt} name="click" k="field-focus" /> : null}
                  </div>
                );
              })}
            </div>
          </div>
          {stampAt !== undefined && st > 0 ? (
            <div style={{ position: "absolute", left: CX + 230, top: CY + 150, width: 210, height: 210, borderRadius: 105, border: `10px solid ${ZALE.red}`, color: ZALE.red, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", transform: `rotate(-14deg) scale(${st > 0.997 ? 1 : 1.8 - 0.8 * st})`, opacity: Math.min(1, st * 2) * 0.92, background: "rgba(251,247,238,0.6)" }}>
              <Check size={70} strokeWidth={4} />
              <div style={{ fontSize: 30, fontWeight: 900, letterSpacing: 1 }}>{stamp.toUpperCase()}</div>
            </div>
          ) : null}
          <Snd at={2} name="pop" k="card-in" />
          {stampAt !== undefined ? <Snd at={stampAt} name="thud" k="card-stamp" /> : null}
        </Float>
      );
    }}
  </Stage>
);

// ============ 5. meses passando + bateria "resultado" esvaziando ============
export const CalendarDrain: React.FC<{ life: number; months: string[]; pagesAt?: number; every?: number; drainAt?: number; drainDur?: number }> = ({ life, months, pagesAt = 4, every = 7, drainAt = 20, drainDur = 30 }) => (
  <Stage life={life}>
    {(f, fps) => {
      const on = sp(f, fps);
      const level = 1 - 0.9 * ease(f, drainAt, drainAt + drainDur);
      const col = level > 0.6 ? "#22c55e" : level > 0.3 ? "#f59e0b" : ZALE.redBright;
      const CWd = 380;
      return (
        <Float f={f}>
          {/* bloco de calendário */}
          <div style={{ position: "absolute", left: 120, top: CY - 230, width: CWd, height: 440, opacity: on }}>
            {months.map((m, i) => {
              const k = months.length - 1 - i; // a de cima é a primeira
              const tear = interpolate(f, [pagesAt + i * every, pagesAt + i * every + 12], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
              const isLast = i === months.length - 1;
              return (
                <div
                  key={m}
                  style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 10 + k,
                    background: "#fff",
                    borderRadius: 18,
                    boxShadow: "0 20px 50px rgba(0,0,0,0.45)",
                    transformOrigin: "50% 0%",
                    transform: isLast ? undefined : `translate3d(${(tear * 260).toFixed(1)}px, ${(-tear * 180).toFixed(1)}px, 0) rotate(${(tear * 38).toFixed(2)}deg)`,
                    opacity: isLast ? 1 : 1 - tear,
                    overflow: "hidden",
                  }}
                >
                  <div style={{ height: 110, background: ZALE.red, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 58, fontWeight: 900, letterSpacing: 4 }}>{m}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8, padding: 22 }}>
                    {Array.from({ length: 28 }).map((_, d) => (
                      <div key={d} style={{ height: 34, borderRadius: 6, background: "rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.35)", fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {d + 1}
                      </div>
                    ))}
                  </div>
                  {!isLast ? <Snd at={pagesAt + i * every} name="tick" k="month" /> : null}
                </div>
              );
            })}
          </div>
          {/* bateria do resultado */}
          <div style={{ position: "absolute", left: 640, top: CY - 230, width: 220, opacity: on, textAlign: "center" }}>
            <div style={{ margin: "0 auto", width: 70, height: 26, borderRadius: "10px 10px 0 0", background: "#555" }} />
            <div style={{ position: "relative", margin: "0 auto", width: 190, height: 360, borderRadius: 28, border: "8px solid #666", padding: 10 }}>
              <div style={{ position: "absolute", left: 10, right: 10, bottom: 10, height: `calc(${(level * 100).toFixed(1)}% - 20px * ${level.toFixed(3)})`, borderRadius: 14, background: col, boxShadow: `0 0 30px ${col}` }} />
            </div>
            <div style={{ color: "#fff", fontSize: 38, fontWeight: 800, marginTop: 18 }}>resultado</div>
          </div>
          <Snd at={drainAt + drainDur - 6} name="error" k="battery-low" />
        </Float>
      );
    }}
  </Stage>
);

// ============ 6. post-it ============
export const PostIt: React.FC<{ life: number; text: string; writeAt?: number; writeDur?: number }> = ({ life, text, writeAt = 6, writeDur = 30 }) => (
  <Stage life={life}>
    {(f, fps) => {
      const on = sp(f, fps, 0, { damping: 12, stiffness: 170, mass: 0.8 });
      return (
        <Float f={f}>
          <div style={{ position: "absolute", left: CX - 280, top: CY - 280, width: 560, height: 540, background: "linear-gradient(160deg, #fde68a, #facc15)", boxShadow: "0 30px 70px rgba(0,0,0,0.55)", transform: `rotate(-4deg) scale(${0.85 + 0.15 * lock(on)})`, opacity: Math.min(1, on * 2), padding: "90px 50px", fontFamily: HAND, color: "#3b2f0b", fontSize: 76, lineHeight: 1.2 }}>
            <div style={{ position: "absolute", left: 180, top: -22, width: 200, height: 56, background: "rgba(255,255,255,0.45)", transform: "rotate(3deg)" }} />
            <Typed text={text} f={f} at={writeAt} dur={writeDur} />
          </div>
          <Snd at={1} name="pop" k="postit" />
          <SndSpan at={writeAt} dur={writeDur} name="write" vol={0.25} />
        </Float>
      );
    }}
  </Stage>
);

// ============ 7. anúncio patrocinado de outra clínica -> agendou ============
export const SponsoredAd: React.FC<{ life: number; name?: string; postAt?: number; tapAt: number; bookedAt: number }> = ({ life, name = TX.outroNegocio, postAt = 4, tapAt, bookedAt }) => (
  <Stage life={life}>
    {(f, fps) => {
      const on = sp(f, fps);
      const post = sp(f, fps, postAt);
      const tap = interpolate(f, [tapAt, tapAt + 12], [0, 1], clamp);
      const sheet = sp(f, fps, bookedAt, { damping: 16, stiffness: 150, mass: 0.9 });
      const PW = 440;
      return (
        <Float f={f}>
          <div style={{ position: "absolute", left: CX - PW / 2, top: 170, width: PW, height: 720, borderRadius: 52, background: "#0d0d0d", border: "8px solid #2b2b2b", overflow: "hidden", opacity: on, boxShadow: "0 30px 80px rgba(0,0,0,0.7)" }}>
            <div style={{ height: 64, display: "flex", alignItems: "center", padding: "0 22px", color: "#fff", fontWeight: 800, fontSize: 26, borderBottom: "1px solid rgba(255,255,255,0.1)" }}>Início</div>
            <div style={{ opacity: post, transform: `translateY(${(1 - post) * 40}px)` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px" }}>
                <div style={{ width: 48, height: 48, borderRadius: 24, background: "linear-gradient(135deg,#f472b6,#fb923c)" }} />
                <div>
                  <div style={{ color: "#fff", fontWeight: 800, fontSize: 22 }}>{name}</div>
                  <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 17 }}>Patrocinado</div>
                </div>
              </div>
              <div style={{ height: 330, background: "linear-gradient(160deg,#f3d2c1,#d99a86)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14 }}>
                <Sparkles size={84} color="#fff" />
                <div style={{ color: "#fff", fontSize: 36, fontWeight: 900, textAlign: "center", textShadow: "0 2px 10px rgba(0,0,0,0.25)" }}>
                  agende sua
                  <br />
                  avaliação
                </div>
              </div>
              <div style={{ position: "relative", margin: 0, height: 64, background: tap > 0 ? "#2563eb" : "#1f2937", color: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 22px", fontWeight: 800, fontSize: 24, overflow: "hidden" }}>
                Agendar <span>›</span>
                {tap > 0 && tap < 1 ? <div style={{ position: "absolute", left: 80, top: 32, width: 40, height: 40, marginLeft: -20, marginTop: -20, borderRadius: 20, background: "rgba(255,255,255,0.5)", transform: `scale(${1 + tap * 10})`, opacity: 1 - tap }} /> : null}
              </div>
            </div>
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 230, background: "#1c1c1f", borderRadius: "30px 30px 0 0", transform: `translateY(${((1 - sheet) * 240).toFixed(1)}px)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
              <div style={{ width: 84, height: 84, borderRadius: 42, background: "#22c55e", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Check size={52} color="#fff" strokeWidth={3.5} />
              </div>
              <div style={{ color: "#fff", fontSize: 30, fontWeight: 800 }}>Agendado</div>
            </div>
          </div>
          <Snd at={postAt} name="pop" k="post-in" />
          <Snd at={tapAt} name="tap" k="ad-tap" />
          <Snd at={bookedAt} name="ding" k="ad-booked" />
        </Float>
      );
    }}
  </Stage>
);

// ============ 8. dois ponteiros caindo: preço e qualidade ============
const Gauge: React.FC<{ label: string; v: number }> = ({ label, v }) => {
  const R = 150;
  const ang = Math.PI * (1 - v); // v 1 = cheio (direita), 0 = vazio (esquerda)
  const nx = R + Math.cos(ang) * (R - 30);
  const ny = R - Math.sin(ang) * (R - 30);
  return (
    <div style={{ width: 2 * R + 20, textAlign: "center" }}>
      <svg width={2 * R + 20} height={R + 30} viewBox={`-10 -10 ${2 * R + 20} ${R + 30}`}>
        {[
          [0, 0.33, "#ef4444"],
          [0.33, 0.66, "#f59e0b"],
          [0.66, 1, "#22c55e"],
        ].map(([a, b, c], i) => {
          const a1 = Math.PI * (1 - (a as number));
          const a2 = Math.PI * (1 - (b as number));
          const p = (t: number) => `${R + Math.cos(t) * R},${R - Math.sin(t) * R}`;
          return <path key={i} d={`M${p(a1)} A${R},${R} 0 0 1 ${p(a2)}`} stroke={c as string} strokeWidth={22} fill="none" />;
        })}
        <line x1={R} y1={R} x2={nx} y2={ny} stroke="#fff" strokeWidth={10} strokeLinecap="round" />
        <circle cx={R} cy={R} r={16} fill="#fff" />
      </svg>
      <div style={{ color: "#fff", fontSize: 44, fontWeight: 900, marginTop: 6 }}>{label}</div>
    </div>
  );
};
export const TwoGauges: React.FC<{ life: number; labels?: [string, string]; dropAt: number; dropAt2: number; caption?: string }> = ({ life, labels = ["preço", "qualidade"], dropAt, dropAt2, caption }) => (
  <Stage life={life}>
    {(f, fps) => {
      const on = sp(f, fps);
      const v1 = 0.85 - 0.72 * sp(f, fps, dropAt, { damping: 9, stiffness: 120, mass: 0.8 });
      const v2 = 0.85 - 0.72 * sp(f, fps, dropAt2, { damping: 9, stiffness: 120, mass: 0.8 });
      return (
        <Float f={f}>
          <div style={{ position: "absolute", left: 0, right: 0, top: CY - 150, display: "flex", justifyContent: "center", gap: 60, opacity: on }}>
            <Gauge label={labels[0]} v={v1} />
            <Gauge label={labels[1]} v={v2} />
          </div>
          {caption ? <Label text={caption} top={CY + 180} on={sp(f, fps, dropAt2 + 6)} red /> : null}
          <Snd at={2} name="pop" k="card-in" />
          <Snd at={dropAt} name="switch" k="gauge" />
          <Snd at={dropAt2} name="switch" k="gauge" />
        </Float>
      );
    }}
  </Stage>
);

// ============ 9. lupa procurando pacientes novas ============
export const Magnifier: React.FC<{ life: number; label?: string }> = ({ life, label }) => (
  <Stage life={life}>
    {(f, fps) => {
      const on = sp(f, fps);
      const COLS = 9;
      const ROWS = 5;
      const gx = 100;
      const gy = 250;
      const cw = 880 / COLS;
      const ch = 560 / ROWS;
      const t = f / 30;
      const lx = CX + Math.sin(t * 1.1) * 300;
      const ly = CY + Math.sin(t * 1.7 + 1) * 170;
      return (
        <Float f={f} amp={3}>
          {Array.from({ length: COLS * ROWS }).map((_, i) => {
            const x = gx + (i % COLS) * cw + cw / 2;
            const y = gy + Math.floor(i / COLS) * ch + ch / 2;
            const d = Math.hypot(x - lx, y - ly);
            const lit = interpolate(d, [60, 150], [1, 0], clamp);
            return (
              <div key={i} style={{ position: "absolute", left: x - 32, top: y - 36, opacity: on * (0.25 + 0.75 * lit), transform: `scale(${1 + 0.35 * lit})` }}>
                <User size={64} color={lit > 0.5 ? "#fff" : "rgba(255,255,255,0.7)"} strokeWidth={2} />
              </div>
            );
          })}
          <div style={{ position: "absolute", left: lx - 120, top: ly - 120, width: 240, height: 240, borderRadius: 120, border: "14px solid #d4d4d8", boxShadow: "0 0 0 4px rgba(0,0,0,0.4), inset 0 0 40px rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.06)", opacity: on }}>
            <div style={{ position: "absolute", left: 190, top: 190, width: 34, height: 140, borderRadius: 14, background: "#8b5e34", transform: "rotate(-45deg)", transformOrigin: "50% 0%" }} />
          </div>
          {label ? <Label text={label} top={840} on={sp(f, fps, 6)} /> : null}
          <Snd at={3} name="glass" k="lens" />
          {label ? <Snd at={6} name="pop" k="label" /> : null}
        </Float>
      );
    }}
  </Stage>
);

// ============ 10 e 14. lista de contatos parada / uma por uma ============
const CONTACTS = ["Ana", "Beatriz", "Carla", "Daniela", "Fernanda", "Gabriela", "Helena", "Juliana", "Larissa", "Mariana", "Patrícia", "Renata", "Sofia", "Tatiana"];
const PREVIEW = ["Obrigada, doutora!", "Amei o resultado 😍", "Até a próxima!", "Foto", "Combinado!", "Obrigada pelo carinho", "Vou ver aqui e te aviso"];
export const ContactList: React.FC<{ life: number; pickAt?: number; pick?: number; note?: string; noteAt?: number; label?: string; labelAt?: number }> = ({
  life,
  pickAt,
  pick = 0,
  note,
  noteAt,
  label,
  labelAt = 10,
}) => (
  <Stage life={life}>
    {(f, fps) => {
      const on = sp(f, fps);
      const PW = 470;
      const scroll = pickAt === undefined ? interpolate(f, [8, life], [0, 320], { ...clamp, easing: Easing.inOut(Easing.quad) }) : 0;
      const up = pickAt !== undefined ? sp(f, fps, pickAt, { damping: 15, stiffness: 140, mass: 0.9 }) : 0;
      const nt = noteAt !== undefined ? sp(f, fps, noteAt, { damping: 12, stiffness: 180, mass: 0.7 }) : 0;
      const row = (i: number, lifted = false) => (
        <div style={{ display: "flex", alignItems: "center", gap: 16, height: 92, padding: "0 20px", borderBottom: lifted ? "none" : "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ width: 62, height: 62, borderRadius: 31, background: lifted ? ZALE.red : "#3a3a3f", color: "#fff", fontSize: 28, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>{CONTACTS[i][0]}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: lifted ? "#fff" : "rgba(255,255,255,0.75)", fontSize: 26, fontWeight: 800 }}>{CONTACTS[i]}</div>
            <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 20, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{PREVIEW[i % PREVIEW.length]}</div>
          </div>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 18, flex: "none" }}>{`${String(3 + (i * 5) % 9).padStart(2, "0")}/2025`}</div>
        </div>
      );
      return (
        <Float f={f}>
          <div style={{ position: "absolute", left: CX - PW / 2, top: 170, width: PW, height: 720, borderRadius: 52, background: "#111214", border: "8px solid #2b2b2b", overflow: "hidden", opacity: on, boxShadow: "0 30px 80px rgba(0,0,0,0.7)" }}>
            <div style={{ height: 76, display: "flex", alignItems: "center", padding: "0 24px", color: "#fff", fontWeight: 900, fontSize: 32, background: "#111214", position: "relative", zIndex: 2 }}>Conversas</div>
            <div style={{ transform: `translateY(${-scroll}px)`, filter: pickAt !== undefined ? `blur(${(up * 3).toFixed(2)}px)` : undefined, opacity: 1 - up * 0.5 }}>
              {CONTACTS.map((_, i) => (
                <div key={i} style={{ opacity: pickAt !== undefined && i === pick ? 1 - up : 1 }}>
                  {row(i)}
                </div>
              ))}
            </div>
          </div>
          {/* o contato escolhido sai da lista */}
          {pickAt !== undefined && up > 0 ? (
            <div style={{ position: "absolute", left: CX - 330, top: interpolate(up, [0, 1], [170 + 76 + pick * 92, CY - 150]), width: 660, background: "#1f2023", borderRadius: 26, boxShadow: "0 30px 80px rgba(0,0,0,0.7)", transform: `scale(${1 + 0.25 * up})`, border: `3px solid ${ZALE.red}` }}>
              {row(pick, true)}
            </div>
          ) : null}
          {note && noteAt !== undefined && nt > 0 ? (
            <div style={{ position: "absolute", left: CX - 250, top: CY + 30, width: 500, background: "linear-gradient(160deg, #fde68a, #facc15)", padding: "26px 30px", fontFamily: HAND, color: "#3b2f0b", fontSize: 44, lineHeight: 1.2, transform: `rotate(2deg) scale(${0.8 + 0.2 * lock(nt)})`, opacity: Math.min(1, nt * 2), boxShadow: "0 20px 50px rgba(0,0,0,0.5)" }}>
              <Typed text={note} f={f} at={noteAt} dur={Math.round(note.length * 1.1)} />
            </div>
          ) : null}
          {label ? <Label text={label} top={790} on={sp(f, fps, labelAt)} red /> : null}
          <Snd at={2} name="tick" k="phone-in" />
          {label ? <Snd at={labelAt} name="pop" k="label" /> : null}
          {pickAt !== undefined ? <Snd at={pickAt} name="pop" k="contact-pick" /> : null}
          {note && noteAt !== undefined ? <SndSpan at={noteAt} dur={Math.round(note.length * 1.1)} name="write" vol={0.22} /> : null}
        </Float>
      );
    }}
  </Stage>
);

// ============ 11. duas chaves ============
const KeySvg: React.FC<{ color: string }> = ({ color }) => (
  <svg width={320} height={120} viewBox="0 0 320 120">
    <circle cx={60} cy={60} r={50} fill={color} />
    <circle cx={60} cy={60} r={20} fill="#1a1a1a" />
    <rect x={104} y={48} width={200} height={24} rx={6} fill={color} />
    <rect x={240} y={70} width={20} height={36} rx={4} fill={color} />
    <rect x={272} y={70} width={20} height={26} rx={4} fill={color} />
  </svg>
);
export const TwoKeys: React.FC<{ life: number; at1: number; at2: number; focus?: 1 | 2; focusAt?: number; labels?: [string, string] }> = ({ life, at1, at2, focus, focusAt = 0, labels = [TX.momentoDaVenda, "pra quem sumiu"] }) => (
  <Stage life={life}>
    {(f, fps) => {
      const fo = focus ? sp(f, fps, focusAt) : 0;
      return (
        <Float f={f}>
          {focus ? <Snd at={focusAt} name="pop" k="key-focus" /> : null}
          {[0, 1].map((i) => {
            const d = sp(f, fps, i ? at2 : at1, { damping: 12, stiffness: 150, mass: 0.8 });
            // a chave entra na fechadura (desliza) e gira um pouco: de perfil inteiro ela sumia
            const turn = interpolate(f, [(i ? at2 : at1) + 10, (i ? at2 : at1) + 22], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
            const mine = focus === i + 1;
            const dim = focus && !mine ? fo : 0;
            return (
              <div key={i} style={{ position: "absolute", left: CX - 300, top: CY - 190 + i * 230, width: 600, height: 170, opacity: Math.min(1, d * 2) * (1 - dim * 0.7), transform: `translate3d(${((1 - d) * -200).toFixed(1)}px, 0, 0) scale(${1 + (mine ? 0.1 * fo : 0)})`, display: "flex", alignItems: "center", gap: 26 }}>
                <div style={{ width: 96, height: 96, borderRadius: 48, background: ZALE.red, color: "#fff", fontSize: 54, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>{i + 1}</div>
                <div style={{ transform: `perspective(600px) translateX(${((1 - turn) * -40).toFixed(1)}px) rotateX(${(turn * 38).toFixed(1)}deg)`, flex: "none" }}>
                  <KeySvg color="#e0b64a" />
                </div>
                <div style={{ position: "absolute", left: 130, top: 138, color: "rgba(255,255,255,0.85)", fontSize: 36, fontWeight: 800, whiteSpace: "nowrap", opacity: d }}>{labels[i]}</div>
                <Snd at={i ? at2 : at1} name="tick" k="key-in" />
                <Snd at={(i ? at2 : at1) + 10} name="click" k="key" />
              </div>
            );
          })}
        </Float>
      );
    }}
  </Stage>
);

// ============ 13. promoção em massa (proibida) ============
export const BroadcastBlocked: React.FC<{ life: number; blastAt: number; blockAt: number; text?: string }> = ({ life, blastAt, blockAt, text = "PROMOÇÃO" }) => (
  <Stage life={life}>
    {(f, fps) => {
      const on = sp(f, fps);
      const blk = sp(f, fps, blockAt, { damping: 11, stiffness: 200, mass: 0.7 });
      const phones = Array.from({ length: 12 });
      return (
        <Float f={f}>
          <div style={{ position: "absolute", inset: 0, opacity: on, filter: `grayscale(${(blk * 0.8).toFixed(2)})` }}>
            <div style={{ position: "absolute", left: 90, top: CY - 110, width: 220, height: 220, borderRadius: 40, background: "#27272a", display: "flex", alignItems: "center", justifyContent: "center", transform: `rotate(-8deg) scale(${1 + (f >= blastAt ? 0.06 * Math.abs(Math.sin((f - blastAt) / 3)) : 0)})` }}>
              <Megaphone size={140} color="#fff" strokeWidth={1.8} />
            </div>
            {[0, 1, 2].map((k) => {
              const t = f >= blastAt ? (((f - blastAt) / 20 + k / 3) % 1) : 0;
              return <div key={k} style={{ position: "absolute", left: 300 - 60 + t * 300, top: CY - 120 - t * 100, width: 120 + t * 200, height: 240 + t * 200, borderRadius: "0 50% 50% 0", borderRight: `8px solid rgba(240,58,30,${(1 - t) * 0.8})`, opacity: f >= blastAt ? 1 : 0 }} />;
            })}
            <div style={{ position: "absolute", left: 330, top: CY - 240, background: ZALE.red, color: "#fff", fontSize: 40, fontWeight: 900, padding: "8px 20px", borderRadius: 12, transform: "rotate(-6deg)", opacity: f >= blastAt ? 1 : 0 }}>{text}</div>
            <div style={{ position: "absolute", left: 600, top: CY - 230, display: "grid", gridTemplateColumns: "repeat(3, 110px)", gap: 18 }}>
              {phones.map((_, i) => {
                const hit = f >= blastAt + 4 + i * 2;
                return (
                  <div key={i} style={{ height: 130, borderRadius: 18, background: "#18181b", border: "3px solid #3f3f46", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                    <Smartphone size={46} color="rgba(255,255,255,0.5)" />
                    {hit ? <div style={{ position: "absolute", right: -8, top: -8, width: 30, height: 30, borderRadius: 15, background: ZALE.red, color: "#fff", fontSize: 18, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center" }}>1</div> : null}
                  </div>
                );
              })}
            </div>
          </div>
          {blk > 0 ? (
            <svg width={520} height={520} style={{ position: "absolute", left: CX - 260, top: CY - 260, transform: `scale(${blk > 0.997 ? 1 : 1.5 - 0.5 * blk})`, opacity: Math.min(1, blk * 2) }}>
              <circle cx={260} cy={260} r={220} fill="none" stroke={ZALE.red} strokeWidth={34} />
              <line x1={105} y1={105} x2={415} y2={415} stroke={ZALE.red} strokeWidth={34} strokeLinecap="round" />
            </svg>
          ) : null}
          <Snd at={blastAt} name="pop" k="blast" />
          {[0, 4, 8].map((i) => (
            <Snd key={i} at={blastAt + 4 + i * 2} name="tick" k="notif" />
          ))}
          <Snd at={blockAt} name="error" k="blast-no" />
        </Float>
      );
    }}
  </Stage>
);

// ============ 15. conversa com a Ana ============
export const WhatsChat: React.FC<{ life: number; contact?: string; text: string; typeAt?: number; typeDur: number; sentAt: number; readAt?: number; typingAt?: number }> = ({
  life,
  contact = "Ana",
  text,
  typeAt = 4,
  typeDur,
  sentAt,
  readAt,
  typingAt,
}) => (
  <Stage life={life}>
    {(f, fps) => {
      const on = sp(f, fps);
      const sent = sp(f, fps, sentAt, { damping: 15, stiffness: 200, mass: 0.7 });
      const read = readAt !== undefined && f >= readAt;
      const typing = typingAt !== undefined ? sp(f, fps, typingAt) : 0;
      const PW = 520;
      return (
        <Float f={f}>
          <div style={{ position: "absolute", left: CX - PW / 2, top: 170, width: PW, height: 720, borderRadius: 52, background: "#0b141a", border: "8px solid #2b2b2b", overflow: "hidden", opacity: on, boxShadow: "0 30px 80px rgba(0,0,0,0.7)" }}>
            <div style={{ height: 86, background: "#1f2c34", display: "flex", alignItems: "center", gap: 14, padding: "0 20px" }}>
              <div style={{ width: 56, height: 56, borderRadius: 28, background: ZALE.red, color: "#fff", fontSize: 28, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{contact[0]}</div>
              <div>
                <div style={{ color: "#fff", fontSize: 28, fontWeight: 800 }}>{contact}</div>
                <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 18 }}>{typing > 0.5 ? "digitando..." : "online"}</div>
              </div>
            </div>
            {/* mensagem enviada */}
            {sent > 0 ? (
              <div style={{ position: "absolute", right: 18, top: 110, maxWidth: 400, background: WA_GREEN, color: "#e9edef", fontSize: 25, lineHeight: 1.3, padding: "14px 16px 30px", borderRadius: "16px 4px 16px 16px", opacity: sent, transform: `translateY(${(1 - sent) * 30}px)` }}>
                {text}
                <div style={{ position: "absolute", right: 12, bottom: 6, fontSize: 15, color: read ? "#53bdeb" : "rgba(255,255,255,0.6)" }}>10:32 ✓✓</div>
              </div>
            ) : null}
            {typing > 0 ? (
              <div style={{ position: "absolute", left: 18, top: 470, background: "#1f2c34", borderRadius: "4px 16px 16px 16px", padding: "16px 22px", display: "flex", gap: 8, opacity: typing }}>
                {[0, 1, 2].map((k) => (
                  <div key={k} style={{ width: 12, height: 12, borderRadius: 6, background: "rgba(255,255,255,0.7)", transform: `translateY(${(Math.sin(f / 3 + k) * 4).toFixed(2)}px)` }} />
                ))}
              </div>
            ) : null}
            {/* caixa de texto digitando */}
            <div style={{ position: "absolute", left: 12, right: 12, bottom: 16, minHeight: 64, background: "#1f2c34", borderRadius: 32, padding: "14px 22px", color: "#e9edef", fontSize: 22, lineHeight: 1.3, maxHeight: 190, overflow: "hidden", display: "flex", alignItems: "flex-end" }}>
              <div style={{ width: "100%" }}>{f < sentAt ? <Typed text={text} f={f} at={typeAt} dur={typeDur} cursor /> : <span style={{ color: "rgba(255,255,255,0.4)" }}>Mensagem</span>}</div>
            </div>
          </div>
          <SndSpan at={typeAt} dur={typeDur} name="type" vol={0.2} />
          <Snd at={sentAt} name="pop" k="wa-send" />
          {readAt !== undefined ? <Snd at={readAt} name="tick" k="wa-read" /> : null}
          {typingAt !== undefined ? <Snd at={typingAt} name="pop" k="wa-typing" vol={0.25} /> : null}
        </Float>
      );
    }}
  </Stage>
);

// ============ 17. CTA: caixa de comentário ============
export const CommentCta: React.FC<{ life: number; question: string; hint?: string; hintAt?: number }> = ({ life, question, hint = "comenta aqui", hintAt = 20 }) => (
  <Stage life={life}>
    {(f, fps) => {
      const on = sp(f, fps);
      const h = sp(f, fps, hintAt);
      const bounce = Math.abs(Math.sin(f / 7)) * 14;
      return (
        <Float f={f}>
          <div style={{ position: "absolute", left: 90, right: 90, top: 210, color: "#fff", fontSize: 64, fontWeight: 900, textAlign: "center", lineHeight: 1.12, letterSpacing: -1, opacity: on, transform: `translateY(${(1 - on) * 20}px)` }}>{question}</div>
          <div style={{ position: "absolute", left: CX - 400, top: 600, width: 800, height: 110, borderRadius: 55, background: "#fff", display: "flex", alignItems: "center", gap: 20, padding: "0 30px", opacity: on, boxShadow: "0 24px 60px rgba(0,0,0,0.5)" }}>
            <div style={{ width: 64, height: 64, borderRadius: 32, background: "#e4e4e7", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <User size={38} color="#71717a" />
            </div>
            <div style={{ color: "#a1a1aa", fontSize: 34 }}>
              <span style={{ color: ZALE.red, opacity: Math.floor(f / 9) % 2 ? 0 : 1 }}>|</span> Adicione um comentário...
            </div>
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 750 + bounce, textAlign: "center", opacity: h }}>
            <span style={{ background: ZALE.red, color: "#fff", fontSize: 46, fontWeight: 900, padding: "12px 30px", borderRadius: 16 }}>{hint} ↑</span>
          </div>
          <Snd at={0} name="pop" k="cta" />
          <Snd at={hintAt} name="pop" k="label" />
        </Float>
      );
    }}
  </Stage>
);
