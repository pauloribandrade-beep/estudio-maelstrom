// =================================================================================================
// HL3 · 5B a espera e a chegada do Borealis em ILUSTRAÇÃO CHAPADA (31/10/2026), no mesmo gelo do Ártico 2D (hl3r27):
//  · HLRWaitFlat   (0:36:04) o snowcat de faróis acesos, as estrelas correndo, o relógio do Borealis zera e nada acontece
//  · HLRArriveFlat (0:36:15) num quadro o gelo vazio, no outro o navio ali, preso no gelo; a escala; a janela longa; a escotilha
// =================================================================================================
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { MONO } from "./overlays";
import { C } from "./hl3";
import { FilmLook } from "./hl3r";
import { rnd, cl, eo, P, pts, World, Sky, Ship, SHIP_X, SHIP_Y, camAt, Label, K } from "./hl3r27";
import { GordonBack, Defs, Snowfall } from "./hl3r28";
import { AlyxSide } from "./hl3chars";

type PR = Record<string, number> & { life: number };
const at = (p: PR, k: string) => Math.round((p[k] as number | undefined) ?? 1e6);

// ---------------------------------------------------------------------------------------------- o snowcat
const Snowcat: React.FC<{ x: number; y: number; s: number; f: number; lights: number }> = ({ x, y, s, f, lights }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ellipse cx={0} cy={4} rx={150} ry={16} fill="#5d7a90" opacity={0.5} />
    {/* o facho dos faróis no gelo, para a direita */}
    {lights > 0 ? (
      <g opacity={lights * (0.9 + 0.1 * Math.sin(f / 7))}>
        <polygon points={pts([[120, -54], [900, -150], [980, 70], [120, -30]])} fill="#fff4c8" opacity={0.16} />
        <polygon points={pts([[120, -50], [700, -90], [740, 30], [120, -34]])} fill="#fff4c8" opacity={0.16} />
        <ellipse cx={620} cy={10} rx={260} ry={40} fill="#fff4c8" opacity={0.2} />
      </g>
    ) : null}
    {/* esteiras */}
    <rect x={-140} y={-34} width={270} height={34} rx={17} fill="#22262b" />
    {Array.from({ length: 9 }).map((_, k) => <circle key={k} cx={-120 + k * 30} cy={-17} r={9} fill="#3a4048" />)}
    {/* cabine */}
    <polygon points={pts([[-130, -34], [130, -34], [130, -80], [70, -82], [40, -132], [-110, -132], [-130, -100]])} fill="#c8452f" />
    <polygon points={pts([[-130, -34], [130, -34], [130, -52], [-130, -52]])} fill="#9a3324" />
    <polygon points={pts([[46, -124], [68, -84], [124, -84], [124, -78], [62, -78], [36, -124]])} fill="#e8edf1" />
    <polygon points={pts([[-30, -124], [30, -124], [52, -86], [-30, -86]])} fill="#2a3a4a" />
    <polygon points={pts([[-100, -124], [-40, -124], [-40, -86], [-100, -86]])} fill="#2a3a4a" />
    <rect x={-60} y={-142} width={90} height={10} fill="#3a4048" />
    <rect x={-50} y={-150} width={70} height={8} fill="#e0a83a" />
    <rect x={120} y={-70} width={14} height={12} rx={3} fill={lights > 0 ? "#fff8d8" : "#5a5f66"} />
    {lights > 0 ? <circle cx={130} cy={-64} r={22} fill="#fff4c8" opacity={0.35 * lights} /> : null}
  </g>
);

