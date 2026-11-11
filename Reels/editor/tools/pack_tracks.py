# Organiza os efeitos de um edit.json em trilhas (pedido do usuário): dois sons DIFERENTES nunca ficam encavalados
# na mesma trilha, para cada um poder ser ajustado sozinho; o mesmo som repetido (moedas, cabides) pode ficar junto.
# Trilhas de música não entram. Falta trilha: cria "Efeitos N". Mesma regra de estudio/util.ts (packFxTracks).
# Uso: python tools/pack_tracks.py <slug>            reorganiza todos os efeitos
#      (collect_sfx.py usa pick_track() só nos sons novos)
import json, os, re, sys, time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def fam_of(src):
    return re.sub(r"_\d+$", "", os.path.splitext(os.path.basename(src))[0])


def is_music(t):
    return bool(t) and re.match(r"^m[uú]sica", t.get("name", ""), re.I) is not None


def fx_tracks(doc):
    if not doc.get("soundTracks"):
        doc["soundTracks"] = [{"id": "t1", "name": "Efeitos"}]
    return [t for t in doc["soundTracks"] if not is_music(t)]


def new_track(doc):
    ts = doc["soundTracks"]
    n = sum(1 for t in ts if re.match(r"^efeitos", t["name"], re.I)) + 1
    t = {"id": f"fx{n}-{format(int(time.time() * 1000) % 1679616, 'x')}", "name": f"Efeitos {n}"}
    last = max(i for i, x in enumerate(ts) if not is_music(x)) if any(not is_music(x) for x in ts) else -1
    ts.insert(last + 1, t)
    return t


def fits(lane, fam, a, b):
    return all(o[2] <= a + 1e-3 or o[1] >= b - 1e-3 or o[0] == fam for o in lane)


def _order(fx, lanes, fam, prefer):
    return [t for t in fx if any(o[0] == fam for o in lanes[t["id"]])] + [t for t in fx if t["id"] == prefer] + fx


def pick_track(doc, src, a, b, prefer=None):
    fx = fx_tracks(doc)
    ids = {t["id"] for t in doc["soundTracks"]}
    lanes = {t["id"]: [] for t in fx}
    for s in doc["sounds"]:
        tid = s.get("track") if s.get("track") in lanes else (fx[0]["id"] if s.get("track") not in ids else None)
        if tid:
            lanes[tid].append((fam_of(s["src"]), s["start"], s["start"] + s.get("dur", 1)))
    fam = fam_of(src)
    for t in _order(fx, lanes, fam, prefer):
        if fits(lanes[t["id"]], fam, a, b):
            return t["id"]
    return new_track(doc)["id"]


def pack(doc):
    fx = fx_tracks(doc)
    by_id = {t["id"]: t for t in doc["soundTracks"]}
    lanes = {t["id"]: [] for t in fx}
    moved = 0
    for s in sorted([s for s in doc["sounds"] if not is_music(by_id.get(s.get("track")))], key=lambda s: s["start"]):
        fam, a, b = fam_of(s["src"]), s["start"], s["start"] + s.get("dur", 1)
        t = next((t for t in _order(fx, lanes, fam, s.get("track")) if fits(lanes[t["id"]], fam, a, b)), None)
        if t is None:
            t = new_track(doc)
            fx.append(t)
            lanes[t["id"]] = []
        lanes[t["id"]].append((fam, a, b))
        moved += s.get("track") != t["id"]
        s["track"] = t["id"]
    return moved


if __name__ == "__main__":
    slug = sys.argv[1]
    path = os.path.join(ROOT, "src", "videos", slug, "edit.json")
    doc = json.load(open(path, encoding="utf-8"))
    n = pack(doc)
    json.dump(doc, open(path, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    names = {t["id"]: t["name"] for t in doc["soundTracks"]}
    from collections import Counter
    c = Counter(names.get(s.get("track"), "?") for s in doc["sounds"])
    print(f"{n} sons mudaram de trilha |", ", ".join(f"{k}: {v}" for k, v in c.items()))
