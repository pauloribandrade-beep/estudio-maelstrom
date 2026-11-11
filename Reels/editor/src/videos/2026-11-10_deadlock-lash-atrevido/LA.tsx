import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, OffthreadVideo, random, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Cam, Center, clamp, Cursor, ease, Flash, io, path, punch, shake } from "../2026-11-09_deadlock-cansei-lol/CL2";
import { D, DlPanel, DlRoom, DlTitle, HERO, RD, RV } from "../2026-11-09_deadlock-cansei-lol/CL3";

// "Lash atrevido" (10/11). Mesmo estilo do Cansei do LoL v2: tudo contado DENTRO da UI do Deadlock (Reaver/Radiance,
// painéis chanfrados, creme/âmbar/alma), poucos golpes por cena, movimento calmo. Jogo citado de passagem = card
// pequeno com logo (nada de gameplay de outro jogo). Zona segura do TikTok: conteúdo entre y 180 e 1290.
// Props *At em QUADROS da cena (o Estúdio converte os segundos do edit.json).

const LA = (n: string) => staticFile(`videos/2026-11-10_deadlock-lash-atrevido_R/${n}`);
const MG = (n: string) => staticFile(`videos/2026-11-06_deadlock-magia_R/mg/${n}`);
const IT = (n: string) => staticFile(`videos/2026-11-06_deadlock-magia_R/mg/items/${n}.png`);
const WK = (n: string) => staticFile(`videos/2026-11-09_deadlock-farm_R/wk/${n}`);
const DL_ = (n: string) => staticFile(`videos/2026-11-05_deadlock-patch-celeste_R/dl/${n}`);

// ---------- peças ----------
const Label: React.FC<{ f: number; at: number; children: React.ReactNode; c?: string; size?: number }> = ({ f, at, children, c = D.dim, size = 30 }) => (
  <div style={{ fontFamily: RD, fontWeight: 700, fontSize: size, letterSpacing: size * 0.28, color: c, opacity: ease(f, at, 8), whiteSpace: "nowrap" }}>{children}</div>
);

// carimbo do Deadlock: placa chanfrada que bate de cima
const Stamp: React.FC<{ f: number; at: number; text: string; c?: string; size?: number; rot?: number; style?: React.CSSProperties }> = ({ f, at, text, c = D.red, size = 64, rot = -6, style }) => {
  if (f < at) return null;
  const k = interpolate(f, [at, at + 5], [1.9, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  return (
    <div style={{ padding: `${size * 0.16}px ${size * 0.5}px`, border: `${Math.max(4, size * 0.08)}px solid ${c}`, color: c, fontFamily: RV, fontWeight: 700, fontSize: size, letterSpacing: size * 0.06, lineHeight: 1, whiteSpace: "nowrap", background: "rgba(11,10,8,0.82)", transform: `rotate(${rot}deg) scale(${k})`, opacity: interpolate(f, [at, at + 3], [0, 1], clamp), boxShadow: `0 0 40px ${c}55, 0 20px 40px rgba(0,0,0,0.8)`, ...style }}>
      {text}
    </div>
  );
};

const Skull: React.FC<{ s?: number; c?: string }> = ({ s = 44, c = D.red }) => (
  <svg width={s} height={s} viewBox="0 0 44 44">
    <path d="M22 4 C11 4 5 11 5 20 c0 6 3 9 6 11 v6 h5 v-4 h3 v4 h6 v-4 h3 v4 h5 v-6 c3 -2 6 -5 6 -11 C39 11 33 4 22 4 Z" fill={c} />
    <circle cx={15} cy={21} r={4.5} fill={D.bg} />
    <circle cx={29} cy={21} r={4.5} fill={D.bg} />
    <path d="M22 26 l-3 5 h6 Z" fill={D.bg} />
  </svg>
);

const Ability: React.FC<{ img: string; size: number; on?: number; cd?: number; locked?: boolean; glow?: number; k?: string }> = ({ img, size, on = 0, cd = 1, locked = false, glow = 0, k }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
    <div style={{ position: "relative", width: size, height: size, border: `3px solid ${on > 0.5 || glow > 0.3 ? D.amber : D.line}`, background: "#000", boxShadow: on > 0.5 ? `0 0 34px ${D.amber}` : glow > 0 ? `0 0 ${60 * glow}px ${D.soul}` : "0 16px 40px rgba(0,0,0,0.8)", transform: `scale(${1 - on * 0.08})` }}>
      <Img src={img} style={{ width: "100%", height: "100%", filter: locked ? "grayscale(1) brightness(0.35)" : undefined }} />
      {cd < 1 ? <div style={{ position: "absolute", inset: 0, background: `conic-gradient(rgba(0,0,0,0) ${cd * 360}deg, rgba(0,0,0,0.7) 0deg)` }} /> : null}
      {locked ? (
        <svg width={size * 0.42} height={size * 0.5} viewBox="0 0 40 48" style={{ position: "absolute", left: size * 0.29, top: size * 0.24 }}>
          <path d="M10 22 V14 a10 10 0 0 1 20 0 V22" fill="none" stroke={D.cream} strokeWidth={4} />
          <rect x={5} y={21} width={30} height={24} rx={4} fill={D.cream} />
        </svg>
      ) : null}
    </div>
    {k ? <div style={{ fontFamily: RD, fontWeight: 700, fontSize: 28, color: on > 0.5 ? D.amber : D.cream, letterSpacing: 2 }}>{k}</div> : null}
  </div>
);

// meme em tela cheia (pasta do Lash)
const LMeme: React.FC<{ f: number; at: number; dur: number; src: string; ss?: number; pos?: string; life: number }> = ({ f, at, dur, src, ss = 0, pos = "50% 50%", life }) => {
  if (f < at - 1 || f >= at + dur) return null;
  const k = interpolate(f, [at, at + 5], [1.12, 1], { ...clamp, easing: Easing.out(Easing.cubic) }) + interpolate(f, [at, at + dur], [0, 0.05], clamp);
  return (
    <Sequence from={at} durationInFrames={Math.max(1, Math.min(dur, life - at))} layout="none">
      <AbsoluteFill style={{ background: "#000", zIndex: 90, overflow: "hidden" }}>
        <AbsoluteFill style={{ transform: `scale(${k})` }}>
          <OffthreadVideo src={LA(src)} muted startFrom={ss} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: pos }} />
        </AbsoluteFill>
      </AbsoluteFill>
    </Sequence>
  );
};

const n2 = (v: number) => v.toLocaleString("pt-BR");

