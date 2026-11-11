import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, Loop, OffthreadVideo, staticFile, useCurrentFrame } from "remotion";
import { loadFont as loadTitle } from "@remotion/google-fonts/AlegreyaSans";
import { loadFont as loadBody } from "@remotion/google-fonts/NunitoSans";
import ML from "./memes.json";

// v2 do patch 11-04 (05/11): o Paulo reprovou os cards de vidro por cima do gameplay. Agora o jogo fica limpo em tela
// cheia (PCShot) e os números vivem em TELAS SEPARADAS que imitam a interface do próprio Deadlock: o tooltip da
// habilidade (painel roxo-escuro com a aba, título, ícone oficial, blocos de atributo e a fileira de melhorias 1/2/5
// pontos), o card de item da loja (Healbane), o card do herói e o placar. Artes oficiais da deadlock.wiki em _R/dl/.
// Memes em tela cheia (DLMeme), como o Laestro usa.

const { fontFamily: TITLE } = loadTitle("normal", { weights: ["700", "800", "900"], subsets: ["latin", "latin-ext"] });
const { fontFamily: BODY } = loadBody("normal", { weights: ["600", "700", "800", "900"], subsets: ["latin", "latin-ext"] });
const DLP = "videos/2026-11-05_deadlock-patch-celeste_R/dl/";
const MP = "videos/2026-11-05_deadlock-patch-celeste_R/memes/";
const FPS = 30;
const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
const ease = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
const back = (f: number, a: number, n = 9, s = 1.8) => interpolate(f - a, [0, n], [0, 1], { ...clamp, easing: Easing.out(Easing.back(s)) });

// paleta tirada do tooltip do jogo
const PANEL = "linear-gradient(180deg, #312a3b 0%, #27212f 100%)";
const EDGE = "#4d4259";
const TAB = "#8e6fd8";
const TILE = "#201b27";
const TILE_HI = "linear-gradient(180deg, #3d2f58 0%, #31264a 100%)";
const WHITE = "#f5f1fa";
const LABEL = "#d6cee2";
const MUTED = "#9b90aa";
const SPIRIT = "#b58cff";
const T5 = "#ff5a4e";
const NERF = "#ff6a5c";
const BUFF = "#6fe08c";

const img = (n: string) => staticFile(`${DLP}${n}.png`);

// zona segura do TikTok (1080x1920, 05/11): nada importante acima de 170 (abas do app), abaixo de ~1290 (legenda em
// 1370, descrição e música embaixo) nem à direita de ~930 entre y 700 e 1550 (curtir/comentar/compartilhar).
const SL = 80, SR = 150;

