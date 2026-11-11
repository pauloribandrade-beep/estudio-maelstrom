import React from "react";
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BatteryLow, Check, FileText, HardDrive, Search, Send, ShoppingCart, User, Wrench } from "lucide-react";
import { FONT } from "./overlays";
import { ZALE } from "./theme";
import { SEAM, Snd, SndSpan } from "./palco";

// CENAS DE METÁFORA do vídeo "se a Apple vendesse igual a maioria" (pedido do Paulo: MUITA dinâmica visual,
// principalmente na parte da Apple). Celular desenhado genérico e SEM a logo da Apple (marca registrada).
// Estilo keynote nas partes "Apple" (palco escuro, holofote, tipografia fina); escritório de luz fria no
// "jeito da maioria". Todo evento visível tem som discreto; contadores com tique curto.

const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
const CX = 540;
const THIN = "'Segoe UI Light', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const HAND = "'Segoe Print', 'Bradley Hand', 'Comic Sans MS', cursive";
const MONO = "ui-monospace, Consolas, 'Courier New', monospace";
const sp = (f: number, fps: number, at = 0, k = { damping: 15, stiffness: 170, mass: 0.8 }) => (f < at ? 0 : spring({ frame: f - at, fps, config: k }));
const lock = (p: number) => (p > 0.997 ? 1 : p);
const ease = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });

const Stage: React.FC<{ life: number; bg?: string; children: (f: number, fps: number) => React.ReactNode }> = ({ life, bg, children }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const out = interpolate(f, [life - 7, life], [1, 0], { ...clamp, easing: Easing.in(Easing.cubic) });
  return <AbsoluteFill style={{ height: SEAM, opacity: out, fontFamily: FONT, overflow: "hidden", background: bg }}>{children(f, fps)}</AbsoluteFill>;
};
const Float: React.FC<{ f: number; amp?: number; children: React.ReactNode }> = ({ f, amp = 6, children }) => (
  <div style={{ position: "absolute", inset: 0, transform: `translate3d(0, ${(Math.sin(f / 24) * amp).toFixed(3)}px, 0)`, willChange: "transform", backfaceVisibility: "hidden" }}>{children}</div>
);
const Typed: React.FC<{ text: string; f: number; at: number; dur: number; cursor?: boolean }> = ({ text, f, at, dur, cursor }) => {
  const n = Math.round(interpolate(f, [at, at + dur], [0, text.length], clamp));
  return (
    <>
      {text.slice(0, n)}
      {cursor && f >= at && n < text.length ? <span style={{ opacity: Math.floor(f / 8) % 2 ? 0 : 1 }}>|</span> : null}
      <span style={{ opacity: 0 }}>{text.slice(n)}</span>
    </>
  );
};
const Pill: React.FC<{ text: string; top: number; on: number; red?: boolean; size?: number }> = ({ text, top, on, red = true, size = 44 }) => (
  <div style={{ position: "absolute", left: 0, right: 0, top, textAlign: "center", opacity: on, transform: `translateY(${(1 - on) * 14}px) scale(${0.9 + 0.1 * lock(on)})` }}>
    <span style={{ background: red ? ZALE.red : "rgba(255,255,255,0.12)", color: "#fff", fontSize: size, fontWeight: 900, padding: "10px 26px", borderRadius: 14 }}>{text}</span>
  </div>
);
const SCREEN_NEW = "linear-gradient(160deg,#1e3a8a,#7c3aed 55%,#db2777)";

// celular genérico (sem marca): corpo, ilha no topo, tela com conteúdo
export const Phone: React.FC<{ w: number; children?: React.ReactNode; screen?: string; glow?: number; cracked?: boolean; dim?: number }> = ({ w, children, screen = "#0b0b0d", glow = 0, cracked, dim = 0 }) => {
  const h = w * 2.05;
  return (
    <div style={{ position: "relative", width: w, height: h, borderRadius: w * 0.16, background: "linear-gradient(145deg,#3a3a3e,#1a1a1d)", padding: w * 0.035, boxSizing: "border-box", boxShadow: `0 30px 70px rgba(0,0,0,0.6)${glow ? `, 0 0 ${(80 * glow).toFixed(0)}px rgba(255,255,255,${(0.35 * glow).toFixed(2)})` : ""}` }}>
      <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: w * 0.13, background: screen, overflow: "hidden" }}>
        {children}
        <div style={{ position: "absolute", left: "50%", top: w * 0.04, width: w * 0.3, height: w * 0.075, marginLeft: -w * 0.15, borderRadius: w, background: "#000" }} />
        {cracked ? (
          <svg width="100%" height="100%" viewBox="0 0 100 205" preserveAspectRatio="none" style={{ position: "absolute", inset: 0 }}>
            <path d="M70 20 L55 60 L72 88 L48 120 L62 160 L40 205 M55 60 L20 70 M72 88 L98 100 M48 120 L10 140" stroke="rgba(255,255,255,0.7)" strokeWidth={0.8} fill="none" />
          </svg>
        ) : null}
        {dim > 0 ? <div style={{ position: "absolute", inset: 0, background: `rgba(0,0,0,${(0.75 * dim).toFixed(2)})` }} /> : null}
      </div>
    </div>
  );
};

// ============ 1. prateleira de promoção: ninguém quer ============
export const ShelfPromo: React.FC<{ life: number; tagAt: number; cartAt: number; price?: string }> = ({ life, tagAt, cartAt, price = "R$ 1.000" }) => (
  <Stage life={life}>
    {(f, fps) => {
      const on = sp(f, fps);
      const tag = sp(f, fps, tagAt, { damping: 9, stiffness: 200, mass: 0.6 });
      const cart = interpolate(f, [cartAt, cartAt + 36], [-300, 1300], clamp);
      return (
        <Float f={f} amp={3}>
          <div style={{ position: "absolute", left: 60, right: 60, top: 640, height: 26, background: "linear-gradient(#b0b0b0,#6b6b6b)", borderRadius: 6, boxShadow: "0 14px 30px rgba(0,0,0,0.5)" }} />
          <div style={{ position: "absolute", left: 60, right: 60, top: 250, height: 14, background: "linear-gradient(#b0b0b0,#6b6b6b)", borderRadius: 6 }} />
          {[CX - 360, CX + 180].map((x, i) => (
            <div key={i} style={{ position: "absolute", left: x, top: 450, width: 180, height: 190, background: "#d4d4d8", borderRadius: 10, opacity: 0.3 * on }} />
          ))}
          <div style={{ position: "absolute", left: CX - 85, top: 290, opacity: on, transform: `translateY(${(1 - on) * 40}px)` }}>
            <Phone w={170}>
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(160deg,#27272a,#111)" }} />
            </Phone>
          </div>
          <div style={{ position: "absolute", left: CX + 40, top: 520, width: 270, transform: `rotate(-8deg) scale(${tag > 0.997 ? 1 : 1.6 - 0.6 * tag})`, opacity: Math.min(1, tag * 2), background: "#facc15", borderRadius: 10, padding: "12px 16px", textAlign: "center", boxShadow: "0 10px 24px rgba(0,0,0,0.45)", border: "4px dashed #b45309" }}>
            <div style={{ color: "#b91c1c", fontSize: 30, fontWeight: 900, letterSpacing: 2 }}>PROMOÇÃO</div>
            <div style={{ color: "#111", fontSize: 58, fontWeight: 900, letterSpacing: -2 }}>{price}</div>
          </div>
          <div style={{ position: "absolute", left: cart, top: 700, opacity: f >= cartAt ? 1 : 0 }}>
            <ShoppingCart size={150} color="#e5e7eb" strokeWidth={1.6} />
          </div>
          <Snd at={2} name="pop" k="shelf" vol={0.3} />
          <Snd at={tagAt} name="thud" k="promo-tag" />
          <Snd at={cartAt} name="step" v={1} vol={0.25} />
        </Float>
      );
    }}
  </Stage>
);

// ============ 2. palco de keynote: o celular sobe, nome e preço ============
export const KeynoteReveal: React.FC<{ life: number; name: string; nameAt: number; price: string; priceAt: number }> = ({ life, name, nameAt, price, priceAt }) => (
  <Stage life={life} bg="#000">
    {(f, fps) => {
      const rise = sp(f, fps, 2, { damping: 18, stiffness: 70, mass: 1.1 });
      const rot = interpolate(f, [0, 60], [-35, 0], { ...clamp, easing: Easing.out(Easing.cubic) });
      const nm = sp(f, fps, nameAt);
      const pr = sp(f, fps, priceAt);
      return (
        <>
          <div style={{ position: "absolute", left: CX - 420, top: -80, width: 840, height: 1100, background: "radial-gradient(50% 60% at 50% 30%, rgba(255,255,255,0.22), rgba(255,255,255,0) 70%)", opacity: rise }} />
          <div style={{ position: "absolute", left: CX - 110, top: 190 + (1 - rise) * 500, perspective: 900, opacity: Math.min(1, rise * 2) }}>
            <div style={{ transform: `rotateY(${rot.toFixed(2)}deg)` }}>
              <Phone w={220} glow={rise}>
                <div style={{ position: "absolute", inset: 0, background: SCREEN_NEW }} />
              </Phone>
            </div>
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 690, textAlign: "center", color: "#fff", fontFamily: THIN, fontSize: 84, fontWeight: 300, letterSpacing: -1, opacity: nm, transform: `translateY(${(1 - nm) * 20}px)` }}>{name}</div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 800, textAlign: "center", fontFamily: THIN, fontSize: 48, fontWeight: 300, color: "rgba(255,255,255,0.8)", opacity: pr }}>
            a partir de <b style={{ color: "#fff", fontWeight: 600 }}>{price}</b>
          </div>
          <Snd at={2} name="glass" k="keynote" vol={0.35} />
          <Snd at={nameAt} name="pop" k="label" vol={0.3} />
          <Snd at={priceAt} name="ding" k="price" vol={0.3} />
        </>
      );
    }}
  </Stage>
);

