import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, random, staticFile, useCurrentFrame } from "remotion";
import { BgClip, BODY, Coins, Cursor, DLP, Grain, HAND, Halftone, Marker, POSTER, Souls, Slam, Stamp, Vignette, back, clamp, ease, fl, img, outF, punchZ, shake } from "./MG2";
import { CREAM, INK, SOUL, SPIRIT, TEAL } from "./MG2";

// "Magia do Deadlock" (07/11): ele reprovou as cenas de card só com texto ("simples, com esses cards, e só texto… falta
// de esforço") no vídeo inteiro. Cada fala ganha uma cena encenada com material real, no nível do caderno (MGHomework):
// HUD do LoL com retratos oficiais (ddragon), placar do Deadlock com cards e itens reais, foto do Gabe (Commons),
// PS5 real, logos oficiais (Steam/Epic/GOG/Marvel/Valve/YouTube/TikTok/lambda), sede da NetEase (Commons).
// Zona segura do TikTok: conteúdo entre y 180 e 1290; nada importante à direita de 930 entre y 700 e 1550.

const LOL = (n: string) => img(`lol/${n}.png`);
const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const lerp = (f: number, a: number, b: number, x: number, y: number, e = Easing.inOut(Easing.cubic)) => interpolate(f, [a, b], [x, y], { ...clamp, easing: e });

