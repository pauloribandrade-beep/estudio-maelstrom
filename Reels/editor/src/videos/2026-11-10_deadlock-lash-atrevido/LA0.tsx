import React from "react";
import { AbsoluteFill, Easing, Freeze, Img, interpolate, OffthreadVideo, random, Sequence, staticFile, useCurrentFrame } from "remotion";
import { clamp, ease, Flash, punch, shake } from "../2026-11-09_deadlock-cansei-lol/CL2";
import { D, HERO, RD, RV } from "../2026-11-09_deadlock-cansei-lol/CL3";

// "Lash atrevido" · abertura refeita (10/11). Ele: "os primeiros 20–30 s podiam ser melhores… mais personalidade,
// visual, não só um monte de card", e não curtiu as barras carregando. Aqui: jogo de verdade em tela cheia, câmera
// viva, tipografia grande do Deadlock entrando na palavra, o Lash despencando no "estressam". Nada de barra enchendo.

const LA = (n: string) => staticFile(`videos/2026-11-10_deadlock-lash-atrevido_R/${n}`);
const CLIP = (n: string) => staticFile(`videos/2026-11-06_deadlock-magia_R/clips/${n}.mp4`);
const MG = (n: string) => staticFile(`videos/2026-11-06_deadlock-magia_R/mg/${n}`);
const WK = (n: string) => staticFile(`videos/2026-11-09_deadlock-farm_R/wk/${n}`);

// vídeo 16:9 recortado em vertical (tela cheia), com foco horizontal fx (0..1)
const Vert: React.FC<{ src: string; ss?: number; fx?: number; z?: number; rate?: number; ar?: number; style?: React.CSSProperties }> = ({ src, ss = 0, fx = 0.45, z = 1, rate = 1, ar = 16 / 9, style }) => {
  const w = 1920 * ar * z;
  return (
    <AbsoluteFill style={{ overflow: "hidden", ...style }}>
      <OffthreadVideo src={src} muted startFrom={ss} playbackRate={rate} style={{ position: "absolute", height: 1920 * z, width: w, left: 540 - w * fx, top: (1920 - 1920 * z) / 2, maxWidth: "none" }} />
    </AbsoluteFill>
  );
};

// palavra grande do Deadlock: entra com escala e desfoque, segura, e sai quando a próxima chega
const Pop: React.FC<{ f: number; at: number; until?: number; size: number; c?: string; y?: number; children: React.ReactNode; font?: string; rot?: number }> = ({ f, at, until = 1e9, size, c = D.cream, y = 360, children, font = RV, rot = 0 }) => {
  if (f < at || f >= until + 4) return null;
  const p = ease(f, at, 7);
  const o = 1 - ease(f, until, 4);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: y, display: "flex", justifyContent: "center", zIndex: 40, opacity: o }}>
      <div
        style={{
          fontFamily: font,
          fontWeight: 700,
          fontSize: size,
          lineHeight: 1,
          whiteSpace: "nowrap",
          color: c,
          letterSpacing: size * 0.03,
          transform: `scale(${1.35 - 0.35 * p}) rotate(${rot}deg)`,
          filter: p < 1 ? `blur(${(1 - p) * 10}px)` : undefined,
          textShadow: `0 6px 0 rgba(0,0,0,0.55), 0 10px 40px rgba(0,0,0,0.95), 0 0 50px ${c}44`,
        }}
      >
        {children}
      </div>
    </div>
  );
};

const Vig: React.FC<{ k?: number; c?: string }> = ({ k = 0.75, c = "0,0,0" }) => (
  <AbsoluteFill style={{ background: `radial-gradient(ellipse 90% 75% at 50% 45%, rgba(${c},0) 45%, rgba(${c},${k}) 100%)`, pointerEvents: "none", zIndex: 30 }} />
);

// faixa escura em cima e embaixo (dá leitura às palavras sem caixa)
const Shade: React.FC = () => (
  <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.0) 32%, rgba(0,0,0,0.0) 62%, rgba(0,0,0,0.65) 100%)", zIndex: 20, pointerEvents: "none" }} />
);