// o relógio do Borealis (mostrador do HEV): o anel laranja se esvazia até o instante previsto
const BorealisClock: React.FC<{ k: number; hit: number; f: number; o: number }> = ({ k, hit, f, o }) => {
  if (o <= 0) return null;
  const X = 190, Y = 880, R = 92, a = (1 - k) * Math.PI * 2;
  const end = [X + Math.sin(a) * R, Y - Math.cos(a) * R];
  const secs = Math.max(0, Math.round((1 - k) * 4 * 3600));
  const hh = String(Math.floor(secs / 3600)).padStart(2, "0"), mm = String(Math.floor((secs % 3600) / 60)).padStart(2, "0"), ss = String(secs % 60).padStart(2, "0");
  return (
    <g opacity={o}>
      <circle cx={X} cy={Y} r={R + 26} fill="#0b121b" opacity={0.85} />
      <circle cx={X} cy={Y} r={R} fill="none" stroke="#2a323c" strokeWidth={16} />
      {k < 1 ? <path d={`M ${X} ${Y - R} A ${R} ${R} 0 ${a > Math.PI ? 1 : 0} 1 ${end[0]} ${end[1]}`} fill="none" stroke="#e07a2c" strokeWidth={16} strokeLinecap="round" /> : null}
      {hit > 0 ? <circle cx={X} cy={Y} r={R + 10 + hit * 40} fill="none" stroke="#ffd9b0" strokeWidth={10} opacity={1 - hit} /> : null}
      {/* o navio como ponteiro */}
      <g transform={`translate(${X} ${Y}) rotate(${(a * 180) / Math.PI})`}>
        <polygon points={pts([[-6, 8], [6, 8], [8, -60], [0, -72], [-8, -60]])} fill="#dfe5ea" />
      </g>
      <circle cx={X} cy={Y} r={8} fill="#e07a2c" />
      <text x={X} y={Y + R + 64} textAnchor="middle" fontFamily={MONO} fontSize={26} letterSpacing={5} fill={k >= 1 ? "#ffd9b0" : "#cfe3ff"}>
        {`${hh}:${mm}:${ss}`}
      </text>
      <text x={X + R + 46} y={Y - 30} fontFamily={MONO} fontSize={18} letterSpacing={4} fill="#8a949e">RELÓGIO DO BOREALIS</text>
      <text x={X + R + 46} y={Y} fontFamily={MONO} fontSize={18} letterSpacing={4} fill={k >= 1 ? "#ffd9b0" : "#8a949e"}>{k >= 1 ? "INSTANTE PREVISTO" : "CONTAGEM"}</text>
    </g>
  );
};

// rastros das estrelas no time-lapse (giram em volta do polo)
const StarTrails: React.FC<{ rot: number }> = ({ rot }) =>
  rot <= 0 ? null : (
    <g>
      {Array.from({ length: 90 }).map((_, i) => {
        const r = 300 + rnd(i * 3) * 1500, a0 = rnd(i * 7) * Math.PI * 2, PX = 2400, PY = -700;
        const a1 = a0 + rot;
        const p0 = [PX + Math.cos(a0) * r, PY + Math.sin(a0) * r], p1 = [PX + Math.cos(a1) * r, PY + Math.sin(a1) * r];
        return <path key={i} d={`M ${p0[0]} ${p0[1]} A ${r} ${r} 0 0 1 ${p1[0]} ${p1[1]}`} fill="none" stroke="#e8f0ff" strokeWidth={2.5 + rnd(i) * 2} strokeLinecap="round" opacity={0.35 + 0.4 * rnd(i * 5)} />;
      })}
    </g>
  );

// palco calmo (antes do colapso): céu com paralaxe, gelo, navio opcional
const SC = 2.4, SCX = SHIP_X + 420; // na chegada o navio é desenhado grande (200 m ao lado do snowcat)
const shipT = `translate(${SCX} ${SHIP_Y}) scale(${SC}) translate(${-SCX} ${-SHIP_Y})`;
const Calm: React.FC<{ f: number; cx: number; cy: number; z: number; ship: number; rot?: number; big?: boolean; children?: React.ReactNode }> = ({ f, cx, cy, z, ship, rot = 0, big, children }) => (
  <>
    <g transform={`translate(960 540) scale(${1 + (z - 1) * 0.3}) translate(${-(1800 + (cx - 1800) * 0.3)} ${-(560 + (cy - 700) * 0.3)})`}>
      <Sky f={f} />
      <StarTrails rot={rot} />
    </g>
    <g transform={`translate(960 540) scale(${z}) translate(${-cx} ${-cy})`}>
      <World f={f} />
      {ship > 0 ? (
        <g opacity={ship} transform={big ? shipT : undefined}>
          <Ship f={f} phase={0} />
        </g>
      ) : null}
      {children}
    </g>
  </>
);
// a equipe: o snowcat, a Alyx e o Gordon olhando o ponto vazio
const Team: React.FC<{ f: number; lights: number; walk?: number }> = ({ f, lights, walk = 0 }) => {
  const w = eo(walk);
  return (
    <>
      <Snowcat x={1560} y={1010} s={0.9} f={f} lights={lights} />
      <AlyxSide x={1800 + w * 170} y={1030 - w * 300} s={0.9 - w * 0.5} d={1} ph={f * 0.22} amp={walk > 0 && walk < 1 ? 1 : 0} f={f} />
      <GordonBack x={1900 + w * 150} y={1150 - w * 400} s={1.05 - w * 0.62} ph={f * 0.2} amp={walk > 0 && walk < 1 ? 1 : 0} />
    </>
  );
};

