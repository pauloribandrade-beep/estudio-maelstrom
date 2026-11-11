#!/usr/bin/env python3
"""Monta a biblioteca de sons do editor em public/sfx/ a partir de sfx-lib/.

    build_sfx.py

Cada FAMÍLIA tem várias versões (<familia>_<n>.wav) e o componente <Snd>
alterna entre elas, para o vídeo não repetir o mesmo som. Todos são
cortados, com fade de saída, e nivelados (-18 LUFS). `type_*` são trechos
contínuos de teclado mecânico e `write_*` são caneta no papel (gerados aqui),
tocados com a duração exata do texto aparecendo.
Fontes: Kenney (CC0) e Social SFX Pack - Collection 1 (licença a confirmar com
o usuário; ver public/sfx/LICENSE-sfx.txt).
"""
import json
import os
import subprocess
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(__file__))
from _env import EDITOR, ffmpeg, ffprobe  # noqa: E402

LIB = os.path.join(EDITOR, "sfx-lib")
OUT = os.path.join(EDITOR, "public", "sfx")
SOC = os.path.join(LIB, "social-sfx-1", "Social SFX Pack - Collection 1")
K_IF = os.path.join(LIB, "interface-sounds", "Audio")
K_IM = os.path.join(LIB, "impact-sounds", "Audio")

MIX = os.path.join(LIB, "mixkit")
SON = os.path.join(LIB, "sonniss-gdc2026", "x")

# família -> lista de (arquivo, início s, duração s). Curadoria v2 (27/09/2026):
# Sonniss (estúdio, royalty-free) + Mixkit (licença livre comercial) + os poucos
# aprovados antes. "9" na duração = arquivo inteiro, com a cauda natural.
# Caminhos do Sonniss aceitam * (os nomes têm um sufixo de hash).
FAM = {
    # (Interface_Pop_High_Short saiu: o usuário achou "som de Looney Tunes")
    "pop": [(f"{SON}/Cinematic_Sound_Design_Interface_Infogra/Interface_Percussion_Snap_*", 0, 9),
            (f"{SON}/Cinematic_Sound_Design_Interface_Infogra/Interface_Accept_Glassy_Snap_*", 0, 9),
            (f"{MIX}/2356.wav", 0, 9), (f"{MIX}/2358.wav", 0, 9), (f"{MIX}/2357.wav", 0, 9),
            (f"{MIX}/1124.wav", 0, 9), (f"{MIX}/2364.wav", 0, 9)],
    "tick": [(f"{MIX}/2568.wav", 0, 9), (f"{MIX}/2573.wav", 0, 9), (f"{MIX}/2580.wav", 0, 9), (f"{MIX}/1109.wav", 0, 9),
             (f"{MIX}/1120.wav", 0, 9), (f"{MIX}/1127.wav", 0, 9)],
    "tap": [(f"{K_IF}/tick_002.ogg", 0, 0.2), (f"{MIX}/2585.wav", 0, 9)],
    "click": [(f"{MIX}/2577.wav", 0, 9), (f"{MIX}/1125.wav", 0, 9), (f"{MIX}/1113.wav", 0, 9),
              (f"{SOC}/Mechanical/CLOCK-STOPWATCH-STRT-CLICK.wav", 0, 0.45)],
    "ding": [(f"{MIX}/2867.wav", 0, 9), (f"{MIX}/2870.wav", 0, 9), (f"{MIX}/911.wav", 0, 9),
             (f"{SON}/Cinematic_Sound_Design_User_Interface/Interface_Plucks_Happy_*", 0, 9)],
    "error": [(f"{MIX}/2569.wav", 0, 9), (f"{MIX}/1110.wav", 0, 9),
              (f"{SON}/Cinematic_Sound_Design_UI_Interaction_El/Deny_Muted_*", 0, 9),
              (f"{SON}/Cinematic_Sound_Design_System_UI_Feedbac/Interface_Deny_Low_Fat_Dark_*", 0, 9)],
    # carimbo: o impacto cinematográfico APROVADO pelo usuário (volume em SFX_VOL.thud)
    "thud": [(f"{SOC}/Impacts/Cinematic Impact.wav", 0, 9)],
    "glass": [(f"{MIX}/3060.wav", 0, 9), (f"{MIX}/2649.wav", 0, 9)],
    "switch": [(f"{K_IF}/switch_002.ogg", 0, 0.4), (f"{SON}/Cinematic_Sound_Design_Ultra_Transitions/Woosh_Sweep_Slide_Infographics_Basic_*", 0, 9)],
    "paper": [(f"{SON}/Cinematic_Sound_Design_Paper_Foley/Encyclopedia_Glossy_Page_Turn_Muted_*", 0, 9),
              (f"{SON}/Cinematic_Sound_Design_Paper_Foley/A4_Printing_Paper_Rattle_Page_Turn_Tail_*", 0, 9),
              (f"{MIX}/1530.wav", 0, 9), (f"{MIX}/1104.wav", 0, 9)],
    "riser": [(f"{SOC}/Risers/Cinematic Riser 1.wav", 0.7, 2.0)],
    "drop": [(f"{SON}/Cinematic_Sound_Design_Ultra_Transitions/Impact_Hit_Rapid_Chord_Reverb_*", 0, 9),
             (f"{SON}/Cinematic_Sound_Design_Colossal_Impacts/Impact_Cut_Sweep_*", 0, 9), (f"{MIX}/2900.wav", 0, 9)],
    "whoosh": [(f"{SON}/Cinematic_Sound_Design_Ultra_Transitions/Woosh_Sweep_Slide_Infographics_Basic_*", 0, 9)],
    "type": [(f"{MIX}/1396.wav", 0, 9), (f"{MIX}/2532.wav", 0, 9), (f"{MIX}/1391.wav", 0, 9), (f"{MIX}/1386.wav", 0, 9)],
    "write": [(f"{MIX}/2367.wav", 0, 9), (f"{MIX}/2376.wav", 0, 9), (f"{MIX}/3011.wav", 0, 9), (f"{MIX}/3194.wav", 0, 9), (f"{MIX}/3196.wav", 0, 9)],
}

