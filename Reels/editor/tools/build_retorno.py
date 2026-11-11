# Monta o edit.json do vídeo "a paciente que nunca mais voltou" (Palco, cenas de metáfora de cenas-retorno.tsx).
# Depois de rodar: python tools/collect_sfx.py <slug> RetornoCollect --all  (este script grava sounds: []).
import json, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SLUG = "2026-09-28_paciente-que-nunca-mais-voltou"
VD = os.path.join(ROOT, "src", "videos", SLUG)
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


def sc(id_, typ, a, b, props, label, enter=None, lane=0):
    d = {"id": id_, "type": typ, "start": round(a, 3), "end": round(b, 3), "lane": lane, "label": label, "props": props}
    if enter:
        d["enter"] = enter
    scenes.append(d)


r = lambda t, a: round(t - a, 3)
FICHAS = [{"name": "Beatriz", "last": "há 1 ano"}, {"name": "Ana", "last": "há 8 meses"}, {"name": "Carla", "last": "há 6 meses"}]

a = 0.0
sc("fichas", "PatientFiles", a, W("parece") - 0.05, {"cards": FICHAS, "fadeAt": r(W("nunca"), a), "label": "nunca mais voltaram", "labelAt": r(W("voltaram"), a)}, "Fichas desbotando")
a = W("parece") - 0.02
sc("estrelas", "StarFlip", a, W("nas") - 0.05, {"askAt": r(W("gostou"), a), "flipAt": r(W("não", 2), a)}, "1 estrela vira 5", enter="drop")
a = W("nas") - 0.02
sc("pegadas", "Footsteps", a, W("ela", 2) - 0.05, {"stepAt": 1.2, "every": 20, "steps": 5, "gapAt": r(W("próximo"), a)}, "Pegadas sem o próximo passo", enter="zoom")
a = W("ela", 2) - 0.02
sc("cartao-branco", "ReturnCard", a, W("aí") - 0.05,
   {"fields": [{"label": "Data", "focusAt": r(W("quando"), a)}, {"label": "Horário"}, {"label": "Pra quê", "focusAt": r(W("pra"), a)}]}, "Cartão de retorno em branco", enter="whip-left")
a = W("aí") - 0.02
sc("meses", "CalendarDrain", a, W("ela", 5) - 0.05, {"months": ["MAR", "ABR", "MAI", "JUN", "JUL", "AGO"], "pagesAt": r(W("meses"), a) - 0.4, "every": 5, "drainAt": r(W("resultado"), a), "drainDur": 24}, "Meses passando, resultado indo embora", enter="whip-right")
a = W("ela", 5) - 0.02
sc("postit", "PostIt", a, W("só") - 0.05, {"text": "cuidar disso de novo", "writeAt": r(W("cuidar"), a) - 0.15, "writeDur": 28}, "Post-it: cuidar disso de novo", enter="drop")
a = W("só") - 0.02
sc("anuncio", "SponsoredAd", a, W("muitas") - 0.45, {"postAt": r(W("instagram"), a), "tapAt": r(W("agenda"), a), "bookedAt": r(W("agenda") + 0.35, a)}, "Anúncio de outra clínica: agendou", enter="zoom")
a = W("muitas") - 0.42
sc("ponteiros", "TwoGauges", a, W("sua") - 0.45, {"dropAt": r(W("barato") + 0.15, a), "dropAt2": r(W("qualidade") + 0.2, a)}, "Preço e qualidade caindo", enter="flash")
a = W("sua") - 0.42
sc("lupa", "Magnifier", a, W("com", 2) - 0.05, {"label": "procurando pacientes novas"}, "Lupa procurando pacientes novas", enter="whip-left")
a = W("com", 2) - 0.02
sc("contatos", "ContactList", a, W("muda") - 0.45, {"label": "paradas no seu celular", "labelAt": r(W("paradas"), a)}, "Contatos parados", enter="drop")
a = W("muda") - 0.42
sc("chaves", "TwoKeys", a, W("retorno") - 0.12, {"at1": r(W("duas"), a), "at2": r(W("coisas"), a), "focus": 1, "focusAt": r(W("primeira"), a)}, "Duas chaves: a 1ª", enter="whip-right")
a = W("retorno") - 0.1
sc("cartao-cheio", "ReturnCard", a, W("segunda") - 0.55,
   {"fields": [{"label": "Data", "value": "15/03", "at": 0.15, "dur": 0.35}, {"label": "Horário", "value": "10h", "at": 0.55, "dur": 0.25}, {"label": "Pra quê", "value": "reavaliar e reforçar", "at": r(W("entende"), a), "dur": 0.9}], "stampAt": r(W("marcado"), a)},
   "Cartão de retorno preenchido e carimbado", enter="zoom")
