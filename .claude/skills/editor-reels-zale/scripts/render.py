#!/usr/bin/env python3
"""Renderiza a composição, normaliza o volume e faz o QA automático.

    render.py <slug> <Composicao> [--no-qa]

Saídas em <EDITOR>/out/<slug>/:
  <slug>-<comp>.mp4          final (áudio normalizado a -16 LUFS, vídeo copiado)
  <slug>-<comp>-preview.mp4  720p leve, para ver no celular
  <slug>-<comp>-sheet.png    contact sheet pequeno (1 quadro a cada 4 s)
  render.log           log do Remotion
Imprime só o resumo do QA (duração, áudio, silêncios > 0.8 s na fala).
"""
import argparse
import os
import re
import subprocess
import sys

sys.path.insert(0, os.path.dirname(__file__))
from _env import EDITOR, TEMP_BASE, ffmpeg, ffprobe, npx  # noqa: E402


def slim_public(slug, doc, tag="render"):
    """public enxuta para o render: o Remotion COPIA a pasta public inteira a cada render (6 GB com os
    vídeos brutos de todos os projetos; o render ficava minutos em "Copying public dir" e às vezes parava).
    Aqui entram por hardlink (sem gastar espaço nem tempo) só os sons, a marca, fontes, música, as imagens
    deste vídeo e todo arquivo que o edit.json cita (vídeo cortado, voz, fotos de outro projeto)."""
    import shutil
    pub = os.path.join(EDITOR, "public")
    dst = os.path.join(EDITOR, "out", ".pub", f"{slug}-{tag}")  # uma por uso: render e conferidor não apagam a do outro
    shutil.rmtree(dst, ignore_errors=True)

    def link(rel):
        src = os.path.join(pub, rel)
        if not os.path.exists(src):
            return
        if os.path.isdir(src):
            for root, _, files in os.walk(src):
                for fn_ in files:
                    link(os.path.relpath(os.path.join(root, fn_), pub))
            return
        d = os.path.join(dst, rel)
        if os.path.exists(d):
            return  # já entrou (pasta img e citação no edit.json)
        os.makedirs(os.path.dirname(d), exist_ok=True)
        try:
            os.link(src, d)
        except OSError:
            shutil.copy2(src, d)

    # music/ (2,4 GB) e as subpastas de sfx/ (hl3, old, _fx, _ir: 0,8 GB) entram só com o que o projeto cita: o F: é HD
    # mecânico e o Remotion copiava 3,8 GB a cada render (06/11: ~1,5 min só de "Copying public dir"). Os efeitos soltos na
    # raiz de sfx/ (0,13 GB) entram todos, porque o palco e os overlays montam o nome na hora (sfx/whoosh_3.wav).
    for top in os.listdir(pub):
        if top in ("videos", "music"):
            continue
        if top == "sfx":
            for fn_ in os.listdir(os.path.join(pub, top)):
                if os.path.isfile(os.path.join(pub, top, fn_)):
                    link(f"sfx/{fn_}")
            continue
        link(top)
    link(f"videos/{slug}/img")
    link(f"videos/{slug}_R")  # recursos citados no CÓDIGO das cenas (fitas assadas, grão), não no edit.json
    # pastas _R de OUTROS vídeos citadas no código das cenas (ex.: trechos de trailer reaproveitados entre episódios)
    import re
    # segue também os outros vídeos de onde as cenas importam componentes (ep. 3 usa o player do ep. 2, que cita o _R do ep. 2)
    dirs, todo = set(), [slug]
    # cenas de OUTRO vídeo usadas pelo tipo no edit.json (ex.: DLMe do patch no CTA dos outros episódios): o registry diz de onde vêm
    try:
        reg = open(os.path.join(EDITOR, "src", "lib", "edit", "registry.tsx"), encoding="utf-8").read()
        used = {sc.get("type") for sc in doc.get("scenes", [])}
        for names, vdir in re.findall(r"import \{([^}]+)\} from \"\.\./\.\./videos/([^/\"]+)/", reg):
            if used & {n.strip() for n in names.split(",")}:
                todo.append(vdir)
    except OSError:
        pass
    while todo:
        cur = todo.pop()
        if cur in dirs:
            continue
        dirs.add(cur)
        sd = os.path.join(EDITOR, "src", "videos", cur)
        for fn_ in os.listdir(sd) if os.path.isdir(sd) else []:
            if fn_.endswith((".tsx", ".ts")):
                src_ = open(os.path.join(sd, fn_), encoding="utf-8").read()
                for m in set(re.findall(r"videos/([^/\"'`$]+_R)/", src_)):
                    link(f"videos/{m}")
                for m in set(re.findall(r"[\"'`]((?:sfx|music)/[^\"'`$]+\.\w{2,4})[\"'`]", src_)):
                    link(m)  # som citado com nome fixo no código da cena
                todo += re.findall(r"from \"\.\./([^/\"]+)/", src_)
    # arquivos citados com nome fixo em QUALQUER código (src/lib também): em 07/11 o render do HL3 caiu no bloco
    # 29/30 porque src/lib/hl3woman.tsx cita videos/hl3_M01/hla_mulher.mp4 e ele não entrava na public enxuta
    for root, _, files in os.walk(os.path.join(EDITOR, "src")):
        for fn_ in files:
            if fn_.endswith((".tsx", ".ts")):
                try:
                    src_ = open(os.path.join(root, fn_), encoding="utf-8").read()
                except OSError:
                    continue
                for m in set(re.findall(r"[\"'`]((?:videos|sfx|music|hl3|hl3models)/[^\"'`$]+\.\w{2,4})[\"'`]", src_)):
                    link(m)
    refs = set()

    def walk(v):
        if isinstance(v, dict):
            for x in v.values():
                walk(x)
        elif isinstance(v, list):
            for x in v:
                walk(x)
        elif isinstance(v, str) and v.startswith(("videos/", "sfx/", "music/")):
            refs.add(v)

    walk(doc)
    scale = (doc.get("video", {}).get("fit") or {}).get("scale", 1)
    for ref in refs:
        base = os.path.basename(ref)
        if base.startswith(("editproxy", "proxy720")) or base == "ig1080.mp4":
            continue  # prévias do Estúdio: o render não usa
        if base == "master.mp4" and doc["video"].get("cut") and scale >= 1:
            continue  # com o vídeo cortado e sem bordas, o master não é lido
        link(ref)
    return dst


