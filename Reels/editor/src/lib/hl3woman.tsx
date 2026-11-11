// 05/11 (pedido dele): no lugar do salão gerado, a cena REAL de Half-Life: Alyx (só a parte da sombra da cientista atrás
// da grade, falando com o Advisor), num televisor de tubo em 3D: gabinete com profundidade, tela abaulada, separação RGB,
// máscara de fósforo, linhas de varredura, faixa de zumbido, chuvisco, reflexo no vidro e o brilho da tela vazando.
// A TV gira devagar. Na "volta no tempo" (backAt) a fita rebobina e a mesma cena passa de novo em câmera lenta, mais perto.
import React from "react";
import { AbsoluteFill, Easing, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { FONT, MONO } from "./overlays";
import { FilmLook } from "./hl3r";
import { Clip, CombineWall } from "./hl3";

const C = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const P = (f: number, a: number, d = 12) => interpolate(f, [a, a + d], [0, 1], { ...C, easing: Easing.out(Easing.cubic) });
const IO = (f: number, a: number, b: number, d = 12) => P(f, a, d) * (1 - interpolate(f, [b, b + d], [0, 1], C));
const ICE = "#9fe6ff", ORANGE = "#ff8a1f", GOLD = "#ffd27a", TXT = "#f2f0f7", VIO = "#c79bff";

type WomanP = {
  life: number; womanAt: number; presAt: number; voiceAt: number; moveAt: number; knowsAt: number; advAt: number; lineAt: number;
  backAt: number; ensureAt: number; vaultAt: number; knowAt: number; trustAt: number; meetAt: number;
};
const SRC = "videos/hl3_M01/hla_mulher.mp4"; // 32 s, 960×720 (Half-Life: Alyx, 1:18–1:50 da cena)
const TVW = 1040, TVH = 860, DEP = 560, SW = 800, SH = 600, SX = 120, SY = 78;

const WStamp: React.FC<{ f: number; a: number; b: number; t: string; s?: string; col?: string }> = ({ f, a, b, t, s, col = ORANGE }) => {
  if (f < a - 1 || f > b + 14) return null;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 520, opacity: IO(f, a, b, 12), transform: `translateX(${18 * (1 - P(f, a, 14))}px)` }}>
      <div style={{ width: 70 * P(f, a, 18), height: 3, background: col, boxShadow: `0 0 12px ${col}`, marginBottom: 16 }} />
      <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 50, lineHeight: 1.06, color: TXT, textShadow: "0 4px 18px rgba(0,0,0,0.6)" }}>{t}</div>
      {s ? <div style={{ fontFamily: MONO, fontSize: 18, letterSpacing: 3, lineHeight: 1.5, color: col, marginTop: 12 }}>{s}</div> : null}
    </div>
  );
};

