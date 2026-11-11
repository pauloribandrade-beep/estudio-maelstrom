import React from "react";
import { AbsoluteFill, Easing, interpolate, Loop, OffthreadVideo, staticFile, useCurrentFrame } from "remotion";
import { loadFont as loadBarlow } from "@remotion/google-fonts/BarlowCondensed";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";
import CL from "./clips.json";

// Vídeo longo "patch 11-04 do Deadlock: bronca na Celeste" (05/11/2026). Gameplay dos showcases de cada habilidade em
// tela cheia (PCShot) e, por cima, uma linguagem só de "patch notes" em vidro escuro: cabeçalho do herói com o veredito
// (PCHero), selo da habilidade com o número do botão (PCAbility), cartão ANTES → AGORA (PCStat, com as 3 melhorias
// 1/2/5 pontos quando a fala cita uma). Onde não tem gameplay: troca de melhoria (PCSwap), cooldown (PCCooldown),
// Healbane (PCHealbane), placar nerf x buff (PCBoard), virada pros buffs (PCTurn) e chamadas (PCTag/PCTitle).

const { fontFamily: BARLOW } = loadBarlow("normal", { weights: ["600", "700", "800"], subsets: ["latin", "latin-ext"] });
const { fontFamily: MONO } = loadMono("normal", { weights: ["500", "700"], subsets: ["latin"] });
const R = "videos/2026-11-05_deadlock-patch-celeste_R/clips/";
const FPS = 30;
const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
const CREAM = "#f3ead8";
const GOLD = "#e8c66a";
const NERF = "#ff5a52";
const BUFF = "#4fe08f";
const INK = "#0b0d12";
const glass: React.CSSProperties = {
  background: "linear-gradient(180deg, rgba(22,26,36,0.86), rgba(10,12,18,0.9))",
  border: "1.5px solid rgba(243,234,216,0.18)",
  boxShadow: "0 24px 60px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.08)",
  backdropFilter: "blur(14px)",
  borderRadius: 26,
};
const back = (f: number, d = 0, n = 9, s = 1.7) => interpolate(f - d, [0, n], [0, 1], { ...clamp, easing: Easing.out(Easing.back(s)) });
const ease = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
const fadeOut = (f: number, life: number, n = 6) => interpolate(f, [life - n, life], [1, 0], clamp);

// ---------- gameplay ----------
const Clip: React.FC<{ clip: string; ss?: number; rate?: number; life: number; pos?: string }> = ({ clip, ss = 0, rate = 1, life, pos = "50% 50%" }) => {
  const len = (CL as Record<string, number>)[clip] ?? 3;
  const loopF = Math.max(1, Math.floor(((len - ss) / rate) * FPS) - 1);
  const v = <OffthreadVideo src={staticFile(`${R}${clip}.mp4`)} muted startFrom={Math.round(ss * FPS)} playbackRate={rate} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: pos }} />;
  return life > loopF ? <Loop durationInFrames={loopF}>{v}</Loop> : v;
};

// tomada em tela cheia com zoom lento; origin = ponto do zoom (ex. a linha das melhorias no tooltip); gray/dim = jogo
// apagado por trás de um carimbo
export const PCShot: React.FC<{ life: number; clip: string; ss?: number; rate?: number; pos?: string; z0?: number; z1?: number; origin?: string; gray?: number; dim?: number }> = ({
  life, clip, ss, rate, pos, z0 = 1, z1 = 1.1, origin = "50% 50%", gray = 0, dim = 0,
}) => {
  const f = useCurrentFrame();
  const z = interpolate(f, [0, life], [z0, z1], clamp);
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${z})`, transformOrigin: origin, filter: gray ? `grayscale(${gray})` : undefined }}>
        <Clip clip={clip} ss={ss} rate={rate} life={life} pos={pos} />
      </AbsoluteFill>
      {/* vinheta em cima e embaixo: o vidro dos cards lê melhor */}
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 26%, rgba(0,0,0,0) 56%, rgba(0,0,0,0.6) 100%)" }} />
      {dim ? <AbsoluteFill style={{ background: `rgba(5,6,10,${dim})` }} /> : null}
    </AbsoluteFill>
  );
};

// ---------- fundo das cenas de design ----------
const DesignBg: React.FC<{ tint?: string }> = ({ tint = GOLD }) => {
  const f = useCurrentFrame();
  const drift = (f * 0.6) % 80;
  return (
    <AbsoluteFill style={{ background: INK, overflow: "hidden" }}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 80% 55% at 50% 42%, ${tint}26 0%, rgba(0,0,0,0) 70%)` }} />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: 0.12 }}>
        {Array.from({ length: 30 }).map((_, i) => (
          <line key={`h${i}`} x1={0} x2={1080} y1={i * 80 + drift} y2={i * 80 + drift} stroke={CREAM} strokeWidth={1} />
        ))}
        {Array.from({ length: 15 }).map((_, i) => (
          <line key={`v${i}`} y1={0} y2={1920} x1={i * 80} x2={i * 80} stroke={CREAM} strokeWidth={1} />
        ))}
      </svg>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.75) 100%)" }} />
    </AbsoluteFill>
  );
};

