// 05/11 (ele gravou a despedida, final.wav): o fim do vídeo de volta à nebulosa roxa da abertura. A viagem anda devagar e
// cada frase vira um cartão de vidro: o vídeo mais longo, feito com carinho, o vazamento do HLX (o trecho entra depois),
// obrigado, o comentário (qual final você escolheria · o que faria diferente), inscreva-se + sininho, valeu.
import React from "react";
import { AbsoluteFill, Easing, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { HLSpace } from "./hl3";
import { FONT, MONO } from "./overlays";
import { ByeLambda, Leak, Subscribe } from "./hl3byeparts";

const C = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const P = (f: number, a: number, d = 12) => interpolate(f, [a, a + d], [0, 1], { ...C, easing: Easing.out(Easing.cubic) });
const OUT = (f: number, b: number, d = 12) => 1 - interpolate(f, [b, b + d], [0, 1], C);
const VIO = "#c79bff", ORANGE = "#ff9a3c", TXT = "#f2f0f7";

type Props = {
  life: number;
  longAt: number; loveAt: number; hlAt: number; hl3At: number; leakAt: number; hlxAt: number; clipAt: number;
  thanksAt: number; playAt?: number; playEndAt?: number; commentAt: number; diffAt: number; readAt: number; subAt: number; bellAt: number; byeAt: number;
};

const Glass: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{ padding: "26px 34px", borderRadius: 18, background: "rgba(16,10,32,0.55)", backdropFilter: "blur(16px)", border: "1.5px solid rgba(199,155,255,0.45)", boxShadow: "0 30px 80px rgba(0,0,0,0.45)", ...style }}>{children}</div>
);

