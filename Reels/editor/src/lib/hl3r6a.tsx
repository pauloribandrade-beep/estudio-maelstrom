// =================================================================================================
// HL3 · REFORMULAÇÃO · módulo 6 (parte 1) (06/10/2026)
//  HLRAlyxBetter · HLRStuckBase · HLRBreenPod · HLRHiveMind · HLRHostBodies · HLRBreenRecord · HLRLineage ·
//  HLRIrony · HLRBreenLast — cada uma numa linguagem: telemetria, corte do casco, casulo de suporte, rede neural,
//  linha de montagem da consciência, ramificação de linha do tempo, cadeia histórica, tipografia, falas cinéticas.
//  Sem personagem desenhado.
// =================================================================================================
import React, { useMemo } from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { FONT, MONO } from "./overlays";
import { C, HL, rnd } from "./hl3";
import { FilmLook } from "./hl3r";
import { ShipProfile } from "./hl3rd";

const RED = "#ff5d4d";
const CREAM = "#ffe2b0";
const ICE = "#9fe6ff";
const GREEN = "#8dffa8";
const ORANGE = HL.orange;
const AMB = "#ffb22e";
const CYAN = "#5ff3ff";
const APT = "#f39a1c";
const VIO = "#c79bff";
const TXT = HL.text;
const P = (f: number, at: number, d = 12) => interpolate(f, [at, at + d], [0, 1], { ...C, easing: Easing.out(Easing.cubic) });
const IO = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const fade = (f: number, life: number) => interpolate(f, [0, 6], [1, 0], C) + interpolate(f, [life - 6, life], [0, 1], C);
type Pr = { life: number } & Record<string, number | undefined>;
const g = (p: Pr, k: string) => (p[k] as number | undefined) ?? 1e9;
const Head: React.FC<{ t: string; s?: string; c?: string; o?: number }> = ({ t, s, c = ICE, o = 1 }) => (
  <div style={{ position: "absolute", left: 80, top: 60, fontFamily: MONO, letterSpacing: 6, opacity: o }}>
    <div style={{ fontSize: 20, color: c }}>{t}</div>
    {s ? <div style={{ fontSize: 15, color: "rgba(242,240,247,0.6)", marginTop: 6 }}>{s}</div> : null}
  </div>
);
const Big: React.FC<{ k: string; t: string; c?: string; o: number; right?: boolean; top?: number; size?: number }> = ({ k, t, c = CREAM, o, right, top = 60, size = 72 }) => (
  <div style={{ position: "absolute", [right ? "right" : "left"]: 90, top, textAlign: right ? "right" : "left", opacity: o } as React.CSSProperties}>
    <div style={{ fontFamily: MONO, fontSize: 16, letterSpacing: 6, color: c }}>{k}</div>
    <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: size, color: TXT, lineHeight: 1.02 }}>{t}</div>
  </div>
);
const Shell: React.FC<{ f: number; life: number; bg?: string; children: React.ReactNode }> = ({ f, life, bg = "radial-gradient(ellipse at 50% 45%, #10161c 0%, #040608 78%)", children }) => (
  <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
    {children}
    <AbsoluteFill style={{ background: "#000", opacity: fade(f, life), pointerEvents: "none" }} />
    <FilmLook />
  </AbsoluteFill>
);

