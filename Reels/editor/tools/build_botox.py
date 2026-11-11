# Monta o edit.json do vídeo "o botox nasceu de uma salsicha estragada" (Palco, cenas de cenas-botox.tsx).
# Depois de rodar: python tools/collect_sfx.py <slug> BotoxCollect --all (este script grava sounds: []).
import json, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SLUG = "2026-09-27_botox-salsicha"
VD = os.path.join(ROOT, "src", "videos", SLUG)
IMG = f"videos/{SLUG}/img"
spec = json.load(open(os.path.join(VD, "segments.json"), encoding="utf-8"))
FPS = spec.get("fps", 30)
DUR = round(spec["totalFrames"] / FPS, 3)
words = json.load(open(os.path.join(VD, "words.json"), encoding="utf-8"))


def W(word, n=1):
    """início (s da edição) da n-ésima vez que a palavra aparece"""
    k = 0
    for w in words:
        if w["word"].lower().strip(".,?!:;") == word.lower():
            k += 1
            if k == n:
                return w["start"]
    raise KeyError(f"{word} #{n}")


scenes = []


def sc(id_, typ, a, b, props, label, enter=None):
    d = {"id": id_, "type": typ, "start": round(a, 3), "end": round(b, 3), "lane": 0, "label": label, "props": props}
    if enter:
        d["enter"] = enter
    scenes.append(d)


r = lambda t, a: round(t - a, 3)

a = 0.0
sc("salsicha", "RottenSausage", a, W("e") - 0.05, {"vialAt": r(W("nasceu"), a), "yuckAt": r(W("estragada"), a)}, "Salsicha estragada: nasce o frasco")
a = W("e") - 0.02
sc("expressao", "QuoteDrop", a, 5.9, {"phrase": "força de expressão", "dropAt": r(W("força"), a), "result": "fato histórico"}, "Força de expressão -> fato", enter="zoom")
a = 5.93  # "fato histórico" fica ~1,7 s na tela (pedido do Paulo)
sc("jornal", "OldNewspaper", a, W("foi") + 0.45,  # a salsicha fica ~1,3 s no jornal
   {"date": "Alemanha · 1800s", "dateAt": r(W("alemanha"), a), "headline": "Paralisia misteriosa depois de comer salsicha", "headAt": r(W("morrendo"), a), "headDur": 60, "imageAt": r(W("salsicha", 2), a), "caption": "a suspeita", "sub": "casos se espalham pela região", "subAt": r(W("comer"), a)}, "Jornal antigo", enter="drop")
a = W("foi") + 0.48
sc("kerner", "PortraitFrame", a, W("juntou") - 0.05, {"src": f"{IMG}/justinus-kerner-1844.jpg", "name": "Justinus Kerner", "sub": "médico, Alemanha", "nameAt": r(W("justinus"), a), "focus": [50, 26]}, "Retrato de Justinus Kerner", enter="whip-left")
a = W("juntou") - 0.02
sc("casos", "CaseFiles", a, W("inclusive") - 0.05, {"to": 76, "countAt": r(W("76"), a) - 0.2, "dur": 1.1, "label": "o veneno descrito", "labelAt": r(W("veneno"), a)}, "76 casos", enter="whip-right")
a = W("inclusive") - 0.02
sc("botulus", "StoneTablet", a, W("e", 3) - 0.05, {"top": "botulismo", "topAt": r(W("botulismo"), a), "word": "BOTULUS", "wordAt": r(W("botulus"), a), "meaning": "salsicha, em latim", "meaningAt": r(W("latim"), a) - 0.3}, "Botulus = salsicha", enter="zoom")
a = W("e", 3) - 0.02
sc("pena", "QuillNote", a, W("só") - 0.05,
   {"year": "1822", "yearAt": r(W("época"), a), "lines": [{"text": "o veneno...", "at": r(W("veneno", 2), a), "dur": 0.6}, {"text": "numa dose mínima", "at": r(W("dose"), a), "dur": 0.7}, {"text": "pode virar remédio", "at": r(W("virar"), a), "dur": 0.8}], "dropAt": r(W("mínima"), a)},
   "Pergaminho: dose mínima vira remédio", enter="drop")
