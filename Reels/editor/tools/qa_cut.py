# Confere o corte: retranscreve o áudio já cortado e compara palavra por palavra com a gravação.
# Uso: python tools/qa_cut.py <slug> [words_referencia.json]
import json, os, re, subprocess, sys, difflib
SCRIPTS = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "..", ".claude", "skills", "editor-reels-zale", "scripts")
sys.path.insert(0, os.path.abspath(SCRIPTS))
import _env  # noqa
_env.setup_cuda()
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
slug = sys.argv[1]
vd = os.path.join(ROOT, "src", "videos", slug)
ref_path = sys.argv[2] if len(sys.argv) > 2 else os.path.join(vd, "bak", "words.v1.json")
spec = json.load(open(os.path.join(vd, "segments.json"), encoding="utf-8"))
S = spec["segments"]
parts = "".join(f"[0:a]atrim={s['a']}:{s['b']},asetpts=PTS-STARTPTS[a{i}];" for i, s in enumerate(S))
cat = "".join(f"[a{i}]" for i in range(len(S))) + f"concat=n={len(S)}:v=0:a=1[out]"
out = os.path.join(ROOT, "out", "tmp", "cut16k.wav")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", os.path.join(ROOT, "public", "videos", slug, "ig1080.mp4"), "-filter_complex", parts + cat, "-map", "[out]", "-ac", "1", "-ar", "16000", out], check=True)
from faster_whisper import WhisperModel
m = WhisperModel("large-v3", device="cuda", compute_type="float16")
segs, _ = m.transcribe(out, language="pt", beam_size=5, vad_filter=False)
norm = lambda t: re.sub(r"[^\wà-ú ]", " ", t.lower()).split()
ref = norm(" ".join(w["word"] for w in json.load(open(ref_path, encoding="utf-8"))))
got = norm(" ".join(s.text for s in segs))
sm = difflib.SequenceMatcher(a=ref, b=got, autojunk=False)
SAME = {("pra", "para"), ("pro", "para o"), ("carruthers", "caruthers"), ("região", "reunião"), ("5", "cinco"), ("18", "dezoito")}
bad = []
for op, i1, i2, j1, j2 in sm.get_opcodes():
    if op == "equal":
        continue
    a, b = " ".join(ref[i1:i2]), " ".join(got[j1:j2])
    if (a, b) in SAME:
        continue
    bad.append((op, a, b))
print("diferenças:", bad if bad else "nenhuma (só variações de escrita)")
print("similaridade", round(sm.ratio(), 3))
