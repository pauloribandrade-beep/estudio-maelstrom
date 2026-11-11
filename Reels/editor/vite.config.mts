import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn, spawnSync, execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cleanTemp, makeSocial, makeUpdater } from "./estudio-server/social";

// ESTÚDIO ZALE: editor de timeline em cima do edit.json de cada vídeo.
// `npm run estudio` -> http://localhost:5173
// A API abaixo roda no próprio servidor do Vite (na web, vira o back-end).

const ROOT = __dirname;
const VIDEOS = path.join(ROOT, "src", "videos");
const PUBLIC = path.join(ROOT, "public");
const SCRIPTS = path.resolve(ROOT, "..", "..", ".claude", "skills", "editor-reels-zale", "scripts");
const SAFE = /^[\w.-]+$/;
const MUSIC_LIB = path.join(ROOT, "sfx-lib", "mixkit-music");
// Roda um processo SEM travar o servidor (spawnSync/execFileSync congelavam o Estúdio inteiro enquanto o ffmpeg
// convertia a prévia de um vídeo longo: a página nem recarregava). Mesmo formato de retorno do spawnSync.
const run = (cmd: string, args: string[], opts: { cwd?: string; env?: NodeJS.ProcessEnv } = {}) =>
  new Promise<{ status: number | null; stdout: string; stderr: string }>((ok) => {
    const p = spawn(cmd, args, { cwd: opts.cwd, env: opts.env });
    let stdout = "";
    let stderr = "";
    p.stdout?.on("data", (d) => (stdout += d.toString()));
    p.stderr?.on("data", (d) => (stderr += d.toString()));
    p.on("error", (e) => ok({ status: -1, stdout, stderr: stderr + String(e) }));
    p.on("close", (status) => ok({ status, stdout, stderr }));
  });
