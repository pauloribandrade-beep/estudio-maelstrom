---
name: editor-reels-zale
description: Edita os Reels da ZALE a partir da gravação bruta do celular (vertical, lapela, arquivo corrido com frases repetidas ou vários takes). Escolhe o melhor take de cada frase (com os marcadores falados SALVA e CORTA), corta respiros e erros, faz zoom seco nos cortes, legenda palavra por palavra, título do gancho, cards animados, troca de tela para animação vetorial/foto/manchete, tela dividida com vídeo viral e CTA de palavra-chave, tudo por código (Remotion + ffmpeg + faster-whisper na GPU). Use quando o usuário mandar um vídeo gravado para editar, pedir "edita esse Reels", "corta os erros", "tela dividida", "coloca animação", ou pedir ajuste num vídeo já editado.
---

# Editor de Reels ZALE

Base: a skill pública talking-head-reel (MIT, crédito em `Reels/editor/LICENSE-talking-head-reel.txt`), adaptada para Windows, português, GPU NVIDIA, marcadores SALVA/CORTA, identidade ZALE e dois modos (narrativo e tela dividida). Roteiros vêm da skill `reels-zale` (marcações `[CORTE] [IMAGEM] [ZOOM] [TEXTO NA TELA]`).

- Scripts: `scripts/` desta skill (Python 3.11). Rode com `python <caminho>/scripts/X.py`.
- Projeto Remotion: `Reels/editor` na raiz do projeto (o `scripts/_env.py` acha sozinho; dependências: `instalar.bat` na raiz).
- Um vídeo = um **slug** (ex.: `2026-09-30_vou-pensar`). Arquivos dele: `public/videos/<slug>/` (mídia) e `src/videos/<slug>/` (dados + `Video.tsx`).

## Economia de tokens (regra do usuário, obrigatória)

1. **Nunca abrir `whisper.json`, `words.json` nem vídeo/áudio no chat.** O Claude lê só: `takes.txt` (mapa compacto), a saída curta dos scripts e `words.py` para tempos de palavras específicas.
2. **Nunca reler o código de `src/lib/`.** A API dos componentes está resumida em `references/componentes.md`. Leia só esse resumo.
3. **Copiar, não reescrever:** comece o `Video.tsx` novo copiando `src/videos/teste/Palco.tsx` (ou o último vídeo aprovado) e troque só dados e beats. Cena nova que falte na biblioteca: crie em `lib/palco-ui.tsx` (reutilizável) e documente em `references/componentes.md`.
4. **Imagens de conferência pequenas e poucas:** `stills.py` (escala 0.25, até 8 quadros numa imagem só) e o `sheet.png` do render. Não abrir quadros soltos nem o MP4.
5. **Portões curtos:** em cada portão, mostre ao usuário no máximo 10 linhas (tabela de takes escolhidos, lista de beats), não o arquivo.
6. Não repetir a transcrição (`transcribe.py --raw` reaproveita). Não renderizar o vídeo inteiro para testar um detalhe: use `stills.py`.

## Estúdio (edit.json): PADRÃO desde 2026-09-27

O vídeo é montado a partir de `src/videos/<slug>/edit.json` (cenas, sons, legenda, zoom como dados) e o Paulo refina no **Estúdio** (timeline no navegador, `npm run estudio`). No passo 6, em vez de escrever o `Palco.tsx` à mão, escreva o `edit.json` e rode `tools/collect_sfx.py`. Ajuste pedido por mensagem = editar o edit.json. Detalhes em `references/estudio.md`.

## Pipeline (com 3 portões)

```
1 prep.py        bruto -> public/videos/<slug>/ig1080.mp4 (+ viral1080.mp4)
2 transcribe.py  gravação inteira -> takes.txt (mapa com OK/XX/mk/re)
3 escolher takes -> src/videos/<slug>/segments.json          PORTÃO 1 (takes)
4 cut.py         -> words.json + linha do tempo
5 planejar beats -> lista curta                              PORTÃO 2 (beats)
6 Video.tsx      copiar modelo, aplicar beats, registrar em src/Root.tsx
7 stills.py      conferir quadros-chave, corrigir layout
8 render.py      final normalizado + preview 720p + sheet + QA   PORTÃO 3 (vídeo)
```

O usuário pode dizer "vai até o fim" para pular os portões 1 e 2.

### 1. Ingestão
`python scripts/prep.py "<bruto>" <slug> [--viral "<viral.mp4>"]`. Se o usuário tiver o roteiro salvo em `Reels/roteiros/`, leia só o **texto corrido** e as marcações dele (não o arquivo inteiro).