// =====================================================================================================================
// 2:20 "a partir dos 5 a 10 minutos… já não tem o que você fazer… depende do time": HUD do LoL com o relógio correndo
// 05:00 → 10:00, o placar abrindo e a diferença de ouro despencando; no "depende do time" sobe a votação de rendição
// com os retratos reais: você (Varus) vota não, os outros quatro votam sim.
// =====================================================================================================================
export const MGSurrender: React.FC<{ life: number; runAt: number; doneAt: number; teamAt: number }> = ({ life, runAt, doneAt, teamAt }) => {
  const f = useCurrentFrame();
  const sec = f < runAt ? 296 + f / 30 : f < doneAt ? lerp(f, runAt, doneAt, 300, 600, Easing.in(Easing.quad)) : 600 + (f - doneAt) / 30;
  const blue = Math.floor(lerp(f, runAt, doneAt, 2, 4));
  const red = Math.floor(lerp(f, runAt, doneAt, 3, 21, Easing.in(Easing.quad)));
  const gray = ease(f, doneAt, 14) * 0.85;
  const hud = back(f, 0, 12, 1.3);
  const N = 48;
  const prog = lerp(f, runAt, doneAt, 0, 1, Easing.linear);
  const val = (i: number) => {
    const t = i / (N - 1);
    return -8400 * Math.pow(t, 1.7) + (random(`gd${i}`) - 0.5) * 900 * (1 - t * 0.4) + 300 * (1 - t);
  };
  const shown = Math.max(2, Math.floor(prog * (N - 1)) + 1);
  const GW = 860, GH = 300, GX = 30;
  const px = (i: number) => GX + (i / (N - 1)) * (GW - GX - 30);
  const py = (v: number) => 40 + ((2000 - v) / 11000) * (GH - 60);
  const pts = Array.from({ length: shown }, (_, i) => `${px(i)},${py(val(i))}`);
  const cur = Math.round(val(shown - 1) / 100) * 100;
  const sh = shake(f, doneAt, 16, 10, "gd");
  const vote = interpolate(f, [teamAt - 2, teamAt + 10], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.2)) });
  const team = [
    { c: "Varus", you: true, d: 4 },
    { c: "Yasuo", d: 8 },
    { c: "LeeSin", d: 12 },
    { c: "Lux", d: 16 },
    { c: "Thresh", d: 20 },
  ];
  const resAt = teamAt + 28;
  const z = 1 + interpolate(f, [0, life], [0, 0.05], clamp) + punchZ(f, [doneAt, resAt], 0.05, 9);
  return (
    <AbsoluteFill style={{ background: "#010a13", overflow: "hidden", opacity: outF(f, life, 3) }}>
      <AbsoluteFill style={{ transform: `scale(${1.06 + f * 0.0004})`, filter: `grayscale(${gray})` }}>
        <BgClip clip="lol_b" ss={60} life={life} blur={5} dim={0.42} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(1,10,19,0.75) 0%, rgba(1,10,19,0.2) 40%, rgba(1,10,19,0.85) 100%)" }} />
      <div style={{ position: "absolute", inset: 0, transform: `translate(${sh.x}px, ${sh.y}px) scale(${z})`, transformOrigin: "50% 40%" }}>
        {/* HUD do topo: abates e relógio */}
        <div style={{ position: "absolute", left: 160, width: 760, top: 200, height: 120, transform: `translateY(${(1 - hud) * -220}px)`, display: "flex", alignItems: "stretch",
          background: "linear-gradient(180deg, #0a1428, #010a13)", border: "3px solid #c8aa6e", borderRadius: 8, boxShadow: "0 20px 50px rgba(0,0,0,0.7)" }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 14 }}>
            <Img src={LOL("Varus")} style={{ width: 70, height: 70, borderRadius: 35, border: "3px solid #2c8cff" }} />
            <div style={{ fontFamily: POSTER, fontSize: 76, color: "#4aa3ff", lineHeight: 1 }}>{blue}</div>
          </div>
          <div style={{ width: 230, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderLeft: "2px solid #463714", borderRight: "2px solid #463714" }}>
            <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 64, color: f >= runAt && f < doneAt ? "#f0e6d2" : "#c8aa6e", letterSpacing: 2, fontVariantNumeric: "tabular-nums" }}>{fmt(sec)}</div>
          </div>
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 14 }}>
            <div style={{ fontFamily: POSTER, fontSize: 76, color: "#ff4d4d", lineHeight: 1, transform: `scale(${1 + punchZ(f, [doneAt], 0.4, 8)})` }}>{red}</div>
            <svg width={56} height={56} viewBox="0 0 24 24"><path d="M3 21 L21 3 M15 3 h6 v6 M5 13 l6 6" stroke="#ff4d4d" strokeWidth={2.6} fill="none" strokeLinecap="round" /></svg>
          </div>
        </div>
        {/* diferença de ouro despencando */}
        <div style={{ position: "absolute", left: 80, width: GW + 40, top: 370, height: GH + 110, opacity: ease(f, 4, 10), transform: `translateY(${(1 - ease(f, 4, 12)) * 60}px)`,
          background: "rgba(1,10,19,0.82)", border: "2px solid #463714", borderRadius: 10, padding: "16px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 26, height: 26, borderRadius: 13, background: "radial-gradient(circle at 35% 30%, #ffe08a, #c8961e 60%, #7a5a0e)" }} />
              <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 30, color: "#c8aa6e", letterSpacing: 3 }}>OURO DO TIME</div>
            </div>
            <div style={{ fontFamily: POSTER, fontSize: 64, lineHeight: 1, color: cur < -2000 ? "#ff4d4d" : "#f0e6d2", transform: `scale(${1 + punchZ(f, [doneAt], 0.35, 9)})`, transformOrigin: "100% 50%" }}>
              {cur > 0 ? "+" : cur < 0 ? "−" : ""}{(Math.abs(cur) / 1000).toFixed(1).replace(".", ",")} mil
            </div>
          </div>
          <svg width={GW} height={GH} style={{ marginTop: 8 }}>
            <line x1={GX} x2={GW - 30} y1={py(0)} y2={py(0)} stroke="rgba(240,230,210,0.35)" strokeWidth={3} strokeDasharray="10 8" />
            {[0, 1, 2, 3, 4, 5].map((k) => <text key={k} x={GX + (k / 5) * (GW - GX - 30)} y={GH - 4} fill="#a09b8c" fontFamily={BODY} fontWeight={800} fontSize={24} textAnchor="middle">{`${5 + k}:00`}</text>)}
            <defs><linearGradient id="gdf" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#ff4d4d" stopOpacity={0} /><stop offset="1" stopColor="#ff4d4d" stopOpacity={0.45} /></linearGradient></defs>
            <path d={`M${px(0)},${py(0)} L${pts.join(" L")} L${px(shown - 1)},${py(0)} Z`} fill="url(#gdf)" />
            <polyline points={pts.join(" ")} fill="none" stroke="#ff4d4d" strokeWidth={7} strokeLinejoin="round" strokeLinecap="round" style={{ filter: "drop-shadow(0 0 10px #ff4d4d)" }} />
            <circle cx={px(shown - 1)} cy={py(val(shown - 1))} r={13} fill="#fff" />
          </svg>
        </div>
        {/* votação de rendição */}
        {f >= teamAt - 2 ? (
          <div style={{ position: "absolute", left: 80, width: 920, top: 830, height: 400, transform: `translateY(${(1 - vote) * 700}px)`, background: "linear-gradient(180deg, #0a1428f2, #010a13f2)",
            border: "3px solid #c8aa6e", borderRadius: 10, boxShadow: "0 30px 80px rgba(0,0,0,0.8)", padding: "22px 26px" }}>
            <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 36, color: "#f0e6d2", letterSpacing: 3, textAlign: "center" }}>VOTAÇÃO DE RENDIÇÃO</div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 26, padding: "0 6px" }}>
              {team.map((m) => {
                const at = teamAt + m.d;
                const v = back(f, at, 8, 2.2);
                const yes = !m.you;
                return (
                  <div key={m.c} style={{ position: "relative", width: 150, display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{ width: 140, height: 140, borderRadius: 70, overflow: "hidden", border: `5px solid ${m.you ? SPIRIT : "#785a28"}`, boxShadow: m.you ? `0 0 30px ${SPIRIT}88` : undefined }}>
                      <Img src={LOL(m.c)} style={{ width: "100%", height: "100%", filter: f >= at ? undefined : "brightness(0.55)" }} />
                    </div>
                    {f >= at ? (
                      <div style={{ position: "absolute", left: 88, top: 86, width: 64, height: 64, borderRadius: 32, background: yes ? "#1fa35b" : "#d13b3b", border: "4px solid #010a13", transform: `scale(${v})`,
                        display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <svg width={36} height={36} viewBox="0 0 24 24">{yes ? <path d="M4 12 L10 18 L20 6" stroke="#fff" strokeWidth={3.4} fill="none" strokeLinecap="round" strokeLinejoin="round" /> : <path d="M6 6 L18 18 M18 6 L6 18" stroke="#fff" strokeWidth={3.4} strokeLinecap="round" />}</svg>
                      </div>
                    ) : null}
                    {m.you ? <div style={{ marginTop: 14, background: SPIRIT, color: "#14091f", fontFamily: BODY, fontWeight: 900, fontSize: 26, padding: "4px 16px", borderRadius: 18 }}>você</div> : null}
                  </div>
                );
              })}
            </div>
            {/* barra de votos */}
            <div style={{ display: "flex", gap: 8, marginTop: 30, height: 26 }}>
              {team.map((m) => <div key={m.c} style={{ flex: 1, borderRadius: 4, background: f >= teamAt + m.d ? (m.you ? "#d13b3b" : "#1fa35b") : "#1e2328" }} />)}
            </div>
          </div>
        ) : null}
        {f >= resAt ? (
          <div style={{ position: "absolute", left: 0, right: 0, top: 700, display: "flex", justifyContent: "center" }}>
            <Stamp text="rendição 4 × 1" at={resAt} size={96} rot={-5} c="#ff5338" />
          </div>
        ) : null}
      </div>
      <Vignette o={0.6} />
      <Grain o={0.06} />
      <AbsoluteFill style={{ background: "#fff", opacity: Math.max(fl(f, doneAt, doneAt + 6, 0.3), fl(f, resAt + 5, resAt + 10, 0.25)), pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};

// =====================================================================================================================
// 3:09 "tô atrás, consigo virar top de alma ou pau a pau com quem tá matando 10, 12… não ficar atrás de itens":
// placar do Deadlock (cards oficiais): você começa em último e sobe linha por linha até o topo com as almas rolando;
// no "matando" o Apollo de 12 abates acende do lado; nos "itens" as duas fileiras de itens reais se completam iguais.
// =====================================================================================================================
type Row = { h: string; n: string; k: number; d: number; s: number };
export const MGSoulBoard: React.FC<{ life: number; behindAt: number; topAt: number; killAt: number; itemsAt: number }> = ({ life, behindAt, topAt, killAt, itemsAt }) => {
  const f = useCurrentFrame();
  const others: Row[] = [
    { h: "Apollo", n: "xX_Matador", k: 12, d: 1, s: 31.5 },
    { h: "Celeste", n: "celeste.main", k: 7, d: 3, s: 24.1 },
    { h: "Baba", n: "babayaga", k: 3, d: 5, s: 19.8 },
    { h: "Mo_Krill", n: "krillin", k: 4, d: 6, s: 17.2 },
    { h: "Nurse_Harrow", n: "enfermeira", k: 1, d: 7, s: 14.6 },
  ];
  const climb = lerp(f, topAt, topAt + 34, 5, 0);
  const souls = f < topAt ? 9.8 : lerp(f, topAt, topAt + 34, 9.8, 31.6, Easing.out(Easing.quad));
  const myK = Math.round(lerp(f, topAt, topAt + 34, 2, 5));
  const head = back(f, 0, 12, 1.2);
  const ROWH = 112, Y0 = 330;
  const killHi = f >= killAt ? 0.6 + 0.4 * Math.sin((f - killAt) / 4) : 0;
  const items = ["Rapid_Rounds", "Monster_Rounds", "Extra_Health", "Mystic_Burst", "Kinetic_Dash", "Toxic_Bullets"];
  const theirs = ["Headshot_Booster", "Active_Reload", "Extra_Stamina", "Bullet_Lifesteal", "Sprint_Boots", "Infuser"];
  const rotY = interpolate(f, [0, life], [-7, 5], clamp);
  const RowBox: React.FC<{ r: Row; y: number; you?: boolean; sv: number; k: number }> = ({ r, y, you, sv, k }) => {
    const glow = you ? 1 : r.h === "Apollo" ? killHi : 0;
    return (
      <div style={{ position: "absolute", left: 0, top: y, width: 920, height: ROWH - 12, display: "flex", alignItems: "center", gap: 18, padding: "0 18px", borderRadius: 8,
        background: you ? `linear-gradient(90deg, ${TEAL}, #0d2a26)` : "rgba(13,22,24,0.92)", border: `3px solid ${you ? SOUL : glow > 0 ? `rgba(255,90,74,${glow})` : "rgba(244,231,203,0.12)"}`,
        boxShadow: you ? `0 0 34px ${SOUL}55` : glow > 0 ? `0 0 ${30 * glow}px rgba(255,90,74,${glow * 0.6})` : "0 10px 20px rgba(0,0,0,0.4)", zIndex: you ? 5 : 1 }}>
        <div style={{ width: 76, height: 86, borderRadius: 6, overflow: "hidden", border: `2px solid ${CREAM}55` }}>
          <Img src={staticFile(`${DLP}${r.h}_card.png`)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 12%" }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 34, color: you ? "#fff" : CREAM }}>{r.n}</div>
          <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 22, color: "#8fa6a0", letterSpacing: 2 }}>{r.h.replace(/_/g, " ").toUpperCase()}</div>
        </div>
        <div style={{ width: 150, fontFamily: POSTER, fontSize: 46, color: r.h === "Apollo" && killHi > 0 ? "#ff6a5c" : CREAM, textAlign: "center", transform: `scale(${r.h === "Apollo" ? 1 + punchZ(f, [killAt], 0.4, 8) : 1})` }}>{k}/{r.d}</div>
        <div style={{ width: 210, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10 }}>
          <Img src={img("items/Souls_icon.png")} style={{ width: 40, height: 40 }} />
          <div style={{ fontFamily: POSTER, fontSize: 50, color: SOUL, fontVariantNumeric: "tabular-nums" }}>{sv.toFixed(1).replace(".", ",")}k</div>
        </div>
      </div>
    );
  };
  return (
    <AbsoluteFill style={{ background: INK, overflow: "hidden", opacity: outF(f, life, 3) }}>
      <AbsoluteFill style={{ transform: "scale(1.15)" }}>
        <BgClip clip="raw" ss={140} life={life} blur={12} dim={0.3} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 90% 60% at 50% 45%, ${TEAL}cc 0%, ${INK}ee 75%)` }} />
      <Souls n={14} o={0.55} speed={f >= topAt && f < topAt + 34 ? 2.5 : 1} />
      <AbsoluteFill style={{ perspective: 2000 }}>
        <div style={{ position: "absolute", left: 80, top: 0, width: 920, height: 1920, transform: `rotateY(${rotY}deg) rotateX(3deg) translateY(${(1 - head) * 400}px)`, transformOrigin: "50% 40%", opacity: Math.min(1, head * 1.5) }}>
          {/* cabeçalho do placar */}
          <div style={{ position: "absolute", left: 0, top: 210, width: 920, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Img src={img("dl_logo.png")} style={{ width: 300 }} />
            <div style={{ display: "flex", gap: 0, fontFamily: BODY, fontWeight: 900, fontSize: 24, letterSpacing: 3, color: "#8fa6a0" }}>
              <div style={{ width: 150, textAlign: "center" }}>ABATES</div>
              <div style={{ width: 210, textAlign: "right", paddingRight: 18 }}>ALMAS</div>
            </div>
          </div>
          {others.map((r, b) => {
            const pos = b + Math.min(1, Math.max(0, b + 1 - climb));
            const e = back(f, 3 + b * 2, 10, 1.4);
            return <div key={r.h} style={{ position: "absolute", left: (1 - e) * 600, top: 0, opacity: Math.min(1, e * 2) }}><RowBox r={r} y={Y0 + pos * ROWH} sv={r.s} k={r.k} /></div>;
          })}
          <div style={{ position: "absolute", left: 0, top: 0, transform: `translateX(${(1 - back(f, behindAt + 2, 10, 1.4)) * -700}px)` }}>
            <RowBox r={{ h: "Rat_King", n: "Blies", k: myK, d: 4, s: souls }} y={Y0 + climb * ROWH} you sv={souls} k={myK} />
            {f >= topAt + 30 ? <div style={{ position: "absolute", left: -26, top: Y0 + climb * ROWH - 30, transform: `rotate(-18deg) scale(${back(f, topAt + 30, 8, 2.4)})`, fontSize: 56 }}>👑</div> : null}
          </div>
          {/* itens: os dois completos, ninguém atrás */}
          {f >= itemsAt - 2 ? (
            <div style={{ position: "absolute", left: 0, top: 1030, width: 920, opacity: ease(f, itemsAt - 2, 6) }}>
              {[{ n: "Blies", list: items, c: SOUL, d: 0 }, { n: "xX_Matador", list: theirs, c: "#ff6a5c", d: -100 }].map((row, j) => (
                <div key={row.n} style={{ display: "flex", alignItems: "center", gap: 10, marginTop: j ? 14 : 0 }}>
                  <div style={{ width: 200, fontFamily: BODY, fontWeight: 900, fontSize: 28, color: row.c }}>{row.n}</div>
                  {row.list.map((it, i) => {
                    const at = row.d < 0 ? itemsAt - 2 : itemsAt + 2 + i * 3;
                    const e = back(f, at, 8, 2);
                    return (
                      <div key={it} style={{ width: 104, height: 104, borderRadius: 10, background: "#0d1618", border: `2px solid ${CREAM}33`, overflow: "hidden" }}>
                        {f >= at ? <Img src={img(`items/${it}.png`)} style={{ width: "100%", height: "100%", transform: `scale(${e}) rotate(${(1 - e) * 30}deg)` }} /> : null}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </AbsoluteFill>
      <Vignette o={0.6} />
      <Grain />
      <AbsoluteFill style={{ background: "#fff", opacity: fl(f, topAt + 34, topAt + 40, 0.25), pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};

// =====================================================================================================================
// 3:54 "a Valve é uma empresa privada, o Gabe tem mais da metade e o resto é dos funcionários… nenhum investidor
// ligando pra cobrar": logo da Valve bate, a rosca da sociedade se desenha (fatia do Gabe com a foto real dele no
// centro, fatia dos funcionários em crachás), chega a ligação do "Investidor" e o cursor recusa.
// =====================================================================================================================
export const MGOwner2: React.FC<{ life: number; gabeAt: number; staffAt: number; callAt: number; noAt: number }> = ({ life, gabeAt, staffAt, callAt, noAt }) => {
  const f = useCurrentFrame();
  const CX = 540, CY = 700, RR = 250, SW = 110;
  const g = lerp(f, gabeAt, gabeAt + 18, 0, 0.54);
  const st = lerp(f, staffAt, staffAt + 18, 0, 0.46);
  const arc = (a0: number, a1: number) => {
    const p = (a: number) => `${CX + Math.cos(a * Math.PI * 2 - Math.PI / 2) * RR},${CY + Math.sin(a * Math.PI * 2 - Math.PI / 2) * RR}`;
    if (a1 - a0 <= 0.0001) return "";
    return `M${p(a0)} A${RR},${RR} 0 ${a1 - a0 > 0.5 ? 1 : 0} 1 ${p(Math.min(a1, a0 + 0.9999))}`;
  };
  const photo = back(f, gabeAt + 4, 12, 1.5);
  const ring = interpolate(f, [callAt, callAt + 10], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.3)) });
  const vib = f >= callAt && f < noAt ? Math.sin(f * 2.4) * 7 : 0;
  const gone = lerp(f, noAt + 8, noAt + 20, 0, 1, Easing.in(Easing.quad));
  const declined = f >= noAt;
  const cx = lerp(f, callAt + 8, noAt - 2, 860, 300);
  const cy = lerp(f, callAt + 8, noAt - 2, 1260, 1150);
  const press = interpolate(f, [noAt - 2, noAt, noAt + 3], [0, 1, 0], clamp);
  return (
    <AbsoluteFill style={{ background: "#120c0c", overflow: "hidden", opacity: outF(f, life, 3) }}>
      <AbsoluteFill style={{ transform: "scale(1.2)" }}>
        <Img src={img("gabe.jpg")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "blur(26px) brightness(0.25) saturate(1.2)" }} />
      </AbsoluteFill>
      <Halftone c="#f74843" o={0.05} size={14} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 210, display: "flex", justifyContent: "center" }}>
        <Slam src={img("valve.png")} at={2} w={520} seed="valve" />
      </div>
      {/* rosca */}
      <svg width={1080} height={1100} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <circle cx={CX} cy={CY} r={RR} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={SW} opacity={ease(f, 6, 10)} />
        <path d={arc(0, g)} fill="none" stroke="#f74843" strokeWidth={SW} style={{ filter: "drop-shadow(0 0 20px rgba(247,72,67,0.5))" }} />
        <path d={arc(0.54, 0.54 + st)} fill="none" stroke="#66c0f4" strokeWidth={SW} style={{ filter: "drop-shadow(0 0 20px rgba(102,192,244,0.45))" }} />
        {/* crachás na fatia dos funcionários */}
        {Array.from({ length: 14 }, (_, i) => {
          const a = 0.56 + (i / 14) * 0.42;
          if (a > 0.54 + st) return null;
          const e = back(f, staffAt + 4 + i, 8, 2);
          const x = CX + Math.cos(a * Math.PI * 2 - Math.PI / 2) * RR, y = CY + Math.sin(a * Math.PI * 2 - Math.PI / 2) * RR;
          return (
            <g key={i} transform={`translate(${x},${y}) scale(${e}) rotate(${(random(`bd${i}`) - 0.5) * 30})`}>
              <rect x={-17} y={-22} width={34} height={44} rx={5} fill="#f4f7fa" stroke="#1b2838" strokeWidth={2} />
              <circle cx={0} cy={-6} r={7} fill="#1b2838" /><rect x={-11} y={6} width={22} height={5} rx={2} fill="#1b2838" /><rect x={-11} y={14} width={14} height={3} rx={1.5} fill="#66c0f4" />
            </g>
          );
        })}
      </svg>
      {/* Gabe no centro */}
      {f >= gabeAt + 4 ? (
        <div style={{ position: "absolute", left: CX - 175, top: CY - 175, width: 350, height: 350, borderRadius: 175, overflow: "hidden", transform: `scale(${photo})`, border: "6px solid #f74843", boxShadow: "0 20px 60px rgba(0,0,0,0.7)" }}>
          <Img src={img("gabe.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "28% 30%", transform: `scale(${1.9 + (f - gabeAt) * 0.0015})`, transformOrigin: "28% 30%" }} />
        </div>
      ) : null}
      {/* rótulos com linha */}
      {f >= gabeAt + 10 ? (
        <div style={{ position: "absolute", left: 650, top: 440, transform: `scale(${back(f, gabeAt + 10, 9, 1.8)})`, transformOrigin: "0% 100%", background: "#f74843", padding: "8px 18px", borderRadius: 8, boxShadow: "0 10px 24px rgba(0,0,0,0.5)" }}>
          <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 30, color: "#fff" }}>Gabe Newell</div>
          <div style={{ fontFamily: POSTER, fontSize: 54, color: "#fff", lineHeight: 1 }}>+ DA METADE</div>
        </div>
      ) : null}
      {f >= staffAt + 12 ? (
        <div style={{ position: "absolute", left: 100, top: 900, transform: `scale(${back(f, staffAt + 12, 9, 1.8)})`, transformOrigin: "0% 0%", background: "#66c0f4", padding: "8px 18px", borderRadius: 8, boxShadow: "0 10px 24px rgba(0,0,0,0.5)" }}>
          <div style={{ fontFamily: POSTER, fontSize: 50, color: "#0b141d", lineHeight: 1.05 }}>FUNCIONÁRIOS</div>
        </div>
      ) : null}
      {/* ligação do investidor */}
      {f >= callAt && gone < 1 ? (
        <div style={{ position: "absolute", left: 120, width: 840, top: 1010, transform: `translate(${vib + gone * 1100}px, ${(1 - ring) * 500}px) rotate(${gone * 12}deg)`, borderRadius: 34, background: "rgba(28,28,32,0.96)",
          boxShadow: "0 30px 80px rgba(0,0,0,0.8)", padding: "24px 28px", display: "flex", alignItems: "center", gap: 22, border: "2px solid rgba(255,255,255,0.12)" }}>
          <div style={{ width: 96, height: 96, borderRadius: 48, background: "linear-gradient(135deg, #3b4252, #1c1f26)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width={56} height={56} viewBox="0 0 24 24"><path d="M3 21 V12 L8 8 L13 12 V21 Z M14 21 V5 L21 3 V21 Z" fill="#c9ced8" /><rect x={16} y={7} width={3} height={2} fill="#1c1f26" /><rect x={16} y={11} width={3} height={2} fill="#1c1f26" /></svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 24, color: "#9aa0ab" }}>{declined ? "chamada recusada" : "chamada recebida…"}</div>
            <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 44, color: "#fff" }}>Investidor</div>
          </div>
          <div style={{ display: "flex", gap: 18 }}>
            <div style={{ width: 92, height: 92, borderRadius: 46, background: "#ff3b30", display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${1 - press * 0.15})`, boxShadow: declined ? "0 0 0 8px rgba(255,59,48,0.35)" : undefined }}>
              <svg width={50} height={50} viewBox="0 0 24 24" style={{ transform: "rotate(135deg)" }}><path d="M6.6 10.8 c1.4 2.8 3.8 5.1 6.6 6.6 l2.2-2.2 c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6 .6 0 1 .4 1 1 V20 c0 .6-.4 1-1 1 C10.6 21 3 13.4 3 4 c0-.6.4-1 1-1 h3.5 c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6 .1.3 0 .7-.2 1 Z" fill="#fff" /></svg>
            </div>
            <div style={{ width: 92, height: 92, borderRadius: 46, background: declined ? "#2a2d33" : "#34c759", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width={50} height={50} viewBox="0 0 24 24"><path d="M6.6 10.8 c1.4 2.8 3.8 5.1 6.6 6.6 l2.2-2.2 c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6 .6 0 1 .4 1 1 V20 c0 .6-.4 1-1 1 C10.6 21 3 13.4 3 4 c0-.6.4-1 1-1 h3.5 c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6 .1.3 0 .7-.2 1 Z" fill="#fff" /></svg>
            </div>
          </div>
        </div>
      ) : null}
      {f >= callAt + 8 && f < noAt + 10 ? <Cursor x={cx} y={cy} press={press} /> : null}
      <Vignette o={0.6} />
      <Grain />
    </AbsoluteFill>
  );
};

