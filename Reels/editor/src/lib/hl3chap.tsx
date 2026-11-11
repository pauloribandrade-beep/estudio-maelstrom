// 05/11 (pedido dele: "o final digno" em 1:55:30 estava muito ruim): vira a tela de SELEÇÃO DE CAPÍTULOS do Half-Life 3,
// em cima da nebulosa roxa. Cada desejo da fala acende um capítulo com a miniatura de uma cena do próprio vídeo; no
// "não seja uma resposta para cada pergunta" os capítulos apagam; no "um final digno" a fila corre até o CAPÍTULO FINAL,
// que cresce e ganha o botão JOGAR; no "pra mim, já valeu" a frase fecha a cena.
import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { HLSpace } from "./hl3";
import { MONO } from "./overlays";
import { Snd } from "./palco";

const CL = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const P = (f: number, a: number, d = 12) => interpolate(f, [a, a + d], [0, 1], { ...CL, easing: Easing.out(Easing.cubic) });
const IO = (f: number, a: number, d = 18) => interpolate(f, [a, a + d], [0, 1], { ...CL, easing: Easing.inOut(Easing.cubic) });
const OR = "#ff9a3c", VIO = "#c79bff", TXT = "#f2f0f7";

type Props = {
  life: number;
  askAt: number; w1At: number; w2At: number; w3At: number; w4At: number; w5At: number;
  noAnsAt: number; worthyAt: number; worthAt: number; valeuAt?: number;
};

const CHAPS = [
  { n: "CAPÍTULO 1", t: "O BOREALIS", s: "um mistério que justifique 20 anos", img: "tv_gelo_a" },
  { n: "CAPÍTULO 2", t: "O EMPREGADOR", s: "dá pra teorizar · estranho demais pra explicar", img: "tv_gm_c" },
  { n: "CAPÍTULO 3", t: "OS COMBINE", s: "mais do que um império maligno", img: "tv_tva_d" },
  { n: "CAPÍTULO 4", t: "ALYX", s: "consequência real depois do HL:Alyx", img: "tv_hug_a" },
  { n: "CAPÍTULO 5", t: "O FIM", s: "uma história que termina de vez", img: "tv_portal_a" },
  { n: "CAPÍTULO FINAL", t: "UM FINAL DIGNO", s: "", img: "tv_luz_a" },
];
const CW = 580, CH = 435, GAP = 60;