// ---------------------------------------------------------------- 1) a Alyx parece melhor… não foi isso
export const HLRAlyxBetter: React.FC<Pr> = (p) => {
  const f = useCurrentFrame();
  const [betterAt, painAt, lostAt, solvedAt, notAt, answerAt, corrAt, crabAt, insecAt, actAt, knowsAt, noExplainAt] = ["betterAt", "painAt", "lostAt", "solvedAt", "notAt", "answerAt", "corrAt", "crabAt", "insecAt", "actAt", "knowsAt", "noExplainAt"].map((k) => g(p, k));
  const part1 = 1 - P(f, notAt - 6, 12);
  const sym = [
    ["DORES DE CABEÇA", painAt],
    ["PERDIDA NAS FRASES", lostAt],
    ["LAPSOS", solvedAt - 20],
  ] as const;
  const conf = interpolate(f, [insecAt - 10, insecAt + 30], [0.22, 1], C);
  return (
    <Shell f={f} life={p.life}>
      <Head t="ALYX VANCE · DEPOIS DO SALTO" s={f >= notAt ? "NÃO FOI ISSO QUE ACONTECEU" : "ELA PARECE MELHOR"} c={f >= notAt ? RED : GREEN} />
      {part1 > 0 ? (
        <AbsoluteFill style={{ opacity: part1 }}>
          {sym.map(([l, at], i) => {
            const v = 1 - P(f, at, 30);
            return (
              <div key={l} style={{ position: "absolute", left: 260, top: 280 + i * 150, width: 1400 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 22, letterSpacing: 5, color: TXT }}>
                  <span>{l}</span>
                  <span style={{ color: v < 0.05 ? GREEN : AMB }}>{Math.round(v * 100)}%</span>
                </div>
                <div style={{ height: 16, marginTop: 10, background: "rgba(242,240,247,0.1)", borderRadius: 8 }}>
                  <div style={{ height: 16, width: `${v * 100}%`, background: v < 0.05 ? GREEN : AMB, borderRadius: 8 }} />
                </div>
              </div>
            );
          })}
          {f >= solvedAt ? <div style={{ position: "absolute", left: 0, right: 0, top: 760, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 72, color: GREEN, opacity: P(f, solvedAt, 10) }}>resolvido?</div> : null}
        </AbsoluteFill>
      ) : null}
      {part1 < 1 ? (
        <AbsoluteFill style={{ opacity: 1 - part1 }}>
          {f < answerAt + 10 ? (
            <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: 1 - P(f, answerAt - 8, 12) }}>
              <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 130, color: RED }}>não foi isso</div>
            </AbsoluteFill>
          ) : null}
          {/* 1) responde antes da Mossman terminar */}
          <div style={{ position: "absolute", left: 120, top: 200, width: 820, opacity: P(f, answerAt - 6, 10) }}>
            <div style={{ fontFamily: MONO, fontSize: 16, letterSpacing: 5, color: ORANGE }}>RESPONDE ANTES DA PERGUNTA ACABAR</div>
            <svg width={820} height={150} style={{ marginTop: 12 }}>
              <rect x={0} y={20} width={560 * P(f, answerAt - 6, 30)} height={40} rx={8} fill="rgba(159,230,255,0.25)" stroke={ICE} />
              <text x={10} y={48} fill={ICE} fontFamily={MONO} fontSize={16} letterSpacing={3}>
                MOSSMAN
              </text>
              <rect x={440} y={80} width={330 * P(f, answerAt + 6, 24)} height={40} rx={8} fill="rgba(255,152,40,0.25)" stroke={ORANGE} />
              <text x={450} y={108} fill={ORANGE} fontFamily={MONO} fontSize={16} letterSpacing={3}>
                ALYX
              </text>
              <line x1={440} x2={440} y1={10} y2={130} stroke={RED} strokeWidth={2} strokeDasharray="4 4" opacity={P(f, answerAt + 20, 8)} />
              <line x1={560} x2={560} y1={10} y2={130} stroke={RED} strokeWidth={2} strokeDasharray="4 4" opacity={P(f, answerAt + 20, 8)} />
              <text x={500} y={148} textAnchor="middle" fill={RED} fontFamily={MONO} fontSize={16} opacity={P(f, answerAt + 20, 8)}>
                −0,8 S
              </text>
            </svg>
          </div>
          {/* 2) sabe qual corredor vai mudar */}
          <div style={{ position: "absolute", left: 1000, top: 200, width: 800, opacity: P(f, corrAt - 6, 10) }}>
            <div style={{ fontFamily: MONO, fontSize: 16, letterSpacing: 5, color: ORANGE }}>SABE QUAL CORREDOR VAI MUDAR</div>
            <svg width={800} height={150} style={{ marginTop: 12 }}>
              {Array.from({ length: 5 }).map((_, k) => {
                const it = k === 2;
                const changed = it && f >= corrAt + 24;
                return (
                  <g key={k}>
                    <rect x={20 + k * 150} y={30} width={120} height={80} rx={6} fill={changed ? "rgba(199,155,255,0.3)" : "rgba(159,230,255,0.08)"} stroke={changed ? VIO : "rgba(159,230,255,0.4)"} />
                    {it && f >= corrAt ? <rect x={12 + k * 150} y={22} width={136} height={96} rx={10} fill="none" stroke={ORANGE} strokeWidth={3} strokeDasharray="8 5" /> : null}
                  </g>
                );
              })}
            </svg>
          </div>
          {/* 3) o headcrab antes do salto */}
          <div style={{ position: "absolute", left: 120, top: 520, width: 820, opacity: P(f, crabAt - 6, 10) }}>
            <div style={{ fontFamily: MONO, fontSize: 16, letterSpacing: 5, color: ORANGE }}>DERRUBA O HEADCRAB ANTES DO SALTO</div>
            <svg width={820} height={170} style={{ marginTop: 12 }}>
              <path d="M 40 150 Q 260 0 520 150" fill="none" stroke="rgba(255,93,77,0.6)" strokeWidth={3} strokeDasharray="10 8" />
              <circle cx={40} cy={150} r={14} fill={RED} opacity={f >= crabAt + 10 ? 0.3 : 1} />
              {f >= crabAt + 10 ? <path d="M 26 136 L 54 164 M 54 136 L 26 164" stroke={RED} strokeWidth={4} /> : null}
              <circle cx={520} cy={150} r={12} fill={ORANGE} />
              <text x={300} y={40} textAnchor="middle" fill="rgba(242,240,247,0.6)" fontFamily={MONO} fontSize={14} letterSpacing={3}>
                O SALTO QUE NÃO ACONTECEU
              </text>
            </svg>
          </div>
          {/* 4) a insegurança some */}
          <div style={{ position: "absolute", left: 1000, top: 520, width: 800, opacity: P(f, insecAt - 6, 10) }}>
            <div style={{ fontFamily: MONO, fontSize: 16, letterSpacing: 5, color: ORANGE }}>A INSEGURANÇA DESAPARECE</div>
            <div style={{ height: 18, marginTop: 26, background: "rgba(242,240,247,0.1)", borderRadius: 9 }}>
              <div style={{ height: 18, width: `${conf * 100}%`, background: ORANGE, borderRadius: 9, boxShadow: "0 0 20px rgba(255,152,40,0.6)" }} />
            </div>
            <div style={{ fontFamily: MONO, fontSize: 15, letterSpacing: 3, color: "rgba(242,240,247,0.6)", marginTop: 8 }}>CONFIANÇA</div>
          </div>
          {f >= actAt ? <Big k="ELA COMEÇA A AGIR" t={f >= knowsAt ? "como quem já conhece o navio" : "não tenta mais entender"} c={ORANGE} o={P(f, actAt, 10) * (1 - P(f, noExplainAt - 6, 10))} top={820} /> : null}
          {f >= noExplainAt ? <Big k="O JOGO NÃO EXPLICA AINDA" t="algo mudou no salto" c={RED} o={P(f, noExplainAt, 10)} top={820} /> : null}
        </AbsoluteFill>
      ) : null}
      {void betterAt}
    </Shell>
  );
};

