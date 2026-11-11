import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, OffthreadVideo, random, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Cam, Center, clamp, Cursor, ease, Flash, Grain, punch, shake } from "../2026-11-09_deadlock-cansei-lol/CL2";
import { D, RD, RV } from "../2026-11-09_deadlock-cansei-lol/CL3";

// "Cloud9 no Deadlock", 2ª metade refeita (10/11): ele reprovou de 1:00 em diante ("só card e texto, sem gameplay,
// sem ícone que faça sentido, sem inovação"). Aqui cada fala tem um OBJETO REAL em ação: gameplay de partida,
// transmissão do Night Shift (final NA, Melee Creeps x Pulsar), troféus oficiais da Valve, mapa do Brasil com o
// gameplay dentro do contorno, cartazes de PROCURA-SE, os vídeos dele, o lobby Amber Hand x Sapphire Flame.
// Fio narrativo: o pedestal do Deadlock vazio na estante da Valve -> ele bota o campeonato BR nele.
// Props *At em QUADROS da cena. Zona segura y 180–1290; legenda em 1370.

const V = (n: string) => staticFile(`videos/2026-11-10_deadlock-cloud9_R/c9/${n}`);
const PC = (n: string) => staticFile(`videos/2026-11-05_deadlock-patch-celeste_R/clips/${n}`);
const FM = (n: string) => staticFile(`videos/2026-11-09_deadlock-farm_R/${n}`);
const MG = (n: string) => staticFile(`videos/2026-11-06_deadlock-magia_R/mg/${n}`);
const BLIES = staticFile("videos/2026-11-06_deadlock-ranked_R/dl/blies.jpg");
const GOLD = "#d8b46a";
const NS = "#c9a24e"; // dourado do Night Shift
const C9BLUE = "#14a0ff";

// contorno do Brasil (Natural Earth via world.geo.json), caixa 979x1000
const BR_PATH = "M416 868 L446 837 L471 814 L486 805 L505 792 L506 774 L494 760 L483 765 L488 751 L491 738 L491 725 L483 721 L474 725 L466 724 L463 715 L461 694 L457 687 L442 681 L433 685 L409 681 L411 649 L404 636 L411 632 L409 619 L415 608 L419 590 L414 576 L402 569 L399 560 L402 547 L360 546 L351 519 L357 519 L357 509 L353 502 L352 489 L339 482 L325 482 L315 475 L300 471 L292 462 L266 458 L242 438 L244 422 L241 413 L244 396 L214 400 L203 409 L183 418 L178 425 L166 426 L150 424 L137 428 L127 425 L128 390 L110 404 L90 403 L82 391 L67 389 L72 379 L59 365 L50 345 L56 340 L56 331 L69 324 L67 311 L73 303 L75 293 L100 277 L118 273 L121 269 L142 270 L152 207 L152 197 L149 184 L139 175 L139 158 L152 155 L156 157 L157 148 L144 146 L143 131 L187 132 L194 124 L201 131 L205 145 L209 142 L221 154 L239 153 L243 146 L260 140 L269 137 L272 127 L288 120 L286 115 L268 113 L264 99 L265 83 L255 77 L259 75 L276 78 L294 84 L300 79 L316 75 L341 66 L350 58 L347 51 L358 50 L364 55 L361 65 L368 69 L373 80 L367 88 L364 107 L369 119 L371 130 L385 141 L396 142 L398 137 L405 136 L415 132 L423 126 L435 128 L441 127 L453 129 L455 124 L451 120 L453 113 L462 115 L473 113 L486 118 L495 122 L502 116 L507 117 L510 124 L521 122 L530 113 L537 96 L550 75 L557 74 L563 87 L576 127 L588 131 L588 147 L571 166 L578 173 L618 176 L619 200 L636 184 L664 193 L701 207 L712 220 L708 233 L734 226 L778 238 L811 237 L844 256 L873 282 L890 289 L909 290 L917 297 L925 326 L929 340 L920 379 L908 394 L877 426 L863 452 L846 472 L840 472 L834 489 L836 532 L830 568 L827 583 L820 592 L816 623 L793 653 L790 677 L772 687 L766 701 L742 701 L707 710 L691 720 L666 727 L640 745 L621 768 L617 785 L621 798 L617 821 L612 832 L596 845 L571 886 L552 904 L536 915 L526 937 L511 950 L505 937 L515 926 L502 910 L485 898 L462 883 L453 883 L431 866 L416 868 Z";

// ---------- peças ----------
const Clip: React.FC<{ src: string; from?: number; dur: number; ss?: number; rate?: number; pos?: string; style?: React.CSSProperties; fit?: "cover" | "contain" }> = ({ src, from = 0, dur, ss = 0, rate = 1, pos = "50% 50%", style, fit = "cover" }) => (
  <Sequence from={from} durationInFrames={Math.max(1, Math.round(dur))} layout="none">
    <AbsoluteFill style={style}>
      <OffthreadVideo src={src} muted startFrom={Math.round(ss)} playbackRate={rate} style={{ width: "100%", height: "100%", objectFit: fit, objectPosition: pos }} />
    </AbsoluteFill>
  </Sequence>
);

// vídeo 16:9 inteiro numa faixa, com ele mesmo desfocado atrás (transmissão: placar e HUD inteiros)
const Band: React.FC<{ src: string; from?: number; dur: number; ss?: number; top?: number; k?: number; ox?: string }> = ({ src, from = 0, dur, ss = 0, top = 560, k = 1, ox = "50% 50%" }) => (
  <>
    <Clip src={src} from={from} dur={dur} ss={ss} style={{ filter: "blur(30px) brightness(0.42) saturate(1.2)", transform: "scale(1.2)" }} />
    <Sequence from={from} durationInFrames={Math.max(1, Math.round(dur))} layout="none">
      <div style={{ position: "absolute", left: 0, width: 1080, top, height: 608, overflow: "hidden", transform: `scale(${k})`, transformOrigin: ox, boxShadow: "0 30px 90px #000", outline: `2px solid ${NS}66` }}>
        <OffthreadVideo src={src} muted startFrom={Math.round(ss)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
    </Sequence>
  </>
);

const Stamp: React.FC<{ f: number; at: number; text: string; c?: string; size?: number; rot?: number; bg?: string }> = ({ f, at, text, c = D.red, size = 64, rot = -5, bg = "rgba(11,10,8,0.85)" }) => {
  if (f < at) return null;
  const k = interpolate(f, [at, at + 5], [1.9, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  return (
    <div style={{ padding: `${size * 0.16}px ${size * 0.5}px`, border: `${Math.max(4, size * 0.08)}px solid ${c}`, color: c, fontFamily: RV, fontWeight: 700, fontSize: size, letterSpacing: size * 0.06, lineHeight: 1, whiteSpace: "nowrap", background: bg, transform: `rotate(${rot}deg) scale(${k})`, opacity: interpolate(f, [at, at + 3], [0, 1], clamp), boxShadow: `0 0 40px ${c}55, 0 20px 40px rgba(0,0,0,0.8)` }}>
      {text}
    </div>
  );
};

// rótulo de HUD (mono espaçado) com bolinha
const Hud: React.FC<{ f: number; at: number; children: React.ReactNode; c?: string; size?: number; dot?: string }> = ({ f, at, children, c = D.cream, size = 26, dot }) =>
  f < at ? null : (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 14, fontFamily: RD, fontWeight: 700, fontSize: size, letterSpacing: size * 0.28, color: c, opacity: ease(f, at, 8), transform: `translateY(${(1 - ease(f, at, 10)) * 14}px)`, whiteSpace: "nowrap", textShadow: "0 2px 10px #000" }}>
      {dot ? <div style={{ width: size * 0.5, height: size * 0.5, borderRadius: "50%", background: dot, boxShadow: `0 0 12px ${dot}`, opacity: 0.6 + 0.4 * Math.sin(f / 4) }} /> : null}
      {children}
    </div>
  );

// chamada: ponto no objeto + linha até o rótulo
const Callout: React.FC<{ f: number; at: number; x: number; y: number; lx: number; ly: number; text: string; sub?: string; c?: string; right?: boolean }> = ({ f, at, x, y, lx, ly, text, sub, c = GOLD, right = false }) => {
  if (f < at) return null;
  const p = ease(f, at, 10);
  const mx = x + (lx - x) * p;
  const my = y + (ly - y) * p;
  return (
    <>
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, zIndex: 40, overflow: "visible" }}>
        <circle cx={x} cy={y} r={10 + 4 * Math.sin(f / 5)} fill="none" stroke={c} strokeWidth={3} opacity={0.9} />
        <circle cx={x} cy={y} r={4} fill={c} />
        <line x1={x} y1={y} x2={mx} y2={my} stroke={c} strokeWidth={3} />
      </svg>
      <div style={{ position: "absolute", zIndex: 41, left: right ? undefined : lx + 10, right: right ? 1080 - lx + 10 : undefined, top: ly - 34, opacity: ease(f, at + 6, 8), textAlign: right ? "right" : "left", background: "rgba(8,7,5,0.82)", padding: "8px 16px", borderLeft: right ? undefined : `4px solid ${c}`, borderRight: right ? `4px solid ${c}` : undefined }}>
        <div style={{ fontFamily: RV, fontSize: 40, color: D.cream, lineHeight: 1, whiteSpace: "nowrap" }}>{text}</div>
        {sub ? <div style={{ fontFamily: RD, fontWeight: 700, fontSize: 20, letterSpacing: 4, color: c, marginTop: 4, whiteSpace: "nowrap" }}>{sub}</div> : null}
      </div>
    </>
  );
};

