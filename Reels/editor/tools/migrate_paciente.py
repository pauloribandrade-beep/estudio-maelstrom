# Migração única do piloto (2026-09-27_paciente-brava-botox): Palco.tsx -> edit.json.
# Take único começando em 0.53 s da gravação, então tempo da edição = original - 0.53.
import json, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SLUG = "2026-09-27_paciente-brava-botox"
VD = os.path.join(ROOT, "src", "videos", SLUG)
A0 = 0.53
FPS = 30

spec = json.load(open(os.path.join(VD, "segments.json"), encoding="utf-8"))
total_frames = spec["totalFrames"]
DUR = round(total_frames / FPS, 3)


def e(t):
    return round(t - A0, 3)


def rel(t, frm):
    return round(t - frm, 3)


scenes = []


def sc(id_, typ, frm, to, props, lane=0, label=None):
    scenes.append({"id": id_, "type": typ, "start": e(frm), "end": (DUR if to == "end" else e(to)), "lane": lane, "label": label or id_, "props": props})


sc("gancho", "BigType", 0.53, 4.85, {"title": "Nunca pediu botox", "sub": "a 1ª paciente da história", "size": 120, "icon": "Syringe", "iconOff": True}, label="Nunca pediu botox")
sc("brava", "VectorFace", 4.87, 8.45, {"mood": "angry", "caption": "chegou brava pra reclamar"}, label="Paciente brava")
sc("ficha80", "ClinicNote", 8.55, 12.7, {"title": "Canadá · anos 80", "lines": [{"label": "médica", "text": "Jean Carruthers, oftalmologista", "at": rel(10.61, 8.55), "dur": rel(12.6, 10.61)}]}, label="Ficha anos 80")
sc("palpebra", "EyeCloseUp", 12.75, 16.5, {"syringeAt": rel(13.59, 12.75), "calmAt": rel(15.4, 12.75), "caption": "toxina para espasmo na pálpebra"}, label="Olho / espasmo")
sc("reclamacao", "VectorFace", 16.63, 25.9, {
    "mood": "angry", "calmAt": rel(24.79, 16.63), "pointAt": rel(18.09, 16.63),
    "bubbles": [{"text": "Você não aplicou aqui.", "at": rel(20.05, 16.63)}, {"text": "Quando você aplica aqui, eu fico com uma expressão tranquila.", "at": rel(22.15, 16.63)}],
}, label="Reclamação")
sc("ouviu", "IconBadge", 25.93, 28.0, {"icon": "Ear", "label": "a Jean ouviu", "tone": "white"}, label="A Jean ouviu")
sc("proprio-rosto", "VectorFace", 28.09, 29.6, {"coat": True, "syringeAt": round(2 / FPS, 3), "caption": "testou no próprio rosto"}, label="Testou no próprio rosto")
sc("18", "Ring", 29.67, 37.3, {"value": 18, "max": 18, "label": "pacientes em 5 anos"}, label="18 pacientes")
sc("loucura", "Stamp", 35.33, 37.3, {"text": "Loucura"}, lane=1, label="Carimbo Loucura")
sc("n1-foto", "PhotoScene", 37.54, 42.2, {"src": f"videos/{SLUG}/img/doctor-performing-botox-injection.jpg", "frame": "card", "caption": "Procedimento estético não cirúrgico mais feito do mundo"}, label="Foto nº 1")
sc("n1", "Stamp", 40.45, 42.2, {"text": "Nº 1", "size": 90, "y": 560}, lane=1, label="Carimbo Nº 1")
sc("nao-pediu", "BigType", 42.35, 48.2, {"title": "Não pediu toxina", "sub": "nem a primeira paciente", "size": 120, "icon": "Syringe", "iconOff": True}, label="Não pediu toxina")
sc("contou", "IconBadge", 48.26, 50.6, {"icon": "MessageCircle", "label": "contou o que incomodava", "tone": "white"}, label="Contou")
sc("sua-paciente", "IconBadge", 50.75, 54.0, {"icon": "Users", "label": "a sua paciente faz o mesmo"}, label="Sua paciente")
sc("queixa", "ClinicNote", 54.03, 58.7, {"lines": [
    {"label": "queixa", "text": "o que incomoda", "at": rel(55.73, 54.03), "dur": rel(56.9, 55.73)},
    {"label": "resposta", "text": "seringa", "at": rel(57.51, 54.03), "dur": rel(58.6, 57.51)},
]}, label="Queixa x seringa")
sc("ml", "ChipGrid", 58.75, 61.45, {"title": "responde falando", "chips": [
    {"text": "em ml", "at": rel(59.43, 58.75)}, {"text": "em unidade", "at": rel(60.15, 58.75)}, {"text": "por região", "at": rel(60.97, 58.75)},
]}, label="ml / unidade / região")
sc("sem-plano", "IconBadge", 61.49, 66.3, {"icon": "ClipboardX", "label": "sem plano de tratamento"}, label="Sem plano")
sc("desfechos", "ListStack", 66.51, 72.2, {"title": "aí a paciente", "items": [
    {"text": "compara preço", "at": rel(67.79, 66.51)}, {"text": "fecha avulso", "at": rel(68.73, 66.51)}, {"text": "vou pensar", "at": rel(70.99, 66.51)},
]}, label="Desfechos")
sc("protocolo", "ProtocolStack", 72.33, 82.5, {"name": "o plano pro problema dela", "layers": [
    {"icon": "Target", "text": "a dor que ela contou", "at": rel(75.07, 72.33)},
    {"icon": "Layers", "text": "o protocolo", "at": rel(76.77, 72.33)},
    {"icon": "ClipboardList", "text": "o plano de tratamento", "at": rel(79.47, 72.33)},
]}, label="Protocolo")
sc("nao-e-venda", "Stamp", 77.99, 79.0, {"text": "Não é venda", "size": 60}, lane=1, label="Carimbo Não é venda")
sc("cta", "IconBadge", 82.67, "end", {"icon": "Send", "label": "manda pra aquela colega", "tone": "white"}, label="CTA")