// ---------------------------------------------------------------- 2) a instalação presa ao casco
export const HLRStuckBase: React.FC<Pr> = (p) => {
  const f = useCurrentFrame();
  const [baseAt, zombAt, equipAt, marksAt, tooLongAt] = ["baseAt", "zombAt", "equipAt", "marksAt", "tooLongAt"].map((k) => g(p, k));
  const S = 1.5;
  const X0 = 960 - 500 * S;
  const Y0 = 380 - 150 * S;
  const tally = Math.min(60, Math.max(0, Math.floor((f - marksAt) * 1.2)));
  const wall = P(f, marksAt - 6, 14);
  return (
    <Shell f={f} life={p.life}>
      <AbsoluteFill style={{ opacity: 1 - wall }}>
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          <g transform={`translate(${X0} ${Y0}) scale(${S})`}>
            <ShipProfile stroke="rgba(159,230,255,0.45)" fill="rgba(159,230,255,0.03)" w={1.4} />
            {/* o módulo Combine fundido no casco */}
            <g opacity={P(f, baseAt, 20)}>
              <path d="M 420 300 L 400 210 L 450 150 L 620 150 L 660 220 L 640 300 Z" fill="#0d1418" stroke={CYAN} strokeWidth={2} />
              <path d="M 450 150 L 470 90 L 600 90 L 620 150" fill="#0d1418" stroke={CYAN} strokeWidth={2} />
              {Array.from({ length: 6 }).map((_, k) => (
                <rect key={k} x={440 + k * 30} y={180} width={18} height={4} fill={CYAN} opacity={0.5 + 0.5 * Math.sin(f / 6 + k)} />
              ))}
              {/* braços / scanners trabalhando sozinhos */}
              {f >= equipAt
                ? [0, 1].map((k) => {
                    const a = Math.sin(f / (12 + k * 5)) * 30;
                    return <line key={k} x1={470 + k * 120} y1={250} x2={470 + k * 120 + Math.sin((a * Math.PI) / 180) * 50} y2={250 + Math.cos((a * Math.PI) / 180) * 30} stroke={CYAN} strokeWidth={4} strokeLinecap="round" />;
                  })
                : null}
              <text x={530} y={80} textAnchor="middle" fill={CYAN} fontFamily={MONO} fontSize={12} letterSpacing={3}>
                INSTALAÇÃO COMBINE
              </text>
            </g>
            {/* soldados infectados (andar errático) */}
            {f >= zombAt
              ? Array.from({ length: 5 }).map((_, k) => {
                  const x = 460 + k * 36 + Math.sin(f / (17 + k * 3) + k) * 14;
                  const y = 275 + Math.sin(f / 9 + k) * 2;
                  return (
                    <g key={k} opacity={P(f, zombAt + k * 4, 8)}>
                      <path d={`M ${x - 7} ${y - 6} L ${x + 7} ${y - 6} L ${x + 5} ${y + 7} L ${x} ${y + 11} L ${x - 5} ${y + 7} Z`} fill="#0a1214" stroke={GREEN} strokeWidth={1.2} />
                    </g>
                  );
                })
              : null}
          </g>
        </svg>
        <Head t="PRESA AO CASCO" s={f >= equipAt ? "EQUIPAMENTOS FUNCIONANDO SOZINHOS" : f >= zombAt ? "SOLDADOS VIRARAM ZUMBIS · AINDA DE ARMADURA" : "UMA INSTALAÇÃO COMBINE INTEIRA"} c={CYAN} />
      </AbsoluteFill>
      {/* as marcas na parede: dias riscados */}
      {wall > 0 ? (
        <AbsoluteFill style={{ opacity: wall, background: "linear-gradient(180deg, #2a2e30, #1a1d1f)" }}>
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
            {Array.from({ length: tally }).map((_, k) => {
              const grp = Math.floor(k / 5);
              const inG = k % 5;
              const gx = 220 + (grp % 6) * 250;
              const gy = 260 + Math.floor(grp / 6) * 220;
              if (inG === 4) return <line key={k} x1={gx - 20} y1={gy + 120} x2={gx + 150} y2={gy + 10} stroke="#c9c2b0" strokeWidth={6} strokeLinecap="round" />;
              return <line key={k} x1={gx + inG * 34} y1={gy} x2={gx + inG * 34 + (rnd(k) - 0.5) * 10} y2={gy + 130} stroke="#c9c2b0" strokeWidth={6} strokeLinecap="round" />;
            })}
          </svg>
          <Big k="MARCAS NAS PAREDES" t={f >= tooLongAt ? "de quem ficou preso tempo demais" : `${tally} dias`} c={RED} o={P(f, marksAt, 10)} top={80} />
        </AbsoluteFill>
      ) : null}
    </Shell>
  );
};

// ---------------------------------------------------------------- 3) o casulo: Freeman
export const HLRBreenPod: React.FC<Pr> = (p) => {
  const f = useCurrentFrame();
  const [podAt, cablesAt, larvalAt, advAt, looksAt, voiceAt, freemanAt, breenAt, believesAt, mossAt] = ["podAt", "cablesAt", "larvalAt", "advAt", "looksAt", "voiceAt", "freemanAt", "breenAt", "believesAt", "mossAt"].map((k) => g(p, k));
  const look = IO((f - looksAt) / 14);
  const pod = P(f, podAt, 20);
  return (
    <Shell f={f} life={p.life} bg="radial-gradient(ellipse at 50% 50%, #0c1214 0%, #030506 78%)">
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: pod }}>
        {/* cabos */}
        {Array.from({ length: 10 }).map((_, k) => {
          const x0 = 200 + k * 160;
          const on = P(f, cablesAt + k * 2, 12);
          return <path key={k} d={`M ${x0} 0 C ${x0} 300, ${960 + (k - 5) * 30} 260, ${960 + (k - 5) * 22} 420`} fill="none" stroke="#2a3134" strokeWidth={10} opacity={on} />;
        })}
        {/* o casulo */}
        <ellipse cx={960} cy={600} rx={300} ry={220} fill="#0b1114" stroke={CYAN} strokeWidth={3} />
        <ellipse cx={960} cy={600} rx={250} ry={170} fill="rgba(141,255,168,0.06)" stroke="rgba(141,255,168,0.4)" strokeWidth={2} />
        {/* a forma lá dentro: só sombra e respiração */}
        <ellipse cx={960 + Math.sin(f / 30) * 6} cy={620} rx={150 + Math.sin(f / 18) * 6} ry={90 + Math.sin(f / 18) * 4} fill="rgba(200,190,170,0.18)" style={{ filter: "blur(12px)" }} opacity={P(f, larvalAt, 20)} />
        {/* o sensor (a lente) que vira para o Gordon */}
        <g transform={`translate(${960 + 120 * (1 - look)} ${540 - 30 * (1 - look)})`}>
          <circle r={34} fill="#0a0d0f" stroke={CYAN} strokeWidth={3} />
          <circle r={14 + 6 * look} fill={look > 0.5 ? "#ffe9a8" : "rgba(95,243,255,0.6)"} />
        </g>
        {/* sinais vitais do suporte */}
        <g transform="translate(1380 820)" opacity={P(f, cablesAt, 14)}>
          <rect x={0} y={0} width={420} height={120} rx={10} fill="rgba(6,10,12,0.85)" stroke="rgba(95,243,255,0.4)" />
          <text x={16} y={28} fill={CYAN} fontFamily={MONO} fontSize={14} letterSpacing={3}>
            SUPORTE · HOSPEDEIRO
          </text>
          <polyline points={Array.from({ length: 96 }).map((_, i) => `${16 + i * 4},${80 + ((i + Math.floor(f / 2)) % 32 === 8 ? -26 : (i + Math.floor(f / 2)) % 32 === 9 ? 16 : 0)}`).join(" ")} fill="none" stroke={GREEN} strokeWidth={2} />
        </g>
      </svg>
      <Head t="NO FUNDO DE UMA DAS SALAS" s={f >= advAt ? "COMO AS LARVAS DOS ADVISORS" : f >= larvalAt ? "UMA CRIATURA LARVAL" : "UMA ESTRUTURA COMBINE LIGADA A CABOS"} c={CYAN} />
      {/* a voz: Freeman */}
      {f >= voiceAt ? (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-end", paddingBottom: 120 }}>
          <svg width={1200} height={120} style={{ opacity: P(f, voiceAt, 10) }}>
            <polyline points={Array.from({ length: 200 }).map((_, i) => `${i * 6},${60 + Math.sin(i * 0.7 + f * 0.9) * 30 * (f >= freemanAt && f < freemanAt + 24 ? 1 : 0.2) * (0.4 + rnd(i + Math.floor(f / 2)) * 0.6)}`).join(" ")} fill="none" stroke={CREAM} strokeWidth={2.5} />
          </svg>
          {f >= freemanAt ? <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 140, letterSpacing: 8, color: TXT, opacity: P(f, freemanAt, 6), filter: `blur(${(1 - P(f, freemanAt, 14)) * 6}px)` }}>“Freeman.”</div> : null}
        </AbsoluteFill>
      ) : null}
      {f >= breenAt ? (
        <div style={{ position: "absolute", right: 90, top: 150, width: 520, padding: "20px 24px", background: "rgba(10,12,14,0.85)", border: `1px solid ${RED}`, borderRadius: 12, opacity: P(f, breenAt, 10) }}>
          <div style={{ fontFamily: MONO, fontSize: 15, letterSpacing: 5, color: RED }}>{f >= believesAt ? "ALGO QUE ACREDITA SER" : "É O"}</div>
          <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 64, color: TXT, lineHeight: 1 }}>Wallace Breen</div>
          {f >= mossAt ? <div style={{ fontFamily: MONO, fontSize: 16, letterSpacing: 4, color: ICE, marginTop: 10, opacity: P(f, mossAt, 8) }}>MOSSMAN · PARADA · ?</div> : null}
        </div>
      ) : null}
    </Shell>
  );
};