// cantoneiras de mira/foco
const Reticle: React.FC<{ f: number; at: number; cx: number; cy: number; w0: number; w1: number; h1: number; c?: string }> = ({ f, at, cx, cy, w0, w1, h1, c = GOLD }) => {
  if (f < at) return null;
  const p = ease(f, at, 14);
  const w = w0 + (w1 - w0) * p;
  const h = (w0 * h1) / w1 + (h1 - (w0 * h1) / w1) * p;
  const L = 60;
  const s = { position: "absolute" as const, width: L, height: L, borderColor: c, borderStyle: "solid", opacity: p };
  return (
    <div style={{ position: "absolute", left: cx - w / 2, top: cy - h / 2, width: w, height: h, zIndex: 30 }}>
      <div style={{ ...s, left: 0, top: 0, borderWidth: "5px 0 0 5px" }} />
      <div style={{ ...s, right: 0, top: 0, borderWidth: "5px 5px 0 0" }} />
      <div style={{ ...s, left: 0, bottom: 0, borderWidth: "0 0 5px 5px" }} />
      <div style={{ ...s, right: 0, bottom: 0, borderWidth: "0 5px 5px 0" }} />
    </div>
  );
};

const Vig: React.FC<{ o?: number }> = ({ o = 0.75 }) => <AbsoluteFill style={{ background: `radial-gradient(ellipse 75% 60% at 50% 45%, rgba(0,0,0,0) 45%, rgba(0,0,0,${o}) 100%)`, pointerEvents: "none", zIndex: 70 }} />;

// fita de isolamento amarela que estica atravessando a tela
const Tape: React.FC<{ f: number; at: number; rot: number; top: number; dir?: 1 | -1; text: string }> = ({ f, at, rot, top, dir = 1, text }) => {
  if (f < at) return null;
  const p = interpolate(f, [at, at + 7], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const sway = Math.sin((f - at) / 6) * 1.2 * (1 - ease(f, at, 20));
  const stripes = `repeating-linear-gradient(45deg, #111 0 22px, #f2c230 22px 44px)`;
  return (
    <div style={{ position: "absolute", left: -340, top, width: 1760, height: 132, transform: `rotate(${rot + sway}deg)`, zIndex: 50, clipPath: dir === 1 ? `inset(0 ${(1 - p) * 100}% 0 0)` : `inset(0 0 0 ${(1 - p) * 100}%)`, filter: "drop-shadow(0 18px 24px rgba(0,0,0,0.7))" }}>
      <div style={{ height: 16, background: stripes }} />
      <div style={{ height: 100, background: "linear-gradient(180deg, #ffd84a, #e9b820)", display: "flex", alignItems: "center", gap: 46, paddingLeft: 40, overflow: "hidden" }}>
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} style={{ fontFamily: RV, fontSize: 70, color: "#111", whiteSpace: "nowrap", letterSpacing: 4 }}>
            {text}
          </div>
        ))}
      </div>
      <div style={{ height: 16, background: stripes }} />
    </div>
  );
};

// ========== 1) "repara numa coisa, o jogo ainda está em beta" — gameplay congela, fita EM BETA atravessa ==========
export const C9Tape: React.FC<{ life: number; repAt?: number; aindaAt?: number; betaAt?: number }> = ({ life, repAt = 20, aindaAt = 77, betaAt = 107 }) => {
  const f = useCurrentFrame();
  const frozen = f >= aindaAt;
  const z = 1.06 + f * 0.0012 + 0.2 * ease(f, repAt, 30);
  const g = ease(f, aindaAt, 8);
  const sh = shake(f, aindaAt, 16, 10, "t1");
  const sh2 = shake(f, aindaAt + 8, 12, 10, "t2");
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `translate(${sh.x + sh2.x}px, ${sh.y + sh2.y}px) scale(${z})`, transformOrigin: "50% 42%", filter: frozen ? `grayscale(${0.8 * g}) brightness(${1 - 0.4 * g}) contrast(1.1)` : undefined }}>
        {!frozen ? <Clip src={V("g_raw.mp4")} dur={aindaAt + 2} /> : <Img src={V("g_raw_freeze.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
      </AbsoluteFill>
      <Reticle f={f} at={repAt} cx={540} cy={800} w0={1000} w1={560} h1={640} />
      {f >= repAt && f < aindaAt ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 240, display: "flex", justifyContent: "center" }}>
          <Hud f={f} at={repAt + 4} dot={D.red} size={24}>
            OLHA SÓ
          </Hud>
        </div>
      ) : null}
      <Tape f={f} at={aindaAt} rot={-11} top={600} text="EM BETA" />
      <Tape f={f} at={aindaAt + 8} rot={8} top={860} dir={-1} text="EM BETA" />
      <Flash f={f} ts={[aindaAt]} pk={0.35} />
      <Vig o={0.6} />
      <Grain />
    </AbsoluteFill>
  );
};

// ---------- estante de troféus (museu da Valve) ----------
const Pedestal: React.FC<{ x: number; w?: number; top?: number; children?: React.ReactNode; light?: number; flicker?: boolean; f: number }> = ({ x, w = 250, top = 1000, children, light = 1, flicker = false, f }) => {
  const fl = flicker ? (random(`fl${Math.floor(f / 2)}`) > 0.35 ? 1 : 0.35) : 1;
  return (
    <>
      {/* facho de luz */}
      <div style={{ position: "absolute", left: x - w * 0.9, top: 120, width: w * 1.8, height: top - 120, background: `linear-gradient(180deg, rgba(255,236,190,${0.0}) 0%, rgba(255,236,190,${0.16 * light * fl}) 100%)`, clipPath: "polygon(42% 0, 58% 0, 100% 100%, 0 100%)", mixBlendMode: "screen", zIndex: 2 }} />
      <div style={{ position: "absolute", left: x - w / 2, top, width: w, height: 260, zIndex: 3 }}>
        <div style={{ height: 22, background: `linear-gradient(180deg, #6b5532, #2b2216)`, borderTop: `2px solid ${GOLD}` }} />
        <div style={{ height: 238, margin: "0 14px", background: "linear-gradient(90deg, #15110b, #2a2218 50%, #15110b)", borderLeft: `1px solid ${GOLD}44`, borderRight: `1px solid ${GOLD}44`, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 22, gap: 6 }}>
          {children}
        </div>
      </div>
      {/* chão iluminado */}
      <div style={{ position: "absolute", left: x - w, top: top + 240, width: w * 2, height: 70, borderRadius: "50%", background: `radial-gradient(ellipse, rgba(255,230,180,${0.22 * light * fl}), rgba(0,0,0,0) 70%)`, zIndex: 1 }} />
    </>
  );
};

const PlateTxt: React.FC<{ a: string; b: string; c?: string }> = ({ a, b, c = GOLD }) => (
  <>
    <div style={{ fontFamily: RV, fontSize: 30, color: D.cream, whiteSpace: "nowrap" }}>{a}</div>
    <div style={{ fontFamily: RD, fontWeight: 700, fontSize: 16, letterSpacing: 3, color: c, whiteSpace: "nowrap" }}>{b}</div>
  </>
);

const Museum: React.FC<{ f: number; z: number; valveLit: number; emptyFlicker: boolean; center?: React.ReactNode; centerPlate?: React.ReactNode; dim?: number }> = ({ f, z, valveLit, emptyFlicker, center, centerPlate, dim = 0 }) => (
  <Cam f={f} rx={4} z={z} origin="50% 52%">
    <AbsoluteFill style={{ background: "radial-gradient(ellipse 90% 60% at 50% 40%, #241b10 0%, #0b0907 70%, #050403 100%)" }} />
    {/* parede com placa da Valve */}
    <div style={{ position: "absolute", left: 0, right: 0, top: 250, display: "flex", flexDirection: "column", alignItems: "center", gap: 14, zIndex: 4 }}>
      <Img src={MG("valve.png")} style={{ width: 300, filter: `grayscale(${1 - valveLit}) brightness(${0.45 + 0.55 * valveLit})`, boxShadow: valveLit > 0.5 ? `0 0 ${50 * valveLit}px #f84a3d88` : undefined }} />
      <div style={{ fontFamily: RD, fontWeight: 700, fontSize: 24, letterSpacing: 9, color: GOLD, opacity: 0.5 + 0.5 * valveLit }}>CAMPEONATOS OFICIAIS</div>
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, top: 1240, height: 700, background: "linear-gradient(180deg, #0f0c08, #050403)", borderTop: `1px solid ${GOLD}33` }} />
    {/* Dota 2: Aegis */}
    <Pedestal f={f} x={200} light={1 - dim}>
      <PlateTxt a="DOTA 2" b="THE INTERNATIONAL" />
    </Pedestal>
    <Img src={V("aegis.png")} style={{ position: "absolute", left: 200 - 150, top: 1000 - 250, width: 300, zIndex: 5, filter: `drop-shadow(0 20px 30px #000) brightness(${1 - 0.5 * dim})`, transform: `translateY(${Math.sin(f / 18) * 4}px)` }} />
    {/* CS: taça do Major (foto real numa vitrine) */}
    <Pedestal f={f} x={880} light={1 - dim}>
      <PlateTxt a="COUNTER-STRIKE" b="MAJOR" />
    </Pedestal>
    <div style={{ position: "absolute", left: 880 - 105, top: 1000 - 330, width: 210, height: 330, zIndex: 5, overflow: "hidden", border: `2px solid ${GOLD}88`, boxShadow: "inset 0 0 40px rgba(255,255,255,0.15), 0 20px 30px #000", filter: `brightness(${1 - 0.5 * dim})` }}>
      <Img src={V("major_cup.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "40% 30%" }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(120deg, rgba(255,255,255,0.18), rgba(255,255,255,0) 40%)" }} />
    </div>
    {/* Deadlock: pedestal vazio */}
    <Pedestal f={f} x={540} w={290} light={emptyFlicker ? 1 : 0.9} flicker={emptyFlicker}>
      {centerPlate ?? (
        <>
          <Img src={MG("dl_logo.png")} style={{ height: 46 }} />
          <div style={{ fontFamily: RD, fontWeight: 700, fontSize: 18, letterSpacing: 4, color: D.dim }}>NENHUM AINDA</div>
        </>
      )}
    </Pedestal>
    {center}
  </Cam>
);

