// =================================================================================================
// HL3 · REFORMULAÇÃO · 5B/5C "a chegada", "dentro do navio", "a Alyx sabe o caminho", "o objetivo muda" (06/10/2026)
//  · HLRArrive: o mesmo campo de gelo da espera → no quadro seguinte o Borealis está no alvo (sem clarão) → escala
//    (snowcat × navio) → preso no gelo (neve, pingentes) → antes/depois (4 s antes: vazio) → a janela calculada →
//    a câmera vai até a escotilha do casco
//  · HLRShipEnter: primeira pessoa num corredor do navio (anteparas, tubos, gelo, placas da Aperture) com o HUD do
//    HEV; o objetivo se monta; o holograma do teleporte; a varredura de energia (o que ainda funciona)
//  · HLRMaze: o Borealis como labirinto (névoa onde ninguém viu); lapsos da Alyx; ela olha a porta antes da fase
//    mudar; sabe o caminho; bifurcação: LABS DA APERTURE × a direção que ela aponta (cone no escuro: NÚCLEO ?);
//    "Eu não sei. Eu só sei que a gente precisa chegar lá."
//  · HLRObjectives: cartões de vidro do diário do HEV se reordenam: O NÚCLEO sobe para o topo
// =================================================================================================
import React, { useMemo } from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { FONT, MONO } from "./overlays";
import { C, HL, rnd } from "./hl3";
import { FilmLook } from "./hl3r";
import { ShipProfile } from "./hl3rd";
import { Dust, Eye, Face, Hud, Lights, RoomView, V3, proj } from "./hl3rf";
import { buildShipHall2 } from "./hl3rx";

const RED = "#ff5d4d";
const CREAM = "#ffe2b0";
const ICE = "#9fe6ff";
const GREEN = "#8dffa8";
const ORANGE = HL.orange;
const AMB = "#ffb22e";
const APT = "#f39a1c"; // laranja das placas da Aperture
const TXT = HL.text;
const P = (f: number, at: number, d = 12) => interpolate(f, [at, at + d], [0, 1], { ...C, easing: Easing.out(Easing.cubic) });
const IO = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

// ---------------------------------------------------------------- campo de gelo à noite (o mesmo da espera)
const ridge = (seed: number, base: number, amp: number) => {
  let d = `M -20 1100 L -20 ${base} `;
  for (let x = -20; x <= 1960; x += 20) d += `L ${x} ${(base - amp * (0.5 + 0.5 * Math.sin(x / 140 + seed) * Math.sin(x / 57 + seed * 2))).toFixed(1)} `;
  return d + "L 1960 1100 Z";
};
const IceNight: React.FC<{ f: number; children?: React.ReactNode; snowcat?: boolean }> = ({ f, children, snowcat = true }) => {
  const stars = useMemo(() => Array.from({ length: 180 }).map((_, i) => ({ r: 80 + rnd(i * 2.3) * 1300, a: rnd(i * 4.1) * Math.PI * 2, s: 0.8 + rnd(i * 6.1) * 1.6 })), []);
  const ang = 2.2 + f * 0.0006;
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
      <defs>
        <linearGradient id="skyA" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#02040a" />
          <stop offset="0.7" stopColor="#0b1a26" />
        </linearGradient>
      </defs>
      <rect width={1920} height={1080} fill="url(#skyA)" />
      <path d={`M -100 ${300 + Math.sin(f / 40) * 20} C 400 160, 900 360, 2000 220 L 2000 420 C 1100 520, 600 330, -100 480 Z`} fill="rgba(141,255,168,0.06)" />
      {stars.map((s, i) => {
        const a0 = s.a + ang;
        const x = 960 + Math.cos(a0) * s.r;
        const y = -260 + Math.sin(a0) * s.r * 0.9;
        return y > 720 ? null : <circle key={i} cx={x} cy={y} r={s.s} fill="#e6f2ff" opacity={0.7} />;
      })}
      <path d={ridge(1.2, 700, 40)} fill="#0e1d27" />
      <path d={ridge(2.7, 760, 34)} fill="#0b1720" />
      {children}
      <path d={ridge(4.1, 840, 26)} fill="#081118" />
      {snowcat ? (
        <g transform="translate(40 860)">
          <path d="M 0 60 L 20 0 L 200 0 L 230 30 L 260 30 L 270 60 Z" fill="#05090c" stroke="rgba(159,230,255,0.25)" />
          <rect x={-10} y={60} width={290} height={34} rx={14} fill="#04070a" stroke="rgba(159,230,255,0.2)" />
          <path d={`M 268 40 L 1100 ${-160 + Math.sin(f / 30) * 6} L 1100 ${10 + Math.sin(f / 30) * 6} Z`} fill="rgba(255,244,210,0.07)" />
          <circle cx={266} cy={40} r={6} fill="#fff4d0" />
        </g>
      ) : null}
      {Array.from({ length: 90 }).map((_, i) => {
        const x = (((rnd(i * 2.1) * 2100 + f * (3 + rnd(i) * 5)) % 2100) + 2100) % 2100 - 90;
        const y = (((rnd(i * 3.7) * 1100 + f * (1 + rnd(i * 5) * 2)) % 1100) + 1100) % 1100;
        return <circle key={"n" + i} cx={x} cy={y} r={0.8 + rnd(i * 7) * 1.8} fill="#eaf6ff" opacity={0.35} />;
      })}
    </svg>
  );
};