// ========== 1) feliz jogando DEADLOCK · satisfeito · gostosinho → MAS: congela, o Lash despenca · ME ESTRESSA · MUITO. ==========
export const LAOpen: React.FC<{ life: number; muito0At?: number; felizAt?: number; dlAt?: number; satAt?: number; gostAt?: number; masAt?: number; coisasAt?: number; stressAt?: number; muitoAt?: number; muito2At?: number }> = ({
  life, muito0At = 58, felizAt = 77, dlAt = 99, satAt = 153, gostAt = 200, masAt = 228, coisasAt = 290, stressAt = 307, muitoAt = 321, muito2At = 348,
}) => {
  const f = useCurrentFrame();
  const frozen = f >= masAt;
  const gray = interpolate(f, [masAt, masAt + 10], [0, 0.85], clamp);
  const land = coisasAt + 8; // o Lash bate no chão
  const fall = interpolate(f, [coisasAt - 4, land], [-1400, 0], { ...clamp, easing: Easing.in(Easing.cubic) });
  const sh = shake(f, land, 34, 14, "ld");
  const sh2 = shake(f, muito2At, 24, 12, "m2");
  const z = 1.02 + f * 0.0006 + punch(f, [dlAt], 0.06) + (frozen ? interpolate(f, [masAt, life], [0, 0.08], clamp) : 0) + punch(f, [land, muito2At], 0.07);
  const red = frozen ? interpolate(f, [stressAt, stressAt + 10], [0, 0.32], clamp) + punch(f, [muitoAt, muito2At], 0.25) : 0;
  // almas saltando do jogo no "satisfeito"
  const orbs = Array.from({ length: 14 }).map((_, i) => {
    const t0 = satAt + i * 2;
    const p = interpolate(f, [t0, t0 + 22], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
    const a = random(`oa${i}`) * Math.PI * 2;
    const sx = 540 + Math.cos(a) * (120 + random(`or${i}`) * 200);
    const sy = 1050 + Math.sin(a) * (120 + random(`or${i}`) * 160);
    return { x: sx + (150 - sx) * p, y: sy + (250 - sy) * p - Math.sin(p * Math.PI) * 180, o: f >= t0 && p < 1 ? 1 : 0 };
  });
  const got = f >= satAt + 22 ? Math.min(14, Math.floor((f - satAt - 22) / 2) + 1) : 0;
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `translate(${sh.x + sh2.x}px, ${sh.y + sh2.y}px) scale(${z})`, filter: `grayscale(${gray}) contrast(${1 + gray * 0.15})` }}>
        {frozen ? (
          <Freeze frame={masAt}>
            <Vert src={CLIP("raw")} ss={20 * 30} fx={0.4} />
          </Freeze>
        ) : (
          <Vert src={CLIP("raw")} ss={20 * 30} fx={0.4} />
        )}
      </AbsoluteFill>
      {red > 0 ? <AbsoluteFill style={{ background: `rgba(160,20,10,${red})`, mixBlendMode: "multiply", zIndex: 10 }} /> : null}
      <Shade />
      {/* almas indo pro contador */}
      {orbs.map((o, i) => (o.o ? <div key={i} style={{ position: "absolute", left: o.x - 14, top: o.y - 14, width: 28, height: 28, borderRadius: 14, background: D.soul, boxShadow: `0 0 24px ${D.soul}, 0 0 50px ${D.soul}`, zIndex: 25 }} /> : null))}
      {got > 0 && f < masAt ? (
        <div style={{ position: "absolute", left: 90, top: 210, display: "flex", alignItems: "center", gap: 14, zIndex: 26, transform: `scale(${1 + punch(f, [satAt + 22, satAt + 34, satAt + 46], 0.12, 6)})`, transformOrigin: "0 50%" }}>
          <Img src={WK("Souls_icon.png")} style={{ width: 70, height: 70, filter: `drop-shadow(0 0 16px ${D.soul})` }} />
          <span style={{ fontFamily: RD, fontWeight: 700, fontSize: 64, color: D.soul, textShadow: "0 4px 20px #000" }}>+{got * 25}</span>
        </div>
      ) : null}
      {/* o Lash despencando no jogo congelado */}
      {f >= coisasAt - 4 ? (
        <>
          {f >= land ? (
            <div style={{ position: "absolute", left: 540 - 520 * ease(f, land, 14), top: 1240 - 90 * ease(f, land, 14), width: 1040 * ease(f, land, 14), height: 180 * ease(f, land, 14), borderRadius: "50%", border: `8px solid rgba(240,220,180,${0.7 * (1 - ease(f, land + 4, 16))})`, zIndex: 27 }} />
          ) : null}
          <div style={{ position: "absolute", left: -110, top: 640 + fall, width: 1300, zIndex: 28, filter: f < land ? "blur(3px)" : undefined, transform: `scale(${f >= land ? 1 + punch(f, [land], 0.05) : 1})`, transformOrigin: "50% 100%" }}>
            <Img src={LA("la/Lash_cut.png")} style={{ width: 1300, filter: `drop-shadow(0 30px 60px #000) ${frozen ? "saturate(1.2)" : ""}` }} />
          </div>
        </>
      ) : null}
      {/* palavras */}
      <Pop f={f} at={0} until={muito0At} size={96} c={D.cream} y={340}>
        EU VIVO DIZENDO
      </Pop>
      <Pop f={f} at={muito0At} until={felizAt} size={130} c={D.cream} y={340}>
        TÔ MUITO
      </Pop>
      <Pop f={f} at={felizAt} until={dlAt} size={150} c={D.amber} y={330}>
        FELIZ
      </Pop>
      {f >= dlAt && f < satAt + 4 ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 300, display: "flex", justifyContent: "center", zIndex: 40, opacity: 1 - ease(f, satAt, 4) }}>
          <Img src={MG("dl_logo.png")} style={{ width: 860, transform: `scale(${1.3 - 0.3 * ease(f, dlAt, 6)})`, filter: "drop-shadow(0 10px 40px #000)" }} />
        </div>
      ) : null}
      <Pop f={f} at={satAt} until={gostAt} size={116} c={D.soul} y={340}>
        SATISFEITO
      </Pop>
      <Pop f={f} at={gostAt} until={masAt} size={108} c={D.cream} y={340}>
        GOSTOSINHO
      </Pop>
      <Pop f={f} at={masAt} until={stressAt} size={190} c={D.cream} y={300}>
        MAS…
      </Pop>
      <Pop f={f} at={stressAt} until={muito2At} size={120} c={D.red} y={300} rot={-3}>
        ME ESTRESSA
      </Pop>
      <Pop f={f} at={muito2At} size={230} c={D.red} y={260} rot={-4}>
        MUITO.
      </Pop>
      <Vig k={frozen ? 0.85 : 0.6} />
      <Flash f={f} ts={[masAt]} pk={0.35} c="#ffffff" />
      <Flash f={f} ts={[land, muito2At]} pk={0.25} c="#ff3b2f" />
    </AbsoluteFill>
  );
};

