// MOTOR DE VOZ DA PRÉVIA (formato só voz / HL3). Toca a voz direto da cópia WAV da gravação, recortando os takes na
// hora com a Web Audio API: lê a gravação em blocos de 1 s (pedido de faixa de bytes, sem baixar o arquivo inteiro) e
// agenda cada pedaço de take no relógio do áudio, alguns segundos à frente. Ajustar um clipe só troca a lista de takes
// e reagenda do ponto atual — nada de montar e trocar um arquivo de 280 MB a cada ajuste (era isso que picotava a voz
// logo depois de editar). O player do Remotion continua mandando no tempo: play/pausa/pulo reiniciam o agendamento.
// Só na prévia; o render usa a voz tratada normal.

type Seg = { a: number; frames: number };

const BLOCK_S = 1; // segundos de gravação por bloco lido
const AHEAD_S = 2.5; // quanto agendar à frente
const PIECE_S = 1; // pedaço máximo agendado de uma vez
const LAT_S = 0.08; // folga para o primeiro pedaço chegar
const MAX_BLOCKS = 160; // cache (~56 MB em float estéreo)
const FADE_S = 0.008; // rampa nas emendas (s)
// TAXA: nada de conversão dentro do navegador. O contexto roda na taxa NATIVA do fone (a mesma que o reprodutor de mídia
// usa) e a cópia WAV da voz vem do servidor já nessa taxa (convertida com soxr, alta qualidade). Histórico:
// - WAV 44,1 kHz num contexto em outra taxa: o Chrome converte cada AudioBuffer por interpolação LINEAR → voz
//   "bitcrushada", fantasmas nos agudos (06/10/2026);
// - contexto forçado a 48 kHz num fone a 44,1 kHz: o Chrome converte a SAÍDA em tempo real → chiado/"picote" fantasma
//   na voz que não existe no arquivo (08/10/2026, medido: voz 48000 × efeitos/fone 44100).
// Só se o fone tiver outra taxa (96 kHz etc.) o contexto cai para 48 kHz, como antes.
const RATES = [44100, 48000];
const FALLBACK_RATE = 48000;

export class VoiceEngine {
  private ctx: AudioContext | null = null;
  private out: GainNode | null = null;
  private url = "";
  private head: Promise<{ dataOff: number; rate: number; ch: number; frames: number }> | null = null;
  private blocks = new Map<number, Promise<Float32Array[]>>();
  private segs: Seg[] = [];
  private starts: number[] = []; // início de cada take no tempo da edição (s)
  private fps = 30;
  private gain = 1;
  private nodes = new Set<AudioBufferSourceNode>();
  private playing = false;
  private gen = 0; // cada play/stop invalida os agendamentos antigos que ainda estão buscando áudio
  private t0Edit = 0;
  private t0Ctx = 0;
  private schedUntil = 0;
  private timer: ReturnType<typeof setInterval> | null = null;
  private busy = false;
  onError?: (e: unknown) => void;
  // diagnóstico (tools/profile_voz.mjs): pedaços agendados, atrasados, nível do último pedaço
  // wavRate ≠ ctxRate = o navegador está convertendo (não devia acontecer; o Estúdio pede o WAV na taxa do contexto)
  stats = { pieces: 0, late: 0, skipped: 0, rms: 0, plays: 0, wavRate: 0, ctxRate: 0 };

  setSource(url: string) {
    if (url === this.url) return;
    const was = this.playing ? this.now() : null;
    this.stop();
    this.url = url;
    this.blocks.clear();
    this.head = url ? this.readHead(url) : null;
    if (was !== null) this.play(was);
  }

  setSegments(segs: Seg[], fps: number) {
    const same = fps === this.fps && segs.length === this.segs.length && segs.every((s, i) => s.a === this.segs[i].a && s.frames === this.segs[i].frames);
    if (same) return;
    const was = this.playing ? this.now() : null;
    this.segs = segs.map((s) => ({ a: s.a, frames: s.frames }));
    this.fps = fps;
    this.starts = [];
    let acc = 0;
    for (const s of this.segs) {
      this.starts.push(acc / fps);
      acc += s.frames;
    }
    // reagenda do ponto atual com os takes novos: instantâneo
    if (was !== null) this.play(was);
  }

  setGain(g: number) {
    this.gain = g;
    if (this.out && this.ctx) this.out.gain.setTargetAtTime(g, this.ctx.currentTime, 0.02);
  }

