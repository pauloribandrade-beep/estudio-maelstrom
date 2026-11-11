# Estúdio Maelstrom: roteiro e edição de vídeos curtos de Deadlock

Este repositório é o Estúdio (editor de vídeo no navegador sobre Remotion) com o kit de Deadlock usado no TikTok @mybadlies. Quem usa conversa com o Claude Code aqui dentro e ajusta o vídeo no Estúdio.

Responda sempre em português do Brasil.

## Skills

- `.claude/skills/deadlock-videos/`: **use para tudo que for Deadlock** (pauta, roteiro, transcrição, cortes, montagem, cenas, memes, sons). Leia o `SKILL.md` dela antes de começar um vídeo.
- `.claude/skills/editor-reels-zale/`: o manual geral do Estúdio e da edição (edit.json, legenda, sons, conferência de quadros, render). Ela nasceu para Reels de clínica com apresentador; o que for de clínica, ignore.

## Onde está cada coisa

- `Reels/editor/`: o aplicativo. Abrir: `abrir-estudio.bat` (http://localhost:5173).
- `Reels/editor/src/videos/<data>_deadlock-*/`: as cenas de Deadlock (código), registradas em `src/lib/edit/registry.tsx`.
- `Reels/editor/public/videos/<data>_deadlock-*_R/`: artes, fontes, sons do jogo e memes que essas cenas usam.
- `exemplos/`: dois vídeos completos (roteiro de takes, montagem e o edit.json final) para copiar.
- Seus vídeos novos: gravação em `Reels/editor/public/videos/<slug>/`, trabalho em `Reels/editor/out/<slug>/`. Nada disso vai para o GitHub.

## Regras de trabalho

- **Renderizar só quando a pessoa pedir.** O render ocupa muita memória e a placa; com ele rodando, a prévia trava.
- Transcrição sempre na CPU (a placa é do jogo). Um processo pesado por vez.
- Nunca gravar o edit.json com a pessoa mexendo no Estúdio; peça para ela pausar.
- Antes de entregar, pergunte a si mesmo se está bom o suficiente ou se vai voltar com reprovação; refaça até ficar bom, o som tão caprichado quanto o visual.

## Atualizações

Para receber a versão nova: o Estúdio mostra "Versão nova disponível" com o botão **Atualizar agora**; ou `atualizar.bat`; ou peça aqui "atualiza o Estúdio" (`git pull --ff-only`, depois `npm install` em `Reels/editor` e `pip install -r requirements.txt`). Se o pull falhar por arquivo alterado localmente, guarde a mudança (`git stash`), atualize e reaplique (`git stash pop`), explicando para a pessoa. Cena que você criou para um vídeo seu fica em `src/videos/<slug>/` e não é apagada pela atualização.
