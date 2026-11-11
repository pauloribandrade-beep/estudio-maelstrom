import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, Loop, OffthreadVideo, random, Sequence, staticFile, useCurrentFrame } from "remotion";
import { loadFont as loadAnton } from "@remotion/google-fonts/Anton";
import { loadFont as loadBody } from "@remotion/google-fonts/NunitoSans";
import { loadFont as loadHand } from "@remotion/google-fonts/Caveat";

// Farm v2 (09/11, pedido dele): "menos card com palavra". Abertura em ícone + tipografia sem vídeo por baixo,
// ícones reais do jogo (deadlock.wiki: alma, arma, espírito, vitalidade, renders e cards), linhas de chamada, memes nos golpes.
// Zona segura do TikTok: conteúdo entre y 180 e 1290; legenda em 1370. Props *At chegam em QUADROS relativos à cena.

const { fontFamily: POSTER } = loadAnton("normal", { weights: ["400"], subsets: ["latin", "latin-ext"] });
const { fontFamily: BODY } = loadBody("normal", { weights: ["700", "800", "900"], subsets: ["latin", "latin-ext"] });
const { fontFamily: HAND } = loadHand("normal", { weights: ["700"], subsets: ["latin", "latin-ext"] });

const wk = (n: string) => staticFile(`videos/2026-11-09_deadlock-farm_R/wk/${n}`);
const pc = (n: string) => staticFile(`videos/2026-11-05_deadlock-patch-celeste_R/dl/${n}`);
const mg = (n: string) => staticFile(`videos/2026-11-06_deadlock-magia_R/mg/${n}`);
const fl3 = (n: string) => staticFile(`fluent3d/${n}.png`);

const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
const ease = (f: number, a: number, n = 10) => interpolate(f, [a, a + n], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
const back = (f: number, a: number, n = 10, s = 1.8) => interpolate(f - a, [0, n], [0, 1], { ...clamp, easing: Easing.out(Easing.back(s)) });
const fl = (f: number, a: number, b: number, pk: number) => (f < a ? 0 : interpolate(f, [a, b], [pk, 0], clamp));
const shake = (f: number, at: number, amp = 14, n = 9, seed = "s") => {
  const k = f - at;
  if (k < 0 || k > n) return { x: 0, y: 0 };
  const d = amp * (1 - k / n) ** 2;
  return { x: (random(`${seed}x${k}`) - 0.5) * 2 * d, y: (random(`${seed}y${k}`) - 0.5) * 2 * d };
};
const punchZ = (f: number, ts: number[] = [], amp = 0.1, n = 9) => ts.reduce((z, t) => (f >= t && f < t + n ? z + amp * (1 - (f - t) / n) ** 2 : z), 0);

const INK = "#06090a";
const CREAM = "#f4e7cb";
const SOUL = "#5ff2d6";
const GREEN = "#6dff8a";
const ORANGE = "#ff9a3c";
const GHOST = "#b58cff";
const RED = "#ff4a3d";
const YEL = "#ffd23f";

// ícone de alma do jogo, vetorizado do Souls.png da wiki
const SOUL_D = "M323 0 L309 3 L300 13 L297 27 L298 47 L296 69 L290 82 L279 94 L262 106 L234 112 L208 121 L181 127 L159 141 L142 159 L137 168 L125 202 L125 238 L141 287 L154 307 L172 325 L203 342 L244 349 L272 358 L309 364 L328 373 L345 378 L375 398 L406 432 L420 463 L423 473 L425 496 L424 532 L421 553 L407 585 L398 594 L388 600 L383 601 L370 597 L360 587 L357 572 L362 553 L372 531 L372 497 L356 462 L331 434 L298 414 L243 407 L191 393 L179 385 L159 376 L141 363 L111 335 L102 331 L90 331 L82 335 L61 357 L45 378 L36 395 L29 404 L21 426 L11 446 L1 504 L1 541 L11 599 L23 624 L29 642 L38 654 L45 668 L61 689 L81 710 L121 741 L154 759 L172 764 L189 773 L212 781 L225 791 L235 804 L237 810 L237 823 L231 836 L223 843 L197 856 L176 864 L160 875 L141 897 L137 907 L135 919 L134 958 L137 979 L142 992 L155 1012 L171 1029 L193 1046 L209 1052 L220 1052 L225 1050 L230 1045 L236 1025 L242 983 L247 970 L255 960 L270 951 L293 942 L328 935 L369 917 L391 898 L403 882 L407 870 L410 848 L410 827 L407 804 L403 787 L387 754 L368 732 L352 720 L307 706 L244 696 L206 682 L178 665 L159 649 L140 628 L119 594 L109 556 L109 540 L121 485 L130 469 L137 460 L150 455 L164 457 L174 465 L178 474 L178 484 L170 507 L166 533 L166 557 L169 572 L175 585 L190 606 L212 626 L226 634 L249 642 L275 647 L310 650 L323 654 L337 661 L356 666 L388 685 L419 713 L430 720 L438 720 L450 713 L482 678 L490 664 L497 656 L507 634 L515 622 L520 601 L530 574 L533 557 L534 499 L530 469 L520 442 L515 422 L507 410 L500 393 L482 367 L451 334 L435 320 L420 311 L415 306 L392 295 L378 286 L362 282 L345 273 L317 265 L302 251 L297 243 L296 234 L299 225 L315 209 L323 204 L347 197 L370 183 L387 167 L402 140 L405 127 L405 99 L403 88 L388 52 L374 34 L354 15 L330 2 Z";
export const SoulGlyph: React.FC<{ h: number; c?: string; glow?: number; style?: React.CSSProperties }> = ({ h, c = SOUL, glow = 1, style }) => (
  <svg viewBox="0 0 534 1052" height={h} width={(h * 534) / 1052} style={{ overflow: "visible", filter: glow ? `drop-shadow(0 0 ${h * 0.05 * glow}px ${c}) drop-shadow(0 0 ${h * 0.12 * glow}px ${c}88)` : "none", ...style }}>
    <path d={SOUL_D} fill={c} />
  </svg>
);

// ---------- fundo: preto limpo, brilho petróleo, partículas de alma, grão ----------
const Grain: React.FC<{ o?: number }> = ({ o = 0.07 }) => {
  const f = useCurrentFrame();
  const seed = Math.floor(f / 2) % 9;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: o, mixBlendMode: "overlay", pointerEvents: "none" }}>
      <filter id={`f2gr${seed}`}>
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={seed} />
        <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1.4 -0.2" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#f2gr${seed})`} />
    </svg>
  );
};
const Motes: React.FC<{ n?: number; c?: string; o?: number; speed?: number }> = ({ n = 26, c = SOUL, o = 0.8, speed = 1 }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ opacity: o, pointerEvents: "none" }}>
      {Array.from({ length: n }).map((_, i) => {
        const x = random(`m2x${i}`) * 1080 + Math.sin((f + i * 30) / 22) * 20;
        const sp = (1.2 + random(`m2v${i}`) * 2.4) * speed;
        const y = 1980 - ((f * sp + random(`m2y${i}`) * 1980) % 2100);
        const s = 3 + random(`m2s${i}`) * 9;
        return <div key={i} style={{ position: "absolute", left: x, top: y, width: s, height: s, borderRadius: "50%", background: c, boxShadow: `0 0 ${s * 2.5}px ${s * 0.8}px ${c}`, opacity: 0.25 + random(`m2o${i}`) * 0.6 }} />;
      })}
    </AbsoluteFill>
  );
};
const Void: React.FC<{ glow?: string; children?: React.ReactNode; motes?: boolean; z?: number }> = ({ glow = "#0f3a34", children, motes = true, z = 1 }) => (
  <AbsoluteFill style={{ background: INK, overflow: "hidden" }}>
    <AbsoluteFill style={{ background: `radial-gradient(ellipse 80% 55% at 50% 42%, ${glow} 0%, rgba(0,0,0,0) 70%)` }} />
    <div style={{ position: "absolute", inset: 0, opacity: 0.12, backgroundImage: "linear-gradient(#ffffff10 2px, transparent 2px), linear-gradient(90deg, #ffffff10 2px, transparent 2px)", backgroundSize: "90px 90px" }} />
    {motes ? <Motes /> : null}
    <AbsoluteFill style={{ transform: `scale(${z})` }}>{children}</AbsoluteFill>
    <AbsoluteFill style={{ background: "radial-gradient(ellipse 90% 75% at 50% 45%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.8) 100%)", pointerEvents: "none" }} />
    <Grain />
  </AbsoluteFill>
);
const Flash: React.FC<{ f: number; ts: number[]; pk?: number; c?: string }> = ({ f, ts, pk = 0.5, c = "#fff" }) => (
  <AbsoluteFill style={{ background: c, opacity: ts.reduce((a, t) => a + fl(f, t, t + 5, pk), 0), pointerEvents: "none" }} />
);

