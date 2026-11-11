// HL3 · 1:09:56 → 1:11:16 o padrão, a sequência alterada, eles percebem (13/10)
// Pedido dele: a cena POV da Alyx parada com os Combine (quase dois minutos de tela parada) foi para o lixo. Reformulada
// na linguagem da malha holográfica que ele aprovou: o procedimento dos Advisors como um holograma vivo — a câmera nunca
// para, orbitando o núcleo do Borealis (anéis girando, barra do procedimento) sobre o chão de malha. A Alyx (crachá)
// num nó, o Advisor (máscara violeta) em outro, e o ciclo corre como pacotes de dados: CÁLCULO → EXECUÇÃO → FALHA logo
// antes da conclusão, três vezes (o padrão do Kleiner). Quando o Gordon chega perto, a câmera mergulha no console dela:
// a sequência Ω7 Δ3 Ψ1 Λ9, o cursor troca Ψ1 por Ψ4, envia; o Advisor executa exatamente; falha. "De propósito".
// Eles percebem: o canal estoura, a máscara do Advisor vira para ela, a manifestação estável, a confiança se desfaz em
// pó; ela olha para os motores (o G-Man parado no brilho); o campo violeta a ergue e as miras dos soldados fecham nela.
import React from "react";
import { AbsoluteFill, Easing, interpolate, staticFile, useCurrentFrame } from "remotion";
import { MONO } from "./overlays";
import { C } from "./hl3";
import { FilmLook } from "./hl3r";
import { Kin, Gman2D } from "./hl3r9";

type PR = Record<string, number> & { life: number };
type V3 = [number, number, number];
const at = (p: PR, k: string) => Math.round((p[k] as number | undefined) ?? 1e6);
const P = (f: number, t: number, d = 12) => interpolate(f, [t, t + d], [0, 1], { ...C, easing: Easing.out(Easing.cubic) });
const IO = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], { ...C, easing: Easing.inOut(Easing.cubic) });
const rnd = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const TEAL = "#5ff3d0";
const ICE = "#9fe6ff";
const ORANGE = "#ff9a3c";
const VIO = "#c79bff";
const RED = "#ff5d4d";
const AMB = "#ffb22e";
const CREAM = "#ffe2b0";

// os lugares (mundo: x direita, y fundo, z cima)
const CORE: V3 = [0, 0, 2.2];
const ALYX: V3 = [-6.5, -3.5, 1.4];
const ADV: V3 = [6.0, -1.0, 3.6];
const ENG: V3 = [0, 12, 3.2]; // os motores do outro lado do vidro
const SOL: V3[] = [[-9.5, -7, 1.5], [-3.5, -8.5, 1.5], [-11, -1, 1.5]];
// 30/10 (ele: mostrar onde o Gordon está quando chega perto): a sala de controle dela e o Gordon do lado de fora, no vidro
const ROOM = [-9.6, -6.0, -3.4, -1.0]; // x0 y0 x1 y1 · a parede de vidro é a do x0 (virada para o Gordon)
const GOR: V3 = [-13, 3, 1.4];
const LAMBDA = "#ffb22e";

