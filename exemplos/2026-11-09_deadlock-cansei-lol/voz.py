import os
"""Voz do vídeo "cansei do LoL" (09/11/2026): SEGMENTOS EDITÁVEIS sobre a gravação inteira (Cansei de lol.wav, 4:20).
Regra: tira frase repetida/versão refeita (fica a última inteira), mantém improviso. Portador = bruto a 1,1x; palavras da transcrição por pedaço (CPU)."""
import json, re, subprocess

ED = os.environ.get("ESTUDIO_EDITOR") or os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "Reels", "editor")).replace("\", "/")
SL = "2026-11-09_deadlock-cansei-lol"
V, O = f"{ED}/public/videos/{SL}/", f"{ED}/out/{SL}/"
SRC = V + "bruto.wav"
FPS, TEMPO = 30, 1.1
GAP, PAD = 0.30, 0.11   # pausa interna maior que GAP é apertada, deixando PAD de cada lado
EDGE = 0.05

# (início, fim, nota) no bruto. "folga" = pausa que é piada: não aperta tanto.
TAKES = [
    (0.00, 6.40, "gancho: jogar LoL em 2026 tá chato demais, só louco"),
    (7.50, 10.95, "jogo LoL há mais de 10 anos"),
    (11.40, 16.30, "toda vez que abro uma partida fico maluco"),
    (17.65, 19.50, "já não basta o meu main ser o Shaco"),
    (21.65, 24.05, "mas o fato de eu jogar esse jogo eu fico…"),
    (24.45, 26.35, "insano, mano"),
    (27.66, 28.62, "simplesmente (sem o 'depois dos 10…' refeito)"),
    (30.22, 34.35, "aos 15 minutos não tem mais o que fazer, o jogo…"),
    (34.95, 35.80, "acabou!"),
    (37.25, 43.35, "difícil subir de elo, difícil mecânica interessante"),
    (44.15, 49.20, "depois de muito tempo o jogo ficou mecânico"),
    (52.80, 70.70, "10 anos de LoL, desde 2014/2015, voltava por apego (sem o 'isso talvez possa ser que…')"),
    (71.05, 72.00, "do vício"),
    (72.70, 77.80, "e do buraco que esse jogo deixou"),
    (78.55, 95.50, "procurei jogo que diverte mesmo perdendo: encontrei no Deadlock"),
    (98.72, 120.35, "mesmo que eu perca 5 seguidas (2ª vez, a 1ª sai) ≠ 1 no LoL; comunidade diferente"),
    (139.40, 143.62, "espero que as pessoas comecem a enxergar (sem o 1º take, sem 'tanto como…' e o 'corta esse tanto')"),
    (146.10, 149.95, "o potencial que o Deadlock tem e comecem a migrar"),
    (150.45, 152.55, "pro Deadlock, principalmente"),
    (152.95, 165.30, "Major / CBLOL de Deadlock: comenta o nome"),
    (168.70, 173.00, "a comunidade só aumenta"),
    (173.65, 203.95, "engajamento, jogo uma delicinha; comenta, DM, link do Discord, convite"),
    (231.55, 253.75, "fecho refeito (ele: 'não, vamos mudar'): Blies, live todo dia, foto piscando, Half-Life, música, segue"),
]
# trechos em que a transcrição isolada engoliu repetição: usa a corrida
# 98,7–100,9: ele repetiu "mesmo que eu perca 5 seguidas"; o large-v3 pôs o "não" em cima da repetição (whisper small isolado)
CORRIDA = [(98.0, 100.9)]
FIX = {"man": "main", "Chaco.": "Shaco.", "Há": "aos", "Blis,": "Blies,", "Simplesmente": "Simplesmente,"}

r = subprocess.run(["ffmpeg", "-nostdin", "-i", SRC, "-af", "silencedetect=noise=-45dB:d=0.12", "-f", "null", "-"], capture_output=True, text=True)
sil = list(zip([float(x) for x in re.findall(r"silence_start: ([0-9.]+)", r.stderr)], [float(x) for x in re.findall(r"silence_end: ([0-9.]+)", r.stderr)]))

raw = []
for a, b, name in TAKES:
    cur, first = max(0, a - EDGE), True
    b0 = b + EDGE
    for s0, s1 in sil:
        if s0 > cur + 0.05 and s1 < b0 - 0.05 and (s1 - s0) > GAP:
            raw.append((cur, s0 + PAD, name))
            cur = s1 - PAD
    raw.append((cur, b0, name))

segs, t = [], 0.0
for a, b, name in raw:
    ca = round(a / TEMPO, 3)
    fr = int(round((b - a) / TEMPO * FPS))
    segs.append({"a": ca, "b": round(ca + fr / FPS, 3), "note": name, "frames": fr, "editStart": round(t, 3)})
    t += fr / FPS
DUR = round(t, 3)

subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", SRC, "-af", f"atempo={TEMPO},loudnorm=I=-16:TP=-1.5:LRA=9", "-ar", "48000", "-ac", "2", V + "carrier.wav"], check=True)
json.dump({"duration": DUR, "tempo": TEMPO, "segments": segs}, open(O + "voz_blocks.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)

# ---------- palavras no tempo da edição ----------
P = json.load(open("D:/canseilol/pedacos.json", encoding="utf-8"))
ALT = [{"w": "mesmo", "s": 98.75, "e": 98.9}, {"w": "que", "s": 98.9, "e": 99.28}, {"w": "eu", "s": 99.28, "e": 99.4}, {"w": "perca", "s": 99.4, "e": 99.74},
       {"w": "5", "s": 99.74, "e": 100.02}, {"w": "seguidas,", "s": 100.02, "e": 100.64}, {"w": "não", "s": 100.7, "e": 100.9}]
inz = lambda t: any(a <= t < b for a, b in CORRIDA)
src = [w for c in P for w in c["words"] if not inz(w["s"])] + [w for w in ALT if inz(w["s"])]
src.sort(key=lambda w: w["s"])


def edit_t(t):
    c = t / TEMPO
    for g in segs:
        if g["a"] - 1e-6 <= c < g["a"] + g["frames"] / FPS + 1e-6:
            return g["editStart"] + c - g["a"]
    return None


def snap(t):
    """tempo dentro de um take que caiu numa pausa apertada: gruda no segmento mais próximo"""
    c = t / TEMPO
    best, bd = None, 1e9
    for g in segs:
        g1 = g["a"] + g["frames"] / FPS
        d = 0 if g["a"] <= c < g1 else min(abs(c - g["a"]), abs(c - g1))
        if d < bd:
            bd, best = d, g["editStart"] + min(max(c, g["a"]), g1 - 0.001) - g["a"]
    return best


intake = lambda t: t < 1.2 or any(a - 0.08 <= t <= b + 0.08 for a, b, _ in TAKES)
# chunk novo começa em maiúscula/ponto: continua a frase na legenda
LOW = {"Em", "E", "Onde", "Que", "Fica", "O", "Dá"}
out = []
for w in src:
    txt = w["w"].strip()
    if not txt or not intake((w["s"] + w["e"]) / 2):
        continue
    if not FIX.get(txt, txt):
        continue
    out.append({"w": FIX.get(txt, txt), "s": round(snap(w["s"]), 3), "e": round(snap(max(w["s"], w["e"] - 0.001)), 3), "b": round(w["s"], 2)})
out.sort(key=lambda x: x["s"])
# colagens do whisper
m = []
for w in out:
    if m and w["w"] == "%":
        m[-1]["w"] += "%"; m[-1]["e"] = w["e"]; continue
    if m and w["w"].startswith("-") and len(w["w"]) > 1:
        m[-1]["w"] += w["w"]; m[-1]["e"] = w["e"]; continue
    if m and w["w"].startswith("%"):
        m[-1]["w"] += w["w"]; m[-1]["e"] = w["e"]; continue
    m.append(w)
out = m
# frase que o take partiu: sem ponto no meio e sem maiúscula na continuação
for i, (a, b) in enumerate(zip(out, out[1:])):
    if b["w"] in LOW or b["w"].rstrip(",.") in LOW:
        if b["w"][:1].isupper() and b["w"] not in ("O", "Em") and a["w"].rstrip("...")[-1:].isalnum():
            b["w"] = b["w"][0].lower() + b["w"][1:]
            a["w"] = a["w"].rstrip(".") if a["w"].endswith(".") and not a["w"].endswith("...") else a["w"]
for a, b in zip(out, out[1:]):
    a["e"] = min(a["e"], b["s"])
# legenda: maiúsculas de continuação e de início de frase (pares anterior → palavra)
PAIR = {("fico...", "Insano,"): "insano,", ("LoL.", "fora"): "Fora", ("enxergar", "O"): "o", ("migrar.", "Pro"): "pro", ("comunidade,", "E"): "e"}
for a_, b_ in zip(out, out[1:]):
    if (a_["w"], b_["w"]) in PAIR:
        b_["w"] = PAIR[(a_["w"], b_["w"])]
    if b_["w"] == "pro" and a_["w"] == "migrar.":
        a_["w"] = "migrar"
json.dump(out, open(O + "words.json", "w", encoding="utf-8"), ensure_ascii=False, indent=0)
print(f"duração {DUR:.2f} s · segmentos {len(segs)} · palavras {len(out)}")
print(" ".join(x["w"] for x in out))
