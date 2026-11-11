// MOTOR DE EFEITOS DA PRÉVIA (formato só voz / HL3). Os efeitos tocavam por <Audio> do Remotion, que só corrige um
// som atrasado quando o atraso passa de ~0,45 s: na prévia os efeitos chegavam atrasados (de forma irregular) em
// relação à animação e à voz (que já toca pelo motor de voz, no tempo exato). Aqui cada efeito é decodificado e
// agendado no relógio da Web Audio API no instante exato, com volume, corte (trim), duração e fades. O player do
// Remotion manda no tempo: play/pausa/pulo reiniciam o agendamento. Só na prévia; o render continua igual.

export type SfxClip = { id: string; src: string; start: number; dur: number; trim: number; vol: number; fadeIn: number; fadeOut: number };

const AHEAD_S = 2.5; // quanto agendar à frente
const PREFETCH_S = 12; // quanto carregar à frente
const LAT_S = 0.08; // mesma folga do motor de voz (os dois começam juntos)
const CACHE_BYTES = 700e6; // áudio decodificado em memória (LRU)

export class SfxEngine {
  private ctx: AudioContext | null = null;
  private out: GainNode | null = null;
  private clips: SfxClip[] = [];
  private bufs = new Map<string, { p: Promise<AudioBuffer | null>; b: AudioBuffer | null; bytes: number }>();
  private cacheBytes = 0;
  private nodes = new Map<string, { src: AudioBufferSourceNode; g: GainNode }>();
  private done = new Set<string>(); // clipes já agendados nesta reprodução
  private playing = false;
  private gen = 0;
  private t0Edit = 0;
  private t0Ctx = 0;
  private timer: ReturnType<typeof setInterval> | null = null;
  private gain = 1;
  stats = { scheduled: 0, late: 0, missing: 0 };

  setClips(clips: SfxClip[]) {
    const key = (c: SfxClip) => `${c.id}|${c.src}|${c.start}|${c.dur}|${c.trim}|${c.vol}|${c.fadeIn}|${c.fadeOut}`;
    const same = clips.length === this.clips.length && clips.every((c, i) => key(c) === key(this.clips[i]));
    if (same) return;
    const was = this.playing ? this.now() : null;
    this.clips = [...clips].sort((a, b) => a.start - b.start);
    if (was !== null) this.play(was);
  }

  setGain(g: number) {
    this.gain = g;
    if (this.out && this.ctx) this.out.gain.setTargetAtTime(g, this.ctx.currentTime, 0.02);
  }

  unlock() {
    this.ensureCtx();
    if (this.ctx && this.ctx.state === "suspended") this.ctx.resume().catch(() => {});
  }

  isPlaying() {
    return this.playing;
  }

  now() {
    if (!this.ctx || !this.playing) return this.t0Edit;
    return this.t0Edit + (this.ctx.currentTime - this.t0Ctx);
  }

  // carrega (sem tocar) o que vem perto de `t`: pulos e o play começam com os buffers prontos
  prefetch(t: number) {
    for (const c of this.clips) {
      if (c.start > t + PREFETCH_S) break;
      if (c.start + c.dur >= t) this.load(c.src);
    }
  }

  play(editTime: number) {
    this.stop();
    this.ensureCtx();
    if (!this.ctx) return;
    if (this.ctx.state === "suspended") this.ctx.resume().catch(() => {});
    this.playing = true;
    this.t0Ctx = this.ctx.currentTime + LAT_S;
    this.t0Edit = editTime + LAT_S;
    const g = this.gen;
    this.tick(g);
    this.timer = setInterval(() => this.tick(g), 120);
  }

  stop() {
    this.gen++;
    this.playing = false;
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    for (const { src, g } of this.nodes.values()) {
      try {
        src.stop();
      } catch {
        /* já parou */
      }
      src.disconnect();
      g.disconnect();
    }
    this.nodes.clear();
    this.done.clear();
  }

  private ensureCtx() {
    if (this.ctx) return;
    try {
      this.ctx = new AudioContext({ latencyHint: "playback" });
      this.out = this.ctx.createGain();
      this.out.gain.value = this.gain;
      this.out.connect(this.ctx.destination);
    } catch {
      this.ctx = null;
    }
  }

