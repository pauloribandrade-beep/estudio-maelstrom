# Monta o edit.json do vídeo "Vergonha de falar o preço" (Palco dinâmico).
import json, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SLUG = "2026-09-28_vergonha-de-falar-o-preco"
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

# cenas (cenas-dinamicas.tsx): tela dividida o vídeo inteiro; estilo novo nas animações. Tempos em s da edição.
def S(id_, typ, a, b, props, label, enter=None, lane=0):
    rel = lambda v: v if not isinstance(v, (int, float)) else round(v - a, 3)
    def conv(o, key=""):
        if isinstance(o, dict):
            return {k: conv(v, k) for k, v in o.items()}
        if isinstance(o, list):
            return [conv(x) for x in o]
        if isinstance(o, (int, float)) and not isinstance(o, bool) and (key == "at" or key.endswith("At")):
            return round(o - a, 3)
        if isinstance(o, dict) is False and o is None:
            return None
        return o
    sc(id_, typ, a, b, conv(props), lane=lane, label=label, enter=enter)

PHOTO = f"videos/{SLUG}/img/doctor-working-in-her-office-while-using-a-compu.jpg"
T, G, V, B, R = "#2dd4bf", "#f5b942", "#a78bfa", "#60a5fa", "#D82810"


def D(id_, a, b, label, objs, cam=None, chips=None, bubbles=None, links=None, moves=None, enter=None, dive=True):
    props = {"objs": objs}
    if cam: props["cam"] = cam
    if chips: props["chips"] = chips
    if bubbles: props["bubbles"] = bubbles
    if links: props["links"] = links
    if moves: props["moves"] = moves
    if not dive: props["dive"] = False
    S(id_, "Diorama", a, b, props, label, enter)


O = lambda src, x, y, at, **k: {"src": src, "x": x, "y": y, "at": at, **k}
C = lambda text, x, y, at, **k: {"text": text, "x": x, "y": y, "at": at, **k}
K = lambda at, x, y, zoom=1, dur=0.6: {"at": at, "x": x, "y": y, "zoom": zoom, "dur": dur}

# 1. gancho: vergonha + preço, a câmera anda até a paciente em dúvida
D("gancho", 0.0, 5.95, "Gancho: vergonha do preço, paciente em dúvida",
  [O("flushed_face", 520, 430, 1.2, id="face", size=300, fx="shake", fxAt=1.5),
   O("label", 880, 470, 2.5, id="tag", size=210, fx="spin", fxAt=2.55, color=R),
   O("woman", 1500, 450, 3.4, id="pac", size=290),
   O("red_question_mark", 1680, 280, 4.2, size=150, fx="pulse", fxAt=4.3)],
  cam=[K(0, 640, 520), K(3.3, 1450, 520)],
  chips=[C("vergonha de falar o preço", 690, 780, 1.4, color=R), C("duvidar do tratamento", 1500, 780, 4.3, color=G, img="thinking_face")])
# 2. clínicas chegando para resolver o comercial
D("clinicas", 6.0, 10.25, "Clínicas chegando: resolver o comercial",
  [O("hospital", 260, 470, 7.3, size=230, z=0.45), O("hospital", 540, 430, 7.6, size=270), O("hospital", 820, 470, 7.9, size=230, z=0.45)],
  cam=[K(0, 540, 520, 0.95), K(8.9, 540, 540, 1.08, 0.8)],
  chips=[C("resolver o comercial", 540, 780, 9.1, color=G, img="toolbox")], enter="drop")
# 3. a consulta: foto real, a câmera se aproxima e o preço chega
D("consulta", 10.3, 16.55, "Consulta: foto, paciente animada, hora do valor",
  [O(PHOTO, 470, 460, 10.35, id="foto", photo=True, w=720, h=470),
   O("smiling_face_with_smiling_eyes", 890, 640, 14.2, size=170), O("red_heart", 960, 470, 14.4, size=110, fx="pulse", fxAt=14.5),
   O("label", 470, 460, 15.7, id="tag", size=240, fx="shake", fxAt=16.0, color=R)],
  cam=[K(0, 560, 520, 0.95), K(15.5, 520, 490, 1.1, 0.7)],
  chips=[C("explicou tudo", 330, 230, 12.0, color=T, img="check_mark_button"), C("paciente animada", 800, 760, 14.3, color=G)], enter="zoom")