### 2. Transcrição e mapa de takes
`python scripts/transcribe.py <slug> [--fix "Zale=ZALE"]`. Leia o `takes.txt` impresso.

**Marcadores falados** (o usuário diz depois de terminar um take):
- **SALVA**: o take que acabou de terminar está aprovado (`OK`).
- **CORTA**: o take que acabou de terminar vai fora (`XX`).
- `mk` é o próprio marcador (nunca entra). `re` é tentativa abortada ("de novo", "errei", "peraí").
- Sem marcador (`..`): escolha pela regra da seção 3.

### 3. Escolher os takes
Leia `references/escolha-de-takes.md` na primeira vez. Resumo:
- `OK` sempre ganha. `XX`, `mk` e `re` nunca entram.
- Sem marcador: agrupe as repetições da mesma frase; vence a **última versão fluente e completa** (as pessoas esquentam); uma anterior só ganha se a última tropeçar no meio da frase.
- Frases seguidas sem reinício = um take só (uma emenda em vez de quatro).
- Corte na palavra: `a` = início da 1ª palavra − 0,12 s; `b` = fim da última + 0,25 s, sem invadir a próxima palavra (confira com `words.py`).
- Pausa e respirada >= 0,3 s dentro de um take: corte com `tools/tighten.py` (deixa 0,1 s; ver `references/estudio.md`). O usuário quer o ritmo justo: respirada longa entre frases derruba a dinâmica.
- Nada que não foi dito entra, nem como texto.
- Alvo: 25 a 45 s de fala (a skill de roteiro mira nisso) + outro de 2 a 3 s.

Escreva `src/videos/<slug>/segments.json` (`fps`, `outro`, `segments[{a,b,note}]`) e **PORTÃO 1**: mostre a tabela curta (take, a-b, o que é, por quê).

### 4. Cortar
`python scripts/cut.py <slug> --split-gap 0.8 [--fix "Zé=ZALE"] [--phrase "muito mas óbvio=muito mais óbvio"]`. Escreva os takes largos (trechos bons inteiros) e deixe o `--split-gap` dividir nas pausas do ÁUDIO (limiar calibrado sozinho pelo ruído da gravação). Palavra faltando no texto final = corte dentro dela; ajuste a/b. Em `--phrase`, escreva sem pontuação (a do original é mantida).

**Precisão da transcrição:** `transcribe.py` divide a gravação em falas (VAD) e transcreve cada uma sozinha com `large-v3`, beam 5, áudio limpo e o **roteiro** como pista (acha sozinho em `Reels/roteiros/*<slug sem data>*.md`; ou `--roteiro`). Termo do nicho que errar: acrescente em `references/vocabulario.txt`. Nunca passe lista solta de palavras como pista (o whisper imita o estilo: tira a pontuação ou enche de vírgula). Trecho duvidoso: retranscreva só a janela e confira antes de corrigir com `--phrase` (aceita número de palavras diferente).

**Legenda no Palco:** padrão na emenda (y 980). Abaixo do queixo só cabe se a pessoa gravou mais afastada (queixo acima de y ≈ 1450 no layout); abaixo disso a interface do Instagram cobre. Oriente: celular a um braço e meio, rosto no terço de cima.

**Transcrição de gravação com recomeços:** o `transcribe.py` já faz uma segunda passada nos trechos suspeitos (palavra esticada > 1,5 s ou buraco > 1,5 s) e lista em "revisados" as tentativas que estavam escondidas. Leia essa lista: é onde estão os tropeços. Para ver o texto inteiro de um segmento longo, `python scripts/segs.py <slug> 5 25`; com tempo de cada palavra, `--words 5`.

### 4.1 Versão limpa (PORTÃO de aprovação, padrão pedido pelo usuário)
Antes de qualquer cena, entregue a **versão limpa**: você em tela cheia, os cortes, `ReelCaptions` e zoom. Modelo: `src/videos/2026-09-27_teste-real/Limpo.tsx`. Só depois da aprovação monte o Palco em cima dos mesmos `segments.json` e `words.json`.

**Zoom (regra do usuário):** nada de zoom em todo corte. `PUSHES` leves (1.06 a 1.08) só nas **frases de impacto** (5 a 7 por vídeo), e `SNAPS` sutis (1.0/1.04) em poucos cortes, onde o salto de imagem ficaria feio.

### 5. Planejar os beats
Siga o roteiro (as marcações dele) e `references/beats.md`. Para cada beat, pegue o tempo da palavra com `python scripts/words.py <slug> palavra1 palavra2`. **PORTÃO 2**: lista de uma linha por beat ("18,7 s · risca 'fica à vontade'").

