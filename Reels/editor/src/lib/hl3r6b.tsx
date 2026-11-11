// =================================================================================================
// HL3 · REFORMULAÇÃO · módulo 6 (parte 2) (06/10/2026)
//  HLRContinueVsSurvive · HLRChoiceUI · HLRAfterBreenCopy · HLRPerpetuityList · HLRCopyRace · HLRAmbushMap ·
//  HLRRupture · HLRAftermathCards
// =================================================================================================
import React, { useMemo } from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, Img, staticFile } from "remotion";
import { FONT, MONO } from "./overlays";
import { C, HL, rnd } from "./hl3";
import { FilmLook } from "./hl3r";
import { ShipProfile } from "./hl3rd";
import { Eye, Hud, Lights, RoomView, proj, toCam } from "./hl3rf";
import { buildShipCorridor } from "./hl3rb";
import { FlagBadge, SilhouetteAt } from "./hl3rx";

const RED = "#ff5d4d";
const CREAM = "#ffe2b0";
const ICE = "#9fe6ff";
const GREEN = "#8dffa8";
const ORANGE = HL.orange;
const AMB = "#ffb22e";
const CYAN = "#5ff3ff";
const TXT = HL.text;
const P = (f: number, at: number, d = 12) => interpolate(f, [at, at + d], [0, 1], { ...C, easing: Easing.out(Easing.cubic) });
const IO = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const fade = (f: number, life: number) => interpolate(f, [0, 6], [1, 0], C) + interpolate(f, [life - 6, life], [0, 1], C);
type Pr = { life: number } & Record<string, number | undefined>;
const g = (p: Pr, k: string) => (p[k] as number | undefined) ?? 1e9;
const ks = (p: Pr, keys: string[]) => keys.map((k) => g(p, k));
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

// ---------------------------------------------------------------- continuar ≠ sobreviver
export const HLRContinueVsSurvive: React.FC<Pr> = (p) => {
  const f = useCurrentFrame();
  const [perpAt, promAt, gordonAt, wantedAt, contAt, notAt, survAt] = ks(p, ["perpAt", "promAt", "gordonAt", "wantedAt", "contAt", "notAt", "survAt"]);
  const crack = P(f, promAt, 20);
  const eq = P(f, notAt - 6, 12);
  return (
    <Shell f={f} life={p.life} bg="#06080a">
      {/* o cartaz */}
      <AbsoluteFill style={{ opacity: 1 - eq, alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "relative", width: 760, height: 900, background: "linear-gradient(180deg, #0c1a22 0%, #05090c 100%)", border: `2px solid ${CYAN}`, boxShadow: "0 0 80px rgba(95,243,255,0.15)", overflow: "hidden", opacity: P(f, 0, 14), filter: `saturate(${1 - crack * 0.7}) brightness(${1 - crack * 0.4})` }}>
          <svg width={760} height={900} style={{ position: "absolute", inset: 0 }}>
            {Array.from({ length: 18 }).map((_, k) => (
              <line key={k} x1={380} y1={330} x2={380 + Math.cos((k / 18) * Math.PI * 2) * 900} y2={330 + Math.sin((k / 18) * Math.PI * 2) * 900} stroke="rgba(95,243,255,0.08)" strokeWidth={30} />
            ))}
            <circle cx={380} cy={330} r={140} fill="none" stroke={CYAN} strokeWidth={6} />
            <path d="M 300 290 L 380 370 L 460 290 M 300 250 L 380 330 L 460 250" fill="none" stroke={CYAN} strokeWidth={10} />
            {crack > 0 ? <polyline points="120,0 230,260 180,420 320,610 260,900" fill="none" stroke="#fff" strokeWidth={4} strokeDasharray={`${1200 * crack} 1200`} /> : null}
            {crack > 0 ? <polyline points="230,260 420,330 560,250 760,320" fill="none" stroke="#fff" strokeWidth={3} strokeDasharray={`${800 * crack} 800`} /> : null}
          </svg>
          <div style={{ position: "absolute", left: 0, right: 0, top: 560, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 92, letterSpacing: -2, color: TXT, opacity: P(f, perpAt - 10, 10) }}>PERPETUIDADE</div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 680, textAlign: "center", fontFamily: MONO, fontSize: 22, letterSpacing: 8, color: CYAN, opacity: P(f, perpAt, 10) }}>A PROMESSA DOS COMBINE</div>
        </div>
        {f >= gordonAt ? (
          <div style={{ position: "absolute", right: 90, top: 300, width: 460, textAlign: "right", opacity: P(f, gordonAt, 10) * (1 - eq) }}>
            <div style={{ fontFamily: MONO, fontSize: 16, letterSpacing: 5, color: CREAM }}>DIANTE DO GORDON</div>
            <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 52, color: TXT, lineHeight: 1.05 }}>{f >= contAt ? "ele só continuou" : f >= wantedAt ? "conseguiu o que queria" : "alguém que conseguiu"}</div>
          </div>
        ) : null}
      </AbsoluteFill>
      {eq > 0 ? (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: eq }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 40 }}>
            <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 120, color: TXT }}>continuar</span>
            <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 160, color: RED, transform: `scale(${1.4 - 0.4 * P(f, notAt + 6, 10)})`, opacity: P(f, notAt + 6, 8) }}>≠</span>
            <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 120, color: ORANGE, opacity: P(f, survAt - 10, 8) }}>sobreviver</span>
          </div>
        </AbsoluteFill>
      ) : null}
    </Shell>
  );
};

// ---------------------------------------------------------------- a escolha
export const HLRChoiceUI: React.FC<Pr> = (p) => {
  const f = useCurrentFrame();
  const [noForceAt, offAt, dieAt, leaveAt, sufferAt, smallAt, storyAt, regAt] = ks(p, ["noForceAt", "offAt", "dieAt", "leaveAt", "sufferAt", "smallAt", "storyAt", "regAt"]);
  const small = P(f, smallAt, 16);
  const hover = Math.sin(f / 22) > 0 ? 0 : 1;
  const card = (i: number, title: string, sub: string, at: number, subAt: number) => (
    <div style={{ position: "absolute", left: 960 + (i ? 40 : -720) + (i ? 0 : 0), top: 380, width: 680, padding: "30px 34px", borderRadius: 16, background: hover === i && f < regAt ? "rgba(40,30,12,0.85)" : "rgba(12,14,18,0.8)", border: `2px solid ${hover === i && f < regAt ? AMB : "rgba(242,240,247,0.25)"}`, opacity: P(f, at, 10), transform: `scale(${1 - 0.18 * small}) translateY(${small * -40}px)` }}>
      <div style={{ fontFamily: MONO, fontSize: 16, letterSpacing: 5, color: AMB }}>{i ? "OPÇÃO B" : "OPÇÃO A"}</div>
      <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 54, color: TXT, lineHeight: 1.05, marginTop: 6 }}>{title}</div>
      <div style={{ fontFamily: MONO, fontSize: 18, letterSpacing: 3, color: "rgba(242,240,247,0.65)", marginTop: 14, opacity: P(f, subAt, 8) }}>{sub}</div>
    </div>
  );
  return (
    <Shell f={f} life={p.life}>
      <Head t="NESSE MOMENTO" s={f >= noForceAt ? "O JOGO NÃO OBRIGA NENHUMA DECISÃO" : ""} c={AMB} />
      {card(0, "Desligar o suporte", "deixar o Breen morrer", offAt, dieAt)}
      {card(1, "Sair da sala", "deixar aquela versão dele existindo ali, sofrendo", leaveAt, sufferAt)}
      {f >= smallAt ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 220, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 56, color: TXT, opacity: P(f, smallAt, 10) }}>{f >= storyAt ? "não muda a história" : "uma escolha pequena"}</div>
      ) : null}
      {f >= regAt ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 800, textAlign: "center", opacity: P(f, regAt, 8) }}>
          <span style={{ padding: "12px 28px", border: `3px solid ${GREEN}`, borderRadius: 10, fontFamily: MONO, fontSize: 26, letterSpacing: 6, color: GREEN }}>● ESCOLHA REGISTRADA</span>
        </div>
      ) : null}
    </Shell>
  );
};

