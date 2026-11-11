import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { Snd } from "./palco";
import { FONT } from "./overlays";
import { AD, SERIF } from "./legenda-anuncio";

export { AD, SERIF, AdCaptions } from "./legenda-anuncio";

// LINGUAGEM DE ANÚNCIO PREMIUM (anúncio Meta da ZALE, 2026-10-07): apresentador em tela cheia (layout "full")
// e, em alguns trechos, a tela vira uma cena premium inteira (Ad*Screen). Estilo da landing de estética:
// tons de pele/champanhe sobre escuro quente, palavra-chave em Bodoni itálico, vidro, cantos arredondados,
// vermelho ZALE só como detalhe. Movimentos que assentam (sem mola), nada exagerado.
// Tempos em QUADROS relativos à cena (o registry converte `at`, `...At` e `dur` de segundos).

const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
const eout = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
const eio = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
const bob = (f: number, i = 0, amp = 5) => Math.sin((f + i * 17) / 26) * amp;

// ---------- base ----------
// Texto que entra desfocando (blur -> nítido) e subindo pouco.
const Rise: React.FC<{ f: number; at: number; dy?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ f, at, dy = 26, children, style }) => {
  const k = eout(f, at, at + 14);
  return <div style={{ opacity: k, filter: `blur(${((1 - k) * 10).toFixed(2)}px)`, transform: `translate3d(0, ${((1 - k) * dy).toFixed(2)}px, 0)`, ...style }}>{children}</div>;
};

// Saída suave de qualquer cena (últimos quadros).
const useOut = (life: number, n = 9) => {
  const f = useCurrentFrame();
  return 1 - eio(f, life - n, life);
};

// Tela premium inteira por cima do apresentador. Transição "íris": um círculo abre do centro com um aro de luz
// cor de pele (entrada, 11 quadros) e fecha no fim (saída, 9 quadros). Dentro, a câmera nunca para: aproxima
// devagar a cena toda e a luz de fundo passeia (dinamismo pedido pelo usuário em 2026-10-07).
export const AdScreen: React.FC<{ life: number; cx?: number; cy?: number; children: (f: number) => React.ReactNode }> = ({ life, cx = 540, cy = 860, children }) => {
  const f = useCurrentFrame();
  const inn = eout(f, 0, 11);
  const out = eio(f, life - 9, life);
  const R = 2300;
  const r = R * inn * (1 - out);
  const drift = 1.0 + 0.045 * (f / Math.max(1, life));
  const lx = 50 + Math.sin(f / 40) * 18;
  const ly = 24 + Math.cos(f / 52) * 8;
  const ring = inn < 1 || out > 0 ? 1 : 0;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, fontFamily: FONT }}>
      <div style={{ position: "absolute", inset: 0, clipPath: `circle(${r.toFixed(1)}px at ${cx}px ${cy}px)` }}>
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(90% 70% at 50% 34%, ${AD.bg1} 0%, ${AD.bg0} 72%)` }} />
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(55% 35% at ${lx.toFixed(1)}% ${ly.toFixed(1)}%, rgba(232,200,184,0.20) 0%, rgba(232,200,184,0) 70%)` }} />
        <div style={{ position: "absolute", inset: 0, transform: `scale(${(drift * (1.06 - 0.06 * inn)).toFixed(4)})`, transformOrigin: "50% 42%", filter: `blur(${((1 - inn) * 8 + out * 6).toFixed(2)}px)` }}>{children(f)}</div>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(120% 90% at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)" }} />
      </div>
      {ring ? (
        <div style={{ position: "absolute", left: cx - r, top: cy - r, width: r * 2, height: r * 2, borderRadius: "50%", border: `${(3 + 5 * (1 - inn + out)).toFixed(1)}px solid rgba(244,220,205,${(0.85 * (1 - inn) + 0.85 * out).toFixed(3)})`, boxShadow: `0 0 60px rgba(244,220,205,${(0.6 * (1 - inn) + 0.6 * out).toFixed(3)})` }} />
      ) : null}
      <Snd at={0} name="pop" k="adscreen" vol={0.3} />
    </div>
  );
};

const Eyebrow: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontFamily: "'Geist Mono', monospace", fontSize: 24, letterSpacing: 6, textTransform: "uppercase", color: AD.mute }}>{children}</div>
);

const Glass: React.FC<{ style?: React.CSSProperties; children?: React.ReactNode }> = ({ style, children }) => (
  <div
    style={{
      background: "linear-gradient(160deg, rgba(255,244,236,0.11) 0%, rgba(255,244,236,0.04) 100%)",
      border: `1.5px solid ${AD.line}`,
      borderRadius: 34,
      boxShadow: "0 30px 80px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.12)",
      ...style,
    }}
  >
    {children}
  </div>
);

// ---------- sobreposições no rosto (sem fundo) ----------
const TopVeil: React.FC<{ op: number }> = ({ op }) => (
  <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 640, opacity: op, background: "linear-gradient(180deg, rgba(12,9,8,0.62) 0%, rgba(12,9,8,0.32) 55%, rgba(12,9,8,0) 100%)" }} />
);

// Título elegante no topo, por cima do apresentador. `lines`: texto em sans; `serif` = linha em Bodoni itálico.
export const AdTitle: React.FC<{ life: number; top?: number; lines: { text: string; at: number; serif?: boolean; size?: number; strikeAt?: number }[] }> = ({ life, top = 230, lines }) => {
  const f = useCurrentFrame();
  const out = useOut(life);
  return (
    <>
    <TopVeil op={eout(f, 0, 10) * out} />
    <div style={{ position: "absolute", left: 60, right: 60, top, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, opacity: out, transform: `translate3d(0, ${bob(f).toFixed(2)}px, 0)` }}>
      {lines.map((l, i) => {
        const size = l.size ?? (l.serif ? 104 : 54);
        const st = l.strikeAt !== undefined ? eout(f, l.strikeAt, l.strikeAt + 9) : 0;
        return (
          <Rise key={i} f={f} at={l.at}>
            <div
              style={{
                position: "relative",
                fontFamily: l.serif ? SERIF : FONT,
                fontStyle: l.serif ? "italic" : "normal",
                fontWeight: l.serif ? 500 : 700,
                fontSize: size,
                letterSpacing: l.serif ? -1 : -0.5,
                lineHeight: 1.05,
                color: l.serif ? AD.champagne : "#fff",
                textAlign: "center",
                textShadow: "0 4px 30px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.8)",
                opacity: st ? 1 - st * 0.45 : 1,
              }}
            >
              {l.text}
              {st > 0 ? <div style={{ position: "absolute", left: -8, top: "54%", height: Math.max(5, size * 0.07), width: `calc(${(st * 100).toFixed(1)}% + 16px)`, background: AD.red, borderRadius: 4 }} /> : null}
            </div>
            <Snd at={l.at} name="tick" k="adtitle" vol={0.34} />
            {l.strikeAt !== undefined ? <Snd at={l.strikeAt} file="pen_stroke.wav" name="tick" vol={0.32} /> : null}
          </Rise>
        );
      })}
    </div>
    </>
  );
};

