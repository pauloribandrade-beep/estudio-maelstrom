import React from "react";
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Building2, Check, Stethoscope, User } from "lucide-react";
import { FONT } from "./overlays";
import { ZALE } from "./theme";
import { SEAM, Snd, SndSpan, STAGE } from "./palco";

import { TX } from "./textos";
// CENAS DE METÁFORA (pedido do usuário em 2026-09-28: os cards da biblioteca ficaram "genéricos, a mesma coisa
// de todos os vídeos"). Cada cena é um OBJETO reconhecível fazendo uma ação física: cartas que viram, cardápio
// passando de mão, ratoeira com etiqueta de preço, notinha imprimindo, mapa com caminho, seringa no foco, enquete.
// Tempos em frames relativos à Sequence (o edit.json usa segundos; o registry converte chaves `at` e `...At`).
// Regras: flutua só para cima e para baixo (translate3d no container, texto nunca treme sozinho), som só em ação.

export const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
export const CX = 540;
export const CY = (STAGE.y0 + STAGE.y1) / 2;
export const SERIF = "Georgia, 'Times New Roman', serif";
export const MONO = "ui-monospace, 'Cascadia Mono', Consolas, 'Courier New', monospace";
export const PAPER = "#FBF7EE";
export const sp = (f: number, fps: number, at = 0, k = { damping: 15, stiffness: 170, mass: 0.8 }) => (f < at ? 0 : spring({ frame: f - at, fps, config: k }));
export const lock = (p: number) => (p > 0.997 ? 1 : p);
export const float = (f: number, amp = 6, per = 24) => Math.sin(f / per) * amp;

export const Stage: React.FC<{ life: number; children: (f: number, fps: number) => React.ReactNode }> = ({ life, children }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const out = interpolate(f, [life - 7, life], [1, 0], { ...clamp, easing: Easing.in(Easing.cubic) });
  return <AbsoluteFill style={{ height: SEAM, opacity: out, fontFamily: FONT, overflow: "hidden" }}>{children(f, fps)}</AbsoluteFill>;
};

// camada que flutua inteira (o texto dentro anda rígido com ela)
export const Float: React.FC<{ f: number; amp?: number; per?: number; style?: React.CSSProperties; children: React.ReactNode }> = ({ f, amp = 6, per = 24, style, children }) => (
  <div style={{ position: "absolute", inset: 0, transform: `translate3d(0, ${float(f, amp, per).toFixed(3)}px, 0)`, willChange: "transform", backfaceVisibility: "hidden", ...style }}>{children}</div>
);

// ============ 1. cartas de erro ============
// Três cartas caem viradas e desviram mostrando 1, 2, 3 com um X vermelho. `chainAt`: uma corrente liga as
// três ("quase sempre vêm juntos"). `focus` (0, 1, 2): as outras ficam apagadas e só aquela vira e vem pra frente.
export const ErrorCards: React.FC<{ life: number; flipAt?: number; chainAt?: number; focus?: number; title?: string; label?: string; labelAt?: number }> = ({
  life,
  flipAt = 10,
  chainAt,
  focus,
  title,
  label,
  labelAt = 14,
}) => (
  <Stage life={life}>
    {(f, fps) => {
      const CW = 250;
      const CH = 350;
      const GAP = 44;
      const x0 = CX - (3 * CW + 2 * GAP) / 2;
      const top = CY - CH / 2 + (title ? 40 : 0);
      const chain = chainAt !== undefined ? sp(f, fps, chainAt, { damping: 13, stiffness: 160, mass: 0.7 }) : 0;
      const pull = chain * 22; // as cartas se aproximam quando a corrente prende
      const titleIn = title ? sp(f, fps, 2) : 0;
      return (
        <Float f={f}>
          {title ? (
            <div style={{ position: "absolute", left: 0, right: 0, top: top - 150, textAlign: "center", opacity: titleIn, transform: `translateY(${(1 - titleIn) * 20}px)` }}>
              <div style={{ color: "#fff", fontSize: 96, fontWeight: 900, letterSpacing: -3 }}>{title}</div>
            </div>
          ) : null}
          <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: SEAM, perspective: 1400 }}>
            {[0, 1, 2].map((i) => {
              const focused = focus === i;
              const dim = focus !== undefined && !focused;
              const drop = sp(f, fps, i * 3, { damping: 14, stiffness: 150, mass: 0.8 });
              const fa = focus !== undefined ? (focused ? flipAt : -999) : flipAt + i * 5;
              const flip = fa < -100 ? 1 : sp(f, fps, fa, { damping: 13, stiffness: 120, mass: 0.9 });
              const rot = 180 * (1 - lock(flip));
              const xDraw = interpolate(f, [fa + 10, fa + 22], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
              const fwd = focused ? sp(f, fps, fa + 6) : 0;
              const dx = (i - 1) * -pull;
              const scale = focused ? 1 + 0.22 * fwd : dim ? 0.86 : 1;
              return (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: x0 + i * (CW + GAP) + dx,
                    top,
                    width: CW,
                    height: CH,
                    transform: `translate3d(0, ${((1 - drop) * -240 - fwd * 20).toFixed(2)}px, 0) scale(${scale.toFixed(4)})`,
                    opacity: Math.min(1, drop * 2) * (dim ? 0.3 : 1),
                    zIndex: focused ? 2 : 1,
                    transformStyle: "preserve-3d",
                  }}
                >
                  <div style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d", transform: `rotateY(${rot.toFixed(2)}deg)` }}>
                    {/* frente */}
                    <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", borderRadius: 22, background: ZALE.paper, boxShadow: "0 30px 70px rgba(0,0,0,0.55)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                      <div style={{ position: "absolute", left: 20, top: 16, color: ZALE.red, fontSize: 30, fontWeight: 900 }}>{i + 1}</div>
                      <div style={{ position: "absolute", right: 20, bottom: 16, color: ZALE.red, fontSize: 30, fontWeight: 900, transform: "rotate(180deg)" }}>{i + 1}</div>
                      <div style={{ color: ZALE.ink, fontSize: 170, fontWeight: 900, letterSpacing: -6, lineHeight: 1 }}>{i + 1}</div>
                      <div style={{ color: "rgba(20,20,20,0.55)", fontSize: 30, fontWeight: 800, letterSpacing: 6, marginTop: 6 }}>ERRO</div>
                      <div style={{ position: "absolute", right: -18, top: -18, width: 76, height: 76, borderRadius: 38, background: ZALE.red, boxShadow: "0 8px 20px rgba(0,0,0,0.45)", transform: `scale(${xDraw > 0 ? 0.6 + 0.4 * Math.min(1, xDraw * 1.6) : 0})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <svg width={40} height={40}>
                          <line x1={8} y1={8} x2={32} y2={32} stroke="#fff" strokeWidth={7} strokeLinecap="round" />
                          <line x1={32} y1={8} x2={8} y2={32} stroke="#fff" strokeWidth={7} strokeLinecap="round" />
                        </svg>
                      </div>
                    </div>
                    {/* verso */}
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        backfaceVisibility: "hidden",
                        transform: "rotateY(180deg)",
                        borderRadius: 22,
                        background: `repeating-linear-gradient(45deg, rgba(255,255,255,0.06) 0 10px, rgba(0,0,0,0) 10px 22px), linear-gradient(160deg, #3a0f08, ${ZALE.red})`,
                        border: "8px solid #f3eee6",
                        boxShadow: "0 30px 70px rgba(0,0,0,0.55)",
                      }}
                    >
                      <div style={{ position: "absolute", left: "50%", top: "50%", width: 70, height: 70, marginLeft: -35, marginTop: -35, borderRadius: 35, border: "5px solid rgba(255,255,255,0.8)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 900, fontSize: 34 }}>
                        ?
                      </div>
                    </div>
                  </div>
                  {i < 2 && chainAt !== undefined ? (
                    <svg width={GAP + 120} height={90} style={{ position: "absolute", left: CW - 60, top: CH / 2 - 45, overflow: "visible", zIndex: 3 }}>
                      {[0, 1, 2, 3].map((k) => {
                        const on = interpolate(chain, [k * 0.15, k * 0.15 + 0.45], [0, 1], clamp);
                        const span = GAP + 120 - pull;
                        const cx = 22 + (k * (span - 44)) / 3;
                        const flat = k % 2 === 1;
                        return (
                          <g key={k} opacity={on} transform={`translate(${cx} 45) scale(${0.3 + 0.7 * on})`}>
                            <ellipse cx={0} cy={0} rx={flat ? 30 : 26} ry={flat ? 11 : 20} fill="none" stroke="#5c5c5c" strokeWidth={flat ? 12 : 13} />
                            <ellipse cx={0} cy={0} rx={flat ? 30 : 26} ry={flat ? 11 : 20} fill="none" stroke="#e8e8e8" strokeWidth={flat ? 7 : 8} />
                          </g>
                        );
                      })}
                    </svg>
                  ) : null}
                  {focus === undefined ? <Snd at={fa} name="tick" k="card-flip" /> : null}
                  {focused ? <Snd at={fa + 10} name="error" k="card-x" /> : null}
                </div>
              );
            })}
          </div>
          {label && focus !== undefined ? (
            (() => {
              const t = sp(f, fps, labelAt);
              return (
                <div style={{ position: "absolute", left: 0, right: 0, top: top + CH + 70, textAlign: "center", opacity: t, transform: `translateY(${(1 - t) * 16}px)` }}>
                  <span style={{ background: ZALE.red, color: "#fff", fontSize: 44, fontWeight: 800, padding: "10px 26px", borderRadius: 14 }}>{label}</span>
                </div>
              );
            })()
          ) : null}
          {chainAt !== undefined ? <Snd at={chainAt} name="click" k="chain" /> : null}
        </Float>
      );
    }}
  </Stage>
);

export const Avatar: React.FC<{ x: number; y: number; icon: "doc" | "pac"; label: string; on: number; talk?: number }> = ({ x, y, icon, label, on, talk = 0 }) => {
  const I = icon === "doc" ? Stethoscope : User;
  return (
    <div style={{ position: "absolute", left: x - 60, top: y - 60, width: 120, textAlign: "center", opacity: on, transform: `scale(${(0.7 + 0.3 * lock(on)) * (1 + 0.05 * talk)})` }}>
      <div style={{ width: 120, height: 120, borderRadius: 60, background: icon === "doc" ? "#fff" : "#2a2a2a", border: `4px solid ${icon === "doc" ? ZALE.red : "rgba(255,255,255,0.35)"}`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 16px 40px rgba(0,0,0,0.5)" }}>
        <I size={60} color={icon === "doc" ? ZALE.red : "#fff"} strokeWidth={2.2} />
      </div>
      <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 30, fontWeight: 700, marginTop: 10 }}>{label}</div>
    </div>
  );
};

// ============ 3. cardápio ============
// mode "hand": o cardápio aparece do lado da médica e em `giveAt` passa para o lado da paciente (entregou o
// cardápio na mão dela); `pickAt`: ela marca um item. mode "blur": tudo embaça em `blurAt`, só a linha
// `keep` fica nítida e com o preço em vermelho (a única coisa que ela entendeu).
export const MenuCard: React.FC<{
  life: number;
  items: { name: string; price?: string; at?: number }[];
  title?: string;
  mode?: "hand" | "blur";
  giveAt?: number;
  pickAt?: number;
  pick?: number;
  blurAt?: number;
  keep?: number;
}> = ({ life, items, title = "Cardápio", mode = "hand", giveAt, pickAt, pick = 1, blurAt, keep = 0 }) => (
  <Stage life={life}>
    {(f, fps) => {
      const on = sp(f, fps, 0, { damping: 15, stiffness: 140, mass: 0.9 });
      const give = giveAt !== undefined ? sp(f, fps, giveAt, { damping: 16, stiffness: 110, mass: 1 }) : 0;
      const blur = blurAt !== undefined ? interpolate(f, [blurAt, blurAt + 14], [0, 1], { ...clamp, easing: Easing.out(Easing.quad) }) : 0;
      const picked = pickAt !== undefined ? interpolate(f, [pickAt, pickAt + 12], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) }) : 0;
      const W = mode === "hand" ? 520 : 600;
      const cx = mode === "hand" ? interpolate(give, [0, 1], [360, 740]) : CX;
      const rot = mode === "hand" ? interpolate(give, [0, 1], [-5, 4]) : -2;
      const top = mode === "hand" ? 190 : 200;
      const RX = W - 120;
      return (
        <Float f={f}>
          {mode === "hand" ? (
            <>
              <Avatar x={170} y={800} icon="doc" label="você" on={on} />
              <Avatar x={910} y={800} icon="pac" label={TX.cliente} on={on} />
            </>
          ) : null}
          <div
            style={{
              position: "absolute",
              left: cx - W / 2,
              top,
              width: W,
              background: PAPER,
              borderRadius: 10,
              padding: "34px 40px 30px",
              boxShadow: "0 36px 90px rgba(0,0,0,0.65)",
              transform: `translate3d(0, ${(1 - on) * 80}px, 0) rotate(${rot.toFixed(3)}deg) scale(${0.9 + 0.1 * lock(on)})`,
              opacity: Math.min(1, on * 2),
              fontFamily: SERIF,
              color: "#2b2118",
            }}
          >
            <div style={{ position: "absolute", inset: 12, border: "2px solid rgba(80,50,20,0.35)", borderRadius: 6, pointerEvents: "none" }} />
            <div style={{ textAlign: "center", fontSize: 64, fontStyle: "italic", letterSpacing: 1, filter: `blur(${(blur * 5).toFixed(2)}px)`, opacity: 1 - blur * 0.5 }}>{title}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "6px 40px 20px", opacity: 0.55, filter: `blur(${(blur * 5).toFixed(2)}px)` }}>
              <div style={{ flex: 1, height: 2, background: "#6b4a2a" }} />
              <div style={{ fontSize: 22 }}>✦</div>
              <div style={{ flex: 1, height: 2, background: "#6b4a2a" }} />
            </div>
            {items.map((it, k) => {
              const a = it.at ?? 6 + k * 4;
              const t = sp(f, fps, a);
              const isKeep = mode === "blur" && k === keep;
              const b = mode === "blur" && !isKeep ? blur : 0;
              const hl = (mode === "hand" && k === pick ? picked : 0) || (isKeep ? blur : 0);
              return (
                <div
                  key={k}
                  style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "baseline",
                    gap: 10,
                    fontSize: 38,
                    padding: "10px 6px",
                    opacity: t * (1 - b * 0.45),
                    transform: `translateX(${(1 - t) * -20}px) scale(${1 + (isKeep ? 0.08 * blur : 0)})`,
                    transformOrigin: "50% 50%",
                    filter: `blur(${(b * 6).toFixed(2)}px)`,
                  }}
                >
                  <span>{it.name}</span>
                  <span style={{ flex: 1, borderBottom: "3px dotted rgba(60,40,20,0.45)", transform: "translateY(-8px)" }} />
                  <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 34, color: isKeep ? ZALE.red : "#2b2118" }}>{it.price ?? "R$ X"}</span>
                  {hl > 0 ? (
                    <svg width={RX + 60} height={80} style={{ position: "absolute", left: -30, top: -10, overflow: "visible" }}>
                      <ellipse
                        cx={(RX + 60) / 2}
                        cy={38}
                        rx={(RX + 60) / 2 - 4}
                        ry={34}
                        fill="none"
                        stroke={ZALE.red}
                        strokeWidth={6}
                        strokeLinecap="round"
                        strokeDasharray={1400}
                        strokeDashoffset={1400 * (1 - hl)}
                        transform={`rotate(-1.5 ${(RX + 60) / 2} 38)`}
                      />
                    </svg>
                  ) : null}
                  <Snd at={a} name="tick" file="tick.wav" vol={0.2} />
                </div>
              );
            })}
          </div>
          {giveAt !== undefined ? <Snd at={giveAt} name="switch" k="menu-give" /> : null}
          {pickAt !== undefined ? <SndSpan at={pickAt} dur={12} name="write" vol={0.2} /> : null}
          {blurAt !== undefined ? <Snd at={blurAt} name="glass" k="menu-blur" /> : null}
        </Float>
      );
    }}
  </Stage>
);

