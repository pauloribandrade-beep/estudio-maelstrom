import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, Loop, OffthreadVideo, staticFile, useCurrentFrame } from "remotion";
import { loadFont as loadTitle } from "@remotion/google-fonts/AlegreyaSans";
import { loadFont as loadBody } from "@remotion/google-fonts/NunitoSans";
import CL from "./clips.json";
import { LiteCtx } from "../../lib/sfx-ctx";
import LITE from "./clips_lite.json";
import ML from "./memes.json";

// "Magia do Deadlock" (06/11): mesma linguagem do patch (jogo limpo em tela cheia, sem nada por cima; números em telas
// separadas na paleta roxa da interface do Deadlock; memes em tela cheia). Zona segura do TikTok: tudo entre y 180 e
// 1290, nada importante à direita de 930 entre y 700 e 1550; legenda fixa em 1370.

const { fontFamily: TITLE } = loadTitle("normal", { weights: ["700", "800", "900"], subsets: ["latin", "latin-ext"] });
const { fontFamily: BODY } = loadBody("normal", { weights: ["600", "700", "800", "900"], subsets: ["latin", "latin-ext"] });
const R = "videos/2026-11-06_deadlock-magia_R/";
const DLP = "videos/2026-11-05_deadlock-patch-celeste_R/dl/";
const FPS = 30;
const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
const ease = (f: number, a: number, n = 10) => interpolate(f, [a, a + n], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
const back = (f: number, a: number, n = 10, s = 1.8) => interpolate(f - a, [0, n], [0, 1], { ...clamp, easing: Easing.out(Easing.back(s)) });
const outF = (f: number, life: number, n = 6) => interpolate(f, [life - n, life], [1, 0], clamp);

const PANEL = "linear-gradient(180deg, #312a3b 0%, #27212f 100%)";
const EDGE = "#4d4259";
const TAB = "#8e6fd8";
const TILE = "#201b27";
const TILE_HI = "linear-gradient(180deg, #3d2f58 0%, #31264a 100%)";
const WHITE = "#f5f1fa";
const LABEL = "#d6cee2";
const MUTED = "#9b90aa";
const SPIRIT = "#b58cff";
const RED = "#ff6a5c";
const GREEN = "#6fe08c";
const GOLD = "#ffd27a";
const SL = 80, SR = 150, W1 = 1080 - SL - SR;

const card = (n: string) => staticFile(`${DLP}${n}_card.png`);
const render = (n: string) => staticFile(`${DLP}${n}_Render.png`);

// ---------- fundo das telas: névoa roxa + faíscas (com arte do herói desfocada, se tiver) ----------
const Bg: React.FC<{ hero?: string; tint?: string }> = ({ hero, tint = "#6b4bb8" }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#120f16", overflow: "hidden" }}>
      {hero ? (
        <AbsoluteFill style={{ transform: `scale(${1.08 + f * 0.0006})`, transformOrigin: "50% 30%" }}>
          <Img src={render(hero)} style={{ position: "absolute", left: -260, top: -80, width: 1600, height: 1400, objectFit: "cover", objectPosition: "50% 20%", filter: "blur(10px) brightness(0.4)" }} />
        </AbsoluteFill>
      ) : null}
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 90% 60% at 50% 38%, ${tint}40 0%, rgba(0,0,0,0) 70%)` }} />
      {Array.from({ length: 14 }).map((_, i) => {
        const x = ((i * 211) % 980) + 50;
        const y = 1900 - ((f * (1.2 + (i % 5) * 0.35) + i * 150) % 1900);
        return <div key={i} style={{ position: "absolute", left: x, top: y, width: 6 + (i % 3) * 3, height: 6 + (i % 3) * 3, borderRadius: "50%", background: i % 4 ? SPIRIT : GOLD, opacity: 0.13 + (i % 4) * 0.05, filter: "blur(1px)" }} />;
      })}
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(18,15,22,0.2) 0%, rgba(18,15,22,0.5) 50%, #120f16 85%)" }} />
    </AbsoluteFill>
  );
};

// painel com a aba inclinada, igual ao tooltip do jogo
const Panel: React.FC<{ kicker?: string; title?: string; tab?: string; children?: React.ReactNode; style?: React.CSSProperties; pad?: string }> = ({ kicker, title, tab = TAB, children, style, pad = "30px 34px 34px" }) => (
  <div style={{ position: "relative", ...style }}>
    <div style={{ position: "absolute", left: -10, top: -18, width: 320, height: 110, background: tab, transform: "rotate(-2.5deg)", borderRadius: 4 }} />
    <div style={{ position: "relative", background: PANEL, border: `2px solid ${EDGE}`, borderRadius: 6, padding: pad, boxShadow: "0 30px 80px rgba(0,0,0,0.6)" }}>
      {kicker ? <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 28, letterSpacing: 6, color: SPIRIT }}>{kicker}</div> : null}
      {title ? <div style={{ fontFamily: TITLE, fontWeight: 900, fontSize: 78, lineHeight: 1.02, color: WHITE, marginBottom: 20 }}>{title}</div> : null}
      {children}
    </div>
  </div>
);

const Head: React.FC<{ kicker?: string; title: string; f: number; y?: number; size?: number; color?: string }> = ({ kicker, title, f, y = 190, size = 92, color = WHITE }) => {
  const a = back(f, 0, 12, 1.5);
  return (
    <div style={{ position: "absolute", left: SL, right: SR, top: y, textAlign: "center", opacity: Math.min(1, a * 1.4), transform: `translateY(${(1 - a) * -40}px)` }}>
      {kicker ? <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 30, letterSpacing: 8, color: SPIRIT }}>{kicker}</div> : null}
      <div style={{ fontFamily: TITLE, fontWeight: 900, fontSize: size, color, lineHeight: 1.02, textShadow: "0 6px 30px rgba(0,0,0,0.6)" }}>{title}</div>
    </div>
  );
};

const fmt = (n: number, dec = 0) => n.toLocaleString("pt-BR", { minimumFractionDigits: dec, maximumFractionDigits: dec });

// ---------- gameplay em tela cheia (limpo) ----------
const Clip: React.FC<{ clip: string; ss?: number; rate?: number; life: number; pos?: string }> = ({ clip, ss = 0, rate = 1, life, pos = "50% 50%" }) => {
  const len = (CL as Record<string, number>)[clip] ?? 3;
  const loopF = Math.max(1, Math.floor(((len - ss) / rate) * FPS) - 1);
  const lite = React.useContext(LiteCtx);
  const v = <OffthreadVideo src={staticFile(`${R}${lite && (LITE as string[]).includes(clip) ? "clips_lite" : "clips"}/${clip}.mp4`)} muted startFrom={Math.round(ss * FPS)} playbackRate={rate} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: pos }} />;
  return life > loopF ? <Loop durationInFrames={loopF}>{v}</Loop> : v;
};
export const MGShot: React.FC<{ life: number; clip: string; ss?: number; rate?: number; pos?: string; z0?: number; z1?: number; origin?: string }> = ({ life, clip, ss, rate, pos, z0 = 1, z1 = 1.08, origin = "50% 50%" }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${interpolate(f, [0, life], [z0, z1], clamp)})`, transformOrigin: origin }}>
        <Clip clip={clip} ss={ss} rate={rate} life={life} pos={pos} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------- meme em tela cheia ----------
