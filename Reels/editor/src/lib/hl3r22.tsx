// HL3 · 1:43:17 a humanidade deixa a Terra para trás (30/10)
// Pedido dele: não no sítio do Borealis, e sem o Borealis sumindo do nada. Agora é outra cena, em três planos:
//  A · a cidade nova à noite (humanos + Combine: prédios humanos e estruturas Combine lado a lado, a Cidadela humana no
//      meio); no céu abre o portal do catalisador (dourado, o mesmo desenho da convergência); as naves sobem da cidade em fila
//  B · "a civilização que venceu os Combine passou a trabalhar com eles": de perto, um cargueiro humano e uma nave Combine
//      voando lado a lado, ligados; embaixo a curva da Terra ficando para trás
//  C · "a linha chegou exatamente onde precisava": o portal enche a tela, a flor da convergência dentro dele, as naves
//      entrando pelo centro · corte (o bonde de Black Mesa segue igual, HL13Leave)
import React from "react";
import { AbsoluteFill, Easing, interpolate, staticFile, useCurrentFrame } from "remotion";
import { C } from "./hl3";
import { FilmLook } from "./hl3r";
import { HL13TramHL1 } from "./hl3r23";

type PR = Record<string, number> & { life: number };
const at = (p: PR, k: string) => Math.round((p[k] as number | undefined) ?? 1e6);
const P = (f: number, t: number, d = 12) => interpolate(f, [t, t + d], [0, 1], { ...C, easing: Easing.out(Easing.cubic) });
const rnd = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const GOLD = "#ffd27a";
const ICE = "#9fe6ff";
const GREEN = "#8dffa8";
const AMBER = "#ffb22e";

