#!/usr/bin/env python3
"""Baixa o acervo de MÚSICAS do Mixkit (licença Mixkit Free: uso comercial em vídeo sem crédito,
não redistribuir a música sozinha) para a biblioteca de músicas do Estúdio.

    fetch_music.py [--pages N] [--no-download] [--workers 2]

Saída: <EDITOR>/sfx-lib/mixkit-music/<id>.mp3  +  index.json {id: {title, author, tags, rank, dur}}
`rank` = posição na listagem padrão do site (as mais populares primeiro).
Educado com o site: uma página a cada 3 s e poucos downloads em paralelo (o site bloqueia se consultar
rápido demais; não contornar). Pula o que já existe. Não vai para o repo.
"""
import argparse
import concurrent.futures as cf
import json
import os
import re
import subprocess
import sys
import time
import urllib.request

sys.path.insert(0, os.path.dirname(__file__))
from _env import EDITOR, setup_ssl  # noqa: E402

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36"
OUT = os.path.join(EDITOR, "sfx-lib", "mixkit-music")
IDX = os.path.join(OUT, "index.json")
SKIP_TAGS = {"free-stock-music", "tag", "mood", "instrument", "discover"}


def get(url, tries=4):
    for k in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=90) as r:
                return r.read()
        except Exception:
            if k == tries - 1:
                raise
            time.sleep(3 * (k + 1))


def parse(html):
    """[(id, title, author, tags)] na ordem da página"""
    out = []
    for card in html.split('data-audio-player-item-id-value="')[1:]:
        m = re.match(r"(\d+)", card)
        if not m:
            continue
        body = card[:6000]
        t = re.search(r'item-grid-card__title[^>]*>\s*([^<]+?)\s*<', body)
        a = re.search(r'item-grid-music-preview__author[^>]*>\s*by\s*([^<]+?)\s*<', body)
        tags = []
        for g in re.findall(r'href="/free-stock-music/(?:(?:tag|mood|instrument|discover)/)?([a-z0-9\-]+)/"', body):
            if g not in SKIP_TAGS and g not in tags:
                tags.append(g)
        title = (t.group(1) if t else m.group(1)).replace("&#39;", "'").replace("&amp;", "&")
        out.append((m.group(1), title, a.group(1).strip() if a else "", tags))
    return out


def duration(f):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f], capture_output=True, text=True)
    try:
        return round(float(r.stdout.strip()), 2)
    except ValueError:
        return 0.0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--pages", type=int, default=9999, help="máximo de categorias")
    ap.add_argument("--no-download", action="store_true")
    ap.add_argument("--workers", type=int, default=2)
    args = ap.parse_args()
    setup_ssl()
    os.makedirs(OUT, exist_ok=True)
    idx = json.load(open(IDX, encoding="utf-8")) if os.path.exists(IDX) else {}

    # o site não pagina: cada categoria (gênero, clima, tag, instrumento) mostra até 36 músicas. Varre a
    # página principal (as mais populares, dá o `rank`) e depois todas as categorias linkadas nela.
    home = get("https://mixkit.co/free-stock-music/").decode("utf-8", "ignore")
    cats = sorted(set(re.findall(r'href="/free-stock-music/((?:(?:tag|mood|instrument|discover)/)?[a-z0-9\-]+)/"', home)))
    pages = [""] + cats[: args.pages] if args.pages < len(cats) else [""] + cats
    rank = 0
    seen = set()
    for n, cat in enumerate(pages):
        html = home if cat == "" else get(f"https://mixkit.co/free-stock-music/{cat}/").decode("utf-8", "ignore")
        new = 0
        for i, title, author, tags in parse(html):
            name = cat.split("/")[-1]
            old = idx.get(i, {})
            if i not in seen:
                seen.add(i)
                rank += 1
                new += 1
                idx[i] = {"title": title, "author": author, "tags": list(dict.fromkeys(tags + old.get("tags", []))), "rank": rank, "dur": old.get("dur", 0.0)}
            if name and name not in idx[i]["tags"]:
                idx[i]["tags"].append(name)
        print(f"[{n + 1}/{len(pages)}] {cat or 'populares'}: +{new} (total {len(seen)})", flush=True)
        json.dump(idx, open(IDX, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
        if cat:
            time.sleep(3)

    if args.no_download:
        return

    def dl(i):
        f = os.path.join(OUT, f"{i}.mp3")
        if not os.path.exists(f) or os.path.getsize(f) < 10000:
            data = get(f"https://assets.mixkit.co/music/{i}/{i}.mp3")
            open(f + ".part", "wb").write(data)
            os.replace(f + ".part", f)
            time.sleep(1.0)
        return i, duration(f)

    todo = sorted(idx, key=lambda k: idx[k]["rank"])
    done = 0
    with cf.ThreadPoolExecutor(args.workers) as ex:
        for fut in cf.as_completed([ex.submit(dl, i) for i in todo]):
            try:
                i, d = fut.result()
                idx[i]["dur"] = d
            except Exception as e:  # noqa: BLE001
                print("falhou:", e)
            done += 1
            if done % 25 == 0:
                print(f"baixadas {done}/{len(todo)}", flush=True)
                json.dump(idx, open(IDX, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    json.dump(idx, open(IDX, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"ok: {len(idx)} músicas em {OUT}")


if __name__ == "__main__":
    main()
