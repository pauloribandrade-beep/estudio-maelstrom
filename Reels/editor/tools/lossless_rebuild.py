"""Reconstrói o áudio-fonte do vídeo SEM PERDA (05/10/2026).
O ig1080.mp4 guarda a gravação emendada em AAC, e cada emenda de take recodificava tudo (25+ gerações): a voz
ganhou ~12 dB de lixo acima de 12 kHz ("bitcrush"). Aqui cada trecho usado do ig1080 é localizado no WAV original
(E:/HL3/audio/<bloco>[_norm].wav) por correlação do envelope e acertado na amostra; o resultado é
public/videos/<slug>/ig1080.lossless.wav (48 kHz estéreo PCM), na mesma linha do tempo do ig1080. O que não casar
(pausas, silêncios) fica copiado do ig1080.
Uso: python tools/lossless_rebuild.py <slug> [--map-only]"""
import json, os, re, subprocess, sys, wave
import numpy as np

sys.stdout.reconfigure(encoding="utf-8")
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
slug = sys.argv[1]
VD = os.path.join(ROOT, "src", "videos", slug)
PUB = os.path.join(ROOT, "public", "videos", slug)
AUD = "E:/HL3/audio/"
SR = 48000
ER = 100  # envelope: 100 valores/s
SKIP = re.compile(r"(_chunk|_cut|16\.wav|_now|^M01|^_|^c_|^s_|^v_|^s\d|^t\d|^n\d|^m01|snip|tit|hlx|gp\.wav|sm\.wav)", re.I)
KEEP = re.compile(r"(full_cut|ajuste_cut)\.wav$", re.I)  # montagens sem perda usadas nos blocos "X" e no ajuste da 3C
CANDS = sorted(f for f in os.listdir(AUD) if f.lower().endswith(".wav") and (KEEP.search(f) or not SKIP.search(f)))


def prefixes(note):
    n = note.strip()
    special = [("cena 1A", ["1A", "hl3_M01_1A"]), ("doido", ["doido"]), ("coordenadas", ["3B_coord", "3B"]), ("ajuste (heli", ["ajuste_cut", "ajuste"]),
               ("acampamento", ["acamp", "3C"]), ("breen2", ["breen2", "breen"]), ("barneyalyx", ["barneyalyx"]), ("assin", ["assin"]),
               ("escolha", ["escolha"]), ("aj5A", ["aj5A"]), ("aj5B", ["aj5B"]), ("5DX", ["5Dfull_cut", "5D", "r3"]), ("6X", ["6full_cut", "6", "r4"]), ("7X", ["7full_cut", "7"]),
               ("9f", ["9f", "9"]), ("10f", ["10f", "10"]), ("12B", ["12B"])]
    for k, v in special:
        if k in n:
            return v
    if n == "":
        return ["1B", "1A", "hl3_M01_1A2"]
    m = re.match(r"^(\d+[A-Z]?)", n)
    return [m.group(1)] if m else []


def cands_for(note):
    pf = prefixes(note)
    out = [f for f in CANDS if any(re.match(re.escape(p) + r"([_.]|$)", f, re.I) for p in pf)]
    return out or CANDS


def env16(path):
    """envelope log-RMS 10 ms (mono 16 kHz)"""
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", "16000", "-f", "s16le", "-"], capture_output=True).stdout
    x = np.frombuffer(raw, np.int16).astype(np.float32) / 32768
    n = len(x) // 160
    return np.log10(np.sqrt((x[: n * 160].reshape(n, 160) ** 2).mean(1)) + 1e-4)


def pcm48(path, t0, dur):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{max(0, t0):.4f}", "-t", f"{dur:.4f}", "-i", path, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True).stdout
    return np.frombuffer(raw, np.float32)


print("envelope do vídeo base…", flush=True)
IG = os.path.join(PUB, "ig1080.mp4")
E_ig = env16(IG)
_cache = {}


def cenv(f):
    if f not in _cache:
        _cache[f] = env16(AUD + f)
    return _cache[f]


