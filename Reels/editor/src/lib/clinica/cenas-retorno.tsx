import React from "react";
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Check, Megaphone, Smartphone, Sparkles, User } from "lucide-react";
import { FONT } from "../overlays";
import { ZALE } from "../theme";
import { SEAM, Snd, SndSpan, STAGE } from "../palco";

import { CX, CY, Float, Label, PAPER, Stage, clamp, ease, sp } from "../cenas-retorno";

// Cenas do nicho clínica que estavam em src/lib/cenas-retorno.tsx (separadas em 28/10/2026 para o pacote público
// levar só o núcleo). Registradas em edit/registry-clinica.tsx.

// ============ 1. fichas de pacientes: desbotam (não voltaram) / uma volta a ter cor ============
export const PatientFiles: React.FC<{ life: number; cards: { name: string; last: string }[]; fadeAt?: number; backAt?: number; back?: number; label?: string; labelAt?: number }> = ({
  life,
  cards,
  fadeAt,
  backAt,
  back = 1,
  label,
  labelAt = 0,
}) => (
  <Stage life={life}>
    {(f, fps) => {
      const n = cards.length;
      const W = 300;
      const H = 400;
      const mode = backAt !== undefined ? "back" : "fade";
      return (
        <Float f={f}>
          {cards.map((c, i) => {
            const k = i - (n - 1) / 2;
            const inAt = i * 5; // uma ficha de cada vez (dá para ouvir cada uma subindo)
            const inn = sp(f, fps, inAt);
            // desbotar: começa em fadeAt, uma ficha de cada vez; no modo "back" todas já começam desbotadas
            const fade = mode === "back" ? 1 : fadeAt !== undefined ? ease(f, fadeAt + i * 7, fadeAt + i * 7 + 12) : 0;
            const isBack = mode === "back" && i === back;
            const rev = isBack && backAt !== undefined ? sp(f, fps, backAt, { damping: 13, stiffness: 150, mass: 0.8 }) : 0;
            const gray = isBack ? fade * (1 - rev) : fade;
            const stamp = isBack && backAt !== undefined ? sp(f, fps, backAt + 8, { damping: 10, stiffness: 220, mass: 0.6 }) : 0;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: CX - W / 2 + k * 250,
                  top: CY - H / 2 + Math.abs(k) * 26 - rev * 30,
                  width: W,
                  height: H,
                  transform: `translate3d(0, ${((1 - inn) * 120 + gray * 12).toFixed(2)}px, 0) rotate(${(k * 7 * (1 - rev)).toFixed(2)}deg) scale(${(1 + rev * 0.14).toFixed(4)})`,
                  opacity: Math.min(1, inn * 2) * (1 - gray * 0.5),
                  filter: `grayscale(${gray.toFixed(3)})`,
                  zIndex: isBack ? 5 : 3 - Math.abs(k),
                }}
              >
                {/* ficha que volta: halo de luz atrás enquanto levanta */}
                {isBack && rev > 0 ? (
                  <div style={{ position: "absolute", inset: -90, borderRadius: 60, background: "radial-gradient(closest-side, rgba(255,214,150,0.75), rgba(240,58,30,0.25) 60%, rgba(0,0,0,0) 100%)", opacity: Math.min(1, rev) * (0.75 + 0.25 * Math.sin((f - (backAt ?? 0)) / 5)), filter: "blur(6px)" }} />
                ) : null}
                <div style={{ position: "absolute", inset: 0, background: PAPER, borderRadius: 18, overflow: "hidden", boxShadow: isBack ? `0 ${26 + rev * 30}px ${60 + rev * 50}px rgba(0,0,0,${0.55 + rev * 0.15})` : "0 26px 60px rgba(0,0,0,0.55)" }}>
                  <div style={{ height: 58, background: ZALE.red, color: "#fff", fontWeight: 900, fontSize: 24, letterSpacing: 4, display: "flex", alignItems: "center", paddingLeft: 22 }}>FICHA</div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "26px 20px 0" }}>
                    <div style={{ width: 118, height: 118, borderRadius: 59, background: "#e9dfd3", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <User size={70} color="#9b8a78" strokeWidth={1.8} />
                    </div>
                    <div style={{ color: ZALE.ink, fontSize: 38, fontWeight: 900, marginTop: 16 }}>{c.name}</div>
                    <div style={{ color: "rgba(20,20,20,0.5)", fontSize: 22, fontWeight: 700, marginTop: 14 }}>último atendimento</div>
                    <div style={{ color: ZALE.red, fontSize: 32, fontWeight: 900, marginTop: 4 }}>{c.last}</div>
                  </div>
                  {/* reflexo passando na ficha enquanto a cor volta */}
                  {isBack && backAt !== undefined && f >= backAt && f < backAt + 22 ? (
                    <div style={{ position: "absolute", top: -60, bottom: -60, width: 110, left: `${interpolate(f, [backAt, backAt + 20], [-40, 140], clamp)}%`, background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.85), rgba(255,255,255,0))", transform: "rotate(18deg)" }} />
                  ) : null}
                </div>
                {/* faíscas saindo da ficha */}
                {isBack && backAt !== undefined && f >= backAt && f < backAt + 26
                  ? Array.from({ length: 12 }).map((_, j) => {
                      const t = interpolate(f, [backAt, backAt + 24], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
                      const ang = (j / 12) * Math.PI * 2 + 0.3;
                      const dist = 150 + t * (170 + (j % 3) * 40);
                      const sz = (j % 2 ? 26 : 38) * (1 - t * 0.6);
                      return (
                        <svg key={j} width={sz} height={sz} viewBox="0 0 20 20" style={{ position: "absolute", left: W / 2 + Math.cos(ang) * dist - sz / 2, top: H / 2 + Math.sin(ang) * dist * 1.1 - sz / 2, opacity: 1 - t, transform: `rotate(${(t * 90).toFixed(1)}deg)` }}>
                          <path d="M10 0 L12 8 L20 10 L12 12 L10 20 L8 12 L0 10 L8 8 Z" fill={j % 3 ? "#ffd27a" : "#fff"} />
                        </svg>
                      );
                    })
                  : null}
                {isBack && stamp > 0 ? (
                  <div style={{ position: "absolute", right: -30, top: -30, width: 150, height: 150, borderRadius: 75, background: ZALE.red, color: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", transform: `rotate(-12deg) scale(${stamp > 0.997 ? 1 : 1.7 - 0.7 * stamp})`, opacity: Math.min(1, stamp * 2), boxShadow: "0 12px 30px rgba(0,0,0,0.45)" }}>
                    <Check size={52} strokeWidth={3.5} />
                    <div style={{ fontSize: 30, fontWeight: 900 }}>voltou</div>
                  </div>
                ) : null}
                {mode === "fade" && fadeAt !== undefined ? <Snd at={fadeAt + i * 7} name="tick" k="file-fade" /> : null}
                <Snd at={inAt} name="pop" k="file-in" />
              </div>
            );
          })}
          {label ? <Label text={label} top={CY + 290} on={sp(f, fps, labelAt)} red={mode === "fade"} /> : null}
          {label ? <Snd at={labelAt} name="pop" k="label" /> : null}
          {backAt !== undefined ? <Snd at={backAt} name="glass" k="file-lift" /> : null}
          {backAt !== undefined ? <Snd at={backAt + 8} name="ding" k="file-back" /> : null}
        </Float>
      );
    }}
  </Stage>
);
