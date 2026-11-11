import React from "react";
import { Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont as loadCaveat } from "@remotion/google-fonts/Caveat";
import { Heart, MessageCircle, Sparkles } from "lucide-react";
import { SEAM, Snd, SndSpan } from "./palco";
import { FONT } from "./overlays";
import { clamp, lock, rnd, sp } from "./cenas-metafora";

import { TX } from "./textos";
import { ZALE } from "./theme";
// OBJETOS DO DIA A DIA FAZENDO UMA AÇÃO FÍSICA (a linha que o usuário aprovou no vídeo dos "3 erros"), desenhados
// com volume, material e luz. Nada de personagem desenhada (rejeitada como infantil).

// ---------- caixa de correio (vista 3/4, metal, poste de madeira, portinha que abre para baixo, bandeirinha) ----------
const Mailbox: React.FC<{ x: number; y: number; label: string; body: [string, string]; open: number; flag: number; t: number; empty?: boolean; fill?: number; dust?: number }> = ({ x, y, label, body, open, flag, t, empty, fill = 0, dust = 0 }) => {
  const id = label.replace(/\W/g, "");
  // a portinha (arco da frente) gira para baixo em torno da dobradiça de baixo
  const doorAng = -112 * open;
  return (
    <div style={{ position: "absolute", left: x - 200, top: y - 300, width: 400, height: 560 }}>
      <svg width={400} height={560} viewBox="0 0 400 560" style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <defs>
          <linearGradient id={`body-${id}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={body[1]} />
            <stop offset="0.35" stopColor={body[0]} />
            <stop offset="0.7" stopColor={body[0]} />
            <stop offset="1" stopColor={body[1]} />
          </linearGradient>
          <linearGradient id={`top-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.5" />
            <stop offset="1" stopColor={body[0]} stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`wood-${id}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#5b3a1f" />
            <stop offset="0.5" stopColor="#8a5a31" />
            <stop offset="1" stopColor="#4a2e17" />
          </linearGradient>
          <radialGradient id={`inside-${id}`} cx="50%" cy="60%" r="70%">
            <stop offset="0" stopColor="#1a1d21" />
            <stop offset="1" stopColor="#050607" />
          </radialGradient>
          <linearGradient id={`brass-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f6dc8e" />
            <stop offset="1" stopColor="#a67c1a" />
          </linearGradient>
        </defs>
        {/* sombra longa de fim de tarde (projetada para a esquerda) */}
        <ellipse cx={150} cy={548} rx={190} ry={16} fill="rgba(0,0,0,0.5)" transform="skewX(-40) translate(420 0)" style={{ filter: "blur(6px)" }} />
        {/* poste */}
        <rect x={170} y={300} width={60} height={250} rx={6} fill={`url(#wood-${id})`} />
        {[340, 400, 470, 520].map((gy, k) => (
          <path key={k} d={`M${178 + k * 9},${gy} q10,14 0,30`} stroke="rgba(40,20,5,0.45)" strokeWidth={3} fill="none" />
        ))}
        <rect x={120} y={292} width={200} height={20} rx={5} fill="#6b4424" />
        {/* placa de latão com o nome */}
        <rect x={140} y={380} width={120} height={46} rx={8} fill={`url(#brass-${id})`} stroke="#7a5a12" strokeWidth={2} />
        <text x={200} y={411} textAnchor="middle" fontFamily={FONT} fontSize={22} fontWeight={900} fill="#3b2a06">
          {label}
        </text>
        {/* caixa: arco de trás, tampo curvo, lateral, e o arco da frente (a abertura) */}
        <path d="M105,272 L105,142 A100,100 0 0 1 305,142 L305,272 Z" fill={body[1]} />
        <path d="M50,170 A100,100 0 0 1 250,170 L305,142 A100,100 0 0 0 105,142 Z" fill={`url(#body-${id})`} />
        <path d="M50,170 A100,100 0 0 1 250,170 L305,142 A100,100 0 0 0 105,142 Z" fill={`url(#top-${id})`} opacity={0.6} />
        <path d="M250,170 L305,142 L305,272 L250,300 Z" fill={body[1]} />
        <path d="M250,300 L305,272 L305,284 L250,312 Z" fill="rgba(0,0,0,0.35)" />
        {/* a abertura (o que se vê quando a porta abre) */}
        <path d="M58,300 L58,172 A92,92 0 0 1 242,172 L242,300 Z" fill={`url(#inside-${id})`} />
        {!empty && fill > 0
          ? // cartas empilhadas lá dentro, aparecendo pela abertura
            Array.from({ length: Math.min(6, Math.ceil(fill * 6)) }).map((_, k) => <rect key={k} x={70 + (k % 2) * 6} y={286 - k * 16} width={160} height={14} rx={3} fill={k % 2 ? "#fff6e6" : "#f3e7d0"} transform={`rotate(${(k % 3) - 1} 150 ${286 - k * 16})`} />)
          : null}
        {empty ? (
          <g opacity={open}>
            {/* teia de aranha no canto de cima */}
            {[0, 1, 2, 3, 4].map((k) => (
              <line key={k} x1={80} y1={165} x2={80 + Math.cos((k / 4) * Math.PI * 0.5) * 110} y2={165 + Math.sin((k / 4) * Math.PI * 0.5) * 110} stroke="rgba(255,255,255,0.35)" strokeWidth={1.4} />
            ))}
            {[30, 60, 90].map((r, k) => (
              <path key={k} d={`M${80 + r},165 Q${80 + r * 0.8},${165 + r * 0.8} 80,${165 + r}`} fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth={1.2} />
            ))}
            {/* poeira no feixe de luz */}
            {Array.from({ length: 12 }).map((_, k) => {
              const px = 90 + rnd(k) * 130;
              const py = 190 + ((rnd(k + 3) * 100 + t * (0.4 + rnd(k + 5) * 0.5)) % 110);
              return <circle key={`d${k}`} cx={px} cy={py} r={1.6 + rnd(k + 7) * 1.6} fill="#ffe7c2" opacity={0.5 * dust} />;
            })}
            <path d="M242,180 L140,300 L242,300 Z" fill="rgba(255,210,150,0.08)" />
          </g>
        ) : null}
        {/* bandeirinha vermelha na lateral (baixa = deitada; alta = em pé) */}
        <g transform={`rotate(${(-90 + 90 * flag).toFixed(2)} 292 236)`}>
          <rect x={288} y={150} width={8} height={90} rx={3} fill="#b8bec4" />
          <path d="M296,152 L352,152 L352,190 L296,190 Z" fill={ZALE.red} />
          <path d="M296,152 L352,152 L352,160 L296,160 Z" fill="rgba(255,255,255,0.25)" />
        </g>
        <circle cx={292} cy={236} r={7} fill="#7d858c" />
        {/* brilho de metal no tampo (luz quente vindo da direita) */}
        <path d="M150,72 A100,100 0 0 1 245,150" stroke="rgba(255,214,170,0.55)" strokeWidth={6} fill="none" strokeLinecap="round" />
      </svg>
      {/* a porta, em 3D, girando para baixo */}
      <div style={{ position: "absolute", left: 50, top: 70, width: 200, height: 230, perspective: 700 }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "100px 100px 6px 6px",
            background: `linear-gradient(90deg, ${body[1]}, ${body[0]} 35%, ${body[0]} 70%, ${body[1]})`,
            boxShadow: "inset 0 0 0 6px rgba(255,255,255,0.12), inset 0 -10px 20px rgba(0,0,0,0.25)",
            transformOrigin: "50% 100%",
            transform: `rotateX(${doorAng.toFixed(2)}deg)`,
            backfaceVisibility: "visible",
          }}
        >
          <div style={{ position: "absolute", left: 88, top: 40, width: 24, height: 24, borderRadius: 12, background: "radial-gradient(circle at 35% 35%, #f3f3f3, #8d949a)", boxShadow: "0 3px 6px rgba(0,0,0,0.4)" }} />
          <div style={{ position: "absolute", left: 40, right: 40, top: 20, height: 8, borderRadius: 4, background: "rgba(255,255,255,0.18)" }} />
        </div>
      </div>
    </div>
  );
};