CHUNK_FRAMES = 1800  # 1 min a 30 qps (era 2 min, 10/11): pausar e desligar o PC perde no máx. os blocos em andamento (~10 min)
# modo de uso do PC durante o render (escolhido no Estúdio): prioridade do Windows + quantos núcleos o Remotion usa
MODES = {
    "alta": ("ABOVE_NORMAL_PRIORITY_CLASS", "85%"),  # "não vou usar o PC": tudo para o render
    "baixa": ("BELOW_NORMAL_PRIORITY_CLASS", "50%"),  # "vou usar o PC": o que você abrir tem preferência
}
# Render em blocos com VÁRIOS Chromes ao mesmo tempo (medido em 09/11, promo 2, RTX 4060 + 16 threads):
#   1 Chrome com 8 abas: 21-24 q/s · 4 abas dá o mesmo (o gargalo é o Chrome desenhar e copiar o quadro, não a CPU)
#   2 Chromes x 3-4 abas: 30 q/s · 3 Chromes x 3 abas: 36 q/s com CPU média 51% (pico 75%) · 4 Chromes: 49 q/s mas pico 99%
#   (regra do Paulo: o PC nunca em 100%, então o teto é 3). 4K: 1 Chrome 9,4 q/s -> 3 Chromes 13,8 q/s, CPU média 42%.
# Cada valor: (Chromes em paralelo, abas por Chrome)
PARALLEL = {"alta": (3, 3), "baixa": (2, 3)}


# resolução do vídeo final (escolhida no Estúdio): o Remotion redesenha cada quadro nesse tamanho (--scale), então
# textos, ícones e linhas saem nítidos de verdade (esticar o 1080p depois não cria detalhe; teste de 09/11).
# crf: 4K tem 4x os pixels, crf 18 já é visualmente sem perda e o arquivo cabe no disco (~30-40 GB em 2 h).
# Compressão pela placa de vídeo (NVENC, --hardware-acceleration): mesma velocidade de quadros, mas a CPU cai de
# 64% para 42% (4K) e de 64% para 51% (1080p), o que libera espaço para mais Chromes sem chegar a 100%. O NVENC não
# aceita crf: a qualidade vem da taxa (1080p 20 Mb/s = a do render do HL3 de 07/11; 4K 45 Mb/s = o topo que o YouTube
# recomenda para 4K30). Sem placa NVIDIA o Remotion cai sozinho para o libx264 com a mesma taxa.
RES = {
    "1080": {"scale": 1, "rate": "20M", "tag": ""},
    "4k": {"scale": 2, "rate": "45M", "tag": "_4k"},
}


def render_flags(res):
    """parâmetros de qualidade iguais para o render em blocos e o direto.
    --color-space=bt709: antes saía yuvj420p marcado como BT.601 de faixa cheia (padrão do Remotion), que o YouTube
    e os players podem ler com contraste e cor errados; bt709 com faixa de TV é o padrão de vídeo HD/4K."""
    r = RES[res]
    return [f"--scale={r['scale']}", "--hardware-acceleration=if-possible", f"--video-bitrate={r['rate']}", "--jpeg-quality=95",
            "--color-space=bt709"]


def code_hash():
    import hashlib
    h = hashlib.md5()
    for d in ("src", "public/hl3models"):
        for root, _, files in os.walk(os.path.join(EDITOR, d)):
            for fn_ in sorted(files):
                q = os.path.join(root, fn_)
                st = os.stat(q)
                h.update(f"{os.path.relpath(q, EDITOR)}|{st.st_size}|{int(st.st_mtime)}".encode())
    return h.hexdigest()[:12]


