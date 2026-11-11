import React from "react";
import { AbsoluteFill, continueRender, delayRender, Easing, Img, interpolate, OffthreadVideo, random, Sequence, staticFile, useCurrentFrame } from "remotion";
import { BF, C, Cam, Center, clamp, clip, Cursor, ease, Flash, Gold, Grain, HexButton, ICONS, io, path, Plate, punch, R, Room, shake } from "./CL2";

// "Cansei do LoL" v2, de 0:25 ao fim (10/11). Ele aprovou o estilo do piloto (CL2.tsx): cada jogo contado DENTRO da
// interface dele. LoL = cliente Hextech (Beaufort). Deadlock = UI do Deadlock com as fontes do próprio jogo
// (Reaver nos títulos, Radiance na interface, tiradas de game/citadel/panorama/fonts). Steam no meio, como a ponte.
// Pedido junto: as coisas estavam rápidas demais e com som empilhado. Aqui cada cena tem poucos golpes, com folga
// entre eles, e o movimento é mais calmo. Memes novos (nada repetido da série): Faustão, Pica-Pau, Bin Laden.
// Nada de emoji. Zona segura do TikTok: conteúdo entre y 180 e 1290, legenda em 1370. Props *At em QUADROS da cena.

const MG = (n: string) => staticFile(`videos/2026-11-06_deadlock-magia_R/mg/${n}`);
const WK = (n: string) => staticFile(`videos/2026-11-09_deadlock-farm_R/wk/${n}`);
const DL_ = (n: string) => staticFile(`videos/2026-11-05_deadlock-patch-celeste_R/dl/${n}`);
const HERO: Record<string, string> = {
  Haze: WK("Haze_card.png"),
  Infernus: WK("Infernus_card.png"),
  Seven: WK("Seven_card.png"),
  Rem: WK("Rem_card.png"),
  Apollo: DL_("Apollo_card.png"),
  Celeste: DL_("Celeste_card.png"),
  "Mo & Krill": DL_("Mo_Krill_card.png"),
  "Rei dos Ratos": DL_("Rat_King_card.png"),
  Baba: DL_("Baba_card.png"),
  "Danny Defunto": DL_("Deadman_Danny_card.png"),
};

// ---------- fontes do Deadlock ----------
const RV = "ReaverDL";
const RD = "RadianceDL";
const W_ = typeof window !== "undefined" ? (window as unknown as Record<string, unknown>) : null;
if (W_ && !W_.__clDlFonts) {
  W_.__clDlFonts = true;
  const h = delayRender("fontes do Deadlock");
  Promise.all(
    (
      [
        [RV, "reaver-semibold", "600"],
        [RV, "reaver-bold", "700"],
        [RD, "radiance-semibold", "600"],
        [RD, "radiance-bold", "700"],
      ] as const
    ).map(([fam, n, w]) =>
      new FontFace(fam, `url(${R(`fonts/${n}.otf`)}) format("opentype")`, { weight: w }).load().then((ff) => {
        document.fonts.add(ff);
      }),
    ),
  )
    .then(() => continueRender(h))
    .catch(() => continueRender(h));
}

// paleta do Deadlock (art déco escuro, creme, âmbar e safira, alma turquesa)
const D = {
  bg: "#0b0a08",
  panel: "rgba(20,17,13,0.94)",
  line: "#4a3d2a",
  cream: "#efe3c6",
  dim: "#958a74",
  amber: "#e8a33d",
  sapph: "#5b8ff0",
  soul: "#5ff2d6",
  red: "#e24a3b",
  green: "#86d57c",
};