// Etiquetas de vidro em fila (sobre o rosto, no topo).
export const AdChips: React.FC<{ life: number; top?: number; chips: { text: string; at: number }[] }> = ({ life, top = 250, chips }) => {
  const f = useCurrentFrame();
  const out = useOut(life);
  return (
    <>
    <TopVeil op={eout(f, 0, 10) * out * 0.8} />
    <div style={{ position: "absolute", left: 40, right: 40, top, display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 18, opacity: out }}>
      {chips.map((c, i) => {
        const k = eout(f, c.at, c.at + 12);
        return (
          <div key={i} style={{ opacity: k, transform: `translate3d(0, ${((1 - k) * 30 + bob(f, i, 4)).toFixed(2)}px, 0) scale(${(0.92 + 0.08 * k).toFixed(4)})`, filter: `blur(${((1 - k) * 8).toFixed(2)}px)` }}>
            <div
              style={{
                padding: "18px 30px",
                borderRadius: 999,
                background: "rgba(20,15,13,0.55)",
                border: `1.5px solid rgba(244,231,221,0.28)`,
                backdropFilter: "blur(14px)",
                color: AD.champagne,
                fontSize: 42,
                fontWeight: 600,
                letterSpacing: -0.4,
                boxShadow: "0 14px 40px rgba(0,0,0,0.35)",
              }}
            >
              {c.text}
            </div>
            <Snd at={c.at} name="tick" k="adchip" vol={0.36} />
          </div>
        );
      })}
    </div>
    </>
  );
};

// ---------- telas inteiras ----------
// Agenda: dezembro lotado vira janeiro esvaziando.
export const AdCalendar: React.FC<{ life: number; fillAt?: number; flipAt?: number }> = ({ life, fillAt = 4, flipAt = 60 }) => (
  <AdScreen life={life}>
    {(f) => {
      const flip = eio(f, flipAt, flipAt + 14);
      const cols = 5;
      const rows = 4;
      const cells = Array.from({ length: cols * rows }, (_, i) => i);
      // ordem pseudo-aleatória estável para encher e esvaziar
      const ord = (i: number) => (i * 7 + 3) % (cols * rows);
      const keep = new Set([2, 11, 17]);
      return (
        <div style={{ position: "absolute", left: 90, right: 90, top: 560 }}>
          <div style={{ position: "relative", height: 150 }}>
            {["Dezembro", "Janeiro"].map((m, j) => {
              const op = j === 0 ? 1 - Math.min(1, flip * 2) : Math.max(0, flip * 2 - 1);
              return (
                <div key={m} style={{ position: "absolute", left: 0, right: 0, opacity: op, transform: `translate3d(0, ${((j === 0 ? -flip : 1 - flip) * 24).toFixed(2)}px, 0)` }}>
                  <Eyebrow>{j === 0 ? "agenda cheia" : "agenda vazia"}</Eyebrow>
                  <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 110, color: AD.champagne, lineHeight: 1.1 }}>{m}</div>
                </div>
              );
            })}
          </div>
          <Glass style={{ marginTop: 40, padding: 34, transform: `translate3d(0, ${bob(f).toFixed(2)}px, 0)` }}>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 16 }}>
              {["S", "T", "Q", "Q", "S"].map((d, i) => (
                <div key={i} style={{ textAlign: "center", fontFamily: "'Geist Mono', monospace", fontSize: 22, color: AD.mute, paddingBottom: 6 }}>{d}</div>
              ))}
              {cells.map((i) => {
                const fi = eout(f, fillAt + ord(i) * 1.6, fillAt + ord(i) * 1.6 + 8);
                const drain = keep.has(i) ? 0 : eio(f, flipAt + 4 + ord(i) * 0.9, flipAt + 12 + ord(i) * 0.9);
                const on = fi * (1 - drain);
                return (
                  <div key={i} style={{ height: 118, borderRadius: 20, border: `1.5px solid ${AD.line}`, position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", inset: 8, borderRadius: 12, background: `linear-gradient(135deg, ${AD.skin} 0%, #d6a995 100%)`, opacity: on, transform: `scale(${(0.7 + 0.3 * on).toFixed(4)})` }} />
                  </div>
                );
              })}
            </div>
          </Glass>
          <Snd at={fillAt} name="tick" k="adcal" vol={0.32} />
          <Snd at={flipAt} name="switch" k="adcal" vol={0.36} />
        </div>
      );
    }}
  </AdScreen>
);

// Instalação em 90 dias: contador + linha do tempo outubro -> janeiro.
export const AdNinety: React.FC<{ life: number; countAt?: number; teamAt?: number; months?: string[] }> = ({ life, countAt = 8, teamAt = 150, months = ["Out", "Nov", "Dez", "Jan"] }) => (
  <AdScreen life={life}>
    {(f) => {
      const c = eio(f, countAt, countAt + 70);
      const n = Math.round(90 * c);
      const prog = eio(f, countAt, countAt + 70);
      return (
        <div style={{ position: "absolute", left: 90, right: 90, top: 640, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <Rise f={f} at={2}>
            <Eyebrow>o comercial instalado em</Eyebrow>
          </Rise>
          <div style={{ display: "flex", alignItems: "baseline", gap: 22, marginTop: 10, transform: `translate3d(0, ${bob(f).toFixed(2)}px, 0)` }}>
            <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 300, lineHeight: 1, color: AD.champagne, fontVariantNumeric: "tabular-nums", minWidth: 330, textAlign: "right" }}>{n}</div>
            <div style={{ fontSize: 76, fontWeight: 600, color: AD.champagne, letterSpacing: -1 }}>dias</div>
          </div>
          <div style={{ position: "relative", width: "100%", height: 150, marginTop: 70 }}>
            <div style={{ position: "absolute", left: 40, right: 40, top: 36, height: 3, background: AD.line, borderRadius: 2 }} />
            <div style={{ position: "absolute", left: 40, top: 36, height: 3, width: `calc((100% - 80px) * ${prog.toFixed(4)})`, background: `linear-gradient(90deg, ${AD.skin}, ${AD.red})`, borderRadius: 2 }} />
            {months.map((m, i) => {
              const p = i / (months.length - 1);
              const lit = prog >= p - 0.001 ? 1 : 0;
              const k = eout(f, countAt + p * 70 - 2, countAt + p * 70 + 6);
              const last = i === months.length - 1;
              return (
                <div key={m} style={{ position: "absolute", left: `calc(40px + (100% - 80px) * ${p})`, top: 22, transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 16, background: lit ? (last ? AD.red : AD.skin) : AD.bg0, border: `2px solid ${lit ? (last ? AD.red : AD.skin) : AD.line}`, transform: `scale(${(1 + 0.25 * k * (1 - eout(f, countAt + p * 70 + 6, countAt + p * 70 + 16))).toFixed(3)})`, boxShadow: lit && last ? "0 0 30px rgba(216,40,16,0.6)" : "none" }} />
                  <div style={{ fontSize: 34, fontWeight: 600, color: lit ? AD.champagne : AD.mute }}>{m}</div>
                  <Snd at={Math.round(countAt + p * 70)} name="tick" k="adninety" vol={0.34} />
                </div>
              );
            })}
          </div>
          <Rise f={f} at={teamAt} style={{ marginTop: 40 }}>
            <Glass style={{ padding: "22px 40px", borderRadius: 999 }}>
              <div style={{ fontSize: 40, color: AD.champagne, fontWeight: 500 }}>
                junto com <span style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 50 }}>você</span> e a sua equipe
              </div>
            </Glass>
            <Snd at={teamAt} name="pop" k="adninety" vol={0.32} />
          </Rise>
        </div>
      );
    }}
  </AdScreen>
);

