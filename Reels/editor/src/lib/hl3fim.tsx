// 05/11 (pedido dele: "a ironia ficou porca" e "os cards do final 1 e final 2 estão ruins"):
// HL15IronyB — o espelho. Dois marionetistas: à esquerda o G-Man (a maleta, os fios azuis puxando os eventos), à direita a
// Alyx (λ laranja, os MESMOS fios, espelhados). Os dois puxam o mesmo ponto no meio: o cofre (cubo em arame girando) ·
// HALF-LIFE: ALYX. De lá nasce, de um lado, a agente dele; do outro, quem pode derrotá-lo. Na "teoria" o diagrama vira uma
// prancha anotada (sem carimbo), e cada "talvez" desmancha um pedaço até sobrar só "E TUDO BEM".
// FinalsFork — o comentário do espectador desce num garfo até dois planetas: FINAL 1 (a Terra salva, com a certeza do erro)
// e FINAL 2 (a Terra se desfazendo, com um "?" que nunca fecha). Um anel de escolha salta de um para o outro.
import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { FONT, MONO } from "./overlays";
import { FilmLook } from "./hl3r";

const C = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const P = (f: number, a: number, d = 12) => interpolate(f, [a, a + d], [0, 1], { ...C, easing: Easing.out(Easing.cubic) });
const IO = (f: number, a: number, b: number, d = 12) => P(f, a, d) * (1 - interpolate(f, [b, b + d], [0, 1], C));
const ICE = "#9fe6ff", ORANGE = "#ff8a1f", GOLD = "#ffd27a", TXT = "#f2f0f7", VIO = "#c79bff", RED = "#ff5d4d", CREAM = "#ffe2b0";

// ------------------------------------------------------------------------------------------------ peças
const Briefcase: React.FC<{ x: number; y: number; s: number; col: string }> = ({ x, y, s, col }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} fill="none" stroke={col} strokeWidth={2.2 / s} strokeLinejoin="round">
    <rect x={-34} y={-14} width={68} height={44} rx={5} fill="rgba(10,16,24,0.85)" />
    <path d="M -12 -14 V -22 Q -12 -26 -8 -26 H 8 Q 12 -26 12 -22 V -14" />
    <path d="M -34 4 H 34" opacity={0.6} />
    <rect x={-6} y={0} width={12} height={8} rx={2} fill={col} />
  </g>
);

const Lambda: React.FC<{ x: number; y: number; s: number; col: string }> = ({ x, y, s, col }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <circle r={30} fill="rgba(24,12,4,0.85)" stroke={col} strokeWidth={2.2 / s} />
    <path d="M -14 20 L 2 -10 L -4 -20 M 2 -10 L 16 20" fill="none" stroke={col} strokeWidth={5 / s} strokeLinecap="round" strokeLinejoin="round" />
  </g>
);

// o cofre: cubo em arame, projeção simples, girando devagar
const VaultCube: React.FC<{ x: number; y: number; s: number; f: number; o: number; flick?: number }> = ({ x, y, s, f, o, flick = 0 }) => {
  const a = f * 0.012, b = 0.42;
  const V = [-1, 1].flatMap((i) => [-1, 1].flatMap((j) => [-1, 1].map((k) => [i, j, k])));
  const pr = V.map(([i, j, k]) => {
    const x1 = i * Math.cos(a) - k * Math.sin(a), z1 = i * Math.sin(a) + k * Math.cos(a);
    const y1 = j * Math.cos(b) - z1 * Math.sin(b), z2 = j * Math.sin(b) + z1 * Math.cos(b);
    const w = 3.6 / (3.6 + z2);
    return [x + x1 * s * w, y + y1 * s * w];
  });
  const E: [number, number][] = [];
  for (let m = 0; m < 8; m++) for (let n = m + 1; n < 8; n++) {
    const d = V[m].reduce((acc, v, q) => acc + (v !== V[n][q] ? 1 : 0), 0);
    if (d === 1) E.push([m, n]);
  }
  const fl = flick ? (Math.sin(f * 1.7) * Math.sin(f * 0.53) > 0.2 ? 0.25 : 1) : 1;
  const op = o * (1 - flick * (1 - fl));
  return (
    <g opacity={op}>
      <circle cx={x} cy={y} r={s * 2.1} fill="url(#ivGlow)" />
      {E.map(([m, n], q) => <line key={q} x1={pr[m][0]} y1={pr[m][1]} x2={pr[n][0]} y2={pr[n][1]} stroke={GOLD} strokeWidth={2.4} strokeLinecap="round" />)}
      {pr.map(([px, py], q) => <circle key={q} cx={px} cy={py} r={3.2} fill={CREAM} />)}
    </g>
  );
};

