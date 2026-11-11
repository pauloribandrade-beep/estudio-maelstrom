import React from "react";
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Building2, Check, Stethoscope, User } from "lucide-react";
import { FONT } from "../overlays";
import { ZALE } from "../theme";
import { SEAM, Snd, SndSpan, STAGE } from "../palco";

import { Avatar, CX, CY, Float, MapBg, PINS, RouteArt, Stage, clamp, lock, sp } from "../cenas-metafora";

// Cenas do nicho clínica que estavam em src/lib/cenas-metafora.tsx (separadas em 28/10/2026 para o pacote público
// levar só o núcleo). Registradas em edit/registry-clinica.tsx.

// ============ 2. consulta: a pergunta e a resposta do Instagram ============
const LIPS_UP = "M5,30 C18,12 34,8 50,21 C66,8 82,12 95,30 C80,34 65,36 50,34 C35,36 20,34 5,30 Z";
const LIPS_LO = "M5,30 C20,34 35,36 50,34 C65,36 80,34 95,30 C82,56 18,56 5,30 Z";
const Lips: React.FC<{ w: number; tone?: string }> = ({ w, tone = "#c2323c" }) => (
  <svg width={w} height={w * 0.6} viewBox="0 0 100 60">
    <defs>
      <linearGradient id={`lg${tone.slice(1)}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={tone} />
        <stop offset="1" stopColor="#7a1420" />
      </linearGradient>
    </defs>
    <path d={LIPS_UP} fill={`url(#lg${tone.slice(1)})`} />
    <path d={LIPS_LO} fill={`url(#lg${tone.slice(1)})`} />
    <path d="M10,30 C30,33 70,33 90,30" stroke="#5a0d16" strokeWidth={2} fill="none" />
    <ellipse cx={62} cy={42} rx={12} ry={4} fill="rgba(255,255,255,0.35)" />
  </svg>
);
const TILE_BG = ["linear-gradient(135deg,#f3d2c1,#e8b4a0)", "linear-gradient(135deg,#f6e3d8,#dcb8a6)", "linear-gradient(135deg,#e9c9b8,#c99b85)", "linear-gradient(135deg,#f1dcd0,#e2a896)"];
const TILE_TONE = ["#c2323c", "#b8454f", "#d0404a", "#a52a36"];
// `askAt`/`askDur`: a pergunta sendo digitada no balão da médica; `replyAt`: o celular dela aparece com o feed
// rolando; `shotAt`: ela dá print num post (flash + coração).
export const ConsultQuestion: React.FC<{ life: number; question: string; askAt?: number; askDur?: number; replyAt?: number; shotAt?: number }> = ({
  life,
  question,
  askAt = 6,
  askDur = 40,
  replyAt,
  shotAt,
}) => (
  <Stage life={life}>
    {(f, fps) => {
      const on = sp(f, fps);
      const n = Math.round(interpolate(f, [askAt, askAt + askDur], [0, question.length], clamp));
      const bub = sp(f, fps, askAt - 3);
      const ph = replyAt !== undefined ? sp(f, fps, replyAt, { damping: 14, stiffness: 140, mass: 0.9 }) : 0;
      const scroll = replyAt !== undefined ? interpolate(f, [replyAt, replyAt + 70], [0, 260], { ...clamp, easing: Easing.out(Easing.quad) }) : 0;
      const shot = shotAt !== undefined ? interpolate(f, [shotAt, shotAt + 3, shotAt + 9], [0, 1, 0], clamp) : 0;
      const heart = shotAt !== undefined ? sp(f, fps, shotAt, { damping: 9, stiffness: 220, mass: 0.6 }) : 0;
      // quando o celular entra, o balão da pergunta recua um pouco
      const qShift = ph * -20;
      return (
        <Float f={f}>
          <Avatar x={170} y={790} icon="doc" label="você" on={on} talk={f >= askAt && f < askAt + askDur ? Math.abs(Math.sin(f / 3)) : 0} />
          <Avatar x={910} y={790} icon="pac" label="paciente" on={on} />
          {/* balão da pergunta */}
          <div style={{ position: "absolute", left: 70, top: 250 + qShift, width: 560, opacity: bub, transform: `scale(${0.9 + 0.1 * lock(bub)})`, transformOrigin: "20% 100%" }}>
            <div style={{ background: "#fff", borderRadius: 30, padding: "30px 34px", color: ZALE.ink, fontSize: 48, fontWeight: 800, lineHeight: 1.15, boxShadow: "0 24px 60px rgba(0,0,0,0.5)", minHeight: 70 }}>
              {question.slice(0, n)}
              <span style={{ opacity: n < question.length && Math.floor(f / 8) % 2 === 0 ? 1 : 0, color: ZALE.red }}>|</span>
            </div>
            <svg width={60} height={40} style={{ position: "absolute", left: 70, bottom: -34 }}>
              <path d="M0,0 L60,0 L10,38 Z" fill="#fff" />
            </svg>
          </div>
          {/* o celular dela com o feed */}
          {replyAt !== undefined ? (
            <div
              style={{
                position: "absolute",
                left: 650,
                top: 185,
                width: 330,
                height: 510,
                borderRadius: 44,
                background: "#0d0d0d",
                border: "7px solid #2b2b2b",
                boxShadow: "0 30px 80px rgba(0,0,0,0.7)",
                overflow: "hidden",
                opacity: Math.min(1, ph * 2),
                transform: `translate3d(${(1 - ph) * 160}px, ${(1 - ph) * 60}px, 0)`,
              }}
            >
              <div style={{ height: 60, display: "flex", alignItems: "center", padding: "0 20px", color: "#fff", fontWeight: 800, fontSize: 24, borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                Explorar
              </div>
              <div style={{ position: "absolute", left: 0, right: 0, top: 60, bottom: 0, overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 3, transform: `translateY(${-scroll}px)` }}>
                  {Array.from({ length: 24 }).map((_, k) => {
                    const hot = k === 10;
                    return (
                      <div key={k} style={{ height: 104, background: TILE_BG[k % 4], display: "flex", alignItems: "center", justifyContent: "center", position: "relative", outline: hot && heart > 0 ? `4px solid ${ZALE.red}` : "none", outlineOffset: -4 }}>
                        {k % 3 === 1 ? (
                          <div style={{ width: 60, height: 60, borderRadius: 30, background: "rgba(255,255,255,0.35)", display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 12 }}>
                            <Lips w={34} tone={TILE_TONE[k % 4]} />
                          </div>
                        ) : (
                          <Lips w={70} tone={TILE_TONE[k % 4]} />
                        )}
                        {hot && heart > 0 ? (
                          <div style={{ position: "absolute", fontSize: 50, transform: `scale(${heart})`, filter: "drop-shadow(0 3px 6px rgba(0,0,0,0.5))" }}>❤️</div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div style={{ position: "absolute", inset: 0, background: "#fff", opacity: shot * 0.85 }} />
            </div>
          ) : null}
          {n > 0 ? <SndSpan at={askAt} dur={askDur} name="type" /> : null}
          {replyAt !== undefined ? <Snd at={replyAt} name="pop" k="phone-in" /> : null}
          {shotAt !== undefined ? <Snd at={shotAt} name="click" k="screenshot" /> : null}
        </Float>
      );
    }}
  </Stage>
);
// ============ 9. seringa no foco -> vira uma parada do plano ============
const Syringe: React.FC<{ w: number }> = ({ w }) => (
  <svg width={w} height={w * 0.26} viewBox="0 0 500 130">
    <defs>
      <linearGradient id="barrel" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="rgba(255,255,255,0.9)" />
        <stop offset="0.5" stopColor="rgba(255,255,255,0.35)" />
        <stop offset="1" stopColor="rgba(255,255,255,0.75)" />
      </linearGradient>
    </defs>
    <rect x={20} y={48} width={70} height={34} rx={6} fill="#d8d8d8" />
    <rect x={10} y={30} width={18} height={70} rx={5} fill="#bfbfbf" />
    <rect x={90} y={58} width={60} height={14} fill="#cfcfcf" />
    <rect x={150} y={32} width={230} height={66} rx={10} fill="url(#barrel)" stroke="rgba(255,255,255,0.8)" strokeWidth={3} />
    <rect x={220} y={40} width={156} height={50} rx={6} fill="rgba(216,40,16,0.55)" />
    <rect x={150} y={36} width={70} height={58} fill="#3c3c3c" />
    {Array.from({ length: 9 }).map((_, k) => (
      <line key={k} x1={235 + k * 16} y1={32} x2={235 + k * 16} y2={k % 2 ? 46 : 54} stroke="rgba(0,0,0,0.5)" strokeWidth={2} />
    ))}
    <rect x={140} y={22} width={14} height={86} rx={4} fill="#e6e6e6" />
    <path d="M380,50 L410,58 L410,72 L380,80 Z" fill="#dcdcdc" />
    <rect x={410} y={63} width={88} height={4} fill="#eee" />
  </svg>
);
export const SyringeSpot: React.FC<{ life: number; revealAt?: number; stops?: { label: string }[]; doneAt?: number; label?: string }> = ({
  life,
  revealAt = 40,
  stops = [{ label: "diagnóstico" }, { label: "etapa 1" }, { label: "etapa 2" }, { label: "retorno" }],
  doneAt,
  label,
}) => (
  <Stage life={life}>
    {(f, fps) => {
      const on = sp(f, fps);
      const r = interpolate(f, [revealAt, revealAt + 26], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
      // a seringa vai do centro (grande) para a parada 2 do caminho (pequena)
      const [px, py] = PINS[1];
      const sx = interpolate(r, [0, 1], [CX, px]);
      const sy = interpolate(r, [0, 1], [CY + 10, py - 70]);
      const sw = interpolate(r, [0, 1], [700, 170]);
      const spotR = interpolate(r, [0, 1], [360, 1400]);
      return (
        <Float f={f} amp={5}>
          <div style={{ position: "absolute", inset: 0, opacity: r }}>
            <MapBg on={1} />
            <RouteArt f={f} fps={fps} stops={stops.map((s) => ({ ...s, at: 0 }))} staticFull doneAt={doneAt} />
          </div>
          <div style={{ position: "absolute", inset: 0, background: `radial-gradient(${spotR}px ${spotR * 0.7}px at ${CX}px ${CY}px, rgba(255,255,255,0.13), rgba(0,0,0,${0.75 * (1 - r)}) 70%)`, opacity: on }} />
          <div style={{ position: "absolute", left: sx - sw / 2, top: sy - (sw * 0.26) / 2, opacity: on, filter: "drop-shadow(0 20px 30px rgba(0,0,0,0.6))" }}>
            <Syringe w={sw} />
          </div>
          {label && r < 0.5 ? (
            <div style={{ position: "absolute", left: 0, right: 0, top: CY + 150, textAlign: "center", color: "rgba(255,255,255,0.85)", fontSize: 46, fontWeight: 800, opacity: on * (1 - r * 2) }}>{label}</div>
          ) : null}
          <Snd at={revealAt} name="glass" k="spot-reveal" />
          {doneAt !== undefined ? <Snd at={doneAt} name="ding" k="plan-done" /> : null}
        </Float>
      );
    }}
  </Stage>
);
// ============ B6. rua de clínicas ============
// Fachadas genéricas caindo uma a uma a partir de `at` (a cada `every`).
export const ClinicStreet: React.FC<{ life: number; at?: number; every?: number; n?: number }> = ({ life, at = 4, every = 5, n = 5 }) => (
  <Stage life={life}>
    {(f, fps) => {
      const AW = ["#b8454f", "#3b6ea5", "#4c8a5a", "#8a6bb0", "#c08a3e"];
      const BW = 176;
      const G = 14;
      const x0 = CX - (n * BW + (n - 1) * G) / 2;
      const base = 820;
      return (
        <Float f={f} amp={4}>
          <div style={{ position: "absolute", left: 40, right: 40, top: base, height: 14, borderRadius: 7, background: "#3a3a3a" }} />
          {Array.from({ length: n }).map((_, k) => {
            const d = sp(f, fps, at + k * every, { damping: 12, stiffness: 160, mass: 0.8 });
            const h = 360 + (k % 2 ? 60 : 0) + (k === 2 ? 40 : 0);
            return (
              <div key={k} style={{ position: "absolute", left: x0 + k * (BW + G), top: base - h, width: BW, height: h, opacity: Math.min(1, d * 3), transform: `translate3d(0, ${((1 - d) * -420).toFixed(2)}px, 0)` }}>
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(#f3efe8,#d9d2c6)", borderRadius: "10px 10px 0 0", boxShadow: "0 18px 36px rgba(0,0,0,0.5)" }} />
                <div style={{ position: "absolute", left: 16, right: 16, top: 22, height: 64, borderRadius: 10, background: "#fff", border: "3px solid #ddd", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <svg width={34} height={34} viewBox="0 0 10 10">
                    <path d="M3.5,0 H6.5 V3.5 H10 V6.5 H6.5 V10 H3.5 V6.5 H0 V3.5 H3.5 Z" fill={AW[k % AW.length]} />
                  </svg>
                  <span style={{ color: ZALE.ink, fontSize: 26, fontWeight: 900 }}>clínica</span>
                </div>
                <svg width={BW} height={40} style={{ position: "absolute", left: 0, top: h - 250 }}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <path key={i} d={`M${(i * BW) / 6},0 H${((i + 1) * BW) / 6} V26 Q${((i + 0.5) * BW) / 6},40 ${(i * BW) / 6},26 Z`} fill={i % 2 ? "#fff" : AW[k % AW.length]} />
                  ))}
                </svg>
                <div style={{ position: "absolute", left: 18, width: 72, top: h - 200, bottom: 0, background: "#2b3a45", border: "5px solid #bfb6a8", borderBottom: "none" }} />
                <div style={{ position: "absolute", right: 18, width: 58, top: h - 200, height: 110, background: "linear-gradient(135deg,#a9c7da,#6f93ab)", border: "5px solid #bfb6a8" }} />
                <div style={{ position: "absolute", left: 18, right: 18, top: 104, height: 70, display: "flex", gap: 10 }}>
                  <div style={{ flex: 1, background: "linear-gradient(135deg,#a9c7da,#6f93ab)", border: "4px solid #bfb6a8" }} />
                  <div style={{ flex: 1, background: "linear-gradient(135deg,#a9c7da,#6f93ab)", border: "4px solid #bfb6a8" }} />
                </div>
              </div>
            );
          })}
          {Array.from({ length: n }).map((_, k) => (
            <Snd key={k} at={at + k * every} name="pop" k="street" />
          ))}
        </Float>
      );
    }}
  </Stage>
);
