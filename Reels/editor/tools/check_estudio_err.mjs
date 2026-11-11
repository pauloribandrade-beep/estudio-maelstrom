import { openBrowser } from "@remotion/renderer";

const browser = await openBrowser("chrome", { chromiumOptions: { gl: "angle" } });
const errors = [];
const logs = [];

const page = await browser.newPage({
  context: () => null,
  logLevel: "verbose",
  indent: false,
  pageIndex: 0,
  onBrowserLog: (ev) => {
    logs.push(`[${ev.type}] ${ev.text}`);
    if (ev.type === "error") errors.push(ev.text);
  },
  onLog: (level, msg) => {
    logs.push(`[${level}] ${msg}`);
  }
});

page.page.on("pageerror", (err) => {
  errors.push("PAGEERROR: " + err.stack || err.message);
});

await page.setViewport({ width: 1600, height: 1000, deviceScaleFactor: 1 });

try {
  await page.goto({ url: "http://localhost:5173/?v=2026-10-26_jones-nikolas", timeout: 15000 });
} catch (e) {
  errors.push("GOTO ERROR: " + e.message);
}

await new Promise((r) => setTimeout(r, 4000));

console.log("=== ERRORS ===");
console.log(errors.join("\n") || "Nenhum erro gravado em errors");

console.log("=== LOGS (ultimos 30) ===");
console.log(logs.slice(-30).join("\n"));

await browser.close({ timeoutInMilliseconds: 5000, indent: false });
