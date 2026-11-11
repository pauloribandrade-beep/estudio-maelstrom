import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { FONT } from "./overlays";
import { ZALE } from "./theme";
import { SEAM, Snd, SndSpan, STAGE } from "./palco";

// CENAS NARRATIVAS (pedido do usuário: sair do padrão carimbo/texto; cada cena pensada para a fala).
// Todas: tempos em frames relativos à Sequence (o edit.json usa segundos; o registry converte).

export const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
const CX = 540;
const CY = (STAGE.y0 + STAGE.y1) / 2;
export const sp = (f: number, fps: number, at = 0, k = { damping: 15, stiffness: 170, mass: 0.8 }) => (f < at ? 0 : spring({ frame: f - at, fps, config: k }));

// Moldura comum: entra, flutua junto (card inteiro, translate3d para o texto não tremer), sai.
export const Frame: React.FC<{ life: number; w: number; children: (f: number, fps: number) => React.ReactNode }> = ({ life, w, children }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = sp(f, fps);
  const out = interpolate(f, [life - 7, life], [1, 0], { ...clamp, easing: Easing.in(Easing.cubic) });
  const float = Math.sin(f / 24) * 6;
  return (
    <div
      style={{
        position: "absolute",
        left: CX - w / 2,
        width: w,
        top: CY,
        transform: `translate3d(0, calc(-50% + ${float.toFixed(3)}px), 0) scale(${p > 0.997 ? 1 : 0.92 + 0.08 * p})`,
        opacity: Math.min(p, out),
        willChange: "transform",
        backfaceVisibility: "hidden",
        fontFamily: FONT,
      }}
    >
      {children(f, fps)}
    </div>
  );
};

// ---------- foto com zoom no detalhe + círculo desenhado à mão ----------
// `focus` = ponto da foto em % [x, y] (ex.: a boca). O zoom vai de 1 até `zoom` ao longo da cena;
// em `markAt` um círculo é desenhado em volta do ponto. `name` = etiqueta discreta (nome da pessoa).
export const PhotoFocus: React.FC<{ life: number; src: string; focus?: [number, number]; zoom?: number; markAt?: number; name?: string; credit?: string; h?: number }> = ({
  life,
  src,
  focus = [50, 50],
  zoom = 1.35,
  markAt,
  name,
  credit,
  h = 640,
}) => (
  <Frame life={life} w={860}>
    {(f, fps) => {
      const z = interpolate(f, [0, life], [1.02, zoom], { ...clamp, easing: Easing.inOut(Easing.quad) });
      const draw = markAt !== undefined ? interpolate(f, [markAt, markAt + 14], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) }) : 0;
      const tag = sp(f, fps, 8);
      // posição do ponto na moldura depois do zoom (zoom centrado no próprio ponto: ele não sai do lugar)
      const px = (focus[0] / 100) * 860;
      const py = (focus[1] / 100) * h;
      const R = 70;
      const len = 2 * Math.PI * R * 1.1;
      return (
        <div style={{ position: "relative", width: 860, height: h, borderRadius: 30, overflow: "hidden", boxShadow: "0 40px 100px rgba(0,0,0,0.6)" }}>
          <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `${focus[0]}% ${focus[1]}%`, transform: `scale(${z})`, transformOrigin: `${focus[0]}% ${focus[1]}%` }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)" }} />
          {markAt !== undefined && draw > 0.002 ? (
            <svg width={860} height={h} style={{ position: "absolute", left: 0, top: 0 }}>
              <ellipse
                cx={px}
                cy={py}
                rx={R * 1.35}
                ry={R * 0.95}
                fill="none"
                stroke={ZALE.red}
                strokeWidth={9}
                strokeLinecap="round"
                strokeDasharray={len}
                strokeDashoffset={len * (1 - draw)}
                transform={`rotate(-8 ${px} ${py})`}
                style={{ filter: `drop-shadow(0 0 10px rgba(${ZALE.redRgb},0.8))` }}
              />
            </svg>
          ) : null}
          {name ? (
            <div
              style={{
                position: "absolute",
                left: 28,
                bottom: 26,
                display: "flex",
                alignItems: "center",
                gap: 12,
                transform: `translateX(${(1 - tag) * -40}px)`,
                opacity: tag,
              }}
            >
              <div style={{ width: 6, height: 44, borderRadius: 3, background: ZALE.red }} />
              <div style={{ color: "#fff", fontSize: 40, fontWeight: 800, letterSpacing: -0.5, textShadow: "0 2px 10px rgba(0,0,0,0.6)" }}>{name}</div>
            </div>
          ) : null}
          {credit ? <div style={{ position: "absolute", right: 18, bottom: 12, color: "rgba(255,255,255,0.6)", fontSize: 16 }}>{credit}</div> : null}
          {markAt !== undefined ? <SndSpan at={markAt} dur={14} name="write" vol={0.3} /> : null}
        </div>
      );
    }}
  </Frame>
);

