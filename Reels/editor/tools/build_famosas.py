# Monta o edit.json do vídeo "famosas tirando o preenchimento" (tela dividida, narrativo com fotos e vídeo).
import json, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SLUG = "2026-09-27_famosas-tirando-preenchimento"
VD = os.path.join(ROOT, "src", "videos", SLUG)
IMG = f"videos/{SLUG}/img"
spec = json.load(open(os.path.join(VD, "segments.json"), encoding="utf-8"))
FPS = spec.get("fps", 30)
DUR = round(spec["totalFrames"] / FPS, 3)

# legenda: palavras da transcrição do áudio já cortado, com duas correções de pontuação
words = json.load(open(os.path.join(VD, "words.json"), encoding="utf-8"))
for i, w in enumerate(words):
    if w["word"] == "quer." and i + 1 < len(words) and words[i + 1]["word"] == "Resolver":
        w["word"] = "quer"
        words[i + 1]["word"] = "resolver"
    if w["word"] == "dizer" and i + 1 < len(words) and words[i + 1]["word"] == "agora":
        w["word"] = "dizer:"
json.dump(words, open(os.path.join(VD, "words.json"), "w", encoding="utf-8"), ensure_ascii=False)

K2015 = f"{IMG}/kylie-2015.jpg" if os.path.exists(os.path.join(ROOT, "public", IMG, "kylie-2015.jpg")) else f"{IMG}/kylie-jenner-headshot.jpg"
KBAFTA = f"{IMG}/kylie-bafta.jpg" if os.path.exists(os.path.join(ROOT, "public", IMG, "kylie-bafta.jpg")) else f"{IMG}/kylie-jenner2.jpg"

scenes = []


def sc(id_, typ, a, b, props, lane=0, label=None):
    scenes.append({"id": id_, "type": typ, "start": a, "end": b, "lane": lane, "label": label or id_, "props": props})


