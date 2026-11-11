import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Check, FileText, Paperclip, Send } from "lucide-react";
import { FONT, MONO } from "./overlays";
import { ZALE } from "./theme";
import { SEAM, Snd, SndSpan } from "./palco";
import { LiteCtx } from "./sfx-ctx";
import { Callout, clamp, eio, eout, Focus, Grain, Hud, KeynoteBg, mix, OfficeBg, FRONT_Z, PH, PhoneStage, Pose, project, PW, Reveal, RollNumber, rollDigitTicks, rollTicks, Vignette } from "./apple-premium";

// CENAS 3 a 12 do vídeo do iPhone na linguagem premium (ver apple-premium.tsx). Mesmo mundo do começo ao fim:
// estúdio preto (Apple) ou escritório de luz fria (a maioria), grão, vinheta, faixa de HUD, cartões de vidro em
// perspectiva e o iPhone 3D voltando sempre que faz sentido. PADRÃO DE SOM (igual em todas as cenas):
// entrada = whoosh baixo · rótulo/chamada = tick + glass · digitação = type · mensagem chegando = pop "chat" ·
// botão = click · contador = ticks na curva do número · luz = switch · número que pesa = thud baixo · negativo = error baixo.

const H = SEAM;
const CX = 540;
type World = "apple" | "office" | "night" | "marca";
// mundo "você" (a virada do vídeo): grafite com brilho vermelho da ZALE
const MarcaBg: React.FC = () => (
  <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 70% 60% at 50% 48%, #1b1414 0%, #0b0909 55%, #040303 100%)" }}>
    <div style={{ position: "absolute", left: 140, right: 140, top: 820, height: 140, borderRadius: "50%", background: `radial-gradient(ellipse at 50% 50%, rgba(${ZALE.redRgb},0.22), rgba(${ZALE.redRgb},0) 70%)` }} />
    <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)", backgroundSize: "60px 60px", maskImage: "radial-gradient(ellipse 60% 50% at 50% 55%, #000 30%, transparent 80%)" }} />
  </div>
);

export const Glass: React.FC<{ style?: React.CSSProperties; children?: React.ReactNode; light?: boolean }> = ({ style, children, light }) => {
  const lite = React.useContext(LiteCtx);
  return (
  <div
    style={{
      position: "absolute",
      background: light ? "rgba(250,252,251,0.72)" : "rgba(16,17,20,0.62)",
      border: `1px solid ${light ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.14)"}`,
      borderRadius: 18,
      backdropFilter: lite ? undefined : "blur(16px)",
      boxShadow: "0 24px 60px rgba(0,0,0,0.42)",
      color: light ? "#15191a" : "#fff",
      fontFamily: FONT,
      ...style,
    }}
  >
    {children}
  </div>
  );
};
export const Mono: React.FC<{ children: React.ReactNode; color?: string; size?: number; style?: React.CSSProperties }> = ({ children, color = "rgba(255,255,255,0.55)", size = 17, style }) => (
  <div style={{ fontFamily: MONO, fontSize: size, letterSpacing: 3, textTransform: "uppercase", color, ...style }}>{children}</div>
);
/** entra subindo desfocado e assenta (o mesmo movimento em todos os elementos) */
export const In = (f: number, at: number, d = 14): React.CSSProperties => {
  const t = eout(f, at, at + d);
  return { opacity: t, transform: `translateY(${((1 - t) * 14).toFixed(1)}px)`, filter: t < 0.98 ? `blur(${((1 - t) * 7).toFixed(2)}px)` : undefined };
};
export const Typed: React.FC<{ text: string; f: number; at: number; dur: number; caret?: boolean }> = ({ text, f, at, dur, caret }) => {
  const n = Math.round(interpolate(f, [at, at + dur], [0, text.length], clamp));
  return (
    <>
      {text.slice(0, n)}
      {caret && f >= at && n < text.length ? <span style={{ opacity: Math.floor(f / 8) % 2 ? 0.2 : 1 }}>▍</span> : null}
      <span style={{ opacity: 0 }}>{text.slice(n)}</span>
    </>
  );
};
// fundo "noite no escritório": a mesma sala, com a luz baixa
const NightBg: React.FC = () => (
  <div style={{ position: "absolute", inset: 0 }}>
    <OfficeBg o={1} />
    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(rgba(6,10,9,0.78), rgba(4,6,6,0.9))" }} />
  </div>
);

/** moldura comum: fundo do mundo, foco de entrada/saída, HUD, vinheta e grão */
export const PScene: React.FC<{ life: number; world: World; mood?: number; hud: { left: string; right: string; left2?: string; switchAt?: number; hideAt?: number }; children: (f: number, fps: number) => React.ReactNode; sounds?: React.ReactNode }> = ({
  life,
  world,
  mood = 1,
  hud,
  children,
  sounds,
}) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const office = world === "office";
  return (
    <AbsoluteFill style={{ height: H, overflow: "hidden" }}>
      <Focus f={f} life={life}>
        <KeynoteBg />
        {office ? <OfficeBg o={mood} /> : null}
        {world === "night" ? <NightBg /> : null}
        {world === "marca" ? <MarcaBg /> : null}
        {children(f, fps)}
        <Hud f={f} left={hud.left} right={hud.right} left2={hud.left2} switchAt={hud.switchAt} hideAt={hud.hideAt} dark={office && mood > 0.5} />
        <Vignette o={office ? 0.35 : 0.62} />
        <Grain f={f} o={office ? 0.1 : 0.065} />
      </Focus>
      <Snd at={0} name="whoosh" k="p-enter" vol={0.16} />
      {sounds}
    </AbsoluteFill>
  );
};

