import React from "react";
import { Img, interpolate, staticFile } from "remotion";
import { BatteryLow, Check, CircleUserRound, FileText, HardDrive, ImageOff, Send } from "lucide-react";
import { FONT, MONO } from "./overlays";
import { ZALE } from "./theme";
import { Avatar, SEAM, Snd, SndSpan } from "./palco";
import { BACK_Z, Callout, clamp, eio, eout, FRONT_Z, mix, PhoneStage, PLATEAU, Pose, project, PW, Reveal, RollNumber, rollTicks } from "./apple-premium";
import { Glass, In, Mono, PScene, Typed } from "./apple-premium2";

// CENAS 13 a 25 do vídeo do iPhone na linguagem premium. Mundo "apple" (estúdio preto) volta nas falas sobre a Apple;
// da virada "numa venda, quem faz esse papel é você" em diante, o mundo "marca" (grafite + brilho vermelho).
// Mesmo padrão de som das cenas 3-12 (ver apple-premium2.tsx).

const H = SEAM;
const CX = 540;
const APPLE = "O jeito Apple";
const VOCE = "A sua venda";

/** cantoneiras de rastreio (visão computacional, como na referência) + confiança */
const Track: React.FC<{ f: number; at: number; box: [number, number, number, number]; tag: string; conf: string; color?: string }> = ({ f, at, box, tag, conf, color = "#fff" }) => {
  const t = eout(f, at, at + 12);
  const [x0, y0, x1, y1] = box;
  const pad = (1 - t) * 30;
  const L = 26;
  const c = [
    [x0 - pad, y0 - pad, 1, 1],
    [x1 + pad, y0 - pad, -1, 1],
    [x0 - pad, y1 + pad, 1, -1],
    [x1 + pad, y1 + pad, -1, -1],
  ];
  return (
    <>
      <svg width={1080} height={H} style={{ position: "absolute", inset: 0, opacity: t }}>
        {c.map(([x, y, sx, sy], i) => (
          <path key={i} d={`M ${x} ${y + sy * L} L ${x} ${y} L ${x + sx * L} ${y}`} fill="none" stroke={color} strokeWidth={2.5} />
        ))}
      </svg>
      <div style={{ position: "absolute", left: x0 - pad, top: y0 - pad - 30, opacity: t, fontFamily: MONO, fontSize: 15, letterSpacing: 2, color: "#0b0b0b", background: color, padding: "3px 8px", borderRadius: 4, whiteSpace: "nowrap" }}>
        {tag} {conf}
      </div>
    </>
  );
};

// ================================================================ 13. "A Apple não vende especificação." (vista explodida -> fecha)
export const ExplodedSpec: React.FC<{ life: number; tearAt: number }> = ({ life, tearAt }) => (
  <PScene
    life={life}
    world="apple"
    hud={{ left: APPLE, right: "10 · a virada" }}
    sounds={
      <>
        {[3, 7, 11, 15].map((t, i) => (
          <Snd key={i} at={t} name="tick" v={i % 2 ? 4 : 0} vol={0.13} />
        ))}
        <Snd at={tearAt} name="whoosh" k="assemble" vol={0.2} />
        <Snd at={tearAt + 10} name="ui" v={2} vol={0.2} />
      </>
    }
  >
    {(f) => {
      const close = eio(f, tearAt, tearAt + 14);
      const ex = 1 - close;
      const pose: Pose = { x: -0.42, y: 0.02, ry: mix(-1.05, -0.35, close), rx: -0.08, s: 0.95 };
      const labels: { p: [number, number, number]; k: string; v: string; y: number }[] = [
        { p: [0, 0.35, FRONT_Z + 0.42], k: "tela", v: "6,3” · 120 Hz", y: 250 },
        { p: [0, -0.18, 0.24], k: "bateria", v: "3.600 mAh", y: 380 },
        { p: [0.2, 0.2, 0.08], k: "processador", v: "3 nm", y: 510 },
        { p: [PLATEAU[0], PLATEAU[1], BACK_Z - 0.3], k: "câmeras", v: "48 MP", y: 640 },
      ];
      const lbl = 1 - eio(f, tearAt - 2, tearAt + 8);
      return (
        <>
          <PhoneStage pose={pose} explode={ex} turn={mix(-0.8, 0.4, f / life)} />
          <div style={{ position: "absolute", inset: 0, opacity: lbl }}>
            {labels.map((l, i) => (
              <Callout key={i} f={f} at={3 + i * 4} from={project(pose, l.p)} to={[640, l.y]} kicker={l.k} width={290}>
                <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 30, whiteSpace: "nowrap" }}>{l.v}</span>
              </Callout>
            ))}
          </div>
          <div style={{ position: "absolute", left: 600, top: 400 }}>
            <Mono style={{ ...In(f, tearAt + 4), marginBottom: 12 }}>a apple</Mono>
            <Reveal f={f} at={tearAt + 8} text="não vende" size={76} />
            <div style={{ height: 6 }} />
            <Reveal f={f} at={tearAt + 14} text="especificação." size={58} color="rgba(255,255,255,0.7)" weight={700} />
          </div>
        </>
      );
    }}
  </PScene>
);