// ---------- fundo: arte oficial do herói, escura e desfocada, com névoa roxa (não é gameplay) ----------
const DLBg: React.FC<{ hero?: string; tint?: string }> = ({ hero, tint = "#6b4bb8" }) => {
  const f = useCurrentFrame();
  const z = 1.08 + f * 0.0006;
  return (
    <AbsoluteFill style={{ background: "#120f16", overflow: "hidden" }}>
      {hero ? (
        <AbsoluteFill style={{ transform: `scale(${z})`, transformOrigin: "50% 30%" }}>
          <Img src={img(`${hero}_Render`)} style={{ position: "absolute", left: -260, top: -80, width: 1600, height: 1400, objectFit: "cover", objectPosition: "50% 20%", filter: "blur(10px) saturate(0.9) brightness(0.42)" }} />
        </AbsoluteFill>
      ) : null}
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 90% 60% at 50% 38%, ${tint}38 0%, rgba(0,0,0,0) 70%)` }} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(18,15,22,0.25) 0%, rgba(18,15,22,0.55) 45%, #120f16 82%)" }} />
    </AbsoluteFill>
  );
};

// ícone da habilidade como no HUD: círculo roxo com o desenho branco e o número do botão embaixo
const AbilityIcon: React.FC<{ icon: string; k: number; size?: number; glow?: number }> = ({ icon, k, size = 150, glow = 1 }) => (
  <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
    <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "radial-gradient(circle at 50% 35%, #a988f0 0%, #6d4cc0 60%, #4a3388 100%)", border: "4px solid #d9c8ff", boxShadow: `0 0 ${40 * glow}px rgba(181,140,255,${0.55 * glow})` }} />
    <Img src={img(icon)} style={{ position: "absolute", inset: size * 0.14, width: size * 0.72, height: size * 0.72, objectFit: "contain", filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.4))" }} />
    <div style={{ position: "absolute", left: "50%", bottom: -22, transform: "translateX(-50%)", width: 44, height: 44, borderRadius: 8, background: "#1a1620", border: `2px solid ${EDGE}`, color: WHITE, fontFamily: BODY, fontWeight: 900, fontSize: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>{k}</div>
  </div>
);

// retrato do herói no círculo (atributos gerais, sem habilidade)
const Portrait: React.FC<{ hero: string; size?: number }> = ({ hero, size = 150 }) => (
  <div style={{ width: size, height: size, borderRadius: "50%", overflow: "hidden", border: "4px solid #d9c8ff", boxShadow: "0 0 40px rgba(181,140,255,0.5)", flexShrink: 0, background: "#2b2533" }}>
    <Img src={img(`${hero}_card`)} style={{ width: "100%", height: "136%", objectFit: "cover", objectPosition: "50% 0%" }} />
  </div>
);

const Tag: React.FC<{ v: "NERF" | "BUFF"; s?: number }> = ({ v, s = 1 }) => {
  const c = v === "NERF" ? NERF : BUFF;
  return (
    <div style={{ transform: `scale(${s})`, display: "flex", alignItems: "center", gap: 10, padding: "8px 20px", background: `${c}1f`, border: `3px solid ${c}`, borderRadius: 8, color: c, fontFamily: BODY, fontWeight: 900, fontSize: 40, letterSpacing: 3 }}>
      <svg width={26} height={26} viewBox="0 0 20 20"><path d={v === "NERF" ? "M10 18 L1 4 H19 Z" : "M10 2 L19 16 H1 Z"} fill={c} /></svg>
      {v}
    </div>
  );
};

// valor antes → agora: o velho aparece, é riscado no `at` e o novo entra no lugar
const Change: React.FC<{ a?: string; b: string; at: number; good: boolean; big?: number }> = ({ a, b, at, good, big = 84 }) => {
  const f = useCurrentFrame();
  const c = good ? BUFF : NERF;
  const k = ease(f, at, at + 6);
  const pop = back(f, at, 8, 2.2);
  if (!a) {
    return <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: big, lineHeight: 1, color: f >= at ? c : MUTED, transform: `scale(${f >= at ? 0.7 + 0.3 * pop : 1})`, opacity: f >= at ? 1 : 0.35 }}>{f >= at ? b : "?"}</div>;
  }
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
      <div style={{ position: "relative", fontFamily: BODY, fontWeight: 900, fontSize: big * (1 - 0.42 * k), lineHeight: 1, color: k > 0 ? "#b9adc6" : WHITE, opacity: 1 - 0.35 * k }}>
        {a}
        <div style={{ position: "absolute", left: -4, top: "52%", height: 6, width: `${(k * 108).toFixed(1)}%`, background: c, borderRadius: 3 }} />
      </div>
      {k > 0 ? (
        <>
          <svg width={40 * k} height={34} viewBox="0 0 40 34" style={{ opacity: k }}><path d="M2 17 H30 M20 5 L32 17 L20 29" stroke={LABEL} strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
          <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: big, lineHeight: 1, color: c, transform: `scale(${0.6 + 0.4 * pop})`, textShadow: `0 0 26px ${c}66` }}>{b}</div>
        </>
      ) : null}
    </div>
  );
};

type TRow = { label: string; a?: string; b: string; at: number };
type Tier = { pts: 1 | 2 | 5; text?: string; hotAt?: number };

const TierBox: React.FC<{ t: Tier; w: number; enter: number }> = ({ t, w, enter }) => {
  const f = useCurrentFrame();
  const hot = t.hotAt !== undefined && f >= t.hotAt;
  const dc = t.pts === 5 ? T5 : SPIRIT;
  return (
    <div style={{ width: w, height: 250, display: "flex", flexDirection: "column", opacity: enter, transform: `translateY(${(1 - enter) * 40}px)`, filter: hot ? undefined : "brightness(0.8)" }}>
      <div style={{ height: 66, background: hot ? "#5b42a0" : "#1b1720", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, borderBottom: `2px solid ${hot ? "#b89cff" : "#2e2836"}` }}>
        <svg width={26} height={26} viewBox="0 0 20 20"><path d="M10 1 L19 10 L10 19 L1 10 Z" fill="none" stroke={dc} strokeWidth={3.2} /></svg>
        <span style={{ fontFamily: BODY, fontWeight: 900, fontSize: 38, color: WHITE }}>{t.pts}</span>
      </div>
      <div style={{ flex: 1, background: hot ? "linear-gradient(180deg, #7b5bc9 0%, #4d3684 100%)" : "linear-gradient(180deg, #2c2534 0%, #221d29 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, padding: "0 14px", boxShadow: hot ? "0 0 40px rgba(181,140,255,0.45)" : undefined }}>
        <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 29, lineHeight: 1.15, color: WHITE, textAlign: "center", opacity: hot ? 1 : 0 }}>{t.text ?? ""}</div>
      </div>
    </div>
  );
};

// ---------- tooltip da habilidade (o coração do vídeo) ----------
export const DLTip: React.FC<{
  life: number; hero: string; glyph: string; k: number; name: string; verdict: "NERF" | "BUFF";
  rows?: TRow[]; tiers?: Tier[]; note?: string; portrait?: boolean;
}> = ({ life, hero, glyph, k, name, verdict, rows = [], tiers, note, portrait = false }) => {
  const f = useCurrentFrame();
  const good = verdict === "BUFF";
  const a = ease(f, 0, 9);
  const ic = back(f, 2, 10, 1.6);
  const tg = interpolate(f, [8, 14], [1.8, 1], { ...clamp, easing: Easing.out(Easing.back(2)) });
  const out = interpolate(f, [life - 5, life], [1, 0], clamp);
  const kind = portrait ? "ATRIBUTOS DO HERÓI" : k === 4 ? "ULTIMATE" : `HABILIDADE ${k}`;
  return (
    <AbsoluteFill style={{ opacity: out }}>
      <DLBg hero={hero} />
      {/* cabeçalho: ícone + nome, como o HUD */}
      <div style={{ position: "absolute", left: SL, right: SR, top: 262, display: "flex", alignItems: "center", gap: 34 }}>
        <div style={{ transform: `scale(${ic})` }}>{portrait ? <Portrait hero={hero} size={160} /> : <AbilityIcon icon={glyph} k={k} size={160} />}</div>
        <div style={{ flex: 1, minWidth: 0, opacity: a, transform: `translateX(${(1 - a) * 40}px)` }}>
          <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 30, letterSpacing: 5, color: SPIRIT }}>{kind}</div>
          <div style={{ fontFamily: TITLE, fontWeight: 900, fontSize: name.length > 14 ? 78 : 92, lineHeight: 1.02, color: WHITE, textShadow: "0 4px 18px rgba(0,0,0,0.6)" }}>{name}</div>
        </div>
      </div>
      <div style={{ position: "absolute", left: SL, top: 172, opacity: f >= 8 ? 1 : 0, transformOrigin: "0 50%" }}><Tag v={verdict} s={tg} /></div>
      {/* painel do tooltip com a aba roxa atrás */}
      <div style={{ position: "absolute", left: SL - 10, right: SR, top: 480, display: "flex", flexDirection: "column", gap: 34 }}>
      <div style={{ position: "relative", opacity: a, transform: `translateY(${(1 - a) * 60}px)` }}>
        <div style={{ position: "absolute", left: -10, top: -18, width: 360, height: 120, background: TAB, transform: "rotate(-2.5deg)", borderRadius: 4 }} />
        <div style={{ position: "relative", background: PANEL, border: `2px solid ${EDGE}`, borderRadius: 6, padding: "36px 34px 34px", boxShadow: "0 30px 80px rgba(0,0,0,0.6)" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {rows.map((r, i) => (
              <div key={i} style={{ background: i === 0 ? TILE_HI : TILE, border: `2px solid ${i === 0 ? "#5b4785" : "#2f2838"}`, borderRadius: 4, padding: "24px 28px", display: "flex", flexDirection: "column", gap: 16, opacity: ease(f, 6 + i * 4, 14 + i * 4) }}>
                <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 40, color: LABEL }}>{r.label}</div>
                <Change a={r.a} b={r.b} at={r.at} good={good} big={92} />
              </div>
            ))}
            {note ? <div style={{ fontFamily: BODY, fontStyle: "italic", fontWeight: 600, fontSize: 30, color: MUTED, marginTop: 4 }}>{note}</div> : null}
          </div>
        </div>
      </div>
      {/* melhorias 1/2/5 pontos, logo abaixo do painel */}
      {tiers ? (
        <div style={{ display: "flex", gap: 14, paddingLeft: 10 }}>
          {tiers.map((t, i) => (
            <TierBox key={i} t={t} w={270} enter={ease(f, 10 + i * 3, 18 + i * 3)} />
          ))}
        </div>
      ) : null}
      </div>
    </AbsoluteFill>
  );
};

// ---------- troca de melhoria: alcance e spirit amp mudam de caixa ----------
export const DLSwap: React.FC<{ life: number; swapAt?: number }> = ({ life, swapAt = 60 }) => {
  const f = useCurrentFrame();
  const a = ease(f, 0, 9);
  const s = interpolate(f, [swapAt, swapAt + 16], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const out = interpolate(f, [life - 5, life], [1, 0], clamp);
  const W = 270, G = 14;
  const x2 = W + G, x5 = 2 * (W + G); // esquerda das caixas de 2 e 5 pontos
  const chip = (text: string, from: number, to: number, lift: number) => {
    const x = from + (to - from) * s;
    const y = -Math.sin(Math.PI * s) * lift;
    return (
      <div style={{ position: "absolute", left: x + 14, top: 120 + y, width: W - 28, height: 130, borderRadius: 6, background: "linear-gradient(180deg, #7b5bc9, #4d3684)", border: "2px solid #c9b2ff", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", fontFamily: BODY, fontWeight: 900, fontSize: 34, color: WHITE, lineHeight: 1.1, boxShadow: "0 18px 40px rgba(0,0,0,0.5)" }}>{text}</div>
    );
  };
  return (
    <AbsoluteFill style={{ opacity: out }}>
      <DLBg hero="Celeste" />
      <div style={{ position: "absolute", left: SL, right: SR, top: 230, display: "flex", alignItems: "center", gap: 34, opacity: a }}>
        <AbilityIcon icon="Radiant_Daggers" k={3} size={160} />
        <div>
          <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 30, letterSpacing: 5, color: SPIRIT }}>MELHORIAS TROCADAS</div>
          <div style={{ fontFamily: TITLE, fontWeight: 900, fontSize: 88, lineHeight: 1.02, color: WHITE }}>Radiant Daggers</div>
        </div>
      </div>
      <div style={{ position: "absolute", left: SL, top: 600, width: 3 * W + 2 * G, height: 420, opacity: a }}>
        {[1, 2, 5].map((p, i) => (
          <div key={p} style={{ position: "absolute", left: i * (W + G), top: 0, width: W, height: 300 }}>
            <div style={{ height: 66, background: "#1b1720", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, borderBottom: "2px solid #2e2836" }}>
              <svg width={26} height={26} viewBox="0 0 20 20"><path d="M10 1 L19 10 L10 19 L1 10 Z" fill="none" stroke={p === 5 ? T5 : SPIRIT} strokeWidth={3.2} /></svg>
              <span style={{ fontFamily: BODY, fontWeight: 900, fontSize: 38, color: WHITE }}>{p}</span>
            </div>
            <div style={{ height: 234, background: "linear-gradient(180deg, #2c2534 0%, #221d29 100%)", display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 18, fontFamily: BODY, fontWeight: 700, fontSize: 26, color: MUTED }}></div>
          </div>
        ))}
        {chip("SPIRIT AMP", x2, x5, 150)}
        {chip("ALCANCE", x5, x2, -150)}
      </div>
    </AbsoluteFill>
  );
};

// ---------- card de item da loja: Healbane ----------
export const DLItem: React.FC<{ life: number; stackAt?: number; barsAt?: number; swapAt?: number; effAt?: number }> = ({ life, stackAt = 60, barsAt = 150, swapAt = 200, effAt = 300 }) => {
  const f = useCurrentFrame();
  const a = ease(f, 0, 9);
  const out = interpolate(f, [life - 5, life], [1, 0], clamp);
  const sw = ease(f, swapAt, swapAt + 18);
  const pct = 82 - 10 * sw;
  const st = interpolate(f, [effAt, effAt + 6], [1.8, 1], { ...clamp, easing: Easing.out(Easing.back(2)) });
  return (
    <AbsoluteFill style={{ opacity: out }}>
      <DLBg tint="#5d3fa8" />
      <div style={{ position: "absolute", left: SL, right: SR, top: 190, opacity: a, transform: `translateY(${(1 - a) * 60}px)` }}>
        {/* cabeçalho roxo de item spirit */}
        <div style={{ display: "flex", alignItems: "center", gap: 30, background: "linear-gradient(90deg, #6e4fc0 0%, #4c3592 100%)", padding: "26px 30px", borderRadius: "8px 8px 0 0", border: "2px solid #9d82e6" }}>
          <Img src={img("Healbane")} style={{ width: 170, height: 170, borderRadius: 8, border: "3px solid #2a2140" }} />
          <div>
            <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 30, letterSpacing: 5, color: "#e5dbff" }}>ITEM · SPIRIT</div>
            <div style={{ fontFamily: TITLE, fontWeight: 900, fontSize: 100, lineHeight: 1, color: WHITE }}>Healbane</div>
          </div>
        </div>
        <div style={{ background: PANEL, border: `2px solid ${EDGE}`, borderTop: "none", borderRadius: "0 0 8px 8px", padding: "34px 34px 40px", display: "flex", flexDirection: "column", gap: 30 }}>
          <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 34, color: LABEL }}>Stacks no inimigo</div>
          <div style={{ display: "flex", gap: 22 }}>
            {[0, 1, 2, 3].map((i) => {
              const on = back(f, stackAt + i * 5, 7, 2);
              const fade = 1 - 0.55 * ease(f, stackAt + 25 + i * 6, stackAt + 45 + i * 6);
              return (
                <div key={i} style={{ width: 160, height: 100, borderRadius: 6, background: TILE, border: "2px solid #2f2838", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width={64} height={64} viewBox="0 0 20 20" style={{ transform: `scale(${on})`, opacity: fade }}><path d="M10 1 L19 10 L10 19 L1 10 Z" fill={SPIRIT} /></svg>
                </div>
              );
            })}
          </div>
          <div style={{ fontFamily: BODY, fontWeight: 600, fontStyle: "italic", fontSize: 30, color: MUTED, opacity: ease(f, stackAt + 25, stackAt + 35) }}>cada stack perde força bem mais rápido</div>
          <div style={{ background: TILE_HI, border: "2px solid #5b4785", borderRadius: 4, padding: "28px 30px", display: "flex", flexDirection: "column", gap: 20, opacity: ease(f, barsAt, barsAt + 8) }}>
            <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 34, color: LABEL }}>Corte de cura com 4 stacks</div>
            <div style={{ height: 46, background: "#17131c", borderRadius: 4, overflow: "hidden", position: "relative" }}>
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${pct}%`, background: `linear-gradient(90deg, #6e4fc0, ${sw > 0 ? NERF : SPIRIT})` }} />
              <div style={{ position: "absolute", left: "72%", top: -6, bottom: -6, width: 3, background: "rgba(255,255,255,0.25)" }} />
            </div>
            <Change a="~82%" b="72%" at={swapAt} good={false} />
          </div>
        </div>
      </div>
      <div style={{ position: "absolute", left: SL, right: SR, top: 1150, display: "flex", justifyContent: "center", opacity: f >= effAt ? 1 : 0 }}>
        <div style={{ transform: `scale(${st}) rotate(-3deg)`, padding: "16px 34px", border: `4px solid ${NERF}`, borderRadius: 8, background: `${NERF}1c`, color: NERF, fontFamily: BODY, fontWeight: 900, fontSize: 50, letterSpacing: 2 }}>EMPILHAR RENDE MENOS</div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- card do herói (tela de escolha de herói) ----------