const MAIORIA = "O jeito da maioria";
const APPLE = "O jeito Apple";

// ================================================================ 3. "e tem gente parcelando em 12 vezes sem pedir um real de desconto para a Apple"
// (refeita: o leque de parcelas foi reprovado). O celular continua EXATAMENTE onde a cena 2 terminou (continuidade) e
// um card de pagamento acompanha a fala palavra a palavra.
export const Installments: React.FC<{ life: number; parcelAt: number; installAt: number; askAt: number; zeroAt: number; discAt: number; appleAt: number }> = ({ life, parcelAt, installAt, askAt, zeroAt, discAt, appleAt }) => {
  const segDur = 36; // 12 parcelas x 3 quadros: um tique por parcela que acende
  return (
    <PScene
      life={life}
      world="apple"
      hud={{ left: APPLE, right: "02 · o lançamento" }}
      sounds={
        <>
          <Snd at={parcelAt} name="ui" v={1} vol={0.16} />
          {Array.from({ length: 12 }, (_, i) => installAt + Math.round(((i + 1) * segDur) / 12)).map((t, i) => (
            <Snd key={i} at={t} name="tick" v={0} vol={0.08} />
          ))}
          <Snd at={askAt} name="tick" v={0} vol={0.15} />
          <SndSpan at={zeroAt} dur={10} name="type" vol={0.15} />
          <Snd at={appleAt} name="ding" k="confirmed" vol={0.2} />
        </>
      }
    >
      {(f) => {
        const pose: Pose = { x: -0.44, y: 0.04 + Math.sin((f + 340) / 40) * 0.01, ry: Math.PI - 0.62 + Math.sin((f + 340) / 50) * 0.02 + eio(f, 0, life) * 0.25, rx: -0.06, s: 1 };
        const seg = interpolate(f, [installAt, installAt + segDur], [0, 12], clamp);
        const glow = eio(f, discAt, discAt + 10);
        const ok = eout(f, appleAt, appleAt + 12);
        const row: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "14px 0", borderTop: "1px solid rgba(255,255,255,0.1)" };
        return (
          <>
            <PhoneStage pose={pose} screen={0} turn={mix(0.5, 1.1, f / life)} />
            <Glass style={{ left: 600, top: 230, width: 420, padding: "22px 26px", ...In(f, parcelAt, 16) }}>
              <Mono>pagamento</Mono>
              <div style={{ fontWeight: 800, fontSize: 40, margin: "6px 0 10px" }}>iPhone 18</div>
              <div style={row}>
                <Mono>total</Mono>
                <span style={{ fontWeight: 700, fontSize: 30 }}>R$ 12.000</span>
              </div>
              <div style={{ ...row, flexDirection: "column", alignItems: "stretch", ...In(f, installAt - 2) }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontWeight: 800, fontSize: 32, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{Math.max(1, Math.ceil(seg))}x de R$ 1.000</span>
                  <Mono size={14}>sem juros</Mono>
                </div>
                <div style={{ display: "flex", gap: 4, marginTop: 12 }}>
                  {Array.from({ length: 12 }).map((_, i) => {
                    const t = Math.max(0, Math.min(1, seg - i));
                    return <div key={i} style={{ flex: 1, height: 10, borderRadius: 3, background: `rgba(255,255,255,${(0.12 + 0.78 * t).toFixed(2)})`, boxShadow: t > 0.9 ? "0 0 8px rgba(255,255,255,0.4)" : undefined }} />;
                  })}
                </div>
              </div>
              <div style={{ ...row, ...In(f, askAt) }}>
                <Mono>desconto pedido</Mono>
                <span style={{ fontWeight: 800, fontSize: 34, fontVariantNumeric: "tabular-nums", color: glow > 0.5 ? "#fff" : "rgba(255,255,255,0.9)", textShadow: `0 0 ${(24 * glow).toFixed(0)}px rgba(255,255,255,0.6)` }}>
                  <Typed text="R$ 0,00" f={f} at={zeroAt} dur={10} />
                </span>
              </div>
              <div style={{ marginTop: 14, height: 58, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, fontWeight: 700, fontSize: 26, background: ok > 0 ? `rgba(22,163,74,${(0.85 * ok).toFixed(2)})` : "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
                {ok > 0 ? (
                  <>
                    <Check size={24} strokeWidth={3} /> Compra confirmada
                  </>
                ) : (
                  <span style={{ opacity: 0.5 }}>Confirmar</span>
                )}
              </div>
            </Glass>
          </>
        );
      }}
    </PScene>
  );
};

// ================================================================ 4. "Agora imagina se a Apple vendesse do mesmo jeito que a maioria…"
export const LightsToOffice: React.FC<{ life: number; offAt: number; officeAt: number }> = ({ life, offAt, officeAt }) => (
  <PScene
    life={life}
    world="office"
    mood={0}
    hud={{ left: APPLE, left2: MAIORIA, switchAt: officeAt, right: "03 · a maioria" }}
    sounds={
      <>
        <Snd at={offAt} name="switch" k="spot-off" vol={0.26} />
        <Snd at={officeAt} name="switch" k="fluor" vol={0.3} />
        <Snd at={officeAt + 3} name="click" k="fluor-tick" vol={0.22} />
        <Snd at={officeAt + 10} name="tick" v={4} vol={0.16} />
      </>
    }
  >
    {(f) => {
      const spot = 1 - eio(f, offAt, offAt + 12);
      const back = eio(f, offAt, officeAt);
      const fl = f < officeAt ? 0 : ([1, 0.15, 0.9, 0.3, 1, 0.6, 1][f - officeAt] ?? 1);
      const pose: Pose = { x: 0, y: mix(0.08, 0.0, back), z: mix(0, -1.6, back), ry: mix(0.35, -0.25, f / life), rx: -0.04, s: 1 };
      return (
        <>
          <div style={{ position: "absolute", inset: 0, background: "#000", opacity: (1 - spot) * (1 - fl) * 0.9 }} />
          <OfficeBg o={fl} />
          <PhoneStage pose={pose} mood={fl} env={mix(0.35, 1, Math.max(spot, fl))} turn={mix(-0.4, 0.6, f / life)} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 770, textAlign: "center" }}>
            <Mono color="rgba(20,28,25,0.6)" style={{ ...In(f, officeAt + 6), marginBottom: 10 }}>no brasil</Mono>
            <Reveal f={f} at={officeAt + 10} text="o jeito da maioria" size={70} color="#1b2320" />
          </div>
        </>
      );
    }}
  </PScene>
);