  // o navegador só deixa tocar áudio depois de um gesto do usuário: chamado no primeiro clique/tecla
  unlock() {
    this.ensureCtx();
    if (this.ctx && this.ctx.state === "suspended") this.ctx.resume().catch(() => {});
  }

  isPlaying() {
    return this.playing;
  }

  // tempo da edição que está saindo no alto-falante agora
  now() {
    if (!this.ctx || !this.playing) return this.t0Edit;
    return this.t0Edit + (this.ctx.currentTime - this.t0Ctx);
  }

  play(editTime: number) {
    this.stop();
    this.ensureCtx();
    if (!this.ctx || !this.head) return;
    if (this.ctx.state === "suspended") this.ctx.resume().catch(() => {});
    this.playing = true;
    this.stats.plays++;
    // o primeiro pedaço leva alguns ms para chegar: em vez de atrasar a voz, começa um tico adiante
    this.t0Ctx = this.ctx.currentTime + LAT_S;
    this.t0Edit = editTime + LAT_S;
    this.schedUntil = this.t0Edit;
    const g = this.gen;
    this.tick(g);
    this.timer = setInterval(() => this.tick(g), 150);
  }

  stop() {
    this.gen++;
    this.playing = false;
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.busy = false;
    for (const n of this.nodes) {
      try {
        n.stop();
      } catch {
        /* já parou */
      }
      n.disconnect();
    }
    this.nodes.clear();
  }

  // taxa em que a voz vai tocar (a do fone, se for 44,1 ou 48 kHz): o Estúdio pede a cópia WAV nessa taxa
  deviceRate() {
    this.ensureCtx();
    return this.ctx?.sampleRate ?? FALLBACK_RATE;
  }

  private ensureCtx() {
    if (this.ctx) return;
    try {
      const probe = new AudioContext({ latencyHint: "playback" });
      if (RATES.includes(probe.sampleRate)) this.ctx = probe;
      else {
        probe.close().catch(() => {});
        this.ctx = new AudioContext({ latencyHint: "playback", sampleRate: FALLBACK_RATE });
      }
      this.out = this.ctx.createGain();
      this.out.gain.value = this.gain;
      this.out.connect(this.ctx.destination);
    } catch (e) {
      this.onError?.(e);
    }
  }

  private async readHead(url: string) {
    const r = await fetch(url, { headers: { Range: "bytes=0-65535" } });
    const b = new DataView(await r.arrayBuffer());
    const tag = (o: number) => String.fromCharCode(b.getUint8(o), b.getUint8(o + 1), b.getUint8(o + 2), b.getUint8(o + 3));
    if (tag(0) !== "RIFF" || tag(8) !== "WAVE") throw new Error("voz da prévia não é WAV");
    let p = 12;
    let ch = 2;
    let rate = 44100;
    let bits = 16;
    while (p + 8 <= b.byteLength) {
      const id = tag(p);
      const len = b.getUint32(p + 4, true);
      if (id === "fmt ") {
        ch = b.getUint16(p + 10, true);
        rate = b.getUint32(p + 12, true);
        bits = b.getUint16(p + 22, true);
      }
      if (id === "data") {
        if (bits !== 16) throw new Error("voz da prévia não é PCM 16 bits");
        return { dataOff: p + 8, rate, ch, frames: Math.floor(len / (ch * 2)) };
      }
      p += 8 + len + (len % 2);
    }
    throw new Error("WAV sem dados");
  }

  private block(i: number) {
    let pr = this.blocks.get(i);
    if (pr) {
      // mais recente no fim (cache por ordem de uso)
      this.blocks.delete(i);
      this.blocks.set(i, pr);
      return pr;
    }
    const url = this.url;
    pr = (async () => {
      const h = await this.head!;
      const bpf = h.ch * 2;
      const f0 = i * BLOCK_S * h.rate;
      const n = Math.max(0, Math.min(BLOCK_S * h.rate, h.frames - f0));
      const chans = Array.from({ length: h.ch }, () => new Float32Array(BLOCK_S * h.rate));
      if (n <= 0) return chans;
      const r = await fetch(url, { headers: { Range: `bytes=${h.dataOff + f0 * bpf}-${h.dataOff + (f0 + n) * bpf - 1}` } });
      const dv = new DataView(await r.arrayBuffer());
      const got = Math.min(n, Math.floor(dv.byteLength / bpf));
      for (let k = 0; k < got; k++) for (let c = 0; c < h.ch; c++) chans[c][k] = dv.getInt16((k * h.ch + c) * 2, true) / 32768;
      return chans;
    })();
    this.blocks.set(i, pr);
    while (this.blocks.size > MAX_BLOCKS) this.blocks.delete(this.blocks.keys().next().value as number);
    pr.catch(() => this.blocks.delete(i));
    return pr;
  }

