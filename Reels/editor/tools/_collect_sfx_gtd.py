# Extrai os sons embutidos nas cenas de um edit.json e grava na trilha `sounds`.
# Uso: python tools/collect_sfx.py <slug> <ComposiçãoCollect> [--all]
#   padrão: só acrescenta sons de cenas que ainda não têm nenhum som na trilha
#           (não mexe no que o Paulo já ajustou);
#   --all:  refaz os sons de TODAS as cenas (apaga os ajustes feitos neles).
import json, os, re, subprocess, sys, wave

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import pack_tracks  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def wav_len(path):
    try:
        with wave.open(path) as w:
            return w.getnframes() / w.getframerate()
    except Exception:
        return 6.0


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    redo = "--all" in sys.argv
    slug, comp = args[0], args[1]
    path = os.path.join(ROOT, "src", "videos", slug, "edit.json")
    doc = json.load(open(path, encoding="utf-8"))
    fps = doc["fps"]
    out = os.path.join(ROOT, "out", "tmp")
    os.makedirs(out, exist_ok=True)
    props = os.path.join(out, f"{slug}-doc.json")
    json.dump({"doc": doc}, open(props, "w", encoding="utf-8"), ensure_ascii=False)
    npx = "npx.cmd" if os.name == "nt" else "npx"
    r = subprocess.run(
        [npx, "remotion", "still", "src/index.ts", comp, os.path.join(out, "collect.png"), "--frame=0", "--scale=0.1", "--log=verbose", f"--props={props}", "--public-dir=E:/tmp_zale/pub_gtd"],
        cwd=ROOT, capture_output=True, text=True, encoding="utf-8", errors="replace",
    )
    found, seen = [], set()
    for line in (r.stdout + r.stderr).splitlines():
        m = re.search(r"__SFX__(\{.*?\})", line)
        if not m:
            continue
        s = json.loads(m.group(1))
        key = (s.get("scene"), s["frame"], s["src"])
        if key in seen:
            continue
        seen.add(key)
        found.append(s)
    if not found and r.returncode != 0:
        print(r.stdout[-2000:], r.stderr[-2000:])
        sys.exit("falhou a extração")
    have = {s.get("scene") for s in doc["sounds"] if s.get("scene")}
    keep = [s for s in doc["sounds"] if not s.get("scene") or (not redo and s.get("scene") in have)]
    labels = {sc["id"]: sc.get("label", sc["id"]) for sc in doc["scenes"]}
    added = 0
    for i, s in enumerate(sorted(found, key=lambda x: x["frame"])):
        if not redo and s.get("scene") in have:
            continue
        file_len = wav_len(os.path.join(ROOT, "public", s["src"]))
        dur = s["dur"] / fps if "dur" in s else min(file_len, 6.0)
        fam = os.path.basename(s["src"]).split("_")[0].replace(".wav", "")
        clip = {
            "id": f"s{s['frame']}-{fam}-{i}",
            "src": s["src"],
            "start": round(s["frame"] / fps, 3),
            "vol": s["vol"],
            "dur": round(dur, 3),
            "label": f"{fam} · {labels.get(s.get('scene'), '')}",
            "scene": s.get("scene"),
        }
        if "fadeIn" in s:
            clip["fadeIn"] = round(s["fadeIn"] / fps, 3)
            clip["fadeOut"] = round(s["fadeOut"] / fps, 3)
        # trilha: onde não encavala com outro som (pack_tracks.py; o mesmo som repetido pode ficar junto)
        doc["sounds"] = keep
        clip["track"] = pack_tracks.pick_track(doc, clip["src"], clip["start"], clip["start"] + clip["dur"])
        keep.append(clip)
        added += 1
    doc["sounds"] = sorted(keep, key=lambda x: x["start"])
    json.dump(doc, open(path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"{added} sons acrescentados, {len(doc['sounds'])} na trilha")


if __name__ == "__main__":
    main()
