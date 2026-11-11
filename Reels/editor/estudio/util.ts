// utilidades do Estúdio (fora do App.tsx para o Fast Refresh não recarregar a página)
export const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
export const r3 = (x: number) => Math.round(x * 1000) / 1000;

import type { EditDoc, SoundClip, SoundTrack } from "../src/lib/edit/types";

const isShiftKey = (k: string) => /^at\d*$/.test(k) || /At\d*$/.test(k); // at, at1, fooAt, fooAt2

// Ao mover a borda ESQUERDA de uma cena, os tempos internos (relativos ao início)
// são compensados para as animações continuarem no mesmo instante do vídeo.
export const shiftInner = (v: unknown, d: number, key = ""): unknown => {
  if (Array.isArray(v)) return v.map((x) => shiftInner(x, d));
  if (v && typeof v === "object") {
    const o: Record<string, unknown> = {};
    for (const [k, x] of Object.entries(v as Record<string, unknown>)) o[k] = shiftInner(x, d, k);
    return o;
  }
  if (typeof v === "number" && isShiftKey(key)) return r3(Math.max(0, v + d));
  return v;
};

// ORGANIZAR TRILHAS DE EFEITOS (pedido do usuário): dois sons DIFERENTES nunca ficam encavalados na mesma trilha,
// para cada um poder ser ajustado sozinho. O mesmo som repetido (moedas, cabides) pode ficar junto. Trilhas de
// música não entram. Falta trilha: cria "Efeitos N" logo depois das de efeito. (Igual em tools/collect_sfx.py.)
export const famOf = (src: string) => (src.split("/").pop() ?? src).replace(/\.\w+$/, "").replace(/_\d+$/, "");
export const isMusicTrack = (t?: SoundTrack) => !!t && /^m[uú]sica/i.test(t.name);
type Lane = { fam: string; a: number; b: number; id: string }[];
const fitsLane = (lane: Lane, fam: string, a: number, b: number, self?: string) => lane.every((o) => o.id === self || o.b <= a + 1e-3 || o.a >= b - 1e-3 || o.fam === fam);
const fxTracks = (d: EditDoc) => {
  if (!d.soundTracks?.length) d.soundTracks = [{ id: "t1", name: "Efeitos" }];
  return d.soundTracks.filter((t) => !isMusicTrack(t));
};
const newFxTrack = (d: EditDoc) => {
  const ts = d.soundTracks!;
  const n = ts.filter((t) => /^efeitos/i.test(t.name)).length + 1;
  const t: SoundTrack = { id: `fx${n}-${Date.now().toString(36).slice(-4)}`, name: `Efeitos ${n}` };
  const last = Math.max(...ts.map((x, i) => (isMusicTrack(x) ? -1 : i)));
  ts.splice(last + 1, 0, t);
  return t;
};
const lanesOf = (d: EditDoc, fx: SoundTrack[]) => {
  const lanes: Record<string, Lane> = Object.fromEntries(fx.map((t) => [t.id, []]));
  for (const s of d.sounds) {
    const tid = fx.some((t) => t.id === s.track) ? (s.track as string) : !s.track || !d.soundTracks!.some((t) => t.id === s.track) ? fx[0].id : "";
    if (tid) lanes[tid].push({ fam: famOf(s.src), a: s.start, b: s.start + (s.dur ?? 1), id: s.id });
  }
  return lanes;
};
// trilha para UM som novo: a do mesmo tipo, depois a preferida, depois a primeira livre; se nenhuma, cria
export const pickFxTrack = (d: EditDoc, src: string, a: number, b: number, prefer?: string) => {
  const fx = fxTracks(d);
  const lanes = lanesOf(d, fx);
  const fam = famOf(src);
  const order = [...fx.filter((t) => lanes[t.id].some((o) => o.fam === fam)), ...fx.filter((t) => t.id === prefer), ...fx];
  return (order.find((t) => fitsLane(lanes[t.id], fam, a, b)) ?? newFxTrack(d)).id;
};
// reorganiza TODOS os efeitos do documento (botão "Organizar trilhas")
export const packFxTracks = (d: EditDoc) => {
  const fx = fxTracks(d);
  const isFx = (s: SoundClip) => !isMusicTrack(d.soundTracks!.find((t) => t.id === s.track));
  const movable = d.sounds.filter(isFx).sort((x, y) => x.start - y.start);
  const lanes: Record<string, Lane> = Object.fromEntries(fx.map((t) => [t.id, []]));
  let moved = 0;
  for (const s of movable) {
    const fam = famOf(s.src);
    const a = s.start;
    const b = s.start + (s.dur ?? 1);
    const order = [...fx.filter((t) => lanes[t.id].some((o) => o.fam === fam)), ...fx.filter((t) => t.id === s.track), ...fx];
    let t = order.find((x) => fitsLane(lanes[x.id], fam, a, b));
    if (!t) {
      t = newFxTrack(d);
      fx.push(t);
      lanes[t.id] = [];
    }
    lanes[t.id].push({ fam, a, b, id: s.id });
    if (s.track !== t.id) moved++;
    s.track = t.id;
  }
  return moved;
};

export const packRows = (sounds: SoundClip[]) => {
  const ends: number[] = [];
  const row: Record<string, number> = {};
  for (const s of [...sounds].sort((a, b) => a.start - b.start)) {
    const e = s.start + (s.dur ?? 1) + 0.05;
    let i = ends.findIndex((x) => x <= s.start + 0.001);
    if (i < 0) {
      i = ends.length;
      ends.push(e);
    } else ends[i] = e;
    row[s.id] = i;
  }
  return { rows: Math.max(1, ends.length), row };
};



// seleção de palavras no painel de texto (índices da legenda)
export type TextSel = { i0: number; i1: number } | null;
// trecho de vídeo que sai quando as palavras i0..i1 são apagadas: da folga depois da palavra anterior
// até pouco antes da próxima (leva junto a pausa do meio, o corte fica justo como no resto do vídeo)
export const rangeOf = (words: { start: number; end: number }[], s: NonNullable<TextSel>) => {
  const i0 = Math.min(s.i0, s.i1);
  const i1 = Math.max(s.i0, s.i1);
  const w0 = words[i0];
  const w1 = words[i1];
  const prev = words[i0 - 1];
  const next = words[i1 + 1];
  const a = prev ? Math.min(w0.start, prev.end + 0.16) : Math.max(0, w0.start - 0.1);
  const b = next ? Math.max(w1.end, next.start - 0.06) : w1.end + 0.3;
  return { a: Math.round(a * 1000) / 1000, b: Math.round(b * 1000) / 1000, n: i1 - i0 + 1 };
};


/** copia texto; no painel do app o navigator.clipboard pode ser bloqueado, então cai no execCommand */
export const copyText = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {
      ok = false;
    }
    ta.remove();
    return ok;
  }
};