// envelope com selo de coração
const Letter: React.FC<{ x: number; y: number; r: number; s: number; o?: number }> = ({ x, y, r, s, o = 1 }) => (
  <svg width={110 * s} height={74 * s} viewBox="0 0 110 74" style={{ position: "absolute", left: x - 55 * s, top: y - 37 * s, transform: `rotate(${r.toFixed(1)}deg)`, opacity: o, filter: "drop-shadow(0 10px 12px rgba(0,0,0,0.4))" }}>
    <rect x={2} y={2} width={106} height={70} rx={6} fill="#fff8ec" />
    <path d="M2,8 L55,44 L108,8" fill="none" stroke="#e3d6bd" strokeWidth={4} />
    <path d="M55,52 C49,44 40,50 46,57 L55,65 L64,57 C70,50 61,44 55,52 Z" fill="#e6395a" />
  </svg>
);

// ============ O1. abertura: a caixa de elogios transborda; a de indicações está vazia ============
export const Mailboxes: React.FC<{ life: number; loveAt?: number; neverAt?: number; left?: string; right?: string }> = ({ life, loveAt = 30, neverAt = 80, left = "elogios", right = "indicações" }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const out = interpolate(f, [life - 7, life], [1, 0], { ...clamp, easing: Easing.in(Easing.cubic) });
  const arrive = interpolate(f, [0, 14], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const openL = interpolate(f, [loveAt - 8, loveAt + 2], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.4)) });
  const N = 9;
  const every = 3;
  const inside = 6; // as 6 primeiras entram; as outras transbordam
  const fill = Math.min(1, Math.max(0, (f - loveAt) / (inside * every)));
  const flagL = interpolate(f, [loveAt + inside * every, loveAt + inside * every + 10], [0, 1], { ...clamp, easing: Easing.out(Easing.back(2)) });
  // câmera: as duas caixas -> vai para a de indicações e aproxima
  const cam = interpolate(f, [neverAt - 10, neverAt + 8], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const openR = interpolate(f, [neverAt + 4, neverAt + 26], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const LX = 310;
  const RX = 790;
  const Y = 560;
  const cx = 540 + (RX - 540) * cam;
  const z = (0.9 + 0.1 * arrive) * (1 + 0.3 * cam);
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: SEAM, overflow: "hidden", opacity: out }}>
      {/* céu e luz de fim de tarde */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,#1b1422 0%,#3a1f2a 45%,#7a3b26 78%,#2a1a14 100%)" }} />
      <div style={{ position: "absolute", left: 620, top: 520, width: 900, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,170,90,0.45), rgba(255,170,90,0) 70%)" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 800, bottom: 0, background: "linear-gradient(180deg,#2c1e17,#140d0a)" }} />
      <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: SEAM, transformOrigin: "0 0", transform: `translate(${(540 - cx * z).toFixed(1)}px, ${(560 - Y * z).toFixed(1)}px) scale(${z.toFixed(4)})`, filter: arrive < 1 ? `blur(${((1 - arrive) * 6).toFixed(1)}px)` : undefined }}>
        <Mailbox x={LX} y={Y} label={left} body={["#e7ecef", "#8e979e"]} open={openL} flag={flagL} t={f} fill={fill} />
        <Mailbox x={RX} y={Y} label={right} body={["#5f6a73", "#2c3238"]} open={openR} flag={0} t={f} empty dust={openR} />
        {/* cartas caindo na caixa de elogios; as últimas transbordam para o chão */}
        {Array.from({ length: N }).map((_, k) => {
          const at = loveAt + k * every;
          const tt = (f - at) / 12;
          if (tt < 0) return null;
          const inBox = k < inside;
          const doorX = LX - 50;
          const doorY = Y - 120;
          if (inBox) {
            if (tt > 1) return null;
            const e = Easing.in(Easing.quad)(Math.min(1, tt));
            return <Letter key={k} x={doorX + (rnd(k) - 0.5) * 40} y={Y - 520 + (doorY - (Y - 520)) * e} r={(rnd(k + 2) - 0.5) * 60 * (1 - e)} s={1 - 0.35 * e} o={tt > 0.9 ? (1 - tt) * 10 : 1} />;
          }
          // transbordou: bate na borda e cai no chão ao lado do poste
          const land = [
            [LX - 150, Y + 250, -18],
            [LX + 120, Y + 262, 12],
            [LX - 60, Y + 270, 6],
          ][k - inside];
          const e = Math.min(1, tt / 1.4);
          const bounce = e >= 1 ? 0 : Math.sin(e * Math.PI) * -120;
          return <Letter key={k} x={doorX + (land[0] - doorX) * e} y={doorY + (land[1] - doorY) * e + bounce} r={land[2] * e + (1 - e) * 40} s={0.95} />;
        })}
      </div>
      <Snd at={loveAt - 8} name="tick" file="mailbox_open.wav" vol={0.6} k="mailbox" />
      {/* carta caindo dentro da caixa (Freesound 558143); as que transbordam batem no chão */}
      {Array.from({ length: N }).map((_, k) => (k < inside ? (k % 2 === 0 ? <Snd key={k} at={loveAt + k * every + 9} name="tick" file="letter_drop.wav" vol={0.32} k="letter" /> : null) : <Snd key={k} at={loveAt + k * every + 16} name="tick" file="letter_drop.wav" vol={0.24} k="letter" />))}
      <Snd at={loveAt + inside * every} name="tick" file="metal_clank.wav" vol={0.35} k="flag" />
      <Snd at={neverAt + 4} name="tick" file="mailbox_open.wav" vol={0.8} k="mailbox" />
    </div>
  );
};