// ============ 3. maquininha: 12x sem juros, aprovado; "desconto?" riscado ============
export const CardMachine: React.FC<{ life: number; installAt: number; approvedAt: number; strikeAt: number }> = ({ life, installAt, approvedAt, strikeAt }) => (
  <Stage life={life}>
    {(f, fps) => {
      const on = sp(f, fps);
      const ins = sp(f, fps, installAt);
      const ok = sp(f, fps, approvedAt, { damping: 10, stiffness: 200, mass: 0.6 });
      const st = interpolate(f, [strikeAt, strikeAt + 10], [0, 1], clamp);
      return (
        <Float f={f}>
          <div style={{ position: "absolute", left: CX - 280, top: 190, width: 400, height: 640, borderRadius: 50, background: "linear-gradient(160deg,#2a2a2e,#141416)", boxShadow: "0 30px 80px rgba(0,0,0,0.6)", opacity: on, transform: `translateY(${(1 - on) * 60}px) rotate(-3deg)` }}>
            <div style={{ position: "absolute", left: 30, right: 30, top: 40, height: 300, borderRadius: 18, background: "#e7f0e3", padding: 22, fontFamily: MONO, color: "#1f2d1c" }}>
              <div style={{ fontSize: 26 }}>CRÉDITO</div>
              <div style={{ fontSize: 46, fontWeight: 800, marginTop: 20, opacity: ins }}>12x</div>
              <div style={{ fontSize: 30, opacity: ins }}>sem juros</div>
              <div style={{ marginTop: 22, display: "flex", alignItems: "center", gap: 10, color: "#15803d", fontSize: 34, fontWeight: 800, opacity: ok, transform: `scale(${ok > 0.997 ? 1 : 1.3 - 0.3 * ok})`, transformOrigin: "0% 50%" }}>
                <Check size={40} strokeWidth={4} /> APROVADO
              </div>
            </div>
            <div style={{ position: "absolute", left: 50, right: 50, top: 380, display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} style={{ height: 52, borderRadius: 12, background: "#3f3f46" }} />
              ))}
            </div>
          </div>
          <div style={{ position: "absolute", left: CX + 150, top: 320, transform: "rotate(8deg)", opacity: sp(f, fps, strikeAt - 8) }}>
            <span style={{ position: "relative", color: "#fff", fontSize: 54, fontWeight: 900 }}>
              desconto?
              <span style={{ position: "absolute", left: -6, top: "50%", height: 8, width: `calc(${(st * 100).toFixed(1)}% + 12px)`, background: ZALE.red, borderRadius: 4, opacity: st > 0.01 ? 1 : 0 }} />
            </span>
          </div>
          <Snd at={2} name="pop" k="machine" vol={0.3} />
          <Snd at={installAt} name="click" k="keypad" />
          <Snd at={approvedAt} name="ding" k="approved" vol={0.35} />
          <SndSpan at={strikeAt} dur={10} name="write" vol={0.3} />
        </Float>
      );
    }}
  </Stage>
);

// ============ 4. o holofote apaga, a luz fria de escritório acende ============
export const LightsOff: React.FC<{ life: number; offAt: number; officeAt: number }> = ({ life, offAt, officeAt }) => (
  <Stage life={life} bg="#000">
    {(f) => {
      const spot = 1 - interpolate(f, [offAt, offAt + 6], [0, 1], clamp);
      const fl = f < officeAt ? 0 : f < officeAt + 4 ? 1 : f < officeAt + 7 ? 0.2 : f < officeAt + 9 ? 1 : f < officeAt + 12 ? 0.3 : 1;
      return (
        <>
          <div style={{ position: "absolute", left: CX - 420, top: -80, width: 840, height: 1100, background: "radial-gradient(50% 60% at 50% 30%, rgba(255,255,255,0.22), rgba(255,255,255,0) 70%)", opacity: spot }} />
          <div style={{ position: "absolute", left: CX - 90, top: 260, opacity: spot }}>
            <Phone w={180}>
              <div style={{ position: "absolute", inset: 0, background: SCREEN_NEW }} />
            </Phone>
          </div>
          <div style={{ position: "absolute", inset: 0, opacity: fl, background: "linear-gradient(#cfd8dc, #9aa7ad)" }}>
            {[200, 540, 880].map((x) => (
              <div key={x} style={{ position: "absolute", left: x - 130, top: 40, width: 260, height: 26, background: "#f8fafc", boxShadow: "0 0 50px 10px rgba(240,249,255,0.9)" }} />
            ))}
            <div style={{ position: "absolute", left: 120, right: 120, top: 620, height: 30, background: "#8d6e63", borderRadius: 6 }} />
            <div style={{ position: "absolute", left: CX - 200, top: 380, width: 400, height: 240, background: "#263238", borderRadius: 12, border: "10px solid #37474f", boxSizing: "border-box" }}>
              <div style={{ position: "absolute", inset: 20, background: "#eceff1", borderRadius: 4 }}>
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} style={{ height: 10, margin: "14px 16px", background: "#b0bec5", borderRadius: 3, width: `${80 - i * 9}%` }} />
                ))}
              </div>
            </div>
            <div style={{ position: "absolute", left: 0, right: 0, top: 720, textAlign: "center", color: "#37474f", fontSize: 46, fontWeight: 800 }}>o jeito da maioria</div>
          </div>
          <Snd at={offAt} name="switch" k="light-off" />
          <Snd at={officeAt} name="click" k="fluorescent" />
        </>
      );
    }}
  </Stage>
);

