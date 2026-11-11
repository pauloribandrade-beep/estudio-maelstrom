# Monta o edit.json do vídeo "Paciente que ama e não indica" (Palco).
import json, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SLUG = "2026-09-28_paciente-que-ama-e-nao-indica"
VD = os.path.join(ROOT, "src", "videos", SLUG)
spec = json.load(open(os.path.join(VD, "segments.json"), encoding="utf-8"))
FPS = spec.get("fps", 30)
DUR = round(spec["totalFrames"] / FPS, 3)
words = json.load(open(os.path.join(VD, "words.json"), encoding="utf-8"))


def _find(word, n):
    k = 0
    for w in words:
        if w["word"].lower().strip(".,?!:;") == word.lower():
            k += 1
            if k == n:
                return w
    raise KeyError(word)


def W(word, n=1):
    """início (s da edição) da n-ésima ocorrência de uma palavra"""
    return _find(word, n)["start"]


def E(word, n=1):
    """fim (s da edição) da n-ésima ocorrência de uma palavra"""
    return _find(word, n)["end"]


scenes = []


def sc(id_, typ, a, b, props, lane=0, label=None, enter=None):
    d = {"id": id_, "type": typ, "start": round(a, 3), "end": round(b, 3), "lane": lane, "label": label or id_, "props": props}
    if enter:
        d["enter"] = enter
    scenes.append(d)


r = lambda t, a: round(t - a, 3)

# cenas em código (cenas-indica.tsx): narrativa contínua, profundidade por efeitos, sem emoji. Tempos em s da edição.
def S(id_, typ, a, b, props, label, enter=None, lane=0):
    def conv(o, key=""):
        if isinstance(o, dict):
            return {k: conv(v, k) for k, v in o.items()}
        if isinstance(o, list):
            return [conv(x) for x in o]
        if isinstance(o, (int, float)) and not isinstance(o, bool) and (key == "at" or key.endswith("At")):
            return round(o - a, 3)
        return o
    sc(id_, typ, a, b, conv(props), lane=lane, label=label, enter=enter)


S("amou", "InboxCounts", 0.0, 3.95, {"loveAt": 1.1, "neverAt": 2.8}, "Caixa de elogios enchendo x indicações vazia")
S("mesmojeito", "FaultSameWay", 4.0, 10.75, {"faultAt": 4.4, "clinicsAt": 5.7, "askAt": 8.7, "sameAt": 10.0}, "A culpa não é dela / as clínicas pedem do mesmo jeito", "zoom")
S("generico", "GenericFade", 10.8, 15.95, {"text": "Se você tiver alguma amiga interessada, indica a gente, tá?", "typeAt": 12.3, "dur": 2.9, "fadeAt": 15.3}, "O pedido genérico se perde no fundo", "drop")
S("elevador", "ClaroForget", 16.0, 20.35, {"claroAt": 17.2, "forgetAt": 18.8, "elevatorAt": 19.7}, "Claro!, sai feliz e esquece no elevador", "whip-left")
S("vazio", "ContactScroll", 20.4, 24.95, {"likedAt": 21.2, "scrollAt": 22.4, "stopAt": 24.3}, "Lista de contatos para na linha vazia", "flash")
S("momento", "GuidedMoment", 25.0, 29.35, {"guideAt": 26.2, "momentAt": 28.4}, "Conduzida (seta no caminho) até o momento certo", "zoom")
S("espelho", "RightNever", 29.4, 39.85, {"loveAt": 32.0, "mirrorAt": 34.3, "neverAt": 35.3, "complaintAt": 36.4, "doubtAt": 37.9}, "Na hora certa x nunca", "drop")
S("pessoa", "CrowdFocus", 39.9, 48.55, {"focusAt": 43.2, "askAt": 45.5, "askDur": 2.9}, "Uma pessoa específica entra em foco", "whip-right")
S("cabeca", "ThoughtContact", 48.6, 52.05, {"smileAt": 49.2, "askAt": 50.7, "cardAt": 51.2}, "Quem veio na sua cabeça?", "zoom")
S("ponte", "BridgeGroup", 52.1, 60.45, {"bridgeAt": 53.5, "phoneAt": 54.7, "msgAt": 55.9, "groupAt": 59.1}, "A ponte, a mensagem pronta e o grupo de 3", "whip-left")
S("contexto", "ContextCard", 60.5, 67.45, {"teamAt": 61.8, "fields": [{"label": "quem indicou", "at": 64.6}, {"label": "o que a amiga está buscando", "at": 65.9}]},
  "A equipe com contexto", "drop")
S("alvo", "LuckTarget", 67.5, 73.15, {"luckAt": 68.3, "favorAt": 69.1, "rings": [{"label": "pedido bem feito", "at": 70.4}, {"label": "hora certa", "at": 71.3},
  {"label": "pessoa certa", "at": 72.4}]}, "Não é sorte nem favor: o alvo", "flash")
S("cta", "DmCta", 73.2, DUR, {"keyword": "INDICAÇÃO", "commentAt": 75.2, "dmAt": 80.1}, "CTA: comenta INDICAÇÃO + DM", "zoom")

# close nos cortes (pedido do usuário): alterna 1.0 / 1.08 nas emendas, no mínimo 2,5 s entre trocas
snaps = [{"t": 0, "z": 1.0}]
for seg in spec["segments"][1:]:
    if seg["editStart"] - snaps[-1]["t"] >= 2.5 and DUR - seg["editStart"] > 2:
        snaps.append({"t": round(seg["editStart"], 3), "z": 1.0 if len(snaps) % 2 == 0 else 1.08})

music = []  # música: o Paulo escolhe na aba Músicas do Estúdio

push = lambda w, n=1, z=1.06, pad=0.7: {"t": round(W(w, n) - 0.3, 3), "z": z, "up": 12, "until": round(E(w, n) + pad, 3)}
doc = {
    "version": 1, "slug": SLUG, "comp": "IndicaEdit", "fps": FPS, "duration": DUR,
    "video": {"src": f"videos/{SLUG}/master.mp4", "fit": {"scale": 1, "top": 700}, "handle": "@opaulosandrade"},
    "captions": {"y": 980, "size": 56, "groupSize": 3, "hot": ["indicação", "INDICAÇÃO"], "words": [{"word": w["word"], "start": w["start"], "end": w["end"]} for w in words]},
    "zoom": {"snaps": snaps,
             "pushes": [push("culpa"), push("elevador", z=1.07), push("conduzida"), push("específica", pad=0.9),
                        push("cabeça", 2, z=1.07), push("sorte"), push("certa", 2, z=1.07)]},
    "scenes": scenes, "sounds": music,
    "soundTracks": [{"id": "t1", "name": "Efeitos"}, {"id": "t2", "name": "Impactos"}]
                   + [{"id": m["track"], "name": m["label"], "muted": k > 0} for k, m in enumerate(music)],
}
for i in range(len(scenes) - 1):
    s, n = scenes[i], scenes[i + 1]
    if s["lane"] == 0 and n["lane"] == 0 and s["end"] > n["start"]:
        print("SOBREPOSTO", s["id"], n["id"], s["end"], n["start"])
json.dump(doc, open(os.path.join(VD, "edit.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=2)
print("duração", DUR, "| pushes", [(p["t"], p["until"]) for p in doc["zoom"]["pushes"]])
for s in scenes:
    print(f"{s['start']:6.2f}-{s['end']:6.2f} {s['type']:13s} {s['label']}")