// fundo do Deadlock: fumaça quente, poeira subindo devagar
const DlRoom: React.FC<{ children?: React.ReactNode; glow?: string }> = ({ children, glow = "#3a2a14" }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: D.bg, overflow: "hidden" }}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 80% 50% at 50% 40%, ${glow}cc 0%, rgba(0,0,0,0) 70%)` }} />
      {Array.from({ length: 22 }).map((_, i) => {
        const x = random(`dx${i}`) * 1080;
        const sp = 0.4 + random(`ds${i}`) * 0.8;
        const y = 1920 - ((f * sp + random(`dy${i}`) * 1920) % 1920);
        return <div key={i} style={{ position: "absolute", left: x + Math.sin((f + i * 20) / 30) * 14, top: y, width: 4, height: 4, borderRadius: 2, background: D.amber, opacity: 0.18 + random(`do${i}`) * 0.25, boxShadow: `0 0 8px ${D.amber}` }} />;
      })}
      {children}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 95% 80% at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.78) 100%)", pointerEvents: "none", zIndex: 70 }} />
      <Grain />
    </AbsoluteFill>
  );
};

// título do Deadlock (Reaver, creme gravado), entra com máscara
const DlTitle: React.FC<{ f: number; at: number; size: number; children: React.ReactNode; c?: string; n?: number; style?: React.CSSProperties; font?: string; ls?: number }> = ({ f, at, size, children, c = D.cream, n = 10, style, font = RV, ls = 0.04 }) => {
  if (f < at) return null;
  const p = ease(f, at, n);
  return (
    <div
      style={{
        fontFamily: font,
        fontWeight: 700,
        fontSize: size,
        lineHeight: 1.02,
        whiteSpace: "nowrap",
        color: c,
        letterSpacing: interpolate(p, [0, 1], [size * 0.18, size * ls]),
        textShadow: `0 4px 26px rgba(0,0,0,0.95), 0 0 30px ${c}33`,
        clipPath: `inset(-25% ${(1 - p) * 100}% -25% 0)`,
        transform: `translateY(${(1 - p) * 20}px)`,
        filter: p < 1 ? `blur(${(1 - p) * 8}px)` : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

// painel do Deadlock: moldura fina com cantos chanfrados
const DlPanel: React.FC<{ w: number; h?: number; children?: React.ReactNode; style?: React.CSSProperties; c?: string }> = ({ w, h, children, style, c = D.line }) => (
  <div style={{ position: "relative", width: w, height: h, background: D.panel, border: `2px solid ${c}`, clipPath: "polygon(16px 0, calc(100% - 16px) 0, 100% 16px, 100% calc(100% - 16px), calc(100% - 16px) 100%, 16px 100%, 0 calc(100% - 16px), 0 16px)", boxShadow: "0 30px 80px rgba(0,0,0,0.8)", ...style }}>
    {children}
  </div>
);

// meme em tela cheia. band=true: vídeo 16:9 inteiro numa faixa, com ele mesmo desfocado atrás (o texto do meme não corta)
const Meme: React.FC<{ f: number; at: number; dur: number; src: string; ss?: number; band?: boolean; pos?: string; life: number }> = ({ f, at, dur, src, ss = 0, band = false, pos = "50% 50%", life }) => {
  if (f < at - 1 || f >= at + dur) return null;
  const k = interpolate(f, [at, at + 5], [1.12, 1], { ...clamp, easing: Easing.out(Easing.cubic) }) + interpolate(f, [at, at + dur], [0, 0.05], clamp);
  return (
    <Sequence from={at} durationInFrames={Math.max(1, Math.min(dur, life - at))} layout="none">
      <AbsoluteFill style={{ background: "#000", zIndex: 90, overflow: "hidden" }}>
        {band ? (
          <>
            <OffthreadVideo src={R(src)} muted startFrom={ss} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "blur(30px) brightness(0.5)", transform: "scale(1.2)" }} />
            <div style={{ position: "absolute", left: 0, right: 0, top: 640, height: 608, transform: `scale(${k})` }}>
              <OffthreadVideo src={R(src)} muted startFrom={ss} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          </>
        ) : (
          <AbsoluteFill style={{ transform: `scale(${k})` }}>
            <OffthreadVideo src={R(src)} muted startFrom={ss} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: pos }} />
          </AbsoluteFill>
        )}
      </AbsoluteFill>
    </Sequence>
  );
};
export { Meme };

const Typed: React.FC<{ f: number; at: number; text: string; cps?: number; caret?: boolean; c?: string }> = ({ f, at, text, cps = 1, caret = true, c }) => {
  const n = Math.max(0, Math.min(text.length, Math.floor((f - at) * cps)));
  return (
    <span>
      {f >= at ? text.slice(0, n) : ""}
      {caret ? <span style={{ opacity: Math.floor(f / 8) % 2 ? 0 : 1, color: c }}>|</span> : null}
    </span>
  );
};

// ========== 5) elo travado (PdL sobe e cai) · mecânica · o jogo virou mecânico (QWER em loop) ==========
const SPELLS = [
  ["Q", "sp_Deceive.png"],
  ["W", "sp_JackInTheBox.png"],
  ["E", "sp_TwoShivPoison.png"],
  ["R", "sp_HallucinateFull.png"],
] as const;
export const CLGrind: React.FC<{ life: number; eloAt?: number; mecAt?: number; loopAt?: number; mec2At?: number }> = ({ life, eloAt = 60, mecAt = 112, loopAt = 180, mec2At = 286 }) => {
  const f = useCurrentFrame();
  // PdL: sobe pouco, cai mais (fica no mesmo lugar)
  const steps = [
    [10, 19],
    [eloAt - 20, -21],
    [eloAt + 8, 18],
    [eloAt + 34, -22],
  ] as const;
  let lp = 47;
  let last: readonly [number, number] | null = null;
  for (const s of steps) {
    if (f >= s[0]) {
      lp += s[1];
      last = s;
    }
  }
  const shown = last && f < last[0] + 10 ? Math.round(lp - last[1] * (1 - ease(f, last[0], 10))) : lp;
  const out = io(f, mecAt - 6, 16);
  const pressN = f >= loopAt && f < mec2At ? Math.floor((f - loopAt) / 8) : -1;
  const gray = interpolate(f, [loopAt, mec2At], [0, 0.85], clamp);
  return (
    <Room glow={f < mecAt ? "#0a3a52" : "#1a1a22"}>
      <Cam f={f} rx={8 - 4 * ease(f, 0, 20)} z={1 + f * 0.0004}>
        {/* ranqueada: emblema, divisão e a barra de PdL que não sai do lugar */}
        <div style={{ position: "absolute", inset: 0, opacity: 1 - out, transform: `translateY(${-out * 700}px)`, filter: out > 0.05 ? `blur(${out * 16}px)` : undefined }}>
          <Center top={250}>
            <div style={{ fontFamily: BF, fontWeight: 700, fontSize: 32, letterSpacing: 9, color: C.grey, opacity: ease(f, 0, 10) }}>RANQUEADA SOLO/DUO</div>
          </Center>
          <Center top={300}>
            <Img src={R("cl/emblem_gold_c.png")} style={{ width: 460, opacity: ease(f, 0, 14), transform: `scale(${0.9 + 0.1 * ease(f, 0, 18)})`, filter: `drop-shadow(0 0 ${30 + Math.sin(f / 9) * 10}px ${C.gold}88)` }} />
          </Center>
          <Center top={740}>
            <Gold f={f} at={4} size={100} w={900}>
              OURO IV
            </Gold>
          </Center>
          <Center top={880}>
            <div style={{ position: "relative", width: 780 }}>
              <div style={{ height: 30, border: `2px solid ${C.gold2}`, background: "#06121c", padding: 3 }}>
                <div style={{ height: "100%", width: `${shown}%`, background: `linear-gradient(90deg, ${C.blue}, ${C.teal})`, boxShadow: `0 0 18px ${C.teal}` }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16, fontFamily: BF, fontWeight: 700, fontSize: 40, color: C.goldL, letterSpacing: 2 }}>
                <span>{shown} PdL</span>
                <span style={{ color: C.grey2 }}>100</span>
              </div>
              {steps.map(([at, d]) =>
                f >= at && f < at + 26 ? (
                  <div key={at} style={{ position: "absolute", right: 0, top: 70 + ease(f, at, 20) * 30, fontFamily: BF, fontWeight: 900, fontSize: 56, color: d > 0 ? C.teal : C.red, opacity: 1 - ease(f, at + 14, 12), textShadow: "0 4px 20px #000" }}>
                    {d > 0 ? `+${d}` : `−${-d}`} PdL
                  </div>
                ) : null,
              )}
            </div>
          </Center>
        </div>
        {/* barra de habilidades do Shaco: Q W E R, sempre a mesma ordem */}
        {f >= mecAt - 6 ? (
          <div style={{ position: "absolute", inset: 0, opacity: out, transform: `translateY(${(1 - out) * 500}px)`, filter: `grayscale(${gray})` }}>
            <Center top={520}>
              <div style={{ display: "flex", gap: 34 }}>
                {SPELLS.map(([k, img], i) => {
                  const on = pressN >= 0 && pressN % 4 === i;
                  const t0 = loopAt + (pressN - (pressN % 4) + i) * 8;
                  const cd = on ? ease(f, t0, 8) : 1;
                  return (
                    <div key={k} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18, opacity: ease(f, mecAt + i * 4, 8), transform: `translateY(${(1 - ease(f, mecAt + i * 4, 10)) * 50}px)` }}>
                      <div style={{ position: "relative", width: 196, height: 196, border: `4px solid ${on ? C.goldL : C.gold2}`, boxShadow: on ? `0 0 40px ${C.gold}` : "0 16px 40px rgba(0,0,0,0.8)", transform: `scale(${on ? 0.93 : 1})` }}>
                        <Img src={R(`cl/${img}`)} style={{ width: "100%", height: "100%", imageRendering: "auto" }} />
                        {on ? <div style={{ position: "absolute", inset: 0, background: `conic-gradient(rgba(0,0,0,0) ${cd * 360}deg, rgba(0,0,0,0.65) 0deg)` }} /> : null}
                      </div>
                      <div style={{ width: 64, height: 64, border: `2px solid ${on ? C.goldL : C.line}`, background: on ? C.gold2 : "#0b1622", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: BF, fontWeight: 700, fontSize: 38, color: C.goldL }}>{k}</div>
                    </div>
                  );
                })}
              </div>
            </Center>
            {/* a fita da sequência: Q W E R Q W E R… passando sem fim */}
            {f >= loopAt - 10 ? (
              <div style={{ position: "absolute", left: 0, right: 0, top: 900, height: 110, overflow: "hidden", opacity: ease(f, loopAt - 10, 12), maskImage: "linear-gradient(90deg, transparent, #000 18%, #000 82%, transparent)", WebkitMaskImage: "linear-gradient(90deg, transparent, #000 18%, #000 82%, transparent)" }}>
                <div style={{ position: "absolute", top: 18, left: 540 - ((f - loopAt) / 8) * 110 - 55, display: "flex", whiteSpace: "nowrap" }}>
                  {Array.from({ length: 60 }).map((_, i) => (
                    <div key={i} style={{ width: 110, textAlign: "center", fontFamily: BF, fontWeight: 700, fontSize: 64, color: i === pressN ? C.goldL : C.grey2 }}>
                      {"QWER"[i % 4]}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            <Center top={1070}>
              <div style={{ transform: `translate(${shake(f, mec2At, 10, 10, "mc").x}px, 0)` }}>
                <Gold f={f} at={mec2At} size={150} w={900} n={7}>
                  MECÂNICO
                </Gold>
              </div>
            </Center>
          </div>
        ) : null}
      </Cam>
    </Room>
  );
};

// ========== 6) 10 anos: o histórico de partidas rolando para trás até 2015, 2014 · não aguento mais (Pica-Pau) ==========
export const CLHistory: React.FC<{ life: number; tenAt?: number; y15At?: number; y14At?: number; tiredAt?: number }> = ({ life, tenAt = 100, y15At = 165, y14At = 200, tiredAt = 322 }) => {
  const f = useCurrentFrame();
  const ROWH = 128;
  // quantas linhas já passaram (cada linha ≈ uma partida, ~2 meses por linha para caber 12 anos)
  const s = interpolate(f, [0, tenAt, y15At - 6, y15At + 10, y14At - 4, y14At + 10, life], [0, 4, 62, 63, 68, 69, 70], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const yearOf = (i: number) => 2026 - Math.floor((i * 12) / 69 + 0.25);
  const year = Math.max(2014, yearOf(s + 2.4));
  const age = interpolate(year, [2014, 2026], [1, 0], clamp);
  const rows = Array.from({ length: 14 }).map((_, k) => Math.floor(s) - 2 + k);
  return (
    <Room glow="#1d2a3a">
      <Cam f={f} rx={10} ry={-6} z={1.02} y={-20}>
        <div style={{ position: "absolute", left: 60, top: 220, width: 960, height: 860, overflow: "hidden", border: `2px solid ${C.line}`, background: "rgba(1,10,19,0.94)", filter: `sepia(${age * 0.55}) saturate(${1 - age * 0.3})`, opacity: ease(f, 0, 10) }}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 90, zIndex: 3, background: C.bg, borderBottom: `2px solid ${C.line}`, display: "flex", alignItems: "center", paddingLeft: 36, fontFamily: BF, fontWeight: 700, fontSize: 34, letterSpacing: 6, color: C.goldL }}>
            HISTÓRICO DE PARTIDAS
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 90 - (s % 1) * ROWH }}>
            {rows.map((i, k) => {
              if (i < 0) return <div key={k} style={{ height: ROWH }} />;
              const win = random(`w${i}`) < 0.42;
              const ch = ICONS[Math.floor(random(`c${i}`) * ICONS.length)];
              const y = yearOf(i);
              const d = 1 + Math.floor(random(`d${i}`) * 27);
              const m = 1 + Math.floor(random(`m${i}`) * 12);
              return (
                <div key={k} style={{ height: ROWH, display: "flex", alignItems: "center", gap: 26, padding: "0 30px", borderBottom: `1px solid ${C.line}88`, background: win ? "linear-gradient(90deg, rgba(10,200,185,0.10), rgba(0,0,0,0))" : "linear-gradient(90deg, rgba(232,64,87,0.10), rgba(0,0,0,0))" }}>
                  <Img src={R(`cl/icons/${ch}.png`)} style={{ width: 90, height: 90, border: `2px solid ${C.gold2}` }} />
                  <div style={{ width: 230 }}>
                    <div style={{ fontFamily: BF, fontWeight: 700, fontSize: 38, color: win ? C.teal : C.red, letterSpacing: 2 }}>{win ? "VITÓRIA" : "DERROTA"}</div>
                    <div style={{ fontFamily: BF, fontWeight: 500, fontSize: 24, color: C.grey }}>Ranqueada Solo/Duo</div>
                  </div>
                  <div style={{ flex: 1, fontFamily: BF, fontWeight: 700, fontSize: 36, color: C.goldL }}>
                    {1 + Math.floor(random(`k${i}`) * 9)} / {2 + Math.floor(random(`dd${i}`) * 9)} / {Math.floor(random(`a${i}`) * 14)}
                  </div>
                  <div style={{ fontFamily: BF, fontWeight: 500, fontSize: 28, color: C.grey, fontVariantNumeric: "tabular-nums" }}>
                    {String(d).padStart(2, "0")}/{String(m).padStart(2, "0")}/{y}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 160, background: "linear-gradient(180deg, rgba(1,10,19,0), rgba(1,10,19,1))", zIndex: 2 }} />
        </div>
      </Cam>
      {/* o ano, grande, contando para trás */}
      <Center top={1060}>
        <div style={{ fontFamily: BF, fontWeight: 900, fontSize: 200, lineHeight: 1, color: C.goldL, letterSpacing: 6, fontVariantNumeric: "tabular-nums", opacity: ease(f, tenAt - 10, 10), textShadow: `0 0 50px ${C.gold}88, 0 10px 30px #000`, transform: `scale(${1 + punch(f, [y15At, y14At], 0.1, 10)})` }}>
          {year}
        </div>
      </Center>
      <Meme f={f} at={tiredAt} dur={52} src="memes/picapau.mp4" ss={0} pos="55% 50%" life={life} />
    </Room>
  );
};

