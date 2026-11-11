// =================================================================================================
// HL3 · REFORMULAÇÃO · módulo 7 (parte 2) (06/10/2026)
//  HLRUniverseTime (mode 1/2) · HLRVersionsCarve (mode 1/2) · HLRXenLeakDiagram (mode 1/2) · HLRCoastTerminal ·
//  HLRBarneyBlock · HLRGestureScale · HLRFleetRoute · HLRMaskSlider
// =================================================================================================
import React, { useMemo } from "react";
import { AbsoluteFill, Easing, interpolate, staticFile, useCurrentFrame } from "remotion";
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
type Pr = { life: number; mode?: number } & Record<string, number | undefined>;
const ks = (p: Pr, keys: string[]) => keys.map((k) => (p[k] as number | undefined) ?? 1e9);
const Head: React.FC<{ t: string; s?: string; c?: string; o?: number }> = ({ t, s, c = ICE, o = 1 }) => (
  <div style={{ position: "absolute", left: 80, top: 60, fontFamily: MONO, letterSpacing: 6, opacity: o }}>
    <div style={{ fontSize: 20, color: c }}>{t}</div>
    {s ? <div style={{ fontSize: 15, color: "rgba(242,240,247,0.6)", marginTop: 6 }}>{s}</div> : null}
  </div>
);
const Big: React.FC<{ k: string; t: string; c?: string; o: number; right?: boolean; top?: number; size?: number }> = ({ k, t, c = CREAM, o, right, top = 60, size = 64 }) => (
  <div style={{ position: "absolute", [right ? "right" : "left"]: 90, top, textAlign: right ? "right" : "left", opacity: o } as React.CSSProperties}>
    <div style={{ fontFamily: MONO, fontSize: 16, letterSpacing: 6, color: c }}>{k}</div>
    <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: size, color: TXT, lineHeight: 1.03 }}>{t}</div>
  </div>
);
const Shell: React.FC<{ f: number; life: number; bg?: string; children: React.ReactNode }> = ({ f, life, bg = "radial-gradient(ellipse at 50% 45%, #10161c 0%, #040608 78%)", children }) => (
  <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
    {children}
    <AbsoluteFill style={{ background: "#000", opacity: fade(f, life), pointerEvents: "none" }} />
    <FilmLook />
  </AbsoluteFill>
);

