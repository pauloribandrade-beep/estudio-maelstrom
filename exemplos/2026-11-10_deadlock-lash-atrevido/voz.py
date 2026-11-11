import os
"""Voz do vídeo "Lash atrevido" (10/11/2026): SEGMENTOS EDITÁVEIS sobre a gravação inteira (lash atrevido.wav, 3:39).
Regra: tira frase repetida/versão refeita (fica a última inteira), mantém improviso. Portador = bruto a 1,1x; palavras da transcrição por pedaço (CPU)."""
import json, re, subprocess

ED = os.environ.get("ESTUDIO_EDITOR") or os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "Reels", "editor")).replace("\", "/")
SL = "2026-11-10_deadlock-lash-atrevido"
V, O = f"{ED}/public/videos/{SL}/", f"{ED}/out/{SL}/"
SRC = V + "bruto.wav"
FPS, TEMPO = 30, 1.1
GAP, PAD = 0.30, 0.11   # pausa interna maior que GAP é apertada, deixando PAD de cada lado
EDGE = 0.05

# (início, fim, nota) no bruto. "folga" = pausa que é piada: não aperta tanto.
TAKES = [
    (0.00, 22.10, "gancho: feliz no Deadlock, mas me estressa a galera que acha que é jogo de matar; não é CS"),
    (23.45, 33.16, "não é Marvel Rivals nem Overwatch; espera 5, 6 min de lane phase"),
    (33.66, 35.20, "quietinho, joga"),
    (36.66, 51.06, "farma, nega, jungle, caixinhas; o cara pica Lash, o boneco mais sociopata"),
    (57.29, 69.80, "dash e soco infinito, morre na torre (sem o 1º 'ficar dando dash pra...'); tenha paciência"),
    (70.46, 78.30, "tranquilo com desvantagem em alma, compensa com rotação"),
    (78.92, 84.86, "caminhos corretos, rota de jungle"),
    (85.46, 89.96, "tenha paciência, muitas vezes no Deadlock não"),
    (90.45, 93.78, "é inteligente lutar a todo custo"),
    (94.25, 97.20, "kill não é tão importante"),
    (98.45, 104.10, "subo de rank evitando morrer"),
    (104.82, 109.50, "puxando side e farmando (sem o 'quase todo jogo' cortado)"),
    (113.64, 139.58, "top 2/3 de almas porque não morro; Rat King, 83 mil almas, segundo maior"),
    (140.24, 148.54, "alma do jogo, morri uma vez: build imortal, posicionamento (sem o 1º 'a única vez')"),
    (157.38, 207.33, "a única vez que fui atrevido, morri; senta a bunda na cadeira; pica-Lash fica de boa; Blies, live, segue"),
    (207.80, 211.42, "tamo junto, até a próxima"),
]
CORRIDA = []
FIX = {"Red": "Rat", "Blizz": "Blies", "Blizz,": "Blies,", "picolete": "pica-Lash,"}

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
P = json.load(open("D:/lash/pedacos.json", encoding="utf-8"))
ALT = []  # ([{"w": "mesmo", "s": 98.75, "e": 98.9}, {"w": "que", "s": 98.9, "e": 99.28}, {"w": "eu", "s": 99.28, "e": 99.4}, {"w": "perca", "s": 99.4, "e": 99.74},
#        {"w": "5", "s": 99.74, "e": 100.02}, {"w": "seguidas,", "s": 100.02, "e": 100.64}, {"w": "não", "s": 100.7, "e": 100.9}])
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
PAIR = {("bem.", "então"): "Então", ("beleza?", "é"): "É", ("junto", "eu"): "Eu"}
# pares em que muda também a palavra de antes (frase que o take partiu)
PAIR2 = {("maior.", "Alma"): ("maior", "alma"), ("não...", "É"): ("não", "é"), ("vocês", "Beleza?"): ("vocês.", "Beleza?"), ("junto", "Eu"): ("junto.", "Eu")}
for a_, b_ in zip(out, out[1:]):
    if (a_["w"], b_["w"]) in PAIR:
        b_["w"] = PAIR[(a_["w"], b_["w"])]
    if b_["w"] == "pro" and a_["w"] == "migrar.":
        a_["w"] = "migrar"
for a_, b_ in zip(out, out[1:]):
    if (a_["w"], b_["w"]) in PAIR2:
        a_["w"], b_["w"] = PAIR2[(a_["w"], b_["w"])]
json.dump(out, open(O + "words.json", "w", encoding="utf-8"), ensure_ascii=False, indent=0)
print(f"duração {DUR:.2f} s · segmentos {len(segs)} · palavras {len(out)}")
print(" ".join(x["w"] for x in out))