// ============ 5. PDF de 40 páginas, preço na última ============
export const PdfScroll: React.FC<{ life: number; scrollAt: number; lastAt: number; pages?: number; price?: string }> = ({ life, scrollAt, lastAt, pages = 40, price = "R$ 12.000" }) => (
  <Stage life={life}>
    {(f, fps) => {
      const on = sp(f, fps);
      const t = interpolate(f, [scrollAt, lastAt], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
      const page = Math.max(1, Math.round(1 + (pages - 1) * t));
      const last = f >= lastAt;
      const hl = sp(f, fps, lastAt + 3);
      const W = 700;
      return (
        <Float f={f} amp={4}>
          <div style={{ position: "absolute", left: CX - W / 2, top: 180, width: W, height: 700, borderRadius: 18, background: "#3c3c3f", boxShadow: "0 30px 80px rgba(0,0,0,0.6)", overflow: "hidden", opacity: on }}>
            <div style={{ height: 60, background: "#2b2b2e", display: "flex", alignItems: "center", gap: 14, padding: "0 20px", color: "#e5e7eb", fontSize: 24 }}>
              <FileText size={28} color={ZALE.redBright} /> proposta_final_v3.pdf
              <span style={{ marginLeft: "auto", fontFamily: MONO, fontSize: 24 }}>
                {page} / {pages}
              </span>
            </div>
            <div style={{ position: "absolute", left: 60, right: 60, top: 90, bottom: 30, background: "#fff", padding: 30, overflow: "hidden" }}>
              {!last ? (
                <div style={{ transform: `translateY(${(-((t * 3000) % 120)).toFixed(1)}px)` }}>
                  {Array.from({ length: 16 }).map((_, i) => (
                    <div key={i} style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 18 }}>
                      <div style={{ width: 30, fontFamily: MONO, color: "#9ca3af", fontSize: 18 }}>{((page * 3 + i) % 40) + 1}.</div>
                      <div style={{ height: 12, background: "#d1d5db", borderRadius: 3, width: `${60 + ((i * 29) % 35)}%` }} />
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ paddingTop: 140, textAlign: "center" }}>
                  <div style={{ color: "#6b7280", fontSize: 30 }}>investimento total</div>
                  <div style={{ display: "inline-block", marginTop: 16, padding: "6px 20px", background: `rgba(250,204,21,${(0.8 * hl).toFixed(2)})`, color: "#111", fontSize: 84, fontWeight: 900, letterSpacing: -2 }}>{price}</div>
                </div>
              )}
            </div>
          </div>
          {Array.from({ length: 8 }).map((_, i) => (
            <Snd key={i} at={scrollAt + Math.round((lastAt - scrollAt) * Math.sqrt((i + 1) / 9))} name="tick" v={i % 2 ? 4 : 0} vol={0.12 + 0.01 * i} />
          ))}
          <Snd at={lastAt + 3} name="thud" k="price-last" vol={0.14} />
        </Float>
      );
    }}
  </Stage>
);

// ============ 6. e-mail: "Qualquer dúvida, estou à disposição" ============
export const EmailSign: React.FC<{ life: number; text: string; typeAt: number; typeDur: number }> = ({ life, text, typeAt, typeDur }) => (
  <Stage life={life}>
    {(f, fps) => {
      const on = sp(f, fps);
      return (
        <Float f={f}>
          <div style={{ position: "absolute", left: CX - 380, top: 220, width: 760, borderRadius: 20, background: "#fff", boxShadow: "0 30px 80px rgba(0,0,0,0.6)", overflow: "hidden", opacity: on, transform: `translateY(${(1 - on) * 40}px)` }}>
            <div style={{ background: "#f3f4f6", padding: "18px 26px", color: "#374151", fontSize: 26, display: "grid", gap: 8 }}>
              <div>
                <b>Para:</b> cliente@empresa.com
              </div>
              <div>
                <b>Assunto:</b> Proposta comercial
              </div>
            </div>
            <div style={{ padding: "26px 30px 34px", color: "#111", fontSize: 34, lineHeight: 1.35 }}>
              <div style={{ color: "#6b7280" }}>Segue em anexo a proposta.</div>
              <div style={{ margin: "14px 0", display: "inline-flex", alignItems: "center", gap: 10, background: "#fee2e2", color: "#991b1b", padding: "8px 14px", borderRadius: 10, fontSize: 26 }}>
                <FileText size={26} /> proposta_final_v3.pdf
              </div>
              <div style={{ fontWeight: 700, marginTop: 10 }}>
                <Typed text={text} f={f} at={typeAt} dur={typeDur} cursor />
              </div>
            </div>
          </div>
          <Snd at={2} name="pop" k="email" vol={0.3} />
          <SndSpan at={typeAt} dur={typeDur} name="type" vol={0.2} />
        </Float>
      );
    }}
  </Stage>
);

