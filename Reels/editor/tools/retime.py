# Reposiciona um edit.json depois que os takes mudaram (novos cortes).
# Todo tempo da edição antiga -> segundo da gravação (takes antigos) -> tempo da edição nova.
# Tempo que caiu num trecho cortado vai para a borda mais próxima que ficou.
# Dentro das cenas, os tempos relativos (at, ...At) e as durações (dur) são refeitos
# a partir do instante absoluto, então cada animação continua na mesma palavra.
# Legenda: as palavras vêm do words.json novo (o cut.py já refez).
# Uso: python tools/retime.py <slug> <segments_antigo.json>
import json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def frames_of(spec, fps):
    out, start = [], 0
    for s in spec["segments"]:
        f = s.get("frames") or round((s["b"] - s["a"]) * fps)
        out.append((s["a"], s["b"], start / fps, f / fps))
        start += f
    return out, start / fps


def make_mappers(old, new, old_speech, new_speech, new_total, fast=True):
    # 05/11 (pendência "apagar trecho de áudio demorou muito"): a versão antiga varria os ~3.500 takes a cada tempo
    # (dezenas de milhares de palavras e props) = minutos. Agora é busca binária, com o MESMO resultado da varredura
    # (mesmo desempate: o primeiro take na ordem da edição); fast=False mantém a varredura para conferir.
    import bisect

    def to_orig_slow(t):
        if t >= old_speech:
            return ("outro", t - old_speech)
        for a, b, e0, d in old:
            if t <= e0 + d + 1e-6:
                return ("orig", a + max(0.0, t - e0))
        return ("outro", 0.0)

    def to_new_slow(t):
        kind, v = to_orig_slow(t)
        if kind == "outro":
            return round(min(new_speech + v, new_total), 3)
        best, bd = None, 1e9
        inn = [e0 + (v - a) for a, b, e0, d in new if a - 1e-6 <= v <= b + 1e-6]
        if inn:
            return round(min(inn, key=lambda x: abs(x - t)), 3)
        for a, b, e0, d in new:
            for edge, et in ((a, e0), (b, e0 + d)):
                if abs(v - edge) < bd:
                    bd, best = abs(v - edge), et
        return round(best, 3)

    if not fast:
        return to_orig_slow, to_new_slow

    # to_orig: o primeiro take antigo cujo fim (+tolerância) alcança t; os fins crescem na ordem da edição
    ends = []
    m = -1e18
    for a, b, e0, d in old:
        m = max(m, e0 + d + 1e-6)
        ends.append(m)

    def to_orig(t):
        if t >= old_speech:
            return ("outro", t - old_speech)
        i = bisect.bisect_left(ends, t)
        if i >= len(old):
            return ("outro", 0.0)
        a, b, e0, d = old[i]
        return ("orig", a + max(0.0, t - e0))

    # to_new: takes novos ordenados pelo início na gravação; contém v = algum take com a <= v+tol e b >= v-tol
    order = sorted(range(len(new)), key=lambda k: new[k][0])
    starts = [new[k][0] for k in order]
    # maior fim até cada posição (para saber se algum take anterior ainda cobre v quando os takes se sobrepõem)
    pref_b = []
    m = -1e18
    for k in order:
        m = max(m, new[k][1])
        pref_b.append(m)
    edges = sorted((v, 2 * k + j, et) for k, (a, b, e0, d) in enumerate(new) for j, (v, et) in enumerate(((a, e0), (b, e0 + d))))
    evals = [e[0] for e in edges]

    def to_new(t):
        kind, v = to_orig(t)
        if kind == "outro":
            return round(min(new_speech + v, new_total), 3)
        hi = bisect.bisect_right(starts, v + 1e-6)
        # 11/11: o MESMO trecho da gravação pode estar em dois lugares do vídeo (o tom de sala da abertura é reaproveitado
        # no respiro do I Miss You). Antes valia o primeiro take na ordem da edição e o som de 4:43 pulava pra 0:05 a cada
        # corte. Agora vale a ocorrência mais perto de onde ele estava (t); empate = a primeira.
        first, fd = None, 1e18
        p = hi - 1
        while p >= 0 and pref_b[p] >= v - 1e-6:
            k = order[p]
            a, b, e0, d = new[k]
            if a - 1e-6 <= v <= b + 1e-6:
                dd = abs(e0 + (v - a) - t)
                if first is None or dd < fd - 1e-6 or (abs(dd - fd) <= 1e-6 and k < first):
                    first, fd = k, dd
            p -= 1
        if first is not None:
            a, b, e0, d = new[first]
            return round(e0 + (v - a), 3)
        # nenhum contém: a borda mais próxima (empate: a primeira na ordem da varredura)
        i = bisect.bisect_left(evals, v)
        cands = []
        if i < len(evals):
            cands.append(abs(v - evals[i]))
        if i > 0:
            cands.append(abs(v - evals[i - 1]))
        dmin = min(cands)
        best = None
        for val in {v - dmin, v + dmin}:
            lo, hi2 = bisect.bisect_left(evals, val), bisect.bisect_right(evals, val)
            for q in range(lo, hi2):
                if abs(v - evals[q]) == dmin and (best is None or edges[q][1] < best[1]):
                    best = edges[q]
        if best is None:  # arredondamento de v ± dmin: cai na varredura (raro)
            return to_new_slow(t)
        return round(best[2], 3)

    return to_orig, to_new