// Protocolos geradores de caixa: card de protocolo + curva de caixa subindo (sem número).
export const AdCash: React.FC<{ life: number; layers?: string[]; layerAt?: number; cashAt?: number }> = ({ life, layers = ["Reativação da base", "Oferta de entrada", "Upsell na consulta", "Script de direct"], layerAt = 10, cashAt = 60 }) => (
  <AdScreen life={life}>
    {(f) => {
      const draw = eio(f, cashAt, cashAt + 40);
      const W = 820;
      const H = 230;
      const pts = [0, 0.08, 0.12, 0.26, 0.32, 0.5, 0.6, 0.82, 1].map((y, i, a) => [(i / (a.length - 1)) * W, H - y * (H - 30)] as const);
      const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
      const area = `${d} L${W},${H} L0,${H} Z`;
      const len = 1400;
      return (
        <div style={{ position: "absolute", left: 90, right: 90, top: 560 }}>
          <Rise f={f} at={2}>
            <Eyebrow>logo nos primeiros dias</Eyebrow>
            <div style={{ fontSize: 76, fontWeight: 700, color: "#fff", letterSpacing: -1.5, lineHeight: 1.05, marginTop: 10 }}>
              Protocolos geradores de <span style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 500, color: AD.skin }}>caixa</span>
            </div>
          </Rise>
          <Glass style={{ marginTop: 44, padding: 34, transform: `translate3d(0, ${bob(f).toFixed(2)}px, 0)` }}>
            {/* estruturas prontas de venda rápida: nome aparece, conteúdo fica "trancado" (gostinho, sem entregar) */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {layers.map((l, i) => {
                const k = eout(f, layerAt + i * 7, layerAt + i * 7 + 12);
                const shine = interpolate(f, [layerAt + i * 7 + 6, layerAt + i * 7 + 26], [-40, 140], clamp);
                return (
                  <div key={l} style={{ position: "relative", overflow: "hidden", opacity: k, transform: `translate3d(0, ${((1 - k) * 22).toFixed(2)}px, 0) scale(${(0.94 + 0.06 * k).toFixed(4)})`, padding: "22px 22px 20px", borderRadius: 22, background: AD.glass, border: `1.5px solid ${AD.line}`, textAlign: "left" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <svg width={30} height={30} viewBox="0 0 24 24" fill="none" stroke={AD.skin} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <rect x="4" y="11" width="16" height="10" rx="2.5" />
                        <path d="M8 11V7.5a4 4 0 0 1 8 0V11" />
                      </svg>
                      <div style={{ fontSize: 31, fontWeight: 700, color: AD.champagne, letterSpacing: -0.4 }}>{l}</div>
                    </div>
                    <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8, filter: "blur(5px)", opacity: 0.55 }}>
                      <div style={{ height: 10, width: "88%", borderRadius: 5, background: AD.skin }} />
                      <div style={{ height: 10, width: "64%", borderRadius: 5, background: AD.skin }} />
                    </div>
                    <div style={{ position: "absolute", top: 0, bottom: 0, left: `${shine}%`, width: "30%", background: "linear-gradient(100deg, rgba(255,255,255,0) 0%, rgba(255,244,236,0.18) 50%, rgba(255,255,255,0) 100%)" }} />
                    <Snd at={layerAt + i * 7} name="tick" k="adcash" vol={0.34} />
                  </div>
                );
              })}
            </div>
            <svg width={W} height={H + 10} viewBox={`0 -10 ${W} ${H + 10}`} style={{ marginTop: 34, overflow: "visible" }}>
              <defs>
                <linearGradient id="adcashg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={AD.skin} stopOpacity={0.45} />
                  <stop offset="100%" stopColor={AD.skin} stopOpacity={0} />
                </linearGradient>
                <clipPath id="adcashc">
                  <rect x={0} y={-20} width={W * draw} height={H + 40} />
                </clipPath>
              </defs>
              {[0.25, 0.5, 0.75].map((y) => (
                <line key={y} x1={0} x2={W} y1={H * y} y2={H * y} stroke={AD.line} strokeWidth={1.5} strokeDasharray="6 10" />
              ))}
              <path d={area} fill="url(#adcashg)" clipPath="url(#adcashc)" />
              <path d={d} fill="none" stroke={AD.skin} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={len} strokeDashoffset={len * (1 - draw)} />
              {draw > 0.98 ? <circle cx={W} cy={pts[pts.length - 1][1]} r={12} fill={AD.red} /> : null}
            </svg>
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "'Geist Mono', monospace", fontSize: 22, color: AD.mute, marginTop: 8 }}>
              <span>semana 1</span>
              <span>caixa</span>
            </div>
            <Snd at={cashAt} name="pop" k="adcash" vol={0.32} />
          </Glass>
        </div>
      );
    }}
  </AdScreen>
);

