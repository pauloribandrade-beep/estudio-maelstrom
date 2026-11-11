# Supressão de respiros: em vez de CORTAR, abaixa o volume de cada respiro que o detector acha
# (tools/pauses.py, por tipo de som). Serve para os respiros que o corte justo deixa de propósito
# (0,04 a 0,3 s entre frases) e para os que ficam dentro dos takes.
# Saída: WAV 48 kHz da gravação inteira com os respiros abaixados (mesma linha do tempo da GRAVAÇÃO),
# usado como entrada do tratamento da voz (vite.config.mts → startVoiceJob).
#   python tools/breathduck.py <slug> <dB>      → imprime o caminho do WAV
import json, os, subprocess, sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pauses import ROOT, detect  # noqa: E402

SR = 48000
RAMP = 0.015  # 15 ms de rampa: sem estalo na borda
GUARD = 0.012  # não encosta no começo/fim da palavra vizinha


def main(slug, db):
    src = os.path.join(ROOT, "public", "videos", slug, "ig1080.mp4")
    # áudio sem perda remontado dos WAVs originais (tools/lossless_rebuild.py): o AAC do ig1080 passou por 25+
    # recodificações nas emendas e a voz ficou "bitcrushada" (05/10/2026)
    ll = os.path.join(ROOT, "public", "videos", slug, "ig1080.lossless.wav")
    if os.path.exists(ll) and os.path.getmtime(ll) >= os.path.getmtime(src):
        src = ll
    out = os.path.join(ROOT, "out", "tmp", f"{slug}-semrespiro-{db:g}.wav")
    if os.path.exists(out) and os.path.getmtime(out) > os.path.getmtime(src) and os.path.getsize(out) > 1_000_000:
        return out
    segs = [q for q in detect(slug, min_len=0.06) if q["kind"] == "respiro"]
    low = 10 ** (-db / 20)
    r = int(RAMP * SR)
    # em PEDAÇOS de 30 s (antes carregava a gravação inteira 4x na memória: com 1h20 passava de 6 GB e o processo
    # morria; o Estúdio recomeçava em looping e a barra ficava em 0%)
    spans = []
    for q in segs:
        a = int((q["a"] + GUARD) * SR)
        b = int((q["b"] - GUARD) * SR)
        if b - a >= 2 * r:
            spans.append((a, b))
    os.makedirs(os.path.dirname(out), exist_ok=True)
    tmp = out + ".tmp.wav"
    rd = subprocess.Popen(["ffmpeg", "-v", "error", "-i", src, "-vn", "-ac", "2", "-ar", str(SR), "-f", "f32le", "-"], stdout=subprocess.PIPE)
    wr = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-", "-c:a", "pcm_s16le", tmp], stdin=subprocess.PIPE)
    CH = SR * 30
    pos = 0
    total = 0
    k0 = 0
    while True:
        buf = rd.stdout.read(CH * 8)
        if not buf:
            break
        x = np.frombuffer(buf[: len(buf) // 8 * 8], np.float32).reshape(-1, 2).copy()
        n = len(x)
        g = np.ones(n, np.float32)
        while k0 < len(spans) and spans[k0][1] <= pos:
            k0 += 1
        k = k0
        while k < len(spans) and spans[k][0] < pos + n:
            a, b = spans[k]
            full = np.ones(b - a, np.float32) * low
            full[:r] = np.linspace(1, low, r)
            full[-r:] = np.linspace(low, 1, r)
            s0, s1 = max(a, pos), min(b, pos + n)
            g[s0 - pos : s1 - pos] = np.minimum(g[s0 - pos : s1 - pos], full[s0 - a : s1 - a])
            k += 1
        x *= g[:, None]
        wr.stdin.write(x.tobytes())
        pos += n
        total += n
    rd.wait()
    wr.stdin.close()
    wr.wait()
    # a fonte pode estar sendo regravada (emenda de take): sem áudio, falha em vez de guardar um WAV vazio
    if total < SR * 5 or wr.returncode:
        if os.path.exists(tmp):
            os.remove(tmp)
        sys.exit("fonte sem áudio (sendo regravada?)")
    os.replace(tmp, out)
    json.dump({"db": db, "respiros": len(segs), "seg": sum(q["dur"] for q in segs)}, open(out + ".json", "w"))
    return out


if __name__ == "__main__":
    print(main(sys.argv[1], float(sys.argv[2]) if len(sys.argv) > 2 else 18))
