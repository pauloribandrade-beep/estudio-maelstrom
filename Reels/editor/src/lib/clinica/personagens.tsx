import React from "react";

// PERSONAGENS DESENHADOS EM CÓDIGO (pedido do usuário, 2026-09-28: "desenvolva as animações você, nada genérico;
// cadê os vetores bonitos"). Ilustração com acabamento: volumes em degradê, luz de recorte, sombra suave, olhos com
// íris/brilho/pálpebra, sobrancelha, boca com expressões. Tudo controlado por props para animar (piscar, olhar,
// sorrir, inclinar a cabeça, respirar). Coordenadas no viewBox 400 x 480 (busto).

export type Pose = {
  t: number; // quadro (para respiração e micro movimentos)
  blink?: number; // 0 aberto .. 1 fechado
  lookX?: number; // -1 .. 1 (olhar para os lados)
  lookY?: number; // -1 (cima) .. 1 (baixo)
  smile?: number; // -1 triste .. 0 neutra .. 1 sorriso
  open?: number; // 0 .. 1 boca aberta (fala, surpresa)
  brow?: number; // -1 franzida .. 1 levantada
  tilt?: number; // graus
  blush?: number; // 0 .. 1
};

type Look = { skin: [string, string]; hair: [string, string]; top: [string, string]; iris: string; lips: string };
export const LOOKS: Record<string, Look> = {
  paciente: { skin: ["#f7d3b8", "#e3a582"], hair: ["#5a3522", "#2e1a10"], top: ["#f08a7e", "#c9564d"], iris: "#6b3f1f", lips: "#c8545a" },
  amiga: { skin: ["#e8b894", "#c98a63"], hair: ["#1f1611", "#0e0907"], top: ["#9f8cf7", "#6d55d6"], iris: "#3b2414", lips: "#b24a58" },
  medica: { skin: ["#f3cdb1", "#dc9d7c"], hair: ["#c79a5b", "#8a6232"], top: ["#ffffff", "#d9e2ea"], iris: "#3f6b7a", lips: "#c05a5e" },
};

const Eye: React.FC<{ cx: number; cy: number; p: Pose; iris: string; id: string; flip?: boolean }> = ({ cx, cy, p, iris, id, flip }) => {
  const blink = Math.min(1, Math.max(0, p.blink ?? 0));
  const ix = cx + (p.lookX ?? 0) * 6;
  const iy = cy + (p.lookY ?? 0) * 4 + 1;
  const almond = `M${cx - 23},${cy + 1} C${cx - 16},${cy - 21} ${cx + 16},${cy - 21} ${cx + 23},${cy + 1} C${cx + 14},${cy + 16} ${cx - 14},${cy + 16} ${cx - 23},${cy + 1} Z`;
  return (
    <g>
      <clipPath id={`eye-${id}`}>
        <path d={almond} />
      </clipPath>
      <path d={almond} fill="#fbfaf8" />
      <g clipPath={`url(#eye-${id})`}>
        <circle cx={ix} cy={iy} r={13} fill={iris} />
        <circle cx={ix} cy={iy} r={13} fill={`url(#irisShade-${id})`} />
        <circle cx={ix} cy={iy} r={6} fill="#140c08" />
        <circle cx={ix - 3.5} cy={iy - 4} r={3} fill="#fff" />
        <circle cx={ix + 3.5} cy={iy + 3} r={1.4} fill="#fff" opacity={0.8} />
        {/* sombra da pálpebra de cima */}
        <path d={`M${cx - 22},${cy - 18} L${cx + 22},${cy - 18} L${cx + 22},${cy - 18 + 6 + blink * 30} L${cx - 22},${cy - 18 + 6 + blink * 30} Z`} fill="rgba(120,60,40,0.18)" />
        {/* pálpebra (piscar) */}
        <rect x={cx - 23} y={cy - 20} width={46} height={blink * 34} fill={`url(#lid-${id})`} />
      </g>
      {/* cílios */}
      <path d={`M${cx - 24},${cy + 2 + blink * 10} C${cx - 16},${cy - 21 + blink * 30} ${cx + 16},${cy - 21 + blink * 30} ${cx + 24},${cy + 2 + blink * 10}`} fill="none" stroke="#24140c" strokeWidth={4.2} strokeLinecap="round" />
      <path d={flip ? `M${cx - 23},${cy + 1 + blink * 10} l-8,-6 M${cx - 18},${cy - 8 + blink * 22} l-6,-8` : `M${cx + 23},${cy + 1 + blink * 10} l8,-6 M${cx + 18},${cy - 8 + blink * 22} l6,-8`} stroke="#24140c" strokeWidth={3} strokeLinecap="round" />
      <path d={`M${cx - 14},${cy + 13} Q${cx},${cy + 17} ${cx + 14},${cy + 13}`} fill="none" stroke="rgba(120,60,40,0.3)" strokeWidth={2} strokeLinecap="round" opacity={1 - blink} />
      <defs>
        <radialGradient id={`irisShade-${id}`} cx="50%" cy="35%" r="60%">
          <stop offset="0" stopColor="#fff" stopOpacity="0.15" />
          <stop offset="1" stopColor="#000" stopOpacity="0.35" />
        </radialGradient>
      </defs>
    </g>
  );
};

