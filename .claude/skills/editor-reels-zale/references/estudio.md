# Estúdio ZALE (editor de timeline) e o edit.json

Desde 2026-09-27 o vídeo é montado a partir de **dados**, não de código: `src/videos/<slug>/edit.json`. O Claude monta; o Paulo refina no Estúdio (timeline no navegador) sem precisar pedir ajuste por mensagem.

## Abrir o Estúdio
```
npm --prefix Reels/editor run estudio
```
Abre em http://localhost:5173 (no app do Claude: `preview_start` com o nome `estudio`, configurado em `.claude/launch.json`).
Trilhas: Voz (onda), Cenas, Carimbos, Sons, Legenda (palavra a palavra), Zoom. Arrastar move; bordas cortam; `Alt` desliga o ímã; fades nos quadradinhos do som selecionado; biblioteca de sons à esquerda; Salvar (`Ctrl+S`) grava o edit.json (com histórico em `out/<slug>/edit-history/`); Renderizar chama o `render.py`.

## Formato (resumo; tipos em `src/lib/edit/types.ts`)
- Tempos em **segundos da edição** (relógio do vídeo final). Dentro de `props` de cena, tempos **relativos ao início da cena**: chaves `at`, `...At` e `dur`, em segundos (o montador converte em frames).
- `icon` é o nome do ícone do lucide (`"Syringe"`, `"Ear"`...).
- `scenes[]`: `{id, type, start, end, lane (0 cena, 1 carimbo), label, props}`. `type` = nome do componente no registro de cenas: as genéricas em `src/lib/edit/registry-nucleo.tsx`, as do nicho clínica em `registry-clinica.tsx` (código em `src/lib/clinica/`) e as de um vídeo/projeto só em `registry.tsx`, que junta as três. Palavras padrão das cenas genéricas (cliente, profissional, negócio, palavra do CTA…), @, logo e cores ficam em `src/lib/brand.json`; cena genérica nova usa `TX` (`src/lib/textos.ts`) e `ZALE.red`/`ZALE.redRgb`, nunca o texto ou o vermelho escrito no código.
- `sounds[]`: `{id, src ("sfx/pop_3.wav"), start, vol, dur, trim?, fadeIn?, fadeOut?, muted?, label, scene?, track}`.
- `soundTracks[]`: `{id, name, muted?, vol?}` (trilhas de som como no CapCut; cada som tem `track`). Doc sem trilhas é migrado pelo Estúdio. Ao escrever um edit.json novo, já crie as trilhas (ex.: "Efeitos", "Impactos", "Música").
- `captions`: `{y, size, groupSize, hot[], words[{word, start, end}]}` (as palavras vêm do `words.json`).
- `zoom`: `snaps[{t, z}]`, `pushes[{t, z, up, until, down}]`.
- `comp`: nome da composição do Remotion que renderiza (ex.: `"PacienteEdit"`).
- `video`: `{src, fit{scale, top}, handle}`. `src` = **`master.mp4`** (cópia mestre na resolução da gravação, criada pelo `prep.py` quando o bruto é maior que 1080) para o render sair nítido; sem master, `ig1080.mp4`. O Estúdio toca uma prévia leve (`proxy720.mp4`) só para não travar.
- Render (`render.py`): para composições `*Edit`, monta antes o vídeo contínuo do apresentador (`tools/cutvideo.py`: takes colados, 1080 do master com lanczos, voz tratada, `public/videos/<slug>/cut-<hash>.mp4`, ~10 s) e passa `video.cut` por props; `--gl=angle` (placa de vídeo), `--concurrency=75%`, JPEG 95, x264 crf 14 preset fast. Medido no piloto: 5,7 -> 15,8 quadros/s; vídeo de 81 s em 2 min 43 s (antes ~9 min). Pelo Estúdio roda com `--no-qa`. O `meBg` (fundo desfocado) só é desenhado quando `fit.scale < 1`.
- Progresso: o Estúdio lê o `out/<slug>/render.log` ("Rendered x/y, time remaining") e mostra etapa, %, tempo restante, botão cancelar e "Baixar" no fim. Estado dos renders em `globalThis` (sobrevive ao recarregamento da config); arquivo temporário por processo (`raw-<pid>.mp4`).

