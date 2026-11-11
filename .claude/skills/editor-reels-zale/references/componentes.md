# Componentes (API resumida · não reler o código de src/lib)

Tempos: `tl.E(seg)` = frame da edição de um segundo original; `tl.life(de, até)` = duração em frames; `tl.rel(t, de)` = frame relativo dentro de uma Sequence que começa em `de`. Envolva cada elemento em `<At from={s} to={s}>` (`const At = makeAt(tl)`). Todo componente recebe `life` e entra/sai sozinho.

## Linha do tempo (`lib/timeline.tsx`)
| API | Uso |
|---|---|
| `makeTimeline(spec)` | `tl` com `E, rel, life, DURATION, SPEECH_FRAMES, OUTRO_FRAMES, SEGS` |
| `makeAt(tl)` | componente `<At from to name>` |
| `useZoom(tl, SNAPS, PUSHES)` | escala do vídeo; aplicar em `<AbsoluteFill style={{transform:`scale(${zoom})`, transformOrigin:"50% 29%"}}>` |
| `SNAPS: [seg, 1.0 \| 1.1 \| 1.12][]` | troca seca de enquadramento em todo corte e na maioria dos inícios de frase (uma a cada 3 a 4 s), alternando |
| `PUSHES: {at, z, up?, until, down?}[]` | aproximação lenta (1.10 a 1.15) na frase que importa; 2 a 6 por vídeo |
| `<TakesVideo tl src style?>` | os takes colados + último frame congelado no outro |

## Palco (`lib/palco.tsx`), o modo padrão
Palco = y 0 a `SEAM` (980); área útil y 170 a 890. Apresentador de 980 a 1920.
| Componente | Props | Quando |
|---|---|---|
| `PalcoLayout` | `me, meBg?, fit?{scale, top}, zoom?, handle?, children` | a base do vídeo; `me={<TakesVideo tl src style={{objectPosition:"50% 28%"}}/>}`, children = cenas |
| `SeamCaptions` | `words, hot?[], size?=56` | legenda na emenda; fora do `PalcoLayout`, por último |
| `Snd` | `at?, name, vol?` | sons: pop tick tap whoosh thud ding click (volumes em `SFX_VOL`) |
| `BigType` | `title, sub?, size?=150, accent?, icon?, iconOff?` | frase de impacto ("3 a 5" / "perguntas antes") |
| `IconBadge` | `icon (lucide), label?, tone?` | um conceito com ícone grande |
| `ListStack` | `title?, items[{text, at}]` | lista numerada que empilha |
| `ChipGrid` | `title?, chips[{text, at}], cols?, mono?` | grade de itens |
| `ChatMock` | `title?, messages[{from, text, at, seen?}]` | conversa simples (prefira `PhoneChat`) |
| `TypeWindow` | `title?, text, startAt?, cps?, after?` | janela digitando (a frase certa, um prompt) |
| `Stamp` | `text, at?, y?, size?=76` | carimbo vermelho por cima da cena |
| `Versus` | `left{title,lines}, right{title,lines}, rightAt?, win?` | avulso x protocolo, pressão x condução |
| `Ring` | `value, max, label, suffix?` | anel contando (só número real) |
| `KeywordPill` | `keyword, sub?` | CTA "comenta “X”" |
| `FollowCard` | `handle, clickAt?` | card Seguir que vira Seguindo, com corações (outro) |
| `Radial` | `center, nodes[{label, at}]` | versão simples da órbita |

