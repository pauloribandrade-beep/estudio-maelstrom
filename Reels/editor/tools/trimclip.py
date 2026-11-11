# Estica ou encolhe a borda de um CLIPE da gravação (um take do segments.json), como no CapCut,
# com ripple: o que vem depois anda junto. Base do "puxar a borda do clipe" na trilha Vídeo do Estúdio.
# Uso: python tools/trimclip.py <slug> <i> <a|b> <delta_s> [--solo]
#   i       índice do clipe (0 = primeiro)
#   a|b     borda: a = começo do clipe, b = fim do clipe
#   delta   segundos na gravação; b +0.4 = mostra 0.4 s a mais no fim; a -0.4 = começa 0.4 s antes
#   --solo  só a legenda acompanha; cenas, sons, zoom e marcadores ficam onde estão
# Guarda segments.json + edit.json de antes em out/<slug>/cuts/<stamp>/ (mesma pilha do "Desfazer corte").
# Regra da emenda: o que COMEÇA exatamente na emenda (a cena seguinte, o zoom do corte, a primeira palavra
# do clipe seguinte) vai junto com o clipe seguinte; o que TERMINA nela fica com o clipe de antes.
import json, os, re, shutil, subprocess, sys, time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EPS = 0.07  # ~2 quadros: o que está colado na emenda conta como "na emenda"


def src_duration(doc):
    p = os.path.join(ROOT, "public", doc["video"]["src"])
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p], capture_output=True, text=True)
    try:
        return float(r.stdout.strip())
    except ValueError:
        return 1e9


