import React from "react";
import { Easing, interpolate } from "remotion";
import { Ban, Inbox, Mail, UserPlus, Building2, CalendarCheck, CircleCheck, Clock, Copy, Dice5, Heart, HeartHandshake, HelpCircle, MessageCircle, Navigation, Search, Send, ShieldCheck, Smile, Sparkles, Star, Stethoscope, Syringe, User, UserRound, Users } from "lucide-react";
import { ZALE } from "../theme";
import { SEAM, Snd, SndSpan } from "../palco";
import { CX, Float, clamp, lock, rnd, sp } from "../cenas-metafora";
import { Chip, DStage, Glass, PAL, Shadow, fromDepth } from "../cenas-dinamicas";

// CENAS DO VÍDEO "paciente que ama e não indica" (2026-09-28). Direção do usuário: cenas construídas em código (não
// emoji), profundidade por EFEITOS (câmera que chega de longe, aproxima devagar e mergulha na troca; desfoque de
// fundo; camadas com paralaxe; luz e sombra) e uma narrativa contínua do que está sendo dito.

// câmera da cena: chega de longe, aproxima devagar (`push`) e mergulha no fim, em direção ao ponto (fx, fy)
const Cam: React.FC<{ f: number; life: number; fx?: number; fy?: number; push?: number; children: React.ReactNode }> = ({ f, life, fx = CX, fy = 530, push = 0.05, children }) => {
  const arrive = interpolate(f, [0, 14], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const dive = interpolate(f, [life - 9, life], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const z = (0.86 + 0.14 * arrive) * (1 + push * (f / Math.max(1, life))) * (1 + dive * 1.3);
  const blur = (1 - arrive) * 8 + dive * 10;
  return (
    <div style={{ position: "absolute", inset: 0, transformOrigin: `${fx}px ${fy}px`, transform: `scale(${z.toFixed(4)})`, filter: blur > 0.2 ? `blur(${blur.toFixed(1)}px)` : undefined }}>
      {children}
    </div>
  );
};
const Scene: React.FC<{ life: number; floor?: boolean; fx?: number; fy?: number; push?: number; children: (f: number, fps: number) => React.ReactNode }> = ({ life, floor = true, fx, fy, push, children }) => (
  <DStage life={life} floor={floor}>
    {(f, fps) => (
      <Cam f={f} life={life} fx={fx} fy={fy} push={push}>
        {children(f, fps)}
      </Cam>
    )}
  </DStage>
);
const Bubble: React.FC<{ text: string; n?: number; left: number; top: number; w?: number; on: number; tail?: "left" | "right"; size?: number; dark?: boolean }> = ({ text, n, left, top, w = 520, on, tail = "left", size = 40, dark }) => (
  <div
    style={{
      position: "absolute",
      left,
      top,
      width: w,
      padding: "22px 30px",
      borderRadius: tail === "left" ? "34px 34px 34px 8px" : "34px 34px 8px 34px",
      background: dark ? "rgba(20,20,22,0.9)" : "#fff",
      color: dark ? "#fff" : "#141414",
      border: dark ? "2px solid rgba(255,255,255,0.18)" : undefined,
      fontSize: size,
      fontWeight: 800,
      lineHeight: 1.18,
      boxShadow: "0 30px 60px rgba(0,0,0,0.5)",
      ...fromDepth(on),
    }}
  >
    {n === undefined ? text : text.slice(0, n)}
  </div>
);

// ============ I1. amou, mas o contador de indicações não sai do zero ============
export const LoveNoReferral: React.FC<{ life: number; starsAt?: number; zeroAt?: number }> = ({ life, starsAt = 8, zeroAt = 80 }) => (
  <Scene life={life} fx={CX} fy={560}>
    {(f, fps) => {
      const on = sp(f, fps, 0, { damping: 14, stiffness: 130, mass: 0.9 });
      const z = sp(f, fps, zeroAt, { damping: 9, stiffness: 200, mass: 0.6 });
      const shake = f >= zeroAt && f < zeroAt + 14 ? Math.sin((f - zeroAt) * 2.3) * (14 - (f - zeroAt)) * 0.9 : 0;
      return (
        <Float f={f} amp={4}>
          <Shadow x={CX} y={900} w={520} />
          <div style={{ position: "absolute", left: CX - 250, top: 190, width: 500, height: 680, borderRadius: 60, background: "linear-gradient(160deg,#1c1c20,#0c0c0e)", border: "10px solid #2c2c31", boxShadow: "0 50px 100px rgba(0,0,0,0.7), inset 0 0 0 2px rgba(255,255,255,0.06)", overflow: "hidden", ...fromDepth(on) }}>
            {/* reflexo do vidro */}
            <div style={{ position: "absolute", left: -120, top: -80, width: 260, height: 900, background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.06), rgba(255,255,255,0))", transform: "rotate(18deg)" }} />
            <div style={{ padding: "60px 40px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 26 }}>
              <div style={{ width: 120, height: 120, borderRadius: 60, background: "linear-gradient(135deg,#f5b942,#e07b39)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 16px 30px rgba(245,185,66,0.35)" }}>
                <UserRound size={70} color="#1a1206" />
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                {[0, 1, 2, 3, 4].map((k) => {
                  const s = sp(f, fps, starsAt + k * 4, { damping: 10, stiffness: 220, mass: 0.5 });
                  return <Star key={k} size={62} color={PAL.gold} fill={s > 0.05 ? PAL.gold : "transparent"} strokeWidth={2} style={{ transform: `scale(${(0.6 + 0.4 * lock(s)).toFixed(3)})`, filter: s > 0.5 ? `drop-shadow(0 0 12px ${PAL.gold})` : undefined }} />;
                })}
              </div>
              <Heart size={70} color="#ff5c7a" fill="#ff5c7a" style={{ opacity: sp(f, fps, starsAt + 22), transform: `scale(${(1 + 0.08 * Math.sin(f / 5)).toFixed(3)})`, filter: "drop-shadow(0 0 16px rgba(255,92,122,0.6))" }} />
              <Glass tint="rgba(255,255,255,0.06)" style={{ position: "relative", width: 380, height: 150, borderRadius: 26, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 30px", boxSizing: "border-box", transform: `translateX(${shake.toFixed(1)}px)` }}>
                <span style={{ color: "rgba(255,255,255,0.75)", fontSize: 32, fontWeight: 800 }}>indicações</span>
                <span style={{ color: z > 0 ? ZALE.redBright : "#fff", fontSize: 92, fontWeight: 900, transform: `scale(${(1 + 0.25 * z * Math.exp(-(f - zeroAt) / 12)).toFixed(3)})` }}>0</span>
              </Glass>
            </div>
          </div>
          {[0, 1, 2, 3, 4].map((k) => (
            <Snd key={k} at={starsAt + k * 4} name="tick" file="tick.wav" vol={0.2} k="star" />
          ))}
          <Snd at={zeroAt} name="error" k="zero" />
        </Float>
      );
    }}
  </Scene>
);

// ============ I2. toda clínica pede do mesmo jeito: o mesmo balão, em fila até o fundo ============
export const SameAskQueue: React.FC<{ life: number; notFaultAt?: number; stackAt?: number; every?: number; n?: number; text?: string }> = ({ life, notFaultAt = 4, stackAt = 50, every = 4, n = 7, text = "indica a gente?" }) => (
  <Scene life={life} fx={CX} fy={420} push={0.08}>
    {(f, fps) => {
      const nf = sp(f, fps, notFaultAt);
      const nfOut = interpolate(f, [stackAt - 6, stackAt + 4], [0, 1], clamp);
      return (
        <Float f={f} amp={3}>
          {/* a paciente, sem culpa */}
          <div style={{ position: "absolute", left: 0, right: 0, top: 300, display: "flex", flexDirection: "column", alignItems: "center", gap: 20, opacity: 1 - nfOut, transform: `scale(${1 - nfOut * 0.3})` }}>
            <div style={{ width: 190, height: 190, borderRadius: 95, background: "linear-gradient(135deg,#f5b942,#e07b39)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 30px 60px rgba(0,0,0,0.5)", ...fromDepth(nf) }}>
              <UserRound size={110} color="#1a1206" />
            </div>
            <Chip text="a culpa não é dela" on={nf} color={PAL.gold} />
          </div>
          {/* fila de balões idênticos, cada um mais longe (menor, mais escuro, mais desfocado) */}
          {Array.from({ length: n })
            .map((_, k) => n - 1 - k)
            .map((k) => {
              const on = sp(f, fps, stackAt + k * every, { damping: 14, stiffness: 150, mass: 0.8 });
              if (on <= 0) return null;
              const depth = k / (n - 1);
              const s = 1.3 - depth * 0.85;
              const y = 640 - depth * 400;
              const x = CX + (k % 2 ? 1 : -1) * depth * 170;
              return (
                <div key={k} style={{ position: "absolute", left: x - 260 * s, top: y - 70 * s, width: 520 * s, opacity: Math.min(1, on * 1.5) * (1 - depth * 0.45), filter: `blur(${(depth * 5).toFixed(1)}px) brightness(${(1 - depth * 0.45).toFixed(2)})`, transform: `translateY(${((1 - on) * -60).toFixed(1)}px)` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 18 * s }}>
                    <div style={{ width: 90 * s, height: 90 * s, borderRadius: 22 * s, background: "rgba(255,255,255,0.1)", border: "2px solid rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                      <Building2 size={56 * s} color="#cfd8dc" />
                    </div>
                    <div style={{ flex: 1, background: "#fff", color: "#222", borderRadius: `${30 * s}px ${30 * s}px ${30 * s}px ${6 * s}px`, padding: `${16 * s}px ${22 * s}px`, fontSize: 38 * s, fontWeight: 800, boxShadow: "0 20px 40px rgba(0,0,0,0.45)" }}>{text}</div>
                  </div>
                </div>
              );
            })}
          <Snd at={notFaultAt} name="pop" k="nofault" />
          {Array.from({ length: n }).map((_, k) => (
            <Snd key={k} at={stackAt + k * every} name="pop" k="same-ask" vol={0.3} />
          ))}
        </Float>
      );
    }}
  </Scene>
);

// ============ I3. o pedido genérico se desfaz no ar ============
export const DissolveAsk: React.FC<{ life: number; text: string; typeAt?: number; dur?: number; dissolveAt?: number }> = ({ life, text, typeAt = 30, dur = 100, dissolveAt = 140 }) => (
  <Scene life={life} fx={CX} fy={470}>
    {(f, fps) => {
      const n = Math.round(interpolate(f, [typeAt, typeAt + dur], [0, text.length], clamp));
      const dz = f - dissolveAt;
      const on = sp(f, fps, 0);
      return (
        <Float f={f} amp={4}>
          <div style={{ position: "absolute", left: 90, top: 230, display: "flex", alignItems: "center", gap: 18, ...fromDepth(on) }}>
            <div style={{ width: 110, height: 110, borderRadius: 55, background: `linear-gradient(135deg, ${PAL.teal}, #0f766e)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Stethoscope size={62} color="#062b27" />
            </div>
            <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 32, fontWeight: 800 }}>no fim da consulta</span>
          </div>
          {dz < 0 ? (
            <Bubble text={text} n={n} left={90} top={380} w={900} on={on} size={48} />
          ) : (
            // cada letra voa para longe (sobe, gira, desfoca e some)
            <div style={{ position: "absolute", left: 120, top: 402, width: 840, fontSize: 48, fontWeight: 800, lineHeight: 1.18, color: "#fff" }}>
              {text.split("").map((ch, k) => {
                const t = Math.max(0, dz - rnd(k) * 8) / 26;
                return (
                  <span key={k} style={{ display: "inline-block", whiteSpace: "pre", opacity: Math.max(0, 1 - t), transform: `translate(${((rnd(k + 3) - 0.3) * 300 * t).toFixed(1)}px, ${(-260 * t - rnd(k + 5) * 80 * t).toFixed(1)}px) rotate(${((rnd(k + 7) - 0.5) * 120 * t).toFixed(1)}deg)`, filter: `blur(${(t * 6).toFixed(1)}px)` }}>
                    {ch}
                  </span>
                );
              })}
            </div>
          )}
          <SndSpan at={typeAt} dur={dur} name="type" vol={0.22} />
          <Snd at={dissolveAt} name="glass" k="dissolve" />
        </Float>
      );
    }}
  </Scene>
);

// ============ I4. o "claro" fica no elevador ============
export const ElevatorForget: React.FC<{ life: number; claroAt?: number; closeAt?: number; floors?: number }> = ({ life, claroAt = 20, closeAt = 90, floors = 5 }) => (
  <Scene life={life} fx={CX} fy={520} push={0.06}>
    {(f, fps) => {
      const on = sp(f, fps, 0, { damping: 14, stiffness: 130, mass: 0.9 });
      const cl = sp(f, fps, claroAt, { damping: 10, stiffness: 200, mass: 0.6 });
      const close = interpolate(f, [closeAt, closeAt + 16], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
      const floor = Math.max(0, floors - Math.floor(Math.max(0, f - closeAt - 10) / 8));
      const W = 560;
      const X = CX - W / 2;
      const T = 250;
      const H = 600;
      return (
        <Float f={f} amp={3}>
          <Shadow x={CX} y={T + H + 20} w={W + 120} />
          {/* moldura e painel */}
          <div style={{ position: "absolute", left: X - 40, top: T - 90, width: W + 80, height: H + 110, borderRadius: 18, background: "linear-gradient(#5b6168,#33373c)", boxShadow: "0 40px 80px rgba(0,0,0,0.6)", ...fromDepth(on) }}>
            <div style={{ position: "absolute", left: "50%", top: 18, transform: "translateX(-50%)", width: 150, height: 54, borderRadius: 10, background: "#0b0f0c", color: "#ff4b3a", fontFamily: "ui-monospace, Consolas, monospace", fontSize: 40, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, textShadow: "0 0 10px #ff4b3a" }}>
              {close > 0.5 ? "▼" : ""} {floor}
            </div>
          </div>
          {/* interior: a paciente feliz e o balão "Claro!" */}
          <div style={{ position: "absolute", left: X, top: T, width: W, height: H, overflow: "hidden", background: "linear-gradient(#d9d2c3,#a9a192)", ...fromDepth(on) }}>
            <div style={{ position: "absolute", left: W / 2 - 110, top: 250, width: 220, height: 220, borderRadius: 110, background: "linear-gradient(135deg,#f5b942,#e07b39)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <UserRound size={130} color="#1a1206" />
            </div>
            {cl > 0 ? (
              <div style={{ position: "absolute", left: W / 2 - 40, top: 110, background: "#fff", borderRadius: "30px 30px 30px 8px", padding: "16px 30px", fontSize: 52, fontWeight: 900, color: "#141414", boxShadow: "0 16px 30px rgba(0,0,0,0.35)", transform: `scale(${(0.5 + 0.5 * lock(cl)).toFixed(3)})`, opacity: cl }}>
                Claro!
              </div>
            ) : null}
            {/* portas de aço */}
            {[0, 1].map((k) => (
              <div
                key={k}
                style={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  width: W / 2 + 2,
                  left: k === 0 ? -W / 2 + (W / 2) * close : W - (W / 2) * close,
                  background: "linear-gradient(90deg,#9aa3ab,#e3e7ea 45%,#8d959c)",
                  boxShadow: k === 0 ? "inset -3px 0 0 rgba(0,0,0,0.3)" : "inset 3px 0 0 rgba(0,0,0,0.3)",
                }}
              />
            ))}
          </div>
          <Snd at={claroAt} name="pop" k="claro" />
          <Snd at={closeAt} name="switch" k="elevator" />
          <Snd at={closeAt + 16} name="thud" k="elevator-close" />
        </Float>
      );
    }}
  </Scene>
);

// ============ I5. ninguém ajudou a pensar em alguém: cabeça com o pensamento vazio ============
export const EmptyThought: React.FC<{ life: number; searchAt?: number; emptyAt?: number }> = ({ life, searchAt = 40, emptyAt = 100 }) => (
  <Scene life={life} fx={650} fy={420}>
    {(f, fps) => {
      const on = sp(f, fps, 0);
      const th = sp(f, fps, 12);
      const s = f - searchAt;
      const mx = 650 + Math.cos(s / 9) * 120;
      const my = 380 + Math.sin(s / 7) * 70;
      const q = sp(f, fps, emptyAt);
      return (
        <Float f={f} amp={4}>
          <svg width={1080} height={SEAM} style={{ position: "absolute", left: 0, top: 0, ...fromDepth(on) }}>
            <defs>
              <linearGradient id="headG" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#3a3f46" />
                <stop offset="1" stopColor="#1d2025" />
              </linearGradient>
            </defs>
            {/* perfil de cabeça (olhando para a direita) */}
            <path d="M190,860 L190,760 C150,720 120,650 125,560 C130,430 230,330 360,330 C480,330 560,410 575,520 L620,600 L585,615 L592,660 C592,700 560,715 520,712 L500,760 L500,860 Z" fill="url(#headG)" stroke="rgba(255,255,255,0.14)" strokeWidth={4} />
          </svg>
          {/* balão de pensamento vazio */}
          <div style={{ position: "absolute", left: 470, top: 200, width: 420, height: 300, borderRadius: "50%", background: "rgba(255,255,255,0.08)", border: "3px dashed rgba(255,255,255,0.35)", ...fromDepth(th) }} />
          {[0, 1, 2].map((k) => (
            <div key={k} style={{ position: "absolute", left: 470 - k * 38, top: 510 + k * 34, width: 34 - k * 8, height: 34 - k * 8, borderRadius: 20, background: "rgba(255,255,255,0.12)", border: "2px dashed rgba(255,255,255,0.3)", opacity: th }} />
          ))}
          {s > 0 ? (
            <div style={{ position: "absolute", left: mx - 40, top: my - 40, opacity: Math.min(1, s / 8) * (1 - q) }}>
              <Search size={80} color="#fff" strokeWidth={2.4} />
            </div>
          ) : null}
          {q > 0 ? (
            <div style={{ position: "absolute", left: 680 - 60, top: 350 - 90, fontSize: 170, fontWeight: 900, color: "rgba(255,255,255,0.8)", ...fromDepth(q) }}>?</div>
          ) : null}
          <Snd at={12} name="pop" k="thought" />
          <Snd at={searchAt} name="switch" k="search" />
          <Snd at={emptyAt} name="error" k="empty-thought" />
        </Float>
      );
    }}
  </Scene>
);

// ============ I6. linha do tempo da consulta: a câmera corre por ela e acende o momento certo ============
export const MomentTimeline: React.FC<{ life: number; drawAt?: number; momentAt?: number; label?: string }> = ({ life, drawAt = 10, momentAt = 100, label = "momento certo" }) => (
  <Scene life={life} fx={CX} fy={480} push={0.02}>
    {(f, fps) => {
      const draw = interpolate(f, [drawAt, momentAt], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
      const pan = interpolate(f, [drawAt, momentAt], [0, -(150 + 1500 * 0.9 - CX)], { ...clamp, easing: Easing.inOut(Easing.cubic) }); // termina com o momento certo no centro
      const m = sp(f, fps, momentAt, { damping: 10, stiffness: 180, mass: 0.7 });
      const icons = [CalendarCheck, Stethoscope, Syringe, Sparkles];
      const L = 1500;
      const Y = 520;
      const stops = [0.12, 0.38, 0.62, 0.9];
      return (
        <Float f={f} amp={3}>
          <div style={{ position: "absolute", left: 0, top: 0, width: 2200, height: SEAM, transform: `translateX(${pan.toFixed(1)}px)` }}>
            <div style={{ position: "absolute", left: 150, top: Y - 5, width: L, height: 10, borderRadius: 5, background: "rgba(255,255,255,0.12)" }} />
            <div style={{ position: "absolute", left: 150, top: Y - 5, width: L * draw, height: 10, borderRadius: 5, background: `linear-gradient(90deg, ${PAL.teal}, ${PAL.gold})`, boxShadow: `0 0 20px ${PAL.teal}88` }} />
            {stops.map((p, k) => {
              const I = icons[k];
              const lit = draw >= p;
              const gold = k === 3;
              return (
                <div key={k} style={{ position: "absolute", left: 150 + L * p - 60, top: Y - 60 }}>
                  <div style={{ width: 120, height: 120, borderRadius: 60, background: lit ? (gold ? `radial-gradient(circle, ${PAL.gold}, #b7791f)` : "rgba(45,212,191,0.2)") : "rgba(255,255,255,0.06)", border: `4px solid ${lit ? (gold ? PAL.gold : PAL.teal) : "rgba(255,255,255,0.15)"}`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: gold && m > 0 ? `0 0 ${(60 * m).toFixed(0)}px ${PAL.gold}` : "0 20px 40px rgba(0,0,0,0.45)", transform: `scale(${gold ? 1 + 0.25 * m : 1})` }}>
                    <I size={60} color={lit ? (gold ? "#2a1a02" : PAL.teal) : "rgba(255,255,255,0.4)"} />
                  </div>
                </div>
              );
            })}
            {m > 0 ? (
              <div style={{ position: "absolute", left: 150 + L * 0.9, top: Y + 110, transform: "translateX(-50%)" }}>
                <Chip text={label} on={m} color={PAL.gold} />
              </div>
            ) : null}
          </div>
          {stops.slice(0, 3).map((p, k) => (
            <Snd key={k} at={Math.round(drawAt + (momentAt - drawAt) * p)} name="tick" file="tick.wav" vol={0.2} k="tl-stop" />
          ))}
          <Snd at={momentAt} name="ding" k="moment" />
        </Float>
      );
    }}
  </Scene>
);

// ============ I7. o espelho: amou / evolução; nunca na reclamação ou dúvida ============
export const MirrorMoment: React.FC<{ life: number; loveAt?: number; mirrorAt?: number; complaintAt?: number; doubtAt?: number }> = ({ life, loveAt = 60, mirrorAt = 130, complaintAt = 210, doubtAt = 250 }) => (
  <Scene life={life} fx={380} fy={500} push={0.03}>
    {(f, fps) => {
      const on = sp(f, fps, 0, { damping: 14, stiffness: 130, mass: 0.9 });
      const love = sp(f, fps, loveAt);
      const mir = interpolate(f, [mirrorAt, mirrorAt + 30], [0, 1], clamp);
      const c1 = sp(f, fps, complaintAt);
      const c2 = sp(f, fps, doubtAt);
      const x1 = interpolate(f, [complaintAt + 10, complaintAt + 18], [0, 1], clamp);
      const x2 = interpolate(f, [doubtAt + 10, doubtAt + 18], [0, 1], clamp);
      const sweep = ((f - mirrorAt) % 50) / 50;
      return (
        <Float f={f} amp={4}>
          <Shadow x={380} y={880} w={380} />
          {/* espelho oval com moldura dourada */}
          <div style={{ position: "absolute", left: 200, top: 190, width: 360, height: 620, borderRadius: "50%", padding: 22, background: "linear-gradient(135deg,#f3d27a,#a67c1a 60%,#f3d27a)", boxShadow: "0 40px 80px rgba(0,0,0,0.6)", ...fromDepth(on) }}>
            <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: "50%", overflow: "hidden", background: "linear-gradient(160deg,#cfe3ea,#8fb0bd)" }}>
              <div style={{ position: "absolute", left: "50%", top: "46%", transform: "translate(-50%,-50%)", width: 170, height: 170, borderRadius: 85, background: "linear-gradient(135deg,#f5b942,#e07b39)", display: "flex", alignItems: "center", justifyContent: "center", filter: `saturate(${1 + mir}) brightness(${1 + 0.15 * mir})` }}>
                <UserRound size={100} color="#1a1206" />
              </div>
              {/* brilho passando no vidro (a evolução) */}
              {mir > 0 ? <div style={{ position: "absolute", left: -200 + sweep * 600, top: -100, width: 90, height: 900, background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.55), rgba(255,255,255,0))", transform: "rotate(20deg)", opacity: mir }} /> : null}
              {mir > 0
                ? [0, 1, 2].map((k) => {
                    const t = ((f - mirrorAt + k * 14) % 40) / 40;
                    return <Sparkles key={k} size={50} color="#fff" style={{ position: "absolute", left: 40 + k * 90, top: 120 + (k % 2) * 260, opacity: Math.sin(t * Math.PI) * mir, transform: `scale(${(0.6 + 0.6 * t).toFixed(2)})` }} />;
                  })
                : null}
            </div>
          </div>
          {love > 0 ? (
            <div style={{ position: "absolute", left: 480, top: 220, display: "flex", alignItems: "center", gap: 10, background: "#fff", color: "#141414", padding: "14px 26px", borderRadius: "30px 30px 30px 8px", fontSize: 40, fontWeight: 900, boxShadow: "0 20px 40px rgba(0,0,0,0.45)", ...fromDepth(love) }}>
              <Heart size={40} color="#ff5c7a" fill="#ff5c7a" /> amou
            </div>
          ) : null}
          <div style={{ position: "absolute", left: 590, top: 470, display: "flex", flexDirection: "column", gap: 22 }}>
            <Chip text="reclamação" on={c1} color={ZALE.red} strike={x1} icon={MessageCircle} />
            <Chip text="dúvida" on={c2} color={ZALE.red} strike={x2} icon={MessageCircle} />
          </div>
          <Snd at={loveAt} name="pop" k="love" />
          <Snd at={mirrorAt} name="glass" k="mirror" />
          <Snd at={complaintAt} name="pop" k="bad-moment" />
          <Snd at={complaintAt + 10} name="tick" file="pen_stroke.wav" vol={0.35} k="pen" />
          <Snd at={doubtAt} name="pop" k="bad-moment" />
          <Snd at={doubtAt + 10} name="tick" file="pen_stroke.wav" vol={0.35} k="pen" />
        </Float>
      );
    }}
  </Scene>
);

// ============ I8. uma pessoa específica entra em foco no meio da multidão ============
export const CrowdFocus: React.FC<{ life: number; focusAt?: number; askAt?: number; askDur?: number; ask?: string }> = ({ life, focusAt = 100, askAt = 170, askDur = 70, ask = "Você conhece alguma amiga que também está querendo melhorar isso?" }) => (
  <Scene life={life} fx={CX} fy={470} push={0.06}>
    {(f, fps) => {
      const focus = interpolate(f, [focusAt, focusAt + 20], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
      const aOn = sp(f, fps, askAt);
      const n = Math.round(interpolate(f, [askAt, askAt + askDur], [0, ask.length], clamp));
      const people = Array.from({ length: 14 }).map((_, k) => ({ x: 90 + (k % 7) * 150 + (Math.floor(k / 7) ? 75 : 0), y: Math.floor(k / 7) ? 520 : 400, d: Math.floor(k / 7) ? 0.2 : 0.6, k }));
      const target = 10;
      return (
        <Float f={f} amp={3}>
          {people.map((p) => {
            const me = p.k === target;
            const on = sp(f, fps, 4 + p.k * 1.5);
            const blur = me ? (1 - focus) * 7 : 7 + p.d * 4 + focus * 3;
            const s = (1 - p.d * 0.4) * (me ? 1 + 0.35 * focus : 1);
            return (
              <div key={p.k} style={{ position: "absolute", left: p.x - 60 * s, top: p.y - 60 * s + (me ? -40 * focus : 0), width: 120 * s, height: 120 * s, borderRadius: 60 * s, background: me && focus > 0.3 ? "linear-gradient(135deg,#a78bfa,#6d28d9)" : "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", filter: `blur(${blur.toFixed(1)}px)`, opacity: on * (me ? 1 : 1 - focus * 0.5), boxShadow: me && focus > 0.5 ? `0 0 0 ${(8 * focus).toFixed(1)}px rgba(167,139,250,0.35), 0 30px 60px rgba(0,0,0,0.5)` : undefined, zIndex: me ? 3 : 1 }}>
                <User size={70 * s} color={me && focus > 0.3 ? "#1b0b3a" : "rgba(255,255,255,0.7)"} />
              </div>
            );
          })}
          {focus > 0.6 ? (
            <div style={{ position: "absolute", left: people[target].x - 110, top: people[target].y + 70 }}>
              <Chip text="uma pessoa específica" on={sp(f, fps, focusAt + 14)} color={PAL.violet} />
            </div>
          ) : null}
          {aOn > 0 ? <Bubble text={ask} n={n} left={120} top={700} w={840} on={aOn} size={38} /> : null}
          {[0, 3, 6, 9, 12].map((k) => (
            <Snd key={k} at={Math.round(4 + k * 1.5)} name="tick" file="tick.wav" vol={0.14} k="crowd" />
          ))}
          <Snd at={focusAt} name="switch" k="focus" />
          <SndSpan at={askAt} dur={askDur} name="type" vol={0.22} />
        </Float>
      );
    }}
  </Scene>
);

// ============ I9. "quem veio na sua cabeça?": o cartão de contato surge no pensamento ============
export const ThoughtContact: React.FC<{ life: number; smileAt?: number; askAt?: number; cardAt?: number }> = ({ life, smileAt = 18, askAt = 60, cardAt = 80 }) => (
  <Scene life={life} fx={650} fy={420} push={0.06}>
    {(f, fps) => {
      const on = sp(f, fps, 0);
      const sm = sp(f, fps, smileAt);
      const ask = sp(f, fps, askAt);
      const card = sp(f, fps, cardAt, { damping: 11, stiffness: 170, mass: 0.7 });
      return (
        <Float f={f} amp={4}>
          <div style={{ position: "absolute", left: 90, top: 520, width: 230, height: 230, borderRadius: 115, background: "linear-gradient(135deg,#f5b942,#e07b39)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 30px 60px rgba(0,0,0,0.5)", ...fromDepth(on) }}>
            <UserRound size={130} color="#1a1206" />
          </div>
          {/* o sorriso: sem desenhar boca no boneco (ficava tosco). A paciente "acende" (anel de luz quente que
              se abre) e o chip com o ícone de sorriso aparece embaixo dela */}
          {sm > 0 ? (
            <div
              style={{
                position: "absolute",
                left: 205 - 115 - 40 * lock(sm),
                top: 635 - 115 - 40 * lock(sm),
                width: 230 + 80 * lock(sm),
                height: 230 + 80 * lock(sm),
                borderRadius: 999,
                border: `5px solid rgba(255,208,110,${(0.95 - 0.35 * lock(sm)).toFixed(2)})`,
                boxShadow: `0 0 ${(70 * sm).toFixed(0)}px 12px rgba(245,185,66,0.5), inset 0 0 ${(40 * sm).toFixed(0)}px rgba(245,185,66,0.35)`,
                pointerEvents: "none",
              }}
            />
          ) : null}
          <div style={{ position: "absolute", left: 0, top: 800, width: 410, display: "flex", justifyContent: "center", whiteSpace: "nowrap" }}>
            <Chip text="ela sorri" on={sm} color={PAL.gold} icon={Smile} />
          </div>
          {[0, 1, 2].map((k) => (
            <div key={k} style={{ position: "absolute", left: 330 + k * 34, top: 500 - k * 44, width: 26 + k * 10, height: 26 + k * 10, borderRadius: 30, background: "rgba(255,255,255,0.85)", opacity: sp(f, fps, cardAt - 12 + k * 3) }} />
          ))}
          {/* nuvem de pensamento com o cartão */}
          <div style={{ position: "absolute", left: 440, top: 190, width: 560, height: 330, borderRadius: 170, background: "#fff", boxShadow: "0 30px 70px rgba(0,0,0,0.5)", ...fromDepth(card) }}>
            <div style={{ position: "absolute", left: 60, top: 70, right: 60, height: 190, borderRadius: 26, background: "linear-gradient(135deg,#ede9fe,#ddd6fe)", display: "flex", alignItems: "center", gap: 26, padding: "0 30px", boxSizing: "border-box" }}>
              <div style={{ width: 120, height: 120, borderRadius: 60, background: "linear-gradient(135deg,#a78bfa,#6d28d9)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                <User size={70} color="#fff" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ height: 22, width: "80%", borderRadius: 11, background: "#6d28d9", marginBottom: 16 }} />
                <div style={{ height: 16, width: "55%", borderRadius: 8, background: "#a78bfa" }} />
              </div>
            </div>
          </div>
          {ask > 0 ? <Bubble text="Quem veio na sua cabeça?" left={520} top={600} w={480} on={ask} tail="right" size={40} dark /> : null}
          <Snd at={smileAt} name="pop" k="smile" />
          <Snd at={askAt} name="pop" k="ask" />
          {[0, 1, 2].map((k) => (
            <Snd key={k} at={cardAt - 12 + k * 3} name="tick" file="tick.wav" vol={0.18} k="thought-dot" />
          ))}
          <Snd at={cardAt} name="ding" k="contact" />
        </Float>
      );
    }}
  </Scene>
);

// ============ I10. a ponte entre as duas; depois a mensagem pronta e o grupo de 3 ============
export const BridgeGroup: React.FC<{ life: number; bridgeAt?: number; phoneAt?: number; msgAt?: number; groupAt?: number }> = ({ life, bridgeAt = 30, phoneAt = 80, msgAt = 90, groupAt = 190 }) => (
  <Scene life={life} fx={CX} fy={480} push={0.02}>
    {(f, fps) => {
      const pan = interpolate(f, [phoneAt - 6, phoneAt + 14], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
      const planks = 9;
      const msg = sp(f, fps, msgAt);
      const grp = sp(f, fps, groupAt);
      const cols = ["linear-gradient(135deg,#f5b942,#e07b39)", "linear-gradient(135deg,#a78bfa,#6d28d9)", `linear-gradient(135deg, ${PAL.teal}, #0f766e)`];
      return (
        <Float f={f} amp={3}>
          <div style={{ position: "absolute", left: 0, top: 0, width: 2160, height: SEAM, transform: `translateX(${(-1080 * pan).toFixed(1)}px)` }}>
            {/* dois penhascos com a paciente e a amiga */}
            {[0, 1].map((k) => (
              <React.Fragment key={k}>
                <div style={{ position: "absolute", left: k ? 760 : 40, top: 560, width: 280, height: 420, borderRadius: "28px 28px 0 0", background: "linear-gradient(#4b5563,#1f2937)", boxShadow: "0 30px 60px rgba(0,0,0,0.5)" }} />
                <div style={{ position: "absolute", left: (k ? 760 : 40) + 50, top: 370, width: 180, height: 180, borderRadius: 90, background: cols[k], display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 24px 50px rgba(0,0,0,0.5)" }}>
                  <UserRound size={104} color={k ? "#fff" : "#1a1206"} />
                </div>
              </React.Fragment>
            ))}
            {/* as tábuas da ponte chegam uma a uma */}
            {Array.from({ length: planks }).map((_, k) => {
              const t = sp(f, fps, bridgeAt + k * 3, { damping: 12, stiffness: 190, mass: 0.6 });
              const x = 320 + k * (440 / planks);
              const y = 560 + Math.sin((k / (planks - 1)) * Math.PI) * 26;
              return <div key={k} style={{ position: "absolute", left: x, top: y - (1 - t) * 160, width: 440 / planks - 6, height: 26, borderRadius: 6, background: `linear-gradient(${PAL.gold}, #b7791f)`, opacity: Math.min(1, t * 2), boxShadow: `0 0 18px ${PAL.gold}55` }} />;
            })}
            {/* celular: mensagem pronta e o grupo com as três */}
            <div style={{ position: "absolute", left: 1080 + CX - 260, top: 180, width: 520, height: 700, borderRadius: 56, background: "#0f0f10", border: "10px solid #2a2a2e", boxShadow: "0 40px 90px rgba(0,0,0,0.6)", overflow: "hidden" }}>
              <div style={{ height: 96, display: "flex", alignItems: "center", gap: 14, padding: "0 26px", borderBottom: "1px solid #222" }}>
                {grp > 0 ? (
                  <div style={{ display: "flex" }}>
                    {cols.map((c, k) => (
                      <div key={k} style={{ width: 58, height: 58, borderRadius: 29, background: c, border: "3px solid #0f0f10", marginLeft: k ? -16 : 0, transform: `scale(${sp(f, fps, groupAt + k * 4)})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <UserRound size={32} color="#111" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <MessageCircle size={40} color="#fff" />
                )}
                <div style={{ color: "#fff", fontSize: 28, fontWeight: 800 }}>{grp > 0.5 ? "nós três" : "mensagem pronta"}</div>
              </div>
              <div style={{ margin: "40px 26px 0 auto", width: 380, borderRadius: "26px 26px 8px 26px", background: PAL.teal, padding: 24, ...fromDepth(msg) }}>
                {[1, 0.9, 0.7].map((w, k) => (
                  <div key={k} style={{ height: 16, width: `${w * 100}%`, borderRadius: 8, background: "rgba(6,43,39,0.55)", marginBottom: 12 }} />
                ))}
                <div style={{ display: "flex", justifyContent: "flex-end", color: "#062b27" }}>
                  <Send size={30} />
                </div>
              </div>
            </div>
          </div>
          {Array.from({ length: planks }).map((_, k) => (
            <Snd key={k} at={bridgeAt + k * 3} name="tick" file="tick.wav" vol={0.18} k="plank" />
          ))}
          <Snd at={msgAt} name="pop" k="ready-msg" />
          <Snd at={groupAt} name="pop" k="group" />
          {[1, 2].map((k) => (
            <Snd key={k} at={groupAt + k * 4} name="tick" file="tick.wav" vol={0.2} k="group-face" />
          ))}
        </Float>
      );
    }}
  </Scene>
);

// ============ I11. a equipe continua com contexto: a ficha se preenche ============
export const ContextCard: React.FC<{ life: number; teamAt?: number; fields: { label: string; at: number }[] }> = ({ life, teamAt = 30, fields }) => (
  <Scene life={life} fx={CX} fy={500} push={0.05}>
    {(f, fps) => {
      const on = sp(f, fps, 0);
      const team = sp(f, fps, teamAt);
      return (
        <Float f={f} amp={4}>
          <Shadow x={CX} y={880} w={700} />
          <div style={{ position: "absolute", left: CX - 350, top: 200, width: 700, height: 640, borderRadius: 34, background: "linear-gradient(160deg,#fbfaf7,#e9e5dc)", boxShadow: "0 50px 100px rgba(0,0,0,0.6)", padding: "40px 46px", boxSizing: "border-box", ...fromDepth(on) }}>
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <div style={{ width: 90, height: 90, borderRadius: 45, background: "linear-gradient(135deg,#a78bfa,#6d28d9)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <User size={54} color="#fff" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ height: 22, width: "60%", borderRadius: 11, background: "#6d28d9" }} />
                <div style={{ height: 14, width: "35%", borderRadius: 7, background: "#c4b5fd", marginTop: 12 }} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 999, background: PAL.teal, color: "#062b27", fontSize: 26, fontWeight: 900, ...fromDepth(team) }}>
                <Users size={30} /> equipe
              </div>
            </div>
            <div style={{ borderTop: "3px dashed #cfc8b8", margin: "34px 0 26px" }} />
            {fields.map((fl, k) => {
              const t = interpolate(f, [fl.at, fl.at + 20], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
              return (
                <div key={k} style={{ marginBottom: 34 }}>
                  <div style={{ color: "#6b6456", fontSize: 30, fontWeight: 900, textTransform: "uppercase", letterSpacing: 2 }}>{fl.label}</div>
                  <div style={{ marginTop: 14, height: 64, borderRadius: 16, background: "#fff", border: `3px solid ${t > 0 ? PAL.violet : "#ddd6c8"}`, display: "flex", alignItems: "center", gap: 14, padding: "0 18px" }}>
                    {k === 0 ? <HeartHandshake size={38} color={PAL.violet} style={{ opacity: t }} /> : <Search size={34} color={PAL.violet} style={{ opacity: t }} />}
                    <div style={{ height: 16, width: `${t * 70}%`, borderRadius: 8, background: "#a78bfa" }} />
                  </div>
                </div>
              );
            })}
          </div>
          <Snd at={teamAt} name="pop" k="team" />
          {fields.map((fl, k) => (
            <SndSpan key={k} at={fl.at} dur={20} name="type" vol={0.2} />
          ))}
        </Float>
      );
    }}
  </Scene>
);

// ============ I12. não é sorte nem favor: é pedido certo, hora certa, pessoa certa ============
export const LuckTarget: React.FC<{ life: number; luckAt?: number; favorAt?: number; rings: { label: string; at: number }[] }> = ({ life, luckAt = 20, favorAt = 34, rings }) => (
  <Scene life={life} fx={CX} fy={470} push={0.05}>
    {(f, fps) => {
      const lk = sp(f, fps, luckAt);
      const fv = sp(f, fps, favorAt);
      const strikeL = interpolate(f, [luckAt + 8, luckAt + 16], [0, 1], clamp);
      const strikeF = interpolate(f, [favorAt + 8, favorAt + 16], [0, 1], clamp);
      const firstRing = rings[0]?.at ?? 60;
      const out = interpolate(f, [firstRing - 12, firstRing], [0, 1], clamp);
      const lit = rings.filter((r) => f >= r.at).length;
      const cols = [PAL.teal, PAL.gold, ZALE.red];
      const spin = f >= luckAt ? (f - luckAt) * 14 : 0;
      return (
        <Float f={f} amp={4}>
          {/* dado (sorte) e mão estendida (favor), riscados */}
          <div style={{ position: "absolute", left: 0, right: 0, top: 300, display: "flex", justifyContent: "center", gap: 90, opacity: 1 - out, transform: `scale(${1 - out * 0.4})` }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18, ...fromDepth(lk) }}>
              <Dice5 size={170} color="#fff" style={{ transform: `rotate(${Math.min(spin, 360)}deg)` }} />
              <Chip text="sorte" on={lk} color={ZALE.red} strike={strikeL} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18, ...fromDepth(fv) }}>
              <HeartHandshake size={170} color="#fff" />
              <Chip text="favor" on={fv} color={ZALE.red} strike={strikeF} />
            </div>
          </div>
          {/* alvo: cada anel acende com uma frase */}
          {out > 0 ? (
            <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: SEAM, opacity: out }}>
              {[2, 1, 0].map((r) => {
                const R = 120 + r * 95;
                const on = r < lit;
                return <div key={r} style={{ position: "absolute", left: 360 - R, top: 470 - R, width: R * 2, height: R * 2, borderRadius: R, border: `18px solid ${on ? cols[r] : "rgba(255,255,255,0.1)"}`, boxShadow: on ? `0 0 40px ${cols[r]}66, inset 0 0 30px ${cols[r]}33` : undefined, transform: `scale(${on ? 1 + 0.04 * Math.sin(f / 6 + r) : 1})` }} />;
              })}
              <div style={{ position: "absolute", left: 360 - 40, top: 470 - 40, width: 80, height: 80, borderRadius: 40, background: lit >= 3 ? "#fff" : "rgba(255,255,255,0.2)", boxShadow: lit >= 3 ? "0 0 40px #fff" : undefined }} />
              <div style={{ position: "absolute", left: 680, top: 300, display: "flex", flexDirection: "column", gap: 30 }}>
                {rings.map((r, k) => (
                  <Chip key={k} text={r.label} on={sp(f, fps, r.at)} color={cols[k]} />
                ))}
              </div>
            </div>
          ) : null}
          <Snd at={luckAt} name="pop" k="luck" />
          <Snd at={luckAt + 8} name="tick" file="pen_stroke.wav" vol={0.35} k="pen" />
          <Snd at={favorAt} name="pop" k="luck" />
          <Snd at={favorAt + 8} name="tick" file="pen_stroke.wav" vol={0.35} k="pen" />
          {rings.map((r, k) => (
            <Snd key={k} at={r.at} name="ding" k="ring" />
          ))}
        </Float>
      );
    }}
  </Scene>
);

// =====================================================================================================
// ESTILO ZALE (de volta, 2026-09-28): palco escuro, avatares de ícone, vidro, chips, profundidade, animação simples.
// O ilustrado (cenas-objetos) fica só em momentos-chave (a abertura das caixas de correio).
// =====================================================================================================
const AvatarDot: React.FC<{ x: number; y: number; kind: "paciente" | "medica"; size?: number; on: number; dim?: number }> = ({ x, y, kind, size = 170, on, dim = 0 }) => (
  <div style={{ position: "absolute", left: x - size / 2, top: y - size / 2, width: size, height: size, borderRadius: size / 2, background: kind === "paciente" ? "linear-gradient(135deg,#f5b942,#e07b39)" : `linear-gradient(135deg, ${PAL.teal}, #0f766e)`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 30px 60px rgba(0,0,0,0.5), 0 0 0 8px rgba(255,255,255,0.06)", ...fromDepth(on), opacity: Math.min(1, on * 1.5) * (1 - dim * 0.6), filter: dim > 0 ? `grayscale(${dim}) blur(${(dim * 2).toFixed(1)}px)` : undefined }}>
    {kind === "paciente" ? <UserRound size={size * 0.58} color="#1a1206" /> : <Stethoscope size={size * 0.52} color="#062b27" />}
  </div>
);

// ============ Z1. a culpa não é dela / toda clínica pede do mesmo jeito ============
export const FaultSameWay: React.FC<{ life: number; faultAt?: number; clinicsAt?: number; askAt?: number; sameAt?: number }> = ({ life, faultAt = 12, clinicsAt = 50, askAt = 140, sameAt = 180 }) => (
  <Scene life={life} fx={CX} fy={480} push={0.04}>
    {(f, fps) => {
      const pa = sp(f, fps, 0);
      const sh = sp(f, fps, faultAt, { damping: 11, stiffness: 180, mass: 0.7 });
      const move = interpolate(f, [clinicsAt - 8, clinicsAt + 10], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
      const ask = sp(f, fps, askAt, { damping: 10, stiffness: 200, mass: 0.6 });
      const same = sp(f, fps, sameAt);
      const xs = [220, 540, 860];
      return (
        <Float f={f} amp={4}>
          {/* a paciente + escudo */}
          <div style={{ position: "absolute", inset: 0, opacity: 1 - move, transform: `translateY(${(-move * 120).toFixed(1)}px) scale(${(1 - move * 0.4).toFixed(3)})`, transformOrigin: "540px 420px" }}>
            <AvatarDot x={540} y={420} kind="paciente" size={220} on={pa} />
            <div style={{ position: "absolute", left: 540 + 60, top: 420 - 150, width: 130, height: 130, borderRadius: 34, background: "rgba(20,20,22,0.8)", border: `3px solid ${PAL.gold}`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 40px ${PAL.gold}55`, ...fromDepth(sh) }}>
              <ShieldCheck size={80} color={PAL.gold} />
            </div>
            <div style={{ position: "absolute", left: 0, right: 0, top: 590, display: "flex", justifyContent: "center" }}>
              <Chip text="a culpa não é dela" on={sh} color={PAL.gold} />
            </div>
          </div>
          {/* as clínicas: o mesmo balão aparece nas três ao mesmo tempo */}
          {move > 0
            ? xs.map((x, k) => {
                const on = sp(f, fps, clinicsAt + k * 5);
                return (
                  <React.Fragment key={k}>
                    <Glass tint="rgba(255,255,255,0.08)" style={{ left: x - 130, top: 380, width: 260, height: 240, borderRadius: 30, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, ...fromDepth(on) }}>
                      <Building2 size={96} color="#dfe6ea" strokeWidth={1.6} />
                      <div style={{ color: "#fff", fontSize: 32, fontWeight: 800 }}>clínica</div>
                    </Glass>
                    {ask > 0 ? (
                      <div style={{ position: "absolute", left: x - 60, top: 270, width: 120, height: 92, borderRadius: "30px 30px 30px 8px", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 16px 30px rgba(0,0,0,0.45)", transform: `scale(${(0.4 + 0.6 * lock(ask)).toFixed(3)})`, opacity: ask }}>
                        <MessageCircle size={50} color="#8a8f96" />
                      </div>
                    ) : null}
                  </React.Fragment>
                );
              })
            : null}
          {same > 0
            ? [0, 1].map((k) => (
                <div key={k} style={{ position: "absolute", left: (xs[k] + xs[k + 1]) / 2 - 30, top: 470, width: 60, height: 60, borderRadius: 30, background: "#fff", color: "#141414", fontSize: 48, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", ...fromDepth(same) }}>
                  =
                </div>
              ))
            : null}
          {same > 0 ? (
            <div style={{ position: "absolute", left: 0, right: 0, top: 680, display: "flex", justifyContent: "center" }}>
              <Chip text="do mesmo jeito" on={same} color="#f08a7e" icon={Copy} />
            </div>
          ) : null}
          <Snd at={faultAt} name="pop" k="shield" />
          {xs.map((_, k) => (
            // som curto e seco (tick aprovado) no quadro em que cada clínica assenta; o pop longo embolava (usuário)
            <Snd key={k} at={clinicsAt + k * 5 + 4} name="tick" file="tick.wav" vol={0.22} k="clinic" />
          ))}
          <Snd at={askAt} name="pop" k="same-ask" />
          <Snd at={sameAt} name="ding" k="same" />
        </Float>
      );
    }}
  </Scene>
);

// ============ Z2. o pedido genérico: digitado e depois se perde no fundo ============
export const GenericFade: React.FC<{ life: number; text: string; typeAt?: number; dur?: number; fadeAt?: number }> = ({ life, text, typeAt = 30, dur = 90, fadeAt = 130 }) => (
  <Scene life={life} fx={CX} fy={420} push={0.03}>
    {(f, fps) => {
      const on = sp(f, fps, 0);
      const n = Math.round(interpolate(f, [typeAt, typeAt + dur], [0, text.length], clamp));
      const fade = interpolate(f, [fadeAt, fadeAt + 22], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
      return (
        <Float f={f} amp={4}>
          <AvatarDot x={170} y={300} kind="medica" size={150} on={on} />
          <div style={{ position: "absolute", left: 270, top: 272 }}>
            <Chip text="no fim da consulta" on={sp(f, fps, 6)} color={PAL.teal} icon={Clock} />
          </div>
          <div style={{ position: "absolute", left: 100, top: 420, width: 880, transformOrigin: "50% 40%", transform: `translate3d(0, ${(-fade * 160).toFixed(1)}px, 0) scale(${(1 - fade * 0.7).toFixed(3)})`, opacity: 1 - fade * 0.85, filter: fade > 0 ? `blur(${(fade * 9).toFixed(1)}px)` : undefined }}>
            <Bubble text={text} n={n} left={0} top={0} w={880} on={sp(f, fps, typeAt - 4)} size={46} />
          </div>
          <Snd at={6} name="pop" file="pop_5.wav" vol={0.35} k="chip-consulta" />
          <SndSpan at={typeAt} dur={dur} name="type" vol={0.22} />
          <Snd at={fadeAt} name="glass" k="fade" />
        </Float>
      );
    }}
  </Scene>
);

// ============ Z3. "Claro!", sai feliz e esquece (o pedido acinzenta e cai) no elevador ============
export const ClaroForget: React.FC<{ life: number; claroAt?: number; forgetAt?: number; elevatorAt?: number }> = ({ life, claroAt = 30, forgetAt = 84, elevatorAt = 110 }) => (
  <Scene life={life} fx={700} fy={480} push={0.04}>
    {(f, fps) => {
      const on = sp(f, fps, 0);
      const cl = sp(f, fps, claroAt, { damping: 10, stiffness: 200, mass: 0.6 });
      const fg = interpolate(f, [forgetAt, forgetAt + 20], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
      const walk = interpolate(f, [elevatorAt - 16, elevatorAt + 4], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
      const close = interpolate(f, [elevatorAt + 6, elevatorAt + 20], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
      const el = sp(f, fps, elevatorAt - 20);
      const ex = 820;
      const px = 260 + (ex - 260) * walk;
      return (
        <Float f={f} amp={3}>
          {/* o pedido da médica, pequeno, que acinzenta e cai (esquecido) */}
          <div style={{ position: "absolute", left: 120, top: 220 + fg * 420, padding: "14px 22px", borderRadius: "26px 26px 26px 8px", background: "#fff", color: "#333", fontSize: 30, fontWeight: 800, opacity: (1 - fg) * sp(f, fps, 4), filter: `grayscale(${fg}) blur(${(fg * 4).toFixed(1)}px)`, transform: `rotate(${(fg * -24).toFixed(1)}deg)` }}>
            indica a gente, tá?
          </div>
          {/* o elevador: cartão de vidro com o painel, as portas fecham depois que ela entra */}
          <div style={{ position: "absolute", left: ex - 150, top: 280, width: 300, height: 440, ...fromDepth(el) }}>
            <Glass tint="rgba(255,255,255,0.08)" style={{ inset: 0, borderRadius: 26 }} />
            <div style={{ position: "absolute", left: 100, top: 18, width: 100, height: 44, borderRadius: 10, background: "#08090a", color: "#ff5a3c", fontSize: 30, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", textShadow: "0 0 10px #ff5a3c" }}>
              {close > 0.5 ? "▼" : "▲"}
            </div>
            <div style={{ position: "absolute", left: 30, right: 30, top: 80, bottom: 30, borderRadius: 14, background: "linear-gradient(180deg, rgba(255,236,200,0.35), rgba(255,236,200,0.08))", overflow: "hidden" }}>
              {[0, 1].map((k) => (
                <div key={k} style={{ position: "absolute", top: 0, bottom: 0, width: "50%", left: k === 0 ? `${-50 + 50 * close}%` : `${100 - 50 * close}%`, background: "linear-gradient(90deg,#8e979f,#dde2e6 45%,#9aa3ab)", boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.25)" }} />
              ))}
            </div>
          </div>
          {/* ela: responde "Claro!", sai feliz e vai para o elevador */}
          <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 980, opacity: 1 - close * 0.9 }}>
            <AvatarDot x={px} y={520} kind="paciente" size={170 - walk * 50} on={on} />
            {cl > 0 && walk < 0.5 ? (
              <div style={{ position: "absolute", left: 330, top: 360, padding: "18px 32px", borderRadius: "32px 32px 32px 8px", background: "#fff", color: "#141414", fontSize: 56, fontWeight: 900, boxShadow: "0 20px 40px rgba(0,0,0,0.45)", transform: `scale(${(0.5 + 0.5 * lock(cl)).toFixed(3)})`, transformOrigin: "0% 100%", opacity: Math.min(1, cl * 2) * (1 - walk * 2) }}>
                Claro!
              </div>
            ) : null}
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 760, display: "flex", justifyContent: "center" }}>
            <Chip text="esquece no elevador" on={sp(f, fps, forgetAt)} color="#9aa3ad" />
          </div>
          <Snd at={claroAt} name="pop" k="claro" />
          <Snd at={forgetAt} name="error" k="forget" />
          <Snd at={elevatorAt - 18} name="pop" file="pop_2.wav" vol={0.3} k="elevator-in" />
          <Snd at={elevatorAt + 6} name="tick" file="elevator_doors.wav" vol={0.22} k="elevator" />
        </Float>
      );
    }}
  </Scene>
);

// ============ Z4. não é porque não gostou: ninguém ajudou a pensar em alguém (lista de contatos que não para) ============
export const ContactScroll: React.FC<{ life: number; likedAt?: number; scrollAt?: number; stopAt?: number }> = ({ life, likedAt = 4, scrollAt = 60, stopAt = 120 }) => (
  <Scene life={life} fx={CX} fy={500} push={0.04}>
    {(f, fps) => {
      const lk = sp(f, fps, likedAt);
      const on = sp(f, fps, scrollAt - 16);
      const vel = (t: number) => (t < stopAt - 24 ? Math.min(28, (t - scrollAt) * 2) : Math.max(0, ((stopAt - t) / 24) * 28));
      let pos = 0;
      for (let t = scrollAt; t < Math.min(f, stopAt); t++) pos += vel(t);
      // um tick a cada contato que passa pela linha do meio (acelera e desacelera junto com a rolagem)
      const ticks: number[] = [];
      for (let t = scrollAt, p = 0, row = 0; t < stopAt; t++) {
        p += vel(t);
        if (Math.floor(p / 100) > row) {
          row = Math.floor(p / 100);
          ticks.push(t + 1);
        }
      }
      const speed = f < scrollAt || f >= stopAt ? 0 : f < stopAt - 24 ? 1 : (stopAt - f) / 24;
      const q = sp(f, fps, stopAt + 4);
      const RH = 100;
      const PW = 520;
      const PX = CX - PW / 2;
      const PY = 250;
      const PH = 600;
      const cols = [PAL.violet, PAL.teal, PAL.gold, "#f08a7e", PAL.blue];
      return (
        <Float f={f} amp={3}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 175, display: "flex", justifyContent: "center" }}>
            <Chip text="não é porque não gostou" on={lk} color="#ff7aa2" icon={Heart} />
          </div>
          <div style={{ position: "absolute", left: PX, top: PY, width: PW, height: PH, borderRadius: 40, background: "linear-gradient(160deg, rgba(255,255,255,0.1), rgba(255,255,255,0.03))", border: "1.5px solid rgba(255,255,255,0.18)", boxShadow: "0 40px 80px rgba(0,0,0,0.55)", overflow: "hidden", ...fromDepth(on) }}>
            <div style={{ height: 76, display: "flex", alignItems: "center", gap: 12, padding: "0 28px", color: "#fff", fontSize: 30, fontWeight: 800, borderBottom: "1px solid rgba(255,255,255,0.12)" }}>
              <Users size={32} color="#fff" /> contatos
            </div>
            <div style={{ position: "absolute", left: 0, right: 0, top: 76, bottom: 0, overflow: "hidden", WebkitMaskImage: "linear-gradient(transparent, #000 15%, #000 85%, transparent)" }}>
              {Array.from({ length: 40 }).map((_, k) => {
                const y = k * RH - (pos % (RH * 30)) + RH * 2;
                if (y < -RH || y > PH) return null;
                const center = Math.abs(y + RH / 2 - (PH - 76) / 2) < RH / 2;
                const blank = f >= stopAt && center;
                return (
                  <div key={k} style={{ position: "absolute", left: 20, right: 20, top: y, height: RH - 12, borderRadius: 20, display: "flex", alignItems: "center", gap: 18, padding: "0 18px", background: blank ? "rgba(245,185,66,0.15)" : "rgba(255,255,255,0.05)", border: blank ? `2px solid ${PAL.gold}` : "1px solid transparent", filter: speed > 0.2 ? `blur(${(speed * 3).toFixed(1)}px)` : undefined }}>
                    <div style={{ width: 60, height: 60, borderRadius: 30, background: blank ? "transparent" : cols[k % 5], border: blank ? `3px dashed ${PAL.gold}` : undefined, opacity: blank ? 1 : 0.75 }} />
                    {blank ? (
                      <span style={{ color: PAL.gold, fontSize: 56, fontWeight: 900, opacity: q }}>?</span>
                    ) : (
                      <div style={{ flex: 1 }}>
                        <div style={{ height: 16, width: `${50 + rnd(k) * 40}%`, borderRadius: 8, background: "rgba(255,255,255,0.35)", marginBottom: 10 }} />
                        <div style={{ height: 12, width: `${30 + rnd(k + 5) * 30}%`, borderRadius: 6, background: "rgba(255,255,255,0.18)" }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <Snd at={likedAt} name="pop" k="liked" />
          <Snd at={scrollAt - 13} name="pop" file="pop_2.wav" vol={0.3} k="contacts-in" />
          {ticks.map((t, k) => (
            <Snd key={k} at={t} name="tick" file="tick.wav" vol={0.16} k="scroll" />
          ))}
          <Snd at={stopAt + 4} name="error" k="empty-contact" />
        </Float>
      );
    }}
  </Scene>
);

// ============ Z5. conduzida (a seta guia pelo caminho) e começa pelo momento certo (o relógio acende) ============
export const GuidedMoment: React.FC<{ life: number; guideAt?: number; momentAt?: number }> = ({ life, guideAt = 30, momentAt = 100 }) => (
  <Scene life={life} fx={800} fy={480} push={0.05}>
    {(f, fps) => {
      const g = interpolate(f, [guideAt, momentAt], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
      const m = sp(f, fps, momentAt, { damping: 10, stiffness: 180, mass: 0.7 });
      const path = "M150,700 C320,700 300,420 480,420 C660,420 640,600 820,480";
      const q = (u: number) => {
        // bezier aproximada em 2 trechos para a posição da seta
        const seg = u < 0.5 ? 0 : 1;
        const t = u < 0.5 ? u * 2 : (u - 0.5) * 2;
        const P = seg === 0 ? [[150, 700], [320, 700], [300, 420], [480, 420]] : [[480, 420], [660, 420], [640, 600], [820, 480]];
        const b = (i: number) => (1 - t) ** 3 * P[0][i] + 3 * (1 - t) ** 2 * t * P[1][i] + 3 * (1 - t) * t * t * P[2][i] + t ** 3 * P[3][i];
        return [b(0), b(1)];
      };
      const [ax, ay] = q(g);
      const [bx, by] = q(Math.min(1, g + 0.01));
      const ang = (Math.atan2(by - ay, bx - ax) * 180) / Math.PI;
      return (
        <Float f={f} amp={3}>
          <svg width={1080} height={980} style={{ position: "absolute", left: 0, top: 0 }}>
            <path d={path} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth={8} strokeDasharray="4 18" strokeLinecap="round" />
            <path d={path} fill="none" stroke={PAL.teal} strokeWidth={8} strokeDasharray={1200} strokeDashoffset={1200 * (1 - g)} strokeLinecap="round" style={{ filter: `drop-shadow(0 0 10px ${PAL.teal})` }} />
          </svg>
          {g > 0 && g < 1 ? (
            <div style={{ position: "absolute", left: ax - 34, top: ay - 34, width: 68, height: 68, borderRadius: 34, background: PAL.teal, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 30px ${PAL.teal}` }}>
              <Navigation size={36} color="#062b27" fill="#062b27" style={{ transform: `rotate(${(ang + 45).toFixed(1)}deg)` }} />
            </div>
          ) : null}
          <div style={{ position: "absolute", left: 90, top: 200 }}>
            <Chip text="conduzida" on={sp(f, fps, guideAt)} color={PAL.teal} icon={Navigation} />
          </div>
          {/* o relógio no fim do caminho */}
          <div style={{ position: "absolute", left: 820 - 110, top: 480 - 110, width: 220, height: 220, borderRadius: 110, background: m > 0 ? `radial-gradient(circle, ${PAL.gold}, #b7791f)` : "rgba(255,255,255,0.08)", border: `4px solid ${m > 0 ? PAL.gold : "rgba(255,255,255,0.2)"}`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: m > 0 ? `0 0 ${(80 * m).toFixed(0)}px ${PAL.gold}` : "0 30px 60px rgba(0,0,0,0.5)", transform: `scale(${(1 + 0.12 * m).toFixed(3)})`, ...(f < guideAt ? { opacity: sp(f, fps, 6) } : {}) }}>
            <Clock size={120} color={m > 0 ? "#2a1a02" : "rgba(255,255,255,0.6)"} strokeWidth={2} />
          </div>
          {m > 0 ? (
            <div style={{ position: "absolute", left: 820 - 230, top: 480 + 150, width: 460, display: "flex", justifyContent: "center", whiteSpace: "nowrap" }}>
              <Chip text="momento certo" on={m} color={PAL.gold} />
            </div>
          ) : null}
          <Snd at={6} name="pop" file="pop_5.wav" vol={0.3} k="clock-in" />
          <Snd at={guideAt} name="switch" k="guide" />
          <Snd at={momentAt} name="ding" k="moment" />
        </Float>
      );
    }}
  </Scene>
);

// ============ Z6. na hora certa x nunca ============
export const RightNever: React.FC<{ life: number; loveAt?: number; mirrorAt?: number; neverAt?: number; complaintAt?: number; doubtAt?: number }> = ({ life, loveAt = 60, mirrorAt = 130, neverAt = 180, complaintAt = 210, doubtAt = 255 }) => (
  <Scene life={life} fx={CX} fy={500} push={0.03}>
    {(f, fps) => {
      const L = sp(f, fps, loveAt - 10);
      const R = sp(f, fps, neverAt);
      const Card: React.FC<{ x: number; title: string; color: string; on: number; icon: React.ReactNode; items: { text: string; at: number; icon: React.ReactNode }[] }> = ({ x, title, color, on, icon, items }) => (
        <Glass tint={`${color}14`} style={{ left: x, top: 300, width: 450, borderRadius: 34, border: `2px solid ${color}66`, padding: "30px 28px 34px", boxSizing: "border-box", ...fromDepth(on) }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, color, fontSize: 42, fontWeight: 900, marginBottom: 30 }}>
            {icon}
            {title}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            {items.map((it, k) => {
              const o = sp(f, fps, it.at);
              return (
                <div key={k} style={{ display: "flex", alignItems: "center", gap: 16, padding: "18px 20px", borderRadius: 20, background: "rgba(10,10,12,0.6)", border: `1.5px solid ${color}55`, color: "#fff", fontSize: 34, fontWeight: 800, lineHeight: 1.1, opacity: Math.min(1, o * 1.5), transform: `translateX(${((1 - o) * 40).toFixed(1)}px)` }}>
                  <div style={{ flex: "none", width: 64, height: 64, borderRadius: 18, background: `${color}22`, display: "flex", alignItems: "center", justifyContent: "center" }}>{it.icon}</div>
                  {it.text}
                </div>
              );
            })}
          </div>
        </Glass>
      );
      return (
        <Float f={f} amp={4}>
          <Card x={70} title="na hora certa" color="#35d06b" on={L} icon={<CircleCheck size={44} color="#35d06b" />} items={[{ text: "fala que amou", at: loveAt, icon: <Heart size={38} color="#ff4d7e" fill="#ff4d7e" /> }, { text: "evolução no espelho", at: mirrorAt, icon: <Sparkles size={38} color="#fff2b0" /> }]} />
          <Card x={560} title="nunca" color="#ff5a4a" on={R} icon={<Ban size={44} color="#ff5a4a" />} items={[{ text: "reclamação", at: complaintAt, icon: <MessageCircle size={38} color="#ff8a7a" /> }, { text: "dúvida não resolvida", at: doubtAt, icon: <HelpCircle size={38} color="#ff8a7a" /> }]} />
          <Snd at={loveAt} name="pop" k="right-item" />
          <Snd at={mirrorAt} name="pop" k="right-item" />
          <Snd at={neverAt} name="error" k="never-card" />
          <Snd at={complaintAt} name="pop" k="never-item" />
          <Snd at={doubtAt} name="pop" k="never-item" />
        </Float>
      );
    }}
  </Scene>
);

// ============ Z0. abertura: caixa de "elogios" enchendo x caixa de "indicações" vazia (estilo ZALE) ============
// Cada envelope que chega tem o seu som no quadro em que pousa; o "0" e a caixa vazia aparecem no "nunca", com o som.
export const InboxCounts: React.FC<{ life: number; loveAt?: number; neverAt?: number; n?: number; every?: number }> = ({ life, loveAt = 30, neverAt = 80, n = 7, every = 4 }) => (
  <Scene life={life} fx={CX} fy={500} push={0.05}>
    {(f, fps) => {
      const L = sp(f, fps, loveAt - 12);
      const R = sp(f, fps, neverAt - 6);
      const arrived = Math.max(0, Math.min(n, Math.floor((f - loveAt) / every) + 1));
      const zero = sp(f, fps, neverAt, { damping: 9, stiffness: 200, mass: 0.6 });
      const zt = f - neverAt;
      const shake = zt >= 0 && zt < 14 ? Math.sin(zt * 2.4) * (14 - zt) * 0.9 : 0;
      const Box: React.FC<{ x: number; title: string; color: string; on: number; icon: React.ReactNode; count: string; countColor: string; children?: React.ReactNode; dx?: number }> = ({ x, title, color, on, icon, count, countColor, children, dx = 0 }) => (
        <Glass tint={`${color}12`} style={{ left: x + dx, top: 250, width: 450, height: 470, borderRadius: 34, border: `2px solid ${color}55`, padding: "28px 28px", boxSizing: "border-box", overflow: "hidden", ...fromDepth(on) }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, color: "#fff", fontSize: 38, fontWeight: 900 }}>
            {icon}
            {title}
            <span style={{ marginLeft: "auto", fontSize: 64, color: countColor }}>{count}</span>
          </div>
          <div style={{ position: "absolute", left: 28, right: 28, top: 120, bottom: 28, borderRadius: 22, background: "rgba(0,0,0,0.28)", boxShadow: "inset 0 6px 18px rgba(0,0,0,0.45)" }}>{children}</div>
        </Glass>
      );
      return (
        <Float f={f} amp={4}>
          <Box x={70} title="elogios" color="#ff7aa2" on={L} icon={<Heart size={42} color="#ff4d7e" fill="#ff4d7e" />} count={String(arrived)} countColor="#fff">
            {Array.from({ length: n }).map((_, k) => {
              const at = loveAt + k * every;
              const o = sp(f, fps, at, { damping: 12, stiffness: 220, mass: 0.6 });
              if (o <= 0) return null;
              // cada envelope cai de cima e pousa na pilha
              const slot = 262 - k * 38;
              return (
                <div key={k} style={{ position: "absolute", left: 40 + (k % 2) * 16, top: slot - (1 - o) * 260, width: 300, height: 58, borderRadius: 12, background: "linear-gradient(180deg,#fffaf0,#eee2c8)", boxShadow: "0 8px 14px rgba(0,0,0,0.35)", transform: `rotate(${(((k % 3) - 1) * 2).toFixed(1)}deg)`, opacity: Math.min(1, o * 2), display: "flex", alignItems: "center", gap: 14, padding: "0 16px", boxSizing: "border-box" }}>
                  <Mail size={30} color="#b9a37c" />
                  <div style={{ flex: 1, height: 10, borderRadius: 5, background: "#d9ccb2" }} />
                  <Heart size={26} color="#e6395a" fill="#e6395a" />
                </div>
              );
            })}
          </Box>
          <Box x={560} dx={shake} title="indicações" color="#9aa3ad" on={R} icon={<UserPlus size={40} color="#9aa3ad" />} count={zero > 0 ? "0" : ""} countColor="#ff6a52">
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, opacity: zero }}>
              <Inbox size={120} color="rgba(255,255,255,0.28)" strokeWidth={1.4} />
              <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 30, fontWeight: 800 }}>vazia</div>
            </div>
          </Box>
          <Snd at={loveAt - 9} name="pop" file="pop_5.wav" k="inbox-card" />
          {/* um som por envelope, no quadro em que ele pousa (a mola assenta ~5 quadros depois do início) */}
          {Array.from({ length: n }).map((_, k) => (
            <Snd key={k} at={loveAt + k * every + 5} name="tick" file="letter_tap.wav" vol={0.3} k="inbox-letter" />
          ))}
          <Snd at={neverAt} name="error" k="inbox-zero" />
        </Float>
      );
    }}
  </Scene>
);
