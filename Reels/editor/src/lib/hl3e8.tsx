import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { C, HLSpace, rnd } from "./hl3";

// Virada 1D → 2A, versão TENEBROSA (2026-10-01): no escuro total, uma brasa LARANJA pulsa devagar como
// um coração no meio de fumaça preta e vai crescendo; em `hitAt` um golpe seco (tranco + lampejo âmbar fraco de
// poucos quadros) e o escuro volta. Sem raios, sem anel, sem clarão branco. Tempos em QUADROS relativos à cena.
export const HLEmberBeat: React.FC<{ life: number; hitAt: number }> = ({ life, hitAt }) => {
  // Antes do golpe = a brasa da ABERTURA (1A.1, HLDuo emberAt): um ponto laranja pequeno e macio que nasce junto do
  // build-up e cresce devagar e contínuo; só nos últimos quadros dá uma arrancada. Sem raios, sem halo gigante.
  // Depois do golpe = o "boom que se espalha" (aprovado).
  const f = useCurrentFrame();
  const after = f - hitAt;
  const ember = interpolate(f, [0, hitAt], [0, 1], { ...C, easing: Easing.inOut(Easing.sin) });
  const surge = interpolate(f, [hitAt - 10, hitAt], [0, 1], { ...C, easing: Easing.in(Easing.cubic) });
  const spread = after >= 0 ? interpolate(after, [0, 26], [0, 1], { ...C, easing: Easing.out(Easing.cubic) }) : 0;
  const hitFlash = after >= 0 ? interpolate(after, [0, 2, 9], [0.38, 0.25, 0], C) : 0;
  const jolt = after >= 0 && after < 8 ? (1 - after / 8) * 22 : 0;
  const jx = jolt ? (rnd(f * 7) - 0.5) * jolt : 0;
  const jy = jolt ? (rnd(f * 11) - 0.5) * jolt : 0;
  const o = interpolate(f, [life - 6, life], [1, 0], C);
  const size = after < 0 ? 8 + ember * 60 + surge * 260 : 328 + 420 * spread + 30 * Math.sin(after / 14);
  const e = after < 0 ? Math.max(ember, 0.15) : 0.55 - 0.15 * spread;
  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity: o, transform: `translate(${jx}px, ${jy}px)` }}>
      {/* bloom: imagem de brilho pré-calculada em alta precisão com dither de 1 nível (invisível) — liso, sem os anéis
          do degradê escuro em CSS e sem ruído aparente. Núcleo + halo largo; depois do golpe fica só o halo. */}
      {[
        { k: 1.4, a: 1, core: true },
        { k: 6.5, a: 0.5, core: false },
      ].map((L, i) => {
        if (after >= 0 && L.core) return null;
        const sz = size * L.k;
        return <Img key={i} src={staticFile("hl3/ember_glow.png")} style={{ position: "absolute", left: 960 - sz / 2, top: 540 - sz / 2, width: sz, height: sz, opacity: Math.min(1, L.a * e * (L.core ? 1 : 1.3)) }} />;
      })}
      {after >= 0 ? (
        <div style={{ position: "absolute", left: 960 - 1300 * spread, top: 540 - 1300 * spread, width: 2600 * spread, height: 2600 * spread, borderRadius: "50%", border: `${60 * (1 - spread) + 6}px solid rgba(255,170,90,${0.35 * (1 - spread)})`, filter: "blur(24px)" }} />
      ) : null}
      {/* golpe: lampejo quente curto; revela a nebulosa */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, #fff1dc 0%, #ffb060 45%, #8a3a0a 100%)", opacity: hitFlash }} />
    </AbsoluteFill>
  );
};

// Fundo da parte 2: a mesma nebulosa do vídeo, puxada para PRETO e ÂMBAR (hue-rotate do roxo para o laranja e bem
// escurecida). Entra no golpe, por baixo do título.
export const HLDarkNebula: React.FC<{ life: number }> = ({ life }) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [life - 12, life], [1, 0], C);
  const R = interpolate(f, [0, 34], [0, 1500], { ...C, easing: Easing.out(Easing.cubic) });
  const mask = `radial-gradient(circle at 50% 50%, #000 ${R}px, rgba(0,0,0,0) ${R + 380}px)`;
  return (
    <AbsoluteFill style={{ background: "#000", opacity: o, maskImage: mask, WebkitMaskImage: mask }}>
      <AbsoluteFill style={{ filter: "hue-rotate(125deg) saturate(1.25) brightness(0.48) contrast(1.15)" }}>
        <HLSpace />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 75% 70% at 50% 50%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.85) 100%)" }} />
    </AbsoluteFill>
  );
};