// ---------- número contando por cima de uma foto ----------
const fmtBR = (n: number) => Math.round(n).toLocaleString("pt-BR");
export const CountUp: React.FC<{ life: number; src?: string; to: number; from?: number; plain?: boolean; prefix?: string; suffix?: string; countAt?: number; dur?: number; label?: string }> = ({
  life,
  src,
  to,
  from = 0,
  plain = false,
  prefix = "",
  suffix = "",
  countAt = 0,
  dur = 30,
  label,
}) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = interpolate(f, [countAt, countAt + dur], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const done = f >= countAt + dur;
  const punch = done ? 1 + 0.06 * Math.max(0, 1 - (f - countAt - dur) / 8) : 1;
  const bg = sp(f, fps);
  const out = interpolate(f, [life - 7, life], [1, 0], { ...clamp, easing: Easing.in(Easing.cubic) });
  const numIn = sp(f, fps, countAt);
  return (
    <AbsoluteFill style={{ height: SEAM, opacity: out, fontFamily: FONT }}>
      {src ? (
        <AbsoluteFill style={{ opacity: bg }}>
          <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${1.05 + f / 900})`, filter: "blur(3px) brightness(0.42) saturate(1.1)" }} />
          <AbsoluteFill style={{ background: "radial-gradient(70% 60% at 50% 50%, rgba(0,0,0,0) 0%, rgba(0,0,0,0.65) 100%)" }} />
        </AbsoluteFill>
      ) : null}
      <div style={{ position: "absolute", left: 0, right: 0, top: CY, transform: `translateY(-50%) scale(${(0.9 + 0.1 * numIn) * punch})`, textAlign: "center", opacity: numIn }}>
        {label ? <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 40, fontWeight: 700, marginBottom: 10 }}>{label}</div> : null}
        <div style={{ color: "#fff", fontSize: 108, fontWeight: 900, letterSpacing: -3, fontVariantNumeric: "tabular-nums", textShadow: "0 6px 40px rgba(0,0,0,0.6)" }}>
          <span style={{ color: ZALE.redBright }}>{prefix}</span>
          {plain ? Math.round(from + (to - from) * t) : fmtBR(from + (to - from) * t)}
          {suffix}
        </div>
      </div>
      <SndSpan at={countAt} dur={dur} name="type" vol={0.18} />
      <Snd at={countAt + dur} name="ding" />
    </AbsoluteFill>
  );
};

// ---------- antes e depois com cortina ----------
export const BeforeAfter: React.FC<{ life: number; before: string; after: string; labels?: [string, string]; wipeAt?: number; dur?: number; focus?: [number, number]; focus2?: [number, number] }> = ({
  life,
  before,
  after,
  labels = ["antes", "depois"],
  wipeAt = 10,
  dur = 22,
  focus = [50, 40],
  focus2,
}) => (
  <Frame life={life} w={860}>
    {(f) => {
      const x = interpolate(f, [wipeAt, wipeAt + dur], [100, 50], { ...clamp, easing: Easing.inOut(Easing.cubic) });
      const img: React.CSSProperties = { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: `${focus[0]}% ${focus[1]}%` };
      const chip = (t: string, side: "l" | "r", on: number): React.CSSProperties => ({
        position: "absolute",
        top: 22,
        [side === "l" ? "left" : "right"]: 22,
        background: side === "l" ? "rgba(0,0,0,0.6)" : ZALE.red,
        color: "#fff",
        fontWeight: 800,
        fontSize: 30,
        padding: "8px 16px",
        borderRadius: 12,
        opacity: on,
      });
      return (
        <div style={{ position: "relative", width: 860, height: 640, borderRadius: 30, overflow: "hidden", boxShadow: "0 40px 100px rgba(0,0,0,0.6)", background: "#000" }}>
          <Img src={staticFile(before)} style={img} />
          <div style={{ position: "absolute", inset: 0, clipPath: `inset(0 0 0 ${x}%)` }}>
            <Img src={staticFile(after)} style={focus2 ? { ...img, objectPosition: `${focus2[0]}% ${focus2[1]}%` } : img} />
          </div>
          <div style={{ position: "absolute", top: 0, bottom: 0, left: `${x}%`, width: 6, marginLeft: -3, background: "#fff", boxShadow: "0 0 20px rgba(0,0,0,0.6)", opacity: x < 99.5 ? 1 : 0 }}>
            <div style={{ position: "absolute", top: "50%", left: -19, width: 44, height: 44, marginTop: -22, borderRadius: 22, background: "#fff", boxShadow: "0 4px 16px rgba(0,0,0,0.5)" }} />
          </div>
          <div style={chip(labels[0], "l", 1)}>{labels[0]}</div>
          <div style={chip(labels[1], "r", interpolate(f, [wipeAt + dur * 0.5, wipeAt + dur], [0, 1], clamp))}>{labels[1]}</div>
          <SndSpan at={wipeAt} dur={dur} name="write" vol={0.12} />
        </div>
      );
    }}
  </Frame>
);

// ---------- reações subindo (a internet comentou) ----------
// Sobreposição: ícones/emojis sobem da base do palco, cada um com seu ritmo. Nada de texto inventado.
export const Reactions: React.FC<{ life: number; items?: string[]; count?: number; zone?: "all" | "sides"; dir?: "up" | "down" }> = ({ life, items = ["😳", "🔥", "💬", "👀", "😂", "❤️", "💋"], count = 22, zone = "all", dir = "up" }) => {
  const f = useCurrentFrame();
  const out = interpolate(f, [life - 8, life], [1, 0], clamp);
  return (
    <AbsoluteFill style={{ height: SEAM, pointerEvents: "none", opacity: out }}>
      {Array.from({ length: count }).map((_, i) => {
        const start = Math.floor(random(`s${i}`) * Math.max(1, life - 30));
        const t = (f - start) / 45;
        if (t < 0 || t > 1) return null;
        // "sides": só nas laterais (não cobre a foto/cena do meio)
        const rx = random(`x${i}`);
        const x = (zone === "sides" ? (rx < 0.5 ? 50 + rx * 2 * 150 : 880 + (rx - 0.5) * 2 * 150) : 120 + rx * 840) + Math.sin(t * 6 + i) * 20;
        const y = dir === "down" ? 40 + t * (SEAM * 0.8) : SEAM - 60 - t * (SEAM * 0.75);
        const s = 0.8 + random(`z${i}`) * 0.9;
        const o = interpolate(t, [0, 0.1, 0.75, 1], [0, 1, 1, 0]);
        return (
          <div key={i} style={{ position: "absolute", left: x, top: y, fontSize: 64 * s, opacity: o, transform: `translate(-50%, -50%) rotate(${(dir === "down" ? 130 : 0) + Math.sin(t * 4 + i) * 12}deg)` }}>
            {items[i % items.length]}
          </div>
        );
      })}
      <Snd at={2} name="pop" />
    </AbsoluteFill>
  );
};

// ---------- verbete de dicionário ----------
export const DictEntry: React.FC<{ life: number; word: string; phon?: string; cls?: string; def: string; typeAt?: number; cps?: number }> = ({ life, word, phon, cls, def, typeAt = 10, cps = 26 }) => (
  <Frame life={life} w={900}>
    {(f, fps) => {
      const n = Math.max(0, Math.floor(((f - typeAt) / fps) * cps));
      const shown = def.slice(0, n);
      const typing = n < def.length;
      return (
        <div style={{ background: "#f6f1e7", borderRadius: 26, padding: "46px 52px", color: "#1b1a17", boxShadow: "0 40px 100px rgba(0,0,0,0.6)", fontFamily: "Georgia, 'Times New Roman', serif" }}>
          <div style={{ fontSize: 26, letterSpacing: 4, textTransform: "uppercase", color: "#8a7f6c", fontFamily: FONT, fontWeight: 700 }}>dicionário</div>
          <div style={{ fontSize: 96, fontWeight: 700, lineHeight: 1.05, marginTop: 10 }}>{word}</div>
          <div style={{ fontSize: 32, color: "#6d6557", marginTop: 8 }}>
            {phon ? <span style={{ marginRight: 18 }}>{phon}</span> : null}
            {cls ? <i>{cls}</i> : null}
          </div>
          <div style={{ height: 2, background: "#d9cfbd", margin: "26px 0" }} />
          <div style={{ fontSize: 44, lineHeight: 1.3, minHeight: 60 }}>
            <span style={{ color: ZALE.red, fontWeight: 700, fontFamily: FONT, marginRight: 12 }}>1.</span>
            {shown}
            <span style={{ opacity: typing && f % 16 < 8 ? 1 : typing ? 0 : 0, borderLeft: "3px solid #1b1a17", marginLeft: 2 }} />
          </div>
          <SndSpan at={typeAt} dur={(def.length / cps) * fps} name="type" />
        </div>
      );
    }}
  </Frame>
);

// ---------- flashback: polaroid de um ano que já passou ----------
// Uma cena só (sem cortes): a polaroid cai na mesa girando, o ano é escrito na borda
// quando ele é falado, o nome entra na foto e a idade bate como um selo no canto.
// `yearAt`, `nameAt`, `ageAt` = quando cada um aparece (acompanham a fala).
export const Flashback: React.FC<{ life: number; src: string; year: string; name?: string; age?: string; focus?: [number, number]; yearAt?: number; nameAt?: number; ageAt?: number }> = ({
  life,
  src,
  year,
  name,
  age,
  focus = [50, 45],
  yearAt = 4,
  nameAt,
  ageAt,
}) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const W = 720;
  const PH = 500;
  const drop = sp(f, fps, 0, { damping: 14, stiffness: 120, mass: 0.9 });
  const out = interpolate(f, [life - 7, life], [1, 0], { ...clamp, easing: Easing.in(Easing.cubic) });
  const rot = interpolate(drop, [0, 1], [-18, -4]);
  const ty = interpolate(drop, [0, 1], [-420, 0]);
  const float = Math.sin(f / 26) * 5;
  // foto "revelando": começa clara e lavada, ganha cor no primeiro segundo
  const dev = interpolate(f, [4, 30], [0, 1], { ...clamp, easing: Easing.out(Easing.quad) });
  const z = interpolate(f, [0, life], [1.04, 1.16], clamp);
  const chars = Math.max(0, Math.min(year.length, Math.floor((f - yearAt) / 2) + 1));
  const nameIn = nameAt !== undefined ? sp(f, fps, nameAt) : 0;
  const ageIn = ageAt !== undefined ? sp(f, fps, ageAt, { damping: 11, stiffness: 220, mass: 0.7 }) : 0;
  return (
    <AbsoluteFill style={{ height: SEAM, opacity: out, fontFamily: FONT }}>
      <div
        style={{
          position: "absolute",
          left: CX - W / 2,
          top: CY,
          width: W,
          transform: `translate3d(0, calc(-50% + ${(ty + float).toFixed(2)}px), 0) rotate(${rot.toFixed(3)}deg)`,
          opacity: Math.min(1, drop * 3),
          willChange: "transform",
          backfaceVisibility: "hidden",
        }}
      >
        <div style={{ background: "#f4efe6", padding: "20px 20px 0", borderRadius: 8, boxShadow: "0 40px 90px rgba(0,0,0,0.65)" }}>
          <div style={{ position: "relative", width: W - 40, height: PH, overflow: "hidden", background: "#ddd" }}>
            <Img
              src={staticFile(src)}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: `${focus[0]}% ${focus[1]}%`,
                transform: `scale(${z})`,
                transformOrigin: `${focus[0]}% ${focus[1]}%`,
                filter: `sepia(${(0.55 - 0.35 * dev).toFixed(3)}) brightness(${(1.7 - 0.7 * dev).toFixed(3)}) contrast(${(0.7 + 0.35 * dev).toFixed(3)}) saturate(${(0.6 + 0.35 * dev).toFixed(3)})`,
              }}
            />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0) 60%, rgba(0,0,0,0.5) 100%)" }} />
            {name ? (
              <div style={{ position: "absolute", left: 24, bottom: 22, display: "flex", alignItems: "center", gap: 12, opacity: nameIn, transform: `translateX(${(1 - nameIn) * -40}px)` }}>
                <div style={{ width: 6, height: 42, borderRadius: 3, background: ZALE.red }} />
                <div style={{ color: "#fff", fontSize: 40, fontWeight: 800, letterSpacing: -0.5, textShadow: "0 2px 10px rgba(0,0,0,0.6)" }}>{name}</div>
              </div>
            ) : null}
          </div>
          <div style={{ height: 120, display: "flex", alignItems: "center", justifyContent: "center", color: "#222", fontSize: 84, fontWeight: 900, letterSpacing: 4, fontVariantNumeric: "tabular-nums" }}>
            {f >= yearAt ? year.slice(0, chars) : ""}
          </div>
        </div>
        {age ? (
          <div
            style={{
              position: "absolute",
              right: -34,
              top: -34,
              width: 190,
              height: 190,
              borderRadius: 95,
              background: ZALE.red,
              color: "#fff",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 16px 40px rgba(0,0,0,0.5)",
              transform: `rotate(12deg) scale(${ageIn > 0.997 ? 1 : 1.8 - 0.8 * ageIn})`,
              opacity: Math.min(1, ageIn * 2),
              lineHeight: 1,
            }}
          >
            <div style={{ fontSize: 84, fontWeight: 900, letterSpacing: -2 }}>{age.split(" ")[0]}</div>
            <div style={{ fontSize: 32, fontWeight: 800, marginTop: 2 }}>{age.split(" ").slice(1).join(" ")}</div>
          </div>
        ) : null}
      </div>
      <Snd at={0} name="whoosh" k="flashback" />
      <Snd at={Math.round(fps * 0.35)} name="thud" k="flashback" />
      <SndSpan at={yearAt} dur={year.length * 2 + 2} name="write" vol={0.22} />
      {ageAt !== undefined ? <Snd at={ageAt} name="pop" k="flashback-age" /> : null}
    </AbsoluteFill>
  );
};