# a batida solta do Palco.tsx (fora de cena): mesma escolha de arquivo do Snd (hash FNV)
def variant(name, key=""):
    counts = json.load(open(os.path.join(ROOT, "src", "lib", "sfx-manifest.json"), encoding="utf-8"))
    h = 2166136261
    for ch in key + name:
        h = ((h ^ ord(ch)) * 16777619) & 0xFFFFFFFF
    if h >= 2**31:
        h -= 2**32
    return f"sfx/{name}_{abs(h) % counts.get(name, 1)}.wav"


loose_sounds = [{"id": "s-drop-n1", "src": variant("drop"), "start": e(40.45), "vol": 0.3, "label": "batida Nº 1"}]

words = json.load(open(os.path.join(VD, "words.json"), encoding="utf-8"))
doc = {
    "version": 1,
    "slug": SLUG,
    "fps": FPS,
    "duration": DUR,
    "video": {"src": f"videos/{SLUG}/ig1080.mp4", "fit": {"scale": 0.9, "top": 780}, "handle": "@opaulosandrade"},
    "captions": {"y": 980, "size": 52, "groupSize": 3, "hot": ["seringa,", "protocolo"], "words": [{"word": w["word"], "start": w["start"], "end": w["end"]} for w in words]},
    "zoom": {
        "snaps": [{"t": e(t), "z": z} for t, z in [(0.53, 1.0), (8.45, 1.04), (42.25, 1.0), (82.55, 1.04)]],
        "pushes": [
            {"t": e(3.0), "z": 1.06, "up": 14, "until": e(4.8)},
            {"t": e(26.3), "z": 1.05, "up": 10, "until": e(27.9)},
            {"t": e(56.6), "z": 1.06, "up": 12, "until": e(58.8)},
            {"t": e(78.6), "z": 1.07, "up": 14, "until": e(81.8)},
        ],
    },
    "scenes": scenes,
    "sounds": loose_sounds,  # os sons das cenas entram com tools/collect_sfx.mjs
}
json.dump(doc, open(os.path.join(VD, "edit.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("edit.json:", len(scenes), "cenas,", len(words), "palavras, duração", DUR, "s")
