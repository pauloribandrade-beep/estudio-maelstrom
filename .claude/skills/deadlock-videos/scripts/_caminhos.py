"""Acha as pastas do Estúdio a partir desta skill (.claude/skills/deadlock-videos/scripts -> Reels/editor)."""
import os

ED = os.environ.get("ESTUDIO_EDITOR") or os.path.abspath(
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "..", "..", "Reels", "editor"))


def pastas(slug):
    """(mídia do vídeo, pasta de trabalho), as duas terminando em /"""
    return f"{ED}/public/videos/{slug}/", f"{ED}/out/{slug}/"
