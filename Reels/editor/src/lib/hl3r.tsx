// =================================================================================================
// HL3 · REFORMULAÇÃO (out/2026). Mesma identidade do vídeo (Geist 800 nos títulos, Geist Mono nos rótulos, laranja de
// destaque), com imagem real tratada e profundidade. Regras: elemento entra na palavra; corte seco e estático entre
// cenas; texto decodifica ao entrar; janelas com bordas arredondadas.
// Robustez da prévia: cada cena toca POUCOS vídeos ao mesmo tempo; montagens e ecos vêm assados em mp4 (bake_r4c.py),
// e nenhuma velocidade < 0,0625× (o Chrome recusa e a prévia inteira cai).
// =================================================================================================
import React from "react";
import { AbsoluteFill, Easing, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { FONT, MONO } from "./overlays";
import { C, Clip, HL, rnd } from "./hl3";

const RED = "#ff5d4d";
const ICE = "#9fe6ff";
const VIO = "#c79bff";
const ORANGE = HL.orange;
const TXT = HL.text;
const P = (f: number, at: number, d = 12) => interpolate(f, [at, at + d], [0, 1], { ...C, easing: Easing.out(Easing.cubic) });
const CLIPS = "videos/hl3_M01_R/clips/";

// ---------------------------------------------------------------------------------------------- base comum
// grão (textura pronta que só se desloca: leve na prévia) + vinheta
export const FilmLook: React.FC<{ grain?: number }> = ({ grain = 0.07 }) => {
  const f = useCurrentFrame();
  return (
    <>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.6) 100%)", pointerEvents: "none" }} />
      <AbsoluteFill style={{ opacity: grain * 1.6, mixBlendMode: "overlay", pointerEvents: "none", backgroundImage: `url(${staticFile("videos/hl3_M01_R/grao.png")})`, backgroundSize: "512px 512px", backgroundPosition: `${(f * 137) % 512}px ${(f * 71) % 512}px` }} />
    </>
  );
};

// texto que decodifica da esquerda para a direita (caracteres aleatórios até assentar)
const GLY = "█▓▒░#%&@01<>/";
export const decode = (text: string, f: number, at: number, cps = 2.2) => {
  const k = (f - at) * cps;
  if (k < 0) return "";
  let out = "";
  for (let i = 0; i < text.length; i++) {
    if (i < k - 4 || text[i] === " ") out += text[i];
    else if (i < k) out += GLY[Math.floor(rnd(i * 7.3 + Math.floor(f / 2)) * GLY.length)];
  }
  return out;
};

// título grande no estilo do vídeo (TitleBlock): linha laranja + letras subindo
const BigTitle: React.FC<{ text: string; at: number; size?: number; hi?: string[] }> = ({ text, at, size = 96, hi = [] }) => {
  const f = useCurrentFrame();
  const line = P(f, at + 4, 22);
  let idx = 0;
  return (
    <div style={{ position: "absolute", left: 110, right: 160, bottom: 140, color: TXT }}>
      <div style={{ height: 2, width: 120 * line, background: ORANGE, boxShadow: `0 0 16px ${ORANGE}`, marginBottom: 26 }} />
      <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: size, letterSpacing: -3, lineHeight: 1.0, textShadow: "0 10px 60px rgba(0,0,0,0.75)" }}>
        {text.split(" ").map((w, wi) => (
          <span key={wi} style={{ display: "inline-block", marginRight: size * 0.26, color: hi.includes(w) ? ORANGE : TXT }}>
            {w.split("").map((ch, ci) => {
              const p = P(f, at + idx++ * 0.9, 14);
              return (
                <span key={ci} style={{ display: "inline-block", opacity: p, transform: `translate3d(0, ${(1 - p) * 40}px, 0)`, filter: p < 1 ? `blur(${(1 - p) * 8}px)` : undefined }}>
                  {ch}
                </span>
              );
            })}
          </span>
        ))}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------------------------- 4C · 1) o arquivo da memória