export const MGMeme: React.FC<{ life: number; m: string; ss?: number; rate?: number; z0?: number; z1?: number }> = ({ life, m, ss = 0, rate = 1, z0 = 1, z1 = 1.06 }) => {
  const f = useCurrentFrame();
  const len = (ML as Record<string, number>)[m] ?? 3;
  const loopF = Math.max(1, Math.floor(((len - ss) / rate) * FPS) - 1);
  const v = <OffthreadVideo src={staticFile(`${R}memes/${m}.mp4`)} muted startFrom={Math.round(ss * FPS)} playbackRate={rate} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />;
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${interpolate(f, [0, life], [z0, z1], clamp)})` }}>{life > loopF ? <Loop durationInFrames={loopF}>{v}</Loop> : v}</AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------- gancho: os três jogos caindo e o Deadlock no lugar ----------
// cada jogo entra no nome dele (gameAt), leva um X e escorrega; no "Deadlock"/"um jogo" (dlAt) sobe o card do Deadlock
// com o selo "nem foi lançado" (notAt).
type Game = { name: string; c: string; at: number };
export const MGHook: React.FC<{ life: number; games: Game[]; dlAt?: number; notAt?: number }> = ({ life, games, dlAt = 120, notAt = 160 }) => {
  const f = useCurrentFrame();
  const dl = back(f, dlAt, 12, 1.4);
  const not = interpolate(f, [notAt, notAt + 6], [2.2, 1], { ...clamp, easing: Easing.out(Easing.back(2)) });
  return (
    <AbsoluteFill style={{ opacity: outF(f, life) }}>
      <Bg tint={f >= dlAt ? "#7a4fd8" : "#3a3346"} />
      <div style={{ position: "absolute", left: SL, width: W1, top: 200, display: "flex", flexDirection: "column", gap: 22 }}>
        {games.map((g, i) => {
          const e = back(f, g.at, 10, 1.6);
          const x = ease(f, g.at + 8, 8);
          const gone = ease(f, dlAt - 2, 12);
          return (
            <div key={g.name} style={{ position: "relative", height: 150, borderRadius: 8, background: TILE, border: `3px solid ${g.c}`, display: "flex", alignItems: "center", padding: "0 36px", opacity: Math.min(1, e * 1.5) * (1 - 0.65 * gone), transform: `translateX(${(1 - e) * -200 - gone * 40}px) scale(${1 - 0.12 * gone})`, transformOrigin: "0% 50%" }}>
              <div style={{ width: 22, height: 90, borderRadius: 4, background: g.c, marginRight: 30 }} />
              <div style={{ fontFamily: TITLE, fontWeight: 900, fontSize: 82, color: WHITE, lineHeight: 1 }}>{g.name}</div>
              <svg width={130} height={130} viewBox="0 0 40 40" style={{ position: "absolute", right: 30, top: 10, opacity: x }}>
                <path d="M6 6 L34 34" stroke={RED} strokeWidth={6} strokeLinecap="round" strokeDasharray="40" strokeDashoffset={40 * (1 - x)} />
                <path d="M34 6 L6 34" stroke={RED} strokeWidth={6} strokeLinecap="round" strokeDasharray="40" strokeDashoffset={40 * (1 - ease(f, g.at + 12, 8))} />
              </svg>
            </div>
          );
        })}
      </div>
      {f >= dlAt - 1 ? (
        <div style={{ position: "absolute", left: SL, width: W1, top: 330, height: 900, opacity: Math.min(1, dl * 1.5), transform: `translateY(${(1 - dl) * 260}px) scale(${0.85 + 0.15 * dl})` }}>
          <div style={{ position: "absolute", inset: 0, borderRadius: 10, overflow: "hidden", border: `4px solid ${SPIRIT}`, boxShadow: "0 0 80px rgba(181,140,255,0.5), 0 40px 90px rgba(0,0,0,0.7)" }}>
            <Img src={card("Rat_King")} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 20%" }} />
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "45%", background: "linear-gradient(180deg, rgba(18,15,22,0), rgba(18,15,22,0.95))" }} />
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 50, textAlign: "center", fontFamily: TITLE, fontWeight: 900, fontSize: 140, color: WHITE, lineHeight: 1, textShadow: "0 8px 30px rgba(0,0,0,0.8)" }}>Deadlock</div>
          </div>
          {f >= notAt ? (
            <div style={{ position: "absolute", right: -10, top: 50, transform: `rotate(8deg) scale(${not})`, padding: "14px 26px", border: `6px solid ${GOLD}`, borderRadius: 10, background: "rgba(18,15,22,0.85)", color: GOLD, fontFamily: BODY, fontWeight: 900, fontSize: 44, letterSpacing: 3, whiteSpace: "nowrap" }}>NEM FOI LANÇADO</div>
          ) : null}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ---------- página da Steam: só por convite + desenvolvimento inicial ----------
export const MGSteam: React.FC<{ life: number; inviteAt?: number; devAt?: number }> = ({ life, inviteAt = 40, devAt = 110 }) => {
  const f = useCurrentFrame();
  const a = back(f, 0, 12, 1.4);
  const bar = interpolate(f, [devAt, devAt + 30], [0, 0.12], { ...clamp, easing: Easing.out(Easing.cubic) });
  const stamp = (t: number) => interpolate(f, [t, t + 6], [2.2, 1], { ...clamp, easing: Easing.out(Easing.back(2)) });
  return (
    <AbsoluteFill style={{ opacity: outF(f, life) }}>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, #1b2838 0%, #0f1822 100%)" }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 80% 50% at 50% 35%, rgba(102,192,244,0.18) 0%, rgba(0,0,0,0) 70%)" }} />
      <div style={{ position: "absolute", left: SL, width: W1, top: 200, opacity: Math.min(1, a * 1.4), transform: `translateY(${(1 - a) * 60}px)` }}>
        <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 28, letterSpacing: 6, color: "#66c0f4" }}>LOJA STEAM</div>
        <div style={{ marginTop: 14, height: 470, borderRadius: 6, overflow: "hidden", position: "relative", border: "2px solid #2a475e" }}>
          <Img src={render("Rat_King")} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 18%" }} />
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "55%", background: "linear-gradient(180deg, rgba(15,24,34,0), rgba(15,24,34,0.95))" }} />
          <div style={{ position: "absolute", left: 30, bottom: 24, fontFamily: TITLE, fontWeight: 900, fontSize: 110, color: WHITE, lineHeight: 1 }}>Deadlock</div>
        </div>
        <div style={{ marginTop: 26, display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ position: "relative", padding: "24px 28px", background: "#16202d", border: "2px solid #2a475e", borderRadius: 6, opacity: ease(f, inviteAt - 3, 8) }}>
            <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 30, color: "#8f98a0" }}>Como jogar</div>
            <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 8, transform: `scale(${f >= inviteAt ? stamp(inviteAt) : 1})`, transformOrigin: "0% 50%" }}>
              <svg width={58} height={46} viewBox="0 0 29 23"><rect x={1.5} y={1.5} width={26} height={20} rx={3} fill="none" stroke={GOLD} strokeWidth={3} /><path d="M2 3 L14.5 13 L27 3" fill="none" stroke={GOLD} strokeWidth={3} /></svg>
              <span style={{ fontFamily: TITLE, fontWeight: 900, fontSize: 64, color: GOLD }}>Só por convite</span>
            </div>
          </div>
          <div style={{ padding: "24px 28px", background: "#16202d", border: "2px solid #2a475e", borderRadius: 6, opacity: ease(f, devAt - 3, 8) }}>
            <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 30, color: "#8f98a0" }}>Status</div>
            <div style={{ fontFamily: TITLE, fontWeight: 900, fontSize: 58, color: "#66c0f4", marginTop: 6, transform: `scale(${f >= devAt ? stamp(devAt) : 1})`, transformOrigin: "0% 50%" }}>Em desenvolvimento inicial</div>
            <div style={{ marginTop: 18, height: 22, background: "#0c131b", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ width: `${bar * 100}%`, height: "100%", background: "linear-gradient(90deg, #417a9b, #66c0f4)" }} />
            </div>
            <div style={{ marginTop: 8, fontFamily: BODY, fontWeight: 800, fontSize: 26, color: "#8f98a0" }}>pronto: {Math.round(bar * 100)}%</div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- recorde: barras de jogadores ao mesmo tempo ----------
type Bar = { name: string; v: number; at: number; c: string; note?: string };
export const MGRecord: React.FC<{ life: number; kicker?: string; title: string; bars: Bar[]; max: number; unit?: string; tagAt?: number; tag?: string; hero?: string }> = ({ life, kicker, title, bars, max, unit = "mil", tagAt, tag, hero }) => {
  const f = useCurrentFrame();
  const H = 640;
  return (
    <AbsoluteFill style={{ opacity: outF(f, life) }}>
      <Bg hero={hero} tint="#6b4bb8" />
      <Head kicker={kicker} title={title} f={f} size={80} />
      <div style={{ position: "absolute", left: SL, width: W1, top: 450, height: H + 120, display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 70 }}>
        {bars.map((b, i) => {
          const g = interpolate(f, [b.at, b.at + 26], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
          const h = (b.v / max) * H * g;
          return (
            <div key={i} style={{ width: 300, display: "flex", flexDirection: "column", alignItems: "center", opacity: ease(f, b.at - 4, 6) }}>
              <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 76, color: b.c, lineHeight: 1, marginBottom: 14, textShadow: `0 0 30px ${b.c}55` }}>{fmt(b.v * g)} <span style={{ fontSize: 40 }}>{unit}</span></div>
              <div style={{ width: 240, height: h, borderRadius: "8px 8px 0 0", background: `linear-gradient(180deg, ${b.c} 0%, ${b.c}66 100%)`, boxShadow: `0 0 40px ${b.c}44` }} />
              <div style={{ marginTop: 16, fontFamily: TITLE, fontWeight: 900, fontSize: 54, color: WHITE, lineHeight: 1, textAlign: "center" }}>{b.name}</div>
              {b.note ? <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 28, color: MUTED, marginTop: 6, textAlign: "center" }}>{b.note}</div> : null}
            </div>
          );
        })}
      </div>
      {tag && tagAt !== undefined && f >= tagAt ? (
        <div style={{ position: "absolute", left: SL, width: W1, top: 330, textAlign: "center" }}>
          <span style={{ display: "inline-block", transform: `rotate(-4deg) scale(${interpolate(f, [tagAt, tagAt + 6], [2, 1], { ...clamp, easing: Easing.out(Easing.back(2)) })})`, padding: "10px 24px", border: `5px solid ${GOLD}`, borderRadius: 10, color: GOLD, fontFamily: BODY, fontWeight: 900, fontSize: 40, letterSpacing: 3, background: "rgba(18,15,22,0.8)" }}>{tag}</span>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ---------- loja de skins fechada + Valve faturando zero ----------
// lockAt: cadeado na loja; modAt: o card de skin vira "MOD" (feita por fã); zeroAt: contador de faturamento = US$ 0.
export const MGShop: React.FC<{ life: number; lockAt?: number; modAt?: number; zeroAt?: number }> = ({ life, lockAt = 20, modAt = 120, zeroAt = 300 }) => {
  const f = useCurrentFrame();
  const a = back(f, 0, 12, 1.4);
  const lock = back(f, lockAt, 10, 2.2);
  const mod = back(f, modAt, 10, 1.6);
  const zero = back(f, zeroAt, 12, 1.6);
  const shopOut = ease(f, zeroAt - 4, 10);
  const shake = f >= lockAt && f < lockAt + 8 ? Math.sin(f * 3) * (lockAt + 8 - f) * 1.4 : 0;
  return (
    <AbsoluteFill style={{ opacity: outF(f, life) }}>
      <Bg tint={f >= zeroAt ? "#b0403a" : "#6b4bb8"} />
      <div style={{ position: "absolute", left: SL, width: W1, top: 210, opacity: Math.min(1, a * 1.4) * (1 - shopOut), transform: `translateY(${(1 - a) * 60 - shopOut * 80}px) translateX(${shake}px)` }}>
        <Panel kicker="LOJA DO DEADLOCK" title="Skins">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
            {["Rat_King", "Celeste", "Apollo", "Baba", "Mo_Krill", "Nurse_Harrow"].map((h, i) => (
              <div key={h} style={{ position: "relative", height: 300, borderRadius: 6, overflow: "hidden", border: `2px solid ${i === 0 && f >= modAt ? GOLD : "#2f2838"}`, background: TILE }}>
                <Img src={card(h)} style={{ width: "100%", height: "100%", objectFit: "cover", filter: i === 0 && f >= modAt ? undefined : `grayscale(${lock}) brightness(${1 - 0.55 * lock})` }} />
                <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "8px 0", textAlign: "center", background: "rgba(18,15,22,0.85)", fontFamily: BODY, fontWeight: 900, fontSize: 26, color: i === 0 && f >= modAt ? GOLD : MUTED }}>{i === 0 && f >= modAt ? "MOD DE FÃ" : "indisponível"}</div>
              </div>
            ))}
          </div>
          {f >= modAt ? (
            <div style={{ position: "absolute", left: 40, top: 160, transform: `rotate(-8deg) scale(${0.6 + 0.4 * mod})`, opacity: Math.min(1, mod * 1.5), padding: "8px 20px", border: `5px solid ${GOLD}`, borderRadius: 8, color: GOLD, fontFamily: BODY, fontWeight: 900, fontSize: 38, background: "rgba(18,15,22,0.9)", whiteSpace: "nowrap" }}>NÃO É DA VALVE</div>
          ) : null}
        </Panel>
        {f >= lockAt ? (
          <div style={{ position: "absolute", left: "50%", top: 380, transform: `translateX(-50%) scale(${lock})`, width: 220, height: 220, borderRadius: "50%", background: "rgba(18,15,22,0.92)", border: `5px solid ${RED}`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 50px ${RED}66`, opacity: 1 - mod * 0.85 }}>
            <svg width={110} height={120} viewBox="0 0 22 24"><rect x={2} y={10} width={18} height={13} rx={2.5} fill={RED} /><path d="M6 10 V7 a5 5 0 0 1 10 0 V10" fill="none" stroke={RED} strokeWidth={2.8} /></svg>
          </div>
        ) : null}
      </div>
      {f >= zeroAt - 4 ? (
        <div style={{ position: "absolute", left: SL, width: W1, top: 330, textAlign: "center", opacity: Math.min(1, zero * 1.4), transform: `scale(${0.7 + 0.3 * zero})` }}>
          <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 32, letterSpacing: 8, color: RED }}>A VALVE FATUROU COM O JOGO</div>
          <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 250, color: WHITE, lineHeight: 1.05, textShadow: `0 0 60px ${RED}55` }}>US$ 0</div>
          <div style={{ fontFamily: TITLE, fontWeight: 900, fontSize: 64, color: LABEL }}>nem um centavo</div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ---------- gráfico caindo (pico → hoje) ----------
