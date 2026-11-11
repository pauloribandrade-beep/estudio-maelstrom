import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { MONO } from "./overlays";
import { C, Clip, rnd } from "./hl3";
import { Corners, Ecg } from "./hl3t";

// 4A/4B · A ALYX VOLTOU. Tudo em linguagem de interface do mundo do jogo (fichas da Resistência, registro de memória,
// rádio, telemetria), sem personagem desenhado; rostos só nas fichas (Eli e Alyx, retratos já usados). Tempos em QUADROS.
const AMB = "#ffb22e";
const CREAM = "#ffe2b0";
const RED = "#ff5d4d";
const ICE = "#9fe6ff";
const GREEN = "#8dffa8";
const P = (f: number, at: number, d = 12) => interpolate(f, [at, at + d], [0, 1], { ...C, easing: Easing.out(Easing.cubic) });
const IO = (f: number, a: number, b: number, from: number, to: number) => interpolate(f, [a, b], [from, to], { ...C, easing: Easing.inOut(Easing.cubic) });
const flickIn = (f: number, at: number) => {
  const d = f - at;
  if (d < 0) return 0;
  return d < 7 ? [0.25, 1, 0.35, 1, 0.7, 1, 0.9][d] : 1;
};
const typed = (f: number, at: number, s: string, cps = 1.6) => s.slice(0, Math.max(0, Math.floor((f - at) * cps)));
const Caret: React.FC<{ f: number; on: boolean }> = ({ f, on }) => (on ? <span style={{ opacity: Math.floor(f / 5) % 2 ? 1 : 0.2 }}>▮</span> : null);
// corte seco entre as cenas (com fade, o fundo roxo do vídeo aparecia por um instante)
const fade = (_f: number, _life: number, _d = 10) => 1;

// fundo comum: escuro, grade fina, vinheta e grão leve; a câmera respira (push contínuo)
const Bg: React.FC<{ f: number; tint?: string }> = ({ f, tint = "rgba(255,178,46,0.05)" }) => (
  <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, #17120c 0%, #070605 75%)" }}>
    <AbsoluteFill style={{ backgroundImage: `linear-gradient(${tint} 1px, transparent 1px), linear-gradient(90deg, ${tint} 1px, transparent 1px)`, backgroundSize: "60px 60px", backgroundPosition: `${(f * 0.3) % 60}px 0` }} />
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(0,0,0,0.75) 100%)" }} />
  </AbsoluteFill>
);

const Panel: React.FC<{ style?: React.CSSProperties; children: React.ReactNode; color?: string }> = ({ style, children, color = AMB }) => (
  <div style={{ position: "absolute", padding: "18px 24px", background: "rgba(30,16,4,0.78)", border: `1px solid ${color}`, borderRadius: 10, fontFamily: MONO, color, boxShadow: "0 30px 80px rgba(0,0,0,0.6)", backdropFilter: "blur(3px)", ...style }}>{children}</div>
);

// ============================================================================================ 1) o reencontro
// a ficha da Alyx (vinda da identificação na neve) → ela pergunta pelo pai: a ficha do Eli entra e as duas se ligam →
// o abraço: as fichas se encostam, REUNIDOS → os dois relógios: para ele 3 DIAS, para ela 00:00:00 (parado).
export const HLReunion: React.FC<{ life: number; askAt?: number; eliAt?: number; hugAt?: number; eliClockAt?: number; daysAt?: number; alyxClockAt?: number; zeroAt?: number }> = ({
  life, askAt = 1e9, eliAt = 1e9, hugAt = 1e9, eliClockAt = 1e9, daysAt = 1e9, alyxClockAt = 1e9, zeroAt = 1e9,
}) => {
  const f = useCurrentFrame();
  const o = fade(f, life);
  const eli = P(f, eliAt, 16);
  const hug = IO(f, hugAt, hugAt + 22, 0, 1);
  // posições (centro das fichas): Alyx começa no meio e abre espaço para o Eli
  const ax = IO(f, eliAt - 6, eliAt + 14, 960, 1270) - hug * 55;
  const ex = 650 + hug * 55;
  const cardW = 470;
  const push = 1 + interpolate(f, [0, life], [0, 0.06], C);
  // relógio dele: 0 → 72 h, subindo rápido até "3 dias"
  const hours = interpolate(f, [eliClockAt, daysAt], [0, 72], { ...C, easing: Easing.inOut(Easing.quad) });
  const card = (x: number, who: "eli" | "alyx", k: number) => {
    const isA = who === "alyx";
    return (
      <div style={{ position: "absolute", left: x - cardW / 2, top: 150, width: cardW, opacity: k, transform: `translateY(${(1 - k) * 40}px)` }}>
        <Panel style={{ position: "relative", padding: "16px 20px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, letterSpacing: 4, opacity: 0.8 }}>
            <span>RESISTÊNCIA · FICHA</span>
            <span>{isA ? "1-0076" : "0-0001"}</span>
          </div>
          <div style={{ position: "relative", height: 380, marginTop: 12, borderRadius: 6, overflow: "hidden", border: "1px solid rgba(255,178,46,0.5)", background: "#2a2722" }}>
            <Img src={staticFile(isA ? "hl3silh/alyx_badge.jpg" : "hl3silh/eli_retrato.png")} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: isA ? "50% 35%" : "60% 30%", filter: "saturate(0.75) contrast(1.05)", transform: `scale(${1.03 + f / 3000})` }} />
            <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.12) 0 2px, transparent 2px 4px)" }} />
          </div>
          <div style={{ marginTop: 14, fontSize: 34, letterSpacing: 2, color: CREAM }}>{isA ? "ALYX VANCE" : "ELI VANCE"}</div>
          <div style={{ fontSize: 17, letterSpacing: 4, opacity: 0.7 }}>{isA ? "RESISTÊNCIA · ENGENHARIA" : "RESISTÊNCIA · CIÊNCIA"}</div>
        </Panel>
      </div>
    );
  };
  // a pergunta da Alyx: balão de log saindo da ficha dela
  const ask = P(f, askAt, 10) * (1 - P(f, eliAt + 10, 10));
  const link = P(f, eliAt + 8, 14);
  const stamp = P(f, hugAt + 14, 8);
  const ck = P(f, eliClockAt, 10);
  const ak = P(f, alyxClockAt, 10);
  const days = f >= daysAt;
  const zero = f >= zeroAt;
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <Bg f={f} />
      <AbsoluteFill style={{ transform: `scale(${push})` }}>
        {/* a linha que liga os dois (fica sólida no abraço) */}
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          <line x1={ex + cardW / 2} y1={400} x2={ex + cardW / 2 + (ax - cardW / 2 - ex - cardW / 2) * link} y2={400} stroke={AMB} strokeWidth={hug > 0.5 ? 4 : 2} strokeDasharray={hug > 0.5 ? undefined : "10 8"} opacity={0.8 * link * (1 - hug * 0.6)} />
        </svg>
        {card(ex, "eli", eli)}
        {card(ax, "alyx", 1)}
        {ask > 0.01 ? (
          <div style={{ position: "absolute", left: ax - cardW / 2 - 360, top: 330, opacity: ask, transform: `translateX(${(1 - ask) * 30}px)` }}>
            <Panel style={{ position: "relative", width: 320, fontSize: 22, letterSpacing: 2, color: CREAM }}>
              <div style={{ fontSize: 14, letterSpacing: 4, color: AMB, opacity: 0.7 }}>PRIMEIRA PERGUNTA</div>
              {typed(f, askAt, "“Cadê o meu pai?”")}
              <Caret f={f} on={f < askAt + 30} />
            </Panel>
          </div>
        ) : null}
        {stamp > 0.01 ? (
          <div style={{ position: "absolute", left: 960 - 190, top: 120, width: 380, textAlign: "center", fontFamily: MONO, fontSize: 40, letterSpacing: 10, color: AMB, border: `3px solid ${AMB}`, padding: "8px 0", background: "rgba(30,16,4,0.85)", transform: `scale(${1 + (1 - stamp) * 0.6}) rotate(-2deg)`, opacity: stamp, boxShadow: `0 0 40px rgba(255,178,46,${0.35 * stamp})` }}>REUNIDOS</div>
        ) : null}
        {/* os dois relógios */}
        <div style={{ position: "absolute", left: ex - cardW / 2, top: 860, width: cardW, opacity: ck, transform: `translateY(${(1 - ck) * 20}px)` }}>
          <Panel style={{ position: "relative", padding: "12px 20px" }}>
            <div style={{ fontSize: 15, letterSpacing: 4, opacity: 0.7 }}>PARA ELE · DESAPARECIDA HÁ</div>
            <div style={{ fontSize: 46, letterSpacing: 3, color: days ? CREAM : AMB }}>{days ? "3 DIAS" : `${String(Math.floor(hours)).padStart(2, "0")} h ${String(Math.floor((hours % 1) * 60)).padStart(2, "0")} min`}</div>
          </Panel>
        </div>
        <div style={{ position: "absolute", left: ax - cardW / 2, top: 860, width: cardW, opacity: ak, transform: `translateY(${(1 - ak) * 20}px)` }}>
          <Panel style={{ position: "relative", padding: "12px 20px" }} color={ICE}>
            <div style={{ fontSize: 15, letterSpacing: 4, opacity: 0.7 }}>PARA ELA · TEMPO QUE PASSOU</div>
            <div style={{ fontSize: 46, letterSpacing: 3, color: ICE, opacity: zero ? (Math.floor((f - zeroAt) / 12) % 2 ? 0.45 : 1) : 1 }}>00:00:00</div>
          </Panel>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ============================================================================================ 2) a memória com um buraco
// a fita de memória da Alyx: quadros (trechos reais do final do Alyx) entrando na palavra → "depois disso" a fita vira
// estática (SEM REGISTRO) → três perguntas → o Eli: o G-Man devolveu… em troca de quê?
type Frag = { src: string; from: number; label: string; at: number; quote?: boolean };
export const HLMemoryGap: React.FC<{ life: number; frags?: Frag[]; afterAt?: number; nadaAt?: number; qs?: { text: string; at: number }[]; eliAt?: number; tradeAt?: number }> = ({
  life, frags = [], afterAt = 1e9, nadaAt = 1e9, qs = [], eliAt = 1e9, tradeAt = 1e9,
}) => {
  const f = useCurrentFrame();
  const o = fade(f, life);
  const FW = 330;
  const FH = 200;
  const GAP = 26;
  const X0 = 150;
  const Y = 300;
  // a fita anda para a esquerda quando o buraco abre
  const pan = IO(f, afterAt, nadaAt + 20, 0, -(frags.length * (FW + GAP)) + 520);
  const gapW = interpolate(f, [afterAt, nadaAt + 16], [0, 1100], { ...C, easing: Easing.out(Easing.cubic) });
  const gx = X0 + frags.length * (FW + GAP) + pan;
  const eli = P(f, eliAt, 14);
  const tr = P(f, tradeAt, 10);
  const push = 1 + interpolate(f, [0, life], [0, 0.05], C);
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <Bg f={f} tint="rgba(159,230,255,0.04)" />
      <AbsoluteFill style={{ transform: `scale(${push})` }}>
        <div style={{ position: "absolute", left: 150, top: 150, fontFamily: MONO, fontSize: 22, letterSpacing: 6, color: ICE, opacity: 0.85 }}>REGISTRO DE MEMÓRIA · ALYX VANCE</div>
        <div style={{ position: "absolute", left: 150, top: 186, fontFamily: MONO, fontSize: 16, letterSpacing: 5, color: ICE, opacity: 0.45 }}>ÚLTIMAS LEMBRANÇAS ANTES DO RETORNO</div>
        {/* trilho da fita */}
        <div style={{ position: "absolute", left: 0, right: 0, top: Y - 24, height: FH + 48, borderTop: "1px solid rgba(159,230,255,0.25)", borderBottom: "1px solid rgba(159,230,255,0.25)" }} />
        {frags.map((fr, i) => {
          const k = P(f, fr.at, 12);
          const x = X0 + i * (FW + GAP) + pan;
          return (
            <div key={i} style={{ position: "absolute", left: x, top: Y, width: FW, opacity: k, transform: `translateY(${(1 - k) * 24}px) scale(${0.92 + 0.08 * k})` }}>
              <div style={{ position: "relative", width: FW, height: FH, borderRadius: 6, overflow: "hidden", border: `1px solid ${ICE}`, boxShadow: `0 0 ${24 * k}px rgba(159,230,255,0.25)`, background: "#0b1418" }}>
                {f >= fr.at - 2 ? <Clip src={fr.src} from={fr.from} rate={0.6} style={{ filter: "saturate(0.55) contrast(1.1) brightness(0.9)" }} /> : null}
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 55%, rgba(0,10,14,0.85))" }} />
                <div style={{ position: "absolute", left: 10, top: 8, fontFamily: MONO, fontSize: 13, letterSpacing: 3, color: ICE, opacity: 0.8 }}>{String(i + 1).padStart(2, "0")}</div>
              </div>
              <div style={{ marginTop: 14, fontFamily: MONO, fontSize: fr.quote ? 20 : 24, letterSpacing: fr.quote ? 1 : 4, color: CREAM, lineHeight: 1.3, fontStyle: fr.quote ? "italic" : undefined }}>
                {fr.quote ? typed(f, fr.at, fr.label, 2.2) : fr.label}
              </div>
            </div>
          );
        })}
        {/* o buraco: a fita vira estática */}
        {gapW > 1 ? (
          <div style={{ position: "absolute", left: gx, top: Y, width: gapW, height: FH, overflow: "hidden", borderRadius: 6, border: "1px dashed rgba(255,93,77,0.6)" }}>
            {Array.from({ length: 34 }).map((_, j) => (
              <div key={j} style={{ position: "absolute", left: 0, right: 0, top: (j / 34) * FH, height: FH / 34 + 1, background: `rgba(${180 + 60 * rnd(j + f * 7)},${180 + 60 * rnd(j * 3 + f * 5)},${190 + 60 * rnd(j * 5 + f * 3)},${0.08 + 0.22 * rnd(j * 11 + f * 13)})`, transform: `translateX(${(rnd(j * 7 + f) - 0.5) * 40}px)` }} />
            ))}
            {f >= nadaAt ? (
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: MONO, fontSize: 44, letterSpacing: 12, color: RED, opacity: flickIn(f, nadaAt), textShadow: "0 0 18px rgba(255,93,77,0.6)" }}>SEM REGISTRO</div>
            ) : null}
          </div>
        ) : null}
        {/* as perguntas */}
        <div style={{ position: "absolute", left: 150, top: 640, display: "flex", flexDirection: "column", gap: 12 }}>
          {qs.map((q, i) => (f >= q.at ? (
            <div key={i} style={{ fontFamily: MONO, fontSize: 30, letterSpacing: 3, color: CREAM, opacity: flickIn(f, q.at) * (1 - 0.55 * eli) }}>
              <span style={{ color: RED, marginRight: 18 }}>?</span>
              {q.text}
            </div>
          ) : null))}
        </div>
        {/* o Eli desconfia */}
        {eli > 0.01 ? (
          <div style={{ position: "absolute", right: 150, top: 610, width: 620, opacity: eli, transform: `translateX(${(1 - eli) * 40}px)` }}>
            <Panel style={{ position: "relative" }}>
              <div style={{ fontSize: 15, letterSpacing: 4, opacity: 0.7 }}>ANÁLISE · ELI VANCE</div>
              <div style={{ marginTop: 10, fontSize: 26, letterSpacing: 2, color: CREAM }}>G-MAN DEVOLVEU A ALYX</div>
              <div style={{ marginTop: 10, fontSize: 26, letterSpacing: 2, display: "flex", gap: 14 }}>
                <span style={{ opacity: 0.75 }}>EM TROCA DE:</span>
                <span style={{ color: RED, opacity: tr, transform: `scale(${1 + (1 - tr) * 0.4})`, display: "inline-block" }}>???</span>
              </div>
            </Panel>
          </div>
        ) : null}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ============================================================================================ 3) o sinal antigo
// rádio de campo numa estação abandonada: ruído → o sinal entra → 3 pulsos · pausa · 2 pulsos (cada um NA palavra) →
// o Kleiner reconhece: CÓDIGO DE SEGURANÇA · BLACK MESA → alguém que usava: nome tarjado → sinal fraco demais:
// LOCALIZAÇÃO IMPOSSÍVEL → o Kleiner não diz o nome (a tarja fica) → a expedição continua (o rádio volta ao ruído).
export const HLRadioCode: React.FC<{ life: number; stationAt?: number; catchAt?: number; pulses?: { at: number }[]; kleinerAt?: number; codeAt?: number; bmAt?: number; whoAt?: number; weakAt?: number; failAt?: number; silentAt?: number; goAt?: number }> = ({
  life, stationAt = 0, catchAt = 1e9, pulses = [], kleinerAt = 1e9, codeAt = 1e9, bmAt = 1e9, whoAt = 1e9, weakAt = 1e9, failAt = 1e9, silentAt = 1e9, goAt = 1e9,
}) => {
  const f = useCurrentFrame();
  const o = fade(f, life);
  const W = 1500;
  const H = 300;
  const X = 210;
  const Y = 250;
  const sig = P(f, catchAt, 10) * (1 - P(f, goAt, 14));
  // traço do osciloscópio: ruído + os pulsos que já chegaram (rolando da direita para a esquerda)
  const pts: string[] = [];
  const SPEED = 5; // px por quadro
  for (let x = 0; x <= W; x += 6) {
    const tq = f - (W - x) / SPEED; // quadro em que este ponto foi "gravado"
    let y = (rnd(Math.floor(tq) * 3 + x) - 0.5) * (14 + 10 * (1 - sig));
    for (const p of pulses) {
      const d = tq - p.at;
      if (d >= 0 && d < 7) y -= sig * 110 * Math.sin((d / 7) * Math.PI) * (1 + 0.15 * Math.sin(d * 3));
    }
    pts.push(`${x},${H / 2 + y}`);
  }
  const k = P(f, kleinerAt, 14);
  const code = f >= codeAt;
  const bm = P(f, bmAt, 10);
  const who = P(f, whoAt, 10);
  const weak = P(f, weakAt, 10);
  const fail = f >= failAt;
  const sil = P(f, silentAt, 12);
  const pct = Math.round(interpolate(f, [weakAt, failAt], [11, 3], C));
  const nPulse = pulses.filter((p) => f >= p.at).length;
  const push = 1 + interpolate(f, [0, life], [0, 0.05], C);
  // "e a expedição continua": a tela do rádio desliga como um CRT (achata numa linha, depois num ponto)
  const offY = interpolate(f, [goAt, goAt + 7], [1, 0.012], { ...C, easing: Easing.in(Easing.cubic) });
  const offX = interpolate(f, [goAt + 7, goAt + 12], [1, 0.01], { ...C, easing: Easing.in(Easing.cubic) });
  return (
    <AbsoluteFill style={{ opacity: o, background: "#020304" }}>
      <AbsoluteFill style={{ transform: `scale(${offX}, ${offY})`, filter: offY < 1 ? `brightness(${1 + (1 - offY) * 2})` : undefined }}>
      <Bg f={f} />
      <AbsoluteFill style={{ transform: `scale(${push})` }}>
        <div style={{ position: "absolute", left: X, top: 150, fontFamily: MONO, fontSize: 22, letterSpacing: 6, color: AMB, opacity: P(f, stationAt, 10) }}>RÁDIO DE CAMPO · ESTAÇÃO ABANDONADA · 47.3 MHz</div>
        <div style={{ position: "absolute", left: X, top: 186, fontFamily: MONO, fontSize: 16, letterSpacing: 5, color: f >= catchAt ? CREAM : AMB, opacity: 0.6 }}>{f >= catchAt ? "SINAL CAPTADO · ORIGEM: MUITO ANTIGA" : "PROCURANDO…"}</div>
        <div style={{ position: "absolute", left: X, top: Y, width: W, height: H, border: "1px solid rgba(255,178,46,0.4)", borderRadius: 10, background: "rgba(20,12,4,0.7)", overflow: "hidden" }}>
          {Array.from({ length: 11 }).map((_, i) => <div key={i} style={{ position: "absolute", top: 0, bottom: 0, left: (i / 10) * W, width: 1, background: "rgba(255,178,46,0.08)" }} />)}
          <div style={{ position: "absolute", left: 0, right: 0, top: H / 2, height: 1, background: "rgba(255,178,46,0.15)" }} />
          <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
            <polyline points={pts.join(" ")} fill="none" stroke={AMB} strokeWidth={3} style={{ filter: "drop-shadow(0 0 6px rgba(255,178,46,0.8))" }} />
          </svg>
        </div>
        {/* contagem dos pulsos: ● ● ● ‖ ● ● */}
        <div style={{ position: "absolute", left: X, top: Y + H + 30, display: "flex", gap: 22, alignItems: "center", fontFamily: MONO }}>
          {pulses.map((q, i) => {
            const p = q.at;
            return (
            <React.Fragment key={i}>
              {i === 3 ? <span style={{ fontSize: 26, letterSpacing: 4, color: AMB, opacity: f >= (pulses[2]?.at ?? 1e9) + 6 ? 0.8 : 0.15, margin: "0 10px" }}>PAUSA</span> : null}
              <span style={{ width: 30, height: 30, borderRadius: 15, background: f >= p ? AMB : "transparent", border: `2px solid ${AMB}`, boxShadow: f >= p ? `0 0 ${20 * (1 - P(f, p, 14)) + 6}px ${AMB}` : undefined, opacity: f >= p ? 1 : 0.3 }} />
            </React.Fragment>
            );
          })}
          <span style={{ marginLeft: 30, fontSize: 26, letterSpacing: 4, color: CREAM, opacity: nPulse === pulses.length && pulses.length ? 1 : 0 }}>3 · 2</span>
        </div>
        {/* terminal do Kleiner: 3 fichas (o código · quem usava · onde está) */}
        {k > 0.01 ? (
          <div style={{ position: "absolute", left: X, top: 640, width: W, height: 330, display: "flex", gap: 24, opacity: k, transform: `translateY(${(1 - k) * 30}px)` }}>
            {/* 1 · o código */}
            <div style={{ flex: 1.1, position: "relative", padding: "18px 22px", background: "rgba(6,20,10,0.85)", border: `1px solid ${GREEN}`, borderRadius: 10, fontFamily: MONO, color: GREEN, overflow: "hidden" }}>
              <div style={{ fontSize: 15, letterSpacing: 4, opacity: 0.75 }}>KLEINER · BANCO DE PROTOCOLOS</div>
              <div style={{ marginTop: 10, fontSize: 18, letterSpacing: 3, color: CREAM, opacity: 0.85 }}>PADRÃO RECEBIDO</div>
              <div style={{ display: "flex", gap: 10, marginTop: 8, alignItems: "center" }}>
                {[1, 1, 1, 0, 1, 1].map((v, i) => (v ? <span key={i} style={{ width: 18, height: 18, borderRadius: 9, background: AMB, boxShadow: `0 0 10px ${AMB}` }} /> : <span key={i} style={{ width: 22, height: 2, background: AMB, opacity: 0.6 }} />))}
                <span style={{ marginLeft: 12, fontSize: 16, color: code ? GREEN : AMB }}>{code ? "CORRESPONDÊNCIA 100%" : `COMPARANDO… ${String(Math.floor((f * 7) % 999)).padStart(3, "0")}`}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 22, opacity: bm, transform: `scale(${1 + (1 - bm) * 0.15})`, transformOrigin: "0 50%" }}>
                <svg width={118} height={118} viewBox="0 0 256 256" style={{ filter: "drop-shadow(0 0 14px rgba(255,226,176,0.45))" }}>
                  {/* logo da Black Mesa (Wikimedia Commons, domínio público) */}
                  <path d="M -675.85042,692.06247 C -746.50698,692.06247 -803.84374,749.41269 -803.8437,820.06922 C -803.8437,890.72575 -746.50698,948.0625 -675.85042,948.0625 C -605.1939,948.0625 -547.8437,890.72577 -547.8437,820.06922 C -547.8437,749.41268 -605.1939,692.06249 -675.85042,692.06247 z M -677.07545,715.10881 C -618.79275,715.10881 -571.48234,762.41923 -571.48234,820.70192 C -571.48234,837.62198 -574.37752,852.46735 -581.44395,866.48496 C -590.68528,851.14069 -602.72856,832.08702 -612.12301,815.81534 C -638.63521,815.62572 -696.19994,815.10187 -719.27768,815.10187 C -719.27768,841.73112 -718.90075,870.81307 -718.90075,892.00823 C -728.32704,891.86994 -744.87839,892.21966 -754.29142,892.14284 C -772.16909,873.22612 -781.74197,847.4042 -781.59163,819.34229 C -781.2891,762.57227 -735.35815,715.10881 -677.07545,715.10881 z" transform="translate(803.844, -692.062)" fill={CREAM} />
                </svg>
                <div>
                  <div style={{ fontSize: 34, letterSpacing: 5, color: CREAM }}>BLACK MESA</div>
                  <div style={{ fontSize: 13, letterSpacing: 4, color: CREAM, opacity: 0.6 }}>RESEARCH FACILITY · NOVO MÉXICO</div>
                  <div style={{ fontSize: 16, letterSpacing: 3, color: GREEN }}>{typed(f, codeAt, "CÓDIGO DE SEGURANÇA · NÍVEL 3", 1.6)}</div>
                  <div style={{ fontSize: 14, letterSpacing: 3, opacity: 0.6 }}>EM DESUSO DESDE 200-</div>
                </div>
              </div>
            </div>
            {/* 2 · quem usava */}
            <div style={{ flex: 1, position: "relative", padding: "18px 22px", background: "rgba(6,20,10,0.85)", border: `1px solid ${GREEN}`, borderRadius: 10, fontFamily: MONO, color: GREEN, opacity: who, overflow: "hidden" }}>
              <div style={{ fontSize: 15, letterSpacing: 4, opacity: 0.75 }}>QUEM USAVA ESTE CÓDIGO</div>
              <div style={{ display: "flex", gap: 18, marginTop: 14 }}>
                <div style={{ position: "relative", width: 130, height: 160, border: `1px solid ${GREEN}`, overflow: "hidden", background: "#0a120c" }}>
                  {Array.from({ length: 26 }).map((_, j) => (
                    <div key={j} style={{ position: "absolute", left: 0, right: 0, top: (j / 26) * 160, height: 7, background: `rgba(${120 + 100 * rnd(j + f * 3)},${150 + 90 * rnd(j * 2 + f * 5)},${130 + 90 * rnd(j * 7 + f)},${0.15 + 0.3 * rnd(j * 9 + f * 11)})` }} />
                  ))}
                  <div style={{ position: "absolute", left: 0, right: 0, bottom: 8, textAlign: "center", fontSize: 12, letterSpacing: 2, color: CREAM }}>SEM IMAGEM</div>
                </div>
                <div style={{ flex: 1, fontSize: 15, letterSpacing: 2, lineHeight: "30px" }}>
                  {[["NOME", 170], ["SETOR", 110], ["CARGO", 140]].map(([kk, w]) => (
                    <div key={kk as string} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ width: 62, opacity: 0.7 }}>{kk}</span>
                      <span style={{ width: w as number, height: 16, background: "#cfe9d6", opacity: 0.85 }} />
                    </div>
                  ))}
                  <div style={{ display: "flex", gap: 10 }}>
                    <span style={{ width: 62, opacity: 0.7 }}>STATUS</span>
                    <span style={{ color: AMB }}>DESCONHECIDO</span>
                  </div>
                </div>
              </div>
              <div style={{ position: "absolute", right: 20, bottom: 18, padding: "6px 14px", border: `3px solid ${RED}`, color: RED, fontSize: 22, letterSpacing: 4, transform: `rotate(-8deg) scale(${1 + (1 - sil) * 0.8})`, opacity: sil }}>NÃO DIVULGAR</div>
            </div>
            {/* 3 · onde está: triangulação que não fecha */}
            <div style={{ flex: 0.9, position: "relative", padding: "18px 22px", background: "rgba(6,20,10,0.85)", border: `1px solid ${fail ? RED : GREEN}`, borderRadius: 10, fontFamily: MONO, color: GREEN, opacity: weak, overflow: "hidden" }}>
              <div style={{ fontSize: 15, letterSpacing: 4, opacity: 0.75 }}>TRIANGULAÇÃO · ORIGEM</div>
              <svg width={300} height={170} style={{ display: "block", marginTop: 10 }}>
                {[[20, 160, -38], [280, 160, 212], [150, 10, 96]].map(([x, y, a], i) => {
                  const L = 90 + 140 * P(f, weakAt + i * 6, 20);
                  const r = ((a as number) * Math.PI) / 180;
                  return (
                    <g key={i}>
                      <circle cx={x} cy={y} r={6} fill={GREEN} />
                      <line x1={x} y1={y} x2={(x as number) + Math.cos(r) * L} y2={(y as number) - Math.sin(r) * L} stroke={fail ? RED : GREEN} strokeWidth={4} opacity={0.9} />
                    </g>
                  );
                })}
                {fail ? <circle cx={150} cy={95} r={28 + 6 * Math.sin(f / 4)} fill="none" stroke={RED} strokeWidth={2} opacity={0.7} /> : null}
              </svg>
              <div style={{ fontSize: 22, letterSpacing: 2, color: fail ? RED : GREEN }}>{pct}% · {fail ? "IMPOSSÍVEL LOCALIZAR" : "TRIANGULANDO…"}</div>
            </div>
          </div>
        ) : null}
      </AbsoluteFill>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ============================================================================================ 4) a telemetria da Alyx