// ============ 4. ratoeira com a etiqueta de preço ============
export const PriceTag: React.FC<{ text: string; w?: number; color?: string; fg?: string }> = ({ text, w = 200, color = ZALE.red, fg = "#fff" }) => (
  <div style={{ position: "relative", width: w, height: w * 0.55 }}>
    <svg width={w} height={w * 0.55} viewBox="0 0 200 110" style={{ position: "absolute", inset: 0, filter: "drop-shadow(0 10px 18px rgba(0,0,0,0.5))" }}>
      <path d="M40,5 L190,5 Q195,5 195,10 L195,100 Q195,105 190,105 L40,105 L5,55 Z" fill={color} />
      <circle cx={34} cy={55} r={8} fill="#111" />
    </svg>
    <div style={{ position: "absolute", left: w * 0.24, right: 0, top: 0, bottom: 0, display: "flex", alignItems: "center", justifyContent: "center", color: fg, fontWeight: 900, fontSize: w * 0.2, letterSpacing: -1 }}>{text}</div>
  </div>
);

// `baitAt`: a etiqueta cai na ratoeira; `snapAt`: a trava fecha em cima dela (tremida + impacto).
// `snapLabel`: rótulo que bate embaixo quando fecha.
export const PriceTrap: React.FC<{ life: number; price?: string; caption?: string; captionAt?: number; baitAt?: number; snapAt?: number; snapLabel?: string }> = ({
  life,
  price = "R$ X",
  caption,
  captionAt = 6,
  baitAt = 20,
  snapAt = 60,
  snapLabel,
}) => (
  <Stage life={life}>
    {(f, fps) => {
      const on = sp(f, fps);
      const bait = sp(f, fps, baitAt, { damping: 11, stiffness: 180, mass: 0.8 });
      const s = interpolate(f, [snapAt, snapAt + 5], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
      const after = Math.max(0, f - snapAt - 5);
      const shake = f >= snapAt + 5 ? Math.exp(-after / 5) * Math.sin(after * 2.4) * 12 : 0;
      const n = caption ? Math.round(interpolate(f, [captionAt, captionAt + caption.length * 1.3], [0, caption.length], clamp)) : 0;
      const lab = snapLabel ? sp(f, fps, snapAt + 6, { damping: 10, stiffness: 220, mass: 0.6 }) : 0;
      // base de madeira em 3/4 (tampo + frente), dobradiça com mola, trava de arame, prato do gatilho à direita
      const BW = 820;
      const BX = CX - BW / 2;
      const BY = 690; // topo da frente da base
      const D = 34; // profundidade do tampo
      const top = BY - D / 2; // onde as peças apoiam
      const hx = CX - 90;
      const hy = top;
      const L = 360;
      const TW = 230;
      const TH = TW * 0.55;
      const squash = s >= 1 ? 0.72 + 0.1 * Math.exp(-after / 4) : 1;
      const tagTop = top - 6 - TH * squash;
      const closeAng = (Math.asin(Math.min(0.99, (hy - tagTop + 4) / L)) * 180) / Math.PI;
      const ang = 180 - (180 - closeAng) * s;
      const rad = (ang * Math.PI) / 180;
      const tipX = hx + Math.cos(rad) * L;
      const tipY = hy - Math.sin(rad) * L;
      return (
        <Float f={f}>
          {caption ? (
            <div style={{ position: "absolute", left: 0, right: 0, top: 250, textAlign: "center", color: "#fff", fontSize: 54, fontWeight: 800, opacity: on }}>
              {caption.slice(0, n)}
            </div>
          ) : null}
          <div style={{ position: "absolute", inset: 0, transform: `translate3d(${shake.toFixed(2)}px, 0, 0)`, opacity: on }}>
            <svg width={1080} height={SEAM} style={{ position: "absolute", left: 0, top: 0 }}>
              <defs>
                <linearGradient id="woodTop" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#e7b77a" />
                  <stop offset="1" stopColor="#d29a5c" />
                </linearGradient>
                <linearGradient id="woodFront" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#b57a3f" />
                  <stop offset="1" stopColor="#8a5a2b" />
                </linearGradient>
              </defs>
              <ellipse cx={CX} cy={BY + 96} rx={470} ry={26} fill="rgba(0,0,0,0.5)" />
              <polygon points={`${BX + 26},${BY - D} ${BX + BW - 26},${BY - D} ${BX + BW},${BY} ${BX},${BY}`} fill="url(#woodTop)" />
              <rect x={BX} y={BY} width={BW} height={70} rx={8} fill="url(#woodFront)" />
              {[0.12, 0.33, 0.58, 0.8].map((k) => (
                <path key={k} d={`M${BX + BW * k},${BY + 10} q22,18 0,44`} stroke="rgba(80,45,15,0.45)" strokeWidth={4} fill="none" />
              ))}
              {/* prato do gatilho */}
              <polygon points={`${CX + 100},${top} ${CX + 330},${top} ${CX + 318},${top - 12} ${CX + 112},${top - 12}`} fill="#d8c07e" stroke="#8a7440" strokeWidth={2} />
              {/* grampos da dobradiça e mola */}
              {[0, 1, 2, 3, 4].map((k) => (
                <ellipse key={k} cx={hx - 36 + k * 16} cy={hy - 22} rx={12} ry={26} fill="none" stroke="#8d949b" strokeWidth={7} />
              ))}
              <rect x={hx - 50} y={hy - 6} width={100} height={10} rx={5} fill="#6f757b" />
            </svg>
            {/* etiqueta de preço = a isca, em cima do prato */}
            <div
              style={{
                position: "absolute",
                left: CX + 100,
                top: tagTop,
                transform: `translate3d(0, ${((1 - bait) * -460).toFixed(2)}px, 0)`,
                opacity: Math.min(1, bait * 3),
              }}
            >
              <div style={{ transform: `scaleY(${squash.toFixed(3)})`, transformOrigin: "50% 0%" }}>
                <PriceTag text={price} w={TW} />
              </div>
            </div>
            {/* trava por cima de tudo */}
            <svg width={1080} height={SEAM} style={{ position: "absolute", left: 0, top: 0 }}>
              <line x1={hx} y1={hy} x2={tipX} y2={tipY} stroke="#5d6369" strokeWidth={17} strokeLinecap="round" />
              <line x1={hx} y1={hy} x2={tipX} y2={tipY} stroke="#d5dadf" strokeWidth={10} strokeLinecap="round" />
              <circle cx={hx} cy={hy} r={13} fill="#7b8187" />
              {s >= 1
                ? [0, 1, 2, 3, 4].map((k) => {
                    const t = interpolate(f, [snapAt + 5, snapAt + 15], [0, 1], clamp);
                    const a2 = (-160 + k * 35) * (Math.PI / 180);
                    const r0 = 70 + t * 50;
                    const r1 = r0 + 46 * (1 - t);
                    const ox = tipX;
                    const oy = tipY - 10;
                    return <line key={k} x1={ox + Math.cos(a2) * r0} y1={oy + Math.sin(a2) * r0} x2={ox + Math.cos(a2) * r1} y2={oy + Math.sin(a2) * r1} stroke={ZALE.redBright} strokeWidth={8} strokeLinecap="round" opacity={1 - t} />;
                  })
                : null}
            </svg>
          </div>
          {snapLabel ? (
            <div style={{ position: "absolute", left: 0, right: 0, top: BY + 130, textAlign: "center", opacity: Math.min(1, lab * 2), transform: `scale(${lab > 0.997 ? 1 : 1.6 - 0.6 * lab})` }}>
              <span style={{ background: ZALE.red, color: "#fff", fontSize: 48, fontWeight: 900, padding: "10px 28px", borderRadius: 14 }}>{snapLabel}</span>
            </div>
          ) : null}
          {caption ? <SndSpan at={captionAt} dur={Math.round(caption.length * 1.3)} name="type" /> : null}
          <Snd at={baitAt} name="pop" k="bait" />
          <Snd at={snapAt} name="thud" k="trap" />
          <Snd at={snapAt} name="click" k="trap-snap" />
        </Float>
      );
    }}
  </Stage>
);

// ============ 5. etiquetas penduradas ============
// Cada etiqueta cai do trilho e balança (pêndulo amortecido). `strikeAt`: risca a etiqueta (ex.: "mais barato").
export const HangingTags: React.FC<{ life: number; tags: { label: string; price?: string; at: number }[]; strikeAt?: number; big?: boolean }> = ({ life, tags, strikeAt, big }) => (
  <Stage life={life}>
    {(f, fps) => {
      const n = tags.length;
      const TW = big ? 460 : 290;
      const gap = (1080 - 120 - n * TW) / Math.max(1, n - 1);
      const railY = 220;
      const strike = strikeAt !== undefined ? interpolate(f, [strikeAt, strikeAt + 10], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) }) : 0;
      return (
        <Float f={f} amp={4}>
          <div style={{ position: "absolute", left: 50, right: 50, top: railY - 6, height: 12, borderRadius: 6, background: "linear-gradient(#9a9a9a,#555)", boxShadow: "0 6px 14px rgba(0,0,0,0.5)", opacity: sp(f, fps) }} />
          {tags.map((t, k) => {
            const d = sp(f, fps, t.at, { damping: 12, stiffness: 150, mass: 0.8 });
            const tt = Math.max(0, f - t.at);
            const swing = f < t.at ? 0 : 14 * Math.exp(-tt / 22) * Math.sin(tt / 4.2 + k) + 1.6 * Math.sin(f / 30 + k * 2);
            const str = 150 + (k % 2) * 90 + (big ? 40 : 0);
            const x = n === 1 ? CX - TW / 2 : 60 + k * (TW + gap);
            return (
              <div key={k} style={{ position: "absolute", left: x, top: railY, width: TW, transformOrigin: `${TW / 2}px 0px`, transform: `translate3d(0, ${((1 - d) * -300).toFixed(2)}px, 0) rotate(${swing.toFixed(3)}deg)`, opacity: Math.min(1, d * 3) }}>
                <div style={{ position: "absolute", left: TW / 2 - 2, top: 0, width: 4, height: str, background: "#bbb" }} />
                <div style={{ position: "absolute", left: TW / 2 - 16, top: str - 10, width: 32, height: 32, borderRadius: 16, border: "6px solid #bbb", zIndex: 2 }} />
                <div style={{ position: "absolute", left: 0, top: str + 8, width: TW, background: "#fff", borderRadius: 18, padding: big ? "36px 30px" : "24px 18px", textAlign: "center", boxShadow: "0 24px 50px rgba(0,0,0,0.55)" }}>
                  <div style={{ color: "rgba(20,20,20,0.6)", fontSize: big ? 48 : 36, fontWeight: 700, lineHeight: 1.1 }}>{t.label}</div>
                  <div style={{ color: ZALE.ink, fontSize: big ? 96 : 70, fontWeight: 900, letterSpacing: -2, marginTop: 6 }}>{t.price ?? "R$ X"}</div>
                  {strike > 0 ? (
                    <svg width={TW} height={big ? 200 : 140} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
                      <line x1={20} y1={big ? 150 : 110} x2={20 + (TW - 40) * strike} y2={(big ? 150 : 110) - 80 * strike} stroke={ZALE.red} strokeWidth={14} strokeLinecap="round" />
                    </svg>
                  ) : null}
                </div>
                <Snd at={t.at} name="pop" k="tag" />
              </div>
            );
          })}
          {strikeAt !== undefined ? <SndSpan at={strikeAt} dur={10} name="write" vol={0.3} /> : null}
        </Float>
      );
    }}
  </Stage>
);