const Verdict: React.FC<{ v: "NERF" | "BUFF"; scale?: number; size?: number }> = ({ v, scale = 1, size = 46 }) => {
  const c = v === "NERF" ? NERF : BUFF;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 22px 8px 16px", borderRadius: 999, background: `${c}22`, border: `2.5px solid ${c}`, color: c, fontFamily: BARLOW, fontWeight: 800, fontSize: size, letterSpacing: 2, transform: `scale(${scale})`, boxShadow: `0 0 28px ${c}55` }}>
      <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 20 20">
        <path d={v === "NERF" ? "M10 18 L1 4 H19 Z" : "M10 2 L19 16 H1 Z"} fill={c} />
      </svg>
      {v}
    </div>
  );
};

// ---------- título do gancho ----------
export const PCTitle: React.FC<{ life: number; l1?: string; l2?: string; y?: number }> = ({ life, l1 = "PATCH 04/11", l2 = "DEADLOCK", y = 250 }) => {
  const f = useCurrentFrame();
  const o = fadeOut(f, life);
  const a = back(f, 0, 10, 1.4);
  const b = ease(f, 6, 18);
  return (
    <AbsoluteFill style={{ alignItems: "center", pointerEvents: "none" }}>
      <div style={{ position: "absolute", top: y, display: "flex", flexDirection: "column", alignItems: "center", opacity: o }}>
        <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 34, letterSpacing: 10, color: GOLD, opacity: b, transform: `translateY(${(1 - b) * 20}px)` }}>{l2}</div>
        <div style={{ fontFamily: BARLOW, fontWeight: 800, fontSize: 168, lineHeight: 1, color: CREAM, transform: `scale(${0.6 + 0.4 * a})`, opacity: Math.min(1, a * 1.5), textShadow: "0 10px 40px rgba(0,0,0,0.8)" }}>{l1}</div>
        <div style={{ height: 6, width: 520 * b, background: GOLD, borderRadius: 3, marginTop: 8, boxShadow: `0 0 20px ${GOLD}` }} />
      </div>
    </AbsoluteFill>
  );
};

// ---------- cabeçalho do herói (fica a seção inteira dele) ----------
export const PCHero: React.FC<{ life: number; name: string; verdict: "NERF" | "BUFF"; kind?: string; y?: number }> = ({ life, name, verdict, kind = "HERÓI", y = 110 }) => {
  const f = useCurrentFrame();
  const a = ease(f, 0, 10);
  const o = fadeOut(f, life);
  const st = interpolate(f, [8, 14], [2.2, 1], { ...clamp, easing: Easing.out(Easing.back(2)) });
  const so = interpolate(f, [8, 10], [0, 1], clamp);
  const c = verdict === "NERF" ? NERF : BUFF;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: 60, right: 60, top: y, height: 150, ...glass, opacity: a * o, transform: `translateY(${(1 - a) * -60}px)`, display: "flex", alignItems: "center", padding: "0 34px", gap: 26, overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 10, background: c, boxShadow: `0 0 24px ${c}` }} />
        <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: MONO, fontWeight: 500, fontSize: 24, letterSpacing: 6, color: "rgba(243,234,216,0.6)" }}>{kind} · PATCH 04/11</div>
          <div style={{ fontFamily: BARLOW, fontWeight: 800, fontSize: 86, lineHeight: 1, color: CREAM, whiteSpace: "nowrap" }}>{name}</div>
        </div>
        <div style={{ opacity: so }}>
          <Verdict v={verdict} scale={st} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- selo da habilidade com o número do botão ----------
