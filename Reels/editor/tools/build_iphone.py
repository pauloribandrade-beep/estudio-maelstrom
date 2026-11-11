# Monta o edit.json do vídeo "se a Apple vendesse igual a maioria" (Palco, cenas de cenas-apple.tsx).
# Depois de rodar: python tools/collect_sfx.py <slug> IphoneCollect --all (este script grava sounds: []).
import json, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SLUG = "2026-09-28_iphone-percepcao-de-valor"
VD = os.path.join(ROOT, "src", "videos", SLUG)
spec = json.load(open(os.path.join(VD, "segments.json"), encoding="utf-8"))
FPS = spec.get("fps", 30)
DUR = round(spec["totalFrames"] / FPS, 3)
words = json.load(open(os.path.join(VD, "words.json"), encoding="utf-8"))


def W(word, near):
    """início (s da edição) da ocorrência da palavra mais perto de `near`"""
    hits = [w["start"] for w in words if w["word"].lower().strip(" .,?!:;") == word.lower()]
    if not hits:
        raise KeyError(word)
    t = min(hits, key=lambda s: abs(s - near))
    if abs(t - near) > 1.0:
        raise KeyError(f"{word} perto de {near}: achou {t}")
    return t


scenes = []


def sc(id_, typ, a, b, props, label, enter=None):
    d = {"id": id_, "type": typ, "start": round(a, 3), "end": round(b, 3), "lane": 0, "label": label, "props": props}
    if enter:
        d["enter"] = enter
    scenes.append(d)


r = lambda t, a: round(t - a, 3)
# cada cena vai do começo da fala dela até ~0,05 s antes da próxima
b = lambda word, near: W(word, near) - 0.05
nx = lambda word, near: W(word, near) - 0.02

