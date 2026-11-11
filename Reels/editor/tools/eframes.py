# Quadros de análise (baixa resolução) do vídeo inteiro: monta a public enxuta (hardlinks) e chama eframes.mjs.
# Uso: python tools/eframes.py <slug> <Comp> [--every 2] [--scale 0.15] [--from N] [--to N]
import json, os, subprocess, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
args = sys.argv[1:]
slug = args[0]
sys.path.insert(0, os.path.abspath(os.path.join(ROOT, "..", "..", ".claude", "skills", "editor-reels-zale", "scripts")))
import render as _render  # noqa: E402
doc = json.load(open(os.path.join(ROOT, "src", "videos", slug, "edit.json"), encoding="utf-8"))
pub = _render.slim_public(slug, doc, "frames")
tmp = os.path.join(ROOT, "out", ".tmp")
os.makedirs(tmp, exist_ok=True)
env = {**os.environ, "TEMP": tmp, "TMP": tmp}
sys.exit(subprocess.run(["node", os.path.join(ROOT, "tools", "eframes.mjs"), *args, "--public", pub], cwd=ROOT, env=env).returncode)