def resolve(path):
    """Aceita o caminho com qualquer extensão de áudio (o pacote mistura wav/mp3/flac)."""
    import glob as _g
    if "*" in path:
        hits = sorted(_g.glob(path))
        return hits[0] if hits else (print(f"  falta: {os.path.basename(path)}") or None)
    if os.path.exists(path) and os.path.getsize(path) > 1000:
        return path
    base = os.path.splitext(path)[0]
    for ext in (".wav", ".mp3", ".flac", ".ogg"):
        if os.path.exists(base + ext):
            return base + ext
    print(f"  falta: {os.path.basename(path)}")
    return None


def cut(src, start, dur, dst):
    """Corta [start, start+dur]. Se o arquivo acaba antes (dur "9" = inteiro), a
    cauda natural (reverb) é mantida sem fade. Se o corte cai no meio do som,
    fade longo (até 0,35 s) para a cauda não morrer seco."""
    import json as _j
    real = float(_j.loads(subprocess.run([ffprobe(), "-v", "error", "-show_entries", "format=duration", "-of", "json", src],
                                          capture_output=True, text=True).stdout)["format"]["duration"])
    dur = min(dur, real - start)
    truncated = real - start - dur > 0.05
    fade = min(0.35, dur / 3) if truncated else 0.0
    # compressor + limitador ANTES de nivelar: impacto e drop têm ataque forte e,
    # nivelados só pela média, saíam com pico muito acima dos outros (pedido do
    # usuário: efeito perceptível, sem pico). Todos terminam em -22 LUFS, pico -9 dBFS.
    dyn = "acompressor=threshold=-26dB:ratio=6:attack=1:release=120:makeup=4,alimiter=limit=0.35:attack=1:release=60,"
    af = (f"afade=t=out:st={max(0, dur - fade):.3f}:d={fade:.3f}," if fade else "") + dyn + "loudnorm=I=-22:TP=-9"
    r = subprocess.run([ffmpeg(), "-v", "error", "-y", "-ss", str(start), "-t", str(dur), "-i", src, "-af", af, "-ar", "48000", "-ac", "2", dst])
    return r.returncode == 0


