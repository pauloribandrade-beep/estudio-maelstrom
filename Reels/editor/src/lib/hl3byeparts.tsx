// 05/11 (ele: "o vazamento poderia ser mais elaborado" · "o inscreva-se ficou sem carinho" · "quero o Lambda no estilo de
// Half-Life"): o vazamento vira um sinal interceptado que se decodifica até o HLX escapar; o inscreva-se vira um item que o
// HEV recolhe (a vida enche, mensagens do traje); o λ é o logo (anel laranja, λ cheio) do hl3chap.
import React from "react";
import { AbsoluteFill, Easing, interpolate } from "remotion";
import { LambdaMark } from "./hl3chap";
import { FONT, MONO } from "./overlays";
import { Snd } from "./palco";

const C = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const P = (f: number, a: number, d = 12) => interpolate(f, [a, a + d], [0, 1], { ...C, easing: Easing.out(Easing.cubic) });
const OUT = (f: number, b: number, d = 12) => 1 - interpolate(f, [b, b + d], [0, 1], C);
const VIO = "#c79bff", ORANGE = "#ff9a3c", TXT = "#f2f0f7", RED = "#ff4a3a", HUD = "#ffb43c";

const Glass: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{ padding: "26px 34px", borderRadius: 18, background: "rgba(16,10,32,0.6)", backdropFilter: "blur(16px)", border: "1.5px solid rgba(199,155,255,0.45)", boxShadow: "0 30px 80px rgba(0,0,0,0.45)", ...style }}>{children}</div>
);

const GLY = "▓▒░█#@$%&*ΛΣΞ01";
const scramble = (s: string, f: number, seed = 0) =>
  s.split("").map((c, i) => (c === " " ? " " : GLY[Math.abs(Math.floor(Math.sin(Math.floor(f / 2) * 12.9898 + i * 78.233 + seed) * 43758.5453)) % GLY.length])).join("");
// o texto nasce embaralhado e vai se fixando da esquerda para a direita
const decode = (s: string, f: number, t0: number, cps = 0.9, seed = 0) => {
  if (f < t0) return "";
  const n = Math.floor((f - t0) * cps);
  return s.slice(0, Math.min(s.length, n)) + (n < s.length ? scramble(s.slice(n, Math.min(s.length, n + 6)), f, seed) : "");
};

export const ByeLambda = LambdaMark;

