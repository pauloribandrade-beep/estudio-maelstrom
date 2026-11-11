// Perfil de CPU da prévia do Estúdio num Chrome à parte: toca N s a partir de um ponto e lista as funções que mais
// gastam tempo (tempo próprio), agrupadas por arquivo. Uso: node tools/profile_cpu.mjs <slug> <inicio_s> <dur_s>
import { openBrowser } from "@remotion/renderer";

const [slug = "hl3_M01", startS = "1320", durS = "10"] = process.argv.slice(2);
const browser = await openBrowser("chrome", { chromiumOptions: { gl: "angle" } });
const page = await browser.newPage({ context: () => null, logLevel: "error", indent: false, pageIndex: 0, onBrowserLog: null, onLog: () => undefined });
await page.setViewport({ width: 1600, height: 1000, deviceScaleFactor: 1 });
await page.goto({ url: `http://localhost:5173/?v=${slug}`, timeout: 60000 });
await new Promise((r) => setTimeout(r, 9000));
const client = page._client();
await client.send("Profiler.enable");
await client.send("Profiler.setSamplingInterval", { interval: 500 });
await page.evaluate(async (start) => {
  window.__player?.seekTo(Math.round(start * 30));
  await new Promise((r) => setTimeout(r, 3000));
}, Number(startS));
await client.send("Profiler.start");
await page.evaluate(async (dur) => {
  document.querySelector('button[aria-label="Play video"],button[title="Play video"]')?.click();
  await new Promise((r) => setTimeout(r, dur * 1000));
}, Number(durS));
const rr = await client.send("Profiler.stop");
const profile = (rr.value ?? rr).profile;
// tempo próprio por nó (amostras × intervalo)
const dt = new Map();
const ts = profile.timeDeltas;
for (let i = 0; i < profile.samples.length; i++) dt.set(profile.samples[i], (dt.get(profile.samples[i]) ?? 0) + (ts[i] ?? 0));
const byFn = new Map();
const byFile = new Map();
let total = 0;
for (const n of profile.nodes) {
  const us = dt.get(n.id) ?? 0;
  total += us;
  const cf = n.callFrame;
  const file = (cf.url || "(nativo)").replace(/^.*\/(node_modules\/[^/]+|src\/[^?]*|estudio\/[^?]*|@fs\/[^?]*)/, "$1").replace(/\?.*$/, "");
  const fn = `${cf.functionName || "(anônima)"} @ ${file}:${cf.lineNumber + 1}`;
  byFn.set(fn, (byFn.get(fn) ?? 0) + us);
  byFile.set(file, (byFile.get(file) ?? 0) + us);
}
const top = (m, k) => [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, k).map(([n, us]) => `${(us / 1000).toFixed(0).padStart(6)} ms  ${((us / total) * 100).toFixed(1).padStart(5)}%  ${n}`);
console.log("TOTAL", (total / 1000).toFixed(0), "ms em", durS, "s");
console.log("\n== por arquivo ==\n" + top(byFile, 15).join("\n"));
console.log("\n== por função ==\n" + top(byFn, 30).join("\n"));
await browser.close({ silent: true });
