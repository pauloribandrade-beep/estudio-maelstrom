import React from "react";
import { Easing, Img, interpolate, staticFile } from "remotion";
import { Briefcase, Building2, Check, ClipboardList, DoorClosed, Hand, Handshake, Headset, MessageCircle, Scissors, Stethoscope, User, Users, Wrench, X, type LucideIcon } from "lucide-react";
import { ZALE } from "./theme";
import { SEAM, Snd, SndSpan } from "./palco";
import { CX, Float, PAPER, Stage, clamp, lock, rnd, sp } from "./cenas-metafora";

import BRAND from "./brand.json";
import { TX } from "./textos";
// CENAS DINÂMICAS (vídeo "vergonha de falar o preço", 2026-09-28: "mais dinâmico, mais elementos, inovar").
// Linguagem nova: cartões de vidro, uma cor por elemento, tipografia gigante (com o layout vivo em tela cheia),
// avatares com ícone, câmera andando sobre foto real. Tempos em frames relativos à Sequence.
export const PAL = { teal: "#2dd4bf", gold: "#f5b942", violet: "#a78bfa", blue: "#60a5fa", red: ZALE.red };
const ICONS: Record<string, LucideIcon> = { medica: Stethoscope, paciente: User, secretaria: Headset, crc: ClipboardList, time: Users, clinica: Building2, pro: Briefcase };

// PROFUNDIDADE (pedido do usuário: "com um pouco mais de profundidade, não digo 3D"): chão em perspectiva andando
// devagar, luzes desfocadas no fundo (plano de trás), entradas vindo "de longe" (pequeno e desfocado -> nítido na frente)
// e sombra de contato no chão. Sem inclinar para os lados (o usuário não gosta).
const FLOOR_Y = 640;
const DepthBg: React.FC<{ f: number; floor?: boolean }> = ({ f, floor = true }) => (
  <>
    {Array.from({ length: 9 }).map((_, k) => {
      const r = 50 + rnd(k + 7) * 110;
      const dy = Math.sin(f / (70 + k * 9) + k) * 14;
      return (
        <div
          key={k}
          style={{ position: "absolute", left: rnd(k) * 1080 - r / 2, top: 170 + rnd(k + 3) * 420 + dy, width: r, height: r, borderRadius: r, background: [PAL.teal, PAL.gold, PAL.violet, "#ff6a4a"][k % 4], opacity: 0.09, filter: "blur(22px)" }}
        />
      );
    })}
    {floor ? (
      // chão em perspectiva desenhado em SVG: linhas que fogem para um ponto e travessas que andam devagar
      <svg width={1080} height={SEAM} style={{ position: "absolute", left: 0, top: 0 }}>
        <defs>
          <linearGradient id="dFloorFade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0" />
            <stop offset="0.35" stopColor="#fff" stopOpacity="0.10" />
            <stop offset="1" stopColor="#fff" stopOpacity="0.20" />
          </linearGradient>
        </defs>
        {Array.from({ length: 15 }).map((_, k) => {
          const bx = -700 + k * 177;
          return <line key={`v${k}`} x1={CX + (bx - CX) * 0.08} y1={FLOOR_Y} x2={bx} y2={SEAM + 200} stroke="url(#dFloorFade)" strokeWidth={2} />;
        })}
        {Array.from({ length: 9 }).map((_, k) => {
          const t = (k + ((f * 0.02) % 1)) / 9; // 0 = horizonte, 1 = perto
          const y = FLOOR_Y + (SEAM + 200 - FLOOR_Y) * t * t;
          return <line key={`h${k}`} x1={0} y1={y} x2={1080} y2={y} stroke="#fff" strokeOpacity={0.03 + 0.14 * t} strokeWidth={2} />;
        })}
      </svg>
    ) : null}
  </>
);
// cena com fundo de profundidade (o fundo fica fora do fade da cena para não piscar entre uma cena e outra)
export const DStage: React.FC<{ life: number; floor?: boolean; children: (f: number, fps: number) => React.ReactNode }> = ({ life, floor = true, children }) => (
  <Stage life={life}>
    {(f, fps) => (
      <>
        <DepthBg f={f} floor={floor} />
        {children(f, fps)}
      </>
    )}
  </Stage>
);
// entrada vindo do fundo: pequeno, desfocado e mais escuro -> na frente, nítido
export const fromDepth = (on: number, lift = 0): React.CSSProperties => ({
  opacity: Math.min(1, on * 1.6),
  filter: on < 0.995 ? `blur(${((1 - on) * 9).toFixed(2)}px) brightness(${(0.6 + 0.4 * on).toFixed(3)})` : undefined,
  transform: `translate3d(0, ${((1 - on) * -50 + lift).toFixed(2)}px, 0) scale(${(0.5 + 0.5 * on).toFixed(4)})`,
});
// sombra de contato (elipse desfocada no chão)
export const Shadow: React.FC<{ x: number; y: number; w: number; o?: number }> = ({ x, y, w, o = 0.55 }) => (
  <div style={{ position: "absolute", left: x - w / 2, top: y - w * 0.07, width: w, height: w * 0.14, borderRadius: "50%", background: `rgba(0,0,0,${o})`, filter: "blur(10px)" }} />
);

export const Glass: React.FC<{ style?: React.CSSProperties; children?: React.ReactNode; tint?: string }> = ({ style, children, tint = "rgba(255,255,255,0.08)" }) => (
  <div style={{ position: "absolute", borderRadius: 28, background: tint, border: "1.5px solid rgba(255,255,255,0.18)", boxShadow: "0 40px 80px rgba(0,0,0,0.55), 0 10px 20px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.22)", backdropFilter: "blur(6px)", ...style }}>{children}</div>
);