a = 0.0
# cenas 1 e 2 na linguagem premium (apple-premium.tsx, iPhone 3D): sem `enter`, a cena entra focando sozinha
sc("abertura", "AppleOpen", a, b("o", 7.0), {"mayAt": r(W("maioria", 2.0), a), "calloutAt": r(W("iphone", 3.26), a), "rollAt": r(W("custar", 3.76), a), "zeroAt": r(W("ninguém", 5.2), a)}, "iPhone 3D: R$ 12.000 rola até R$ 1.000, pedidos 0")
a = nx("o", 7.0)
sc("lancamento", "LensReveal", a, b("tem", 11.46), {"name": "iPhone 18", "nameAt": r(W("18", 7.44), a), "specAt": r(W("chegou", 8.2), a), "spec2At": r(W("brasil", 8.78), a), "priceAt": r(W("12", 10.5), a)}, "Lentes em close, recua: iPhone 18, R$ 12 mil")
a = nx("tem", 11.46)
sc("parcelas", "Installments", a, b("agora", 16.84), {"parcelAt": r(W("parcelando", 11.92), a), "installAt": r(W("12", 12.84), a), "askAt": r(W("pedir", 14.22), a), "zeroAt": r(W("real", 14.96), a), "discAt": r(W("desconto", 15.64), a), "appleAt": r(W("apple", 16.36), a)}, "Pagamento: 12x de R$ 1.000, desconto pedido R$ 0,00")
a = nx("agora", 16.84)
sc("luzes", "LightsToOffice", a, b("ela", 21.48), {"offAt": r(W("imagina", 17.2), a), "officeAt": r(W("maioria", 19.46), a)}, "Holofote apaga: o jeito da maioria")
a = nx("ela", 21.48)
sc("pdf", "PdfDesk", a, b("aquele", 26.94), {"scrollAt": r(W("40", 22.86), a), "lastAt": r(W("última", 25.68), a), "pages": 40, "price": "R$ 12.000"}, "PDF de 40 páginas na mesa, preço na última")
a = nx("aquele", 26.94)
sc("email", "EmailSend", a, b("três", 30.3), {"text": "Qualquer dúvida, estou à disposição.", "typeAt": r(W("qualquer", 28.22), a), "typeDur": 46}, "E-mail: qualquer dúvida, estou à disposição -> enviar")
a = W("três", 30.3) - 0.03
sc("vacuo", "ThreeDays", a, b("e", 34.3), {"flipAt": 0.03, "chatAt": r(W("conseguiu", 32.94), a), "text": "Conseguiu dar uma olhadinha?", "typeDur": 36}, "3 dias depois: conseguiu dar uma olhadinha?")
a = nx("e", 34.3)
sc("desconto", "ObjectionCut", a, b("ninguém", 43.84), {"objectionAt": r(W("objeção", 35.12), a), "offerAt": r(W("se", 39.26), a), "offer": "Se você fechar essa semana, eu consigo 10% de desconto.", "offerDur": 132, "stickAt": r(W("10", 41.8), a)}, "Objeção -> preço rola para R$ 10.800")
a = nx("ninguém", 43.84)
sc("liquidacao", "NoSale", a, b("porque", 47.12), {"fallAt": r(W("comprar", 44.44), a), "priceAt": r(W("12", 45.58), a), "leaveAt": r(W("desse", 46.34), a)}, "iPhone cai e trinca: vendas 0, preço riscado, luz apaga")
a = nx("porque", 47.12)
sc("porque", "EmptyWhy", a, b("você", 51.26), {"qAt": r(W("porque", 48.9), a), "meterAt": r(W("vale", 49.92), a)}, "Por que vale? quadro vazio")
a = nx("você", 51.26)
sc("lista", "SpecCollapse", a, b("e", 55.14), {"listAt": r(W("lista", 52.38), a), "collapseAt": r(W("e", 54.02), a)}, "Lista técnica vira só um número")
a = nx("e", 55.14)
sc("balanca", "PriceGauge", a, b("a", 63.02),
   {"bubbles": [{"text": "quanto custa?", "at": r(W("conversa", 55.94), a)}, {"text": "R$ 12.000", "at": r(W("preço", 57.98), a), "me": True},
                {"text": "tá caro...", "at": r(W("conversa", 59.4), a)}, {"text": "consigo 10% de desconto", "at": r(W("preço", 60.62), a), "me": True}],
    "tipAt": r(W("parece", 62.14), a)}, "Conversa só de preço, medidor vai a CARO")
a = nx("a", 63.02)
sc("especificacao", "ExplodedSpec", a, b("ela", 65.28), {"tearAt": r(W("especificação", 64.32), a)}, "Vista explodida fecha: não vende especificação")
a = nx("ela", 65.28)
sc("problemas", "YourPhone", a, b("quando", 75.7), {"lensAt": r(W("enxergar", 66.14), a), "storageAt": r(W("memória", 68.84), a), "batteryAt": r(W("bateria", 70.52), a), "photoAt": r(W("foto", 72.98), a)}, "Seu celular antigo rastreado: memória, bateria, foto")
a = nx("quando", 75.7)
sc("novo", "OldNewFocus", a, b("numa", 79.7), {"newAt": r(W("novo", 76.92), a), "dimAt": r(W("insatisfeito", 78.24), a)}, "Foco passa do seu para o novo")
a = nx("numa", 79.7)
sc("papel", "RoleQuestion", a, b("como", 87.1), {"roleAt": r(W("você", 81.64), a), "toolAt": r(W("perguntas", 83.44), a), "strikeAt": r(W("proposta", 85.66), a), "askAt": r(W("pergunta", 86.42), a)}, "Seu papel -> perguntas -> botão vira pergunta")
a = nx("como", 87.1)
sc("perguntas", "QuestionDepth", a, b("quando", 95.84),
   {"cards": [{"text": "Como você lida com esse problema hoje?", "at": 0.05}, {"text": "Quanto está te custando não resolver?", "at": r(W("quanto", 89.32), a)},
              {"text": "E se não resolver até o fim do ano?", "at": r(W("e", 92.14), a)}], "calAt": r(W("final", 95.04), a)}, "As 3 perguntas em profundidade")
