#!/usr/bin/env python3
"""Takes escolhidos + whisper.json -> legendas no tempo da EDIÇÃO.
Adaptado de talking-head-reel (MIT).

    cut.py <slug> [--fix "Zale=ZALE"]... [--phrase "clínica previsível=Clínica Previsível"]...

Lê   src/videos/<slug>/segments.json  (escrito à mão a partir do takes.txt)
     {"fps": 30, "outro": 2.5, "segments": [{"a": 10.0, "b": 33.0, "note": "..."}]}
Grava src/videos/<slug>/words.json e completa segments.json com frames.

Palavras-marcador (SALVA/CORTA) nunca entram na legenda, mesmo que um take
tenha pegado a ponta delas. Imprime a linha do tempo compacta; confira o
texto final: palavra faltando = corte no meio dela.
"""
import argparse
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(__file__))
from _env import EDITOR  # noqa: E402

MARKER = re.compile(r"^(salva|salvo|salvou|salvar|save|corta|cortar|cortou)$", re.I)


def silences(slug, gap, noise):
    """Silêncios (início, fim) do áudio da gravação, com cache em silences.json.
    noise = "auto": mede o ruído de fundo (percentil 10 do RMS em janelas de
    50 ms) e usa ruído + 8 dB como limiar. Cada gravação tem um fundo
    diferente (lapela, WhatsApp, ar-condicionado), por isso não é fixo."""
    import numpy as np
    from faster_whisper.audio import decode_audio
    d = os.path.join(EDITOR, "src", "videos", slug)
    cache = os.path.join(d, "silences.json")
    key = f"{gap}:{noise}"
    if os.path.exists(cache):
        c = json.load(open(cache, encoding="utf-8"))
        if c.get("key") == key:
            return c["sil"]
    x = decode_audio(os.path.join(EDITOR, "public", "videos", slug, "ig1080.mp4"), sampling_rate=16000)
    hop = 800  # 50 ms
    n = len(x) // hop
    rms = 20 * np.log10(np.sqrt((x[: n * hop].reshape(n, hop) ** 2).mean(axis=1)) + 1e-9)
    thr = float(np.percentile(rms, 10) + 8) if noise == "auto" else float(noise)
    quiet = rms < thr
    sil, i = [], 0
    while i < n:
        if quiet[i]:
            j = i
            while j < n and quiet[j]:
                j += 1
            if (j - i) * 0.05 >= gap:
                sil.append([round(i * 0.05, 2), round(j * 0.05, 2)])
            i = j
        else:
            i += 1
    print(f"(limiar de silêncio {thr:.1f} dB, {len(sil)} pausas > {gap}s na gravação inteira)")
    json.dump({"key": key, "thr": thr, "sil": sil}, open(cache, "w", encoding="utf-8"))
    return sil

def core(w):
    return w.rstrip(".,!?;:")