// ================================================================ 14. "faz você enxergar o problema: memória cheia, bateria, foto"
export const YourPhone: React.FC<{ life: number; lensAt: number; storageAt: number; batteryAt: number; photoAt: number }> = ({ life, lensAt, storageAt, batteryAt, photoAt }) => (
  <PScene
    life={life}
    world="apple"
    hud={{ left: APPLE, right: "11 · o seu problema" }}
    sounds={
      <>
        <Snd at={lensAt} name="ui" v={1} vol={0.18} />
        {[1, 2, 3, 4].map((q) => (
          <Snd key={q} at={lensAt + Math.round(((storageAt - 4 - lensAt) * q) / 4)} name="tick" v={0} vol={0.09} />
        ))}
        {[storageAt, batteryAt, photoAt].map((t, i) => (
          <React.Fragment key={i}>
            <Snd at={t + 12} name="ui" v={0} vol={0.15} />
          </React.Fragment>
        ))}
        <Snd at={storageAt + 4} name="error" k="storage" vol={0.12} />
        <Snd at={batteryAt + 4} name="error" k="battery" vol={0.12} />
        <Snd at={photoAt + 2} name="click" k="shutter" vol={0.24} />
      </>
    }
  >
    {(f, fps) => {
      const pose: Pose = { x: -0.46, y: 0.02 + Math.sin(f / 45) * 0.01, ry: 0.22 + Math.sin(f / 70) * 0.04, rx: -0.03, s: 1 };
      const p = (x: number, y: number) => project(pose, [x, y, FRONT_Z + 0.002]);
      const bb = (x0: number, y0: number, x1: number, y1: number): [number, number, number, number] => {
        const a = p(x0, y0);
        const b = p(x1, y1);
        return [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[0], b[0]), Math.max(a[1], b[1])];
      };
      const scan = interpolate(f, [lensAt, storageAt - 4], [0, 1], clamp);
      const scanOn = f >= lensAt && f < storageAt + 4 ? 1 - eio(f, storageAt - 6, storageAt + 4) : 0;
      const phone = bb(-PW / 2 + 0.02, -0.72, PW / 2 - 0.02, 0.72);
      const sY = mix(phone[1], phone[3], (scan * 1.6) % 1);
      const shake = f >= photoAt ? Math.sin(f * 1.7) * 3 * (1 - eio(f, photoAt + 20, photoAt + 60)) : 0;
      return (
        <>
          <PhoneStage pose={pose} old screen={mix(0.85, 0.55, eio(f, batteryAt, batteryAt + 20))} turn={mix(-0.6, 0.4, f / life)} />
          <div style={{ position: "absolute", inset: 0, opacity: scanOn }}>
            <Track f={f} at={lensAt} box={phone} tag="CELULAR" conf="0,99" />
            <div style={{ position: "absolute", left: phone[0], width: phone[2] - phone[0], top: sY, height: 2, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent)", boxShadow: "0 0 18px rgba(255,255,255,0.7)" }} />
            <Glass style={{ left: 640, top: 250, width: 340, padding: "14px 20px", ...In(f, lensAt + 6) }}>
              <Mono>analisando o seu celular</Mono>
              <div style={{ fontWeight: 800, fontSize: 52, fontVariantNumeric: "tabular-nums" }}>{Math.round(scan * 100)}%</div>
            </Glass>
          </div>
          <Track f={f} at={storageAt} box={bb(-0.3, 0.05, 0.3, 0.6)} tag="MEMÓRIA" conf="0,97" color="#ff8a6a" />
          <Callout f={f} at={storageAt} from={p(0.3, 0.33)} to={[640, 250]} kicker="memória" width={340}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, fontWeight: 800, fontSize: 36 }}>
              <HardDrive size={30} strokeWidth={1.6} /> 98% cheia
            </div>
            <div style={{ height: 8, borderRadius: 4, background: "rgba(255,255,255,0.12)", marginTop: 10, overflow: "hidden" }}>
              <div style={{ width: `${(98 * eio(f, storageAt + 10, storageAt + 30)).toFixed(1)}%`, height: "100%", background: ZALE.redBright }} />
            </div>
          </Callout>
          <Track f={f} at={batteryAt} box={bb(0.12, 0.62, 0.32, 0.7)} tag="BATERIA" conf="0,95" color="#ff8a6a" />
          <Callout f={f} at={batteryAt} from={p(0.32, 0.66)} to={[640, 450]} kicker="bateria · 16:02" width={340}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, fontWeight: 800, fontSize: 36 }}>
              <BatteryLow size={34} strokeWidth={1.6} color={ZALE.redBright} /> 5%
            </div>
          </Callout>
          <Track f={f} at={photoAt} box={bb(-0.3, -0.62, 0.3, -0.08)} tag="FOTO" conf="0,91" color="#ff8a6a" />
          <Callout f={f} at={photoAt} from={p(0.3, -0.35)} to={[640, 650]} kicker="foto" width={340}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 96, height: 64, borderRadius: 8, background: "linear-gradient(135deg,#f0a35a,#8a5bd6)", filter: "blur(3px)", transform: `translateX(${shake.toFixed(1)}px)` }} />
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800, fontSize: 32 }}>
                <ImageOff size={26} strokeWidth={1.6} /> tremida
              </div>
            </div>
          </Callout>
          {void fps}
        </>
      );
    }}
  </PScene>
);