// o monitor do HEV acompanhando a Alyx na viagem: no começo tudo NORMAL (pulso calmo) → anomalias numa linha do tempo:
// ela reage ANTES do evento (a marca dela vem antes da batida na porta) → nariz sangrando → a noite: a frase dela em
// vermelho → "eu não sei, Gordon" → PORTA: ??? (que porta? aberta quando?).
export const HLAlyxTelemetry: React.FC<{ life: number; normalAt?: number; anomAt?: number; reactAt?: number; doorAt?: number; bangAt?: number; noseAt?: number; nightAt?: number; line?: { w: string; at: number }[]; replyAt?: number; doorQAt?: number; openQAt?: number }> = ({
  life, normalAt = 0, anomAt = 1e9, reactAt = 1e9, doorAt = 1e9, bangAt = 1e9, noseAt = 1e9, nightAt = 1e9, line = [], replyAt = 1e9, doorQAt = 1e9, openQAt = 1e9,
}) => {
  const f = useCurrentFrame();
  const o = fade(f, life);
  const anom = f >= anomAt;
  const night = P(f, nightAt, 20);
  // pulso: calmo; acelera e fica irregular nas anomalias; dispara na noite
  const bpm = 64 + (anom ? 18 : 0) + night * 40;
  const pts: string[] = [];
  const W = 760;
  for (let x = 0; x <= W; x += 4) {
    const t = (f - (W - x) / 6) / 30;
    const ph = (t * bpm) / 60;
    const fr = ph - Math.floor(ph);
    let y = 0;
    if (fr < 0.06) y = -Math.sin((fr / 0.06) * Math.PI) * 70;
    else if (fr < 0.1) y = Math.sin(((fr - 0.06) / 0.04) * Math.PI) * 22;
    y += (rnd(Math.floor(t * 30) + x) - 0.5) * (anom ? 8 : 3);
    pts.push(`${x},${90 + y}`);
  }
  const status = (k: string, v: string, bad: boolean, at: number) =>
    f >= at ? (
      <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 22, letterSpacing: 3, marginTop: 10, opacity: flickIn(f, at) }}>
        <span style={{ opacity: 0.75 }}>{k}</span>
        <span style={{ color: bad ? RED : GREEN }}>{v}</span>
      </div>
    ) : null;
  // linha do tempo do evento da porta: a marca da Alyx (reação) vem 1 s ANTES da batida
  const TL = { x: 900, y: 300, w: 860 };
  const rk = P(f, doorAt, 12);
  const bang = f >= bangAt;
  const reactX = TL.x + TL.w * 0.38;
  const bangX = TL.x + TL.w * 0.62;
  const cursor = TL.x + TL.w * interpolate(f, [doorAt, bangAt + 8], [0.1, 0.7], C);
  const nose = P(f, noseAt, 10);
  const reply = P(f, replyAt, 12);
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <Bg f={f} tint={`rgba(255,${178 - 120 * night},${46 + 20 * night},0.05)`} />
      <AbsoluteFill style={{ background: `rgba(10,0,6,${0.45 * night})` }} />
      <AbsoluteFill style={{ transform: `translateY(130px) scale(${1.08 + interpolate(f, [0, life], [0, 0.03], C)})`, transformOrigin: "960px 200px" }}>
      <div style={{ position: "absolute", left: 120, top: 120, fontFamily: MONO, fontSize: 22, letterSpacing: 6, color: AMB }}>H.E.V. · ACOMPANHAMENTO · ALYX VANCE</div>
      {/* o monitor: pulso + status */}
      <Panel style={{ left: 120, top: 180, width: 700 }}>
        <div style={{ fontSize: 15, letterSpacing: 4, opacity: 0.7 }}>SINAIS VITAIS</div>
        <svg width={W} height={180} style={{ display: "block", marginTop: 8, width: 652 }} viewBox={`0 0 ${W} 180`}>
          <polyline points={pts.join(" ")} fill="none" stroke={anom ? (night > 0.5 ? RED : AMB) : GREEN} strokeWidth={3} style={{ filter: "drop-shadow(0 0 5px currentColor)" }} />
        </svg>
        <div style={{ fontSize: 38, letterSpacing: 2, color: CREAM }}>{Math.round(bpm)} <span style={{ fontSize: 18, opacity: 0.6 }}>BPM</span></div>
        {status("COMPORTAMENTO", anom ? "ANÔMALO" : "NORMAL", anom, normalAt)}
        {status("REAÇÃO", "ANTECIPADA · −1,0 s", true, reactAt)}
        {status("NARIZ", "SANGRAMENTO · SEM CAUSA", true, noseAt)}
      </Panel>
      {/* a linha do tempo da porta */}
      {rk > 0.01 ? (
        <div style={{ position: "absolute", left: 0, top: 0, opacity: rk * (1 - P(f, nightAt, 12)) }}>
          <div style={{ position: "absolute", left: TL.x, top: TL.y - 120, fontFamily: MONO, fontSize: 16, letterSpacing: 5, color: AMB, opacity: 0.7, whiteSpace: "nowrap" }}>EVENTO · PORTA</div>
          <div style={{ position: "absolute", left: TL.x, top: TL.y, width: TL.w, height: 2, background: "rgba(255,178,46,0.4)" }} />
          <div style={{ position: "absolute", left: cursor, top: TL.y - 40, width: 2, height: 80, background: "rgba(255,226,176,0.5)" }} />
          {/* a reação dela */}
          <div style={{ position: "absolute", left: reactX - 9, top: TL.y - 9, width: 18, height: 18, borderRadius: 9, background: ICE, boxShadow: `0 0 16px ${ICE}`, opacity: f >= doorAt + 6 ? 1 : 0 }} />
          <div style={{ position: "absolute", left: reactX - 120, top: TL.y + 26, width: 240, textAlign: "center", fontFamily: MONO, fontSize: 20, letterSpacing: 2, color: ICE, opacity: f >= doorAt + 6 ? 1 : 0 }}>ALYX OLHA</div>
          {/* a batida */}
          <div style={{ position: "absolute", left: bangX - 14, top: TL.y - 14, width: 28, height: 28, transform: "rotate(45deg)", background: bang ? RED : "transparent", border: `2px solid ${RED}`, boxShadow: bang ? `0 0 ${30 * (1 - P(f, bangAt, 16)) + 8}px ${RED}` : undefined, opacity: bang ? 1 : 0.35 }} />
          <div style={{ position: "absolute", left: bangX - 120, top: TL.y + 26, width: 240, textAlign: "center", fontFamily: MONO, fontSize: 20, letterSpacing: 2, color: RED, opacity: bang ? 1 : 0.35 }}>A PORTA BATE</div>
          {/* o intervalo: −1,0 s */}
          <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0, opacity: bang ? 1 : 0 }}>
            <path d={`M ${reactX} ${TL.y - 50} L ${reactX} ${TL.y - 64} L ${bangX} ${TL.y - 64} L ${bangX} ${TL.y - 50}`} fill="none" stroke={CREAM} strokeWidth={2} />
          </svg>
          <div style={{ position: "absolute", left: (reactX + bangX) / 2 - 100, top: TL.y - 104, width: 200, textAlign: "center", fontFamily: MONO, fontSize: 26, color: CREAM, opacity: bang ? 1 : 0 }}>1 s ANTES</div>
        </div>
      ) : null}
      {/* a noite: a frase dela */}
      {night > 0.01 ? (
        <div style={{ position: "absolute", left: 900, top: 230, width: 880, opacity: night }}>
          <div style={{ fontFamily: MONO, fontSize: 16, letterSpacing: 5, color: RED, opacity: 0.8 }}>NOITE · ÁUDIO DO ACAMPAMENTO · ALYX ACORDA</div>
          <div style={{ marginTop: 18, fontFamily: MONO, fontSize: 52, lineHeight: 1.25, letterSpacing: 2, color: "#ffd2cc", textShadow: "0 0 24px rgba(255,93,77,0.55)" }}>
            {line.map((w, i) => (f >= w.at ? <span key={i} style={{ opacity: flickIn(f, w.at) }}>{w.w} </span> : null))}
          </div>
          {reply > 0.01 ? (
            <div style={{ marginTop: 36, fontFamily: MONO, fontSize: 30, letterSpacing: 2, color: CREAM, opacity: reply }}>“Eu não sei, Gordon. Eu não sei o que está acontecendo.”</div>
          ) : null}
          <div style={{ marginTop: 34, display: "flex", gap: 40, fontFamily: MONO, fontSize: 26, letterSpacing: 3 }}>
            {f >= doorQAt ? <span style={{ color: AMB, opacity: flickIn(f, doorQAt) }}>QUE PORTA? <span style={{ color: RED }}>???</span></span> : null}
            {f >= openQAt ? <span style={{ color: AMB, opacity: flickIn(f, openQAt) }}>POR QUE “AINDA”? <span style={{ color: RED }}>???</span></span> : null}
          </div>
        </div>
      ) : null}
      {/* o sangue: uma gota vermelha discreta no painel */}
      {nose > 0.01 && night < 0.5 ? <div style={{ position: "absolute", left: 790, top: 180 + 60 * nose, width: 10, height: 16, borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%", background: RED, opacity: nose * 0.9 }} /> : null}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ============================================================================================ 3b) a travessia pelo mar
// carta náutica 2D (mesma família do mapa tático): o aerobarco sai da costa de White Forest e corta o mar entre placas
// de gelo rumo ao Ártico; a câmera segue o barco; a tripulação entra na palavra; o rádio do Kleiner fica ligado no
// canto; no fim aparece a ESTAÇÃO ABANDONADA e o barco atraca ao lado dela (prepara o sinal do rádio).
type Crew = { name: string; img?: string; at: number };
const SEA_W = 1920;
const SEA_H = 3300;
const ROUTE: [number, number][] = [
  [640, 3020],
  [700, 2800],
  [900, 2480],
  [1120, 2120],
  [1000, 1720],
  [860, 1360],
  [1020, 980],
  [1080, 720],
  [1100, 540],
];
const routeLen = (() => {
  const L = [0];
  for (let i = 1; i < ROUTE.length; i++) L.push(L[i - 1] + Math.hypot(ROUTE[i][0] - ROUTE[i - 1][0], ROUTE[i][1] - ROUTE[i - 1][1]));
  return L;
})();
const routeAt = (u: number): { x: number; y: number } => {
  const s = Math.max(0, Math.min(1, u)) * routeLen[routeLen.length - 1];
  let i = 1;
  while (i < routeLen.length - 1 && routeLen[i] < s) i++;
  const t = (s - routeLen[i - 1]) / (routeLen[i] - routeLen[i - 1]);
  const [x0, y0] = ROUTE[i - 1];
  const [x1, y1] = ROUTE[i];
  return { x: x0 + (x1 - x0) * t, y: y0 + (y1 - y0) * t };
};
// placas de gelo: mais ao norte, mais e maiores; nenhuma em cima da rota
const FLOES = Array.from({ length: 110 })
  .map((_, i) => {
    const y = 380 + rnd(i * 3.1) * 2500;
    const north = 1 - y / 2900;
    return { x: rnd(i * 7.7) * SEA_W, y, r: 14 + rnd(i * 1.9) * 46 * (0.4 + north), keep: rnd(i * 5.3) < 0.2 + north * 0.95, k: i };
  })
  .filter((p) => p.keep && ROUTE.every((q, j) => j === 0 || Math.hypot(p.x - q[0], p.y - q[1]) > p.r + 70));
const floePath = (cx: number, cy: number, r: number, k: number) => {
  let d = "";
  for (let j = 0; j < 7; j++) {
    const a = (j / 7) * Math.PI * 2;
    const rr = r * (0.7 + 0.5 * rnd(k * 13 + j));
    d += `${j ? "L" : "M"} ${cx + Math.cos(a) * rr} ${cy + Math.sin(a) * rr * 0.8} `;
  }
  return d + "Z";
};

export const HLSeaRoute: React.FC<{ life: number; crew?: Crew[]; departAt?: number; radioAt?: number; stationAt?: number; dockAt?: number }> = ({
  life,
  crew = [],
  departAt = 0,
  radioAt = 1e9,
  stationAt = 1e9,
  dockAt = 1e9,
}) => {
  const f = useCurrentFrame();
  void life;
  // o barco: parado no cais → acelera → navega → desacelera e atraca
  const u = interpolate(f, [departAt, dockAt], [0, 1], { ...C, easing: Easing.bezier(0.45, 0, 0.25, 1) });
  const boat = routeAt(u);
  const ahead = routeAt(Math.min(1, u + 0.015));
  const behind = routeAt(Math.max(0, u - 0.015));
  const ang = Math.atan2(ahead.y - behind.y, ahead.x - behind.x);
  const moving = f > departAt && f < dockAt;
  // câmera: segue o barco e aproxima quando a estação aparece
  const followY = Math.max(540, Math.min(SEA_H - 540, boat.y - 40 - 180 * P(f, stationAt, 30)));
  const followX = 960 + (boat.x - 960) * 0.35;
  const dive = interpolate(f, [Math.max(0, departAt - 22), departAt + 8], [0, 1], { ...C, easing: Easing.inOut(Easing.cubic) });
  const camY = SEA_H / 2 + (followY - SEA_H / 2) * dive;
  const camX = 960 + (followX - 960) * dive;
  const overview = 1080 / SEA_H + 0.02;
  const zoom = overview + (1.18 - overview) * dive + 0.2 * P(f, stationAt, 30); // visão geral → segue o barco (sem borda preta)
  const station = { x: 1120, y: 300 };
  const st = Math.max(0.55 * (1 - dive), P(f, stationAt, 14)); // na visão geral a estação já aparece no gelo
  const docked = f >= dockAt;
  const rad = P(f, radioAt, 12);
  const temp = Math.round(interpolate(u, [0, 1], [-2, -31]));
  const dist = Math.round(interpolate(u, [0, 1], [1240, 0]));
  const wake: string[] = [];
  for (let k = 0; k <= 40; k++) {
    const q = routeAt(Math.max(0, u - (k / 40) * 0.1));
    wake.push(`${q.x},${q.y}`);
  }
  return (
    <AbsoluteFill style={{ background: "#061018", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${zoom}) translate(${960 - camX}px, ${540 - camY}px)`, transformOrigin: "960px 540px" }}>
        <svg width={SEA_W} height={SEA_H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <defs>
            <linearGradient id="seaG" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0" stopColor="#0b2230" />
              <stop offset="0.75" stopColor="#0c1e2b" />
              <stop offset="1" stopColor="#15293b" />
            </linearGradient>
          </defs>
          <rect x={-4000} width={SEA_W + 8000} height={SEA_H} fill="url(#seaG)" />
          {Array.from({ length: 12 }).map((_, i) => (
            <line key={`la${i}`} x1={0} x2={SEA_W} y1={i * 300} y2={i * 300} stroke="rgba(159,230,255,0.07)" strokeWidth={2} />
          ))}
          {Array.from({ length: 7 }).map((_, i) => (
            <line key={`lo${i}`} y1={0} y2={SEA_H} x1={i * 320} x2={i * 320} stroke="rgba(159,230,255,0.05)" strokeWidth={2} />
          ))}
          {Array.from({ length: 150 }).map((_, i) => {
            const x = (rnd(i * 2.3) * SEA_W + f * 0.6) % SEA_W;
            const y = rnd(i * 4.1) * SEA_H;
            return <path key={`w${i}`} d={`M ${x} ${y} q 10 -6 20 0 q 10 6 20 0`} fill="none" stroke="rgba(159,230,255,0.12)" strokeWidth={1.6} />;
          })}
          {/* costa de White Forest (sul) */}
          <path d={`M 0 ${SEA_H} L 0 2980 C 220 2940 380 3060 560 3050 C 720 3040 800 3120 1000 3110 C 1300 3100 1500 3020 1920 3060 L 1920 ${SEA_H} Z`} fill="#16301f" stroke="rgba(141,255,168,0.35)" strokeWidth={3} />
          {Array.from({ length: 60 }).map((_, i) => {
            const x = rnd(i * 9.1) * SEA_W;
            const y = 3140 + rnd(i * 2.7) * 140;
            return <path key={`t${i}`} d={`M ${x} ${y - 16} L ${x - 9} ${y + 6} L ${x + 9} ${y + 6} Z`} fill="rgba(141,255,168,0.25)" />;
          })}
          {/* banquisa do Ártico (norte) */}
          <rect x={-4000} y={-200} width={4000} height={680} fill="#dbe9f2" opacity={0.92} />
          <rect x={1920} y={-200} width={4000} height={600} fill="#dbe9f2" opacity={0.92} />
          <rect x={-4000} y={3000} width={4000} height={400} fill="#16301f" />
          <rect x={1920} y={3060} width={4000} height={400} fill="#16301f" />
          <path d="M 0 0 L 1920 0 L 1920 420 C 1700 470 1500 400 1320 470 C 1180 520 1120 470 980 500 C 760 545 520 450 300 500 C 160 530 60 480 0 500 Z" fill="#dbe9f2" opacity={0.92} />
          <path d="M 0 500 C 60 480 160 530 300 500 C 520 450 760 545 980 500 C 1120 470 1180 520 1320 470 C 1500 400 1700 470 1920 420" fill="none" stroke="#9fe6ff" strokeWidth={3} />
          {FLOES.map((p) => (
            <path key={`f${p.k}`} d={floePath(p.x, p.y, p.r, p.k)} fill="rgba(219,233,242,0.8)" stroke="rgba(159,230,255,0.6)" strokeWidth={1.5} />
          ))}
          {/* rota planejada e esteira */}
          <polyline points={ROUTE.map((p) => p.join(",")).join(" ")} fill="none" stroke="rgba(255,178,46,0.35)" strokeWidth={3} strokeDasharray="14 12" />
          <polyline points={wake.join(" ")} fill="none" stroke="rgba(230,250,255,0.5)" strokeWidth={moving ? 10 : 4} strokeLinecap="round" />
          {/* cais de White Forest */}
          <g transform="translate(640 3040)">{/* cais */}
            <rect x={-40} y={-8} width={80} height={16} fill="#3a2a12" stroke={AMB} strokeWidth={2} />
            <text x={70} y={60} textAnchor="start" fill={AMB} fontFamily={MONO} fontSize={22} letterSpacing={4}>
              COSTA NORTE · EMBARQUE
            </text>
          </g>
          {/* a ilha de rocha onde fica a estação (sai do gelo) */}
          <g transform={`translate(${station.x} ${station.y}) scale(${1.5 + 1.2 * (1 - dive)})`} opacity={Math.max(st, 0.85)}>
            <path d="M -130 40 L -110 -10 L -70 -40 L -20 -52 L 40 -46 L 96 -24 L 128 14 L 110 50 L 40 66 L -60 64 Z" fill="#3b4148" stroke="#8a96a0" strokeWidth={2} />
            <path d="M -90 30 L -60 -6 M -20 40 L 10 0 L 50 -20 M 70 40 L 96 10" stroke="#59636c" strokeWidth={2} fill="none" />
            <path d="M -130 40 L -110 -10 L -70 -40" stroke="#e7eef3" strokeWidth={4} fill="none" opacity={0.7} />
            <text x={0} y={92} textAnchor="middle" fill="#c9d6df" fontFamily={MONO} fontSize={13} letterSpacing={3}>
              ILHA ROCHOSA
            </text>
          </g>
          {/* a estação abandonada, na ilha */}
          <g transform={`translate(${station.x} ${station.y}) scale(${1.5 + 1.2 * (1 - dive)})`} opacity={st}>
            {[0, 1, 2].map((k) => {
              const t = (((f - stationAt - k * 14) % 42) + 42) % 42 / 42;
              return f > stationAt ? <circle key={k} r={60 + t * 140} fill="none" stroke={RED} strokeWidth={2} opacity={(1 - t) * 0.5} /> : null;
            })}
            <rect x={-70} y={-20} width={70} height={36} fill="#3a3f45" stroke="#c9d6df" strokeWidth={2.5} />
            <rect x={6} y={-12} width={52} height={28} fill="#3a3f45" stroke="#c9d6df" strokeWidth={2.5} />
            <line x1={-70} y1={-2} x2={0} y2={-2} stroke="#c9d6df" strokeWidth={1} opacity={0.5} />
            <circle cx={-34} cy={-44} r={22} fill="#e7eef3" stroke="#c9d6df" strokeWidth={2.5} />
            <path d="M -50 -52 L -18 -52 M -54 -44 L -14 -44 M -50 -36 L -18 -36" stroke="#9aa9b4" strokeWidth={1.2} />
            <line x1={40} y1={-12} x2={40} y2={-110} stroke="#c9d6df" strokeWidth={3} />
            <path d="M 40 -110 L 18 -12 M 40 -110 L 62 -12 M 40 -80 L 26 -60 L 54 -60 Z" stroke="#c9d6df" strokeWidth={1.4} fill="none" />
            <path d="M 28 -100 L 52 -100 M 31 -90 L 49 -90" stroke="#c9d6df" strokeWidth={2} />
            <circle cx={40} cy={-114} r={5} fill={RED} opacity={Math.floor(f / 12) % 2 ? 1 : 0.25} />
            <path d="M -90 34 L 90 34" stroke="rgba(120,140,160,0.6)" strokeWidth={2} strokeDasharray="6 6" />
          </g>
          {/* a frota fica no litoral: o comboio do Eli e do Varga */}
          <g transform="translate(1280 3070)">
            {[0, 1, 2, 3, 4, 5].map((k) => (
              <rect key={k} x={-120 + k * 44} y={-10 + (k % 2) * 8} width={32} height={16} rx={3} fill="#2a1d0c" stroke={AMB} strokeWidth={2} />
            ))}
            <text x={-120} y={80} fill={AMB} fontFamily={MONO} fontSize={20} letterSpacing={3}>
              FROTA · ELI · VARGA
            </text>
          </g>
          {/* rótulo que acompanha o barco */}
          <g transform={`translate(${boat.x + 60} ${boat.y - 40})`} opacity={P(f, departAt - 20, 10)}>
            <line x1={-50} y1={34} x2={0} y2={6} stroke={AMB} strokeWidth={1.5} />
            <rect x={0} y={-14} width={310} height={28} rx={4} fill="rgba(3,6,10,0.85)" stroke={AMB} strokeWidth={1.5} />
            <text x={155} y={6} textAnchor="middle" fill={AMB} fontFamily={MONO} fontSize={16} letterSpacing={3}>
              AEROBARCO · DOG A BORDO
            </text>
          </g>
          {/* o aerobarco visto de cima */}
          <g transform={`translate(${boat.x} ${boat.y}) rotate(${(ang * 180) / Math.PI}) scale(1.7)`}>
            <path d="M 34 0 L 18 -15 L -26 -15 L -26 15 L 18 15 Z" fill="#3a2508" stroke={AMB} strokeWidth={3} />
            <rect x={-6} y={-8} width={16} height={16} fill={AMB} opacity={0.8} />
            <circle cx={22} cy={0} r={5} fill="#2a2f35" stroke={CREAM} strokeWidth={1.5} />
            <circle cx={-32} cy={0} r={13} fill="none" stroke={AMB} strokeWidth={3} />
            <g transform={`translate(-32 0) rotate(${moving ? f * 60 : f * 6})`}>
              <line x1={-11} y1={0} x2={11} y2={0} stroke={CREAM} strokeWidth={2} />
              <line x1={0} y1={-11} x2={0} y2={11} stroke={CREAM} strokeWidth={2} />
            </g>
          </g>
        </svg>
        <div style={{ position: "absolute", left: station.x - 560, top: station.y - 40, opacity: P(f, stationAt, 14), fontFamily: MONO, color: RED, letterSpacing: 4, whiteSpace: "nowrap", padding: "8px 14px", background: "rgba(3,6,10,0.85)", border: `1px solid ${RED}`, borderRadius: 6 }}>
          <div style={{ fontSize: 26 }}>ESTAÇÃO ABANDONADA</div>
          <div style={{ fontSize: 17, opacity: 0.8 }}>POSTO ÁRTICO 7 · SEM ATIVIDADE</div>
          {docked ? <div style={{ marginTop: 8, fontSize: 18, color: CREAM, opacity: flickIn(f, dockAt) }}>● EXPEDIÇÃO ATRACADA</div> : null}
        </div>
      </AbsoluteFill>
      <div style={{ position: "absolute", left: 70, top: 64, padding: "14px 20px", background: "rgba(3,6,10,0.82)", border: "1px solid rgba(255,178,46,0.35)", borderRadius: 8, fontFamily: MONO, color: AMB, letterSpacing: 5 }}>
        <div style={{ fontSize: 22 }}>RESISTÊNCIA · CARTA NÁUTICA</div>
        <div style={{ fontSize: 17, opacity: 0.7 }}>COSTA NORTE → ÁRTICO</div>
        <div style={{ marginTop: 14, fontSize: 18, color: CREAM, opacity: 0.85 }}>
          DIST. {dist.toLocaleString("pt-BR")} km · {temp}°C
        </div>
      </div>
      <div style={{ position: "absolute", right: 70, top: 64, width: 360, padding: "14px 18px", background: "rgba(3,6,10,0.82)", border: "1px solid rgba(255,178,46,0.35)", borderRadius: 8, fontFamily: MONO }}>
        <div style={{ fontSize: 15, letterSpacing: 5, color: AMB, opacity: 0.75, marginBottom: 8 }}>A BORDO</div>
        {crew.map((c, i) =>
          f >= c.at ? (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, height: 46, opacity: flickIn(f, c.at), transform: `translateX(${(1 - P(f, c.at, 8)) * 20}px)` }}>
              <div style={{ width: 36, height: 36, borderRadius: 18, overflow: "hidden", border: `2px solid ${AMB}`, background: "#2a1d0c", display: "flex", alignItems: "center", justifyContent: "center", color: AMB, fontSize: 16 }}>
                {c.img ? <Img src={staticFile(c.img)} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "λ"}
              </div>
              <span style={{ fontSize: 20, letterSpacing: 3, color: CREAM }}>{c.name}</span>
            </div>
          ) : null,
        )}
      </div>
      <div style={{ position: "absolute", right: 70, bottom: 70, width: 420, padding: "12px 16px 10px", background: "rgba(3,6,10,0.85)", border: "1px solid rgba(255,178,46,0.45)", borderRadius: 8, fontFamily: MONO, opacity: P(f, departAt - 20, 12) }}>
        <div style={{ fontSize: 14, letterSpacing: 4, color: AMB, opacity: 0.8 }}>VEÍCULO</div>
        <div style={{ fontSize: 22, letterSpacing: 3, color: CREAM }}>AEROBARCO · RESISTÊNCIA</div>
        <svg width={388} height={130} viewBox="0 0 388 130" style={{ display: "block", marginTop: 6 }}>
          {/* casco chato que desliza na água */}
          <path d="M 20 96 L 300 96 L 340 80 L 330 74 L 40 74 Z" fill="#3a2508" stroke={AMB} strokeWidth={2.5} />
          {/* banco e piloto (só o banco) */}
          <path d="M 150 74 L 150 58 L 190 58 L 190 74" fill="none" stroke={AMB} strokeWidth={2} />
          {/* a gaiola com a hélice grande atrás */}
          <circle cx={78} cy={44} r={36} fill="none" stroke={AMB} strokeWidth={2.5} />
          <circle cx={78} cy={44} r={30} fill="none" stroke="rgba(255,178,46,0.4)" strokeWidth={1} strokeDasharray="3 4" />
          <g transform={`translate(78 44) rotate(${(moving ? f * 50 : f * 4) % 360})`}>
            <path d="M 0 0 L 4 -28 L -4 -28 Z M 0 0 L 4 28 L -4 28 Z M 0 0 L 28 4 L 28 -4 Z M 0 0 L -28 4 L -28 -4 Z" fill={CREAM} opacity={0.85} />
          </g>
          <line x1={78} y1={80} x2={78} y2={74} stroke={AMB} strokeWidth={3} />
          <line x1={110} y1={50} x2={140} y2={74} stroke={AMB} strokeWidth={2} />
          {/* esteira de água */}
          {moving ? [0, 1, 2].map((k) => <path key={k} d={`M ${18 - k * 6 - ((f * 3) % 20)} ${100 + k * 6} q 10 -4 20 0`} fill="none" stroke="rgba(230,250,255,0.6)" strokeWidth={2} />) : null}
          <text x={360} y={120} textAnchor="end" fill={AMB} fontFamily={MONO} fontSize={12} letterSpacing={2} opacity={0.7}>
            HÉLICE TRASEIRA · CASCO CHATO
          </text>
        </svg>
      </div>
      <div style={{ position: "absolute", left: 80, bottom: 70, display: "flex", alignItems: "center", gap: 16, padding: "12px 18px", background: "rgba(3,6,10,0.82)", border: `1px solid ${GREEN}`, borderRadius: 8, opacity: rad, transform: `translateY(${(1 - rad) * 20}px)`, fontFamily: MONO }}>
        <div style={{ width: 52, height: 52, borderRadius: 26, overflow: "hidden", border: `2px solid ${GREEN}` }}>
          <Img src={staticFile("hl3silh/kleiner_retrato.png")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
        <div>
          <div style={{ fontSize: 15, letterSpacing: 4, color: GREEN, opacity: 0.8 }}>RÁDIO DA RESISTÊNCIA</div>
          <div style={{ fontSize: 20, letterSpacing: 3, color: CREAM }}>KLEINER · COORDENANDO</div>
        </div>
        <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 30 }}>
          {[0, 1, 2, 3, 4].map((k) => (
            <div key={k} style={{ width: 6, height: 6 + k * 6, background: GREEN, opacity: 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(f / 4 + k)) }} />
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ============================================================================================ 2b) a memória (tela cheia)
// cada lembrança ocupa a tela inteira (imagem real do final do Alyx) com cara de gravação de memória: borda escura,
// grão, linhas, timecode e REC; embaixo, uma linha do tempo fina mostra onde estamos. "Depois disso" a cabeça de
// leitura passa da última marca para uma faixa vermelha, a imagem rasga em estática e fica SEM REGISTRO; as perguntas
// entram grandes; o Eli: volta o G-Man congelado, sem cor, e "EM TROCA DE QUÊ?".
type MFrag = { src: string; from: number; label: string; at: number; quote?: boolean };
const Static: React.FC<{ f: number; amt: number }> = ({ f, amt }) => (
  <AbsoluteFill style={{ opacity: amt }}>
    {Array.from({ length: 60 }).map((_, j) => (
      <div key={j} style={{ position: "absolute", left: 0, right: 0, top: `${(j / 60) * 100}%`, height: `${100 / 60 + 0.2}%`, background: `rgba(${(() => { const g = 60 + 170 * rnd(j + f * 7); return `${g},${g},${g + 10}`; })()},${0.3 + 0.55 * rnd(j * 11 + f * 13)})`, transform: `translateX(${(rnd(j * 7 + f) - 0.5) * 60}px)` }} />
    ))}
  </AbsoluteFill>
);
const MemSearch: React.FC<{ f: number; t0: number; qs: { text: string; at: number }[]; last?: MFrag }> = ({ f, t0, qs, last }) => {
  const t = f - t0;
  const CW = 330;
  const CH = 210;
  const GAP = 46;
  const off = 520 - Math.pow(Math.max(0, t), 0.92) * 14; // a fita corre para a esquerda e vai perdendo força
  const scanned = Math.floor(Math.max(0, t) * 48731 + Math.max(0, t) ** 2 * 2900);
  const n = 14;
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 40%, #0b1419 0%, #020304 75%)" }}>
      <div style={{ position: "absolute", left: 160, top: 150, fontFamily: MONO, color: ICE, letterSpacing: 6, opacity: P(f, t0, 8) }}>
        <div style={{ fontSize: 22 }}>BUSCA NA MEMÓRIA · DEPOIS DO COFRE</div>
        <div style={{ fontSize: 17, opacity: 0.7, marginTop: 6 }}>
          QUADROS LIDOS {scanned.toLocaleString("pt-BR")} · <span style={{ color: RED }}>CONTEÚDO 0</span>
        </div>
      </div>
      {/* a fita em perspectiva */}
      <div style={{ position: "absolute", left: 0, top: 300, width: 1920, height: 330, perspective: 1500 }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 330, transform: "rotateY(-16deg) rotateX(6deg)", transformOrigin: "30% 50%" }}>
          <div style={{ position: "absolute", left: -400, right: -400, top: 30, height: CH + 60, background: "#0d1216", borderTop: `2px solid rgba(159,230,255,0.35)`, borderBottom: `2px solid rgba(159,230,255,0.35)` }} />
          {/* furos da fita */}
          {Array.from({ length: 60 }).map((_, k) => {
            const x = ((off * 1.0 + k * 52) % (60 * 52) + 60 * 52) % (60 * 52) - 400;
            return (
              <React.Fragment key={k}>
                <div style={{ position: "absolute", left: x, top: 38, width: 22, height: 12, borderRadius: 3, background: "#020304" }} />
                <div style={{ position: "absolute", left: x, top: 30 + CH + 38, width: 22, height: 12, borderRadius: 3, background: "#020304" }} />
              </React.Fragment>
            );
          })}
          {Array.from({ length: n }).map((_, k) => {
            const x = off + (k - 1) * (CW + GAP);
            if (x < -500 || x > 2300) return null;
            const real = k === 0;
            return (
              <div key={k} style={{ position: "absolute", left: x, top: 60, width: CW, height: CH, background: real ? "#000" : "#06090b", border: `1px solid rgba(159,230,255,${real ? 0.6 : 0.18})`, overflow: "hidden" }}>
                {real && last ? (
                  <div style={{ position: "absolute", inset: 0, filter: "saturate(0.5) brightness(0.9)" }}>
                    <Clip src={last.src} from={last.from + 2} rate={0.7} />
                  </div>
                ) : (
                  // quadro vazio: só um chiado fino
                  Array.from({ length: 10 }).map((__, j) => <div key={j} style={{ position: "absolute", left: 0, right: 0, top: j * 21, height: 21, background: `rgba(160,190,200,${0.02 + 0.05 * rnd(j + k * 13 + f * 3)})` }} />)
                )}
                <div style={{ position: "absolute", left: 8, bottom: 6, fontFamily: MONO, fontSize: 13, letterSpacing: 2, color: real ? ICE : "rgba(159,230,255,0.35)" }}>{real ? "ÚLTIMO QUADRO" : `??:??:${String(k * 7 % 60).padStart(2, "0")}`}</div>
              </div>
            );
          })}
        </div>
      </div>
      {/* a cabeça de leitura (fixa) */}
      <div style={{ position: "absolute", left: 958, top: 270, width: 4, height: 390, background: CREAM, boxShadow: `0 0 18px ${CREAM}`, opacity: 0.8 }} />
      <div style={{ position: "absolute", left: 900, top: 236, width: 120, textAlign: "center", fontFamily: MONO, fontSize: 14, letterSpacing: 4, color: CREAM, opacity: 0.8 }}>LEITOR</div>
      {/* as buscas */}
      <div style={{ position: "absolute", left: 160, top: 700, width: 1600, fontFamily: MONO }}>
        {qs.map((q, i) => {
          if (f < q.at) return null;
          const sc = interpolate(f, [q.at, q.at + 22], [0, 1], C);
          const done = sc >= 1;
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 24, height: 72, borderBottom: "1px solid rgba(159,230,255,0.15)", opacity: P(f, q.at, 6) }}>
              <span style={{ fontSize: 22, color: ICE, opacity: 0.6, width: 40 }}>{`0${i + 1}`}</span>
              <span style={{ fontSize: 40, letterSpacing: 3, color: CREAM, flex: 1 }}>{typed(f, q.at, q.text + "?", 1.6)}</span>
              <div style={{ width: 260, height: 8, background: "rgba(159,230,255,0.12)", position: "relative" }}>
                <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${sc * 100}%`, background: done ? RED : ICE }} />
              </div>
              <span style={{ width: 300, fontSize: 22, letterSpacing: 4, color: done ? RED : ICE, opacity: done ? flickIn(f, q.at + 22) : 0.7 }}>{done ? "NADA ENCONTRADO" : "BUSCANDO…"}</span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
export const HLMemoryTape: React.FC<{ life: number; frags?: MFrag[]; afterAt?: number; nadaAt?: number; qs?: { text: string; at: number }[]; eliAt?: number; tradeAt?: number; gman?: { src: string; from: number } }> = ({
  life,
  frags = [],
  afterAt = 1e9,
  nadaAt = 1e9,
  qs = [],
  eliAt = 1e9,
  tradeAt = 1e9,
  gman = { src: "videos/hl3_M01_1A2/clips/alyx_gman.mp4", from: 0.6 },
}) => {
  const f = useCurrentFrame();
  void life;
  // lembrança atual
  let cur = -1;
  frags.forEach((fr, i) => {
    if (f >= fr.at) cur = i;
  });
  // antes da 1ª palavra a 1ª lembrança já está na tela (sai da estática); o nome entra na palavra
  const fr = cur >= 0 ? frags[cur] : frags[0] ?? null;
  const pre = cur < 0;
  const tear = interpolate(f, [afterAt, nadaAt], [0, 1], C); // a fita rasga
  const isStatic = f >= nadaAt - 4 && f < eliAt;
  const eli = f >= eliAt;
  const cut = fr ? 1 : 0; // corte seco entre as lembranças
  // entrada: a memória acende num clarão e entra em foco (vindo de perto)
  const intro = P(f, 0, 18);
  // linha do tempo: as 4 marcas na metade esquerda; a faixa vermelha (sem registro) à direita
  const TL = { x: 160, w: 1600, y: 960 };
  const mx = (i: number) => TL.x + (TL.w * 0.5 * (i + 0.5)) / Math.max(1, frags.length);
  const head = cur < 0 ? TL.x : f < afterAt ? mx(cur) + interpolate(f, [fr!.at, (frags[cur + 1]?.at ?? afterAt)], [0, TL.w * 0.5 / Math.max(1, frags.length) - 6], C) : interpolate(f, [afterAt, nadaAt + 30], [mx(frags.length - 1) + 40, TL.x + TL.w * 0.92], { ...C, easing: Easing.out(Easing.cubic) });
  const tc = (t: number) => {
    const s = Math.floor(t / 30);
    return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}:${String(Math.floor(t % 30)).padStart(2, "0")}`;
  };
  return (
    <AbsoluteFill style={{ background: "#020304" }}>
      {/* a lembrança em tela cheia: cada uma num Sequence próprio (pré-carregado), começa no ponto certo do clipe */}
      {!isStatic && !eli
        ? frags.map((q, i) => {
            const a = i === 0 ? 0 : Math.round(q.at);
            const b = Math.round(frags[i + 1]?.at ?? nadaAt);
            if (b <= a) return null;
            return (
              <Sequence key={i} from={a} durationInFrames={b - a} premountFor={30}>
                <AbsoluteFill style={{ filter: `saturate(${0.85 - 0.6 * tear}) contrast(1.05) brightness(${(1 - 0.3 * tear) * (1 + 1.4 * (1 - intro))}) blur(${tear * 3 + (1 - intro) * 14}px)`, transform: `scale(${1.04 + (f - a) * 0.0006 + (1 - intro) * 0.25}) translateX(${tear * (rnd(f) - 0.5) * 80}px)` }}>
                  <Clip src={q.src} from={q.from} rate={0.7} />
                </AbsoluteFill>
              </Sequence>
            );
          })
        : null}
      {/* o Eli: o G-Man congelado, sem cor */}
      {eli ? (
        <AbsoluteFill style={{ filter: "grayscale(1) contrast(1.15) brightness(1.6)", transform: `scale(${1.6 + (f - eliAt) * 0.001})`, transformOrigin: "88% 30%" }}>
          <Clip src={gman.src} from={gman.from} rate={0.12} />
        </AbsoluteFill>
      ) : null}
      {/* estática: entra rasgando e toma a tela */}
      <Static f={f} amt={eli ? 1 - P(f, eliAt, 10) : isStatic ? Math.max(0, 1 - (f - nadaAt) / 8) : tear * 0.7} />
      <AbsoluteFill style={{ background: "#eaf6ff", opacity: 0.85 * (1 - P(f, 0, 12)) }} />
      {/* textura de memória gravada: vinheta, linhas, borda */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(0,0,0,0.55) 100%)" }} />
      <AbsoluteFill style={{ backgroundImage: "repeating-linear-gradient(0deg, rgba(0,0,0,0.06) 0 2px, transparent 2px 5px)" }} />
      <div style={{ position: "absolute", left: 70, top: 56, fontFamily: MONO, fontSize: 20, letterSpacing: 6, color: ICE, opacity: 0.85 }}>MEMÓRIA · ALYX VANCE</div>
      <div style={{ position: "absolute", right: 70, top: 56, fontFamily: MONO, fontSize: 20, letterSpacing: 4, color: eli ? RED : ICE, display: "flex", gap: 12, alignItems: "center" }}>
        {!isStatic && !eli ? <span style={{ width: 14, height: 14, borderRadius: 7, background: RED, opacity: Math.floor(f / 15) % 2 ? 1 : 0.3 }} /> : null}
        <span>{eli ? "ANÁLISE · ELI VANCE" : isStatic ? "--:--:--" : tc(f)}</span>
      </div>
      {/* o nome da lembrança (grande) */}
      {fr && !pre && !isStatic && !eli ? (
        <div key={cur} style={{ position: "absolute", left: 160, bottom: 200, fontFamily: fr.quote ? MONO : MONO, color: CREAM, opacity: P(f, fr.at, 8) * (1 - tear), transform: `translateY(${(1 - P(f, fr.at, 10)) * 20}px)`, textShadow: "0 4px 24px rgba(0,0,0,0.9)" }}>
          <div style={{ fontSize: 18, letterSpacing: 6, color: ICE, opacity: 0.8 }}>LEMBRANÇA {String(cur + 1).padStart(2, "0")}</div>
          <div style={{ fontSize: fr.quote ? 46 : 74, letterSpacing: fr.quote ? 1 : 6, fontStyle: fr.quote ? "italic" : undefined, maxWidth: 1400, lineHeight: 1.2 }}>{fr.quote ? typed(f, fr.at, fr.label, 1.6) : fr.label}</div>
        </div>
      ) : null}
      {/* depois disso, nada: a fita de memória passa no leitor e os quadros seguintes estão vazios; as perguntas viram
          buscas que varrem a fita e voltam sem resultado */}
      {isStatic ? <MemSearch f={f} t0={nadaAt} qs={qs} last={frags[frags.length - 1]} /> : null}
      {/* o Eli: em troca de quê? */}
      {eli ? (
        <div style={{ position: "absolute", left: 160, bottom: 210, fontFamily: MONO, textShadow: "0 4px 24px #000" }}>
          <div style={{ fontSize: 22, letterSpacing: 6, color: CREAM, opacity: P(f, eliAt, 10) }}>O G-MAN DEVOLVEU A FILHA DELE.</div>
          <div style={{ fontSize: 96, letterSpacing: 6, color: RED, opacity: P(f, tradeAt, 8), transform: `scale(${1 + (1 - P(f, tradeAt, 8)) * 0.3})`, transformOrigin: "0 50%" }}>EM TROCA DE QUÊ?</div>
        </div>
      ) : null}
      {/* linha do tempo da memória */}
      {!eli ? (
        <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, pointerEvents: "none" }}>
          <div style={{ position: "absolute", left: TL.x, top: TL.y, width: TL.w * 0.5, height: 3, background: "rgba(159,230,255,0.55)" }} />
          <div style={{ position: "absolute", left: TL.x + TL.w * 0.5, top: TL.y, width: TL.w * 0.5 * tear + (isStatic ? TL.w * 0.5 : 0), maxWidth: TL.w * 0.5, height: 3, background: `repeating-linear-gradient(90deg, ${RED} 0 14px, transparent 14px 22px)` }} />
          {frags.map((q, i) => (
            <div key={i} style={{ position: "absolute", left: mx(i) - 7, top: TL.y - 6, width: 14, height: 14, borderRadius: 7, background: f >= q.at ? ICE : "transparent", border: `2px solid ${ICE}` }} />
          ))}
          <div style={{ position: "absolute", left: head - 1, top: TL.y - 16, width: 3, height: 34, background: isStatic ? RED : CREAM, boxShadow: `0 0 12px ${isStatic ? RED : CREAM}` }} />
          <div style={{ position: "absolute", left: TL.x, top: TL.y + 14, fontFamily: MONO, fontSize: 15, letterSpacing: 4, color: ICE, opacity: 0.6 }}>CITY 17</div>
          <div style={{ position: "absolute", left: TL.x + TL.w * 0.5 + 10, top: TL.y + 14, fontFamily: MONO, fontSize: 15, letterSpacing: 4, color: RED, opacity: tear }}>INTERVALO · SEM DADOS</div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ============================================================================================ 4b) a Alyx estranha (imagem real)
// imagem real da Alyx (HL2/Ep2/Alyx) com marcações do HEV: normal (quente) → anomalias (a cor sai) → a porta: a mira
// trava no que ela olhou, contagem −1,0 s e a batida (tranco + clarão) → o nariz: alerta vermelho no rosto → a noite:
// ela acorda (azul-escuro) e a frase entra em vermelho, palavra por palavra → a resposta → que porta? por que "ainda"?
const CL1C = "videos/hl3_M01_1C/clips/";
const CL3C = "videos/hl3_M01_3C/clips/";
export const HLAlyxSigns: React.FC<{ life: number; normalAt?: number; anomAt?: number; doorAt?: number; reactAt?: number; bangAt?: number; noseAt?: number; nightAt?: number; line?: { w: string; at: number }[]; replyAt?: number; doorQAt?: number; openQAt?: number }> = ({
  life,
  normalAt = 0,
  anomAt = 1e9,
  doorAt = 1e9,
  reactAt = 1e9,
  bangAt = 1e9,
  noseAt = 1e9,
  nightAt = 1e9,
  line = [],
  replyAt = 1e9,
  doorQAt = 1e9,
  openQAt = 1e9,
}) => {
  const f = useCurrentFrame();
  void life;
  void reactAt;
  const mid = Math.round((normalAt + anomAt) / 2);
  const wakeEnd = (line[line.length - 1]?.at ?? nightAt + 90) + 20;
  // qual imagem está na tela
  let shot: { src: string; from: number; rate: number; key: string };
  if (f < mid) shot = { src: CL1C + "alyx_bme_a.mp4", from: Math.max(0, 17.6 - mid / 30), rate: 1, key: "a" }; // termina no close dela
  else if (f < anomAt) shot = { src: CL1C + "hl2_dog_fetch.mp4", from: 0.3, rate: 0.7, key: "b" };
  else if (f < doorAt) shot = { src: CL1C + "alyx_bme_b.mp4", from: 9.6, rate: 0.25, key: "b2" };
  else if (f < noseAt) shot = { src: CL1C + "alyx_porta.mp4", from: 0, rate: 0.55, key: "c" };
  else if (f < nightAt) shot = { src: CL3C + "ep2_alyx_acorda.mp4", from: 0.2, rate: 0.4, key: "d" };
  else if (f < wakeEnd) shot = { src: CL3C + "ep2_alyx_acorda.mp4", from: 0.0, rate: 0.6, key: "e" };
  else shot = { src: CL3C + "ep2_alyx_levanta.mp4", from: 0, rate: 0.3, key: "g" };
  const anom = P(f, anomAt, 20);
  const night = P(f, nightAt, 14);
  // a batida: tranco + clarão
  const bd = f - bangAt;
  const shake = bd >= 0 && bd < 10 ? (1 - bd / 10) * 26 : 0;
  const flash = interpolate(f, [bangAt, bangAt + 1, bangAt + 8], [0, 0.55, 0], C);
  const glitchK = f >= anomAt && f < anomAt + 8 ? 1 - (f - anomAt) / 8 : 0;
  const dim = f >= wakeEnd ? 0.6 * P(f, wakeEnd, 20) : 0;
  const filter = `saturate(${1.15 - 0.85 * anom}) brightness(${(1 - 0.45 * night) * (1 - 0.55 * dim)}) contrast(${1 + 0.15 * anom}) hue-rotate(${night * 25}deg)`;
  const lock = P(f, doorAt + 4, 10);
  const cnt = Math.max(0, (bangAt - f) / 30);
  return (
    <AbsoluteFill style={{ background: "#020304" }}>
      <AbsoluteFill style={{ filter, transform: `translate(${shake ? (rnd(f * 3) - 0.5) * shake : 0}px, ${shake ? (rnd(f * 5) - 0.5) * shake * 0.6 : 0}px) translateX(${glitchK * (rnd(f) - 0.5) * 60}px) scale(${shot.key < "c" ? 1.2 : 1.04})`, transformOrigin: "50% 30%" }}>
        <Clip key={shot.key} src={shot.src} from={shot.from} rate={shot.rate} />
      </AbsoluteFill>
      {night > 0 ? <AbsoluteFill style={{ background: `rgba(6,14,40,${0.45 * night})`, mixBlendMode: "multiply" }} /> : null}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, transparent 50%, rgba(0,0,0,0.75) 100%)" }} />
      <AbsoluteFill style={{ background: "#fff3e2", opacity: flash }} />
      {/* HUD: observação */}
      <div style={{ position: "absolute", left: 70, top: 56, fontFamily: MONO, letterSpacing: 5, color: anom > 0.5 ? RED : AMB, textShadow: "0 2px 8px #000" }}>
        <div style={{ fontSize: 20 }}>H.E.V. · OBSERVAÇÃO · ALYX VANCE</div>
        <div style={{ fontSize: 16, opacity: 0.8 }}>{f < anomAt ? (f >= normalAt ? "COMPORTAMENTO · NORMAL" : "EXPEDIÇÃO · DIA 2") : f < nightAt ? "COMPORTAMENTO · ANÔMALO" : "NOITE · ACAMPAMENTO"}</div>
      </div>
      {f >= anomAt && f < nightAt ? (
        <div style={{ position: "absolute", right: 70, top: 56, fontFamily: MONO, fontSize: 18, letterSpacing: 4, color: RED, opacity: flickIn(f, anomAt), textShadow: "0 2px 8px #000" }}>
          ANOMALIA {f >= noseAt ? "02" : "01"}
        </div>
      ) : null}
      {/* a porta: a mira trava, contagem até a batida */}
      {f >= doorAt && f < noseAt ? (
        <>
          <div style={{ position: "absolute", left: 960 - 170 * (2 - lock), top: 470 - 220 * (2 - lock), width: 340 * (2 - lock), height: 440 * (2 - lock), border: `3px solid ${f >= bangAt ? RED : ICE}`, opacity: lock, boxShadow: `0 0 20px ${f >= bangAt ? RED : ICE}` }} />
          <div style={{ position: "absolute", left: 960 + 190, top: 270, fontFamily: MONO, color: f >= bangAt ? RED : ICE, letterSpacing: 4, textShadow: "0 2px 10px #000", opacity: lock }}>
            <div style={{ fontSize: 20 }}>{f >= bangAt ? "A PORTA BATE" : "ALYX OLHA PARA A PORTA"}</div>
            <div style={{ fontSize: 64, letterSpacing: 2 }}>{f >= bangAt ? "−1,0 s" : `T−${cnt.toFixed(1).replace(".", ",")} s`}</div>
            {f >= bangAt ? <div style={{ fontSize: 18, color: CREAM, opacity: flickIn(f, bangAt + 10) }}>ELA REAGIU ANTES DE ACONTECER</div> : null}
          </div>
        </>
      ) : null}
      {/* o nariz */}
      {f >= noseAt && f < nightAt ? (
        <div style={{ position: "absolute", left: 1080, top: 380, fontFamily: MONO, color: RED, letterSpacing: 4, textShadow: "0 2px 10px #000", opacity: flickIn(f, noseAt + 6) }}>
          <svg width={240} height={60} style={{ position: "absolute", left: -250, top: 30 }}>
            <line x1={0} y1={50} x2={240} y2={10} stroke={RED} strokeWidth={2} />
            <circle cx={0} cy={50} r={8} fill="none" stroke={RED} strokeWidth={3} />
          </svg>
          <div style={{ fontSize: 22 }}>HEMORRAGIA NASAL</div>
          <div style={{ fontSize: 17, color: CREAM, opacity: 0.85 }}>SEM CAUSA APARENTE</div>
        </div>
      ) : null}
      {/* a noite: a frase dela e a resposta */}
      {f >= nightAt ? (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 150, textAlign: "center", fontFamily: MONO }}>
          <div style={{ fontSize: 62, letterSpacing: 3, color: "#ffd2cc", textShadow: "0 0 26px rgba(255,93,77,0.6), 0 4px 20px #000", opacity: 1 - P(f, replyAt + 40, 14) }}>
            {line.map((w, i) => (f >= w.at ? <span key={i} style={{ opacity: flickIn(f, w.at) }}>{w.w} </span> : null))}
          </div>
          {f >= replyAt ? <div style={{ marginTop: 18, fontSize: 32, letterSpacing: 2, color: CREAM, opacity: P(f, replyAt, 12) * (1 - P(f, doorQAt - 6, 12)), textShadow: "0 4px 20px #000" }}>“Eu não sei, Gordon. Eu não sei o que está acontecendo.”</div> : null}
          <div style={{ marginTop: 10, display: "flex", gap: 60, justifyContent: "center", fontSize: 44, letterSpacing: 4 }}>
            {f >= doorQAt ? <span style={{ color: AMB, opacity: flickIn(f, doorQAt), textShadow: "0 4px 20px #000" }}>QUE PORTA?</span> : null}
            {f >= openQAt ? <span style={{ color: RED, opacity: flickIn(f, openQAt), textShadow: "0 4px 20px #000" }}>POR QUE “AINDA”?</span> : null}
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ============================================================================================ 1b) o reencontro (imagem real)
// a Alyx se levanta (Ep2) → "cadê o meu pai?" → o Eli (vivo, final do Alyx) → no abraço a imagem quase para e
// acende → os dois relógios do HEV: o dele conta até 72 h (3 DIAS); o dela dispara (anos, séculos, milhares, milhões de
// anos), engasga em glitch e é CORRIGIDO para 00:00:00, com um "INCONSISTÊNCIA" vermelho que some (a pista).
const fmtYears = (y: number) => {
  if (y < 1 / 365) return `${String(Math.floor(y * 365 * 24 * 3600) % 60).padStart(2, "0")} s`;
  if (y < 1) return `${Math.floor(y * 365)} DIAS`;
  if (y < 1e6) return `${Math.floor(y).toLocaleString("pt-BR")} ANOS`;
  return `${(y / 1e6).toFixed(1).replace(".", ",")} MILHÕES DE ANOS`;
};
export const HLReunionReal: React.FC<{ life: number; askAt?: number; eliAt?: number; hugAt?: number; eliClockAt?: number; daysAt?: number; alyxClockAt?: number; zeroAt?: number; srcs?: string[] }> = ({
  life,
  askAt = 1e9,
  eliAt = 1e9,
  hugAt = 1e9,
  eliClockAt = 1e9,
  daysAt = 1e9,
  alyxClockAt = 1e9,
  zeroAt = 1e9,
}) => {
  const f = useCurrentFrame();
  void life;
  const shot = f < eliAt ? { src: "videos/hl3_M01_1C/clips/alyx_bme_a.mp4", from: 11, rate: 1, k: "a" } : { src: "videos/hl3_M01_1A2/clips/alyx_eli_vivo.mp4", from: 1.0, rate: f < hugAt ? 0.6 : 0.15, k: "b" };
  const hug = P(f, hugAt, 16);
  const clocks = P(f, eliClockAt, 14);
  const hours = interpolate(f, [eliClockAt, daysAt], [0, 72], { ...C, easing: Easing.inOut(Easing.quad) });
  // o relógio dela: sobe exponencial de 1 s a 4,7 milhões de anos até pouco antes do zero, engasga e corrige
  const spinEnd = zeroAt - 8;
  const t = interpolate(f, [alyxClockAt, spinEnd], [0, 1], C);
  const years = (1 / (365 * 24 * 3600)) * Math.pow(4.7e6 * 365 * 24 * 3600, t);
  const glitching = f >= spinEnd && f < zeroAt;
  const corrected = f >= zeroAt;
  const inc = corrected ? interpolate(f, [zeroAt, zeroAt + 4, zeroAt + 26, zeroAt + 40], [0, 1, 1, 0], C) : 0;
  const jx = glitching ? (rnd(f * 3) - 0.5) * 40 : 0;
  return (
    <AbsoluteFill style={{ background: "#020304" }}>
      <AbsoluteFill style={{ filter: `saturate(${0.9 - 0.5 * clocks}) brightness(${(1 + 0.25 * hug * (1 - clocks)) * (1 - 0.55 * clocks)}) blur(${clocks * 4}px)`, transform: `scale(${(shot.k === "a" ? 1.28 : 1.05) + hug * 0.06})`, transformOrigin: shot.k === "a" ? "50% 22%" : "50% 50%" }}>
        <Clip key={shot.k} src={shot.src} from={shot.from} rate={shot.rate} />
      </AbsoluteFill>
      {/* brilho do abraço */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, rgba(255,226,176,0.35), transparent 60%)", opacity: hug * (1 - clocks) }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, transparent 45%, rgba(0,0,0,0.8) 100%)" }} />
      {/* a pergunta dela, como legenda de rádio */}
      {f >= askAt && f < eliAt + 10 ? (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 170, textAlign: "center", fontFamily: MONO, fontSize: 40, letterSpacing: 2, color: CREAM, textShadow: "0 4px 20px #000", opacity: P(f, askAt, 8) * (1 - P(f, eliAt, 10)) }}>
          — Cadê o meu pai?
        </div>
      ) : null}
      {f >= eliAt && clocks < 1 ? (
        <div style={{ position: "absolute", left: 70, top: 56, fontFamily: MONO, fontSize: 20, letterSpacing: 6, color: AMB, opacity: P(f, eliAt, 10) * (1 - clocks), textShadow: "0 2px 8px #000" }}>
          WHITE FOREST · ELI VANCE ENCONTRA A FILHA
        </div>
      ) : null}
      {/* os dois relógios */}
      {clocks > 0 ? (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 120, opacity: clocks }}>
          <div style={{ textAlign: "center", fontFamily: MONO }}>
            <div style={{ fontSize: 20, letterSpacing: 6, color: AMB, opacity: 0.85 }}>PARA O ELI · ELA SUMIU HÁ</div>
            <div style={{ fontSize: 96, letterSpacing: 4, color: f >= daysAt ? CREAM : AMB, textShadow: "0 0 30px rgba(255,178,46,0.35)" }}>{f >= daysAt ? "3 DIAS" : `${String(Math.floor(hours)).padStart(2, "0")} h`}</div>
          </div>
          <div style={{ width: 2, height: 220, background: "rgba(255,255,255,0.2)" }} />
          <div style={{ textAlign: "center", fontFamily: MONO, opacity: P(f, alyxClockAt, 8), transform: `translateX(${jx}px)` }}>
            <div style={{ fontSize: 20, letterSpacing: 6, color: ICE, opacity: 0.85 }}>PARA ELA · TEMPO QUE PASSOU</div>
            <div style={{ fontSize: corrected ? 96 : 76, letterSpacing: 3, color: corrected ? ICE : glitching ? RED : ICE, textShadow: glitching ? `${(rnd(f) - 0.5) * 16}px 0 0 rgba(255,0,60,0.8), ${(rnd(f + 3) - 0.5) * 16}px 0 0 rgba(0,200,255,0.8)` : "0 0 30px rgba(159,230,255,0.35)", minWidth: 760 }}>
              {corrected ? "00:00:00" : fmtYears(years)}
            </div>
            <div style={{ height: 40, marginTop: 6, fontSize: 22, letterSpacing: 6, color: RED, opacity: inc }}>INCONSISTÊNCIA · REGISTRO CORRIGIDO</div>
          </div>
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};

// ============================================================================================ 1c) o reencontro no visor do HEV
// visor do traje (neve caindo, cantos do visor): um radar de proximidade com o Gordon no centro; a Alyx (escoltada)
// segue para o grupo e a distância cai; o áudio "cadê o meu pai?" é captado (onda de voz); o Eli sai do grupo e corre
// até ela; no abraço, um cronômetro CONTATO conta enquanto ele demora para soltar, com o batimento do Eli subindo;
// depois o radar recua e entram os dois relógios (3 DIAS × o dela, que dispara e é corrigido para 00:00:00).
export const HLReunionHev: React.FC<{ life: number; askAt?: number; eliAt?: number; hugAt?: number; eliClockAt?: number; daysAt?: number; alyxClockAt?: number; zeroAt?: number }> = ({
  life,
  askAt = 1e9,
  eliAt = 1e9,
  hugAt = 1e9,
  eliClockAt = 1e9,
  daysAt = 1e9,
  alyxClockAt = 1e9,
  zeroAt = 1e9,
}) => {
  const f = useCurrentFrame();
  void life;
  const clocks = P(f, eliClockAt, 18);
  const R = 420; // raio do radar
  const CX = 760;
  const CY = 560;
  // posições no radar (px relativos ao centro): grupo no alto; a Alyx vem de baixo com o Gordon e sobe até perto do grupo
  const GROUP = { x: 60, y: -290 };
  const walk = interpolate(f, [0, hugAt], [0, 1], { ...C, easing: Easing.inOut(Easing.quad) });
  const alyx = { x: -90 + 90 * walk, y: 220 - 380 * walk };
  const eliRun = interpolate(f, [eliAt, hugAt], [0, 1], { ...C, easing: Easing.in(Easing.quad) });
  const eli = { x: GROUP.x + (alyx.x + 18 - GROUP.x) * eliRun, y: GROUP.y + (alyx.y - 6 - GROUP.y) * eliRun };
  const dist = Math.max(0, Math.round(interpolate(f, [0, hugAt], [140, 0], C)));
  const sweep = (f * 4) % 360;
  const hugT = Math.max(0, f - hugAt) / 30;
  const bpm = Math.round(interpolate(f, [eliAt, hugAt, hugAt + 60], [78, 118, 136], C));
  const ask = P(f, askAt, 8) * (1 - P(f, eliAt + 20, 12));
  // relógio dela
  const spinEnd = zeroAt - 8;
  const t = interpolate(f, [alyxClockAt, spinEnd], [0, 1], C);
  const years = (1 / (365 * 24 * 3600)) * Math.pow(4.7e6 * 365 * 24 * 3600, t);
  const glitching = f >= spinEnd && f < zeroAt;
  const corrected = f >= zeroAt;
  const inc = corrected ? interpolate(f, [zeroAt, zeroAt + 4, zeroAt + 26, zeroAt + 40], [0, 1, 1, 0], C) : 0;
  const hours = interpolate(f, [eliClockAt, daysAt], [0, 72], { ...C, easing: Easing.inOut(Easing.quad) });
  const blip = (p: { x: number; y: number }, c: string, label: string, o = 1, big = false, left = false) => (
    <g transform={`translate(${p.x} ${p.y})`} opacity={o}>
      <circle r={big ? 14 : 10} fill={c} opacity={0.9} />
      <circle r={(big ? 14 : 10) + 8 + 6 * Math.sin(f / 5)} fill="none" stroke={c} strokeWidth={2} opacity={0.4} />
      <text x={left ? -24 : 22} y={6} textAnchor={left ? "end" : "start"} fill={c} fontFamily={MONO} fontSize={26} letterSpacing={3}>
        {label}
      </text>
    </g>
  );
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, #0d1a22 0%, #04080b 75%)", overflow: "hidden" }}>
      {/* neve no visor */}
      {Array.from({ length: 90 }).map((_, i) => {
        const x = (rnd(i * 3.3) * 2000 + Math.sin((f + i * 17) / 40) * 30) % 1920;
        const y = (rnd(i * 7.1) * 1080 + f * (1.2 + rnd(i) * 2.2)) % 1080;
        return <div key={i} style={{ position: "absolute", left: x, top: y, width: 2 + rnd(i * 5) * 3, height: 2 + rnd(i * 5) * 3, borderRadius: 3, background: "rgba(220,240,255,0.55)" }} />;
      })}
      {/* radar */}
      <AbsoluteFill style={{ transform: `translate(${-420 * clocks}px, ${-40 * clocks}px) scale(${1 - 0.45 * clocks})`, opacity: 1 - 0.35 * clocks }}>
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          <g transform={`translate(${CX} ${CY})`}>
            {[1, 0.66, 0.33].map((k) => (
              <circle key={k} r={R * k} fill="none" stroke="rgba(255,178,46,0.25)" strokeWidth={2} />
            ))}
            <line x1={-R} x2={R} y1={0} y2={0} stroke="rgba(255,178,46,0.15)" />
            <line y1={-R} y2={R} x1={0} x2={0} stroke="rgba(255,178,46,0.15)" />
            <path d={`M 0 0 L ${R * Math.cos((sweep * Math.PI) / 180)} ${R * Math.sin((sweep * Math.PI) / 180)} A ${R} ${R} 0 0 0 ${R * Math.cos(((sweep - 40) * Math.PI) / 180)} ${R * Math.sin(((sweep - 40) * Math.PI) / 180)} Z`} fill="rgba(255,178,46,0.12)" />
            {/* o grupo (λ) */}
            {[[0, -330], [60, -355], [120, -310], [150, -270], [20, -260], [-40, -300]].map(([x, y], i) => (
              <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="central" fill={AMB} fontFamily={MONO} fontSize={22} opacity={0.75}>
                λ
              </text>
            ))}
            <text x={GROUP.x} y={-395} textAnchor="middle" fill={AMB} fontFamily={MONO} fontSize={18} letterSpacing={4} opacity={0.8}>
              GRUPO
            </text>
            {/* Gordon (centro, quem escolta) */}
            <path d="M 0 -14 L 11 9 L -11 9 Z" fill={AMB} />
            <circle r={24 + 4 * Math.sin(f / 6)} fill="none" stroke={AMB} strokeWidth={1.5} opacity={0.5} />
            <text x={0} y={44} textAnchor="middle" fill={AMB} fontFamily={MONO} fontSize={22} letterSpacing={3}>
              GORDON
            </text>
            {blip(alyx, ICE, f >= hugAt ? "" : "ALYX", 1, true)}
            {f >= eliAt ? blip(eli, "#ffd9a0", f >= hugAt ? "" : "ELI", P(f, eliAt, 8), true, true) : null}
            {f >= hugAt ? (
              <text x={(alyx.x + eli.x) / 2} y={(alyx.y + eli.y) / 2 - 62} textAnchor="middle" fill={CREAM} fontFamily={MONO} fontSize={22} letterSpacing={4} opacity={P(f, hugAt, 8)}>
                ELI + ALYX
              </text>
            ) : null}
            {f >= hugAt ? <circle cx={(alyx.x + eli.x) / 2} cy={(alyx.y + eli.y) / 2} r={40 + 30 * Math.sin(f / 6)} fill="rgba(255,217,160,0.12)" stroke="rgba(255,217,160,0.5)" strokeWidth={2} /> : null}
          </g>
        </svg>
      </AbsoluteFill>
      {/* HUD do visor */}
      <div style={{ position: "absolute", left: 70, top: 56, fontFamily: MONO, color: AMB, letterSpacing: 5, opacity: 1 - clocks }}>
        <div style={{ fontSize: 24 }}>H.E.V. · ESCOLTA · ALYX VANCE</div>
        <div style={{ fontSize: 20, opacity: 0.75 }}>ACAMPAMENTO DA RESISTÊNCIA · {dist} m</div>
      </div>
      {/* o áudio captado */}
      {ask > 0.01 ? (
        <div style={{ position: "absolute", left: 1300, top: 330, width: 540, fontFamily: MONO, opacity: ask }}>
          <div style={{ fontSize: 16, letterSpacing: 4, color: ICE, opacity: 0.8 }}>ÁUDIO CAPTADO · ALYX</div>
          <svg width={470} height={60} style={{ display: "block", margin: "6px 0" }}>
            {Array.from({ length: 58 }).map((_, i) => {
              const h = 6 + 46 * Math.abs(Math.sin(i * 0.7 + f * 0.5)) * rnd(i + Math.floor(f / 2)) * (f < askAt + 40 ? 1 : 0.15);
              return <rect key={i} x={i * 8} y={30 - h / 2} width={4} height={h} fill={ICE} opacity={0.8} />;
            })}
          </svg>
          <div style={{ fontSize: 46, color: CREAM }}>“Cadê o meu pai?”</div>
        </div>
      ) : null}
      {/* o abraço: os dois batimentos lado a lado — o do Eli disparado, o dela calmo */}
      {f >= hugAt && clocks < 1 ? (
        <div style={{ position: "absolute", left: 1260, top: 330, width: 580, fontFamily: MONO, opacity: P(f, hugAt, 10) * (1 - clocks) }}>
          <div style={{ fontSize: 18, letterSpacing: 5, color: "#ffd9a0", marginBottom: 18 }}>CONTATO · BATIMENTOS</div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22, letterSpacing: 4, color: RED }}><span>ELI</span><span>{bpm} BPM</span></div>
          <Ecg f={f} bpm={bpm} jitter={0.6} col={RED} w={580} h={90} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22, letterSpacing: 4, color: ICE, marginTop: 20 }}><span>ALYX</span><span>72 BPM</span></div>
          <Ecg f={f} bpm={72} jitter={0} col={ICE} w={580} h={90} />
        </div>
      ) : null}
      {/* cantos do visor */}
      {[[40, 40, 1, 1], [1880, 40, -1, 1], [40, 1040, 1, -1], [1880, 1040, -1, -1]].map(([x, y, sx, sy], i) => (
        <div key={i} style={{ position: "absolute", left: x - (sx < 0 ? 60 : 0), top: y - (sy < 0 ? 60 : 0), width: 60, height: 60, borderLeft: sx > 0 ? `3px solid ${AMB}` : undefined, borderRight: sx < 0 ? `3px solid ${AMB}` : undefined, borderTop: sy > 0 ? `3px solid ${AMB}` : undefined, borderBottom: sy < 0 ? `3px solid ${AMB}` : undefined, opacity: 0.5 }} />
      ))}
      {/* os dois relógios */}
      {clocks > 0 ? (
        <div style={{ position: "absolute", left: 640, top: 400, width: 1240, display: "flex", gap: 80, alignItems: "flex-start", opacity: clocks }}>
          <div style={{ fontFamily: MONO }}>
            <div style={{ fontSize: 20, letterSpacing: 6, color: AMB, opacity: 0.85 }}>PARA O ELI · ELA SUMIU HÁ</div>
            <div style={{ fontSize: 120, letterSpacing: 4, color: f >= daysAt ? CREAM : AMB }}>{f >= daysAt ? "3 DIAS" : `${String(Math.floor(hours)).padStart(2, "0")} h`}</div>
          </div>
          <div style={{ fontFamily: MONO, opacity: P(f, alyxClockAt, 8), transform: `translateX(${glitching ? (rnd(f * 3) - 0.5) * 40 : 0}px)` }}>
            <div style={{ fontSize: 20, letterSpacing: 6, color: ICE, opacity: 0.85 }}>PARA ELA · TEMPO QUE PASSOU</div>
            <div style={{ fontSize: corrected ? 120 : 76, letterSpacing: 3, color: glitching ? RED : ICE, textShadow: glitching ? `${(rnd(f) - 0.5) * 16}px 0 0 rgba(255,0,60,0.8), ${(rnd(f + 3) - 0.5) * 16}px 0 0 rgba(0,200,255,0.8)` : "0 0 30px rgba(159,230,255,0.35)", minWidth: 640, lineHeight: 1.4 }}>
              {corrected ? "00:00:00" : fmtYears(years)}
            </div>
            <div style={{ height: 34, fontSize: 20, letterSpacing: 6, color: RED, opacity: inc }}>INCONSISTÊNCIA · REGISTRO CORRIGIDO</div>
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ============================================================================================ 3C' · comboio + helicóptero
// carta de terreno 2D (mesma família da carta náutica): White Forest nas montanhas embaixo; o comboio (caminhões e
// carros, com o Dog e os Vortigaunts) sobe a estrada rumo ao norte; o helicóptero sai depois, alcança a coluna e começa
// a passar; falha (fumaça, oscila, alarmes do HEV), cai ao lado da estrada: POUSO FORÇADO, a coluna para. No fim a câmera
// recua e mostra o caminho que sobra: terra até o litoral e, de lá, o gelo.
const RD: [number, number][] = [
  [700, 2950], [760, 2700], [700, 2450], [820, 2220], [960, 2000], [900, 1760], [1040, 1520], [1120, 1260], [1060, 1000], [1180, 760], [1240, 520],
];
const rdLen = (() => {
  const L = [0];
  for (let i = 1; i < RD.length; i++) L.push(L[i - 1] + Math.hypot(RD[i][0] - RD[i - 1][0], RD[i][1] - RD[i - 1][1]));
  return L;
})();
const rdAt = (u: number) => {
  const s = Math.max(0, Math.min(1, u)) * rdLen[rdLen.length - 1];
  let i = 1;
  while (i < rdLen.length - 1 && rdLen[i] < s) i++;
  const t = (s - rdLen[i - 1]) / (rdLen[i] - rdLen[i - 1]);
  return { x: RD[i - 1][0] + (RD[i][0] - RD[i - 1][0]) * t, y: RD[i - 1][1] + (RD[i][1] - RD[i - 1][1]) * t, a: Math.atan2(RD[i][1] - RD[i - 1][1], RD[i][0] - RD[i - 1][0]) };
};
type Man = { k: string; v: string; at: number; key?: boolean };
export const HLHeliRoute: React.FC<{ life: number; manifest?: Man[]; heliAt?: number; passAt?: number; failAt?: number; altAt?: number; crashAt?: number; stopAt?: number; routeAt?: number }> = ({
  life,
  manifest = [],
  heliAt = 1e9,
  passAt = 1e9,
  failAt = 1e9,
  altAt = 1e9,
  crashAt = 1e9,
  stopAt = 1e9,
  routeAt = 1e9,
}) => {
  const f = useCurrentFrame();
  void life;
  // o comboio anda devagar e para quando o helicóptero cai
  const convU = (ff: number) => 0.05 + Math.min(ff, stopAt + 10) * 0.00055;
  const cu = convU(f);
  const vehicles = Array.from({ length: 7 }).map((_, i) => ({ u: cu - i * 0.038, kind: i % 3 === 1 ? "car" : "truck", i }));
  // o helicóptero: sai de White Forest, alcança a coluna (passAt), passa um pouco e cai ao lado
  const crashU = cu + 0.025;
  const hu = f < heliAt ? -1 : interpolate(f, [heliAt, passAt, failAt], [0.0, cu - 0.02, cu + 0.015], { ...C, easing: Easing.out(Easing.quad) });
  const falling = f >= failAt && f < crashAt;
  const fu = f < crashAt ? interpolate(f, [failAt, crashAt], [cu + 0.015, crashU], C) : crashU;
  const hp = rdAt(f >= failAt ? fu : hu);
  const side = interpolate(f, [failAt, crashAt], [0, 70], { ...C, easing: Easing.in(Easing.quad) });
  const wob = falling ? Math.sin(f * 0.9) * 22 * interpolate(f, [failAt, crashAt], [0.3, 1], C) : 0;
  const heliX = hp.x + side + (f >= crashAt ? 70 : 0);
  const heliY = hp.y;
  const crashed = f >= crashAt;
  // câmera: segue o comboio; no fim recua para mostrar o caminho até o gelo
  const back = P(f, routeAt, 40);
  const follow = rdAt(cu);
  // segue o comboio; quando o helicóptero sai, a câmera corre até White Forest e passa a seguir o helicóptero
  const toHeli = P(f, heliAt - 6, 24);
  const tgtX = follow.x + (heliX - follow.x) * toHeli;
  const tgtY = follow.y - 120 + (heliY - (follow.y - 120)) * toHeli;
  const camY = tgtY * (1 - back) + -600 * back;
  const camX = tgtX * (1 - back) + 1150 * back;
  const zoom = 1.25 * (1 - back) + 0.36 * back;
  const smoke: { x: number; y: number; r: number; o: number }[] = [];
  if (f >= failAt) for (let k = 0; k < 14; k++) {
    const age = ((f - failAt) * 0.6 + k * 3) % 42;
    smoke.push({ x: heliX - 8 + Math.sin(k * 1.7 + f / 9) * 10 - age * 1.4, y: heliY - age * 2.2, r: 8 + age * 0.9, o: (1 - age / 42) * 0.5 });
  }
  const alarm = falling ? (Math.floor(f / 6) % 2 ? 1 : 0.35) : 0;
  const alt = Math.round(f < failAt ? 420 : f < crashAt ? interpolate(f, [failAt, crashAt], [420, 0], { ...C, easing: Easing.in(Easing.quad) }) : 0);
  const shake = f >= crashAt && f < crashAt + 10 ? (1 - (f - crashAt) / 10) * 18 : 0;
  return (
    <AbsoluteFill style={{ background: "#0b1410", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `translate(${(rnd(f) - 0.5) * shake}px, ${(rnd(f + 3) - 0.5) * shake}px) scale(${zoom}) translate(${960 - camX}px, ${540 - camY}px)`, transformOrigin: "960px 540px" }}>
        <svg width={1920} height={3300} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <rect x={-4000} y={-6000} width={10000} height={11000} fill="#16241b" />
          {/* mar ártico ao norte (longe: ~1.900 km de estrada) e o gelo: litoral recortado, placas irregulares */}
          <path d={`M -4000 -5000 L 6000 -5000 L 6000 -1650 ${Array.from({ length: 40 }).map((_, k) => `L ${6000 - k * 250} ${-1650 + (rnd(k * 4.1) - 0.5) * 140}`).join(" ")} L -4000 -1650 Z`} fill="#0d2230" />
          <path d={`M -4000 -5000 L 6000 -5000 L 6000 -2350 ${Array.from({ length: 40 }).map((_, k) => `L ${6000 - k * 250} ${-2350 + (rnd(k * 7.3) - 0.5) * 220}`).join(" ")} L -4000 -2350 Z`} fill="#dbe9f2" opacity={0.92} />
          {Array.from({ length: 70 }).map((_, i) => {
            const cx = -1500 + rnd(i * 3.3) * 5000;
            const cy = -2250 + rnd(i * 7.7) * 520;
            const r = 30 + rnd(i) * 90;
            return <path key={`ic${i}`} d={floePath(cx, cy, r, i + 300)} fill="rgba(219,233,242,0.78)" stroke="rgba(159,230,255,0.55)" strokeWidth={3} />;
          })}
          <text x={1300} y={-1560} fill="#9fe6ff" fontFamily={MONO} fontSize={60} letterSpacing={10} opacity={back}>LITORAL</text>
          <text x={1300} y={-2520} fill="#0d2230" fontFamily={MONO} fontSize={60} letterSpacing={10} opacity={back}>GELO · ÁRTICO</text>
          <text x={1340} y={-300} fill={AMB} fontFamily={MONO} fontSize={52} letterSpacing={8} opacity={back}>≈ 1.900 km POR TERRA</text>
          {/* curvas de nível e floresta */}
          {Array.from({ length: 40 }).map((_, i) => (
            <path key={`cn${i}`} d={`M -2000 ${-1500 + i * 120} C 0 ${-1530 + i * 120 + Math.sin(i) * 60} 1200 ${-1460 + i * 120 - Math.cos(i) * 50} 4000 ${-1500 + i * 120}`} fill="none" stroke="rgba(141,255,168,0.07)" strokeWidth={2} />
          ))}
          {Array.from({ length: 320 }).map((_, i) => {
            const x = -1500 + rnd(i * 9.1) * 5000;
            const y = -1550 + rnd(i * 2.7) * 4750;
            if (Math.abs(x - rdAt((y > 2950 ? 0 : 1) * 0).x) < 0 ) return null;
            return <path key={`tr${i}`} d={`M ${x} ${y - 14} L ${x - 8} ${y + 6} L ${x + 8} ${y + 6} Z`} fill="rgba(141,255,168,0.18)" />;
          })}
          {/* montanhas e White Forest */}
          {[[420, 3080, 240], [1180, 3120, 280], [820, 3200, 200]].map(([x, y, s], i) => (
            <path key={`mt${i}`} d={`M ${x - s} ${y + s * 0.5} L ${x} ${y - s * 0.6} L ${x + s} ${y + s * 0.5} Z`} fill="#24352b" stroke="rgba(141,255,168,0.25)" strokeWidth={2} />
          ))}
          <g transform="translate(700 2990)">
            <rect x={-34} y={-14} width={68} height={28} fill="#3a2a12" stroke={AMB} strokeWidth={2} />
            <text x={50} y={8} fill={AMB} fontFamily={MONO} fontSize={22} letterSpacing={4}>WHITE FOREST</text>
          </g>
          {/* a estrada */}
          <polyline points={RD.map((p) => p.join(",")).join(" ")} fill="none" stroke="rgba(30,24,16,0.9)" strokeWidth={22} strokeLinejoin="round" />
          <polyline points={RD.map((p) => p.join(",")).join(" ")} fill="none" stroke="rgba(255,226,176,0.35)" strokeWidth={2} strokeDasharray="12 12" />
          {/* o caminho que sobra (no fim): estrada até o litoral e, depois, a rota pelo gelo */}
          <polyline points={`1240,520 1180,200 1290,-200 1210,-650 1320,-1100 1240,-1500 1260,-1640`} fill="none" stroke={AMB} strokeWidth={14} strokeDasharray="34 24" opacity={back} />
          <polyline points={`1260,-1640 1180,-1900 1320,-2150 1240,-2450`} fill="none" stroke="#9fe6ff" strokeWidth={14} strokeDasharray="34 24" opacity={back} />
          {/* o comboio */}
          {vehicles.map((v) => {
            if (v.u < 0.02) return null;
            const q = rdAt(v.u);
            const isVort = v.i === 4;
            const isDog = v.i === 2;
            return (
              <g key={v.i} transform={`translate(${q.x} ${q.y}) rotate(${(q.a * 180) / Math.PI}) scale(1.5)`}>
                {v.kind === "truck" ? <rect x={-22} y={-9} width={44} height={18} rx={3} fill="#3a2a12" stroke={AMB} strokeWidth={2.5} /> : <rect x={-14} y={-8} width={28} height={16} rx={6} fill="#2c2418" stroke={AMB} strokeWidth={2} />}
                {isVort ? <circle cx={0} cy={0} r={6} fill={GREEN} /> : null}
                {isDog ? <circle cx={0} cy={0} r={6} fill={RED} /> : null}
              </g>
            );
          })}
          {/* rótulos do comboio */}
          {(() => {
            const q = rdAt(cu - 0.11);
            return (
              <g opacity={P(f, 6, 14) * (1 - back)}>
                <line x1={q.x + 30} y1={q.y} x2={q.x + 120} y2={q.y - 40} stroke={AMB} strokeWidth={1.5} />
                <text x={q.x + 126} y={q.y - 44} fill={AMB} fontFamily={MONO} fontSize={20} letterSpacing={4}>COMBOIO · {f >= stopAt ? "PARADO" : "RUMO NORTE"}</text>
              </g>
            );
          })()}
          {/* fumaça e o helicóptero */}
          {smoke.map((s, k) => (
            <circle key={`sm${k}`} cx={s.x} cy={s.y} r={s.r} fill="rgba(120,120,120,1)" opacity={s.o} />
          ))}
          {hu >= 0 || f >= failAt ? (
            <g transform={`translate(${heliX} ${heliY}) rotate(${(crashed ? 35 : ((hp.a * 180) / Math.PI) + wob)})`}>
              <ellipse cx={4} cy={0} rx={30} ry={13} fill="#2a2f35" stroke={crashed ? RED : CREAM} strokeWidth={2.5} />
              <path d="M -24 -4 L -78 -2 L -78 2 L -24 4 Z" fill="#2a2f35" stroke={crashed ? RED : CREAM} strokeWidth={2} />
              <path d="M -74 -2 L -86 -12 L -90 -12 L -84 -2 Z M -74 2 L -86 12 L -90 12 L -84 2 Z" fill="#2a2f35" stroke={crashed ? RED : CREAM} strokeWidth={1.6} />
              <g transform={`translate(-80 0) rotate(${crashed ? 20 : f * 80})`}>
                <line x1={-11} y1={0} x2={11} y2={0} stroke={CREAM} strokeWidth={2} opacity={0.8} />
              </g>
              {!crashed ? (
                <g transform={`rotate(${f * (falling ? 25 : 55)})`}>
                  <line x1={-46} y1={0} x2={46} y2={0} stroke={CREAM} strokeWidth={3} opacity={0.8} />
                  <line x1={0} y1={-46} x2={0} y2={46} stroke={CREAM} strokeWidth={3} opacity={0.8} />
                </g>
              ) : (
                <line x1={-40} y1={-20} x2={34} y2={18} stroke={CREAM} strokeWidth={3} opacity={0.7} />
              )}
            </g>
          ) : null}
          {/* POUSO FORÇADO */}
          {crashed ? (
            <g transform={`translate(${heliX} ${heliY})`} opacity={1 - back * 0.4}>
              {[0, 1, 2].map((k) => {
                const t = (((f - crashAt - k * 12) % 36) + 36) % 36 / 36;
                return <circle key={k} r={40 + t * 120} fill="none" stroke={RED} strokeWidth={2.5} opacity={(1 - t) * 0.7} />;
              })}
              <text x={70} y={-30} fill={RED} fontFamily={MONO} fontSize={26} letterSpacing={5} style={{ paintOrder: "stroke", stroke: "#000", strokeWidth: 5 }}>POUSO FORÇADO</text>
              <text x={70} y={-2} fill={CREAM} fontFamily={MONO} fontSize={18} letterSpacing={4} style={{ paintOrder: "stroke", stroke: "#000", strokeWidth: 4 }}>AO LADO DA ROTA DO COMBOIO</text>
            </g>
          ) : null}
        </svg>
      </AbsoluteFill>
      {/* HUD fixo */}
      <div style={{ position: "absolute", left: 70, top: 64, padding: "14px 20px", background: "rgba(3,6,10,0.82)", border: "1px solid rgba(255,178,46,0.35)", borderRadius: 8, fontFamily: MONO, color: AMB, letterSpacing: 5 }}>
        <div style={{ fontSize: 22 }}>RESISTÊNCIA · CARTA DE ROTA</div>
        <div style={{ fontSize: 17, opacity: 0.7 }}>{back > 0.5 ? "O CAMINHO QUE SOBRA" : "WHITE FOREST → NORTE"}</div>
      </div>
      {/* manifesto do comboio */}
      {manifest.length ? (
        <div style={{ position: "absolute", right: 70, top: 64, width: 380, padding: "14px 18px", background: "rgba(3,6,10,0.84)", border: "1px solid rgba(255,178,46,0.35)", borderRadius: 8, fontFamily: MONO, opacity: P(f, manifest[0].at - 4, 10) * (1 - P(f, heliAt + 30, 14)) }}>
          <div style={{ fontSize: 15, letterSpacing: 5, color: AMB, opacity: 0.75, marginBottom: 8 }}>COMBOIO 01 · CARGA</div>
          {manifest.map((m, i) =>
            f >= m.at ? (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 19, letterSpacing: 2, height: 32, alignItems: "center", opacity: flickIn(f, m.at) }}>
                <span style={{ color: CREAM }}>{m.k}</span>
                <span style={{ color: m.key ? GREEN : AMB }}>{m.v}</span>
              </div>
            ) : null,
          )}
        </div>
      ) : null}
      {/* HEV: o voo e a pane */}
      {f >= heliAt + 20 && back < 0.5 ? (
        <div style={{ position: "absolute", right: 70, top: 64, width: 380, padding: "14px 18px", background: falling || crashed ? "rgba(40,6,6,0.88)" : "rgba(3,6,10,0.84)", border: `1px solid ${falling || crashed ? RED : AMB}`, borderRadius: 8, fontFamily: MONO, opacity: P(f, heliAt + 20, 12) * (1 - back * 2) }}>
          <div style={{ fontSize: 15, letterSpacing: 5, color: falling || crashed ? RED : AMB, opacity: 0.9, marginBottom: 8 }}>H.E.V. · VOO · GORDON + ELI</div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 19, letterSpacing: 2, height: 32, alignItems: "center" }}>
            <span style={{ color: CREAM }}>ALTITUDE</span>
            <span style={{ color: falling || crashed ? RED : AMB }}>{alt} m</span>
          </div>
          {f >= failAt ? (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 19, letterSpacing: 2, height: 32, alignItems: "center", opacity: flickIn(f, failAt) }}>
              <span style={{ color: CREAM }}>ROTOR PRINCIPAL</span>
              <span style={{ color: RED, opacity: crashed ? 1 : alarm }}>FALHA</span>
            </div>
          ) : null}
          {f >= altAt ? (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 19, letterSpacing: 2, height: 32, alignItems: "center", opacity: flickIn(f, altAt) }}>
              <span style={{ color: CREAM }}>SUSTENTAÇÃO</span>
              <span style={{ color: RED }}>PERDIDA</span>
            </div>
          ) : null}
          {crashed ? (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 19, letterSpacing: 2, height: 32, alignItems: "center", opacity: flickIn(f, crashAt) }}>
              <span style={{ color: CREAM }}>AERONAVE</span>
              <span style={{ color: RED }}>INUTILIZADA</span>
            </div>
          ) : null}
        </div>
      ) : null}
      {/* alarme vermelho nas bordas durante a queda */}
      {falling ? <AbsoluteFill style={{ boxShadow: `inset 0 0 160px rgba(255,40,40,${0.45 * alarm})`, pointerEvents: "none" }} /> : null}
      <AbsoluteFill style={{ background: "#fff3e2", opacity: interpolate(f, [crashAt, crashAt + 1, crashAt + 10], [0, 0.6, 0], C), pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};

// ============================================================================================ 4B · a mina → dois problemas
// 1) a mina (corte lateral): pela superfície o caminho até o objetivo está bloqueado por uma fenda no gelo; a
// única passagem é a mina antiga por baixo. O grupo entra, atravessa os túneis tomados por criaturas de Xen e sai do
// outro lado, perto do objetivo; logo depois de sair, o sinal da Alyx cai: inconsciente
export const HLMineSection: React.FC<{ life: number; blockAt?: number; mineAt?: number; xenAt?: number; faintAt?: number }> = ({ life, blockAt = 8, mineAt = 18, xenAt = 1e9, faintAt = 1e9 }) => {
  const f = useCurrentFrame();
  void life;
  const SURF = 400; // linha do gelo
  const dy = (y: number) => SURF + (y - 300) * 1.45; // túneis mais fundos
  // caminho do grupo: superfície → boca da mina → túneis por baixo da fenda → poço de saída → superfície
  const PATH: [number, number][] = (
    [
      [190, 300], [430, 300], [470, 380], [560, 520], [760, 600], [980, 640], [1200, 610], [1380, 520], [1440, 400], [1470, 300], [1600, 300],
    ] as [number, number][]
  ).map(([x, y]) => [x, dy(y)]);
  const lens = PATH.slice(1).map((p, i) => Math.hypot(p[0] - PATH[i][0], p[1] - PATH[i][1]));
  const total = lens.reduce((a, b) => a + b, 0);
  const go = interpolate(f, [mineAt, faintAt - 6], [0, 1], { ...C, easing: Easing.inOut(Easing.sin) });
  let dist = go * total;
  let gx = PATH[PATH.length - 1][0];
  let gy = PATH[PATH.length - 1][1];
  for (let i = 0; i < lens.length; i++) {
    if (dist <= lens[i]) {
      const t = dist / lens[i];
      gx = PATH[i][0] + (PATH[i + 1][0] - PATH[i][0]) * t;
      gy = PATH[i][1] + (PATH[i + 1][1] - PATH[i][1]) * t;
      break;
    }
    dist -= lens[i];
  }
  const done = PATH.slice(0, 1).map((p) => p.join(",")).join(" ");
  void done;
  const block = P(f, blockAt, 8);
  const reroute = P(f, mineAt - 6, 10);
  const faint = f >= faintAt;
  const tunnelPts = PATH.map((p) => p.join(",")).join(" ");
  // trecho já percorrido (rastro âmbar)
  const trail: string[] = [];
  {
    let left = go * total;
    trail.push(PATH[0].join(","));
    for (let i = 0; i < lens.length && left > 0; i++) {
      const t = Math.min(1, left / lens[i]);
      trail.push(`${PATH[i][0] + (PATH[i + 1][0] - PATH[i][0]) * t},${PATH[i][1] + (PATH[i + 1][1] - PATH[i][1]) * t}`);
      left -= lens[i];
    }
  }
  const xen = [[640, 560], [860, 625], [1080, 650], [1290, 575], [760, 650], [1000, 600]].map(([x, y]) => [x, dy(y)]);
  const inMine = gy > SURF + 20;
  return (
    <AbsoluteFill style={{ background: "#05070a", overflow: "hidden" }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="mnRock" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1a1a1d" />
            <stop offset="100%" stopColor="#0a0a0c" />
          </linearGradient>
          <linearGradient id="mnIce" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#cfe6f2" />
            <stop offset="100%" stopColor="#7fa6b8" />
          </linearGradient>
          <radialGradient id="mnLamp">
            <stop offset="0%" stopColor="rgba(255,190,90,0.55)" />
            <stop offset="100%" stopColor="rgba(255,190,90,0)" />
          </radialGradient>
          <clipPath id="mnTun">
            <polyline points={tunnelPts} />
          </clipPath>
        </defs>
        {/* céu */}
        <rect x={0} y={0} width={1920} height={SURF} fill="#0b1820" />
        {/* rocha */}
        <rect x={0} y={SURF} width={1920} height={1080 - SURF} fill="url(#mnRock)" />
        {Array.from({ length: 12 }).map((_, i) => {
          const y = SURF + 70 + i * 62;
          let d = "";
          for (let x = 0; x <= 1920; x += 60) d += `${x === 0 ? "M" : "L"} ${x} ${(y + 14 * Math.sin(x / 170 + i * 1.3) + 6 * Math.sin(x / 41 + i)).toFixed(1)} `;
          return <path key={i} d={d} fill="none" stroke="rgba(255,178,46,0.07)" strokeWidth={2} />;
        })}
        {/* gelo na superfície, com a fenda no meio */}
        <path d={`M 0 ${SURF - 40} L 760 ${SURF - 44} L 860 ${SURF - 40} L 900 ${SURF + 210} L 940 ${SURF + 20} L 990 ${SURF + 260} L 1030 ${SURF - 36} L 1920 ${SURF - 40} L 1920 ${SURF + 8} L 1030 ${SURF + 8} L 990 ${SURF + 270} L 940 ${SURF + 30} L 900 ${SURF + 220} L 860 ${SURF + 8} L 0 ${SURF + 8} Z`} fill="url(#mnIce)" opacity={0.92} />
        <path d={`M 860 ${SURF - 40} L 900 ${SURF + 210} L 940 ${SURF + 20} L 990 ${SURF + 260} L 1030 ${SURF - 36} Z`} fill="#03070a" />
        {/* a rota pela superfície, bloqueada */}
        <line x1={260} y1={SURF - 70} x2={1540} y2={SURF - 70} stroke={AMB} strokeWidth={3} strokeDasharray="14 12" opacity={0.7 * (1 - 0.6 * block)} />
        <g opacity={block} transform={`translate(945 ${SURF - 110}) scale(${1 + (1 - block) * 0.6})`}>
          <line x1={-34} y1={-34} x2={34} y2={34} stroke={RED} strokeWidth={10} strokeLinecap="round" />
          <line x1={34} y1={-34} x2={-34} y2={34} stroke={RED} strokeWidth={10} strokeLinecap="round" />
        </g>
        <text x={945} y={SURF - 170} textAnchor="middle" fill={RED} fontFamily={MONO} fontSize={24} letterSpacing={5} opacity={block}>
          ROTA BLOQUEADA · FENDA NO GELO
        </text>
        {/* o túnel da mina */}
        <polyline points={tunnelPts} fill="none" stroke="#2a2218" strokeWidth={70} strokeLinejoin="round" strokeLinecap="round" opacity={0.35 + 0.65 * reroute} />
        <polyline points={tunnelPts} fill="none" stroke="#120e0a" strokeWidth={52} strokeLinejoin="round" strokeLinecap="round" opacity={0.35 + 0.65 * reroute} />
        {/* escoras de madeira */}
        {PATH.slice(2, 9).map(([x, y], i) => (
          <g key={i} opacity={0.6 * reroute}>
            <line x1={x - 18} y1={y - 26} x2={x - 18} y2={y + 26} stroke="#5b4630" strokeWidth={5} />
            <line x1={x + 18} y1={y - 26} x2={x + 18} y2={y + 26} stroke="#5b4630" strokeWidth={5} />
            <line x1={x - 24} y1={y - 26} x2={x + 24} y2={y - 26} stroke="#5b4630" strokeWidth={5} />
          </g>
        ))}
        <polyline points={tunnelPts} fill="none" stroke={AMB} strokeWidth={2} strokeDasharray="8 10" opacity={0.6 * reroute} />
        {/* criaturas de Xen nos túneis: vultos com brilho amarelado que reagem à luz */}
        {xen.map(([x, y], i) => {
          const a = P(f, xenAt + i * 3, 8);
          const near = Math.max(0, 1 - Math.hypot(gx - x, gy - y) / 260);
          return (
            <g key={i} transform={`translate(${x} ${y + 4 * Math.sin(f / 5 + i)})`} opacity={a}>
              <circle r={22 + 10 * near} fill={`rgba(190,255,90,${0.12 + 0.25 * near})`} />
              <circle r={5} fill="#d4ff6a" />
              <circle r={14 + 4 * Math.sin(f / 3 + i)} fill="none" stroke={RED} strokeWidth={2} opacity={0.8} />
            </g>
          );
        })}
        {/* rastro e o grupo com a luz das lanternas */}
        {go > 0 ? <polyline points={trail.join(" ")} fill="none" stroke={faint ? RED : AMB} strokeWidth={4} strokeLinejoin="round" /> : null}
        {inMine ? <circle cx={gx} cy={gy} r={150} fill="url(#mnLamp)" /> : null}
        <circle cx={gx} cy={gy} r={13} fill={faint ? RED : AMB} />
        <circle cx={gx} cy={gy} r={22 + 4 * Math.sin(f / 4)} fill="none" stroke={faint ? RED : AMB} strokeWidth={2} opacity={0.6} />
        {/* pontos fixos */}
        <g>
          <rect x={150} y={SURF - 70} width={70} height={30} fill="none" stroke={ICE} strokeWidth={2} />
          <text x={150} y={SURF - 84} fill={ICE} fontFamily={MONO} fontSize={18} letterSpacing={4}>ESTAÇÃO</text>
        </g>
        <g opacity={reroute}>
          <text x={430} y={SURF + 60} textAnchor="end" fill={AMB} fontFamily={MONO} fontSize={18} letterSpacing={4}>
            ENTRADA DA MINA
          </text>
          <text x={1500} y={SURF + 60} fill={AMB} fontFamily={MONO} fontSize={18} letterSpacing={4}>
            SAÍDA
          </text>
        </g>
        <g transform={`translate(1720 ${SURF - 40})`}>
          <circle r={14 + 10 * ((f % 40) / 40)} fill="none" stroke={GREEN} strokeWidth={2} opacity={1 - (f % 40) / 40} />
          <circle r={8} fill={GREEN} />
          <text x={0} y={-34} textAnchor="middle" fill={GREEN} fontFamily={MONO} fontSize={18} letterSpacing={4}>
            OBJETIVO · SINAL
          </text>
        </g>
        <text x={960} y={1000} textAnchor="middle" fill={AMB} fontFamily={MONO} fontSize={22} letterSpacing={5} opacity={reroute * (1 - P(f, xenAt, 10))}>
          ÚNICA PASSAGEM · MINA ANTIGA
        </text>
        <text x={960} y={1000} textAnchor="middle" fill={RED} fontFamily={MONO} fontSize={22} letterSpacing={5} opacity={P(f, xenAt + 6, 10)}>
          TÚNEIS TOMADOS · CRIATURAS DE XEN
        </text>
      </svg>
      <div style={{ position: "absolute", left: 70, top: 56, fontFamily: MONO, color: AMB, letterSpacing: 6 }}>
        <div style={{ fontSize: 22 }}>H.E.V. · CORTE DO TERRENO</div>
      </div>
      {f >= faintAt - 6 ? (
        <div style={{ position: "absolute", right: 70, bottom: 70, width: 480, padding: "16px 20px", background: "rgba(40,6,6,0.9)", border: `1px solid ${RED}`, borderRadius: 8, fontFamily: MONO, opacity: P(f, faintAt - 6, 8) }}>
          <div style={{ fontSize: 15, letterSpacing: 4, color: RED }}>H.E.V. · ACOMPANHAMENTO</div>
          <div style={{ fontSize: 32, letterSpacing: 3, color: CREAM }}>ALYX VANCE</div>
          <Ecg f={f} bpm={44} jitter={1} col={RED} w={440} h={60} />
          <div style={{ fontSize: 28, letterSpacing: 4, color: RED, opacity: Math.floor(f / 10) % 2 ? 1 : 0.5 }}>INCONSCIENTE</div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// 2) a ferida: a Alyx deitada (térmico), a aura dos Vortigaunts passando, uma mancha fria que o sensor não vê
export const HLWoundScan: React.FC<{ life: number; auraAt?: number; woundAt?: number; feelAt?: number; seeAt?: number }> = ({ life, auraAt = 0, woundAt = 1e9, feelAt = 1e9, seeAt = 1e9 }) => {
  const f = useCurrentFrame();
  void life;
  const sweep = ((f - auraAt) * 9) % 1400;
  const wound = P(f, woundAt, 14);
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 55%, #1c0d2a 0%, #07040c 75%)" }}>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "relative", width: 1100, height: 480 }}>
          <Img src={staticFile("hl3silh/encolhido.png")} style={{ position: "absolute", left: 300, top: 40, height: 420, transform: "rotate(-90deg) translateX(-40px)", filter: "sepia(1) saturate(5) hue-rotate(-25deg) brightness(1.15) contrast(1.2)", opacity: 0.95 }} />
          {/* a aura dos Vortigaunts varrendo */}
          {f >= auraAt ? <div style={{ position: "absolute", left: sweep - 200, top: 0, width: 220, height: 480, background: "linear-gradient(90deg, transparent, rgba(141,255,168,0.45), transparent)", filter: "blur(6px)" }} /> : null}
          {/* a ferida: um ponto frio no peito, que só a aura revela */}
          <div style={{ position: "absolute", left: 520, top: 210, width: 90, height: 90, borderRadius: 45, background: "radial-gradient(circle, rgba(10,30,60,0.95), rgba(10,30,60,0) 70%)", opacity: wound * (0.7 + 0.3 * Math.sin(f / 6)) }} />
          {wound > 0 ? <div style={{ position: "absolute", left: 495, top: 185, width: 140, height: 140, borderRadius: 70, border: `2px dashed ${GREEN}`, opacity: wound, transform: `rotate(${f}deg)` }} /> : null}
        </div>
      </AbsoluteFill>
      <div style={{ position: "absolute", left: 92, top: 84, fontFamily: MONO, color: AMB, letterSpacing: 6 }}>
        <div style={{ fontSize: 22 }}>H.E.V. · VISÃO TÉRMICA</div>
        <div style={{ fontSize: 17, letterSpacing: 4, opacity: 0.75, marginTop: 6 }}>ALYX VANCE · INCONSCIENTE</div>
      </div>
      <div style={{ position: "absolute", right: 92, top: 240, width: 520, fontFamily: MONO, display: "flex", flexDirection: "column", gap: 14 }}>
        {[
          { k: "SENSOR DO HEV", v: "NADA DETECTADO", at: woundAt, c: AMB },
          { k: "VORTIGAUNTS", v: "SENTEM UMA FERIDA", at: feelAt, c: GREEN },
          { k: "IMAGEM", v: "INVISÍVEL AO SENSOR", at: seeAt, c: RED },
        ].map((r, i) =>
          f >= r.at ? (
            <div key={i} style={{ padding: "12px 18px", background: "rgba(3,6,10,0.84)", border: `1px solid ${r.c}`, borderRadius: 8, opacity: flickIn(f, r.at) }}>
              <div style={{ fontSize: 15, letterSpacing: 4, color: r.c, opacity: 0.8 }}>{r.k}</div>
              <div style={{ fontSize: 26, letterSpacing: 2, color: CREAM }}>{r.v}</div>
            </div>
          ) : null,
        )}
      </div>
    </AbsoluteFill>
  );
};

// 4) as visões: fragmentos em tela cheia, cortes com glitch na palavra; na borda, o G-Man; o Vortigaunt interrompe
type Vis = { src: string; from: number; label: string; at: number; rate?: number; pos?: string; ui?: "alyxAge" | "citadel" };
export const HLVisions: React.FC<{ life: number; frags?: Vis[]; rushAt?: number; gmanAt?: number; gman?: { src: string; from: number }; noticeAt?: number; breakAt?: number }> = ({
  life,
  frags = [],
  rushAt = 1e9,
  gmanAt = 1e9,
  gman = { src: "videos/hl3_M01_1A2/clips/alyx_gman.mp4", from: 1.2 },
  noticeAt = 1e9,
  breakAt = 1e9,
}) => {
  const f = useCurrentFrame();
  void life;
  // depois de "imagens rápidas", os fragmentos piscam em sequência rápida
  const rush = f >= rushAt && f < gmanAt;
  let cur = -1;
  frags.forEach((v, i) => {
    if (f >= v.at) cur = i;
  });
  if (rush) cur = Math.floor((f - rushAt) / 6) % frags.length;
  const fr = cur >= 0 ? frags[cur] : null;
  const cutAge = fr ? (rush ? (f - rushAt) % 6 : f - fr.at) : 99;
  const glitch = cutAge < 5 ? 1 - cutAge / 5 : 0;
  const broken = f >= breakAt;
  const gm = f >= gmanAt;
  return (
    <AbsoluteFill style={{ background: "#020304" }}>
      {/* a energia verde de fundo (o ritual) */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(60,255,140,0.18), rgba(0,0,0,0) 65%)", opacity: broken ? 0 : 0.6 + 0.3 * Math.sin(f / 5) }} />
      {fr && !gm ? (
        <AbsoluteFill style={{ filter: fr.ui ? `hue-rotate(${glitch * 40}deg)` : `saturate(0.6) contrast(1.15) hue-rotate(${glitch * 40}deg)`, transform: `scale(${1.06 + (f % 60) * 0.0008}) translateX(${(rnd(f) - 0.5) * 50 * glitch}px)`, opacity: 0.92 }}>
          {fr.ui === "alyxAge" ? (
            <VisAlyxAge f={f} at={rush ? f - cutAge : fr.at} />
          ) : fr.ui === "citadel" ? (
            <VisCitadel f={f} at={rush ? f - cutAge - 30 : fr.at} />
          ) : (
            <Clip key={fr.src + fr.from} src={fr.src} from={fr.from} rate={fr.rate ?? 0.6} style={{ objectPosition: fr.pos ?? "50% 50%" }} />
          )}
        </AbsoluteFill>
      ) : null}
      {/* o G-Man na borda: tudo apaga e ele fica pequeno, no canto, parado */}
      {gm ? (
        <div style={{ position: "absolute", right: 90, top: 260, width: 420, height: 560, overflow: "hidden", opacity: P(f, gmanAt, 14) * (broken ? 1 - P(f, breakAt, 8) : 1), filter: "grayscale(0.6) contrast(1.2) brightness(0.9)", maskImage: "radial-gradient(ellipse at 50% 50%, black 40%, transparent 75%)", WebkitMaskImage: "radial-gradient(ellipse at 50% 50%, black 40%, transparent 75%)" }}>
          <Clip src={gman.src} from={gman.from} rate={0.25} style={{ objectPosition: "85% 40%" }} />
        </div>
      ) : null}
      <AbsoluteFill style={{ backgroundImage: "repeating-linear-gradient(0deg, rgba(0,0,0,0.12) 0 2px, transparent 2px 5px)" }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, transparent 45%, rgba(0,0,0,0.85) 100%)" }} />
      {fr && !gm && !rush ? (
        <div key={cur} style={{ position: "absolute", left: 120, bottom: 140, fontFamily: MONO, color: "#d8ffe4", textShadow: "0 4px 20px #000", opacity: P(f, fr.at, 6) }}>
          <div style={{ fontSize: 16, letterSpacing: 6, color: GREEN, opacity: 0.85 }}>VISÃO {String(cur + 1).padStart(2, "0")}</div>
          <div style={{ fontSize: 56, letterSpacing: 4 }}>{fr.label}</div>
        </div>
      ) : null}
      {gm ? (
        <div style={{ position: "absolute", left: 120, top: 380, fontFamily: MONO, opacity: P(f, gmanAt + 6, 10) * (broken ? 1 - P(f, breakAt, 8) : 1) }}>
          <div style={{ fontSize: 18, letterSpacing: 6, color: GREEN, opacity: 0.8 }}>NA BORDA DE TUDO</div>
          <div style={{ fontSize: 60, letterSpacing: 4, color: CREAM }}>ELE SÓ ESPERA.</div>
        </div>
      ) : null}
      {/* um Vortigaunt percebe: o anel verde pisca vermelho; interrompe: o anel se parte */}
      {f >= noticeAt ? (
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          {!broken ? (
            <circle cx={960} cy={540} r={420} fill="none" stroke={Math.floor(f / 5) % 2 ? RED : GREEN} strokeWidth={4} opacity={0.7} />
          ) : (
            Array.from({ length: 10 }).map((_, i) => {
              const a0 = (i / 10) * Math.PI * 2;
              const fly = P(f, breakAt, 16) * 220;
              const r = 420 + fly;
              return <path key={i} d={`M ${960 + Math.cos(a0) * r} ${540 + Math.sin(a0) * r} A ${r} ${r} 0 0 1 ${960 + Math.cos(a0 + 0.45) * r} ${540 + Math.sin(a0 + 0.45) * r}`} fill="none" stroke={GREEN} strokeWidth={4} opacity={1 - P(f, breakAt + 6, 14)} />;
            })
          )}
        </svg>
      ) : null}
      {f >= noticeAt && !broken ? <div style={{ position: "absolute", left: 0, right: 0, top: 120, textAlign: "center", fontFamily: MONO, fontSize: 24, letterSpacing: 6, color: RED, opacity: flickIn(f, noticeAt) }}>UM VORTIGAUNT PERCEBE ALGUMA COISA</div> : null}
      {broken ? <div style={{ position: "absolute", left: 0, right: 0, top: 500, textAlign: "center", fontFamily: MONO, fontSize: 40, letterSpacing: 10, color: GREEN, opacity: P(f, breakAt, 8) }}>RITUAL INTERROMPIDO</div> : null}
      <AbsoluteFill style={{ background: "#e8fff0", opacity: interpolate(f, [breakAt, breakAt + 1, breakAt + 8], [0, 0.6, 0], C), pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};

// 6) os lapsos: o card de saúde dela com o registro do que não fecha
export const HLLapses: React.FC<{ life: number; wakeAt?: number; worseAt?: number; rows?: { k: string; v: string; at: number }[]; face?: { src: string; from: number } }> = ({ life, wakeAt = 0, worseAt = 1e9, rows = [], face }) => {
  void face;
  const f = useCurrentFrame();
  void life;
  const worse = f >= worseAt;
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, #170e0b 0%, #060405 75%)" }}>
      <Corners col={AMB} o={0.6} />
      <div style={{ position: "absolute", left: 92, top: 84, fontFamily: MONO, color: AMB, letterSpacing: 6 }}>
        <div style={{ fontSize: 22 }}>H.E.V. · ACOMPANHAMENTO</div>
        <div style={{ fontSize: 17, letterSpacing: 4, opacity: 0.75, marginTop: 6 }}>ALYX VANCE · DEPOIS DO RITUAL</div>
      </div>
      <div style={{ position: "absolute", left: 160, top: 220, width: 640, padding: "22px 26px", background: "rgba(20,10,4,0.85)", border: `1px solid ${worse ? RED : AMB}`, borderRadius: 10, fontFamily: MONO, color: AMB, opacity: P(f, wakeAt, 12) }}>
        <div style={{ display: "flex", gap: 22, alignItems: "center" }}>
          <div style={{ width: 120, height: 146, overflow: "hidden", border: `1px solid ${AMB}`, borderRadius: 4 }}>
            <svg width={120} height={146}>
              {/* no lugar do retrato: o pulso dela em anéis que batem no ritmo do coração, e a linha de leitura descendo */}
              {[0, 1, 2].map((k) => {
                const ph = ((f * (worse ? 108 : 76)) / 60 / 30 + k / 3) % 1;
                return <circle key={k} cx={60} cy={66} r={8 + ph * 52} fill="none" stroke={worse ? RED : AMB} strokeWidth={2} opacity={1 - ph} />;
              })}
              <text x={60} y={74} textAnchor="middle" fill={CREAM} fontFamily={MONO} fontSize={22} letterSpacing={2}>AV</text>
              <line x1={4} x2={116} y1={(f * 2) % 146} y2={(f * 2) % 146} stroke={worse ? RED : AMB} strokeWidth={1} opacity={0.6} />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 40, letterSpacing: 3, color: CREAM }}>ALYX VANCE</div>
            <div style={{ fontSize: 24, letterSpacing: 3, color: worse ? RED : "#bfff9a" }}>{worse ? "LAPSOS · PIORANDO" : "ACORDADA · ESTÁVEL"}</div>
          </div>
        </div>
        <div style={{ marginTop: 16 }}>
          <Ecg f={f} bpm={worse ? 108 : 76} jitter={worse ? 1 : 0} col={worse ? RED : "#bfff9a"} w={588} h={80} />
        </div>
      </div>
      <div style={{ position: "absolute", right: 140, top: 220, width: 760, fontFamily: MONO, display: "flex", flexDirection: "column", gap: 16 }}>
        {f >= worseAt ? <div style={{ fontSize: 18, letterSpacing: 6, color: RED, opacity: flickIn(f, worseAt) }}>REGISTRO DE LAPSOS</div> : null}
        {rows.map((r, i) =>
          f >= r.at ? (
            <div key={i} style={{ padding: "14px 20px", background: "rgba(40,6,6,0.7)", border: `1px solid ${RED}`, borderRadius: 8, opacity: flickIn(f, r.at), transform: `translateX(${(1 - P(f, r.at, 8)) * 30}px)` }}>
              <div style={{ fontSize: 15, letterSpacing: 4, color: RED, opacity: 0.85 }}>{r.k}</div>
              <div style={{ fontSize: 30, letterSpacing: 2, color: CREAM }}>{r.v}</div>
            </div>
          ) : null,
        )}
      </div>
    </AbsoluteFill>
  );
};

// 7) a névoa: os Vortigaunts "sentem" adiante (ondas verdes revelam o terreno); na direção do norte as ondas morrem
export const HLFogAhead: React.FC<{ life: number; senseAt?: number; dirAt?: number; fogAt?: number; goneAt?: number; neverAt?: number }> = ({ life, senseAt = 0, dirAt = 1e9, fogAt = 1e9, goneAt = 1e9, neverAt = 1e9 }) => {
  const f = useCurrentFrame();
  void life;
  const G = { x: 960, y: 900 };
  const fog = P(f, fogAt, 30);
  const rings = Array.from({ length: 4 }).map((_, k) => {
    const t = ((((f - senseAt) * 3 + k * 140) % 560) + 560) % 560;
    return t;
  });
  return (
    <AbsoluteFill style={{ background: "#061018", overflow: "hidden" }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <filter id="fogN">
            <feTurbulence type="fractalNoise" baseFrequency="0.006" numOctaves={3} seed={Math.floor(f / 3) % 50} />
            <feColorMatrix values="0 0 0 0 0.86  0 0 0 0 0.9  0 0 0 0 0.95  0 0 0 1.4 -0.3" />
          </filter>
          <clipPath id="sensed"><circle cx={G.x} cy={G.y} r={Math.min(900, Math.max(0, (f - senseAt) * 9))} /></clipPath>
        </defs>
        {/* o terreno que eles sentem: gelo e canais (só dentro do que a onda já alcançou) */}
        <g clipPath="url(#sensed)">
          {Array.from({ length: 50 }).map((_, i) => (
            <path key={i} d={floePath(rnd(i * 3.1) * 1920, 250 + rnd(i * 5.7) * 830, 30 + rnd(i) * 70, i + 500)} fill="rgba(141,255,168,0.12)" stroke="rgba(141,255,168,0.5)" strokeWidth={2} />
          ))}
        </g>
        {/* as ondas verdes: no norte, depois de "naquela direção", elas morrem antes de chegar */}
        {f >= senseAt
          ? rings.map((t, k) => (
              <path key={k} d={`M ${G.x - t * 1.6} ${G.y} A ${t * 1.6} ${t} 0 0 1 ${G.x + t * 1.6} ${G.y}`} fill="none" stroke={GREEN} strokeWidth={3} opacity={(1 - t / 560) * (f >= dirAt ? Math.max(0, 1 - Math.max(0, t - 220) / 120) : 1)} />
            ))
          : null}
        {/* a névoa ao norte */}
        <rect x={0} y={-80} width={1920} height={560} filter="url(#fogN)" opacity={fog} />
        <circle cx={G.x} cy={G.y} r={16} fill={AMB} />
        <text x={G.x + 28} y={G.y + 8} fill={CREAM} fontFamily={MONO} fontSize={20} letterSpacing={4}>EXPEDIÇÃO</text>
      </svg>
      {f >= fogAt ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 200, textAlign: "center", fontFamily: MONO, opacity: P(f, fogAt + 8, 12) }}>
          <div style={{ fontSize: 22, letterSpacing: 8, color: "#0d2230" }}>NORTE</div>
          <div style={{ fontSize: 64, letterSpacing: 14, color: "#0d2230", fontWeight: 700 }}>SEM LEITURA</div>
          {f >= goneAt ? <div style={{ fontSize: 22, letterSpacing: 5, color: "#0d2230", opacity: flickIn(f, goneAt) }}>UM PONTO ONDE TUDO SIMPLESMENTE SOME</div> : null}
        </div>
      ) : null}
      <div style={{ position: "absolute", left: 70, top: 64, padding: "14px 20px", background: "rgba(3,6,10,0.82)", border: `1px solid ${GREEN}`, borderRadius: 8, fontFamily: MONO, color: GREEN, letterSpacing: 5 }}>
        <div style={{ fontSize: 22 }}>VORTIGAUNTS · O QUE ELES SENTEM ADIANTE</div>
      </div>
      {f >= neverAt ? (
        <div style={{ position: "absolute", right: 70, bottom: 80, padding: "14px 22px", border: `3px solid ${RED}`, color: RED, fontFamily: MONO, fontSize: 30, letterSpacing: 6, background: "rgba(40,6,6,0.75)", transform: `rotate(-3deg) scale(${1 + (1 - P(f, neverAt, 8)) * 0.6})`, opacity: P(f, neverAt, 8) }}>NUNCA VISTO ANTES</div>
      ) : null}
    </AbsoluteFill>
  );
};

// 8) os dois problemas; no fim a névoa engole a tela
export const HLTwoProblems: React.FC<{ life: number; oneAt?: number; twoAt?: number; fogAt?: number }> = ({ life, oneAt = 1e9, twoAt = 1e9, fogAt = 1e9 }) => {
  const f = useCurrentFrame();
  const fog = interpolate(f, [fogAt, life - 4], [0, 1], { ...C, easing: Easing.in(Easing.quad) });
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, #10121a 0%, #040507 75%)" }}>
      <div style={{ position: "absolute", left: 220, top: 300, fontFamily: MONO, display: "flex", flexDirection: "column", gap: 40 }}>
        <div style={{ fontSize: 22, letterSpacing: 8, color: AMB, opacity: P(f, 0, 10) }}>DOIS PROBLEMAS</div>
        {f >= oneAt ? (
          <div style={{ display: "flex", gap: 30, alignItems: "baseline", opacity: flickIn(f, oneAt) }}>
            <span style={{ fontSize: 60, color: AMB }}>1</span>
            <span style={{ fontSize: 76, letterSpacing: 4, color: CREAM }}>A ALYX VOLTOU</span>
            <span style={{ fontSize: 60, color: "#bfff9a" }}>✓</span>
          </div>
        ) : null}
        {f >= twoAt ? (
          <div style={{ display: "flex", gap: 30, alignItems: "baseline", opacity: flickIn(f, twoAt), transform: `translateX(${(rnd(f) - 0.5) * (f < twoAt + 8 ? 30 : 0)}px)` }}>
            <span style={{ fontSize: 60, color: AMB }}>2</span>
            <span style={{ fontSize: 76, letterSpacing: 4, color: CREAM }}>ALGUMA COISA VOLTOU COM ELA</span>
            <span style={{ fontSize: 60, color: RED }}>?</span>
          </div>
        ) : null}
      </div>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: fog }}>
        <defs>
          <filter id="fogE">
            <feTurbulence type="fractalNoise" baseFrequency="0.005" numOctaves={3} seed={Math.floor(f / 3) % 50} />
            <feColorMatrix values="0 0 0 0 0.85  0 0 0 0 0.9  0 0 0 0 0.95  0 0 0 1.6 -0.2" />
          </filter>
        </defs>
        <rect width={1920} height={1080} filter="url(#fogE)" />
      </svg>
      <AbsoluteFill style={{ background: "#dfe8ee", opacity: interpolate(f, [life - 20, life], [0, 1], C) }} />
    </AbsoluteFill>
  );
};

// ============================================================================================ 1d) os dois tempos
// dois mostradores do HEV. Eli (âmbar): o ponteiro dá 3 voltas (uma por dia), o anel alterna dia/noite, fecha em
// 3 DIAS. Alyx (gelo): anéis concêntricos (segundos → dias → anos → séculos → milênios → milhões) acendem de dentro
// para fora girando cada vez mais rápido; no auge, glitch; todos colapsam para o centro e o mostrador volta a 00:00:00.
const RINGS_A = ["SEGUNDOS", "DIAS", "ANOS", "SÉCULOS", "MILÊNIOS", "MILHÕES DE ANOS"];
export const HLTwoClocks: React.FC<{ life: number; daysAt?: number; alyxAt?: number; zeroAt?: number }> = ({ life, daysAt = 1e9, alyxAt = 1e9, zeroAt = 1e9 }) => {
  const f = useCurrentFrame();
  void life;
  const inE = P(f, 0, 16);
  // --- Eli: 0 → 3 voltas até daysAt
  const turns = interpolate(f, [4, daysAt], [0, 3], { ...C, easing: Easing.inOut(Easing.quad) });
  const hours = Math.min(72, turns * 24);
  const days = f >= daysAt;
  const RE = 230;
  const ex = 520;
  const ey = 520;
  const handE = turns * Math.PI * 2 - Math.PI / 2;
  // --- Alyx: anéis acendem um a um, cada um girando mais rápido; colapso no zeroAt
  const spinEnd = zeroAt - 10;
  const lit = interpolate(f, [alyxAt, spinEnd], [0, RINGS_A.length], C);
  const glitch = f >= spinEnd && f < zeroAt;
  const col = P(f, zeroAt, 10); // colapso
  const zero = f >= zeroAt;
  const ax = 1250;
  const ay = 520;
  const inA = P(f, alyxAt - 6, 14);
  const t = interpolate(f, [alyxAt, spinEnd], [0, 1], C);
  const years = (1 / (365 * 24 * 3600)) * Math.pow(4.7e6 * 365 * 24 * 3600, t);
  const inc = zero ? interpolate(f, [zeroAt, zeroAt + 4, zeroAt + 30, zeroAt + 46], [0, 1, 1, 0], C) : 0;
  const jx = glitch ? (rnd(f * 3) - 0.5) * 40 : 0;
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, #0e141a 0%, #040608 75%)" }}>
      <Corners col={AMB} o={0.5} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 70, textAlign: "center", fontFamily: MONO, fontSize: 20, letterSpacing: 10, color: CREAM, opacity: 0.8 * inE }}>H.E.V. · TEMPO DECORRIDO · REGISTROS DIVERGENTES</div>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {/* ---------------- Eli ---------------- */}
        <g opacity={inE}>
          {/* anel de dia/noite: 6 metades (3 dias), acendem conforme o ponteiro passa */}
          {Array.from({ length: 6 }).map((_, i) => {
            const a0 = (i / 6) * Math.PI * 2 * 3 / 3 - Math.PI / 2;
            const a1 = ((i + 1) / 6) * Math.PI * 2 - Math.PI / 2;
            const on = turns * 2 >= i + 1 ? 1 : 0.15;
            const r = RE + 34;
            const lg = a1 - a0 > Math.PI ? 1 : 0;
            return <path key={i} d={`M ${ex + Math.cos(a0) * r} ${ey + Math.sin(a0) * r} A ${r} ${r} 0 ${lg} 1 ${ex + Math.cos(a1) * r} ${ey + Math.sin(a1) * r}`} fill="none" stroke={i % 2 ? "#3a4a66" : AMB} strokeWidth={18} opacity={on} />;
          })}
          <circle cx={ex} cy={ey} r={RE} fill="rgba(30,16,4,0.6)" stroke={AMB} strokeWidth={3} />
          {Array.from({ length: 24 }).map((_, i) => {
            const a = (i / 24) * Math.PI * 2 - Math.PI / 2;
            const r0 = RE - (i % 6 === 0 ? 28 : 14);
            return <line key={i} x1={ex + Math.cos(a) * r0} y1={ey + Math.sin(a) * r0} x2={ex + Math.cos(a) * RE} y2={ey + Math.sin(a) * RE} stroke={AMB} strokeWidth={i % 6 === 0 ? 4 : 2} opacity={0.7} />;
          })}
          {/* rastro do ponteiro */}
          <circle cx={ex} cy={ey} r={RE - 60} fill="none" stroke={AMB} strokeWidth={6} strokeDasharray={`${((turns % 1) || (days ? 1 : 0)) * 2 * Math.PI * (RE - 60)} 9999`} transform={`rotate(-90 ${ex} ${ey})`} opacity={0.5} />
          <line x1={ex} y1={ey} x2={ex + Math.cos(handE) * (RE - 30)} y2={ey + Math.sin(handE) * (RE - 30)} stroke={CREAM} strokeWidth={5} strokeLinecap="round" />
          <circle cx={ex} cy={ey} r={10} fill={CREAM} />
          {/* sol e lua marcando as voltas */}
          {(() => {
            const a = handE;
            const r = RE + 34;
            return (
              <g>
                <circle cx={ex + Math.cos(a) * r} cy={ey + Math.sin(a) * r} r={20} fill="#ffcf6a" style={{ filter: "drop-shadow(0 0 12px #ffb000)" }} />
                <circle cx={ex - Math.cos(a) * r} cy={ey - Math.sin(a) * r} r={15} fill="#cfe0ff" />
                <circle cx={ex - Math.cos(a) * r + 7} cy={ey - Math.sin(a) * r - 4} r={13} fill="#1a2433" />
              </g>
            );
          })()}
          {/* marcas dos dias completos: D1 D2 D3 dentro do mostrador */}
          {[0, 1, 2].map((d) => (
            <text key={d} x={ex - 60 + d * 60} y={ey + 90} textAnchor="middle" fill={turns >= d + 1 ? CREAM : AMB} opacity={turns >= d + 1 ? 1 : 0.25} fontFamily={MONO} fontSize={22}>{`D${d + 1}`}</text>
          ))}
        </g>
        {/* ---------------- Alyx ---------------- */}
        <g opacity={inA} transform={`translate(${jx} 0)`}>
          {RINGS_A.map((nm, i) => {
            const r = (60 + i * 38) * (1 - col * (1 - 0.02 * i));
            const on = zero ? 0 : Math.max(0, Math.min(1, lit - i));
            const sp = (f - alyxAt) * (1.5 + i * 3.5 + lit * 4);
            return (
              <g key={i} opacity={0.15 + 0.85 * on}>
                <circle cx={ax} cy={ay} r={Math.max(2, r)} fill="none" stroke={glitch ? (i % 2 ? RED : ICE) : ICE} strokeWidth={10} strokeDasharray={`${8 + i * 4} ${10 + i * 3}`} transform={`rotate(${sp} ${ax} ${ay})`} />
                <line x1={ax + r} y1={ay} x2={ax + 300} y2={ay - 150 + i * 60} stroke={ICE} strokeWidth={1} opacity={on > 0.5 && !zero ? 0.5 : 0} />
                <text x={ax + 310} y={ay - 144 + i * 60} fill={glitch ? RED : ICE} fontFamily={MONO} fontSize={18} letterSpacing={4} opacity={zero ? 0 : 0.25 + 0.75 * on}>
                  {nm}
                </text>
              </g>
            );
          })}
          {/* o colapso: um clarão no centro */}
          <circle cx={ax} cy={ay} r={30 + 240 * (1 - col)} fill="none" stroke={ICE} strokeWidth={2} opacity={zero ? 1 - col : 0} />
          <circle cx={ax} cy={ay} r={zero ? 230 : 0} fill="rgba(10,25,35,0.6)" stroke={ICE} strokeWidth={3} opacity={col} />
        </g>
      </svg>
      {/* rótulos e valores */}
      <div style={{ position: "absolute", left: ex - 260, width: 520, top: 170, textAlign: "center", fontFamily: MONO, opacity: inE }}>
        <div style={{ fontSize: 20, letterSpacing: 6, color: AMB }}>PARA O ELI</div>
        <div style={{ fontSize: 16, letterSpacing: 4, color: AMB, opacity: 0.7 }}>ELA SUMIU HÁ</div>
      </div>
      <div style={{ position: "absolute", left: ex - 200, width: 400, top: ey + RE + 50, textAlign: "center", fontFamily: MONO, fontSize: days ? 64 : 48, letterSpacing: 4, color: days ? CREAM : AMB, opacity: inE }}>{days ? "3 DIAS" : `${String(Math.floor(hours)).padStart(2, "0")} h`}</div>
      <div style={{ position: "absolute", left: ax - 300, width: 600, top: 170, textAlign: "center", fontFamily: MONO, opacity: inA }}>
        <div style={{ fontSize: 20, letterSpacing: 6, color: ICE }}>PARA ELA</div>
        <div style={{ fontSize: 16, letterSpacing: 4, color: ICE, opacity: 0.7 }}>TEMPO QUE PASSOU</div>
      </div>
      <div style={{ position: "absolute", left: ax - 300, width: 600, top: ay + 290, textAlign: "center", fontFamily: MONO, opacity: inA, transform: `translateX(${jx}px)` }}>
        <div style={{ fontSize: zero ? 64 : 44, letterSpacing: 3, color: glitch ? RED : ICE, textShadow: glitch ? `${(rnd(f) - 0.5) * 16}px 0 0 rgba(255,0,60,0.8), ${(rnd(f + 3) - 0.5) * 16}px 0 0 rgba(0,200,255,0.8)` : "0 0 24px rgba(159,230,255,0.35)" }}>{zero ? "00:00:00" : fmtYears(years)}</div>
        <div style={{ height: 30, fontSize: 18, letterSpacing: 6, color: RED, opacity: inc }}>INCONSISTÊNCIA · REGISTRO CORRIGIDO</div>
      </div>
      {zero ? (
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: col }}>
          {Array.from({ length: 12 }).map((_, i) => {
            const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
            return <line key={i} x1={ax + Math.cos(a) * 200} y1={ay + Math.sin(a) * 200} x2={ax + Math.cos(a) * 224} y2={ay + Math.sin(a) * 224} stroke={ICE} strokeWidth={3} />;
          })}
          <line x1={ax} y1={ay} x2={ax} y2={ay - 190} stroke={ICE} strokeWidth={5} strokeLinecap="round" />
          <circle cx={ax} cy={ay} r={10} fill={ICE} />
        </svg>
      ) : null}
      <AbsoluteFill style={{ background: "#eaf6ff", opacity: interpolate(f, [zeroAt, zeroAt + 1, zeroAt + 8], [0, 0.5, 0], C), pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};

// ============================================================================================ 2c) em troca de quê?
// a análise do Eli: a maleta do G-Man em wireframe, girando devagar no escuro. Ela abre: na tampa acende o que foi
// entregue (ALYX VANCE · DEVOLVIDA); no fundo, a outra metade do acordo, "EM TROCA:", com o cursor esperando. Na
// palavra "troca" o campo se tarja em vermelho e a maleta fecha seca.
export const HLGmanTrade: React.FC<{ life: number; openAt?: number; giveAt?: number; tradeAt?: number }> = ({ life, openAt = 30, giveAt = 100, tradeAt = 1e9 }) => {
  const f = useCurrentFrame();
  void life;
  const W = 780;
  const D = 520;
  const H = 120;
  const LH = 70;
  const slam = P(f, tradeAt + 6, 5);
  const open = interpolate(f, [openAt, openAt + 26], [0, 1], { ...C, easing: Easing.out(Easing.back(1.2)) }) * (1 - slam);
  const lid = open * 98; // graus
  const yaw = -24 + f * 0.22;
  const inn = P(f, openAt + 14, 10) * (1 - slam);
  const give = P(f, giveAt, 8);
  const trade = f >= tradeAt;
  const shake = f >= tradeAt + 11 && f < tradeAt + 19 ? (1 - (f - tradeAt - 11) / 8) * 14 : 0;
  const line = (c = "rgba(200,225,235,0.75)") => `2px solid ${c}`;
  const face = (w: number, h: number, tf: string, extra?: React.CSSProperties, kids?: React.ReactNode) => (
    <div style={{ position: "absolute", left: -w / 2, top: -h / 2, width: w, height: h, transform: tf, border: line(), background: "rgba(14,22,28,0.82)", ...extra }}>{kids}</div>
  );
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 55%, #10181d 0%, #030405 70%)" }}>
      {/* chão: grade em perspectiva */}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: 0.35 }}>
        {Array.from({ length: 21 }).map((_, i) => (
          <line key={"v" + i} x1={960 + (i - 10) * 60} y1={700} x2={960 + (i - 10) * 260} y2={1080} stroke="#4c6670" strokeWidth={1} />
        ))}
        {Array.from({ length: 8 }).map((_, i) => {
          const y = 700 + Math.pow(i / 7, 1.8) * 380;
          return <line key={"h" + i} x1={0} x2={1920} y1={y} y2={y} stroke="#4c6670" strokeWidth={1} />;
        })}
      </svg>
      <div style={{ position: "absolute", left: 70, top: 56, fontFamily: MONO, letterSpacing: 6, color: RED, opacity: P(f, 0, 8) }}>
        <div style={{ fontSize: 22 }}>ANÁLISE · ELI VANCE</div>
        <div style={{ fontSize: 17, color: CREAM, opacity: 0.8, marginTop: 6 }}>O G-MAN DEVOLVEU A FILHA DELE.</div>
      </div>
      <div style={{ position: "absolute", left: 960, top: 790, perspective: 1700, transform: `scale(0.8) translate(${(rnd(f) - 0.5) * shake}px, ${(rnd(f + 1) - 0.5) * shake}px)` }}>
        <div style={{ position: "absolute", transformStyle: "preserve-3d", transform: `rotateX(-38deg) rotateY(${yaw}deg)` }}>
          {/* base */}
          {face(W, D, `translateY(${H / 2}px) rotateX(90deg)`)}
          {face(
            W,
            D,
            `translateY(${H / 2 - 6}px) rotateX(90deg)`,
            { background: "rgba(8,12,15,0.9)", border: line("rgba(159,230,255,0.35)") },
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: MONO, opacity: inn }}>
              <div style={{ fontSize: 34, letterSpacing: 6, color: trade ? RED : CREAM }}>EM TROCA:</div>
              <div style={{ marginTop: 18, width: 520, height: 64, border: line(trade ? RED : "rgba(255,226,176,0.6)"), position: "relative" }}>
                {trade ? (
                  <div style={{ position: "absolute", left: 10, right: 10, top: 10, bottom: 10, background: RED, opacity: 0.6 + 0.4 * Math.sin(f / 2) }} />
                ) : (
                  <div style={{ position: "absolute", left: 16, top: 12, width: 22, height: 40, background: CREAM, opacity: Math.floor(f / 12) % 2 ? 1 : 0 }} />
                )}
              </div>
            </div>,
          )}
          {face(
            W,
            H,
            `translateZ(${D / 2}px)`,
            undefined,
            <>
              <div style={{ position: "absolute", left: 120, top: 26, width: 46, height: 30, border: line() }} />
              <div style={{ position: "absolute", right: 120, top: 26, width: 46, height: 30, border: line() }} />
            </>,
          )}
          {face(W, H, `translateZ(${-D / 2}px) rotateY(180deg)`)}
          {face(D, H, `rotateY(90deg) translateZ(${W / 2}px)`)}
          {face(D, H, `rotateY(-90deg) translateZ(${W / 2}px)`)}
          {/* alça */}
          <div style={{ position: "absolute", left: -110, top: -H / 2 - 40, width: 220, height: 46, borderTop: line(), borderLeft: line(), borderRight: line(), borderRadius: "24px 24px 0 0", transform: `translateZ(${D / 2 + 2}px)` }} />
          {/* tampa: dobradiça na borda de trás, em cima */}
          <div style={{ position: "absolute", transformStyle: "preserve-3d", transform: `translateY(${-H / 2}px) translateZ(${-D / 2}px) rotateX(${lid}deg)` }}>
            <div style={{ position: "absolute", transformStyle: "preserve-3d", transform: `translateZ(${D / 2}px)` }}>
              {face(W, D, `translateY(${-LH}px) rotateX(90deg)`)}
              {face(
                W,
                D,
                `translateY(-6px) rotateX(-90deg)`,
                { background: "rgba(8,12,15,0.92)", border: line("rgba(159,230,255,0.35)") },
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: MONO, opacity: inn * give }}>
                  <div style={{ fontSize: 22, letterSpacing: 6, color: ICE, opacity: 0.8 }}>ENTREGUE</div>
                  <div style={{ fontSize: 50, letterSpacing: 4, color: ICE, marginTop: 10 }}>ALYX VANCE</div>
                  <div style={{ fontSize: 26, letterSpacing: 8, color: CREAM, marginTop: 8 }}>DEVOLVIDA ✓</div>
                </div>,
              )}
              {face(W, LH, `translateY(${-LH / 2}px) translateZ(${D / 2}px)`)}
              {face(D, LH, `translateY(${-LH / 2}px) rotateY(90deg) translateZ(${W / 2}px)`)}
              {face(D, LH, `translateY(${-LH / 2}px) rotateY(-90deg) translateZ(${W / 2}px)`)}
            </div>
          </div>
        </div>
      </div>
      {/* luz que sai da maleta aberta */}
      <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 55%, rgba(159,230,255,${0.12 * inn}) 0%, transparent 40%)`, pointerEvents: "none" }} />
      <AbsoluteFill style={{ background: "#fff", opacity: interpolate(f, [tradeAt + 11, tradeAt + 12, tradeAt + 16], [0, 0.18, 0], C) }} />
    </AbsoluteFill>
  );
};

// ============================================================================================ 4B v2 (sem arte parada)
// raio vortigaunt: linha quebrada de A até B, tremendo a cada 2 quadros
const bolt = (x1: number, y1: number, x2: number, y2: number, seed: number, amp = 26, n = 9) => {
  const pts: string[] = [];
  const dx = x2 - x1;
  const dy = y2 - y1;
  const L = Math.hypot(dx, dy) || 1;
  const nx = -dy / L;
  const ny = dx / L;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const o = i === 0 || i === n ? 0 : (rnd(seed * 7.3 + i * 3.1) - 0.5) * 2 * amp * Math.sin(Math.PI * t);
    pts.push(`${(x1 + dx * t + nx * o).toFixed(1)},${(y1 + dy * t + ny * o).toFixed(1)}`);
  }
  return pts.join(" ");
};