def punct(w):
    return w[len(core(w)):]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("slug")
    ap.add_argument("--fix", action="append", default=[])
    ap.add_argument("--phrase", action="append", default=[])
    ap.add_argument("--full", action="store_true", help="imprimir o texto completo de cada take")
    ap.add_argument("--split-gap", type=float, default=0.0, help="dividir takes em silêncios do áudio maiores que N s (ex.: 0.9)")
    ap.add_argument("--noise", default="auto", help="limiar de silêncio: auto (mede o fundo) ou um número em dB")
    a = ap.parse_args()

    d = os.path.join(EDITOR, "src", "videos", a.slug)
    data = json.load(open(os.path.join(d, "whisper.json"), encoding="utf-8"))
    spec_path = os.path.join(d, "segments.json")
    spec = json.load(open(spec_path, encoding="utf-8"))
    fps = spec.get("fps", 30)
    segs = spec["segments"]
    for s in segs:
        if s["b"] <= s["a"]:
            sys.exit(f"take {s} tem b <= a")

    all_words = [{"word": w["word"].strip(), "start": w["start"], "end": w["end"]}
                 for s in data["segments"] for w in s.get("words", [])]
    all_words = [w for w in all_words if not MARKER.match(core(w["word"]))]

    if a.split_gap:
        # divide cada take onde o ÁUDIO fica em silêncio > split_gap. (O whisper
        # estica o fim de uma palavra até a próxima, então pausa não aparece
        # nas palavras; por isso o silencedetect.) Mantém 0,15 s de respiro.
        sil = silences(a.slug, a.split_gap, a.noise)
        new = []
        for s in segs:
            start = s["a"]
            for s0, s1 in sil:
                if s0 > start + 0.3 and s1 < s["b"] - 0.3:
                    new.append({"a": round(start, 2), "b": round(s0 + 0.15, 2), "note": s.get("note", "")})
                    start = s1 - 0.12
            new.append({"a": round(start, 2), "b": s["b"], "note": s.get("note", "")})
        if len(new) != len(segs):
            print(f"(pausas > {a.split_gap}s no áudio: {len(segs)} takes viraram {len(new)})")
        segs = spec["segments"] = new

    out, off = [], 0.0
    print(" edição   orig a -> orig b   dur   texto")
    for i, s in enumerate(segs):
        a0, b0 = s["a"], s["b"]

        def inside(w):
            we = max(w["end"], w["start"] + 0.06)  # o whisper às vezes dá duração zero a palavras curtas
            ov = min(we, b0) - max(w["start"], a0)
            return ov > 0 and ov >= min(0.1, 0.5 * (we - w["start"]))

        ws = [w for w in all_words if inside(w)]
        if not ws:
            sys.exit(f"take {i} ({a0}-{b0}) sem palavras; confira a/b no takes.txt")
        for k, w in enumerate(ws):
            text = w["word"]
            if k == 0 and text[:1].islower() and (not out or punct(out[-1]["word"]) in (".", "?", "!")):
                text = text[:1].upper() + text[1:]
            out.append({"word": text, "start": round(off + max(w["start"], a0) - a0, 3),
                        "end": round(off + min(w["end"], b0) - a0, 3), "orig": w["start"]})
        txt = " ".join(w["word"] for w in ws)
        if not a.full and len(txt) > 70:
            txt = txt[:67] + "..."
        print(f"{off:7.2f}  {a0:7.2f} -> {b0:7.2f}  {b0 - a0:5.2f}  {txt}")
        s["frames"] = round((b0 - a0) * fps)
        s["editStart"] = round(off, 3)
        off += s["frames"] / fps

    fixes = [tuple(f.split("=", 1)) for f in a.fix]
    for w in out:
        for old, new in fixes:
            if core(w["word"]) == old:
                w["word"] = new + punct(w["word"])
    for p in a.phrase:
        old, new = p.split("=", 1)
        old, new = [core(x) for x in old.lower().split()], new.split()
        i = 0
        while i + len(old) <= len(out):
            if [core(x["word"]).lower() for x in out[i:i + len(old)]] == old:
                win = out[i:i + len(old)]
                end_p = punct(win[-1]["word"])
                if not punct(new[-1]):
                    new = new[:-1] + [new[-1] + end_p]
                t0, t1 = win[0]["start"], win[-1]["end"]
                step = (t1 - t0) / len(new)
                # tamanhos diferentes: o tempo do trecho é dividido igualmente entre as palavras novas
                rep = [{"word": wd, "start": round(t0 + k * step, 3), "end": round(t0 + (k + 1) * step, 3), "orig": win[0]["orig"]}
                       for k, wd in enumerate(new)]
                out[i:i + len(old)] = rep
                i += len(rep)
            else:
                i += 1
    merged = []
    for w in out:  # gagueira imediata vira uma palavra só
        if merged and core(merged[-1]["word"]).lower() == core(w["word"]).lower() and w["start"] - merged[-1]["end"] < 0.3:
            merged[-1]["end"] = w["end"]
            continue
        merged.append(w)

    total = off + spec.get("outro", 0)
    spec["totalFrames"] = round(total * fps)
    json.dump(merged, open(os.path.join(d, "words.json"), "w", encoding="utf-8"), ensure_ascii=False)
    json.dump(spec, open(spec_path, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print(f"\n{len(segs)} takes, {off:.2f}s de fala + {spec.get('outro', 0)}s outro = {total:.2f}s ({spec['totalFrames']} frames)")
    print("texto final:\n" + " ".join(w["word"] for w in merged))


if __name__ == "__main__":
    main()