// ========== 7) voltando pro LoL: fecha o cliente e ele abre de novo · correntes (apego, vício, dano) · o buraco ==========
const Chain: React.FC<{ f: number; at: number; x1: number; y1: number; x2: number; y2: number; tag: string; k?: number }> = ({ f, at, x1, y1, x2, y2, tag, k = 0.5 }) => {
  if (f < at - 10) return null;
  const p = ease(f, at - 10, 10);
  const len = Math.hypot(x2 - x1, y2 - y1);
  const ang = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
  const N = Math.floor(len / 46);
  const sh = shake(f, at, 10, 9, tag);
  return (
    <div style={{ position: "absolute", left: x1, top: y1, width: len, height: 0, transform: `translate(${sh.x}px, ${sh.y}px) rotate(${ang}deg)`, transformOrigin: "0 0", zIndex: 40 }}>
      {Array.from({ length: N }).map((_, i) =>
        i / N <= p ? (
          <div
            key={i}
            style={{
              position: "absolute",
              left: i * 46 - 4,
              top: i % 2 ? -9 : -18,
              width: 54,
              height: i % 2 ? 18 : 36,
              borderRadius: 18,
              border: `${i % 2 ? 6 : 8}px solid ${i % 2 ? "#8c6d35" : "#c9a660"}`,
              boxShadow: "0 6px 12px rgba(0,0,0,0.8), inset 0 2px 0 rgba(255,240,200,0.5)",
            }}
          />
        ) : null,
      )}
      {/* cadeado com a plaquinha */}
      {f >= at ? (
        <div style={{ position: "absolute", left: len * k - 60, top: -40, transform: `rotate(${-ang}deg) scale(${interpolate(f, [at, at + 5], [1.6, 1], { ...clamp, easing: Easing.in(Easing.quad) })})` }}>
          <svg width={120} height={140} viewBox="0 0 120 140">
            <defs>
              <linearGradient id={`lk${tag}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#f3dfa8" />
                <stop offset="0.55" stopColor="#b48a42" />
                <stop offset="1" stopColor="#5e4520" />
              </linearGradient>
            </defs>
            <path d="M32 62 V40 a28 28 0 0 1 56 0 V62" fill="none" stroke="#8c6d35" strokeWidth={12} />
            <rect x={14} y={58} width={92} height={74} rx={10} fill={`url(#lk${tag})`} stroke="#3d2c12" strokeWidth={3} />
            <circle cx={60} cy={90} r={9} fill="#2a1d0a" />
            <rect x={56} y={92} width={8} height={22} fill="#2a1d0a" />
          </svg>
          <div style={{ position: "absolute", left: 60, top: 138, transform: "translateX(-50%)", padding: "8px 22px", background: C.bg, border: `2px solid ${C.gold}`, fontFamily: BF, fontWeight: 700, fontSize: 44, letterSpacing: 6, color: C.goldL, whiteSpace: "nowrap", boxShadow: "0 10px 30px #000" }}>{tag}</div>
        </div>
      ) : null}
    </div>
  );
};
export const CLLocks: React.FC<{ life: number; closeAt?: number; backAt?: number; apegoAt?: number; vicioAt?: number; danoAt?: number; holeAt?: number }> = ({ life, closeAt = 12, backAt = 31, apegoAt = 93, vicioAt = 127, danoAt = 164, holeAt = 207 }) => {
  const f = useCurrentFrame();
  // 10/11: nada de fechar o cliente; o cursor fica tentando clicar em JOGAR, de novo e de novo, até as correntes travarem
  void closeAt;
  const shut = 0;
  const suck = interpolate(f, [holeAt, holeAt + 60], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const hole = ease(f, holeAt - 6, 26);
  const clicks: number[] = [];
  for (let t = backAt; t < holeAt - 10; t += t < apegoAt ? 24 : 18) clicks.push(t);
  const BX = 219;
  const BY = 349;
  const jig = (k: number) => (f >= k && f < k + 6 ? (random(`jg${k}`) - 0.5) * 30 : 0);
  const cur = f < backAt ? path(f, [[0, 760, 1150], [backAt - 2, BX + 10, BY + 8]]) : { x: BX + 10 + clicks.reduce((a, k) => a + jig(k), 0) * 0.6, y: BY + 8 + Math.sin(f / 5) * 3 };
  const pressed = clicks.some((k) => f >= k && f < k + 4);
  const locked = f >= apegoAt;
  return (
    <Room glow={f < holeAt ? "#0a3a52" : "#000000"}>
      <Cam f={f} rx={6} z={1 - suck * 0.15} origin="50% 40%">
        <div style={{ position: "absolute", inset: 0, transform: `scale(${1 - suck * 0.92}) rotate(${suck * 260}deg)`, transformOrigin: "540px 700px", opacity: 1 - interpolate(suck, [0.7, 1], [0, 1], clamp) }}>
          {/* a janela do cliente */}
          <div style={{ position: "absolute", left: 90, top: 300, width: 900, height: 700, transform: `scale(${1 - shut * 0.94})`, opacity: 1 - shut * 0.9, transformOrigin: "50% 50%", border: `2px solid ${C.line}`, background: C.navy, overflow: "hidden", boxShadow: `0 40px 90px rgba(0,0,0,0.85), 0 0 ${f >= backAt ? 70 * (1 - ease(f, backAt + 4, 20)) + 30 : 30}px ${C.teal}55` }}>
            <div style={{ position: "absolute", left: 0, right: 0, top: 96, bottom: 0, overflow: "hidden" }}>
              <OffthreadVideo src={clip("lol_b")} muted startFrom={12 * 30} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.55) saturate(1.1)" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(1,10,19,0.1), rgba(1,10,19,0.92))" }} />
              <div style={{ position: "absolute", left: 40, bottom: 60 }}>
                <Gold f={f} at={2} size={64}>
                  LEAGUE OF LEGENDS
                </Gold>
              </div>
            </div>
            <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 96, background: C.bg, borderBottom: `2px solid ${C.line}` }}>
              <div style={{ position: "absolute", left: 24, top: 20 }}>
                <HexButton w={210} h={58} label="JOGAR" f={f} size={30} hot={pressed ? 1 : 0.6} pressed={pressed} />
              </div>
              {/* o X de fechar */}
              <div style={{ position: "absolute", right: 22, top: 22, width: 52, height: 52, border: `2px solid ${f >= closeAt - 4 && f < closeAt + 8 ? C.goldL : C.gold2}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width={26} height={26} viewBox="0 0 26 26">
                  <path d="M4 4 L22 22 M22 4 L4 22" stroke={C.goldL} strokeWidth={3.5} strokeLinecap="round" />
                </svg>
              </div>
            </div>
          </div>
          <Chain f={f} at={apegoAt} x1={40} y1={330} x2={1040} y2={980} tag="APEGO" k={0.28} />
          <Chain f={f} at={vicioAt} x1={1040} y1={330} x2={40} y2={980} tag="VÍCIO" k={0.28} />
          <Chain f={f} at={danoAt} x1={0} y1={860} x2={1080} y2={860} tag="DANO" k={0.5} />
        </div>
        {f < holeAt ? <Cursor x={cur.x} y={cur.y} f={f} clicks={clicks} /> : null}
      </Cam>
      {/* o buraco: abre no meio e engole tudo */}
      {f >= holeAt - 6 ? (
        <AbsoluteFill style={{ zIndex: 30, pointerEvents: "none" }}>
          <div style={{ position: "absolute", left: 540 - 700 * hole, top: 700 - 700 * hole, width: 1400 * hole, height: 1400 * hole, borderRadius: "50%", background: "radial-gradient(circle, #000 0%, #000 34%, rgba(20,10,4,0.9) 46%, rgba(0,0,0,0) 70%)" }} />
          <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
            {Array.from({ length: 5 }).map((_, k) => (
              <ellipse key={k} cx={540} cy={700} rx={(140 + k * 70) * hole} ry={(120 + k * 60) * hole} fill="none" stroke={C.gold} strokeOpacity={0.35 - k * 0.06} strokeWidth={3} strokeDasharray={`${60 + k * 30} ${40 + k * 12}`} transform={`rotate(${(k % 2 ? -1 : 1) * f * (3 - k * 0.4)} 540 700)`} />
            ))}
          </svg>
        </AbsoluteFill>
      ) : null}
      <Flash f={f} ts={locked ? [] : [backAt]} pk={0.12} c={C.teal} />
    </Room>
  );
};

// ========== 8) procurei: o placar do LoL depois da derrota · indignado · o time feedando ==========
const TEAM = [
  ["Shaco", "VOCÊ", "6 / 4 / 7", true],
  ["Yasuo", "", "0 / 11 / 1", false],
  ["Ahri", "", "3 / 6 / 4", false],
  ["Darius", "", "2 / 7 / 2", false],
  ["Thresh", "", "0 / 5 / 9", false],
] as const;
export const CLScore: React.FC<{ life: number; loseAt?: number; madAt?: number; feedAt?: number }> = ({ life, loseAt = 100, madAt = 137, feedAt = 193 }) => {
  const f = useCurrentFrame();
  const sh = shake(f, madAt, 14, 12, "md");
  const feed = f >= feedAt;
  return (
    <Room glow="#3a1410">
      <Cam f={f} rx={12 - 8 * ease(f, 0, 30)} z={0.96 + 0.04 * ease(f, 0, 30) + punch(f, [madAt], 0.03)} x={sh.x} y={sh.y}>
        <Center top={200}>
          <div style={{ opacity: ease(f, 2, 10), transform: `scale(${0.9 + 0.1 * ease(f, 2, 14)})` }}>
            <Img src={R("cl/defeat_ptbr.png")} style={{ width: 640 }} />
          </div>
        </Center>
        <Center top={520}>
          <div style={{ width: 960, border: `2px solid ${C.line}`, background: "rgba(1,10,19,0.94)" }}>
            <div style={{ display: "flex", padding: "18px 30px", fontFamily: BF, fontWeight: 700, fontSize: 26, letterSpacing: 4, color: C.grey, borderBottom: `2px solid ${C.line}` }}>
              <span style={{ flex: 1 }}>SEU TIME</span>
              <span>A / M / AS</span>
            </div>
            {TEAM.map(([ch, tag, kda, me], i) => {
              const bad = !me && i === 1 && feed;
              const on = ease(f, 8 + i * 5, 10);
              return (
                <div key={ch} style={{ position: "relative", display: "flex", alignItems: "center", gap: 26, height: 118, padding: "0 30px", borderBottom: `1px solid ${C.line}88`, opacity: on, transform: `translateX(${(1 - on) * 60}px) scale(${bad ? 1.03 + punch(f, [feedAt], 0.04) : 1})`, background: me ? "linear-gradient(90deg, rgba(200,170,110,0.18), rgba(0,0,0,0))" : bad ? `rgba(232,64,87,${0.18 + Math.sin(f / 5) * 0.06})` : "transparent", outline: bad ? `3px solid ${C.red}` : "none" }}>
                  <Img src={R(`cl/icons/${ch}.png`)} style={{ width: 86, height: 86, border: `2px solid ${me ? C.goldL : C.gold2}`, filter: bad ? "none" : "brightness(0.85)" }} />
                  <div style={{ flex: 1, fontFamily: BF, fontWeight: 700, fontSize: 38, color: me ? C.goldL : C.grey }}>
                    {ch.toUpperCase()}
                    {tag ? <span style={{ marginLeft: 18, fontSize: 24, color: C.gold, letterSpacing: 4 }}>{tag}</span> : null}
                  </div>
                  <div style={{ fontFamily: BF, fontWeight: 700, fontSize: 42, color: bad ? C.red : C.goldL, fontVariantNumeric: "tabular-nums" }}>{kda}</div>
                </div>
              );
            })}
          </div>
        </Center>
        {/* o cursor vai na linha do Yasuo */}
        {f >= feedAt - 20 ? <Cursor x={path(f, [[feedAt - 20, 980, 1250], [feedAt - 2, 560, 712]]).x} y={path(f, [[feedAt - 20, 980, 1250], [feedAt - 2, 560, 712]]).y} f={f} /> : null}
      </Cam>
      <Flash f={f} ts={[madAt]} pk={0.16} c="#ff3b2f" />
    </Room>
  );
};

// ========== 9) a ponte: busca na loja da Steam · divertido · aprender · o Deadlock sobe pro topo · clique ==========
const GAMES = [
  ["dota_cap.jpg", "Dota 2"],
  ["cs_cap.jpg", "Counter-Strike 2"],
  ["mr_cap.jpg", "Marvel Rivals"],
  ["ow_cap.jpg", "Overwatch 2"],
  ["tf2_cap.jpg", "Team Fortress 2"],
  ["dl_cap.jpg", "Deadlock"],
] as const;
export const CLSteam: React.FC<{ life: number; funAt?: number; learnAt?: number; foundAt?: number; dlAt?: number }> = ({ life, funAt = 37, learnAt = 95, foundAt = 163, dlAt = 218 }) => {
  const f = useCurrentFrame();
  const q1 = "jogo divertido mesmo perdendo";
  const q2 = " e que ensina";
  const up = io(f, foundAt, 18);
  const open = ease(f, dlAt + 2, 12);
  // grade 3×2: o Deadlock sai do último lugar e vai direto pro primeiro; os outros andam uma casa
  const cell = (k: number) => ({ x: 60 + (k % 3) * 330, y: 420 + Math.floor(k / 3) * 440 });
  const pos = (i: number) => {
    const a = cell(i);
    const b = cell(i === 5 ? 0 : i + 1);
    return { x: a.x + (b.x - a.x) * up, y: a.y + (b.y - a.y) * up };
  };
  const cur = path(f, [
    [0, 900, 1300],
    [dlAt - 20, 900, 1250],
    [dlAt - 2, 230, 640],
  ]);
  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #1b2838 0%, #171a21 100%)", overflow: "hidden" }}>
      <Cam f={f} rx={6} z={1 + open * 0.0}>
        {/* barra de busca */}
        <Center top={230}>
          <div style={{ width: 960, height: 104, display: "flex", alignItems: "center", gap: 22, padding: "0 30px", background: "#316282", border: "2px solid #4a8bb0", boxShadow: "0 0 40px rgba(102,192,244,0.25)", opacity: ease(f, 0, 8) }}>
            <svg width={44} height={44} viewBox="0 0 44 44">
              <circle cx={18} cy={18} r={13} fill="none" stroke="#c7d5e0" strokeWidth={4.5} />
              <path d="M28 28 L40 40" stroke="#c7d5e0" strokeWidth={5} strokeLinecap="round" />
            </svg>
            <div style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: 40, color: "#e8f1f8", whiteSpace: "nowrap", overflow: "hidden" }}>
              <Typed f={f} at={funAt - 26} text={q1} cps={1.1} caret={f < learnAt} />
              {f >= learnAt ? <Typed f={f} at={learnAt} text={q2} cps={0.9} caret={f < foundAt} /> : null}
            </div>
          </div>
        </Center>
        {/* resultados */}
        {GAMES.map(([img, name], i) => {
          const p = pos(i);
          const isDl = i === 5;
          const hot = isDl && f >= foundAt;
          const on = ease(f, 6 + i * 3, 10);
          return (
            <div key={img} style={{ position: "absolute", left: p.x, top: p.y, width: 300, opacity: on * (isDl ? 1 : 1 - up * 0.55), transform: `translateY(${(1 - on) * 50}px) scale(${hot ? 1.05 + punch(f, [foundAt + 18], 0.05) : 1})`, zIndex: isDl ? 5 : 1 }}>
              <Img src={MG(img)} style={{ width: 300, height: 360, objectFit: "cover", border: hot ? "4px solid #66c0f4" : "4px solid transparent", boxShadow: hot ? "0 0 50px rgba(102,192,244,0.7)" : "0 20px 40px rgba(0,0,0,0.6)", filter: isDl || f < foundAt ? "none" : "brightness(0.6) saturate(0.6)" }} />
              <div style={{ marginTop: 10, fontFamily: "Arial, Helvetica, sans-serif", fontSize: 30, color: hot ? "#ffffff" : "#c7d5e0", whiteSpace: "nowrap" }}>{name}</div>
            </div>
          );
        })}
        {f < dlAt + 6 ? <Cursor x={cur.x} y={cur.y} f={f} clicks={[dlAt]} /> : null}
      </Cam>
      {/* clicou: a capa do Deadlock abre na tela inteira */}
      {f >= dlAt + 2 ? (
        <AbsoluteFill style={{ zIndex: 40, clipPath: `inset(${(1 - open) * 22}% ${(1 - open) * 64}% ${(1 - open) * 56}% ${(1 - open) * 6}%)` }}>
          <Img src={MG("dl_hero.jpg")} style={{ position: "absolute", height: 1920, left: -1100, top: 0, transform: `scale(${1.1 - open * 0.06})`, filter: "brightness(0.7)" }} />
          <AbsoluteFill style={{ background: "radial-gradient(ellipse 70% 40% at 50% 45%, rgba(0,0,0,0.0), rgba(0,0,0,0.7))" }} />
          <Center top={600}>
            <Img src={MG("dl_logo.png")} style={{ width: 860, opacity: ease(f, dlAt + 6, 8), transform: `scale(${1.25 - 0.25 * ease(f, dlAt + 6, 8)})`, filter: "drop-shadow(0 10px 40px #000)" }} />
          </Center>
        </AbsoluteFill>
      ) : null}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 95% 80% at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.6) 100%)", pointerEvents: "none", zIndex: 60 }} />
      <Grain />
    </AbsoluteFill>
  );
};

// ========== 10) Deadlock: 5 derrotas seguidas no histórico · tá tranquilo (Bin Laden) · 1 ou 2 no LoL = DERROTA do LoL ==========
const STREAK = ["Haze", "Infernus", "Seven", "Rem", "Mo & Krill"];
export const CLStreak: React.FC<{ life: number; lossAt?: number; chillAt?: number; lolAt?: number }> = ({ life, lossAt = 21, chillAt = 56, lolAt = 118 }) => {
  const f = useCurrentFrame();
  const rage = f >= lolAt;
  const sh = shake(f, lolAt + 5, 26, 16, "lr");
  return (
    <DlRoom glow={rage ? "#3a0c08" : "#3a2a14"}>
      <Cam f={f} rx={8} ry={4} z={1 + f * 0.0005} x={sh.x} y={sh.y}>
        <div style={{ filter: rage ? `grayscale(${ease(f, lolAt, 10) * 0.7}) brightness(${1 - ease(f, lolAt, 10) * 0.45})` : undefined }}>
          <Center top={210}>
            <DlTitle f={f} at={0} size={58} ls={0.12}>
              HISTÓRICO DE PARTIDAS
            </DlTitle>
          </Center>
          <Center top={320}>
            <DlPanel w={960}>
              {STREAK.map((h, i) => {
                const at = lossAt + i * 6;
                const on = ease(f, at, 9);
                return (
                  <div key={h} style={{ display: "flex", alignItems: "center", gap: 26, height: 150, padding: "0 28px", borderBottom: `1px solid ${D.line}`, opacity: on, transform: `translateY(${(1 - on) * -40}px)` }}>
                    <div style={{ width: 92, height: 125, overflow: "hidden", border: `2px solid ${D.line}` }}>
                      <Img src={HERO[h]} style={{ width: 92, height: 125, objectFit: "cover" }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: RD, fontWeight: 700, fontSize: 40, color: D.red, letterSpacing: 3 }}>DERROTA</div>
                      <div style={{ fontFamily: RD, fontWeight: 600, fontSize: 26, color: D.dim }}>{h}</div>
                    </div>
                    <div style={{ fontFamily: RD, fontWeight: 600, fontSize: 30, color: D.cream }}>{["31:04", "27:48", "35:12", "29:40", "33:05"][i]}</div>
                  </div>
                );
              })}
            </DlPanel>
          </Center>
          <Center top={1135}>
            <DlTitle f={f} at={lossAt + 30} size={64} c={D.cream} font={RD} ls={0.08}>
              5 SEGUIDAS
            </DlTitle>
          </Center>
        </div>
      </Cam>
      {/* 1 ou 2 no LoL: a placa de DERROTA do LoL cai por cima e treme tudo */}
      <Center top={600} style={{ zIndex: 50 }}>
        <Plate f={f} at={lolAt} w={980} banner />
      </Center>
      <Flash f={f} ts={[lolAt]} pk={0.4} c="#ff4a2f" />
    </DlRoom>
  );
};

// ========== 11) a comunidade: chat do LoL × chat do Deadlock · exceções que passam do ponto (silenciado) ==========
const LOLCHAT = [
  ["[Todos]", "Yasuo", "ff 15", "#ff6464"],
  ["[Todos]", "Draven", "time lixo ********", "#ff6464"],
  ["[Equipe]", "Jinx", "reporta o jungle", "#53a9ff"],
  ["[Todos]", "Zed", "ez", "#ff6464"],
] as const;
const DLCHAT = [
  ["EQUIPE", "Haze", "boa rotação, mano", D.amber],
  ["EQUIPE", "Seven", "valeu pela cura", D.amber],
  ["TODOS", "Infernus", "gg, jogo bom demais", D.sapph],
] as const;
export const CLChats: React.FC<{ life: number; commAt?: number; diffAt?: number; excAt?: number; pontoAt?: number }> = ({ life, commAt = 28, diffAt = 53, excAt = 155, pontoAt = 243 }) => {
  const f = useCurrentFrame();
  const back = ease(f, diffAt, 14);
  const muted = f >= pontoAt;
  return (
    <DlRoom glow="#2a1f12">
      <Cam f={f} rx={6} z={1}>
        {/* chat do LoL: fica pra trás, cinza */}
        <div style={{ position: "absolute", left: 60, top: 230, width: 960, transform: `translateY(${-back * 30}px) scale(${1 - back * 0.12})`, transformOrigin: "50% 0", filter: `grayscale(${back}) brightness(${1 - back * 0.5})`, opacity: ease(f, 0, 8) }}>
          <div style={{ fontFamily: BF, fontWeight: 700, fontSize: 30, letterSpacing: 6, color: C.gold, marginBottom: 12 }}>CHAT · LEAGUE OF LEGENDS</div>
          <div style={{ padding: "20px 26px", background: "rgba(0,0,0,0.6)", border: `1px solid ${C.line}` }}>
            {LOLCHAT.map(([ch, who, msg, col], i) => (
              <div key={i} style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: 36, lineHeight: 1.55, color: "#fff", opacity: ease(f, 2 + i * 6, 5), whiteSpace: "nowrap" }}>
                <span style={{ color: col }}>
                  {ch} {who}:
                </span>{" "}
                {msg}
              </div>
            ))}
          </div>
        </div>
        {/* chat do Deadlock */}
        {f >= diffAt - 2 ? (
          <div style={{ position: "absolute", left: 60, top: 640, width: 960, opacity: ease(f, diffAt, 10), transform: `translateY(${(1 - ease(f, diffAt, 14)) * 80}px)` }}>
            <div style={{ fontFamily: RV, fontWeight: 700, fontSize: 40, letterSpacing: 4, color: D.cream, marginBottom: 12 }}>CHAT · DEADLOCK</div>
            <DlPanel w={960} style={{ padding: "22px 28px" }}>
              {DLCHAT.map(([ch, who, msg, col], i) => (
                <div key={i} style={{ fontFamily: RD, fontWeight: 600, fontSize: 38, lineHeight: 1.6, color: D.cream, opacity: ease(f, diffAt + 8 + i * 12, 6), whiteSpace: "nowrap" }}>
                  <span style={{ color: col, fontWeight: 700 }}>
                    [{ch}] {who}:
                  </span>{" "}
                  {msg}
                </div>
              ))}
              {/* a exceção: passa do ponto e é silenciado */}
              {f >= excAt ? (
                <div style={{ position: "relative", fontFamily: RD, fontWeight: 600, fontSize: 38, lineHeight: 1.6, color: muted ? D.dim : D.cream, opacity: ease(f, excAt, 6) * (muted ? 0.55 : 1), whiteSpace: "nowrap" }}>
                  <span style={{ color: D.red, fontWeight: 700 }}>[TODOS] Rem:</span> {"******* ********"}
                  {muted ? <div style={{ position: "absolute", left: 0, top: "52%", height: 4, width: `${ease(f, pontoAt, 8) * 100}%`, background: D.red }} /> : null}
                </div>
              ) : null}
              {muted ? (
                <div style={{ marginTop: 10, fontFamily: RD, fontWeight: 700, fontSize: 28, letterSpacing: 4, color: D.red, opacity: ease(f, pontoAt + 6, 6) }}>JOGADOR SILENCIADO</div>
              ) : null}
            </DlPanel>
          </div>
        ) : null}
        {/* elogio recebido (o "commend" do Deadlock) */}
        {f >= diffAt + 48 && f < excAt + 10 ? (
          <div style={{ position: "absolute", right: 70, top: 600, padding: "14px 26px", background: "rgba(30,60,40,0.92)", border: `2px solid ${D.green}`, fontFamily: RD, fontWeight: 700, fontSize: 30, letterSpacing: 3, color: D.green, opacity: ease(f, diffAt + 48, 8) * (1 - ease(f, excAt, 10)), transform: `translateX(${(1 - ease(f, diffAt + 48, 10)) * 120}px)` }}>
            + ELOGIO RECEBIDO
          </div>
        ) : null}
      </Cam>
    </DlRoom>
  );
};

// ========== 12) o potencial · migrar: os campeões do LoL viram heróis no grupo do Deadlock · procurar partida ==========
const PARTY = ["Haze", "Seven", "Infernus", "Celeste", "Apollo", "Rei dos Ratos"];
const FROM = ["Ahri", "Darius", "Jinx", "Yasuo", "Thresh", "Zed"];
export const CLParty: React.FC<{ life: number; peopleAt?: number; potAt?: number; migAt?: number }> = ({ life, peopleAt = 74, potAt = 122, migAt = 198 }) => {
  const f = useCurrentFrame();
  const findAt = migAt + 52;
  return (
    <DlRoom glow="#1d3a36">
      <Cam f={f} rx={10 - 6 * ease(f, potAt, 30)} z={1 + 0.06 * ease(f, potAt, 40)}>
        <Center top={230}>
          <Img src={MG("dl_logo.png")} style={{ width: 560, opacity: ease(f, 0, 12), filter: `drop-shadow(0 0 ${20 + 30 * ease(f, potAt, 20)}px rgba(95,242,214,0.45))` }} />
        </Center>
        <Center top={420}>
          <DlTitle f={f} at={6} size={34} c={D.dim} font={RD} ls={0.3}>
            SEU GRUPO
          </DlTitle>
        </Center>
        {/* 6 vagas do grupo (Deadlock é 6 contra 6) */}
        <div style={{ position: "absolute", left: 60, top: 470, width: 960, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
          {PARTY.map((h, i) => {
            const land = migAt + 8 + i * 5;
            const filled = f >= land;
            const glow = ease(f, potAt + i * 4, 10);
            return (
              <div key={h} style={{ position: "relative", height: 300, border: `2px solid ${filled ? D.amber : D.line}`, background: "rgba(20,17,13,0.85)", boxShadow: filled ? `0 0 ${30 * (1 - ease(f, land, 16)) + 10}px ${D.amber}` : `0 0 ${24 * glow}px ${D.soul}55`, overflow: "hidden", opacity: ease(f, peopleAt - 30 + i * 3, 10) }}>
                {filled ? (
                  <Img src={HERO[h]} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: ease(f, land, 8), transform: `scale(${1.15 - 0.15 * ease(f, land, 10)})` }} />
                ) : (
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width={80} height={80} viewBox="0 0 80 80" style={{ opacity: 0.4 + glow * 0.5 }}>
                      <path d="M40 14 V66 M14 40 H66" stroke={glow > 0.5 ? D.soul : D.dim} strokeWidth={5} strokeLinecap="round" />
                    </svg>
                  </div>
                )}
                {filled ? <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "10px 0", background: "linear-gradient(180deg, rgba(0,0,0,0), rgba(0,0,0,0.9))", textAlign: "center", fontFamily: RD, fontWeight: 700, fontSize: 26, color: D.cream }}>{h}</div> : null}
              </div>
            );
          })}
        </div>
        {/* os campeões do LoL atravessando de um jogo pro outro */}
        {FROM.map((c, i) => {
          const t0 = migAt - 14 + i * 5;
          const t1 = migAt + 8 + i * 5;
          if (f < t0 || f > t1 + 2) return null;
          const p = interpolate(f, [t0, t1], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
          const tx = 60 + (i % 3) * 328 + 156;
          const ty = 470 + Math.floor(i / 3) * 324 + 150;
          const x = -120 + (tx + 120) * p;
          const y = 1250 + (ty - 1250) * p - Math.sin(p * Math.PI) * 260;
          return <Img key={c} src={R(`cl/icons/${c}.png`)} style={{ position: "absolute", left: x - 60, top: y - 60, width: 120, height: 120, border: `3px solid ${C.gold}`, transform: `rotate(${(1 - p) * -30}deg) scale(${1 - p * 0.3})`, opacity: 1 - ease(f, t1 - 2, 4), zIndex: 30, boxShadow: `0 0 24px ${C.gold}` }} />;
        })}
        {/* procurar partida */}
        <Center top={1125}>
          {f >= migAt + 30 ? (
            <div style={{ padding: "18px 70px", background: f >= findAt ? "#3d2a10" : `linear-gradient(180deg, ${D.amber}, #a8671a)`, border: `2px solid ${D.amber}`, fontFamily: RD, fontWeight: 700, fontSize: 40, letterSpacing: 5, color: f >= findAt ? D.amber : "#1a1006", opacity: ease(f, migAt + 30, 8), transform: `scale(${f >= findAt && f < findAt + 4 ? 0.95 : 1})`, whiteSpace: "nowrap" }}>
              {f >= findAt ? `PROCURANDO PARTIDA  0:${String(Math.floor((f - findAt) / 30)).padStart(2, "0")}` : "PROCURAR PARTIDA"}
            </div>
          ) : null}
        </Center>
        {f >= migAt + 30 ? <Cursor x={path(f, [[migAt + 30, 980, 1500], [findAt - 2, 600, 1165]]).x} y={path(f, [[migAt + 30, 980, 1500], [findAt - 2, 600, 1165]]).y} f={f} clicks={[findAt]} /> : null}
      </Cam>
    </DlRoom>
  );
};