### 6. Montar o `Video.tsx`
Copie o modelo, troque `SRC`, `SNAPS`, `PUSHES` e os beats; exporte `DURATION` e o componente; registre em `src/Root.tsx` (uma linha de import + um `<Composition>`, id sem espaços). Checagem rápida: `npx tsc --noEmit -p .` no projeto (só erros aparecem).

### 7. Conferir quadros
`python scripts/stills.py <slug> <Comp> <seg1> <seg2> ...` com um segundo por beat + um por corte (até 8). Olhe `out/<slug>/stills.png`: card em cima do queixo, texto passando da zona segura, legenda colidindo com card, beat depois da frase.

### 8. Render e entrega
`python scripts/render.py <slug> <Comp>`: normaliza para −16 LUFS, gera `-reel.mp4`, `-preview.mp4` (720p) e `sheet.png`, e lista silêncios > 0,8 s na fala (se houver, voltar ao passo 3 e dividir o take). Olhe só o `sheet.png`. **PORTÃO 3**: entregue os caminhos, os takes usados, os beats em palavras simples e os ajustes fáceis (trocar take, mover um card, trocar CTA). Música: biblioteca própria (Mixkit, licença livre) na aba **Músicas** da biblioteca do Estúdio; o Paulo escolhe de ouvido. Acervo baixado por `scripts/fetch_music.py` em `sfx-lib/mixkit-music/` (fora do `public/`). Entra bem baixa (vol 0.25 ou menos, arquivo em -26 LUFS). Música de tendência do Instagram tem direitos: essa só pelo próprio app ao postar.

## Modos

- **Palco (PADRÃO, pedido do usuário, referência @metodo.naghol):** tela dividida o tempo todo. Em cima, um palco escuro (`PalcoLayout`) onde aparece **uma cena rica por vez** ilustrando a frase (celular com conversa, agenda, painel, funil, protocolo em camadas, proposta, linha do tempo, órbita, comparação, palavra grande, carimbo, CTA, seguir). Embaixo, o apresentador sempre visível (zoom só nele). **Legenda na emenda** (`SeamCaptions`). Nunca texto em cima de texto. Modelo: `src/videos/teste/Palco.tsx`; vitrine de todas as cenas: composição `Vitrine`.
- **Narrativo:** você em tela cheia + troca de tela (`Cutaway`) e cards na faixa abaixo do queixo. Usar só quando o usuário pedir.
- **Tela dividida com viral:** viral em cima, você embaixo (`SplitScreen`). Jeito 1: viral com áudio e você reage calado; depois vira Palco. Jeito 2: viral mudo e você narra. Ver `references/beats.md`.

Perfil do usuário no Instagram: **@opaulosandrade** (canto do palco via `handle` e `FollowCard`).