export const HL15WomanTV: React.FC<WomanP> = (p) => {
  const f = useCurrentFrame();
  const { life, womanAt, presAt, voiceAt, moveAt, knowsAt, advAt, lineAt, backAt, ensureAt, vaultAt, knowAt, trustAt, meetAt } = p;
  const RW = 60; // o rebobinar (quadros)
  const slow = backAt + RW;
  const inK = P(f, 0, 40);
  const ry = -17 + 5 * Math.sin(f / 120) + 1.4 * Math.sin(f / 47) + 6 * P(f, slow, 200);
  const rx = 4 + 1.8 * Math.sin(f / 95) + 0.6 * Math.sin(f / 37);
  const sc = 0.72 + 0.04 * inK + 0.0004 * Math.min(f, 400) + 0.06 * P(f, slow, 240);
  const on = P(f, 4, 16);
  const flick = 1 + 0.03 * Math.sin(f * 1.9) + 0.02 * Math.sin(f * 0.41);
  const rw = f >= backAt && f < slow;
  const rwq = Math.floor(f / 2);
  const tear = rw ? Math.sin(rwq * 1.7) * 26 : 0;
  const zoom = f < womanAt ? 1 + 0.12 * (f / Math.max(1, womanAt)) : f < backAt ? 1.12 + 0.2 * P(f, womanAt, 600) : 1.42 + 0.12 * P(f, slow, 900);
  const org = f < womanAt ? "60% 60%" : "80% 72%";
  const roll = ((f * 2.6) % (SH + 260)) - 130;
  const grainX = Math.floor(Math.abs(Math.sin(f * 12.9898) * 43758.5453)) % 300, grainY = Math.floor(Math.abs(Math.cos(f * 78.233) * 12345.678)) % 300;
  const tint = P(f, slow, 30);
  const osd = rw ? "◀◀ REBOBINANDO" : f >= slow ? "▶ PLAY · DE NOVO" : "▶ PLAY";
  const vents = (l0: number) => Array.from({ length: 9 }, (_, k) => <div key={k} style={{ position: "absolute", left: l0 + k * 38, top: 260, width: 14, height: 340, borderRadius: 7, background: "rgba(0,0,0,0.55)" }} />);
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#040506" }}>
      {/* 05/11: a mesma parede quadriculada de todas as TVs (o roxo fica para os outros momentos) */}
      <CombineWall gt={f} />
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <filter id="wtvRGB" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
          <feOffset in="r" dx={rw ? 9 : 3} dy="0" result="r2" />
          <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
          <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" />
          <feOffset in="b" dx={rw ? -9 : -3} dy="0" result="b2" />
          <feBlend in="r2" in2="g" mode="screen" result="rg" />
          <feBlend in="rg" in2="b2" mode="screen" />
        </filter>
      </svg>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 40% 50%, rgba(4,3,10,0) 30%, rgba(4,3,10,0.7) 100%)" }} />
      {/* a luz da tela no chão e no ar */}
      <div style={{ position: "absolute", left: 160, top: 860, width: 1100, height: 160, borderRadius: "50%", background: `radial-gradient(ellipse, rgba(120,190,230,${0.22 * on * flick}) 0%, rgba(0,0,0,0) 70%)`, filter: "blur(10px)" }} />
      <div style={{ position: "absolute", left: 60, top: 60, width: 1300, height: 960, background: `radial-gradient(ellipse at 50% 45%, rgba(110,180,230,${0.13 * on * flick}) 0%, rgba(0,0,0,0) 60%)` }} />
      {/* o televisor em 3D */}
      <div style={{ position: "absolute", left: 660 - TVW / 2, top: 530 - TVH / 2, width: TVW, height: TVH, perspective: 2300, perspectiveOrigin: "50% 45%" }}>
        <div style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d", transform: `translateY(${7 * Math.sin(f / 70)}px) translateZ(${-200 + 120 * inK}px) scale(${sc}) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${0.5 * Math.sin(f / 83)}deg)` }}>
          {/* laterais, topo e base (o tubo afunila para trás) */}
          <div style={{ position: "absolute", left: 0, top: 0, width: DEP, height: TVH, transformOrigin: "0 50%", transform: "rotateY(90deg)", border: "2px solid transparent", backgroundClip: "padding-box", boxSizing: "border-box", backfaceVisibility: "hidden", background: "linear-gradient(90deg, #2c3038 0%, #23262d 40%, #15171c 100%)", clipPath: "polygon(0 0, 100% 9%, 100% 91%, 0 100%)" }}>{vents(120)}</div>
          <div style={{ position: "absolute", left: TVW - DEP, top: 0, width: DEP, height: TVH, transformOrigin: "100% 50%", transform: "rotateY(-90deg)", border: "2px solid transparent", backgroundClip: "padding-box", boxSizing: "border-box", backfaceVisibility: "hidden", background: "linear-gradient(270deg, #343943 0%, #23262d 40%, #15171c 100%)", clipPath: "polygon(0 9%, 100% 0, 100% 100%, 0 91%)" }}>{vents(80)}</div>
          <div style={{ position: "absolute", left: 0, top: 0, width: TVW, height: DEP, transformOrigin: "50% 0", transform: "rotateX(-90deg)", border: "2px solid transparent", backgroundClip: "padding-box", boxSizing: "border-box", backfaceVisibility: "hidden", background: "linear-gradient(180deg, #3a3f48 0%, #1a1d22 100%)", clipPath: "polygon(0 0, 100% 0, 93% 100%, 7% 100%)" }} />
          <div style={{ position: "absolute", left: 0, top: TVH - DEP, width: TVW, height: DEP, transformOrigin: "50% 100%", transform: "rotateX(90deg)", border: "2px solid transparent", backgroundClip: "padding-box", boxSizing: "border-box", backfaceVisibility: "hidden", background: "#0d0f12", clipPath: "polygon(7% 0, 93% 0, 100% 100%, 0 100%)" }} />
          {/* a frente: moldura de plástico */}
          <div style={{ position: "absolute", inset: 0, borderRadius: 38, border: "2px solid transparent", backgroundClip: "padding-box", boxSizing: "border-box", backfaceVisibility: "hidden", background: "linear-gradient(165deg, #474c56 0%, #2a2e35 30%, #1b1e23 70%, #2b2f36 100%)", boxShadow: "inset 0 3px 0 rgba(255,255,255,0.14), inset 0 -4px 0 rgba(0,0,0,0.6)" }}>
            <div style={{ position: "absolute", left: SX - 26, top: SY - 26, width: SW + 52, height: SH + 52, borderRadius: "74px / 66px", background: "linear-gradient(160deg, #0c0d10, #1f2228)", boxShadow: "inset 0 10px 24px rgba(0,0,0,0.9), 0 1px 0 rgba(255,255,255,0.08)" }} />
            <div style={{ position: "absolute", left: SX, top: SY + SH + 46, width: 430, height: 84, borderRadius: 10, background: "repeating-linear-gradient(90deg, #0b0c0f 0 7px, #2a2e35 7px 11px)" }} />
            {[0, 1].map((k) => (
              <div key={k} style={{ position: "absolute", left: 640 + k * 110, top: SY + SH + 44, width: 78, height: 78, borderRadius: 39, background: "conic-gradient(from 20deg, #5a606b, #1e2126, #4a505a, #1e2126, #5a606b)", boxShadow: "0 6px 12px rgba(0,0,0,0.6), inset 0 2px 0 rgba(255,255,255,0.2)", transform: `rotate(${k ? 40 : -30 + (f >= backAt ? 60 : 0)}deg)` }}>
                <div style={{ position: "absolute", left: 36, top: 6, width: 6, height: 22, borderRadius: 3, background: "#0b0c0f" }} />
              </div>
            ))}
            <div style={{ position: "absolute", left: 870, top: SY + SH + 56, fontFamily: MONO, fontSize: 30, color: "#ff5a3a", textShadow: "0 0 10px rgba(255,90,58,0.8)", opacity: on }}>03</div>
            <div style={{ position: "absolute", left: 880, top: SY + SH + 104, width: 12, height: 12, borderRadius: 6, background: "#ff3a2a", boxShadow: "0 0 12px #ff3a2a", opacity: 0.5 + 0.5 * on }} />
            {/* a tela */}
            <div style={{ position: "absolute", left: SX, top: SY, width: SW, height: SH, borderRadius: "64px / 56px", overflow: "hidden", background: "#030405", boxShadow: "0 0 50px rgba(120,190,230,0.25)" }}>
              <div style={{ position: "absolute", inset: 0, transform: `translateX(${tear}px) scale(${0.02 + 0.98 * on}, ${0.006 + 0.994 * P(f, 10, 12)})`, filter: `url(#wtvRGB) brightness(${1.45 * flick}) contrast(1.18) saturate(${1.1 - 0.5 * tint}) sepia(${0.25 * tint}) hue-rotate(${-25 * tint}deg)` }}>
                <div style={{ position: "absolute", left: 0, top: 0, width: 960, height: 720, transform: `scale(${SW / 960})`, transformOrigin: "0 0" }}>
                  <div style={{ position: "absolute", inset: 0, transform: `scale(${zoom})`, transformOrigin: org }}>
                    <Sequence from={0} durationInFrames={Math.max(1, womanAt + 6)} premountFor={30}><Clip src={SRC} from={0} /></Sequence>
                    <Sequence from={womanAt} durationInFrames={Math.max(1, backAt - womanAt + 4)} premountFor={30}><Clip src={SRC} from={2} /></Sequence>
                    {Array.from({ length: RW / 3 }, (_, k) => (
                      <Sequence key={k} from={backAt + k * 3} durationInFrames={3} premountFor={20}><Clip src={SRC} from={Math.max(0.5, 30 - k * 1.3)} /></Sequence>
                    ))}
                    <Sequence from={slow} durationInFrames={Math.max(1, life - slow)} premountFor={30}><Clip src={SRC} from={4} rate={0.55} /></Sequence>
                  </div>
                </div>
              </div>
              {rw ? Array.from({ length: 4 }, (_, k) => (
                <div key={k} style={{ position: "absolute", left: 0, right: 0, top: (rwq * 37 + k * 151) % SH, height: 18 + ((k * 13) % 30), background: "rgba(220,235,255,0.22)", filter: "blur(2px)", transform: `translateX(${(k % 2 ? 1 : -1) * 30}px)` }} />
              )) : null}
              {/* máscara de fósforo, varredura, faixa de zumbido, chuvisco */}
              <AbsoluteFill style={{ background: "repeating-linear-gradient(90deg, rgba(255,60,60,0.10) 0 1px, rgba(60,255,90,0.10) 1px 2px, rgba(70,110,255,0.10) 2px 3px)", mixBlendMode: "multiply" }} />
              <AbsoluteFill style={{ background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.34) 0 2px, rgba(0,0,0,0) 2px 4px)" }} />
              <div style={{ position: "absolute", left: 0, right: 0, top: roll, height: 130, background: "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(200,230,255,0.08) 50%, rgba(255,255,255,0) 100%)" }} />
              <AbsoluteFill style={{ backgroundImage: `url(${staticFile("videos/hl3_M01_R/grao.png")})`, backgroundPosition: `${grainX}px ${grainY}px`, opacity: rw ? 0.5 : 0.16, mixBlendMode: "screen" }} />
              {/* o vidro curvo: vinheta do tubo, brilho nas bordas, reflexo */}
              <AbsoluteFill style={{ background: "radial-gradient(ellipse 72% 70% at 50% 50%, rgba(0,0,0,0) 58%, rgba(0,0,0,0.55) 88%, rgba(0,0,0,0.92) 100%)" }} />
              <AbsoluteFill style={{ boxShadow: "inset 0 0 70px rgba(140,210,255,0.16)" }} />
              <div style={{ position: "absolute", left: -120, top: -200, width: 640, height: 420, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0.03) 50%, rgba(255,255,255,0) 70%)", transform: `translateX(${(ry + 17) * 6}px)` }} />
              <div style={{ position: "absolute", right: 40, bottom: 30, width: 260, height: 70, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(255,255,255,0.05), rgba(255,255,255,0) 70%)" }} />
              <div style={{ position: "absolute", left: 46, top: 34, fontFamily: MONO, fontSize: 22, letterSpacing: 3, color: "#9dffb0", textShadow: "0 0 8px rgba(120,255,150,0.8)", opacity: on }}>{osd}</div>
              <div style={{ position: "absolute", right: 50, top: 34, fontFamily: MONO, fontSize: 18, letterSpacing: 3, color: "rgba(230,245,255,0.8)", opacity: on }}>HALF-LIFE: ALYX</div>
            </div>
          </div>
        </div>
      </div>
      {/* as frases, na coluna da direita */}
      <div style={{ position: "absolute", left: 1350, top: 400, width: 520 }}>
        <WStamp f={f} a={18} b={Math.min(330, womanAt) - 12} t="A ideia que veio antes de tudo" s="GUARDADA PARA O FINAL" col={VIO} />
        <WStamp f={f} a={342} b={womanAt - 12} t="Contar no começo" s="SERIA SPOILER DO QUE VEM DEPOIS" col={VIO} />
        <WStamp f={f} a={womanAt} b={presAt - 10} t="Uma mulher misteriosa" s="LIGADA AOS COMBINE · PERTO DO COFRE" />
        <WStamp f={f} a={presAt} b={voiceAt - 10} t="Quase só uma presença" s="A GENTE NÃO VÊ ELA DIREITO" col={ICE} />
        <WStamp f={f} a={voiceAt} b={moveAt - 10} t="A voz" s="MUITO PARECIDA COM A DA ALYX" />
        <WStamp f={f} a={moveAt} b={knowsAt - 10} t="“Movam o cofre”" s="ANTES QUE SEJA TARDE DEMAIS" col={ICE} />
        <WStamp f={f} a={knowsAt} b={advAt - 10} t="Como se soubesse" s="O QUE VAI ACONTECER" col={GOLD} />
        <WStamp f={f} a={advAt} b={lineAt - 10} t="Os Advisors" s="NÃO A VEEM" col={ICE} />
        <WStamp f={f} a={lineAt} b={backAt - 10} t="E se ela for a Alyx?" s="UMA ALYX DE OUTRO MOMENTO" />
        <WStamp f={f} a={slow} b={slow + 270} t="O Borealis" s="LEVA MATÉRIA PARA OUTROS PONTOS DA LINHA DO TEMPO" col={VIO} />
        <WStamp f={f} a={slow + 285} b={ensureAt - 10} t="A Alyx usa o navio" s="E VOLTA ATÉ HALF-LIFE: ALYX" />
        <WStamp f={f} a={ensureAt} b={vaultAt - 10} t="Não para mudar a história" s="PARA GARANTIR QUE ELA ACONTEÇA" col={GOLD} />
        <WStamp f={f} a={vaultAt} b={trustAt - 10} t="Aconselha mover o cofre" s={f >= knowAt ? "SABENDO QUE NÃO VÃO MOVER" : "AOS ADVISORS"} col={ICE} />
        <WStamp f={f} a={trustAt} b={meetAt - 10} t="Para ganhar a confiança deles" s="ANOS ANTES DE SE JUNTAR AOS COMBINE" />
        <WStamp f={f} a={meetAt} b={meetAt + 160} t="A jovem Alyx precisa encontrar o G-Man" s="E LIBERTAR ELE" col={GOLD} />
        <WStamp f={f} a={meetAt + 170} b={life - 14} t="O encontro que a coloca no caminho" s="PARA UM DIA QUEBRAR A CONVERGÊNCIA" col={ORANGE} />
      </div>
      <AbsoluteFill style={{ background: "#000", opacity: interpolate(f, [0, 8], [1, 0], C) + interpolate(f, [life - 6, life], [0, 1], C), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};