export const DLHero: React.FC<{ life: number; hero: string; name: string; verdict: "NERF" | "BUFF"; sub?: string; tagAt?: number }> = ({ life, hero, name, verdict, sub, tagAt = 10 }) => {
  const f = useCurrentFrame();
  const a = back(f, 0, 12, 1.3);
  const out = interpolate(f, [life - 5, life], [1, 0], clamp);
  const st = interpolate(f, [tagAt, tagAt + 6], [2.4, 1], { ...clamp, easing: Easing.out(Easing.back(2)) });
  const c = verdict === "NERF" ? NERF : BUFF;
  return (
    <AbsoluteFill style={{ opacity: out }}>
      <DLBg hero={hero} tint={verdict === "NERF" ? "#a8403a" : "#3a9a5c"} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 220, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ position: "relative", width: 560, height: 760, transform: `scale(${0.85 + 0.15 * a})`, opacity: Math.min(1, a * 1.4) }}>
          <div style={{ position: "absolute", inset: -14, border: `3px solid ${EDGE}`, background: "linear-gradient(180deg, #2b2533, #1a161f)", borderRadius: 10, boxShadow: `0 0 60px ${c}44, 0 30px 80px rgba(0,0,0,0.6)` }} />
          <Img src={img(`${hero}_card`)} style={{ position: "absolute", inset: 0, width: 560, height: 760, objectFit: "cover", borderRadius: 4 }} />
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 200, background: "linear-gradient(180deg, rgba(26,22,31,0) 0%, rgba(26,22,31,0.95) 80%)" }} />
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 26, textAlign: "center", fontFamily: TITLE, fontWeight: 900, fontSize: name.length > 11 ? 72 : 90, color: WHITE, lineHeight: 1 }}>{name}</div>
        </div>
        <div style={{ marginTop: 46, opacity: f >= tagAt ? 1 : 0 }}><Tag v={verdict} s={st * 1.3} /></div>
        {sub ? <div style={{ marginTop: 30, fontFamily: BODY, fontWeight: 800, fontSize: 36, color: LABEL, opacity: ease(f, tagAt + 4, tagAt + 12) }}>{sub}</div> : null}
      </div>
    </AbsoluteFill>
  );
};

