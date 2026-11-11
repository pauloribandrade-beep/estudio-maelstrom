"""Monta o projeto do Estúdio do vídeo "Lash atrevido" (Deadlock, 10/11/2026).

Entrada: voz_blocks.json + words.json (voz.py). Gera ig1080.*, segments.json, words.json e o edit.json.
Cenas em LA.tsx (UI do Deadlock, estilo Cansei v2).

REGRA (preservar-cortes-dele): segments.json atual é a verdade e nunca é recriado; edit.json passa por fusão de 3 vias com
out/<slug>/edit.montar.json.   --voz-do-zero recria os takes (APAGA os cortes dele, só com aval)   --base só grava a referência
"""
import json, os, re, subprocess, sys, wave
import numpy as np

ED = os.environ.get("ESTUDIO_EDITOR") or os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "Reels", "editor")).replace("\", "/")
SL = "2026-11-10_deadlock-lash-atrevido"
V, S, O = f"{ED}/public/videos/{SL}/", f"{ED}/src/videos/{SL}/", f"{ED}/out/{SL}/"
SO = "videos/2026-11-06_deadlock-ranked_R/sons/"
TEST = os.environ.get("MONTAR_S")
if TEST:
    S = TEST
BASE_MODE, FRESH = "--base" in sys.argv, "--voz-do-zero" in sys.argv
SEG_FILE = S + "segments.json"

blocks = json.load(open(O + "voz_blocks.json", encoding="utf-8"))
BASE_SEGS = blocks["segments"]
DUR = round(blocks["duration"] + 0.6, 3)
W = [dict(w) for w in json.load(open(O + "words.json", encoding="utf-8"))]
for w in W:
    w["_s0"] = w["s"]  # tempo na voz montada (antes dos cortes dele): é nele que as dicas das âncoras são dadas
SEGS = BASE_SEGS
NOCAP = set()
if os.path.exists(SEG_FILE) and not FRESH and not BASE_MODE:
    HIS = json.load(open(SEG_FILE, encoding="utf-8"))
    SEGS, acc = HIS["segments"], 0
    for g in SEGS:
        g.setdefault("frames", int(round((g["b"] - g["a"]) * 30)))
        g["_es"] = acc / 30
        acc += g["frames"]

    def _src(t):
        for g in BASE_SEGS:
            if g["editStart"] - 1e-6 <= t < g["editStart"] + g["frames"] / 30 - 1e-6:  # 10/11: palavra na emenda é do bloco seguinte
                return g["a"] + t - g["editStart"]
        return None

    def _edit(src):
        best = None
        for g in SEGS:
            if g["a"] - 1e-6 <= src < g["a"] + g["frames"] / 30 - 1e-6:
                return g["_es"] + src - g["a"], True
            if g["a"] > src and (best is None or g["a"] < best["a"]):
                best = g
        return (best["_es"] if best else acc / 30), False

    for w in W:
        sa, sb = _src(w["s"]), _src(max(w["s"], w["e"] - 0.001))
        if sa is None:
            continue
        (es, ka), (ee, kb) = _edit(sa), _edit(sb if sb is not None else sa)
        if not ka:
            NOCAP.add(id(w))
        w["s"], w["e"] = round(es, 3), round(max(es, ee + 0.001 if kb else es), 3)
    W.sort(key=lambda w: w["s"])
    for g in SEGS:
        g.pop("_es", None)
    DUR = round(acc / 30 + HIS.get("outro", 0.6), 3)

core = lambda s: re.sub(r"[^\wÀ-ú%-]", "", s).lower()


def A(pat, t0=0.0, n=1):
    """início (na edição, já com os cortes dele) da n-ésima palavra `pat` depois de t0 (t0 em segundos da VOZ MONTADA, sem os cortes)"""
    k = 0
    for w in sorted(W, key=lambda w: w["_s0"]):
        if w["_s0"] >= t0 and core(w["w"]) == pat:
            k += 1
            if k == n:
                if id(w) in NOCAP:
                    print(f"AVISO: âncora '{pat}' (voz {w['_s0']:.2f}) caiu num trecho que ele cortou -> {w['s']:.2f}")
                return w["s"]
    raise SystemExit(f"âncora não achada: {pat} depois de {t0}")


# ---------- portador + segmentos ----------
if not BASE_MODE and not TEST:
    CAR = round(float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", V + "carrier.wav"], capture_output=True, text=True).stdout), 3)
    subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-f", "lavfi", "-i", f"color=c=0x07090a:s=1080x1920:r=30:d={CAR:.3f}", "-i", V + "carrier.wav",
                    "-c:v", "libx264", "-preset", "veryfast", "-crf", "35", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "256k", "-shortest", V + "ig1080.mp4"], check=True)
    subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", V + "carrier.wav", "-c:a", "pcm_s16le", V + "ig1080.lossless.wav"], check=True)
