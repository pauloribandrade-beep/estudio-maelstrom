import React from "react";
import { AbsoluteFill, Easing, Img, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { FONT, MONO } from "./overlays";
import { C, Clip, HL, INOUT, OUT, lerp, rnd } from "./hl3";

// Segunda versão das cenas da 1A.2 (revisão do Paulo, 2026-09-30).
// Tempos das props em QUADROS relativos à cena.

const E = (e: (t: number) => number) => ({ ...C, easing: e });
const mono = (size: number, color = HL.dim, ls = 4): React.CSSProperties => ({ fontFamily: MONO, fontSize: size, letterSpacing: ls, textTransform: "uppercase", color });

// ---------------------------------------------------------------------------------------------
// TELA DIVIDIDA: Episode Two (Eli morre) | Alyx (Eli vivo entrega o pé de cabra). Em `wipeAt` a
// divisória de luz corre para a esquerda e o Alyx toma a tela; em `gmanAt` corta para o G-Man.
export const HLSplitEli: React.FC<{
  life: number;
  left: { src: string; from: number };
  right: { src: string; from: number };
  gman: { src: string; from: number };
  wipeAt?: number;
  gmanAt?: number;
  splitAt?: number;
  credit?: string;
}> = ({ life, left, right, gman, wipeAt = 130, gmanAt = 200, splitAt = 0, credit }) => {
  const f = useCurrentFrame();
  const enter = lerp(f, 0, 14, 0, 1, INOUT);
  const w = lerp(f, wipeAt, wipeAt + 22, 0, 1, E(Easing.inOut(Easing.cubic)));
  // 1) só o Eli morto em tela cheia → 2) em `splitAt` a divisória entra pela direita até o meio → 3) em `wipeAt` corre para a esquerda
  const s1 = splitAt > 0 ? lerp(f, splitAt, splitAt + 20, 0, 1, E(Easing.inOut(Easing.cubic))) : 1;
  const split = 1920 - s1 * 960 - w * 960; // x da divisória
  const lab = (x: number, top: string, sub: string, o: number, align: "left" | "right") => (
    <div style={{ position: "absolute", top: 70, [align]: x, textAlign: align, opacity: o }}>
      <div style={{ ...mono(18, HL.orange, 5) }}>{top}</div>
      <div style={{ fontFamily: FONT, fontWeight: 750, fontSize: 40, color: HL.text, marginTop: 6, textShadow: "0 6px 30px rgba(0,0,0,0.8)" }}>{sub}</div>
    </div>
  );
  const push = 1.03 + lerp(f, 0, life, 0, 0.05, C);
  return (
    <AbsoluteFill style={{ opacity: enter }}>
      {f < gmanAt ? (
        <>
          <AbsoluteFill style={{ clipPath: `inset(0 ${1920 - split}px 0 0)` }}>
            <AbsoluteFill style={{ transform: `scale(${push})` }}>
              <Clip src={left.src} from={left.from} />
            </AbsoluteFill>
            <AbsoluteFill style={{ background: "rgba(5,4,10,0.25)" }} />
          </AbsoluteFill>
          <AbsoluteFill style={{ clipPath: `inset(0 0 0 ${split}px)` }}>
            <AbsoluteFill style={{ transform: `scale(${push})` }}>
              <Clip src={right.src} from={right.from} />
            </AbsoluteFill>
          </AbsoluteFill>
          {/* divisória de luz */}
          <div style={{ position: "absolute", left: split - 2, top: 0, width: 4, height: 1080, background: "linear-gradient(rgba(159,216,255,0), #eaf6ff 20%, #eaf6ff 80%, rgba(159,216,255,0))", boxShadow: "0 0 30px 6px rgba(159,216,255,0.55)", opacity: (1 - w * 0.2) * (s1 > 0.02 ? 1 : 0) }} />
          {lab(60, "Episode Two · 2007", "o Eli morre", 1 - w, "left")}
          {lab(60, "Half-Life: Alyx · 2020", "o Eli está vivo", s1, "right")}
        </>
      ) : null}
      {/* G-Man pré-montado desde o início da cena: no corte o vídeo já está carregado (sem fundo vazio) */}
      <Sequence from={gmanAt} premountFor={gmanAt}>
          {/* plano que não cobre a tela: bloco com bordas arredondadas e folga nas laterais */}
          <div
            style={{
              position: "absolute",
              left: 120,
              top: 540 - (1680 * 820) / 1920 / 2,
              width: 1680,
              height: (1680 * 820) / 1920,
              borderRadius: 26,
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.16)",
              boxShadow: "0 40px 120px rgba(0,0,0,0.6)",
              transform: `scale(${1 + lerp(f, gmanAt, life, 0, 0.03, C)})`,
            }}
          >
            <Clip src={gman.src} from={gman.from} style={{ objectFit: "cover" }} />
          </div>
      </Sequence>
      <AbsoluteFill style={{ background: "linear-gradient(0deg, rgba(5,4,10,0.5), rgba(5,4,10,0) 30%)", pointerEvents: "none" }} />
      {credit ? <div style={{ position: "absolute", right: 44, bottom: 34, fontFamily: MONO, fontSize: 15, letterSpacing: 2, color: "rgba(242,240,247,0.45)" }}>{credit}</div> : null}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// PERGUNTAS EM HUD sobre o G-Man em câmera lenta, escurecido: linhas digitadas em mono.
export const HLQuestionsHud: React.FC<{ life: number; bg: { src: string; from: number; rate?: number }; lines: { text: string; at: number; hot?: boolean }[] }> = ({ life, bg, lines }) => {
  const f = useCurrentFrame();
  const o = Math.min(lerp(f, 0, 10, 0, 1, OUT), lerp(f, life - 10, life, 1, 0));
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <AbsoluteFill style={{ filter: "blur(3px) brightness(0.45) saturate(0.6)", transform: `scale(${1.08 + lerp(f, 0, life, 0, 0.05, C)})` }}>
        <Clip src={bg.src} from={bg.from} rate={bg.rate ?? 0.6} style={{ objectFit: "cover" }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "radial-gradient(90% 80% at 50% 50%, rgba(5,4,10,0.1), rgba(5,4,10,0.75))" }} />
      <div style={{ position: "absolute", left: 180, top: 330 }}>
        {lines.map((l, i) => {
          const n = Math.floor(lerp(f, l.at, l.at + l.text.length * 1.3, 0, l.text.length, C));
          if (f < l.at) return null;
          const typing = n < l.text.length;
          return (
            <div key={i} style={{ display: "flex", alignItems: "baseline", gap: 22, marginBottom: 34 }}>
              <span style={{ ...mono(20, l.hot ? HL.orange : "rgba(159,216,255,0.8)", 3) }}>{String(i + 1).padStart(2, "0")}</span>
              <span style={{ fontFamily: MONO, fontSize: 50, color: l.hot ? HL.orange : HL.text, textShadow: l.hot ? "0 0 30px rgba(255,138,31,0.5)" : "0 4px 30px rgba(0,0,0,0.8)" }}>
                {l.text.slice(0, n)}
                <span style={{ opacity: typing || f % 30 < 15 ? 1 : 0, color: HL.orange }}>▍</span>
              </span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// CONTADOR DE DIAS: conta os dias desde o Alyx; em `switchAt` continua subindo até os dias desde o
// Episode Two (troca a data e o rótulo); `yearsAt` mostra "≈ 19 anos"; `bornAt` a linha de quem nasceu.
const Digits: React.FC<{ value: number; size: number; color: string }> = ({ value, size, color }) => {
  const s = Math.round(value).toLocaleString("pt-BR");
  return (
    <span style={{ fontFamily: MONO, fontWeight: 600, fontSize: size, color, letterSpacing: 2, fontVariantNumeric: "tabular-nums" }}>
      {s.split("").map((ch, i) => (
        <span key={i} style={{ display: "inline-block", minWidth: ch === "." ? size * 0.3 : size * 0.6, textAlign: "center" }}>
          {ch}
        </span>
      ))}
    </span>
  );
};
export const HLDayCounter: React.FC<{
  life: number;
  days1?: number;
  days2?: number;
  switchAt?: number;
  countDur2?: number;
  yearsAt?: number;
  bornAt?: number;
  nadaAt?: number;
  backAt?: number;
  lineAt?: number;
  exitDur?: number;
}> = ({ life, days1 = 2421, days2 = 6969, switchAt = 250, countDur2 = 60, yearsAt = 330, bornAt = 430, nadaAt = 1e9, backAt = 1e9, lineAt = 30, exitDur = 16 }) => {
  const f = useCurrentFrame();
  const inO = lerp(f, 0, 12, 0, 1, OUT);
  // saída: o contador voa para a câmera (atravessa) e dá lugar ao código
  const ex = lerp(f, life - exitDur, life, 0, 1, E(Easing.in(Easing.exp)));
  // "nada.": o contador some, a palavra bate, depois o contador volta
  const goOut = lerp(f, nadaAt - 6, nadaAt, 0, 1, OUT);
  const comeBack = lerp(f, backAt, backAt + 14, 0, 1, OUT);
  const cVis = f < nadaAt ? 1 - goOut : comeBack;
  const c1 = lerp(f, 4, 56, 0, days1, E(Easing.out(Easing.cubic)));
  const c2 = lerp(f, switchAt, switchAt + countDur2, days1, days2, E(Easing.inOut(Easing.cubic)));
  const v = f < switchAt ? c1 : c2;
  const sw = lerp(f, switchAt, switchAt + 18, 0, 1, E(Easing.inOut(Easing.cubic)));
  const yrs = lerp(f, yearsAt, yearsAt + 14, 0, 1, OUT);
  const born = lerp(f, bornAt, bornAt + 16, 0, 1, OUT);
  const hot = f >= switchAt;
  const nt = f - nadaAt;
  const nadaOn = f >= nadaAt && f < backAt + 8;
  const slam = lerp(nt, 0, 9, 1.4, 1, E(Easing.out(Easing.cubic)));
  const nadaO = nadaOn ? Math.min(lerp(nt, 0, 4, 0, 1, C), lerp(f, backAt - 6, backAt + 6, 1, 0, C)) : 0;
  const shake = nadaOn && nt < 10 ? (rnd(f) - 0.5) * 16 * (1 - nt / 10) : 0;
  const flash = nadaOn ? interpolate(nt, [0, 2, 10], [0.35, 0.2, 0], C) : 0;
  // linha do tempo: primeiro só 2020 → hoje; na troca abre até 2007
  const L0 = 260;
  const L1 = 1660;
  // fase 1: nasce no "hoje" e cresce para a esquerda até 2020 (enquanto conta);
  // fase 2 (troca): 2020 desliza para a sua posição real e a linha abre até 2007
  const grow = lerp(f, lineAt, lineAt + 50, 0, 1, E(Easing.inOut(Easing.cubic)));
  const x2020 = L0 + (L1 - L0) * (12.5 / 19) * sw;
  const xStart = L1 - (L1 - L0) * grow;
  const la = lerp(f, lineAt, lineAt + 10, 0, 1, OUT);
  const tick = (x: number, label: string, sub: string, op: number, col: string) => (
    <div style={{ position: "absolute", left: x, top: 846, opacity: op, transform: "translateX(-50%)", textAlign: "center" }}>
      <div style={{ width: 14, height: 14, borderRadius: 14, background: col, boxShadow: `0 0 16px ${col}`, margin: "0 auto" }} />
      <div style={{ ...mono(20, HL.text, 5), marginTop: 12 }}>{label}</div>
      <div style={{ ...mono(14, HL.dim, 3), marginTop: 4 }}>{sub}</div>
    </div>
  );
  const bottle = ["M22 4 Q30 0 38 4 L38 14 L22 14 Z", "M18 14 L42 14 L42 22 L18 22 Z", "M20 22 L40 22 Q46 30 46 42 L46 88 Q46 96 38 96 L22 96 Q14 96 14 88 L14 42 Q14 30 20 22 Z", "M20 52 L32 52 M20 64 L28 64 M20 76 L32 76"];
  return (
    <AbsoluteFill style={{ opacity: inO * (1 - ex * 0.9), transform: `translate(${shake}px, ${shake * 0.5}px)` }}>
      <AbsoluteFill style={{ transform: `scale(${1 + ex * 5})`, filter: ex > 0.02 ? `blur(${ex * 18}px)` : undefined, opacity: cVis }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 250, textAlign: "center", opacity: 1 - sw, ...mono(26, HL.dim, 12) }}>desde 23 · 03 · 2020 · half-life: alyx</div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 250, textAlign: "center", opacity: sw, ...mono(26, HL.dim, 12) }}>desde 10 · 10 · 2007 · episode two</div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 300, textAlign: "center" }}>
          <Digits value={v} size={200} color={hot ? HL.orange : HL.text} />
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 530, textAlign: "center", ...mono(30, "rgba(242,240,247,0.75)", 14) }}>dias</div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 600, textAlign: "center", opacity: yrs * (1 - born * 0.4), ...mono(26, HL.text, 10) }}>≈ 19 anos sem a história do Gordon</div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 655, display: "flex", justifyContent: "center", alignItems: "center", gap: 22, opacity: born }}>
          <svg viewBox="0 0 60 100" style={{ width: 44, transform: `rotate(${Math.sin(f / 14) * 8}deg)` }}>
            {bottle.map((dd, i) => (
              <path key={i} d={dd} fill="none" stroke={i === 2 ? HL.orange : "rgba(220,235,255,0.9)"} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - Math.min(1, Math.max(0, born * 1.6 - i * 0.2))} />
            ))}
          </svg>
          <span style={{ fontFamily: FONT, fontSize: 36, color: "rgba(242,240,247,0.8)" }}>
            quem nasceu nesse dia já tem <span style={{ color: HL.orange, fontWeight: 700 }}>19 anos</span>
          </span>
        </div>
        <div style={{ position: "absolute", left: xStart, width: L1 - xStart, top: 852, height: 2, opacity: la, background: "linear-gradient(90deg, rgba(255,138,31,0.8), rgba(159,216,255,0.6))" }} />
        {tick(L0, "2007", "episode two", sw, HL.orange)}
        {tick(sw > 0 ? x2020 : xStart, "2020", "half-life: alyx", lerp(grow, 0.85, 1, 0, 1, C), HL.ice)}
        {tick(L1, "hoje", "nov/2026", la, "#ffffff")}
      </AbsoluteFill>
      {nadaOn ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 370, textAlign: "center", transform: `scale(${slam})`, opacity: nadaO, fontFamily: FONT, fontWeight: 800, fontSize: 280, letterSpacing: -10, color: HL.text, textShadow: "0 30px 120px rgba(107,63,212,0.6)" }}>nada.</div>
      ) : null}
      <AbsoluteFill style={{ background: "#fff", opacity: flash }} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// DECODIFICAÇÃO: "HLVR" se decifra em "HALF-LIFE: ALYX"; embaixo "HLX" tenta decifrar e nunca resolve,
