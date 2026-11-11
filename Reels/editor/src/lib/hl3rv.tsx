// =================================================================================================
// HL3 · REFORMULAÇÃO · 4C "três dias" (v3, 05/10/2026). Seis tomadas com corte seco, tudo grande:
//  1) relógio gigante 00:00→72:00 com três ciclos de céu e um anel 3D "72 HORAS" girando atrás
//  2) PARA A ALYX: preto, relógio travado, NADA com impacto (partículas congelam)
//  3) tela dividida: o encontro real com o G-Man | faixa vazia 72 h | a neve (imagem real)
//  4) a luz do ritual real invade a faixa; ela racha e vaza
//  5) partículas saem do vazio e viram LUGARES / PESSOAS / O QUE AINDA NÃO ACONTECEU (eco da imagem atrás)
//  6) ALYX em partículas laranja recebe partículas violeta de fora até transbordar; ficam vermelhas no fim
// Identidade da casa: Geist 800, Geist Mono, laranja HL. Um vídeo por vez.
// =================================================================================================
import React, { useMemo } from "react";
import { AbsoluteFill, Easing, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { FONT, MONO } from "./overlays";
import { C, Clip, HL, rnd } from "./hl3";
import { FilmLook, decode } from "./hl3r";
import { PTS } from "./hl3r_pts";
import { HLQuestionShift } from "./hl3z";

const RED = "#ff5d4d";
const VIO = "#c79bff";
const ICE = "#9fe6ff";
const GREEN = "#8dffa8";
const ORANGE = HL.orange;
const TXT = HL.text;
const P = (f: number, at: number, d = 12) => interpolate(f, [at, at + d], [0, 1], { ...C, easing: Easing.out(Easing.cubic) });
const IO = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const CL = "videos/hl3_M01_R/clips/";

// anel 3D de texto girando (cilindro de letras)
const TextRing: React.FC<{ f: number; text: string; speed: number; angle?: number; r?: number; size?: number; y?: number; color?: string; tilt?: number }> = ({ f, text, speed, angle, r = 620, size = 64, y = 0, color = TXT, tilt = -12 }) => {
  const chars = text.split("");
  const n = chars.length;
  const base = angle ?? f * speed;
  return (
    <AbsoluteFill style={{ perspective: 1600, alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "relative", transformStyle: "preserve-3d", transform: `translateY(${y}px) rotateX(${tilt}deg)` }}>
        {chars.map((ch, i) => {
          const ang = base + (i / n) * 360;
          const front = Math.cos((ang * Math.PI) / 180);
          return (
            <span key={i} style={{ position: "absolute", left: -size * 0.3, top: -size * 0.6, fontFamily: FONT, fontWeight: 800, fontSize: size, color, opacity: Math.max(0, front) * Math.max(0, front), transform: `rotateY(${ang}deg) translateZ(${r}px)`, backfaceVisibility: "visible", whiteSpace: "pre" }}>
              {ch}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

type Props = { life: number; landAt?: number; worldAt?: number; daysAt?: number; alyxAt?: number; nothingAt?: number; gmanAt?: number; snowAt?: number; ritualAt?: number; leakAt?: number; placeAt?: number; personAt?: number; futureAt?: number; oppAt?: number; contAt?: number; partAt?: number; neverAt?: number };
const NP = 1600;
const NF = 700;

export const HLRThreeDaysV3: React.FC<Props> = (p) => {
  const f = useCurrentFrame();
  const a = (v?: number) => v ?? 1e9;
  const [worldAt, alyxAt, nothingAt, gmanAt, snowAt, ritualAt, leakAt, placeAt, personAt, futureAt, oppAt, contAt, neverAt] = [p.worldAt, p.alyxAt, p.nothingAt, p.gmanAt, p.snowAt, p.ritualAt, p.leakAt, p.placeAt, p.personAt, p.futureAt, p.oppAt, p.contAt, p.neverAt].map(a);
  const shot = f < gmanAt ? 1 : f < gmanAt ? 2 : f < ritualAt ? 3 : f < placeAt ? 4 : f < oppAt ? 5 : 6;
  // partículas: sementes fixas
  const seeds = useMemo(() => Array.from({ length: NP }).map((_, i) => ({ ang: rnd(i * 1.37) * Math.PI * 2, sp: 6 + rnd(i * 2.71) * 14, d: rnd(i * 3.9) * 10, r: 1.6 + rnd(i * 5.3) * 1.8 })), []);
  const VX = 960;
  const VY = 540;
  const spill = (i: number, t: number) => {
    const s = seeds[i];
    const k = Math.max(0, t - leakAt - s.d);
    const dist = Math.min(900, k * s.sp * 0.6);
    return [VX + Math.cos(s.ang) * dist * 1.4, VY + Math.sin(s.ang) * dist * 0.55 + Math.sin(t / 9 + i) * 4];
  };
  const word = (key: string, i: number) => [PTS[key][i * 2], PTS[key][i * 2 + 1]];
  const sets: { at: number; key: string }[] = [
    { at: placeAt, key: "lugares" },
    { at: personAt, key: "pessoas" },
    { at: futureAt, key: "futuro" },
    { at: oppAt, key: "alyx" },
  ];
  const pos = (i: number, t: number): number[] => {
    let cur = -1;
    sets.forEach((s, k) => {
      if (t >= s.at) cur = k;
    });
    if (cur < 0) return spill(i, t);
    const prev = cur === 0 ? spill(i, sets[0].at) : word(sets[cur - 1].key, i);
    const tgt = word(sets[cur].key, i);
    const e = IO(Math.min(1, Math.max(0, (t - sets[cur].at - seeds[i].d * 0.8) / 20)));
    const jit = Math.sin(t / 7 + i * 1.3) * 1.5;
    return [prev[0] + (tgt[0] - prev[0]) * e + jit, prev[1] + (tgt[1] - prev[1]) * e + jit];
  };
  // o relógio desacelera e POUSA em 72:00 no "dias" (landAt); o anel freia junto; "3 DIAS" marca o pouso
  const landAt = p.landAt ?? alyxAt - 8;
  const span = Math.max(1, landAt - worldAt);
  const prog = Math.min(1, Math.max(0, (f - worldAt) / span));
  const hours = 72 * (1 - Math.pow(1 - prog, 2.2));
  const ringAngle = 9 * span * (prog - (prog * prog) / 2) + (f < worldAt ? 0 : 0);
  const landed = f >= landAt;
  const sky = 0.5 - 0.5 * Math.cos((hours / 24) * Math.PI * 2); // 0 noite → 1 dia
  const frozen = f >= nothingAt;
  return (
    <AbsoluteFill style={{ background: "#05070a", overflow: "hidden" }}>
      {/* 1) o mundo: relógio gigante + céu girando + anel 72 HORAS */}
      {shot === 1 ? (
        <AbsoluteFill style={{ background: `linear-gradient(180deg, rgb(${8 + sky * 60},${12 + sky * 40},${30 + sky * 30}) 0%, rgb(${10 + sky * 120},${10 + sky * 60},${14 + sky * 10}) 100%)` }}>
          <TextRing f={f} text="72 HORAS · 72 HORAS · 72 HORAS · " speed={0} angle={ringAngle} y={-300} size={54} r={700} color="rgba(242,240,247,0.7)" />
          <div style={{ position: "absolute", left: 110, top: 96, fontFamily: MONO, fontSize: 24, letterSpacing: 8, color: TXT }}>{decode("PARA TODO MUNDO", f, worldAt, 3)}</div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 380, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 300, letterSpacing: -14, color: TXT, opacity: 1 - 0.55 * P(f, nothingAt, 12), textShadow: "0 20px 80px rgba(0,0,0,0.6)", fontVariantNumeric: "tabular-nums", transform: `translateY(${-130 * P(f, alyxAt, 16)}px) scale(${(landed ? 1.04 - 0.04 * P(f, landAt, 8) : 1) * (1 - 0.22 * P(f, alyxAt, 16))})` }}>
            {`${String(Math.floor(hours)).padStart(2, "0")}:${String(Math.floor((hours % 1) * 60)).padStart(2, "0")}`}
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 720 - 115 * P(f, alyxAt, 16), textAlign: "center", fontFamily: MONO, fontSize: 34, letterSpacing: 14, color: ORANGE, opacity: 1 - 0.55 * P(f, nothingAt, 12) }}>{landed ? "3 DIAS" : `DIA ${Math.min(3, Math.floor(hours / 24) + 1)}`}</div>
          {f >= alyxAt ? (
            <div style={{ position: "absolute", left: 0, right: 0, top: 735, textAlign: "center", opacity: P(f, alyxAt, 12) }}>
              <div style={{ fontFamily: MONO, fontSize: 26, letterSpacing: 12, color: ORANGE }}>{decode("PARA A ALYX", f, alyxAt, 3)}</div>
              <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 170, letterSpacing: -8, color: f >= nothingAt ? TXT : "rgba(242,240,247,0.35)", marginTop: 6 }}>{f >= nothingAt ? "nada" : "00:00"}</div>
            </div>
          ) : null}
        </AbsoluteFill>
      ) : null}
      {/* 2) a Alyx: nada */}
      {shot === 2 ? (
        <AbsoluteFill>
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
            {Array.from({ length: 90 }).map((_, i) => {
              const t = frozen ? nothingAt : f;
              return <circle key={i} cx={(rnd(i) * 1920 + t * (0.6 + rnd(i * 2))) % 1920} cy={(rnd(i * 3) * 1080 + t * 0.3) % 1080} r={1 + rnd(i * 7) * 2} fill={TXT} opacity={0.35} />;
            })}
          </svg>
          <div style={{ position: "absolute", left: 110, top: 96, fontFamily: MONO, fontSize: 24, letterSpacing: 8, color: ORANGE }}>{decode("PARA A ALYX", f, alyxAt, 3)}</div>
          {!frozen ? <div style={{ position: "absolute", left: 0, right: 0, top: 380, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 300, letterSpacing: -14, color: "rgba(242,240,247,0.35)" }}>00:00</div> : null}
          {frozen ? (
            <div style={{ position: "absolute", left: 0, right: 0, top: 330, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 380, letterSpacing: -16, color: RED, transform: `scale(${1.25 - 0.25 * P(f, nothingAt, 8)})`, textShadow: `0 0 80px rgba(255,93,77,0.35)` }}>NADA</div>
          ) : null}
        </AbsoluteFill>
      ) : null}
      {/* 3) o encontro | vazio | a neve */}
      {shot === 3 || shot === 4 ? (
        <AbsoluteFill>
          <div style={{ position: "absolute", left: 0, top: 0, width: 760, height: 1080, overflow: "hidden" }}>
            <Sequence from={Math.round(gmanAt)} layout="none">
              <Clip src="videos/hl3_M01_1A2/clips/alyx_gman.mp4" from={0.6} rate={0.6} style={{ objectPosition: "78% 40%", filter: "brightness(1.5) contrast(1.05)" }} />
            </Sequence>
            <div style={{ position: "absolute", left: 60, bottom: 90, fontFamily: MONO, fontSize: 22, letterSpacing: 8, color: TXT, textShadow: "0 2px 10px #000" }}>{decode("O ENCONTRO COM O G-MAN", f, gmanAt, 3)}</div>
          </div>
          {f >= snowAt ? (
            <div style={{ position: "absolute", right: 0, top: 0, width: 760, height: 1080, overflow: "hidden" }}>
              <Sequence from={Math.round(snowAt)} layout="none">
                <Clip src={CL + "lore_neve.mp4"} from={0} rate={0.7} />
              </Sequence>
              <div style={{ position: "absolute", right: 60, bottom: 90, fontFamily: MONO, fontSize: 22, letterSpacing: 8, color: "#0b1016" }}>{decode("ELA REAPARECE NA NEVE", f, snowAt, 3)}</div>
            </div>
          ) : null}
          {/* o vazio entre os dois */}
          <div style={{ position: "absolute", left: 760, width: 400, top: 0, height: 1080, background: "#000", borderLeft: `2px solid ${ORANGE}`, borderRight: `2px solid ${f >= snowAt ? ORANGE : "transparent"}`, overflow: "hidden" }}>
            {shot === 4 ? (
              <>
                <AbsoluteFill style={{ opacity: P(f, ritualAt, 10) * (1 - P(f, leakAt + 30, 20) * 0.5) }}>
                  <Sequence from={Math.round(ritualAt)} layout="none">
                    <Clip src="videos/hl3_M01_3C/clips/ep2_vort_luz.mp4" from={0.5} rate={0.8} style={{ filter: "saturate(1.4)" }} />
                  </Sequence>
                </AbsoluteFill>
                <div style={{ position: "absolute", left: 0, right: 0, top: 120, textAlign: "center", fontFamily: MONO, fontSize: 18, letterSpacing: 6, color: GREEN }}>{decode("RITUAL VORTIGAUNT", f, ritualAt, 3)}</div>
              </>
            ) : (
              <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
                <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 120, letterSpacing: -4, color: "rgba(242,240,247,0.9)" }}>72 H</div>
                <div style={{ fontFamily: MONO, fontSize: 20, letterSpacing: 8, color: RED, marginTop: 8 }}>SEM REGISTRO</div>
              </AbsoluteFill>
            )}
          </div>
          {/* rachaduras e vazamento */}
          {f >= leakAt ? (
            <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
              {Array.from({ length: 10 }).map((_, i) => {
                const g = P(f, leakAt + i * 2, 24);
                const x0 = 760 + rnd(i * 3.1) * 400;
                const y0 = 120 + rnd(i * 1.9) * 840;
                const dir = i % 2 ? 1 : -1;
                const pts = [0, 1, 2, 3, 4].map((k) => `${x0 + dir * k * 120 * g + (rnd(i * 10 + k) - 0.5) * 60},${y0 + (rnd(i * 20 + k) - 0.5) * 140 * g}`).join(" ");
                return (
                  <g key={i}>
                    <polyline points={pts} fill="none" stroke={i % 3 ? VIO : GREEN} strokeWidth={12} opacity={0.35} style={{ filter: "blur(6px)" }} />
                    <polyline points={pts} fill="none" stroke="#fff" strokeWidth={2.5} />
                  </g>
                );
              })}
              {seeds.slice(0, 900).map((s, i) => {
                const q = spill(i, f);
                return <circle key={i} cx={q[0]} cy={q[1]} r={s.r} fill={i % 3 ? VIO : ICE} opacity={0.85} />;
              })}
            </svg>
          ) : null}
        </AbsoluteFill>
      ) : null}
      {/* 5/6) as palavras de partículas, com o eco da imagem atrás */}
      {shot >= 5 ? (
        <AbsoluteFill>
          {shot === 5
            ? [
                { at: placeAt, end: personAt, src: CL + "frag_lugar.mp4" },
                { at: personAt, end: futureAt, src: CL + "frag_pessoa.mp4" },
                { at: futureAt, end: oppAt, src: CL + "frag_futuro.mp4" },
              ].map((b, k) =>
                f >= b.at && f < b.end ? (
                  <AbsoluteFill key={k} style={{ opacity: 0.32 * P(f, b.at, 10), filter: "blur(3px) saturate(0.8)" }}>
                    <Sequence from={Math.round(b.at)} layout="none">
                      <Clip src={b.src} from={0} />
                    </Sequence>
                  </AbsoluteFill>
                ) : null,
              )
            : null}
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, filter: `drop-shadow(0 0 6px ${shot === 6 ? ORANGE : VIO})` }}>
            {seeds.map((s, i) => {
              const q = pos(i, f);
              const col = shot === 6 ? ORANGE : i % 3 ? VIO : ICE;
              const dim = shot === 6 ? 1 - 0.45 * P(f, contAt + 10, 30) - 0.3 * P(f, neverAt, 12) : 1;
              return <circle key={i} cx={q[0]} cy={q[1]} r={s.r * 0.95} fill={col} opacity={dim} />;
            })}
            {shot === 6
              ? Array.from({ length: NF }).map((_, i) => {
                  // partículas de fora: entram pelas bordas e se amontoam sobre o ALYX (transbordando)
                  const side = i % 4;
                  const sx = side === 0 ? -40 : side === 1 ? 1960 : rnd(i * 1.1) * 1920;
                  const sy = side === 2 ? -40 : side === 3 ? 1120 : rnd(i * 2.2) * 1080;
                  const k = i % NP;
                  const tx = PTS.alyx[k * 2] + (rnd(i * 3.3) - 0.5) * 220;
                  const ty = PTS.alyx[k * 2 + 1] + (rnd(i * 4.4) - 0.5) * 200;
                  const e = IO(Math.min(1, Math.max(0, (f - contAt - rnd(i * 5.5) * 25) / 30)));
                  if (e <= 0) return null;
                  const red = f >= neverAt;
                  return <circle key={"x" + i} cx={sx + (tx - sx) * e + Math.sin(f / 5 + i) * 3} cy={sy + (ty - sy) * e} r={red ? 3.8 : 3.2} fill={red ? "#ff1f5a" : VIO} opacity={red ? 0.7 + 0.3 * Math.sin(f / 3 + i) : 1} />;
                })
              : null}
          </svg>
          <div style={{ position: "absolute", left: 0, right: 0, top: 150, textAlign: "center", fontFamily: MONO, fontSize: 24, letterSpacing: 10, color: shot === 6 ? ORANGE : "rgba(242,240,247,0.75)" }}>
            {shot === 5
              ? f >= futureAt
                ? decode("COISAS QUE AINDA NÃO ACONTECERAM", f, futureAt, 4)
                : f >= personAt
                  ? decode("PESSOAS QUE NUNCA CONHECEU", f, personAt, 4)
                  : decode("LUGARES ONDE NUNCA ESTEVE", f, placeAt, 4)
              : f >= neverAt
                ? decode("COISAS QUE NUNCA DEVERIAM FAZER PARTE DELA", f, neverAt, 4)
                : f >= contAt
                  ? decode("NÃO ESQUECEU NADA · ESTÁ LEMBRANDO DEMAIS", f, contAt, 4)
                  : ""}
          </div>
        </AbsoluteFill>
      ) : null}
      <FilmLook />
    </AbsoluteFill>
  );
};