// ---------------------------------------------------------------- universo × linha do tempo
// 09/10 (pedido dele: "Terra, Xen, Overworld na linha temporal tá muito mal feito, mais específico") — refeito:
// UMA REALIDADE = uma esfera de vidro girando em 3D, com os mundos de verdade dentro (Terra azul com continentes e nuvens,
// Xen = nebulosa do HL1 com as ilhas, Overworld = planeta escuro com a malha de luzes Combine, outros mundos "?"),
// ligados por fios de portal; a esfera corre sobre a SUA linha do tempo. "Linha alternativa = outra versão da realidade
// INTEIRA": a esfera inteira se ramifica para uma segunda linha (cópia com pequenas diferenças). O observatório mostra os
// mundos conectados; os Combine (naves) correm pelos fios. Modo 2 (regra 6): a malha Combine toma os mundos da esfera A;
// uma nave tenta ir para a esfera B, bate na parede da própria realidade e volta.
type UWorld = { k: string; name: string; sub: string; r: number; th: number; yy: number; size: number };
const UWORLDS: UWorld[] = [
  { k: "terra", name: "TERRA", sub: "o nosso mundo", r: 0.56, th: 0.3, yy: -0.26, size: 0.25 },
  { k: "xen", name: "XEN", sub: "a fronteira entre mundos", r: 0.56, th: 2.4, yy: 0.08, size: 0.27 },
  { k: "over", name: "OVERWORLD", sub: "a dimensão de origem dos Combine", r: 0.54, th: 4.3, yy: -0.02, size: 0.25 },
  { k: "q1", name: "?", sub: "", r: 0.42, th: 1.4, yy: 0.46, size: 0.12 },
  { k: "q2", name: "?", sub: "", r: 0.46, th: 5.4, yy: 0.42, size: 0.11 },
];
const ULINKS: [number, number][] = [[0, 1], [1, 2], [0, 2], [1, 3], [2, 4], [0, 4]];
const UPlanet: React.FC<{ k: string; x: number; y: number; r: number; f: number; id: string; alt?: boolean; net?: number }> = ({ k, x, y, r, f, id, alt, net = 0 }) => {
  const spin = f * 0.6;
  return (
    <g>
      <defs>
        <clipPath id={`uc${id}`}>
          <circle cx={x} cy={y} r={r} />
        </clipPath>
        <radialGradient id={`us${id}`} cx="0.35" cy="0.32" r="0.8">
          <stop offset="0" stopColor="rgba(255,255,255,0.0)" />
          <stop offset="0.7" stopColor="rgba(0,0,0,0.25)" />
          <stop offset="1" stopColor="rgba(0,0,0,0.85)" />
        </radialGradient>
      </defs>
      {k === "terra" ? (
        <g clipPath={`url(#uc${id})`}>
          <circle cx={x} cy={y} r={r} fill={alt ? "#3a6aa8" : "#2b62b8"} />
          {[[-0.4, -0.2, 0.42, 0.3], [0.2, 0.25, 0.5, 0.26], [0.5, -0.35, 0.3, 0.22], [-0.1, 0.6, 0.35, 0.16]].map(([dx, dy, w, h], i) => {
            const cx = x + (((dx * r + spin * (r / 60) + r * 3) % (r * 3)) - r * 1.5) * 1.0;
            return <ellipse key={i} cx={cx} cy={y + dy * r} rx={w * r} ry={h * r} fill={alt && i === 1 ? "#8a7a4a" : "#3f8a4a"} opacity={0.95} transform={`rotate(${i * 23} ${cx} ${y + dy * r})`} />;
          })}
          {[0, 1, 2].map((i) => <ellipse key={"n" + i} cx={x + (((i * 0.7 * r + spin * (r / 40)) % (r * 2.6)) - r * 1.3)} cy={y + (i - 1) * r * 0.45} rx={r * 0.5} ry={r * 0.09} fill="rgba(255,255,255,0.55)" />)}
        </g>
      ) : k === "xen" ? (
        <g clipPath={`url(#uc${id})`}>
          <circle cx={x} cy={y} r={r} fill="#3a2246" />
          <image href={staticFile("hl3/nebula_2.png")} x={x - r * 1.6 + Math.sin(f / 90) * r * 0.2} y={y - r * 1.2} width={r * 3.2} height={r * 2.4} preserveAspectRatio="xMidYMid slice" opacity={0.95} />
          {[[-0.4, 0.15, 0.22], [0.25, -0.1, 0.3], [0.1, 0.45, 0.16]].map(([dx, dy, s], i) => (
            <path key={i} d={`M ${x + dx * r - s * r} ${y + dy * r} L ${x + dx * r + s * r} ${y + dy * r} L ${x + dx * r} ${y + dy * r + s * r * 1.1} Z M ${x + dx * r} ${y + dy * r} l 0 ${-s * r * 0.9}`} fill="#4a3a30" stroke="#ffb36b" strokeWidth={Math.max(1, r * 0.02)} />
          ))}
        </g>
      ) : k === "over" ? (
        <g clipPath={`url(#uc${id})`}>
          <circle cx={x} cy={y} r={r} fill="#1a2024" />
          {Array.from({ length: 7 }).map((_, i) => <ellipse key={i} cx={x} cy={y} rx={r * (0.15 + i * 0.14)} ry={r} fill="none" stroke="rgba(95,243,255,0.35)" strokeWidth={1} transform={`translate(${((spin * 0.4) % (r * 0.3))} 0)`} />)}
          {Array.from({ length: 5 }).map((_, i) => <line key={"h" + i} x1={x - r} x2={x + r} y1={y - r * 0.8 + i * r * 0.4} y2={y - r * 0.8 + i * r * 0.4} stroke="rgba(95,243,255,0.25)" strokeWidth={1} />)}
          {Array.from({ length: 14 }).map((_, i) => <circle key={"l" + i} cx={x + (rnd(i * 3) - 0.5) * r * 1.6} cy={y + (rnd(i * 7) - 0.5) * r * 1.6} r={Math.max(1.2, r * 0.03)} fill={i % 3 ? "#5ff3ff" : "#ff5d4d"} opacity={0.5 + 0.5 * Math.sin(f / 5 + i)} />)}
        </g>
      ) : (
        <circle cx={x} cy={y} r={r} fill={k === "q1" ? "#5a4a7a" : "#3a5a4a"} />
      )}
      {net > 0 ? (
        <g clipPath={`url(#uc${id})`} opacity={net}>
          {Array.from({ length: 8 }).map((_, i) => <ellipse key={i} cx={x} cy={y} rx={r * (0.12 + i * 0.12)} ry={r} fill="none" stroke="rgba(255,93,77,0.75)" strokeWidth={1.4} />)}
          {Array.from({ length: 6 }).map((_, i) => <line key={"h" + i} x1={x - r} x2={x + r} y1={y - r + i * r * 0.4} y2={y - r + i * r * 0.4} stroke="rgba(255,93,77,0.6)" strokeWidth={1.2} />)}
        </g>
      ) : null}
      <circle cx={x} cy={y} r={r} fill={`url(#us${id})`} />
      <circle cx={x} cy={y} r={r * 1.06} fill="none" stroke={k === "terra" ? "rgba(120,180,255,0.4)" : k === "xen" ? "rgba(255,179,107,0.4)" : k === "over" ? "rgba(95,243,255,0.35)" : "rgba(200,200,220,0.25)"} strokeWidth={Math.max(1.5, r * 0.08)} style={{ filter: `blur(${Math.max(1, r * 0.04)}px)` }} />
    </g>
  );
};
// a esfera de uma realidade (vidro) com os mundos dentro girando em 3D; devolve o desenho e onde ficou cada mundo
const URealm = (o: { id: string; cx: number; cy: number; R: number; f: number; rot: number; alpha: number; links: number; alt?: boolean; nets?: number[]; ships?: number; hideQ?: boolean; label?: string; labelCol?: string; showNames?: number; hit?: number }) => {
  const { id, cx, cy, R, f, rot, alpha, links, alt, nets = [], ships = 0, hideQ, label, labelCol = ICE, showNames = 0, hit = 0 } = o;
  const pos = UWORLDS.map((w, i) => {
    const a = w.th + rot;
    const z = Math.sin(a);
    const s = 1 + z * 0.22;
    return { i, w, x: cx + Math.cos(a) * w.r * R, y: cy + w.yy * R + z * R * 0.12, s, z, r: w.size * R * s };
  }).filter((p) => !(hideQ && p.w.k === "q2"));
  const sorted = [...pos].sort((a, b) => a.z - b.z);
  const P2 = (i: number) => pos.find((p) => p.i === i);
  return (
    <g opacity={alpha}>
      <defs>
        <radialGradient id={`ug${id}`} cx="0.42" cy="0.36" r="0.7">
          <stop offset="0" stopColor="rgba(159,230,255,0.10)" />
          <stop offset="0.8" stopColor="rgba(159,230,255,0.04)" />
          <stop offset="1" stopColor="rgba(159,230,255,0.16)" />
        </radialGradient>
      </defs>
      <ellipse cx={cx} cy={cy + R * 1.08} rx={R * 0.9} ry={R * 0.08} fill="rgba(0,0,0,0.5)" style={{ filter: "blur(8px)" }} />
      <circle cx={cx} cy={cy} r={R} fill={`url(#ug${id})`} stroke={hit > 0 ? `rgba(255,93,77,${0.4 + 0.6 * hit})` : "rgba(159,230,255,0.45)"} strokeWidth={2 + 3 * hit} />
      {/* anéis de latitude girando (dão volume à esfera) */}
      {[-0.5, 0, 0.5].map((v, i) => <ellipse key={i} cx={cx} cy={cy + v * R} rx={R * Math.sqrt(1 - v * v)} ry={R * 0.16 * Math.sqrt(1 - v * v)} fill="none" stroke="rgba(159,230,255,0.14)" strokeWidth={1.2} />)}
      <ellipse cx={cx} cy={cy} rx={R * Math.abs(Math.cos(rot * 0.5))} ry={R} fill="none" stroke="rgba(159,230,255,0.12)" strokeWidth={1.2} />
      {/* fios de portal entre os mundos */}
      {ULINKS.map(([a, b], i) => {
        const A = P2(a), B = P2(b);
        if (!A || !B) return null;
        const mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2 - R * 0.18;
        const on = Math.max(0, Math.min(1, links * 6 - i));
        return (
          <g key={i} opacity={on}>
            <path d={`M ${A.x} ${A.y} Q ${mx} ${my} ${B.x} ${B.y}`} fill="none" stroke="rgba(141,255,168,0.65)" strokeWidth={2} strokeDasharray="7 7" strokeDashoffset={-f * 1.2} style={{ filter: "drop-shadow(0 0 5px #4dffc0)" }} />
            {ships > 0
              ? [0, 0.5].map((ph, j) => {
                  const t = (f * 0.012 + ph + i * 0.17) % 1;
                  const bx = (1 - t) * (1 - t) * A.x + 2 * (1 - t) * t * mx + t * t * B.x;
                  const by = (1 - t) * (1 - t) * A.y + 2 * (1 - t) * t * my + t * t * B.y;
                  const tx = 2 * (1 - t) * (mx - A.x) + 2 * t * (B.x - mx), ty = 2 * (1 - t) * (my - A.y) + 2 * t * (B.y - my);
                  const ang = (Math.atan2(ty, tx) * 180) / Math.PI;
                  return <path key={j} d="M -14 -8 L 14 0 L -14 8 L -8 0 Z" fill="#ff5d4d" transform={`translate(${bx} ${by}) rotate(${ang})`} opacity={ships} style={{ filter: "drop-shadow(0 0 5px #ff5d4d)" }} />;
                })
              : null}
          </g>
        );
      })}
      {sorted.map((p) => (
        <g key={p.i}>
          <UPlanet k={p.w.k} x={p.x} y={p.y} r={p.r} f={f} id={`${id}${p.i}`} alt={alt} net={nets[p.i] ?? 0} />
          {showNames > 0 && p.w.name !== "?" ? (
            <g opacity={showNames}>
              <text x={p.x} y={p.y - p.r - 16} textAnchor="middle" fill={p.w.k === "xen" ? "#ffb36b" : p.w.k === "over" ? "#5ff3ff" : "#8fc4ff"} fontFamily={MONO} fontSize={Math.max(12, Math.min(18, R * 0.05))} letterSpacing={3}>
                {p.w.name}
              </text>
              {false && p.w.sub ? (
                <text x={p.x} y={p.y + p.r + 22} textAnchor="middle" fill="rgba(242,240,247,0.6)" fontFamily={MONO} fontSize={Math.max(10, Math.min(13, R * 0.036))} letterSpacing={2}>
                  {p.w.sub}
                </text>
              ) : null}
            </g>
          ) : p.w.name === "?" && showNames > 0 ? (
            <text x={p.x} y={p.y + 5} textAnchor="middle" fill="rgba(242,240,247,0.75)" fontFamily={MONO} fontSize={14} opacity={showNames}>?</text>
          ) : null}
        </g>
      ))}
      {/* o brilho do vidro por cima */}
      <path d={`M ${cx - R * 0.62} ${cy - R * 0.55} Q ${cx - R * 0.2} ${cy - R * 0.95} ${cx + R * 0.35} ${cy - R * 0.78}`} fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth={R * 0.04} strokeLinecap="round" />
      {label ? (
        <text x={cx} y={cy + R + 46} textAnchor="middle" fill={labelCol} fontFamily={MONO} fontSize={17} letterSpacing={5}>
          {label}
        </text>
      ) : null}
    </g>
  );
};
export const HLRUniverseTime: React.FC<Pr> = (p) => {
  const f = useCurrentFrame();
  const mode = p.mode ?? 1;
  const [realAt, altAt, wholeAt, obsAt, connAt, combAt, empireAt, notAt, leaveAt, otherAt] = ks(p, ["realAt", "altAt", "wholeAt", "obsAt", "connAt", "combAt", "empireAt", "notAt", "leaveAt", "otherAt"]);
  const rot = f / 140;
  // modo 1: uma esfera no meio → ramifica para a linha alternativa (as duas lado a lado) → volta o foco para a A
  const split = mode === 2 ? 1 : IO((f - altAt) / 40);
  const back = mode === 2 ? 0 : IO((f - obsAt) / 34);
  const AX = 960 - 430 * split * (1 - 0.35 * back);
  const AR = 330 - 110 * split + 70 * back;
  const BX = 960 + 470 * split + 120 * back;
  const BR = 330 - 120 * split - 40 * back;
  const AY = 500 - 40 * split;
  const BY = 500 + 70 * split;
  const intro = mode === 2 ? 1 : P(f, 0, 24);
  // modo 2: a nave tenta sair da A para a B, bate na parede e volta
  const tryT = mode === 2 ? Math.max(0, Math.min(1, (f - leaveAt + 10) / 34)) : 0;
  const hitW = mode === 2 && f >= leaveAt + 24 ? Math.max(0, 1 - (f - leaveAt - 24) / 30) : 0;
  const nets = mode === 2 ? UWORLDS.map((_, i) => P(f, empireAt + i * 7, 16)) : [];
  // as linhas do tempo (trilhos) por baixo
  const railY1 = AY + AR + 70;
  const railY2 = BY + BR + 70;
  const branchX = 700;
  return (
    <Shell f={f} life={p.life}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {Array.from({ length: 140 }).map((_, i) => <circle key={i} cx={rnd(i) * 1920} cy={rnd(i * 3) * 1080} r={0.6 + rnd(i * 5) * 1.3} fill="#fff" opacity={0.15 + 0.35 * rnd(i * 7)} />)}
        {/* a linha do tempo da realidade A (e o ramo da alternativa) */}
        <g opacity={intro}>
          <line x1={60} x2={1860} y1={railY1} y2={railY1} stroke="rgba(242,240,247,0.35)" strokeWidth={2.5} />
          <path d={`M 1860 ${railY1} l -16 -9 m 16 9 l -16 9`} stroke="rgba(242,240,247,0.5)" strokeWidth={2.5} fill="none" />
          <text x={70} y={railY1 - 14} fill="rgba(242,240,247,0.6)" fontFamily={MONO} fontSize={14} letterSpacing={4}>LINHA DO TEMPO A</text>
          {split > 0.02 ? (
            <g opacity={split}>
              <path d={`M ${branchX} ${railY1} C ${branchX + 160} ${railY1} ${branchX + 200} ${railY2} ${branchX + 380} ${railY2} L ${1860} ${railY2}`} fill="none" stroke="rgba(199,155,255,0.6)" strokeWidth={2.5} strokeDasharray={`${2400 * split} 2400`} />
              <circle cx={branchX} cy={railY1} r={7} fill={VIO} />
              <text x={branchX + 400} y={railY2 + 28} fill={VIO} fontFamily={MONO} fontSize={14} letterSpacing={4}>LINHA ALTERNATIVA B</text>
            </g>
          ) : null}
        </g>
        {/* as duas realidades */}
        {split > 0.02
          ? URealm({ id: "B", cx: BX, cy: BY, R: BR, f, rot: rot + 0.6, alpha: split * (mode === 2 ? 0.9 : 1 - 0.45 * back), links: mode === 2 ? 1 : P(f, wholeAt, 30), alt: true, hideQ: true, label: mode === 2 ? (f >= otherAt - 10 ? "OUTRA VERSÃO DA HISTÓRIA · FORA DO ALCANCE" : "REALIDADE B") : f >= wholeAt ? "OUTRA VERSÃO DA REALIDADE INTEIRA" : "REALIDADE B", labelCol: VIO, showNames: mode === 2 ? 0.6 : P(f, wholeAt, 16) * 0.8 })
          : null}
        {URealm({ id: "A", cx: AX, cy: AY, R: AR, f, rot, alpha: intro, links: mode === 2 ? 1 : Math.max(P(f, realAt - 20, 40) * 0.0, P(f, connAt - 30, 40)), ships: mode === 2 ? 1 : P(f, combAt, 14), nets, showNames: mode === 2 ? 0.7 : P(f, 6, 16), label: mode === 2 ? "REALIDADE A · O IMPÉRIO COMBINE" : split > 0.5 ? "REALIDADE A" : "UMA REALIDADE · VÁRIOS MUNDOS", hit: hitW })}
        {/* modo 2: a nave tentando passar para a outra versão */}
        {mode === 2 && f >= leaveAt - 10
          ? (() => {
              const sx = AX + AR * 0.4, sy = AY;
              const wallX = AX + AR;
              const goingOut = tryT < 0.7;
              const x = goingOut ? sx + (wallX - 6 - sx) * (tryT / 0.7) : wallX - 6 - (wallX - 6 - sx) * ((tryT - 0.7) / 0.3) * 0.6;
              return (
                <g>
                  <line x1={wallX + 10} y1={sy} x2={BX - BR - 10} y2={BY} stroke="rgba(255,93,77,0.35)" strokeWidth={2} strokeDasharray="6 8" opacity={P(f, leaveAt - 10, 10)} />
                  <path d="M -12 -7 L 12 0 L -12 7 L -7 0 Z" fill={RED} transform={`translate(${x} ${sy}) rotate(${goingOut ? 0 : 180})`} style={{ filter: "drop-shadow(0 0 6px #ff5d4d)" }} />
                  {hitW > 0 ? <circle cx={wallX} cy={sy} r={10 + (1 - hitW) * 70} fill="none" stroke={RED} strokeWidth={4 * hitW} opacity={hitW} /> : null}
                  {f >= otherAt - 10 ? <path d={`M ${(wallX + BX - BR) / 2 - 22} ${(sy + BY) / 2 - 22} l 44 44 m 0 -44 l -44 44`} stroke={RED} strokeWidth={6} opacity={P(f, otherAt - 10, 8)} /> : null}
                </g>
              );
            })()
          : null}
      </svg>
      {mode === 1 ? (
        <Big k="NA LÓGICA DA HISTÓRIA" t={f >= combAt ? "os Combine atravessam essas conexões" : f >= obsAt ? "o observatório mostra a primeira" : f >= wholeAt ? "uma linha alternativa = outra realidade inteira" : f >= altAt ? "uma linha temporal alternativa…" : "vários mundos, uma realidade"} c={f >= combAt ? RED : ICE} o={P(f, 0, 10)} size={50} />
      ) : (
        <Big k="REGRA 6" t={f >= leaveAt ? "mas não saem da própria história" : "um império através de mundos"} c={RED} o={P(f, 0, 10)} size={50} />
      )}
      {void notAt}
    </Shell>
  );
};