## Cenas ricas (`lib/palco-ui.tsx`)
Todas flutuam, têm push lento e entram com whoosh suave. `at` = frame relativo à Sequence.
| Componente | Props | Ilustra |
|---|---|---|
| `PhoneChat` | `contact?, messages[{from:"paciente"\|"clinica", text, at, seen?}], typingAt?` | direct/WhatsApp, "quanto é?", "vou pensar", visualizado |
| `AgendaWeek` | `title?, slots[dia 0-4][hora 0-5] (nome\|null), fillEvery?, emptyFlashAt?` | agenda cheia/vazia, horários ociosos piscando |
| `Dashboard` | `title?, kicker?, kpis[{label, value, suffix?}], bars?[{label, value}], highlight?` | indicadores, "você não mede nada" |
| `Funnel` | `stages[{label, value?, at}], leakAt?, leakIndex?` | contato → agenda → vem → fecha; onde vaza |
| `ProtocolStack` | `name, layers[{icon, text, at}]` | as camadas de um protocolo |
| `Proposal` | `title, items[], table?, condition?, anchorAt?, ctaAt?` | plano com preço de tabela riscado e condição; botão agendar |
| `TimelineDots` | `title?, points[{label, sub?, at}]` | retornos 30/90/180, jornada |
| `OrbitCards` | `center, logo?, nodes[{icon, label, at}]` | um conceito no centro e tudo que depende dele |
| `ClinicNote` | `title?="Ficha de avaliação", lines[{label?, text, at, dur?}], cps?, strikeAt?, icon?` | a pergunta/anotação da médica escrita na prancheta; risca a errada |
| `Cursor` | `path[[x,y]...], at, dur?, click?` | mão na interface: clica no botão, no horário |
| `VectorFace` | `mood?="calm"\|"angry", calmAt?, pointAt?, syringeAt?, bubbles?[{text, at}], caption?, coat?` | ilustração plana de uma mulher (não é retrato): brava/tranquila, `pointAt` = alvo pulsando entre as sobrancelhas (sem mão: o usuário achou a mão feia), balões de fala, seringa na glabela, rugas somem no `calmAt`; `coat` = jaleco |
| `EyeCloseUp` | `syringeAt?, calmAt?, caption?` | close do olho com a pálpebra tremendo (espasmo), seringa ao lado, tremor para no `calmAt` |
| `VideoScene` | `src, caption?, credit?, trim? (s), volume? (0 = mudo)` | trecho de vídeo num card (viral, react, clipe). Recorte antes com ffmpeg só o trecho e sem as sobreposições da fonte (ex.: `img/speed.mp4`) |
| `PhotoScene` | `src? \| srcs[{src, at}], caption?, credit?, frame?="polaroid"\|"card"` | foto de pessoa, lugar ou objeto (do usuário ou de `imagem.py`), zoom lento; `credit` obrigatório se a licença for CC BY/BY-SA |

Pessoa real sem foto livre (ex.: pesquisadora de uma história): use `VectorFace`, nunca foto de agência. Foto CC0 de médica aplicando já baixada em `public/videos/2026-09-27_paciente-brava-botox/img/doctor-performing-botox-injection.jpg`.

Fotos: `python scripts/imagem.py <slug> "termo em inglês" --n 4` baixa só licença livre do Wikimedia Commons para `public/videos/<slug>/img/`, grava `creditos.json` e uma prévia `_sheet.png` (olhe só a prévia). Vetor estilizado de uma pessoa (traços que a identificam, estilo ícone) pode ser desenhado em SVG; nunca tentar retrato realista de pessoa real.

Ícones: `import { Calendar, MessageCircle, ... } from "lucide-react"` (lucide.dev).

## Cenas narrativas (`lib/cenas-extra.tsx`, no edit.json por nome)
Tempos em s relativos à cena (`at`, `...At`, `dur`). Transição de entrada da cena: `enter` = `whip-left | whip-right | zoom | drop | flash` (variar).
| Componente | Props | Ilustra |
|---|---|---|
| `PhotoFocus` | `src, focus[x%,y%], zoom?, markAt?, name?, credit?, h?` | foto com zoom num detalhe; `markAt` desenha o círculo vermelho (só aparece ao riscar) |
| `Flashback` | `src, year, name?, age?, focus?, yearAt?, nameAt?, ageAt?` | polaroid de um ano passado caindo na mesa; ano escrito, selo da idade |
| `BeforeAfter` | `before, after, labels?, wipeAt?, dur?, focus?, focus2?` | cortina antes/depois; recorte cada foto para o rosto cair na sua metade |
| `CountUp` | `src?, to, from?, plain?, prefix?, suffix?, countAt?, dur?, label?` | número contando por cima de foto (só número real) |
| `Reactions` | `items[emoji], count?, zone?="all"\|"sides", dir?="up"\|"down"` | sobreposição: a internet reagiu |
| `DictEntry` | `word, phon?, cls?, def, typeAt?, cps?` | verbete de dicionário (termo novo) |
| `SwellFace` | `steps[{at, label}]` | rosto inchando a cada aplicação |
| `LipsShrink` | `shrinkAt, to, caption?` | boca diminuindo (dissolver) |