if FRESH or not os.path.exists(SEG_FILE):
    json.dump({"fps": 30, "outro": round(DUR - sum(g["frames"] for g in SEGS) / 30, 3), "segments": SEGS}, open(SEG_FILE, "w", encoding="utf-8"), ensure_ascii=False, indent=2)


def orig(t):
    acc = 0
    for g in SEGS:
        fr = g.get("frames", int(round((g["b"] - g["a"]) * 30)))
        if acc / 30 - 1e-6 <= t < (acc + fr) / 30 + 1e-6:
            return round(g["a"] + t - acc / 30, 3)
        acc += fr
    return None


if not BASE_MODE:
    json.dump([{"word": w["w"], "start": w["s"], "end": w["e"], "orig": orig(w["s"])} for w in W if id(w) not in NOCAP], open(S + "words.json", "w", encoding="utf-8"), ensure_ascii=False)


def peak(path):
    with wave.open(path) as wf:
        a = np.frombuffer(wf.readframes(wf.getnframes()), np.int16).astype(np.float32)
        a = a.reshape(-1, wf.getnchannels()).mean(1) if wf.getnchannels() > 1 else a
        return round(float(np.argmax(np.abs(a))) / wf.getframerate(), 3)


# ---------- cenas ----------
# Pedido dele (10/11): "faz agora o vídeo do Lash Atrevido", "é nesse estilo" (Cansei do LoL v2): tudo dentro da UI do
# Deadlock, poucos golpes por cena, memes curtos. Jogo citado de passagem = card com logo, sem gameplay.
L = 0.05