// ============ 7. três dias depois: "Conseguiu dar uma olhadinha?" no vácuo ============
export const DaysChat: React.FC<{ life: number; flipAt: number; chatAt: number; text: string; typeDur: number }> = ({ life, flipAt, chatAt, text, typeDur }) => (
  <Stage life={life}>
    {(f, fps) => {
      const days = ["seg", "ter", "qua", "qui"];
      const d = Math.min(3, Math.max(0, Math.floor((f - flipAt) / 8) + 1));
      const cal = 1 - ease(f, chatAt - 4, chatAt + 6);
      const ch = sp(f, fps, chatAt);
      const sent = f >= chatAt + typeDur + 2;
      return (
        <Float f={f}>
          <div style={{ position: "absolute", left: CX - 170, top: 230, width: 340, height: 380, borderRadius: 24, background: "#fff", overflow: "hidden", boxShadow: "0 24px 60px rgba(0,0,0,0.5)", opacity: cal, transform: `scale(${0.9 + 0.1 * cal})` }}>
            <div style={{ height: 100, background: ZALE.red, color: "#fff", fontSize: 44, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center" }}>{days[f < flipAt ? 0 : d]}</div>
            <div style={{ fontSize: 170, fontWeight: 900, textAlign: "center", color: "#111", marginTop: 20 }}>{12 + (f < flipAt ? 0 : d)}</div>
          </div>
          <Pill text="3 dias depois" top={660} on={cal * sp(f, fps, flipAt)} red={false} />
          <div style={{ position: "absolute", left: CX - 260, top: 200, width: 520, height: 620, borderRadius: 50, background: "#0b141a", border: "8px solid #2b2b2b", overflow: "hidden", opacity: ch, transform: `translateY(${(1 - ch) * 60}px)` }}>
            <div style={{ height: 80, background: "#1f2c34", display: "flex", alignItems: "center", gap: 14, padding: "0 20px", color: "#fff", fontSize: 26, fontWeight: 800 }}>
              <div style={{ width: 50, height: 50, borderRadius: 25, background: "#3f3f46", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <User size={28} color="#fff" />
              </div>
              cliente
            </div>
            {sent ? (
              <div style={{ position: "absolute", right: 18, top: 120, maxWidth: 400, background: "#005c4b", color: "#e9edef", fontSize: 30, padding: "14px 18px 30px", borderRadius: "16px 4px 16px 16px" }}>
                {text}
                <div style={{ position: "absolute", right: 12, bottom: 6, fontSize: 16, color: "rgba(255,255,255,0.6)" }}>09:14 ✓✓</div>
              </div>
            ) : null}
            <div style={{ position: "absolute", left: 12, right: 12, bottom: 16, minHeight: 64, background: "#1f2c34", borderRadius: 32, padding: "16px 22px", color: "#e9edef", fontSize: 26, boxSizing: "border-box" }}>
              {!sent ? <Typed text={text} f={f} at={chatAt} dur={typeDur} cursor /> : <span style={{ color: "rgba(255,255,255,0.4)" }}>Mensagem</span>}
            </div>
          </div>
          {[0, 1, 2].map((i) => (
            <Snd key={i} at={flipAt + i * 8} name="tick" v={i % 2 ? 4 : 0} vol={0.2} />
          ))}
          <SndSpan at={chatAt} dur={typeDur} name="type" vol={0.18} />
          <Snd at={chatAt + typeDur + 2} name="pop" k="wa-send" vol={0.3} />
        </Float>
      );
    }}
  </Stage>
);

// ============ 8. objeção -> "10% de desconto" colado na etiqueta ============
export const DiscountTag: React.FC<{ life: number; objectionAt: number; objection?: string; offerAt: number; offer: string; offerDur: number; stickAt: number; price?: string }> = ({
  life,
  objectionAt,
  objection = "tá meio caro...",
  offerAt,
  offer,
  offerDur,
  stickAt,
  price = "R$ 12.000",
}) => (
  <Stage life={life}>
    {(f, fps) => {
      const on = sp(f, fps);
      const ob = sp(f, fps, objectionAt);
      const of = sp(f, fps, offerAt);
      const st = sp(f, fps, stickAt, { damping: 9, stiffness: 220, mass: 0.6 });
      return (
        <Float f={f}>
          <div style={{ position: "absolute", left: CX - 320, top: 220, width: 480, height: 230, opacity: on, transform: "rotate(-3deg)" }}>
            <svg width={480} height={230} viewBox="0 0 480 230" style={{ position: "absolute", inset: 0, filter: "drop-shadow(0 16px 30px rgba(0,0,0,0.5))" }}>
              <path d="M70 10 L470 10 Q476 10 476 16 L476 214 Q476 220 470 220 L70 220 L8 115 Z" fill="#fff" />
              <circle cx={62} cy={115} r={14} fill="#111" />
            </svg>
            <div style={{ position: "absolute", left: 110, right: 20, top: 0, bottom: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#111", fontSize: 76, fontWeight: 900, letterSpacing: -3, whiteSpace: "nowrap" }}>{price}</div>
            {st > 0 ? (
              <div style={{ position: "absolute", right: -150, top: -40, width: 150, height: 150, borderRadius: 75, background: ZALE.red, color: "#fff", fontSize: 58, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", transform: `rotate(14deg) scale(${st > 0.997 ? 1 : 1.8 - 0.8 * st})`, opacity: Math.min(1, st * 2), boxShadow: "0 12px 30px rgba(0,0,0,0.5)" }}>
                -10%
              </div>
            ) : null}
          </div>
          <div style={{ position: "absolute", left: 80, top: 500, maxWidth: 520, background: "#27272a", color: "#fff", fontSize: 36, padding: "16px 22px", borderRadius: "4px 20px 20px 20px", opacity: ob, transform: `translateY(${(1 - ob) * 20}px)` }}>
            <div style={{ fontSize: 20, color: "rgba(255,255,255,0.55)", marginBottom: 4 }}>cliente</div>
            {objection}
          </div>
          <div style={{ position: "absolute", right: 80, top: 640, maxWidth: 640, background: "#005c4b", color: "#fff", fontSize: 34, padding: "16px 22px", borderRadius: "20px 4px 20px 20px", opacity: of, transform: `translateY(${(1 - of) * 20}px)` }}>
            <div style={{ fontSize: 20, color: "rgba(255,255,255,0.6)", marginBottom: 4 }}>vendedor</div>
            <Typed text={offer} f={f} at={offerAt} dur={offerDur} />
          </div>
          <Snd at={2} name="pop" k="price-tag" vol={0.3} />
          <Snd at={objectionAt} name="pop" k="bubble-in" vol={0.28} />
          <SndSpan at={offerAt} dur={offerDur} name="type" vol={0.18} />
          <Snd at={stickAt} name="thud" k="sticker" vol={0.16} />
        </Float>
      );
    }}
  </Stage>
);

// ============ 9. caixa de liquidação: o cliente vai embora ============
export const ClearanceBox: React.FC<{ life: number; dropAt?: number; leaveAt: number }> = ({ life, dropAt = 4, leaveAt }) => (
  <Stage life={life}>
    {(f, fps) => {
      const drop = sp(f, fps, dropAt, { damping: 12, stiffness: 150, mass: 0.8 });
      const cur = interpolate(f, [leaveAt, leaveAt + 24], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
      return (
        <Float f={f}>
          <div style={{ position: "absolute", left: CX - 90, top: 170 + drop * 250, opacity: Math.min(1, drop * 3) }}>
            <Phone w={180} dim={0.3}>
              <div style={{ position: "absolute", inset: 0, background: SCREEN_NEW }} />
            </Phone>
          </div>
          <div style={{ position: "absolute", left: CX - 250, top: 520, width: 500, height: 330, background: "linear-gradient(#c8a36a,#a47b43)", borderRadius: 8, boxShadow: "0 30px 70px rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ transform: "rotate(-6deg)", border: "6px solid #b91c1c", color: "#b91c1c", fontSize: 64, fontWeight: 900, padding: "6px 22px", letterSpacing: 2 }}>LIQUIDAÇÃO</div>
          </div>
          <svg width={70} height={90} viewBox="0 0 24 30" style={{ position: "absolute", left: CX + 180 + cur * 500, top: 360 - cur * 160, opacity: 1 - Math.max(0, cur - 0.7) / 0.3 }}>
            <path d="M2 2 L2 24 L8 18 L12 28 L16 26 L12 16 L20 16 Z" fill="#fff" stroke="#111" strokeWidth={1.5} />
          </svg>
          <Snd at={dropAt + 6} name="thud" k="box-drop" vol={0.14} />
          <Snd at={leaveAt} name="tick" v={5} vol={0.18} />
        </Float>
      );
    }}
  </Stage>
);

// ============ 10. "por quê?" em cima do preço + medidor de valor vazio ============
export const WhyValue: React.FC<{ life: number; qAt: number; meterAt: number; price?: string }> = ({ life, qAt, meterAt, price = "R$ 12.000" }) => (
  <Stage life={life}>
    {(f, fps) => {
      const on = sp(f, fps);
      const q = sp(f, fps, qAt, { damping: 9, stiffness: 190, mass: 0.7 });
      const m = sp(f, fps, meterAt);
      const needle = interpolate(f, [meterAt, meterAt + 20], [0, 0.06], clamp);
      return (
        <Float f={f}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 200, textAlign: "center", color: "#fff", fontSize: 110, fontWeight: 900, letterSpacing: -3, opacity: on }}>{price}</div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 330, textAlign: "center", color: ZALE.redBright, fontSize: 150, fontWeight: 900, opacity: q, transform: `scale(${q > 0.997 ? 1 : 1.6 - 0.6 * q}) rotate(-4deg)` }}>por quê?</div>
          <div style={{ position: "absolute", left: CX - 300, top: 620, width: 600, opacity: m }}>
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 32, fontWeight: 800, marginBottom: 12 }}>valor percebido</div>
            <div style={{ height: 44, borderRadius: 22, background: "rgba(255,255,255,0.1)", border: "3px solid rgba(255,255,255,0.25)", overflow: "hidden" }}>
              <div style={{ width: `${(needle * 100).toFixed(1)}%`, height: "100%", background: ZALE.red }} />
            </div>
          </div>
          <Snd at={qAt} name="error" k="why" vol={0.3} />
          <Snd at={meterAt} name="tick" v={0} vol={0.18} />
        </Float>
      );
    }}
  </Stage>
);

// ============ 11. lista técnica encolhe até sobrar só o número ============
export const SpecShrink: React.FC<{ life: number; listAt: number; collapseAt: number; price?: string }> = ({ life, listAt, collapseAt, price = "R$ 12.000" }) => (
  <Stage life={life}>
    {(f, fps) => {
      const specs = ["chip de última geração", "tela 6,3”", "128 GB", "câmera 48 MP", "5G", "Wi-Fi 7", "USB-C", "titânio", "IP68", "bateria o dia todo"];
      const c = ease(f, collapseAt, collapseAt + 12);
      const pr = sp(f, fps, collapseAt + 8, { damping: 10, stiffness: 190, mass: 0.7 });
      return (
        <Float f={f}>
          <div style={{ position: "absolute", left: CX - 300, top: 190, width: 600, transform: `scaleY(${(1 - c).toFixed(3)})`, transformOrigin: "50% 40%", opacity: 1 - c }}>
            {specs.map((s, i) => {
              const t = sp(f, fps, listAt + i * 2);
              return (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, color: "#e5e7eb", fontSize: 32, padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.12)", opacity: t, transform: `translateX(${(1 - t) * -30}px)` }}>
                  <span>{s}</span>
                  <span style={{ color: "rgba(255,255,255,0.4)" }}>✓</span>
                </div>
              );
            })}
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 420, textAlign: "center", color: "#fff", fontSize: 150, fontWeight: 900, letterSpacing: -5, opacity: Math.min(1, pr * 2), transform: `scale(${pr > 0.997 ? 1 : 1.5 - 0.5 * pr})` }}>{price}</div>
          {[0, 3, 6, 9].map((i) => (
            <Snd key={i} at={listAt + i * 2} name="tick" v={i % 2 ? 4 : 0} vol={0.14} />
          ))}
          <Snd at={collapseAt + 8} name="thud" k="number" vol={0.15} />
        </Float>
      );
    }}
  </Stage>
);

// ============ 12. conversa só sobre preço + balança pendendo para "caro" ============
export const PriceChatScale: React.FC<{ life: number; bubbles: { text: string; at: number; me?: boolean }[]; tipAt: number }> = ({ life, bubbles, tipAt }) => (
  <Stage life={life}>
    {(f, fps) => {
      const tip = sp(f, fps, tipAt, { damping: 9, stiffness: 120, mass: 0.9 });
      const ang = -18 * tip;
      const gone = ease(f, tipAt - 10, tipAt);
      const pan = (label: string, bg: string, color: string, side: "left" | "right") => (
        <div style={{ position: "absolute", [side]: -20, top: 12, width: 160, textAlign: "center", transform: `rotate(${(-ang).toFixed(2)}deg)`, transformOrigin: "50% 0%" }}>
          <div style={{ height: 70, borderLeft: "3px solid #a1a1aa", borderRight: "3px solid #a1a1aa", width: 80, margin: "0 auto" }} />
          <div style={{ background: bg, color, fontSize: 38, fontWeight: 900, padding: "10px 0", borderRadius: 12 }}>{label}</div>
        </div>
      );
      return (
        <Float f={f}>
          <div style={{ position: "absolute", left: 70, right: 70, top: 190, opacity: 1 - gone * 0.75 }}>
            {bubbles.map((b, i) => {
              const t = sp(f, fps, b.at);
              return (
                <div key={i} style={{ display: "flex", justifyContent: b.me ? "flex-end" : "flex-start", marginBottom: 14, opacity: t, transform: `translateY(${(1 - t) * 16}px)` }}>
                  <div style={{ background: b.me ? "#005c4b" : "#27272a", color: "#fff", fontSize: 36, fontWeight: 700, padding: "12px 22px", borderRadius: 20 }}>{b.text}</div>
                </div>
              );
            })}
          </div>
          <div style={{ position: "absolute", left: CX - 300, top: 560, width: 600, height: 300, opacity: sp(f, fps, tipAt - 8) }}>
            <div style={{ position: "absolute", left: 292, top: 30, width: 16, height: 250, background: "#a1a1aa", borderRadius: 8 }} />
            <div style={{ position: "absolute", left: 200, top: 270, width: 200, height: 20, background: "#71717a", borderRadius: 10 }} />
            <div style={{ position: "absolute", left: 40, top: 30, width: 520, transformOrigin: "50% 50%", transform: `rotate(${ang.toFixed(2)}deg)` }}>
              <div style={{ height: 12, background: "#d4d4d8", borderRadius: 6 }} />
              {pan("caro", ZALE.red, "#fff", "left")}
              {pan("valor", "#3f3f46", "rgba(255,255,255,0.7)", "right")}
            </div>
          </div>
          {bubbles.map((b, i) => (
            <Snd key={i} at={b.at} name="pop" k="price-bubble" vol={0.24} />
          ))}
          <Snd at={tipAt} name="thud" k="scale-tip" vol={0.14} />
        </Float>
      );
    }}
  </Stage>
);

// ============ 13. ficha técnica rasgada ============
export const SpecTear: React.FC<{ life: number; tearAt: number }> = ({ life, tearAt }) => (
  <Stage life={life}>
    {(f, fps) => {
      const on = sp(f, fps);
      const t = interpolate(f, [tearAt, tearAt + 14], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
      const half = (side: -1 | 1) => (
        <div style={{ position: "absolute", left: side < 0 ? CX - 300 : CX, top: 200, width: 300, height: 600, overflow: "hidden", transform: `translate(${(side * t * 90).toFixed(1)}px, ${(t * 40).toFixed(1)}px) rotate(${(side * t * 12).toFixed(2)}deg)`, transformOrigin: side < 0 ? "100% 0%" : "0% 0%", opacity: on * (1 - Math.max(0, t - 0.6) * 1.2) }}>
          <div style={{ position: "absolute", left: side < 0 ? 0 : -300, top: 0, width: 600, height: 600, background: "#fff", padding: 40, boxSizing: "border-box" }}>
            <div style={{ fontSize: 44, fontWeight: 900, color: "#111" }}>Especificações técnicas</div>
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} style={{ height: 14, background: "#d1d5db", borderRadius: 4, margin: "20px 0", width: `${70 + ((i * 23) % 28)}%` }} />
            ))}
          </div>
        </div>
      );
      return (
        <Float f={f}>
          {half(-1)}
          {half(1)}
          <Pill text="não vende especificação" top={830} on={sp(f, fps, tearAt + 6)} />
          <Snd at={2} name="pop" k="sheet" vol={0.28} />
          <SndSpan at={tearAt} dur={12} name="write" vol={0.35} />
        </Float>
      );
    }}
  </Stage>
);