## Voz e sons no Estúdio
- Trilha **Voz**: clique abre efeitos (normalizar -16 LUFS com speechnorm+loudnorm, compressor, tirar grave < 80 Hz, reduzir ruído), ganho em dB e fade de início/fim. O servidor gera `public/videos/<slug>/voice-<hash>.m4a` (linha do tempo da gravação) e grava `doc.voice = {src, fx, gain, fadeIn, fadeOut}`; o montador toca a voz por esse arquivo, take a take (vídeo mudo).
- Blocos de **som** mostram a onda do arquivo (API `/api/wave?src=`), a curva de fade e bolinhas nos cantos para puxar o fade; o painel tem fades prontos (Suave, Entra devagar, Sai devagar, Longo).

## Sons
No vídeo montado pelo edit.json, os sons embutidos nos componentes ficam **mudos** (`SfxCtx` modo "mute"): tudo toca pela trilha `sounds`. Para gerar a trilha a partir das cenas:
```
python tools/collect_sfx.py <slug> <Comp>Collect          # só cenas que ainda não têm som
python tools/collect_sfx.py <slug> <Comp>Collect --all    # refaz tudo (apaga ajustes do Paulo nos sons)
```
Rode depois de montar as cenas e antes de entregar. Som solto (batida de virada, riser) entra direto em `sounds` à mão.
**Trilhas de efeitos (usuário):** dois sons DIFERENTES nunca encavalados na mesma trilha (fica impossível ajustar um só); o mesmo som repetido (moedas, cabides) pode ficar junto. `collect_sfx.py` já põe cada som novo numa trilha livre (`tools/pack_tracks.py`, cria "Efeitos N" se faltar); `python tools/pack_tracks.py <slug>` reorganiza tudo; no Estúdio, botão **Organizar trilhas** (mesma regra, `packFxTracks` em `estudio/util.ts`) e o **+** da biblioteca, colar e duplicar escolhem sozinhos uma trilha livre. Trilhas de música ficam de fora.

## Fluxo para um vídeo novo (substitui escrever o Palco.tsx à mão)
1. Takes, `segments.json`, `words.json` como sempre (passos 1 a 4 do SKILL.md).
2. Escrever `edit.json` com as cenas (mesmos componentes e regras do Palco), `captions.words` copiadas do `words.json` (só `word/start/end`), zoom e `comp`.
3. `Edit.tsx` do vídeo (copiar de `src/videos/2026-09-27_paciente-brava-botox/Edit.tsx`, trocar os nomes) e registrar no `src/Root.tsx` as duas composições: `<Nome>Edit` (duração = `tl.DURATION`) e `<Nome>Collect` (1 frame).
4. `python tools/collect_sfx.py <slug> <Nome>Collect`.
5. Conferir com `stills.py <slug> <Nome>Edit ...` e renderizar com `render.py <slug> <Nome>Edit`.
6. Avisar o Paulo que o vídeo está no Estúdio para ajustes finos.

Ajuste pedido por mensagem num vídeo que já tem edit.json: editar o **edit.json** (não o código), mexendo só no item pedido.

## Legenda (padrão)
Depois dos cortes (tighten), gere a legenda transcrevendo o ÁUDIO JÁ CORTADO: `python tools/recaption.py <slug> --names "Kylie Jenner, BAFTA, ..." --fix "Courtney=Courteney"`. Os tempos saem no relógio da edição e nenhuma palavra dita some. Passe só nomes próprios em `--names` (o roteiro inteiro como pista fazia a legenda mostrar o roteiro em vez da fala). A transcrição da gravação inteira pode INVENTAR repetições (no piloto das famosas inventou uma segunda tentativa que não existia): confira trechos suspeitos retranscrevendo só a janela.

## Tela de projetos
`/` = projetos (cartões com miniatura, duração, cenas, última edição e "Baixar vídeo" se já tiver render); `/?v=<slug>` = editor; botão de grade no topo volta. Todo vídeo com `edit.json` vira projeto (já salvo).