// ---------- base comum das cenas de objeto: fundo de fim de tarde (mesma luz das caixas) e câmera ----------
const { fontFamily: HAND } = loadCaveat();
const Sunset: React.FC<{ glowX?: number }> = ({ glowX = 620 }) => (
  <>
    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,#1b1422 0%,#3a1f2a 45%,#7a3b26 78%,#2a1a14 100%)" }} />
    <div style={{ position: "absolute", left: glowX, top: 520, width: 900, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,170,90,0.42), rgba(255,170,90,0) 70%)" }} />
    <div style={{ position: "absolute", left: 0, right: 0, top: 800, bottom: 0, background: "linear-gradient(180deg,#2c1e17,#140d0a)" }} />
  </>
);
const Room: React.FC = () => (
  <>
    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,#2a2320 0%,#3b302a 60%,#1c1512 100%)" }} />
    <div style={{ position: "absolute", left: -200, top: 120, width: 800, height: 700, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,214,160,0.22), rgba(255,214,160,0) 70%)" }} />
    <div style={{ position: "absolute", left: 0, right: 0, top: 820, bottom: 0, background: "linear-gradient(180deg,#5a4131,#2b1f17)" }} />
    {Array.from({ length: 9 }).map((_, k) => (
      <div key={k} style={{ position: "absolute", left: k * 130 - 40, top: 820, width: 3, height: 200, background: "rgba(0,0,0,0.25)", transform: `skewX(${(k - 4) * 8}deg)`, transformOrigin: "top" }} />
    ))}
  </>
);
const useScene = (life: number) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const out = interpolate(f, [life - 7, life], [1, 0], { ...clamp, easing: Easing.in(Easing.cubic) });
  const arrive = interpolate(f, [0, 14], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  return { f, fps, out, arrive };
};
const Frame: React.FC<{ out: number; children: React.ReactNode }> = ({ out, children }) => (
  <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: SEAM, overflow: "hidden", opacity: out, fontFamily: FONT }}>{children}</div>
);

// envelope grande (para o carimbo)
const BigEnvelope: React.FC<{ w: number }> = ({ w }) => (
  <svg width={w} height={w * 0.64} viewBox="0 0 500 320" style={{ filter: "drop-shadow(0 30px 40px rgba(0,0,0,0.55))" }}>
    <defs>
      <linearGradient id="envG" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#fffaf0" />
        <stop offset="1" stopColor="#eadfca" />
      </linearGradient>
    </defs>
    <rect x={4} y={4} width={492} height={312} rx={14} fill="url(#envG)" />
    <path d="M4,20 L250,190 L496,20" fill="none" stroke="#d9ccb2" strokeWidth={6} />
    <path d="M4,316 L200,160 M496,316 L300,160" stroke="#e6dcc6" strokeWidth={4} />
    <rect x={390} y={28} width={80} height={96} rx={6} fill="#f3d9d0" stroke="#e0b3a3" strokeWidth={3} strokeDasharray="6 5" />
    <path d="M430,70 C422,60 408,68 416,78 L430,92 L444,78 C452,68 438,60 430,70 Z" fill="#e6395a" />
    {[0, 1, 2].map((k) => (
      <rect key={k} x={60} y={210 + k * 30} width={[220, 180, 140][k]} height={12} rx={6} fill="#c9bda5" />
    ))}
  </svg>
);

