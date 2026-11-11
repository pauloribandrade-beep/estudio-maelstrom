// =================================================================================================
// HL3 · REFORMULAÇÃO · módulo 8 (começo) (06/10/2026)
//  HLRCorruptGrid · HLRCatalystLog · HLRRealTargetCross · HLRBlueprintIncomplete · HLRArcticRaceMap
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
const TXT = HL.text;
const P = (f: number, at: number, d = 12) => interpolate(f, [at, at + d], [0, 1], { ...C, easing: Easing.out(Easing.cubic) });
const fade = (f: number, life: number) => interpolate(f, [0, 6], [1, 0], C) + interpolate(f, [life - 6, life], [0, 1], C);
type Pr = { life: number } & Record<string, number | undefined>;
const ks = (p: Pr, keys: string[]) => keys.map((k) => (p[k] as number | undefined) ?? 1e9);
const Head: React.FC<{ t: string; s?: string; c?: string; o?: number }> = ({ t, s, c = ICE, o = 1 }) => (
  <div style={{ position: "absolute", left: 80, top: 60, fontFamily: MONO, letterSpacing: 6, opacity: o }}>
    <div style={{ fontSize: 20, color: c }}>{t}</div>
    {s ? <div style={{ fontSize: 15, color: "rgba(242,240,247,0.6)", marginTop: 6 }}>{s}</div> : null}
  </div>
);
const Shell: React.FC<{ f: number; life: number; bg?: string; children: React.ReactNode }> = ({ f, life, bg = "radial-gradient(ellipse at 50% 45%, #10161c 0%, #040608 78%)", children }) => (
  <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
    {children}
    <AbsoluteFill style={{ background: "#000", opacity: fade(f, life), pointerEvents: "none" }} />
    <FilmLook />
  </AbsoluteFill>
);

// ---------------------------------------------------------------- dados corrompidos
export const HLRCorruptGrid: React.FC<Pr> = (p) => {
  const f = useCurrentFrame();
  const [corruptAt, notWorkAt, notAlyxAt, notAnsAt] = ks(p, ["corruptAt", "notWorkAt", "notAlyxAt", "notAnsAt"]);
  const CW = 40;
  const cols = 30;
  const rows = 12;
  const bad = P(f, corruptAt - 10, 30);
  return (
    <Shell f={f} life={p.life}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {Array.from({ length: rows * cols }).map((_, i) => {
          const r = Math.floor(i / cols);
          const c = i % cols;
          const isBad = rnd(i * 3.7) < 0.55 * bad;
          const flick = isBad && rnd(i + Math.floor(f / 3)) > 0.6;
          return <rect key={i} x={360 + c * CW + (flick ? (rnd(f + i) - 0.5) * 12 : 0)} y={200 + r * CW} width={CW - 6} height={CW - 6} fill={isBad ? (flick ? "#ff3df0" : "#2a0e0c") : "rgba(141,255,168,0.35)"} />;
        })}
      </svg>
      <Head t="KLEINER · OS DADOS DA MOSSMAN" s={f >= corruptAt ? `${Math.round(55 * bad)}% CORROMPIDO` : ""} c={GREEN} />
      <div style={{ position: "absolute", left: 360, top: 720, display: "flex", flexDirection: "column", gap: 10 }}>
        {[
          ["COMO O BOREALIS FUNCIONA", notWorkAt],
          ["O QUE ACONTECEU COM A ALYX", notAlyxAt],
          ["A RESPOSTA QUE TODO MUNDO QUERIA", notAnsAt],
        ].map(([l, at]) => (
          <div key={l as string} style={{ display: "flex", gap: 20, alignItems: "baseline", fontFamily: MONO, fontSize: 24, letterSpacing: 4, opacity: P(f, at as number, 8) }}>
            <span style={{ color: RED }}>NÃO EXPLICA</span>
            <span style={{ color: TXT }}>{l}</span>
          </div>
        ))}
      </div>
    </Shell>
  );
};