// ========== 2) "não tem campeonato oficial da Valve... e mesmo assim, uma organização do tamanho da Cloud9" ==========
export const C9Museum: React.FC<{ life: number; campAt?: number; valveAt?: number; tamAt?: number; c9At?: number }> = ({ life, campAt = 18, valveAt = 49, tamAt = 112, c9At = 125 }) => {
  const f = useCurrentFrame();
  const z = 1.0 + 0.1 * ease(f, 0, 60) + 0.05 * ease(f, valveAt + 10, 50) - 0.12 * ease(f, tamAt - 8, 14);
  const drop = interpolate(f, [tamAt - 6, tamAt + 3], [-900, 0], { ...clamp, easing: Easing.in(Easing.cubic) });
  const sh = shake(f, tamAt + 3, 26, 14, "c9");
  return (
    <AbsoluteFill style={{ background: "#050403", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `translate(${sh.x}px, ${sh.y}px)` }}>
        <Museum
          f={f}
          z={z}
          valveLit={ease(f, valveAt, 8)}
          emptyFlicker={f >= campAt && f < campAt + 24}
          dim={0.4 * ease(f, tamAt, 10)}
          center={
            f >= tamAt - 6 ? (
              <div style={{ position: "absolute", left: 540 - 330, top: 520 + drop, width: 660, zIndex: 8, display: "flex", flexDirection: "column", alignItems: "center" }}>
                <Img src={V("c9_cloud.png")} style={{ width: 640, filter: `drop-shadow(0 0 60px ${C9BLUE}aa) drop-shadow(0 40px 40px #000)` }} />
              </div>
            ) : null
          }
        />
      </AbsoluteFill>
      {/* poeira do impacto */}
      {f >= tamAt + 3 && f < tamAt + 30 ? <div style={{ position: "absolute", left: 140, top: 940, width: 800, height: 200, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(220,200,160,0.35), rgba(0,0,0,0) 70%)", opacity: 1 - ease(f, tamAt + 3, 26), transform: `scale(${1 + ease(f, tamAt + 3, 26) * 0.6})`, zIndex: 9 }} /> : null}
      {f >= c9At ? (
        <Center top={1135} style={{ zIndex: 20 }}>
          <Hud f={f} at={c9At} c={C9BLUE} size={28}>
            LOL · CS · VALORANT · AGORA DEADLOCK
          </Hud>
        </Center>
      ) : null}
      <Flash f={f} ts={[tamAt + 3]} pk={0.25} />
      <Vig />
      <Grain />
    </AbsoluteFill>
  );
};

// ========== 3) "já contratou um time" — trailer: a bandeira da Cloud9 entregue ==========
export const C9Hand: React.FC<{ life: number; contAt?: number }> = ({ life, contAt = 10 }) => {
  const f = useCurrentFrame();
  const ss = 1569 - contAt; // a mão entrega a bandeira por volta de 52,3 s do trailer
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${1.12 + f * 0.002 + punch(f, [contAt], 0.06, 10)})`, transformOrigin: "52% 45%" }}>
        <Clip src={V("trailer.mp4")} dur={life} ss={ss} pos="52% 50%" />
      </AbsoluteFill>
      <div style={{ position: "absolute", left: 50, top: 220, display: "flex", alignItems: "center", gap: 16, zIndex: 20, opacity: ease(f, 2, 8) }}>
        <Img src={V("c9_cloud.png")} style={{ width: 58 }} />
        <Hud f={f} at={2} size={22}>
          TRAILER · @C9DLock
        </Hud>
      </div>
      <Center top={1080} style={{ zIndex: 30 }}>
        <Stamp f={f} at={contAt} text="CONTRATOU" c={C9BLUE} size={86} rot={-4} />
      </Center>
      <Vig o={0.55} />
      <Grain />
    </AbsoluteFill>
  );
};

// ========== 4) "pra se preparar pro cenário profissional competitivo" — transmissão do Night Shift ==========
export const C9Pro: React.FC<{ life: number; cenAt?: number; compAt?: number; dlAt?: number }> = ({ life, cenAt = 36, compAt = 66, dlAt = 99 }) => {
  const f = useCurrentFrame();
  const top = 600;
  const k = 1 + f * 0.0009;
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <Band src={V("ns_lomein.mp4")} dur={life} ss={30} top={top} k={k} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 250, display: "flex", flexDirection: "column", alignItems: "center", gap: 18, zIndex: 20 }}>
        <Img src={V("ns_badge.png")} style={{ height: 120, opacity: ease(f, 0, 10), filter: "drop-shadow(0 10px 20px #000)" }} />
        <Hud f={f} at={6} c={NS} size={24} dot={D.red}>
          FINAL NA · TRANSMISSÃO
        </Hud>
      </div>
      <Callout f={f} at={cenAt} x={70} y={top + 8} lx={130} ly={top - 70} text="MELEE CREEPS" sub="A LINE QUE A CLOUD9 CONTRATOU" c={C9BLUE} />
      <Callout f={f} at={compAt} x={1010} y={top + 8} lx={1000} ly={top + 690} text="PULSAR ESPORTS" sub="ADVERSÁRIO NA FINAL" c={NS} right />
      <Vig o={0.5} />
      <Grain />
    </AbsoluteFill>
  );
};

// ========== 5) "lá fora não tão esperando a Valve, tão fazendo na raça" — narradores, logo, briga ==========
export const C9Fora: React.FC<{ life: number; esperAt?: number; valveAt?: number; fazAt?: number; racaAt?: number }> = ({ life, esperAt = 75, valveAt = 90, fazAt = 119, racaAt = 168 }) => {
  const f = useCurrentFrame();
  const t1 = fazAt - 10;
  const t2 = racaAt - 22;
  const sh = shake(f, racaAt, 22, 12, "rc");
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      {f < t1 + 2 ? (
        <>
          <Band src={V("ns_cast.mp4")} dur={t1 + 2} ss={0} top={600} k={1 + f * 0.0008} />
          <Callout f={f} at={14} x={300} y={830} lx={120} ly={500} text="NARRAÇÃO AO VIVO" sub="CAMPEONATO INDEPENDENTE" c={NS} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 1260, display: "flex", justifyContent: "center", alignItems: "center", gap: 22, zIndex: 30 }}>
            {f >= esperAt ? (
              <div style={{ position: "relative", opacity: ease(f, esperAt, 8) }}>
                <Img src={MG("valve.png")} style={{ height: 70, filter: "grayscale(0.6) brightness(0.8)" }} />
                <svg width={250} height={70} style={{ position: "absolute", left: 0, top: 0 }}>
                  <line x1={0} y1={66} x2={250 * ease(f, valveAt, 6)} y2={66 - 62 * ease(f, valveAt, 6)} stroke={D.red} strokeWidth={8} strokeLinecap="round" />
                </svg>
              </div>
            ) : null}
            <Hud f={f} at={esperAt + 4} size={24} c={D.cream}>
              NINGUÉM ESPEROU
            </Hud>
          </div>
        </>
      ) : null}
      {f >= t1 && f < t2 + 2 ? <Band src={V("ns_logo.mp4")} from={t1} dur={t2 - t1 + 2} ss={95} top={600} k={1.02} /> : null}
      {f >= t2 ? (
        <AbsoluteFill style={{ transform: `translate(${sh.x}px, ${sh.y}px) scale(${1.25 + punch(f, [racaAt], 0.12, 10)})` }}>
          <Clip src={V("ns_fight.mp4")} from={t2} dur={life - t2} ss={90} pos="50% 50%" />
        </AbsoluteFill>
      ) : null}
      {f >= racaAt ? (
        <Center top={760} style={{ zIndex: 40 }}>
          <Stamp f={f} at={racaAt} text="NA RAÇA" c={NS} size={110} rot={-6} />
        </Center>
      ) : null}
      <Flash f={f} ts={[t1, t2]} pk={0.3} />
      <Vig o={0.55} />
      <Grain />
    </AbsoluteFill>
  );
};

// ---------- mapa do Brasil (mesa de operações noir) ----------
const MAP_S = 0.84;
const MAP_X = 540 - (979 * MAP_S) / 2;
const MAP_Y = 290;
const BrMap: React.FC<{ f: number; drawAt: number; amp: (f: number) => number; inside?: React.ReactNode; glow?: number; children?: React.ReactNode }> = ({ f, drawAt, amp, inside, glow = 0, children }) => {
  const draw = ease(f, drawAt, 30);
  const pts: string[] = [];
  for (let i = 0; i <= 120; i++) {
    const x = (i / 120) * 1080;
    const a = amp(f) * (0.35 + 0.65 * random(`w${i}-${Math.floor(f / 2)}`)) * Math.sin(i * 0.9 + f * 0.6);
    pts.push(`${x.toFixed(0)},${(820 + a).toFixed(1)}`);
  }
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse 90% 70% at 50% 42%, #10161a 0%, #07090b 70%, #030405 100%)", overflow: "hidden" }}>
      {/* grade de coordenadas */}
      <AbsoluteFill style={{ backgroundImage: `linear-gradient(${GOLD}14 1px, transparent 1px), linear-gradient(90deg, ${GOLD}14 1px, transparent 1px)`, backgroundSize: "90px 90px", backgroundPosition: "0 20px" }} />
      <div style={{ position: "absolute", left: MAP_X, top: MAP_Y, width: 979, height: 1000, transform: `scale(${MAP_S})`, transformOrigin: "0 0" }}>
        {inside ? <div style={{ position: "absolute", inset: 0, clipPath: `path('${BR_PATH}')` }}>{inside}</div> : null}
        <svg width={979} height={1000} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <defs>
            <filter id="brglow">
              <feGaussianBlur stdDeviation={6 + 10 * glow} />
            </filter>
          </defs>
          {!inside ? <path d={BR_PATH} fill="#d8b46a" opacity={0.06 * draw} /> : null}
          <path d={BR_PATH} fill="none" stroke={GOLD} strokeWidth={10} opacity={0.35 + 0.65 * glow} filter="url(#brglow)" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} />
          <path d={BR_PATH} fill="none" stroke={GOLD} strokeWidth={4} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} />
        </svg>
      </div>
      {/* onda de áudio atravessando o mapa */}
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, zIndex: 10 }}>
        <polyline points={pts.join(" ")} fill="none" stroke={D.soul} strokeWidth={4} opacity={0.85} style={{ filter: `drop-shadow(0 0 8px ${D.soul})` }} />
      </svg>
      {children}
    </AbsoluteFill>
  );
};

// ========== 6) "e aqui no Brasil, tá tudo muito quieto" ==========
export const C9Quiet: React.FC<{ life: number; brAt?: number; quietAt?: number }> = ({ life, brAt = 12, quietAt = 82 }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <BrMap f={f} drawAt={0} amp={() => 3}>
        <div style={{ position: "absolute", left: 60, top: 220, zIndex: 20 }}>
          <Hud f={f} at={brAt} size={24} c={GOLD}>
            BRASIL · CENÁRIO COMPETITIVO
          </Hud>
        </div>
        <div style={{ position: "absolute", right: 60, top: 1180, zIndex: 20, textAlign: "right" }}>
          <Hud f={f} at={quietAt - 10} size={24} c={D.soul} dot={D.soul}>
            SINAL: QUASE NADA
          </Hud>
        </div>
        {f >= quietAt ? (
          <Center top={745} style={{ zIndex: 30 }}>
            <Stamp f={f} at={quietAt} text="SILÊNCIO" c={D.dim} size={80} rot={-3} />
          </Center>
        ) : null}
      </BrMap>
      <Vig o={0.6} />
      <Grain />
    </AbsoluteFill>
  );
};

// ========== 7) "e eu acho que isso é responsabilidade minha" — seleção de herói: ele trava a si mesmo ==========
const HEROES = ["haze", "infernus", "seven", "lash", "paradox", "mirage", "vindicta", "abrams", "mcginnis", "pocket", "kelvin", "wraith", "bebop", "dynamo"];
export const C9Me: React.FC<{ life: number; pesAt?: number; respAt?: number; minhaAt?: number }> = ({ life, pesAt = 20, respAt = 67, minhaAt = 94 }) => {
  const f = useCurrentFrame();
  const lock = f >= minhaAt;
  const slide = interpolate(f, [0, 30], [260, 0], { ...clamp, easing: Easing.out(Easing.cubic) });
  const cur = f < respAt ? { x: 900, y: 1500 } : { x: interpolate(f, [respAt, minhaAt - 4], [900, 560], { ...clamp, easing: Easing.inOut(Easing.cubic) }), y: interpolate(f, [respAt, minhaAt - 4], [1500, 1060], { ...clamp, easing: Easing.inOut(Easing.cubic) }) };
  const sh = shake(f, minhaAt, 12, 10, "lk");
  return (
    <AbsoluteFill style={{ background: D.bg, overflow: "hidden" }}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 80% 55% at 50% 40%, #3a2a14cc 0%, rgba(0,0,0,0) 70%)" }} />
      {/* fileira de heróis atrás */}
      <div style={{ position: "absolute", left: -200 + slide - f * 1.2, top: 380, display: "flex", gap: 22, opacity: 0.45, filter: "blur(2px) grayscale(0.4)" }}>
        {HEROES.concat(HEROES).map((h, i) => (
          <Img key={i} src={V(`heroes/${h}.png`)} style={{ width: 200, height: 271, objectFit: "cover", border: `2px solid ${D.line}` }} />
        ))}
      </div>
      <AbsoluteFill style={{ transform: `translate(${sh.x}px, ${sh.y}px)` }}>
        <Center top={240} style={{ zIndex: 5 }}>
          <Hud f={f} at={4} size={24} c={D.dim}>
            ESCOLHA SEU HERÓI
          </Hud>
        </Center>
        <Center top={320} style={{ zIndex: 10 }}>
          <div style={{ position: "relative", width: 470, height: 620, transform: `scale(${1 + punch(f, [minhaAt], 0.06, 10)})`, border: `5px solid ${lock ? GOLD : D.line}`, boxShadow: lock ? `0 0 70px ${GOLD}aa, 0 30px 80px #000` : "0 30px 80px #000", overflow: "hidden", background: "#000" }}>
            <Img src={BLIES} style={{ width: "100%", height: "100%", objectFit: "cover", filter: lock ? "none" : "grayscale(0.5) brightness(0.8)" }} />
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 170, background: "linear-gradient(180deg, rgba(0,0,0,0), rgba(0,0,0,0.92))" }} />
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 26, textAlign: "center", fontFamily: RV, fontSize: 86, color: lock ? GOLD : D.cream, letterSpacing: 4 }}>BLIES</div>
          </div>
        </Center>
        {/* botão TRAVAR */}
        <Center top={1000} style={{ zIndex: 12 }}>
          <div style={{ padding: "22px 70px", fontFamily: RV, fontSize: 52, letterSpacing: 6, color: lock ? "#1a1408" : D.cream, background: lock ? `linear-gradient(180deg, #f3d48a, ${GOLD})` : "rgba(20,17,13,0.95)", border: `3px solid ${GOLD}`, clipPath: "polygon(14px 0, calc(100% - 14px) 0, 100% 50%, calc(100% - 14px) 100%, 14px 100%, 0 50%)", opacity: ease(f, pesAt, 10) }}>
            {lock ? "TRAVADO" : "TRAVAR"}
          </div>
        </Center>
        {lock ? (
          <Center top={1150} style={{ zIndex: 12 }}>
            <Hud f={f} at={minhaAt + 4} size={26} c={GOLD}>
              RESPONSABILIDADE MINHA
            </Hud>
          </Center>
        ) : null}
      </AbsoluteFill>
      {f >= pesAt && f < minhaAt + 8 ? <Cursor x={cur.x} y={cur.y} f={f} clicks={[minhaAt - 2]} /> : null}
      <Flash f={f} ts={[minhaAt]} pk={0.25} c={GOLD} />
      <Vig o={0.6} />
      <Grain />
    </AbsoluteFill>
  );
};

