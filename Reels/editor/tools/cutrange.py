# Corta um trecho do VÍDEO (tempo da edição) com ripple: o que vem depois anda para trás.
# Base do Estúdio para "apagar palavras no texto" e "Shift+Del no trecho I/O".
# Uso: python tools/cutrange.py <slug> <a> <b>     (segundos da edição)
#      python tools/cutrange.py <slug> --undo      (volta o último corte)
#      python tools/cutrange.py <slug> --redo      (refaz o último corte desfeito; pilha em out/<slug>/cuts-redo)
# Guarda segments.json + edit.json de antes em out/<slug>/cuts/<stamp>/ (pilha de desfazer).
# As palavras da legenda que ficam inteiras dentro do trecho saem; o resto é reposicionado pelo retime.py.
import json, os, shutil, subprocess, sys, time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def main():
    slug = sys.argv[1]
    vd = os.path.join(ROOT, "src", "videos", slug)
    cuts = os.path.join(ROOT, "out", slug, "cuts")
    seg_p = os.path.join(vd, "segments.json")
    doc_p = os.path.join(vd, "edit.json")

    redo_d = os.path.join(ROOT, "out", slug, "cuts-redo")

    if "--redo" in sys.argv:
        # 05/11: refazer o corte que o Ctrl+Z desfez (antes o desfazer apagava o corte e o Ctrl+Y não tinha o que refazer)
        stack = sorted(os.listdir(redo_d)) if os.path.isdir(redo_d) else []
        if not stack:
            sys.exit("nada para refazer")
        top = os.path.join(redo_d, stack[-1])
        meta = os.path.join(top, "meta.json")
        if os.path.exists(meta):
            m = json.load(open(meta, encoding="utf-8"))
            r = subprocess.run([sys.executable, os.path.abspath(__file__), slug, str(m["a"]), str(m["b"]), "--keep-redo"], cwd=ROOT, capture_output=True, text=True, encoding="utf-8", errors="replace")
            if r.returncode:
                sys.exit((r.stderr or r.stdout)[-500:])
            shutil.rmtree(top)
            print(f"corte refeito ({len(stack) - 1} para refazer)")
            return
        stamp = time.strftime("%Y%m%d-%H%M%S") + "-%03d" % (int(time.time() * 1000) % 1000)
        bak = os.path.join(cuts, stamp)
        os.makedirs(bak, exist_ok=True)
        shutil.copyfile(seg_p, os.path.join(bak, "segments.json"))
        shutil.copyfile(doc_p, os.path.join(bak, "edit.json"))
        shutil.copyfile(os.path.join(top, "segments.json"), seg_p)
        r = subprocess.run([sys.executable, os.path.join(ROOT, "tools", "retime.py"), slug, os.path.join(bak, "segments.json"), "--map-words"], cwd=ROOT, capture_output=True, text=True, encoding="utf-8", errors="replace")
        if r.returncode:
            shutil.copyfile(os.path.join(bak, "segments.json"), seg_p)
            shutil.copyfile(os.path.join(bak, "edit.json"), doc_p)
            shutil.rmtree(bak)
            sys.exit("falhou ao reposicionar: " + (r.stderr or r.stdout)[-500:])
        # a legenda volta como estava logo depois do corte (as palavras cortadas saem de novo)
        doc = json.load(open(doc_p, encoding="utf-8"))
        old = json.load(open(os.path.join(top, "edit.json"), encoding="utf-8"))
        doc["captions"]["words"] = old["captions"]["words"]
        json.dump(doc, open(doc_p, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
        shutil.rmtree(top)
        print(f"corte refeito ({len(stack) - 1} para refazer)")
        return

    if "--undo" in sys.argv:
        stack = sorted(os.listdir(cuts)) if os.path.isdir(cuts) else []
        if not stack:
            sys.exit("nada para desfazer")
        top = os.path.join(cuts, stack[-1])
        # guarda o estado DEPOIS do corte na pilha do refazer (takes + legenda de agora)
        rd = os.path.join(redo_d, time.strftime("%Y%m%d-%H%M%S") + "-%03d" % (int(time.time() * 1000) % 1000))
        os.makedirs(rd, exist_ok=True)
        shutil.copyfile(seg_p, os.path.join(rd, "segments.json"))
        shutil.copyfile(doc_p, os.path.join(rd, "edit.json"))
        meta = os.path.join(top, "meta.json")
        if os.path.exists(meta):
            shutil.copyfile(meta, os.path.join(rd, "meta.json"))
        # Volta SÓ os takes e reposiciona a edição ATUAL (como o "desfazer cortar respiros"). Antes copiava de volta o
        # edit.json inteiro do momento do corte: tudo que tinha sido feito DEPOIS (cenas, sons, correções) sumia
        # (02/10: blips, buraco da Gemma e o realinhamento de 7:30–15:27 se perderam assim).
        now_seg = os.path.join(top, "segments.agora.json")
        shutil.copyfile(seg_p, now_seg)
        shutil.copyfile(os.path.join(top, "segments.json"), seg_p)
        r = subprocess.run([sys.executable, os.path.join(ROOT, "tools", "retime.py"), slug, now_seg, "--map-words"], cwd=ROOT, capture_output=True, text=True, encoding="utf-8", errors="replace")
        if r.returncode:
            shutil.copyfile(now_seg, seg_p)
            shutil.rmtree(rd, ignore_errors=True)
            sys.exit("falhou ao reposicionar: " + (r.stderr or r.stdout)[-500:])
        # as palavras que o corte tinha tirado da legenda voltam do backup (lá elas já estão no tempo dos takes restaurados)
        doc = json.load(open(doc_p, encoding="utf-8"))
        old = json.load(open(os.path.join(top, "edit.json"), encoding="utf-8"))
        ws = doc["captions"]["words"]
        if os.path.exists(meta):
            # 05/11: no trecho do corte (tempo de antes dele) valem as palavras do backup, exatas; fora dele, as de agora
            m = json.load(open(meta, encoding="utf-8"))
            hit = lambda w: w["start"] < m["b"] + 0.001 and w["end"] > m["a"] - 0.001
            back = [w for w in old["captions"]["words"] if hit(w)]
            ws = [w for w in ws if not hit(w)]
        else:
            back = [w for w in old["captions"]["words"] if not any(x["start"] < w["end"] - 0.02 and x["end"] > w["start"] + 0.02 for x in ws)]
        doc["captions"]["words"] = sorted(ws + back, key=lambda w: w["start"])
        json.dump(doc, open(doc_p, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
        shutil.rmtree(top)
        print(f"corte desfeito ({len(stack) - 1} na pilha; edição atual mantida, {len(back)} palavras de volta)")
        return

    a, b = sorted((float(sys.argv[2]), float(sys.argv[3])))
    spec = json.load(open(seg_p, encoding="utf-8"))
    doc = json.load(open(doc_p, encoding="utf-8"))
    fps = spec.get("fps", 30)
    if b - a < 1 / fps:
        sys.exit("trecho curto demais")

    # milissegundos no nome: dois cortes no mesmo segundo gravavam na MESMA pasta e o desfazer pulava um (05/11)
    stamp = time.strftime("%Y%m%d-%H%M%S") + "-%03d" % (int(time.time() * 1000) % 1000)
    bak = os.path.join(cuts, stamp)
    os.makedirs(bak, exist_ok=True)
    shutil.copyfile(seg_p, os.path.join(bak, "segments.json"))
    shutil.copyfile(doc_p, os.path.join(bak, "edit.json"))
    json.dump({"a": a, "b": b}, open(os.path.join(bak, "meta.json"), "w", encoding="utf-8"))
    if "--keep-redo" not in sys.argv:
        shutil.rmtree(redo_d, ignore_errors=True)  # corte novo: o que estava para refazer não vale mais

    # tira o trecho [a, b] de cada take que ele cruza (o take pode virar dois)
    new, t, removed = [], 0.0, 0.0
    for s in spec["segments"]:
        fr = s.get("frames") or round((s["b"] - s["a"]) * fps)
        es, ee = t, t + fr / fps
        t = ee
        oa, ob = max(a, es), min(b, ee)
        if ob <= oa:
            new.append(dict(s))
            continue
        sa = s["a"] + (oa - es)
        sb = s["a"] + (ob - es)
        removed += ob - oa
        if sa - s["a"] >= 1 / fps:
            new.append({**s, "b": round(sa, 3)})
        if s["b"] - sb >= 1 / fps:
            new.append({**s, "a": round(sb, 3)})
    has_frames = any("frames" in s for s in spec["segments"])
    has_start = any("editStart" in s for s in spec["segments"])
    t = 0
    for s in new:
        f = round((s["b"] - s["a"]) * fps)
        if has_frames:
            s["frames"] = f
        else:
            s.pop("frames", None)
        if has_start:
            s["editStart"] = round(t / fps, 3)
        t += f
    spec["segments"] = new
    if "totalFrames" in spec:
        spec["totalFrames"] = t + round(spec.get("outro", 0) * fps)
    json.dump(spec, open(seg_p, "w", encoding="utf-8"), ensure_ascii=False, indent=2)

    # palavras inteiras dentro do trecho saem da legenda (o retime jogaria elas na borda)
    ws = doc["captions"]["words"]
    keep = [w for w in ws if not (w["start"] >= a - 0.02 and w["end"] <= b + 0.02)]
    gone = len(ws) - len(keep)
    doc["captions"]["words"] = keep
    json.dump(doc, open(doc_p, "w", encoding="utf-8"), ensure_ascii=False, indent=2)

    r = subprocess.run([sys.executable, os.path.join(ROOT, "tools", "retime.py"), slug, os.path.join(bak, "segments.json"), "--map-words"], cwd=ROOT, capture_output=True, text=True, encoding="utf-8", errors="replace")
    if r.returncode:
        shutil.copyfile(os.path.join(bak, "segments.json"), seg_p)
        shutil.copyfile(os.path.join(bak, "edit.json"), doc_p)
        shutil.rmtree(bak)
        sys.exit("falhou ao reposicionar: " + (r.stderr or r.stdout)[-500:])
    for f in ("peaks.json",):
        try:
            os.remove(os.path.join(ROOT, "out", slug, f))
        except FileNotFoundError:
            pass
    print(f"cortou {removed:.2f} s do vídeo ({gone} palavra{'s' if gone != 1 else ''} da legenda)")


main()
