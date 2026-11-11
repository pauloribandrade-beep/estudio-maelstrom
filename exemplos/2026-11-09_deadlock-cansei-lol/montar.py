"""Monta o projeto do Estúdio do vídeo "Cansei do LoL" (Deadlock, 09/11/2026).

Entrada: voz_blocks.json + words.json (voz.py). Gera ig1080.*, segments.json, words.json e o edit.json.
Cenas em CL.tsx + logos/socos do Magia (MG2.tsx).

REGRA (preservar-cortes-dele): segments.json atual é a verdade e nunca é recriado; edit.json passa por fusão de 3 vias com
out/<slug>/edit.montar.json.   --voz-do-zero recria os takes (APAGA os cortes dele, só com aval)   --base só grava a referência
"""
import json, os, re, subprocess, sys, wave
import numpy as np

ED = os.environ.get("ESTUDIO_EDITOR") or os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "Reels", "editor")).replace("\", "/")
SL = "2026-11-09_deadlock-cansei-lol"
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
            if g["editStart"] - 1e-6 <= t < g["editStart"] + g["frames"] / 30 + 1e-6:
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
# Pedido dele (09/11): "lá na pasta Deadlock tem mais um vídeo… Cansei do LoL… pode iniciar". Só voz, Short vertical, linha v2 do
# Farm: ícone + tipografia, objeto em ação por fala, material real (logos, Shaco, DEFEAT, gameplay), memes nos golpes.
L = 0.05
F5 = 5 / 30  # o MGLogo bate 5 quadros depois do slamAt


def P(t0, *ws):
    return [round(w - t0 + L, 2) for w in ws]


t_mas = A("mas", 15.1)
t_mas2 = A("mas", 86.7)
t_mas3 = A("mas", 125.4)
PLAN = [
    (0.0, "cliente do LoL · JOGAR · temporada 2026 · CHATO DEMAIS", "CLClient", {"jogarAt": A("jogar"), "yearAt": A("2026"), "chatoAt": A("chato"), "demaisAt": A("demais"), "loucoAt": A("louco")}),
    (A("eu", 5.7) - L, "coleção +10 anos · PARTIDA ENCONTRADA · Coringa", "CLReady", {"tenAt": A("10", 7), "openAt": A("abro"), "madAt": A("maluco")}),
    (A("já", 13.4) - L, "seleção de campeão · trava o Shaco", "CLPick", {"mainAt": A("main"), "shacoAt": A("shaco")}),
    (t_mas - L, "soco · jogar esse jogo, fico insano", "MGPunch", {"clip": "lol_b", "ss": 60, "punchS": P(t_mas, A("jogar", 15.9), A("insano")), "z1": 1.07}),
    (A("simplesmente") - L, "15:00 · rendição · DERROTA", "CLSurrender", {"minAt": A("minutos"), "nadaAt": A("fazer"), "overAt": A("acabou")}),
    # v2 (10/11), de 0:25 ao fim: cada coisa dentro da UI do jogo dela; poucos golpes por cena
    (A("é", 24.8) - L, "ranqueada: PdL não sai do lugar · QWER em loop · MECÂNICO", "CLGrind", {"eloAt": A("elo"), "mecAt": A("mecânica"), "loopAt": A("depois", 30.5), "mec2At": A("mecânico")}),
    (A("isso", 35) - L, "histórico de partidas voltando até 2014 · Pica-Pau", "CLHistory", {"tenAt": A("10", 38), "y15At": A("2015"), "y14At": A("2014"), "tiredAt": A("aguento")}),
    (A("eu", 47.4) - L, "tenta clicar em JOGAR · correntes apego/vício/dano · o buraco", "CLLocks",
     {"closeAt": A("eu", 47.4) + 0.35, "backAt": A("lol", 48.3), "apegoAt": A("apego"), "vicioAt": A("vício"), "danoAt": A("dano"), "holeAt": A("buraco")}),
    (A("e", 57.1) - L, "placar da derrota · indignado · o time feedando", "CLScore", {"loseAt": A("perdendo"), "madAt": A("indignado"), "feedAt": A("fidando")}),
    (A("eu", 65.0) - L, "busca na Steam · divertido · aprender · Deadlock sobe e abre", "CLSteam", {"funAt": A("divertido"), "learnAt": A("aprendido"), "foundAt": A("encontrado"), "dlAt": A("deadlock", 72)}),
    (A("mesmo", 72.6) - L, "Deadlock: 5 derrotas seguidas · DERROTA do LoL", "CLStreak", {"lossAt": A("perca"), "chillAt": A("não", 74.4), "lolAt": A("perder", 76)}),
    (A("fora") - L, "chat do LoL × chat do Deadlock · exceção silenciada", "CLChats", {"commAt": A("comunidade", 79), "diffAt": A("diferente", 80), "excAt": A("exceções"), "pontoAt": A("ponto", 86)}),
    (t_mas2 - L, "soco · experiência fantástica jogando Deadlock", "MGPunch", {"clip": "k4", "ss": 80, "punchS": P(t_mas2, A("fantástica"), A("deadlock", 91)), "z1": 1.07}),
    (A("e", 92.1) - L, "potencial · campeões do LoL viram o grupo do Deadlock", "CLParty", {"peopleAt": A("pessoas", 94.5), "potAt": A("potencial"), "migAt": A("migrar")}),
    (A("eu", 101.5) - L, "chave do campeonato · MAJOR / CBLOL de Deadlock · nome?", "CLBracket", {"champAt": A("campeonato", 102), "majorAt": A("major"), "cblolAt": A("cblol"), "nameAt": A("nome"), "commAt": A("comentários")}),
    (A("mas", 112.8) - L, "gráfico: Deadlock sobe, LoL parado, e cai (porra nenhuma)", "CLGraph", {"commAt": A("comunidade", 114), "growAt": A("aumenta"), "engAt": A("engajamento"), "lolAt": A("lol", 122), "zeroAt": A("porra")}),
    (t_mas3 - L, "soco · o jogo tá uma delicinha", "MGPunch", {"clip": "raw", "ss": 220, "punchS": P(t_mas3, A("delicinha")), "z1": 1.07}),
    (A("então", 129.3) - L, "comentário → DM → convite do Discord → convite do grupo", "CLJoin", {"commentAt": A("comenta", 131), "dmAt": A("mensagem"), "discordAt": A("discord", 136), "commAt": A("comunidade", 138), "inviteAt": A("convite", 142)}),
    (A("eu", 144.2) - L, "fim · perfil do Blies com anel de live · temas · seguir", "CLProfile",
     {"nameAt": A("blies"), "liveAt": A("live", 145), "blinkAt": A("piscando"), "hlAt": A("half-life"), "gamesAt": A("jogos", 156), "musicAt": A("música"), "followAt": A("segue"), "byeAt": A("tamo")}),
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
    doc = {"version": 1, "slug": SL, "comp": "ClEdit", "format": "wide", "orient": "vertical", "fps": 30, "video": {"src": f"videos/{SL}/ig1080.mp4"},
           "zoom": {"snaps": [{"t": 0, "z": 1}], "pushes": []}, "sounds": [], "markers": [], "voice": {}}
doc["duration"] = DUR
doc["scenes"] = scenes
doc["soundTracks"] = [{"id": "tm", "name": "Música"}, {"id": "t1", "name": "Efeitos"}]
doc["captions"] = {"style": "laestro", "y": 1370, "cardY": 1370, "padL": 90, "padR": 170, "size": 72, "groupSize": 3,
                   "hot": ["Deadlock", "LoL", "chato", "Shaco", "Acabou!", "elo", "mecânico", "apego", "vício", "buraco", "comunidade", "Major", "CBLOL", "Discord", "Blies", "live", "Half-Life"],
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
    snd.append({"id": f"{base}~{n}", "src": path, "start": round(max(0, t - (pk if align else 0)), 3), "vol": vol, "dur": dur, "fadeOut": 0.12, "track": "t1", "label": label})


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


# abertura: Among Us (role reveal), o gancho que deu certo no TikTok (um pouco mais baixo)
snd.append({"id": "m_amongus", "src": SO_ND + "amongus_completo.wav", "start": 0.0, "vol": 0.2, "dur": 4.55, "fadeOut": 0.6, "track": "t1", "label": "meme · abertura Among Us (role reveal, completo)"})

# 10/11: menos som e mais espaço. Um efeito por golpe, nada de dois juntos, tudo mais baixo.
for sc in scenes:
    t0, ty, lab = sc["start"], sc["type"], sc["label"]
    p = ABS[sc["id"]]
    if ty == "CLClient":
        sfx(LS + "lobby-button-find-match-click.wav", p["jogarAt"], "clique JOGAR (cliente do LoL)", 1.6, 0.8, align=False)
        sfx(LS + "ranked-ui-lp-decrease.wav", p["chatoAt"], "CHATO: placa de fim de jogo bate, cliente apaga", 1.3, 0.8)
    elif ty == "CLReady":
        sfx(LS + "levelup-postgame-generic.wav", p["tenAt"], "+10 ANOS DE LOL (subiu de nível)", 2.0, 0.7)
        sfx(LS + "readycheck-sr-portal.wav", p["openAt"], "PARTIDA ENCONTRADA (som real do cliente)", 2.6, 0.8, align=False)
        sfx(DS + "stun.wav", p["madAt"], "Coringa puxando o cabelo (maluco)", 1.0, 0.5)
    elif ty == "CLPick":
        sfx(LS + "cs-lockin-button-click.wav", p["shacoAt"], "BLOQUEAR (trava o Shaco)", 1.6, 0.8, align=False)
    elif ty == "MGPunch":
        # sem whoosh no corte: o soco já tem o próprio golpe (10/11, som empilhado)
        sfx(PUNCH[_pi % 3], t0 + p["punchS"][-1], lab + " · soco", 0.6, 0.6)
        _pi += 1
    elif ty == "CLSurrender":
        sfx(LS + "cs-timer-tick.wav", p["minAt"], "15:00 bate no relógio", 1.0, 0.7, align=False)
        sfx(LS + "cs-timer-tick-small.wav", p["nadaAt"] + 8 * FR, "votação de rendição abre", 0.4, 0.6, align=False)
        sfx(LS + "cs-draft-10ban-your-pick-denied.wav", p["overAt"], "ACABOU: placa de DERROTA", 2.0, 0.8)
    elif ty == "CLGrind":
        sfx(LS + "ranked-ui-lp-increase-final-tick.wav", p["eloAt"] + 8 * FR, "PdL sobe um pouco (e cai de novo)", 1.0, 0.6, align=False)
        sfx(LS + "dh-ui-generic-click.wav", p["loopAt"], "QWER começa a rodar em loop", 0.5, 0.4, align=False)
        sfx(LS + "cs-draft-notif-yourpick.wav", p["mec2At"], "MECÂNICO trava a barra", 1.4, 0.6)
    elif ty == "CLHistory":
        sfx(LS + "uikit-grid-hover.wav", p["tenAt"], "histórico rola pra trás (10 anos)", 0.6, 0.5, align=False)
        sfx(LS + "cs-timer-tick-small.wav", p["y15At"], "para em 2015", 0.4, 0.5, align=False)
        sfx(LS + "uikit-grid-click.wav", p["y14At"], "2014", 0.5, 0.5, align=False)
        meme(MM + "picapau.wav", p["tiredAt"], "meme Pica-Pau · eu não aguento", 0.0, 0.95, 0.2)
    elif ty == "CLLocks":
        sfx(LS + "lobby-button-find-match-click.wav", p["backAt"], "voltando pro LoL: clica em JOGAR", 1.2, 0.55, align=False)
        sfx(DS + "baba_ult_max_lock_01.wav", p["apegoAt"], "corrente tranca: APEGO", 1.4, 0.55)
        sfx(DS + "baba_ult_max_lock_02.wav", p["vicioAt"], "corrente tranca: VÍCIO", 1.4, 0.55)
        sfx(DS + "baba_ult_max_lock_03.wav", p["danoAt"], "corrente tranca: DANO", 1.4, 0.55)
        sfx(DS + "dynamo_a4_singularity_cast_01.wav", p["holeAt"], "o buraco abre e engole o cliente", 3.0, 0.7, align=False)
    elif ty == "CLScore":
        sfx(LS + "cs-draft-10ban-your-pick-denied.wav", t0 + 2 * FR, "placar: DERROTA", 2.0, 0.5)
        sfx(LS + "cs-lockin-button-hover.wav", p["feedAt"], "o Yasuo feedando acende", 0.8, 0.5, align=False)
    elif ty == "CLSteam":
        typing(p["funAt"] - 26 * FR, len("jogo divertido mesmo perdendo"), 1.1, "busca na Steam")
        typing(p["learnAt"], len(" e que ensina"), 0.9, "e que ensina")
        sfx(DS + "ui_herocard_hover.wav", p["foundAt"], "Deadlock sobe pro topo", 0.9, 0.6, align=False)
        sfx(DS + "ui_game_start.wav", p["dlAt"], "clique: a capa do Deadlock abre", 1.6, 0.6)
    elif ty == "CLStreak":
        sfx(DS + "music_stinger_game_over_lose.wav", p["lossAt"], "5 derrotas no Deadlock", 2.0, 0.45, align=False)
        sfx(LS + "cs-draft-10ban-your-pick-denied.wav", p["lolAt"], "1 ou 2 no LoL: DERROTA do LoL cai", 2.0, 0.8)
    elif ty == "CLChats":
        sfx(LS + "soc-ui-chatwindow-open.wav", t0 + 2 * FR, "chat do LoL abre", 0.8, 0.5, align=False)
        sfx(DS + "ui_chat_msg_received_03.wav", p["diffAt"], "chat do Deadlock", 0.4, 0.6, align=False)
        sfx(DS + "ui_commend_receive_02.wav", p["diffAt"] + 48 * FR, "+ ELOGIO RECEBIDO", 1.5, 0.45, align=False)
        sfx(DS + "ping_warning.wav", p["excAt"], "a exceção (xingamento)", 0.8, 0.45, align=False)
    elif ty == "CLParty":
        sfx(DS + "ui_hud_acquire_ap_01.wav", p["potAt"], "as vagas acendem (potencial)", 1.0, 0.5, align=False)
        sfx(DS + "ui_friends_party_member_new.wav", p["migAt"], "campeões do LoL entram no grupo", 1.2, 0.6, align=False)
        sfx(DS + "ui_game_matchmake_find.wav", p["migAt"] + 52 * FR, "PROCURAR PARTIDA", 1.2, 0.5, align=False)
    elif ty == "CLBracket":
        sfx(DS + "ui_achievement_toast_seasonal.wav", p["champAt"], "a chave do campeonato se desenha", 2.0, 0.4, align=False)
        sfx(LS + "cs-splash-forward.wav", p["cblolAt"], "CBLOL entra no lugar de MAJOR", 1.2, 0.5, align=False)
        sfx(LS + "uikit-button-gold-hover.wav", p["commAt"], "caixa de comentário sobe", 0.6, 0.5, align=False)
    elif ty == "CLGraph":
        sfx(DS + "popup_level_up.wav", p["growAt"], "a linha do Deadlock sobe", 0.6, 0.6, align=False)
        sfx(DS + "ui_get_gold_large_01.wav", p["engAt"], "curtida, comentário e compartilhar saem da linha", 1.2, 0.45, align=False)
        sfx(DS + "speed_boost.wav", p["zeroAt"], "o gráfico cai (porra nenhuma)", 0.8, 0.5, align=False)
    elif ty == "CLJoin":
        typing(p["commentAt"], len("quero jogar!"), 0.7, "comentário")
        sfx(DS + "ui_chat_msg_received_01.wav", p["dmAt"] + 4 * FR, "mensagem no privado", 0.5, 0.5, align=False)
        sfx(DS + "ui_friends_list_send_invite_01.wav", p["discordAt"], "convite do Discord", 1.0, 0.5, align=False)
        sfx(LS + "soc-ui-gameinvite-accept-click.wav", p["commAt"] + 6 * FR, "clique Entrar (Discord)", 0.8, 0.5, align=False)
        sfx(DS + "ui_friends_list_receive_invite_01.wav", p["inviteAt"], "convite pro grupo no Deadlock", 1.2, 0.55, align=False)
        sfx(DS + "ui_confirm_roster.wav", p["inviteAt"] + 34 * FR, "ACEITAR: no grupo", 1.0, 0.5, align=False)
    elif ty == "CLProfile":
        sfx(DS + "ui_herocard_hover.wav", p["nameAt"], "BLIES", 0.9, 0.5, align=False)
        sfx(DS + "ping_rally.wav", p["liveAt"], "anel de LIVE acende", 0.8, 0.4, align=False)
        sfx(LS + "uikit-grid-click.wav", p["hlAt"], "temas: Half-Life, jogos, música", 0.5, 0.45, align=False)
        sfx(LS + "gameselect-button-confirm-click.wav", p["followAt"] + 12 * FR, "clique Seguir", 1.0, 0.5, align=False)
        sfx(DS + "music_stinger_game_over_win.wav", p["byeAt"], "TAMO JUNTO (vitória)", 2.5, 0.35, align=False)

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