// ========== 8) "quero começar a fazer o barulho no competitivo aqui no Brasil" — o mapa explode em gameplay ==========
export const C9Noise: React.FC<{ life: number; barAt?: number; compAt?: number; brAt?: number }> = ({ life, barAt = 50, compAt = 75, brAt = 120 }) => {
  const f = useCurrentFrame();
  const sh = shake(f, barAt, 30, 16, "nz");
  const amp = (k: number) => (k < barAt ? 3 + 2 * ease(k, barAt - 20, 18) : 160 * (1 - 0.55 * ease(k, barAt + 8, 30)) + 40 * Math.abs(Math.sin(k / 3)));
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <AbsoluteFill style={{ transform: `translate(${sh.x}px, ${sh.y}px) scale(${1 + punch(f, [barAt], 0.08, 12)})` }}>
        <BrMap
          f={f}
          drawAt={-40}
          amp={amp}
          glow={ease(f, brAt, 10)}
          inside={
            f >= barAt - 1 ? (
              <AbsoluteFill style={{ opacity: ease(f, barAt - 1, 4) }}>
                <Clip src={PC("rk_ult.mp4")} from={barAt - 1} dur={life} ss={30} pos="50% 50%" />
              </AbsoluteFill>
            ) : null
          }
        >
          <div style={{ position: "absolute", left: 60, top: 220, zIndex: 20 }}>
            <Hud f={f} at={0} size={24} c={GOLD}>
              BRASIL · CENÁRIO COMPETITIVO
            </Hud>
          </div>
          <div style={{ position: "absolute", right: 60, top: 1180, zIndex: 20 }}>
            <Hud f={f} at={barAt} size={24} c={D.red} dot={D.red}>
              SINAL: BARULHO
            </Hud>
          </div>
          {f >= compAt ? (
            <div style={{ position: "absolute", left: 0, right: 0, top: 1210, display: "flex", justifyContent: "center", zIndex: 25 }}>
              <Img src={MG("dl_logo.png")} style={{ height: 70, opacity: ease(f, compAt, 8), filter: "drop-shadow(0 6px 14px #000)" }} />
            </div>
          ) : null}
        </BrMap>
      </AbsoluteFill>
      <Flash f={f} ts={[barAt]} pk={0.4} />
      <Flash f={f} ts={[brAt]} pk={0.2} c={GOLD} />
      <Vig o={0.5} />
      <Grain />
    </AbsoluteFill>
  );
};