def video_code_hash(slug):
    """Chave do código que ESTE vídeo usa (10/11). O code_hash() olha a data de todo arquivo de src, inclusive o
    edit.json e os vídeos de outros projetos: qualquer mexida em qualquer vídeo (as sessões do Deadlock mexem o dia
    todo) mudava a chave e jogava fora todos os blocos do HL3, então pausar/desligar e voltar recomeçava do zero.
    Aqui: só o conteúdo dos arquivos importados a partir de src/videos/<slug> (+ fontes globais), sem o edit.json
    (as cenas e sons de cada bloco já entram na chave do bloco), e no registro de cenas sem as linhas de outros vídeos."""
    import hashlib
    src = os.path.join(EDITOR, "src")
    vdir = os.path.join(src, "videos", slug)
    imp = re.compile(r"""(?:\bfrom\s*|\bimport\s*\(?\s*)["'](\.{1,2}/[^"']+)["']""")
    named = re.compile(r"""import\s*(?:type\s+)?\{([^}]*)\}\s*from\s*["']([^"']+)["']""", re.S)

    def resolve(base, rel):
        q = os.path.normpath(os.path.join(os.path.dirname(base), rel))
        for ext in ("", ".ts", ".tsx", ".js", ".jsx", ".json", "/index.ts", "/index.tsx"):
            if os.path.isfile(q + ext):
                return q + ext
        return None

    def other_video(path):
        rp = os.path.relpath(path, os.path.join(src, "videos"))
        return not rp.startswith("..") and rp.split(os.sep)[0] != slug

    todo = [os.path.join(vdir, f) for f in os.listdir(vdir) if f.endswith((".ts", ".tsx"))]
    todo.append(os.path.join(src, "lib", "fonts.ts"))
    seen = {}
    while todo:
        f = os.path.normpath(todo.pop())
        if f in seen or not os.path.isfile(f):
            continue
        txt = open(f, encoding="utf-8", errors="ignore").read()
        if os.path.basename(f) == "edit.json" and os.path.dirname(f) == os.path.normpath(vdir):
            seen[f] = ""
            continue
        if f.endswith((".ts", ".tsx", ".js", ".jsx")):
            # o registro importa as cenas de TODOS os vídeos: tira as importações e as linhas que citam cenas de outros vídeos
            drop = set()
            for m in named.finditer(txt):
                r = resolve(f, m.group(2)) if m.group(2).startswith(".") else None
                if r and other_video(r):
                    for part in m.group(1).split(","):
                        nm = part.strip().split(" as ")[-1].strip()
                        if nm:
                            drop.add(nm)
                    txt = txt.replace(m.group(0), "")
            if drop:
                w = re.compile(r"\b(?:" + "|".join(sorted(map(re.escape, drop))) + r")\b")
                txt = "\n".join(ln for ln in txt.splitlines() if not w.search(ln))
            for m in imp.finditer(txt):
                r = resolve(f, m.group(1))
                if r and not other_video(r):
                    todo.append(r)
        seen[f] = txt
    h = hashlib.md5()
    for f in sorted(seen):
        h.update(os.path.relpath(f, EDITOR).replace("\\", "/").encode() + b"\0" + seen[f].encode("utf-8", "ignore") + b"\0")
    for root, _, files in os.walk(os.path.join(EDITOR, "public", "hl3models")) if slug.startswith("hl3") else ():
        for fn_ in sorted(files):
            q = os.path.join(root, fn_)
            h.update(f"{os.path.relpath(q, EDITOR)}|{os.stat(q).st_size}".encode())
    return h.hexdigest()[:12], len(seen)


class Progress:
    """Uma barra só, de 0 a 100, para o render inteiro. Cada etapa vale o tempo que se espera que ela leve
    (preparação, cada bloco de quadros com o preparo dos sons dele, fechamento do áudio); as estimativas vêm do
    último render deste vídeo (out/<slug>/_render_tempos.json) e são regravadas no fim. O Estúdio só lê a linha
    PROGRESSO; nunca volta para trás e nenhuma etapa intermediária mostra 90/100%."""

    def __init__(self, log, out, tag=""):
        import json as _j
        import time
        self.time = time.time
        self.log, self.t0 = log, time.time()
        self.hist_file = os.path.join(out, f"_render_tempos{tag}.json")  # 4K tem velocidade própria
        try:
            self.hist = _j.load(open(self.hist_file, encoding="utf-8"))
        except (OSError, ValueError):
            self.hist = {}
        self.w, self.done, self.cur, self.cur_frac = {}, set(), None, 0.0
        self.last_pct, self.last_write, self.frames = 0.0, 0.0, ""
        self.meas = {}

    def plan(self, stages):  # [(nome, segundos estimados)] na ordem; etapas já concluídas ficam como estão
        for k, v in stages:
            if k not in self.done:
                self.w[k] = max(0.5, float(v))

    def drop(self, k):  # etapa que não precisa rodar (bloco já no cache)
        self.w.pop(k, None)

    def start(self, k):
        self.cur, self.cur_frac = k, 0.0
        self.emit(True)

    def set(self, frac, frames=None):
        self.cur_frac = max(self.cur_frac, min(0.999, frac))
        if frames:
            self.frames = frames
        self.emit()

    def mark(self, label):  # tempo de cada etapa no render.log (para achar onde o render perde tempo)
        self.log.write(f"TEMPO {label} {self.time() - self.t0:.1f}s" + chr(10))

    def finish(self, k):
        self.mark(f"fim:{k}")
        self.done.add(k)
        self.cur, self.cur_frac = None, 0.0
        self.emit(True)

    def emit(self, force=False):
        now = self.time()
        if not force and now - self.last_write < 0.5:
            return
        tot = sum(self.w.values()) or 1
        dw = sum(self.w[k] for k in self.done if k in self.w) + (self.w.get(self.cur, 0) * self.cur_frac if self.cur else 0)
        pct = max(self.last_pct, min(99.9, 100 * dw / tot))
        self.last_pct, self.last_write = pct, now
        el = now - self.t0
        # tempo restante: o que falta das estimativas, corrigido pela velocidade real até aqui
        speed = el / dw if dw > tot * 0.03 else 1.0
        eta = max(0, int((tot - dw) * speed))
        self.log.write(f"PROGRESSO {pct:.1f} eta={eta}" + (f" quadros={self.frames}" if self.frames else "") + "\n")
        self.log.flush()

    def save(self):
        import json as _j
        self.hist.update(self.meas)
        try:
            _j.dump(self.hist, open(self.hist_file, "w", encoding="utf-8"), indent=1)
        except OSError:
            pass


