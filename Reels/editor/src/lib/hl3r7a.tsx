// =================================================================================================
// HL3 · REFORMULAÇÃO · módulo 7 (parte 1) (06/10/2026)
//  HLRLeakedCoords · HLRAlyxAdvisorRoom · HLRXenRootsParallax · HLRXenFieldGuide · HLRHiveBossFight · HLRObservatory3D
// =================================================================================================
import React, { useMemo } from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { FONT, MONO } from "./overlays";
import { C, HL, rnd } from "./hl3";
import { FilmLook } from "./hl3r";
import { ShipProfile } from "./hl3rd";

const RED = "#ff5d4d";
const CREAM = "#ffe2b0";
const ICE = "#9fe6ff";
const GREEN = "#8dffa8";
const ORANGE = HL.orange;
const AMB = "#ffb22e";
const CYAN = "#5ff3ff";
const VIO = "#c79bff";
const XEN = "#ffb36b";
const TXT = HL.text;
const P = (f: number, at: number, d = 12) => interpolate(f, [at, at + d], [0, 1], { ...C, easing: Easing.out(Easing.cubic) });
const IO = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const fade = (f: number, life: number) => interpolate(f, [0, 6], [1, 0], C) + interpolate(f, [life - 6, life], [0, 1], C);
type Pr = { life: number } & Record<string, number | undefined>;
const ks = (p: Pr, keys: string[]) => keys.map((k) => (p[k] as number | undefined) ?? 1e9);
const Head: React.FC<{ t: string; s?: string; c?: string; o?: number }> = ({ t, s, c = ICE, o = 1 }) => (
  <div style={{ position: "absolute", left: 80, top: 60, fontFamily: MONO, letterSpacing: 6, opacity: o }}>
    <div style={{ fontSize: 20, color: c }}>{t}</div>
    {s ? <div style={{ fontSize: 15, color: "rgba(242,240,247,0.6)", marginTop: 6 }}>{s}</div> : null}
  </div>
);
const Shell: React.FC<{ f: number; life: number; bg?: string; children: React.ReactNode }> = ({ f, life, bg = "radial-gradient(ellipse at 50% 45%, #10161c 0%, #040608 78%)", children }) => (
  <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
    {children}
    <AbsoluteFill style={{ background: "#000", opacity: fade(f, life), pointerEvents: "none" }} />
    <FilmLook />
  </AbsoluteFill>
);

// ---------------------------------------------------------------- coordenadas vazadas
export const HLRLeakedCoords: React.FC<Pr> = (p) => {
  const f = useCurrentFrame();
  const [leaveAt, searchAt, strangeAt, precAt, troopsAt, beforeAt, someoneAt, coordsAt, signalAt, roomAt] = ks(p, ["leaveAt", "searchAt", "strangeAt", "precAt", "troopsAt", "beforeAt", "someoneAt", "coordsAt", "signalAt", "roomAt"]);
  const JUMPS = [
    [520, 380],
    [980, 300],
    [1360, 520],
    [820, 700],
  ];
  const src = [1640, 820];
  return (
    <Shell f={f} life={p.life} bg="radial-gradient(ellipse at 50% 50%, #0b141a 0%, #030507 78%)">
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {Array.from({ length: 12 }).map((_, k) => (
          <line key={k} x1={0} x2={1920} y1={k * 96} y2={k * 96} stroke="rgba(159,230,255,0.05)" />
        ))}
        {Array.from({ length: 20 }).map((_, k) => (
          <line key={"v" + k} x1={k * 100} x2={k * 100} y1={0} y2={1080} stroke="rgba(159,230,255,0.05)" />
        ))}
        {JUMPS.map(([x, y], i) => {
          const at = strangeAt + i * 22;
          const troop = at - 14;
          const shipOn = f >= at;
          return (
            <g key={i}>
              {f >= troop && f >= troopsAt - 40 ? (
                <g opacity={P(f, Math.max(troop, troopsAt - 40), 8)}>
                  {[0, 1, 2].map((k) => (
                    <path key={k} d={`M ${x - 40 + k * 26} ${y + 60} l 10 0 l -3 12 l -4 5 l -4 -5 Z`} fill="#140808" stroke={RED} strokeWidth={1.5} />
                  ))}
                  <text x={x} y={y + 102} textAnchor="middle" fill={RED} fontFamily={MONO} fontSize={14} letterSpacing={2}>
                    TROPAS · −00:40
                  </text>
                </g>
              ) : null}
              <g transform={`translate(${x - 60} ${y - 24}) scale(0.12)`} opacity={shipOn ? 1 : 0.18}>
                <ShipProfile stroke={ICE} fill="rgba(159,230,255,0.1)" w={12} />
              </g>
              {!shipOn ? <circle cx={x} cy={y} r={50} fill="none" stroke="rgba(159,230,255,0.3)" strokeDasharray="6 6" /> : null}
            </g>
          );
        })}
        {/* o sinal: de onde vêm as coordenadas */}
        {f >= someoneAt ? (
          <g opacity={P(f, someoneAt, 10)}>
            {JUMPS.map(([x, y], i) => (
              <line key={i} x1={src[0]} y1={src[1]} x2={src[0] + (x - src[0]) * P(f, someoneAt + i * 4, 20)} y2={src[1] + (y + 60 - src[1]) * P(f, someoneAt + i * 4, 20)} stroke={AMB} strokeWidth={2} strokeDasharray="8 6" strokeDashoffset={-f * 3} />
            ))}
            <circle cx={src[0]} cy={src[1]} r={18 + 4 * Math.sin(f / 4)} fill="none" stroke={AMB} strokeWidth={3} />
            <text x={src[0]} y={src[1] + 50} textAnchor="middle" fill={AMB} fontFamily={MONO} fontSize={16} letterSpacing={3}>
              {f >= roomAt - 10 ? "SALA DE CONTROLE" : "ORIGEM ?"}
            </text>
          </g>
        ) : null}
      </svg>
      <Head t={f >= someoneAt ? "ALGUÉM PASSA AS COORDENADAS" : f >= precAt ? "OS COMBINE ACERTAM OS SALTOS COM PRECISÃO DEMAIS" : "GORDON PROCURA A ALYX PELO BOREALIS"} s={f >= beforeAt ? "AS TROPAS CHEGAM ANTES DO NAVIO" : f >= strangeAt ? "UMA COISA ESTRANHA" : ""} c={f >= someoneAt ? AMB : ICE} />
      {void leaveAt}
      {void searchAt}
      {void coordsAt}
      {void signalAt}
    </Shell>
  );
};

