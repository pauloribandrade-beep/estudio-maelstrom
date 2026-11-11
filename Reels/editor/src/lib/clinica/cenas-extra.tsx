import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { FONT } from "../overlays";
import { ZALE } from "../theme";
import { SEAM, Snd, SndSpan, STAGE } from "../palco";

import { Frame, clamp, sp } from "../cenas-extra";

// Cenas do nicho clínica que estavam em src/lib/cenas-extra.tsx (separadas em 28/10/2026 para o pacote público
// levar só o núcleo). Registradas em edit/registry-clinica.tsx.

// ---------- rosto inchando a cada ml ----------
// Ilustração: a cada passo (`steps[].at`) os lábios e as bochechas aumentam um pouco e o contador soma.
export const SwellFace: React.FC<{ life: number; steps: { at: number; label?: string }[]; unit?: string }> = ({ life, steps, unit = "ml" }) => (
  <Frame life={life} w={900}>
    {(f, fps) => {
      let k = 0;
      let last = -1;
      steps.forEach((s, i) => {
        const p = sp(f, fps, s.at, { damping: 9, stiffness: 220, mass: 0.6 });
        k += p;
        if (f >= s.at) last = i;
      });
      const lip = 1 + 0.22 * k;
      const cheek = 1 + 0.07 * k;
      const skin = "#F0C4A4";
      const count = last + 1;
      return (
        <div style={{ position: "relative", height: 660, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg viewBox="0 0 600 640" width={560} height={600}>
            <defs>
              <radialGradient id="swBg" cx="50%" cy="45%" r="55%">
                <stop offset="0%" stopColor="rgba(216,40,16,0.3)" />
                <stop offset="100%" stopColor="rgba(216,40,16,0)" />
              </radialGradient>
            </defs>
            <circle cx={300} cy={320} r={300} fill="url(#swBg)" />
            <path d="M150 290 C135 160 215 85 300 85 C395 85 470 160 450 295 C445 380 470 470 495 540 C425 560 375 515 355 465 L245 465 C225 515 175 560 105 540 C130 470 155 380 150 290 Z" fill="#3A2217" />
            <path d="M92 640 C100 545 190 505 300 505 C410 505 500 545 508 640 Z" fill="#2E3440" />
            <path d="M258 430 L258 510 Q300 540 342 510 L342 430 Z" fill="#E2A785" />
            <g transform={`translate(300 290) scale(${cheek} 1) translate(-300 -290)`}>
              <path d="M300 125 C392 125 440 193 440 288 C440 384 384 462 300 470 C216 462 160 384 160 288 C160 193 208 125 300 125 Z" fill={skin} />
            </g>
            <ellipse cx={215} cy={362} rx={34 * cheek} ry={20} fill="#E88A7A" opacity={0.25 + 0.1 * k} />
            <ellipse cx={385} cy={362} rx={34 * cheek} ry={20} fill="#E88A7A" opacity={0.25 + 0.1 * k} />
            <path d="M158 298 C146 176 222 96 322 100 C420 104 470 190 444 298 C434 236 408 190 350 170 C372 196 380 212 384 228 C330 184 258 174 208 210 C186 232 168 262 158 298 Z" fill="#3A2217" />
            <path d="M198 238 Q228 222 268 234" stroke="#3A2217" strokeWidth={10} strokeLinecap="round" fill="none" />
            <path d="M402 238 Q372 222 332 234" stroke="#3A2217" strokeWidth={10} strokeLinecap="round" fill="none" />
            <ellipse cx={236} cy={290} rx={32} ry={15} fill="#fff" />
            <ellipse cx={364} cy={290} rx={32} ry={15} fill="#fff" />
            <circle cx={236} cy={290} r={12} fill="#5A3420" />
            <circle cx={364} cy={290} r={12} fill="#5A3420" />
            <path d="M300 300 Q291 344 284 360 Q300 371 316 360" stroke="#B97B5B" strokeWidth={4} fill="none" strokeLinecap="round" />
            <g transform={`translate(300 424) scale(${1 + 0.12 * k} ${lip}) translate(-300 -424)`}>
              <path d="M256 424 Q278 406 300 413 Q322 406 344 424 Q300 432 256 424 Z" fill="#C4574C" />
              <path d="M256 424 Q300 450 344 424 Q300 432 256 424 Z" fill="#A9443B" />
            </g>
          </svg>
          <div style={{ position: "absolute", right: 40, top: 40, background: "#fff", color: ZALE.ink, borderRadius: 18, padding: "14px 22px", fontSize: 44, fontWeight: 900, boxShadow: "0 20px 50px rgba(0,0,0,0.5)", fontVariantNumeric: "tabular-nums" }}>
            +{count} {unit}
          </div>
          <div style={{ position: "absolute", left: 40, top: 40, display: "grid", gap: 10 }}>
            {steps.map((s, i) =>
              f >= s.at ? (
                <div key={i} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", borderRadius: 12, padding: "8px 14px", fontSize: 28, fontWeight: 700, transform: `translateX(${(1 - sp(f, fps, s.at)) * -30}px)` }}>
                  {s.label ?? `visita ${i + 1}`}
                </div>
              ) : null,
            )}
          </div>
          {steps.map((s, i) => (
            <Snd key={i} at={s.at} name="pop" />
          ))}
        </div>
      );
    }}
  </Frame>
);
// ---------- boca desenhada que diminui (dissolveu) ----------
// Lábios grandes; em `shrinkAt` diminuem até `to` do tamanho, com gotas escorrendo.
export const LipsShrink: React.FC<{ life: number; shrinkAt?: number; to?: number; caption?: string }> = ({ life, shrinkAt = 20, to = 0.55, caption }) => (
  <Frame life={life} w={900}>
    {(f, fps) => {
      const k = interpolate(f, [shrinkAt, shrinkAt + 22], [1, to], { ...clamp, easing: Easing.inOut(Easing.cubic) });
      const drops = f > shrinkAt ? Math.min(1, (f - shrinkAt) / 30) : 0;
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <svg viewBox="0 0 600 420" width={760} height={532}>
            <defs>
              <linearGradient id="lpTop" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#e2566a" />
                <stop offset="100%" stopColor="#b8303f" />
              </linearGradient>
              <linearGradient id="lpBot" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#c83a4b" />
                <stop offset="100%" stopColor="#8f2231" />
              </linearGradient>
            </defs>
            <g transform={`translate(300 210) scale(${0.9 + 0.1 * k} ${k}) translate(-300 -210)`}>
              <path d="M60 210 C120 120 200 90 250 120 C275 135 290 140 300 140 C310 140 325 135 350 120 C400 90 480 120 540 210 C430 205 360 200 300 205 C240 200 170 205 60 210 Z" fill="url(#lpTop)" />
              <path d="M60 210 C170 215 240 212 300 214 C360 212 430 215 540 210 C470 330 380 360 300 360 C220 360 130 330 60 210 Z" fill="url(#lpBot)" />
              <path d="M140 250 C220 270 380 270 460 250" stroke="rgba(255,255,255,0.35)" strokeWidth={10} strokeLinecap="round" fill="none" />
            </g>
            {[0, 1, 2, 3, 4].map((i) => {
              const x = 170 + i * 65;
              const y = 250 + drops * (80 + (i % 2) * 40) + i * 3;
              return <path key={i} d={`M${x} ${y} q-10 18 0 26 q10 -8 0 -26 Z`} fill="#8fd3ff" opacity={drops * (1 - Math.max(0, drops - 0.8) * 5)} />;
            })}
          </svg>
          {caption ? <div style={{ color: "#fff", fontSize: 50, fontWeight: 800, marginTop: -20 }}>{caption}</div> : null}
          <Snd at={shrinkAt} name="drop" vol={0.25} />
        </div>
      );
    }}
  </Frame>
);