// ---------------------------------------------------------------- 4) Shu'ulathoi: a mente coletiva
export const HLRHiveMind: React.FC<Pr> = (p) => {
  const f = useCurrentFrame();
  const [termAt, techAt, meanAt, vortAt, nameAt, laidAt, ep3At, beforeAt, psyAt, sepAt, connectAt, worldAt, knowAt, bodyAt] = ["termAt", "techAt", "meanAt", "vortAt", "nameAt", "laidAt", "ep3At", "beforeAt", "psyAt", "sepAt", "connectAt", "worldAt", "knowAt", "bodyAt"].map((k) => g(p, k));
  const nodes = useMemo(() => Array.from({ length: 26 }).map((_, i) => ({ x: 200 + rnd(i * 3.1) * 1520, y: 240 + rnd(i * 5.7) * 640, z: rnd(i * 7.3) })), []);
  const net = P(f, psyAt, 20);
  const conn = P(f, connectAt, 40);
  const bodiesGone = P(f, bodyAt - 20, 30);
  const name = P(f, nameAt - 4, 10) * (1 - P(f, laidAt - 6, 10));
  const doc = P(f, laidAt - 6, 12) * (1 - P(f, psyAt - 10, 10));
  const term = 1 - P(f, nameAt - 10, 10);
  return (
    <Shell f={f} life={p.life} bg="radial-gradient(ellipse at 50% 50%, #120e1a 0%, #040306 78%)">
      {/* terminais */}
      {term > 0 ? (
        <AbsoluteFill style={{ opacity: term }}>
          <Head t="OS TERMINAIS AO REDOR" s={f >= meanAt ? "MUDA O SIGNIFICADO DA CENA" : f >= techAt ? "UMA PARTE DA TECNOLOGIA COMBINE" : ""} c={CYAN} />
          <div style={{ position: "absolute", left: 260, top: 260, width: 1400, height: 520, padding: 30, background: "rgba(4,10,12,0.9)", border: "1px solid rgba(95,243,255,0.4)", borderRadius: 12, fontFamily: MONO, fontSize: 20, lineHeight: 1.7, color: CYAN }}>
            {["OVERWATCH · ARQUIVO BIOLÓGICO", "ESPÉCIE: ████████", "ORIGEM: MUNDO CONQUISTADO 0x2C", "APLICAÇÃO: HOSPEDEIRO / RECIPIENTE", "STATUS: INCORPORADA"].map((l, i) => (
              <div key={i} style={{ opacity: P(f, termAt + i * 10, 6) }}>
                {l}
              </div>
            ))}
          </div>
        </AbsoluteFill>
      ) : null}
      {/* o nome */}
      {name > 0 ? (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: name }}>
          <div style={{ fontFamily: MONO, fontSize: 20, letterSpacing: 8, color: GREEN }}>OS VORTIGAUNTS CHAMAM A ESPÉCIE DOS ADVISORS DE</div>
          <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 170, letterSpacing: -4, color: TXT, marginTop: 10 }}>
            {"Shu'ulathoi".split("").map((ch, i) => (
              <span key={i} style={{ opacity: P(f, nameAt + i * 2, 6), display: "inline-block", transform: `translateY(${(1 - P(f, nameAt + i * 2, 10)) * 30}px)` }}>
                {ch}
              </span>
            ))}
          </div>
        </AbsoluteFill>
      ) : null}
      {/* Marc Laidlaw */}
      {doc > 0 ? (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: doc }}>
          <div style={{ width: 900, padding: "36px 44px", background: "#e9e4d6", color: "#1d1a17", borderRadius: 4, boxShadow: "0 30px 80px rgba(0,0,0,0.6)", transform: "rotate(-1.5deg)" }}>
            <div style={{ fontFamily: MONO, fontSize: 16, letterSpacing: 5, color: "#6a6252" }}>FORA DOS JOGOS · MARC LAIDLAW</div>
            <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 56, lineHeight: 1.05, marginTop: 10 }}>o conceito que poderia ter virado o Episódio 3</div>
            <div style={{ fontFamily: MONO, fontSize: 18, letterSpacing: 3, marginTop: 16, color: "#6a6252", opacity: P(f, beforeAt, 8) }}>ANTES DE SEREM INCORPORADOS AO COMBINE…</div>
          </div>
        </AbsoluteFill>
      ) : null}
      {/* a rede psíquica */}
      {net > 0 ? (
        <AbsoluteFill style={{ opacity: net }}>
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
            {nodes.map((a, i) =>
              nodes.slice(i + 1).map((b, j) => {
                const d = Math.hypot(a.x - b.x, a.y - b.y);
                if (d > 420) return null;
                const pulse = 0.5 + 0.5 * Math.sin(f / 8 + i + j);
                return <line key={`${i}-${j}`} x1={a.x} y1={a.y} x2={a.x + (b.x - a.x) * conn} y2={a.y + (b.y - a.y) * conn} stroke={VIO} strokeWidth={1.5} opacity={(0.25 + 0.5 * pulse) * conn} />;
              }),
            )}
            {nodes.map((n, i) => (
              <g key={i}>
                <circle cx={n.x} cy={n.y} r={18 + n.z * 14} fill="rgba(200,190,170,0.18)" opacity={1 - bodiesGone} />
                <circle cx={n.x} cy={n.y} r={5 + 3 * Math.sin(f / 7 + i)} fill={VIO} style={{ filter: "drop-shadow(0 0 8px #c79bff)" }} />
              </g>
            ))}
          </svg>
          <Head t="UMA ESPÉCIE PROFUNDAMENTE PSÍQUICA" s={f >= worldAt ? "UM MUNDO MENTAL COLETIVO" : f >= connectAt ? "AS MENTES SE CONECTAVAM" : f >= sepAt ? "MESMO SEPARADOS FISICAMENTE" : ""} c={VIO} />
          {f >= knowAt ? (
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 100, display: "flex", justifyContent: "center", gap: 30 }}>
              {["CONHECIMENTO", "MEMÓRIA", "CULTURA"].map((w, i) => (
                <div key={w} style={{ padding: "10px 22px", border: `2px solid ${VIO}`, borderRadius: 10, fontFamily: MONO, fontSize: 22, letterSpacing: 5, color: VIO, opacity: P(f, knowAt + i * 12, 8) }}>
                  {w}
                </div>
              ))}
              {f >= bodyAt - 20 ? <div style={{ alignSelf: "center", fontFamily: FONT, fontWeight: 800, fontSize: 40, color: TXT, opacity: P(f, bodyAt - 20, 10) }}>sem depender do corpo</div> : null}
            </div>
          ) : null}
        </AbsoluteFill>
      ) : null}
      {void vortAt}
      {void ep3At}
    </Shell>
  );
};