def frames_est(prog, n):
    """segundos esperados para n quadros + preparo do bloco (abrir o Chrome, sons do trecho, juntar o áudio)"""
    return n / prog.hist.get("fps", 10.0) + prog.hist.get("chunk_over", 60.0)


def run_remotion(cmd, n_frames, prog, env, done_before=0, total=None):
    """roda o Remotion lendo a saída: quadros contam pelo número; o resto do bloco (preparo, sons, junção) conta
    pelo tempo esperado, travado abaixo do fim do bloco. Devolve (código, segundos nos quadros, segundos no total)."""
    p = subprocess.Popen(cmd, cwd=EDITOR, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, env=env)
    fps_e = prog.hist.get("fps", 10.0)
    over_e = prog.hist.get("chunk_over", 60.0)
    full = n_frames / fps_e + over_e
    t_start, t_first, t_last, got = prog.time(), None, None, 0
    buf = b""
    while True:
        c = p.stdout.read(1)
        if not c:
            break
        if c not in (b"\r", b"\n"):
            buf += c
            if len(buf) < 4000:
                continue
        line = buf.decode("utf-8", "ignore").strip()
        buf = b""
        if not line:
            continue
        now = prog.time()
        mm = re.search(r"Rendered (\d+)/(\d+)", line)
        if mm:
            got = int(mm.group(1))
            t_first = t_first or now
            t_last = now
        else:
            prog.log.write(line + "\n")  # fica no log para diagnóstico; o Estúdio ignora
        busy = got / fps_e
        other = min(over_e * 0.95, max(0.0, (now - t_start) - ((t_last - t_first) if t_first else 0)))
        tt = total or n_frames
        prog.set((busy + other) / full, f"{done_before + got}/{tt}")
    code = p.wait()
    t_end = prog.time()
    return code, ((t_last - t_first) if t_first and got > 300 else None), t_end - t_start, got


def set_priority_loop(mode, stop):
    """aplica a prioridade escolhida neste processo e em tudo que ele abre (node, Chrome, ffmpeg): no Windows os
    filhos do node não herdam a prioridade sozinhos, então reaplica a cada 5 s"""
    try:
        import psutil
    except ImportError:
        return
    cls = getattr(psutil, MODES[mode][0], None)
    if cls is None:
        return
    me = psutil.Process()
    while not stop.is_set():
        try:
            for q in [me, *me.children(recursive=True)]:
                try:
                    if q.nice() != cls:
                        q.nice(cls)
                except (psutil.Error, OSError):
                    pass
        except psutil.Error:
            pass
        stop.wait(5)


def ffmpeg_progress(args, dur, prog):
    """ffmpeg com -progress: a etapa avança pelo tempo de áudio já processado"""
    p = subprocess.Popen([ffmpeg(), "-hide_banner", "-nostats", "-progress", "pipe:1", *args], stdout=subprocess.PIPE,
                         stderr=subprocess.PIPE, text=True, encoding="utf-8", errors="ignore")
    import threading
    err = []
    th = threading.Thread(target=lambda: err.append(p.stderr.read()), daemon=True)
    th.start()
    for line in p.stdout:
        m = re.match(r"out_time_us=(\d+)", line.strip())
        if m and dur:
            prog.set(int(m.group(1)) / 1e6 / dur)
    code = p.wait()
    th.join()
    return code, "".join(err)


def render_chunk_proc(cmd, env, log, lock, got, i):
    """um Chrome renderizando um bloco: conta os quadros prontos em got[i]; o resto da saída vai para o log"""
    p = subprocess.Popen(cmd, cwd=EDITOR, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, env=env)
    buf = b""
    while True:
        c = p.stdout.read(1)
        if not c:
            break
        if c not in (b"\r", b"\n"):
            buf += c
            if len(buf) < 4000:
                continue
        line = buf.decode("utf-8", "ignore").strip()
        buf = b""
        if not line:
            continue
        mm = re.search(r"Rendered (\d+)/(\d+)", line)
        if mm:
            got[i] = int(mm.group(1))
        else:
            with lock:
                log.write(f"[bloco {i + 1}] {line}\n")
    return p.wait()


