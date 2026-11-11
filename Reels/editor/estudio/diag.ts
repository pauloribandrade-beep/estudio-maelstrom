// Gravador de diagnóstico da prévia (2026-10-02): guarda os últimos 40 s do que o player e cada <audio>/<video>
// fazem (play, pause, buscas, esperas, criação/remoção, saltos do cursor e QUEM mandou o player buscar). Ctrl+Shift+D
// salva em out/<slug>/diag-<hora>.json para o Claude ler quando o Paulo ouvir repetição ou picote.
type Ev = [number, string, string, number?, number?, string?];
const buf: Ev[] = [];
const T0 = performance.now();
const now = () => Math.round(performance.now() - T0);
const nm = (el: HTMLMediaElement) => (el.currentSrc || el.src || "").split("/").pop()?.slice(0, 40) ?? "?";
type P = { getCurrentFrame: () => number; isPlaying: () => boolean; seekTo: (f: number) => void; __diag?: boolean };
const player = () => (window as unknown as { __player?: P }).__player;
const push = (e: Ev) => {
  buf.push(e);
  const lim = now() - 40000;
  while (buf.length && buf[0][0] < lim) buf.shift();
};
const frame = () => {
  try {
    return player()?.getCurrentFrame() ?? -1;
  } catch {
    return -1;
  }
};

export const installDiag = (slug: () => string) => {
  if ((window as unknown as { __diagOn?: boolean }).__diagOn) return;
  (window as unknown as { __diagOn?: boolean }).__diagOn = true;
  for (const ev of ["play", "playing", "pause", "seeking", "seeked", "waiting", "stalled", "emptied", "ended", "error"]) {
    document.addEventListener(
      ev,
      (e) => {
        const el = e.target as HTMLMediaElement;
        if (!(el instanceof HTMLMediaElement)) return;
        push([now(), ev, nm(el), +el.currentTime.toFixed(3), frame()]);
      },
      true,
    );
  }
  new MutationObserver((ms) =>
    ms.forEach((m) => {
      m.addedNodes.forEach((n) => {
        const list = n instanceof HTMLMediaElement ? [n] : n instanceof Element ? Array.from(n.querySelectorAll("audio,video")) : [];
        list.forEach((el) => push([now(), "+media", nm(el as HTMLMediaElement), undefined, frame()]));
      });
      m.removedNodes.forEach((n) => {
        if (n instanceof HTMLMediaElement) push([now(), "-media", nm(n), undefined, frame()]);
      });
    }),
  ).observe(document.body, { childList: true, subtree: true });
  // cursor: saltos (tocando, mais de meio segundo fora do esperado) e quem chamou seekTo
  let lastF = -1;
  let lastT = 0;
  let wasPlaying = false;
  setInterval(() => {
    const p = player();
    if (!p) return;
    if (!p.__diag) {
      p.__diag = true;
      const orig = p.seekTo.bind(p);
      p.seekTo = (f: number) => {
        const who = (new Error().stack ?? "").split("\n").slice(2, 6).map((s) => s.trim().replace(/\(?https?:\/\/[^/]+\//, "").replace(/\?[^:]*/, "")).join(" ← ");
        push([now(), "SEEK_PLAYER", "", f, frame(), who]);
        return orig(f);
      };
    }
    const f = frame();
    const t = performance.now();
    const playing = p.isPlaying();
    if (playing !== wasPlaying) push([now(), playing ? "player_play" : "player_pause", "", undefined, f]);
    if (playing && wasPlaying && lastF >= 0) {
      const exp = lastF + ((t - lastT) / 1000) * 30;
      if (Math.abs(f - exp) > 15) push([now(), "SALTO_CURSOR", "", Math.round(exp), f]);
    }
    wasPlaying = playing;
    lastF = f;
    lastT = t;
  }, 100);
  window.addEventListener("keydown", async (e) => {
    if (!(e.ctrlKey && e.shiftKey && (e.key === "D" || e.key === "d"))) return;
    e.preventDefault();
    const r = await fetch(`/api/diaglog/${slug()}`, { method: "POST", body: JSON.stringify({ at: new Date().toISOString(), frame: frame(), events: buf }) }).catch(() => null);
    const j = r ? await r.json().catch(() => ({})) : {};
    const d = document.createElement("div");
    d.textContent = j.file ? `diagnóstico salvo (${buf.length} eventos) — avise o Claude` : "não deu para salvar o diagnóstico";
    Object.assign(d.style, { position: "fixed", left: "50%", top: "20px", transform: "translateX(-50%)", background: "#f5c542", color: "#1a1300", padding: "8px 14px", borderRadius: "10px", fontWeight: "700", zIndex: "9999" });
    document.body.appendChild(d);
    setTimeout(() => d.remove(), 3500);
  });
};