// ---------- placar de heróis (quem caiu, quem subiu) ----------
type Slot = { hero: string; name: string; at: number };
export const DLBoard: React.FC<{ life: number; title: string; kicker?: string; nerf?: Slot[]; buff?: Slot[]; nerfSlots?: number; buffSlots?: number }> = ({ life, title, kicker = "PATCH 04/11", nerf = [], buff = [], nerfSlots, buffSlots }) => {
  const f = useCurrentFrame();
  const a = ease(f, 0, 9);
  const out = interpolate(f, [life - 5, life], [1, 0], clamp);
  const row = (items: Slot[], n: number, v: "NERF" | "BUFF", y: number) => {
    const c = v === "NERF" ? NERF : BUFF;
    const w = n > 3 ? 190 : 250;
    return (
      <div style={{ position: "absolute", left: SL, right: SR, top: y, display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
        <div style={{ opacity: a }}><Tag v={v} /></div>
        <div style={{ display: "flex", gap: 20 }}>
          {Array.from({ length: n }).map((_, i) => {
            const it = items[i];
            const on = it ? back(f, it.at, 10, 1.6) : 0;
            return (
              <div key={i} style={{ width: w, height: w * 1.36, position: "relative", borderRadius: 6, background: "#1d1923", border: `2px solid ${on > 0.5 ? c : EDGE}`, overflow: "hidden", boxShadow: on > 0.5 ? `0 0 30px ${c}44` : undefined }}>
                {it ? (
                  <div style={{ position: "absolute", inset: 0, opacity: Math.min(1, on * 1.5), transform: `scale(${0.8 + 0.2 * on})` }}>
                    <Img src={img(`${it.hero}_card`)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "40px 6px 10px", background: "linear-gradient(180deg, rgba(20,17,24,0), rgba(20,17,24,0.95))", textAlign: "center", fontFamily: TITLE, fontWeight: 900, fontSize: w >= 250 ? 36 : 30, color: WHITE, lineHeight: 1 }}>{it.name}</div>
                  </div>
                ) : null}
                {!it || on === 0 ? <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: TITLE, fontWeight: 900, fontSize: 120, color: "#3d3547" }}>?</div> : null}
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  const nN = nerfSlots ?? nerf.length;
  const nB = buffSlots ?? buff.length;
  return (
    <AbsoluteFill style={{ opacity: out }}>
      <DLBg tint="#5d3fa8" />
      <div style={{ position: "absolute", left: SL, right: SR, top: 180, textAlign: "center", opacity: a }}>
        <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 30, letterSpacing: 8, color: SPIRIT }}>{kicker}</div>
        <div style={{ fontFamily: TITLE, fontWeight: 900, fontSize: 88, color: WHITE, lineHeight: 1.05 }}>{title}</div>
      </div>
      {nN ? row(nerf, nN, "NERF", nB ? 370 : 440) : null}
      {nB ? row(buff, nB, "BUFF", nN ? 860 : 440) : null}
    </AbsoluteFill>
  );
};

// ---------- abertura: a atualização caindo de madrugada e a Celeste na mira ----------
// 0: golpe (casa com o role reveal do Among Us) e o card de atualização baixando; clockAt ("madrugada"): relógio 03:47;
// listAt ("se você joga"): as notas do patch descendo; celAt ("Celeste"): o resto apaga e a Celeste sobe em vermelho.
const INTRO_LIST: [string, "NERF" | "BUFF"][] = [["Celeste", "NERF"], ["Baba", "NERF"], ["Deadman Danny", "NERF"], ["Rat King", "BUFF"], ["Apollo", "BUFF"], ["Nurse Harrow", "BUFF"], ["Mo & Krill", "BUFF"]];
export const DLIntro: React.FC<{ life: number; clockAt?: number; listAt?: number; celAt?: number }> = ({ life, clockAt = 64, listAt = 97, celAt = 128 }) => {
  const f = useCurrentFrame();
  const flash = interpolate(f, [0, 8], [0.75, 0], clamp);
  const card = back(f, 0, 10, 1.4);
  const prog = interpolate(f, [3, clockAt + 4], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const done = f >= clockAt + 4;
  const clk = back(f, clockAt, 9, 2);
  const cel = ease(f, celAt, celAt + 10);
  const shake = f >= celAt && f < celAt + 8 ? Math.sin(f * 3.1) * (celAt + 8 - f) * 1.6 : 0;
  const out = interpolate(f, [life - 4, life], [1, 0], clamp);
  return (
    <AbsoluteFill style={{ opacity: out, transform: `translateX(${shake}px)` }}>
      <DLBg tint={cel > 0 ? "#b0403a" : "#6b4bb8"} />
      {/* relógio da madrugada */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 190, textAlign: "center", opacity: Math.min(1, clk * 1.4) * (1 - cel), transform: `scale(${0.7 + 0.3 * clk})` }}>
        <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 200, lineHeight: 1, color: WHITE, letterSpacing: 4, textShadow: "0 0 60px rgba(181,140,255,0.45)" }}>03:47</div>
        <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 34, letterSpacing: 14, color: SPIRIT, marginTop: 6 }}>DE MADRUGADA</div>
      </div>
      {/* card da atualização */}
      <div style={{ position: "absolute", left: SL, right: SR, top: 510, opacity: Math.min(1, card * 1.4) * (1 - cel), transform: `translateY(${(1 - card) * 120 - cel * 60}px) scale(${1 - 0.06 * cel})` }}>
        <div style={{ position: "absolute", left: -10, top: -18, width: 300, height: 110, background: TAB, transform: "rotate(-2.5deg)", borderRadius: 4 }} />
        <div style={{ position: "relative", background: PANEL, border: `2px solid ${EDGE}`, borderRadius: 6, padding: "34px 36px", boxShadow: "0 30px 80px rgba(0,0,0,0.6)" }}>
          <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 30, letterSpacing: 8, color: SPIRIT }}>{done ? "ATUALIZAÇÃO INSTALADA" : "BAIXANDO ATUALIZAÇÃO"}</div>
          <div style={{ fontFamily: TITLE, fontWeight: 900, fontSize: 100, lineHeight: 1, color: WHITE, marginTop: 6 }}>Deadlock</div>
          <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 40, color: LABEL, marginTop: 4 }}>Patch 04/11</div>
          <div style={{ marginTop: 28, height: 28, background: "#17131c", borderRadius: 4, overflow: "hidden", border: "2px solid #2f2838" }}>
            <div style={{ height: "100%", width: `${(prog * 100).toFixed(1)}%`, background: done ? `linear-gradient(90deg, #6e4fc0, ${BUFF})` : "linear-gradient(90deg, #6e4fc0, #b58cff)" }} />
          </div>
          <div style={{ marginTop: 12, fontFamily: BODY, fontWeight: 800, fontSize: 32, color: done ? BUFF : MUTED }}>{done ? "✓ pronto pra jogar" : `${Math.round(prog * 100)}%`}</div>
        </div>
      </div>
      {/* notas do patch descendo */}
      <div style={{ position: "absolute", left: SL, right: SR, top: 930, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, opacity: 1 - cel }}>
        {INTRO_LIST.map(([n, v], i) => {
          const e = ease(f, listAt + i * 2, listAt + i * 2 + 7);
          const c = v === "NERF" ? NERF : BUFF;
          return (
            <div key={n} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "12px 16px", background: TILE, border: "2px solid #2f2838", borderRadius: 4, opacity: e, transform: `translateY(${(1 - e) * -30}px)` }}>
              <span style={{ fontFamily: TITLE, fontWeight: 900, fontSize: n.length > 10 ? 30 : 36, color: WHITE, whiteSpace: "nowrap" }}>{n}</span>
              <span style={{ fontFamily: BODY, fontWeight: 900, fontSize: 24, color: c, whiteSpace: "nowrap" }}>{v === "NERF" ? "▼" : "▲"} {v}</span>
            </div>
          );
        })}
      </div>
      {/* a Celeste na mira */}
      {cel > 0 ? (
        <>
          <AbsoluteFill style={{ background: `radial-gradient(ellipse 80% 60% at 50% 62%, rgba(176,64,58,${0.45 * cel}) 0%, rgba(0,0,0,0) 70%)` }} />
          <Img src={img("Celeste_Render")} style={{ position: "absolute", left: 0, top: 400 + (1 - cel) * 300, width: 1080, height: 1520, objectFit: "cover", objectPosition: "42% 15%", opacity: cel, WebkitMaskImage: "linear-gradient(180deg, transparent 0%, black 16%, black 100%)", maskImage: "linear-gradient(180deg, transparent 0%, black 16%, black 100%)" }} />
          <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(18,15,22,0) 70%, rgba(18,15,22,0.85) 100%)" }} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 190, display: "flex", flexDirection: "column", alignItems: "center", opacity: cel }}>
            <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 34, letterSpacing: 10, color: NERF, marginBottom: 4 }}>▼ NA MIRA DA VALVE</div>
            <div style={{ fontFamily: TITLE, fontWeight: 900, fontSize: 150, color: WHITE, lineHeight: 1, textShadow: "0 8px 40px rgba(0,0,0,0.8)", transform: `scale(${1.25 - 0.25 * cel})` }}>Celeste</div>
          </div>
        </>
      ) : null}
      <AbsoluteFill style={{ background: "#e9dcff", opacity: flash, mixBlendMode: "screen" }} />
    </AbsoluteFill>
  );
};