// ========== 1) feliz jogando · satisfeito → mas: o medidor vira ESTRESSE · muito, MUITO ==========
export const LAHook: React.FC<{ life: number; satAt?: number; masAt?: number; stressAt?: number; muitoAt?: number; muito2At?: number }> = ({ life, satAt = 150, masAt = 228, stressAt = 300, muitoAt = 320, muito2At = 348 }) => {
  const f = useCurrentFrame();
  const bad = f >= masAt;
  const sat = interpolate(f, [0, satAt + 10], [12, 100], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const st = interpolate(f, [masAt, stressAt, muitoAt, muito2At], [0, 70, 100, 100], clamp);
  const over = f >= muito2At;
  const v = bad ? st : sat;
  const sh = shake(f, muito2At, 22, 14, "hk");
  const sh2 = shake(f, stressAt, 10, 10, "hs");
  const col = bad ? D.red : D.soul;
  return (
    <DlRoom glow={bad ? "#3a0c08" : "#3a2a14"}>
      <AbsoluteFill style={{ opacity: 0.22 * ease(f, 0, 20), filter: `saturate(${bad ? 0.3 : 1}) blur(2px)` }}>
        <Img src={LA("la/Lash_select_background.png")} style={{ position: "absolute", height: 1920, left: -560 - f * 0.4, top: 0 }} />
      </AbsoluteFill>
      <Cam f={f} rx={6} z={1 + f * 0.0004 + punch(f, [muito2At], 0.06)} x={sh.x + sh2.x} y={sh.y}>
        <Center top={250}>
          <Img src={MG("dl_logo.png")} style={{ width: 640, filter: `drop-shadow(0 10px 40px #000) ${bad ? "grayscale(0.6)" : ""}` }} />
        </Center>
        <Center top={560}>
          <DlPanel w={940} style={{ padding: "40px 46px" }} c={bad ? D.red : D.line}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div style={{ fontFamily: RD, fontWeight: 700, fontSize: 46, letterSpacing: 8, color: bad ? D.red : D.cream }}>{bad ? "ESTRESSE" : "SATISFAÇÃO"}</div>
              <div style={{ fontFamily: RV, fontWeight: 700, fontSize: over ? 96 : 76, color: col, fontVariantNumeric: "tabular-nums", textShadow: `0 0 30px ${col}88` }}>{over ? "999%" : `${Math.round(v)}%`}</div>
            </div>
            <div style={{ marginTop: 26, height: 46, border: `2px solid ${bad ? D.red : D.line}`, padding: 4, background: "#060504" }}>
              <div style={{ height: "100%", width: `${Math.min(100, v)}%`, background: bad ? `linear-gradient(90deg, #7a1a12, ${D.red})` : `linear-gradient(90deg, #1f6e63, ${D.soul})`, boxShadow: `0 0 26px ${col}` }} />
            </div>
          </DlPanel>
        </Center>
        <Center top={880}>
          {bad ? (
            <DlTitle key="b" f={f} at={stressAt} size={92} c={D.red} ls={0.06}>
              {over ? "MUITO." : "ME ESTRESSA"}
            </DlTitle>
          ) : (
            <DlTitle key="a" f={f} at={Math.min(60, satAt)} size={80} ls={0.06}>
              FELIZ JOGANDO
            </DlTitle>
          )}
        </Center>
      </Cam>
      <Flash f={f} ts={[masAt, muito2At]} pk={0.22} c="#ff3b2f" />
    </DlRoom>
  );
};

// ========== 2) a galera: killfeed sem fim · SÓ UM JOGO DE MATAR? ==========
const KF = ["Haze", "Infernus", "Seven", "Rem", "Apollo", "Celeste", "Baba", "Mo & Krill"];
export const LAKill: React.FC<{ life: number; galeraAt?: number; soAt?: number; matarAt?: number }> = ({ life, galeraAt = 40, soAt = 120, matarAt = 142 }) => {
  const f = useCurrentFrame();
  const n = f < galeraAt ? 0 : Math.min(14, 1 + Math.floor((f - galeraAt) / 9));
  const dim = ease(f, soAt, 10);
  return (
    <DlRoom glow="#3a1410">
      <Cam f={f} rx={8} z={1 + f * 0.0005 + punch(f, [matarAt], 0.05)}>
        <div style={{ position: "absolute", left: 90, top: 230, width: 900, opacity: 1 - dim * 0.65, filter: `blur(${dim * 2}px)` }}>
          <Label f={f} at={0} c={D.amber}>
            FEED DE ABATES
          </Label>
          <div style={{ marginTop: 18 }}>
            {Array.from({ length: Math.min(n, 6) }).map((_, k) => {
              const i = n - 1 - k;
              const at = galeraAt + i * 9;
              const a = KF[i % KF.length];
              const b = KF[(i * 3 + 2) % KF.length];
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 22, height: 120, marginBottom: 12, padding: "0 22px", background: D.panel, border: `1px solid ${D.line}`, opacity: ease(f, at, 6) * (1 - k * 0.12), transform: `translateX(${(1 - ease(f, at, 8)) * 120}px)` }}>
                  <div style={{ width: 74, height: 100, overflow: "hidden", border: `2px solid ${D.sapph}` }}>
                    <Img src={HERO[a]} style={{ width: 74, height: 100, objectFit: "cover" }} />
                  </div>
                  <div style={{ flex: 1, fontFamily: RD, fontWeight: 700, fontSize: 32, color: D.sapph, whiteSpace: "nowrap" }}>{a.toUpperCase()}</div>
                  <Skull />
                  <div style={{ flex: 1, textAlign: "right", fontFamily: RD, fontWeight: 700, fontSize: 32, color: D.red, whiteSpace: "nowrap" }}>{b.toUpperCase()}</div>
                  <div style={{ width: 74, height: 100, overflow: "hidden", border: `2px solid ${D.red}`, filter: "grayscale(0.8)" }}>
                    <Img src={HERO[b]} style={{ width: 74, height: 100, objectFit: "cover" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <Center top={560}>
          <DlTitle f={f} at={soAt} size={104} ls={0.05}>
            SÓ UM JOGO
          </DlTitle>
        </Center>
        <Center top={690}>
          <div style={{ transform: `scale(${1 + punch(f, [matarAt], 0.12)})` }}>
            <DlTitle f={f} at={matarAt} size={134} c={D.red} n={6} ls={0.03}>
              DE MATAR?
            </DlTitle>
          </div>
        </Center>
      </Cam>
      <Flash f={f} ts={[matarAt]} pk={0.18} c="#ff3b2f" />
    </DlRoom>
  );
};

// ========== 3) não é CS · não é Marvel Rivals · não é Overwatch (cards com logo, sem gameplay) ==========
const NOT = [
  ["cs_logo.png", "COUNTER-STRIKE"],
  ["mr_logo.png", "MARVEL RIVALS"],
  ["ow_logo.png", "OVERWATCH"],
] as const;
export const LANot: React.FC<{ life: number; csAt?: number; mrAt?: number; owAt?: number }> = ({ life, csAt = 26, mrAt = 70, owAt = 125 }) => {
  const f = useCurrentFrame();
  const ts = [csAt, mrAt, owAt];
  return (
    <DlRoom glow="#2a1f12">
      <Cam f={f} rx={8} ry={-3} z={1 + f * 0.0004}>
        <Center top={210}>
          <DlTitle f={f} at={0} size={54} ls={0.14} c={D.dim} font={RD}>
            ISSO AQUI NÃO É
          </DlTitle>
        </Center>
        {NOT.map(([logo, name], i) => {
          const at = ts[i];
          const on = ease(f, at - 10, 10);
          const left = 295 + (i - 1) * 70;
          const top = 330 + i * 300;
          return (
            <div key={name} style={{ position: "absolute", left, top, opacity: on, transform: `translateY(${(1 - on) * 40}px) rotate(${(i - 1) * 2}deg)`, filter: f >= at + 4 ? "grayscale(0.5) brightness(0.85)" : undefined }}>
              <DlPanel w={490} h={250} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18 }}>
                <Img src={MG(logo)} style={{ maxWidth: 360, maxHeight: 130, objectFit: "contain", filter: i === 0 ? "brightness(0) invert(0.92)" : undefined }} />
                <div style={{ fontFamily: RD, fontWeight: 700, fontSize: 30, letterSpacing: 6, color: D.cream }}>{name}</div>
              </DlPanel>
              <div style={{ position: "absolute", right: -30, bottom: -36, zIndex: 5 }}>
                <Stamp f={f} at={at} text="NÃO É" size={64} rot={-8 + i * 5} />
              </div>
            </div>
          );
        })}
      </Cam>
    </DlRoom>
  );
};

// ========== 4) outro conceito · espera 5, 6 minutos · LANE PHASE ==========
export const LALane: React.FC<{ life: number; outroAt?: number; esperaAt?: number; minAt?: number; laneAt?: number }> = ({ life, outroAt = 18, esperaAt = 70, minAt = 119, laneAt = 140 }) => {
  const f = useCurrentFrame();
  const sec = interpolate(f, [esperaAt, minAt + 10], [0, 360], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const mm = Math.floor(sec / 60);
  const ss = Math.floor(sec % 60);
  const lp = ease(f, laneAt, 8);
  return (
    <DlRoom glow="#2a2414">
      <Cam f={f} rx={8} z={1 + f * 0.0004}>
        <Center top={230}>
          <DlTitle f={f} at={outroAt} size={86} ls={0.04}>
            OUTRO CONCEITO
          </DlTitle>
        </Center>
        <Center top={430}>
          <div style={{ opacity: ease(f, esperaAt - 12, 10), transform: `scale(${0.92 + 0.08 * ease(f, esperaAt - 12, 14)})` }}>
            <DlPanel w={620} style={{ padding: "26px 0 34px", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <Label f={f} at={esperaAt - 12} c={D.amber}>
                TEMPO DE PARTIDA
              </Label>
              <div style={{ fontFamily: RV, fontWeight: 700, fontSize: 210, lineHeight: 1.05, color: D.cream, fontVariantNumeric: "tabular-nums", textShadow: `0 0 40px ${D.amber}55` }}>
                {mm}:{String(ss).padStart(2, "0")}
              </div>
            </DlPanel>
          </div>
        </Center>
        {/* linha da partida: a lane phase são os primeiros minutos */}
        <div style={{ position: "absolute", left: 90, top: 860, width: 900, opacity: ease(f, esperaAt, 10) }}>
          <div style={{ position: "relative", height: 64, border: `2px solid ${D.line}`, background: "#060504" }}>
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${(sec / 360) * 30}%`, background: `linear-gradient(90deg, #6b4a17, ${D.amber})`, boxShadow: lp > 0 ? `0 0 ${30 * lp}px ${D.amber}` : undefined }} />
            <div style={{ position: "absolute", left: "30%", top: -10, bottom: -10, width: 3, background: D.cream, opacity: 0.6 }} />
          </div>
          <div style={{ display: "flex", marginTop: 16, fontFamily: RD, fontWeight: 700, fontSize: 28, letterSpacing: 4, color: D.dim }}>
            <span style={{ width: "30%", color: lp > 0 ? D.amber : D.dim }}>0–6 MIN</span>
            <span style={{ width: "35%" }}>MID GAME</span>
            <span>LATE GAME</span>
          </div>
        </div>
        <Center top={1070}>
          <div style={{ transform: `scale(${1 + punch(f, [laneAt], 0.08)})` }}>
            <DlTitle f={f} at={laneAt} size={120} c={D.amber} n={7} ls={0.05}>
              LANE PHASE
            </DlTitle>
          </div>
        </Center>
      </Cam>
    </DlRoom>
  );
};

// ========== 5) quietinho, joga: checklist (farma · nega farm · jungle · caixinhas) ==========
const TODO = [
  ["FARMA", "orb_seq.mp4", 0],
  ["NEGA FARM", "c_deny.mp4", 0],
  ["FARMA JUNGLE", "c_jungle.mp4", 0],
  ["PEGA AS CAIXINHAS", "c_crate.mp4", 0],
] as const;
export const LAList: React.FC<{ life: number; farmaAt?: number; negaAt?: number; jungleAt?: number; caixaAt?: number }> = ({ life, farmaAt = 42, negaAt = 61, jungleAt = 97, caixaAt = 144 }) => {
  const f = useCurrentFrame();
  const ts = [farmaAt, negaAt, jungleAt, caixaAt];
  return (
    <DlRoom glow="#1d3a36">
      <Cam f={f} rx={8} ry={3} z={1 + f * 0.0004}>
        <Center top={220}>
          <DlTitle f={f} at={0} size={82} ls={0.04}>
            QUIETINHO, JOGA.
          </DlTitle>
        </Center>
        {TODO.map(([t, clipN, ss], i) => {
          const at = ts[i];
          const on = ease(f, 6 + i * 5, 9);
          const ok = ease(f, at + 2, 6);
          return (
            <div key={t} style={{ position: "absolute", left: 70, top: 390 + i * 215, width: 940, opacity: on, transform: `translateX(${(1 - on) * 80}px)` }}>
              <DlPanel w={940} h={190} c={ok > 0.5 ? D.soul : D.line} style={{ display: "flex", alignItems: "center", gap: 30, padding: "0 24px" }}>
                <div style={{ width: 268, height: 150, overflow: "hidden", border: `2px solid ${D.line}`, background: "#000", flexShrink: 0 }}>
                  {f >= 6 + i * 5 ? (
                    <Sequence from={6 + i * 5} layout="none">
                      <OffthreadVideo src={WK(clipN)} muted startFrom={ss} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </Sequence>
                  ) : null}
                </div>
                <div style={{ flex: 1, fontFamily: RD, fontWeight: 700, fontSize: 44, letterSpacing: 3, color: ok > 0.5 ? D.cream : D.dim, whiteSpace: "nowrap" }}>{t}</div>
                <div style={{ width: 70, height: 70, border: `3px solid ${ok > 0.5 ? D.soul : D.line}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width={50} height={50} viewBox="0 0 50 50" style={{ transform: `scale(${ok})` }}>
                    <path d="M8 26 L20 38 L42 12" fill="none" stroke={D.soul} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </DlPanel>
            </div>
          );
        })}
      </Cam>
    </DlRoom>
  );
};

// ========== 6) quer porrada? botão em recarga · espera · PORRADA LIBERADA ==========
export const LAWait: React.FC<{ life: number; clickAt?: number; esperaAt?: number; readyAt?: number }> = ({ life, clickAt = 40, esperaAt = 56, readyAt = 107 }) => {
  const f = useCurrentFrame();
  const cd = interpolate(f, [0, readyAt], [0.08, 1], clamp);
  const ready = f >= readyAt;
  const left = Math.max(0, Math.ceil((readyAt - f) / 30));
  const sh = shake(f, clickAt, 16, 10, "wt");
  const cur = path(f, [
    [0, 900, 1250],
    [clickAt - 2, 560, 640],
    [clickAt + 20, 600, 690],
    [readyAt - 8, 600, 690],
    [readyAt + 20, 820, 1000],
  ]);
  return (
    <DlRoom glow={ready ? "#4a1a0c" : "#2a2414"}>
      <Cam f={f} rx={8} z={1 + f * 0.0005 + punch(f, [readyAt], 0.05)}>
        <Center top={240}>
          <DlTitle f={f} at={0} size={70} ls={0.08}>
            QUER IR PRA PORRADA?
          </DlTitle>
        </Center>
        <Center top={440}>
          <div style={{ position: "relative", width: 420, height: 420, transform: `translate(${sh.x}px, ${sh.y}px) scale(${ready ? 1 + punch(f, [readyAt], 0.1) : 1})` }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `6px solid ${ready ? D.red : D.line}`, background: ready ? "radial-gradient(circle, #5a1a10, #1a0805)" : "radial-gradient(circle, #1d1a14, #0b0a08)", boxShadow: ready ? `0 0 ${70 + Math.sin(f / 4) * 20}px ${D.red}` : "0 30px 80px rgba(0,0,0,0.8)" }} />
            {!ready ? <div style={{ position: "absolute", inset: 6, borderRadius: "50%", background: `conic-gradient(rgba(0,0,0,0) ${cd * 360}deg, rgba(0,0,0,0.72) 0deg)` }} /> : null}
            <svg width={420} height={420} style={{ position: "absolute", inset: 0 }}>
              <circle cx={210} cy={210} r={200} fill="none" stroke={ready ? D.red : D.amber} strokeWidth={8} strokeDasharray={`${cd * 1257} 1257`} transform="rotate(-90 210 210)" />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <svg width={150} height={150} viewBox="0 0 60 60" style={{ opacity: ready ? 1 : 0.45 }}>
                <path d="M14 30 c0 -8 4 -12 10 -12 h10 c6 0 10 4 10 10 v8 c0 8 -6 14 -14 14 h-4 c-7 0 -12 -6 -12 -12 Z" fill={ready ? D.cream : D.dim} />
                <path d="M20 18 v-6 M27 18 v-8 M34 18 v-7 M41 20 v-5" stroke={ready ? D.cream : D.dim} strokeWidth={5} strokeLinecap="round" />
              </svg>
              {!ready ? <div style={{ fontFamily: RV, fontWeight: 700, fontSize: 90, color: D.cream, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{left}</div> : null}
            </div>
          </div>
        </Center>
        {f >= clickAt && f < esperaAt + 40 ? (
          <Center top={900}>
            <div style={{ opacity: ease(f, clickAt, 5) * (1 - ease(f, esperaAt + 30, 10)) }}>
              <Stamp f={f} at={clickAt} text="EM RECARGA" size={56} c={D.amber} rot={-3} />
            </div>
          </Center>
        ) : null}
        <Center top={1060}>
          {ready ? (
            <DlTitle f={f} at={readyAt} size={82} c={D.red} n={6} ls={0.04}>
              PORRADA LIBERADA
            </DlTitle>
          ) : (
            <DlTitle f={f} at={esperaAt} size={64} c={D.dim} font={RD} ls={0.12}>
              ESPERA MAIS UM POUQUINHO
            </DlTitle>
          )}
        </Center>
        <Cursor x={cur.x} y={cur.y} f={f} clicks={[clickAt]} />
      </Cam>
      <Flash f={f} ts={[readyAt]} pk={0.18} c="#ff5a2f" />
    </DlRoom>
  );
};

// ========== 7) o cara pica Lash: seleção de herói · trava o Lash · o boneco mais sociopata (Bateman) ==========
const GRID = ["Haze", "Infernus", "Seven", "Rem", "Apollo", "LASH", "Celeste", "Baba"];
export const LAPick: React.FC<{ life: number; lashAt?: number; bonecoAt?: number; memeAt?: number }> = ({ life, lashAt = 51, bonecoAt = 78, memeAt = 99 }) => {
  const f = useCurrentFrame();
  const LI = 5;
  const cell = (i: number) => ({ x: 70 + (i % 4) * 240, y: 400 + Math.floor(i / 4) * 330 });
  const lc = cell(LI);
  const cur = path(f, [
    [0, 900, 1250],
    [lashAt - 14, lc.x + 160, lc.y + 200],
    [lashAt - 2, lc.x + 110, lc.y + 150],
  ]);
  const lock = ease(f, lashAt + 8, 14);
  return (
    <DlRoom glow="#2a1430">
      <Cam f={f} rx={8} z={1 + f * 0.0005}>
        <Center top={240}>
          <DlTitle f={f} at={0} size={58} ls={0.14} font={RD}>
            ESCOLHA SEU HERÓI
          </DlTitle>
        </Center>
        <div style={{ position: "absolute", inset: 0, opacity: 1 - lock * 0.85, filter: lock > 0 ? `blur(${lock * 6}px)` : undefined }}>
          {GRID.map((h, i) => {
            const c = cell(i);
            const isL = h === "LASH";
            const hot = isL && f >= lashAt - 14;
            const on = ease(f, 2 + i * 2, 8);
            return (
              <div key={h} style={{ position: "absolute", left: c.x, top: c.y, width: 220, height: 300, overflow: "hidden", border: `3px solid ${hot ? D.amber : D.line}`, boxShadow: hot ? `0 0 40px ${D.amber}` : "0 20px 40px rgba(0,0,0,0.7)", opacity: on, transform: `translateY(${(1 - on) * 40}px) scale(${isL && f >= lashAt ? 1.06 + punch(f, [lashAt], 0.06) : 1})`, filter: f >= lashAt && !isL ? "grayscale(1) brightness(0.45)" : undefined }}>
                <Img src={isL ? LA("la/Lash_card.png") : HERO[h]} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            );
          })}
        </div>
        {/* travou: o Lash sobe inteiro */}
        {f >= lashAt + 6 ? (
          <>
            <div style={{ position: "absolute", left: -260, top: 300, width: 1600, opacity: lock, transform: `translateY(${(1 - lock) * 120}px) scale(${1 + f * 0.0004})` }}>
              <Img src={LA("la/Lash_Render.png")} style={{ width: 1600, filter: "drop-shadow(0 20px 60px #000)" }} />
            </div>
            <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(11,10,8,0) 50%, rgba(11,10,8,0.95) 72%)", opacity: lock }} />
            <Center top={1000}>
              <DlTitle f={f} at={lashAt + 10} size={170} c={D.amber} ls={0.08}>
                LASH
              </DlTitle>
            </Center>
            <Center top={1180}>
              <DlTitle f={f} at={bonecoAt} size={50} c={D.cream} font={RD} ls={0.16}>
                O BONECO MAIS…
              </DlTitle>
            </Center>
          </>
        ) : null}
        {f < lashAt + 10 ? <Cursor x={cur.x} y={cur.y} f={f} clicks={[lashAt]} /> : null}
      </Cam>
      <LMeme f={f} at={memeAt} dur={life - memeAt} src="memes/bateman.mp4" ss={0} life={life} />
    </DlRoom>
  );
};

// ========== 8) dash e soco infinito · na frente da galera · morre na torre ==========
const ABIL = [
  ["la/Ground_Strike.png", "1"],
  ["la/Grapple.png", "2"],
  ["la/Flog.png", "3"],
  ["la/Death_Slam.png", "4"],
] as const;
export const LASpam: React.FC<{ life: number; dashAt?: number; socoAt?: number; infAt?: number; guardAt?: number; deathAt?: number; torreAt?: number }> = ({ life, dashAt = 26, socoAt = 49, infAt = 68, guardAt = 115, deathAt = 141, torreAt = 158 }) => {
  const f = useCurrentFrame();
  const dead = f >= deathAt;
  // quem acende: dash = 2, soco = 1, depois spam 2-1-3 em loop até morrer
  const seq = [2, 1, 3];
  let lit = -1;
  if (f >= dashAt && f < dashAt + 8) lit = 1;
  else if (f >= socoAt && f < socoAt + 8) lit = 0;
  else if (f >= infAt && !dead) lit = seq[Math.floor((f - infAt) / 7) % 3] - 1;
  const spam = f >= infAt ? Math.floor((f - Math.min(f, deathAt)) / 1) * 0 + Math.floor((Math.min(f, deathAt) - infAt) / 7) : 0;
  const dashes = (f >= dashAt ? 1 : 0) + Math.ceil(spam / 2);
  const socos = (f >= socoAt ? 1 : 0) + Math.floor(spam / 2);
  const g = ease(f, guardAt, 8);
  const sh = shake(f, deathAt, 18, 12, "dd");
  return (
    <DlRoom glow={dead ? "#1a1a1a" : "#3a2a14"}>
      <Cam f={f} rx={6} z={1 + f * 0.0005} x={sh.x} y={sh.y}>
        <div style={{ filter: dead ? `grayscale(${ease(f, deathAt, 8)}) brightness(${1 - ease(f, deathAt, 8) * 0.5})` : undefined }}>
          {/* janela do jogo */}
          <Center top={230}>
            <DlPanel w={960} h={560} style={{ overflow: "hidden" }}>
              <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
                <OffthreadVideo src={LA("la/LashZMC.mp4")} muted startFrom={0} style={{ position: "absolute", left: -90, top: -60, width: 1240, height: 698, objectFit: "cover" }} />
              </div>
              <div style={{ position: "absolute", left: 22, top: 18, padding: "6px 16px", background: "rgba(11,10,8,0.8)", fontFamily: RD, fontWeight: 700, fontSize: 26, letterSpacing: 4, color: D.amber }}>LASH</div>
              {/* o guardião aparece no canto */}
              {f >= guardAt ? (
                <div style={{ position: "absolute", right: 30, top: 140, width: 230, height: 230, borderRadius: "50%", border: `5px solid ${D.red}`, background: "rgba(40,8,6,0.85)", boxShadow: `0 0 ${50 + Math.sin(f / 4) * 14}px ${D.red}`, opacity: g, transform: `scale(${interpolate(f, [guardAt, guardAt + 6], [1.6, 1], clamp)})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Img src={LA("la/Guardian.png")} style={{ width: 190, height: 190 }} />
                </div>
              ) : null}
            </DlPanel>
          </Center>
          {/* barra de habilidades */}
          <Center top={830}>
            <div style={{ display: "flex", gap: 30 }}>
              {ABIL.map(([img, k], i) => (
                <Ability key={k} img={LA(img)} size={150} k={k} on={lit === i ? 1 : 0} cd={lit === i ? 0.3 : 1} locked={i === 3} />
              ))}
            </div>
          </Center>
          {/* contadores */}
          <Center top={1060}>
            <div style={{ display: "flex", gap: 30, opacity: ease(f, dashAt, 8) }}>
              {[
                ["DASH", dashes, dashAt],
                ["SOCO", socos, socoAt],
              ].map(([t, v, at]) =>
                f >= (at as number) ? (
                  <DlPanel key={t as string} w={420} style={{ padding: "16px 0", display: "flex", justifyContent: "center", gap: 20, alignItems: "baseline" }}>
                    <span style={{ fontFamily: RD, fontWeight: 700, fontSize: 40, letterSpacing: 6, color: D.dim }}>{t}</span>
                    <span style={{ fontFamily: RV, fontWeight: 700, fontSize: 76, color: f >= infAt ? D.red : D.cream, fontVariantNumeric: "tabular-nums" }}>×{f >= infAt + 40 && !dead ? "∞" : (v as number)}</span>
                  </DlPanel>
                ) : null,
              )}
            </div>
          </Center>
        </div>
        {/* morreu */}
        {dead ? (
          <>
            <Center top={520} style={{ zIndex: 50 }}>
              <DlTitle f={f} at={deathAt} size={104} c={D.red} n={6} ls={0.04}>
                VOCÊ MORREU
              </DlTitle>
            </Center>
            <Center top={680} style={{ zIndex: 50 }}>
              <DlTitle f={f} at={torreAt} size={44} c={D.cream} font={RD} ls={0.16}>
                ABATIDO PELO GUARDIÃO
              </DlTitle>
            </Center>
          </>
        ) : null}
      </Cam>
      <Flash f={f} ts={[deathAt]} pk={0.3} c="#ff2a1f" />
    </DlRoom>
  );
};

// ========== 9) Calma, Calabreso · melhor passar a LANE PHASE ==========
export const LACalma: React.FC<{ life: number; memeAt?: number; memeEndAt?: number; melhorAt?: number; laneAt?: number; dlAt?: number }> = ({ life, memeAt = 0, memeEndAt = 54, melhorAt = 65, laneAt = 96, dlAt = 126 }) => {
  const f = useCurrentFrame();
  const ok = ease(f, laneAt + 4, 8);
  return (
    <DlRoom glow="#1d3a36">
      <Cam f={f} rx={8} z={1 + f * 0.0004}>
        <Center top={300}>
          <DlTitle f={f} at={melhorAt} size={66} c={D.dim} font={RD} ls={0.12}>
            É MUITO MELHOR PASSAR A
          </DlTitle>
        </Center>
        <Center top={420}>
          <div style={{ transform: `scale(${1 + punch(f, [laneAt], 0.08)})` }}>
            <DlTitle f={f} at={laneAt} size={120} c={D.soul} n={7} ls={0.04}>
              LANE PHASE
            </DlTitle>
          </div>
        </Center>
        <Center top={640}>
          <div style={{ display: "flex", alignItems: "center", gap: 26, opacity: ease(f, laneAt + 2, 8) }}>
            <div style={{ width: 600, height: 40, border: `2px solid ${D.line}`, padding: 4, background: "#060504" }}>
              <div style={{ height: "100%", width: `${ok * 100}%`, background: `linear-gradient(90deg, #1f6e63, ${D.soul})`, boxShadow: `0 0 20px ${D.soul}` }} />
            </div>
            <svg width={70} height={70} viewBox="0 0 50 50" style={{ transform: `scale(${ease(f, laneAt + 12, 6)})` }}>
              <path d="M8 26 L20 38 L42 12" fill="none" stroke={D.soul} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </Center>
        <Center top={860}>
          <Img src={MG("dl_logo.png")} style={{ width: 520, opacity: ease(f, dlAt, 10), transform: `scale(${1.15 - 0.15 * ease(f, dlAt, 10)})`, filter: "drop-shadow(0 10px 40px #000)" }} />
        </Center>
      </Cam>
      <LMeme f={f} at={memeAt} dur={memeEndAt - memeAt} src="memes/shifu.mp4" ss={0} life={life} />
    </DlRoom>
  );
};

// ========== 11) paciência · 1 contra 3 · não é inteligente · lutar a todo custo (riscado) ==========
const FOES = ["Haze", "Infernus", "Seven"];
export const LAFight: React.FC<{ life: number; pacAt?: number; foesAt?: number; intAt?: number; lutAt?: number; custoAt?: number }> = ({ life, pacAt = 17, foesAt = 35, intAt = 122, lutAt = 165, custoAt = 180 }) => {
  const f = useCurrentFrame();
  const hp = interpolate(f, [lutAt, custoAt + 20], [100, 6], { ...clamp, easing: Easing.in(Easing.quad) });
  const strike = ease(f, custoAt + 4, 8);
  return (
    <DlRoom glow="#3a1410">
      <Cam f={f} rx={8} z={1 + f * 0.0004}>
        <Center top={220}>
          <DlTitle f={f} at={pacAt} size={84} c={D.soul} ls={0.06}>
            TENHA PACIÊNCIA
          </DlTitle>
        </Center>
        {/* o Lash sozinho contra três */}
        <div style={{ position: "absolute", left: 80, top: 400, opacity: ease(f, 0, 10) }}>
          <div style={{ width: 280, height: 380, overflow: "hidden", border: `3px solid ${D.amber}`, boxShadow: `0 0 30px ${D.amber}55`, filter: hp < 20 ? "grayscale(0.7)" : undefined }}>
            <Img src={LA("la/Lash_card.png")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <div style={{ marginTop: 14, width: 280, height: 28, border: `2px solid ${D.line}`, padding: 3, background: "#060504" }}>
            <div style={{ height: "100%", width: `${hp}%`, background: hp < 30 ? D.red : D.green }} />
          </div>
        </div>
        <div style={{ position: "absolute", left: 400, top: 570, fontFamily: RV, fontWeight: 700, fontSize: 70, color: D.cream, opacity: ease(f, foesAt, 8) }}>×</div>
        {FOES.map((h, i) => {
          const at = foesAt + i * 8;
          const on = ease(f, at, 9);
          return (
            <div key={h} style={{ position: "absolute", left: 500 + i * 170, top: 420 + (i % 2) * 60, width: 190, height: 258, overflow: "hidden", border: `3px solid ${D.red}`, opacity: on, transform: `translateX(${(1 - on) * 120}px) rotate(${(i - 1) * 3}deg)` }}>
              <Img src={HERO[h]} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          );
        })}
        <Center top={870}>
          <DlTitle f={f} at={intAt} size={64} c={D.dim} font={RD} ls={0.12}>
            NÃO É INTELIGENTE
          </DlTitle>
        </Center>
        <Center top={980}>
          <div style={{ position: "relative" }}>
            <DlTitle f={f} at={lutAt} size={74} c={D.cream} ls={0.03}>
              LUTAR A TODO CUSTO
            </DlTitle>
            {f >= custoAt + 4 ? <div style={{ position: "absolute", left: -20, top: "48%", height: 12, width: `calc(${strike * 100}% + 40px)`, background: D.red, boxShadow: `0 0 20px ${D.red}`, transform: "rotate(-3deg)" }} /> : null}
          </div>
        </Center>
      </Cam>
    </DlRoom>
  );
};

// ========== 12) kill não é tão importante · subir de rank · evitando morrer ==========
const RANKS = ["Rank_Initiate_Badge", "Rank_Alchemist_Badge", "Rank_Arcanist_Badge", "Rank_Ascendant_Badge"];
const RNAME = ["INICIADO", "ALQUIMISTA", "ARCANISTA", "ASCENDENTE"];
export const LAScore: React.FC<{ life: number; killAt?: number; impAt?: number; rankAt?: number; evitAt?: number }> = ({ life, killAt = 2, impAt = 24, rankAt = 136, evitAt = 184 }) => {
  const f = useCurrentFrame();
  const kDim = ease(f, impAt, 10);
  const ri = f < rankAt ? 0 : Math.min(3, 1 + Math.floor((f - rankAt) / 8));
  const dGlow = ease(f, evitAt, 8);
  const COLS = [
    ["ABATES", "4", killAt],
    ["MORTES", "0", evitAt],
    ["ASSIST.", "17", -1],
    ["ALMAS", "52,3K", -1],
  ] as const;
  return (
    <DlRoom glow="#2a2414">
      <Cam f={f} rx={8} z={1 + f * 0.0004}>
        <Center top={220}>
          <DlTitle f={f} at={0} size={50} ls={0.16} font={RD} c={D.dim}>
            PLACAR
          </DlTitle>
        </Center>
        <Center top={310}>
          <DlPanel w={960} style={{ display: "flex", padding: "28px 10px" }}>
            {COLS.map(([t, v, at], i) => {
              const isK = i === 0;
              const isD = i === 1;
              const o = isK ? 1 - kDim * 0.7 : 1;
              return (
                <div key={t} style={{ flex: 1, textAlign: "center", opacity: o }}>
                  <div style={{ fontFamily: RD, fontWeight: 700, fontSize: 26, letterSpacing: 4, color: isD && dGlow > 0 ? D.green : D.dim }}>{t}</div>
                  <div style={{ position: "relative", fontFamily: RV, fontWeight: 700, fontSize: isD ? 96 + dGlow * 30 : 96, lineHeight: 1.1, color: isD && dGlow > 0 ? D.green : D.cream, textShadow: isD && dGlow > 0 ? `0 0 ${40 * dGlow}px ${D.green}` : undefined, transform: `scale(${isK && f >= killAt && f < impAt ? 1.08 : 1 + (isD ? punch(f, [evitAt], 0.15) : 0)})` }}>
                    {v}
                    {isK && kDim > 0 ? <div style={{ position: "absolute", left: "20%", right: "20%", top: "50%", height: 7, background: D.red, transform: `scaleX(${kDim})` }} /> : null}
                  </div>
                  {void at}
                </div>
              );
            })}
          </DlPanel>
        </Center>
        <Center top={540}>
          <DlTitle f={f} at={impAt} size={46} c={D.red} font={RD} ls={0.1}>
            KILL NÃO É TÃO IMPORTANTE
          </DlTitle>
        </Center>
        {/* rank subindo */}
        {f >= rankAt - 12 ? (
          <Center top={660}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", opacity: ease(f, rankAt - 12, 10) }}>
              <div style={{ width: 380, height: 330, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${1 + punch(f, [rankAt, rankAt + 8, rankAt + 16], 0.08, 8)})` }}>
                <Img src={LA(`la/${RANKS[ri]}.png`)} style={{ maxWidth: 380, maxHeight: 330, objectFit: "contain", filter: `drop-shadow(0 0 ${20 + ri * 10}px ${D.amber}88)` }} />
              </div>
              <div style={{ fontFamily: RV, fontWeight: 700, fontSize: 64, color: D.amber, letterSpacing: 4 }}>{RNAME[ri]}</div>
            </div>
          </Center>
        ) : null}
        <Center top={1150}>
          <DlTitle f={f} at={evitAt} size={76} c={D.green} ls={0.05}>
            EVITANDO MORRER
          </DlTitle>
        </Center>
      </Cam>
    </DlRoom>
  );
};

// ========== 14) top 2, top 3 de almas · não morro · vantagem pro late game · momento decisivo ==========
const BOARD = [
  ["Haze", "41.2K", "2"],
  ["BLIES", "38.9K", "0"],
  ["Infernus", "36.0K", "3"],
  ["Seven", "31.4K", "5"],
  ["Rem", "27.8K", "4"],
] as const;
export const LASouls: React.FC<{ life: number; topAt?: number; morroAt?: number; vantAt?: number; lateAt?: number; decAt?: number }> = ({ life, topAt = 26, morroAt = 132, vantAt = 230, lateAt = 266, decAt = 296 }) => {
  const f = useCurrentFrame();
  const out = io(f, vantAt - 10, 16);
  const gp = interpolate(f, [vantAt, decAt + 20], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const pts = Array.from({ length: 41 }).map((_, i) => {
    const x = i / 40;
    const y = 0.08 + x * 0.25 + Math.pow(x, 2.6) * 0.62 + Math.sin(i * 1.7) * 0.012;
    return [60 + x * 840, 520 - y * 460] as const;
  });
  const shown = pts.slice(0, Math.max(2, Math.round(gp * 40) + 1));
  return (
    <DlRoom glow="#1d3a36">
      <Cam f={f} rx={8} z={1 + f * 0.0003}>
        <div style={{ position: "absolute", inset: 0, opacity: 1 - out, transform: `translateY(${-out * 300}px)` }}>
          <Center top={220}>
            <DlTitle f={f} at={0} size={50} ls={0.16} font={RD} c={D.dim}>
              ALMAS DA PARTIDA
            </DlTitle>
          </Center>
          <Center top={310}>
            <DlPanel w={960}>
              {BOARD.map(([h, s, d], i) => {
                const me = h === "BLIES";
                const on = ease(f, 2 + i * 4, 8);
                const hot = me && f >= topAt;
                return (
                  <div key={h} style={{ display: "flex", alignItems: "center", gap: 24, height: 128, padding: "0 30px", borderBottom: `1px solid ${D.line}`, opacity: on, background: hot ? "linear-gradient(90deg, rgba(232,163,61,0.22), rgba(0,0,0,0))" : undefined, transform: `scale(${hot ? 1 + punch(f, [topAt], 0.04) : 1})` }}>
                    <div style={{ width: 60, fontFamily: RV, fontWeight: 700, fontSize: 52, color: hot ? D.amber : D.dim }}>{i + 1}</div>
                    <div style={{ width: 80, height: 96, overflow: "hidden", border: `2px solid ${hot ? D.amber : D.line}`, borderRadius: me ? 48 : 0 }}>
                      <Img src={me ? DL_("blies.jpg") : HERO[h]} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                    <div style={{ flex: 1, fontFamily: RD, fontWeight: 700, fontSize: 38, color: hot ? D.cream : D.dim }}>{h.toUpperCase()}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: RD, fontWeight: 700, fontSize: 40, color: D.soul }}>
                      <Img src={WK("Souls_icon.png")} style={{ width: 40, height: 40 }} />
                      {s}
                    </div>
                    <div style={{ width: 130, textAlign: "right", fontFamily: RD, fontWeight: 700, fontSize: 30, color: me && f >= morroAt ? D.green : D.dim, transform: `scale(${me ? 1 + punch(f, [morroAt], 0.3) : 1})` }}>
                      {d} <span style={{ fontSize: 22 }}>MORTES</span>
                    </div>
                  </div>
                );
              })}
            </DlPanel>
          </Center>
          <Center top={1000}>
            <DlTitle f={f} at={topAt} size={96} c={D.amber} ls={0.05}>
              TOP 2, TOP 3
            </DlTitle>
          </Center>
          <Center top={1130}>
            <DlTitle f={f} at={morroAt} size={60} c={D.green} font={RD} ls={0.1}>
              PORQUE EU NÃO MORRO
            </DlTitle>
          </Center>
        </div>
        {/* vantagem até o late game */}
        {f >= vantAt - 10 ? (
          <div style={{ position: "absolute", left: 60, top: 320, width: 960, opacity: out, transform: `translateY(${(1 - out) * 200}px)` }}>
            <DlTitle f={f} at={vantAt} size={70} ls={0.06}>
              CRIAR VANTAGEM
            </DlTitle>
            <DlPanel w={960} h={600} style={{ marginTop: 30 }}>
              <svg width={960} height={600} style={{ position: "absolute", inset: 0 }}>
                <rect x={60 + 840 * 0.62} y={40} width={840 * 0.38} height={480} fill={D.amber} opacity={0.12 * ease(f, lateAt, 10)} />
                <polyline points={shown.map((p) => p.join(",")).join(" ")} fill="none" stroke={D.soul} strokeWidth={8} strokeLinejoin="round" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 10px ${D.soul})` }} />
                {f >= decAt ? <circle cx={shown[shown.length - 1][0]} cy={shown[shown.length - 1][1]} r={18 + Math.sin(f / 4) * 4} fill={D.amber} stroke={D.cream} strokeWidth={4} /> : null}
                <line x1={60} y1={520} x2={900} y2={520} stroke={D.line} strokeWidth={3} />
              </svg>
              <div style={{ position: "absolute", left: 60, right: 60, bottom: 20, display: "flex", fontFamily: RD, fontWeight: 700, fontSize: 26, letterSpacing: 4, color: D.dim }}>
                <span style={{ width: "30%" }}>EARLY</span>
                <span style={{ width: "32%" }}>MID</span>
                <span style={{ color: f >= lateAt ? D.amber : D.dim }}>LATE GAME</span>
              </div>
            </DlPanel>
            <div style={{ marginTop: 40, display: "flex", justifyContent: "center" }}>
              <DlTitle f={f} at={decAt} size={72} c={D.amber} ls={0.05}>
                MOMENTO DECISIVO
              </DlTitle>
            </div>
          </div>
        ) : null}
      </Cam>
    </DlRoom>
  );
};

// ========== 15) Rat King: quase 90 mil… 83 · segunda maior alma · morri uma vez ==========
export const LARat: React.FC<{ life: number; ratAt?: number; almasAt?: number; milAt?: number; oitentaAt?: number; segAt?: number; morriAt?: number }> = ({ life, ratAt = 37, almasAt = 185, milAt = 229, oitentaAt = 270, segAt = 319, morriAt = 379 }) => {
  const f = useCurrentFrame();
  const fixed = f >= oitentaAt;
  const cnt = fixed ? interpolate(f, [oitentaAt, oitentaAt + 14], [90000, 83412], { ...clamp, easing: Easing.out(Easing.cubic) }) : interpolate(f, [almasAt, milAt + 8], [0, 90000], { ...clamp, easing: Easing.out(Easing.cubic) });
  const r = ease(f, ratAt - 6, 16);
  return (
    <DlRoom glow="#3a1a14">
      <div style={{ position: "absolute", left: -330, top: 160, width: 1500, opacity: r * 0.95, transform: `translateY(${(1 - r) * 120}px) scale(${1 + f * 0.0002})` }}>
        <Img src={DL_("Rat_King_Render.png")} style={{ width: 1500, filter: "drop-shadow(0 20px 60px #000)" }} />
      </div>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(11,10,8,0) 32%, rgba(11,10,8,0.96) 56%)" }} />
      <Cam f={f} rx={6} z={1}>
        <Center top={620}>
          <DlTitle f={f} at={ratAt} size={110} c={D.amber} ls={0.06}>
            RAT KING
          </DlTitle>
        </Center>
        {f >= almasAt - 8 ? (
          <Center top={760}>
            <DlPanel w={900} style={{ padding: "26px 40px", opacity: ease(f, almasAt - 8, 10) }}>
              <Label f={f} at={almasAt - 8} c={D.dim}>
                ALMAS NO FIM DA PARTIDA
              </Label>
              <div style={{ display: "flex", alignItems: "center", gap: 22, marginTop: 6 }}>
                <Img src={WK("Souls_icon.png")} style={{ width: 90, height: 90 }} />
                <div style={{ position: "relative", fontFamily: RV, fontWeight: 700, fontSize: 130, lineHeight: 1.05, color: D.soul, fontVariantNumeric: "tabular-nums", textShadow: `0 0 40px ${D.soul}66`, transform: `scale(${1 + punch(f, [milAt, oitentaAt], 0.06)})` }}>
                  {n2(Math.round(cnt))}
                </div>
                {fixed && f < oitentaAt + 40 ? (
                  <div style={{ fontFamily: RD, fontWeight: 700, fontSize: 40, color: D.red, opacity: 1 - ease(f, oitentaAt + 26, 12), textDecoration: "line-through" }}>90.000</div>
                ) : null}
              </div>
            </DlPanel>
          </Center>
        ) : null}
        <Center top={1020}>
          <div style={{ display: "flex", gap: 24 }}>
            {f >= segAt ? (
              <DlPanel w={440} c={D.amber} style={{ padding: "18px 0", textAlign: "center", opacity: ease(f, segAt, 8), transform: `translateY(${(1 - ease(f, segAt, 10)) * 40}px)` }}>
                <div style={{ fontFamily: RV, fontWeight: 700, fontSize: 70, color: D.amber, lineHeight: 1.05 }}>2º</div>
                <div style={{ fontFamily: RD, fontWeight: 700, fontSize: 26, letterSpacing: 3, color: D.cream }}>MAIOR ALMA DO JOGO</div>
              </DlPanel>
            ) : null}
            {f >= morriAt ? (
              <DlPanel w={440} c={D.red} style={{ padding: "18px 0", textAlign: "center", opacity: ease(f, morriAt, 8), transform: `translateY(${(1 - ease(f, morriAt, 10)) * 40}px)` }}>
                <div style={{ fontFamily: RV, fontWeight: 700, fontSize: 70, color: D.red, lineHeight: 1.05 }}>1</div>
                <div style={{ fontFamily: RD, fontWeight: 700, fontSize: 26, letterSpacing: 3, color: D.cream }}>MORTE SÓ</div>
              </DlPanel>
            ) : null}
          </div>
        </Center>
      </Cam>
    </DlRoom>
  );
};

// ========== 15b) build imortal do rato · POSICIONAMENTO ==========
// a build real dele (print do jogo, 10/11): ordem e tier iguais ao painel de itens; GE é espiritual (selo roxo)
const BUILD: [string, string, boolean][] = [
  ["Healing_Nova", "III", false],
  ["Spirit_Resilience", "III", false],
  ["Fortitude", "III", false],
  ["Vampiric_Burst", "IV", false],
  ["Spellbreaker", "IV", false],
  ["Witchmail", "IV", false],
  ["Stamina_Mastery", "III", false],
  ["Greater_Expansion", "III", true],
  ["Unstoppable", "IV", false],
  ["Juggernaut", "IV", false],
  ["Colossus", "IV", false],
  ["Cheat_Death", "IV", false],
];
export const LABuild: React.FC<{ life: number; buildAt?: number; imortalAt?: number; posAt?: number }> = ({ life, buildAt = 22, imortalAt = 30, posAt = 134 }) => {
  const f = useCurrentFrame();
  const dimI = ease(f, posAt - 20, 14);
  const val = Math.round(interpolate(f, [buildAt - 8, buildAt + 40], [0, 60800], { ...clamp, easing: Easing.out(Easing.cubic) }) / 100) * 100;
  return (
    <DlRoom glow="#1d3a36">
      <div style={{ position: "absolute", left: 120, top: 120, width: 1100, opacity: 0.22 * (1 - dimI), filter: "blur(2px)" }}>
        <Img src={DL_("Rat_King_Render.png")} style={{ width: 1100 }} />
      </div>
      <Cam f={f} rx={8} z={1 + f * 0.0004}>
        <div style={{ opacity: 1 - dimI * 0.75, filter: dimI > 0 ? `blur(${dimI * 3}px)` : undefined }}>
          <Center top={220}>
            <DlTitle f={f} at={imortalAt} size={100} c={D.soul} ls={0.05}>
              BUILD IMORTAL
            </DlTitle>
          </Center>
          {/* painel de itens do jogo: valor + 2 fileiras de 6 */}
          <div style={{ position: "absolute", left: 60, top: 380, width: 960, opacity: ease(f, buildAt - 10, 8) }}>
            <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 22, paddingLeft: 6 }}>
              <div style={{ width: 70, height: 70, borderRadius: 35, background: "#1f5c50", border: `4px solid ${D.soul}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: RD, fontWeight: 700, fontSize: 36, color: D.cream }}>0</div>
              <Img src={WK("Souls_icon.png")} style={{ width: 56, height: 56 }} />
              <span style={{ fontFamily: RD, fontWeight: 700, fontSize: 70, color: D.soul, fontVariantNumeric: "tabular-nums", textShadow: `0 0 24px ${D.soul}55` }}>{n2(val)}</span>
              <span style={{ fontFamily: RD, fontWeight: 700, fontSize: 28, letterSpacing: 3, color: D.soul, opacity: 0.8 }}>EM ITENS</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 150px)", gap: 12 }}>
              {BUILD.map(([it, tier, spirit], i) => {
                const at = buildAt - 8 + i * 3;
                const on = ease(f, at, 8);
                return (
                  <div key={it} style={{ position: "relative", width: 150, height: 150, borderRadius: 14, overflow: "hidden", background: "#121410", border: `3px solid ${D.line}`, opacity: on, transform: `translateY(${(1 - on) * 40}px) scale(${0.85 + 0.15 * on + punch(f, [at + 6], 0.06, 6)})`, boxShadow: "0 14px 30px rgba(0,0,0,0.7)" }}>
                    <Img src={LA(`la/items/${it}.png`)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <div style={{ position: "absolute", right: 0, top: 0, width: 58, height: 58, background: spirit ? "#b07be8" : "#7cc04a", clipPath: "polygon(0 0, 100% 0, 100% 100%)" }} />
                    <div style={{ position: "absolute", right: 5, top: 2, fontFamily: RD, fontWeight: 700, fontSize: 22, color: "#0b0a08" }}>{tier}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <Center top={880}>
          <div style={{ transform: `scale(${1 + punch(f, [posAt], 0.08)})` }}>
            <DlTitle f={f} at={posAt} size={90} c={D.amber} n={7} ls={0.03}>
              POSICIONAMENTO
            </DlTitle>
          </div>
        </Center>
      </Cam>
    </DlRoom>
  );
};

// ========== 16) a única vez: duvidei (ATREVIDO) · praticamente imortal · morri · 1 morte · sem isso, 0 ==========
export const LADeath: React.FC<{ life: number; duvAt?: number; imortalAt?: number; morriAt?: number; morteAt?: number; zeroAt?: number }> = ({ life, duvAt = 76, imortalAt = 198, morriAt = 256, morteAt = 296, zeroAt = 381 }) => {
  const f = useCurrentFrame();
  const dead = f >= morriAt;
  const shield = f < morriAt ? ease(f, imortalAt - 10, 14) : 1 - ease(f, morriAt, 6);
  const sh = shake(f, morriAt, 20, 12, "rd");
  return (
    <DlRoom glow={dead ? "#2a0c08" : "#1d3a36"}>
      <Cam f={f} rx={6} z={1 + f * 0.0003} x={sh.x} y={sh.y}>
        <Center top={220}>
          <DlTitle f={f} at={0} size={70} c={D.dim} font={RD} ls={0.12}>
            A ÚNICA VEZ
          </DlTitle>
        </Center>
        <Center top={360}>
          <div style={{ position: "relative", width: 380, height: 516 }}>
            {/* escudo de alma (imortal) */}
            {shield > 0 ? <div style={{ position: "absolute", inset: -50, borderRadius: "50%", border: `6px solid ${D.soul}`, background: `radial-gradient(circle, rgba(95,242,214,0.0) 50%, rgba(95,242,214,${0.25 * shield}) 100%)`, opacity: shield, boxShadow: `0 0 ${80 * shield}px ${D.soul}`, transform: `scale(${dead ? 1 + ease(f, morriAt, 8) * 0.4 : 1 + Math.sin(f / 6) * 0.02})` }} /> : null}
            <div style={{ position: "absolute", inset: 0, overflow: "hidden", border: `3px solid ${dead ? D.red : D.amber}`, filter: dead ? `grayscale(${ease(f, morriAt, 8)}) brightness(${1 - ease(f, morriAt, 8) * 0.45})` : undefined }}>
              <Img src={DL_("Rat_King_card.png")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            {/* ATREVIDO */}
            <div style={{ position: "absolute", left: -60, right: -60, top: 210, display: "flex", justifyContent: "center", zIndex: 5, opacity: dead ? 1 - ease(f, morriAt, 8) : 1 }}>
              <Stamp f={f} at={duvAt} text="ATREVIDO" size={96} rot={-9} c={D.amber} />
            </div>
            {dead ? (
              <div style={{ position: "absolute", left: 0, right: 0, top: 190, display: "flex", justifyContent: "center", zIndex: 6, transform: `scale(${interpolate(f, [morriAt, morriAt + 5], [1.8, 1], clamp)})` }}>
                <Skull s={150} />
              </div>
            ) : null}
          </div>
        </Center>
        <Center top={960}>
          {dead ? (
            <DlTitle f={f} at={morriAt} size={110} c={D.red} n={6} ls={0.05}>
              MORRI.
            </DlTitle>
          ) : (
            <DlTitle f={f} at={imortalAt} size={66} c={D.soul} ls={0.04}>
              PRATICAMENTE IMORTAL
            </DlTitle>
          )}
        </Center>
        {f >= morteAt ? (
          <Center top={1110}>
            <div style={{ display: "flex", gap: 24, opacity: ease(f, morteAt, 8) }}>
              <DlPanel w={360} c={D.red} style={{ padding: "12px 0", textAlign: "center" }}>
                <div style={{ fontFamily: RD, fontWeight: 700, fontSize: 26, letterSpacing: 4, color: D.dim }}>MORTES</div>
                <div style={{ fontFamily: RV, fontWeight: 700, fontSize: 70, color: D.red, lineHeight: 1.05 }}>1</div>
              </DlPanel>
              {f >= zeroAt ? (
                <DlPanel w={420} c={D.green} style={{ padding: "12px 0", textAlign: "center", opacity: ease(f, zeroAt, 8), transform: `translateX(${(1 - ease(f, zeroAt, 10)) * 60}px)` }}>
                  <div style={{ fontFamily: RD, fontWeight: 700, fontSize: 26, letterSpacing: 4, color: D.dim }}>SEM ESSA</div>
                  <div style={{ fontFamily: RV, fontWeight: 700, fontSize: 70, color: D.green, lineHeight: 1.05 }}>0</div>
                </DlPanel>
              ) : null}
            </div>
          </Center>
        ) : null}
      </Cam>
      <Flash f={f} ts={[morriAt]} pk={0.28} c="#ff2a1f" />
    </DlRoom>
  );
};

// ========== 17) senta e joga tranquilinho · a recompensa no late (e até no mid) ==========
export const LAChair: React.FC<{ life: number; sentaAt?: number; tranqAt?: number; recAt?: number; lateAt?: number; midAt?: number }> = ({ life, sentaAt = 16, tranqAt = 95, recAt = 160, lateAt = 209, midAt = 243 }) => {
  const f = useCurrentFrame();
  const mk = interpolate(f, [tranqAt, lateAt], [0.04, 0.82], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const lateOn = ease(f, lateAt, 8);
  const midOn = ease(f, midAt, 8);
  return (
    <DlRoom glow="#2a2414">
      <Cam f={f} rx={8} z={1 + f * 0.0003}>
        <Center top={220}>
          <DlTitle f={f} at={sentaAt} size={76} ls={0.04}>
            SENTA NA CADEIRA
          </DlTitle>
        </Center>
        <Center top={330}>
          <DlTitle f={f} at={tranqAt} size={64} c={D.soul} font={RD} ls={0.1}>
            E JOGA TRANQUILINHO
          </DlTitle>
        </Center>
        <div style={{ position: "absolute", left: 90, top: 640, width: 900, opacity: ease(f, sentaAt + 10, 12) }}>
          <div style={{ position: "relative", height: 60, border: `2px solid ${D.line}`, background: "#060504" }}>
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${mk * 100}%`, background: `linear-gradient(90deg, #3a2a14, ${D.amber})` }} />
            {["30%", "62%"].map((x) => (
              <div key={x} style={{ position: "absolute", left: x, top: -8, bottom: -8, width: 3, background: D.cream, opacity: 0.5 }} />
            ))}
          </div>
          <div style={{ display: "flex", marginTop: 14, fontFamily: RD, fontWeight: 700, fontSize: 28, letterSpacing: 4, color: D.dim }}>
            <span style={{ width: "30%" }}>EARLY</span>
            <span style={{ width: "32%", color: midOn > 0 ? D.amber : D.dim }}>MID</span>
            <span style={{ color: lateOn > 0 ? D.amber : D.dim }}>LATE</span>
          </div>
          {/* recompensas caindo nas fases */}
          {[
            [lateAt, 0.81, 200, 1],
            [midAt, 0.46, 140, midOn],
          ].map(([at, x, s, o]) =>
            f >= recAt && (at === lateAt || f >= at) ? (
              <div key={at} style={{ position: "absolute", left: `calc(${(x as number) * 100}% - ${(s as number) / 2}px)`, top: -(s as number) - 50, opacity: at === lateAt ? ease(f, recAt, 10) : (o as number), transform: `translateY(${f >= (at as number) ? 0 : -30}px) scale(${1 + punch(f, [at as number], 0.2)})` }}>
                <Img src={WK("Souls_icon.png")} style={{ width: s as number, height: s as number, filter: `drop-shadow(0 0 ${f >= (at as number) ? 40 : 10}px ${D.soul})` }} />
              </div>
            ) : null,
          )}
        </div>
        <Center top={900}>
          <DlTitle f={f} at={recAt} size={96} c={D.soul} ls={0.05}>
            RECOMPENSA
          </DlTitle>
        </Center>
      </Cam>
    </DlRoom>
  );
};

// ========== 18) pica-Lash, fica de boa · você vai brilhar quando pegar a ult ==========
export const LAUlt: React.FC<{ life: number; lashAt?: number; boaAt?: number; brilharAt?: number; ultAt?: number }> = ({ life, lashAt = 21, boaAt = 59, brilharAt = 85, ultAt = 119 }) => {
  const f = useCurrentFrame();
  const open = f >= ultAt;
  const charge = ease(f, brilharAt, ultAt - brilharAt);
  const burst = ease(f, ultAt, 18);
  return (
    <DlRoom glow={open ? "#1d3a36" : "#2a1430"}>
      <div style={{ position: "absolute", left: -260, top: 120, width: 1600, opacity: ease(f, 0, 14), transform: `scale(${1 + f * 0.0004})` }}>
        <Img src={LA("la/Lash_Render.png")} style={{ width: 1600, filter: `drop-shadow(0 20px 60px #000) brightness(${0.75 + burst * 0.35})` }} />
      </div>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(11,10,8,0) 38%, rgba(11,10,8,0.96) 60%)" }} />
      <Cam f={f} rx={6} z={1 + punch(f, [ultAt], 0.05)}>
        <Center top={230}>
          <DlTitle f={f} at={lashAt} size={120} c={D.amber} ls={0.05}>
            PICA-LASH,
          </DlTitle>
        </Center>
        <Center top={392}>
          <DlTitle f={f} at={boaAt} size={70} ls={0.08}>
            FICA DE BOA
          </DlTitle>
        </Center>
        <Center top={850}>
          <div style={{ display: "flex", gap: 30 }}>
            {ABIL.map(([img, k], i) => (
              <div key={k} style={{ position: "relative" }}>
                {i === 3 && open ? <div style={{ position: "absolute", left: 75 - 200 * burst, top: 75 - 200 * burst, width: 400 * burst, height: 400 * burst, borderRadius: "50%", border: `5px solid ${D.soul}`, opacity: 1 - burst }} /> : null}
                <Ability img={LA(img)} size={150} k={i === 3 ? "ULT" : k} locked={i === 3 && !open} glow={i === 3 ? (open ? 0.6 + Math.sin(f / 5) * 0.2 : charge * 0.5) : 0} />
              </div>
            ))}
          </div>
        </Center>
        <Center top={1110}>
          <DlTitle f={f} at={brilharAt} size={82} c={D.soul} ls={0.04}>
            VOCÊ VAI BRILHAR
          </DlTitle>
        </Center>
      </Cam>
      <Flash f={f} ts={[ultAt]} pk={0.2} c="#9ffff0" />
    </DlRoom>
  );
};

void random;
