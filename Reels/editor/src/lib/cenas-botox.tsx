import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Hourglass, Syringe } from "lucide-react";
import { FONT } from "./overlays";
import { ZALE } from "./theme";
import { SEAM, Snd, SndSpan, STAGE } from "./palco";

import { TX } from "./textos";
// CENAS DE METÁFORA do vídeo "o botox nasceu de uma salsicha estragada" (história; padrão aprovado em
// 2026-09-28: objeto reconhecível + ação física em cada fala). Fio condutor: O MESMO FRASCO, que nasce da
// salsicha, ganha o rótulo Oculinum, troca para Botox e no fim entra numa caixa premium ("o que mudou foi o
// que fizeram com ele"). Todo evento visível tem um som discreto (regra do usuário, 2026-09-28).

const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
export const CX = 540;
export const CY = (STAGE.y0 + STAGE.y1) / 2;
export const SERIF = "Georgia, 'Times New Roman', serif";
const HAND = "'Segoe Print', 'Bradley Hand', 'Comic Sans MS', cursive";
const SEPIA = "#efe2c4";
const INK = "#3b2a17";
export const sp = (f: number, fps: number, at = 0, k = { damping: 15, stiffness: 170, mass: 0.8 }) => (f < at ? 0 : spring({ frame: f - at, fps, config: k }));
export const lock = (p: number) => (p > 0.997 ? 1 : p);
export const ease = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });

export const Stage: React.FC<{ life: number; children: (f: number, fps: number) => React.ReactNode }> = ({ life, children }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const out = interpolate(f, [life - 7, life], [1, 0], { ...clamp, easing: Easing.in(Easing.cubic) });
  return <AbsoluteFill style={{ height: SEAM, opacity: out, fontFamily: FONT, overflow: "hidden" }}>{children(f, fps)}</AbsoluteFill>;
};
export const Float: React.FC<{ f: number; amp?: number; children: React.ReactNode }> = ({ f, amp = 6, children }) => (
  <div style={{ position: "absolute", inset: 0, transform: `translate3d(0, ${(Math.sin(f / 24) * amp).toFixed(3)}px, 0)`, willChange: "transform", backfaceVisibility: "hidden" }}>{children}</div>
);
const Typed: React.FC<{ text: string; f: number; at: number; dur: number }> = ({ text, f, at, dur }) => {
  const n = Math.round(interpolate(f, [at, at + dur], [0, text.length], clamp));
  return (
    <>
      {text.slice(0, n)}
      <span style={{ opacity: 0 }}>{text.slice(n)}</span>
    </>
  );
};
export const Pill: React.FC<{ text: string; top: number; on: number; red?: boolean; size?: number }> = ({ text, top, on, red = true, size = 44 }) => (
  <div style={{ position: "absolute", left: 0, right: 0, top, textAlign: "center", opacity: on, transform: `translateY(${(1 - on) * 14}px) scale(${0.9 + 0.1 * lock(on)})` }}>
    <span style={{ background: red ? ZALE.red : "rgba(255,255,255,0.12)", color: "#fff", fontSize: size, fontWeight: 900, padding: "10px 26px", borderRadius: 14 }}>{text}</span>
  </div>
);

// ---------- o frasco (fio condutor) ----------
export const Vial: React.FC<{ w: number; label?: string; label2?: string; peel?: number; liquid?: string; glow?: number }> = ({ w, label, label2, peel = 0, liquid = "#b9e3ff", glow = 0 }) => {
  const h = w * 2.1;
  return (
    <div style={{ position: "relative", width: w, height: h, filter: glow ? `drop-shadow(0 0 ${(30 * glow).toFixed(1)}px rgba(255,220,150,${(0.8 * glow).toFixed(2)}))` : undefined }}>
      <svg width={w} height={h} viewBox="0 0 100 210" style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="vglass" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="rgba(255,255,255,0.55)" />
            <stop offset="0.35" stopColor="rgba(255,255,255,0.12)" />
            <stop offset="1" stopColor="rgba(255,255,255,0.4)" />
          </linearGradient>
        </defs>
        <rect x={30} y={4} width={40} height={26} rx={5} fill="#9aa3ad" />
        <rect x={26} y={26} width={48} height={10} rx={3} fill="#c9d0d6" />
        <path d="M34 36 L34 54 Q10 66 10 92 L10 192 Q10 206 24 206 L76 206 Q90 206 90 192 L90 92 Q90 66 66 54 L66 36 Z" fill="url(#vglass)" stroke="rgba(255,255,255,0.8)" strokeWidth={2.5} />
        <path d="M13 140 L87 140 L87 192 Q87 203 76 203 L24 203 Q13 203 13 192 Z" fill={liquid} opacity={0.75} />
        <rect x={18} y={72} width={8} height={110} rx={4} fill="rgba(255,255,255,0.45)" />
      </svg>
      {label ? (
        <div style={{ position: "absolute", left: w * 0.1, right: w * 0.1, top: h * 0.46, height: h * 0.2, borderRadius: 6, overflow: "hidden" }}>
          {label2 ? (
            <div style={{ position: "absolute", inset: 0, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", color: ZALE.red, fontWeight: 900, fontSize: w * 0.17, letterSpacing: 1 }}>{label2}</div>
          ) : null}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "#f1e6c8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: INK,
              fontFamily: SERIF,
              fontWeight: 700,
              fontSize: Math.min(w * 0.14, (w * 0.95) / Math.max(1, label.length * 0.62)), // palavra longa (OCULINUM) cabe no frasco pequeno
              transformOrigin: "100% 0%",
              transform: `rotate(${(peel * -70).toFixed(1)}deg) translate(${(peel * 20).toFixed(1)}px, ${(peel * -10).toFixed(1)}px)`,
              opacity: 1 - Math.max(0, peel - 0.7) / 0.3,
              boxShadow: peel > 0 ? "0 6px 12px rgba(0,0,0,0.35)" : undefined,
            }}
          >
            {label}
          </div>
        </div>
      ) : null}
    </div>
  );
};

