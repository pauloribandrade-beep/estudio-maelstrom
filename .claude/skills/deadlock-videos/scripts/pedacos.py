"""Transcreve a gravação por pedaços de fala, para achar retomadas e repetições que o whisper corrido engole.

Uso: python pedacos.py <slug> [--modelo large-v3|medium|small] [--termos "Lash, Grapple, ult"]

Entra: Reels/editor/public/videos/<slug>/bruto.wav
Sai:   Reels/editor/out/<slug>/pedacos.txt   [início-fim] texto   (é o que o Claude lê)
       Reels/editor/out/<slug>/pedacos.json  com o tempo de cada palavra (o voz.py usa)

Roda na CPU (int8) de propósito: a placa de vídeo fica livre para o jogo e para a live.
"""
import argparse, json, os, re, subprocess, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _caminhos import pastas  # noqa: E402

TERMOS = ("Deadlock, Valve, LoL, League of Legends, Dota, MOBA, lane, ranked, elo, ult, combo, Guardião, Walker, andarilho, "
          "Patrono, Mid Boss, urna, almas, jungle, santuários, Eternus, Phantom, Ascendant, Oracle")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("slug")
    ap.add_argument("--modelo", default="large-v3")
    ap.add_argument("--termos", default="", help="nomes de herói, habilidade e gíria que vão aparecer (a transcrição acerta mais)")
    a = ap.parse_args()
    V, O = pastas(a.slug)
    src = os.path.join(V, "bruto.wav")
    if not os.path.isfile(src):
        sys.exit(f"não achei {src}")
    os.makedirs(O, exist_ok=True)
    from faster_whisper import WhisperModel

    # fala = entre o fim de um silêncio (>= 0,45 s abaixo de -42 dB) e o começo do próximo
    r = subprocess.run(["ffmpeg", "-nostdin", "-i", src, "-af", "silencedetect=noise=-42dB:d=0.45", "-f", "null", "-"], capture_output=True, text=True)
    s0 = [float(x) for x in re.findall(r"silence_start: ([0-9.]+)", r.stderr)]
    s1 = [float(x) for x in re.findall(r"silence_end: ([0-9.]+)", r.stderr)]
    dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", src], capture_output=True, text=True).stdout)
    chunks = []
    for i in range(len(s1) + 1):
        ini = s1[i - 1] if i else 0.0
        fim = s0[i] if i < len(s0) else dur
        if fim - ini > 0.25:
            chunks.append((round(ini, 2), round(fim, 2)))

    prompt = TERMOS + (", " + a.termos if a.termos else "")
    m = WhisperModel(a.modelo, device="cpu", compute_type="int8", cpu_threads=4)
    tmp = os.path.join(O, "_pedaco.wav")
    out, linhas = [], []
    for ini, fim in chunks:
        a0, b0 = max(0, ini - 0.1), min(dur, fim + 0.1)
        subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-ss", f"{a0:.3f}", "-to", f"{b0:.3f}", "-i", src, tmp], check=True)
        segs, _ = m.transcribe(tmp, language="pt", beam_size=5, word_timestamps=True, vad_filter=False,
                               condition_on_previous_text=False,  # sem isso ele inventa frase repetida
                               initial_prompt=prompt)
        ws = [{"w": w.word.strip(), "s": round(a0 + w.start, 3), "e": round(a0 + w.end, 3)} for s in segs for w in (s.words or []) if w.word.strip()]
        txt = " ".join(w["w"] for w in ws)
        out.append({"a": ini, "b": fim, "text": txt, "words": ws})
        linhas.append(f"[{ini:7.2f}-{fim:7.2f}] {txt}")
        print(linhas[-1], flush=True)
    os.remove(tmp)
    json.dump(out, open(os.path.join(O, "pedacos.json"), "w", encoding="utf-8"), ensure_ascii=False)
    open(os.path.join(O, "pedacos.txt"), "w", encoding="utf-8").write("\n".join(linhas))
    print(f"\n{len(chunks)} pedaços de fala em {dur:.1f} s -> {O}pedacos.txt")


if __name__ == "__main__":
    main()