// palavra que bate: entra grande e borrada, assenta com tremida
const Slam: React.FC<{ f: number; at: number; size: number; c?: string; children: React.ReactNode; glow?: string; from?: number; style?: React.CSSProperties }> = ({ f, at, size, c = CREAM, children, glow, from = 1.7, style }) => {
  if (f < at) return null;
  const s = interpolate(f, [at, at + 5], [from, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  const b = interpolate(f, [at, at + 5], [14, 0], clamp);
  const sh = shake(f, at + 5, 12, 8, `sl${at}${size}`);
  return (
    <div style={{ fontFamily: POSTER, fontSize: size, color: c, lineHeight: 0.92, letterSpacing: 2, textAlign: "center", whiteSpace: "nowrap", transform: `translate(${sh.x}px, ${sh.y}px) scale(${s})`, filter: `blur(${b}px)`,
      opacity: interpolate(f, [at, at + 2], [0, 1], clamp), textShadow: glow ? `0 0 40px ${glow}, 0 0 90px ${glow}88` : "0 10px 40px rgba(0,0,0,0.9)", ...style }}>{children}</div>
  );
};
// fase: entra batendo, sai voando pra cima com borrão
const Phase: React.FC<{ f: number; a: number; b: number; children: React.ReactNode; out?: "up" | "zoom" | "none" }> = ({ f, a, b, children, out = "up" }) => {
  if (f < a || f >= b) return null;
  const o = out === "none" ? 0 : interpolate(f, [b - 4, b], [0, 1], clamp);
  const ty = out === "up" ? -o * 260 : 0;
  const sc = out === "zoom" ? 1 + o * 0.6 : 1;
  return <AbsoluteFill style={{ transform: `translateY(${ty}px) scale(${sc})`, filter: `blur(${o * 16}px)`, opacity: 1 - o * 0.9 }}>{children}</AbsoluteFill>;
};
// traço à mão (X, sublinhado) que se desenha
const Stroke: React.FC<{ f: number; at: number; d: string; c?: string; w?: number; n?: number; vb?: string; style?: React.CSSProperties }> = ({ f, at, d, c = RED, w = 26, n = 6, vb = "0 0 1000 1000", style }) => {
  if (f < at) return null;
  const p = ease(f, at, n);
  return (
    <svg viewBox={vb} style={{ position: "absolute", overflow: "visible", ...style }}>
      <path d={d} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} style={{ filter: `drop-shadow(0 0 14px ${c}aa)` }} />
    </svg>
  );
};
// ícone do jogo num ladrilho
const Tile: React.FC<{ src: string; c: string; s?: number; k?: number; label?: string }> = ({ src, c, s = 250, k = 1, label }) => (
  <div style={{ width: s, transform: `scale(${k})`, display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
    <div style={{ width: s, height: s, borderRadius: s * 0.22, background: `radial-gradient(circle at 50% 35%, ${c}55 0%, #0b1110 75%)`, border: `5px solid ${c}`, boxShadow: `0 0 40px ${c}77, inset 0 0 30px ${c}33`,
      display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Img src={src} style={{ width: s * 0.62, height: s * 0.62, objectFit: "contain", filter: `drop-shadow(0 0 12px ${c})` }} />
    </div>
    {label ? <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: s * 0.15, letterSpacing: 4, color: c }}>{label}</div> : null}
  </div>
);
// corte de meme em tela cheia (vídeo inteiro sobre ele mesmo desfocado), corte seco
// meme que fica mais tempo: tela cheia até shrinkAt, depois encolhe pra uma janela no canto e segue tocando até at+dur
const MemeHold: React.FC<{ f: number; at: number; dur: number; shrinkAt: number; src: string; rate?: number }> = ({ f, at, dur, shrinkAt, src, rate = 1 }) => {
  if (f < at - 1 || f >= at + dur) return null;
  const k = interpolate(f, [shrinkAt, shrinkAt + 10], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const w = interpolate(k, [0, 1], [1080, 216]), h = interpolate(k, [0, 1], [1920, 384]);
  const x = interpolate(k, [0, 1], [0, 1080 - 216 - 28]), y = interpolate(k, [0, 1], [0, 438]);
  const out = f >= at + dur - 2 ? 1 : 0; // some de uma vez
  return (
    <Sequence from={at} durationInFrames={dur} layout="none">
      <div style={{ position: "absolute", left: x, top: y, width: w, height: h, overflow: "hidden", zIndex: 50, background: "#000",
        borderRadius: k * 26, border: k > 0.05 ? `5px solid ${CREAM}` : "none", boxShadow: k > 0.05 ? "0 20px 50px rgba(0,0,0,0.7)" : "none", opacity: 1 - out }}>
        <OffthreadVideo src={staticFile(src)} muted playbackRate={rate} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${1 + 0.06 * (f - at) / dur})` }} />
      </div>
    </Sequence>
  );
};
export const MemeCut: React.FC<{ f: number; at: number; dur: number; src: string; ss?: number; fit?: "cover" | "contain"; z0?: number; z1?: number }> = ({ f, at, dur, src, ss = 0, fit = "cover", z0 = 1, z1 = 1.08 }) => {
  if (f < at - 1 || f >= at + dur) return null;
  const z = interpolate(f, [at, at + dur], [z0, z1], clamp);
  return (
    <Sequence from={at} durationInFrames={dur} layout="none">
      <AbsoluteFill style={{ background: "#000", overflow: "hidden", zIndex: 50 }}>
        {fit === "contain" ? (
          <AbsoluteFill style={{ transform: "scale(1.2)", filter: "blur(40px) brightness(0.5)" }}>
            <OffthreadVideo src={staticFile(src)} muted startFrom={Math.round(ss * 30)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </AbsoluteFill>
        ) : null}
        <AbsoluteFill style={{ transform: `scale(${z})` }}>
          <OffthreadVideo src={staticFile(src)} muted startFrom={Math.round(ss * 30)} style={{ width: "100%", height: "100%", objectFit: fit }} />
        </AbsoluteFill>
      </AbsoluteFill>
    </Sequence>
  );
};

// ========== 1) GANCHO v2: só ícone + tipografia, uma batida por palavra ==========
// "Depois desse vídeo você NUNCA MAIS vai ficar ATRÁS em ALMAS e ITENS no DEADLOCK. Eu te prometo."
export const FMHook2: React.FC<{ life: number; neverAt?: number; maisAt?: number; behindAt?: number; soulsAt?: number; itemsAt?: number; dlAt?: number; promAt?: number }> = ({
  life, neverAt = 33, maisAt = 40, behindAt = 53, soulsAt = 74, itemsAt = 95, dlAt = 121, promAt = 146,
}) => {
  const f = useCurrentFrame();
  const hits = [0, neverAt, maisAt, behindAt, soulsAt, itemsAt, dlAt, promAt];
  const z = 1 + (f / Math.max(life, 1)) * 0.06 + punchZ(f, hits, 0.07, 9);
  // explosão de partículas na batida do quadro 0
  const burst = (at: number, c: string, n = 26) =>
    f < at || f > at + 26 ? null : Array.from({ length: n }).map((_, i) => {
      const ang = (i / n) * Math.PI * 2 + random(`b${at}${i}`) * 0.4;
      const d = ease(f, at, 22) * (380 + random(`bd${at}${i}`) * 420);
      const s = 8 + random(`bs${at}${i}`) * 16;
      return <div key={i} style={{ position: "absolute", left: 540 + Math.cos(ang) * d - s / 2, top: 700 + Math.sin(ang) * d - s / 2, width: s, height: s, borderRadius: "50%", background: c, boxShadow: `0 0 ${s * 2}px ${c}`, opacity: 1 - ease(f, at + 6, 20) }} />;
    });
  const typed = (txt: string, a: number, cps = 1.2) => txt.slice(0, Math.max(0, Math.floor((f - a) * cps)));
  const roll = Math.round(interpolate(f, [soulsAt, itemsAt - 3], [0, 12400], { ...clamp, easing: Easing.out(Easing.cubic) }) / 10) * 10;
  return (
    <Void z={z} glow={f >= behindAt && f < soulsAt ? "#3a140c" : "#0f3a34"}>
      <AbsoluteFill style={{ transform: "translateY(110px)" }}>
      {/* 0: ícone de alma bate no quadro 0 */}
      <Phase f={f} a={0} b={neverAt}>
        {burst(0, SOUL)}
        <div style={{ position: "absolute", left: 0, right: 0, top: 250, textAlign: "center", fontFamily: BODY, fontWeight: 900, fontSize: 50, letterSpacing: 12, color: CREAM }}>
          {typed("DEPOIS DESSE VÍDEO", 2, 1.1)}<span style={{ opacity: Math.floor(f / 4) % 2 ? 0 : 1, color: SOUL }}>▌</span>
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 400, display: "flex", justifyContent: "center", transform: `scale(${interpolate(f, [0, 6], [2.6, 1], { ...clamp, easing: Easing.in(Easing.quad) })}) rotate(${interpolate(f, [0, 6], [-25, 0], clamp)}deg)` }}>
          <SoulGlyph h={640} glow={1.2 + 0.3 * Math.sin(f / 3)} />
        </div>
      </Phase>
      {/* 1: NUNCA / MAIS */}
      <Phase f={f} a={neverAt} b={behindAt}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 330 }}><Slam f={f} at={neverAt} size={330}>NUNCA</Slam></div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 640 }}><Slam f={f} at={maisAt} size={330} c={SOUL} glow={SOUL}>MAIS</Slam></div>
        <Stroke f={f} at={maisAt + 3} d="M120 60 C 350 20, 650 30, 900 50" w={22} c={SOUL} vb="0 0 1000 100" style={{ left: 40, top: 960, width: 1000, height: 100 }} />
      </Phase>
      {/* 2: ATRÁS riscado */}
      <Phase f={f} a={behindAt} b={soulsAt}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ position: "absolute", left: 250 + i * 230, top: 300 + ((f - behindAt) * 9 + i * 40) % 140, fontFamily: POSTER, fontSize: 120, color: ORANGE, opacity: 0.55 }}>▼</div>
        ))}
        <div style={{ position: "absolute", left: 0, right: 0, top: 520 }}><Slam f={f} at={behindAt} size={340} c={ORANGE} glow={`${ORANGE}66`}>ATRÁS</Slam></div>
        <Stroke f={f} at={behindAt + 8} d="M80 80 L920 920" w={60} n={4} style={{ left: 140, top: 430, width: 800, height: 560 }} vb="0 0 1000 1000" />
        <Stroke f={f} at={behindAt + 11} d="M920 80 L80 920" w={60} n={4} style={{ left: 140, top: 430, width: 800, height: 560 }} vb="0 0 1000 1000" />
      </Phase>
      {/* 3: ALMAS (ícone + contador disparando) */}
      <Phase f={f} a={soulsAt} b={itemsAt}>
        {burst(soulsAt, SOUL, 20)}
        <div style={{ position: "absolute", left: 0, right: 0, top: 230, display: "flex", justifyContent: "center", transform: `scale(${back(f, soulsAt, 8, 2)})` }}>
          <SoulGlyph h={400} glow={1.4} />
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 660 }}><Slam f={f} at={soulsAt + 2} size={250} c={SOUL} glow={SOUL}>ALMAS</Slam></div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 930, textAlign: "center", fontFamily: POSTER, fontSize: 150, color: CREAM, letterSpacing: 4 }}>
          {roll.toLocaleString("pt-BR")}<span style={{ fontSize: 90, color: GREEN }}> ▲</span>
        </div>
      </Phase>
      {/* 4: ITENS (os 3 ícones reais) */}
      <Phase f={f} a={itemsAt} b={dlAt}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 330, display: "flex", justifyContent: "center", gap: 40 }}>
          {[
            { s: "Weapon_Icon.png", c: ORANGE, t: "ARMA" },
            { s: "Vitality_Icon.png", c: GREEN, t: "VIDA" },
            { s: "Spirit_Icon.png", c: GHOST, t: "ESPÍRITO" },
          ].map((it, i) => (
            <div key={it.t} style={{ transform: `translateY(${(1 - back(f, itemsAt + i * 4, 9, 2.2)) * 500}px) rotate(${(i - 1) * 5}deg)`, opacity: f >= itemsAt + i * 4 ? 1 : 0 }}>
              <Tile src={wk(it.s)} c={it.c} s={270} label={it.t} />
            </div>
          ))}
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 760 }}><Slam f={f} at={itemsAt + 6} size={300}>ITENS</Slam></div>
      </Phase>
      {/* 5: logo do Deadlock */}
      <Phase f={f} a={dlAt} b={promAt} out="zoom">
        <div style={{ position: "absolute", left: 0, right: 0, top: 520, display: "flex", justifyContent: "center", transform: `scale(${interpolate(f, [dlAt, dlAt + 5], [1.8, 1], { ...clamp, easing: Easing.in(Easing.quad) })})`, filter: `blur(${interpolate(f, [dlAt, dlAt + 5], [12, 0], clamp)}px)` }}>
          <Img src={mg("dl_logo.png")} style={{ width: 920, filter: "drop-shadow(0 0 30px rgba(255,255,255,0.35))" }} />
        </div>
      </Phase>
      {/* 6: eu te prometo */}
      {f >= promAt ? (
        <>
          <div style={{ position: "absolute", left: 0, right: 0, top: 300, display: "flex", justifyContent: "center", opacity: ease(f, promAt, 6) }}>
            <SoulGlyph h={230} glow={1} />
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 600, textAlign: "center", fontFamily: HAND, fontWeight: 700, fontSize: 170, color: CREAM, transform: "rotate(-4deg)",
            clipPath: `inset(0 ${(1 - ease(f, promAt, 12)) * 50}% 0 ${(1 - ease(f, promAt, 12)) * 50}%)`, textShadow: `0 0 30px ${SOUL}88` }}>eu te prometo.</div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 860, display: "flex", justifyContent: "center", transform: `scale(${back(f, promAt + 5, 10, 2.4)}) rotate(${Math.sin(f / 5) * 4}deg)` }}>
            <Img src={fl3("handshake")} style={{ width: 300 }} />
          </div>
        </>
      ) : null}
      </AbsoluteFill>
      <Flash f={f} ts={[0, neverAt, behindAt, soulsAt, dlAt]} pk={0.35} />
      <Flash f={f} ts={[behindAt + 8]} pk={0.25} c={RED} />
    </Void>
  );
};

// ========== 4) v2: cada alma alimenta o herói (arma · espírito · vida) → 3.800 = ultimate ==========
export const FMBoons2: React.FC<{ life: number; armAt?: number; spAt?: number; hpAt?: number; freeAt?: number; ultAt?: number; unlockAt?: number }> = ({
  life, armAt = 95, spAt = 131, hpAt = 168, freeAt = 197, ultAt = 248, unlockAt = 337,
}) => {
  const f = useCurrentFrame();
  const p2 = f >= ultAt;
  const unlocked = f >= unlockAt;
  const heroX = p2 ? interpolate(f, [ultAt, ultAt + 14], [430, 540], { ...clamp, easing: Easing.inOut(Easing.cubic) }) : 430;
  const heroS = p2 ? interpolate(f, [ultAt, ultAt + 14], [1, 1.12], { ...clamp, easing: Easing.inOut(Easing.cubic) }) : 1;
  const chest = { x: 680, y: 960 };
  const stats = [
    { at: armAt, s: "Weapon_Icon.png", c: ORANGE, t: "DANO DA ARMA", y: 520 },
    { at: spAt, s: "Spirit_Icon.png", c: GHOST, t: "PODER DA HABILIDADE", y: 720 },
    { at: hpAt, s: "Vitality_Icon.png", c: GREEN, t: "VIDA", y: 920 },
  ];
  const lit = stats.filter((s) => f >= s.at).pop();
  const tint = lit && f < lit.at + 14 ? lit.c : null;
  const souls = Math.round(interpolate(f, [ultAt, unlockAt - 3], [1200, 3800], { ...clamp, easing: Easing.out(Easing.cubic) }) / 10) * 10;
  // almas voando da esquerda pro peito do herói
  const stream = Array.from({ length: 9 }).map((_, i) => {
    const per = 34;
    const k = ((f + i * (per / 9) * 3.3) % per) / per;
    const y0 = 360 + random(`sy${i}`) * 900;
    const x = interpolate(k, [0, 1], [-60, (p2 ? 540 : chest.x) - 20]);
    const y = interpolate(k, [0, 1], [y0, p2 ? 1000 : chest.y], { easing: Easing.inOut(Easing.quad) });
    return <div key={i} style={{ position: "absolute", left: x, top: y, opacity: Math.sin(k * Math.PI) }}><SoulGlyph h={56} glow={0.8} /></div>;
  });
  const bolt = (i: number) => {
    let d = `M ${480 + i * 60} 0`;
    let x = 480 + i * 60;
    for (let s = 1; s <= 9; s++) { x += (random(`bo${i}${Math.floor(f / 2)}${s}`) - 0.5) * 140; d += ` L ${x} ${s * 105}`; }
    return <path key={i} d={d} stroke="#dff6ff" strokeWidth={9} fill="none" style={{ filter: "drop-shadow(0 0 18px #7fd8ff)" }} />;
  };
  return (
    <Void glow={unlocked ? "#123a5a" : "#0f3a34"} z={1 + punchZ(f, [armAt, spAt, hpAt, unlockAt], 0.05, 9)}>
      {/* herói */}
      <div style={{ position: "absolute", left: heroX - 520, top: 640, width: 1200, transform: `scale(${heroS})`, transformOrigin: "50% 30%",
        WebkitMaskImage: "radial-gradient(ellipse 50% 48% at 50% 46%, #000 55%, transparent 100%)", maskImage: "radial-gradient(ellipse 50% 48% at 50% 46%, #000 55%, transparent 100%)",
        filter: `${tint ? `drop-shadow(0 0 40px ${tint})` : unlocked ? "drop-shadow(0 0 60px #7fd8ff)" : "drop-shadow(0 0 30px rgba(95,242,214,0.25))"} brightness(${p2 && !unlocked ? 0.55 : 1})` }}>
        <Img src={wk("Seven_Render.png")} style={{ width: "100%" }} />
      </div>
      {stream}
      {!p2 ? (
        <>
          <div style={{ position: "absolute", left: 0, right: 0, top: 210, display: "flex", alignItems: "center", justifyContent: "center", gap: 24 }}>
            <SoulGlyph h={150} />
            <Slam f={f} at={2} size={150}>CADA ALMA</Slam>
          </div>
          {stats.map((s, i) =>
            f < s.at ? null : (
              <React.Fragment key={s.t}>
                <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
                  <path d={`M 560 ${s.y + 92} L 610 ${s.y + 92} L ${chest.x - 40 + i * 30} ${chest.y - 160 + i * 120}`} fill="none" stroke={s.c} strokeWidth={5} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - ease(f, s.at + 3, 8)} />
                  <circle cx={chest.x - 40 + i * 30} cy={chest.y - 160 + i * 120} r={14 * ease(f, s.at + 10, 4)} fill={s.c} style={{ filter: `drop-shadow(0 0 10px ${s.c})` }} />
                </svg>
                <div style={{ position: "absolute", left: 60, top: s.y, display: "flex", alignItems: "center", gap: 22, transform: `translateX(${(1 - back(f, s.at, 9, 1.8)) * -500}px)` }}>
                  <Tile src={wk(s.s)} c={s.c} s={140} />
                  <div>
                    <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 30, letterSpacing: 4, color: s.c }}>{s.t}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 6 }}>
                      <svg width={58} height={58} viewBox="0 0 58 58" style={{ transform: `translateY(${-6 * Math.abs(Math.sin((f - s.at) / 7))}px)`, filter: `drop-shadow(0 0 10px ${s.c})` }}><path d="M29 4 L54 34 H38 V54 H20 V34 H4 Z" fill={s.c} /></svg>
                      <div style={{ fontFamily: POSTER, fontSize: 88, color: CREAM, lineHeight: 1 }}>SOBE</div>
                    </div>
                  </div>
                </div>
              </React.Fragment>
            ),
          )}
          {f >= freeAt ? (
            <div style={{ position: "absolute", left: 60, top: 1110, display: "flex", alignItems: "center", gap: 26 }}>
              <div style={{ position: "relative", width: 230, height: 190, transform: `rotate(-5deg) scale(${back(f, freeAt, 9, 2)})` }}>
                <Img src={wk("Weapon_shop.png")} style={{ width: 230, height: 190, objectFit: "cover", borderRadius: 16, border: `4px solid ${CREAM}`, filter: "grayscale(0.7) brightness(0.6)" }} />
                <Stroke f={f} at={freeAt + 5} d="M60 60 L940 940 M940 60 L60 940" w={70} n={6} style={{ left: 10, top: 0, width: 210, height: 190 }} />
              </div>
              <Slam f={f} at={freeAt + 2} size={92} style={{ textAlign: "left" }}>SEM COMPRAR<br />NADA</Slam>
            </div>
          ) : null}
        </>
      ) : (
        <>
          {unlocked ? <svg width={1080} height={1000} style={{ position: "absolute", left: 0, top: 0, opacity: f < unlockAt + 22 ? 1 : 0.35 }}>{[-3, 0, 3].map(bolt)}</svg> : null}
          <div style={{ position: "absolute", left: 0, right: 0, top: 220, display: "flex", alignItems: "center", justifyContent: "center", gap: 20 }}>
            <SoulGlyph h={170} glow={unlocked ? 1.8 : 1} />
            <div style={{ fontFamily: POSTER, fontSize: 210, color: unlocked ? SOUL : CREAM, textShadow: unlocked ? `0 0 50px ${SOUL}` : "0 10px 40px #000", transform: `scale(${1 + punchZ(f, [unlockAt], 0.18, 10)})` }}>{souls.toLocaleString("pt-BR")}</div>
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 500, display: "flex", justifyContent: "center", alignItems: "center", gap: 20 }}>
            <Img src={fl3(unlocked ? "unlocked" : "locked")} style={{ width: 150, transform: `scale(${unlocked ? back(f, unlockAt, 10, 2.6) : 1}) rotate(${unlocked ? 0 : Math.sin(f / 2) * 3}deg)` }} />
            {unlocked ? <Slam f={f} at={unlockAt + 2} size={170} c="#dff6ff" glow="#7fd8ff">ULTIMATE</Slam> : <div style={{ fontFamily: POSTER, fontSize: 170, color: `${CREAM}55` }}>ULTIMATE</div>}
          </div>
        </>
      )}
      <Flash f={f} ts={[ultAt]} pk={0.3} />
      <Flash f={f} ts={[unlockAt]} pk={0.7} c="#bfeaff" />
    </Void>
  );
};

// ========== 8) v2: quantos na lane? dupla 54% + 54% = 108% · trio 36% = alma jogada fora ==========
const Pie: React.FC<{ p: number; c: string; s?: number }> = ({ p, c, s = 170 }) => {
  const r = s / 2 - 12;
  const C = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: s, height: s }}>
      <svg width={s} height={s} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={s / 2} cy={s / 2} r={r} fill="rgba(0,0,0,0.6)" stroke="#ffffff22" strokeWidth={18} />
        <circle cx={s / 2} cy={s / 2} r={r} fill="none" stroke={c} strokeWidth={18} strokeDasharray={`${C * p} ${C}`} strokeLinecap="round" style={{ filter: `drop-shadow(0 0 10px ${c})` }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: POSTER, fontSize: s * 0.3, color: CREAM }}>{Math.round(p * 100)}%</div>
    </div>
  );
};
export const FMShare2: React.FC<{ life: number; shhAt?: number; duoAt?: number; p54At?: number; p108At?: number; leoAt?: number; soloAt?: number; trioAt?: number; p36At?: number; wasteAt?: number }> = ({
  life, shhAt = 20, duoAt = 101, p54At = 308, p108At = 396, leoAt = 515, soloAt = 564, trioAt = 617, p36At = 737, wasteAt = 848,
}) => {
  const f = useCurrentFrame();
  const trio = f >= trioAt;
  const merged = f >= p108At && f < soloAt;
  const solo = f >= soloAt && f < trioAt;
  const heroes = [
    { img: "Haze_card.png", at: 0 },
    { img: "Infernus_card.png", at: duoAt },
    { img: "Rem_card.png", at: trioAt },
  ];
  const n = trio ? 3 : f >= duoAt ? 2 : 1;
  const W = 250;
  const xs = (k: number) => (n === 1 ? [540] : n === 2 ? [330, 750] : [210, 540, 870])[k];
  const share = trio ? interpolate(f, [p36At, p36At + 18], [0.54, 0.36], clamp) : interpolate(f, [p54At, p54At + 22], [0, 0.54], { ...clamp, easing: Easing.out(Easing.cubic) });
  const pc = trio ? (share <= 0.37 ? RED : YEL) : GREEN;
  // a onda de tropas descendo a lane e morrendo
  const waveK = (f % 75) / 75;
  const lane = (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      <path d="M 470 250 L 610 250 L 1000 1300 L 80 1300 Z" fill="#ffd23f0d" stroke={YEL} strokeWidth={4} strokeOpacity={0.6} />
      {Array.from({ length: 8 }).map((_, i) => {
        const k = ((i / 8 + f / 240) % 1);
        const y = 250 + k * k * 1050;
        const w = 140 + k * 920;
        return <line key={i} x1={540 - w / 2 + 20} x2={540 + w / 2 - 20} y1={y} y2={y} stroke={YEL} strokeOpacity={0.12 + k * 0.15} strokeWidth={2} />;
      })}
    </svg>
  );
  const troops = f < 40 || merged || (trio && f >= p36At) ? null : Array.from({ length: 5 }).map((_, i) => {
    const y = 470 + waveK * 260;
    const x = 540 + (i - 2) * (40 + waveK * 50);
    const dead = waveK > 0.75;
    return dead ? null : <div key={i} style={{ position: "absolute", left: x - 16, top: y, width: 32, height: 32, transform: "rotate(45deg)", background: ORANGE, boxShadow: `0 0 16px ${ORANGE}` }} />;
  });
  const orbFly = f < p54At ? null : Array.from({ length: n * 2 }).map((_, i) => {
    const k = Math.max(0, (waveK - 0.75) / 0.25);
    if (k <= 0) return null;
    const h = i % n;
    const x = interpolate(k, [0, 1], [540, xs(h)]);
    const y = interpolate(k, [0, 1], [700, 880], { easing: Easing.in(Easing.quad) });
    return <div key={i} style={{ position: "absolute", left: x - 22 + (i > n ? 30 : 0), top: y }}><SoulGlyph h={50} /></div>;
  });
  const sh = trio ? shake(f, trioAt, 10, 12, "trio") : { x: 0, y: 0 };
  return (
    <Void glow={trio && f >= p36At ? "#3a140c" : "#0f3a34"} z={1 + punchZ(f, [duoAt, p54At, p108At, trioAt, p36At], 0.05, 9)}>
      {lane}
      <Img src={wk("Icon_lane_yellow.svg")} style={{ position: "absolute", left: 500, top: 190, width: 80 }} />
      {troops}
      {orbFly}
      {/* título */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 300 }}>
        {trio ? <Slam f={f} at={trioAt} size={150} c={f >= p36At ? RED : CREAM}>TRIO</Slam> : solo ? <Slam f={f} at={soloAt} size={130}>SOZINHO = 100%</Slam> : f >= duoAt ? <Slam f={f} at={duoAt} size={150} c={GREEN} glow={`${GREEN}55`}>DUPLA</Slam> : null}
      </div>
      {/* heróis */}
      {heroes.slice(0, n).map((h, i) => (
        <div key={h.img} style={{ position: "absolute", left: xs(i) - W / 2 + sh.x, top: 820 + sh.y, width: W, transform: `translateY(${(1 - back(f, h.at, 10, 1.6)) * -900}px) rotate(${(i - (n - 1) / 2) * 4}deg)`, opacity: solo && i > 0 ? 0.15 : 1 }}>
          {f >= p54At && !merged && !solo ? <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}><Pie p={share} c={pc} s={160} /></div> : <div style={{ height: 174 }} />}
          <Img src={wk(h.img)} style={{ width: W, borderRadius: 18, border: `5px solid ${trio && f >= p36At ? RED : CREAM}`, boxShadow: "0 20px 50px rgba(0,0,0,0.7)" }} />
        </div>
      ))}
      {/* 54 + 54 = 108 */}
      {merged ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 560, textAlign: "center" }}>
          <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 56, letterSpacing: 6, color: CREAM, opacity: ease(f, p108At, 6) }}>54% + 54%</div>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 20 }}>
            <Slam f={f} at={p108At + 3} size={240} c={GREEN} glow={GREEN}>108%</Slam>
            <Img src={fl3("chart_increasing")} style={{ width: 170, transform: `scale(${back(f, p108At + 8, 10, 2.4)})` }} />
          </div>
        </div>
      ) : null}
      {trio && f >= p36At ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 560, display: "flex", justifyContent: "center", alignItems: "center", gap: 16 }}>
          <Slam f={f} at={p36At + 4} size={110} c={RED}>36% CADA</Slam>
          <Img src={fl3("chart_decreasing")} style={{ width: 120, transform: `scale(${back(f, p36At + 8, 10, 2.4)})` }} />
        </div>
      ) : null}
      <Flash f={f} ts={[duoAt, p108At, trioAt]} pk={0.3} />
      <Flash f={f} ts={[p36At]} pk={0.25} c={RED} />
      {/* memes */}
      <MemeCut f={f} at={shhAt} dur={38} src="videos/2026-11-05_deadlock-patch-celeste_R/memes/shh.mp4" ss={0.3} />
      <MemeHold f={f} at={leoAt} dur={Math.max(96, trioAt + 18 - leoAt)} shrinkAt={Math.max(leoAt + 30, trioAt - 12)} src="videos/2026-11-05_deadlock-patch-celeste_R/memes/lula.mp4" rate={0.85} />
      <MemeCut f={f} at={wasteAt} dur={Math.max(1, life - wasteAt)} src="videos/2026-11-06_deadlock-magia_R/memes/notstonks.mp4" fit="contain" />
    </Void>
  );
};

// ========== 6) v2: a bolinha da tropa NO JOGO (guia MrGubami, sem as setas dele) + animação embaixo ==========
// orb_slow2.mp4 (13,6 s, de orb_seq): intro 0–2,6 s · fusão · tropa morre 3,44 · bola preta sobe sem parar até 6,2 · fusão pra tomada em que ela fica verde (7,05) · tiro e +56 em 9,56. O anel segue a TRK.
const OrbBall: React.FC<{ c: string; s: number; x: number; y: number; o?: number }> = ({ c, s, x, y, o = 1 }) => {
  const f = useCurrentFrame();
  return (
    <div style={{ position: "absolute", left: x - s / 2, top: y - s / 2, width: s, height: s, borderRadius: "50%", opacity: o, transform: `scale(${1 + 0.06 * Math.sin(f / 4)})`,
      background: `radial-gradient(circle at 35% 30%, #fff 0%, ${c} 38%, ${c}66 70%, rgba(0,0,0,0) 72%)`, boxShadow: `0 0 ${s * 0.6}px ${s * 0.25}px ${c}88` }} />
  );
};
export const FMOrb2: React.FC<{ life: number; dieAt?: number; halfAt?: number; greenAt?: number; shotAt?: number; timeAt?: number }> = ({
  life, dieAt = 113, halfAt = 151, greenAt = 229, shotAt = 304, timeAt = 391,
}) => {
  const f = useCurrentFrame();
  const green = f >= greenAt;
  const c = green ? GREEN : CREAM;
  const hit = f >= shotAt + 4;
  const rise = ease(f, halfAt - 6, 16);
  const fly = ease(f, shotAt + 4, 14);
  // anel que marca a bolinha no vídeo (ela fica perto do centro do recorte)
  // trajetória da bolinha no clipe (quadro do clipe -> x,y na tela), medida quadro a quadro em orb_slow2.mp4
  const TRK: [number, number, number][] = [[104, 577, 530], [108, 577, 518], [112, 579, 513], [116, 579, 511], [120, 581, 499], [124, 587, 473], [128, 591, 457], [132, 594, 446], [138, 597, 433], [144, 604, 423],
    [150, 592, 423], [156, 592, 471], [162, 587, 502], [168, 587, 550], [174, 597, 579], [180, 599, 598], [186, 597, 603], [195, 572, 610], [400, 572, 606]];
  const rx = interpolate(f, TRK.map((k) => k[0]), TRK.map((k) => k[1]), clamp);
  const ry = interpolate(f, TRK.map((k) => k[0]), TRK.map((k) => k[2]), clamp);
  const ring = (at: number, until: number, col: string, label: string) =>
    f < at || f >= until ? null : (
      <>
        <div style={{ position: "absolute", left: rx - 70, top: ry - 70, width: 140, height: 140, borderRadius: "50%", border: `6px solid ${col}`, boxShadow: `0 0 24px ${col}`,
          transform: `scale(${interpolate(f, [at, at + 8], [2.2, 1], { ...clamp, easing: Easing.out(Easing.cubic) }) + 0.05 * Math.sin(f / 3)})`, opacity: ease(f, at, 5) }} />
        <svg width={1080} height={1100} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <path d={`M ${rx + 52} ${ry - 50} L ${rx + 162} ${ry - 160} L 980 ${ry - 160}`} fill="none" stroke={col} strokeWidth={5} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - ease(f, at + 5, 8)} />
        </svg>
        <div style={{ position: "absolute", left: rx + 172, top: ry - 218, fontFamily: BODY, fontWeight: 900, fontSize: 34, letterSpacing: 4, color: col, opacity: ease(f, at + 10, 5), textShadow: "0 2px 10px #000" }}>{label}</div>
      </>
    );
  return (
    <Void glow={green ? "#0f3a1c" : "#0f3a34"} motes={false}>
      {/* gameplay */}
      <div style={{ position: "absolute", left: 0, top: 200, width: 1080, height: 810, overflow: "hidden", borderTop: `4px solid ${c}55`, borderBottom: `4px solid ${c}55`,
        transform: `scale(${1 + punchZ(f, [dieAt, shotAt + 4], 0.04, 9)})` }}>
        <OffthreadVideo src={wk("orb_slow2.mp4")} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", left: 24, top: 18, fontFamily: BODY, fontWeight: 900, fontSize: 24, letterSpacing: 5, color: "#fff", background: "rgba(0,0,0,0.55)", padding: "6px 14px", borderRadius: 8 }}>
          ● NO JOGO{f >= dieAt - 14 && f < shotAt + 30 ? " · CÂMERA LENTA" : ""}
        </div>
      </div>
      <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1100 }}>
        {ring(Math.min(dieAt + 6, halfAt - 4), greenAt, CREAM, "A BOLINHA")}
        {ring(greenAt, shotAt + 4, GREEN, "VERDE = SUA")}
        {hit && f < shotAt + 40 ? ring(shotAt + 4, shotAt + 40, YEL, "CONFIRMADA") : null}
      </div>
      {/* animação embaixo: a bolinha sobe, fica verde, leva o tiro */}
      <div style={{ position: "absolute", left: 0, top: 1030, width: 1080, height: 290 }}>
        {f >= halfAt - 6 && (!hit || fly < 1) ? <OrbBall c={c} s={120 - fly * 70} x={170 + fly * 700} y={200 - rise * 90 - fly * 120} /> : null}
        {f >= halfAt - 6 ? <OrbBall c={c} s={64} x={170} y={235} o={0.55} /> : null}
        {f >= halfAt ? (
          <div style={{ position: "absolute", left: 300, top: 40, transform: `scale(${back(f, halfAt, 8, 2)})`, transformOrigin: "0 50%" }}>
            <div style={{ fontFamily: POSTER, fontSize: 120, color: c, lineHeight: 1, textShadow: green ? `0 0 30px ${GREEN}` : "none" }}>50%</div>
            <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 32, letterSpacing: 5, color: CREAM }}>{green ? "DA ALMA · É SUA" : "DA ALMA DA TROPA"}</div>
          </div>
        ) : null}
        {f >= shotAt - 10 && f < shotAt + 6 ? (
          <svg width={1080} height={290} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
            <g transform={`translate(170, ${200 - rise * 90})`}>
              <circle r={70} fill="none" stroke={CREAM} strokeWidth={5} />
              <path d="M-100 0 H-45 M45 0 H100 M0 -100 V-45 M0 45 V100" stroke={CREAM} strokeWidth={5} />
            </g>
          </svg>
        ) : null}
        {hit ? (
          <div style={{ position: "absolute", left: 600, top: 40, transform: `rotate(-5deg) scale(${interpolate(f, [shotAt + 4, shotAt + 9], [1.5, 1], { ...clamp, easing: Easing.in(Easing.quad) })})`, opacity: ease(f, shotAt + 4, 3) }}>
            <div style={{ border: `8px solid ${GREEN}`, borderRadius: 14, padding: "6px 24px", textAlign: "center", color: GREEN, background: "rgba(0,0,0,0.4)" }}>
              <div style={{ fontFamily: POSTER, fontSize: 64, lineHeight: 1 }}>+ CONFIRMADA</div>
              <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 24, letterSpacing: 6 }}>UM TIRO SÓ</div>
            </div>
          </div>
        ) : null}
        {f >= timeAt ? (
          <div style={{ position: "absolute", left: 300, top: 190, fontFamily: HAND, fontWeight: 700, fontSize: 64, color: CREAM, transform: "rotate(-3deg)", clipPath: `inset(0 ${(1 - ease(f, timeAt, 16)) * 100}% 0 0)` }}>…ou espera o tempo acabar</div>
        ) : null}
      </div>
      <Flash f={f} ts={[shotAt + 4]} pk={0.3} c={GREEN} />
    </Void>
  );
};