// ========== 9) "venho tendo essa ideia e repetindo em alguns vídeos" — esboço da chave + os vídeos dele ==========
const PHONES = ["v_ratos.mp4", "v_patch.mp4", "v_cansei.mp4", "v_obj.mp4"];
export const C9Ideia: React.FC<{ life: number; ideiaAt?: number; repAt?: number; vidAt?: number }> = ({ life, ideiaAt = 37, repAt = 50, vidAt = 71 }) => {
  const f = useCurrentFrame();
  const out = ease(f, repAt - 4, 14);
  const lines: [number, number, number, number, number][] = [
    // x1,y1,x2,y2,início
    [150, 520, 330, 520, 4], [150, 700, 330, 700, 8], [330, 520, 330, 700, 12], [330, 610, 520, 610, 16],
    [150, 880, 330, 880, 10], [150, 1060, 330, 1060, 14], [330, 880, 330, 1060, 18], [330, 970, 520, 970, 22],
    [520, 610, 520, 970, 26], [520, 790, 760, 790, 30],
  ];
  return (
    <AbsoluteFill style={{ background: "#0b0a08", overflow: "hidden" }}>
      {/* caderno com o esboço da chave */}
      <AbsoluteFill style={{ transform: `translateY(${-out * 140}px) scale(${1 - out * 0.12})`, filter: `blur(${out * 8}px) brightness(${1 - out * 0.55})` }}>
        <div style={{ position: "absolute", left: 90, top: 300, width: 900, height: 980, background: "repeating-linear-gradient(180deg, transparent 0 58px, #b8a98a55 58px 60px), linear-gradient(180deg, #efe4c8, #e2d4b2)", boxShadow: "0 40px 90px #000", transform: "rotate(-2deg)" }}>
          <svg width={900} height={980} style={{ position: "absolute", left: 0, top: 0 }}>
            {lines.map(([x1, y1, x2, y2, a], i) => {
              const p = ease(f, a, 8);
              return <line key={i} x1={x1 - 90} y1={y1 - 300} x2={x1 - 90 + (x2 - x1) * p} y2={y1 - 300 + (y2 - y1) * p} stroke="#1d2a44" strokeWidth={7} strokeLinecap="round" opacity={0.9} />;
            })}
            {f >= ideiaAt ? <circle cx={760 - 90 + 60} cy={790 - 300} r={70 * ease(f, ideiaAt, 10)} fill="none" stroke="#b3261e" strokeWidth={7} /> : null}
          </svg>
          <div style={{ position: "absolute", left: 600, top: 440, fontFamily: RV, fontSize: 64, color: "#b3261e", opacity: ease(f, ideiaAt + 4, 6), transform: "rotate(-6deg)" }}>?</div>
          <div style={{ position: "absolute", left: 60, top: 40, fontFamily: RV, fontSize: 54, color: "#1d2a44", opacity: ease(f, 0, 10) }}>CAMPEONATO</div>
        </div>
      </AbsoluteFill>
      {/* os vídeos dele, em celulares */}
      {PHONES.map((p, i) => {
        const at = i < 2 ? repAt + i * 7 : vidAt + (i - 2) * 7;
        if (f < at) return null;
        const k = ease(f, at, 12);
        const x = 60 + i * 245;
        return (
          <div key={p} style={{ position: "absolute", left: x, top: 470 + (i % 2) * 70, width: 230, height: 409, borderRadius: 26, overflow: "hidden", border: "6px solid #111", outline: `2px solid ${GOLD}55`, boxShadow: "0 30px 60px #000", transform: `perspective(1400px) rotateY(${(1 - k) * 60 - 10 + i * 6}deg) translateY(${(1 - k) * 300}px)`, opacity: k, zIndex: 10 + i }}>
            <Clip src={V(p)} from={at} dur={life - at} />
          </div>
        );
      })}
      {f >= repAt ? (
        <Center top={250} style={{ zIndex: 30 }}>
          <Hud f={f} at={repAt} size={24} c={GOLD}>
            JÁ FALEI DISSO AQUI
          </Hud>
        </Center>
      ) : null}
      <Vig o={0.6} />
      <Grain />
    </AbsoluteFill>
  );
};

// ========== 10) "que eu quero fazer um campeonato de Deadlock" — o pedestal vazio ganha o campeonato BR ==========
export const C9Trofeu: React.FC<{ life: number; campAt?: number; dlAt?: number }> = ({ life, campAt = 4, dlAt = 33 }) => {
  const f = useCurrentFrame();
  const rise = interpolate(f, [campAt, campAt + 16], [260, 0], { ...clamp, easing: Easing.out(Easing.back(1.4)) });
  const z = 1.25 + f * 0.002;
  return (
    <AbsoluteFill style={{ background: "#050403", overflow: "hidden" }}>
      <Museum
        f={f}
        z={z}
        valveLit={0.3}
        emptyFlicker={false}
        dim={0.6}
        centerPlate={<PlateTxt a="CAMPEONATO BR" b="EM BREVE" c={D.green} />}
        center={
          f >= campAt ? (
            <div style={{ position: "absolute", left: 540 - 140, top: 700 + rise, width: 280, height: 280, zIndex: 8, opacity: ease(f, campAt, 6) }}>
              <div style={{ position: "absolute", inset: -120, background: `conic-gradient(from ${f * 1.5}deg, rgba(255,215,140,0) 0deg, rgba(255,215,140,0.35) 20deg, rgba(255,215,140,0) 40deg, rgba(255,215,140,0) 90deg, rgba(255,215,140,0.3) 110deg, rgba(255,215,140,0) 130deg, rgba(255,215,140,0) 180deg, rgba(255,215,140,0.35) 200deg, rgba(255,215,140,0) 220deg, rgba(255,215,140,0) 270deg, rgba(255,215,140,0.3) 290deg, rgba(255,215,140,0) 310deg)`, borderRadius: "50%", filter: "blur(6px)" }} />
              <div style={{ position: "absolute", inset: -14, borderRadius: "50%", background: "conic-gradient(from 200deg, #6b4e1e, #f6dc96, #8a6a30, #f3d48a, #5a3f16, #e9c776, #6b4e1e)", boxShadow: `0 0 50px ${GOLD}88, 0 30px 40px #000` }} />
              <Img src={MG("dl_emblem.png")} style={{ position: "absolute", inset: 0, width: 280, height: 280, filter: `sepia(1) saturate(1.5) hue-rotate(-10deg) brightness(${0.82 + 0.3 * punch(f, [dlAt], 1, 12)}) contrast(1.25)`, transform: `rotateY(${Math.sin(f / 20) * 14}deg)` }} />
            </div>
          ) : null
        }
      />
      <Flash f={f} ts={[campAt]} pk={0.3} c={GOLD} />
      <Vig />
      <Grain />
    </AbsoluteFill>
  );
};

// ========== 11) "e quem sabe sai ainda esse mês" — calendário de novembro, dias que sobram acendem ==========
export const C9Mes: React.FC<{ life: number; saiAt?: number; mesAt?: number }> = ({ life, saiAt = 40, mesAt = 60 }) => {
  const f = useCurrentFrame();
  const first = 0; // 01/11/2026 é domingo
  const today = 10;
  const days = Array.from({ length: 30 }, (_, i) => i + 1);
  return (
    <AbsoluteFill style={{ background: "#0b0a08", overflow: "hidden" }}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 80% 55% at 50% 42%, #3a2a14aa 0%, rgba(0,0,0,0) 70%)" }} />
      <Cam f={f} rx={10} z={1 + f * 0.0015}>
        <Center top={280}>
          <div style={{ width: 920, background: "linear-gradient(180deg, #efe4c8, #e0d1ad)", boxShadow: "0 40px 90px #000", transform: `translateY(${(1 - ease(f, 0, 12)) * 120}px)` }}>
            <div style={{ background: "#7a1f18", color: "#f4e6c4", fontFamily: RV, fontSize: 74, textAlign: "center", padding: "18px 0", letterSpacing: 6 }}>NOVEMBRO · 2026</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", padding: "18px 24px 30px", gap: 10 }}>
              {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
                <div key={i} style={{ textAlign: "center", fontFamily: RD, fontWeight: 700, fontSize: 26, color: "#6b5a3a" }}>
                  {d}
                </div>
              ))}
              {Array.from({ length: first }).map((_, i) => (
                <div key={`e${i}`} />
              ))}
              {days.map((d) => {
                const at = saiAt + (d - today) * 1.2;
                const on = d >= today && f >= at;
                return (
                  <div key={d} style={{ height: 96, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: RV, fontSize: 48, color: d < today ? "#a89a7c" : on ? "#f6ead0" : "#2a2116", background: on ? `rgba(122,31,24,${0.55 + 0.35 * ease(f, at, 6)})` : d < today ? "transparent" : "rgba(0,0,0,0.04)", textDecoration: d < today ? "line-through" : undefined, transform: on ? `scale(${1 + punch(f, [at], 0.1, 8)})` : undefined }}>
                    {d}
                  </div>
                );
              })}
            </div>
          </div>
        </Center>
      </Cam>
      {f >= mesAt ? (
        <div style={{ position: "absolute", left: 760, top: 300, fontFamily: RV, fontSize: 260, color: "#e24a3b", transform: `rotate(10deg) scale(${interpolate(f, [mesAt, mesAt + 5], [1.8, 1], clamp)})`, opacity: ease(f, mesAt, 4), textShadow: "0 10px 30px #000", zIndex: 20 }}>?</div>
      ) : null}
      <Vig o={0.6} />
      <Grain />
    </AbsoluteFill>
  );
};

