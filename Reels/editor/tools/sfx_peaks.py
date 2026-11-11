# Onde fica o "golpe" de cada efeito: o instante (a partir do começo do arquivo) em que o som chega a 70% do seu pico.
# Muitos efeitos têm silêncio ou subida no começo; para o golpe cair NO movimento da tela, o som tem que começar
# esse tanto antes (pedido do Paulo, 08/10/2026: "o pico tem que estar sincronizado com o que aparece na tela").
# Uso: python tools/sfx_peaks.py [slug]  → out/sfx_peaks.json  {src: {"hit": s, "peak": s, "dur": s}}
import json, os, subprocess, sys
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
slug = sys.argv[1] if len(sys.argv) > 1 else "hl3_M01"
doc = json.load(open(os.path.join(ROOT, "src", "videos", slug, "edit.json"), encoding="utf-8"))
dst = os.path.join(ROOT, "out", "sfx_peaks.json")
cache = json.load(open(dst, encoding="utf-8")) if os.path.exists(dst) else {}
srcs = sorted({x.get("fxSrc") or x["src"] for x in doc["sounds"]})
srcs += [x for x in sys.argv[2:] if x not in srcs]  # arquivos extras (ainda fora do edit.json)
SR = 16000
n = 0
for src in srcs:
    if src in cache:
        continue
    path = os.path.join(ROOT, "public", src)
    if not os.path.exists(path):
        continue
    raw = subprocess.run(["ffmpeg", "-v", "error", "-t", "12", "-i", path, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True).stdout
    x = np.abs(np.frombuffer(raw, np.float32))
    if len(x) < 32:
        continue
    w = int(SR * 0.005)
    env = x[: len(x) // w * w].reshape(-1, w).max(1)
    mx = float(env.max())
    if mx <= 1e-6:
        continue
    hit = int(np.argmax(env >= 0.7 * mx)) * w / SR
    peak = int(np.argmax(env)) * w / SR
    cache[src] = {"hit": round(hit, 3), "peak": round(peak, 3), "dur": round(len(x) / SR, 3)}
    n += 1
tmp = dst + ".tmp"
json.dump(cache, open(tmp, "w", encoding="utf-8"), indent=1)
os.replace(tmp, dst)
print(f"{n} medidos · {len(cache)} no total")
