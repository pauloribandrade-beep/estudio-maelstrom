// HL3 · Final 2, o colapso, depois da sala do núcleo (31/10)
// Pedido dele: "só fica uma grande parte do vídeo pulsando" (a câmara do núcleo por mais de um minuto). Agora, de "em vez de
// redirecionar a energia" em diante, cada trecho da narração tem o seu plano:
//  F · o plano era mandar a energia do catalisador para a assinatura da rede Combine (fluxo subindo até a malha) → "fazem o
//      contrário": o fluxo para, vira e desce para a ferida · o núcleo é empurrado contra ela
//  M · Borealis, núcleo e ferida como três engrenagens que giram juntas alimentando o catalisador → perdem o passo e travam
//  K · colapsam uns sobre os outros (as três se fecham num ponto)
//  L · a Alyx encaixa a última peça (o anel de encaixes com o vazio laranja)
//  S · o Borealis começa a morrer: sem explosão, o casco perde a estabilidade, setores somem e voltam em estados diferentes
//  G · o gelo racha em volta, a gravidade falha (gelo e destroços subindo) · a ferida se fechando (Kleiner) · a Terra puxada
//      junto · o silêncio do Eli · "Alyx."
import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { MONO } from "./overlays";
import { C, HL, rnd } from "./hl3";
import { FilmLook } from "./hl3r";
import { ShipProfile } from "./hl3rd";
import { RadioCard } from "./hl3r9";

type PR = Record<string, number> & { life: number };
const at = (p: PR, k: string) => Math.round((p[k] as number | undefined) ?? 1e6);
const P = (f: number, t: number, d = 12) => interpolate(f, [t, t + d], [0, 1], { ...C, easing: Easing.out(Easing.cubic) });
const IO = (f: number, t: number, d = 12) => interpolate(f, [t, t + d], [0, 1], { ...C, easing: Easing.inOut(Easing.cubic) });
const RED = "#ff5d4d";
const AMB = "#ffb22e";
const ICE = "#9fe6ff";
const VIO = "#c79bff";
const GOLD = "#ffd27a";
const ORANGE = HL.orange;
const COMB = "#8fb8c8";
const CREAM = "#fff2d8";

// a linha de cima: um só texto por plano, na fonte do vídeo
const Head: React.FC<{ f: number; t: number; text: string; col: string; y?: number }> = ({ f, t, text, col, y = 92 }) => (
  <text x={960} y={y} textAnchor="middle" fontFamily={MONO} fontSize={26} letterSpacing={8} fill={col} opacity={P(f, t, 14)}>
    {text}
  </text>
);

// engrenagem: n dentes, raio r, altura do dente h
const gearPath = (n: number, r: number, h: number) => {
  const pts: string[] = [];
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2, s = (Math.PI * 2) / n;
    const q = (a: number, rr: number) => `${(rr * Math.cos(a)).toFixed(1)},${(rr * Math.sin(a)).toFixed(1)}`;
    pts.push(q(a0, r), q(a0 + s * 0.12, r + h), q(a0 + s * 0.45, r + h), q(a0 + s * 0.57, r));
  }
  return "M " + pts.join(" L ") + " Z";
};

// a ferida: um rasgo violeta de bordas serrilhadas (abre = 1 aberto, 0 fechado)
const Wound: React.FC<{ x: number; y: number; w: number; h: number; open: number; f: number; hot?: number }> = ({ x, y, w, h, open, f, hot = 0 }) => {
  const N = 18;
  const top: string[] = [], bot: string[] = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N, xx = x - w / 2 + u * w;
    const env = Math.sin(u * Math.PI);
    const j = (rnd(i * 3.7) - 0.5) * 14 + Math.sin(f / 9 + i) * 3;
    top.push(`${xx.toFixed(1)},${(y - env * h * open + j * open).toFixed(1)}`);
    bot.push(`${xx.toFixed(1)},${(y + env * h * open - j * open * 0.6).toFixed(1)}`);
  }
  const d = "M " + top.join(" L ") + " L " + bot.reverse().join(" L ") + " Z";
  return (
    <g>
      <ellipse cx={x} cy={y} rx={w * 0.62} ry={h * 1.6 * Math.max(0.2, open)} fill={VIO} opacity={0.1 + 0.25 * hot} style={{ filter: "blur(30px)" }} />
      <path d={d} fill="#0b0414" stroke={VIO} strokeWidth={3} style={{ filter: `drop-shadow(0 0 ${12 + 20 * hot}px ${VIO})` }} />
      <path d={d} fill="none" stroke="#f1e2ff" strokeWidth={1.2} opacity={0.6} />
    </g>
  );
};