// ---------------------------------------------------------------- a parede das versões (relevos)
export const HLRVersionsCarve: React.FC<Pr> = (p) => {
  const f = useCurrentFrame();
  const mode = p.mode ?? 1;
  const [wallAt, sameAt, smallAt, personAt, battleAt, endAt, vanishAt, noPassAt, sideAt, discAt, notMeanAt, stuckAt, cornerAt, suitAt, outsideAt, watchAt, laterAt] = ks(p, ["wallAt", "sameAt", "smallAt", "personAt", "battleAt", "endAt", "vanishAt", "noPassAt", "sideAt", "discAt", "notMeanAt", "stuckAt", "cornerAt", "suitAt", "outsideAt", "watchAt", "laterAt"]);
  const N = 5;
  const PW = 300;
  const PH = 360;
  const X0 = mode === 2 ? 120 : 160;
  const panels = useMemo(() => Array.from({ length: N }).map((_, i) => ({ figs: [0, 1, 2, 3].filter((k) => !(i === 2 && k === 1) && !(i === 4 && k === 3)), win: i % 2 === 0, early: i === 3 })), []);
  const stone = "#8a7f6c";
  const groove = "rgba(40,32,24,0.85)";
  return (
    <Shell f={f} life={p.life} bg="radial-gradient(ellipse at 50% 45%, #2a241c 0%, #0a0806 78%)">
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <rect x={0} y={200} width={1920} height={560} fill="#4a4236" opacity={0.6} />
        {panels.map((pn, i) => {
          const x = X0 + i * (PW + 40);
          const y = 240;
          const on = P(f, (mode === 2 ? 0 : wallAt) + i * 6, 12);
          return (
            <g key={i} opacity={on}>
              <rect x={x} y={y} width={PW} height={PH} rx={10} fill={stone} stroke={groove} strokeWidth={4} />
              <line x1={x + 20} x2={x + PW - 20} y1={y + PH - 70} y2={y + PH - 70} stroke={groove} strokeWidth={4} />
              {/* as figuras (entalhes abstratos) */}
              {[0, 1, 2, 3].map((k) => {
                const has = pn.figs.includes(k);
                const fx = x + 50 + k * 66;
                const fy = y + PH - 90;
                const gone = mode === 1 && pn.early && k === 2 && f >= vanishAt;
                const hl = mode === 1 && f >= personAt && f < battleAt && ((i === 1 && k === 1) || (i === 2 && k === 1));
                return has && !gone ? (
                  <g key={k}>
                    <circle cx={fx} cy={fy - 70} r={16} fill="none" stroke={hl ? RED : groove} strokeWidth={5} />
                    <line x1={fx} x2={fx} y1={fy - 54} y2={fy} stroke={hl ? RED : groove} strokeWidth={6} />
                  </g>
                ) : hl || (mode === 1 && f >= personAt && i === 2 && k === 1) ? (
                  <circle key={k} cx={fx} cy={fy - 40} r={36} fill="none" stroke={RED} strokeWidth={3} strokeDasharray="6 6" />
                ) : null;
              })}
              {/* desfecho da batalha */}
              {mode === 1 && f >= battleAt ? (
                <text x={x + PW / 2} y={y + 70} textAnchor="middle" fill={pn.win ? "#2f5a2a" : "#7a1e16"} fontFamily={FONT} fontWeight={800} fontSize={54} opacity={P(f, battleAt + i * 4, 8)}>
                  {pn.win ? "✓" : "✕"}
                </text>
              ) : null}
              {/* modo 2: a descoberta acende numa versão e não passa para as outras */}
              {mode === 2 && i === 1 && f >= discAt ? <circle cx={x + PW / 2} cy={y + 120} r={30 + 6 * Math.sin(f / 5)} fill="rgba(255,226,140,0.5)" opacity={P(f, discAt, 10)} /> : null}
              {mode === 2 && i === 1 && f >= notMeanAt ? (
                <g opacity={P(f, notMeanAt, 10)}>
                  <line x1={x + PW} y1={y + 120} x2={x + PW + 40 * P(f, notMeanAt, 14)} y2={y + 120} stroke={RED} strokeWidth={4} />
                  <path d={`M ${x + PW + 10} ${y + 100} l 24 40 m 0 -40 l -24 40`} stroke={RED} strokeWidth={5} />
                </g>
              ) : null}
            </g>
          );
        })}
        {/* sem passagens entre as cenas */}
        {mode === 1 && f >= noPassAt
          ? Array.from({ length: N - 1 }).map((_, i) => {
              const x = X0 + (i + 1) * (PW + 40) - 20;
              return <path key={i} d={`M ${x - 12} 400 l 24 40 m 0 -40 l -24 40`} stroke={RED} strokeWidth={4} opacity={P(f, noPassAt + i * 3, 8)} />;
            })
          : null}
        {/* modo 2: o nicho do lado de fora, observando */}
        {mode === 2 && f >= cornerAt ? (
          <g opacity={P(f, cornerAt, 12)}>
            <rect x={1780} y={300} width={110} height={300} rx={12} fill="#3a3228" stroke={groove} strokeWidth={4} />
            <rect x={1814} y={360} width={42} height={180} rx={6} fill="none" stroke={f >= suitAt ? CREAM : groove} strokeWidth={4} />
            <rect x={1856} y={500} width={22} height={18} fill="none" stroke={f >= suitAt ? CREAM : groove} strokeWidth={3} />
            {f >= watchAt
              ? Array.from({ length: N }).map((_, i) => <line key={i} x1={1800} y1={420} x2={X0 + i * (PW + 40) + PW / 2} y2={300} stroke={CREAM} strokeWidth={1.5} strokeDasharray="6 8" opacity={0.6 * P(f, watchAt + i * 3, 8)} />)
              : null}
            <text x={1835} y={640} textAnchor="middle" fill={CREAM} fontFamily={MONO} fontSize={14} letterSpacing={2} opacity={P(f, outsideAt, 8)}>
              DO LADO DE FORA
            </text>
          </g>
        ) : null}
      </svg>
      {mode === 1 ? (
        <Big k={f >= noPassAt ? "SEM PASSAGEM ENTRE ELAS" : f >= smallAt ? "SÓ PEQUENAS COISAS MUDAM" : "UMA PAREDE MUITO MAIS ANTIGA"} t={f >= sideAt ? "lado a lado, separadas" : f >= vanishAt ? "em outras, somem antes" : f >= endAt ? "em algumas, chegam ao final" : f >= battleAt ? "a batalha termina diferente" : f >= personAt ? "alguém some na versão seguinte" : "o mesmo acontecimento, várias vezes"} c={CREAM} o={P(f, sameAt - 30, 10)} top={800} size={56} />
      ) : (
        <Big k={f >= cornerAt ? "UM HOMEM DE TERNO" : "UMA LINHA NÃO CONTA PARA A OUTRA"} t={f >= laterAt - 30 ? "a gente volta nisso daqui a pouco" : f >= watchAt ? "observando todas elas" : f >= cornerAt ? "fora de todas as cenas" : f >= stuckAt ? "presos à história em que existem" : "o que um descobre, o outro não sabe"} c={f >= cornerAt ? CREAM : RED} o={P(f, 6, 10)} top={800} size={56} />
      )}
    </Shell>
  );
};