// ================================================================ 15. "lança o celular novo… você já está insatisfeito com o seu" (mudança de foco)
export const OldNewFocus: React.FC<{ life: number; newAt: number; dimAt: number }> = ({ life, newAt, dimAt }) => (
  <PScene
    life={life}
    world="apple"
    hud={{ left: APPLE, right: "11 · o seu problema" }}
    sounds={
      <>
        <Snd at={newAt} name="ui" v={1} vol={0.2} />
        <Snd at={newAt + 2} name="whoosh" k="rack" vol={0.14} />
        <Snd at={dimAt} name="switch" k="old-off" vol={0.24} />
      </>
    }
  >
    {(f) => {
      const rack = eio(f, newAt, newAt + 14);
      const dim = eio(f, dimAt, dimAt + 18);
      const oldP: Pose = { x: -0.42, y: -0.06, z: 0.55, ry: 0.35, rx: -0.03, s: 1 };
      const newP: Pose = { x: 0.42, y: 0.1 + Math.sin(f / 40) * 0.01, z: -0.7, ry: -0.3 + Math.sin(f / 60) * 0.03, rx: -0.03, s: 1 };
      return (
        <>
          <PhoneStage pose={newP} screen={mix(0.05, 1, rack)} env={mix(0.4, 1.1, rack)} turn={mix(-0.5, 0.5, f / life)} style={{ filter: `blur(${(mix(9, 0, rack)).toFixed(2)}px)` }} />
          <div style={{ position: "absolute", left: 590, top: 200, width: 420, height: 560, borderRadius: "50%", background: "radial-gradient(ellipse at 50% 50%, rgba(160,120,255,0.22), rgba(0,0,0,0) 70%)", opacity: rack }} />
          <PhoneStage pose={oldP} old screen={mix(0.8, 0, dim)} env={mix(1, 0.5, dim)} style={{ filter: `blur(${(mix(0, 8, rack)).toFixed(2)}px)`, opacity: mix(1, 0.6, dim) }} />
          <Mono style={{ position: "absolute", left: 170, top: 850, ...In(f, 6) }}>o seu</Mono>
          <Mono color="#fff" style={{ position: "absolute", left: 720, top: 800, ...In(f, newAt + 4) }}>o novo</Mono>
        </>
      );
    }}
  </PScene>
);

// ================================================================ 16-18. "quem faz esse papel é você · a ferramenta são perguntas · em vez de mandar a proposta, pergunta"
export const RoleQuestion: React.FC<{ life: number; roleAt: number; toolAt: number; strikeAt: number; askAt: number }> = ({ life, roleAt, toolAt, strikeAt, askAt }) => (
  <PScene
    life={life}
    world="marca"
    hud={{ left: VOCE, right: "12 · o seu papel" }}
    sounds={
      <>
        <Snd at={4} name="switch" k="spot" vol={0.2} />
        <Snd at={roleAt} name="ui" v={1} vol={0.18} />
        <Snd at={toolAt} name="whoosh" k="flip" vol={0.18} />
        <Snd at={toolAt + 10} name="tick" v={4} vol={0.14} />
        <Snd at={strikeAt} name="click" k="btn" vol={0.22} />
        <Snd at={askAt} name="ui" v={1} vol={0.18} />
        <SndSpan at={askAt + 6} dur={20} name="type" vol={0.14} />
      </>
    }
  >
    {(f) => {
      const beam = eio(f, 2, roleAt);
      const flip = eio(f, toolAt, toolAt + 16);
      const cardOut = eio(f, strikeAt - 8, strikeAt + 4);
      const btn = eout(f, strikeAt, strikeAt + 12);
      const morph = eio(f, askAt, askAt + 14);
      const bx = mix(-240, 0, beam);
      return (
        <>
          <div style={{ position: "absolute", left: CX - 300 + bx, top: -60, width: 600, height: 1000, background: "conic-gradient(from 180deg at 50% 0%, transparent 160deg, rgba(255,240,230,0.13) 172deg, rgba(255,240,230,0.2) 180deg, rgba(255,240,230,0.13) 188deg, transparent 200deg)", opacity: mix(0.3, 1, beam) * (1 - cardOut * 0.6) }} />
          <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: H, perspective: 1400 }}>
            <div style={{ position: "absolute", left: CX - 300, top: 300, width: 600, height: 380, transformStyle: "preserve-3d", transform: `translateY(${(-cardOut * 160).toFixed(1)}px) rotateY(${(flip * 180).toFixed(2)}deg) scale(${mix(1, 0.8, cardOut).toFixed(3)})`, opacity: 1 - cardOut, ...(f < roleAt - 6 ? { opacity: 0 } : {}) }}>
              <Glass style={{ inset: 0, padding: "34px 40px", backfaceVisibility: "hidden", display: "flex", flexDirection: "column", justifyContent: "center", ...(f >= roleAt - 6 ? In(f, roleAt - 6, 16) : {}) }}>
                <CircleUserRound size={70} strokeWidth={1.2} color="rgba(255,255,255,0.85)" style={{ filter: "drop-shadow(0 0 16px rgba(255,255,255,0.35))" }} />
                <Mono style={{ marginTop: 18 }}>numa venda</Mono>
                <div style={{ marginTop: 8 }}>
                  <Reveal f={f} at={roleAt} text="esse papel é seu" size={60} />
                </div>
              </Glass>
              <Glass style={{ inset: 0, padding: "34px 40px", backfaceVisibility: "hidden", transform: "rotateY(180deg)", display: "flex", alignItems: "center", gap: 36 }}>
                <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 200, lineHeight: 1, color: ZALE.redBright, textShadow: "0 0 40px rgba(240,58,30,0.55)", transform: `rotateY(${(Math.sin(f / 18) * 20).toFixed(1)}deg)` }}>?</div>
                <div>
                  <Mono>ferramenta 01</Mono>
                  <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 64, color: "#fff", marginTop: 6 }}>perguntas</div>
                </div>
              </Glass>
            </div>
          </div>
          <div style={{ position: "absolute", left: CX - mix(210, 360, morph), top: 440, width: mix(420, 720, morph), height: 110, opacity: btn, transform: `translateY(${((1 - btn) * 20).toFixed(1)}px)` }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: mix(55, 22, morph), background: `rgba(${Math.round(mix(47, 18, morph))},${Math.round(mix(107, 18, morph))},${Math.round(mix(255, 22, morph))},${mix(1, 0.7, morph).toFixed(2)})`, border: `1px solid rgba(255,255,255,${mix(0, 0.16, morph).toFixed(2)})`, boxShadow: `0 0 ${mix(40, 0, morph).toFixed(0)}px rgba(47,107,255,0.6)` }} />
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 14, fontFamily: FONT, fontWeight: 700, fontSize: 40, color: "#fff", opacity: 1 - morph }}>
              <Send size={36} /> Enviar proposta
            </div>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", padding: "0 34px", fontFamily: FONT, fontWeight: 600, fontSize: 40, color: "#fff", opacity: morph }}>
              <Typed text="Me conta uma coisa…" f={f} at={askAt + 6} dur={20} caret />
            </div>
          </div>
          <Mono style={{ position: "absolute", left: CX - 360, top: 410, opacity: morph }}>em vez de mandar a proposta</Mono>
        </>
      );
    }}
  </PScene>
);

