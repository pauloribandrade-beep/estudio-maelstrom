#!/usr/bin/env python3
"""Baixa o acervo do Mixkit (licença Mixkit Free: uso comercial sem crédito,
não redistribuir o som sozinho) nas categorias úteis para motion design.

    fetch_mixkit.py [--cats click,pop,...] [--workers 6]

Saída: <EDITOR>/sfx-lib/mixkit/<id>.wav  +  index.json {id: {title, cats}}
Pula o que já existe (pode rodar de novo para completar). Não vai para o repo.
"""
import argparse
import concurrent.futures as cf
import json
import os
import re
import sys
import time
import urllib.request

sys.path.insert(0, os.path.dirname(__file__))
from _env import EDITOR, setup_ssl  # noqa: E402

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36"
CATS = ("alerts beep bell bleep boom bubbles camera chimes cinematic click clock coin correct countdown ding drop error glass glitch "
        "high-tech hit impact interface intro key keyboard laptop light lock magic money mouse notification office page paper phone "
        "pop slide sparkle spin swell swish swoosh sweep tap technology thud tones transition type typewriter whoosh woosh win write "
        "wrong zoom rewind static heartbeat hospital").split()
OUT = os.path.join(EDITOR, "sfx-lib", "mixkit")
PAIR = re.compile(r'sfx/(\d+)/\d+-preview\.mp3[\s\S]{0,1500}?item-grid-card__title[^>]*>\s*([^<]+?)\s*<|item-grid-card__title[^>]*>\s*([^<]+?)\s*<[\s\S]{0,2500}?sfx/(\d+)/\d+-preview\.mp3')


def get(url, tries=4):
    for k in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=60) as r:
                return r.read()
        except Exception:
            if k == tries - 1:
                raise
            time.sleep(2 * (k + 1))


def crawl(cat):
    found = {}
    for page in range(1, 20):
        url = f"https://mixkit.co/free-sound-effects/{cat}/" + (f"?page={page}" if page > 1 else "")
        try:
            html = get(url).decode("utf-8", "ignore")
        except Exception:
            break
        new = 0
        for m in PAIR.finditer(html):
            sid, title = (m.group(1), m.group(2)) if m.group(1) else (m.group(4), m.group(3))
            if sid not in found:
                found[sid] = title.strip()
                new += 1
        if new == 0:
            break
    return cat, found


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--cats", default=",".join(CATS))
    ap.add_argument("--workers", type=int, default=6)
    a = ap.parse_args()
    setup_ssl()
    os.makedirs(OUT, exist_ok=True)
    idx_path = os.path.join(OUT, "index.json")
    index = json.load(open(idx_path, encoding="utf-8")) if os.path.exists(idx_path) else {}
    with cf.ThreadPoolExecutor(a.workers) as ex:
        for cat, found in ex.map(crawl, a.cats.split(",")):
            for sid, title in found.items():
                e = index.setdefault(sid, {"title": title, "cats": []})
                if cat not in e["cats"]:
                    e["cats"].append(cat)
            print(f"{cat:<12} {len(found)} sons", flush=True)
    json.dump(index, open(idx_path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)

    def dl(sid):
        dst = os.path.join(OUT, f"{sid}.wav")
        if os.path.exists(dst) and os.path.getsize(dst) > 1000:
            return 0
        try:
            data = get(f"https://assets.mixkit.co/active_storage/sfx/{sid}/{sid}.wav")
        except Exception:
            return -1
        open(dst, "wb").write(data)
        return len(data)

    total, fails = 0, 0
    with cf.ThreadPoolExecutor(a.workers) as ex:
        for n in ex.map(dl, list(index)):
            if n < 0:
                fails += 1
            else:
                total += n
    have = sum(1 for f in os.listdir(OUT) if f.endswith(".wav"))
    print(f"\n{len(index)} sons no índice, {have} baixados ({total / 1e6:.0f} MB novos), {fails} falhas -> sfx-lib/mixkit/")


if __name__ == "__main__":
    main()