// ---------------------------------------------------------------- a Alyx diante do Advisor
export const HLRAlyxAdvisorRoom: React.FC<Pr> = (p) => {
  const f = useCurrentFrame();
  const [openAt, advAt, notHeldAt, notIntAt, talkAt, seesAt, nobodyAt, notExpAt, sayAt, consoleAt, ruptAt, floorAt, holdsAt, xenAt, triesAt, floorGoneAt, dogAt, fallAt] = ks(p, ["openAt", "advAt", "notHeldAt", "notIntAt", "talkAt", "seesAt", "nobodyAt", "notExpAt", "sayAt", "consoleAt", "ruptAt", "floorAt", "holdsAt", "xenAt", "triesAt", "floorGoneAt", "dogAt", "fallAt"]);
  const fall = IO((f - floorGoneAt) / 30);
  const room = 1 - P(f, floorGoneAt + 10, 14);
  const rift = P(f, floorAt - 10, 20);
  return (
    <Shell f={f} life={p.life} bg="radial-gradient(ellipse at 50% 50%, #0c1014 0%, #030405 78%)">
      {room > 0 ? (
        <AbsoluteFill style={{ opacity: room }}>
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, transform: `translateY(${fall * 400}px) scale(${1 + fall * 0.4})` }}>
            <g transform="translate(860 560) rotate(-30) scale(1 0.62)">
              <rect x={-420} y={-320} width={840} height={640} fill="rgba(159,230,255,0.04)" stroke="rgba(159,230,255,0.4)" strokeWidth={2} />
              {Array.from({ length: 8 }).map((_, k) => (
                <line key={k} x1={-420 + k * 105} x2={-420 + k * 105} y1={-320} y2={320} stroke="rgba(159,230,255,0.06)" />
              ))}
              {/* console */}
              <rect x={180} y={-260} width={180} height={60} fill="#0b1012" stroke={CYAN} strokeWidth={2} />
              {/* a fenda no chão */}
              {rift > 0 ? (
                <g>
                  <ellipse cx={0} cy={60} rx={220 * rift} ry={140 * rift} fill="#ffb36b" opacity={0.18 + 0.1 * Math.sin(f / 5)} />
                  <ellipse cx={0} cy={60} rx={160 * rift} ry={100 * rift} fill="#3a1e10" stroke={XEN} strokeWidth={3} />
                  {f >= holdsAt ? <ellipse cx={0} cy={60} rx={230 * rift} ry={150 * rift} fill="none" stroke={ORANGE} strokeWidth={4} strokeDasharray="10 8" strokeDashoffset={f * 2} /> : null}
                </g>
              ) : null}
            </g>
            {/* marcadores (sem desenhar ninguém) */}
            {(() => {
              const alyx = { x: 1040, y: f >= consoleAt ? 420 : 520 };
              const adv = { x: 1260, y: 440 };
              const gord = { x: 560 + 200 * P(f, seesAt - 20, 30), y: 700 - 60 * P(f, triesAt, 20) };
              return (
                <g>
                  <g opacity={P(f, advAt, 10)}>
                    <ellipse cx={adv.x} cy={adv.y} rx={70} ry={40} fill="#0b1012" stroke={CYAN} strokeWidth={3} />
                    <ellipse cx={adv.x} cy={adv.y} rx={90 + 6 * Math.sin(f / 6)} ry={56} fill="none" stroke="rgba(95,243,255,0.3)" />
                    <text x={adv.x} y={adv.y - 60} textAnchor="middle" fill={CYAN} fontFamily={MONO} fontSize={16} letterSpacing={3}>
                      ADVISOR
                    </text>
                  </g>
                  <g opacity={P(f, openAt, 10)}>
                    <circle cx={alyx.x} cy={alyx.y} r={12} fill={ORANGE} />
                    <text x={alyx.x - 20} y={alyx.y - 22} textAnchor="end" fill={ORANGE} fontFamily={MONO} fontSize={16} letterSpacing={3}>
                      ALYX
                    </text>
                    {f >= talkAt && f < consoleAt ? <path d={`M ${alyx.x + 20} ${alyx.y - 6} Q ${(alyx.x + adv.x) / 2} ${alyx.y - 60} ${adv.x - 74} ${adv.y - 6}`} fill="none" stroke={ORANGE} strokeWidth={2} strokeDasharray="4 6" strokeDashoffset={-f * 2} /> : null}
                  </g>
                  {f >= seesAt - 20 ? (
                    <g opacity={P(f, seesAt - 20, 10)}>
                      <circle cx={gord.x} cy={gord.y} r={12} fill={AMB} />
                      <circle cx={gord.x - 30} cy={gord.y + 20} r={9} fill="#9aa0a6" opacity={P(f, dogAt - 30, 10)} />
                      <text x={gord.x} y={gord.y + 40} textAnchor="middle" fill={AMB} fontFamily={MONO} fontSize={16} letterSpacing={3}>
                        GORDON
                      </text>
                    </g>
                  ) : null}
                </g>
              );
            })()}
          </svg>
          {/* status */}
          <div style={{ position: "absolute", right: 90, top: 160, width: 440, fontFamily: MONO }}>
            {[
              ["PRESA", "NÃO", notHeldAt, RED],
              ["INTERROGADA", "NÃO", notIntAt, RED],
              ["CONVERSANDO COM ELE", "SIM", talkAt, GREEN],
            ].map(([l, v, at, c]) => (
              <div key={l as string} style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", borderBottom: "1px solid rgba(242,240,247,0.15)", fontSize: 20, letterSpacing: 4, color: TXT, opacity: P(f, at as number, 8) }}>
                <span>{l}</span>
                <span style={{ color: c as string }}>{v}</span>
              </div>
            ))}
          </div>
          {f >= nobodyAt && f < sayAt ? <div style={{ position: "absolute", left: 0, right: 0, top: 880, textAlign: "center", fontFamily: MONO, fontSize: 22, letterSpacing: 6, color: CREAM, opacity: P(f, nobodyAt, 8) }}>{`POR ALGUNS SEGUNDOS NINGUÉM FAZ NADA · ${Math.min(3, Math.floor((f - nobodyAt) / 30))}s`}</div> : null}
          {f >= sayAt && f < ruptAt ? <div style={{ position: "absolute", left: 0, right: 0, top: 860, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 72, color: TXT, opacity: P(f, sayAt, 8) }}>“Você ainda não entenderia.”</div> : null}
          {f >= ruptAt ? <Head t={f >= holdsAt ? "DESSA VEZ, A ALYX SEGURA A RUPTURA" : "UMA RUPTURA SE ABRE NO CHÃO"} s={f >= xenAt ? "DO OUTRO LADO: XEN" : ""} c={XEN} /> : <Head t="A SALA DE CONTROLE" s={f >= advAt ? "A ALYX DIANTE DE UM ADVISOR" : ""} c={ICE} />}
        </AbsoluteFill>
      ) : null}
      {/* a queda em Xen */}
      {f >= floorGoneAt ? (
        <AbsoluteFill style={{ opacity: P(f, floorGoneAt + 6, 14), background: "linear-gradient(180deg, #1a0a2e 0%, #5a3a1e 60%, #1c3a2a 100%)" }}>
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
            {Array.from({ length: 40 }).map((_, k) => {
              const x = rnd(k * 3.1) * 1920;
              const y = (((rnd(k * 5.3) * 1300 - (f - floorGoneAt) * (18 + rnd(k) * 20)) % 1300) + 1300) % 1300 - 100;
              return <line key={k} x1={x} x2={x} y1={y} y2={y + 80 + rnd(k) * 120} stroke="rgba(255,230,190,0.35)" strokeWidth={2} />;
            })}
            {Array.from({ length: 6 }).map((_, k) => {
              const y = 1200 - ((f - floorGoneAt) * (6 + k * 2)) % 1400;
              return <ellipse key={"i" + k} cx={200 + k * 300} cy={y} rx={120 - k * 8} ry={30} fill="#2e2a22" stroke="#7a5a3a" />;
            })}
          </svg>
          <div style={{ position: "absolute", left: 0, right: 0, top: 440, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 110, color: TXT, opacity: P(f, fallAt - 10, 10) }}>em direção a Xen</div>
        </AbsoluteFill>
      ) : null}
    </Shell>
  );
};