PLAN = [
    # 10/11 rodada 2: abertura refeita (LA0.tsx) — "mais personalidade, visual, não só um monte de card", sem barra carregando
    (0.0, "jogo feliz · DEADLOCK · almas · MAS congela, o Lash despenca · MUITO.", "LAOpen",
     {"muito0At": A("muito"), "felizAt": A("feliz"), "dlAt": A("deadlock"), "satAt": A("satisfeito"), "gostAt": A("gostosinho"), "masAt": A("mas"), "coisasAt": A("coisas"), "stressAt": A("estressam"), "muitoAt": A("muito", 10.5), "muito2At": A("muito", 11.5)}),
    (A("é", 12.2) - L, "Lash em tela cheia · abates · SÓ UM JOGO DE MATAR?", "LAKill2", {"galeraAt": A("galera", 13), "entraAt": A("entra"), "achaAt": A("acha"), "soAt": A("só"), "matarAt": A("matar")}),
    (A("mano") - L, "não é CS · Rivals · Overwatch (um card por vez, chutado)", "LANot2", {"csAt": A("cs"), "mrAt": A("marvel"), "owAt": A("overwatch")}),
    (A("é", 22.9) - L, "outro conceito · jogo acelera, relógio voa até 6:00 · LANE PHASE", "LALane2", {"outroAt": A("outro"), "esperaAt": A("espera", 25), "minAt": A("minutos"), "laneAt": A("lane", 27)}),
    (A("quietinho") - L, "quietinho, joga · cortes: farma · nega · jungle · caixinhas", "LAMontage", {"farmaAt": A("farma", 29.5), "negaAt": A("nega"), "jungleAt": A("jungle", 32), "caixaAt": A("caixinhas")}),
    (A("você", 34) - L, "porrada em recarga · espera · PORRADA LIBERADA", "LAWait", {"clickAt": A("porrada", 35), "esperaAt": A("espera", 35.5), "readyAt": A("porrada", 37)}),
    (A("mas", 38) - L, "seleção: trava o Lash · boneco mais sociopata (Bateman)", "LAPick", {"lashAt": A("lash", 39), "bonecoAt": A("boneco"), "memeAt": A("sociopata")}),
    (A("simplesmente", 43) - L, "Lash de verdade: dash, soco, morre (clipe real)", "LASpam2",
     {"dashAt": A("dash"), "socoAt": A("soco"), "infAt": A("infinito"), "deathAt": A("morre", 47.8), "torreAt": A("torre")}),
    (A("mano", 49) - L, "Shifu: paz interior · melhor passar a LANE PHASE", "LACalma",
     {"memeAt": A("mano", 49), "memeEndAt": A("mano", 49) + 2.5, "melhorAt": A("melhor", 51), "laneAt": A("lane", 52), "dlAt": A("deadlock", 53)}),
    (A("tranquilo") - L, "mapa · desvantagem em alma · rotação · jungle", "DLMapa", {
        "you": [251, 480],
        "cam": [{"at": A("tranquilo") - L, "x": 251, "y": 300, "z": 0.95}, {"at": A("rotação") - 0.3, "x": 220, "y": 390, "z": 1.35, "dur": 0.8}, {"at": A("rota", 64) - 0.3, "x": 190, "y": 360, "z": 1.6, "dur": 0.8}],
        "marks": [
            {"kind": "title", "at": A("tranquilo"), "text": "TRANQUILO", "sub": "MESMO ATRÁS", "endAt": A("desvantagem")},
            {"kind": "stamp", "at": A("desvantagem"), "text": "− ALMAS", "y": 1080, "c": "#e24a3b", "endAt": A("rotação")},
            {"kind": "route", "at": A("rotação"), "ids": [[251, 480], [170, 440], [90, 380], [70, 300]], "dur": 1.2},
            {"kind": "you", "at": A("rotação"), "to": [70, 300], "dur": 1.2},
            {"kind": "lane", "at": A("caminhos"), "lanes": ["L", "M"], "endAt": A("rota", 64)},
            {"kind": "camps", "at": A("rota", 64)},
            {"kind": "route", "at": A("fazer", 65.5), "ids": [[70, 300], [120, 330], [170, 360], [215, 330]], "dur": 1.0},
            {"kind": "you", "at": A("fazer", 65.5), "to": [215, 330], "dur": 1.0},
        ]}),
    (A("cara", 66.8) - L, "paciência · 1 contra 3 · lutar a todo custo (riscado)", "LAFight",
     {"pacAt": A("paciência", 67), "foesAt": A("muitas"), "intAt": A("inteligente"), "lutAt": A("lutando"), "custoAt": A("custo")}),
    (A("kill") - L, "placar: kill apagado · rank sobe · MORTES 0", "LAScore", {"killAt": A("kill") + 0.05, "impAt": A("importante"), "rankAt": A("rank"), "evitAt": A("evitando")}),
    (A("puxando") - L, "mapa · puxa side · farma o máximo", "DLMapa", {
        "you": [70, 300],
        "cam": [{"at": A("puxando") - L, "x": 251, "y": 300, "z": 1.0}],
        "marks": [
            {"kind": "title", "at": A("puxando"), "text": "PUXA SIDE", "sub": "FARMA O MÁXIMO", "endAt": A("quase", 86) - L},
            {"kind": "lane", "at": A("side"), "lanes": ["L", "R"]},
            {"kind": "souls", "at": A("farmando")},
        ]}),
    (A("quase", 86) - L, "almas: top 2 · não morro · vantagem pro late · decisivo", "LASouls",
     {"topAt": A("top", 86.5), "morroAt": A("morro"), "vantAt": A("vantagem", 93), "lateAt": A("late", 94), "decAt": A("decisivo")}),
    (A("cara", 97.5) - L, "Rat King · 90 mil… 83 · 2ª maior alma · 1 morte", "LARat",
     {"ratAt": A("rat"), "almasAt": A("quase", 104), "milAt": A("mil"), "oitentaAt": A("83"), "segAt": A("segundo", 108), "morriAt": A("morri", 110)}),
    (A("porque", 111.3) - L, "build imortal · POSICIONAMENTO", "LABuild", {"buildAt": A("build"), "imortalAt": A("imortal", 112), "posAt": A("posicionar", 115)}),
    (A("a", 116.8) - L, "a única vez: ATREVIDO · imortal · morri · sem isso 0", "LADeath",
     {"duvAt": A("duvidando"), "imortalAt": A("imortal", 123), "morriAt": A("morri", 125), "morteAt": A("morte", 126), "zeroAt": A("morrido")}),
    (A("então", 130.8) - L, "senta e joga tranquilinho · recompensa late/mid", "LAChair",
     {"sentaAt": A("senta"), "tranqAt": A("tranquilinho"), "recAt": A("recompensa"), "lateAt": A("late", 137), "midAt": A("mid")}),
    (A("então", 140.3) - L, "pica-Lash, fica de boa · a ult destrava", "LAUlt", {"lashAt": A("pica-lash"), "boaAt": A("boa", 142), "brilharAt": A("brilhar"), "ultAt": A("ult")}),
    (A("é", 145) - L, "fim · perfil do Blies com anel de live · temas · seguir", "CLProfile",
     {"nameAt": A("blies"), "liveAt": A("live", 148), "blinkAt": A("live", 148) + 1.4, "hlAt": A("half-life"), "gamesAt": A("jogos", 155), "musicAt": A("música"), "followAt": A("segue"), "byeAt": A("tamo", 161)}),
]

PLAN.sort(key=lambda x: x[0])

TK = re.compile(r"^at\d*$|At\d*$")


def rel(v, a0, key=""):
    if isinstance(v, dict):
        return {k: rel(x, a0, k) for k, x in v.items()}
    if isinstance(v, list):
        return [rel(x, a0) for x in v]
    if isinstance(v, (int, float)) and not isinstance(v, bool) and TK.search(key):
        return round(v - a0, 2) if v < 900 else v
    return v