// a visão da Alyx mais velha: a ficha biométrica dela, a voz bate, a idade gira de 24 para 61, a foto não vem
export const VisAlyxAge: React.FC<{ f: number; at: number }> = ({ f, at }) => {
  const t = f - at;
  const age = Math.round(interpolate(t, [8, 34], [24, 61], { ...C, easing: Easing.inOut(Easing.cubic) }));
  const rolling = t >= 8 && t < 34;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 1180, padding: "34px 40px", background: "rgba(4,16,10,0.88)", border: `1px solid ${GREEN}`, borderRadius: 10, fontFamily: MONO, color: GREEN, display: "flex", gap: 40 }}>
        {/* a foto que não vem: só chiado */}
        <div style={{ width: 260, height: 320, border: `1px solid ${GREEN}`, position: "relative", overflow: "hidden", background: "#020604" }}>
          {Array.from({ length: 32 }).map((_, j) => (
            <div key={j} style={{ position: "absolute", left: 0, right: 0, top: j * 10, height: 10, background: `rgba(141,255,168,${0.04 + 0.16 * rnd(j + f * 5)})`, transform: `translateX(${(rnd(j * 3 + f) - 0.5) * 30}px)` }} />
          ))}
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 12, textAlign: "center", fontSize: 15, letterSpacing: 3, color: RED }}>IMAGEM CORROMPIDA</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, letterSpacing: 6, opacity: 0.8 }}>REGISTRO BIOMÉTRICO</div>
          <div style={{ fontSize: 58, letterSpacing: 4, color: "#d8ffe4", marginTop: 6 }}>ALYX VANCE</div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 18 }}>
            <svg width={360} height={50}>
              {Array.from({ length: 45 }).map((_, i) => {
                const h = 4 + 40 * Math.abs(Math.sin(i * 0.6 + f * 0.45)) * rnd(i + Math.floor(f / 2));
                return <rect key={i} x={i * 8} y={25 - h / 2} width={4} height={h} fill={GREEN} opacity={0.85} />;
              })}
            </svg>
            <span style={{ fontSize: 22, letterSpacing: 3 }}>VOZ · COMPATÍVEL 98%</span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 18, marginTop: 22 }}>
            <span style={{ fontSize: 24, letterSpacing: 5, opacity: 0.8 }}>IDADE</span>
            <span style={{ fontSize: 120, letterSpacing: 4, color: rolling ? "#d8ffe4" : t >= 34 ? RED : "#d8ffe4", transform: `translateY(${rolling ? (rnd(f) - 0.5) * 10 : 0}px)`, display: "inline-block" }}>{age}</span>
            {t >= 34 ? <span style={{ fontSize: 22, letterSpacing: 4, color: RED, opacity: flickIn(f, at + 34) }}>REGISTRO NÃO CONSTA</span> : null}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// a visão da outra Cidadela: uma torre em wireframe sobe num horizonte que não é o de City 17, girando devagar