// ================= v2: peças comuns das cenas refeitas =================
const ob2 = (n: string) => staticFile(`videos/2026-11-07_deadlock-objetivos_R/ob/${n}`);
const MM = {
  hamster: "videos/2026-11-06_deadlock-ranked_R/memes/hamster.mp4",
  nazare: "videos/2026-11-06_deadlock-ranked_R/memes/nazare.mp4",
  macacoPc: "videos/2026-11-09_deadlock-farm_R/memes/macaco_pc.mp4",
  speed: "videos/2026-11-06_deadlock-ranked_R/memes/speed.mp4",
  huh: "videos/2026-10-28_deadlock-rei-dos-ratos_R/clips/huh.mp4",
  fine: "videos/2026-11-06_deadlock-magia_R/memes/fine.mp4",
  yasuo: "videos/2026-11-06_deadlock-magia_R/memes/yasuo.mp4",
};
const CLIPLEN: Record<string, number> = { deny: 4.4, crate: 4, sinner: 3.5, hud: 2.4, shop: 3.4, urn: 3, urncarry: 8, jungle: 2.6 };
// janela de gameplay (recortes de guias, sem as anotações dos autores), em loop
const GameWin: React.FC<{ clip: string; y?: number; h?: number; c?: string; tag?: string }> = ({ clip, y = 200, h = 810, c = CREAM, tag = "NO JOGO" }) => {
  const len = Math.max(1, Math.floor((CLIPLEN[clip] ?? 3) * 30) - 1);
  return (
    <div style={{ position: "absolute", left: 0, top: y, width: 1080, height: h, overflow: "hidden", borderTop: `4px solid ${c}66`, borderBottom: `4px solid ${c}66` }}>
      <Loop durationInFrames={len} layout="none">
        <OffthreadVideo src={wk(`c_${clip}.mp4`)} muted style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
      </Loop>
      <div style={{ position: "absolute", left: 24, top: 18, fontFamily: BODY, fontWeight: 900, fontSize: 24, letterSpacing: 5, color: "#fff", background: "rgba(0,0,0,0.6)", padding: "6px 14px", borderRadius: 8 }}>● {tag}</div>
    </div>
  );
};
const F3: React.FC<{ n: string; w: number; at: number; f: number; style?: React.CSSProperties; s?: number }> = ({ n, w, at, f, style, s = 2.4 }) =>
  f < at ? null : <Img src={fl3(n)} style={{ width: w, transform: `scale(${back(f, at, 10, s)}) rotate(${Math.sin(f / 6) * 4}deg)`, ...style }} />;