  // amostras [s0, s0+n) da gravação, juntando os blocos
  private async pcm(s0: number, n: number, rate: number, ch: number) {
    const out = Array.from({ length: ch }, () => new Float32Array(n));
    const per = BLOCK_S * rate;
    let k = 0;
    while (k < n) {
      const s = s0 + k;
      if (s < 0) {
        k++;
        continue;
      }
      const bi = Math.floor(s / per);
      const off = s - bi * per;
      const take = Math.min(n - k, per - off);
      const b = await this.block(bi);
      for (let c = 0; c < ch; c++) out[c].set(b[Math.min(c, b.length - 1)].subarray(off, off + take), k);
      k += take;
    }
    return out;
  }

  private segAt(t: number) {
    // último take que começa até t (busca binária)
    let lo = 0;
    let hi = this.starts.length - 1;
    let r = -1;
    while (lo <= hi) {
      const m = (lo + hi) >> 1;
      if (this.starts[m] <= t + 1e-6) {
        r = m;
        lo = m + 1;
      } else hi = m - 1;
    }
    return r;
  }

  private async tick(g: number) {
    if (this.busy || g !== this.gen || !this.ctx || !this.out || !this.head) return;
    this.busy = true;
    try {
      const h = await this.head;
      this.stats.wavRate = h.rate;
      this.stats.ctxRate = this.ctx.sampleRate;
      const horizon = this.t0Edit + (this.ctx.currentTime - this.t0Ctx) + AHEAD_S;
      while (g === this.gen && this.schedUntil < horizon) {
        const k = this.segAt(this.schedUntil);
        if (k < 0) break;
        const sEdit = this.starts[k];
        const segLen = this.segs[k].frames / this.fps;
        const eEdit = sEdit + segLen;
        if (this.schedUntil >= eEdit - 1e-4) {
          if (k === this.segs.length - 1) break; // acabou a fala
          this.schedUntil = this.starts[k + 1];
          continue;
        }
        const p0 = this.schedUntil;
        const p1 = Math.min(eEdit, p0 + PIECE_S);
        const n = Math.max(1, Math.round((p1 - p0) * h.rate));
        const src0 = Math.round((this.segs[k].a + (p0 - sEdit)) * h.rate);
        const data = await this.pcm(src0, n, h.rate, h.ch);
        if (g !== this.gen) return;
        // fades nas emendas: 8 ms bastam para não estalar. Eram 2 quadros (66 ms) e, com corte justo, a rampa comia o
        // começo/fim das palavras em ~1.000 emendas (voz "falhando", 05/10/2026)
        const fin = Math.round(FADE_S * h.rate);
        const fout = Math.round(FADE_S * h.rate);
        const iA = Math.round((p0 - sEdit) * h.rate); // posição do pedaço dentro do take
        const segN = Math.round(segLen * h.rate);
        for (const chd of data) {
          for (let i = 0; i < n; i++) {
            const at = iA + i;
            let gg = 1;
            if (at < fin) gg = at / fin;
            const fromEnd = segN - 1 - at;
            if (fromEnd < fout) gg = Math.min(gg, Math.max(0, fromEnd) / fout);
            if (gg < 1) chd[i] *= gg;
          }
        }
        const buf = this.ctx.createBuffer(h.ch, n, h.rate);
        data.forEach((d, c) => buf.copyToChannel(d, c));
        const node = this.ctx.createBufferSource();
        node.buffer = buf;
        node.connect(this.out);
        const when = this.t0Ctx + (p0 - this.t0Edit);
        const late = this.ctx.currentTime - when;
        let sq = 0;
        for (let i = 0; i < n; i += 64) sq += data[0][i] * data[0][i];
        this.stats.rms = Math.sqrt(sq / Math.ceil(n / 64));
        this.stats.pieces++;
        if (late > 0) this.stats.late++;
        if (late > p1 - p0) {
          // atrasou demais (aba em segundo plano): pula este pedaço
          this.stats.skipped++;
          this.schedUntil = p1;
          continue;
        }
        if (late > 0) node.start(this.ctx.currentTime, late);
        else node.start(when);
        this.nodes.add(node);
        node.onended = () => {
          this.nodes.delete(node);
          node.disconnect();
        };
        this.schedUntil = p1;
      }
    } catch (e) {
      this.onError?.(e);
    } finally {
      if (g === this.gen) this.busy = false;
    }
  }
}