// ================================================================ 5. PDF de 40 páginas na mesa (a ideia que o Paulo aprovou, no mundo novo)
export const PdfDesk: React.FC<{ life: number; scrollAt: number; lastAt: number; pages?: number; price?: string }> = ({ life, scrollAt, lastAt, pages = 40, price = "R$ 12.000" }) => {
  const N = 12; // viradas visíveis (acelerando)
  const TURN = 9; // quadros de cada virada (levanta, passa da vertical, assenta)
  const LAND = 5; // a página passa da vertical e revela a de baixo: o papel estala, o número muda e o som bate juntos
  // começo de cada virada, acelerando, com pelo menos 4 quadros entre uma e outra (as últimas grudavam)
  const flips: number[] = [];
  for (let i = 0; i < N; i++) {
    const t = Math.round(scrollAt + (lastAt - TURN - scrollAt) * Math.sqrt(i / N));
    flips.push(i ? Math.max(t, flips[i - 1] + 4) : t);
  }
  return (
    <PScene
      life={life}
      world="office"
      hud={{ left: MAIORIA, right: "04 · a proposta" }}
      sounds={
        <>
          {flips.map((t, i) => (
            <Snd key={i} at={t + LAND} hit name="flip" v={i % 2} vol={0.24} />
          ))}
          <Snd at={lastAt} name="thud" k="price-last" vol={0.13} />
          {/* marca-texto passando no preço (hl: lastAt+6 .. +18) = caneta no papel com a duração da passada */}
          <SndSpan at={lastAt + 6} dur={12} name="write" vol={0.26} />
        </>
      }
    >
      {(f) => {
        // o contador anda JUNTO com as viradas: cada página que assenta avança o número
        const done = flips.filter((t) => f >= t + LAND).length;
        const page = f >= lastAt ? pages : Math.max(1, Math.round(1 + ((pages - 2) * done) / N));
        const push = eio(f, lastAt, lastAt + 22);
        const hl = eio(f, lastAt + 6, lastAt + 18);
        const Page: React.FC<{ n: number; last?: boolean }> = ({ n, last }) => (
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(#fbfbf8,#eeeee9)", borderRadius: 6, padding: "34px 38px", boxSizing: "border-box", backfaceVisibility: "hidden" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 15, letterSpacing: 2, color: "#8a8d88" }}>
              <span>PROPOSTA COMERCIAL</span>
              <span>
                {n}/{pages}
              </span>
            </div>
            {last ? (
              <div style={{ marginTop: 190, textAlign: "center" }}>
                <div style={{ fontFamily: MONO, fontSize: 18, letterSpacing: 3, color: "#6b6f6a" }}>INVESTIMENTO TOTAL</div>
                <div style={{ display: "inline-block", marginTop: 14, padding: "4px 18px", fontFamily: FONT, fontWeight: 800, fontSize: 78, letterSpacing: -2, color: "#111", background: `linear-gradient(transparent 55%, rgba(250,204,21,${(0.85 * hl).toFixed(2)}) 55%)` }}>{price}</div>
              </div>
            ) : (
              Array.from({ length: 14 }).map((_, i) => <div key={i} style={{ height: 11, borderRadius: 3, background: "#d8d9d4", margin: "20px 0", width: `${55 + ((i * 37 + n * 11) % 40)}%` }} />)
            )}
          </div>
        );
        return (
          <>
            <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: H, perspective: 1500 }}>
              <div style={{ position: "absolute", left: CX - 270, top: 240, width: 540, height: 700, transformStyle: "preserve-3d", transform: `translateY(${(push * -40).toFixed(1)}px) scale(${(1 + 0.3 * push).toFixed(3)}) rotateX(${mix(46, 22, push).toFixed(2)}deg) rotateZ(${mix(-9, -3, push).toFixed(2)}deg)` }}>
                {[5, 4, 3, 2, 1].map((d) => (
                  <div key={d} style={{ position: "absolute", inset: 0, transform: `translate3d(${d * 2}px, ${d * 3}px, ${-d * 3}px)`, background: "#dcdcd6", borderRadius: 6, boxShadow: d === 5 ? "0 40px 80px rgba(0,0,0,0.45)" : undefined }} />
                ))}
                <Page n={pages} last />
                {flips.map((t, i) => {
                  const k = eio(f, t, t + TURN);
                  if (k >= 1) return null;
                  return (
                    <div key={i} style={{ position: "absolute", inset: 0, transformOrigin: "0% 50%", transform: `translateZ(${(N - i) * 0.4}px) rotateY(${(-178 * k).toFixed(2)}deg)`, transformStyle: "preserve-3d" }}>
                      <Page n={Math.min(pages - 1, 1 + Math.round(((pages - 2) * i) / N))} />
                    </div>
                  );
                })}
              </div>
            </div>
            <Glass style={{ right: 60, top: 190, width: 250, padding: "14px 20px", ...In(f, 4) }}>
              <Mono>página</Mono>
              <div style={{ fontWeight: 800, fontSize: 52, lineHeight: 1.05, fontVariantNumeric: "tabular-nums" }}>
                {page}
                <span style={{ fontSize: 28, opacity: 0.5 }}>/{pages}</span>
              </div>
            </Glass>
            <Glass style={{ left: 60, top: 190, width: 330, padding: "14px 20px", display: "flex", gap: 12, alignItems: "center", ...In(f, 8) }}>
              <FileText size={30} color={ZALE.redBright} strokeWidth={1.6} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 22 }}>proposta_final_v3.pdf</div>
                <Mono size={14}>40 págs · 12,4 MB</Mono>
              </div>
            </Glass>
          </>
        );
      }}
    </PScene>
  );
};