export const HL15Bye: React.FC<Props> = (p) => {
  const f = useCurrentFrame();
  const { life } = p;
  const inK = P(f, 0, 20);
  // janelas de cada bloco
  const b1 = P(f, p.longAt, 14) * OUT(f, p.hlAt - 8);
  const b2 = P(f, p.hlAt, 14) * OUT(f, p.leakAt - 8);
  const b3 = P(f, p.leakAt, 14) * OUT(f, (p.playAt ?? p.thanksAt) - 8);
  const bClip = p.playAt === undefined ? 0 : P(f, p.playAt - 4, 10) * OUT(f, (p.playEndAt ?? p.thanksAt) - 2, 10);
  const b4 = P(f, p.thanksAt, 14) * OUT(f, p.commentAt - 8);
  const b5 = P(f, p.commentAt, 14) * OUT(f, p.subAt - 8);
  const b6 = P(f, p.subAt, 14) * OUT(f, p.byeAt - 8);
  const b7 = P(f, p.byeAt, 16);
  const typed = (s: string, t0: number, cps = 1.3) => s.slice(0, Math.max(0, Math.floor((f - t0) * cps)));
  return (
    <AbsoluteFill style={{ overflow: "hidden", opacity: inK }}>
      <AbsoluteFill style={{ opacity: 0.95 }}>
        <HLSpace speed={0.35} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(4,3,10,0) 35%, rgba(4,3,10,0.55) 100%)" }} />

      {/* 1 · o vídeo mais longo, feito com carinho */}
      {b1 > 0 ? (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: b1 }}>
          <div style={{ fontFamily: MONO, fontSize: 22, letterSpacing: 8, color: VIO }}>ENTÃO É ISSO</div>
          <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 92, letterSpacing: 2, color: TXT, marginTop: 14, textAlign: "center", lineHeight: 1.05, textShadow: "0 6px 30px rgba(0,0,0,0.6)" }}>
            O VÍDEO MAIS LONGO<br />QUE EU JÁ FIZ
          </div>
          <div style={{ marginTop: 26, fontFamily: MONO, fontSize: 40, letterSpacing: 6, color: ORANGE, opacity: P(f, p.longAt + 20, 10) }}>1H 57MIN</div>
          <div style={{ marginTop: 22, fontFamily: MONO, fontSize: 24, letterSpacing: 6, color: "rgba(242,240,247,0.85)", opacity: P(f, p.loveAt, 12) }}>FEITO COM MUITO CARINHO ♥</div>
        </AbsoluteFill>
      ) : null}

      {/* 2 · uma série que eu amo · ansioso pelo HL3 */}
      {b2 > 0 ? (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: b2 }}>
          <div style={{ transform: `scale(${0.9 + 0.1 * P(f, p.hlAt, 20)}) rotate(${-20 * (1 - P(f, p.hlAt, 24))}deg)` }}><ByeLambda size={250} glow={1 + 0.4 * Math.sin(f / 12)} /></div>
          <div style={{ fontFamily: MONO, fontSize: 26, letterSpacing: 8, color: TXT, marginTop: 10 }}>UMA SÉRIE QUE EU AMO DE VERDADE</div>
          <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 70, letterSpacing: 4, color: TXT, marginTop: 30, opacity: P(f, p.hl3At, 12) }}>
            HALF-LIFE <span style={{ color: ORANGE }}>3</span>
            <span style={{ color: VIO, opacity: 0.5 + 0.5 * Math.abs(Math.sin(f / 10)) }}>?</span>
          </div>
        </AbsoluteFill>
      ) : null}

      {/* 3 · o vazamento do HLX (hl3byeparts) */}
      {b3 > 0 ? (
        <AbsoluteFill style={{ opacity: b3 }}>
          <Leak f={f} leakAt={p.leakAt} hlxAt={p.hlxAt} clipAt={p.clipAt} playAt={p.playAt ?? p.thanksAt} />
        </AbsoluteFill>
      ) : null}

      {/* 4 · obrigado */}
      {/* 05/11: o trecho real (GameSoundCon 2026, Mike Morasky) num vidro, com a fala traduzida embaixo */}
      {bClip > 0 && p.playAt !== undefined ? (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: bClip }}>
          <div style={{ fontFamily: MONO, fontSize: 18, letterSpacing: 6, color: VIO, marginBottom: 16 }}>MIKE MORASKY · COMPOSITOR DA VALVE · OUT/2026</div>
          <div style={{ width: 1120, height: 502, borderRadius: 16, overflow: "hidden", border: "1.5px solid rgba(199,155,255,0.5)", boxShadow: "0 30px 90px rgba(0,0,0,0.6)", transform: `scale(${0.96 + 0.04 * P(f, p.playAt, 20)})` }}>
            <Sequence from={p.playAt} durationInFrames={Math.max(1, (p.playEndAt ?? p.thanksAt) - p.playAt + 10)}>
              <OffthreadVideo src={staticFile("videos/hl3_M01/hlx_morasky.mp4")} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </Sequence>
          </div>
          <div style={{ marginTop: 22, fontFamily: FONT, fontSize: 34, color: TXT, textAlign: "center", maxWidth: 1300 }}>
            {f < p.playAt + 255 ? <>“o Deadlock tem a própria versão do HDR… o <span style={{ color: "#ff5a4a", fontWeight: 800 }}>HLX</span> tem a sua própria versão”</> : <span style={{ color: VIO, fontStyle: "italic" }}>(o colega do lado, baixinho: “nice work”)</span>}
          </div>
        </AbsoluteFill>
      ) : null}
      {b4 > 0 ? (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: b4 }}>
          <div style={{ fontFamily: MONO, fontSize: 24, letterSpacing: 8, color: VIO }}>SE VOCÊ CHEGOU ATÉ AQUI</div>
          <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 150, letterSpacing: 6, color: TXT, marginTop: 10, textShadow: "0 0 40px rgba(199,155,255,0.45)", transform: `scale(${0.94 + 0.06 * P(f, p.thanksAt + 6, 20)})` }}>OBRIGADO</div>
        </AbsoluteFill>
      ) : null}

      {/* 5 · o comentário */}
      {b5 > 0 ? (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: b5 }}>
          <div style={{ fontFamily: MONO, fontSize: 24, letterSpacing: 8, color: VIO, marginBottom: 22 }}>DEIXA NOS COMENTÁRIOS</div>
          <div style={{ width: 1000, padding: "22px 28px", borderRadius: 14, background: "#f2f2f2", fontFamily: "Roboto, Arial, sans-serif", color: "#111", boxShadow: "0 30px 80px rgba(0,0,0,0.5)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 46, height: 46, borderRadius: 23, background: "linear-gradient(135deg, #c79bff, #ff9a3c)" }} />
              <div style={{ fontSize: 18, color: "#606060" }}>Adicione um comentário…</div>
            </div>
            <div style={{ fontSize: 32, marginTop: 16, minHeight: 44 }}>{typed("Eu escolheria o final ", p.commentAt + 6)}<b>{f >= p.commentAt + 40 ? (Math.floor((f - p.commentAt) / 45) % 2 ? "2" : "1") : ""}</b>{f >= p.commentAt + 40 ? ", porque…" : ""}</div>
            {f >= p.diffAt ? <div style={{ fontSize: 28, marginTop: 10, color: "#333", opacity: P(f, p.diffAt, 8) }}>{typed("E no meu Half-Life 3 eu faria diferente: …", p.diffAt, 1.6)}</div> : null}
          </div>
          {f >= p.readAt ? <div style={{ marginTop: 28, fontFamily: MONO, fontSize: 26, letterSpacing: 6, color: ORANGE, opacity: P(f, p.readAt, 10) }}>EU VOU LER TUDO · PROMETO</div> : null}
        </AbsoluteFill>
      ) : null}

      {/* 6 · inscreva-se + sininho (hl3byeparts) */}
      {b6 > 0 ? (
        <AbsoluteFill style={{ opacity: b6 }}>
          <Subscribe f={f} subAt={p.subAt} bellAt={p.bellAt} byeAt={p.byeAt} />
        </AbsoluteFill>
      ) : null}

      {/* 7 · valeu → o encerramento (06/11, ele: "fica um VALEU quase 12 s parado; tem que ter um final épico") */}
      {b7 > 0 ? <ByeFinale f={f} at={p.byeAt} life={life} k={b7} /> : null}
      <AbsoluteFill style={{ background: "#000", opacity: interpolate(f, [life - 10, life], [0, 1], C), pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};

// O ENCERRAMENTO a partir do "valeu" (quadros). Os tempos estão em BYE_T: os sons do fim (edit.json) usam os mesmos.
//  0–105    VALEU + ATÉ O PRÓXIMO VÍDEO (enquanto ele fala)
//  105–150  o texto se recolhe no λ, que cresce e esquenta; as estrelas esticam (o salto)
//  150      clarão: o λ passa pela câmera
//  168–330  escuro: a voz do G-Man (Episode Two, gman_mono34) e a frase se escrevendo junto com ela
//  330–466  HALF-LIFE 3 · CARREGANDO… a barra sobe, empaca em 99%, falha
//  466      apaga
export const BYE_T = { T1: 105, T2: 150, T3: 168, VOICE: 174, L2: 216, L2END: 296, T4: 330, BAR0: 350, BAR99: 440, CUT: 466 };
const ByeFinale: React.FC<{ f: number; at: number; life: number; k: number }> = ({ f, at, k }) => {
  const u = f - at;
  const { T1, T2, T3, VOICE, L2, L2END, T4, BAR0, BAR99, CUT } = BYE_T;
  // 1 · valeu
  const txt = OUT(u, T1, 18);
  // 2 · o λ cresce e esquenta, e dispara pela câmera no clarão
  const grow = interpolate(u, [T1, T2], [0, 1], { ...C, easing: Easing.in(Easing.cubic) });
  const lamS = 1 + 0.6 * grow + interpolate(u, [T2 - 6, T2 + 10], [0, 26], { ...C, easing: Easing.in(Easing.quad) });
  const lamO = u < T2 + 6 ? 1 : interpolate(u, [T2 + 6, T2 + 12], [1, 0], C);
  const shake = u > T1 && u < T2 ? grow * 6 : 0;
  const flash = interpolate(u, [T2 - 2, T2, T2 + 22], [0, 1, 0], C);
  const warp = interpolate(u, [T1 - 10, T2 - 4, T2 + 4, T2 + 30], [0, 1, 1, 0], C);
  // 3 · a frase, escrita no ritmo da voz ("Prepare for" → 1ª linha; "unforeseen consequences" → 2ª)
  const dark = interpolate(u, [T2 + 4, T2 + 24], [0, 0.85], C);
  const A1 = "PREPARE-SE PARA";
  const A2 = "CONSEQUÊNCIAS IMPREVISTAS";
  const ty = (s: string, t0: number, t1: number) => s.slice(0, Math.max(0, Math.min(s.length, Math.floor(((u - t0) / (t1 - t0)) * s.length))));
  const qO = P(u, T3, 6) * OUT(u, T4 - 14, 16);
  const rnd = (n: number) => {
    const x = Math.sin(n * 12.9898) * 43758.5453;
    return x - Math.floor(x);
  };
  const glitchQ = u > VOICE && u < T4 && rnd(Math.floor(u / 2) + 3) > 0.9;
  const en = P(u, L2END + 4, 14);
  // 4 · HALF-LIFE 3 · carregando (sobe, empaca em 99%, falha)
  const lO = P(u, T4, 18);
  const pct = u < BAR0 ? 0 : u < BAR99 ? 99 * Math.pow(interpolate(u, [BAR0, BAR99], [0, 1], C), 0.8) : 99;
  const lit = Math.floor((pct / 100) * 32); // em 99% fica faltando o último segmento
  const stuck = u >= BAR99;
  const fail = u >= BAR99 + 12;
  const glitchL = fail && rnd(Math.floor(u / 2) + 41) > 0.55;
  const cut = interpolate(u, [CUT, CUT + 8], [0, 1], C);
  return (
    <AbsoluteFill style={{ opacity: k, pointerEvents: "none" }}>
      {warp > 0 ? (
        <AbsoluteFill style={{ opacity: warp }}>
          {Array.from({ length: 90 }).map((_, i) => {
            const a = (i * 137.508) % 360;
            const r0 = 80 + ((i * 53) % 420);
            const len = (60 + ((i * 97) % 260)) * (0.4 + 2.4 * warp);
            const run = (u * (6 + (i % 5) * 3) + i * 31) % 900;
            return (
              <div key={i} style={{ position: "absolute", left: 960, top: 540, width: len, height: 2 + (i % 3), borderRadius: 2, background: i % 4 ? "linear-gradient(90deg, rgba(199,155,255,0), rgba(235,225,255,0.9))" : "linear-gradient(90deg, rgba(255,154,60,0), rgba(255,200,140,0.95))", transformOrigin: "0 50%", transform: `rotate(${a}deg) translateX(${r0 + run}px)` }} />
            );
          })}
        </AbsoluteFill>
      ) : null}
      {lamO > 0 ? (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", transform: `translate(${shake * Math.sin(u * 1.7)}px, ${shake * Math.cos(u * 2.3)}px)` }}>
          <div style={{ transform: `scale(${lamS})`, opacity: lamO }}>
            <ByeLambda size={190} glow={1.2 + 2.5 * grow} />
          </div>
          <div style={{ opacity: txt, transform: `translateY(${-30 * (1 - txt)}px) scale(${0.9 + 0.1 * txt})` }}>
            <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 96, letterSpacing: 4 + 30 * (1 - txt), color: TXT, marginTop: 10, textAlign: "center" }}>VALEU</div>
            <div style={{ fontFamily: MONO, fontSize: 28, letterSpacing: 8, color: VIO, marginTop: 12, textAlign: "center" }}>ATÉ O PRÓXIMO VÍDEO</div>
          </div>
        </AbsoluteFill>
      ) : null}
      <AbsoluteFill style={{ background: "#020104", opacity: dark }} />
      {qO > 0 ? (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: qO, transform: glitchQ ? `translateX(${(rnd(u) - 0.5) * 30}px)` : undefined }}>
          <div style={{ fontFamily: MONO, fontSize: 30, letterSpacing: 14, color: "rgba(242,240,247,0.78)", minHeight: 40, textShadow: glitchQ ? "4px 0 rgba(255,60,60,0.7), -4px 0 rgba(60,200,255,0.7)" : "none" }}>{ty(A1, VOICE, L2 - 4)}</div>
          <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 54, letterSpacing: 12, color: ORANGE, marginTop: 18, minHeight: 68, textShadow: glitchQ ? "5px 0 rgba(255,60,60,0.8), -5px 0 rgba(60,200,255,0.8)" : "0 0 24px rgba(255,154,60,0.45)" }}>
            {ty(A2, L2, L2END)}
            {u > L2 && Math.floor(u / 15) % 2 ? <span style={{ opacity: 0.8 }}>_</span> : null}
          </div>
          <div style={{ fontFamily: MONO, fontSize: 20, letterSpacing: 10, color: "rgba(199,155,255,0.7)", marginTop: 34, opacity: en }}>“PREPARE FOR UNFORESEEN CONSEQUENCES”</div>
        </AbsoluteFill>
      ) : null}
      {flash > 0 ? <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 50%, #fff 0%, #ffe2c2 35%, rgba(255,154,60,0.6) 70%, rgba(255,154,60,0) 100%)", opacity: flash }} /> : null}
      {lO > 0 ? (
        <AbsoluteFill style={{ background: `rgba(2,1,4,${0.9 * lO})`, alignItems: "center", justifyContent: "center", opacity: lO, transform: glitchL ? `translate(${(rnd(u + 7) - 0.5) * 40}px, ${(rnd(u + 9) - 0.5) * 10}px)` : undefined, filter: glitchL ? "hue-rotate(-30deg) saturate(1.6)" : undefined }}>
          <div style={{ display: "flex", alignItems: "center", gap: 34, transform: `scale(${0.96 + 0.04 * lO})` }}>
            <ByeLambda size={150} glow={1.1 + 0.3 * Math.sin(u / 9)} />
            <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 118, letterSpacing: 10, color: TXT, textShadow: "0 0 40px rgba(255,154,60,0.25)" }}>
              HALF-LIFE <span style={{ color: ORANGE }}>3</span>
            </div>
          </div>
          <div style={{ marginTop: 90, width: 860, padding: "22px 26px", border: "1.5px solid rgba(255,154,60,0.45)", background: "rgba(20,12,6,0.6)", borderRadius: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 24, letterSpacing: 8, color: fail ? "#ff5a4a" : "rgba(242,240,247,0.85)" }}>
              <span>{fail ? "ERRO · TEMPO ESGOTADO" : stuck ? "CARREGANDO" : `CARREGANDO${".".repeat(1 + (Math.floor(u / 10) % 3))}`}</span>
              <span style={{ color: fail ? "#ff5a4a" : ORANGE, opacity: stuck && !fail && Math.floor(u / 8) % 2 ? 0.35 : 1 }}>{Math.min(99, Math.floor(pct))}%</span>
            </div>
            <div style={{ display: "flex", gap: 5, marginTop: 16 }}>
              {Array.from({ length: 32 }).map((_, i) => (
                <div key={i} style={{ flex: 1, height: 22, borderRadius: 2, background: i < lit ? (fail ? "#ff5a4a" : ORANGE) : "rgba(255,154,60,0.12)", boxShadow: i < lit ? "0 0 8px rgba(255,154,60,0.5)" : "none" }} />
              ))}
            </div>
            <div style={{ marginTop: 14, fontFamily: MONO, fontSize: 18, letterSpacing: 6, color: "rgba(199,155,255,0.7)" }}>{fail ? "A VALVE NÃO RESPONDE" : "AGUARDANDO A VALVE"}</div>
          </div>
        </AbsoluteFill>
      ) : null}
      {glitchL ? <AbsoluteFill style={{ background: "repeating-linear-gradient(0deg, rgba(255,255,255,0.08) 0 2px, rgba(0,0,0,0) 2px 5px)" }} /> : null}
      <AbsoluteFill style={{ background: "#000", opacity: cut }} />
    </AbsoluteFill>
  );
};
