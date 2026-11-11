---
name: deadlock-videos
description: Faz vídeos curtos de Deadlock (TikTok/Shorts/Reels verticais, só voz) no Estúdio, no estilo aprovado do Blies (Cansei do LoL / Lash atrevido): cada fala vira uma tela da interface real do jogo recriada em código, sons tirados do próprio jogo, memes pelo sentido da fala e gancho forte nos 3 primeiros segundos. Use quando pedirem vídeo, roteiro, pauta ou edição de Deadlock, "monta esse áudio", "edita no estilo do Cansei do LoL", ou ajuste num vídeo de Deadlock já montado.
---

# Vídeos de Deadlock no Estúdio

Tudo aqui foi aprendido em ~12 vídeos publicados no TikTok (@mybadlies), com reprovações e aprovações do autor. As regras abaixo não são gosto: cada uma veio de um vídeo reprovado. Siga-as antes de inventar.

O Estúdio e a edição em geral seguem a skill `editor-reels-zale` (Estúdio, edit.json, sons, legenda, render). Esta skill manda no que é específico de Deadlock. Quando as duas discordarem num vídeo de Deadlock, vale esta.

## Onde está cada coisa

- Cenas de Deadlock (código): `Reels/editor/src/videos/<data>_deadlock-*/`. Cada pasta tem as cenas de um vídeo (ex.: `CL3.tsx`, `LA0.tsx`, `DL.tsx`) e todas estão registradas por nome em `src/lib/edit/registry.tsx`, então qualquer edit.json pode usar qualquer uma.
- Mídia que as cenas usam (artes do jogo, ícones de item, fontes Reaver/Radiance, sons do jogo, memes): `Reels/editor/public/videos/<data>_deadlock-*_R/`. Os caminhos são esses mesmos nos `.tsx`; não mova as pastas.
- Gameplay: as pastas `*_R/clips` trazem só os trechos curtos que as cenas chamam pelo nome. Os longos do autor (`k4`, `raw`, `rat`, `lol_b` na pasta da Magia) não vêm: as cenas que os usam (abertura do `LA0`, partes do `CL`) ficam sem fundo até você pôr o SEU gameplay com o mesmo nome em `public/videos/2026-11-06_deadlock-magia_R/clips/` ou trocar o `CLIP("...")` da cena. Gravação de gameplay: recorte vertical do centro, 1080×1920, sem HUD de stream por cima.
- Mapa do jogo desenhado em código: `src/lib/dlmapa.tsx` (cena `DLMapa`).
- Exemplos completos de como um vídeo é montado (roteiro de takes, montagem, edit.json final): `exemplos/` na raiz.
- Roteiros de exemplo: `Reels/roteiros/*deadlock*.md`.

## Fluxo de um vídeo (só voz, vertical 1080×1920)

Os scripts ficam em `.claude/skills/deadlock-videos/scripts/` (chame pelo caminho a partir da raiz do projeto).

1. **Pauta e roteiro** (se pedirem): leia `references/roteiro.md`. Liste 3 a 5 pautas com o gancho de cada e espere a escolha antes de escrever.
2. **Gravação**: a pessoa grava só a voz (wav) no PC, corrido, repetindo a frase quando erra. Copie para `Reels/editor/public/videos/<slug>/bruto.wav` (slug `AAAA-MM-DD_deadlock-tema`).
3. **Transcrever, achar repetição, escolher takes e tirar respiro**: leia `references/edicao-de-voz.md` na primeira vez (é a parte que mais dá retrabalho).
   - `scripts/pedacos.py <slug> --termos "heróis, habilidades"`: transcrição por pedaço, **na CPU**. Não rode duas transcrições nem dois ffmpeg pesados ao mesmo tempo.
   - `scripts/repetidos.py <slug>`: aponta frases repetidas e retomadas.
   - escreva `out/<slug>/takes.json` (fica a ÚLTIMA versão inteira de cada frase) e mostre a tabela de takes à pessoa.
   - `scripts/voz.py <slug>`: corta os respiros, gera `carrier.wav`, `voz_blocks.json` e `words.json`. A voz fica como **segmentos editáveis sobre a gravação inteira**, nunca um wav já cortado: a pessoa ajusta os cortes no Estúdio.