// até virar um "?" laranja em `qAt`.
const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&@$<>/\\";
const scramble = (target: string, p: number, seed: number, f: number) =>
  target
    .split("")
    .map((ch, i) => {
      if (ch === " " || ch === ":" || ch === "-") return ch;
      const done = p * target.length > i;
      return done ? ch : GLYPHS[Math.floor(rnd(i * 13 + Math.floor(f / 2) + seed) * GLYPHS.length)];
    })
    .join("");
export const HLDecrypt: React.FC<{ life: number; qAt?: number }> = ({ life, qAt = 110 }) => {
  const f = useCurrentFrame();
  const o = Math.min(lerp(f, 0, 10, 0, 1, OUT), lerp(f, life - 10, life, 1, 0));
  const p1 = lerp(f, 12, 50, 0, 1, C);
  const up = lerp(f, 56, 76, 0, 1, E(Easing.inOut(Easing.cubic)));
  const x2 = lerp(f, 70, 86, 0, 1, OUT);
  const q = lerp(f, qAt, qAt + 12, 0, 1, E(Easing.out(Easing.back(1.8))));
  const line = lerp(f, 60, 90, 0, 1, OUT);
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 300 - up * 110, textAlign: "center" }}>
        <div style={{ ...mono(26, "rgba(159,216,255,0.85)", 14) }}>hlvr</div>
        <div style={{ fontFamily: MONO, fontWeight: 600, fontSize: 96 - up * 26, color: p1 >= 1 ? HL.text : "rgba(159,216,255,0.9)", letterSpacing: 8, marginTop: 10 }}>{scramble("HALF-LIFE: ALYX", p1, 1, f)}</div>
      </div>
      <div style={{ position: "absolute", left: 959, top: 400, width: 2, height: 160 * line, background: "linear-gradient(rgba(159,216,255,0.6), rgba(255,138,31,0.7))" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 590, textAlign: "center", opacity: x2 }}>
        <div style={{ ...mono(26, HL.orange, 14) }}>hlx</div>
        <div style={{ position: "relative", height: 130, marginTop: 10 }}>
          <div style={{ position: "absolute", left: 0, right: 0, fontFamily: MONO, fontWeight: 600, fontSize: 96, color: "rgba(255,138,31,0.55)", letterSpacing: 8, opacity: 1 - q }}>{scramble("HALF-LIFE 3", 0, 7, f)}</div>
          <div style={{ position: "absolute", left: 0, right: 0, fontFamily: FONT, fontWeight: 800, fontSize: 150, lineHeight: "130px", color: HL.orange, opacity: q, transform: `scale(${q})`, textShadow: "0 0 50px rgba(255,138,31,0.6)" }}>?</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// HOPIUM 2: o Pepe e o Gordon, cada um com o seu cilindro (mangueira desenhada), posts simulados e carimbos.
