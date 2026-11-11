# Reposiciona um edit.json casando os takes ANTIGOS com os NOVOS pela ORDEM (não pelo segundo da gravação).
# Para quando os takes só perderam trechos e/ou tiveram as pontas esticadas/aparadas (limpeza de silêncios): o
# retime.py mapeia pelo tempo da gravação e, quando vários trechos de pausa apontam para o MESMO silêncio da
# gravação (as pausas que o splice criava), um tempo que caiu num trecho apagado ia para "a borda mais próxima"
# em qualquer lugar do vídeo — as cenas se espalharam (05/10/2026). Aqui: trecho que ficou mantém o deslocamento
# interno; trecho que saiu manda o tempo para o começo do próximo trecho que ficou.
# Uso: python tools/retime_seq.py <slug> <segments_antigo.json> <edit_antigo.json> [--map-words]
#   (grava src/videos/<slug>/edit.json a partir do edit ANTIGO, com os segments.json atuais)
import bisect, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def main():
    args = [x for x in sys.argv[1:] if not x.startswith("--")]
    slug, old_seg_path, old_edit_path = args[0], args[1], args[2]
    vd = os.path.join(ROOT, "src", "videos", slug)
    doc = json.load(open(old_edit_path, encoding="utf-8"))
    fps = doc["fps"]
    old = json.load(open(old_seg_path, encoding="utf-8"))
    new_spec = json.load(open(os.path.join(vd, "segments.json"), encoding="utf-8"))
    O, N = old["segments"], new_spec["segments"]

    def starts(S):
        out, acc = [], 0
        for s in S:
            out.append(acc / fps)
            acc += s.get("frames") or round((s["b"] - s["a"]) * fps)
        return out, acc / fps

    os_, old_speech = starts(O)
    ns_, new_speech = starts(N)
    new_total = (new_spec.get("totalFrames") or round((new_speech + new_spec.get("outro", 0)) * fps)) / fps
    key = lambda s: (round(s["a"], 3), s.get("note", ""))
    match = [None] * len(O)
    j = 0
    for i, s in enumerate(O):
        if j < len(N) and key(N[j]) == key(s):
            match[i] = j
            j += 1
    if j != len(N):
        sys.exit(f"os takes novos não são uma subsequência dos antigos ({j}/{len(N)} casados) — use o retime.py")
    # para trecho apagado: o próximo que ficou
    nxt = [None] * len(O)
    nn = None
    for i in range(len(O) - 1, -1, -1):
        if match[i] is not None:
            nn = match[i]
        nxt[i] = nn

    def to_new(t):
        if t >= old_speech:
            return round(min(new_speech + (t - old_speech), new_total), 3)
        i = max(0, bisect.bisect_right(os_, t + 1e-9) - 1)
        if match[i] is not None:
            m = match[i]
            fr = N[m].get("frames") or round((N[m]["b"] - N[m]["a"]) * fps)
            return round(ns_[m] + min(t - os_[i], fr / fps), 3)
        return round(ns_[nxt[i]] if nxt[i] is not None else new_speech, 3)

    def fix_props(v, old_start, new_start, k=""):
        if isinstance(v, list):
            return [fix_props(x, old_start, new_start) for x in v]
        if isinstance(v, dict):
            out = {}
            base = v.get("at") if isinstance(v.get("at"), (int, float)) else None
            for kk, x in v.items():
                if kk == "dur" and isinstance(x, (int, float)) and base is not None:
                    a0 = old_start + base
                    out[kk] = round(max(1 / fps, to_new(a0 + x) - to_new(a0)), 3)
                else:
                    out[kk] = fix_props(x, old_start, new_start, kk)
            return out
        if isinstance(v, (int, float)) and not isinstance(v, bool) and re.match(r"^(at\d*|.*At\d*)$", k):
            return round(max(0.0, to_new(old_start + v) - new_start), 3)
        return v

    for s in doc["scenes"]:
        ns, ne = to_new(s["start"]), to_new(s["end"])
        s["props"] = fix_props(s["props"], s["start"], ns)
        s["start"], s["end"] = ns, max(ne, round(ns + 1 / fps, 3))
    for s in doc["sounds"]:
        s["start"] = to_new(s["start"])
    for z in doc.get("zoom", {}).get("snaps", []):
        z["t"] = to_new(z["t"])
    for p in doc.get("zoom", {}).get("pushes", []):
        p["t"] = to_new(p["t"])
        if p.get("until") not in (None, "end"):
            p["until"] = to_new(p["until"])
    for m in doc.get("markers", []) or []:
        if isinstance(m.get("t"), (int, float)):
            m["t"] = to_new(m["t"])
    if "--map-words" in sys.argv:
        ws = []
        for w in doc["captions"]["words"]:
            a, b = to_new(w["start"]), to_new(w["end"])
            ws.append({**w, "start": a, "end": max(b, round(a + 1 / fps, 3))})
        doc["captions"]["words"] = ws
    doc["duration"] = round(new_total, 3)
    json.dump(doc, open(os.path.join(vd, "edit.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"edit.json reposicionado (por ordem): {old_speech:.2f}s de fala -> {new_speech:.2f}s · duração {new_total:.2f}s")


if __name__ == "__main__":
    main()