### Regras do Palco que vieram do usuário
- **Sem bordas nas laterais (usuário):** comece com `fit={{ scale: 1.0, top }}` (vídeo na largura toda) e ajuste só o `top` até a cabeça caber com ~60 px de folga abaixo da emenda (no edit.json: `video.fit`). Só reduza o `scale` (e aí aparecem as bordas desfocadas do `meBg`) se a pessoa gravou tão perto que a cabeça não cabe nem assim. Piloto (gravado a ~1 braço): `scale 1.0, top 830`.
- **Nada de "terminal do Mac"** em tema de clínica: use `ClinicNote` (ficha de avaliação na prancheta, texto escrito à mão, `strikeAt` para riscar a pergunta errada). `TypeWindow` só para assunto de tecnologia (ex.: Claude Code).
- **Título com ícone:** `BigType` com `icon` (e `iconOff` para "pare de..."); título só texto fica genérico.
- **Maiúscula** na primeira letra de títulos e rótulos: os componentes já aplicam `cap()`; escreva os textos normalmente.
- **Texto na tela no ritmo da fala:** o que ele está falando tem que aparecer ENQUANTO ele fala, não depois. Na `ClinicNote`, use `dur` na linha (`tl.E(fimDaFrase) - tl.E(inícioDaFrase)`) para a escrita terminar junto com a última palavra. O título do gancho pode entrar como `Stamp` por cima da cena na frase seguinte, em vez de ocupar o palco antes.
- **Nada parado depois de entrar:** todo elemento do palco flutua **só para cima e para baixo** (`useIdle`), e itens de lista, grade e balões fazem o mesmo com fase própria. Nada de inclinar para os lados nem zoom lento (o usuário não gostou). Componente novo tem que usar `useIdle` ou o `Scene` do `palco-ui`.
- **Som sempre com motivo visual:** nada de riser ou efeito "solto" sem algo acontecendo na tela no mesmo instante (o usuário sentiu o riser como aleatório). Todo som nasce de um elemento entrando, mudando ou sendo carimbado.
- **Volume dos efeitos: perceptível, sem pico.** Os arquivos saem de `build_sfx.py` comprimidos e limitados (-22 LUFS, pico -9 dBFS) e `SFX_VOL` os deixa uns 10 LU abaixo da voz. O `render.py` renderiza um áudio só com os efeitos e mede: alvo entre 8 e 18 LU abaixo da voz, com o impacto de carimbo perto de 14; se listar "efeitos altos demais", baixe o `vol` daquele efeito. Não passe `vol` alto à mão.
- **Mesmo elemento, mesmo som (usuário):** os itens de uma lista, os balões de uma conversa, os cards de uma órbita usam SEMPRE o mesmo som. O `<Snd>` escolhe a versão pelo tipo de elemento (`k="list"`, `"chat"`, `"orbit"`...), nunca por instância. Componente novo: dê um `k` próprio.
- **Escrita = digitação:** toda escrita (ficha, janela) usa `SndSpan name="type"` na versão padrão `TYPE_V` (o "type 2" da audição, Mixkit "Slow typing on a keyboard"). Nada de lápis nem som de papel na ficha (soou como "página balançando").
- **SEM som de transição (usuário, enfático):** nada de drop, riser, whoosh ou "batida de virada" entre cenas ou em palavra de impacto. Os sons ficam só nos elementos (pop de item, digitação, carimbo, clique, erro no risco). As famílias `drop`, `riser` e `whoosh` existem na biblioteca mas NÃO são usadas por padrão; só se o usuário pedir.
- **Batida na palavra, não depois (só se um dia pedirem impacto com subida):** drop, impacto com subida ou qualquer som com build-up usa `<Snd hit ... />`, com `at` = início da palavra (de `words.py`). O `build_sfx.py` grava o pico de cada arquivo em `src/lib/sfx-peaks.json` e o `hit` antecipa o som para o pico cair na palavra. Drop sem buraco no meio: `drop_0` (subida contínua). O `drop_1` tem um vão de quase silêncio antes da batida (soou "cortado").
- **Vetados na audição:** o pop "Interface Pop High Short" (Sonniss), "som de Looney Tunes".
- **Itens de grade (ChipGrid):** som aprovado = `tick.wav` (Kenney) a 0.2, fixo (`file="tick.wav"`).
- **Itens em sequência rápida (< 0,3 s entre eles):** som CURTO e seco (`tick.wav` a ~0.22), um por item no quadro em que ele assenta. O `pop` longo (0,4 a 0,6 s) encavala e embola (usuário, 3 clínicas do vídeo da indicação).
- **Som acompanha a ação, do começo ao fim (usuário):** se a ação se repete (moedas caindo, camisas penduradas), um som por repetição, no quadro em que ela acontece, até o fim da cena. Nada de 3 sons no começo e silêncio depois.
- **Sem o som certo na biblioteca: buscar fora, sem perguntar.** Freesound com filtro CC0 (`freesound.org/search/?q=...&f=license:"Creative Commons 0"`; os links `-hq.mp3` das prévias baixam sem conta), Mixkit, Sonniss GDC, Kenney. Guardar em `sfx-lib/freesound/` com `index.json` (título, autor, licença, url). Arquivo recortado para `public/sfx/<nome>.wav` com pico em -9 dBFS e usado com `file=`; conferir a loudness máxima momentânea contra um pop aprovado e acertar o `vol`. Já feitos: `coin_drop.wav` (Freesound 423344, moeda em metal; em sequência, volume em arco com pico 0.26: começa baixo, sobe e desce), `hanger_clack.wav` (Freesound 197891, cabide no varão, vol 0.7) , `pen_stroke.wav` (Freesound 850820, risco de marcador de 0,5 s para "canetada"/riscar, vol 0.4) e `crack_ground.wav` (Freesound 222521, chão/pedra rachando 1,5 s, vol 0.34). Rachadura NÃO leva "glass" (brilho de vidro): o usuário achou sem sentido.
- **Sem whoosh** na entrada de cenas (o usuário não gostou). Mas **nada mudo** (usuário, 2026-09-28): todo objeto que entra ou pousa, rótulo que aparece e mudança de estado ganha um som curto e discreto (pop, tick, click, error...), sem empilhar sons no mesmo instante.
- **Carimbo tem impacto:** o cinematográfico, com reverb, em volume baixo (`thud: 0.176`, aprovado pelo usuário). Nunca trocar por batida seca nem tirar. **Ajuste pedido é ajuste pontual:** se o usuário pede para baixar UM efeito, mexa só nele; não baixe nem troque os outros.
- **Som nunca é cortado:** `makeAt` estende a Sequence 2 s além do `to` só para o áudio terminar (o visual some no `life`); impactos, drops e risers entram inteiros, com reverb. Não reduza esse `tail`.
- **Sem card de Seguir no final** (o usuário não gostou do `FollowCard`): a CTA (`KeywordPill`) fica até o último frame; outro curto (1 a 1,5 s).
- **Som variado e alinhado:** cada família (`whoosh`, `pop`, `tick`, `click`, `ding`, `thud`, `error`, `glass`, `switch`, `riser`, `drop`) tem várias versões e o `<Snd>` alterna sozinho. Digitação e escrita usam `SndSpan` (`type` = teclado mecânico, `write` = caneta), com a duração exata do texto. Nada de riser/drop na virada (vetado pelo usuário). Para trocar ou acrescentar sons: edite `FAM` em `scripts/build_sfx.py` e rode o script. Bibliotecas (só na máquina, fora do repo): `sfx-lib/mixkit` (~1.000 sons, `fetch_mixkit.py`; o site bloqueia se consultar rápido demais, não contornar), `sfx-lib/sonniss-gdc2026` (amostras de estúdio, `extract_sonniss.py`), Kenney e Social SFX. Para achar candidatos sem ouvir: `sfx_catalog.py --find pop click --max-dur 0.6 --bright-min 2000`. Depois de mudar famílias, renderize a composição `Audicao` e mande ao usuário para ele vetar por ouvido.

