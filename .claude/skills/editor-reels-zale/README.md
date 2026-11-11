# editor-reels-zale

Skill do Claude Code que edita os Reels da ZALE a partir da gravação bruta do celular: escolhe os takes (marcadores falados SALVA e CORTA), corta erros e pausas, e monta o vídeo no **modo Palco** (palco escuro em cima com uma cena animada por vez, apresentador embaixo, legenda na emenda), com sons de efeito, fotos de licença livre e CTA de palavra-chave. Tudo por código: Remotion + ffmpeg + faster-whisper na GPU.

Par da skill de roteiro: [reels-zale](https://github.com/pauloribandrade-beep/reels-zale).

## Estrutura

- `SKILL.md`: pipeline com 3 portões, regras de economia de tokens, modos e identidade.
- `references/`: API resumida dos componentes, escolha de takes, beats.
- `scripts/`: `prep`, `transcribe`, `cut`, `words`, `stills`, `render`, `imagem` (Wikimedia Commons, só licença livre), `sync_editor`.
- `editor/`: espelho do projeto Remotion (`Reels/editor`), sem mídia nem renders.

## Instalar numa máquina nova (Windows)

1. Copie esta pasta para `<projeto>/.claude/skills/editor-reels-zale`.
2. `winget install Gyan.FFmpeg` e `python -m pip install faster-whisper nvidia-cublas-cu12 "nvidia-cudnn-cu12==9.*" truststore`.
3. `python scripts/sync_editor.py --restore` (cria `Reels/editor`) e, dentro dele, `npm install`.
4. Ajuste o caminho em `scripts/_env.py` (`EDITOR`) se o projeto estiver em outro lugar.

Antes de commitar mudanças no editor: `python scripts/sync_editor.py`.

## Créditos e licenças

- Base de takes, zoom e overlays: [talking-head-reel](https://github.com/mariagorskikh/talking-head-reel) (MIT), ver `editor/LICENSE-talking-head-reel.txt`.
- Sons: Kenney Interface Sounds, UI Audio e Impact Sounds (CC0), ver `editor/public/sfx/LICENSE-sfx.txt`.
- Fontes Geist (OFL). Ícones lucide-react (ISC).
- Remotion: gratuito para pessoa física e empresa de até 3 pessoas; acima disso exige licença (remotion.dev/license).
