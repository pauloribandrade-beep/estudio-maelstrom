import React from "react";
import { Easing, Img, OffthreadVideo, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { LucideIcon } from "lucide-react";
import { FONT, MONO } from "./overlays";
import { ZALE, cap } from "./theme";
import { SEAM, Snd, SndSpan, STAGE } from "./palco";

import { TX } from "./textos";
// CENAS RICAS do palco: mockups do mundo da clínica que DESCREVEM o que está
// sendo falado, sempre com movimento contínuo (flutuar, contar, desenhar,
// digitar, cursor clicando). Um por vez no palco.
//
// NÚMEROS nos mockups: só reais (fornecidos pelo usuário) ou claramente
// ilustrativos e sem promessa (sem R$ de faturamento, sem "% de conversão"
// como resultado). Regra ZALE: nunca inventar caso ou resultado.

const CX = 540;
const CY = (STAGE.y0 + STAGE.y1) / 2;
export const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
export const sp = (f: number, fps: number, at = 0, k = { damping: 14, stiffness: 190, mass: 0.7 }) => (f < at ? 0 : spring({ frame: f - at, fps, config: k }));

// Flutuação e entrada/saída comuns a toda cena.
const useScene = (life: number) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = sp(f, fps);
  const out = interpolate(f, [life - 6, life], [1, 0], { ...clamp, easing: Easing.in(Easing.cubic) });
  const float = Math.sin(f / 22) * 6;
  const push = 1; // só sobe e desce (pedido do usuário); sem zoom lento
  return { f, fps, p, a: Math.min(p, out), float, push };
};

export const Scene: React.FC<{ life: number; w?: number; h?: number; y?: number; children: (s: ReturnType<typeof useScene>) => React.ReactNode; sfx?: boolean }> = ({
  life,
  w = 900,
  y = CY,
  children,
  sfx = true,
}) => {
  const s = useScene(life);
  return (
    <>
      <div style={{ position: "absolute", left: CX - w / 2, width: w, top: y, transform: `translate3d(0, calc(-50% + ${s.float.toFixed(3)}px), 0) scale(${s.p > 0.997 ? 1 : (0.9 + 0.1 * s.p) * s.push})`, willChange: "transform", backfaceVisibility: "hidden", opacity: s.a, fontFamily: FONT }}>
        {children(s)}
      </div>
      {/* sem whoosh na entrada (o usuário não gostou): a cena entra em silêncio */}
      {void sfx}
    </>
  );
};

export const card: React.CSSProperties = { background: "#171717", borderRadius: 28, border: "1px solid rgba(255,255,255,0.09)", boxShadow: "0 40px 100px rgba(0,0,0,0.55)" };
export const glow = (c = `rgba(${ZALE.redRgb},0.35)`) => ({ boxShadow: `0 0 0 1px rgba(255,255,255,0.06), 0 0 120px ${c}, 0 40px 100px rgba(0,0,0,0.55)` });