export const MGDrop: React.FC<{ life: number; kicker?: string; title: string; peak: number; pct: number; peakAt?: number; dropAt?: number; unit?: string; c?: string }> = ({ life, kicker, title, peak, pct, peakAt = 30, dropAt = 120, unit = "mil", c = "#e23b3b" }) => {
  const f = useCurrentFrame();
  const up = interpolate(f, [4, peakAt + 6], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const dn = interpolate(f, [dropAt, dropAt + 34], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const W = W1, H = 620;
  // curva: sobe até o pico (40% da largura) e desce até -pct
  const pts: [number, number][] = [];
  const N = 60;
  for (let i = 0; i <= N; i++) {
    const x = i / N;
    let y: number;
    if (x <= 0.4) y = 0.12 + 0.88 * Math.pow(x / 0.4, 1.6);
    else y = 1 - (pct / 100) * Math.min(1, ((x - 0.4) / 0.6) * 1.3) + Math.sin(i * 1.7) * 0.015;
    pts.push([x, Math.max(0, Math.min(1, y))]);
  }
  const prog = 0.4 * up + 0.6 * dn;
  const vis = pts.filter(([x]) => x <= prog + 1e-6);
  const d = vis.map(([x, y], i) => `${i ? "L" : "M"} ${(x * W).toFixed(1)} ${(H - y * H).toFixed(1)}`).join(" ");
  const last = vis[vis.length - 1] ?? [0, 0];
  const cur = Math.round(peak * last[1]);
  return (
    <AbsoluteFill style={{ opacity: outF(f, life) }}>
      <Bg tint={f >= dropAt ? "#b0403a" : "#6b4bb8"} />
      <Head kicker={kicker} title={title} f={f} size={86} />
      <div style={{ position: "absolute", left: SL, top: 470, width: W, height: H }}>
        {[0.25, 0.5, 0.75, 1].map((g) => <div key={g} style={{ position: "absolute", left: 0, right: 0, top: H - g * H, height: 2, background: "rgba(214,206,226,0.12)" }} />)}
        <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <path d={`${d} L ${(last[0] * W).toFixed(1)} ${H} L 0 ${H} Z`} fill={`${c}33`} />
          <path d={d} fill="none" stroke={c} strokeWidth={9} strokeLinejoin="round" strokeLinecap="round" />
          <circle cx={last[0] * W} cy={H - last[1] * H} r={14} fill={WHITE} stroke={c} strokeWidth={6} />
        </svg>
        {f >= peakAt ? (
          <div style={{ position: "absolute", left: 0.4 * W - 170, top: -110, width: 340, textAlign: "center", opacity: ease(f, peakAt, 8), transform: `scale(${back(f, peakAt, 9, 2)})` }}>
            <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 70, color: WHITE, lineHeight: 1 }}>{fmt(peak)} {unit}</div>
            <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 26, letterSpacing: 4, color: MUTED }}>PICO NA STEAM</div>
          </div>
        ) : null}
      </div>
      {f >= dropAt + 20 ? (
        <div style={{ position: "absolute", left: SL, width: W1, top: 1130, textAlign: "center" }}>
          <span style={{ display: "inline-block", transform: `scale(${interpolate(f, [dropAt + 20, dropAt + 26], [2, 1], { ...clamp, easing: Easing.out(Easing.back(2)) })})`, fontFamily: BODY, fontWeight: 900, fontSize: 120, color: c, textShadow: `0 0 40px ${c}66` }}>−{pct}%</span>
          <span style={{ marginLeft: 20, fontFamily: BODY, fontWeight: 800, fontSize: 40, color: LABEL }}>≈ {fmt(cur)} {unit}</span>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ---------- manchete / fala de alguém (fonte em cima, frase grande, linhas extra no tempo) ----------
type Line = { t: string; at: number; c?: string; big?: boolean };
export const MGNews: React.FC<{ life: number; source: string; date?: string; head: string; lines?: Line[]; tint?: string; hero?: string; quote?: boolean }> = ({ life, source, date, head, lines = [], tint = "#6b4bb8", hero, quote = false }) => {
  const f = useCurrentFrame();
  const a = back(f, 0, 12, 1.4);
  const words = head.split(" ");
  return (
    <AbsoluteFill style={{ opacity: outF(f, life) }}>
      <Bg tint={tint} hero={hero} />
      <div style={{ position: "absolute", left: SL, width: W1, top: 260, opacity: Math.min(1, a * 1.4), transform: `translateY(${(1 - a) * 80}px)` }}>
        <Panel pad="40px 40px 44px">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 34, letterSpacing: 5, color: SPIRIT }}>{source}</div>
            {date ? <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 28, color: MUTED }}>{date}</div> : null}
          </div>
          <div style={{ fontFamily: TITLE, fontWeight: 900, fontSize: 94, lineHeight: 1.06, color: WHITE }}>
            {quote ? <span style={{ color: SPIRIT }}>“</span> : null}
            {words.map((w, i) => {
              const e = ease(f, 4 + i * 1.6, 6);
              return <span key={i} style={{ opacity: e, display: "inline-block", transform: `translateY(${(1 - e) * 18}px)`, marginRight: i < words.length - 1 ? 22 : 0 }}>{w}{quote && i === words.length - 1 ? <span style={{ color: SPIRIT }}>”</span> : null}</span>;
            })}
          </div>
          {lines.map((l, i) => {
            const e = ease(f, l.at, 9);
            return f >= l.at - 1 ? (
              <div key={i} style={{ marginTop: 26, padding: "22px 26px", background: i % 2 ? TILE : TILE_HI, border: "2px solid #3b3148", borderLeft: `8px solid ${l.c ?? SPIRIT}`, borderRadius: 4, opacity: e, transform: `translateX(${(1 - e) * -100}px)`, fontFamily: l.big ? TITLE : BODY, fontWeight: 900, fontSize: l.big ? 76 : 54, color: l.c ?? WHITE, lineHeight: 1.12 }}>{l.t}</div>
            ) : null;
          })}
        </Panel>
      </div>
    </AbsoluteFill>
  );
};

