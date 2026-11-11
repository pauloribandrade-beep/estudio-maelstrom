#!/usr/bin/env python3
"""Transcreve a gravação INTEIRA (todos os takes) com faster-whisper na GPU,
com tempo por palavra, e imprime o MAPA DE TAKES compacto.

    transcribe.py <slug> [--model large-v3] [--beam 5] [--roteiro <md>] [--fix "Zale=ZALE"]...

Precisão: modelo large-v3 com beam 5, áudio limpo (passa-alta, passa-baixa,
nível), vocabulário do nicho (references/vocabulario.txt) e as palavras do
roteiro como hotwords em todas as janelas. Erros novos: acrescente o termo ao
vocabulario.txt.

Lê   <EDITOR>/public/videos/<slug>/ig1080.mp4
Grava <EDITOR>/src/videos/<slug>/whisper.json   (bruto, só os scripts leem)
      <EDITOR>/src/videos/<slug>/takes.txt      (o mapa; é o que o Claude lê)

Palavras-marcador ditas na gravação (o usuário fala depois de um take):
  SALVA  -> o take que acabou de terminar está aprovado   [OK]
  CORTA  -> o take que acabou de terminar vai fora        [XX]
O take vai do marcador anterior (ou do início) até o marcador. Segmentos sem
marcador ficam [..] e a escolha segue a regra "o último take fluente vence".
Frases de erro ("de novo", "errei", "peraí") marcam o segmento como [re].

ECONOMIA DE TOKENS: o Claude lê só o takes.txt (uma linha por segmento,
texto cortado em 110 caracteres). Nunca abrir o whisper.json no chat.
"""
import argparse
import json
import os
import re
import subprocess
import sys
import tempfile

sys.path.insert(0, os.path.dirname(__file__))
from _env import EDITOR, ffmpeg, setup_cuda, setup_ssl  # noqa: E402

MARK_OK = re.compile(r"\b(salva|salvo|salvou|salvar|save)\b[.!,]?", re.I)
MARK_CUT = re.compile(r"\b(corta|cortar|cortou)\b[.!,]?", re.I)
HALLU = re.compile(r"(legenda|legendas|amara\.org|obrigad[oa] por assistir|inscreva-se|subt[íi]tulos|transcri[çc][ãa]o)", re.I)
RETRY = re.compile(r"(de novo|errei|peraí|pera aí|vou repetir|deixa eu (falar|fazer) de novo|não, não|começar de novo)", re.I)


VOCAB = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "references", "vocabulario.txt")
STOP = set("para porque quando essa esse isso aqui você vocês ela ele elas eles mais muito muita sobre depois antes então também ainda está estão sabe tudo todo toda todos coisa gente fazer ter tem vai vou".split())


def prompt_for(roteiro):
    """Pista de contexto para o whisper, em FALA NATURAL e pontuada (ele imita o
    estilo da pista: lista de palavras tira a pontuação ou enche de vírgula).
    Usa o texto do roteiro, se houver, mais uma frase curta com os termos do
    nicho do vocabulario.txt."""
    parts = []
    if roteiro and os.path.exists(roteiro):
        txt = open(roteiro, encoding="utf-8").read()
        m = re.search(r"## Roteiro em bloco[^\n]*\n(.*?)\n## ", txt, re.S)
        body = (m.group(1) if m else "").strip()
        parts.append(re.sub(r"\s*\n\s*", " ", body))
    if os.path.exists(VOCAB):
        terms = [l.strip() for l in open(VOCAB, encoding="utf-8") if l.strip() and not l.startswith("#")]
        parts.append("Na ZALE, a gente fala de " + ", ".join(terms[:-1]) + " e " + terms[-1] + ".")
    return " ".join(parts)[-900:]

