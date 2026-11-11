import React, { useContext, useLayoutEffect, useRef } from "react";
import { AbsoluteFill, Easing, Img, Loop, OffthreadVideo, Sequence, Series, Video, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { FONT, MONO } from "./overlays";
import { LiteCtx } from "./sfx-ctx";

// Projeto "Como eu faria Half-Life 3" (vídeo horizontal 1920x1080, só voz).
// Linguagem cinematográfica: a câmera viaja por uma nebulosa (roxo, azul-gelo, um toque de laranja),
// trechos de vídeo saem do escuro, tipografia grande entra por cima, quadros de vidro flutuam no espaço.
// Tempos das props chegam em QUADROS relativos ao início da cena (o registry converte `at`, `...At`, `dur`).
// `from` (ponto do clipe) fica em SEGUNDOS.

export const HL = {
  bg: "#05040a",
  violet: "#6b3fd4",
  ice: "#9fd8ff",
  orange: "#ff8a1f",
  text: "#f2f0f7",
  dim: "rgba(242,240,247,0.6)",
  line: "rgba(255,255,255,0.16)",
};

export type Clamp = { extrapolateLeft: "clamp"; extrapolateRight: "clamp"; easing?: (t: number) => number };
export const C: Clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" };
export const OUT: Clamp = { ...C, easing: Easing.out(Easing.cubic) };
export const INOUT: Clamp = { ...C, easing: Easing.inOut(Easing.cubic) };
export const EXPO_IN: Clamp = { ...C, easing: Easing.in(Easing.exp) };
export const lerp = (f: number, a: number, b: number, from: number, to: number, e: Clamp = INOUT) => interpolate(f, [a, b], [from, to], e);

// pseudo-aleatório determinístico (mesma cena em todo quadro e em todo render)
export const rnd = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// GLITCH de verdade (não piscada chapada): o PRÓPRIO conteúdo é deslocado em faixas horizontais (feDisplacementMap com
// ruído em degraus), os canais de cor se separam (vermelho para um lado, verde/azul para o outro) e tudo dá um tranco.
// `amt` 0..1 (0 = sem filtro). Cada uso precisa de um `id` único na tela.
export const GlitchWrap: React.FC<{ f: number; amt: number; id: string; style?: React.CSSProperties; children: React.ReactNode }> = ({ f, amt, id, style, children }) => {
  const lite = useContext(LiteCtx);
  const on = amt > 0.001 && !lite;
  if (lite && amt > 0.001)
    return <AbsoluteFill style={{ ...style, transform: `translate(${(rnd(f * 13 + 1) - 0.5) * 30 * amt}px, 0)`, filter: `saturate(${1 + amt}) contrast(${1 + 0.3 * amt})` }}>{children}</AbsoluteFill>;
  const seed = Math.floor(f * 7 + 3) % 97;
  const disp = 14 + 150 * amt;
  const rgb = 3 + 18 * amt;
  const jx = on ? (rnd(f * 13 + 1) - 0.5) * 30 * amt : 0;
  const jy = on ? (rnd(f * 17 + 2) - 0.5) * 8 * amt : 0;
  const bands = [0.5, 0.5, 0.5, 0.15, 0.5, 0.85, 0.5, 0.5, 0.3, 0.5, 0.5, 0.95, 0.5, 0.05, 0.5, 0.5].map((v, k) => (rnd(seed * 31 + k) > 0.5 ? v : 0.5)).join(" ");
  return (
    <AbsoluteFill style={{ ...style, filter: on ? `url(#${id})` : undefined, transform: on ? `translate(${jx}px, ${jy}px)` : undefined }}>
      {on ? (
        <svg width={0} height={0} style={{ position: "absolute" }}>
          <filter id={id} x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency={`0.00001 ${(0.004 + 0.02 * rnd(seed)).toFixed(4)}`} numOctaves={1} seed={seed} result="n" />
            <feComponentTransfer in="n" result="nb">
              <feFuncR type="discrete" tableValues={bands} />
            </feComponentTransfer>
            <feColorMatrix in="nb" type="matrix" values="1 0 0 0 0  0 0 0 0 0.5  0 0 0 0 0  0 0 0 0 1" result="map" />
            <feDisplacementMap in="SourceGraphic" in2="map" scale={disp} xChannelSelector="R" yChannelSelector="G" result="d" />
            <feColorMatrix in="d" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
            <feOffset in="r" dx={rgb} dy={0} result="ro" />
            <feColorMatrix in="d" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" result="gb" />
            <feOffset in="gb" dx={-rgb * 0.6} dy={0} result="gbo" />
            <feBlend in="ro" in2="gbo" mode="screen" />
          </filter>
        </svg>
      ) : null}
      {children}
    </AbsoluteFill>
  );
};
// intensidade do glitch num quadro, a partir de rajadas {at (quadro), k} de 5 quadros cada (3 era curto demais: o som
// tocava e o olho não pegava o tranco)
export const GLITCH_LEN = 5;
export const glitchAmt = (f: number, hits: { at: number; k?: number }[]) =>
  hits.reduce((m, g) => {
    const d = f - g.at;
    return d >= 0 && d < GLITCH_LEN ? Math.max(m, (g.k ?? 1) * (1 - d * 0.14)) : m;
  }, 0);

// ---------------------------------------------------------------------------------------------
// FUNDO: viagem pela nebulosa. Camadas de nuvem crescem e somem em sequência (a câmera atravessa),
// estrelas vêm do fundo com rastro. Quadro ABSOLUTO: a viagem nunca para entre cenas.
// ---------------------------------------------------------------------------------------------
// (06/11/2026, desempenho) as nuvens já vêm com a borda em degradê gravada no próprio PNG (nebula_Nm.png = a máscara
// radial antiga "closest-side, #000 55% → transparente 100%" aplicada no canal alfa, pixel a pixel). Mesma imagem; o
// navegador não precisa mais calcular a máscara em 6 camadas gigantes a cada quadro.
const NEB = ["hl3/nebula_1m.png", "hl3/nebula_2m.png", "hl3/nebula_3m.png"];
const NEB_LAYERS = 6;
const NEB_CYCLE = 16; // s que uma camada leva do fundo até passar pela câmera

const Starfield: React.FC<{ t: number; speed: number; trail?: number }> = ({ t, speed, trail = 1 }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const c = ref.current;
    if (!c) return;
    const g = c.getContext("2d")!;
    g.clearRect(0, 0, 1920, 1080);
    const N = 700;
    const fov = 620;
    for (let i = 0; i < N; i++) {
      const x = (rnd(i) - 0.5) * 2600;
      const y = (rnd(i + 999) - 0.5) * 1600;
      const life = 5 + rnd(i + 77) * 4;
      const z = 1 - (((t * speed) / life + rnd(i + 55)) % 1); // 1 = longe, 0 = na câmera
      const zz = 0.04 + z * 1.6;
      const sx = 960 + (x / zz) * (fov / 1000);
      const sy = 540 + (y / zz) * (fov / 1000);
      if (sx < -50 || sx > 1970 || sy < -50 || sy > 1130) continue;
      const zp = 0.04 + Math.min(1, z + 0.035 * speed * trail) * 1.6; // posição um pouco antes: rastro (encolhe quando a viagem para)
      const px = 960 + (x / zp) * (fov / 1000);
      const py = 540 + (y / zp) * (fov / 1000);
      const near = 1 - z;
      const a = Math.min(1, near * 1.4) * (0.35 + 0.65 * rnd(i + 3)) * Math.min(1, z * 8);
      const hue = rnd(i + 11);
      g.strokeStyle = hue > 0.85 ? `rgba(255,190,140,${a})` : hue > 0.55 ? `rgba(180,215,255,${a})` : `rgba(235,230,255,${a})`;
      g.lineWidth = 0.6 + near * 2.2;
      g.lineCap = "round";
      g.beginPath();
      g.moveTo(px, py);
      g.lineTo(sx, sy);
      g.stroke();
    }
  }, [t, speed, trail]);
  return <canvas ref={ref} width={1920} height={1080} style={{ position: "absolute", inset: 0 }} />;
};

