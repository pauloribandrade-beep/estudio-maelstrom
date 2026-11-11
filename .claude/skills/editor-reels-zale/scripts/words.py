#!/usr/bin/env python3
"""Tempo ORIGINAL das palavras pedidas (para cravar efeitos na palavra).

    words.py <slug> pronto valor condução pensar [--in 11.8-21.7]

Imprime uma linha por ocorrência: palavra, início, fim. Só dentro dos takes
escolhidos (segments.json), ou dentro de --in. Muito mais barato do que abrir
o whisper.json.
"""
import argparse
import json
import os
import sys
import unicodedata

sys.path.insert(0, os.path.dirname(__file__))
from _env import EDITOR  # noqa: E402


def norm(s):
    s = unicodedata.normalize("NFD", s.lower().strip(".,!?;:\"'"))
    return "".join(c for c in s if unicodedata.category(c) != "Mn")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("slug")
    ap.add_argument("words", nargs="+")
    ap.add_argument("--in", dest="win")
    a = ap.parse_args()
    d = os.path.join(EDITOR, "src", "videos", a.slug)
    data = json.load(open(os.path.join(d, "whisper.json"), encoding="utf-8"))
    if a.win:
        lo, hi = map(float, a.win.split("-"))
        wins = [(lo, hi)]
    else:
        p = os.path.join(d, "segments.json")
        wins = [(s["a"], s["b"]) for s in json.load(open(p, encoding="utf-8"))["segments"]] if os.path.exists(p) else [(0, 1e9)]
    want = {norm(w) for w in a.words}
    for s in data["segments"]:
        for w in s.get("words", []):
            if norm(w["word"]) in want and any(lo <= w["start"] <= hi for lo, hi in wins):
                print(f"{w['word']:<14} {w['start']:7.2f} {w['end']:7.2f}")


if __name__ == "__main__":
    main()
