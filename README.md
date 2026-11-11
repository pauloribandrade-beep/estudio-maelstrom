# Estúdio Maelstrom

O editor de vídeo e o kit que fazem os vídeos de Deadlock do TikTok @mybadlies: você grava a voz, conversa com o Claude Code e o vídeo sai montado com a interface do jogo recriada em código, sons do jogo, memes e legenda. Você ajusta tudo numa timeline no navegador.

## Instalar (Windows 10/11)

1. Aceite o convite do repositório no GitHub (chega por e-mail).
2. Baixe com o **GitHub Desktop** (File > Clone repository > `estudio-maelstrom`) ou no terminal `gh repo clone pauloribandrade-beep/estudio-maelstrom`. O Download ZIP não recebe atualizações.
3. Dois cliques em **`instalar.bat`** (instala Git, Node, Python, FFmpeg e as dependências; se ele pedir, feche e rode de novo).
4. Instale o **Claude Code** (app Claude para desktop, aba Code) e abra esta pasta nele.
5. Troque a sua foto e o seu @ (peça ao Claude: "coloca o meu perfil no Estúdio").

Precisa de uns 5 GB livres (o motor de vídeo e o modelo de transcrição) e de 16 GB de RAM para renderizar com folga.

## Usar

- **Abrir o Estúdio:** `abrir-estudio.bat` (abre em http://localhost:5173).
- **Pauta e roteiro:** "me dá pautas de Deadlock sobre o patch novo" ou "escreve o roteiro de ...".
- **Vídeo:** grave a voz no PC (wav), mande o arquivo para o Claude: "monta esse áudio no estilo do Cansei do LoL".
- **Ajustar:** no Estúdio você mexe nos cortes da voz, nas cenas, nos sons e na legenda; peça ao Claude o que não souber fazer.
- **Atualizar:** o Estúdio avisa quando tem versão nova (botão Atualizar agora), ou `atualizar.bat`.

## Licenças e uso

- Uso pessoal. As artes, fontes e sons do Deadlock são da Valve; os memes são de seus autores. Não redistribua os arquivos de `public/videos/*_R`.
- **Remotion** (motor de vídeo): grátis para pessoa física e empresa de até 3 pessoas.
- Sons em `Reels/editor/public/sfx`: uso nos vídeos, não redistribuir os arquivos.
