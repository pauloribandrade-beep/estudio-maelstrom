// Mede a fluidez da prévia do Estúdio num Chrome de verdade (página visível para o navegador):
// quadros/s do navegador, tarefas longas e saltos para trás do vídeo (= a fala "repetindo").
// Uso: node tools/profile_estudio.mjs <slug> [inicio_s] [duracao_s]   (Estúdio rodando em :5173)
import { openBrowser } from "@remotion/renderer";

const [slug, startS = "0", durS = "15"] = process.argv.slice(2);
const browser = await openBrowser("chrome", { chromiumOptions: { gl: "angle" } });
const page = await browser.newPage({ context: () => null, logLevel: "error", indent: false, pageIndex: 0, onBrowserLog: null, onLog: () => undefined });
await page.setViewport({ width: 1600, height: 1000, deviceScaleFactor: 1 });
await page.goto({ url: `http://localhost:${process.env.PORT || 5174}/?v=${slug}${process.env.DBG ? `&dbg=${process.env.DBG}` : ""}`, timeout: 60000 });
await new Promise((r) => setTimeout(r, 9000));
const res = await page.evaluate(
  async (start, dur) => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    // formato só voz (HL3): não tem <video>; mede pela voz contínua
    const v0el = document.querySelector("video") || [...document.querySelectorAll("audio")].find((a) => /voicecont|preview.wav/.test(a.currentSrc || a.src));
    // motor de voz (Web Audio): sem elemento de mídia → mede pelo próprio player
    const v = v0el || { get currentTime() { return window.__player ? window.__player.getCurrentFrame() / 30 : 0; } };
    if (!window.__player && !v0el) return { error: "sem player", hidden: document.hidden };
    // posiciona: clica na régua não é trivial; usa a tecla Home e as setas Shift (10 quadros)
    const lt = [];
    new PerformanceObserver((l) => l.getEntries().forEach((e) => lt.push(Math.round(e.duration)))).observe({ type: "longtask" });
    const frames = [];
    let last = performance.now();
    let run = true;
    const tick = (t) => {
      frames.push(t - last);
      last = t;
      if (run) requestAnimationFrame(tick);
    };
    const jumps = [];
    let lv = v.currentTime;
    const iv = setInterval(() => {
      const t = v.currentTime;
      if (t < lv - 0.08) jumps.push([+lv.toFixed(2), +t.toFixed(2)]);
      lv = t;
    }, 40);
    const btn = () => document.querySelector('button[aria-label="Play video"],button[title="Play video"]');
    if (start > 0) {
      window.__player?.seekTo(Math.round(start * 30));
      await sleep(3000);
    }
    const P = window.__player;
    const ev = [];
    if (P) ["waiting", "resume", "pause", "play", "seeked"].forEach((n) => P.addEventListener(n, () => ev.push([n, Math.round(performance.now() - t0), P.getCurrentFrame()])));
    requestAnimationFrame(tick);
    const t0 = performance.now();
    const f0 = P ? P.getCurrentFrame() : 0;
    const v0 = v.currentTime;
    btn()?.click();
    await sleep(dur * 1000);
    run = false;
    clearInterval(iv);
    const wall = (performance.now() - t0) / 1000;
    const adv = v.currentTime - v0;
    const pAdv = P ? (P.getCurrentFrame() - f0) / 30 : -1;
    frames.sort((a, b) => a - b);
    const q = (p) => Math.round(frames[Math.floor(frames.length * p)] ?? 0);
    return { sfx: window.__sfx ? { ...window.__sfx.stats } : null, hidden: document.hidden, wall: +wall.toFixed(1), videoAdvanced: +adv.toFixed(2), playerAdvanced: +pAdv.toFixed(2), events: ev.slice(0, 30), fps: +(frames.length / wall).toFixed(1), p50: q(0.5), p90: q(0.9), p99: q(0.99), longTasks: lt.length, longSum: lt.reduce((a, b) => a + b, 0), jumps };
  },
  Number(startS),
  Number(durS),
);
console.log(JSON.stringify(res, null, 1));
await browser.close({ silent: true });