export const VisCitadel: React.FC<{ f: number; at: number }> = ({ f, at }) => {
  const t = f - at;
  const rise = interpolate(t, [0, 40], [0, 1], { ...C, easing: Easing.out(Easing.cubic) });
  const yaw = t * 0.012;
  const cx = 960;
  const base = 900;
  const Hh = 860 * rise;
  const rings = 16;
  const sides = 7;
  const rAt = (k: number) => 170 * (1 - k * 0.3) * (k > 0.93 ? 0.8 : 1);
  const lean = (k: number) => k * k * 60;
  const pt = (k: number, s: number) => {
    const a = yaw + (s / sides) * Math.PI * 2;
    const r = rAt(k);
    return [cx + lean(k) + Math.cos(a) * r, base - k * Hh + Math.sin(a) * r * 0.22 - (k > 0.93 ? rnd(s * 3.3) * 60 : 0), Math.sin(a)] as const;
  };
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
      {/* horizonte estranho: dois sóis e prédios que não são de City 17 */}
      <circle cx={420} cy={260} r={60} fill="none" stroke={GREEN} strokeWidth={2} opacity={0.5} />
      <circle cx={560} cy={300} r={26} fill="none" stroke={GREEN} strokeWidth={2} opacity={0.4} />
      {Array.from({ length: 26 }).map((_, i) => {
        const x = i * 80 - 40 + ((t * 0.6) % 80);
        const h = 60 + rnd(i * 4.4) * 180;
        return <rect key={i} x={x} y={base - h} width={56} height={h} fill="none" stroke={GREEN} strokeWidth={1.2} opacity={0.3} />;
      })}
      <line x1={0} x2={1920} y1={base} y2={base} stroke={GREEN} strokeWidth={2} opacity={0.6} />
      {/* a torre */}
      {Array.from({ length: rings + 1 }).map((_, i) => {
        const k = i / rings;
        const p = Array.from({ length: sides + 1 }).map((__, s) => pt(k, s));
        return <polyline key={"r" + i} points={p.map((q) => `${q[0].toFixed(1)},${q[1].toFixed(1)}`).join(" ")} fill="none" stroke={GREEN} strokeWidth={1.6} opacity={0.75} />;
      })}
      {Array.from({ length: sides }).map((_, s) => {
        const p = Array.from({ length: rings + 1 }).map((__, i) => pt(i / rings, s));
        const front = p[0][2] > -0.2;
        return <polyline key={"v" + s} points={p.map((q) => `${q[0].toFixed(1)},${q[1].toFixed(1)}`).join(" ")} fill="none" stroke={GREEN} strokeWidth={front ? 2 : 1} opacity={front ? 0.9 : 0.3} />;
      })}
      <text x={1240} y={300} fill={GREEN} fontFamily={MONO} fontSize={20} letterSpacing={5} opacity={P(f, at + 16, 10)}>LOCAL · DESCONHECIDO</text>
      <text x={1240} y={332} fill={RED} fontFamily={MONO} fontSize={18} letterSpacing={4} opacity={P(f, at + 24, 10)}>NÃO É CITY 17</text>
    </svg>
  );
};