def best_match(win, f):
    e = cenv(f)
    if len(e) < len(win) + 5:
        return -1, 0
    w = (win - win.mean()) / (win.std() + 1e-9)
    n = len(w)
    # correlação normalizada por janela deslizante (FFT)
    L = 1 << int(np.ceil(np.log2(len(e) + n)))
    num = np.fft.irfft(np.fft.rfft(e, L) * np.conj(np.fft.rfft(w, L)), L)[: len(e) - n + 1]
    cs = np.concatenate([[0], np.cumsum(e)])
    cs2 = np.concatenate([[0], np.cumsum(e * e)])
    mu = (cs[n:] - cs[:-n]) / n
    sd = np.sqrt(np.maximum((cs2[n:] - cs2[:-n]) / n - mu * mu, 1e-9))
    sd = np.maximum(sd, w.std() * 0 + 0.15)  # trecho sem variação (silêncio) não pode ganhar a busca
    r = num / (n * sd)
    k = int(np.argmax(r))
    return float(r[k]), k


segs = json.load(open(os.path.join(VD, "segments.json"), encoding="utf-8"))["segments"]
regions = {}
for s in segs:
    if s["note"].startswith("pausa"):
        continue
    a, b = s["a"], s["a"] + s["frames"] / 30
    r = regions.setdefault(s["note"], [a, b])
    r[0], r[1] = min(r[0], a), max(r[1], b)
WIN = 15.0
maps = []
for note, (a, b) in regions.items():
    cs = cands_for(note)
    t = a
    while t < b:
        t1 = min(b, t + WIN)
        if t1 - t < 2.0:
            t0 = max(a, t1 - 2.0)
        else:
            t0 = t
        win = E_ig[int(t0 * ER): int(t1 * ER)]
        tops = []
        if win.std() > 0.05:
            for f in cs:
                sc, k = best_match(win, f)
                tops.append((sc, f, k))
        tops.sort(reverse=True)
        alts = [{"file": f, "delta": t0 - k / ER, "score": round(sc, 3)} for sc, f, k in tops[:3] if sc > 0.9]
        maps.append({"note": note, "t0": round(t, 3), "t1": round(t1, 3), "file": alts[0]["file"] if alts else None, "alts": alts, "score": round(tops[0][0], 3) if tops else 0})
        t = t1
    print(f"{note[:30]:30s} {sum(1 for m in maps if m['note']==note and m['file'])}/{sum(1 for m in maps if m['note']==note)} janelas casadas · {sorted({m['file'] for m in maps if m['note']==note and m['file']})}", flush=True)
# ajuste fino na amostra + ganho, por janela
def fine(m, alt):
    m["file"], m["delta"] = alt["file"], alt["delta"]
    # ajuste fino no trecho mais forte da janela (o meio pode ser pausa)
    e = E_ig[int(m["t0"] * ER): int(m["t1"] * ER)]
    sm = np.convolve(e, np.ones(100) / 100, "same") if len(e) > 120 else e
    mid = m["t0"] + (int(np.argmax(sm)) / ER if len(e) > 120 else (m["t1"] - m["t0"]) / 2)
    mid = min(max(mid, m["t0"] + 0.7), m["t1"] - 0.7) if m["t1"] - m["t0"] > 1.5 else (m["t0"] + m["t1"]) / 2
    ig = pcm48(IG, mid - 0.6, 1.2)
    src = pcm48(AUD + m["file"], mid - m["delta"] - 0.65, 1.3)
    if len(ig) < SR or len(src) < SR:
        return False
    c = np.correlate(src, ig[int(0.05 * SR): int(1.15 * SR)], "valid")
    k = int(np.argmax(c))
    seg = src[k: k + int(1.1 * SR)]
    ref = ig[int(0.05 * SR): int(0.05 * SR) + len(seg)]
    if len(seg) < len(ref):
        ref = ref[: len(seg)]
    g = float(np.dot(ref, seg) / (np.dot(seg, seg) + 1e-12))
    rr = float(np.corrcoef(ref, seg)[0, 1])
    # deslocamento exato: amostra k do trecho de src (que começa em mid-delta-0.65) casa com ig em mid-0.6+0.05
    m["delta"] = round((mid - 0.55) - (mid - m["delta"] - 0.65 + k / SR), 6)
    m["gain"] = round(g, 4)
    m["r"] = round(rr, 4)
    return rr >= 0.95 and 0.5 < g < 2.0


for m in maps:
    good = False
    for alt in m.get("alts", []):
        if fine(m, alt):
            good = True
            break
    if not good:
        m["file"] = None