def pen(dst, seconds=6.0, seed=0):
    """Caneta no papel: rajadas curtas de ruído filtrado (2 a 6 kHz), uma por
    traço, com intervalos irregulares e intensidade variando."""
    sr = 48000
    rng = np.random.default_rng(seed)
    out = np.zeros(int(sr * seconds))
    t = 0.0
    while t < seconds - 0.2:
        d = rng.uniform(0.035, 0.11)
        n = int(sr * d)
        burst = rng.standard_normal(n)
        env = np.sin(np.linspace(0, np.pi, n)) ** 1.5
        out[int(t * sr):int(t * sr) + n] += burst * env * rng.uniform(0.35, 1.0)
        t += d + rng.uniform(0.01, 0.07) + (rng.uniform(0.12, 0.25) if rng.random() < 0.12 else 0)
    spec = np.fft.rfft(out)
    f = np.fft.rfftfreq(len(out), 1 / sr)
    spec *= np.exp(-((np.log(f + 1) - np.log(3800)) ** 2) / (2 * 0.45 ** 2))  # passa-faixa em torno de 3,8 kHz
    y = np.fft.irfft(spec, len(out))
    y = y / (np.abs(y).max() + 1e-9) * 0.5
    raw = dst + ".raw.wav"
    import wave
    with wave.open(raw, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes((y * 32767).astype(np.int16).tobytes())
    subprocess.run([ffmpeg(), "-v", "error", "-y", "-i", raw, "-af", "loudnorm=I=-24:TP=-3", "-ar", "48000", "-ac", "2", dst], check=True)
    os.remove(raw)


def main():
    os.makedirs(OUT, exist_ok=True)
    manifest = {}
    for fam, items in FAM.items():
        n = 0
        for src, st, du in items:
            src = resolve(src)
            if not src:
                continue
            if cut(src, st, du, os.path.join(OUT, f"{fam}_{n}.wav")):
                n += 1
        manifest[fam] = n
        print(f"{fam:<7} {n} versões")
    # write agora vem do Mixkit (caneta e lápis gravados); pen() fica só como reserva
    json.dump(manifest, open(os.path.join(OUT, "manifest.json"), "w"), indent=1)
    json.dump(manifest, open(os.path.join(EDITOR, "src", "lib", "sfx-manifest.json"), "w"), indent=1)
    # pico de cada arquivo (s): o <Snd hit> agenda o som para o PICO cair no frame pedido
    peaks = {}
    for fn in sorted(os.listdir(OUT)):
        if fn.endswith(".wav"):
            x = np.frombuffer(subprocess.run([ffmpeg(), "-v", "error", "-i", os.path.join(OUT, fn), "-ac", "1", "-ar", "22050", "-f", "f32le", "-"],
                                             capture_output=True).stdout, np.float32)
            if x.size:
                hop = 441 if x.size >= 441 * 2 else 32
                k = x.size // hop
                r = np.sqrt((x[: k * hop].reshape(k, hop) ** 2).mean(1))
                peaks[fn[:-4]] = round(float(r.argmax()) * hop / 22050, 3)
    json.dump(peaks, open(os.path.join(EDITOR, "src", "lib", "sfx-peaks.json"), "w"), indent=0)
    open(os.path.join(OUT, "LICENSE-sfx.txt"), "w", encoding="utf-8").write(
        "Sons do editor:\n"
        "- Kenney (kenney.nl): Interface Sounds, UI Audio, Impact Sounds. Licença CC0 1.0.\n"
        "- Social SFX Pack - Collection 1 (baixado pelo usuário em 2026-09-27): licença NÃO incluída no pacote; confirmar a origem antes de uso comercial. Alguns arquivos citam autores do Freesound (ex.: akonze, Headphaze, Bigmonmulgrew).\n"
        "- write_*.wav: gerados por scripts/build_sfx.py (sem direitos de terceiros).\n")
    print(f"-> public/sfx/ ({sum(manifest.values())} arquivos) + manifest.json")


if __name__ == "__main__":
    main()