## Edição no Estúdio
- Trilhas de som: "+ Trilha", duplo clique no nome renomeia, mudo por trilha, apagar (os sons vão para outra trilha); arrastar um som para cima/baixo troca de trilha.
- `Ctrl+C` / `Ctrl+X` / `Ctrl+V` copiam, recortam e colam som ou cena no cursor (mesma trilha); `Ctrl+D` duplica.
- Seleção múltipla: `Ctrl`/`Shift` + clique soma ou tira cena, carimbo ou som; `Shift` + arrastar no vazio de uma trilha laça o que COMEÇA naquele trecho (a música longa não vem junto); `Ctrl+A` pega tudo. Arrastar um item do grupo move todos (cada som fica na sua trilha; um só passo no Ctrl+Z); `Delete` apaga todos; `Alt` + setas empurra todos; `Esc` limpa. Copiar/colar/duplicar ainda é de um item só. Com 2+ itens, o painel da direita vira o **painel de grupo** (`estudio/GroupPanel.tsx`): ganho em dB para todos os sons juntos (proporcional, mantém a diferença entre eles; arrastar = um passo no Ctrl+Z), botões ±1/±3 dB, mudo em todos e apagar todos. O ganho mostrado é lido dos volumes reais (mediana de vol/base).
- Apagar trilha: um clique (Ctrl+Z desfaz; o `confirm()` do navegador é bloqueado no painel do app e o "clique duas vezes" confundiu o Paulo). Trilha "Música..." sai com a música; outras passam os sons para a trilha vizinha.
- Botão direito (menu `.ctx` no Timeline.tsx): em cena/som = copiar, recortar, duplicar, colar, silenciar (som) e apagar; em palavra, zoom e marcador = apagar; com vários selecionados = apagar todos; no vazio = colar aqui. Não usar `confirm()`/`prompt()` novos no Estúdio.
- Arquivos de componente do Estúdio só exportam componentes (utilidades em `estudio/util.ts`), senão cada mudança no código recarrega a página.

## Salvamento e mudanças por fora
- Vigia do vídeo (App.tsx): a cada 1 s confere o `<video>` da prévia; 3 s seguidos com erro, sem fonte ou sem imagem (fora do carregamento) recriam o Player no mesmo quadro. O servidor guarda as 4 prévias contínuas mais recentes (apagar na hora quebrava outra aba aberta).
- Cursor: alça dentro da régua (sempre visível); segurar e arrastar a alça ou a régua faz o scrub.
- O Estúdio salva sozinho 0,8 s depois de cada mudança (histórico: uma cópia por minuto em `out/<slug>/edit-history/`).
- Se o Claude mudar o `edit.json` por fora (scripts), o Estúdio percebe pela data do arquivo e recarrega sozinho quando não há mudança pendente. **Não edite o `estudio/*.tsx` enquanto o Paulo estiver usando**: o recarregamento da página já foi causa de perda de edição.
- Prévia `lite`: sem a cópia desfocada do vídeo no fundo (desfocar vídeo ao vivo derrubava o Player para ~16 quadros/s).
- **Prévia contínua** (`/api/editproxy/<slug>?voice=`): o servidor monta UM arquivo com os cortes e a voz tratada (`public/videos/<slug>/editproxy-<hash>.mp4`, refeito quando os takes ou a voz mudam) e o Player toca só ele (`video.preview`, nunca salvo). Trocar 18 arquivos nos cortes fazia o player voltar e repetir trechos ("nunca pediu botox, nunca pediu botox"). Medido: 29,8 quadros/s e zero voltas. O render continua take a take no master.

## Corte justo (respiradas e pausas) · padrão
Detector por TIPO de som (`tools/pauses.py`): fala vozeada tem tom (autocorrelação 80 a 400 Hz), s/f/x são chiado agudo, respiração é sopro sem tom. Acha o começo exato da palavra seguinte, mesmo quando é baixinha ("Nos", "e", "Ela"). No Estúdio: botão **Respiros** (marcas laranja na trilha Voz) + "Cortar respiros" (chama `tools/tighten.py` + `retime.py --map-words` + `snaps.py`). Takes de partida ficam em `segments.base.json`. Na linha de comando:
```
python tools/tighten.py <slug> --dry                  # lista as pausas (volume 15 dB abaixo da fala, >= 0,3 s)
python tools/tighten.py <slug> [--skip 8.52,27.76]    # corta deixando 0,1 s de respiro
python <scripts>/cut.py <slug> --fix ...              # refaz o words.json (sem --split-gap)
```
Confira o texto final do cut.py: palavra curta e fraca colada na pausa ("e", "a", "Nos", "Ela") some se o corte comer ela; ponha o início daquela pausa em `--skip`. Confirmação forte: retranscrever o áudio cortado e comparar com o original (feito no piloto: 0 palavras perdidas).
No EditRenderer os takes entram em **corte seco** (xfade 0) e a voz tem fade de 2 quadros em cada corte; o pulo grande de imagem é escondido por `zoom.snaps` só nos cortes em que a cabeça mexeu muito (meça a diferença de imagem entre o último quadro antes e o primeiro depois).
Se o vídeo já tem edit.json: `python tools/retime.py <slug> <segments_antigo.json>` reposiciona cenas, sons, zoom e legenda nos tempos novos (guarde o segments.json antigo antes).