// gorSub/gorGo: usados pela abertura da luta (o Gordon sai do vidro e entra na sala)
export const HL10Pattern: React.FC<PR & { mode?: number; frozen?: number; gorGo?: number }> = (p) => {
  const f0 = useCurrentFrame();
  const f = p.frozen !== undefined ? Math.round(p.frozen * 30) : f0;
  const life = p.life;
  const mode = p.mode ?? 0;
  const [advAt, calcAt, execAt, failAt, closeAt, ctrlAt, editAt, sendAt, recvAt, fail2At, purpAt] = ["advAt", "calcAt", "execAt", "failAt", "closeAt", "ctrlAt", "editAt", "sendAt", "recvAt", "fail2At", "purpAt"].map((k) => at(p, k));
  const [snapAt, turnAt, stableAt, enoughAt, noFakeAt, glassAt, gmanAt, liftAt, aimAt, radioAt] = ["snapAt", "turnAt", "stableAt", "enoughAt", "noFakeAt", "glassAt", "gmanAt", "liftAt", "aimAt", "radioAt"].map((k) => at(p, k));
  // ---------------------------------------------------------------- a câmera: órbita contínua + mergulhos
  const orbit = f0 * 0.0022 + (mode ? 1.1 : 0);
  let tgt: V3 = [0, 0, 1.8];
  let dist = 17;
  let elev = 0.42;
  let yaw = -0.35 + Math.sin(orbit) * 0.5;
  if (!mode) {
    const dive = IO(f, closeAt, closeAt + 50) * (1 - IO(f, fail2At + 10, fail2At + 60));
    tgt = [tgt[0] + (ALYX[0] - tgt[0]) * dive, tgt[1] + (ALYX[1] - tgt[1]) * dive, tgt[2] + (ALYX[2] - tgt[2]) * dive];
    dist -= 9 * dive;
    elev -= 0.12 * dive;
    yaw += -0.4 * dive;
  } else {
    const look = IO(f, glassAt - 6, glassAt + 40) * (1 - IO(f, liftAt - 10, liftAt + 30));
    tgt = [tgt[0] + (ENG[0] * 0.6 - tgt[0]) * look, tgt[1] + (ENG[1] * 0.6 - tgt[1]) * look, tgt[2]];
    yaw += 0.6 * look;
    const lift = IO(f, liftAt - 10, liftAt + 40);
    tgt = [tgt[0] + (ALYX[0] - tgt[0]) * lift * 0.7, tgt[1] + (ALYX[1] - tgt[1]) * lift * 0.7, tgt[2] + 1.2 * lift];
    dist -= 5 * lift;
  }
  const snapShake = mode && f >= snapAt && f < snapAt + 14 ? (1 - (f - snapAt) / 14) * 0.08 : 0;
  yaw += snapShake * Math.sin(f * 3.3);
  const cam: V3 = [tgt[0] - Math.sin(yaw) * Math.cos(elev) * dist, tgt[1] - Math.cos(yaw) * Math.cos(elev) * dist, tgt[2] + Math.sin(elev) * dist];
  const fw = (() => { const d = [tgt[0] - cam[0], tgt[1] - cam[1], tgt[2] - cam[2]]; const L = Math.hypot(d[0], d[1], d[2]); return [d[0] / L, d[1] / L, d[2] / L] as V3; })();
  const rg = (() => { const r = [fw[1], -fw[0], 0]; const L = Math.hypot(r[0], r[1]); return [r[0] / L, r[1] / L, 0] as V3; })();
  const up: V3 = [rg[1] * fw[2] - rg[2] * fw[1], rg[2] * fw[0] - rg[0] * fw[2], rg[0] * fw[1] - rg[1] * fw[0]];
  const FP = 1100;
  const pj = (q: V3) => {
    const d = [q[0] - cam[0], q[1] - cam[1], q[2] - cam[2]];
    const z = d[0] * fw[0] + d[1] * fw[1] + d[2] * fw[2];
    if (z < 0.4) return null;
    return { x: 960 + (FP * (d[0] * rg[0] + d[1] * rg[1] + d[2] * rg[2])) / z, y: 540 - (FP * (d[0] * up[0] + d[1] * up[1] + d[2] * up[2])) / z, d: z };
  };
  const pts = (arr: V3[]) => arr.map(pj).filter(Boolean).map((v) => `${v!.x.toFixed(1)},${v!.y.toFixed(1)}`).join(" ");
  // ---------------------------------------------------------------- o estado do procedimento
  // três ciclos fantasmas (o padrão já visto) correndo atrás, e o ciclo "ao vivo"
  const cyc = (t0: number, t1: number) => Math.max(0, Math.min(1, (f - t0) / Math.max(1, t1 - t0)));
  const live1 = cyc(calcAt, failAt); // primeira falha ao vivo
  const live2 = cyc(sendAt, fail2At);
  const prog = !mode
    ? f < calcAt
      ? 0.25 + 0.7 * ((f % 120) / 120)
      : f < failAt
        ? 0.3 + 0.67 * live1
        : f < sendAt
          ? Math.max(0.3, 0.97 - P(f, failAt, 20) * 0.6)
          : f < fail2At
            ? 0.37 + 0.6 * live2
            : Math.max(0.35, 0.97 - P(f, fail2At, 20) * 0.6)
    : 0.94 + 0.02 * Math.sin(f / 20);
  const failing = (!mode && ((f < calcAt && f % 120 > 112) || (f >= failAt && f < failAt + 22) || (f >= fail2At && f < fail2At + 26))) || false;
  // ---------------------------------------------------------------- desenho
  const els: React.ReactNode[] = [];
  // o chão de malha (a mesma linguagem da cena dos Vortigaunts)
  for (let gy = -14; gy <= 16; gy += 1) {
    const row: V3[] = [];
    for (let gx = -16; gx <= 16; gx += 1) row.push([gx, gy, 0.25 * Math.sin(gx * 0.5 + gy * 0.3 + f0 / 50) * Math.exp(-(gx * gx + gy * gy) / 300)]);
    const s = pts(row);
    const far = Math.hypot(gy - cam[1] * 0.5, 0);
    els.push(<polyline key={"r" + gy} points={s} fill="none" stroke={TEAL} strokeWidth={1} opacity={Math.max(0.06, 0.3 - far * 0.01)} />);
  }
  for (let gx = -16; gx <= 16; gx += 2) {
    const col: V3[] = [];
    for (let gy = -14; gy <= 16; gy += 1) col.push([gx, gy, 0.25 * Math.sin(gx * 0.5 + gy * 0.3 + f0 / 50) * Math.exp(-(gx * gx + gy * gy) / 300)]);
    els.push(<polyline key={"c" + gx} points={pts(col)} fill="none" stroke={TEAL} strokeWidth={1} opacity={0.1} />);
  }
  // o vidro e os motores ao fundo (a galeria)
  const glassL: V3[] = [[-14, 7, 0], [14, 7, 0], [14, 7, 6], [-14, 7, 6]];
  const gq = pts(glassL);
  els.push(<polygon key="glass" points={gq} fill="rgba(120,220,255,0.05)" stroke="rgba(160,230,255,0.45)" strokeWidth={1.4} />);
  for (let k = -3; k <= 3; k++) els.push(<polyline key={"gm" + k} points={pts([[k * 4, 7, 0], [k * 4, 7, 6]])} stroke="rgba(160,230,255,0.25)" strokeWidth={1} fill="none" />);
  [-6, 0, 6].forEach((ex, k) => {
    for (let r = 0; r < 4; r++) {
      const ring: V3[] = Array.from({ length: 33 }).map((_, i) => { const a = (i / 32) * Math.PI * 2; return [ex + Math.cos(a) * 1.6, ENG[1] + Math.sin(a) * 1.6 * 0.4, 0.6 + r * 1.3] as V3; });
      els.push(<polyline key={`eng${k}${r}`} points={pts(ring)} fill="none" stroke={ICE} strokeWidth={1.2} opacity={0.25 + 0.15 * Math.sin(f0 / 9 + r + k)} />);
    }
  });
  // o núcleo: esfera de linhas girando + os anéis do procedimento
  const coreCol = failing ? RED : TEAL;
  for (let i = 0; i < 7; i++) {
    const lo = f0 / 60 + (i / 7) * Math.PI;
    const ring: V3[] = Array.from({ length: 41 }).map((_, k) => { const a = (k / 40) * Math.PI * 2; return [CORE[0] + Math.cos(lo) * Math.cos(a) * 1.6, CORE[1] + Math.sin(lo) * Math.cos(a) * 1.6, CORE[2] + Math.sin(a) * 1.6] as V3; });
    els.push(<polyline key={"co" + i} points={pts(ring)} fill="none" stroke={coreCol} strokeWidth={1.3} opacity={0.75} />);
  }
  [2.4, 3.0, 3.6].forEach((R, k) => {
    const tilt = 0.3 + k * 0.25, sp = (k % 2 ? -1 : 1) * f0 / (40 + k * 12);
    const ring: V3[] = Array.from({ length: 49 }).map((_, i) => { const a = (i / 48) * Math.PI * 2 + sp; return [CORE[0] + Math.cos(a) * R, CORE[1] + Math.sin(a) * R * Math.cos(tilt), CORE[2] + Math.sin(a) * R * Math.sin(tilt)] as V3; });
    els.push(<polyline key={"cr" + k} points={pts(ring)} fill="none" stroke={coreCol} strokeWidth={2} opacity={0.5} strokeDasharray="10 8" />);
  });
  const cp = pj(CORE);
  // o anel do procedimento (progresso) em volta do núcleo, no chão
  {
    const n = Math.max(2, Math.round(64 * prog));
    const arc: V3[] = Array.from({ length: n + 1 }).map((_, i) => { const a = -Math.PI / 2 + (i / 64) * Math.PI * 2; return [CORE[0] + Math.cos(a) * 4.4, CORE[1] + Math.sin(a) * 4.4, 0.05] as V3; });
    const full: V3[] = Array.from({ length: 65 }).map((_, i) => { const a = (i / 64) * Math.PI * 2; return [CORE[0] + Math.cos(a) * 4.4, CORE[1] + Math.sin(a) * 4.4, 0.05] as V3; });
    els.push(<polyline key="pfull" points={pts(full)} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={6} />);
    els.push(<polyline key="parc" points={pts(arc)} fill="none" stroke={failing ? RED : mode ? VIO : TEAL} strokeWidth={6} style={{ filter: `drop-shadow(0 0 6px ${failing ? RED : TEAL})` }} />);
  }
  // os canais (curvas) Alyx → Advisor → núcleo
  const bez = (a: V3, b: V3, h: number, t: number): V3 => {
    const m: V3 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, Math.max(a[2], b[2]) + h];
    const u = 1 - t;
    return [u * u * a[0] + 2 * u * t * m[0] + t * t * b[0], u * u * a[1] + 2 * u * t * m[1] + t * t * b[1], u * u * a[2] + 2 * u * t * m[2] + t * t * b[2]];
  };
  const chan = (a: V3, b: V3, h: number) => Array.from({ length: 30 }).map((_, i) => bez(a, b, h, i / 29));
  const broken = mode && f >= snapAt;
  const linkO = mode ? 1 - P(f, snapAt, 6) : 1;
  els.push(<polyline key="chAA" points={pts(chan(ALYX, ADV, 3))} fill="none" stroke={ORANGE} strokeWidth={2.2} opacity={0.75 * linkO} strokeDasharray="8 7" strokeDashoffset={-f0 * 1.5} />);
  els.push(<polyline key="chAC" points={pts(chan(ADV, CORE, 1.5))} fill="none" stroke={VIO} strokeWidth={2.2} opacity={0.75} strokeDasharray="8 7" strokeDashoffset={-f0 * 1.5} />);
  // o estalo seco: o canal arrebenta em faíscas
  if (broken && f < snapAt + 30) {
    const k = (f - snapAt) / 30;
    const mid = pj(bez(ALYX, ADV, 3, 0.5));
    if (mid) {
      els.push(<circle key="snapf" cx={mid.x} cy={mid.y} r={20 + 120 * k} fill="rgba(255,220,180,0.7)" opacity={1 - k} style={{ filter: "blur(6px)" }} />);
      Array.from({ length: 18 }).forEach((_, i) => {
        const a = rnd(i) * Math.PI * 2, r = 20 + 200 * k * (0.5 + rnd(i * 3));
        els.push(<line key={"sp" + i} x1={mid.x + Math.cos(a) * r * 0.6} y1={mid.y + Math.sin(a) * r * 0.6} x2={mid.x + Math.cos(a) * r} y2={mid.y + Math.sin(a) * r + k * 40} stroke={i % 2 ? ORANGE : "#fff2d8"} strokeWidth={2.5} opacity={1 - k} />);
      });
    }
    // as duas pontas soltas balançando
    [0, 1].forEach((side) => {
      const seg = Array.from({ length: 12 }).map((_, i) => {
        const t = side ? 1 - (i / 11) * 0.45 : (i / 11) * 0.45;
        const q = bez(ALYX, ADV, 3, t);
        return [q[0], q[1], q[2] - (side ? 1 - t : t) * k * 4] as V3;
      });
      els.push(<polyline key={"ls" + side} points={pts(seg)} fill="none" stroke={ORANGE} strokeWidth={2} opacity={0.7 * (1 - k)} />);
    });
  }
  // os pacotes: ciclos de fundo (o padrão) e os ciclos ao vivo
  const packet = (q: V3, col: string, label: string, key: string, big = false) => {
    const s = pj(q);
    if (!s) return null;
    const sc = Math.max(0.6, Math.min(1.6, 12 / s.d)) * (big ? 1.4 : 1);
    // 30/10 (ele: o comando "Ω7 Δ3 Ψ4 Λ9" saía da caixa): a caixa acompanha o tamanho do texto (mono ≈ 0,62 em + espaçamento)
    const hw = Math.max(34, (label.length * (12 * 0.62 + 1)) / 2 + 10) * sc;
    return (
      <g key={key}>
        <rect x={s.x - hw} y={s.y - 11 * sc} width={hw * 2} height={22 * sc} rx={6 * sc} fill="rgba(4,12,14,0.9)" stroke={col} strokeWidth={1.6} style={{ filter: `drop-shadow(0 0 6px ${col})` }} />
        <text x={s.x} y={s.y + 5 * sc} textAnchor="middle" fill={col} fontFamily={MONO} fontSize={12 * sc} letterSpacing={1}>{label}</text>
      </g>
    );
  };
  if (!mode) {
    // os ciclos rápidos do padrão (antes do ao vivo): cálculo sai dela, execução vai ao núcleo
    if (f < calcAt + 10) {
      const t = (f % 120) / 120;
      if (t < 0.45) els.push(packet(bez(ALYX, ADV, 3, t / 0.45), ORANGE, "CÁLCULO", "pk1"));
      else if (t < 0.85) els.push(packet(bez(ADV, CORE, 1.5, (t - 0.45) / 0.4), VIO, "EXECUÇÃO", "pk2"));
    }
    if (f >= calcAt && f < execAt) els.push(packet(bez(ALYX, ADV, 3, P(f, calcAt, execAt - calcAt)), ORANGE, "CÁLCULO · A. VANCE", "pkc", true));
    if (f >= execAt && f < failAt) els.push(packet(bez(ADV, CORE, 1.5, P(f, execAt, failAt - execAt)), VIO, "EXECUTANDO", "pke", true));
    if (f >= sendAt && f < recvAt) els.push(packet(bez(ALYX, ADV, 3, P(f, sendAt, recvAt - sendAt)), ORANGE, "Ω7 Δ3 Ψ4 Λ9", "pks", true));
    if (f >= recvAt && f < fail2At) els.push(packet(bez(ADV, CORE, 1.5, P(f, recvAt, fail2At - recvAt)), VIO, "Ω7 Δ3 Ψ4 Λ9", "pkr", true));
  }
  // a falha: o anel do núcleo se abre em estilhaços vermelhos
  if (failing && cp) {
    const k = ((f % 26) / 26);
    Array.from({ length: 14 }).forEach((_, i) => {
      const a = (i / 14) * Math.PI * 2 + f0 / 30;
      els.push(<line key={"fl" + i} x1={cp.x + Math.cos(a) * 60} y1={cp.y + Math.sin(a) * 60} x2={cp.x + Math.cos(a) * (90 + 120 * k)} y2={cp.y + Math.sin(a) * (90 + 120 * k)} stroke={RED} strokeWidth={3} opacity={1 - k} />);
    });
  }
  // os nós: Alyx (crachá) e o Advisor (máscara)
  // 30/10 (ele: o card do Advisor cinza, feio): hot = fundo violeta, a silhueta tingida e o halo pulsando
  const node = (q: V3, img: string, col: string, R0: number, key: string, label: string, sub?: string, liftZ = 0, flip = 0, hot = false) => {
    const b = pj([q[0], q[1], 0]), t = pj([q[0], q[1], q[2] + liftZ]);
    if (!b || !t) return null;
    const s = Math.max(0.6, Math.min(1.8, 12 / t.d));
    const R = R0 * s;
    return (
      <g key={key}>
        <ellipse cx={b.x} cy={b.y} rx={R * 1.2} ry={R * 0.38} fill="none" stroke={col} strokeWidth={1.6} strokeDasharray="5 4" strokeDashoffset={-f0} />
        <line x1={b.x} y1={b.y} x2={t.x} y2={t.y + R} stroke={col} strokeWidth={1.6} opacity={0.8} />
        <defs><clipPath id={"nc" + key}><rect x={t.x - R * 0.8} y={t.y - R} width={R * 1.6} height={R * 2} rx={6} /></clipPath></defs>
        {hot ? (
          <defs>
            <radialGradient id={"ng" + key} cx="50%" cy="45%" r="70%"><stop offset="0%" stopColor="#6b2fd1" /><stop offset="60%" stopColor="#2a0f5c" /><stop offset="100%" stopColor="#0c0420" /></radialGradient>
            <filter id={"nt" + key}><feColorMatrix type="matrix" values="0.92 0 0 0 0.08  0 0.72 0 0 0.04  0 0 1 0 0.12  0 0 0 1 0" /><feGaussianBlur stdDeviation="0.4" /></filter>
          </defs>
        ) : null}
        {hot ? <rect x={t.x - R * 0.8 - 9} y={t.y - R - 9} width={R * 1.6 + 18} height={R * 2 + 18} rx={12} fill="none" stroke={col} strokeWidth={2} opacity={0.35 + 0.3 * Math.sin(f0 / 9)} style={{ filter: `drop-shadow(0 0 14px ${col})` }} /> : null}
        <rect x={t.x - R * 0.8 - 3} y={t.y - R - 3} width={R * 1.6 + 6} height={R * 2 + 6} rx={8} fill={hot ? `url(#ng${key})` : "#05070a"} stroke={col} strokeWidth={hot ? 4 : 3} style={{ filter: `drop-shadow(0 0 ${hot ? 18 : 10}px ${col})` }} />
        <g transform={flip ? `translate(${t.x} 0) scale(${1 - 2 * flip} 1) translate(${-t.x} 0)` : undefined}>
          <image href={staticFile(img)} x={t.x - R * 0.8} y={t.y - R} width={R * 1.6} height={R * 2} preserveAspectRatio="xMidYMid slice" clipPath={`url(#nc${key})`} filter={hot ? `url(#nt${key})` : undefined} style={hot ? { filter: `drop-shadow(0 0 6px ${col})` } : undefined} />
        </g>
        {hot ? <rect x={t.x - R * 0.8 + 4} y={t.y + R - 16 * s} width={R * 1.6 - 8} height={13 * s} rx={3} fill={col} /> : null}
        {hot ? <text x={t.x} y={t.y + R - 6 * s} textAnchor="middle" fill="#14052e" fontFamily={MONO} fontSize={9 * s} fontWeight={700} letterSpacing={2}>COMBINE · ADVISOR</text> : null}
        <text x={t.x} y={t.y + R + 22 * s} textAnchor="middle" fill={col} fontFamily={MONO} fontSize={(hot ? 19 : 15) * s} fontWeight={hot ? 700 : undefined} letterSpacing={3} style={{ paintOrder: "stroke", stroke: "#000", strokeWidth: 4 }}>{label}</text>
        {sub ? <text x={t.x} y={t.y + R + 40 * s} textAnchor="middle" fill="#f2f0f7" fontFamily={MONO} fontSize={12 * s} letterSpacing={2} style={{ paintOrder: "stroke", stroke: "#000", strokeWidth: 4 }}>{sub}</text> : null}
      </g>
    );
  };
  const lift = mode ? IO(f, liftAt, liftAt + 30) : 0;
  // o campo violeta que a ergue
  if (lift > 0) {
    const t = pj([ALYX[0], ALYX[1], ALYX[2] + 1.4 * lift]);
    if (t) [0, 1, 2].forEach((r) => { const tt = ((f0 / 14 + r / 3) % 1); els.push(<ellipse key={"lf" + r} cx={t.x} cy={t.y} rx={(70 + 70 * tt)} ry={(90 + 70 * tt)} fill="none" stroke={VIO} strokeWidth={2.5} opacity={(1 - tt) * lift} />); });
    const a = pj(ADV), b2 = pj([ALYX[0], ALYX[1], ALYX[2] + 1.4 * lift]);
    if (a && b2) els.push(<path key="tk" d={`M ${a.x} ${a.y} Q ${(a.x + b2.x) / 2} ${Math.min(a.y, b2.y) - 120} ${b2.x} ${b2.y}`} fill="none" stroke={VIO} strokeWidth={4} opacity={0.6 * lift} style={{ filter: `drop-shadow(0 0 8px ${VIO})` }} />);
  }
  // a sala de controle dela (chão + parede de vidro) e o Gordon olhando pelo vidro, desde "perto o suficiente"
  const gorO = mode ? 1 : P(f, closeAt - 6, 16);
  if (gorO > 0) {
    const [x0, y0, x1, y1] = ROOM;
    els.push(<polygon key="room" points={pts([[x0, y0, 0], [x1, y0, 0], [x1, y1, 0], [x0, y1, 0]])} fill="rgba(255,154,60,0.06)" stroke={ORANGE} strokeWidth={1.4} strokeDasharray="8 6" opacity={0.8 * gorO} />);
    els.push(<polygon key="roomg" points={pts([[x0, y0, 0], [x0, y1, 0], [x0, y1, 2.6], [x0, y0, 2.6]])} fill="rgba(160,230,255,0.10)" stroke="rgba(160,230,255,0.7)" strokeWidth={1.4} opacity={gorO} />);
    const rl = pj([x1, y0, 0]);
    if (rl) els.push(<text key="roomt" x={rl.x} y={rl.y + 20} textAnchor="end" fill={ORANGE} fontFamily={MONO} fontSize={13} letterSpacing={3} opacity={gorO} style={{ paintOrder: "stroke", stroke: "#000", strokeWidth: 4 }}>SALA DE CONTROLE</text>);
    const gg = p.gorGo ?? 0, GQ: V3 = [GOR[0] + (ROOM[0] + 0.8 - GOR[0]) * gg, GOR[1] + ((ROOM[1] + ROOM[3]) / 2 - GOR[1]) * gg, GOR[2]];
    const gb = pj([GQ[0], GQ[1], 0]), gt = pj(GQ), win = pj([ROOM[0], (ROOM[1] + ROOM[3]) / 2, 1.4]), ax = pj(ALYX);
    if (gb && gt) {
      const sees = !mode && f >= editAt;
      // a linha de visão: do Gordon, pelo vidro, até o console dela
      if (win && ax) els.push(<path key="gsee" d={`M ${gt.x} ${gt.y} L ${win.x} ${win.y} L ${ax.x} ${ax.y}`} fill="none" stroke={LAMBDA} strokeWidth={sees ? 2.6 : 1.6} strokeDasharray="4 6" strokeDashoffset={-f0 * 0.8} opacity={(sees ? 0.95 : 0.6) * gorO} />);
      els.push(
        <g key="gor" opacity={gorO}>
          <ellipse cx={gb.x} cy={gb.y} rx={26} ry={9} fill="none" stroke={LAMBDA} strokeWidth={2} />
          <line x1={gb.x} y1={gb.y} x2={gt.x} y2={gt.y + 22} stroke={LAMBDA} strokeWidth={2} />
          <circle cx={gt.x} cy={gt.y} r={22} fill="#120c02" stroke={LAMBDA} strokeWidth={3} style={{ filter: `drop-shadow(0 0 8px ${LAMBDA})` }} />
          <text x={gt.x} y={gt.y + 9} textAnchor="middle" fill={LAMBDA} fontFamily="Georgia, serif" fontSize={28} fontWeight={700}>λ</text>
          <text x={gt.x} y={gt.y - 34} textAnchor="middle" fill={LAMBDA} fontFamily={MONO} fontSize={15} letterSpacing={3} style={{ paintOrder: "stroke", stroke: "#000", strokeWidth: 4 }}>GORDON</text>
          <text x={gt.x} y={gt.y + 46} textAnchor="middle" fill="#f2f0f7" fontFamily={MONO} fontSize={12} letterSpacing={2} style={{ paintOrder: "stroke", stroke: "#000", strokeWidth: 4 }}>{(p as unknown as { gorSub?: string }).gorSub ?? (mode ? (f >= radioAt ? "OUVE O ELI" : "DO LADO DE FORA · NO VIDRO") : sees ? "VÊ ALYX ALTERAR" : "PERTO O SUFICIENTE")}</text>
        </g>
      );
    }
  }
  const advTurn = mode ? IO(f, turnAt, turnAt + 40) : 0;
  els.push(node(ADV, "hl3silh/advisor_mask.png", VIO, 46, "adv", "ADVISOR", mode ? (f >= stableAt ? "MANIFESTAÇÃO ESTÁVEL" : f >= turnAt ? "VIRA-SE PARA ELA" : f >= snapAt ? "PERCEBE" : undefined) : f >= execAt ? "EXECUTA" : f >= advAt ? "RECEBE O CÁLCULO" : undefined, 0, advTurn, true));
  els.push(node(ALYX, "hl3silh/alyx_badge.jpg", ORANGE, 44, "alyx", "ALYX", mode ? (f >= liftAt ? "ERGUIDA NO AR" : f >= glassAt ? "OLHA PARA OS MOTORES" : undefined) : f >= editAt ? "ALTERA A SEQUÊNCIA" : f >= calcAt ? "ENTREGA O CÁLCULO" : undefined, 1.4 * lift));
  // os soldados (crachás) e as miras
  if (mode && f >= aimAt - 20) {
    SOL.forEach((q, k) => {
      els.push(node(q, "hl3silh/combine_badge.jpg", RED, 26, "sol" + k, "COMBINE", f >= aimAt ? "MIRANDO" : undefined));
      const a = pj([q[0], q[1], q[2] + 0.2]), b3 = pj([ALYX[0], ALYX[1], ALYX[2] + 1.4 * lift]);
      const k2 = P(f, aimAt + k * 4, 14);
      if (a && b3 && k2 > 0) {
        els.push(<line key={"aim" + k} x1={a.x} y1={a.y} x2={a.x + (b3.x - a.x) * k2} y2={a.y + (b3.y - a.y) * k2} stroke={RED} strokeWidth={1.6} strokeDasharray="3 5" />);
        if (k2 >= 1) els.push(<g key={"rt" + k}><circle cx={b3.x} cy={b3.y} r={60 - k * 8 + 6 * Math.sin(f0 / 4)} fill="none" stroke={RED} strokeWidth={2} /><line x1={b3.x - 70} y1={b3.y} x2={b3.x - 50} y2={b3.y} stroke={RED} strokeWidth={2} /><line x1={b3.x + 50} y1={b3.y} x2={b3.x + 70} y2={b3.y} stroke={RED} strokeWidth={2} /></g>);
      }
    });
  }
  // a confiança que se desfaz em pó (não precisam mais fingir)
  if (mode && f >= noFakeAt - 4 && f < noFakeAt + 60) {
    const k = P(f, noFakeAt, 50);
    Array.from({ length: 40 }).forEach((_, i) => {
      const q = bez(ALYX, ADV, 3, i / 39);
      const s = pj([q[0], q[1], q[2] - k * (1 + rnd(i) * 3)]);
      if (s) els.push(<circle key={"du" + i} cx={s.x + (rnd(i * 7) - 0.5) * 80 * k} cy={s.y} r={2.2} fill={ORANGE} opacity={1 - k} />);
    });
  }
  // o G-Man parado no brilho dos motores
  const gmO = mode ? P(f, gmanAt, 24) * (1 - P(f, liftAt, 16)) : 0;
  const gq2 = pj([ENG[0] + 1.5, ENG[1] + 1, 0]);
  // ---------------------------------------------------------------- o console dela (o mergulho)
  const cons = !mode ? P(f, ctrlAt, 14) * (1 - P(f, fail2At + 4, 12)) : 0;
  const seqG = ["Ω7", "Δ3", f >= editAt + 8 ? "Ψ4" : "Ψ1", "Λ9"];
  const typing = f >= editAt && f < editAt + 8;
  const fl = (failing ? 0.25 : 0) + (mode && f >= snapAt && f < snapAt + 6 ? 0.5 : 0);
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 40%, #071c1a 0%, #020707 75%)", overflow: "hidden" }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {gmO > 0 && gq2 ? <ellipse cx={gq2.x} cy={gq2.y - 60} rx={140} ry={200} fill="rgba(200,240,255,0.18)" opacity={gmO} style={{ filter: "blur(18px)" }} /> : null}
        {els}
      </svg>
      {gmO > 0 && gq2 ? <Gman2D x={gq2.x} y={gq2.y} h={Math.max(120, 2600 / gq2.d)} o={gmO} /> : null}
      {/* a barra do procedimento (HUD) */}
      <div style={{ position: "absolute", right: 70, top: 70, width: 420, padding: "12px 16px", borderRadius: 10, background: "rgba(4,14,14,0.78)", border: `1.5px solid ${failing ? RED : mode ? VIO : TEAL}`, fontFamily: MONO }}>
        <div style={{ fontSize: 13, letterSpacing: 4, color: failing ? RED : mode ? VIO : TEAL }}>{mode ? "MANIFESTAÇÃO · ESTÁVEL" : "PROCEDIMENTO DOS ADVISORS"}</div>
        <div style={{ position: "relative", height: 12, marginTop: 8, background: "rgba(255,255,255,0.08)", borderRadius: 6 }}>
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${prog * 100}%`, background: failing ? RED : mode ? VIO : TEAL, borderRadius: 6, boxShadow: `0 0 10px ${failing ? RED : TEAL}` }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, letterSpacing: 2, color: "#e8fff4", marginTop: 6 }}>
          <span>{failing ? "FALHA · ANTES DA CONCLUSÃO" : mode ? (f >= enoughAt ? "AVANÇOU O SUFICIENTE" : "") : f >= execAt && f < failAt ? "EXECUTANDO" : ""}</span>
          <span>{Math.round(prog * 100)}%</span>
        </div>
        {!mode && f < calcAt ? (
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            {[0, 1, 2].map((k) => <span key={k} style={{ padding: "2px 8px", border: `1px solid ${RED}`, color: RED, fontSize: 12, letterSpacing: 2, opacity: P(f, 20 + k * 40, 8) }}>CICLO {k + 1} ✕ 97%</span>)}
          </div>
        ) : null}
      </div>
      {/* o console dela em close: a sequência, o cursor, o envio */}
      {cons > 0 ? (
        <div style={{ position: "absolute", left: 120, bottom: 140, width: 640, padding: "18px 22px", borderRadius: 14, background: "rgba(10,8,4,0.86)", border: `1.5px solid ${ORANGE}`, fontFamily: MONO, opacity: cons, transform: `translateY(${(1 - cons) * 30}px)`, boxShadow: "0 20px 60px rgba(0,0,0,0.6)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, letterSpacing: 5, color: ORANGE }}><span>CONSOLE · A. VANCE · SEQUÊNCIA</span>{f >= editAt ? <span style={{ color: LAMBDA, letterSpacing: 3, opacity: P(f, editAt, 8) }}>λ GORDON VÊ PELO VIDRO</span> : null}</div>
          <div style={{ display: "flex", gap: 14, marginTop: 14 }}>
            {seqG.map((g, i) => {
              const ed = i === 2 && f >= editAt;
              return (
                <div key={i} style={{ position: "relative", width: 112, height: 84, borderRadius: 10, border: `2px solid ${ed ? ORANGE : "rgba(159,230,255,0.5)"}`, background: ed ? "rgba(255,154,60,0.14)" : "rgba(10,24,30,0.7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, color: ed ? ORANGE : ICE, transform: `scale(${ed && typing ? 1.08 : 1})` }}>
                  {typing && i === 2 ? (Math.floor(f / 3) % 2 ? "Ψ_" : "Ψ") : g}
                  {ed && f >= editAt + 8 ? <div style={{ position: "absolute", top: -12, right: -10, padding: "1px 6px", borderRadius: 4, background: ORANGE, color: "#000", fontSize: 12 }}>ALTERADO</div> : null}
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14, fontSize: 16, letterSpacing: 3 }}>
            <span style={{ color: f >= sendAt ? AMB : "rgba(242,240,247,0.5)" }}>{f >= sendAt ? "ENVIADO ▸" : "PRONTO PARA ENVIAR"}</span>
            {f >= recvAt ? <span style={{ color: VIO, opacity: P(f, recvAt, 8) }}>ADVISOR RECEBEU · EXECUTA EXATAMENTE ✓</span> : null}
          </div>
        </div>
      ) : null}
      {/* as frases-chave, letra grande, na hora da fala */}
      {/* 13/10 (ele: a abertura com a frase borrada e o marcador branco horrível): o padrão é dito pelo próprio HUD — a
          faixa de cima entra deslizando, sem tapar a cena */}
      {!mode && f < advAt + 30 ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 46, display: "flex", justifyContent: "center", opacity: P(f, 4, 12) * (1 - P(f, advAt + 18, 12)) }}>
          <div style={{ padding: "10px 22px", borderRadius: 8, background: "rgba(4,14,14,0.8)", border: `1.5px solid ${TEAL}`, fontFamily: MONO, fontSize: 20, letterSpacing: 6, color: TEAL, transform: `translateY(${(1 - P(f, 4, 14)) * -24}px)` }}>
            NO MEIO DO CAOS · <span style={{ color: CREAM }}>O MESMO PADRÃO</span>
          </div>
        </div>
      ) : null}
      {!mode ? <Kin kind="strike" t0={purpAt} hit="propósito" col={ORANGE} size={64} text="Alyx fez de propósito" /> : null}
      {mode ? <Kin kind="glitch" t0={noFakeAt} until={glassAt - 2} size={50} text="eles não precisam mais fingir" /> : null}
      {fl > 0 ? <AbsoluteFill style={{ background: `rgba(255,${failing ? 60 : 220},${failing ? 40 : 180},${fl * 0.4})`, pointerEvents: "none" }} /> : null}
      {mode && f >= radioAt ? (
        <div style={{ position: "absolute", left: 70, top: 70, padding: "12px 16px", borderRadius: 10, background: "rgba(14,10,4,0.82)", border: `1.5px solid ${AMB}`, fontFamily: MONO, color: AMB, opacity: P(f, radioAt, 8) }}>
          <div style={{ fontSize: 14, letterSpacing: 4 }}>RÁDIO · ELI VANCE · ABRINDO</div>
          <svg width={360} height={40} style={{ marginTop: 6 }}>
            {Array.from({ length: 36 }).map((_, j) => { const h = 3 + Math.abs(Math.sin(f0 / 2.2 + j * 0.7)) * 32 * P(f, radioAt, 10); return <rect key={j} x={j * 10} y={20 - h / 2} width={5} height={h} fill={AMB} />; })}
          </svg>
        </div>
      ) : null}
      <AbsoluteFill style={{ boxShadow: "inset 0 0 220px rgba(0,0,0,0.85)", pointerEvents: "none" }} />
      <AbsoluteFill style={{ background: "#000", opacity: interpolate(f0, [0, 6, life - 6, life], [1, 0, 0, 1], C), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};