// ---------------------------------------------------------------- Xen: volta às raízes (parallax)
const xenRidge = (seed: number, base: number, amp: number) => {
  let d = `M -20 1100 L -20 ${base} `;
  for (let x = -20; x <= 3000; x += 24) d += `L ${x} ${(base - amp * Math.abs(Math.sin(x / 260 + seed)) * (0.6 + 0.4 * Math.sin(x / 90 + seed * 3))).toFixed(1)} `;
  return d + "L 3000 1100 Z";
};
export const HLRXenRootsParallax: React.FC<Pr> = (p) => {
  const f = useCurrentFrame();
  const [rootsAt, notCampAt, notMuralAt, sepAt, minutesAt, aloneAt, cavesAt, islandsAt, hearAt, farAt, reunAt, creatAt] = ks(p, ["rootsAt", "notCampAt", "notMuralAt", "sepAt", "minutesAt", "aloneAt", "cavesAt", "islandsAt", "hearAt", "farAt", "reunAt", "creatAt"]);
  const X = f * 3.2;
  const islands = useMemo(() => Array.from({ length: 14 }).map((_, i) => ({ x: rnd(i * 3.1) * 2600, y: 200 + rnd(i * 5.3) * 420, w: 80 + rnd(i * 7.1) * 200, k: 0.2 + rnd(i * 2.2) * 0.9 })), []);
  const meter = P(f, notCampAt - 10, 14) * (1 - P(f, sepAt - 10, 10));
  const sliderV = interpolate(f, [notCampAt, notMuralAt + 20], [0.95, 0.5], { ...C, easing: Easing.inOut(Easing.cubic) });
  const gx = 300 + IO((f - aloneAt) / 160) * 900;
  const dogX = 1500;
  const reun = IO((f - reunAt) / 30);
  return (
    <Shell f={f} life={p.life} bg="#120a1c">
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="xs" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1a0a2e" />
            <stop offset="0.55" stopColor="#6a3e22" />
            <stop offset="1" stopColor="#1c3a2a" />
          </linearGradient>
        </defs>
        <rect width={1920} height={1080} fill="url(#xs)" />
        {/* ilhas flutuantes em profundidade */}
        {islands.map((is, i) => {
          const x = ((is.x - X * is.k) % 2600 + 2600) % 2600 - 300;
          const y = is.y + Math.sin(f / 40 + i) * 8 * is.k;
          return (
            <g key={i} opacity={0.4 + 0.6 * is.k}>
              <ellipse cx={x} cy={y} rx={is.w * is.k + 30} ry={(is.w * is.k + 30) * 0.22} fill={`rgba(46,42,34,${0.6 + 0.4 * is.k})`} stroke="#7a5a3a" strokeWidth={1} />
              <path d={`M ${x - (is.w * is.k + 30) * 0.6} ${y} Q ${x} ${y + (is.w * is.k + 30) * 0.7} ${x + (is.w * is.k + 30) * 0.6} ${y} Z`} fill={`rgba(30,26,20,${0.6 + 0.4 * is.k})`} />
            </g>
          );
        })}
        <g transform={`translate(${-X * 0.3} 0)`}>
          <path d={xenRidge(1.3, 820, 160)} fill="#24361f" />
        </g>
        <g transform={`translate(${-X * 0.6} 0)`}>
          <path d={xenRidge(2.7, 920, 120)} fill="#162414" />
        </g>
        {/* o Gordon e o Dog */}
        {f >= aloneAt - 10 ? (
          <g opacity={P(f, aloneAt - 10, 10)}>
            <circle cx={gx + (dogX - 60 - gx) * reun} cy={860} r={11} fill={AMB} />
            <text x={gx + (dogX - 60 - gx) * reun} y={830} textAnchor="middle" fill={AMB} fontFamily={MONO} fontSize={15} letterSpacing={3}>
              GORDON
            </text>
            <circle cx={dogX} cy={870} r={13} fill="#9aa0a6" opacity={f >= hearAt ? 1 : 0.2} />
            <text x={dogX} y={900} textAnchor="middle" fill="#cfd4d8" fontFamily={MONO} fontSize={15} letterSpacing={3} opacity={f >= hearAt ? 1 : 0.2}>
              DOG
            </text>
            {f >= hearAt && f < reunAt
              ? [0, 1, 2].map((k) => {
                  const t = ((f - hearAt + k * 12) % 36) / 36;
                  return <circle key={k} cx={dogX} cy={870} r={20 + t * 260} fill="none" stroke="#cfd4d8" strokeWidth={2} opacity={(1 - t) * 0.7} />;
                })
              : null}
          </g>
        ) : null}
      </svg>
      {/* tamanho dessa parte: nem campanha inteira, nem dois corredores */}
      {meter > 0 ? (
        <div style={{ position: "absolute", left: 300, right: 300, top: 420, opacity: meter }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 18, letterSpacing: 4, color: TXT }}>
            <span>2 CORREDORES + UM MURAL</span>
            <span>UMA CAMPANHA INTEIRA EM XEN</span>
          </div>
          <div style={{ position: "relative", height: 6, marginTop: 18, background: "rgba(242,240,247,0.3)", borderRadius: 3 }}>
            <div style={{ position: "absolute", left: `${sliderV * 100}%`, top: -14, width: 34, height: 34, marginLeft: -17, borderRadius: 17, background: XEN, boxShadow: "0 0 20px rgba(255,179,107,0.7)" }} />
          </div>
        </div>
      ) : null}
      <Head t="XEN · UMA VOLTA ÀS RAÍZES DO HALF-LIFE" s={f >= hearAt ? "O DOG DESTRUINDO ALGUMA COISA AO LONGE" : f >= islandsAt ? "CAVERNAS · ILHAS FLUTUANTES" : f >= sepAt ? "GORDON E DOG CAEM SEPARADOS · ALGUNS MINUTOS" : ""} c={XEN} />
      {f >= creatAt - 20 ? <div style={{ position: "absolute", left: 0, right: 0, bottom: 90, textAlign: "center", fontFamily: MONO, fontSize: 20, letterSpacing: 6, color: CREAM, opacity: P(f, creatAt - 20, 10) }}>NO CAMINHO: CRIATURAS CLÁSSICAS</div> : null}
      {void rootsAt}
      {void minutesAt}
      {void cavesAt}
      {void farAt}
    </Shell>
  );
};