a = W("segunda") - 0.52
sc("chave2", "TwoKeys", a, W("nada") - 0.05, {"at1": 0, "at2": 0, "focus": 2, "focusAt": r(W("segunda"), a)}, "Duas chaves: a 2ª", enter="flash")
a = W("nada") - 0.02
sc("promocao", "BroadcastBlocked", a, W("chamar") - 0.45, {"blastAt": r(W("disparar"), a), "blockAt": r(W("inteira", 2), a)}, "Promoção em massa: não", enter="whip-left")
a = W("chamar") - 0.42
sc("uma-por-uma", "ContactList", a, W("oi") - 0.05, {"pickAt": r(W("por", 2), a) - 0.4, "pick": 0, "note": "queria: tirar as manchas", "noteAt": r(W("lembrando"), a)}, "Contato escolhido + nota", enter="zoom")
a = W("oi") - 0.02
t_send = W("prioridade") + 0.75
sc("ana", "WhatsChat", a, W("confiou") - 1.25,
   {"text": "Oi, Ana! Tava revendo os nossos atendimentos e lembrei da nossa conversa sobre as manchas. Isso ainda é uma prioridade pra você?", "typeAt": 0.05, "typeDur": round((W("prioridade") + 0.6 - a) * FPS), "sentAt": r(t_send, a), "readAt": r(t_send + 0.5, a), "typingAt": r(t_send + 0.85, a)},
   "Mensagem para a Ana", enter="whip-right")
a = W("confiou") - 1.22
sc("voltou", "PatientFiles", a, W("aí", 2) - 0.45, {"cards": FICHAS, "backAt": r(W("confiou"), a), "back": 1}, "Ficha da Ana volta: voltou", enter="drop")
a = W("aí", 2) - 0.42
sc("cta", "CommentCta", a, DUR, {"question": "Quantas pacientes estão paradas na sua base hoje?", "hint": "comenta aqui", "hintAt": r(W("paradas", 2), a)}, "CTA: comenta quantas", enter="zoom")

for i in range(len(scenes) - 1):
    if scenes[i]["end"] > scenes[i + 1]["start"]:
        print("SOBREPOSTO", scenes[i]["id"], scenes[i + 1]["id"], scenes[i]["end"], scenes[i + 1]["start"])
doc = {
    "version": 1, "slug": SLUG, "comp": "RetornoEdit", "fps": FPS, "duration": DUR,
    "video": {"src": f"videos/{SLUG}/master.mp4", "fit": {"scale": 1, "top": 600}, "handle": "@opaulosandrade"},
    "captions": {"y": 980, "size": 56, "groupSize": 3, "hot": ["retorno", "confiou"], "words": [{"word": w["word"], "start": w["start"], "end": w["end"]} for w in words]},
    "zoom": {"snaps": [{"t": 0, "z": 1}, {"t": 38.75, "z": 1.04}, {"t": 47.05, "z": 1}, {"t": 64.15, "z": 1.04}, {"t": 70.85, "z": 1}],
             "pushes": [{"t": W("ninguém") - 0.2, "z": 1.06, "up": 12, "until": W("ela", 2) - 0.1}, {"t": W("menos") - 0.3, "z": 1.06, "up": 12, "until": W("sua") - 0.5},
                        {"t": W("paciente") - 0.3, "z": 1.07, "up": 14, "until": W("aí", 2) - 0.5}]},
    "scenes": scenes, "sounds": [],
    "soundTracks": [{"id": "t1", "name": "Efeitos"}, {"id": "t2", "name": "Impactos"}],
}
json.dump(doc, open(os.path.join(VD, "edit.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=2)
for s in scenes:
    print(f"{s['start']:6.2f}-{s['end']:6.2f} {s['type']:16s} {s['label']}")
