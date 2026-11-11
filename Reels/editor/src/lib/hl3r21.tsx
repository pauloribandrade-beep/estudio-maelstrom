// HL3 · 1:42:29 as linhas em paralelo (30/10, 2ª versão)
// Pedido dele: nem o tabuleiro 3D nem as linhas com textos resolviam; queria uma representação visual elaborada.
// Agora cada realidade é um MUNDO: um disco com a sua própria cidade/paisagem, girando devagar. Os mundos ficam empilhados
// em paralelo, e um único eixo dourado atravessa o centro de todos: a convergência (o catalisador).
//  · "não é um ciclo depois do outro": os quatro mundos em fila, com setas, riscados · eles sobem e se empilham
//  · a câmera desce de mundo em mundo enquanto ele fala de cada um:
//      a nossa: a cidade acesa, a Cidadela humana, humanos e Combine juntos no centro, o evento acontecendo
//      a guerra: prédios quebrados, fogo, o Strider, explosões
//      os Combine venceram há séculos: a Cidadela vermelha gigante, a cúpula, o resto apagado
//      Black Mesa nem aconteceu: o deserto, as mesas de pedra, o complexo de Black Mesa intacto, o céu de fim de tarde
//  · "cada uma num ponto diferente": o anel de tempo na borda de cada mundo, cheio até um ponto diferente
//  · "não é o tempo": os anéis giram desencontrados e se apagam · "é a convergência": o eixo acende e pulsos de luz o
//    percorrem, acendendo o centro de cada mundo · o mesmo alinhamento (os três anéis em cada centro) · o mesmo catalisador
import React from "react";
import { AbsoluteFill, Easing, interpolate, staticFile, useCurrentFrame } from "remotion";
import { MONO } from "./overlays";
import { C } from "./hl3";
import { FilmLook } from "./hl3r";

type PR = Record<string, number> & { life: number };
const at = (p: PR, k: string) => Math.round((p[k] as number | undefined) ?? 1e6);
const P = (f: number, t: number, d = 12) => interpolate(f, [t, t + d], [0, 1], { ...C, easing: Easing.out(Easing.cubic) });
const rnd = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const GREEN = "#8dffa8";
const RED = "#ff5d4d";
const GOLD = "#ffd27a";
const ICE = "#9fe6ff";
const ORANGE = "#ff9a3c";
const GRAY = "#b8c4cc";

type World = {
  ground: [string, string]; rim: string; grid: string;
  blocks: { a: number; r: number; w: number; h: number; col: string; win: string; broken?: boolean; kind?: "tower" | "mesa" | "dish" | "lab" }[];
};
// os quatro mundos (posições no disco em coordenadas polares; o centro fica livre para o evento)
type Blk = World["blocks"][number];
const mkWorlds = (): World[] => {
  const ring = (n: number, seed: number, r0: number, r1: number) =>
    Array.from({ length: n }).map((_, i) => ({ a: (i / n) * Math.PI * 2 + rnd(seed + i) * 0.4, r: r0 + rnd(seed * 3 + i) * (r1 - r0) }));
  const ours = ring(30, 11, 0.3, 0.9).map(({ a, r }, i): Blk => ({ a, r, w: 0.06 + rnd(i * 5) * 0.05, h: 0.18 + rnd(i * 7) * 0.45 * (1.1 - r), col: "#0f1c22", win: "#9fe6ff" }));
  ours.push({ a: 2.4, r: 0.48, w: 0.07, h: 1.25, col: "#0c1a22", win: "#5ff3ff", kind: "tower" });
  const war = ring(28, 23, 0.3, 0.9).map(({ a, r }, i) => ({ a, r, w: 0.06 + rnd(i * 9) * 0.05, h: 0.1 + rnd(i * 11) * 0.35, col: "#1c140e", win: "#ff9a3c", broken: true }));
  const won = ring(24, 37, 0.35, 0.92).map(({ a, r }, i): Blk => ({ a, r, w: 0.05 + rnd(i * 13) * 0.04, h: 0.06 + rnd(i * 3) * 0.14, col: "#140c0c", win: "#5a1a1a" }));
  won.push({ a: 0.9, r: 0.5, w: 0.13, h: 1.9, col: "#1a0a0a", win: "#ff5d4d", kind: "tower" });
  const bm = ring(9, 51, 0.55, 0.92).map(({ a, r }, i): Blk => ({ a, r, w: 0.16 + rnd(i) * 0.12, h: 0.12 + rnd(i * 2) * 0.16, col: "#3a2616", win: "", kind: "mesa" }));
  bm.push({ a: 3.6, r: 0.42, w: 0.2, h: 0.1, col: "#5a5a52", win: "#ffe2b0", kind: "lab" }, { a: 3.95, r: 0.5, w: 0.08, h: 0.16, col: "#6a6a62", win: "", kind: "dish" });
  return [
    { ground: ["#0d1a1e", "#050a0c"], rim: GREEN, grid: "rgba(95,243,208,0.18)", blocks: ours },
    { ground: ["#22140a", "#0a0604"], rim: ORANGE, grid: "rgba(255,154,60,0.14)", blocks: war },
    { ground: ["#1c0808", "#080303"], rim: RED, grid: "rgba(255,93,77,0.14)", blocks: won },
    { ground: ["#4a3420", "#1a1008"], rim: ICE, grid: "rgba(255,226,176,0.1)", blocks: bm },
  ];
};
const WORLDS = mkWorlds();

