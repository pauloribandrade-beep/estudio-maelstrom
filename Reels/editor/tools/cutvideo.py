# Monta o vídeo contínuo do apresentador para o RENDER: os takes já colados, em 1080x1920
# reduzido do master com lanczos (nítido), com a voz (tratada, se houver) e fades curtos em
# cada corte (8 ms, igual à prévia: 66 ms comia o fim das palavras). O render lê este arquivo em sequência (bem mais rápido que pular de take em take).
# Uso: python tools/cutvideo.py <slug>   -> imprime o caminho relativo a public/ (cacheado por hash)
import hashlib, json, os, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VENCS = (["-c:v", "h264_nvenc", "-preset", "p5", "-rc", "vbr", "-cq", "14", "-b:v", "0", "-maxrate", "40M"], ["-c:v", "libx264", "-preset", "fast", "-crf", "12"])


def build_chunked(slug, segs, fps, outro, src, voice, out_mp4, h):
    """Mesmo resultado do filtro único, em blocos de ~100 cortes. Cada bloco: busca rápida (-ss antes do -i, que no
    ffmpeg recodificando é exata) até 2 s antes do primeiro corte dele, cortes relativos a esse ponto, vídeo H.264
    (mesmos parâmetros em todos os blocos) e voz em PCM (sem perda, emenda exata). Depois o concat cola os blocos com o
    vídeo copiado e codifica a voz uma vez só. Confere o total de quadros no fim."""
    import shutil
    base = next((d + "/cutchunks" for d in ("D:/tmp_zale", "E:/tmp_zale") if os.path.isdir(d)), os.path.join(ROOT, "out", ".cutchunks"))  # D: = SSD com espaço (06/11)
    work = os.path.join(base, f"{slug}-{h}")
    os.makedirs(work, exist_ok=True)
    groups, cur, size = [], [], 0
    for g in segs:
        cur.append(g)
        size += 230
        if size > 20000:
            groups.append(cur)
            cur, size = [], 0
    if cur:
        groups.append(cur)
    files = []
    vend = float(subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=duration", "-of", "csv=p=0", src], capture_output=True, text=True).stdout.strip() or 1e9)
    for gi, grp in enumerate(groups):
        part = os.path.join(work, f"part{gi:03d}.mkv")
        files.append(part)
        durs = [(g.get("frames") or round((g["b"] - g["a"]) * fps)) for g in grp]
        if os.path.exists(part) and os.path.getsize(part) > 0:
            continue  # bloco já pronto (retoma de onde parou)
        S = max(0.0, min(g["a"] for g in grp) - 2.0)
        E = max(g["a"] + n / fps for g, n in zip(grp, durs)) + 1.0
        ins = ["-ss", f"{S:.6f}", "-t", f"{E - S:.6f}", "-i", src]
        a_in = "0:a"
        if voice:
            ins += ["-ss", f"{S:.6f}", "-t", f"{E - S:.6f}", "-i", voice]
            a_in = "1:a"
        parts = []
        # 07/11: a imagem do vídeo-fonte pode acabar antes da voz (a despedida foi emendada só no áudio): aí o bloco
        # perdia os quadros finais e a conferência reprovava o corte. Quando o bloco passa do fim da imagem, o último
        # quadro fica parado até cobrir (as cenas tapam a tela inteira nesse trecho).
        vsrc = "0:v"
        if E > vend - 0.05:
            parts.append(f"[0:v]tpad=stop_mode=clone:stop_duration={E - vend + 2:.3f},split={len(grp)}" + "".join(f"[vs{i}]" for i in range(len(grp))))
        for i, (g, n) in enumerate(zip(grp, durs)):
            d = n / fps
            st = g["a"] - S
            vin = f"vs{i}" if E > vend - 0.05 else vsrc
            parts.append(f"[{vin}]trim=start={st:.6f}:duration={d:.6f},setpts=PTS-STARTPTS[v{i}]")
            parts.append(f"[{a_in}]atrim=start={st:.6f}:duration={d:.6f},asetpts=PTS-STARTPTS,afade=t=in:d=0.008,afade=t=out:st={max(0, d - 0.008):.4f}:d=0.008[a{i}]")
        cat = "".join(f"[v{i}][a{i}]" for i in range(len(grp))) + f"concat=n={len(grp)}:v=1:a=1[vc][ac]"
        last = gi == len(groups) - 1
        tail = (
            "[vc]scale=1080:1920:force_original_aspect_ratio=increase:flags=lanczos,crop=1080:1920,"
            + (f"tpad=stop_mode=clone:stop_duration={outro}," if last else "")
            + "setsar=1[vo];"
            + (f"[ac]apad=pad_dur={outro}[ao]" if last else "[ac]anull[ao]")
        )
        fc = ";".join(parts + [cat, tail])
        tmp = part + ".tmp.mkv"
        for venc in VENCS:
            r = subprocess.run(["ffmpeg", "-v", "error", "-y", *ins, "-filter_complex", fc, "-map", "[vo]", "-map", "[ao]", "-r", str(fps), *venc, "-g", "30", "-pix_fmt", "yuv420p", "-c:a", "pcm_s16le", "-ar", "48000", "-ac", "2", tmp])
            if r.returncode == 0:
                break
        else:
            sys.exit(f"falha ao montar o bloco {gi}")
        os.replace(tmp, part)
        print(f"bloco {gi + 1}/{len(groups)}", file=sys.stderr, flush=True)
    lst = os.path.join(work, "list.txt")
    with open(lst, "w", encoding="utf-8") as fh:
        for p in files:
            fh.write("file '" + p.replace("\\", "/") + "'\n")
    r = subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", lst, "-c:v", "copy", "-c:a", "aac", "-b:a", "320k", "-ar", "48000", "-movflags", "+faststart", out_mp4])
    if r.returncode != 0:
        sys.exit("falha ao colar os blocos")
    want = sum((g.get("frames") or round((g["b"] - g["a"]) * fps)) for g in segs) + round(outro * fps)
    got = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-count_packets", "-show_entries", "stream=nb_read_packets", "-of", "csv=p=0", out_mp4], capture_output=True, text=True).stdout.strip()
    if not got.isdigit() or abs(int(got) - want) > 2:
        sys.exit(f"vídeo contínuo com {got} quadros, esperava {want}")
    shutil.rmtree(work, ignore_errors=True)


def build(slug):
    vd = os.path.join(ROOT, "src", "videos", slug)
    spec = json.load(open(os.path.join(vd, "segments.json"), encoding="utf-8"))
    doc = json.load(open(os.path.join(vd, "edit.json"), encoding="utf-8"))
    fps = spec.get("fps", 30)
    src_rel = doc["video"]["src"]
    voice_rel = (doc.get("voice") or {}).get("src") or ""
    segs = spec["segments"]
    key = json.dumps({"s": [[g["a"], g.get("frames") or round((g["b"] - g["a"]) * fps)] for g in segs], "o": spec["outro"], "src": src_rel, "voice": voice_rel, "v": 2})
    h = hashlib.md5(key.encode()).hexdigest()[:10]
    rel = f"videos/{slug}/cut-{h}.mp4"
    dst = os.path.join(ROOT, "public", rel)
    if os.path.exists(dst):
        return rel
    inputs = ["-i", os.path.join(ROOT, "public", src_rel)]
    a_in = "0:a"
    if voice_rel:
        inputs += ["-i", os.path.join(ROOT, "public", voice_rel)]
        a_in = "1:a"
    parts = []
    for i, g in enumerate(segs):
        d = (g.get("frames") or round((g["b"] - g["a"]) * fps)) / fps
        parts.append(f"[0:v]trim=start={g['a']}:duration={d},setpts=PTS-STARTPTS[v{i}]")
        parts.append(f"[{a_in}]atrim=start={g['a']}:duration={d},asetpts=PTS-STARTPTS,afade=t=in:d=0.008,afade=t=out:st={max(0, d - 0.008):.4f}:d=0.008[a{i}]")
    cat = "".join(f"[v{i}][a{i}]" for i in range(len(segs))) + f"concat=n={len(segs)}:v=1:a=1[vc][ac]"
    tail = (
        f"[vc]scale=1080:1920:force_original_aspect_ratio=increase:flags=lanczos,crop=1080:1920,"
        f"tpad=stop_mode=clone:stop_duration={spec['outro']},setsar=1[vo];[ac]apad=pad_dur={spec['outro']}[ao]"
    )
    tmp = dst + ".tmp.mp4"
    fc = ";".join(parts + [cat, tail])
    if len(fc) > 24000:
        # vídeo longo (HL3: 3466 cortes = filtro de 686 mil caracteres): a linha de comando do Windows aceita 32 mil.
        # Monta em blocos (cada um com busca rápida até o trecho dele), depois cola os blocos sem recodificar o vídeo.
        build_chunked(slug, segs, fps, spec["outro"], os.path.join(ROOT, "public", src_rel), os.path.join(ROOT, "public", voice_rel) if voice_rel else "", tmp, h)
    else:
        for venc in VENCS:
            r = subprocess.run(["ffmpeg", "-v", "error", "-y", *inputs, "-filter_complex", fc, "-map", "[vo]", "-map", "[ao]", "-r", str(fps), *venc, "-g", "30", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "256k", "-movflags", "+faststart", tmp])
            if r.returncode == 0:
                break
        else:
            sys.exit("falha ao montar o vídeo contínuo")
    os.replace(tmp, dst)
    # guarda só as 2 versões mais recentes
    vdir = os.path.dirname(dst)
    olds = sorted((f for f in os.listdir(vdir) if f.startswith("cut-") and f.endswith(".mp4")), key=lambda f: os.path.getmtime(os.path.join(vdir, f)), reverse=True)
    for f in olds[2:]:
        os.remove(os.path.join(vdir, f))
    return rel


if __name__ == "__main__":
    print(build(sys.argv[1]))