// ================================================================ 19. as 3 perguntas, em cartões que a câmera atravessa
export const QuestionDepth: React.FC<{ life: number; cards: { text: string; at: number }[]; calAt?: number }> = ({ life, cards, calAt }) => (
  <PScene
    life={life}
    world="marca"
    hud={{ left: VOCE, right: "13 · as perguntas" }}
    sounds={
      <>
        {cards.map((c, i) => (
          <React.Fragment key={i}>
            <Snd at={c.at} name="whoosh" k="q-card" vol={0.15} />
            <Snd at={c.at + 6} name="tick" v={i % 2 ? 4 : 0} vol={0.13} />
          </React.Fragment>
        ))}
        {calAt !== undefined ? (
          <>
            <Snd at={calAt + 12} name="ui" v={0} vol={0.15} />
          </>
        ) : null}
      </>
    }
  >
    {(f) => (
      <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: H, perspective: 1200 }}>
        {cards.map((c, i) => {
          const inn = eio(f, c.at, c.at + 16);
          const depth = cards.slice(i + 1).reduce((d, n) => d + eio(f, n.at, n.at + 16), 0);
          const z = mix(500, 0, inn) - depth * 320;
          const y = -depth * 70;
          const blur = (1 - inn) * 10 + depth * 3.5;
          return (
            <Glass key={i} style={{ left: CX - 400, top: 360, width: 800, padding: "34px 40px", transform: `translate3d(0, ${y.toFixed(1)}px, ${z.toFixed(1)}px)`, opacity: Math.min(1, inn * 1.5) * (1 - depth * 0.35), filter: blur > 0.2 ? `blur(${blur.toFixed(2)}px)` : undefined }}>
              <Mono color={ZALE.redBright}>pergunta {String(i + 1).padStart(2, "0")}</Mono>
              <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 50, lineHeight: 1.12, marginTop: 12, letterSpacing: -1 }}>{c.text}</div>
            </Glass>
          );
        })}
        {calAt !== undefined ? (
          <Callout f={f} at={calAt} from={[760, 600]} to={[820, 760]} kicker="prazo" width={190}>
            <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 40, whiteSpace: "nowrap" }}>
              31 <span style={{ color: ZALE.redBright }}>DEZ</span>
            </div>
          </Callout>
        ) : null}
      </div>
    )}
  </PScene>
);

// ================================================================ 20. "é ele mesmo que está te dizendo o que ele precisa" (transcrição)
export const TranscriptPanel: React.FC<{ life: number; typeAt: number; highlights: number[] }> = ({ life, typeAt, highlights }) => {
  const rows: { t: string; pre: string; hot?: string; post?: string; h?: number }[] = [
    { t: "00:12", pre: "Hoje a gente ", hot: "perde muito lead", post: " no WhatsApp.", h: 0 },
    { t: "00:19", pre: "Ninguém responde rápido." },
    { t: "00:26", pre: "Isso tá custando caro pra gente." },
    { t: "00:33", pre: "Preciso ", hot: "resolver isso até dezembro", post: ".", h: 1 },
  ];
  return (
    <PScene
      life={life}
      world="marca"
      hud={{ left: VOCE, right: "14 · a resposta" }}
      sounds={
        <>
          {rows.map((_, i) => (
            <Snd key={i} at={typeAt + i * 10} name="tick" v={i % 2 ? 4 : 0} vol={0.12} />
          ))}
          {highlights.map((h, i) => (
            <SndSpan key={i} at={h} dur={12} name="write" vol={0.2} />
          ))}
        </>
      }
    >
      {(f) => (
        <Glass style={{ left: 70, top: 220, width: 940, padding: "22px 30px 26px", ...In(f, 2, 16) }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ width: 12, height: 12, borderRadius: 6, background: ZALE.redBright, opacity: Math.floor(f / 12) % 2 ? 0.4 : 1, boxShadow: `0 0 12px ${ZALE.redBright}` }} />
              <Mono>transcrição · cliente</Mono>
            </div>
            <svg width={200} height={34}>
              {Array.from({ length: 28 }).map((_, i) => {
                const hgt = 4 + Math.abs(Math.sin(f / 3 + i * 1.3) * Math.sin(i * 0.7)) * 28;
                return <rect key={i} x={i * 7} y={17 - hgt / 2} width={4} height={hgt} rx={2} fill="rgba(255,255,255,0.45)" />;
              })}
            </svg>
          </div>
          {rows.map((r, i) => {
            const at = typeAt + i * 10;
            const mark = r.h !== undefined && highlights[r.h] !== undefined ? eio(f, highlights[r.h], highlights[r.h] + 12) : 0;
            return (
              <div key={i} style={{ display: "flex", gap: 22, alignItems: "baseline", padding: "14px 0", borderTop: "1px solid rgba(255,255,255,0.08)", ...In(f, at, 12) }}>
                <span style={{ fontFamily: MONO, fontSize: 18, color: "rgba(255,255,255,0.4)", letterSpacing: 2 }}>{r.t}</span>
                <span style={{ fontFamily: FONT, fontSize: 34, fontWeight: 600, color: "rgba(255,255,255,0.88)" }}>
                  {r.pre}
                  {r.hot ? (
                    <span style={{ color: mark > 0.5 ? "#fff" : undefined, background: `linear-gradient(90deg, rgba(${ZALE.redRgb},0.75) ${(mark * 100).toFixed(1)}%, transparent ${(mark * 100).toFixed(1)}%)`, borderRadius: 6, padding: "0 4px" }}>{r.hot}</span>
                  ) : null}
                  {r.post}
                </span>
              </div>
            );
          })}
        </Glass>
      )}
    </PScene>
  );
};