// ---------------------------------------------------------------- a chegada
type AP = { life: number; emptyAt?: number; shipAt?: number; hugeAt?: number; stuckAt?: number; yearsAt?: number; notAt?: number; calcAt?: number; enoughAt?: number; goAt?: number; enterAt?: number };
const SX = 0.95; // escala do perfil (1000 × 300) no gelo
const SHX = 1110 - 500 * SX;
const SHY = 735 - 290 * SX;
export const HLRArrive: React.FC<AP> = (p) => {
  const f = useCurrentFrame();
  const a = (v?: number) => v ?? 1e9;
  const [emptyAt, shipAt, hugeAt, stuckAt, yearsAt, notAt, calcAt, enoughAt, goAt, enterAt] = [p.emptyAt, p.shipAt, p.hugeAt, p.stuckAt, p.yearsAt, p.notAt, p.calcAt, p.enoughAt, p.goAt, p.enterAt].map(a);
  const life = p.life;
  const ship = f >= shipAt;
  const frost = P(f, stuckAt, 40);
  const split = f >= notAt && f < calcAt + 10 ? P(f, notAt, 10) * (1 - P(f, calcAt, 10)) : 0;
  const push = IO((f - goAt) / Math.max(20, life - goAt));
  const hatch = { x: SHX + 600 * SX, y: SHY + 225 * SX };
  const win = 41 * 60 - Math.max(0, f - calcAt) / 30;
  return (
    <AbsoluteFill style={{ background: "#03060a", overflow: "hidden" }}>
      {/* começa com o mesmo zoom em que a espera terminou (1,12 no mesmo centro) e volta ao enquadramento até o navio */}
      <AbsoluteFill style={{ transform: `scale(${1 + 0.12 * (1 - IO(f / Math.max(20, shipAt - 6)))})`, transformOrigin: "60% 62%" }}>
      <AbsoluteFill style={{ transform: `scale(${1 + push * 5})`, transformOrigin: `${hatch.x}px ${hatch.y}px` }}>
        <IceNight f={f}>
          {/* luz dos holofotes da expedição no casco */}
          {ship ? <ellipse cx={1110} cy={640} rx={560} ry={150} fill="rgba(255,244,210,0.05)" /> : null}
          {/* o alvo no gelo */}
          <g transform="translate(1150 735)" opacity={ship ? 0.35 : 1}>
            <ellipse rx={260} ry={36} fill="none" stroke={ORANGE} strokeWidth={2} strokeDasharray="10 8" />
          </g>
          {/* o navio: simplesmente está ali */}
          {ship ? (
            <g>
              <defs>
                <clipPath id="arrSplit">
                  <rect x={-100} y={0} width={3000} height={1100} />
                </clipPath>
              </defs>
              <g clipPath="url(#arrSplit)">
                <g transform={`translate(${SHX} ${SHY}) scale(${SX})`}>
                  <ShipProfile stroke="rgba(170,210,228,0.8)" fill="#070d12" w={2.2} rust={0.35} seed={4} />
                  {/* janelas acesas (poucas) */}
                  {[[94, 124], [140, 124], [186, 124], [127, 82]].map(([x, y], i) => (
                    <rect key={i} x={x} y={y} width={14} height={10} fill="#ffd894" opacity={0.5 + 0.4 * Math.sin(f / 20 + i)} />
                  ))}
                  {/* gelo acumulado: neve no convés, pingentes e o gelo subindo pelo casco */}
                  <g opacity={frost}>
                    <path d="M 70 110 L 250 110 M 90 70 L 230 70 M 110 40 L 200 40 M 300 176 L 860 176" stroke="#e8f6ff" strokeWidth={5} strokeLinecap="round" />
                    {Array.from({ length: 34 }).map((_, k) => {
                      const x = 60 + k * 26;
                      const h = 8 + rnd(k * 3.3) * 22;
                      return <path key={k} d={`M ${x - 4} ${210} L ${x} ${210 + h} L ${x + 4} ${210} Z`} fill="#d8eef8" opacity={0.85} />;
                    })}
                    <path d="M 0 290 Q 120 236 240 268 T 520 262 T 800 270 T 1000 262 L 1000 300 L 0 300 Z" fill="#cfe4ee" opacity={0.55} />
                  </g>
                  {/* a escotilha (por onde entram) */}
                  {f >= goAt ? <rect x={584} y={204} width={32} height={40} rx={4} fill="#ffe7b0" opacity={0.4 + 0.6 * P(f, goAt, 20)} /> : null}
                </g>
              </g>
            </g>
          ) : null}
        </IceNight>
      </AbsoluteFill>
      </AbsoluteFill>
      {/* escala: snowcat × navio */}
      {f >= hugeAt && f < notAt ? (
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: P(f, hugeAt, 10) * (1 - P(f, notAt - 10, 10)) }}>
          <line x1={SHX} x2={SHX + 1000 * SX} y1={SHY - 40} y2={SHY - 40} stroke={CREAM} strokeWidth={2} />
          <line x1={SHX} x2={SHX} y1={SHY - 52} y2={SHY - 28} stroke={CREAM} strokeWidth={2} />
          <line x1={SHX + 1000 * SX} x2={SHX + 1000 * SX} y1={SHY - 52} y2={SHY - 28} stroke={CREAM} strokeWidth={2} />
          <text x={SHX + 500 * SX} y={SHY - 54} textAnchor="middle" fill={CREAM} fontFamily={MONO} fontSize={20} letterSpacing={4}>
            BOREALIS · ~200 M
          </text>
          <line x1={40} x2={310} y1={846} y2={846} stroke={ICE} strokeWidth={2} />
          <text x={175} y={836} textAnchor="middle" fill={ICE} fontFamily={MONO} fontSize={16} letterSpacing={3}>
            SNOWCAT · 6 M
          </text>
        </svg>
      ) : null}
      {/* "não estava aqui": a imagem inteira, sem corte no meio (pedido dele 08/10), só o texto */}
      {split > 0 ? (
        <div style={{ position: "absolute", left: 80, top: 110, opacity: split, pointerEvents: "none" }}>
          <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 92, color: TXT, lineHeight: 1 }}>não estava aqui</div>
        </div>
      ) : null}
      {/* textos */}
      {f < shipAt ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 150, textAlign: "center", fontFamily: MONO, fontSize: 22, letterSpacing: 8, color: ICE, opacity: P(f, emptyAt, 10) }}>
          EXTENSÃO VAZIA DE GELO
        </div>
      ) : null}
      {ship && f < notAt ? (
        <div style={{ position: "absolute", left: 80, top: 110, opacity: P(f, shipAt + 4, 10) * (1 - P(f, notAt - 8, 8)) }}>
          <div style={{ fontFamily: MONO, fontSize: 16, letterSpacing: 6, color: ORANGE }}>{f >= stuckAt ? "PRESO NO GELO" : "SEM CLARÃO · SEM PORTAL"}</div>
          <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 92, color: TXT, lineHeight: 1 }}>{f >= yearsAt ? "como se estivesse há anos" : "o Borealis está ali"}</div>
        </div>
      ) : null}
      {f >= calcAt ? (
        <div style={{ position: "absolute", right: 80, top: 110, textAlign: "right", opacity: P(f, calcAt, 10) * (1 - push * 2) }}>
          <div style={{ fontFamily: MONO, fontSize: 16, letterSpacing: 6, color: CREAM }}>CÁLCULO DA MOSSMAN · JANELA</div>
          <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 110, color: TXT, lineHeight: 1 }}>{`${Math.floor(win / 60)}:${String(Math.floor(win % 60)).padStart(2, "0")}`}</div>
          {f >= enoughAt ? <div style={{ fontFamily: MONO, fontSize: 22, letterSpacing: 5, color: GREEN, opacity: P(f, enoughAt, 8) }}>SUFICIENTE PARA ENTRAR ✓</div> : null}
        </div>
      ) : null}
      <AbsoluteFill style={{ background: "#000", opacity: interpolate(f, [enterAt + 10, life], [0, 1], C), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- dentro do navio: corredor em primeira pessoa
export const buildShipCorridor = (): Face[] => {
  // 11/10 (pedido dele: corredores do estilo antigo, sem detalhe): a base é o corredor do padrão novo (buildShipHall2, o
  // do piloto); daqui só ficam a porta do LAB 4, as placas da Aperture e o fundo. Peças do corredor que cairiam em cima
  // da porta ou das placas saem.
  const keepOut: [number, number, number][] = [[-1, 8.1, 10.7], [1, 20.8, 22.6], [-1, 32.8, 34.6], [1, 44.8, 46.6]];
  const base: Face[] = buildShipHall2(60)
    .filter((fc) => {
      const n = fc.p.length;
      const cx = fc.p.reduce((s, q) => s + q[0], 0) / n;
      const ys = fc.p.map((q) => q[1]);
      const onWall = fc.p.every((q) => Math.abs(Math.abs(q[0]) - 2.2) < 0.001);
      if (onWall) return true;
      return !keepOut.some(([side, y0, y1]) => Math.sign(cx) === side && Math.abs(cx) > 1.6 && Math.max(...ys) > y0 && Math.min(...ys) < y1);
    })
    .map((fc) => ({ p: fc.p, col: fc.col, n: fc.n, kind: fc.emit && fc.emit > 0.8 && fc.col[0] > 240 && fc.col[2] > 180 ? ("lamp" as const) : undefined }));
  const F: Face[] = [...base];
  const LEGACY = false;
  const quad = (a: V3, b: V3, c: V3, d: V3, col: [number, number, number], n: V3, kind?: Face["kind"]) => F.push({ p: [a, b, c, d], col, n, kind });
  const W = 2.2;
  const H = 3.0;
  for (let j = 0; j < (LEGACY ? 30 : 0); j++) {
    const y0 = j * 2;
    const frost = rnd(j * 3.3) > 0.55;
    const wall: [number, number, number] = frost ? [84, 100, 108] : [52, 55, 54];
    const k = j % 2 ? 1 : 0.9;
    quad([-W, y0, 0], [W, y0, 0], [W, y0 + 2, 0], [-W, y0 + 2, 0], [60 * k, 60 * k, 58 * k], [0, 0, 1]);
    quad([-W, y0, H], [-W, y0 + 2, H], [W, y0 + 2, H], [W, y0, H], [40, 42, 44], [0, 0, -1]);
    // paredes em duas faixas
    quad([-W, y0, 0], [-W, y0 + 2, 0], [-W, y0 + 2, 1.2], [-W, y0, 1.2], [58, 60, 58], [1, 0, 0]);
    quad([-W, y0, 1.2], [-W, y0 + 2, 1.2], [-W, y0 + 2, H], [-W, y0, H], wall, [1, 0, 0]);
    quad([W, y0 + 2, 0], [W, y0, 0], [W, y0, 1.2], [W, y0 + 2, 1.2], [58, 60, 58], [-1, 0, 0]);
    quad([W, y0 + 2, 1.2], [W, y0, 1.2], [W, y0, H], [W, y0 + 2, H], rnd(j * 7.1) > 0.6 ? [84, 100, 108] : [52, 55, 54], [-1, 0, 0]);
    // anteparas (moldura da porta estanque) a cada 6 m
    if (j % 3 === 0) {
      const y = y0 + 0.01;
      const c: [number, number, number] = [44, 46, 44];
      quad([-W, y, 0], [-1.3, y, 0], [-1.3, y, H], [-W, y, H], c, [0, -1, 0]);
      quad([1.3, y, 0], [W, y, 0], [W, y, H], [1.3, y, H], c, [0, -1, 0]);
      quad([-1.3, y, 2.4], [1.3, y, 2.4], [1.3, y, H], [-1.3, y, H], c, [0, -1, 0]);
      quad([-1.3, y, 0], [1.3, y, 0], [1.3, y, 0.25], [-1.3, y, 0.25], c, [0, -1, 0]);
    }
    // luminárias
    if (j % 2 === 0) quad([-0.4, y0 + 0.6, H - 0.02], [-0.4, y0 + 1.4, H - 0.02], [0.4, y0 + 1.4, H - 0.02], [0.4, y0 + 0.6, H - 0.02], [255, 236, 200], [0, 0, -1], "lamp");
  }
  // tubos no teto (caixas finas ao longo)
  (LEGACY ? [[-1.7, 2.7], [1.6, 2.6]] : []).forEach(([x, z]) => {
    quad([x - 0.12, 0, z], [x + 0.12, 0, z], [x + 0.12, 60, z], [x - 0.12, 60, z], [110, 112, 106], [0, 0, -1]);
    quad([x - 0.12, 0, z - 0.2], [x - 0.12, 60, z - 0.2], [x - 0.12, 60, z], [x - 0.12, 0, z], [80, 82, 78], [1, 0, 0]);
  });
  // placas da Aperture (laranja) nas paredes
  [[21, 1], [33, -1], [45, 1]].forEach(([y, side]) => {
    const x = side * 2.19;
    quad([x, y, 1.6], [x, y + 1.4, 1.6], [x, y + 1.4, 2.2], [x, y, 2.2], [243, 154, 28], [-side, 0, 0], "sign");
  });
  // 08/10 (pedido dele: "a tecnologia da Aperture" era só uma plaquinha amarela): a porta do LAB 4 da Aperture na parede
  // esquerda — batente escuro, duas folhas claras com a junta no meio, faixa de luz laranja em cima (o logo é desenhado
  // por cima, em perspectiva, no HLRShipEnter)
  {
    const x = -W + 0.015;
    const x2 = -W + 0.03;
    const fr: [number, number, number] = [26, 28, 30];
    quad([x, 8.3, 0], [x, 8.5, 0], [x, 8.5, 2.5], [x, 8.3, 2.5], fr, [1, 0, 0]);
    quad([x, 10.3, 0], [x, 10.5, 0], [x, 10.5, 2.5], [x, 10.3, 2.5], fr, [1, 0, 0]);
    quad([x, 8.3, 2.32], [x, 10.5, 2.32], [x, 10.5, 2.5], [x, 8.3, 2.5], fr, [1, 0, 0]);
    quad([x2, 8.5, 0.02], [x2, 9.38, 0.02], [x2, 9.38, 2.3], [x2, 8.5, 2.3], [206, 210, 212], [1, 0, 0]);
    quad([x2, 9.42, 0.02], [x2, 10.3, 0.02], [x2, 10.3, 2.3], [x2, 9.42, 2.3], [200, 204, 206], [1, 0, 0]);
    quad([x2 + 0.01, 8.4, 2.36], [x2 + 0.01, 10.4, 2.36], [x2 + 0.01, 10.4, 2.44], [x2 + 0.01, 8.4, 2.44], [243, 154, 28], [1, 0, 0], "sign");
  }
  // fundo
  quad([W, 60, 0], [-W, 60, 0], [-W, 60, H], [W, 60, H], [30, 34, 38], [0, -1, 0]);
  return F;
};
type EP = { life: number; nobodyAt?: number; missionAt?: number; beforeAt?: number; techAt?: number; mossAt?: number; teleAt?: number; ideaAt?: number; workingAt?: number; whatAt?: number };
export const HLRShipEnter: React.FC<EP> = (p) => {
  const f = useCurrentFrame();
  const a = (v?: number) => v ?? 1e9;
  const [nobodyAt, missionAt, beforeAt, techAt, mossAt, teleAt, ideaAt, workingAt, whatAt] = [p.nobodyAt, p.missionAt, p.beforeAt, p.techAt, p.mossAt, p.teleAt, p.ideaAt, p.workingAt, p.whatAt].map(a);
  const life = p.life;
  const faces = useMemo(() => buildShipCorridor(), []);
  const walk = interpolate(f, [0, life], [1.2, 17], C);
  const lookSign = IO((f - techAt) / 16) * (1 - IO((f - mossAt) / 16));
  const yaw = Math.sin(f / 70) * 0.05 - 0.55 * lookSign;
  const e: Eye = { x: 0.2 * Math.sin(f / 40), y: walk, z: 1.7 + Math.sin(f / 4.6) * 0.03, yaw, pitch: -0.03, F: 900 };
  const L: Lights = { flash: 0.7, lamps: 0.22 + (f >= workingAt && Math.floor(f / 4) % 5 === 0 ? 0.2 : 0), red: 0, strobe: 0 };
  // objetivo do HEV
  const obj: [number, string, string][] = [
    [0, "OBJETIVO", "???"],
    [missionAt, "MISSÃO", "chegar ao navio antes dos Combine ✓"],
    [techAt, "MISSÃO", "a tecnologia da Aperture"],
    [teleAt, "HIPÓTESE DA MOSSMAN", "os sistemas de teleporte"],
    [ideaAt, "AGORA", "achar algo que ainda funcione"],
  ];
  const cur = obj.filter((o) => f >= o[0]).pop()!;
  const holo = P(f, teleAt - 4, 14) * (1 - P(f, ideaAt + 10, 12));
  const scan = interpolate(f, [workingAt - 10, workingAt + 40], [0, 1], C);
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <RoomView e={e} L={L} f={f} faces={faces} />
      <Dust f={f} e={e} />
      {/* rótulos das placas */}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {(() => {
          // o logo: um círculo de raio R na parede esquerda (x fixo), centrado acima da porta → transformação afim
          const R = 0.34;
          const c = proj(e, [-2.15, 9.4, 1.55]);
          const ux = proj(e, [-2.15, 9.4 + R, 1.55]);
          const uz = proj(e, [-2.15, 9.4, 1.55 + R]);
          if (!c || !ux || !uz || c.d > 16) return null;
          const m = `matrix(${ux.x - c.x} ${ux.y - c.y} ${uz.x - c.x} ${uz.y - c.y} ${c.x} ${c.y})`;
          return (
            <g transform={m} opacity={Math.min(1, 7 / c.d) * Math.min(1, Math.max(0, (c.d - 2.4) / 1.2))}>
              <circle r={1} fill="#e9ecee" />
              <circle r={0.92} fill="#1c2226" />
              {[0, 1, 2, 3, 4, 5, 6, 7].map((k) => (
                <path key={k} d="M 0.07 0.9 L 0.2 0.9 L 0.42 0.36 L 0.29 0.3 Z" fill="#e9ecee" transform={`rotate(${k * 45})`} />
              ))}
              <circle r={0.4} fill="#e9ecee" />
              <circle r={0.4} fill="none" stroke="#1c2226" strokeWidth={0.05} />
            </g>
          );
        })()}
        {[[9.7, -1, "APERTURE SCIENCE · LAB 4"], [21.7, 1, "TELEPORTE · SETOR 7"], [33.7, -1, "HANGAR B"]].map(([y, side, t], i) => {
          const q = proj(e, [(side as number) * 2.1, y as number, 2.35]);
          if (!q || q.d > 18) return null;
          return (
            <text key={i} x={q.x} y={q.y} textAnchor="middle" fill={APT} fontFamily={MONO} fontSize={Math.min(30, Math.max(10, 180 / q.d))} letterSpacing={2} opacity={Math.min(1, 6 / q.d) * Math.min(1, Math.max(0, (q.d - 2.2) / 1.5))}>
              {t}
            </text>
          );
        })}
        {/* varredura de energia: corre pelo corredor; o setor 7 responde */}
        {scan > 0 && scan < 1
          ? (() => {
              const y = 2 + scan * 50;
              const q0 = proj(e, [-2.1, y, 0]);
              const q1 = proj(e, [2.1, y, 0]);
              const q2 = proj(e, [2.1, y, 3]);
              const q3 = proj(e, [-2.1, y, 3]);
              if (!q0 || !q1 || !q2 || !q3) return null;
              return <polygon points={`${q0.x},${q0.y} ${q1.x},${q1.y} ${q2.x},${q2.y} ${q3.x},${q3.y}`} fill="none" stroke={GREEN} strokeWidth={3} opacity={0.8} />;
            })()
          : null}
      </svg>
      {/* holograma do teleporte (o que a Mossman procura) */}
      {holo > 0 ? (
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: holo }}>
          {[0, 1, 2, 3].map((k) => (
            <ellipse key={k} cx={1380} cy={430 + k * 46} rx={150 - k * 14} ry={34 - k * 3} fill="none" stroke={ICE} strokeWidth={2} strokeDasharray={`${40 + k * 10} 12`} strokeDashoffset={f * (k % 2 ? 3 : -3)} />
          ))}
          <line x1={1380} x2={1380} y1={400} y2={620} stroke={ICE} strokeWidth={1.5} strokeDasharray="4 6" />
          <text x={1380} y={680} textAnchor="middle" fill={ICE} fontFamily={MONO} fontSize={18} letterSpacing={4}>
            TELEPORTE · APERTURE
          </text>
        </svg>
      ) : null}
      {/* quadro do objetivo */}
      <div style={{ position: "absolute", left: 70, top: 140, width: 560, padding: "14px 20px", background: "rgba(10,8,2,0.62)", borderLeft: `4px solid ${AMB}`, borderRadius: 8, fontFamily: MONO, opacity: P(f, nobodyAt - 6, 10) }}>
        <div style={{ fontSize: 15, letterSpacing: 5, color: AMB }}>{cur[1]}</div>
        <div key={cur[2]} style={{ fontFamily: FONT, fontWeight: 800, fontSize: 40, color: TXT, lineHeight: 1.1, marginTop: 4, opacity: P(f, cur[0], 8) }}>{cur[2]}</div>
      </div>
      {f >= workingAt ? (
        <div style={{ position: "absolute", left: 70, top: 280, fontFamily: MONO, fontSize: 18, letterSpacing: 4, color: GREEN, opacity: P(f, workingAt + 30, 8) }}>
          SETOR 7 · ENERGIA ✓{f >= whatAt ? "  ·  O QUE ACONTECEU AQUI?" : ""}
        </div>
      ) : null}
      <Hud f={f} yaw={yaw} eye={e} blips={[]} msg={f < missionAt ? "DENTRO DO BOREALIS" : undefined} msgCol={ICE} o={P(f, 4, 10)} />
      <AbsoluteFill style={{ background: "#000", opacity: interpolate(f, [0, 10], [1, 0], C) + interpolate(f, [life - 6, life], [0, 1], C), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- o labirinto
const MW = 28;
const MH = 15;
type Maze = { right: boolean[][]; down: boolean[][] }; // aberto para a direita / para baixo
// 08/10/2026 (pedido dele): o labirinto tem que ser o NAVIO — casco visto de cima, anteparas, compartimentos
const HULL_HW = (c: number) => (c <= 19 ? 7.5 : 7.5 * Math.max(0, 1 - Math.pow((c + 0.5 - 19) / 9, 1.7)));
const inHull = (r: number, c: number) => c >= 0 && c < MW && r >= 0 && r < MH && Math.abs(r + 0.5 - 7.5) <= HULL_HW(c);
const BULKHEADS = [5, 11, 17, 22]; // anteparas (paredes grossas depois destas colunas)
const ROOMS: [number, number, string][] = [[2.5, 7.5, "POPA · MÁQUINAS"], [8, 7.5, "ALOJAMENTOS"], [14, 7.5, "LABORATÓRIOS"], [19.5, 7.5, "PORÕES"], [24.3, 7.5, "PROA"]];
const STAIRS: [number, number][] = [[3, 2], [12, 9], [4, 15], [10, 20]];
const makeMaze = (): Maze => {
  const right = Array.from({ length: MH }, () => Array(MW).fill(false));
  const down = Array.from({ length: MH }, () => Array(MW).fill(false));
  const seen = Array.from({ length: MH }, () => Array(MW).fill(false));
  const st: [number, number][] = [[7, 0]];
  seen[7][0] = true;
  let k = 0;
  while (st.length) {
    const [r, c] = st[st.length - 1];
    const nb: [number, number, number][] = [];
    if (inHull(r, c + 1) && !seen[r][c + 1]) nb.push([r, c + 1, 0]);
    if (inHull(r, c - 1) && !seen[r][c - 1]) nb.push([r, c - 1, 1]);
    if (inHull(r + 1, c) && !seen[r + 1][c]) nb.push([r + 1, c, 2]);
    if (inHull(r - 1, c) && !seen[r - 1][c]) nb.push([r - 1, c, 3]);
    if (!nb.length) {
      st.pop();
      continue;
    }
    const [nr, nc, dir] = nb[Math.floor(rnd(k++ * 1.73 + 0.5) * nb.length)];
    if (dir === 0) right[r][c] = true;
    if (dir === 1) right[r][nc] = true;
    if (dir === 2) down[r][c] = true;
    if (dir === 3) down[nr][c] = true;
    seen[nr][nc] = true;
    st.push([nr, nc]);
  }
  // alguns laços extras (navio tem mais de um caminho)
  for (let i = 0; i < 60; i++) {
    const r = Math.floor(rnd(i * 9.1) * MH);
    const c = Math.floor(rnd(i * 4.7) * (MW - 1));
    if (inHull(r, c) && inHull(r, c + 1) && !BULKHEADS.includes(c)) right[r][c] = true;
  }
  return { right, down };
};
const bfs = (m: Maze, s: [number, number], t: [number, number]) => {
  const prev = new Map<string, string>();
  const q: [number, number][] = [s];
  const key = (r: number, c: number) => `${r},${c}`;
  prev.set(key(...s), "");
  while (q.length) {
    const [r, c] = q.shift()!;
    if (r === t[0] && c === t[1]) break;
    const nbs: [number, number, boolean][] = [
      [r, c + 1, c + 1 < MW && m.right[r][c]],
      [r, c - 1, c - 1 >= 0 && m.right[r][c - 1]],
      [r + 1, c, r + 1 < MH && m.down[r][c]],
      [r - 1, c, r - 1 >= 0 && m.down[r - 1][c]],
    ];
    for (const [nr, nc, ok] of nbs) {
      if (ok && !prev.has(key(nr, nc))) {
        prev.set(key(nr, nc), key(r, c));
        q.push([nr, nc]);
      }
    }
  }
  const path: [number, number][] = [];
  let cur = key(...t);
  while (cur) {
    const [r, c] = cur.split(",").map(Number);
    path.unshift([r, c]);
    cur = prev.get(cur) ?? "";
  }
  return path;
};
type MP = { life: number; worseAt?: number; lapseAt?: number; stopAt?: number; lookAt?: number; phaseAt?: number; knowAt?: number; neverAt?: number; forkAt?: number; labsAt?: number; noAt?: number; coreAt?: number; askAt?: number; pauseAt?: number; sayAt?: number; mustAt?: number };
export const HLRMaze: React.FC<MP> = (p) => {
  const f = useCurrentFrame();
  const a = (v?: number) => v ?? 1e9;
  const [worseAt, lapseAt, stopAt, lookAt, phaseAt, knowAt, neverAt, forkAt, labsAt, noAt, coreAt, askAt, pauseAt, sayAt, mustAt] = [p.worseAt, p.lapseAt, p.stopAt, p.lookAt, p.phaseAt, p.knowAt, p.neverAt, p.forkAt, p.labsAt, p.noAt, p.coreAt, p.askAt, p.pauseAt, p.sayAt, p.mustAt].map(a);
  const life = p.life;
  const maze = useMemo(() => makeMaze(), []);
  const FORK: [number, number] = [7, 15];
  const path = useMemo(() => bfs(maze, [7, 0], FORK), [maze]);
  const LABS = useMemo(() => bfs(maze, FORK, [1, 22]), [maze]);
  // câmera (plano inclinado)
  const CS = 58;
  const X0 = 960 - (MW * CS) / 2;
  const Y0 = 560 - (MH * CS) / 2;
  const zoomT = IO((f - forkAt + 10) / 30);
  // posição do grupo ao longo do caminho (para no meio; anda; chega à bifurcação)
  const t = interpolate(f, [0, stopAt, stopAt + 40, forkAt], [0, 0.45, 0.45, 1], C);
  const pos = (() => {
    const L = path.length - 1;
    const x = t * L;
    const i = Math.min(L - 1, Math.floor(x));
    const k = x - i;
    const [r0, c0] = path[i];
    const [r1, c1] = path[Math.min(L, i + 1)];
    return [X0 + (c0 + (c1 - c0) * k + 0.5) * CS, Y0 + (r0 + (r1 - r0) * k + 0.5) * CS];
  })();
  const sc = 1 + 0.9 * zoomT;
  const cx = 960 + (pos[0] - 960) * zoomT;
  const cy = 540 + (pos[1] - 540) * zoomT;
  const tf = `translate(960 540) scale(${sc}) translate(${-cx} ${-cy})`;
  // névoa: só o que o grupo já viu (perto do caminho percorrido) aparece; o resto é escuro
  const seen = (r: number, c: number) => {
    const x = X0 + (c + 0.5) * CS;
    const y = Y0 + (r + 0.5) * CS;
    const d = Math.hypot(x - pos[0], y - pos[1]);
    let v = Math.max(0, 1 - d / 520);
    // a linha de previsão dela revela um pouco à frente
    if (f >= knowAt) {
      const ahead = path.slice(Math.floor(t * (path.length - 1)), Math.floor(t * (path.length - 1)) + 10);
      for (const [rr, cc] of ahead) if (Math.abs(rr - r) + Math.abs(cc - c) <= 1) v = Math.max(v, 0.55 * P(f, knowAt, 20));
    }
    return Math.max(0.1, v);
  };
  // 08/10 (pedido dele: um "health check" acompanhando a piora): os lapsos ficam mais frequentes — o intervalo encurta
  const LAPS = useMemo(() => {
    const out: number[] = [];
    let t0 = lapseAt;
    let gap = 140;
    while (t0 < forkAt && out.length < 40) {
      out.push(t0);
      t0 += gap;
      gap = Math.max(46, gap * 0.82);
    }
    return out;
  }, [lapseAt, forkAt]);
  const lapse = LAPS.some((t0) => f >= t0 && f < t0 + 8);
  const nLaps = LAPS.filter((t0) => f >= t0).length;
  const health = interpolate(f, [worseAt, lapseAt + 60, stopAt, knowAt, forkAt, life], [100, 82, 70, 58, 46, 41], C);
  const door: [number, number] = path[Math.floor(path.length * 0.6)];
  const doorXY = [X0 + (door[1] + 0.5) * CS, Y0 + (door[0] + 0.5) * CS];
  const doorPhase = f >= phaseAt;
  const coneT = P(f, coreAt, 20);
  const coneAng = 0.55; // rumo que ela aponta (para baixo-direita, no escuro)
  return (
    <AbsoluteFill style={{ background: "#04070a", overflow: "hidden" }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, transform: "perspective(1800px) rotateX(24deg) scale(1.08)", transformOrigin: "50% 60%" }}>
        <g transform={tf}>
          <g>
            {/* o casco visto de cima (popa reta, proa em ponta) e o convés de baixo, deslocado (profundidade) */}
            {(() => {
              const top: string[] = [];
              const bot: string[] = [];
              for (let k = 0; k <= MW * 4; k++) {
                const c = k / 4;
                const hw = c <= 19 ? 7.5 : 7.5 * Math.max(0, 1 - Math.pow((c - 19) / 9, 1.7));
                top.push(`${X0 + c * CS},${Y0 + (7.5 - hw) * CS}`);
                bot.unshift(`${X0 + c * CS},${Y0 + (7.5 + hw) * CS}`);
              }
              const d = `M ${top.join(" L ")} L ${bot.join(" L ")} Z`;
              return (
                <g>
                  <path d={d} fill="rgba(159,230,255,0.03)" stroke="rgba(159,230,255,0.10)" strokeWidth={2} transform="translate(26 36)" />
                  <path d={d} fill="rgba(8,16,22,0.7)" stroke={ICE} strokeWidth={6} opacity={0.75} />
                  {Array.from({ length: 16 }).map((_, k) => {
                    const c = 1 + k * 1.2;
                    return (
                      <g key={k} opacity={0.5}>
                        <circle cx={X0 + c * CS} cy={Y0 - 6} r={5} fill="none" stroke={ICE} strokeWidth={2} />
                        <circle cx={X0 + c * CS} cy={Y0 + MH * CS + 6} r={5} fill="none" stroke={ICE} strokeWidth={2} />
                      </g>
                    );
                  })}
                </g>
              );
            })()}
            {/* as paredes */}
            {Array.from({ length: MH }).map((_, r) =>
              Array.from({ length: MW }).map((__, c) => {
                if (!inHull(r, c)) return null;
                const v = seen(r, c);
                const x = X0 + c * CS;
                const y = Y0 + r * CS;
                const bh = BULKHEADS.includes(c);
                return (
                  <g key={`${r}-${c}`} opacity={v}>
                    {!maze.right[r][c] && inHull(r, c + 1) ? <line x1={x + CS} y1={y} x2={x + CS} y2={y + CS} stroke={ICE} strokeWidth={bh ? 7 : 3} /> : null}
                    {!maze.down[r][c] && inHull(r + 1, c) ? <line x1={x} y1={y + CS} x2={x + CS} y2={y + CS} stroke={ICE} strokeWidth={3} /> : null}
                    {bh && maze.right[r][c] ? <g><line x1={x + CS} y1={y} x2={x + CS} y2={y + CS * 0.18} stroke={ICE} strokeWidth={7} /><line x1={x + CS} y1={y + CS * 0.82} x2={x + CS} y2={y + CS} stroke={ICE} strokeWidth={7} /></g> : null}
                    {STAIRS.some(([sr, sc]) => sr === r && sc === c) ? (
                      <g opacity={0.7}>
                        <rect x={x + 12} y={y + 12} width={CS - 24} height={CS - 24} fill="none" stroke={ICE} strokeWidth={2} />
                        {[0, 1, 2, 3].map((k) => <line key={k} x1={x + 12} y1={y + 18 + k * 7} x2={x + CS - 12} y2={y + 18 + k * 7} stroke={ICE} strokeWidth={1.5} />)}
                      </g>
                    ) : null}
                  </g>
                );
              }),
            )}
            {ROOMS.map(([c, r, lab], i) => (
              <text key={i} x={X0 + c * CS} y={Y0 + r * CS + 8} textAnchor="middle" fill={ICE} fontFamily={MONO} fontSize={22} letterSpacing={8} opacity={0.35 * seen(Math.round(r - 0.5), Math.round(c - 0.5))}>{lab}</text>
            ))}
            {/* caminho percorrido */}
            <polyline points={path.slice(0, Math.floor(t * (path.length - 1)) + 1).map(([r, c]) => `${X0 + (c + 0.5) * CS},${Y0 + (r + 0.5) * CS}`).join(" ")} fill="none" stroke={AMB} strokeWidth={3} opacity={0.5} strokeDasharray="6 6" />
            {/* ela sabe o caminho: linha à frente, antes de andar */}
            {f >= knowAt && f < forkAt + 10 ? (
              <polyline points={path.slice(Math.floor(t * (path.length - 1)), Math.floor(t * (path.length - 1)) + 10).map(([r, c]) => `${X0 + (c + 0.5) * CS},${Y0 + (r + 0.5) * CS}`).join(" ")} fill="none" stroke={ORANGE} strokeWidth={4} strokeDasharray="3 9" strokeLinecap="round" opacity={P(f, knowAt, 12)} />
            ) : null}
            {/* a porta que muda de fase (ela olha antes) */}
            {f >= lookAt - 20 && f < forkAt ? (
              <g>
                <rect x={doorXY[0] - 16} y={doorXY[1] - 16} width={32} height={32} rx={4} fill={doorPhase ? "rgba(255,226,176,0.25)" : "rgba(159,230,255,0.15)"} stroke={doorPhase ? CREAM : ICE} strokeWidth={3} transform={doorPhase && f < phaseAt + 8 ? `rotate(${(f - phaseAt) * 11} ${doorXY[0]} ${doorXY[1]})` : undefined} />
                {f >= lookAt ? <line x1={pos[0]} y1={pos[1]} x2={doorXY[0]} y2={doorXY[1]} stroke={ORANGE} strokeWidth={2} strokeDasharray="4 6" opacity={0.8 * (1 - P(f, phaseAt + 10, 10))} /> : null}
              </g>
            ) : null}
            {/* bifurcação: o caminho da Mossman (labs) */}
            {f >= labsAt ? (
              <g opacity={P(f, labsAt, 10) * (f >= noAt ? 0.4 : 1)}>
                <polyline points={LABS.map(([r, c]) => `${X0 + (c + 0.5) * CS},${Y0 + (r + 0.5) * CS}`).join(" ")} fill="none" stroke={ICE} strokeWidth={4} strokeDasharray={`${1400 * P(f, labsAt, 20)} 1400`} />
              </g>
            ) : null}
          </g>
          {/* o cone: a direção que ela aponta (sem lugar marcado) */}
          {coneT > 0 ? (
            <g opacity={coneT * (0.75 + 0.25 * Math.sin(f / 5))}>
              <defs>
                <radialGradient id="coneG" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform={`translate(${pos[0]} ${pos[1]}) scale(900)`}>
                  <stop offset="0" stopColor="rgba(255,152,40,0.45)" />
                  <stop offset="1" stopColor="rgba(255,152,40,0)" />
                </radialGradient>
              </defs>
              <path d={`M ${pos[0]} ${pos[1]} L ${pos[0] + Math.cos(coneAng - 0.22) * 900} ${pos[1] + Math.sin(coneAng - 0.22) * 900} A 900 900 0 0 1 ${pos[0] + Math.cos(coneAng + 0.22) * 900} ${pos[1] + Math.sin(coneAng + 0.22) * 900} Z`} fill="url(#coneG)" />
              <text x={pos[0] + Math.cos(coneAng) * 520} y={pos[1] + Math.sin(coneAng) * 520} textAnchor="middle" fill={ORANGE} fontFamily={MONO} fontSize={26} letterSpacing={8} opacity={0.4 + 0.4 * Math.sin(f / 7)}>
                NÚCLEO ?
              </text>
            </g>
          ) : null}
          {/* o grupo */}
          <g transform={`translate(${pos[0]} ${pos[1]})`}>
            {/* o grupo: setas pequenas atrás dela (Gordon, Mossman, os Vortigaunts) */}
            {[
              [-26, 4, AMB],
              [-40, -10, ICE],
              [-44, 14, GREEN],
            ].map(([dx, dy, c], i) => (
              <path key={i} d={`M ${(dx as number) + 7} ${dy} L ${(dx as number) - 5} ${(dy as number) - 6} L ${(dx as number) - 2} ${dy} L ${(dx as number) - 5} ${(dy as number) + 6} Z`} fill={c as string} opacity={0.9} />
            ))}
            <text x={-44} y={34} textAnchor="middle" fill="rgba(242,240,247,0.75)" fontFamily={MONO} fontSize={13} letterSpacing={3}>GRUPO</text>
            {/* a Alyx: losango com anel */}
            <rect x={-9} y={-9} width={18} height={18} transform="rotate(45)" fill={lapse ? GREEN : ORANGE} stroke="#0a0806" strokeWidth={2} />
            <circle r={20 + (lapse ? 14 : 3 * Math.sin(f / 5))} fill="none" stroke={lapse ? GREEN : ORANGE} strokeWidth={2} opacity={0.6} />
            <text x={20} y={-16} fill={ORANGE} fontFamily={MONO} fontSize={16} letterSpacing={3}>
              ALYX
            </text>
            {f >= askAt && f < sayAt ? (
              <g opacity={P(f, askAt, 8)}>
                <text x={30} y={56} fill={ICE} fontFamily={MONO} fontSize={18} letterSpacing={2}>
                  MOSSMAN: “COMO VOCÊ SABE?”
                </text>
              </g>
            ) : null}
            {f >= pauseAt && f < sayAt ? <circle r={40} fill="none" stroke={CREAM} strokeWidth={3} strokeDasharray={`${251 * ((f - pauseAt) / Math.max(1, sayAt - pauseAt))} 251`} transform="rotate(-90)" /> : null}
          </g>
        </g>
      </svg>
      {/* textos */}
      <div style={{ position: "absolute", left: 80, top: 60, fontFamily: MONO, letterSpacing: 6 }}>
        <div style={{ fontSize: 20, color: ICE }}>O BOREALIS · CONVÉS 3</div>
        <div style={{ fontSize: 15, color: "rgba(242,240,247,0.6)", marginTop: 6 }}>MAPEADO SÓ ONDE O GRUPO PASSOU</div>
      </div>
      {f >= lapseAt && f < forkAt ? (
        <div style={{ position: "absolute", right: 80, top: 60, textAlign: "right", opacity: P(f, lapseAt, 10) }}>
          <div style={{ fontFamily: MONO, fontSize: 16, letterSpacing: 6, color: GREEN }}>{f >= knowAt ? "ELA NUNCA ESTEVE AQUI" : f >= lookAt ? "OLHA A PORTA ANTES DA FASE MUDAR" : f >= stopAt ? "PARA NO MEIO DO CORREDOR" : "LAPSOS · CADA VEZ MAIS FREQUENTES"}</div>
        </div>
      ) : null}
      {f >= labsAt && f < sayAt ? (
        <div style={{ position: "absolute", right: 80, top: 60, textAlign: "right", opacity: P(f, labsAt, 10) }}>
          <div style={{ fontFamily: MONO, fontSize: 16, letterSpacing: 6, color: ICE }}>MOSSMAN → LABS DA APERTURE</div>
          {f >= noAt ? <div style={{ fontFamily: MONO, fontSize: 16, letterSpacing: 6, color: ORANGE, marginTop: 8 }}>ALYX → “NÃO. O NÚCLEO.”</div> : null}
        </div>
      ) : null}
      {f >= sayAt ? (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 110, textAlign: "center" }}>
          <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 82, color: TXT, opacity: P(f, sayAt, 8) }}>“Eu não sei.”</div>
          {f >= mustAt ? <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 60, color: ORANGE, opacity: P(f, mustAt, 8) }}>Eu só sei que a gente precisa chegar lá.</div> : null}
        </div>
      ) : null}
      {lapse ? <AbsoluteFill style={{ background: "rgba(141,255,168,0.08)", pointerEvents: "none" }} /> : null}
      {f >= worseAt - 4 ? (
        <div style={{ position: "absolute", right: 70, bottom: 70, width: 470, padding: "14px 18px", borderRadius: 12, background: "rgba(8,10,8,0.86)", border: `1.5px solid ${lapse ? GREEN : ORANGE}`, fontFamily: MONO, opacity: P(f, worseAt - 4, 10) }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, letterSpacing: 4 }}>
            <span style={{ color: ORANGE }}>ALYX · SINAIS</span>
            <span style={{ color: lapse ? GREEN : health < 60 ? RED : ORANGE }}>{lapse ? "LAPSO" : health < 60 ? "PIORANDO" : "INSTÁVEL"}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, letterSpacing: 3, color: "rgba(242,240,247,0.75)", marginTop: 10 }}>
            <span>ESTADO</span>
            <span>{`${Math.round(health)}%`}</span>
          </div>
          <div style={{ height: 7, marginTop: 4, borderRadius: 4, background: "rgba(255,255,255,0.12)" }}>
            <div style={{ width: `${health}%`, height: "100%", borderRadius: 4, background: health < 60 ? RED : ORANGE }} />
          </div>
          <svg width={434} height={44} style={{ marginTop: 8 }}>
            <polyline points={Array.from({ length: 87 }).map((_, k) => { const ph = ((k * 5 + f * 5) % 110 + 110) % 110; const y = 22 - (ph > 40 && ph < 46 ? 18 : ph > 46 && ph < 50 ? -9 : 0) + (lapse ? (rnd(k + f) - 0.5) * 22 : 0); return `${k * 5},${y.toFixed(1)}`; }).join(" ")} fill="none" stroke={lapse ? GREEN : ORANGE} strokeWidth={2} />
          </svg>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, letterSpacing: 3, color: "rgba(242,240,247,0.75)", marginTop: 6 }}>
            <span>LAPSOS</span>
            <span style={{ color: GREEN }}>{nLaps}</span>
          </div>
          <svg width={434} height={16} style={{ marginTop: 4 }}>
            <line x1={0} x2={434} y1={8} y2={8} stroke="rgba(242,240,247,0.2)" />
            {LAPS.filter((t0) => f >= t0).map((t0, k) => <rect key={k} x={((t0 - lapseAt) / Math.max(1, forkAt - lapseAt)) * 430} y={1} width={3} height={14} fill={GREEN} />)}
          </svg>
          {[
            [stopAt, "PAROU NO CORREDOR"],
            [lookAt, "OLHOU A PORTA ANTES DA MUDANÇA"],
            [knowAt, "SABE O CAMINHO · NUNCA ESTEVE AQUI"],
          ].map(([t0, txt]) =>
            f >= (t0 as number) ? (
              <div key={txt as string} style={{ fontSize: 13, letterSpacing: 2, color: CREAM, marginTop: 6, opacity: P(f, t0 as number, 8) }}>{`› ${txt}`}</div>
            ) : null,
          )}
        </div>
      ) : null}
      <AbsoluteFill style={{ background: "#000", opacity: interpolate(f, [0, 8], [1, 0], C) + interpolate(f, [life - 6, life], [0, 1], C), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- o objetivo muda: cartões de vidro
type OP = { life: number; stasisAt?: number; changeAt?: number; apertureAt?: number; urgentAt?: number; coreAt?: number; whyAt?: number };
export const HLRObjectives: React.FC<OP> = (p) => {
  const f = useCurrentFrame();
  const a = (v?: number) => v ?? 1e9;
  const [stasisAt, changeAt, apertureAt, urgentAt, coreAt, whyAt] = [p.stasisAt, p.changeAt, p.apertureAt, p.urgentAt, p.coreAt, p.whyAt].map(a);
  const life = p.life;
  const swap = IO((f - changeAt) / 26);
  const cards = [
    { id: "apt", t: "A tecnologia da Aperture", s: "TELEPORTE · RESPOSTAS", c: ICE, from: 0, to: 1 },
    { id: "core", t: "Onde fica o núcleo", s: "DIREÇÃO MAIS URGENTE", c: ORANGE, from: 1, to: 0 },
    { id: "why", t: "Por que a Alyx sabe", s: "E POR QUE ELE IMPORTA", c: ORANGE, from: 2, to: 2 },
  ];
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 40%, #121820 0%, #040608 75%)", overflow: "hidden" }}>
      {/* diagnóstico */}
      <div style={{ position: "absolute", left: 120, top: 120, width: 760, padding: "26px 30px", borderRadius: 18, background: "rgba(20,28,36,0.6)", border: "1px solid rgba(159,230,255,0.35)", boxShadow: "0 30px 80px rgba(0,0,0,0.5)", opacity: P(f, 0, 12) * (1 - P(f, changeAt, 14)), transform: `perspective(1400px) rotateY(${8 - 8 * P(f, 0, 20)}deg)` }}>
        <div style={{ fontFamily: MONO, fontSize: 16, letterSpacing: 6, color: ICE }}>ALYX VANCE · DIAGNÓSTICO</div>
        <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 58, color: TXT, lineHeight: 1.05, marginTop: 10 }}>efeito da estase?</div>
        {f >= stasisAt ? (
          <div style={{ position: "absolute", right: 30, bottom: 26, padding: "6px 16px", border: `4px solid ${RED}`, color: RED, fontFamily: FONT, fontWeight: 800, fontSize: 36, transform: `rotate(-6deg) scale(${1.5 - 0.5 * P(f, stasisAt, 8)})`, opacity: P(f, stasisAt, 6) }}>TALVEZ NÃO</div>
        ) : null}
      </div>
      {/* a pilha de objetivos */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, perspective: 1600 }}>
        {cards.map((c, i) => {
          const show = i === 0 ? P(f, Math.min(apertureAt, changeAt) - 10, 12) : i === 1 ? P(f, urgentAt - 4, 12) : P(f, whyAt - 4, 12);
          const slot = c.from + (c.to - c.from) * swap;
          const y = 360 + slot * 190;
          const top = slot < 0.5;
          return (
            <div key={c.id} style={{ position: "absolute", left: 980, top: y, width: 760, padding: "22px 28px", borderRadius: 16, background: top ? "rgba(40,24,8,0.75)" : "rgba(14,20,26,0.7)", border: `1px solid ${top ? c.c : "rgba(159,230,255,0.3)"}`, boxShadow: top ? `0 0 60px ${c.c}33, 0 30px 70px rgba(0,0,0,0.5)` : "0 20px 50px rgba(0,0,0,0.5)", opacity: show * (top ? 1 : 0.7), transform: `translateX(${(1 - show) * 120}px) rotateY(-10deg) scale(${top ? 1.04 : 0.96})` }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 15, letterSpacing: 5, color: c.c }}>
                <span>{c.s}</span>
                <span>{top ? "PRIORIDADE 1" : `PRIORIDADE ${Math.round(slot) + 1}`}</span>
              </div>
              <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 50, color: TXT, lineHeight: 1.05, marginTop: 6 }}>{c.t}</div>
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", left: 980, top: 270, fontFamily: MONO, fontSize: 20, letterSpacing: 8, color: f >= changeAt ? ORANGE : ICE, opacity: P(f, changeAt - 6, 10) }}>{f >= changeAt ? "O OBJETIVO MUDA" : "OBJETIVOS"}</div>
      <AbsoluteFill style={{ background: "#000", opacity: interpolate(f, [0, 6], [1, 0], C) + interpolate(f, [life - 6, life], [0, 1], C), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};