// ========== 13) um campeonato: chave do torneio · MAJOR de Deadlock · CBLOL de Deadlock · qual o nome? · comentários ==========
export const CLBracket: React.FC<{ life: number; champAt?: number; majorAt?: number; cblolAt?: number; nameAt?: number; commAt?: number }> = ({ life, champAt = 31, majorAt = 70, cblolAt = 141, nameAt = 202, commAt = 256 }) => {
  const f = useCurrentFrame();
  const draw = ease(f, champAt - 20, 40);
  const word = f >= nameAt ? "?" : f >= cblolAt ? "CBLOL" : f >= majorAt ? "MAJOR" : "";
  const wAt = f >= nameAt ? nameAt : f >= cblolAt ? cblolAt : majorAt;
  const wp = ease(f, wAt, 8);
  // chave: 8 vagas → 4 → 2 → final (desenhada com a linha correndo)
  const L = (x1: number, y1: number, x2: number, y2: number, k: number) => {
    const p = interpolate(draw, [k * 0.25, k * 0.25 + 0.35], [0, 1], clamp);
    return <path d={`M${x1} ${y1} H${(x1 + x2) / 2} V${y2} H${x2}`} fill="none" stroke={D.amber} strokeWidth={4} strokeOpacity={0.8} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />;
  };
  const left = [0, 1, 2, 3].map((i) => 560 + i * 120);
  const right = left;
  return (
    <DlRoom glow="#3a2a14">
      <Cam f={f} rx={10} z={1 + f * 0.0003}>
        {/* o nome do campeonato, com a palavra que troca */}
        <Center top={220}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 26 }}>
            <div style={{ minWidth: 330, height: 120, borderBottom: `4px solid ${D.amber}`, display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 6, opacity: ease(f, 0, 10) }}>
              {word ? (
                <div style={{ fontFamily: word === "CBLOL" ? BF : RV, fontWeight: 700, fontSize: word === "?" ? 120 : 104, lineHeight: 1, color: word === "CBLOL" ? C.goldL : D.cream, opacity: wp, transform: `translateY(${(1 - wp) * -40}px)`, filter: wp < 1 ? `blur(${(1 - wp) * 8}px)` : undefined }}>
                  {word === "?" ? <span style={{ opacity: Math.floor(f / 10) % 2 ? 0.35 : 1 }}>?</span> : word}
                </div>
              ) : null}
            </div>
          </div>
        </Center>
        <Center top={370}>
          <DlTitle f={f} at={6} size={76} ls={0.06}>
            DE DEADLOCK
          </DlTitle>
        </Center>
        {/* a chave */}
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: ease(f, champAt - 24, 12) }}>
          {[0, 1].map((p) => L(150, left[p * 2], 300, (left[p * 2] + left[p * 2 + 1]) / 2, 0))}
          {[0, 1].map((p) => L(150, left[p * 2 + 1], 300, (left[p * 2] + left[p * 2 + 1]) / 2, 0))}
          {[0, 1].map((p) => L(930, right[p * 2], 780, (right[p * 2] + right[p * 2 + 1]) / 2, 0))}
          {[0, 1].map((p) => L(930, right[p * 2 + 1], 780, (right[p * 2] + right[p * 2 + 1]) / 2, 0))}
          {L(300, 620, 440, 740, 1)}
          {L(300, 860, 440, 740, 1)}
          {L(780, 620, 640, 740, 1)}
          {L(780, 860, 640, 740, 1)}
        </svg>
        {[...left.map((y) => [70, y]), ...right.map((y) => [850, y])].map(([x, y], i) => (
          <div key={i} style={{ position: "absolute", left: x, top: y - 48, width: 160, height: 96, background: D.panel, border: `2px solid ${D.line}`, opacity: ease(f, champAt - 24 + i * 2, 8), display: "flex", alignItems: "center", justifyContent: "center", fontFamily: RD, fontWeight: 700, fontSize: 28, color: D.dim, letterSpacing: 3 }}>
            TIME {i + 1}
          </div>
        ))}
        {/* troféu no meio (traço dourado) */}
        <div style={{ position: "absolute", left: 540 - 110, top: 640, width: 220, height: 220, opacity: ease(f, champAt + 10, 12), transform: `scale(${0.8 + 0.2 * ease(f, champAt + 10, 14)})`, filter: `drop-shadow(0 0 ${20 + Math.sin(f / 8) * 8}px ${D.amber})` }}>
          <svg width={220} height={220} viewBox="0 0 220 220">
            <defs>
              <linearGradient id="cltro" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#fbe6b0" />
                <stop offset="0.6" stopColor="#d08f2c" />
                <stop offset="1" stopColor="#6b4512" />
              </linearGradient>
            </defs>
            <path d="M60 30 H160 V80 a50 50 0 0 1 -100 0 Z" fill="url(#cltro)" />
            <path d="M60 44 H30 a30 30 0 0 0 34 46 M160 44 H190 a30 30 0 0 1 -34 46" fill="none" stroke="url(#cltro)" strokeWidth={10} />
            <rect x={98} y={128} width={24} height={36} fill="url(#cltro)" />
            <path d="M70 196 L80 164 H140 L150 196 Z" fill="url(#cltro)" />
          </svg>
        </div>
        {/* caixa de comentário do TikTok */}
        {f >= commAt - 4 ? (
          <Center top={1060}>
            <div style={{ width: 940, height: 112, borderRadius: 56, background: "rgba(255,255,255,0.12)", border: "2px solid rgba(255,255,255,0.25)", display: "flex", alignItems: "center", gap: 22, padding: "0 36px", opacity: ease(f, commAt, 8), transform: `translateY(${(1 - ease(f, commAt, 12)) * 80}px)` }}>
              <svg width={52} height={52} viewBox="0 0 52 52">
                <path d="M26 6 C14 6 5 14 5 24 c0 6 3 11 8 14 l-2 9 l10-6 c2 0 3 1 5 1 c12 0 21-8 21-18 S38 6 26 6 Z" fill="none" stroke="#fff" strokeWidth={4} strokeLinejoin="round" />
              </svg>
              <div style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: 38, color: "rgba(255,255,255,0.75)", whiteSpace: "nowrap" }}>
                <Typed f={f} at={commAt + 14} text="____ de Deadlock" cps={0.6} />
              </div>
            </div>
          </Center>
        ) : null}
      </Cam>
      <Flash f={f} ts={[cblolAt]} pk={0.14} c={C.gold} />
    </DlRoom>
  );
};

