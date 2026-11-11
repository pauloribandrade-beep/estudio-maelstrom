"""Alinha os EFEITOS ao que se MEXE NA TELA, olhando o vídeo de verdade (quadros de tools/eframes.py).

Para cada efeito curto (evento: trava, blip, pop, whoosh, carimbo, clique…): mede onde o som começa a soar
(ataque) e procura, nos quadros em volta, o instante em que a imagem muda de repente (algo entra, pisca, corta,
aparece). Se o ataque não cai nesse instante, propõe/aplica o deslocamento. Camas longas, músicas, vento e as
trilhas geradas inteiras (digitação, passos) não entram: elas já são montadas quadro a quadro.

Uso: python tools/align_av.py hl3_M01 [--every 2] [--win 0.5] [--apply]
"""
import glob, json, os, re, subprocess, sys, io, time, shutil
import numpy as np
from PIL import Image

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
slug = sys.argv[1]
EVERY = int(sys.argv[sys.argv.index("--every") + 1]) if "--every" in sys.argv else 2
WIN = float(sys.argv[sys.argv.index("--win") + 1]) if "--win" in sys.argv else 0.5
FPS = 30
DOC = os.path.join(ROOT, "src", "videos", slug, "edit.json")
d = json.load(open(DOC, encoding="utf-8"))
fdir = os.path.join(ROOT, "out", slug, "frames")
files = sorted(glob.glob(os.path.join(fdir, "f*.jpeg")))  # só os quadros das janelas (fNNNN)
num = lambda p: int(re.findall(r"(\d+)", os.path.basename(p))[-1])
files.sort(key=num)
# ---------------------------------------------------------------- movimento: diferença entre quadros vizinhos
cache = os.path.join(ROOT, "out", slug, "frames_diff.npz")
if os.path.exists(cache) and os.path.getmtime(cache) > max(os.path.getmtime(f) for f in files[-50:]):
    z = np.load(cache)
    T, D = z["T"], z["D"]
else:
    prev = None
    pn = -999
    T, D = [], []
    for p in files:
        a = np.asarray(Image.open(p).convert("L"), dtype=np.float32)
        # ignora a faixa da legenda (embaixo) — o texto da legenda muda a cada palavra e não é "o objeto"
        a = a[: int(a.shape[0] * 0.86)]
        n = num(p)
        if prev is not None and n - pn == EVERY:  # só quadros vizinhos (as janelas são separadas)
            T.append(n / FPS)
            D.append(float(np.mean(np.abs(a - prev))))
        prev, pn = a, n
    T, D = np.array(T), np.array(D)
    np.savez(cache, T=T, D=D)
# força de "começo de mudança": quanto a diferença sobe acima do que vinha antes
base = np.array([np.median(D[max(0, i - 4): i]) if i else D[0] for i in range(len(D))])
ON = np.maximum(0, D - base)
# ---------------------------------------------------------------- ataque de cada arquivo de som
_on = {}


def attack(src, trim):
    key = (src, round(trim, 3))
    if key in _on:
        return _on[key]
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", os.path.join(ROOT, "public", src), "-ac", "1", "-ar", "8000", "-f", "f32le", "-"], capture_output=True).stdout
    x = np.frombuffer(raw, np.float32)[int(trim * 8000):]
    if len(x) < 200:
        _on[key] = None
        return None
    r = np.sqrt(np.convolve(x ** 2, np.ones(160) / 160, "same"))
    pk = r.max()
    on = int(np.argmax(r > pk * 0.15)) / 8000
    _on[key] = on
    return on


LONG = re.compile(r"ambiente|zumbido|vento|fundo|m[uú]sica|cama|bed|song|loop|digit|pisadas|passos|tiroteio|marcham|deslizam|camera_ar|câmera anda|registro|aura|motor do", re.I)
rows = []
for x in d["sounds"]:
    dur = x.get("dur") or 6
    src = x["src"]
    if dur > 2.2 or src.startswith("music/") or LONG.search(x.get("label", "") + " " + src):
        continue
    on = attack(x.get("fxSrc") or src, x.get("trim", 0) or 0)
    if on is None or on > 1.2:
        continue
    E = x["start"] + on  # quando o som começa a soar
    m = (T >= E - WIN) & (T <= E + WIN)
    if m.sum() < 3:
        continue
    tt, oo, dd = T[m], ON[m], D[m]
    # picos de começo de mudança (máximos locais) fortes o bastante
    thr = max(1.2, 3.0 * np.median(D[max(0, np.searchsorted(T, E - 3)): np.searchsorted(T, E + 3)]) * 0.5)
    peaks = [i for i in range(len(oo)) if oo[i] >= thr and (i == 0 or oo[i] >= oo[i - 1]) and (i == len(oo) - 1 or oo[i] >= oo[i + 1])]
    if not peaks:
        continue
    # o evento visual = o começo de mudança mais próximo do ataque (o quadro ANTERIOR ao salto é o último "antes")
    i = min(peaks, key=lambda i: abs(tt[i] - E))
    V = tt[i] - EVERY / FPS / 2  # a mudança aconteceu entre o quadro anterior e este
    delta = V - E
    if abs(delta) >= 0.07:
        rows.append({"id": x["id"], "t": round(x["start"], 3), "label": x.get("label", "")[:60], "src": src.split("/")[-1], "delta": round(delta, 3), "force": round(float(oo[i]), 1), "new": round(x["start"] + delta, 3)})
rows.sort(key=lambda r: r["t"])
print(f"{len(rows)} efeitos fora do movimento da tela (±{WIN}s; ≥ 0,07 s)")
for r in rows:
    m_, s_ = divmod(r["t"], 60)
    print(f"  {int(m_):02d}:{s_:05.2f} {r['id']:12s} {r['label']:60s} {r['delta']:+.2f}s (força {r['force']})")
json.dump(rows, open(os.path.join(ROOT, "out", slug, "align_av.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
if "--apply" in sys.argv:
    age = time.time() - os.path.getmtime(DOC)
    if age < 60:
        sys.exit(f"edit.json mexido há {age:.0f} s — não gravo")
    shutil.copy(DOC, os.path.join(ROOT, "out", slug, "edit-history", f"edit-antes-align-av-{int(time.time())}.json"))
    d2 = json.load(open(DOC, encoding="utf-8"))
    by = {r["id"]: r for r in rows}
    n = 0
    for x in d2["sounds"]:
        r = by.get(x["id"])
        if r and abs(x["start"] - r["t"]) < 1e-3:
            x["start"] = r["new"]
            n += 1
    json.dump(d2, open(DOC, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("gravado:", n, "efeitos realinhados")
