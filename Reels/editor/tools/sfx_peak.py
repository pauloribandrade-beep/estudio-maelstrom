"""Mede onde o som "acontece" e diz quando ele tem que começar para cair no quadro certo.

Uso:
  python tools/sfx_peak.py public/sfx/hl3/whoosh.wav public/sfx/hl3/hit.wav ...
  python tools/sfx_peak.py public/sfx/hl3/hit.wav --at 16.85        # evento na tela em 16,85 s

Imprime, para cada arquivo: pico (envelope RMS de 50 ms), início audível (10% do pico),
duração, % de energia abaixo de 150 Hz (> 50% = embolado/"boom") e, com --at,
o `start` para o pico cair no evento. Regra (vinda das skills públicas de motion/sound design):
todo som entra pelo PICO MEDIDO, não pelo começo do arquivo. Whoosh de chegada: pico no fim do
movimento; recuo: início junto do começo do movimento; batida: pico no quadro do corte.
"""
import subprocess
import sys

import numpy as np


def analyze(path: str):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", "8000", "-f", "f32le", "-"], capture_output=True).stdout
    x = np.frombuffer(raw, np.float32)
    if len(x) < 400:
        return None
    r = np.sqrt(np.convolve(x**2, np.ones(400) / 400, "same"))
    spec = np.abs(np.fft.rfft(x))
    freq = np.fft.rfftfreq(len(x), 1 / 8000)
    return {
        "peak": r.argmax() / 8000,
        "onset": np.argmax(r > r.max() * 0.1) / 8000,
        "dur": len(x) / 8000,
        "low": spec[freq < 150].sum() / spec.sum() * 100,
    }


def main():
    args = sys.argv[1:]
    at = None
    if "--at" in args:
        i = args.index("--at")
        at = float(args[i + 1])
        del args[i : i + 2]
    for p in args:
        a = analyze(p)
        if not a:
            print(f"{p}: curto demais")
            continue
        line = f"{p.split('/')[-1]:34} pico {a['peak']:5.2f}s  início {a['onset']:5.2f}s  dur {a['dur']:5.2f}s  grave {a['low']:3.0f}%"
        if at is not None:
            line += f"  -> start {at - a['peak']:.3f}"
        print(line)


if __name__ == "__main__":
    main()