json.dump(maps, open(os.path.join(ROOT, "out", slug, "lossless_map.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
ok = [m for m in maps if m["file"]]
print(f"\njanelas casadas na amostra: {len(ok)}/{len(maps)} · correlação mediana {np.median([m['r'] for m in ok]):.4f} · ganho mediano {np.median([m['gain'] for m in ok]):.3f}", flush=True)
if "--map-only" in sys.argv:
    sys.exit()

# ---------- montagem: base = ig1080 decodificado; trechos casados = arquivo original ----------
out = os.path.join(PUB, "ig1080.lossless.wav")
tmp = out + ".tmp"
dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", IG], capture_output=True, text=True).stdout)
rd = subprocess.Popen(["ffmpeg", "-v", "error", "-i", IG, "-vn", "-ac", "2", "-ar", str(SR), "-f", "s16le", "-"], stdout=subprocess.PIPE)
wv = wave.open(tmp, "wb")
wv.setnchannels(2)
wv.setsampwidth(2)
wv.setframerate(SR)
CH = SR * 30
pos = 0
ok.sort(key=lambda m: m["t0"])
src_open = {}
replaced = 0.0
kept_ig = 0.0
while True:
    buf = rd.stdout.read(CH * 4)
    if not buf:
        break
    x = np.frombuffer(buf[: len(buf) // 4 * 4], np.int16).reshape(-1, 2).astype(np.float32)
    n = len(x)
    c0, c1 = pos / SR, (pos + n) / SR
    for m in ok:
        if m["t1"] <= c0 or m["t0"] >= c1:
            continue
        s0, s1 = max(m["t0"], c0), min(m["t1"], c1)
        i0, i1 = int(round((s0 - c0) * SR)), int(round((s1 - c0) * SR))
        fs0 = s0 - m["delta"]
        raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{max(0, fs0):.6f}", "-i", AUD + m["file"], "-t", f"{(i1 - i0) / SR + 0.01:.6f}", "-ac", "2", "-ar", str(SR), "-f", "s16le", "-"], capture_output=True).stdout
        y = np.frombuffer(raw[: len(raw) // 4 * 4], np.int16).reshape(-1, 2).astype(np.float32)
        k = min(len(y), i1 - i0)
        a, b = x[i0: i0 + k], y[:k] * m["gain"]
        # conferência a cada 0,1 s: só troca onde o original bate com o que está no vídeo (uma emenda no meio da janela
        # muda o deslocamento — ali fica o ig1080); bordas da troca com rampa de 5 ms
        B = SR // 10
        ok_b = np.zeros(k, np.float32)
        for j in range(0, k, B):
            u, v = a[j: j + B, 0], b[j: j + B, 0]
            eu, ev = np.sqrt((u * u).mean() + 1e-9), np.sqrt((v * v).mean() + 1e-9)
            if eu < 30 and ev < 30:
                good = True  # os dois em silêncio
            elif eu < 30 or ev < 30 or len(u) < 50:
                good = False
            else:
                # 08/10/2026: era > 0.9 e nível 0,6–1,6. O ig1080 está recomprimido 25x: nos "s" e nas partes fracas a
                # semelhança com o original cai para 0,6–0,9 MESMO no lugar certo (encaixe 0 ms, mesmo volume), e a regra
                # trocava o original pelo pedaço estragado em blocos de 0,1 s — os "flashes" na voz. Emenda de verdade
                # (conteúdo diferente) dá semelhança perto de zero.
                good = np.corrcoef(u, v)[0, 1] > 0.5 and 0.1 < ev / eu < 10
            ok_b[j: j + B] = 1.0 if good else 0.0
        R = int(0.005 * SR)
        ok_b = np.convolve(ok_b, np.ones(R) / R, "same")[:, None]
        x[i0: i0 + k] = a * (1 - ok_b) + b * ok_b
        replaced += float(ok_b.sum()) / SR
        kept_ig += k / SR - float(ok_b.sum()) / SR
    wv.writeframes(np.clip(x, -32768, 32767).astype(np.int16).tobytes())
    pos += n
rd.wait()
wv.close()
os.replace(tmp, out)
print(f"pronto: {out} · {pos / SR:.1f} s · {replaced:.0f} s vindos do original sem perda · {kept_ig:.0f} s mantidos do ig1080 (não bateram)")
