#!/usr/bin/env python3
"""Renderiza todos os vídeos, um de cada vez, na ordem do calendário de postagem, e copia para
<Downloads>/renderizado com o dia e horário no nome + a legenda do Instagram num .txt ao lado.

    python tools/render_all.py                 todos (calendário primeiro, depois os sem data)
    python tools/render_all.py --only bets     só os slugs que contêm o texto
    python tools/render_all.py --skip-fresh    pula quem já tem render mais novo que o edit.json

Um de cada vez de propósito: cada render usa ~8 GB de RAM e a GPU. Progresso em out/render_all.log.
"""
import argparse
import datetime as dt
import glob
import json
import os
import re
import shutil
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROJ = os.path.dirname(os.path.dirname(ROOT))
VIDEOS = os.path.join(ROOT, "src", "videos")
SCRIPTS = os.path.join(PROJ, ".claude", "skills", "editor-reels-zale", "scripts")
DEST = os.path.join(os.path.expanduser("~"), "Downloads", "renderizado")
LOG = os.path.join(ROOT, "out", "render_all.log")
TMP = os.path.join(ROOT, "out", ".tmp")
DOW = ["seg", "ter", "qua", "qui", "sex", "sab", "dom"]


def log(msg):
    line = f"[{dt.datetime.now():%H:%M:%S}] {msg}"
    print(line, flush=True)
    with open(LOG, "a", encoding="utf-8") as f:
        f.write(line + "\n")


def title(slug):
    f = os.path.join(PROJ, "Reels", "roteiros", f"{slug}.md")
    if os.path.exists(f):
        m = re.search(r"^#\s+(.+)$", open(f, encoding="utf-8").read(), re.M)
        if m:
            return m.group(1).strip()
    return slug[11:].replace("-", " ")


def safe(s):
    return re.sub(r'[<>:"/\\|?*]+', "", s).strip()[:90]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", default="")
    ap.add_argument("--skip-fresh", action="store_true")
    a = ap.parse_args()

    vids = {}
    for d in sorted(os.listdir(VIDEOS)):
        ej = os.path.join(VIDEOS, d, "edit.json")
        if os.path.exists(ej):
            vids[d] = json.load(open(ej, encoding="utf-8")).get("comp")
    try:
        cal = json.load(open(os.path.join(PROJ, "Reels", "calendario.json"), encoding="utf-8"))["items"]
    except Exception:
        cal = []
    order = [(i["slug"], i["at"]) for i in sorted(cal, key=lambda i: i["at"]) if i["slug"] in vids]
    order += [(s, None) for s in vids if s not in {o[0] for o in order}]
    if a.only:
        order = [o for o in order if a.only in o[0]]

    os.makedirs(DEST, exist_ok=True)
    os.makedirs(TMP, exist_ok=True)
    env = {**os.environ, "TEMP": TMP, "TMP": TMP, "PYTHONIOENCODING": "utf-8"}
    log(f"fila: {len(order)} vídeo(s) -> {DEST}")
    ok, bad = 0, []
    for n, (slug, at) in enumerate(order, 1):
        comp = vids[slug]
        final = os.path.join(ROOT, "out", slug, f"{slug}-{comp}.mp4")
        ej = os.path.join(VIDEOS, slug, "edit.json")
        if a.skip_fresh and os.path.exists(final) and os.path.getmtime(final) > os.path.getmtime(ej):
            log(f"{n}/{len(order)} {slug}: render já atualizado, só copiando")
        else:
            log(f"{n}/{len(order)} {slug}: renderizando ({comp})...")
            t0 = dt.datetime.now()
            r = subprocess.run([sys.executable, os.path.join(SCRIPTS, "render.py"), slug, comp, "--no-qa"], cwd=SCRIPTS, env=env,
                               capture_output=True, text=True, encoding="utf-8", errors="replace")
            if r.returncode != 0 or not os.path.exists(final):
                tail = " · ".join((r.stdout + r.stderr).strip().splitlines()[-4:])[-500:]
                log(f"   FALHOU: {tail}")
                bad.append(slug)
                continue
            log(f"   pronto em {(dt.datetime.now() - t0).seconds // 60} min")
        # nome: ordem · dia e horário de postagem · título
        if at:
            d = dt.datetime.fromisoformat(at)
            when = f"{DOW[d.weekday()]} {d:%d-%m} {d:%Hh%M}"
        else:
            when = "sem data"
        base = safe(f"{n:02d} - {when} - {title(slug)}")
        for old in glob.glob(os.path.join(DEST, f"* - {glob.escape(safe(title(slug)))}.*")):
            os.remove(old)  # versão antiga do mesmo vídeo (mudou de ordem/data)
        shutil.copy2(final, os.path.join(DEST, base + ".mp4"))
        cap = os.path.join(VIDEOS, slug, "caption.json")
        if os.path.exists(cap):
            open(os.path.join(DEST, base + " (legenda).txt"), "w", encoding="utf-8").write(json.load(open(cap, encoding="utf-8"))["text"])
        ok += 1
        log(f"   copiado: {base}.mp4")
        # temporários desta montagem (cada um tem 1 a 3 GB)
        for p in glob.glob(os.path.join(TMP, "remotion-*")) + glob.glob(os.path.join(TMP, "puppeteer_dev_chrome_profile-*")):
            shutil.rmtree(p, ignore_errors=True)
    log(f"FIM: {ok} pronto(s){', falharam: ' + ', '.join(bad) if bad else ''}. Pasta: {DEST}")


if __name__ == "__main__":
    main()