export const HLHopium2: React.FC<{ life: number; pepe: string; gordon: string; posts: { user: string; text: string; at: number }[]; stamps: { text: string; at: number }[]; gordonAt?: number; tank?: string; featured?: { user: string; handle: string; text: string; at: number; stampAt: number; stamp: string }[] }> = ({
  life,
  pepe,
  gordon,
  tank,
  posts,
  stamps,
  gordonAt = 40,
  featured = [],
}) => {
  const f = useCurrentFrame();
  const o = Math.min(lerp(f, 0, 14, 0, 1, OUT), lerp(f, life - 10, life, 1, 0));
  const e1 = lerp(f, 0, 22, 0, 1, E(Easing.out(Easing.back(1.5))));
  const e2 = lerp(f, gordonAt, gordonAt + 22, 0, 1, E(Easing.out(Easing.back(1.5))));
  const br = 1 + Math.sin(f / 12) * 0.025;
  const tube = lerp(f, gordonAt + 14, gordonAt + 36, 0, 1, OUT);
  const bubble = (f % 24) / 24;
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <div style={{ position: "absolute", left: 960 - 760, top: 240, width: 1520, height: 600, borderRadius: "50%", background: "radial-gradient(closest-side, rgba(120,255,160,0.14), rgba(120,255,160,0))", transform: `scale(${br})` }} />
      <Img src={staticFile(pepe)} style={{ position: "absolute", left: 960 - 700, top: 330, width: 560, transform: `scale(${e1 * br}) rotate(${Math.sin(f / 40) * 3}deg)`, filter: "drop-shadow(0 30px 60px rgba(0,0,0,0.6))" }} />
      {/* Gordon num quadro de vidro + cilindro + mangueira */}
      <div style={{ position: "absolute", left: tank ? 960 + 110 : 960 + 20, top: tank ? 300 : 330, width: tank ? 400 : 640, height: tank ? 400 : 360, borderRadius: 28, overflow: "hidden", border: "1px solid rgba(255,255,255,0.3)", boxShadow: "0 40px 100px rgba(0,0,0,0.6)", transform: `scale(${e2}) translateY(${Math.sin(f / 36) * 6}px)`, opacity: Math.min(1, e2) }}>
        <Img src={staticFile(gordon)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: tank ? "35% 10%" : "50% 40%" }} />
      </div>
      {tank ? <Img src={staticFile(tank)} style={{ position: "absolute", left: 960 + 560, top: 380, height: 360, transform: `scale(${e2})`, opacity: Math.min(1, e2), filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.6))" }} /> : null}
      {tank ? <svg viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        <path d="M 1628 400 C 1600 300, 1400 300, 1330 420" fill="none" stroke="#6fd3c4" strokeWidth={12} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - tube} opacity={Math.min(1, e2)} />
        {tube >= 1 ? <circle cx={1628 - bubble * 290} cy={400 - Math.sin(bubble * Math.PI) * 90} r={7} fill="#b9fff0" opacity={0.9} /> : null}
      </svg> : null}
      <div style={{ position: "absolute", left: tank ? 960 + 110 : 960 + 20, top: tank ? 718 : 706, width: tank ? 400 : 640, textAlign: "center", opacity: Math.min(1, e2), ...mono(18, HL.orange, 5) }}>{tank ? "até o Gordon" : ""}</div>
      {posts.map((p, i) => {
        const pe = lerp(f, p.at, p.at + 14, 0, 1, E(Easing.out(Easing.back(1.6))));
        const pos = [
          [90, 110],
          [1430, 110],
          [90, 850],
          [1430, 850],
          [760, 90],
          [760, 900],
        ][i % 6];
        return (
          <div key={i} style={{ position: "absolute", left: pos[0], top: pos[1] + Math.sin((f + i * 25) / 35) * 6, width: 400, padding: "14px 18px", borderRadius: 16, background: "rgba(20,16,32,0.72)", border: "1px solid rgba(255,255,255,0.16)", opacity: Math.min(1, pe), transform: `scale(${0.8 + 0.2 * pe})` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 26, height: 26, borderRadius: 26, background: `hsl(${(i * 67) % 360} 50% 45%)` }} />
              <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 18, color: HL.text }}>{p.user}</span>
            </div>
            <div style={{ fontFamily: FONT, fontSize: 23, color: "rgba(242,240,247,0.9)", marginTop: 8 }}>{p.text}</div>
          </div>
        );
      })}
      {featured.length ? (() => {
        const on = Math.max(0, ...featured.map((p) => lerp(f, p.at, p.at + 10, 0, 1, OUT)));
        return <AbsoluteFill style={{ background: "rgba(5,4,10,0.6)", opacity: on, pointerEvents: "none" }} />;
      })() : null}
      {featured.map((p, i) => {
        const e = lerp(f, p.at, p.at + 14, 0, 1, E(Easing.out(Easing.back(1.4))));
        if (f < p.at) return null;
        const next = featured[i + 1];
        const away = next ? lerp(f, next.at, next.at + 16, 0, 1, E(Easing.inOut(Easing.cubic))) : 0;
        const st = lerp(f, p.stampAt, p.stampAt + 8, 0, 1, E(Easing.out(Easing.quad)));
        const x = 960 - 430 + away * -360;
        const y = 330 + away * -180;
        return (
          <div key={"ft" + i} style={{ position: "absolute", left: x, top: y, width: 860, transform: `scale(${(0.85 + 0.15 * Math.min(1, e)) * (1 - away * 0.45)}) rotate(${-1.5 + away * -4}deg)`, transformOrigin: "50% 50%", opacity: Math.min(1, e) * (1 - away * 0.35) }}>
            <div style={{ padding: "28px 34px", borderRadius: 22, background: "rgba(16,14,24,0.94)", border: "1px solid rgba(255,255,255,0.18)", boxShadow: "0 40px 100px rgba(0,0,0,0.6)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <span style={{ width: 52, height: 52, borderRadius: 52, background: `hsl(${(i * 140 + 30) % 360} 45% 45%)` }} />
                <div>
                  <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 26, color: HL.text }}>{p.user}</div>
                  <div style={{ fontFamily: FONT, fontSize: 20, color: HL.dim }}>{p.handle}</div>
                </div>
              </div>
              <div style={{ fontFamily: FONT, fontSize: 44, color: HL.text, marginTop: 18, lineHeight: 1.2 }}>{p.text}</div>
              <div style={{ display: "flex", gap: 34, marginTop: 18, fontFamily: FONT, fontSize: 20, color: HL.dim }}>
                <span>♡ {(2.1 + i * 3.4).toFixed(1)} mil</span>
                <span>↻ {(380 + i * 520).toLocaleString("pt-BR")}</span>
              </div>
            </div>
            {f >= p.stampAt ? (
              <div style={{ position: "absolute", right: 30, top: 60, padding: "10px 26px", border: "6px solid #ff3b30", borderRadius: 12, color: "#ff3b30", fontFamily: FONT, fontWeight: 900, fontSize: 70, transform: `rotate(-12deg) scale(${2.2 - 1.2 * st})`, opacity: st, background: "rgba(40,0,0,0.5)" }}>✕ {p.stamp}</div>
            ) : null}
          </div>
        );
      })}
      {(featured.length ? [] : stamps).map((s, i) => {
        if (f < s.at) return null;
        const se = lerp(f, s.at, s.at + 8, 0, 1, E(Easing.out(Easing.quad)));
        return (
          <div key={i} style={{ position: "absolute", left: i ? 960 - 60 : 960 - 560, top: i ? 790 : 230, padding: "10px 26px", border: "5px solid #ff3b30", borderRadius: 12, color: "#ff3b30", fontFamily: FONT, fontWeight: 900, fontSize: 64, transform: `rotate(${-10 + i * 14}deg) scale(${2.2 - 1.2 * se})`, opacity: se, background: "rgba(40,0,0,0.4)" }}>
            ✕ {s.text}
          </div>
        );
      })}
      <div style={{ position: "absolute", right: 44, bottom: 20, fontFamily: MONO, fontSize: 13, color: "rgba(242,240,247,0.4)" }}>posts simulados · hopium: memes (Know Your Meme)</div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// STEAM MACHINE 2: cubo de cantos arredondados, faixa de LED na frente, grade no topo, reflexo de luz