// a ferida: dois painéis. O sensor do HEV vê a Alyx normal; o campo dos Vortigaunts, por cima do mesmo sinal,
// tem um rasgo escuro que pulsa e se espalha
export const HLWoundField: React.FC<{ life: number; auraAt?: number; woundAt?: number; feelAt?: number; seeAt?: number }> = ({ life, auraAt = 0, woundAt = 1e9, feelAt = 1e9, seeAt = 1e9 }) => {
  const f = useCurrentFrame();
  void life;
  const w = P(f, woundAt, 20);
  const grow = interpolate(f, [woundAt, woundAt + 200], [0.4, 1], C);
  const CX = 1380;
  const CY = 560;
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, #0c1410 0%, #030504 75%)" }}>
      <div style={{ position: "absolute", left: 70, top: 56, fontFamily: MONO, letterSpacing: 6, color: AMB }}>
        <div style={{ fontSize: 22 }}>ALYX VANCE · INCONSCIENTE</div>
      </div>
      {/* painel 1: o HEV */}
      <div style={{ position: "absolute", left: 120, top: 200, width: 700, height: 700, border: `1px solid rgba(255,178,46,0.5)`, borderRadius: 10, background: "rgba(20,12,4,0.6)", fontFamily: MONO, padding: 30, boxSizing: "border-box" }}>
        <div style={{ fontSize: 18, letterSpacing: 6, color: AMB }}>O QUE O SENSOR DO HEV VÊ</div>
        <div style={{ marginTop: 40 }}>
          <Ecg f={f} bpm={52} jitter={0} col={AMB} w={640} h={120} />
        </div>
        {[["PULSO", "52 BPM"], ["TEMPERATURA", "36,1 °C"], ["LESÕES", "NENHUMA"]].map(([k, v], i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 26, letterSpacing: 3, color: CREAM, marginTop: 26, borderBottom: "1px solid rgba(255,178,46,0.2)", paddingBottom: 10 }}>
            <span style={{ color: AMB, opacity: 0.8 }}>{k}</span>
            <span>{v}</span>
          </div>
        ))}
        <div style={{ marginTop: 34, fontSize: 30, letterSpacing: 4, color: "#bfff9a", opacity: f >= woundAt ? flickIn(f, woundAt) : 0 }}>NADA DETECTADO</div>
      </div>
      {/* painel 2: o campo dos Vortigaunts */}
      <div style={{ position: "absolute", left: 1000, top: 200, width: 760, height: 700, border: `1px solid ${GREEN}`, borderRadius: 10, background: "rgba(4,18,10,0.6)", overflow: "hidden", opacity: P(f, auraAt, 12) }}>
        <svg width={760} height={700} style={{ position: "absolute", inset: 0 }}>
          <defs>
            <filter id="woundN">
              <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves={3} seed={Math.floor(f / 2) % 40} />
              <feDisplacementMap in="SourceGraphic" scale={40 * grow} />
            </filter>
            <radialGradient id="woundG">
              <stop offset="0%" stopColor="#000" stopOpacity={1} />
              <stop offset="60%" stopColor="#000" stopOpacity={0.85} />
              <stop offset="100%" stopColor="#000" stopOpacity={0} />
            </radialGradient>
          </defs>
          {/* o campo: raios verdes circulando o sinal dela */}
          {Array.from({ length: 14 }).map((_, i) => {
            const a = (i / 14) * Math.PI * 2 + f * 0.01;
            const b = a + 0.9;
            const r = 230 + 30 * Math.sin(f / 9 + i);
            const x0 = 380 + Math.cos(a) * r;
            const y0 = 360 + Math.sin(a) * r;
            const x1 = 380 + Math.cos(b) * r;
            const y1 = 360 + Math.sin(b) * r;
            return <polyline key={i} points={bolt(x0, y0, x1, y1, i * 13 + Math.floor(f / 2), 18, 7)} fill="none" stroke={GREEN} strokeWidth={2} opacity={0.6 + 0.4 * rnd(i + Math.floor(f / 2))} />;
          })}
          {Array.from({ length: 10 }).map((_, i) => {
            const a = (i / 10) * Math.PI * 2 - f * 0.015;
            return <polyline key={"in" + i} points={bolt(380, 360, 380 + Math.cos(a) * 200, 360 + Math.sin(a) * 200, i * 31 + Math.floor(f / 2), 22, 8)} fill="none" stroke={GREEN} strokeWidth={1.5} opacity={0.45} />;
          })}
          {/* o rasgo: uma mancha escura que o campo contorna */}
          <g opacity={w} filter="url(#woundN)">
            <ellipse cx={380} cy={360} rx={70 + 60 * grow + 6 * Math.sin(f / 5)} ry={38 + 30 * grow} fill="url(#woundG)" transform={`rotate(-18 380 360)`} />
            <ellipse cx={380} cy={360} rx={70 + 60 * grow} ry={38 + 30 * grow} fill="none" stroke={RED} strokeWidth={1.5} opacity={0.5 + 0.5 * Math.sin(f / 4)} transform={`rotate(-18 380 360)`} />
          </g>
        </svg>
        <div style={{ position: "absolute", left: 30, top: 30, fontFamily: MONO, fontSize: 18, letterSpacing: 6, color: GREEN }}>O QUE OS VORTIGAUNTS SENTEM</div>
        {f >= feelAt ? <div style={{ position: "absolute", left: 30, bottom: 70, fontFamily: MONO, fontSize: 30, letterSpacing: 4, color: CREAM, opacity: flickIn(f, feelAt) }}>UMA FERIDA</div> : null}
        {f >= seeAt ? <div style={{ position: "absolute", left: 30, bottom: 30, fontFamily: MONO, fontSize: 20, letterSpacing: 4, color: RED, opacity: flickIn(f, seeAt) }}>QUE NINGUÉM CONSEGUE VER</div> : null}
      </div>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {/* a mesma pessoa nos dois painéis */}
        <line x1={820} y1={550} x2={1000} y2={550} stroke={CREAM} strokeWidth={1} strokeDasharray="6 8" opacity={0.4} />
        <circle cx={CX} cy={CY} r={0} />
      </svg>
    </AbsoluteFill>
  );
};

