#!/usr/bin/env python3
"""Converte a gravação do celular (vertical) em 1080x1920, 30 fps, H.264,
fácil de navegar no Remotion. Mantém o áudio (lapela).

    prep.py <bruto.mov|mp4> <slug> [--viral <video_viral.mp4>]

Saída: <EDITOR>/public/videos/<slug>/ig1080.mp4 (e viral1080.mp4, se houver).
Usa a GPU (h264_nvenc) e cai para libx264 se ela falhar.
"""
import argparse
import json
import os
import subprocess
import sys

sys.path.insert(0, os.path.dirname(__file__))
from _env import EDITOR, ffmpeg, ffprobe  # noqa: E402

VF = "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30,setsar=1"


def probe(src):
    out = subprocess.run([ffprobe(), "-v", "error", "-show_entries", "format=duration:stream=codec_type,width,height,r_frame_rate",
                          "-of", "json", src], capture_output=True, text=True, check=True).stdout
    d = json.loads(out)
    v = next((s for s in d["streams"] if s.get("codec_type") == "video"), {})
    a = any(s.get("codec_type") == "audio" for s in d["streams"])
    return float(d["format"]["duration"]), v.get("width"), v.get("height"), v.get("r_frame_rate"), a


def encode(src, dst, keep_audio=True):
    base = [ffmpeg(), "-v", "error", "-y", "-i", src, "-vf", VF, "-pix_fmt", "yuv420p"]
    audio = ["-c:a", "aac", "-b:a", "192k"] if keep_audio else ["-an"]
    for venc in (["-c:v", "h264_nvenc", "-preset", "p5", "-b:v", "12M"], ["-c:v", "libx264", "-preset", "fast", "-crf", "18"]):
        r = subprocess.run(base + venc + audio + ["-movflags", "+faststart", dst])
        if r.returncode == 0:
            return venc[1]
    sys.exit(f"falha ao converter {src}")


def encode_master(src, dst, w, h):
    """Cópia mestre na resolução da gravação (9:16, até 2160x3840), qualidade quase sem perda.
    O render usa esta (o Chrome reduz para 1080 com mais nitidez); ig1080 fica para
    transcrição, onda e prévia do Estúdio."""
    mw = min(2160, (int(w or 1080) // 2) * 2)
    mw = max(mw, 1080)
    mh = mw * 16 // 9
    vf = f"scale={mw}:{mh}:force_original_aspect_ratio=increase,crop={mw}:{mh},fps=30,setsar=1"
    base = [ffmpeg(), "-v", "error", "-y", "-i", src, "-vf", vf, "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "256k"]
    for venc in (["-c:v", "h264_nvenc", "-preset", "p7", "-rc", "vbr", "-cq", "16", "-b:v", "0", "-maxrate", "60M"], ["-c:v", "libx264", "-preset", "medium", "-crf", "14"]):
        r = subprocess.run(base + venc + ["-movflags", "+faststart", dst])
        if r.returncode == 0:
            return f"{mw}x{mh} {venc[1]}"
    return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("slug")
    ap.add_argument("--viral", help="vídeo de referência para tela dividida/react")
    a = ap.parse_args()
    out = os.path.join(EDITOR, "public", "videos", a.slug)
    os.makedirs(out, exist_ok=True)
    dur, w, h, fr, has_a = probe(a.src)
    print(f"bruto: {dur:.1f}s {w}x{h} {fr} áudio={'sim' if has_a else 'NÃO'}")
    enc = encode(a.src, os.path.join(out, "ig1080.mp4"))
    print(f"-> public/videos/{a.slug}/ig1080.mp4 ({enc})")
    if w and int(w) > 1080:
        m = encode_master(a.src, os.path.join(out, "master.mp4"), w, h)
        if m:
            print(f"-> public/videos/{a.slug}/master.mp4 ({m}) · use no edit.json video.src")
    if a.viral:
        enc = encode(a.viral, os.path.join(out, "viral1080.mp4"))
        print(f"-> public/videos/{a.slug}/viral1080.mp4 ({enc})")


if __name__ == "__main__":
    main()
