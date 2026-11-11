"""Ambiente comum dos scripts: ffmpeg no PATH, DLLs CUDA do pip, certificados
do Windows (truststore) e o caminho do projeto Remotion."""
import glob
import os
import shutil
import site
import sys

# Projeto Remotion: <raiz do projeto>/Reels/editor, achado pela posição desta pasta
# (<raiz>/.claude/skills/editor-reels-zale/scripts). Funciona em qualquer máquina; REELS_EDITOR sobrescreve.
_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))
EDITOR = os.environ.get("REELS_EDITOR", os.path.join(_ROOT, "Reels", "editor"))
FPS = 30

# Pasta dos temporários pesados do render (bruto, cache de blocos, cópia do public do Remotion). ESTUDIO_TEMP
# sobrescreve; sem ela, usa D:/tmp_zale (ou E:/tmp_zale) se a pasta existir (máquina do Paulo, o C: vive cheio); senão None, e cada
# script cai na própria pasta dentro de Reels/editor/out.
# 06/11: pedido dele, temporários no D: (SSD SATA de 480 GB, ~186 GB livres); o E: (SSD de 120 GB) fica de reserva.
TEMP_BASE = os.environ.get("ESTUDIO_TEMP") or next((d for d in ("D:/tmp_zale", "E:/tmp_zale") if os.path.isdir(d)), None)

# Força UTF-8 no console do Windows (acentos na tabela).
try:
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
except Exception:
    pass


def setup_cuda():
    for base in site.getsitepackages() + [site.getusersitepackages()]:
        for p in glob.glob(os.path.join(base, "nvidia", "*", "bin")):
            try:
                os.add_dll_directory(p)
            except (FileNotFoundError, AttributeError):
                pass
            os.environ["PATH"] = p + os.pathsep + os.environ["PATH"]


def setup_ssl():
    # A rede desta máquina inspeciona HTTPS; usar o repositório de certificados do Windows.
    try:
        import truststore
        truststore.inject_into_ssl()
    except ImportError:
        pass


def ffmpeg():
    exe = shutil.which("ffmpeg")
    if exe:
        return exe
    hits = glob.glob(os.path.expandvars(r"%LOCALAPPDATA%\Microsoft\WinGet\Packages\Gyan.FFmpeg*\*\bin\ffmpeg.exe"))
    if hits:
        os.environ["PATH"] = os.path.dirname(hits[0]) + os.pathsep + os.environ["PATH"]
        return hits[0]
    sys.exit("ffmpeg não encontrado (winget install Gyan.FFmpeg)")


def ffprobe():
    return os.path.join(os.path.dirname(ffmpeg()), "ffprobe.exe")


def npx():
    return shutil.which("npx.cmd") or shutil.which("npx") or "npx"