// ---------------------------------------------------------------- depois: os arquivos para o Kleiner
export const HLRAfterBreenCopy: React.FC<Pr> = (p) => {
  const f = useCurrentFrame();
  const [termAt, copyAt, cryptAt, notesAt, kleinerAt, alyxAt, silentAt, contAt] = ks(p, ["termAt", "copyAt", "cryptAt", "notesAt", "kleinerAt", "alyxAt", "silentAt", "contAt"]);
  const FILES = [
    ["inst_combine_01.enc", cryptAt],
    ["inst_combine_02.enc", cryptAt + 8],
    ["hospedeiro_reg.enc", cryptAt + 16],
    ["anotacoes_navio.img", notesAt],
  ] as const;
  const up = P(f, kleinerAt - 10, 60);
  return (
    <Shell f={f} life={p.life}>
      <Head t="A MOSSMAN VOLTA AOS TERMINAIS" s={f >= kleinerAt ? "PARA ENVIAR AO KLEINER" : ""} c={ICE} />
      <div style={{ position: "absolute", left: 200, top: 220, width: 980, padding: "26px 30px", background: "rgba(4,10,12,0.9)", border: "1px solid rgba(159,230,255,0.35)", borderRadius: 12, opacity: P(f, termAt - 10, 10) }}>
        {FILES.map(([n, at], i) => {
          const dec = P(f, at + 10, 24);
          return (
            <div key={n} style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 18, opacity: P(f, at, 8) }}>
              <span style={{ fontFamily: MONO, fontSize: 22, color: dec > 0.95 ? GREEN : AMB, width: 34 }}>{dec > 0.95 ? "✓" : "🔒"}</span>
              <span style={{ fontFamily: MONO, fontSize: 22, letterSpacing: 2, color: TXT, flex: 1 }}>{n}</span>
              <div style={{ width: 280, height: 10, background: "rgba(242,240,247,0.1)", borderRadius: 5 }}>
                <div style={{ width: `${dec * 100}%`, height: 10, background: i === 3 ? ORANGE : ICE, borderRadius: 5 }} />
              </div>
            </div>
          );
        })}
      </div>
      {f >= kleinerAt - 10 ? (
        <div style={{ position: "absolute", left: 200, top: 640, width: 980, opacity: P(f, kleinerAt - 10, 10) }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 18, letterSpacing: 4, color: GREEN }}>
            <span>TRANSMISSÃO → KLEINER</span>
            <span>{Math.round(up * 100)}%</span>
          </div>
          <div style={{ height: 16, marginTop: 10, background: "rgba(242,240,247,0.1)", borderRadius: 8 }}>
            <div style={{ height: 16, width: `${up * 100}%`, background: GREEN, borderRadius: 8 }} />
          </div>
        </div>
      ) : null}
      {f >= alyxAt ? (
        <div style={{ position: "absolute", right: 120, top: 360, width: 420, padding: "22px 26px", borderRadius: 12, border: `2px solid ${ORANGE}`, background: "rgba(20,12,6,0.7)", opacity: P(f, alyxAt, 10) }}>
          <div style={{ fontFamily: MONO, fontSize: 16, letterSpacing: 5, color: ORANGE }}>ALYX</div>
          <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 44, color: TXT }}>{f >= silentAt ? "acompanha em silêncio" : "acompanha tudo"}</div>
          <svg width={360} height={40}>
            <line x1={0} x2={360} y1={20} y2={20} stroke={ORANGE} strokeWidth={2} opacity={0.6} />
          </svg>
        </div>
      ) : null}
      {void copyAt}
      {void contAt}
    </Shell>
  );
};