// ============ 6. só mais uma opção ============
// O card da sua clínica ocupa o palco; em `zoomAt` a câmera se afasta e ele some numa grade de cards iguais,
// perdendo o vermelho.
export const CloneGrid: React.FC<{ life: number; label?: string; zoomAt?: number }> = ({ life, label = TX.seuNegocio, zoomAt = 20 }) => (
  <Stage life={life}>
    {(f, fps) => {
      const on = sp(f, fps);
      const z = interpolate(f, [zoomAt, zoomAt + 40], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
      const scale = interpolate(z, [0, 1], [1.7, 0.36]);
      const CW = 340;
      const CH = 230;
      const G = 36;
      const COLS = 7;
      const ROWS = 7;
      const card = (k: number, mine: boolean) => {
        const red = mine ? 1 - interpolate(z, [0.5, 1], [0, 1], clamp) : 0;
        return (
          <div
            key={k}
            style={{
              width: CW,
              height: CH,
              borderRadius: 26,
              background: mine ? `rgba(255,255,255,${0.1 + 0.9 * red})` : "rgba(255,255,255,0.1)",
              border: `5px solid ${mine ? `rgba(${ZALE.redRgb},${red})` : "rgba(255,255,255,0.12)"}`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              opacity: mine ? 1 : z,
            }}
          >
            <Building2 size={70} color={mine && red > 0.5 ? ZALE.red : "rgba(255,255,255,0.55)"} strokeWidth={2} />
            <div style={{ color: mine && red > 0.5 ? ZALE.ink : "rgba(255,255,255,0.6)", fontSize: 34, fontWeight: 800 }}>{mine ? label : TX.negocio}</div>
            <div style={{ color: mine && red > 0.5 ? ZALE.red : "rgba(255,255,255,0.5)", fontSize: 30, fontWeight: 800 }}>R$ X</div>
          </div>
        );
      };
      return (
        <Float f={f} amp={4}>
          <div style={{ position: "absolute", left: CX, top: CY, opacity: on, transform: `translate(-50%, -50%) scale(${(scale * (0.92 + 0.08 * lock(on))).toFixed(4)})` }}>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${COLS}, ${CW}px)`, gap: G }}>
              {Array.from({ length: COLS * ROWS }).map((_, k) => card(k, k === Math.floor((COLS * ROWS) / 2)))}
            </div>
          </div>
          <Snd at={zoomAt} name="glass" k="clone-zoom" />
        </Float>
      );
    }}
  </Stage>
);

// ============ 7. notinha imprimindo ============
// Cada linha imprime no seu `at` (a nota desce da impressora); `strikeAt` em cada linha risca; `keepAt` circula a
// linha que sobrou (`keep`) com a anotação `keepLabel`.
export const Receipt: React.FC<{ life: number; title?: string; lines: { name: string; price?: string; at: number; strikeAt?: number }[]; keep?: number; keepAt?: number; keepLabel?: string }> = ({
  life,
  title = "ORÇAMENTO",
  lines,
  keep,
  keepAt,
  keepLabel,
}) => (
  <Stage life={life}>
    {(f, fps) => {
      const on = sp(f, fps);
      const LH = 86;
      const HEAD = 150;
      const printed = lines.filter((l) => f >= l.at).length;
      const lastAt = printed > 0 ? lines[printed - 1].at : 0;
      const grow = printed > 0 ? interpolate(f, [lastAt, lastAt + 8], [printed - 1, printed], { ...clamp, easing: Easing.out(Easing.cubic) }) : 0;
      const h = interpolate(on, [0, 1], [0, HEAD]) + grow * LH + (printed === lines.length ? 40 : 0);
      const W = 600;
      const keepT = keepAt !== undefined ? interpolate(f, [keepAt, keepAt + 14], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) }) : 0;
      return (
        <Float f={f} amp={4}>
          {/* impressora */}
          <div style={{ position: "absolute", left: CX - 380, top: 176, width: 760, height: 64, borderRadius: 20, background: "linear-gradient(#3a3a3a,#1c1c1c)", boxShadow: "0 16px 40px rgba(0,0,0,0.6)", opacity: on, zIndex: 2 }}>
            <div style={{ position: "absolute", left: 80, right: 80, bottom: 12, height: 10, borderRadius: 5, background: "#050505" }} />
            <div style={{ position: "absolute", right: 30, top: 22, width: 16, height: 16, borderRadius: 8, background: printed < lines.length ? "#35d06b" : "#555" }} />
          </div>
          {/* papel */}
          <div style={{ position: "absolute", left: CX - W / 2, top: 222, width: W, height: h, overflow: "hidden" }}>
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                background: "#fdfdfb",
                padding: "30px 44px 20px",
                fontFamily: MONO,
                color: "#222",
                boxShadow: "0 30px 70px rgba(0,0,0,0.55)",
                WebkitMaskImage: "linear-gradient(180deg, #000 0, #000 100%)",
              }}
            >
              <div style={{ textAlign: "center", fontSize: 40, fontWeight: 800, letterSpacing: 6 }}>{title}</div>
              <div style={{ borderTop: "3px dashed #999", margin: "20px 0 10px" }} />
              {lines.slice(0, printed).map((l, k) => {
                const st = l.strikeAt !== undefined ? interpolate(f, [l.strikeAt, l.strikeAt + 9], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) }) : 0;
                const isKeep = keep === k && keepT > 0;
                return (
                  <div key={k} style={{ position: "relative", display: "flex", alignItems: "baseline", gap: 12, fontSize: 38, height: LH, lineHeight: `${LH}px`, opacity: 1 - st * 0.45 }}>
                    <span style={{ fontWeight: 700 }}>{l.name}</span>
                    <span style={{ flex: 1, borderBottom: "3px dotted #aaa", transform: "translateY(-14px)" }} />
                    <span style={{ fontWeight: 800 }}>{l.price ?? "R$ X"}</span>
                    {st > 0 ? <div style={{ position: "absolute", left: -8, top: LH / 2 - 4, width: `${(W - 72) * st}px`, height: 8, borderRadius: 4, background: ZALE.red }} /> : null}
                    {isKeep ? (
                      <svg width={W - 40} height={LH + 20} style={{ position: "absolute", left: -24, top: -10, overflow: "visible" }}>
                        <ellipse cx={(W - 40) / 2} cy={(LH + 20) / 2} rx={(W - 40) / 2} ry={(LH + 20) / 2 - 4} fill="none" stroke={ZALE.red} strokeWidth={7} strokeDasharray={1700} strokeDashoffset={1700 * (1 - keepT)} strokeLinecap="round" />
                      </svg>
                    ) : null}
                  </div>
                );
              })}
              {printed === lines.length ? <div style={{ borderTop: "3px dashed #999", marginTop: 10 }} /> : null}
            </div>
          </div>
          {keepLabel && keepT > 0 ? (
            <div style={{ position: "absolute", left: 0, right: 0, top: 222 + h + 30, textAlign: "center", opacity: keepT }}>
              <span style={{ background: ZALE.red, color: "#fff", fontSize: 44, fontWeight: 800, padding: "10px 26px", borderRadius: 14 }}>{keepLabel}</span>
            </div>
          ) : null}
          {lines.map((l, k) => (
            <React.Fragment key={k}>
              <SndSpan at={l.at} dur={8} name="type" vol={0.22} />
              {l.strikeAt !== undefined ? <SndSpan at={l.strikeAt} dur={9} name="write" vol={0.25} /> : null}
            </React.Fragment>
          ))}
          {keepAt !== undefined ? <SndSpan at={keepAt} dur={14} name="write" vol={0.25} /> : null}
        </Float>
      );
    }}
  </Stage>
);

// ============ 8. mapa com o caminho do plano ============
type P = [number, number];
const bez = (a: P, b: P, c: P, d: P, t: number): P => {
  const u = 1 - t;
  return [u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0], u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1]];
};
// caminho sinuoso passando pelos pontos; amostra fina para desenhar até onde já andou
const routePts = (pins: P[]) => {
  const out: P[][] = [];
  for (let i = 0; i < pins.length - 1; i++) {
    const a = pins[i];
    const d = pins[i + 1];
    const dx = (d[0] - a[0]) * 0.5;
    const seg: P[] = [];
    for (let k = 0; k <= 40; k++) seg.push(bez(a, [a[0] + dx, a[1]], [d[0] - dx, d[1]], d, k / 40));
    out.push(seg);
  }
  return out;
};
export const PINS: P[] = [
  [170, 700],
  [400, 470],
  [640, 640],
  [880, 380],
];
export const RouteArt: React.FC<{ f: number; fps: number; stops: { label: string; at: number }[]; icons?: (React.ReactNode | null)[]; doneAt?: number; staticFull?: boolean }> = ({ f, fps, stops, icons, doneAt, staticFull }) => {
  const segs = routePts(PINS.slice(0, stops.length));
  // progresso: chega no pino i no instante stops[i].at
  let prog = 0;
  for (let i = 0; i < stops.length; i++) if (staticFull || f >= stops[i].at) prog = i;
  if (!staticFull && prog < stops.length - 1) {
    const a = stops[prog].at;
    const b = stops[prog + 1].at;
    prog += interpolate(f, [a, b], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) }) * (f >= a ? 1 : 0);
  }
  const pts: P[] = [];
  segs.forEach((s, i) => {
    if (prog <= i) return;
    const upto = Math.min(1, prog - i);
    s.slice(0, Math.max(1, Math.round(upto * 40)) + 1).forEach((p) => pts.push(p));
  });
  const tip = pts.length ? pts[pts.length - 1] : PINS[0];
  const all = segs.flat();
  const done = doneAt !== undefined ? sp(f, fps, doneAt, { damping: 10, stiffness: 200, mass: 0.6 }) : 0;
  return (
    <>
      <svg width={1080} height={SEAM} style={{ position: "absolute", left: 0, top: 0 }}>
        <polyline points={all.map((p) => p.join(",")).join(" ")} fill="none" stroke="#3a3f47" strokeWidth={58} strokeLinecap="round" strokeLinejoin="round" />
        <polyline points={all.map((p) => p.join(",")).join(" ")} fill="none" stroke="#4b515a" strokeWidth={46} strokeLinecap="round" strokeLinejoin="round" />
        <polyline points={all.map((p) => p.join(",")).join(" ")} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={4} strokeDasharray="18 18" strokeLinecap="round" />
        {pts.length > 1 ? <polyline points={pts.map((p) => p.join(",")).join(" ")} fill="none" stroke={ZALE.red} strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" /> : null}
        {pts.length > 1 ? <polyline points={pts.map((p) => p.join(",")).join(" ")} fill="none" stroke="#fff" strokeWidth={3} strokeDasharray="14 16" strokeLinecap="round" opacity={0.8} /> : null}
        {!staticFull ? <circle cx={tip[0]} cy={tip[1]} r={16} fill="#fff" stroke={ZALE.red} strokeWidth={6} /> : null}
      </svg>
      {stops.map((s, i) => {
        const t = staticFull ? 1 : sp(f, fps, s.at);
        const [x, y] = PINS[i];
        const last = i === stops.length - 1;
        return (
          <div key={i} style={{ position: "absolute", left: x - 34, top: y - 34, width: 68, height: 68, opacity: t, transform: `scale(${0.5 + 0.5 * lock(t)})` }}>
            <div style={{ width: 68, height: 68, borderRadius: 34, background: last && done > 0 ? "#1f9d55" : "#fff", border: `6px solid ${last && done > 0 ? "#fff" : ZALE.red}`, display: "flex", alignItems: "center", justifyContent: "center", color: ZALE.red, fontWeight: 900, fontSize: 30, boxShadow: "0 10px 26px rgba(0,0,0,0.5)" }}>
              {last && done > 0 ? <Check size={40} color="#fff" strokeWidth={3.5} /> : icons?.[i] ?? i + 1}
            </div>
            <div style={{ position: "absolute", left: 34, top: i % 2 ? 84 : -70, transform: "translateX(-50%)", whiteSpace: "nowrap", background: "rgba(0,0,0,0.6)", color: "#fff", fontSize: 34, fontWeight: 800, padding: "6px 16px", borderRadius: 12 }}>{s.label}</div>
            {!staticFull ? <Snd at={s.at} name="pop" k="route-pin" /> : null}
          </div>
        );
      })}
    </>
  );
};
export const MapBg: React.FC<{ on: number }> = ({ on }) => (
  <div style={{ position: "absolute", left: 50, top: 190, width: 980, height: 680, borderRadius: 34, overflow: "hidden", opacity: on, background: "#1d2026", boxShadow: "0 30px 80px rgba(0,0,0,0.6)" }}>
    <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.045) 2px, transparent 2px), linear-gradient(90deg, rgba(255,255,255,0.045) 2px, transparent 2px)", backgroundSize: "70px 70px" }} />
    {[
      [60, 60, 200, 130],
      [700, 80, 220, 150],
      [80, 420, 170, 190],
      [520, 470, 260, 150],
    ].map(([x, y, w, h], k) => (
      <div key={k} style={{ position: "absolute", left: x, top: y, width: w, height: h, borderRadius: 18, background: "rgba(255,255,255,0.035)" }} />
    ))}
  </div>
);

export const RouteMap: React.FC<{ life: number; stops: { label: string; at: number }[]; doneAt?: number }> = ({ life, stops, doneAt }) => (
  <Stage life={life}>
    {(f, fps) => {
      const on = sp(f, fps);
      return (
        <Float f={f} amp={4}>
          <MapBg on={on} />
          <RouteArt f={f} fps={fps} stops={stops} doneAt={doneAt} />
        </Float>
      );
    }}
  </Stage>
);

// ============ 10. enquete (CTA) ============
export const PollCta: React.FC<{ life: number; question: string; options: string[]; tapAt?: number; keyword?: string; kwAt?: number }> = ({ life, question, options, tapAt = 20, keyword = "1, 2 ou 3", kwAt = 30 }) => (
  <Stage life={life}>
    {(f, fps) => {
      const on = sp(f, fps, 0, { damping: 14, stiffness: 150, mass: 0.8 });
      const kw = sp(f, fps, kwAt);
      // um toque percorre as opções, uma de cada vez, em loop
      const per = 22;
      const cur = f >= tapAt ? Math.floor((f - tapAt) / per) % options.length : -1;
      const ph = f >= tapAt ? ((f - tapAt) % per) / per : 0;
      return (
        <Float f={f}>
          <div style={{ position: "absolute", left: CX - 400, top: 190, width: 800, background: "#fff", borderRadius: 40, padding: "40px 40px 30px", boxShadow: "0 36px 90px rgba(0,0,0,0.6)", opacity: on, transform: `translate3d(0, ${(1 - on) * 60}px, 0) scale(${0.9 + 0.1 * lock(on)})` }}>
            <div style={{ color: ZALE.ink, fontSize: 48, fontWeight: 900, textAlign: "center", lineHeight: 1.12, letterSpacing: -1 }}>{question}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 30 }}>
              {options.map((o, k) => {
                const active = k === cur;
                return (
                  <div
                    key={k}
                    style={{
                      position: "relative",
                      display: "flex",
                      alignItems: "center",
                      gap: 22,
                      padding: "20px 26px",
                      borderRadius: 24,
                      background: active ? `rgba(${ZALE.redRgb},0.1)` : "#f1f1f1",
                      border: `4px solid ${active ? ZALE.red : "transparent"}`,
                      overflow: "hidden",
                    }}
                  >
                    <div style={{ width: 62, height: 62, borderRadius: 31, background: active ? ZALE.red : ZALE.ink, color: "#fff", fontSize: 36, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>{k + 1}</div>
                    <div style={{ color: ZALE.ink, fontSize: 38, fontWeight: 700 }}>{o}</div>
                    {active ? <div style={{ position: "absolute", left: 60, top: "50%", width: 40, height: 40, marginTop: -20, marginLeft: -20, borderRadius: 20, background: `rgba(${ZALE.redRgb},0.35)`, transform: `scale(${1 + ph * 6})`, opacity: 1 - ph }} /> : null}
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 800, textAlign: "center", opacity: kw, transform: `translateY(${(1 - kw) * 20}px)` }}>
            <span style={{ color: "#fff", fontSize: 50, fontWeight: 800 }}>
              comenta <span style={{ color: ZALE.redBright }}>“{keyword}”</span>
            </span>
          </div>
          <Snd at={0} name="pop" k="poll" />
          {Array.from({ length: options.length }).map((_, k) => (
            <Snd key={k} at={tapAt + k * per} name="tap" k="poll-tap" />
          ))}
        </Float>
      );
    }}
  </Stage>
);

// =====================================================================================================
// CENAS DO VÍDEO "bets / patrocínio da Série A" (2026-09-28). Camisas genéricas (sem escudo de clube nem
// marca de bet), decreto, dinheiro sumindo, torneira, tomada, banquinho de uma perna, cofre com rachadura,
// contrato que vira, corda de um fio só, mesa de várias pernas, pizza do faturamento.
// =====================================================================================================

export const rnd = (k: number) => {
  const x = Math.sin(k * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// ---------- camisa de futebol genérica ----------
const SHIRT_D = "M62,14 L84,6 Q100,24 116,6 L138,14 L196,46 L176,94 L150,82 L150,212 Q100,221 50,212 L50,82 L24,94 L4,46 Z";
const Shirt: React.FC<{ w: number; color: string; trim?: string; stripes?: string; sponsor?: number; gone?: number; id: string }> = ({ w, color, trim = "#fff", stripes, sponsor = 0, gone = 0, id }) => (
  <svg width={w} height={w * 1.12} viewBox="0 0 200 224" style={{ overflow: "visible", filter: "drop-shadow(0 14px 22px rgba(0,0,0,0.5))" }}>
    <defs>
      <clipPath id={`sh-${id}`}>
        <path d={SHIRT_D} />
      </clipPath>
      <linearGradient id={`shade-${id}`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#fff" stopOpacity="0.16" />
        <stop offset="0.55" stopColor="#000" stopOpacity="0" />
        <stop offset="1" stopColor="#000" stopOpacity="0.3" />
      </linearGradient>
    </defs>
    <path d={SHIRT_D} fill={color} />
    {stripes ? (
      <g clipPath={`url(#sh-${id})`}>
        {[62, 92, 122, 152].map((x) => (
          <rect key={x} x={x - 30} y={0} width={15} height={224} fill={stripes} />
        ))}
      </g>
    ) : null}
    <path d={SHIRT_D} fill={`url(#shade-${id})`} />
    <path d="M84,6 Q100,24 116,6" fill="none" stroke={trim} strokeWidth={7} strokeLinecap="round" />
    <path d="M24,94 L4,46" stroke={trim} strokeWidth={7} strokeLinecap="round" />
    <path d="M176,94 L196,46" stroke={trim} strokeWidth={7} strokeLinecap="round" />
    <circle cx={128} cy={58} r={9} fill="none" stroke={trim} strokeWidth={4} />
    {/* espaço do patrocínio: bloco genérico; `gone` apaga e deixa só o contorno tracejado */}
    {gone > 0 ? <rect x={62} y={96} width={76} height={40} rx={6} fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth={3} strokeDasharray="8 7" opacity={gone} /> : null}
    {sponsor > 0 && gone < 1 ? (
      <g opacity={sponsor * (1 - gone)} transform={`translate(0, ${gone * 26})`}>
        <rect x={62} y={96} width={76} height={40} rx={6} fill="#fff" />
        <rect x={72} y={106} width={56} height={9} rx={4} fill="#9a9a9a" />
        <rect x={80} y={120} width={40} height={7} rx={3} fill="#c4c4c4" />
      </g>
    ) : null}
  </svg>
);

const SHIRTS = [
  { color: "#c62828", trim: "#fff" },
  { color: "#15306e", trim: "#f2c230" },
  { color: "#1b1b1b", trim: "#fff", stripes: "#f4f4f4" },
  { color: "#f2f2f2", trim: "#1b1b1b" },
  { color: "#2e7d32", trim: "#fff" },
  { color: "#7b1f2b", trim: "#e8d9a8" },
  { color: "#f2c230", trim: "#15306e" },
  { color: "#0d47a1", trim: "#fff", stripes: "#d32f2f" },
  { color: "#b71c1c", trim: "#111", stripes: "#111" },
  { color: "#00695c", trim: "#fff" },
];

// ============ B1. varal de camisas + canetada ============
// 10 camisas penduradas; `sponsorAt` os patrocínios aparecem no peito; `penAt` uma caneta risca o palco de um lado
// ao outro (`penDur`) e as camisas de `lose` (mais da metade) perdem o patrocínio quando a caneta passa.
export const ShirtRack: React.FC<{ life: number; sponsorAt?: number; penAt?: number; penDur?: number; lose?: number[] }> = ({
  life,
  sponsorAt = 10,
  penAt = 60,
  penDur = 14,
  lose = [0, 1, 3, 5, 6, 8],
}) => (
  <Stage life={life}>
    {(f, fps) => {
      const W = 150;
      const HANG = 4; // quadros entre uma camisa e a próxima (cada uma com o seu cabide batendo)
      const ROWS = [262, 574];
      const colX = (c: number) => 60 + c * 192 + (192 - W) / 2;
      const p = interpolate(f, [penAt, penAt + penDur], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
      const A: P = [30, 300];
      const B: P = [1050, 700];
      const tipX = A[0] + (B[0] - A[0]) * p;
      const tipY = A[1] + (B[1] - A[1]) * p;
      const penOn = interpolate(f, [penAt - 8, penAt, penAt + penDur + 4, penAt + penDur + 14], [0, 1, 1, 0], clamp);
      const lift = interpolate(f, [penAt + penDur, penAt + penDur + 14], [0, 1], clamp);
      return (
        <Float f={f} amp={4}>
          {ROWS.map((y, r) => (
            <div key={r} style={{ position: "absolute", left: 50, right: 50, top: y - 34, height: 10, borderRadius: 5, background: "linear-gradient(#a5a5a5,#5a5a5a)", opacity: sp(f, fps, r * 3), boxShadow: "0 6px 12px rgba(0,0,0,0.5)" }} />
          ))}
          {SHIRTS.map((s, k) => {
            const r = Math.floor(k / 5);
            const c = k % 5;
            const x = colX(c);
            const y = ROWS[r];
            const d = sp(f, fps, 1 + k * HANG, { damping: 12, stiffness: 150, mass: 0.8 });
            const tt = Math.max(0, f - 1 - k * HANG);
            const swing = 6 * Math.exp(-tt / 18) * Math.sin(tt / 4 + k) + 1.2 * Math.sin(f / 26 + k);
            const spn = sp(f, fps, sponsorAt + c * 1.2 + r * 2, { damping: 14, stiffness: 200, mass: 0.6 });
            const cross = (x + W / 2 - A[0]) / (B[0] - A[0]);
            const passT = penAt + penDur * cross;
            const gone = lose.includes(k) ? interpolate(f, [passT, passT + 8], [0, 1], clamp) : 0;
            return (
              <div key={k} style={{ position: "absolute", left: x, top: y - 34, width: W, transformOrigin: `${W / 2}px 0px`, transform: `translate3d(0, ${((1 - d) * -260).toFixed(2)}px, 0) rotate(${swing.toFixed(3)}deg)`, opacity: Math.min(1, d * 3) }}>
                <svg width={W} height={40} style={{ position: "absolute", left: 0, top: 0 }}>
                  <path d={`M${W / 2 - 12},10 q0,-10 12,-10 q12,0 12,10 q0,8 -12,12 L${W / 2 - 50},34 L${W / 2 + 50},34 L${W / 2},22`} fill="none" stroke="#c9c9c9" strokeWidth={4} strokeLinejoin="round" />
                </svg>
                <div style={{ position: "absolute", left: 0, top: 30 }}>
                  <Shirt w={W} {...s} sponsor={spn} gone={gone} id={`r${k}`} />
                </div>
              </div>
            );
          })}
          {/* traço da caneta (tinta vermelha) + caneta */}
          {p > 0 ? (
            <svg width={1080} height={SEAM} style={{ position: "absolute", left: 0, top: 0, opacity: 1 - lift * 0.35 }}>
              <line x1={A[0]} y1={A[1]} x2={tipX} y2={tipY} stroke={ZALE.red} strokeWidth={12} strokeLinecap="round" />
            </svg>
          ) : null}
          {penOn > 0 ? (
            <div style={{ position: "absolute", left: tipX, top: tipY - lift * 60, opacity: penOn, transform: "rotate(-52deg)", transformOrigin: "0 0" }}>
              <svg width={300} height={40} viewBox="0 0 300 40" style={{ position: "absolute", left: 0, top: -20, overflow: "visible", filter: "drop-shadow(0 12px 16px rgba(0,0,0,0.55))" }}>
                <path d="M0,20 L34,10 L34,30 Z" fill="#d9d9d9" />
                <circle cx={2} cy={20} r={3} fill={ZALE.red} />
                <rect x={34} y={8} width={70} height={24} rx={4} fill="#c0c0c0" />
                <rect x={104} y={6} width={190} height={28} rx={10} fill="#141414" />
                <rect x={160} y={2} width={110} height={6} rx={3} fill="#b0b0b0" />
              </svg>
            </div>
          ) : null}
          {/* cabide de metal assentando no varão (Freesound 197891, CC0): o clack principal fica ~4 quadros depois do início do arquivo */}
          {SHIRTS.map((_, k) => (
            <Snd key={k} at={1 + k * HANG + 2} name="tick" file="hanger_clack.wav" vol={0.7} k="hanger" />
          ))}
          <Snd at={sponsorAt} name="pop" k="shirt" />
          {/* canetada = risco de marcador (Freesound 850820, CC0), esticado para durar o traço */}
          <Snd at={penAt} name="tick" file="pen_stroke.wav" vol={0.4} k="pen" />
        </Float>
      );
    }}
  </Stage>
);

// ============ B2. decreto ============
// Folha oficial genérica (brasão neutro, linhas) com o assunto digitado em `typeAt`. O carimbo "proibido" entra
// por cima como `Stamp` (lane 1) na palavra.
export const Decree: React.FC<{ life: number; title?: string; subject?: string; typeAt?: number; cps?: number }> = ({ life, title = "DECRETO", subject = "Apostas esportivas (bets)", typeAt = 8, cps = 1.4 }) => (
  <Stage life={life}>
    {(f, fps) => {
      const on = sp(f, fps, 0, { damping: 14, stiffness: 140, mass: 0.9 });
      const n = Math.round(interpolate(f, [typeAt, typeAt + subject.length * cps], [0, subject.length], clamp));
      const W = 640;
      return (
        <Float f={f} amp={5}>
          <div style={{ position: "absolute", left: CX - W / 2, top: 196, width: W, height: 660, background: PAPER, borderRadius: 10, boxShadow: "0 40px 90px rgba(0,0,0,0.6)", opacity: on, transform: `translate3d(0, ${(1 - on) * 90}px, 0) rotate(${(-2 * lock(on)).toFixed(3)}deg)`, padding: "44px 56px", boxSizing: "border-box", color: "#222" }}>
            <svg width={96} height={96} viewBox="0 0 100 100" style={{ display: "block", margin: "0 auto" }}>
              <circle cx={50} cy={50} r={44} fill="none" stroke="#3b5b3b" strokeWidth={5} />
              <circle cx={50} cy={50} r={34} fill="#3b5b3b" opacity={0.15} />
              <path d="M50,22 L57,42 L78,42 L61,55 L67,76 L50,63 L33,76 L39,55 L22,42 L43,42 Z" fill="#3b5b3b" />
            </svg>
            <div style={{ textAlign: "center", fontFamily: SERIF, fontSize: 52, fontWeight: 700, letterSpacing: 10, marginTop: 14 }}>{title}</div>
            <div style={{ borderTop: "3px solid #3b5b3b", width: 160, margin: "16px auto 26px" }} />
            <div style={{ fontFamily: SERIF, fontSize: 40, fontWeight: 700, textAlign: "center", minHeight: 52 }}>
              {subject.slice(0, n)}
              {n < subject.length && f >= typeAt ? <span style={{ opacity: Math.floor(f / 8) % 2 ? 1 : 0 }}>|</span> : null}
            </div>
            <div style={{ marginTop: 34, display: "flex", flexDirection: "column", gap: 20 }}>
              {[1, 0.92, 0.97, 0.7, 0.95, 0.6].map((w, k) => (
                <div key={k} style={{ height: 12, width: `${w * 100}%`, borderRadius: 6, background: "rgba(0,0,0,0.14)" }} />
              ))}
            </div>
          </div>
          <SndSpan at={typeAt} dur={Math.round(subject.length * cps)} name="type" vol={0.22} />
        </Float>
      );
    }}
  </Stage>
);

// ============ B3. dinheiro que some ============
// Maços de nota caem e empilham a partir de `stackAt`; o rótulo `label` aparece em `labelAt`; em `vanishAt` os
// maços se desfazem subindo e o rótulo é riscado.
export const MoneyVanish: React.FC<{ life: number; label?: string; stackAt?: number; labelAt?: number; vanishAt?: number }> = ({ life, label = "+ R$ 1 bilhão", stackAt = 4, labelAt = 16, vanishAt = 70 }) => (
  <Stage life={life}>
    {(f, fps) => {
      const N = 15;
      const BW = 250;
      const BH = 56;
      const lab = sp(f, fps, labelAt);
      const strike = interpolate(f, [vanishAt + 4, vanishAt + 14], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
      return (
        <Float f={f} amp={4}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 206, textAlign: "center", opacity: lab, transform: `translateY(${(1 - lab) * 24}px)` }}>
            <span style={{ position: "relative", display: "inline-block", color: "#fff", fontSize: 96, fontWeight: 900, letterSpacing: -2 }}>
              {label}
              {strike > 0 ? <div style={{ position: "absolute", left: -10, top: "52%", height: 14, borderRadius: 7, width: `${strike * 104}%`, background: ZALE.red }} /> : null}
            </span>
          </div>
          <div style={{ position: "absolute", left: CX - 60, top: 846, width: 700, height: 30, marginLeft: -290, borderRadius: "50%", background: "rgba(0,0,0,0.5)", filter: "blur(8px)" }} />
          {Array.from({ length: N }).map((_, k) => {
            const col = k % 3;
            const row = Math.floor(k / 3);
            const at = stackAt + k * 1.6;
            const d = sp(f, fps, at, { damping: 13, stiffness: 190, mass: 0.7 });
            const x = CX - BW * 1.5 - 16 + col * (BW + 16) + (rnd(k) - 0.5) * 20;
            const y = 800 - row * (BH + 8);
            const v = Math.max(0, f - vanishAt - row * 1.2 - rnd(k + 9) * 5);
            const up = v > 0 ? v * v * 0.9 : 0;
            const fade = v > 0 ? Math.max(0, 1 - v / 16) : 1;
            const rot = (rnd(k + 3) - 0.5) * 6 + (v > 0 ? (rnd(k + 5) - 0.5) * v * 3 : 0);
            return (
              <div key={k} style={{ position: "absolute", left: x + (v > 0 ? (rnd(k + 7) - 0.5) * v * 9 : 0), top: y - (1 - d) * 520 - up, width: BW, height: BH, opacity: Math.min(1, d * 3) * fade, transform: `rotate(${rot.toFixed(2)}deg)`, borderRadius: 8, background: "linear-gradient(135deg,#a9c9a0,#6f9a6a)", border: "3px solid #587f55", boxShadow: "0 8px 16px rgba(0,0,0,0.45)" }}>
                <div style={{ position: "absolute", left: BW / 2 - 26, top: -3, width: 52, bottom: -3, background: "#f1ead2", borderLeft: "2px solid #c9bf9a", borderRight: "2px solid #c9bf9a" }} />
                <div style={{ position: "absolute", left: 16, top: 10, color: "rgba(30,60,30,0.75)", fontSize: 28, fontWeight: 900 }}>R$</div>
                <div style={{ position: "absolute", right: 16, top: 10, color: "rgba(30,60,30,0.75)", fontSize: 28, fontWeight: 900 }}>R$</div>
              </div>
            );
          })}
          {[0, 3, 6, 9, 12].map((k) => (
            <Snd key={k} at={stackAt + k * 1.6} name="tick" k="bill" />
          ))}
          <Snd at={vanishAt} name="error" k="money-gone" />
        </Float>
      );
    }}
  </Stage>
);

// ============ B4. o espaço mais nobre da camisa ============
// Uma camisa grande; `spotAt` acende o holofote no peito; `labelAt` a etiqueta aponta o espaço; `emptyAt` o
// patrocínio sai e fica o contorno vazio iluminado.
export const ShirtSpot: React.FC<{ life: number; spotAt?: number; label?: string; labelAt?: number; emptyAt?: number }> = ({ life, spotAt = 10, label = "espaço mais nobre", labelAt = 60, emptyAt }) => (
  <Stage life={life}>
    {(f, fps) => {
      const on = sp(f, fps, 0, { damping: 14, stiffness: 140, mass: 0.9 });
      const spot = interpolate(f, [spotAt, spotAt + 5], [0, 1], clamp) * (0.92 + 0.08 * Math.sin(f / 5));
      const lab = sp(f, fps, labelAt);
      const gone = emptyAt !== undefined ? interpolate(f, [emptyAt, emptyAt + 10], [0, 1], clamp) : 0;
      const W = 420;
      const x = CX - W / 2;
      const y = 300;
      // centro do patrocínio na camisa: (100, 116) no viewBox 200x224
      const sx = x + (100 / 200) * W;
      const sy = y + (116 / 224) * W * 1.12;
      return (
        <Float f={f} amp={5}>
          <div style={{ position: "absolute", inset: 0, background: `rgba(0,0,0,${0.35 * spot})` }} />
          <svg width={1080} height={SEAM} style={{ position: "absolute", left: 0, top: 0, opacity: spot }}>
            <defs>
              <linearGradient id="beam" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#fff6d8" stopOpacity="0.05" />
                <stop offset="1" stopColor="#fff6d8" stopOpacity="0.35" />
              </linearGradient>
              <radialGradient id="pool">
                <stop offset="0" stopColor="#fff6d8" stopOpacity="0.55" />
                <stop offset="1" stopColor="#fff6d8" stopOpacity="0" />
              </radialGradient>
            </defs>
            <polygon points={`${sx - 30},150 ${sx + 30},150 ${sx + 120},${sy + 40} ${sx - 120},${sy + 40}`} fill="url(#beam)" />
            <rect x={sx - 60} y={140} width={120} height={26} rx={8} fill="#2a2a2a" />
          </svg>
          <div style={{ position: "absolute", left: x, top: y, opacity: on, transform: `translate3d(0, ${(1 - on) * 80}px, 0) scale(${0.9 + 0.1 * lock(on)})` }}>
            <Shirt w={W} color="#15306e" trim="#f2c230" sponsor={1} gone={gone} id="spot" />
          </div>
          <svg width={1080} height={SEAM} style={{ position: "absolute", left: 0, top: 0, opacity: spot, mixBlendMode: "screen" }}>
            <ellipse cx={sx} cy={sy} rx={130} ry={70} fill="url(#pool)" />
          </svg>
          {lab > 0 ? (
            <>
              <svg width={1080} height={SEAM} style={{ position: "absolute", left: 0, top: 0 }}>
                <path d={`M${sx + 90},${sy} C${sx + 170},${sy - 10} ${sx + 200},${sy - 80} ${sx + 210},${sy - 150}`} fill="none" stroke={ZALE.red} strokeWidth={7} strokeLinecap="round" strokeDasharray={260} strokeDashoffset={260 * (1 - lab)} />
              </svg>
              <div style={{ position: "absolute", left: sx + 40, top: sy - 250, opacity: lab, transform: `scale(${0.8 + 0.2 * lock(lab)})` }}>
                <span style={{ display: "inline-block", background: ZALE.red, color: "#fff", fontSize: 44, fontWeight: 900, padding: "12px 24px", borderRadius: 14, whiteSpace: "nowrap" }}>{label}</span>
              </div>
            </>
          ) : null}
          {/* a camisa subindo: tecido abanando (Freesound 495390, CC0) */}
          <Snd at={0} name="tick" file="cloth_whoosh.wav" vol={0.9} k="cloth" />
          <Snd at={spotAt} name="switch" k="spot" />
          <Snd at={labelAt} name="pop" k="spot-label" />
        </Float>
      );
    }}
  </Stage>
);

// ============ B5. torneira da principal fonte ============
// Cano com a torneira aberta enchendo o pote "caixa"; `labelAt` a placa da fonte; `closeAt` a torneira fecha (a
// água para e o pote começa a baixar por um vazamento embaixo); `askAt` aparece a pergunta.
export const FaucetSource: React.FC<{ life: number; label?: string; labelAt?: number; closeAt?: number; ask?: string; askAt?: number; jar?: string }> = ({
  life,
  label = "principal fonte de clientes",
  labelAt = 20,
  closeAt = 50,
  ask = "o que sobra?",
  askAt = 110,
  jar = "caixa",
}) => (
  <Stage life={life}>
    {(f, fps) => {
      const on = sp(f, fps, 0, { damping: 14, stiffness: 140, mass: 0.9 });
      const lab = sp(f, fps, labelAt) * (1 - interpolate(f, [askAt - 6, askAt], [0, 1], clamp));
      const close = interpolate(f, [closeAt, closeAt + 8], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
      const flow = 1 - close;
      const fill = interpolate(f, [0, closeAt], [0.3, 0.78], clamp);
      const drain = interpolate(f, [closeAt + 8, askAt + 24], [0, 0.62], { ...clamp, easing: Easing.inOut(Easing.quad) });
      const level = Math.max(0.1, fill - drain);
      const ak = sp(f, fps, askAt, { damping: 11, stiffness: 190, mass: 0.7 });
      const JX = 390;
      const JW = 300;
      const JY = 580;
      const JH = 290;
      const spoutX = 540;
      const spoutY = 470;
      const wy = JY + JH - level * JH;
      const wave = (k: number) => Math.sin(f / 5 + k) * 5 * (0.4 + flow);
      const drops = Array.from({ length: Math.max(0, Math.ceil((life - 4 - (closeAt + 4)) / 9)) }, (_, n) => closeAt + 4 + n * 9);
      return (
        <Float f={f} amp={4}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 196, textAlign: "center", opacity: lab }}>
            <span style={{ display: "inline-block", background: "#fff", color: ZALE.ink, fontSize: 42, fontWeight: 900, padding: "12px 26px", borderRadius: 14 }}>{label}</span>
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 178, textAlign: "center", opacity: ak, transform: `scale(${0.7 + 0.3 * lock(ak)})` }}>
            <span style={{ color: "#fff", fontSize: 84, fontWeight: 900, letterSpacing: -2 }}>{ask}</span>
          </div>
          <svg width={1080} height={SEAM} style={{ position: "absolute", left: 0, top: 0, opacity: on }}>
            <defs>
              <linearGradient id="pipe" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#d6d6d6" />
                <stop offset="0.5" stopColor="#8d8d8d" />
                <stop offset="1" stopColor="#5b5b5b" />
              </linearGradient>
              <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#6fc3ff" />
                <stop offset="1" stopColor="#1f6fc2" />
              </linearGradient>
            </defs>
            {/* cano vindo da esquerda, torneira e bico */}
            <rect x={-20} y={370} width={560} height={44} fill="url(#pipe)" />
            <rect x={500} y={350} width={90} height={84} rx={14} fill="url(#pipe)" />
            <rect x={spoutX - 22} y={422} width={44} height={spoutY - 422 + 10} rx={8} fill="url(#pipe)" />
            <g transform={`rotate(${(close * 90).toFixed(2)}, 545, 346)`}>
              <rect x={543} y={312} width={4} height={36} fill="#777" />
              <rect x={490} y={300} width={110} height={22} rx={11} fill={ZALE.red} />
            </g>
            {/* jato */}
            {flow > 0.02 ? <rect x={spoutX - 12 * flow} y={spoutY + 10} width={24 * flow} height={wy - spoutY - 10} fill="url(#water)" opacity={0.9} /> : null}
            {flow <= 0.02 && f < closeAt + 40
              ? [0, 1].map((k) => {
                  const t = ((f - closeAt - 10 - k * 14) % 30) / 30;
                  return t > 0 ? <circle key={k} cx={spoutX} cy={spoutY + 14 + t * (wy - spoutY - 14)} r={7} fill="#6fc3ff" /> : null;
                })
              : null}
            {/* pote de vidro */}
            <path d={`M${JX},${wy + wave(0)} Q${JX + JW / 4},${wy - 8 + wave(1)} ${JX + JW / 2},${wy + wave(2)} T${JX + JW},${wy + wave(3)} L${JX + JW},${JY + JH - 14} Q${JX + JW},${JY + JH} ${JX + JW - 14},${JY + JH} L${JX + 14},${JY + JH} Q${JX},${JY + JH} ${JX},${JY + JH - 14} Z`} fill="url(#water)" opacity={0.85} />
            <rect x={JX} y={JY} width={JW} height={JH} rx={16} fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.75)" strokeWidth={6} />
            <rect x={JX + 22} y={JY + 20} width={14} height={JH - 60} rx={7} fill="rgba(255,255,255,0.25)" />
            <rect x={JX - 12} y={JY - 14} width={JW + 24} height={22} rx={8} fill="rgba(255,255,255,0.75)" />
            {/* vazamento embaixo: uma gota a cada 9 quadros depois que a torneira fecha (cada uma com o seu "plic") */}
            {drops.map((d0, k) => {
              const t = (f - d0) / 26;
              return t >= 0 && t < 1 ? <circle key={k} cx={JX + JW / 2 + 40} cy={JY + JH + 10 + t * 70} r={6} fill="#6fc3ff" opacity={1 - t} /> : null;
            })}
          </svg>
          <div style={{ position: "absolute", left: JX, width: JW, top: JY + JH / 2 - 30, textAlign: "center", opacity: on }}>
            <span style={{ background: "rgba(0,0,0,0.55)", color: "#fff", fontSize: 40, fontWeight: 900, padding: "6px 18px", borderRadius: 10 }}>{jar}</span>
          </div>
          <Snd at={labelAt} name="pop" k="faucet-label" />
          <Snd at={closeAt} name="switch" k="faucet-close" />
          {/* água enchendo o pote (Mixkit "Pouring water to glass"; no edit.json dura até a torneira fechar) */}
          <Snd at={0} name="tick" file="pour_fill.wav" vol={0.36} k="pour" />
          {/* pote vazando: gota real (Freesound 457768, CC0) em cada gota que sai do furo */}
          {Array.from({ length: Math.max(0, Math.ceil((life - 4 - (closeAt + 4)) / 9)) }).map((_, n) => (
            <Snd key={`d${n}`} at={closeAt + 4 + n * 9} name="tick" file="water_drop.wav" vol={0.35} k="drip" />
          ))}
          <Snd at={askAt} name="pop" k="faucet-ask" />
        </Float>
      );
    }}
  </Stage>
);

