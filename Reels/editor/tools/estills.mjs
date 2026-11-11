// Quadros de conferência de uma composição *Edit pelo TEMPO DA EDIÇÃO (s), numa folha só.
// Monta o projeto UMA vez e abre o navegador UMA vez (o `remotion still` por quadro remontava tudo).
// Uso: node tools/estills.mjs <slug> <Comp> 1.2 7.3 9.8 ... [--scale 0.4] [--crop 980]
//   --crop: corta em y (px do vídeo) para olhar só o palco.
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import { bundle } from "@remotion/bundler";
import { openBrowser, renderStill, selectComposition } from "@remotion/renderer";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const argv = process.argv.slice(2);
const opt = (k, d) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : d);
const pos = argv.filter((a, i) => !a.startsWith("--") && !["--scale", "--crop", "--public", "--doc"].includes(argv[i - 1]));
const [slug, comp, ...ts] = pos;
const scale = Number(opt("--scale", "0.4"));
const crop = Number(opt("--crop", "0"));
const doc = JSON.parse(fs.readFileSync(opt("--doc", path.join(ROOT, "src", "videos", slug, "edit.json")), "utf8"));
const out = path.join(ROOT, "out", slug, "estills");
fs.mkdirSync(out, { recursive: true });

// --public: pasta public enxuta (tools/estills.py monta com hardlinks; copiar os 6 GB da public levava minutos)
const serveUrl = await bundle({ entryPoint: path.join(ROOT, "src", "index.ts"), publicDir: opt("--public", path.join(ROOT, "public")) });
// gl angle = WebGL na placa de vídeo (mesmo do render.py); sem isso as cenas three.js saem pretas/lentas
const browser = await openBrowser("chrome", { chromiumOptions: { gl: "angle" } });
const inputProps = { doc };
const composition = await selectComposition({ serveUrl, id: comp, inputProps, puppeteerInstance: browser });
const files = [];
for (const t of ts.map(Number)) {
  const frame = Math.min(composition.durationInFrames - 1, Math.round(t * doc.fps));
  const output = path.join(out, `f${frame}.png`);
  await renderStill({
    serveUrl, composition, frame, output, inputProps, scale, puppeteerInstance: browser, timeoutInMilliseconds: 120000,
    // erros do navegador aparecem no terminal (cena 3D que não carrega, textura que falha...)
    onBrowserLog: (l) => { if (l.type === "error" || l.type === "warning") console.log(`[navegador ${l.type}] ${String(l.text).slice(0, 300)}`); },
  });
  files.push({ t, output });
}
await browser.close({ silent: true });
// apaga a montagem temporária desta conferência (não acumular GB no disco)
try {
  fs.rmSync(serveUrl, { recursive: true, force: true });
} catch {}
fs.writeFileSync(path.join(out, "list.json"), JSON.stringify({ files, crop: Math.round(crop * scale) }));
console.log(`${files.length} quadros`);