// ---------- cursor ----------
// Seta que anda entre pontos (em px da cena) e clica (pulso + som) no fim.
export const Cursor: React.FC<{ path: [number, number][]; at: number; dur?: number; click?: boolean }> = ({ path, at, dur = 18, click = true }) => {
  const f = useCurrentFrame();
  const t = interpolate(f, [at, at + dur], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const seg = Math.min(path.length - 2, Math.floor(t * (path.length - 1)));
  const lt = t * (path.length - 1) - seg;
  const [x0, y0] = path[seg];
  const [x1, y1] = path[seg + 1] ?? path[seg];
  const x = x0 + (x1 - x0) * lt;
  const y = y0 + (y1 - y0) * lt;
  const ck = at + dur;
  const pulse = interpolate(f, [ck, ck + 12], [0, 1], clamp);
  if (f < at - 4) return null;
  return (
    <>
      <div style={{ position: "absolute", left: x, top: y, pointerEvents: "none" }}>
        {click && f >= ck ? <div style={{ position: "absolute", left: -30 * pulse, top: -30 * pulse, width: 60 * pulse, height: 60 * pulse, borderRadius: "50%", border: `3px solid rgba(255,255,255,${1 - pulse})` }} /> : null}
        <svg width={46} height={46} viewBox="0 0 24 24" style={{ transform: `scale(${f >= ck && f < ck + 4 ? 0.85 : 1})`, filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.5))" }}>
          <path d="M4 2 L4 19 L8.5 14.5 L11.5 21 L14.5 19.7 L11.6 13.3 L18 13.3 Z" fill="#fff" stroke="#111" strokeWidth={1.2} />
        </svg>
      </div>
      {click ? <Snd at={ck} name="click" /> : null}
    </>
  );
};

// ---------- celular com conversa ----------
export const PhoneChat: React.FC<{
  life: number;
  contact?: string;
  messages: { from: "paciente" | "clinica"; text: string; at: number; seen?: boolean }[];
  typingAt?: number; // "digitando..." antes da próxima mensagem da paciente
}> = ({ life, contact = TX.clienteTitulo, messages, typingAt }) => (
  <Scene life={life} w={520}>
    {({ f, fps }) => (
      <div style={{ ...card, borderRadius: 64, padding: 16, background: "#0e0e0e", border: "2px solid #2a2a2a" }}>
        <div style={{ borderRadius: 50, overflow: "hidden", background: "#151515", height: 640, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "26px 22px 16px", background: "#1c1c1c" }}>
            <div style={{ width: 50, height: 50, borderRadius: 25, background: "linear-gradient(135deg,#555,#333)" }} />
            <div>
              <div style={{ color: "#fff", fontSize: 28, fontWeight: 700 }}>{contact}</div>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 20 }}>{typingAt !== undefined && f >= typingAt && f < typingAt + 30 ? "digitando..." : "online"}</div>
            </div>
          </div>
          <div style={{ flex: 1, padding: "20px 18px", display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 12 }}>
            {messages.map((m, i) => {
              const q = sp(f, fps, m.at, { damping: 13, stiffness: 230, mass: 0.5 });
              const mine = m.from === "clinica";
              return (
                <div key={i} style={{ alignSelf: mine ? "flex-end" : "flex-start", maxWidth: 400, opacity: q, transform: `translateY(${(1 - q) * 20}px) scale(${0.85 + 0.15 * q})`, transformOrigin: mine ? "100% 100%" : "0% 100%" }}>
                  <div style={{ background: mine ? ZALE.red : "#2c2c2c", color: "#fff", fontSize: 30, fontWeight: 600, lineHeight: 1.2, padding: "14px 18px", borderRadius: 22, borderBottomRightRadius: mine ? 6 : 22, borderBottomLeftRadius: mine ? 22 : 6 }}>
                    {m.text}
                  </div>
                  {m.seen ? <div style={{ textAlign: "right", fontSize: 18, color: "rgba(255,255,255,0.45)", marginTop: 4 }}>visualizado</div> : null}
                  <Snd k="phone" at={m.at} name="tick" />
                </div>
              );
            })}
            {typingAt !== undefined && f >= typingAt && f < typingAt + 30 ? (
              <div style={{ alignSelf: "flex-start", background: "#2c2c2c", borderRadius: 22, padding: "16px 20px", display: "flex", gap: 8 }}>
                {[0, 1, 2].map((d) => (
                  <div key={d} style={{ width: 12, height: 12, borderRadius: 6, background: "#aaa", opacity: 0.4 + 0.6 * Math.abs(Math.sin((f + d * 5) / 6)) }} />
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    )}
  </Scene>
);

// ---------- agenda da semana ----------
// slots: [dia 0-4][hora 0-5] = nome curto ou null (vazio). `fillAt` = frame em
// que cada preenchido aparece (em ordem). `emptyFlash`: pisca os vazios em vermelho.
export const AgendaWeek: React.FC<{ life: number; title?: string; slots: (string | null)[][]; fillEvery?: number; emptyFlashAt?: number }> = ({
  life,
  title = "Agenda da semana",
  slots,
  fillEvery = 3,
  emptyFlashAt,
}) => {
  const days = ["seg", "ter", "qua", "qui", "sex"];
  return (
    <Scene life={life} w={940}>
      {({ f, fps }) => {
        let k = 0;
        return (
          <div style={{ ...card, padding: "26px 28px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ color: "#fff", fontSize: 36, fontWeight: 800 }}>{cap(title)}</div>
              <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 24, fontFamily: MONO }}>08h · 18h</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12 }}>
              {days.map((d) => (
                <div key={d} style={{ color: "rgba(255,255,255,0.55)", fontSize: 24, fontWeight: 700, textAlign: "center", textTransform: "uppercase" }}>
                  {d}
                </div>
              ))}
              {Array.from({ length: 6 }).map((_, h) =>
                days.map((_, d) => {
                  const v = slots[d]?.[h] ?? null;
                  const at = v ? 6 + (k++) * fillEvery : 0;
                  const q = v ? sp(f, fps, at, { damping: 14, stiffness: 240, mass: 0.5 }) : 1;
                  const flash = !v && emptyFlashAt !== undefined && f >= emptyFlashAt ? 0.5 + 0.5 * Math.abs(Math.sin((f - emptyFlashAt) / 7)) : 0;
                  return (
                    <div
                      key={`${d}-${h}`}
                      style={{
                        height: 62,
                        borderRadius: 12,
                        background: v ? ZALE.white : `rgba(${ZALE.redRgb},${0.08 + 0.35 * flash})`,
                        border: v ? "none" : `2px dashed rgba(255,255,255,${0.14 + 0.3 * flash})`,
                        color: ZALE.ink,
                        fontSize: 22,
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        opacity: v ? q : 1,
                        transform: v ? `scale(${0.6 + 0.4 * q})` : "none",
                      }}
                    >
                      {v}
                    </div>
                  );
                }),
              )}
            </div>
            {emptyFlashAt !== undefined ? <Snd at={emptyFlashAt} name="error" /> : null}
          </div>
        );
      }}
    </Scene>
  );
};

// ---------- painel de indicadores ----------
export const Dashboard: React.FC<{
  life: number;
  title?: string;
  kicker?: string;
  kpis: { label: string; value: number; suffix?: string }[];
  bars?: { label: string; value: number }[];
  highlight?: number; // índice da barra destacada
}> = ({ life, title = TX.painel, kicker = "semana", kpis, bars = [], highlight }) => (
  <Scene life={life} w={960}>
    {({ f }) => {
      const maxB = Math.max(1, ...bars.map((b) => b.value));
      return (
        <div style={{ ...card, ...glow(`rgba(${ZALE.redRgb},0.18)`), padding: "28px 30px" }}>
          <div style={{ color: ZALE.redBright, fontSize: 20, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>{kicker}</div>
          <div style={{ color: "#fff", fontSize: 44, fontWeight: 900, letterSpacing: -1, marginBottom: 22 }}>{cap(title)}</div>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${kpis.length},1fr)`, gap: 14, marginBottom: bars.length ? 26 : 0 }}>
            {kpis.map((k, i) => {
              const v = interpolate(f, [8 + i * 5, 36 + i * 5], [0, k.value], { ...clamp, easing: Easing.out(Easing.cubic) });
              return (
                <div key={i} style={{ background: "#202020", borderRadius: 18, padding: "18px 18px" }}>
                  <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 22, fontWeight: 600 }}>{cap(k.label)}</div>
                  <div style={{ color: "#fff", fontSize: 58, fontWeight: 800, fontFamily: MONO }}>
                    {Math.round(v)}
                    {k.suffix ?? ""}
                  </div>
                </div>
              );
            })}
          </div>
          {bars.length ? (
            <div style={{ display: "flex", alignItems: "flex-end", gap: 18, height: 200 }}>
              {bars.map((b, i) => {
                const g = interpolate(f, [14 + i * 4, 40 + i * 4], [0, b.value / maxB], { ...clamp, easing: Easing.out(Easing.cubic) });
                const hi = i === highlight;
                return (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                    <div style={{ width: "100%", height: 170 * g, borderRadius: 10, background: hi ? ZALE.red : "rgba(255,255,255,0.22)", boxShadow: hi ? `0 0 40px rgba(${ZALE.redRgb},0.6)` : "none" }} />
                    <div style={{ color: hi ? "#fff" : "rgba(255,255,255,0.5)", fontSize: 20, fontWeight: 700 }}>{b.label}</div>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      );
    }}
  </Scene>
);

// ---------- funil ----------
export const Funnel: React.FC<{ life: number; stages: { label: string; value?: string; at: number }[]; leakAt?: number; leakIndex?: number }> = ({
  life,
  stages,
  leakAt,
  leakIndex,
}) => (
  <Scene life={life} w={900}>
    {({ f, fps }) => (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
        {stages.map((s, i) => {
          const q = sp(f, fps, s.at);
          const w = 880 - i * (520 / Math.max(1, stages.length - 1));
          const leak = leakAt !== undefined && i === leakIndex && f >= leakAt;
          return (
            <div key={i} style={{ width: w * (0.7 + 0.3 * q), opacity: q, height: 96, borderRadius: 20, background: leak ? ZALE.red : i === 0 ? "#fff" : `rgba(255,255,255,${0.9 - i * 0.14})`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 30px", boxSizing: "border-box", boxShadow: leak ? `0 0 60px rgba(${ZALE.redRgb},0.6)` : "0 12px 30px rgba(0,0,0,0.35)" }}>
              <span style={{ fontSize: 36, fontWeight: 800, color: leak ? "#fff" : ZALE.ink }}>{cap(s.label)}</span>
              {s.value ? <span style={{ fontSize: 34, fontWeight: 800, fontFamily: MONO, color: leak ? "#fff" : ZALE.ink }}>{s.value}</span> : null}
              <Snd k="funnel" at={s.at} name="pop" />
            </div>
          );
        })}
        {leakAt !== undefined ? <Snd at={leakAt} name="error" /> : null}
      </div>
    )}
  </Scene>
);

// ---------- proposta com ancoragem ----------
export const Proposal: React.FC<{ life: number; title: string; items: string[]; table?: string; condition?: string; anchorAt?: number; ctaAt?: number }> = ({
  life,
  title,
  items,
  table,
  condition,
  anchorAt = 30,
  ctaAt,
}) => (
  <Scene life={life} w={760}>
    {({ f, fps }) => {
      const strike = interpolate(f, [anchorAt, anchorAt + 10], [0, 1], clamp);
      const cq = sp(f, fps, anchorAt + 8);
      return (
        <div style={{ background: "#fff", borderRadius: 26, padding: "30px 34px", boxShadow: "0 40px 100px rgba(0,0,0,0.55)", color: ZALE.ink }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#888", letterSpacing: 2, textTransform: "uppercase" }}>plano de tratamento</div>
          <div style={{ fontSize: 42, fontWeight: 900, marginBottom: 14 }}>{cap(title)}</div>
          {items.map((it, i) => {
            const q = interpolate(f, [6 + i * 5, 14 + i * 5], [0, 1], clamp);
            return (
              <div key={i} style={{ fontSize: 30, fontWeight: 600, padding: "10px 0", borderBottom: "1px solid #eee", opacity: q, display: "flex", gap: 12 }}>
                <span style={{ color: ZALE.red }}>●</span>
                {cap(it)}
              </div>
            );
          })}
          {table ? (
            <div style={{ marginTop: 20, display: "flex", alignItems: "baseline", gap: 24 }}>
              <div style={{ position: "relative", fontSize: 34, color: "#999", fontWeight: 700 }}>
                {table}
                <div style={{ position: "absolute", left: 0, top: "52%", height: 4, width: `${strike * 100}%`, background: ZALE.red }} />
              </div>
              {condition ? <div style={{ fontSize: 46, fontWeight: 900, color: ZALE.red, opacity: cq, transform: `scale(${0.8 + 0.2 * cq})` }}>{condition}</div> : null}
            </div>
          ) : null}
          {ctaAt !== undefined ? (
            <div style={{ marginTop: 22, background: ZALE.ink, color: "#fff", borderRadius: 14, textAlign: "center", padding: "16px 0", fontSize: 30, fontWeight: 800, transform: `scale(${f >= ctaAt && f < ctaAt + 4 ? 0.95 : 1})` }}>
              {f >= ctaAt ? "Agendado ✓" : "Agendar início"}
            </div>
          ) : null}
          {table ? <Snd at={anchorAt} name="switch" /> : null}
          {ctaAt !== undefined ? <Snd at={ctaAt} name="ding" /> : null}
        </div>
      );
    }}
  </Scene>
);

// ---------- linha do tempo (retornos 30/90/180) ----------
export const TimelineDots: React.FC<{ life: number; title?: string; points: { label: string; sub?: string; at: number }[] }> = ({ life, title, points }) => (
  <Scene life={life} w={940}>
    {({ f, fps }) => {
      const last = points[points.length - 1]?.at ?? 0;
      const line = interpolate(f, [points[0]?.at ?? 0, last + 6], [0, 1], clamp);
      return (
        <div style={{ padding: "10px 20px" }}>
          {title ? <div style={{ color: "#fff", fontSize: 46, fontWeight: 900, textAlign: "center", marginBottom: 50 }}>{cap(title)}</div> : null}
          <div style={{ position: "relative", height: 220 }}>
            <div style={{ position: "absolute", left: 40, right: 40, top: 40, height: 6, background: "rgba(255,255,255,0.12)", borderRadius: 3 }} />
            <div style={{ position: "absolute", left: 40, top: 40, height: 6, width: `calc((100% - 80px) * ${line})`, background: ZALE.red, borderRadius: 3, boxShadow: `0 0 20px rgba(${ZALE.redRgb},0.7)` }} />
            {points.map((p, i) => {
              const q = sp(f, fps, p.at);
              const x = points.length === 1 ? 50 : (i / (points.length - 1)) * 100;
              return (
                <div key={i} style={{ position: "absolute", left: `calc(40px + (100% - 80px) * ${x / 100})`, top: 0, transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", opacity: q }}>
                  <div style={{ width: 86, height: 86, borderRadius: 43, background: "#fff", border: `6px solid ${ZALE.red}`, transform: `scale(${q})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 900, color: ZALE.ink }}>
                    {i + 1}
                  </div>
                  <div style={{ color: "#fff", fontSize: 38, fontWeight: 800, marginTop: 16, whiteSpace: "nowrap" }}>{cap(p.label)}</div>
                  {p.sub ? <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 26, fontWeight: 600, marginTop: 6, whiteSpace: "nowrap" }}>{cap(p.sub)}</div> : null}
                  <Snd k="timeline" at={p.at} name="pop" />
                </div>
              );
            })}
          </div>
        </div>
      );
    }}
  </Scene>
);