const Cross: React.FC<{ f: number; at: number; w: number; h: number; style?: React.CSSProperties }> = ({ f, at, w, h, style }) => (
  <Stroke f={f} at={at} d="M90 90 L910 910 M910 90 L90 910" w={80} n={5} style={{ width: w, height: h, ...style }} />
);
const Lvl: React.FC<{ n: number; s?: number; c?: string }> = ({ n, s = 200, c = GREEN }) => (
  <div style={{ width: s, height: s, borderRadius: "50%", background: "radial-gradient(circle at 50% 35%, #1f5a45 0%, #0b2018 80%)", border: `${s * 0.06}px solid ${c}`, boxShadow: `0 0 30px ${c}88`,
    display: "flex", alignItems: "center", justifyContent: "center", fontFamily: POSTER, fontSize: s * 0.48, color: CREAM }}>{n}</div>
);
const Card: React.FC<{ img: string; w?: number; c?: string; style?: React.CSSProperties }> = ({ img, w = 240, c = CREAM, style }) => (
  <Img src={img} style={{ width: w, borderRadius: 16, border: `5px solid ${c}`, boxShadow: "0 18px 40px rgba(0,0,0,0.7)", ...style }} />
);
const At: React.FC<{ f: number; a: number; b?: number; children: React.ReactNode }> = ({ f, a, b = 1e9, children }) => (f >= a && f < b ? <>{children}</> : null);
const pop = (f: number, at: number, dy = 0): React.CSSProperties => ({ transform: `translateY(${(1 - back(f, at, 9, 1.8)) * dy}px) scale(${back(f, at, 9, 2)})`, opacity: f >= at ? 1 : 0 });
const Ghost: React.FC<{ s: number }> = ({ s }) => (
  <div style={{ width: s, height: s, borderRadius: "50%", background: `radial-gradient(circle at 40% 35%, #f1e4ff 0%, ${GHOST} 40%, #3a1a66 75%)`, boxShadow: `0 0 80px ${GHOST}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
    <Img src={wk("Unsecured_Souls.png")} style={{ width: s * 0.5 }} />
  </div>
);
const Reticle: React.FC<{ r: number; c: string; w?: number }> = ({ r, c, w = 7 }) => (
  <g><circle r={r} fill="none" stroke={c} strokeWidth={w} /><path d={`M${-r * 1.45} 0 H${-r * 0.6} M${r * 0.6} 0 H${r * 1.45} M0 ${-r * 1.45} V${-r * 0.6} M0 ${r * 0.6} V${r * 1.45}`} stroke={c} strokeWidth={w} /></g>
);

// ========== 2) série v2: trilho de episódios, 01 feito → 02 acende ALMA ==========
export const FMSeries2: React.FC<{ life: number; ep1At?: number; ep2At?: number }> = ({ life, ep1At = 95, ep2At = 204 }) => {
  const f = useCurrentFrame();
  const pan = interpolate(f, [ep2At - 24, ep2At - 4], [0, -260], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const slot = (x: number, n: string, children: React.ReactNode, lit: boolean, at: number) => (
    <div style={{ position: "absolute", left: x, top: 470, width: 460, ...pop(f, at, 300) }}>
      <div style={{ fontFamily: POSTER, fontSize: 64, color: lit ? SOUL : `${CREAM}88`, letterSpacing: 4 }}>EP. {n}</div>
      <div style={{ marginTop: 10, width: 460, height: 600, borderRadius: 28, overflow: "hidden", border: `6px solid ${lit ? SOUL : `${CREAM}55`}`, boxShadow: lit ? `0 0 60px ${SOUL}88` : "0 20px 50px #000", position: "relative", background: "#071210" }}>{children}</div>
    </div>
  );
  return (
    <Void z={1 + punchZ(f, [ep1At, ep2At], 0.05, 9)}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 220, display: "flex", justifyContent: "center", ...pop(f, 2, -100) }}>
        <Img src={mg("dl_logo.png")} style={{ width: 520 }} />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 330, textAlign: "center", fontFamily: BODY, fontWeight: 900, fontSize: 40, letterSpacing: 14, color: CREAM, opacity: ease(f, 6, 8) }}>BÁSICOS</div>
      <div style={{ position: "absolute", inset: 0, transform: `translateX(${pan}px)` }}>
        {slot(60, "01", (
          <>
            <Img src={ob2("Map_colored.png")} style={{ width: "100%", height: "100%", objectFit: "cover", filter: f >= ep1At ? "grayscale(0.5) brightness(0.6)" : "none" }} />
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 30, textAlign: "center", fontFamily: POSTER, fontSize: 70, color: CREAM, textShadow: "0 4px 20px #000" }}>OBJETIVOS</div>
            {f >= ep1At ? <div style={{ position: "absolute", right: 24, top: 24, width: 110, height: 110, borderRadius: "50%", background: GREEN, color: INK, fontSize: 80, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${back(f, ep1At, 8, 2.4)})` }}>✓</div> : null}
          </>
        ), false, 4)}
        {slot(580, "02", (
          <>
            <div style={{ position: "absolute", left: 0, right: 0, top: 70, display: "flex", justifyContent: "center", opacity: f >= ep2At ? 1 : 0.2 }}>
              <SoulGlyph h={330} glow={f >= ep2At ? 1.5 : 0} c={f >= ep2At ? SOUL : `${CREAM}55`} />
            </div>
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 30 }}>{f >= ep2At ? <Slam f={f} at={ep2At} size={120} c={SOUL} glow={SOUL}>ALMA</Slam> : <div style={{ fontFamily: POSTER, fontSize: 120, color: `${CREAM}33`, textAlign: "center" }}>???</div>}</div>
          </>
        ), f >= ep2At, 10)}
      </div>
      <Flash f={f} ts={[ep2At]} pk={0.45} c={SOUL} />
    </Void>
  );
};