def sid(lab):  # id estável pelo rótulo, nunca pela posição
    s = lab.lower()
    for a, b in (("ã", "a"), ("õ", "o"), ("á", "a"), ("é", "e"), ("í", "i"), ("ç", "c"), ("ê", "e"), ("ó", "o"), ("ú", "u"), ("×", "x")):
        s = s.replace(a, b)
    return "n_" + re.sub(r"[^a-z0-9]+", "_", s).strip("_")[:44]


scenes = []
ABS = {}
for i, (a0, lab, typ, props) in enumerate(PLAN):
    b0 = PLAN[i + 1][0] if i + 1 < len(PLAN) else DUR
    a0 = max(0.0, a0)
    sc = {"id": sid(lab), "type": typ, "start": round(a0, 3), "end": round(b0, 3), "lane": 1, "label": lab, "props": rel(props, a0)}
    ABS[sc["id"]] = dict(props, _t0=a0, _t1=b0)
    scenes.append(sc)
assert len({s["id"] for s in scenes}) == len(scenes), [s["id"] for s in scenes]

# ---------- documento ----------
try:
    doc = json.load(open(S + "edit.json", encoding="utf-8"))
except FileNotFoundError:
    doc = {"version": 1, "slug": SL, "comp": "LaEdit", "format": "wide", "orient": "vertical", "fps": 30, "video": {"src": f"videos/{SL}/ig1080.mp4"},
           "zoom": {"snaps": [{"t": 0, "z": 1}], "pushes": []}, "sounds": [], "markers": [], "voice": {}}
doc["duration"] = DUR
doc["scenes"] = scenes
doc["soundTracks"] = [{"id": "tm", "name": "Música"}, {"id": "t1", "name": "Efeitos"}]
doc["captions"] = {"style": "laestro", "y": 1370, "cardY": 1370, "padL": 90, "padR": 170, "size": 72, "groupSize": 3,
                   "hot": ["Deadlock", "CS", "Overwatch", "lane", "phase.", "porrada,", "Lash,", "sociopata", "torre", "paciência.", "Kill", "rank", "morrer.", "almas,", "Rat", "King", "83,", "imortal", "posicionar", "late", "ult,", "Blies", "live"],
                   "notes": [], "cardSpans": [], "words": [{"word": w["w"], "start": w["s"], "end": w["e"]} for w in W if id(w) not in NOCAP]}

import soundfile as sf

SO_ND = f"videos/{SL}_R/sons/"
REF_L = None


def _load(path):
    a, sr = sf.read(f"{ED}/public/{path}", dtype="float32", always_2d=True)
    return a.mean(1), sr


def _loud(path):
    a, sr = _load(path)
    w = max(1, int(sr * 0.1))
    e = np.sqrt(np.convolve(a * a, np.ones(w) / w, mode="valid")) if len(a) > w else np.array([np.sqrt(np.mean(a * a))])
    return float(e.max()) + 1e-9


def _peak(path):
    a, sr = _load(path)
    return round(float(np.argmax(np.abs(a))) / sr, 3)


REF_L = _loud("sfx/stamp.wav")
_cache = {}
snd = []
_last = {}


def sfx(path, t, label, dur=1.0, gain=1.0, align=True):
    """path relativo a public/; gain multiplica o volume igualado (1 = nível do carimbo de referência)"""
    if path not in _cache:
        _cache[path] = (_loud(path), _peak(path))
    L_, pk = _cache[path]
    vol = round(min(0.36, max(0.03, 0.17 * REF_L / L_ * gain)), 3)  # 10/11: "abaixa mais esses efeitos"
    if path in _last and t - _last[path] < 8:
        print(f"AVISO: som repetido perto ({path} em {_last[path]:.2f} e {t:.2f})")
    _last[path] = t
    base = "x_" + re.sub(r"[^a-z0-9]+", "_", label.lower().encode("ascii", "ignore").decode())[:34].strip("_")
    n = sum(1 for x in snd if x["id"].rsplit("~", 1)[0] == base)
    lead = min(pk, 0.12) if align else 0.0  # silêncio antes do golpe vira trim: o som começa colado no movimento
    trim = round(pk - lead, 3) if align else 0.0
    st = t - lead
    if st < 0:
        trim, st = round(trim - st, 3), 0.0
    x = {"id": f"{base}~{n}", "src": path, "start": round(st, 3), "vol": vol, "dur": round(max(dur, lead + 0.35), 3), "fadeOut": 0.12, "track": "t1", "label": label}
    if trim > 0:
        x["trim"] = trim
    snd.append(x)