// a nave Combine (a máscara do gunship) e o cargueiro humano
const Gunship: React.FC<{ x: number; y: number; w: number; o?: number; flip?: boolean }> = ({ x, y, w, o = 1, flip }) => {
  const h = w * 0.263;
  return (
    <foreignObject x={x - w / 2} y={y - h / 2} width={w} height={h} opacity={o}>
      <div style={{ width: "100%", height: "100%", transform: flip ? "scaleX(-1)" : undefined, WebkitMaskImage: `url(${staticFile("hl3silh/gunship_mask.png")})`, maskImage: `url(${staticFile("hl3silh/gunship_mask.png")})`, WebkitMaskSize: "100% 100%", maskSize: "100% 100%", background: "linear-gradient(180deg, #6a7c88, #10161b)" }} />
    </foreignObject>
  );
};
const Cargo: React.FC<{ x: number; y: number; s: number; f: number; o?: number }> = ({ x, y, s, f, o = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>
    {/* o rastro dos motores */}
    <path d={`M -30 30 L -36 ${110 + 14 * Math.sin(f / 3)} L -22 30 Z M 22 30 L 36 ${110 + 14 * Math.cos(f / 3)} L 30 30 Z`} fill="rgba(255,178,46,0.55)" style={{ filter: "blur(3px)" }} />
    <path d="M -14 -60 Q 0 -78 14 -60 L 20 10 L 62 24 L 64 34 L 20 30 L 16 40 L -16 40 L -20 30 L -64 34 L -62 24 L -20 10 Z" fill="#3c3a34" stroke="#cfc6ae" strokeWidth={2} />
    <path d="M -10 -50 L 10 -50 L 12 -10 L -12 -10 Z" fill="#23221e" />
    {[-40, -30, -20].map((yy) => <rect key={yy} x={-4} y={yy} width={8} height={5} fill="#ffd28a" />)}
    <rect x={-50} y={24} width={14} height={4} fill={GREEN} opacity={0.9} />
    <circle cx={-26} cy={34} r={6} fill="#ffb22e" />
    <circle cx={26} cy={34} r={6} fill="#ffb22e" />
  </g>
);
// o portal do catalisador: anéis dourados girando e a flor da convergência dentro
const Portal: React.FC<{ cx: number; cy: number; R: number; f: number; open: number; flower?: number; squash?: number }> = ({ cx, cy, R, f, open, flower = 0, squash = 0.34 }) => {
  const r = R * open;
  if (r < 1) return null;
  const pts: string[] = [];
  for (let k = 0; k < 5; k++)
    for (let i = 0; i <= 40; i++) {
      const s = i / 40, a = -Math.PI / 2 + (k * 2 * Math.PI) / 5 + (s - 0.5) * 1.08 + f * 0.004, rr = r * 0.62 * Math.sin(Math.PI * s);
      pts.push(`${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a) * squash * 2.6).toFixed(1)}`);
    }
  return (
    <g>
      <ellipse cx={cx} cy={cy} rx={r * 1.5} ry={r * 1.5 * squash * 2.6} fill="rgba(255,210,122,0.08)" style={{ filter: "blur(30px)" }} />
      {[1, 0.82, 0.64, 0.46].map((s, i) => (
        <ellipse key={i} cx={cx} cy={cy} rx={r * s} ry={r * s * squash * 2.6} fill="none" stroke={i % 2 ? "#fff2d8" : GOLD} strokeWidth={3 + i} opacity={0.85} strokeDasharray={`${50 + i * 24} 20`} strokeDashoffset={(f * (i % 2 ? -5 : 7)) % 600} />
      ))}
      <ellipse cx={cx} cy={cy} rx={r * 0.4} ry={r * 0.4 * squash * 2.6} fill="rgba(255,240,210,0.35)" style={{ filter: "blur(10px)" }} />
      {flower > 0 ? <polyline points={pts.join(" ")} fill="none" stroke={GOLD} strokeWidth={3} opacity={flower} /> : null}
      <circle cx={cx} cy={cy} r={6 + r * 0.03} fill="#fffaf0" />
    </g>
  );
};

export const HL13LeaveCity: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const [leaveAt, workAt, reachAt, cutAt] = ["leaveAt", "workAt", "reachAt", "cutAt"].map((k) => at(p, k));
  // 30/10: depois do corte, o bonde de Black Mesa montado com os modelos do Half-Life 1 (hl3r23)
  if (f >= cutAt) return <HL13TramHL1 {...p} />;
  const shot = f < workAt ? 0 : f < reachAt ? 1 : 2;
  const stars = Array.from({ length: 180 }).map((_, i) => <circle key={i} cx={rnd(i) * 1920} cy={rnd(i * 3) * 700} r={0.5 + rnd(i * 5) * 1.3} fill="#fff" opacity={0.2 + 0.5 * rnd(i * 7)} />);
  let body: React.ReactNode;
  if (shot === 0) {
    const open = P(f, 0, 80);
    const tilt = interpolate(f, [leaveAt, workAt], [0, 120], { ...C, easing: Easing.inOut(Easing.quad) }); // a câmera sobe com as naves
    const PX = 960, PY = 190;
    // três camadas da cidade: humanos (âmbar) e Combine (escuro com ciano) lado a lado
    const layer = (n: number, seed: number, y0: number, hMax: number, depth: number) =>
      Array.from({ length: n }).map((_, i) => {
        const w = 1920 / n, x = i * w + rnd(seed + i) * w * 0.3;
        const comb = rnd(seed * 7 + i) > 0.6;
        const h = 40 + rnd(seed * 3 + i) * hMax * (comb ? 1.3 : 1);
        const bw = w * (0.6 + rnd(seed + i * 5) * 0.35);
        return (
          <g key={seed + "-" + i}>
            {comb ? (
              <path d={`M ${x} ${y0} L ${x + bw * 0.15} ${y0 - h} L ${x + bw * 0.55} ${y0 - h * 1.1} L ${x + bw} ${y0 - h * 0.7} L ${x + bw} ${y0} Z`} fill={`rgb(${10 + depth * 6},${14 + depth * 8},${18 + depth * 10})`} stroke={ICE} strokeOpacity={0.25 + 0.15 * depth} />
            ) : (
              <rect x={x} y={y0 - h} width={bw} height={h} fill={`rgb(${16 + depth * 8},${14 + depth * 7},${12 + depth * 6})`} />
            )}
            {Array.from({ length: Math.floor(h / 16) }).map((_, j) =>
              rnd(seed + i * 13 + j) > 0.45 ? <rect key={j} x={x + bw * (0.2 + 0.5 * rnd(i + j * 3))} y={y0 - h + 10 + j * 16} width={4 + depth} height={3 + depth} fill={comb ? "#5ff3ff" : "#ffd28a"} opacity={0.4 + 0.15 * depth} /> : null,
            )}
          </g>
        );
      });
    // as naves subindo da cidade em fila até o portal
    const ships = Array.from({ length: 22 }).map((_, i) => {
      const u = (f - leaveAt - i * 7) / 110;
      if (u <= 0 || u >= 1) return null;
      const x0 = 200 + rnd(i * 11) * 1520, y0 = 880;
      const e = Easing.inOut(Easing.quad)(u);
      const x = x0 + (PX - x0) * e, y = y0 + (PY - y0) * e - Math.sin(u * Math.PI) * 80;
      const s = 0.55 * (1 - 0.85 * e);
      const comb = i % 2 === 1;
      return (
        <g key={i}>
          <line x1={x} y1={y} x2={x - (PX - x0) * 0.06} y2={y + 60 * s + 30} stroke={comb ? ICE : AMBER} strokeWidth={2} opacity={0.5} />
          {comb ? <Gunship x={x} y={y} w={300 * s} /> : <Cargo x={x} y={y} s={s * 0.7} f={f + i * 5} />}
        </g>
      );
    });
    body = (
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="lcSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#03060c" /><stop offset="0.7" stopColor="#0b1622" /><stop offset="1" stopColor="#1c2a30" /></linearGradient>
        </defs>
        <rect width={1920} height={1080} fill="url(#lcSky)" />
        <g transform={`translate(0 ${tilt})`}>
          {stars}
          <Portal cx={PX} cy={PY} R={300} f={f} open={open} flower={P(f, 40, 40) * 0.6} />
          {/* a luz do portal sobre a cidade */}
          <rect x={0} y={600} width={1920} height={480} fill="rgba(255,210,122,0.05)" opacity={open} />
          {/* holofotes varrendo o céu */}
          {[0, 1, 2].map((k) => {
            const a = Math.sin(f / 50 + k * 2) * 0.35;
            const bx = 400 + k * 560;
            return <path key={k} d={`M ${bx} 860 L ${bx + Math.sin(a) * 900 - 40} 80 L ${bx + Math.sin(a) * 900 + 40} 80 Z`} fill="rgba(159,230,255,0.05)" />;
          })}
          {layer(28, 3, 820, 170, 0)}
          {/* a Cidadela humana no meio, a lâmina com as faixas acesas, apontando para o portal */}
          <path d="M 920 900 L 948 420 L 960 360 L 972 420 L 1000 900 Z" fill="#0c1a22" stroke={ICE} strokeWidth={2} />
          {[480, 560, 640, 720, 800].map((y) => <line key={y} x1={950 - (y - 420) * 0.06} y1={y} x2={970 + (y - 420) * 0.06} y2={y} stroke="#5ff3ff" strokeWidth={3} opacity={0.8} />)}
          <line x1={960} y1={360} x2={PX} y2={PY} stroke="#dff8ff" strokeWidth={3} opacity={0.4 * open} />
          {layer(22, 17, 900, 220, 1)}
          {ships}
          {layer(14, 29, 1000, 260, 2)}
          <rect x={0} y={990} width={1920} height={200} fill="#050708" />
        </g>
      </svg>
    );
  } else if (shot === 1) {
    // de perto: humanos e Combine lado a lado; a Terra ficando para trás embaixo
    const t = (f - workAt) / Math.max(1, reachAt - workAt);
    const earthY = 900 + 260 * t;
    const bob = (k: number) => Math.sin(f / 14 + k) * 8;
    body = (
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <radialGradient id="lcEarth" cx="0.45" cy="0.1" r="0.8"><stop offset="0" stopColor="#2c5e86" /><stop offset="0.6" stopColor="#0c2240" /><stop offset="1" stopColor="#030914" /></radialGradient>
          <radialGradient id="lcAtmo" cx="0.5" cy="1" r="0.6"><stop offset="0.88" stopColor="rgba(140,205,255,0)" /><stop offset="0.95" stopColor="rgba(140,205,255,0.6)" /><stop offset="1" stopColor="rgba(140,205,255,0)" /></radialGradient>
        </defs>
        <rect width={1920} height={1080} fill="#02040a" />
        {stars}
        {/* a curva da Terra, descendo */}
        <ellipse cx={960} cy={earthY + 1500} rx={2300} ry={1560} fill="url(#lcAtmo)" />
        <ellipse cx={960} cy={earthY + 1500} rx={2200} ry={1500} fill="url(#lcEarth)" />
        {Array.from({ length: 120 }).map((_, i) => {
          const x = rnd(i * 9) * 1920, y = earthY + 20 + rnd(i * 4) * 200;
          return <circle key={i} cx={x} cy={y} r={0.8 + rnd(i) * 1.6} fill="#ffd28a" opacity={0.5 + 0.4 * rnd(i * 3)} />;
        })}
        {/* o portal lá em cima, onde as naves da frente estão chegando */}
        <Portal cx={960} cy={150} R={120} f={f} open={1} flower={0.5} />
        {Array.from({ length: 10 }).map((_, i) => {
          const u = ((f - workAt) / 90 + i / 10) % 1;
          const x = 960 + (rnd(i) - 0.5) * 1400 * (1 - u), y = 700 - 550 * u;
          const s = 0.3 * (1 - u);
          return i % 2 ? <Gunship key={i} x={x} y={y} w={260 * s} o={0.8} /> : <Cargo key={i} x={x} y={y} s={s * 0.6} f={f + i * 9} o={0.8} />;
        })}
        {/* os dois, de perto, lado a lado, e a ligação entre eles */}
        <line x1={720} y1={600 + bob(0)} x2={1220} y2={590 + bob(2)} stroke={GREEN} strokeWidth={3} strokeDasharray="10 8" strokeDashoffset={-f * 2} opacity={P(f, workAt + 20, 14)} />
        <Cargo x={640} y={620 + bob(0)} s={2.1} f={f} />
        <Gunship x={1290} y={600 + bob(2)} w={620} flip />
      </svg>
    );
  } else {
    // o portal enche a tela; a flor da convergência; as naves entram pelo centro
    const k = (f - reachAt) / Math.max(1, cutAt - reachAt);
    const R = 520 + 500 * k;
    const flash = P(f, cutAt - 18, 16);
    body = (
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <rect width={1920} height={1080} fill="#04050a" />
        {stars}
        <Portal cx={960} cy={540} R={R} f={f} open={1} flower={1} squash={0.385} />
        {Array.from({ length: 16 }).map((_, i) => {
          const a = (i / 16) * Math.PI * 2;
          const u = ((f - reachAt) / 70 + rnd(i)) % 1;
          const r = 1000 * (1 - u);
          const x = 960 + Math.cos(a) * r, y = 540 + Math.sin(a) * r * 0.6;
          const s = 0.4 * (1 - u);
          return i % 2 ? <Gunship key={i} x={x} y={y} w={300 * s} o={1 - u * 0.5} /> : <Cargo key={i} x={x} y={y} s={s * 0.7} f={f + i * 7} o={1 - u * 0.5} />;
        })}
        <rect width={1920} height={1080} fill="#fff8ea" opacity={flash} />
      </svg>
    );
  }
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      {body}
      <AbsoluteFill style={{ background: "#000", opacity: interpolate(f, [0, 8], [1, 0], C) + (Math.abs(f - workAt) < 3 || Math.abs(f - reachAt) < 3 ? 0.6 : 0), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};