// ========== 3) alma = 2 coisas v2: a loja de verdade + o anel de nível ==========
export const FMTwo2: React.FC<{ life: number; shopAt?: number; lvlAt?: number }> = ({ life, shopAt = 75, lvlAt = 126 }) => {
  const f = useCurrentFrame();
  const split = ease(f, shopAt - 8, 10);
  const lv = Math.min(30, Math.max(1, Math.round(interpolate(f, [lvlAt, lvlAt + 20], [1, 30], clamp))));
  return (
    <Void z={1 + punchZ(f, [shopAt, lvlAt], 0.05, 9)}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 300 - split * 90, display: "flex", justifyContent: "center", transform: `scale(${1 - split * 0.55})`, transformOrigin: "50% 0" }}>
        <SoulGlyph h={440} glow={1.3} />
      </div>
      {f < shopAt ? <div style={{ position: "absolute", left: 0, right: 0, top: 820 }}><Slam f={f} at={4} size={170}>2 COISAS</Slam></div> : null}
      <At f={f} a={shopAt}>
        <div style={{ position: "absolute", left: 40, top: 560, width: 480, height: 560, borderRadius: 26, overflow: "hidden", border: `5px solid ${YEL}`, boxShadow: `0 0 40px ${YEL}55`, ...pop(f, shopAt, 200) }}>
          <Img src={wk("Weapon_shop.png")} style={{ position: "absolute", top: 0, left: 0, height: 560, width: 685, maxWidth: "none", transform: `translateX(${interpolate(f, [shopAt, life], [0, -205], clamp)}px)` }} />
        </div>
        <div style={{ position: "absolute", left: 40, width: 480, top: 1140 }}><Slam f={f} at={shopAt + 3} size={110} c={YEL}>LOJA</Slam></div>
        <F3 n="money_bag" w={150} at={shopAt + 6} f={f} style={{ position: "absolute", left: 400, top: 490 }} />
      </At>
      <At f={f} a={lvlAt}>
        <div style={{ position: "absolute", left: 600, top: 640, ...pop(f, lvlAt, 200) }}><Lvl n={lv} s={400} /></div>
        <div style={{ position: "absolute", left: 560, width: 480, top: 1140 }}><Slam f={f} at={lvlAt + 3} size={110} c={GREEN}>NÍVEL</Slam></div>
      </At>
      <Flash f={f} ts={[shopAt, lvlAt]} pk={0.25} />
    </Void>
  );
};

// ========== 5) v2: atrás em alma = atrás em item E herói mais fraco ==========
export const FMWeak2: React.FC<{ life: number; itemsAt?: number; weakAt?: number }> = ({ life, itemsAt = 83, weakAt = 140 }) => {
  const f = useCurrentFrame();
  const weak = ease(f, weakAt, 14);
  const side = (x: number, img: string, souls: number, c: string, you: boolean) => (
    <div style={{ position: "absolute", left: x, top: 260, width: 440, display: "flex", flexDirection: "column", alignItems: "center",
      transform: you ? `scale(${1 - weak * 0.22}) translateY(${weak * 90}px)` : `scale(${1 + weak * 0.08})`, filter: you ? `grayscale(${weak}) brightness(${1 - weak * 0.35})` : "none" }}>
      <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 30, letterSpacing: 6, color: c }}>{you ? "VOCÊ" : "INIMIGO"}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "6px 0 14px" }}><SoulGlyph h={70} glow={0.6} /><span style={{ fontFamily: POSTER, fontSize: 80, color: CREAM }}>{souls.toLocaleString("pt-BR")}</span></div>
      <Card img={img} w={280} c={c} />
      {f >= itemsAt ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 120px)", gap: 12, marginTop: 20 }}>
          {Array.from({ length: 6 }).map((_, i) => {
            const full = you ? i < 1 : true;
            const cc = [ORANGE, GREEN, GHOST][i % 3];
            return (
              <div key={i} style={{ width: 120, height: 120, borderRadius: 14, border: full ? `4px solid ${cc}` : `4px dashed ${CREAM}44`, background: full ? `${cc}22` : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center", ...pop(f, itemsAt + i * 2) }}>
                {full ? <Img src={wk(["Weapon_Icon.png", "Vitality_Icon.png", "Spirit_Icon.png"][i % 3])} style={{ width: 70 }} /> : null}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
  return (
    <Void glow={f >= weakAt ? "#3a140c" : "#0f3a34"} z={1 + punchZ(f, [itemsAt, weakAt], 0.05, 9)}>
      {side(60, wk("Haze_card.png"), 4200, ORANGE, true)}
      {side(580, wk("Infernus_card.png"), 9800, GREEN, false)}
      {f >= weakAt ? <div style={{ position: "absolute", left: 0, right: 0, top: 1150 }}><Slam f={f} at={weakAt + 2} size={120} c={RED} glow={`${RED}66`}>HERÓI MAIS FRACO</Slam></div> : null}
      <Flash f={f} ts={[weakAt]} pk={0.3} c={RED} />
    </Void>
  );
};

// ========== 7) v2: negar — o inimigo atira na SUA bolinha (gameplay) · já existia no Dota ==========
export const FMDeny2: React.FC<{ life: number; enemyAt?: number; denyAt?: number; dotaAt?: number; mastAt?: number }> = ({ life, enemyAt = 108, denyAt = 225, dotaAt = 301, mastAt = 448 }) => {
  const f = useCurrentFrame();
  const stolen = ease(f, enemyAt + 30, 16);
  const dotaPh = f >= dotaAt;
  return (
    <Void glow={dotaPh ? "#3a0c0c" : "#2a1a0c"} z={1 + punchZ(f, [enemyAt + 44, denyAt, dotaAt], 0.05, 9)}>
      {!dotaPh ? (
        <>
          <GameWin clip="deny" c={ORANGE} tag="NO JOGO · NEGANDO" />
          <div style={{ position: "absolute", left: 0, top: 1030, width: 1080, height: 290 }}>
            <div style={{ position: "absolute", left: 80, top: 20, fontFamily: BODY, fontWeight: 900, fontSize: 26, letterSpacing: 5, color: GREEN }}>VOCÊ</div>
            <div style={{ position: "absolute", right: 80, top: 20, fontFamily: BODY, fontWeight: 900, fontSize: 26, letterSpacing: 5, color: ORANGE }}>INIMIGO</div>
            {f < denyAt ? <div style={{ position: "absolute", left: 120 + stolen * 760, top: 80 - Math.sin(stolen * Math.PI) * 60 }}><SoulGlyph h={130} c={stolen > 0.5 ? ORANGE : GREEN} glow={1.2} /></div> : null}
            {f >= enemyAt && f < enemyAt + 34 ? (
              <svg width={1080} height={290} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
                <g transform={`translate(${interpolate(f, [enemyAt, enemyAt + 26], [960, 165], { ...clamp, easing: Easing.out(Easing.cubic) })}, 145)`}><Reticle r={60} c={ORANGE} /></g>
              </svg>
            ) : null}
            {f >= denyAt ? <div style={{ position: "absolute", left: 0, right: 0, top: 60 }}><Slam f={f} at={denyAt} size={150} c={ORANGE} glow={`${ORANGE}66`}>NEGOU SEU FARM</Slam></div> : null}
          </div>
        </>
      ) : (
        <div style={{ position: "absolute", left: 0, right: 0, top: 300, display: "flex", flexDirection: "column", alignItems: "center", gap: 40 }}>
          <Img src={mg("dota_logo.png")} style={{ width: 720, ...pop(f, dotaAt, -200) }} />
          <div style={{ fontFamily: POSTER, fontSize: 130, color: CREAM, opacity: ease(f, dotaAt + 14, 6) }}>↓</div>
          <Img src={mg("dl_logo.png")} style={{ width: 760, ...pop(f, dotaAt + 22, 200) }} />
        </div>
      )}
      <MemeCut f={f} at={mastAt} dur={Math.max(1, Math.min(48, life - mastAt))} src={MM.macacoPc} fit="contain" z1={1.03} />
      <Flash f={f} ts={[dotaAt]} pk={0.4} />
    </Void>
  );
};

// ========== 8) v2: a regra da lane — as bolinhas em ação: a SUA (verde) você confirma, a DELE (laranja) você rouba → alma, nível, itens ==========
export const FMRules2: React.FC<{ life: number; mineAt?: number; theirAt?: number; impAt?: number; a1At?: number; a2At?: number; a3At?: number }> = ({
  life, mineAt = 53, theirAt = 297, impAt = 395, a1At = 459, a2At = 472, a3At = 500,
}) => {
  const f = useCurrentFrame();
  const top = f >= impAt;
  const sh = ease(f, impAt, 12);
  const CYC = 44;
  const YOU = { x: 190, y: 600 };
  // uma faixa: a bolinha nasce, a mira encaixa, o tiro estoura e a alma voa pra VOCÊ; repete enquanto a fala segue
  const endOf = (at: number, stop: number) => at + Math.max(1, Math.floor((stop - at) / CYC)) * CYC - 1; // para no fim de um ciclo inteiro
  const lane = (at: number, stop: number, oy: number, col: string, retCol: string, title: string, enemy: boolean) => {
    if (f < at) return null;
    const g = Math.min(f, endOf(at, stop)) - at;
    const k = g % CYC;
    const ox = 640;
    const born = back(k, 0, 8, 2.2);
    const aim = interpolate(k, [6, 15], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
    const shot = k >= 18;
    const fly = interpolate(k, [18, 34], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
    const sx = interpolate(fly, [0, 1], [ox, YOU.x]);
    const sy = interpolate(fly, [0, 1], [oy, YOU.y]) - Math.sin(fly * Math.PI) * 90;
    return (
      <>
        <div style={{ position: "absolute", left: 0, right: 0, top: oy - 250 }}><Slam f={f} at={at} size={112} c={col} glow={`${col}55`}>{title}</Slam></div>
        {enemy ? (
          <div style={{ position: "absolute", left: 850, top: oy - 110, textAlign: "center", ...pop(f, at + 4, 80) }}>
            <Card img={wk("Infernus_card.png")} w={150} c={ORANGE} />
            <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 22, letterSpacing: 4, color: ORANGE, marginTop: 4 }}>INIMIGO</div>
          </div>
        ) : null}
        {!shot ? <div style={{ position: "absolute", left: 0, top: 0, transform: `scale(${born})`, transformOrigin: `${ox}px ${oy}px` }}><OrbBall c={col} s={150} x={ox} y={oy} /></div> : null}
        {k >= 6 && k < 24 ? (
          <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible", opacity: k < 18 ? 1 : 1 - (k - 18) / 6 }}>
            <g transform={`translate(${ox + (1 - aim) * (enemy ? -260 : 260)}, ${oy + (1 - aim) * 160}) scale(${1.5 - aim * 0.5})`}><Reticle r={92} c={retCol} w={8} /></g>
          </svg>
        ) : null}
        {shot && k < 26 ? <div style={{ position: "absolute", left: ox - 130, top: oy - 130, width: 260, height: 260, borderRadius: "50%", border: `10px solid ${col}`, opacity: 1 - (k - 18) / 8, transform: `scale(${0.5 + (k - 18) / 8})` }} /> : null}
        {shot && fly < 1 ? <div style={{ position: "absolute", left: sx - 30, top: sy - 60 }}><SoulGlyph h={120 - fly * 50} c={col} glow={1.4} /></div> : null}
      </>
    );
  };
  const done = (at: number, stop: number) => (f < at ? 0 : Math.floor((Math.min(f, endOf(at, stop)) - at + CYC - 34) / CYC));
  const nA = done(mineAt, theirAt), nB = done(theirAt, impAt);
  const lastHit = Math.max(nA ? mineAt + (nA - 1) * CYC + 34 : -99, nB ? theirAt + (nB - 1) * CYC + 34 : -99);
  return (
    <Void z={1 + punchZ(f, [mineAt, theirAt, a1At, a2At, a3At], 0.05, 9)}>
      <MemeCut f={f} at={0} dur={Math.max(1, Math.min(mineAt - 3, 50))} src={MM.macacoPc} ss={0.71} fit="contain" z0={1.03} z1={1.1} />
      <div style={{ position: "absolute", inset: 0, transform: `translateY(${-sh * 40}px) scale(${1 - sh * 0.36})`, transformOrigin: "50% 200px" }}>
        {f >= mineAt ? (
          <div style={{ position: "absolute", left: YOU.x - 110, top: YOU.y - 170, textAlign: "center", ...pop(f, mineAt + 2, 120) }}>
            <div style={{ transform: `scale(${1 + punchZ(f, [lastHit], 0.12, 8)})` }}><Card img={wk("Haze_card.png")} w={220} c={GREEN} /></div>
            <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 26, letterSpacing: 5, color: GREEN, marginTop: 4 }}>VOCÊ</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: nA + nB ? 1 : 0 }}>
              <SoulGlyph h={54} glow={0.8} />
              <span style={{ fontFamily: POSTER, fontSize: 64, color: CREAM }}>+{nA + nB}</span>
              {nB ? <span style={{ fontFamily: BODY, fontWeight: 900, fontSize: 22, letterSpacing: 2, color: ORANGE }}>{nB} ROUBADA{nB > 1 ? "S" : ""}</span> : null}
            </div>
          </div>
        ) : null}
        {lane(mineAt, theirAt, 540, GREEN, CREAM, "GARANTE A SUA", false)}
        {lane(theirAt, impAt, 1110, ORANGE, RED, "ROUBA A DELE", true)}
      </div>
      {top ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 960, display: "flex", justifyContent: "center", gap: 50 }}>
          {[
            { at: a1At, el: <SoulGlyph h={150} glow={1} />, t: "ALMA" },
            { at: a2At, el: <Lvl n={30} s={150} />, t: "NÍVEL" },
            { at: a3At, el: <Img src={wk("Weapon_Icon.png")} style={{ width: 140 }} />, t: "ITENS" },
          ].map((g) => (
            <div key={g.t} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, ...pop(f, g.at, 200) }}>
              <div style={{ height: 170, display: "flex", alignItems: "center" }}>{g.el}</div>
              <div style={{ fontFamily: POSTER, fontSize: 64, color: CREAM }}>{g.t} <span style={{ color: GREEN }}>▲</span></div>
            </div>
          ))}
        </div>
      ) : null}
    </Void>
  );
};

