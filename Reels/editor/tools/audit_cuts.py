# Auditoria SÓ DE LEITURA da timeline (não grava nada no projeto):
#  1) emendas que cortam em cima de fala: energia nos 40 ms colados em cada lado de cada emenda entre takes;
#  2) frases repetidas: transcreve o áudio da timeline como ela está e procura sequências de 3+ palavras que se
#     repetem logo em seguida (retomada que ficou para trás).
# Uso: python tools/audit_cuts.py <slug> [--no-repeat]
import json, os, re, subprocess, sys
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 16000


def main():
    slug = sys.argv[1]
    vd = os.path.join(ROOT, "src", "videos", slug)
    segs = json.load(open(os.path.join(vd, "segments.json"), encoding="utf-8"))["segments"]
    fps = 30
    src = os.path.join(ROOT, "public", "videos", slug, "ig1080.mp4")
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", src, "-vn", "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"], capture_output=True).stdout
    x = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768
    db = lambda a, b: 20 * np.log10(np.sqrt(np.mean(x[max(0, int(a * SR)):max(int(a * SR) + 1, int(b * SR))] ** 2)) + 1e-9)
    noise = float(np.percentile([db(t, t + 0.04) for t in np.arange(0, len(x) / SR - 0.05, 0.5)], 10))
    SPEECH = noise + 28
    mm = lambda t: f"{int(t // 60)}:{t % 60:05.2f}"
    print(f"ruído de fundo ~{noise:.0f} dB · fala acima de ~{SPEECH:.0f} dB")
    print("\n== emendas em cima de fala ==")
    bad = 0
    for i in range(len(segs) - 1):
        s, n = segs[i], segs[i + 1]
        t = s["editStart"] + s["frames"] / fps
        e_out = db(s["b"] - 0.04, s["b"])
        e_in = db(n["a"], n["a"] + 0.04)
        if abs(n["a"] - s["b"]) < 0.02:
            continue  # trechos contínuos (não é emenda de verdade)
        flags = []
        if e_out > SPEECH:
            flags.append(f"fim do trecho corta palavra ({e_out:.0f} dB)")
        if e_in > SPEECH:
            flags.append(f"começo do próximo entra no meio de palavra ({e_in:.0f} dB)")
        if flags:
            bad += 1
            print(f"  {mm(t)}  " + " · ".join(flags))
    print(f"  total: {bad}")
    if "--no-repeat" in sys.argv:
        return
    # áudio da timeline (como ela está) → transcrição
    parts = [(g["a"], g["a"] + g["frames"] / fps) for g in segs]
    tmp = os.path.join(ROOT, "out", slug, "_audit.wav")
    lst = os.path.join(ROOT, "out", slug, "_audit_parts.txt")
    pcm = []
    for a, b in parts:
        pcm.append(x[int(a * SR):int(b * SR)])
    y = np.concatenate(pcm)
    import wave
    w = wave.open(tmp, "wb")
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((np.clip(y, -1, 1) * 32767).astype(np.int16).tobytes())
    w.close()
    sys.path.insert(0, r"F:/Movo CRM/Processos-Comerciais-Clinicas/.claude/skills/editor-reels-zale/scripts")
    from _env import setup_cuda

    setup_cuda()
    from faster_whisper import WhisperModel

    m = WhisperModel("large-v3", device="cuda", compute_type="float16")
    sg, _ = m.transcribe(tmp, language="pt", beam_size=5, word_timestamps=True, vad_filter=True, condition_on_previous_text=False)
    words = [(re.sub(r"[^\wà-ú]", "", w.word.lower()), w.start, w.end, w.word.strip()) for q in sg for w in q.words]
    words = [w for w in words if w[0]]
    os.remove(tmp)
    print("\n== possíveis repetições (mesmas 3+ palavras de novo em até 10 s) ==")
    seen = set()
    hits = 0
    for i in range(len(words)):
        for n in (6, 5, 4, 3):
            if i + n > len(words):
                continue
            g = tuple(w[0] for w in words[i:i + n])
            if len(set(g)) < 2:
                continue
            for j in range(i + n, min(len(words) - n + 1, i + n + 30)):
                if words[j][1] - words[i + n - 1][2] > 10:
                    break
                if tuple(w[0] for w in words[j:j + n]) == g and (i, j) not in seen:
                    for k in range(n):
                        seen.add((i + k, j + k))
                    hits += 1
                    txt = " ".join(w[3] for w in words[i:i + n])
                    print(f"  {mm(words[i][1])} e de novo em {mm(words[j][1])}: \"{txt}\"")
                    break
            else:
                continue
            break
    print(f"  total: {hits}")


if __name__ == "__main__":
    main()