// ---------- a mistura: cada jogo entra como ingrediente e todos viram o Deadlock ----------
type Ing = { name: string; what: string; c: string; at: number };
export const MGMix: React.FC<{ life: number; title?: string; items: Ing[]; mixAt?: number }> = ({ life, title = "A receita", items, mixAt = 9999 }) => {
  const f = useCurrentFrame();
  const mix = ease(f, mixAt, 16);
  const res = back(f, mixAt + 10, 12, 1.5);
  const n = items.length;
  return (
    <AbsoluteFill style={{ opacity: outF(f, life) }}>
      <Bg tint="#7a4fd8" />
      <Head kicker="A MAGIA DO DEADLOCK" title={title} f={f} size={86} />
      {items.map((it, i) => {
        const e = back(f, it.at, 10, 1.7);
        const col = i % 2, row = Math.floor(i / 2);
        const x0 = SL + col * (W1 / 2 + 10), y0 = 430 + row * 250;
        const x = x0 + (SL + W1 / 2 - 210 - x0) * mix, y = y0 + (760 - y0) * mix;
        return (
          <div key={it.name} style={{ position: "absolute", left: x, top: y, width: W1 / 2 - 10, height: 220, borderRadius: 8, background: TILE_HI, border: `3px solid ${it.c}`, boxShadow: `0 0 30px ${it.c}33`, padding: "26px 28px", opacity: Math.min(1, e * 1.5) * (1 - mix), transform: `scale(${(0.7 + 0.3 * e) * (1 - 0.5 * mix)})` }}>
            <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 28, letterSpacing: 4, color: it.c }}>{it.what}</div>
            <div style={{ fontFamily: TITLE, fontWeight: 900, fontSize: n > 4 ? 66 : 76, color: WHITE, lineHeight: 1.05, marginTop: 8 }}>{it.name}</div>
          </div>
        );
      })}
      {f >= mixAt ? (
        <div style={{ position: "absolute", left: SL + 80, width: W1 - 160, top: 470, height: 760, opacity: Math.min(1, res * 1.5), transform: `scale(${0.6 + 0.4 * res})` }}>
          <div style={{ position: "absolute", inset: 0, borderRadius: 10, overflow: "hidden", border: `4px solid ${SPIRIT}`, boxShadow: "0 0 90px rgba(181,140,255,0.55)" }}>
            <Img src={card("Apollo")} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 15%" }} />
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "40%", background: "linear-gradient(180deg, rgba(18,15,22,0), rgba(18,15,22,0.95))" }} />
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 40, textAlign: "center", fontFamily: TITLE, fontWeight: 900, fontSize: 120, color: WHITE, lineHeight: 1 }}>Deadlock</div>
          </div>
          {items.map((it, i) => {
            const ang = (i / n) * Math.PI * 2 - Math.PI / 2;
            const e = back(f, mixAt + 16 + i * 3, 9, 2);
            return <div key={i} style={{ position: "absolute", left: "50%", top: "50%", transform: `translate(-50%, -50%) translate(${Math.cos(ang) * 380}px, ${Math.sin(ang) * 420}px) scale(${e})`, padding: "6px 16px", borderRadius: 999, background: it.c, color: "#120f16", fontFamily: BODY, fontWeight: 900, fontSize: 30, whiteSpace: "nowrap" }}>{it.name}</div>;
          })}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ---------- ficha: duas colunas de itens que acendem na fala ----------
