// Trecho curto de uma composição *Edit (para mandar ao celular), pelo TEMPO DA EDIÇÃO (s).
// Uso: node tools/eclip.mjs <slug> <Comp> <inicio_s> <fim_s> <saida.mp4> [--scale 0.6667] --public <pasta>
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import { bundle } from "@remotion/bundler";
import { openBrowser, renderMedia, selectComposition } from "@remotion/renderer";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const argv = process.argv.slice(2);
const opt = (k, d) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : d);
const pos = argv.filter((a, i) => !a.startsWith("--") && !["--scale", "--public", "--doc"].includes(argv[i - 1]));
const [slug, comp, a, b, out] = pos;
const scale = Number(opt("--scale", String(2 / 3))); // 1920x1080 → 1280x720 (altura precisa dar inteiro)
const doc = JSON.parse(fs.readFileSync(opt("--doc", path.join(ROOT, "src", "videos", slug, "edit.json")), "utf8"));
const serveUrl = await bundle({ entryPoint: path.join(ROOT, "src", "index.ts"), publicDir: opt("--public", path.join(ROOT, "public")) });
const browser = await openBrowser("chrome", { chromiumOptions: { gl: "angle" } });
const inputProps = { doc };
const composition = await selectComposition({ serveUrl, id: comp, inputProps, puppeteerInstance: browser });
const f0 = Math.round(Number(a) * doc.fps);
const f1 = Math.min(composition.durationInFrames - 1, Math.round(Number(b) * doc.fps));
let last = -1;
await renderMedia({
  serveUrl,
  composition,
  inputProps,
  codec: "h264",
  crf: 23,
  scale,
  frameRange: [f0, f1],
  outputLocation: out,
  puppeteerInstance: browser,
  concurrency: 2,
  chromiumOptions: { gl: "angle" },
  onProgress: ({ progress }) => {
    const p = Math.floor(progress * 10);
    if (p !== last) {
      last = p;
      console.log(`${p * 10}%`);
    }
  },
});
await browser.close({ silent: true });
try {
  fs.rmSync(serveUrl, { recursive: true, force: true });
} catch {}
console.log("ok", out);
