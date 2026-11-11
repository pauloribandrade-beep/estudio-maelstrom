# Marca o trecho que o Claude acabou de editar: o Estúdio leva o cursor e a timeline até lá (e o botão ⌖ volta).
# Uso: python tools/focus.py <slug> <início_s> <fim_s> "rótulo"
import json, os, sys, time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
slug, a, b = sys.argv[1], float(sys.argv[2]), float(sys.argv[3])
label = sys.argv[4] if len(sys.argv) > 4 else "edição"
d = os.path.join(ROOT, "out", slug)
os.makedirs(d, exist_ok=True)
json.dump({"t": a, "a": a, "b": b, "label": label, "ts": int(time.time() * 1000)}, open(os.path.join(d, "focus.json"), "w", encoding="utf-8"), ensure_ascii=False)
print(f"foco: {label} ({a:.1f}–{b:.1f} s)")