# 4. a voz muda: o som diminui, o papel, o número baixinho, e os balões do parcelar/desconto
D("voz", 16.6, 25.75, "A voz muda, número baixinho, parcelar e desconto",
  [O("woman_health_worker", 300, 470, 16.65, size=300),
   O("speaker_high_volume", 720, 320, 16.7, size=170, outAt=16.95),
   O("speaker_low_volume", 720, 320, 17.05, size=170, outAt=21.1, fx="shrink", fxAt=17.1),
   O("page_facing_up", 720, 590, 18.3, size=210, fx="shrink", fxAt=19.7, outAt=21.1)],
  cam=[K(0, 540, 520), K(21.2, 640, 520, 1, 0.5)],
  chips=[C("a voz muda", 720, 170, 17.0, color=V, outAt=18.1), C("o número baixinho", 720, 790, 19.6, color=V, img="speaker_low_volume", outAt=21.1)],
  bubbles=[{"text": "Mas dá pra parcelar, tá?", "x": 800, "y": 440, "at": 21.5, "w": 470},
           {"text": "E se ficar pesado, a gente vê um desconto.", "x": 820, "y": 700, "at": 23.0, "w": 520}], enter="whip-left")
# 5. a paciente nem reclamou; a médica já pede desculpa
D("desculpa", 25.8, 30.95, "Paciente calma, médica pedindo desculpa",
  [O("woman", 290, 470, 25.9, size=260), O("label", 700, 470, 27.7, id="tag", size=200, fx="shrink", fxAt=30.0, color=R),
   O("woman_bowing", 1090, 470, 29.0, size=280, fx="bow", fxAt=29.6)],
  cam=[K(0, 520, 520), K(28.9, 840, 520)],
  chips=[C("nem reclamou do preço", 330, 780, 26.8, color=G)],
  bubbles=[{"text": "desculpa…", "x": 1150, "y": 250, "at": 30.0, "tail": "right", "w": 360}], enter="drop")
# 6. o que a paciente entende: nem a médica acredita que vale
D("acredita", 31.0, 37.95, "Paciente pensando: nem a médica acredita",
  [O("thinking_face", 520, 430, 31.6, size=280),
   O("woman_health_worker", 1250, 450, 33.9, size=270, id="med"), O("cross_mark", 1420, 270, 35.3, size=110, fx="pulse", fxAt=35.4),
   O("label", 1640, 470, 36.6, size=190, fx="shake", fxAt=37.3, color=R)],
  cam=[K(0, 540, 520), K(33.8, 1250, 520), K(36.4, 1420, 520, 0.95)],
  chips=[C("o que a paciente entende?", 520, 780, 31.7, color=G, img="thinking_face"),
         C("nem a própria médica acredita", 1250, 780, 35.3, color=R), C("vale o que custa", 1640, 250, 36.8, color=R, strikeAt=37.4)], enter="flash")
# 7. o preço passando de mão em mão
D("maos", 38.0, 47.45, "O preço passando de mão em mão",
  [O("woman_health_worker", 250, 480, 38.4, id="med", size=220, label="médica"),
   O("label", 250, 250, 40.4, id="tag", size=150, color=R),
   O("woman_office_worker", 560, 480, 42.2, size=220, label="secretária", color=G),
   O("office_worker", 870, 480, 43.1, size=220, label="CRC", color=V),
   O("busts_in_silhouette", 1180, 480, 45.3, size=220, label="outra pessoa do time", color=B)],
  moves=[{"id": "tag", "at": 42.4, "x": 560, "y": 250}, {"id": "tag", "at": 43.3, "x": 870, "y": 250}, {"id": "tag", "at": 45.6, "x": 1180, "y": 250}],
  cam=[K(0, 560, 520, 0.95), K(44.9, 800, 520, 0.95)],
  chips=[C("pra fechar a venda", 800, 170, 46.7, color=R, img="money_bag")], enter="whip-right")
# 8. em quem a paciente confia
D("confia", 47.5, 55.75, "Em quem a paciente confia",
  [O("woman", 240, 520, 47.6, id="pac", size=230, label="paciente", color=G),
   O("woman_office_worker", 980, 300, 48.3, id="sec", size=170, z=0.3),
   O("woman_health_worker", 980, 640, 50.1, id="med", size=220)],
  links=[{"from": "pac", "to": "sec", "at": 48.6, "dashed": True, "color": "#9ca3af", "cutAt": 49.2}, {"from": "pac", "to": "med", "at": 50.6, "color": G}],
  cam=[K(0, 560, 520), K(51.5, 580, 500, 0.92)],
  chips=[C("avaliou", 470, 170, 51.8, color=G, img="magnifying_glass_tilted_left"), C("entendeu o que ela queria", 470, 250, 52.5, color=G, img="light_bulb"),
         C("indicou o tratamento", 470, 330, 54.7, color=G, img="stethoscope")], enter="zoom")