// ================================================================ 6. e-mail "Qualquer dúvida, estou à disposição." -> Enviar
export const EmailSend: React.FC<{ life: number; text: string; typeAt: number; typeDur: number; sendAt?: number }> = ({ life, text, typeAt, typeDur, sendAt }) => {
  const send = sendAt ?? typeAt + typeDur + 5;
  return (
    <PScene
      life={life}
      world="office"
      hud={{ left: MAIORIA, right: "04 · a proposta" }}
      sounds={
        <>
          <Snd at={4} name="ui" v={1} vol={0.16} />
          <SndSpan at={typeAt} dur={typeDur} name="type" vol={0.17} />
          <Snd at={send} name="click" k="btn" vol={0.26} />
          <Snd at={send + 2} name="whoosh" k="send" vol={0.2} />
        </>
      }
    >
      {(f) => {
        const on = eout(f, 0, 16);
        const fly = eio(f, send + 2, send + 16);
        const press = f >= send && f < send + 4 ? 0.95 : 1;
        return (
          <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: H, perspective: 1400 }}>
            <Glass
              style={{
                left: CX - 390,
                top: 250,
                width: 780,
                padding: 0,
                overflow: "hidden",
                opacity: on * (1 - fly),
                transform: `translateZ(${(-1400 * fly).toFixed(0)}px) translateY(${(-160 * fly).toFixed(0)}px) rotateY(${mix(-7, 0, on).toFixed(2)}deg) rotateX(${mix(8, 3, on).toFixed(2)}deg)`,
              }}
            >
              <div style={{ display: "flex", gap: 8, padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
                  <span key={c} style={{ width: 12, height: 12, borderRadius: 6, background: c, opacity: 0.85 }} />
                ))}
                <Mono size={15} style={{ marginLeft: 14 }}>nova mensagem</Mono>
              </div>
              <div style={{ padding: "18px 26px", display: "grid", gap: 10, fontSize: 24, color: "rgba(255,255,255,0.75)", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                <div>
                  <span style={{ fontFamily: MONO, fontSize: 16, letterSpacing: 2, color: "rgba(255,255,255,0.45)", marginRight: 16 }}>PARA</span>cliente@empresa.com.br
                </div>
                <div>
                  <span style={{ fontFamily: MONO, fontSize: 16, letterSpacing: 2, color: "rgba(255,255,255,0.45)", marginRight: 16 }}>ASSUNTO</span>Proposta comercial
                </div>
              </div>
              <div style={{ padding: "22px 26px 26px", fontSize: 32, lineHeight: 1.35 }}>
                <div style={{ color: "rgba(255,255,255,0.6)" }}>Segue em anexo a proposta.</div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 10, margin: "14px 0", padding: "8px 14px", borderRadius: 10, background: "rgba(240,58,30,0.14)", border: "1px solid rgba(240,58,30,0.35)", fontSize: 22 }}>
                  <Paperclip size={20} /> proposta_final_v3.pdf · 40 págs
                </div>
                <div style={{ fontWeight: 700 }}>
                  <Typed text={text} f={f} at={typeAt} dur={typeDur} caret />
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 24px", borderRadius: 12, background: "#2f6bff", fontWeight: 700, fontSize: 24, transform: `scale(${press})`, boxShadow: f >= send ? "0 0 30px rgba(47,107,255,0.7)" : "none" }}>
                    <Send size={22} /> Enviar
                  </div>
                </div>
              </div>
            </Glass>
          </div>
        );
      }}
    </PScene>
  );
};