// ---------------------------------------------------------------- guia de campo de Xen
export const HLRXenFieldGuide: React.FC<Pr> = (p) => {
  const f = useCurrentFrame();
  const [houndAt, packAt, squidAt, swampAt, barnAt, hangAt, noFloorAt] = ks(p, ["houndAt", "packAt", "squidAt", "swampAt", "barnAt", "hangAt", "noFloorAt"]);
  const card = (i: number, name: string, note: string, at: number, art: React.ReactNode) => (
    <div style={{ position: "absolute", left: 120 + i * 580, top: 220, width: 520, height: 640, background: "#e6dcc4", borderRadius: 6, boxShadow: "0 30px 70px rgba(0,0,0,0.6)", opacity: P(f, at, 10), transform: `translateY(${(1 - P(f, at, 14)) * 60}px) rotate(${(i - 1) * 2}deg)` }}>
      <svg width={520} height={440} style={{ position: "absolute", left: 0, top: 30 }}>
        {art}
      </svg>
      <div style={{ position: "absolute", left: 28, bottom: 30, right: 28 }}>
        <div style={{ fontFamily: MONO, fontSize: 15, letterSpacing: 4, color: "#6a5a3a" }}>{`XEN · ESPÉCIME 0${i + 1}`}</div>
        <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 52, color: "#1d1a17" }}>{name}</div>
        <div style={{ fontFamily: MONO, fontSize: 18, letterSpacing: 2, color: "#3a3428" }}>{note}</div>
      </div>
    </div>
  );
  const ink = "#2a3a2a";
  return (
    <Shell f={f} life={p.life} bg="radial-gradient(ellipse at 50% 45%, #1a1410 0%, #070504 78%)">
      {card(0, "Houndeye", "caçam em grupo", houndAt, (
        <g>
          {[[200, 220], [300, 180], [320, 290], [220, 320], [400, 240]].map(([x, y], k) => (
            <g key={k} opacity={P(f, packAt + k * 4, 6)}>
              <circle cx={x} cy={y} r={16} fill="none" stroke={ink} strokeWidth={3} />
              <circle cx={x} cy={y} r={40 + ((f + k * 9) % 30)} fill="none" stroke={ink} strokeWidth={1} opacity={0.4 - ((f + k * 9) % 30) / 80} />
            </g>
          ))}
          <path d="M 120 380 Q 260 120 440 360" fill="none" stroke={ink} strokeWidth={2} strokeDasharray="6 6" />
        </g>
      ))}
      {card(1, "Bullsquid", "nos pântanos", squidAt, (
        <g>
          {Array.from({ length: 5 }).map((_, k) => (
            <path key={k} d={`M 40 ${260 + k * 30} Q 140 ${240 + k * 30 + Math.sin(f / 10 + k) * 10} 260 ${260 + k * 30} T 480 ${260 + k * 30}`} fill="none" stroke={ink} strokeWidth={2} opacity={P(f, swampAt, 10)} />
          ))}
          <ellipse cx={260} cy={220} rx={60} ry={34} fill="none" stroke={ink} strokeWidth={3} />
          <path d="M 300 200 l 60 -30" stroke={ink} strokeWidth={2} strokeDasharray="4 4" />
        </g>
      ))}
      {card(2, "Barnacle", "pendurado sem chão embaixo", barnAt, (
        <g>
          <line x1={20} x2={500} y1={60} y2={60} stroke={ink} strokeWidth={6} />
          {[160, 260, 380].map((x, k) => (
            <g key={k} opacity={P(f, hangAt + k * 5, 8)}>
              <ellipse cx={x} cy={80} rx={26} ry={16} fill="none" stroke={ink} strokeWidth={3} />
              <line x1={x} x2={x} y1={96} y2={200 + 80 * Math.sin(f / 20 + k)} stroke={ink} strokeWidth={2} />
            </g>
          ))}
          <text x={260} y={400} textAnchor="middle" fill={ink} fontFamily={MONO} fontSize={16} letterSpacing={3} opacity={P(f, noFloorAt - 10, 8)}>
            · · · SEM CHÃO · · ·
          </text>
        </g>
      ))}
      <Head t="CRIATURAS CLÁSSICAS" s="GUIA DE CAMPO" c={XEN} />
    </Shell>
  );
};