// =================================================================================================
// 4C "três dias" v4 (opção A, 05/10/2026): relógio + NADA (da v3) e depois a CONTINUAÇÃO DO ARQUIVO DA MEMÓRIA
// (mesma interface do HLRMemoryFile): 09 · 72 H SEM REGISTRO · 10 · A NEVE · o ritual faz a linha 09 falhar ·
// linhas violeta injetadas (lugar / pessoa / ainda não aconteceu) com a palavra se formando em partículas dentro da
// tela · continuidade passa de 100% · no "contrário" as injetadas se multiplicam e transbordam · CONTAMINADA.
// =================================================================================================
type Row = { n: string; t: string; at: number; kind: "old" | "void" | "snow" | "rit" | "inj" | "spam" };
export const HLRThreeDaysV4: React.FC<Props & { voidAt?: number }> = (p) => {
  const f = useCurrentFrame();
  const a = (v?: number) => v ?? 1e9;
  const [gmanAt, voidAt, snowAt, ritualAt, leakAt, placeAt, personAt, futureAt, oppAt, contAt, neverAt] = [p.gmanAt, p.voidAt, p.snowAt, p.ritualAt, p.leakAt, p.placeAt, p.personAt, p.futureAt, p.oppAt, p.contAt, p.neverAt].map(a);
  const seeds = useMemo(() => Array.from({ length: NP }).map((_, i) => ({ d: rnd(i * 3.9) * 10, r: 1.2 + rnd(i * 5.3) * 1.3, ang: rnd(i * 1.37) * Math.PI * 2 })), []);
  if (f < gmanAt) return <HLRThreeDaysV3 {...p} />;
  const VX = 680;
  const VY = 196;
  const VW = 1130;
  const VH = 636;
  const red = f >= neverAt;
  // linhas do índice
  const rows: Row[] = [
    { n: "05", t: "G-MAN", at: gmanAt - 1, kind: "old" },
    { n: "06", t: "O PAI MORRE", at: gmanAt - 1, kind: "old" },
    { n: "07", t: "ELA IMPEDE", at: gmanAt - 1, kind: "old" },
    { n: "08", t: "“SERVIÇOS… DEPOIS”", at: gmanAt - 1, kind: "old" },
    { n: "09", t: "72 H · SEM REGISTRO", at: voidAt, kind: "void" },
    { n: "10", t: "A NEVE", at: snowAt, kind: "snow" },
    { n: "11", t: "RITUAL VORTIGAUNT", at: ritualAt, kind: "rit" },
    { n: "??", t: "LUGAR DESCONHECIDO", at: placeAt, kind: "inj" },
    { n: "??", t: "PESSOA DESCONHECIDA", at: personAt, kind: "inj" },
    { n: "??", t: "AINDA NÃO ACONTECEU", at: futureAt, kind: "inj" },
  ];
  // no "contrário": injeções em série (cada vez mais rápidas)
  if (f >= oppAt) {
    const SP = ["?? LUGAR", "?? ROSTO", "?? NAVIO", "?? SALA", "?? VOZ", "?? CIDADE", "?? DATA", "?? NOME", "?? CÉU", "?? CORREDOR", "?? ANO", "?? PORTA"];
    let t = oppAt;
    for (let k = 0; t < f + 1 && k < 80; k++) {
      rows.push({ n: "??", t: SP[k % SP.length].slice(3) + " · NÃO É DELA", at: t, kind: "spam" });
      t += Math.max(3, 10 - k * 0.5);
    }
  }
  const vis = rows.filter((r) => f >= r.at);
  const MAXR = 9;
  const shownRows = vis.slice(-MAXR);
  const cur = vis[vis.length - 1];
  // contador de continuidade
  const injN = vis.filter((r) => r.kind === "inj" || r.kind === "spam").length;
  const cont = f < voidAt ? 100 : f < leakAt ? 100 : 100 + injN * 14 + Math.max(0, Math.round((f - leakAt) * 0.15));
  // o que a tela mostra
  const view = f >= oppAt ? "montagem" : f >= placeAt ? (f >= futureAt ? "futuro" : f >= personAt ? "pessoa" : "lugar") : f >= ritualAt ? "ritual" : f >= snowAt ? "neve" : f >= voidAt ? "void" : "gman";
  const cutAt = { montagem: oppAt, gman: gmanAt, void: voidAt, neve: snowAt, ritual: ritualAt, lugar: placeAt, pessoa: personAt, futuro: futureAt }[view] as number;
  const pull = f - cutAt < 4 ? 1 - (f - cutAt) / 4 : 0;
  const glitchVoid = f >= ritualAt;
  // partículas da palavra dentro da tela
  const wordKey = f >= futureAt ? "futuro" : f >= personAt ? "pessoas" : "lugares";
  const wordAt = f >= futureAt ? futureAt : f >= personAt ? personAt : placeAt;
  const prevKey = f >= futureAt ? "pessoas" : f >= personAt ? "lugares" : null;
  const sx = VW / 1920;
  const pt = (key: string, i: number) => [VX + PTS[key][i * 2] * sx, VY + (PTS[key][i * 2 + 1] - 60) * sx];
  return (
    <AbsoluteFill style={{ background: "#05070a", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 110, top: 96, fontFamily: MONO, fontSize: 22, letterSpacing: 6, color: red ? RED : ORANGE }}>ARQUIVO DE MEMÓRIA · ALYX VANCE</div>
      <div style={{ position: "absolute", right: 110, top: 96, fontFamily: MONO, fontSize: 22, letterSpacing: 6, color: red ? RED : cont > 100 ? VIO : f >= voidAt ? RED : "rgba(242,240,247,0.6)" }}>
        {red ? `CONTINUIDADE · CONTAMINADA · ${cont}%` : f >= leakAt ? `CONTINUIDADE · ${cont}%` : f >= voidAt ? "CONTINUIDADE · INTERROMPIDA" : "CONTINUIDADE · 100%"}
      </div>
      {/* índice */}
      <div style={{ position: "absolute", left: 110, top: VY, width: 540 }}>
        {shownRows.map((r, i) => {
          const isCur = r === cur;
          const col = r.kind === "void" ? RED : r.kind === "snow" ? ICE : r.kind === "rit" ? GREEN : r.kind === "inj" || r.kind === "spam" ? (red ? RED : VIO) : "rgba(242,240,247,0.45)";
          const vglitch = r.kind === "void" && glitchVoid ? Math.floor(f / 3) % 3 === 0 : false;
          return (
            <div key={r.n + r.t + r.at} style={{ display: "flex", alignItems: "center", gap: 20, height: 58, borderLeft: `3px solid ${isCur ? col : r.kind === "old" ? "rgba(242,240,247,0.12)" : col}`, paddingLeft: 18, background: isCur ? `linear-gradient(90deg, ${r.kind === "inj" || r.kind === "spam" ? "rgba(199,155,255,0.18)" : r.kind === "void" ? "rgba(255,93,77,0.16)" : "rgba(159,230,255,0.14)"}, rgba(0,0,0,0))` : "none", opacity: r.kind === "spam" ? 0.85 : 1, transform: vglitch ? `translateX(${(rnd(f) - 0.5) * 14}px)` : undefined }}>
              <span style={{ fontFamily: MONO, fontSize: 20, color: col, width: 34 }}>{r.n}</span>
              <span style={{ fontFamily: r.kind === "old" ? FONT : MONO, fontWeight: r.kind === "old" ? 800 : 400, fontSize: r.kind === "old" ? 30 : 22, letterSpacing: r.kind === "old" ? -1 : 4, color: vglitch ? GREEN : col }}>{r.kind === "old" ? r.t : decode(r.t, f, r.at, 3)}</span>
            </div>
          );
        })}
      </div>
      {/* a tela */}
      <div style={{ position: "absolute", left: VX, top: VY, width: VW, height: VH, borderRadius: 18, overflow: "hidden", border: `1px solid ${red ? "rgba(255,93,77,0.6)" : view === "void" ? "rgba(255,93,77,0.5)" : view === "ritual" ? "rgba(141,255,168,0.5)" : view === "neve" ? "rgba(159,230,255,0.4)" : "rgba(242,240,247,0.22)"}`, background: "#000" }}>
        <div style={{ position: "absolute", inset: 0, transform: pull ? `translateX(${(rnd(f) - 0.5) * 30 * pull}px)` : undefined, filter: `brightness(${1 + pull * 0.6})` }}>
          {view === "gman" ? (
            <Sequence from={Math.round(gmanAt)} layout="none">
              <Clip src="videos/hl3_M01_1A2/clips/alyx_gman.mp4" from={0.6} rate={0.6} style={{ objectPosition: "78% 40%", filter: "brightness(1.5)" }} />
            </Sequence>
          ) : null}
          {view === "void" ? <AbsoluteFill style={{ backgroundImage: `url(${staticFile("videos/hl3_M01_R/grao.png")})`, backgroundSize: "256px 256px", backgroundPosition: `${(f * 211) % 256}px ${(f * 97) % 256}px`, filter: "contrast(2.2) brightness(0.6)" }} /> : null}
          {view === "void" ? (
            <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
              <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 110, letterSpacing: -4, color: TXT, textShadow: "0 6px 30px #000" }}>72 H</div>
              <div style={{ fontFamily: MONO, fontSize: 22, letterSpacing: 8, color: RED, marginTop: 6, textShadow: "0 2px 8px #000" }}>SEM REGISTRO</div>
            </AbsoluteFill>
          ) : null}
          {view === "neve" ? (
            <Sequence from={Math.round(snowAt)} layout="none">
              <Clip src={CL + "lore_neve.mp4"} from={0} rate={0.7} />
            </Sequence>
          ) : null}
          {view === "ritual" ? (
            <Sequence from={Math.round(ritualAt)} layout="none">
              <Clip src="videos/hl3_M01_3C/clips/ep2_vort_luz.mp4" from={0.5} rate={0.8} style={{ filter: "saturate(1.3)" }} />
            </Sequence>
          ) : null}
          {view === "montagem" ? (
            <Sequence from={Math.round(oppAt)} layout="none">
              <Clip src={CL + "montagem_lembrancas.mp4"} from={0} style={{ filter: red ? "saturate(0.6) sepia(0.4) hue-rotate(-30deg)" : "saturate(0.85)" }} />
            </Sequence>
          ) : null}
          {view === "lugar" || view === "pessoa" || view === "futuro" ? (
            <AbsoluteFill style={{ opacity: 0.9, filter: "saturate(0.85)" }}>
              <Sequence from={Math.round(cutAt)} layout="none">
                <Clip src={CL + (view === "lugar" ? "frag_lugar.mp4" : view === "pessoa" ? "frag_pessoa.mp4" : "frag_futuro.mp4")} from={0} />
              </Sequence>
            </AbsoluteFill>
          ) : null}
          {/* no "contrário": a tela pisca entre as injeções */}
          {f >= contAt ? (
            <AbsoluteFill style={{ opacity: 0.5 + 0.3 * Math.sin(f / 2), background: red ? "rgba(255,31,90,0.18)" : "rgba(199,155,255,0.14)", mixBlendMode: "screen" }} />
          ) : null}
        </div>
        {view !== "void" ? <div style={{ position: "absolute", left: 22, bottom: 18, fontFamily: MONO, fontSize: 18, letterSpacing: 4, color: TXT, textShadow: "0 2px 8px #000" }}>{view === "gman" ? "MEM 08 · O ENCONTRO" : view === "neve" ? "MEM 10 · A NEVE" : view === "ritual" ? "MEM 11 · RITUAL VORTIGAUNT" : view === "montagem" ? "MEM ?? · ?? · ?? · ??" : "MEM ?? · ORIGEM DESCONHECIDA"}</div> : null}
      </div>
      {/* régua de continuidade (passa do fim quando lembra demais) */}
      <div style={{ position: "absolute", left: VX, top: VY + VH + 34, width: VW, height: 2, background: "rgba(242,240,247,0.15)" }}>
        <div style={{ position: "absolute", left: 0, top: 0, height: 2, width: `${f >= oppAt ? 50 + 48 * Math.sin((f - oppAt) / (3.2 - Math.min(2.2, (f - oppAt) / 90))) : Math.min(100, cont)}%`, background: red ? RED : cont > 100 ? VIO : f >= voidAt ? RED : ORANGE, boxShadow: `0 0 12px ${red ? RED : cont > 100 ? VIO : ORANGE}` }} />
        {f >= oppAt ? <div style={{ position: "absolute", left: `${50 + 48 * Math.sin((f - oppAt) / (3.2 - Math.min(2.2, (f - oppAt) / 90)))}%`, top: -8, width: 3, height: 18, background: TXT, boxShadow: `0 0 10px ${TXT}` }} /> : null}
        {cont > 100 && f < oppAt ? <div style={{ position: "absolute", left: "100%", top: -2, height: 6, width: Math.min(160, (cont - 100) * 2.2), background: red ? RED : VIO, boxShadow: `0 0 14px ${red ? RED : VIO}` }} /> : null}
      </div>
      <FilmLook />
    </AbsoluteFill>
  );
};

