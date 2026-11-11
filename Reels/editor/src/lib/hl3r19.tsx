// HL3 · 1:38:40 a busca pela continuidade (30/10)
// Pedido dele: a sala da cápsula (a consciência guardada num corpo/larva, o ocupante virando Advisor) passava a ideia
// errada. Os Combine já conseguiram se pôr em larva; o objetivo deles e agora o dos humanos é outro: usar o núcleo para
// chegar ao evento catalisador e existir para sempre, fora do tempo, como os empregadores do G-Man. Então: o núcleo do
// Borealis sendo estudado → a escada da continuidade sobe dele (salvar → prolongar → preservar → consciência ≠ corpo, a
// mente vira um sinal que liga ao núcleo, nada de cápsula) → séculos → o caminho dos Advisors e o da humanidade sobem e
// chegam ao MESMO ponto, o catalisador, e acima dele a perpetuidade fora do tempo, onde estão os empregadores.
import React from "react";
import { AbsoluteFill, Easing, interpolate, staticFile, useCurrentFrame } from "remotion";
import { MONO } from "./overlays";
import { C } from "./hl3";
import { FilmLook } from "./hl3r";

type PR = Record<string, number> & { life: number };
const at = (p: PR, k: string) => Math.round((p[k] as number | undefined) ?? 1e6);
const P = (f: number, t: number, d = 12) => interpolate(f, [t, t + d], [0, 1], { ...C, easing: Easing.out(Easing.cubic) });
const ICE = "#9fe6ff";
const TEAL = "#5ff3d0";
const GREEN = "#8dffa8";
const RED = "#ff5d4d";
const AMB = "#ffb22e";
const VIO = "#c79bff";
const CREAM = "#ffe2b0";
const SERIF = "Georgia, 'Times New Roman', serif";