// ================================================================ 21. proposta: de lista de características para "a resposta pro que você me contou"
export const ProposalAnswer: React.FC<{ life: number; listAt: number; morphAt: number }> = ({ life, listAt, morphAt }) => (
  <PScene
    life={life}
    world="marca"
    hud={{ left: VOCE, right: "14 · a resposta" }}
    sounds={
      <>
        <Snd at={4} name="ui" v={1} vol={0.15} />
        <Snd at={listAt} name="flip" v={0} vol={0.24} />
        <Snd at={morphAt} name="whoosh" k="morph" vol={0.18} />
        {[0, 1, 2].map((i) => (
          <Snd key={i} at={morphAt + 16 + i * 5} name="tick" v={i % 2 ? 4 : 0} vol={0.14} />
        ))}
      </>
    }
  >
    {(f) => {
      const m = eio(f, morphAt, morphAt + 18);
      const doc = eout(f, listAt - 10, listAt + 8);
      const chips = [
        { t: "perde muito lead", from: [70, 220], to: [300, 520] },
        { t: "resolver até dezembro", from: [70, 290], to: [300, 590] },
      ];
      return (
        <>
          <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: H, perspective: 1500 }}>
            <div style={{ position: "absolute", left: CX - 300, top: 240, width: 600, height: 660, background: "linear-gradient(#fbfbf8,#ecece7)", borderRadius: 10, boxShadow: "0 40px 90px rgba(0,0,0,0.55)", padding: "38px 44px", boxSizing: "border-box", opacity: doc, transform: `rotateX(${mix(18, 6, doc).toFixed(2)}deg) rotateY(${mix(-10, -4, doc).toFixed(2)}deg) translateY(${((1 - doc) * 40).toFixed(1)}px)` }}>
              <div style={{ fontFamily: MONO, fontSize: 15, letterSpacing: 3, color: ZALE.red }}>PROPOSTA</div>
              <div style={{ position: "relative", height: 130 }}>
                <div style={{ position: "absolute", inset: 0, fontFamily: FONT, fontWeight: 800, fontSize: 44, color: "#9a9c97", opacity: 1 - m }}>Características</div>
                <div style={{ position: "absolute", inset: 0, fontFamily: FONT, fontWeight: 800, fontSize: 44, lineHeight: 1.08, color: "#111", opacity: m, filter: m < 0.98 ? `blur(${((1 - m) * 6).toFixed(2)}px)` : undefined }}>A resposta pro que você me contou</div>
              </div>
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} style={{ height: 12, borderRadius: 3, background: "#d6d7d2", margin: "20px 0", width: `${50 + ((i * 29) % 40)}%`, opacity: 1 - m, filter: m > 0.02 ? `blur(${(m * 5).toFixed(2)}px)` : undefined }} />
              ))}
              <div style={{ position: "absolute", left: 44, right: 44, top: 330 }}>
                {["Nenhum lead sem resposta", "Resolvido até dezembro", "Começa na semana que vem"].map((t, i) => (
                  <div key={i} style={{ display: "flex", gap: 14, alignItems: "center", marginTop: i ? 26 : 0, fontFamily: FONT, fontWeight: 700, fontSize: 30, color: "#111", ...In(f, morphAt + 16 + i * 5) }}>
                    <Check size={30} color="#16a34a" strokeWidth={3} /> {t}
                  </div>
                ))}
              </div>
            </div>
          </div>
          {chips.map((c, i) => {
            const fly = eio(f, morphAt + i * 3, morphAt + 18 + i * 3);
            const x = mix(c.from[0], c.to[0], fly);
            const y = mix(c.from[1], c.to[1], fly);
            return (
              <div key={i} style={{ position: "absolute", left: x, top: y, padding: "8px 16px", borderRadius: 10, background: `rgba(${ZALE.redRgb},0.8)`, fontFamily: FONT, fontWeight: 700, fontSize: 28, color: "#fff", whiteSpace: "nowrap", opacity: (1 - fly) * eout(f, 4 + i * 4, 18 + i * 4), transform: `scale(${mix(1, 0.7, fly).toFixed(3)})` }}>
                “{c.t}”
              </div>
            );
          })}
        </>
      );
    }}
  </PScene>
);

