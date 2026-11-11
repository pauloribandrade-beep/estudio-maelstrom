#!/usr/bin/env python3
"""Catálogo das bibliotecas de som (sem precisar ouvir): nome, tags, duração,
volume, pico, brilho e ataque de cada arquivo. Base para build_sfx.py escolher
várias versões por família com critério.

    sfx_catalog.py                 varre sfx-lib/mixkit e sfx-lib/sonniss-gdc2026 (e o que mais houver)
    sfx_catalog.py --find pop click --max-dur 0.8 --top 20     consulta

Saída: <EDITOR>/sfx-lib/catalog.json
Medidas (nos primeiros 6 s, mono 22 kHz):
  dur      duração total (s)
  rms      volume médio (dBFS) · peak pico (dBFS)
  bright   centroide espectral (Hz): alto = agudo/brilhante, baixo = grave
  attack   tempo até o pico (s): pequeno = começa seco
  tail     tempo do pico até cair 30 dB (s): grande = reverb/cauda longa
"""
import argparse
import json
import os
import re
import subprocess
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(__file__))
from _env import EDITOR, ffmpeg, ffprobe  # noqa: E402

LIB = os.path.join(EDITOR, "sfx-lib")
CAT = os.path.join(LIB, "catalog.json")
EXT = (".wav", ".mp3", ".flac", ".ogg", ".aif", ".aiff")


def features(path):
    r = subprocess.run([ffmpeg(), "-v", "error", "-t", "6", "-i", path, "-ac", "1", "-ar", "22050", "-f", "f32le", "-"],
                       capture_output=True)
    x = np.frombuffer(r.stdout, dtype=np.float32)
    if x.size < 200:
        return None
    peak = float(np.abs(x).max()) + 1e-9
    rms = float(np.sqrt((x ** 2).mean())) + 1e-9
    spec = np.abs(np.fft.rfft(x[: 22050 * 2]))
    freqs = np.fft.rfftfreq(min(x.size, 22050 * 2), 1 / 22050)
    bright = float((spec * freqs).sum() / (spec.sum() + 1e-9))
    env = np.abs(x)
    ip = int(env.argmax())
    attack = ip / 22050
    after = env[ip:]
    below = np.where(after < peak * 0.0316)[0]
    tail = (below[0] / 22050) if below.size else after.size / 22050
    return {"rms": round(20 * np.log10(rms), 1), "peak": round(20 * np.log10(peak), 1), "bright": round(bright),
            "attack": round(attack, 3), "tail": round(float(tail), 2)}


def probe_dur(path):
    try:
        out = subprocess.run([ffprobe(), "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path],
                             capture_output=True, text=True).stdout.strip()
        return round(float(out), 2)
    except Exception:
        return None


def tags_from(name):
    words = re.sub(r"([a-z])([A-Z])", r"\1 \2", name)
    return sorted({w.lower() for w in re.split(r"[^A-Za-z0-9]+", words) if len(w) > 1 and not w.isdigit()})


def scan():
    cat = json.load(open(CAT, encoding="utf-8")) if os.path.exists(CAT) else {}
    mix_idx = {}
    mp = os.path.join(LIB, "mixkit", "index.json")
    if os.path.exists(mp):
        mix_idx = json.load(open(mp, encoding="utf-8"))
    son = {}
    sp = os.path.join(LIB, "sonniss-gdc2026", "names.json")
    if os.path.exists(sp):
        son = json.load(open(sp, encoding="utf-8"))
    n_new = 0
    for root, _, files in os.walk(LIB):
        if "__MACOSX" in root:
            continue
        rroot = os.path.relpath(root, LIB)
        # do Sonniss, só a extração com nomes curtos (x/); o resto é sobra da extração falha
        if rroot.startswith("sonniss-gdc2026") and not rroot.startswith(os.path.join("sonniss-gdc2026", "x")):
            continue
        for f in files:
            if not f.lower().endswith(EXT) or f.startswith("._"):
                continue
            path = os.path.join(root, f)
            rel = os.path.relpath(path, LIB)
            if rel in cat:
                continue
            src = rel.split(os.sep)[0]
            title = os.path.splitext(f)[0]
            tags = tags_from(os.path.relpath(root, LIB) + " " + title)
            if rel in son:
                title = son[rel]["title"]
                tags = sorted(set(tags_from(son[rel]["vendor"] + " " + title)))
            if src == "mixkit":
                e = mix_idx.get(title, {})
                title = e.get("title", title)
                tags = sorted(set(tags_from(title)) | set(e.get("cats", [])))
            feat = features(path)
            if not feat:
                continue
            feat["dur"] = probe_dur(path)
            cat[rel] = {"src": src, "title": title, "tags": tags, **feat}
            n_new += 1
            if n_new % 200 == 0:
                json.dump(cat, open(CAT, "w", encoding="utf-8"), ensure_ascii=False)
                print(f"  {n_new} novos...", flush=True)
    json.dump(cat, open(CAT, "w", encoding="utf-8"), ensure_ascii=False)
    by = {}
    for v in cat.values():
        by[v["src"]] = by.get(v["src"], 0) + 1
    print(f"catálogo: {len(cat)} sons ({n_new} novos) · " + ", ".join(f"{k} {v}" for k, v in sorted(by.items())))


def find(words, exclude=(), max_dur=None, min_dur=None, bright_min=None, bright_max=None, max_attack=None, top=20, src=None):
    cat = json.load(open(CAT, encoding="utf-8"))
    out = []
    for rel, v in cat.items():
        t = set(v["tags"])
        if words and not any(w in t for w in words):
            continue
        if any(w in t for w in exclude):
            continue
        if src and v["src"] != src:
            continue
        d = v.get("dur") or 0
        if max_dur and d > max_dur or min_dur and d < min_dur:
            continue
        if bright_min and v["bright"] < bright_min or bright_max and v["bright"] > bright_max:
            continue
        if max_attack is not None and v["attack"] > max_attack:
            continue
        out.append((rel, v))
    out.sort(key=lambda kv: (-sum(w in kv[1]["tags"] for w in words), kv[1].get("dur") or 0))
    return out[:top]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--find", nargs="*")
    ap.add_argument("--exclude", nargs="*", default=[])
    ap.add_argument("--max-dur", type=float)
    ap.add_argument("--min-dur", type=float)
    ap.add_argument("--bright-min", type=float)
    ap.add_argument("--bright-max", type=float)
    ap.add_argument("--max-attack", type=float)
    ap.add_argument("--src")
    ap.add_argument("--top", type=int, default=20)
    a = ap.parse_args()
    if a.find is None:
        scan()
        return
    for rel, v in find(a.find, a.exclude, a.max_dur, a.min_dur, a.bright_min, a.bright_max, a.max_attack, a.top, a.src):
        print(f"{v['dur'] or 0:5.2f}s br{v['bright']:>5} at{v['attack']:.2f} tl{v['tail']:.1f} | {v['src']}: {v['title'][:60]}  [{rel}]")


if __name__ == "__main__":
    main()