# 9. a recomendação perde força no caminho
D("sinal", 55.8, 61.25, "Recomendação perdendo força no caminho",
  [O("antenna_bars", 300, 330, 55.9, id="sig", size=210, fx="shrink", fxAt=59.3, label="sua recomendação", labelAt=58.4),
   O("office_worker", 720, 640, 56.3, size=190, z=0.45), O("person", 1120, 640, 59.8, size=190, z=0.45),
   O("chart_decreasing", 1400, 330, 59.5, size=150, fx="shake", fxAt=59.7)],
  moves=[{"id": "sig", "at": 56.7, "x": 720, "y": 330}, {"id": "sig", "at": 60.0, "x": 1120, "y": 330}],
  cam=[K(0, 520, 520), K(56.6, 720, 520), K(59.4, 1100, 520)], enter="whip-left")
# 10. quem indica conduz o fechamento
D("conduz", 61.3, 66.55, "Quem indica conduz o fechamento",
  [O("woman_health_worker", 330, 470, 63.2, size=280, label="quem indica", color=T),
   O("compass", 760, 320, 64.9, size=190, fx="spin", fxAt=65.1), O("handshake", 760, 580, 65.9, size=220, fx="glow", fxAt=66.0, color=T)],
  cam=[K(0, 540, 520), K(65.6, 640, 520, 1.1)],
  chips=[C("o contrário", 540, 190, 62.2, color=G, img="backhand_index_pointing_right", outAt=63.0), C("conduz o fechamento", 760, 830, 65.4, color=T)], enter="flash")
# 11. os 4 passos, subindo em diagonal (a câmera sobe junto)
D("passos", 66.6, 76.35, "Os 4 passos subindo",
  [O("speech_balloon", 380, 620, 66.8, size=190), O("light_bulb", 700, 440, 68.2, size=190, fx="glow", fxAt=68.4),
   O("clipboard", 1020, 260, 71.5, size=190), O("label", 1340, 80, 73.9, size=190, color=R)],
  cam=[K(0, 440, 560), K(68.1, 660, 420), K(71.4, 980, 240), K(73.8, 1300, 60)],
  chips=[C("fala a sua recomendação", 380, 470, 66.9, color=T, outAt=68.1), C("explica por que ela resolve", 700, 290, 68.3, color=G, outAt=71.4),
         C("mostra o que está incluído no plano", 1020, 110, 71.6, color=V, outAt=73.8), C("fala o valor total olhando pra ela", 1340, -70, 74.0, color=R)], enter="drop")
# 12. a mesma voz
D("mesmavoz", 76.4, 80.15, "A mesma voz",
  [O("speaker_high_volume", 300, 470, 76.5, size=220, label="explicar o tratamento", color=T, labelAt=78.7),
   O("speaker_high_volume", 780, 470, 76.8, size=220, label="o valor", color=T, labelAt=76.9, flip=True)],
  chips=[C("a mesma voz", 540, 190, 77.0, color=T, img="speaker_high_volume")], enter="zoom")
# 13. não se justifica; deixa reagir e responde
D("justifica", 80.2, 88.65, "Sem se justificar: corta, deixa reagir, responde",
  [O("woman_health_worker", 280, 470, 80.3, size=270), O("scissors", 620, 350, 83.2, size=170, fx="spin", fxAt=83.3, outAt=84.0),
   O("woman", 820, 470, 84.4, size=250), O("red_question_mark", 930, 250, 85.1, size=130, fx="pulse", fxAt=85.2)],
  bubbles=[{"text": "…", "x": 560, "y": 260, "at": 82.4, "outAt": 83.4, "w": 160}, {"text": "…", "x": 600, "y": 380, "at": 82.7, "outAt": 83.4, "w": 160},
           {"text": "…", "x": 640, "y": 500, "at": 83.0, "outAt": 83.4, "w": 160}],
  chips=[C("não sai justificando", 540, 790, 82.9, color=R, outAt=85.9),
         C("responde o que ela quer saber", 540, 790, 86.0, color=T, img="check_mark_button")], enter="whip-right")
# 14. a equipe entra depois
D("equipe", 88.7, 94.45, "A equipe entra depois",
  [O("woman_health_worker", 280, 480, 88.8, size=240, label="você", color=T), O("check_mark_button", 430, 420, 89.4, id="ok", size=110),
   O("busts_in_silhouette", 800, 480, 89.5, size=240, label="equipe", color=V)],
  moves=[{"id": "ok", "at": 90.2, "x": 660, "y": 420}],
  chips=[C("agendar", 800, 160, 90.8, color=V, img="spiral_calendar"), C("organizar o pagamento", 800, 235, 91.3, color=V, img="credit_card"),
         C("acompanhar", 800, 310, 93.0, color=V, img="memo")], enter="whip-left")