// ================================================================ 22. comparado com o concorrente -> com o custo de continuar como está
export const CostBars: React.FC<{ life: number; compAt: number; swapAt: number }> = ({ life, compAt, swapAt }) => (
  <PScene
    life={life}
    world="marca"
    hud={{ left: VOCE, right: "15 · a comparação" }}
    sounds={
      <>
        <Snd at={6} name="tick" v={0} vol={0.14} />
        <Snd at={compAt} name="ui" v={1} vol={0.16} />
        <Snd at={swapAt} name="riser" k="grow" vol={0.16} />
        <Snd at={swapAt + 26} name="thud" k="cost" vol={0.12} />
      </>
    }
  >
    {(f) => {
      const a = eio(f, 6, 26);
      const b = eio(f, compAt, compAt + 20);
      const sw = eio(f, swapAt, swapAt + 30);
      const pan = sw * 330;
      const base = 820;
      const h1 = 280 * a;
      const h2 = mix(250 * b, 1250, sw);
      return (
        <div style={{ position: "absolute", inset: 0, transform: `translateY(${pan.toFixed(1)}px)` }}>
          <svg width={1080} height={2000} style={{ position: "absolute", left: 0, top: -1020 }}>
            {Array.from({ length: 36 }).map((_, i) => (
              <g key={i}>
                <line x1={120} x2={i % 5 ? 136 : 150} y1={1020 + base - i * 60} y2={1020 + base - i * 60} stroke="rgba(255,255,255,0.3)" strokeWidth={2} />
              </g>
            ))}
            <line x1={120} x2={120} y1={1020 + base - 2100} y2={1020 + base} stroke="rgba(255,255,255,0.2)" strokeWidth={2} />
            <line x1={120} x2={980} y1={1020 + base} y2={1020 + base} stroke="rgba(255,255,255,0.25)" strokeWidth={2} />
          </svg>
          <div style={{ position: "absolute", left: 250, width: 220, top: base - h1, height: h1, borderRadius: "14px 14px 0 0", background: `linear-gradient(rgba(${ZALE.redRgb},0.9), rgba(${ZALE.redRgb},0.45))`, boxShadow: `0 0 40px rgba(${ZALE.redRgb},0.35)` }} />
          <Mono color="#fff" style={{ position: "absolute", left: 250, width: 220, textAlign: "center", top: base - h1 - 44, opacity: a }}>seu preço</Mono>
          <div style={{ position: "absolute", left: 610, width: 220, top: base - h2, height: h2, borderRadius: "14px 14px 0 0", background: sw > 0 ? `linear-gradient(rgba(255,255,255,${mix(0.25, 0.5, sw).toFixed(2)}), rgba(255,255,255,0.1))` : "linear-gradient(rgba(255,255,255,0.25), rgba(255,255,255,0.1))", border: "1px solid rgba(255,255,255,0.2)" }} />
          <div style={{ position: "absolute", left: 560, width: 320, textAlign: "center", top: Math.max(base - h2 - (sw > 0 ? 100 : 44), 250 - pan), opacity: b, textShadow: "0 2px 18px rgba(0,0,0,0.8)" }}>
            <div style={{ position: "absolute", inset: 0, opacity: 1 - sw }}>
              <Mono>preço do concorrente</Mono>
            </div>
            <div style={{ opacity: sw }}>
              <Mono color={ZALE.redBright}>custo de continuar</Mono>
              <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 44, color: "#fff", marginTop: 6 }}>como está</div>
            </div>
          </div>
        </div>
      );
    }}
  </PScene>
);