def transcribe(src, model_name, beam=5, roteiro=None, clean=True):
    """Transcrição POR FALA: o VAD (silero, embutido no faster-whisper) divide a
    gravação em falas de pausa a pausa; cada fala é transcrita sozinha, com o
    roteiro como pista (initial_prompt vale em cada fala, porque cada uma é a
    primeira janela). Sem contexto entre falas: um erro não contamina a
    seguinte e não há repetição alucinada. Cada fala vira um segmento."""
    setup_cuda()
    setup_ssl()
    import numpy as np
    from faster_whisper import WhisperModel
    from faster_whisper.audio import decode_audio
    from faster_whisper.vad import VadOptions, get_speech_timestamps

    tmp = tempfile.mkdtemp(prefix="zale-")
    wav = os.path.join(tmp, "a.wav")
    af = ["-af", "highpass=f=80,lowpass=f=7800,loudnorm=I=-18:TP=-2"] if clean else []
    subprocess.run([ffmpeg(), "-v", "error", "-y", "-i", src, "-vn", "-ac", "1", "-ar", "16000", *af, wav], check=True)
    try:
        if os.environ.get("ZALE_CPU"):  # regra do Paulo (07/11): a GPU é do jogo/live; transcrever na CPU
            raise RuntimeError("ZALE_CPU=1")
        m = WhisperModel(model_name, device="cuda", compute_type="float16")
    except Exception as e:  # sem GPU: CPU int8 (mais lento)
        print(f"(GPU indisponível: {e}; usando CPU)", file=sys.stderr)
        m = WhisperModel(model_name, device="cpu", compute_type="int8")
    audio = decode_audio(wav, sampling_rate=16000)
    sr = 16000
    spans = get_speech_timestamps(audio, VadOptions(min_silence_duration_ms=350, speech_pad_ms=150, threshold=0.4))
    # junta falas muito curtas com a vizinha e corta falas longas demais (> 25 s)
    chunks = []
    for s in spans:
        a0, b0 = s["start"] / sr, s["end"] / sr
        if chunks and (a0 - chunks[-1][1] < 0.25 or b0 - a0 < 0.6) and b0 - chunks[-1][0] < 25:
            chunks[-1][1] = b0
        else:
            chunks.append([a0, b0])
    prompt = prompt_for(roteiro) or None
    opts = dict(language="pt", word_timestamps=True, vad_filter=False, condition_on_previous_text=False,
                beam_size=beam, best_of=beam, temperature=[0.0, 0.2, 0.4], initial_prompt=prompt)
    data = {"language": "pt", "model": model_name, "beam": beam, "roteiro": roteiro, "segments": []}
    for a0, b0 in chunks:
        clip = audio[int(a0 * sr):int(b0 * sr)].astype(np.float32)
        segs, _ = m.transcribe(clip, **opts)
        for s in segs:
            if s.no_speech_prob > 0.6 or s.avg_logprob < -1.0 or HALLU.search(s.text):
                continue
            ws = [{"word": w.word.strip(), "start": round(a0 + w.start, 3), "end": round(a0 + w.end, 3)} for w in (s.words or []) if w.word.strip()]
            if not ws:
                continue
            data["segments"].append({"start": ws[0]["start"], "end": ws[-1]["end"], "text": s.text.strip(), "words": ws})
    refine(data, m, wav, opts={**opts, "initial_prompt": None})
    return data

def refine(data, m, wav, long_word=1.5, gap=1.5, opts=None):
    """Segunda passada nos trechos suspeitos. Numa gravação com recomeços, o
    whisper às vezes "engole" a tentativa abortada: dentro de uma palavra
    esticada (um "quê?" de 6 s) ou num buraco sem palavra entre duas
    palavras. Cada janela suspeita é retranscrita sozinha; as palavras novas
    substituem as originais que se sobrepõem à janela, e tudo é redistribuído
    pelos segmentos. As janelas revisadas ficam em data["refined"]."""
    import numpy as np
    from faster_whisper.audio import decode_audio

    audio = decode_audio(wav, sampling_rate=16000)
    words = [w for s in data["segments"] for w in s["words"]]
    wins = []
    for i, w in enumerate(words):
        if w["end"] - w["start"] > long_word:
            wins.append([w["start"], w["end"]])
        if i + 1 < len(words) and words[i + 1]["start"] - w["end"] > gap:
            wins.append([w["end"], words[i + 1]["start"]])
    merged = []
    for a0, b0 in sorted(wins):
        a0, b0 = max(0.0, a0 - 0.3), b0 + 0.3
        if merged and a0 <= merged[-1][1]:
            merged[-1][1] = max(merged[-1][1], b0)
        else:
            merged.append([a0, b0])
    data["refined"] = []
    for a0, b0 in merged:
        clip = audio[int(a0 * 16000):int(b0 * 16000)].astype(np.float32)
        o = dict(opts or {"language": "pt", "word_timestamps": True, "condition_on_previous_text": False})
        sub, _ = m.transcribe(clip, **o)
        # descarta alucinação: trecho sem fala (no_speech alto), confiança baixa
        # ou as frases clássicas que o whisper inventa em silêncio
        new = [{"word": x.word.strip(), "start": round(a0 + x.start, 3), "end": round(min(b0, a0 + x.end), 3)}
               for seg in sub if seg.no_speech_prob < 0.5 and seg.avg_logprob > -1.0 and not HALLU.search(seg.text)
               for x in (seg.words or []) if x.word.strip()]
        if not new:
            continue
        lo, hi = new[0]["start"], new[-1]["end"]
        # sai toda palavra original cujo miolo cai dentro do trecho revisado
        words = [w for w in words if not (lo - 0.05 <= (w["start"] + w["end"]) / 2 <= hi + 0.05)] + new
        words.sort(key=lambda w: w["start"])
        data["refined"].append([round(a0, 2), round(b0, 2), " ".join(w["word"] for w in new)])
    # redistribui as palavras pelos segmentos (cada palavra vai para o segmento em que começa)
    segs = data["segments"]
    for s in segs:
        s["words"] = []
    k = 0
    for w in words:
        while k + 1 < len(segs) and w["start"] >= segs[k + 1]["start"] - 0.05:
            k += 1
        segs[k]["words"].append(w)
    for s in segs:
        if s["words"]:
            s["text"] = " ".join(w["word"] for w in s["words"])
            s["start"] = min(s["start"], s["words"][0]["start"])
            s["end"] = max(s["end"], s["words"][-1]["end"])