// ============ 2. "força de expressão" -> fato histórico ============
export const QuoteDrop: React.FC<{ life: number; phrase: string; dropAt: number; result: string }> = ({ life, phrase, dropAt, result }) => (
  <Stage life={life}>
    {(f, fps) => {
      const on = sp(f, fps);
      const fall = interpolate(f, [dropAt, dropAt + 16], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
      const strike = interpolate(f, [dropAt + 6, dropAt + 14], [0, 1], clamp);
      const res = sp(f, fps, dropAt + 12, { damping: 11, stiffness: 200, mass: 0.7 });
      const q = (side: -1 | 1) => (
        <span style={{ display: "inline-block", color: ZALE.redBright, fontSize: 150, fontFamily: SERIF, lineHeight: 0.6, transform: `translate(${(fall * side * 40).toFixed(1)}px, ${(fall * 700).toFixed(1)}px) rotate(${(fall * side * 80).toFixed(1)}deg)`, opacity: 1 - fall * 0.6 }}>
          {side < 0 ? "“" : "”"}
        </span>
      );
      return (
        <Float f={f}>
          <div style={{ position: "absolute", left: 0, right: 0, top: CY - 150, textAlign: "center", opacity: on }}>
            {q(-1)}
            <span style={{ position: "relative", color: `rgba(255,255,255,${1 - strike * 0.55})`, fontSize: 84, fontWeight: 900, letterSpacing: -2, margin: "0 12px" }}>
              {phrase}
              {/* risco só aparece quando começa a riscar (antes ficava uma bolinha de 12 px do lado do F) */}
              <span style={{ position: "absolute", left: -6, top: "55%", height: 10, width: `calc(${(strike * 100).toFixed(1)}% + 12px)`, background: ZALE.red, borderRadius: 5, opacity: strike > 0.01 ? 1 : 0 }} />
            </span>
            {q(1)}
          </div>
          <Pill text={result} top={CY + 60} on={res} size={62} />
          <Snd at={dropAt} name="tick" k="quotes-fall" />
          <Snd at={dropAt + 12} name="confirm" v={0} />
        </Float>
      );
    }}
  </Stage>
);

// ============ 3. jornal antigo ============
export const OldNewspaper: React.FC<{ life: number; date: string; dateAt?: number; headline: string; headAt: number; headDur?: number; sub?: string; subAt?: number; imageAt?: number; caption?: string }> = ({ life, date, dateAt = 6, headline, headAt, headDur = 45, sub, subAt, imageAt, caption }) => (
  <Stage life={life}>
    {(f, fps) => {
      const on = sp(f, fps, 0, { damping: 13, stiffness: 120, mass: 0.9 });
      const z = interpolate(f, [0, life], [1, 1.08], clamp);
      const head = sp(f, fps, headAt);
      const s2 = subAt !== undefined ? sp(f, fps, subAt) : 0;
      const W = 820;
      return (
        <Float f={f} amp={4}>
          <div style={{ position: "absolute", left: CX - W / 2, top: 180, width: W, height: 700, background: SEPIA, color: INK, fontFamily: SERIF, padding: "34px 44px", boxShadow: "0 36px 90px rgba(0,0,0,0.65)", transform: `rotate(-2deg) scale(${(z * (0.8 + 0.2 * lock(on))).toFixed(4)})`, opacity: Math.min(1, on * 2), backgroundImage: "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.35), transparent 60%), radial-gradient(circle at 80% 90%, rgba(120,80,30,0.25), transparent 55%)" }}>
            <div style={{ textAlign: "center", fontSize: 64, fontWeight: 900, letterSpacing: 3, borderBottom: `4px double ${INK}`, paddingBottom: 10 }}>O NOTICIÁRIO</div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24, padding: "8px 0", borderBottom: `2px solid ${INK}`, opacity: sp(f, fps, dateAt) }}>
              <span>{date}</span>
              <span>edição extra</span>
            </div>
            {/* manchete datilografada letra a letra (máquina de escrever), no ritmo da fala */}
            <div style={{ fontSize: 58, fontWeight: 900, lineHeight: 1.05, marginTop: 28, opacity: f >= headAt ? 1 : 0 }}>
              <Typed text={headline} f={f} at={headAt} dur={headDur} />
            </div>
            {sub ? <div style={{ fontSize: 34, fontStyle: "italic", marginTop: 20, opacity: s2 }}>{sub}</div> : null}
            {/* espaço de foto do jornal: a salsicha "imprime" nele quando ele fala "salsicha" */}
            <div style={{ display: "flex", gap: 26, marginTop: 24 }}>
              <div style={{ flex: "none", width: 350 }}>
                <div style={{ position: "relative", width: 350, height: 210, border: `3px solid ${INK}`, background: "repeating-linear-gradient(45deg, rgba(59,42,23,0.08) 0 3px, transparent 3px 8px)", overflow: "hidden" }}>
                  {imageAt !== undefined ? (
                    (() => {
                      const im = sp(f, fps, imageAt, { damping: 13, stiffness: 160, mass: 0.8 });
                      return (
                        <div style={{ position: "absolute", inset: 0, opacity: Math.min(1, im * 1.5), transform: `scale(${(0.85 + 0.15 * lock(im)).toFixed(4)})`, filter: "sepia(1) contrast(1.15)" }}>
                          <svg width={344} height={204} viewBox="0 0 660 260">
                            <defs>
                              <pattern id="hatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
                                <line x1="0" y1="0" x2="0" y2="10" stroke="rgba(40,25,10,0.45)" strokeWidth="3" />
                              </pattern>
                            </defs>
                            <ellipse cx={330} cy={225} rx={290} ry={20} fill="rgba(40,25,10,0.35)" />
                            <path d="M70 150 C70 70 150 60 330 70 C510 60 590 70 590 150 C590 210 520 215 330 210 C140 215 70 210 70 150 Z" fill="#7a5436" stroke="#2b1a0c" strokeWidth={8} />
                            <path d="M70 150 C70 70 150 60 330 70 C510 60 590 70 590 150 C590 210 520 215 330 210 C140 215 70 210 70 150 Z" fill="url(#hatch)" />
                            <path d="M110 130 C130 95 200 90 330 96 C460 90 530 95 550 130" stroke="rgba(255,240,210,0.55)" strokeWidth={12} fill="none" strokeLinecap="round" />
                            <path d="M60 150 L28 132 M60 150 L28 168 M600 150 L632 132 M600 150 L632 168" stroke="#2b1a0c" strokeWidth={10} strokeLinecap="round" />
                          </svg>
                        </div>
                      );
                    })()
                  ) : null}
                </div>
                {caption ? <div style={{ fontSize: 22, fontStyle: "italic", marginTop: 6, opacity: imageAt !== undefined && f >= imageAt ? 1 : 0 }}>{caption}</div> : null}
              </div>
              <div style={{ flex: 1, display: "grid", gap: 22, alignContent: "start", opacity: 0.35, paddingTop: 6 }}>
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} style={{ height: 12, background: INK, borderRadius: 3, width: `${72 + ((i * 37) % 28)}%` }} />
                ))}
              </div>
            </div>
          </div>
          <Snd at={1} name="news" v={0} />
          <SndSpan at={headAt} dur={headDur} name="typew" vol={0.3} />
          {imageAt !== undefined ? <Snd at={imageAt} name="click" v={1} vol={0.35} /> : null}
          {subAt !== undefined ? <Snd at={subAt} name="tick" k="sub" /> : null}
        </Float>
      );
    }}
  </Stage>
);