// ========== 12) "organizar com algumas pessoas, montar alguns times pra jogar" — lobby Amber Hand x Sapphire Flame ==========
export const C9Times: React.FC<{ life: number; orgAt?: number; montAt?: number; jogAt?: number }> = ({ life, orgAt = 18, montAt = 90, jogAt = 132 }) => {
  const f = useCurrentFrame();
  const col = (team: number) => {
    const c = team === 0 ? D.amber : D.sapph;
    return (
      <div style={{ width: 470, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ fontFamily: RV, fontSize: 46, color: c, textAlign: team === 0 ? "left" : "right", letterSpacing: 2 }}>{team === 0 ? "AMBER HAND" : "SAPPHIRE FLAME"}</div>
        {Array.from({ length: 6 }).map((_, i) => {
          const at = montAt + (i * 2 + team) * 3;
          const on = f >= at;
          const h = HEROES[(i * 2 + team + 3) % HEROES.length];
          return (
            <div key={i} style={{ height: 118, display: "flex", flexDirection: team === 0 ? "row" : "row-reverse", alignItems: "center", gap: 14, background: on ? `linear-gradient(${team === 0 ? 90 : 270}deg, ${c}33, rgba(20,17,13,0.95))` : "rgba(20,17,13,0.85)", border: `2px solid ${on ? c : D.line}`, opacity: ease(f, orgAt + i * 2, 8), transform: `scale(${1 + punch(f, [at], 0.06, 8)})`, overflow: "hidden" }}>
              <div style={{ width: 87, height: 118, background: "#000", flexShrink: 0 }}>{on ? <Img src={V(`heroes/${h}.png`)} style={{ width: 87, height: 118, objectFit: "cover" }} /> : null}</div>
              <div style={{ fontFamily: RD, fontWeight: 700, fontSize: 24, letterSpacing: 4, color: on ? D.cream : D.dim }}>{on ? "PRONTO" : "VAGA ABERTA"}</div>
            </div>
          );
        })}
      </div>
    );
  };
  return (
    <AbsoluteFill style={{ background: D.bg, overflow: "hidden" }}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 80% 55% at 50% 45%, #2a2014cc 0%, rgba(0,0,0,0) 70%)" }} />
      <Cam f={f} rx={8} z={0.98 + f * 0.0008}>
        <Center top={210}>
          <Hud f={f} at={orgAt} size={26} c={D.cream} dot={D.green}>
            SALA DO CAMPEONATO
          </Hud>
        </Center>
        <div style={{ position: "absolute", left: 50, right: 50, top: 290, display: "flex", justifyContent: "space-between" }}>
          {col(0)}
          {col(1)}
        </div>
        {f >= jogAt ? (
          <Center top={660} style={{ zIndex: 20 }}>
            <div style={{ width: 150, height: 150, borderRadius: "50%", background: "#0b0a08", border: `5px solid ${GOLD}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: RV, fontSize: 70, color: GOLD, transform: `scale(${interpolate(f, [jogAt, jogAt + 5], [2, 1], clamp)})`, boxShadow: `0 0 50px ${GOLD}88` }}>VS</div>
          </Center>
        ) : null}
      </Cam>
      <Flash f={f} ts={[jogAt]} pk={0.2} c={GOLD} />
      <Vig o={0.55} />
      <Grain />
    </AbsoluteFill>
  );
};

// ========== 13) "e quero transmitir ele aqui na minha live" — live com o jogo rolando ==========
const CHAT = [
  ["rato_do_esgoto", "bora campeonato"],
  ["lash_main", "manda o link do discord"],
  ["paradoxbr", "meu time ta pronto"],
  ["ivy_da_vila", "vai brasil"],
];
export const C9Live: React.FC<{ life: number; liveAt?: number }> = ({ life, liveAt = 40 }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${1.08 + f * 0.0015})` }}>
        <Clip src={V("g_k4.mp4")} dur={life} ss={20} pos="50% 50%" />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.7) 72%)" }} />
      <div style={{ position: "absolute", left: 40, top: 200, display: "flex", alignItems: "center", gap: 16, background: "rgba(0,0,0,0.45)", borderRadius: 60, padding: "10px 24px 10px 10px", opacity: ease(f, 2, 8), zIndex: 20 }}>
        <Img src={BLIES} style={{ width: 84, height: 84, borderRadius: "50%", objectFit: "cover", border: "4px solid #fe2c55" }} />
        <div>
          <div style={{ fontFamily: "Arial, Helvetica, sans-serif", fontWeight: 800, fontSize: 34, color: "#fff" }}>blies</div>
          <div style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: 24, color: "#ddd" }}>Deadlock · campeonato</div>
        </div>
        <div style={{ marginLeft: 10, background: "#fe2c55", color: "#fff", fontFamily: "Arial, Helvetica, sans-serif", fontWeight: 800, fontSize: 26, padding: "6px 14px", borderRadius: 8, transform: `scale(${1 + punch(f, [liveAt], 0.25, 10)})` }}>LIVE</div>
      </div>
      <div style={{ position: "absolute", left: 40, top: 900, width: 700, display: "flex", flexDirection: "column", gap: 12, zIndex: 20 }}>
        {CHAT.map(([u, m], i) => {
          const at = 8 + i * 12;
          if (f < at) return null;
          return (
            <div key={u} style={{ display: "flex", gap: 12, alignItems: "baseline", opacity: ease(f, at, 6), transform: `translateY(${(1 - ease(f, at, 8)) * 30}px)`, fontFamily: "Arial, Helvetica, sans-serif", fontSize: 32, textShadow: "0 2px 6px #000" }}>
              <span style={{ color: "#ffd36b", fontWeight: 700 }}>{u}</span>
              <span style={{ color: "#fff" }}>{m}</span>
            </div>
          );
        })}
      </div>
      {Array.from({ length: 8 }).map((_, i) => {
        const at = 6 + i * 7;
        if (f < at) return null;
        const t = (f - at) / 40;
        return <div key={i} style={{ position: "absolute", left: 930 + Math.sin(t * 6 + i) * 30, top: 1250 - t * 600, fontSize: 60, color: ["#fe2c55", "#ff8fb1", "#ffd36b"][i % 3], opacity: Math.max(0, 1 - t), zIndex: 15, fontFamily: "Arial, Helvetica, sans-serif" }}>♥</div>;
      })}
      <Grain />
    </AbsoluteFill>
  );
};