// fio de marionete: do controle (cx,cy) até o alvo, com uma barriga que balança
const String_: React.FC<{ x1: number; y1: number; x2: number; y2: number; col: string; f: number; ph: number; p: number; o?: number }> = ({ x1, y1, x2, y2, col, f, ph, p, o = 1 }) => {
  const mx = (x1 + x2) / 2 + Math.sin(f * 0.05 + ph) * 10, my = (y1 + y2) / 2 + 18;
  return <path d={`M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`} fill="none" stroke={col} strokeWidth={1.6} opacity={0.85 * o} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p} />;
};

// ------------------------------------------------------------------------------------------------ a ironia
type IronyP = { life: number; gmanAt: number; alyxAt: number; bothAt: number; gWhyAt: number; aWhyAt: number; theoryAt: number; maybeAt: number; okAt: number };

export const HL15IronyB: React.FC<IronyP> = (p) => {
  const f = useCurrentFrame();
  const { life, gmanAt, alyxAt, bothAt, gWhyAt, aWhyAt, theoryAt, maybeAt, okAt } = p;
  const m1 = maybeAt, m2 = maybeAt + 54, m3 = maybeAt + 105;
  // a prancha: na teoria o diagrama recua e ganha moldura
  const th = P(f, theoryAt, 30);
  const sc = 1 - 0.14 * th, ty = -40 * th;
  const dimAll = 1 - 0.8 * P(f, m3, 40);
  const goneAll = 1 - P(f, okAt - 10, 30);
  const leftO = P(f, gmanAt, 18);
  const rightO = P(f, alyxAt, 18) * (1 - 0.75 * P(f, m1, 24));
  const cubeO = P(f, bothAt, 16);
  const Y = 610; // linha dos eventos
  const gNodes = [[250, "BLACK MESA"], [450, "A ESTASE"], [650, "CITY 17"]] as [number, string][];
  const aNodes = [1270, 1470, 1670];
  // depois do encontro, os fios dos dois deslizam para o cofre
  const toCube = P(f, bothAt + 10, 30);
  const sway = (k: number) => Math.sin(f * 0.045 + k) * 6;
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(4,3,10,0) 35%, rgba(4,3,10,0.65) 100%)" }} />
      <AbsoluteFill style={{ transform: `translateY(${ty}px) scale(${sc})`, opacity: dimAll * goneAll }}>
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          <defs>
            <radialGradient id="ivGlow"><stop offset="0" stopColor="rgba(255,210,122,0.35)" /><stop offset="1" stopColor="rgba(255,210,122,0)" /></radialGradient>
            <linearGradient id="ivMirror" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={VIO} stopOpacity={0} /><stop offset="0.5" stopColor={VIO} stopOpacity={0.8} /><stop offset="1" stopColor={VIO} stopOpacity={0} /></linearGradient>
          </defs>
          {/* a grade da prancha */}
          {th > 0 ? (
            <g opacity={0.18 * th} stroke={VIO} strokeWidth={1}>
              {Array.from({ length: 25 }, (_, k) => <line key={"v" + k} x1={k * 80} y1={0} x2={k * 80} y2={1080} />)}
              {Array.from({ length: 14 }, (_, k) => <line key={"h" + k} x1={0} y1={k * 80} x2={1920} y2={k * 80} />)}
            </g>
          ) : null}
          {/* o espelho */}
          <line x1={960} y1={90} x2={960} y2={990} stroke="url(#ivMirror)" strokeWidth={2} strokeDasharray="6 10" opacity={P(f, alyxAt, 20)} />
          {/* G-MAN: controle, fios, eventos */}
          <g opacity={leftO}>
            <Briefcase x={450} y={190} s={1.25} col={ICE} />
            <line x1={240} y1={250} x2={660} y2={250} stroke={ICE} strokeWidth={3} strokeLinecap="round" />
            <line x1={170} y1={Y} x2={960 - 80 * toCube} y2={Y} stroke="rgba(159,230,255,0.45)" strokeWidth={2} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - P(f, gmanAt + 6, 30)} />
            {gNodes.map(([x, t], k) => {
              const tx = interpolate(toCube, [0, 1], [x, 960 - 60 + k * 10]);
              return (
                <g key={t}>
                  <String_ x1={260 + k * 200} y1={250} x2={tx + sway(k)} y2={Y - 14} col={ICE} f={f} ph={k} p={P(f, gmanAt + 10 + k * 8, 24)} />
                  <g opacity={P(f, gmanAt + 10 + k * 8, 14) * (1 - toCube)}>
                    <circle cx={x + sway(k)} cy={Y} r={11} fill="#0a1018" stroke={ICE} strokeWidth={2.4} />
                    <text x={x + sway(k)} y={Y + 46} textAnchor="middle" fill={ICE} fontFamily={MONO} fontSize={17} letterSpacing={3}>{t}</text>
                  </g>
                </g>
              );
            })}
          </g>
          {/* ALYX: a mesma coisa, espelhada */}
          <g opacity={rightO}>
            <Lambda x={1470} y={190} s={1.25} col={ORANGE} />
            <line x1={1260} y1={250} x2={1680} y2={250} stroke={ORANGE} strokeWidth={3} strokeLinecap="round" />
            <line x1={1750} y1={Y} x2={960 + 80 * toCube} y2={Y} stroke="rgba(255,138,31,0.45)" strokeWidth={2} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - P(f, alyxAt + 6, 30)} />
            {aNodes.map((x, k) => {
              const tx = interpolate(toCube, [0, 1], [x, 960 + 60 - k * 10]);
              return (
                <g key={x}>
                  <String_ x1={1660 - k * 200} y1={250} x2={tx - sway(k)} y2={Y - 14} col={ORANGE} f={f} ph={k + 2} p={P(f, alyxAt + 10 + k * 8, 24)} />
                  <circle cx={x - sway(k)} cy={Y} r={11} fill="#180c04" stroke={ORANGE} strokeWidth={2.4} opacity={P(f, alyxAt + 10 + k * 8, 14) * (1 - toCube)} />
                </g>
              );
            })}
          </g>
          {/* o encontro */}
          <VaultCube x={960} y={Y - 10} s={62} f={f} o={cubeO} flick={P(f, m2, 10) * (1 - P(f, m3, 20))} />
          {/* o que nasce de cada lado */}
          {f >= gWhyAt ? <path d={`M 900 ${Y + 40} Q 760 ${Y + 160} 560 ${Y + 170}`} fill="none" stroke={ICE} strokeWidth={2.5} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - P(f, gWhyAt, 20)} /> : null}
          {f >= aWhyAt ? <path d={`M 1020 ${Y + 40} Q 1160 ${Y + 160} 1360 ${Y + 170}`} fill="none" stroke={ORANGE} strokeWidth={2.5} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - P(f, aWhyAt, 20)} /> : null}
        </svg>
        {/* nomes dos marionetistas */}
        <div style={{ position: "absolute", left: 240, width: 420, top: 270, textAlign: "center", fontFamily: MONO, fontSize: 20, letterSpacing: 8, color: ICE, opacity: leftO }}>G-MAN</div>
        <div style={{ position: "absolute", left: 1260, width: 420, top: 270, textAlign: "center", fontFamily: MONO, fontSize: 20, letterSpacing: 8, color: ORANGE, opacity: rightO }}>ALYX</div>
        {/* o que cada um faz (antes do encontro) */}
        <div style={{ position: "absolute", left: 150, width: 640, top: 700, fontFamily: FONT, fontWeight: 700, fontSize: 40, lineHeight: 1.1, color: TXT, opacity: IO(f, gmanAt + 30, bothAt - 6, 14) }}>
          manipula os acontecimentos<div style={{ fontFamily: MONO, fontWeight: 400, fontSize: 18, letterSpacing: 3, color: ICE, marginTop: 10 }}>PARA PRESERVAR A PRÓPRIA ESTRUTURA</div>
        </div>
        <div style={{ position: "absolute", right: 150, width: 640, top: 700, textAlign: "right", fontFamily: FONT, fontWeight: 700, fontSize: 40, lineHeight: 1.1, color: TXT, opacity: IO(f, alyxAt + 20, bothAt - 6, 14) }}>
          a mesma lógica<div style={{ fontFamily: MONO, fontWeight: 400, fontSize: 18, letterSpacing: 3, color: ORANGE, marginTop: 10 }}>USADA CONTRA ELE</div>
        </div>
        {/* o encontro */}
        <div style={{ position: "absolute", left: 0, right: 0, top: Y + 70, textAlign: "center", opacity: P(f, bothAt + 8, 14) * (1 - 0.5 * P(f, gWhyAt, 14)) }}>
          <div style={{ fontFamily: MONO, fontSize: 18, letterSpacing: 6, color: GOLD }}>O MESMO ENCONTRO</div>
          <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 34, color: TXT, marginTop: 6 }}>Half-Life: Alyx</div>
        </div>
        {/* o porquê de cada um */}
        <div style={{ position: "absolute", left: 120, width: 520, top: Y + 150, textAlign: "right", opacity: P(f, gWhyAt + 12, 14) }}>
          <div style={{ fontFamily: MONO, fontSize: 16, letterSpacing: 4, color: ICE }}>ELE GARANTE O NASCIMENTO</div>
          <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 44, color: TXT, marginTop: 4 }}>da agente dele</div>
        </div>
        <div style={{ position: "absolute", right: 120, width: 560, top: Y + 150, opacity: P(f, aWhyAt + 12, 14) }}>
          <div style={{ fontFamily: MONO, fontSize: 16, letterSpacing: 4, color: ORANGE }}>ELA GARANTE O NASCIMENTO</div>
          <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 44, color: TXT, marginTop: 4 }}>de quem pode derrotá-lo</div>
        </div>
      </AbsoluteFill>
      {/* a moldura da prancha: uma etiqueta de anotação, não carimbo */}
      {f >= theoryAt + 140 ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 60, display: "flex", justifyContent: "center", opacity: IO(f, theoryAt + 140, m1 - 10, 16) }}>
          <div style={{ padding: "14px 28px", borderRadius: 10, background: "rgba(16,10,32,0.6)", backdropFilter: "blur(12px)", border: `1.5px solid ${CREAM}66`, textAlign: "center" }}>
            <div style={{ fontFamily: MONO, fontSize: 16, letterSpacing: 6, color: CREAM }}>NÃO É REVELAÇÃO · É A MINHA VERSÃO</div>
            <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 40, color: TXT, marginTop: 6 }}>uma teoria</div>
            <div style={{ height: 3, margin: "8px auto 0", width: 220 * P(f, theoryAt + 160, 24), background: CREAM, borderRadius: 2 }} />
            {f >= theoryAt + 400 ? <div style={{ fontFamily: MONO, fontSize: 15, letterSpacing: 3, color: "rgba(255,226,176,0.8)", marginTop: 12, opacity: P(f, theoryAt + 400, 14) }}>MAS EU NÃO FICARIA SURPRESO SE A VALVE FOSSE POR AÍ</div> : null}
          </div>
        </div>
      ) : null}
      {/* os talvez: cada um desmancha um pedaço */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 90, textAlign: "center", opacity: 1 - P(f, okAt - 10, 20) }}>
        {([[m1, "talvez aquela mulher não seja a Alyx"], [m2, "talvez nunca seja explicado"], [m3, "talvez o verdadeiro Half-Life 3 não tenha nada a ver"]] as [number, string][]).map(([t0, t]) => (
          f >= t0 ? <div key={t} style={{ fontFamily: FONT, fontSize: 34, color: "rgba(242,240,247,0.88)", marginTop: 8, opacity: P(f, t0, 12), transform: `translateY(${10 * (1 - P(f, t0, 12))}px)` }}>{t}</div> : null
        ))}
      </div>
      {f >= okAt ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 440, textAlign: "center", opacity: P(f, okAt, 20) }}>
          <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 104, letterSpacing: 2, color: TXT, textShadow: "0 0 40px rgba(199,155,255,0.45)" }}>e tudo bem.</div>
        </div>
      ) : null}
      <AbsoluteFill style={{ background: "#000", opacity: interpolate(f, [0, 8], [1, 0], C) + interpolate(f, [life - 6, life], [0, 1], C), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------------------------------------ os dois finais
// a Terra: continentes e nuvens de ruído (feTurbulence) que deslizam dentro do disco, terminador escuro de um lado
const Planet: React.FC<{ id: string; x: number; y: number; R: number; f: number; lost: number; o: number }> = ({ id, x, y, R, f, lost, o }) => {
  const off = -f * 0.5;
  const L = lost;
  return (
    <g opacity={o}>
      <defs>
        <clipPath id={`pc${id}`}><circle cx={x} cy={y} r={R} /></clipPath>
        <filter id={`pl${id}`} filterUnits="userSpaceOnUse" x={x - R - 600} y={y - R} width={2 * R + 1200} height={2 * R}>
          <feTurbulence type="fractalNoise" baseFrequency="0.013" numOctaves={5} seed={id === "f1" ? 11 : 4} result="n" />
          <feColorMatrix in="n" type="matrix" values={`0 0 0 0 ${0.31 - 0.1 * L}  0 0 0 0 ${0.58 - 0.36 * L}  0 0 0 0 ${0.35 - 0.04 * L}  14 0 0 0 -7.4`} />
        </filter>
        <filter id={`pk${id}`} filterUnits="userSpaceOnUse" x={x - R - 600} y={y - R} width={2 * R + 1200} height={2 * R}>
          <feTurbulence type="fractalNoise" baseFrequency="0.02 0.045" numOctaves={4} seed={id === "f1" ? 3 : 9} result="n" />
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 6 -3.1" />
        </filter>
        <radialGradient id={`ps${id}`} cx="0.32" cy="0.3" r="0.85"><stop offset="0" stopColor="rgba(255,255,255,0.18)" /><stop offset="0.45" stopColor="rgba(0,0,0,0)" /><stop offset="0.78" stopColor="rgba(0,0,8,0.55)" /><stop offset="1" stopColor="rgba(0,0,8,0.95)" /></radialGradient>
        <radialGradient id={`pa${id}`}><stop offset="0.8" stopColor="rgba(0,0,0,0)" /><stop offset="0.86" stopColor={L ? "rgba(199,155,255,0.4)" : "rgba(120,200,255,0.6)"} /><stop offset="1" stopColor="rgba(0,0,0,0)" /></radialGradient>
        <radialGradient id={`po${id}`} cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor={L ? "#2b3040" : "#2a7fc4"} /><stop offset="1" stopColor={L ? "#151822" : "#123f78"} /></radialGradient>
      </defs>
      <circle cx={x} cy={y} r={R * 1.2} fill={`url(#pa${id})`} />
      <g clipPath={`url(#pc${id})`}>
        <circle cx={x} cy={y} r={R} fill={`url(#po${id})`} />
        <g transform={`translate(${off} 0)`}><rect x={x - R - 600} y={y - R} width={2 * R + 1200} height={2 * R} filter={`url(#pl${id})`} /></g>
        <g transform={`translate(${off * 1.6} 0)`} opacity={0.75 - 0.4 * L}><rect x={x - R - 600} y={y - R} width={2 * R + 1200} height={2 * R} filter={`url(#pk${id})`} /></g>
        <circle cx={x} cy={y} r={R} fill={`url(#ps${id})`} />
        {L > 0 ? <rect x={x + R - 2 * R * 0.4 * L} y={y - R} width={2 * R} height={2 * R} fill="rgba(4,3,10,0.92)" style={{ filter: "blur(20px)" }} /> : null}
      </g>
      {L > 0 ? Array.from({ length: 30 }, (_, k) => {
        const t = ((f * 0.008 + k * 0.137) % 1);
        const ang = -0.9 + (k % 10) * 0.19;
        const r0 = R * (1 + t * 0.9);
        return <circle key={k} cx={x + Math.cos(ang) * r0} cy={y + Math.sin(ang) * r0} r={2.4 * (1 - t)} fill={VIO} opacity={L * (1 - t)} />;
      }) : null}
    </g>
  );
};

type ForkP = { f: number; backAt: number; askAt: number; unsureAt: number };

export const FinalsFork: React.FC<ForkP> = ({ f, backAt, askAt, unsureAt }) => {
  const b = backAt;
  const fork = P(f, b + 20, 30);
  const p1 = P(f, b + 40, 18), p2 = P(f, b + 70, 18);
  const L = [560, 640], Rr = [1360, 640], R = 140;
  const pick = f >= b + 126 ? (Math.floor((f - b - 126) / 40) % 2) : -1; // o anel de escolha salta de um lado ao outro
  const choice = Math.floor((f - b) / 45) % 2 ? "o caminho da Alyx" : "usar o Borealis";
  const typed = choice.slice(0, Math.max(0, Math.floor(((f - b) % 45) * 0.9)));
  const ask = P(f, askAt, 14);
  return (
    <>
      {/* o comentário */}
      <div style={{ position: "absolute", left: 560, right: 560, top: 80, padding: "16px 20px", borderRadius: 14, background: "#f4f4f4", fontFamily: "Roboto, Arial, sans-serif", color: "#111", display: "flex", gap: 14, alignItems: "flex-start", opacity: P(f, b, 10) * (1 - 0.4 * ask), transform: `translateY(${12 * (1 - P(f, b, 12))}px)`, boxShadow: "0 20px 60px rgba(0,0,0,0.45)" }}>
        <div style={{ width: 44, height: 44, borderRadius: 22, background: `linear-gradient(135deg, ${VIO}, ${ORANGE})`, flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: 15, color: "#606060" }}><b style={{ color: "#111" }}>@você</b> · antes dos dois finais</div>
          <div style={{ fontSize: 26, marginTop: 4 }}>Eu escolheria <b>{typed}</b><span style={{ opacity: f % 20 < 10 ? 1 : 0 }}>|</span> porque…</div>
        </div>
      </div>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {/* o garfo */}
        <path d={`M 960 210 V 330`} stroke={CREAM} strokeWidth={2.5} fill="none" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - P(f, b + 12, 14)} opacity={0.8} />
        <path d={`M 960 330 C 960 420 ${L[0]} 400 ${L[0]} ${L[1] - R - 26}`} stroke={ICE} strokeWidth={2.5} fill="none" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - fork} />
        <path d={`M 960 330 C 960 420 ${Rr[0]} 400 ${Rr[0]} ${Rr[1] - R - 26}`} stroke={VIO} strokeWidth={2.5} fill="none" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - fork} />
        <circle cx={960} cy={330} r={7} fill={CREAM} opacity={P(f, b + 20, 8)} />
        <Planet id="f1" x={L[0]} y={L[1]} R={R} f={f} lost={0} o={p1} />
        <Planet id="f2" x={Rr[0]} y={Rr[1]} R={R} f={f} lost={P(f, b + 80, 60)} o={p2} />
        {/* FINAL 1: o anel vermelho da certeza do erro */}
        <circle cx={L[0]} cy={L[1]} r={R + 22} fill="none" stroke={RED} strokeWidth={2.5} opacity={P(f, b + 60, 16) * (0.55 + 0.25 * Math.sin(f * 0.15))} />
        {/* FINAL 2: o anel que nunca fecha, com o "?" */}
        <circle cx={Rr[0]} cy={Rr[1]} r={R + 22} fill="none" stroke={VIO} strokeWidth={2.5} strokeDasharray="14 12" strokeDashoffset={-f * 0.6} opacity={P(f, b + 90, 16)} />
        <text x={Rr[0] + R * 0.95} y={Rr[1] - R * 0.7} fill={VIO} fontFamily={FONT} fontWeight={800} fontSize={64} opacity={P(f, b + 95, 14) * (0.6 + 0.4 * Math.sin(f * 0.11))}>?</text>
        {/* a escolha */}
        {pick >= 0 ? <circle cx={pick ? Rr[0] : L[0]} cy={L[1]} r={R + 40} fill="none" stroke={ORANGE} strokeWidth={4} opacity={0.9 * (1 - 0.3 * Math.sin(((f - b - 126) % 40) / 40 * Math.PI))} /> : null}
      </svg>
      {/* legendas */}
      {([[L[0], p1, "FINAL 1", "salva a Terra", "e recebe a certeza de que escolheu errado", ICE, RED], [Rr[0], p2, "FINAL 2", "perde a Terra", "e nunca recebe a confirmação de que escolheu certo", VIO, VIO]] as [number, number, string, string, string, string, string][]).map(([x, o, n, a, d, c, c2]) => (
        <div key={n} style={{ position: "absolute", left: x - 260, width: 520, top: L[1] + R + 40, textAlign: "center", opacity: o * (1 - 0.35 * ask) }}>
          <div style={{ fontFamily: MONO, fontSize: 16, letterSpacing: 8, color: c }}>{n}</div>
          <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 46, color: TXT, marginTop: 2 }}>{a}</div>
          <div style={{ fontFamily: MONO, fontSize: 15, letterSpacing: 2, color: c2, marginTop: 6 }}>{d.toUpperCase()}</div>
        </div>
      ))}
      {/* a pergunta */}
      {f >= askAt ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 272, textAlign: "center", opacity: ask, transform: `scale(${1.06 - 0.06 * ask})` }}>
          <span style={{ padding: "10px 26px", borderRadius: 12, background: "rgba(16,10,32,0.7)", backdropFilter: "blur(10px)", fontFamily: FONT, fontWeight: 800, fontSize: 52, color: TXT }}>
            você escolheria <span style={{ color: ORANGE }}>a mesma coisa?</span>
          </span>
        </div>
      ) : null}
      {f >= unsureAt + 25 ? <div style={{ position: "absolute", left: 0, right: 0, bottom: 34, textAlign: "center", fontFamily: MONO, fontSize: 20, letterSpacing: 6, color: GOLD, opacity: P(f, unsureAt + 25, 12) }}>EU AINDA NÃO TENHO CERTEZA</div> : null}
    </>
  );
};
