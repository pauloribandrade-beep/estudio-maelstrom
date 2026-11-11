# Corte justo (v2): tira respiros e pausas usando o detector por tipo de som (tools/pauses.py).
# Entre frases (palavra anterior termina em . , ! ? : ;): sobra `--keep` s (padrão 0,1).
# No meio da frase: só encurta para `--keep-mid` s (padrão 0,25), e só se a pausa passar de `--min-mid`.
# A folga fica assimétrica: menos depois da palavra, um pouco mais antes da próxima (o ataque da
# palavra seguinte nunca é cortado).
# Uso: python tools/tighten.py <slug> [--base segments_original.json] [--dry] [--json]
#   --base: takes de partida (padrão: bak/segments.v1.json se existir, senão o segments.json atual)
import argparse, json, os, re, sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import pauses  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


TAIL = 0.16  # s de sobra depois da última palavra antes de um corte
LEAD = 0.06  # s antes da próxima palavra


def plan(slug, base_spec, words, keep=0.1, keep_mid=0.25, min_len=0.18, min_mid=0.35, between=True, mid=True, kinds=("respiro", "silêncio")):
    boundary = pauses.boundary_fn(words)
    ign = pauses.ignored_of(slug)  # desconsideradas no Estúdio

    # trava de segurança: o corte nunca pode cair em cima de fala. Confere a energia do áudio nos 40 ms colados em
    # cada ponta; se estiver alta, empurra o corte para dentro da pausa até achar silêncio (e desiste se não achar).
    x = pauses.load(slug)
    sr = pauses.SR
    edb = lambda t0, t1: 20 * np.log10(np.sqrt(np.mean(x[max(0, int(t0 * sr)):max(int(t0 * sr) + 1, int(t1 * sr))] ** 2)) + 1e-9)
    noise = float(np.percentile([edb(t, t + 0.04) for t in np.arange(0, len(x) / sr - 0.05, 0.5)], 10))
    loud = noise + 28
    new, cuts = [], []
    for s in base_spec["segments"]:
        start = s["a"]
        for q in pauses.detect(slug, s["a"] + 0.05, s["b"] - 0.05, min_len=min_len):
            if pauses.is_ignored(q, ign):
                continue
            is_b = boundary(q["a"])
            # o Estúdio deixa escolher quais grupos cortar (entre frases / meio da frase)
            if (is_b and not between) or (not is_b and not mid) or q["kind"] not in kinds:
                continue
            k = keep if is_b else keep_mid
            if not is_b and q["dur"] < min_mid:
                continue
            # a voz ainda está caindo quando o detector marca o início da pausa: sem essa sobra o fim
            # da palavra some (o usuário ouviu "preenchimen-" cortado). TAIL depois da palavra, LEAD antes da próxima.
            ca = round(q["a"] + max(TAIL, k * 0.4), 3)  # depois da palavra
            cb = round(q["b"] - max(LEAD, k * 0.6), 3)  # antes da próxima
            while edb(ca - 0.04, ca) > loud and ca < q["b"]:
                ca = round(ca + 0.01, 3)
            while edb(cb, cb + 0.04) > loud and cb > ca:
                cb = round(cb - 0.01, 3)
            if cb - ca < 0.06:
                continue
            new.append({"a": round(start, 3), "b": ca, "note": s.get("note", "")})
            cuts.append({**q, "where": "entre frases" if is_b else "meio da frase", "keep": k, "cut": [ca, cb]})
            start = cb
        new.append({"a": round(start, 3), "b": s["b"], "note": s.get("note", "")})
    return new, cuts


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("slug")
    ap.add_argument("--base", default="")
    ap.add_argument("--keep", type=float, default=0.1)
    ap.add_argument("--keep-mid", type=float, default=0.25)
    ap.add_argument("--min", type=float, default=0.18)
    ap.add_argument("--min-mid", type=float, default=0.35)
    ap.add_argument("--words", default="")
    ap.add_argument("--no-between", action="store_true", help="não corta pausas entre frases")
    ap.add_argument("--no-mid", action="store_true", help="não corta pausas no meio da frase")
    ap.add_argument("--no-respiro", action="store_true", help="não corta respiros (sopro)")
    ap.add_argument("--no-silencio", action="store_true", help="não corta silêncios")
    ap.add_argument("--dry", action="store_true")
    ap.add_argument("--json", action="store_true")
    a = ap.parse_args()
    vd = os.path.join(ROOT, "src", "videos", a.slug)
    # ponto de partida = os takes ATUAIS (segments.json), com todos os ajustes manuais dele.
    # Antes partia do segments.base.json (takes de antes de qualquer corte) e cada clique em "Cortar respiros"
    # jogava fora os ajustes de ponta de clipe do vídeo inteiro (2026-10-02: repetições voltaram, emendas coladas).
    # Para voltar atrás, o Estúdio tem o "Desfazer último corte" (pilha em out/<slug>/tighten-undo.json).
    base = a.base or os.path.join(vd, "segments.json")
    spec = json.load(open(base, encoding="utf-8"))
    wpath = a.words or (os.path.join(vd, "bak", "words.v1.json") if os.path.exists(os.path.join(vd, "bak", "words.v1.json")) else os.path.join(vd, "words.json"))
    words = json.load(open(wpath, encoding="utf-8"))
    new, cuts = plan(a.slug, spec, words, a.keep, a.keep_mid, a.min, a.min_mid, not a.no_between, not a.no_mid,
                      tuple(k for k, off in (("respiro", a.no_respiro), ("silêncio", a.no_silencio)) if not off))
    removed = sum(c["dur"] - c["keep"] for c in cuts)
    if a.json:
        print(json.dumps({"cuts": cuts, "removed": round(removed, 2)}, ensure_ascii=False))
    else:
        n = lambda f: sum(1 for c in cuts if f(c))
        print(f"{len(cuts)} cortes · {removed:.1f} s a menos · {n(lambda c: c['kind'] == 'respiro')} respiros, {n(lambda c: c['kind'] != 'respiro')} silêncios, {n(lambda c: c['where'] == 'entre frases')} entre frases, {n(lambda c: c['where'] != 'entre frases')} no meio (base: {os.path.basename(base)})")
        for c in cuts:
            print(f"  {c['a']:.2f} a {c['b']:.2f} ({c['dur']:.2f} s) {c['kind']}, {c['where']}, fica {c['keep']} s")
    if not a.dry:
        fps = spec.get("fps", 30)
        acc = 0
        for sg in new:
            sg["frames"] = round((sg["b"] - sg["a"]) * fps)
            sg["editStart"] = round(acc / fps, 3)
            acc += sg["frames"]
        total = acc + round(spec["outro"] * fps)
        json.dump({"fps": fps, "outro": spec["outro"], "segments": new, "totalFrames": total}, open(os.path.join(vd, "segments.json"), "w", encoding="utf-8"), indent=2)


if __name__ == "__main__":
    main()