// =================================================================================================
// 4C · AS PERGUNTAS EM PARALLAX (06/10/2026). Um travelling contínuo por camadas de silhueta (referência: a bike):
//  1) noite ártica, montanhas em 4 planos, neve, postes da estrada com as horas (00H … 72H): ONDE ELA ESTEVE?
//  2) o céu vira violeta; placas de vidro entram de fora do quadro, cada uma uma paisagem que não é dela:
//     DE ONDE VIERAM ESSAS MEMÓRIAS?
//  3) a câmera vira para dentro: corredor de pilares, uma porta de luz no fundo com o G-Man (imagem real)
//  4) a porta apaga: moldura vazia (A RESPOSTA); o ponto laranja (a Alyx) pisca e apaga: NEM A ALYX SABE
//  5) o Borealis (HLQuestionShift, aprovado) entra por baixo
// Sem personagem desenhado; um vídeo só (a porta).
// =================================================================================================
type QPP = { life: number; q1At?: number; s2At?: number; q2At?: number; s3At?: number; q3At?: number; gmanAt?: number; afterAt?: number; noAt?: number; alyxAt?: number; borAt?: number; goAt?: number };
const HZ = 640; // linha do horizonte
const hexRgb = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
const lerpRgb = (A: number[], B: number[], t: number) => A.map((v, i) => v + (B[i] - v) * Math.max(0, Math.min(1, t)));
const rgb = (v: number[]) => `rgb(${v.map((x) => Math.round(x)).join(",")})`;
const mix = (a: string, b: string, t: number) => rgb(lerpRgb(hexRgb(a), hexRgb(b), t));
const mix3 = (a: string, b: string, c: string, t2: number, t3: number) => rgb(lerpRgb(lerpRgb(hexRgb(a), hexRgb(b), t2), hexRgb(c), t3));
const ridgePath = (seed: number, width: number, base: number, amp: number, sharp: number) => {
  let d = `M -20 1100 L -20 ${base} `;
  for (let x = -20; x <= width; x += 14) {
    const peaks = Math.pow(Math.abs(Math.sin(x / (520 + seed * 40) + seed)), sharp);
    const y = base - amp * (0.62 * peaks + 0.125 * Math.sin(x / 190 + seed * 2.3) + 0.065 * Math.sin(x / 57 + seed * 4.1));
    d += `L ${x} ${y.toFixed(1)} `;
  }
  return d + `L ${width} 1100 Z`;
};
// paletas: [céu topo, céu horizonte, camada 0 (longe) … camada 3 (perto), luz de borda]
const PAL1 = ["#050f18", "#1c3a4a", "#1a3443", "#132935", "#0d1e28", "#071219", "#9fe6ff"];
const PAL2 = ["#0b0616", "#3a1f5c", "#2c1b47", "#21143b", "#170e2c", "#0c0818", "#c79bff"];
const PAL3 = ["#020203", "#08090c", "#0a0b0e", "#08090b", "#060708", "#040405", "#f2f0f7"];
const LAYERS = [
  { k: 0.12, base: 600, amp: 150, sharp: 2.2, seed: 1.3 },
  { k: 0.3, base: 660, amp: 130, sharp: 1.6, seed: 2.9 },
  { k: 0.6, base: 730, amp: 110, sharp: 1.3, seed: 4.4 },
  { k: 1.0, base: 830, amp: 70, sharp: 1.1, seed: 6.1 },
];

