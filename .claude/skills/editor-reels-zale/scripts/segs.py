#!/usr/bin/env python3
"""Texto COMPLETO de segmentos do whisper (o takes.txt corta em 110
caracteres). Use só nos segmentos longos ou suspeitos de repetição.

    segs.py <slug> 4 5 25 27          por índice (o # do takes.txt)
    segs.py <slug> --min 8            todos com mais de 8 s
    segs.py <slug> --words 4          com o tempo de cada palavra (para achar a emenda)
"""
import argparse
import json
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from _env import EDITOR  # noqa: E402


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("slug")
    ap.add_argument("idx", nargs="*", type=int)
    ap.add_argument("--min", type=float)
    ap.add_argument("--words", nargs="*", type=int, default=[])
    a = ap.parse_args()
    d = json.load(open(os.path.join(EDITOR, "src", "videos", a.slug, "whisper.json"), encoding="utf-8"))
    segs = [s for s in d["segments"] if s["text"]]
    for i, s in enumerate(segs):
        if i in a.idx or (a.min is not None and s["end"] - s["start"] > a.min):
            print(f"{i} [{s['start']:.2f}-{s['end']:.2f}] {s['text']}")
        if i in a.words:
            print(f"{i} palavras: " + " ".join(f"{w['word']}@{w['start']:.2f}" for w in s["words"]))


if __name__ == "__main__":
    main()