// ============ O2. a culpa não é dela (carimbo) / toda clínica pede do mesmo jeito (rua de caixas, em sincronia) ============
export const NotHerFault: React.FC<{ life: number; stampAt?: number; rowAt?: number; sameAt?: number }> = ({ life, stampAt = 14, rowAt = 50, sameAt = 150 }) => {
  const { f, fps, out, arrive } = useScene(life);
  const st = interpolate(f, [stampAt - 6, stampAt], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  const ink = f >= stampAt ? 1 : 0;
  const shake = f >= stampAt && f < stampAt + 10 ? Math.sin((f - stampAt) * 2.6) * (10 - (f - stampAt)) * 1.2 : 0;
  const crane = interpolate(f, [rowAt, rowAt + 30], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const N = 7;
  const same = f >= sameAt;
  const flags = interpolate(f, [sameAt + 6, sameAt + 16], [0, 1], { ...clamp, easing: Easing.out(Easing.back(2)) });
  return (
    <Frame out={out}>
      <Sunset />
      {/* 1) o envelope e o carimbo */}
      <div style={{ position: "absolute", inset: 0, opacity: 1 - crane, transform: `translateY(${(crane * -300).toFixed(1)}px) scale(${(1 - crane * 0.4).toFixed(3)})`, transformOrigin: "540px 500px" }}>
        <div style={{ position: "absolute", left: 540 - 300, top: 330, transform: `translateX(${shake.toFixed(1)}px) rotate(-4deg) scale(${(0.9 + 0.1 * arrive).toFixed(3)})` }}>
          <BigEnvelope w={600} />
          {ink ? (
            <div style={{ position: "absolute", left: 90, top: 90, padding: "14px 26px", border: "8px solid rgba(200,30,20,0.9)", borderRadius: 14, color: "rgba(200,30,20,0.92)", fontSize: 50, fontWeight: 900, letterSpacing: 2, transform: "rotate(-12deg)", mixBlendMode: "multiply", textTransform: "uppercase" }}>a culpa não é dela</div>
          ) : null}
        </div>
        {/* o carimbo descendo */}
        <svg width={220} height={260} viewBox="0 0 220 260" style={{ position: "absolute", left: 540 - 110, top: 180 - (1 - st) * 260 + (ink ? interpolate(f, [stampAt, stampAt + 14], [0, -260], clamp) : 0), opacity: ink && f > stampAt + 12 ? 0 : 1, filter: "drop-shadow(0 20px 20px rgba(0,0,0,0.5))" }}>
          <rect x={80} y={0} width={60} height={120} rx={28} fill="#6b3f22" />
          <rect x={30} y={110} width={160} height={50} rx={10} fill="#8a5a31" />
          <rect x={20} y={158} width={180} height={40} rx={6} fill="#b8231a" />
        </svg>
      </div>
      {/* 2) a câmera sobe: a rua de caixas, até o horizonte */}
      {crane > 0 ? (
        <div style={{ position: "absolute", inset: 0, opacity: crane }}>
          {Array.from({ length: N })
            .map((_, k) => N - 1 - k)
            .map((k) => {
              const d = k / (N - 1);
              const x = 200 + d * 700;
              const y = 700 - d * 250;
              const s = 0.62 - d * 0.42;
              const on = sp(f, fps, rowAt + 6 + k * 3);
              return (
                <div key={k} style={{ position: "absolute", left: 0, top: 0, transformOrigin: `${x}px ${y}px`, transform: `translate(${x - 200}px, ${y - 560}px) scale(${s.toFixed(3)})`, filter: `blur(${(d * 3.5).toFixed(1)}px) brightness(${(1 - d * 0.35).toFixed(2)})`, opacity: Math.min(1, on * 1.5) }}>
                  <Mailbox x={200} y={560} label={TX.negocio} body={["#5f6a73", "#2c3238"]} open={0} flag={flags} t={f} />
                  {same ? (
                    <div style={{ position: "absolute", left: 200 - 60, top: 560 - 200, width: 120, height: 80, transform: `translateY(${(-40 * Math.max(0, 1 - (f - sameAt) / 6)).toFixed(1)}px) rotate(-8deg)` }}>
                      <svg width={120} height={80} viewBox="0 0 120 80" style={{ filter: "drop-shadow(0 8px 10px rgba(0,0,0,0.45))" }}>
                        <rect x={2} y={2} width={116} height={76} rx={8} fill="#fffaf0" />
                        <path d="M2,10 L60,46 L118,10" fill="none" stroke="#e3d6bd" strokeWidth={4} />
                      </svg>
                    </div>
                  ) : null}
                </div>
              );
            })}
        </div>
      ) : null}
      <Snd at={stampAt} name="tick" file="stamp.wav" vol={0.5} k="stamp" />
      <Snd at={stampAt} name="thud" k="stamp-impact" />
      {Array.from({ length: N }).map((_, k) => (k % 2 === 0 ? <Snd key={k} at={rowAt + 6 + k * 3} name="tick" file="tick.wav" vol={0.12} k="row" /> : null))}
      <Snd at={sameAt} name="tick" file="letter_drop.wav" vol={0.45} k="same-note" />
      <Snd at={sameAt + 6} name="tick" file="metal_clank.wav" vol={0.35} k="flag" />
    </Frame>
  );
};

// ============ O3. o pedido genérico vira um post-it frágil e cai quando a porta abre ============
export const PostItDoor: React.FC<{ life: number; text: string; typeAt?: number; dur?: number; stickAt?: number; openAt?: number }> = ({ life, text, typeAt = 30, dur = 90, stickAt = 125, openAt = 140 }) => {
  const { f, fps, out, arrive } = useScene(life);
  const n = Math.round(interpolate(f, [typeAt, typeAt + dur], [0, text.length], clamp));
  const stick = interpolate(f, [stickAt, stickAt + 10], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const open = interpolate(f, [openAt, openAt + 18], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const fall = f - openAt - 4;
  const DX = 330;
  const DY = 190;
  const DW = 420;
  const DH = 640;
  // post-it: colado na porta, depois o vento da porta arranca e ele cai balançando
  const px = DX + 150 + (fall > 0 ? Math.sin(fall / 4) * 60 + fall * 5 : 0);
  const py = DY + 170 + (fall > 0 ? Math.min(560, fall * fall * 0.9) : 0);
  const pr = fall > 0 ? Math.sin(fall / 3) * 35 : -4;
  return (
    <Frame out={out}>
      <Room />
      <div style={{ position: "absolute", inset: 0, transform: `scale(${(0.92 + 0.08 * arrive + 0.04 * (f / life)).toFixed(4)})`, transformOrigin: "540px 520px" }}>
        {/* batente e porta de madeira (abre para dentro, com luz do corredor) */}
        <div style={{ position: "absolute", left: DX - 30, top: DY - 30, width: DW + 60, height: DH + 30, background: "linear-gradient(90deg,#5b3a1f,#8a5a31,#5b3a1f)", borderRadius: "10px 10px 0 0", boxShadow: "0 30px 60px rgba(0,0,0,0.5)" }} />
        <div style={{ position: "absolute", left: DX, top: DY, width: DW, height: DH, background: `linear-gradient(180deg, rgba(255,236,200,${(0.95 * open).toFixed(2)}), rgba(255,210,150,${(0.6 * open).toFixed(2)}))` }} />
        <div style={{ position: "absolute", left: DX, top: DY, width: DW, height: DH, perspective: 1400 }}>
          <div style={{ position: "absolute", inset: 0, transformOrigin: "0% 50%", transform: `rotateY(${(-78 * open).toFixed(2)}deg)`, background: "linear-gradient(90deg,#9c6b3f,#c08a52 40%,#a5703f)", boxShadow: "inset 0 0 0 12px rgba(70,40,15,0.35)" }}>
            {[0, 1].map((k) => (
              <div key={k} style={{ position: "absolute", left: 50, right: 50, top: 60 + k * 300, height: 240, borderRadius: 8, boxShadow: "inset 0 0 0 6px rgba(70,40,15,0.35), inset 0 0 30px rgba(0,0,0,0.15)" }} />
            ))}
            <div style={{ position: "absolute", right: 36, top: DH / 2 - 10, width: 50, height: 16, borderRadius: 8, background: "linear-gradient(#f3d27a,#a67c1a)", boxShadow: "0 3px 6px rgba(0,0,0,0.4)" }} />
          </div>
        </div>
        {/* luz do corredor entrando no chão */}
        <div style={{ position: "absolute", left: DX, top: DY + DH, width: DW, height: 200, background: `linear-gradient(180deg, rgba(255,214,160,${(0.35 * open).toFixed(2)}), rgba(255,214,160,0))`, transform: "skewX(-20deg)", transformOrigin: "top" }} />
        {/* a frase da médica, digitada num balão, que se encolhe e vira o post-it */}
        {stick < 1 && n > 0 ? (
          <div style={{ position: "absolute", left: 90 + stick * (px - 90 - 20), top: 250 + stick * (py - 250), width: 900 - stick * 700, padding: "22px 30px", background: "#fff", color: "#161616", borderRadius: "34px 34px 34px 8px", fontSize: 44 - stick * 20, fontWeight: 800, lineHeight: 1.18, boxShadow: "0 30px 60px rgba(0,0,0,0.5)", opacity: 1 - stick * 0.8 }}>
            {text.slice(0, n)}
          </div>
        ) : null}
        {stick > 0 ? (
          <div style={{ position: "absolute", left: px, top: py, width: 200, height: 190, transform: `rotate(${pr.toFixed(1)}deg) scale(${(0.6 + 0.4 * stick).toFixed(3)})`, transformOrigin: "50% 0%", opacity: stick }}>
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(160deg,#fff27a,#f3d33d)", boxShadow: "0 16px 24px rgba(0,0,0,0.4)", borderRadius: "2px 2px 18px 2px", padding: 16, boxSizing: "border-box", fontFamily: HAND, fontSize: 34, lineHeight: 1.05, color: "#3a3208" }}>{text}</div>
            <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 26, background: "rgba(0,0,0,0.06)" }} />
          </div>
        ) : null}
      </div>
      <SndSpan at={typeAt} dur={dur} name="type" vol={0.22} />
      <Snd at={stickAt + 8} name="tick" file="tick.wav" vol={0.2} k="postit" />
      <Snd at={openAt} name="tick" file="door_open.wav" vol={0.7} k="door" />
    </Frame>
  );
};

// ============ O4. o "Claro!" e o post-it esquecido no elevador (sem personagem) ============
export const ElevatorForgotten: React.FC<{ life: number; claroAt?: number; closeAt?: number; floors?: number }> = ({ life, claroAt = 20, closeAt = 90, floors = 5 }) => {
  const { f, fps, out, arrive } = useScene(life);
  const cl = sp(f, fps, claroAt, { damping: 10, stiffness: 200, mass: 0.6 });
  const close = interpolate(f, [closeAt, closeAt + 18], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const bump = f > closeAt + 18 ? Math.exp(-(f - closeAt - 18) / 4) * Math.sin((f - closeAt - 18) * 1.6) * 5 : 0;
  const floor = Math.max(0, floors - Math.floor(Math.max(0, f - closeAt - 20) / 9));
  const W = 600;
  const X = 540 - W / 2;
  const T = 230;
  const H = 640;
  const sheen = ((f * 6) % 900) - 300;
  return (
    <Frame out={out}>
      <Room />
      <div style={{ position: "absolute", inset: 0, transformOrigin: "540px 520px", transform: `scale(${(0.9 + 0.1 * arrive + 0.06 * (f / life)).toFixed(4)})` }}>
        <div style={{ position: "absolute", left: X - 56, top: T - 110, width: W + 112, height: H + 150, borderRadius: 22, background: "linear-gradient(180deg,#4a4f57,#2a2d33)", boxShadow: "0 50px 90px rgba(0,0,0,0.65), inset 0 2px 0 rgba(255,255,255,0.12)" }} />
        <div style={{ position: "absolute", left: 540 - 95, top: T - 88, width: 190, height: 62, borderRadius: 12, background: "#070907", border: "3px solid #1b1d1b", display: "flex", alignItems: "center", justifyContent: "center", gap: 12, fontFamily: "ui-monospace, Consolas, monospace", fontSize: 44, fontWeight: 900, color: "#ff5a3c", textShadow: "0 0 12px #ff5a3c" }}>
          <span style={{ fontSize: 30, opacity: close > 0.5 ? 1 : 0.25 }}>▼</span>
          {floor}
        </div>
        <div style={{ position: "absolute", left: X, top: T, width: W, height: H, overflow: "hidden", transform: `translateY(${bump.toFixed(2)}px)` }}>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,#f3e6cf 0%,#d9c7a6 60%,#b9a585 100%)" }} />
          {[0, 1, 2, 3].map((k) => (
            <div key={k} style={{ position: "absolute", left: 30 + k * 140, top: 40, width: 120, height: 470, borderRadius: 8, background: "linear-gradient(180deg,rgba(255,255,255,0.35),rgba(255,255,255,0.05))", boxShadow: "inset 0 0 0 2px rgba(120,90,50,0.18)" }} />
          ))}
          <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 22, background: "linear-gradient(#fffaf0,#e9dcc2)", boxShadow: "0 0 60px 30px rgba(255,244,214,0.7)" }} />
          <div style={{ position: "absolute", left: 20, right: 20, top: 400, height: 14, borderRadius: 7, background: "linear-gradient(#e6e6e6,#9a9a9a)", boxShadow: "0 6px 10px rgba(0,0,0,0.25)" }} />
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 90, background: "linear-gradient(#8f7d63,#6b5b45)" }} />
          {/* o post-it esquecido no chão da cabine */}
          <div style={{ position: "absolute", left: W / 2 - 60, top: H - 118, width: 150, height: 120, background: "linear-gradient(160deg,#fff27a,#f3d33d)", boxShadow: "0 8px 14px rgba(0,0,0,0.35)", transform: "rotate(-14deg) skewX(-18deg) scaleY(0.55)", fontFamily: HAND, fontSize: 26, color: "#3a3208", padding: 10, boxSizing: "border-box", lineHeight: 1 }}>indica a gente, tá?</div>
          {cl > 0 ? (
            <div style={{ position: "absolute", left: W / 2 - 130, top: 170, padding: "22px 40px", background: "#fff", borderRadius: "40px 40px 40px 10px", fontSize: 74, fontWeight: 900, color: "#161616", boxShadow: "0 22px 44px rgba(0,0,0,0.35)", transform: `scale(${(0.5 + 0.5 * lock(cl)).toFixed(3)}) rotate(-3deg)`, transformOrigin: "0% 100%", opacity: Math.min(1, cl * 2) }}>
              Claro!
            </div>
          ) : null}
          {[0, 1].map((k) => (
            <div
              key={k}
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                width: W / 2 + 2,
                left: k === 0 ? -W / 2 + (W / 2) * close : W - (W / 2) * close,
                background: "repeating-linear-gradient(90deg, rgba(255,255,255,0.06) 0 2px, rgba(0,0,0,0.05) 2px 4px), linear-gradient(90deg,#8e979f,#dde2e6 40%,#a7b0b7 70%,#7d868d)",
                boxShadow: k === 0 ? "inset -4px 0 0 rgba(0,0,0,0.35), 8px 0 18px rgba(0,0,0,0.25)" : "inset 4px 0 0 rgba(0,0,0,0.35), -8px 0 18px rgba(0,0,0,0.25)",
                overflow: "hidden",
              }}
            >
              <div style={{ position: "absolute", top: -200, left: sheen - (k ? W / 2 : 0), width: 70, height: H + 400, background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.35), rgba(255,255,255,0))", transform: "rotate(14deg)" }} />
            </div>
          ))}
        </div>
        <div style={{ position: "absolute", left: X - 56, top: T + H, width: W + 112, height: 22, background: "linear-gradient(#5b6168,#2a2d33)", borderRadius: "0 0 22px 22px" }} />
      </div>
      <Snd at={claroAt} name="pop" k="claro" />
      <Snd at={closeAt} name="tick" file="elevator_doors.wav" vol={0.26} k="elevator" />
      <Snd at={closeAt + 18} name="tick" file="metal_clank.wav" vol={0.35} k="elevator-bump" />
    </Frame>
  );
};