SO_ND = "videos/2026-11-08_deadlock-nao-desista_R/sons/"
MG_S = "videos/2026-11-06_deadlock-magia_R/sons/"
X = lambda n: f"sfx/{n}.wav"
RS = "videos/2026-11-06_deadlock-ranked_R/sons/"
FR = 1 / 30
TYPE = "type_1.wav"
LS = f"videos/{SL}_R/snd/lol/"
DS = f"videos/{SL}_R/snd/dl/"
PUNCH = [DS + "headshot_booster_hit_01.wav", DS + "headshot_booster_hit_02.wav", DS + "headshot.wav"]
WH = [X("tc_whoosh_13_quick_deep"), X("tc_whoosh_11_low_quick"), X("tc_whoosh_15_quick_a")]
MM = f"videos/{SL}_R/memes/"
_pi = 0


def meme(path, t, label, trim, dur, vol=0.2):  # áudio do meme: só a frase, baixo, colado na voz
    snd.append({"id": "m_" + re.sub(r"[^a-z0-9]+", "_", label.lower().encode("ascii", "ignore").decode())[:30], "src": path, "start": round(t, 3), "trim": trim, "vol": vol, "dur": dur, "fadeOut": 0.15, "track": "t1", "label": label})


def typing(t, n, cps, label):  # digitação = um trecho só, no tempo exato do texto
    snd.append({"id": "x_type_" + re.sub(r"[^a-z0-9]+", "_", label.lower().encode("ascii", "ignore").decode())[:20] + "~0", "src": "sfx/" + TYPE, "start": round(t, 3), "vol": 0.1, "dur": round(n / cps * FR, 2), "fadeOut": 0.08, "track": "t1", "label": "digitação · " + label})



SO_ND = "videos/2026-11-08_deadlock-nao-desista_R/sons/"
FR = 1 / 30
DS = "videos/2026-11-09_deadlock-cansei-lol_R/snd/dl/"
LS_ = f"videos/{SL}_R/snd/"
MM = f"videos/{SL}_R/memes/"


def meme(path, t, label, trim, dur, vol=0.2):  # áudio do meme: só a frase, baixo, colado na voz
    snd.append({"id": "m_" + re.sub(r"[^a-z0-9]+", "_", label.lower().encode("ascii", "ignore").decode())[:30], "src": path, "start": round(t, 3), "trim": trim, "vol": vol, "dur": dur, "fadeOut": 0.15, "track": "t1", "label": label})


# abertura: Among Us (role reveal), o gancho que deu certo no TikTok
snd.append({"id": "m_amongus", "src": SO_ND + "amongus_completo.wav", "start": 0.0, "vol": 0.2, "dur": 4.55, "fadeOut": 0.6, "track": "t1", "label": "meme · abertura Among Us (role reveal, completo)"})

