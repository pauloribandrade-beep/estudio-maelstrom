# Sound design (efeitos cinematográficos)

Método adotado em 2026-09-30 depois de o Paulo reprovar efeitos "mal posicionados e mal escolhidos"
(projeto Half-Life 3). Base: as referências de áudio das skills públicas motion-video-kit
(echris6) e motion-design (florian-ivadolabs), adaptadas.

## 1. Primeiro o mapa de eventos, depois o som
Liste cada MOVIMENTO da tela com início e fim reais, lidos do código da cena (entrada em N quadros,
`focus` entra/sai em 16 quadros, `recedeAt` até `darkAt` etc.), em segundos da edição. Um som por
movimento: cresce, recua, volta, some, corta. Movimento sem som = buraco; som sem movimento = ruído.

## 2. Posicionar pelo PICO MEDIDO
`python Reels/editor/tools/sfx_peak.py <arquivos> --at <evento>` dá o `start`.
- Chegada / algo que cresce e ocupa a tela: build-up (whoosh que sobe ou swell reverso) com o PICO
  no fim do movimento.
- Recuo / saída: whoosh curto começando junto do movimento (pico nos primeiros 0,1 s).
- Corte seco / título: batida com o pico exatamente no quadro do corte; o que vem antes (riser,
  braam) cresce até ali.
- Algo que encolhe até sumir: som que DECAI durante todo o movimento e acaba quando some (ex.:
  jato decolando, invertido e recortado no tamanho exato).

## 3. Escolher
- Som de efeito, nunca trecho de música (música dura demais e, cortada curta, soa quebrada; o
  Paulo tirou o "mission passed" do GTA por isso). Temático só se for efeito (o segredo do Zelda funciona).
- Whoosh limpo: pouca energia < 150 Hz (sfx_peak mostra "grave"); > 50% soa como boom repetido.
  Aplicar highpass ~120 Hz e lowpass ~11 kHz.
- Cada movimento com um som diferente; nada repetido perto.
- Tema do vídeo (ex.: Half-Life: HEV, medkit, Cidadela) só onde faz sentido, sem exagero.

## 4. Tratar
- Tudo em loudnorm (-20 a -23 LUFS, TP -8) antes de entrar; volume no edit.json.
- Espaço: reverb curto (`aecho`) nos whooshes.
- Cauda longa (título, impacto final): convolução com IR gerado (ruído com decaimento exp(-0,75 t),
  8 s) via `afir=irnorm=-1`, wet ~0,05; conferir o decaimento (-6 dB em 1 s, ~-30 dB em 6 s).
- Conferir no mix offline (ffmpeg amix com os mesmos start/vol/trim/fade do edit.json): o corte
  tem que subir ~8 dB sobre o que vem antes; efeito nunca passa da voz onde há fala.

## Fontes
Sonniss GDC (sfx-lib/sonniss-gdc2026: Horn Braams, Bass Drops & Downers, Air Designed...),
Freesound CC0 (busca: `...&f=license:"Creative Commons 0"`, prévias `-hq.mp3`), sons do próprio
jogo quando o tema pede (VPK do Half-Life 2 via pacote `vpk`). Anotar tudo em FONTES.txt.