// o λ no estilo do logo: anel laranja e o lambda cheio
export const LambdaMark: React.FC<{ size: number; glow?: number }> = ({ size, glow = 0 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={{ filter: glow ? `drop-shadow(0 0 ${8 * glow}px rgba(255,154,60,${0.7 * glow}))` : undefined }}>
    <circle cx={50} cy={50} r={44} fill="none" stroke={OR} strokeWidth={8} />
    <path d="M 30 80 L 46 46 L 38 24 L 28 24 L 28 16 L 44 16 L 70 74 L 76 74 L 76 82 L 64 82 L 51 52 L 41 80 Z" fill={OR} />
  </svg>
);

export const HL15Chapters: React.FC<Props> = (p) => {
  const f = useCurrentFrame();
  const { life } = p;
  const valeuAt = p.valeuAt ?? p.worthAt + 205;
  const hits = [p.w1At, p.w2At, p.w3At, p.w4At, p.w5At, p.worthyAt];
  // capítulo ativo (contínuo, para a fila deslizar)
  let pos = 0;
  hits.forEach((h, i) => { if (i > 0) pos += IO(f, h - 4, 20); });
  const active = hits.reduce((a, h, i) => (f >= h - 4 ? i : a), -1);
  const dim = IO(f, p.noAnsAt, 24) * (1 - IO(f, p.worthyAt, 16)); // "não uma resposta pra cada pergunta"
  const fin = IO(f, p.worthyAt, 26); // o capítulo final toma a tela
  const play = P(f, p.worthAt, 16);
  const inK = P(f, 0, 24), outK = 1 - IO(f, valeuAt - 10, 16); // a fila sai e a frase fica sozinha até o corte
  const head = P(f, p.askAt - 6, 16);
  const typed = (s: string, t0: number, cps = 1.4) => s.slice(0, Math.max(0, Math.floor((f - t0) * cps)));
  const stripIn = P(f, p.askAt + 6, 22);
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#07040f" }}>
      <HLSpace speed={0.35} />
      <AbsoluteFill style={{ background: "radial-gradient(120% 90% at 50% 50%, rgba(7,4,15,0.15) 40%, rgba(7,4,15,0.85) 100%)" }} />
      <AbsoluteFill style={{ opacity: inK * outK }}>
        {/* cabeçalho do menu */}
        <div style={{ position: "absolute", left: 120, top: 92, display: "flex", alignItems: "center", gap: 26, opacity: head }}>
          <LambdaMark size={74} glow={0.6} />
          <div style={{ fontFamily: MONO, color: TXT }}>
            <div style={{ fontSize: 40, letterSpacing: 14, fontWeight: 700 }}>HALF-LIFE 3</div>
            <div style={{ fontSize: 20, letterSpacing: 8, color: VIO, marginTop: 8, minHeight: 26 }}>
              {f < p.noAnsAt ? typed("NOVO JOGO · SELECIONE UM CAPÍTULO", p.askAt) : f < p.worthyAt ? typed("NÃO UMA RESPOSTA PRA CADA PERGUNTA", p.noAnsAt, 1.8) : typed("O QUE EU MAIS QUERIA", p.worthyAt, 1.8)}
            </div>
          </div>
        </div>
        {/* a fila de capítulos */}
        <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, opacity: stripIn }}>
          {CHAPS.map((c, i) => {
            const d = i - pos;
            const isFinal = i === CHAPS.length - 1;
            const on = active === i;
            const lit = on ? 1 : 0;
            const sc = (Math.abs(d) < 1 ? 1 - 0.22 * Math.abs(d) : 0.78) * (isFinal ? 1 + 0.16 * fin : 1);
            const x = 960 + d * (CW * 0.9 + GAP) * (1 + 0.9 * fin * (isFinal ? 0 : 1)) - CW / 2;
            const y = 270 + (isFinal ? 10 * fin : 0) - 20 * stripIn + 20;
            const op = (Math.abs(d) > 2.4 ? 0 : 1) * (isFinal ? 1 : 1 - 0.85 * fin) * (1 - 0.55 * dim) * (on || active < 0 ? 1 : 0.55 + 0.45 * (1 - Math.min(1, Math.abs(d))));
            const kb = 1.06 + 0.05 * ((f % 600) / 600);
            const flash = on ? Math.max(0, 1 - (f - hits[i] + 4) / 14) : 0;
            return (
              <div key={i} style={{ position: "absolute", left: x, top: y, width: CW, transform: `scale(${sc})`, transformOrigin: "50% 40%", opacity: op }}>
                <div style={{ fontFamily: MONO, fontSize: 19, letterSpacing: 6, color: on ? OR : "rgba(242,240,247,0.55)", marginBottom: 12 }}>{c.n}</div>
                <div style={{ position: "relative", width: CW, height: CH, borderRadius: 6, overflow: "hidden", border: `2px solid ${on ? OR : "rgba(199,155,255,0.35)"}`, boxShadow: on ? `0 0 ${28 + 30 * (isFinal ? fin : 0)}px rgba(255,154,60,0.45), 0 30px 80px rgba(0,0,0,0.6)` : "0 30px 80px rgba(0,0,0,0.5)" }}>
                  <Img src={staticFile(`videos/hl3_M01/img/chap/${c.img}.jpg`)} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${kb})`, filter: `saturate(${0.55 + 0.45 * lit}) brightness(${0.55 + 0.45 * lit + (isFinal ? 0.15 * fin : 0)})` }} />
                  {isFinal ? <AbsoluteFill style={{ background: `radial-gradient(60% 60% at 50% 45%, rgba(255,214,150,${0.35 * fin}), rgba(255,214,150,0) 70%)` }} /> : null}
                  <AbsoluteFill style={{ background: "#fff", opacity: flash * 0.5 }} />
                  {/* linhas de varredura discretas, como thumbnail de menu */}
                  <AbsoluteFill style={{ backgroundImage: "repeating-linear-gradient(0deg, rgba(0,0,0,0.12) 0 1px, transparent 1px 3px)" }} />
                </div>
                <div style={{ fontFamily: MONO, fontSize: isFinal ? 34 : 30, letterSpacing: 8, fontWeight: 700, color: TXT, marginTop: 18, opacity: 0.6 + 0.4 * lit }}>{c.t}</div>
                {c.s ? (
                  <div style={{ fontFamily: MONO, fontSize: 18, letterSpacing: 3, color: VIO, marginTop: 10, textTransform: "uppercase", opacity: on ? P(f, hits[i] + 6, 14) : 0 }}>{c.s}</div>
                ) : null}
                {isFinal ? (
                  <div style={{ marginTop: 22, display: "inline-flex", alignItems: "center", gap: 14, padding: "12px 28px", border: `2px solid ${OR}`, borderRadius: 4, fontFamily: MONO, fontSize: 22, letterSpacing: 8, color: OR, opacity: play, background: `rgba(255,154,60,${0.08 + 0.1 * (0.5 + 0.5 * Math.sin(f / 9)) * play})` }}>
                    ▶ JOGAR
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
        {/* "pra mim, já valeu." */}
        </AbsoluteFill>
      <div style={{ position: "absolute", left: 0, right: 0, top: 500, textAlign: "center", fontFamily: MONO, fontSize: 52, letterSpacing: 16, color: TXT, opacity: P(f, valeuAt - 4, 14), textShadow: "0 0 30px rgba(255,214,150,0.5)" }}>
        PRA MIM, JÁ VALEU.
      </div>
      {hits.map((h, i) => <Snd key={i} at={h - 4} name="tick" file={i === hits.length - 1 ? "hl_botao_combine.wav" : "hl_blip_curto.wav"} vol={0.3} />)}
      <Snd at={p.worthAt} name="tick" file="hl_blip.wav" vol={0.25} />
    </AbsoluteFill>
  );
};

// 05/11 (pedido dele: os segundos de roxo vazio antes do The Last of Us): o "me diverti criando… detalhe a detalhe" vira um
// mosaico com quadros do próprio vídeo montando peça por peça (e o total de cenas da timeline); o "me conta nos
// comentários" vira uma caixa de comentário sendo digitada; o "planejo mais vídeos" vira PRÓXIMO VÍDEO carregando, que
// sai quando os cartazes chegam.
const MOS = ["m00", "m01", "m02", "m03", "m04", "m05", "m06", "m08", "m09", "m10", "m11", "m12", "m13", "m14", "m15", "m16", "m17", "m19"];
export const OutroIntro: React.FC<{ f: number; madeAt: number; hopeAt: number; commentAt: number; planAt: number; whichAt: number; endAt: number; scenes: number }> = ({ f, madeAt, hopeAt, commentAt, planAt, whichAt, endAt, scenes }) => {
  const out = 1 - IO(f, endAt - 10, 14);
  if (out <= 0) return null;
  // 1) o mosaico: 6 × 3 quadros entrando um a um, inclinado no espaço; recua quando o comentário entra
  const mosK = 1 - IO(f, commentAt - 6, 18) * 0.75;
  const tw = 252, th = 189, gp = 14;
  const count = Math.min(scenes, Math.round(interpolate(f, [madeAt, madeAt + 70], [0, scenes], { ...CL, easing: Easing.out(Easing.cubic) })));
  const typed = (s: string, t0: number, cps = 1.2) => s.slice(0, Math.max(0, Math.floor((f - t0) * cps)));
  const msg = "gostei desse tipo de vídeo, faz mais";
  const load = interpolate(f, [planAt, whichAt + 30], [0, 1], { ...CL, easing: Easing.inOut(Easing.cubic) });
  return (
    <AbsoluteFill style={{ opacity: out }}>
      <AbsoluteFill style={{ perspective: 1600, opacity: mosK }}>
        <div style={{ position: "absolute", left: 960 - (6 * tw + 5 * gp) / 2, top: 290, width: 6 * tw + 5 * gp, transform: `rotateX(14deg) rotateY(${-10 + 4 * P(f, madeAt, 120)}deg) scale(${0.92 + 0.06 * P(f, madeAt, 200) - 0.12 * (1 - mosK)})`, transformStyle: "preserve-3d" }}>
          {MOS.map((m, i) => {
            const t0 = madeAt + 4 + i * 3.2;
            const k = P(f, t0, 10);
            const col = i % 6, row = Math.floor(i / 6);
            return (
              <div key={m} style={{ position: "absolute", left: col * (tw + gp), top: row * (th + gp), width: tw, height: th, borderRadius: 6, overflow: "hidden", border: "1.5px solid rgba(199,155,255,0.45)", boxShadow: "0 18px 40px rgba(0,0,0,0.55)", opacity: k, transform: `translateZ(${(1 - k) * 260}px) translateY(${(1 - k) * -30}px)` }}>
                <Img src={staticFile(`videos/hl3_M01/img/mosaic/${m}.jpg`)} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "saturate(0.85)" }} />
                <AbsoluteFill style={{ background: "#fff", opacity: Math.max(0, 1 - (f - t0) / 8) * 0.6 * k }} />
              </div>
            );
          })}
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 130, textAlign: "center", fontFamily: MONO, color: TXT, opacity: P(f, madeAt, 14) }}>
          <div style={{ fontSize: 30, letterSpacing: 12 }}>DETALHE A DETALHE</div>
          <div style={{ fontSize: 20, letterSpacing: 8, color: VIO, marginTop: 10 }}>{count} CENAS · {f >= hopeAt ? typed("ESPERO QUE TENHA GOSTADO", hopeAt, 1.6) : ""}</div>
        </div>
      </AbsoluteFill>
      {/* 2) a caixa de comentário */}
      <div style={{ position: "absolute", left: 960 - 380, top: 400, width: 760, opacity: P(f, commentAt, 12) * (1 - IO(f, planAt - 6, 12)), transform: `translateY(${(1 - P(f, commentAt, 14)) * 30}px)` }}>
        <div style={{ padding: "26px 30px", borderRadius: 14, background: "rgba(16,10,32,0.78)", backdropFilter: "blur(14px)", border: "1.5px solid rgba(199,155,255,0.5)", boxShadow: "0 30px 80px rgba(0,0,0,0.6)", display: "flex", gap: 22, alignItems: "flex-start" }}>
          <div style={{ width: 58, height: 58, borderRadius: 29, background: "#1a1226", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><LambdaMark size={46} /></div>
          <div style={{ fontFamily: MONO, color: TXT, flex: 1 }}>
            <div style={{ fontSize: 16, letterSpacing: 4, color: VIO }}>ADICIONAR UM COMENTÁRIO</div>
            <div style={{ fontSize: 28, marginTop: 12, minHeight: 36 }}>{typed(msg, commentAt + 8, 1.1)}<span style={{ opacity: Math.floor(f / 15) % 2 ? 1 : 0, color: OR }}>▍</span></div>
            <div style={{ height: 1.5, background: "rgba(199,155,255,0.4)", marginTop: 10 }} />
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
              <div style={{ padding: "8px 20px", borderRadius: 18, fontSize: 16, letterSpacing: 4, background: f > commentAt + 8 + msg.length / 1.1 + 6 ? OR : "rgba(255,255,255,0.12)", color: f > commentAt + 8 + msg.length / 1.1 + 6 ? "#1a0e04" : "rgba(242,240,247,0.6)" }}>COMENTAR</div>
            </div>
          </div>
        </div>
      </div>
      {/* 3) o próximo vídeo carregando */}
      <div style={{ position: "absolute", left: 960 - 360, top: 470, width: 720, textAlign: "center", fontFamily: MONO, opacity: P(f, planAt, 12) }}>
        <div style={{ fontSize: 30, letterSpacing: 12, color: TXT }}>MAIS VÍDEOS ASSIM</div>
        <div style={{ marginTop: 26, height: 10, borderRadius: 5, background: "rgba(255,255,255,0.1)", overflow: "hidden", border: "1px solid rgba(199,155,255,0.35)" }}>
          <div style={{ width: `${load * 100}%`, height: "100%", background: `linear-gradient(90deg, ${VIO}, ${OR})` }} />
        </div>
        <div style={{ marginTop: 16, fontSize: 18, letterSpacing: 6, color: VIO }}>{f < whichAt ? `PRÓXIMO VÍDEO · ${Math.round(load * 100)}%` : "QUAL VEM PRIMEIRO?"}</div>
      </div>
    </AbsoluteFill>
  );
};