// ---------------------------------------------------------------- perpetuidade: a lista de conquistas
export const HLRPerpetuityList: React.FC<Pr> = (p) => {
  const f = useCurrentFrame();
  const [spaceAt, worldsAt, dimAt, nextAt, endAt, unclearAt, believeAt, borAt, beliefAt] = ks(p, ["spaceAt", "worldsAt", "dimAt", "nextAt", "endAt", "unclearAt", "believeAt", "borAt", "beliefAt"]);
  const truth = 0.5 + 0.4 * Math.sin(f / 7) * P(f, unclearAt, 10);
  const belief = P(f, believeAt, 20);
  return (
    <Shell f={f} life={p.life}>
      <Head t="O QUE OS COMBINE JÁ CONQUISTARAM" c={CYAN} />
      {[
        ["ESPAÇO", spaceAt],
        ["MUNDOS", worldsAt],
        ["DIMENSÕES", dimAt],
      ].map(([l, at], i) => (
        <div key={l as string} style={{ position: "absolute", left: 160, top: 200 + i * 110, display: "flex", alignItems: "center", gap: 24, opacity: P(f, at as number, 8) }}>
          <span style={{ width: 54, height: 54, borderRadius: 10, border: `3px solid ${CYAN}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT, fontWeight: 800, fontSize: 38, color: CYAN }}>✓</span>
          <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 64, color: TXT }}>{l}</span>
        </div>
      ))}
      {f >= nextAt ? (
        <div style={{ position: "absolute", left: 160, top: 560, display: "flex", alignItems: "center", gap: 24, opacity: P(f, nextAt, 8) }}>
          <span style={{ width: 54, height: 54, borderRadius: 10, border: `3px dashed ${RED}` }} />
          <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 80, color: RED }}>{f >= endAt - 10 ? "O PRÓPRIO FIM" : "PRÓXIMO LIMITE"}</span>
        </div>
      ) : null}
      {/* verdade? × crença */}
      {f >= unclearAt - 10 ? (
        <div style={{ position: "absolute", right: 140, top: 240, width: 560, opacity: P(f, unclearAt - 10, 10) }}>
          {[
            ["É VERDADE?", truth, "rgba(242,240,247,0.6)"],
            ["ELES ACREDITAM", belief, ORANGE],
          ].map(([l, v, c], i) => (
            <div key={l as string} style={{ marginBottom: 40, opacity: i ? P(f, believeAt - 6, 8) : 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 20, letterSpacing: 5, color: c as string }}>
                <span>{l}</span>
                <span>{i ? `${Math.round((v as number) * 100)}%` : "?"}</span>
              </div>
              <div style={{ height: 18, marginTop: 10, background: "rgba(242,240,247,0.1)", borderRadius: 9 }}>
                <div style={{ height: 18, width: `${(v as number) * 100}%`, background: c as string, borderRadius: 9 }} />
              </div>
            </div>
          ))}
        </div>
      ) : null}
      {f >= borAt - 10 ? (
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: P(f, borAt - 10, 10) }}>
          <path d="M 1420 420 C 1420 640, 1300 700, 1240 800" fill="none" stroke={ORANGE} strokeWidth={3} strokeDasharray={`${600 * P(f, borAt, 24)} 600`} />
          <g transform="translate(980 760) scale(0.5)">
            <ShipProfile stroke={ICE} fill="rgba(159,230,255,0.06)" w={3} />
          </g>
          <text x={1230} y={1000} textAnchor="middle" fill={ORANGE} fontFamily={MONO} fontSize={18} letterSpacing={4} opacity={P(f, beliefAt - 10, 8)}>
            ALGO NO BOREALIS ESTÁ LIGADO A ESSA CRENÇA
          </text>
        </svg>
      ) : null}
    </Shell>
  );
};

// ---------------------------------------------------------------- a corrida: copiar antes da fase mudar
export const HLRCopyRace: React.FC<Pr> = (p) => {
  const f = useCurrentFrame();
  const [copyAt, recAt, expAt, calcAt, notesAt, kleinerAt, phaseAt] = ks(p, ["copyAt", "recAt", "expAt", "calcAt", "notesAt", "kleinerAt", "phaseAt"]);
  const life = p.life;
  const ring = interpolate(f, [0, life], [0.15, 0.94], C);
  const ITEMS = [
    ["REGISTROS COMBINE", recAt, CYAN],
    ["EXPERIMENTOS", expAt, CYAN],
    ["CÁLCULOS DO BOREALIS", calcAt, ICE],
    ["ANOTAÇÕES ESTRANHAS", notesAt, ORANGE],
  ] as const;
  return (
    <Shell f={f} life={p.life}>
      <Head t="A MOSSMAN COPIA TUDO" s={f >= kleinerAt ? "PARA O KLEINER · ANTES DA PRÓXIMA FASE" : "TUDO O QUE CONSEGUE DA BASE"} c={ICE} />
      {ITEMS.map(([l, at, c], i) => {
        const v = P(f, at, 50);
        return (
          <div key={l} style={{ position: "absolute", left: 160, top: 260 + i * 140, width: 1000, opacity: P(f, at - 4, 8) }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 22, letterSpacing: 5, color: c }}>
              <span>{l}</span>
              <span>{Math.round(v * 100)}%</span>
            </div>
            <div style={{ height: 14, marginTop: 10, background: "rgba(242,240,247,0.1)", borderRadius: 7 }}>
              <div style={{ height: 14, width: `${v * 100}%`, background: c, borderRadius: 7 }} />
            </div>
          </div>
        );
      })}
      {/* anel do tempo de fase */}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <g transform="translate(1500 520)">
          <circle r={190} fill="none" stroke="rgba(242,240,247,0.12)" strokeWidth={20} />
          <circle r={190} fill="none" stroke={ring > 0.8 ? RED : AMB} strokeWidth={20} strokeDasharray={`${1194 * ring} 1194`} transform="rotate(-90)" strokeLinecap="round" />
          <text y={-10} textAnchor="middle" fill={TXT} fontFamily={FONT} fontWeight={800} fontSize={64}>
            {`${Math.max(0, Math.round((1 - ring) * 90))}s`}
          </text>
          <text y={36} textAnchor="middle" fill={ring > 0.8 ? RED : AMB} fontFamily={MONO} fontSize={16} letterSpacing={4}>
            {f >= phaseAt ? "A FASE VAI MUDAR" : "ATÉ A PRÓXIMA FASE"}
          </text>
        </g>
      </svg>
      {void copyAt}
    </Shell>
  );
};

// ---------------------------------------------------------------- a emboscada (mapa tático) + a frase da Mossman
export const HLRAmbushMap: React.FC<Pr> = (p) => {
  const f = useCurrentFrame();
  const [combAt, notRandomAt, onlyAt, vulnAt, huntersAt, deckAt, ambushAt, hitAt, diesAt, dataAt, changeAt, quoteAt, weaponAt, eliAt, deadAt, explainAt] = ks(p, ["combAt", "notRandomAt", "onlyAt", "vulnAt", "huntersAt", "deckAt", "ambushAt", "hitAt", "diesAt", "dataAt", "changeAt", "quoteAt", "weaponAt", "eliAt", "deadAt", "explainAt"]);
  const map = 1 - P(f, quoteAt - 8, 10);
  const quote = P(f, quoteAt - 8, 10) * (1 - P(f, deadAt - 4, 10));
  const after = P(f, deadAt - 4, 10);
  const G = { x: 1080, y: 560 };
  const sq = (k: number) => interpolate(f, [combAt + k * 6, onlyAt + 40], [0, 1], { ...C, easing: Easing.inOut(Easing.quad) });
  const hunt = interpolate(f, [huntersAt, deckAt + 30], [0, 1], C);
  const moss = { x: G.x + 60, y: G.y + 30 };
  const packet = P(f, dataAt, 24);
  return (
    <Shell f={f} life={p.life}>
      {map > 0 ? (
        <AbsoluteFill style={{ opacity: map }}>
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, transform: "scale(1.35)", transformOrigin: "52% 50%" }}>
            {/* convés: o único corredor até a sala */}
            <rect x={300} y={500} width={600} height={120} fill="rgba(159,230,255,0.05)" stroke="rgba(159,230,255,0.5)" strokeWidth={2} />
            <rect x={900} y={380} width={420} height={360} fill="rgba(159,230,255,0.05)" stroke="rgba(159,230,255,0.5)" strokeWidth={2} />
            <rect x={900} y={180} width={420} height={120} fill="rgba(159,230,255,0.03)" stroke="rgba(159,230,255,0.3)" strokeWidth={2} strokeDasharray="8 6" />
            <text x={320} y={490} fill={ICE} fontFamily={MONO} fontSize={16} letterSpacing={3}>
              {f >= onlyAt ? "O ÚNICO CAMINHO POSSÍVEL" : "CORREDOR"}
            </text>
            <text x={920} y={170} fill={ICE} fontFamily={MONO} fontSize={16} letterSpacing={3}>
              CONVÉS
            </text>
            {/* o grupo (vulnerável) */}
            <circle cx={G.x} cy={G.y} r={70 + 6 * Math.sin(f / 5)} fill="none" stroke={f >= vulnAt ? RED : AMB} strokeWidth={2} strokeDasharray="6 6" />
            {[[0, 0, AMB], [60, 30, ICE], [-50, 30, ORANGE]].map(([dx, dy, c], i) => (
              <circle key={i} cx={G.x + (dx as number)} cy={G.y + (dy as number)} r={11} fill={i === 1 && f >= hitAt ? RED : (c as string)} />
            ))}
            {/* esquadrões pelo corredor */}
            {[0, 1, 2].map((k) => {
              const t = sq(k);
              const x = 200 + (860 - 200) * t - k * 50;
              return (
                <g key={k} opacity={P(f, combAt + k * 6, 8)}>
                  <path d={`M ${x - 12} 560 L ${x + 12} 560 L ${x + 8} 578 L ${x} 586 L ${x - 8} 578 Z`} fill="#0a1214" stroke={RED} strokeWidth={2} />
                  {f >= ambushAt && (f + k * 3) % 6 < 2 ? <line x1={x + 12} y1={566} x2={G.x - 30} y2={G.y + (rnd(f + k) - 0.5) * 60} stroke="#ffe6a0" strokeWidth={2} /> : null}
                </g>
              );
            })}
            {/* Hunters pelo convés */}
            {f >= huntersAt
              ? [0, 1].map((k) => {
                  const x = 960 + k * 160;
                  const y = 240 + (G.y - 140 - 240) * hunt;
                  return (
                    <g key={k} opacity={P(f, huntersAt + k * 8, 8)}>
                      <path d={`M ${x} ${y - 20} L ${x + 18} ${y + 14} L ${x - 18} ${y + 14} Z`} fill="#140808" stroke={RED} strokeWidth={2.5} />
                      <text x={x} y={y - 28} textAnchor="middle" fill={RED} fontFamily={MONO} fontSize={13} letterSpacing={2}>
                        HUNTER
                      </text>
                      {f >= ambushAt && (f + k * 5) % 9 < 2 ? <line x1={x} y1={y + 14} x2={moss.x} y2={moss.y} stroke="#9fe6ff" strokeWidth={2} /> : null}
                    </g>
                  );
                })
              : null}
            {/* os dados passam da Mossman para o Gordon */}
            {f >= dataAt ? <rect x={moss.x + (G.x - moss.x) * packet - 10} y={moss.y + (G.y - moss.y) * packet - 10} width={20} height={20} fill={GREEN} transform={`rotate(45 ${moss.x + (G.x - moss.x) * packet} ${moss.y + (G.y - moss.y) * packet})`} /> : null}
          </svg>
          <Head t={f >= ambushAt ? "A LUTA VIRA EMBOSCADA" : f >= notRandomAt ? "NÃO PARECE UM ATAQUE ALEATÓRIO" : "OS COMBINE APARECEM"} s={f >= hitAt ? "A MOSSMAN É ATINGIDA" : f >= vulnAt ? "NO MOMENTO EXATO" : ""} c={RED} />
          {f >= dataAt ? <div style={{ position: "absolute", left: 1360, top: 520, fontFamily: MONO, fontSize: 18, letterSpacing: 4, color: GREEN, opacity: P(f, dataAt, 8) }}>OS DADOS → GORDON</div> : null}
        </AbsoluteFill>
      ) : null}
      {quote > 0 ? (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: quote, padding: "0 160px" }}>
          <div style={{ fontFamily: MONO, fontSize: 18, letterSpacing: 6, color: ICE, marginBottom: 20 }}>MOSSMAN</div>
          <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 82, color: TXT, textAlign: "center", lineHeight: 1.08 }}>
            “Gordon, o Borealis <span style={{ color: f >= weaponAt ? RED : TXT }}>é uma arma</span>
            {f >= eliAt - 20 ? <span style={{ opacity: P(f, eliAt - 20, 10) }}>, e você não pode deixar o Eli destruí-lo.”</span> : null}
          </div>
        </AbsoluteFill>
      ) : null}
      {after > 0 ? (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: after }}>
          <svg width={1200} height={160}>
            <polyline points={Array.from({ length: 200 }).map((_, i) => {
              const flat = i > 110;
              const ph = i % 30;
              return `${i * 6},${80 + (flat ? 0 : ph === 8 ? -40 : ph === 9 ? 28 : 0)}`;
            }).join(" ")} fill="none" stroke={RED} strokeWidth={3} />
          </svg>
          <div style={{ fontFamily: MONO, fontSize: 22, letterSpacing: 6, color: RED, marginTop: 20 }}>{f >= explainAt ? "SEM EXPLICAR O QUE QUIS DIZER" : "JUDITH MOSSMAN"}</div>
        </AbsoluteFill>
      ) : null}
      {void diesAt}
      {void changeAt}
    </Shell>
  );
};

// polígono 3D → tela, recortado no plano próximo (pode estar parte atrás da câmera enquanto ela vira)
type V3r = [number, number, number];
const polyScr = (e: Eye, ps: V3r[]): string | null => {
  const NEAR = 0.15;
  const cam = ps.map((q) => toCam(e, q));
  const out: V3r[] = [];
  for (let i = 0; i < cam.length; i++) {
    const a = cam[i];
    const b = cam[(i + 1) % cam.length];
    if (a[1] > NEAR) out.push(a);
    if (a[1] > NEAR !== b[1] > NEAR) {
      const t = (NEAR - a[1]) / (b[1] - a[1]);
      out.push([a[0] + (b[0] - a[0]) * t, NEAR, a[2] + (b[2] - a[2]) * t]);
    }
  }
  if (out.length < 3) return null;
  return out.map((q) => `${(960 + (q[0] * e.F) / q[1]).toFixed(1)},${(540 - (q[2] * e.F) / q[1]).toFixed(1)}`).join(" ");
};
const cssPoly = (pts: string) => `polygon(${pts.split(" ").map((c) => c.replace(",", "px ") + "px").join(", ")})`;
// a porta lateral por onde os Vortigaunts vão embora (08/10, pedido dele: a porta do fundo ficava atrás da porta fechada
// da Alyx — é outro corredor). Vão na parede direita do corredor (x = 2,2), uma passagem curta e, no fim dela, a porta
// coberta pela luz verde.
const SD = { x: 2.2, y0: 16.1, y1: 17.3, h: 2.3, far: 6.0 };
// ---------------------------------------------------------------- a segunda ruptura (primeira pessoa)
export const HLRRupture: React.FC<Pr> = (p) => {
  const f = useCurrentFrame();
  const [ruptAt, phaseAt, alyxAt, passAt, fadeAt, vortAt, holdAt, couldAt, lookAAt, lookGAt, hesAt, dropAt, closeAt, trappedAt, turnAt, explAt, betrayAt, doorAt, lightAt, offAt] = ks(p, ["ruptAt", "phaseAt", "alyxAt", "passAt", "fadeAt", "vortAt", "holdAt", "couldAt", "lookAAt", "lookGAt", "hesAt", "dropAt", "closeAt", "trappedAt", "turnAt", "explAt", "betrayAt", "doorAt", "lightAt", "offAt"]);
  const life = p.life;
  const faces = useMemo(() => buildShipCorridor(), []);
  const shake = f >= ruptAt && f < phaseAt + 20 ? (rnd(f) - 0.5) * 0.03 : 0;
  // a câmera anda até perto da passagem enquanto a Alyx aparece do outro lado
  const turn = IO((f - turnAt - 10) / 46);
  const e: Eye = { x: -1.6 * turn, y: 14 + 2.6 * IO((f - alyxAt + 10) / 70) + 0.1 * turn, z: 1.7, yaw: shake + (Math.PI / 2) * turn, pitch: -0.03 - 0.06 * turn + shake * 0.5, F: 900 };
  const L: Lights = { flash: 0.65, lamps: 0.2, red: f >= ruptAt ? 0.4 : 0, strobe: f >= phaseAt && f < phaseAt + 8 ? 0.2 : 0 };
  const P0 = proj(e, [-1.3, 24, 0]);
  const P1 = proj(e, [1.3, 24, 0]);
  const P2 = proj(e, [1.3, 24, 2.4]);
  const P3 = proj(e, [-1.3, 24, 2.4]);
  const hold = P(f, holdAt - 10, 12) * (1 - P(f, dropAt, 6));
  const alyxGone = P(f, trappedAt + 10, 14);
  // a passagem: um vão de anteparo (x −1,2…1,2, z 0…2,4, y 24) tomado por uma membrana de fase de borda viva. Abre na
  // mudança de fase → as bordas vão sendo comidas (sumindo) → o campo verde do Vortigaunt estabiliza → ele solta: a
  // membrana colapsa para o centro → as duas folhas da porta do anteparo deslizam e fecham. A Alyx fica atrás.
  const collapse = IO((f - dropAt) / Math.max(10, closeAt + 14 - dropAt));
  let inset = 1 - P(f, phaseAt, 12);
  inset += 0.3 * P(f, fadeAt, Math.max(10, holdAt - fadeAt)) * (1 - 0.75 * P(f, holdAt - 10, 14));
  inset = inset + (1 - inset) * collapse;
  const unstable = (f >= fadeAt ? 1 : 0.35) * (1 - 0.7 * hold);
  const mem: { x: number; y: number }[] = [];
  if (inset < 0.995) {
    const N = 44;
    for (let i = 0; i < N; i++) {
      const u = (i / N) * 9.6; // perímetro do vão: 2,4 + 2,4 + 2,4 + 2,4
      const [ex, ez] = u < 2.4 ? [-1.2 + u, 0] : u < 4.8 ? [1.2, u - 2.4] : u < 7.2 ? [1.2 - (u - 4.8), 2.4] : [-1.2, 2.4 - (u - 7.2)];
      const w = 0.5 + 0.3 * Math.sin(i * 1.9 + f / 6) + 0.2 * Math.sin(i * 4.3 - f / 3.5) + (f >= fadeAt ? (rnd(i * 31 + Math.floor(f / 3)) - 0.5) * 0.5 : 0);
      const k = Math.max(0, 1 - inset - (0.03 + 0.09 * unstable) * w);
      const q = proj(e, [ex * k, 24, 1.2 + (ez - 1.2) * k]);
      if (q) mem.push({ x: q.x, y: q.y });
    }
  }
  const memClip = mem.length > 2 ? `polygon(${mem.map((q) => `${q.x.toFixed(1)}px ${q.y.toFixed(1)}px`).join(", ")})` : "polygon(0 0, 0 0, 0 0)";
  const doorK = IO((f - closeAt) / 36);
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <RoomView e={e} L={L} f={f} faces={faces} />
      {/* o anteparo: moldura de metal com rebites, batentes com profundidade e a lâmpada de alerta em cima */}
      {(() => {
        const Q = (x: number, y: number, z: number) => proj(e, [x, y, z]);
        const poly = (pts: ([number, number, number])[]) => {
          const q = pts.map((v) => Q(v[0], v[1], v[2]));
          return q.every(Boolean) ? q.map((c) => `${c!.x.toFixed(1)},${c!.y.toFixed(1)}`).join(" ") : null;
        };
        const outer = poly([[-1.75, 23.98, 0], [1.75, 23.98, 0], [1.75, 23.98, 2.95], [-1.75, 23.98, 2.95]]);
        const inner = poly([[-1.2, 23.98, 0], [1.2, 23.98, 0], [1.2, 23.98, 2.4], [-1.2, 23.98, 2.4]]);
        const jL = poly([[-1.2, 23.98, 0], [-1.2, 24.4, 0], [-1.2, 24.4, 2.4], [-1.2, 23.98, 2.4]]);
        const jR = poly([[1.2, 23.98, 0], [1.2, 24.4, 0], [1.2, 24.4, 2.4], [1.2, 23.98, 2.4]]);
        const jT = poly([[-1.2, 23.98, 2.4], [1.2, 23.98, 2.4], [1.2, 24.4, 2.4], [-1.2, 24.4, 2.4]]);
        const lamp = Q(0, 23.95, 2.7);
        const c = Q(0, 24.4, 1.2);
        if (!outer || !inner || !c) return null;
        const blink = f >= ruptAt && Math.floor(f / 8) % 2 === 0;
        const rivets: { x: number; y: number }[] = [];
        for (let k = 0; k < 7; k++) {
          for (const [x, z] of [[-1.48, 0.25 + k * 0.4], [1.48, 0.25 + k * 0.4]] as [number, number][]) {
            const q = Q(x, 23.97, z);
            if (q) rivets.push(q);
          }
        }
        return (
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
            <defs>
              <radialGradient id="memFill" cx="0.5" cy="0.55" r="0.62">
                <stop offset="0" stopColor="rgba(246,232,255,0.95)" />
                <stop offset="0.45" stopColor="rgba(176,128,246,0.7)" />
                <stop offset="1" stopColor="rgba(70,34,130,0.55)" />
              </radialGradient>
              <clipPath id="memC">{mem.length > 2 ? <polygon points={mem.map((q) => `${q.x},${q.y}`).join(" ")} /> : <rect width={0} height={0} />}</clipPath>
            </defs>
            {/* o vão escuro (o outro lado do anteparo, antes da fase abrir) */}
            <polygon points={inner} fill="#060608" />
            {jL ? <polygon points={jL} fill="#17181d" /> : null}
            {jR ? <polygon points={jR} fill="#1d1e24" /> : null}
            {jT ? <polygon points={jT} fill="#121317" /> : null}
            <path d={`M ${outer.split(" ").join(" L ")} Z M ${inner.split(" ").join(" L ")} Z`} fill="#2c2e35" fillRule="evenodd" stroke="#0c0c0f" strokeWidth={2} />
            {rivets.map((q, k) => <circle key={k} cx={q.x} cy={q.y} r={2.4} fill="#4a4c54" />)}
            {lamp ? <circle cx={lamp.x} cy={lamp.y} r={7} fill={blink ? "#ff5d4d" : "#4a1a14"} style={blink ? { filter: "drop-shadow(0 0 12px #ff5d4d)" } : undefined} /> : null}
            {/* a membrana de fase: o outro lado do navio em luz violeta (corredor em outra época), borda viva */}
            {mem.length > 2 ? (
              <g>
                <polygon points={mem.map((q) => `${q.x},${q.y}`).join(" ")} fill="url(#memFill)" opacity={0.92} />
                <g clipPath="url(#memC)" opacity={0.55}>
                  {[[-1.2, 0], [1.2, 0], [1.2, 2.4], [-1.2, 2.4]].map(([x, z], k) => {
                    const far = Q(x * 0.35, 34, 1.2 + (z - 1.2) * 0.35);
                    const near = Q(x, 24.4, z);
                    return far && near ? <line key={k} x1={near.x} y1={near.y} x2={far.x} y2={far.y} stroke="#5a2f9a" strokeWidth={2} /> : null;
                  })}
                  {(() => {
                    const a = Q(-0.42, 34, 0.78);
                    const b = Q(0.42, 34, 1.62);
                    return a && b ? <rect x={a.x} y={b.y} width={b.x - a.x} height={a.y - b.y} fill="none" stroke="#5a2f9a" strokeWidth={2} /> : null;
                  })()}
                </g>
                <polygon points={mem.map((q) => `${q.x},${q.y}`).join(" ")} fill="none" stroke="#f3e6ff" strokeWidth={3} style={{ filter: "drop-shadow(0 0 10px #c79bff) drop-shadow(0 0 24px #9a6cff)" }} />
                {f >= fadeAt
                  ? mem.filter((_, k) => rnd(k * 7 + Math.floor(f / 2)) > 0.86).map((q, k) => <circle key={k} cx={q.x + (rnd(k + f) - 0.5) * 18} cy={q.y + (rnd(k * 3 + f) - 0.5) * 18} r={2.2} fill="#fff" opacity={0.9} />)
                  : null}
              </g>
            ) : null}
            {void c}
          </svg>
        );
      })()}
      {(() => {
        // a Alyx do outro lado: o marcador dela (anel no chão, haste, rótulo) visto pela membrana; falha com a interferência
        const base = proj(e, [0.4, 27, 0]);
        const head = proj(e, [0.4, 27, 1.72]);
        if (!base || !head || f < alyxAt) return null;
        const glitch = f >= fadeAt ? (rnd(Math.floor(f / 2)) > 0.7 ? 0.25 : 1) : 1;
        const o = P(f, alyxAt, 8) * (1 - alyxGone) * (inset > 0.97 ? 0 : 1) * glitch;
        const s = Math.max(0.5, Math.min(2, 6 / base.d));
        return (
          <>
          <AbsoluteFill style={{ clipPath: memClip, opacity: o }}>
            <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
              <ellipse cx={base.x} cy={base.y} rx={34 * s} ry={9 * s} fill="none" stroke={ORANGE} strokeWidth={2} strokeDasharray="6 5" strokeDashoffset={-f} />
              <line x1={base.x} y1={base.y} x2={head.x} y2={head.y} stroke={ORANGE} strokeWidth={2} />
            </svg>
          </AbsoluteFill>
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: o, pointerEvents: "none" }}>
              <FlagBadge cx={head.x} by={head.y} k={1} label="ALYX" col={f >= trappedAt ? RED : ORANGE} f={f} sub={f >= trappedAt ? "PRESA · OUTRA FASE" : f >= dropAt ? "SINAL CAINDO" : f >= holdAt ? "SEGURANDO A PASSAGEM" : "DO OUTRO LADO"} />
          </svg>
          </>
        );
      })()}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {P0 && P1 && P2 && P3 ? (
          <g>
            {/* a linha de fase passando no meio do grupo */}

            {/* o campo verde do Vortigaunt prende a borda da membrana (ela para de ser comida) */}
            {hold > 0 && mem.length > 2 ? <polygon points={mem.map((q) => `${q.x},${q.y}`).join(" ")} fill={`rgba(141,255,168,${0.1 * hold})`} stroke={GREEN} strokeWidth={5 * hold} style={{ filter: "drop-shadow(0 0 18px #8dffa8)" }} /> : null}
            {/* o colapso: o último fio de luz no meio do vão */}
            {collapse > 0.85 && f < closeAt + 24
              ? (() => {
                  const c = proj(e, [0, 24, 1.2]);
                  const w = proj(e, [1.2, 24, 1.2]);
                  if (!c || !w) return null;
                  const k = interpolate(f, [dropAt, closeAt + 24], [1, 0], C);
                  return <line x1={c.x - (w.x - c.x) * k} y1={c.y} x2={c.x + (w.x - c.x) * k} y2={c.y} stroke="#fff" strokeWidth={4} style={{ filter: "drop-shadow(0 0 14px #fff) drop-shadow(0 0 30px #c79bff)" }} />;
                })()
              : null}
            {/* as duas folhas da porta do anteparo saem dos batentes e fecham o vão */}
            {doorK > 0
              ? (() => {
                  const leaf = (x0: number, x1: number, key: string) => {
                    const a = proj(e, [x0, 24.05, 0]);
                    const b = proj(e, [x1, 24.05, 0]);
                    const c = proj(e, [x1, 24.05, 2.4]);
                    const d = proj(e, [x0, 24.05, 2.4]);
                    if (!a || !b || !c || !d) return null;
                    const lines = [0.3, 0.6, 0.9, 1.2, 1.5, 1.8, 2.1].map((z) => {
                      const l = proj(e, [x0, 24.04, z]);
                      const r = proj(e, [x1, 24.04, z]);
                      return l && r ? <line key={z} x1={l.x} y1={l.y} x2={r.x} y2={r.y} stroke="#2a2b31" strokeWidth={1.5} /> : null;
                    });
                    return (
                      <g key={key}>
                        <polygon points={`${a.x},${a.y} ${b.x},${b.y} ${c.x},${c.y} ${d.x},${d.y}`} fill="#3c3e46" stroke="#121216" strokeWidth={2} />
                        {lines}
                      </g>
                    );
                  };
                  const w = 1.2 * doorK;
                  // a faixa de alerta na borda que avança
                  const edge = (x: number, key: string) => {
                    const t0 = proj(e, [x - 0.06, 24.03, 0]);
                    const t1 = proj(e, [x + 0.06, 24.03, 2.4]);
                    return t0 && t1 ? <rect key={key} x={Math.min(t0.x, t1.x)} y={t1.y} width={Math.abs(t1.x - t0.x)} height={t0.y - t1.y} fill="url(#hazard)" /> : null;
                  };
                  const seam = proj(e, [0, 24.03, 2.4]);
                  const seamB = proj(e, [0, 24.03, 0]);
                  const glow = doorK >= 1 ? 1 - P(f, closeAt + 36, 30) : 0;
                  return (
                    <g>
                      <defs>
                        <pattern id="hazard" width={16} height={16} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                          <rect width={16} height={16} fill="#1a1a1a" />
                          <rect width={8} height={16} fill="#e8b830" />
                        </pattern>
                      </defs>
                      {leaf(-1.2, -1.2 + w, "l")}
                      {leaf(1.2 - w, 1.2, "r")}
                      {doorK < 1 ? edge(-1.2 + w - 0.06, "el") : null}
                      {doorK < 1 ? edge(1.2 - w + 0.06, "er") : null}
                      {glow > 0 && seam && seamB ? <line x1={seam.x} y1={seam.y} x2={seamB.x} y2={seamB.y} stroke="#e8d8ff" strokeWidth={3} opacity={glow} style={{ filter: "drop-shadow(0 0 12px #c79bff)" }} /> : null}
                    </g>
                  );
                })()
              : null}
          </g>
        ) : null}
        {/* o olhar do Vortigaunt que segura: para a Alyx, depois para o Gordon */}
        {f >= lookAAt && f < dropAt
          ? (() => {
              const h = proj(e, [-0.85, 22.4, 1.62]);
              const target = f < lookGAt ? proj(e, [0.4, 27, 1.5]) : { x: 960, y: 900 };
              return h && target ? <line x1={h.x} y1={h.y} x2={target.x} y2={target.y} stroke={GREEN} strokeWidth={2} strokeDasharray="4 6" opacity={0.8} /> : null;
            })()
          : null}
      </svg>
      {/* a porta lateral e a passagem verde (só pelo vão) */}
      {(() => {
        const open = polyScr(e, [[SD.x, SD.y0, 0], [SD.x, SD.y1, 0], [SD.x, SD.y1, SD.h], [SD.x, SD.y0, SD.h]]);
        if (!open) return null;
        const g = Math.max(0, (f >= turnAt ? 0.35 : 0.12) + 0.65 * P(f, lightAt - 10, 10) - 0.95 * P(f, offAt, 8));
        const q = (pts: V3r[]) => polyScr(e, pts);
        const back = q([[SD.far, SD.y1, 0], [SD.far, SD.y0, 0], [SD.far, SD.y0, SD.h], [SD.far, SD.y1, SD.h]]);
        const door = q([[SD.far - 0.01, 17.15, 0], [SD.far - 0.01, 16.25, 0], [SD.far - 0.01, 16.25, 2.1], [SD.far - 0.01, 17.15, 2.1]]);
        const wl = q([[SD.x, SD.y0, 0], [SD.far, SD.y0, 0], [SD.far, SD.y0, SD.h], [SD.x, SD.y0, SD.h]]);
        const wr = q([[SD.far, SD.y1, 0], [SD.x, SD.y1, 0], [SD.x, SD.y1, SD.h], [SD.far, SD.y1, SD.h]]);
        const fl = q([[SD.x, SD.y0, 0], [SD.x, SD.y1, 0], [SD.far, SD.y1, 0], [SD.far, SD.y0, 0]]);
        const ce = q([[SD.x, SD.y0, SD.h], [SD.far, SD.y0, SD.h], [SD.far, SD.y1, SD.h], [SD.x, SD.y1, SD.h]]);
        const jamb = q([[SD.x - 0.01, SD.y0 - 0.18, 0], [SD.x - 0.01, SD.y1 + 0.18, 0], [SD.x - 0.01, SD.y1 + 0.18, SD.h + 0.18], [SD.x - 0.01, SD.y0 - 0.18, SD.h + 0.18]]);
        const spill = q([[SD.x, SD.y0 - 0.3, 0.005], [SD.x, SD.y1 + 0.3, 0.005], [SD.x - 1.8, SD.y1 + 0.6, 0.005], [SD.x - 1.8, SD.y0 - 0.6, 0.005]]);
        const gc = (k: number) => `rgb(${Math.round(16 + 120 * k)},${Math.round(22 + 230 * k)},${Math.round(18 + 150 * k)})`;
        return (
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            <defs>
              <clipPath id="sdOpen">
                <polygon points={open} />
              </clipPath>
              <radialGradient id="sdGlow" cx="0.5" cy="0.5" r="0.6">
                <stop offset="0" stopColor="#e6fff0" />
                <stop offset="0.5" stopColor="#8dffa8" />
                <stop offset="1" stopColor="#2f8a4a" />
              </radialGradient>
            </defs>
            {jamb ? <polygon points={jamb} fill="#1e2022" stroke="#0a0b0c" strokeWidth={2} /> : null}
            <g clipPath="url(#sdOpen)">
              <polygon points={open} fill="#050806" />
              {back ? <polygon points={back} fill={gc(0.1 * g)} /> : null}
              {door ? <polygon points={door} fill={g > 0.05 ? "url(#sdGlow)" : "#0c120e"} opacity={0.25 + 0.75 * g} style={g > 0.3 ? { filter: `drop-shadow(0 0 ${30 * g}px #8dffa8)` } : undefined} /> : null}
              {ce ? <polygon points={ce} fill={gc(0.12 * g)} stroke="#000" strokeOpacity={0.3} /> : null}
              {fl ? <polygon points={fl} fill={gc(0.3 * g)} stroke="#000" strokeOpacity={0.3} /> : null}
              {wl ? <polygon points={wl} fill={gc(0.2 * g)} stroke="#000" strokeOpacity={0.3} /> : null}
              {wr ? <polygon points={wr} fill={gc(0.2 * g)} stroke="#000" strokeOpacity={0.3} /> : null}
            </g>
            {spill ? <polygon points={spill} fill="#8dffa8" opacity={0.12 * g} style={{ filter: "blur(10px)" }} /> : null}
          </svg>
        );
      })()}
      {f >= vortAt
        ? (() => {
            // caminhos [quadro, x, y]: viram as costas e vão para a porta lateral, um de cada vez; o que segurou a
            // passagem (k = 0) para no vão durante a traição e entra por último, quando a porta acende
            const T = turnAt;
            const D: V3r = [1.5, 16.75, 0];
            const IN: V3r = [2.7, 16.7, 0];
            const END: V3r = [SD.far - 0.35, 16.7, 0];
            const paths: [number, number, number][][] = [
              [[0, -0.85, 22.4], [T + 40, -0.85, 22.4], [betrayAt, D[0], D[1]], [doorAt, D[0], D[1]], [doorAt + 26, IN[0], IN[1]], [lightAt + 24, END[0], END[1]]],
              [[0, 1.05, 21.4], [T, 1.05, 21.4], [T + 75, D[0], D[1]], [T + 95, IN[0], IN[1]], [T + 165, END[0], END[1]]],
              [[0, -0.6, 20.6], [T + 30, -0.6, 20.6], [T + 110, D[0], D[1]], [T + 130, IN[0], IN[1]], [T + 205, END[0], END[1]]],
            ];
            const pos = (pp: [number, number, number][], fr: number) => {
              if (fr <= pp[0][0]) return { x: pp[0][1], y: pp[0][2], moving: false, dx: 0, dy: 0 };
              for (let i = 0; i < pp.length - 1; i++) {
                const [t0, x0, y0] = pp[i];
                const [t1, x1, y1] = pp[i + 1];
                if (fr <= t1) {
                  const u = (fr - t0) / Math.max(1, t1 - t0);
                  return { x: x0 + (x1 - x0) * u, y: y0 + (y1 - y0) * u, moving: x1 !== x0 || y1 !== y0, dx: x1 - x0, dy: y1 - y0 };
                }
              }
              const l = pp[pp.length - 1];
              return { x: l[1], y: l[2], moving: false, dx: 0, dy: 0 };
            };
            const openP = polyScr(e, [[SD.x, SD.y0, 0], [SD.x, SD.y1, 0], [SD.x, SD.y1, SD.h], [SD.x, SD.y0, SD.h]]);
            const doorP = polyScr(e, [[SD.far - 0.02, 17.15, 0], [SD.far - 0.02, 16.25, 0], [SD.far - 0.02, 16.25, 2.1], [SD.far - 0.02, 17.15, 2.1]]);
            const vs = [0, 1, 2]
              .map((k) => ({ k, ...pos(paths[k], f) }))
              .sort((a, b) => Math.hypot(b.x - e.x, b.y - e.y) - Math.hypot(a.x - e.x, a.y - e.y));
            return vs.map((v) => {
              const holder = v.k === 0;
              const endT = paths[v.k][paths[v.k].length - 1][0];
              // entra pela porta verde do fim e some na luz
              const o = P(f, vortAt + v.k * 4, 8) * (1 - P(f, endT - 12, 12));
              if (o <= 0) return null;
              const a = proj(e, [v.x, v.y, 0]);
              const b = proj(e, [v.x + v.dx * 0.05, v.y + v.dy * 0.05, 0]);
              const toLeft = v.moving && a && b ? b.x < a.x : f < turnAt && v.x > 0;
              const walk = v.moving ? -Math.abs(Math.sin(f / 5 + v.k)) * 6 : 0;
              const clip = v.x > SD.x - 0.05 ? (v.x > SD.far - 0.6 && doorP ? doorP : openP) : null;
              return (
                <div key={v.k} style={{ position: "absolute", inset: 0, clipPath: clip ? cssPoly(clip) : undefined, pointerEvents: "none" }}>
                  <SilhouetteAt e={e} x={v.x} y={v.y} h={1.85} src="hl3silh/vort_silh.png" ar={270 / 400} f={f + v.k * 9} o={o} flip={toLeft} rim={holder && hold > 0 ? `rgba(141,255,168,${0.6 + 0.4 * hold})` : "rgba(141,255,168,0.7)"} top="#3c4a36" bot="#080c08" bob={walk} label={holder && f >= holdAt && f < dropAt ? "SEGURA A PASSAGEM" : undefined} labelCol={GREEN} />
                </div>
              );
            });
          })()
        : null}
      {/* os arcos de vortessência das mãos de quem segura até a passagem */}
      {f >= holdAt - 10 && f < dropAt + 4 && P0 && P1 && P2 && P3
        ? (() => {
            const hand = proj(e, [-0.55, 22.2, 1.0]);
            if (!hand) return null;
            const tx = mem.length ? mem[Math.floor(mem.length * 0.62)].x : (P0.x + P1.x) / 2;
            const ty = mem.length ? mem[Math.floor(mem.length * 0.62)].y : (P0.y + P2.y) / 2;
            return (
              <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
                {[0, 1, 2].map((j) => {
                  const pts = Array.from({ length: 9 }).map((_, i) => {
                    const u = i / 8;
                    const jx = i === 0 || i === 8 ? 0 : (rnd(Math.floor(f / 2) * 13 + i * 7 + j * 31) - 0.5) * 40;
                    const jy = i === 0 || i === 8 ? 0 : (rnd(Math.floor(f / 2) * 17 + i * 5 + j * 19) - 0.5) * 40;
                    return `${hand.x + (tx + (j - 1) * 40 - hand.x) * u + jx},${hand.y + (ty - hand.y) * u + jy}`;
                  });
                  return <polyline key={j} points={pts.join(" ")} fill="none" stroke="#b8ffd0" strokeWidth={2.2 - j * 0.5} opacity={hold} style={{ filter: "drop-shadow(0 0 8px #8dffa8)" }} />;
                })}
              </svg>
            );
          })()
        : null}
      <Hud f={f} yaw={e.yaw} eye={e} blips={f >= alyxAt && alyxGone < 0.5 ? [{ x: 0.4, y: 27, hot: true }] : []} msg={f >= betrayAt - 10 ? "TRAIÇÃO" : f >= turnAt - 10 ? "OS VORTIGAUNTS VIRAM AS COSTAS" : f >= trappedAt ? "ALYX · DO OUTRO LADO" : f >= dropAt ? "ELE SOLTA" : f >= hesAt ? "ELE HESITA" : f >= holdAt ? "UM VORTIGAUNT SEGURA A PASSAGEM" : f >= fadeAt ? "A PASSAGEM ESTÁ SUMINDO" : f >= ruptAt ? "SEGUNDA RUPTURA" : undefined} msgCol={f >= betrayAt - 10 ? RED : f >= holdAt && f < dropAt ? GREEN : CREAM} />
      {/* 08/10: sem a frase grande no meio do POV — a traição fica no HUD */}
      <AbsoluteFill style={{ background: "#000", opacity: fade(f, life), pointerEvents: "none" }} />
      <FilmLook />
      {void passAt}
      {void couldAt}
      {void explAt}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- o saldo
export const HLRAftermathCards: React.FC<Pr> = (p) => {
  const f = useCurrentFrame();
  const [aliveAt, deadAt, goneAt, gordonAt, shipAt, filesAt, findAt, notAllAt, dirAt] = ks(p, ["aliveAt", "deadAt", "goneAt", "gordonAt", "shipAt", "filesAt", "findAt", "notAllAt", "dirAt"]);
  const cards = [
    ["ALYX", "sobrevive", ORANGE, aliveAt],
    ["MOSSMAN", "está morta", RED, deadAt],
    ["VORTIGAUNTS", "foram embora", GREEN, goneAt],
  ] as const;
  const out = P(f, gordonAt - 6, 10);
  const needle = interpolate(f, [dirAt - 20, dirAt + 20], [0, 140], { ...C, easing: Easing.inOut(Easing.cubic) }) + Math.sin(f / 9) * 4;
  return (
    <Shell f={f} life={p.life}>
      {cards.map(([n, t, c, at], i) => (
        <div key={n} style={{ position: "absolute", left: 140 + i * 560, top: 300, width: 520, padding: "28px 30px", borderRadius: 16, background: "rgba(12,14,18,0.8)", border: `2px solid ${c}`, opacity: P(f, at, 8) * (1 - out * 0.7), transform: `translateY(${out * -120}px) scale(${1 - out * 0.3})` }}>
          <div style={{ fontFamily: MONO, fontSize: 18, letterSpacing: 6, color: c }}>{n}</div>
          <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 64, color: TXT, lineHeight: 1.05, textDecoration: i === 1 ? "line-through" : undefined, textDecorationColor: RED }}>{t}</div>
        </div>
      ))}
      {out > 0 ? (
        <div style={{ position: "absolute", left: 140, top: 520, width: 1100, opacity: out }}>
          <div style={{ fontFamily: MONO, fontSize: 18, letterSpacing: 6, color: AMB }}>GORDON</div>
          <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 60, color: TXT, lineHeight: 1.05 }}>{f >= filesAt ? "com arquivos que ainda não entende" : f >= shipAt ? "num navio quebrado no tempo" : "agora sozinho"}</div>
          {f >= findAt ? <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 48, color: ORANGE, lineHeight: 1.05, marginTop: 14, opacity: P(f, findAt, 8) }}>{f >= notAllAt ? "atrás de uma Alyx que não está contando tudo" : "tentando reencontrar a Alyx"}</div> : null}
        </div>
      ) : null}
      {f >= dirAt - 20 ? (
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: P(f, dirAt - 20, 10) }}>
          <g transform="translate(1560 760)">
            <circle r={150} fill="rgba(10,12,14,0.85)" stroke={CREAM} strokeWidth={3} />
            {["N", "L", "S", "O"].map((d, k) => (
              <text key={d} x={Math.sin((k * Math.PI) / 2) * 118} y={-Math.cos((k * Math.PI) / 2) * 118 + 8} textAnchor="middle" fill={CREAM} fontFamily={MONO} fontSize={22}>
                {d}
              </text>
            ))}
            <g transform={`rotate(${needle})`}>
              <path d="M 0 -100 L 14 0 L -14 0 Z" fill={RED} />
              <path d="M 0 100 L 14 0 L -14 0 Z" fill="#9aa" />
            </g>
          </g>
          <text x={1560} y={960} textAnchor="middle" fill={CREAM} fontFamily={MONO} fontSize={18} letterSpacing={5}>
            A HISTÓRIA MUDA DE DIREÇÃO
          </text>
        </svg>
      ) : null}
    </Shell>
  );
};
