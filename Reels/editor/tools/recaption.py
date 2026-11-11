# Legenda a partir do áudio JÁ CORTADO: transcreve o vídeo final (takes colados) com tempos por
# palavra, usando o roteiro como pista de grafia. Os tempos já saem no relógio da edição e nenhuma
# palavra dita fica de fora (a transcrição da gravação inteira "estica" palavras sobre os respiros
# e o corte acabava tirando palavras curtas da legenda).
# Uso: python tools/recaption.py <slug> [--fix "ERRADO=CERTO" ...] [--edit]  (--edit: grava também no edit.json)
import json, os, re, subprocess, sys

SCRIPTS = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "..", ".claude", "skills", "editor-reels-zale", "scripts"))
sys.path.insert(0, SCRIPTS)
import _env  # noqa: E402

_env.setup_cuda()
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def main():
    args = [a for a in sys.argv[1:]]
    slug = args[0]
    fixes = []
    for i, a in enumerate(args):
        if a == "--fix" and i + 1 < len(args):
            fixes.append(tuple(args[i + 1].split("=", 1)))
    vd = os.path.join(ROOT, "src", "videos", slug)
    spec = json.load(open(os.path.join(vd, "segments.json"), encoding="utf-8"))
    fps = spec.get("fps", 30)
    S = spec["segments"]
    parts = "".join(f"[0:a]atrim=start={s['a']}:duration={(s.get('frames') or round((s['b'] - s['a']) * fps)) / fps},asetpts=PTS-STARTPTS[a{i}];" for i, s in enumerate(S))
    cat = "".join(f"[a{i}]" for i in range(len(S))) + f"concat=n={len(S)}:v=0:a=1[out]"
    wav = os.path.join(ROOT, "out", "tmp", f"{slug}-cut16k.wav")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", os.path.join(ROOT, "public", "videos", slug, "ig1080.mp4"), "-filter_complex", parts + cat, "-map", "[out]", "-ac", "1", "-ar", "16000", wav], check=True)
    # pista de grafia: SÓ nomes próprios e termos (o texto inteiro do roteiro fazia o reconhecimento
    # "corrigir" a fala para o roteiro, e a legenda tem que mostrar o que foi dito)
    prompt = ""
    for i, a in enumerate(args):
        if a == "--names" and i + 1 < len(args):
            prompt = args[i + 1]
    from faster_whisper import WhisperModel

    model = WhisperModel("large-v3", device="cuda", compute_type="float16")
    segs, _ = model.transcribe(wav, language="pt", beam_size=5, word_timestamps=True, initial_prompt=prompt or None, vad_filter=False)
    # tempo da edição -> segundo da gravação (para o campo "orig")
    starts, acc = [], 0
    for s in S:
        f = s.get("frames") or round((s["b"] - s["a"]) * fps)
        starts.append((acc / fps, s["a"], f / fps))
        acc += f

    def orig(t):
        for e0, a, d in starts:
            if t <= e0 + d + 1e-6:
                return round(a + max(0.0, t - e0), 3)
        return None

    words = []
    for sg in segs:
        for w in sg.words:
            txt = w.word.strip()
            if not txt:
                continue
            for a, b in fixes:
                txt = txt.replace(a, b)
            if not words:
                txt = txt[:1].upper() + txt[1:]
            words.append({"word": txt, "start": round(w.start, 3), "end": round(w.end, 3), "orig": orig(w.start)})
    json.dump(words, open(os.path.join(vd, "words.json"), "w", encoding="utf-8"), ensure_ascii=False)
    if "--edit" in args and os.path.exists(os.path.join(vd, "edit.json")):
        doc = json.load(open(os.path.join(vd, "edit.json"), encoding="utf-8"))
        doc["captions"]["words"] = [{"word": w["word"], "start": w["start"], "end": w["end"]} for w in words]
        json.dump(doc, open(os.path.join(vd, "edit.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(len(words), "palavras")
    print(" ".join(w["word"] for w in words))


if __name__ == "__main__":
    main()
