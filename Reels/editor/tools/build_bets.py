# Monta o edit.json do vídeo "Bets / patrocínio da Série A" (Palco).
import json, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SLUG = "2026-09-28_bets-patrocinio-serie-a"
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

# cenas de metáfora (cenas-metafora.tsx, bloco "bets"): um objeto com ação física por fala
a = 0.0
sc("camisas", "ShirtRack", a, W("na") - 0.05, {"sponsorAt": r(W("patrocinador"), a), "penAt": r(W("numa"), a), "penDur": 0.5}, label="Varal de camisas + canetada")
a = W("na") - 0.02
sc("decreto", "Decree", a, W("mais", 2) - 0.05, {"typeAt": r(W("governo"), a), "cps": 1.4}, label="Decreto digitado", enter="drop")
sc("proibido", "Stamp", W("proibiu"), W("mais", 2) - 0.05, {"text": "Proibido", "at": 0}, lane=1, label="Carimbo proibido")
a = W("mais", 2) - 0.02
sc("dinheiro", "MoneyVanish", a, W("em", 2) - 0.05, {"stackAt": 0.05, "labelAt": r(W("bilhão"), a), "vanishAt": r(W("deixa"), a)}, label="R$ 1 bilhão se desfaz", enter="zoom")
a = W("em", 2) - 0.02
sc("espaco", "ShirtSpot", a, W("agora") - 0.05, {"spotAt": r(W("patrocinador", 2), a), "labelAt": r(W("espaço"), a), "emptyAt": r(W("camisa", 2), a)}, label="Holofote no espaço nobre", enter="flash")
a = W("agora") - 0.02
sc("torneira", "FaucetSource", a, W("porque") - 0.05, {"jar": "sua empresa", "labelAt": r(W("se"), a), "closeAt": r(W("fonte"), a), "askAt": r(W("o", 4), a)}, label="Torneira da fonte fecha", enter="whip-left")
a = W("porque") - 0.02
sc("rua", "ClinicStreet", a, W("tem") - 0.05, {"at": 0.1, "every": 4}, label="Rua de clínicas", enter="drop")
a = W("tem") - 0.02
sc("tomada", "PlugAgenda", a, W("tem", 2) - 0.05, {"pullAt": r(W("desligou"), a), "emptyAt": r(W("agenda"), a)}, label="Tomada do anúncio / agenda apaga", enter="whip-right")
a = W("tem", 2) - 0.02
sc("banquinho", "OneLegStool", a, W("e", 2) - 0.05, {"wobbleAt": r(W("mudou"), a), "fallAt": r(W("caixa"), a)}, label="Banquinho de uma perna tomba", enter="zoom")
a = W("e", 2) - 0.02
sc("cofre", "CrackVault", a, W("o", 8) - 0.05, {"crackAt": r(W("enxerga"), a), "riskAt": r(W("risco"), a)}, label="Cofre enchendo + rachadura", enter="flash")
a = W("o", 8) - 0.02
sc("contrato", "ContractFlip", a, W("e", 3) - 0.05, {"signAt": r(W("patrocinador", 3), a), "flipAt": r(W("tem", 4) - 0.25, a)}, label="Contrato vira risco", enter="whip-left")
a = W("e", 3) - 0.02
sc("corda", "OneRope", a, W("faturamento") - 0.05, {"snaps": [{"at": r(W("canal"), a)}, {"at": r(W("também"), a)}]}, label="Pendurada por 1 canal", enter="drop")
a = W("faturamento") - 0.02
sc("mesa", "FlowJar", a, W("e", 5) - 0.05,
   {"typeAt": 0.05, "pipesAt": r(W("vários"), a), "sources": [{"label": "base", "at": r(W("base"), a)}, {"label": "retorno", "at": r(W("retorno"), a)}, {"label": "indicação", "at": r(W("indicação"), a)}],
    "weak": "anúncio", "weakAt": r(W("e", 4), a), "removeAt": r(W("único"), a)}, label="Pote de várias fontes", enter="zoom")
a = W("e", 5) - 0.02
sc("pizza", "JengaCta", a, DUR, {"pullAt": r(W("principal", 3), a), "askAt": r(W("quanto"), a), "ctaAt": r(W("me"), a)}, label="Jenga: puxa a principal fonte + comenta", enter="whip-right")

# close nos cortes (pedido do usuário): alterna 1.0 / 1.08 nas emendas, no mínimo 2,5 s entre trocas
snaps = [{"t": 0, "z": 1.0}]
for seg in spec["segments"][1:]:
    if seg["editStart"] - snaps[-1]["t"] >= 2.5 and DUR - seg["editStart"] > 2:
        snaps.append({"t": round(seg["editStart"], 3), "z": 1.0 if len(snaps) % 2 == 0 else 1.08})

# música (Mixkit, licença livre): 3 candidatas, uma trilha cada; só a primeira ligada. Arquivos já cortados
# normalizados em -26 LUFS, inteiros (public/music; a 114 começa em 8 s via trim); vol 0.25 deixa a música ~22 LU abaixo da voz.
# 1ª rodada (Fallen, Trapanomics, Sports Highlights) reprovada pelo usuário: "muito altas" e não gostou.
MUSIC = [("kodama-night-town", "Música · Kodama Night Town (discreta)", "114"), ("driving-ambition", "Música · Driving Ambition (confiante)", "32"),
         ("sleepy-cat", "Música · Sleepy Cat (lo-fi)", "135")]
music = [{"id": f"mus{k + 1}", "src": f"music/mixkit-{i}-{f}.mp3", "start": 0, "dur": DUR, "vol": 0.25, "fadeIn": 0.4, "fadeOut": 1.5,
          "label": lab, "track": f"m{k + 1}", **({"trim": 8} if i == "114" else {})} for k, (f, lab, i) in enumerate(MUSIC)]

push = lambda w, n=1, z=1.06, pad=0.7: {"t": round(W(w, n) - 0.3, 3), "z": z, "up": 12, "until": round(E(w, n) + pad, 3)}
doc = {
    "version": 1, "slug": SLUG, "comp": "BetsEdit", "fps": FPS, "duration": DUR,
    "video": {"src": f"videos/{SLUG}/master.mp4", "fit": {"scale": 1, "top": 700}, "handle": "@opaulosandrade"},
    "captions": {"y": 980, "size": 56, "groupSize": 3, "hot": ["risco", "previsível"], "words": [{"word": w["word"], "start": w["start"], "end": w["end"]} for w in words]},
    "zoom": {"snaps": snaps,
             "pushes": [push("canetada"), push("bilhão", z=1.07), push("sobra"), push("enxerga", z=1.06, pad=1.4),
                        push("risco", 2, z=1.07), push("único", pad=0.9)]},
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