// ============ 14. o seu próprio celular: lupa + memória cheia + bateria 5% + foto borrada ============
export const PhoneProblems: React.FC<{ life: number; lensAt: number; storageAt: number; batteryAt: number; photoAt: number }> = ({ life, lensAt, storageAt, batteryAt, photoAt }) => (
  <Stage life={life}>
    {(f, fps) => {
      const on = sp(f, fps);
      const lens = sp(f, fps, lensAt);
      const lensX = interpolate(f, [lensAt, lensAt + 50], [CX - 240, CX + 20], { ...clamp, easing: Easing.inOut(Easing.quad) });
      const phase = f >= photoAt ? 3 : f >= batteryAt ? 2 : f >= storageAt ? 1 : 0;
      const pIn = sp(f, fps, [0, storageAt, batteryAt, photoAt][phase], { damping: 12, stiffness: 180, mass: 0.7 });
      const labels = ["", "memória que vive cheia", "bateria que não chega ao fim do dia", "foto que nunca fica boa"];
      const focus = Math.abs(Math.sin((f - photoAt) / 5)) * 10;
      return (
        <Float f={f}>
          <div style={{ position: "absolute", left: CX - 170, top: 150, opacity: on }}>
            <Phone w={340}>
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(160deg,#1f2937,#0f172a)" }}>
                <div style={{ position: "absolute", left: 30, right: 30, top: 70, display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 22 }}>
                  {Array.from({ length: 16 }).map((_, i) => (
                    <div key={i} style={{ height: 58, borderRadius: 14, background: ["#ef4444", "#22c55e", "#3b82f6", "#f59e0b", "#a855f7", "#14b8a6"][i % 6], opacity: 0.85 }} />
                  ))}
                </div>
                {phase === 1 ? (
                  <div style={{ position: "absolute", left: 22, right: 22, top: 250, background: "rgba(250,250,250,0.96)", borderRadius: 22, padding: 20, textAlign: "center", transform: `scale(${0.8 + 0.2 * lock(pIn)})`, opacity: pIn }}>
                    <HardDrive size={40} color="#111" />
                    <div style={{ fontSize: 24, fontWeight: 800, color: "#111", marginTop: 6 }}>Armazenamento quase cheio</div>
                    <div style={{ height: 14, borderRadius: 7, background: "#e5e7eb", marginTop: 12, overflow: "hidden" }}>
                      <div style={{ width: `${(85 + 13 * lock(pIn)).toFixed(0)}%`, height: "100%", background: "#ef4444" }} />
                    </div>
                  </div>
                ) : null}
                {phase === 2 ? (
                  <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.78)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", opacity: pIn }}>
                    <div style={{ color: "#fff", fontSize: 50, fontWeight: 300, fontFamily: THIN }}>16:02</div>
                    <BatteryLow size={120} color="#ef4444" strokeWidth={1.5} />
                    <div style={{ color: "#ef4444", fontSize: 44, fontWeight: 800 }}>5%</div>
                  </div>
                ) : null}
                {phase === 3 ? (
                  <div style={{ position: "absolute", inset: 0, background: "#000", opacity: pIn }}>
                    <div style={{ position: "absolute", left: 20, right: 20, top: 90, bottom: 140, borderRadius: 10, background: "linear-gradient(160deg,#fbbf24,#f472b6 60%,#60a5fa)", filter: `blur(${(6 + focus).toFixed(1)}px)` }} />
                    <div style={{ position: "absolute", left: "50%", top: 250, width: 110, height: 110, marginLeft: -55, border: "3px solid #facc15", transform: `scale(${1 + focus / 40})` }} />
                    <div style={{ position: "absolute", left: "50%", bottom: 40, width: 80, height: 80, marginLeft: -40, borderRadius: 40, border: "6px solid #fff", boxSizing: "border-box" }} />
                  </div>
                ) : null}
              </div>
            </Phone>
          </div>
          {phase === 0 ? (
            <div style={{ position: "absolute", left: lensX, top: 340, opacity: lens }}>
              <Search size={220} color="#e5e7eb" strokeWidth={1.4} />
            </div>
          ) : null}
          {phase > 0 ? <Pill text={labels[phase]} top={880} on={pIn} size={36} /> : null}
          <Snd at={lensAt} name="glass" k="lens" vol={0.3} />
          <Snd at={storageAt} name="error" k="storage" vol={0.3} />
          <Snd at={batteryAt} name="error" k="battery" vol={0.3} />
          <Snd at={photoAt} name="click" k="shutter" />
        </Float>
      );
    }}
  </Stage>
);

