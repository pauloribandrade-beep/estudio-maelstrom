# Detector de respiros e pausas (v2). Diferencia pelo TIPO de som, não só pelo volume:
#   fala vozeada (vogais, n, m, l...) tem tom (autocorrelação forte entre 80 e 400 Hz),
#   s/f/x são chiado agudo (centroide espectral alto), respiração é sopro sem tom e sem agudo.
# Janela de 30 ms a cada 10 ms. Resultado em segundos da GRAVAÇÃO.
import json, os, re, subprocess, wave
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 16000
HOP = 160  # 10 ms
WIN = 480  # 30 ms


def load(slug):
    wav = os.path.join(ROOT, "out", "tmp", f"{slug}-16k.wav")
    os.makedirs(os.path.dirname(wav), exist_ok=True)
    src = os.path.join(ROOT, "public", "videos", slug, "ig1080.mp4")
    if not os.path.exists(wav) or os.path.getmtime(wav) < os.path.getmtime(src):
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-ac", "1", "-ar", str(SR), wav], check=True)
    w = wave.open(wav)
    return np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768


def features(x):
    # em blocos: a gravação inteira de uma vez estoura a memória (2 h de áudio = ~5 GB só na autocorrelação)
    n = (len(x) - WIN) // HOP
    B = 20000
    if n > B:
        parts = [_features(x[k * HOP : k * HOP + (min(n, k + B) - k - 1) * HOP + WIN]) for k in range(0, n, B)]
        return tuple(np.concatenate([p[i] for p in parts]) for i in range(3))
    return _features(x)


def _features(x):
    n = (len(x) - WIN) // HOP + 1
    idx = np.arange(WIN)[None, :] + HOP * np.arange(n)[:, None]
    fr = x[idx] * np.hanning(WIN)[None, :]
    db = 20 * np.log10(np.sqrt((fr ** 2).mean(1)) + 1e-9)
    spec = np.abs(np.fft.rfft(fr, n=512, axis=1))
    freqs = np.fft.rfftfreq(512, 1 / SR)
    cent = (spec * freqs[None, :]).sum(1) / (spec.sum(1) + 1e-9)
    # vozeamento: autocorrelação normalizada (via FFT), pico entre 40 e 200 amostras (400 a 80 Hz)
    f = np.fft.rfft(fr, n=1024, axis=1)
    ac = np.fft.irfft(np.abs(f) ** 2, axis=1)[:, :WIN]
    ac = ac / (ac[:, :1] + 1e-9)
    voiced = ac[:, 40:200].max(1)
    return db, cent, voiced


def speech_mask(db, cent, voiced):
    sp = float(np.percentile(db, 75))
    loud = db > sp - 10
    vo = (voiced > 0.45) & (db > sp - 32)
    fric = (cent > 3500) & (db > sp - 26)
    m = loud | vo | fric
    # tapa buracos de 1 a 2 janelas dentro da fala (oclusivas: p, t, k)
    out = m.copy()
    for i in range(1, len(m) - 2):
        if not m[i] and m[i - 1] and (m[i + 1] or m[i + 2]):
            out[i] = True
    # fala de verdade dura pelo menos 40 ms; "tique" isolado baixo (fim de respirada, estalo)
    # não conta como fala (antes ele encurtava a pausa e sobrava respiro antes da palavra)
    i = 0
    n = len(out)
    while i < n:
        if out[i]:
            j = i
            while j < n and out[j]:
                j += 1
            if j - i < 4 and float(db[i:j].max()) < sp - 18:
                out[i:j] = False
            i = j
        else:
            i += 1
    return out, sp


# análise do áudio inteiro feita UMA vez por slug: antes cada chamada de detect() refazia as FFTs da
# gravação toda (65 trechos no corte = 65 análises de 7 min; o botão "Cortar respiros" levava minutos)
_RUNS = {}


