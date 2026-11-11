import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, Loop, OffthreadVideo, staticFile, useCurrentFrame } from "remotion";
import { loadFont as loadFredoka } from "@remotion/google-fonts/Fredoka";
import CL from "./clips.json";
import AR from "./clips_ar.json";

// Short de meme "O Rei dos Ratos quer transformar Nova York num país chamado Ratânia" (Deadlock, 28/10/2026),
// no estilo do canal Laestro: cada tomada é um item da timeline (RRShot) em tela cheia com zoom lento, ou em
// "card" (foto pequena e torta no fundo cinza, que cresce). A legenda amarela é a captions.style = "laestro".

const { fontFamily: FREDOKA } = loadFredoka("normal", { weights: ["500", "600"], subsets: ["latin", "latin-ext"] });
const R = "videos/2026-10-28_deadlock-rei-dos-ratos_R/clips/";
const FPS = 30;
const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
const GRAY = "#8d8d8d";

export const RRBg: React.FC = () => <AbsoluteFill style={{ background: GRAY }} />;

// vídeo do trecho: começa em `ss` s do recorte, `rate` de velocidade e repete se a tomada for maior que o trecho
const Clip: React.FC<{ clip: string; ss?: number; rate?: number; life: number; pos?: string }> = ({ clip, ss = 0, rate = 1, life, pos = "50% 50%" }) => {
  const len = (CL as Record<string, number>)[clip] ?? 3;
  const loopF = Math.max(1, Math.floor(((len - ss) / rate) * FPS) - 1);
  const v = <OffthreadVideo src={staticFile(`${R}${clip}.mp4`)} muted startFrom={Math.round(ss * FPS)} playbackRate={rate} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: pos }} />;
  return life > loopF ? <Loop durationInFrames={loopF}>{v}</Loop> : v;
};

type ShotP = { life: number; clip: string; mode?: "full" | "card"; ss?: number; rate?: number; pos?: string; rot?: number; z0?: number; z1?: number; cy?: number };