## Cenas de metáfora (`lib/cenas-metafora.tsx`) · PREFERIR aos cards de biblioteca
O usuário achou os cards (BigType, ChipGrid, ListStack, PhoneChat...) "genéricos, iguais em todo vídeo". Cada fala vira um OBJETO reconhecível com ação física. Crie cenas novas aqui quando a metáfora pedir; não repita a mesma cena de vídeo para vídeo sem motivo.
| Componente | Props | Ilustra |
|---|---|---|
| `ErrorCards` | `title?, flipAt?, chainAt?, focus? (0-2), label?, labelAt?` | 3 cartas desvirando (erro 1, 2, 3) com selo X; corrente liga; `focus` destaca uma (capítulos de lista) |
| `ConsultQuestion` | `question, askAt?, askDur?, replyAt?, shotAt?` | você x paciente: pergunta digitada no balão, celular dela com feed rolando e print |
| `MenuCard` | `items[{name, price?, at?}], title?, mode "hand"\|"blur", giveAt?, pickAt?, pick?, blurAt?, keep?` | cardápio de restaurante; passa para a paciente; ou embaça tudo menos o preço |
| `PriceTrap` | `price?, caption?, captionAt?, baitAt?, snapAt?, snapLabel?` | ratoeira com etiqueta de preço como isca, fecha e prende |
| `HangingTags` | `tags[{label, price?, at}], strikeAt?, big?` | etiquetas penduradas balançando (comparar preço); risca |
| `CloneGrid` | `label?, zoomAt?` | o seu card se perde numa grade de iguais (só mais uma opção) |
| `Receipt` | `title?, lines[{name, price?, at, strikeAt?}], keep?, keepAt?, keepLabel?` | notinha imprimindo linha a linha; risca itens; circula o que sobrou |
| `RouteMap` | `stops[{label, at}], doneAt?` | mapa com estrada e ponto andando pelas paradas do plano |
| `SyringeSpot` | `revealAt?, stops?[{label}], doneAt?, label?` | seringa sozinha no foco; afasta e vira uma etapa do plano no mapa |
| `PollCta` | `question, options[], tapAt?, keyword?, kwAt?` | CTA em enquete (1, 2 ou 3) + "comenta" |
| `ShirtRack` | `sponsorAt?, penAt?, penDur?, lose?[]` | varal de 10 camisas genéricas; patrocínio aparece; caneta risca e as de `lose` perdem o patrocínio |
| `Decree` | `title?, subject?, typeAt?, cps?` | decreto oficial genérico com o assunto digitado (somar `Stamp` "proibido" na lane 1) |
| `MoneyVanish` | `label?, stackAt?, labelAt?, vanishAt?` | maços de dinheiro empilham com rótulo; se desfazem e o rótulo é riscado |
| `ShirtSpot` | `spotAt?, label?, labelAt?, emptyAt?` | holofote no peito de uma camisa; etiqueta aponta; patrocínio some |
| `FaucetSource` | `label?, labelAt?, closeAt?, ask?, askAt?, jar?` | torneira (a fonte) enche o pote; fecha e o pote esvazia; pergunta |
| `ClinicStreet` | `at?, every? (frames), n?` | fachadas de clínica caindo uma a uma |
| `PlugAgenda` | `plug?, pullAt?, emptyAt?` | plugue "anúncio" alimenta a agenda; puxado, a agenda apaga e esvazia |
| `OneLegStool` | `leg?, wobbleAt?, fallAt?` | banquinho de uma perna com o caixa; balança e tomba |
| `CrackVault` | `crackAt?, risk?, riskAt?` | cofre recebendo moedas; rachadura cresce no chão |
| `ContractFlip` | `title?, signAt?, flipAt?, back?` | contrato assinado vira e o verso é o "risco" |
| `OneRope` | `rope?, sign?, snaps[{at}]` | placa da empresa pendurada por uma corda; fios rompem |
| `StableTable` | `top?, typeAt?, legs[{label, at}], weak?, weakAt?, removeAt?` | mesa de várias pernas (REPROVADA: "sem cor"; usar `FlowJar`) |
| `PieCta` | `title?, slice?, pullAt?, askAt?, cta?, ctaAt?` | pizza do faturamento; a fatia principal sai; "?" e "comenta aqui" | (REPROVADA: "slide de pizza, feio, sem cor"; usar `JengaCta`)
| `FlowJar` | `title?, typeAt?, pipesAt?, sources[{label, at, color?}], weak?, weakAt?, removeAt?` | pote enchido por vários canos coloridos (camadas de cor); o cano fraco (vermelho) fecha com X e o pote segue cheio. Com som de água (`pour_fill.wav`) |
| `JengaCta` | `main?, pullAt?, ask?, askAt?, cta?, ctaAt?` | torre de Jenga em madeira; o bloco vermelho sai, a torre assenta e balança; "?" e "comenta aqui ↓" (sons Freesound de Jenga) |