// a pergunta (título grande); corte seco para o arquivo: índice numerado à esquerda (cada lembrança decodifica e acende
// na palavra) e a tela da memória à direita (uma fita só, assada no tempo da fala, com corte seco e um "puxão" de
// lembrança em cada troca); régua de continuidade embaixo; no fim, chiado → preto: A MEMÓRIA PARA AQUI.
export const HLRMemoryFile: React.FC<{ life: number; qAt?: number; fileAt?: number; stopAt?: number; labels?: string[]; m0At?: number; m1At?: number; m2At?: number; m3At?: number; m4At?: number; m5At?: number; m6At?: number; m7At?: number; m8At?: number }> = (p) => {
  const f = useCurrentFrame();
  const N = 1e9;
  const a = (v?: number) => v ?? N;
  const labels = p.labels ?? [];
  const ats = [p.m0At, p.m1At, p.m2At, p.m3At, p.m4At, p.m5At, p.m6At, p.m7At, p.m8At].map(a).slice(0, labels.length);
  const fileAt = a(p.fileAt);
  const stopAt = a(p.stopAt);
  const inFile = f >= fileAt;
  const stop = f >= stopAt;
  let cur = -1;
  ats.forEach((t, i) => {
    if (f >= t) cur = i;
  });
  const sinceCut = cur >= 0 ? f - ats[cur] : 99;
  const pull = sinceCut < 4 ? 1 - sinceCut / 4 : 0; // puxão de lembrança nos 4 primeiros quadros de cada memória
  const noise = stop && f < stopAt + 7;
  const VX = 680;
  const VY = 196;
  const VW = 1130;
  const VH = 636;
  return (
    <AbsoluteFill style={{ background: "#05070a", overflow: "hidden" }}>
      {!inFile ? <BigTitle text="ATÉ ONDE A MEMÓRIA FAZ PARTE DE QUEM A GENTE É?" at={a(p.qAt) + 2} hi={["MEMÓRIA", "QUEM"]} /> : null}
      {inFile ? (
        <>
          {/* cabeçalho */}
          <div style={{ position: "absolute", left: 110, top: 96, fontFamily: MONO, fontSize: 22, letterSpacing: 6, color: ORANGE }}>{decode("ARQUIVO DE MEMÓRIA · ALYX VANCE", f, fileAt, 3)}</div>
          <div style={{ position: "absolute", right: 110, top: 96, fontFamily: MONO, fontSize: 22, letterSpacing: 6, color: stop ? RED : "rgba(242,240,247,0.6)" }}>{stop ? "CONTINUIDADE · INTERROMPIDA" : `CONTINUIDADE · ${String(Math.min(100, Math.round(((cur + 1) / labels.length) * 100))).padStart(3, "0")}%`}</div>
          {/* índice */}
          <div style={{ position: "absolute", left: 110, top: VY, width: 520 }}>
            {labels.map((lab, i) => {
              if (f < ats[i]) return null;
              const on = i === cur && !stop;
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 20, height: 58, borderLeft: `3px solid ${on ? ORANGE : "rgba(242,240,247,0.12)"}`, paddingLeft: 18, background: on ? "linear-gradient(90deg, rgba(255,138,31,0.16), rgba(255,138,31,0))" : "none" }}>
                  <span style={{ fontFamily: MONO, fontSize: 20, color: on ? ORANGE : "rgba(242,240,247,0.35)", width: 34 }}>{String(i).padStart(2, "0")}</span>
                  <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 34, letterSpacing: -1, color: on ? TXT : "rgba(242,240,247,0.5)" }}>{decode(lab, f, ats[i], 2.5)}</span>
                </div>
              );
            })}
            {stop
              ? [0, 1, 2].map((k) => (
                  <div key={"x" + k} style={{ display: "flex", alignItems: "center", gap: 20, height: 58, borderLeft: `3px solid ${RED}`, paddingLeft: 18, opacity: P(f, stopAt + 4 + k * 4, 6) }}>
                    <span style={{ fontFamily: MONO, fontSize: 20, color: RED, width: 34 }}>{String(labels.length + k).padStart(2, "0")}</span>
                    <span style={{ fontFamily: MONO, fontSize: 22, letterSpacing: 6, color: RED }}>SEM REGISTRO</span>
                  </div>
                ))
              : null}
          </div>
          {/* a tela da memória */}
          <div style={{ position: "absolute", left: VX, top: VY, width: VW, height: VH, borderRadius: 18, overflow: "hidden", border: `1px solid ${stop ? "rgba(255,93,77,0.5)" : "rgba(242,240,247,0.22)"}`, background: "#000", boxShadow: "0 30px 90px rgba(0,0,0,0.6)" }}>
            {!stop ? (
              <Sequence from={Math.round(fileAt)} layout="none">
                <div style={{ position: "absolute", inset: 0, transform: pull ? `translateX(${(rnd(f) - 0.5) * 30 * pull}px)` : undefined, filter: `contrast(1.06) saturate(0.85) brightness(${1 + pull * 0.6})` }}>
                  <Clip src={CLIPS + "memoria_fita.mp4"} from={0} />
                </div>
              </Sequence>
            ) : null}
            {pull > 0 && !stop
              ? Array.from({ length: 6 }).map((_, k) => (
                  <div key={k} style={{ position: "absolute", left: 0, right: 0, top: `${rnd(k * 3 + Math.floor(f)) * 95}%`, height: 6 + rnd(k) * 18, background: "rgba(242,240,247,0.35)", mixBlendMode: "overlay", transform: `translateX(${(rnd(k * 5 + f) - 0.5) * 80}px)` }} />
                ))
              : null}
            {noise ? <AbsoluteFill style={{ backgroundImage: `url(${staticFile("videos/hl3_M01_R/grao.png")})`, backgroundSize: "256px 256px", backgroundPosition: `${(f * 211) % 256}px ${(f * 97) % 256}px`, filter: "contrast(2.2)" }} /> : null}
            {stop && !noise ? (
              <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
                <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 76, letterSpacing: -2, color: TXT, transform: `scale(${1.08 - 0.08 * P(f, stopAt + 7, 10)})` }}>A MEMÓRIA PARA AQUI</div>
              </AbsoluteFill>
            ) : null}
            {!stop && cur >= 0 ? <div style={{ position: "absolute", left: 22, bottom: 18, fontFamily: MONO, fontSize: 18, letterSpacing: 4, color: TXT, textShadow: "0 2px 8px #000" }}>{`MEM ${String(cur).padStart(2, "0")} · ${labels[cur]}`}</div> : null}
          </div>
          {/* régua de continuidade */}
          <div style={{ position: "absolute", left: VX, top: VY + VH + 34, width: VW, height: 2, background: "rgba(242,240,247,0.15)" }}>
            <div style={{ position: "absolute", left: 0, top: 0, height: 2, width: `${stop ? 100 : ((cur + 1) / labels.length) * 100}%`, background: stop ? RED : ORANGE, boxShadow: `0 0 12px ${stop ? RED : ORANGE}` }} />
            {labels.map((_, i) => (
              <div key={i} style={{ position: "absolute", left: `${((i + 1) / labels.length) * 100}%`, top: -6, width: 2, height: 14, background: i <= cur ? ORANGE : "rgba(242,240,247,0.25)" }} />
            ))}
          </div>
        </>
      ) : null}
      <FilmLook />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------- 4C · 2) três dias
