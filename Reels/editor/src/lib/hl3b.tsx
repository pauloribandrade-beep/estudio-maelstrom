import React from "react";
import { AbsoluteFill, Easing, Img, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { FONT, MONO } from "./overlays";
import { C, Clip, HL, INOUT, OUT, lerp, rnd } from "./hl3";

// Cenas da 1A.2 ("o silêncio"): vidro que estilhaça, interrogações em 3D, relógio HUD, viagem no tempo,
// janela de código 3D, prints animados com marca-texto, ícones vetoriais, hopium, Steam Machine 3D,
// linha do tempo do "de novo" e convergência final. Tempos das props em QUADROS relativos à cena.

const clampE = (e: (t: number) => number) => ({ ...C, easing: e });
const E2 = clampE;
const BACK = clampE(Easing.out(Easing.back(1.6)));
const glass = (glow = 0): React.CSSProperties => ({
  background: `linear-gradient(160deg, rgba(255,255,255,${0.1 + 0.08 * glow}) 0%, rgba(255,255,255,0.025) 55%, rgba(107,63,212,${0.08 + 0.12 * glow}) 100%)`,
  border: `1px solid rgba(255,255,255,${0.16 + 0.3 * glow})`,
  boxShadow: `inset 0 1px 0 rgba(255,255,255,0.14), 0 40px 100px rgba(0,0,0,0.55), 0 0 ${60 * glow}px rgba(159,216,255,${0.3 * glow})`,
  backdropFilter: "blur(16px)",
  borderRadius: 24,
});
const mono = (size: number, color = HL.dim, ls = 4): React.CSSProperties => ({ fontFamily: MONO, fontSize: size, letterSpacing: ls, textTransform: "uppercase", color });

// ---------------------------------------------------------------------------------------------
// Palavras de fundo (manchetes genéricas da época), desfocadas, atravessando a tela em profundidade.
export const HLBackWords: React.FC<{ life: number; words?: string[] }> = ({ life, words = ["LOCKDOWN", "FIQUE EM CASA", "PANDEMIA", "QUARENTENA", "HOME OFFICE"] }) => {
  const f = useCurrentFrame();
  const o = Math.min(lerp(f, 0, 12, 0, 1, OUT), lerp(f, life - 10, life, 1, 0));
  return (
    <AbsoluteFill style={{ opacity: o, pointerEvents: "none" }}>
      {words.map((w, i) => {
        const y = 140 + ((i * 190) % 800);
        const dir = i % 2 ? -1 : 1;
        const x = 960 + dir * (700 - f * (2.2 + i * 0.4));
        const z = 0.5 + rnd(i) * 0.6;
        return (
          <div key={i} style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,0) scale(${z})`, filter: `blur(${(1.2 - z) * 6}px)`, ...mono(64, "rgba(242,240,247,0.16)", 12), whiteSpace: "nowrap" }}>
            {w}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// VIDRO QUE RACHA E ESTILHAÇA: um painel com o clipe A (fim do Episode Two); em `crackAt` a rachadura
// cresce; em `shatterAt` os cacos voam em 3D e revelam os planos B em tela cheia (final do Alyx).
type ShotB = { src: string; from: number; at: number; dur: number };
const SHARDS = Array.from({ length: 18 }, (_, i) => {
  const cx = 0.5 + (rnd(i * 3) - 0.5) * 0.12;
  const cy = 0.5 + (rnd(i * 5) - 0.5) * 0.12;
  const a0 = (i / 18) * Math.PI * 2;
  const a1 = ((i + 1) / 18) * Math.PI * 2;
  const r = 1.2;
  const pts = [
    [cx, cy],
    [0.5 + Math.cos(a0) * r, 0.5 + Math.sin(a0) * r],
    [0.5 + Math.cos((a0 + a1) / 2) * r * (0.9 + rnd(i) * 0.2), 0.5 + Math.sin((a0 + a1) / 2) * r * (0.9 + rnd(i + 7) * 0.2)],
    [0.5 + Math.cos(a1) * r, 0.5 + Math.sin(a1) * r],
  ];
  return { pts, ang: (a0 + a1) / 2 };
});

export const HLShatter: React.FC<{ life: number; a: { src: string; from: number }; b: ShotB[]; crackAt?: number; shatterAt?: number; credit?: string; aspect?: number }> = ({
  life,
  a,
  b,
  crackAt = 10,
  shatterAt = 120,
  credit,
  aspect = 1920 / 930,
}) => {
  const f = useCurrentFrame();
  const enter = lerp(f, 0, 22, 0, 1, OUT);
  const crack = lerp(f, crackAt, crackAt + 18, 0, 1, OUT);
  const sh = lerp(f, shatterAt, shatterAt + 26, 0, 1, clampE(Easing.out(Easing.quad)));
  const W = 1180;
  const H = W / aspect;
  const drift = Math.sin(f / 60) * 6;
  const reveal = lerp(f, shatterAt, shatterAt + 14, 0, 1, OUT);
  const push = 1.04 + lerp(f, shatterAt, life, 0, 0.06, C);
  const flash = interpolate(f, [shatterAt, shatterAt + 2, shatterAt + 10], [0, 0.55, 0], C);
  const cracks = ["M0.5,0.5 L0.18,0.12", "M0.5,0.5 L0.86,0.2", "M0.5,0.5 L0.92,0.74", "M0.5,0.5 L0.36,0.95", "M0.5,0.5 L0.06,0.62", "M0.32,0.3 L0.12,0.36", "M0.7,0.35 L0.8,0.05"];
  const clipA = (
    <div style={{ position: "absolute", inset: 0, borderRadius: 18, overflow: "hidden" }}>
      <Clip src={a.src} from={a.from} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(0deg, rgba(5,4,10,0.35), rgba(5,4,10,0) 40%)" }} />
    </div>
  );
  return (
    <AbsoluteFill>
      {/* planos B em tela cheia, revelados pelo estilhaço */}
      {f >= shatterAt - 1 ? (
        <AbsoluteFill style={{ opacity: reveal, transform: `scale(${push})` }}>
          {b.map((s, i) => (
            <Sequence key={i} from={s.at} durationInFrames={Math.max(1, s.dur)} layout="none">
              <AbsoluteFill>
                <Clip src={s.src} from={s.from} style={{ objectFit: "contain" }} />
                <AbsoluteFill style={{ background: "#fff", opacity: interpolate(f - s.at, [0, 2, 10], [i ? 0.7 : 0, i ? 0.4 : 0, 0], C) }} />
              </AbsoluteFill>
            </Sequence>
          ))}
        </AbsoluteFill>
      ) : null}
      {/* painel A: inteiro, rachado, depois em cacos */}
      <AbsoluteFill style={{ perspective: 1400 }}>
        <div
          style={{
            position: "absolute",
            left: 960 - W / 2,
            top: 540 - H / 2 + drift,
            width: W,
            height: H,
            opacity: enter,
            transform: `translateZ(${(1 - enter) * -500}px) rotateY(${(1 - enter) * 10}deg)`,
            transformStyle: "preserve-3d",
          }}
        >
          {sh <= 0 ? (
            <div style={{ position: "absolute", inset: -10, padding: 10, ...glass(0.2 + crack * 0.5), borderRadius: 26 }}>
              <div style={{ position: "relative", width: "100%", height: "100%" }}>
                {clipA}
                <svg viewBox="0 0 1 1" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
                  {cracks.map((d, i) => (
                    <path key={i} d={d} stroke="rgba(235,245,255,0.95)" strokeWidth={0.0035} fill="none" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - crack} style={{ filter: "drop-shadow(0 0 0.004px #9fd8ff)" }} />
                  ))}
                </svg>
              </div>
            </div>
          ) : (
            SHARDS.map((s, i) => {
              const dist = sh * (500 + rnd(i) * 700);
              const tx = Math.cos(s.ang) * dist;
              const ty = Math.sin(s.ang) * dist + sh * sh * 300;
              const tz = sh * (200 + rnd(i + 2) * 900);
              const rot = sh * (rnd(i + 9) - 0.5) * 540;
              const poly = s.pts.map(([x, y]) => `${(x * 100).toFixed(1)}% ${(y * 100).toFixed(1)}%`).join(",");
              return (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    inset: 0,
                    clipPath: `polygon(${poly})`,
                    transform: `translate3d(${tx}px, ${ty}px, ${tz}px) rotate3d(${rnd(i)},${rnd(i + 1)},${rnd(i + 3)},${rot}deg)`,
                    opacity: 1 - sh,
                    filter: "brightness(1.15)",
                  }}
                >
                  {clipA}
                  <div style={{ position: "absolute", inset: 0, border: "2px solid rgba(220,240,255,0.7)", borderRadius: 18 }} />
                </div>
              );
            })
          )}
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "#dff1ff", opacity: flash, mixBlendMode: "screen" }} />
      {credit ? <div style={{ position: "absolute", right: 44, bottom: 34, ...mono(15, "rgba(242,240,247,0.45)", 2), textTransform: "none" }}>{credit}</div> : null}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// INTERROGAÇÕES EM 3D (vidro) em órbita lenta + o "caderno aberto" ganhando a primeira linha.
export const HLQuestions: React.FC<{ life: number; noteAt?: number; note?: string }> = ({ life, noteAt = 90, note = "E agora?" }) => {
  const f = useCurrentFrame();
  const o = Math.min(lerp(f, 0, 20, 0, 1, OUT), lerp(f, life - 12, life, 1, 0));
  const nb = lerp(f, noteAt, noteAt + 18, 0, 1, OUT);
  const typed = Math.floor(lerp(f, noteAt + 10, noteAt + 10 + note.length * 2, 0, note.length, C));
  return (
    <AbsoluteFill style={{ perspective: 1200, opacity: o }}>
      {Array.from({ length: 7 }).map((_, i) => {
        const a = (f / 150) * Math.PI * 2 * (i % 2 ? 1 : -0.8) + (i / 7) * Math.PI * 2;
        const R = 420 + (i % 3) * 110;
        const x = Math.cos(a) * R;
        const z = Math.sin(a) * R - 200;
        const y = Math.sin(a * 1.3 + i) * 90 - 40;
        const s = 0.6 + (i % 3) * 0.35;
        const enter = lerp(f, i * 4, i * 4 + 24, 0, 1, BACK);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 960,
              top: 480,
              transform: `translate3d(${x}px, ${y}px, ${z}px) translate(-50%,-50%) scale(${s * enter}) rotateY(${a * 57}deg)`,
              fontFamily: FONT,
              fontWeight: 800,
              fontSize: 220,
              color: "rgba(230,240,255,0.10)",
              WebkitTextStroke: "2px rgba(200,230,255,0.55)",
              textShadow: "0 0 40px rgba(159,216,255,0.35)",
            }}
          >
            ?
          </div>
        );
      })}
      <div style={{ position: "absolute", left: 960 - 330, top: 760, width: 660, padding: "22px 28px", ...glass(0.1), opacity: nb, transform: `translateY(${(1 - nb) * 30}px)` }}>
        <div style={{ ...mono(15, HL.orange, 4) }}>caderno aberto · 01</div>
        <div style={{ fontFamily: FONT, fontWeight: 650, fontSize: 40, color: HL.text, marginTop: 10, borderBottom: "1px dashed rgba(255,255,255,0.2)", paddingBottom: 8 }}>
          {note.slice(0, typed)}
          <span style={{ opacity: f % 30 < 15 ? 1 : 0 }}>|</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// RELÓGIO HUD: conta de MAR 2020 até hoje; em `freezeAt` trava com glitch e mostra "anúncios oficiais: 0".
export const HLClock: React.FC<{ life: number; countDur?: number; freezeAt?: number; years?: number; months?: number }> = ({ life, countDur = 50, freezeAt = 100, years = 6, months = 6 }) => {
  const f = useCurrentFrame();
  const o = Math.min(lerp(f, 0, 14, 0, 1, OUT), lerp(f, life - 10, life, 1, 0));
  const p = lerp(f, 6, 6 + countDur, 0, 1, clampE(Easing.out(Easing.cubic)));
  const totalM = years * 12 + months;
  const m = Math.round(p * totalM);
  const days = Math.round(p * (years * 365 + months * 30));
  const frozen = f >= freezeAt;
  const g = frozen ? interpolate(f - freezeAt, [0, 3, 6, 10], [1, 0.4, 1, 0], C) : 0;
  const jit = g > 0 ? (rnd(f) - 0.5) * 24 * g : 0;
  const zero = lerp(f, freezeAt + 4, freezeAt + 18, 0, 1, OUT);
  const pad = (n: number, l = 2) => String(n).padStart(l, "0");
  return (
    <AbsoluteFill style={{ opacity: o, alignItems: "center", justifyContent: "center" }}>
      <div style={{ ...mono(20, HL.dim, 8) }}>mar 2020 → hoje</div>
      <div style={{ position: "relative", marginTop: 26, transform: `translateX(${jit}px)` }}>
        {[
          ["rgba(255,60,60,0.7)", -4 * g],
          ["rgba(80,200,255,0.7)", 4 * g],
          [HL.text, 0],
        ].map(([col, dx], i) => (
          <div
            key={i}
            style={{
              position: i < 2 ? "absolute" : "relative",
              left: 0,
              top: 0,
              transform: `translateX(${dx}px)`,
              fontFamily: MONO,
              fontWeight: 600,
              fontSize: 150,
              letterSpacing: 6,
              color: col as string,
              opacity: i < 2 ? g : 1,
              whiteSpace: "nowrap",
            }}
          >
            {pad(Math.floor(m / 12))}
            <span style={{ fontSize: 50, color: HL.dim }}>A </span>
            {pad(m % 12)}
            <span style={{ fontSize: 50, color: HL.dim }}>M</span>
          </div>
        ))}
      </div>
      <div style={{ ...mono(22, "rgba(242,240,247,0.5)", 6), marginTop: 12 }}>{days.toLocaleString("pt-BR")} dias</div>
      <div style={{ marginTop: 40, padding: "12px 22px", borderRadius: 999, border: `1px solid rgba(255,90,70,${0.6 * zero})`, background: `rgba(255,60,40,${0.12 * zero})`, opacity: zero, ...mono(22, "#ff8a7a", 5) }}>
        anúncios oficiais: 0
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// VIAGEM PARA TRÁS NO TEMPO: quadros de vidro com os anos passam pela câmera (2026 → 2020 → 2007);
// um contador grande sobe até `count` ("quase 20 anos").
export const HLTimeBack: React.FC<{ life: number; stops: { year: string; label: string; at: number }[]; countAt?: number; count?: number; countLabel?: string }> = ({
  life,
  stops,
  countAt = 60,
  count = 19,
  countLabel = "anos sem a história do Gordon",
}) => {
  const f = useCurrentFrame();
  const o = Math.min(lerp(f, 0, 14, 0, 1, OUT), lerp(f, life - 10, life, 1, 0));
  const n = Math.round(lerp(f, countAt - 50, countAt, 0, count, clampE(Easing.out(Easing.cubic))));
  const cp = lerp(f, countAt - 50, countAt - 36, 0, 1, OUT);
  return (
    <AbsoluteFill style={{ perspective: 1100, opacity: o }}>
      {stops.map((s, i) => {
        // cada quadro vem do fundo, para no centro no seu `at` e passa pela câmera no próximo
        const next = stops[i + 1]?.at ?? life + 40;
        const z = interpolate(f, [s.at - 30, s.at, next - 8, next + 8], [-2600, 0, 0, 900], C);
        const op = interpolate(f, [s.at - 30, s.at - 18, next, next + 8], [0, 1, 1, 0], C);
        const last = i === stops.length - 1;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 960 - 330,
              top: 250,
              width: 660,
              height: 300,
              ...glass(last ? 0.5 : 0.15),
              opacity: op,
              transform: `translate3d(0, 0, ${z}px)`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 130, letterSpacing: -4, color: last ? HL.orange : HL.text, lineHeight: 1 }}>{s.year}</div>
            <div style={{ ...mono(22, HL.dim, 6), marginTop: 14 }}>{s.label}</div>
          </div>
        );
      })}
      <div style={{ position: "absolute", left: 0, right: 0, top: 640, textAlign: "center", opacity: cp }}>
        <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 150, color: HL.text, lineHeight: 1 }}>
          {f >= countAt ? "quase 20" : n}
        </div>
        <div style={{ ...mono(24, HL.dim, 7), marginTop: 12 }}>{countLabel}</div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// "NEM NASCIDO ERA": berço em traço fino desenhado ao vivo + crachá HUD.
export const HLBorn: React.FC<{ life: number; tag?: string; sub?: string }> = ({ life, tag = "nascido em 2008", sub = "hoje: 18 anos" }) => {
  const f = useCurrentFrame();
  const o = Math.min(lerp(f, 0, 10, 0, 1, OUT), lerp(f, life - 10, life, 1, 0));
  const d = lerp(f, 4, 50, 0, 1, clampE(Easing.inOut(Easing.cubic)));
  const tg = lerp(f, 40, 58, 0, 1, BACK);
  const paths = [
    "M160 120 L160 330 M540 120 L540 330",
    "M160 150 L540 150 M160 300 L540 300",
    "M200 150 L200 300 M245 150 L245 300 M290 150 L290 300 M335 150 L335 300 M380 150 L380 300 M425 150 L425 300 M470 150 L470 300 M505 150 L505 300",
    "M140 330 Q350 390 560 330",
    "M350 40 L350 90 M300 90 Q350 60 400 90 M320 90 L310 118 M380 90 L390 118 M350 90 L350 120",
  ];
  return (
    <AbsoluteFill style={{ opacity: o, alignItems: "center", justifyContent: "center" }}>
      <svg viewBox="0 0 700 420" style={{ width: 760, transform: `translateY(${Math.sin(f / 30) * 5}px)` }}>
        {paths.map((p, i) => (
          <path key={i} d={p} fill="none" stroke="rgba(220,235,255,0.85)" strokeWidth={4} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - Math.min(1, Math.max(0, d * 1.6 - i * 0.15))} style={{ filter: "drop-shadow(0 0 6px rgba(159,216,255,0.5))" }} />
        ))}
      </svg>
      <div style={{ marginTop: 10, padding: "14px 26px", ...glass(0.2), borderRadius: 16, transform: `scale(${tg})`, textAlign: "center" }}>
        <div style={{ ...mono(24, HL.text, 6) }}>{tag}</div>
        <div style={{ ...mono(16, HL.orange, 5), marginTop: 6 }}>{sub}</div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// JANELA DE CÓDIGO 3D (Source 2). Linhas rolando; em `hlAt` uma linha acende; em `zoomAt` a câmera
// entra na janela até o termo; em `popAt` o termo salta da tela em letras 3D laranja.
// `variant: "hlvr"` = flashback (linhas hlvr_ piscando e uma linha do tempo 2016→2019 enchendo de pontos).
const CODE = [
  "void CPanoramaUIEngine::Init()",
  "  m_nFlags |= PANEL_VISIBLE;",
  "  RegisterEventHandler( \"UIReady\" );",
  "resource/layout/hud_panel.xml",
  "  <Panel class=\"HudRoot\" hittest=\"false\">",
  "  <Image src=\"file://{images}/icons/ui/",
  "type = csgo_hud_generic",
  "  flMaxTime = 0.25f;",
  "  bEnabled = true;",
  "m_vecOrigin = Vector( 0, 0, 64 );",
  "  CPrediction::RunCommand( pCmd );",
  "  // TODO: remove before ship",
];

export const HLCode: React.FC<{
  life: number;
  label?: string;
  labelAt?: number;
  hlLine?: string;
  term?: string;
  hlAt?: number;
  zoomAt?: number;
  popAt?: number;
  variant?: "cs2" | "hlvr";
  dots?: { year: string; at: number }[];
  windows?: { label: string; at: number }[];
  finds?: { at: number; text: string }[];
  tagName?: string;
}> = ({ life, label, labelAt = 20, hlLine = "type = hlx_2d_basic", term = "hlx", hlAt = 1e9, zoomAt = 1e9, popAt = 1e9, variant = "cs2", dots = [], windows, finds = [], tagName }) => {
  const f = useCurrentFrame();
  const o = Math.min(lerp(f, 0, 16, 0, 1, OUT), lerp(f, life - 10, life, 1, 0));
  const hl = lerp(f, hlAt, hlAt + 10, 0, 1, OUT);
  const zoom = lerp(f, zoomAt, zoomAt + 22, 0, 1, clampE(Easing.inOut(Easing.cubic)));
  const pop = lerp(f, popAt, popAt + 22, 0, 1, clampE(Easing.out(Easing.back(1.3))));
  const hlvr = variant === "hlvr";
  // rolagem contínua (sem loop). Na versão CS2 ela freia e PARA com a linha do hlx no centro da janela
  // exatamente em `hlAt`; o bloco de 13 linhas se repete quantas vezes precisar.
  const SPEED = 2.2;
  const HWIN = windows ? 380 : 560;
  const center0 = 38 + 14 + 6 * 34 + 17 - HWIN / 2; // rolagem que centraliza a 1ª ocorrência
  const j = Math.max(0, Math.round((SPEED * hlAt - center0) / (13 * 34)));
  const target = center0 + j * 13 * 34;
  const stopW = lerp(f, hlAt - 24, hlAt, 0, 1, E2(Easing.inOut(Easing.cubic)));
  const run = SPEED * Math.min(f, hlAt);
  const scroll = hlvr || windows || hlAt > 1e8 ? SPEED * f : run + (target - SPEED * hlAt) * stopW;
  const REP = Math.ceil((SPEED * 600 + 1200) / (13 * 34)) + 2;
  const lines = [...CODE.slice(0, 6), hlvr ? "  m_flFadeTime = 0.5f;" : hlLine, ...CODE.slice(6)];
  // flashback: cada bolinha da linha do tempo marca, no mesmo instante, uma linha "hlvr_…" que está passando
  const HLVR = ["hlvr_hint_hand", "hlvr_grav_gloves", "hlvr_multitool_hack", "hlvr_resin_pickup", "hlvr_russell_radio", "hlvr_combine_suit", "hlvr_xen_foliage", "hlvr_alyx_intro"];
  const marks = hlvr
    ? dots.map((d, k) => {
        const yk = 110 + (k % 4) * 78;
        return { i: Math.floor((2.2 * d.at + yk - 14) / 34), at: d.at, text: `  SetScreenCaption( "${HLVR[k % HLVR.length]}" );` };
      })
    : finds.map((d, k) => {
        // referência ao HLX "encontrada" numa linha que está passando
        const yk = 120 + (k % 4) * 82;
        return { i: Math.floor((2.2 * d.at + yk - 14) / 34), at: d.at, text: d.text };
      });
  const win = (w: number, h: number, key: string, extra: React.CSSProperties = {}, tag?: string, blink?: number) => (
    <div key={key} style={{ position: "absolute", width: w, height: h, ...glass(0.12 + 0.4 * hl), borderRadius: 18, overflow: "hidden", ...extra }}>
      <div style={{ height: 38, display: "flex", alignItems: "center", gap: 8, padding: "0 16px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
          <span key={c} style={{ width: 11, height: 11, borderRadius: 11, background: c, opacity: 0.8 }} />
        ))}
        <span style={{ ...mono(13, "rgba(242,240,247,0.55)", 2), textTransform: "none", marginLeft: 10 }}>{tag ?? tagName ?? (hlvr ? "steamvr_tools / hlvr.vpk" : "counter-strike 2 / update.vpk")}</span>
      </div>
      {!hlvr && f < hlAt ? <div style={{ position: "absolute", left: 0, right: 0, top: 38 + ((f * 7) % (h - 38)), height: 44, background: "linear-gradient(rgba(159,216,255,0), rgba(159,216,255,0.12), rgba(159,216,255,0))", pointerEvents: "none", zIndex: 2 }} /> : null}
      <div style={{ position: "absolute", left: 0, right: 0, top: 38, bottom: 0, overflow: "hidden" }}>
      <div style={{ padding: "14px 20px", transform: `translateY(${-scroll}px)` }}>
        {Array.from({ length: REP }).flatMap(() => lines).map((l, i) => {
          const mk = marks.find((m) => m.i === i && f >= m.at);
          const isHl = !hlvr && l === hlLine;
          const on = isHl && hl > 0 && Math.floor(i / 13) === j;
          const mA = mk ? interpolate(f - mk.at, [0, 3, 24], [0.6, 0.45, 0.18], C) : 0;
          const mCol = hlvr ? "200,225,255" : "255,138,31";
          const b = blink !== undefined && isHl ? (Math.floor((f - blink) / 8) % 2 === 0 && f > blink ? 1 : 0.2) : 1;
          return (
            <div
              key={i}
              style={{
                fontFamily: MONO,
                fontSize: 19,
                lineHeight: "34px",
                whiteSpace: "pre",
                color: on ? "#1a0f05" : mk ? (hlvr ? "rgba(235,245,255,0.95)" : "#ffd9b3") : "rgba(210,225,255,0.72)",
                background: on ? `rgba(255,138,31,${0.9 * b})` : mk ? `rgba(${mCol},${mA})` : "transparent",
                boxShadow: mk && !hlvr ? `0 0 ${18 * mA}px rgba(255,138,31,${mA})` : on ? "0 0 26px rgba(255,138,31,0.55)" : undefined,
                borderRadius: 6,
                padding: "0 6px",
              }}
            >
              <span style={{ opacity: 0.35, marginRight: 16 }}>{String(100 + i).padStart(4, " ")}</span>
              {mk ? mk.text : l}
            </div>
          );
        })}
      </div>
      </div>
    </div>
  );
  // várias janelas (Dota / Deadlock / Source 2) em profundidade
  if (windows) {
    return (
      <AbsoluteFill style={{ perspective: 1300, opacity: o }}>
        {windows.map((w, i) => {
          const e = lerp(f, w.at, w.at + 20, 0, 1, OUT);
          const x = (i - (windows.length - 1) / 2) * 560;
          return (
            <div key={i} style={{ position: "absolute", left: 960 + x - 250, top: 300, transform: `translate3d(0, ${Math.sin((f + i * 30) / 40) * 10}px, ${(1 - e) * -1600 - Math.abs(x) * 0.5}px) rotateY(${-x / 40}deg)`, opacity: e }}>
              {win(500, 380, "w" + i, { position: "relative" }, w.label.toLowerCase() + " / update.vpk", w.at + 14)}
              <div style={{ textAlign: "center", marginTop: 18, fontFamily: FONT, fontWeight: 750, fontSize: 38, color: HL.text }}>{w.label}</div>
            </div>
          );
        })}
      </AbsoluteFill>
    );
  }
  const W = 1000;
  const Hh = 560;
  return (
    <AbsoluteFill style={{ perspective: 1400, opacity: o }}>
      <div
        style={{
          position: "absolute",
          left: 960 - W / 2,
          top: 540 - Hh / 2 - 30,
          width: W,
          height: Hh,
          transformOrigin: "33% 50%",
          transform: `translate3d(0, ${Math.sin(f / 50) * 8}px, ${lerp(f, 0, 26, -1400, 0, OUT)}px) rotateY(${(lerp(f, 0, 40, 28, 6, OUT) + Math.sin(f / 70) * 5) * (1 - zoom)}deg) rotateX(${Math.sin(f / 95) * 3 * (1 - zoom)}deg) scale(${1 + zoom * 1.7})`,
          filter: [hlvr ? "sepia(0.35) hue-rotate(170deg)" : "", f < 14 ? `blur(${(14 - f) * 0.9}px)` : ""].join(" ").trim() || undefined,
          opacity: 1 - pop * 0.75,
        }}
      >
        {win(W, Hh, "main")}
      </div>
      {label ? (
        <div style={{ position: "absolute", left: 960 - W / 2, top: 540 + Hh / 2 - 10, opacity: lerp(f, labelAt, labelAt + 14, 0, 1, OUT) * (1 - zoom), ...mono(20, HL.orange, 5) }}>
          <span style={{ color: HL.dim }}>— </span>
          {label}
        </div>
      ) : null}
      {f >= popAt && pop > 0 ? (() => {
        const pr = lerp(f, popAt, popAt + 14, 0, 1, E2(Easing.in(Easing.cubic)));
        const land = f - (popAt + 14);
        const zNow = lerp(popAt, zoomAt, zoomAt + 22, 0, 1, E2(Easing.inOut(Easing.cubic))); // zoom no instante do salto
        const k = 1 + 1.7 * zNow;
        const x0 = 960 - W / 2 + 330 + (168 - 330) * k;
        const y0 = 540 - 30;
        const x = x0 + (960 - x0) * pr;
        const y = y0 + (520 - y0) * pr;
        const size = 19 * k + (300 - 19 * k) * pr;
        const over = land >= 0 ? 1 + 0.12 * Math.exp(-land / 4) * Math.cos(land / 1.6) : 1;
        const shake = land >= 0 && land < 10 ? (rnd(f) - 0.5) * 20 * (1 - land / 10) : 0;
        const ring = land >= 0 ? lerp(land, 0, 22, 0, 1, OUT) : 0;
        return (
          <>
            <div style={{ position: "absolute", left: x + shake, top: y + shake * 0.6, transform: `translate(-50%, -50%) scale(${over})`, fontFamily: MONO, fontWeight: 700, fontSize: size, color: HL.orange, textShadow: `0 0 ${20 + 60 * pr}px rgba(255,138,31,0.7)`, whiteSpace: "nowrap" }}>hlx</div>
            {land >= 0 ? <div style={{ position: "absolute", left: 960 - 500 * ring, top: 520 - 500 * ring, width: 1000 * ring, height: 1000 * ring, borderRadius: "50%", border: `3px solid rgba(255,138,31,${0.7 * (1 - ring)})` }} /> : null}
            {land >= 0 ? <AbsoluteFill style={{ background: "#ffd9b0", opacity: interpolate(land, [0, 2, 10], [0.45, 0.25, 0], C), mixBlendMode: "screen" }} /> : null}
          </>
        );
      })() : null}
      {hlvr && dots.length ? (
        <div style={{ position: "absolute", left: 360, right: 360, top: 900 }}>
          <div style={{ height: 2, background: "rgba(255,255,255,0.18)" }} />
          {dots.map((d, i) => {
            const e = lerp(f, d.at, d.at + 10, 0, 1, BACK);
            const x = (i / Math.max(1, dots.length - 1)) * 100;
            return (
              <div key={i} style={{ position: "absolute", left: `${x}%`, top: -9, transform: `translateX(-50%) scale(${e})` }}>
                <div style={{ width: 18, height: 18, borderRadius: 18, background: HL.ice, boxShadow: "0 0 18px #9fd8ff" }} />
                {d.year ? <div style={{ ...mono(15, HL.dim, 3), marginTop: 10, transform: "translateX(-25%)" }}>{d.year}</div> : null}
              </div>
            );
          })}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// COMPARAÇÃO: "HLVR → Half-Life: Alyx" | "HLX → ?" com uma seta de luz ligando os dois.
export const HLCompare: React.FC<{ life: number; linkAt?: number }> = ({ life, linkAt = 90 }) => {
  const f = useCurrentFrame();
  const o = Math.min(lerp(f, 0, 14, 0, 1, OUT), lerp(f, life - 10, life, 1, 0));
  const l = lerp(f, 8, 26, 0, 1, OUT);
  const r = lerp(f, 20, 38, 0, 1, OUT);
  const link = lerp(f, linkAt, linkAt + 24, 0, 1, OUT);
  const card = (e: number, x: number, top: string, arrow: string, bottom: string, q: boolean) => (
    <div style={{ position: "absolute", left: x, top: 330, width: 560, height: 360, ...glass(q ? 0.25 + 0.4 * link : 0.2), opacity: e, transform: `translateY(${(1 - e) * 40}px) translateY(${Math.sin((f + x) / 45) * 7}px)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontFamily: MONO, fontWeight: 600, fontSize: 76, color: q ? HL.orange : HL.ice, letterSpacing: 6 }}>{top}</div>
      <div style={{ fontSize: 44, color: HL.dim, margin: "8px 0" }}>{arrow}</div>
      <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: q ? 120 : 58, color: HL.text, lineHeight: 1 }}>{bottom}</div>
    </div>
  );
  return (
    <AbsoluteFill style={{ opacity: o }}>
      {card(l, 960 - 620, "HLVR", "↓", "Half-Life: Alyx", false)}
      {card(r, 960 + 60, "HLX", "↓", "?", true)}
      <svg style={{ position: "absolute", inset: 0 }} viewBox="0 0 1920 1080">
        <path d="M 900 510 C 940 450, 980 450, 1020 510" fill="none" stroke={HL.orange} strokeWidth={4} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - link} style={{ filter: "drop-shadow(0 0 10px #ff8a1f)" }} />
      </svg>
      <div style={{ position: "absolute", left: 0, right: 0, top: 760, textAlign: "center", opacity: link, ...mono(22, HL.dim, 6) }}>a comunidade liga os pontos</div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// ÍCONES VETORIAIS: NPC com radar de IA, caixas com física, carro em wireframe; cada um nasce de uma linha de código.
export const HLIcons: React.FC<{ life: number; items: { kind: "npc" | "physics" | "vehicle"; label: string; at: number }[] }> = ({ life, items }) => {
  const f = useCurrentFrame();
  const o = Math.min(lerp(f, 0, 14, 0, 1, OUT), lerp(f, life - 10, life, 1, 0));
  const drawNpc = (t: number) => (
    <svg viewBox="0 0 300 300" style={{ width: 300 }}>
      {[0, 1, 2].map((k) => {
        const r = ((t * 2 + k * 40) % 120) + 20;
        return <circle key={k} cx={150} cy={130} r={r} fill="none" stroke="rgba(159,216,255,0.5)" strokeWidth={2} opacity={1 - r / 140} />;
      })}
      <circle cx={150} cy={105} r={38} fill="none" stroke="#dfeaff" strokeWidth={4} />
      <path d="M78 245 Q80 165 150 160 Q220 165 222 245" fill="none" stroke="#dfeaff" strokeWidth={4} />
      <line x1={150} y1={130} x2={150 + Math.cos(t / 10) * 120} y2={130 + Math.sin(t / 10) * 120} stroke={HL.orange} strokeWidth={3} opacity={0.8} />
    </svg>
  );
  const drawPhysics = (t: number) => (
    <svg viewBox="0 0 300 300" style={{ width: 300 }}>
      <line x1={30} y1={260} x2={270} y2={260} stroke="rgba(255,255,255,0.35)" strokeWidth={3} />
      {[0, 1, 2].map((k) => {
        const tt = Math.max(0, t - k * 8);
        const fall = Math.min(1, tt / 18);
        const bounce = tt > 18 ? Math.abs(Math.sin((tt - 18) / 5)) * Math.exp(-(tt - 18) / 12) * 40 : 0;
        const y = -60 + fall * fall * (200 - k * 62) - bounce;
        const x = 70 + k * 60;
        const rot = (1 - fall) * 90 * (k % 2 ? 1 : -1) + (k === 2 ? 12 : 0);
        return <rect key={k} x={x} y={y + (k === 1 ? 0 : 0)} width={56} height={56} rx={4} fill="rgba(255,138,31,0.12)" stroke={k === 1 ? HL.orange : "#dfeaff"} strokeWidth={4} transform={`rotate(${rot} ${x + 28} ${y + 28})`} />;
      })}
    </svg>
  );
  const drawVehicle = (t: number) => {
    const a = t / 40;
    const P = (x: number, y: number, z: number) => {
      const c = Math.cos(a);
      const s = Math.sin(a);
      const X = x * c - z * s;
      const Z = x * s + z * c + 5;
      return [150 + (X * 330) / Z, 185 - (y * 330) / Z] as const;
    };
    const box = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number) => {
      const v = [
        [x0, y0, z0],
        [x1, y0, z0],
        [x1, y1, z0],
        [x0, y1, z0],
        [x0, y0, z1],
        [x1, y0, z1],
        [x1, y1, z1],
        [x0, y1, z1],
      ].map(([x, y, z]) => P(x, y, z));
      const e = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
      return e.map(([i, j], k) => <line key={k} x1={v[i][0]} y1={v[i][1]} x2={v[j][0]} y2={v[j][1]} stroke="#dfeaff" strokeWidth={2.5} />);
    };
    return (
      <svg viewBox="0 0 300 300" style={{ width: 300 }}>
        {box(-1.6, 0, -0.8, 1.6, 0.6, 0.8)}
        {box(-0.8, 0.6, -0.7, 0.9, 1.1, 0.7)}
        {[-1, 1].flatMap((sx) =>
          [-1, 1].map((sz) => {
            const [cx, cy] = P(sx * 1.05, 0, sz * 0.85);
            return <circle key={`${sx}${sz}`} cx={cx} cy={cy} r={16} fill="none" stroke={HL.orange} strokeWidth={3} />;
          }),
        )}
      </svg>
    );
  };
  return (
    <AbsoluteFill style={{ opacity: o }}>
      {items.map((it, i) => {
        const e = lerp(f, it.at, it.at + 16, 0, 1, BACK);
        const x = (i - (items.length - 1) / 2) * 520;
        const t = f - it.at;
        return (
          <div key={i} style={{ position: "absolute", left: 960 + x - 170, top: 300, width: 340, textAlign: "center", opacity: Math.min(1, e), transform: `translateY(${(1 - e) * 60 + Math.sin((f + i * 20) / 40) * 8}px)` }}>
            <div style={{ ...glass(0.15), padding: 20, borderRadius: 26, display: "flex", justifyContent: "center" }}>{it.kind === "npc" ? drawNpc(t) : it.kind === "physics" ? drawPhysics(t) : drawVehicle(t)}</div>
            <div style={{ fontFamily: FONT, fontWeight: 750, fontSize: 40, color: HL.text, marginTop: 18 }}>{it.label}</div>
            <div style={{ ...mono(14, HL.dim, 2), textTransform: "none", marginTop: 6 }}>{it.kind === "npc" ? "npc_ai_*.cpp" : it.kind === "physics" ? "physics_destruction.vphys" : "vehicle_driving.vdata"}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// HOPIUM: a imagem flutua no centro com brilho; posts SIMULADOS (nomes inventados) orbitam;
// a cada `stamps[].at` cai um carimbo vermelho.
export const HLHopium: React.FC<{ life: number; img: string; posts: { user: string; text: string; at: number }[]; stamps: { text: string; at: number }[] }> = ({ life, img, posts, stamps }) => {
  const f = useCurrentFrame();
  const o = Math.min(lerp(f, 0, 14, 0, 1, OUT), lerp(f, life - 10, life, 1, 0));
  const e = lerp(f, 0, 26, 0, 1, BACK);
  const breathe = 1 + Math.sin(f / 12) * 0.03;
  return (
    <AbsoluteFill style={{ opacity: o, perspective: 1300 }}>
      <div style={{ position: "absolute", left: 960 - 330, top: 250, width: 660, height: 510, borderRadius: "50%", background: "radial-gradient(closest-side, rgba(120,255,160,0.18), rgba(120,255,160,0))", transform: `scale(${breathe * 1.2})` }} />
      <Img src={staticFile(img)} style={{ position: "absolute", left: 960 - 290, top: 270, width: 580, transform: `scale(${e * breathe}) rotate(${Math.sin(f / 40) * 3}deg)`, filter: "drop-shadow(0 30px 60px rgba(0,0,0,0.6))" }} />
      {posts.map((p, i) => {
        const pe = lerp(f, p.at, p.at + 14, 0, 1, BACK);
        const side = i % 2 ? 1 : -1;
        const row = Math.floor(i / 2);
        const x = 960 + side * (560 + (row % 2) * 60) - 210;
        const y = 150 + row * 190;
        return (
          <div key={i} style={{ position: "absolute", left: x, top: y + Math.sin((f + i * 25) / 35) * 8, width: 420, padding: "16px 20px", ...glass(0.08), borderRadius: 18, opacity: Math.min(1, pe), transform: `scale(${0.8 + 0.2 * pe}) rotate(${side * -2}deg)` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 30, height: 30, borderRadius: 30, background: `hsl(${(i * 67) % 360} 50% 45%)` }} />
              <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 19, color: HL.text }}>{p.user}</span>
            </div>
            <div style={{ fontFamily: FONT, fontSize: 24, color: "rgba(242,240,247,0.9)", marginTop: 10, lineHeight: 1.25 }}>{p.text}</div>
          </div>
        );
      })}
      {stamps.map((s, i) => {
        const se = lerp(f, s.at, s.at + 8, 0, 1, clampE(Easing.out(Easing.quad)));
        if (f < s.at) return null;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: i ? 960 - 120 : 960 - 520,
              top: i ? 760 : 170,
              padding: "10px 26px",
              border: "5px solid #ff3b30",
              borderRadius: 12,
              color: "#ff3b30",
              fontFamily: FONT,
              fontWeight: 900,
              fontSize: 66,
              letterSpacing: 2,
              transform: `rotate(${-10 + i * 6}deg) scale(${2.2 - 1.2 * se})`,
              opacity: se,
              background: "rgba(40,0,0,0.35)",
              textShadow: "0 0 20px rgba(255,59,48,0.5)",
            }}
          >
            ✕ {s.text}
          </div>
        );
      })}
      <div style={{ position: "absolute", right: 44, bottom: 34, ...mono(14, "rgba(242,240,247,0.4)", 2), textTransform: "none" }}>posts simulados · hopium: meme (Know Your Meme)</div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// STEAM MACHINE 3D: caixa girando com luz; cartão "HL3 junto?" ao lado. Em `landAt` pousa ("jun/2026");
// em `dropAt` o cartão HL3 apaga e cai.
export const HLSteamMachine: React.FC<{ life: number; landAt?: number; dropAt?: number; askAt?: number }> = ({ life, landAt = 300, dropAt = 400, askAt = 200 }) => {
  const f = useCurrentFrame();
  const o = Math.min(lerp(f, 0, 14, 0, 1, OUT), lerp(f, life - 10, life, 1, 0));
  const e = lerp(f, 0, 30, 0, 1, OUT);
  const land = lerp(f, landAt, landAt + 20, 0, 1, clampE(Easing.out(Easing.bounce)));
  const spin = f < landAt ? f * 0.9 : landAt * 0.9 + (f - landAt) * 0.9 * (1 - Math.min(1, (f - landAt) / 30));
  const y = (1 - land) * -40 + Math.sin(f / 30) * 10 * (1 - land);
  const ask = lerp(f, askAt, askAt + 16, 0, 1, BACK);
  const drop = lerp(f, dropAt, dropAt + 30, 0, 1, clampE(Easing.in(Easing.quad)));
  const S = 300;
  const face = (tr: string, bg: string, key: string, content?: React.ReactNode) => (
    <div key={key} style={{ position: "absolute", width: S, height: S, transform: tr, background: bg, border: "1.5px solid rgba(159,216,255,0.35)", boxShadow: "inset 0 0 60px rgba(159,216,255,0.08)", backfaceVisibility: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
      {content}
    </div>
  );
  return (
    <AbsoluteFill style={{ opacity: o, perspective: 1400 }}>
      <div style={{ position: "absolute", left: 960 - 420 - S / 2, top: 540 - S / 2 + 20, width: S, height: S, transformStyle: "preserve-3d", transform: `translate3d(0, ${y}px, ${(1 - e) * -1200}px) rotateX(-18deg) rotateY(${spin}deg)` }}>
        {face(`translateZ(${S / 2}px)`, "linear-gradient(160deg,#2c2a38,#121019)", "f", <div style={{ width: 200, height: 4, borderRadius: 4, background: HL.ice, boxShadow: `0 0 24px ${HL.ice}` }} />)}
        {face(`rotateY(180deg) translateZ(${S / 2}px)`, "linear-gradient(160deg,#17151e,#09080d)", "b")}
        {face(`rotateY(90deg) translateZ(${S / 2}px)`, "linear-gradient(160deg,#211f2a,#0d0c12)", "r")}
        {face(`rotateY(-90deg) translateZ(${S / 2}px)`, "linear-gradient(160deg,#211f2a,#0d0c12)", "l")}
        {face(`rotateX(90deg) translateZ(${S / 2}px)`, "linear-gradient(160deg,#4a4660,#1e1b28)", "t")}
        {face(`rotateX(-90deg) translateZ(${S / 2}px)`, "#050408", "u")}
      </div>
      <div style={{ position: "absolute", left: 960 - 420 - 180, top: 800, width: 360, height: 40, borderRadius: "50%", background: "radial-gradient(closest-side, rgba(159,216,255,0.25), rgba(159,216,255,0))", opacity: e }} />
      <div style={{ position: "absolute", left: 960 - 420 - 200, top: 860, width: 400, textAlign: "center", opacity: e }}>
        <div style={{ fontFamily: FONT, fontWeight: 750, fontSize: 44, color: HL.text }}>Steam Machine</div>
        <div style={{ ...mono(20, land > 0.5 ? HL.orange : HL.dim, 5), marginTop: 6 }}>{land > 0.5 ? "saiu · jun/2026" : "primavera de 2026?"}</div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 960 + 140,
          top: 380,
          width: 520,
          padding: "30px 34px",
          ...glass(0.35 * (1 - drop)),
          opacity: ask * (1 - drop * 0.9),
          transform: `translateY(${drop * 420}px) rotate(${drop * 24}deg) scale(${ask})`,
          filter: drop > 0 ? `grayscale(${drop})` : undefined,
        }}
      >
        <div style={{ ...mono(18, HL.orange, 5) }}>a promessa dos vazamentos</div>
        <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 72, color: HL.text, marginTop: 10, lineHeight: 1 }}>Half-Life 3 junto?</div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// PRINTS ANIMADOS: cada print entra inclinado em 3D; retângulos de marca-texto varrem trechos
// (coordenadas em fração da imagem).
type Print = { src: string; at: number; x: number; y: number; w: number; rot?: number; hl?: { x: number; y: number; w: number; h: number; at: number }[]; credit?: string };
export const HLPrints: React.FC<{ life: number; prints: Print[] }> = ({ life, prints }) => {
  const f = useCurrentFrame();
  const o = Math.min(lerp(f, 0, 12, 0, 1, OUT), lerp(f, life - 10, life, 1, 0));
  return (
    <AbsoluteFill style={{ opacity: o, perspective: 1500 }}>
      {prints.map((p, i) => {
        const e = lerp(f, p.at, p.at + 22, 0, 1, OUT);
        const rot = p.rot ?? (i % 2 ? 4 : -4);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: p.x,
              top: p.y,
              width: p.w,
              transform: `translate3d(0, ${(1 - e) * 120 + Math.sin((f + i * 30) / 50) * 6}px, ${(1 - e) * -700}px) rotateY(${(1 - e) * -25 + rot * 0.4}deg) rotateZ(${rot * (0.3 + 0.7 * (1 - e)) }deg)`,
              opacity: e,
              boxShadow: "0 40px 100px rgba(0,0,0,0.6)",
              borderRadius: 10,
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.2)",
            }}
          >
            <Img src={staticFile(p.src)} style={{ width: "100%", display: "block" }} />
            {(p.hl ?? []).map((h, k) => {
              const s = lerp(f, h.at, h.at + 14, 0, 1, clampE(Easing.inOut(Easing.quad)));
              return <div key={k} style={{ position: "absolute", left: `${h.x * 100}%`, top: `${h.y * 100}%`, width: `${h.w * 100 * s}%`, height: `${h.h * 100}%`, background: "rgba(255,210,40,0.42)", mixBlendMode: "multiply", borderRadius: 4 }} />;
            })}
            {p.credit ? <div style={{ position: "absolute", right: 8, bottom: 6, fontFamily: MONO, fontSize: 13, color: "rgba(0,0,0,0.55)", background: "rgba(255,255,255,0.7)", padding: "2px 6px", borderRadius: 4 }}>{p.credit}</div> : null}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// VARIÁVEL: digitada letra por letra numa janela; a tradução aparece embaixo; o print real do post entra ao lado.
export const HLVariable: React.FC<{ life: number; name?: string; translation?: string; typeDur?: number; printSrc?: string; printAt?: number; stampAt?: number }> = ({
  life,
  name = "m_bHackWhyAreYouGuysReadingOurVariableNames",
  translation = "“por que vocês estão lendo os nomes das nossas variáveis?”",
  typeDur = 60,
  printSrc,
  printAt = 1e9,
  stampAt = 1e9,
}) => {
  const f = useCurrentFrame();
  const o = Math.min(lerp(f, 0, 12, 0, 1, OUT), lerp(f, life - 10, life, 1, 0));
  const n = Math.floor(lerp(f, 6, 6 + typeDur, 0, name.length, C));
  const tr = lerp(f, 6 + typeDur, 6 + typeDur + 16, 0, 1, OUT);
  const pr = lerp(f, printAt, printAt + 22, 0, 1, OUT);
  const back = lerp(f, stampAt - 10, stampAt + 20, 0, 1, INOUT);
  const st = lerp(f, stampAt, stampAt + 9, 0, 1, clampE(Easing.out(Easing.quad)));
  return (
    <AbsoluteFill style={{ opacity: o, perspective: 1400 }}>
      <div style={{ position: "absolute", left: 960 - 760 + pr * -40, top: 380, width: 1520 - pr * 560, transform: `translateZ(${back * -500}px)`, opacity: 1 - back * 0.6 }}>
        <div style={{ ...glass(0.25), padding: "34px 36px", borderRadius: 20 }}>
          <div style={{ ...mono(15, HL.dim, 3), marginBottom: 14, textTransform: "none" }}>dota 2 / CDOTAGameRules.h</div>
          <div style={{ fontFamily: MONO, fontSize: pr > 0.5 ? 26 : 38, color: HL.text, wordBreak: "break-all", lineHeight: 1.4 }}>
            <span style={{ color: "#ff7b72" }}>bool </span>
            <span style={{ background: "rgba(40,200,64,0.18)", color: "#7ee787" }}>{name.slice(0, n)}</span>
            <span style={{ opacity: f % 24 < 12 && n < name.length ? 1 : 0 }}>▍</span>
            {n >= name.length ? ";" : null}
          </div>
        </div>
        <div style={{ fontFamily: FONT, fontStyle: "italic", fontSize: pr > 0.5 ? 34 : 46, color: HL.orange, marginTop: 24, opacity: tr, transform: `translateY(${(1 - tr) * 16}px)` }}>{translation}</div>
      </div>
      {printSrc ? (
        <Img
          src={staticFile(printSrc)}
          style={{
            position: "absolute",
            right: 150,
            top: 170,
            width: 560,
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.25)",
            boxShadow: "0 40px 100px rgba(0,0,0,0.6)",
            opacity: pr * (1 - back * 0.6),
            transform: `translate3d(${(1 - pr) * 300}px, 0, ${back * -500}px) rotateY(${(1 - pr) * -30 - 6}deg)`,
          }}
        />
      ) : null}
      {f >= stampAt ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 440, display: "flex", justifyContent: "center" }}>
          <div style={{ padding: "18px 40px", border: `4px solid ${HL.ice}`, borderRadius: 14, color: HL.ice, background: "rgba(10,20,30,0.55)", transform: `rotate(-6deg) scale(${2 - st})`, opacity: st, ...mono(64, HL.ice, 10), fontWeight: 700, boxShadow: "0 0 40px rgba(159,216,255,0.35)" }}>
            não confirmado
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// "DE NOVO, DE NOVO E DE NOVO": linha do tempo 2024 → 2026 com um "HLX" acendendo em cada ponto.
export const HLRepeat: React.FC<{ life: number; hits: number[] }> = ({ life, hits }) => {
  const f = useCurrentFrame();
  const o = Math.min(lerp(f, 0, 12, 0, 1, OUT), lerp(f, life - 10, life, 1, 0));
  const line = lerp(f, 0, 30, 0, 1, OUT);
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <div style={{ position: "absolute", left: 200, right: 200, top: 600, height: 2, background: "rgba(255,255,255,0.2)", transform: `scaleX(${line})`, transformOrigin: "0 50%" }} />
      {["2024", "2025", "2026"].map((y, i) => (
        <div key={y} style={{ position: "absolute", left: 200 + i * 760, top: 630, transform: "translateX(-50%)", ...mono(22, HL.dim, 6), opacity: line }}>
          {y}
        </div>
      ))}
      {hits.map((h, i) => {
        const e = lerp(f, h, h + 10, 0, 1, BACK);
        const x = 240 + (i / Math.max(1, hits.length - 1)) * 1440;
        const fade = lerp(f, h + 12, h + 40, 1, 0.55, C);
        return (
          <div key={i} style={{ position: "absolute", left: x, top: 470 - (i % 3) * 70, transform: `translateX(-50%) scale(${e})`, opacity: fade }}>
            <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 54, color: HL.orange, textShadow: "0 0 24px rgba(255,138,31,0.6)" }}>HLX</div>
            <div style={{ width: 2, height: 70 + (i % 3) * 70, margin: "6px auto 0", background: "linear-gradient(rgba(255,138,31,0.7), rgba(255,138,31,0))" }} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// CONVERGÊNCIA: setas de luz chegam de todos os lados e apontam para um centro vazio.
export const HLConverge: React.FC<{ life: number; nadaAt?: number }> = ({ life, nadaAt = 110 }) => {
  const f = useCurrentFrame();
  const o = Math.min(lerp(f, 0, 12, 0, 1, OUT), lerp(f, life - 20, life, 1, 0));
  const fade = lerp(f, nadaAt, nadaAt + 30, 1, 0.15, INOUT);
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <svg viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i / 12) * Math.PI * 2 + 0.2;
          const e = lerp(f, i * 3, i * 3 + 30, 0, 1, OUT);
          const r0 = 900;
          const r1 = 900 - e * 760;
          const x0 = 960 + Math.cos(a) * r0;
          const y0 = 540 + Math.sin(a) * r0;
          const x1 = 960 + Math.cos(a) * r1;
          const y1 = 540 + Math.sin(a) * r1;
          return <line key={i} x1={x0} y1={y0} x2={x1} y2={y1} stroke={i % 3 ? "rgba(159,216,255,0.5)" : "rgba(255,138,31,0.7)"} strokeWidth={3} opacity={fade} />;
        })}
        <circle cx={960} cy={540} r={120} fill="none" stroke="rgba(255,255,255,0.3)" strokeDasharray="6 10" opacity={fade} />
      </svg>
      <div style={{ position: "absolute", left: 0, right: 0, top: 520, textAlign: "center", opacity: lerp(f, nadaAt, nadaAt + 16, 0, 1, OUT), ...mono(28, "rgba(242,240,247,0.7)", 16) }}>nada</div>
    </AbsoluteFill>
  );
};