type Chk = { t: string; at: number };
type Col = { head: string; c: string; items: Chk[] };
export const MGSheet: React.FC<{ life: number; kicker?: string; title: string; cols: Col[]; stampAt?: number; stamp?: string }> = ({ life, kicker, title, cols, stampAt, stamp }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ opacity: outF(f, life) }}>
      <Bg tint="#6b4bb8" />
      <Head kicker={kicker} title={title} f={f} size={84} />
      <div style={{ position: "absolute", left: SL, width: W1, top: 430, display: "flex", gap: 24 }}>
        {cols.map((c, j) => (
          <div key={j} style={{ flex: 1, opacity: ease(f, (c.items[0]?.at ?? 0) - 6, 8) }}>
            <div style={{ padding: "12px 0", textAlign: "center", background: c.c, color: "#120f16", fontFamily: BODY, fontWeight: 900, fontSize: 32, letterSpacing: 3, borderRadius: "6px 6px 0 0" }}>{c.head}</div>
            <div style={{ background: PANEL, border: `2px solid ${EDGE}`, borderTop: "none", borderRadius: "0 0 6px 6px", padding: "18px 18px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
              {c.items.map((it, i) => {
                const on = f >= it.at;
                const e = back(f, it.at, 8, 2.2);
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 16, padding: cols.length > 2 ? "22px 14px" : "28px 20px", borderRadius: 4, background: on ? TILE_HI : TILE, border: `2px solid ${on ? c.c : "#2f2838"}`, transform: `scale(${on ? 0.92 + 0.08 * e : 0.96})`, opacity: on ? 1 : 0.45 }}>
                    <svg width={44} height={36} viewBox="0 0 34 28" style={{ opacity: on ? 1 : 0.2, flexShrink: 0 }}><path d="M3 15 L12 24 L31 4" fill="none" stroke={on ? GREEN : MUTED} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="44" strokeDashoffset={44 * (1 - ease(f, it.at, 7))} /></svg>
                    <span style={{ fontFamily: TITLE, fontWeight: 900, fontSize: cols.length > 2 ? 54 : 66, color: on ? WHITE : MUTED, lineHeight: 1 }}>{it.t}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {stamp && stampAt !== undefined && f >= stampAt ? (
        <div style={{ position: "absolute", left: SL, width: W1, top: 1130, textAlign: "center" }}>
          <span style={{ display: "inline-block", transform: `rotate(-3deg) scale(${interpolate(f, [stampAt, stampAt + 6], [2, 1], { ...clamp, easing: Easing.out(Easing.back(2)) })})`, padding: "10px 26px", border: `5px solid ${GOLD}`, borderRadius: 10, color: GOLD, fontFamily: BODY, fontWeight: 900, fontSize: 46, background: "rgba(18,15,22,0.85)", whiteSpace: "nowrap" }}>{stamp}</span>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ---------- relógio da partida: 5 a 10 minutos e o jogo já decidido ----------
export const MGClock: React.FC<{ life: number; runAt?: number; doneAt?: number; teamAt?: number }> = ({ life, runAt = 10, doneAt = 80, teamAt = 150 }) => {
  const f = useCurrentFrame();
  const sec = interpolate(f, [runAt, doneAt], [0, 600], { ...clamp, easing: Easing.in(Easing.quad) });
  const mm = Math.floor(sec / 60), ss = Math.floor(sec % 60);
  const zone = sec >= 300;
  const done = f >= doneAt;
  const team = back(f, teamAt, 12, 1.5);
  return (
    <AbsoluteFill style={{ opacity: outF(f, life) }}>
      <Bg tint={zone ? "#b0403a" : "#6b4bb8"} />
      <div style={{ position: "absolute", left: SL, width: W1, top: 230, textAlign: "center", opacity: 1 - 0.5 * ease(f, teamAt, 8) }}>
        <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 32, letterSpacing: 8, color: zone ? RED : SPIRIT }}>TEMPO DE PARTIDA</div>
        <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 250, color: WHITE, lineHeight: 1, fontVariantNumeric: "tabular-nums", textShadow: zone ? `0 0 60px ${RED}66` : "0 0 50px rgba(181,140,255,0.4)" }}>{String(mm).padStart(2, "0")}:{String(ss).padStart(2, "0")}</div>
        <div style={{ margin: "26px auto 0", width: W1 - 40, height: 40, borderRadius: 6, background: TILE, border: "2px solid #2f2838", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", left: "50%", right: 0, top: 0, bottom: 0, background: `${RED}33` }} />
          <div style={{ width: `${(sec / 600) * 100}%`, height: "100%", background: zone ? RED : SPIRIT }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", width: W1 - 40, margin: "8px auto 0", fontFamily: BODY, fontWeight: 800, fontSize: 28, color: MUTED }}><span>0 min</span><span>5 min</span><span>10 min</span></div>
        {done ? <div style={{ marginTop: 40, display: "inline-block", transform: `rotate(-4deg) scale(${interpolate(f, [doneAt, doneAt + 6], [2.2, 1], { ...clamp, easing: Easing.out(Easing.back(2)) })})`, padding: "12px 28px", border: `6px solid ${RED}`, borderRadius: 10, color: RED, fontFamily: BODY, fontWeight: 900, fontSize: 58, letterSpacing: 3, background: "rgba(18,15,22,0.85)" }}>JOGO DECIDIDO</div> : null}
      </div>
      {f >= teamAt ? (
        <div style={{ position: "absolute", left: SL, width: W1, top: 900, display: "flex", justifyContent: "center", gap: 26, opacity: Math.min(1, team * 1.5), transform: `translateY(${(1 - team) * 80}px)` }}>
          <div style={{ padding: "22px 30px", borderRadius: 8, background: TILE, border: "3px solid #3b3148", textAlign: "center" }}>
            <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 28, color: MUTED }}>VOCÊ</div>
            <div style={{ fontFamily: TITLE, fontWeight: 900, fontSize: 70, color: MUTED, lineHeight: 1, textDecoration: "line-through" }}>decide</div>
          </div>
          <div style={{ padding: "22px 30px", borderRadius: 8, background: TILE_HI, border: `3px solid ${RED}`, textAlign: "center", boxShadow: `0 0 30px ${RED}44` }}>
            <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 28, color: RED }}>O TIME</div>
            <div style={{ fontFamily: TITLE, fontWeight: 900, fontSize: 70, color: WHITE, lineHeight: 1 }}>decide</div>
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ---------- placar de alma: atrás → top de alma ----------
export const MGSouls: React.FC<{ life: number; behindAt?: number; topAt?: number; itemsAt?: number }> = ({ life, behindAt = 10, topAt = 120, itemsAt = 260 }) => {
  const f = useCurrentFrame();
  const g = interpolate(f, [topAt, topAt + 40], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const rows = [
    { name: "Rat King", me: true, a: 9.2, b: 27.4 },
    { name: "Haze", me: false, a: 18.6, b: 25.1, kills: "12 abates" },
    { name: "Seven", me: false, a: 16.1, b: 21.9, kills: "10 abates" },
    { name: "Kelvin", me: false, a: 12.4, b: 16.3 },
  ];
  const vals = rows.map((r) => r.a + (r.b - r.a) * g);
  const order = vals.map((v, i) => [v, i] as [number, number]).sort((x, y) => y[0] - x[0]).map((x) => x[1]);
  const max = 30;
  return (
    <AbsoluteFill style={{ opacity: outF(f, life) }}>
      <Bg hero="Rat_King" tint="#6b4bb8" />
      <Head kicker="PLACAR · ALMAS" title={f >= topAt + 30 ? "Top de alma" : "Atrás no jogo"} f={f} size={86} color={f >= topAt + 30 ? GREEN : WHITE} />
      <div style={{ position: "absolute", left: SL, width: W1, top: 440, height: 600, opacity: ease(f, behindAt - 6, 8) }}>
        {rows.map((r, i) => {
          const pos = order.indexOf(i);
          const v = vals[i];
          return (
            <div key={r.name} style={{ position: "absolute", left: 0, right: 0, top: pos * 140, height: 120, display: "flex", alignItems: "center", gap: 18, padding: "0 20px", borderRadius: 6, background: r.me ? TILE_HI : TILE, border: `3px solid ${r.me ? GOLD : "#2f2838"}` }}>
              <div style={{ width: 56, fontFamily: BODY, fontWeight: 900, fontSize: 44, color: r.me ? GOLD : MUTED }}>{pos + 1}º</div>
              <div style={{ width: 250 }}>
                <div style={{ fontFamily: TITLE, fontWeight: 900, fontSize: 46, color: WHITE, lineHeight: 1 }}>{r.name}</div>
                {r.kills ? <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 24, color: RED }}>{r.kills}</div> : r.me ? <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 24, color: GOLD }}>você</div> : null}
              </div>
              <div style={{ flex: 1, height: 30, borderRadius: 4, background: "#17131c", overflow: "hidden" }}>
                <div style={{ width: `${(v / max) * 100}%`, height: "100%", background: r.me ? `linear-gradient(90deg, #6e4fc0, ${GOLD})` : "linear-gradient(90deg, #4d3684, #8e6fd8)" }} />
              </div>
              <div style={{ width: 120, textAlign: "right", fontFamily: BODY, fontWeight: 900, fontSize: 40, color: r.me ? GOLD : LABEL }}>{fmt(v, 1)}k</div>
            </div>
          );
        })}
      </div>
      {f >= itemsAt ? (
        <div style={{ position: "absolute", left: SL, width: W1, top: 1080, textAlign: "center" }}>
          <span style={{ display: "inline-block", transform: `scale(${back(f, itemsAt, 9, 2)})`, padding: "10px 26px", border: `5px solid ${GREEN}`, borderRadius: 10, color: GREEN, fontFamily: BODY, fontWeight: 900, fontSize: 44, background: "rgba(18,15,22,0.85)" }}>sem ficar atrás de itens</span>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ---------- dono da Valve: pizza (Gabe > metade, resto dos funcionários) + investidor ligando, recusado ----------
export const MGOwner: React.FC<{ life: number; gabeAt?: number; staffAt?: number; callAt?: number; noAt?: number }> = ({ life, gabeAt = 30, staffAt = 80, callAt = 120, noAt = 170 }) => {
  const f = useCurrentFrame();
  const g = interpolate(f, [gabeAt, gabeAt + 24], [0, 0.52], { ...clamp, easing: Easing.out(Easing.cubic) });
  const s = interpolate(f, [staffAt, staffAt + 20], [0, 0.48], { ...clamp, easing: Easing.out(Easing.cubic) });
  const R0 = 230, C0 = 2 * Math.PI * R0;
  const call = back(f, callAt, 10, 1.6);
  const ring = f >= callAt && f < noAt ? Math.sin(f * 2.4) * 6 : 0;
  const no = f >= noAt;
  return (
    <AbsoluteFill style={{ opacity: outF(f, life) }}>
      <Bg tint="#6b4bb8" />
      <Head kicker="QUEM MANDA NA VALVE" title="Empresa privada" f={f} size={88} />
      <div style={{ position: "absolute", left: SL, width: W1, top: 410, display: "flex", alignItems: "center", gap: 30, opacity: 1 - 0.55 * ease(f, callAt, 8) }}>
        <svg width={520} height={520} viewBox="0 0 520 520" style={{ flexShrink: 0 }}>
          <circle cx={260} cy={260} r={R0} fill="none" stroke="#221d29" strokeWidth={90} />
          <circle cx={260} cy={260} r={R0} fill="none" stroke={GOLD} strokeWidth={90} strokeDasharray={`${C0 * g} ${C0}`} transform="rotate(-90 260 260)" />
          <circle cx={260} cy={260} r={R0} fill="none" stroke={SPIRIT} strokeWidth={90} strokeDasharray={`${C0 * s} ${C0}`} strokeDashoffset={-C0 * 0.52} transform="rotate(-90 260 260)" />
          <text x={260} y={250} textAnchor="middle" fill={WHITE} style={{ fontFamily: BODY, fontWeight: 900, fontSize: 64 }}>{f >= gabeAt ? "+50%" : ""}</text>
          <text x={260} y={300} textAnchor="middle" fill={GOLD} style={{ fontFamily: BODY, fontWeight: 800, fontSize: 30 }}>{f >= gabeAt ? "Gabe Newell" : ""}</text>
        </svg>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ opacity: ease(f, gabeAt, 8) }}><div style={{ width: 40, height: 14, background: GOLD, borderRadius: 3 }} /><div style={{ fontFamily: TITLE, fontWeight: 900, fontSize: 46, color: WHITE, lineHeight: 1.05 }}>Gabe<br />Newell</div></div>
          <div style={{ opacity: ease(f, staffAt, 8) }}><div style={{ width: 40, height: 14, background: SPIRIT, borderRadius: 3 }} /><div style={{ fontFamily: TITLE, fontWeight: 900, fontSize: 46, color: WHITE, lineHeight: 1.05 }}>funcionários</div></div>
          <div style={{ opacity: ease(f, staffAt + 10, 8) }}><div style={{ width: 40, height: 14, background: "#3b3148", borderRadius: 3 }} /><div style={{ fontFamily: TITLE, fontWeight: 900, fontSize: 46, color: MUTED, lineHeight: 1.05 }}>bolsa: 0%</div></div>
        </div>
      </div>
      {f >= callAt ? (
        <div style={{ position: "absolute", left: SL + 110, width: W1 - 220, top: 950, opacity: Math.min(1, call * 1.5), transform: `translateY(${(1 - call) * 120}px) rotate(${ring * 0.3}deg)` }}>
          <div style={{ borderRadius: 34, background: "linear-gradient(180deg, #2d2636, #1c1822)", border: `3px solid ${no ? RED : EDGE}`, padding: "30px 30px 34px", textAlign: "center", boxShadow: "0 30px 70px rgba(0,0,0,0.6)" }}>
            <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 28, color: MUTED }}>{no ? "chamada recusada" : "chamada recebida…"}</div>
            <div style={{ fontFamily: TITLE, fontWeight: 900, fontSize: 64, color: WHITE, lineHeight: 1.05, marginTop: 6 }}>Investidor</div>
            <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 30, color: LABEL, marginTop: 4 }}>“cadê o resultado do trimestre?”</div>
            <div style={{ display: "flex", justifyContent: "center", gap: 70, marginTop: 26 }}>
              <div style={{ width: 110, height: 110, borderRadius: "50%", background: RED, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${no ? 1.15 : 1})`, boxShadow: no ? `0 0 40px ${RED}` : undefined }}>
                <svg width={56} height={56} viewBox="0 0 24 24"><path d="M3 15c5-5 13-5 18 0l-2.5 2.5-3.5-1.5v-3a12 12 0 0 0-6 0v3L5.5 17.5z" fill={WHITE} /></svg>
              </div>
              <div style={{ width: 110, height: 110, borderRadius: "50%", background: no ? "#2f2838" : GREEN, opacity: no ? 0.4 : 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width={52} height={52} viewBox="0 0 24 24"><path d="M5 3l4 1 1.5 4.5-2.5 1.5a11 11 0 0 0 6 6l1.5-2.5L20 15l1 4c-1 1.5-3 2-5 1.5C10 19 5 14 3.5 8 3 6 3.5 4 5 3z" fill={WHITE} /></svg>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ---------- número grande contando (US$ 5 bilhões etc.) ----------
export const MGBig: React.FC<{ life: number; kicker?: string; pre?: string; to: number; dec?: number; unit?: string; sub?: string; at?: number; subAt?: number; stamp?: string; stampAt?: number; c?: string }> = ({ life, kicker, pre = "", to, dec = 0, unit = "", sub, at = 6, subAt, stamp, stampAt, c = GREEN }) => {
  const f = useCurrentFrame();
  const v = interpolate(f, [at, at + 34], [0, to], { ...clamp, easing: Easing.out(Easing.cubic) });
  const a = back(f, at, 12, 1.5);
  return (
    <AbsoluteFill style={{ opacity: outF(f, life) }}>
      <Bg tint="#5d3fa8" />
      {/* moedas subindo */}
      {f >= at ? Array.from({ length: 18 }).map((_, i) => {
        const x = ((i * 157) % 900) + 60;
        const y = 1500 - ((f - at) * (5 + (i % 4) * 2) + i * 90) % 1500;
        return <div key={i} style={{ position: "absolute", left: x, top: y, width: 40, height: 40, borderRadius: "50%", background: `radial-gradient(circle at 35% 35%, #fff2c2, ${GOLD} 55%, #b8862e)`, opacity: 0.18 + (i % 3) * 0.08, transform: `scaleX(${Math.abs(Math.cos((f + i * 7) * 0.12))})` }} />;
      }) : null}
      <div style={{ position: "absolute", left: SL, width: W1, top: 360, textAlign: "center", opacity: Math.min(1, a * 1.4), transform: `scale(${0.7 + 0.3 * a})` }}>
        {kicker ? <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 32, letterSpacing: 8, color: SPIRIT }}>{kicker}</div> : null}
        <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 200, color: WHITE, lineHeight: 1.05, fontVariantNumeric: "tabular-nums", textShadow: `0 0 70px ${c}55` }}>{pre}{fmt(v, dec)}</div>
        <div style={{ fontFamily: TITLE, fontWeight: 900, fontSize: 96, color: c, lineHeight: 1 }}>{unit}</div>
        {sub && (subAt === undefined || f >= subAt) ? <div style={{ marginTop: 30, fontFamily: TITLE, fontWeight: 900, fontSize: 60, color: LABEL, opacity: ease(f, subAt ?? at, 8) }}>{sub}</div> : null}
      </div>
      {stamp && stampAt !== undefined && f >= stampAt ? (
        <div style={{ position: "absolute", left: SL, width: W1, top: 1010, textAlign: "center" }}>
          <span style={{ display: "inline-block", transform: `rotate(-3deg) scale(${interpolate(f, [stampAt, stampAt + 6], [2, 1], { ...clamp, easing: Easing.out(Easing.back(2)) })})`, padding: "12px 28px", border: `6px solid ${GOLD}`, borderRadius: 10, color: GOLD, fontFamily: BODY, fontWeight: 900, fontSize: 52, background: "rgba(18,15,22,0.85)", whiteSpace: "nowrap" }}>{stamp}</span>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ---------- calendário: jan/fev riscados → +1 ano = mais foda ----------
export const MGCal: React.FC<{ life: number; janAt?: number; fevAt?: number; yearAt?: number; fodaAt?: number }> = ({ life, janAt = 30, fevAt = 50, yearAt = 120, fodaAt = 170 }) => {
  const f = useCurrentFrame();
  const a = back(f, 0, 12, 1.4);
  const months = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
  const fill = interpolate(f, [yearAt, yearAt + 40], [0, 12], clamp);
  return (
    <AbsoluteFill style={{ opacity: outF(f, life) }}>
      <Bg tint="#6b4bb8" />
      <Head kicker="LANÇAMENTO OFICIAL" title="Quando sai?" f={f} size={92} />
      <div style={{ position: "absolute", left: SL, width: W1, top: 440, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, opacity: Math.min(1, a * 1.4) }}>
        {months.map((m, i) => {
          const hit = (i === 0 && f >= janAt) || (i === 1 && f >= fevAt);
          const k = i === 0 ? ease(f, janAt, 6) : i === 1 ? ease(f, fevAt, 6) : 0;
          const lit = i < fill;
          return (
            <div key={m} style={{ position: "relative", height: 130, borderRadius: 6, background: lit ? TILE_HI : TILE, border: `2px solid ${hit ? RED : lit ? SPIRIT : "#2f2838"}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: BODY, fontWeight: 900, fontSize: 44, color: hit ? RED : lit ? WHITE : MUTED }}>
              {m}
              {hit ? <svg width={150} height={110} viewBox="0 0 40 30" style={{ position: "absolute" }}><path d="M5 25 L35 5" stroke={RED} strokeWidth={4} strokeLinecap="round" strokeDasharray="40" strokeDashoffset={40 * (1 - k)} /></svg> : null}
            </div>
          );
        })}
      </div>
      {f >= yearAt ? (
        <div style={{ position: "absolute", left: SL, width: W1, top: 920, textAlign: "center", opacity: ease(f, yearAt, 8) }}>
          <div style={{ fontFamily: TITLE, fontWeight: 900, fontSize: 90, color: WHITE, lineHeight: 1 }}>+1 ano</div>
          {f >= fodaAt ? <div style={{ marginTop: 18, display: "inline-block", transform: `scale(${back(f, fodaAt, 9, 2)})`, padding: "10px 26px", border: `5px solid ${GREEN}`, borderRadius: 10, color: GREEN, fontFamily: BODY, fontWeight: 900, fontSize: 48, background: "rgba(18,15,22,0.85)" }}>= jogo mais foda ainda</div> : null}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ---------- espera do Half-Life 3: contador de anos + medidor de Hopium ----------
export const MGWait: React.FC<{ life: number; countAt?: number; hopeAt?: number; dlAt?: number }> = ({ life, countAt = 20, hopeAt = 9999, dlAt = 9999 }) => {
  const f = useCurrentFrame();
  const yrs = Math.round(interpolate(f, [countAt, countAt + 50], [0, 19], { ...clamp, easing: Easing.out(Easing.quad) }));
  const hope = f < hopeAt ? 0.2 : 0.2 + 0.75 * (0.5 + 0.5 * Math.sin((f - hopeAt) * 0.09));
  const dl = back(f, dlAt, 12, 1.5);
  return (
    <AbsoluteFill style={{ opacity: outF(f, life) }}>
      <Bg tint="#c86b1e" />
      <div style={{ position: "absolute", left: SL, width: W1, top: 220, textAlign: "center", opacity: 1 - 0.6 * ease(f, dlAt, 8) }}>
        <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 32, letterSpacing: 8, color: "#ff9a3c" }}>ESPERANDO HALF-LIFE 3</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 34, marginTop: 10 }}>
          <svg width={170} height={170} viewBox="0 0 100 100"><circle cx={50} cy={50} r={44} fill="none" stroke="#ff9a3c" strokeWidth={7} /><path d="M30 78 L48 40 L44 30 L34 30 L34 22 L50 22 L70 78 L60 78 L50 52 L40 78 Z" fill="#ff9a3c" /></svg>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 210, color: WHITE, lineHeight: 0.95, fontVariantNumeric: "tabular-nums" }}>{yrs}</div>
            <div style={{ fontFamily: TITLE, fontWeight: 900, fontSize: 56, color: "#ffc08a", lineHeight: 1 }}>anos desde o<br />Episode Two</div>
          </div>
        </div>
        <div style={{ marginTop: 60, fontFamily: BODY, fontWeight: 800, fontSize: 30, letterSpacing: 6, color: MUTED }}>NÍVEL DE HOPIUM</div>
        <div style={{ margin: "14px auto 0", width: W1 - 60, height: 64, borderRadius: 8, background: TILE, border: "3px solid #3b3148", overflow: "hidden" }}>
          <div style={{ width: `${hope * 100}%`, height: "100%", background: "linear-gradient(90deg, #8a4a1a, #ff9a3c, #ffe0a0)", boxShadow: "0 0 30px rgba(255,154,60,0.6)" }} />
        </div>
      </div>
      {f >= dlAt ? (
        <div style={{ position: "absolute", left: SL, width: W1, top: 860, textAlign: "center", opacity: Math.min(1, dl * 1.5), transform: `translateY(${(1 - dl) * 100}px)` }}>
          <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 32, letterSpacing: 6, color: SPIRIT }}>DEADLOCK · LANÇAMENTO</div>
          <div style={{ fontFamily: TITLE, fontWeight: 900, fontSize: 86, color: WHITE, lineHeight: 1.05 }}>+1 ano, 1 ano e meio?</div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ---------- próximo vídeo: "como eu faria Half-Life 3" (2 h) no TikTok e YouTube ----------
export const MGNext: React.FC<{ life: number; durAt?: number; platAt?: number }> = ({ life, durAt = 40, platAt = 9999 }) => {
  const f = useCurrentFrame();
  const a = back(f, 0, 12, 1.4);
  const p = back(f, platAt, 10, 1.8);
  return (
    <AbsoluteFill style={{ opacity: outF(f, life) }}>
      <Bg tint="#c86b1e" />
      <div style={{ position: "absolute", left: SL, width: W1, top: 220, opacity: Math.min(1, a * 1.4), transform: `translateY(${(1 - a) * 80}px)` }}>
        <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 32, letterSpacing: 8, color: "#ff9a3c", textAlign: "center", marginBottom: 20 }}>EM PRODUÇÃO</div>
        <div style={{ position: "relative", height: 500, borderRadius: 10, overflow: "hidden", border: "3px solid #ff9a3c", background: "radial-gradient(ellipse at 50% 40%, #3a2412 0%, #120d0a 75%)", boxShadow: "0 0 70px rgba(255,154,60,0.35)" }}>
          <svg width={260} height={260} viewBox="0 0 100 100" style={{ position: "absolute", left: "50%", top: 50, transform: "translateX(-50%)" }}><circle cx={50} cy={50} r={44} fill="none" stroke="#ff9a3c" strokeWidth={6} /><path d="M30 78 L48 40 L44 30 L34 30 L34 22 L50 22 L70 78 L60 78 L50 52 L40 78 Z" fill="#ff9a3c" /></svg>
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 40, textAlign: "center", fontFamily: TITLE, fontWeight: 900, fontSize: 74, color: WHITE, lineHeight: 1.05 }}>Como eu faria<br />Half-Life 3</div>
          {f >= durAt ? <div style={{ position: "absolute", right: 18, bottom: 18, padding: "6px 14px", borderRadius: 6, background: "rgba(0,0,0,0.85)", color: WHITE, fontFamily: BODY, fontWeight: 900, fontSize: 36, transform: `scale(${back(f, durAt, 8, 2.2)})` }}>2:00:00</div> : null}
        </div>
        {f >= platAt ? (
          <div style={{ display: "flex", justifyContent: "center", gap: 26, marginTop: 40, opacity: Math.min(1, p * 1.5), transform: `scale(${0.8 + 0.2 * p})` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 26px", borderRadius: 12, background: "#111", border: "2px solid #333" }}>
              <svg width={44} height={50} viewBox="0 0 24 28"><path d="M17 2c.4 3 2.4 5 5 5.3v3.6c-1.8 0-3.5-.6-5-1.6v8.2A7.5 7.5 0 1 1 9.5 10v3.8a3.8 3.8 0 1 0 3.8 3.8V2z" fill="#fff" /></svg>
              <span style={{ fontFamily: BODY, fontWeight: 900, fontSize: 42, color: WHITE }}>TikTok</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 26px", borderRadius: 12, background: "#111", border: "2px solid #333" }}>
              <svg width={62} height={44} viewBox="0 0 28 20"><rect width={28} height={20} rx={5} fill="#ff0033" /><path d="M11 5.5 L19 10 L11 14.5 Z" fill="#fff" /></svg>
              <span style={{ fontFamily: BODY, fontWeight: 900, fontSize: 42, color: WHITE }}>YouTube</span>
            </div>
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

// ---------- enquete do CTA: "e você, largou o quê?" (resposta nos comentários) ----------
export const MGPoll: React.FC<{ life: number; opts: string[]; at?: number; dlAt?: number }> = ({ life, opts, at = 10, dlAt = 9999 }) => {
  const f = useCurrentFrame();
  const a = back(f, 0, 12, 1.4);
  return (
    <AbsoluteFill style={{ opacity: outF(f, life) }}>
      <Bg tint="#7a4fd8" />
      <div style={{ position: "absolute", left: SL, width: W1, top: 220, opacity: Math.min(1, a * 1.4), transform: `translateY(${(1 - a) * 80}px)` }}>
        <Panel kicker="RESPONDE NOS COMENTÁRIOS" title="E você, largou o quê?">
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {opts.map((o, i) => {
              const e = ease(f, at + i * 5, 8);
              return (
                <div key={o} style={{ display: "flex", alignItems: "center", gap: 20, padding: "22px 24px", borderRadius: 6, background: TILE, border: "2px solid #2f2838", opacity: e, transform: `translateX(${(1 - e) * -80}px)` }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", border: `4px solid ${SPIRIT}` }} />
                  <span style={{ fontFamily: TITLE, fontWeight: 900, fontSize: 56, color: WHITE, lineHeight: 1 }}>{o}</span>
                </div>
              );
            })}
          </div>
          {f >= dlAt ? (
            <div style={{ marginTop: 26, textAlign: "center", fontFamily: TITLE, fontWeight: 900, fontSize: 64, color: SPIRIT, transform: `scale(${back(f, dlAt, 9, 2)})` }}>…pra jogar Deadlock</div>
          ) : null}
        </Panel>
      </div>
    </AbsoluteFill>
  );
};
