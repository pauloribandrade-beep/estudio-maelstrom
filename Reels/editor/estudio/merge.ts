// FUSÃO de três vias do edit.json: quando o arquivo muda por fora (Claude gravou um ajuste) enquanto o Paulo tem uma
// mudança ainda não salva, em vez de jogar fora a dele (ficava só em Versões), junta as duas:
//   base   = a versão que o Estúdio carregou/salvou por último
//   mine   = a versão da aba (com a mudança do Paulo)
//   theirs = a versão nova do disco (com a mudança de fora)
// Listas com `id` (cenas, sons, trilhas, marcadores, layouts) juntam ITEM A ITEM; o resto, campo a campo.
// Mexeram no mesmo item dos dois lados: vale o da aba (o Paulo está vendo e mexendo nele).
import type { EditDoc } from "../src/lib/edit/types";

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

type WithId = { id?: string };

function mergeList<T extends WithId>(base: T[] = [], mine: T[] = [], theirs: T[] = []): T[] {
  const B = new Map(base.map((x) => [x.id, x]));
  const M = new Map(mine.map((x) => [x.id, x]));
  const T_ = new Map(theirs.map((x) => [x.id, x]));
  const out: T[] = [];
  const seen = new Set<string | undefined>();
  const pick = (id: string | undefined) => {
    if (seen.has(id)) return;
    seen.add(id);
    const b = B.get(id);
    const m = M.get(id);
    const t = T_.get(id);
    if (b === undefined) {
      // novo de um lado (ou dos dois): entra
      if (m !== undefined) out.push(m);
      else if (t !== undefined) out.push(t);
      return;
    }
    const mChanged = m === undefined || !same(m, b);
    const tChanged = t === undefined || !same(t, b);
    if (!mChanged) {
      if (t !== undefined) out.push(t); // só mudou (ou sumiu) lá fora
      return;
    }
    if (!tChanged) {
      if (m !== undefined) out.push(m); // só mudou (ou sumiu) aqui
      return;
    }
    // mudou dos dois lados: apagado aqui vence; senão, campo a campo com preferência para a aba
    if (m === undefined) return;
    if (t === undefined) {
      out.push(m);
      return;
    }
    const merged = { ...t } as Record<string, unknown>;
    for (const k of new Set([...Object.keys(m), ...Object.keys(b)])) {
      const mv = (m as Record<string, unknown>)[k];
      const bv = (b as Record<string, unknown>)[k];
      if (!same(mv, bv)) {
        if (mv === undefined) delete merged[k];
        else merged[k] = mv;
      }
    }
    out.push(merged as T);
  };
  // ordem: a do disco novo, com os itens novos da aba no fim
  for (const x of theirs) pick(x.id);
  for (const x of mine) pick(x.id);
  return out;
}

const LISTS = ["scenes", "sounds", "soundTracks", "markers", "layouts"] as const;

export function mergeDocs(base: EditDoc, mine: EditDoc, theirs: EditDoc): EditDoc {
  const out = { ...theirs } as Record<string, unknown>;
  const b = base as unknown as Record<string, unknown>;
  const m = mine as unknown as Record<string, unknown>;
  for (const k of new Set([...Object.keys(m), ...Object.keys(b)])) {
    if ((LISTS as readonly string[]).includes(k)) continue;
    if (!same(m[k], b[k])) out[k] = m[k]; // campo que a aba mudou (captions, zoom, voice…)
  }
  for (const k of LISTS) {
    const merged = mergeList(b[k] as WithId[] | undefined, m[k] as WithId[] | undefined, (theirs as unknown as Record<string, unknown>)[k] as WithId[] | undefined);
    if (merged.length || (theirs as unknown as Record<string, unknown>)[k] !== undefined || m[k] !== undefined) out[k] = merged;
  }
  if (Array.isArray(out.sounds)) (out.sounds as { start: number }[]).sort((x, y) => x.start - y.start);
  return out as unknown as EditDoc;
}