a = nx("quando", 95.84)
sc("cliente", "TranscriptPanel", a, b("e", 100.3), {"typeAt": r(W("responde", 96.7), a), "highlights": [r(W("dizendo", 98.82), a), r(W("precisa", 99.64), a)]}, "Transcrição do cliente, o que ele precisa")
a = nx("e", 100.3)
sc("proposta", "ProposalAnswer", a, b("e", 107.2), {"listAt": r(W("lista", 102.86), a), "morphAt": r(W("resposta", 104.58), a)}, "Proposta vira a resposta ao que ele contou")
a = nx("e", 107.2)
sc("compara", "CostBars", a, b("a", 114.94), {"compAt": r(W("concorrente", 110.38), a), "swapAt": r(W("custo", 113.0), a)}, "Barras: concorrente -> custo de continuar")
a = nx("a", 114.94)
sc("fila", "StoreQueue", a, b("se", 123.14), {"queueAt": r(W("apple", 115.42), a), "convAt": r(W("convencido", 118.32), a), "swapAt": r(W("e", 119.0), a), "checkAt": r(W("certas", 122.44), a)}, "Fila na loja -> na sua empresa")
a = nx("se", 123.14)
sc("cta", "CtaFollow", a, DUR, {"proposalAt": r(W("proposta", 125.28), a), "loopAt": r(W("follow", 126.54), a), "breakAt": r(W("segue", 128.12), a), "handle": "@opaulosandrade", "dailyAt": r(W("todo", 128.92), a), "salesAt": r(W("vendas", 130.44), a), "closeAt": r(W("fechar", 131.54), a)}, "CTA: cobranças sem fim -> perfil, seguir, a semana acende")

# TRANSIÇÃO (pedido do Paulo): cada cena fica ~0,44 s por baixo da próxima, que entra por cima desfocada -> nítida
# (Focus/XFADE em apple-premium.tsx). Assim nenhuma troca passa pelo preto.
for i in range(len(scenes) - 1):
    scenes[i]["end"] = round(scenes[i + 1]["start"] + 0.44, 3)
doc = {
    "version": 1, "slug": SLUG, "comp": "IphoneEdit", "fps": FPS, "duration": DUR,
    "video": {"src": f"videos/{SLUG}/master.mp4", "fit": {"scale": 1, "top": 670}, "handle": "@opaulosandrade"},
    "captions": {"y": 980, "size": 56, "groupSize": 3, "hot": ["Apple", "perguntas", "preço"], "words": [{"word": w["word"], "start": w["start"], "end": w["end"]} for w in words]},
    "zoom": {"snaps": [{"t": 0, "z": 1}, {"t": nx("agora", 16.84), "z": 1.04}, {"t": nx("a", 63.02), "z": 1}, {"t": nx("numa", 79.7), "z": 1.04}, {"t": nx("e", 107.2), "z": 1}, {"t": nx("se", 123.14), "z": 1.04}],
             "pushes": [{"t": W("ninguém", 5.22) - 0.3, "z": 1.06, "up": 12, "until": W("o", 7.0) - 0.1}, {"t": W("ninguém", 43.84) - 0.3, "z": 1.07, "up": 14, "until": W("porque", 47.12) - 0.2},
                        {"t": W("a", 63.02) - 0.2, "z": 1.06, "up": 12, "until": W("ela", 65.28) - 0.2}, {"t": W("você", 117.36) - 0.3, "z": 1.07, "up": 14, "until": W("e", 119.0) - 0.1}]},
    "scenes": scenes, "sounds": [],
    "soundTracks": [{"id": "t1", "name": "Efeitos"}, {"id": "t2", "name": "Impactos"}],
}
json.dump(doc, open(os.path.join(VD, "edit.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=2)
for s in scenes:
    print(f"{s['start']:6.2f}-{s['end']:6.2f} {s['type']:15s} {s['label']}")