// ---------------------------------------------------------------- a fenda (modo 1) e o vazamento (modo 2)
export const HLRXenLeakDiagram: React.FC<Pr> = (p) => {
  const f = useCurrentFrame();
  const mode = p.mode ?? 1;
  const [ruptAt, aloneAt, equipAt, recAt, distAt, syncAt, answerAt, questionAt, loseAt, woundAt, borderAt, leakAt, alyxAt, buttonAt, recogAt, keptAt, betterAt] = ks(p, ["ruptAt", "aloneAt", "equipAt", "recAt", "distAt", "syncAt", "answerAt", "questionAt", "loseAt", "woundAt", "borderAt", "leakAt", "alyxAt", "buttonAt", "recogAt", "keptAt", "betterAt"]);
  if (mode === 1) {
    const open = 0.5 + 0.5 * Math.sin(f / 18);
    const sig = (q: number, k: number) => 360 + Math.sin(q * 0.35 + k) * 40 * (0.4 + 0.6 * Math.abs(Math.sin(q / 9)));
    const rec = P(f, recAt, 14);
    const match = P(f, distAt, 20);
    const q = P(f, questionAt - 30, 12);
    return (
      <Shell f={f} life={p.life} bg="radial-gradient(ellipse at 40% 50%, #1a1410 0%, #060504 78%)">
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: 1 - q * 0.8 }}>
          {/* a fenda que abre e fecha sozinha */}
          <ellipse cx={520} cy={540} rx={160 * (f >= aloneAt ? open : 0.6) + 20} ry={260 * (f >= aloneAt ? open : 0.6) + 20} fill="#3a1e10" stroke={XEN} strokeWidth={4} opacity={P(f, ruptAt, 14)} />
          <ellipse cx={520} cy={540} rx={200 * (f >= aloneAt ? open : 0.6) + 30} ry={300 * (f >= aloneAt ? open : 0.6) + 30} fill="rgba(255,179,107,0.08)" opacity={P(f, ruptAt, 14)} />
          {/* aparelhos Combine registrando */}
          {f >= equipAt
            ? [0, 1].map((k) => (
                <g key={k} opacity={P(f, equipAt + k * 6, 8)}>
                  <rect x={780} y={300 + k * 300} width={120} height={70} fill="#0b1012" stroke={CYAN} strokeWidth={2} />
                  <line x1={780} y1={335 + k * 300} x2={680} y2={540} stroke={CYAN} strokeWidth={1.5} strokeDasharray="4 6" />
                </g>
              ))
            : null}
          {/* leitura: a mesma distorção do Borealis fora de sincronia */}
          {rec > 0 ? (
            <g opacity={rec}>
              <rect x={1000} y={260} width={800} height={240} rx={10} fill="rgba(4,10,12,0.85)" stroke="rgba(95,243,255,0.4)" />
              <text x={1020} y={290} fill={CYAN} fontFamily={MONO} fontSize={15} letterSpacing={3}>
                LEITURA DA FENDA
              </text>
              <polyline points={Array.from({ length: 120 }).map((_, i) => `${1020 + i * 6.4},${sig(i + f * 0.6, 0)}`).join(" ")} fill="none" stroke={XEN} strokeWidth={2.5} />
              <rect x={1000} y={540} width={800} height={240} rx={10} fill="rgba(4,10,12,0.85)" stroke="rgba(159,230,255,0.4)" opacity={match} />
              <text x={1020} y={570} fill={ICE} fontFamily={MONO} fontSize={15} letterSpacing={3} opacity={match}>
                BOREALIS · FORA DE SINCRONIA
              </text>
              <polyline points={Array.from({ length: 120 }).map((_, i) => `${1020 + i * 6.4},${sig(i + f * 0.6, 0) + 280}`).join(" ")} fill="none" stroke={ICE} strokeWidth={2.5} opacity={match} />
              {f >= syncAt ? <text x={1400} y={830} textAnchor="middle" fill={GREEN} fontFamily={FONT} fontWeight={800} fontSize={44} opacity={P(f, syncAt, 8)}>mesma assinatura</text> : null}
            </g>
          ) : null}
        </svg>
        <Head t="UMA RUPTURA PARECIDA COM A DA ALYX" s={f >= aloneAt ? "APARECE E DESAPARECE SOZINHA" : ""} c={XEN} o={1 - q} />
        {q > 0 ? (
          <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: q }}>
            <div style={{ fontFamily: MONO, fontSize: 20, letterSpacing: 8, color: CREAM }}>A PERGUNTA DO COMEÇO</div>
            <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 92, color: TXT, textAlign: "center", lineHeight: 1.05, maxWidth: 1500 }}>
              se o Borealis é temporal, por que ele abre para <span style={{ color: XEN }}>Xen</span>?
            </div>
          </AbsoluteFill>
        ) : null}
        {void answerAt}
      </Shell>
    );
  }
  // modo 2: o vazamento
  const leak = P(f, leakAt - 10, 30);
  const S = 1.3;
  const X0 = 960 - 500 * S;
  const Y0 = 420 - 150 * S;
  return (
    <Shell f={f} life={p.life} bg="radial-gradient(ellipse at 50% 50%, #0b1218 0%, #030507 78%)">
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {/* a ferida no gelo */}
        <path d="M 200 760 Q 600 700 900 780 T 1700 740" fill="none" stroke={RED} strokeWidth={6} opacity={P(f, woundAt - 6, 12)} />
        <text x={960} y={830} textAnchor="middle" fill={RED} fontFamily={MONO} fontSize={18} letterSpacing={5} opacity={P(f, woundAt, 10)}>
          A FERIDA · O QUE OS VORTIGAUNTS PERCEBEM DESDE O COMEÇO
        </text>
        <g transform={`translate(${X0} ${Y0}) scale(${S})`}>
          <ShipProfile stroke={f >= loseAt ? "rgba(159,230,255,0.4)" : ICE} fill="rgba(159,230,255,0.05)" w={1.6} />
          {/* Xen vazando para dentro */}
          {leak > 0
            ? Array.from({ length: 14 }).map((_, k) => {
                const x = 120 + rnd(k * 3.1) * 760;
                const h = 40 + rnd(k * 5.3) * 120 * leak;
                return <rect key={k} x={x} y={290 - h} width={12 + rnd(k) * 20} height={h} fill={XEN} opacity={0.35 * leak} />;
              })
            : null}
        </g>
        {/* a fronteira */}
        {f >= borderAt ? <line x1={0} x2={1920} y1={700} y2={700} stroke={XEN} strokeWidth={3} strokeDasharray="12 10" strokeDashoffset={-f * 2} opacity={P(f, borderAt, 10)} /> : null}
      </svg>
      <Head t="O BOREALIS NÃO VIAJA PARA XEN" s={f >= leakAt ? "A FRONTEIRA VAZA PARA DENTRO DELE" : f >= loseAt ? "QUANDO PERDE SINCRONIZAÇÃO, PERTO DA FERIDA" : ""} c={XEN} />
      {f >= alyxAt ? (
        <div style={{ position: "absolute", right: 90, top: 150, width: 560, opacity: P(f, alyxAt, 10) }}>
          <div style={{ fontFamily: MONO, fontSize: 16, letterSpacing: 6, color: ORANGE }}>O QUE A ALYX FEZ</div>
          {f >= buttonAt ? (
            <div style={{ marginTop: 14, display: "inline-block", position: "relative", padding: "14px 30px", borderRadius: 12, background: "#2a1810", border: `3px solid ${XEN}`, fontFamily: FONT, fontWeight: 800, fontSize: 48, color: XEN, opacity: P(f, buttonAt - 10, 8) }}>
              XEN
              <div style={{ position: "absolute", left: -10, right: -10, top: "50%", height: 7, background: RED, transform: `scaleX(${P(f, buttonAt + 10, 8)})`, transformOrigin: "left" }} />
            </div>
          ) : null}
          {f >= recogAt ? <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 44, color: TXT, lineHeight: 1.05, marginTop: 18, opacity: P(f, recogAt, 8) }}>{f >= keptAt ? "reconheceu uma ruptura e manteve aberta" : "soube reconhecer"}</div> : null}
          {f >= betterAt - 20 ? <div style={{ fontFamily: MONO, fontSize: 18, letterSpacing: 4, color: ORANGE, marginTop: 16, opacity: P(f, betterAt - 20, 8) }}>ENTENDE O BOREALIS MELHOR DO QUE MOSTRA</div> : null}
        </div>
      ) : null}
    </Shell>
  );
};