// ========== 9) v2: a pegadinha — alma assombrada (jungle, caixa, máquina NO JOGO → contador do HUD) ==========
export const FMHaunted2: React.FC<{ life: number; trickAt?: number; jgAt?: number; boxAt?: number; macAt?: number; ghostAt?: number; cntAt?: number; lvlAt?: number; notAt?: number }> = ({
  life, trickAt = 16, jgAt = 150, boxAt = 175, macAt = 196, ghostAt = 280, cntAt = 338, lvlAt = 385, notAt = 437,
}) => {
  const f = useCurrentFrame();
  const src = f < boxAt ? "jungle" : f < macAt ? "crate" : f < ghostAt ? "sinner" : "hud";
  const lab = f < boxAt ? "JUNGLE" : f < macAt ? "CAIXA" : f < ghostAt ? "MÁQUINA" : "SEU CONTADOR";
  const cut = f < boxAt ? jgAt : f < macAt ? boxAt : f < ghostAt ? macAt : ghostAt;
  return (
    <Void glow={f >= ghostAt ? "#2a1240" : "#0f3a34"} z={1 + punchZ(f, [jgAt, boxAt, macAt, ghostAt], 0.05, 9)}>
      {f < jgAt ? (
        <>
          <div style={{ position: "absolute", left: 0, right: 0, top: 380 }}><Slam f={f} at={trickAt + 44} size={200} c={GHOST} glow={GHOST}>PEGADINHA</Slam></div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 680, display: "flex", justifyContent: "center" }}><F3 n="face_with_raised_eyebrow" w={260} at={trickAt + 52} f={f} /></div>
        </>
      ) : (
        <>
          <Sequence key={src} from={cut} layout="none"><GameWin clip={src} c={f >= ghostAt ? GHOST : CREAM} tag={`NO JOGO · ${lab}`} /></Sequence>
          {f >= ghostAt ? (
            <>
              <div style={{ position: "absolute", left: 20, top: 400, width: 700, height: 250, borderRadius: 30, border: `6px solid ${GHOST}`, boxShadow: `0 0 40px ${GHOST}`, opacity: 0.4 + 0.6 * ease(f, ghostAt + 4, 8) }} />
              <div style={{ position: "absolute", left: 0, top: 1030, width: 1080, display: "flex", alignItems: "center", justifyContent: "center", gap: 20 }}>
                <Img src={wk("Unsecured_Souls.png")} style={{ width: 120, ...pop(f, ghostAt) }} />
                <Slam f={f} at={ghostAt + 3} size={110} c={GHOST} glow={GHOST}>ASSOMBRADA</Slam>
              </div>
              <div style={{ position: "absolute", left: 0, right: 0, top: 1180, display: "flex", justifyContent: "center", gap: 40, fontFamily: BODY, fontWeight: 900, fontSize: 34, letterSpacing: 3 }}>
                {f >= cntAt ? <span style={{ color: GREEN, ...pop(f, cntAt) }}>✓ CONTA</span> : null}
                {f >= lvlAt ? <span style={{ color: GREEN, ...pop(f, lvlAt) }}>✓ DÁ NÍVEL</span> : null}
                {f >= notAt ? <span style={{ color: RED, ...pop(f, notAt) }}>✕ AINDA NÃO É SUA</span> : null}
              </div>
            </>
          ) : (
            <div key={lab} style={{ position: "absolute", left: 0, right: 0, top: 1060 }}><Slam f={f} at={cut} size={130}>{lab}</Slam></div>
          )}
        </>
      )}
      <MemeCut f={f} at={trickAt} dur={42} src={MM.huh} />
      <Flash f={f} ts={[ghostAt]} pk={0.35} c={GHOST} />
    </Void>
  );
};

// ========== 10) v2: assombrada vira segura aos poucos · patch −25% · time atrás +50% ==========
export const FMSecure2: React.FC<{ life: number; dripAt?: number; moreAt?: number; slowAt?: number; patchAt?: number; behindAt?: number }> = ({
  life, dripAt = 44, moreAt = 176, slowAt = 276, patchAt = 391, behindAt = 526,
}) => {
  const f = useCurrentFrame();
  const rate = f < moreAt ? 1 : f < slowAt ? 2.2 : f < patchAt ? 1 : f < behindAt ? 0.6 : 1.6;
  const big = f >= moreAt ? 1.3 : 1;
  const drops = f < dripAt ? null : Array.from({ length: 6 }).map((_, i) => {
    const per = 40 / rate;
    const k = ((f + (i * per) / 6) % per) / per;
    return <div key={i} style={{ position: "absolute", left: interpolate(k, [0, 1], [330, 700]), top: 560 - Math.sin(k * Math.PI) * 90, opacity: Math.sin(k * Math.PI) }}><SoulGlyph h={46} c={k < 0.5 ? GHOST : SOUL} glow={0.8} /></div>;
  });
  const sec = Math.round(interpolate(f, [dripAt, life], [1200, 2100], clamp));
  const row = (at: number, icon: string, t: string, big2: string, c: string) => (
    <At f={f} a={at} b={at === slowAt ? patchAt : at === patchAt ? behindAt : 1e9}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 880, display: "flex", alignItems: "center", justifyContent: "center", gap: 30 }}>
        <F3 n={icon} w={200} at={at} f={f} />
        <div style={{ textAlign: "left" }}>
          <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 34, letterSpacing: 5, color: CREAM, opacity: ease(f, at, 6) }}>{t}</div>
          <Slam f={f} at={at + 4} size={160} c={c} style={{ textAlign: "left" }}>{big2}</Slam>
        </div>
      </div>
    </At>
  );
  return (
    <Void glow={f >= behindAt ? "#0f3a1c" : f >= patchAt ? "#3a140c" : "#1d1236"} z={1 + punchZ(f, [moreAt, patchAt, behindAt], 0.05, 9)}>
      <div style={{ position: "absolute", left: 120, top: 390, transform: `scale(${big})`, transformOrigin: "50% 50%", textAlign: "center" }}>
        <SoulGlyph h={300} c={GHOST} glow={1.3} />
        <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 26, letterSpacing: 4, color: GHOST }}>ASSOMBRADA</div>
      </div>
      <div style={{ position: "absolute", left: 760, top: 390, textAlign: "center" }}>
        <SoulGlyph h={300} c={SOUL} glow={1.3} />
        <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 26, letterSpacing: 4, color: SOUL }}>SEGURA</div>
        <div style={{ fontFamily: POSTER, fontSize: 64, color: CREAM }}>{sec.toLocaleString("pt-BR")}</div>
      </div>
      {drops}
      <div style={{ position: "absolute", left: 0, right: 0, top: 260, textAlign: "center", fontFamily: BODY, fontWeight: 900, fontSize: 34, letterSpacing: 6, color: CREAM, opacity: ease(f, dripAt, 8) }}>
        UM POUCO A CADA SEGUNDO{f >= moreAt && f < slowAt ? <span style={{ color: GREEN }}> · MAIS RÁPIDO</span> : null}
      </div>
      {row(slowAt, "hourglass_done", "MESMO ASSIM", "DEVAGAR", CREAM)}
      {row(patchAt, "spiral_calendar", "PATCH 30/10", "−25%", RED)}
      {row(behindAt, "chart_increasing", "TIME ATRÁS", "+50%", GREEN)}
      <Flash f={f} ts={[patchAt]} pk={0.25} c={RED} />
    </Void>
  );
};