// ============ 15. celular velho trincado apaga, o novo acende ============
export const OldVsNew: React.FC<{ life: number; newAt: number; dimAt: number }> = ({ life, newAt, dimAt }) => (
  <Stage life={life}>
    {(f, fps) => {
      const on = sp(f, fps);
      const nw = sp(f, fps, newAt, { damping: 14, stiffness: 120, mass: 0.9 });
      const dim = ease(f, dimAt, dimAt + 18);
      return (
        <Float f={f}>
          <div style={{ position: "absolute", left: CX - 330, top: 260, opacity: on, transform: `scale(${1 - 0.1 * dim})` }}>
            <Phone w={240} cracked dim={0.2 + 0.6 * dim}>
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(160deg,#334155,#1e293b)" }} />
            </Phone>
            <div style={{ textAlign: "center", color: "rgba(255,255,255,0.6)", fontSize: 32, fontWeight: 800, marginTop: 14 }}>o seu</div>
          </div>
          <div style={{ position: "absolute", left: CX + 80, top: 200 + (1 - nw) * 120, opacity: Math.min(1, nw * 2) }}>
            <Phone w={250} glow={nw}>
              <div style={{ position: "absolute", inset: 0, background: SCREEN_NEW }} />
            </Phone>
            <div style={{ textAlign: "center", color: "#fff", fontSize: 32, fontWeight: 800, marginTop: 14 }}>o novo</div>
          </div>
          <Snd at={2} name="pop" k="old-phone" vol={0.26} />
          <Snd at={newAt} name="glass" k="new-phone" vol={0.3} />
          <Snd at={dimAt} name="switch" k="old-dim" vol={0.3} />
        </Float>
      );
    }}
  </Stage>
);

// ============ 16. o holofote vira para "você" ============
export const SpotlightYou: React.FC<{ life: number; turnAt: number }> = ({ life, turnAt }) => (
  <Stage life={life} bg="#000">
    {(f, fps) => {
      const t = ease(f, turnAt - 10, turnAt + 6);
      const x = interpolate(t, [0, 1], [CX - 260, CX]);
      const you = sp(f, fps, turnAt);
      return (
        <>
          <div style={{ position: "absolute", left: x - 360, top: -80, width: 720, height: 1100, background: "radial-gradient(45% 55% at 50% 60%, rgba(255,255,255,0.3), rgba(255,255,255,0) 70%)" }} />
          <div style={{ position: "absolute", left: CX - 110, top: 330, opacity: 0.25 + 0.75 * you, transform: `scale(${0.9 + 0.1 * you})` }}>
            <User size={220} color="#fff" strokeWidth={1.3} />
          </div>
          <Pill text="você" top={620} on={you} size={64} />
          <Snd at={turnAt} name="switch" k="spot" vol={0.32} />
        </>
      );
    }}
  </Stage>
);

// ============ 17. caixa de ferramentas cheia de perguntas ============
export const QuestionToolbox: React.FC<{ life: number; openAt: number }> = ({ life, openAt }) => (
  <Stage life={life}>
    {(f, fps) => {
      const on = sp(f, fps);
      const op = ease(f, openAt, openAt + 10);
      return (
        <Float f={f}>
          {[0, 1, 2].map((i) => {
            const q = sp(f, fps, openAt + 6 + i * 4, { damping: 10, stiffness: 180, mass: 0.7 });
            return (
              <div key={i} style={{ position: "absolute", left: CX - 170 + i * 130, top: 470 - q * (250 + (i % 2) * 70), color: i === 1 ? ZALE.redBright : "#fff", fontSize: 150, fontWeight: 900, opacity: Math.min(1, q * 2), transform: `rotate(${(i - 1) * 14}deg)` }}>
                ?
              </div>
            );
          })}
          <div style={{ position: "absolute", left: CX - 260, top: 520, width: 520, height: 260, background: "linear-gradient(#dc2626,#991b1b)", borderRadius: 18, boxShadow: "0 30px 70px rgba(0,0,0,0.6)", opacity: on }}>
            <div style={{ position: "absolute", left: 0, right: 0, top: -30, height: 60, background: "linear-gradient(#ef4444,#b91c1c)", borderRadius: 14, transformOrigin: "0% 100%", transform: `rotate(${(-105 * op).toFixed(1)}deg)` }} />
            <div style={{ position: "absolute", left: 0, right: 0, top: 90, display: "flex", justifyContent: "center" }}>
              <Wrench size={80} color="rgba(255,255,255,0.85)" />
            </div>
          </div>
          <Snd at={2} name="pop" k="toolbox" vol={0.28} />
          <Snd at={openAt} name="click" k="latch" />
          <Snd at={openAt + 6} name="pop" k="q-out" vol={0.26} />
        </Float>
      );
    }}
  </Stage>
);

// ============ 18. botão "Enviar proposta" riscado vira pergunta ============
export const SendToAsk: React.FC<{ life: number; strikeAt: number; askAt: number }> = ({ life, strikeAt, askAt }) => (
  <Stage life={life}>
    {(f, fps) => {
      const on = sp(f, fps);
      const st = interpolate(f, [strikeAt, strikeAt + 10], [0, 1], clamp);
      const ask = sp(f, fps, askAt, { damping: 11, stiffness: 190, mass: 0.7 });
      return (
        <Float f={f}>
          <div style={{ position: "absolute", left: CX - 260, top: 280, width: 520, height: 130, borderRadius: 65, background: "#2563eb", color: "#fff", fontSize: 50, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", gap: 18, opacity: on * (1 - ask * 0.6), transform: `scale(${1 - 0.15 * ask})` }}>
            <Send size={46} /> Enviar proposta
            <div style={{ position: "absolute", left: 20, top: "50%", height: 12, width: `${(st * 480).toFixed(0)}px`, background: ZALE.red, borderRadius: 6, opacity: st > 0.01 ? 1 : 0 }} />
          </div>
          <div style={{ position: "absolute", left: CX - 330, top: 500, width: 660, whiteSpace: "nowrap", textAlign: "center", background: "#fff", color: ZALE.ink, borderRadius: "30px 30px 30px 6px", padding: "30px 34px", fontSize: 50, fontWeight: 900, boxSizing: "border-box", opacity: ask, transform: `translateY(${(1 - ask) * 30}px)` }}>
            Me conta uma coisa... <span style={{ color: ZALE.red }}>?</span>
          </div>
          <Snd at={2} name="pop" k="send-btn" vol={0.26} />
          <SndSpan at={strikeAt} dur={10} name="write" vol={0.3} />
          <Snd at={askAt} name="pop" k="ask" vol={0.3} />
        </Float>
      );
    }}
  </Stage>
);

// ============ 19. as 3 perguntas em cartões (a última com 31/12) ============
export const QuestionCards: React.FC<{ life: number; cards: { text: string; at: number }[]; calAt?: number }> = ({ life, cards, calAt }) => (
  <Stage life={life}>
    {(f, fps) => {
      const cal = calAt !== undefined ? sp(f, fps, calAt, { damping: 10, stiffness: 200, mass: 0.6 }) : 0;
      return (
        <Float f={f}>
          {cards.map((c, i) => {
            const t = sp(f, fps, c.at, { damping: 14, stiffness: 160, mass: 0.8 });
            const next = i + 1 < cards.length ? sp(f, fps, cards[i + 1].at) : 0;
            return (
              <div key={i} style={{ position: "absolute", left: CX - 380, top: 190 + i * 190, width: 760, boxSizing: "border-box", background: "#fff", borderRadius: 24, padding: "26px 30px", display: "flex", gap: 22, alignItems: "center", boxShadow: "0 20px 50px rgba(0,0,0,0.5)", opacity: t * (1 - next * 0.35), transform: `translateX(${((1 - t) * (i % 2 ? 300 : -300)).toFixed(1)}px) rotate(${(i - 1) * 1.5}deg)` }}>
                <div style={{ width: 70, height: 70, borderRadius: 35, background: ZALE.red, color: "#fff", fontSize: 40, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>{i + 1}</div>
                <div style={{ color: ZALE.ink, fontSize: 40, fontWeight: 800, lineHeight: 1.15 }}>{c.text}</div>
              </div>
            );
          })}
          {calAt !== undefined ? (
            <div style={{ position: "absolute", right: 70, top: 740, width: 170, borderRadius: 16, overflow: "hidden", background: "#fff", boxShadow: "0 14px 30px rgba(0,0,0,0.5)", opacity: Math.min(1, cal * 2), transform: `rotate(8deg) scale(${cal > 0.997 ? 1 : 1.5 - 0.5 * cal})` }}>
              <div style={{ background: ZALE.red, color: "#fff", fontSize: 28, fontWeight: 900, textAlign: "center", padding: 6 }}>DEZ</div>
              <div style={{ color: "#111", fontSize: 80, fontWeight: 900, textAlign: "center" }}>31</div>
            </div>
          ) : null}
          {cards.map((c, i) => (
            <Snd key={i} at={c.at} name="pop" k="q-card" vol={0.28} />
          ))}
          {calAt !== undefined ? <Snd at={calAt} name="tick" v={5} vol={0.22} /> : null}
        </Float>
      );
    }}
  </Stage>
);

// ============ 20. o cliente responde (e diz o que precisa) ============
export const ClientTyping: React.FC<{ life: number; typeAt: number; highlights: number[] }> = ({ life, typeAt, highlights }) => (
  <Stage life={life}>
    {(f, fps) => {
      const on = sp(f, fps);
      const lines = [88, 72, 94, 60, 82];
      const shown = Math.min(lines.length, Math.max(0, Math.floor((f - typeAt) / 5) + 1));
      const h1 = highlights.length ? f >= highlights[0] : false;
      const h2 = highlights.length > 1 ? f >= highlights[1] : false;
      return (
        <Float f={f}>
          <div style={{ position: "absolute", left: CX - 280, top: 170, width: 560, height: 680, borderRadius: 50, background: "#0b141a", border: "8px solid #2b2b2b", overflow: "hidden", opacity: on }}>
            <div style={{ height: 80, background: "#1f2c34", display: "flex", alignItems: "center", gap: 14, padding: "0 20px", color: "#fff", fontSize: 26, fontWeight: 800 }}>
              <div style={{ width: 50, height: 50, borderRadius: 25, background: "#3f3f46", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <User size={28} color="#fff" />
              </div>
              cliente <span style={{ fontSize: 18, fontWeight: 400, color: "rgba(255,255,255,0.6)" }}>{f >= typeAt && shown < lines.length ? "digitando..." : "online"}</span>
            </div>
            <div style={{ position: "absolute", left: 18, top: 110, width: 440, background: "#1f2c34", borderRadius: "4px 18px 18px 18px", padding: "18px 20px", opacity: f >= typeAt ? 1 : 0 }}>
              {lines.slice(0, shown).map((w, i) => {
                const hi = (i === 1 && h1) || (i === 3 && h2);
                return <div key={i} style={{ height: 18, width: `${w}%`, margin: "10px 0", borderRadius: 5, background: hi ? "#facc15" : "rgba(255,255,255,0.35)", boxShadow: hi ? "0 0 16px rgba(250,204,21,0.6)" : undefined }} />;
              })}
            </div>
          </div>
          <Pill text="é ele que te diz o que precisa" top={880} on={highlights.length ? sp(f, fps, highlights[highlights.length - 1]) : 0} size={36} />
          {Array.from({ length: lines.length }).map((_, i) => (
            <Snd key={i} at={typeAt + i * 5} name="tick" v={i % 2 ? 4 : 0} vol={0.12} />
          ))}
          {highlights.map((h, i) => (
            <SndSpan key={i} at={h} dur={10} name="write" vol={0.22} />
          ))}
        </Float>
      );
    }}
  </Stage>
);

// ============ 21. a lista de características vira a resposta ao problema ============
export const ProposalMorph: React.FC<{ life: number; listAt: number; morphAt: number }> = ({ life, listAt, morphAt }) => (
  <Stage life={life}>
    {(f, fps) => {
      const on = sp(f, fps);
      const m = ease(f, morphAt, morphAt + 16);
      const flip = m < 0.5 ? m * 180 : (m - 1) * 180;
      const W = 640;
      return (
        <Float f={f}>
          <div style={{ position: "absolute", left: CX - W / 2, top: 180, width: W, height: 680, perspective: 1400, opacity: on }}>
            <div style={{ position: "absolute", inset: 0, background: "#fff", borderRadius: 16, padding: "34px 40px", boxShadow: "0 30px 80px rgba(0,0,0,0.6)", transform: `rotateY(${flip.toFixed(1)}deg)` }}>
              {m < 0.5 ? (
                <>
                  <div style={{ fontSize: 40, fontWeight: 900, color: "#111" }}>Características</div>
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} style={{ display: "flex", gap: 12, alignItems: "center", margin: "22px 0", opacity: sp(f, fps, listAt + i * 2) }}>
                      <div style={{ width: 16, height: 16, borderRadius: 8, background: "#9ca3af", flex: "none" }} />
                      <div style={{ height: 14, flex: 1, background: "#d1d5db", borderRadius: 4, maxWidth: `${60 + ((i * 31) % 35)}%` }} />
                    </div>
                  ))}
                </>
              ) : (
                <>
                  <div style={{ fontSize: 26, fontWeight: 800, color: ZALE.red, letterSpacing: 2 }}>PROPOSTA</div>
                  <div style={{ fontSize: 46, fontWeight: 900, color: "#111", lineHeight: 1.1, marginTop: 8 }}>A resposta pro que você me contou</div>
                  <div style={{ marginTop: 30, borderLeft: `6px solid ${ZALE.red}`, paddingLeft: 20, fontFamily: HAND, fontSize: 34, color: "#374151", lineHeight: 1.3 }}>“o problema que você quer resolver”</div>
                  {["o que muda pra você", "em quanto tempo", "o próximo passo"].map((t, i) => (
                    <div key={i} style={{ display: "flex", gap: 14, alignItems: "center", marginTop: 26, fontSize: 34, fontWeight: 700, color: "#111", opacity: sp(f, fps, morphAt + 16 + i * 4) }}>
                      <Check size={34} color="#16a34a" strokeWidth={3.5} /> {t}
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
          <Snd at={2} name="pop" k="doc" vol={0.28} />
          <Snd at={morphAt} name="page" v={0} />
          {[0, 1, 2].map((i) => (
            <Snd key={i} at={morphAt + 16 + i * 4} name="tick" v={i % 2 ? 4 : 0} vol={0.18} />
          ))}
        </Float>
      );
    }}
  </Stage>
);

// ============ 22. balança: sai o concorrente, entra o custo de continuar como está ============
export const CompareScale: React.FC<{ life: number; compAt: number; swapAt: number }> = ({ life, compAt, swapAt }) => (
  <Stage life={life}>
    {(f, fps) => {
      const on = sp(f, fps);
      const cmp = sp(f, fps, compAt);
      const sw = sp(f, fps, swapAt, { damping: 9, stiffness: 110, mass: 0.9 });
      const ang = interpolate(sw, [0, 1], [0, 16]);
      const out = ease(f, swapAt - 6, swapAt + 4);
      const pan = (label: React.ReactNode, bg: string, side: "left" | "right") => (
        <div style={{ position: "absolute", [side]: -60, top: 12, width: 250, textAlign: "center", transform: `rotate(${(-ang).toFixed(2)}deg)`, transformOrigin: "50% 0%" }}>
          <div style={{ height: 80, borderLeft: "3px solid #a1a1aa", borderRight: "3px solid #a1a1aa", width: 110, margin: "0 auto" }} />
          <div style={{ background: bg, color: "#fff", fontSize: 32, fontWeight: 900, padding: "16px 10px", borderRadius: 14, lineHeight: 1.1 }}>{label}</div>
        </div>
      );
      return (
        <Float f={f}>
          <div style={{ position: "absolute", left: CX - 330, top: 240, width: 660, height: 560, opacity: on }}>
            <div style={{ position: "absolute", left: 322, top: 60, width: 16, height: 420, background: "#a1a1aa", borderRadius: 8 }} />
            <div style={{ position: "absolute", left: 220, top: 470, width: 220, height: 22, background: "#71717a", borderRadius: 11 }} />
            <div style={{ position: "absolute", left: 60, top: 60, width: 540, transform: `rotate(${ang.toFixed(2)}deg)` }}>
              <div style={{ height: 14, background: "#d4d4d8", borderRadius: 7 }} />
              {pan("seu preço", ZALE.red, "left")}
              {f < swapAt ? (
                <div style={{ opacity: cmp * (1 - out) }}>{pan("preço do concorrente", "#3f3f46", "right")}</div>
              ) : (
                pan(
                  <>
                    custo de
                    <br />
                    continuar
                    <br />
                    como está
                  </>,
                  "#111827",
                  "right",
                )
              )}
            </div>
          </div>
          <Snd at={2} name="pop" k="scale-in" vol={0.26} />
          <Snd at={compAt} name="pop" k="competitor" vol={0.26} />
          <Snd at={swapAt} name="thud" k="scale-swap" vol={0.16} />
        </Float>
      );
    }}
  </Stage>
);

// ============ 23 e 24. fila na porta: a loja no lançamento / você com as perguntas certas ============
export const DoorQueue: React.FC<{ life: number; door: string; queueAt?: number; checkAt?: number; red?: boolean; label?: string }> = ({ life, door, queueAt = 4, checkAt, red, label = "já chega convencido" }) => (
  <Stage life={life}>
    {(f, fps) => {
      const on = sp(f, fps);
      const ck = checkAt !== undefined ? sp(f, fps, checkAt, { damping: 10, stiffness: 200, mass: 0.6 }) : 0;
      return (
        <Float f={f} amp={3}>
          <div style={{ position: "absolute", left: CX + 170, top: 250, width: 260, height: 500, background: red ? "linear-gradient(#dc2626,#7f1d1d)" : "linear-gradient(#e5e7eb,#9ca3af)", borderRadius: "16px 16px 0 0", boxShadow: "0 0 80px rgba(255,255,255,0.25)", opacity: on }}>
            <div style={{ position: "absolute", left: -40, right: -40, top: -70, textAlign: "center", color: "#fff", fontSize: 42, fontWeight: 900 }}>{door}</div>
            <div style={{ position: "absolute", left: 30, right: 30, top: 30, bottom: 0, background: "rgba(255,255,255,0.18)", borderRadius: 10 }} />
          </div>
          {Array.from({ length: 6 }).map((_, i) => {
            const t = sp(f, fps, queueAt + i * 3);
            return (
              <div key={i} style={{ position: "absolute", left: CX + 40 - i * 110, top: 540 - (i % 2) * 10, opacity: t, transform: `translateX(${(1 - t) * -80}px)` }}>
                <User size={130} color={i === 0 ? "#fff" : "rgba(255,255,255,0.7)"} strokeWidth={1.6} />
                {checkAt !== undefined && ck > 0 ? (
                  <div style={{ position: "absolute", left: 40, top: -46, width: 50, height: 50, borderRadius: 25, background: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${Math.min(1, ck * (1 + i * 0.1))})` }}>
                    <Check size={32} color="#fff" strokeWidth={3.5} />
                  </div>
                ) : null}
              </div>
            );
          })}
          <Pill text={label} top={800} on={checkAt !== undefined ? ck : sp(f, fps, queueAt + 20)} size={40} />
          {[0, 2, 4].map((i) => (
            <Snd key={i} at={queueAt + i * 3} name="step" v={i % 2 ? 1 : 3} vol={0.22} />
          ))}
          {checkAt !== undefined ? <Snd at={checkAt} name="ding" k="checks" vol={0.3} /> : <Snd at={queueAt + 20} name="pop" k="label" vol={0.28} />}
        </Float>
      );
    }}
  </Stage>
);

// ============ 25. CTA: o loop infinito de follow-up quebra ============
export const FollowLoopCta: React.FC<{ life: number; loopAt: number; breakAt: number; handle: string; dailyAt: number }> = ({ life, loopAt, breakAt, handle, dailyAt }) => (
  <Stage life={life}>
    {(f, fps) => {
      const on = sp(f, fps);
      const brk = ease(f, breakAt, breakAt + 12);
      const rot = f >= loopAt ? ((f - loopAt) * 3 * (1 - brk)) % 360 : 0;
      const hd = sp(f, fps, breakAt + 8);
      const dl = sp(f, fps, dailyAt);
      const msgs = ["Conseguiu ver?", "Alguma novidade?", "Passando pra lembrar...", "Oi! Tudo bem?"];
      return (
        <Float f={f}>
          <div style={{ position: "absolute", left: CX - 260, top: 200, width: 520, height: 520, opacity: on * (1 - brk) }}>
            <svg width={520} height={520} viewBox="0 0 520 520" style={{ position: "absolute", inset: 0, transform: `rotate(${rot}deg)` }}>
              <circle cx={260} cy={260} r={220} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={12} strokeDasharray="60 30" />
            </svg>
            {msgs.map((m, i) => {
              const a = (i / msgs.length) * Math.PI * 2 + (rot * Math.PI) / 180;
              return (
                <div key={i} style={{ position: "absolute", left: 260 + Math.cos(a) * 220 - 130, top: 260 + Math.sin(a) * 220 - 28, width: 260, textAlign: "center", background: "#005c4b", color: "#fff", fontSize: 24, fontWeight: 700, padding: "10px 8px", borderRadius: 16 }}>
                  {m}
                </div>
              );
            })}
            <div style={{ position: "absolute", left: 0, right: 0, top: 200, textAlign: "center", color: "#fff", fontSize: 96, fontWeight: 900 }}>∞</div>
          </div>
          {brk > 0 && brk < 1
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} style={{ position: "absolute", left: CX + Math.cos(i) * 200, top: 460 + brk * 300 + Math.sin(i) * 120, width: 60, height: 14, background: "rgba(255,255,255,0.5)", transform: `rotate(${i * 40 + brk * 200}deg)`, opacity: 1 - brk }} />
              ))
            : null}
          <div style={{ position: "absolute", left: 0, right: 0, top: 330, textAlign: "center", opacity: hd, transform: `scale(${0.8 + 0.2 * lock(hd)})` }}>
            <span style={{ background: "#fff", color: ZALE.ink, fontSize: 66, fontWeight: 900, padding: "18px 40px", borderRadius: 60 }}>{handle}</span>
          </div>
          <Pill text="conteúdo de vendas todo dia" top={520} on={dl} size={42} />
          <Snd at={loopAt} name="tick" v={0} vol={0.16} />
          <Snd at={breakAt} name="error" k="loop-break" vol={0.3} />
          <Snd at={breakAt + 8} name="pop" k="handle" vol={0.32} />
          <Snd at={dailyAt} name="pop" k="label" vol={0.28} />
        </Float>
      );
    }}
  </Stage>
);