// VOZ CONTÍNUA da prévia (formato só voz): copia, do WAV da voz, o trecho de cada take NA ORDEM DA TIMELINE para um
// arquivo só, com fades de 2 quadros nas emendas (os mesmos da voz take a take). A prévia toca esse arquivo do começo
// ao fim: sem trocar de <audio> a cada corte (era isso que, com o computador ocupado, fazia o áudio voltar e a mesma
// frase "repetir"). Amostra exata: o take k começa na amostra round(soma_dos_quadros_anteriores / fps * taxa).
const buildVoiceCont = async (src: string, segs: { a: number; frames: number }[], fps: number, out: string) => {
  const fh = await fs.promises.open(src, "r");
  try {
    const head = Buffer.alloc(65536);
    await fh.read(head, 0, head.length, 0);
    if (head.toString("ascii", 0, 4) !== "RIFF" || head.toString("ascii", 8, 12) !== "WAVE") throw new Error("não é WAV");
    let p = 12;
    let ch = 2;
    let rate = 44100;
    let bits = 16;
    let dataOff = -1;
    let dataLen = 0;
    while (p + 8 <= head.length) {
      const id = head.toString("ascii", p, p + 4);
      const len = head.readUInt32LE(p + 4);
      if (id === "fmt ") {
        ch = head.readUInt16LE(p + 10);
        rate = head.readUInt32LE(p + 12);
        bits = head.readUInt16LE(p + 22);
      }
      if (id === "data") {
        dataOff = p + 8;
        dataLen = len;
        break;
      }
      p += 8 + len + (len % 2);
    }
    if (dataOff < 0 || bits !== 16) throw new Error("WAV sem dados PCM 16 bits");
    const bpf = ch * 2;
    const total = Math.floor(dataLen / bpf);
    const tmp = out + ".tmp";
    const oh = await fs.promises.open(tmp, "w");
    try {
      let cum = 0;
      let written = 0;
      await oh.write(Buffer.alloc(44), 0, 44, 0);
      for (let k = 0; k < segs.length; k++) {
        const s0 = Math.round((cum / fps) * rate);
        cum += segs[k].frames;
        const n = Math.round((cum / fps) * rate) - s0;
        const buf = Buffer.alloc(n * bpf);
        const from = Math.round(segs[k].a * rate);
        const avail = Math.max(0, Math.min(n, total - from));
        if (avail > 0 && from >= 0) await fh.read(buf, 0, avail * bpf, dataOff + from * bpf);
        // 8 ms (eram 2 quadros = 66 ms, que comiam o começo/fim das palavras nas emendas justas; 05/10/2026)
        const fin = Math.round(0.008 * rate);
        const fout = Math.round(0.008 * rate);
        for (let i = 0; i < Math.min(fin, n); i++) {
          const g = i / fin;
          for (let c = 0; c < ch; c++) buf.writeInt16LE(Math.round(buf.readInt16LE((i * ch + c) * 2) * g), (i * ch + c) * 2);
        }
        for (let i = 0; i < Math.min(fout, n); i++) {
          const j = n - 1 - i;
          const g = i / fout;
          for (let c = 0; c < ch; c++) buf.writeInt16LE(Math.round(buf.readInt16LE((j * ch + c) * 2) * g), (j * ch + c) * 2);
        }
        await oh.write(buf, 0, buf.length, 44 + written);
        written += buf.length;
      }
      const h = Buffer.alloc(44);
      h.write("RIFF", 0, "ascii");
      h.writeUInt32LE(36 + written, 4);
      h.write("WAVE", 8, "ascii");
      h.write("fmt ", 12, "ascii");
      h.writeUInt32LE(16, 16);
      h.writeUInt16LE(1, 20);
      h.writeUInt16LE(ch, 22);
      h.writeUInt32LE(rate, 24);
      h.writeUInt32LE(rate * bpf, 28);
      h.writeUInt16LE(bpf, 32);
      h.writeUInt16LE(16, 34);
      h.write("data", 36, "ascii");
      h.writeUInt32LE(written, 40);
      await oh.write(h, 0, 44, 0);
    } finally {
      await oh.close();
    }
    fs.renameSync(tmp, out);
  } finally {
    await fh.close();
  }
};
// uma tarefa pesada por chave (duas abas pedindo a mesma prévia esperam a mesma conversão)
const inflight: Record<string, Promise<unknown>> = {};
const once = <T,>(key: string, fn: () => Promise<T>): Promise<T> => {
  if (!inflight[key]) inflight[key] = fn().finally(() => delete inflight[key]);
  return inflight[key] as Promise<T>;
};
// render mais novo de out/<slug> (o final, não a prévia) e se ele ficou VELHO: o edit.json ou os takes mudaram
// depois dele (o Paulo baixava um vídeo de antes da última edição sem saber)
const newestRender = (slug: string) => {
  const dir = path.join(ROOT, "out", slug);
  if (!fs.existsSync(dir)) return null;
  // nomes escolhidos na janela do render (render.py guarda em _renders.json)
  let named = new Set<string>();
  try {
    named = new Set(JSON.parse(fs.readFileSync(path.join(dir, "_renders.json"), "utf-8")));
  } catch {
    /* ainda não tem */
  }
  const list = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith("edit.mp4") || named.has(f))
    .map((f) => ({ file: `out/${slug}/${f}`, mtime: fs.statSync(path.join(dir, f)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);
  return list[0] ?? null;
};
const isStale = (slug: string, renderMtime: number) => {
  const srcs = ["edit.json", "segments.json", "words.json"].map((f) => path.join(VIDEOS, slug, f)).filter((f) => fs.existsSync(f));
  const edited = Math.max(0, ...srcs.map((f) => fs.statSync(f).mtimeMs));
  return edited > renderMtime + 1000;
};

const wavDuration = (file: string) => {
  try {
    const b = fs.readFileSync(file);
    let i = 12;
    let rate = 0, align = 0;
    while (i < b.length - 8) {
      const id = b.toString("ascii", i, i + 4);
      const size = b.readUInt32LE(i + 4);
      if (id === "fmt ") {
        rate = b.readUInt32LE(i + 12);
        align = b.readUInt16LE(i + 20);
      }
      if (id === "data" && rate && align) return size / align / rate;
      i += 8 + size + (size % 2);
    }
  } catch {
    /* ignore */
  }
  return 1;
};

// Onda da voz na linha do tempo da EDIÇÃO (os takes colados), 100 valores por segundo.
const voicePeaks = (slug: string) => {
  // a onda da voz é refeita sempre que os takes mudam (antes só depois do "Cortar respiros" e ficava velha)
  const cache = path.join(ROOT, "out", slug, "peaks.json");
  const segFile = path.join(VIDEOS, slug, "segments.json");
  if (fs.existsSync(cache) && fs.statSync(cache).mtimeMs > fs.statSync(segFile).mtimeMs) return JSON.parse(fs.readFileSync(cache, "utf-8"));
  const spec = JSON.parse(fs.readFileSync(segFile, "utf-8"));
  // recorta da onda da GRAVAÇÃO inteira (filePeaks, 100 valores/s, em cache até a gravação mudar): antes decodificava
  // os ~56 min de áudio a CADA ajuste de clipe, travando o servidor uns segundos — a voz sumia na prévia até acabar
  const src = filePeaks(`videos/${slug}/ig1080.mp4`);
  const out: number[] = [];
  const fps = spec.fps ?? 30;
  for (const s of spec.segments) {
    // mesma régua da linha Vídeo: cada trecho ocupa os QUADROS dele (b - a cru deixava sobra a cada emenda e a voz
    // escorregava ao longo do vídeo)
    const n = Math.round(((s.frames ?? Math.round((s.b - s.a) * fps)) / fps) * 100);
    for (let k = 0, i = Math.floor(s.a * 100); k < n; k++, i++) out.push(Math.round((src[i] ?? 0) * 100) / 100);
  }
  fs.mkdirSync(path.dirname(cache), { recursive: true });
  fs.writeFileSync(cache, JSON.stringify(out));
  return out;
};

// Onda de um arquivo de som (100 valores por segundo), com cache.
const filePeaks = (rel: string) => {
  const abs = path.join(PUBLIC, rel);
  const cache = path.join(ROOT, "out", "peaks-sfx", rel.replace(/[\/]/g, "_") + ".json");
  if (fs.existsSync(cache) && fs.statSync(cache).mtimeMs > fs.statSync(abs).mtimeMs) return JSON.parse(fs.readFileSync(cache, "utf-8"));
  const raw = execFileSync("ffmpeg", ["-v", "error", "-i", abs, "-ac", "1", "-ar", "8000", "-f", "s16le", "-"], { maxBuffer: 1 << 30 }); // ~5 h de gravação a 8 kHz passam de 256 MB
  const pcm = new Int16Array(raw.buffer, raw.byteOffset, Math.floor(raw.length / 2));
  const out: number[] = [];
  for (let i = 0; i < pcm.length; i += 80) {
    let m = 0;
    for (let j = i; j < i + 80 && j < pcm.length; j++) m = Math.max(m, Math.abs(pcm[j]));
    out.push(Math.round((m / 32768) * 1000) / 1000);
  }
  fs.mkdirSync(path.dirname(cache), { recursive: true });
  fs.writeFileSync(cache, JSON.stringify(out));
  return out;
};

// Voz tratada: mesma linha do tempo da GRAVAÇÃO (os takes continuam valendo).
// Roda em segundo plano com progresso: 1ª passada mede a voz inteira (loudnorm), 2ª aplica
// o ajuste exato (linear, sem "bombear"). Enquanto isso o editor segue tocando a voz anterior.
type VoiceFx = { normalize?: boolean; denoise?: boolean; highpass?: boolean; compress?: boolean; reverb?: number; room?: number; breaths?: number; deess?: number };
type Job = { pct: number; done: boolean; ok?: boolean; src?: string; error?: string; step: string };
const jobs: Record<string, Job> = {};
const mediaDuration = (file: string) => {
  const r = spawnSync("ffmpeg", ["-hide_banner", "-i", file], { encoding: "utf-8" });
  const m = /Duration: (\d+):(\d+):([\d.]+)/.exec(r.stderr || "");
  return m ? +m[1] * 3600 + +m[2] * 60 + +m[3] : 60;
};
const runFfmpeg = (args: string[], total: number, onPct: (p: number) => void) =>
  new Promise<string>((ok, bad) => {
    const p = spawn("ffmpeg", ["-hide_banner", "-nostats", "-progress", "pipe:1", ...args]);
    let err = "";
    p.stdout.on("data", (d: Buffer) => {
      const m = /out_time_ms=(\d+)/g;
      let x: RegExpExecArray | null;
      let last = -1;
      while ((x = m.exec(d.toString()))) last = +x[1];
      if (last >= 0) onPct(Math.min(1, last / 1e6 / total));
    });
    p.stderr.on("data", (d: Buffer) => (err = (err + d.toString()).slice(-20000)));
    p.on("close", (code) => (code === 0 ? ok(err) : bad(new Error(err.slice(-800)))));
  });
// fonte da voz tratada: o áudio SEM PERDA remontado dos WAVs originais (tools/lossless_rebuild.py), quando existe e é
// mais novo que a gravação. O AAC do ig1080 passou por 25+ recodificações nas emendas de take (06/10/2026).
const voiceSource = (slug: string) => {
  const ig = path.join(PUBLIC, "videos", slug, "ig1080.mp4");
  const ll = path.join(PUBLIC, "videos", slug, "ig1080.lossless.wav");
  return fs.existsSync(ll) && fs.existsSync(ig) && fs.statSync(ll).mtimeMs >= fs.statSync(ig).mtimeMs ? ll : ig;
};
const startVoiceJob = (slug: string, fx: VoiceFx) => {
  const pre: string[] = [];
  if (fx.highpass) pre.push("highpass=f=80");
  if (fx.denoise) pre.push("afftdn=nr=12:nf=-40:tn=1");
  if (fx.compress) pre.push("acompressor=threshold=-20dB:ratio=3:attack=8:release=120:makeup=2");
  const rev = Math.max(0, Math.min(1, (fx.reverb ?? 0) / 100));
  const room = [1, 2, 4, 8].reduce((a, b) => (Math.abs(b - (fx.room ?? 1)) < Math.abs(a - (fx.room ?? 1)) ? b : a), 1);
  const breaths = Math.max(0, Math.min(40, Math.round(fx.breaths ?? 0)));
  const deess = Math.max(0, Math.min(100, Math.round(fx.deess ?? 0)));
  const key = JSON.stringify({ pre, n: !!fx.normalize, rev, room, v: 3, ...(breaths ? { breaths } : {}), ...(deess ? { deess } : {}) });
  const hash = createHash("md5").update(key).digest("hex").slice(0, 10);
  const rel = `videos/${slug}/voice-${hash}.m4a`;
  const dst = path.join(PUBLIC, rel);
  const id = `${slug}-${hash}`;
  // pronto só se for MAIS NOVO que a gravação: depois de emendar take na fonte, a voz antiga não tem o trecho novo
  // (ficava mudo na prévia e no render). Refaz com o mesmo nome; até acabar, o arquivo velho segue tocando.
  const master = voiceSource(slug);
  if (fs.existsSync(dst) && (!fs.existsSync(master) || fs.statSync(dst).mtimeMs >= fs.statSync(master).mtimeMs)) {
    jobs[id] = { pct: 100, done: true, ok: true, src: rel, step: "pronto" };
    return id;
  }
  if (jobs[id] && !jobs[id].done) return id;
  const job: Job = (jobs[id] = { pct: 0, done: false, step: breaths ? "suprimindo respiros" : fx.normalize ? "medindo a voz" : "processando" });
  let src = voiceSource(slug);
  const total = mediaDuration(src);
  const tmp = dst + ".tmp.m4a";
  (async () => {
    try {
      // supressão de respiros: tools/breathduck.py abaixa cada respiro da gravação (sem cortar nada);
      // o resto do tratamento roda em cima desse WAV, na mesma linha do tempo
      if (breaths) {
        src = await new Promise<string>((ok, bad) => {
          const pr = spawn("python", [path.join(ROOT, "tools", "breathduck.py"), slug, String(breaths)], { cwd: ROOT });
          let out = "";
          let err = "";
          pr.stdout.on("data", (b: Buffer) => (out += b.toString()));
          pr.stderr.on("data", (b: Buffer) => (err = (err + b.toString()).slice(-2000)));
          pr.on("close", (code) => (code === 0 ? ok(out.trim().split(/\r?\n/).pop() as string) : bad(new Error(err))));
        });
        job.step = fx.normalize ? "medindo a voz" : "processando";
      }
      // DE-ESSER (0–100): só a faixa dos "s" (acima de ~5 kHz) passa por um compressor rápido; o resto da voz fica
      // intacto. Mais intensidade = limiar mais baixo e compressão mais forte nessa faixa.
      if (deess) {
        job.step = "tirando o chiado do S";
        const k = deess / 100;
        const thr = (-14 - 30 * k).toFixed(1);
        const ratio = (2 + 14 * k).toFixed(1);
        const out = dst.replace(/\.m4a$/, `.deess${deess}.wav`);
        const graph = `asplit[a][b];[a]lowpass=f=5000:p=2,lowpass=f=5000:p=2[lo];[b]highpass=f=5000:p=2,highpass=f=5000:p=2,acompressor=threshold=${thr}dB:ratio=${ratio}:attack=0.5:release=40:knee=4[hi];[lo][hi]amix=inputs=2:normalize=0`;
        await runFfmpeg(["-y", "-i", src, "-vn", "-af", graph, "-ac", "2", "-ar", "48000", "-c:a", "pcm_s16le", out], total, (p) => (job.pct = Math.round(p * 20)));
        src = out;
      }
      let chain = [...pre];
      if (fx.normalize) {
        const log = await runFfmpeg(["-y", "-i", src, "-vn", "-af", [...pre, "loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json"].join(","), "-f", "null", "-"], total, (p) => (job.pct = Math.round(p * 50)));
        const js = JSON.parse(log.slice(log.lastIndexOf("{"), log.lastIndexOf("}") + 1));
        chain.push(`loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=${js.input_i}:measured_TP=${js.input_tp}:measured_LRA=${js.input_lra}:measured_thresh=${js.input_thresh}:offset=${js.target_offset}:linear=true`);
        job.step = "aplicando";
      }
      const base = fx.normalize ? 50 : 0;
      if (rev > 0) {
        // reverb de convolução (mesmas salas dos sons): voz seca + cauda da sala, sem estourar
        const irFile = path.join(PUBLIC, "sfx", "_ir", `sala_${room}s.wav`);
        const irGain = parseFloat(fs.readFileSync(path.join(PUBLIC, "sfx", "_ir", `sala_${room}s.gain`), "utf-8"));
        const pre2 = ["aresample=48000", "aformat=channel_layouts=stereo", ...chain].join(",");
        const graph = `[0:a]${pre2},asplit[d][w];[w][1:a]afir=irnorm=-1,volume=${(irGain * rev * 1.2).toFixed(4)}[wv];[d][wv]amix=inputs=2:normalize=0:duration=first,alimiter=limit=0.9:level=false[o]`;
        await runFfmpeg(["-y", "-i", src, "-i", irFile, "-filter_complex", graph, "-map", "[o]", "-ar", "48000", "-c:a", "aac", "-b:a", "256k", tmp], total, (p) => (job.pct = base + Math.round(p * (100 - base))));
      } else {
        await runFfmpeg(["-y", "-i", src, "-vn", ...(chain.length ? ["-af", chain.join(",")] : []), "-ar", "48000", "-c:a", "aac", "-b:a", "256k", tmp], total, (p) => (job.pct = base + Math.round(p * (100 - base))));
      }
      // grava POR CIMA em vez de renomear: o arquivo velho costuma ter um 2º vínculo (cópia enxuta do render de
      // conferência) e no Windows o rename falhava em silêncio — o Estúdio achava a voz velha e recomeçava em círculo
      fs.copyFileSync(tmp, dst);
      fs.rmSync(tmp, { force: true });
      // o WAV intermediário do de-esser (~300 MB) não serve mais
      if (deess) fs.rmSync(dst.replace(/\.m4a$/, `.deess${deess}.wav`), { force: true });
      Object.assign(job, { pct: 100, done: true, ok: true, src: rel, step: "pronto" });
    } catch (e) {
      Object.assign(job, { done: true, ok: false, error: String(e).slice(0, 400), step: "falhou" });
    }
  })();
  return id;
};

// Renders em andamento. Fica em globalThis para sobreviver ao recarregamento da config do Vite
// (antes o estado se perdia e o botão ficava "renderizando" para sempre).
type RenderArgs = { comp: string; name: string; mode: string; res: string };
type RenderJob = { args?: RenderArgs; outLog?: string; adopted?: boolean; log: string; done: boolean; ok?: boolean; file?: string; start: number; end?: number; pid?: number; cancelled?: boolean; paused?: boolean; pausedAt?: number; pausedMs?: number; error?: string; lastPct?: number; lastEta?: string; lastFrames?: string };
const renders: Record<string, RenderJob> = ((globalThis as unknown as { __renders?: Record<string, RenderJob> }).__renders ??= {});

// 09/11 (o pause não adiantava e fechar o servidor perdia o render): o render roda SOLTO do servidor (detached,
// saída num arquivo) e o estado dele fica em out/<slug>/_render_job.json. Assim qualquer Estúdio aberto (havia dois,
// 5173 e 5174) ou um Estúdio reaberto acha o render, mostra o progresso e consegue pausar, continuar e cancelar.
const jobFile = (slug: string) => path.join(ROOT, "out", slug, "_render_job.json");
const pidAlive = (pid?: number) => {
  if (!pid) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return (e as NodeJS.ErrnoException).code === "EPERM";
  }
};
const saveJob = (slug: string, j: RenderJob) => {
  try {
    fs.writeFileSync(jobFile(slug), JSON.stringify({ pid: j.pid, start: j.start, paused: !!j.paused, pausedAt: j.pausedAt, pausedMs: j.pausedMs ?? 0, outLog: j.outLog, args: j.args, lastPct: j.lastPct, lastFrames: j.lastFrames }));
  } catch {
    /* sem pasta: só memória */
  }
};
const readTail = (f?: string, n = 6000) => {
  if (!f) return "";
  try {
    const st = fs.statSync(f);
    const k = Math.min(st.size, n);
    const fd = fs.openSync(f, "r");
    const buf = Buffer.alloc(k);
    fs.readSync(fd, buf, 0, k, st.size - k);
    fs.closeSync(fd);
    return buf.toString("utf-8");
  } catch {
    return "";
  }
};
const finishJob = (slug: string, j: RenderJob, code: number | null) => {
  if (j.done) return;
  j.log = readTail(j.outLog) || j.log;
  j.done = true;
  j.end = Date.now();
  const m = j.log.match(/-> (out\/.+?\.mp4)/);
  j.ok = (code === 0 || (code === null && !!m)) && !j.cancelled;
  if (m) j.file = m[1];
  if (!j.ok && !j.cancelled) j.error = j.log.split(/\r?\n/).filter(Boolean).slice(-4).join(" · ").slice(-400);
  fs.rmSync(jobFile(slug), { force: true });
};
// o render deste vídeo: o da memória ou, se este servidor não o começou, o do arquivo (se o processo ainda vive)
const jobOf = (slug: string): RenderJob | undefined => {
  let j = renders[slug];
  if (!j || j.done) {
    try {
      const d = JSON.parse(fs.readFileSync(jobFile(slug), "utf-8"));
      if ((pidAlive(d.pid) || (d.paused && d.args)) && (!j || j.pid !== d.pid || j.done)) {
        j = renders[slug] = { log: "", done: false, start: d.start, pid: d.pid, paused: d.paused, pausedAt: d.pausedAt, pausedMs: d.pausedMs, outLog: d.outLog, args: d.args, lastPct: d.lastPct, lastFrames: d.lastFrames, adopted: true };
      } else if (!pidAlive(d.pid)) {
        fs.rmSync(jobFile(slug), { force: true });
      }
    } catch {
      /* sem render salvo */
    }
  }
  if (j && !j.done && j.adopted && !j.paused && !pidAlive(j.pid)) finishJob(slug, j, null);
  return j;
};
// 11/11: pausar FECHA o render (Chromes, ffmpeg, node: congelados eles seguravam ~15 GB de RAM) e continuar abre de
// novo com os mesmos parâmetros; o render.py pula os blocos já prontos no cache (D:/tmp_zale/rcache/<slug>). Perde só
// os blocos que estavam no meio. Funciona também depois de fechar o Estúdio ou desligar o PC (estado no _render_job.json).
const startRender = (slug: string, st: RenderJob, a: RenderArgs) => {
  // --no-qa: as conferências técnicas (áudio só de efeitos, prévia, folha) servem para o Claude;
  // pelo Estúdio o vídeo sai mais rápido e com a mesma qualidade
  // temporários do Chrome/Remotion no F: (o C: do Paulo encheu em 2026-09-28 e o Chrome recusava ler o vídeo)
  const tmpDir = path.join(ROOT, "out", ".tmp");
  fs.mkdirSync(tmpDir, { recursive: true });
  // solto do servidor e com a saída num arquivo: fechar o Estúdio não mata o render (nem o que já foi feito)
  const outLog = path.join(ROOT, "out", slug, "render.out.log");
  fs.mkdirSync(path.dirname(outLog), { recursive: true });
  const fd = fs.openSync(outLog, "w");
  const p = spawn("python", [path.join(SCRIPTS, "render.py"), slug, a.comp, "--no-qa", "--name", a.name, "--mode", a.mode, "--res", a.res], { cwd: SCRIPTS, env: { ...process.env, TEMP: tmpDir, TMP: tmpDir, PYTHONUNBUFFERED: "1" }, detached: true, windowsHide: true, stdio: ["ignore", fd, fd] });
  fs.closeSync(fd);
  st.pid = p.pid;
  st.outLog = outLog;
  st.args = a;
  saveJob(slug, st);
  const pid = p.pid;
  p.on("close", (code) => {
    if (st.paused || st.pid !== pid) return; // fechado pelo pause (ou já reaberto): não é o fim do render
    finishJob(slug, st, code);
  });
};
// rotas que mudam o vídeo: recusadas com render rodando/pausado (ver a trava no começo da API)
const RENDER_LOCKED_API = new Set(["doc", "tighten", "untighten", "cutrange", "uncut", "recut", "splitclip", "trimclip", "voice", "pauses-ignore", "versions"]);
const pauseTool = (pid: number, what: string, slug: string) =>
  spawnSync("python", [path.join(SCRIPTS, "render_pause.py"), String(pid), what, slug], { encoding: "utf-8" });

// Progresso lido do render.log que o render.py escreve (saída do Remotion):
// "Bundling 45%" -> preparando · "Rendered 482/2439, time remaining: 5m 17s" -> quadros · "Encoded" -> codificando
const renderProgress = (slug: string, job: RenderJob) => {
  const logf = path.join(ROOT, "out", slug, "render.log");
  let tail = "";
  try {
    const st = fs.statSync(logf);
    if (st.mtimeMs >= job.start - 2000) {
      const fd = fs.openSync(logf, "r");
      const n = Math.min(st.size, 65536);
      const buf = Buffer.alloc(n);
      fs.readSync(fd, buf, 0, n, st.size - n);
      fs.closeSync(fd);
      tail = buf.toString("utf-8");
    }
  } catch {
    /* ainda não existe */
  }
  const lines = tail.split(/[\r\n]+/).filter(Boolean);
  const last = (re: RegExp) => {
    for (let i = lines.length - 1; i >= 0; i--) {
      const m = re.exec(lines[i]);
      if (m) return m;
    }
    return null;
  };
  const elapsed = Math.round(((job.done && job.end ? job.end : job.paused && job.pausedAt ? job.pausedAt : Date.now()) - job.start - (job.pausedMs ?? 0)) / 1000); // depois de pronto (ou pausado), o tempo para
  if (job.done) return { phase: job.ok ? "pronto" : job.cancelled ? "cancelado" : "erro", pct: job.ok ? 100 : 0, eta: "", elapsed };
  // uma barra só: o render.py escreve "PROGRESSO <pct> eta=<s> quadros=<a>/<b>" somando todas as etapas
  // (preparação, blocos, fechamento do áudio); nenhuma etapa intermediária aparece como 90/100%
  const pg = last(/^PROGRESSO ([\d.]+) eta=(\d+)(?: quadros=(\d+\/\d+))?/);
  // sem linha nova no fim do log (muita saída do Remotion), repete o último valor lido: a barra nunca volta
  if (job.paused) return { phase: "pausado", pct: job.lastPct ?? 0, eta: "", elapsed, frames: job.lastFrames };
  if (!pg) return { phase: "renderizando", pct: job.lastPct ?? 0, eta: job.lastEta ?? "", elapsed, frames: job.lastFrames };
  const s = +pg[2];
  const eta = elapsed < 20 ? "" : s >= 3600 ? `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m` : s >= 60 ? `${Math.floor(s / 60)}m` : `${s}s`;
  const fr = pg[3] ? pg[3].split("/").map(Number) : null;
  const byFrames = fr && fr[1] ? Math.floor((95 * fr[0]) / fr[1]) : 0; // retomado: os blocos do cache já contam
  job.lastPct = Math.max(job.lastPct ?? 0, Math.min(99, Math.max(Math.floor(+pg[1]), byFrames)));
  job.lastEta = eta;
  job.lastFrames = pg[3];
  return { phase: "renderizando", pct: job.lastPct, eta, elapsed, frames: pg[3] };
};

const api = (): Plugin => ({
  name: "estudio-api",
  configureServer(server) {
    const social = makeSocial(ROOT);
    const updater = makeUpdater(ROOT);
    // limpeza dos temporários do Remotion/Chrome (pedido do Paulo: o C: encheu duas vezes): ao abrir e a cada 30 min
    const tempDirs = [os.tmpdir(), path.join(ROOT, "out", ".tmp")];
    const runClean = () => {
      const r = cleanTemp(tempDirs);
      if (r.count) console.log(`[estúdio] limpeza de temporários: ${r.count} pastas, ${r.freedGB} GB`);
    };
    runClean();
    const cleanTimer = setInterval(runClean, 30 * 60 * 1000);
    server.httpServer?.on("close", () => clearInterval(cleanTimer));
    server.middlewares.use(async (req, res, next) => {
      if (!req.url?.startsWith("/api/")) return next();
      const url = new URL(req.url, "http://x");
      const parts = url.pathname.split("/").filter(Boolean); // api, recurso, slug
      const send = (code: number, body: unknown) => {
        res.statusCode = code;
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.end(JSON.stringify(body));
      };
      const body = async () =>
        new Promise<string>((ok) => {
          let d = "";
          req.on("data", (c) => (d += c));
          req.on("end", () => ok(d));
        });
      try {
        const [, what, slug] = parts;
        if (slug && !SAFE.test(slug)) return send(400, { error: "slug inválido" });
        // 11/11 (pedido do Paulo): timeline TRANCADA enquanto há render rodando ou pausado. Nada que mude o vídeo é
        // gravado (edit.json, cortes, voz, versões): uma mexida sem querer mudaria os blocos e o render refaria trechos
        if (slug && req.method !== "GET" && RENDER_LOCKED_API.has(what)) {
          const rj = jobOf(slug);
          if (rj && !rj.done) return send(423, { error: "timeline trancada: tem um render " + (rj.paused ? "pausado" : "rodando") + " (termine ou cancele para editar)", locked: true });
        }
        if (what === "videos") {
          // lista de projetos para a tela inicial: nome (do roteiro), duração, última edição e render pronto
          const list = fs
            .readdirSync(VIDEOS)
            .filter((d) => fs.existsSync(path.join(VIDEOS, d, "edit.json")))
            .map((d) => {
              const file = path.join(VIDEOS, d, "edit.json");
              let doc: { duration?: number; comp?: string; scenes?: unknown[] } = {};
              try {
                doc = JSON.parse(fs.readFileSync(file, "utf-8"));
              } catch {
                /* ignora */
              }
              let title = d.replace(/^\d{4}-\d{2}-\d{2}_/, "").replace(/-/g, " ");
              const rot = path.join(ROOT, "..", "roteiros", `${d}.md`);
              if (fs.existsSync(rot)) {
                const h = /^#\s+(.+)$/m.exec(fs.readFileSync(rot, "utf-8"));
                if (h) title = h[1].trim();
              }
              const outDir = path.join(ROOT, "out", d);
              const final = newestRender(d);
              return {
                slug: d,
                title,
                date: d.slice(0, 10),
                duration: doc.duration ?? null,
                scenes: doc.scenes?.length ?? 0,
                mtime: fs.statSync(file).mtimeMs,
                render: final ? { ...final, stale: isStale(d, final.mtime) } : null,
                caption: social.readCaption(d)?.text ?? null,
                tacoh: social.tacohOf(d),
                urgency: social.urgencyOf(d, social.readCal()),
                fact: social.factOf(d),
              };
            })
            .sort((a, b) => b.mtime - a.mtime);
          return send(200, list);
        }
        if (what === "roteiros") {
          // aba Roteiros: GET lista; GET /<slug> devolve o markdown; PUT /<slug> {status} marca à mão (null = automático)
          if (slug && req.method === "PUT") {
            const { status } = JSON.parse((await body()) || "{}");
            social.setStatus(slug, ["pendente", "edicao", "pronto", "postado"].includes(status) ? status : null);
            return send(200, { ok: true });
          }
          if (slug) {
            const md = social.readRoteiro(slug);
            return md == null ? send(404, { error: "roteiro não encontrado" }) : send(200, { md });
          }
          return send(200, social.listRoteiros((s) => !!newestRender(s)));
        }
        if (what === "update") {
          // versão nova no GitHub? GET confere (cache de 10 min, ?force=1 confere agora); POST atualiza
          if (req.method === "POST") return send(200, updater.update());
          return send(200, updater.status(url.searchParams.get("force") === "1"));
        }
        if (what === "caption" && slug) {
          // legenda do Instagram do vídeo: GET lê, POST gera (Claude API > Claude Code > modelo sem IA), PUT salva a editada
          if (req.method === "POST") {
            const r = await social.generate(slug);
            return send(200, r);
          }
          if (req.method === "PUT") {
            const { text } = JSON.parse((await body()) || "{}");
            const prev = social.readCaption(slug);
            const c = { ...(prev ?? { source: "modelo" as const }), text: String(text ?? ""), at: Date.now(), edited: true };
            social.saveCaption(slug, c);
            return send(200, { caption: c });
          }
          return send(200, { caption: social.readCaption(slug) });
        }
        if (what === "ideias") {
          // ABA IDEIAS (10/11/2026): quadro de bolhas do brainstorming, em Reels/ideias.json. GET lê; PUT grava a lista inteira
          const f = path.join(ROOT, "..", "ideias.json");
          if (req.method === "PUT") {
            const j = JSON.parse((await body()) || "{}");
            if (!Array.isArray(j.items)) return send(400, { error: "items" });
            fs.writeFileSync(f + ".tmp", JSON.stringify({ items: j.items }, null, 1));
            fs.renameSync(f + ".tmp", f);
            return send(200, { ok: true });
          }
          return send(200, fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : { items: [] });
        }
        if (what === "calendar") {
          // calendário de postagem (Reels/calendario.json). GET lê; PUT salva (items/perDay/urgent/urgency, parcial);
          // POST sugere os vídeos sem data e devolve o calendário INTEIRO (a tela troca o estado todo por ele)
          if (req.method === "PUT") return send(200, social.writeCal(JSON.parse((await body()) || "{}")));
          if (req.method === "POST") {
            const vids = fs
              .readdirSync(VIDEOS)
              .filter((d) => fs.existsSync(path.join(VIDEOS, d, "edit.json")))
              .map((d) => ({ slug: d, ready: !!newestRender(d) }));
            const before = social.readCal().items.length;
            const cal = social.suggest(vids);
            return send(200, { ...cal, added: cal.items.length - before });
          }
          return send(200, social.readCal());
        }
        if (what === "thumb" && slug) {
          // miniatura: um quadro do render final (se houver) ou da gravação
          const dir = path.join(ROOT, "out", slug);
          const thumb = path.join(dir, "thumb.jpg");
          const outs = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith("edit.mp4")) : [];
          const src = outs.length ? path.join(dir, outs[0]) : path.join(PUBLIC, "videos", slug, "ig1080.mp4");
          if (!fs.existsSync(thumb) || fs.statSync(thumb).mtimeMs < fs.statSync(src).mtimeMs) {
            fs.mkdirSync(dir, { recursive: true });
            execFileSync("ffmpeg", ["-v", "error", "-y", "-ss", "3", "-i", src, "-frames:v", "1", "-vf", "scale=360:-2", "-q:v", "4", thumb]);
          }
          res.setHeader("Content-Type", "image/jpeg");
          res.setHeader("Cache-Control", "no-cache");
          return fs.createReadStream(thumb).pipe(res);
        }
        if (what === "doc" && slug) {
          const file = path.join(VIDEOS, slug, "edit.json");
          if (req.method === "PUT") {
            const txt = await body();
            JSON.parse(txt); // valida
            const hist = path.join(ROOT, "out", slug, "edit-history");
            fs.mkdirSync(hist, { recursive: true });
            // CONFLITO: o arquivo foi alterado por fora (scripts do Claude) depois que esta aba o carregou.
            // Não grava por cima: guarda a versão da aba no histórico e avisa para recarregar.
            const base = Number(url.searchParams.get("base") || 0);
            if (base && fs.existsSync(file) && fs.statSync(file).mtimeMs > base + 5) {
              fs.writeFileSync(path.join(hist, `edit-${Date.now()}-conflito.json`), txt);
              return send(409, { error: "mudou por fora", mtime: fs.statSync(file).mtimeMs });
            }
            // histórico: com salvamento automático, guarda no máximo uma cópia por minuto (60 últimas)
            // só as cópias automáticas desta rotina (edit-<número>.json): os backups dos scripts (edit-antes-*.json) ficam
            // (antes a limpeza apagava também esses, e uma versão perdida não tinha mais de onde ser recuperada)
            const old = fs.readdirSync(hist).filter((f) => /^edit-\d+\.json$/.test(f)).sort();
            const last = old.length ? +old[old.length - 1].replace(/\D/g, "") : 0;
            if (fs.existsSync(file) && Date.now() - last > 60000) fs.copyFileSync(file, path.join(hist, `edit-${Date.now()}.json`));
            for (const f of old.slice(0, Math.max(0, old.length - 60))) fs.unlinkSync(path.join(hist, f));
            fs.writeFileSync(file, txt);
            return send(200, { ok: true, mtime: fs.statSync(file).mtimeMs });
          }
          const doc = JSON.parse(fs.readFileSync(file, "utf-8"));
          const spec = JSON.parse(fs.readFileSync(path.join(VIDEOS, slug, "segments.json"), "utf-8"));
          return send(200, { doc, spec, mtime: fs.statSync(file).mtimeMs });
        }
        if (what === "mtime" && slug) return send(200, { mtime: fs.statSync(path.join(VIDEOS, slug, "edit.json")).mtimeMs });
        if (what === "peaks" && slug) return send(200, voicePeaks(slug));
        if (what === "proxy" && slug) {
          // versão leve só para o editor (o render usa o master): 720 px, keyframe a cada 0,5 s
          const src = path.join(PUBLIC, "videos", slug, "ig1080.mp4");
          const dst = path.join(PUBLIC, "videos", slug, "proxy720.mp4");
          // formato só voz (HL3): o vídeo é tela preta e a prévia não desenha ele — não espera proxy nenhum (refazer o
          // proxy de 49 min a cada emenda na fonte deixava o Estúdio minutos em "carregando o vídeo")
          try {
            const ed = JSON.parse(fs.readFileSync(path.join(VIDEOS, slug, "edit.json"), "utf-8"));
            if (ed.format === "wide") return send(200, { src: `videos/${slug}/ig1080.mp4` });
          } catch {
            /* sem edit.json: segue o caminho normal */
          }
          if (!fs.existsSync(dst) || fs.statSync(dst).mtimeMs < fs.statSync(src).mtimeMs) {
            const tmp = dst.replace(/\.mp4$/, `.tmp-${process.pid}.mp4`);
            const r = await once(`proxy:${slug}`, () =>
              run("ffmpeg", ["-v", "error", "-y", "-i", src, "-vf", "scale=720:-2", "-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-g", "15", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", tmp]).then((x) => {
                if (x.status === 0) fs.renameSync(tmp, dst);
                return x;
              }),
            );
            if (r.status !== 0 && !fs.existsSync(dst)) return send(500, { error: r.stderr.slice(-400) });
          }
          return send(200, { src: `videos/${slug}/proxy720.mp4` });
        }
        if (what === "editproxy" && slug) {
          // PRÉVIA CONTÍNUA: um arquivo só, já com os cortes e a voz tratada. O Player toca ele do
          // começo ao fim sem trocar de mídia nos cortes (a troca de 18 arquivos fazia o player
          // voltar e "repetir" trechos). O render final continua take a take no master.
          const vd = path.join(VIDEOS, slug);
          const spec = JSON.parse(fs.readFileSync(path.join(vd, "segments.json"), "utf-8"));
          const voice = url.searchParams.get("voice") || "";
          if (voice && (!/^[\w./-]+$/.test(voice) || voice.includes(".."))) return send(400, { error: "voz inválida" });
          const proxy = path.join(PUBLIC, "videos", slug, "proxy720.mp4");
          if (!fs.existsSync(proxy)) return send(409, { error: "sem proxy720 ainda" });
          const fps = spec.fps ?? 30;
          const key = JSON.stringify({ s: spec.segments.map((x: { a: number; frames?: number; b: number }) => [x.a, x.frames ?? Math.round((x.b - x.a) * fps)]), o: spec.outro, voice, v: 1 });
          const hash = createHash("md5").update(key).digest("hex").slice(0, 10);
          const rel = `videos/${slug}/editproxy-${hash}.mp4`;
          const dst = path.join(PUBLIC, rel);
          if (!fs.existsSync(dst)) {
            const segs = spec.segments as { a: number; b: number; frames?: number }[];
            const aIn = voice ? "1:a" : "0:a";
            const parts: string[] = [];
            segs.forEach((g, i) => {
              const d = (g.frames ?? Math.round((g.b - g.a) * fps)) / fps;
              parts.push(`[0:v]trim=start=${g.a}:duration=${d},setpts=PTS-STARTPTS[v${i}]`);
              parts.push(`[${aIn}]atrim=start=${g.a}:duration=${d},asetpts=PTS-STARTPTS,afade=t=in:d=0.03,afade=t=out:st=${Math.max(0, d - 0.066).toFixed(3)}:d=0.066[a${i}]`);
            });
            const cat = segs.map((_, i) => `[v${i}][a${i}]`).join("") + `concat=n=${segs.length}:v=1:a=1[vc][ac]`;
            const tail = `[vc]tpad=stop_mode=clone:stop_duration=${spec.outro}[vo];[ac]apad=pad_dur=${spec.outro}[ao]`;
            // UMA montagem por prévia: dois pedidos juntos (duas abas, ou ajustes seguidos) gravavam o mesmo .tmp
            // ao mesmo tempo e o arquivo saía corrompido (vídeo cinza, "PIPELINE_ERROR_DECODE")
            await once(`editproxy:${rel}`, async () => {
            if (fs.existsSync(dst)) return;
            const tmp = `${dst}.${process.pid}-${Date.now()}.tmp.mp4`;
            await new Promise<void>((ok, bad) => {
              const pr = spawn("ffmpeg", ["-v", "error", "-y", "-i", proxy, ...(voice ? ["-i", path.join(PUBLIC, voice)] : []), "-filter_complex", [...parts, cat, tail].join(";"), "-map", "[vo]", "-map", "[ao]", "-r", String(fps), "-c:v", "libx264", "-preset", "veryfast", "-crf", "22", "-g", "15", "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", tmp]);
              let err = "";
              pr.stderr.on("data", (x: Buffer) => (err += x.toString()));
              pr.on("close", (c) => (c === 0 ? ok() : bad(new Error(err.slice(-600)))));
            });
            fs.renameSync(tmp, dst);
            });
            // guarda as 4 prévias mais recentes (outra aba aberta pode estar tocando uma anterior;
            // apagar na hora fazia o vídeo sumir nela)
            const vdir = path.join(PUBLIC, "videos", slug);
            const olds = fs
              .readdirSync(vdir)
              .filter((f) => f.startsWith("editproxy-") && f.endsWith(".mp4"))
              .map((f) => ({ f, t: fs.statSync(path.join(vdir, f)).mtimeMs }))
              .sort((a, b) => b.t - a.t);
            for (const o of olds.slice(4)) fs.rmSync(path.join(vdir, o.f), { force: true });
          }
          return send(200, { src: rel });
        }
        if (what === "wave") {
          const rel = url.searchParams.get("src") || "";
          if (!/^[\w./-]+$/.test(rel) || rel.includes("..")) return send(400, { error: "caminho inválido" });
          return send(200, filePeaks(rel));
        }
        if (what === "voicewav" && slug) {
          // prévia instantânea (formato só voz): cópia WAV da voz — o navegador pula para qualquer ponto na hora
          // (o AAC/m4a demora para buscar e a prévia engasgava na troca de take)
          const rel = url.searchParams.get("src") || `videos/${slug}/ig1080.mp4`;
          if (!/^[\w./-]+$/.test(rel) || rel.includes("..")) return send(400, { error: "caminho inválido" });
          const src = path.join(PUBLIC, rel);
          if (!fs.existsSync(src)) return send(404, { error: "sem voz" });
          // voz tratada mais velha que a gravação (take emendado na fonte): refaz em segundo plano com os mesmos ajustes
          let rebuilding = false;
          if (/\/voice-[0-9a-f]+\.m4a$/.test(rel)) {
            try {
              const ed = JSON.parse(fs.readFileSync(path.join(VIDEOS, slug, "edit.json"), "utf-8"));
              if (ed.voice?.src === rel && ed.voice?.fx) {
                const jb = jobs[startVoiceJob(slug, ed.voice.fx)];
                if (jb && !jb.done) rebuilding = true;
              }
            } catch {
              /* segue com a voz que existe */
            }
          }
          // na TAXA DO FONE que a página informa (44,1 ou 48 kHz; ver RATES em estudio/voiceEngine.ts): o navegador toca
          // sem converter nada. A conversão 48 → 44,1 é feita aqui com soxr (alta qualidade); a do Chrome na saída deixava
          // um chiado fantasma na voz (08/10/2026)
          const rate = url.searchParams.get("rate") === "44100" ? 44100 : 48000;
          const outRel = rel.replace(/\.[^.]+$/, "") + (rate === 44100 ? ".preview44.wav" : ".preview48.wav");
          const out = path.join(PUBLIC, outRel);
          if (!fs.existsSync(out) || fs.statSync(out).mtimeMs < fs.statSync(src).mtimeMs) {
            const r = await once(`voicewav:${outRel}`, () =>
              run("ffmpeg", ["-v", "error", "-y", "-i", src, "-vn", "-ac", "2", "-af", `aresample=${rate}:resampler=soxr:precision=28:dither_method=triangular`, "-ar", String(rate), "-c:a", "pcm_s16le", out + ".tmp.wav"], { cwd: ROOT }).then((x) => {
                if (x.status === 0) fs.renameSync(out + ".tmp.wav", out);
                return x;
              }),
            );
            if (r.status !== 0) return send(500, { error: (r.stderr || "").slice(-400) });
          }
          // rebuilding: a página toca esta (velha) e pergunta de novo até a nova ficar pronta
          return send(200, { src: outRel, rebuilding, v: Math.round(fs.statSync(out).mtimeMs) });
        }
        if (what === "pendvistas" && slug) {
          // painel Pendências: os itens que o Paulo já tirou da lista (o X) — salvo em arquivo, não no navegador
          // (o localStorage do Estúdio não persistia e os itens voltavam). GET devolve a lista; POST grava.
          const f = path.join(ROOT, "out", slug, "pendencias_vistas.json");
          if (req.method === "POST") {
            const ids = (JSON.parse((await body()) || "{}") as { ids?: string[] }).ids ?? [];
            fs.mkdirSync(path.dirname(f), { recursive: true });
            fs.writeFileSync(f + ".tmp", JSON.stringify({ ids: [...new Set(ids)] }, null, 1));
            fs.renameSync(f + ".tmp", f);
            return send(200, { ok: true, n: ids.length });
          }
          return send(200, fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf-8")) : { ids: [] });
        }
        if (what === "focus" && slug) {
          // última edição do Claude (tools/focus.py): o Estúdio enquadra esse trecho
          const f = path.join(ROOT, "out", slug, "focus.json");
          return send(200, fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf-8")) : {});
        }
        if (what === "diaglog" && slug && req.method === "POST") {
          // gravador de diagnóstico da prévia (estudio/diag.ts, Ctrl+Shift+D)
          const dir = path.join(ROOT, "out", slug);
          fs.mkdirSync(dir, { recursive: true });
          const file = path.join(dir, `diag-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
          fs.writeFileSync(file, (await body()) || "{}");
          return send(200, { file });
        }
        if (what === "voicecont" && slug) {
          // voz contínua da prévia (ver buildVoiceCont); refeita quando os takes ou a voz mudam. Os takes vêm do ESTÚDIO
          // (POST), não do disco: logo depois de um corte o segments.json ainda não foi salvo e a faixa saía velha.
          const rel = url.searchParams.get("src") || "";
          const posted = req.method === "POST" ? (JSON.parse((await body()) || "{}") as { segments?: { a: number; frames: number }[]; fps?: number }) : {};
          if (!/^[\w./-]+\.wav$/.test(rel) || rel.includes("..")) return send(400, { error: "caminho inválido" });
          const src = path.join(PUBLIC, rel);
          const segFile = path.join(VIDEOS, slug, "segments.json");
          if (!fs.existsSync(src) || (!posted.segments && !fs.existsSync(segFile))) return send(404, { error: "sem voz ou sem takes" });
          const spec = posted.segments ? { fps: posted.fps, segments: posted.segments } : (JSON.parse(fs.readFileSync(segFile, "utf-8")) as { fps?: number; segments: { a: number; frames: number }[] });
          const fps = spec.fps ?? 30;
          const segs = spec.segments.map((g) => ({ a: g.a, frames: g.frames }));
          const key = createHash("sha1").update(JSON.stringify({ rel, m: fs.statSync(src).mtimeMs, fps, segs })).digest("hex").slice(0, 10);
          const outRel = `videos/${slug}/voicecont-${key}.wav`;
          const out = path.join(PUBLIC, outRel);
          if (!fs.existsSync(out)) {
            try {
              await once(out, () => buildVoiceCont(src, segs, fps, out));
            } catch (e) {
              return send(500, { error: String((e as Error).message ?? e) });
            }
            // guarda as 3 mais recentes (apagar a anterior na hora deixava o player apontando para um arquivo que sumiu)
            const dir = path.join(PUBLIC, "videos", slug);
            const old = fs.readdirSync(dir).filter((f) => /^voicecont-[0-9a-f]+\.wav$/.test(f)).map((f) => ({ f, m: fs.statSync(path.join(dir, f)).mtimeMs })).sort((a, b) => b.m - a.m);
            for (const o of old.slice(3)) fs.rmSync(path.join(dir, o.f), { force: true });
          }
          return send(200, { src: outRel });
        }
        if (what === "sfxdur") {
          // duração real dos arquivos (o Estúdio preenche `dur` dos sons que vieram sem)
          const list = (url.searchParams.get("src") || "").split("|").filter((x) => /^[\w./-]+$/.test(x) && !x.includes(".."));
          const out: Record<string, number> = {};
          for (const r of list) out[r] = fs.existsSync(path.join(PUBLIC, r)) ? mediaDuration(path.join(PUBLIC, r)) : 0;
          return send(200, out);
        }
        if (what === "sfxfx" && req.method === "POST") {
          // efeitos por som (painel Som > Efeitos): grave/agudo, reverb de convolução (salas em sfx/_ir), normalizar.
          // Gera sfx/_fx/<nome>-<hash>.wav uma vez; o edit.json guarda `fx` e `fxSrc` (o original fica intacto).
          const o = JSON.parse((await body()) || "{}") as { src: string; fx: { reverb?: number; room?: number; normalize?: boolean; lowcut?: number; highcut?: number; reverse?: boolean; eqLow?: number; eqMid?: number; eqHigh?: number; speed?: number; keepPitch?: boolean } };
          const rel = o.src || "";
          if (!/^[\w./-]+$/.test(rel) || rel.includes("..")) return send(400, { error: "caminho inválido" });
          const fx = o.fx || {};
          const src = path.join(PUBLIC, rel);
          if (!fs.existsSync(src)) return send(404, { error: "arquivo não existe" });
          const rev = Math.max(0, Math.min(1, (fx.reverb ?? 0) / 100));
          const room = [1, 2, 4, 8].reduce((a, b) => (Math.abs(b - (fx.room ?? 2)) < Math.abs(a - (fx.room ?? 2)) ? b : a), 2);
          const eq: string[] = [];
          if ((fx.lowcut ?? 0) > 20) eq.push(`highpass=f=${Math.round(fx.lowcut!)}`);
          if ((fx.highcut ?? 0) > 500) eq.push(`lowpass=f=${Math.round(fx.highcut!)}`);
          // equalizador de 3 faixas (dB)
          if (fx.eqLow) eq.push(`bass=g=${Math.max(-12, Math.min(12, fx.eqLow))}:f=120:w=0.7`);
          if (fx.eqMid) eq.push(`equalizer=f=1000:t=q:w=0.9:g=${Math.max(-12, Math.min(12, fx.eqMid))}`);
          if (fx.eqHigh) eq.push(`treble=g=${Math.max(-12, Math.min(12, fx.eqHigh))}:f=8000:w=0.7`);
          // reverter: o som toca ao contrário ANTES dos outros efeitos (a reverb continua caindo para frente)
          if (fx.reverse) eq.unshift("areverse");
          // velocidade: atempo mantém o tom (encadeado, cada um entre 0,5 e 2); sem manter o tom = fita (asetrate)
          const sp = Math.max(0.25, Math.min(4, fx.speed ?? 1));
          if (Math.abs(sp - 1) > 0.001) {
            const sf: string[] = [];
            if (fx.keepPitch !== false) {
              let r = sp;
              while (r > 2) (sf.push("atempo=2"), (r /= 2));
              while (r < 0.5) (sf.push("atempo=0.5"), (r /= 0.5));
              sf.push(`atempo=${r.toFixed(4)}`);
            } else sf.push(`asetrate=${Math.round(48000 * sp)}`, "aresample=48000");
            eq.splice(fx.reverse ? 1 : 0, 0, ...sf);
          }
          const none = rev === 0 && !eq.length && !fx.normalize;
          if (none) return send(200, { src: rel, fxSrc: null, dur: mediaDuration(src) });
          const key = JSON.stringify({ rel, rev, room, eq, n: !!fx.normalize, v: 3 });
          const hash = createHash("md5").update(key).digest("hex").slice(0, 10);
          const name = path.basename(rel).replace(/\.[^.]+$/, "");
          const outRel = `sfx/_fx/${name}-${hash}.wav`;
          const out = path.join(PUBLIC, outRel);
          if (!fs.existsSync(out)) {
            fs.mkdirSync(path.dirname(out), { recursive: true });
            const irFile = path.join(PUBLIC, "sfx", "_ir", `sala_${room}s.wav`);
            const irGain = parseFloat(fs.readFileSync(path.join(PUBLIC, "sfx", "_ir", `sala_${room}s.gain`), "utf-8"));
            const pre = ["aresample=48000", "aformat=channel_layouts=stereo", ...eq].join(",");
            const post = fx.normalize ? "loudnorm=I=-20:TP=-3:LRA=15" : "alimiter=limit=0.95:level=false";
            const graph = rev > 0
              ? `[0:a]${pre},apad=pad_dur=${room},asplit[d][w];[w][1:a]afir=irnorm=-1,volume=${(irGain * rev * 1.4).toFixed(4)}[wv];[d]volume=${(1 - rev * 0.35).toFixed(3)}[dv];[dv][wv]amix=inputs=2:normalize=0,${post}[o]`
              : `[0:a]${pre},${post}[o]`;
            const args = ["-v", "error", "-y", "-i", src, ...(rev > 0 ? ["-i", irFile] : []), "-filter_complex", graph, "-map", "[o]", "-ar", "48000", out];
            const r = await run("ffmpeg", args, { cwd: ROOT });
            if (r.status !== 0) return send(500, { error: (r.stderr || "").slice(-600) });
          }
          return send(200, { src: rel, fxSrc: outRel, dur: mediaDuration(out) });
        }
        if (what === "voice" && slug && req.method === "POST") {
          const fx = JSON.parse((await body()) || "{}") as VoiceFx;
          return send(200, { job: startVoiceJob(slug, fx) });
        }
        if (what === "pauses" && slug) {
          // detector de respiros é pesado (vários minutos em vídeo longo). Antes rodava um a cada corte e eles
          // se empilhavam, travando o servidor ("ajustando" infinito). Agora: resultado guardado por versão dos
          // takes, um processo por vídeo; se os takes mudam, o anterior é encerrado.
          const segFile = path.join(VIDEOS, slug, "segments.json");
          const key = "v5:" + (fs.existsSync(segFile) ? String(fs.statSync(segFile).mtimeMs) : "0"); // v3: pausas com "where" (entre/meio) e "cut" (o botão ainda corta)
          const P = ((globalThis as unknown as { __pauses?: Record<string, { key: string; done?: unknown; wait?: Promise<unknown>; proc?: ReturnType<typeof spawn> }> }).__pauses ??= {});
          const cur = P[slug];
          if (cur && cur.key === key && cur.done !== undefined) return send(200, cur.done);
          if (!cur || cur.key !== key) {
            try {
              cur?.proc?.kill();
            } catch {
              /* já terminou */
            }
            const job: { key: string; done?: unknown; wait?: Promise<unknown>; proc?: ReturnType<typeof spawn> } = { key };
            job.wait = new Promise((ok) => {
              const pr = spawn("python", [path.join(ROOT, "tools", "pauses.py"), slug, "--json-edit"], { cwd: ROOT, env: { ...process.env, PYTHONIOENCODING: "utf-8" } });
              job.proc = pr;
              let out = "";
              pr.stdout.on("data", (b: Buffer) => (out += b.toString()));
              pr.on("close", (code) => {
                try {
                  job.done = code === 0 ? JSON.parse(out) : [];
                } catch {
                  job.done = [];
                }
                ok(job.done);
              });
            });
            P[slug] = job;
          }
          const res = await P[slug].wait;
          return send(200, P[slug].key === key ? res : []);
        }
        if (what === "pauses-ignore" && slug) {
          // pausas que ele mandou desconsiderar: [[a, b], ...] em segundos da GRAVAÇÃO (valem depois de cortes)
          const f = path.join(VIDEOS, slug, "pauses-ignore.json");
          if (req.method === "POST") {
            const o = JSON.parse((await body()) || "{}") as { set?: number[][] };
            const list = (Array.isArray(o.set) ? o.set : []).filter((x) => Array.isArray(x) && x.length === 2 && x.every((v) => typeof v === "number"));
            if (list.length) fs.writeFileSync(f, JSON.stringify(list));
            else fs.rmSync(f, { force: true });
            return send(200, list);
          }
          return send(200, fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf-8")) : []);
        }
        if (what === "tighten" && slug && req.method === "GET") {
          // andamento do "Cortar respiros" (a página consulta enquanto roda e ao recarregar)
          const T = ((globalThis as unknown as { __tighten?: Record<string, unknown> }).__tighten ??= {});
          return send(200, T[slug] ?? { idle: true });
        }
        if (what === "tighten" && slug && req.method === "POST") {
          // corta respiros/pausas: takes de partida (segments.base.json) -> novos takes -> reposiciona o edit.json.
          // Roda como tarefa: responde na hora e a página acompanha as etapas pelo GET acima.
          type TJob = { done: boolean; ok?: boolean; step: number; steps: number; phase: string; log?: string; error?: string; started: number; ended?: number };
          const T = ((globalThis as unknown as { __tighten?: Record<string, TJob> }).__tighten ??= {});
          if (T[slug] && !T[slug].done) return send(200, T[slug]);
          const o = JSON.parse((await body()) || "{}");
          const vd = path.join(VIDEOS, slug);
          const wide = (JSON.parse(fs.readFileSync(path.join(vd, "edit.json"), "utf-8")) as { format?: string }).format === "wide";
          const job: TJob = { done: false, step: 1, steps: wide ? 2 : 3, phase: "calculando os cortes", started: Date.now() };
          T[slug] = job;
          (async () => {
            const hist = path.join(ROOT, "out", slug, "edit-history");
            fs.mkdirSync(hist, { recursive: true });
            const stamp = Date.now();
            const before = path.join(hist, `segments-${stamp}.json`);
            fs.copyFileSync(path.join(vd, "segments.json"), before);
            fs.copyFileSync(path.join(vd, "edit.json"), path.join(hist, `edit-${stamp}.json`));
            const py = async (args: string[]) => {
              const r = await run("python", args, { cwd: ROOT, env: { ...process.env, PYTHONIOENCODING: "utf-8" } });
              if (r.status !== 0) throw new Error((r.stderr || r.stdout || "").slice(-800));
              return r.stdout;
            };
            const num = (k: string, d: number) => String(typeof o[k] === "number" ? o[k] : d);
            // grupos desmarcados no Estúdio ficam sem cortar (e voltam, se tinham sido cortados antes)
            const off = [o.between === false && "--no-between", o.mid === false && "--no-mid", o.respiro === false && "--no-respiro", o.silencio === false && "--no-silencio"].filter(Boolean) as string[];
            const out = await py([path.join(ROOT, "tools", "tighten.py"), slug, "--keep", num("keep", 0.1), "--keep-mid", num("keepMid", 0.25), "--min-mid", num("minMid", 0.35), ...off]);
            const segKey = (f: string) => JSON.stringify((JSON.parse(fs.readFileSync(f, "utf-8")) as { segments: { a: number; b: number }[] }).segments.map((g) => [g.a, g.b]));
            const same = segKey(before) === segKey(path.join(vd, "segments.json"));
            // pilha do "Desfazer último corte": takes de antes de cada corte que mudou alguma coisa
            const undoFile = path.join(ROOT, "out", slug, "tighten-undo.json");
            if (!same) {
              const stack = fs.existsSync(undoFile) ? (JSON.parse(fs.readFileSync(undoFile, "utf-8")) as string[]) : [];
              fs.writeFileSync(undoFile, JSON.stringify([...stack, before]));
            }
            Object.assign(job, { step: 2, phase: "reposicionando cenas, sons e legenda" });
            await py([path.join(ROOT, "tools", "retime.py"), slug, before, "--map-words"]);
            // formato wide (só voz) não tem troca de enquadramento: o snaps.py abria ~300 quadros do vídeo à toa
            if (!wide) {
              Object.assign(job, { step: 3, phase: "ajustando o zoom dos cortes" });
              await py([path.join(ROOT, "tools", "snaps.py"), slug]);
            }
            fs.rmSync(path.join(ROOT, "out", slug, "peaks.json"), { force: true });
            const head = out.split(String.fromCharCode(10))[0].replace(/ \(base:.*\)/, "");
            Object.assign(job, { done: true, ok: true, phase: "pronto", log: same ? `Nada novo para cortar: já estava cortado com esses ajustes (${head}).` : `Cortado: ${head}.` });
          })()
            .catch((e) => Object.assign(job, { done: true, ok: false, phase: "erro", error: String((e as Error).message ?? e) }))
            .finally(() => (job.ended = Date.now()));
          return send(200, job);
        }
        if (what === "untighten" && slug) {
          // desfaz o último "Cortar respiros": volta os takes de antes e reposiciona a edição ATUAL (o que foi
          // mexido depois do corte continua, só muda de lugar junto com a fala)
          const undoFile = path.join(ROOT, "out", slug, "tighten-undo.json");
          const stack = fs.existsSync(undoFile) ? (JSON.parse(fs.readFileSync(undoFile, "utf-8")) as string[]).filter((f) => fs.existsSync(f)) : [];
          if (req.method !== "POST") return send(200, { depth: stack.length });
          const prev = stack.pop();
          if (!prev) return send(400, { error: "não há corte de respiros para desfazer" });
          const vd = path.join(VIDEOS, slug);
          const hist = path.join(ROOT, "out", slug, "edit-history");
          const stamp = Date.now();
          const cur = path.join(hist, `segments-${stamp}.json`);
          fs.copyFileSync(path.join(vd, "segments.json"), cur);
          fs.copyFileSync(path.join(vd, "edit.json"), path.join(hist, `edit-${stamp}.json`));
          fs.copyFileSync(prev, path.join(vd, "segments.json"));
          const r = await run("python", [path.join(ROOT, "tools", "retime.py"), slug, cur, "--map-words"], { cwd: ROOT, env: { ...process.env, PYTHONIOENCODING: "utf-8" } });
          if (r.status !== 0) {
            fs.copyFileSync(cur, path.join(vd, "segments.json"));
            return send(400, { error: (r.stderr || r.stdout || "").trim().slice(-400) });
          }
          fs.writeFileSync(undoFile, JSON.stringify(stack));
          fs.rmSync(path.join(ROOT, "out", slug, "peaks.json"), { force: true });
          return send(200, { ok: true, depth: stack.length, log: "Corte desfeito: respiros de volta." });
        }
        if ((what === "cutrange" || what === "uncut" || what === "recut") && slug && req.method === "POST") {
          // corta um trecho do vídeo com ripple (apagar palavras no texto, Shift+Del no I/O) ou desfaz o último
          const o = JSON.parse((await body()) || "{}");
          // recut (05/11): refaz o último corte desfeito (pilha out/<slug>/cuts-redo)
          const args = what === "uncut" ? [slug, "--undo"] : what === "recut" ? [slug, "--redo"] : [slug, String(o.a), String(o.b)];
          const r = await run("python", [path.join(ROOT, "tools", "cutrange.py"), ...args], { cwd: ROOT, env: { ...process.env, PYTHONIOENCODING: "utf-8" } });
          if (r.status !== 0) return send(400, { error: (r.stderr || r.stdout || "").trim().slice(-400) });
          fs.rmSync(path.join(ROOT, "out", slug, "peaks.json"), { force: true });
          const cutsDir = path.join(ROOT, "out", slug, "cuts");
          const depth = fs.existsSync(cutsDir) ? fs.readdirSync(cutsDir).length : 0;
          const redoDir = path.join(ROOT, "out", slug, "cuts-redo");
          return send(200, { ok: true, log: (r.stdout || "").trim(), undo: depth, redo: fs.existsSync(redoDir) ? fs.readdirSync(redoDir).length : 0 });
        }
        if (what === "splitclip" && slug && req.method === "POST") {
          // divide o clipe (take) que está no tempo t da edição em dois. Não muda nada que se ouve ou vê:
          // só cria a emenda, para depois escolher um pedaço e tirá-lo (Delete = cutrange com ripple).
          const { t } = JSON.parse((await body()) || "{}") as { t: number };
          const file = path.join(VIDEOS, slug, "segments.json");
          const sp = JSON.parse(fs.readFileSync(file, "utf-8")) as { fps?: number; segments: { a: number; b: number; frames?: number; editStart?: number; note?: string }[] };
          const fpsS = sp.fps ?? 30;
          let acc = 0;
          for (let k = 0; k < sp.segments.length; k++) {
            const g = sp.segments[k];
            const fr = g.frames ?? Math.round((g.b - g.a) * fpsS);
            const f0 = Math.round(t * fpsS) - acc;
            if (f0 > 0 && f0 < fr) {
              if (f0 < 2 || fr - f0 < 2) return send(400, { error: "perto demais da emenda" });
              const r = Math.round((g.a + f0 / fpsS) * 1000) / 1000;
              const g1 = { ...g, b: r, frames: f0, editStart: Math.round((acc / fpsS) * 1000) / 1000 };
              const g2 = { ...g, a: r, frames: fr - f0, editStart: Math.round(((acc + f0) / fpsS) * 1000) / 1000 };
              const hist = path.join(ROOT, "out", slug, "edit-history");
              fs.mkdirSync(hist, { recursive: true });
              fs.copyFileSync(file, path.join(hist, `segments-split-${Date.now()}.json`));
              sp.segments.splice(k, 1, g1, g2);
              fs.writeFileSync(file, JSON.stringify(sp, null, 2));
              return send(200, { ok: true, i: k });
            }
            acc += fr;
          }
          return send(400, { error: "não achei clipe nesse ponto" });
        }
        if (what === "trimclip" && slug && req.method === "POST") {
          // puxa a borda de um clipe da gravação (trilha Vídeo): estica/encolhe e empurra o que vem depois
          const o = JSON.parse((await body()) || "{}");
          const args = [slug, String(o.i), o.side === "a" ? "a" : "b", String(o.delta), ...(o.solo ? ["--solo"] : [])];
          const r = await run("python", [path.join(ROOT, "tools", "trimclip.py"), ...args], { cwd: ROOT, env: { ...process.env, PYTHONIOENCODING: "utf-8" } });
          if (r.status !== 0) return send(400, { error: (r.stderr || r.stdout || "").trim().slice(-400) });
          fs.rmSync(path.join(ROOT, "out", slug, "peaks.json"), { force: true });
          const cutsDir = path.join(ROOT, "out", slug, "cuts");
          const depth = fs.existsSync(cutsDir) ? fs.readdirSync(cutsDir).length : 0;
          return send(200, { ok: true, log: (r.stdout || "").trim(), undo: depth, redo: 0 });
        }
        if (what === "srcpeaks" && slug) {
          // onda da GRAVAÇÃO inteira (100 valores/s): a trilha Vídeo mostra o que existe além da borda de cada clipe
          return send(200, filePeaks(`videos/${slug}/ig1080.mp4`));
        }
        if (what === "cuts" && slug) {
          const cutsDir = path.join(ROOT, "out", slug, "cuts");
          const redoDir = path.join(ROOT, "out", slug, "cuts-redo");
          return send(200, { undo: fs.existsSync(cutsDir) ? fs.readdirSync(cutsDir).length : 0, redo: fs.existsSync(redoDir) ? fs.readdirSync(redoDir).length : 0 });
        }
        if (what === "versions" && slug) {
          // versões = cópias automáticas do edit.json (uma por minuto, as 60 últimas) em out/<slug>/edit-history
          const hist = path.join(ROOT, "out", slug, "edit-history");
          const file = path.join(VIDEOS, slug, "edit.json");
          if (req.method === "POST") {
            const o = JSON.parse((await body()) || "{}");
            const src = path.join(hist, path.basename(String(o.name || "")));
            if (!/^edit-\d+\.json$/.test(path.basename(src)) || !fs.existsSync(src)) return send(404, { error: "versão não encontrada" });
            // antes de voltar, guarda a atual (dá para desfazer a volta)
            fs.mkdirSync(hist, { recursive: true });
            fs.copyFileSync(file, path.join(hist, `edit-${Date.now()}.json`));
            fs.copyFileSync(src, file);
            return send(200, { ok: true, mtime: fs.statSync(file).mtimeMs });
          }
          const list = fs.existsSync(hist)
            ? fs
                .readdirSync(hist)
                .filter((f) => /^edit-\d+\.json$/.test(f))
                .map((f) => {
                  let scenes = 0;
                  let duration = 0;
                  try {
                    const d = JSON.parse(fs.readFileSync(path.join(hist, f), "utf-8"));
                    scenes = d.scenes?.length ?? 0;
                    duration = d.duration ?? 0;
                  } catch {
                    /* ignora */
                  }
                  return { name: f, t: +f.replace(/\D/g, ""), scenes, duration };
                })
                .sort((a, b) => b.t - a.t)
            : [];
          return send(200, list);
        }
        if (what === "voicejob" && slug) return send(200, jobs[slug] ?? { done: true, ok: false, error: "não achei", pct: 0, step: "" });
        if (what === "sfx") {
          const dir = path.join(PUBLIC, "sfx");
          const list = fs
            .readdirSync(dir)
            .filter((f) => f.endsWith(".wav"))
            .sort()
            .map((f) => ({ src: `sfx/${f}`, name: f.replace(/\.wav$/, ""), dur: Math.round(wavDuration(path.join(dir, f)) * 1000) / 1000 }));
          return send(200, list);
        }
        // BIBLIOTECA DE MÚSICAS (Mixkit, licença livre; baixada por scripts/fetch_music.py em sfx-lib/mixkit-music).
        // Fica FORA do public/ (são ~GB e o render copia o public inteiro); só a música escolhida é copiada
        // para public/music, já normalizada em -26 LUFS (no vídeo entra com vol 0.25, bem abaixo da voz).
        if (what === "music") {
          const idx = path.join(MUSIC_LIB, "index.json");
          if (!fs.existsSync(idx)) return send(200, []);
          const d = JSON.parse(fs.readFileSync(idx, "utf-8")) as Record<string, { title: string; author: string; tags: string[]; rank: number; dur: number }>;
          const list = Object.entries(d)
            .filter(([id]) => fs.existsSync(path.join(MUSIC_LIB, `${id}.mp3`)))
            .map(([id, m]) => ({ id, ...m }))
            .sort((a, b) => a.rank - b.rank);
          return send(200, list);
        }
        if (what === "musicfile") {
          const id = url.searchParams.get("id") || "";
          const abs = path.join(MUSIC_LIB, `${id}.mp3`);
          if (!/^\d+$/.test(id) || !fs.existsSync(abs)) return send(404, { error: "não achei" });
          const size = fs.statSync(abs).size;
          res.setHeader("Content-Type", "audio/mpeg");
          res.setHeader("Accept-Ranges", "bytes");
          const range = /bytes=(\d+)-(\d*)/.exec(req.headers.range || "");
          if (range) {
            const a = +range[1];
            const b = range[2] ? +range[2] : size - 1;
            res.statusCode = 206;
            res.setHeader("Content-Range", `bytes ${a}-${b}/${size}`);
            res.setHeader("Content-Length", String(b - a + 1));
            return fs.createReadStream(abs, { start: a, end: b }).pipe(res);
          }
          res.setHeader("Content-Length", String(size));
          return fs.createReadStream(abs).pipe(res);
        }
        if (what === "musicadd" && req.method === "POST") {
          const { id } = JSON.parse((await body()) || "{}");
          const abs = path.join(MUSIC_LIB, `${id}.mp3`);
          if (!/^\d+$/.test(String(id)) || !fs.existsSync(abs)) return send(404, { error: "não achei" });
          const d = JSON.parse(fs.readFileSync(path.join(MUSIC_LIB, "index.json"), "utf-8"));
          const m = d[id] ?? { title: id, dur: 0 };
          const name = String(m.title).toLowerCase().normalize("NFD").replace(/[^\w]+/g, "-").replace(/^-|-$/g, "");
          const rel = `music/mixkit-${id}-${name}.mp3`;
          const out = path.join(PUBLIC, rel);
          if (!fs.existsSync(out)) {
            fs.mkdirSync(path.dirname(out), { recursive: true });
            const r = await once(`music:${id}`, () => run("ffmpeg", ["-v", "error", "-y", "-i", abs, "-af", "loudnorm=I=-26:TP=-3:LRA=11", "-ar", "44100", "-b:a", "192k", out]));
            if (r.status !== 0) return send(500, { error: r.stderr.slice(-400) });
          }
          return send(200, { src: rel, title: m.title, dur: m.dur });
        }
        if (what === "render" && slug) {
          if (req.method === "POST") {
            const { comp, name, mode, res } = JSON.parse((await body()) || "{}");
            if (!comp || !SAFE.test(comp)) return send(400, { error: "composição inválida" });
            const cur = jobOf(slug);
            if (cur && !cur.done) return send(409, { error: cur.paused ? "já tem um render pausado: continue ou cancele" : "já está renderizando" });
            const st: RenderJob = (renders[slug] = { log: "", done: false, start: Date.now() });
            startRender(slug, st, { comp, name: String(name || "").slice(0, 120), mode: mode === "alta" ? "alta" : "baixa", res: res === "4k" ? "4k" : "1080" });
            return send(200, { started: true });
          }
          if (req.method === "PATCH") {
            // pausar = fechar tudo (os blocos prontos ficam no cache); continuar = abrir de novo, pulando os prontos
            const j = jobOf(slug);
            if (!j || j.done || !j.pid) return send(409, { error: "nenhum render em andamento" });
            const { pause } = JSON.parse((await body()) || "{}");
            let nProcs: number | undefined;
            if (pause && !j.paused) {
              if (!j.args) return send(409, { error: "render antigo (sem os parâmetros salvos): cancele e mande de novo" });
              j.paused = true;
              j.pausedAt = Date.now();
              saveJob(slug, j);
              if (pidAlive(j.pid)) {
                const r = pauseTool(j.pid, "kill", slug); // pega também os Chromes/ffmpeg soltos da árvore
                spawnSync("taskkill", ["/PID", String(j.pid), "/T", "/F"]);
                try {
                  nProcs = JSON.parse(r.stdout).n;
                } catch {
                  nProcs = undefined;
                }
              }
            } else if (!pause && j.paused) {
              if (!j.args) return send(409, { error: "render antigo (sem os parâmetros salvos): cancele e mande de novo" });
              // pausado = processo já fechado; não mexe no pid antigo (depois de reiniciar o PC o Windows o dá a outro programa)
              j.pausedMs = (j.pausedMs ?? 0) + (Date.now() - (j.pausedAt ?? Date.now()));
              j.paused = false;
              j.adopted = false;
              startRender(slug, j, j.args);
            }
            return send(200, { paused: !!j.paused, procs: nProcs });
          }
          if (req.method === "DELETE") {
            const j = jobOf(slug);
            if (j && !j.done && j.pid) {
              j.cancelled = true;
              if (!j.paused && pidAlive(j.pid)) {
                pauseTool(j.pid, "kill", slug); // pega também os Chromes soltos da árvore
                spawnSync("taskkill", ["/PID", String(j.pid), "/T", "/F"]);
              }
              finishJob(slug, j, 1);
            }
            return send(200, { ok: true });
          }
          const j = jobOf(slug);
          // último vídeo pronto na pasta out/<slug> (aparece mesmo se o render não foi pelo Estúdio ou o servidor reiniciou)
          const outDir = path.join(ROOT, "out", slug);
          const nr = newestRender(slug);
          const lf = nr ? { ...nr, stale: isStale(slug, nr.mtime) } : null;
          if (!j) return send(200, { idle: true, last: lf });
          return send(200, { done: j.done, ok: j.ok, file: j.file, error: j.error, cancelled: j.cancelled, paused: !!j.paused, last: lf, ...renderProgress(slug, j) });
        }
        if (what === "reveal") {
          // abre o Explorer com o arquivo selecionado (o download pelo navegador do app às vezes some)
          const rel = url.searchParams.get("p") || "";
          const abs = path.resolve(ROOT, rel);
          if (!abs.startsWith(path.join(ROOT, "out")) || !fs.existsSync(abs)) return send(404, { error: "não achei" });
          spawn("explorer.exe", [`/select,${abs}`], { detached: true, stdio: "ignore" }).unref();
          return send(200, { ok: true, path: abs });
        }
        if (what === "file") {
          const rel = url.searchParams.get("p") || "";
          const abs = path.resolve(ROOT, rel);
          if (!abs.startsWith(path.join(ROOT, "out")) || !fs.existsSync(abs)) return send(404, { error: "não achei" });
          res.setHeader("Content-Type", "video/mp4");
          res.setHeader("Content-Length", String(fs.statSync(abs).size));
          res.setHeader("Cache-Control", "no-store, max-age=0");
          res.setHeader("Last-Modified", new Date(fs.statSync(abs).mtimeMs).toUTCString());
          if (url.searchParams.get("download")) res.setHeader("Content-Disposition", `attachment; filename="${path.basename(abs).replace(/[^ -~]|"/g, "_")}"; filename*=UTF-8''${encodeURIComponent(path.basename(abs))}`);
          return fs.createReadStream(abs).pipe(res);
        }
        send(404, { error: "rota desconhecida" });
      } catch (e) {
        send(500, { error: String(e) });
      }
    });
  },
});

export default defineConfig({
  root: path.join(ROOT, "estudio"),
  publicDir: PUBLIC,
  // React de PRODUÇÃO também no Estúdio (medido 2026-09-28 com tools/profile_estudio.mjs): o React 19 de
  // desenvolvimento registra uma medição por componente por quadro ("logComponentRender", "createTask"). Com
  // centenas de cenas/sons/legendas o quadro passava de 33 ms, o relógio do Player andava a ~45% do tempo real
  // e o vídeo era puxado de volta ~1 s a cada salto: a fala "repetia". Sem o plugin do React (o Fast Refresh
  // exige o React de desenvolvimento): o JSX sai pelo esbuild e a página recarrega inteira quando o código muda.
  plugins: [api()],
  esbuild: { jsx: "automatic", jsxDev: false },
  define: { "process.env.NODE_ENV": JSON.stringify("production") },
  optimizeDeps: { esbuildOptions: { define: { "process.env.NODE_ENV": JSON.stringify("production") } } },
  server: { port: Number(process.env.PORT) || 5173, fs: { allow: [ROOT] } },
});
void react;