// ============ O5. ninguém ajudou a pensar em alguém: o fichário de contatos gira e para num cartão em branco ============
export const RolodexSpin: React.FC<{ life: number; spinAt?: number; stopAt?: number }> = ({ life, spinAt = 20, stopAt = 110 }) => {
  const { f, fps, out, arrive } = useScene(life);
  const q = sp(f, fps, stopAt + 8);
  // velocidade: acelera no "ninguém" e desacelera até parar no cartão em branco
  const speed = f < spinAt ? 0 : f < stopAt - 30 ? Math.min(1, (f - spinAt) / 20) : Math.max(0, (stopAt - f) / 30);
  let pos = 0;
  for (let t = spinAt; t < Math.min(f, stopAt); t++) pos += t < stopAt - 30 ? Math.min(1, (t - spinAt) / 20) : Math.max(0, (stopAt - t) / 30);
  const CXr = 540;
  const CYr = 560;
  const R = 200;
  const cards = 14;
  return (
    <Frame out={out}>
      <Room />
      <div style={{ position: "absolute", inset: 0, transformOrigin: `${CXr}px ${CYr}px`, transform: `scale(${(0.9 + 0.1 * arrive + 0.05 * (f / life)).toFixed(4)})` }}>
        <div style={{ position: "absolute", left: CXr - 330, top: CYr + 220, width: 660, height: 40, borderRadius: "50%", background: "rgba(0,0,0,0.55)", filter: "blur(12px)" }} />
        {/* suportes cromados */}
        {[-1, 1].map((s) => (
          <div key={s} style={{ position: "absolute", left: CXr + s * 250 - 18, top: CYr - 30, width: 36, height: 270, borderRadius: 18, background: "linear-gradient(90deg,#8e979f,#f1f4f6,#8e979f)", boxShadow: "0 12px 20px rgba(0,0,0,0.4)" }} />
        ))}
        <div style={{ position: "absolute", left: CXr - 300, top: CYr + 220, width: 600, height: 34, borderRadius: 17, background: "linear-gradient(#3a3f45,#1d2024)" }} />
        {/* cartões girando no eixo (perspectiva) */}
        <div style={{ position: "absolute", left: CXr - 220, top: CYr - R - 60, width: 440, height: 2 * R + 120, perspective: 900 }}>
          {Array.from({ length: cards }).map((_, k) => {
            const a = ((k / cards) * 360 + pos * 22) % 360;
            const rad = (a * Math.PI) / 180;
            const front = Math.cos(rad);
            const z = front * R;
            const y = Math.sin(rad) * R;
            if (front < -0.2) return null;
            const isBlank = f >= stopAt && Math.abs(((a + 360) % 360) - 0) < 12;
            return (
              <div key={k} style={{ position: "absolute", left: 20, top: R + 60 - 130 + y * 0.5, width: 400, height: 260, borderRadius: 14, background: "linear-gradient(180deg,#fffdf7,#efe7d6)", boxShadow: "0 10px 20px rgba(0,0,0,0.35)", transform: `translateZ(${z.toFixed(1)}px) rotateX(${(-a).toFixed(1)}deg)`, filter: speed > 0.3 ? `blur(${(speed * 2.5).toFixed(1)}px)` : undefined, opacity: 0.4 + 0.6 * Math.max(0, front) }}>
                <div style={{ position: "absolute", left: 18, top: -18, width: 110, height: 30, borderRadius: "10px 10px 0 0", background: "#e3d6bd" }} />
                {!isBlank ? (
                  <>
                    <div style={{ position: "absolute", left: 30, top: 50, width: 70, height: 70, borderRadius: 35, background: "#d9cdb5" }} />
                    <div style={{ position: "absolute", left: 120, top: 62, width: 200, height: 18, borderRadius: 9, background: "#cbbd9f" }} />
                    <div style={{ position: "absolute", left: 120, top: 96, width: 140, height: 14, borderRadius: 7, background: "#ddd1b8" }} />
                    {[0, 1, 2].map((l) => (
                      <div key={l} style={{ position: "absolute", left: 30, right: 30, top: 150 + l * 28, height: 3, background: "#e3d9c4" }} />
                    ))}
                  </>
                ) : null}
              </div>
            );
          })}
        </div>
        {/* botão lateral (o eixo) */}
        <div style={{ position: "absolute", left: CXr + 240, top: CYr - 30, width: 56, height: 56, borderRadius: 28, background: "radial-gradient(circle at 35% 35%,#f5f5f5,#6d757c)", transform: `rotate(${(pos * 22).toFixed(1)}deg)`, boxShadow: "0 8px 14px rgba(0,0,0,0.4)" }}>
          <div style={{ position: "absolute", left: 24, top: 4, width: 8, height: 20, borderRadius: 4, background: "#3a3f45" }} />
        </div>
        {q > 0 ? <div style={{ position: "absolute", left: CXr - 60, top: CYr - 150, fontSize: 200, fontWeight: 900, color: "#8a7f6a", opacity: q, transform: `scale(${(0.6 + 0.4 * lock(q)).toFixed(3)})` }}>?</div> : null}
      </div>
      {Array.from({ length: 8 }).map((_, k) => (
        <Snd key={k} at={spinAt + 6 + k * 9} name="tick" file="tick.wav" vol={0.12} k="rolodex" />
      ))}
      <Snd at={stopAt + 8} name="error" k="empty-card" />
    </Frame>
  );
};

