#!/usr/bin/env python3
"""Busca e baixa imagens de LICENÇA LIVRE do Wikimedia Commons (pessoas
públicas, lugares, objetos) para usar no palco, com o crédito guardado.

    imagem.py <slug> "Queen Elizabeth II" [--n 4] [--min-width 800]

Baixa em  <EDITOR>/public/videos/<slug>/img/<nome>.jpg  (largura até 1280 px)
Registra  <EDITOR>/public/videos/<slug>/img/creditos.json  (autor, licença, link)
Imprime uma linha por imagem: arquivo, tamanho, licença, autor.

Aceita só: domínio público, CC0, CC BY, CC BY-SA. Recusa o resto (fair use,
"all rights reserved", sem licença). Imagens CC BY/BY-SA exigem crédito: a
linha "crédito" impressa vai na legenda do post. Olhe as imagens pelo
contact sheet (img/_sheet.png) antes de escolher, não uma a uma.
"""
import argparse
import json
import os
import re
import subprocess
import sys
import urllib.parse
import urllib.error
import urllib.request

sys.path.insert(0, os.path.dirname(__file__))
from _env import EDITOR, ffmpeg, setup_ssl  # noqa: E402

API = "https://commons.wikimedia.org/w/api.php"
UA = "ZALE-editor-reels/1.0 (uso interno; contato via GitHub pauloribandrade-beep)"
FREE = re.compile(r"^(public domain|pd|cc0|cc[- ]by(-sa)?[- ]?\d?(\.\d)?)", re.I)


def get(url, tries=4):
    import time
    for k in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=30) as r:
                return r.read()
        except urllib.error.HTTPError as e:
            if e.code != 429 or k == tries - 1:
                raise
            time.sleep(3 * (k + 1))


def clean(html):
    return re.sub(r"<[^>]+>", "", html or "").strip()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("slug")
    ap.add_argument("query")
    ap.add_argument("--n", type=int, default=4)
    ap.add_argument("--min-width", type=int, default=800)
    a = ap.parse_args()
    setup_ssl()

    q = {
        "action": "query", "format": "json", "generator": "search", "gsrsearch": f"filetype:bitmap {a.query}",
        "gsrnamespace": 6, "gsrlimit": 30, "prop": "imageinfo", "iiprop": "url|size|extmetadata", "iiurlwidth": 1280,  # largura padrão de miniatura do Commons (outras dão 429)
    }
    data = json.loads(get(API + "?" + urllib.parse.urlencode(q)))
    pages = sorted((data.get("query") or {}).get("pages", {}).values(), key=lambda p: p.get("index", 0))
    out_dir = os.path.join(EDITOR, "public", "videos", a.slug, "img")
    os.makedirs(out_dir, exist_ok=True)
    cred_path = os.path.join(out_dir, "creditos.json")
    creds = json.load(open(cred_path, encoding="utf-8")) if os.path.exists(cred_path) else {}

    got = 0
    for p in pages:
        if got >= a.n:
            break
        ii = (p.get("imageinfo") or [{}])[0]
        md = ii.get("extmetadata", {})
        lic = clean(md.get("LicenseShortName", {}).get("value", ""))
        if not FREE.match(lic) or ii.get("width", 0) < a.min_width:
            continue
        artist = clean(md.get("Artist", {}).get("value", "")) or "autor desconhecido"
        base = re.sub(r"[^a-z0-9]+", "-", p["title"].split(":", 1)[-1].rsplit(".", 1)[0].lower()).strip("-")[:48]
        dst = os.path.join(out_dir, base + ".jpg")
        tmp = dst + ".src"
        open(tmp, "wb").write(get(ii.get("thumburl") or ii["url"]))
        subprocess.run([ffmpeg(), "-v", "error", "-y", "-i", tmp, "-vf", "scale='min(1600,iw)':-2", "-q:v", "3", dst], check=True)
        os.remove(tmp)
        needs = not re.match(r"^(public domain|pd|cc0)", lic, re.I)
        creds[os.path.basename(dst)] = {"autor": artist, "licenca": lic, "link": ii.get("descriptionurl"), "credito_obrigatorio": needs}
        print(f"{os.path.basename(dst):<52} {ii.get('width')}x{ii.get('height')}  {lic:<14} {artist[:40]}")
        got += 1
    json.dump(creds, open(cred_path, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    if not got:
        sys.exit("nenhuma imagem de licença livre encontrada; tente outro termo (em inglês costuma ter mais) ou peça a foto ao usuário")
    # prévia: o ffmpeg do Windows não tem -pattern_type glob; junta com xstack
    jpgs = sorted(f for f in os.listdir(out_dir) if f.endswith(".jpg"))[:12]
    cmd = [ffmpeg(), "-v", "error", "-y"]
    for j in jpgs:
        cmd += ["-i", os.path.join(out_dir, j)]
    fit = "".join(f"[{i}:v]scale=240:320:force_original_aspect_ratio=decrease,pad=240:320:(ow-iw)/2:(oh-ih)/2:white[v{i}];" for i in range(len(jpgs)))
    if len(jpgs) == 1:
        fc = fit + "[v0]copy[o]"
    else:
        layout = "|".join(f"{(i % 6) * 244}_{(i // 6) * 324}" for i in range(len(jpgs)))
        fc = fit + "".join(f"[v{i}]" for i in range(len(jpgs))) + f"xstack=inputs={len(jpgs)}:layout={layout}:fill=white[o]"
    subprocess.run(cmd + ["-filter_complex", fc, "-map", "[o]", "-frames:v", "1", os.path.join(out_dir, "_sheet.png")], capture_output=True)
    print(f"\n{got} imagens -> public/videos/{a.slug}/img/  (créditos em creditos.json; prévia em _sheet.png)")
    for k, c in creds.items():
        if c["credito_obrigatorio"]:
            print(f"crédito: {c['autor']} / {c['licenca']} / Wikimedia Commons")


if __name__ == "__main__":
    main()