// ---------------------------------------------------------------- a colmeia e a guardiã
export const HLRHiveBossFight: React.FC<Pr> = (p) => {
  const f = useCurrentFrame();
  const [hiveAt, wakesAt, biggerAt, protAt, dogAt, gordonAt, padsAt, gravAt, structAt, physAt, ammoAt, giantAt] = ks(p, ["hiveAt", "wakesAt", "biggerAt", "protAt", "dogAt", "gordonAt", "padsAt", "gravAt", "structAt", "physAt", "ammoAt", "giantAt"]);
  const cells = useMemo(() => {
    const out: [number, number][] = [];
    for (let r = 0; r < 9; r++) for (let c = 0; c < 16; c++) out.push([140 + c * 110 + (r % 2) * 55, 200 + r * 95]);
    return out;
  }, []);
  const boss = { x: 1180, y: 520 };
  const pulse = P(f, wakesAt, 20);
  const hex = (x: number, y: number, r: number) => Array.from({ length: 6 }).map((_, k) => `${x + r * Math.cos((k / 6) * Math.PI * 2)},${y + r * Math.sin((k / 6) * Math.PI * 2)}`).join(" ");
  const jumps = [[360, 860, 640, 640], [640, 640, 900, 520]];
  const throwT = (f - gravAt) % 40;
  const hits = Math.max(0, Math.floor((f - structAt) / 20));
  return (
    <Shell f={f} life={p.life} bg="radial-gradient(ellipse at 60% 50%, #2a1e10 0%, #0a0704 78%)">
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {cells.map(([x, y], i) => {
          const d = Math.hypot(x - boss.x, y - boss.y);
          return <polygon key={i} points={hex(x, y, 52)} fill={`rgba(120,80,30,${0.06 + 0.1 * Math.max(0, 1 - d / 700) * pulse})`} stroke="rgba(200,150,80,0.25)" strokeWidth={2} opacity={P(f, hiveAt + (i % 16), 10)} />;
        })}
        {/* a guardiã */}
        {f >= wakesAt ? (
          <g opacity={pulse}>
            <ellipse cx={boss.x} cy={boss.y} rx={160 + 20 * Math.sin(f / 6)} ry={110} fill="rgba(160,90,30,0.25)" stroke={XEN} strokeWidth={4} />
            <ellipse cx={boss.x} cy={boss.y} rx={240 + 30 * Math.sin(f / 9)} ry={170} fill="none" stroke="rgba(255,179,107,0.35)" strokeWidth={2} />
            <text x={boss.x} y={boss.y - 140} textAnchor="middle" fill={XEN} fontFamily={MONO} fontSize={18} letterSpacing={4}>
              {f >= protAt ? "A GUARDIÃ · PROTEGE O LUGAR" : "UMA CRIATURA MUITO MAIOR"}
            </text>
          </g>
        ) : null}
        {/* o Dog segura */}
        {f >= dogAt ? (
          <g opacity={P(f, dogAt, 8)}>
            <circle cx={boss.x - 220} cy={boss.y + 60} r={16} fill="#9aa0a6" />
            <line x1={boss.x - 204} y1={boss.y + 56} x2={boss.x - 150} y2={boss.y + 30} stroke="#cfd4d8" strokeWidth={6} />
            <text x={boss.x - 220} y={boss.y + 100} textAnchor="middle" fill="#cfd4d8" fontFamily={MONO} fontSize={15} letterSpacing={3}>
              DOG SEGURA
            </text>
          </g>
        ) : null}
        {/* as plataformas de salto e o Gordon */}
        {f >= padsAt
          ? jumps.map(([x0, y0, x1, y1], k) => (
              <g key={k} opacity={P(f, padsAt + k * 10, 8)}>
                <ellipse cx={x0} cy={y0} rx={40} ry={12} fill="none" stroke={GREEN} strokeWidth={3} />
                <path d={`M ${x0} ${y0} Q ${(x0 + x1) / 2} ${Math.min(y0, y1) - 220} ${x1} ${y1}`} fill="none" stroke={AMB} strokeWidth={2.5} strokeDasharray="8 6" />
              </g>
            ))
          : null}
        {/* Gravity Gun: objetos lançados contra a estrutura */}
        {f >= gravAt && throwT < 30
          ? (() => {
              const t = throwT / 30;
              const x = 900 + (boss.x + 120 - 900) * t;
              const y = 520 - Math.sin(t * Math.PI) * 120 + (boss.y - 200 - 520) * t;
              return <rect x={x - 14} y={y - 14} width={28} height={28} fill="#7a6a50" stroke={CREAM} strokeWidth={2} transform={`rotate(${t * 400} ${x} ${y})`} />;
            })()
          : null}
        {f >= structAt
          ? Array.from({ length: Math.min(4, hits) }).map((_, k) => (
              <g key={k}>
                <line x1={boss.x + 100 + k * 40} y1={boss.y - 260} x2={boss.x + 140 + k * 40} y2={boss.y - 120} stroke="#c9a070" strokeWidth={8} />
                <path d={`M ${boss.x + 100 + k * 40} ${boss.y - 260} l 20 30 l -26 10`} fill="none" stroke={RED} strokeWidth={3} />
              </g>
            ))
          : null}
      </svg>
      {/* física × munição */}
      {f >= physAt ? (
        <div style={{ position: "absolute", left: 90, bottom: 90, display: "flex", gap: 40, fontFamily: MONO, opacity: P(f, physAt, 10) }}>
          {[
            ["FÍSICA", String(Math.min(9, 1 + hits)), GREEN],
            ["MUNIÇÃO GASTA", "0", RED],
          ].map(([l, v, c]) => (
            <div key={l} style={{ padding: "12px 20px", background: "rgba(10,8,4,0.7)", borderRadius: 10, borderLeft: `4px solid ${c}` }}>
              <div style={{ fontSize: 15, letterSpacing: 4, color: c }}>{l}</div>
              <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 56, color: TXT }}>{v}</div>
            </div>
          ))}
        </div>
      ) : null}
      <Head t="UMA COLMEIA ANTIGA DE ANTLIONS" s={f >= gravAt ? "PLATAFORMAS DE SALTO · GRAVITY GUN" : ""} c={XEN} />
      {void biggerAt}
      {void gordonAt}
      {void ammoAt}
      {void giantAt}
    </Shell>
  );
};

