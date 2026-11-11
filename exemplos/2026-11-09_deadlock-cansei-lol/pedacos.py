"""(Cansei do LoL) Separa o bruto nos silêncios (silencedetect) e transcreve cada pedaço de fala isolado, para achar retomadas e repetições
que o whisper corrido engole. Sai em D:/canseilol/pedacos.txt (início, fim, texto) e D:/canseilol/pedacos.json (com palavras)."""
import os, json, re, subprocess

B = r"C:\Users\Paulo\AppData\Local\Programs\Python\Python311\Lib\site-packages\nvidia"
for d in ("cublas", "cudnn", "cuda_nvrtc"):
    os.add_dll_directory(os.path.join(B, d, "bin"))
    os.environ["PATH"] = os.path.join(B, d, "bin") + ";" + os.environ["PATH"]
from faster_whisper import WhisperModel

SRC = r"F:/Movo CRM/Processos-Comerciais-Clinicas/Reels/editor/public/videos/2026-11-09_deadlock-cansei-lol/bruto.wav"
TMP = "D:/canseilol/pedaco.wav"
r = subprocess.run(["ffmpeg", "-nostdin", "-i", SRC, "-af", "silencedetect=noise=-42dB:d=0.45", "-f", "null", "-"], capture_output=True, text=True)
s0 = [float(x) for x in re.findall(r"silence_start: ([0-9.]+)", r.stderr)]
s1 = [float(x) for x in re.findall(r"silence_end: ([0-9.]+)", r.stderr)]
dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", SRC], capture_output=True, text=True).stdout)
# fala = entre o fim de um silêncio e o começo do próximo
edges = [0.0] + s1
starts = [0.0] + s0
chunks = []
for i in range(len(s1) + 1):
    a = s1[i - 1] if i else 0.0
    b = s0[i] if i < len(s0) else dur
    if b - a > 0.25:
        chunks.append((round(a, 2), round(b, 2)))
PROMPT = "Deadlock, LoL, League of Legends, Dota, Riot, Valve, MOBA, lane, ranked, elo, Guardião, Walker, andarilho, Patrono, Patronos, Hidden King, Archmother, Arquimãe, santuários, base, Mid Boss, urna, almas, lane, jungle, Blies, ranqueada, rank, Eternus, Phantom, Ascendant, Oracle."
m = WhisperModel("large-v3", device="cpu", compute_type="int8", cpu_threads=4)
out, lines = [], []
for a, b in chunks:
    a0, b0 = max(0, a - 0.1), min(dur, b + 0.1)
    subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-ss", f"{a0:.3f}", "-to", f"{b0:.3f}", "-i", SRC, TMP], check=True)
    segs, _ = m.transcribe(TMP, language="pt", beam_size=5, word_timestamps=True, vad_filter=False, condition_on_previous_text=False, initial_prompt=PROMPT)
    ws = [{"w": w.word.strip(), "s": round(a0 + w.start, 3), "e": round(a0 + w.end, 3)} for s in segs for w in s.words]
    txt = " ".join(w["w"] for w in ws)
    out.append({"a": a, "b": b, "text": txt, "words": ws})
    lines.append(f"[{a:7.2f}-{b:7.2f}] {txt}")
    print(lines[-1], flush=True)
json.dump(out, open("D:/canseilol/pedacos.json", "w", encoding="utf-8"), ensure_ascii=False)
open("D:/canseilol/pedacos.txt", "w", encoding="utf-8").write("\n".join(lines))