// =====================================================================================================================
// 4:07 "as desgraças que a Sony vem fazendo com o PlayStation… o dia que tiver emulação de PS5, eu vou vender o meu…
// pra que serve essa porcaria?": PS5 real girando no azul da marca; janela do emulador carregando; anúncio de venda
// do PS5; na "porcaria" o carimbo VENDIDO e o console tomba.
// =====================================================================================================================
export const MGPS5: React.FC<{ life: number; emuAt: number; sellAt: number; junkAt: number }> = ({ life, emuAt, sellAt, junkAt }) => {
  const f = useCurrentFrame();
  const e0 = back(f, 0, 14, 1.2);
  const tip = lerp(f, junkAt, junkAt + 10, 0, 1, Easing.in(Easing.quad));
  const em = back(f, emuAt, 12, 1.3);
  const load = lerp(f, emuAt + 6, sellAt + 4, 0, 1, Easing.out(Easing.quad));
  const sl = back(f, sellAt, 12, 1.4);
  const sh = shake(f, junkAt, 18, 10, "ps5");
  const shapes = ["M0 -14 L13 9 L-13 9 Z", "C", "X", "S"];
  return (
    <AbsoluteFill style={{ background: "#00102e", overflow: "hidden", opacity: outF(f, life, 3) }}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 80% 60% at 40% 45%, #0a52c4 0%, #00205e 45%, #000814 100%)" }} />
      {/* símbolos △○×□ flutuando */}
      {Array.from({ length: 16 }, (_, i) => {
        const x = random(`px${i}`) * 1080, y = 1920 - ((f * (0.8 + random(`pv${i}`)) + random(`py${i}`) * 1920) % 2000);
        const s = 40 + random(`ps${i}`) * 50, k = shapes[i % 4];
        return (
          <svg key={i} width={s} height={s} viewBox="-20 -20 40 40" style={{ position: "absolute", left: x, top: y, opacity: 0.16, transform: `rotate(${f * (i % 2 ? 0.5 : -0.5)}deg)` }}>
            {k === "C" ? <circle r={13} fill="none" stroke="#fff" strokeWidth={3} /> : k === "X" ? <path d="M-12 -12 L12 12 M12 -12 L-12 12" stroke="#fff" strokeWidth={3} /> : k === "S" ? <rect x={-12} y={-12} width={24} height={24} fill="none" stroke="#fff" strokeWidth={3} /> : <path d={k} fill="none" stroke="#fff" strokeWidth={3} />}
          </svg>
        );
      })}
      <div style={{ position: "absolute", inset: 0, transform: `translate(${sh.x}px, ${sh.y}px)` }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 210, display: "flex", justifyContent: "center", opacity: e0 }}>
          <Img src={img("ps5_logo.png")} style={{ width: 520, filter: "invert(1) drop-shadow(0 0 30px rgba(120,170,255,0.6))" }} />
        </div>
        {/* console real */}
        <div style={{ position: "absolute", left: 110, top: 360, height: 820, width: 352, perspective: 1200 }}>
          <div style={{ position: "absolute", left: 40, right: 40, bottom: -18, height: 40, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(0,0,0,0.6), rgba(0,0,0,0))" }} />
          <Img src={img("ps5.png")} style={{ height: 820, transformOrigin: "50% 100%",
            transform: `translateY(${(1 - e0) * 500}px) rotateY(${Math.sin(f / 30) * 14}deg) rotate(${tip * -78}deg)`,
            filter: `drop-shadow(0 30px 50px rgba(0,0,0,0.6)) drop-shadow(0 0 40px rgba(80,140,255,${0.5 * (1 - tip)})) grayscale(${tip}) brightness(${1 - tip * 0.3})` }} />
        </div>
        {/* emulador */}
        {f >= emuAt ? (
          <div style={{ position: "absolute", left: 470, width: 470, top: 420, transform: `translateX(${(1 - em) * 700}px) rotate(2deg)`, borderRadius: 12, overflow: "hidden", background: "#16181d", boxShadow: "0 30px 70px rgba(0,0,0,0.7)", border: "2px solid #2f3540" }}>
            <div style={{ height: 44, background: "#22262e", display: "flex", alignItems: "center", gap: 8, padding: "0 14px" }}>
              {["#ff5f57", "#febc2e", "#28c840"].map((c) => <div key={c} style={{ width: 13, height: 13, borderRadius: 7, background: c }} />)}
              <div style={{ marginLeft: 10, fontFamily: BODY, fontWeight: 800, fontSize: 20, color: "#aab" }}>Emulador de PS5</div>
            </div>
            <div style={{ padding: "22px 22px 26px" }}>
              <div style={{ height: 180, borderRadius: 8, background: "linear-gradient(135deg, #0a52c4, #001a4d)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Img src={img("ps5_logo.png")} style={{ width: 260, filter: "invert(1)", opacity: 0.9 }} />
              </div>
              <div style={{ marginTop: 18, height: 22, borderRadius: 11, background: "#2a2f39", overflow: "hidden" }}>
                <div style={{ width: `${load * 100}%`, height: "100%", background: "linear-gradient(90deg, #3d8bff, #7fd0ff)" }} />
              </div>
              <div style={{ marginTop: 10, fontFamily: BODY, fontWeight: 900, fontSize: 30, color: "#e6ebf5" }}>{load >= 1 ? "pronto ✓" : `carregando… ${Math.round(load * 100)}%`}</div>
            </div>
          </div>
        ) : null}
        {/* anúncio de venda */}
        {f >= sellAt ? (
          <div style={{ position: "absolute", left: 470, width: 450, top: 850, transform: `translateY(${(1 - sl) * 600}px) rotate(-2deg)`, borderRadius: 14, background: "#fff", boxShadow: "0 30px 70px rgba(0,0,0,0.7)", padding: 18 }}>
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <div style={{ width: 120, height: 150, borderRadius: 8, background: "#eef1f6", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                <Img src={img("ps5.png")} style={{ height: 140 }} />
              </div>
              <div>
                <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 22, color: "#8a8f99" }}>Anúncio · usado</div>
                <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 34, color: "#111", lineHeight: 1.1 }}>PlayStation 5</div>
                <div style={{ marginTop: 10, background: "#ffd400", borderRadius: 8, padding: "6px 14px", fontFamily: BODY, fontWeight: 900, fontSize: 26, color: "#111", display: "inline-block" }}>vender agora</div>
              </div>
            </div>
            <div style={{ position: "absolute", left: 40, top: 30 }}><Stamp text="vendido" at={junkAt} size={88} rot={-12} /></div>
          </div>
        ) : null}
      </div>
      <Vignette o={0.55} />
      <Grain />
      <AbsoluteFill style={{ background: "#fff", opacity: fl(f, junkAt + 5, junkAt + 10, 0.3), pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};

// =====================================================================================================================
// 4:31 "do jeito que a Steam fatura, em 2023 ela fez 5 bilhões… uma única empresa… líder de mercado": a Steam bate,
// o contador rola até US$ 5 bi enquanto a nota fiscal sai da impressora com os mais vendidos de 2023; no "única" a
// nota é arrancada; no "líder" sobe o pódio com Steam no 1º, Epic e GOG embaixo.
// =====================================================================================================================
export const MGSteamBi: React.FC<{ life: number; numAt: number; oneAt: number; leadAt: number }> = ({ life, numAt, oneAt, leadAt }) => {
  const f = useCurrentFrame();
  const money = f < numAt ? lerp(f, 6, numAt, 0, 4.9, Easing.in(Easing.quad)) : 5;
  const printed = lerp(f, 8, numAt + 6, 0, 1, Easing.linear);
  const games = ["Counter-Strike 2", "Baldur's Gate 3", "Hogwarts Legacy", "Dota 2", "Apex Legends", "Starfield", "Cyberpunk 2077", "Lethal Company", "ELDEN RING", "PUBG"];
  const tear = lerp(f, oneAt, oneAt + 10, 0, 1, Easing.in(Easing.quad));
  const pod = (k: number) => back(f, leadAt + k * 4, 12, 1.4);
  const sh = shake(f, numAt, 14, 9, "bi");
  const sh2 = shake(f, leadAt + 8, 14, 9, "pod");
  const z = 1 + punchZ(f, [numAt, leadAt + 8], 0.05, 9) + interpolate(f, [0, life], [0, 0.04], clamp);
  return (
    <AbsoluteFill style={{ background: "#0b141d", overflow: "hidden", opacity: outF(f, life, 3) }}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 80% 55% at 50% 35%, #1e4a6e 0%, #171a21 60%, #0b0d12 100%)" }} />
      <Halftone c="#66c0f4" o={0.05} size={12} />
      <div style={{ position: "absolute", inset: 0, transform: `translate(${sh.x + sh2.x}px, ${sh.y + sh2.y}px) scale(${z})`, transformOrigin: "50% 40%" }}>
        <div style={{ position: "absolute", left: 90, top: 200, display: "flex", alignItems: "center", gap: 26 }}>
          <div style={{ width: 170, height: 170, transform: `rotate(${interpolate(f, [0, 20], [-220, 0], { ...clamp, easing: Easing.out(Easing.cubic) })}deg) scale(${back(f, 0, 14, 1.6)})`, filter: "drop-shadow(0 0 30px rgba(102,192,244,0.6))" }}>
            <Img src={img("steam_icon.png")} style={{ width: "100%", height: "100%" }} />
          </div>
          <div>
            <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 30, letterSpacing: 6, color: "#66c0f4", opacity: ease(f, 6, 8) }}>FATURAMENTO · 2023</div>
            <div style={{ fontFamily: POSTER, fontSize: 132, lineHeight: 1, color: f >= numAt ? "#a4d007" : "#fff", textShadow: "0 10px 40px rgba(0,0,0,0.7)", transform: `scale(${1 + punchZ(f, [numAt], 0.25, 9)})`, transformOrigin: "0% 50%" }}>
              US$ {money.toFixed(1).replace(".", ",")} BI
            </div>
          </div>
        </div>
        {/* nota fiscal saindo da impressora */}
        {f < leadAt + 4 ? (
          <div style={{ position: "absolute", left: 190, width: 700, top: 470, opacity: 1 - tear }}>
            <div style={{ height: 60, borderRadius: 14, background: "linear-gradient(180deg, #2a3442, #151b23)", boxShadow: "0 16px 40px rgba(0,0,0,0.7)", position: "relative", zIndex: 2 }}>
              <div style={{ position: "absolute", left: 60, right: 60, bottom: 12, height: 8, borderRadius: 4, background: "#05080c" }} />
            </div>
            <div style={{ margin: "-14px 80px 0", height: 760 * printed, overflow: "hidden", transform: `translateY(${tear * 900}px) rotate(${tear * 14}deg)` }}>
              <div style={{ background: "#f6f3ea", padding: "34px 30px 30px", fontFamily: "'Courier New', monospace", fontWeight: 700, color: "#222", minHeight: 760,
                WebkitMaskImage: "linear-gradient(180deg, #000 96%, transparent)", position: "relative", top: (1 - printed) * 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "center" }}>
                  <Img src={img("steam_icon.png")} style={{ width: 46, filter: "grayscale(1) brightness(0.3)" }} />
                  <div style={{ fontSize: 34, letterSpacing: 4 }}>STEAM</div>
                </div>
                <div style={{ fontSize: 20, textAlign: "center", marginTop: 4, color: "#666" }}>MAIS VENDIDOS · 2023</div>
                <div style={{ borderTop: "3px dashed #999", margin: "14px 0" }} />
                {games.map((gm, i) => (
                  <div key={gm} style={{ display: "flex", justifyContent: "space-between", fontSize: 25, lineHeight: "44px" }}>
                    <span>{gm}</span><span style={{ color: "#3a7d0a" }}>✓</span>
                  </div>
                ))}
                <div style={{ borderTop: "3px dashed #999", margin: "14px 0" }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 40, fontWeight: 900 }}><span>TOTAL</span><span>US$ 5 BI</span></div>
              </div>
            </div>
          </div>
        ) : null}
        {/* uma única empresa: anel na Steam */}
        {f >= oneAt && f < leadAt ? (
          <div style={{ position: "absolute", left: 60, top: 170 }}><Marker at={oneAt + 2} w={230} h={230} c="#a4d007" /></div>
        ) : null}
        {/* pódio */}
        {f >= leadAt ? (
          <div style={{ position: "absolute", left: 90, width: 900, top: 560, height: 700 }}>
            {[{ logo: "epic.png", x: 0, h: 300, k: 1, n: "2", w: 150, inv: false }, { logo: "steam_icon.png", x: 300, h: 450, k: 2, n: "1", w: 220, inv: false }, { logo: "gog.png", x: 600, h: 210, k: 0, n: "3", w: 140, inv: true }].map((p) => {
              const e = pod(p.k);
              return (
                <div key={p.logo} style={{ position: "absolute", left: p.x, bottom: 0, width: 300 }}>
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: 18, transform: `translateY(${(1 - e) * -600}px) scale(${p.n === "1" ? 1 + punchZ(f, [leadAt + 8], 0.15, 9) : 1})` }}>
                    <div style={{ background: p.inv ? "#f2f2f2" : undefined, borderRadius: 12, padding: p.inv ? 10 : 0 }}><Img src={img(p.logo)} style={{ width: p.w, filter: p.n === "1" ? "drop-shadow(0 0 40px rgba(102,192,244,0.8))" : "drop-shadow(0 10px 20px rgba(0,0,0,0.6))" }} /></div>
                  </div>
                  <div style={{ height: p.h * e, background: p.n === "1" ? "linear-gradient(180deg, #ffd34d, #b8860b)" : "linear-gradient(180deg, #5d6b7c, #2c3540)", borderRadius: "10px 10px 0 0", boxShadow: "0 -10px 40px rgba(0,0,0,0.5)",
                    display: "flex", justifyContent: "center", paddingTop: 16, overflow: "hidden" }}>
                    <div style={{ fontFamily: POSTER, fontSize: 120, color: p.n === "1" ? "#5a3d00" : "#c8d0da", lineHeight: 1 }}>{p.n}º</div>
                  </div>
                </div>
              );
            })}
            {f >= leadAt + 14 ? <div style={{ position: "absolute", left: 385, top: -150, fontSize: 110, transform: `translateY(${(1 - back(f, leadAt + 14, 10, 2)) * -300}px) rotate(-8deg)` }}>👑</div> : null}
          </div>
        ) : null}
      </div>
      {f >= numAt ? <Coins at={numAt} /> : null}
      <Vignette o={0.55} />
      <Grain />
      <AbsoluteFill style={{ background: "#fff", opacity: Math.max(fl(f, numAt, numAt + 6, 0.3), fl(f, leadAt + 8, leadAt + 13, 0.25)), pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};

// =====================================================================================================================
// 4:53 "não sair em janeiro, fevereiro, como estão especulando… se demorar um ano… vai ficar mais foda": calendário
// de mesa do Deadlock; JAN e FEV com "?" de caneta e os palpites voando; no "ano" as folhas arrancam mês a mês até
// JAN 2028; no "foda" a logo nasce em cima com almas.
// =====================================================================================================================
const MESES = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
export const MGCal2: React.FC<{ life: number; janAt: number; fevAt: number; yearAt: number; fodaAt: number }> = ({ life, janAt, fevAt, yearAt, fodaAt }) => {
  const f = useCurrentFrame();
  // índice da folha: 0 = JAN 2027 … 12 = JAN 2028
  const idx = f < fevAt ? 0 : f < yearAt ? 1 : Math.min(12, 1 + Math.floor((f - yearAt) / 3));
  const flipK = f < yearAt ? (f >= fevAt ? f - fevAt : 99) : (f - yearAt) % 3;
  const e = back(f, 0, 14, 1.2);
  const rumors = [{ t: "sai em janeiro!!", x: 70, y: 1080, r: -6, at: janAt + 10 }, { t: "fevereiro confirmado", x: 520, y: 1140, r: 5, at: janAt + 20 }, { t: "fonte: confia", x: 300, y: 1210, r: -3, at: janAt + 30 }];
  const final = idx === 12;
  const foda = f >= fodaAt;
  const sh = shake(f, fodaAt + 4, 16, 10, "cal");
  const Page: React.FC<{ i: number; style?: React.CSSProperties }> = ({ i, style }) => {
    const m = MESES[i % 12], y = i >= 12 ? 2028 : 2027;
    return (
      <div style={{ position: "absolute", inset: 0, background: "#f8f4ea", borderRadius: "0 0 16px 16px", ...style }}>
        <div style={{ textAlign: "center", fontFamily: POSTER, fontSize: 250, lineHeight: 1, color: i % 12 === 0 && i > 0 ? "#c0392b" : "#1c2422", marginTop: 30 }}>{m}</div>
        <div style={{ textAlign: "center", fontFamily: BODY, fontWeight: 900, fontSize: 52, letterSpacing: 12, color: "#8a7f6a" }}>{y}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 10, padding: "26px 60px 0" }}>
          {Array.from({ length: 31 }, (_, d) => <div key={d} style={{ fontFamily: BODY, fontWeight: 800, fontSize: 30, color: "#5a564c", textAlign: "center" }}>{d + 1}</div>)}
        </div>
      </div>
    );
  };
  return (
    <AbsoluteFill style={{ background: INK, overflow: "hidden", opacity: outF(f, life, 3) }}>
      <AbsoluteFill style={{ transform: "scale(1.2)" }}>
        <Img src={img("dl_hero.jpg")} style={{ position: "absolute", left: -500 - f * 0.4, top: 0, height: 1920, filter: "blur(18px) brightness(0.3)" }} />
      </AbsoluteFill>
      <Souls n={foda ? 26 : 10} o={0.6} speed={foda ? 2.4 : 1} />
      <AbsoluteFill style={{ perspective: 1800 }}>
        <div style={{ position: "absolute", left: 150, width: 780, top: 240, height: 820, transform: `translate(${sh.x}px, ${(1 - e) * 600 + sh.y}px) rotateX(12deg) rotateZ(${interpolate(f, [0, life], [-3, 2], clamp)}deg)`, transformOrigin: "50% 0%" }}>
          {/* cabeçalho com argolas e a logo */}
          <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 120, background: `linear-gradient(180deg, ${TEAL}, #0b2420)`, borderRadius: "16px 16px 0 0", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 20px rgba(0,0,0,0.4)", zIndex: 3 }}>
            <Img src={img("dl_logo.png")} style={{ width: 360, filter: foda ? `drop-shadow(0 0 ${20 + Math.sin(f / 4) * 10}px ${SOUL})` : undefined }} />
            {[120, 260, 520, 660].map((x) => <div key={x} style={{ position: "absolute", left: x - 14, top: -26, width: 28, height: 56, borderRadius: 14, border: "7px solid #b9b4a6", background: "transparent" }} />)}
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 120, bottom: 0, boxShadow: "0 50px 120px rgba(0,0,0,0.75)", borderRadius: "0 0 16px 16px" }}>
            {/* folhas por baixo (espessura) */}
            <div style={{ position: "absolute", left: 6, right: -6, top: 6, bottom: -10, background: "#dcd6c6", borderRadius: "0 0 16px 16px" }} />
            <Page i={idx} />
            {/* folha sendo arrancada */}
            {flipK < 6 && idx > 0 ? (
              <Page i={idx - 1} style={{ transformOrigin: "50% 0%", transform: `rotateX(${-flipK * 30}deg) translateY(${-flipK * 40}px) rotate(${flipK * (idx % 2 ? 4 : -4)}deg)`, opacity: 1 - flipK / 6, boxShadow: "0 20px 40px rgba(0,0,0,0.3)" }} />
            ) : null}
            {/* ? de caneta em JAN e FEV */}
            {idx <= 1 && f >= janAt ? (
              <div style={{ position: "absolute", left: 470, top: 20, transform: `rotate(12deg)` }}>
                <div style={{ fontFamily: HAND, fontWeight: 700, fontSize: 260, color: "#d8352a", lineHeight: 1, clipPath: `inset(0 0 ${100 - interpolate(f, [idx ? fevAt + 4 : janAt, (idx ? fevAt + 4 : janAt) + 8], [0, 100], clamp)}% 0)` }}>?</div>
              </div>
            ) : null}
            {idx >= 1 && idx <= 1 && f >= fevAt + 6 ? <div style={{ position: "absolute", left: 60, top: 40 }}><Marker at={fevAt + 6} w={420} h={260} /></div> : null}
          </div>
        </div>
      </AbsoluteFill>
      {/* palpites voando */}
      {f < yearAt + 6 ? rumors.map((r, i) => {
        if (f < r.at) return null;
        const k = back(f, r.at, 9, 2);
        const out = lerp(f, yearAt, yearAt + 6, 0, 1);
        return (
          <div key={i} style={{ position: "absolute", left: r.x, top: r.y + out * 400, transform: `rotate(${r.r}deg) scale(${k})`, opacity: 1 - out, background: "#fff", borderRadius: 22, padding: "12px 22px", boxShadow: "0 14px 30px rgba(0,0,0,0.5)",
            fontFamily: BODY, fontWeight: 900, fontSize: 34, color: "#111", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 17, background: ["#7b5cff", "#ff8a3d", "#28b6a0"][i] }} />{r.t}
          </div>
        );
      }) : null}
      {final && foda ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 1110, display: "flex", justifyContent: "center" }}>
          <Stamp text="vale a espera" at={fodaAt + 4} size={90} rot={-5} c={SOUL} />
        </div>
      ) : null}
      <Vignette o={0.6} />
      <Grain />
      <AbsoluteFill style={{ background: "#fff", opacity: fl(f, fodaAt + 9, fodaAt + 14, 0.25), pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};

// =====================================================================================================================
// 5:07 "é da NetEase, uma empresa de bolsa que ainda tem licença da Marvel no meio": foto real da sede (placa da
// NetEase), o pregão rodando (NTES, velas, fita de cotação) e no "licença" o contrato com a logo da Marvel bate por cima.
// =====================================================================================================================
export const MGNetEase: React.FC<{ life: number; neAt: number; stockAt: number; licAt: number }> = ({ life, neAt, stockAt, licAt }) => {
  const f = useCurrentFrame();
  const ph = back(f, Math.max(0, neAt - 6), 12, 1.2);
  const ch = back(f, stockAt - 4, 10, 1.3);
  const lic = interpolate(f, [licAt, licAt + 6], [2.2, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  const sh = shake(f, licAt + 6, 16, 9, "lic");
  const N = 22;
  const candle = (i: number) => {
    const base = 100 + Math.sin(i / 2.2) * 12 + (random(`nt${i}`) - 0.5) * 18;
    const o = base, c = base + (random(`nc${i}`) - 0.48) * 22;
    return { o, c, hi: Math.max(o, c) + random(`nh${i}`) * 9, lo: Math.min(o, c) - random(`nl${i}`) * 9 };
  };
  const shown = Math.floor(lerp(f, stockAt - 4, life, 6, N, Easing.linear));
  const yv = (v: number) => 300 - (v - 70) * 4.2;
  return (
    <AbsoluteFill style={{ background: "#0d0b0b", overflow: "hidden", opacity: outF(f, life, 3) }}>
      <AbsoluteFill style={{ transform: "scale(1.2)" }}>
        <Img src={img("netease_office.jpg")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "blur(22px) brightness(0.28)" }} />
      </AbsoluteFill>
      <div style={{ position: "absolute", inset: 0, transform: `translate(${sh.x}px, ${sh.y}px)` }}>
        {/* sede real */}
        <div style={{ position: "absolute", left: 70, width: 940, top: 200, height: 450, borderRadius: 14, overflow: "hidden", border: `5px solid ${CREAM}`, boxShadow: "0 40px 90px rgba(0,0,0,0.75)",
          transform: `translateY(${(1 - ph) * -500}px) rotate(${-1.5 * ph}deg)` }}>
          <Img src={img("netease_office.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "60% 60%", transform: `scale(${1.25 + f * 0.003})`, transformOrigin: "62% 58%" }} />
          <div style={{ position: "absolute", left: 18, bottom: 16, background: "#c8102e", color: "#fff", fontFamily: BODY, fontWeight: 900, fontSize: 30, padding: "6px 16px", borderRadius: 6, letterSpacing: 2 }}>SEDE DA NETEASE · HANGZHOU</div>
        </div>
        {/* pregão */}
        {f >= stockAt - 4 ? (
          <div style={{ position: "absolute", left: 70, width: 940, top: 690, height: 440, transform: `translateY(${(1 - ch) * 700}px)`, borderRadius: 12, background: "#0a0f14", border: "2px solid #23303c", boxShadow: "0 30px 70px rgba(0,0,0,0.7)", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 22px", borderBottom: "2px solid #1b2530" }}>
              <div style={{ fontFamily: "'Courier New', monospace", fontWeight: 900, fontSize: 40, color: "#fff" }}>NTES <span style={{ color: "#6b7a89", fontSize: 26 }}>NASDAQ</span></div>
              <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 26, color: "#ffd27a", letterSpacing: 3 }}>AÇÕES NA BOLSA</div>
            </div>
            <svg width={940} height={320} style={{ position: "absolute", left: 0, top: 70 }}>
              {Array.from({ length: shown }, (_, i) => {
                const c = candle(i), up = c.c >= c.o, x = 40 + i * 40;
                return (
                  <g key={i}>
                    <line x1={x} x2={x} y1={yv(c.hi)} y2={yv(c.lo)} stroke={up ? "#2ecc71" : "#ff4d4d"} strokeWidth={3} />
                    <rect x={x - 12} y={yv(Math.max(c.o, c.c))} width={24} height={Math.max(4, Math.abs(yv(c.o) - yv(c.c)))} fill={up ? "#2ecc71" : "#ff4d4d"} />
                  </g>
                );
              })}
            </svg>
            <div style={{ position: "absolute", left: 0, bottom: 0, width: 2400, height: 46, background: "#111a22", display: "flex", alignItems: "center", gap: 40, transform: `translateX(${-(f * 6) % 600}px)`,
              fontFamily: "'Courier New', monospace", fontWeight: 900, fontSize: 26 }}>
              {Array.from({ length: 12 }, (_, i) => <span key={i} style={{ color: i % 3 === 1 ? "#ff4d4d" : "#2ecc71" }}>NTES {i % 3 === 1 ? "▼" : "▲"}</span>)}
            </div>
          </div>
        ) : null}
        {/* contrato de licença da Marvel */}
        {f >= licAt ? (
          <div style={{ position: "absolute", left: 230, width: 620, top: 600, transform: `rotate(-7deg) scale(${lic})`, background: "#fbf8ef", borderRadius: 8, boxShadow: "0 40px 90px rgba(0,0,0,0.8)", padding: "26px 34px 30px" }}>
            <Img src={img("marvel.png")} style={{ width: 300, display: "block" }} />
            <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 44, color: "#111", marginTop: 14, letterSpacing: 2 }}>CONTRATO DE LICENÇA</div>
            {[0, 1, 2, 3].map((k) => <div key={k} style={{ height: 12, borderRadius: 6, background: "#d9d3c4", marginTop: 14, width: `${92 - k * 9}%` }} />)}
            <svg width={300} height={80} viewBox="0 0 300 80" style={{ marginTop: 10 }}><path d="M10 50 C40 10, 60 70, 90 40 S140 20, 160 50 S220 60, 290 30" fill="none" stroke="#1d2a6b" strokeWidth={5} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - ease(f, licAt + 6, 10)} /></svg>
          </div>
        ) : null}
      </div>
      <Vignette o={0.6} />
      <Grain />
      <AbsoluteFill style={{ background: "#fff", opacity: fl(f, licAt + 6, licAt + 11, 0.3), pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};

// =====================================================================================================================
// 5:46 "Half-Life 3, que tá todo mundo especulando cada ano que passa… o Hopium aumenta e às vezes diminui…
// há 20 anos esperando": lambda oficial acesa, os anos virando no relógio de placas e o medidor de Hopium sobe e cai.
// =====================================================================================================================
export const MGHL3Wait: React.FC<{ life: number; countAt: number; hopeAt: number }> = ({ life, countAt, hopeAt }) => {
  const f = useCurrentFrame();
  const yrs = Math.floor(lerp(f, countAt + 4, life - 14, 0, 20, Easing.inOut(Easing.quad)));
  const year = 2006 + yrs;
  const flipT = (() => {
    const p = lerp(f, countAt + 4, life - 14, 0, 20, Easing.inOut(Easing.quad));
    return p - Math.floor(p);
  })();
  const lam = back(f, 0, 16, 1.4);
  const g = f >= hopeAt ? ease(f, hopeAt, 8) : 0;
  // agulha: sobe e cai cada vez com mais força ("aumenta e às vezes diminui")
  const k = f - hopeAt;
  const needle = f < hopeAt ? -80 : -80 + g * (95 + Math.sin(k / 7) * 55 * Math.min(1, k / 20) + Math.sin(k / 2.3) * 4);
  const Digit: React.FC<{ d: string; prev: string }> = ({ d, prev }) => {
    const flip = d !== prev ? flipT : 1;
    return (
      <div style={{ position: "relative", width: 150, height: 200, borderRadius: 14, background: "#16120d", boxShadow: "0 18px 40px rgba(0,0,0,0.6)", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: POSTER, fontSize: 170, color: "#f37a21" }}>{d}</div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 99, height: 3, background: "#000" }} />
        {flip < 0.5 ? (
          <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 100, overflow: "hidden", background: "#1d1812", transformOrigin: "50% 100%", transform: `rotateX(${flip * 180}deg)` }}>
            <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: POSTER, fontSize: 170, color: "#f37a21" }}>{prev}</div>
          </div>
        ) : null}
      </div>
    );
  };
  const ys = String(year), yp = String(Math.max(2006, year - 1));
  return (
    <AbsoluteFill style={{ background: "#0a0806", overflow: "hidden", opacity: outF(f, life, 3) }}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 70% 45% at 50% 25%, rgba(243,122,33,0.28) 0%, rgba(0,0,0,0) 70%)" }} />
      <Halftone c="#f37a21" o={0.05} size={14} />
      <div style={{ position: "absolute", left: 540 - 160, top: 200, width: 320, height: 320, transform: `scale(${lam}) rotate(${interpolate(f, [0, 22], [-160, 0], { ...clamp, easing: Easing.out(Easing.cubic) })}deg)`,
        filter: `drop-shadow(0 0 ${30 + 20 * Math.sin(f / 8)}px rgba(243,122,33,0.8))` }}>
        <Img src={img("lambda.png")} style={{ width: "100%", height: "100%" }} />
      </div>
      {/* relógio de placas */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 570, display: "flex", justifyContent: "center", gap: 14, perspective: 800, opacity: ease(f, countAt, 8) }}>
        {ys.split("").map((d, i) => <Digit key={i} d={d} prev={yp[i]} />)}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 790, textAlign: "center", fontFamily: BODY, fontWeight: 900, fontSize: 34, letterSpacing: 6, color: "#c8b8a0", opacity: ease(f, countAt, 8) }}>
        ESPERANDO HÁ <span style={{ color: "#f37a21", fontSize: 46 }}>{yrs}</span> ANOS
      </div>
      {/* medidor de Hopium */}
      {f >= hopeAt - 2 ? (
        <div style={{ position: "absolute", left: 190, width: 700, top: 870, height: 400, transform: `translateY(${(1 - back(f, hopeAt - 2, 12, 1.3)) * 600}px)` }}>
          <svg width={700} height={400} viewBox="-350 -360 700 400">
            <defs><linearGradient id="hop" x1="0" x2="1"><stop offset="0" stopColor="#5b6b7a" /><stop offset="0.5" stopColor="#f3b221" /><stop offset="1" stopColor="#3cf27a" /></linearGradient></defs>
            <path d="M-300 0 A300 300 0 0 1 300 0" fill="none" stroke="url(#hop)" strokeWidth={56} strokeLinecap="round" />
            {Array.from({ length: 11 }, (_, i) => { const a = Math.PI + (i / 10) * Math.PI; return <line key={i} x1={Math.cos(a) * 240} y1={Math.sin(a) * 240} x2={Math.cos(a) * 214} y2={Math.sin(a) * 214} stroke="#c8b8a0" strokeWidth={5} />; })}
            <g transform={`rotate(${needle})`}><path d="M-12 0 L0 -265 L12 0 Z" fill="#fff" /></g>
            <circle r={34} fill="#16120d" stroke="#f37a21" strokeWidth={8} />
          </svg>
          <div style={{ position: "absolute", left: 0, right: 0, top: 300, textAlign: "center", fontFamily: POSTER, fontSize: 84, color: "#f3b221", letterSpacing: 6, textShadow: "0 0 30px rgba(243,178,33,0.5)" }}>HOPIUM</div>
        </div>
      ) : null}
      <Vignette o={0.65} />
      <Grain />
    </AbsoluteFill>
  );
};