// em cima, o mundo andando (imagem real acelerada, relógio 0 → 72 h, dia e noite); embaixo, a faixa da Alyx: o encontro
// com o G-Man, um vazio e a neve. O vazio racha e vaza luz; pelas rachaduras entram (com eco assado) lugares, pessoas e
// coisas que não são dela; contadores no fim.
type Frag = { k: string; src: string };
export const HLRThreeDays: React.FC<{ life: number; worldAt?: number; alyxAt?: number; nothingAt?: number; gmanAt?: number; snowAt?: number; leakAt?: number; placeAt?: number; personAt?: number; futureAt?: number; oppAt?: number; partAt?: number; frags?: Frag[] }> = (p) => {
  const f = useCurrentFrame();
  const N = 1e9;
  const a = (v?: number) => v ?? N;
  const fr = p.frags ?? [];
  const hours = Math.min(72, Math.max(0, ((f - a(p.worldAt)) / Math.max(1, a(p.snowAt) - a(p.worldAt))) * 72));
  const day = 0.5 + 0.5 * Math.cos((hours / 24) * Math.PI * 2);
  const leak = P(f, a(p.leakAt), 45);
  const opp = P(f, a(p.oppAt), 20);
  const fragAts = [a(p.placeAt), a(p.personAt), a(p.futureAt)];
  const notHers = f >= a(p.oppAt) ? Math.round(Math.min(48, (f - a(p.oppAt)) * 0.45)) : 0;
  const cracks = Array.from({ length: 9 }).map((_, i) => {
    const x0 = 260 + rnd(i * 3.3) * 1400;
    const y0 = 800 + rnd(i * 1.7) * 160;
    const pts = [[x0, y0]];
    for (let k = 1; k < 6; k++) pts.push([pts[k - 1][0] + (rnd(i * 10 + k) - 0.5) * 140, pts[k - 1][1] + (rnd(i * 20 + k) - 0.5) * 80]);
    return pts;
  });
  const fragBox = [
    { x: 250, y: 700, w: 440, h: 248, rot: -3 },
    { x: 740, y: 724, w: 440, h: 248, rot: 2 },
    { x: 1230, y: 696, w: 440, h: 248, rot: -2 },
  ];
  const boxes = leak < 0.95; // o encontro e a neve saem de cena quando o vazio racha (menos vídeo tocando junto)
  return (
    <AbsoluteFill style={{ background: "#05070a", overflow: "hidden" }}>
      {/* faixa de cima: o mundo */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 520, overflow: "hidden", opacity: 1 - opp * 0.55 }}>
        <Clip src="videos/hl3_M01_1C/clips/ep3_artico.mp4" from={0} rate={1.6} />
        <AbsoluteFill style={{ background: `rgba(10,20,40,${0.55 * (1 - day)})`, mixBlendMode: "multiply" }} />
        <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.6) 100%)" }} />
        <div style={{ position: "absolute", left: 110, top: 96, fontFamily: MONO, fontSize: 22, letterSpacing: 6, color: TXT }}>{decode("PARA TODO MUNDO", f, a(p.worldAt), 3)}</div>
        <div style={{ position: "absolute", right: 110, top: 70, fontFamily: FONT, fontWeight: 800, fontSize: 120, letterSpacing: -4, color: TXT, opacity: P(f, a(p.worldAt), 8), fontVariantNumeric: "tabular-nums" }}>
          {`${String(Math.floor(hours)).padStart(2, "0")}:${String(Math.floor((hours % 1) * 60)).padStart(2, "0")}`}
          <span style={{ fontFamily: MONO, fontWeight: 400, fontSize: 26, letterSpacing: 4, marginLeft: 14, color: ORANGE }}>{hours >= 72 ? "3 DIAS" : "H"}</span>
        </div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 520, height: 2, background: ORANGE, boxShadow: `0 0 18px ${ORANGE}`, opacity: 0.8 }} />
      {/* faixa de baixo: a Alyx */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 522, bottom: 0, overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 110, top: 34, fontFamily: MONO, fontSize: 22, letterSpacing: 6, color: ORANGE }}>{decode("PARA A ALYX", f, a(p.alyxAt), 3)}</div>
        <div style={{ position: "absolute", right: 110, top: 10, fontFamily: FONT, fontWeight: 800, fontSize: 120, letterSpacing: -4, color: f >= a(p.nothingAt) ? RED : TXT, opacity: f >= a(p.alyxAt) ? 1 : 0 }}>{f >= a(p.nothingAt) ? "NADA" : "00:00"}</div>
        {boxes && f >= a(p.gmanAt) ? (
          <div style={{ position: "absolute", left: 110, top: 160, width: 420, height: 236, borderRadius: 14, overflow: "hidden", border: "1px solid rgba(242,240,247,0.25)", opacity: 1 - 0.8 * leak }}>
            <Sequence from={Math.round(a(p.gmanAt))} layout="none">
              <Clip src={CLIPS + "gman_parado.mp4"} from={0} style={{ objectPosition: "82% 35%" }} />
            </Sequence>
            <div style={{ position: "absolute", left: 14, bottom: 10, fontFamily: MONO, fontSize: 15, letterSpacing: 4, color: TXT }}>O ENCONTRO</div>
          </div>
        ) : null}
        {boxes && f >= a(p.snowAt) ? (
          <div style={{ position: "absolute", right: 110, top: 160, width: 420, height: 236, borderRadius: 14, overflow: "hidden", border: "1px solid rgba(159,230,255,0.35)", opacity: 1 - 0.8 * leak }}>
            <Clip src="videos/hl3_M01_1C/clips/ep3_artico.mp4" from={8} rate={0.6} />
            <div style={{ position: "absolute", left: 14, bottom: 10, fontFamily: MONO, fontSize: 15, letterSpacing: 4, color: TXT }}>A NEVE</div>
          </div>
        ) : null}
        {f >= a(p.nothingAt) ? <div style={{ position: "absolute", left: 560, right: 560, top: 276, height: 2, background: `repeating-linear-gradient(90deg, ${RED} 0 14px, transparent 14px 26px)`, opacity: 1 - leak }} /> : null}
      </div>
      {/* as rachaduras e a luz vazando */}
      {leak > 0 ? (
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          <defs>
            <filter id="crackglow">
              <feGaussianBlur stdDeviation="6" />
            </filter>
          </defs>
          {cracks.map((pts, i) => {
            const grow = P(f, a(p.leakAt) + i * 4, 40);
            const m = Math.max(2, Math.ceil(pts.length * grow));
            const d = pts.slice(0, m).map((q) => q.join(",")).join(" ");
            return (
              <g key={i}>
                <polyline points={d} fill="none" stroke={i % 2 ? VIO : ICE} strokeWidth={10} filter="url(#crackglow)" opacity={0.5} />
                <polyline points={d} fill="none" stroke="#fff" strokeWidth={2} opacity={0.9} />
              </g>
            );
          })}
        </svg>
      ) : null}
      {/* fragmentos que não são dela (eco assado no mp4) */}
      {fr.map((g, i) =>
        f >= fragAts[i] ? (
          <div key={i} style={{ position: "absolute", left: fragBox[i].x, top: fragBox[i].y, width: fragBox[i].w, height: fragBox[i].h, transform: `rotate(${fragBox[i].rot}deg)`, borderRadius: 14, overflow: "hidden", border: `1px solid ${i === 1 ? VIO : ICE}`, boxShadow: `0 0 40px ${i === 1 ? VIO : ICE}` }}>
            <Sequence from={Math.round(fragAts[i])} layout="none">
              <Clip src={g.src} from={0} />
            </Sequence>
            <div style={{ position: "absolute", left: 14, bottom: 10, fontFamily: MONO, fontSize: 14, letterSpacing: 3, color: "#fff", textShadow: "0 2px 6px #000" }}>{decode(g.k, f, fragAts[i], 3)}</div>
          </div>
        ) : null,
      )}
      {/* contadores: o contrário de esquecer */}
      {opp > 0 ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 150, display: "flex", justifyContent: "center", gap: 160, opacity: opp }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 160, letterSpacing: -6, color: "rgba(242,240,247,0.5)" }}>0</div>
            <div style={{ fontFamily: MONO, fontSize: 20, letterSpacing: 5, color: "rgba(242,240,247,0.6)" }}>MEMÓRIAS ESQUECIDAS</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 160, letterSpacing: -6, color: VIO, textShadow: `0 0 30px ${VIO}` }}>{`+${notHers}`}</div>
            <div style={{ fontFamily: MONO, fontSize: 20, letterSpacing: 5, color: VIO }}>MEMÓRIAS QUE NÃO SÃO DELA</div>
          </div>
        </div>
      ) : null}
      <FilmLook />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------- 4C · 3) as perguntas