// ---------------------------------------------------------------- a instalação no litoral: ordens autorizadas
export const HLRCoastTerminal: React.FC<Pr> = (p) => {
  const f = useCurrentFrame();
  const [crossAt, notBackAt, coastAt, isolatedAt, termAt, ordersAt, troopsAt, coordsAt, authAt, alyxAt, noFakeAt, workAt, escapeAt] = ks(p, ["crossAt", "notBackAt", "coastAt", "isolatedAt", "termAt", "ordersAt", "troopsAt", "coordsAt", "authAt", "alyxAt", "noFakeAt", "workAt", "escapeAt"]);
  const term = P(f, termAt - 10, 12);
  const ROWS = [
    ["ORDEM 4471 · POSICIONAR UNIDADES", ordersAt],
    ["MOVIMENTO · 3 ESQUADRÕES → SETOR 9", troopsAt],
    ["SALTO DO BOREALIS · 78°02′N 11°40′L", coordsAt],
    ["SALTO DO BOREALIS · 79°15′N 15°02′L", coordsAt + 10],
  ] as const;
  return (
    <Shell f={f} life={p.life} bg="radial-gradient(ellipse at 50% 45%, #0b141a 0%, #030507 78%)">
      {term < 1 ? (
        <AbsoluteFill style={{ opacity: 1 - term }}>
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
            <path d="M 0 700 Q 400 640 800 700 T 1920 660 L 1920 1080 L 0 1080 Z" fill="#0c1820" />
            <path d="M 0 700 Q 400 640 800 700 T 1920 660" fill="none" stroke={ICE} strokeWidth={2} opacity={0.5} />
            <g opacity={P(f, coastAt - 10, 12)}>
              <path d="M 1100 660 L 1100 460 L 1200 380 L 1320 460 L 1320 660 Z" fill="#0d1418" stroke={CYAN} strokeWidth={3} />
              <rect x={1150} y={500} width={120} height={8} fill={CYAN} opacity={0.6 + 0.4 * Math.sin(f / 5)} />
            </g>
            <ellipse cx={600} cy={560} rx={90 * (1 - P(f, notBackAt, 20))} ry={140 * (1 - P(f, notBackAt, 20))} fill="#3a1e10" stroke={XEN} strokeWidth={3} opacity={P(f, crossAt - 20, 10)} />
          </svg>
          <Head t="ELES NÃO VOLTAM PARA O NAVIO" s={f >= coastAt ? "UMA INSTALAÇÃO COMBINE NO LITORAL DO ÁRTICO" : ""} c={CYAN} />
        </AbsoluteFill>
      ) : null}
      {term > 0 ? (
        <AbsoluteFill style={{ opacity: term }}>
          <div style={{ position: "absolute", left: 160, top: 180, width: 1600, padding: "30px 36px", background: "rgba(4,10,12,0.92)", border: "1px solid rgba(95,243,255,0.4)", borderRadius: 12 }}>
            <div style={{ fontFamily: MONO, fontSize: 18, letterSpacing: 6, color: CYAN, marginBottom: 20 }}>TERMINAL · ORDENS RECENTES</div>
            {ROWS.map(([l, at], i) => (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: "1px solid rgba(95,243,255,0.15)", opacity: P(f, at, 8) }}>
                <span style={{ fontFamily: MONO, fontSize: 24, letterSpacing: 2, color: TXT }}>{l}</span>
                {f >= authAt + i * 6 ? <span style={{ padding: "4px 14px", border: `3px solid ${ORANGE}`, color: ORANGE, fontFamily: MONO, fontSize: 18, letterSpacing: 3, transform: `rotate(-3deg) scale(${1.4 - 0.4 * P(f, authAt + i * 6, 6)})` }}>AUTORIZADO · A. VANCE</span> : null}
              </div>
            ))}
          </div>
          {f >= noFakeAt ? <Big k="NÃO TEM MAIS COMO FINGIR" t={f >= workAt ? "ela está trabalhando com os Combine" : "que entendeu errado"} c={ORANGE} o={P(f, noFakeAt, 10)} top={760} /> : null}
        </AbsoluteFill>
      ) : null}
      {void isolatedAt}
      {void alyxAt}
      {void escapeAt}
    </Shell>
  );
};