// ---------- meme em tela cheia ----------
export const DLMeme: React.FC<{ life: number; m: string; ss?: number; rate?: number; z0?: number; z1?: number }> = ({ life, m, ss = 0, rate = 1, z0 = 1, z1 = 1.06 }) => {
  const f = useCurrentFrame();
  const len = (ML as Record<string, number>)[m] ?? 3;
  const loopF = Math.max(1, Math.floor(((len - ss) / rate) * FPS) - 1);
  const z = interpolate(f, [0, life], [z0, z1], clamp);
  const v = <OffthreadVideo src={staticFile(`${MP}${m}.mp4`)} muted startFrom={Math.round(ss * FPS)} playbackRate={rate} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />;
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${z})` }}>{life > loopF ? <Loop durationInFrames={loopF}>{v}</Loop> : v}</AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------- apresentação do BLIES (CTA, 05/11 v2): ele vira um HERÓI do Deadlock ----------
// v1 (avatar com "B" + cartões soltos) reprovada: "não gostei da apresentação nem dessa bola com B, minha foto de perfil".
// v2: a foto dele (dl/blies.jpg) entra como card da escolha de herói ("NOVO HERÓI LIBERADO") e o CTA vira o KIT dele no
// HUD do jogo: 4 habilidades acendendo na fala, cada uma com o tooltip roxo do Deadlock.
//   1 Live Diária ("faço live… todos os dias")   2 Seguir ("me segue aqui": botão + seta pro avatar do TikTok)
//   3 Patch Explicado ("conteúdo informativo… atualização")   4 ULT Os Básicos ("série… ranqueada… ganhar": ranques + vitórias)
// Nada inventado sobre ele: sem número de seguidor nem ranque dele.
const ME = "blies";
const DAYS = ["S", "T", "Q", "Q", "S", "S", "D"];
const RANKS = ["Initiate", "Seeker", "Alchemist", "Arcanist", "Ritualist", "Emissary"];
const Check: React.FC<{ c: string; w?: number; o?: number }> = ({ c, w = 34, o = 1 }) => (
  <svg width={w} height={w * 0.82} viewBox="0 0 34 28" style={{ opacity: o }}><path d="M3 15 L12 24 L31 4" fill="none" stroke={c} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" /></svg>
);
// desenhos brancos das 4 habilidades (mesmo traço dos ícones do HUD)
const Glyph: React.FC<{ k: number; s: number }> = ({ k, s }) => {
  const st = { fill: "none", stroke: WHITE, strokeWidth: 2.4, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg width={s} height={s} viewBox="0 0 24 24">
      {k === 1 ? (
        <>
          <circle cx={12} cy={12} r={2.6} fill={WHITE} />
          <path d="M7.8 7.8a6 6 0 0 0 0 8.4M16.2 7.8a6 6 0 0 1 0 8.4M5 5a10 10 0 0 0 0 14M19 5a10 10 0 0 1 0 14" {...st} />
        </>
      ) : k === 2 ? (
        <>
          <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" {...st} />
          <path d="M12 9v6M9 12h6" {...st} />
        </>
      ) : k === 3 ? (
        <>
          <path d="M6 3h9l4 4v14H6z" {...st} />
          <path d="M9 11h7M9 14.5h7M9 18h4" {...st} />
        </>
      ) : (
        <path d="M3 18l2-10 4.5 4L12 5l2.5 7L19 8l2 10z M3 21h18" {...st} />
      )}
    </svg>
  );
};
const KIT = [
  { k: 1, name: "Live Diária", kind: "HABILIDADE 1" },
  { k: 2, name: "Seguir", kind: "HABILIDADE 2" },
  { k: 3, name: "Patch Explicado", kind: "HABILIDADE 3" },
  { k: 4, name: "Os Básicos", kind: "ULTIMATE" },
];

export const DLMe: React.FC<{
  life: number; nameAt?: number; liveAt?: number; daysAt?: number; followAt?: number; newsAt?: number; patchAt?: number;
  seriesAt?: number; basicsAt?: number; rankAt?: number; winAt?: number;
}> = ({ life, nameAt = 20, liveAt = 40, daysAt = 70, followAt = 120, newsAt = 220, patchAt = 260, seriesAt = 360, basicsAt = 400, rankAt = 500, winAt = 540 }) => {
  const f = useCurrentFrame();
  const out = interpolate(f, [life - 6, life], [1, 0], clamp);
  const pulse = 0.5 + 0.5 * Math.sin(f * 0.25);
  // card grande do herói até o "live"; depois ele sobe e vira o cabeçalho do kit
  const toKit = ease(f, liveAt - 4, liveAt + 12);
  const cardIn = back(f, 0, 14, 1.4);
  const shine = interpolate(f, [6, 26], [-0.4, 1.4], clamp);
  const letters = "BLIES".split("");
  // habilidade ativa
  const starts = [liveAt, followAt, newsAt, seriesAt];
  const cur = f < followAt ? 0 : f < newsAt ? 1 : f < seriesAt ? 2 : 3;
  const tip = (i: number) => ({ i: ease(f, starts[i] - 2, starts[i] + 9), o: i < 3 ? ease(f, starts[i + 1] - 5, starts[i + 1] + 3) : 0 });
  const clickF = followAt + 20;
  const clicked = f >= clickF;
  const press = f >= clickF && f < clickF + 5 ? 0.92 : 1;
  const burst = ease(f, clickF, clickF + 14);
  const arrow = ease(f, clickF + 6, clickF + 20);
  const curs = ease(f, followAt + 4, followAt + 18);
  const W1 = 860; // largura útil (SL..SR)
  return (
    <AbsoluteFill style={{ opacity: out }}>
      <DLBg tint="#7a4fd8" />
      {/* faíscas subindo no fundo */}
      {Array.from({ length: 16 }).map((_, i) => {
        const x = ((i * 211) % 980) + 50;
        const y = 1900 - ((f * (1.4 + (i % 5) * 0.4) + i * 150) % 1900);
        const sz = 5 + (i % 3) * 3;
        return <div key={i} style={{ position: "absolute", left: x, top: y, width: sz, height: sz, borderRadius: "50%", background: i % 4 ? SPIRIT : "#ffd27a", opacity: 0.16 + (i % 4) * 0.06, filter: "blur(1px)" }} />;
      })}

      {/* ===== card do herói (escolha de herói) → cabeçalho ===== */}
      {(() => {
        const w = 560 + (170 - 560) * toKit, h = 760 + (170 - 760) * toKit;
        const left = 540 - w / 2 + (SL + 85 - 540) * toKit - 0;
        const top = 300 + (215 - 300) * toKit;
        const rad = 10 + 75 * toKit;
        return (
          <>
            <div style={{ position: "absolute", left: SL, right: SR, top: 190, textAlign: "center", opacity: (1 - toKit) * ease(f, 2, 10), fontFamily: BODY, fontWeight: 900, fontSize: 34, letterSpacing: 10, color: "#ffd27a", textShadow: "0 0 24px rgba(255,210,122,0.6)" }}>NOVO HERÓI LIBERADO</div>
            <div style={{ position: "absolute", left: left - w / 2 + w / 2, top, width: w, height: h, transform: `scale(${0.85 + 0.15 * cardIn})`, opacity: Math.min(1, cardIn * 1.4) }}>
              <div style={{ position: "absolute", inset: -12, borderRadius: rad + 6, border: `3px solid ${f >= liveAt ? NERF : "#c9b2ff"}`, background: "linear-gradient(180deg, #2b2533, #1a161f)", boxShadow: f >= liveAt ? `0 0 ${24 + 20 * pulse}px ${NERF}88` : "0 0 60px rgba(181,140,255,0.45), 0 30px 80px rgba(0,0,0,0.6)" }} />
              <div style={{ position: "absolute", inset: 0, borderRadius: rad, overflow: "hidden" }}>
                <Img src={staticFile(`${DLP}${ME}.jpg`)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "43% 38%" }} />
                {/* brilho passando no card */}
                <div style={{ position: "absolute", top: 0, bottom: 0, left: `${shine * 100}%`, width: "30%", background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.35), rgba(255,255,255,0))", transform: "skewX(-18deg)", opacity: 1 - toKit }} />
                <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "34%", background: "linear-gradient(180deg, rgba(26,22,31,0) 0%, rgba(26,22,31,0.95) 85%)", opacity: 1 - toKit }} />
              </div>
              {/* nome no pé do card, letra a letra */}
              <div style={{ position: "absolute", left: 0, right: 0, bottom: 26, display: "flex", justifyContent: "center", opacity: 1 - toKit }}>
                {letters.map((ch, i) => {
                  const e = back(f, nameAt + i * 3, 9, 2.2);
                  return <span key={i} style={{ fontFamily: TITLE, fontWeight: 900, fontSize: 120, lineHeight: 1, color: WHITE, display: "inline-block", opacity: Math.min(1, e * 1.5), transform: `translateY(${(1 - e) * -90}px)`, textShadow: "0 6px 26px rgba(0,0,0,0.7)" }}>{ch}</span>;
                })}
              </div>
              {f >= liveAt ? (
                <div style={{ position: "absolute", left: "50%", bottom: -22, transform: `translateX(-50%) scale(${back(f, liveAt, 8, 2.2)})`, padding: "4px 14px", borderRadius: 6, background: NERF, color: WHITE, fontFamily: BODY, fontWeight: 900, fontSize: 24, letterSpacing: 2, whiteSpace: "nowrap" }}>AO VIVO</div>
              ) : null}
            </div>
            {/* cabeçalho do kit: nome + função, ao lado do retrato */}
            <div style={{ position: "absolute", left: SL + 200, right: SR, top: 228, opacity: toKit, transform: `translateX(${(1 - toKit) * 40}px)` }}>
              <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 30, letterSpacing: 5, color: SPIRIT }}>STREAMER DE DEADLOCK</div>
              <div style={{ fontFamily: TITLE, fontWeight: 900, fontSize: 116, lineHeight: 1, color: WHITE, textShadow: "0 4px 18px rgba(0,0,0,0.6)" }}>BLIES</div>
            </div>
          </>
        );
      })()}

      {/* ===== HUD: as 4 habilidades ===== */}
      <div style={{ position: "absolute", left: SL, width: W1, top: 450, display: "flex", justifyContent: "space-between", opacity: toKit }}>
        {KIT.map((a, i) => {
          const on = f >= starts[i];
          const act = i === cur && on;
          const e = back(f, starts[i], 9, 2);
          const s = 180;
          return (
            <div key={a.k} style={{ position: "relative", width: s, height: s + 30, transform: `scale(${act ? 0.9 + 0.12 * e : 0.86})`, filter: on ? undefined : "grayscale(0.8) brightness(0.55)" }}>
              <div style={{ position: "absolute", left: 0, top: 0, width: s, height: s, borderRadius: a.k === 4 ? 26 : "50%", background: a.k === 4 ? "radial-gradient(circle at 50% 35%, #ff9b7a 0%, #c94a3a 60%, #7a2a22 100%)" : "radial-gradient(circle at 50% 35%, #a988f0 0%, #6d4cc0 60%, #4a3388 100%)", border: `4px solid ${a.k === 4 ? "#ffc9b8" : "#d9c8ff"}`, boxShadow: act ? `0 0 ${36 + 22 * pulse}px ${a.k === 4 ? "rgba(255,120,90,0.7)" : "rgba(181,140,255,0.75)"}` : undefined, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Glyph k={a.k} s={s * 0.56} />
              </div>
              <div style={{ position: "absolute", left: "50%", top: s - 22, transform: "translateX(-50%)", width: 48, height: 48, borderRadius: 8, background: "#1a1620", border: `2px solid ${EDGE}`, color: WHITE, fontFamily: BODY, fontWeight: 900, fontSize: 30, display: "flex", alignItems: "center", justifyContent: "center" }}>{a.k}</div>
            </div>
          );
        })}
      </div>

      {/* ===== tooltip da habilidade ativa ===== */}
      {KIT.map((a, i) => {
        const t = tip(i);
        if (t.i <= 0 || t.o >= 1) return null;
        const ult = a.k === 4;
        return (
          <div key={a.k} style={{ position: "absolute", left: SL - 10, width: W1 + 10, top: 700, opacity: t.i * (1 - t.o), transform: `translateY(${(1 - t.i) * 50 - t.o * 40}px)` }}>
            <div style={{ position: "absolute", left: -10, top: -18, width: 360, height: 110, background: ult ? "#d8604a" : TAB, transform: "rotate(-2.5deg)", borderRadius: 4 }} />
            <div style={{ position: "relative", background: PANEL, border: `2px solid ${EDGE}`, borderRadius: 6, padding: "28px 32px 32px", boxShadow: "0 30px 80px rgba(0,0,0,0.6)" }}>
              <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 28, letterSpacing: 5, color: ult ? "#ffb39e" : SPIRIT }}>{a.kind}</div>
              <div style={{ fontFamily: TITLE, fontWeight: 900, fontSize: 84, lineHeight: 1.02, color: WHITE, marginBottom: 22 }}>{a.name}</div>
              {a.k === 1 ? (
                <div style={{ background: TILE_HI, border: "2px solid #5b4785", borderRadius: 4, padding: "22px 24px" }}>
                  <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 36, color: LABEL, marginBottom: 16 }}>Live de Deadlock · recarga: <span style={{ color: BUFF }}>todo dia</span></div>
                  <div style={{ display: "flex", gap: 10 }}>
                    {DAYS.map((d, j) => {
                      const on = f >= daysAt + j * 3;
                      const e = back(f, daysAt + j * 3, 7, 2.4);
                      return (
                        <div key={j} style={{ flex: 1, height: 104, borderRadius: 6, background: on ? "linear-gradient(180deg, #7b5bc9, #4d3684)" : TILE, border: `2px solid ${on ? "#c9b2ff" : "#2f2838"}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, transform: `scale(${on ? 0.85 + 0.15 * e : 1})` }}>
                          <span style={{ fontFamily: BODY, fontWeight: 900, fontSize: 30, color: on ? WHITE : MUTED }}>{d}</span>
                          <Check c={on ? BUFF : MUTED} w={30} o={on ? 1 : 0.15} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : a.k === 2 ? (
                <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 26 }}>
                  <div style={{ transform: `scale(${press * (clicked ? 0.9 + 0.1 * back(f, clickF, 8, 2) : 1)})`, width: 470, height: 120, borderRadius: 14, background: clicked ? TILE : NERF, border: `3px solid ${clicked ? EDGE : "#ff8f84"}`, display: "flex", alignItems: "center", justifyContent: "center", gap: 16, fontFamily: BODY, fontWeight: 900, fontSize: 52, color: WHITE, letterSpacing: 2, boxShadow: clicked ? undefined : `0 0 ${26 + 18 * pulse}px ${NERF}77` }}>
                    {clicked ? (<><Check c={BUFF} w={44} />SEGUINDO</>) : "+ SEGUIR"}
                  </div>
                  <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 32, color: LABEL, lineHeight: 1.2 }}>custo:<br /><span style={{ color: BUFF, fontWeight: 900 }}>0 souls</span></div>
                  {clicked
                    ? Array.from({ length: 10 }).map((_, j) => {
                        const ang = (j / 10) * Math.PI * 2;
                        const r = 70 + 170 * burst;
                        return <div key={j} style={{ position: "absolute", left: 235 + Math.cos(ang) * r * 1.3 - 20, top: 60 + Math.sin(ang) * r - 22, fontSize: 42, opacity: 1 - burst, color: j % 2 ? NERF : SPIRIT }}>♥</div>;
                      })
                    : null}
                  <svg width={64} height={74} viewBox="0 0 24 28" style={{ position: "absolute", left: 420 - 170 * curs, top: 200 - 140 * curs, opacity: ease(f, followAt + 2, followAt + 6) * (1 - ease(f, clickF + 12, clickF + 18)), transform: `scale(${press})` }}>
                    <path d="M2 2 L2 22 L8 16 L12 26 L16 24 L12 14 L20 14 Z" fill={WHITE} stroke="#120f16" strokeWidth={1.6} strokeLinejoin="round" />
                  </svg>
                </div>
              ) : a.k === 3 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {[["Patch 04/11", "o que mudou de verdade", NERF], ["Números novos", "antes → agora, no detalhe", SPIRIT], ["Próximo patch", "no dia que sair", BUFF]].map(([tt, ss, c], j) => {
                    const e = ease(f, Math.min(patchAt, newsAt + 8) + j * 8, Math.min(patchAt, newsAt + 8) + j * 8 + 10);
                    return (
                      <div key={j} style={{ display: "flex", alignItems: "center", gap: 20, padding: "18px 22px", background: j === 0 ? TILE_HI : TILE, border: `2px solid ${j === 0 ? "#5b4785" : "#2f2838"}`, borderLeft: `8px solid ${c}`, borderRadius: 4, opacity: e, transform: `translateX(${(1 - e) * -120}px)` }}>
                        <div style={{ width: 20, height: 20, borderRadius: "50%", background: c, boxShadow: `0 0 14px ${c}`, flexShrink: 0 }} />
                        <div>
                          <div style={{ fontFamily: TITLE, fontWeight: 900, fontSize: 46, color: WHITE, lineHeight: 1.05 }}>{tt}</div>
                          <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 30, color: LABEL }}>{ss}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div>
                  <div style={{ display: "flex", gap: 12 }}>
                    {[1, 2, 3].map((n, j) => {
                      const e = back(f, seriesAt + 6 + j * 5, 8, 2);
                      const lit = j === 0 && f >= basicsAt;
                      return (
                        <div key={n} style={{ flex: 1, height: 96, borderRadius: 6, background: lit ? "linear-gradient(180deg, #7b5bc9, #4d3684)" : TILE, border: `2px solid ${lit ? "#c9b2ff" : "#2f2838"}`, boxShadow: lit ? "0 0 26px rgba(181,140,255,0.5)" : undefined, display: "flex", alignItems: "center", justifyContent: "center", gap: 12, transform: `scale(${e})` }}>
                          <span style={{ fontFamily: BODY, fontWeight: 900, fontSize: 24, letterSpacing: 3, color: lit ? "#e5dbff" : MUTED }}>EP</span>
                          <span style={{ fontFamily: TITLE, fontWeight: 900, fontSize: 56, color: WHITE, lineHeight: 1 }}>0{n}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ position: "relative", height: 250, marginTop: 14 }}>
                    <svg width={W1 - 64} height={250} style={{ position: "absolute", left: 0, top: 0 }}>
                      <path d={`M 50 215 L ${W1 - 120} 45`} fill="none" stroke={BUFF} strokeWidth={6} strokeLinecap="round" strokeDasharray="900" strokeDashoffset={900 * (1 - ease(f, rankAt, rankAt + 26))} opacity={0.7} />
                    </svg>
                    {RANKS.map((r, j) => {
                      const e0 = ease(f, seriesAt + 14 + j * 3, seriesAt + 24 + j * 3);
                      const e = back(f, rankAt + j * 4, 9, 1.8);
                      const on = f >= rankAt + j * 4;
                      return (
                        <div key={r} style={{ position: "absolute", left: j * 136, top: 150 - j * 30, width: 110, height: 110, opacity: e0, transform: `translateY(${(1 - e0) * 30}px) scale(${on ? 0.85 + 0.25 * e : 0.85})` }}>
                          <Img src={img(`Rank_${r}`)} style={{ width: 110, height: 110, objectFit: "contain", filter: on ? `drop-shadow(0 0 ${j === RANKS.length - 1 ? 24 : 8}px rgba(181,140,255,0.6))` : "grayscale(1) brightness(0.45)" }} />
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 8 }}>
                    {[0, 1, 2].map((j) => {
                      const on = f >= winAt + j * 5;
                      const e = interpolate(f, [winAt + j * 5, winAt + j * 5 + 6], [2, 1], { ...clamp, easing: Easing.out(Easing.back(2)) });
                      return <div key={j} style={{ opacity: on ? 1 : 0, transform: `scale(${e}) rotate(${-6 + j * 4}deg)`, padding: "6px 18px", border: `4px solid ${BUFF}`, borderRadius: 8, background: `${BUFF}1c`, color: BUFF, fontFamily: BODY, fontWeight: 900, fontSize: 34, letterSpacing: 2 }}>VITÓRIA</div>;
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
      {/* seta riscada até o avatar dele na coluna do TikTok (~ y 760), no "me segue aqui" */}
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, opacity: tip(1).i * (1 - tip(1).o) }}>
        <path d="M 760 1010 C 900 990, 950 900, 965 800" fill="none" stroke={WHITE} strokeWidth={10} strokeLinecap="round" strokeDasharray="420" strokeDashoffset={420 * (1 - arrow)} />
        <path d="M 935 826 L 966 790 L 996 830" fill="none" stroke={WHITE} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" opacity={arrow > 0.95 ? 1 : 0} />
      </svg>
    </AbsoluteFill>
  );
};