// ================================================================ 7. "Três dias depois… Conseguiu dar uma olhadinha?"
export const ThreeDays: React.FC<{ life: number; flipAt: number; chatAt: number; text: string; typeDur: number }> = ({ life, flipAt, chatAt, text, typeDur }) => {
  const cyc = Math.max(8, Math.floor((chatAt - 6 - flipAt) / 3));
  return (
    <PScene
      life={life}
      world="office"
      hud={{ left: MAIORIA, right: "05 · o follow-up" }}
      sounds={
        <>
          {[0, 1, 2].map((i) => (
            <Snd key={i} at={flipAt + i * cyc + 2} name="tick" v={i % 2 ? 4 : 0} vol={0.16} />
          ))}
          <SndSpan at={chatAt} dur={typeDur} name="type" vol={0.16} />
          <Snd at={chatAt + typeDur + 2} name="click" k="wa-send" vol={0.22} />
        </>
      }
    >
      {(f) => {
        const k = Math.max(0, Math.min(2.999, (f - flipAt) / cyc));
        const day = Math.floor(k);
        const ph = k - day;
        const night = f < chatAt - 6 ? Math.pow(Math.sin(ph * Math.PI), 2) : 0;
        const beam = mix(-500, 900, ph);
        const chat = eout(f, chatAt - 4, chatAt + 10);
        const sent = f >= chatAt + typeDur + 2;
        const pose: Pose = { x: -0.02, y: -0.82, rx: -1.25, ry: 0, rz: -0.25, s: 0.95 };
        return (
          <>
            <div style={{ position: "absolute", left: beam, top: 520, width: 420, height: 500, background: "linear-gradient(90deg, rgba(255,247,220,0), rgba(255,247,220,0.35), rgba(255,247,220,0))", transform: "skewX(-28deg)", opacity: f < chatAt - 6 ? 1 : 0, mixBlendMode: "screen" }} />
            <PhoneStage pose={pose} mood={1} screen={f >= chatAt ? 0.9 : 0.12} />
            <div style={{ position: "absolute", inset: 0, background: "#02060a", opacity: night * 0.72 }} />
            <Glass style={{ left: 60, top: 190, width: 250, padding: "14px 20px", ...In(f, flipAt) }}>
              <Mono>sem resposta</Mono>
              <div style={{ fontWeight: 800, fontSize: 56, lineHeight: 1.05, fontVariantNumeric: "tabular-nums" }}>+{(day + 1) * 24}h</div>
            </Glass>
            <Glass style={{ right: 60, top: 300, width: 520, padding: "18px 22px", opacity: chat, transform: `translateY(${((1 - chat) * -30).toFixed(1)}px)`, filter: chat < 0.98 ? `blur(${((1 - chat) * 6).toFixed(2)}px)` : undefined }}>
              <Mono>você · whatsapp</Mono>
              <div style={{ marginTop: 10, background: "#0f5a48", borderRadius: "18px 6px 18px 18px", padding: "14px 18px", fontSize: 32, fontWeight: 600 }}>
                <Typed text={text} f={f} at={chatAt} dur={typeDur} caret />
              </div>
              <div style={{ textAlign: "right", marginTop: 10, fontFamily: MONO, fontSize: 16, letterSpacing: 2, color: "rgba(255,255,255,0.5)", opacity: sent ? 1 : 0 }}>✓✓ ENTREGUE · NÃO LIDA</div>
            </Glass>
          </>
        );
      }}
    </PScene>
  );
};

// ================================================================ 8. objeção -> "Se você fechar essa semana, eu consigo 10% de desconto."
export const ObjectionCut: React.FC<{ life: number; objectionAt: number; offerAt: number; offer: string; offerDur: number; stickAt: number }> = ({ life, objectionAt, offerAt, offer, offerDur, stickAt }) => {
  const rollDur = 30;
  return (
    <PScene
      life={life}
      world="office"
      hud={{ left: MAIORIA, right: "06 · a objeção" }}
      sounds={
        <>
          <Snd at={18} name="ui" v={0} vol={0.16} />
          <Snd at={objectionAt} name="pop" k="chat-in" vol={0.2} />
          <SndSpan at={offerAt} dur={offerDur} name="type" vol={0.14} />
          {rollDigitTicks(12000, 10800, stickAt, rollDur).map((t, i) => (
            <Snd key={i} at={t} name="tick" v={0} vol={0.09} />
          ))}
          <Snd at={stickAt + 4} name="thud" k="cut" vol={0.12} />
        </>
      }
    >
      {(f) => {
        const pose: Pose = { x: -0.62, y: 0.02 + Math.sin(f / 40) * 0.01, ry: mix(0.45, 0.15, f / life), rx: -0.04, s: 0.92 };
        const roll = interpolate(f, [stickAt, stickAt + rollDur], [0, 1], clamp);
        const cut = eout(f, stickAt + 4, stickAt + 16);
        const bar = mix(0.62, 0.16, eio(f, stickAt, stickAt + 30));
        return (
          <>
            <PhoneStage pose={pose} mood={1} />
            <Callout f={f} at={6} from={project(pose, [PW / 2, 0.42, 0])} to={[560, 250]} kicker="preço" width={330}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <RollNumber from={12000} to={10800} t={roll} size={52} />
                <span style={{ fontFamily: MONO, fontSize: 18, letterSpacing: 2, padding: "4px 10px", borderRadius: 8, background: ZALE.red, opacity: cut, transform: `scale(${mix(1.4, 1, cut)})` }}>-10%</span>
              </div>
            </Callout>
            <Glass style={{ left: 574, top: 380, width: 430, padding: "14px 20px", ...In(f, objectionAt) }}>
              <Mono>cliente</Mono>
              <div style={{ fontSize: 32, fontWeight: 600, marginTop: 4 }}>Tá meio caro…</div>
            </Glass>
            <Glass style={{ left: 574, top: 500, width: 430, padding: "14px 20px", ...In(f, offerAt - 2) }}>
              <Mono>vendedor</Mono>
              <div style={{ fontSize: 28, fontWeight: 600, marginTop: 4, lineHeight: 1.3 }}>
                <Typed text={offer} f={f} at={offerAt} dur={offerDur} />
              </div>
            </Glass>
            <Glass style={{ left: 574, top: 740, width: 430, padding: "14px 20px", ...In(f, stickAt - 6) }}>
              <Mono>valor percebido</Mono>
              <div style={{ height: 12, borderRadius: 6, background: "rgba(255,255,255,0.12)", marginTop: 10, overflow: "hidden" }}>
                <div style={{ width: `${(bar * 100).toFixed(1)}%`, height: "100%", background: `linear-gradient(90deg, ${ZALE.red}, #ff8a5c)` }} />
              </div>
            </Glass>
          </>
        );
      }}
    </PScene>
  );
};