// ---------------------------------------------------------------- a palavra: catalisador
const LOG = ["SETOR 9 · SINC 0,4%", "UNIDADE 12 · POSIÇÃO OK", "CATALISADOR · ALINHAMENTO PENDENTE", "ESTASE · LOTE 3", "CATALISADOR · PRIORIDADE", "TELEPORTE · SECUNDÁRIO", "CATALISADOR · PRÓXIMA JANELA", "RELATÓRIO 4471", "CATALISADOR · NÚCLEO"];
export const HLRCatalystLog: React.FC<Pr> = (p) => {
  const f = useCurrentFrame();
  const [wordAt, logAt, catAt] = ks(p, ["wordAt", "logAt", "catAt"]);
  const scroll = f * 2.2;
  const big = P(f, catAt - 4, 10);
  return (
    <Shell f={f} life={p.life} bg="#05080a">
      <div style={{ position: "absolute", left: 520, top: 0, bottom: 0, width: 1320, overflow: "hidden", opacity: 1 - big * 0.7 }}>
        {Array.from({ length: 40 }).map((_, i) => {
          const l = LOG[i % LOG.length];
          const y = 1100 - ((i * 60 + scroll) % 2400);
          const hot = l.startsWith("CATALISADOR") && f >= wordAt;
          return (
            <div key={i} style={{ position: "absolute", top: y, fontFamily: MONO, fontSize: 30, letterSpacing: 3, color: hot ? AMB : "rgba(95,243,255,0.5)", background: hot ? "rgba(255,178,46,0.12)" : undefined, padding: "2px 10px" }}>
              {`[${String(1000 + i * 7).padStart(5, "0")}] ${l}`}
            </div>
          );
        })}
      </div>
      <Head t="REGISTRO COMBINE" s={f >= wordAt ? "UMA PALAVRA SE REPETE" : ""} c={CYAN} />
      {big > 0 ? (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 200, letterSpacing: -6, color: AMB, opacity: big, transform: `scale(${1.2 - 0.2 * big})`, textShadow: "0 0 60px rgba(255,178,46,0.4)" }}>catalisador</div>
        </AbsoluteFill>
      ) : null}
      {void logAt}
    </Shell>
  );
};

// ---------------------------------------------------------------- o alvo real
export const HLRRealTargetCross: React.FC<Pr> = (p) => {
  const f = useCurrentFrame();
  const [crossAt, expAt, noticeAt, assumeAt, teleAt, notAt, notOnlyAt, advAt, minorAt, realAt, catAt] = ks(p, ["crossAt", "expAt", "noticeAt", "assumeAt", "teleAt", "notAt", "notOnlyAt", "advAt", "minorAt", "realAt", "catAt"]);
  const cross = P(f, crossAt, 14) * (1 - P(f, assumeAt - 6, 10));
  const tgt = P(f, assumeAt - 6, 10);
  const shrink = P(f, minorAt - 10, 20);
  return (
    <Shell f={f} life={p.life}>
      {cross > 0 ? (
        <AbsoluteFill style={{ opacity: cross }}>
          <Head t="KLEINER CRUZA" s="O REGISTRO × OS EXPERIMENTOS DA MOSSMAN" c={GREEN} />
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <g key={i}>
                <rect x={260} y={260 + i * 100} width={520} height={60} rx={8} fill="rgba(95,243,255,0.08)" stroke="rgba(95,243,255,0.4)" />
                <rect x={1140} y={260 + i * 100} width={520} height={60} rx={8} fill="rgba(141,255,168,0.08)" stroke="rgba(141,255,168,0.4)" opacity={P(f, expAt + i * 3, 8)} />
                {i % 2 === 0 ? <line x1={780} y1={290 + i * 100} x2={780 + 360 * P(f, noticeAt - 20 + i * 4, 14)} y2={290 + ((i + 1) % 6) * 100} stroke={AMB} strokeWidth={3} /> : null}
              </g>
            ))}
          </svg>
        </AbsoluteFill>
      ) : null}
      {tgt > 0 ? (
        <AbsoluteFill style={{ opacity: tgt }}>
          <Head t="TODO MUNDO ASSUMIA" s={f >= advAt ? "OS REGISTROS DOS ADVISORS" : ""} c={ICE} />
          {/* teleporte: grande → riscado → encolhe para consequência menor */}
          <div style={{ position: "absolute", left: 140, top: 300, transformOrigin: "left top", transform: `scale(${1 - 0.55 * shrink})` }}>
            <div style={{ fontFamily: MONO, fontSize: 18, letterSpacing: 6, color: ICE }}>{f >= minorAt ? "CONSEQUÊNCIA MENOR" : "O ALVO DOS COMBINE"}</div>
            <div style={{ position: "relative", fontFamily: FONT, fontWeight: 800, fontSize: 96, color: TXT, lineHeight: 1 }}>
              o teleporte da Aperture
              <div style={{ position: "absolute", left: -8, right: -8, top: "55%", height: 9, background: RED, transform: `scaleX(${P(f, notAt, 8)})`, transformOrigin: "left", opacity: 1 - P(f, notOnlyAt, 8) * 0.6 }} />
            </div>
            {f >= notOnlyAt ? <div style={{ fontFamily: MONO, fontSize: 22, letterSpacing: 5, color: RED, marginTop: 10, opacity: P(f, notOnlyAt, 8) }}>NÃO ERA SÓ ISSO</div> : null}
          </div>
          {f >= realAt - 10 ? (
            <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: P(f, realAt - 10, 12) }}>
              <g transform="translate(1340 620)">
                {[220, 160, 100].map((r, k) => (
                  <circle key={k} r={r} fill="none" stroke={AMB} strokeWidth={k === 2 ? 6 : 3} opacity={0.5 + 0.2 * k} />
                ))}
                <circle r={30 + 6 * Math.sin(f / 5)} fill={AMB} />
                <text y={290} textAnchor="middle" fill={AMB} fontFamily={FONT} fontWeight={800} fontSize={64} opacity={P(f, catAt - 10, 8)}>
                  o catalisador
                </text>
                <text y={-250} textAnchor="middle" fill={CREAM} fontFamily={MONO} fontSize={18} letterSpacing={5}>
                  O OBJETIVO REAL
                </text>
              </g>
            </svg>
          ) : null}
        </AbsoluteFill>
      ) : null}
      {void teleAt}
    </Shell>
  );
};

