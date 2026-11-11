#!/usr/bin/env python3
"""Pausa, continua ou encerra um render em andamento (botões do Estúdio).

    render_pause.py <pid do render.py> pause|resume|kill [slug]

Congela o render.py e TUDO que ele abriu (node do Remotion, Chromes, ffmpeg, compositor) no ponto em que estão:
nada se perde e o processador fica livre. Continuar retoma do mesmo quadro.

09/11 (o pause "não parava nada"): além da árvore de processos do render.py, entram os processos que se soltaram
dela (o Chrome e o compositor do Remotion podem ficar órfãos quando um intermediário, como o npx/cmd, termina) —
achados pela linha de comando, que cita a pasta do bundle/cache deste vídeo — e tudo que eles abriram.
Sai com código 2 se não achou nenhum processo (o Estúdio avisa em vez de fingir que pausou).
"""
import json
import sys

import psutil


def collect(pid, slug):
    seeds = {}
    try:
        root = psutil.Process(pid)
        seeds[root.pid] = root
    except psutil.Error:
        root = None
    marks = []
    if slug:
        marks = [f".bundle\{slug}", f".bundle/{slug}", f"rcache\{slug}", f"rcache/{slug}", f"render.py {slug}", f"render.py\" {slug}"]
    if marks:
        for p in psutil.process_iter(["pid", "name", "cmdline"]):
            try:
                cl = " ".join(p.info["cmdline"] or [])
                nm = (p.info["name"] or "").lower()
            except (psutil.Error, OSError):
                continue
            # só programas do render (nunca um terminal ou editor que por acaso cite a pasta)
            if not nm.startswith(("python", "node", "chrome", "ffmpeg", "ffprobe", "remotion", "compositor")):
                continue
            if any(m in cl for m in marks) and "render_pause.py" not in cl:
                seeds[p.pid] = p
    allp = dict(seeds)
    for p in list(seeds.values()):
        try:
            for c in p.children(recursive=True):
                allp[c.pid] = c
        except psutil.Error:
            pass
    # ordem: quem abre processos primeiro (pais antes dos filhos)
    def depth(p):
        d = 0
        try:
            q = p.parent()
            while q is not None and q.pid in allp and d < 50:
                d += 1
                q = q.parent()
        except psutil.Error:
            pass
        return d
    return sorted(allp.values(), key=depth)


def main():
    pid, what = int(sys.argv[1]), sys.argv[2]
    slug = sys.argv[3] if len(sys.argv) > 3 else ""
    procs = collect(pid, slug)
    if what == "resume":
        procs.reverse()  # continua de baixo para cima
    ok = []
    for p in procs:
        try:
            if what == "pause":
                p.suspend()
            elif what == "resume":
                p.resume()
            else:
                try:
                    p.resume()  # processo congelado não morre direito no Windows
                except psutil.Error:
                    pass
                p.kill()
            ok.append(f"{p.pid}:{p.name()}" if what != "kill" else str(p.pid))
        except (psutil.Error, OSError):
            pass
    print(json.dumps({"n": len(ok), "procs": ok}))
    if not ok and what != "kill":
        sys.exit(2)


if __name__ == "__main__":
    main()