// ================================================================ 9. "Ninguém ia comprar um celular de 12 mil reais desse jeito."
// (refeita: o Paulo pediu impacto claro no "zero vendas", com movimento). No "comprar" o iPhone tomba para trás e
// cai na mesa; no impacto a tela trinca (estalo de vidro, clarão, tremor, cacos voando) e bate "VENDAS 0";
// no "12 mil" o preço aparece e é riscado; no "desse jeito" a luz fluorescente apaga.
export const NoSale: React.FC<{ life: number; fallAt: number; priceAt: number; leaveAt: number }> = ({ life, fallAt, priceAt, leaveAt }) => {
  const FALL = 9; // quadros da queda (acelera como gravidade)
  const hit = fallAt + FALL;
  return (
    <PScene
      life={life}
      world="office"
      hud={{ left: MAIORIA, right: "07 · o resultado" }}
      sounds={
        <>
          <Snd at={fallAt} name="whoosh" k="fall" vol={0.14} />
          <Snd at={hit} name="crack" v={0} vol={0.32} />
          <Snd at={hit + 5} name="thud" k="zero" vol={0.12} />
          <Snd at={priceAt} name="ui" v={1} vol={0.2} />
          <SndSpan at={priceAt + 8} dur={10} name="write" vol={0.24} />
          <Snd at={leaveAt} name="switch" k="fluor-off" vol={0.3} />
        </>
      }
    >
      {(f) => {
        const H0 = PH / 2;
        const yb = 0.04 - H0; // a base do aparelho fica apoiada na mesa (pivô da queda)
        // queda: cai para trás (a tela fica para cima), quica um pouco e assenta; depois a câmera sobe para ver a tela
        const fall = f < fallAt ? 0 : Math.min(1, Math.pow((f - fallAt) / FALL, 2));
        const bounce = f < hit ? 0 : Math.exp(-(f - hit) / 3) * Math.sin((f - hit) * 1.3) * 0.12;
        const wobble = f < fallAt && f > fallAt - 10 ? Math.sin((f - fallAt) * 0.9) * 0.03 : 0;
        const a = -1.22 * fall + bounce * (f >= hit ? 1 : 0) + wobble;
        const look = eio(f, hit + 8, hit + 34); // câmera sobe: a tela trincada vira para quem assiste
        const ang = a + look * 0.32;
        const pose: Pose = { x: -0.28, y: yb + H0 * Math.cos(ang) + look * 0.12, z: H0 * Math.sin(ang), rx: ang, ry: mix(-0.18, 0.1, f / life), s: mix(1, 1.18, look) };
        const broken = f >= hit;
        // tremor da câmera no impacto
        const sh = f >= hit ? Math.exp(-(f - hit) / 4) : 0;
        const sx = Math.sin(f * 2.7) * 16 * sh;
        const sy = Math.cos(f * 3.3) * 12 * sh;
        const flash = f >= hit ? Math.max(0, 1 - (f - hit) / 4) * 0.55 : 0;
        const center = project(pose, [0, -0.1, FRONT_Z]);
        const off = f < leaveAt ? 1 : ([0.2, 0.8, 0.1, 0.5, 0][f - leaveAt] ?? 0);
        const zero = f >= hit + 4 ? eout(f, hit + 4, hit + 12) : 0;
        const strike = eio(f, priceAt + 8, priceAt + 18);
        return (
          <div style={{ position: "absolute", inset: 0, transform: `translate(${sx.toFixed(1)}px, ${sy.toFixed(1)}px)` }}>
            <div style={{ position: "absolute", inset: 0, background: "#000", opacity: 1 - off }} />
            <PhoneStage phones={[{ pose, screen: mix(0.15, 1, off), cracked: broken }]} mood={off} env={mix(0.25, 1, off)} />
            {/* cacos de vidro saltando do ponto do impacto */}
            {broken
              ? Array.from({ length: 14 }).map((_, i) => {
                  const t = (f - hit) / 30;
                  if (t > 1) return null;
                  const ang2 = (i / 14) * Math.PI * 2 + i * 0.37;
                  const v = 260 + ((i * 53) % 180);
                  const x = center[0] + Math.cos(ang2) * v * t;
                  const y = center[1] - Math.abs(Math.sin(ang2)) * v * t * 1.2 + 900 * t * t;
                  const sz = 6 + ((i * 7) % 9);
                  return <div key={i} style={{ position: "absolute", left: x, top: y, width: sz, height: sz * 0.7, background: "rgba(235,245,255,0.85)", clipPath: "polygon(0 0, 100% 30%, 40% 100%)", transform: `rotate(${(i * 47 + f * 25) % 360}deg)`, opacity: 1 - t, boxShadow: "0 0 6px rgba(255,255,255,0.7)" }} />;
                })
              : null}
            <div style={{ position: "absolute", inset: 0, background: "#fff", opacity: flash }} />
            {/* VENDAS 0: bate com peso logo depois do impacto */}
            <Glass style={{ left: 600, top: 330, width: 400, padding: "18px 24px", opacity: zero, transform: `scale(${mix(1.5, 1, zero).toFixed(3)})`, transformOrigin: "30% 50%", border: `1px solid rgba(240,58,30,${(0.6 * zero).toFixed(2)})`, boxShadow: `0 0 ${(60 * zero).toFixed(0)}px rgba(${ZALE.redRgb},0.45), 0 24px 60px rgba(0,0,0,0.42)` }}>
              <Mono>vendas · esta semana</Mono>
              <div style={{ fontWeight: 800, fontSize: 110, lineHeight: 1, color: "#fff" }}>0</div>
              <Mono color={ZALE.redBright} style={{ marginTop: 6 }}>● ninguém comprou</Mono>
            </Glass>
            {/* o preço aparece e é riscado */}
            <Glass style={{ left: 600, top: 640, width: 400, padding: "14px 24px", ...In(f, priceAt) }}>
              <Mono>desse jeito</Mono>
              <div style={{ position: "relative", display: "inline-block", fontWeight: 800, fontSize: 56, marginTop: 4 }}>
                R$ 12.000
                <div style={{ position: "absolute", left: -6, top: "52%", height: 6, borderRadius: 3, width: `calc(${(strike * 100).toFixed(1)}% + 12px)`, background: ZALE.redBright, opacity: strike > 0.01 ? 1 : 0 }} />
              </div>
            </Glass>
          </div>
        );
      }}
    </PScene>
  );
};