export const HL14ColAfter: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [planAt, contraAt, pushAt, gearAt, jamAt, colAt, pieceAt, dieAt, hullAt, secAt, iceAt, gravAt, kleinerAt, earthAt, eliAt, alyxAt] = ["planAt", "contraAt", "pushAt", "gearAt", "jamAt", "colAt", "pieceAt", "dieAt", "hullAt", "secAt", "iceAt", "gravAt", "kleinerAt", "earthAt", "eliAt", "alyxAt"].map((k) => at(p, k));
  const shot = f < gearAt ? 0 : f < colAt ? 1 : f < pieceAt ? 2 : f < dieAt ? 3 : f < iceAt ? 4 : 5;
  const t0 = [planAt, gearAt, colAt, pieceAt, dieAt, iceAt][shot];
  const t1 = [gearAt, colAt, pieceAt, dieAt, iceAt, life][shot];
  const k = Math.max(0, Math.min(1, (f - t0) / Math.max(1, t1 - t0)));
  // cada plano entra com um corte suave e tem um empurrão lento de câmera (nada parado, nada pulsando)
  const inO = shot === 0 ? 1 : P(f, t0, 10);
  const zoom = 1 + 0.05 * k;
  let body: React.ReactNode = null;

  if (shot === 0) {
    // ---- F: o fluxo da energia. Catalisador no meio, a malha Combine em cima, a ferida embaixo
    const cx = 960, cy = 560;
    const rev = IO(f, contraAt, 26); // o fluxo vira
    const push = IO(f, pushAt, 40); // o núcleo desce contra a ferida
    const hex: [number, number][] = [];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 11; c++) hex.push([960 + (c - 5) * 92 + (r % 2) * 46, 150 + r * 52]);
    const wound = 0.8 + 0.25 * push;
    body = (
      <g>
        {/* a malha da rede Combine: a "assinatura" para onde a energia deveria ir */}
        <g opacity={0.9 - 0.45 * rev}>
          {hex.map(([x, y], i) =>
            hex.slice(i + 1).map(([x2, y2], j) => (Math.hypot(x2 - x, y2 - y) < 100 ? <line key={i + "-" + j} x1={x} y1={y} x2={x2} y2={y2} stroke={COMB} strokeWidth={1.4} opacity={0.5} /> : null)),
          )}
          {hex.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={6} fill="#0c1418" stroke={COMB} strokeWidth={2} />
          ))}
          <text x={960} y={318} textAnchor="middle" fontFamily={MONO} fontSize={18} letterSpacing={6} fill={COMB}>ASSINATURA DA REDE COMBINE</text>
        </g>
        {/* a rota planejada (tracejada) e o X quando eles mudam de ideia */}
        <line x1={cx} y1={cy - 70} x2={cx} y2={340} stroke={GOLD} strokeWidth={3} strokeDasharray="10 12" opacity={0.6 * (1 - 0.5 * rev)} />
        {rev > 0 ? (
          <g stroke={RED} strokeWidth={7} strokeLinecap="round" opacity={rev}>
            <line x1={cx - 34} y1={420} x2={cx + 34} y2={470} />
            <line x1={cx + 34} y1={420} x2={cx - 34} y2={470} />
          </g>
        ) : null}
        {/* as partículas: sobem até a malha e, no "contrário", descem para a ferida */}
        {Array.from({ length: 70 }).map((_, i) => {
          const u = (f * (0.012 + rnd(i * 1.3) * 0.01) + i / 70) % 1;
          const dx = (rnd(i * 4.1) - 0.5) * 60;
          const up = [cx + dx * u, cy - 70 - u * 260];
          const dn = [cx + dx * (1 - u) * 0.6, cy + 70 + u * 280];
          return (
            <g key={i}>
              <circle cx={up[0]} cy={up[1]} r={3} fill={GOLD} opacity={(1 - rev) * (1 - u) * 0.9} />
              <circle cx={dn[0]} cy={dn[1]} r={3.2} fill={u > 0.7 ? VIO : GOLD} opacity={rev * 0.9} />
            </g>
          );
        })}
        {/* a ferida, embaixo */}
        <Wound x={cx} y={940} w={620 * wound} h={46 * wound} open={1} f={f} hot={rev + push} />
        <text x={cx} y={1046} textAnchor="middle" fontFamily={MONO} fontSize={18} letterSpacing={6} fill={VIO}>A FERIDA</text>
        {/* o catalisador */}
        <g transform={`translate(${cx} ${cy})`}>
          <polygon points="0,-70 46,0 0,70 -46,0" fill="rgba(255,210,122,0.18)" stroke={GOLD} strokeWidth={3} />
          <polygon points="0,-40 26,0 0,40 -26,0" fill={GOLD} opacity={0.85} />
        </g>
        <text x={cx + 80} y={cy + 8} fontFamily={MONO} fontSize={18} letterSpacing={6} fill={GOLD}>CATALISADOR</text>
        {/* o núcleo empurrado para baixo, com rastro */}
        {push > 0 ? (
          <g>
            <line x1={cx} y1={cy + 80} x2={cx} y2={cy + 80 + push * 290} stroke={CREAM} strokeWidth={10} opacity={0.25} style={{ filter: "blur(6px)" }} />
            <circle cx={cx} cy={cy + 80 + push * 290} r={30} fill={CREAM} style={{ filter: `drop-shadow(0 0 26px ${AMB})` }} />
            <text x={cx - 60} y={cy + 92 + push * 290} textAnchor="end" fontFamily={MONO} fontSize={18} letterSpacing={6} fill={CREAM} opacity={P(f, pushAt + 10, 12)}>O NÚCLEO</text>
          </g>
        ) : null}
        <Head f={f} t={planAt} text={f >= pushAt ? "O NÚCLEO CONTRA A PRÓPRIA FERIDA" : f >= contraAt ? "ELES FAZEM O CONTRÁRIO" : "O PLANO: A ENERGIA PARA A REDE COMBINE"} col={f >= contraAt ? RED : GOLD} y={70} />
      </g>
    );
  } else if (shot === 1 || shot === 2) {
    // ---- M / K: as três engrenagens (Borealis, núcleo, ferida) alimentando o catalisador → travam → colapsam
    const jam = IO(f, jamAt, 30);
    const col = shot === 2 ? IO(f, colAt, pieceAt - colAt - 10) : 0;
    const spin = f < jamAt ? f * 0.9 : jamAt * 0.9 + (1 - Math.exp(-(f - jamAt) / 18)) * 16; // perdem o passo e param
    const G: { x: number; y: number; r: number; n: number; dir: number; name: string; c: string }[] = [
      { x: 640, y: 600, r: 190, n: 22, dir: 1, name: "BOREALIS", c: ICE },
      { x: 1012, y: 446, r: 150, n: 17, dir: -1.29, name: "NÚCLEO", c: CREAM },
      { x: 1304, y: 640, r: 118, n: 13, dir: 1.65, name: "FERIDA", c: VIO },
    ];
    body = (
      <g>
        {/* o catalisador que eles deveriam completar */}
        <g opacity={(1 - jam * 0.7) * (1 - col)}>
          <line x1={1420} y1={560} x2={1600} y2={330} stroke={GOLD} strokeWidth={4} strokeDasharray="12 10" strokeDashoffset={-f * 2 * (1 - jam)} />
          <polygon points="1640,250 1690,330 1640,410 1590,330" fill="rgba(255,210,122,0.15)" stroke={GOLD} strokeWidth={3} />
          <text x={1640} y={460} textAnchor="middle" fontFamily={MONO} fontSize={18} letterSpacing={6} fill={GOLD}>CATALISADOR</text>
          {jam > 0 ? <text x={1640} y={500} textAnchor="middle" fontFamily={MONO} fontSize={18} letterSpacing={6} fill={RED} opacity={jam}>INCOMPLETO</text> : null}
        </g>
        {G.map((g, i) => {
          // travando: cada uma se afasta um pouco (o dente sai do encaixe) e treme; no colapso, todas vão para o centro e encolhem
          const off = jam * (1 - col) * 26;
          const ang = Math.atan2(g.y - 560, g.x - 980);
          const shake = jam * (1 - col) * (rnd(Math.floor(f / 2) + i * 9) - 0.5) * 6;
          const x = g.x + Math.cos(ang) * off + (960 - g.x) * col + shake;
          const y = g.y + Math.sin(ang) * off + (560 - g.y) * col;
          const s = 1 - col * (0.85 - i * 0.12);
          const rot = spin * g.dir + i * 9 + col * 220 * g.dir;
          return (
            <g key={i} transform={`translate(${x} ${y}) scale(${s})`} opacity={1 - P(f, pieceAt - 14, 12)}>
              <g transform={`rotate(${rot})`}>
                <path d={gearPath(g.n, g.r, 22)} fill="rgba(10,14,18,0.92)" stroke={g.c} strokeWidth={3} />
                <circle r={g.r * 0.55} fill="none" stroke={g.c} strokeWidth={2} opacity={0.5} />
                {[0, 1, 2, 3, 4, 5].map((q) => (
                  <line key={q} x1={0} y1={0} x2={g.r * 0.55 * Math.cos((q * Math.PI) / 3)} y2={g.r * 0.55 * Math.sin((q * Math.PI) / 3)} stroke={g.c} strokeWidth={2} opacity={0.45} />
                ))}
              </g>
              {/* o que cada uma é, no miolo */}
              {i === 0 ? (
                <g transform="translate(-92 -40) scale(0.185)">
                  <ShipProfile stroke={ICE} fill="#0c1a22" w={9} />
                </g>
              ) : i === 1 ? (
                <circle r={34} fill={CREAM} style={{ filter: `drop-shadow(0 0 18px ${AMB})` }} />
              ) : (
                <Wound x={0} y={0} w={130} h={16} open={1} f={f} />
              )}
              <text y={g.r + 64} textAnchor="middle" fontFamily={MONO} fontSize={20} letterSpacing={6} fill={g.c} opacity={1 - col}>{g.name}</text>
            </g>
          );
        })}
        {/* o colapso: linhas de implosão para o centro e o ponto */}
        {col > 0 ? (
          <g>
            {Array.from({ length: 36 }).map((_, i) => {
              const a = (i / 36) * Math.PI * 2;
              const r0 = 900 * (1 - col) + 60, r1 = r0 + 160 * (1 - col);
              return <line key={i} x1={960 + Math.cos(a) * r0} y1={560 + Math.sin(a) * r0} x2={960 + Math.cos(a) * r1} y2={560 + Math.sin(a) * r1} stroke={CREAM} strokeWidth={2} opacity={0.5 * col} />;
            })}
            <circle cx={960} cy={560} r={8 + 16 * col} fill={CREAM} opacity={col} style={{ filter: `drop-shadow(0 0 ${30 * col}px ${VIO})` }} />
          </g>
        ) : null}
        <Head f={f} t={shot === 1 ? gearAt : colAt} text={shot === 2 ? "COLAPSAM UNS SOBRE OS OUTROS" : f >= jamAt ? "DEIXAM DE SER O MECANISMO" : "BOREALIS · NÚCLEO · FERIDA: UM MECANISMO"} col={shot === 2 || f >= jamAt ? RED : GOLD} />
      </g>
    );
  } else if (shot === 3) {
    // ---- L: a última peça. O ponto do colapso vira um anel de seis encaixes, cinco cheios, e a peça laranja da Alyx entra
    const fly = IO(f, pieceAt + 6, 34);
    const click = P(f, pieceAt + 40, 6);
    const flash = interpolate(f, [pieceAt + 40, pieceAt + 44, dieAt], [0, 1, 0], C);
    const slot = (q: number, fill: string, stroke: string, x = 0, y = 0) => {
      const a = -Math.PI / 2 + (q * Math.PI) / 3;
      const pts = Array.from({ length: 6 }).map((_, j) => `${(x + 210 * Math.cos(a) + 62 * Math.cos((j * Math.PI) / 3 + a)).toFixed(1)},${(y + 210 * Math.sin(a) + 62 * Math.sin((j * Math.PI) / 3 + a)).toFixed(1)}`);
      return <polygon key={q} points={pts.join(" ")} fill={fill} stroke={stroke} strokeWidth={3} />;
    };
    body = (
      <g transform="translate(960 560)">
        <circle r={210} fill="none" stroke={CREAM} strokeWidth={1.5} opacity={0.35} />
        {[1, 2, 3, 4, 5].map((q) => slot(q, "rgba(255,242,216,0.12)", CREAM))}
        {slot(0, "rgba(0,0,0,0.6)", ORANGE)}
        {/* a peça vem da esquerda e encaixa no topo */}
        <g transform={`translate(${(1 - fly) * -900} ${(1 - fly) * 260})`}>{slot(0, ORANGE, "#3a1a08")}</g>
        <circle r={20 + 30 * click} fill={CREAM} opacity={0.4 + 0.6 * click} style={{ filter: `drop-shadow(0 0 ${20 + 60 * click}px ${ORANGE})` }} />
        <rect x={-960} y={-560} width={1920} height={1080} fill="#fff" opacity={flash * 0.85} />
        <text y={-480} textAnchor="middle" fontFamily={MONO} fontSize={26} letterSpacing={8} fill={ORANGE} opacity={P(f, pieceAt, 14)}>A ALYX ENCAIXA A ÚLTIMA PEÇA</text>
      </g>
    );
  } else if (shot === 4) {
    // ---- S: o Borealis morrendo. Sem explosão: as luzes caem, o casco treme, e depois os setores somem e voltam diferentes
    const SC = 1.62, OX = 960 - 502 * SC, OY = 560 - 150 * SC;
    const dark = P(f, dieAt + 6, 60);
    const N = 10;
    const states = ["ok", "gone", "ice", "burnt", "ghost", "gone", "ok", "ice"];
    const stateOf = (i: number) => {
      if (f < secAt) return "ok";
      const step = Math.floor((f - secAt) / 11);
      return states[Math.floor(rnd(i * 13.7 + step * 3.3) * states.length)];
    };
    const wob = f >= hullAt ? Math.sin(f / 5) * 2.2 * P(f, hullAt, 20) : 0;
    body = (
      <g>
        <defs>
          {Array.from({ length: N }).map((_, i) => (
            <clipPath key={i} id={`sec${i}`}>
              <rect x={i * 100} y={-20} width={100} height={340} />
            </clipPath>
          ))}
        </defs>
        {/* o gelo em volta */}
        <path d={`M 0 ${OY + 284 * SC} L 1920 ${OY + 270 * SC} L 1920 1080 L 0 1080 Z`} fill="#0d1820" stroke={ICE} strokeWidth={1.5} opacity={0.8} />
        <g transform={`translate(${OX} ${OY + wob}) scale(${SC})`}>
          {Array.from({ length: N }).map((_, i) => {
            const s = stateOf(i);
            if (s === "gone") return <rect key={i} x={i * 100} y={0} width={100} height={292} fill="none" stroke={VIO} strokeWidth={1.2} strokeDasharray="4 6" opacity={0.6} clipPath={`url(#sec${i})`} />;
            const stroke = s === "ice" ? ICE : s === "burnt" ? RED : s === "ghost" ? VIO : interpolate(dark, [0, 1], [0, 1]) > 0.5 ? "#7d8a96" : "#c4d2de";
            const fill = s === "ice" ? "#13303e" : s === "burnt" ? "#2a0d08" : s === "ghost" ? "rgba(60,30,90,0.4)" : "#101820";
            const dy = s === "ghost" ? -10 + Math.sin(f / 4 + i) * 6 : 0;
            return (
              <g key={i} clipPath={`url(#sec${i})`} transform={`translate(0 ${dy})`} opacity={s === "ghost" ? 0.7 : 1}>
                <ShipProfile stroke={stroke} fill={fill} w={2.4} rust={s === "burnt" ? 1 : 0.4} seed={i} />
              </g>
            );
          })}
          {/* as janelas apagando */}
          {Array.from({ length: 14 }).map((_, i) => (
            <rect key={"w" + i} x={330 + i * 40} y={226} width={14} height={9} fill={AMB} opacity={(1 - dark) * (rnd(i + Math.floor(f / 6)) > dark ? 0.9 : 0.1)} />
          ))}
          {/* as divisas dos setores, depois que começam a falhar */}
          {f >= secAt ? Array.from({ length: N - 1 }).map((_, i) => <line key={"d" + i} x1={(i + 1) * 100} y1={-10} x2={(i + 1) * 100} y2={300} stroke={VIO} strokeWidth={0.8} opacity={0.4} />) : null}
        </g>
        <Head f={f} t={dieAt} text={f >= secAt ? "SETORES SOMEM E VOLTAM EM ESTADOS DIFERENTES" : f >= hullAt ? "SEM EXPLOSÃO · O CASCO PERDE A ESTABILIDADE" : "O BOREALIS COMEÇA A MORRER"} col={f >= secAt ? VIO : RED} />
        {f >= secAt ? (
          <g fontFamily={MONO} fontSize={16} letterSpacing={4}>
            {[["CONGELADO", ICE], ["QUEIMADO", RED], ["FORA DE FASE", VIO], ["AUSENTE", "#8a7aa8"]].map(([t, c], i) => (
              <g key={t} transform={`translate(${560 + i * 220} 1010)`} opacity={P(f, secAt + 10 + i * 4, 10)}>
                <rect x={0} y={-12} width={14} height={14} fill={c} />
                <text x={24} y={0} fill={c}>{t}</text>
              </g>
            ))}
          </g>
        ) : null}
      </g>
    );
  } else {
    // ---- G: o plano aberto. O navio no gelo, o gelo racha, a gravidade falha; a ferida acima se fechando; a Terra puxada
    const SC = 0.78, OX = 330, OY = 640;
    const grav = P(f, gravAt, 40);
    const close = IO(f, kleinerAt, earthAt - kleinerAt); // a ferida fechando
    const earth = IO(f, earthAt, 70);
    const quiet = P(f, eliAt, 50); // o silêncio do Eli: tudo escurece
    const cracks: [number, number][][] = [
      [[700, 860], [560, 930], [470, 1000], [300, 1080]],
      [[760, 870], [900, 960], [1010, 1080]],
      [[540, 860], [380, 900], [140, 940], [0, 990]],
      [[880, 860], [1120, 900], [1400, 960], [1700, 1010]],
      [[650, 870], [640, 980], [600, 1080]],
    ];
    const lift = grav * 30;
    body = (
      <g opacity={1 - 0.75 * quiet}>
        {/* o gelo */}
        <path d="M 0 860 L 1920 840 L 1920 1080 L 0 1080 Z" fill="#0d1820" stroke={ICE} strokeWidth={1.5} />
        {cracks.map((c, i) => (
          <polyline key={i} points={c.map((q) => q.join(",")).join(" ")} fill="none" stroke={ICE} strokeWidth={2.5} pathLength={1} strokeDasharray={`${P(f, iceAt + 4 + i * 5, 26)} 1`} style={{ filter: `drop-shadow(0 0 6px ${ICE})` }} />
        ))}
        {/* blocos de gelo e destroços subindo quando a gravidade falha */}
        {f >= gravAt
          ? Array.from({ length: 34 }).map((_, i) => {
              const x = 120 + rnd(i * 3.3) * 1680;
              const up = ((f - gravAt) * (0.6 + rnd(i * 5.1) * 1.6) + rnd(i) * 40) * grav;
              const y = 880 + rnd(i * 2.2) * 160 - up;
              const s = 8 + rnd(i * 7.7) * 22;
              return <rect key={i} x={x} y={y} width={s} height={s * 0.6} fill={i % 3 ? "#1a2c36" : "#3a3e46"} stroke={i % 3 ? ICE : "#6a7078"} strokeWidth={1} opacity={Math.max(0, 1 - up / 700)} transform={`rotate(${(f * (1 + rnd(i)) + i * 40) % 360} ${x} ${y})`} />;
            })
          : null}
        {/* o navio, levantando e inclinando um pouco */}
        <g transform={`translate(${OX} ${OY - lift}) rotate(${-grav * 3} 390 200) scale(${SC})`}>
          <ShipProfile stroke="#8796a2" fill="#0f171e" w={2.6} rust={0.6} />
        </g>
        {/* a ferida acima, fechando */}
        <Wound x={1150} y={300} w={760} h={70} open={Math.max(0.02, 1 - close)} f={f} hot={close} />
        {close > 0.05 ? <text x={1150} y={430} textAnchor="middle" fontFamily={MONO} fontSize={18} letterSpacing={6} fill={VIO} opacity={P(f, kleinerAt + 10, 12) * (1 - quiet)}>A FERIDA SE FECHANDO</text> : null}
        {/* a Terra, puxada junto para dentro da dobra */}
        {earth > 0 ? (
          <g>
            {Array.from({ length: 9 }).map((_, i) => (
              <path key={i} d={`M ${1150 + (i - 4) * 50} 300 Q ${1500 + i * 10} ${200 - i * 12} ${1700 - 220 * earth} ${170}`} fill="none" stroke={RED} strokeWidth={1.4} opacity={0.5 * earth} />
            ))}
            <g transform={`translate(${1700 - 220 * earth} 170) scale(${1 - 0.25 * earth} ${1 - 0.05 * earth}) rotate(${-20 * earth})`}>
              <circle r={92} fill="#163a66" stroke="#7fb8ff" strokeWidth={2} />
              <path d="M -50 -40 Q -10 -70 30 -40 Q 50 -10 20 10 Q -20 30 -40 10 Z M 10 30 Q 50 20 60 50 Q 40 70 10 60 Z" fill="#2f6a3a" opacity={0.9} />
              <circle r={92} fill="none" stroke={RED} strokeWidth={3} opacity={earth} />
            </g>
            <text x={1480} y={330} textAnchor="middle" fontFamily={MONO} fontSize={18} letterSpacing={6} fill={RED} opacity={P(f, earthAt + 20, 12) * (1 - quiet)}>A TERRA ESTÁ INDO JUNTO</text>
          </g>
        ) : null}
        <Head f={f} t={iceAt} text={f >= gravAt ? "A GRAVIDADE COMEÇA A FALHAR" : "O GELO EM VOLTA RACHA"} col={ICE} y={70} />
      </g>
    );
  }

  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, #0b1016 0%, #030405 75%)", overflow: "hidden", opacity: inO }}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0, transform: `scale(${zoom})`, transformOrigin: "50% 50%" }}>
        {body}
      </svg>
      {shot === 5 ? (
        <>
          <RadioCard f={f} at={kleinerAt} until={eliAt} img="hl3silh/kleiner_retrato.png" name="DR. KLEINER" text={f >= earthAt ? "…não está se fechando sozinha. A Terra está indo junto." : "A ferida… está finalmente se fechando!"} col={f >= earthAt ? RED : ICE} />
          <RadioCard f={f} at={eliAt} img="hl3silh/eli_retrato.png" name="ELI VANCE" text={f >= alyxAt ? "“Alyx.”" : "…"} col={AMB} mute={f < alyxAt} />
        </>
      ) : null}
      <FilmLook />
    </AbsoluteFill>
  );
};
