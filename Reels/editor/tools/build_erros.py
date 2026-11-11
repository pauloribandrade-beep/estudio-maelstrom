# Monta o edit.json do vídeo "3 erros que fazem a paciente escolher o avulso" (Palco).
import json, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SLUG = "2026-09-27_3-erros-procedimento-avulso"
VD = os.path.join(ROOT, "src", "videos", SLUG)
spec = json.load(open(os.path.join(VD, "segments.json"), encoding="utf-8"))
FPS = spec.get("fps", 30)
DUR = round(spec["totalFrames"] / FPS, 3)
words = json.load(open(os.path.join(VD, "words.json"), encoding="utf-8"))


def W(word, n=1):
    """início (s da edição) da n-ésima ocorrência de uma palavra"""
    k = 0
    for w in words:
        if w["word"].lower().strip(".,?!:;") == word.lower():
            k += 1
            if k == n:
                return w["start"]
    raise KeyError(word)


scenes = []


def sc(id_, typ, a, b, props, lane=0, label=None, enter=None):
    d = {"id": id_, "type": typ, "start": round(a, 3), "end": round(b, 3), "lane": lane, "label": label or id_, "props": props}
    if enter:
        d["enter"] = enter
    scenes.append(d)


r = lambda t, a: round(t - a, 3)

# cenas de metáfora (cenas-metafora.tsx): objeto reconhecível + ação física em cada fala
M = [{"name": "Toxina"}, {"name": "Preenchimento"}, {"name": "Bioestimulador"}, {"name": "Fios"}]
sc("gancho", "ErrorCards", 0.0, 7.62, {"title": "3 erros", "flipAt": 0.35, "chainAt": W("vêm")}, label="3 cartas de erro + corrente")
a = 7.65
sc("erro1", "ErrorCards", a, W("quando") - 0.05, {"focus": 0, "flipAt": 0.1, "label": "começa na avaliação", "labelAt": r(W("avaliação"), a)}, label="Carta 1", enter="zoom")
a = W("quando") - 0.02
sc("consulta", "ConsultQuestion", a, W("pronto") - 0.05,
   {"question": "O que você quer fazer hoje?", "askAt": r(W("o", 3), a), "askDur": round(W("hoje") + 0.3 - W("o", 3), 3), "replyAt": r(W("responder"), a), "shotAt": r(W("instagram"), a)},
   label="Pergunta + feed do Instagram", enter="whip-left")
a = W("pronto") - 0.02
sc("cardapio", "MenuCard", a, W("aí") - 0.05, {"items": [dict(m, at=round(0.1 + k * 0.15, 3)) for k, m in enumerate(M)], "giveAt": r(W("entregou"), a), "pickAt": r(W("mão"), a), "pick": 1},
   label="Cardápio na mão dela", enter="drop")
a = W("aí") - 0.02
sc("erro2", "ErrorCards", a, W("como") - 0.05, {"focus": 1, "flipAt": 0.1, "label": "consequência do primeiro", "labelAt": r(W("consequência"), a)}, label="Carta 2", enter="flash")
a = W("como") - 0.02
sc("ratoeira", "PriceTrap", a, W("ela", 4) - 0.05, {"caption": "o valor antes do diagnóstico", "captionAt": r(W("conduziu"), a), "baitAt": r(W("valor"), a), "snapAt": r(W("armadilha"), a), "snapLabel": "armadilha do preço"},
   label="Ratoeira do preço", enter="whip-right")
a = W("ela", 4) - 0.02
sc("etiquetas", "HangingTags", a, W("vira") - 0.55, {"tags": [{"label": "outra clínica", "at": r(W("outra"), a)}, {"label": "outro anúncio", "at": r(W("outro"), a)}, {"label": "a amiga", "at": r(W("amiga"), a)}]},
   label="Etiquetas comparando", enter="drop")