// ========== 11) v2: morreu com assombrada — some (pouca) ou cai no chão (muita) · soco pega · 3 min ==========
export const FMDeath2: React.FC<{ life: number; dieAt?: number; twoAt?: number; poofAt?: number; bagAt?: number; punchAt?: number; enemyAt?: number; timerAt?: number; runAt?: number }> = ({
  life, dieAt = 16, twoAt = 106, poofAt = 180, bagAt = 301, punchAt = 463, enemyAt = 504, timerAt = 700, runAt = 801,
}) => {
  const f = useCurrentFrame();
  const dead = ease(f, dieAt, 12);
  const drop = ease(f, bagAt, 14);
  const grab = f >= enemyAt + 20 && f < timerAt ? interpolate(f, [enemyAt + 20, enemyAt + 40], [0, 300], clamp) : 0;
  const remain = Math.max(0, 180 - Math.floor(((f - timerAt) / 30) * 20));
  const mm = `${Math.floor(remain / 60)}:${String(remain % 60).padStart(2, "0")}`;
  return (
    <Void glow={f < twoAt ? "#3a0c0c" : "#1d1236"} z={1 + punchZ(f, [dieAt, poofAt, bagAt, punchAt, timerAt], 0.05, 9)}>
      <At f={f} a={0} b={twoAt}>
        <div style={{ position: "absolute", left: 390, top: 400, transform: `rotate(${dead * -14}deg) translateY(${dead * 60}px)`, filter: `grayscale(${dead}) brightness(${1 - dead * 0.4})` }}>
          <Card img={wk("Haze_card.png")} w={300} c={dead > 0.5 ? RED : CREAM} />
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 1000 }}><Slam f={f} at={dieAt + 3} size={170} c={RED} glow={`${RED}66`}>MORREU</Slam></div>
        <div style={{ position: "absolute", left: 730, top: 360, transform: `translateY(${-dead * 40}px)` }}><SoulGlyph h={180} c={GHOST} glow={1.2} /></div>
      </At>
      <At f={f} a={twoAt} b={bagAt}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 250, textAlign: "center", fontFamily: BODY, fontWeight: 900, fontSize: 38, letterSpacing: 6, color: CREAM }}>1 DE 2 COISAS</div>
        <div style={{ position: "absolute", left: 170, top: 420, opacity: 1 - ease(f, poofAt + 6, 12), transform: `scale(${1 + ease(f, poofAt, 12) * 0.6})`, filter: `blur(${ease(f, poofAt, 12) * 14}px)` }}><SoulGlyph h={220} c={GHOST} /></div>
        <div style={{ position: "absolute", left: 700, top: 420, opacity: 0.3 }}><SoulGlyph h={220} c={GHOST} /></div>
        {f >= poofAt ? <div style={{ position: "absolute", left: 40, top: 760, width: 480 }}><Slam f={f} at={poofAt + 2} size={100}>POUCA: SOME</Slam></div> : null}
      </At>
      <At f={f} a={bagAt}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 250, textAlign: "center", fontFamily: BODY, fontWeight: 900, fontSize: 38, letterSpacing: 6, color: GHOST, opacity: ease(f, bagAt, 8) }}>MUITA: CAI NO CHÃO</div>
        <div style={{ position: "absolute", left: 540 - 170 + grab, top: 380 + drop * 220, transform: `scale(${1 + 0.04 * Math.sin(f / 5)})` }}><Ghost s={340} /></div>
        {f >= punchAt && f < timerAt ? <F3 n="collision" w={240} at={punchAt} f={f} style={{ position: "absolute", left: 160, top: 560 }} /> : null}
        {f >= punchAt && f < enemyAt ? <div style={{ position: "absolute", left: 0, right: 0, top: 1040 }}><Slam f={f} at={punchAt + 2} size={110}>SOCO FORTE PEGA</Slam></div> : null}
        {f >= enemyAt && f < timerAt ? (
          <>
            <div style={{ position: "absolute", left: 790, top: 520, ...pop(f, enemyAt, 200) }}><Card img={wk("Infernus_card.png")} w={230} c={ORANGE} /></div>
            <div style={{ position: "absolute", left: 0, right: 0, top: 1040 }}><Slam f={f} at={enemyAt + 2} size={100} c={ORANGE}>ATÉ QUEM TE MATOU</Slam></div>
          </>
        ) : null}
        {f >= timerAt ? (
          <div style={{ position: "absolute", left: 0, right: 0, top: 1000, display: "flex", alignItems: "center", justifyContent: "center", gap: 24 }}>
            <F3 n="stopwatch" w={180} at={timerAt} f={f} />
            <div style={{ fontFamily: POSTER, fontSize: 180, color: remain < 60 ? RED : CREAM, ...pop(f, timerAt) }}>{mm}</div>
          </div>
        ) : null}
        {f >= runAt ? <F3 n="person_running" w={220} at={runAt} f={f} style={{ position: "absolute", left: 60 + ease(f, runAt, 40) * 150, top: 640 }} /> : null}
      </At>
      <Flash f={f} ts={[dieAt]} pk={0.5} c={RED} />
    </Void>
  );
};

// ========== 12) v2: o nível você não perde ==========
export const FMLevel2: React.FC<{ life: number; keepAt?: number }> = ({ life, keepAt = 181 }) => {
  const f = useCurrentFrame();
  return (
    <Void z={1 + punchZ(f, [keepAt], 0.08, 10)}>
      <div style={{ position: "absolute", left: 340, top: 380, ...pop(f, 2) }}><Lvl n={30} s={400} /></div>
      {f >= keepAt ? <F3 n="shield" w={240} at={keepAt} f={f} style={{ position: "absolute", left: 650, top: 620 }} /> : null}
      {Array.from({ length: 6 }).map((_, i) => {
        const k = ease(f, 20 + i * 10, 30);
        return <div key={i} style={{ position: "absolute", left: 510 + Math.cos(i * 1.1) * 420 * k, top: 540 + Math.sin(i * 2.1) * 300 * k, opacity: 1 - k }}><SoulGlyph h={70} c={GHOST} /></div>;
      })}
      <div style={{ position: "absolute", left: 0, right: 0, top: 920 }}>{f >= keepAt ? <Slam f={f} at={keepAt} size={150} c={GREEN} glow={`${GREEN}55`}>O NÍVEL FICA</Slam> : null}</div>
    </Void>
  );
};

// ========== 13) v2: a loja gasta a segura primeiro · item barato não salva · compra o mais perto do que tem ==========
export const FMShop2: React.FC<{ life: number; prioAt?: number; allAt?: number; cheapAt?: number; bestAt?: number }> = ({ life, prioAt = 168, allAt = 306, cheapAt = 437, bestAt = 542 }) => {
  const f = useCurrentFrame();
  const secure = f < prioAt ? 1 : f < allAt ? 1 - ease(f, prioAt + 6, 30) * 0.8 : 0.2 - ease(f, allAt, 20) * 0.2;
  const haunt = f < allAt ? 1 : 1 - ease(f, allAt + 10, 24);
  return (
    <Void z={1 + punchZ(f, [prioAt, allAt, cheapAt, bestAt], 0.05, 9)}>
      <GameWin clip="shop" c={YEL} tag="NO JOGO · LOJA" h={700} />
      <div style={{ position: "absolute", left: 60, top: 940, width: 960 }}>
        <div style={{ display: "flex", height: 90, borderRadius: 18, overflow: "hidden", border: `4px solid ${CREAM}55` }}>
          <div style={{ width: `${secure * 55}%`, background: `linear-gradient(90deg, ${SOUL}88, ${SOUL})` }} />
          <div style={{ width: `${haunt * 45}%`, background: `linear-gradient(90deg, ${GHOST}88, ${GHOST})` }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontFamily: BODY, fontWeight: 900, fontSize: 28, letterSpacing: 4 }}>
          <span style={{ color: SOUL }}>SEGURA{f >= prioAt ? " · SAI PRIMEIRO" : ""}</span><span style={{ color: GHOST }}>ASSOMBRADA</span>
        </div>
      </div>
      {f >= allAt && f < cheapAt ? <div style={{ position: "absolute", left: 0, right: 0, top: 1130 }}><Slam f={f} at={allAt + 2} size={100} c={GHOST}>SÓ SE GASTAR 100%</Slam></div> : null}
      {f >= cheapAt ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 200, height: 708, display: "flex", alignItems: "center", justifyContent: "center", gap: 60, background: "rgba(6,9,10,0.9)" }}>
          <div style={{ textAlign: "center", position: "relative", ...pop(f, cheapAt), opacity: f >= bestAt ? 0.35 : 1 }}>
            <Img src={mg("items/Headshot_Booster.png")} style={{ width: 260, height: 260, objectFit: "contain", borderRadius: 20, border: `5px solid ${ORANGE}` }} />
            <div style={{ fontFamily: POSTER, fontSize: 70, color: CREAM }}>800</div>
            <Cross f={f} at={cheapAt + 8} w={260} h={260} style={{ left: 0, top: 0 }} />
          </div>
          {f >= bestAt ? (
            <div style={{ textAlign: "center", ...pop(f, bestAt) }}>
              <Img src={mg("items/Boundless_Spirit.png")} style={{ width: 300, height: 300, objectFit: "contain", borderRadius: 20, border: `5px solid ${GREEN}`, filter: `drop-shadow(0 0 30px ${GREEN})` }} />
              <div style={{ fontFamily: POSTER, fontSize: 70, color: GREEN }}>6.400 ✓</div>
            </div>
          ) : null}
        </div>
      ) : null}
      <MemeCut f={f} at={cheapAt + 26} dur={40} src={MM.fine} ss={0.5} />
    </Void>
  );
};

// ========== 15) v2: regras da entrega da Urna (gameplay carregando) ==========
export const FMUrnRules2: React.FC<{ life: number; parryAt?: number; zipAt?: number; ventAt?: number; walkAt?: number; dashAt?: number }> = ({
  life, parryAt = 142, zipAt = 194, ventAt = 256, walkAt = 455, dashAt = 501,
}) => {
  const f = useCurrentFrame();
  const no = (at: number, x: number, el: React.ReactNode, t: string) =>
    f < at ? null : (
      <div style={{ position: "absolute", left: x, top: 950, width: 320, textAlign: "center", ...pop(f, at, 200) }}>
        <div style={{ position: "relative", height: 210, display: "flex", alignItems: "center", justifyContent: "center", opacity: f >= walkAt ? 0.3 : 1 }}>
          {el}
          <Cross f={f} at={at + 6} w={220} h={200} style={{ left: 50, top: 5 }} />
        </div>
        <div style={{ fontFamily: POSTER, fontSize: 52, color: f >= walkAt ? `${CREAM}55` : CREAM }}>{t}</div>
      </div>
    );
  return (
    <Void z={1 + punchZ(f, [parryAt, zipAt, ventAt, walkAt], 0.05, 9)}>
      <GameWin clip="urncarry" c={GREEN} tag="NO JOGO · CARREGANDO A URNA" h={700} />
      {no(parryAt, 20, <F3 n="raised_hand" w={170} at={parryAt} f={f} />, "PARRY")}
      {no(zipAt, 380, <Img src={wk("Ziplines.png")} style={{ width: 240, height: 170, objectFit: "cover", borderRadius: 14 }} />, "TIROLESA")}
      {no(ventAt, 740, <div style={{ display: "flex" }}><Card img={wk("Rem_card.png")} w={120} /><Card img={wk("Rat_King_Render.png")} w={120} style={{ marginLeft: -20, height: 168, objectFit: "cover" }} /></div>, "BURACO")}
      {f >= walkAt ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 930, height: 340, display: "flex", alignItems: "center", justifyContent: "center", gap: 40, background: "rgba(6,9,10,0.85)" }}>
          <F3 n="person_running" w={220} at={walkAt} f={f} />
          <div>
            <Slam f={f} at={walkAt + 2} size={120} c={GREEN} style={{ textAlign: "left" }}>ANDANDO</Slam>
            {f >= dashAt ? <Slam f={f} at={dashAt} size={120} c={GREEN} style={{ textAlign: "left" }}>OU DASH ✓</Slam> : null}
          </div>
        </div>
      ) : null}
    </Void>
  );
};