// ========== 14) a comunidade só aumenta · engajamento · no LoL nunca · "não quer dizer porra nenhuma" (o gráfico cai) ==========
export const CLGraph: React.FC<{ life: number; commAt?: number; growAt?: number; engAt?: number; lolAt?: number; zeroAt?: number }> = ({ life, commAt = 50, growAt = 95, engAt = 167, lolAt = 299, zeroAt = 353 }) => {
  const f = useCurrentFrame();
  const W = 860;
  const H = 560;
  const dlp = interpolate(f, [commAt - 20, growAt + 30], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const lolp = interpolate(f, [lolAt - 10, lolAt + 22], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const ptsDl = Array.from({ length: 41 }).map((_, i) => {
    const x = (i / 40) * W;
    const y = H - 30 - (Math.pow(i / 40, 1.9) * (H - 90) + Math.sin(i * 1.3) * 14 * (i / 40));
    return [x, y];
  });
  const ptsLol = Array.from({ length: 41 }).map((_, i) => [(i / 40) * W, H - 60 + Math.sin(i * 0.9) * 6]);
  const d = (pts: number[][]) => pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const fall = interpolate(f, [zeroAt, zeroAt + 26], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  const tip = ptsDl[Math.max(0, Math.min(40, Math.round(dlp * 40)))];
  const ENG = [
    [0.62, "M26 44 C10 32 4 24 4 15 a11 11 0 0 1 22 -4 a11 11 0 0 1 22 4 c0 9 -6 17 -22 29 Z"],
    [0.78, "M26 6 C14 6 5 14 5 24 c0 6 3 11 8 14 l-2 9 l10-6 c2 0 3 1 5 1 c12 0 21-8 21-18 S38 6 26 6 Z"],
    [0.92, "M30 6 L48 22 L30 38 V28 C18 28 10 32 4 44 C6 28 14 18 30 16 Z"],
  ] as const;
  return (
    <DlRoom glow="#1d3a36">
      <Cam f={f} rx={8} z={1 + f * 0.0003}>
        <div style={{ position: "absolute", left: 110, top: 360, width: W, height: H, transform: `translateY(${fall * 1300}px) rotate(${fall * 38}deg)`, transformOrigin: "100% 100%", opacity: ease(f, 0, 10) }}>
          {/* grade */}
          <svg width={W} height={H} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
            {[0, 1, 2, 3, 4].map((k) => (
              <line key={k} x1={0} x2={W} y1={30 + k * ((H - 60) / 4)} y2={30 + k * ((H - 60) / 4)} stroke={D.line} strokeWidth={1.5} strokeDasharray="6 10" />
            ))}
            <line x1={0} x2={0} y1={0} y2={H - 30} stroke={D.dim} strokeWidth={2} />
            <line x1={0} x2={W} y1={H - 30} y2={H - 30} stroke={D.dim} strokeWidth={2} />
            {/* Deadlock subindo */}
            <path d={d(ptsDl)} fill="none" stroke={D.soul} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - dlp} style={{ filter: `drop-shadow(0 0 12px ${D.soul})` }} />
            {/* LoL parado */}
            <path d={d(ptsLol)} fill="none" stroke={C.gold2} strokeWidth={7} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - lolp} />
            {dlp > 0.02 ? <circle cx={tip[0]} cy={tip[1]} r={14} fill={D.soul} style={{ filter: `drop-shadow(0 0 16px ${D.soul})` }} /> : null}
          </svg>
          {/* curtida, comentário, compartilhar saindo da linha */}
          {ENG.map(([p, dd], i) => {
            const at = engAt + i * 10;
            if (f < at) return null;
            const pt = ptsDl[Math.round(p * 40)];
            const k = ease(f, at, 12);
            return (
              <svg key={i} width={52} height={52} viewBox="0 0 52 52" style={{ position: "absolute", left: pt[0] - 40, top: pt[1] - 60 - k * 50, transform: `scale(${1.4 * k})`, opacity: 1 - ease(f, at + 60, 20) * 0.4 }}>
                <path d={dd} fill={i === 0 ? "#fe2c55" : "#fff"} />
              </svg>
            );
          })}
          <div style={{ position: "absolute", right: -10, top: -60, fontFamily: RV, fontWeight: 700, fontSize: 58, color: D.soul, opacity: ease(f, growAt, 10), textShadow: "0 4px 20px #000" }}>DEADLOCK</div>
          {f >= lolAt ? <div style={{ position: "absolute", right: 0, top: H - 140, fontFamily: BF, fontWeight: 700, fontSize: 46, color: C.gold2, letterSpacing: 4, opacity: ease(f, lolAt + 10, 10) }}>LOL</div> : null}
        </div>
        <Center top={240}>
          <DlTitle f={f} at={commAt} size={46} c={D.dim} font={RD} ls={0.25}>
            COMUNIDADE DEADLOCK
          </DlTitle>
        </Center>
      </Cam>
    </DlRoom>
  );
};

// faixa fixa do link (10/11, pedido dele): o Discord só entra pelo bio.blies.live (o link ainda não cabe na bio do TikTok).
// Fica na tela do "link do meu Discord" até o último quadro, para dar tempo de anotar.
const LinkBar: React.FC<{ f: number; at: number }> = ({ f, at }) => {
  if (f < at) return null;
  const p = ease(f, at, 12);
  const glow = 0.5 + 0.5 * Math.sin((f - at) / 9);
  return (
    <div style={{ position: "absolute", left: 40, right: 40, top: 1075, zIndex: 85, opacity: p, transform: `translateY(${(1 - p) * 60}px)` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 26, padding: "18px 30px", background: "rgba(12,10,7,0.96)", border: `3px solid ${D.amber}`, boxShadow: `0 0 ${18 + glow * 26}px ${D.amber}88, 0 20px 50px rgba(0,0,0,0.85)` }}>
        <Img src={R("cl/ratazanas.png")} style={{ width: 130, height: 130, borderRadius: "50%" }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: RD, fontWeight: 700, fontSize: 28, letterSpacing: 5, color: D.amber }}>ACESSE PARA ENTRAR NO DISCORD</div>
          <div style={{ fontFamily: RD, fontWeight: 700, fontSize: 86, lineHeight: 1.05, color: "#ffffff", letterSpacing: 1, whiteSpace: "nowrap" }}>bio.blies.live</div>
          <div style={{ fontFamily: RD, fontWeight: 600, fontSize: 30, color: D.cream, whiteSpace: "nowrap" }}>Discord · Ratazanas do Deadlock</div>
        </div>
      </div>
    </div>
  );
};