export const PCAbility: React.FC<{ life: number; n: number; name: string; y?: number }> = ({ life, n, name, y = 290 }) => {
  const f = useCurrentFrame();
  const a = ease(f, 0, 9);
  const k = back(f, 3, 9, 2.2);
  const o = fadeOut(f, life);
  const ult = n === 4;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: 60, top: y, display: "flex", alignItems: "center", gap: 22, opacity: a * o, transform: `translateX(${(1 - a) * -80}px)` }}>
        <div style={{ width: 112, height: 112, borderRadius: 22, ...glass, border: `3px solid ${GOLD}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: BARLOW, fontWeight: 800, fontSize: 82, color: GOLD, transform: `scale(${k})`, boxShadow: `0 0 30px ${GOLD}55, 0 18px 40px rgba(0,0,0,0.6)` }}>{n}</div>
        <div style={{ ...glass, borderRadius: 20, padding: "12px 28px 14px", display: "flex", flexDirection: "column" }}>
          <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 24, letterSpacing: 5, color: GOLD }}>{ult ? "ULTIMATE · BOTÃO 4" : `HABILIDADE ${n}`}</div>
          <div style={{ fontFamily: BARLOW, fontWeight: 700, fontSize: 64, lineHeight: 1.02, color: CREAM, whiteSpace: "nowrap" }}>{name}</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- cartão ANTES → AGORA ----------
type Row = { label: string; a?: string; b: string; at?: number };
const Pips: React.FC<{ pts: number; f: number }> = ({ pts, f }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
    {[1, 2, 5].map((p, i) => {
      const on = p === pts;
      const k = on ? back(f, 4 + i * 2, 8, 2.4) : ease(f, 2 + i * 2, 10 + i * 2);
      return (
        <div key={p} style={{ padding: "6px 16px", borderRadius: 12, fontFamily: MONO, fontWeight: 700, fontSize: 26, color: on ? INK : "rgba(243,234,216,0.45)", background: on ? GOLD : "rgba(255,255,255,0.06)", border: on ? `2px solid ${GOLD}` : "2px solid rgba(243,234,216,0.15)", transform: `scale(${on ? 0.7 + 0.3 * k : 1})`, opacity: on ? 1 : k, boxShadow: on ? `0 0 22px ${GOLD}88` : undefined }}>
          {p} {p === 1 ? "PONTO" : "PONTOS"}
        </div>
      );
    })}
    <div style={{ fontFamily: MONO, fontWeight: 500, fontSize: 22, letterSpacing: 3, color: "rgba(243,234,216,0.55)", marginLeft: 6 }}>MELHORIA</div>
  </div>
);
export const PCStat: React.FC<{ life: number; rows: Row[]; good?: boolean; pts?: number; y?: number }> = ({ life, rows, good = false, pts, y = 1170 }) => {
  const f = useCurrentFrame();
  const a = back(f, 0, 9, 1.4);
  const o = fadeOut(f, life);
  const c = good ? BUFF : NERF;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: 60, right: 60, top: y, ...glass, padding: "26px 36px 30px", opacity: Math.min(1, a) * o, transform: `translateY(${(1 - a) * 50}px) scale(${0.94 + 0.06 * a})` }}>
        {pts ? <Pips pts={pts} f={f} /> : null}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {rows.map((r, i) => {
            const at = r.at ?? 0;
            const ri = ease(f, Math.min(at, 4 + i * 5) - 2, Math.min(at, 4 + i * 5) + 6);
            const sw = interpolate(f, [at, at + 7], [0, 1], { ...clamp, easing: Easing.out(Easing.back(2.2)) });
            const strike = ease(f, at, at + 6);
            const flash = interpolate(f, [at, at + 3, at + 14], [0, 1, 0], clamp);
            return (
              <div key={i} style={{ opacity: ri, display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 25, letterSpacing: 4, color: "rgba(243,234,216,0.62)" }}>{r.label}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 26, fontFamily: BARLOW, fontWeight: 800, lineHeight: 1 }}>
                  {r.a ? (
                    <div style={{ position: "relative", fontSize: 86, color: f >= at ? "rgba(243,234,216,0.42)" : CREAM }}>
                      {r.a}
                      <div style={{ position: "absolute", left: -6, top: "52%", height: 7, width: `calc(${strike * 100}% + 12px)`, background: c, borderRadius: 4, transform: "rotate(-4deg)" }} />
                    </div>
                  ) : null}
                  {r.a ? (
                    <svg width={70} height={44} viewBox="0 0 70 44" style={{ opacity: ease(f, at - 2, at + 4) }}>
                      <path d="M4 22 H56 M42 6 L60 22 L42 38" stroke={c} strokeWidth={7} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : null}
                  <div style={{ fontSize: 108, color: c, transform: `scale(${0.4 + 0.6 * sw})`, transformOrigin: "left center", opacity: Math.min(1, sw * 2), textShadow: `0 0 ${10 + 30 * flash}px ${c}${flash > 0.05 ? "cc" : "66"}` }}>{r.b}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- carimbo por cima do jogo ----------
export const PCStamp: React.FC<{ life: number; text: string; good?: boolean; y?: number; rot?: number }> = ({ life, text, good = false, y = 1240, rot = -5 }) => {
  const f = useCurrentFrame();
  const s = interpolate(f, [0, 6], [2.6, 1], { ...clamp, easing: Easing.out(Easing.back(2)) });
  const o = interpolate(f, [0, 2], [0, 1], clamp) * fadeOut(f, life);
  const shake = f < 10 ? Math.sin(f * 3.1) * 9 * (1 - f / 10) : 0;
  const c = good ? BUFF : NERF;
  return (
    <AbsoluteFill style={{ alignItems: "center", pointerEvents: "none" }}>
      <div style={{ position: "absolute", top: y, opacity: o, transform: `translateX(${shake}px) rotate(${rot}deg) scale(${s})`, padding: "14px 40px", border: `7px solid ${c}`, borderRadius: 18, color: c, fontFamily: BARLOW, fontWeight: 800, fontSize: 96, letterSpacing: 3, background: "rgba(8,9,14,0.72)", boxShadow: `0 0 40px ${c}66`, whiteSpace: "nowrap" }}>{text}</div>
    </AbsoluteFill>
  );
};

// ---------- as duas partes das Radiant Daggers trocando de melhoria ----------
export const PCSwap: React.FC<{ life: number; swapAt?: number }> = ({ life, swapAt = 60 }) => {
  const f = useCurrentFrame();
  const o = fadeOut(f, life, 8);
  const k = interpolate(f, [swapAt, swapAt + 26], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const col = (x: number, pts: number, d: number) => {
    const a = back(f, d, 10, 1.5);
    return (
      <div style={{ position: "absolute", left: x, top: 700, width: 420, height: 560, ...glass, opacity: Math.min(1, a), transform: `translateY(${(1 - a) * 60}px)`, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 34 }}>
        <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 26, letterSpacing: 5, color: "rgba(243,234,216,0.55)" }}>MELHORIA DE</div>
        <div style={{ fontFamily: BARLOW, fontWeight: 800, fontSize: 120, color: GOLD, lineHeight: 1 }}>{pts}</div>
        <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 26, letterSpacing: 5, color: "rgba(243,234,216,0.55)" }}>PONTOS</div>
      </div>
    );
  };
  // chips: começam trocados (spirit amp no 2, alcance no 5) e cruzam em arco
  const L = 100 + 210, Rr = 560 + 210;
  const chip = (label: string, from: number, to: number, up: boolean, c: string) => {
    const x = from + (to - from) * k;
    const y = 1080 + (up ? -1 : 1) * Math.sin(k * Math.PI) * 190;
    const ap = ease(f, 14, 24);
    return (
      <div style={{ position: "absolute", left: x - 180, top: y - 52, width: 360, height: 104, borderRadius: 18, background: `${c}22`, border: `3px solid ${c}`, color: c, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: BARLOW, fontWeight: 800, fontSize: 54, letterSpacing: 2, opacity: ap, boxShadow: `0 0 30px ${c}44`, transform: `scale(${1 + Math.sin(k * Math.PI) * 0.12})` }}>{label}</div>
    );
  };
  const head = ease(f, 0, 10);
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <DesignBg tint="#b48cff" />
      <div style={{ position: "absolute", top: 420, left: 0, right: 0, textAlign: "center", opacity: head }}>
        <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 28, letterSpacing: 8, color: GOLD }}>HABILIDADE 3 · RADIANT DAGGERS</div>
        <div style={{ fontFamily: BARLOW, fontWeight: 800, fontSize: 104, color: CREAM, lineHeight: 1.05 }}>TROCARAM DE LUGAR</div>
      </div>
      {col(100, 2, 4)}
      {col(560, 5, 8)}
      {chip("ALCANCE", Rr, L, true, "#7fd3ff")}
      {chip("SPIRIT AMP", L, Rr, false, "#c49bff")}
    </AbsoluteFill>
  );
};

// ---------- cooldown: o relógio do ícone girando de 160 até 170 ----------
export const PCCooldown: React.FC<{ life: number; a?: number; b?: number; label?: string; growAt?: number }> = ({ life, a = 160, b = 170, label = "SHINING WONDER · COOLDOWN", growAt = 60 }) => {
  const f = useCurrentFrame();
  const o = fadeOut(f, life, 8);
  const ap = back(f, 0, 12, 1.4);
  const sweep = ease(f, 4, 40);
  const g = interpolate(f, [growAt, growAt + 20], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const val = Math.round(a + (b - a) * g);
  const R0 = 250, C = 2 * Math.PI * R0;
  const frac = sweep * (a / b + (1 - a / b) * g);
  const pulse = interpolate(f, [growAt + 18, growAt + 22, growAt + 34], [0, 1, 0], clamp);
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <DesignBg tint={NERF} />
      <div style={{ position: "absolute", top: 400, left: 0, right: 0, textAlign: "center", fontFamily: MONO, fontWeight: 700, fontSize: 30, letterSpacing: 7, color: GOLD, opacity: ease(f, 0, 10) }}>{label}</div>
      <svg width={1080} height={1080} viewBox="0 0 1080 1080" style={{ position: "absolute", top: 470, left: 0, transform: `scale(${0.7 + 0.3 * ap})`, transformOrigin: "540px 540px" }}>
        <circle cx={540} cy={540} r={R0} fill="rgba(14,16,24,0.9)" stroke="rgba(243,234,216,0.15)" strokeWidth={36} />
        <circle cx={540} cy={540} r={R0} fill="none" stroke={g > 0 ? NERF : CREAM} strokeWidth={36} strokeDasharray={`${C * frac} ${C}`} transform="rotate(-90 540 540)" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 ${12 + 30 * pulse}px ${g > 0 ? NERF : GOLD})` }} />
        {Array.from({ length: 60 }).map((_, i) => {
          const an = (i / 60) * Math.PI * 2;
          const r1 = R0 + 46, r2 = R0 + (i % 5 === 0 ? 70 : 58);
          return <line key={i} x1={540 + Math.cos(an) * r1} y1={540 + Math.sin(an) * r1} x2={540 + Math.cos(an) * r2} y2={540 + Math.sin(an) * r2} stroke="rgba(243,234,216,0.3)" strokeWidth={i % 5 === 0 ? 4 : 2} />;
        })}
        <text x={540} y={590} textAnchor="middle" fontFamily={BARLOW} fontWeight={800} fontSize={190} fill={g > 0 ? NERF : CREAM}>{val}</text>
        <text x={540} y={660} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={40} letterSpacing={8} fill="rgba(243,234,216,0.6)">SEGUNDOS</text>
      </svg>
      <div style={{ position: "absolute", top: 1440, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: g }}>
        <Verdict v="NERF" size={52} />
        <div style={{ marginLeft: 20, fontFamily: BARLOW, fontWeight: 800, fontSize: 64, color: CREAM, alignSelf: "center" }}>+{b - a} s pra voltar</div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- Healbane: card do item, os stacks perdendo força e o corte de cura caindo ----------