// CTA: botão de vidro "Agendar diagnóstico" + toque.
export const AdCta: React.FC<{ life: number; text?: string; sub?: string; tapAt?: number; eyebrow?: string; title?: string; serif?: string }> = ({ life, text = "Agendar diagnóstico", sub = "Diagnóstico comercial · conversa com o Paulo", tapAt = 20, eyebrow = "comece agora", title = "Janeiro começa em", serif = "outubro" }) => (
  <AdScreen life={life}>
    {(f) => {
      const press = eout(f, tapAt, tapAt + 4) * (1 - eout(f, tapAt + 4, tapAt + 14));
      const ripple = eout(f, tapAt, tapAt + 26);
      const hand = eout(f, tapAt - 18, tapAt);
      const pulse = 1 + Math.max(0, Math.sin((f - tapAt - 20) / 9)) * 0.02 * (f > tapAt + 20 ? 1 : 0);
      return (
        <div style={{ position: "absolute", left: 90, right: 90, top: 720, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <Rise f={f} at={2}>
            <Eyebrow>{eyebrow}</Eyebrow>
            <div style={{ fontSize: 72, fontWeight: 700, color: "#fff", letterSpacing: -1.5, lineHeight: 1.08, marginTop: 12 }}>
              {title} <span style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 500, color: AD.skin }}>{serif}</span>
            </div>
          </Rise>
          <div style={{ position: "relative", marginTop: 80, transform: `translate3d(0, ${bob(f).toFixed(2)}px, 0) scale(${((1 - press * 0.05) * pulse).toFixed(4)})` }}>
            <div style={{ position: "absolute", left: "50%", top: "50%", width: 700 * ripple, height: 700 * ripple, marginLeft: -350 * ripple, marginTop: -350 * ripple, borderRadius: "50%", border: `2px solid ${AD.skin}`, opacity: (1 - ripple) * 0.8 }} />
            <div style={{ padding: "36px 70px", borderRadius: 999, background: `linear-gradient(135deg, ${AD.champagne} 0%, ${AD.skin} 100%)`, color: AD.bg0, fontSize: 52, fontWeight: 800, letterSpacing: -0.5, boxShadow: "0 30px 70px rgba(232,200,184,0.25), 0 10px 30px rgba(0,0,0,0.5)" }}>{text}</div>
            {/* mão/cursor */}
            <svg width={90} height={90} viewBox="0 0 24 24" style={{ position: "absolute", right: 60, bottom: -70 + (1 - hand) * -40, opacity: hand, transform: `translate3d(${((1 - hand) * 60).toFixed(1)}px, ${((1 - hand) * 80).toFixed(1)}px, 0) scale(${(1 - press * 0.12).toFixed(3)})`, filter: "drop-shadow(0 8px 16px rgba(0,0,0,0.5))" }}>
              <path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V10m0-.5V4.5a1.5 1.5 0 0 1 3 0V10m0-.5V6a1.5 1.5 0 0 1 3 0v7.5a6.5 6.5 0 0 1-6.5 6.5h-.6a6.5 6.5 0 0 1-5.1-2.5L4 15.4a1.6 1.6 0 0 1 2.4-2.1L9 15V11" fill="#fff" stroke={AD.bg0} strokeWidth={1.2} strokeLinejoin="round" />
            </svg>
          </div>
          <Rise f={f} at={tapAt + 10} style={{ marginTop: 70 }}>
            <div style={{ fontSize: 34, color: AD.mute }}>{sub}</div>
          </Rise>
          <Snd at={tapAt} name="click" k="adcta" vol={0.4} />
        </div>
      );
    }}
  </AdScreen>
);

// ---------- pílula com ícone no topo, por cima do rosto (uma por vez, troca no tempo da fala) ----------
type IconC = React.FC<{ size?: number; color?: string; strokeWidth?: number }>;
export const AdPill: React.FC<{ life: number; top?: number; items: { text: string; at: number; icon?: IconC; serif?: string }[] }> = ({ life, top = 270, items }) => {
  const f = useCurrentFrame();
  const out = useOut(life);
  const idx = items.reduce((acc, it, i) => (f >= it.at ? i : acc), -1);
  return (
    <>
      <TopVeil op={eout(f, 0, 10) * out * 0.85} />
      {items.map((it, i) => {
        const k = eout(f, it.at, it.at + 12);
        const gone = i < idx ? eio(f, items[i + 1].at - 2, items[i + 1].at + 6) : 0;
        const op = k * (1 - gone) * out;
        const I = it.icon;
        return (
          <div key={i} style={{ position: "absolute", left: 0, right: 0, top, display: "flex", justifyContent: "center", opacity: op, transform: `translate3d(0, ${((1 - k) * 34 - gone * 24 + bob(f, i, 4)).toFixed(2)}px, 0) scale(${(0.9 + 0.1 * k).toFixed(4)})`, filter: `blur(${((1 - k) * 8 + gone * 6).toFixed(2)}px)` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 22, padding: "20px 36px 20px 22px", borderRadius: 999, background: "rgba(20,15,13,0.55)", border: "1.5px solid rgba(244,231,221,0.3)", backdropFilter: "blur(16px)", boxShadow: "0 18px 50px rgba(0,0,0,0.4)" }}>
              {I ? (
                <div style={{ width: 74, height: 74, borderRadius: 37, background: `linear-gradient(135deg, ${AD.champagne}, ${AD.skin})`, display: "flex", alignItems: "center", justifyContent: "center", transform: `rotate(${((1 - k) * -40).toFixed(1)}deg)` }}>
                  <I size={40} color={AD.bg0} strokeWidth={2.2} />
                </div>
              ) : null}
              <div style={{ fontSize: 46, fontWeight: 700, color: "#fff", letterSpacing: -0.6 }}>
                {it.text}
                {it.serif ? <span style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 500, color: AD.skin, fontSize: 54 }}> {it.serif}</span> : null}
              </div>
            </div>
            <Snd at={it.at} name="pop" k="adpill" vol={0.3} />
          </div>
        );
      })}
    </>
  );
};

// ---------- tela: meses passando até março (a clínica esperando) ----------
export const AdMonths: React.FC<{ life: number; months?: string[]; flips?: number[] }> = ({ life, months = ["Janeiro", "Fevereiro", "Março"], flips = [12, 30] }) => (
  <AdScreen life={life}>
    {(f) => {
      const step = flips.reduce((acc, a) => acc + eio(f, a, a + 10), 0);
      const idx = Math.min(months.length - 1, Math.floor(step + 0.0001));
      const frac = step - Math.floor(step);
      return (
        <div style={{ position: "absolute", left: 90, right: 90, top: 560, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <Rise f={f} at={2}>
            <Eyebrow>a clínica fica esperando</Eyebrow>
          </Rise>
          <div style={{ position: "relative", width: 620, height: 560, marginTop: 40, perspective: 1600 }}>
            {months.map((m, i) => {
              if (i < idx) return null;
              const flipK = i === idx ? frac : 0;
              const last = i === months.length - 1;
              return (
                <div key={m} style={{ position: "absolute", inset: 0, zIndex: months.length - i, transformOrigin: "50% 0%", transform: `rotateX(${(flipK * 105).toFixed(1)}deg)`, opacity: 1 - flipK * 0.9, backfaceVisibility: "hidden" }}>
                  <Glass style={{ position: "absolute", inset: 0, background: "linear-gradient(170deg, #f6ebe3 0%, #e9d3c6 100%)", border: "none" }}>
                    <div style={{ height: 120, borderRadius: "34px 34px 0 0", background: last ? AD.red : "#3a2a24", display: "flex", alignItems: "center", justifyContent: "center", gap: 40 }}>
                      {[0, 1, 2].map((r) => (
                        <div key={r} style={{ width: 22, height: 22, borderRadius: 11, background: "rgba(255,255,255,0.7)" }} />
                      ))}
                    </div>
                    <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 130, color: AD.bg0, marginTop: 110 }}>{m}</div>
                    <div style={{ fontFamily: "'Geist Mono', monospace", fontSize: 26, letterSpacing: 4, color: "rgba(20,15,13,0.55)", marginTop: 26 }}>{last ? "O FATURAMENTO VOLTA?" : "AGENDA PARADA"}</div>
                  </Glass>
                </div>
              );
            })}
          </div>
          {flips.map((a, i) => (
            <Snd key={i} at={a} name="flip" k="admonths" vol={0.32} />
          ))}
        </div>
      );
    }}
  </AdScreen>
);