// ========== 15) comenta → mensagem no privado → convite do Discord → convite do Deadlock ==========
export const CLJoin: React.FC<{ life: number; commentAt?: number; dmAt?: number; discordAt?: number; commAt?: number; inviteAt?: number }> = ({ life, commentAt = 74, dmAt = 121, discordAt = 229, commAt = 271, inviteAt = 375 }) => {
  const f = useCurrentFrame();
  const joinClick = commAt + 6;
  const accept = inviteAt + 34;
  const stage = f < discordAt - 8 ? 0 : f < inviteAt - 8 ? 1 : 2;
  const fade = (a: number, b: number) => ease(f, a, 10) * (1 - ease(f, b, 10));
  const cur =
    stage === 1
      ? path(f, [
          [discordAt, 980, 1300],
          [joinClick - 2, 560, 960],
          [joinClick + 30, 620, 1020],
        ])
      : path(f, [
          [inviteAt, 980, 1300],
          [accept - 2, 380, 905],
          [accept + 30, 420, 950],
        ]);
  return (
    <AbsoluteFill style={{ background: "#0c0d10", overflow: "hidden" }}>
      <Cam f={f} rx={6} z={1}>
        {/* 1) comentário e a mensagem no privado (o jeito do TikTok) */}
        <div style={{ position: "absolute", inset: 0, opacity: fade(0, discordAt - 10) }}>
          <div style={{ position: "absolute", left: 70, top: 420, width: 940, display: "flex", gap: 26, opacity: ease(f, 0, 10) }}>
            <div style={{ width: 96, height: 96, borderRadius: "50%", background: "linear-gradient(135deg, #3a3f4a, #20242b)", border: "2px solid #4a505c", flexShrink: 0 }} />
            <div>
              <div style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: 32, color: "rgba(255,255,255,0.55)" }}>você</div>
              <div style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: 46, color: "#fff", marginTop: 6 }}>
                <Typed f={f} at={commentAt} text="quero jogar!" cps={0.7} caret={f < dmAt} />
              </div>
              <div style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: 28, color: "rgba(255,255,255,0.45)", marginTop: 10 }}>agora · Responder</div>
            </div>
          </div>
          {f >= dmAt ? (
            <div style={{ position: "absolute", left: 70, right: 70, top: 720 }}>
              <div style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: 30, color: "rgba(255,255,255,0.5)", textAlign: "center", marginBottom: 26, opacity: ease(f, dmAt, 8) }}>Mensagens</div>
              <div style={{ display: "flex", justifyContent: "flex-end", opacity: ease(f, dmAt + 4, 8), transform: `translateY(${(1 - ease(f, dmAt + 4, 10)) * 40}px)` }}>
                <div style={{ maxWidth: 680, padding: "24px 32px", borderRadius: 36, background: "#2f7cf6", fontFamily: "Arial, Helvetica, sans-serif", fontSize: 42, color: "#fff" }}>e aí, quero jogar Deadlock</div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-start", marginTop: 22, opacity: ease(f, dmAt + 40, 8), transform: `translateY(${(1 - ease(f, dmAt + 40, 10)) * 40}px)` }}>
                <div style={{ maxWidth: 680, padding: "24px 32px", borderRadius: 36, background: "#2a2c33", fontFamily: "Arial, Helvetica, sans-serif", fontSize: 42, color: "#fff" }}>bora! entra no bio.blies.live</div>
              </div>
            </div>
          ) : null}
        </div>
        {/* 2) o convite do Discord (servidor em construção, a comunidade) */}
        {stage >= 1 ? (
          <div style={{ position: "absolute", inset: 0, opacity: fade(discordAt - 8, inviteAt - 10) }}>
            <Center top={520}>
              <div style={{ width: 900, padding: 40, borderRadius: 16, background: "#2b2d31", boxShadow: "0 30px 80px rgba(0,0,0,0.7)", transform: `translateY(${(1 - ease(f, discordAt, 12)) * 80}px)` }}>
                <div style={{ fontFamily: "Arial, Helvetica, sans-serif", fontWeight: 700, fontSize: 26, color: "#b5bac1", letterSpacing: 1 }}>VOCÊ FOI CONVIDADO PARA UM SERVIDOR</div>
                <div style={{ display: "flex", alignItems: "center", gap: 28, marginTop: 28 }}>
                  <div style={{ width: 120, height: 120, borderRadius: 30, background: "#111214", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                    <Img src={R("cl/ratazanas.png")} style={{ width: 120 }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "Arial, Helvetica, sans-serif", fontWeight: 700, fontSize: 44, color: "#f2f3f5", whiteSpace: "nowrap" }}>Ratazanas do Deadlock</div>
                    <div style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: 30, color: "#b5bac1", marginTop: 6 }}>a comunidade do Blies</div>
                  </div>
                  <div style={{ padding: "22px 40px", borderRadius: 10, background: f >= joinClick ? "#248046" : "#5865f2", fontFamily: "Arial, Helvetica, sans-serif", fontWeight: 700, fontSize: 36, color: "#fff", transform: `scale(${f >= joinClick && f < joinClick + 4 ? 0.95 : 1})` }}>{f >= joinClick ? "Entrou" : "Entrar"}</div>
                </div>
              </div>
            </Center>
          </div>
        ) : null}
        {/* 3) dentro do Deadlock: o convite pro grupo */}
        {stage === 2 ? (
          <div style={{ position: "absolute", inset: 0, opacity: ease(f, inviteAt - 8, 10) }}>
            <AbsoluteFill style={{ background: D.bg }}>
              <Img src={MG("dl_hero.jpg")} style={{ position: "absolute", height: 1920, left: -900, filter: "brightness(0.35) blur(4px)" }} />
            </AbsoluteFill>
            <Center top={560}>
              <DlPanel w={900} c={D.amber} style={{ padding: "36px 40px", transform: `translateY(${(1 - ease(f, inviteAt, 14)) * -120}px)` }}>
                <div style={{ fontFamily: RD, fontWeight: 700, fontSize: 32, letterSpacing: 6, color: D.amber }}>CONVITE PARA O GRUPO</div>
                <div style={{ fontFamily: RV, fontWeight: 700, fontSize: 58, color: D.cream, marginTop: 14 }}>A galera te chamou</div>
                <div style={{ display: "flex", gap: 22, marginTop: 30 }}>
                  <div style={{ padding: "18px 54px", background: f >= accept ? "#2d4a2a" : `linear-gradient(180deg, ${D.amber}, #a8671a)`, border: `2px solid ${f >= accept ? D.green : D.amber}`, fontFamily: RD, fontWeight: 700, fontSize: 36, letterSpacing: 4, color: f >= accept ? D.green : "#1a1006", transform: `scale(${f >= accept && f < accept + 4 ? 0.95 : 1})` }}>{f >= accept ? "NO GRUPO" : "ACEITAR"}</div>
                  <div style={{ padding: "18px 40px", border: `2px solid ${D.line}`, fontFamily: RD, fontWeight: 700, fontSize: 36, letterSpacing: 4, color: D.dim, opacity: f >= accept ? 0 : 1 }}>RECUSAR</div>
                </div>
              </DlPanel>
            </Center>
          </div>
        ) : null}
        {stage >= 1 ? <Cursor x={cur.x} y={cur.y} f={f} clicks={stage === 1 ? [joinClick] : [accept]} /> : null}
      </Cam>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 95% 80% at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.6) 100%)", pointerEvents: "none", zIndex: 60 }} />
      <LinkBar f={f} at={discordAt - 30} />
      <Grain />
    </AbsoluteFill>
  );
};