def apply_fixes(data, fixes):
    for s in data["segments"]:
        for w in s["words"]:
            core = w["word"].rstrip(".,!?;:")
            for old, new in fixes:
                if core == old:
                    w["word"] = new + w["word"][len(core):]
        for old, new in fixes:
            s["text"] = re.sub(rf"\b{re.escape(old)}\b", new, s["text"])


def take_map(segments):
    """Marca cada segmento: OK (aprovado por SALVA), XX (CORTA), mk (é o
    próprio marcador), re (tentativa abortada), .. (sem marcador)."""
    tags = [".."] * len(segments)
    open_from = 0
    for i, s in enumerate(segments):
        t = s["text"]
        ok, cut = MARK_OK.search(t), MARK_CUT.search(t)
        if ok or cut:
            only_marker = len(re.sub(r"[\W_]+", " ", (MARK_OK if ok else MARK_CUT).sub("", t)).split()) <= 1
            upto = i if not only_marker else i - 1
            for k in range(open_from, upto + 1):
                if tags[k] == "..":
                    tags[k] = "OK" if ok else "XX"
            tags[i] = "mk" if only_marker else ("OK" if ok else "XX")
            open_from = i + 1
        elif RETRY.search(t):
            tags[i] = "re"
    return tags


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("slug")
    ap.add_argument("--model", default="large-v3", help="large-v3 (mais preciso, padrão) ou large-v3-turbo (mais rápido)")
    ap.add_argument("--beam", type=int, default=5)
    ap.add_argument("--roteiro", help="roteiro .md (padrão: Reels/roteiros/*<slug sem data>*.md, se existir)")
    ap.add_argument("--no-clean", action="store_true", help="não filtrar/nivelar o áudio antes")
    ap.add_argument("--fix", action="append", default=[], help="ERRADO=CERTO, repetível")
    ap.add_argument("--raw", action="store_true", help="reaproveitar whisper.json existente (não transcreve de novo)")
    a = ap.parse_args()

    src = os.path.join(EDITOR, "public", "videos", a.slug, "ig1080.mp4")
    out = os.path.join(EDITOR, "src", "videos", a.slug)
    os.makedirs(out, exist_ok=True)
    wj = os.path.join(out, "whisper.json")
    rot = a.roteiro
    if not rot:
        import glob
        tag = a.slug.split("_", 1)[-1]
        hits = glob.glob(os.path.join(os.path.dirname(EDITOR), "roteiros", f"*{tag}*.md"))
        rot = hits[0] if hits else None
    if rot and not a.raw:
        print(f"(roteiro usado como vocabulário: {os.path.basename(rot)})")
    data = json.load(open(wj, encoding="utf-8")) if a.raw else transcribe(src, a.model, a.beam, rot, not a.no_clean)
    apply_fixes(data, [tuple(f.split("=", 1)) for f in a.fix])
    json.dump(data, open(wj, "w", encoding="utf-8"), ensure_ascii=False)

    segs = [s for s in data["segments"] if s["text"]]
    tags = take_map(segs)
    lines = ["#  tag  início    fim   texto   (segundos da gravação original)"]
    for i, (s, tg) in enumerate(zip(segs, tags)):
        txt = s["text"] if len(s["text"]) <= 110 else s["text"][:107] + "..."
        lines.append(f"{i:<3}{tg:>3} {s['start']:7.2f} {s['end']:7.2f}  {txt}")
    if data.get("refined"):
        lines.append("\nrevisados (tentativas que estavam escondidas em palavras esticadas):")
        for a0, b0, txt in data["refined"]:
            lines.append(f"   {a0:7.2f}-{b0:7.2f}  {txt[:100]}")
    n = {k: tags.count(k) for k in ("OK", "XX", "mk", "re", "..")}
    lines.append(f"\n{len(segs)} segmentos | OK {n['OK']}  XX {n['XX']}  marcadores {n['mk']}  tentativas {n['re']}  sem marca {n['..']}")
    lines.append("legenda: OK=aprovado por SALVA  XX=descartado por CORTA  mk=marcador  re=tentativa abortada  ..=sem marcador")
    table = "\n".join(lines)
    open(os.path.join(out, "takes.txt"), "w", encoding="utf-8").write(table)
    print(table)


if __name__ == "__main__":
    main()
