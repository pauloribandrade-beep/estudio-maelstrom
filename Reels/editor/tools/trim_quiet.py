# Segunda passada de corte justo (pedido do usuário, vídeo das bets): acha os "quase silêncios" que o tighten deixa
# (trechos >= 0,2 s bem abaixo da fala, dentro dos takes e nas bordas) e corta deixando TAIL depois da palavra e LEAD
# antes da próxima. Limiar relativo à fala da própria gravação (mediana dos trechos falados - 18 dB).
# Protege palavra curta e baixinha ("E", "a"): não corta trecho que invada uma palavra do words.json.
# Uso: python tools/trim_quiet.py <slug> [--min 0.2] [--db 18] [--dry]
# Depois: cut.py <slug> (refaz o words.json) e recaption.py.
import argparse, json, os, subprocess
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TAIL, LEAD, H = 0.10, 0.05, 0.02


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("slug")
    ap.add_argument("--min", type=float, default=0.2)
    ap.add_argument("--db", type=float, default=18)
    ap.add_argument("--dry", action="store_true")
    a = ap.parse_args()
    d = os.path.join(ROOT, "src", "videos", a.slug)
    spec = json.load(open(os.path.join(d, "segments.json"), encoding="utf-8"))
    words = json.load(open(os.path.join(d, "words.json"), encoding="utf-8"))
    wiv = sorted((w["orig"], w["orig"] + (w["end"] - w["start"])) for w in words if "orig" in w)
    src = os.path.join(ROOT, "public", "videos", a.slug, "ig1080.mp4")
    x = np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", src, "-ac", "1", "-ar", "16000", "-f", "f32le", "-"], capture_output=True).stdout, np.float32)
    n = int(H * 16000)
    lv = np.array([20 * np.log10(np.sqrt((x[i:i + n] ** 2).mean()) + 1e-9) for i in range(0, len(x) - n, n)])
    inside = np.zeros(len(lv), bool)
    for s in spec["segments"]:
        inside[int(s["a"] / H):int(s["b"] / H)] = True
    speech = np.median(lv[inside & (lv > np.percentile(lv[inside], 40))])
    thr = speech - a.db
    t = lambda i: i * H

    def hits_word(a0, b0):  # o trecho a cortar invade uma palavra?
        return any(min(b0, we) - max(a0, ws) > 0.04 for ws, we in wiv)

    out, cuts = [], 0
    for s in spec["segments"]:
        i0, i1 = int(s["a"] / H), int(s["b"] / H)
        q = lv[i0:i1] < thr
        loud = np.where(~q)[0]
        if not len(loud):
            continue
        a0 = max(s["a"], t(i0 + loud[0]) - LEAD)
        b0 = min(s["b"], t(i0 + loud[-1] + 1) + TAIL + 0.04)
        if hits_word(b0, s["b"]):  # palavra fraca no fim do take: não apara a borda
            b0 = s["b"]
        if hits_word(s["a"], a0):
            a0 = s["a"]
        cur, k = a0, loud[0]
        while k <= loud[-1]:
            if q[k]:
                j = k
                while q[j]:
                    j += 1
                ca, cb = t(i0 + k) + TAIL, t(i0 + j) - LEAD
                if (j - k) * H >= a.min and cb - ca > 0.06 and not hits_word(ca, cb):
                    out.append({"a": round(cur, 3), "b": round(ca, 3), "note": s.get("note", "")})
                    cur = cb
                    cuts += 1
                k = j
            else:
                k += 1
        out.append({"a": round(cur, 3), "b": round(b0, 3), "note": s.get("note", "")})
    before = sum(s["b"] - s["a"] for s in spec["segments"])
    after = sum(s["b"] - s["a"] for s in out)
    print(f"limiar {thr:.1f} dB (fala {speech:.1f}) | {cuts} cortes internos | {before:.2f} s -> {after:.2f} s")
    if not a.dry:
        spec["segments"] = out
        json.dump(spec, open(os.path.join(d, "segments.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=2)


if __name__ == "__main__":
    main()