// que varre as faces e reflexo no chão. Mesmo roteiro: gira, pousa em `landAt`, cartão HL3 cai em `dropAt`.
export const HLSteamMachine2: React.FC<{ life: number; landAt?: number; dropAt?: number; askAt?: number; fixAt?: number; photo?: string }> = ({ life, landAt = 300, dropAt = 400, askAt = 200, fixAt = 1e9, photo }) => {
  const f = useCurrentFrame();
  const o = Math.min(lerp(f, 0, 14, 0, 1, OUT), lerp(f, life - 10, life, 1, 0));
  const e = lerp(f, 0, 30, 0, 1, OUT);
  // "saiu": a Steam Machine DECOLA para o espaço — treme, acende o propulsor, sobe acelerando, encolhe e some
  const land = 0;
  const flashOn = 0;
  const lt = f - landAt;
  const rumble = lt >= 0 && lt < 10 ? (rnd(f) - 0.5) * 6 : 0;
  const lift = lerp(f, landAt + 6, landAt + 34, 0, 1, E(Easing.in(Easing.cubic)));
  void 0;
  const thrust = interpolate(f, [landAt, landAt + 6, landAt + 30], [0, 1, 0.6], C);
  const gone = lerp(f, landAt + 18, landAt + 30, 0, 1, C);
  // vista de três-quartos com a frente (e o LED) sempre visível: balança devagar e assenta ao pousar
  const spin = (-24 + Math.sin(f / 55) * 16) * (1 - land) + -10 * land + (1 - e) * -50;
  const y = Math.sin(f / 30) * 10 * (1 - lift) - lift * 1500; // sai pelo topo da tela, sem fade
  const ask = lerp(f, askAt, askAt + 16, 0, 1, E(Easing.out(Easing.back(1.6))));
  const drop = lerp(f, dropAt, dropAt + 24, 0, 1, E(Easing.in(Easing.quad)));
  const mid = lerp(f, landAt + 4, landAt + 20, 0, 1, E(Easing.inOut(Easing.cubic))); // cartão vai para o centro
  const led = Math.min(1.6, 0.55 + 0.2 * Math.sin(f / 10) + land * 0.5 + flashOn * 0.8);
  const S = 320;
  const sweep = ((spin % 90) / 90) * 200 - 50;
  const face = (tr: string, key: string, light: number, content?: React.ReactNode) => (
    <div
      key={key}
      style={{
        position: "absolute",
        width: S,
        height: S,
        transform: tr,
        borderRadius: 3,
        background: `linear-gradient(165deg, hsl(240 4% ${7 + light * 9}%), hsl(240 5% ${3 + light * 4}%))`,
        boxShadow: `inset 0 0 0 1px rgba(255,255,255,${0.05 + light * 0.06}), inset 0 1px 0 rgba(255,255,255,0.10)`,
        overflow: "hidden",
        backfaceVisibility: "hidden",
      }}
    >
      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(115deg, rgba(255,255,255,0) ${sweep - 20}%, rgba(255,255,255,0.10) ${sweep}%, rgba(255,255,255,0) ${sweep + 20}%)` }} />
      {content}
    </div>
  );
  const vents = (
    <div style={{ position: "absolute", inset: 40, display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: 10 }}>
      {Array.from({ length: 100 }).map((_, i) => (
        <span key={i} style={{ width: 8, height: 8, borderRadius: 8, background: "rgba(0,0,0,0.6)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)" }} />
      ))}
    </div>
  );
  const front = (
    <>
      <div style={{ position: "absolute", left: "6%", right: "6%", bottom: 46, height: 5, borderRadius: 3, background: "linear-gradient(90deg, rgba(120,210,255,0.5), #9fe0ff 50%, rgba(120,210,255,0.5))", opacity: led, boxShadow: `0 0 ${16 + 22 * led}px rgba(110,200,255,${0.8 * led}), 0 6px ${30 * led}px rgba(110,200,255,${0.5 * led})` }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 40, background: "rgba(0,0,0,0.35)" }} />
      <div style={{ position: "absolute", left: 22, bottom: 13, display: "flex", gap: 9, alignItems: "center" }}>
        {[0, 1].map((k) => (
          <span key={k} style={{ width: 22, height: 10, borderRadius: 2, background: "#050506", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.18)" }} />
        ))}
        <span style={{ width: 12, height: 5, borderRadius: 3, background: "#050506", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.18)" }} />
      </div>
      <div style={{ position: "absolute", right: 22, bottom: 10, width: 16, height: 16, borderRadius: 16, background: "#08080a", boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,0.25)" }} />
    </>
  );
  const cx = 960 - 400;
  return (
    <AbsoluteFill style={{ opacity: o, perspective: 1500 }}>

      <div style={{ position: "absolute", left: cx - 360, top: 700, width: 720, height: 120, borderRadius: "50%", background: `radial-gradient(closest-side, rgba(159,216,255,${0.18 + 0.12 * led}), rgba(159,216,255,0))`, opacity: e }} />
      {photo ? (
        <div style={{ position: "absolute", left: cx - 430, top: 300, width: 860, transform: `translate3d(0, ${y}px, ${(1 - e) * -1200}px) rotateY(${Math.sin(f / 60) * 7 * (1 - land * 0.6)}deg)`, transformStyle: "preserve-3d" }}>
          <Img src={staticFile(photo)} style={{ width: "100%", display: "block", filter: "drop-shadow(0 40px 60px rgba(0,0,0,0.65)) brightness(1.05)" }} />
          {/* faixa de LED da foto pulsando (posição relativa à foto) */}
          <div style={{ position: "absolute", left: "52.5%", width: "21%", top: "81.5%", height: "2.2%", borderRadius: 6, background: "rgba(120,210,255,0.9)", mixBlendMode: "screen", opacity: 0.35 + 0.45 * led, boxShadow: `0 0 ${30 * led}px rgba(120,210,255,${0.7 * led})` }} />
        </div>
      ) : null}
      <div style={{ display: photo ? "none" : undefined, position: "absolute", left: cx - S / 2, top: 540 - S / 2 - 10, width: S, height: S, transformStyle: "preserve-3d", transform: `translate3d(${rumble}px, ${y}px, ${(1 - e) * -1200 - lift * 700}px)` }}>
        {/* chama do propulsor: presa embaixo da máquina, tremulando */}
        {lt >= 0 ? (
          <div style={{ position: "absolute", left: S / 2, top: S * 0.86, width: 0, height: 0, opacity: Math.min(1, thrust * 1.4) }}>
            {[
              { w: 260, h: 520, c: "rgba(255,90,20,0.55)", b: 18 },
              { w: 190, h: 400, c: "rgba(255,150,30,0.85)", b: 12 },
              { w: 120, h: 270, c: "rgba(255,220,90,0.95)", b: 8 },
              { w: 60, h: 150, c: "rgba(255,255,240,1)", b: 4 },
            ].map((L, k) => {
              const fl = 0.85 + 0.3 * rnd(f * 3 + k * 17);
              const sw = 0.92 + 0.16 * rnd(f * 5 + k * 29);
              const h = L.h * fl * (0.55 + 0.45 * Math.min(1, thrust + lift));
              return (
                <div key={k} style={{ position: "absolute", left: (-L.w * sw) / 2, top: -12, width: L.w * sw, height: h, borderRadius: "50% 50% 50% 50% / 30% 30% 70% 70%", background: `radial-gradient(ellipse 50% 60% at 50% 18%, ${L.c} 0%, ${L.c} 35%, rgba(255,80,20,0) 100%)`, filter: `blur(${L.b}px)`, mixBlendMode: "screen" }} />
              );
            })}
            {Array.from({ length: 14 }).map((_, k) => {
              const t = ((f * 0.9 + k * 7) % 22) / 22;
              return <div key={"sp" + k} style={{ position: "absolute", left: (rnd(k * 13 + Math.floor(f / 3)) - 0.5) * 140 * t, top: 60 + t * 420, width: 6, height: 6, borderRadius: 6, background: "#ffd27a", opacity: (1 - t) * 0.9, boxShadow: "0 0 10px #ff9a3c" }} />;
            })}
          </div>
        ) : null}
        <div style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d", transform: `rotateX(-14deg) rotateY(${spin + lift * 40}deg)` }}>
        {face(`translateZ(${S / 2 - 1}px)`, "f", 0.6, front)}
        {face(`rotateY(180deg) translateZ(${S / 2 - 1}px)`, "b", 0.2)}
        {face(`rotateY(90deg) translateZ(${S / 2 - 1}px)`, "r", 0.45)}
        {face(`rotateY(-90deg) translateZ(${S / 2 - 1}px)`, "l", 0.35)}
        {face(`rotateX(90deg) translateZ(${S / 2 - 1}px)`, "t", 0.8)}
        {face(`rotateX(-90deg) translateZ(${S / 2 - 1}px)`, "u", 0)}
        </div>
      </div>
      <div style={{ position: "absolute", left: cx - 220, top: photo ? 790 : 850, width: 440, textAlign: "center", opacity: e * (1 - lerp(f, landAt, landAt + 14, 0, 1, C)) }}>
        <div style={{ fontFamily: FONT, fontWeight: 750, fontSize: 46, color: HL.text }}>Steam Machine</div>
        <div style={{ ...mono(20, land > 0.5 ? HL.orange : HL.dim, 5), marginTop: 6 }}>{lt >= 0 ? "saiu · jun/2026" : "primavera de 2026?"}</div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 960 + 140 + (960 - 270 - (960 + 140)) * mid,
          top: 380 + (540 - 110 - 380) * mid,
          width: 540,
          padding: "30px 34px",
          borderRadius: 24,
          background: "linear-gradient(160deg, rgba(255,255,255,0.12), rgba(255,255,255,0.03) 55%, rgba(107,63,212,0.14))",
          border: "1px solid rgba(255,255,255,0.22)",
          opacity: ask * (1 - drop * 0.9),
          transform: `translateY(${drop * 620}px) rotate(${drop * 24}deg) scale(${ask * (1 + mid * 0.25)})`,
          filter: drop > 0 ? `grayscale(${drop})` : undefined,
        }}
      >
        <div style={{ ...mono(18, HL.orange, 5) }}>a promessa dos vazamentos</div>
        <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 72, color: HL.text, marginTop: 10, lineHeight: 1 }}>
          Half-Life 3{" "}
          {f < fixAt ? (
            "junto?"
          ) : (
            <>
              <span style={{ color: HL.orange }}>{"veio ".slice(0, Math.min(5, Math.floor((f - fixAt) / 2)))}</span>junto?
            </>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// LINHA DO TEMPO DO HLX: marcos datados (fev/2024 → jun/2026) acendendo em sequência, com rótulo;
// depois pontos extras cada vez mais rápidos ("de novo, de novo e de novo").
export const HLTimelineHLX: React.FC<{ life: number; events: { date: string; label: string; at: number }[]; extra?: number[] }> = ({ life, events, extra = [] }) => {
  const f = useCurrentFrame();
  const o = Math.min(lerp(f, 0, 12, 0, 1, OUT), lerp(f, life - 10, life, 1, 0));
  const line = lerp(f, 0, 24, 0, 1, OUT);
  const X0 = 180;
  const X1 = 1740;
  const cam = lerp(f, 0, life, 0, -60, C);
  return (
    <AbsoluteFill style={{ opacity: o, transform: `translateX(${cam}px)` }}>
      <div style={{ position: "absolute", left: X0, width: (X1 - X0) * line, top: 560, height: 2, background: "linear-gradient(90deg, rgba(159,216,255,0.5), rgba(255,138,31,0.8))" }} />
      {events.map((ev, i) => {
        const x = X0 + ((i + 0.5) / events.length) * (X1 - X0);
        const e = lerp(f, ev.at, ev.at + 12, 0, 1, E(Easing.out(Easing.back(1.8))));
        const up = i % 2 === 0;
        const glow = interpolate(f, [ev.at, ev.at + 4, ev.at + 30], [0, 1, 0.3], C);
        return (
          <div key={i} style={{ position: "absolute", left: x, top: 560, opacity: Math.min(1, e) }}>
            <div style={{ position: "absolute", left: -9, top: -9, width: 18, height: 18, borderRadius: 18, background: HL.orange, boxShadow: `0 0 ${10 + 30 * glow}px rgba(255,138,31,${0.5 + 0.5 * glow})`, transform: `scale(${e})` }} />
            <div style={{ position: "absolute", left: -1, top: up ? -120 : 12, width: 2, height: 108 * e, background: "rgba(255,138,31,0.5)" }} />
            <div style={{ position: "absolute", left: -150, width: 300, top: up ? -250 : 130, textAlign: "center", transform: `translateY(${(1 - e) * (up ? 20 : -20)}px)` }}>
              <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 34, color: HL.orange }}>HLX</div>
              <div style={{ ...mono(18, HL.text, 4), marginTop: 6 }}>{ev.date}</div>
              <div style={{ fontFamily: FONT, fontSize: 22, color: HL.dim, marginTop: 6, lineHeight: 1.25 }}>{ev.label}</div>
            </div>
          </div>
        );
      })}
      {extra.map((a0, i) => {
        const a = a0 * 30; // `extra` vem em segundos (o registry só converte chaves "at")
        if (f < a) return null;
        const e = lerp(f, a, a + 8, 0, 1, E(Easing.out(Easing.back(2.2))));
        const ring = lerp(f, a, a + 16, 0, 1, OUT);
        const x = X0 + rnd(i * 7 + 3) * (X1 - X0);
        const yy = 560 + (rnd(i * 11) - 0.5) * 220;
        const op = lerp(f, a + 12, a + 40, 1, 0.45, C);
        return (
          <div key={"x" + i} style={{ position: "absolute", left: x, top: yy + Math.sin((f + i * 9) / 18) * 4 }}>
            <div style={{ position: "absolute", left: -24 * ring, top: -24 * ring, width: 48 * ring, height: 48 * ring, borderRadius: "50%", border: `2px solid rgba(255,138,31,${0.8 * (1 - ring)})` }} />
            <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 24, color: HL.orange, opacity: op, transform: `translate(-50%,-50%) scale(${e})`, textShadow: "0 0 16px rgba(255,138,31,0.6)", whiteSpace: "nowrap" }}>HLX</div>
          </div>
        );
      })}
      <div style={{ position: "absolute", left: X0, top: 950, ...mono(14, "rgba(242,240,247,0.4)", 2), textTransform: "none", opacity: line }}>referências relatadas por dataminers · a Valve não confirmou nenhuma</div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// NADA: as setas convergem; em `nadaAt` clarão curto, tremor e "nada." gigante que assenta e apaga devagar.
export const HLNada: React.FC<{ life: number; nadaAt?: number; hlxAt?: number }> = ({ life, nadaAt = 110, hlxAt = 46 }) => {
  const f = useCurrentFrame();
  const o = lerp(f, 0, 12, 0, 1, OUT);
  const before = lerp(f, nadaAt - 4, nadaAt + 2, 1, 0, C);
  const hit = f >= nadaAt;
  const t = f - nadaAt;
  const slam = hit ? lerp(t, 0, 10, 1.35, 1, E(Easing.out(Easing.cubic))) : 1.35;
  const shake = hit && t < 12 ? (rnd(f) - 0.5) * 18 * (1 - t / 12) : 0;
  const flash = hit ? interpolate(t, [0, 2, 12], [0.5, 0.3, 0], C) : 0;
  const ca = hit ? Math.max(0, 1 - t / 10) * 10 : 0;
  // decadência acompanhando o som (impacto grave + energia caindo): encolhe, perde brilho, treme e esfarela
  const decay = hit ? lerp(t, 12, life - nadaAt, 0, 1, E(Easing.in(Easing.quad))) : 0;
  const settle = hit ? 1 - lerp(decay, 0.85, 1, 0, 1, C) : 0; // só some no finalzinho; antes apodrece
  const shrink = 1 - decay * 0.18;
  const glitch = decay > 0.25 && rnd(Math.floor(f / 2)) < decay * 0.5 ? (rnd(f) - 0.5) * 30 * decay : 0;
  return (
    <AbsoluteFill style={{ opacity: o, transform: `translate(${shake}px, ${shake * 0.6}px)` }}>
      <svg viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0, opacity: before }}>
        {Array.from({ length: 14 }).map((_, i) => {
          const a = (i / 14) * Math.PI * 2 + 0.2;
          const e = lerp(f, i * 3, i * 3 + 34, 0, 1, OUT);
          const r1 = 900 - e * 780;
          return <line key={i} x1={960 + Math.cos(a) * 900} y1={540 + Math.sin(a) * 900} x2={960 + Math.cos(a) * r1} y2={540 + Math.sin(a) * r1} stroke={i % 3 ? "rgba(159,216,255,0.5)" : "rgba(255,138,31,0.75)"} strokeWidth={3} />;
        })}
      </svg>
      {/* depois que as setas se alinham, o "HLX" acende no centro vazio; some quando bate o "nada." */}
      {(() => {
        const hx = f < hlxAt ? 0 : lerp(f, hlxAt, hlxAt + 5, 0.6, 1, E(Easing.out(Easing.back(2))));
        const pulse = 1 + Math.sin(f / 7) * 0.03;
        const o2 = Math.min(1, hx) * before;
        if (o2 <= 0) return null;
        return (
          <div style={{ position: "absolute", left: 0, right: 0, top: 540 - 70, textAlign: "center", opacity: o2, transform: `scale(${hx * pulse})` }}>
            <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: 120, color: HL.orange, letterSpacing: 6, textShadow: "0 0 40px rgba(255,138,31,0.7), 0 0 100px rgba(255,138,31,0.35)" }}>HLX</span>
          </div>
        );
      })()}
      <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 20%, rgba(0,0,0,0.75) 90%)", opacity: hit ? Math.min(1, t / 20) : 0 }} />
      {hit ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 360, textAlign: "center", transform: `translateX(${glitch}px) scale(${slam * shrink})`, opacity: settle, filter: decay > 0.01 ? "url(#hl-rot)" : undefined }}>
          {[
            ["rgba(255,60,60,0.8)", -ca],
            ["rgba(80,200,255,0.8)", ca],
            [HL.text, 0],
          ].map(([col, dx], i) => (
            <div key={i} style={{ position: i < 2 ? "absolute" : "relative", left: 0, right: 0, transform: `translateX(${dx}px)`, fontFamily: FONT, fontWeight: 800, fontSize: 300, letterSpacing: -10, lineHeight: 1, color: col as string, opacity: i < 2 ? (ca > 0 ? 1 : 0) : 1 }}>
              nada.
            </div>
          ))}
        </div>
      ) : null}
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <filter id="hl-rot" x="-10%" y="-20%" width="120%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.028" numOctaves="4" seed="7" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale={6 + decay * 46} xChannelSelector="R" yChannelSelector="G" result="warp" />
          <feColorMatrix in="noise" type="matrix" values={`0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  6 0 0 0 ${(1 - decay * 7).toFixed(3)}`} result="mask" />
          <feComposite in="warp" in2="mask" operator="in" result="eaten" />
          <feColorMatrix in="eaten" type="matrix" values={`${1 - decay * 0.45} ${decay * 0.1} 0 0 ${-decay * 0.05}  ${decay * 0.05} ${1 - decay * 0.5} 0 0 ${-decay * 0.08}  0 0 ${1 - decay * 0.7} 0 ${-decay * 0.12}  0 0 0 1 0`} />
        </filter>
      </svg>
      <AbsoluteFill style={{ background: "#fff", opacity: flash }} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// IMPACTO DE TRANSIÇÃO (trilha de cima, ~0,8 s): clarão quente, onda de choque e faixas de aberração.
export const HLImpact: React.FC<{ life: number; hitAt?: number; hold?: number; fade?: number }> = ({ life, hitAt = 6, hold = 5, fade = 18 }) => {
  // transição em branco: sobe rápido até branco total no impacto, segura e clareia revelando a próxima cena
  const f = useCurrentFrame();
  void life;
  const w = interpolate(f, [hitAt - 4, hitAt, hitAt + hold, hitAt + hold + fade], [0, 1, 1, 0], { ...C, easing: Easing.inOut(Easing.quad) });
  return <AbsoluteFill style={{ background: "#ffffff", opacity: w, pointerEvents: "none" }} />;
};