export const Leak: React.FC<{ f: number; leakAt: number; hlxAt: number; clipAt: number; playAt: number }> = ({ f, leakAt, hlxAt, clipAt, playAt }) => {
  const k = f - leakAt;
  const burst = Math.max(0, 1 - k / 10); // glitch de entrada
  const shake = burst * 14 * Math.sin(f * 2.7);
  const panel = P(f, leakAt + 8, 18);
  const prog = interpolate(f, [leakAt + 40, hlxAt], [0, 100], { ...C, easing: Easing.inOut(Easing.quad) });
  const hit = f >= hlxAt;
  const stamp = P(f, hlxAt, 8);
  const flash = hit ? Math.max(0, 1 - (f - hlxAt) / 9) : 0;
  const toClip = P(f, clipAt, 18); // tudo sobe e abre espaço para o trecho
  const span = Math.max(1, hlxAt - leakAt);
  const at = (x: number) => leakAt + span * x;
  const fields: [string, string, number][] = [
    ["ORIGEM", "PALESTRA AO VIVO · PLATEIA GRAVANDO", at(0.16)],
    ["QUEM", "ALGUÉM DO SOM DE HALF-LIFE", at(0.34)],
    ["CARGO", "COMPOSITOR · VALVE", at(0.52)],
  ];
  const bars = 56;
  const count = Math.max(0, Math.ceil((playAt - f) / 30));
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", transform: `translate(${shake}px, ${-shake * 0.4}px)` }}>
      <AbsoluteFill style={{ background: "repeating-linear-gradient(0deg, rgba(255,255,255,0.035) 0 2px, transparent 2px 5px)", opacity: 0.6 + burst }} />
      <AbsoluteFill style={{ background: `rgba(255,74,58,${0.25 * burst + 0.35 * flash})`, mixBlendMode: "screen" }} />

      <div style={{ position: "absolute", top: 90, left: 0, right: 0, textAlign: "center", opacity: P(f, leakAt, 8) * (1 - toClip) }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 14, padding: "10px 24px", borderRadius: 30, border: `1.5px solid ${RED}`, background: "rgba(255,74,58,0.12)", fontFamily: MONO, fontSize: 22, letterSpacing: 7, color: RED }}>
          <span style={{ width: 14, height: 14, borderRadius: 7, background: RED, opacity: Math.floor(f / 12) % 2 ? 0.25 : 1 }} />
          ENQUANTO EU EDITAVA ESTE VÍDEO
        </span>
      </div>

      <div style={{ transform: `translateY(${-170 * toClip}px) scale(${1 - 0.3 * toClip})`, opacity: (1 - 0.85 * toClip) * (hit ? 1 - 0.85 * stamp * (1 - toClip) : 1) }}>
        <Glass style={{ width: 1180, padding: "30px 40px", opacity: panel, transform: `translateY(${30 * (1 - panel)}px)` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div style={{ fontFamily: MONO, fontSize: 24, letterSpacing: 9, color: hit ? RED : VIO }}>{hit ? "▲ VAZAMENTO CONFIRMADO" : "◎ SINAL INTERCEPTADO"}</div>
            <div style={{ fontFamily: MONO, fontSize: 22, letterSpacing: 4, color: "rgba(242,240,247,0.7)" }}>DECODIFICANDO {String(Math.floor(prog)).padStart(3, "0")}%</div>
          </div>
          {/* forma de onda: é alguém do som */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, height: 110, marginTop: 18 }}>
            {Array.from({ length: bars }, (_, i) => {
              const a = 0.5 + 0.5 * Math.sin(i * 0.9 + f * 0.31) * Math.sin(i * 0.23 - f * 0.17) + 0.25 * Math.sin(f * 0.8 + i * 2.1);
              const lit = i / bars <= prog / 100;
              return <div key={i} style={{ flex: 1, height: `${12 + 88 * Math.min(1, Math.abs(a))}%`, borderRadius: 3, background: lit ? (hit ? RED : ORANGE) : "rgba(199,155,255,0.35)" }} />;
            })}
          </div>
          <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.12)", marginTop: 14, overflow: "hidden" }}>
            <div style={{ width: `${prog}%`, height: "100%", background: `linear-gradient(90deg, ${VIO}, ${hit ? RED : ORANGE})` }} />
          </div>
          <div style={{ marginTop: 22, display: "grid", gridTemplateColumns: "190px 1fr", rowGap: 12, fontFamily: MONO, fontSize: 28, letterSpacing: 4 }}>
            {fields.map(([l, v, t], i) => (
              <React.Fragment key={l}>
                <div style={{ color: "rgba(199,155,255,0.75)", opacity: f >= t - 6 ? 1 : 0 }}>{l}</div>
                <div style={{ color: TXT }}>{decode(v, f, t, 1.1, i * 7)}</div>
              </React.Fragment>
            ))}
            <div style={{ color: "rgba(199,155,255,0.75)", opacity: f >= at(0.7) - 6 ? 1 : 0 }}>ASSUNTO</div>
            <div style={{ color: hit ? RED : "rgba(242,240,247,0.55)", fontWeight: hit ? 800 : 400 }}>{hit ? "HLX" : f >= at(0.7) ? scramble("PROJETO ███", f, 3) : ""}</div>
          </div>
        </Glass>
      </div>

      {/* o carimbo */}
      {hit ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 360 - 200 * toClip, textAlign: "center", pointerEvents: "none" }}>
          <div style={{ display: "inline-block", padding: "14px 54px", border: `8px solid ${RED}`, borderRadius: 10, background: "rgba(20,4,6,0.82)", transform: `rotate(-6deg) scale(${(1.8 - 0.8 * stamp) * (1 - 0.4 * toClip)})`, opacity: stamp, boxShadow: `0 0 ${60 * (1 - toClip) + 20}px rgba(255,74,58,0.55)` }}>
            <div style={{ fontFamily: MONO, fontSize: 210, fontWeight: 800, letterSpacing: 30, color: RED, lineHeight: 1, textShadow: `${-8 * flash}px 0 #3cf, ${8 * flash}px 0 #f3c` }}>HLX</div>
          </div>
          <div style={{ marginTop: 40, fontFamily: MONO, fontSize: 26, letterSpacing: 9, color: TXT, opacity: P(f, hlxAt + 14, 12) * (1 - toClip) }}>O NOME QUE ESCAPOU NO PALCO</div>
        </div>
      ) : null}

      {/* o trecho vem aí */}
      {f >= clipAt ? (
        <div style={{ position: "absolute", top: 600, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", opacity: toClip }}>
          <div style={{ width: 120, height: 120, borderRadius: 60, border: `3px solid ${VIO}`, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(199,155,255,0.12)", boxShadow: `0 0 ${30 + 20 * Math.sin(f / 6)}px rgba(199,155,255,0.5)` }}>
            <svg width={52} height={52} viewBox="0 0 10 10"><path d="M3 1.5 L8.5 5 L3 8.5 Z" fill={TXT} /></svg>
          </div>
          <div style={{ marginTop: 22, fontFamily: MONO, fontSize: 26, letterSpacing: 9, color: TXT }}>O TRECHO · {count > 0 ? count : "▸"}</div>
        </div>
      ) : null}

      <Snd at={leakAt} name="tick" file="j30_glitch.wav" vol={0.35} />
      <Snd at={leakAt + 8} name="tick" file="hl_scanner.wav" vol={0.22} />
      {fields.map(([l, , t]) => <Snd key={l} at={t} name="tick" file="hl_blip_curto.wav" vol={0.22} />)}
      <Snd at={hlxAt} name="tick" file="hl_trava.wav" vol={0.4} />
      <Snd at={hlxAt} name="tick" file="lj_glitch.wav" vol={0.25} />
      <Snd at={clipAt} name="tick" file="hl_blip.wav" vol={0.25} />
    </AbsoluteFill>
  );
};

export const Subscribe: React.FC<{ f: number; subAt: number; bellAt: number; byeAt: number }> = ({ f, subAt, bellAt, byeAt }) => {
  const clickAt = subAt + 34;
  const subbed = f >= clickAt + 4;
  const cardIn = P(f, subAt, 16);
  // cursor entra pela direita e clica no botão
  const cx = interpolate(f, [subAt + 6, clickAt - 2], [1560, 1240], { ...C, easing: Easing.inOut(Easing.cubic) });
  const cy = interpolate(f, [subAt + 6, clickAt - 2], [860, 500], { ...C, easing: Easing.inOut(Easing.cubic) });
  const press = f >= clickAt && f < clickAt + 8 ? 0.92 : 1;
  const ring = f >= bellAt ? Math.sin((f - bellAt) / 2.2) * 24 * Math.exp(-(f - bellAt) / 30) : 0;
  const pick = P(f, clickAt + 4, 14);
  const hp = Math.round(interpolate(f, [clickAt + 4, clickAt + 40], [37, 100], { ...C, easing: Easing.out(Easing.cubic) }));
  const bk = f - clickAt;
  const msg = (t: string, t0: number) => (f >= t0 ? decode(t, f, t0, 1.6, t0) : "");
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "relative", transform: `translateY(${-60 + 30 * (1 - cardIn)}px) scale(${0.94 + 0.06 * cardIn})`, opacity: cardIn }}>
          <Glass style={{ width: 1200, display: "flex", alignItems: "center", gap: 30, padding: "30px 38px", border: subbed ? "1.5px solid rgba(255,154,60,0.75)" : undefined }}>
            <div style={{ width: 132, height: 132, borderRadius: 66, background: "#120a20", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: subbed ? `0 0 ${30 + 14 * Math.sin(f / 7)}px rgba(255,154,60,0.6)` : "none" }}>
              <LambdaMark size={112} glow={subbed ? 1 : 0.3} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: MONO, fontSize: 19, letterSpacing: 6, color: VIO, whiteSpace: "nowrap" }}>SE O VÍDEO VALEU A PENA</div>
              <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 52, letterSpacing: 2, color: TXT, marginTop: 6 }}>INSCREVA-SE</div>
            </div>
            <div style={{ padding: "20px 36px", borderRadius: 40, background: subbed ? "rgba(255,154,60,0.16)" : "#ff2a2a", border: subbed ? `2px solid ${ORANGE}` : "2px solid #ff2a2a", color: subbed ? ORANGE : "#fff", fontFamily: MONO, fontWeight: 700, fontSize: 28, letterSpacing: 4, transform: `scale(${press})`, whiteSpace: "nowrap" }}>
              {subbed ? "✓ INSCRITO" : "INSCREVER-SE"}
            </div>
            <svg width={72} height={72} viewBox="0 0 24 24" style={{ transform: `rotate(${ring}deg)`, transformOrigin: "50% 15%", opacity: P(f, bellAt - 12, 10) }}>
              <path d="M12 2a6 6 0 0 0-6 6v4l-2 3v1h16v-1l-2-3V8a6 6 0 0 0-6-6z" fill={f >= bellAt ? HUD : "none"} stroke={HUD} strokeWidth={1.4} />
              <path d="M9.5 19a2.5 2.5 0 0 0 5 0" fill="none" stroke={HUD} strokeWidth={1.4} />
            </svg>
          </Glass>
          {/* λ voando do botão quando clica */}
          {bk >= 0 && bk < 50
            ? Array.from({ length: 14 }, (_, i) => {
                const a = (i / 14) * Math.PI * 2 + 0.3;
                const r = 30 + 280 * Easing.out(Easing.cubic)(Math.min(1, bk / 40));
                return <div key={i} style={{ position: "absolute", left: 860 + Math.cos(a) * r, top: 80 + Math.sin(a) * r * 0.6, fontFamily: "Georgia, serif", fontWeight: 700, fontSize: 32, color: i % 3 ? ORANGE : HUD, opacity: 1 - bk / 50, transform: `rotate(${a * 57}deg)` }}>λ</div>;
              })
            : null}
        </div>
      </AbsoluteFill>

      {/* mensagens do HEV, como quando pega um item */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 660, textAlign: "center", fontFamily: MONO, fontSize: 26, letterSpacing: 8, color: HUD, lineHeight: 1.75, textShadow: "0 0 14px rgba(255,180,60,0.5)" }}>
        <div style={{ minHeight: 46 }}>{msg("+1 INSCRITO RECOLHIDO", clickAt + 6)}</div>
        <div style={{ minHeight: 46 }}>{msg("NOTIFICAÇÕES ATIVADAS", bellAt + 4)}</div>
        <div style={{ color: TXT, opacity: P(f, bellAt + 40, 14) }}>AINDA VEM MUITA COISA POR AÍ</div>
      </div>

      {/* HUD do traje no canto: a vida enche ao inscrever */}
      <div style={{ position: "absolute", left: 70, bottom: 60, display: "flex", alignItems: "flex-end", gap: 18, fontFamily: MONO, color: HUD, opacity: pick * OUT(f, byeAt - 10), textShadow: "0 0 16px rgba(255,180,60,0.55)" }}>
        <div style={{ fontSize: 46, marginBottom: 8, opacity: 0.85 }}>✚</div>
        <div style={{ fontSize: 86, fontWeight: 700, lineHeight: 1 }}>{hp}</div>
        <div style={{ fontSize: 22, letterSpacing: 5, marginBottom: 10 }}>VIDA</div>
      </div>

      {/* cursor */}
      {f < clickAt + 26 ? (
        <svg width={44} height={44} viewBox="0 0 24 24" style={{ position: "absolute", left: cx, top: cy, opacity: P(f, subAt + 6, 8) * OUT(f, clickAt + 14, 10), transform: `scale(${press})`, filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.6))" }}>
          <path d="M3 2 L3 20 L8 15 L11.5 22 L14.5 20.6 L11 13.8 L18 13.8 Z" fill="#fff" stroke="#111" strokeWidth={1.2} />
        </svg>
      ) : null}

      <Snd at={clickAt} name="tick" file="hl_botao_combine.wav" vol={0.35} />
      <Snd at={clickAt + 6} name="tick" file="hl_medshot.wav" vol={0.3} />
      <Snd at={bellAt} name="tick" file="ding.wav" vol={0.28} />
    </AbsoluteFill>
  );
};
