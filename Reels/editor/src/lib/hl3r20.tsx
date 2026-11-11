// HL3 · 1:41:08 depois da ascensão (30/10)
// Pedido dele: o núcleo se apaga e a cena ficava quase um minuto na câmara vazia. Agora, logo depois que o núcleo some,
// corta para o que a narração está dizendo:
//  W · "quem ficou olhando não sabe o que aconteceu": os que participaram viram molduras vazias; três hipóteses com "?"
//      (morreram · transportados · perpetuidade) · "nunca voltam para explicar"
//  B · "pra quem fica, aquilo parece prova": o registro da câmara depois do evento (as marcas onde eles estavam) carimbado
//      PROVA · "a perpetuidade existe", "a ascensão aconteceu" · a fila de quem passa a acreditar · o jogador sem resposta
//  T · "a verdade é outra": conceder perpetuidade riscado · a mesma linha voltando ao mesmo ponto (a rosácea) · Borealis,
//      núcleo e ferida alinhados · o catalisador produzido · a convergência continua intacta
import React from "react";
import { AbsoluteFill, Easing, interpolate, staticFile, useCurrentFrame } from "remotion";
import { MONO } from "./overlays";
import { C } from "./hl3";

type PR = Record<string, number> & { life: number };
const at = (p: PR, k: string) => Math.round((p[k] as number | undefined) ?? 1e6);
const P = (f: number, t: number, d = 12) => interpolate(f, [t, t + d], [0, 1], { ...C, easing: Easing.out(Easing.cubic) });
const GREEN = "#8dffa8";
const RED = "#ff5d4d";
const GOLD = "#ffd27a";
const VIO = "#c79bff";
const ICE = "#9fe6ff";
const CREAM = "#fff2d8";
const BOX = "rgba(8,10,14,0.88)";

