# Troca de enquadramento (zoom.snaps) só nos cortes com pulo grande de imagem.
# Mede a diferença entre o último quadro antes do corte e o primeiro depois.
# Uso: python tools/snaps.py <slug> [--limiar 12.5]
import json, os, subprocess, sys
import numpy as np
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
slug = sys.argv[1]
thr = float(sys.argv[sys.argv.index("--limiar") + 1]) if "--limiar" in sys.argv else 12.5
top = int(sys.argv[sys.argv.index("--max") + 1]) if "--max" in sys.argv else 5  # regra do usuário: poucos cortes com zoom
d = os.path.join(ROOT, "src", "videos", slug)
spec = json.load(open(os.path.join(d, "segments.json"), encoding="utf-8"))
doc = json.load(open(os.path.join(d, "edit.json"), encoding="utf-8"))
src = os.path.join(ROOT, "public", "videos", slug, "ig1080.mp4")
tmp = os.path.join(ROOT, "out", "tmp", "snapfr.png")
def frame(t):
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", str(t), "-i", src, "-frames:v", "1", "-vf", "scale=270:480", tmp], check=True)
    return np.array(Image.open(tmp).convert("L")).astype(float)
S = spec["segments"]
starts, acc = [], 0
for s in S:
    starts.append(round(acc / doc["fps"], 3))
    acc += s["frames"]
jumps = [(i + 1, np.abs(frame(S[i]["b"] - 0.034) - frame(S[i + 1]["a"])).mean()) for i in range(len(S) - 1)]
big = sorted(i for i, j in sorted((x for x in jumps if x[1] >= thr), key=lambda x: -x[1])[:top])
snaps = [z for z in doc["zoom"]["snaps"] if z["t"] < 0.05] or [{"t": 0.0, "z": 1.0}]
snaps += [{"t": starts[i], "z": 0} for i in big]
snaps.sort(key=lambda z: z["t"])
for k, z in enumerate(snaps):
    z["z"] = 1.0 if k % 2 == 0 else 1.04
doc["zoom"]["snaps"] = snaps
json.dump(doc, open(os.path.join(d, "edit.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"{len(big)} cortes com pulo grande: {big}")