### Regras do Palco (vieram da análise da referência)
- Troca de cena a cada 2 a 4 s, sempre na palavra que ela ilustra; cena dura a frase inteira.
- Cada cena é um **mockup que descreve** o que está sendo dito, com movimento contínuo (entra, flutua, conta, digita, desenha, cursor clica). Palavra solta (`BigType`) só para frase de impacto.
- Uma cena por vez. Carimbo (`Stamp`) e cursor (`Cursor`) podem somar por cima da cena.
- Legenda na emenda: 3 palavras, faladas em branco, próximas em cinza; `hot` só para 1 ou 2 palavras-chave exatas do vídeo.
- Som: cada cena já traz o seu (whoosh suave na entrada, pop/tick por item, thud no carimbo, click/ding no cursor e no seguir), com volume baixo. Não somar sons extras além de `tap` leve nos snaps.
- Números e nomes nos mockups: reais do usuário ou claramente ilustrativos (nomes genéricos, "R$ X"); nunca resultado inventado.

## Efeitos cinematográficos
Para vídeo com cortes, transições e movimentos de câmera (ex.: projeto Half-Life 3), siga `references/sound-design.md`: mapa de eventos lido do código, som posicionado pelo pico medido (`tools/sfx_peak.py`), build-up na chegada, whoosh no recuo, decaimento até sumir, batida + cauda longa no corte.

## Identidade (sem exagero)

Branco, preto e vermelho ZALE `#D82810` como acento: palavra atual da legenda, sublinhado do título, palavra-chave da CTA, risco. Cards escuros. Nada de tela inteira vermelha, nada de muitas cores. Sem travessão em texto na tela. Sem número ou caso inventado. Imagens: só do usuário, de licença livre (`scripts/imagem.py` no Wikimedia Commons, com crédito na legenda do post quando for CC BY/BY-SA; Pexels/Unsplash para cenários) ou vetor desenhado em código; foto de agência de notícias ou do Google sem licença, nunca; print de manchete via `NewsCard` (genérico, não imita veículo). Sem memes de terceiros por padrão.

## Regras que vieram de erros

- Transcreva o arquivo inteiro; escolha takes pela tabela, nunca "no olho".
- Corte em tempo de palavra, nunca em tempo de segmento.
- Zoom seco substitui dissolve entre takes (dissolve de duas versões da mesma frase parece erro).
- Um card por vez na faixa, nada no primeiro meio segundo de uma frase, tudo some 0,3 s depois dela.
- Legenda nunca cobre o rosto; card nunca no queixo.
- Troca de tela (`Cutaway`) de 1,5 a 3 s, no máximo uma a cada ~6 s.
- Não apagar arquivos fora de `out/<slug>/` e `public/videos/<slug>/` sem perguntar.