// =====================================================================================================================
// 6:07 "tô preparando um vídeo de duas horas… como eu faria Half-Life 3… vai sair no TikTok e no YouTube": a linha do
// tempo do editor se estica até 2:00:00; vira o player do YouTube com a thumb (lambda) e o canal do Blies; no TikTok e
// YouTube as duas logos batem e chega a notificação com o sino; o cursor clica em "Inscrever-se".
// =====================================================================================================================
const TT = "M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z";
// nota do TikTok em vetor: camada ciano e vermelha deslocadas e a branca por cima (como na logo oficial)
const TikTokNote: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="-1 -1 26 26" style={{ overflow: "visible" }}>
    <path d={TT} fill="#25f4ee" transform="translate(-0.7,-0.6)" />
    <path d={TT} fill="#fe2c55" transform="translate(0.7,0.6)" />
    <path d={TT} fill="#ffffff" />
  </svg>
);

export const MGNext2: React.FC<{ life: number; durAt: number; hl3At: number; platAt: number; ytAt: number }> = ({ life, durAt, hl3At, platAt, ytAt }) => {
  const f = useCurrentFrame();
  const tl = back(f, 0, 12, 1.2);
  const len = lerp(f, 6, durAt, 0.08, 1, Easing.in(Easing.quad));
  const tc = Math.round(lerp(f, 6, durAt, 300, 7200, Easing.in(Easing.quad)));
  const hh = `${Math.floor(tc / 3600)}:${String(Math.floor((tc % 3600) / 60)).padStart(2, "0")}:${String(tc % 60).padStart(2, "0")}`;
  const pl = back(f, hl3At - 8, 14, 1.2);
  const title = "Como eu faria Half-Life 3";
  const typed = title.slice(0, Math.floor(lerp(f, hl3At, hl3At + 22, 0, title.length, Easing.linear)));
  const shrink = lerp(f, platAt - 6, platAt + 8, 0, 1);
  const subAt = ytAt + 14;
  const cx = lerp(f, platAt + 10, subAt - 2, 900, 700);
  const cy = lerp(f, platAt + 10, subAt - 2, 1250, 760);
  const press = interpolate(f, [subAt - 2, subAt, subAt + 3], [0, 1, 0], clamp);
  const subbed = f >= subAt;
  const bell = f >= ytAt ? Math.sin((f - ytAt) / 1.6) * 22 * Math.max(0, 1 - (f - ytAt) / 24) : 0;
  return (
    <AbsoluteFill style={{ background: "#0f0f0f", overflow: "hidden", opacity: outF(f, life, 3) }}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 80% 50% at 50% 30%, rgba(243,122,33,0.18) 0%, rgba(0,0,0,0) 70%)" }} />
      {/* linha do tempo do editor */}
      {f < hl3At + 6 ? (
        <div style={{ position: "absolute", left: 60, width: 960, top: 330, transform: `translateY(${(1 - tl) * 500 + lerp(f, hl3At - 8, hl3At + 6, 0, 900)}px)`, borderRadius: 14, background: "#17171c", border: "2px solid #2a2a33", boxShadow: "0 30px 80px rgba(0,0,0,0.7)", padding: "20px 22px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 30, color: "#9a9aa8", letterSpacing: 3 }}>EDITANDO · Half-Life 3</div>
            <div style={{ fontFamily: "'Courier New', monospace", fontWeight: 900, fontSize: 64, color: f >= durAt ? "#f37a21" : "#fff", transform: `scale(${1 + punchZ(f, [durAt], 0.3, 9)})`, transformOrigin: "100% 50%" }}>{hh}</div>
          </div>
          {[{ c: "#f37a21", h: 90 }, { c: "#5a7dff", h: 60 }, { c: "#2bd18a", h: 46 }].map((t, i) => (
            <div key={i} style={{ marginTop: 16, height: t.h, borderRadius: 8, background: "#0e0e12", overflow: "hidden", position: "relative" }}>
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${len * (100 - i * 6)}%`, background: `repeating-linear-gradient(90deg, ${t.c} 0 ${60 + i * 30}px, ${t.c}cc ${60 + i * 30}px ${64 + i * 30}px)`, borderRadius: 8 }} />
            </div>
          ))}
          <div style={{ position: "absolute", left: 22 + len * 900, top: 100, width: 4, height: 260, background: "#ff3b3b" }} />
        </div>
      ) : null}
      {/* player do YouTube */}
      {f >= hl3At - 8 ? (
        <div style={{ position: "absolute", left: 60, width: 960, top: 230, transformOrigin: "50% 0%", transform: `translateY(${(1 - pl) * 1200}px) scale(${1 - shrink * 0.16})` }}>
          <div style={{ position: "relative", height: 540, borderRadius: 16, overflow: "hidden", background: "#000", boxShadow: "0 40px 100px rgba(0,0,0,0.8)" }}>
            <AbsoluteFill style={{ background: "radial-gradient(circle at 70% 50%, #3a1c06 0%, #0a0503 70%)" }} />
            <div style={{ position: "absolute", right: 70, top: 90, width: 360, height: 360, filter: "drop-shadow(0 0 50px rgba(243,122,33,0.8))", transform: `rotate(${Math.sin(f / 20) * 4}deg)` }}>
              <Img src={img("lambda.png")} style={{ width: "100%", height: "100%" }} />
            </div>
            <div style={{ position: "absolute", left: 50, top: 120, fontFamily: POSTER, fontSize: 110, lineHeight: 0.95, color: "#fff", textShadow: "0 6px 0 #000" }}>COMO EU<br />FARIA</div>
            <div style={{ position: "absolute", left: 50, top: 340, fontFamily: POSTER, fontSize: 92, color: "#f37a21", textShadow: "0 6px 0 #000" }}>HALF-LIFE 3</div>
            <div style={{ position: "absolute", right: 18, bottom: 22, background: "rgba(0,0,0,0.85)", color: "#fff", fontFamily: BODY, fontWeight: 900, fontSize: 34, padding: "4px 12px", borderRadius: 6 }}>2:00:00</div>
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 8, background: "rgba(255,255,255,0.25)" }}>
              <div style={{ width: `${lerp(f, hl3At, life, 0, 18, Easing.linear)}%`, height: "100%", background: "#ff0000" }} />
            </div>
          </div>
          <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 46, color: "#fff", marginTop: 22, minHeight: 56 }}>{typed}<span style={{ opacity: f % 16 < 8 && typed.length < title.length ? 1 : 0 }}>|</span></div>
          <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 18 }}>
            <Img src={staticFile(`${DLP}blies.jpg`)} style={{ width: 84, height: 84, borderRadius: 42, objectFit: "cover" }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 36, color: "#fff" }}>Blies</div>
              <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 24, color: "#aaa" }}>em breve</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, background: subbed ? "#272727" : "#fff", color: subbed ? "#fff" : "#0f0f0f", fontFamily: BODY, fontWeight: 900, fontSize: 32, padding: "16px 30px", borderRadius: 40, transform: `scale(${1 - press * 0.1})` }}>
              {subbed ? (
                <svg width={34} height={34} viewBox="0 0 24 24" style={{ transform: `rotate(${bell}deg)` }}><path d="M12 22 a2.4 2.4 0 0 0 2.4-2.4 h-4.8 A2.4 2.4 0 0 0 12 22 Z M19 17 V11 a7 7 0 0 0-5.4-6.8 V3.4 a1.6 1.6 0 0 0-3.2 0 V4.2 A7 7 0 0 0 5 11 v6 l-2 2 v1 h18 v-1 Z" fill="#fff" /></svg>
              ) : null}
              {subbed ? "Inscrito" : "Inscrever-se"}
            </div>
          </div>
        </div>
      ) : null}
      {/* TikTok e YouTube */}
      {f >= platAt ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 1000, display: "flex", justifyContent: "center", gap: 70 }}>
          {[{ src: "tiktok.png", at: platAt, w: 130, bg: "#000" }, { src: "youtube.png", at: ytAt, w: 190, bg: "#fff" }].map((p) => f >= p.at ? (
            <div key={p.src} style={{ width: 230, height: 230, borderRadius: 54, background: p.bg, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 30px 60px rgba(0,0,0,0.6)", border: "4px solid rgba(255,255,255,0.15)",
              transform: `scale(${back(f, p.at, 10, 2.2)}) rotate(${(1 - back(f, p.at, 10, 2.2)) * -30}deg)` }}>
              {p.src === "tiktok.png" ? <TikTokNote size={140} /> : <Img src={img(p.src)} style={{ width: p.w }} />}
            </div>
          ) : <div key={p.src} style={{ width: 230 }} />)}
        </div>
      ) : null}
      {/* notificação */}
      {f >= ytAt + 4 ? (
        <div style={{ position: "absolute", left: 90, width: 900, top: 190, transform: `translateY(${(1 - back(f, ytAt + 4, 10, 1.4)) * -300}px)`, background: "rgba(40,40,44,0.97)", borderRadius: 26, padding: "18px 24px", display: "flex", alignItems: "center", gap: 18, boxShadow: "0 20px 50px rgba(0,0,0,0.7)", zIndex: 5 }}>
          <Img src={staticFile(`${DLP}blies.jpg`)} style={{ width: 70, height: 70, borderRadius: 35, objectFit: "cover" }} />
          <div style={{ flex: 1, fontFamily: BODY, fontWeight: 800, fontSize: 30, color: "#fff", lineHeight: 1.2 }}><b>Blies</b> postou: Como eu faria Half-Life 3</div>
          <svg width={44} height={44} viewBox="0 0 24 24" style={{ transform: `rotate(${bell}deg)` }}><path d="M12 22 a2.4 2.4 0 0 0 2.4-2.4 h-4.8 A2.4 2.4 0 0 0 12 22 Z M19 17 V11 a7 7 0 0 0-5.4-6.8 V3.4 a1.6 1.6 0 0 0-3.2 0 V4.2 A7 7 0 0 0 5 11 v6 l-2 2 v1 h18 v-1 Z" fill="#ffcc33" /></svg>
        </div>
      ) : null}
      {f >= platAt + 10 && f < subAt + 12 ? <Cursor x={cx} y={cy} press={press} /> : null}
      <Vignette o={0.55} />
      <Grain o={0.06} />
    </AbsoluteFill>
  );
};

// =====================================================================================================================
// 6:23 "e você, o que você largou pra estar aqui hoje? jogando e viciado no Deadlock": a aba de comentários sobe com a
// pergunta fixada do Blies (foto real) e as respostas chegam com a logo do jogo de cada um; no "Deadlock" a última
// resposta chega com o emblema e explode em corações.
// =====================================================================================================================
export const MGPoll2: React.FC<{ life: number; at: number; dlAt: number }> = ({ life, at, dlAt }) => {
  const f = useCurrentFrame();
  const sheet = back(f, 0, 12, 1.1);
  const q = "o que você largou pra estar aqui hoje?";
  const typed = q.slice(0, Math.floor(lerp(f, at - 10, at + 16, 0, q.length, Easing.linear)));
  const replies = [
    { logo: "lol_logo.png", n: "ex_jungler", t: "o LoL depois de 10 anos", d: 0 },
    { logo: "ow_logo.png", n: "tracer_br", t: "Overwatch, sem saudade", d: 6 },
    { logo: "mr_logo.png", n: "rivals_ex", t: "Marvel Rivals kkkk", d: 12 },
  ];
  const r0 = at + 18;
  return (
    <AbsoluteFill style={{ background: INK, overflow: "hidden", opacity: outF(f, life, 3) }}>
      <AbsoluteFill style={{ transform: "scale(1.15)" }}>
        <BgClip clip="k4" ss={100} life={life} blur={10} dim={0.35} />
      </AbsoluteFill>
      <div style={{ position: "absolute", left: 40, width: 1000, top: 300, transform: `translateY(${(1 - sheet) * 1200}px)`, background: "#fff", borderRadius: 34, boxShadow: "0 -20px 80px rgba(0,0,0,0.6)", padding: "26px 34px 34px" }}>
        <div style={{ width: 90, height: 10, borderRadius: 5, background: "#ddd", margin: "0 auto 18px" }} />
        <div style={{ textAlign: "center", fontFamily: BODY, fontWeight: 900, fontSize: 32, color: "#111" }}>comentários</div>
        {/* fixado */}
        <div style={{ display: "flex", gap: 18, marginTop: 30, padding: 18, borderRadius: 18, background: "#f4f0ff", border: `3px solid ${SPIRIT}` }}>
          <Img src={staticFile(`${DLP}blies.jpg`)} style={{ width: 92, height: 92, borderRadius: 46, objectFit: "cover" }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 26, color: "#7a6aa8" }}>📌 fixado · Blies</div>
            <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 44, color: "#111", lineHeight: 1.15, minHeight: 104 }}>{typed}</div>
          </div>
        </div>
        {replies.map((r, i) => {
          const t = r0 + r.d;
          if (f < t) return null;
          const e = back(f, t, 9, 1.8);
          return (
            <div key={r.n} style={{ display: "flex", gap: 18, alignItems: "center", marginTop: 24, transform: `translateX(${(1 - e) * 500}px)`, opacity: Math.min(1, e * 2) }}>
              <div style={{ width: 84, height: 84, borderRadius: 42, background: "#16181d", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                <Img src={img(r.logo)} style={{ width: 74, height: 74, objectFit: "contain" }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 24, color: "#888" }}>{r.n}</div>
                <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 38, color: "#111" }}>{r.t}</div>
              </div>
              <div style={{ fontSize: 34, color: "#bbb" }}>♡</div>
            </div>
          );
        })}
        {f >= dlAt ? (
          <div style={{ display: "flex", gap: 18, alignItems: "center", marginTop: 24, padding: 14, borderRadius: 18, background: `${TEAL}`, transform: `scale(${back(f, dlAt, 10, 2)})` }}>
            <div style={{ width: 84, height: 84, borderRadius: 42, background: INK, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Img src={img("dl_emblem.png")} style={{ width: 70, height: 70, filter: `drop-shadow(0 0 10px ${SOUL})` }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 24, color: SOUL }}>todo mundo</div>
              <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 40, color: "#fff" }}>larguei tudo pelo Deadlock</div>
            </div>
            <div style={{ fontSize: 40, color: "#ff3b5c", transform: `scale(${1 + punchZ(f, [dlAt + 4], 0.6, 8)})` }}>♥</div>
          </div>
        ) : null}
      </div>
      {/* corações subindo no Deadlock */}
      {f >= dlAt + 4 ? Array.from({ length: 14 }, (_, i) => {
        const t = f - dlAt - 4 - i * 1.5;
        if (t < 0) return null;
        const x = 820 + Math.sin(t / 5 + i) * 40 - random(`hx${i}`) * 140;
        const y = 1200 - t * (14 + random(`hv${i}`) * 8);
        return <div key={i} style={{ position: "absolute", left: x, top: y, fontSize: 40 + random(`hs${i}`) * 30, color: "#ff3b5c", opacity: Math.max(0, 1 - t / 40) }}>♥</div>;
      }) : null}
      <Vignette o={0.4} />
    </AbsoluteFill>
  );
};