4. **Montar** (`exemplos/*/montar.py`): copie o montar.py do exemplo mais parecido para `out/<slug>/montar.py`, troque `SL`, a lista de cenas por palavra (`A("palavra")` acha o tempo), os sons e os memes. Ele grava `src/videos/<slug>/edit.json`, `segments.json` e `words.json`.
5. Registrar o vídeo em `src/Root.tsx` (copiar `exemplos/<exemplo>/Edit.tsx` para `src/videos/<slug>/`, trocar o nome do componente e somar o `<Composition>`), `npx tsc --noEmit -p .` em `Reels/editor`.
6. Cena nova: crie em `src/videos/<slug>/XX.tsx` (copiando o padrão de `CL3.tsx`/`LA0.tsx`) e registre o nome em `src/lib/edit/registry.tsx`.
7. Conferir quadros com `tools/estills.py` e abrir no Estúdio. **Render só quando a pessoa pedir.**

Regras do trabalho:
- Nunca gravar o edit.json enquanto a pessoa estiver mexendo no Estúdio (ele recarrega e perde o ajuste dela). Pergunte antes.
- Rodar o montar.py de novo preserva os cortes de voz que a pessoa fez à mão (fusão de 3 vias com `edit.montar.json`). `--voz-do-zero` apaga esses cortes: só com o aval dela.
- Ids dos sons pelo rótulo, nunca pela posição (senão som apagado volta).

## O estilo aprovado (Cansei do LoL / Lash atrevido)

Modelo: `src/videos/2026-11-09_deadlock-cansei-lol/CL3.tsx` (meio do vídeo) e `src/videos/2026-11-10_deadlock-lash-atrevido/LA0.tsx` (abertura). Novos vídeos partem deles.

- **O jogo contado dentro da própria interface dele**, recriada em código: HUD, loja, tooltip roxo-escuro com aba, blocos de atributo, placar, fileira de melhorias 1/2/5, fontes Reaver (títulos) e Radiance (UI). LoL, quando aparece, é o cliente Hextech com a fonte Beaufort.
- **Abertura (0 a 8 s)**: gameplay real em tela cheia + UMA palavra grande por frase (Pop), cortes secos na palavra, jogo congela num "mas", herói recortado despenca. Nada de barra, card, medidor enchendo ou feed em lista no começo. A promessa já no primeiro quadro; nada de apresentar a série antes dos 8 s.
- **Som marcante no quadro 0** (o "Among Us role reveal" foi o gancho do vídeo que mais rendeu).
- **Cada cena tem um objeto em ação** (cursor clicando, item sendo comprado, número contando), não um painel com frase. Troca de quadro a cada 1 a 3 s.
- **Gameplay limpo**: nada de card por cima do jogo. Informação (número, item, antes→depois) vai numa tela separada com a UI do jogo (`DLTip`, `DLSwap`, `DLItem`, `DLHero`, `DLBoard`).
- **Material real**: logo oficial (cdn.deadlock.wiki/Deadlock_Logo.png), artes da wiki (`cdn.deadlock.wiki/<Nome>.png`, `_card`, `_Render`; render tem fundo pintado: máscara radial, nunca recorte), post real (Reddit via vxreddit.com quando bloqueia), matéria real (og:image + título), página da Steam recriada com cursor. Nada de print desfocado como "prova".
- **Explicativo de mapa/objetivo**: a espinha é o `DLMapa` (câmera `cam` + `marks` por palavra); gameplay entra numa janela saindo do ponto marcado. Estenda o DLMapa, não crie outro mapa.
- **Citação rápida de outro jogo** ("não é CS, não é Overwatch"): só um card/logo pequeno dentro da UI do Deadlock. Gameplay de outro jogo só se o trecho for SOBRE ele.
- **TikTok, zona segura**: legenda numa posição só (y ~1370, margem direita 170); conteúdo entre y 170 e ~1290; nada à direita de x ~930 entre y 700 e 1550 (botões).
- **Sem fundo cinza** em lugar nenhum; meme recortado vai sobre o roxo-escuro das telas DL.