## Futuro (web)
O Estúdio é um app React (Vite) com a API no próprio servidor (`vite.config.mts`). Para a web: a mesma interface, a API vira back-end (salvar/abrir docs, transcrição, render) e a API do Claude gera o edit.json. Antes de vender a terceiros: conferir licença do Remotion (empresa/produto) e dos sons.

## Conferir quadros pelo tempo da edição
`python tools/estills.py <slug> <Comp>Edit 1.3 7.4 16.0 ... --scale 0.4 --crop 980` (um bundle e um navegador para todos; ~1 min para 10 quadros; `--crop 980` mostra só o palco). O `stills.py` da skill usa o tempo da GRAVAÇÃO; para vídeo montado por edit.json, use este.
Script que monta o edit.json (ex.: `tools/build_erros.py`) grava `sounds: []`: rode o `collect_sfx.py ... --all` depois de cada remontagem.

## Corretivo na legenda (palavra falada errada)
Quando o Paulo fala uma palavra errada e quer mostrar a correção (ex.: falou "reunião" querendo dizer "região"): na palavra de `captions.words`, `word` = a certa e `said` = a falada (`{"word": "região,", "said": "reunião", ...}`). A legenda mostra a falada, risca de vermelho e escreve a certa do lado, em vermelho (SeamCaptions).
Legenda: um grupo nunca fica por cima do começo do próximo (frase colada depois de um corte).

## Onde fica o vídeo pronto
O topo do editor mostra sempre o último render de `out/<slug>/` (mesmo se o render foi pelo terminal ou o servidor reiniciou), com **Baixar** e **Mostrar na pasta** (API `/api/reveal?p=`, abre o Explorer com o arquivo selecionado). A tela de projetos tem "Baixar vídeo" e "Pasta". Pelo navegador do app o download pode cair numa pasta que o Paulo não acha: prefira "Mostrar na pasta".

