import React, { useLayoutEffect, useRef } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";

// VORTIGAUNT em pixel art, desenhado à mão linha por linha (estilo limpo: sem contorno preto, marrom em 4 tons,
// detalhes em cinza-esverdeado). De frente, curvado: cabeça baixa entre os ombros, chifre, a faixa vermelha do olho
// que brilha, boca escura com dentes, gola, alça com a bolsa, braços compridos até o joelho com braceletes e garras,
// pernas finas com tornozeleiras e cascos. `HLVortLab` mostra o conceito ampliado.

type RGB = [number, number, number];
const hex = (h: string): RGB => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const VP: Record<string, RGB> = {
  B: hex("#8c6a30"),
  b: hex("#6c4f22"),
  d: hex("#4a3416"),
  k: hex("#2a1d0c"),
  g: hex("#7c8c7c"),
  G: hex("#55625a"),
  r: hex("#ff4018"),
  R: hex("#b8260e"),
  o: hex("#ffb48c"),
  y: hex("#e4ca62"),
  s: hex("#6a1c14"),
  h: hex("#3c3024"),
  e: hex("#9cffb4"),
  E: hex("#3ad070"),
};

export const VORT_IDLE = [
  "......................GG............",
  "....................GGgG............",
  ".................ddGggGd............",
  "..............ddbbbGgGbd............",
  ".............dbbBBBbGbbbd...........",
  "............dbBBBBBBbbbbbd..........",
  "...........dbBBBBBBBBbbbbd..........",
  "...........dbBBBBBBBbbbbbbd.........",
  "...........dbkkkkkkkkkkbbbd.........",
  "..........dbkRRRrrrrrRRkbbd.........",
  "..........dbkRrroooorrRkbbd.........",
  "..........dbkRRrrrrrrRRkbd..........",
  "..........dbbkkkkkkkkkkbbd..........",
  "......ddd.dbbbbbbbbbbbbbbd.ddd......",
  ".....dbbbddkkkkkkkkkkkkkdddbbbd.....",
  "....dbBBbbdkykkyykkykkykdbbBBbd.....",
  "...dbBBbbbbdkkkkkkkkkkkdbbbbBBbd....",
  "...dbBbbbbbbddkkkkkkkddbbbbbbBbd....",
  "..dbBbbbbbbbbbddddddddbbbbbbbbBbd...",
  "..dbBbbddbbbbbggGGGggbbbbddbbbBbd...",
  "..dbbbd.dbbbbGgggggGbbbbbd.dbbbbd...",
  "..dbbd..dbBBbbGGGGGbbbbbbd..dbbd....",
  ".dbbbd..dbBBBbbbbbbbbbbbsd..dbbbd...",
  ".dbbd...dbBBBbbbbbbbbbbsbd...dbbd...",
  ".dbbd...dbBBbbbbbbbbbbsbbd...dbbd...",
  ".dbbd...dbBbbbbbbbbbbsbbbd...dbbd...",
  ".dbbd...dbbbbbbbbbbbsbbbbd...dbbd...",
  ".dbbd...dbbbbbbbbbbsbbbbbd...dbbd...",
  "dbbd....dbbbbbbbbbsbbbbbd.....dbbd..",
  "dbbd....ddbbbbbggggGbbbdd.....dbbd..",
  "dbbd.....dbbbbgGkGkgbbbd......dbbd..",
  "dbbd.....dbbbbgkGkGgbbd.......dbbd..",
  "dGGd.....dbbbbgGGGGgbbd.......dGGd..",
  "dggd.....ddbbbbbbbbbbdd.......dggd..",
  "dGGd......dbbbbbbbbbbd........dGGd..",
  "dbbd......dbbddddddbbd........dbbd..",
  "dbbbd....dbbd......dbbd......dbbbd..",
  ".dbbd....dbbd......dbbd......dbbd...",
  ".dbdbd...dbBd......dbBd.....dbdbd...",
  ".db.db..dbBBd......dbBBd....db.db...",
  ".db.db..dbBd........dbBd...db..db...",
  "db..db..dbbd........dbbd...db..db...",
  "d...d...dbbd........dbbd...d...d....",
  ".........dbbd......dbbd.............",
  ".........dbbbd....dbbbd.............",
  "..........dbbd....dbbd..............",
  "...........dbd....dbd...............",
  "...........dbbd..dbbd...............",
  "...........dGGd..dGGd...............",
  "...........dbbd..dbbd...............",
  "..........dbbbd..dbbbd..............",
  ".........dhhhhd..dhhhhd.............",
  ".........dhhhhhd.dhhhhhd............",
  "..........ddddd...ddddd.............",
];

const draw = (data: Uint8ClampedArray, W: number, H: number, spr: string[], x0: number, y0: number, glow: number) => {
  for (let y = 0; y < spr.length; y++)
    for (let x = 0; x < spr[y].length; x++) {
      let ch = spr[y][x];
      if (ch === ".") continue;
      // o olho pulsa: o miolo claro anda/acende
      if (ch === "o" && glow === 0) ch = "r";
      const c = VP[ch];
      if (!c) continue;
      const X = x0 + x;
      const Y = y0 + y;
      if (X < 0 || Y < 0 || X >= W || Y >= H) continue;
      data.set([c[0], c[1], c[2], 255], (Y * W + X) * 4);
    }
};

export const HLVortLab: React.FC<{ life: number }> = () => {
  const f = useCurrentFrame();
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const W = 96;
    const H = 54;
    const cv = ref.current;
    if (!cv) return;
    const off = document.createElement("canvas");
    off.width = W;
    off.height = H;
    const o = off.getContext("2d")!;
    const img = o.createImageData(W, H);
    const bg = hex("#a6a8aa");
    for (let i = 0; i < W * H; i++) img.data.set([bg[0], bg[1], bg[2], 255], i * 4);
    for (let k = -12; k <= 12; k++) img.data.set([142, 144, 147, 255], (53 * W + 48 + k) * 4);
    draw(img.data, W, H, VORT_IDLE, 30, 0, Math.floor(f / 6) % 2);
    o.putImageData(img, 0, 0);
    const ctx = cv.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(off, 0, 0, W, H, 0, 0, 1920, 1080);
  }, [f]);
  return (
    <AbsoluteFill style={{ background: "#a6a8aa" }}>
      <canvas ref={ref} width={1920} height={1080} style={{ width: "100%", height: "100%", imageRendering: "pixelated" }} />
    </AbsoluteFill>
  );
};