// ================================================================ 10. "ninguém te mostrou porque aquilo vale 12 mil reais"
export const EmptyWhy: React.FC<{ life: number; qAt: number; meterAt: number }> = ({ life, qAt, meterAt }) => (
  <PScene
    life={life}
    world="night"
    hud={{ left: MAIORIA, right: "08 · o porquê" }}
    sounds={
      <>
        <Snd at={4} name="ui" v={1} vol={0.16} />
        <Snd at={qAt + 12} name="ui" v={0} vol={0.16} />
        <Snd at={meterAt} name="error" k="no-answer" vol={0.15} />
      </>
    }
  >
    {(f) => {
      const m = eout(f, meterAt, meterAt + 14);
      return (
        <>
          <Glass style={{ left: 80, top: 250, padding: "20px 30px", ...In(f, 4) }}>
            <Mono>preço</Mono>
            <div style={{ fontWeight: 800, fontSize: 96, letterSpacing: -3, lineHeight: 1.05 }}>R$ 12.000</div>
          </Glass>
          <Callout f={f} at={qAt} from={[330, 420]} to={[500, 600]} kicker="por que vale isso?" width={470}>
            <div style={{ height: 70, display: "flex", alignItems: "center", fontSize: 54, fontWeight: 300, color: "rgba(255,255,255,0.85)" }}>
              <span style={{ opacity: Math.floor(f / 12) % 2 ? 0.15 : 1 }}>▍</span>
            </div>
          </Callout>
          <div style={{ position: "absolute", left: 528, top: 720, width: 440, opacity: m }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <Mono>valor percebido</Mono>
              <Mono color={ZALE.redBright}>sem resposta</Mono>
            </div>
            <div style={{ height: 10, borderRadius: 5, background: "rgba(255,255,255,0.12)", marginTop: 10, overflow: "hidden" }}>
              <div style={{ width: `${(6 * m).toFixed(1)}%`, height: "100%", background: ZALE.red }} />
            </div>
          </div>
        </>
      );
    }}
  </PScene>
);

// ================================================================ 11. "Você recebeu uma lista de coisas técnicas e um número."
export const SpecCollapse: React.FC<{ life: number; listAt: number; collapseAt: number }> = ({ life, listAt, collapseAt }) => {
  const rows: [string, string][] = [
    ["processador", "6 núcleos · 3 nm"],
    ["tela", "6,3” · 120 Hz"],
    ["armazenamento", "256 GB"],
    ["câmera", "48 MP · f/1.8"],
    ["conectividade", "5G · Wi-Fi 7"],
    ["bateria", "3.600 mAh"],
    ["estrutura", "titânio · IP68"],
    ["carregamento", "USB-C · 25 W"],
  ];
  return (
    <PScene
      life={life}
      world="night"
      hud={{ left: MAIORIA, right: "08 · o porquê" }}
      sounds={
        <>
          {[0, 2, 4, 6].map((i) => (
            <Snd key={i} at={listAt + i * 3} name="tick" v={i % 4 ? 4 : 0} vol={0.12} />
          ))}
          <Snd at={collapseAt} name="whoosh" k="collapse" vol={0.18} />
          <Snd at={collapseAt + 10} name="thud" k="number" vol={0.12} />
        </>
      }
    >
      {(f) => {
        const c = eio(f, collapseAt, collapseAt + 12);
        const scroll = interpolate(f, [0, life], [40, -60]);
        return (
          <>
            <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: H, perspective: 1200 }}>
              <div style={{ position: "absolute", left: CX - 380, top: 230, width: 760, transform: `rotateX(26deg) translateY(${scroll.toFixed(1)}px)`, transformOrigin: "50% 0%" }}>
                {rows.map(([k, v], i) => {
                  const t = eout(f, listAt + i * 1.5, listAt + i * 1.5 + 12);
                  const toMid = (3.5 - i) * 76 * c;
                  return (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "20px 8px", borderBottom: "1px solid rgba(255,255,255,0.12)", fontFamily: MONO, fontSize: 28, color: "rgba(255,255,255,0.82)", opacity: t * (1 - c), transform: `translateY(${toMid.toFixed(1)}px) scaleY(${(1 - c * 0.9).toFixed(3)})`, filter: c > 0.02 ? `blur(${(c * 6).toFixed(2)}px)` : undefined }}>
                      <span style={{ color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: 3, fontSize: 22 }}>{k}</span>
                      <span>{v}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div style={{ position: "absolute", left: 0, right: 0, top: 420, textAlign: "center" }}>
              <Mono style={{ ...In(f, collapseAt + 6), marginBottom: 12 }}>e um número</Mono>
              <div style={In(f, collapseAt + 8, 16)}>
                <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 130, letterSpacing: -5, color: "#fff" }}>R$ 12.000</span>
              </div>
            </div>
          </>
        );
      }}
    </PScene>
  );
};