## Cenas de metáfora do retorno (`lib/cenas-retorno.tsx`)
Objetos que voltam no fim para fechar a história (cartão de retorno, lista de contatos, ficha).
| Componente | Props | Ilustra |
|---|---|---|
| `PatientFiles` | `cards[{name, last}], fadeAt?, backAt?, back?, label?, labelAt?` | fichas de pacientes desbotando (não voltaram) / uma volta a ter cor com selo "voltou" |
| `StarFlip` | `askAt?, flipAt, ask?, answer?` | avaliação de 1 estrela "não gostou?" vira 5 estrelas |
| `Footsteps` | `stepAt?, steps?, every? (frames), gapAt, label?` | pegadas que param; o próximo passo é um contorno com "?" |
| `ReturnCard` | `fields[{label, value?, at?, dur?, focusAt?}], stampAt?, stamp?` | cartão de retorno em branco (cursor piscando) ou preenchido à mão + carimbo |
| `CalendarDrain` | `months[], pagesAt?, every?, drainAt?, drainDur? (frames)` | folhas do calendário voando + bateria "resultado" esvaziando |
| `PostIt` | `text, writeAt?, writeDur? (frames)` | post-it escrito à mão |
| `SponsoredAd` | `name?, postAt?, tapAt, bookedAt` | post patrocinado de outra clínica, toque em Agendar, "Agendado" |
| `TwoGauges` | `labels?, dropAt, dropAt2, caption?` | dois ponteiros caindo (preço, qualidade) |
| `Magnifier` | `label?` | lupa varrendo uma multidão (procurando pacientes novas) |
| `ContactList` | `pickAt?, pick?, note?, noteAt?, label?, labelAt?` | lista de conversas parada / um contato sai da lista com anotação |
| `TwoKeys` | `at1, at2, focus? (1\|2), focusAt?, labels?` | duas chaves numeradas (as duas coisas que mudam) |
| `BroadcastBlocked` | `blastAt, blockAt, text?` | megafone disparando promoção para vários celulares, barrado |
| `WhatsChat` | `contact?, text, typeAt?, typeDur (frames), sentAt, readAt?, typingAt?` | mensagem digitada no WhatsApp enquanto ele fala, enviada, lida, "digitando..." |
| `CommentCta` | `question, hint?, hintAt?` | CTA: caixa de comentário com cursor + "comenta aqui" |

## Básicos (`lib/cenas-basicas.tsx`)
| Componente | Props | Quando |
|---|---|---|
| `TitleTop` | `text, highlight?, y?, size?=64` | título do gancho nos primeiros 3 a 5 s (obrigatório) |
| `Cutaway` | `img? \| video? videoFrom? \| children, enter?="cut"\|"slide", kenBurns?=1.08, caption?` | a tela vira foto, vídeo ou animação (children) por 1,5 a 3 s e volta |
| `NewsCard` | `source, date?, headline, y?=990` | manchete de hype (fonte + data reais) |
| `KeywordCta` | `keyword, before?="Comenta", after?` | CTA da automação do direct, até o fim |
| `SplitScreen` | `viral, viralFrom?, viralVolume?=0, topH?=1080, me` | tela dividida; `me={<TakesVideo tl={tl} src={SRC} style={{objectPosition:"50% 30%"}}/>}` |

Animação vetorial: escreva um componente pequeno com `<svg>` + `spring/interpolate` (ex.: `PriceNoDiscount` em `videos/teste/Video.tsx`) e passe como children do `Cutaway`, ou use-o na faixa de cards.

## Base talking-head (`lib/overlays.tsx`, `lib/reel-overlays.tsx`)
Faixa de cards: `x=CARD_X (60)`, `y=CARD_Y (990)`, largura até 870.
| Componente | Props | Quando |
|---|---|---|
| `ReelCaptions` | `words, groupSize?=3, size?=66` | sempre, por último no JSX |
| `Big` | `x, y, text, sub?, size?=120, accent?` | número, palavra forte, frase de site |
| `StrikeBig` | `text, strikeAt, size?=96` | "não é X": aparece e é riscado |
| `QuoteCard` | `header, lines[{text, at, big?}]` | a frase certa, uma linha por trecho, última em destaque |
| `StampList` | `lines[{text, at}], stamp, stampAt` | lista que depois é descartada (carimbo + riscos) |
| `LogoRow` | `x, y, chips[{text?\|src?, label, at, bg?, fg?}], size?=130` | itens nomeados um a um (até 5) |
| `TreeCard` | `title, lines[]` | caminho/estrutura em fonte mono |
| `PromptCard` | `prompt, cps?, startAt?, after?` | texto sendo digitado (mensagem de direct, por exemplo) |
| `Takes` | `stills[{src, label, at}]` | polaroids de outras tentativas |
| `BigEmoji` | `emoji, size?, x?, y?` | um sentimento, no canto de reação (x 720 a 1040, y 240 a 600) |
| `BigLogo` | `src, bg?, size?` | um nome que deve aparecer sozinho |
| `EndCard` | `name, line, url` | cartão final sobre o frame congelado (alternativa ao `KeywordCta`) |
| `Sfx` | `at (frame), src, vol` | `tap.wav` 0.22 nos snaps; `pop.wav` 0.3 chips; `thud.wav` 0.45 destaque; `whoosh.wav` 0.3 risco/troca; `ding.wav` 0.35 vitória |