// ========== 2) a galera que entra e acha que é só um jogo de matar: Lash em tela cheia, abates estourando ==========
const FEED = [
  ["Haze", "Seven"],
  ["Infernus", "Rem"],
  ["Apollo", "Celeste"],
] as const;
export const LAKill2: React.FC<{ life: number; galeraAt?: number; entraAt?: number; achaAt?: number; soAt?: number; matarAt?: number }> = ({ life, galeraAt = 43, entraAt = 58, achaAt = 98, soAt = 122, matarAt = 143 }) => {
  const f = useCurrentFrame();
  const ts = [galeraAt, entraAt + 14, achaAt];
  const dark = ease(f, soAt - 4, 10);
  const z = 1.08 + f * 0.0012 + punch(f, [matarAt], 0.08);
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${z})`, filter: `brightness(${1 - dark * 0.45}) saturate(${1 - dark * 0.4})` }}>
        <Vert src={LA("la/LashSlamSlide.mp4")} fx={0.3} z={1.05} />
      </AbsoluteFill>
      <Shade />
      {/* feed de abates do próprio jogo, canto de cima */}
      <div style={{ position: "absolute", right: 40, top: 200, display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-end", zIndex: 35 }}>
        {FEED.map(([a, b], i) => {
          const at = ts[i];
          if (f < at) return null;
          const p = ease(f, at, 7);
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 14px", background: "rgba(11,10,8,0.82)", borderLeft: `5px solid ${D.amber}`, transform: `translateX(${(1 - p) * 200}px)`, opacity: p }}>
              <div style={{ width: 62, height: 62, overflow: "hidden", border: `2px solid ${D.sapph}` }}>
                <Img src={i === 0 ? LA("la/Lash_card.png") : HERO[a]} style={{ width: 62, height: 84, objectFit: "cover" }} />
              </div>
              <svg width={44} height={44} viewBox="0 0 44 44">
                <path d="M22 4 C11 4 5 11 5 20 c0 6 3 9 6 11 v6 h5 v-4 h3 v4 h6 v-4 h3 v4 h5 v-6 c3 -2 6 -5 6 -11 C39 11 33 4 22 4 Z" fill={D.red} />
                <circle cx={15} cy={21} r={4.5} fill={D.bg} />
                <circle cx={29} cy={21} r={4.5} fill={D.bg} />
              </svg>
              <div style={{ width: 62, height: 62, overflow: "hidden", border: `2px solid ${D.red}`, filter: "grayscale(0.8)" }}>
                <Img src={HERO[b]} style={{ width: 62, height: 84, objectFit: "cover" }} />
              </div>
            </div>
          );
        })}
      </div>
      <Pop f={f} at={galeraAt} until={soAt} size={78} c={D.cream} y={700}>
        A GALERA QUE ACHA
      </Pop>
      <Pop f={f} at={soAt} size={120} c={D.cream} y={430}>
        SÓ UM JOGO
      </Pop>
      <Pop f={f} at={matarAt} size={160} c={D.red} y={570} rot={-3}>
        DE MATAR?
      </Pop>
      <Vig k={0.7} />
      <Flash f={f} ts={[matarAt]} pk={0.22} c="#ff3b2f" />
    </AbsoluteFill>
  );
};

// ========== 3) não é CS · não é Marvel Rivals · não é Overwatch: um card por vez, carimbado e chutado pra fora ==========
const NOT2 = [
  ["cs_logo.png", "COUNTER-STRIKE", true],
  ["mr_logo.png", "MARVEL RIVALS", false],
  ["ow_logo.png", "OVERWATCH", false],
] as const;
export const LANot2: React.FC<{ life: number; csAt?: number; mrAt?: number; owAt?: number }> = ({ life, csAt = 26, mrAt = 70, owAt = 125 }) => {
  const f = useCurrentFrame();
  const ts = [csAt, mrAt, owAt];
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      {/* o Deadlock rolando atrás, escuro */}
      <AbsoluteFill style={{ transform: `scale(${1.15 + f * 0.0006})`, filter: "blur(10px) brightness(0.35) saturate(0.8)" }}>
        <Vert src={CLIP("raw")} ss={60 * 30} fx={0.45} />
      </AbsoluteFill>
      <div style={{ position: "absolute", left: 0, right: 0, top: 260, display: "flex", justifyContent: "center", zIndex: 30 }}>
        <div style={{ fontFamily: RD, fontWeight: 700, fontSize: 52, letterSpacing: 10, color: D.dim, opacity: ease(f, 0, 8) }}>ISSO AQUI NÃO É</div>
      </div>
      {NOT2.map(([logo, name, white], i) => {
        const at = ts[i];
        const next = ts[i + 1] ?? 1e9;
        if (f < at - 8) return null;
        const inn = ease(f, at - 8, 8);
        const out = interpolate(f, [next - 6, next + 6], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
        if (out >= 1) return null;
        const stamp = f >= at + 2;
        const k = stamp ? interpolate(f, [at + 2, at + 7], [1.9, 1], { ...clamp, easing: Easing.in(Easing.quad) }) : 0;
        return (
          <div key={name} style={{ position: "absolute", left: 160, top: 420, width: 760, height: 520, zIndex: 35, opacity: inn, transform: `translate(${(1 - inn) * 500 - out * 1300}px, ${out * -200}px) rotate(${(1 - inn) * 14 - out * 35 + (i - 1) * 2}deg) scale(${1 + punch(f, [at + 2], 0.05)})` }}>
            <div style={{ position: "absolute", inset: 0, background: "rgba(20,17,13,0.95)", border: `3px solid ${D.line}`, clipPath: "polygon(22px 0, calc(100% - 22px) 0, 100% 22px, 100% calc(100% - 22px), calc(100% - 22px) 100%, 22px 100%, 0 calc(100% - 22px), 0 22px)", boxShadow: "0 40px 90px rgba(0,0,0,0.9)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 30, filter: stamp ? "grayscale(0.6)" : undefined }}>
              <Img src={MG(logo)} style={{ maxWidth: 560, maxHeight: 220, objectFit: "contain", filter: white ? "brightness(0) invert(0.92)" : undefined }} />
              <div style={{ fontFamily: RD, fontWeight: 700, fontSize: 40, letterSpacing: 8, color: D.cream }}>{name}</div>
            </div>
            {stamp ? (
              <div style={{ position: "absolute", left: 0, right: 0, top: 360, display: "flex", justifyContent: "center" }}>
                <div style={{ padding: "16px 50px", border: `9px solid ${D.red}`, color: D.red, fontFamily: RV, fontWeight: 700, fontSize: 100, lineHeight: 1, background: "rgba(11,10,8,0.85)", transform: `rotate(${-10 + i * 6}deg) scale(${k})`, boxShadow: `0 0 50px ${D.red}66` }}>NÃO É</div>
              </div>
            ) : null}
          </div>
        );
      })}
      <Vig k={0.7} />
    </AbsoluteFill>
  );
};

// ========== 4) outro conceito · espera 5, 6 minutos (o jogo acelera, o relógio voa) · LANE PHASE ==========
export const LALane2: React.FC<{ life: number; outroAt?: number; esperaAt?: number; minAt?: number; laneAt?: number }> = ({ life, outroAt = 18, esperaAt = 70, minAt = 119, laneAt = 140 }) => {
  const f = useCurrentFrame();
  const fast = f >= esperaAt && f < laneAt;
  const sec = interpolate(f, [esperaAt, laneAt], [0, 360], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const mm = Math.floor(sec / 60);
  const ss = Math.floor(sec % 60);
  // o vídeo anda rápido entre "espera" e "lane": três trechos com startFrom ajustado (sem pulo)
  const SS = 120 * 30;
  const RATE = 6;
  const z = 1.06 + f * 0.0005 + punch(f, [laneAt], 0.07);
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${z})`, filter: fast ? "saturate(0.8) contrast(1.1)" : undefined }}>
        <Sequence from={0} durationInFrames={esperaAt} layout="none">
          <Vert src={CLIP("k4")} ss={SS} fx={0.32} />
        </Sequence>
        <Sequence from={esperaAt} durationInFrames={laneAt - esperaAt} layout="none">
          <Vert src={CLIP("k4")} ss={SS + esperaAt} fx={0.32} rate={RATE} />
        </Sequence>
        <Sequence from={laneAt} layout="none">
          <Vert src={CLIP("k4")} ss={SS + esperaAt + (laneAt - esperaAt) * RATE} fx={0.32} />
        </Sequence>
      </AbsoluteFill>
      {/* linhas de avanço rápido */}
      {fast ? (
        <AbsoluteFill style={{ zIndex: 15, opacity: 0.5 }}>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} style={{ position: "absolute", left: ((f * 60 + random(`fl${i}`) * 1080) % 1400) - 200, top: 300 + random(`fy${i}`) * 1200, width: 180 + random(`fw${i}`) * 200, height: 3, background: D.cream, opacity: 0.35 }} />
          ))}
        </AbsoluteFill>
      ) : null}
      <Shade />
      <Pop f={f} at={outroAt} until={esperaAt} size={94} c={D.cream} y={340}>
        OUTRO CONCEITO
      </Pop>
      {/* relógio da partida, no lugar do relógio do HUD */}
      {f >= esperaAt - 6 ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 300, display: "flex", flexDirection: "column", alignItems: "center", zIndex: 40, opacity: ease(f, esperaAt - 6, 6), transform: `scale(${1 + punch(f, [minAt], 0.08)})` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18, fontFamily: RD, fontWeight: 700, fontSize: 40, letterSpacing: 6, color: fast ? D.amber : D.dim }}>
            {fast ? (
              <svg width={56} height={36} viewBox="0 0 56 36">
                <path d="M2 2 L26 18 L2 34 Z M28 2 L52 18 L28 34 Z" fill={D.amber} />
              </svg>
            ) : null}
            {fast ? `${RATE}×` : "PARTIDA"}
          </div>
          <div style={{ fontFamily: RV, fontWeight: 700, fontSize: 250, lineHeight: 1, color: D.cream, fontVariantNumeric: "tabular-nums", textShadow: `0 8px 0 rgba(0,0,0,0.5), 0 0 60px ${D.amber}66` }}>
            {mm}:{String(ss).padStart(2, "0")}
          </div>
        </div>
      ) : null}
      <Pop f={f} at={laneAt} size={150} c={D.amber} y={730}>
        LANE PHASE
      </Pop>
      <Vig k={0.65} />
    </AbsoluteFill>
  );
};