# um efeito por golpe, pico no quadro do movimento, nada empilhado
for sc in scenes:
    t0, ty, lab = sc["start"], sc["type"], sc["label"]
    p = ABS[sc["id"]]
    if ty == "LAOpen":
        sfx(DS + "ui_game_start.wav", p["dlAt"], "logo do DEADLOCK bate", 1.2, 0.45)
        sfx(DS + "xp_orb_vaccum_collect_01.wav", p["satAt"] + 22 * FR, "almas entram no contador", 0.9, 0.45)
        sfx(DS + "stun.wav", p["masAt"], "MAS: o jogo congela", 0.8, 0.45)
        sfx(LS_ + "Lash_death_slam_impact_01.wav", p["coisasAt"] + 8 * FR, "o Lash despenca e bate no chão", 1.2, 0.6)
        sfx(DS + "headshot.wav", p["muito2At"], "MUITO.", 0.7, 0.55)
    elif ty == "LAKill2":
        sfx(DS + "ui_chat_msg_received_03.wav", p["galeraAt"], "1º abate no feed", 0.5, 0.4)
        sfx(DS + "ui_chat_msg_received_01.wav", p["achaAt"], "3º abate no feed", 0.5, 0.4)
        sfx(DS + "headshot_booster_hit_01.wav", p["matarAt"], "DE MATAR?", 0.6, 0.6)
    elif ty == "LANot2":
        sfx(DS + "baba_ult_max_lock_01.wav", p["csAt"] + 2 * FR, "carimbo NÃO É · CS", 1.2, 0.5)
        sfx(DS + "baba_ult_max_lock_02.wav", p["mrAt"] + 2 * FR, "carimbo NÃO É · Marvel Rivals", 1.2, 0.5)
        sfx(DS + "baba_ult_max_lock_03.wav", p["owAt"] + 2 * FR, "carimbo NÃO É · Overwatch", 1.2, 0.5)
    elif ty == "LALane2":
        sfx(DS + "speed_boost.wav", p["esperaAt"], "o jogo acelera (relógio voando)", 1.0, 0.45)
        sfx(DS + "ui_game_matchmake_made.wav", p["laneAt"], "LANE PHASE", 1.2, 0.5)
    elif ty == "LAMontage":
        sfx(DS + "xp_orbs_acquire_01.wav", p["farmaAt"], "corte · FARMA", 0.8, 0.5)
        sfx(DS + "xp_orbs_deny_01.wav", p["negaAt"], "corte · NEGA FARM", 0.8, 0.5)
        sfx(DS + "ping_map.wav", p["jungleAt"], "corte · FARMA JUNGLE", 0.6, 0.45)
        sfx(DS + "ui_get_gold_01.wav", p["caixaAt"], "corte · CAIXINHAS", 0.6, 0.45)
    elif ty == "LAHook":
        sfx(DS + "ui_hud_acquire_ap_01.wav", p["satAt"] + 0.3, "medidor de satisfação enche", 1.0, 0.5)
        sfx(DS + "ping_warning.wav", p["masAt"], "MAS: medidor vira ESTRESSE", 0.8, 0.5)
        sfx(DS + "headshot.wav", p["muito2At"], "MUITO. (999%)", 0.7, 0.6)
    elif ty == "LAKill":
        sfx(DS + "ui_chat_msg_received_03.wav", p["galeraAt"], "feed de abates começa", 0.5, 0.45)
        sfx(DS + "headshot_booster_hit_01.wav", p["matarAt"], "DE MATAR?", 0.6, 0.6)
    elif ty == "LANot":
        sfx(DS + "baba_ult_max_lock_01.wav", p["csAt"], "carimbo NÃO É · CS", 1.2, 0.5)
        sfx(DS + "baba_ult_max_lock_02.wav", p["mrAt"], "carimbo NÃO É · Marvel Rivals", 1.2, 0.5)
        sfx(DS + "baba_ult_max_lock_03.wav", p["owAt"], "carimbo NÃO É · Overwatch", 1.2, 0.5)
    elif ty == "LALane":
        sfx(DS + "ui_get_gold_01.wav", p["esperaAt"], "relógio da partida começa a correr", 0.6, 0.4)
        sfx(DS + "ui_game_matchmake_made.wav", p["laneAt"], "LANE PHASE acende", 1.2, 0.5)
    elif ty == "LAList":
        sfx(DS + "xp_orbs_acquire_01.wav", p["farmaAt"] + 2 * FR, "✓ FARMA", 0.8, 0.5)
        sfx(DS + "xp_orbs_deny_01.wav", p["negaAt"] + 2 * FR, "✓ NEGA FARM", 0.8, 0.5)
        sfx(DS + "xp_orb_vaccum_collect_01.wav", p["jungleAt"] + 2 * FR, "✓ FARMA JUNGLE", 0.8, 0.5)
        sfx(DS + "ui_hud_upgrade_ability_01.wav", p["caixaAt"] + 2 * FR, "✓ PEGA AS CAIXINHAS", 0.8, 0.5)
    elif ty == "LAWait":
        sfx(DS + "shop_close.wav", p["clickAt"], "clique: EM RECARGA", 0.6, 0.5)
        sfx(DS + "tech_activate.wav", p["readyAt"], "PORRADA LIBERADA", 1.0, 0.55)
    elif ty == "LAPick":
        sfx(DS + "hero_select.wav", p["lashAt"], "trava o Lash", 1.4, 0.55)
    elif ty == "LASpam2":
        sfx(LS_ + "Lash_a2_grapple_cast.wav", p["dashAt"], "DASH", 0.8, 0.45)
        sfx(LS_ + "Lash_ground_strike_impact.wav", p["socoAt"], "SOCO", 0.8, 0.5)
        sfx(LS_ + "Lash_a3_flog_impact_01.wav", p["infAt"], "INFINITO", 0.7, 0.45)
        sfx(DS + "music_stinger_player_death.wav", p["deathAt"], "MORREU (tela cinza)", 2.0, 0.5)
    elif ty == "LASpam":
        sfx(LS_ + "Lash_a2_grapple_cast.wav", p["dashAt"], "DASH (Grapple do Lash)", 0.8, 0.5)
        sfx(LS_ + "Lash_ground_strike_impact.wav", p["socoAt"], "SOCO (Ground Strike)", 0.8, 0.5)
        sfx(LS_ + "Lash_a3_flog_impact_01.wav", p["infAt"], "infinito (Flog)", 0.7, 0.45)
        sfx(DS + "ping_enemy.wav", p["guardAt"], "guardião aparece", 0.6, 0.45)
        sfx(DS + "music_stinger_player_death.wav", p["deathAt"], "VOCÊ MORREU", 2.0, 0.5)
    elif ty == "LACalma":
        meme(MM + "shifu.wav", p["memeAt"], "meme Shifu: paz interior (dublado)", 0.0, 2.5, 0.22)
        sfx(DS + "ui_confirm_roster.wav", p["laneAt"], "LANE PHASE ✓", 1.0, 0.5)
    elif ty == "DLMapa" and "rotação" in lab:
        sfx(DS + "stun.wav", ABS[sc["id"]]["marks"][1]["at"], "− ALMAS bate no mapa", 0.8, 0.45)
        sfx(DS + "speed_boost.wav", ABS[sc["id"]]["marks"][2]["at"], "rotação: a rota corre", 0.8, 0.45)
        sfx(DS + "ping_map.wav", ABS[sc["id"]]["marks"][5]["at"], "acampamentos da jungle", 0.6, 0.45)
    elif ty == "LAFight":
        sfx(DS + "ping_rally.wav", p["foesAt"], "três inimigos chegam", 0.8, 0.4)
        sfx(DS + "headshot_booster_hit_02.wav", p["custoAt"] + 4 * FR, "A TODO CUSTO (riscado)", 0.6, 0.55)
    elif ty == "LAScore":
        sfx(DS + "ui_herocard_hover.wav", p["impAt"], "ABATES apaga", 0.8, 0.45)
        sfx(DS + "music_postgame_rankup_155bpm.wav", p["rankAt"], "rank sobe", 2.2, 0.3)
        sfx(DS + "popup_level_up.wav", p["evitAt"], "MORTES 0 acende", 0.8, 0.5)
    elif ty == "DLMapa":
        sfx(DS + "ping_map.wav", ABS[sc["id"]]["marks"][1]["at"], "lanes de lado acendem", 0.6, 0.45)
        sfx(DS + "xp_orbs_acquire_01.wav", ABS[sc["id"]]["marks"][2]["at"], "almas no mapa", 0.8, 0.4)
    elif ty == "LASouls":
        sfx(DS + "ui_achievement_toast_seasonal.wav", p["topAt"], "TOP 2, TOP 3", 1.6, 0.35)
        sfx(DS + "ui_commend_receive_01.wav", p["morroAt"], "0 MORTES", 1.2, 0.4)
        sfx(DS + "ui_get_gold_01.wav", p["lateAt"], "LATE GAME acende", 0.6, 0.4)
        sfx(DS + "ping_rally.wav", p["decAt"], "MOMENTO DECISIVO", 0.8, 0.4)
    elif ty == "LARat":
        sfx(DS + "ui_herocard_hover.wav", p["ratAt"], "RAT KING", 0.8, 0.45)
        sfx(DS + "ui_get_gold_large_01.wav", p["milAt"], "almas sobem até 90.000", 1.2, 0.45)
        sfx(DS + "shop_close.wav", p["oitentaAt"], "corrige pra 83 mil", 0.6, 0.45)
        sfx(DS + "ui_commend_receive_02.wav", p["segAt"], "2ª MAIOR ALMA", 1.2, 0.4)
        sfx(DS + "stun.wav", p["morriAt"], "1 MORTE", 0.8, 0.4)
    elif ty == "LABuild":
        sfx(DS + "shop_open.wav", p["buildAt"] - 4 * FR, "itens da build imortal", 1.0, 0.5)
        sfx(DS + "ui_game_start.wav", p["posAt"], "POSICIONAMENTO", 1.4, 0.45)
    elif ty == "LADeath":
        sfx(DS + "baba_ult_max_lock_01.wav", p["duvAt"], "carimbo ATREVIDO", 1.2, 0.5)
        sfx(DS + "tech_activate.wav", p["imortalAt"], "escudo de imortal acende", 1.0, 0.45)
        sfx(DS + "rejuv_shatter.wav", p["morriAt"], "escudo quebra: MORRI", 1.2, 0.55)
        sfx(DS + "ui_hud_acquire_ap_01.wav", p["zeroAt"], "sem essa: 0", 0.8, 0.45)
    elif ty == "LAChair":
        sfx(DS + "ui_confirm_roster.wav", p["sentaAt"], "SENTA NA CADEIRA", 1.0, 0.4)
        sfx(DS + "ui_get_gold_large_01.wav", p["lateAt"], "recompensa cai no LATE", 1.2, 0.45)
        sfx(DS + "ui_get_gold_01.wav", p["midAt"], "e no MID", 0.6, 0.4)
    elif ty == "LAUlt":
        sfx(LS_ + "Lash_ground_strike_downstrike_whoosh.wav", p["lashAt"], "PICA-LASH", 0.8, 0.45)
        sfx(LS_ + "Lash_death_slam_lockon_01.wav", p["brilharAt"], "a ult começa a brilhar", 1.0, 0.45)
        sfx(LS_ + "Lash_death_slam_impact_01.wav", p["ultAt"], "ULT destrava (Death Slam)", 1.2, 0.55)
    elif ty == "CLProfile":
        sfx(DS + "ui_herocard_hover.wav", p["nameAt"], "BLIES", 0.9, 0.45)
        sfx(DS + "ping_rally.wav", p["liveAt"], "anel de LIVE acende", 0.8, 0.4)
        sfx(DS + "ui_chat_msg_received_01.wav", p["musicAt"], "temas: música, Half-Life, jogos", 0.5, 0.4)
        sfx(DS + "ui_friends_party_member_new.wav", p["followAt"] + 12 * FR, "clique Seguir", 1.0, 0.45)
        sfx(DS + "music_stinger_game_over_win.wav", p["byeAt"], "TAMO JUNTO (vitória)", 2.5, 0.35)