// a névoa: o que os Vortigaunts sentem adiante. Vista de cima do terreno (curvas de nível correndo), raios verdes
// saem do grupo e acendem o que existe à frente; "naquela direção" os raios do norte entram numa massa cinza e são
// cortados; "tudo some": o terreno acaba e vira estática; nada parecido antes
export const HLVortSight: React.FC<{ life: number; tryAt?: number; askAt?: number; senseAt?: number; dirAt?: number; fogAt?: number; goneAt?: number; afterAt?: number; neverAt?: number }> = ({
  life,
  tryAt = 0,
  askAt = 1e9,
  senseAt = 1e9,
  dirAt = 1e9,
  fogAt = 1e9,
  goneAt = 1e9,
  afterAt = 1e9,
  neverAt = 1e9,
}) => {
  const f = useCurrentFrame();
  void life;
  const G = { x: 960, y: 930 };
  const scroll = f * 0.8;
  const spread = P(f, senseAt, 40);
  const fog = P(f, fogAt, 24);
  const gone = P(f, goneAt, 16);
  const FOGY = 380 - 60 * gone; // borda da névoa (tudo acima some)
  // alvos do que eles sentem
  const nodes = [
    { x: 520, y: 700, k: "GELO FINO" },
    { x: 1420, y: 720, k: "ABRIGO" },
    { x: 300, y: 520, k: "ÁGUA ABERTA" },
    { x: 1640, y: 500, k: "CRIATURAS" },
    { x: 760, y: 470, k: "PASSAGEM" },
    { x: 1180, y: 430, k: "" },
  ];
  const north = [
    { x: 960, y: 120 },
    { x: 760, y: 160 },
    { x: 1160, y: 150 },
    { x: 860, y: 60 },
    { x: 1080, y: 40 },
  ];
  return (
    <AbsoluteFill style={{ background: "#040b0d", overflow: "hidden" }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <filter id="vsFog">
            <feTurbulence type="fractalNoise" baseFrequency="0.008 0.02" numOctaves={3} seed={Math.floor(f / 3) % 60} />
            <feColorMatrix values="0 0 0 0 0.36  0 0 0 0 0.4  0 0 0 0 0.43  0 0 0 1.5 -0.2" />
          </filter>
          <linearGradient id="vsFogMask" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fff" stopOpacity={1} />
            <stop offset="45%" stopColor="#fff" stopOpacity={0.95} />
            <stop offset="100%" stopColor="#fff" stopOpacity={0} />
          </linearGradient>
          <filter id="vsEdge">
            <feTurbulence type="fractalNoise" baseFrequency="0.012 0.03" numOctaves={2} seed={Math.floor(f / 4) % 30} />
            <feDisplacementMap in="SourceGraphic" scale={120} />
          </filter>
          <mask id="vsM">
            <rect x={-100} y={-100} width={2120} height={FOGY + 300} fill="url(#vsFogMask)" filter="url(#vsEdge)" />
          </mask>
          <linearGradient id="vsVoid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#020303" stopOpacity={1} />
            <stop offset="60%" stopColor="#020303" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#020303" stopOpacity={0} />
          </linearGradient>
          <filter id="vsGrain">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={1} seed={f % 50} />
            <feColorMatrix values="0 0 0 0 0.6  0 0 0 0 0.65  0 0 0 0 0.68  0 0 0 0.35 0" />
          </filter>
        </defs>
        {/* curvas de nível do terreno, correndo para baixo (o grupo avança) */}
        {Array.from({ length: 26 }).map((_, i) => {
          const y0 = ((i * 46 + scroll) % (26 * 46)) - 40;
          let d = "";
          for (let x = -20; x <= 1940; x += 40) {
            const y = y0 + 18 * Math.sin(x / 210 + i * 1.7) + 10 * Math.sin(x / 77 + i);
            d += `${x === -20 ? "M" : "L"} ${x} ${y.toFixed(1)} `;
          }
          return <path key={i} d={d} fill="none" stroke="rgba(120,190,200,0.16)" strokeWidth={1.4} />;
        })}
        {/* tentando enxergar: sondas curtas que não passam do meio */}
        {f < senseAt
          ? [-0.5, -0.2, 0.15, 0.45].map((a, i) => {
              const L = 200 + 140 * Math.abs(Math.sin(f / 7 + i));
              const ang = -Math.PI / 2 + a;
              return <polyline key={i} points={bolt(G.x, G.y, G.x + Math.cos(ang) * L, G.y + Math.sin(ang) * L, i * 17 + Math.floor(f / 2), 14, 6)} fill="none" stroke={GREEN} strokeWidth={2} opacity={(0.3 + 0.5 * rnd(i + Math.floor(f / 3))) * P(f, tryAt, 10)} />;
            })
          : null}
        {/* sentem adiante: os raios alcançam o terreno e acendem o que existe */}
        {nodes.map((n, i) => {
          const a = P(f, senseAt + i * 5, 12) * spread;
          if (a <= 0) return null;
          const tx = G.x + (n.x - G.x) * a;
          const ty = G.y + (n.y - G.y) * a;
          return (
            <g key={i}>
              <polyline points={bolt(G.x, G.y, tx, ty, i * 19 + Math.floor(f / 2), 24, 10)} fill="none" stroke={GREEN} strokeWidth={2.4} opacity={0.85} style={{ filter: "drop-shadow(0 0 6px #3dff8a)" }} />
              {a >= 1 ? (
                <>
                  <circle cx={n.x} cy={n.y} r={10 + 4 * Math.sin(f / 4 + i)} fill="none" stroke={GREEN} strokeWidth={2} />
                  {n.k ? (
                    <text x={n.x + 18} y={n.y - 14} fill={GREEN} fontFamily={MONO} fontSize={17} letterSpacing={3} opacity={0.85}>
                      {n.k}
                    </text>
                  ) : null}
                </>
              ) : null}
            </g>
          );
        })}
        {/* naquela direção: os raios do norte avançam e são cortados na borda da névoa */}
        {f >= dirAt
          ? north.map((n, i) => {
              const a = P(f, dirAt + i * 4, 18);
              const reach = G.y - (G.y - n.y) * a;
              const ty = Math.max(reach, FOGY + 40 * (f >= fogAt ? 1 : 0) - (f >= fogAt ? 0 : 400));
              const tx = G.x + (n.x - G.x) * ((G.y - ty) / (G.y - n.y));
              const cut = f >= fogAt && reach <= FOGY + 40;
              return (
                <g key={i}>
                  <polyline points={bolt(G.x, G.y, tx, ty, i * 23 + Math.floor(f / 2), 26, 11)} fill="none" stroke={GREEN} strokeWidth={2.4} opacity={0.85} />
                  {cut ? <circle cx={tx} cy={ty} r={6 + 6 * rnd(f + i)} fill="#d8ffe4" opacity={0.8} /> : null}
                </g>
              );
            })
          : null}
        {/* depois: um raio força a entrada e é engolido */}
        {f >= afterAt ? <polyline points={bolt(G.x, G.y, G.x + 20, FOGY + 10 - 30 * P(f, afterAt, 20), 99 + Math.floor(f / 2), 30, 12)} fill="none" stroke={GREEN} strokeWidth={3} opacity={1 - P(f, afterAt + 22, 10)} /> : null}
        {/* a névoa: massa cinza no norte; acima dela, nada */}
        <g opacity={fog} mask="url(#vsM)">
          <rect x={0} y={0} width={1920} height={FOGY + 220} filter="url(#vsFog)" />
        </g>
        {gone > 0 ? (
          <g opacity={gone} mask="url(#vsM)">
            <rect x={0} y={0} width={1920} height={FOGY + 120} fill="url(#vsVoid)" />
            <rect x={0} y={0} width={1920} height={FOGY + 40} filter="url(#vsGrain)" opacity={0.5} />
          </g>
        ) : null}
        {/* o grupo */}
        {[-60, -20, 20, 60].map((dx, i) => (
          <text key={i} x={G.x + dx} y={G.y + 50} textAnchor="middle" fill={GREEN} fontFamily={MONO} fontSize={26}>
            λ
          </text>
        ))}
        <circle cx={G.x} cy={G.y} r={12} fill={GREEN} style={{ filter: "drop-shadow(0 0 10px #3dff8a)" }} />
      </svg>
      <div style={{ position: "absolute", left: 70, top: 56, fontFamily: MONO, color: GREEN, letterSpacing: 6 }}>
        <div style={{ fontSize: 22 }}>VORTIGAUNTS · O QUE ELES SENTEM ADIANTE</div>
      </div>
      {f >= askAt && f < senseAt ? (
        <div style={{ position: "absolute", left: 70, bottom: 90, fontFamily: MONO, fontSize: 30, letterSpacing: 3, color: ICE, opacity: P(f, askAt, 8) }}>
          ALYX · “{typed(f, askAt, "O que vocês estão vendo?", 1.4)}”
        </div>
      ) : null}
      {f >= goneAt ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 150, textAlign: "center", fontFamily: MONO, opacity: P(f, goneAt + 6, 10) }}>
          <div style={{ fontSize: 20, letterSpacing: 10, color: "#9aa6ab" }}>NORTE</div>
          <div style={{ fontSize: 60, letterSpacing: 18, color: "#d6dde0", textShadow: "0 0 30px rgba(0,0,0,0.9), 0 0 60px rgba(0,0,0,0.8)", opacity: 0.75 + 0.25 * Math.sin(f / 3) * (rnd(f) > 0.85 ? 1 : 0) }}>SEM LEITURA</div>
        </div>
      ) : null}
      {f >= neverAt ? (
        <div style={{ position: "absolute", right: 70, bottom: 80, fontFamily: MONO, textAlign: "right", opacity: P(f, neverAt, 8) }}>
          <div style={{ fontSize: 16, letterSpacing: 5, color: GREEN, opacity: 0.8 }}>MEMÓRIA VORTIGAUNT</div>
          <div style={{ fontSize: 30, letterSpacing: 5, color: RED }}>SEM PRECEDENTE</div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// os dois problemas: o radar do HEV com o sinal da Alyx. 1: ela voltou (um ponto, um batimento). 2: um segundo
// sinal se descola de dentro do dela, fora de compasso; o monitor passa a contar dois. No fim a névoa engole tudo.
export const HLTwoSignals: React.FC<{ life: number; oneAt?: number; twoAt?: number; fogAt?: number }> = ({ life, oneAt = 1e9, twoAt = 1e9, fogAt = 1e9 }) => {
  const f = useCurrentFrame();
  const fog = interpolate(f, [fogAt, life - 4], [0, 1], { ...C, easing: Easing.in(Easing.quad) });
  const sep = P(f, twoAt, 40);
  const two = f >= twoAt;
  const CX = 620;
  const CY = 560;
  const R = 330;
  const sweep = (f * 4) % 360;
  const a = { x: CX + 10, y: CY - 40 };
  const b = { x: a.x + 46 * sep + Math.sin(f / 9) * 6 * sep, y: a.y + 30 * sep + Math.cos(f / 7) * 5 * sep };
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 40% 50%, #0b151b 0%, #030506 75%)" }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {[1, 0.66, 0.33].map((k) => (
          <circle key={k} cx={CX} cy={CY} r={R * k} fill="none" stroke="rgba(159,230,255,0.22)" strokeWidth={2} />
        ))}
        <path d={`M ${CX} ${CY} L ${CX + R * Math.cos((sweep * Math.PI) / 180)} ${CY + R * Math.sin((sweep * Math.PI) / 180)} A ${R} ${R} 0 0 0 ${CX + R * Math.cos(((sweep - 40) * Math.PI) / 180)} ${CY + R * Math.sin(((sweep - 40) * Math.PI) / 180)} Z`} fill="rgba(159,230,255,0.1)" />
        <circle cx={a.x} cy={a.y} r={14} fill={ICE} opacity={P(f, oneAt - 10, 8)} />
        <circle cx={a.x} cy={a.y} r={24 + 5 * Math.sin(f / 5)} fill="none" stroke={ICE} strokeWidth={2} opacity={0.5 * P(f, oneAt - 10, 8)} />
        <text x={a.x - 26} y={a.y + 8} textAnchor="end" fill={ICE} fontFamily={MONO} fontSize={24} letterSpacing={3} opacity={P(f, oneAt - 10, 8)}>
          ALYX
        </text>
        {two ? (
          <>
            <circle cx={b.x} cy={b.y} r={12} fill={RED} opacity={0.5 + 0.5 * sep} />
            <circle cx={b.x} cy={b.y} r={22 + 5 * Math.sin(f / 3.3)} fill="none" stroke={RED} strokeWidth={2} opacity={0.6 * sep} />
            <text x={b.x + 26} y={b.y + 8} fill={RED} fontFamily={MONO} fontSize={24} letterSpacing={3} opacity={P(f, twoAt + 18, 8)}>
              ?
            </text>
          </>
        ) : null}
      </svg>
      <div style={{ position: "absolute", left: 70, top: 56, fontFamily: MONO, color: ICE, letterSpacing: 6 }}>
        <div style={{ fontSize: 22 }}>H.E.V. · ESCOLTA · ALYX VANCE</div>
      </div>
      {/* direita: os dois problemas e os sinais vitais */}
      <div style={{ position: "absolute", left: 1080, top: 240, width: 720, fontFamily: MONO }}>
        <div style={{ fontSize: 20, letterSpacing: 8, color: AMB, opacity: P(f, 0, 10) }}>DOIS PROBLEMAS</div>
        <div style={{ marginTop: 26, display: "flex", gap: 22, alignItems: "baseline", opacity: f >= oneAt ? flickIn(f, oneAt) : 0 }}>
          <span style={{ fontSize: 40, color: AMB }}>1</span>
          <span style={{ fontSize: 46, letterSpacing: 3, color: CREAM }}>A ALYX VOLTOU</span>
        </div>
        <div style={{ marginTop: 10, opacity: f >= oneAt ? P(f, oneAt, 10) : 0, position: "relative", height: 90 }}>
          <div style={{ position: "absolute", inset: 0 }}>
            <Ecg f={f} bpm={74} jitter={0} col={ICE} w={700} h={90} />
          </div>
          {two ? (
            <div style={{ position: "absolute", inset: 0, transform: `translateY(${sep * 6}px)`, opacity: sep }}>
              <Ecg f={f + 11} bpm={97} jitter={1} col={RED} w={700} h={90} />
            </div>
          ) : null}
        </div>
        <div style={{ marginTop: 26, display: "flex", gap: 22, alignItems: "baseline", opacity: two ? flickIn(f, twoAt) : 0, transform: `translateX(${two && f < twoAt + 8 ? (rnd(f) - 0.5) * 24 : 0}px)` }}>
          <span style={{ fontSize: 40, color: RED }}>2</span>
          <span style={{ fontSize: 46, letterSpacing: 3, color: CREAM }}>ALGUMA COISA VOLTOU COM ELA</span>
        </div>
        <div style={{ marginTop: 18, fontSize: 22, letterSpacing: 5, color: RED, opacity: two ? P(f, twoAt + 20, 10) : 0 }}>SINAIS VITAIS DETECTADOS: 2</div>
      </div>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: fog }}>
        <defs>
          <filter id="tsFog">
            <feTurbulence type="fractalNoise" baseFrequency="0.008 0.02" numOctaves={3} seed={Math.floor(f / 3) % 60} />
            <feColorMatrix values="0 0 0 0 0.36  0 0 0 0 0.4  0 0 0 0 0.43  0 0 0 1.6 -0.1" />
          </filter>
        </defs>
        <rect width={1920} height={1080} filter="url(#tsFog)" />
      </svg>
      <AbsoluteFill style={{ background: "#0b0d0e", opacity: interpolate(f, [life - 18, life], [0, 1], C) }} />
    </AbsoluteFill>
  );
};