export const HLSpace: React.FC<{ speed?: number; freezeAt?: number; jumpAt?: number; covered?: (f: number) => boolean }> = ({ speed = 1, freezeAt, jumpAt, covered }) => {
  const f = useCurrentFrame();
  // todos os hooks ANTES de qualquer return (07/11: o return antecipado vinha antes do useVideoConfig → erro React #300
  // e o player quebrava nas cenas opacas, ex.: TV Combine em 1:46 e 1:49)
  const { fps } = useVideoConfig();
  // prévia: uma cena opaca cobre a tela inteira → o espaço não aparece; não precisa desenhar
  if (covered?.(f)) return <AbsoluteFill style={{ background: HL.bg }} />;
  const t0 = f / fps;
  // `freezeAt`: a viagem desacelera e congela em 1,2 s ("oficialmente, nada")
  // `jumpAt`: SALTO — o espaço congelado dispara em hipervelocidade (pico em jumpAt) e volta ao normal
  const D = 1.2;
  let t = freezeAt === undefined || t0 < freezeAt ? t0 : freezeAt + (D / 2) * (1 - Math.pow(1 - Math.min(1, (t0 - freezeAt) / D), 2));
  let trail = freezeAt === undefined || t0 < freezeAt ? 1 : Math.max(0.04, 1 - Math.min(1, (t0 - freezeAt) / D)); // velocidade relativa
  if (jumpAt !== undefined && t0 > jumpAt - 0.5) {
    const vel = (u: number) => (u < 0.5 ? 9 * Math.pow(u / 0.5, 2) : 1 + 8 * Math.exp(-(u - 0.5) / 0.45));
    const u = t0 - (jumpAt - 0.5);
    const N = Math.min(400, Math.ceil(u / 0.01));
    let acc = 0;
    for (let k = 0; k < N; k++) acc += vel((k + 0.5) * (u / N)) * (u / N);
    const base = freezeAt !== undefined && freezeAt < jumpAt ? freezeAt + D / 2 : jumpAt - 0.5;
    t = base + acc;
    trail = Math.min(7, vel(u));
  }
  return (
    <AbsoluteFill style={{ background: HL.bg, overflow: "hidden" }}>
      <AbsoluteFill style={{ background: "radial-gradient(70% 70% at 50% 50%, rgba(60,30,120,0.35) 0%, rgba(5,4,10,0) 70%)" }} />
      {Array.from({ length: NEB_LAYERS }).map((_, i) => {
        const p = ((t * speed) / NEB_CYCLE + i / NEB_LAYERS) % 1; // 0 = fundo, 1 = passou
        const scale = 0.55 * Math.exp(p * 2.3);
        const o = Math.sin(p * Math.PI) ** 1.4 * (i % 3 === 2 ? 0.55 : 0.85);
        const rot = (i % 2 ? 1 : -1) * (8 + p * 14) + i * 47;
        const dx = (rnd(i + 5) - 0.5) * 500 * (1 - p);
        const dy = (rnd(i + 9) - 0.5) * 260 * (1 - p);
        return (
          <Img
            key={i}
            src={staticFile(NEB[i % 3])}
            style={{
              position: "absolute",
              left: -64,
              top: -36,
              width: 2048,
              height: 1152,
              opacity: o,
              transform: `translate3d(${dx}px, ${dy}px, 0) rotate(${rot}deg) scale(${scale})`,
              mixBlendMode: "screen",
              willChange: "transform, opacity",
            }}
          />
        );
      })}
      <Starfield t={t} speed={speed} trail={trail} />
      <AbsoluteFill style={{ background: "radial-gradient(130% 100% at 50% 50%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.7) 100%)" }} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// Vídeo (prévia leve no Estúdio, OffthreadVideo no render)
// ---------------------------------------------------------------------------------------------
export const Clip: React.FC<{ src: string; from: number; rate?: number; style?: React.CSSProperties }> = ({ src, from, rate = 1, style }) => {
  const lite = useContext(LiteCtx);
  const { fps } = useVideoConfig();
  const s: React.CSSProperties = { width: "100%", height: "100%", objectFit: "cover", ...style };
  const startFrom = Math.round(from * fps);
  return lite ? (
    <Video src={staticFile(src)} startFrom={startFrom} playbackRate={rate} muted style={s} acceptableTimeShiftInSeconds={0.6} />
  ) : (
    <OffthreadVideo src={staticFile(src)} startFrom={startFrom} playbackRate={rate} muted style={s} />
  );
};

// ---------------------------------------------------------------------------------------------
// ANO: "2026" nasce no fundo do espaço, a câmera se aproxima e atravessa o número.
// ---------------------------------------------------------------------------------------------
export const HLYear: React.FC<{ life: number; text?: string; revealAt?: number; flyAt?: number; size?: number }> = ({ life, text = "2026", revealAt = 6, flyAt = 110, size = 340 }) => {
  const f = useCurrentFrame();
  void life;
  const approach = lerp(f, 0, flyAt, 0.82, 1.12, C);
  const fly = lerp(f, flyAt, flyAt + 16, 0, 1, EXPO_IN);
  const scale = approach * (1 + fly * 9);
  const opacity = 1 - lerp(f, flyAt + 8, flyAt + 16, 0, 1, C);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          position: "absolute",
          width: 1300,
          height: 640,
          borderRadius: "50%",
          background: "radial-gradient(closest-side, rgba(120,70,230,0.45), rgba(120,70,230,0))",
          opacity: lerp(f, revealAt, revealAt + 30, 0, 1, OUT) * (1 - fly),
          transform: `scale(${1 + fly * 3})`,
        }}
      />
      <div
        style={{
          fontFamily: FONT,
          fontWeight: 800,
          fontSize: size,
          letterSpacing: -12 * (size / 340),
          lineHeight: 1,
          color: HL.text,
          transform: `scale(${scale})`,
          opacity,
          filter: fly > 0.05 ? `blur(${fly * 14}px)` : undefined,
        }}
      >
        {text.split("").map((ch, i) => {
          const a = revealAt + i * 4;
          const p = lerp(f, a, a + 22, 0, 1, OUT);
          return (
            <span key={i} style={{ display: "inline-block", whiteSpace: "pre", opacity: p, transform: `translate3d(0, ${(1 - p) * 60}px, 0)`, filter: p < 1 ? `blur(${(1 - p) * 16}px)` : undefined }}>
              {ch}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// TRECHO DE VÍDEO que sai do escuro: tela cheia com bordas que se dissolvem no espaço, empurrão
// lento de câmera, cortes entre planos (flash, chicote, fusão) e título grande por cima.
// ---------------------------------------------------------------------------------------------
// `xf`: duração da fusão em quadros (padrão 14) · src .jpg/.png = quadro parado (03/11: cenas em quadros que se dissolvem)
type Shot = { src: string; from: number; at: number; dur: number; rate?: number; fx?: "flash" | "whip" | "fade" | "glitch" | "cut"; fit?: "cover" | "contain"; xf?: number };
const isStill = (src: string) => /\.(jpe?g|png|webp)$/i.test(src);

const ShotView: React.FC<{ s: Shot }> = ({ s }) => {
  const f = useCurrentFrame();
  const fx = s.fx ?? "cut";
  let style: React.CSSProperties = {};
  if (fx === "whip") {
    const x = lerp(f, 0, 10, 700, 0, OUT);
    style = { transform: `translateX(${x}px) skewX(${-x / 90}deg)`, filter: x > 5 ? `blur(${x / 30}px)` : undefined };
  } else if (fx === "fade") {
    style = { opacity: lerp(f, 0, s.xf ?? 14, 0, 1, s.xf ? INOUT : OUT) };
  } else if (fx === "glitch") {
    const pulse = Math.max(0, 1 - Math.abs(f - 22) / 7);
    const jitter = pulse * (f % 3 === 0 ? -9 : f % 3 === 1 ? 6 : -3);
    style = {
      transform: `translateX(${jitter}px) scale(${1 + pulse * 0.006})`,
      filter: pulse > 0 ? `contrast(${1 + pulse * 0.45}) saturate(${1 + pulse * 0.35})` : undefined,
    };
  }
  const flash = fx === "flash" ? interpolate(f, [0, 2, 12], [0.95, 0.7, 0], C) : 0;
  const glitch = fx === "glitch" ? Math.max(0, 1 - Math.abs(f - 22) / 7) : 0;
  return (
    <AbsoluteFill style={style}>
      {isStill(s.src) ? (
        <Img src={staticFile(s.src)} style={{ width: "100%", height: "100%", objectFit: s.fit ?? "cover" }} />
      ) : (
        <Clip src={s.src} from={s.from} rate={s.rate} style={{ objectFit: s.fit ?? "cover" }} />
      )}
      {flash > 0 ? <AbsoluteFill style={{ background: "#fff", opacity: flash }} /> : null}
      {glitch > 0 ? (
        <AbsoluteFill
          style={{
            opacity: glitch * 0.18,
            mixBlendMode: "screen",
            background: "repeating-linear-gradient(0deg, rgba(80,220,255,0.8) 0 3px, transparent 3px 13px, rgba(255,90,60,0.65) 13px 15px, transparent 15px 27px)",
            transform: `translateY(${f % 2 ? -5 : 4}px)`,
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};

export const TitleBlock: React.FC<{ title: string; sub?: string; at: number; out?: number; align?: "left" | "right" }> = ({ title, sub, at, out = 1e9, align = "left" }) => {
  const f = useCurrentFrame();
  const o = lerp(f, out, out + 12, 1, 0, C);
  const line = lerp(f, at + 4, at + 26, 0, 1, OUT);
  const subP = lerp(f, at + 12, at + 28, 0, 1, OUT);
  if (f < at) return null;
  return (
    <div
      style={{
        position: "absolute",
        [align]: 110,
        bottom: 120,
        textAlign: align,
        opacity: o,
        color: HL.text,
      }}
    >
      <div style={{ height: 2, width: 120 * line, background: HL.orange, boxShadow: `0 0 16px ${HL.orange}`, marginBottom: 26, marginLeft: align === "right" ? "auto" : 0 }} />
      <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 112, letterSpacing: -4, lineHeight: 0.98, textShadow: "0 10px 60px rgba(0,0,0,0.75)" }}>
        {title.split("").map((ch, i) => {
          const p = lerp(f, at + i * 1.2, at + i * 1.2 + 14, 0, 1, OUT);
          return (
            <span key={i} style={{ display: "inline-block", whiteSpace: "pre", opacity: p, transform: `translate3d(0, ${(1 - p) * 40}px, 0)`, filter: p < 1 ? `blur(${(1 - p) * 10}px)` : undefined }}>
              {ch}
            </span>
          );
        })}
      </div>
      {sub ? (
        <div style={{ fontFamily: MONO, fontSize: 26, letterSpacing: 6, textTransform: "uppercase", color: "rgba(242,240,247,0.78)", marginTop: 18, opacity: subP, transform: `translateY(${(1 - subP) * 12}px)`, textShadow: "0 4px 20px rgba(0,0,0,0.8)" }}>
          {sub}
        </div>
      ) : null}
    </div>
  );
};

// 03/11 (pedido dele: "tem que ter um cardzinho de identificação de que esse cara é o Varga"): crachá de quem está em
// cena por cima do plano 3D — retrato, nome e o que ele está fazendo; entra deslizando e sai sumindo
type FootCard = { at: number; outAt: number; img?: string; name: string; sub?: string; sub2?: string; sub2At?: number; col?: string; quote?: string; quoteAt?: number; quoteOutAt?: number };
const FootIdCard: React.FC<{ c: FootCard; top?: number }> = ({ c, top = 150 }) => {
  const f = useCurrentFrame();
  const qOut = c.quoteOutAt ?? c.outAt;
  if (f < c.at || f >= Math.max(c.outAt, c.quote ? qOut : 0)) return null;
  const col = c.col ?? HL.orange;
  const p = lerp(f, c.at, c.at + 14, 0, 1, OUT) * (1 - lerp(f, c.outAt - 10, c.outAt, 0, 1, INOUT));
  const q = c.quote ? lerp(f, c.quoteAt ?? c.at, (c.quoteAt ?? c.at) + 12, 0, 1, OUT) * (1 - lerp(f, qOut - 12, qOut, 0, 1, INOUT)) : 0;
  const sub = c.sub2 && c.sub2At !== undefined && f >= c.sub2At ? c.sub2 : c.sub;
  return (
    <>
      <div style={{ position: "absolute", left: 90, top, width: 520, display: f < c.outAt ? "flex" : "none", gap: 16, padding: 14, borderRadius: 12, background: "rgba(10,8,4,0.88)", border: `1.5px solid ${col}`, fontFamily: MONO, opacity: p, transform: `translateX(${(1 - p) * -50}px)` }}>
        <div style={{ flex: "0 0 104px", height: 126, borderRadius: 8, border: `1px solid ${col}`, background: "#0a0612", backgroundImage: c.img ? `url(${staticFile(c.img)})` : undefined, backgroundSize: "cover", backgroundPosition: "50% 30%" }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ fontSize: 13, letterSpacing: 4, color: col }}>IDENTIFICADO</div>
          <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 44, letterSpacing: 1, color: HL.text, lineHeight: 1.05, marginTop: 4 }}>{c.name}</div>
          {sub ? <div style={{ fontSize: 16, letterSpacing: 3, color: "rgba(242,240,247,0.75)", marginTop: 8, lineHeight: 1.35 }}>{sub}</div> : null}
        </div>
      </div>
      {c.quote && f >= (c.quoteAt ?? c.at) ? (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 150, textAlign: "center", fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: "italic", fontSize: 50, color: "#f2ead8", textShadow: "0 4px 30px #000", opacity: q }}>
          “{c.quote}”
          <div style={{ fontFamily: MONO, fontStyle: "normal", fontSize: 16, letterSpacing: 5, color: col, marginTop: 10 }}>{c.name}</div>
        </div>
      ) : null}
    </>
  );
};

// 03/11 (pedido dele: "ter outros elementos na tela sem ser a foto, sem ser um print seco"): por cima dos quadros
// parados — mira do HUD travando em quem está em cena, com o nome digitando, e a legenda curta de cada quadro
// `path`: [[segundos desde o início da cena, x, y], ...] — a mira acompanha o alvo enquanto a câmera anda
type FootTag = { at: number; outAt: number; x: number; y: number; w?: number; h?: number; text: string; sub?: string; col?: string; path?: [number, number, number][] };
const FootTagView: React.FC<{ t: FootTag }> = ({ t }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig(); // hooks antes do return (senão o React quebra ao pular no scrub)
  if (f < t.at || f >= t.outAt) return null;
  const col = t.col ?? HL.orange;
  const w = t.w ?? 140;
  const h = t.h ?? 160;
  const k = lerp(f, t.at, t.at + 10, 1.45, 1, OUT); // a mira fecha no alvo
  const blink = f - t.at < 10 && (f - t.at) % 3 === 0 ? 0.35 : 1;
  const o = lerp(f, t.outAt - 8, t.outAt, 1, 0, INOUT) * blink;
  const n = Math.floor(lerp(f, t.at + 6, t.at + 6 + t.text.length * 1.4, 0, t.text.length, C));
  const c = 22; // tamanho da quina
  let x = t.x;
  let y = t.y;
  if (t.path && t.path.length > 1) {
    const ts = t.path.map((q) => q[0] * fps);
    x = interpolate(f, ts, t.path.map((q) => q[1]), C);
    y = interpolate(f, ts, t.path.map((q) => q[2]), C);
  }
  const corner = (l: boolean, tp: boolean): React.CSSProperties => ({ position: "absolute", width: c, height: c, [l ? "left" : "right"]: 0, [tp ? "top" : "bottom"]: 0, [l ? "borderLeft" : "borderRight"]: `3px solid ${col}`, [tp ? "borderTop" : "borderBottom"]: `3px solid ${col}` });
  return (
    <div style={{ position: "absolute", left: x - w / 2, top: y - h / 2, width: w, height: h, opacity: o, filter: `drop-shadow(0 0 6px ${col})` }}>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${k})` }}>
        <div style={corner(true, true)} />
        <div style={corner(false, true)} />
        <div style={corner(true, false)} />
        <div style={corner(false, false)} />
      </div>
      <div style={{ position: "absolute", left: 0, bottom: h + 10, whiteSpace: "nowrap", fontFamily: MONO, color: HL.text, textShadow: "0 2px 10px #000" }}>
        <div style={{ fontSize: 22, letterSpacing: 4, fontWeight: 700 }}>{t.text.slice(0, n)}</div>
        {t.sub && n >= t.text.length ? <div style={{ fontSize: 15, letterSpacing: 3, color: col, marginTop: 4 }}>{t.sub}</div> : null}
      </div>
    </div>
  );
};

type FootStamp = { at: number; outAt: number; text: string; sub?: string; col?: string };
const FootStampView: React.FC<{ s: FootStamp; size?: number; maxW?: number }> = ({ s, size = 38, maxW }) => {
  const f = useCurrentFrame();
  if (f < s.at || f >= s.outAt) return null;
  const col = s.col ?? HL.orange;
  const p = lerp(f, s.at, s.at + 12, 0, 1, OUT) * lerp(f, s.outAt - 10, s.outAt, 1, 0, INOUT);
  const n = Math.floor(lerp(f, s.at + 4, s.at + 4 + s.text.length * 1.2, 0, s.text.length, C));
  return (
    <div style={{ position: "absolute", left: 90, top: 130, fontFamily: MONO, opacity: p, textShadow: "0 3px 16px rgba(0,0,0,0.9)" }}>
      <div style={{ height: 2, width: 90 * p, background: col, boxShadow: `0 0 12px ${col}`, marginBottom: 14 }} />
      <div style={{ fontSize: size, letterSpacing: 6, fontWeight: 700, color: HL.text, maxWidth: maxW, lineHeight: 1.25 }}>{s.text.slice(0, n)}</div>
      {s.sub ? <div style={{ fontSize: 18, letterSpacing: 4, color: col, marginTop: 8, opacity: lerp(f, s.at + 14, s.at + 26, 0, 1, OUT) }}>{s.sub}</div> : null}
    </div>
  );
};

export const HLFootage: React.FC<{
  life: number;
  shots: Shot[];
  title?: string;
  sub?: string;
  titleAt?: number;
  titleOutAt?: number;
  align?: "left" | "right";
  credit?: string;
  revealDur?: number;
  outAt?: number;
  still?: boolean; // corte seco estático: entra já com a gradação, sem zoom nem deriva
  full?: boolean; // depois de revelado cobre a tela INTEIRA (a máscara oval deixava a nebulosa aparecer nos cantos)
  cards?: FootCard[];
  tags?: FootTag[];
  stamps?: FootStamp[];
}> = ({ life, shots, title, sub, titleAt = 0, titleOutAt = 1e9, align = "left", credit, revealDur = 24, outAt = 1e9, still, full, cards, tags, stamps }) => {
  const f = useCurrentFrame();
  // sai do escuro: a máscara abre do centro e a exposição sobe
  const r = revealDur > 0 ? lerp(f, 0, revealDur, 0, 1, OUT) : 1; // revealDur 0 = corte seco
  const ex = lerp(f, outAt, outAt + 18, 0, 1, INOUT); // saída: recua para o espaço
  // corte seco (revealDur 0): começa sem zoom e com a gradação entrando aos poucos, para emendar
  // sem salto num plano anterior que já ocupa a tela (ex.: quadro que cresce até a tela cheia)
  const seam = revealDur > 0 || still ? 1 : lerp(f, 0, 14, 0, 1, INOUT);
  const push = still ? 1 : 1 + 0.04 * seam + lerp(f, 0, life, 0, 0.07, C);
  const drift0 = seam;
  const drift = still ? 0 : Math.sin(f / 70) * 10 * (revealDur > 0 ? 1 : lerp(f, 0, 30, 0, 1, INOUT));
  const mw = 400 + r * (full ? 3400 : 1500);
  const mh = 240 + r * (full ? 2300 : 900);
  const mask = `radial-gradient(ellipse ${mw}px ${mh}px at 50% 50%, #000 55%, rgba(0,0,0,0) 100%)`;
  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          maskImage: mask,
          WebkitMaskImage: mask,
          opacity: (0.25 + 0.75 * r) * (1 - ex),
          transform: `translate3d(${drift}px, 0, 0) scale(${push * (1 - 0.35 * ex)})`,
        }}
      >
        {shots.map((s, i) => {
          // se o próximo plano entra com fusão/chicote, este continua por baixo até a entrada terminar
          // (senão o espaço roxo do fundo aparece no meio da transição)
          const nx = shots[i + 1];
          // corte seco também: o plano de baixo segura alguns quadros (na prévia o vídeo novo pode demorar a pintar e o roxo aparecia)
          const hold = nx && (nx.fx === "fade" || nx.fx === "whip") ? Math.max(16, (nx.xf ?? 0) + 4) : nx ? 8 : 0;
          return (
            <Sequence key={i} from={s.at} durationInFrames={Math.max(1, (i === shots.length - 1 ? Math.max(s.dur, life - s.at) : s.dur) + hold)} premountFor={30}>
              <ShotView s={s} />
            </Sequence>
          );
        })}
        {/* gradação: leve escurecimento embaixo para o título e um véu roxo nas sombras */}
        <AbsoluteFill style={{ background: "linear-gradient(0deg, rgba(5,4,10,0.75) 0%, rgba(5,4,10,0) 45%)", opacity: seam }} />
        <AbsoluteFill style={{ background: "rgba(40,20,90,0.16)", mixBlendMode: "soft-light", opacity: seam }} />
      </AbsoluteFill>
      {title ? <TitleBlock title={title} sub={sub} at={titleAt} out={Math.min(titleOutAt, outAt)} align={align} /> : null}
      {(tags ?? []).map((t, i) => <FootTagView key={i} t={t} />)}
      {(stamps ?? []).map((t, i) => <FootStampView key={i} s={t} />)}
      {(cards ?? []).map((c, i) => <FootIdCard key={i} c={c} />)}
      {credit ? (
        <div style={{ position: "absolute", right: 44, bottom: 34, fontFamily: MONO, fontSize: 15, letterSpacing: 2, color: "rgba(242,240,247,0.45)", opacity: r * (1 - ex) }}>
          {credit}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// TV DE TUBO COMBINE (03/11, pedido dele: "isso ser dentro de uma TV combine, de alta qualidade, aquelas TV de tubo"):
// os planos 4:3 (cena congelada, só a câmera anda) passam na tela de um monitor da Overwatch; em volta, o painel com
// feed, REC, tempo, sinal e a lista dos alvos marcados. `tags` em pixels da imagem 1200x900; `stamps`/`cards` no painel.
// ---------------------------------------------------------------------------------------------
// 05/11 (ele: "coloca todos os outros nessa TV 3D que você fez"): o monitor virou o televisor de tubo em 3D da cena da
// mulher misteriosa (hl3woman): gabinete com profundidade e grade, tela abaulada, separação RGB e máscara de fósforo.
// A tela continua 4:3 e tudo de dentro (planos, alvos, REC) é o mesmo. Antes: out/hl3_M01/hl3.antes-tv3d.tsx.
// 05/11 (ele: "toda TV segue o mesmo panorama: jogo da velha onde tem TV, o roxo em outros momentos"): a parede de metal
// Combine atrás de qualquer TV de tubo (HLCombineTV e a da mulher misteriosa). A grade anda devagar, respira e uma faixa
// de luz ciano atravessa de tempos em tempos.
export const CombineWall: React.FC<{ gt: number }> = ({ gt }) => (
  <>
    <AbsoluteFill style={{ background: "radial-gradient(ellipse 1400px 900px at 38% 50%, #10161d 0%, #07090c 70%, #040506 100%)" }} />
    {/* 05/11 (ele: "essas linhas do fundo, o jogo da velha, ficar brilhando e se movendo, sutilmente"): a grade anda
        devagar, respira, e uma faixa de luz ciano atravessa a parede de tempos em tempos */}
    <AbsoluteFill style={{ opacity: 0.5 + 0.12 * Math.sin(gt / 45), backgroundImage: "repeating-linear-gradient(90deg, rgba(255,255,255,0.03) 0 2px, transparent 2px 160px), repeating-linear-gradient(0deg, rgba(255,255,255,0.024) 0 2px, transparent 2px 120px)", backgroundPosition: `${(gt * 0.35) % 160}px ${(gt * 0.22) % 120}px` }} />
    <AbsoluteFill style={{ backgroundImage: "repeating-linear-gradient(90deg, rgba(88,224,255,0.16) 0 2px, transparent 2px 160px), repeating-linear-gradient(0deg, rgba(88,224,255,0.12) 0 2px, transparent 2px 120px)", backgroundPosition: `${(gt * 0.35) % 160}px ${(gt * 0.22) % 120}px`, WebkitMaskImage: `linear-gradient(115deg, transparent ${((gt * 0.6) % 260) - 130}%, #000 ${((gt * 0.6) % 260) - 110}%, transparent ${((gt * 0.6) % 260) - 90}%)`, maskImage: `linear-gradient(115deg, transparent ${((gt * 0.6) % 260) - 130}%, #000 ${((gt * 0.6) % 260) - 110}%, transparent ${((gt * 0.6) % 260) - 90}%)`, opacity: 0.8 }} />
  </>
);
const TV = { x: 110, y: 80, w: 1000, h: 750 }; // tela 4:3, dentro da frente do gabinete
const TVC = { w: 1220, h: 1030, dep: 560, cx: 660, cy: 540, sc: 0.86 }; // gabinete 3D
const TV_IMG = 1200;
export const HLCombineTV: React.FC<{
  life: number;
  shots: Shot[];
  tags?: FootTag[];
  stamps?: FootStamp[];
  cards?: FootCard[];
  feed?: string;
  sector?: string;
  cont?: boolean; // continua da cena anterior: a TV já está ligada
  glitch?: [number, number][]; // janelas (s da cena) em que o sinal falha: a imagem pula, rasga e a cor separa
  whiteAt?: number; // a tela estoura em branco (a luz no fim do reencontro)
  tc0?: number; // segundos já corridos no REC (cena anterior na mesma TV)
  sectors?: [number, string][]; // o setor muda com o plano (s da cena): cada Advisor num lugar
  offAt?: number; // a TV desliga (tubo fecha numa linha e num ponto): "a tela escurece"
}> = ({ life, shots, tags, stamps, cards, feed = "OVERWATCH · FEED 09", sector = "SETOR: ÁRTICO", cont, tc0 = 0, glitch, whiteAt, sectors, offAt }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const on = cont ? 1 : lerp(f, 0, 14, 0, 1, OUT); // liga: a imagem abre do centro como tubo esquentando
  const flick = 1 + 0.025 * Math.sin(f * 1.7) + 0.015 * Math.sin(f * 0.37);
  const roll = ((f * 2.2) % (TV.h + 300)) - 150; // faixa de interferência descendo devagar
  const sec = Math.floor(f / fps + tc0);
  const tc = `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}:${String(f % fps).padStart(2, "0")}`;
  const live = (tags ?? []).filter((t) => f >= t.at && f < t.outAt);
  const cyan = "#58e0ff";
  const k = TV.w / TV_IMG;
  const gl = (glitch ?? []).some(([a, b]) => f >= a * fps && f < b * fps);
  const gq = Math.floor(f / 2); // a falha muda a cada 2 quadros (sinal digital pulando, não tremedeira)
  const gx = gl ? (rnd(gq * 7) > 0.55 ? (rnd(gq * 13) - 0.5) * 70 : 0) : 0;
  const gy = gl && rnd(gq * 29) > 0.85 ? (rnd(gq * 31) - 0.5) * 40 : 0;
  const wh = whiteAt === undefined ? 0 : lerp(f, whiteAt, whiteAt + 40, 0, 1, INOUT);
  const sec_ = (sectors ?? []).filter(([a]) => f >= a * fps).pop()?.[1] ?? sector;
  const oF = offAt === undefined ? 1e9 : offAt * fps;
  const offY = lerp(f, oF, oF + 7, 0, 1, INOUT); // a imagem achata numa linha
  const offX = lerp(f, oF + 6, oF + 15, 0, 1, INOUT); // a linha vira um ponto
  const offDot = lerp(f, oF + 13, oF + 40, 1, 0, OUT); // o ponto apaga devagar
  const dead = f >= oF ? 1 : 0;
  const lit = on * (1 - offX);
  const gt = f + tc0 * fps; // o giro do aparelho segue o REC: não pula entre cenas que continuam
  const vents = (l0: number) => Array.from({ length: 9 }, (_, q) => <div key={q} style={{ position: "absolute", left: l0 + q * 38, top: 300, width: 14, height: 380, borderRadius: 7, background: "rgba(0,0,0,0.55)" }} />);
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse 1400px 900px at 38% 50%, #10161d 0%, #07090c 70%, #040506 100%)" }}>
      {/* parede de metal Combine atrás do monitor */}
      <CombineWall gt={gt} />
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <filter id="ctvRGB" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
          <feOffset in="r" dx={gl ? 10 : 3} dy="0" result="r2" />
          <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
          <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" />
          <feOffset in="b" dx={gl ? -10 : -3} dy="0" result="b2" />
          <feBlend in="r2" in2="g" mode="screen" result="rg" />
          <feBlend in="rg" in2="b2" mode="screen" />
        </filter>
      </svg>
      {/* brilho da tela na parede e no chão */}
      <div style={{ position: "absolute", left: TVC.cx - 760, top: TVC.cy - 520, width: 1520, height: 1040, background: `radial-gradient(ellipse at 50% 45%, rgba(120,190,230,${0.16 * lit * flick}) 0%, rgba(0,0,0,0) 62%)` }} />
      <div style={{ position: "absolute", left: TVC.cx - 560, top: TVC.cy + 380, width: 1120, height: 150, borderRadius: "50%", background: `radial-gradient(ellipse, rgba(120,190,230,${0.2 * lit * flick}) 0%, rgba(0,0,0,0) 70%)`, filter: "blur(10px)" }} />
      {/* o televisor em 3D: gira devagar, com o tempo corrido da fita (contínuo entre cenas que continuam) */}
      <div style={{ position: "absolute", left: TVC.cx - TVC.w / 2, top: TVC.cy - TVC.h / 2, width: TVC.w, height: TVC.h, perspective: 2600, perspectiveOrigin: "50% 45%" }}>
        <div style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d", transform: `translateY(${7 * Math.sin(gt / 70)}px) scale(${TVC.sc * (1 + 0.012 * Math.sin(gt / 110))}) rotateX(${3.5 + 1.8 * Math.sin(gt / 95) + 0.6 * Math.sin(gt / 37)}deg) rotateY(${-13 + 5 * Math.sin(gt / 120) + 1.4 * Math.sin(gt / 47)}deg) rotateZ(${0.5 * Math.sin(gt / 83)}deg)` }}>
          {/* laterais, topo e base (o tubo afunila para trás) */}
          <div style={{ position: "absolute", left: 0, top: 0, width: TVC.dep, height: TVC.h, transformOrigin: "0 50%", transform: "rotateY(90deg)", border: "2px solid transparent", backgroundClip: "padding-box", boxSizing: "border-box", backfaceVisibility: "hidden", background: "linear-gradient(90deg, #2c3640 0%, #1f262d 40%, #12161a 100%)", clipPath: "polygon(0 0, 100% 9%, 100% 91%, 0 100%)" }}>{vents(120)}</div>
          <div style={{ position: "absolute", left: TVC.w - TVC.dep, top: 0, width: TVC.dep, height: TVC.h, transformOrigin: "100% 50%", transform: "rotateY(-90deg)", border: "2px solid transparent", backgroundClip: "padding-box", boxSizing: "border-box", backfaceVisibility: "hidden", background: "linear-gradient(270deg, #36404a 0%, #1f262d 40%, #12161a 100%)", clipPath: "polygon(0 9%, 100% 0, 100% 100%, 0 91%)" }}>{vents(80)}</div>
          <div style={{ position: "absolute", left: 0, top: 0, width: TVC.w, height: TVC.dep, transformOrigin: "50% 0", transform: "rotateX(-90deg)", border: "2px solid transparent", backgroundClip: "padding-box", boxSizing: "border-box", backfaceVisibility: "hidden", background: "linear-gradient(180deg, #3a434c 0%, #181d22 100%)", clipPath: "polygon(0 0, 100% 0, 93% 100%, 7% 100%)" }} />
          <div style={{ position: "absolute", left: 0, top: TVC.h - TVC.dep, width: TVC.w, height: TVC.dep, transformOrigin: "50% 100%", transform: "rotateX(90deg)", border: "2px solid transparent", backgroundClip: "padding-box", boxSizing: "border-box", backfaceVisibility: "hidden", background: "#0b0e11", clipPath: "polygon(7% 0, 93% 0, 100% 100%, 0 100%)" }} />
          {/* a frente: metal Combine com parafusos */}
          <div style={{ position: "absolute", inset: 0, borderRadius: 38, border: "2px solid transparent", backgroundClip: "padding-box", boxSizing: "border-box", backfaceVisibility: "hidden", background: "linear-gradient(160deg, #46505a 0%, #252c33 32%, #161a1f 70%, #2a323a 100%)", boxShadow: "inset 0 3px 0 rgba(255,255,255,0.14), inset 0 -4px 0 rgba(0,0,0,0.6)" }}>
            {[[22, 22], [TVC.w - 34, 22], [22, TVC.h - 34], [TVC.w - 34, TVC.h - 34]].map(([x, y], i) => (
              <div key={i} style={{ position: "absolute", left: x, top: y, width: 12, height: 12, borderRadius: 6, background: "radial-gradient(circle at 35% 35%, #8a96a0, #2a3036)" }} />
            ))}
            <div style={{ position: "absolute", left: TV.x - 26, top: TV.y - 26, width: TV.w + 52, height: TV.h + 52, borderRadius: "84px / 74px", background: "linear-gradient(160deg, #0b0d10, #1e2328)", boxShadow: "inset 0 10px 24px rgba(0,0,0,0.9), 0 1px 0 rgba(255,255,255,0.08)" }} />
            <div style={{ position: "absolute", left: TV.x, top: TV.y + TV.h + 50, width: 470, height: 92, borderRadius: 10, background: "repeating-linear-gradient(90deg, #0b0e11 0 7px, #2b333a 7px 11px)" }} />
            {[0, 1].map((q) => (
              <div key={q} style={{ position: "absolute", left: 720 + q * 112, top: TV.y + TV.h + 50, width: 80, height: 80, borderRadius: 40, background: "conic-gradient(from 20deg, #5a646e, #1d2227, #4a545e, #1d2227, #5a646e)", boxShadow: "0 6px 12px rgba(0,0,0,0.6), inset 0 2px 0 rgba(255,255,255,0.2)", transform: `rotate(${q ? 40 : -30}deg)` }}>
                <div style={{ position: "absolute", left: 37, top: 6, width: 6, height: 22, borderRadius: 3, background: "#0b0e11" }} />
              </div>
            ))}
            <div style={{ position: "absolute", left: 960, top: TV.y + TV.h + 58, display: "flex", gap: 12, alignItems: "center", fontFamily: MONO, fontSize: 16, letterSpacing: 3, color: "rgba(200,220,235,0.6)" }}>
              <div style={{ width: 12, height: 12, borderRadius: 6, background: cyan, boxShadow: `0 0 12px ${cyan}`, opacity: 0.6 + 0.4 * flick * lit }} />
              OVERWATCH
            </div>
            {/* tela */}
            <div style={{ position: "absolute", left: TV.x, top: TV.y, width: TV.w, height: TV.h, borderRadius: "74px / 64px", overflow: "hidden", background: "#020304", boxShadow: `0 0 50px rgba(120,190,230,${0.25 * lit})` }}>
        <div style={{ position: "absolute", inset: 0, transform: `translate(${gx}px, ${gy}px) scale(${(0.02 + 0.98 * on) * (1 - 0.995 * offX)}, ${(cont ? 1 : 0.004 + 0.996 * lerp(f, 6, 16, 0, 1, OUT)) * (1 - 0.996 * offY)})`, opacity: offX >= 1 ? 0 : 1, filter: `url(#ctvRGB) brightness(${flick * 1.3 * (gl && rnd(gq * 3) > 0.8 ? 1.6 : 1) * (1 + 2.5 * offY)}) contrast(${gl ? 1.3 : 1.08}) saturate(${gl ? 1.5 : 0.92}) hue-rotate(${gl && rnd(gq * 5) > 0.6 ? (rnd(gq * 11) - 0.5) * 80 : 0}deg)` }}>
          <div style={{ position: "absolute", left: 0, top: 0, width: TV_IMG, height: TV_IMG * 0.75, transform: `scale(${k})`, transformOrigin: "0 0" }}>
            {shots.map((s, i) => {
              const nx = shots[i + 1];
              const hold = nx && nx.fx === "fade" ? Math.max(16, (nx.xf ?? 0) + 4) : nx ? 8 : 0;
              return (
                <Sequence key={i} from={s.at} durationInFrames={Math.max(1, (i === shots.length - 1 ? Math.max(s.dur, life - s.at) : s.dur) + hold)} premountFor={30}>
                  <ShotView s={s} />
                </Sequence>
              );
            })}
            {(tags ?? []).map((t, i) => <FootTagView key={i} t={t} />)}
          </div>
        </div>
        {/* falha de sinal: faixas rasgadas em vermelho/ciano e chuvisco */}
        {gl ? (
          <AbsoluteFill style={{ pointerEvents: "none" }}>
            {Array.from({ length: 6 }).map((_, i) => (rnd(gq * 17 + i * 3) > 0.45 ? (
              <div key={i} style={{ position: "absolute", left: (rnd(gq + i * 5) - 0.5) * 120, right: (rnd(gq * 2 + i) - 0.5) * 120, top: rnd(gq * 19 + i * 7) * TV.h, height: 6 + rnd(gq * 23 + i) * 40, background: i % 2 ? "rgba(255,40,70,0.28)" : "rgba(40,220,255,0.28)", mixBlendMode: "screen" }} />
            ) : null))}
            <AbsoluteFill style={{ background: `repeating-linear-gradient(0deg, rgba(255,255,255,${0.05 + 0.08 * rnd(gq)}) 0 1px, rgba(0,0,0,0) 1px ${3 + Math.floor(rnd(gq * 3) * 5)}px)` }} />
          </AbsoluteFill>
        ) : null}
        {wh > 0 ? <AbsoluteFill style={{ background: `rgba(244,255,248,${wh})`, pointerEvents: "none" }} /> : null}
        {dead && offX > 0.5 && offDot > 0 ? <div style={{ position: "absolute", left: TV.w / 2 - 40, top: TV.h / 2 - 40, width: 80, height: 80, borderRadius: 40, background: `radial-gradient(circle, rgba(235,250,255,${offDot}) 0%, rgba(140,210,255,${0.5 * offDot}) 18%, rgba(0,0,0,0) 60%)` }} /> : null}
        {/* fósforo: linhas de varredura, faixa que rola, vinheta do tubo e reflexo do vidro */}
        <AbsoluteFill style={{ background: "repeating-linear-gradient(90deg, rgba(255,60,60,0.10) 0 1px, rgba(60,255,90,0.10) 1px 2px, rgba(70,110,255,0.10) 2px 3px)", mixBlendMode: "multiply" }} />
        <AbsoluteFill style={{ background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.32) 0 2px, rgba(0,0,0,0) 2px 4px)", mixBlendMode: "multiply" }} />
        <div style={{ position: "absolute", left: 0, right: 0, top: roll, height: 150, background: "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(190,230,255,0.07) 50%, rgba(255,255,255,0) 100%)" }} />
        <AbsoluteFill style={{ background: "radial-gradient(ellipse 72% 70% at 50% 50%, rgba(0,0,0,0) 58%, rgba(0,0,0,0.55) 88%, rgba(0,0,0,0.92) 100%)" }} />
        <div style={{ position: "absolute", left: -140, top: -220, width: 760, height: 480, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 50%, rgba(255,255,255,0) 70%)" }} />
        <AbsoluteFill style={{ background: "linear-gradient(125deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.03) 22%, rgba(255,255,255,0) 40%)" }} />
        <AbsoluteFill style={{ boxShadow: "inset 0 0 60px rgba(120,200,255,0.10)" }} />
        <div style={{ position: "absolute", left: 34, top: 26, fontFamily: MONO, fontSize: 18, letterSpacing: 4, color: "rgba(230,245,255,0.85)", textShadow: "0 0 8px rgba(120,210,255,0.7)", opacity: lit }}>
          <span style={{ color: "#ff4a3a", opacity: Math.floor(f / 15) % 2 ? 1 : 0.25 }}>● </span>REC · {tc}
        </div>
        <div style={{ position: "absolute", right: 34, top: 26, fontFamily: MONO, fontSize: 18, letterSpacing: 4, color: "rgba(230,245,255,0.75)", opacity: lit }}>{sec_}</div>
      </div>
          </div>
        </div>
      </div>
      {/* painel ao lado */}
      <div style={{ position: "absolute", left: 1352, top: 104, width: 500, fontFamily: MONO, color: "rgba(220,235,245,0.8)", opacity: cont ? 1 : lerp(f, 6, 24, 0, 1, OUT) }}>
        <div style={{ fontSize: 15, letterSpacing: 5, color: gl ? "#ff5a4a" : cyan }}>{gl ? "SINAL INSTÁVEL · " + feed.split("·").pop()?.trim() : feed}</div>
        <div style={{ display: "flex", gap: 5, alignItems: "flex-end", marginTop: 14 }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} style={{ width: 9, height: 8 + i * 6, background: i < 3 + (Math.floor(f / 23) % 3 === 0 ? 0 : 1) ? cyan : "rgba(255,255,255,0.12)" }} />
          ))}
          <div style={{ fontSize: 13, letterSpacing: 3, marginLeft: 12 }}>SINAL</div>
        </div>
        <div style={{ height: 1, background: "rgba(88,224,255,0.25)", margin: "22px 0 16px" }} />
        <div style={{ fontSize: 13, letterSpacing: 4, color: "rgba(220,235,245,0.5)" }}>ALVOS NA TELA</div>
        <div style={{ marginTop: 10, minHeight: 120 }}>
          {live.length ? (
            live.map((t, i) => (
              <div key={i} style={{ display: "flex", gap: 12, fontSize: 19, letterSpacing: 3, marginTop: 8, color: HL.text, opacity: lerp(f, t.at + 4, t.at + 12, 0, 1, OUT) }}>
                <span style={{ color: t.col ?? HL.orange }}>■</span>
                <span>{t.text}</span>
                {t.sub ? <span style={{ color: "rgba(220,235,245,0.5)", fontSize: 15 }}>{t.sub}</span> : null}
              </div>
            ))
          ) : (
            <div style={{ fontSize: 17, letterSpacing: 3, marginTop: 8, color: "rgba(220,235,245,0.35)" }}>— NENHUM —</div>
          )}
        </div>
      </div>
      <div style={{ position: "absolute", left: 1262, top: 0, width: 620, height: 1080 }}>
        <div style={{ position: "absolute", left: 0, top: 290, width: 620 }}>
          {(stamps ?? []).map((t, i) => <FootStampView key={i} s={t} size={30} maxW={480} />)}
        </div>
        {(cards ?? []).map((c, i) => <FootIdCard key={i} c={c} top={560} />)}
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// DOIS QUADROS NO ESPAÇO: cada jogo num vidro flutuando em 3D, vídeo em loop dentro.
// `lightAt`: clareiam juntos · `focus`: um vem para frente · `recedeAt`: afastam devagar ·
// `darkAt`: apagam e o espaço escurece · `emberAt`: uma brasa laranja nasce ao longe.
// ---------------------------------------------------------------------------------------------
type Pane = { title: string; sub: string; shots: { src: string; from: number; dur: number; rate?: number }[]; aspect?: number };
type Focus = { i: number; at: number; dur: number };

const PaneView: React.FC<{ p: Pane; w: number; life: number }> = ({ p, w, life }) => {
  // `dur` já chega em quadros (o registry converte). Em vez de <Loop> (que remonta o vídeo a cada volta e
  // pisca preto), repete os planos em sequência até cobrir a cena, cada um pré-carregado 1 s antes, e o
  // anterior continua por baixo por alguns quadros: troca sem preto na prévia e no render.
  const h = w / (p.aspect ?? 16 / 9);
  const items: { s: Pane["shots"][number]; at: number; dur: number }[] = [];
  let t = 0;
  let k = 0;
  while (t < life && p.shots.length && k < 200) {
    const s = p.shots[k % p.shots.length];
    const d = Math.max(1, Math.round(s.dur));
    items.push({ s, at: t, dur: d });
    t += d;
    k++;
  }
  return (
    <div style={{ width: w, height: h, borderRadius: 22, overflow: "hidden", position: "relative", background: "#000" }}>
      {items.map((it, i) => (
        <Sequence key={i} from={it.at} durationInFrames={it.dur + 6} premountFor={30}>
          <AbsoluteFill style={{ zIndex: i }}>
            <Clip src={it.s.src} from={it.s.from} rate={it.s.rate} />
          </AbsoluteFill>
        </Sequence>
      ))}
    </div>
  );
};

export const HLDuo: React.FC<{
  life: number;
  panes: Pane[];
  lightAt?: number;
  lightEndAt?: number;
  focus?: Focus[];
  recedeAt?: number;
  darkAt?: number;
  emberAt?: number;
  vanishAt?: number;
}> = ({ life, panes, lightAt = 1e9, lightEndAt = 1e9, focus = [], recedeAt = 1e9, darkAt = 1e9, emberAt = 1e9, vanishAt }) => {
  const f = useCurrentFrame();
  const enter = lerp(f, 0, 34, 0, 1, OUT);
  const lit = Math.min(lerp(f, lightAt, lightAt + 10, 0, 1, OUT), lerp(f, lightEndAt - 16, lightEndAt, 1, 0));
  // com `vanishAt`: UM movimento só, linear, de `recedeAt` até sumir em `vanishAt` (sem acelerar no fim).
  // Sem ele (versão antiga): afasta até `darkAt` e apaga em 36 quadros com aceleração.
  const uniform = vanishAt !== undefined;
  const recede = uniform ? lerp(f, recedeAt, vanishAt!, 0, 1, C) : lerp(f, recedeAt, darkAt, 0, 1, C);
  const dark = uniform ? recede : lerp(f, darkAt, darkAt + 36, 0, 1, INOUT);
  const fade = uniform ? lerp(f, recedeAt + (vanishAt! - recedeAt) * 0.35, vanishAt!, 0, 1, C) : dark; // some aos poucos na segunda parte
  // depois que somem, o espaço termina de escurecer devagar (1,7 s) até o mesmo escuro com que o título entra (0,9)
  const deep = uniform ? lerp(f, vanishAt!, vanishAt! + 45, 0, 1, INOUT) : 0; // 1,5 s até o escuro total
  const fo = (i: number) =>
    Math.max(0, ...focus.filter((q) => q.i === i).map((q) => Math.min(lerp(f, q.at, q.at + 16, 0, 1, INOUT), lerp(f, q.at + q.dur - 16, q.at + q.dur, 1, 0))));
  const ember = lerp(f, emberAt, life, 0, 1, { ...C, easing: Easing.inOut(Easing.sin) }); // surge visível e cresce contínuo até o corte
  const W = 700;
  return (
    <AbsoluteFill style={{ perspective: 1500, perspectiveOrigin: "50% 45%" }}>
      {panes.map((p, i) => {
        const side = i === 0 ? -1 : 1;
        const me = fo(i);
        const other = fo(1 - i);
        const z = -1800 * (1 - enter) + 240 * me - 260 * other - (uniform ? 2300 * recede : 900 * recede + 1400 * dark);
        const x = side * (480 - 190 * me + 90 * other) + side * 80 * recede;
        const y = Math.sin((f + i * 40) / 38) * 14 - 20;
        const ry = -side * (14 - 10 * me) + Math.sin((f + i * 60) / 90) * 3;
        const glow = Math.max(lit, me * 0.7);
        const alpha = enter * (1 - 0.5 * other) * (1 - fade);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 960 - W / 2,
              top: 540 - W / (2 * (p.aspect ?? 16 / 9)) - 40,
              transform: `translate3d(${x}px, ${y}px, ${z}px) rotateY(${ry}deg)`,
              opacity: alpha,
              transformStyle: "preserve-3d",
              willChange: "transform, opacity",
            }}
          >
            <div
              style={{
                padding: 10,
                borderRadius: 30,
                background: `linear-gradient(160deg, rgba(255,255,255,${0.14 + 0.1 * glow}), rgba(255,255,255,0.03) 50%, rgba(107,63,212,${0.12 + 0.15 * glow}))`,
                border: `1px solid rgba(255,255,255,${0.2 + 0.35 * glow})`,
                boxShadow: `0 50px 120px rgba(0,0,0,0.6), 0 0 ${40 + 90 * glow}px rgba(${lit > 0.5 ? "255,190,120" : "159,216,255"},${0.18 + 0.35 * glow})`,
              }}
            >
              <PaneView p={p} w={W} life={life} />
            </div>
            <div style={{ marginTop: 26, paddingLeft: 12, color: HL.text }}>
              <div style={{ fontFamily: FONT, fontWeight: 750, fontSize: 44, letterSpacing: -1 }}>{p.title}</div>
              <div style={{ fontFamily: MONO, fontSize: 19, letterSpacing: 5, textTransform: "uppercase", color: HL.dim, marginTop: 8 }}>{p.sub}</div>
            </div>
          </div>
        );
      })}
      {/* o espaço apaga: fica o escuro e uma brasa laranja que cresce até o corte */}
      <AbsoluteFill style={{ background: "rgba(3,2,6,1)", opacity: dark * 0.82 + deep * 0.15 }} />
      {ember > 0 ? (
        <div
          style={{
            position: "absolute",
            left: 960,
            top: 540,
            width: 8 + ember * 52,
            height: 8 + ember * 52,
            marginLeft: -(4 + ember * 26),
            marginTop: -(4 + ember * 26),
            borderRadius: "50%",
            background: `radial-gradient(circle, rgba(255,190,130,${0.6 * ember}) 0%, rgba(255,138,31,${0.35 * ember}) 30%, rgba(255,120,31,${0.12 * ember}) 55%, rgba(255,120,31,0) 72%)`,
            boxShadow: `0 0 ${20 + 60 * ember}px rgba(255,138,31,${0.22 * ember})`,
            filter: "blur(4px)",
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// TÍTULO em corte seco. O espaço continua atrás (mais escuro), o "3" em laranja acende com tremor.
// ---------------------------------------------------------------------------------------------
// `flickAll`: o título inteiro entra TREMULANDO (lâmpada falhando) logo depois do golpe — quadros apagados em TITLE_FLICK_OFF
export const TITLE_FLICK = [1, 0.15, 1, 0.85, 0.1, 1, 1, 0.35, 1, 1, 1, 1, 0.2, 1, 1, 0.9, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0.25, 0.6, 1];
// rajadas de glitch na entrada do título (quadro → intensidade), quando `glitchIn`
const TITLE_GLITCH: { at: number; k: number }[] = [
  { at: 0, k: 1 },
  { at: 4, k: 0.85 },
  { at: 12, k: 0.7 },
  { at: 26, k: 0.55 },
];
// ÓRBITA do título: três anéis inclinados e partículas (pontos, rastros curtos e pequenos λ) girando em volta das
// letras — as da metade da frente passam POR CIMA do título, as de trás por baixo e mais apagadas. No golpe elas saem
// do centro (impacto) e assentam na órbita.
const RINGS = [
  { rx: 780, ry: 118, rot: -7 },
  { rx: 640, ry: 190, rot: 11 },
  { rx: 930, ry: 72, rot: -2 },
];
const TitleOrbit: React.FC<{ f: number; front: boolean; collapse?: number }> = ({ f, front, collapse = 0 }) => {
  const burst = interpolate(f, [0, 22], [0, 1], { ...C, easing: Easing.out(Easing.back(1.4)) }) * (1 - collapse);
  const ringK = interpolate(f, [2, 30], [0.25, 1], { ...C, easing: Easing.out(Easing.cubic) });
  const ringA = interpolate(f, [2, 30], [0, 1], C);
  const parts = Array.from({ length: 30 }).map((_, i) => {
    const R = RINGS[i % 3];
    const a = rnd(i * 7 + 1) * Math.PI * 2 + f * (0.005 + 0.004 * rnd(i + 5)) * (i % 2 ? 1 : -1);
    const ex = Math.cos(a) * R.rx;
    const ey = Math.sin(a) * R.ry;
    const th = (R.rot * Math.PI) / 180;
    const x = 960 + (ex * Math.cos(th) - ey * Math.sin(th)) * burst;
    const y = 540 + (ex * Math.sin(th) + ey * Math.cos(th)) * burst;
    const z = Math.sin(a); // > 0 = na frente
    const tx = -Math.sin(a) * R.rx * Math.cos(th) - Math.cos(a) * R.ry * Math.sin(th);
    const ty = -Math.sin(a) * R.rx * Math.sin(th) + Math.cos(a) * R.ry * Math.cos(th);
    const tl = Math.hypot(tx, ty) || 1;
    return { i, x, y, z, ux: tx / tl, uy: ty / tl, kind: i % 7 === 0 ? "lambda" : i % 3 === 0 ? "streak" : "dot" };
  });
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {!front
        ? RINGS.map((R, k) => (
            <ellipse key={k} cx={960} cy={540} rx={R.rx * ringK} ry={R.ry * ringK} transform={`rotate(${R.rot + Math.sin(f / 90 + k) * 1.5} 960 540)`} fill="none" stroke={k === 1 ? "rgba(255,138,31,0.55)" : "rgba(207,190,255,0.4)"} strokeWidth={1.8} strokeDasharray={k === 2 ? "2 10" : undefined} opacity={ringA} />
          ))
        : null}
      {parts
        .filter((p) => (p.z >= 0) === front)
        .map((p) => {
          const dep = (p.z + 1) / 2;
          const op = (front ? 0.7 + 0.3 * dep : 0.3 + 0.3 * dep) * interpolate(f, [0, 6], [0, 1], C);
          const col = p.i % 4 === 0 ? "#ff8a1f" : "#e9e2ff";
          if (p.kind === "lambda")
            return (
              <text key={p.i} x={p.x} y={p.y} fill={col} opacity={op} fontFamily={MONO} fontSize={26 + 14 * dep} textAnchor="middle" dominantBaseline="middle">
                λ
              </text>
            );
          if (p.kind === "streak") return <line key={p.i} x1={p.x} y1={p.y} x2={p.x - p.ux * (26 + 40 * dep)} y2={p.y - p.uy * (26 + 40 * dep)} stroke={col} strokeWidth={2 + 1.5 * dep} strokeLinecap="round" opacity={op} />;
          return <circle key={p.i} cx={p.x} cy={p.y} r={2.6 + 4 * dep} fill={col} opacity={op} style={{ filter: `drop-shadow(0 0 ${4 + 6 * dep}px ${col})` }} />;
        })}
    </svg>
  );
};
export const HLTitle: React.FC<{ life: number; kicker?: string; title?: string; num?: string; lightDur?: number; ember?: boolean; flickAll?: boolean; glitchIn?: boolean; recede?: boolean; orbit?: boolean; outAt?: number }> = ({
  life,
  kicker = "Como eu faria",
  title = "Half-Life",
  num = "3",
  lightDur = 75,
  ember = true,
  flickAll = false,
  glitchIn = false,
  recede = false,
  orbit = false,
  outAt = 1e9,
}) => {
  const f = useCurrentFrame();
  // `outAt`: saída para o bloco seguinte — três trancos de glitch e o título (com a órbita) é sugado para o centro
  const gAmt = Math.max(glitchIn ? glitchAmt(f, TITLE_GLITCH) : 0, glitchAmt(f, [{ at: outAt, k: 0.8 }, { at: outAt + 3, k: 1 }, { at: outAt + 7, k: 1 }]));
  const collapse = interpolate(f, [outAt + 6, outAt + 16], [0, 1], { ...C, easing: Easing.in(Easing.cubic) });
  // `recede`: entra grande no golpe e vai se AFASTANDO devagar até o fim
  const away = recede ? 1.16 - 0.22 * interpolate(f, [0, life], [0, 1], { ...C, easing: Easing.out(Easing.quad) }) : 0;
  const fa = flickAll ? (TITLE_FLICK[f] ?? 1) : 1;
  const push = (recede ? away : 1 + lerp(f, 0, life, 0, 0.06, C)) * (1 - 0.85 * collapse);
  const flick = f < 10 ? [1, 0.35, 1, 1, 0.6, 1, 1, 1, 0.85, 1][f] : 1;
  const k = lerp(f, 4, 22, 0, 1, OUT);
  // entra tão escuro quanto o fim da cena anterior (espaço apagado) e clareia devagar
  const veil = lerp(f, 0, lightDur, 0.97, 0.62, { ...C, easing: Easing.out(Easing.cubic) });
  const glow = lerp(f, 0, lightDur, 0, 1, { ...C, easing: Easing.out(Easing.cubic) });
  // a brasa laranja da cena anterior (68 px no centro) cresce e vira um halo que fica atrás do título
  const e = lerp(f, 0, 22, 0, 1, { ...C, easing: Easing.out(Easing.cubic) });
  const breathe = 1 + Math.sin(f / 26) * 0.03;
  const hs = (60 + e * 900) * breathe;
  const a0 = 0.5 - 0.3 * e; // centro: começa como a brasa e assenta em ~0,2
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", overflow: "hidden", opacity: 1 - collapse }}>
      <AbsoluteFill style={{ background: "rgba(3,2,6,1)", opacity: veil }} />
      <AbsoluteFill style={{ background: "radial-gradient(45% 55% at 50% 50%, rgba(107,63,212,0.32) 0%, rgba(42,21,82,0.12) 45%, rgba(4,3,8,0) 75%)", opacity: glow }} />
      {ember ? (
        <div
          style={{
            position: "absolute",
            left: 960 - hs / 2,
            top: 540 - hs / 2,
            width: hs,
            height: hs,
            borderRadius: "50%",
            background: `radial-gradient(circle, rgba(255,180,110,${a0}) 0%, rgba(255,138,31,${a0 * 0.6}) 22%, rgba(255,120,31,${a0 * 0.28}) 42%, rgba(255,110,31,${a0 * 0.1}) 58%, rgba(255,110,31,0) 72%)`,
            filter: "blur(18px)",
            mixBlendMode: "screen",
          }}
        />
      ) : null}
      {orbit ? <TitleOrbit f={f} front={false} collapse={collapse} /> : null}
      <GlitchWrap f={f} amt={gAmt} id="gtitle" style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ transform: `translate3d(0, 0, 0) scale(${push.toFixed(5)})`, willChange: "transform", backfaceVisibility: "hidden", display: "flex", flexDirection: "column", alignItems: "center", opacity: fa }}>
          {kicker ? (
            <div style={{ fontFamily: MONO, fontSize: 30, letterSpacing: 16, textTransform: "uppercase", color: HL.dim, opacity: k, transform: `translateY(${(1 - k) * 10}px)`, marginBottom: 18 }}>
              {kicker}
            </div>
          ) : null}
          <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 210, letterSpacing: -8, lineHeight: 1, color: HL.text, textShadow: "0 30px 120px rgba(107,63,212,0.5)" }}>
            {title}{" "}
            <span style={{ color: HL.orange, opacity: flick, textShadow: `0 0 60px rgba(255,138,31,${0.55 * flick}), 0 0 140px rgba(255,138,31,0.25)` }}>{num}</span>
          </div>
        </div>
      </GlitchWrap>
      {orbit ? <TitleOrbit f={f} front collapse={collapse} /> : null}
    </AbsoluteFill>
  );
};

// HUD (pílula de módulo). Fica disponível, mas o Paulo tirou da abertura.
export const HLHud: React.FC<{ life: number; module?: string; part?: string; title?: string }> = ({ life, module = "Módulo 01", part = "1A", title = "" }) => {
  const f = useCurrentFrame();
  const o = Math.min(lerp(f, 0, 14, 0, 1, OUT), lerp(f, life - 8, life, 1, 0));
  return (
    <div
      style={{
        position: "absolute",
        left: 44,
        top: 38,
        opacity: o,
        display: "flex",
        gap: 14,
        padding: "11px 20px",
        borderRadius: 999,
        background: "rgba(18,14,30,0.55)",
        border: `1px solid ${HL.line}`,
        color: HL.text,
        fontFamily: MONO,
        fontSize: 17,
        letterSpacing: 2.2,
        textTransform: "uppercase",
      }}
    >
      <span>{module}</span>
      <span style={{ color: HL.orange }}>{part}</span>
      <span style={{ textTransform: "none", fontFamily: FONT }}>{title}</span>
    </div>
  );
};