// ---------------------------------------------------------------- o Barney
export const HLRBarneyBlock: React.FC<Pr> = (p) => {
  const f = useCurrentFrame();
  const [cellsAt, foodAt, openAt, barneyAt, olderAt, aliveAt, beerAt, trioAt, shotgunAt, gravAt, dogAt] = ks(p, ["cellsAt", "foodAt", "openAt", "barneyAt", "olderAt", "aliveAt", "beerAt", "trioAt", "shotgunAt", "gravAt", "dogAt"]);
  const card = P(f, barneyAt - 6, 12) * (1 - P(f, trioAt - 10, 12));
  const trio = P(f, trioAt - 10, 12);
  const openD = P(f, openAt, 14);
  return (
    <Shell f={f} life={p.life} bg="radial-gradient(ellipse at 50% 45%, #121417 0%, #040506 78%)">
      {/* corredor de celas */}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: 1 - card * 0.7 - trio * 0.9 }}>
        {Array.from({ length: 6 }).map((_, k) => {
          const x = 140 + k * 290;
          const it = k === 3;
          return (
            <g key={k}>
              <rect x={x} y={300} width={240} height={420} fill="#0b0e10" stroke="#3a4249" strokeWidth={3} />
              {Array.from({ length: 7 }).map((_, j) => (
                <line key={j} x1={x + 20 + j * 32 + (it ? openD * 200 : 0)} x2={x + 20 + j * 32 + (it ? openD * 200 : 0)} y1={300} y2={720} stroke="#56606a" strokeWidth={5} opacity={it ? 1 - openD * 0.6 : 1} />
              ))}
              {it && f >= foodAt ? <text x={x + 120} y={280} textAnchor="middle" fill={CREAM} fontFamily={MONO} fontSize={16} letterSpacing={2} opacity={P(f, foodAt, 8) * (1 - openD)}>“ESSA COMIDA…”</text> : null}
            </g>
          );
        })}
      </svg>
      <Head t="ALA DE DETENÇÃO" s={f >= foodAt ? "ALGUÉM RECLAMANDO DA COMIDA" : ""} c={ICE} o={1 - trio} />
      {card > 0 ? (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: card }}>
          <div style={{ width: 900, padding: "34px 40px", background: "rgba(10,14,22,0.9)", border: "2px solid #5a7aa8", borderRadius: 16 }}>
            <div style={{ fontFamily: MONO, fontSize: 18, letterSpacing: 6, color: "#8fb0e0" }}>CELA 4 · DETENTO</div>
            <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 110, color: TXT, lineHeight: 1 }}>Barney</div>
            <div style={{ display: "flex", gap: 16, marginTop: 18, flexWrap: "wrap" }}>
              {["mais velho", "acabado", "puto da vida", "vivo"].map((t, i) => (
                <span key={t} style={{ padding: "6px 16px", borderRadius: 8, border: `2px solid ${i === 3 ? GREEN : "#5a7aa8"}`, fontFamily: MONO, fontSize: 20, letterSpacing: 3, color: i === 3 ? GREEN : TXT, opacity: P(f, (i === 3 ? aliveAt : olderAt) + i * 8, 6) }}>
                  {t}
                </span>
              ))}
            </div>
            {f >= beerAt ? (
              <div style={{ marginTop: 22, padding: "14px 20px", borderRadius: 10, background: "rgba(255,178,46,0.12)", border: `2px dashed ${AMB}`, fontFamily: MONO, fontSize: 22, letterSpacing: 3, color: AMB, opacity: P(f, beerAt, 8) }}>
                DÍVIDA PENDENTE · 1 CERVEJA · DESDE BLACK MESA
              </div>
            ) : null}
          </div>
        </AbsoluteFill>
      ) : null}
      {trio > 0 ? (
        <AbsoluteFill style={{ opacity: trio }}>
          <Head t="A FUGA, A TRÊS" c={AMB} />
          {[
            ["BARNEY", "espingarda", "#8fb0e0", shotgunAt],
            ["GORDON", "Gravity Gun", AMB, gravAt],
            ["DOG", "força bruta", "#cfd4d8", dogAt],
          ].map(([n, t, c, at], i) => (
            <div key={n as string} style={{ position: "absolute", left: 140 + i * 560, top: 380, width: 500, padding: "28px 30px", borderRadius: 16, background: "rgba(12,14,18,0.85)", border: `2px solid ${c}`, opacity: P(f, at as number, 8), transform: `translateY(${(1 - P(f, at as number, 12)) * 40}px)` }}>
              <div style={{ fontFamily: MONO, fontSize: 18, letterSpacing: 6, color: c as string }}>{n}</div>
              <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 64, color: TXT }}>{t}</div>
            </div>
          ))}
        </AbsoluteFill>
      ) : null}
      {void cellsAt}
    </Shell>
  );
};

