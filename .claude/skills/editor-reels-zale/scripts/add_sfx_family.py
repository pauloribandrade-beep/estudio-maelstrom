#!/usr/bin/env python3
"""Acrescenta famílias de som a public/sfx SEM refazer a biblioteca inteira (o build_sfx.py reescreve o
manifest e perderia as famílias adicionadas à mão, como step/fly/flap). Usa o mesmo corte/nivelamento.

    add_sfx_family.py            (as famílias estão em NEW abaixo)
"""
import json
import os
import subprocess

import numpy as np

from build_sfx import LIB, MIX, OUT, SON, cut, resolve  # noqa: F401
from _env import EDITOR, ffmpeg

BOOKS = f"{SON}/344_Audio_Antique_Books"
# 2026-09-28, vídeo do iPhone: o "glass" repetia o tempo todo (pedido do Paulo: trocar e buscar outra biblioteca)
# e a virada de página misturava dois sons. ui = interface moderna (Mixkit, licença livre); flip = UMA gravação
# real de páginas (Sonniss GDC, royalty-free) cortada em viradas curtas e parecidas.
NEW = {
    "ui": [(f"{MIX}/3120.wav", 0.0, 0.5), (f"{MIX}/2618.wav", 0.07, 0.5), (f"{MIX}/3123.wav", 0.0, 0.75)],
    # iPhone caindo na mesa e a tela trincando (vídeo do iPhone, 44 s): Mixkit 759, pico no primeiro instante
    "crack": [(f"{MIX}/759.wav", 0.0, 0.9)],
    "flip": [(f"{BOOKS}/PAPRMisc_Antique_Books_Flicking_Through_Pages_*", 0.2, 0.3), (f"{BOOKS}/PAPRMisc_Antique_Books_Flicking_Through_Pages_*", 0.5, 0.28)],
}


def peak_of(path):
    x = np.frombuffer(subprocess.run([ffmpeg(), "-v", "error", "-i", path, "-ac", "1", "-ar", "22050", "-f", "f32le", "-"], capture_output=True).stdout, np.float32)
    hop = 441 if x.size >= 882 else 32
    k = x.size // hop
    r = np.sqrt((x[: k * hop].reshape(k, hop) ** 2).mean(1))
    return round(float(r.argmax()) * hop / 22050, 3)


def main():
    man_p = os.path.join(EDITOR, "src", "lib", "sfx-manifest.json")
    peaks_p = os.path.join(EDITOR, "src", "lib", "sfx-peaks.json")
    man = json.load(open(man_p))
    peaks = json.load(open(peaks_p))
    for fam, items in NEW.items():
        n = 0
        for src, st, du in items:
            src = resolve(src)
            dst = os.path.join(OUT, f"{fam}_{n}.wav")
            if src and cut(src, st, du, dst):
                peaks[f"{fam}_{n}"] = peak_of(dst)
                n += 1
        man[fam] = n
        print(f"{fam:<6} {n} versões")
    json.dump(man, open(man_p, "w"), indent=1)
    json.dump(man, open(os.path.join(OUT, "manifest.json"), "w"), indent=1)
    json.dump(peaks, open(peaks_p, "w"), indent=0)
    lic = os.path.join(OUT, "LICENSE-sfx.txt")
    txt = open(lic, encoding="utf-8").read()
    add = "- ui_*.wav: Mixkit (mixkit.co, Mixkit Sound Effects Free License) 3120, 2618, 3123.\n- flip_*.wav: Sonniss GDC 2026 Game Audio Bundle (royalty-free), 344 Audio - Antique Books.\n"
    if "ui_*.wav" not in txt:
        open(lic, "a", encoding="utf-8").write(add)


if __name__ == "__main__":
    main()
