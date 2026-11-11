import React from "react";
import { Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { ZALE } from "./theme";
import { FONT } from "./overlays";
import { SEAM, Snd } from "./palco";
import { PAL } from "./cenas-dinamicas";

// DIORAMA 3D (pedido do usuário, 2026-09-28: "profundidade: se eu falo sol, mostra um sol meio 3D e a câmera se
// aproximando"). Objetos com volume (Fluent Emoji 3D da Microsoft, MIT, em public/fluent3d/<nome>.png) num cenário
// com chão e fundo, e uma CÂMERA que anda entre pontos (`cam`), aproxima e, no fim, mergulha no último ponto
// (a próxima cena chega vindo de longe). Tudo por dados: objetos, câmera, ligações, balões e chips.
// Coordenadas do "mundo" em px (o palco mostra ~1080 x 720 em volta da câmera, centro da tela em y 540).
// Tempos em frames relativos à Sequence (o edit.json usa segundos: chaves `at`/`...At`/`dur`).

type Fx = "shake" | "pulse" | "spin" | "bow" | "shrink" | "grow" | "fall" | "glow";
export type DObj = {
  id?: string;
  src: string; // nome em public/fluent3d (sem .png) ou caminho de imagem em public/
  x: number;
  y: number;
  size?: number;
  at: number;
  outAt?: number;
  z?: number; // 0 = frente, 1 = fundo (menor, desfocado, mais escuro)
  label?: string;
  labelAt?: number;
  color?: string;
  fx?: Fx;
  fxAt?: number;
  flip?: boolean;
  photo?: boolean; // imagem retangular (foto) em vez de objeto 3D
  w?: number; // largura da foto
  h?: number;
};
export type DCam = { at: number; x: number; y: number; zoom?: number; dur?: number };
export type DLink = { from: string; to: string; at: number; color?: string; dashed?: boolean; cutAt?: number };
export type DBubble = { text: string; x: number; y: number; at: number; tail?: "left" | "right"; outAt?: number; w?: number };
export type DChip = { text: string; x: number; y: number; at: number; color?: string; img?: string; outAt?: number; strikeAt?: number }; // img: objeto 3D ao lado do texto ("icon" é reservado aos ícones lucide)
export type DMove = { id: string; at: number; x: number; y: number; dur?: number; arc?: number };

const clampE = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
const ease = { ...clampE, easing: Easing.inOut(Easing.cubic) };
const srcOf = (s: string) => staticFile(s.includes("/") || s.includes(".") ? s : `fluent3d/${s}.png`);
const sp = (f: number, fps: number, at: number, k = { damping: 12, stiffness: 150, mass: 0.8 }) => (f < at ? 0 : spring({ frame: f - at, fps, config: k }));
const rnd = (k: number) => {
  const x = Math.sin(k * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const FLOOR = 720; // y do chão no mundo (sombras)

// posição da câmera no quadro f
const camAt = (cams: DCam[], f: number) => {
  const ks = cams.length ? [...cams].sort((a, b) => a.at - b.at) : [{ at: 0, x: 540, y: 540, zoom: 1 }];
  let c = { x: ks[0].x, y: ks[0].y, zoom: ks[0].zoom ?? 1 };
  for (let i = 1; i < ks.length; i++) {
    const k = ks[i];
    const t = interpolate(f, [k.at, k.at + (k.dur ?? 18)], [0, 1], ease);
    if (t <= 0) break;
    c = { x: c.x + (k.x - c.x) * t, y: c.y + (k.y - c.y) * t, zoom: c.zoom + ((k.zoom ?? 1) - c.zoom) * t };
  }
  return c;
};

// posição de um objeto (com os movimentos `moves`, em arco)
const posOf = (o: DObj, moves: DMove[], f: number) => {
  let x = o.x;
  let y = o.y;
  let lift = 0;
  for (const m of moves.filter((m) => m.id === o.id).sort((a, b) => a.at - b.at)) {
    const t = interpolate(f, [m.at, m.at + (m.dur ?? 16)], [0, 1], ease);
    if (t <= 0) break;
    const nx = x + (m.x - x) * t;
    const ny = y + (m.y - y) * t;
    lift = t < 1 ? Math.sin(t * Math.PI) * (m.arc ?? 120) : 0;
    x = nx;
    y = ny;
  }
  return { x, y: y - lift };
};

const Chip3: React.FC<{ c: DChip; on: number; f: number }> = ({ c, on, f }) => {
  const st = c.strikeAt !== undefined ? interpolate(f, [c.strikeAt, c.strikeAt + 8], [0, 1], clampE) : 0;
  const color = c.color ?? PAL.teal;
  return (
    <div
      style={{
        position: "absolute",
        left: c.x,
        top: c.y,
        transform: `translate(-50%, -50%) translate3d(0, ${((1 - on) * -40).toFixed(1)}px, 0) scale(${(0.5 + 0.5 * on).toFixed(3)})`,
        opacity: Math.min(1, on * 1.6),
        filter: on < 0.99 ? `blur(${((1 - on) * 8).toFixed(1)}px)` : undefined,
        display: "inline-flex",
        alignItems: "center",
        gap: 12,
        whiteSpace: "nowrap",
        padding: c.img ? "8px 26px 8px 10px" : "12px 26px",
        borderRadius: 999,
        background: "rgba(14,14,16,0.82)",
        border: `2.5px solid ${color}`,
        boxShadow: `0 18px 40px rgba(0,0,0,0.55), 0 0 30px ${color}33`,
        color: "#fff",
        fontSize: 38,
        fontWeight: 800,
      }}
    >
      {c.img ? <Img src={srcOf(c.img)} style={{ width: 58, height: 58 }} /> : null}
      {c.text}
      {st > 0 ? <div style={{ position: "absolute", left: 16, top: "50%", height: 7, width: `calc(${st * 100}% - 32px)`, background: ZALE.red, borderRadius: 4 }} /> : null}
    </div>
  );
};

export const Diorama: React.FC<{
  life: number;
  objs: DObj[];
  cam?: DCam[];
  links?: DLink[];
  bubbles?: DBubble[];
  chips?: DChip[];
  moves?: DMove[];
  floor?: boolean;
  dive?: boolean; // mergulho da câmera no fim (padrão sim)
}> = ({ life, objs, cam = [], links = [], bubbles = [], chips = [], moves = [], floor = true, dive = true }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = camAt(cam, f);
  // chegada vindo de longe e mergulho no fim
  const arrive = interpolate(f, [0, 16], [0, 1], { ...clampE, easing: Easing.out(Easing.cubic) });
  const diveT = dive ? interpolate(f, [life - 9, life], [0, 1], { ...clampE, easing: Easing.in(Easing.cubic) }) : 0;
  const z = c.zoom * (0.78 + 0.22 * arrive) * (1 + diveT * 1.4);
  const blur = (1 - arrive) * 10 + diveT * 12;
  const fade = Math.min(arrive * 1.4, 1 - diveT * 0.9);
  const CX = 540;
  const CY = 530;
  const world = `translate(${(CX - c.x * z).toFixed(2)}px, ${(CY - c.y * z).toFixed(2)}px) scale(${z.toFixed(4)})`;
  const byId: Record<string, DObj> = {};
  for (const o of objs) if (o.id) byId[o.id] = o;
  const pos = (id: string) => (byId[id] ? posOf(byId[id], moves, f) : { x: 0, y: 0 });
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: SEAM, overflow: "hidden", fontFamily: FONT, opacity: fade }}>
      {/* fundo: luzes desfocadas com paralaxe (andam menos que o mundo) */}
      {Array.from({ length: 10 }).map((_, k) => {
        const r = 60 + rnd(k + 7) * 130;
        const px = rnd(k) * 1300 - 110 - (c.x - 540) * 0.25;
        const py = 150 + rnd(k + 3) * 520 - (c.y - 540) * 0.25 + Math.sin(f / (70 + k * 9) + k) * 14;
        return <div key={k} style={{ position: "absolute", left: px - r / 2, top: py, width: r, height: r, borderRadius: r, background: [PAL.teal, PAL.gold, PAL.violet, "#ff6a4a"][k % 4], opacity: 0.1, filter: "blur(26px)" }} />;
      })}
      {/* chão em perspectiva (tela), com as travessas andando para a frente */}
      {floor ? (
        <svg width={1080} height={SEAM} style={{ position: "absolute", left: 0, top: 0 }}>
          <defs>
            <linearGradient id="dioFloor" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#fff" stopOpacity="0" />
              <stop offset="1" stopColor="#fff" stopOpacity="0.16" />
            </linearGradient>
          </defs>
          {Array.from({ length: 15 }).map((_, k) => {
            const bx = -700 + k * 177 - (c.x - 540) * 0.6;
            return <line key={`v${k}`} x1={540 + (bx - 540) * 0.08} y1={640} x2={bx} y2={SEAM + 200} stroke="url(#dioFloor)" strokeWidth={2} />;
          })}
          {Array.from({ length: 9 }).map((_, k) => {
            const t = (k + ((f * 0.02) % 1)) / 9;
            const y = 640 + (SEAM + 200 - 640) * t * t;
            return <line key={`h${k}`} x1={0} y1={y} x2={1080} y2={y} stroke="#fff" strokeOpacity={0.02 + 0.12 * t} strokeWidth={2} />;
          })}
        </svg>
      ) : null}
      {/* o mundo, visto pela câmera */}
      <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: SEAM, transformOrigin: "0 0", transform: world, filter: blur > 0.2 ? `blur(${blur.toFixed(1)}px)` : undefined }}>
        {/* ligações */}
        <svg width={4000} height={3000} style={{ position: "absolute", left: -1000, top: -1000, overflow: "visible" }}>
          {links.map((l, k) => {
            const a = pos(l.from);
            const b = pos(l.to);
            const t = interpolate(f, [l.at, l.at + 14], [0, 1], ease);
            const cut = l.cutAt !== undefined ? interpolate(f, [l.cutAt, l.cutAt + 8], [0, 1], clampE) : 0;
            if (t <= 0) return null;
            const mx = (a.x + b.x) / 2 + 1000;
            const my = (a.y + b.y) / 2 + 1000;
            return (
              <g key={k} opacity={1 - cut * 0.6}>
                <line x1={a.x + 1000} y1={a.y + 1000} x2={a.x + 1000 + (b.x - a.x) * t} y2={a.y + 1000 + (b.y - a.y) * t} stroke={l.color ?? PAL.gold} strokeWidth={l.dashed ? 6 : 11} strokeDasharray={l.dashed ? "16 14" : undefined} strokeLinecap="round" style={{ filter: l.dashed ? undefined : `drop-shadow(0 0 12px ${l.color ?? PAL.gold})` }} />
                {cut > 0 ? (
                  <g transform={`translate(${mx}, ${my}) scale(${cut})`}>
                    <circle r={36} fill={ZALE.red} />
                    <path d="M-14,-14 L14,14 M14,-14 L-14,14" stroke="#fff" strokeWidth={8} strokeLinecap="round" />
                  </g>
                ) : null}
              </g>
            );
          })}
        </svg>
        {/* objetos (os do fundo primeiro) */}
        {[...objs]
          .map((o, k) => ({ o, k }))
          .sort((p, q) => (q.o.z ?? 0) - (p.o.z ?? 0))
          .map(({ o, k }) => {
            const on = sp(f, fps, o.at, { damping: 11, stiffness: 160, mass: 0.8 });
            if (on <= 0) return null;
            const off = o.outAt !== undefined ? interpolate(f, [o.outAt, o.outAt + 10], [0, 1], ease) : 0;
            const p = posOf(o, moves, f);
            const zd = o.z ?? 0;
            const size = (o.size ?? 220) * (1 - 0.35 * zd);
            const fxT = o.fxAt !== undefined ? f - o.fxAt : -1;
            let sx = 1;
            let sy = 1;
            let rot = 0;
            let dx = 0;
            let dy = 0;
            let glow = 0;
            if (o.fx && fxT >= 0) {
              if (o.fx === "shake") dx = fxT < 16 ? Math.sin(fxT * 2.4) * (16 - fxT) * 1.2 : 0;
              if (o.fx === "pulse") sx = sy = 1 + 0.07 * Math.sin(fxT / 4);
              if (o.fx === "spin") sx = Math.cos(Math.min(1, fxT / 18) * Math.PI * 2);
              if (o.fx === "bow") rot = 14 + Math.sin(fxT / 5) * 5;
              if (o.fx === "shrink") sx = sy = interpolate(fxT, [0, 14], [1, 0.62], ease);
              if (o.fx === "grow") sx = sy = interpolate(fxT, [0, 14], [1, 1.28], ease);
              if (o.fx === "fall") dy = interpolate(fxT, [0, 14], [0, 260], { ...clampE, easing: Easing.in(Easing.quad) });
              if (o.fx === "glow") glow = interpolate(fxT, [0, 10], [0, 1], clampE);
            }
            const bob = Math.sin(f / 22 + k * 1.7) * 6 * (1 - zd * 0.5);
            const enterY = (1 - on) * -140;
            const alpha = Math.min(1, on * 1.5) * (1 - off) * (o.fx === "fall" && fxT >= 0 ? 1 - interpolate(fxT, [8, 16], [0, 1], clampE) : 1);
            const lab = o.label ? sp(f, fps, o.labelAt ?? o.at + 6) : 0;
            const w = o.photo ? o.w ?? 600 : size;
            const h = o.photo ? o.h ?? 400 : size;
            const shadowY = o.photo ? p.y + h / 2 + 30 : Math.max(p.y + size * 0.46, Math.min(FLOOR, p.y + size * 0.62));
            return (
              <React.Fragment key={k}>
                {/* sombra no chão: encolhe quando o objeto sobe */}
                <div style={{ position: "absolute", left: p.x - w * 0.36, top: shadowY - 10, width: w * 0.72, height: 26, borderRadius: "50%", background: "rgba(0,0,0,0.55)", filter: "blur(12px)", opacity: alpha * (0.5 + 0.5 * on) * (1 - zd * 0.5), transform: `scale(${(0.6 + 0.4 * on - Math.abs(bob) * 0.004).toFixed(3)})` }} />
                <div
                  style={{
                    position: "absolute",
                    left: p.x - w / 2 + dx,
                    top: p.y - h / 2 + bob + enterY + dy,
                    width: w,
                    height: h,
                    opacity: alpha,
                    transform: `scale(${((0.3 + 0.7 * on) * (1 - off * 0.4)).toFixed(4)}) scaleX(${(sx * (o.flip ? -1 : 1)).toFixed(4)}) scaleY(${sy.toFixed(4)}) rotate(${rot.toFixed(2)}deg)`,
                    transformOrigin: o.fx === "bow" ? "50% 90%" : "50% 50%",
                    filter: `${zd > 0 ? `blur(${(zd * 4).toFixed(1)}px) brightness(${(1 - zd * 0.35).toFixed(2)})` : ""} ${glow > 0 ? `drop-shadow(0 0 ${(30 * glow).toFixed(0)}px ${o.color ?? PAL.gold})` : ""} drop-shadow(0 24px 30px rgba(0,0,0,0.45))`,
                    borderRadius: o.photo ? 30 : 0,
                    overflow: o.photo ? "hidden" : "visible",
                    boxShadow: o.photo ? "0 30px 80px rgba(0,0,0,0.6)" : undefined,
                  }}
                >
                  <Img src={srcOf(o.src)} style={{ width: "100%", height: "100%", objectFit: o.photo ? "cover" : "contain" }} />
                </div>
                {o.label ? <Chip3 c={{ text: o.label, x: p.x, y: shadowY + 42, at: 0, color: o.color }} on={lab * (1 - off)} f={f} /> : null}
              </React.Fragment>
            );
          })}
        {/* balões de fala */}
        {bubbles.map((b, k) => {
          const on = sp(f, fps, b.at, { damping: 12, stiffness: 190, mass: 0.7 });
          const off = b.outAt !== undefined ? interpolate(f, [b.outAt, b.outAt + 8], [0, 1], clampE) : 0;
          if (on <= 0) return null;
          const right = b.tail === "right";
          return (
            <div
              key={k}
              style={{
                position: "absolute",
                left: b.x,
                top: b.y,
                width: "max-content",
                maxWidth: b.w ?? 460,
                transform: `translate(-50%, -100%) scale(${(0.5 + 0.5 * on).toFixed(3)})`,
                transformOrigin: right ? "90% 100%" : "10% 100%",
                opacity: Math.min(1, on * 1.6) * (1 - off),
                background: "#fff",
                color: "#111",
                borderRadius: right ? "34px 34px 8px 34px" : "34px 34px 34px 8px",
                padding: "20px 28px",
                fontSize: 38,
                fontWeight: 800,
                lineHeight: 1.15,
                boxShadow: "0 22px 50px rgba(0,0,0,0.5)",
              }}
            >
              {b.text}
            </div>
          );
        })}
        {chips.map((ch, k) => {
          const on = sp(f, fps, ch.at);
          const off = ch.outAt !== undefined ? interpolate(f, [ch.outAt, ch.outAt + 8], [0, 1], clampE) : 0;
          return on > 0 ? <Chip3 key={k} c={ch} on={on * (1 - off)} f={f} /> : null;
        })}
      </div>
      {/* sons: um por elemento, no quadro em que ele entra ou muda */}
      {objs.map((o, k) => (
        <React.Fragment key={`s${k}`}>
          <Snd at={o.at} name="pop" k="dio-obj" />
          {o.fx && o.fxAt !== undefined ? (
            o.fx === "shake" || o.fx === "fall" ? (
              <Snd at={o.fxAt} name="error" k="dio-bad" />
            ) : o.fx === "glow" || o.fx === "grow" ? (
              <Snd at={o.fxAt} name="ding" k="dio-good" />
            ) : (
              <Snd at={o.fxAt} name="switch" k="dio-fx" />
            )
          ) : null}
        </React.Fragment>
      ))}
      {moves.map((m, k) => (
        <Snd key={`m${k}`} at={m.at} name="tap" k="dio-move" />
      ))}
      {links.map((l, k) => (
        <React.Fragment key={`l${k}`}>
          <Snd at={l.at} name="switch" k="dio-link" />
          {l.cutAt !== undefined ? <Snd at={l.cutAt} name="error" k="dio-cut" /> : null}
        </React.Fragment>
      ))}
      {bubbles.map((b, k) => (
        <Snd key={`b${k}`} at={b.at} name="pop" k="dio-bubble" />
      ))}
      {chips.map((ch, k) => (
        <React.Fragment key={`c${k}`}>
          <Snd at={ch.at} name="tick" file="tick.wav" vol={0.2} k="dio-chip" />
          {ch.strikeAt !== undefined ? <Snd at={ch.strikeAt} name="tick" file="pen_stroke.wav" vol={0.4} k="pen" /> : null}
        </React.Fragment>
      ))}
    </div>
  );
};