a = W("só") - 0.02
sc("150anos", "YearOdometer", a, W("quem") - 0.05, {"from": 1822, "to": 1977, "rollAt": r(W("levou"), a), "dur": 2.4, "label": "mais de 150 anos", "labelAt": r(W("anos"), a)}, "Anos girando 1822 -> 1977", enter="flash")
a = W("quem") - 0.02
sc("scott", "EyeChart", a, W("em", 2) - 0.2, {"name": "Alan Scott", "sub": "oftalmologista · EUA", "nameAt": r(W("alan"), a)}, "Tabela de vista: Alan Scott", enter="whip-left")
a = W("em", 2) - 0.17
sc("estrabismo", "EyesAlign", a, W("ele", 2) - 0.05, {"year": "1977", "yearAt": r(W("1977"), a), "syringeAt": r(W("toxina"), a), "alignAt": r(W("estrabismo"), a) + 0.3, "caption": "estrabismo tratado"}, "Olhos se alinham", enter="zoom")
a = W("ele", 2) - 0.02
sc("oculinum", "VialLabel", a, W("e", 4) - 0.05, {"label": "OCULINUM", "labelAt": r(W("oculinum"), a)}, "Frasco: Oculinum", enter="drop")
a = W("e", 4) - 0.02
sc("contrato", "ContractSign", a, W("a", 3) - 0.05, {"title": "Cessão de direitos", "year": "1991", "buyer": "Allergan", "buyerAt": r(W("allergan"), a), "signAt": r(W("vendeu"), a), "signDur": 69, "amount": "US$ 9 milhões", "amountAt": r(W("nove"), a)}, "Contrato 1991: US$ 9 milhões", enter="whip-right")
a = W("a", 3) - 0.02
sc("botox", "VialLabel", a, W("somando") + 0.3,  # Botox fica na tela até o "somando" (pedido do Paulo: o glow durava 0,5 s)
   {"label": "OCULINUM", "labelAt": 0, "label2": "BOTOX", "peelAt": r(W("trocou"), a), "newAt": r(W("botox", 2), a)}, "Rótulo descasca: Botox", enter="zoom")
a = W("somando") + 0.33
sc("bilhoes", "RevenueStack", a, W("e", 7) - 0.05, {"to": 6, "unit": "bilhões", "countAt": r(W("faturou"), a), "dur": 1.4, "bars": [{"label": "médico", "at": r(W("médico", 2), a), "share": 0.45}, {"label": "estético", "at": r(W("estético"), a), "share": 0.5}]}, "Faturamento: US$ 6 bilhões", enter="flash")
a = W("e", 7) - 0.02
sc("mesmo", "ThreeVials", a, W("mudou") - 0.55, {"labels": [{"top": "veneno", "sub": "1822"}, {"top": "OCULINUM", "sub": "1977"}, {"top": "BOTOX", "sub": "hoje"}], "eqAt": r(W("mesmo"), a)}, "Três frascos iguais", enter="whip-left")
a = W("mudou") - 0.52
sc("caixa", "GiftBox", a, W("se", 2) - 0.05, {"closeAt": r(W("fizeram"), a), "tags": [{"text": "nome", "at": r(W("mudou"), a)}, {"text": "história", "at": r(W("fizeram"), a) + 0.3}, {"text": "posicionamento", "at": r(W("depois", 2), a)}]}, "Caixa premium: o que fizeram com ele", enter="zoom")
a = W("se", 2) - 0.02
sc("cta", "BookCta", a, DUR, {"title": "Histórias da estética", "handle": "@opaulosandrade", "chapter": "Como virou estético", "flipAt": r(W("segue"), a), "followAt": r(W("segue"), a) + 0.8}, "CTA: livro, capítulo 2", enter="drop")

for i in range(len(scenes) - 1):
    if scenes[i]["end"] > scenes[i + 1]["start"]:
        print("SOBREPOSTO", scenes[i]["id"], scenes[i + 1]["id"], scenes[i]["end"], scenes[i + 1]["start"])
doc = {
    "version": 1, "slug": SLUG, "comp": "BotoxEdit", "fps": FPS, "duration": DUR,
    "video": {"src": f"videos/{SLUG}/master.mp4", "fit": {"scale": 1, "top": 650}, "handle": "@opaulosandrade"},
    "captions": {"y": 980, "size": 56, "groupSize": 3, "hot": ["salsicha", "Botox"], "words": [{"word": w["word"], "start": w["start"], "end": w["end"]} for w in words]},
    "zoom": {"snaps": [{"t": 0, "z": 1}, {"t": W("foi") - 0.02, "z": 1.04}, {"t": W("só") - 0.02, "z": 1}, {"t": W("e", 5) - 0.02, "z": 1.04}, {"t": W("se", 2) - 0.02, "z": 1}],
             "pushes": [{"t": W("mais") - 0.3, "z": 1.06, "up": 12, "until": W("só") - 0.3}, {"t": W("faturou") - 0.2, "z": 1.07, "up": 14, "until": W("e", 7) - 0.2},
                        {"t": W("produto") - 0.3, "z": 1.06, "up": 12, "until": W("depois", 2) + 0.4}]},
    "scenes": scenes, "sounds": [],
    "soundTracks": [{"id": "t1", "name": "Efeitos"}, {"id": "t2", "name": "Impactos"}],
}
json.dump(doc, open(os.path.join(VD, "edit.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=2)
for s in scenes:
    print(f"{s['start']:6.2f}-{s['end']:6.2f} {s['type']:14s} {s['label']}")