// ============ 4. retrato em moldura ============
export const PortraitFrame: React.FC<{ life: number; src: string; name: string; sub?: string; nameAt?: number; focus?: [number, number]; credit?: string }> = ({ life, src, name, sub, nameAt = 10, focus = [50, 30], credit }) => (
  <Stage life={life}>
    {(f, fps) => {
      const on = sp(f, fps, 0, { damping: 13, stiffness: 120, mass: 0.9 });
      const nm = sp(f, fps, nameAt);
      const z = interpolate(f, [0, life], [1.02, 1.12], clamp);
      return (
        <Float f={f}>
          <div style={{ position: "absolute", left: CX - 250, top: 180, width: 500, height: 600, padding: 26, background: "linear-gradient(135deg,#b8892f,#f3d27a 40%,#8a6420 70%,#e6c068)", borderRadius: 14, boxShadow: "0 36px 90px rgba(0,0,0,0.7)", opacity: Math.min(1, on * 2), transform: `scale(${0.85 + 0.15 * lock(on)})` }}>
            <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", boxShadow: "inset 0 0 30px rgba(0,0,0,0.6)" }}>
              <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `${focus[0]}% ${focus[1]}%`, transform: `scale(${z})`, transformOrigin: `${focus[0]}% ${focus[1]}%`, filter: "sepia(0.25)" }} />
              {credit ? <div style={{ position: "absolute", right: 8, bottom: 6, color: "rgba(255,255,255,0.6)", fontSize: 14 }}>{credit}</div> : null}
            </div>
          </div>
          <div style={{ position: "absolute", left: CX - 230, top: 800, width: 460, textAlign: "center", background: "linear-gradient(135deg,#c79a3c,#f4d98a,#a57b2c)", borderRadius: 10, padding: "12px 10px", color: "#2b1d08", fontFamily: SERIF, opacity: nm, transform: `translateY(${(1 - nm) * 20}px)`, boxShadow: "0 12px 30px rgba(0,0,0,0.5)" }}>
            <div style={{ fontSize: 40, fontWeight: 700 }}>{name}</div>
            {sub ? <div style={{ fontSize: 24, fontStyle: "italic" }}>{sub}</div> : null}
          </div>
          <Snd at={2} name="pop" k="frame-in" />
          <Snd at={nameAt} name="ding" k="name-plate" vol={0.3} />
        </Float>
      );
    }}
  </Stage>
);