# conferência: dois efeitos começando a menos de 0,6 s um do outro = empilhado
_fx = sorted((x["start"], x["label"]) for x in snd if x["track"] == "t1")
for (ta, la), (tb, lb) in zip(_fx, _fx[1:]):
    if tb - ta < 0.6 and not la.startswith("meme · abertura"):
        print(f"AVISO: empilhado {ta:.2f} {la} | {tb:.2f} {lb}")


# trilha: Curiosity Shop (mesma da série), baixinha
snd.append({"id": "mus0", "src": SO + "shop.wav", "start": 0, "trim": 0, "vol": 0.08, "dur": round(DUR, 3), "fadeIn": 0, "fadeOut": 0.6, "track": "tm", "label": "música · Curiosity Shop (Deadlock)"})
doc["sounds"] = snd

# ---------- fusão de 3 vias com os ajustes dele ----------
def _semtempo(v, key=""):
    if isinstance(v, dict):
        return {k: _semtempo(x, k) for k, x in v.items() if k not in ("start", "end", "dur") and not TK.search(k)}
    if isinstance(v, list):
        return [_semtempo(x) for x in v]
    return v


SNAP = (S if TEST else O) + "edit.montar.json"
gen = json.loads(json.dumps(doc))
if BASE_MODE:
    json.dump(gen, open(SNAP, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    raise SystemExit("referência gravada em edit.montar.json (nada mudou no projeto)")
kept = []
if os.path.exists(SNAP) and os.path.exists(S + "edit.json"):
    snap = json.load(open(SNAP, encoding="utf-8"))
    cur = json.load(open(S + "edit.json", encoding="utf-8"))
    for key in ("scenes", "sounds"):
        sm = {x["id"]: x for x in snap.get(key, [])}
        cm = {x["id"]: x for x in cur.get(key, [])}
        out = []
        for x in doc[key]:
            i = x["id"]
            if i in sm and i not in cm:
                kept.append(f"-{i}")
                continue
            redo = key == "scenes" and i in sm and (sm[i]["type"] != x["type"] or sm[i].get("label") != x.get("label"))
            # o Estúdio reajusta start/end e os tempos internos (At/at) quando ele corta áudio; isso não é ajuste dele:
            # a cena é regerada já ancorada nas palavras com os cortes. Só fica a dele se mudou algo além de tempo.
            moved_only = key == "scenes" and i in sm and i in cm and _semtempo(cm[i]) == _semtempo(sm[i])
            # som que só andou junto com o corte dele: o novo (já ancorado com os cortes) cai no mesmo lugar -> não é ajuste dele
            if key == "sounds" and i in sm and i in cm:
                _o = lambda d: {k: v for k, v in d.items() if k != "start"}
                if _o(cm[i]) == _o(sm[i]):  # 08/11: só o início mudou = o Estúdio empurrou junto com um corte (conferido: perfil, já aconteceu, arrepender)
                    moved_only = True
            if i in sm and i in cm and cm[i] != sm[i] and not redo and not moved_only:
                out.append(cm[i])
                kept.append(i)
                continue
            out.append(x)
        gids = {x["id"] for x in doc[key]}
        for x in cur.get(key, []):
            if x["id"] not in sm and x["id"] not in gids:
                out.append(x)
                kept.append(f"+{x['id']}")
        doc[key] = sorted(out, key=lambda x: x["start"]) if key == "scenes" else out
    cw, sw = cur.get("captions", {}).get("words"), snap.get("captions", {}).get("words")
    def _so_cortes(c, s_):  # o Estúdio só apagou palavras dos trechos cortados (texto não foi editado por ele)
        it = iter(w["word"] for w in s_)
        return all(any(x == y for y in it) for x in (w["word"] for w in c))
    if cw is not None and cw != sw and not (sw and _so_cortes(cw, sw)):
        doc["captions"]["words"] = cw
        kept.append("legenda")
    for key in ("zoom", "markers", "voice", "video"):
        if key in cur:
            doc[key] = cur[key]
tmp = S + "edit.json.tmp"
json.dump(doc, open(tmp, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
os.replace(tmp, S + "edit.json")
json.dump(gen, open(SNAP, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("ajustes dele mantidos:", len(kept), " ".join(kept[:40]))
print(f"duração {DUR:.2f} s, cenas {len(scenes)}, sons {len(snd)}")
for sc in scenes:
    print(f"{sc['start']:7.2f}-{sc['end']:7.2f} {sc['type']:12s} {sc['label'][:60]}  " + json.dumps({k: v for k, v in sc["props"].items() if k.endswith('At')}), flush=True)