// ---------------------------------------------------------------- 5) host bodies
export const HLRHostBodies: React.FC<Pr> = (p) => {
  const f = useCurrentFrame();
  const [conqAt, bioAt, techAt, larvalAt, hostAt, recAt, presAt, copyAt, printAt, advAt, whoAt, interpAt, moreAt, recipAt] = ["conqAt", "bioAt", "techAt", "larvalAt", "hostAt", "recAt", "presAt", "copyAt", "printAt", "advAt", "whoAt", "interpAt", "moreAt", "recipAt"].map((k) => g(p, k));
  const line = 1 - P(f, advAt - 10, 14);
  const STATIONS = [
    ["PRESERVAR", presAt, 420],
    ["COPIAR", copyAt, 960],
    ["IMPRIMIR", printAt, 1500],
  ] as const;
  // a consciência (padrão de luz) andando pela esteira
  const cx = interpolate(f, [recAt, presAt + 10, copyAt + 10, printAt + 20], [160, 420, 960, 1500], C);
  return (
    <Shell f={f} life={p.life} bg="radial-gradient(ellipse at 50% 45%, #0d1214 0%, #030506 78%)">
      {line > 0 ? (
        <AbsoluteFill style={{ opacity: line }}>
          <Head t={f >= hostAt ? "HOST BODIES" : "O COMBINE TRANSFORMOU A BIOLOGIA EM TECNOLOGIA"} s={f >= recAt ? "RECIPIENTES DE CONSCIÊNCIA" : f >= larvalAt ? "OS CORPOS LARVAIS DOS SHU'ULATHOI" : ""} c={CYAN} />
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
            <line x1={120} x2={1800} y1={680} y2={680} stroke="#2a3236" strokeWidth={14} />
            {Array.from({ length: 40 }).map((_, k) => (
              <line key={k} x1={((k * 44 + f * 3) % 1760) + 100} x2={((k * 44 + f * 3) % 1760) + 112} y1={674} y2={686} stroke="#46525a" strokeWidth={3} />
            ))}
            {STATIONS.map(([l, at, x]) => {
              const on = P(f, at, 10);
              return (
                <g key={l} opacity={0.3 + 0.7 * on}>
                  <ellipse cx={x} cy={560} rx={110} ry={120} fill="rgba(95,243,255,0.05)" stroke={CYAN} strokeWidth={2} />
                  <ellipse cx={x} cy={600} rx={70} ry={50} fill="rgba(200,190,170,0.15)" style={{ filter: "blur(6px)" }} />
                  <text x={x} y={760} textAnchor="middle" fill={on > 0.5 ? CYAN : "rgba(159,230,255,0.5)"} fontFamily={MONO} fontSize={22} letterSpacing={6}>
                    {l}
                  </text>
                  {l === "COPIAR" && f >= copyAt ? <ellipse cx={x + 60} cy={560} rx={110} ry={120} fill="none" stroke={CYAN} strokeWidth={1.5} strokeDasharray="6 6" opacity={on} /> : null}
                </g>
              );
            })}
            {f >= recAt ? (
              <g transform={`translate(${cx} 560)`}>
                {Array.from({ length: 6 }).map((_, k) => (
                  <ellipse key={k} rx={22 + k * 6} ry={10 + k * 3} fill="none" stroke={VIO} strokeWidth={2} transform={`rotate(${f * 3 + k * 30})`} opacity={0.8 - k * 0.1} />
                ))}
                <circle r={9} fill="#fff" />
              </g>
            ) : null}
          </svg>
        </AbsoluteFill>
      ) : null}
      {line < 1 ? (
        <AbsoluteFill style={{ opacity: 1 - line }}>
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
            {Array.from({ length: 5 }).map((_, k) => {
              const x = 280 + k * 340;
              return (
                <g key={k} opacity={P(f, advAt + k * 5, 10)}>
                  <ellipse cx={x} cy={520} rx={120} ry={170} fill="#0b1012" stroke="rgba(95,243,255,0.5)" strokeWidth={2} />
                  <ellipse cx={x} cy={540} rx={70} ry={100} fill="rgba(200,190,170,0.12)" style={{ filter: "blur(8px)" }} />
                  <text x={x} y={540} textAnchor="middle" fill={f >= recipAt ? VIO : CREAM} fontFamily={FONT} fontWeight={800} fontSize={64} opacity={P(f, whoAt + k * 4, 8)}>
                    ?
                  </text>
                  <text x={x} y={740} textAnchor="middle" fill="rgba(242,240,247,0.6)" fontFamily={MONO} fontSize={16} letterSpacing={4}>
                    ADVISOR
                  </text>
                </g>
              );
            })}
          </svg>
          <Big k={f >= interpAt ? "NESSA INTERPRETAÇÃO" : "OS ADVISORS"} t={f >= recipAt ? "podem ser recipientes" : f >= moreAt ? "mais do que uma espécie no comando" : "quem existe dentro de cada um?"} c={VIO} o={P(f, advAt, 10)} top={820} />
        </AbsoluteFill>
      ) : null}
      {void conqAt}
      {void bioAt}
      {void techAt}
    </Shell>
  );
};