// ---------------------------------------------------------------------------------------------- 0:36:04 a espera
export const HLRWaitFlat: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [senseAt, minAt, nothingAt, nowAt, lightAt, portalAt, airAt] = ["senseAt", "minAt", "nothingAt", "nowAt", "lightAt", "portalAt", "airAt"].map((k) => at(p, k));
  const cam = camAt(f, [
    [0, 1900, 900, 1.15],
    [minAt, 2050, 820, 0.85],
    [nowAt, 2250, 780, 0.75],
    [life, 2350, 760, 0.72],
  ] as K[]);
  const [, cx, cy, z] = cam;
  // o relógio: zera no instante previsto
  const k = cl((f - senseAt) / Math.max(1, nowAt - senseAt));
  const rot = interpolate(f, [minAt, nowAt], [0, 0.9], C);
  const lab = (a: number, b: number) => P(f, a, 10) * (1 - P(f, b - 6, 6));
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#0d1b2e" }}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        <Defs />
        <Calm f={f + (f > minAt ? (Math.min(f, nowAt) - minAt) * 6 : 0)} cx={cx} cy={cy} z={z} ship={0} rot={rot}>
          {/* o ponto previsto no gelo, vazio */}
          <ellipse cx={2660} cy={700} rx={420} ry={26} fill="#fff4c8" opacity={0.12} />
          <Team f={f} lights={1} />
        </Calm>
        <Snowfall t={f} cx={cx} z={z} n={70} />
        <BorealisClock k={k} hit={f >= nowAt ? cl((f - nowAt) / 14) : 0} f={f} o={P(f, senseAt - 6, 10)} />
      </svg>
      <Label x={960} y={130} text="OS MINUTOS PASSAM" sub="NADA ACONTECE" col="#cfe3ff" o={lab(minAt, nowAt)} align="center" />
      <Label x={960} y={130} text="O INSTANTE PREVISTO" col="#ffd9b0" o={lab(nowAt, lightAt)} align="center" />
      <Label x={960} y={130} text="NÃO EXISTE LUZ" col="#e6dcff" o={P(f, lightAt, 10)} align="center" />
      <Label x={960} y={186} text="NEM PORTAL" col="#e6dcff" o={P(f, portalAt, 10)} align="center" />
      <Label x={960} y={242} text="O AR NÃO DISTORCE" col="#e6dcff" o={P(f, airAt, 10)} align="center" />
      <AbsoluteFill style={{ background: "#000", opacity: interpolate(f, [0, 8], [1, 0], C), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------- 0:36:15 a chegada
export const HLRArriveFlat: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [emptyAt, shipAt, hugeAt, stuckAt, yearsAt, notAt, calcAt, enoughAt, goAt, enterAt] = ["emptyAt", "shipAt", "hugeAt", "stuckAt", "yearsAt", "notAt", "calcAt", "enoughAt", "goAt", "enterAt"].map((k) => at(p, k));
  const HX = SHIP_X + 160, HY = SHIP_Y - 50; // a escotilha no casco (coordenadas do navio)
  const hx = SCX + (HX - SCX) * SC, hy = SHIP_Y + (HY - SHIP_Y) * SC;
  const cam = camAt(f, [
    [0, 2350, 760, 0.72],
    [shipAt, 2400, 640, 0.62],
    [hugeAt + 30, 2400, 560, 0.5],
    [stuckAt + 30, 2700, 650, 1.2],
    [yearsAt + 30, 2700, 500, 0.9],
    [notAt + 20, 2400, 600, 0.58],
    [calcAt + 20, 2380, 620, 0.58],
    [goAt, 2200, 760, 0.8],
    [enterAt + 20, hx, hy + 60, 1.1],
    [life, hx, hy + 20, 1.6],
  ] as K[]);
  const [, cx, cy, z] = cam;
  const there = f >= shipAt;
  // "só que não estava": por alguns quadros o navio some e volta
  const blink = f >= notAt && f < notAt + 24 && Math.floor((f - notAt) / 4) % 2 === 0;
  const ship = there && !blink ? 1 : 0;
  const walk = cl((f - goAt) / (life - goAt));
  const hatch = P(f, enterAt, 16);
  // a janela da Mossman: uma faixa longa sobre a linha do tempo
  const win = eo(cl((f - calcAt - 10) / 50));
  const lab = (a: number, b: number) => P(f, a, 10) * (1 - P(f, b - 6, 6));
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#0d1b2e" }}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        <Defs />
        <Calm f={f + 400} cx={cx} cy={cy} z={z} ship={ship} big>
          {there ? (
            <g opacity={ship} transform={shipT}>
              {/* o gelo empilhado contra o casco e a neve nos conveses */}
              {Array.from({ length: 14 }).map((_, i) => {
                const x = SHIP_X + 10 + i * 58, h = 14 + rnd(i * 3) * 26;
                return <polygon key={i} points={pts([[x - 30, SHIP_Y + 4], [x - 6, SHIP_Y - h], [x + 14, SHIP_Y - h * 0.6], [x + 34, SHIP_Y + 4]])} fill={i % 2 ? "#eef6fb" : "#cfe1ec"} />;
              })}
              {Array.from({ length: 8 }).map((_, i) => <rect key={"s" + i} x={SHIP_X + 30 + i * 95} y={SHIP_Y - 104} width={60} height={6} rx={3} fill="#f4f9fc" opacity={P(f, yearsAt, 20)} />)}
              {Array.from({ length: 10 }).map((_, i) => <polygon key={"c" + i} points={pts([[SHIP_X + 60 + i * 70, SHIP_Y - 100], [SHIP_X + 66 + i * 70, SHIP_Y - 100], [SHIP_X + 63 + i * 70, SHIP_Y - 82 - rnd(i) * 14]])} fill="#dff0fa" opacity={P(f, yearsAt, 20)} />)}
              {/* a escotilha */}
              <rect x={HX - 24} y={HY - 40} width={48} height={60} rx={6} fill="#1d2630" />
              <rect x={HX - 24} y={HY - 40} width={48} height={60} rx={6} fill="#ffe6a8" opacity={hatch} />
              {hatch > 0 ? <ellipse cx={HX} cy={HY - 10} rx={90} ry={70} fill="#ffe6a8" opacity={0.25 * hatch} /> : null}
            </g>
          ) : null}
          {/* no quadro vazio, a poeira de neve assenta quando ele aparece */}
          {there && f < shipAt + 40 ? <ellipse cx={SHIP_X + 420} cy={SHIP_Y - 20} rx={520} ry={70} fill="#f4f9fc" opacity={0.6 * (1 - (f - shipAt) / 40)} /> : null}
          <Team f={f} lights={1} walk={walk} />
        </Calm>
        <Snowfall t={f} cx={cx} z={z} n={70} />
        {/* a janela longa da Mossman */}
        {f >= calcAt ? (
          <g opacity={P(f, calcAt, 10) * (1 - P(f, goAt, 10))}>
            <rect x={360} y={880} width={1200} height={22} rx={11} fill="#2a323c" />
            <rect x={360 + 300} y={880} width={760 * win} height={22} rx={11} fill="#e07a2c" />
            {Array.from({ length: 13 }).map((_, i) => <rect key={i} x={360 + i * 100} y={910} width={5} height={i % 4 ? 12 : 22} fill="#8a949e" />)}
            <rect x={360 + 300 - 3} y={860} width={8} height={64} fill="#ffd9b0" />
            <text x={360 + 300} y={848} textAnchor="middle" fontFamily={MONO} fontSize={18} letterSpacing={4} fill="#ffd9b0">AGORA</text>
            <text x={360 + 300 + 380 * win} y={960} textAnchor="middle" fontFamily={MONO} fontSize={20} letterSpacing={5} fill="#ffd9b0" opacity={win}>JANELA LONGA · CÁLCULO DA MOSSMAN</text>
          </g>
        ) : null}
      </svg>
      <Label x={960} y={130} text="NUM SEGUNDO, SÓ GELO VAZIO" col="#cfe3ff" o={lab(emptyAt, shipAt)} align="center" />
      <Label x={960} y={130} text="NO OUTRO, O BOREALIS ESTÁ ALI" sub="SEM CLARÃO" col="#ffffff" o={lab(shipAt + 4, hugeAt + 10)} align="center" />
      <Label x={960} y={130} text="UM CARGUEIRO GIGANTESCO" sub="O SNOWCAT PERTO DELE" col="#ffffff" o={lab(hugeAt + 10, stuckAt + 24)} align="center" />
      <Label x={960} y={130} text="PRESO NO GELO" sub="COMO SE ESTIVESSE ALI HÁ ANOS" col="#cfe3ff" o={lab(stuckAt + 24, notAt)} align="center" />
      <Label x={960} y={130} text="SÓ QUE NÃO ESTAVA" col="#ffb3c6" o={lab(notAt, calcAt)} align="center" />
      <Label x={960} y={130} text="DESSA VEZ, DURA O SUFICIENTE PARA ENTRAR" col="#ffd9b0" o={lab(enoughAt, goAt + 20)} align="center" />
      <Label x={960} y={130} text="ELES ENTRAM NO BOREALIS" col="#ffffff" o={P(f, enterAt + 10, 12)} align="center" />
      <AbsoluteFill style={{ background: "#000", opacity: interpolate(f, [life - 6, life], [0, 1], C), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};