// ---------------------------------------------------------------- o gesto e a balança
export const HLRGestureScale: React.FC<Pr> = (p) => {
  const f = useCurrentFrame();
  const [tellAt, roomAt, advAt, notFreeAt, watchAt, gestureAt, recogAt, bmAt, calmAt, doubtAt, proofAt, hintAt, simpleAt] = ks(p, ["tellAt", "roomAt", "advAt", "notFreeAt", "watchAt", "gestureAt", "recogAt", "bmAt", "calmAt", "doubtAt", "proofAt", "hintAt", "simpleAt"]);
  const scale = P(f, doubtAt - 10, 12);
  const tilt = interpolate(f, [proofAt, hintAt, simpleAt], [-14, -14, -6], C);
  return (
    <Shell f={f} life={p.life}>
      {scale < 1 ? (
        <AbsoluteFill style={{ opacity: 1 - scale }}>
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
            <rect x={460} y={260} width={1000} height={560} fill="rgba(159,230,255,0.03)" stroke="rgba(159,230,255,0.35)" strokeWidth={2} />
            <g opacity={P(f, tellAt, 10)}>
              <rect x={900} y={520} width={60} height={60} fill="#0b0e10" stroke="#8fb0e0" strokeWidth={2} />
              <text x={930} y={620} textAnchor="middle" fill="#8fb0e0" fontFamily={MONO} fontSize={16} letterSpacing={3}>
                BARNEY
              </text>
            </g>
            <g opacity={P(f, roomAt, 10)} transform={`translate(${-120 * (1 - P(f, roomAt, 30))} 0)`}>
              <circle cx={700} cy={440} r={12} fill={ORANGE} />
              <text x={700} y={410} textAnchor="middle" fill={ORANGE} fontFamily={MONO} fontSize={16} letterSpacing={3}>
                ALYX
              </text>
              <ellipse cx={640} cy={330} rx={50} ry={28} fill="#0b1012" stroke={CYAN} strokeWidth={2} opacity={P(f, advAt, 8)} />
            </g>
            {f >= watchAt ? <line x1={712} y1={444} x2={900} y2={540} stroke={ORANGE} strokeWidth={2} strokeDasharray="4 6" opacity={P(f, watchAt, 8)} /> : null}
          </svg>
          <Head t="O RELATO DO BARNEY" s={f >= watchAt ? "NÃO DISSE NADA · SÓ FICOU OLHANDO" : f >= notFreeAt ? "NÃO TENTOU LIBERTÁ-LO" : f >= roomAt ? "ELA ENTROU NA SALA DO INTERROGATÓRIO" : ""} c={"#8fb0e0"} />
          {f >= gestureAt ? (
            <div style={{ position: "absolute", right: 100, bottom: 120, width: 560, padding: "24px 28px", borderRadius: 14, background: "rgba(20,14,8,0.85)", border: `2px solid ${AMB}`, opacity: P(f, gestureAt, 10) }}>
              <svg width={120} height={120} style={{ float: "left", marginRight: 20 }}>
                <path d="M 30 100 L 30 40 M 45 100 L 45 24 M 60 100 L 60 20 M 75 100 L 75 28 M 90 100 L 92 60" stroke={AMB} strokeWidth={8} strokeLinecap="round" />
                <path d="M 26 100 Q 60 120 96 98" fill="none" stroke={AMB} strokeWidth={8} strokeLinecap="round" />
              </svg>
              <div style={{ fontFamily: MONO, fontSize: 16, letterSpacing: 5, color: AMB }}>{f >= bmAt ? "O GESTO DE BLACK MESA" : "UM GESTO PEQUENO"}</div>
              {f >= calmAt ? <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 52, color: TXT, opacity: P(f, calmAt, 8) }}>“fica tranquilo”</div> : null}
            </div>
          ) : null}
        </AbsoluteFill>
      ) : null}
      {scale > 0 ? (
        <AbsoluteFill style={{ opacity: scale }}>
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
            <line x1={960} x2={960} y1={360} y2={860} stroke={CREAM} strokeWidth={6} />
            <path d="M 880 860 L 1040 860 L 960 820 Z" fill={CREAM} />
            <g transform={`rotate(${tilt} 960 380)`}>
              <line x1={560} x2={1360} y1={380} y2={380} stroke={CREAM} strokeWidth={6} />
              <line x1={560} x2={560} y1={380} y2={520} stroke={CREAM} strokeWidth={2} />
              <line x1={1360} x2={1360} y1={380} y2={520} stroke={CREAM} strokeWidth={2} />
              <rect x={420} y={520} width={280} height={90} rx={10} fill="rgba(255,93,77,0.2)" stroke={RED} strokeWidth={3} opacity={P(f, proofAt, 8)} />
              <text x={560} y={576} textAnchor="middle" fill={RED} fontFamily={MONO} fontSize={20} letterSpacing={3} opacity={P(f, proofAt, 8)}>
                PROVAS
              </text>
              <rect x={1260} y={520} width={200} height={60} rx={10} fill="rgba(255,178,46,0.2)" stroke={AMB} strokeWidth={3} opacity={P(f, hintAt, 8)} />
              <text x={1360} y={558} textAnchor="middle" fill={AMB} fontFamily={MONO} fontSize={18} letterSpacing={3} opacity={P(f, hintAt, 8)}>
                INDÍCIO
              </text>
            </g>
          </svg>
          <Big k="A DÚVIDA QUE A GENTE PRECISA MANTER" t={f >= simpleAt - 20 ? "talvez não seja tão simples" : f >= hintAt ? "mas existe um indício" : "a Alyx está ajudando os Combine"} c={CREAM} o={1} />
        </AbsoluteFill>
      ) : null}
      {void recogAt}
    </Shell>
  );
};

// ---------------------------------------------------------------- a frota
export const HLRFleetRoute: React.FC<Pr> = (p) => {
  const f = useCurrentFrame();
  const [stealAt, fleetAt, kleinerAt, filesAt, savedAt, knowAt, workAt, reachAt] = ks(p, ["stealAt", "fleetAt", "kleinerAt", "filesAt", "savedAt", "knowAt", "workAt", "reachAt"]);
  const route = P(f, stealAt, 60);
  const files = P(f, kleinerAt - 10, 12);
  return (
    <Shell f={f} life={p.life} bg="radial-gradient(ellipse at 50% 50%, #0b141a 0%, #030507 78%)">
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: 1 - files * 0.75 }}>
        <path d="M 0 760 Q 500 700 900 760 T 1920 720" fill="none" stroke={ICE} strokeWidth={2} opacity={0.4} />
        <path d={`M 300 640 Q 900 380 ${300 + 1300 * route} ${640 - Math.sin(route * Math.PI) * 220}`} fill="none" stroke={AMB} strokeWidth={4} strokeDasharray="10 8" />
        <circle cx={300} cy={640} r={14} fill={CYAN} />
        <text x={300} y={690} textAnchor="middle" fill={CYAN} fontFamily={MONO} fontSize={16} letterSpacing={3}>
          INSTALAÇÃO
        </text>
        {f >= fleetAt - 10
          ? Array.from({ length: 5 }).map((_, k) => (
              <g key={k} transform={`translate(${1500 + (k % 3) * 90} ${560 + Math.floor(k / 3) * 70}) scale(0.1)`} opacity={P(f, fleetAt - 10 + k * 4, 8)}>
                <ShipProfile stroke={GREEN} fill="rgba(141,255,168,0.1)" w={16} />
              </g>
            ))
          : null}
        <text x={1640} y={720} textAnchor="middle" fill={GREEN} fontFamily={MONO} fontSize={16} letterSpacing={3} opacity={P(f, fleetAt, 8)}>
          FROTA DA RESISTÊNCIA
        </text>
      </svg>
      <Head t="ROUBAM O TRANSPORTE" s={f >= fleetAt ? "E ALCANÇAM A FROTA" : ""} c={AMB} o={1 - files} />
      {files > 0 ? (
        <AbsoluteFill style={{ opacity: files }}>
          <div style={{ position: "absolute", left: 220, top: 220, width: 1000, padding: "26px 30px", background: "rgba(4,10,8,0.9)", border: `1px solid ${GREEN}`, borderRadius: 12 }}>
            <div style={{ fontFamily: MONO, fontSize: 18, letterSpacing: 6, color: GREEN, marginBottom: 16 }}>KLEINER · ARQUIVOS DA MOSSMAN</div>
            {["inst_combine_01", "inst_combine_02", "hospedeiro_reg", "anotacoes_navio", "experimentos_borealis"].map((n, i) => {
              const v = Math.min(1, P(f, filesAt + i * 6, 30) * (i < 3 ? 1 : 0.4));
              return (
                <div key={n} style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 12 }}>
                  <span style={{ fontFamily: MONO, fontSize: 22, color: TXT, width: 420 }}>{n}</span>
                  <div style={{ flex: 1, height: 10, background: "rgba(242,240,247,0.1)", borderRadius: 5 }}>
                    <div style={{ width: `${v * 100}%`, height: 10, background: v > 0.95 ? GREEN : AMB, borderRadius: 5 }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ position: "absolute", right: 120, top: 260, width: 520, textAlign: "right", fontFamily: MONO }}>
            <div style={{ fontSize: 18, letterSpacing: 5, color: GREEN, opacity: P(f, knowAt, 8) }}>JÁ SABEMOS: OS COMBINE TRABALHAM NO BOREALIS</div>
            {f >= reachAt - 30 ? <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 64, color: TXT, marginTop: 20, opacity: P(f, reachAt - 30, 10) }}>o que eles querem alcançar?</div> : null}
          </div>
        </AbsoluteFill>
      ) : null}
      {void savedAt}
      {void workAt}
    </Shell>
  );
};