// ============ B7. tomada do anúncio e a agenda ============
// Tomada na parede com o plugue "anúncio" alimentando a agenda (acesa, horários cheios). `pullAt` o plugue é
// puxado (faísca, a agenda apaga); a partir de `emptyAt` os horários somem um a um.
export const PlugAgenda: React.FC<{ life: number; plug?: string; pullAt?: number; emptyAt?: number }> = ({ life, plug = "anúncio", pullAt = 40, emptyAt = 60 }) => (
  <Stage life={life}>
    {(f, fps) => {
      const on = sp(f, fps, 0, { damping: 14, stiffness: 140, mass: 0.9 });
      const pull = interpolate(f, [pullAt, pullAt + 6], [0, 1], { ...clamp, easing: Easing.out(Easing.back(2)) });
      const power = 1 - interpolate(f, [pullAt + 2, pullAt + 8], [0, 1], clamp);
      const spark = f >= pullAt && f < pullAt + 8 ? 1 - (f - pullAt) / 8 : 0;
      const COLS = 5;
      const ROWS = 5;
      const BX = 400;
      const BY = 230;
      const BWd = 600;
      const BHt = 600;
      const cw = (BWd - 60) / COLS;
      const rh = (BHt - 150) / ROWS;
      const plugX = 170 + pull * 120;
      const cableY = 540;
      return (
        <Float f={f} amp={4}>
          {/* tomada */}
          <div style={{ position: "absolute", left: 70, top: 470, width: 110, height: 150, borderRadius: 18, background: "#e9e6df", boxShadow: "0 16px 30px rgba(0,0,0,0.5)", opacity: on }}>
            <div style={{ position: "absolute", left: 22, top: 42, width: 66, height: 66, borderRadius: 33, background: "#cfcac0" }}>
              <div style={{ position: "absolute", left: 18, top: 26, width: 10, height: 14, borderRadius: 5, background: "#333" }} />
              <div style={{ position: "absolute", right: 18, top: 26, width: 10, height: 14, borderRadius: 5, background: "#333" }} />
            </div>
          </div>
          <svg width={1080} height={SEAM} style={{ position: "absolute", left: 0, top: 0, opacity: on }}>
            <path d={`M${plugX + 90},${cableY} C${plugX + 200},${cableY + 120 * (1 + pull)} ${BX - 120},${cableY + 40} ${BX},${cableY}`} fill="none" stroke="#1a1a1a" strokeWidth={16} strokeLinecap="round" />
            {spark > 0
              ? Array.from({ length: 8 }).map((_, k) => {
                  const a = (k / 8) * Math.PI * 2;
                  return <line key={k} x1={150 + Math.cos(a) * 20} y1={cableY + Math.sin(a) * 20} x2={150 + Math.cos(a) * (40 + 50 * (1 - spark))} y2={cableY + Math.sin(a) * (40 + 50 * (1 - spark))} stroke="#ffd54a" strokeWidth={6} strokeLinecap="round" opacity={spark} />;
                })
              : null}
          </svg>
          {/* plugue */}
          <div style={{ position: "absolute", left: plugX, top: cableY - 40, width: 100, height: 80, borderRadius: 16, background: "linear-gradient(#3a3a3a,#161616)", boxShadow: "0 12px 24px rgba(0,0,0,0.55)", opacity: on }}>
            <div style={{ position: "absolute", left: -26, top: 18, width: 30, height: 12, background: "#bbb", borderRadius: 3 }} />
            <div style={{ position: "absolute", left: -26, top: 50, width: 30, height: 12, background: "#bbb", borderRadius: 3 }} />
          </div>
          <div style={{ position: "absolute", left: plugX - 50, top: cableY - 110, width: 200, textAlign: "center", opacity: on, zIndex: 5 }}>
            <span style={{ display: "inline-block", background: ZALE.red, color: "#fff", fontSize: 36, fontWeight: 900, padding: "8px 18px", borderRadius: 12 }}>{plug}</span>
          </div>
          {/* agenda */}
          <div style={{ position: "absolute", left: BX, top: BY, width: BWd, height: BHt, borderRadius: 28, background: "#fff", boxShadow: power > 0.5 ? "0 0 60px rgba(255,220,120,0.35), 0 30px 70px rgba(0,0,0,0.6)" : "0 30px 70px rgba(0,0,0,0.6)", opacity: on, transform: `translate3d(0, ${(1 - on) * 60}px, 0)`, overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, background: `rgba(10,10,10,${0.55 * (1 - power)})`, zIndex: 3 }} />
            <div style={{ height: 90, background: ZALE.ink, color: "#fff", display: "flex", alignItems: "center", paddingLeft: 32, fontSize: 42, fontWeight: 900 }}>Agenda</div>
            <div style={{ position: "absolute", left: 30, top: 110, display: "flex" }}>
              {["seg", "ter", "qua", "qui", "sex"].map((d) => (
                <div key={d} style={{ width: cw, textAlign: "center", color: "#777", fontSize: 26, fontWeight: 800 }}>
                  {d}
                </div>
              ))}
            </div>
            {Array.from({ length: COLS * ROWS }).map((_, k) => {
              const c = k % COLS;
              const r = Math.floor(k / COLS);
              const order = Math.floor(rnd(k + 20) * COLS * ROWS);
              const gone = interpolate(f, [emptyAt + order * 1.1, emptyAt + order * 1.1 + 4], [0, 1], clamp);
              return (
                <div key={k} style={{ position: "absolute", left: 30 + c * cw + 6, top: 150 + r * rh + 6, width: cw - 12, height: rh - 12, borderRadius: 10, border: "3px dashed #ddd" }}>
                  <div style={{ position: "absolute", inset: -3, borderRadius: 10, background: ["#f7d9d4", "#d9e7f7", "#dff2df", "#efe2f7"][(c + r) % 4], opacity: 1 - gone, transform: `scale(${1 - gone * 0.3})` }}>
                    <div style={{ position: "absolute", left: 10, top: 12, width: "60%", height: 10, borderRadius: 5, background: "rgba(0,0,0,0.25)" }} />
                    <div style={{ position: "absolute", left: 10, top: 30, width: "40%", height: 8, borderRadius: 4, background: "rgba(0,0,0,0.15)" }} />
                  </div>
                </div>
              );
            })}
          </div>
          <Snd at={pullAt} name="switch" k="plug" />
          <Snd at={emptyAt} name="error" k="agenda-empty" />
        </Float>
      );
    }}
  </Stage>
);

