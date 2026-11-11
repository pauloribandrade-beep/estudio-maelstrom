// Todos os quadros de uma composição *Edit em baixa resolução (para analisar movimento × som, não é render final).
// Uso: node tools/eframes.mjs <slug> <Comp> --public <pasta> [--every 2] [--scale 0.15] [--from 0] [--to fim]
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import { bundle } from "@remotion/bundler";
import { renderFrames, selectComposition } from "@remotion/renderer";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const argv = process.argv.slice(2);
const opt = (k, d) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : d);
const [slug, comp] = argv;
const doc = JSON.parse(fs.readFileSync(path.join(ROOT, "src", "videos", slug, "edit.json"), "utf8"));
const out = path.join(ROOT, "out", slug, "frames");
fs.mkdirSync(out, { recursive: true });
const serveUrl = await bundle({ entryPoint: path.join(ROOT, "src", "index.ts"), publicDir: opt("--public", path.join(ROOT, "public")) });
const inputProps = { doc };
const composition = await selectComposition({ serveUrl, id: comp, inputProps, chromiumOptions: { gl: "angle" } });
const every = Number(opt("--every", "2"));
const from = Number(opt("--from", "0"));
const to = Math.min(composition.durationInFrames - 1, Number(opt("--to", String(composition.durationInFrames - 1))));
// --windows arquivo.json: [[ini, fim], ...] em quadros (só as janelas em volta dos efeitos)
const wins = argv.includes("--windows") ? JSON.parse(fs.readFileSync(opt("--windows"), "utf8")) : [[from, to]];
let k = 0;
for (const [a, b] of wins) {
  const lo = Math.max(0, a - (a % every));
  const hi = Math.min(composition.durationInFrames - 1, b);
  if (hi <= lo) continue;
  // cada janela numa pasta própria: o [frame] do Remotion é o índice dentro do render, não o quadro do vídeo
  const tmp = path.join(out, "_w");
  fs.rmSync(tmp, { recursive: true, force: true });
  fs.mkdirSync(tmp, { recursive: true });
  const got = [];
  await renderFrames({
    serveUrl, composition, inputProps, outputDir: tmp, onFrameUpdate: (_n, f) => got.push(f), imageFormat: "jpeg", jpegQuality: 70, scale: Number(opt("--scale", "0.15")),
    everyNthFrame: every, frameRange: [lo, hi], concurrency: Number(opt("--conc", "3")), chromiumOptions: { gl: "angle" },
    imageSequencePattern: "f[frame].[ext]", onStart: () => undefined,
  });
  // renomeia pelo número real do quadro no vídeo
  const names = fs.readdirSync(tmp).filter((n) => n.endsWith(".jpeg")).sort((x, y) => Number(x.match(/\d+/)[0]) - Number(y.match(/\d+/)[0]));
  const nums = [];
  for (let f = lo; f <= hi; f++) if (f % every === 0) nums.push(f);
  if (names.length !== nums.length) console.log("AVISO janela", lo, hi, "quadros", names.length, "esperados", nums.length);
  names.forEach((n, i) => fs.renameSync(path.join(tmp, n), path.join(out, `f${String(nums[i] ?? lo + i * every).padStart(6, "0")}.jpeg`)));
  k++;
  if (k % 10 === 0) console.log("janelas", k, "de", wins.length);
}
try { fs.rmSync(serveUrl, { recursive: true, force: true }); } catch {}
console.log("ok");