// ---------------------------------------------------------------- 6) o registro do Breen: ramificação
export const HLRBreenRecord: React.FC<Pr> = (p) => {
  const f = useCurrentFrame();
  const [recAt, diedAt, citAt, transferAt, neverAt, savedAt, backupAt, printAt, hostAt, notManAt, versionAt, origDiedAt] = ["recAt", "diedAt", "citAt", "transferAt", "neverAt", "savedAt", "backupAt", "printAt", "hostAt", "notManAt", "versionAt", "origDiedAt"].map((k) => g(p, k));
  const Y1 = 420;
  const Y2 = 700;
  const mainLen = P(f, recAt, 40);
  const branch = P(f, backupAt, 30);
  const after = P(f, printAt, 40);
  const BK = 760; // ponto do backup
  const DEATH = 1280; // a Cidadela
  return (
    <Shell f={f} life={p.life}>
      <Head t="REGISTRO · WALLACE BREEN" s="ARQUIVO COMBINE" c={RED} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {/* a linha original */}
        <line x1={160} x2={160 + (DEATH - 160) * mainLen} y1={Y1} y2={Y1} stroke={TXT} strokeWidth={5} />
        {f >= diedAt ? (
          <g opacity={P(f, diedAt, 8)}>
            <path d={`M ${DEATH - 20} ${Y1 - 20} L ${DEATH + 20} ${Y1 + 20} M ${DEATH + 20} ${Y1 - 20} L ${DEATH - 20} ${Y1 + 20}`} stroke={RED} strokeWidth={6} />
            <text x={DEATH} y={Y1 - 40} textAnchor="middle" fill={RED} fontFamily={MONO} fontSize={20} letterSpacing={4}>
              {f >= citAt ? "MORREU NA CIDADELA" : "MORREU"}
            </text>
          </g>
        ) : null}
        <text x={160} y={Y1 - 30} fill="rgba(242,240,247,0.7)" fontFamily={MONO} fontSize={18} letterSpacing={4}>
          O BREEN ORIGINAL
        </text>
        {/* a transferência que não salvou */}
        {f >= transferAt ? (
          <g opacity={P(f, transferAt, 10)}>
            <path d={`M ${DEATH - 200} ${Y1} Q ${DEATH - 100} ${Y1 - 140} ${DEATH + 60} ${Y1 - 100}`} fill="none" stroke={CYAN} strokeWidth={3} strokeDasharray="8 6" />
            <text x={DEATH + 70} y={Y1 - 96} fill={CYAN} fontFamily={MONO} fontSize={16} letterSpacing={3}>
              TRANSFERÊNCIA DOS ADVISORS
            </text>
            {f >= neverAt ? <line x1={DEATH + 60} x2={DEATH + 380} y1={Y1 - 102} y2={Y1 - 102} stroke={RED} strokeWidth={4} opacity={P(f, neverAt, 6)} /> : null}
          </g>
        ) : null}
        {/* o backup: um ramo que sai ANTES e continua depois */}
        {branch > 0 ? (
          <g>
            <circle cx={BK} cy={Y1} r={12} fill={AMB} opacity={branch} />
            <text x={BK} y={Y1 + 44} textAnchor="middle" fill={AMB} fontFamily={MONO} fontSize={16} letterSpacing={3} opacity={branch}>
              VERSÃO ANTERIOR DA MENTE
            </text>
            <path d={`M ${BK} ${Y1} C ${BK + 120} ${Y1}, ${BK + 120} ${Y2}, ${BK + 260} ${Y2}`} fill="none" stroke={AMB} strokeWidth={4} strokeDasharray={`${600 * branch} 600`} />
            {after > 0 ? <line x1={BK + 260} x2={BK + 260 + (1720 - BK - 260) * after} y1={Y2} y2={Y2} stroke={AMB} strokeWidth={5} /> : null}
            {f >= hostAt ? (
              <g opacity={P(f, hostAt, 10)}>
                <ellipse cx={DEATH + 160} cy={Y2} rx={60} ry={40} fill="rgba(95,243,255,0.08)" stroke={CYAN} strokeWidth={2} />
                <text x={DEATH + 160} y={Y2 + 74} textAnchor="middle" fill={CYAN} fontFamily={MONO} fontSize={16} letterSpacing={3}>
                  IMPRESSA NUM HOSPEDEIRO
                </text>
              </g>
            ) : null}
          </g>
        ) : null}
      </svg>
      {f >= notManAt ? <Big k="NÃO É O HOMEM QUE SOBREVIVEU" t={f >= versionAt ? "é uma versão que continuou existindo" : "à Cidadela"} c={AMB} o={P(f, notManAt, 10)} top={860} /> : null}
      {void savedAt}
      {void origDiedAt}
    </Shell>
  );
};