def render_chunked(a, doc, props_file, pubdir, env, log, out, prog, conc, rflags):
    """Vídeo longo em blocos de 4 min com cache. Por que: o Remotion prepara CADA som como um WAV do tamanho do
    trecho renderizado (adelay + apad); com 4.500 efeitos num vídeo de 2 h isso seriam ~6 TB. Em blocos, cada um só
    leva os sons dele (poucos GB). Cada bloco fica guardado com uma chave do que aparece nele (cenas e sons do trecho +
    código + vídeo contínuo): se o render cair, ou se só um trecho mudou, só os blocos afetados são refeitos.
    Devolve o arquivo da lista para o concat (vídeo copiado, áudio PCM emendado sem perda)."""
    import hashlib
    import json as _j
    import shutil
    fps = doc.get("fps", 30)
    cache = os.path.join(os.path.join(TEMP_BASE, "rcache") if TEMP_BASE else os.path.join(EDITOR, "out", ".rcache"), a.slug)
    os.makedirs(cache, exist_ok=True)
    # Bundle (o código das cenas compilado) guardado e reaproveitado enquanto o código não muda; a pasta public entra
    # nele por RENOMEAÇÃO da public enxuta (hardlinks no mesmo disco), não por cópia. Medido em 09/11 no promo 2: o
    # bundle levava 56 s (o Remotion COPIAVA 1,6 GB do F: para o D: a cada render; no HL3 eram 5,4 GB) = metade do render.
    bdir = os.path.join(EDITOR, "out", ".bundle")
    bundle = os.path.join(bdir, a.slug)
    bkey = code_hash()
    stamp = os.path.join(bundle, ".chave")
    try:
        same = open(stamp, encoding="utf-8").read().strip() == bkey and os.path.exists(os.path.join(bundle, "index.html"))
    except OSError:
        same = False
    if not same:
        shutil.rmtree(bundle, ignore_errors=True)
        empty = os.path.join(bdir, "_vazio")
        os.makedirs(empty, exist_ok=True)
        r = subprocess.run([npx(), "remotion", "bundle", "src/index.ts", f"--public-dir={empty}", f"--out-dir={bundle}", "--log=error"],
                           cwd=EDITOR, stdout=log, stderr=subprocess.STDOUT, env=env)
        if r.returncode != 0:
            sys.exit("bundle falhou")
        open(stamp, "w", encoding="utf-8").write(bkey)
    bpub = os.path.join(bundle, "public")
    shutil.rmtree(bpub, ignore_errors=True)
    try:
        os.replace(pubdir, bpub)  # mesmo disco: instantâneo
    except OSError:
        shutil.copytree(pubdir, bpub)  # discos diferentes (outra máquina): copia como o Remotion fazia
    log.write(f"bundle {'reaproveitado' if same else 'novo'}\n")
    prog.mark("bundle")
    prog.set(0.85)
    q = subprocess.run([npx(), "remotion", "compositions", bundle, f"--props={props_file}", "--log=info"], cwd=EDITOR, capture_output=True, text=True, env=env,
                       encoding="utf-8", errors="ignore")
    prog.mark("compositions")
    # a tabela só sai com --log=info (com --log=error ela não aparece e o render caía aqui, 07/11)
    m = re.search(r"(?m)^" + re.escape(a.comp) + r"\s+\d+\s+\d+x\d+\s+(\d+)", q.stdout + "\n" + q.stderr)
    if m:
        total = int(m.group(1))
    elif doc.get("duration"):
        total = int(round(float(doc["duration"]) * fps))  # mesma conta da composição (duração do edit.json x qps)
        log.write(f"duração da composição pela edit.json: {total} quadros\n")
    else:
        sys.exit("não achei a duração da composição:\n" + q.stdout[-600:] + q.stderr[-600:])
    # teste: ZALE_RENDER_RANGE="150000-150299:150" renderiza só esse trecho, em blocos desse tamanho, num cache à parte
    workers, tabs = PARALLEL[a.mode]
    # bloco de no máx. 4 min; vídeo curto é dividido entre os Chromes (promo de 90 s = 3 blocos de 30 s)
    lo, hi, step = 0, total, max(300, min(CHUNK_FRAMES, -(-total // workers)))
    if os.environ.get("ZALE_RENDER_RANGE"):
        rg, _, st_ = os.environ["ZALE_RENDER_RANGE"].partition(":")
        lo, hi = (int(x) for x in rg.split("-"))
        hi += 1
        step = int(st_ or CHUNK_FRAMES)
        cache += "-teste"
        os.makedirs(cache, exist_ok=True)
    base = {k: v for k, v in doc.items() if k not in ("scenes", "sounds", "markers")}
    ch, nfiles = video_code_hash(a.slug)
    log.write(f"chave do código deste vídeo: {ch} ({nfiles} arquivos)\n")
    chunks = []
    for i, f0 in enumerate(range(lo, hi, step)):
        f1 = min(hi, f0 + step) - 1
        t0, t1 = f0 / fps, (f1 + 1) / fps
        sc = [x for x in doc["scenes"] if x.get("start", 0) < t1 + 1 and x.get("end", 1e9) > t0 - 1]
        so = [x for x in doc["sounds"] if x.get("start", 0) < t1 + 0.5 and x.get("start", 0) + (x.get("dur") or 120) > t0 - 0.5]
        key = hashlib.md5(_j.dumps({"b": base, "sc": sc, "so": so, "c": ch, "r": [f0, f1, total], "f": rflags, "v": 2}, sort_keys=True, ensure_ascii=False).encode()).hexdigest()[:12]
        chunks.append((i, f0, f1, os.path.join(cache, f"c{i:03d}-{key}.mkv")))
    keep = {os.path.basename(c[3]) for c in chunks}
    # blocos de versões antigas só saem quando o render novo TERMINA (10/11): antes saíam já no começo, e um render
    # que caía ou era cancelado levava junto os blocos que ainda serviriam se a mudança fosse desfeita
    ready = {c[0] for c in chunks if os.path.exists(c[3])}
    # plano real: só os blocos que faltam pesam na barra
    for i, f0, f1, _ in chunks:
        if i in ready:
            prog.drop(f"b{i}")
        else:
            prog.plan([(f"b{i}", frames_est(prog, f1 - f0 + 1))])
    for k in [k for k in prog.w if re.fullmatch(r"b\d+", k) and int(k[1:]) >= len(chunks)]:
        prog.drop(k)
    log.write(f"blocos: {len(chunks)} · já prontos no cache: {len(ready)}\n")
    prog.meas["prep"] = prog.time() - prog.t0
    prog.finish("prep")
    # vários Chromes ao mesmo tempo, cada um com um bloco (ver PARALLEL); a barra soma os quadros de todos
    import threading
    from concurrent.futures import ThreadPoolExecutor
    todo_ = [c for c in chunks if c[0] not in ready]
    need = sum(c[2] - c[1] + 1 for c in todo_)
    for c in todo_:
        prog.drop(f"b{c[0]}")
    fps_h = prog.hist.get("fps_par", prog.hist.get("fps", 10.0) * 1.6)
    prog.plan([("par", need / fps_h + prog.hist.get("chunk_over", 30.0) * -(-len(todo_) // workers))])
    log.write(f"Chromes em paralelo: {workers} x {tabs} abas\n")
    prog.start("par")
    lock = threading.Lock()
    got = {c[0]: 0 for c in todo_}
    fail = []
    t_par = prog.time()

    def job(c):
        i, f0, f1, path = c
        if fail:
            return
        tmp = path + ".tmp.mkv"
        code = render_chunk_proc([npx(), "remotion", "render", bundle, a.comp, tmp, f"--frames={f0}-{f1}", f"--props={props_file}",
                                  "--codec=h264", "--audio-codec=pcm-16", *rflags, "--gl=angle", f"--concurrency={tabs}",
                                  "--timeout=120000", "--log=info"], env, log, lock, got, i)
        if code != 0:
            fail.append(i)
            return
        os.replace(tmp, path)
        got[i] = f1 - f0 + 1
        with lock:
            prog.mark(f"bloco{i + 1}")

    with ThreadPoolExecutor(max_workers=workers) as ex:
        futs = [ex.submit(job, c) for c in todo_]
        while not all(f.done() for f in futs):
            prog.set(sum(got.values()) / max(1, need), f"{sum(c[2] - c[1] + 1 for c in chunks if c[0] in ready) + sum(got.values())}/{hi - lo}")
            import time as _t
            _t.sleep(1.0)
        for f in futs:
            f.result()
    if fail:
        prog.save()
        sys.exit(f"render falhou no bloco {min(fail) + 1}/{len(chunks)} (os blocos prontos ficaram guardados; clicar de novo retoma daqui)")
    if need > 1500:
        prog.meas["fps_par"] = need / max(1.0, prog.time() - t_par)  # velocidade real com os Chromes juntos
    prog.finish("par")
    for fn_ in os.listdir(cache):
        if fn_.endswith(".mkv") and fn_ not in keep:
            try:
                os.remove(os.path.join(cache, fn_))
            except OSError:
                pass
    lst = os.path.join(cache, "list.txt")
    with open(lst, "w", encoding="utf-8") as fh:
        for c in chunks:
            fh.write("file '" + c[3].replace("\\", "/") + "'\n")
    return lst, [c[3] for c in chunks], (hi - lo) / fps


def safe_name(s, default):
    s = re.sub(r'[<>:"/\\|?*\x00-\x1f]', "", (s or "").strip())
    s = re.sub(r"\s+", " ", s)
    s = re.sub(r"\.mp4$", "", s, flags=re.I).strip(" .")[:90]
    return s or default


def main():
    import json as _j
    import shutil
    import threading
    ap = argparse.ArgumentParser()
    ap.add_argument("slug")
    ap.add_argument("comp")
    ap.add_argument("--no-qa", action="store_true")
    ap.add_argument("--name", default="", help="nome do arquivo final (sem .mp4)")
    ap.add_argument("--mode", default="baixa", choices=sorted(MODES), help="alta = não vou usar o PC · baixa = vou usar o PC")
    ap.add_argument("--res", default="1080", choices=sorted(RES), help="1080 = Full HD · 4k = 3840x2160 desenhado em 4K")
    a = ap.parse_args()
    rflags = render_flags(a.res)
    out = os.path.join(EDITOR, "out", a.slug)
    os.makedirs(out, exist_ok=True)
    stop = threading.Event()
    threading.Thread(target=set_priority_loop, args=(a.mode, stop), daemon=True).start()
    conc = MODES[a.mode][1]
    # temporários do Remotion/Chrome (inclusive a cópia da pasta public, vários GB num vídeo longo) e o bruto na pasta
    # TEMP_BASE (na máquina do Paulo, D:/tmp_zale), que tem espaço e não é limpa pelas conferências de quadros
    # (estills limpa out/.tmp)
    env = dict(os.environ)
    rawdir = out
    if TEMP_BASE:
        rawdir = rtmp = os.path.join(TEMP_BASE, "rtmp")
        os.makedirs(rtmp, exist_ok=True)
        env["TEMP"] = env["TMP"] = rtmp
    # bruto em MKV com áudio PCM (sem perda): a voz e os efeitos só viram AAC uma vez, no arquivo final
    raw = os.path.join(rawdir, f"raw-{os.getpid()}.mkv")  # um por render: dois renders ao mesmo tempo não colidem
    log = open(os.path.join(out, "render.log"), "w", encoding="utf-8")
    log.write(f"modo: {a.mode} (prioridade {MODES[a.mode][0]}, núcleos {conc})\n")
    log.write(f"resolução: {a.res} ({' '.join(rflags)})\n")
    prog = Progress(log, out, RES[a.res]["tag"])
    extra = []
    # Vídeo montado pelo edit.json: monta antes o vídeo contínuo do apresentador (takes colados,
    # 1080 do master com lanczos, voz tratada) e o render lê esse arquivo em sequência.
    # Medido no piloto: 5,7 -> 15,8 quadros/s (junto com --gl=angle, que desenha na placa de vídeo).
    edit_json = os.path.join(EDITOR, "src", "videos", a.slug, "edit.json")
    props_file = None
    doc = {}
    if os.path.exists(edit_json):
        doc = _j.load(open(edit_json, encoding="utf-8"))
    vdur = float(doc.get("duration") or 60)
    nfr = int(round(vdur * doc.get("fps", 30)))
    # em blocos (com vários Chromes) todo vídeo montado pelo edit.json com mais de 40 s; antes só os de 10 min ou mais
    long_ = a.comp.endswith("Edit") and vdur > 40
    fin_est = prog.hist.get("fin_base", 20.0) + vdur * prog.hist.get("fin_rate", 0.03)
    # plano inicial (os blocos entram com o tamanho certo depois que se sabe quais já estão no cache)
    prog.plan([("prep", prog.hist.get("prep", 240.0 if long_ else 60.0)),
               ("frames", 0 if long_ else frames_est(prog, nfr)),
               ("fin", fin_est)])
    if long_:
        prog.drop("frames")
        prog.plan([(f"b{i}", frames_est(prog, min(CHUNK_FRAMES, nfr - f0))) for i, f0 in enumerate(range(0, nfr, CHUNK_FRAMES))])
    prog.start("prep")
    t_prep = prog.time()
    if a.comp.endswith("Edit") and doc:
        cut = subprocess.run([sys.executable, os.path.join(EDITOR, "tools", "cutvideo.py"), a.slug], capture_output=True, text=True)
        prog.mark("cutvideo")
        prog.set(0.45)
        if cut.returncode == 0 and cut.stdout.strip():
            doc["video"]["cut"] = cut.stdout.strip().splitlines()[-1]
            props_file = os.path.join(out, f"_props_{os.getpid()}.json")
            _j.dump({"doc": doc}, open(props_file, "w", encoding="utf-8"), ensure_ascii=False)
            extra.append(f"--props={props_file}")
            extra.append(f"--public-dir={slim_public(a.slug, doc)}")
            prog.mark("public")
            prog.set(0.6)
    src_in = ["-i", raw]
    chunk_files = []
    if props_file and long_:
        # vídeo longo (HL3, ~2 h): em blocos com cache (ver render_chunked)
        lst, chunk_files, vdur = render_chunked(a, doc, props_file, extra[-1].split("=", 1)[1], env, log, out, prog, conc, rflags)
        os.remove(props_file)
        src_in = ["-f", "concat", "-safe", "0", "-i", lst]
        raw = None
    else:
        prog.meas["prep"] = prog.time() - t_prep
        prog.finish("prep")
        prog.start("frames")
        code, t_frames, t_all, got = run_remotion(
            [npx(), "remotion", "render", "src/index.ts", a.comp, raw, "--codec=h264", "--audio-codec=pcm-16", *rflags,
             "--gl=angle", f"--concurrency={conc}", "--timeout=120000", "--log=info", *extra], nfr, prog, env)
        if props_file and os.path.exists(props_file):
            os.remove(props_file)
        if code != 0:
            log.close()
            stop.set()
            tail = open(os.path.join(out, "render.log"), encoding="utf-8", errors="ignore").read().splitlines()[-15:]
            sys.exit("render falhou:\n" + "\n".join(l for l in tail if not l.startswith("PROGRESSO")))
        if t_frames:
            prog.meas["fps"] = got / t_frames
        prog.finish("frames")
    # tempo da preparação dos blocos (cutvideo + public + bundle) fica medido para a próxima barra
    name = safe_name(a.name, f"{a.slug}-{a.comp.lower()}")
    final = os.path.join(out, f"{name}.mp4")
    # espaço: o final tem quase o tamanho dos blocos (vídeo copiado); sem espaço, para aqui com os blocos guardados
    need = sum(os.path.getsize(f) for f in chunk_files if os.path.exists(f)) if chunk_files else (os.path.getsize(raw) if raw and os.path.exists(raw) else 0)
    free = shutil.disk_usage(out).free
    if need and free < need * 1.03 + 2e9 and TEMP_BASE:
        # o F: vive quase cheio e um 4K de 2 h passa de 30 GB: o final vai para o disco dos temporários (D:)
        alt = os.path.join(TEMP_BASE, "renders", a.slug)
        os.makedirs(alt, exist_ok=True)
        if shutil.disk_usage(alt).free >= need * 1.03 + 2e9:
            log.write(f"sem espaço no disco do projeto: o vídeo final vai para {alt}\n")
            final = os.path.join(alt, f"{name}.mp4")
            free = shutil.disk_usage(alt).free
    if need and free < need * 1.03 + 2e9:
        prog.save()
        log.close()
        stop.set()
        sys.exit(f"sem espaço no disco do projeto para o vídeo final: precisa de ~{need / 1e9:.0f} GB, tem {free / 1e9:.0f} GB livres "
                 f"(os blocos ficaram guardados; liberando espaço e clicando de novo ele só junta)")
    prog.start("fin")
    t_fin = prog.time()
    # volume em duas passadas (mede e aplica um ganho fixo, como a voz): a passada única do loudnorm é dinâmica e,
    # num vídeo longo, vai mexendo no volume ao longo do tempo. A medida lê só o áudio (rápida); a gravação copia o vídeo.
    af = "loudnorm=I=-16:TP=-1.5:LRA=11"
    meas_w = 0.15  # sub-etapas da fatia "fin": medida ~15%, gravação ~85%

    class _Part:
        def __init__(self, a0, a1):
            self.a0, self.a1 = a0, a1

        def set(self, f, frames=None):
            prog.set(self.a0 + (self.a1 - self.a0) * min(1.0, f))
    prog.mark("antes-volume")
    _, meas = ffmpeg_progress([*src_in, "-vn", "-af", af + ":print_format=json", "-f", "null", "-"], vdur, _Part(0, meas_w))
    try:
        js = _j.loads(meas[meas.rindex("{"):meas.rindex("}") + 1])
        af += (f":measured_I={js['input_i']}:measured_TP={js['input_tp']}:measured_LRA={js['input_lra']}"
               f":measured_thresh={js['input_thresh']}:offset={js['target_offset']}:linear=true")
    except (ValueError, KeyError):
        pass
    prog.mark("medida-volume")
    tmp_final = final + ".tmp.mp4"
    code, err = ffmpeg_progress(["-v", "error", "-y", *src_in, "-c:v", "copy", "-af", af,
                                 "-ar", "48000", "-c:a", "aac", "-b:a", "320k", "-movflags", "+faststart", tmp_final], vdur, _Part(meas_w, 1.0))
    if code != 0:
        prog.save()
        log.close()
        stop.set()
        sys.exit("falhou ao gravar o vídeo final: " + err[-400:])
    os.replace(tmp_final, final)
    prog.meas["fin_rate"] = max(0.001, (prog.time() - t_fin - 20.0) / max(vdur, 1))
    prog.finish("fin")
    prog.log.write("PROGRESSO 100.0 eta=0\n")
    prog.save()
    log.close()
    stop.set()
    # o Estúdio lista os vídeos prontos por esta lista (o nome agora é livre)
    reg = os.path.join(out, "_renders.json")
    if os.environ.get("ZALE_RENDER_RANGE"):
        reg = os.path.join(out, "_renders_teste.json")  # trecho de teste não aparece como "Pronto" no Estúdio
    try:
        names = _j.load(open(reg, encoding="utf-8"))
    except (OSError, ValueError):
        names = []
    names = [n for n in names if n != os.path.basename(final)] + [os.path.basename(final)]
    _j.dump(names[-50:], open(reg, "w", encoding="utf-8"), ensure_ascii=False)
    if raw:
        os.remove(raw)
    if a.no_qa:
        rel = os.path.relpath(final, EDITOR).replace("\\", "/")
        print(f"-> {rel if not rel.startswith('..') else final.replace(chr(92), '/')}")
        return
    subprocess.run([ffmpeg(), "-v", "error", "-y", "-i", final, "-vf", "scale=720:1280", "-c:v", "libx264", "-crf", "26",
                    "-preset", "fast", "-ar", "48000", "-c:a", "aac", "-b:a", "128k", os.path.join(out, f"{name}-preview.mp4")], check=True)
    subprocess.run([ffmpeg(), "-v", "error", "-y", "-i", final, "-vf", "fps=1/4,scale=180:-1,tile=6x3:padding=4:color=white",
                    "-frames:v", "1", os.path.join(out, f"{name}-sheet.png")], check=True)
    dur = float(subprocess.run([ffprobe(), "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", final],
                               capture_output=True, text=True).stdout.strip())
    sd = subprocess.run([ffmpeg(), "-hide_banner", "-i", final, "-af", "silencedetect=noise=-35dB:d=0.8", "-f", "null", "-"],
                        capture_output=True, text=True).stderr
    sil = re.findall(r"silence_start: ([\d.]+)[\s\S]*?silence_duration: ([\d.]+)", sd)
    sil = [(float(s), float(d)) for s, d in sil if float(s) < dur - 3.5]  # ignora o outro
    print(f"-> out/{a.slug}/{name}.mp4  ({dur:.1f}s)  + {name}-preview.mp4 + {name}-sheet.png")
    print("silêncios > 0.8 s na fala: " + (", ".join(f"{s:.1f}s ({d:.1f}s)" for s, d in sil) if sil else "nenhum"))
    # PICOS DE EFEITO (regra do usuário: perceptível, sem pico). Renderiza um áudio
    # só com os efeitos (voz desligada) e compara cada efeito com a voz.
    sfx = os.path.join(out, "sfx-only.wav")
    import json as _json
    # props por ARQUIVO: no Windows as aspas de um JSON na linha de comando se perdem pelo npx.cmd
    props = os.path.join(out, "_props_mute.json")
    _json.dump({"muteVoice": True}, open(props, "w", encoding="utf-8"))
    subprocess.run([npx(), "remotion", "render", "src/index.ts", a.comp, sfx, "--codec=wav", "--log=error",
                    f"--props={props}"], cwd=EDITOR, capture_output=True)
    os.remove(props)
    if os.path.exists(sfx):
        def mom(path):
            eb = subprocess.run([ffmpeg(), "-hide_banner", "-nostats", "-i", path, "-af", "ebur128", "-f", "null", "-"],
                                capture_output=True, text=True, encoding="utf-8", errors="ignore").stderr
            vals = [(float(t_), float(m_)) for t_, m_ in re.findall(r"t:\s*([\d.]+)\s+.*?M:\s*(-?[\d.]+)", eb)]
            integ = re.findall(r"I:\s*(-?[\d.]+) LUFS", eb)
            return vals, float(integ[-1]) if integ else None
        _, voice_i = mom(final)
        vals, _ = mom(sfx)
        loud = [(t_, m_) for t_, m_ in vals if voice_i is not None and m_ > voice_i - 8]
        grouped = []
        for t_, m_ in loud:
            if grouped and t_ - grouped[-1][0] < 1.0:
                grouped[-1] = (grouped[-1][0], max(grouped[-1][1], m_))
            else:
                grouped.append((t_, m_))
        top = max((m_ for _, m_ in vals), default=-99)
        print(f"efeitos: mais alto {top - voice_i:+.1f} LU em relação à voz (alvo: entre -18 e -8; impacto de carimbo perto de -14)")
        print("efeitos altos demais (> voz - 8 LU): " + (", ".join(f"{t_ - 0.4:.1f}s ({m_ - voice_i:+.1f})" for t_, m_ in grouped) if grouped else "nenhum"))
        os.remove(sfx)


if __name__ == "__main__":
    main()