// ========== 5) quietinho, joga · farma · nega farm · farma jungle · caixinhas: cortes secos no jogo, uma palavra por corte ==========
const MONT = [
  ["FARMA", "orb_seq.mp4", 0],
  ["NEGA FARM", "c_deny.mp4", 0],
  ["FARMA JUNGLE", "c_jungle.mp4", 0],
  ["CAIXINHAS", "c_crate.mp4", 45],
] as const;
export const LAMontage: React.FC<{ life: number; farmaAt?: number; negaAt?: number; jungleAt?: number; caixaAt?: number }> = ({ life, farmaAt = 42, negaAt = 61, jungleAt = 97, caixaAt = 144 }) => {
  const f = useCurrentFrame();
  const ts = [farmaAt, negaAt, jungleAt, caixaAt];
  let cur = -1;
  ts.forEach((t, i) => {
    if (f >= t - 2) cur = i;
  });
  const z = 1.04 + (cur >= 0 ? (f - ts[cur]) * 0.002 : f * 0.0006) + punch(f, ts.map((t) => t - 2), 0.06, 8);
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${z})` }}>
        {cur < 0 ? (
          <AbsoluteFill style={{ filter: "brightness(0.75)" }}>
            <Vert src={CLIP("raw")} ss={95 * 30} fx={0.4} />
          </AbsoluteFill>
        ) : (
          MONT.map(([, clipN, ss], i) =>
            i === cur ? (
              <Sequence key={i} from={ts[i] - 2} layout="none">
                <Vert src={WK(clipN)} ss={ss} fx={0.5} ar={1080 / 810} />
              </Sequence>
            ) : null,
          )
        )}
      </AbsoluteFill>
      <Shade />
      <Pop f={f} at={0} until={farmaAt - 2} size={118} c={D.cream} y={360}>
        QUIETINHO, JOGA.
      </Pop>
      {MONT.map(([t], i) => (
        <Pop key={t} f={f} at={ts[i] - 2} until={i < 3 ? ts[i + 1] - 2 : 1e9} size={t.length > 10 ? 104 : t.length > 7 ? 136 : 160} c={i % 2 ? D.soul : D.amber} y={360} rot={i % 2 ? 2 : -2}>
          {t}
        </Pop>
      ))}
      <Vig k={0.65} />
      <Flash f={f} ts={ts.map((t) => t - 2)} pk={0.12} c="#ffffff" />
    </AbsoluteFill>
  );
};

// ========== 8) dash e soco infinito na frente da galera · morre na torre: um Lash de verdade mergulhando e morrendo ==========
// clipe: "The SHAME of Being THE LASH" (YouTube), 2:44–2:58, em 1080p; o Lash entra com dash, a vida vai de 372 a 14 e a tela
// fica cinza (morte real do jogo). Recorte vertical no Lash (fx 0,34): o logo do canal em cima do minimapa fica fora do quadro.
export const LASpam2: React.FC<{ life: number; dashAt?: number; socoAt?: number; infAt?: number; deathAt?: number; torreAt?: number }> = ({ life, dashAt = 26, socoAt = 49, infAt = 68, deathAt = 141, torreAt = 158 }) => {
  const f = useCurrentFrame();
  // o clipe anda 1,35× para o dash cair no "dash" e a tela cinza cair no "morre"
  const RATE = 1.35;
  const SS = Math.round((5.0 - (dashAt / 30) * RATE) * 30);
  const dead = f >= deathAt;
  const z = 1.1 + f * 0.0008 + punch(f, [dashAt, socoAt, infAt], 0.05, 8) + (dead ? interpolate(f, [deathAt, life], [0, 0.06], clamp) : 0);
  const sh = shake(f, deathAt, 22, 12, "sp");
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `translate(${sh.x}px, ${sh.y}px) scale(${z})` }}>
        <Vert src={LA("la/lash_dive.mp4")} ss={Math.max(0, SS)} fx={0.34} rate={RATE} />
      </AbsoluteFill>
      {dead ? <AbsoluteFill style={{ background: `rgba(120,10,6,${0.25 * (1 - ease(f, deathAt + 6, 20))})`, zIndex: 10 }} /> : null}
      <Shade />
      <Pop f={f} at={dashAt} until={socoAt} size={170} c={D.amber} y={330} rot={-3}>
        DASH
      </Pop>
      <Pop f={f} at={socoAt} until={infAt} size={170} c={D.amber} y={330} rot={3}>
        SOCO
      </Pop>
      <Pop f={f} at={infAt} until={deathAt} size={130} c={D.cream} y={330} rot={-2}>
        INFINITO
      </Pop>
      <Pop f={f} at={deathAt} size={180} c={D.red} y={300} rot={-4}>
        MORREU
      </Pop>
      <Pop f={f} at={torreAt} size={64} c={D.cream} y={500} font={RD}>
        NA TORRE DOS CARAS
      </Pop>
      <Vig k={dead ? 0.85 : 0.6} />
      <Flash f={f} ts={[deathAt]} pk={0.3} c="#ff2a1f" />
    </AbsoluteFill>
  );
};