// ---------------------------------------------------------------- 7) a linhagem
export const HLRLineage: React.FC<Pr> = (p) => {
  const f = useCurrentFrame();
  const [againAt, caveAt, combAt, borAt, copyAt, ideaAt, consAt, planAt, carolAt, gladosAt, tryAt] = ["againAt", "caveAt", "combAt", "borAt", "copyAt", "ideaAt", "consAt", "planAt", "carolAt", "gladosAt", "tryAt"].map((k) => g(p, k));
  const NODES = [
    ["COMBINE", CYAN, combAt, "a tecnologia"],
    ["BOREALIS", ICE, borAt, "as anomalias"],
    ["APERTURE", APT, copyAt, "copiou"],
    ["CAVE JOHNSON", APT, planAt, "o plano"],
    ["CAROLINE", CREAM, carolAt, "a mente"],
    ["GLaDOS", AMB, gladosAt, "a IA"],
  ] as const;
  return (
    <Shell f={f} life={p.life}>
      <Head t="UMA COISA QUE VIMOS ANTES" s="GANHA OUTRO SIGNIFICADO" c={APT} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {NODES.map(([n, c, at], i) => {
          const x = 200 + i * 304;
          const on = P(f, at, 12);
          return (
            <g key={n} opacity={on}>
              {i > 0 ? <line x1={x - 304 + 90} x2={x - 304 + 90 + 124 * on} y1={480} y2={480} stroke={c} strokeWidth={3} /> : null}
              {i > 0 ? <path d={`M ${x - 90} 480 l -14 -8 l 0 16 Z`} fill={c} opacity={on} /> : null}
              <circle cx={x} cy={480} r={78} fill="rgba(10,12,14,0.9)" stroke={c} strokeWidth={3} />
              {i === 5 ? <circle cx={x} cy={480} r={26} fill="#ffdc5a" opacity={0.7 + 0.3 * Math.sin(f / 6)} /> : null}
              <text x={x} y={600} textAnchor="middle" fill={c} fontFamily={FONT} fontWeight={800} fontSize={30}>
                {n}
              </text>
              <text x={x} y={632} textAnchor="middle" fill="rgba(242,240,247,0.6)" fontFamily={MONO} fontSize={15} letterSpacing={3}>
                {NODES[i][3]}
              </text>
            </g>
          );
        })}
        {/* o princípio: consciência em outro suporte (arco por cima) */}
        {f >= consAt ? <path d="M 200 380 Q 960 120 1720 380" fill="none" stroke={VIO} strokeWidth={3} strokeDasharray={`${2000 * P(f, consAt, 30)} 2000`} /> : null}
      </svg>
      {f >= consAt ? <div style={{ position: "absolute", left: 0, right: 0, top: 170, textAlign: "center", fontFamily: MONO, fontSize: 20, letterSpacing: 6, color: VIO, opacity: P(f, consAt, 10) }}>O PRINCÍPIO: COLOCAR UMA CONSCIÊNCIA EM OUTRO SUPORTE</div> : null}
      {f >= tryAt ? <Big k="TALVEZ TENHA COMEÇADO ASSIM" t="copiando algo que ela nem entendia" c={APT} o={P(f, tryAt, 10)} top={820} /> : null}
      {void againAt}
      {void caveAt}
      {void ideaAt}
    </Shell>
  );
};

// ---------------------------------------------------------------- 8) a ironia
export const HLRIrony: React.FC<Pr> = (p) => {
  const f = useCurrentFrame();
  const [ironyAt, caveAt, breenAt, begAt, bodyAt, repeatAt, wordAt, promAt, notImmAt, contAt, endAt, goesAt] = ["ironyAt", "caveAt", "breenAt", "begAt", "bodyAt", "repeatAt", "wordAt", "promAt", "notImmAt", "contAt", "endAt", "goesAt"].map((k) => g(p, k));
  const part2 = P(f, repeatAt - 6, 12);
  return (
    <Shell f={f} life={p.life}>
      {part2 < 1 ? (
        <AbsoluteFill style={{ opacity: 1 - part2 }}>
          <Head t="UMA IRONIA ABSURDA" c={CREAM} />
          {[
            ["CAVE JOHNSON", "procurou a vida inteira um jeito de continuar", APT, caveAt],
            ["WALLACE BREEN", "conseguiu", RED, breenAt],
          ].map(([n, t, c, at], i) => (
            <div key={n as string} style={{ position: "absolute", left: 160 + i * 820, top: 340, width: 700, opacity: P(f, at as number, 10) }}>
              <div style={{ fontFamily: MONO, fontSize: 18, letterSpacing: 6, color: c as string }}>{n}</div>
              <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 64, color: TXT, lineHeight: 1.05 }}>{t}</div>
              {i === 1 && f >= begAt ? <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 64, color: RED, lineHeight: 1.05, opacity: P(f, begAt, 8) }}>e implora para morrer</div> : null}
            </div>
          ))}
          {f >= bodyAt ? (
            <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: P(f, bodyAt, 10) }}>
              <polyline points={Array.from({ length: 200 }).map((_, i) => `${360 + i * 6},${820 + Math.sin(i * 0.8 + f * 0.6) * 10 * (0.2 + rnd(i + Math.floor(f / 3)) * 0.3)}`).join(" ")} fill="none" stroke={CREAM} strokeWidth={2} opacity={0.7} />
              <text x={960} y={780} textAnchor="middle" fill="rgba(242,240,247,0.6)" fontFamily={MONO} fontSize={16} letterSpacing={4}>
                O CORPO MAL SUSTENTA A PRÓPRIA VOZ
              </text>
            </svg>
          ) : null}
        </AbsoluteFill>
      ) : null}
      {part2 > 0 ? (
        <AbsoluteFill style={{ opacity: part2, alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
          {/* a palavra repetida */}
          {f < promAt
            ? Array.from({ length: 4 }).map((_, k) => (
                <div key={k} style={{ fontFamily: FONT, fontWeight: 800, fontSize: 90 - k * 14, letterSpacing: 2, color: TXT, opacity: P(f, wordAt + k * 8, 6) * (1 - k * 0.22), filter: `blur(${k * 1.5}px)` }}>
                  continuidade
                </div>
              ))
            : (
              <>
                <div style={{ position: "relative", fontFamily: FONT, fontWeight: 800, fontSize: 110, color: TXT, opacity: f >= notImmAt ? 0.35 : 1 }}>
                  imortalidade
                  <div style={{ position: "absolute", left: -10, right: -10, top: "55%", height: 9, background: RED, transform: `scaleX(${P(f, notImmAt, 8)})`, transformOrigin: "left" }} />
                </div>
                {f >= contAt ? <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 140, color: ORANGE, opacity: P(f, contAt, 8) }}>continuidade</div> : null}
                {f >= endAt ? (
                  <svg width={1200} height={120} style={{ opacity: P(f, endAt, 10) }}>
                    <line x1={60} x2={600} y1={60} y2={60} stroke={TXT} strokeWidth={6} />
                    <path d="M 590 40 L 620 80 M 620 40 L 590 80" stroke={RED} strokeWidth={5} />
                    <line x1={630} x2={630 + 520 * P(f, goesAt, 30)} y1={60} y2={60} stroke={ORANGE} strokeWidth={6} strokeDasharray="12 10" />
                    <text x={330} y={110} textAnchor="middle" fill="rgba(242,240,247,0.6)" fontFamily={MONO} fontSize={16} letterSpacing={4}>
                      O CORPO TERMINA
                    </text>
                    <text x={890} y={110} textAnchor="middle" fill={ORANGE} fontFamily={MONO} fontSize={16} letterSpacing={4} opacity={P(f, goesAt, 8)}>
                      ALGO CONTINUA
                    </text>
                  </svg>
                ) : null}
              </>
            )}
        </AbsoluteFill>
      ) : null}
      {void ironyAt}
    </Shell>
  );
};