export const HL13AscAfter: React.FC<PR & { cutAt: number }> = (p) => {
  const f = useCurrentFrame();
  const cutAt = p.cutAt;
  const [deadQ, transQ, perpQ, backAt, proofAt, believeAt, answerAt, truthAt, neverAt, realAt, eventAt, lineAt, alignAt, prodAt, intactAt] = ["deadQAt", "transQAt", "perpQAt", "backAt", "proofAt", "believeAt", "answerAt", "truthAt", "neverAt", "realAt", "eventAt", "lineAt", "alignAt", "prodAt", "intactAt"].map((k) => at(p, k));
  const shot = f < proofAt ? 0 : f < truthAt ? 1 : 2;
  const inO = shot === 0 ? 1 : P(f, shot === 1 ? proofAt : truthAt, 14);

  let body: React.ReactNode = null;
  if (shot === 0) {
    // ---- W: as molduras vazias e as três hipóteses
    const who: [string, string, string][] = [["hl3silh/rebelde_badge.jpg", "HUMANO", GREEN], ["hl3silh/rebelde3_badge.jpg", "HUMANO", GREEN], ["hl3silh/combine_badge.jpg", "COMBINE", "#b8c4cc"], ["hl3silh/advisor_card.jpg", "ADVISOR", VIO]];
    const hyp: [number, string, string][] = [[deadQ, "MORRERAM?", "tomb"], [transQ, "FORAM TRANSPORTADOS?", "portal"], [perpQ, "ALCANÇARAM A PERPETUIDADE?", "inf"]];
    const icon = (k: string) =>
      k === "tomb" ? (
        <g>
          <path d="M 150 190 L 150 95 Q 150 55 190 55 Q 230 55 230 95 L 230 190 Z" fill="#14181c" stroke="#cfd6da" strokeWidth={3} />
          <path d="M 190 80 L 190 130 M 172 98 L 208 98" stroke="#cfd6da" strokeWidth={4} />
          <line x1={110} y1={190} x2={270} y2={190} stroke="#cfd6da" strokeWidth={3} />
        </g>
      ) : k === "portal" ? (
        <g>
          {[70, 52, 34].map((r, i) => <ellipse key={i} cx={210} cy={120} rx={r * 0.62} ry={r} fill="none" stroke={ICE} strokeWidth={3} opacity={1 - i * 0.25} strokeDasharray="14 8" strokeDashoffset={(f * (i % 2 ? -3 : 4)) % 200} />)}
          <path d="M 90 120 L 170 120 M 152 102 L 172 120 L 152 138" stroke={CREAM} strokeWidth={4} fill="none" />
        </g>
      ) : (
        <path d="M 190 120 C 150 60, 90 60, 90 120 C 90 180, 150 180, 190 120 C 230 60, 290 60, 290 120 C 290 180, 230 180, 190 120 Z" fill="none" stroke={GOLD} strokeWidth={5} />
      );
    body = (
      <>
        <div style={{ position: "absolute", left: 0, right: 0, top: 70, textAlign: "center", fontSize: 22, letterSpacing: 6, color: "#cfe8ff", opacity: P(f, cutAt + 6, 12) }}>QUEM FICOU OLHANDO NÃO SABE O QUE ACONTECEU</div>
        {/* os que participaram: a foto lavada de luz, depois a moldura vazia */}
        <div style={{ position: "absolute", left: 0, right: 0, top: 130, display: "flex", justifyContent: "center", gap: 34 }}>
          {who.map(([img, n, c], k) => {
            const wash = P(f, cutAt + 10 + k * 8, 40);
            return (
              <div key={k} style={{ width: 190, opacity: P(f, cutAt + k * 5, 10) }}>
                <div style={{ position: "relative", height: 230, borderRadius: 8, border: `2px ${wash > 0.95 ? "dashed" : "solid"} ${c}`, background: "#06080a", overflow: "hidden" }}>
                  <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${staticFile(img)})`, backgroundSize: "cover", backgroundPosition: "50% 30%", opacity: 1 - wash }} />
                  <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 50% 45%, rgba(255,248,230,${0.9 * Math.sin(wash * Math.PI)}), rgba(255,248,230,0) 70%)` }} />
                  {wash > 0.95 ? <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 90, color: c, opacity: 0.5 }}>?</div> : null}
                </div>
                <div style={{ marginTop: 8, textAlign: "center", fontSize: 16, letterSpacing: 4, color: c }}>{n}</div>
              </div>
            );
          })}
        </div>
        {f >= backAt ? (
          <div style={{ position: "absolute", left: 0, right: 0, top: 255, display: "flex", justifyContent: "center", pointerEvents: "none" }}>
            <div style={{ padding: "10px 22px", border: `4px solid ${RED}`, color: RED, background: "rgba(10,4,4,0.75)", fontSize: 30, letterSpacing: 5, transform: `rotate(-4deg) scale(${1.25 - 0.25 * P(f, backAt, 8)})`, opacity: P(f, backAt, 6) }}>NUNCA VOLTAM PARA EXPLICAR</div>
          </div>
        ) : null}
        {/* as três hipóteses */}
        <div style={{ position: "absolute", left: 0, right: 0, top: 470, display: "flex", justifyContent: "center", gap: 40 }}>
          {hyp.map(([t0, txt, ic]) => (
            <div key={txt} style={{ width: 420, height: 380, background: BOX, border: "1.5px solid rgba(242,240,247,0.25)", borderRadius: 12, position: "relative", opacity: P(f, t0, 10), transform: `translateY(${(1 - P(f, t0, 14)) * 40}px)` }}>
              <svg width={420} height={250} viewBox="0 0 420 250">{icon(ic)}</svg>
              <div style={{ textAlign: "center", fontSize: 22, letterSpacing: 3, color: "#f2f0f7", padding: "0 16px" }}>{txt}</div>
              {f >= backAt ? <div style={{ textAlign: "center", marginTop: 14, fontSize: 15, letterSpacing: 5, color: "rgba(242,240,247,0.5)", opacity: P(f, backAt + 10, 10) }}>SEM RESPOSTA</div> : null}
              <div style={{ position: "absolute", right: 16, top: 6, fontSize: 70, color: GOLD, opacity: 0.8 }}>?</div>
            </div>
          ))}
        </div>
      </>
    );
  } else if (shot === 1) {
    // ---- B: o registro vira prova; quem fica passa a acreditar; o jogador sem resposta
    const marks: [number, number, string][] = [[-210, 40, GREEN], [-120, 70, GREEN], [60, 74, "#b8c4cc"], [150, 46, "#b8c4cc"], [240, -10, VIO]];
    const dim = f >= answerAt ? P(f, answerAt, 14) : 0;
    const s1 = proofAt + 105, s2 = proofAt + 157;
    body = (
      <>
        <div style={{ opacity: 1 - 0.65 * dim }}>
          {/* o registro da câmara depois do evento */}
          <div style={{ position: "absolute", left: 140, top: 170, width: 760, background: BOX, border: "1.5px solid rgba(255,210,122,0.4)", borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: 15, letterSpacing: 4, color: GOLD }}>REGISTRO · CÂMARA DO NÚCLEO · DEPOIS DO EVENTO</div>
            <svg width={732} height={440} style={{ marginTop: 10, background: "#050607" }}>
              <defs>
                <radialGradient id="aaRes" cx="50%" cy="40%" r="50%"><stop offset="0" stopColor="rgba(255,240,210,0.35)" /><stop offset="1" stopColor="rgba(255,240,210,0)" /></radialGradient>
              </defs>
              {/* o chão da câmara, o poço vazio onde estava o núcleo */}
              <ellipse cx={366} cy={300} rx={340} ry={110} fill="#0c0f12" stroke="#3a4248" strokeWidth={2} />
              {[0.75, 0.5].map((s) => <ellipse key={s} cx={366} cy={300} rx={340 * s} ry={110 * s} fill="none" stroke="#2a3136" />)}
              <rect width={732} height={440} fill="url(#aaRes)" />
              <ellipse cx={366} cy={160} rx={60} ry={18} fill="none" stroke="#5a646a" strokeDasharray="6 6" />
              <text x={366} y={130} textAnchor="middle" fill="#8a949a" fontFamily={MONO} fontSize={13} letterSpacing={4}>O NÚCLEO · APAGADO</text>
              {/* as marcas de luz onde as pessoas estavam */}
              {marks.map(([dx, dy, c], i) => (
                <g key={i}>
                  <ellipse cx={366 + dx} cy={300 + dy} rx={26} ry={9} fill={c} opacity={0.18 + 0.08 * Math.sin(f / 9 + i)} />
                  <ellipse cx={366 + dx} cy={300 + dy} rx={26} ry={9} fill="none" stroke={c} strokeWidth={1.5} opacity={0.8} />
                  <line x1={366 + dx} y1={300 + dy} x2={366 + dx} y2={300 + dy - 60} stroke={c} strokeOpacity={0.25} strokeWidth={10} />
                </g>
              ))}
              <text x={20} y={425} fill="#6a747a" fontFamily={MONO} fontSize={12} letterSpacing={3}>5 PRESENTES · 0 CORPOS · 0 SAÍDAS</text>
            </svg>
            {/* o carimbo */}
            <div style={{ position: "absolute", left: 420, top: 300, padding: "8px 26px", border: `5px solid ${GOLD}`, color: GOLD, fontSize: 52, letterSpacing: 10, fontWeight: 700, transform: `rotate(-9deg) scale(${1.4 - 0.4 * P(f, proofAt + 30, 8)})`, opacity: P(f, proofAt + 30, 6), background: "rgba(10,8,2,0.5)" }}>PROVA</div>
          </div>
          {/* no que eles passam a acreditar */}
          <div style={{ position: "absolute", left: 990, top: 210, display: "flex", flexDirection: "column", gap: 28 }}>
            {[[s1, "A PERPETUIDADE EXISTE"], [s2, "A ASCENSÃO ACONTECEU"]].map(([t0, txt], k) => (
              <div key={k} style={{ padding: "16px 24px", background: BOX, borderLeft: `5px solid ${GOLD}`, opacity: P(f, t0 as number, 10), transform: `translateX(${(1 - P(f, t0 as number, 14)) * 60}px)` }}>
                <div style={{ fontSize: 14, letterSpacing: 5, color: "rgba(242,240,247,0.55)" }}>PARA QUEM FICA</div>
                <div style={{ fontSize: 34, letterSpacing: 4, color: CREAM, marginTop: 6 }}>“{txt}”</div>
              </div>
            ))}
          </div>
          {/* a fila de quem passa a acreditar, andando para a câmara */}
          {f >= believeAt ? (
            <svg width={1920} height={260} style={{ position: "absolute", left: 0, top: 790 }}>
              <line x1={0} y1={200} x2={1920} y2={200} stroke="rgba(242,240,247,0.15)" />
              {Array.from({ length: 34 }).map((_, i) => {
                const t0 = believeAt + i * 3;
                if (f < t0) return null;
                const x = ((i * 61 + (f - believeAt) * 1.4) % 2100) - 120;
                const comb = i % 3 === 2;
                const c = comb ? "#b8c4cc" : GREEN;
                return (
                  <g key={i} transform={`translate(${x} ${200})`} opacity={P(f, t0, 10) * 0.85}>
                    <circle cx={0} cy={-62} r={9} fill={c} />
                    <path d="M -10 -50 L 10 -50 L 8 -12 L -8 -12 Z" fill={c} />
                    <path d={`M -6 -12 L ${-8 + 4 * Math.sin((f + i * 7) / 5)} 0 M 6 -12 L ${8 - 4 * Math.sin((f + i * 7) / 5)} 0`} stroke={c} strokeWidth={4} />
                  </g>
                );
              })}
              <text x={960} y={250} textAnchor="middle" fill="#cfe8ff" fontFamily={MONO} fontSize={20} letterSpacing={5} opacity={P(f, believeAt + 10, 10)}>PELO MENOS É NISSO QUE ELES PASSAM A ACREDITAR</text>
            </svg>
          ) : null}
        </div>
        {/* o jogador: sem resposta */}
        {f >= answerAt ? (
          <div style={{ position: "absolute", left: 0, right: 0, top: 330, display: "flex", justifyContent: "center", opacity: dim }}>
            <div style={{ width: 640, padding: "26px 30px", background: "rgba(4,6,8,0.95)", border: `2px solid ${ICE}`, borderRadius: 12, textAlign: "center" }}>
              <div style={{ fontSize: 16, letterSpacing: 6, color: ICE }}>O JOGADOR</div>
              <div style={{ fontSize: 150, lineHeight: 1.1, color: "#f2f0f7" }}>?</div>
              <div style={{ fontSize: 22, letterSpacing: 4, color: "#f2f0f7" }}>AINDA NÃO RECEBE UMA RESPOSTA{Math.floor(f / 15) % 2 ? "_" : " "}</div>
            </div>
          </div>
        ) : null}
      </>
    );
  } else {
    // ---- T: a verdade (30/10, 2ª versão: sem caixas de texto; a rosácea no centro é a cena)
    //  "conceder perpetuidade": as figuras sobem para um ∞ no centro · "nunca precisou": o ∞ racha e as figuras caem
    //  "o evento": o ∞ se fecha no ponto e a linha começa a desenhar a rosácea; cada pétala que volta ao ponto é um evento
    //  (Black Mesa, Borealis, o catalisador, e as próximas: "?") · alinhamento: Borealis, núcleo e ferida no eixo do ponto
    // 30/10 (3ª): as pétalas nascem em ordem, no sentido do relógio a partir do topo; cada pétala é um ciclo: a linha sai
    // do ponto, percorre a história e volta ao MESMO ponto (o evento de novo). Na ponta de cada uma, de que ciclo se trata,
    // sempre do lado de fora da flor. O alinhamento fica no próprio ponto: três anéis cujas marcas giram até coincidir.
    const CX = 960, CY = 585, R = 300, NP = 5, SPAN = (2 * Math.PI) / NP * 0.86;
    const u = interpolate(f, [eventAt, intactAt + 20], [0, 1], C);
    const seg = u * NP;
    const passes = Math.min(NP, Math.floor(seg + 1e-6));
    const ph = seg - passes;
    const phiK = (k: number) => -Math.PI / 2 + (k * 2 * Math.PI) / NP;
    const petalPt = (k: number, s: number) => {
      const a = phiK(k) + (s - 0.5) * SPAN, r = R * Math.sin(Math.PI * s);
      return { x: CX + r * Math.cos(a), y: CY + r * Math.sin(a) };
    };
    const pts: string[] = [];
    for (let k = 0; k < Math.min(NP, passes + 1); k++) {
      const sMax = k < passes ? 1 : ph;
      for (let i = 0; i <= 80; i++) { const q = petalPt(k, (sMax * i) / 80); pts.push(`${q.x.toFixed(1)},${q.y.toFixed(1)}`); }
    }
    const flash = f >= eventAt && passes >= 1 ? Math.max(0, 1 - ph * 3) : 0;
    const dot = passes < NP ? petalPt(passes, ph) : { x: CX, y: CY };
    const al = P(f, alignAt, 40);
    const prod = f >= prodAt ? P(f, prodAt, 20) : 0;
    const intact = f >= intactAt ? P(f, intactAt, 16) : 0;
    // o ∞ da perpetuidade (antes do evento)
    const infO = P(f, truthAt + 10, 16) * (1 - P(f, eventAt - 10, 20));
    const crack = P(f, neverAt + 40, 14);
    const fall = P(f, realAt, 40);
    // a ponta de cada pétala (ícone logo fora dela, o nome mais para fora)
    const tip = (k: number, d: number) => ({ x: CX + (R + d) * Math.cos(phiK(k)), y: CY + (R + d) * Math.sin(phiK(k)) });
    const tipIcon = (k: number, x: number, y: number) =>
      k === 0 ? (
        <image href={staticFile("hl3silh/bm_logo.svg")} x={x - 26} y={y - 26} width={52} height={52} style={{ filter: "invert(1) sepia(1) saturate(3) hue-rotate(5deg)" }} />
      ) : k === 1 ? (
        <path d={`M ${x - 40} ${y + 8} L ${x - 26} ${y - 14} L ${x + 30} ${y - 14} L ${x + 40} ${y + 8} Z M ${x - 6} ${y - 14} L ${x - 6} ${y - 30} L ${x + 6} ${y - 30} L ${x + 6} ${y - 14}`} fill="#0c1418" stroke={ICE} strokeWidth={3} />
      ) : k === 2 ? (
        <g>{[30, 20, 10].map((r, i) => <ellipse key={i} cx={x} cy={y} rx={r} ry={r * 0.42} fill="none" stroke={GOLD} strokeWidth={3} opacity={1 - i * 0.2} transform={`rotate(${(f * (i % 2 ? -2 : 3)) % 360} ${x} ${y})`} />)}</g>
      ) : (
        <text x={x} y={y + 16} textAnchor="middle" fill="rgba(255,226,176,0.7)" fontFamily={MONO} fontSize={44}>?</text>
      );
    const tipName = ["BLACK MESA", "BOREALIS", "CATALISADOR", "A PRÓXIMA", "A PRÓXIMA"];
    const head = (t0: number, t1: number, txt: string, col = "#f2f0f7") =>
      f >= t0 && f < t1 ? <div key={txt} style={{ position: "absolute", left: 0, right: 0, top: 64, textAlign: "center", fontSize: 26, letterSpacing: 8, color: col, opacity: P(f, t0, 10) * (1 - P(f, t1 - 8, 8)) }}>{txt}</div> : null;
    const align: [string, number, string, number][] = [["BOREALIS", 92, ICE, 2.2], ["NÚCLEO", 68, GOLD, -1.6], ["FERIDA", 44, "#ff9a6a", 0.9]];
    body = (
      <>
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          <defs>
            <radialGradient id="aaPt"><stop offset="0" stopColor="#fffaf0" /><stop offset="0.4" stopColor={GOLD} stopOpacity={0.7} /><stop offset="1" stopColor={GOLD} stopOpacity={0} /></radialGradient>
            <filter id="aaGlow"><feGaussianBlur stdDeviation="6" /></filter>
          </defs>
          {/* o ∞: o que eles achavam que o catalisador dava */}
          {infO > 0 ? (
            <g opacity={infO}>
              <g transform={`translate(${CX} ${CY}) scale(${1 - 0.6 * P(f, eventAt - 10, 20)})`}>
                <path d="M 0 0 C -60 -110, -260 -110, -260 0 C -260 110, -60 110, 0 0 C 60 -110, 260 -110, 260 0 C 260 110, 60 110, 0 0 Z" fill="none" stroke={GOLD} strokeWidth={14} opacity={0.35} filter="url(#aaGlow)" />
                <path d="M 0 0 C -60 -110, -260 -110, -260 0 C -260 110, -60 110, 0 0 C 60 -110, 260 -110, 260 0 C 260 110, 60 110, 0 0 Z" fill="none" stroke={GOLD} strokeWidth={5} opacity={1 - 0.6 * crack} />
                {/* a rachadura */}
                {crack > 0 ? <path d="M -30 -140 L 10 -60 L -14 -10 L 22 40 L -6 90 L 18 150" fill="none" stroke={RED} strokeWidth={6} strokeDasharray={420} strokeDashoffset={420 * (1 - crack)} /> : null}
              </g>
              {/* as figuras subindo para o ∞, e caindo quando ele racha */}
              {Array.from({ length: 16 }).map((_, i) => {
                const side = i % 2 ? 1 : -1;
                const k = Math.min(1, Math.max(0, (f - truthAt - i * 6) / 120));
                const x0 = CX + side * (120 + ((i * 53) % 260));
                const yUp = 1000 - 360 * k;
                const y = yUp + fall * (300 + (i % 4) * 40);
                const c = i % 3 === 2 ? "#b8c4cc" : GREEN;
                return k > 0 ? (
                  <g key={i} transform={`translate(${x0} ${y}) rotate(${fall * side * 40})`} opacity={0.8 * (1 - fall)}>
                    <circle cx={0} cy={-34} r={7} fill={c} />
                    <path d="M -8 -26 L 8 -26 L 6 0 L -6 0 Z" fill={c} />
                  </g>
                ) : null;
              })}
            </g>
          ) : null}
          {/* a rosácea: a mesma linha voltando ao mesmo ponto */}
          {f >= eventAt ? (
            <g>
              <polyline points={pts.join(" ")} fill="none" stroke={GOLD} strokeWidth={12} opacity={0.18} filter="url(#aaGlow)" />
              <polyline points={pts.join(" ")} fill="none" stroke={GOLD} strokeWidth={3} opacity={0.85 * (1 - 0.4 * al)} />
              <circle cx={dot.x} cy={dot.y} r={9} fill="#fffaf0" opacity={passes < NP ? 1 : 0} />
              {/* cada pétala completa é um ciclo: Black Mesa, o Borealis, o catalisador, e os próximos */}
              {Array.from({ length: passes }).map((_, k) => {
                const ic = tip(k, 34), lb = tip(k, 84);
                const cx = Math.cos(phiK(k));
                const anchor = cx > 0.3 ? "start" : cx < -0.3 ? "end" : "middle";
                const ly = lb.y + (Math.sin(phiK(k)) < -0.5 ? -6 : Math.sin(phiK(k)) > 0.5 ? 20 : 6);
                return (
                  <g key={k} opacity={k < passes - 1 ? 1 : interpolate(ph, [0, 0.15], [0, 1], C)}>
                    {tipIcon(k, ic.x, ic.y)}
                    <text x={anchor === "start" ? lb.x + 4 : anchor === "end" ? lb.x - 4 : lb.x} y={ly} textAnchor={anchor} fill={k < 3 ? "rgba(255,226,176,0.9)" : "rgba(255,226,176,0.5)"} fontFamily={MONO} fontSize={17} letterSpacing={4}>{tipName[k]}</text>
                  </g>
                );
              })}
              <circle cx={CX} cy={CY} r={40 + 70 * flash + 160 * prod} fill="url(#aaPt)" opacity={0.6 + 0.4 * Math.max(flash, prod)} />
              {/* o alinhamento, no próprio ponto: Borealis, núcleo e ferida (três anéis) giram até as marcas coincidirem */}
              {f >= alignAt ? (
                <g opacity={P(f, alignAt, 12)}>
                  {align.map(([n, r, c, a0], i) => {
                    const a = -Math.PI / 2 + a0 * (1 - al) + (f / 40) * (1 - al) * (i % 2 ? -1 : 1);
                    return (
                      <g key={n}>
                        <circle cx={CX} cy={CY} r={r} fill="none" stroke={c} strokeWidth={3} opacity={0.9} />
                        <rect x={CX + r * Math.cos(a) - 7} y={CY + r * Math.sin(a) - 7} width={14} height={14} transform={`rotate(45 ${CX + r * Math.cos(a)} ${CY + r * Math.sin(a)})`} fill={c} stroke="#050607" strokeWidth={2} />
                      </g>
                    );
                  })}
                  <line x1={CX} y1={CY - 30} x2={CX} y2={CY - 100} stroke="#fffaf0" strokeWidth={3} opacity={P(f, alignAt + 40, 10)} />
                </g>
              ) : null}
              <circle cx={CX} cy={CY} r={9} fill="#fffaf0" />
              {intact > 0 ? <circle cx={CX} cy={CY} r={R + 150} fill="none" stroke={GREEN} strokeWidth={4} opacity={intact * (0.7 + 0.3 * Math.sin(f / 6))} /> : null}
            </g>
          ) : null}
        </svg>
        {/* uma linha só no alto, no mesmo estilo do resto do vídeo */}
        {head(truthAt, neverAt + 40, "A VERDADE É OUTRA", GOLD)}
        {head(neverAt + 40, eventAt, "NUNCA PRECISOU CONCEDER PERPETUIDADE", RED)}
        {head(eventAt, alignAt, "SÓ IMPORTAVA QUE O EVENTO ACONTECESSE · DE NOVO", GOLD)}
        {head(alignAt, intactAt, "BOREALIS · NÚCLEO · FERIDA · ALINHADOS", ICE)}
        {head(intactAt, 1e9, "A CONVERGÊNCIA CONTINUA INTACTA", GREEN)}
      </>
    );
  }
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 40%, #12151a 0%, #040506 75%)", overflow: "hidden", fontFamily: MONO }}>
      <AbsoluteFill key={shot} style={{ opacity: inO }}>{body}</AbsoluteFill>
    </AbsoluteFill>
  );
};