def main():
    args = [x for x in sys.argv[1:] if not x.startswith("--")]
    slug, i, side, delta = args[0], int(args[1]), args[2], float(args[3])
    solo = "--solo" in sys.argv
    vd = os.path.join(ROOT, "src", "videos", slug)
    seg_p = os.path.join(vd, "segments.json")
    doc_p = os.path.join(vd, "edit.json")
    spec = json.load(open(seg_p, encoding="utf-8"))
    doc = json.load(open(doc_p, encoding="utf-8"))
    fps = spec.get("fps", 30)
    segs = spec["segments"]
    if not 0 <= i < len(segs) or side not in ("a", "b"):
        sys.exit("clipe ou borda inválida")
    g = segs[i]
    fr0 = g.get("frames") or round((g["b"] - g["a"]) * fps)
    e0 = sum((s.get("frames") or round((s["b"] - s["a"]) * fps)) for s in segs[:i]) / fps  # começo do clipe na edição
    e1 = e0 + fr0 / fps  # fim do clipe na edição

    # encaixa no quadro e respeita os limites (clipe com pelo menos 3 quadros, dentro da gravação)
    dfr = round(delta * fps)
    if side == "b":
        dfr = max(dfr, 3 - fr0)
        dfr = min(dfr, int((src_duration(doc) - g["a"]) * fps) - fr0)
    else:
        dfr = -max(-dfr, 3 - fr0)  # encolher o começo até sobrar 3 quadros
        dfr = max(dfr, -int(g["a"] * fps))  # não passa do começo da gravação
    if dfr == 0:
        sys.exit("nada mudou")
    d = dfr / fps

    # milissegundos no nome: dois cortes no mesmo segundo gravavam na MESMA pasta e o desfazer pulava um (05/11)
    stamp = time.strftime("%Y%m%d-%H%M%S") + "-%03d" % (int(time.time() * 1000) % 1000)
    bak = os.path.join(ROOT, "out", slug, "cuts", stamp)
    os.makedirs(bak, exist_ok=True)
    shutil.copyfile(seg_p, os.path.join(bak, "segments.json"))
    shutil.copyfile(doc_p, os.path.join(bak, "edit.json"))
    shutil.rmtree(os.path.join(ROOT, "out", slug, "cuts-redo"), ignore_errors=True)  # ajuste novo: o refazer não vale mais

    if side == "b":
        g["frames"] = fr0 + dfr
        g["b"] = round(g["a"] + g["frames"] / fps, 3)
        J = e1  # emenda com o próximo clipe
        grow = d  # tempo que entra (+) ou sai (-) da edição a partir de J
    else:
        g["a"] = round(g["a"] + d, 3)
        g["frames"] = fr0 - dfr
        g["b"] = round(g["a"] + g["frames"] / fps, 3)
        J = e0
        grow = -d  # começar antes = entra tempo novo no começo do clipe
    t = 0
    for s in segs:
        if "frames" not in s:
            s["frames"] = round((s["b"] - s["a"]) * fps)
        s["editStart"] = round(t / fps, 3)
        t += s["frames"]
    if "totalFrames" in spec:
        spec["totalFrames"] = t + round(spec.get("outro", 0) * fps)

    # ripple a partir da emenda J
    #  b: o fim do clipe é J. Esticar insere `grow` em J; encolher tira [J+grow, J].
    #  a: o começo do clipe é J. Começar antes insere `grow` em J (conteúdo novo entra antes do clipe
    #     antigo); começar depois tira [J, J-grow].
    lo, hi = (J + grow, J) if side == "b" else (J, J - grow)  # trecho que some (só quando grow < 0)

    def mv(x, kind):
        # kind: "start" (algo começa em x), "end" (algo termina em x), "cut" (ponto do corte: zoom de emenda)
        if grow >= 0:
            if x > J + EPS:
                return round(x + grow, 3)
            if abs(x - J) < EPS:
                if kind == "start" or (kind == "cut" and side == "b"):
                    return round(x + grow, 3)
            return round(x, 3)
        if x <= lo + EPS:
            return round(x, 3)
        if x >= hi - EPS:
            return round(max(lo, x + grow), 3)
        return round(lo, 3)

    if grow < 0:  # palavras inteiras no trecho que some saem da legenda
        doc["captions"]["words"] = [w for w in doc["captions"]["words"] if not (w["start"] >= lo - EPS and w["end"] <= hi + EPS)]
    for w in doc["captions"]["words"]:
        w["start"], w["end"] = mv(w["start"], "start"), mv(w["end"], "end")
        if w["end"] <= w["start"]:
            w["end"] = round(w["start"] + 1 / fps, 3)
    if not solo:
        for s in doc["scenes"]:
            def to_abs(v, key=""):
                # tempos relativos da cena (at, ...At) -> absolutos, para andar junto
                if isinstance(v, dict):
                    return {k: to_abs(x, k) for k, x in v.items()}
                if isinstance(v, list):
                    return [to_abs(x) for x in v]
                if isinstance(v, (int, float)) and not isinstance(v, bool) and re.match(r"^(at\d*|.*At\d*)$", key):
                    return ("__abs__", s["start"] + v)
                return v

            props_abs = to_abs(s["props"])
            # bordas de cena na emenda seguem o corte: esticar o fim estica a cena de antes e empurra a de depois
            ns, ne = mv(s["start"], "cut"), mv(s["end"], "cut")

            def back(v):
                if isinstance(v, tuple) and v and v[0] == "__abs__":
                    return round(max(0.0, mv(v[1], "start") - ns), 3)
                if isinstance(v, dict):
                    return {k: back(x) for k, x in v.items()}
                if isinstance(v, list):
                    return [back(x) for x in v]
                return v

            s["props"] = back(props_abs)
            s["start"], s["end"] = ns, max(ne, round(ns + 1 / fps, 3))
        for s in doc["sounds"]:
            s["start"] = mv(s["start"], "start")
        for z in doc["zoom"]["snaps"]:
            z["t"] = mv(z["t"], "cut")
        for p in doc["zoom"]["pushes"]:
            p["t"] = mv(p["t"], "start")
            if p["until"] != "end":
                p["until"] = mv(p["until"], "end")
        for m in doc.get("markers") or []:
            m["t"] = mv(m["t"], "start")
    doc["duration"] = round(t / fps + spec.get("outro", 0), 3)

    json.dump(spec, open(seg_p, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    json.dump(doc, open(doc_p, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    try:
        os.remove(os.path.join(ROOT, "out", slug, "peaks.json"))
    except FileNotFoundError:
        pass
    que = "esticou" if grow > 0 else "encolheu"
    onde = "o fim" if side == "b" else "o começo"
    print(f"{que} {onde} do clipe {i + 1} em {abs(d):.2f} s" + (" (só a legenda acompanhou)" if solo else ""))


main()