// fundo: o encontro com o G-Man (assado, quase parado), escuro e desfocado; cada pergunta empurra a anterior para cima
// (riscada); a do G-Man treme em laranja; "nem a Alyx"; BOREALIS entra com impacto e a cena corta seco.
export const HLRQuestions: React.FC<{ life: number; q1At?: number; q2At?: number; q3At?: number; noAt?: number; alyxAt?: number; borAt?: number }> = (p) => {
  const f = useCurrentFrame();
  const N = 1e9;
  const a = (v?: number) => v ?? N;
  const life = p.life;
  const qs = [
    { t: "ONDE ELA ESTEVE DURANTE ESSES TRÊS DIAS?", at: a(p.q1At), c: TXT },
    { t: "DE ONDE VIERAM ESSAS MEMÓRIAS?", at: a(p.q2At), c: TXT },
    { t: "O QUE O G-MAN FEZ COM ELA?", at: a(p.q3At), c: ORANGE },
  ];
  const cur = qs.filter((q) => f >= q.at).length - 1;
  const bor = f >= a(p.borAt);
  const glitch = cur === 2 && f < a(p.q3At) + 12 ? Math.sin(f * 3) * 8 : 0;
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      {!bor ? (
        <AbsoluteFill style={{ transform: `scale(${1.05 + (f / life) * 0.12})`, filter: "blur(7px) brightness(0.32)" }}>
          <Clip src={CLIPS + "gman_parado.mp4"} from={1} style={{ objectPosition: "70% 40%" }} />
        </AbsoluteFill>
      ) : null}
      {!bor ? (
        <AbsoluteFill>
          {qs.map((q, i) => {
            if (i > cur) return null;
            const back = cur - i;
            const enter = P(f, q.at, 14);
            return (
              <div key={i} style={{ position: "absolute", left: 140, right: 140, top: 430 - back * 140 + (1 - enter) * 60, textAlign: "center", fontFamily: back ? MONO : FONT, fontWeight: back ? 400 : 800, fontSize: back ? 30 : 92, lineHeight: 1.04, letterSpacing: back ? 4 : -3, color: q.c, opacity: (back ? 0.4 / back : 1) * enter, textDecoration: back ? "line-through" : "none", transform: back === 0 && i === 2 ? `translateX(${glitch}px)` : undefined, textShadow: back === 0 && i === 2 ? `${glitch}px 0 rgba(159,230,255,0.6), ${-glitch}px 0 rgba(255,93,77,0.7)` : "0 6px 30px #000" }}>
                {q.t}
              </div>
            );
          })}
          {f >= a(p.noAt) ? <div style={{ position: "absolute", left: 0, right: 0, top: 620, textAlign: "center", fontFamily: MONO, fontSize: 28, letterSpacing: 8, color: "rgba(242,240,247,0.75)" }}>{decode(f >= a(p.alyxAt) ? "NINGUÉM SABE · NEM A ALYX" : "A RESPOSTA: —", f, f >= a(p.alyxAt) ? a(p.alyxAt) : a(p.noAt), 3)}</div> : null}
        </AbsoluteFill>
      ) : (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", background: "#05070a" }}>
          <div style={{ fontFamily: MONO, fontSize: 26, letterSpacing: 14, color: ORANGE, marginBottom: 6 }}>ANTES</div>
          <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 230, letterSpacing: -8, color: TXT, transform: `scale(${1.12 - 0.12 * P(f, a(p.borAt), 8)})`, textShadow: "0 10px 60px rgba(0,0,0,0.75)" }}>BOREALIS</div>
          <div style={{ height: 2, width: 120 * P(f, a(p.borAt) + 4, 18), background: ORANGE, boxShadow: `0 0 16px ${ORANGE}`, marginTop: 18 }} />
        </AbsoluteFill>
      )}
      <FilmLook />
    </AbsoluteFill>
  );
};