// ---------- conceito no centro com cards orbitando ----------
export const OrbitCards: React.FC<{ life: number; center: string; logo?: string; nodes: { icon: LucideIcon; label: string; at: number }[] }> = ({ life, center, logo, nodes }) => (
  <Scene life={life} w={1000} sfx={false}>
    {({ f, fps, p }) => {
      const R = 330;
      const ry = 0.72;
      const rot = f / 240;
      const pulse = 1 + 0.06 * Math.sin(f / 9);
      return (
        <div style={{ position: "relative", height: 720 }}>
          <svg width={1000} height={720} style={{ position: "absolute", left: 0, top: 0 }}>
            {nodes.map((n, i) => {
              const ang = (i / nodes.length) * Math.PI * 2 - Math.PI / 2 + rot;
              const q = sp(f, fps, n.at);
              const x = 500 + Math.cos(ang) * R * q;
              const y = 360 + Math.sin(ang) * R * ry * q;
              return <line key={i} x1={500} y1={360} x2={x} y2={y} stroke={`rgba(${ZALE.redRgb},0.55)`} strokeWidth={2} strokeDasharray="6 8" strokeDashoffset={-f} opacity={q} />;
            })}
          </svg>
          <div style={{ position: "absolute", left: 500 - 120 * pulse, top: 360 - 120 * pulse, width: 240 * pulse, height: 240 * pulse, borderRadius: "50%", border: `2px solid rgba(${ZALE.redRgb},${0.5 - 0.4 * (pulse - 1) * 8})` }} />
          <div style={{ position: "absolute", left: 500 - 110, top: 360 - 110, width: 220, height: 220, borderRadius: 110, background: "#0f0f0f", border: `5px solid ${ZALE.red}`, boxShadow: `0 0 100px rgba(${ZALE.redRgb},0.6)`, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${p})`, color: "#fff", fontSize: 46, fontWeight: 900, textAlign: "center", lineHeight: 1.05 }}>
            {logo ? <Img src={staticFile(logo)} style={{ width: 110, height: 110, objectFit: "contain" }} /> : cap(center)}
          </div>
          {nodes.map((n, i) => {
            const ang = (i / nodes.length) * Math.PI * 2 - Math.PI / 2 + rot;
            const q = sp(f, fps, n.at);
            const x = 500 + Math.cos(ang) * R * q;
            const y = 360 + Math.sin(ang) * R * ry * q;
            const Icon = n.icon;
            return (
              <div key={i} style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) scale(${0.6 + 0.4 * q})`, opacity: q, display: "flex", alignItems: "center", gap: 12, background: "#fff", borderRadius: 18, padding: "12px 20px", boxShadow: "0 16px 40px rgba(0,0,0,0.45)", whiteSpace: "nowrap" }}>
                <Icon size={30} color={ZALE.red} strokeWidth={2.4} />
                <span style={{ fontSize: 30, fontWeight: 800, color: ZALE.ink }}>{cap(n.label)}</span>
                <Snd k="orbit" at={n.at} name="tick" />
              </div>
            );
          })}
        </div>
      );
    }}
  </Scene>
);