export const PCHealbane: React.FC<{ life: number; stackAt?: number; barsAt?: number; swapAt?: number; effAt?: number }> = ({ life, stackAt = 100, barsAt = 220, swapAt = 310, effAt = 500 }) => {
  const f = useCurrentFrame();
  const o = fadeOut(f, life, 8);
  const card = back(f, 0, 12, 1.4);
  const PURPLE = "#b07cff";
  // os 4 stacks acendem e depois cada um apaga mais rápido (curva de queda)
  const stacks = [0, 1, 2, 3].map((i) => {
    const on = ease(f, stackAt + i * 5, stackAt + i * 5 + 6);
    const decay = interpolate(f, [stackAt + 30, stackAt + 70], [1, [1, 0.72, 0.5, 0.34][i]], clamp);
    return on * decay;
  });
  const bars = ease(f, barsAt, barsAt + 14);
  const sw = interpolate(f, [swapAt, swapAt + 24], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const v4 = 82.2 - (82.2 - 72) * sw;
  const v2 = 57.8 - (57.8 - 54.7) * sw;
  const eff = interpolate(f, [effAt, effAt + 6], [2.4, 1], { ...clamp, easing: Easing.out(Easing.back(2)) });
  const effO = interpolate(f, [effAt, effAt + 2], [0, 1], clamp);
  const bar = (label: string, v: number, d: number) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, opacity: ease(f, barsAt + d, barsAt + d + 10) }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontWeight: 700, fontSize: 28, color: "rgba(243,234,216,0.7)", letterSpacing: 3 }}>
        <span>{label}</span>
        <span style={{ color: sw > 0.02 ? NERF : CREAM, fontSize: 40 }}>{v.toFixed(sw > 0.98 ? 0 : 1).replace(".", ",")}%</span>
      </div>
      <div style={{ height: 34, borderRadius: 17, background: "rgba(255,255,255,0.08)", overflow: "hidden", position: "relative" }}>
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${v * bars}%`, borderRadius: 17, background: `linear-gradient(90deg, ${PURPLE}, ${sw > 0.02 ? NERF : "#e4a7ff"})`, boxShadow: `0 0 20px ${PURPLE}88` }} />
      </div>
    </div>
  );
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <DesignBg tint={PURPLE} />
      <div style={{ position: "absolute", left: 90, right: 90, top: 380, ...glass, padding: "36px 44px 44px", transform: `scale(${0.85 + 0.15 * card})`, opacity: Math.min(1, card), borderColor: `${PURPLE}88` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          {/* ícone do item: frasco com caveira estilizada (spirit, roxo) */}
          <svg width={150} height={150} viewBox="0 0 150 150">
            <rect x={6} y={6} width={138} height={138} rx={28} fill={`${PURPLE}22`} stroke={PURPLE} strokeWidth={5} />
            <path d="M60 30 H90 V52 L112 96 Q118 122 92 122 H58 Q32 122 38 96 L60 52 Z" fill="none" stroke={CREAM} strokeWidth={7} strokeLinejoin="round" />
            <path d="M47 92 H103 L110 104 Q112 116 92 116 H58 Q38 116 40 104 Z" fill={PURPLE} />
            <path d="M75 62 v18 M66 71 h18" stroke={NERF} strokeWidth={7} strokeLinecap="round" />
            <path d="M58 76 L92 96" stroke={NERF} strokeWidth={6} strokeLinecap="round" opacity={0.85} />
          </svg>
          <div>
            <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 26, letterSpacing: 6, color: PURPLE }}>ITEM DE SPIRIT</div>
            <div style={{ fontFamily: BARLOW, fontWeight: 800, fontSize: 108, color: CREAM, lineHeight: 1 }}>HEALBANE</div>
            <div style={{ fontFamily: MONO, fontWeight: 500, fontSize: 26, color: "rgba(243,234,216,0.6)", letterSpacing: 2 }}>corta a cura do inimigo</div>
          </div>
        </div>
        <div style={{ marginTop: 40, fontFamily: MONO, fontWeight: 700, fontSize: 25, letterSpacing: 4, color: "rgba(243,234,216,0.6)", opacity: ease(f, stackAt - 4, stackAt + 6) }}>STACKS EMPILHADOS</div>
        <div style={{ display: "flex", gap: 22, marginTop: 14 }}>
          {stacks.map((s, i) => (
            <div key={i} style={{ flex: 1, height: 90, borderRadius: 18, border: `3px solid ${PURPLE}`, background: `rgba(176,124,255,${0.08 + 0.55 * s})`, opacity: 0.25 + 0.75 * Math.min(1, s * 3), display: "flex", alignItems: "center", justifyContent: "center", fontFamily: BARLOW, fontWeight: 800, fontSize: 52, color: CREAM, boxShadow: `0 0 ${24 * s}px ${PURPLE}` }}>{i + 1}</div>
          ))}
        </div>
        <div style={{ marginTop: 44, display: "flex", flexDirection: "column", gap: 28 }}>
          <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 25, letterSpacing: 4, color: "rgba(243,234,216,0.6)", opacity: bars }}>CORTE DE CURA</div>
          {bar("2 STACKS", v2, 0)}
          {bar("4 STACKS", v4, 6)}
        </div>
      </div>
      <div style={{ position: "absolute", top: 1430, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: effO * o }}>
        <div style={{ transform: `rotate(-4deg) scale(${eff})`, padding: "12px 34px", border: `6px solid ${NERF}`, borderRadius: 16, color: NERF, fontFamily: BARLOW, fontWeight: 800, fontSize: 80, background: "rgba(8,9,14,0.8)", boxShadow: `0 0 36px ${NERF}66` }}>EMPILHAR RENDE MENOS</div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- placar nerf x buff (a seção dos nerfs no "não foi a única" e o resumo no fim) ----------
type Slot = { n: string; at: number };
export const PCBoard: React.FC<{ life: number; nerf: Slot[]; buff?: Slot[]; nerfSlots?: number; buffSlots?: number; title?: string }> = ({ life, nerf, buff = [], nerfSlots, buffSlots, title = "RESUMO DO PATCH" }) => {
  const f = useCurrentFrame();
  const o = fadeOut(f, life, 8);
  const head = ease(f, 0, 10);
  const nS = nerfSlots ?? nerf.length, bS = buffSlots ?? buff.length;
  const col = (label: "NERF" | "BUFF", items: Slot[], slots: number, x: number, d: number) => {
    const c = label === "NERF" ? NERF : BUFF;
    const a = back(f, d, 10, 1.4);
    return (
      <div style={{ position: "absolute", left: x, top: 640, width: 450, opacity: Math.min(1, a), transform: `translateY(${(1 - a) * 50}px)` }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 26 }}><Verdict v={label} size={54} /></div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {Array.from({ length: slots }).map((_, i) => {
            const it = items[i];
            const k = it ? back(f, it.at, 9, 2) : 0;
            const shown = it && f >= it.at;
            return (
              <div key={i} style={{ height: 112, ...glass, borderRadius: 20, borderColor: shown ? `${c}aa` : "rgba(243,234,216,0.14)", display: "flex", alignItems: "center", paddingLeft: 30, gap: 18, overflow: "hidden", position: "relative" }}>
                <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 8, background: shown ? c : "rgba(243,234,216,0.12)" }} />
                {shown ? (
                  <div style={{ fontFamily: BARLOW, fontWeight: 800, fontSize: 64, color: CREAM, transform: `scale(${0.5 + 0.5 * k})`, transformOrigin: "left center", opacity: Math.min(1, k * 2), whiteSpace: "nowrap" }}>{it.n}</div>
                ) : (
                  <div style={{ fontFamily: BARLOW, fontWeight: 800, fontSize: 64, color: "rgba(243,234,216,0.2)" }}>?</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  const both = bS > 0;
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <DesignBg tint={both ? GOLD : NERF} />
      <div style={{ position: "absolute", top: 430, left: 0, right: 0, textAlign: "center", opacity: head, transform: `translateY(${(1 - head) * -30}px)` }}>
        <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 28, letterSpacing: 8, color: GOLD }}>DEADLOCK · PATCH 04/11</div>
        <div style={{ fontFamily: BARLOW, fontWeight: 800, fontSize: 104, color: CREAM, lineHeight: 1.05 }}>{title}</div>
      </div>
      {both ? (
        <>
          {col("NERF", nerf, nS, 70, 2)}
          {col("BUFF", buff, bS, 560, 6)}
        </>
      ) : (
        col("NERF", nerf, nS, 315, 2)
      )}
    </AbsoluteFill>
  );
};

// ---------- a virada: "agora a parte boa" ----------
export const PCTurn: React.FC<{ life: number; l1?: string; l2?: string }> = ({ life, l1 = "AGORA", l2 = "A PARTE BOA" }) => {
  const f = useCurrentFrame();
  const o = fadeOut(f, life, 8);
  const wipe = interpolate(f, [0, 14], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const t = back(f, 8, 10, 1.6);
  const ar = interpolate(f, [16, 30], [0, 1], { ...clamp, easing: Easing.out(Easing.back(2)) });
  const bob = Math.sin(f / 8) * 8;
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <DesignBg tint={BUFF} />
      <AbsoluteFill style={{ background: `linear-gradient(180deg, ${BUFF}00, ${BUFF}33 ${wipe * 100}%, ${BUFF}00 ${wipe * 100 + 1}%)` }} />
      <div style={{ position: "absolute", top: 620, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <svg width={220} height={220} viewBox="0 0 20 20" style={{ transform: `translateY(${bob}px) scale(${ar})`, filter: `drop-shadow(0 0 30px ${BUFF})` }}>
          <path d="M10 2 L19 16 H1 Z" fill={BUFF} />
        </svg>
        <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 40, letterSpacing: 14, color: BUFF, marginTop: 30, opacity: Math.min(1, t) }}>{l1}</div>
        <div style={{ fontFamily: BARLOW, fontWeight: 800, fontSize: 150, color: CREAM, lineHeight: 1, transform: `scale(${0.6 + 0.4 * t})`, opacity: Math.min(1, t * 1.5) }}>{l2}</div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- chamada de vidro (CTA, pergunta final) ----------
export const PCTag: React.FC<{ life: number; kicker?: string; text: string; live?: boolean; y?: number }> = ({ life, kicker, text, live = false, y = 1180 }) => {
  const f = useCurrentFrame();
  const a = back(f, 0, 10, 1.5);
  const o = fadeOut(f, life);
  const blink = live ? 0.5 + 0.5 * Math.sin(f / 4) : 1;
  return (
    <AbsoluteFill style={{ alignItems: "center", pointerEvents: "none" }}>
      <div style={{ position: "absolute", top: y, ...glass, padding: "26px 44px 30px", opacity: Math.min(1, a) * o, transform: `translateY(${(1 - a) * 40}px) scale(${0.9 + 0.1 * a})`, display: "flex", flexDirection: "column", alignItems: "center", maxWidth: 960 }}>
        {kicker ? (
          <div style={{ display: "flex", alignItems: "center", gap: 14, fontFamily: MONO, fontWeight: 700, fontSize: 28, letterSpacing: 6, color: live ? NERF : GOLD }}>
            {live ? <div style={{ width: 22, height: 22, borderRadius: 11, background: NERF, opacity: blink, boxShadow: `0 0 16px ${NERF}` }} /> : null}
            {kicker}
          </div>
        ) : null}
        <div style={{ fontFamily: BARLOW, fontWeight: 800, fontSize: 84, color: CREAM, lineHeight: 1.02, textAlign: "center" }}>{text}</div>
      </div>
    </AbsoluteFill>
  );
};