// três paisagens que não são dela
const Pane: React.FC<{ kind: number; w: number; h: number; f: number }> = ({ kind, w, h, f }) => {
  if (kind === 0)
    return (
      <svg width={w} height={h} style={{ display: "block" }}>
        <defs>
          <linearGradient id="pz0" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2b1206" />
            <stop offset="1" stopColor="#d0702a" />
          </linearGradient>
        </defs>
        <rect width={w} height={h} fill="url(#pz0)" />
        <circle cx={w * 0.72} cy={h * 0.62} r={h * 0.16} fill="#ffd49a" opacity={0.85} />
        {Array.from({ length: 14 }).map((_, i) => {
          const bw = w / 14;
          const bh = h * (0.25 + rnd(i * 3.1) * 0.45);
          return (
            <g key={i}>
              <rect x={i * bw} y={h - bh} width={bw - 3} height={bh} fill="#1a0b05" />
              {Array.from({ length: 4 }).map((__, j) => (rnd(i * 7 + j) > 0.55 ? <rect key={j} x={i * bw + 6} y={h - bh + 12 + j * 18} width={4} height={6} fill="#ffcf7a" opacity={0.5 + 0.5 * Math.sin(f / 9 + i + j)} /> : null))}
            </g>
          );
        })}
      </svg>
    );
  if (kind === 1)
    return (
      <svg width={w} height={h} style={{ display: "block" }}>
        <rect width={w} height={h} fill="#0a1424" />
        <rect x={w * 0.2} y={h * 0.18} width={w * 0.6} height={h * 0.82} fill="#060b14" />
        {Array.from({ length: 12 }).map((_, i) => (
          <rect key={i} x={w * 0.24 + (i % 4) * w * 0.14} y={h * 0.26 + Math.floor(i / 4) * h * 0.2} width={w * 0.08} height={h * 0.1} fill={i === 6 ? "#ffe2a8" : "#0d1626"} />
        ))}
        <rect x={w * 0.24 + 2 * w * 0.14 - 4} y={h * 0.46 - 4} width={w * 0.08 + 8} height={h * 0.1 + 8} fill="#ffe2a8" opacity={0.25 + 0.2 * Math.sin(f / 7)} />
      </svg>
    );
  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      <defs>
        <linearGradient id="pz2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#03161a" />
          <stop offset="1" stopColor="#1f5d5a" />
        </linearGradient>
      </defs>
      <rect width={w} height={h} fill="url(#pz2)" />
      <rect y={h * 0.74} width={w} height={h * 0.26} fill="#c9e7e6" opacity={0.25} />
      {/* um navio parado no gelo */}
      <path d={`M ${w * 0.2} ${h * 0.74} L ${w * 0.26} ${h * 0.6} L ${w * 0.74} ${h * 0.6} L ${w * 0.8} ${h * 0.74} Z M ${w * 0.42} ${h * 0.6} L ${w * 0.44} ${h * 0.46} L ${w * 0.56} ${h * 0.46} L ${w * 0.58} ${h * 0.6} Z`} fill="#051012" />
      <line x1={w * 0.5} x2={w * 0.5} y1={h * 0.46} y2={h * 0.3} stroke="#051012" strokeWidth={3} />
      {/* a rachadura de luz */}
      <path d={`M ${w * 0.62} 0 L ${w * 0.6} ${h * 0.25} L ${w * 0.65} ${h * 0.42} L ${w * 0.61} ${h * 0.7}`} stroke="#bff6ff" strokeWidth={2 + Math.sin(f / 4)} fill="none" opacity={0.85} />
    </svg>
  );
};

