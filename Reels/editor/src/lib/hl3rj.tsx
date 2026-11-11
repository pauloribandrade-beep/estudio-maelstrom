// =================================================================================================
// HL3 · REFORMULAÇÃO · 5D "o grande salto" e "depois do salto" (06/10/2026)
//  · HLRBigJump: o navio em corte tremendo; corredores somem, portas trocam, o rádio vira ruído; o medidor de fase
//    da Mossman passa do limite; o navio é puxado para um ponto; O GRANDE SALTO; no corredor, a imagem real do G-Man
//    passa na passagem do fundo
//  · HLRAfterJump: preto → o HEV reinicia → os sinais da Alyx (ajoelhada → de pé, o batimento acalma) → "estou bem" →
//    a assinatura dela muda
// =================================================================================================
import React, { useMemo } from "react";
import { AbsoluteFill, Easing, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { FONT, MONO } from "./overlays";
import { C, Clip, HL, rnd } from "./hl3";
import { FilmLook } from "./hl3r";
import { ShipProfile } from "./hl3rd";
import { Eye, Hud, Lights, RoomView, proj } from "./hl3rf";
import { buildShipCorridor } from "./hl3rb";
import { XView, XL, RGB, XMarker, buildShipHall2 } from "./hl3rx";

const RED = "#ff5d4d";
const CREAM = "#ffe2b0";
const ICE = "#9fe6ff";
const GREEN = "#8dffa8";
const ORANGE = HL.orange;
const AMB = "#ffb22e";
const TXT = HL.text;
const P = (f: number, at: number, d = 12) => interpolate(f, [at, at + d], [0, 1], { ...C, easing: Easing.out(Easing.cubic) });
const IO = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const fade = (f: number, life: number) => interpolate(f, [0, 6], [1, 0], C) + interpolate(f, [life - 6, life], [0, 1], C);

type BJ = { life: number; biggestAt?: number; shakeAt?: number; corrAt?: number; doorsAt?: number; radioAt?: number; mossAt?: number; notNormalAt?: number; pullAt?: number; farAt?: number; jumpAt?: number; playerAt?: number; gmanAt?: number; caseAt?: number; whoAt?: number };
export const HLRBigJump: React.FC<BJ> = (p) => {
  const f = useCurrentFrame();
  const a = (v?: number) => v ?? 1e9;
  const [biggestAt, shakeAt, corrAt, doorsAt, radioAt, mossAt, notNormalAt, pullAt, farAt, jumpAt, playerAt, gmanAt, caseAt, whoAt] = [p.biggestAt, p.shakeAt, p.corrAt, p.doorsAt, p.radioAt, p.mossAt, p.notNormalAt, p.pullAt, p.farAt, p.jumpAt, p.playerAt, p.gmanAt, p.caseAt, p.whoAt].map(a);
  const life = p.life;
  const shake = f >= shakeAt && f < jumpAt ? (2 + 10 * P(f, shakeAt, 60) + 14 * P(f, pullAt, 30)) : 0;
  const sx = (rnd(f * 1.3) - 0.5) * shake;
  const sy = (rnd(f * 2.7) - 0.5) * shake;
  const after = f >= jumpAt + 8;
  const flash = f >= jumpAt && f < jumpAt + 14 ? 1 - (f - jumpAt) / 14 : 0;
  // corredores do navio (no corte)
  const CORR = useMemo(() => Array.from({ length: 22 }).map((_, i) => ({ x0: 90 + rnd(i * 3.1) * 760, w: 40 + rnd(i * 5.3) * 140, y: [160, 200, 240][i % 3], gone: rnd(i * 7.7) })), []);
  const DOORS = useMemo(() => Array.from({ length: 8 }).map((_, i) => ({ x: 140 + i * 100, y: [160, 200, 240][i % 3] })), []);
  const S = 1.6;
  const X0 = 960 - 500 * S;
  const Y0 = 420 - 150 * S;
  const stretch = 1 + 0.6 * IO((f - pullAt) / 50);
  const corrGone = P(f, corrAt, 40);
  const swap = IO((f - doorsAt) / 20);
  // a parte depois do salto (cena dividida) não tem esses tempos: o medidor só é calculado quando eles existem e estão em ordem
  const gaugeOk = mossAt - 10 < notNormalAt && notNormalAt < pullAt && pullAt < farAt && farAt < 1e8;
  const gauge = (gaugeOk ? interpolate(f, [mossAt - 10, notNormalAt, pullAt, farAt], [-50, 70, 95, 140], C) : -50) + (f >= notNormalAt ? Math.sin(f / 3) * 6 : 0);
  // depois do salto: o corredor e o G-Man
  const faces = useMemo(() => buildShipCorridor(), []);
  const e: Eye = { x: 0, y: 15, z: 1.7, yaw: Math.sin(f / 70) * 0.02, pitch: -0.02, F: 900 };
  const L: Lights = { flash: 0.6, lamps: 0.12, red: 0.5, strobe: 0 };
  const c0 = proj(e, [-1.3, 24, 0]);
  const c2 = proj(e, [1.3, 24, 2.4]);
  return (
    <AbsoluteFill style={{ background: "#030507", overflow: "hidden" }}>
      {!after ? (
        <AbsoluteFill style={{ transform: `translate(${sx}px, ${sy}px)` }}>
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
            <defs>
              <radialGradient id="pullG" cx="50%" cy="50%" r="50%">
                <stop offset="0" stopColor="rgba(255,255,255,0.5)" />
                <stop offset="1" stopColor="rgba(0,0,0,0)" />
              </radialGradient>
            </defs>
            {/* o ponto que puxa */}
            {f >= pullAt ? (
              <g opacity={P(f, pullAt, 20)}>
                <circle cx={1820} cy={420} r={120 + 60 * Math.sin(f / 4)} fill="url(#pullG)" />
                {Array.from({ length: 30 }).map((_, k) => {
                  const y = 120 + k * 22;
                  const t = ((f * 30 + k * 97) % 1600) / 1600;
                  return <line key={k} x1={1820 - (1 - t) * 1700} x2={1820 - (1 - t) * 1700 + 120} y1={y + (420 - y) * t} y2={y + (420 - y) * t} stroke="rgba(242,240,247,0.25)" strokeWidth={2} />;
                })}
              </g>
            ) : null}
            <g transform={`translate(${X0} ${Y0}) scale(${S * stretch} ${S / Math.sqrt(stretch)})`}>
              <ShipProfile stroke="rgba(159,230,255,0.6)" fill="rgba(159,230,255,0.04)" w={1.4} />
              {CORR.map((c, i) => (
                <line key={i} x1={c.x0} x2={c.x0 + c.w} y1={c.y} y2={c.y} stroke={ICE} strokeWidth={2} opacity={c.gone < corrGone ? (rnd(f + i) > 0.7 ? 0.4 : 0) : 0.8} />
              ))}
              {DOORS.map((d, i) => {
                const j = (i + 3) % DOORS.length;
                const tx = d.x + (DOORS[j].x - d.x) * swap;
                const ty = d.y + (DOORS[j].y - d.y) * swap - Math.sin(swap * Math.PI) * 30;
                return <rect key={i} x={tx - 6} y={ty - 10} width={12} height={20} fill={i % 2 ? CREAM : ORANGE} opacity={P(f, doorsAt - 20, 10)} />;
              })}
            </g>
          </svg>
          {/* rádio virando ruído */}
          <div style={{ position: "absolute", left: 80, bottom: 80, width: 560, height: 120, padding: "10px 16px", background: "rgba(4,8,6,0.8)", border: `1px solid ${f >= radioAt ? RED : GREEN}`, borderRadius: 10, opacity: P(f, radioAt - 20, 10) }}>
            <div style={{ fontFamily: MONO, fontSize: 14, letterSpacing: 4, color: f >= radioAt ? RED : GREEN }}>{f >= radioAt + 30 ? "KLEINER · SÓ RUÍDO" : "KLEINER"}</div>
            <svg width={528} height={80}>
              <polyline
                points={Array.from({ length: 132 })
                  .map((_, i) => {
                    const noise = P(f, radioAt, 30);
                    const v = Math.sin(i * 0.5 + f * 0.4) * 18 * (1 - noise) + (rnd(i * 7 + f * 13) - 0.5) * 70 * noise;
                    return `${i * 4},${(40 + v).toFixed(1)}`;
                  })
                  .join(" ")}
                fill="none"
                stroke={f >= radioAt ? RED : GREEN}
                strokeWidth={2}
              />
            </svg>
          </div>
          {/* medidor de fase da Mossman */}
          {f >= mossAt - 10 ? (
            <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: P(f, mossAt - 10, 10) }}>
              <g transform="translate(1560 860)">
                <path d="M -170 0 A 170 170 0 0 1 120 -120" fill="none" stroke="rgba(242,240,247,0.3)" strokeWidth={14} />
                <path d="M 120 -120 A 170 170 0 0 1 170 0" fill="none" stroke={RED} strokeWidth={14} />
                <line x1={0} y1={0} x2={Math.sin(((gauge - 90) * Math.PI) / 180) * 160} y2={-Math.cos(((gauge - 90) * Math.PI) / 180) * 160} stroke={gauge > 90 ? RED : CREAM} strokeWidth={6} strokeLinecap="round" />
                <circle r={12} fill={TXT} />
                <text y={44} textAnchor="middle" fill={gauge > 90 ? RED : ICE} fontFamily={MONO} fontSize={18} letterSpacing={4}>
                  {gauge > 120 ? "FORA DA ESCALA" : gauge > 90 ? "NÃO É UMA FASE NORMAL" : "ESCALA DE FASE · MOSSMAN"}
                </text>
              </g>
            </svg>
          ) : null}
          <div style={{ position: "absolute", left: 80, top: 60, fontFamily: MONO, letterSpacing: 6 }}>
            <div style={{ fontSize: 20, color: f >= shakeAt ? RED : ICE }}>{f >= farAt ? "ALGO PUXA O NAVIO MUITO MAIS LONGE" : f >= shakeAt ? "O BOREALIS INTEIRO TREME" : "A MAIOR MUDANÇA DESDE QUE ENTRARAM"}</div>
            <div style={{ fontSize: 15, color: "rgba(242,240,247,0.6)", marginTop: 6 }}>{f >= doorsAt ? "PORTAS TROCAM DE LUGAR" : f >= corrAt ? "CORREDORES DESAPARECEM" : ""}</div>
          </div>
        </AbsoluteFill>
      ) : null}
      {/* O GRANDE SALTO (08/10, pedido dele: nada de texto preto que vira branco): o ponto para onde o corredor era
          puxado estoura do centro — riscos de luz saindo para fora, o branco toma a tela e se desfaz no corredor */}
      {f >= jumpAt && f < jumpAt + 30 ? (
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <defs>
            <radialGradient id="jumpBurst" cx="50%" cy="50%" r="50%">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="0.55" stopColor="#e9f6ff" />
              <stop offset="1" stopColor="rgba(159,230,255,0)" />
            </radialGradient>
          </defs>
          {Array.from({ length: 64 }).map((_, k) => {
            const a = (k / 64) * Math.PI * 2 + rnd(k) * 0.08;
            const t = Math.min(1, (f - jumpAt) / 10);
            const r0 = 60 + 900 * t * (0.6 + 0.4 * rnd(k * 3));
            const r1 = r0 + 260 + 400 * rnd(k * 5);
            return <line key={k} x1={960 + Math.cos(a) * r0} y1={540 + Math.sin(a) * r0} x2={960 + Math.cos(a) * r1} y2={540 + Math.sin(a) * r1} stroke="#eaf8ff" strokeWidth={2 + 3 * rnd(k * 7)} opacity={(1 - P(f, jumpAt + 6, 14)) * 0.9} />;
          })}
          <circle cx={960} cy={540} r={40 + 1500 * P(f, jumpAt, 7)} fill="url(#jumpBurst)" opacity={1 - P(f, jumpAt + 8, 20)} />
        </svg>
      ) : null}
      {/* o corredor depois do salto: o homem de terno passa no fundo */}
      {f >= playerAt ? (
        <AbsoluteFill style={{ opacity: P(f, playerAt, 12) }}>
          <RoomView e={e} L={L} f={f} faces={faces} />
          {c0 && c2 && f >= gmanAt - 20 ? (
            // sem mostrar o personagem: a porta acende em contraluz, uma sombra comprida escorre pelo chão até a câmera e
            // a silhueta dele (terno, maleta) recortada na luz; em "todo mundo sabe quem é" a luz apaga de uma vez
            (() => {
              const w = Math.max(10, (proj(e, [1.3, 24, 0])?.x ?? c0.x) - c0.x);
              const h = Math.max(10, c0.y - c2.y);
              const on = P(f, gmanAt - 20, 14) * (1 - P(f, whoAt + 20, 3));
              const flick = 0.92 + 0.08 * Math.sin(f * 0.9) * Math.sin(f * 0.37);
              const sw = Math.sin((f - gmanAt) / 9) * 2.5;
              return (
                <>
                  <div style={{ position: "absolute", left: c0.x, top: c2.y, width: w, height: h, opacity: on * flick, background: "linear-gradient(180deg, #dfe8ef 0%, #f6f1e6 60%, #c9d3da 100%)", boxShadow: "0 0 80px 30px rgba(220,232,240,0.35)" }} />
                  <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: on }}>
                    <defs>
                      <linearGradient id="gmshadow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stopColor="#000" stopOpacity="0.85" />
                        <stop offset="1" stopColor="#000" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d={`M ${c0.x + w * 0.38} ${c0.y} L ${c0.x + w * 0.62} ${c0.y} L ${960 + 160} 1080 L ${960 - 160} 1080 Z`} fill="url(#gmshadow)" />
                  </svg>
                  {/* 12/10 (pedido dele: não só a maleta): a silhueta inteira dele parada no vão aceso, de terno, a maleta
                      na mão — recortada pela luz, sem rosto */}
                  {(() => {
                    const sh = h * 0.8;
                    const sw2 = (sh * 337) / 908;
                    return (
                      <div style={{ position: "absolute", left: c0.x + w * 0.52 - sw2 / 2 + sw * 0.4, top: c0.y - sh, width: sw2, height: sh, opacity: on, filter: "drop-shadow(0 0 6px rgba(230,240,248,0.55))" }}>
                        <div style={{ position: "absolute", inset: 0, WebkitMaskImage: `url(${staticFile("hl3silh/gman_silh.png")})`, maskImage: `url(${staticFile("hl3silh/gman_silh.png")})`, WebkitMaskSize: "100% 100%", maskSize: "100% 100%", background: "#060708" }} />
                      </div>
                    );
                  })()}
                </>
              );
            })()
          ) : null}
          {f >= caseAt && c0 && c2 ? (
            <div style={{ position: "absolute", left: c0.x + 30, top: c2.y - 46, fontFamily: MONO, fontSize: 18, letterSpacing: 4, color: CREAM, opacity: P(f, caseAt, 8) }}>{f >= whoAt ? "TODO MUNDO SABE QUEM É" : "TERNO · MALETA"}</div>
          ) : null}
          <Hud f={f} yaw={e.yaw} eye={e} blips={f >= gmanAt - 20 && f < whoAt + 20 ? [{ x: 0, y: 25, hot: true }] : []} msg={f >= gmanAt - 20 ? "CONTATO NÃO IDENTIFICADO" : undefined} msgCol={CREAM} />
        </AbsoluteFill>
      ) : null}
      <AbsoluteFill style={{ background: "#000", opacity: fade(f, life), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- depois do salto
type AJ = { life: number; blackAt?: number; backAt?: number; kneelAt?: number; breathAt?: number; upAt?: number; fineAt?: number; changedAt?: number };
const REBOOT = ["H.E.V. · REINICIANDO", "SINAIS VITAIS ....... OK", "LOCALIZAÇÃO ........ BOREALIS · FASE ?", "EQUIPE ............. 4"];
export const HLRAfterJump: React.FC<AJ> = (p) => {
  const f = useCurrentFrame();
  const a = (v?: number) => v ?? 1e9;
  const [blackAt, backAt, kneelAt, breathAt, upAt, fineAt, changedAt] = [p.blackAt, p.backAt, p.kneelAt, p.breathAt, p.upAt, p.fineAt, p.changedAt].map(a);
  const life = p.life;
  // 11/10 (pedido dele: corredor feio do estilo antigo): o corredor do Borealis do padrão novo (o do piloto)
  const faces = useMemo(() => buildShipHall2(30), []);
  void buildShipCorridor;
  const hallL: XL[] = [1.5, 4.5, 7.5, 10.5, 13.5, 16.5].map((ly) => ({ x: 0, y: ly, z: 2.9, col: [255, 232, 196] as RGB, k: 0.95, r: 4.6 }));
  const view = P(f, backAt, 14);
  const e: Eye = { x: -0.6, y: 4.2, z: 1.7 - 0.25 * (1 - P(f, upAt, 30)), yaw: 0.12, pitch: -0.1, F: 900 };
  const L: Lights = { flash: 0.65, lamps: 0.25, red: 0.25, strobe: 0 };
  const pulse = interpolate(f, [kneelAt, breathAt + 20, fineAt], [148, 120, 84], C);
  const changed = P(f, changedAt, 16);
  const tagCol = changed > 0.5 ? "#e8f2ff" : ORANGE;
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      {/* 08/10 (pedido dele): só apaga NA PALAVRA "apaga". Antes disso: logo depois do salto — o clarão se dissipando,
          a câmera tonta e fora de foco no corredor; perto do "apaga" a imagem falha duas vezes e corta para o preto */}
      {f < blackAt ? (() => {
        const sh = interpolate(f, [0, blackAt], [1, 0.45], C);
        const ePre: Eye = { x: -0.6 + 0.12 * Math.sin(f / 5) * sh, y: 4.2, z: 1.55 + 0.06 * Math.sin(f / 7), yaw: 0.25 + 0.09 * Math.sin(f / 9) * sh, pitch: -0.12 + 0.05 * Math.sin(f / 6) * sh, F: 900 };
        const drop = blackAt - f < 10 && Math.floor(f / 2) % 2 === 0;
        return (
          <AbsoluteFill style={{ opacity: drop ? 0.15 : 1 }}>
            <AbsoluteFill style={{ filter: `blur(${interpolate(f, [0, blackAt], [10, 3], C)}px) brightness(${interpolate(f, [0, blackAt], [1.8, 0.8], C)})` }}>
              <XView e={ePre} faces={faces} lights={hallL} flash={0.35} amb={0.13} seam="rgba(0,0,0,0.18)" />
            </AbsoluteFill>
            <AbsoluteFill style={{ background: "#fff", opacity: interpolate(f, [0, 24], [0.85, 0.1], C), pointerEvents: "none" }} />
            <Hud f={f} yaw={ePre.yaw} eye={ePre} blips={[]} o={0.5 + 0.4 * (Math.floor(f / 3) % 2)} msg="SINAIS VITAIS · INSTÁVEIS" msgCol={RED} />
          </AbsoluteFill>
        );
      })() : null}
      {/* preto + reinício do HEV */}
      {/* 08/10 (pedido dele): as linhas do reinício ficam na tela até o fim da voz do HEV (≈5,6 s) e saem devagar (1 s) */}
      {f < blackAt + 6 + 200 ? (
        <div style={{ position: "absolute", left: 120, top: 380, zIndex: 5, fontFamily: MONO, fontSize: 26, lineHeight: 1.7, color: AMB, textShadow: "0 2px 12px #000", opacity: P(f, blackAt + 6, 8) * (1 - P(f, blackAt + 6 + 168, 30)) }}>
          {REBOOT.map((l, i) => (
            <div key={i}>{l.slice(0, Math.max(0, Math.floor((f - blackAt - 6 - i * 6) * 2.2)))}</div>
          ))}
        </div>
      ) : null}
      {view > 0 ? (
        <AbsoluteFill style={{ opacity: view }}>
          <XView e={e} faces={faces} lights={hallL} flash={0.35} amb={0.13} seam="rgba(0,0,0,0.18)" />
          {/* a Alyx no corredor: o crachá dela (ajoelhada → de pé) */}
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
            <XMarker e={e} x={0.7} y={9.0} label="ALYX" col={tagCol} f={f} sub={f >= fineAt ? "“TÔ BEM.”" : f >= upAt ? "DE PÉ" : f >= kneelAt ? "AJOELHADA" : undefined} />
          </svg>
          <div style={{ position: "absolute", right: 90, top: 140, width: 440, padding: "16px 20px", background: "rgba(8,10,12,0.8)", border: `1px solid ${tagCol}`, borderRadius: 10, opacity: P(f, kneelAt, 10) }}>
            <div style={{ fontFamily: MONO, fontSize: 15, letterSpacing: 4, color: tagCol }}>ALYX · SINAIS</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
              <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 64, color: TXT }}>{Math.round(pulse)}</span>
              <span style={{ fontFamily: MONO, fontSize: 16, color: "rgba(242,240,247,0.6)" }}>BPM</span>
            </div>
            <svg width={400} height={70}>
              <polyline
                points={Array.from({ length: 100 })
                  .map((_, i) => {
                    const per = Math.max(8, Math.round(1800 / pulse));
                    const ph = (i + Math.floor(f * (pulse / 60) * 0.5)) % per;
                    const y = 35 + (ph === 3 ? -28 : ph === 4 ? 22 : ph === 5 ? -8 : 0) + (f >= breathAt ? Math.sin((i + f) / 14) * 4 : 0);
                    return `${i * 4},${y}`;
                  })
                  .join(" ")}
                fill="none"
                stroke={GREEN}
                strokeWidth={2.5}
              />
            </svg>
            {f >= breathAt ? <div style={{ fontFamily: MONO, fontSize: 15, letterSpacing: 3, color: GREEN }}>RESPIRAÇÃO FUNDA</div> : null}
            {changed > 0 ? <div style={{ marginTop: 8, fontFamily: MONO, fontSize: 15, letterSpacing: 3, color: "#e8f2ff", opacity: changed }}>ASSINATURA ALTERADA</div> : null}
          </div>
          {f >= changedAt - 10 ? <div style={{ position: "absolute", left: 0, right: 0, bottom: 170, textAlign: "center", fontFamily: MONO, fontSize: 20, letterSpacing: 6, color: "#e8f2ff", textShadow: "0 2px 10px #000", opacity: P(f, changedAt - 10, 10) }}>ALGUMA COISA MUDOU NELA</div> : null}
          {changed > 0 && f < changedAt + 10 ? <AbsoluteFill style={{ background: `rgba(232,242,255,${0.12 * (1 - (f - changedAt) / 10)})`, pointerEvents: "none" }} /> : null}
          <Hud f={f} yaw={e.yaw} eye={e} blips={[{ x: 0.9, y: 10 }]} o={0.9} />
        </AbsoluteFill>
      ) : null}
      <AbsoluteFill style={{ background: "#000", opacity: fade(f, life), pointerEvents: "none" }} />
      <FilmLook />
    </AbsoluteFill>
  );
};