def _runs(slug):
    if slug not in _RUNS:
        x = load(slug)
        db, cent, voiced = features(x)
        m, sp = speech_mask(db, cent, voiced)
        t = lambda i: i * HOP / SR + WIN / 2 / SR
        runs = []
        i = 0
        n = len(m)
        while i < n:
            if not m[i]:
                j = i
                while j < n and not m[j]:
                    j += 1
                seg = slice(i, j)
                kind = "respiro" if float(np.median(db[seg])) > sp - 40 else "silêncio"
                runs.append((t(i), t(j), kind))
                i = j
            else:
                i += 1
        _RUNS[slug] = runs
    return _RUNS[slug]


def detect(slug, a=None, b=None, min_len=0.18):
    res = []
    for t0, t1, kind in _runs(slug):
        if t1 - t0 >= min_len and (a is None or t0 > a) and (b is None or t1 < b):
            res.append({"a": round(t0, 3), "b": round(t1, 3), "dur": round(t1 - t0, 3), "kind": kind})
    return res


def words_of(slug):
    vd = os.path.join(ROOT, "src", "videos", slug)
    v1 = os.path.join(vd, "bak", "words.v1.json")
    return json.load(open(v1 if os.path.exists(v1) else os.path.join(vd, "words.json"), encoding="utf-8"))


def boundary_fn(words):
    """Pausa em t0 (segundo da gravação) é 'entre frases' se a palavra anterior termina em . , ! ? : ;"""
    ends = sorted((w["orig"] + (w["end"] - w["start"]), bool(re.search(r"[.,!?:;]$", w["word"].strip()))) for w in words if "orig" in w)

    def boundary(t0):
        prev = [p for e, p in ends if e <= t0 + 0.3]
        return prev[-1] if prev else True

    return boundary


def ignored_of(slug):
    """Pausas que ele marcou como "desconsiderar" no Estúdio: [[a, b], ...] em segundos da gravação."""
    p = os.path.join(ROOT, "src", "videos", slug, "pauses-ignore.json")
    try:
        return [tuple(x) for x in json.load(open(p, encoding="utf-8"))]
    except (OSError, ValueError):
        return []


def is_ignored(q, ign):
    m = (q["a"] + q["b"]) / 2
    return any(a - 0.05 <= m <= b + 0.05 for a, b in ign)


def remaining_in_edit(slug, min_len=0.18):
    spec = json.load(open(os.path.join(ROOT, "src", "videos", slug, "segments.json"), encoding="utf-8"))
    boundary = boundary_fn(words_of(slug))
    fps = spec.get("fps", 30)
    out, acc = [], 0
    for s in spec["segments"]:
        f = s.get("frames") or round((s["b"] - s["a"]) * fps)
        e0 = acc / fps
        for q in detect(slug, s["a"] + 0.02, s["b"] - 0.02, min_len=min_len):
            where = "entre" if boundary(q["a"]) else "meio"
            # "cut": o botão Cortar respiros (ajustes padrão) ainda tira algo desta pausa? mesma conta do tighten.py
            k = 0.1 if where == "entre" else 0.25
            ca, cb = round(q["a"] + max(0.16, k * 0.4), 3), round(q["b"] - max(0.06, k * 0.6), 3)
            cut = cb - ca >= 0.06 and (where == "entre" or q["dur"] >= 0.35)
            out.append({**q, "a": round(e0 + q["a"] - s["a"], 3), "b": round(e0 + q["b"] - s["a"], 3), "where": where, "cut": cut, "src": [q["a"], q["b"]]})
        acc += f
    return out


if __name__ == "__main__":
    import sys

    if "--json-edit" in sys.argv:
        print(json.dumps(remaining_in_edit(sys.argv[1]), ensure_ascii=False))
        sys.exit(0)
    slug = sys.argv[1]
    spec = json.load(open(os.path.join(ROOT, "src", "videos", slug, "segments.json"), encoding="utf-8"))
    segs = spec["segments"]
    p = detect(slug, segs[0]["a"], segs[-1]["b"])
    for q in p:
        print(q)
    print(len(p), "pausas,", round(sum(q["dur"] for q in p), 2), "s")