r = lambda t, a: round(t - a, 3)
sc("gancho", "BigType", 0.0, 5.3, {"title": "Ela criou a moda", "sub": "agora está tirando o preenchimento", "size": 120, "icon": "Sparkles"}, label="Ela criou a moda")
sc("kylie2015", "PhotoScene", 5.4, 12.95, {"src": K2015, "frame": "card", "caption": "Kylie Jenner, 2015"}, label="Foto Kylie 2015")
sc("17anos", "Stamp", 7.62, 12.95, {"text": "17 anos", "y": 640}, lane=1, label="Carimbo 17 anos")
sc("febre", "BigType", 13.05, 14.85, {"title": "Virou febre", "size": 130, "icon": "Flame", "accent": True}, label="Virou febre")
sc("speed", "VideoScene", 14.9, 18.1, {"src": f"{IMG}/speed.mp4", "caption": "o desafio do copo"}, label="Vídeo Speed (copo)")
sc("marca", "PhotoScene", 18.15, 24.75, {"src": f"{IMG}/kylie-cosmetics-melbourne-airport-duty-free-2024.jpg", "frame": "card", "caption": "Kylie Cosmetics"}, label="Foto loja Kylie Cosmetics")
sc("300mi", "Stamp", 22.38, 24.75, {"text": "US$ 300 milhões", "size": 64, "y": 600}, lane=1, label="Carimbo 300 milhões")
sc("dissolveu", "BigType", 24.8, 32.5, {"title": "Dissolveu metade", "sub": "do preenchimento", "size": 120, "icon": "Droplets"}, label="Dissolveu metade")
sc("bafta", "PhotoScene", 32.55, 37.95, {"src": KBAFTA, "frame": "card", "caption": "BAFTA 2026"}, label="Foto Kylie BAFTA")
sc("courteney", "PhotoScene", 38.0, 48.3, {"src": f"{IMG}/courteney-cox-10-paleyfest.jpg", "frame": "card", "caption": "Courteney Cox, de Friends", "credit": "foto: Albert Domasin / CC BY-SA 2.0"}, label="Foto Courteney Cox")
sc("estranha", "Stamp", 46.54, 48.3, {"text": "tanta aplicação", "size": 60, "y": 640}, lane=1, label="Carimbo tanta aplicação")
sc("fatigue", "BigType", 48.38, 53.85, {"title": "Filler fatigue", "sub": "o cansaço do preenchimento", "size": 120, "icon": "BatteryLow", "accent": True}, label="Filler fatigue")
sc("naofoiuma", "IconBadge", 53.9, 58.1, {"icon": "SearchX", "label": "não foi uma aplicação que deu errado", "tone": "white"}, label="Não foi uma aplicação")
sc("excesso", "ListStack", 58.18, 67.75, {"title": "o excesso vem aos poucos", "items": [
    {"text": "um ml aqui", "at": r(61.36, 58.18)},
    {"text": "mais um ali", "at": r(62.6, 58.18)},
    {"text": "a cada visita", "at": r(63.6, 58.18)},
    {"text": "sem olhar o rosto inteiro", "at": r(64.66, 58.18)},
]}, label="O excesso")
sc("especialistas", "BigType", 67.82, 72.5, {"title": "Especialistas em protocolo", "size": 110, "icon": "ClipboardList", "accent": True}, label="Especialistas em protocolo")
sc("naoe", "ChipGrid", 72.58, 80.25, {"title": "não é", "chips": [
    {"text": "procedimento isolado", "at": r(73.8, 72.58)},
    {"text": "um pouco com cada um", "at": r(75.62, 72.58)},
    {"text": "sem saber aonde chegar", "at": r(78.38, 72.58)},
]}, label="Não é")
sc("plano", "TimelineDots", 80.32, 88.65, {"title": "um plano pro seu caso", "points": [
    {"label": "começo", "at": r(86.24, 80.32)},
    {"label": "meio", "at": r(86.82, 80.32)},
    {"label": "reavaliação", "at": r(87.56, 80.32)},
]}, label="Plano (começo, meio, reavaliação)")
sc("naoprecisa", "BigType", 88.72, 92.4, {"title": "Agora não precisa", "size": 120, "icon": "Hand"}, label="Agora não precisa")
sc("cta", "IconBadge", 92.46, DUR, {"icon": "UserPlus", "label": "me seguir: isso precisa", "tone": "white"}, label="CTA")

doc = {
    "version": 1,
    "slug": SLUG,
    "comp": "FamosasEdit",
    "fps": FPS,
    "duration": DUR,
    "video": {"src": f"videos/{SLUG}/ig1080.mp4", "fit": {"scale": 1.0, "top": 830}, "handle": "@opaulosandrade"},
    "captions": {"y": 980, "size": 52, "groupSize": 3, "hot": ["protocolo.", "precisa."], "words": [{"word": w["word"], "start": w["start"], "end": w["end"]} for w in words]},
    "zoom": {"snaps": [{"t": 0.0, "z": 1.0}], "pushes": [
        {"t": 0.3, "z": 1.06, "up": 14, "until": 5.2},
        {"t": 30.1, "z": 1.05, "up": 12, "until": 32.4},
        {"t": 67.9, "z": 1.07, "up": 14, "until": 72.4},
        {"t": 90.8, "z": 1.06, "up": 12, "until": 92.3},
    ]},
    "scenes": scenes,
    "sounds": [],
    "soundTracks": [{"id": "t1", "name": "Efeitos"}, {"id": "t2", "name": "Impactos"}],
}
path = os.path.join(VD, "edit.json")
if os.path.exists(path):
    old = json.load(open(path, encoding="utf-8"))
    doc["sounds"] = old.get("sounds", [])
    doc["voice"] = old.get("voice")
    if doc["voice"] is None:
        del doc["voice"]
json.dump(doc, open(path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("edit.json:", len(scenes), "cenas, duração", DUR)