def main():
    args = [x for x in sys.argv[1:] if not x.startswith("--")]
    slug, old_path = args[0], args[1]
    vd = os.path.join(ROOT, "src", "videos", slug)
    doc = json.load(open(os.path.join(vd, "edit.json"), encoding="utf-8"))
    fps = doc["fps"]
    old, old_speech = frames_of(json.load(open(old_path, encoding="utf-8")), fps)
    new_spec = json.load(open(os.path.join(vd, "segments.json"), encoding="utf-8"))
    new, new_speech = frames_of(new_spec, fps)
    new_total = (new_spec.get("totalFrames") or round((new_speech + new_spec["outro"]) * fps)) / fps

    to_orig, to_new = make_mappers(old, new, old_speech, new_speech, new_total)

    def fix_props(v, old_start, new_start, key=""):
        if isinstance(v, list):
            return [fix_props(x, old_start, new_start) for x in v]
        if isinstance(v, dict):
            out = {}
            base = v.get("at") if isinstance(v.get("at"), (int, float)) else None
            for k, x in v.items():
                if k == "dur" and isinstance(x, (int, float)) and base is not None:
                    a0 = old_start + base
                    out[k] = round(max(1 / fps, to_new(a0 + x) - to_new(a0)), 3)
                else:
                    out[k] = fix_props(x, old_start, new_start, k)
            return out
        if isinstance(v, (int, float)) and not isinstance(v, bool) and re.match(r"^(at\d*|.*At\d*)$", key):
            return round(max(0.0, to_new(old_start + v) - new_start), 3)
        return v

    for s in doc["scenes"]:
        ns, ne = to_new(s["start"]), to_new(s["end"])
        s["props"] = fix_props(s["props"], s["start"], ns)
        s["start"], s["end"] = ns, max(ne, round(ns + 1 / fps, 3))
    for s in doc["sounds"]:
        s["start"] = to_new(s["start"])
    for z in doc["zoom"]["snaps"]:
        z["t"] = to_new(z["t"])
    for p in doc["zoom"]["pushes"]:
        p["t"] = to_new(p["t"])
        if p["until"] != "end":
            p["until"] = to_new(p["until"])
    if "--map-words" in sys.argv:
        ws = []
        for w in doc["captions"]["words"]:
            a, b = to_new(w["start"]), to_new(w["end"])
            ws.append({**w, "start": a, "end": max(b, round(a + 1 / fps, 3))})
        doc["captions"]["words"] = ws
    else:
        words = json.load(open(os.path.join(vd, "words.json"), encoding="utf-8"))
        doc["captions"]["words"] = [{"word": w["word"], "start": w["start"], "end": w["end"]} for w in words]
    doc["duration"] = round(new_total, 3)
    json.dump(doc, open(os.path.join(vd, "edit.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"edit.json reposicionado: {old_speech:.2f}s de fala -> {new_speech:.2f}s · duração {new_total:.2f}s")


if __name__ == "__main__":
    main()
