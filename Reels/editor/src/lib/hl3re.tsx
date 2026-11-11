// =================================================================================================
// HL3 · REFORMULAÇÃO · 5D "a Aperture dentro do navio" (06/10/2026)
//  · HLRProtoAI: terminal CRT da Aperture dá boot → a lente da IA primitiva abre a íris → câmaras de teste em
//    isométrico, velhas e tortas, com o log de protocolos que não fazem mais sentido
//  · HLRCaveTapes: gravador de rolo (VU) + fichas → plantas/imagens/dados de arquitetura Combine carimbados 1979 →
//    linha do tempo: a informação volta da invasão para 1979 → "mandou copiar tudo" (a copiadora)
//  · HLRArchMatch: painel da Aperture × painel Combine; linhas de correspondência; COMPATÍVEL
//  · HLRFutureNotes: anotações à mão com datas futuras e a rota; a letra comparada com a da Alyx; ela percebe,
//    a Mossman também; a folha fecha
//  · HLRLapses: frase que trava no meio; portas: ela marca a que vai abrir antes; gráfico de lapsos acelerando
// =================================================================================================
import React, { useMemo } from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { loadFont as loadCaveat } from "@remotion/google-fonts/Caveat";
import { FONT, MONO } from "./overlays";
import { C, HL, rnd } from "./hl3";
import { FilmLook } from "./hl3r";

const { fontFamily: HAND } = loadCaveat();
const RED = "#ff5d4d";
const CREAM = "#ffe2b0";
const ICE = "#9fe6ff";
const GREEN = "#8dffa8";
const ORANGE = HL.orange;
const AMB = "#ffb22e";
const APT = "#f39a1c";
const CYAN = "#5ff3ff";
const TXT = HL.text;
const P = (f: number, at: number, d = 12) => interpolate(f, [at, at + d], [0, 1], { ...C, easing: Easing.out(Easing.cubic) });
const IO = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const fade = (f: number, life: number) => interpolate(f, [0, 6], [1, 0], C) + interpolate(f, [life - 6, life], [0, 1], C);
const typed = (s: string, f: number, at: number, cps = 1.4) => s.slice(0, Math.max(0, Math.floor((f - at) * cps)));

