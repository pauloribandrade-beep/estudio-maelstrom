#!/usr/bin/env python3
"""Renderiza quadros de conferência nos segundos ORIGINAIS pedidos (através
dos takes) e junta tudo numa única imagem pequena.

    stills.py <slug> <Composicao> 12.7 14.8 22.6 [--edit-frames 0 300] [--scale 0.25]

Saída: <EDITOR>/out/<slug>/stills.png  (uma linha de quadros).
ECONOMIA DE TOKENS: escala padrão 0.25 (270x480 por quadro) e no máximo
8 quadros por imagem. Olhe só essa imagem, não os quadros soltos.
"""
import argparse
import glob
import json
import os
import subprocess
import sys

sys.path.insert(0, os.path.dirname(__file__))
from _env import EDITOR, FPS, ffmpeg, npx  # noqa: E402


def edit_frame(segs, t):
    start = 0
    for s in segs:
        if s["a"] - 1e-6 <= t <= s["b"] + 1e-6:
            return start + round((t - s["a"]) * FPS)
        start += s["frames"]
    sys.exit(f"{t}s não está em nenhum take")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("slug")
    ap.add_argument("comp")
    ap.add_argument("secs", nargs="*", type=float)
    ap.add_argument("--edit-frames", nargs="*", type=int, default=[])
    ap.add_argument("--scale", type=float, default=0.25)
    a = ap.parse_args()

    segs = json.load(open(os.path.join(EDITOR, "src", "videos", a.slug, "segments.json"), encoding="utf-8"))["segments"]
    frames = [edit_frame(segs, t) for t in a.secs] + a.edit_frames
    frames = frames[:8]
    out = os.path.join(EDITOR, "out", a.slug)
    os.makedirs(out, exist_ok=True)
    for f in glob.glob(os.path.join(out, "st_*.png")):
        os.remove(f)
    for i, fr in enumerate(frames):
        subprocess.run([npx(), "remotion", "still", "src/index.ts", a.comp, os.path.join(out, f"st_{i:02d}.png"),
                        f"--frame={fr}", f"--scale={a.scale}", "--log=error"], cwd=EDITOR, check=True)
    subprocess.run([ffmpeg(), "-v", "error", "-y", "-i", os.path.join(out, "st_%02d.png"),
                    "-vf", f"tile={len(frames)}x1:padding=6:color=white", "-frames:v", "1", os.path.join(out, "stills.png")], check=True)
    for f in glob.glob(os.path.join(out, "st_*.png")):
        os.remove(f)
    print(f"{len(frames)} quadros (frames {frames}) -> out/{a.slug}/stills.png")


if __name__ == "__main__":
    main()