// ============ 5. fichas de casos + contador ============
export const CaseFiles: React.FC<{ life: number; to: number; countAt: number; dur?: number; label?: string; labelAt?: number }> = ({ life, to, countAt, dur = 30, label, labelAt }) => (
  <Stage life={life}>
    {(f, fps) => {
      // UMA lista de tempos para tudo (pedido do Paulo: o som descolava): cada ficha cai num instante, o número
      // sobe junto com ela e o tique toca no quadro em que ela pousa na pilha.
      const N = 8;
      const LAND = 4; // quadros até a ficha pousar
      const times = Array.from({ length: N }, (_, i) => countAt + Math.round((dur * i) / (N - 1)));
      let k = -1;
      for (let i = 0; i < N; i++) if (f >= times[i] + LAND) k = i;
      const n = k < 0 ? 0 : Math.round((to * (k + 1)) / N);
      const lb = labelAt !== undefined ? sp(f, fps, labelAt) : 0;
      const pop = k >= 0 ? 1 + 0.08 * Math.max(0, 1 - (f - times[k] - LAND) / 5) : 1;
      return (
        <Float f={f} amp={4}>
          {times.map((t, i) => {
            const fall = interpolate(f, [t, t + LAND], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
            return (
              <div key={i} style={{ position: "absolute", left: CX - 260 + ((i * 53) % 90) - 45, top: 330 - i * 14, width: 520, height: 300, background: SEPIA, borderRadius: 8, boxShadow: "0 16px 40px rgba(0,0,0,0.5)", transform: `rotate(${((i * 7) % 11) - 5}deg) translateY(${((1 - fall) * -320).toFixed(1)}px)`, opacity: f >= t ? 1 : 0, padding: "22px 30px", fontFamily: HAND, color: INK, fontSize: 34 }}>
                caso nº {Math.round((to * (i + 1)) / N)}
                <div style={{ marginTop: 16, height: 6, width: "80%", background: "rgba(59,42,23,0.3)", borderRadius: 3 }} />
                <div style={{ marginTop: 16, height: 6, width: "60%", background: "rgba(59,42,23,0.3)", borderRadius: 3 }} />
                <div style={{ marginTop: 16, height: 6, width: "70%", background: "rgba(59,42,23,0.3)", borderRadius: 3 }} />
              </div>
            );
          })}
          <div style={{ position: "absolute", left: 0, right: 0, top: 690, textAlign: "center", opacity: k >= 0 ? 1 : 0 }}>
            <span style={{ display: "inline-block", color: "#fff", fontSize: 130, fontWeight: 900, letterSpacing: -4, fontVariantNumeric: "tabular-nums", transform: `scale(${pop.toFixed(3)})` }}>{n}</span>
            <span style={{ color: "rgba(255,255,255,0.75)", fontSize: 50, fontWeight: 800, marginLeft: 14 }}>casos</span>
          </div>
          {label ? <Pill text={label} top={870} on={lb} /> : null}
          {times.map((t, i) => (
            <Snd key={i} at={t + LAND} name="tick" v={i % 2 ? 4 : 0} vol={0.16 + 0.06 * (i / (N - 1))} />
          ))}
          {labelAt !== undefined ? <Snd at={labelAt} name="pop" k="label" vol={0.3} /> : null}
        </Float>
      );
    }}
  </Stage>
);

// ============ 6. placa de pedra: BOTULUS -> botulismo ============
export const StoneTablet: React.FC<{ life: number; top: string; topAt: number; word: string; wordAt: number; meaning: string; meaningAt: number }> = ({ life, top, topAt, word, wordAt, meaning, meaningAt }) => (
  <Stage life={life}>
    {(f, fps) => {
      const tp = sp(f, fps, topAt);
      const carve = interpolate(f, [wordAt, wordAt + 18], [0, 1], clamp);
      const tab = sp(f, fps, wordAt - 6, { damping: 13, stiffness: 120, mass: 0.9 });
      const mn = sp(f, fps, meaningAt, { damping: 11, stiffness: 200, mass: 0.7 });
      const arrow = interpolate(f, [wordAt + 16, wordAt + 26], [0, 1], clamp);
      return (
        <Float f={f}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 200, textAlign: "center", color: "#fff", fontSize: 76, fontWeight: 900, opacity: tp, transform: `translateY(${(1 - tp) * 18}px)` }}>{top}</div>
          <svg width={60} height={120} style={{ position: "absolute", left: CX - 30, top: 300, opacity: arrow }}>
            <path d={`M30 ${120 - arrow * 100} L30 120`} stroke="#fff" strokeWidth={6} />
            <path d="M14 36 L30 14 L46 36" stroke="#fff" strokeWidth={6} fill="none" strokeLinecap="round" transform={`translate(0 ${(1 - arrow) * 90})`} />
          </svg>
          <div style={{ position: "absolute", left: CX - 380, top: 440, width: 760, height: 250, borderRadius: 26, background: "linear-gradient(160deg,#a8a29e,#78716c 60%,#57534e)", boxShadow: "inset 0 8px 20px rgba(255,255,255,0.25), inset 0 -10px 20px rgba(0,0,0,0.4), 0 30px 70px rgba(0,0,0,0.6)", opacity: Math.min(1, tab * 2), transform: `translateY(${(1 - tab) * 100}px)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontFamily: SERIF, fontSize: 108, fontWeight: 700, letterSpacing: 8, color: "#3f3a36", textShadow: "0 2px 0 rgba(255,255,255,0.35), 0 -2px 0 rgba(0,0,0,0.5)", clipPath: `inset(0 ${(100 - carve * 100).toFixed(1)}% 0 0)` }}>{word}</div>
          </div>
          <Pill text={meaning} top={740} on={mn} size={52} />
          <Snd at={topAt} name="pop" k="disease" />
          <SndSpan at={wordAt} dur={18} name="write" vol={0.3} />
          <Snd at={meaningAt} name="ding" k="meaning" vol={0.3} />
        </Float>
      );
    }}
  </Stage>
);

// ============ 7. pergaminho + pena: dose mínima -> remédio ============
export const QuillNote: React.FC<{ life: number; year?: string; yearAt?: number; lines: { text: string; at: number; dur?: number }[]; dropAt?: number }> = ({ life, year, yearAt = 10, lines, dropAt }) => (
  <Stage life={life}>
    {(f, fps) => {
      const on = sp(f, fps, 0, { damping: 13, stiffness: 120, mass: 0.9 });
      const active = [...lines].reverse().find((l) => f >= l.at);
      const qi = active ? lines.indexOf(active) : 0;
      const prog = active ? interpolate(f, [active.at, active.at + (active.dur ?? 20)], [0, 1], clamp) : 0;
      const qx = 260 + prog * 420;
      const qy = 340 + qi * 110;
      const drop = dropAt !== undefined ? interpolate(f, [dropAt, dropAt + 16], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) }) : 0;
      return (
        <Float f={f} amp={4}>
          <div style={{ position: "absolute", left: CX - 400, top: 200, width: 800, height: 580, background: SEPIA, borderRadius: 12, boxShadow: "0 36px 90px rgba(0,0,0,0.6)", opacity: Math.min(1, on * 2), transform: `rotate(-1.5deg) scale(${0.85 + 0.15 * lock(on)})`, padding: "40px 50px", fontFamily: HAND, color: INK, fontSize: 52 }}>
            {year ? <div style={{ position: "absolute", right: 36, top: 24, fontSize: 32, opacity: sp(f, fps, yearAt) }}>{year}</div> : null}
            {lines.map((l, i) => (
              <div key={i} style={{ height: 110, display: "flex", alignItems: "center", color: i === lines.length - 1 ? ZALE.red : INK }}>
                <Typed text={l.text} f={f} at={l.at} dur={l.dur ?? 20} />
              </div>
            ))}
          </div>
          {/* pena */}
          <svg width={140} height={200} viewBox="0 0 140 200" style={{ position: "absolute", left: qx, top: qy - 190, opacity: on, transform: `rotate(${(Math.sin(f / 3) * 3).toFixed(2)}deg)` }}>
            <path d="M10 195 C 40 150, 70 90, 130 5 C 110 60, 80 120, 18 190 Z" fill="#f5f5f4" stroke="#a8a29e" strokeWidth={3} />
            <path d="M10 195 L 60 110" stroke="#78716c" strokeWidth={3} />
          </svg>
          {/* conta-gotas: uma gota */}
          {dropAt !== undefined ? (
            <div style={{ position: "absolute", left: CX + 410, top: 230, opacity: sp(f, fps, dropAt - 12) }}>
              <div style={{ width: 40, height: 60, background: "#3f3f46", borderRadius: "20px 20px 6px 6px", marginLeft: 10 }} />
              <div style={{ width: 20, height: 90, background: "rgba(255,255,255,0.6)", margin: "0 auto", borderRadius: "0 0 10px 10px", marginLeft: 20 }} />
              <div style={{ position: "absolute", left: 20, top: 150 + drop * 300, width: 20, height: 28, borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%", background: "#7dd3fc", opacity: drop < 1 ? 1 : 0 }} />
            </div>
          ) : null}
          <Snd at={2} name="pop" k="parchment" />
          {lines.map((l, i) => (
            <SndSpan key={i} at={l.at} dur={l.dur ?? 20} name="write" vol={0.25} />
          ))}
          {dropAt !== undefined ? <Snd at={dropAt + 14} name="tick" k="drop" /> : null}
        </Float>
      );
    }}
  </Stage>
);

// ============ 8. placar split-flap: os anos mudam em passos que aceleram ============
// Pedido do Paulo (2026-09-28): som de placar mecânico (as plaquinhas que viram), batendo EXATAMENTE quando o
// número muda. Os passos (quando o número muda e o clack) saem da mesma lista: nunca descolam.
const FlapDigit: React.FC<{ cur: string; prev: string; p: number }> = ({ cur, prev, p }) => {
  const W = 150;
  const H = 210;
  const face = (d: string, half: "top" | "bot"): React.ReactNode => (
    <div style={{ position: "absolute", left: 0, width: W, height: H / 2, top: half === "top" ? 0 : H / 2, overflow: "hidden", background: half === "top" ? "#27272a" : "#1c1c1f", borderRadius: half === "top" ? "18px 18px 0 0" : "0 0 18px 18px" }}>
      <div style={{ position: "absolute", left: 0, width: W, height: H, top: half === "top" ? 0 : -H / 2, color: "#fff", fontSize: 150, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", fontVariantNumeric: "tabular-nums" }}>{d}</div>
    </div>
  );
  const first = p < 0.5;
  const ang = first ? -180 * p : 90 - 180 * (p - 0.5);
  return (
    <div style={{ position: "relative", width: W, height: H, perspective: 700, boxShadow: "0 20px 50px rgba(0,0,0,0.6)", borderRadius: 18 }}>
      {face(cur, "top")}
      {face(p < 0.5 ? prev : cur, "bot")}
      {p < 1 ? (
        <div style={{ position: "absolute", left: 0, top: first ? 0 : H / 2, width: W, height: H / 2, transformOrigin: first ? "50% 100%" : "50% 0%", transform: `rotateX(${ang.toFixed(1)}deg)`, backfaceVisibility: "hidden" }}>
          <div style={{ position: "relative", width: W, height: H / 2 }}>{face(first ? prev : cur, first ? "top" : "bot")}</div>
        </div>
      ) : null}
      <div style={{ position: "absolute", left: 0, right: 0, top: H / 2 - 2, height: 4, background: "#0a0a0a", zIndex: 3 }} />
    </div>
  );
};
export const YearOdometer: React.FC<{ life: number; from: number; to: number; rollAt: number; dur?: number; steps?: number; label?: string; labelAt?: number }> = ({ life, from, to, rollAt, dur = 60, steps = 12, label, labelAt }) => (
  <Stage life={life}>
    {(f, fps) => {
      const on = sp(f, fps);
      // passo i acontece em rollAt + dur * raiz(i/N): o primeiro demora, os últimos vêm colados (acelera até 1977)
      // a 1ª virada é na própria palavra (rollAt); o valor 0 (1822) já está na tela antes
      const times = Array.from({ length: steps + 1 }, (_, i) => (i === 0 ? rollAt - 1 : rollAt + Math.round(dur * Math.sqrt((i - 1) / (steps - 1)))));
      const vals = times.map((_, i) => String(Math.round(from + ((to - from) * i) / steps)));
      let k = 0;
      for (let i = 0; i <= steps; i++) if (f >= times[i]) k = i;
      const FL = 6; // quadros da plaquinha virando
      const p = f < rollAt ? 1 : Math.min(1, (f - times[k]) / FL);
      const cur = vals[k];
      const prev = vals[Math.max(0, k - 1)];
      const lb = labelAt !== undefined ? sp(f, fps, labelAt) : 0;
      return (
        <Float f={f}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 230, display: "flex", justifyContent: "center", gap: 14, opacity: on }}>
            {cur.split("").map((d, i) => (
              <FlapDigit key={i} cur={d} prev={k > 0 && prev[i] !== d ? prev[i] : d} p={k > 0 && prev[i] !== d ? p : 1} />
            ))}
          </div>
          <div style={{ position: "absolute", left: CX - 60, top: 520, opacity: on, transform: `rotate(${(interpolate(f, [rollAt, rollAt + dur], [0, 180], clamp)).toFixed(1)}deg)` }}>
            <Hourglass size={120} color="#e0b64a" strokeWidth={1.6} />
          </div>
          {label ? <Pill text={label} top={720} on={lb} size={56} /> : null}
          {/* um clack por passo, no mesmo quadro em que o número muda; alterna as duas plaquinhas; sobe de leve */}
          {times.slice(1).map((t, i) => (
            <Snd key={i} at={t} name="flap" v={i % 2} vol={0.22 + 0.16 * ((i + 1) / steps)} />
          ))}
          {labelAt !== undefined ? <Snd at={labelAt} name="pop" k="label" vol={0.3} /> : null}
        </Float>
      );
    }}
  </Stage>
);

// ============ 12. contrato assinado + valor ============
export const ContractSign: React.FC<{ life: number; title: string; year?: string; buyer?: string; buyerAt?: number; signAt: number; signDur?: number; amount: string; amountAt: number }> = ({ life, title, year, buyer, buyerAt, signAt, signDur = 30, amount, amountAt }) => (
  <Stage life={life}>
    {(f, fps) => {
      const on = sp(f, fps, 0, { damping: 13, stiffness: 120, mass: 0.9 });
      const sg = interpolate(f, [signAt, signAt + signDur], [0, 1], clamp);
      const by = buyerAt !== undefined ? sp(f, fps, buyerAt) : 0;
      const am = sp(f, fps, amountAt, { damping: 10, stiffness: 200, mass: 0.6 });
      const len = 900;
      return (
        <Float f={f}>
          <div style={{ position: "absolute", left: CX - 360, top: 180, width: 720, height: 560, background: "#fbfaf7", borderRadius: 10, boxShadow: "0 36px 90px rgba(0,0,0,0.6)", opacity: Math.min(1, on * 2), transform: `rotate(1.5deg) scale(${0.85 + 0.15 * lock(on)})`, padding: "36px 46px", fontFamily: SERIF, color: "#222" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 26, color: "#666" }}>
              <span>CONTRATO</span>
              <span>{year}</span>
            </div>
            <div style={{ fontSize: 50, fontWeight: 700, marginTop: 10 }}>{title}</div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{ height: 10, background: "rgba(0,0,0,0.12)", borderRadius: 5, marginTop: 22, width: `${92 - (i % 3) * 12}%` }} />
            ))}
            {buyer ? <div style={{ fontSize: 34, marginTop: 30, opacity: by }}>comprador: <b>{buyer}</b></div> : null}
            <svg width={420} height={110} viewBox="0 0 420 110" style={{ position: "absolute", left: 46, bottom: 56 }}>
              <path d="M10 70 C 40 20, 60 100, 90 50 S 140 10, 160 60 S 220 90, 240 40 S 300 30, 320 70 S 380 60, 410 40" stroke="#1d3a8a" strokeWidth={5} fill="none" strokeLinecap="round" strokeDasharray={len} strokeDashoffset={len * (1 - sg)} />
            </svg>
            <div style={{ position: "absolute", left: 46, right: 46, bottom: 50, height: 2, background: "#999" }} />
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 780, textAlign: "center", opacity: Math.min(1, am * 2), transform: `scale(${am > 0.997 ? 1 : 1.5 - 0.5 * am})` }}>
            <span style={{ color: "#fff", fontSize: 96, fontWeight: 900, letterSpacing: -2 }}>{amount}</span>
          </div>
          <Snd at={2} name="pop" k="contract" />
          <SndSpan at={signAt} dur={signDur} name="write" vol={0.55} />
          {buyerAt !== undefined ? <Snd at={buyerAt} name="tick" k="buyer" /> : null}
          <Snd at={amountAt} name="ding" k="amount" />
        </Float>
      );
    }}
  </Stage>
);

// ============ 14. faturamento: duas barras + contador ============
export const RevenueStack: React.FC<{ life: number; to: number; unit: string; prefix?: string; countAt: number; dur?: number; bars: { label: string; at: number; share: number }[] }> = ({ life, to, unit, prefix = "US$ ", countAt, dur = 40, bars }) => (
  <Stage life={life}>
    {(f, fps) => {
      const t = ease(f, countAt, countAt + dur);
      const n = to * t;
      const punch = f >= countAt + dur ? 1 + 0.06 * Math.max(0, 1 - (f - countAt - dur) / 8) : 1;
      let acc = 0;
      return (
        <Float f={f}>
          <div style={{ position: "absolute", left: CX - 110, top: 260, width: 220, height: 460, borderRadius: 16, background: "rgba(255,255,255,0.06)", border: "2px solid rgba(255,255,255,0.12)", overflow: "hidden" }}>
            {bars.map((b, i) => {
              const g = sp(f, fps, b.at, { damping: 16, stiffness: 120, mass: 0.9 });
              const h = 460 * b.share * g;
              const el = (
                <div key={i} style={{ position: "absolute", left: 0, right: 0, bottom: acc, height: h, background: i ? ZALE.red : "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", color: i ? "#fff" : "#111", fontSize: 30, fontWeight: 800 }}>
                  {g > 0.5 ? b.label : ""}
                </div>
              );
              acc += h;
              return el;
            })}
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 750, textAlign: "center", opacity: f >= countAt ? 1 : 0, transform: `scale(${punch})` }}>
            <span style={{ color: "#fff", fontSize: 100, fontWeight: 900, letterSpacing: -3, fontVariantNumeric: "tabular-nums" }}>
              {prefix}
              {n.toFixed(t < 1 ? 1 : 0).replace(".", ",")} {unit}
            </span>
          </div>
          {bars.map((b, i) => (
            <Snd key={i} at={b.at} name="pop" k="bar" />
          ))}
          <SndSpan at={countAt} dur={dur} name="type" vol={0.1} />
          <Snd at={countAt + dur} name="ding" k="revenue" vol={0.28} />
        </Float>
      );
    }}
  </Stage>
);

// ============ 16. caixa premium (o que fizeram com ele) ============
export const GiftBox: React.FC<{ life: number; closeAt: number; tags: { text: string; at: number }[] }> = ({ life, closeAt, tags }) => (
  <Stage life={life}>
    {(f, fps) => {
      const vin = sp(f, fps, 4, { damping: 14, stiffness: 120, mass: 0.9 });
      const lid = ease(f, closeAt, closeAt + 14);
      const rib = sp(f, fps, closeAt + 12);
      return (
        <Float f={f}>
          {/* frasco descendo para dentro da caixa */}
          <div style={{ position: "absolute", left: CX - 60, top: 170 + vin * 220, opacity: 1 - lid, zIndex: 1 }}>
            <Vial w={120} label={TX.produto} />
          </div>
          {/* caixa */}
          <div style={{ position: "absolute", left: CX - 230, top: 470, width: 460, height: 330, background: "linear-gradient(160deg,#18181b,#27272a)", borderRadius: 12, boxShadow: "0 36px 90px rgba(0,0,0,0.7)", border: "2px solid #3f3f46", zIndex: 2 }}>
            <div style={{ position: "absolute", left: 210, top: 0, bottom: 0, width: 40, background: ZALE.red, opacity: rib }} />
          </div>
          {/* tampa */}
          <div style={{ position: "absolute", left: CX - 250, top: 430 - (1 - lid) * 260, width: 500, height: 70, background: "linear-gradient(160deg,#27272a,#3f3f46)", borderRadius: 12, transform: `rotate(${((1 - lid) * -18).toFixed(2)}deg)`, transformOrigin: "0% 100%", zIndex: 3, boxShadow: "0 20px 40px rgba(0,0,0,0.6)" }}>
            <div style={{ position: "absolute", left: 230, top: 0, bottom: 0, width: 40, background: ZALE.red, opacity: rib }} />
          </div>
          {rib > 0 ? <div style={{ position: "absolute", left: CX - 60, top: 380, width: 120, height: 70, zIndex: 4, transform: `scale(${rib})` }}>
            <svg width={120} height={70} viewBox="0 0 120 70"><path d="M60 40 C 20 0, 0 20, 10 40 C 20 60, 50 50, 60 40 C 70 50, 100 60, 110 40 C 120 20, 100 0, 60 40 Z" fill={ZALE.red} /></svg>
          </div> : null}
          {tags.map((t, i) => {
            const on = sp(f, fps, t.at);
            const left = i % 2 ? CX + 200 : CX - 420;
            return (
              <div key={i} style={{ position: "absolute", left, top: 230 + i * 150, opacity: on, transform: `translateX(${(1 - on) * (i % 2 ? 40 : -40)}px) rotate(${i % 2 ? 4 : -4}deg)`, background: "#fff", color: ZALE.ink, fontSize: 36, fontWeight: 900, padding: "12px 22px", borderRadius: 12, boxShadow: "0 14px 30px rgba(0,0,0,0.5)", zIndex: 5 }}>
                {t.text}
              </div>
            );
          })}
          <Snd at={4} name="pop" k="vial-in" />
          {tags.map((t, i) => (
            <Snd key={i} at={t.at} name="tick" k="tag" />
          ))}
          <Snd at={closeAt + 12} name="thud" k="box-close" />
        </Float>
      );
    }}
  </Stage>
);

// ============ 17. CTA: livro com o próximo capítulo ============
export const BookCta: React.FC<{ life: number; title: string; handle: string; chapter: string; flipAt: number; followAt?: number }> = ({ life, title, handle, chapter, flipAt, followAt }) => (
  <Stage life={life}>
    {(f, fps) => {
      const on = sp(f, fps, 0, { damping: 13, stiffness: 120, mass: 0.9 });
      const flip = ease(f, flipAt, flipAt + 20);
      const fl = followAt !== undefined ? sp(f, fps, followAt) : 0;
      return (
        <Float f={f}>
          <div style={{ position: "absolute", left: CX - 390, top: 220, width: 780, height: 520, opacity: Math.min(1, on * 2), transform: `scale(${0.85 + 0.15 * lock(on)})`, perspective: 1600 }}>
            {/* páginas */}
            <div style={{ position: "absolute", left: 0, top: 0, width: 390, height: 520, background: SEPIA, borderRadius: "14px 0 0 14px", boxShadow: "inset -20px 0 30px rgba(0,0,0,0.15)", padding: 34, fontFamily: SERIF, color: INK }}>
              <div style={{ fontSize: 24, opacity: 0.6 }}>capítulo 1</div>
              <div style={{ fontSize: 44, fontWeight: 700, lineHeight: 1.1, marginTop: 12 }}>A salsicha estragada</div>
            </div>
            <div style={{ position: "absolute", left: 390, top: 0, width: 390, height: 520, background: SEPIA, borderRadius: "0 14px 14px 0", boxShadow: "inset 20px 0 30px rgba(0,0,0,0.15)", padding: 34, fontFamily: SERIF, color: INK }}>
              <div style={{ fontSize: 24, opacity: 0.6 }}>capítulo 2</div>
              <div style={{ fontSize: 44, fontWeight: 700, lineHeight: 1.1, marginTop: 12, color: ZALE.red }}>{chapter}</div>
              <div style={{ position: "absolute", left: 34, bottom: 34, fontSize: 28, fontStyle: "italic" }}>continua...</div>
            </div>
            {/* capa virando */}
            <div style={{ position: "absolute", left: 390, top: 0, width: 390, height: 520, transformOrigin: "0% 50%", transform: `rotateY(${(-flip * 180).toFixed(1)}deg)`, transformStyle: "preserve-3d" }}>
              <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", background: "linear-gradient(160deg,#7f1d1d,#b91c1c)", borderRadius: "0 14px 14px 0", padding: 40, color: "#fff", display: "flex", flexDirection: "column", justifyContent: "space-between", boxShadow: "0 20px 50px rgba(0,0,0,0.5)" }}>
                <div style={{ fontFamily: SERIF, fontSize: 50, fontWeight: 700, lineHeight: 1.1 }}>{title}</div>
                <div style={{ fontSize: 30, fontWeight: 800 }}>{handle}</div>
              </div>
              <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", transform: "rotateY(180deg)", background: "#e8dcc0", borderRadius: "14px 0 0 14px" }} />
            </div>
          </div>
          {followAt !== undefined ? <Pill text={`segue pra ler o capítulo 2`} top={790} on={fl} size={42} /> : null}
          <Snd at={2} name="pop" k="book" />
          <Snd at={flipAt} name="page" v={0} />
          {followAt !== undefined ? <Snd at={followAt} name="pop" k="label" /> : null}
        </Float>
      );
    }}
  </Stage>
);