a = W("vira") - 0.52
sc("maisuma", "CloneGrid", a, W("para") - 0.1, {"label": "sua clínica", "zoomAt": r(W("vira") + 0.1, a)}, label="Só mais uma opção", enter="zoom")
a = W("para") - 0.08
sc("erro3", "ErrorCards", a, W("lista", 2) - 0.35, {"focus": 2, "flipAt": 0.1, "label": "uma lista em vez de um plano", "labelAt": r(W("vez"), a)}, label="Carta 3", enter="whip-left")
a = W("lista", 2) - 0.32
sc("nota", "Receipt", a, W("agora") - 0.05,
   {"lines": [{"name": "Toxina", "at": r(W("toxina"), a)}, {"name": "Preenchedor", "at": r(W("preenchedor"), a), "strikeAt": r(W("item"), a)}, {"name": "Bioestimulador", "at": r(W("bioestimulador"), a), "strikeAt": r(W("item", 2), a)}],
    "keep": 0, "keepAt": r(W("fica"), a), "keepLabel": "o mais barato"},
   label="Nota imprimindo e riscada", enter="whip-right")
a = W("agora") - 0.02
sc("mapa", "RouteMap", a, W("seringa") - 0.95,
   {"stops": [{"label": "o problema dela", "at": r(W("entende"), a)}, {"label": "etapa", "at": r(W("etapa"), a)}, {"label": "acompanhamento", "at": r(W("acompanhamento"), a)}, {"label": "retorno", "at": r(W("retorno"), a)}]},
   label="Mapa do plano", enter="zoom")
a = W("seringa") - 0.92
sc("seringa", "SyringeSpot", a, W("paciente", 2) - 0.35,
   {"revealAt": r(W("vê"), a), "doneAt": r(W("solução"), a), "label": "uma seringa isolada", "stops": [{"label": "o problema dela"}, {"label": "etapa"}, {"label": "acompanhamento"}, {"label": "retorno"}]},
   label="Seringa no foco vira etapa do plano", enter="flash")
a = W("paciente", 2) - 0.32
sc("naoepreco", "HangingTags", a, W("escolhe", 2) - 0.45, {"big": True, "tags": [{"label": "mais barato", "at": 0.05}], "strikeAt": r(W("não", 2), a)}, label="Etiqueta 'mais barato' riscada", enter="drop")
a = W("escolhe", 2) - 0.42
sc("entendeu", "MenuCard", a, 74.4, {"mode": "blur", "items": [dict(m, at=round(k * 0.05, 3)) for k, m in enumerate(M)], "blurAt": r(W("única"), a), "keep": 0}, label="Cardápio embaçado, só o preço", enter="whip-left")
a = 74.43
sc("cta", "PollCta", a, DUR, {"question": "Qual desses acontece mais na sua clínica?", "options": ["a pergunta errada", "o preço cedo demais", "a lista em vez do plano"], "tapAt": r(W("três", 2), a), "keyword": "1, 2 ou 3", "kwAt": r(W("clínica", 2), a)},
   label="Enquete 1, 2 ou 3", enter="zoom")

doc = {
    "version": 1, "slug": SLUG, "comp": "ErrosEdit", "fps": FPS, "duration": DUR,
    "video": {"src": f"videos/{SLUG}/master.mp4", "fit": {"scale": 1, "top": 570}, "handle": "@opaulosandrade"},
    "captions": {"y": 980, "size": 56, "groupSize": 3, "hot": ["avulso", "plano"], "words": [{"word": w["word"], "start": w["start"], "end": w["end"]} for w in words]},
    "zoom": {"snaps": [{"t": 0, "z": 1}, {"t": 20.35, "z": 1.04}, {"t": 40.25, "z": 1}, {"t": 56.35, "z": 1.04}, {"t": 69.05, "z": 1}],
             "pushes": [{"t": W("pronto"), "z": 1.06, "up": 14, "until": W("aí") - 0.1}, {"t": W("armadilha") - 0.3, "z": 1.06, "up": 12, "until": W("ela", 4) - 0.1},
                        {"t": W("fica") - 0.2, "z": 1.06, "up": 12, "until": W("agora") - 0.1}, {"t": W("escolhe", 2) - 0.3, "z": 1.07, "up": 14, "until": 74.3}]},
    "scenes": scenes, "sounds": [],
    "soundTracks": [{"id": "t1", "name": "Efeitos"}, {"id": "t2", "name": "Impactos"}],
}
for i in range(len(scenes) - 1):
    s, n = scenes[i], scenes[i + 1]
    if s["lane"] == 0 and n["lane"] == 0 and s["end"] > n["start"]:
        print("SOBREPOSTO", s["id"], n["id"], s["end"], n["start"])
json.dump(doc, open(os.path.join(VD, "edit.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=2)
for s in scenes:
    print(f"{s['start']:6.2f}-{s['end']:6.2f} {s['type']:13s} {s['label']}")