// Altura útil do palco, para quem precisar posicionar algo manualmente.
export const STAGE_H = SEAM;

// ---------- foto no palco ----------
// Foto do usuário ou de licença livre (scripts/imagem.py). Moldura "polaroid"
// girada ou "card" reto, zoom lento contínuo, crédito pequeno quando a
// licença pede (CC BY / BY-SA). Várias fotos: `srcs` entra uma por vez.
export const PhotoScene: React.FC<{
  life: number;
  src?: string;
  srcs?: { src: string; at: number }[];
  caption?: string;
  credit?: string;
  frame?: "polaroid" | "card";
}> = ({ life, src, srcs, caption, credit, frame = "polaroid" }) => (
  <Scene life={life} w={frame === "polaroid" ? 600 : 860}>
    {({ f, fps }) => {
      const list = srcs ?? (src ? [{ src, at: 0 }] : []);
      const cur = [...list].reverse().find((s) => f >= s.at) ?? list[0];
      const idx = list.indexOf(cur);
      const q = sp(f, fps, cur?.at ?? 0, { damping: 13, stiffness: 200, mass: 0.6 });
      const kb = interpolate(f, [cur?.at ?? 0, life], [1.0, 1.12], clamp);
      const tilt = frame === "polaroid" ? (idx % 2 === 0 ? -3 : 3) : 0;
      const pad = frame === "polaroid" ? 22 : 0;
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ background: "#fff", padding: pad, paddingBottom: frame === "polaroid" ? 70 : 0, borderRadius: frame === "polaroid" ? 10 : 28, boxShadow: "0 40px 100px rgba(0,0,0,0.6)", transform: `rotate(${tilt * q}deg) scale(${0.85 + 0.15 * q})`, position: "relative" }}>
            <div style={{ width: frame === "polaroid" ? 556 : 860, height: frame === "polaroid" ? 600 : 560, overflow: "hidden", borderRadius: frame === "polaroid" ? 4 : 28 }}>
              {cur ? <Img src={staticFile(cur.src)} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${kb})` }} /> : null}
            </div>
            {caption && frame === "polaroid" ? <div style={{ position: "absolute", left: 0, right: 0, bottom: 18, textAlign: "center", fontSize: 34, fontWeight: 800, color: ZALE.ink }}>{caption}</div> : null}
          </div>
          {caption && frame === "card" ? <div style={{ color: "#fff", fontSize: 40, fontWeight: 800, marginTop: 22 }}>{caption}</div> : null}
          {credit ? <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 18, marginTop: 14 }}>{credit}</div> : null}
          {list.map((s, i) => (i > 0 ? <Snd key={i} at={s.at} name="switch" /> : null))}
        </div>
      );
    }}
  </Scene>
);

// ---------- vídeo no palco ----------
// Um trecho de vídeo (mudo por padrão) num card, flutuando junto com a cena. `trim` = segundos
// cortados do começo do arquivo. Use para react/viral/clipe (ex.: o desafio do copo).
export const VideoScene: React.FC<{ life: number; src: string; caption?: string; credit?: string; trim?: number; volume?: number; w?: number }> = ({
  life,
  src,
  caption,
  credit,
  trim = 0,
  volume = 0,
  w = 900,
}) => (
  <Scene life={life} w={w}>
    {({ fps }) => (
      <div>
        <div style={{ ...card, overflow: "hidden", borderRadius: 30, border: "3px solid rgba(255,255,255,0.12)" }}>
          <OffthreadVideo src={staticFile(src)} startFrom={Math.round(trim * fps)} muted={volume === 0} volume={volume} style={{ width: "100%", display: "block" }} />
        </div>
        {caption ? <div style={{ color: "#fff", fontSize: 40, fontWeight: 800, marginTop: 22, textAlign: "center" }}>{cap(caption)}</div> : null}
        {credit ? <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 18, marginTop: 10, textAlign: "center" }}>{credit}</div> : null}
      </div>
    )}
  </Scene>
);