// ========== 16) fim: Blies · live todo dia (anel piscando) · Half-Life, jogos, música · seguir · tamo junto ==========
export const CLProfile: React.FC<{ life: number; nameAt?: number; liveAt?: number; blinkAt?: number; hlAt?: number; gamesAt?: number; musicAt?: number; followAt?: number; byeAt?: number }> = ({ life, nameAt = 20, liveAt = 45, blinkAt = 160, hlAt = 354, gamesAt = 373, musicAt = 389, followAt = 425, byeAt = 511 }) => {
  const f = useCurrentFrame();
  const pulse = f >= blinkAt ? 0.5 + 0.5 * Math.sin((f - blinkAt) / 4) : 0;
  const click = followAt + 12;
  const topics = [
    [hlAt, "HALF-LIFE"],
    [gamesAt, "JOGOS"],
    [musicAt, "MÚSICA"],
  ] as const;
  return (
    <DlRoom glow="#3a1430">
      <Cam f={f} rx={6} z={1 + f * 0.00025}>
        {/* foto com o anel de live */}
        <Center top={200}>
          <div style={{ position: "relative", width: 340, height: 340, opacity: ease(f, 0, 12), transform: `scale(${0.85 + 0.15 * ease(f, 0, 16)})` }}>
            {f >= liveAt ? (
              <div style={{ position: "absolute", inset: -18, borderRadius: "50%", background: `conic-gradient(from ${f * 4}deg, #ff0050, #ff7a00, #ff0050, #c600ff, #ff0050)`, opacity: ease(f, liveAt, 8) * (0.55 + pulse * 0.45), filter: `drop-shadow(0 0 ${20 + pulse * 30}px #ff0050)` }} />
            ) : null}
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `8px solid ${D.bg}`, overflow: "hidden" }}>
              <Img src={DL_("blies.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            {f >= liveAt ? (
              <div style={{ position: "absolute", left: "50%", bottom: -28, transform: `translateX(-50%) scale(${1 + pulse * 0.06})`, padding: "6px 26px", borderRadius: 8, background: "#ff0050", fontFamily: "Arial, Helvetica, sans-serif", fontWeight: 900, fontSize: 34, color: "#fff", letterSpacing: 2, opacity: ease(f, liveAt, 6) }}>LIVE</div>
            ) : null}
          </div>
        </Center>
        <Center top={590}>
          <DlTitle f={f} at={nameAt} size={128} ls={0.08}>
            BLIES
          </DlTitle>
        </Center>
        <Center top={735}>
          <DlTitle f={f} at={liveAt + 6} size={38} c={D.amber} font={RD} ls={0.18}>
            LIVE DE DEADLOCK · TODO DIA
          </DlTitle>
        </Center>
        {/* outros temas */}
        <Center top={815}>
          <div style={{ display: "flex", gap: 22 }}>
            {topics.map(([at, t], i) =>
              f >= at ? (
                <div key={t} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 26px", border: `2px solid ${D.line}`, background: D.panel, opacity: ease(f, at, 8), transform: `translateY(${(1 - ease(f, at, 10)) * 30}px)` }}>
                  {i === 0 ? <Img src={MG("lambda.png")} style={{ width: 44, height: 44 }} /> : null}
                  {i === 1 ? (
                    <svg width={48} height={36} viewBox="0 0 48 36">
                      <path d="M10 6 H38 a8 8 0 0 1 8 8 l-2 14 a6 6 0 0 1 -10 3 l-5 -5 H19 l-5 5 a6 6 0 0 1 -10 -3 L2 14 a8 8 0 0 1 8 -8 Z" fill={D.cream} />
                    </svg>
                  ) : null}
                  {i === 2 ? (
                    <svg width={44} height={40} viewBox="0 0 44 40">
                      {[6, 14, 22, 30, 38].map((x, k) => (
                        <rect key={x} x={x - 3} y={20 - (6 + Math.abs(Math.sin(f / 5 + k)) * 14)} width={6} height={(6 + Math.abs(Math.sin(f / 5 + k)) * 14) * 2} rx={3} fill={D.cream} />
                      ))}
                    </svg>
                  ) : null}
                  <span style={{ fontFamily: RD, fontWeight: 700, fontSize: 34, letterSpacing: 3, color: D.cream }}>{t}</span>
                </div>
              ) : null,
            )}
          </div>
        </Center>
        {/* seguir */}
        <Center top={930}>
          {f >= followAt - 6 && f < byeAt ? (
            <div style={{ padding: "20px 90px", borderRadius: 8, background: f >= click ? "#2f3036" : "#fe2c55", fontFamily: "Arial, Helvetica, sans-serif", fontWeight: 700, fontSize: 44, color: "#fff", opacity: ease(f, followAt - 6, 8) * (1 - ease(f, byeAt - 8, 8)), transform: `scale(${f >= click && f < click + 4 ? 0.95 : 1})` }}>{f >= click ? "Seguindo" : "Seguir"}</div>
          ) : null}
        </Center>
        {f >= followAt - 6 && f < byeAt ? <Cursor x={path(f, [[followAt - 6, 980, 1420], [click - 2, 600, 970], [click + 30, 640, 1000]]).x} y={path(f, [[followAt - 6, 980, 1420], [click - 2, 600, 970], [click + 30, 640, 1000]]).y} f={f} clicks={[click]} /> : null}
        <Center top={925}>
          <DlTitle f={f} at={byeAt} size={88} c={D.amber} ls={0.06}>
            TAMO JUNTO
          </DlTitle>
        </Center>
      </Cam>
    </DlRoom>
  );
};

// 10/11: peças do Deadlock reaproveitadas no "Lash atrevido" (LA.tsx)
export { DlRoom, DlTitle, DlPanel, Typed, D, RV, RD, HERO, LinkBar };
