# Quadros de conferência de uma composição *Edit pelo TEMPO DA EDIÇÃO (s), numa folha só.
# Uso: python tools/estills.py <slug> <Comp> 1.2 7.3 9.8 ... [--scale 0.4] [--crop 980] [--doc teste.json]
#   --doc: edit.json de TESTE (cópia fora de src/videos) — nunca criar pasta de vídeo falsa: o Estúdio abre ela e trava
# (renderiza com tools/estills.mjs: um bundle e um navegador para todos os quadros)
import json, os, subprocess, sys
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
args = sys.argv[1:]
slug = args[0]
# public enxuta (mesma do render): só sons, marca, fontes, música e os arquivos que o edit.json cita
sys.path.insert(0, os.path.abspath(os.path.join(ROOT, "..", "..", ".claude", "skills", "editor-reels-zale", "scripts")))
import render as _render  # noqa: E402
_docp = args[args.index("--doc") + 1] if "--doc" in args else os.path.join(ROOT, "src", "videos", slug, "edit.json")
_doc = json.load(open(_docp, encoding="utf-8"))
pub = _render.slim_public(slug, _doc, "stills")
# temporários no F: (o C: encheu: cada montagem do Remotion tem ~1-3,6 GB e ficava em %TEMP%; 2026-09-28 eram 259 GB)
_tmp = os.path.join(_render.TEMP_BASE, "stills_tmp") if getattr(_render, "TEMP_BASE", None) else os.path.join(ROOT, "out", ".tmp")  # D: (pedido 07/11: nada pesado no F:)
os.makedirs(_tmp, exist_ok=True)
_env = {**os.environ, "TEMP": _tmp, "TMP": _tmp}
r = subprocess.run(["node", os.path.join(ROOT, "tools", "estills.mjs"), *args, "--public", pub], cwd=ROOT, capture_output=True, text=True, encoding="utf-8", errors="replace", env=_env)
if r.returncode:
    sys.exit(r.stderr[-2000:])
for ln in (r.stdout or "").splitlines():
    if ln.startswith("[navegador"):
        print(ln)
info = json.load(open(os.path.join(ROOT, "out", slug, "estills", "list.json"), encoding="utf-8"))
ims = []
for it in info["files"]:
    im = Image.open(it["output"]).convert("RGB")
    if info["crop"]:
        im = im.crop((0, 0, im.width, info["crop"]))
    d = ImageDraw.Draw(im)
    d.rectangle((0, 0, 64, 20), fill=(0, 0, 0))
    d.text((4, 4), f"{it['t']:.1f}s", fill=(255, 255, 0))
    ims.append(im)
cols = min(5, len(ims))
rows = (len(ims) + cols - 1) // cols
w, h = ims[0].size
sheet = Image.new("RGB", (w * cols, h * rows))
for k, im in enumerate(ims):
    sheet.paste(im, ((k % cols) * w, (k // cols) * h))
dst = os.path.join(ROOT, "out", slug, "estills", "sheet.png")
sheet.save(dst)
print(f"{len(ims)} quadros -> {dst}")