# 15. a decisão acontece com você na sala
D("sala", 94.5, 97.65, "A decisão na sala",
  [O("door", 540, 420, 94.6, size=330, fx="glow", fxAt=96.5, color=T), O("woman_health_worker", 330, 540, 95.9, size=200, z=0.15), O("woman", 750, 540, 96.0, size=200, z=0.15)],
  cam=[K(0, 540, 520), K(96.6, 540, 480, 1.1)],
  chips=[C("a decisão acontece com você na sala", 540, 180, 95.1, color=T, img="door")], enter="drop")
# 16. fechar ali mesmo, sem empurrar
D("fechar", 97.7, 100.85, "Fechar na consulta, sem empurrar",
  [O("handshake", 420, 420, 98.1, size=300, fx="glow", fxAt=98.5, color=T, label="na consulta", labelAt=99.2),
   O("raised_hand", 850, 470, 99.8, size=170, fx="shake", fxAt=100.0), O("cross_mark", 940, 350, 100.0, size=90)],
  chips=[C("sem empurrar nada", 850, 800, 99.9, color=R)], enter="zoom")
# 17. existe um jeito de conduzir
D("jeito", 100.9, 103.65, "Existe um jeito de conduzir",
  [O("compass", 540, 420, 100.95, size=300, fx="spin", fxAt=101.9)],
  chips=[C("um jeito de conduzir essa conversa", 540, 790, 101.4, color=T)], enter="flash")
# 18. balança: segurança x pressão
D("balanca", 103.7, 107.15, "Balança: segurança pesa, pressão sai",
  [O("balance_scale", 540, 400, 103.75, size=360, fx="bow", fxAt=105.1, flip=True),
   O("shield", 300, 600, 105.0, size=170, fx="glow", fxAt=105.1, color=T, label="segurança"),
   O("anxious_face_with_sweat", 790, 600, 106.3, size=150, fx="fall", fxAt=106.7)],
  chips=[C("pressão", 790, 820, 106.3, color=R, outAt=106.8)], enter="drop")
# 19. segurança não é arrogância; você confia
D("arrogancia", 107.2, 114.15, "Segurança não é arrogância; você confia",
  [O("shield", 380, 440, 107.5, size=280, fx="glow", fxAt=107.6, color=T, label="segurança"),
   O("crown", 790, 430, 109.6, size=200, z=0.2, fx="fall", fxAt=110.3),
   O("woman", 1280, 450, 111.0, size=260), O("sparkling_heart", 1440, 280, 112.3, size=120, fx="pulse", fxAt=112.4)],
  cam=[K(0, 580, 520), K(110.8, 1250, 520)],
  chips=[C("não é arrogância", 790, 700, 109.8, color=R, strikeAt=110.2), C("você confia no que está indicando", 1280, 790, 112.3, color=T)], enter="flash")
# 20. CTA: comenta CONSULTA; a mensagem chega na DM
D("cta", 114.2, DUR, "CTA: comenta CONSULTA, DM",
  [O("mobile_phone", 540, 440, 114.3, id="cel", size=330, fx="pulse", fxAt=117.6), O("speech_balloon", 800, 250, 115.9, size=150),
   O("envelope", 280, 250, 117.3, id="env", size=150)],
  moves=[{"id": "env", "at": 117.5, "x": 540, "y": 440}],
  chips=[C("comenta “CONSULTA”", 540, 800, 115.9, color=R, img="speech_balloon")], enter="zoom", dive=False)

# close nos cortes (pedido do usuário): alterna 1.0 / 1.08 nas emendas, no mínimo 2,5 s entre trocas
snaps = [{"t": 0, "z": 1.0}]
for seg in spec["segments"][1:]:
    if seg["editStart"] - snaps[-1]["t"] >= 2.5 and DUR - seg["editStart"] > 2:
        snaps.append({"t": round(seg["editStart"], 3), "z": 1.0 if len(snaps) % 2 == 0 else 1.08})

music = []  # música: o Paulo escolhe na aba Músicas do Estúdio

push = lambda w, n=1, z=1.06, pad=0.7: {"t": round(W(w, n) - 0.3, 3), "z": z, "up": 12, "until": round(E(w, n) + pad, 3)}
doc = {
    "version": 1, "slug": SLUG, "comp": "VergonhaEdit", "fps": FPS, "duration": DUR,
    "video": {"src": f"videos/{SLUG}/master.mp4", "fit": {"scale": 1, "top": 600}, "handle": "@opaulosandrade"},
    "captions": {"y": 980, "size": 56, "groupSize": 3, "hot": ["preço", "consulta"], "words": [{"word": w["word"], "start": w["start"], "end": w["end"]} for w in words]},
    "zoom": {"snaps": snaps,
             "pushes": [push("duvidar"), push("desculpa", z=1.07), push("custa"), push("força", pad=0.9),
                        push("fechamento", z=1.07), push("sala"), push("arrogância", z=1.07)]},
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
