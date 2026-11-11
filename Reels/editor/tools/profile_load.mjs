// Mede quanto o Estúdio leva para ABRIR (Chrome à parte, não mexe na aba do Paulo): tempo até os dados, o player,
// a voz da prévia pronta para tocar, e o que a rede baixou. Uso: node tools/profile_load.mjs <slug>
import { openBrowser } from "@remotion/renderer";

const [slug = "hl3_M01"] = process.argv.slice(2);
const browser = await openBrowser("chrome", { chromiumOptions: { gl: "angle" } });
const page = await browser.newPage({ context: () => null, logLevel: "error", indent: false, pageIndex: 0, onBrowserLog: null, onLog: () => undefined });
await page.setViewport({ width: 1600, height: 1000, deviceScaleFactor: 1 });
const t0 = Date.now();
await page.goto({ url: `http://localhost:5173/?v=${slug}`, timeout: 120000 });
const tNav = Date.now() - t0;
const res = await page.evaluate(async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const s = performance.now();
  const marks = {};
  while (performance.now() - s < 90000) {
    const t = Math.round(performance.now());
    if (!marks.timeline && document.querySelector(".tl-scroll, .timeline")) marks.timeline = t;
    if (!marks.player && window.__player) marks.player = t;
    const au = [...document.querySelectorAll("audio")].find((a) => /voicecont|preview\.wav/.test(a.currentSrc || a.src));
    if (!marks.voice && au && au.readyState >= 3) marks.voice = t;
    if (marks.player && marks.voice) break;
    await sleep(50);
  }
  const net = performance
    .getEntriesByType("resource")
    .map((e) => ({ u: e.name.replace(location.origin, "").slice(0, 70), ms: Math.round(e.duration), kb: Math.round((e.transferSize || 0) / 1024) }))
    .sort((a, b) => b.ms - a.ms)
    .slice(0, 12);
  const lt = performance.getEntriesByType("longtask")?.length ?? null;
  return { marks, net, heapMB: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null, lt };
});
console.log(JSON.stringify({ navMs: tNav, ...res }, null, 1));
await browser.close({ silent: true });