// ========== 14) "procurando quem se considera bom... ou vários times... próximos vídeos" — mural de PROCURA-SE ==========
const Poster: React.FC<{ f: number; at: number; x: number; y: number; rot: number; clip: string; ss?: number; bomAt?: number; tag?: string; life: number }> = ({ f, at, x, y, rot, clip, ss = 0, bomAt, tag = "BOM DE DEADLOCK", life }) => {
  if (f < at) return null;
  const k = interpolate(f, [at, at + 6], [1.25, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  return (
    <div style={{ position: "absolute", left: x, top: y, width: 600, height: 840, transform: `rotate(${rot}deg) scale(${k})`, opacity: ease(f, at, 4), background: "linear-gradient(180deg, #ecdfbf, #d9c79e)", boxShadow: "0 30px 60px rgba(0,0,0,0.85)", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 28 }}>
      <div style={{ position: "absolute", top: 14, width: 26, height: 26, borderRadius: "50%", background: "radial-gradient(circle at 35% 35%, #ff8a7a, #9b1d12)", boxShadow: "0 4px 6px #0008" }} />
      <div style={{ fontFamily: RV, fontSize: 86, color: "#2a1d10", letterSpacing: 3, lineHeight: 1, marginTop: 20, whiteSpace: "nowrap" }}>PROCURA-SE</div>
      <div style={{ width: 520, height: 380, marginTop: 20, border: "6px solid #2a1d10", overflow: "hidden", position: "relative", background: "#000" }}>
        <Clip src={clip} from={at} dur={life - at} ss={ss} style={{ filter: "sepia(0.35) contrast(1.1)" }} />
      </div>
      <div style={{ marginTop: 22, fontFamily: RD, fontWeight: 700, fontSize: 28, letterSpacing: 5, color: "#4a3a22" }}>QUEM SE CONSIDERA</div>
      <div style={{ position: "relative", marginTop: 16, height: 110, display: "flex", alignItems: "center" }}>
        {bomAt !== undefined ? <Stamp f={f} at={bomAt} text={tag} c="#a3231a" size={56} rot={-5} bg="rgba(236,223,191,0.6)" /> : <div style={{ fontFamily: RV, fontSize: 56, color: "#a3231a" }}>{tag}</div>}
      </div>
    </div>
  );
};
export const C9Wanted: React.FC<{ life: number; bomAt?: number; variosAt?: number; proxAt?: number }> = ({ life, bomAt = 47, variosAt = 141, proxAt = 220 }) => {
  const f = useCurrentFrame();
  const back = ease(f, variosAt - 4, 18);
  const z = 1.08 - back * 0.4 + f * 0.0004;
  const bricks = `repeating-linear-gradient(180deg, #2a1712 0 64px, #120a08 64px 70px)`;
  return (
    <AbsoluteFill style={{ background: "#120a08", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${z})`, transformOrigin: "50% 42%" }}>
        <div style={{ position: "absolute", left: -600, top: -600, width: 2280, height: 3100, background: bricks }}>
          {Array.from({ length: 48 }).map((_, i) => (
            <div key={i} style={{ position: "absolute", left: ((i % 2) * 110 + 0) + 0, top: i * 70, width: 2280, height: 64, backgroundImage: "repeating-linear-gradient(90deg, transparent 0 214px, #120a08 214px 220px)", backgroundPosition: `${(i % 2) * 110}px 0` }} />
          ))}
        </div>
        <Poster f={f} at={0} x={240} y={270} rot={-2} clip={V("g_rat.mp4")} ss={60} bomAt={bomAt} life={life} />
        <Poster f={f} at={variosAt} x={-460} y={330} rot={4} clip={V("ns_league.mp4")} ss={30} tag="TIME 2" life={life} />
        <Poster f={f} at={variosAt + 8} x={940} y={300} rot={-5} clip={V("g_k4.mp4")} ss={60} tag="TIME 3" life={life} />
        {f >= proxAt ? (
          <>
            <svg width={2400} height={2400} style={{ position: "absolute", left: -600, top: -600, zIndex: 30 }}>
              {[
                [540 + 600, 1210 + 600, -160 + 600, 1260 + 600],
                [540 + 600, 1210 + 600, 1240 + 600, 1230 + 600],
              ].map(([a, b, c, d], i) => (
                <line key={i} x1={a} y1={b} x2={a + (c - a) * ease(f, proxAt + i * 4, 10)} y2={b + (d - b) * ease(f, proxAt + i * 4, 10)} stroke="#c0271b" strokeWidth={6} />
              ))}
            </svg>
            <div style={{ position: "absolute", left: 300, top: 1150, width: 480, padding: "22px 26px", background: "#f3eedc", transform: `rotate(3deg) scale(${interpolate(f, [proxAt, proxAt + 6], [1.3, 1], clamp)})`, boxShadow: "0 20px 40px #000", zIndex: 31, fontFamily: RV, fontSize: 46, color: "#2a1d10", textAlign: "center", lineHeight: 1.05 }}>
              MAIS DETALHES
              <br />
              NOS PRÓXIMOS VÍDEOS
            </div>
          </>
        ) : null}
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 70% 50% at 50% 40%, rgba(255,200,120,0.14), rgba(0,0,0,0.55) 85%)", pointerEvents: "none" }} />
      <Vig o={0.6} />
      <Grain />
    </AbsoluteFill>
  );
};

// ========== 15) "se você quer treinar, montar um time e evoluir no jogo de verdade, faz o seguinte" — barra de habilidades ==========
const SKILLS: [string, string][] = [
  ["TREINAR", "1"],
  ["MONTAR TIME", "2"],
  ["EVOLUIR", "3"],
];
export const C9Path: React.FC<{ life: number; treinarAt?: number; montarAt?: number; evoluirAt?: number; seguinteAt?: number }> = ({ life, treinarAt = 40, montarAt = 58, evoluirAt = 100, seguinteAt = 152 }) => {
  const f = useCurrentFrame();
  const ats = [treinarAt, montarAt, evoluirAt];
  const cur = f >= evoluirAt ? 2 : f >= montarAt ? 1 : f >= treinarAt ? 0 : -1;
  const out = ease(f, seguinteAt, 14);
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${1.1 + f * 0.001})`, filter: `brightness(${1 - out * 0.6})` }}>
        {cur <= 0 ? <Clip src={PC("cel_dag.mp4")} dur={montarAt + 2} ss={60} pos="45% 50%" style={{ filter: cur < 0 ? "brightness(0.35)" : undefined }} /> : null}
        {cur === 1 ? <Clip src={V("ns_league.mp4")} from={montarAt} dur={evoluirAt - montarAt + 2} ss={150} pos="50% 50%" /> : null}
        {cur === 2 ? <Clip src={FM("wk/c_shop.mp4")} from={evoluirAt} dur={life - evoluirAt} ss={0} pos="50% 50%" /> : null}
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 25%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.85) 66%)" }} />
      {/* barra de habilidades (como a do jogo: tecla, ícone, bolinhas de melhoria) */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 1000, display: "flex", justifyContent: "center", gap: 34, zIndex: 20, transform: `translateY(${out * 60}px)` }}>
        {SKILLS.map(([name, key], i) => {
          const on = f >= ats[i];
          const act = cur === i;
          return (
            <div key={name} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, opacity: 0.45 + 0.55 * ease(f, ats[i], 6) }}>
              <div style={{ width: 200, height: 200, borderRadius: "50%", border: `5px solid ${on ? GOLD : D.line}`, background: on ? "radial-gradient(circle, #3b2c14, #0e0b07)" : "rgba(14,11,7,0.9)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: act ? `0 0 50px ${GOLD}aa` : "0 10px 30px #000", transform: `scale(${1 + punch(f, [ats[i]], 0.14, 10)})`, position: "relative" }}>
                <div style={{ fontFamily: RV, fontSize: 96, color: on ? GOLD : D.dim }}>{key}</div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {[0, 1, 2].map((j) => (
                  <div key={j} style={{ width: 22, height: 22, transform: "rotate(45deg)", background: f >= ats[i] + 3 + j * 3 ? D.soul : "#222", border: `2px solid ${D.soul}66`, boxShadow: f >= ats[i] + 3 + j * 3 ? `0 0 10px ${D.soul}` : undefined }} />
                ))}
              </div>
              <div style={{ fontFamily: RD, fontWeight: 700, fontSize: 26, letterSpacing: 4, color: on ? D.cream : D.dim, whiteSpace: "nowrap" }}>{name}</div>
            </div>
          );
        })}
      </div>
      {f >= seguinteAt ? (
        <Center top={640} style={{ zIndex: 30 }}>
          <Hud f={f} at={seguinteAt + 2} size={34} c={GOLD}>
            FAZ O SEGUINTE
          </Hud>
        </Center>
      ) : null}
      <Flash f={f} ts={[montarAt, evoluirAt]} pk={0.18} />
      <Vig o={0.5} />
      <Grain />
    </AbsoluteFill>
  );
};

// ========== 16) "manda pro teu amigo que se acha pro player... essa pode ser a chance dele" — conversa no celular ==========
export const C9Amigo: React.FC<{ life: number; mandaAt?: number; proAt?: number; chanceAt?: number }> = ({ life, mandaAt = 8, proAt = 80, chanceAt = 142 }) => {
  const f = useCurrentFrame();
  const bubble = (at: number, mine: boolean, children: React.ReactNode, key: string) =>
    f < at ? null : (
      <div key={key} style={{ alignSelf: mine ? "flex-end" : "flex-start", maxWidth: 560, opacity: ease(f, at, 6), transform: `translateY(${(1 - ease(f, at, 8)) * 40}px) scale(${interpolate(f, [at, at + 6], [0.9, 1], clamp)})`, transformOrigin: mine ? "100% 100%" : "0 100%" }}>
        {children}
      </div>
    );
  return (
    <AbsoluteFill style={{ background: "#0b0a08", overflow: "hidden" }}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 80% 55% at 50% 45%, #1f2a3acc 0%, rgba(0,0,0,0) 70%)" }} />
      <Center top={200}>
        <div style={{ width: 760, height: 1080, borderRadius: 60, background: "#0f1115", border: "10px solid #1c1f26", boxShadow: "0 40px 100px #000", overflow: "hidden", display: "flex", flexDirection: "column", transform: `translateY(${(1 - ease(f, 0, 12)) * 200}px)` }}>
          <div style={{ height: 130, display: "flex", alignItems: "center", gap: 18, padding: "0 30px", borderBottom: "1px solid #2a2e36", background: "#15181e" }}>
            <div style={{ width: 76, height: 76, borderRadius: "50%", background: "linear-gradient(135deg, #5b8ff0, #86d57c)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Arial, Helvetica, sans-serif", fontWeight: 800, fontSize: 38, color: "#0f1115" }}>A</div>
            <div>
              <div style={{ fontFamily: "Arial, Helvetica, sans-serif", fontWeight: 700, fontSize: 34, color: "#fff" }}>aquele amigo</div>
              <div style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: 22, color: "#7f8a99" }}>joga deadlock com você</div>
            </div>
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 18, padding: "24px 26px 40px" }}>
            {bubble(
              mandaAt,
              true,
              <div style={{ width: 380, borderRadius: 28, overflow: "hidden", border: "3px solid #2f6fe0", background: "#000" }}>
                <div style={{ height: 300, position: "relative" }}>
                  <Img src={V("c9_cloud.png")} style={{ position: "absolute", left: 110, top: 70, width: 160, opacity: 0.9 }} />
                  <div style={{ position: "absolute", left: 0, right: 0, bottom: 20, textAlign: "center", fontFamily: RV, fontSize: 34, color: D.cream }}>CLOUD9 NO DEADLOCK</div>
                </div>
                <div style={{ padding: "12px 18px", background: "#2f6fe0", color: "#fff", fontFamily: "Arial, Helvetica, sans-serif", fontSize: 26 }}>olha isso aqui</div>
              </div>,
              "v",
            )}
            {bubble(proAt, false, <div style={{ padding: "18px 26px", borderRadius: 28, background: "#262a33", color: "#fff", fontFamily: "Arial, Helvetica, sans-serif", fontSize: 34 }}>eu sou pro player kkkk</div>, "p")}
            {bubble(
              chanceAt,
              true,
              <div style={{ width: 520, padding: "22px 26px", borderRadius: 20, background: "linear-gradient(135deg, #f3d48a, #b98a3a)", boxShadow: `0 0 40px ${GOLD}88`, border: "3px solid #fff3", color: "#1a1408" }}>
                <div style={{ fontFamily: RD, fontWeight: 700, fontSize: 22, letterSpacing: 5 }}>CONVITE</div>
                <div style={{ fontFamily: RV, fontSize: 48, lineHeight: 1.05 }}>CAMPEONATO DE DEADLOCK BR</div>
              </div>,
              "c",
            )}
          </div>
        </div>
      </Center>
      <Vig o={0.5} />
      <Grain />
    </AbsoluteFill>
  );
};