// silhueta sem rosto (regra: nada de personagem desenhado), recortada pela luz da loja
const Figure: React.FC<{ x: number; y: number; s?: number; rim: string; check?: number }> = ({ x, y, s = 1, rim, check = 0 }) => (
  <div style={{ position: "absolute", left: x, top: y, width: 110 * s, height: 240 * s }}>
    <svg width={110 * s} height={240 * s} viewBox="0 0 110 240">
      <circle cx={55} cy={40} r={28} fill="#070707" stroke={rim} strokeWidth={2} strokeOpacity={0.55} />
      <path d="M8 240 L10 120 Q14 80 55 78 Q96 80 100 120 L102 240 Z" fill="#070707" stroke={rim} strokeWidth={2} strokeOpacity={0.45} />
    </svg>
    {check > 0 ? (
      <div style={{ position: "absolute", left: 55 * s - 22, top: -52, width: 44, height: 44, borderRadius: 22, background: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${check.toFixed(3)})`, boxShadow: "0 0 20px rgba(22,163,74,0.6)" }}>
        <Check size={28} color="#fff" strokeWidth={3.5} />
      </div>
    ) : null}
  </div>
);

// ================================================================ 23-24. fila na porta: "você já chega convencido" -> "o seu cliente também chega"
export const StoreQueue: React.FC<{ life: number; queueAt: number; convAt: number; swapAt: number; checkAt: number }> = ({ life, queueAt, convAt, swapAt, checkAt }) => (
  <PScene
    life={life}
    world="apple"
    hud={{ left: APPLE, left2: VOCE, switchAt: swapAt, right: "16 · a fila" }}
    sounds={
      <>
        {[0, 1, 2, 3].map((i) => (
          <Snd key={i} at={queueAt + i * 5} name="step" v={i % 2 ? 1 : 3} vol={0.18} />
        ))}
        {rollTicks(queueAt, 40, 5).map((t, i) => (
          <Snd key={`c${i}`} at={t} name="tick" v={0} vol={0.09} />
        ))}
        <Snd at={convAt} name="ui" v={1} vol={0.16} />
        <Snd at={swapAt} name="switch" k="sign" vol={0.24} />
        <Snd at={checkAt} name="ding" k="checks" vol={0.2} />
      </>
    }
  >
    {(f) => {
      const sw = eio(f, swapAt, swapAt + 16);
      const glow = sw > 0.5 ? `${ZALE.redRgb}` : "255,246,230";
      const rim = sw > 0.5 ? "#ff7a5c" : "#fff4e0";
      const count = Math.round(312 * eio(f, queueAt, queueAt + 40));
      return (
        <>
          <div style={{ position: "absolute", left: 640, top: 250, width: 380, height: 580, background: `linear-gradient(rgba(${glow},0.95), rgba(${glow},0.55))`, borderRadius: "18px 18px 0 0", boxShadow: `0 0 120px 30px rgba(${glow},0.35)` }}>
            <div style={{ position: "absolute", left: 30, right: 30, top: 70, bottom: 0, border: "2px solid rgba(0,0,0,0.25)", borderBottom: "none", borderRadius: "10px 10px 0 0" }} />
            <div style={{ position: "absolute", left: 0, right: 0, top: 18, textAlign: "center", fontFamily: MONO, fontSize: 22, letterSpacing: 5, color: "rgba(0,0,0,0.65)" }}>
              <span style={{ opacity: 1 - sw }}>LOJA</span>
            </div>
            <div style={{ position: "absolute", left: 0, right: 0, top: 14, textAlign: "center", fontFamily: MONO, fontSize: 24, letterSpacing: 5, color: "#fff", opacity: sw, fontWeight: 700 }}>SUA EMPRESA</div>
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 830, height: 150, background: `radial-gradient(ellipse 50% 60% at 78% 0%, rgba(${glow},0.25), transparent 70%)` }} />
          {Array.from({ length: 6 }).map((_, i) => {
            const t = eio(f, queueAt + i * 5, queueAt + i * 5 + 24);
            const x = mix(-160, 520 - i * 88, t);
            const bob = Math.abs(Math.sin((f - queueAt - i * 5) / 4)) * 6 * (1 - t);
            const ck = f >= checkAt ? eout(f, checkAt + i * 2, checkAt + i * 2 + 10) : 0;
            return <Figure key={i} x={x} y={600 - bob - (i % 2) * 8} s={1 - i * 0.04} rim={rim} check={ck} />;
          })}
          <Glass style={{ left: 60, top: 200, width: 280, padding: "14px 20px", ...In(f, queueAt + 4) }}>
            <Mono>fila</Mono>
            <div style={{ fontWeight: 800, fontSize: 56, fontVariantNumeric: "tabular-nums" }}>{count}</div>
            <Mono size={14}>pessoas esperando</Mono>
          </Glass>
          <Glass style={{ left: 60, top: 390, width: 440, padding: "14px 22px", opacity: eout(f, convAt, convAt + 14) * (1 - sw), transform: `translateY(${((1 - eout(f, convAt, convAt + 14)) * 14).toFixed(1)}px)` }}>
            <Mono>quem entra</Mono>
            <div style={{ fontWeight: 800, fontSize: 40 }}>já chega convencido</div>
          </Glass>
          <Glass style={{ left: 60, top: 390, width: 460, padding: "14px 22px", ...In(f, checkAt) }}>
            <Mono color={ZALE.redBright}>o seu cliente também</Mono>
            <div style={{ fontWeight: 800, fontSize: 40 }}>com as perguntas certas</div>
          </Glass>
        </>
      );
    }}
  </PScene>
);

// ================================================================ 25. CTA (refeito: o card final "não ficou bom", o "Seguindo" estava apertado e a
// transição desfocava para o nada). Casado com a fala:
// "parar de ficar mandando proposta e parar de fazer follow up infinito" -> conversa com cobranças subindo sem parar,
// todas não lidas, contador de follow-up; "me segue aqui" -> a conversa sobe e sai enquanto o perfil entra por baixo
// (sobreposição, nada de preto); o botão Seguir é tocado e vira Seguindo; "todo dia eu posto conteúdo de vendas" ->
// a semana acende dia a dia; "para você fechar mais" -> fecha com a frase.
export const CtaFollow: React.FC<{ life: number; proposalAt: number; loopAt: number; breakAt: number; dailyAt: number; salesAt: number; closeAt: number; handle: string }> = ({
  life,
  proposalAt,
  loopAt,
  breakAt,
  dailyAt,
  salesAt,
  closeAt,
  handle,
}) => {
  const msgs = ["Conseguiu ver a proposta?", "Alguma novidade?", "Passando pra lembrar…", "Oi! Tudo bem por aí?", "Conseguiu olhar?", "Só pra não esquecer…", "E aí, alguma decisão?", "Fico no aguardo!"];
  // cada cobrança entra num quadro; acelera no "follow up infinito"
  const times: number[] = [];
  let t = 8;
  for (let i = 0; i < msgs.length; i++) {
    times.push(Math.round(t));
    t += t < loopAt ? 22 : 7;
  }
  const press = breakAt + 22;
  const days = ["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"];
  const dayAt = (i: number) => dailyAt + 4 + i * 4;
  return (
    <PScene
      life={life}
      world="marca"
      hud={{ left: VOCE, right: "17 · o próximo passo", hideAt: breakAt - 4 }}
      sounds={
        <>
          {times.map((tt, i) => (tt < breakAt ? <Snd key={i} at={tt} name="pop" k="chat-in" vol={i < 3 ? 0.16 : 0.1} /> : null))}
          <Snd at={proposalAt} name="ui" v={1} vol={0.18} />
          <Snd at={loopAt} name="whoosh" k="loop" vol={0.14} />
          <Snd at={breakAt - 2} name="whoosh" k="cta" vol={0.16} />
          <Snd at={breakAt + 6} name="ui" v={2} vol={0.2} />
          <Snd at={press} name="click" k="follow" vol={0.26} />
          {days.map((_, i) => (
            <Snd key={`d${i}`} at={dayAt(i)} name="tick" v={0} vol={0.09} />
          ))}
          <Snd at={salesAt} name="ui" v={0} vol={0.16} />
          <Snd at={closeAt} name="ding" k="close" vol={0.18} />
        </>
      }
    >
      {(f) => {
        const out = eio(f, breakAt - 4, breakAt + 12); // a conversa sobe e sai
        const inn = eio(f, breakAt, breakAt + 16); // o perfil sobe e entra (sobreposto)
        const shown = times.filter((tt) => f >= tt).length;
        const n = 6 + shown;
        const followed = f >= press;
        const tap = f >= press ? eout(f, press, press + 14) : 0;
        const pz = f >= press && f < press + 4 ? 0.96 : 1;
        return (
          <>
            {/* conversa com cobranças subindo */}
            <div style={{ position: "absolute", left: CX - 330, top: 190, width: 660, height: 690, opacity: 1 - out, transform: `translateY(${(-out * 260).toFixed(1)}px) scale(${mix(1, 0.9, out).toFixed(3)})` }}>
              <Glass style={{ inset: 0, padding: 0, overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 22px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  <CircleUserRound size={36} strokeWidth={1.4} color="rgba(255,255,255,0.7)" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 26 }}>cliente</div>
                    <Mono size={13}>visto por último há 9 dias</Mono>
                  </div>
                  <Mono color={ZALE.redBright}>follow-up nº {n}</Mono>
                </div>
                <div style={{ position: "absolute", left: 0, right: 0, top: 78, bottom: 0, padding: "0 22px 20px", display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "flex-end", gap: 12, overflow: "hidden", maskImage: "linear-gradient(transparent 0, #000 60px)" }}>
                  {msgs.slice(0, shown).map((m, i) => {
                    const k = eout(f, times[i], times[i] + 8);
                    return (
                      <div key={i} style={{ maxWidth: 470, opacity: k, transform: `translateY(${((1 - k) * 24).toFixed(1)}px)` }}>
                        {i === 0 ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, padding: "10px 14px", borderRadius: 12, background: `rgba(${ZALE.redRgb},0.18)`, border: "1px solid rgba(240,58,30,0.35)", fontSize: 22, opacity: f >= proposalAt ? 1 : 0.0 }}>
                            <FileText size={22} /> proposta_final_v4.pdf
                          </div>
                        ) : null}
                        <div style={{ padding: "12px 18px 22px", borderRadius: "18px 6px 18px 18px", background: "rgba(15,90,72,0.85)", fontSize: 28, fontWeight: 600, position: "relative" }}>
                          {m}
                          <span style={{ position: "absolute", right: 10, bottom: 4, fontFamily: MONO, fontSize: 13, color: "rgba(255,255,255,0.5)" }}>✓✓ não lida</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Glass>
            </div>
            {/* perfil */}
            <div style={{ position: "absolute", left: CX - 340, top: 200, width: 680, opacity: inn, transform: `translateY(${((1 - inn) * 160).toFixed(1)}px)` }}>
              <Glass style={{ position: "relative", padding: "34px 36px 30px", display: "flex", flexDirection: "column", alignItems: "center" }}>
                <Avatar size={150} />
                <div style={{ fontWeight: 800, fontSize: 52, marginTop: 20, letterSpacing: -1 }}>{handle}</div>
                <Mono size={16} style={{ marginTop: 6 }}>vendas · processo comercial</Mono>
                <div style={{ position: "relative", marginTop: 26, width: "100%", height: 76, borderRadius: 18, overflow: "hidden", background: followed ? "rgba(255,255,255,0.12)" : ZALE.red, border: `1px solid rgba(255,255,255,${followed ? 0.2 : 0})`, display: "flex", alignItems: "center", justifyContent: "center", gap: 12, fontWeight: 800, fontSize: 32, transform: `scale(${pz})`, boxShadow: followed ? "none" : `0 12px 40px rgba(${ZALE.redRgb},0.45)` }}>
                  {followed ? (
                    <>
                      <Check size={30} strokeWidth={3} /> Seguindo
                    </>
                  ) : (
                    "Seguir"
                  )}
                  {tap > 0 && tap < 1 ? <div style={{ position: "absolute", left: "50%", top: "50%", width: 700 * tap, height: 700 * tap, marginLeft: -350 * tap, marginTop: -350 * tap, borderRadius: "50%", background: `rgba(255,255,255,${(0.35 * (1 - tap)).toFixed(2)})` }} /> : null}
                </div>
              </Glass>
            </div>
            {/* a semana acendendo: "todo dia eu posto" */}
            <div style={{ position: "absolute", left: CX - 340, width: 680, top: 700, display: "flex", gap: 10 }}>
              {days.map((d, i) => {
                const k = eout(f, dayAt(i), dayAt(i) + 8);
                return (
                  <div key={i} style={{ flex: 1, height: 84, borderRadius: 14, background: `rgba(${ZALE.redRgb},${(0.85 * k).toFixed(2)})`, border: "1px solid rgba(255,255,255,0.12)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, opacity: f >= dailyAt ? 0.35 + 0.65 * k : 0, transform: `translateY(${((1 - k) * 10).toFixed(1)}px)` }}>
                    <span style={{ fontFamily: MONO, fontSize: 15, letterSpacing: 2, color: "#fff" }}>{d}</span>
                    <span style={{ width: 10, height: 10, borderRadius: 5, background: "#fff", opacity: k }} />
                  </div>
                );
              })}
            </div>
            <div style={{ position: "absolute", left: 0, right: 0, top: 812, textAlign: "center", ...In(f, salesAt) }}>
              <span style={{ fontFamily: MONO, fontSize: 18, letterSpacing: 4, color: "rgba(255,255,255,0.6)" }}>CONTEÚDO DE VENDAS · TODO DIA</span>
            </div>
            <div style={{ position: "absolute", left: 0, right: 0, top: 846, textAlign: "center" }}>
              <Reveal f={f} at={closeAt} text="para você fechar mais" size={42} color={ZALE.redBright} />
            </div>
          </>
        );
      }}
    </PScene>
  );
};

void RollNumber;