// ---------- tela: tráfego extra zerado ----------
export const AdTraffic: React.FC<{ life: number; zeroAt?: number }> = ({ life, zeroAt = 30 }) => (
  <AdScreen life={life}>
    {(f) => {
      const z = eio(f, zeroAt - 18, zeroAt);
      const bars = [0.9, 0.7, 1, 0.8, 0.95, 0.75];
      const kz = eout(f, zeroAt, zeroAt + 10);
      return (
        <div style={{ position: "absolute", left: 90, right: 90, top: 600, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <Rise f={f} at={2}>
            <Eyebrow>investimento extra em tráfego pago</Eyebrow>
          </Rise>
          <Glass style={{ width: "100%", marginTop: 40, padding: "40px 46px", transform: `translate3d(0, ${bob(f).toFixed(2)}px, 0)` }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 22, height: 260 }}>
              {bars.map((h, i) => (
                <div key={i} style={{ flex: 1, height: `${(h * (1 - z) * 100 + 3).toFixed(1)}%`, borderRadius: 14, background: `linear-gradient(180deg, ${AD.skin}, rgba(232,200,184,0.25))`, opacity: 0.35 + 0.65 * (1 - z) }} />
              ))}
            </div>
            <div style={{ height: 3, background: AD.line, borderRadius: 2, marginTop: 4 }} />
          </Glass>
          <div style={{ display: "flex", alignItems: "baseline", gap: 18, marginTop: 50, opacity: kz, transform: `translate3d(0, ${((1 - kz) * 30).toFixed(1)}px, 0)` }}>
            <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 190, color: AD.champagne, lineHeight: 1 }}>R$ 0</div>
            <div style={{ fontSize: 60, fontWeight: 700, color: "#fff" }}>a mais</div>
          </div>
          <Snd at={zeroAt} name="ding" k="adtraffic" vol={0.3} />
        </div>
      );
    }}
  </AdScreen>
);

// ---------- tela final: 2026 vira 2027 previsível ----------
export const AdEnd: React.FC<{ life: number; rollAt?: number; wordAt?: number }> = ({ life, rollAt = 4, wordAt = 50 }) => (
  <AdScreen life={life}>
    {(f) => {
      const roll = eio(f, rollAt, rollAt + 16);
      const months = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
      return (
        <div style={{ position: "absolute", left: 90, right: 90, top: 600, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <div style={{ display: "flex", fontFamily: SERIF, fontStyle: "italic", fontSize: 260, color: AD.champagne, lineHeight: 1 }}>
            <span>202</span>
            <span style={{ position: "relative", display: "inline-block", width: 150, height: 270, overflow: "hidden" }}>
              <span style={{ position: "absolute", left: 0, right: 0, top: `${(-roll * 270).toFixed(1)}px` }}>6</span>
              <span style={{ position: "absolute", left: 0, right: 0, top: `${(270 - roll * 270).toFixed(1)}px`, color: AD.skin }}>7</span>
            </span>
          </div>
          <Rise f={f} at={wordAt}>
            <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 140, color: AD.skin, lineHeight: 1.05, marginTop: 10 }}>previsível</div>
          </Rise>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 14, height: 170, marginTop: 70 }}>
            {months.map((m, i) => {
              const k = eout(f, rollAt + 14 + i * 2.5, rollAt + 26 + i * 2.5);
              return (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 46, height: 120 * k, borderRadius: 12, background: `linear-gradient(180deg, ${AD.skin}, rgba(232,200,184,0.35))` }} />
                  <div style={{ fontFamily: "'Geist Mono', monospace", fontSize: 22, color: AD.mute }}>{m}</div>
                </div>
              );
            })}
          </div>
          <Snd at={rollAt} name="tick" k="adend" vol={0.34} />
          <Snd at={wordAt} name="pop" k="adend2" vol={0.3} />
        </div>
      );
    }}
  </AdScreen>
);