// ---------------------------------------------------------------- o observatório Vortigaunt
export const HLRObservatory3D: React.FC<Pr> = (p) => {
  const f = useCurrentFrame();
  const [paceAt, ruinsAt, drawAt, obsAt, stonesAt, reactAt, nearAt, lightAt, imagesAt, notHoloAt, memAt, worldsAt, earthAt, xenAt, otherAt, passAt, combAt, floorAt, recentAt, studyAt, separateAt] = ks(p, ["paceAt", "ruinsAt", "drawAt", "obsAt", "stonesAt", "reactAt", "nearAt", "lightAt", "imagesAt", "notHoloAt", "memAt", "worldsAt", "earthAt", "xenAt", "otherAt", "passAt", "combAt", "floorAt", "recentAt", "studyAt", "separateAt"]);
  const stones = useMemo(() => Array.from({ length: 22 }).map((_, i) => ({ a: rnd(i * 3.1) * Math.PI * 2, r: 180 + rnd(i * 5.3) * 360, y: (rnd(i * 7.7) - 0.5) * 300, s: 14 + rnd(i * 2.2) * 30 })), []);
  const rot = f * 0.006;
  const lit = P(f, lightAt, 30);
  const WORLDS = [
    ["TERRA", "#5aa9ff", earthAt, -380, -60],
    ["XEN", XEN, xenAt, 360, -120],
    ["?", VIO, otherAt, -120, 220],
    ["?", GREEN, otherAt + 8, 300, 240],
  ] as const;
  const wv = P(f, imagesAt, 20);
  return (
    <Shell f={f} life={p.life} bg="radial-gradient(ellipse at 50% 50%, #10140f 0%, #040503 78%)">
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {/* arcos das ruínas */}
        {Array.from({ length: 7 }).map((_, k) => (
          <path key={k} d={`M ${200 + k * 250} 1000 L ${200 + k * 250} 520 Q ${325 + k * 250} 400 ${450 + k * 250} 520 L ${450 + k * 250} 1000`} fill="none" stroke="rgba(141,255,168,0.12)" strokeWidth={6} opacity={P(f, ruinsAt, 20)} />
        ))}
        {/* pedras e cristais suspensos girando */}
        {stones.map((s, i) => {
          const a = s.a + rot;
          const x = 960 + Math.cos(a) * s.r;
          const z = Math.sin(a);
          const y = 520 + s.y * 0.6 + z * 60;
          const on = lit * (0.5 + 0.5 * Math.sin(f / 9 + i));
          return (
            <g key={i} opacity={P(f, stonesAt, 20) * (0.4 + 0.6 * (z + 1) / 2)}>
              <polygon points={`${x},${y - s.s} ${x + s.s * 0.6},${y} ${x},${y + s.s} ${x - s.s * 0.6},${y}`} fill={`rgba(${Math.round(60 + 140 * on)},${Math.round(80 + 175 * on)},${Math.round(70 + 100 * on)},0.9)`} stroke="rgba(141,255,168,0.5)" />
            </g>
          );
        })}
        {/* os mundos formados no espaço */}
        {wv > 0 ? (
          <g opacity={wv}>
            {f >= passAt
              ? [[0, 1], [0, 2], [1, 3], [2, 3], [0, 3]].map(([a, b], k) => {
                  const A = WORLDS[a];
                  const B = WORLDS[b];
                  const e = P(f, passAt + k * 5, 20);
                  const x1 = 960 + A[3];
                  const y1 = 520 + A[4];
                  const x2 = 960 + B[3];
                  const y2 = 520 + B[4];
                  return (
                    <g key={k}>
                      <line x1={x1} y1={y1} x2={x1 + (x2 - x1) * e} y2={y1 + (y2 - y1) * e} stroke="rgba(242,240,247,0.45)" strokeWidth={2} strokeDasharray="6 6" />
                      {f >= combAt ? <circle cx={x1 + (x2 - x1) * ((((f - combAt) * 0.012 + k * 0.2) % 1))} cy={y1 + (y2 - y1) * ((((f - combAt) * 0.012 + k * 0.2) % 1))} r={7} fill={RED} /> : null}
                    </g>
                  );
                })
              : null}
            {WORLDS.map(([n, c, at, dx, dy]) => (
              <g key={`${n}${dx}`} opacity={P(f, at, 12)}>
                <circle cx={960 + dx} cy={520 + dy} r={70} fill={c} opacity={0.18} />
                <circle cx={960 + dx} cy={520 + dy} r={52} fill="none" stroke={c} strokeWidth={3} />
                <text x={960 + dx} y={520 + dy + 100} textAnchor="middle" fill={c} fontFamily={MONO} fontSize={18} letterSpacing={4}>
                  {n}
                </text>
              </g>
            ))}
          </g>
        ) : null}
        {/* equipamento Combine recente no chão */}
        {f >= floorAt ? (
          <g opacity={P(f, floorAt, 10)}>
            {[[640, 930], [760, 960], [1180, 940]].map(([x, y], k) => (
              <g key={k}>
                <rect x={x} y={y} width={90} height={44} fill="#0b1012" stroke={CYAN} strokeWidth={2} />
                <rect x={x + 10} y={y + 10} width={30} height={6} fill={CYAN} opacity={0.5 + 0.5 * Math.sin(f / 5 + k)} />
              </g>
            ))}
            <text x={900} y={1040} textAnchor="middle" fill={CYAN} fontFamily={MONO} fontSize={16} letterSpacing={3}>
              {f >= studyAt ? "OS COMBINE TAMBÉM ESTÃO ESTUDANDO" : "EQUIPAMENTO COMBINE · MUITO MAIS RECENTE"}
            </text>
          </g>
        ) : null}
      </svg>
      <Head t={f >= obsAt ? "UM OBSERVATÓRIO ANTIGO" : "RUÍNAS VORTIGAUNT"} s={f >= memAt ? "MEMÓRIA PRESERVADA PELA VORTESSÊNCIA" : f >= notHoloAt ? "NÃO É UM HOLOGRAMA" : f >= reactAt ? "OS CRISTAIS REAGEM AO GORDON" : ""} c={GREEN} />
      {f >= separateAt - 20 ? (
        <div style={{ position: "absolute", right: 90, top: 70, textAlign: "right", opacity: P(f, separateAt - 20, 10) }}>
          <div style={{ fontFamily: MONO, fontSize: 16, letterSpacing: 6, color: CREAM }}>A PRIMEIRA EVIDÊNCIA</div>
          <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 56, color: TXT, lineHeight: 1 }}>para separar duas coisas</div>
        </div>
      ) : null}
      {void paceAt}
      {void drawAt}
      {void nearAt}
      {void worldsAt}
      {void recentAt}
    </Shell>
  );
};
