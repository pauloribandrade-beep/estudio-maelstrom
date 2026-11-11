import React from "react";
import { Easing, Img, interpolate, staticFile } from "remotion";
import { Building2, Check, ClipboardList, DoorClosed, Hand, Handshake, Headset, MessageCircle, Scissors, Stethoscope, User, Users, Wrench, X, type LucideIcon } from "lucide-react";
import { ZALE } from "../theme";
import { SEAM, Snd, SndSpan } from "../palco";
import { CX, Float, PAPER, Stage, clamp, lock, rnd, sp } from "../cenas-metafora";

import { Chip, DStage, Glass, PAL, Shadow, fromDepth } from "../cenas-dinamicas";

// Cenas do nicho clínica que estavam em src/lib/cenas-dinamicas.tsx (separadas em 28/10/2026 para o pacote público
// levar só o núcleo). Registradas em edit/registry-clinica.tsx.

// ============ D2. clínicas chegando para resolver o comercial ============
export const ClinicInbox: React.FC<{ life: number; at?: number; every?: number; n?: number; label?: string; labelAt?: number }> = ({ life, at = 4, every = 6, n = 5, label = "resolver o comercial", labelAt = 60 }) => (
  <DStage life={life}>
    {(f, fps) => {
      const lab = sp(f, fps, labelAt);
      const cols = [PAL.teal, PAL.gold, PAL.violet, PAL.blue, "#f472b6"];
      const TW = 640;
      const trayX = CX - TW / 2;
      const trayY = 560;
      return (
        <Float f={f} amp={4}>
          <Shadow x={CX} y={trayY + 250} w={TW + 80} o={0.6} />
          {Array.from({ length: n }).map((_, k) => {
            const on = sp(f, fps, at + k * every, { damping: 14, stiffness: 120, mass: 0.9 });
            const fan = (k - (n - 1) / 2) * 118;
            const x = CX - 110 + fan;
            const y = trayY - 200 + Math.abs(k - (n - 1) / 2) * 16;
            return on > 0 ? (
              <div key={k} style={{ position: "absolute", left: x, top: y, width: 220, height: 150, ...fromDepth(on, (1 - on) * -120) }}>
                <Glass tint={`${cols[k % 5]}40`} style={{ inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, transform: `rotate(${((k - (n - 1) / 2) * 5).toFixed(1)}deg)` }}>
                  <Building2 size={56} color={cols[k % 5]} />
                  <div style={{ color: "#fff", fontSize: 28, fontWeight: 800 }}>clínica</div>
                </Glass>
              </div>
            ) : null;
          })}
          <Glass tint="rgba(255,255,255,0.1)" style={{ left: trayX, top: trayY, width: TW, height: 230, borderRadius: 36, display: "flex", alignItems: "center", justifyContent: "center", gap: 22 }}>
            <Wrench size={76} color={lab > 0 ? PAL.gold : "rgba(255,255,255,0.45)"} strokeWidth={2.2} style={{ transform: `rotate(${(lab * -25).toFixed(1)}deg)` }} />
            <div style={{ color: "#fff", fontSize: 50, fontWeight: 900, opacity: 0.3 + 0.7 * lab, lineHeight: 1.05 }}>{label}</div>
          </Glass>
          {Array.from({ length: n }).map((_, k) => (
            <Snd key={k} at={at + k * every + 8} name="pop" k="inbox" />
          ))}
          <Snd at={labelAt} name="switch" k="inbox-label" />
        </Float>
      );
    }}
  </DStage>
);
// ============ D3. a consulta (foto real, câmera andando) ============
// Foto em cartão com a câmera andando devagar; `explainAt` o chip "explicou tudo"; `happyAt` corações subindo e o
// chip "paciente animada"; `priceAt` a etiqueta do valor entra e a cena escurece (tensão).
export const ConsultPhoto: React.FC<{ life: number; src: string; explain?: string; explainAt?: number; happy?: string; happyAt?: number; price?: string; priceAt?: number }> = ({
  life,
  src,
  explain = "explicou tudo",
  explainAt = 30,
  happy = "paciente animada",
  happyAt = 60,
  price = "R$ X",
  priceAt = 110,
}) => (
  <DStage life={life}>
    {(f, fps) => {
      const on = sp(f, fps, 0, { damping: 14, stiffness: 120, mass: 1 });
      const cam = f / Math.max(1, life);
      const ex = sp(f, fps, explainAt);
      const hp = sp(f, fps, happyAt);
      const pr = sp(f, fps, priceAt, { damping: 11, stiffness: 180, mass: 0.7 });
      const dim = interpolate(f, [priceAt, priceAt + 12], [0, 0.45], clamp);
      return (
        <Float f={f} amp={3}>
          <div style={{ position: "absolute", left: 70, top: 180, width: 940, height: 620, borderRadius: 34, overflow: "hidden", boxShadow: "0 30px 80px rgba(0,0,0,0.6)", opacity: on, transform: `scale(${0.92 + 0.08 * lock(on)})` }}>
            <Img src={staticFile(src)} style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover", transform: `scale(${1.08 + cam * 0.18}) translate(${(-cam * 50).toFixed(1)}px, ${(cam * 10).toFixed(1)}px)`, transformOrigin: "40% 40%" }} />
            <div style={{ position: "absolute", inset: 0, background: `rgba(0,0,0,${dim})` }} />
          </div>
          <div style={{ position: "absolute", left: 110, top: 220 }}>
            <Chip text={explain} on={ex} color={PAL.teal} />
          </div>
          <div style={{ position: "absolute", right: 110, top: 700 }}>
            <Chip text={happy} on={hp} color={PAL.gold} />
          </div>
          {hp > 0
            ? Array.from({ length: 8 }).map((_, k) => {
                const t = (f - happyAt - k * 4) / 40;
                if (t < 0 || t > 1) return null;
                return (
                  <div key={k} style={{ position: "absolute", left: 640 + rnd(k) * 300, top: 690 - t * 360, fontSize: 54, opacity: 1 - t, transform: `scale(${0.7 + t * 0.5})`, color: "#ff5c7a" }}>
                    ♥
                  </div>
                );
              })
            : null}
          {pr > 0 ? (
            <div style={{ position: "absolute", left: CX - 170, top: 400, width: 340, transform: `translate3d(0, ${(1 - pr) * -200}px, 0) rotate(${(-6 + Math.sin(f / 6) * 1.5).toFixed(2)}deg)`, opacity: Math.min(1, pr * 2) }}>
              <svg width={340} height={190} viewBox="0 0 200 110" style={{ filter: "drop-shadow(0 16px 30px rgba(0,0,0,0.6))" }}>
                <path d="M40,5 L190,5 Q195,5 195,10 L195,100 Q195,105 190,105 L40,105 L5,55 Z" fill={ZALE.red} />
                <circle cx={34} cy={55} r={8} fill="#111" />
              </svg>
              <div style={{ position: "absolute", left: 80, right: 0, top: 0, height: 190, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 62, fontWeight: 900 }}>{price}</div>
            </div>
          ) : null}
          <Snd at={explainAt} name="pop" k="consult-chip" />
          <Snd at={happyAt} name="pop" k="consult-chip" />
          <Snd at={priceAt + 6} name="thud" k="consult-price" />
        </Float>
      );
    }}
  </DStage>
);