// ================================================================ 12. "a única conversa… foi sobre preço… qualquer valor parece caro."
export const PriceGauge: React.FC<{ life: number; bubbles: { text: string; at: number; me?: boolean }[]; tipAt: number }> = ({ life, bubbles, tipAt }) => {
  const HOT = /(R\$ ?[\d.]+|preço|caro|desconto|quanto)/gi;
  const isHot = (s: string) => /^(R\$ ?[\d.]+|preço|caro|desconto|quanto)$/i.test(s);
  return (
    <PScene
      life={life}
      world="night"
      hud={{ left: MAIORIA, right: "09 · a conversa" }}
      sounds={
        <>
          {bubbles.map((b, i) => (
            <React.Fragment key={i}>
              <Snd at={b.at} name="pop" k="chat-in" vol={0.2} />
              <Snd at={b.at + 5} name="tick" v={4} vol={0.1} />
            </React.Fragment>
          ))}
          <Snd at={tipAt} name="thud" k="caro" vol={0.13} />
        </>
      }
    >
      {(f) => {
        const shown = bubbles.filter((b) => f >= b.at).length;
        const tip = eio(f, tipAt, tipAt + 14);
        const lvl = mix(0.12, 0.72, eio(f, bubbles[0]?.at ?? 0, (bubbles[bubbles.length - 1]?.at ?? 0) + 10) * (shown / Math.max(1, bubbles.length))) + tip * 0.26;
        const ang = mix(-82, 82, Math.min(0.98, lvl)) + Math.sin(f / 3) * 0.6;
        const state = tip > 0.5 ? "CARO" : lvl < 0.3 ? "justo" : lvl < 0.55 ? "moderado" : "alto";
        const gx = 800;
        const gy = 560;
        const R = 170;
        const arc = (a0: number, a1: number) => {
          const p = (a: number) => [gx + R * Math.sin((a * Math.PI) / 180), gy - R * Math.cos((a * Math.PI) / 180)];
          const [x0, y0] = p(a0);
          const [x1, y1] = p(a1);
          return `M ${x0} ${y0} A ${R} ${R} 0 0 1 ${x1} ${y1}`;
        };
        return (
          <>
            <div style={{ position: "absolute", left: 60, top: 200, width: 470 }}>
              {bubbles.map((b, i) => {
                const parts = b.text.split(HOT);
                return (
                  <div key={i} style={{ display: "flex", justifyContent: b.me ? "flex-end" : "flex-start", marginBottom: 16, ...In(f, b.at) }}>
                    <div style={{ maxWidth: 400, padding: "14px 20px", borderRadius: b.me ? "18px 6px 18px 18px" : "6px 18px 18px 18px", background: b.me ? "rgba(15,90,72,0.8)" : "rgba(30,32,36,0.8)", border: "1px solid rgba(255,255,255,0.12)", fontFamily: FONT, fontSize: 30, fontWeight: 600, color: "#fff" }}>
                      <Mono size={14} style={{ marginBottom: 4 }}>{b.me ? "vendedor" : "cliente"}</Mono>
                      {parts.map((p, j) => (isHot(p) ? <span key={j} style={{ color: "#ff7a5c" }}>{p}</span> : <span key={j}>{p}</span>))}
                    </div>
                  </div>
                );
              })}
            </div>
            <svg width={1080} height={H} style={{ position: "absolute", inset: 0, ...In(f, 6) }}>
              <defs>
                <linearGradient id="gg" x1="0" x2="1">
                  <stop offset="0" stopColor="#8ea39a" />
                  <stop offset="0.55" stopColor="#f0b35a" />
                  <stop offset="1" stopColor={ZALE.redBright} />
                </linearGradient>
              </defs>
              <path d={arc(-82, 82)} stroke="rgba(255,255,255,0.1)" strokeWidth={22} fill="none" strokeLinecap="round" />
              <path d={arc(-82, Math.max(-81, ang))} stroke="url(#gg)" strokeWidth={22} fill="none" strokeLinecap="round" />
              {Array.from({ length: 9 }).map((_, i) => {
                const a = ((-82 + i * 20.5) * Math.PI) / 180;
                return <line key={i} x1={gx + (R - 34) * Math.sin(a)} y1={gy - (R - 34) * Math.cos(a)} x2={gx + (R - 46) * Math.sin(a)} y2={gy - (R - 46) * Math.cos(a)} stroke="rgba(255,255,255,0.3)" strokeWidth={2} />;
              })}
              <line x1={gx} y1={gy} x2={gx + (R - 30) * Math.sin((ang * Math.PI) / 180)} y2={gy - (R - 30) * Math.cos((ang * Math.PI) / 180)} stroke="#fff" strokeWidth={4} strokeLinecap="round" />
              <circle cx={gx} cy={gy} r={10} fill="#fff" />
            </svg>
            <div style={{ position: "absolute", left: gx - 170, width: 340, top: gy + 34, textAlign: "center", ...In(f, 6) }}>
              <Mono>percepção de preço</Mono>
              <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: tip > 0.5 ? 64 : 44, color: tip > 0.5 ? ZALE.redBright : "#fff", textShadow: tip > 0.5 ? `0 0 30px rgba(240,58,30,${(0.6 * tip).toFixed(2)})` : undefined, marginTop: 6 }}>{state}</div>
            </div>
          </>
        );
      }}
    </PScene>
  );
};
