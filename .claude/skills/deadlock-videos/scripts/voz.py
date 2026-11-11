"""Monta a voz do vídeo a partir dos takes escolhidos: SEGMENTOS EDITÁVEIS sobre a gravação inteira.

Uso: python voz.py <slug>

Entra: out/<slug>/takes.json e out/<slug>/pedacos.json (do pedacos.py)
  {
    "tempo": 1.1,                      fala acelerada (1.0 a 1.1; 1.1 é o padrão dos vídeos de Deadlock)
    "takes": [[0.00, 6.40, "gancho"], [7.50, 10.95, "..."]],   início e fim NO BRUTO, em ordem
    "fix": {"Blizz": "Blies"}          palavra que a transcrição errou -> certa (só na legenda)
  }
Sai: public/videos/<slug>/carrier.wav (bruto acelerado e nivelado), out/<slug>/voz_blocks.json (segmentos) e
     out/<slug>/words.json (palavras no tempo da edição), que o montar.py usa.

Dentro de cada take, pausa maior que GAP (0,30 s) sai, deixando PAD (0,11 s) de cada lado: tira o respiro sem
picotar. Os cortes entre takes ficam secos. A pessoa vê e ajusta cada corte no Estúdio.
"""
import json, os, re, subprocess, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _caminhos import pastas  # noqa: E402

FPS = 30
GAP, PAD = 0.30, 0.11  # pausa interna maior que GAP é apertada, deixando PAD de cada lado
EDGE = 0.05            # folga nas pontas do take (o fim da palavra não pode ser comido)


def main():
    slug = sys.argv[1]
    V, O = pastas(slug)
    src = V + "bruto.wav"
    cfg = json.load(open(O + "takes.json", encoding="utf-8"))
    TEMPO, TAKES, FIX = cfg.get("tempo", 1.1), cfg["takes"], cfg.get("fix", {})

    r = subprocess.run(["ffmpeg", "-nostdin", "-i", src, "-af", "silencedetect=noise=-45dB:d=0.12", "-f", "null", "-"], capture_output=True, text=True)
    sil = list(zip([float(x) for x in re.findall(r"silence_start: ([0-9.]+)", r.stderr)],
                   [float(x) for x in re.findall(r"silence_end: ([0-9.]+)", r.stderr)]))
    raw = []
    for a, b, nota in TAKES:
        cur, b0 = max(0, a - EDGE), b + EDGE
        for s0, s1 in sil:
            if s0 > cur + 0.05 and s1 < b0 - 0.05 and (s1 - s0) > GAP:
                raw.append((cur, s0 + PAD, nota))
                cur = s1 - PAD
        raw.append((cur, b0, nota))

    segs, t = [], 0.0
    for a, b, nota in raw:
        ca = round(a / TEMPO, 3)
        fr = int(round((b - a) / TEMPO * FPS))
        segs.append({"a": ca, "b": round(ca + fr / FPS, 3), "note": nota, "frames": fr, "editStart": round(t, 3)})
        t += fr / FPS
    dur = round(t, 3)

    subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", src, "-af", f"atempo={TEMPO},loudnorm=I=-16:TP=-1.5:LRA=9",
                    "-ar", "48000", "-ac", "2", V + "carrier.wav"], check=True)
    json.dump({"duration": dur, "tempo": TEMPO, "segments": segs}, open(O + "voz_blocks.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)

    def snap(t):
        """tempo no bruto -> tempo na edição; o que caiu numa pausa apertada gruda no segmento mais perto"""
        c = t / TEMPO
        best, bd = None, 1e9
        for g in segs:
            g1 = g["a"] + g["frames"] / FPS
            d = 0 if g["a"] <= c < g1 else min(abs(c - g["a"]), abs(c - g1))
            if d < bd:
                bd, best = d, g["editStart"] + min(max(c, g["a"]), g1 - 0.001) - g["a"]
        return best

    no_take = lambda t: any(a - 0.08 <= t <= b + 0.08 for a, b, _ in TAKES)
    P = json.load(open(O + "pedacos.json", encoding="utf-8"))
    out = []
    for w in sorted((w for c in P for w in c["words"]), key=lambda w: w["s"]):
        txt = FIX.get(w["w"].strip(), w["w"].strip())
        if not txt or not no_take((w["s"] + w["e"]) / 2):
            continue
        out.append({"w": txt, "s": round(snap(w["s"]), 3), "e": round(snap(max(w["s"], w["e"] - 0.001)), 3), "b": round(w["s"], 2)})
    out.sort(key=lambda x: x["s"])
    m = []
    for w in out:  # pedaços que o whisper separa: "%", "-se"
        if m and (w["w"] == "%" or (w["w"][:1] in "-%" and len(w["w"]) > 1)):
            m[-1]["w"] += w["w"]; m[-1]["e"] = w["e"]; continue
        m.append(w)
    for a, b in zip(m, m[1:]):
        a["e"] = min(a["e"], b["s"])
    json.dump(m, open(O + "words.json", "w", encoding="utf-8"), ensure_ascii=False, indent=0)
    print(f"duração {dur:.2f} s · {len(segs)} segmentos · {len(m)} palavras\n")
    print(" ".join(x["w"] for x in m))


if __name__ == "__main__":
    main()