export const Avatar: React.FC<{ kind: string; label?: string; color?: string; size?: number; on?: number; dim?: boolean }> = ({ kind, label, color = PAL.teal, size = 130, on = 1, dim }) => {
  const I = ICONS[kind] ?? User;
  return (
    <div style={{ position: "relative", width: size * 1.6, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, ...fromDepth(on), opacity: Math.min(1, on * 1.6) * (dim ? 0.4 : 1) }}>
      <Shadow x={size * 0.8} y={size + 14} w={size * 1.05} o={0.5} />
      <div style={{ position: "relative", width: size, height: size, borderRadius: size / 2, background: `radial-gradient(circle at 35% 30%, ${color}, ${color}bb 60%, ${color}88)`, boxShadow: `0 0 0 6px rgba(255,255,255,0.12), 0 16px 40px ${color}55`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <I size={size * 0.5} color="#0d1614" strokeWidth={2.2} />
      </div>
      {label ? <div style={{ color: "#fff", fontSize: 30, fontWeight: 800, textAlign: "center", lineHeight: 1.1 }}>{label}</div> : null}
    </div>
  );
};

export const Chip: React.FC<{ text: string; color?: string; on: number; icon?: LucideIcon; strike?: number }> = ({ text, color = PAL.teal, on, icon: I = Check, strike = 0 }) => (
  <div style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: 12, padding: "12px 22px", borderRadius: 999, background: "rgba(15,15,15,0.75)", border: `2px solid ${color}`, color: "#fff", fontSize: 36, fontWeight: 800, boxShadow: `0 18px 36px rgba(0,0,0,0.5), 0 0 24px ${color}33`, ...fromDepth(on) }}>
    <span style={{ width: 40, height: 40, borderRadius: 20, background: color, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
      <I size={24} color="#0d1614" strokeWidth={3} />
    </span>
    {text}
    {strike > 0 ? <div style={{ position: "absolute", left: 12, top: "50%", height: 6, width: `calc(${strike * 100}% - 24px)`, background: ZALE.red, borderRadius: 3 }} /> : null}
  </div>
);

// ============ D1. tipografia cinética (para o layout em TELA CHEIA: desenha por cima do apresentador) ============
// Cada linha bate no seu `at` (entra grande e desfocada e assenta com um tranco); `red` pinta de vermelho;
// `strikeAt` risca a linha. `top`: altura do bloco (acima da cabeça).
export const KineticType: React.FC<{ life: number; top?: number; lines: { text: string; at: number; size?: number; red?: boolean; strikeAt?: number }[] }> = ({ life, top = 180, lines }) => (
  <DStage life={life} floor={false}>
    {(f, fps) => (
      <div style={{ position: "absolute", left: 40, right: 40, top, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        {lines.map((l, k) => {
          const d = sp(f, fps, l.at, { damping: 12, stiffness: 220, mass: 0.7 });
          const t = f - l.at;
          const shake = t >= 0 && t < 10 ? Math.sin(t * 2.2) * (10 - t) * 0.6 : 0;
          const st = l.strikeAt !== undefined ? interpolate(f, [l.strikeAt, l.strikeAt + 8], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) }) : 0;
          const size = l.size ?? 96;
          return (
            <div
              key={k}
              style={{
                position: "relative",
                color: l.red ? ZALE.redBright : "#fff",
                fontSize: size,
                fontWeight: 900,
                letterSpacing: -size * 0.03,
                lineHeight: 1.02,
                textAlign: "center",
                textShadow: "0 6px 24px rgba(0,0,0,0.85), 0 2px 4px rgba(0,0,0,0.9)",
                opacity: Math.min(1, d * 2),
                filter: `blur(${((1 - lock(d)) * 8).toFixed(2)}px)`,
                transform: `translate3d(${shake.toFixed(2)}px, 0, 0) scale(${(1.4 - 0.4 * d).toFixed(4)})`,
              }}
            >
              {l.text}
              {st > 0 ? <div style={{ position: "absolute", left: -10, top: "52%", height: size * 0.12, width: `calc(${st * 100}% + 20px)`, background: ZALE.red, borderRadius: 6, boxShadow: "0 4px 14px rgba(0,0,0,0.6)" }} /> : null}
            </div>
          );
        })}
        {lines.map((l, k) => (
          <React.Fragment key={k}>
            <Snd at={l.at} name="tap" k="kinetic" />
            {l.strikeAt !== undefined ? <Snd at={l.strikeAt} name="tick" file="pen_stroke.wav" vol={0.4} k="pen" /> : null}
          </React.Fragment>
        ))}
      </div>
    )}
  </DStage>
);

// ============ D4. a voz muda ============
// Onda da voz cheia que encolhe e fica cinza em `shrinkAt`; papel com o valor em `paperAt`, o número diminui em
// `lowAt`; os balões da médica (texto falado) em `b1At` e `b2At`.
export const VoiceShrink: React.FC<{ life: number; shrinkAt?: number; paperAt?: number; lowAt?: number; b1?: string; b1At?: number; b2?: string; b2At?: number }> = ({
  life,
  shrinkAt = 10,
  paperAt = 40,
  lowAt = 70,
  b1 = "Mas dá pra parcelar, tá?",
  b1At = 140,
  b2 = "E se ficar pesado, a gente vê um desconto.",
  b2At = 190,
}) => (
  <DStage life={life}>
    {(f, fps) => {
      const shrink = interpolate(f, [shrinkAt, shrinkAt + 24], [1, 0.18], { ...clamp, easing: Easing.inOut(Easing.cubic) });
      const pp = sp(f, fps, paperAt);
      const low = interpolate(f, [lowAt, lowAt + 20], [1, 0.4], { ...clamp, easing: Easing.inOut(Easing.cubic) });
      const bb1 = sp(f, fps, b1At);
      const bb2 = sp(f, fps, b2At);
      const N = 34;
      const gray = 1 - shrink;
      return (
        <Float f={f} amp={4}>
          <Glass style={{ left: 90, top: 190, width: 900, height: 220, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
            {Array.from({ length: N }).map((_, k) => {
              const a = (0.35 + 0.65 * Math.abs(Math.sin(f / 3 + k * 0.7) * Math.cos(k * 0.33))) * shrink;
              return <div key={k} style={{ width: 14, height: Math.max(6, a * 170), borderRadius: 7, background: gray > 0.5 ? "#8a8a8a" : PAL.teal, opacity: 0.6 + 0.4 * shrink }} />;
            })}
          </Glass>
          <div style={{ position: "absolute", left: 120, top: 438, color: "rgba(255,255,255,0.75)", fontSize: 30, fontWeight: 800 }}>{shrink < 0.6 ? "voz" : ""}</div>
          {pp > 0 ? (
            <div style={{ position: "absolute", left: 110, top: 480, width: 360, height: 400, background: PAPER, borderRadius: 12, boxShadow: "0 24px 50px rgba(0,0,0,0.55)", transform: `translate3d(0, ${(1 - pp) * 120}px, 0) rotate(-4deg)`, opacity: Math.min(1, pp * 2), padding: 30, boxSizing: "border-box" }}>
              {[1, 0.8, 0.9, 0.6].map((w, k) => (
                <div key={k} style={{ height: 12, width: `${w * 100}%`, borderRadius: 6, background: "rgba(0,0,0,0.13)", marginBottom: 18 }} />
              ))}
              <div style={{ marginTop: 30, color: "#222", fontSize: 110 * low, fontWeight: 900, transition: "none" }}>R$ X</div>
            </div>
          ) : null}
          {bb1 > 0 ? (
            <div style={{ position: "absolute", left: 510, top: 500, maxWidth: 480, background: "#fff", color: "#111", borderRadius: "30px 30px 30px 8px", padding: "22px 26px", fontSize: 38, fontWeight: 800, lineHeight: 1.15, boxShadow: "0 18px 40px rgba(0,0,0,0.5)", opacity: bb1, transform: `scale(${0.7 + 0.3 * lock(bb1)})`, transformOrigin: "0% 100%" }}>
              {b1}
            </div>
          ) : null}
          {bb2 > 0 ? (
            <div style={{ position: "absolute", left: 510, top: 680, maxWidth: 480, background: "#fff", color: "#111", borderRadius: "30px 30px 30px 8px", padding: "22px 26px", fontSize: 34, fontWeight: 800, lineHeight: 1.15, boxShadow: "0 18px 40px rgba(0,0,0,0.5)", opacity: bb2, transform: `scale(${0.7 + 0.3 * lock(bb2)})`, transformOrigin: "0% 100%" }}>
              {b2}
            </div>
          ) : null}
          <Snd at={shrinkAt} name="switch" k="voice-shrink" />
          <Snd at={paperAt} name="pop" k="voice-paper" />
          <Snd at={b1At} name="pop" k="voice-bubble" />
          <Snd at={b2At} name="pop" k="voice-bubble" />
        </Float>
      );
    }}
  </DStage>
);

// ============ D5. a etiqueta pedindo desculpa ============
// A paciente (avatar) calma, sem reclamar (`calmAt`); a etiqueta do preço encolhe, se curva e pede "desculpa" (`sorryAt`).
export const SorryTag: React.FC<{ life: number; calmAt?: number; sorryAt?: number; price?: string }> = ({ life, calmAt = 8, sorryAt = 60, price = "R$ X" }) => (
  <DStage life={life}>
    {(f, fps) => {
      const pa = sp(f, fps, calmAt);
      const so = sp(f, fps, sorryAt, { damping: 10, stiffness: 160, mass: 0.8 });
      const bow = f > sorryAt ? 16 + Math.sin((f - sorryAt) / 5) * 6 : 0;
      const shrink = 1 - 0.25 * lock(so);
      return (
        <Float f={f} amp={4}>
          <div style={{ position: "absolute", left: 60, top: 380 }}>
            <Avatar kind="paciente" label={TX.cliente} color={PAL.gold} size={200} on={pa} />
          </div>
          {pa > 0 ? (
            <div style={{ position: "absolute", left: 90, top: 210, background: "#fff", borderRadius: "30px 30px 30px 8px", padding: "14px 30px", color: "#444", fontSize: 40, fontWeight: 900, boxShadow: "0 18px 36px rgba(0,0,0,0.5)", ...fromDepth(pa) }}>
              nem reclamou
            </div>
          ) : null}
          <Shadow x={740} y={700} w={380 * shrink} o={0.55} />
          <div style={{ position: "absolute", left: 520, top: 430, width: 420, transformOrigin: "20% 100%", transform: `scale(${shrink}) rotate(${bow.toFixed(2)}deg)` }}>
            <svg width={420} height={230} viewBox="0 0 200 110" style={{ filter: "drop-shadow(0 16px 30px rgba(0,0,0,0.6))" }}>
              <path d="M40,5 L190,5 Q195,5 195,10 L195,100 Q195,105 190,105 L40,105 L5,55 Z" fill={ZALE.red} />
              <circle cx={34} cy={55} r={8} fill="#111" />
            </svg>
            <div style={{ position: "absolute", left: 100, right: 0, top: 0, height: 230, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 76, fontWeight: 900 }}>{price}</div>
            {so > 0
              ? [0, 1].map((k) => {
                  const t = ((f - sorryAt + k * 12) % 24) / 24;
                  return <div key={k} style={{ position: "absolute", left: 360 + k * 30, top: 10 + t * 60, width: 16, height: 24, borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%", background: "#7cc8ff", opacity: 1 - t }} />;
                })
              : null}
          </div>
          {so > 0 ? (
            <div style={{ position: "absolute", left: 560, top: 240, background: "#fff", color: "#111", borderRadius: "30px 30px 8px 30px", padding: "18px 34px", fontSize: 58, fontWeight: 900, opacity: so, transform: `scale(${0.6 + 0.4 * lock(so)})`, transformOrigin: "100% 100%" }}>
              desculpa…
            </div>
          ) : null}
          <Snd at={calmAt} name="pop" k="sorry-patient" />
          <Snd at={sorryAt} name="error" k="sorry-tag" />
        </Float>
      );
    }}
  </DStage>
);

// ============ D6. o preço passando de mão em mão ============
// Pessoas em fila (cada uma entra no seu `at`); o cartão "R$ X" pula de uma para a próxima quando ela entra.
export const HandOff: React.FC<{ life: number; people: { kind: string; label: string; at: number; color?: string }[]; price?: string }> = ({ life, people, price = "R$ X" }) => (
  <DStage life={life}>
    {(f, fps) => {
      const n = people.length;
      const xs = people.map((_, k) => 90 + (k * (900 - 180)) / Math.max(1, n - 1));
      const cols = [PAL.teal, PAL.gold, PAL.violet, PAL.blue, "#f472b6"];
      // índice do dono atual do cartão, com o salto animado
      let owner = 0;
      for (let k = 0; k < n; k++) if (f >= people[k].at) owner = k;
      const jt = interpolate(f, [people[owner].at, people[owner].at + 12], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
      const from = xs[Math.max(0, owner - 1)];
      const to = xs[owner];
      const cx = owner === 0 ? to : from + (to - from) * jt;
      const cy = 330 - (owner === 0 ? 0 : Math.sin(jt * Math.PI) * 120);
      const fade = owner === 0 ? 1 : 1 - 0.12 * owner; // o valor vai "perdendo tinta"
      return (
        <Float f={f} amp={4}>
          <div style={{ position: "absolute", left: 120, right: 120, top: 640, height: 6, borderRadius: 3, background: "rgba(255,255,255,0.15)" }} />
          {people.map((p, k) => {
            const on = sp(f, fps, p.at);
            return (
              <div key={k} style={{ position: "absolute", left: xs[k] - 60 + 45, top: 480 }}>
                <Avatar kind={p.kind} label={p.label} color={p.color ?? cols[k % 5]} size={120} on={on} />
              </div>
            );
          })}
          <div style={{ position: "absolute", left: cx + 40, top: cy, width: 190, height: 110, borderRadius: 16, background: `rgba(${ZALE.redRgb},${fade})`, color: "#fff", fontSize: 50, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 16px 40px rgba(0,0,0,0.5)", transform: `rotate(${(Math.sin(f / 7) * 4).toFixed(2)}deg)`, opacity: sp(f, fps, people[0].at) }}>
            {price}
          </div>
          {people.map((p, k) => (
            <Snd key={k} at={p.at} name="pop" k="handoff" />
          ))}
        </Float>
      );
    }}
  </DStage>
);

// ============ D7. em quem a paciente confia ============
// Paciente à esquerda; linha até a secretária é cortada (`noAt`); linha dourada até a médica (`yesAt`) e os motivos.
export const TrustLink: React.FC<{ life: number; noAt?: number; yesAt?: number; chips: { text: string; at: number }[] }> = ({ life, noAt = 10, yesAt = 50, chips }) => (
  <DStage life={life}>
    {(f, fps) => {
      const no = interpolate(f, [noAt, noAt + 14], [0, 1], clamp);
      const cut = interpolate(f, [noAt + 14, noAt + 22], [0, 1], clamp);
      const yes = interpolate(f, [yesAt, yesAt + 16], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
      const P = { x: 190, y: 400 };
      const S = { x: 860, y: 260 };
      const M = { x: 860, y: 560 };
      return (
        <Float f={f} amp={4}>
          <svg width={1080} height={SEAM} style={{ position: "absolute", left: 0, top: 0 }}>
            <line x1={P.x} y1={P.y} x2={P.x + (S.x - P.x) * no} y2={P.y + (S.y - P.y) * no} stroke="rgba(255,255,255,0.5)" strokeWidth={6} strokeDasharray="14 12" />
            <line x1={P.x} y1={P.y} x2={P.x + (M.x - P.x) * yes} y2={P.y + (M.y - P.y) * yes} stroke={PAL.gold} strokeWidth={12} strokeLinecap="round" style={{ filter: `drop-shadow(0 0 12px ${PAL.gold})` }} />
            {cut > 0 ? (
              <g transform={`translate(${(P.x + S.x) / 2}, ${(P.y + S.y) / 2}) scale(${cut})`}>
                <circle r={34} fill={ZALE.red} />
                <path d="M-13,-13 L13,13 M13,-13 L-13,13" stroke="#fff" strokeWidth={8} strokeLinecap="round" />
              </g>
            ) : null}
          </svg>
          <div style={{ position: "absolute", left: P.x - 110, top: P.y - 85 }}>
            <Avatar kind="paciente" label={TX.cliente} color={PAL.gold} size={150} on={sp(f, fps, 0)} />
          </div>
          <div style={{ position: "absolute", left: S.x - 100, top: S.y - 80 }}>
            <Avatar kind="secretaria" label="secretária" color="#9ca3af" size={130} on={sp(f, fps, noAt - 4)} dim={cut > 0.5} />
          </div>
          <div style={{ position: "absolute", left: M.x - 100, top: M.y - 80 }}>
            <Avatar kind={TX.iconeProfissional} label={TX.profissional} color={PAL.teal} size={130} on={sp(f, fps, yesAt - 4)} />
          </div>
          <div style={{ position: "absolute", left: 60, top: 690, display: "flex", flexWrap: "wrap", gap: 12, width: 960 }}>
            {chips.map((c, k) => (
              <Chip key={k} text={c.text} on={sp(f, fps, c.at)} color={PAL.gold} />
            ))}
          </div>
          <Snd at={noAt + 14} name="error" k="trust-no" />
          <Snd at={yesAt} name="switch" k="trust-yes" />
          {chips.map((c, k) => (
            <Snd key={k} at={c.at} name="tick" file="tick.wav" vol={0.2} k="trust-chip" />
          ))}
        </Float>
      );
    }}
  </DStage>
);

// ============ D8. a recomendação perdendo força ============
// Um medidor de sinal "sua recomendação" passa por pessoas (`hops`) e perde uma barra em cada; `lossAt` fica vermelho.
export const SignalLoss: React.FC<{ life: number; label?: string; hops: { label: string; at: number }[]; lossAt?: number }> = ({ life, label = "sua recomendação", hops, lossAt = 120 }) => (
  <DStage life={life}>
    {(f, fps) => {
      const n = hops.length;
      const passed = hops.filter((h) => f >= h.at).length;
      const bars = Math.max(1, 4 - passed);
      const lost = f >= lossAt;
      const xs = hops.map((_, k) => 180 + (k * 720) / Math.max(1, n - 1));
      const cur = passed === 0 ? 100 : xs[passed - 1];
      const prev = passed <= 1 ? 100 : xs[passed - 2];
      const jt = passed === 0 ? 1 : interpolate(f, [hops[passed - 1].at, hops[passed - 1].at + 12], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
      const mx = prev + (cur - prev) * jt;
      return (
        <Float f={f} amp={4}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 200, textAlign: "center", color: "#fff", fontSize: 50, fontWeight: 900 }}>{label}</div>
          <svg width={1080} height={SEAM} style={{ position: "absolute", left: 0, top: 0 }}>
            <path d={`M100,640 ${xs.map((x) => `L${x},640`).join(" ")}`} stroke="rgba(255,255,255,0.18)" strokeWidth={8} fill="none" strokeLinecap="round" />
          </svg>
          {hops.map((h, k) => (
            <div key={k} style={{ position: "absolute", left: xs[k] - 70, top: 670, width: 140, textAlign: "center", color: "rgba(255,255,255,0.8)", fontSize: 28, fontWeight: 800, opacity: sp(f, fps, h.at - 6) }}>
              <Hand size={44} color="#fff" style={{ display: "block", margin: "0 auto 6px" }} />
              {h.label}
            </div>
          ))}
          <Glass style={{ left: mx - 90, top: 330, width: 180, height: 250, display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 12, padding: "0 0 30px", boxSizing: "border-box" }} tint={lost ? `rgba(${ZALE.redRgb},0.18)` : "rgba(255,255,255,0.08)"}>
            {[1, 2, 3, 4].map((b) => (
              <div key={b} style={{ width: 26, height: 34 + b * 34, borderRadius: 8, background: b <= bars ? (lost ? ZALE.red : PAL.teal) : "rgba(255,255,255,0.12)" }} />
            ))}
          </Glass>
          {hops.map((h, k) => (
            <Snd key={k} at={h.at} name="error" k="signal-drop" />
          ))}
        </Float>
      );
    }}
  </DStage>
);

// ============ D9. escada dos passos ============
// Degraus que sobem da esquerda para a direita; cada passo acende no seu `at` com o texto falado.
export const StairSteps: React.FC<{ life: number; steps: { text: string; at: number }[] }> = ({ life, steps }) => (
  <DStage life={life}>
    {(f, fps) => {
      const n = steps.length;
      const cols = [PAL.teal, PAL.gold, PAL.violet, PAL.blue];
      const W = 220;
      const H = 120;
      const x0 = CX - (n * W) / 2;
      const base = 860;
      const lit = steps.filter((s) => f >= s.at).length;
      return (
        <Float f={f} amp={4}>
          {steps.map((s, k) => {
            const on = sp(f, fps, s.at);
            const h = H * (k + 1);
            return (
              <React.Fragment key={k}>
                {/* face de cima (tampa em perspectiva) + frente: o degrau ganha volume */}
                <div style={{ position: "absolute", left: x0 + k * W + 14, top: base - h - 22, width: W - 8, height: 24, background: on > 0 ? cols[k % 4] : "rgba(255,255,255,0.12)", transform: "skewX(-32deg)", transformOrigin: "0 100%", filter: "brightness(1.25)" }} />
                <div style={{ position: "absolute", left: x0 + k * W, top: base - h, width: W - 8, height: h, background: on > 0 ? `linear-gradient(180deg, ${cols[k % 4]}, ${cols[k % 4]}88)` : "rgba(255,255,255,0.07)", border: "1.5px solid rgba(255,255,255,0.15)", boxShadow: on > 0 ? `0 0 40px ${cols[k % 4]}44, 0 30px 50px rgba(0,0,0,0.5)` : "0 30px 50px rgba(0,0,0,0.4)" }} />
                <div style={{ position: "absolute", left: x0 + k * W - 10, top: base - h - 30 - 170, width: W + 12, textAlign: "center", color: "#fff", fontSize: 30, fontWeight: 800, lineHeight: 1.1, opacity: on, transform: `translateY(${(1 - on) * 20}px)` }}>
                  <span style={{ display: "inline-block", width: 44, height: 44, lineHeight: "44px", borderRadius: 22, background: cols[k % 4], color: "#0d1614", fontWeight: 900, marginBottom: 6 }}>{k + 1}</span>
                  <br />
                  {s.text}
                </div>
              </React.Fragment>
            );
          })}
          {/* bolinha que sobe de degrau em degrau */}
          {lit > 0 ? (
            <div style={{ position: "absolute", left: x0 + (lit - 1) * W + W / 2 - 24, top: base - H * lit - 60, width: 44, height: 44, borderRadius: 24, background: "#fff", boxShadow: "0 0 30px rgba(255,255,255,0.7)" }} />
          ) : null}
          {steps.map((s, k) => (
            <Snd key={k} at={s.at} name="pop" k="stair" />
          ))}
        </Float>
      );
    }}
  </DStage>
);

// ============ D10. a mesma voz ============
export const SameVoice: React.FC<{ life: number; left?: string; right?: string; eqAt?: number }> = ({ life, left = "explicar o tratamento", right = "o valor", eqAt = 30 }) => (
  <DStage life={life}>
    {(f, fps) => {
      const eq = sp(f, fps, eqAt);
      const wave = (seed: number, k: number) => 0.35 + 0.65 * Math.abs(Math.sin(f / 3 + k * 0.7 + seed) * Math.cos(k * 0.33));
      const Row: React.FC<{ y: number; label: string; color: string; on: number }> = ({ y, label, color, on }) => (
        <Glass style={{ left: 90, top: y, width: 900, height: 230, opacity: on, transform: `translateX(${(1 - on) * -60}px)` }}>
          <div style={{ position: "absolute", left: 30, top: 18, color: "#fff", fontSize: 32, fontWeight: 800 }}>{label}</div>
          <div style={{ position: "absolute", left: 30, right: 30, top: 70, bottom: 20, display: "flex", alignItems: "center", gap: 9 }}>
            {Array.from({ length: 36 }).map((_, k) => (
              <div key={k} style={{ flex: 1, height: `${wave(0, k) * 100}%`, borderRadius: 6, background: color }} />
            ))}
          </div>
        </Glass>
      );
      return (
        <Float f={f} amp={4}>
          <Row y={200} label={left} color={PAL.teal} on={sp(f, fps, 0)} />
          <Row y={560} label={right} color={PAL.teal} on={sp(f, fps, 8)} />
          <div style={{ position: "absolute", left: CX - 50, top: 440, width: 100, height: 100, borderRadius: 50, background: "#fff", color: "#111", fontSize: 76, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", opacity: eq, transform: `scale(${0.5 + 0.5 * lock(eq)})` }}>=</div>
          <Snd at={8} name="pop" k="samevoice" />
          <Snd at={eqAt} name="ding" k="samevoice-eq" />
        </Float>
      );
    }}
  </DStage>
);

// ============ D11. sem se justificar ============
// Balões de justificativa ("…") empilhando do lado da médica são cortados pela tesoura (`cutAt`); a paciente reage (`askAt`)
// e a resposta certa aparece (`answerAt`).
export const NoJustify: React.FC<{ life: number; cutAt?: number; askAt?: number; answerAt?: number }> = ({ life, cutAt = 30, askAt = 90, answerAt = 150 }) => (
  <DStage life={life}>
    {(f, fps) => {
      const cut = interpolate(f, [cutAt, cutAt + 10], [0, 1], clamp);
      const ask = sp(f, fps, askAt);
      const ans = sp(f, fps, answerAt);
      return (
        <Float f={f} amp={4}>
          {[0, 1, 2, 3].map((k) => {
            const on = sp(f, fps, 2 + k * 5);
            const fall = cut > 0 ? (f - cutAt) * (6 + k * 3) : 0;
            return (
              <div key={k} style={{ position: "absolute", left: 90 + k * 34, top: 200 + k * 96 + fall, width: 380, height: 80, borderRadius: 26, background: "rgba(255,255,255,0.9)", color: "#666", fontSize: 48, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", opacity: on * (1 - cut * 0.9), transform: `rotate(${(cut * (k % 2 ? 18 : -14)).toFixed(1)}deg)` }}>
                …
              </div>
            );
          })}
          {cut > 0 && cut < 1 ? (
            <div style={{ position: "absolute", left: 60 + cut * 520, top: 330, transform: "rotate(-90deg)" }}>
              <Scissors size={90} color="#fff" />
            </div>
          ) : null}
          {ask > 0 ? (
            <div style={{ position: "absolute", right: 90, top: 260, width: 170, height: 170, borderRadius: "50% 50% 50% 12%", background: PAL.gold, color: "#111", fontSize: 110, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", opacity: ask, transform: `scale(${0.5 + 0.5 * lock(ask)})` }}>?</div>
          ) : null}
          {ans > 0 ? (
            <div style={{ position: "absolute", left: 200, top: 600, opacity: ans }}>
              <Chip text="responde o que ela quer saber" on={ans} color={PAL.teal} />
            </div>
          ) : null}
          {[0, 1, 2, 3].map((k) => (
            <Snd key={k} at={2 + k * 5} name="pop" k="justify-bubble" />
          ))}
          <Snd at={cutAt} name="tick" file="pen_stroke.wav" vol={0.35} k="justify-cut" />
          <Snd at={askAt} name="pop" k="justify-ask" />
          <Snd at={answerAt} name="ding" k="justify-answer" />
        </Float>
      );
    }}
  </DStage>
);

// ============ D12. revezamento: a equipe entra depois ============
// Você (médica) segura o bastão; em `passAt` ele passa para a equipe; as tarefas acendem no seu `at`.
export const RelayBaton: React.FC<{ life: number; passAt?: number; tasks: { text: string; at: number }[] }> = ({ life, passAt = 12, tasks }) => (
  <DStage life={life}>
    {(f, fps) => {
      const p = interpolate(f, [passAt, passAt + 16], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
      const bx = 300 + p * 460;
      const by = 360 - Math.sin(p * Math.PI) * 110;
      return (
        <Float f={f} amp={4}>
          <div style={{ position: "absolute", left: 140, top: 250 }}>
            <Avatar kind={TX.iconeProfissional} label="você" color={PAL.teal} size={150} on={sp(f, fps, 0)} />
          </div>
          <div style={{ position: "absolute", left: 640, top: 250 }}>
            <Avatar kind="time" label="equipe" color={PAL.violet} size={150} on={sp(f, fps, 4)} />
          </div>
          <div style={{ position: "absolute", left: bx, top: by, width: 90, height: 26, borderRadius: 13, background: `linear-gradient(90deg, ${PAL.gold}, #fff2c4)`, boxShadow: `0 0 24px ${PAL.gold}`, transform: `rotate(${(p * 360).toFixed(1)}deg)` }} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 590, display: "flex", justifyContent: "center", gap: 18, flexWrap: "wrap", padding: "0 60px" }}>
            {tasks.map((t, k) => (
              <Chip key={k} text={t.text} on={sp(f, fps, t.at)} color={PAL.violet} />
            ))}
          </div>
          <Snd at={passAt} name="switch" k="baton" />
          {tasks.map((t, k) => (
            <Snd key={k} at={t.at} name="tick" file="tick.wav" vol={0.2} k="baton-task" />
          ))}
        </Float>
      );
    }}
  </DStage>
);

// ============ D13. a decisão acontece na sala ============
// Você e a paciente dentro da sala; a porta fecha em `closeAt` e acende "decisão".
export const DoorClose: React.FC<{ life: number; closeAt?: number; label?: string }> = ({ life, closeAt = 30, label = "decisão com você na sala" }) => (
  <DStage life={life}>
    {(f, fps) => {
      const c = interpolate(f, [closeAt, closeAt + 12], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
      const glow = f > closeAt + 12 ? 1 : 0;
      const L = CX - 330;
      return (
        <Float f={f} amp={4}>
          <div style={{ position: "absolute", left: L, top: 220, width: 660, height: 560, borderRadius: 20, background: "linear-gradient(#2a2a2a,#1a1a1a)", border: "10px solid #5a4a3a", overflow: "hidden" }}>
            <div style={{ position: "absolute", left: 90, top: 190 }}>
              <Avatar kind={TX.iconeProfissional} label="você" color={PAL.teal} size={130} />
            </div>
            <div style={{ position: "absolute", left: 360, top: 190 }}>
              <Avatar kind="paciente" label={TX.cliente} color={PAL.gold} size={130} />
            </div>
            {/* porta girando para fechar (perspectiva) */}
            <div style={{ position: "absolute", inset: 0, perspective: 1400 }}>
              <div style={{ position: "absolute", inset: 0, transformOrigin: "0% 50%", transform: `rotateY(${(-100 + c * 100).toFixed(2)}deg)`, background: "linear-gradient(90deg,#8a6a4a,#a07c56)", boxShadow: "inset 0 0 0 14px #6d5238", display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 40, boxSizing: "border-box" }}>
                <div style={{ width: 26, height: 26, borderRadius: 13, background: "#e8c060" }} />
              </div>
            </div>
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 812, textAlign: "center", opacity: glow ? sp(f, fps, closeAt + 12) : 0 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 12, background: PAL.teal, color: "#0d1614", fontSize: 40, fontWeight: 900, padding: "10px 26px", borderRadius: 999 }}>
              <DoorClosed size={34} color="#0d1614" /> {label}
            </span>
          </div>
          <Snd at={closeAt + 12} name="thud" k="door" />
        </Float>
      );
    }}
  </DStage>
);

// ============ D14. fechar ali mesmo, sem empurrar ============
export const CloseHere: React.FC<{ life: number; hereAt?: number; pushAt?: number; here?: string; push?: string }> = ({ life, hereAt = 12, pushAt = 50, here = TX.momentoDaVenda, push = "sem empurrar nada" }) => (
  <DStage life={life}>
    {(f, fps) => {
      const h = sp(f, fps, hereAt);
      const p = sp(f, fps, pushAt);
      const x = interpolate(f, [pushAt + 6, pushAt + 14], [0, 1], clamp);
      return (
        <Float f={f} amp={4}>
          <Glass tint="rgba(45,212,191,0.14)" style={{ left: 120, top: 220, width: 840, height: 260, display: "flex", alignItems: "center", gap: 30, padding: "0 50px", boxSizing: "border-box", opacity: h, transform: `scale(${0.85 + 0.15 * lock(h)})` }}>
            <Handshake size={120} color={PAL.teal} />
            <div style={{ color: "#fff", fontSize: 64, fontWeight: 900 }}>{here}</div>
            <div style={{ marginLeft: "auto", width: 80, height: 80, borderRadius: 40, background: PAL.teal, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Check size={50} color="#0d1614" strokeWidth={3.5} />
            </div>
          </Glass>
          <Glass style={{ left: 120, top: 540, width: 840, height: 240, display: "flex", alignItems: "center", gap: 30, padding: "0 50px", boxSizing: "border-box", opacity: p, transform: `scale(${0.85 + 0.15 * lock(p)})` }}>
            <div style={{ position: "relative" }}>
              <Hand size={110} color="#fff" style={{ transform: "rotate(90deg)" }} />
              {x > 0 ? <X size={130} color={ZALE.red} strokeWidth={3} style={{ position: "absolute", left: -10, top: -10, opacity: x }} /> : null}
            </div>
            <div style={{ color: "#fff", fontSize: 58, fontWeight: 900 }}>{push}</div>
          </Glass>
          <Snd at={hereAt} name="ding" k="close-here" />
          <Snd at={pushAt} name="pop" k="close-push" />
          <Snd at={pushAt + 6} name="error" k="close-push-x" />
        </Float>
      );
    }}
  </DStage>
);

// ============ D15. balança: segurança x pressão ============
export const BalanceScale: React.FC<{ life: number; left?: string; right?: string; leftAt?: number; rightAt?: number; tipAt?: number }> = ({ life, left = "segurança", right = "pressão", leftAt = 20, rightAt = 50, tipAt = 50 }) => (
  <DStage life={life}>
    {(f, fps) => {
      const tip = interpolate(f, [tipAt, tipAt + 20], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.6)) });
      const ang = 14 * tip + Math.sin(f / 18) * 1.2; // a segurança pesa (desce)
      const rad = (ang * Math.PI) / 180;
      const arm = 330;
      const py = 330;
      const lx = CX - Math.cos(rad) * arm;
      const ly = py - Math.sin(rad) * arm * -1;
      const rx = CX + Math.cos(rad) * arm;
      const ry = py + Math.sin(rad) * arm * -1;
      const Pan: React.FC<{ x: number; y: number; text: string; color: string; on: number }> = ({ x, y, text, color, on }) => (
        <>
          <svg width={1080} height={SEAM} style={{ position: "absolute", left: 0, top: 0 }}>
            <line x1={x} y1={y} x2={x - 110} y2={y + 170} stroke="#bbb" strokeWidth={3} />
            <line x1={x} y1={y} x2={x + 110} y2={y + 170} stroke="#bbb" strokeWidth={3} />
            <path d={`M${x - 150},${y + 170} Q${x},${y + 250} ${x + 150},${y + 170} Z`} fill="#cfcfcf" />
          </svg>
          <div style={{ position: "absolute", left: x - 150, top: y + 100, width: 300, textAlign: "center", opacity: on, transform: `translateY(${(1 - on) * -40}px)` }}>
            <span style={{ display: "inline-block", background: color, color: color === ZALE.red ? "#fff" : "#0d1614", fontSize: 40, fontWeight: 900, padding: "10px 22px", borderRadius: 16 }}>{text}</span>
          </div>
        </>
      );
      return (
        <Float f={f} amp={3}>
          <svg width={1080} height={SEAM} style={{ position: "absolute", left: 0, top: 0 }}>
            <rect x={CX - 12} y={py} width={24} height={500} fill="#8d8d8d" />
            <rect x={CX - 120} y={py + 490} width={240} height={26} rx={10} fill="#6d6d6d" />
            <line x1={lx} y1={ly} x2={rx} y2={ry} stroke="#d0d0d0" strokeWidth={16} strokeLinecap="round" />
            <circle cx={CX} cy={py} r={20} fill="#f5f5f5" />
          </svg>
          <Pan x={lx} y={ly} text={left} color={PAL.teal} on={sp(f, fps, leftAt)} />
          <Pan x={rx} y={ry} text={right} color={ZALE.red} on={sp(f, fps, rightAt)} />
          <Snd at={leftAt} name="pop" k="balance" />
          <Snd at={rightAt} name="pop" k="balance" />
          <Snd at={tipAt + 8} name="thud" k="balance-tip" />
        </Float>
      );
    }}
  </DStage>
);

// ============ D16. CTA: comentário chegando e a DM abrindo ============
export const DmCta: React.FC<{ life: number; keyword?: string; commentAt?: number; dmAt?: number; handle?: string }> = ({ life, keyword = TX.palavraCta, commentAt = 20, dmAt = 70, handle = BRAND.handle }) => (
  <DStage life={life}>
    {(f, fps) => {
      const on = sp(f, fps, 0, { damping: 14, stiffness: 140, mass: 0.9 });
      const n = Math.round(interpolate(f, [commentAt, commentAt + keyword.length * 3], [0, keyword.length], clamp));
      const dm = sp(f, fps, dmAt, { damping: 12, stiffness: 170, mass: 0.8 });
      const PW = 500;
      return (
        <Float f={f} amp={4}>
          <div style={{ position: "absolute", left: CX - PW / 2, top: 190, width: PW, height: 620, borderRadius: 56, background: "#0f0f10", border: "10px solid #2a2a2e", boxShadow: "0 30px 80px rgba(0,0,0,0.6)", overflow: "hidden", opacity: on, transform: `translateY(${(1 - on) * 80}px)` }}>
            <div style={{ height: 70, display: "flex", alignItems: "center", gap: 12, padding: "0 26px", color: "#fff", fontSize: 26, fontWeight: 800, borderBottom: "1px solid #222" }}>
              <MessageCircle size={28} color="#fff" /> comentários
            </div>
            {[0.7, 0.55, 0.8].map((w, k) => (
              <div key={k} style={{ display: "flex", gap: 14, padding: "18px 26px", alignItems: "center" }}>
                <div style={{ width: 50, height: 50, borderRadius: 25, background: "#333" }} />
                <div style={{ flex: 1 }}>
                  <div style={{ height: 12, width: `${w * 100}%`, background: "#333", borderRadius: 6, marginBottom: 10 }} />
                  <div style={{ height: 12, width: `${w * 60}%`, background: "#2a2a2a", borderRadius: 6 }} />
                </div>
              </div>
            ))}
            <div style={{ display: "flex", gap: 14, padding: "18px 26px", alignItems: "center", background: n > 0 ? `rgba(${ZALE.redRgb},0.12)` : "transparent" }}>
              <div style={{ width: 50, height: 50, borderRadius: 25, background: PAL.gold }} />
              <div style={{ color: "#fff", fontSize: 44, fontWeight: 900, letterSpacing: 2 }}>
                {keyword.slice(0, n)}
                {n < keyword.length && f >= commentAt ? <span style={{ opacity: Math.floor(f / 8) % 2 ? 1 : 0 }}>|</span> : null}
              </div>
            </div>
            {dm > 0 ? (
              <div style={{ position: "absolute", left: 20, right: 20, top: 20, borderRadius: 26, background: "rgba(40,40,44,0.97)", padding: "20px 22px", display: "flex", gap: 16, alignItems: "center", boxShadow: "0 16px 40px rgba(0,0,0,0.6)", transform: `translateY(${(1 - dm) * -140}px)`, opacity: Math.min(1, dm * 2) }}>
                <div style={{ width: 60, height: 60, borderRadius: 30, background: ZALE.red, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <MessageCircle size={32} color="#fff" />
                </div>
                <div>
                  <div style={{ color: "#fff", fontSize: 28, fontWeight: 900 }}>{handle}</div>
                  <div style={{ color: "#bbb", fontSize: 24 }}>nova mensagem na DM</div>
                </div>
              </div>
            ) : null}
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 832, textAlign: "center", opacity: sp(f, fps, commentAt), color: "#fff", fontSize: 44, fontWeight: 800 }}>
            comenta <span style={{ color: ZALE.redBright }}>“{keyword}”</span>
          </div>
          <SndSpan at={commentAt} dur={keyword.length * 3} name="type" vol={0.22} />
          <Snd at={dmAt} name="ding" k="dm" />
        </Float>
      );
    }}
  </DStage>
);