// ========== 17) "perdeu a oportunidade do CS, do LoL e do Valorant, e tá amassando no Deadlock" ==========
export const C9Perdeu: React.FC<{ life: number; csAt?: number; lolAt?: number; valAt?: number; amAt?: number }> = ({ life, csAt = 60, lolAt = 109, valAt = 128, amAt = 166 }) => {
  const f = useCurrentFrame();
  const seg = (from: number, to: number, src: string, at: number, logo: string, white = false) =>
    f >= from && f < to ? (
      <AbsoluteFill key={src}>
        <AbsoluteFill style={{ transform: `scale(${1.15 + (f - from) * 0.003})`, filter: f >= at ? `grayscale(${ease(f, at, 6)}) brightness(${1 - 0.35 * ease(f, at, 6)})` : undefined }}>
          <Clip src={src} from={from} dur={to - from} />
        </AbsoluteFill>
        <div style={{ position: "absolute", left: 50, top: 220, zIndex: 20 }}>
          <Img src={logo} style={{ height: 70, filter: `${white ? "brightness(0) invert(1) " : ""}drop-shadow(0 4px 10px #000)` }} />
        </div>
        <Center top={760} style={{ zIndex: 30 }}>
          <Stamp f={f} at={at} text="PERDEU" c={D.red} size={120} rot={-8} />
        </Center>
      </AbsoluteFill>
    ) : null;
  const sh = shake(f, amAt, 22, 12, "am");
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      {seg(0, lolAt - 2, V("cs_play.mp4"), csAt, MG("cs_logo.png"), true)}
      {seg(lolAt - 2, valAt - 2, V("lol_play.mp4"), lolAt, MG("lol_logo.png"))}
      {seg(valAt - 2, amAt, V("val_play.mp4"), valAt, V("val_logo.png"))}
      {f >= amAt ? (
        <AbsoluteFill style={{ transform: `translate(${sh.x}px, ${sh.y}px) scale(${1.2 + punch(f, [amAt], 0.12, 10)})` }}>
          <Clip src={V("g_rat.mp4")} from={amAt} dur={life - amAt} ss={150} />
        </AbsoluteFill>
      ) : null}
      {f >= amAt ? (
        <div style={{ position: "absolute", left: 50, top: 220, zIndex: 20 }}>
          <Img src={MG("dl_logo.png")} style={{ height: 70, opacity: ease(f, amAt, 6), filter: "drop-shadow(0 4px 10px #000)" }} />
        </div>
      ) : null}
      <Flash f={f} ts={[lolAt - 2, valAt - 2, amAt]} pk={0.3} />
      <Vig o={0.5} />
      <Grain />
    </AbsoluteFill>
  );
};

// ========== 18) "pode ser a oportunidade dele de virar o próximo pro player do Deadlock" — a line + a vaga dele ==========
const LINE = ["SAIAH", "JONJON", "AVERAGE", "LEAGUE", "LOMEIN", "ZENO"];
export const C9Next: React.FC<{ life: number; opAt?: number; proxAt?: number; fodaAt?: number }> = ({ life, opAt = 28, proxAt = 89, fodaAt = 127 }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <Clip src={V("ns_replay.mp4")} dur={life} ss={0} style={{ filter: "blur(14px) brightness(0.35)", transform: "scale(1.15)" }} />
      <Center top={220}>
        <Hud f={f} at={2} size={24} c={C9BLUE}>
          QUEM JÁ VIROU PRO
        </Hud>
      </Center>
      <div style={{ position: "absolute", left: 60, top: 290, width: 960, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, opacity: 1 - 0.45 * ease(f, proxAt, 10) }}>
        {LINE.map((n, i) => {
          const at = 4 + i * 3;
          return (
            <div key={n} style={{ height: 96, display: "flex", alignItems: "center", gap: 12, padding: "0 16px", background: "linear-gradient(90deg, rgba(14,48,80,0.96), rgba(6,18,31,0.96))", borderLeft: `5px solid ${C9BLUE}`, opacity: ease(f, at, 8), transform: `translateY(${(1 - ease(f, at, 8)) * 30}px)` }}>
              <Img src={V("c9_cloud.png")} style={{ width: 40 }} />
              <div style={{ fontFamily: RV, fontSize: 38, color: "#fff", whiteSpace: "nowrap" }}>{n}</div>
            </div>
          );
        })}
      </div>
      {f >= opAt ? (
        <Center top={560} style={{ zIndex: 10 }}>
          <div style={{ width: 640, height: 560, border: `5px ${f >= proxAt ? "solid" : "dashed"} ${f >= proxAt ? GOLD : D.dim}`, background: f >= proxAt ? "radial-gradient(circle at 50% 40%, #3b2c14, #0e0b07)" : "rgba(14,11,7,0.7)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18, opacity: ease(f, opAt, 10), transform: `scale(${1 + punch(f, [proxAt, fodaAt], 0.06, 10)})`, boxShadow: f >= proxAt ? `0 0 80px ${GOLD}88` : undefined }}>
            <div style={{ fontFamily: RV, fontSize: 200, color: f >= proxAt ? GOLD : D.dim, lineHeight: 1 }}>?</div>
            <div style={{ fontFamily: RV, fontSize: 66, color: D.cream, letterSpacing: 3 }}>SEU AMIGO</div>
            <div style={{ fontFamily: RD, fontWeight: 700, fontSize: 24, letterSpacing: 6, color: f >= proxAt ? GOLD : D.dim }}>{f >= proxAt ? "PRÓXIMO PRO PLAYER" : "VAGA ABERTA"}</div>
          </div>
        </Center>
      ) : null}
      <Flash f={f} ts={[proxAt]} pk={0.25} c={GOLD} />
      <Vig o={0.5} />
      <Grain />
    </AbsoluteFill>
  );
};

// ========== 19) "fazer esse cenário acontecer na raça, no Brasil. Eu vou ser o pioneiro e bater nessa tecla muito" ==========
export const C9Pioneer2: React.FC<{ life: number; racaAt?: number; brAt?: number; pioAt?: number; batAt?: number; teclaAt?: number; muitoAt?: number }> = ({ life, racaAt = 90, brAt = 123, pioAt = 160, batAt = 195, teclaAt = 210, muitoAt = 224 }) => {
  const f = useCurrentFrame();
  const fl = interpolate(f, [pioAt, pioAt + 8], [-500, 0], { ...clamp, easing: Easing.in(Easing.cubic) });
  const presses = [batAt, teclaAt, muitoAt];
  const down = presses.some((p) => f >= p && f < p + 5);
  const sh = shake(f, muitoAt, 14, 10, "kk");
  const keyIn = ease(f, batAt - 12, 10);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <AbsoluteFill style={{ transform: `translate(${sh.x}px, ${sh.y}px)` }}>
        <BrMap
          f={f}
          drawAt={-40}
          amp={(k) => 40 + 30 * Math.abs(Math.sin(k / 4)) + 50 * punch(k, presses, 1, 10)}
          glow={0.4 + 0.6 * ease(f, brAt, 10)}
          inside={
            f >= racaAt - 2 ? (
              <AbsoluteFill style={{ opacity: ease(f, racaAt - 2, 6) }}>
                <Clip src={V("ns_fight.mp4")} from={racaAt - 2} dur={life} ss={200} />
              </AbsoluteFill>
            ) : null
          }
        >
          {/* bandeira fincada no mapa */}
          {f >= pioAt ? (
            <div style={{ position: "absolute", left: 600, top: 470 + fl, width: 220, height: 330, zIndex: 25 }}>
              <div style={{ position: "absolute", left: 0, top: 0, width: 10, height: 330, background: `linear-gradient(90deg, #f3d48a, #8a6a30)` }} />
              <div style={{ position: "absolute", left: 10, top: 6, width: 200, height: 120, background: `linear-gradient(180deg, ${D.green}, #3b8a3a)`, clipPath: "polygon(0 0, 100% 0, 86% 50%, 100% 100%, 0 100%)", transform: `skewY(${Math.sin(f / 5) * 3}deg)`, display: "flex", alignItems: "center", paddingLeft: 26, fontFamily: RV, fontSize: 66, color: "#ffd84a", textShadow: "0 3px 8px #0008" }}>BR</div>
              <div style={{ position: "absolute", left: -40, top: 318, width: 90, height: 24, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(0,0,0,0.7), rgba(0,0,0,0))" }} />
            </div>
          ) : null}
          {f >= pioAt + 4 ? (
            <div style={{ position: "absolute", left: 60, top: 220, zIndex: 20 }}>
              <Hud f={f} at={pioAt + 4} size={28} c={GOLD}>
                PIONEIRO NO BRASIL
              </Hud>
            </div>
          ) : null}
        </BrMap>
      </AbsoluteFill>
      {/* a tecla */}
      {f >= batAt - 12 ? (
        <Center top={1080} style={{ zIndex: 40, opacity: keyIn, transform: `translateY(${(1 - keyIn) * 120}px)` }}>
          <div style={{ width: 600, height: 170, background: "linear-gradient(180deg, #2a241a, #15110b)", border: `4px solid ${GOLD}`, borderRadius: 22, boxShadow: down ? `0 4px 0 #6b5532, 0 0 50px ${GOLD}99` : "0 18px 0 #6b5532, 0 30px 50px #000", transform: `translateY(${down ? 14 : 0}px)`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: RV, fontSize: 72, color: down ? GOLD : D.cream, whiteSpace: "nowrap", letterSpacing: 4 }}>DEADLOCK BR</div>
        </Center>
      ) : null}
      <Flash f={f} ts={[racaAt, pioAt + 8]} pk={0.22} c={GOLD} />
      <Vig o={0.5} />
      <Grain />
    </AbsoluteFill>
  );
};