export const HLRQuestionsParallax: React.FC<QPP> = (p) => {
  const f = useCurrentFrame();
  const a = (v?: number) => v ?? 1e9;
  const [q1At, s2At, q2At, s3At, q3At, gmanAt, afterAt, noAt, alyxAt, borAt, goAt] = [p.q1At ?? 0, p.s2At, p.q2At, p.s3At, p.q3At, p.gmanAt, p.afterAt, p.noAt, p.alyxAt, p.borAt, p.goAt].map(a);
  const life = p.life;
  const seeds = useMemo(() => Array.from({ length: 150 }).map((_, i) => ({ x: rnd(i * 1.7) * 1920, y: rnd(i * 2.3) * 1080, k: 0.2 + rnd(i * 3.7) * 1.1, v: 0.6 + rnd(i * 5.1) * 1.4, r: 0.8 + rnd(i * 6.3) * 2.2 })), []);
  const paths = useMemo(() => LAYERS.map((L) => ridgePath(L.seed, 1920 + 4200 * L.k + 200, L.base, L.amp, L.sharp)), []);
  // câmera lateral (px na camada k=1) e a ida para dentro
  const t2 = IO((f - s2At) / 26);
  const t3 = IO((f - s3At) / 34);
  const X = 2.4 * Math.min(f, s3At + 60) + 1500 * t2;
  const dz = interpolate(f, [s3At, s3At + 50, noAt, life], [0, 1.0, 1.76, 1.86], { ...C, easing: Easing.inOut(Easing.cubic) });
  const bor = P(f, borAt, 20);
  const col = (i: number) => mix3(PAL1[i], PAL2[i], PAL3[i], t2, t3);
  const sky0 = col(0);
  const sky1 = col(1);
  const rim = mix3(PAL1[6], PAL2[6], PAL3[6], t2, t3);
  // perspectiva do corredor
  const proj = (z: number) => 800 / Math.max(60, z);
  const doorZ = 2600 - dz * 1200;
  const ds = proj(doorZ);
  const DW = 520 * ds;
  const DH = 300 * ds;
  const doorX = 960 - DW / 2;
  const doorY = HZ - 40 - DH / 2;
  const empty = f >= noAt;
  const cutFlash = f >= noAt && f < noAt + 5 ? 1 - (f - noAt) / 5 : 0;
  const alyx = f >= alyxAt ? Math.max(0, 1 - Math.max(0, f - alyxAt - 26) / 18) * (f - alyxAt > 20 && Math.floor(f / 2) % 3 === 0 ? 0.3 : 1) : 0;
  // textos
  const qStyle: React.CSSProperties = { position: "absolute", left: 0, right: 0, textAlign: "center", fontFamily: FONT, fontWeight: 800, letterSpacing: -2, color: TXT, textShadow: "0 8px 40px rgba(0,0,0,0.6)" };
  const q1x = -(X - 2.4 * Math.min(f, s2At)) * 0.5;
  const q2x = (1 - P(f, q2At, 18)) * 260;
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      {f < borAt + 22 ? (
        <AbsoluteFill style={{ opacity: 1 - bor }}>
          {/* céu */}
          <AbsoluteFill style={{ background: `linear-gradient(180deg, ${sky0} 0%, ${sky1} ${(HZ / 10.8).toFixed(1)}%, ${sky1} 100%)` }} />
          {/* lua */}
          <div style={{ position: "absolute", left: 1460 - X * 0.03, top: 170, width: 120, height: 120, borderRadius: "50%", background: mix("#e6f7ff", "#f3e6ff", t2), boxShadow: `0 0 80px 30px ${t2 > 0.5 ? "rgba(199,155,255,0.33)" : "rgba(159,230,255,0.33)"}`, opacity: 0.9 * (1 - t3) }} />
          {/* montanhas: cada camada anda numa velocidade e cresce na ida para dentro */}
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: 1 - t3 * 0.92 }}>
            {LAYERS.map((L, i) => {
              const sc = 1 + dz * L.k * 1.4;
              return (
                <g key={i} transform={`translate(960 ${HZ}) scale(${sc}) translate(-960 ${-HZ}) translate(${-X * L.k} 0)`}>
                  <path d={paths[i]} fill={col(2 + i)} stroke={rim} strokeOpacity={0.12 + i * 0.05} strokeWidth={1.5} />
                </g>
              );
            })}
            {/* chão de neve com as faixas da estrada */}
            <rect x={0} y={900} width={1920} height={180} fill={col(5)} />
            {Array.from({ length: 12 }).map((_, i) => {
              const x = ((((i * 260 - X * 1.25) % 3120) + 3120) % 3120) - 300;
              return <rect key={i} x={x} y={985} width={120} height={5} fill={rim} opacity={0.35} />;
            })}
            {/* fios e postes com as horas */}
            {Array.from({ length: 6 }).map((_, i) => {
              const x0 = 820 + i * 430 - X * 0.9;
              return <path key={i} d={`M ${x0 + 46} 590 Q ${x0 + 215} 630 ${x0 + 384} 590`} stroke="#03080b" strokeWidth={2} fill="none" opacity={1 - t3} />;
            })}
            {["00H", "12H", "24H", "36H", "48H", "60H", "72H"].map((h, i) => {
              const x = 820 + i * 430 - X * 0.9;
              if (x < -200 || x > 2100) return null;
              const hot = h === "72H";
              return (
                <g key={h} opacity={1 - t3}>
                  <line x1={x} x2={x} y1={560} y2={930} stroke="#03080b" strokeWidth={9} />
                  <line x1={x - 46} x2={x + 46} y1={590} y2={590} stroke="#03080b" strokeWidth={6} />
                  <rect x={x - 54} y={622} width={108} height={46} rx={8} fill={hot ? RED : "#0b1a22"} stroke={rim} strokeOpacity={0.5} />
                  <text x={x} y={654} textAnchor="middle" fontFamily={MONO} fontSize={24} letterSpacing={3} fill={hot ? "#140403" : TXT}>
                    {h}
                  </text>
                </g>
              );
            })}
          </svg>
          {/* placas de vidro: paisagens que não são dela, entrando de fora do quadro */}
          {[0, 1, 2].map((i) => {
            const at = q2At + i * 12;
            if (f < at - 2) return null;
            const e = IO((f - at) / 22);
            const k = [0.55, 0.8, 1.05][i];
            const w = [400, 470, 430][i];
            const h = [250, 290, 270][i];
            const tx = [330, 760, 1250][i];
            const ty = [420, 360, 450][i];
            const drift = -(f - at) * 2.4 * k * 0.25;
            const sc = 1 + dz * k * 1.6;
            const x = tx + (1 - e) * (1100 + i * 120) + drift;
            const lab = ["UM LUGAR QUE ELA NUNCA VIU", "ALGUÉM QUE ELA NÃO CONHECE", "ALGO QUE AINDA NÃO ACONTECEU"][i];
            return (
              <div key={i} style={{ position: "absolute", left: x, top: ty, width: w, transform: `translate(${(x + w / 2 - 960) * (sc - 1)}px, ${(ty + h / 2 - HZ) * (sc - 1)}px) scale(${sc}) perspective(1200px) rotateY(${(1 - e) * -28}deg)`, opacity: e * (1 - t3) }}>
                <div style={{ position: "relative", width: w, height: h, borderRadius: 14, overflow: "hidden", border: "1px solid rgba(255,255,255,0.35)", boxShadow: "0 20px 60px rgba(0,0,0,0.55), 0 0 40px rgba(199,155,255,0.27)" }}>
                  <Pane kind={i} w={w} h={h} f={f} />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0) 42%)" }} />
                </div>
                <div style={{ marginTop: 12, fontFamily: MONO, fontSize: 17, letterSpacing: 3, color: TXT, opacity: 0.85 }}>{lab}</div>
              </div>
            );
          })}
          {/* 09/10 (pedido dele): sem os rastros pontilhados roxos até as placas */}
          {/* o corredor */}
          {t3 > 0 ? (
            <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: t3 }}>
              <defs>
                <radialGradient id="qpGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0" stopColor={empty ? "#9fe6ff" : "#dfe9f2"} stopOpacity={empty ? 0.18 : 0.45} />
                  <stop offset="1" stopColor="#000" stopOpacity={0} />
                </radialGradient>
              </defs>
              <ellipse cx={960} cy={doorY + DH / 2} rx={DW * 1.6} ry={DH * 1.5} fill="url(#qpGlow)" />
              {/* chão refletindo a porta */}
              <path d={`M ${doorX} ${doorY + DH} L ${doorX + DW} ${doorY + DH} L 1920 1080 L 0 1080 Z`} fill={empty ? "rgba(159,230,255,0.03)" : "rgba(223,233,242,0.07)"} />
              {Array.from({ length: 8 }).map((_, j) => {
                const z = 300 + j * 340 - dz * 1200;
                if (z < 70 || z > doorZ) return null;
                const s = proj(z);
                return [-1, 1].map((sd) => {
                  const cx = 960 + sd * 760 * s;
                  const w = 150 * s;
                  return <rect key={`${j}${sd}`} x={cx - w / 2} y={HZ - 40 - 560 * s} width={w} height={900 * s} fill="#07080a" stroke="rgba(242,240,247,0.08)" strokeWidth={1} />;
                });
              })}
            </svg>
          ) : null}
          {/* a porta: o G-Man (imagem real) → moldura vazia */}
          {t3 > 0 ? (
            <div style={{ position: "absolute", left: doorX, top: doorY, width: DW, height: DH, borderRadius: 6, overflow: "hidden", border: `${Math.max(1, ds * 1.5)}px solid ${empty ? "rgba(242,240,247,0.85)" : "rgba(242,240,247,0.5)"}`, background: "#000", opacity: t3, boxShadow: empty ? "0 0 60px rgba(159,230,255,0.25)" : "0 0 90px rgba(223,233,242,0.35)" }}>
              {!empty ? (
                <Sequence from={Math.round(s3At)} layout="none">
                  <Clip src={CL + "gman_parado.mp4"} from={0} style={{ filter: "brightness(1.25) contrast(1.05)" }} />
                </Sequence>
              ) : null}
              {empty ? <AbsoluteFill style={{ backgroundImage: `url(${staticFile("videos/hl3_M01_R/grao.png")})`, backgroundSize: "256px 256px", backgroundPosition: `${(f * 211) % 256}px ${(f * 97) % 256}px`, opacity: 0.12 }} /> : null}
              {cutFlash ? <AbsoluteFill style={{ background: "#fff", opacity: cutFlash * 0.8 }} /> : null}
            </div>
          ) : null}
          {/* "depois daquele encontro" sob a porta */}
          {f >= afterAt && !empty ? (
            <div style={{ position: "absolute", left: 0, right: 0, top: doorY + DH + 22, textAlign: "center", fontFamily: MONO, fontSize: 20, letterSpacing: 6, color: TXT, opacity: P(f, afterAt, 10) * 0.85 }}>{decode("DEPOIS DAQUELE ENCONTRO", f, afterAt, 2.6)}</div>
          ) : null}
          {/* neve / poeira, em profundidade */}
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            {seeds.map((s, i) => {
              const x = (((s.x - X * s.k * 0.6 - f * 0.4 * s.k) % 1920) + 1920) % 1920;
              const y = (((s.y + f * s.v * (1 - 0.6 * t2) * (1 - t3)) % 1080) + 1080) % 1080;
              const sc = 1 + dz * s.k * 0.8;
              const px = 960 + (x - 960) * sc;
              const py = HZ + (y - HZ) * sc;
              return <circle key={i} cx={px} cy={py} r={s.r * s.k * sc} fill={t2 > 0.5 && t3 < 0.5 ? "#e2cdff" : "#eaf8ff"} opacity={(0.25 + (0.5 * s.k) / 1.3) * (1 - t3 * 0.6)} />;
            })}
          </svg>
          {/* as perguntas */}
          {f >= q1At && f < s2At + 30 ? (
            <div style={{ ...qStyle, top: 150, transform: `translateX(${q1x}px)`, opacity: 1 - P(f, s2At, 20) }}>
              <div style={{ fontFamily: MONO, fontWeight: 400, fontSize: 22, letterSpacing: 8, color: ICE, marginBottom: 14, opacity: P(f, q1At, 10) }}>DURANTE ESSES TRÊS DIAS</div>
              <div style={{ fontSize: 112, lineHeight: 1 }}>{decode("ONDE ELA ESTEVE?", f, q1At, 1.6)}</div>
            </div>
          ) : null}
          {f >= q2At && f < s3At + 30 ? (
            <div style={{ ...qStyle, top: 130, transform: `translateX(${q2x}px)`, opacity: P(f, q2At, 14) * (1 - P(f, s3At, 20)) }}>
              <div style={{ fontFamily: MONO, fontWeight: 400, fontSize: 22, letterSpacing: 8, color: VIO, marginBottom: 14 }}>A PERGUNTA PASSA A SER</div>
              <div style={{ fontSize: 96, lineHeight: 1 }}>{decode("DE ONDE VIERAM ESSAS MEMÓRIAS?", f, q2At, 1.8)}</div>
            </div>
          ) : null}
          {f >= q3At ? (
            <div style={{ ...qStyle, top: 110, opacity: P(f, q3At, 14) * (empty ? 0.32 : 1), transform: `scale(${1 - 0.04 * P(f, noAt, 20)})` }}>
              <div style={{ fontSize: 96, lineHeight: 1 }}>
                O QUE O <span style={{ color: f >= gmanAt ? RED : TXT }}>G-MAN</span> FEZ COM ELA?
              </div>
            </div>
          ) : null}
          {/* a resposta */}
          {empty ? (
            <>
              <div style={{ position: "absolute", left: doorX, width: DW, top: doorY - 46, display: "flex", alignItems: "center", gap: 18, fontFamily: MONO, fontSize: 22, letterSpacing: 8, color: TXT, opacity: P(f, noAt, 10) }}>
                <div style={{ flex: 1, height: 1, background: "rgba(242,240,247,0.4)" }} />
                A RESPOSTA
                <div style={{ flex: 1, height: 1, background: "rgba(242,240,247,0.4)" }} />
              </div>
              {f >= alyxAt ? (
                <div style={{ position: "absolute", left: 0, right: 0, top: doorY + DH + 40, display: "flex", justifyContent: "center", alignItems: "center", gap: 26, opacity: P(f, alyxAt, 10) }}>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", background: ORANGE, boxShadow: `0 0 ${30 * alyx}px ${12 * alyx}px ${ORANGE}`, opacity: 0.15 + 0.85 * alyx }} />
                  <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 58, letterSpacing: -1, color: TXT }}>
                    NEM A <span style={{ color: ORANGE }}>ALYX</span> SABE
                  </div>
                </div>
              ) : null}
            </>
          ) : null}
          <FilmLook />
        </AbsoluteFill>
      ) : null}
      {/* o Borealis (aprovado) entra por baixo */}
      {f >= borAt ? (
        <AbsoluteFill style={{ opacity: bor }}>
          <HLQuestionShift life={life} bare q1At={1e9} q2At={1e9} q3At={2e9} noAt={1e9} alyxAt={1e9} borAt={borAt} goAt={goAt} />
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};