`Meme`, `GitHubCard`, `RecBadge`, `HeroChips` existem mas não são padrão da ZALE.

## Constantes (`lib/theme.ts`)
`ZALE.red #D82810`, `ZALE.redBright` (texto vermelho sobre preto), `ZALE.ink`, `ZALE.white`; `SAFE` (topo 250, base 450, direita 130; conteúdo entre x 60 e 930, y 250 e 1470).

## Diorama 3D (`lib/cenas-3d.tsx`) · estilo "profundidade" (usuário, 2026-09-28)
Objetos com volume (Fluent Emoji 3D da Microsoft, MIT, 149 em `public/fluent3d/<nome>.png`; lista com `ls public/fluent3d`) num cenário com chão em perspectiva, luzes desfocadas (paralaxe) e sombra de contato; a CÂMERA anda entre pontos, aproxima e mergulha no fim (a próxima cena chega de longe). Tudo por dados no edit.json:
| Prop | Formato |
|---|---|
| `objs` | `[{src, x, y, size?, at, outAt?, z? (0 frente..1 fundo), label?, labelAt?, color?, fx? (shake/pulse/spin/bow/shrink/grow/fall/glow), fxAt?, flip?, id?, photo?, w?, h?}]` · `src` = nome do fluent3d ou caminho de imagem (foto: `photo: true`) |
| `cam` | `[{at, x, y, zoom?, dur?}]` · o palco mostra ~1080x720 em volta do ponto; centro da tela y 530 |
| `chips` | `[{text, x, y, at, color?, img? (objeto 3D ao lado; NÃO usar "icon", reservado ao lucide), outAt?, strikeAt?}]` |
| `bubbles` | `[{text, x, y, at, tail? "left"/"right", outAt?, w?}]` |
| `links` | `[{from, to, at, color?, dashed?, cutAt?}]` (ligam `id`s) · `moves`: `[{id, at, x, y, dur?, arc?}]` (objeto passa de um lugar a outro em arco) |
Regras: chips e rótulos até y ~800 com zoom <= 1,1 (mais baixo encosta na legenda); objetos em diagonal com a câmera subindo, texto ACIMA do objeto e o anterior saindo (`outAt`). Sons: um por elemento; depois do collect, tirar os que caem a < 0,1 s um do outro. Aprovado como direção ("está indo pro caminho certo"); o usuário quer ícones em tudo e nada de texto gigante solto nem caixa grande vazia.

## Cenas em código com profundidade (`lib/clinica/cenas-indica.tsx`) · direção atual do usuário
Base: `DStage` (chão em perspectiva + luzes desfocadas) + `Cam` (chega de longe, aproxima devagar `push`, mergulha no fim rumo a `fx,fy`) + `fromDepth`/`Shadow`/`Glass`/`Chip` (exportados de `cenas-dinamicas.tsx`). Emoji 3D (Diorama) só como detalhe. Componentes do vídeo "paciente que ama e não indica", reaproveitáveis:
`LoveNoReferral` (celular: 5 estrelas + contador "indicações 0" tremendo) · `SameAskQueue` (a paciente sem culpa; o mesmo balão em fila até o fundo, desfocando) · `DissolveAsk` (balão digitado que se desfaz letra por letra) · `ElevatorForget` (elevador: "Claro!", portas de aço fecham, andar descendo) · `EmptyThought` (perfil de cabeça, pensamento vazio, lupa procurando, "?") · `MomentTimeline` (linha do tempo com ícones, câmera corre e o ponto dourado acende) · `MirrorMoment` (espelho oval dourado com brilho passando; chips riscados) · `CrowdFocus` (multidão desfocada; uma pessoa entra em foco; pergunta digitada) · `ThoughtContact` (sorriso, nuvem de pensamento com cartão de contato) · `BridgeGroup` (tábuas da ponte entre dois penhascos; câmera passa ao celular: mensagem pronta e grupo de 3) · `ContextCard` (ficha da equipe preenchendo campos) · `LuckTarget` (dado e aperto de mão riscados; alvo com 3 anéis acendendo com rótulos).
