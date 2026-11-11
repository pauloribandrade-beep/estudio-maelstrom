import React from "react";
import { Easing, Img, OffthreadVideo, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { LucideIcon } from "lucide-react";
import { FONT, MONO } from "../overlays";
import { ZALE, cap } from "../theme";
import { SEAM, Snd, SndSpan, STAGE } from "../palco";

import { Scene, card, clamp, glow, sp } from "../palco-ui";

// Cenas do nicho clínica que estavam em src/lib/palco-ui.tsx (separadas em 28/10/2026 para o pacote público
// levar só o núcleo). Registradas em edit/registry-clinica.tsx.

// ---------- protocolo em camadas ----------
export const ProtocolStack: React.FC<{ life: number; name: string; layers: { icon: LucideIcon; text: string; at: number }[] }> = ({ life, name, layers }) => (
  <Scene life={life} w={820}>
    {({ f, fps }) => (
      <div style={{ ...card, ...glow(), padding: "28px 30px" }}>
        <div style={{ color: ZALE.redBright, fontSize: 20, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>protocolo</div>
        <div style={{ color: "#fff", fontSize: 46, fontWeight: 900, marginBottom: 18 }}>{cap(name)}</div>
        {layers.map((l, i) => {
          const q = sp(f, fps, l.at);
          const Icon = l.icon;
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 18, background: "#222", borderRadius: 16, padding: "14px 18px", marginTop: 10, opacity: q, transform: `translateX(${(1 - q) * -40}px)` }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: ZALE.red, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={30} color="#fff" strokeWidth={2.4} />
              </div>
              <div style={{ color: "#fff", fontSize: 32, fontWeight: 700 }}>{cap(l.text)}</div>
              <Snd k="protocol" at={l.at} name="tick" />
            </div>
          );
        })}
      </div>
    )}
  </Scene>
);
// ---------- ficha de avaliação (prancheta) ----------
// Substitui a "janela de terminal" em tema de consulta: papel branco na
// prancheta, cabeçalho com estetoscópio, a pergunta sendo escrita linha a
// linha como anotação da médica. `strikeAt` risca a pergunta (a errada).
export const ClinicNote: React.FC<{
  life: number;
  title?: string;
  // `dur` (frames): escreve a linha inteira nesse tempo (sincronizar com a fala)
  lines: { label?: string; text: string; at: number; dur?: number }[];
  cps?: number;
  strikeAt?: number;
  icon?: LucideIcon;
}> = ({ life, title = "Ficha de avaliação", lines, cps = 26, strikeAt, icon: Icon }) => (
  <Scene life={life} w={900}>
    {({ f, fps }) => (
      <div style={{ position: "relative", paddingTop: 34 }}>
        <div style={{ position: "absolute", left: "50%", top: 0, transform: "translateX(-50%)", width: 200, height: 56, borderRadius: 14, background: "linear-gradient(#5a5a5a,#2e2e2e)", boxShadow: "0 6px 16px rgba(0,0,0,0.5)", zIndex: 2 }} />
        <div style={{ background: "#FBFAF7", borderRadius: 22, padding: "56px 40px 36px", boxShadow: "0 40px 100px rgba(0,0,0,0.55)", backgroundImage: "repeating-linear-gradient(transparent 0 58px, rgba(20,20,20,0.07) 58px 60px)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 22 }}>
            <div style={{ width: 54, height: 54, borderRadius: 14, background: ZALE.red, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {Icon ? <Icon size={32} color="#fff" strokeWidth={2.4} /> : <Stetho />}
            </div>
            <div style={{ fontSize: 40, fontWeight: 800, color: ZALE.ink }}>{cap(title)}</div>
          </div>
          {lines.map((l, i) => {
            const wdur = l.dur ?? (l.text.length / cps) * fps;
            const n = Math.max(0, Math.min(l.text.length, Math.floor(((f - l.at) / wdur) * l.text.length)));
            const strike = strikeAt !== undefined ? interpolate(f, [strikeAt, strikeAt + 8], [0, 1], clamp) : 0;
            return (
              <div key={i} style={{ marginTop: i ? 18 : 0, opacity: f >= l.at - 4 ? 1 : 0 }}>
                {l.label ? <div style={{ fontSize: 26, fontWeight: 700, color: "#8a8a8a", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6 }}>{l.label}</div> : null}
                <div style={{ position: "relative", display: "inline-block", fontSize: 54, fontWeight: 700, color: "#1d3a8a", lineHeight: 1.22, fontStyle: "italic" }}>
                  {l.text.slice(0, n)}
                  {n < l.text.length ? <span style={{ color: "#1d3a8a", opacity: Math.floor(f / 8) % 2 ? 0.2 : 1 }}>|</span> : null}
                  {strikeAt !== undefined ? <div style={{ position: "absolute", left: 0, top: "55%", height: 6, width: `${strike * 100}%`, background: ZALE.red, borderRadius: 3 }} /> : null}
                </div>
                {/* escrita na ficha = digitação padrão (o usuário não gostou do lápis) */}
                <SndSpan at={l.at} dur={wdur} name="type" />
              </div>
            );
          })}
          {strikeAt !== undefined ? <Snd at={strikeAt} name="error" /> : null}

        </div>
      </div>
    )}
  </Scene>
);
const Stetho: React.FC = () => (
  <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 2v2M5 2v2M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1" />
    <path d="M8 15a6 6 0 0 0 12 0v-3" />
    <circle cx="20" cy="10" r="2" />
  </svg>
);
// ---------- rosto vetorial ----------
// Ilustração plana (não é retrato de ninguém) para contar cenas de consulta:
// humor (brava/tranquila), alvo pulsando entre as sobrancelhas (no lugar de mão),
// balões de fala, seringa na glabela e rugas sumindo no `calmAt`.
// Tempos em frames relativos à Sequence.
const SKIN_A = "#F3CDB0";
const SKIN_B = "#E2A785";
const HAIR = "#3A2217";
const HAIR_HI = "#5B3624";
const almond = (cx: number, cy: number, w: number, h: number) =>
  `M${cx - w} ${cy} Q${cx} ${cy - h * 1.35} ${cx + w} ${cy} Q${cx} ${cy + h * 0.95} ${cx - w} ${cy} Z`;
const Eye: React.FC<{ id: string; cx: number; cy: number; open: number; flip?: boolean }> = ({ id, cx, cy, open, flip = false }) => {
  const s = flip ? -1 : 1;
  const w = 44;
  const h = Math.max(1, 21 * open);
  return (
    <g>
      <clipPath id={id}>
        <path d={almond(cx, cy, w, h)} />
      </clipPath>
      <path d={almond(cx, cy, w, h)} fill="#fff" />
      <g clipPath={`url(#${id})`}>
        <circle cx={cx} cy={cy - 1} r={18} fill="#6B3E22" />
        <circle cx={cx} cy={cy - 1} r={18} fill="none" stroke="#3E2212" strokeWidth={3} />
        <circle cx={cx} cy={cy - 1} r={8.5} fill="#1C0F08" />
        <circle cx={cx + 6} cy={cy - 8} r={4.5} fill="#fff" opacity={0.9} />
      </g>
      <path d={`M${cx - w - 4} ${cy + 1} Q${cx} ${cy - h * 1.42 - 3} ${cx + w + 4} ${cy - 2}`} stroke="#2A1710" strokeWidth={6} fill="none" strokeLinecap="round" />
      <path d={`M${cx + s * (w + 2)} ${cy - 3} l${s * 14} -9 M${cx + s * (w - 12)} ${cy - h * 0.9 - 4} l${s * 10} -11`} stroke="#2A1710" strokeWidth={4} strokeLinecap="round" />
      <path d={`M${cx - w + 6} ${cy - 30} Q${cx} ${cy - 44} ${cx + w - 6} ${cy - 32}`} stroke="#C98F6C" strokeWidth={3} fill="none" strokeLinecap="round" opacity={0.75} />
    </g>
  );
};
const Syringe: React.FC<{ x: number; y: number; angle: number; fill: number; opacity: number; k?: number }> = ({ x, y, angle, fill, opacity, k = 1 }) => (
  <g transform={`translate(${x} ${y}) rotate(${angle}) scale(${k})`} opacity={opacity}>
    <line x1={0} y1={0} x2={70} y2={0} stroke="#aab4be" strokeWidth={3} strokeLinecap="round" />
    <rect x={70} y={-7} width={16} height={14} rx={3} fill="#e7ecf0" />
    <rect x={86} y={-19} width={170} height={38} rx={10} fill="#f4f7f9" fillOpacity={0.95} stroke="#b7c2cc" strokeWidth={2.5} />
    <rect x={92} y={-12} width={110 * fill} height={24} rx={6} fill="#D82810" opacity={0.55} />
    {[0, 1, 2, 3, 4, 5, 6].map((i) => (
      <line key={i} x1={100 + i * 22} y1={-19} x2={100 + i * 22} y2={i % 2 ? -10 : -5} stroke="#8e9aa6" strokeWidth={2} />
    ))}
    <rect x={256} y={-28} width={12} height={56} rx={4} fill="#dfe5ea" stroke="#b7c2cc" strokeWidth={2} />
    <rect x={268} y={-6} width={70} height={12} rx={4} fill="#dfe5ea" />
    <rect x={338} y={-22} width={12} height={44} rx={5} fill="#dfe5ea" stroke="#b7c2cc" strokeWidth={2} />
  </g>
);
export const VectorFace: React.FC<{
  life: number;
  mood?: "angry" | "calm";
  calmAt?: number;
  pointAt?: number;
  syringeAt?: number;
  bubbles?: { text: string; at: number }[];
  caption?: string;
  coat?: boolean;
}> = ({ life, mood = "calm", calmAt, pointAt, syringeAt, bubbles = [], caption, coat = false }) => (
  <Scene life={life} w={940}>
    {({ f, fps }) => {
      const calm = mood === "calm" ? 1 : calmAt !== undefined ? sp(f, fps, calmAt, { damping: 20, stiffness: 80, mass: 1 }) : 0;
      const ang = 1 - calm;
      const open = f % 84 > 78 ? 0.12 : 1 - 0.12 * ang;
      const pt = pointAt !== undefined ? sp(f, fps, pointAt) : 0;
      const sy = syringeAt !== undefined ? sp(f, fps, syringeAt, { damping: 18, stiffness: 100, mass: 0.9 }) : 0;
      const press = syringeAt !== undefined && f > syringeAt + 16 ? Math.min(1, (f - syringeAt - 16) / 14) : 0;
      const lines = (1 - calm) * (1 - press);
      const cur = [...bubbles].reverse().find((b) => f >= b.at);
      const bIdx = cur ? bubbles.indexOf(cur) : -1;
      const bp = cur ? sp(f, fps, cur.at) : 0;
      const pulse = (f % 30) / 30;
      const gx = 300;
      const gy = 258;
      const mc = 432 + 10 * ang; // cantos da boca descem quando brava
      const mid = 440 - 8 * ang + 8 * calm;
      return (
        <div style={{ position: "relative", height: 660 }}>
          <svg viewBox="0 0 600 660" width={560} height={616} style={{ position: "absolute", left: bubbles.length ? 0 : 190, top: 0 }}>
            <defs>
              <radialGradient id="vfBg" cx="50%" cy="46%" r="52%">
                <stop offset="0%" stopColor="rgba(216,40,16,0.30)" />
                <stop offset="100%" stopColor="rgba(216,40,16,0)" />
              </radialGradient>
              <linearGradient id="vfSkin" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={SKIN_A} />
                <stop offset="100%" stopColor={SKIN_B} />
              </linearGradient>
              <linearGradient id="vfHair" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={HAIR_HI} />
                <stop offset="100%" stopColor={HAIR} />
              </linearGradient>
            </defs>
            <circle cx={300} cy={320} r={300} fill="url(#vfBg)" />
            {/* cabelo de trás, longo até os ombros */}
            <path d="M150 300 C130 170 210 88 305 88 C405 88 478 170 455 305 C448 380 470 470 500 540 C430 560 380 520 360 470 L240 470 C220 520 170 560 100 540 C130 470 158 380 150 300 Z" fill="url(#vfHair)" />
            {/* ombros e roupa */}
            <path d="M92 660 C100 560 190 515 300 515 C410 515 500 560 508 660 Z" fill={coat ? "#F5F5F5" : "#2E3440"} />
            {coat ? (
              <path d="M300 520 L262 660 M300 520 L338 660 M246 540 L300 600 L354 540" stroke="#cfcfcf" strokeWidth={5} fill="none" />
            ) : (
              <path d="M240 522 Q300 580 360 522" stroke="#454d5c" strokeWidth={10} fill="none" />
            )}
            {/* pescoço */}
            <path d="M258 440 L258 520 Q300 548 342 520 L342 440 Z" fill={SKIN_B} />
            <path d="M258 468 Q300 498 342 468 L342 440 L258 440 Z" fill="#C98C6A" opacity={0.45} />
            {/* orelhas e brincos */}
            <ellipse cx={162} cy={308} rx={18} ry={32} fill={SKIN_B} />
            <ellipse cx={438} cy={308} rx={18} ry={32} fill={SKIN_B} />
            <circle cx={160} cy={346} r={6} fill="#E8C36A" />
            <circle cx={440} cy={346} r={6} fill="#E8C36A" />
            {/* rosto */}
            <path d="M300 128 C392 128 440 196 440 292 C440 388 384 468 300 476 C216 468 160 388 160 292 C160 196 208 128 300 128 Z" fill="url(#vfSkin)" />
            <ellipse cx={218} cy={366} rx={34} ry={20} fill="#E88A7A" opacity={0.26} />
            <ellipse cx={382} cy={366} rx={34} ry={20} fill="#E88A7A" opacity={0.26} />
            {/* cabelo da frente: repartido lateral, testa livre */}
            <path d="M158 300 C146 176 222 96 322 100 C420 104 470 190 444 300 C434 236 408 190 350 170 C372 196 380 212 384 228 C330 184 258 174 208 210 C186 232 168 264 158 300 Z" fill="url(#vfHair)" />
            <path d="M322 104 C302 130 294 148 292 168" stroke={HAIR} strokeWidth={4} fill="none" opacity={0.55} />
            {/* sobrancelhas */}
            <path d={`M196 238 Q228 220 270 ${230 + 16 * ang} L268 ${240 + 16 * ang} Q230 232 198 246 Z`} fill={HAIR} />
            <path d={`M404 238 Q372 220 330 ${230 + 16 * ang} L332 ${240 + 16 * ang} Q370 232 402 246 Z`} fill={HAIR} />
            {/* rugas da glabela */}
            <g stroke="#A8694A" strokeWidth={3.5} strokeLinecap="round" fill="none" opacity={0.85 * lines}>
              <path d="M291 236 Q287 252 292 268" />
              <path d="M309 236 Q313 252 308 268" />
            </g>
            <Eye id="vfEyeL" cx={236} cy={292} open={open} />
            <Eye id="vfEyeR" cx={364} cy={292} open={open} flip />
            {/* nariz */}
            <path d="M300 300 Q292 346 284 362 Q300 374 316 362" stroke="#B97B5B" strokeWidth={4} fill="none" strokeLinecap="round" />
            {/* boca */}
            <path d={`M256 ${mc} Q278 ${418 + 4 * ang} 300 ${424 + 4 * ang} Q322 ${418 + 4 * ang} 344 ${mc} Q300 ${mid} 256 ${mc} Z`} fill="#C4574C" />
            <path d={`M256 ${mc} Q300 ${mid + 14 + 6 * calm} 344 ${mc} Q300 ${mid} 256 ${mc} Z`} fill="#A9443B" />
            {/* alvo pulsando entre as sobrancelhas */}
            {pointAt !== undefined && (
              <g opacity={pt}>
                <circle cx={gx} cy={gy} r={16 + 34 * pulse} fill="none" stroke="#D82810" strokeWidth={4} opacity={1 - pulse} />
                <circle cx={gx} cy={gy} r={16} fill="none" stroke="#D82810" strokeWidth={5} />
                <circle cx={gx} cy={gy} r={5} fill="#D82810" />
              </g>
            )}
            {syringeAt !== undefined && (
              <Syringe
                x={gx + 8 + interpolate(sy, [0, 1], [320, 0]) - 10 * press}
                y={gy - 4 + interpolate(sy, [0, 1], [-220, 0]) + 5 * press}
                angle={-32}
                fill={1 - 0.45 * press}
                opacity={sy}
              />
            )}
          </svg>
          {cur && (
            <div
              key={bIdx}
              style={{
                position: "absolute", left: 540, top: 70, width: 380, background: "#fff", color: "#141414",
                borderRadius: 30, padding: "26px 30px", fontSize: 40, fontWeight: 800, lineHeight: 1.22,
                transform: `scale(${0.8 + 0.2 * bp})`, transformOrigin: "0% 100%", opacity: bp, boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
              }}
            >
              {cur.text}
              <div style={{ position: "absolute", left: -20, bottom: 34, width: 0, height: 0, borderTop: "16px solid transparent", borderBottom: "16px solid transparent", borderRight: "22px solid #fff" }} />
            </div>
          )}
          {caption && <div style={{ position: "absolute", left: 0, right: 0, top: 612, textAlign: "center", color: "#fff", fontSize: 42, fontWeight: 800 }}>{cap(caption)}</div>}
          {bubbles.map((b, i) => (
            <Snd key={i} at={b.at} name="pop" />
          ))}
          {syringeAt !== undefined && <Snd at={syringeAt + 16} name="click" />}
          {pointAt !== undefined && <Snd at={pointAt} name="tick" />}
        </div>
      );
    }}
  </Scene>
);
// Close do olho: pálpebra tremendo (espasmo), seringa chegando ao lado, tremor para no `calmAt`.
export const EyeCloseUp: React.FC<{ life: number; syringeAt?: number; calmAt?: number; caption?: string }> = ({ life, syringeAt, calmAt, caption }) => (
  <Scene life={life} w={900}>
    {({ f, fps }) => {
      const calm = calmAt !== undefined ? sp(f, fps, calmAt, { damping: 20, stiffness: 80, mass: 1 }) : 0;
      const tw = (1 - calm) * (Math.sin(f * 1.9) * 0.5 + 0.5) * (Math.sin(f / 7) > -0.2 ? 1 : 0);
      const open = 1 - 0.5 * tw;
      const sy = syringeAt !== undefined ? sp(f, fps, syringeAt, { damping: 18, stiffness: 100, mass: 0.9 }) : 0;
      const cx = 400;
      const cy = 310;
      const w = 240;
      const h = 105 * open;
      const eye = `M${cx - w} ${cy} Q${cx} ${cy - h * 1.3} ${cx + w} ${cy} Q${cx} ${cy + 92} ${cx - w} ${cy} Z`;
      return (
        <div style={{ position: "relative", height: 640 }}>
          <svg viewBox="0 0 800 580" width={860} height={624} style={{ position: "absolute", left: 20, top: 0 }}>
            <defs>
              <radialGradient id="ecSkin" cx="50%" cy="50%" r="65%">
                <stop offset="0%" stopColor={SKIN_A} />
                <stop offset="100%" stopColor={SKIN_B} />
              </radialGradient>
              <radialGradient id="ecIris" cx="45%" cy="40%" r="60%">
                <stop offset="0%" stopColor="#A06A3E" />
                <stop offset="70%" stopColor="#6B3E22" />
                <stop offset="100%" stopColor="#3E2212" />
              </radialGradient>
              <clipPath id="ecClip">
                <path d={eye} />
              </clipPath>
            </defs>
            <rect x={20} y={20} width={760} height={540} rx={64} fill="url(#ecSkin)" />
            <path d="M150 150 Q380 70 650 140 L646 168 Q390 110 156 182 Z" fill={HAIR} />
            <path d={`M${cx - w + 30} ${cy - 130} Q${cx} ${cy - 190} ${cx + w - 30} ${cy - 136}`} stroke="#C98F6C" strokeWidth={6} fill="none" strokeLinecap="round" />
            <path d={eye} fill="#fff" />
            <g clipPath="url(#ecClip)">
              <circle cx={cx} cy={cy + 6} r={90} fill="url(#ecIris)" />
              <circle cx={cx} cy={cy + 6} r={40} fill="#150A05" />
              <circle cx={cx + 30} cy={cy - 26} r={17} fill="#fff" opacity={0.9} />
            </g>
            <path d={`M${cx - w - 10} ${cy + 4} Q${cx} ${cy - h * 1.36 - 8} ${cx + w + 10} ${cy - 6}`} stroke="#241309" strokeWidth={12} fill="none" strokeLinecap="round" />
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
              const t = 0.15 + i * 0.1;
              const x = cx - w + 2 * w * t;
              const y = cy - h * 1.3 * 2 * t * (1 - t) - 6;
              return <line key={i} x1={x} y1={y} x2={x + (t - 0.5) * 44} y2={y - 34} stroke="#241309" strokeWidth={6} strokeLinecap="round" />;
            })}
            <path d={`M${cx - w + 20} ${cy + 18} Q${cx} ${cy + 98} ${cx + w - 20} ${cy + 14}`} stroke="#B97B5B" strokeWidth={4} fill="none" opacity={0.7} />
            <g stroke="#D82810" strokeWidth={6} strokeLinecap="round" opacity={0.85 * (1 - calm) * (tw > 0.3 ? 1 : 0.3)}>
              <line x1={cx + w + 30} y1={cy - 70} x2={cx + w + 64} y2={cy - 88} />
              <line x1={cx + w + 36} y1={cy - 30} x2={cx + w + 74} y2={cy - 34} />
              <line x1={cx - w - 30} y1={cy - 70} x2={cx - w - 64} y2={cy - 88} />
            </g>
            {syringeAt !== undefined && <Syringe x={cx + w - 10 + interpolate(sy, [0, 1], [240, 0])} y={cy + 30 + interpolate(sy, [0, 1], [140, 0])} angle={30} fill={0.8} opacity={sy} k={0.55} />}
          </svg>
          {caption && <div style={{ position: "absolute", left: 0, right: 0, top: 628, textAlign: "center", color: "#fff", fontSize: 42, fontWeight: 800 }}>{cap(caption)}</div>}
          {syringeAt !== undefined && <Snd at={syringeAt + 14} name="click" />}
        </div>
      );
    }}
  </Scene>
);