// ---------------------------------------------------------------- a planta incompleta
export const HLRBlueprintIncomplete: React.FC<Pr> = (p) => {
  const f = useCurrentFrame();
  const [notSayAt, refsAt, coordsAt, expAt, incAt] = ks(p, ["notSayAt", "refsAt", "coordsAt", "expAt", "incAt"]);
  const pieces = [
    ["REFERÊNCIAS", refsAt, 300, 260],
    ["COORDENADAS", coordsAt, 900, 300],
    ["EXPERIMENTOS", expAt, 520, 560],
  ] as const;
  return (
    <Shell f={f} life={p.life} bg="#0a1a2e">
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(159,230,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(159,230,255,0.08) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <rect x={240} y={200} width={1440} height={700} fill="none" stroke="rgba(230,240,255,0.6)" strokeWidth={3} />
        {pieces.map(([l, at, x, y]) => (
          <g key={l} opacity={P(f, at, 10)}>
            <rect x={x} y={y} width={420} height={220} fill="rgba(230,240,255,0.06)" stroke="#e6f0ff" strokeWidth={2} />
            <path d={`M ${x + 40} ${y + 170} L ${x + 140} ${y + 70} L ${x + 260} ${y + 140} L ${x + 380} ${y + 60}`} fill="none" stroke="#e6f0ff" strokeWidth={2} />
            <text x={x + 20} y={y + 36} fill="#e6f0ff" fontFamily={MONO} fontSize={18} letterSpacing={4}>
              {l}
            </text>
          </g>
        ))}
        {/* o que falta */}
        {f >= incAt - 10
          ? [[1140, 600], [1400, 260]].map(([x, y], k) => (
              <g key={k} opacity={P(f, incAt - 10 + k * 6, 10)}>
                <rect x={x} y={y} width={240} height={200} fill="none" stroke={RED} strokeWidth={3} strokeDasharray="10 8" />
                <text x={x + 120} y={y + 112} textAnchor="middle" fill={RED} fontFamily={FONT} fontWeight={800} fontSize={72}>
                  ?
                </text>
              </g>
            ))
          : null}
      </svg>
      <Head t="O PROCEDIMENTO DO CATALISADOR" s={f >= notSayAt ? "OS ARQUIVOS NÃO DIZEM O QUE ELE FAZ" : ""} c={"#e6f0ff"} />
      {f >= incAt ? <div style={{ position: "absolute", right: 120, bottom: 70, fontFamily: FONT, fontWeight: 800, fontSize: 64, color: RED, opacity: P(f, incAt, 8) }}>incompleto</div> : null}
    </Shell>
  );
};

// ---------------------------------------------------------------- a corrida no Ártico
export const HLRArcticRaceMap: React.FC<Pr> = (p) => {
  const f = useCurrentFrame();
  const [coordAt, facAt, activeAt, expAt, restAt, radarAt, anomAt, againAt, combAt, planAt, gordonAt, beforeAt] = ks(p, ["coordAt", "facAt", "activeAt", "expAt", "restAt", "radarAt", "anomAt", "againAt", "combAt", "planAt", "gordonAt", "beforeAt"]);
  const FAC = { x: 1180, y: 380 };
  const SHIP = { x: 880, y: 640 };
  const FLEET = { x: 260, y: 820 };
  const COMB = { x: 1700, y: 900 };
  const sweep = (f * 0.06) % (Math.PI * 2);
  const g = P(f, gordonAt, 60);
  const c = P(f, combAt, 120);
  const cracks = useMemo(() => Array.from({ length: 40 }).map((_, i) => `M ${rnd(i * 3.1) * 1920} ${rnd(i * 5.3) * 1080} l ${(rnd(i) - 0.5) * 300} ${(rnd(i * 2) - 0.5) * 200}`), []);
  return (
    <Shell f={f} life={p.life} bg="radial-gradient(ellipse at 50% 45%, #1b2f3a 0%, #081218 80%)">
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {cracks.map((d, i) => (
          <path key={i} d={d} stroke="rgba(159,230,255,0.12)" fill="none" />
        ))}
        {/* a instalação ativa */}
        <g opacity={P(f, facAt - 10, 10)}>
          <rect x={FAC.x - 30} y={FAC.y - 30} width={60} height={60} fill="#0d1418" stroke={CYAN} strokeWidth={3} />
          <circle cx={FAC.x} cy={FAC.y} r={50 + 8 * Math.sin(f / 5)} fill="none" stroke={CYAN} strokeWidth={1.5} opacity={P(f, activeAt, 8)} />
          <text x={FAC.x} y={FAC.y - 52} textAnchor="middle" fill={CYAN} fontFamily={MONO} fontSize={16} letterSpacing={3}>
            {f >= restAt ? "O RESTO DA RESPOSTA?" : f >= expAt ? "DE ONDE VIERAM OS EXPERIMENTOS" : "INSTALAÇÃO ATIVA"}
          </text>
        </g>
        {/* radar */}
        {f >= radarAt - 10 ? (
          <g opacity={P(f, radarAt - 10, 10)}>
            <circle cx={SHIP.x} cy={SHIP.y} r={220} fill="none" stroke="rgba(141,255,168,0.3)" />
            <circle cx={SHIP.x} cy={SHIP.y} r={120} fill="none" stroke="rgba(141,255,168,0.2)" />
            <line x1={SHIP.x} y1={SHIP.y} x2={SHIP.x + Math.cos(sweep) * 220} y2={SHIP.y + Math.sin(sweep) * 220} stroke={GREEN} strokeWidth={2} />
            {f >= anomAt ? (
              <g opacity={P(f, anomAt, 8)}>
                <g transform={`translate(${SHIP.x - 60} ${SHIP.y - 20}) scale(0.12)`} opacity={f >= againAt ? 0.9 : 0.3 + 0.3 * Math.sin(f / 4)}>
                  <ShipProfile stroke={ICE} fill="rgba(159,230,255,0.15)" w={14} />
                </g>
                <text x={SHIP.x} y={SHIP.y + 60} textAnchor="middle" fill={GREEN} fontFamily={MONO} fontSize={16} letterSpacing={3}>
                  {f >= againAt ? "O BOREALIS VAI APARECER DE NOVO" : "ANOMALIA"}
                </text>
              </g>
            ) : null}
          </g>
        ) : null}
        {/* os Combine se movendo */}
        {f >= combAt ? (
          <g>
            <path d={`M ${COMB.x} ${COMB.y} L ${COMB.x + (SHIP.x - COMB.x) * c} ${COMB.y + (SHIP.y - COMB.y) * c}`} stroke={RED} strokeWidth={4} strokeDasharray="12 8" />
            <circle cx={COMB.x + (SHIP.x - COMB.x) * c} cy={COMB.y + (SHIP.y - COMB.y) * c} r={12} fill={RED} />
            <text x={COMB.x} y={COMB.y + 40} textAnchor="middle" fill={RED} fontFamily={MONO} fontSize={16} letterSpacing={3}>
              COMBINE
            </text>
          </g>
        ) : null}
        {/* a rota do Gordon até a instalação */}
        {f >= gordonAt ? (
          <g>
            <path d={`M ${FLEET.x} ${FLEET.y} Q 600 400 ${FLEET.x + (FAC.x - FLEET.x) * g} ${FLEET.y + (FAC.y - FLEET.y) * g}`} fill="none" stroke={AMB} strokeWidth={4} strokeDasharray="12 8" />
            <circle cx={FLEET.x} cy={FLEET.y} r={12} fill={GREEN} />
            <text x={FLEET.x} y={FLEET.y + 40} textAnchor="middle" fill={GREEN} fontFamily={MONO} fontSize={16} letterSpacing={3}>
              FROTA
            </text>
          </g>
        ) : null}
      </svg>
      <Head t={f >= planAt ? "O PLANO MUDA NA HORA" : "UMA DAS COORDENADAS"} s={f >= beforeAt ? "GORDON PRECISA CHEGAR ANTES DOS COMBINE" : f >= planAt ? "" : "APONTA PARA UMA INSTALAÇÃO NO ÁRTICO"} c={f >= planAt ? AMB : ICE} />
      {f >= beforeAt ? (
        <div style={{ position: "absolute", right: 90, bottom: 90, display: "flex", gap: 30, fontFamily: MONO, opacity: P(f, beforeAt, 10) }}>
          {[
            ["GORDON → INSTALAÇÃO", AMB],
            ["COMBINE → NAVIO", RED],
          ].map(([l, cc]) => (
            <div key={l} style={{ padding: "12px 18px", background: "rgba(6,8,10,0.8)", borderLeft: `4px solid ${cc}`, fontSize: 18, letterSpacing: 3, color: TXT }}>
              {l}
            </div>
          ))}
        </div>
      ) : null}
      {void coordAt}
    </Shell>
  );
};
