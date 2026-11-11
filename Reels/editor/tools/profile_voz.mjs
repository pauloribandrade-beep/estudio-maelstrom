// Testa o motor de voz da prévia num Chrome à parte (não mexe na aba do Paulo): toca, confere se a voz acompanha o
// player, simula um ajuste de clipe no meio (troca a lista de takes) e mede se a voz continua sem buraco.
// Uso: node tools/profile_voz.mjs <slug> <inicio_s>
import { openBrowser } from "@remotion/renderer";

const [slug = "hl3_M01", startS = "1400"] = process.argv.slice(2);
const browser = await openBrowser("chrome", { chromiumOptions: { gl: "angle", userAgent: undefined }, forceDeviceScaleFactor: 1 });
const page = await browser.newPage({ context: () => null, logLevel: "error", indent: false, pageIndex: 0, onBrowserLog: null, onLog: () => undefined });
await page.setViewport({ width: 1600, height: 1000, deviceScaleFactor: 1 });
await page.goto({ url: `http://localhost:5173/?v=${slug}`, timeout: 120000 });
await new Promise((r) => setTimeout(r, 8000));
const res = await page.evaluate(async (start) => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const P = window.__player;
  const E = window.__voz;
  if (!P || !E) return { error: "sem player ou motor", P: !!P, E: !!E };
  E.unlock();
  P.seekTo(Math.round(start * 30));
  await sleep(1500);
  const log = [];
  const snap = (tag) => log.push({ tag, player: +(P.getCurrentFrame() / 30).toFixed(2), voz: +E.now().toFixed(2), tocando: E.isPlaying(), ctx: E["ctx"]?.state, ...E.stats, rms: +E.stats.rms.toFixed(3) });
  P.play();
  for (let i = 0; i < 6; i++) {
    await sleep(1000);
    snap("tocando");
  }
  // simula o ajuste de um clipe 3 s à frente: o fim do take atual fica 0,4 s maior
  const segs = E["segs"].map((s) => ({ ...s }));
  const k = E["segAt"](E.now() + 3);
  segs[k].frames += 12;
  const before = E.stats.pieces;
  E.setSegments(segs, 30);
  await sleep(300);
  snap(`ajuste (agendou ${E.stats.pieces - before} pedaços em 0,3 s)`);
  for (let i = 0; i < 4; i++) {
    await sleep(1000);
    snap("depois do ajuste");
  }
  P.pause();
  await sleep(200);
  snap("pausa");
  return { log };
}, Number(startS));
console.log(JSON.stringify(res, null, 1));
await browser.close({ silent: true });
