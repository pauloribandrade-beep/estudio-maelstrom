#!/usr/bin/env python3
"""Extrai o Sonniss GDC com nomes curtos (o Windows limita caminhos a 260
caracteres e os nomes do pacote são enormes). Guarda o nome original em
sfx-lib/sonniss-gdc2026/names.json (usado pelo catálogo como título/tags).

    extract_sonniss.py
"""
import hashlib
import json
import os
import re
import sys
import zipfile

sys.path.insert(0, os.path.dirname(__file__))
from _env import EDITOR  # noqa: E402

D = os.path.join(EDITOR, "sfx-lib", "sonniss-gdc2026")
OUT = os.path.join(D, "x")
AUDIO = (".wav", ".flac", ".aif", ".aiff", ".mp3", ".ogg")


def short(s, n):
    s = re.sub(r"[^A-Za-z0-9]+", "_", s).strip("_")
    return s[:n]


def main():
    os.makedirs(OUT, exist_ok=True)
    names = {}
    np_ = os.path.join(D, "names.json")
    if os.path.exists(np_):
        names = json.load(open(np_, encoding="utf-8"))
    n = 0
    for z in sorted(f for f in os.listdir(D) if f.endswith(".zip")):
        with zipfile.ZipFile(os.path.join(D, z)) as zf:
            for info in zf.infolist():
                if info.is_dir() or "__MACOSX" in info.filename:
                    continue
                parts = info.filename.replace("\\", "/").split("/")
                base = parts[-1]
                if base.startswith("._") or not base.lower().endswith(AUDIO):
                    continue
                vendor = parts[-2] if len(parts) > 1 else "misc"
                ext = os.path.splitext(base)[1].lower()
                h = hashlib.md5(info.filename.encode()).hexdigest()[:6]
                rel = os.path.join(short(vendor, 40), short(os.path.splitext(base)[0], 70) + "_" + h + ext)
                dst = os.path.join(OUT, rel)
                names[os.path.join("sonniss-gdc2026", "x", rel)] = {"vendor": vendor, "title": os.path.splitext(base)[0]}
                if os.path.exists(dst) and os.path.getsize(dst) == info.file_size:
                    continue
                os.makedirs(os.path.dirname(dst), exist_ok=True)
                with zf.open(info) as src, open(dst, "wb") as out:
                    while True:
                        b = src.read(1 << 20)
                        if not b:
                            break
                        out.write(b)
                n += 1
        print(f"{z}: ok", flush=True)
    json.dump(names, open(np_, "w", encoding="utf-8"), ensure_ascii=False, indent=0)
    print(f"{len(names)} sons do Sonniss ({n} extraídos agora) -> sfx-lib/sonniss-gdc2026/x/")


if __name__ == "__main__":
    main()
