// 06/11/2026 (ele: "no começo eu falo que em novembro vai sair o remake do Ocarina of Time; bota uma tag corrigindo que
// já saiu, falando que eu comecei esse vídeo em setembro"). Aviso de correção por cima da cena, no canto, no estilo de
// notificação do HEV: entra deslizando, o "VAI SAIR" é riscado e vira "JÁ SAIU", e sai sozinho.
import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { FONT, MONO } from "./overlays";

const C = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ORANGE = "#ff9a3c", TXT = "#f2f0f7", GREEN = "#7dff9a";

export const HLUpdateTag: React.FC<{ life: number; label?: string; was?: string; now?: string; note?: string; strikeAt?: number; noteAt?: number }> = ({
  life,
  label = "CORREÇÃO",
  was = "VAI SAIR EM NOVEMBRO",
  now = "JÁ SAIU",
  note = "COMECEI ESTE VÍDEO EM SETEMBRO",
  strikeAt = 22,
  noteAt = 40,
}) => {
  const f = useCurrentFrame();
  const inK = interpolate(f, [0, 14], [0, 1], { ...C, easing: Easing.out(Easing.back(1.4)) });
  const outK = interpolate(f, [life - 14, life], [1, 0], { ...C, easing: Easing.in(Easing.cubic) });
  const k = Math.min(inK, outK);
  const strike = interpolate(f, [strikeAt, strikeAt + 8], [0, 1], { ...C, easing: Easing.out(Easing.cubic) });
  const nowIn = interpolate(f, [strikeAt + 6, strikeAt + 16], [0, 1], { ...C, easing: Easing.out(Easing.back(2)) });
  const noteIn = interpolate(f, [noteAt, noteAt + 12], [0, 1], C);
  const pulse = 0.5 + 0.5 * Math.sin(f / 5);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          right: 70,
          top: 70,
          width: 560,
          transform: `translateX(${(1 - k) * 640}px)`,
          opacity: k,
          padding: "20px 26px 22px",
          borderRadius: 14,
          background: "rgba(12,8,4,0.78)",
          backdropFilter: "blur(10px)",
          border: `2px solid ${ORANGE}`,
          boxShadow: `0 0 ${18 + 10 * pulse}px rgba(255,154,60,0.35), 0 24px 60px rgba(0,0,0,0.55)`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontFamily: MONO, fontSize: 20, letterSpacing: 8, color: ORANGE }}>
          <span style={{ display: "inline-block", width: 12, height: 12, borderRadius: 6, background: ORANGE, opacity: 0.5 + 0.5 * pulse }} />
          {label}
        </div>
        <div style={{ position: "relative", marginTop: 14, fontFamily: MONO, fontSize: 26, letterSpacing: 5, color: "rgba(242,240,247,0.55)", display: "inline-block" }}>
          {was}
          <div style={{ position: "absolute", left: -4, top: "52%", height: 3, width: `calc(${strike * 100}% + 8px)`, background: "#ff5a4a", borderRadius: 2 }} />
        </div>
        <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 16, opacity: nowIn, transform: `scale(${0.8 + 0.2 * nowIn})`, transformOrigin: "0 50%" }}>
          <svg width={44} height={44} viewBox="0 0 24 24">
            <circle cx={12} cy={12} r={11} fill="none" stroke={GREEN} strokeWidth={2} />
            <path d="M6.5 12.5 L10.5 16 L17.5 8.5" fill="none" stroke={GREEN} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 58, letterSpacing: 3, color: TXT }}>{now}</div>
        </div>
        <div style={{ marginTop: 12, fontFamily: MONO, fontSize: 18, letterSpacing: 4, color: "rgba(242,240,247,0.8)", opacity: noteIn, transform: `translateY(${(1 - noteIn) * 8}px)` }}>{note}</div>
      </div>
    </AbsoluteFill>
  );
};