export const HL13Continuity: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [studyAt, searchAt, s1, s2, s3, s4, centAt, qAt, quoteAt] = ["studyAt", "searchAt", "s1At", "s2At", "s3At", "s4At", "centAt", "qAt", "quoteAt"].map((k) => at(p, k));
  const q = P(f, qAt, 30); // a virada para a pergunta
  const ladderO = 1 - 0.8 * q;
  // o núcleo (à esquerda, embaixo)
  const CX = 330, CY = 760;
  const core = (
    <g opacity={P(f, studyAt, 14) * (1 - 0.5 * q)}>
      {[150, 112, 78].map((r, i) => (
        <ellipse key={i} cx={CX} cy={CY} rx={r} ry={r * 0.36} fill="none" stroke={ICE} strokeWidth={2} opacity={0.75 - i * 0.15} transform={`rotate(${(f * (i % 2 ? -0.6 : 0.9)) % 360} ${CX} ${CY})`} />
      ))}
      <circle cx={CX} cy={CY} r={44} fill="rgba(159,230,255,0.18)" stroke={ICE} strokeWidth={2} />
      <circle cx={CX} cy={CY} r={18 + 3 * Math.sin(f / 6)} fill="#dff8ff" opacity={0.85} />
      {/* a varredura dos pesquisadores */}
      <line x1={CX - 170} y1={CY - 60 + ((f * 2) % 120)} x2={CX + 170} y2={CY - 60 + ((f * 2) % 120)} stroke={TEAL} strokeWidth={1.5} opacity={0.5} />
      {[-1, 1, 0].map((s, i) => {
        const x = CX + s * 210 + (s === 0 ? -0 : 0), y = CY + (s === 0 ? 150 : 70);
        return (
          <g key={"r" + i} opacity={0.8}>
            <circle cx={x} cy={y - 34} r={10} fill="none" stroke={CREAM} strokeWidth={2} />
            <path d={`M ${x - 16} ${y + 14} Q ${x} ${y - 26} ${x + 16} ${y + 14}`} fill="none" stroke={CREAM} strokeWidth={2} />
            <rect x={x + 10} y={y - 18} width={14} height={18} rx={2} fill="none" stroke={TEAL} strokeWidth={1.5} />
            <line x1={x + 17} y1={y - 18} x2={CX} y2={CY} stroke={TEAL} strokeWidth={1} strokeDasharray="3 5" opacity={0.5} />
          </g>
        );
      })}
      <text x={CX} y={CY + 210} textAnchor="middle" fill={ICE} fontFamily={MONO} fontSize={18} letterSpacing={5}>O NÚCLEO DO BOREALIS</text>
    </g>
  );
  // a escada: quatro degraus que sobem do núcleo
  const STEPS: [number, string, string][] = [
    [s1, "SALVAR ALGUÉM QUE MORRERIA", GREEN],
    [s2, "PROLONGAR VIDAS", TEAL],
    [s3, "PRESERVAR QUEM É IMPORTANTE DEMAIS", AMB],
    [s4, "CONSCIÊNCIA ≠ CORPO", VIO],
  ];
  const stepXY = (i: number) => [620 + i * 300, 700 - i * 140] as [number, number];
  const icon = (i: number) => {
    const k = P(f, STEPS[i][0], 16);
    if (i === 0) {
      // o monitor: a linha reta volta a bater
      const beat = f > STEPS[0][0] + 14;
      const pts = Array.from({ length: 40 }).map((_, j) => {
        const x = j * 5;
        const ph = (j + Math.floor(f / 2)) % 20;
        const y = beat && ph === 8 ? -26 : beat && ph === 9 ? 18 : beat && ph === 10 ? -8 : 0;
        return `${x},${30 + y}`;
      });
      return <polyline points={pts.join(" ")} fill="none" stroke={GREEN} strokeWidth={3} opacity={0.4 + 0.6 * k} />;
    }
    if (i === 1) {
      // a barra da vida esticando: 80 → 120 → 200
      const w = interpolate(f, [STEPS[1][0], STEPS[1][0] + 40], [80, 200], C);
      return (
        <g>
          <rect x={0} y={18} width={200} height={16} rx={8} fill="rgba(255,255,255,0.08)" />
          <rect x={0} y={18} width={w} height={16} rx={8} fill={TEAL} />
          <text x={200} y={60} textAnchor="end" fill={TEAL} fontFamily={MONO} fontSize={16}>{Math.round((w / 200) * 200)} ANOS</text>
        </g>
      );
    }
    if (i === 2) {
      return (
        <g>
          <rect x={60} y={0} width={64} height={78} rx={4} fill="#0a0d10" stroke={AMB} strokeWidth={2} />
          <image href={staticFile("hl3silh/cidada_badge.jpg")} x={64} y={4} width={56} height={70} preserveAspectRatio="xMidYMid slice" />
          <path d={`M 52 80 q -30 -40 0 -86 M 132 80 q 30 -40 0 -86`} fill="none" stroke={AMB} strokeWidth={2} opacity={k} />
          <text x={92} y={102} textAnchor="middle" fill={AMB} fontFamily={MONO} fontSize={13} letterSpacing={2} opacity={k}>INSUBSTITUÍVEL</text>
        </g>
      );
    }
    // a mente sai do corpo e vira um sinal ligado ao núcleo (o corpo apaga, a luz fica)
    const lift = P(f, STEPS[3][0] + 10, 40);
    return (
      <g>
        <g opacity={1 - 0.75 * lift}>
          <circle cx={60} cy={14} r={11} fill="none" stroke={CREAM} strokeWidth={2} />
          <path d="M 42 80 Q 44 30 60 28 Q 76 30 78 80" fill="none" stroke={CREAM} strokeWidth={2} />
        </g>
        <circle cx={60 + 90 * lift} cy={14 - 30 * lift} r={8 + 4 * Math.sin(f / 5)} fill={VIO} opacity={0.9} />
        {lift > 0.2 ? <path d={`M ${60 + 90 * lift} ${14 - 30 * lift} q 40 -10 80 -${10 + 20 * lift}`} fill="none" stroke={VIO} strokeWidth={2} strokeDasharray="4 5" opacity={lift} /> : null}
        <text x={150} y={80} fill={VIO} fontFamily={MONO} fontSize={13} letterSpacing={2} opacity={lift}>A MENTE VIRA SINAL</text>
      </g>
    );
  };
  const ladder = (
    <g opacity={ladderO}>
      {f >= searchAt ? (() => {
        const k = P(f, searchAt, 40);
        const [x0, y0] = [CX + 60, CY - 60];
        const pts = [[x0, y0], ...STEPS.map((_, i) => stepXY(i))];
        const d = pts.map(([x, y], i) => `${i ? "L" : "M"} ${x} ${y}`).join(" ");
        return <path d={d} fill="none" stroke={CREAM} strokeWidth={2} strokeDasharray="10 8" opacity={0.5 * k} />;
      })() : null}
    </g>
  );
  const year = Math.round(interpolate(f, [centAt, centAt + 40], [2190, 2480], C));
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 40% 60%, #0a1a20 0%, #03070a 70%, #010203 100%)", overflow: "hidden", fontFamily: MONO }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {core}
        {ladder}
        {/* a pergunta: os dois caminhos sobem e chegam ao mesmo ponto */}
        {q > 0 ? (() => {
          const TX = 1240, TY = 300;
          const adv = `M 1760 1000 C 1700 760, 1420 560, ${TX} ${TY}`;
          const hum = `M ${CX} ${CY - 50} C 600 640, 980 520, ${TX} ${TY}`;
          const dash = (k: number) => ({ strokeDasharray: 1600, strokeDashoffset: 1600 * (1 - k) });
          const a = P(f, qAt + 6, 60), h = P(f, qAt + 20, 60);
          const pulse = 0.5 + 0.5 * Math.sin(f / 7);
          return (
            <g>
              <path d={adv} fill="none" stroke={VIO} strokeWidth={4} style={dash(a)} />
              <path d={hum} fill="none" stroke={GREEN} strokeWidth={4} style={dash(h)} />
              <image href={staticFile("hl3silh/advisor_card.jpg")} x={1690} y={860} width={120} height={150} opacity={a} preserveAspectRatio="xMidYMid slice" />
              <rect x={1690} y={860} width={120} height={150} fill="none" stroke={VIO} strokeWidth={2} opacity={a} />
              <text x={1750} y={1036} textAnchor="middle" fill={VIO} fontFamily={MONO} fontSize={15} letterSpacing={3} opacity={a}>OS ADVISORS</text>
              <text x={CX} y={CY - 210} textAnchor="middle" fill={GREEN} fontFamily={MONO} fontSize={15} letterSpacing={3} opacity={h}>A HUMANIDADE</text>
              {/* o catalisador */}
              <g opacity={P(f, qAt + 50, 20)}>
                <ellipse cx={TX} cy={TY} rx={90 + 10 * pulse} ry={36 + 4 * pulse} fill="rgba(255,210,122,0.18)" stroke="#ffd27a" strokeWidth={4} />
                <ellipse cx={TX} cy={TY} rx={46} ry={18} fill="#ffd27a" opacity={0.6} />
                <text x={TX} y={TY + 70} textAnchor="middle" fill="#ffd27a" fontFamily={MONO} fontSize={20} letterSpacing={6}>O EVENTO CATALISADOR</text>
              </g>
              {/* acima dele: a perpetuidade, fora do tempo (onde estão os empregadores) */}
              <g opacity={P(f, qAt + 70, 24)}>
                <line x1={TX} y1={TY - 40} x2={TX} y2={150} stroke="#ffd27a" strokeWidth={2} strokeDasharray="4 6" />
                <rect x={TX - 330} y={60} width={660} height={90} rx={12} fill="rgba(20,12,34,0.85)" stroke={VIO} strokeWidth={1.5} />
                <path d={`M ${TX - 280} 105 c 0 -26 40 -26 52 0 c 12 26 52 26 52 0 c 0 -26 -40 -26 -52 0 c -12 26 -52 26 -52 0`} fill="none" stroke={VIO} strokeWidth={3} />
                <text x={TX - 150} y={100} fill="#e8dcff" fontFamily={MONO} fontSize={22} letterSpacing={5}>PERPETUIDADE · FORA DO TEMPO</text>
                <text x={TX - 150} y={128} fill={VIO} fontFamily={MONO} fontSize={15} letterSpacing={4}>COMO OS EMPREGADORES DO G-MAN</text>
              </g>
              <text x={TX - 300} y={TY + 130} fill="rgba(242,240,247,0.55)" fontFamily={MONO} fontSize={15} letterSpacing={3} opacity={P(f, qAt + 90, 14)}>✕ NÃO É SE GUARDAR NUMA LARVA</text>
            </g>
          );
        })() : null}
      </svg>
      {/* os degraus (cards) */}
      {STEPS.map(([t, txt, col], i) => {
        if (f < t - 4) return null;
        const [x, y] = stepXY(i);
        const k = P(f, t, 14);
        return (
          <div key={i} style={{ position: "absolute", left: x - 20, top: y - 170, width: 270, opacity: k * ladderO * (f >= centAt ? 0.6 : 1), transform: `translateY(${16 * (1 - k)}px)` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <span style={{ width: 30, height: 30, borderRadius: 15, border: `2px solid ${col}`, color: col, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{i + 1}</span>
              <span style={{ fontSize: 16, letterSpacing: 2, color: "#f2f0f7", lineHeight: 1.25 }}>{txt}</span>
            </div>
            <svg width={260} height={110} style={{ overflow: "visible" }}>{icon(i)}</svg>
            <div style={{ height: 4, width: 240, background: col, opacity: 0.7, borderRadius: 2, marginTop: 6 }} />
          </div>
        );
      })}
      {/* cabeçalhos */}
      <div style={{ position: "absolute", left: 100, top: 100 }}>
        <div style={{ padding: "8px 14px", background: "rgba(8,10,14,0.82)", borderLeft: `3px solid ${ICE}`, fontSize: 22, letterSpacing: 3, color: "#f2f0f7", opacity: P(f, studyAt, 10) * (1 - P(f, qAt, 12)), width: "fit-content" }}>A HUMANIDADE VOLTA A ESTUDAR O BOREALIS</div>
        {f >= searchAt ? <div style={{ marginTop: 10, padding: "8px 14px", background: "rgba(8,10,14,0.82)", borderLeft: `3px solid ${CREAM}`, fontSize: 22, letterSpacing: 3, color: "#f2f0f7", opacity: P(f, searchAt, 10) * (1 - P(f, qAt, 12)), width: "fit-content" }}>A BUSCA PELA CONTINUIDADE · DE UM JEITO JUSTIFICÁVEL</div> : null}
        {f >= qAt ? <div style={{ padding: "8px 14px", background: "rgba(8,10,14,0.82)", borderLeft: `3px solid ${VIO}`, fontSize: 22, letterSpacing: 3, color: "#f2f0f7", opacity: P(f, qAt, 10), width: "fit-content" }}>A MESMA PERGUNTA QUE OS ADVISORS PERSEGUIAM</div> : null}
      </div>
      {f >= centAt ? (
        <div style={{ position: "absolute", right: 90, top: 70, textAlign: "right", color: AMB, opacity: P(f, centAt, 10) * (1 - P(f, qAt + 20, 14)) }}>
          <div style={{ fontSize: 16, letterSpacing: 6 }}>SÉCULOS SE PASSAM</div>
          <div style={{ fontSize: 70, letterSpacing: 4, color: "#ffe9c4" }}>{year}</div>
        </div>
      ) : null}
      {f >= quoteAt ? (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 120, textAlign: "center", fontFamily: SERIF, fontStyle: "italic", fontSize: 54, color: "#f2ead8", textShadow: "0 4px 30px #000", opacity: P(f, quoteAt, 12) * (1 - P(f, life - 12, 10)) }}>
          “Se podemos continuar… por que aceitar o fim?”
        </div>
      ) : null}
      <AbsoluteFill style={{ background: "#000", opacity: interpolate(f, [0, 8, life - 6, life], [1, 0, 0, 1], C), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 1:40:20 os humanos procuram os Combine (corte para fora)
// 30/10 (ele: a aliança aparecia direto com os Combine no núcleo; faltava mostrar a humanidade abrindo o caminho de novo,
// como na ressonância em cascata, o contato com o que restou deles lá fora e as naves chegando por um portal):
//  A · "pela primeira vez desde a libertação": a Cidadela humana dispara o feixe e o céu racha (a ressonância, de propósito)
//  B · "procuram aquilo que restou dos próprios Combine, fora daqui": o rasgo vira um portal para o Overworld sobre a
//      cidade (30/10, ele: o plano no espaço, com o planeta, não fazia sentido; fica só o portal)
//  C · "encontram": as naves atravessam o portal e descem devagar, sem atirar
//      "não como conquistadores" (riscado) · "como parceiros" (o elo entre a Cidadela e a nave)
export const HLUnionContact: React.FC<PR> = (p) => {
  const f = useCurrentFrame();
  const life = p.life;
  const [seekAt, foundAt, conqAt, partAt] = ["seekAt", "foundAt", "conqAt", "partAt"].map((k) => at(p, k));
  const shot = f < seekAt ? 0 : 2;
  const chip = (t0: number, txt: string, col: string, strike = 0) => (
    <div key={txt} style={{ position: "relative", marginTop: 10, padding: "8px 14px", background: "rgba(8,10,14,0.84)", borderLeft: `3px solid ${col}`, fontSize: 22, letterSpacing: 3, color: "#f2f0f7", opacity: P(f, t0, 8), width: "fit-content" }}>
      {txt}
      {strike > 0 ? <span style={{ position: "absolute", left: 10, right: 10, top: "50%", height: 3, background: RED, transform: `scaleX(${strike})`, transformOrigin: "left" }} /> : null}
    </div>
  );
  // a cidade no horizonte, com a Cidadela humana no meio (planos A e C)
  const city = (glow: number) => (
    <g>
      {Array.from({ length: 40 }).map((_, i) => {
        const x = 120 + i * 43, h = 60 + ((i * 53) % 150);
        return <rect key={i} x={x} y={900 - h} width={32} height={h} fill="#05090c" stroke="#7fd8ff" strokeOpacity={0.35} />;
      })}
      {Array.from({ length: 40 }).map((_, i) => ((i * 7) % 3 ? <rect key={"w" + i} x={132 + i * 43} y={850 - ((i * 31) % 90)} width={6} height={6} fill="#9fe6ff" opacity={0.6} /> : null))}
      <polygon points="930,900 960,330 990,900" fill="#06121a" stroke="#9fe6ff" strokeWidth={2} />
      <circle cx={960} cy={340} r={8 + 6 * glow} fill="#dff8ff" opacity={0.5 + 0.5 * glow} />
      <rect x={0} y={900} width={1920} height={180} fill="#020405" />
      <line x1={0} y1={900} x2={1920} y2={900} stroke={TEAL} strokeOpacity={0.4} />
    </g>
  );
  let body: React.ReactNode = null;
  if (shot === 0) {
    const beam = P(f, 6, 14), crack = P(f, 24, 30);
    body = (
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <rect width={1920} height={900} fill={`rgba(40,${Math.round(60 + 40 * crack)},40,${0.15 + 0.25 * crack})`} />
        {/* o feixe e o céu rachando: anéis e raios verdes/laranja como em Black Mesa */}
        <rect x={956 - 8 * beam} y={0} width={8 + 16 * beam} height={340} fill="#dff8ff" opacity={0.85 * beam} />
        {[0, 1, 2, 3].map((k) => {
          const t = ((f - 20) / 36 + k / 4) % 1;
          return crack > 0 ? <ellipse key={k} cx={960} cy={150} rx={80 + t * 700} ry={(80 + t * 700) * 0.28} fill="none" stroke={k % 2 ? "#ffb347" : GREEN} strokeWidth={3} opacity={(1 - t) * crack} /> : null;
        })}
        {Array.from({ length: 9 }).map((_, i) => {
          if (crack <= 0 || (Math.floor(f / 3) + i) % 3) return null;
          const a = (i / 9) * Math.PI - Math.PI;
          let d = "M 960 150";
          for (let j = 1; j <= 5; j++) d += ` L ${960 + Math.cos(a) * j * 90 + ((i * j * 37) % 40) - 20} ${150 - Math.sin(a) * j * 40 + ((i * j * 23) % 30) - 15}`;
          return <path key={i} d={d} fill="none" stroke="#c8ffb0" strokeWidth={2} opacity={crack} />;
        })}
        {city(beam)}
      </svg>
    );
  } else {
    const open = P(f, seekAt, 40);
    const R = 360 * open;
    body = (
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <rect width={1920} height={900} fill={`rgba(20,40,60,${0.25 * open})`} />
        {/* o portal */}
        {[1, 0.78, 0.56, 0.34].map((s, i) => <ellipse key={i} cx={960} cy={210} rx={R * s} ry={R * s * 0.34} fill="none" stroke={i % 2 ? "#dff8ff" : ICE} strokeWidth={3 + i} opacity={0.8 * open} strokeDasharray={`${40 + i * 20} 18`} strokeDashoffset={(f * (i % 2 ? -6 : 8)) % 400} />)}
        {/* dentro do portal, o Overworld: um céu violeta com a silhueta de estruturas Combine */}
        <defs>
          <clipPath id="owClip"><ellipse cx={960} cy={210} rx={Math.max(1, R * 0.92)} ry={Math.max(1, R * 0.31)} /></clipPath>
          <radialGradient id="owSky" cx="50%" cy="60%" r="60%"><stop offset="0" stopColor="#7a5aa8" /><stop offset="1" stopColor="#1a0f2a" /></radialGradient>
        </defs>
        <g clipPath="url(#owClip)" opacity={open}>
          <rect x={560} y={80} width={800} height={260} fill="url(#owSky)" />
          {Array.from({ length: 14 }).map((_, i) => { const x = 620 + i * 50, h = 30 + ((i * 41) % 90); return <polygon key={i} points={`${x},300 ${x + 12},${300 - h} ${x + 24},300`} fill="#0d0816" stroke="#c79bff" strokeOpacity={0.5} />; })}
          <polygon points="940,300 960,120 980,300" fill="#0d0816" stroke="#d9c4ff" strokeOpacity={0.8} />
        </g>
        <text x={960} y={210 + R * 0.34 + 34} textAnchor="middle" fill={VIO} fontFamily={MONO} fontSize={20} letterSpacing={6} opacity={P(f, seekAt + 30, 14)}>OVERWORLD</text>
        {/* as naves saindo do portal e descendo devagar */}
        {[0, 1, 2, 3, 4].map((i) => {
          const k = P(f, foundAt + 12 + i * 10, 70);
          if (k <= 0) return null;
          const dx = (i - 2) * 300 * k, y = 210 + 300 * k + (i % 2) * 40 * k;
          const s = 0.25 + 0.55 * k;
          const w = 556 * s, h = 146 * s;
          return (
            <g key={i} opacity={Math.min(1, k * 3)}>
              <foreignObject x={960 + dx - w / 2} y={y - h / 2} width={w} height={h}>
                <div style={{ width: "100%", height: "100%", WebkitMaskImage: `url(${staticFile("hl3silh/gunship_mask.png")})`, maskImage: `url(${staticFile("hl3silh/gunship_mask.png")})`, WebkitMaskSize: "100% 100%", maskSize: "100% 100%", background: "linear-gradient(180deg, #5a6a76, #0b1014)" }} />
              </foreignObject>
              <circle cx={960 + dx} cy={y + h * 0.1} r={4} fill={ICE} opacity={0.8} />
            </g>
          );
        })}
        {/* "como parceiros": o elo entre a Cidadela humana e a nave da frente */}
        {f >= partAt ? <line x1={960} y1={340} x2={960} y2={210 + 300 * P(f, foundAt + 32, 70)} stroke={GREEN} strokeWidth={3} strokeDasharray="8 6" opacity={P(f, partAt, 12)} /> : null}
        {city(0.6)}
      </svg>
    );
  }
  const flash = f >= seekAt ? 1 - P(f, seekAt, 6) : 0;
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 20%, #0f1a22 0%, #03060a 75%)", overflow: "hidden", fontFamily: MONO }}>
      {body}
      <div style={{ position: "absolute", left: 100, top: 100 }}>
        {shot === 0 ? (
          <>
            {chip(4, "PELA PRIMEIRA VEZ DESDE A LIBERTAÇÃO", CREAM)}
            {f >= 26 ? chip(26, "A HUMANIDADE ABRE O CAMINHO DE NOVO · COMO NA RESSONÂNCIA", GREEN) : null}
          </>
        ) : (
          <>
            {chip(seekAt + 4, "UM PORTAL PARA O OVERWORLD · O QUE RESTOU DOS COMBINE", VIO)}
            {f >= foundAt ? chip(foundAt, "ENCONTRAM", ICE) : null}
            {f >= conqAt ? chip(conqAt, "COMO CONQUISTADORES", RED, P(f, conqAt + 14, 12)) : null}
            {f >= partAt ? chip(partAt, "COMO PARCEIROS", GREEN) : null}
          </>
        )}
      </div>
      <AbsoluteFill style={{ background: "#fff", opacity: 0.5 * flash, pointerEvents: "none" }} />
      <AbsoluteFill style={{ background: "#000", opacity: interpolate(f, [0, 6, life - 6, life], [1, 0, 0, 1], C), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};