Proibido (todos já reprovados): emoji/Fluent 3D, card só com foto e emoji, vidro genérico, tela só com texto parada, vários cards seguidos ("parece slide"), overlay em cima do gameplay, gameplay repetido, cena que não mostra exatamente o que a fala diz.

## Memes

- Escolha pelo **sentido da fala**: para cada trecho, qual meme representa ESSA frase? Do acervo (`*_R/memes`) só o que encaixa exato; o resto, buscar novo (TikTok via tikwm, áudio no Myinstants, KYM para a foto original limpa).
- Meme não se repete entre vídeos da série. Já usados: Nazaré, ihh, boowomp, fah, faaah, capivara, wow, plot twist, esqueleto, Faustão, Pica-Pau, Coringa, Chill Guy, Among Us.
- **Meme no meio da narração = só o áudio**: a frase exata (~2 s, pode acelerar 1,2x), colada na voz numa pausa curta, sem trocar a tela. Meme em tela cheia só nos golpes grandes.
- Quando a fala continua, prefira a FOTO do meme (versão limpa, sem texto de template) ao vídeo.
- Flash de meme precisa durar o bastante para ser lido e casar com a fala. Nada de meme datado (John Cena, 2018).

## Som

- Sons reais do jogo: Deadlock sai do VPK instalado com o Source2Viewer-CLI (`--vpk_filepath sounds/ui/...`); LoL do CommunityDragon (raw.communitydragon.org/latest). Os já extraídos estão nas pastas `*_R/snd` e `*_R/sons`.
- Volume base 0.17, **um efeito por golpe**, nenhum par a menos de 0,6 s. O pico do efeito cai no quadro em que a coisa aparece.
- Cada movimento com som próprio (logos em série = sons diferentes); carimbo só em 1 ou 2 momentos.
- Reprovados: ding, folha de papel (paper_*, flip_*), whoosh sintético genérico, "som de IA".
- Efeito no que se move/entra na tela, nunca ilustrando a palavra falada.
- Música: de meme/TikTok ligada ao tema, baixa; mandar opções para a pessoa ouvir antes. Reprovadas: Sneaky Snitch, Le Festin, trilha genérica de banco.

## Roteiro (resumo; o completo está em `references/roteiro.md`)

- Formatos que funcionaram: **polêmica/patch** dá alcance (largando LoL, nerf de herói odiado); **tutorial de iniciante** dá seguidor (série Básicos: farm, objetivos). Alterne.
- Ganchos vencedores seguram 65 a 72% aos 3 s; todos caem entre 6 e 8 s. Primeira frase = a promessa.
- Shorts de meme: um herói por vídeo, fato bombástico + um pouco de lore (só de fonte: bio do jogo, falas). Jeito largado de quem conta fofoca: título falado seco, "Pois é, gente," + exagero irônico, "fica aí que eu te conto tudinho", frases ligadas por conectores (só que, tanto que, então), fecho em piada. ~110 palavras.
- Nada de bordão forçado ("é sério, galera", "deixa eu te explicar") nem frase solta.

## Perfil de quem posta

O CTA final usa a cena `DLMe`/`CLProfile` com a foto e o @ de quem posta. Troque a foto em `public/videos/2026-11-05_deadlock-patch-celeste_R/dl/` (e o handle no montar.py) pela sua antes de publicar. Perfil geral do Estúdio: `Reels/editor/src/lib/brand.json`.