  private load(src: string) {
    const hit = this.bufs.get(src);
    if (hit) {
      this.bufs.delete(src);
      this.bufs.set(src, hit); // mais recente no fim
      return hit.p;
    }
    this.ensureCtx();
    const ctx = this.ctx;
    const ent = { p: Promise.resolve<AudioBuffer | null>(null), b: null as AudioBuffer | null, bytes: 0 };
    ent.p = (async () => {
      if (!ctx) return null;
      try {
        const r = await fetch(src);
        const ab = await r.arrayBuffer();
        const b = await ctx.decodeAudioData(ab);
        ent.b = b;
        ent.bytes = b.length * b.numberOfChannels * 4;
        this.cacheBytes += ent.bytes;
        this.evict();
        return b;
      } catch {
        return null;
      }
    })();
    this.bufs.set(src, ent);
    return ent.p;
  }

  private evict() {
    const live = new Set<string>();
    const t = this.now();
    for (const c of this.clips) {
      if (c.start > t + PREFETCH_S) break;
      if (c.start + c.dur >= t - 1) live.add(c.src);
    }
    for (const [k, v] of this.bufs) {
      if (this.cacheBytes <= CACHE_BYTES) break;
      if (live.has(k) || !v.b) continue;
      this.bufs.delete(k);
      this.cacheBytes -= v.bytes;
    }
  }

  private tick(g: number) {
    if (g !== this.gen || !this.ctx || !this.out) return;
    const nowE = this.t0Edit + (this.ctx.currentTime - this.t0Ctx);
    this.prefetch(nowE);
    for (const c of this.clips) {
      if (c.start > nowE + AHEAD_S) break;
      if (c.start + c.dur <= nowE || this.done.has(c.id)) continue;
      const ent = this.bufs.get(c.src);
      if (!ent || !ent.b) {
        this.load(c.src);
        continue; // ainda carregando: tenta no próximo tique (entra atrasado, cortando o começo, se preciso)
      }
      this.done.add(c.id);
      this.schedule(c, ent.b);
    }
  }

  private schedule(c: SfxClip, b: AudioBuffer) {
    const ctx = this.ctx!;
    const when = this.t0Ctx + (c.start - this.t0Edit);
    let skip = 0; // quanto do começo já passou (pulo no meio do som, ou carregou atrasado)
    let at = when;
    if (when < ctx.currentTime) {
      skip = ctx.currentTime - when;
      at = ctx.currentTime;
      if (skip > 0.05) this.stats.late++;
    }
    const left = c.dur - skip;
    if (left <= 0.01 || c.trim + skip >= b.duration) return;
    const src = ctx.createBufferSource();
    src.buffer = b;
    const gn = ctx.createGain();
    // volume com fades, na linha do tempo do clipe
    const v = c.vol;
    const t0 = at - skip; // início "virtual" do clipe no relógio
    const g0 = (x: number) => {
      let k = 1;
      if (c.fadeIn > 0) k = Math.min(k, Math.max(0, x / c.fadeIn));
      if (c.fadeOut > 0) k = Math.min(k, Math.max(0, (c.dur - x) / c.fadeOut));
      return v * k;
    };
    gn.gain.setValueAtTime(g0(skip), at);
    if (c.fadeIn > 0 && skip < c.fadeIn) gn.gain.linearRampToValueAtTime(v, t0 + c.fadeIn);
    if (c.fadeOut > 0) {
      const fs = Math.max(skip, c.dur - c.fadeOut);
      gn.gain.setValueAtTime(g0(fs), t0 + fs);
      gn.gain.linearRampToValueAtTime(0, t0 + c.dur);
    }
    src.connect(gn);
    gn.connect(this.out!);
    src.start(at, c.trim + skip, left);
    this.stats.scheduled++;
    const key = c.id;
    this.nodes.set(key, { src, g: gn });
    src.onended = () => {
      const n = this.nodes.get(key);
      if (n && n.src === src) this.nodes.delete(key);
      src.disconnect();
      gn.disconnect();
    };
  }
}