// ---------------------------------------------------------------- 9) as últimas falas do Breen
export const HLRBreenLast: React.FC<Pr> = (p) => {
  const f = useCurrentFrame();
  const [saysAt, diedAt, fallAt, onlyAt, firstAt, conv, nego, defend, just, askAt, endAt, silentAt, laughAt, believedAt, nobodyAt] = ["saysAt", "diedAt", "fallAt", "onlyAt", "firstAt", "convAt", "negoAt", "defendAt", "justAt", "askAt", "endAt", "silentAt", "laughAt", "believedAt", "nobodyAt"].map((k) => g(p, k));
  const quotes = [
    [diedAt, "“Eu morri naquela Cidadela, Freeman.”"],
    [fallAt, "“Eu nem me lembro de cair.”"],
    [onlyAt, "“Só isso aqui é o que continuou.”"],
  ] as const;
  const q1 = 1 - P(f, firstAt - 6, 10);
  const list = P(f, firstAt - 6, 10) * (1 - P(f, askAt - 6, 10));
  const sw = P(f, askAt - 6, 10) * (1 - P(f, silentAt - 6, 10));
  const sil = P(f, silentAt - 6, 10) * (1 - P(f, believedAt - 8, 10));
  const fin = P(f, believedAt - 8, 10);
  const cur = quotes.filter((q) => f >= q[0]).pop();
  return (
    <Shell f={f} life={p.life} bg="radial-gradient(ellipse at 50% 50%, #0d1012 0%, #030405 78%)">
      {q1 > 0 && cur ? (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: q1 }}>
          <div style={{ fontFamily: MONO, fontSize: 18, letterSpacing: 6, color: RED }}>BREEN</div>
          <div key={cur[1]} style={{ fontFamily: FONT, fontWeight: 800, fontSize: 82, color: TXT, textAlign: "center", maxWidth: 1500, opacity: P(f, cur[0], 8), transform: `translateY(${(1 - P(f, cur[0], 12)) * 20}px)` }}>
            {cur[1]}
          </div>
        </AbsoluteFill>
      ) : null}
      {list > 0 ? (
        <AbsoluteFill style={{ opacity: list }}>
          <Head t="PELA PRIMEIRA VEZ, ELE NÃO TENTA" c={CREAM} />
          {[
            ["convencer ninguém", conv],
            ["negociar", nego],
            ["defender os Combine", defend],
            ["justificar o que fez", just],
          ].map(([t, at], i) => (
            <div key={t as string} style={{ position: "absolute", left: 260, top: 250 + i * 150, fontFamily: FONT, fontWeight: 800, fontSize: 80, color: TXT, opacity: P(f, at as number, 8) }}>
              <span style={{ position: "relative" }}>
                {t}
                <span style={{ position: "absolute", left: -6, right: -6, top: "55%", height: 7, background: RED, transform: `scaleX(${P(f, (at as number) + 8, 8)})`, transformOrigin: "left" }} />
              </span>
            </div>
          ))}
        </AbsoluteFill>
      ) : null}
      {sw > 0 ? (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: sw }}>
          <div style={{ fontFamily: MONO, fontSize: 20, letterSpacing: 6, color: CREAM }}>{f >= endAt ? "DEIXAR AQUILO TERMINAR DE VEZ" : "ELE SÓ PEDE"}</div>
          <div style={{ marginTop: 30, width: 520, height: 180, borderRadius: 20, background: "#1a1d20", border: "2px solid #3a4046", display: "flex", alignItems: "center", justifyContent: "center", gap: 24 }}>
            <div style={{ width: 160, height: 80, borderRadius: 40, background: "#0b0d0f", position: "relative" }}>
              <div style={{ position: "absolute", top: 8, left: 8, width: 64, height: 64, borderRadius: 32, background: RED, boxShadow: "0 0 20px rgba(255,93,77,0.6)" }} />
            </div>
            <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 44, color: TXT }}>DESLIGAR</div>
          </div>
        </AbsoluteFill>
      ) : null}
      {sil > 0 ? (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: sil }}>
          <div style={{ width: 900, padding: "26px 32px", background: "rgba(10,8,2,0.75)", border: `1px solid ${AMB}`, borderRadius: 10 }}>
            <div style={{ fontFamily: MONO, fontSize: 16, letterSpacing: 5, color: AMB }}>GORDON FREEMAN</div>
            <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 60, color: TXT, height: 70 }}>{Math.floor(f / 15) % 2 ? "█" : ""}</div>
          </div>
          {f >= laughAt ? (
            <svg width={1000} height={140} style={{ marginTop: 30, opacity: P(f, laughAt, 8) }}>
              <polyline points={Array.from({ length: 160 }).map((_, i) => `${i * 6.25},${70 + Math.sin(i * 1.3 + f * 0.9) * 18 * Math.abs(Math.sin(i / 9 + f / 6)) * 0.6}`).join(" ")} fill="none" stroke={RED} strokeWidth={2} />
              <text x={500} y={136} textAnchor="middle" fill="rgba(242,240,247,0.6)" fontFamily={MONO} fontSize={16} letterSpacing={4}>
                UM RISO BAIXO, QUASE SEM FORÇA
              </text>
            </svg>
          ) : null}
        </AbsoluteFill>
      ) : null}
      {fin > 0 ? (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: fin }}>
          <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 86, color: TXT }}>“Eu acreditei neles.”</div>
          {f >= nobodyAt ? <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 86, color: RED, opacity: P(f, nobodyAt, 8) }}>“Ninguém realmente volta.”</div> : null}
        </AbsoluteFill>
      ) : null}
      {void saysAt}
    </Shell>
  );
};