export const Bust: React.FC<{ who?: keyof typeof LOOKS; pose: Pose; size?: number; coat?: boolean; style?: React.CSSProperties }> = ({ who = "paciente", pose, size = 360, coat, style }) => {
  const L = LOOKS[who];
  const id = `${who}${coat ? "c" : ""}`;
  const breathe = Math.sin(pose.t / 22) * 2.2;
  const tilt = (pose.tilt ?? 0) + Math.sin(pose.t / 47) * 1.2;
  const smile = pose.smile ?? 0.2;
  const open = pose.open ?? 0;
  const brow = pose.brow ?? 0;
  const my = 264; // boca
  const mw = 26 + smile * 6;
  const curve = smile * 14;
  const mouthUp = `M${200 - mw},${my - curve * 0.25} Q200,${my + curve} ${200 + mw},${my - curve * 0.25}`;
  const mouthOpen = `M${200 - mw},${my - curve * 0.25} Q200,${my + curve + open * 22} ${200 + mw},${my - curve * 0.25} Q200,${my + curve * 0.4 + 2} ${200 - mw},${my - curve * 0.25} Z`;
  return (
    <svg width={size} height={size * 1.2} viewBox="0 0 400 480" style={{ overflow: "visible", ...style }}>
      <defs>
        <linearGradient id={`skin-${id}`} x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0" stopColor={L.skin[0]} />
          <stop offset="1" stopColor={L.skin[1]} />
        </linearGradient>
        <linearGradient id={`lid-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={L.skin[1]} />
          <stop offset="1" stopColor={L.skin[0]} />
        </linearGradient>
        <linearGradient id={`hair-${id}`} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor={L.hair[0]} />
          <stop offset="1" stopColor={L.hair[1]} />
        </linearGradient>
        <linearGradient id={`top-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={coat ? "#ffffff" : L.top[0]} />
          <stop offset="1" stopColor={coat ? "#cfd9e2" : L.top[1]} />
        </linearGradient>
        <radialGradient id={`rim-${id}`} cx="85%" cy="30%" r="70%">
          <stop offset="0" stopColor="#ffe9c9" stopOpacity="0.55" />
          <stop offset="1" stopColor="#ffe9c9" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`shade-${id}`} cx="20%" cy="60%" r="70%">
          <stop offset="0" stopColor="#6b2f1d" stopOpacity="0.28" />
          <stop offset="1" stopColor="#6b2f1d" stopOpacity="0" />
        </radialGradient>
        <filter id={`soft-${id}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>
      {/* sombra projetada atrás */}
      <ellipse cx={200} cy={470} rx={150} ry={18} fill="rgba(0,0,0,0.35)" filter={`url(#soft-${id})`} />
      <g transform={`translate(0 ${breathe.toFixed(2)})`}>
        {/* cabelo de trás */}
        <g transform={`rotate(${tilt.toFixed(2)} 200 300)`}>
          <path d="M96,215 C84,120 140,58 205,58 C276,58 326,118 314,215 C322,292 338,352 306,410 L106,410 C74,352 88,292 96,215 Z" fill={`url(#hair-${id})`} />
        </g>
        {/* tronco e pescoço */}
        <path d="M50,480 C52,392 116,352 200,352 C284,352 348,392 350,480 Z" fill={`url(#top-${id})`} />
        {coat ? (
          <>
            <path d="M200,372 L150,480 L118,480 L168,372 Z" fill="#e9eef2" />
            <path d="M200,372 L250,480 L282,480 L232,372 Z" fill="#e9eef2" />
            <path d="M176,378 L200,430 L224,378" fill="#8fb8c9" />
            <path d="M150,420 C150,450 170,462 186,452" stroke="#3f6b7a" strokeWidth={5} fill="none" strokeLinecap="round" />
            <circle cx={188} cy={450} r={7} fill="#3f6b7a" />
          </>
        ) : (
          <path d="M162,356 Q200,402 238,356" fill={`url(#skin-${id})`} />
        )}
        <path d="M176,292 L176,362 Q200,380 224,362 L224,292 Z" fill={`url(#skin-${id})`} />
        <path d="M176,312 Q200,334 224,312 L224,292 L176,292 Z" fill="rgba(107,47,29,0.24)" />
        {/* cabeça */}
        <g transform={`rotate(${tilt.toFixed(2)} 200 300)`}>
          <ellipse cx={123} cy={212} rx={12} ry={20} fill={L.skin[1]} />
          <ellipse cx={277} cy={212} rx={12} ry={20} fill={L.skin[1]} />
          <circle cx={123} cy={236} r={5.5} fill="#f0c95f" stroke="#b8902f" strokeWidth={1.5} />
          <circle cx={277} cy={236} r={5.5} fill="#f0c95f" stroke="#b8902f" strokeWidth={1.5} />
          <path d="M124,196 C124,126 158,92 200,92 C242,92 276,126 276,196 C276,252 246,298 200,302 C154,298 124,252 124,196 Z" fill={`url(#skin-${id})`} />
          <path d="M124,196 C124,126 158,92 200,92 C242,92 276,126 276,196 C276,252 246,298 200,302 C154,298 124,252 124,196 Z" fill={`url(#shade-${id})`} />
          <path d="M124,196 C124,126 158,92 200,92 C242,92 276,126 276,196 C276,252 246,298 200,302 C154,298 124,252 124,196 Z" fill={`url(#rim-${id})`} />
          {/* bochechas */}
          <ellipse cx={160} cy={240} rx={17} ry={10} fill="#ef7e7e" opacity={0.25 + 0.35 * (pose.blush ?? 0)} />
          <ellipse cx={240} cy={240} rx={17} ry={10} fill="#ef7e7e" opacity={0.25 + 0.35 * (pose.blush ?? 0)} />
          {/* sobrancelhas */}
          <path d={`M148,${176 - brow * 8} Q166,${162 - brow * 10} 190,${171 - brow * 6 + (brow < 0 ? 5 : 0)}`} stroke={L.hair[1]} strokeWidth={5} fill="none" strokeLinecap="round" />
          <path d={`M210,${171 - brow * 6 + (brow < 0 ? 5 : 0)} Q234,${162 - brow * 10} 252,${176 - brow * 8}`} stroke={L.hair[1]} strokeWidth={5} fill="none" strokeLinecap="round" />
          <Eye cx={172} cy={206} p={pose} iris={L.iris} id={`${id}l`} flip />
          <Eye cx={228} cy={206} p={pose} iris={L.iris} id={`${id}r`} />
          {/* nariz */}
          <path d="M195,240 Q200,246 207,241" stroke="rgba(120,60,40,0.5)" strokeWidth={3.2} fill="none" strokeLinecap="round" />
          <path d="M203,212 Q207,228 204,236" stroke="rgba(255,255,255,0.35)" strokeWidth={3} fill="none" strokeLinecap="round" />
          {/* boca */}
          {open > 0.05 ? (
            <>
              <path d={mouthOpen} fill="#6d2a2c" />
              <path d={`M${200 - mw * 0.55},${my + curve * 0.35 + open * 12} Q200,${my + curve * 0.7 + open * 18} ${200 + mw * 0.55},${my + curve * 0.35 + open * 12}`} stroke="#e07a86" strokeWidth={5} fill="none" strokeLinecap="round" />
            </>
          ) : (
            <>
              <path d={`${mouthUp} Q200,${my + curve + 11} ${200 - mw},${my - curve * 0.25}`} fill={L.lips} opacity={0.9} />
              <path d={mouthUp} stroke="#8e2f38" strokeWidth={3} fill="none" strokeLinecap="round" />
              <path d={`M${200 - mw * 0.35},${my + curve * 0.8 + 6} Q200,${my + curve * 0.9 + 8} ${200 + mw * 0.35},${my + curve * 0.8 + 6}`} stroke="rgba(255,255,255,0.45)" strokeWidth={2.5} fill="none" strokeLinecap="round" />
            </>
          )}
          {/* franja */}
          <path d="M118,204 C104,120 160,70 214,74 C272,78 304,128 290,210 C286,176 272,148 250,130 C232,150 196,158 168,150 C150,164 132,184 118,204 Z" fill={`url(#hair-${id})`} />
          <path d="M168,150 C200,132 232,118 250,130 C236,104 204,96 176,108 C160,118 158,138 168,150 Z" fill={`url(#hair-${id})`} />
          <path d="M150,112 C178,88 226,84 262,104" stroke="rgba(255,255,255,0.2)" strokeWidth={8} fill="none" strokeLinecap="round" />
        </g>
      </g>
    </svg>
  );
};

// piscar natural: fecha rápido a cada ~3 s (fase por personagem)
export const blinkAt = (t: number, phase = 0) => {
  const c = (t + phase) % 95;
  return c < 3 ? c / 3 : c < 6 ? 1 - (c - 3) / 3 : 0;
};