// ---------------------------------------------------------------- a IA primitiva
type AIP = { life: number; equipAt?: number; foundAt?: number; aiAt?: number; primAt?: number; gladosAt?: number; testsAt?: number; chambersAt?: number; protoAt?: number; brokenAt?: number };
const BOOT = ["APERTURE SCIENCE LABORATORIES", "SISTEMA EXPERIMENTAL · IA v0.3", "MEMÓRIA ........ 64 KB  OK", "SENSORES ....... PARCIAL", "CASCO .......... INCLINADO 14°", "INICIANDO PROTOCOLOS DE TESTE"];
export const HLRProtoAI: React.FC<AIP> = (p) => {
  const f = useCurrentFrame();
  const a = (v?: number) => v ?? 1e9;
  const [equipAt, foundAt, aiAt, primAt, gladosAt, testsAt, chambersAt, protoAt, brokenAt] = [p.equipAt, p.foundAt, p.aiAt, p.primAt, p.gladosAt, p.testsAt, p.chambersAt, p.protoAt, p.brokenAt].map(a);
  const life = p.life;
  const crt = P(f, 0, 14) * (1 - P(f, chambersAt - 10, 14));
  const boot = P(f, foundAt - 30, 12);
  const eye = P(f, aiAt, 30);
  const iris = IO((f - primAt) / 40);
  const ch = P(f, chambersAt - 10, 16);
  const LOG = [
    [chambersAt + 10, "CÂMARA 03 · TESTE INICIADO"],
    [chambersAt + 40, "CÂMARA 03 · ERRO: PISO FALTANDO"],
    [protoAt, "PROTOCOLO 7 · EXECUTANDO"],
    [protoAt + 30, "PROTOCOLO 7 · ERRO: GELO NA SAÍDA"],
    [brokenAt, "PROTOCOLO 9 · INDIVÍDUO NÃO REGISTRADO"],
    [brokenAt + 20, "CONTINUANDO MESMO ASSIM."],
  ] as const;
  return (
    <AbsoluteFill style={{ background: "#050403", overflow: "hidden" }}>
      {/* o terminal e a lente */}
      {crt > 0 ? (
        <AbsoluteFill style={{ opacity: crt }}>
          {/* corredor de equipamentos antigos (silhuetas de racks) */}
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: 0.62 + 0.38 * P(f, equipAt - 20, 20) }}>
            {Array.from({ length: 9 }).map((_, k) => (
              <g key={k}>
                <rect x={60 + k * 210} y={260 + (k % 2) * 30} width={150} height={520} fill="#120f0b" stroke="rgba(243,154,28,0.25)" />
                {Array.from({ length: 8 }).map((__, j) => (
                  <rect key={j} x={78 + k * 210} y={290 + j * 58 + (k % 2) * 30} width={14} height={8} fill={Math.floor(f / (5 + k) + j) % 4 ? "#3a2a12" : AMB} />
                ))}
              </g>
            ))}
          </svg>
          {/* o monitor */}
          <div style={{ position: "absolute", left: 160, top: 170, width: 760, height: 560, borderRadius: 40, background: "radial-gradient(ellipse at 50% 50%, #1b1406 0%, #0a0703 90%)", boxShadow: "inset 0 0 80px rgba(0,0,0,0.9), 0 0 0 18px #1c1812, 0 0 0 20px #2a241b", overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.25) 0 2px, rgba(0,0,0,0) 2px 4px)" }} />
            {/* 08/10 (pedido dele: nada de tela vazia esperando a fala): antes do boot a tela já está viva, em espera */}
            {boot < 1 ? (
              <div style={{ position: "absolute", left: 50, top: 50, fontFamily: MONO, fontSize: 24, lineHeight: 1.7, color: AMB, textShadow: "0 0 8px rgba(255,178,46,0.7)", opacity: P(f, 6, 8) * (1 - boot) * (0.75 + 0.25 * Math.sin(f / 9)) }}>
                <div>APERTURE SCIENCE · ENRICHMENT</div>
                <div style={{ opacity: 0.7 }}>MODO DE ESPERA</div>
                <div style={{ opacity: 0.7 }}>{`ÚLTIMO ACESSO: HÁ ${(9402 + Math.floor(f / 30)).toLocaleString("pt-BR")} DIAS`}</div>
                <div style={{ marginTop: 18, opacity: 0.55 }}>{"▮".repeat(1 + (Math.floor(f / 6) % 12))}</div>
              </div>
            ) : null}
            <div style={{ position: "absolute", left: 50, top: 50, fontFamily: MONO, fontSize: 24, lineHeight: 1.7, color: AMB, textShadow: "0 0 8px rgba(255,178,46,0.7)", opacity: boot }}>
              {BOOT.map((l, i) => (
                <div key={i}>{typed(l, f, foundAt + i * 14, 2.2)}</div>
              ))}
              {Math.floor(f / 15) % 2 ? <span>█</span> : null}
            </div>
          </div>
          {/* a lente (a IA): íris abrindo */}
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: eye }}>
            <g transform="translate(1390 450)">
              <circle r={230} fill="#16130f" stroke="#3c342a" strokeWidth={10} />
              <circle r={190} fill="#0b0907" stroke="#2a241c" strokeWidth={4} />
              {Array.from({ length: 8 }).map((_, k) => {
                const rot = (k / 8) * 360 + iris * 40;
                const open = 40 + iris * 90;
                return <path key={k} d={`M 0 ${-open} L 190 -60 L 190 60 Z`} fill="#221c15" stroke="#3a3127" strokeWidth={2} transform={`rotate(${rot}) translate(0 0)`} opacity={1 - iris * 0.6} />;
              })}
              <circle r={30 + 70 * iris} fill={`rgba(255,${190 + 30 * iris},60,${0.35 + 0.55 * iris})`} />
              <circle r={14 + 26 * iris} fill="#fff6c8" opacity={0.6 + 0.4 * Math.sin(f / 6)} />
              <circle r={(30 + 70 * iris) * 2} fill="none" stroke="rgba(255,220,90,0.25)" strokeWidth={2} />
            </g>
          </svg>
          {f >= aiAt ? (
            <div style={{ position: "absolute", left: 1150, top: 740, width: 520, textAlign: "center", opacity: P(f, aiAt, 10) }}>
              <div style={{ fontFamily: MONO, fontSize: 16, letterSpacing: 6, color: AMB }}>{f >= gladosAt ? "ANOS DEPOIS SERIA" : f >= primAt ? "VERSÃO EXTREMAMENTE PRIMITIVA" : "INTELIGÊNCIA ARTIFICIAL EXPERIMENTAL"}</div>
              {f >= gladosAt ? <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 96, color: TXT, lineHeight: 1, opacity: P(f, gladosAt, 8) }}>GLaDOS</div> : null}
            </div>
          ) : null}
          <div style={{ position: "absolute", left: 80, top: 60, fontFamily: MONO, letterSpacing: 6, opacity: P(f, 0, 10) }}>
            <div style={{ fontSize: 20, color: APT }}>EQUIPAMENTOS ANTIGOS DA APERTURE</div>
            <div style={{ fontSize: 15, color: "rgba(242,240,247,0.6)", marginTop: 6, opacity: P(f, foundAt - 30, 10) }}>NÃO DEVERIA ESTAR FUNCIONANDO</div>
          </div>
        </AbsoluteFill>
      ) : null}
      {/* câmaras de teste (isométrico) + log */}
      {ch > 0 ? (
        <AbsoluteFill style={{ opacity: ch }}>
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
            {[0, 1, 2].map((k) => {
              const ox = 400 + k * 560;
              const oy = 420 + (k % 2) * 50;
              const tilt = (k - 1) * 4 + 3;
              const S = 52;
              const iso = (x: number, y: number, z: number) => [ox + (x - y) * 0.866 * S, oy + (x + y) * 0.5 * S - z * S];
              const pt = (ps: number[][]) => ps.map((q) => iso(q[0], q[1], q[2]).join(",")).join(" ");
              const on = P(f, chambersAt + k * 10, 12);
              return (
                <g key={k} opacity={on} transform={`rotate(${tilt} ${ox} ${oy})`}>
                  <polygon points={pt([[0, 0, 0], [6, 0, 0], [6, 6, 0], [0, 6, 0]])} fill="#d9d6cf" stroke="#9a968c" />
                  <polygon points={pt([[0, 0, 0], [0, 6, 0], [0, 6, 4], [0, 0, 4]])} fill="#ecebe6" stroke="#9a968c" />
                  <polygon points={pt([[0, 0, 0], [6, 0, 0], [6, 0, 4], [0, 0, 4]])} fill="#e2e0da" stroke="#9a968c" />
                  {/* painéis */}
                  {Array.from({ length: 3 }).map((_, j) => (
                    <polyline key={j} points={pt([[j * 2, 0, 0], [j * 2, 0, 4]])} stroke="#b6b2a8" />
                  ))}
                  {/* botão e cubo */}
                  <ellipse cx={iso(4, 4, 0)[0]} cy={iso(4, 4, 0)[1]} rx={30} ry={15} fill="#b23a2a" />
                  <polygon points={pt([[1.4, 3.4, 0], [2.4, 3.4, 0], [2.4, 4.4, 0], [1.4, 4.4, 0]])} fill="#7a7468" />
                  <polygon points={pt([[1.4, 3.4, 1], [2.4, 3.4, 1], [2.4, 4.4, 1], [1.4, 4.4, 1]])} fill="#c9c4b8" stroke="#6a655b" />
                  {/* estrago: piso faltando / gelo */}
                  {k === 0 ? <polygon points={pt([[3.5, 0.5, 0], [5.5, 0.5, 0], [5.5, 2.5, 0], [3.5, 2.5, 0]])} fill="#050505" /> : null}
                  {k === 2 ? <polygon points={pt([[4.2, 0, 2.6], [6, 0, 2.6], [6, 0, 4], [4.2, 0, 4]])} fill="rgba(200,235,250,0.85)" /> : null}
                  <text x={iso(3, 0, 4.4)[0]} y={iso(3, 0, 4.4)[1]} textAnchor="middle" fill={APT} fontFamily={MONO} fontSize={18} letterSpacing={3}>{`CÂMARA 0${3 + k * 4}`}</text>
                </g>
              );
            })}
          </svg>
          <div style={{ position: "absolute", left: 140, bottom: 90, width: 900, padding: "16px 20px", background: "rgba(10,8,4,0.85)", border: "1px solid rgba(255,178,46,0.4)", borderRadius: 10, fontFamily: MONO, fontSize: 20, lineHeight: 1.6 }}>
            {LOG.filter(([t]) => f >= t).slice(-4).map(([t, l]) => (
              <div key={l} style={{ color: l.includes("ERRO") || l.includes("NÃO") ? RED : l.includes("MESMO ASSIM") ? CREAM : AMB, opacity: P(f, t, 6) }}>
                {typed(l, f, t, 2.4)}
              </div>
            ))}
          </div>
          <div style={{ position: "absolute", right: 90, top: 70, textAlign: "right", opacity: P(f, testsAt - 10, 10) }}>
            <div style={{ fontFamily: MONO, fontSize: 16, letterSpacing: 6, color: APT }}>ELA ACHA QUE OS TESTES CONTINUAM</div>
            <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 64, color: TXT, lineHeight: 1 }}>num navio quebrado</div>
          </div>
        </AbsoluteFill>
      ) : null}
      <AbsoluteFill style={{ background: "#000", opacity: fade(f, life), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- os arquivos do Cave
// arquitetura Combine (desenho técnico): torre angulosa, braço, anéis
const CombineDraft: React.FC<{ kind: number; w: number; h: number }> = ({ kind, w, h }) => {
  const s = "rgba(30,60,90,0.85)";
  if (kind === 0)
    return (
      <g stroke={s} fill="none" strokeWidth={1.6}>
        <path d={`M ${w * 0.5} ${h * 0.08} L ${w * 0.62} ${h * 0.9} L ${w * 0.38} ${h * 0.9} Z`} />
        <path d={`M ${w * 0.5} ${h * 0.08} L ${w * 0.56} ${h * 0.5} L ${w * 0.44} ${h * 0.5} Z`} />
        {Array.from({ length: 6 }).map((_, k) => (
          <line key={k} x1={w * (0.4 + k * 0.004)} x2={w * (0.6 - k * 0.004)} y1={h * (0.3 + k * 0.1)} y2={h * (0.3 + k * 0.1)} />
        ))}
        <line x1={w * 0.2} x2={w * 0.8} y1={h * 0.9} y2={h * 0.9} />
      </g>
    );
  if (kind === 1)
    return (
      <g stroke={s} fill="none" strokeWidth={1.6}>
        <path d={`M ${w * 0.2} ${h * 0.8} L ${w * 0.42} ${h * 0.35} L ${w * 0.64} ${h * 0.55} L ${w * 0.84} ${h * 0.2}`} />
        <circle cx={w * 0.42} cy={h * 0.35} r={10} />
        <circle cx={w * 0.64} cy={h * 0.55} r={10} />
        <path d={`M ${w * 0.84} ${h * 0.2} l 20 -10 m -20 10 l 18 14`} />
      </g>
    );
  return (
    <g stroke={s} fill="none" strokeWidth={1.6}>
      {[0, 1, 2].map((k) => (
        <ellipse key={k} cx={w * 0.5} cy={h * (0.3 + k * 0.2)} rx={w * (0.3 - k * 0.05)} ry={h * 0.06} />
      ))}
      <line x1={w * 0.5} x2={w * 0.5} y1={h * 0.15} y2={h * 0.85} strokeDasharray="4 4" />
    </g>
  );
};
type CVP = { life: number; filesAt?: number; tapesAt?: number; testsAt?: number; foundAt?: number; projAt?: number; imgAt?: number; dataAt?: number; combAt?: number; beforeAt?: number; notInvAt?: number; futureAt?: number; caveAt?: number; copyAt?: number };
export const HLRCaveTapes: React.FC<CVP> = (p) => {
  const f = useCurrentFrame();
  const a = (v?: number) => v ?? 1e9;
  const [filesAt, tapesAt, testsAt, foundAt, projAt, imgAt, dataAt, combAt, beforeAt, notInvAt, futureAt, caveAt, copyAt] = [p.filesAt, p.tapesAt, p.testsAt, p.foundAt, p.projAt, p.imgAt, p.dataAt, p.combAt, p.beforeAt, p.notInvAt, p.futureAt, p.caveAt, p.copyAt].map(a);
  const life = p.life;
  const tape = P(f, tapesAt - 20, 14) * (1 - P(f, projAt - 6, 12));
  const docs = P(f, projAt - 6, 12) * (1 - P(f, beforeAt - 10, 12));
  const tl = P(f, beforeAt - 10, 14) * (1 - P(f, caveAt - 24, 10));
  const copy = P(f, caveAt - 10, 12);
  const rot = f * 4;
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, #1a1610 0%, #070605 80%)", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 80, top: 60, fontFamily: MONO, letterSpacing: 6, opacity: P(f, 0, 10) }}>
        <div style={{ fontSize: 20, color: APT }}>ARQUIVOS DO SISTEMA</div>
        <div style={{ fontSize: 15, color: "rgba(242,240,247,0.6)", marginTop: 6, opacity: P(f, filesAt, 10) }}>COISAS MAIS INTERESSANTES</div>
      </div>
      {/* o gravador de rolo */}
      {tape > 0 ? (
        <AbsoluteFill style={{ opacity: tape }}>
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
            <rect x={460} y={220} width={1000} height={560} rx={24} fill="#1f1a13" stroke="#3a3124" strokeWidth={3} />
            {[720, 1200].map((cx, k) => (
              <g key={k} transform={`translate(${cx} 440) rotate(${rot * (k ? 1.2 : 1)})`}>
                <circle r={150} fill="#2a241b" stroke="#4a3f30" strokeWidth={4} />
                <circle r={95 - k * 20} fill="#4a3a22" />
                {[0, 1, 2].map((j) => (
                  <circle key={j} cx={Math.cos((j / 3) * Math.PI * 2) * 60} cy={Math.sin((j / 3) * Math.PI * 2) * 60} r={22} fill="#15110c" />
                ))}
                <circle r={16} fill="#8a7a5a" />
              </g>
            ))}
            <path d="M 720 590 L 960 640 L 1200 590" fill="none" stroke="#4a3a22" strokeWidth={6} />
            {/* VU */}
            {[0, 1].map((k) => {
              const v = 0.3 + 0.6 * Math.abs(Math.sin(f / (4 + k) + k)) * (rnd(Math.floor(f / 3) + k) * 0.5 + 0.5);
              return (
                <g key={"vu" + k} transform={`translate(${830 + k * 260} 700)`}>
                  <rect x={-100} y={-50} width={200} height={70} rx={8} fill="#e8dcc0" />
                  <line x1={0} y1={14} x2={Math.sin((v - 0.5) * 2.2) * 70} y2={14 - Math.cos((v - 0.5) * 2.2) * 60} stroke="#1a1612" strokeWidth={3} />
                </g>
              );
            })}
            <rect x={760} y={250} width={400} height={50} rx={6} fill="#e8dcc0" />
            <text x={960} y={284} textAnchor="middle" fill="#1a1612" fontFamily={HAND} fontSize={32}>
              CJ · teste Borealis #1 · 1979
            </text>
          </svg>
          {f >= tapesAt ? (
            <div style={{ position: "absolute", left: 0, right: 0, top: 820, textAlign: "center", fontFamily: MONO, fontSize: 22, letterSpacing: 6, color: CREAM, opacity: P(f, tapesAt, 10) }}>
              {f >= foundAt ? "INFORMAÇÕES QUE NÃO PODERIAM EXISTIR NAQUELA ÉPOCA" : f >= testsAt ? "OS PRIMEIROS TESTES COM O BOREALIS" : "GRAVAÇÕES DO CAVE JOHNSON"}
            </div>
          ) : null}
        </AbsoluteFill>
      ) : null}
      {/* projetos / imagens / dados */}
      {docs > 0 ? (
        <AbsoluteFill style={{ opacity: docs }}>
          {[
            ["PROJETO", projAt, 0],
            ["IMAGEM", imgAt, 1],
            ["DADOS", dataAt, 2],
          ].map(([l, at, k]) => {
            const t = P(f, at as number, 14);
            return (
              <div key={l as string} style={{ position: "absolute", left: 180 + (k as number) * 540, top: 220, width: 480, height: 560, background: "#e6dfcc", boxShadow: "0 20px 60px rgba(0,0,0,0.6)", transform: `translateY(${(1 - t) * 80}px) rotate(${((k as number) - 1) * 3}deg)`, opacity: t }}>
                <svg width={480} height={460} style={{ position: "absolute", left: 0, top: 20 }}>
                  <CombineDraft kind={k as number} w={480} h={460} />
                </svg>
                <div style={{ position: "absolute", left: 20, bottom: 18, fontFamily: MONO, fontSize: 16, letterSpacing: 4, color: "#3a3428" }}>{`${l} · ARQUIVO CJ`}</div>
                <div style={{ position: "absolute", right: 22, top: 20, padding: "4px 12px", border: "3px solid #b3261e", color: "#b3261e", fontFamily: MONO, fontSize: 22, transform: "rotate(-8deg)", opacity: P(f, (at as number) + 8, 6) }}>1979</div>
              </div>
            );
          })}
          {f >= combAt ? (
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 90, textAlign: "center", opacity: P(f, combAt, 10) }}>
              <div style={{ fontFamily: MONO, fontSize: 16, letterSpacing: 6, color: CYAN }}>QUALQUER JOGADOR RECONHECE</div>
              <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 80, color: TXT, lineHeight: 1 }}>tecnologia Combine</div>
            </div>
          ) : null}
        </AbsoluteFill>
      ) : null}
      {/* a linha do tempo: do futuro para o passado */}
      {tl > 0 ? (
        <AbsoluteFill style={{ opacity: tl }}>
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
            <line x1={200} x2={1720} y1={560} y2={560} stroke="rgba(242,240,247,0.4)" strokeWidth={3} />
            {[
              [360, "1979", "GRAVAÇÕES", APT],
              [1480, "INVASÃO", "OS COMBINE CHEGAM", CYAN],
            ].map(([x, y, s, c]) => (
              <g key={y as string}>
                <circle cx={x as number} cy={560} r={14} fill={c as string} />
                <text x={x as number} y={520} textAnchor="middle" fill={c as string} fontFamily={FONT} fontWeight={800} fontSize={54}>
                  {y}
                </text>
                <text x={x as number} y={612} textAnchor="middle" fill="rgba(242,240,247,0.7)" fontFamily={MONO} fontSize={16} letterSpacing={4}>
                  {s}
                </text>
              </g>
            ))}
            {f >= futureAt
              ? (() => {
                  const e = P(f, futureAt, 26);
                  const x = 1480 - (1480 - 360) * e;
                  return (
                    <g>
                      <path d={`M 1480 540 Q ${(1480 + x) / 2} ${400 - 60 * e} ${x} 540`} fill="none" stroke={RED} strokeWidth={4} />
                      <circle cx={x} cy={540} r={9} fill={RED} />
                      <text x={920} y={380} textAnchor="middle" fill={RED} fontFamily={MONO} fontSize={20} letterSpacing={5} opacity={e}>
                        O BOREALIS TROUXE DO FUTURO
                      </text>
                    </g>
                  );
                })()
              : null}
          </svg>
          {f >= notInvAt ? (
            <div style={{ position: "absolute", left: 0, right: 0, top: 700, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 60, color: TXT, opacity: P(f, notInvAt, 10) }}>a Aperture não inventou aquela arquitetura</div>
          ) : null}
        </AbsoluteFill>
      ) : null}
      {/* "mandou copiar tudo": a copiadora */}
      {copy > 0 ? (
        <AbsoluteFill style={{ opacity: copy }}>
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
            <rect x={760} y={520} width={400} height={240} rx={14} fill="#cfc8b6" stroke="#7a7262" strokeWidth={3} />
            <rect x={780} y={490} width={360} height={40} rx={6} fill="#b8b09c" />
            <rect x={790} y={600} width={340} height={8} fill="#1a1612" />
            {/* a luz da cópia correndo */}
            <rect x={790 + ((f * 9) % 340)} y={500} width={20} height={24} fill="#eaffb0" opacity={0.8} />
            {/* folhas saindo */}
            {Array.from({ length: 12 }).map((_, k) => {
              const t = ((f - caveAt) * 1.6 - k * 9) / 60;
              if (t < 0 || t > 1.6) return null;
              const x = 1160 + t * 520 + Math.sin(k) * 30;
              const y = 600 - Math.sin(Math.min(1, t) * Math.PI) * 220 + t * 160;
              return <rect key={k} x={x} y={y} width={120} height={160} fill="#efe9da" stroke="#b3ab97" transform={`rotate(${t * 140 + k * 13} ${x + 60} ${y + 80})`} opacity={Math.min(1, 1.6 - t)} />;
            })}
          </svg>
          <div style={{ position: "absolute", left: 0, right: 0, top: 160, textAlign: "center" }}>
            <div style={{ fontFamily: MONO, fontSize: 16, letterSpacing: 6, color: APT }}>O QUE O CAVE JOHNSON FARIA</div>
            {f >= copyAt ? <div style={{ fontFamily: HAND, fontSize: 130, color: TXT, lineHeight: 1, opacity: P(f, copyAt, 8), transform: `rotate(-3deg) scale(${1.2 - 0.2 * P(f, copyAt, 10)})` }}>“Copiem tudo.”</div> : null}
          </div>
        </AbsoluteFill>
      ) : null}
      <AbsoluteFill style={{ background: "#000", opacity: fade(f, life), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- arquitetura: Aperture × Combine
type AMP = { life: number; portalAt?: number; techAt?: number; alignAt?: number; whyAt?: number };
export const HLRArchMatch: React.FC<AMP> = (p) => {
  const f = useCurrentFrame();
  const a = (v?: number) => v ?? 1e9;
  const [portalAt, techAt, alignAt, whyAt] = [p.portalAt, p.techAt, p.alignAt, p.whyAt].map(a);
  const life = p.life;
  const L = P(f, 6, 16);
  const R = P(f, techAt - 10, 16);
  const match = P(f, alignAt, 30);
  const panelsA = (x0: number) =>
    Array.from({ length: 16 }).map((_, k) => <rect key={k} x={x0 + (k % 4) * 150} y={260 + Math.floor(k / 4) * 150} width={140} height={140} fill={k === 6 ? "#f2f0ea" : "#e4e1da"} stroke="#9a968c" strokeWidth={2} />);
  const panelsC = (x0: number) =>
    Array.from({ length: 16 }).map((_, k) => {
      const x = x0 + (k % 4) * 150;
      const y = 260 + Math.floor(k / 4) * 150;
      return <path key={k} d={`M ${x + 10} ${y} L ${x + 140} ${y} L ${x + 140} ${y + 130} L ${x + 130} ${y + 140} L ${x} ${y + 140} L ${x} ${y + 10} Z`} fill="#141a1f" stroke={CYAN} strokeWidth={1.5} opacity={0.9} />;
    });
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, #121417 0%, #050607 80%)", overflow: "hidden" }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <g opacity={L} transform={`translate(${(1 - L) * -80} 0)`}>{panelsA(120)}</g>
        <g opacity={R} transform={`translate(${(1 - R) * 80} 0)`}>{panelsC(1200)}</g>
        {/* linhas de correspondência */}
        {match > 0
          ? Array.from({ length: 5 }).map((_, k) => (
              <line key={k} x1={720} y1={260 + k * 150} x2={720 + 480 * match} y2={260 + k * 150} stroke={AMB} strokeWidth={2} strokeDasharray="8 6" />
            ))
          : null}
        {match > 0
          ? Array.from({ length: 5 }).map((_, k) => (
              <line key={"v" + k} x1={120 + k * 150} x2={120 + k * 150} y1={240} y2={240 - 14 * match} stroke={AMB} strokeWidth={2} />
            ))
          : null}
      </svg>
      <div style={{ position: "absolute", left: 120, top: 150, fontFamily: MONO, fontSize: 18, letterSpacing: 6, color: APT, opacity: L }}>APERTURE · PORTAL</div>
      <div style={{ position: "absolute", left: 1200, top: 150, fontFamily: MONO, fontSize: 18, letterSpacing: 6, color: CYAN, opacity: R }}>COMBINE</div>
      {match > 0 ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 880, textAlign: "center", opacity: match }}>
          <div style={{ fontFamily: MONO, fontSize: 18, letterSpacing: 6, color: AMB }}>{`MÓDULO · PROPORÇÃO · JUNTAS · ${Math.round(94 * match)}% IGUAL`}</div>
          {f >= whyAt - 20 ? <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 72, color: TXT, opacity: P(f, whyAt - 20, 10) }}>a resposta do porquê</div> : null}
        </div>
      ) : null}
      {void portalAt}
      <AbsoluteFill style={{ background: "#000", opacity: fade(f, life), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- anotações do futuro
type FNP = { life: number; strangeAt?: number; notYetAt?: number; calcAt?: number; datesAt?: number; routesAt?: number; letterAt?: number; alyxAt?: number; seesAt?: number; mossAt?: number; avoidAt?: number; walkAt?: number };
export const HLRFutureNotes: React.FC<FNP> = (p) => {
  const f = useCurrentFrame();
  const a = (v?: number) => v ?? 1e9;
  const [strangeAt, notYetAt, calcAt, datesAt, routesAt, letterAt, alyxAt, seesAt, mossAt, avoidAt, walkAt] = [p.strangeAt, p.notYetAt, p.calcAt, p.datesAt, p.routesAt, p.letterAt, p.alyxAt, p.seesAt, p.mossAt, p.avoidAt, p.walkAt].map(a);
  const life = p.life;
  const close = IO((f - avoidAt) / 22);
  const cmp = P(f, letterAt, 16) * (1 - close);
  const LINES = ["janela 3 → 41 min", "Δt (setor 7) = −20 a", "núcleo: convés 5, popa", "14/03/20?? — de novo", "não confiar no relógio"];
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 45% 45%, #1c170f 0%, #070605 80%)", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 80, top: 60, fontFamily: MONO, letterSpacing: 6, opacity: P(f, 0, 10) }}>
        <div style={{ fontSize: 20, color: CREAM }}>{f >= notYetAt ? "DE UM MOMENTO QUE AINDA NÃO ACONTECEU" : "TEM MAIS COISA ESTRANHA NO NAVIO"}</div>
      </div>
      {/* a folha */}
      <div style={{ position: "absolute", left: 220, top: 170, width: 860, height: 760, transformOrigin: "50% 100%", transform: `perspective(1600px) rotateX(${close * 80}deg) rotate(-2deg) translateY(${(1 - P(f, 6, 30)) * 60}px)`, opacity: P(f, 6, 20) * (1 - close * 0.8), background: "#ebe4d0", boxShadow: "0 30px 80px rgba(0,0,0,0.6)", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(70,110,160,0.18) 1px, transparent 1px)", backgroundSize: "100% 48px" }} />
        {/* 08/10 (pedido dele: papel no máximo 1,5 s em branco): rascunhos antigos a lápis já estão na folha */}
        <div style={{ position: "absolute", left: 470, top: 300, fontFamily: HAND, fontSize: 34, lineHeight: "48px", color: "rgba(60,60,70,0.35)", transform: "rotate(-3deg)" }}>
          <div>t₀ + 41 ≈ ?</div>
          <div style={{ textDecoration: "line-through" }}>setor 4 → 7</div>
          <div>3,2 s · 3,2 s · 3,1 s</div>
        </div>
        <div style={{ position: "absolute", left: 60, top: 40 }}>
          {LINES.map((l, i) => (
            <div key={i} style={{ fontFamily: HAND, fontSize: 48, lineHeight: "48px", color: "#1f2a44", opacity: P(f, calcAt + i * 8, 6) }}>
              {typed(l, f, calcAt + i * 8, 1.6)}
            </div>
          ))}
        </div>
        {/* a data futura em destaque */}
        {f >= datesAt ? <div style={{ position: "absolute", left: 50, top: 186, width: 420, height: 56, border: `4px solid ${RED}`, borderRadius: "50%", opacity: P(f, datesAt, 8) }} /> : null}
        {/* rota do navio rabiscada */}
        {f >= routesAt ? (
          <svg width={860} height={760} style={{ position: "absolute", inset: 0 }}>
            <path d="M 120 560 L 300 560 L 300 470 L 520 470 L 520 610 L 700 610" fill="none" stroke="#1f2a44" strokeWidth={4} strokeDasharray={`${1200 * P(f, routesAt, 30)} 1200`} strokeLinecap="round" />
            <circle cx={700} cy={610} r={18} fill="none" stroke={RED} strokeWidth={4} opacity={P(f, routesAt + 30, 8)} />
            <text x={560} y={680} fontFamily={HAND} fontSize={38} fill="#1f2a44" opacity={P(f, routesAt + 30, 8)}>
              aqui
            </text>
          </svg>
        ) : null}
      </div>
      {/* comparação da letra */}
      {cmp > 0 ? (
        <div style={{ position: "absolute", left: 1160, top: 230, width: 600, opacity: cmp }}>
          <div style={{ fontFamily: MONO, fontSize: 16, letterSpacing: 5, color: ORANGE }}>COMPARAÇÃO DA LETRA</div>
          {[
            ["ANOTAÇÃO", "núcleo"],
            ["ALYX (registro antigo)", "núcleo"],
          ].map(([l, w], k) => (
            <div key={k} style={{ marginTop: 18, padding: "10px 18px", background: "#ebe4d0", borderRadius: 6 }}>
              <div style={{ fontFamily: MONO, fontSize: 13, letterSpacing: 3, color: "#5a5242" }}>{l}</div>
              <div style={{ fontFamily: HAND, fontSize: 84, color: "#1f2a44", lineHeight: 1, minHeight: 84, transform: k ? "skewX(-4deg)" : undefined }}>{typed(w, f, letterAt + 6 + k * 14, 0.6)}</div>
            </div>
          ))}
          <div style={{ marginTop: 16, fontFamily: FONT, fontWeight: 800, fontSize: 56, color: ORANGE, opacity: P(f, alyxAt, 8) }}>{`${Math.round(94 * P(f, alyxAt, 20))}% compatível`}</div>
          <div style={{ display: "flex", gap: 14, marginTop: 18 }}>
            {[
              ["ALYX PERCEBE", ORANGE, seesAt],
              ["MOSSMAN TAMBÉM", ICE, mossAt],
            ].map(([l, c, at]) => (
              <div key={l as string} style={{ padding: "8px 16px", border: `2px solid ${c}`, borderRadius: 8, fontFamily: MONO, fontSize: 18, letterSpacing: 3, color: c as string, opacity: P(f, at as number, 8) }}>
                {l}
              </div>
            ))}
          </div>
        </div>
      ) : null}
      {f >= avoidAt ? (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 110, textAlign: "center", opacity: P(f, avoidAt + 6, 10) }}>
          <div style={{ fontFamily: MONO, fontSize: 18, letterSpacing: 6, color: ORANGE }}>A ALYX EVITA O ASSUNTO</div>
          {f >= walkAt - 10 ? <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 64, color: TXT, opacity: P(f, walkAt - 10, 8) }}>e continuam andando</div> : null}
        </div>
      ) : null}
      {void strangeAt}
      <AbsoluteFill style={{ background: "#000", opacity: fade(f, life), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- os lapsos o tempo todo
type LPP = { life: number; allAt?: number; doorAt?: number; beforeAt?: number; sentAt?: number; stopAt?: number; rememberAt?: number; notYetAt?: number };
export const HLRLapses: React.FC<LPP> = (p) => {
  const f = useCurrentFrame();
  const a = (v?: number) => v ?? 1e9;
  const [allAt, doorAt, beforeAt, sentAt, stopAt, rememberAt, notYetAt] = [p.allAt, p.doorAt, p.beforeAt, p.sentAt, p.stopAt, p.rememberAt, p.notYetAt].map(a);
  const life = p.life;
  // gráfico de lapsos acelerando
  const spikes = useMemo(() => {
    const out: number[] = [];
    let t = 0;
    for (let k = 0; k < 60; k++) {
      t += Math.max(4, 30 - k * 1.2);
      out.push(t);
    }
    return out;
  }, []);
  const DOOR_OPEN = 3;
  const mark = P(f, doorAt, 8);
  const opens = P(f, beforeAt + 16, 10);
  const SENT = "Gordon, eu acho que o núcleo fica";
  const cut = f >= stopAt;
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, #0e1412 0%, #040605 80%)", overflow: "hidden" }}>
      {/* gráfico */}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <line x1={120} x2={1800} y1={250} y2={250} stroke="rgba(242,240,247,0.2)" />
        {spikes.map((t, k) => {
          const x = 1800 - (f * 3 - t * 3);
          if (x < 120 || x > 1800 || t > f) return null;
          return <line key={k} x1={x} x2={x} y1={250} y2={250 - 40 - (k % 3) * 18} stroke={GREEN} strokeWidth={3} opacity={0.85} />;
        })}
        <text x={120} y={220} fill={GREEN} fontFamily={MONO} fontSize={16} letterSpacing={5} opacity={P(f, allAt - 10, 10)}>
          LAPSOS · O TEMPO INTEIRO
        </text>
        {/* as portas */}
        {Array.from({ length: 6 }).map((_, k) => {
          const x = 260 + k * 240;
          const isIt = k === DOOR_OPEN;
          const op = isIt ? opens : 0;
          return (
            <g key={k} opacity={P(f, 4 + k * 3, 10)}>
              <rect x={x} y={420} width={150} height={260} rx={8} fill="#141a1d" stroke="rgba(159,230,255,0.35)" strokeWidth={2} />
              <rect x={x + 6 + op * 120} y={426} width={138 - op * 120} height={248} rx={6} fill="#2a3338" />
              {op > 0 ? <rect x={x + 6} y={426} width={op * 120} height={248} fill="rgba(255,226,176,0.35)" /> : null}
              {isIt && mark > 0 ? (
                <g opacity={mark}>
                  <rect x={x - 12} y={408} width={174} height={284} rx={12} fill="none" stroke={ORANGE} strokeWidth={3} strokeDasharray="10 6" />
                  <text x={x + 75} y={396} textAnchor="middle" fill={ORANGE} fontFamily={MONO} fontSize={16} letterSpacing={3}>
                    {opens > 0 ? "ABRIU" : "ESTA VAI ABRIR"}
                  </text>
                </g>
              ) : null}
            </g>
          );
        })}
      </svg>
      {/* a frase que para no meio */}
      {f >= sentAt - 10 ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 790, textAlign: "center" }}>
          <div style={{ fontFamily: MONO, fontSize: 16, letterSpacing: 6, color: ORANGE }}>ALYX</div>
          <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 64, color: TXT, transform: cut && f < stopAt + 6 ? `translateX(${(rnd(f) - 0.5) * 30}px)` : undefined }}>
            “{cut ? SENT.slice(0, 22) : typed(SENT, f, sentAt - 10, 1.4)}
            {cut ? <span style={{ color: GREEN }}>—</span> : null}”
          </div>
          {f >= rememberAt ? <div style={{ fontFamily: MONO, fontSize: 20, letterSpacing: 5, color: GREEN, marginTop: 10, opacity: P(f, rememberAt, 8) }}>{f >= notYetAt ? "LEMBROU DE ALGO QUE AINDA NÃO ACONTECEU" : "PAROU NO MEIO"}</div> : null}
        </div>
      ) : null}
      {cut && f < stopAt + 4 ? <AbsoluteFill style={{ background: "rgba(141,255,168,0.12)", pointerEvents: "none" }} /> : null}
      <AbsoluteFill style={{ background: "#000", opacity: fade(f, life), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};