// ---------------------------------------------------------------- às vezes a máscara gruda
export const HLRMaskSlider: React.FC<Pr> = (p) => {
  const f = useCurrentFrame();
  const [talkAt, diffAt, uniformAt, fakeAt, insideAt, sameAt, usingAt, seriousAt, startAt, maskAt, endAt, personAt, simpleAt, glueAt, silentAt, twoAt, fooledAt, believeAt, roleAt] = ks(p, ["talkAt", "diffAt", "uniformAt", "fakeAt", "insideAt", "sameAt", "usingAt", "seriousAt", "startAt", "maskAt", "endAt", "personAt", "simpleAt", "glueAt", "silentAt", "twoAt", "fooledAt", "believeAt", "roleAt"]);
  const part1 = 1 - P(f, seriousAt - 6, 12);
  const part2 = P(f, seriousAt - 6, 12) * (1 - P(f, glueAt - 6, 10));
  const part3 = P(f, glueAt - 6, 10) * (1 - P(f, twoAt - 8, 10));
  const part4 = P(f, twoAt - 8, 10);
  const blur = P(f, endAt - 20, 50);
  return (
    <Shell f={f} life={p.life} bg="radial-gradient(ellipse at 50% 45%, #121416 0%, #040506 78%)">
      {/* a máscara da Proteção Civil (objeto) */}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: (part1 + part2) * 0.9 }}>
        <g transform="translate(1440 520)">
          <path d="M -150 -170 Q 0 -230 150 -170 L 170 40 Q 120 190 0 210 Q -120 190 -170 40 Z" fill="#1b2026" stroke="#5a6470" strokeWidth={4} />
          <ellipse cx={-62} cy={-40} rx={46} ry={34} fill="#0a0c0e" stroke="#8a96a2" strokeWidth={4} />
          <ellipse cx={62} cy={-40} rx={46} ry={34} fill="#0a0c0e" stroke="#8a96a2" strokeWidth={4} />
          <rect x={-34} y={70} width={68} height={70} rx={14} fill="#2a3038" stroke="#5a6470" strokeWidth={3} />
          {f >= uniformAt ? <text x={0} y={260} textAnchor="middle" fill="#8fb0e0" fontFamily={MONO} fontSize={18} letterSpacing={4} opacity={P(f, uniformAt, 8)}>PROTEÇÃO CIVIL</text> : null}
        </g>
      </svg>
      {part1 > 0 ? (
        <AbsoluteFill style={{ opacity: part1 }}>
          <Head t="NAQUELA NOITE · O BARNEY" s={f >= diffAt ? "TALVEZ O ÚNICO QUE VEJA A ALYX DE OUTRO JEITO" : ""} c={"#8fb0e0"} />
          <div style={{ position: "absolute", left: 120, top: 280, width: 1000, fontFamily: FONT, fontWeight: 800, fontSize: 56, color: TXT, lineHeight: 1.15 }}>
            <div style={{ opacity: P(f, uniformAt, 8) }}>anos de uniforme</div>
            <div style={{ opacity: P(f, fakeAt, 8), color: "#8fb0e0" }}>fingindo servir os Combine</div>
            <div style={{ opacity: P(f, insideAt, 8), color: GREEN }}>ajudando por dentro</div>
            {f >= sameAt ? <div style={{ opacity: P(f, sameAt, 8), color: ORANGE, marginTop: 20 }}>{f >= usingAt ? "talvez ela só esteja usando eles" : "talvez a Alyx faça o mesmo"}</div> : null}
          </div>
        </AbsoluteFill>
      ) : null}
      {part2 > 0 ? (
        <AbsoluteFill style={{ opacity: part2 }}>
          <Head t="MAS ELE FICA SÉRIO" s={f >= startAt ? "TAMBÉM VIU GENTE COMEÇAR FINGINDO" : ""} c={RED} />
          <div style={{ position: "absolute", left: 160, right: 760, top: 500 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 22, letterSpacing: 5, color: TXT }}>
              <span style={{ color: "#8fb0e0" }}>A ATUAÇÃO</span>
              <span style={{ color: CREAM }}>A PESSOA</span>
            </div>
            <div style={{ position: "relative", height: 26, marginTop: 16, borderRadius: 13, background: `linear-gradient(90deg, #5a7aa8 ${50 - blur * 50}%, ${CREAM} ${50 + blur * 50}%)`, filter: `blur(${blur * 3}px)` }}>
              <div style={{ position: "absolute", left: "50%", top: -14, width: 4, height: 54, marginLeft: -2, background: TXT, opacity: 1 - blur }} />
            </div>
            <div style={{ fontFamily: MONO, fontSize: 18, letterSpacing: 4, color: "rgba(242,240,247,0.6)", marginTop: 16, opacity: P(f, endAt - 10, 10) }}>{f >= personAt ? "JÁ NEM SABIAM ONDE UMA TERMINAVA E A OUTRA COMEÇAVA" : f >= maskAt ? "A MÁSCARA SÓ PRA SOBREVIVER" : ""}</div>
          </div>
        </AbsoluteFill>
      ) : null}
      {part3 > 0 ? (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: part3 }}>
          <div style={{ fontFamily: MONO, fontSize: 20, letterSpacing: 8, color: "#8fb0e0" }}>BARNEY</div>
          <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 130, color: TXT }}>“Às vezes, a máscara gruda.”</div>
          {f >= silentAt ? <div style={{ fontFamily: MONO, fontSize: 20, letterSpacing: 6, color: AMB, marginTop: 20, opacity: P(f, silentAt, 8) }}>GORDON NÃO RESPONDE · O JOGO TAMBÉM NÃO</div> : null}
        </AbsoluteFill>
      ) : null}
      {part4 > 0 ? (
        <AbsoluteFill style={{ opacity: part4 }}>
          <Head t="DUAS POSSIBILIDADES" c={CREAM} />
          {[
            ["A ALYX ESTÁ", "enganando os Combine", GREEN, fooledAt],
            ["OU UMA PARTE DELA", "acredita no papel", RED, believeAt],
          ].map(([k, t, c, at], i) => (
            <div key={k as string} style={{ position: "absolute", left: 160 + i * 820, top: 380, width: 760, padding: "30px 34px", borderRadius: 16, background: "rgba(12,14,18,0.85)", border: `2px solid ${c}`, opacity: P(f, at as number, 8) }}>
              <div style={{ fontFamily: MONO, fontSize: 18, letterSpacing: 6, color: c as string }}>{k}</div>
              <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 64, color: TXT, lineHeight: 1.05 }}>{t}</div>
            </div>
          ))}
        </AbsoluteFill>
      ) : null}
      {void talkAt}
      {void simpleAt}
      {void roleAt}
    </Shell>
  );
};