export const RRShot: React.FC<ShotP> = ({ life, clip, mode = "full", ss, rate, pos, rot = -3, z0, z1, cy = 1010 }) => {
  const f = useCurrentFrame();
  if (mode === "card") {
    // foto pequena e torta que entra com um pulinho e vai crescendo devagar
    const pop = interpolate(f, [0, 7], [0.78, 1], { ...clamp, easing: Easing.out(Easing.back(1.8)) });
    // o card tem a proporção do vídeo: o quadro aparece inteiro, sem cortar as laterais
    const grow = interpolate(f, [0, life], [z0 ?? 1, z1 ?? 1.08], clamp);
    const ar = (AR as Record<string, number>)[clip] ?? 16 / 9;
    const cw = ar >= 1.5 ? 920 : 780;
    const ch = cw / ar;
    return (
      <AbsoluteFill style={{ background: GRAY }}>
        <div style={{ position: "absolute", left: 540 - cw / 2, top: cy - ch / 2, width: cw, height: ch, transform: `rotate(${rot}deg) scale(${pop * grow})`, boxShadow: "0 22px 40px rgba(0,0,0,0.45)", overflow: "hidden", background: "#111" }}>
          <Clip clip={clip} ss={ss} rate={rate} life={life} pos={pos} />
        </div>
      </AbsoluteFill>
    );
  }
  const z = interpolate(f, [0, life], [z0 ?? 1.0, z1 ?? 1.1], clamp);
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${z})` }}>
        <Clip clip={clip} ss={ss} rate={rate} life={life} pos={pos} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// figurinha recortada (webm com alfa) por cima do jogo, como transição: entra com pulinho, sai encolhendo no fim
export const RRSticker: React.FC<{ life: number; clip: string; w?: number; y?: number; rate?: number }> = ({ life, clip, w = 820, y = 1060, rate = 1 }) => {
  const f = useCurrentFrame();
  const len = (CL as Record<string, number>)[clip] ?? 3;
  const loopF = Math.max(1, Math.floor((len / rate) * FPS) - 1);
  const s = interpolate(f, [0, 6, life - 5, life], [0.3, 1, 1, 0.2], { ...clamp, easing: Easing.out(Easing.back(1.6)) });
  const v = <OffthreadVideo src={staticFile(`${R}${clip}.webm`)} muted transparent playbackRate={rate} style={{ width: "100%", height: "100%", objectFit: "contain" }} />;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: 540 - w / 2, top: y - w / 2, width: w, height: w, transform: `scale(${s})`, filter: "drop-shadow(0 18px 24px rgba(0,0,0,0.5))" }}>
        {life > loopF ? <Loop durationInFrames={loopF}>{v}</Loop> : v}
      </div>
    </AbsoluteFill>
  );
};

// transição giratória do OIIA (sem fala): a cena que sai gira e encolhe junto com o rato recortado girando no meio,
// e a próxima cena entra girando no sentido contrário até parar no lugar
export const RRSpinTrans: React.FC<{ life: number; from: string; fromSs?: number; fromPos?: string; to: string; toSs?: number; toPos?: string }> = ({
  life,
  from,
  fromSs = 0,
  fromPos,
  to,
  toSs = 0,
  toPos,
}) => {
  const f = useCurrentFrame();
  const half = life / 2;
  const out = f < half;
  const k = out ? f / half : (f - half) / (life - half);
  const ease = Easing.inOut(Easing.cubic)(Math.min(1, Math.max(0, k)));
  const rot = out ? ease * 540 : -540 * (1 - ease);
  const sc = out ? 1 - 0.75 * ease : 0.25 + 0.75 * ease;
  const rat = interpolate(f, [0, 6, life - 8, life], [0.2, 1, 1, 0], { ...clamp, easing: Easing.out(Easing.back(1.4)) });
  const ratLoop = Math.max(1, Math.floor((((CL as Record<string, number>)["spin_a"] ?? 3.6) / 2) * FPS) - 1);
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `rotate(${rot}deg) scale(${sc})` }}>
        {out ? <Clip clip={from} ss={fromSs} life={life} pos={fromPos} /> : <Clip clip={to} ss={toSs} life={life} pos={toPos} />}
      </AbsoluteFill>
      <div style={{ position: "absolute", left: 540 - 760, top: 960 - 760, width: 1520, height: 1520, transform: `scale(${rat})`, filter: "drop-shadow(0 20px 26px rgba(0,0,0,0.55))" }}>
        <Loop durationInFrames={ratLoop}>
          <OffthreadVideo src={staticFile(`${R}spin_a.webm`)} muted transparent playbackRate={2} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </Loop>
      </div>
    </AbsoluteFill>
  );
};

// print do post ORIGINAL do Reddit (u/CycloneScones, r/DeadlockTheGame, 02/09/2025: "The Rat King", 6,4 mil votos e
// 488 comentários), nítido, como os prints de prova do Laestro. Entra com pulinho e vai chegando perto; em `swapAt` a
// galeria passa (deslizando) da arte principal para a folha de esboços com o rato de terno; em `voteAt` a câmera desce
// até o placar, que dispara de 1 até 6,4 mil. Chaves "...At" chegam em frames (toComponentProps).
export const RRReddit: React.FC<{ life: number; voteAt?: number; swapAt?: number }> = ({ life, voteAt = 120, swapAt = 60 }) => {
  const f = useCurrentFrame();
  const pop = interpolate(f, [0, 7], [0.8, 1], { ...clamp, easing: Easing.out(Easing.back(1.8)) });
  const grow = interpolate(f, [0, life], [1, 1.06], clamp);
  // galeria: arte principal -> folha de esboços (zoom no rato de terno, canto de cima à esquerda)
  const sw = interpolate(f, [swapAt, swapAt + 9], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const sheetZoom = interpolate(f, [swapAt, swapAt + 40], [1.0, 1.55], { ...clamp, easing: Easing.out(Easing.cubic) });
  // placar: sobe de 1 até 6.431 em ~0,8 s e dá um tranco no fim
  const k = Math.max(0, (f - voteAt) / FPS);
  const n = Math.round(Math.min(6431, Math.pow(6431, Math.min(1, k / 0.8))));
  const votes = k <= 0 ? "Votar" : n >= 1000 ? `${(n / 1000).toFixed(1).replace(".", ",")} mil` : String(n);
  const bump = k > 0 ? 1 + 0.1 * Math.abs(Math.sin(k * 16)) * (k < 1.0 ? 1 : 0) : 1;
  // câmera: no voto, o card sobe e cresce para o placar ficar no meio da tela
  const cam = interpolate(f, [voteAt - 4, voteAt + 10], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const IMG_H = 760;
  return (
    <AbsoluteFill style={{ background: GRAY, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 90, top: 690, width: 900, transformOrigin: "50% 92%", transform: `rotate(${-2 + cam * 2}deg) scale(${pop * grow * (1 + cam * 0.05)})`, background: "#ffffff", borderRadius: 26, boxShadow: "0 24px 44px rgba(0,0,0,0.45)", overflow: "hidden", fontFamily: FREDOKA }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "24px 30px 8px" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#ff4500", color: "#fff", fontWeight: 600, fontSize: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>r/</div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 30, fontWeight: 600, color: "#1c1c1c" }}>r/DeadlockTheGame · 1 ano</div>
            <div style={{ fontSize: 25, color: "#576f76" }}>u/CycloneScones</div>
          </div>
        </div>
        <div style={{ padding: "6px 30px 16px", fontSize: 46, fontWeight: 600, color: "#0f1a1c" }}>The Rat King</div>
        <div style={{ position: "relative", height: IMG_H, background: "#0b0b0b", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, transform: `translateX(${-sw * 100}%)` }}>
            <Img src={staticFile(`${R}reddit_art.jpg`)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 30%" }} />
          </div>
          <div style={{ position: "absolute", inset: 0, transform: `translateX(${(1 - sw) * 100}%)`, background: "#9a9a9a", overflow: "hidden" }}>
            <Img src={staticFile(`${R}reddit_sheet.jpg`)} style={{ width: "100%", height: "100%", objectFit: "cover", transformOrigin: "18% 0%", transform: `scale(${sheetZoom})` }} />
          </div>
          <div style={{ position: "absolute", right: 22, top: 20, padding: "6px 16px", borderRadius: 20, background: "rgba(0,0,0,0.6)", color: "#fff", fontSize: 26 }}>{sw > 0.5 ? "2" : "1"}/3</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 18, padding: "20px 30px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 26px", borderRadius: 40, background: k > 0 ? "#ff4500" : "#edeff1", color: k > 0 ? "#fff" : "#1c1c1c", fontSize: 40, fontWeight: 600, transform: `scale(${bump})` }}>
            <span>⬆</span>
            <span style={{ fontVariantNumeric: "tabular-nums", minWidth: 150 }}>{votes}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 24px", borderRadius: 40, background: "#edeff1", color: "#1c1c1c", fontSize: 34, fontWeight: 600 }}>💬 488</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