// ========== 16) v2: LoL decide aos 15 · Deadlock te paga pra voltar +30% ==========
export const FMComeback2: React.FC<{ life: number; lolAt?: number; minAt?: number; payAt?: number; p30At?: number; s1At?: number; s2At?: number; s3At?: number; eqAt?: number }> = ({
  life, lolAt = 206, minAt = 314, payAt = 458, p30At = 572, s1At = 655, s2At = 686, s3At = 728, eqAt = 949,
}) => {
  const f = useCurrentFrame();
  const ph = f >= payAt;
  const rain = ph ? Array.from({ length: 12 }).map((_, i) => {
    const y = (((f - payAt) * (7 + (i % 4) * 3) + i * 170) % 2000) - 200;
    return <Img key={i} src={fl3("money_with_wings")} style={{ position: "absolute", left: (i * 157) % 1000, top: y, width: 100, opacity: 0.4, transform: `rotate(${Math.sin(f / 8 + i) * 20}deg)` }} />;
  }) : null;
  return (
    <Void glow={ph ? "#0f3a1c" : "#2a1010"} z={1 + punchZ(f, [lolAt, payAt, p30At, eqAt], 0.05, 9)}>
      {rain}
      {f < lolAt ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 380, display: "flex", flexDirection: "column", alignItems: "center", gap: 40 }}>
          <Img src={mg("dl_logo.png")} style={{ width: 760, ...pop(f, 4) }} />
          <F3 n="balance_scale" w={280} at={24} f={f} />
          <div style={{ fontFamily: POSTER, fontSize: 90, color: CREAM, opacity: ease(f, 30, 8) }}>EQUILIBRADO</div>
        </div>
      ) : null}
      <At f={f} a={lolAt} b={payAt}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 330, display: "flex", justifyContent: "center", ...pop(f, lolAt, -200) }}><Img src={mg("lol_logo.png")} style={{ width: 620 }} /></div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 720, display: "flex", alignItems: "center", justifyContent: "center", gap: 30 }}>
          <F3 n="stopwatch" w={180} at={lolAt + 10} f={f} />
          <div style={{ fontFamily: POSTER, fontSize: 200, color: RED, opacity: ease(f, lolAt + 12, 6) }}>15:00</div>
        </div>
        {f >= minAt + 75 ? <div style={{ position: "absolute", left: 0, right: 0, top: 1030 }}><Slam f={f} at={minAt + 75} size={110} c={RED}>JÁ ACABOU</Slam></div> : null}
      </At>
      <At f={f} a={payAt}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 240, display: "flex", justifyContent: "center", ...pop(f, payAt, -200) }}><Img src={mg("dl_logo.png")} style={{ width: 540 }} /></div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 380 }}><Slam f={f} at={payAt + 4} size={110}>TE PAGA PRA VOLTAR</Slam></div>
        {f >= p30At ? <div style={{ position: "absolute", left: 0, right: 0, top: 530 }}><Slam f={f} at={p30At} size={290} c={GREEN} glow={GREEN}>+30%</Slam></div> : null}
        <div style={{ position: "absolute", left: 0, right: 0, top: 920, display: "flex", justifyContent: "center", gap: 50 }}>
          {[
            { at: s1At, el: <Img src={fl3("package")} style={{ width: 150 }} />, t: "BAÚ" },
            { at: s2At, el: <SoulGlyph h={150} />, t: "FARM" },
            { at: s3At, el: <Img src={fl3("seedling")} style={{ width: 150 }} />, t: "JUNGLE" },
          ].map((s) => (
            <div key={s.t} style={{ width: 200, display: "flex", flexDirection: "column", alignItems: "center", ...pop(f, s.at, 200) }}>
              <div style={{ height: 170, display: "flex", alignItems: "center" }}>{s.el}</div>
              <div style={{ fontFamily: POSTER, fontSize: 56, color: CREAM }}>{s.t}</div>
            </div>
          ))}
        </div>
        {f >= eqAt ? (
          <div style={{ position: "absolute", left: 0, right: 0, top: 200, height: 1120, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, background: "rgba(6,9,10,0.92)" }}>
            <F3 n="balance_scale" w={320} at={eqAt} f={f} />
            <Slam f={f} at={eqAt + 3} size={150}>ATÉ EMPATAR</Slam>
          </div>
        ) : null}
      </At>
      <MemeCut f={f} at={minAt} dur={75} src={MM.yasuo} ss={0.3} />
      <Flash f={f} ts={[payAt, p30At]} pk={0.35} c={GREEN} />
    </Void>
  );
};

// ========== 17) v2: atrás? prioridade: minion, alma, NÃO MORRER ==========
export const FMPriority2: React.FC<{ life: number; m1At?: number; m2At?: number; m3At?: number; awayAt?: number }> = ({ life, m1At = 241, m2At = 277, m3At = 346, awayAt = 465 }) => {
  const f = useCurrentFrame();
  const items = [
    { at: m1At, el: <OrbBall c={GREEN} s={130} x={85} y={85} />, t: "MINION" },
    { at: m2At, el: <SoulGlyph h={150} />, t: "ALMA" },
    { at: m3At, el: <Img src={fl3("prohibited")} style={{ width: 150 }} />, t: "NÃO MORRER" },
  ];
  return (
    <Void glow={f >= awayAt ? "#3a140c" : "#0f3a34"} z={1 + punchZ(f, [m1At, m2At, m3At, awayAt], 0.05, 9)}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 240, display: "flex", alignItems: "center", justifyContent: "center", gap: 20 }}>
        <F3 n="chart_decreasing" w={140} at={4} f={f} />
        <Slam f={f} at={6} size={130}>TÁ ATRÁS?</Slam>
      </div>
      {f < m1At ? (
        <div style={{ position: "absolute", left: 90, top: 470, width: 900, opacity: 1 - ease(f, m1At - 8, 8) }}>
          {[
            { img: wk("Haze_card.png"), t: "VOCÊ", c: ORANGE, v: 4200, w: 0.4, at: 20 },
            { img: wk("Infernus_card.png"), t: "INIMIGO", c: GREEN, v: 9800, w: 0.95, at: 34 },
          ].map((r) => (
            <div key={r.t} style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 60, ...pop(f, r.at, 120) }}>
              <Card img={r.img} w={150} c={r.c} />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontFamily: BODY, fontWeight: 900, fontSize: 30, letterSpacing: 5, color: r.c }}>
                  <span>{r.t}</span><span style={{ fontFamily: POSTER, fontSize: 56, color: CREAM, letterSpacing: 0 }}>{Math.round(r.v * ease(f, r.at, 30)).toLocaleString("pt-BR")}</span>
                </div>
                <div style={{ marginTop: 10, height: 44, borderRadius: 22, background: `${CREAM}15`, overflow: "hidden" }}>
                  <div style={{ width: `${r.w * 100 * ease(f, r.at, 30)}%`, height: "100%", background: `linear-gradient(90deg, ${SOUL}66, ${SOUL})`, boxShadow: `0 0 20px ${SOUL}` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}
      {items.map((it, i) => (f < it.at ? null : (
        <div key={it.t} style={{ position: "absolute", left: 90, top: 470 + i * 220, display: "flex", alignItems: "center", gap: 36, ...pop(f, it.at) }}>
          <div style={{ fontFamily: POSTER, fontSize: 120, color: SOUL, width: 80 }}>{i + 1}</div>
          <div style={{ width: 170, height: 170, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>{it.el}</div>
          <div style={{ fontFamily: POSTER, fontSize: 100, color: i === 2 ? RED : CREAM }}>{it.t}</div>
        </div>
      )))}
      {f >= awayAt ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 1150, display: "flex", alignItems: "center", justifyContent: "center", gap: 24 }}>
          <F3 n="chair" w={120} at={awayAt} f={f} />
          <Slam f={f} at={awayAt + 2} size={90} c={RED}>MORTO = SEM ALMA</Slam>
        </div>
      ) : null}
    </Void>
  );
};

// ========== 18) v2: resumo em sequência rápida (uma imagem por regra) ==========
export const FMRecap2: React.FC<{ life: number; r1At?: number; r2At?: number; r3At?: number; r4At?: number; r5At?: number; r6At?: number; r7At?: number }> = ({
  life, r1At = 53, r2At = 124, r3At = 225, r4At = 295, r5At = 369, r6At = 435, r7At = 636,
}) => {
  const f = useCurrentFrame();
  const ts = [r1At, r2At, r3At, r4At, r5At, r6At, r7At];
  const k = ts.filter((t) => f >= t).length;
  const at = k ? ts[k - 1] : 0;
  const lab = (t: string, c: string, y = 860, size = 130) => <div style={{ position: "absolute", left: 0, right: 0, top: y }}><Slam f={f} at={at} size={size} c={c}>{t}</Slam></div>;
  let body: React.ReactNode;
  if (k === 0) body = lab("RESUMINDO", CREAM, 560, 200);
  else if (k === 1) body = <><OrbBall c={GREEN} s={300} x={540} y={600} />{lab("VERDE: ATIRA", GREEN)}</>;
  else if (k === 2) body = <><OrbBall c={ORANGE} s={300} x={540} y={600} /><svg width={1080} height={1200} style={{ position: "absolute", inset: 0 }}><g transform="translate(540,600)"><Reticle r={200} c={RED} w={10} /></g></svg>{lab("LARANJA: ROUBA", ORANGE, 900)}</>;
  else if (k === 3) body = <><div style={{ position: "absolute", left: 0, right: 0, top: 380, display: "flex", justifyContent: "center", gap: 30 }}><Card img={wk("Haze_card.png")} w={260} c={GREEN} /><Card img={wk("Infernus_card.png")} w={260} c={GREEN} /></div>{lab("DUPLA 108%", GREEN, 820, 150)}</>;
  else if (k === 4) body = <><div style={{ position: "absolute", left: 0, right: 0, top: 380, display: "flex", justifyContent: "center", gap: 20 }}>{["Haze_card.png", "Infernus_card.png", "Rem_card.png"].map((c) => <Card key={c} img={wk(c)} w={220} c={RED} />)}</div>{lab("TRIO 36%", RED, 780, 150)}</>;
  else if (k === 5) body = <><div style={{ position: "absolute", left: 0, right: 0, top: 360, display: "flex", justifyContent: "center", alignItems: "center", gap: 40 }}><SoulGlyph h={260} c={GHOST} /><span style={{ fontFamily: POSTER, fontSize: 150, color: CREAM }}>→</span><SoulGlyph h={260} /></div>{lab("JUNGLE: SÓ SEGURA", GHOST, 780, 120)}</>;
  else if (k === 6) body = <><div style={{ position: "absolute", left: 540 - 150, top: 380 }}><Ghost s={300} /></div><F3 n="person_running" w={200} at={at + 4} f={f} style={{ position: "absolute", left: 150, top: 470 }} />{lab("BUSCA · GASTA RÁPIDO", CREAM, 780, 110)}</>;
  else body = <><Img src={wk("Soul_Urn_Render.png")} style={{ position: "absolute", left: 540 - 180, top: 300, height: 400, width: 360, objectFit: "contain", filter: `drop-shadow(0 0 40px ${SOUL})` }} /><F3 n="busts_in_silhouette" w={220} at={at + 4} f={f} style={{ position: "absolute", left: 700, top: 500 }} />{lab("URNA COM O TIME", SOUL, 780)}</>;
  return (
    <Void z={1 + punchZ(f, ts, 0.06, 9)}>
      <div key={k} style={{ position: "absolute", inset: 0, opacity: ease(f, at, 4), transform: `translateX(${(1 - ease(f, at, 6)) * 120}px)` }}>{body}</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 210, display: "flex", justifyContent: "center", gap: 14 }}>
        {ts.map((t, i) => <div key={i} style={{ width: 70, height: 12, borderRadius: 6, background: f >= t ? SOUL : `${CREAM}33`, boxShadow: f >= t ? `0 0 10px ${SOUL}` : "none" }} />)}
      </div>
      <Flash f={f} ts={ts} pk={0.2} />
    </Void>
  );
};

// ========== 19) v2: próximo episódio — itens e build pra counterar (cura, Seven, enfermeira) ==========
export const FMNext2: React.FC<{ life: number; buildAt?: number; healAt?: number; sevenAt?: number; nurseAt?: number }> = ({ life, buildAt = 211, healAt = 383, sevenAt = 455, nurseAt = 505 }) => {
  const f = useCurrentFrame();
  const counter = (at: number, img: string, t: string, x: number, w = 220) =>
    f < at ? null : (
      <div style={{ position: "absolute", left: x, top: 800, width: 320, textAlign: "center", ...pop(f, at, 200) }}>
        <div style={{ position: "relative", display: "inline-block" }}><Img src={img} style={{ width: w, borderRadius: 16, border: `4px solid ${CREAM}` }} /><Cross f={f} at={at + 10} w={w} h={w * 1.3} style={{ left: 0, top: 0 }} /></div>
        <div style={{ fontFamily: POSTER, fontSize: 52, color: CREAM }}>{t}</div>
      </div>
    );
  return (
    <Void z={1 + punchZ(f, [buildAt, healAt, sevenAt, nurseAt], 0.05, 9)}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 220, display: "flex", alignItems: "center", justifyContent: "center", gap: 24 }}>
        <div style={{ fontFamily: POSTER, fontSize: 70, color: SOUL, border: `5px solid ${SOUL}`, borderRadius: 14, padding: "0 18px" }}>EP. 03</div>
        <Slam f={f} at={6} size={110}>ITENS</Slam>
      </div>
      <div style={{ position: "absolute", left: 140, top: 380, width: 800, transform: `perspective(1200px) rotateX(10deg) rotateZ(-3deg) scale(${back(f, 10, 12, 1.6)})`, opacity: f >= healAt ? 0.25 : 1 }}>
        <Img src={wk("Weapon_shop.png")} style={{ width: 800, borderRadius: 20, border: `5px solid ${YEL}`, boxShadow: "0 30px 70px #000" }} />
      </div>
      {f >= buildAt && f < healAt ? <div style={{ position: "absolute", left: 0, right: 0, top: 1080 }}><Slam f={f} at={buildAt} size={110} c={YEL}>BUILD PRA COUNTERAR</Slam></div> : null}
      {counter(healAt, pc("Healbane.png"), "MUITA CURA", 20, 200)}
      {counter(sevenAt, wk("Seven_card.png"), "SEVEN", 380)}
      {counter(nurseAt, pc("Nurse_Harrow_card.png"), "ENFERMEIRA", 740)}
    </Void>
  );
};
