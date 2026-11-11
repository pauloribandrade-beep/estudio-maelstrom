# Trecho curto (para conferir pelo celular) de uma composição *Edit, pelo tempo da edição.
# Uso: python tools/eclip.py <slug> <Comp> <inicio_s> <fim_s> [saida.mp4] [--scale 0.6667]
# Usa a mesma public enxuta do render/estills (hardlinks) e grava em out/<slug>/clips/.
import json, os, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
args = sys.argv[1:]
slug, comp, a, b = args[:4]
rest = args[4:]
out = rest[0] if rest and not rest[0].startswith("--") else os.path.join(ROOT, "out", slug, "clips", f"trecho_{a}-{b}.mp4")
extra = [x for x in rest if x != out]
os.makedirs(os.path.dirname(out), exist_ok=True)
sys.path.insert(0, os.path.abspath(os.path.join(ROOT, "..", "..", ".claude", "skills", "editor-reels-zale", "scripts")))
import render as _render  # noqa: E402
doc_p = extra[extra.index("--doc") + 1] if "--doc" in extra else os.path.join(ROOT, "src", "videos", slug, "edit.json")
doc = json.load(open(doc_p, encoding="utf-8"))
pub = _render.slim_public(slug, doc, "clip")
tmp = os.path.join(ROOT, "out", ".tmp")
os.makedirs(tmp, exist_ok=True)
env = {**os.environ, "TEMP": tmp, "TMP": tmp}
r = subprocess.run(["node", os.path.join(ROOT, "tools", "eclip.mjs"), slug, comp, a, b, out, *extra, "--public", pub], cwd=ROOT, text=True, encoding="utf-8", errors="replace", env=env)
sys.exit(r.returncode)