export const HL13Parallel: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [seqAt, xAt, ourAt, warAt, wonAt, bmAt, nowAt, shareAt, convAt, sameAt, alignAt, catAt, enoughAt] = ["seqAt", "xAt", "ourAt", "warAt", "wonAt", "bmAt", "nowAt", "shareAt", "convAt", "sameAt", "alignAt", "catAt", "enoughAt"].map((k) => at(p, k));
  // da fila para a pilha
  const m = interpolate(f, [ourAt - 14, ourAt + 26], [0, 1], { ...C, easing: Easing.inOut(Easing.cubic) });
  const STACK_Y = [235, 465, 695, 925];
  const ROW_X = [300, 740, 1180, 1620];
  const lay = (k: number) => ({ cx: ROW_X[k] + (960 - ROW_X[k]) * m, cy: 600 + (STACK_Y[k] - 600) * m, R: 175 + 125 * m, tilt: 0.42 - 0.12 * m });
  // a câmera: desce de mundo em mundo, depois abre para a pilha inteira
  const camKeys: [number, number, number][] = [[0, 1, 540], [ourAt - 14, 1, 540], [ourAt + 30, 1.75, STACK_Y[0] - 20], [warAt - 10, 1.75, STACK_Y[0] - 20], [warAt + 20, 1.75, STACK_Y[1] - 20], [wonAt - 10, 1.75, STACK_Y[1] - 20], [wonAt + 20, 1.75, STACK_Y[2] - 30], [bmAt - 10, 1.75, STACK_Y[2] - 30], [bmAt + 20, 1.75, STACK_Y[3] - 20], [nowAt - 16, 1.75, STACK_Y[3] - 20], [nowAt + 34, 1, 560], [life, 0.96, 560]];
  const camAt = (i: 1 | 2) => interpolate(f, camKeys.map((k) => k[0]), camKeys.map((k) => k[i]), { ...C, easing: Easing.inOut(Easing.cubic) });
  const cs = camAt(1), cy = camAt(2);
  const rot = f * 0.004;
  const NOW = [1, 0.66, 0.9, 0.12];
  const timeO = (1 - P(f, shareAt + 26, 30)) * P(f, nowAt, 14);
  const desync = f >= shareAt ? P(f, shareAt, 20) : 0;
  const conv = f >= convAt ? P(f, convAt, 30) : 0;
  const al = f >= alignAt ? P(f, alignAt, 40) : 0;
  const cat = f >= catAt ? P(f, catAt, 24) : 0;
  const dimEnd = f >= enoughAt ? P(f, enoughAt, 40) : 0;
  const head = (t0: number, t1: number, txt: string, col = "#f2f0f7") =>
    f >= t0 && f < t1 ? <div key={txt} style={{ position: "absolute", left: 0, right: 0, top: 56, textAlign: "center", fontSize: 26, letterSpacing: 8, color: col, opacity: P(f, t0, 10) * (1 - P(f, t1 - 8, 8)), textShadow: "0 2px 10px #000" }}>{txt}</div> : null;

  const world = (k: number) => {
    const W = WORLDS[k];
    const { cx, cy: wy, R, tilt } = lay(k);
    const th = rot * (k % 2 ? -1 : 1) + k * 0.8;
    const pj = (a: number, r: number, h = 0) => {
      const X = Math.cos(a + th) * r, Z = Math.sin(a + th) * r;
      return { x: cx + X * R, y: wy + Z * R * tilt - h * R * 0.5, z: Z };
    };
    const id = `pw${k}`;
    const shown = k === 0 ? 1 : f < ourAt ? P(f, k * 8, 14) : 1;
    // o centro do mundo: onde o evento acontece
    const ev = k === 0 ? 0.6 + 0.4 * Math.sin(f / 6) : 0;
    const pulse = f >= sameAt ? Math.max(0, Math.cos(((f - sameAt) / 70 - k * 0.22) * Math.PI * 2)) ** 6 : 0;
    const hot = Math.max(ev * (1 - conv * 0.3), conv * 0.5, pulse, cat);
    const blocks = W.blocks.map((b) => ({ b, q: pj(b.a, b.r) })).sort((A, B) => A.q.z - B.q.z);
    const back = blocks.filter((x) => x.q.z < 0), front = blocks.filter((x) => x.q.z >= 0);
    const drawBlock = ({ b, q }: { b: World["blocks"][number]; q: { x: number; y: number; z: number } }, i: number) => {
      const w = b.w * R, h = b.h * R * 0.5;
      const shade = 0.75 + 0.25 * q.z;
      if (b.kind === "mesa")
        return <path key={i} d={`M ${q.x - w} ${q.y} L ${q.x - w * 0.6} ${q.y - h} L ${q.x + w * 0.55} ${q.y - h} L ${q.x + w} ${q.y} Z`} fill={b.col} stroke="#7a5432" strokeWidth={1.2} opacity={shade} />;
      if (b.kind === "dish")
        return (
          <g key={i} opacity={shade}>
            <line x1={q.x} y1={q.y} x2={q.x} y2={q.y - h * 0.6} stroke="#9a9a90" strokeWidth={2} />
            <path d={`M ${q.x - w * 0.6} ${q.y - h} Q ${q.x} ${q.y - h * 0.4} ${q.x + w * 0.6} ${q.y - h}`} fill="none" stroke="#cfcfc4" strokeWidth={3} />
          </g>
        );
      if (b.kind === "lab")
        return (
          <g key={i} opacity={shade}>
            <rect x={q.x - w / 2} y={q.y - h} width={w} height={h} fill={b.col} stroke="#9a9a8a" />
            {Array.from({ length: 6 }).map((_, j) => <rect key={j} x={q.x - w / 2 + 4 + j * (w - 8) / 6} y={q.y - h * 0.6} width={3} height={3} fill={b.win} />)}
          </g>
        );
      const top = b.broken ? `L ${q.x + w / 2} ${q.y - h * 0.7} L ${q.x + w * 0.1} ${q.y - h * 0.85} L ${q.x - w * 0.15} ${q.y - h} L ${q.x - w / 2} ${q.y - h * 0.8}` : `L ${q.x + w / 2} ${q.y - h} L ${q.x - w / 2} ${q.y - h}`;
      return (
        <g key={i} opacity={shade}>
          {b.kind === "tower" ? (
            <path d={`M ${q.x - w / 2} ${q.y} L ${q.x - w * 0.18} ${q.y - h} L ${q.x} ${q.y - h * 1.08} L ${q.x + w * 0.2} ${q.y - h} L ${q.x + w / 2} ${q.y} Z`} fill={b.col} stroke={b.win} strokeWidth={1.6} />
          ) : (
            <path d={`M ${q.x - w / 2} ${q.y} L ${q.x + w / 2} ${q.y} ${top} Z`} fill={b.col} stroke="rgba(242,240,247,0.12)" />
          )}
          {/* janelas */}
          {b.win && h > 14
            ? Array.from({ length: Math.min(8, Math.floor(h / 12)) }).map((_, j) => ((j + i) % 3 === 1 && b.kind !== "tower" ? null : <rect key={j} x={q.x - 2} y={q.y - 8 - j * 12} width={4} height={4} fill={b.win} opacity={b.kind === "tower" ? 0.9 : 0.55} />))
            : null}
          {/* o fogo na guerra */}
          {b.broken && rnd(i * 17) > 0.55 ? <circle cx={q.x} cy={q.y - h * 0.8} r={5 + 5 * rnd(i + Math.floor(f / 4))} fill={ORANGE} opacity={0.5 + 0.4 * rnd(i * 3 + Math.floor(f / 3))} style={{ filter: "blur(3px)" }} /> : null}
        </g>
      );
    };
    // o anel de tempo de cada mundo (até onde a história dele chegou)
    const arc = (frac: number, off: number) => {
      const pts: string[] = [];
      for (let i = 0; i <= 90; i++) {
        const a = -Math.PI / 2 + off + frac * Math.PI * 2 * (i / 90);
        pts.push(`${(cx + Math.cos(a) * R * 1.08).toFixed(1)},${(wy + Math.sin(a) * R * 1.08 * tilt).toFixed(1)}`);
      }
      return pts.join(" ");
    };
    const spin = desync * (f - shareAt) * 0.03 * (k % 2 ? -1 : 1) * (1 + k * 0.4);
    return (
      <g key={k} opacity={shown * (1 - 0.45 * dimEnd)}>
        <defs>
          <radialGradient id={id} cx="50%" cy="45%" r="60%"><stop offset="0" stopColor={W.ground[0]} /><stop offset="1" stopColor={W.ground[1]} /></radialGradient>
          <clipPath id={id + "c"}><ellipse cx={cx} cy={wy} rx={R} ry={R * tilt} /></clipPath>
        </defs>
        {/* a espessura do disco */}
        <path d={`M ${cx - R} ${wy} L ${cx - R} ${wy + 18} A ${R} ${R * tilt} 0 0 0 ${cx + R} ${wy + 18} L ${cx + R} ${wy} Z`} fill="#06080a" stroke={W.rim} strokeOpacity={0.35} />
        <ellipse cx={cx} cy={wy} rx={R} ry={R * tilt} fill={`url(#${id})`} stroke={W.rim} strokeWidth={2} strokeOpacity={0.7} />
        <g clipPath={`url(#${id}c)`}>
          {[0.3, 0.55, 0.8].map((r) => <ellipse key={r} cx={cx} cy={wy} rx={R * r} ry={R * r * tilt} fill="none" stroke={W.grid} />)}
          {Array.from({ length: 8 }).map((_, i) => { const a = (i / 8) * Math.PI * 2 + th; return <line key={i} x1={cx} y1={wy} x2={cx + Math.cos(a) * R} y2={wy + Math.sin(a) * R * tilt} stroke={W.grid} />; })}
          {/* Black Mesa: a luz quente do fim de tarde */}
          {k === 3 ? <ellipse cx={cx - R * 0.3} cy={wy - R * tilt * 0.4} rx={R * 0.8} ry={R * tilt * 0.7} fill="rgba(255,190,110,0.12)" /> : null}
        </g>
        {back.map(drawBlock)}
        {/* o centro: o ponto do evento neste mundo */}
        <ellipse cx={cx} cy={wy} rx={R * 0.16} ry={R * 0.16 * tilt} fill="none" stroke={GOLD} strokeWidth={2} opacity={0.4 + 0.6 * hot} />
        <ellipse cx={cx} cy={wy} rx={R * (0.1 + 0.25 * hot)} ry={R * (0.1 + 0.25 * hot) * tilt} fill={GOLD} opacity={0.12 + 0.35 * hot} style={{ filter: "blur(8px)" }} />
        {/* o mesmo alinhamento: os três anéis no centro de cada mundo */}
        {al > 0
          ? ([[0.15, ICE, 2.2], [0.11, GOLD, -1.6], [0.07, "#ff9a6a", 0.9]] as [number, string, number][]).map(([rr, c, a0], i) => {
              const a = -Math.PI / 2 + (a0 + k) * (1 - al) + (f / 40) * (1 - al) * (i % 2 ? -1 : 1);
              const nx = cx + Math.cos(a) * R * rr, ny = wy + Math.sin(a) * R * rr * tilt;
              return (
                <g key={i} opacity={P(f, alignAt, 12)}>
                  <ellipse cx={cx} cy={wy} rx={R * rr} ry={R * rr * tilt} fill="none" stroke={c} strokeWidth={2.5} />
                  <rect x={nx - 5} y={ny - 5} width={10} height={10} transform={`rotate(45 ${nx} ${ny})`} fill={c} />
                </g>
              );
            })
          : null}
        {/* a nossa: humanos e Combine juntos no centro */}
        {k === 0
          ? [[-0.07, GREEN], [-0.03, GREEN], [0.03, GRAY], [0.07, GRAY]].map(([dx, c], i) => {
              const x = cx + (dx as number) * R, y = wy + R * tilt * 0.08;
              return (
                <g key={"p" + i} opacity={0.95}>
                  <circle cx={x} cy={y - 22} r={4.5} fill={c as string} />
                  <path d={`M ${x - 5} ${y - 17} L ${x + 5} ${y - 17} L ${x + 4} ${y} L ${x - 4} ${y} Z`} fill={c as string} />
                </g>
              );
            })
          : null}
        {front.map(drawBlock)}
        {/* a guerra: o Strider e as explosões */}
        {k === 1 ? (() => {
          const q = pj(1.2, 0.55);
          return (
            <g>
              <image href={staticFile("hl3silh/strider_icone.png")} x={q.x - 50} y={q.y - 120} width={100} height={110} style={{ filter: "drop-shadow(0 0 6px rgba(255,154,60,0.7))" }} />
              {[0, 1, 2, 3].map((j) => {
                const t = ((f + j * 11) / 24) % 1;
                const e = pj(j * 1.7 + Math.floor((f + j * 11) / 24), 0.4 + 0.12 * j);
                return <circle key={j} cx={e.x} cy={e.y - 10} r={4 + 26 * t} fill={j % 2 ? "#ffd27a" : ORANGE} opacity={0.75 * (1 - t)} />;
              })}
              <line x1={q.x - 6} y1={q.y - 70} x2={pj(0.4, 0.75).x} y2={pj(0.4, 0.75).y} stroke="#9fe6ff" strokeWidth={2} opacity={Math.floor(f / 5) % 4 === 0 ? 0.9 : 0} />
            </g>
          );
        })() : null}
        {/* os Combine venceram: a cúpula vermelha sobre tudo */}
        {k === 2 ? <path d={`M ${cx - R * 0.95} ${wy} A ${R * 0.95} ${R * 0.7} 0 0 1 ${cx + R * 0.95} ${wy}`} fill="rgba(255,93,77,0.06)" stroke={RED} strokeOpacity={0.35} strokeDasharray="4 8" /> : null}
        {/* Black Mesa ainda não aconteceu: o logo, intacto, pairando sobre o complexo */}
        {k === 3 ? (() => {
          const q = pj(3.75, 0.45, 0.6);
          return <image href={staticFile("hl3silh/bm_logo.svg")} x={q.x - 26} y={q.y - 26} width={52} height={52} opacity={0.75} style={{ filter: "invert(1)" }} />;
        })() : null}
        {/* o anel do tempo deste mundo */}
        {timeO > 0 ? (
          <g opacity={timeO}>
            <ellipse cx={cx} cy={wy} rx={R * 1.08} ry={R * 1.08 * tilt} fill="none" stroke="rgba(242,240,247,0.12)" strokeWidth={6} />
            <polyline points={arc(NOW[k], spin)} fill="none" stroke={W.rim} strokeWidth={6} strokeLinecap="round" />
          </g>
        ) : null}
      </g>
    );
  };

  // a fila (a ideia errada): setas entre os mundos e o X
  const rowO = 1 - m;
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, #13161c 0%, #030405 78%)", overflow: "hidden", fontFamily: MONO }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {/* estrelas */}
        {Array.from({ length: 140 }).map((_, i) => <circle key={i} cx={rnd(i) * 1920} cy={rnd(i * 3) * 1080} r={0.6 + rnd(i * 5)} fill="#fff" opacity={0.15 + 0.35 * rnd(i * 7)} />)}
        <g transform={`translate(960 540) scale(${cs}) translate(-960 ${-cy})`}>
          {/* o eixo da convergência: atravessa o centro de todos os mundos */}
          {m > 0 ? (
            <g opacity={m}>
              <rect x={960 - 2 - 6 * conv - 14 * cat} y={60} width={4 + 12 * conv + 28 * cat} height={960} fill={GOLD} opacity={0.25 + 0.5 * conv} style={{ filter: "blur(4px)" }} />
              <line x1={960} y1={60} x2={960} y2={1020} stroke="#fff2d8" strokeWidth={1.5 + 2 * conv} opacity={0.35 + 0.6 * conv} strokeDasharray={conv > 0 ? undefined : "6 10"} />
              {f >= sameAt
                ? [0, 1, 2].map((j) => {
                    const t = (((f - sameAt) / 70 + j / 3) % 1);
                    return <circle key={j} cx={960} cy={60 + 960 * t} r={9} fill="#fffaf0" opacity={P(f, sameAt, 10)} style={{ filter: "drop-shadow(0 0 10px #ffd27a)" }} />;
                  })
                : null}
            </g>
          ) : null}
          {[0, 1, 2, 3].map(world)}
          {rowO > 0 ? (
            <g opacity={rowO}>
              {[0, 1, 2].map((k) => <path key={k} d={`M ${ROW_X[k] + 190} 600 L ${ROW_X[k + 1] - 190} 600 M ${ROW_X[k + 1] - 206} 588 L ${ROW_X[k + 1] - 190} 600 L ${ROW_X[k + 1] - 206} 612`} stroke="rgba(242,240,247,0.6)" strokeWidth={3} fill="none" opacity={P(f, seqAt + k * 8, 10)} />)}
              {f >= xAt ? <path d="M 760 420 L 1160 780 M 1160 420 L 760 780" stroke={RED} strokeWidth={14} strokeLinecap="round" strokeDasharray={540} strokeDashoffset={540 * (1 - P(f, xAt, 12))} /> : null}
            </g>
          ) : null}
        </g>
        {cat > 0 ? <rect width={1920} height={1080} fill="#fff2d8" opacity={0.25 * (1 - P(f, catAt + 10, 30))} /> : null}
      </svg>
      {head(0, ourAt - 8, "NÃO É UM CICLO DEPOIS DO OUTRO")}
      {head(ourAt, warAt, "A NOSSA · HUMANOS E COMBINE NO CATALISADOR", GREEN)}
      {head(warAt, wonAt, "EM OUTRA · A GUERRA CONTINUA", ORANGE)}
      {head(wonAt, bmAt, "EM OUTRA · OS COMBINE VENCERAM HÁ SÉCULOS", RED)}
      {head(bmAt, nowAt, "EM OUTRA · BLACK MESA NEM ACONTECEU", ICE)}
      {head(nowAt, shareAt, "CADA UMA NUM PONTO DA PRÓPRIA HISTÓRIA")}
      {head(shareAt, convAt, "NÃO É O TEMPO", RED)}
      {head(convAt, alignAt, "É A CONVERGÊNCIA", GOLD)}
      {head(alignAt, catAt, "O MESMO ALINHAMENTO", ICE)}
      {head(catAt, 1e9, "O MESMO CATALISADOR", GOLD)}
      <AbsoluteFill style={{ background: "#000", opacity: interpolate(f, [0, 8, life - 8, life], [1, 0, 0, 1], C), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};