// ---------- tela: leads desqualificados + anúncio caro sem resultado ----------
export const AdLeads: React.FC<{ life: number; leadsAt?: number; spendAt?: number; flatAt?: number }> = ({ life, leadsAt = 6, spendAt = 60, flatAt = 90 }) => (
  <AdScreen life={life}>
    {(f) => {
      const msgs = ["Quanto custa?", "Só queria saber o preço", "Faz desconto?", "Oi", "Vocês parcelam em 20x?"];
      const spend = eio(f, spendAt, spendAt + 40);
      const flat = eout(f, flatAt, flatAt + 14);
      return (
        <div style={{ position: "absolute", left: 90, right: 90, top: 470 }}>
          <Rise f={f} at={2}>
            <Eyebrow>chegando no seu whatsapp</Eyebrow>
          </Rise>
          <Glass style={{ marginTop: 26, padding: "18px 26px", transform: `translate3d(0, ${bob(f).toFixed(2)}px, 0)` }}>
            {msgs.map((m, i) => {
              const k = eout(f, leadsAt + i * 6, leadsAt + i * 6 + 10);
              const tag = eout(f, leadsAt + i * 6 + 8, leadsAt + i * 6 + 16);
              return (
                <div key={m} style={{ display: "flex", alignItems: "center", gap: 18, padding: "16px 0", borderBottom: i < msgs.length - 1 ? `1px solid ${AD.line}` : "none", opacity: k, transform: `translate3d(${((1 - k) * 40).toFixed(1)}px, 0, 0)` }}>
                  <div style={{ width: 58, height: 58, borderRadius: 29, background: "rgba(244,231,221,0.12)", display: "flex", alignItems: "center", justifyContent: "center", color: AD.mute, fontSize: 26, fontWeight: 700 }}>{String.fromCharCode(65 + i * 3)}</div>
                  <div style={{ flex: 1, fontSize: 32, color: AD.champagne }}>{m}</div>
                  <div style={{ opacity: tag, padding: "6px 14px", borderRadius: 999, background: "rgba(216,40,16,0.16)", border: "1px solid rgba(216,40,16,0.5)", color: "#ff8a75", fontSize: 20, fontWeight: 700, letterSpacing: 1 }}>DESQUALIFICADO</div>
                  <Snd at={leadsAt + i * 6} name="tick" k="adleads" vol={0.3} />
                </div>
              );
            })}
          </Glass>
          <div style={{ display: "flex", gap: 24, marginTop: 34 }}>
            {[
              { l: "Investimento em anúncio", v: 0.15 + 0.8 * spend, c: AD.skin },
              { l: "Resultado", v: 0.22 * (0.4 + 0.6 * flat), c: AD.red },
            ].map((b, i) => (
              <Glass key={b.l} style={{ flex: 1, padding: "20px 22px" }}>
                <div style={{ fontFamily: "'Geist Mono', monospace", fontSize: 20, color: AD.mute, letterSpacing: 2, textTransform: "uppercase" }}>{b.l}</div>
                <div style={{ height: 16, borderRadius: 8, background: "rgba(244,231,221,0.1)", marginTop: 16, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(b.v * 100).toFixed(1)}%`, borderRadius: 8, background: b.c }} />
                </div>
                <Snd at={i === 0 ? spendAt : flatAt} name="switch" k={`adleads${i}`} vol={0.28} />
              </Glass>
            ))}
          </div>
        </div>
      );
    }}
  </AdScreen>
);

// ---------- tela: iceberg (o tráfego é só a ponta) ----------
export const AdIceberg: React.FC<{ life: number; dropAt?: number; parts?: string[] }> = ({ life, dropAt = 20, parts = ["Posicionamento", "Pré-venda", "Consulta", "Retorno"] }) => (
  <AdScreen life={life} cy={700}>
    {(f) => {
      const cam = eio(f, dropAt, dropAt + 24);
      return (
        <div style={{ position: "absolute", inset: 0, transform: `translate3d(0, ${(-cam * 330).toFixed(1)}px, 0)` }}>
          {/* água */}
          <div style={{ position: "absolute", left: 0, right: 0, top: 820, height: 2000, background: "linear-gradient(180deg, rgba(232,200,184,0.10) 0%, rgba(20,15,13,0.0) 60%)" }} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 818, height: 3, background: `linear-gradient(90deg, rgba(232,200,184,0), ${AD.skin}, rgba(232,200,184,0))`, opacity: 0.7 }} />
          <svg width={1080} height={1500} viewBox="0 0 1080 1500" style={{ position: "absolute", left: 0, top: 520 }}>
            <defs>
              <linearGradient id="icetop" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fbf3ee" />
                <stop offset="100%" stopColor={AD.skin} />
              </linearGradient>
              <linearGradient id="icebot" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(232,200,184,0.55)" />
                <stop offset="100%" stopColor="rgba(232,200,184,0.08)" />
              </linearGradient>
            </defs>
            <polygon points="470,40 560,0 640,90 610,300 450,300" fill="url(#icetop)" />
            <polygon points="450,300 610,300 820,520 900,900 700,1250 380,1260 170,920 250,520" fill="url(#icebot)" stroke="rgba(244,231,221,0.25)" strokeWidth={2} />
          </svg>
          <div style={{ position: "absolute", left: 0, right: 0, top: 380, textAlign: "center", opacity: 1 - cam * 0.3 }}>
            <Eyebrow>o que a agência enxerga</Eyebrow>
            <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 92, color: AD.champagne, marginTop: 8 }}>Tráfego</div>
          </div>
          {parts.map((p, i) => {
            const k = eout(f, dropAt + 18 + i * 7, dropAt + 30 + i * 7);
            return (
              <div key={p} style={{ position: "absolute", left: 0, right: 0, top: 1150 + i * 120, textAlign: "center", opacity: k, transform: `translate3d(0, ${((1 - k) * 24).toFixed(1)}px, 0)` }}>
                <span style={{ padding: "14px 30px", borderRadius: 999, background: "rgba(20,15,13,0.55)", border: `1.5px solid ${AD.line}`, color: AD.champagne, fontSize: 42, fontWeight: 700 }}>{p}</span>
                <Snd at={dropAt + 18 + i * 7} name="tick" k="adice" vol={0.32} />
              </div>
            );
          })}
        </div>
      );
    }}
  </AdScreen>
);

// ---------- tela: pré-venda conduzindo no WhatsApp ----------
export const AdWhats: React.FC<{ life: number; msgs?: { from: "p" | "c"; text: string; at: number }[] }> = ({ life, msgs = [] }) => (
  <AdScreen life={life}>
    {(f) => (
      <div style={{ position: "absolute", left: 130, right: 130, top: 420 }}>
        <Glass style={{ padding: 0, overflow: "hidden", borderRadius: 48, transform: `translate3d(0, ${bob(f).toFixed(2)}px, 0)` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18, padding: "26px 30px", borderBottom: `1px solid ${AD.line}` }}>
            <div style={{ width: 62, height: 62, borderRadius: 31, background: `linear-gradient(135deg, ${AD.champagne}, ${AD.skin})` }} />
            <div>
              <div style={{ fontSize: 32, fontWeight: 700, color: AD.champagne }}>Carla</div>
              <div style={{ fontSize: 22, color: AD.mute }}>nova paciente · Instagram</div>
            </div>
          </div>
          <div style={{ padding: "28px 26px 34px", display: "flex", flexDirection: "column", gap: 16, minHeight: 560 }}>
            {msgs.map((m, i) => {
              const k = eout(f, m.at, m.at + 9);
              const me = m.from === "c";
              return (
                <div key={i} style={{ alignSelf: me ? "flex-end" : "flex-start", maxWidth: "80%", opacity: k, transform: `translate3d(0, ${((1 - k) * 20).toFixed(1)}px, 0) scale(${(0.94 + 0.06 * k).toFixed(3)})`, transformOrigin: me ? "100% 100%" : "0% 100%" }}>
                  <div style={{ padding: "18px 24px", borderRadius: 26, borderBottomRightRadius: me ? 8 : 26, borderBottomLeftRadius: me ? 26 : 8, background: me ? `linear-gradient(135deg, ${AD.champagne}, ${AD.skin})` : "rgba(244,231,221,0.1)", color: me ? AD.bg0 : AD.champagne, fontSize: 31, fontWeight: me ? 600 : 500, lineHeight: 1.25 }}>{m.text}</div>
                  <Snd at={m.at} name="pop" k={me ? "adwhatsC" : "adwhatsP"} vol={0.3} />
                </div>
              );
            })}
          </div>
        </Glass>
      </div>
    )}
  </AdScreen>
);

// ---------- tela: não é curso, não é PDF: a gente faz junto ----------
export const AdNoCourse: React.FC<{ life: number; items?: { text: string; at: number }[]; joinAt?: number }> = ({ life, items = [], joinAt = 120 }) => (
  <AdScreen life={life}>
    {(f) => {
      const j = eout(f, joinAt, joinAt + 14);
      return (
        <div style={{ position: "absolute", left: 90, right: 90, top: 560, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 22, opacity: 1 - j * 0.65, transform: `translate3d(0, ${(-j * 20).toFixed(1)}px, 0) scale(${(1 - j * 0.08).toFixed(3)})` }}>
            {items.map((it, i) => {
              const k = eout(f, it.at, it.at + 10);
              const st = eout(f, it.at + 8, it.at + 16);
              return (
                <div key={it.text} style={{ position: "relative", opacity: k, transform: `translate3d(0, ${((1 - k) * 30).toFixed(1)}px, 0) rotate(${(i - 1) * 4}deg)` }}>
                  <Glass style={{ width: 250, height: 300, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18 }}>
                    <svg width={80} height={80} viewBox="0 0 24 24" fill="none" stroke={AD.skin} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <path d="M14 2v6h6M8 13h8M8 17h5" />
                    </svg>
                    <div style={{ fontSize: 38, fontWeight: 700, color: AD.champagne }}>{it.text}</div>
                  </Glass>
                  <div style={{ position: "absolute", left: 20, right: 20, top: "50%", height: 8, marginTop: -4, borderRadius: 4, background: AD.red, transform: `scaleX(${st.toFixed(3)}) rotate(-12deg)`, transformOrigin: "0% 50%" }} />
                  <Snd at={it.at + 8} file="pen_stroke.wav" name="tick" vol={0.36} />
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 70, textAlign: "center", opacity: j, transform: `translate3d(0, ${((1 - j) * 30).toFixed(1)}px, 0)` }}>
            <div style={{ fontSize: 70, fontWeight: 700, color: "#fff", letterSpacing: -1.2 }}>
              A gente faz <span style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 500, color: AD.skin, fontSize: 86 }}>junto</span>
            </div>
            <div style={{ fontSize: 46, color: AD.champagne, marginTop: 6 }}>com você e a sua equipe</div>
          </div>
          <Snd at={joinAt} name="pop" k="adnocourse" vol={0.32} />
        </div>
      );
    }}
  </AdScreen>
);

// ---------- tela: a consulta em etapas, a decisão vem antes do preço ----------
export const AdConsultFlow: React.FC<{ life: number; steps?: { text: string; at: number }[]; decideAt?: number; priceAt?: number }> = ({ life, steps = [], decideAt = 200, priceAt = 300 }) => (
  <AdScreen life={life}>
    {(f) => {
      const dec = eout(f, decideAt, decideAt + 12);
      const pr = eout(f, priceAt, priceAt + 12);
      const all = [...steps, { text: "Decisão", at: decideAt }, { text: "Preço", at: priceAt }];
      return (
        <div style={{ position: "absolute", left: 150, right: 150, top: 600 }}>
          <Rise f={f} at={3}>
            <Eyebrow>a consulta que converte</Eyebrow>
          </Rise>
          <div style={{ position: "relative", marginTop: 40 }}>
            <div style={{ position: "absolute", left: 33, top: 30, bottom: 30, width: 3, background: AD.line, borderRadius: 2 }} />
            {all.map((s, i) => {
              const k = eout(f, s.at, s.at + 10);
              const isDec = s.text === "Decisão";
              const isPrice = s.text === "Preço";
              return (
                <div key={s.text} style={{ position: "relative", display: "flex", alignItems: "center", gap: 30, height: 128, opacity: k * (isPrice ? 0.75 : 1), transform: `translate3d(${((1 - k) * 40).toFixed(1)}px, 0, 0)` }}>
                  <div style={{ width: 68, height: 68, borderRadius: 34, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: isDec ? `linear-gradient(135deg, ${AD.champagne}, ${AD.skin})` : AD.bg1, border: `2px solid ${isDec ? AD.skin : AD.line}`, boxShadow: isDec ? `0 0 ${(40 * dec).toFixed(0)}px rgba(232,200,184,0.6)` : "none", color: isDec ? AD.bg0 : AD.mute, fontSize: 30, fontWeight: 800 }}>
                    {isDec ? "✓" : i + 1}
                  </div>
                  <div style={{ fontFamily: isDec ? SERIF : FONT, fontStyle: isDec ? "italic" : "normal", fontSize: isDec ? 84 : isPrice ? 44 : 52, fontWeight: isDec ? 500 : 700, color: isDec ? AD.skin : isPrice ? AD.mute : AD.champagne, transform: isDec ? `scale(${(1 + 0.06 * (1 - eout(f, decideAt + 6, decideAt + 20))).toFixed(3)})` : undefined, transformOrigin: "0% 50%" }}>
                    {s.text}
                  </div>
                  {isPrice ? (
                    <div style={{ marginLeft: "auto", opacity: pr, padding: "8px 18px", borderRadius: 999, border: `1.5px solid ${AD.line}`, color: AD.mute, fontSize: 24, fontFamily: "'Geist Mono', monospace", letterSpacing: 2 }}>SÓ UM DETALHE</div>
                  ) : null}
                  <Snd at={s.at} name={isDec ? "ding" : "tick"} k={isDec ? "adflowdec" : "adflow"} vol={isDec ? 0.3 : 0.32} />
                </div>
              );
            })}
          </div>
        </div>
      );
    }}
  </AdScreen>
);

// ---------- tela: protocolo de ticket alto ----------
export const AdTicket: React.FC<{ life: number; cardAt?: number; rangeAt?: number; range?: string; layers?: string[] }> = ({ life, cardAt = 6, rangeAt = 30, range = "R$ 10 a 20 mil", layers = ["Avaliação e plano", "Sessões em etapas", "Retornos programados"] }) => (
  <AdScreen life={life}>
    {(f) => {
      const k = eout(f, cardAt, cardAt + 14);
      const r = eout(f, rangeAt, rangeAt + 12);
      return (
        <div style={{ position: "absolute", left: 130, right: 130, top: 560 }}>
          <Glass style={{ padding: "44px 46px", opacity: k, transform: `translate3d(0, ${((1 - k) * 40 + bob(f)).toFixed(2)}px, 0) rotate(${((1 - k) * -3).toFixed(2)}deg)` }}>
            <Eyebrow>plano de tratamento</Eyebrow>
            <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 100, color: AD.champagne, marginTop: 8, lineHeight: 1 }}>Protocolo</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 34 }}>
              {layers.map((l, i) => {
                const kl = eout(f, cardAt + 8 + i * 5, cardAt + 18 + i * 5);
                return (
                  <div key={l} style={{ display: "flex", alignItems: "center", gap: 16, opacity: kl, fontSize: 34, color: AD.champagne }}>
                    <div style={{ width: 14, height: 14, borderRadius: 7, background: AD.skin }} />
                    {l}
                  </div>
                );
              })}
            </div>
            <div style={{ height: 1.5, background: AD.line, margin: "34px 0 26px" }} />
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", opacity: r, transform: `translate3d(0, ${((1 - r) * 20).toFixed(1)}px, 0)` }}>
              <div style={{ fontSize: 30, color: AD.mute }}>acima de</div>
              <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 76, color: AD.skin }}>{range}</div>
            </div>
          </Glass>
          <Snd at={cardAt} name="pop" k="adticket" vol={0.32} />
          <Snd at={rangeAt} name="ding" k="adticket2" vol={0.28} />
        </div>
      );
    }}
  </AdScreen>
);

// ---------- tela: medidor da certeza da paciente (a decisão vem antes do preço) ----------
// Mostrador semicircular de vidro: o ponteiro treme baixo (consulta sem condução), depois sobe passando por
// chamadas com linha ("entendeu a dor", "viu o plano") e trava em "decidiu"; só então a etiqueta de preço
// cai balançando ao lado, e o ponteiro não se mexe.
export const AdDecisionMeter: React.FC<{ life: number; sweepAt?: number; decideAt?: number; priceAt?: number; marks?: { label: string; v: number }[] }> = ({
  life,
  sweepAt = 140,
  decideAt = 240,
  priceAt = 300,
  marks = [
    { label: "entendeu a dor", v: 0.38 },
    { label: "viu o plano", v: 0.72 },
  ],
}) => (
  <AdScreen life={life}>
    {(f) => {
      const sweep = eio(f, sweepAt, decideAt);
      const shake = (1 - eout(f, sweepAt - 4, sweepAt + 8)) * (Math.sin(f / 2.3) * 0.05 + Math.sin(f / 5.1) * 0.04);
      const v = Math.min(1, 0.16 + shake + 0.84 * sweep);
      const lock = eout(f, decideAt, decideAt + 10);
      const pct = Math.round(v * 100);
      const cx = 400;
      const cy = 400;
      const R = 330;
      const ang = Math.PI * (1 - v);
      const nx = cx + Math.cos(ang) * (R - 40);
      const ny = cy - Math.sin(ang) * (R - 40);
      const arcPath = (a: number) => {
        const x = cx + Math.cos(Math.PI * (1 - a)) * R;
        const y = cy - Math.sin(Math.PI * (1 - a)) * R;
        return `M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${x.toFixed(1)} ${y.toFixed(1)}`;
      };
      const drop = eout(f, priceAt, priceAt + 16);
      const swing = Math.sin((f - priceAt) / 5) * 14 * (1 - eout(f, priceAt + 6, priceAt + 50));
      return (
        <div style={{ position: "absolute", left: 140, top: 600, width: 800 }}>
          <Rise f={f} at={3}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <Eyebrow>certeza da paciente</Eyebrow>
              <div style={{ fontFamily: "'Geist Mono', monospace", fontSize: 30, color: lock > 0.5 ? AD.skin : AD.mute }}>{pct}%</div>
            </div>
          </Rise>
          <svg width={800} height={470} viewBox="0 0 800 470" style={{ marginTop: 20, overflow: "visible" }}>
            <defs>
              <linearGradient id="meterg" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="rgba(232,200,184,0.35)" />
                <stop offset="100%" stopColor={AD.skin} />
              </linearGradient>
            </defs>
            <path d={arcPath(1)} fill="none" stroke="rgba(244,231,221,0.12)" strokeWidth={34} strokeLinecap="round" />
            <path d={arcPath(Math.max(0.001, v))} fill="none" stroke="url(#meterg)" strokeWidth={34} strokeLinecap="round" style={{ filter: lock > 0 ? `drop-shadow(0 0 ${(24 * lock).toFixed(0)}px rgba(232,200,184,0.7))` : undefined }} />
            {Array.from({ length: 21 }, (_, i) => {
              const a = Math.PI * (1 - i / 20);
              const r1 = R - 58;
              const r2 = R - (i % 5 === 0 ? 84 : 70);
              return <line key={i} x1={cx + Math.cos(a) * r1} y1={cy - Math.sin(a) * r1} x2={cx + Math.cos(a) * r2} y2={cy - Math.sin(a) * r2} stroke="rgba(244,231,221,0.35)" strokeWidth={i % 5 === 0 ? 3 : 1.5} />;
            })}
            {marks.map((m, i) => {
              const a = Math.PI * (1 - m.v);
              const on = eout(f, sweepAt + (decideAt - sweepAt) * m.v - 4, sweepAt + (decideAt - sweepAt) * m.v + 8);
              const px = cx + Math.cos(a) * (R + 22);
              const py = cy - Math.sin(a) * (R + 22);
              const lx = px + (m.v < 0.5 ? -60 : 60);
              const ly = py - 40;
              return (
                <g key={m.label} opacity={on}>
                  <circle cx={px} cy={py} r={8} fill={AD.skin} />
                  <polyline points={`${px},${py} ${lx},${ly} ${lx + (m.v < 0.5 ? -150 : 150)},${ly}`} fill="none" stroke={AD.skin} strokeWidth={2} />
                  <text x={lx + (m.v < 0.5 ? -150 : 150)} y={ly - 14} textAnchor={m.v < 0.5 ? "start" : "end"} fill={AD.champagne} fontSize={30} fontFamily="Geist, sans-serif" fontWeight={600}>
                    {m.label}
                  </text>
                </g>
              );
            })}
            <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={AD.champagne} strokeWidth={8} strokeLinecap="round" />
            <circle cx={cx} cy={cy} r={22} fill={AD.champagne} />
            <circle cx={cx} cy={cy} r={9} fill={AD.bg0} />
          </svg>
          <div style={{ textAlign: "center", marginTop: -40, opacity: lock, transform: `scale(${(0.9 + 0.1 * lock).toFixed(3)})` }}>
            <span style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 120, color: AD.skin }}>decidiu</span>
          </div>
          {/* etiqueta de preço caindo depois da decisão */}
          <div style={{ position: "absolute", right: -30, top: -220 + drop * 640, opacity: drop, transformOrigin: "50% 0%", transform: `rotate(${(swing + 8).toFixed(2)}deg)` }}>
            <div style={{ width: 2, height: 110, background: "rgba(244,231,221,0.5)", margin: "0 auto" }} />
            <div style={{ padding: "20px 30px", borderRadius: 18, background: `linear-gradient(135deg, ${AD.champagne}, ${AD.skin})`, color: AD.bg0, fontSize: 40, fontWeight: 800, boxShadow: "0 20px 40px rgba(0,0,0,0.45)" }}>R$ ···</div>
            <div style={{ textAlign: "center", marginTop: 12, fontFamily: "'Geist Mono', monospace", fontSize: 20, color: AD.mute, letterSpacing: 2 }}>DEPOIS</div>
          </div>
          {marks.map((m, i) => (
            <Snd key={i} at={Math.round(sweepAt + (decideAt - sweepAt) * m.v)} name="tick" k="admeter" vol={0.32} />
          ))}
          <Snd at={decideAt} name="ding" k="admeterdec" vol={0.3} />
          <Snd at={priceAt} name="pop" k="admeterprice" vol={0.3} />
        </div>
      );
    }}
  </AdScreen>
);

// ---------- caixinha "Faça uma pergunta" do Instagram (resposta a pergunta) ----------
// Copiada do sticker que o IMG_1327 trouxe gravado: x 104→972, cabeçalho escuro de 192 a 302, corpo branco até ~522
// (2 linhas). Fica parada do primeiro ao último quadro, como no original.
export const IgQuestion: React.FC<{ life: number; text: string; title?: string; top?: number }> = ({ text, title = "Faça uma pergunta", top = 192 }) => (
  <div style={{ position: "absolute", left: 104, width: 868, top, borderRadius: 30, overflow: "hidden", fontFamily: FONT }}>
    <div style={{ height: 110, background: "#23282f", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 32, fontWeight: 600, letterSpacing: 0.2 }}>{title}</div>
    <div style={{ background: "#fff", padding: "50px 40px 54px", textAlign: "center", color: "#262a30", fontSize: 45, lineHeight: 1.3, fontWeight: 400, textWrap: "balance" } as React.CSSProperties}>{text}</div>
  </div>
);