## Ferramentas de editor (2026-09-28, inspiradas em Premiere/After Effects/Descript)
- **Editar pelo texto** (`T`, botão T no topo): a fala como texto; clique vai para a palavra, arrastar ou Shift+clique seleciona, `Del` tira o trecho do VÍDEO com as pausas em volta (ripple). Servidor: `/api/cutrange/<slug>` → `tools/cutrange.py <slug> a b` (segundos da edição; tira as palavras inteiras do trecho da legenda e roda `retime.py --map-words`). Cada corte guarda segments+edit em `out/<slug>/cuts/<stamp>/`; "Desfazer corte" (`/api/uncut`, `cutrange.py --undo`) volta idêntico.
- **Trilha Vídeo (clipes da gravação, como no CapCut)**: um bloco por take do segments.json, com a onda da GRAVAÇÃO (`/api/srcpeaks/<slug>`). Puxar a borda estica/encolhe o take; o trecho revelado aparece em amarelo (dá para ver o fim da palavra). Botão **Ímã** (padrão ligado): tudo o que vem depois anda junto (cenas com seus `...At`, sons, zoom, marcadores, legenda); desligado, só a legenda acompanha. Servidor: `/api/trimclip/<slug>` → `tools/trimclip.py <slug> <i> <a|b> <delta> [--solo]` (mesma pilha do "Desfazer corte"). Na emenda: o que começa nela vai com o clipe seguinte, palavra que termina nela fica; bordas de cena e zoom seguem o corte. **Palavra cortada no fim do take** ("certo", "resolvida", "três"): medir a energia do master depois de `b` e esticar até o silêncio antes da próxima fala (+ ~0,4 s de respiro), com `trimclip.py`.
- **Trecho I/O**: `I` entrada, `O` saída (faixa azul), `Shift+Del` ou "Cortar trecho" tira do vídeo (mesmo cutrange). Serve para sílaba que não está na legenda (ex.: o "vá").
- **Lâmina** `S`: divide a cena ou o som escolhido no cursor (sem escolha, a cena principal sob o cursor); a segunda metade leva os tempos internos corrigidos (`shiftInner`).
- **Marcadores** `M`: bandeira amarela na régua + nota no painel da direita; ficam em `edit.json` → `markers[{id, t, note, done}]`. Quando o Paulo pedir ajuste "nos marcadores", leia essa lista.
- **Safe zone** `G` (botão celular): faixas onde a interface do Instagram cobre (topo 250, base 450, coluna direita de y 1000).
- **J/K/L** (volta/pausa/avança; repetir dobra até 4x), `Home`/`End`, `\` cabe o vídeo inteiro na timeline.
- **Versões** (botão relógio): lista as cópias automáticas (uma por minuto, 60 últimas) e volta para uma (a atual fica guardada).

## Biblioteca de músicas
`python scripts/fetch_music.py` varre as categorias do Mixkit (o site não pagina; cada gênero/clima/tag mostra até 36) e baixa tudo para `sfx-lib/mixkit-music/<id>.mp3` + `index.json` (`title, author, tags, rank, dur`; `rank` = ordem da página principal, as mais populares primeiro). Uma página a cada 3 s, 2 downloads em paralelo; pula o que já existe.
No Estúdio: Biblioteca > aba **Músicas** (busca, filtros de estilo, clique ouve por `/api/musicfile?id=`). O **+** chama `/api/musicadd`, que copia a música inteira para `public/music/mixkit-<id>-<nome>.mp3` normalizada em -26 LUFS e põe no cursor, na trilha "Música" (criada se faltar), vol 0.25, fade no fim. O acervo fica fora do `public/` porque o render copia o `public/` inteiro.
Player do Estúdio: `numberOfSharedAudioTags={16}`. Com o padrão (5), voz + música + efeitos encavalados derrubavam o player no meio do vídeo (bets, 39 s).

## Desempenho e limites (2026-09-28)
- **Public enxuta:** o Remotion copia a pasta `public` inteira a cada render (6 GB com os vídeos brutos de todos os projetos: o render ficava 8+ min em "Copying public dir" e às vezes parava). `render.py` monta `out/.pub/<slug>-render` com hardlinks só do que o vídeo usa (sfx, brand, fontes, música, `videos/<slug>/img` e todo arquivo `videos/...` citado no edit.json, sem prévias e sem o master quando há vídeo cortado) e passa `--public-dir`. O `tools/estills.py` faz o mesmo (`-stills`). Render do botox: 39 s até os quadros (antes 8+ min).
- **Temporários** dos renders do Estúdio vão para `out/.tmp` (TEMP/TMP no spawn), não para o C:. As cópias `remotion-webpack-bundle-*` antigas podem ser apagadas (são refeitas a cada render).
- **Sons no Player:** `numberOfSharedAudioTags={0}` (cada som cria o próprio áudio, sem limite). Com 16 a cena dos anos girando passava do limite ("Tried to simultaneously mount 17 <Html5Audio />") e o player congelava; com 64 o player esperava ~0,5 s a cada salto enquanto o vídeo da prévia seguia sozinho, e o trecho repetia/voltava. Com 0: sem travamento, 30 quadros/s depois de cada salto. Para testar play pela automação precisa de um clique real (gesto do usuário).
- **Tempos em props:** o registry converte de segundos para quadros as chaves `at`, `at1`, `...At`, `...At2` e `dur`. Qualquer outra chave de duração (`signDur`, `typeDur`, `drainDur`, `writeDur`, `every`) é em QUADROS.

## Layout vivo (existe, mas REPROVADO pelo usuário)
`src/lib/live-layout.tsx` + `layouts` no edit.json alterna tela dividida / apresentador em tela cheia / bolha no canto. Testado em 2026-09-28 e reprovado ("não gostei da bolinha; a legenda embaixo não ficou bacana"). Não usar: o vídeo é sempre tela dividida com a legenda na emenda; o dinamismo vem das cenas.

## Download do vídeo pronto (bug corrigido em 2026-09-28)
Cada render sobrescreve o mesmo `out/<slug>/<slug>-<comp>.mp4`; o `/api/file` não mandava cabeçalho de cache e o navegador entregava a cópia ANTIGA no "Baixar" (o Paulo achou que o render estava errado). Agora: `Cache-Control: no-store`, link com `&v=<mtime>`, sempre o render mais novo por data (não o primeiro em ordem alfabética), e aviso **Desatualizado** (amarelo) no editor e no cartão do projeto quando `edit.json`/`segments.json`/`words.json` mudaram depois do render (ou há mudança não salva).