// ============ O6. o espelho (foto real) e o semáforo do momento certo ============
export const MirrorSignal: React.FC<{ life: number; photo: string; loveAt?: number; glowAt?: number; neverAt?: number; complaintAt?: number; doubtAt?: number }> = ({ life, photo, loveAt = 60, glowAt = 130, neverAt = 180, complaintAt = 210, doubtAt = 255 }) => {
  const { f, fps, out, arrive } = useScene(life);
  const glow = interpolate(f, [glowAt, glowAt + 24], [0, 1], clamp);
  const red = f >= neverAt;
  const lv = sp(f, fps, loveAt);
  const c1 = sp(f, fps, complaintAt);
  const c2 = sp(f, fps, doubtAt);
  const sweep = ((f - glowAt) % 60) / 60;
  const MX = 110;
  const MY = 190;
  const MW = 470;
  const MH = 660;
  const Lamp: React.FC<{ on: boolean; c: string; y: number }> = ({ on, c, y }) => (
    <div style={{ position: "absolute", left: 30, top: y, width: 110, height: 110, borderRadius: 55, background: on ? `radial-gradient(circle at 40% 35%, #fff, ${c} 45%, ${c}99)` : "radial-gradient(circle at 40% 35%, #3a3a3a, #121212)", boxShadow: on ? `0 0 50px ${c}, 0 0 100px ${c}66` : "inset 0 4px 10px rgba(0,0,0,0.6)" }} />
  );
  const Tag: React.FC<{ text: string; on: number; color: string; y: number; icon: React.ReactNode; strike?: number }> = ({ text, on, color, y, icon, strike = 0 }) => (
    <div style={{ position: "absolute", left: 650, top: y, display: "inline-flex", alignItems: "center", gap: 12, padding: "12px 24px", borderRadius: 999, background: "rgba(14,14,16,0.85)", border: `2.5px solid ${color}`, color: "#fff", fontSize: 34, fontWeight: 800, whiteSpace: "nowrap", opacity: Math.min(1, on * 1.5), transform: `translateX(${((1 - on) * 40).toFixed(1)}px)` }}>
      {icon}
      {text}
      {strike > 0 ? <div style={{ position: "absolute", left: 16, top: "50%", height: 6, width: `calc(${strike * 100}% - 32px)`, background: ZALE.red, borderRadius: 3 }} /> : null}
    </div>
  );
  return (
    <Frame out={out}>
      <Room />
      <div style={{ position: "absolute", inset: 0, transformOrigin: "360px 520px", transform: `scale(${(0.92 + 0.08 * arrive + 0.05 * (f / life)).toFixed(4)})` }}>
        {/* moldura dourada e o espelho com a foto */}
        <div style={{ position: "absolute", left: MX - 26, top: MY - 26, width: MW + 52, height: MH + 52, borderRadius: 240, background: "linear-gradient(135deg,#f6dc8e,#a67c1a 40%,#f6dc8e 65%,#8d6614)", boxShadow: "0 40px 90px rgba(0,0,0,0.65)" }} />
        <div style={{ position: "absolute", left: MX, top: MY, width: MW, height: MH, borderRadius: 215, overflow: "hidden" }}>
          <Img src={staticFile(photo)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "70% 40%", transform: `scale(${(1.1 + 0.08 * (f / life)).toFixed(4)})`, filter: `brightness(${(0.9 + 0.2 * glow * (red ? 0.4 : 1)).toFixed(2)}) saturate(${(0.9 + 0.3 * glow).toFixed(2)})` }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(160deg, rgba(255,255,255,0.16), rgba(255,255,255,0) 45%)" }} />
          {glow > 0 && !red ? <div style={{ position: "absolute", left: -200 + sweep * 900, top: -150, width: 120, height: MH + 300, background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.55), rgba(255,255,255,0))", transform: "rotate(18deg)" }} /> : null}
          {red ? <div style={{ position: "absolute", inset: 0, background: "rgba(40,0,0,0.25)" }} /> : null}
        </div>
        {/* semáforo */}
        <div style={{ position: "absolute", left: 650, top: 470, width: 170, height: 300, borderRadius: 30, background: "linear-gradient(180deg,#2c3036,#15171a)", boxShadow: "0 30px 60px rgba(0,0,0,0.6)" }}>
          <Lamp on={red} c="#ff3b2f" y={30} />
          <Lamp on={!red && f >= loveAt} c="#35d06b" y={160} />
        </div>
        <Tag text="fala que amou" on={lv * (red ? 0 : 1)} color="#35d06b" y={210} icon={<Heart size={34} color="#ff4d7e" fill="#ff4d7e" />} />
        <Tag text="evolução no espelho" on={sp(f, fps, glowAt) * (red ? 0 : 1)} color="#35d06b" y={300} icon={<Sparkles size={34} color="#fff2b0" />} />
        <Tag text="reclamação" on={c1} color="#ff3b2f" y={210} icon={<MessageCircle size={34} color="#ff8a7a" />} strike={interpolate(f, [complaintAt + 10, complaintAt + 18], [0, 1], clamp)} />
        <Tag text="dúvida" on={c2} color="#ff3b2f" y={300} icon={<MessageCircle size={34} color="#ff8a7a" />} strike={interpolate(f, [doubtAt + 10, doubtAt + 18], [0, 1], clamp)} />
      </div>
      <Snd at={loveAt} name="switch" k="signal-green" />
      <Snd at={glowAt} name="glass" k="mirror" />
      <Snd at={neverAt} name="switch" k="signal-red" />
      <Snd at={complaintAt + 10} name="tick" file="pen_stroke.wav" vol={0.35} k="pen" />
      <Snd at={doubtAt + 10} name="tick" file="pen_stroke.wav" vol={0.35} k="pen" />
    </Frame>
  );
};