// ============ B8. banquinho de uma perna só ============
// Banquinho com uma perna ("1 procedimento") segurando o caixa registradora. `wobbleAt` começa a balançar;
// `fallAt` tomba e o caixa cai (moedas espalham).
export const OneLegStool: React.FC<{ life: number; leg?: string; wobbleAt?: number; fallAt?: number }> = ({ life, leg = TX.produtoUnico, wobbleAt = 40, fallAt = 70 }) => (
  <Stage life={life}>
    {(f, fps) => {
      const on = sp(f, fps, 0, { damping: 14, stiffness: 140, mass: 0.9 });
      const FLOOR = 850;
      const w = Math.max(0, f - wobbleAt);
      const wob = f >= wobbleAt && f < fallAt ? Math.sin(w / 3.2) * Math.min(9, 1 + w * 0.3) : 0;
      const fall = interpolate(f, [fallAt, fallAt + 12], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
      const bounce = f > fallAt + 12 ? Math.exp(-(f - fallAt - 12) / 5) * Math.sin((f - fallAt - 12) * 1.3) * 4 : 0;
      const ang = wob + fall * 78 + bounce;
      const reg = interpolate(f, [fallAt + 2, fallAt + 16], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
      const landed = f >= fallAt + 16;
      const LEGH = 300;
      return (
        <Float f={f} amp={landed ? 0 : 4}>
          <div style={{ position: "absolute", left: 140, right: 140, top: FLOOR, height: 12, borderRadius: 6, background: "#3a3a3a", opacity: on }} />
          <div style={{ position: "absolute", left: CX, top: FLOOR, opacity: on, transformOrigin: "0 0", transform: `rotate(${ang.toFixed(2)}deg)` }}>
            {/* perna */}
            <div style={{ position: "absolute", left: -18, top: -LEGH, width: 36, height: LEGH, background: "linear-gradient(90deg,#8a5a2b,#c08a52,#8a5a2b)", borderRadius: 8 }} />
            <div style={{ position: "absolute", left: 30, top: -LEGH / 2 - 26, whiteSpace: "nowrap", opacity: 1 - fall, transform: `rotate(${(-ang).toFixed(2)}deg)`, transformOrigin: "0 50%" }}>
              <span style={{ display: "inline-block", background: ZALE.red, color: "#fff", fontSize: 36, fontWeight: 900, padding: "8px 18px", borderRadius: 12 }}>{leg}</span>
            </div>
            {/* assento */}
            <div style={{ position: "absolute", left: -170, top: -LEGH - 40, width: 340, height: 50, borderRadius: "50%", background: "radial-gradient(ellipse at 50% 30%,#e0a868,#a8703a)", boxShadow: "0 10px 0 #7a4e24" }} />
            {/* caixa registradora (vai junto até o tombo) */}
            {reg === 0 ? <Register x={-130} y={-LEGH - 40 - 190} /> : null}
          </div>
          {reg > 0 ? (
            <div style={{ position: "absolute", left: CX - 130 + reg * 260, top: FLOOR - LEGH - 230 + reg * (LEGH + 40), transform: `rotate(${(reg * 110).toFixed(1)}deg)`, transformOrigin: "130px 95px" }}>
              <Register x={0} y={0} />
            </div>
          ) : null}
          {landed
            ? Array.from({ length: 10 }).map((_, k) => {
                const t = Math.min(1, (f - fallAt - 16) / 16);
                const vx = (rnd(k) - 0.3) * 380;
                const vy = -180 - rnd(k + 4) * 160;
                const x = CX + 280 + vx * t;
                const y = FLOOR - 40 + vy * t + 420 * t * t;
                return <div key={k} style={{ position: "absolute", left: x, top: Math.min(FLOOR - 26, y), width: 36, height: 36, borderRadius: 18, background: "radial-gradient(circle at 35% 35%,#ffe27a,#c99a1c)", border: "3px solid #a47a10" }} />;
              })
            : null}
          <Snd at={fallAt + 16} name="thud" k="stool-fall" />
        </Float>
      );
    }}
  </Stage>
);

const Register: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <svg width={260} height={190} viewBox="0 0 260 190" style={{ position: "absolute", left: x, top: y, overflow: "visible", filter: "drop-shadow(0 12px 18px rgba(0,0,0,0.5))" }}>
    <rect x={150} y={0} width={90} height={56} rx={8} fill="#2b2b2b" />
    <rect x={160} y={10} width={70} height={30} rx={4} fill="#35d06b" />
    <text x={195} y={33} textAnchor="middle" fontSize={20} fontWeight={900} fill="#0b3b1b" fontFamily="ui-monospace, Consolas, monospace">
      R$
    </text>
    <path d="M20,60 L240,60 L250,140 L10,140 Z" fill="#d8d2c4" />
    {[0, 1, 2].map((r) =>
      [0, 1, 2, 3, 4].map((c) => <rect key={`${r}${c}`} x={40 + c * 38} y={72 + r * 20} width={28} height={13} rx={3} fill="#8e8778" />),
    )}
    <rect x={0} y={140} width={260} height={50} rx={6} fill="#b9b1a0" />
    <rect x={100} y={160} width={60} height={10} rx={5} fill="#7d7566" />
  </svg>
);

// ============ B9. cofre enchendo e a rachadura ============
// Moedas caem no cofre sem parar; `crackAt` uma rachadura cresce no chão embaixo dele; `riskAt` a palavra aparece.
export const CrackVault: React.FC<{ life: number; crackAt?: number; risk?: string; riskAt?: number }> = ({ life, crackAt = 20, risk = "risco", riskAt = 40 }) => (
  <Stage life={life}>
    {(f, fps) => {
      const on = sp(f, fps, 0, { damping: 14, stiffness: 140, mass: 0.9 });
      const cr = interpolate(f, [crackAt, crackAt + 40], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
      const rk = sp(f, fps, riskAt, { damping: 11, stiffness: 190, mass: 0.7 });
      const FLOOR = 740;
      const VX = CX - 180;
      const VY = 380;
      const coins = Math.max(1, Math.floor((life - 14) / 7) + 1); // uma moeda a cada 7 quadros, até o fim da cena
      const ph = f - 14 - Math.floor((f - 14) / 7) * 7;
      const glint = f >= 14 && Math.floor((f - 14) / 7) < coins ? Math.max(0, 1 - ph / 4) : 0;
      const crack = "M540,742 L500,770 L520,800 L450,830 L470,860 L380,880 M540,742 L590,772 L570,806 L650,826 L630,856 L720,882 M520,800 L560,840";
      return (
        <Float f={f} amp={4}>
          <svg width={1080} height={SEAM} style={{ position: "absolute", left: 0, top: 0, opacity: on }}>
            <rect x={100} y={FLOOR} width={880} height={150} fill="#262626" />
            <rect x={100} y={FLOOR} width={880} height={6} fill="#3a3a3a" />
            <path d={crack} fill="none" stroke="#0a0a0a" strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={1400} strokeDashoffset={1400 * (1 - cr)} />
            <path d={crack} fill="none" stroke={ZALE.red} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={1400} strokeDashoffset={1400 * (1 - cr)} opacity={0.9} style={{ filter: `drop-shadow(0 0 8px rgba(${ZALE.redRgb},0.9))` }} />
          </svg>
          {/* cofre */}
          <div style={{ position: "absolute", left: VX, top: VY, width: 360, height: 360, borderRadius: 26, background: "linear-gradient(135deg,#5a5f66,#2c3036)", boxShadow: "0 30px 60px rgba(0,0,0,0.6)", opacity: on, transform: `translate3d(0, ${(1 - on) * 60}px, 0)` }}>
            <div style={{ position: "absolute", inset: 22, borderRadius: 16, border: "5px solid #70767e" }} />
            <div style={{ position: "absolute", left: 120, top: 120, width: 120, height: 120, borderRadius: 60, background: "radial-gradient(circle,#9aa0a8,#50555c)", border: "6px solid #2a2d31" }}>
              <div style={{ position: "absolute", left: 52, top: 6, width: 4, height: 30, background: "#222", transformOrigin: "2px 48px", transform: `rotate(${(f * 3) % 360}deg)` }} />
            </div>
            <div style={{ position: "absolute", left: 130, top: -6, width: 100, height: 14, borderRadius: 7, background: "#111" }} />
            {glint > 0 ? <div style={{ position: "absolute", left: 150, top: -14, width: 60, height: 30, borderRadius: 30, background: "radial-gradient(closest-side, rgba(255,226,122,0.95), rgba(255,226,122,0))", opacity: glint }} /> : null}
          </div>
          {/* moedas entrando */}
          {Array.from({ length: coins }).map((_, k) => {
            const t = (f - k * 7) / 14;
            if (t < 0 || t > 1) return null;
            return <div key={k} style={{ position: "absolute", left: CX - 20 + (rnd(k) - 0.5) * 30, top: 170 + t * (VY - 170), width: 40, height: 40, borderRadius: 20, background: "radial-gradient(circle at 35% 35%,#ffe27a,#c99a1c)", border: "3px solid #a47a10", transform: `scaleX(${Math.abs(Math.cos(f / 3 + k)).toFixed(3)})` }} />;
          })}
          {rk > 0 ? (
            <div style={{ position: "absolute", left: 0, right: 0, top: FLOOR + 60, textAlign: "center", opacity: rk, transform: `scale(${0.7 + 0.3 * lock(rk)})` }}>
              <span style={{ display: "inline-block", background: ZALE.red, color: "#fff", fontSize: 52, fontWeight: 900, padding: "8px 30px", borderRadius: 14 }}>{risk}</span>
            </div>
          ) : null}
          {/* moeda batendo no metal (Freesound 423344, CC0) exatamente quando cada uma entra na fenda. Volume em arco
              (pedido do usuário): começa baixo, chega ao pico no meio da cena e vai descendo; pico 0.26 */}
          {Array.from({ length: coins }).map((_, k) => (
            <Snd key={k} at={k * 7 + 14} name="tick" file="coin_drop.wav" vol={+(0.26 * (0.25 + 0.75 * Math.sin((Math.PI * (k + 0.5)) / coins))).toFixed(3)} k="coin" />
          ))}
          {/* chão rachando (Freesound 222521, CC0): ataque seco e fim decaindo, como a rachadura que cresce e desacelera */}
          <Snd at={crackAt} name="tick" file="crack_ground.wav" vol={0.34} k="crack" />
          <Snd at={riskAt} name="pop" k="risk-label" />
        </Float>
      );
    }}
  </Stage>
);

// ============ B10. contrato que vira risco ============
// Contrato de patrocínio; `signAt` a assinatura é desenhada; `flipAt` a folha gira e o verso mostra `back`.
export const ContractFlip: React.FC<{ life: number; title?: string; signAt?: number; flipAt?: number; back?: string }> = ({ life, title = "Contrato de patrocínio", signAt = 10, flipAt = 60, back = "risco" }) => (
  <Stage life={life}>
    {(f, fps) => {
      const on = sp(f, fps, 0, { damping: 14, stiffness: 140, mass: 0.9 });
      const sign = interpolate(f, [signAt, signAt + 20], [0, 1], clamp);
      const flip = interpolate(f, [flipAt, flipAt + 14], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
      const rot = flip * 180;
      const W = 580;
      const H = 680;
      const face: React.CSSProperties = { position: "absolute", inset: 0, borderRadius: 14, backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", boxShadow: "0 40px 90px rgba(0,0,0,0.6)", boxSizing: "border-box" };
      return (
        <Float f={f} amp={5}>
          <div style={{ position: "absolute", left: CX - W / 2, top: 200, width: W, height: H, perspective: 1800, opacity: on, transform: `translate3d(0, ${(1 - on) * 80}px, 0)` }}>
            <div style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d", transform: `rotateY(${rot.toFixed(2)}deg) scale(${1 + Math.sin(flip * Math.PI) * 0.06})` }}>
              <div style={{ ...face, background: PAPER, padding: "50px 54px", color: "#222" }}>
                <div style={{ fontFamily: SERIF, fontSize: 44, fontWeight: 700, textAlign: "center", lineHeight: 1.15 }}>{title}</div>
                <div style={{ borderTop: "3px solid #bbb", margin: "24px 0 30px" }} />
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {[1, 0.94, 0.98, 0.8, 0.96, 0.9, 0.55].map((w, k) => (
                    <div key={k} style={{ height: 12, width: `${w * 100}%`, borderRadius: 6, background: "rgba(0,0,0,0.13)" }} />
                  ))}
                </div>
                <svg width={W - 108} height={120} style={{ position: "absolute", left: 54, bottom: 60 }}>
                  <path d="M20,70 C50,20 70,100 100,55 S150,30 170,70 S230,90 260,40 S320,60 350,65" fill="none" stroke="#1b2f6e" strokeWidth={5} strokeLinecap="round" strokeDasharray={520} strokeDashoffset={520 * (1 - sign)} />
                  <line x1={0} y1={95} x2={W - 108} y2={95} stroke="#999" strokeWidth={3} />
                </svg>
              </div>
              <div style={{ ...face, background: ZALE.red, transform: "rotateY(180deg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20 }}>
                <svg width={170} height={150} viewBox="0 0 34 30">
                  <path d="M17,2 L32,28 L2,28 Z" fill="none" stroke="#fff" strokeWidth={2.6} strokeLinejoin="round" />
                  <rect x={15.8} y={10} width={2.4} height={10} rx={1.2} fill="#fff" />
                  <circle cx={17} cy={24} r={1.5} fill="#fff" />
                </svg>
                <div style={{ color: "#fff", fontSize: 130, fontWeight: 900, letterSpacing: -3 }}>{back}</div>
              </div>
            </div>
          </div>
          {/* assinatura: rabisco de caneta (Freesound 257517, CC0) com a mesma duração do traço */}
          <Snd at={signAt} name="tick" file="pen_sign.wav" vol={0.28} k="sign" />
          <Snd at={flipAt + 7} name="thud" k="contract-flip" />
        </Float>
      );
    }}
  </Stage>
);

// ============ B11. pendurada por um fio só ============
// A placa da empresa pendurada numa corda de 3 fios ("1 canal"); cada item de `snaps` rompe um fio (a placa dá um
// tranco e balança mais).
export const OneRope: React.FC<{ life: number; rope?: string; sign?: string; snaps?: { at: number }[] }> = ({ life, rope = "1 canal", sign = "sua empresa", snaps = [{ at: 30 }, { at: 60 }] }) => (
  <Stage life={life}>
    {(f, fps) => {
      const on = sp(f, fps, 0, { damping: 14, stiffness: 140, mass: 0.9 });
      const broke = snaps.filter((s) => f >= s.at).length;
      const last = broke > 0 ? snaps[broke - 1].at : -999;
      const jt = f - last;
      const jolt = broke > 0 && jt < 30 ? Math.exp(-jt / 6) * Math.sin(jt * 1.1) * 14 : 0;
      const drop = broke * 10;
      const swing = Math.sin(f / 16) * (2 + broke * 2.5) + (broke > 0 && jt < 40 ? Math.exp(-jt / 10) * Math.sin(jt / 3) * 6 : 0);
      const TOP = 190;
      const L = 300 + drop + jolt;
      const strands = [-7, 0, 7];
      return (
        <Float f={f} amp={3}>
          <div style={{ position: "absolute", left: 120, right: 120, top: TOP - 22, height: 26, borderRadius: 8, background: "linear-gradient(#8a5a2b,#5e3b19)", boxShadow: "0 10px 20px rgba(0,0,0,0.5)", opacity: on }} />
          <div style={{ position: "absolute", left: CX, top: TOP, width: 0, height: 0, transform: `rotate(${swing.toFixed(3)}deg)`, opacity: on }}>
            <svg width={60} height={L + 10} style={{ position: "absolute", left: -30, top: 0, overflow: "visible" }}>
              {strands.map((dx, k) => {
                const snapped = k < broke;
                const st = snapped ? f - snaps[k].at : 0;
                const curl = snapped ? Math.min(1, st / 8) : 0;
                return snapped ? (
                  <g key={k} opacity={1 - Math.min(0.6, st / 30)}>
                    <path d={`M${30 + dx},0 q${6 * curl},${40} ${-10 * curl},${L * 0.45 - 30 * curl}`} fill="none" stroke="#c9a46a" strokeWidth={5} strokeLinecap="round" />
                    <path d={`M${30 + dx},${L} q${-6 * curl},${-40} ${10 * curl},${-L * 0.35 + 30 * curl}`} fill="none" stroke="#c9a46a" strokeWidth={5} strokeLinecap="round" />
                  </g>
                ) : (
                  <path key={k} d={`M${30 + dx},0 Q${30 - dx},${L / 2} ${30 + dx},${L}`} fill="none" stroke="#d9b57a" strokeWidth={6} strokeLinecap="round" />
                );
              })}
            </svg>
            <div style={{ position: "absolute", left: 26, top: L * 0.35, whiteSpace: "nowrap" }}>
              <span style={{ display: "inline-block", background: ZALE.red, color: "#fff", fontSize: 36, fontWeight: 900, padding: "8px 18px", borderRadius: 12 }}>{rope}</span>
            </div>
            <div style={{ position: "absolute", left: -250, top: L, width: 500, height: 230, borderRadius: 22, background: "#fff", boxShadow: "0 30px 60px rgba(0,0,0,0.6)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
              <div style={{ position: "absolute", left: 234, top: -16, width: 32, height: 32, borderRadius: 16, border: "6px solid #999", background: "#fff" }} />
              <Building2 size={84} color={ZALE.ink} strokeWidth={2} />
              <div style={{ color: ZALE.ink, fontSize: 50, fontWeight: 900 }}>{sign}</div>
            </div>
          </div>
          {snaps.map((s, k) => (
            <Snd key={k} at={s.at} name="error" k="rope-snap" />
          ))}
        </Float>
      );
    }}
  </Stage>
);

// ============ B12. mesa de várias pernas ============
// Tampo "faturamento previsível"; cada perna de `legs` sobe no seu `at` com o rótulo; a perna `weak` (o anúncio)
// entra em vermelho e em `removeAt` é puxada para fora, e a mesa continua de pé.
export const StableTable: React.FC<{ life: number; top?: string; typeAt?: number; legs: { label: string; at: number }[]; weak?: string; weakAt?: number; removeAt?: number }> = ({
  life,
  top = "faturamento previsível",
  typeAt = 2,
  legs,
  weak,
  weakAt = 100,
  removeAt = 120,
}) => (
  <Stage life={life}>
    {(f, fps) => {
      const on = sp(f, fps, 0, { damping: 14, stiffness: 140, mass: 0.9 });
      const n = Math.round(interpolate(f, [typeAt, typeAt + top.length * 1.1], [0, top.length], clamp));
      const all = weak ? [...legs, { label: weak, at: weakAt }] : legs;
      const TW = 860;
      const TX = CX - TW / 2;
      const TY = 330;
      const LH = 330;
      const xs = all.map((_, k) => TX + 70 + (k * (TW - 140)) / Math.max(1, all.length - 1));
      const rem = weak ? interpolate(f, [removeAt, removeAt + 12], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) }) : 0;
      const wob = weak && f > removeAt + 8 ? Math.exp(-(f - removeAt - 8) / 8) * Math.sin((f - removeAt) * 0.9) * 2.5 : 0;
      return (
        <Float f={f} amp={4}>
          <div style={{ position: "absolute", left: 100, right: 100, top: TY + 60 + LH, height: 12, borderRadius: 6, background: "#3a3a3a", opacity: on }} />
          <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: SEAM, transformOrigin: `${CX}px ${TY + 60 + LH}px`, transform: `rotate(${wob.toFixed(3)}deg)` }}>
            {all.map((l, k) => {
              const isWeak = weak && k === all.length - 1;
              const d = sp(f, fps, l.at, { damping: 12, stiffness: 170, mass: 0.7 });
              const out = isWeak ? rem : 0;
              return (
                <div key={k} style={{ position: "absolute", left: xs[k] - 22 + out * 260, top: TY + 60 + (1 - d) * LH + out * 120, width: 44, height: LH, opacity: Math.min(1, d * 3) * (1 - out), transform: `rotate(${(out * 40).toFixed(1)}deg)` }}>
                  <div style={{ position: "absolute", inset: 0, borderRadius: 8, background: isWeak ? `linear-gradient(90deg,#8e1b0c,${ZALE.red},#8e1b0c)` : "linear-gradient(90deg,#8a5a2b,#c08a52,#8a5a2b)" }} />
                  <div style={{ position: "absolute", left: 22, top: LH * 0.42, transform: "translate(-50%, 0)", whiteSpace: "nowrap" }}>
                    <span style={{ display: "inline-block", background: isWeak ? ZALE.red : "#fff", color: isWeak ? "#fff" : ZALE.ink, fontSize: 32, fontWeight: 900, padding: "8px 16px", borderRadius: 12, boxShadow: "0 8px 18px rgba(0,0,0,0.45)" }}>{l.label}</span>
                  </div>
                </div>
              );
            })}
            <div style={{ position: "absolute", left: TX, top: TY, width: TW, height: 70, borderRadius: 14, background: "linear-gradient(#e0a868,#a8703a)", boxShadow: "0 14px 0 #7a4e24, 0 30px 50px rgba(0,0,0,0.5)", opacity: on, transform: `translate3d(0, ${(1 - on) * -60}px, 0)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#3b220b", fontSize: 44, fontWeight: 900 }}>{top.slice(0, n)}</span>
            </div>
            {weak && rem > 0.3 ? (
              <div style={{ position: "absolute", left: xs[all.length - 1] - 45, top: TY + 150, opacity: Math.min(1, (rem - 0.3) * 3) }}>
                <svg width={90} height={90} viewBox="0 0 10 10">
                  <path d="M1.5,1.5 L8.5,8.5 M8.5,1.5 L1.5,8.5" stroke={ZALE.red} strokeWidth={1.8} strokeLinecap="round" />
                </svg>
              </div>
            ) : null}
          </div>
          <SndSpan at={typeAt} dur={Math.round(top.length * 1.1)} name="type" vol={0.22} />
          {legs.map((l, k) => (
            <Snd key={k} at={l.at} name="pop" k="table-leg" />
          ))}
          {weak ? <Snd at={weakAt} name="pop" k="table-leg" /> : null}
          {weak ? <Snd at={removeAt} name="error" k="table-remove" /> : null}
        </Float>
      );
    }}
  </Stage>
);

// ============ B13. pizza do faturamento (CTA) ============
// Pizza com a fatia da principal fonte em vermelho; `pullAt` a fatia sai e some; `askAt` "?" no buraco;
// `ctaAt` "comenta aqui" com seta para baixo.
export const PieCta: React.FC<{ life: number; title?: string; slice?: string; pullAt?: number; askAt?: number; cta?: string; ctaAt?: number }> = ({
  life,
  title = "seu faturamento",
  slice = "principal fonte",
  pullAt = 20,
  askAt = 90,
  cta = "comenta aqui",
  ctaAt = 150,
}) => (
  <Stage life={life}>
    {(f, fps) => {
      const on = sp(f, fps, 0, { damping: 14, stiffness: 140, mass: 0.9 });
      const R = 230;
      const cx = CX;
      const cy = 520;
      const parts = [0.42, 0.24, 0.2, 0.14];
      const cols = [ZALE.red, "#5a5a5a", "#7a7a7a", "#9a9a9a"];
      const sweep = interpolate(f, [0, 16], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
      const pull = interpolate(f, [pullAt, pullAt + 14], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
      const ask = sp(f, fps, askAt, { damping: 10, stiffness: 200, mass: 0.6 });
      const ct = sp(f, fps, ctaAt);
      const bob = Math.sin(f / 5) * 10;
      let acc = -Math.PI / 2;
      const arcs = parts.map((p, k) => {
        const a0 = acc;
        const a1 = acc + p * Math.PI * 2 * sweep;
        acc += p * Math.PI * 2;
        const large = a1 - a0 > Math.PI ? 1 : 0;
        const d = `M${cx},${cy} L${cx + R * Math.cos(a0)},${cy + R * Math.sin(a0)} A${R},${R} 0 ${large} 1 ${cx + R * Math.cos(a1)},${cy + R * Math.sin(a1)} Z`;
        const mid = (a0 + a1) / 2;
        return { d, mid, k };
      });
      const m0 = arcs[0].mid;
      return (
        <Float f={f} amp={4}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 196, textAlign: "center", opacity: on }}>
            <span style={{ color: "#fff", fontSize: 50, fontWeight: 900 }}>{title}</span>
          </div>
          <svg width={1080} height={SEAM} style={{ position: "absolute", left: 0, top: 0, opacity: on, overflow: "visible" }}>
            <circle cx={cx} cy={cy} r={R + 10} fill="rgba(255,255,255,0.05)" />
            {arcs.map((a) => {
              const isMain = a.k === 0;
              const off = isMain ? 40 + pull * 520 : 0;
              return <path key={a.k} d={a.d} fill={cols[a.k]} stroke="#141414" strokeWidth={6} transform={isMain ? `translate(${(Math.cos(m0) * off).toFixed(2)}, ${(Math.sin(m0) * off).toFixed(2)}) rotate(${(pull * 40).toFixed(1)}, ${cx}, ${cy})` : undefined} opacity={isMain ? 1 - pull : 1} />;
            })}
          </svg>
          {pull < 0.4 ? (
            <div style={{ position: "absolute", left: cx + Math.cos(m0) * (R * 0.55 + 40) - 150, top: cy + Math.sin(m0) * (R * 0.55 + 40) - 30, width: 300, textAlign: "center", opacity: sweep * (1 - pull * 2.5) }}>
              <span style={{ color: "#fff", fontSize: 36, fontWeight: 900, textShadow: "0 2px 8px rgba(0,0,0,0.6)" }}>{slice}</span>
            </div>
          ) : null}
          {ask > 0 ? (
            <div style={{ position: "absolute", left: cx + Math.cos(m0) * R * 0.5 - 90, top: cy + Math.sin(m0) * R * 0.5 - 90, width: 180, height: 180, display: "flex", alignItems: "center", justifyContent: "center", opacity: ask, transform: `scale(${0.5 + 0.5 * lock(ask)})` }}>
              <span style={{ color: ZALE.redBright, fontSize: 150, fontWeight: 900 }}>?</span>
            </div>
          ) : null}
          {ct > 0 ? (
            <div style={{ position: "absolute", left: 0, right: 0, top: 800, textAlign: "center", opacity: ct, transform: `translateY(${(1 - ct) * 20}px)` }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 14, background: "#fff", color: ZALE.ink, fontSize: 44, fontWeight: 900, padding: "10px 28px", borderRadius: 40 }}>
                {cta}
                <svg width={36} height={36} viewBox="0 0 10 10" style={{ transform: `translateY(${(bob * 0.4).toFixed(2)}px)` }}>
                  <path d="M5,1 V8.5 M1.8,5.5 L5,8.7 L8.2,5.5" fill="none" stroke={ZALE.red} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </div>
          ) : null}
          <Snd at={pullAt} name="error" k="pie-pull" />
          <Snd at={askAt} name="pop" k="pie-ask" />
          <Snd at={ctaAt} name="pop" k="pie-cta" />
        </Float>
      );
    }}
  </Stage>
);

// ============ B14. pote de várias fontes (faturamento previsível) ============
// Continua a metáfora da torneira: agora VÁRIOS canos coloridos enchem o pote, cada um no seu `at`, em camadas de
// cor. `weak` (o anúncio, vermelho) abre em `weakAt` e é fechado em `removeAt` (X vermelho): o pote continua cheio.
// `pipesAt`: os canos descem juntos ("vários lugares"). Título digitado em `typeAt`.
const SRC_COLORS = ["#2dd4bf", "#f5b942", "#a78bfa", "#60a5fa"];
export const FlowJar: React.FC<{
  life: number;
  title?: string;
  typeAt?: number;
  pipesAt?: number;
  sources: { label: string; at: number; color?: string }[];
  weak?: string;
  weakAt?: number;
  removeAt?: number;
}> = ({ life, title = "faturamento previsível", typeAt = 2, pipesAt = 20, sources, weak, weakAt = 100, removeAt = 130 }) => (
  <Stage life={life}>
    {(f, fps) => {
      const on = sp(f, fps, 0, { damping: 14, stiffness: 140, mass: 0.9 });
      const n = Math.round(interpolate(f, [typeAt, typeAt + title.length * 1.1], [0, title.length], clamp));
      const all = [...sources.map((s, k) => ({ ...s, color: s.color ?? SRC_COLORS[k % SRC_COLORS.length], weak: false, end: life })), ...(weak ? [{ label: weak, at: weakAt, color: ZALE.red, weak: true, end: removeAt }] : [])];
      const JX = 140;
      const JW = 800;
      const JY = 470;
      const JH = 390;
      const RATE = 0.0042; // fração do pote por quadro, por cano aberto
      const drop = sp(f, fps, pipesAt, { damping: 13, stiffness: 150, mass: 0.8 });
      const xs = all.map((_, k) => JX + 70 + (k * (JW - 140)) / Math.max(1, all.length - 1));
      const flowOf = (s: (typeof all)[number]) => {
        const open = interpolate(f, [s.at, s.at + 4], [0, 1], clamp);
        const shut = s.weak ? interpolate(f, [s.end, s.end + 5], [0, 1], clamp) : 0;
        return open * (1 - shut);
      };
      // camadas: cada fonte soma a altura que já despejou (base 0.12 de água no fundo)
      let acc = 0.12;
      const layers = all.map((s) => {
        const t0 = s.at + 2;
        const t1 = Math.min(f, s.weak ? s.end : f);
        const h = Math.max(0, t1 - t0) * RATE;
        const l = { color: s.color, y0: acc, y1: acc + h };
        acc += h;
        return l;
      });
      const level = Math.min(0.9, acc);
      const surf = JY + JH - level * JH;
      const wave = (k: number) => Math.sin(f / 5 + k) * 4;
      const rem = weak ? interpolate(f, [removeAt, removeAt + 10], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) }) : 0;
      return (
        <Float f={f} amp={4}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 178, textAlign: "center", color: "#fff", fontSize: 58, fontWeight: 900, letterSpacing: -1, opacity: on }}>
            {title.slice(0, n)}
          </div>
          <svg width={1080} height={SEAM} style={{ position: "absolute", left: 0, top: 0, opacity: on }}>
            <defs>
              <linearGradient id="fjPipe" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#5b5b5b" />
                <stop offset="0.5" stopColor="#d6d6d6" />
                <stop offset="1" stopColor="#5b5b5b" />
              </linearGradient>
              <clipPath id="fjClip">
                <rect x={JX + 6} y={JY} width={JW - 12} height={JH - 6} rx={18} />
              </clipPath>
            </defs>
            {/* canos descendo do alto, cada um com a sua cor na ponta */}
            {all.map((s, k) => {
              const x = xs[k];
              const tip = 300 + drop * 90;
              const fl = flowOf(s);
              return (
                <g key={k} opacity={s.weak ? interpolate(f, [s.at - 6, s.at], [0, 1], clamp) : 1}>
                  <rect x={x - 16} y={250} width={32} height={tip - 250} fill="url(#fjPipe)" />
                  <rect x={x - 22} y={tip - 6} width={44} height={20} rx={5} fill={s.color} />
                  {fl > 0.02 ? <rect x={x - 11 * fl} y={tip + 14} width={22 * fl} height={Math.max(0, surf - tip - 14)} rx={6} fill={s.color} opacity={0.9} /> : null}
                </g>
              );
            })}
            {/* água em camadas coloridas */}
            <g clipPath="url(#fjClip)">
              {layers.map((l, k) => {
                const y0 = JY + JH - l.y0 * JH;
                const y1 = JY + JH - Math.min(level, l.y1) * JH;
                if (y0 - y1 < 0.5) return null;
                return <rect key={k} x={JX} y={y1} width={JW} height={y0 - y1 + 1} fill={l.color} opacity={0.85} />;
              })}
              <rect x={JX} y={JY + JH - 0.12 * JH} width={JW} height={0.12 * JH} fill="#1f6fc2" opacity={0.85} />
              <path d={`M${JX},${surf + wave(0)} Q${JX + JW / 4},${surf - 8 + wave(1)} ${JX + JW / 2},${surf + wave(2)} T${JX + JW},${surf + wave(3)} L${JX + JW},${surf + 12} L${JX},${surf + 12} Z`} fill="rgba(255,255,255,0.35)" />
            </g>
            <rect x={JX} y={JY} width={JW} height={JH} rx={22} fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.8)" strokeWidth={6} />
            <rect x={JX + 26} y={JY + 24} width={16} height={JH - 70} rx={8} fill="rgba(255,255,255,0.22)" />
            {/* X no cano do anúncio quando ele é fechado */}
            {weak && rem > 0 ? (
              <g transform={`translate(${xs[all.length - 1]}, ${300 + drop * 90 - 40}) scale(${0.6 + 0.4 * rem})`} opacity={rem}>
                <circle r={34} fill={ZALE.red} />
                <path d="M-14,-14 L14,14 M14,-14 L-14,14" stroke="#fff" strokeWidth={8} strokeLinecap="round" />
              </g>
            ) : null}
          </svg>
          {/* rótulos das fontes, sobre os canos */}
          {all.map((s, k) => {
            const lab = sp(f, fps, s.weak ? s.at : Math.min(s.at, pipesAt + 4 + k * 3));
            const lit = f >= s.at;
            return (
              <div key={k} style={{ position: "absolute", left: xs[k] - 110, width: 220, top: 262 + drop * 90 + 34, textAlign: "center", opacity: lab * (s.weak ? 1 - rem * 0.5 : 1), transform: `scale(${0.8 + 0.2 * lock(lab)})` }}>
                <span style={{ display: "inline-block", background: lit ? s.color : "rgba(255,255,255,0.12)", color: lit ? (s.weak ? "#fff" : "#10231f") : "rgba(255,255,255,0.7)", fontSize: 30, fontWeight: 900, padding: "6px 16px", borderRadius: 999, textDecoration: s.weak && rem > 0.5 ? "line-through" : "none" }}>
                  {s.label}
                </span>
              </div>
            );
          })}
          <SndSpan at={typeAt} dur={Math.round(title.length * 1.1)} name="type" vol={0.22} />
          {all.map((s, k) => (
            <Snd key={k} at={s.at} name="switch" k="pipe-open" />
          ))}
          <Snd at={Math.min(...all.map((s) => s.at))} name="tick" file="pour_fill.wav" vol={0.3} k="pour" />
          {weak ? <Snd at={removeAt} name="error" k="pipe-close" /> : null}
        </Float>
      );
    }}
  </Stage>
);

// ============ B15. torre de Jenga (CTA) ============
// Torre de blocos de madeira; o bloco vermelho `main` ("principal fonte") é puxado em `pullAt`, os de cima assentam
// com um tranco e a torre balança. `askAt`: a pergunta e o "?"; `ctaAt`: "comenta aqui" com seta para baixo.
export const JengaCta: React.FC<{ life: number; main?: string; pullAt?: number; ask?: string; askAt?: number; cta?: string; ctaAt?: number }> = ({
  life,
  main = "principal fonte",
  pullAt = 24,
  ask = "quanto ia junto?",
  askAt = 100,
  cta = "comenta aqui",
  ctaAt = 170,
}) => (
  <Stage life={life}>
    {(f, fps) => {
      const on = sp(f, fps, 0, { damping: 14, stiffness: 140, mass: 0.9 });
      const ROWS = 9;
      const RH = 58;
      const TW = 380;
      const BASE = 850;
      const MAIN = 4; // linha do bloco vermelho (0 = base)
      const pull = interpolate(f, [pullAt, pullAt + 14], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
      const fallT = f - (pullAt + 14);
      const fall = fallT > 0 ? Math.min(1, (fallT / 6) ** 2) : 0;
      const bounce = fallT > 6 ? Math.exp(-(fallT - 6) / 5) * Math.sin((fallT - 6) * 1.4) * 6 : 0;
      const tilt = fallT > 6 ? 2.2 + Math.exp(-(fallT - 6) / 10) * Math.sin((fallT - 6) / 3) * 3 : 0;
      const ak = sp(f, fps, askAt, { damping: 10, stiffness: 200, mass: 0.6 });
      const ct = sp(f, fps, ctaAt);
      const bob = Math.sin(f / 5) * 5;
      const wood = ["#e8b87a", "#d9a466", "#efc58d", "#dcaa6e"];
      const block = (w: number, h: number, c: string, key: string, extra?: React.CSSProperties, label?: string) => (
        <div
          key={key}
          style={{
            position: "absolute",
            width: w,
            height: h - 4,
            borderRadius: 6,
            background: `linear-gradient(180deg, ${c}, ${c} 55%, rgba(0,0,0,0.12))`,
            boxShadow: "inset 0 2px 0 rgba(255,255,255,0.35), inset 0 -3px 0 rgba(0,0,0,0.18), 0 6px 12px rgba(0,0,0,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            ...extra,
          }}
        >
          {label ? <span style={{ color: "#fff", fontSize: 36, fontWeight: 900, textShadow: "0 2px 6px rgba(0,0,0,0.4)" }}>{label}</span> : null}
        </div>
      );
      const rows = Array.from({ length: ROWS }).map((_, r) => {
        const above = r > MAIN;
        const y = BASE - (r + 1) * RH + (above ? fall * RH + bounce : 0);
        const x0 = CX - TW / 2;
        const inT = sp(f, fps, 1 + r * 1.6, { damping: 13, stiffness: 180, mass: 0.7 });
        const style: React.CSSProperties = { top: y - (1 - inT) * 300, opacity: Math.min(1, inT * 3) };
        if (r === MAIN) {
          return block(TW, RH, ZALE.red, `r${r}`, { ...style, left: x0 + pull * 720, transform: `rotate(${(pull * 14).toFixed(2)}deg)`, opacity: style.opacity as number * (1 - Math.max(0, pull - 0.85) * 6) }, main);
        }
        if (r % 2 === 0) return block(TW, RH, wood[r % 4], `r${r}`, { ...style, left: x0 });
        const bw = (TW - 16) / 3;
        return (
          <React.Fragment key={`r${r}`}>
            {[0, 1, 2].map((c) => block(bw, RH, wood[(r + c) % 4], `r${r}c${c}`, { ...style, left: x0 + c * (bw + 8) }))}
          </React.Fragment>
        );
      });
      return (
        <Float f={f} amp={fallT > 0 ? 2 : 4}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 184, textAlign: "center", opacity: ak, transform: `scale(${0.7 + 0.3 * lock(ak)})` }}>
            <span style={{ color: "#fff", fontSize: 78, fontWeight: 900, letterSpacing: -2 }}>{ask}</span>
          </div>
          <div style={{ position: "absolute", left: CX - 300, top: BASE, width: 600, height: 16, borderRadius: 8, background: "#3a3a3a", opacity: on }} />
          <div style={{ position: "absolute", inset: 0, transformOrigin: `${CX}px ${BASE}px`, transform: `rotate(${tilt.toFixed(3)}deg)` }}>{rows}</div>
          {ak > 0 ? (
            <div style={{ position: "absolute", left: CX + TW / 2 + 30, top: BASE - (MAIN + 1) * RH - 70, opacity: ak, transform: `scale(${0.5 + 0.5 * lock(ak)})` }}>
              <span style={{ color: ZALE.redBright, fontSize: 150, fontWeight: 900 }}>?</span>
            </div>
          ) : null}
          {ct > 0 ? (
            <div style={{ position: "absolute", left: 0, right: 0, top: 880, textAlign: "center", opacity: ct, transform: `translateY(${(1 - ct) * 20}px)` }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 14, background: "#fff", color: ZALE.ink, fontSize: 44, fontWeight: 900, padding: "10px 28px", borderRadius: 40 }}>
                {cta}
                <svg width={36} height={36} viewBox="0 0 10 10" style={{ transform: `translateY(${(bob * 0.5).toFixed(2)}px)` }}>
                  <path d="M5,1 V8.5 M1.8,5.5 L5,8.7 L8.2,5.5" fill="none" stroke={ZALE.red} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </div>
          ) : null}
          {/* bloco puxado (Freesound 620026, CC0) e a torre assentando (Freesound 749304, CC0) */}
          <Snd at={pullAt} name="tick" file="jenga_pull.wav" vol={0.35} k="jenga-pull" />
          <Snd at={pullAt + 14 + 5} name="tick" file="jenga_settle.wav" vol={0.7} k="jenga-settle" />
          <Snd at={askAt} name="pop" k="jenga-ask" />
          <Snd at={ctaAt} name="pop" k="jenga-cta" />
        </Float>
      );
    }}
  </Stage>
);
