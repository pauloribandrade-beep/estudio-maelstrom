# Transcrição e corte da voz (respiro e repetição)

A voz é o que mais denuncia edição ruim. Estas regras vieram de cortes reprovados: fim de palavra comido, take repetido que passou, picote no meio da frase.

## 1. Transcrever

`python .claude/skills/deadlock-videos/scripts/pedacos.py <slug> --termos "Lash, Grapple, Flog, Death Slam"`

- Divide a gravação nos silêncios e transcreve **cada pedaço sozinho**. O whisper corrido "engole" retomadas: junta duas versões da mesma frase numa só e você nunca vê a repetição.
- Sempre na **CPU** (int8). Na placa de vídeo derruba o FPS de quem está jogando. Se a pessoa estiver jogando, use `--modelo medium` ou espere. Pediu para parar: mate o processo na hora, antes de responder.
- `--termos`: heróis, habilidades e gíria do vídeo. É o que faz "Blies" não virar "Blizz".
- `condition_on_previous_text=False` já está ligado: sem isso ele inventa frase repetida que ninguém falou.
- Leia só o `pedacos.txt` (uma linha por pedaço). Nunca abra o json nem o áudio no chat.

## 2. Achar as repetições

`python .claude/skills/deadlock-videos/scripts/repetidos.py <slug>`

Aponta pedaço que começa igual a um dos seguintes, que repete 4 palavras de um vizinho, ou cuja 1ª palavra só começa mais de 1 s depois do início da fala (tentativa abortada que o whisper não escreveu). É pista: leia os pedaços apontados.

Repetição que parece repetição pode ser alucinação do whisper. Na dúvida, transcreva o trecho isolado de novo antes de cortar.

## 3. Escolher os takes (`out/<slug>/takes.json`)

- Frase repetida: fica a **ÚLTIMA versão inteira e fluente** (a pessoa esquenta). A anterior só ganha se a última tropeçar no meio.
- Tentativa abortada ("peraí", "de novo", "errei", frase que para no meio): sai inteira, inclusive o pedaço antes da palavra de erro.
- Improviso bom fica, mesmo fora do roteiro. Pausa que é piada ("um... milhão") fica.
- Frases seguidas sem reinício = um take só (uma emenda em vez de quatro).
- Bordas no bruto: começo ~0,12 s antes da 1ª palavra; fim no silêncio real depois da última. **O tempo de palavra do whisper erra 0,1 s ou mais**: palavras terminadas em -mento, -ção, -dade e "s" final são as que saem cortadas. Na dúvida, confira a energia do áudio na borda (ffmpeg `silencedetect` ou `astats`) e deixe ~0,15 s depois da última palavra.
- Nunca entra nada que não foi dito.

Mostre à pessoa uma tabela curta antes de montar (take, início-fim, o que é, por que saiu o anterior).

## 4. Tirar o respiro

`python .claude/skills/deadlock-videos/scripts/voz.py <slug>`

- Dentro do take, pausa > 0,30 s sai e sobram 0,11 s de cada lado. Entre frases o ritmo fica justo, sem respirada longa (respirada derruba a dinâmica do vídeo curto).
- **Não picote**: nada de detector de respiro por energia no meio da frase ("f" e "s" de começo de palavra parecem respiro e o corte come a sílaba). Pausa curta dentro da frase fica.
- Folga mínima de 0,04 s antes e depois da fala em cada emenda: a rampa de volume da emenda (8 ms na prévia, 1 quadro no render) come o ataque da palavra se o corte estiver colado.
- A voz fica como segmentos sobre a gravação inteira, um por trecho mantido. A pessoa precisa VER os cortes na timeline do Estúdio e ajustar à mão; nunca entregue um wav único já emendado.
- Depois de montar, leia o texto que o `voz.py` imprime inteiro, procurando frase dita duas vezes e frase cortada pela metade.

## 5. Quando a pessoa já mexeu nos cortes

- O `segments.json` dela é a verdade. Rodar o `montar.py` de novo faz fusão de 3 vias e mantém o que ela cortou; trecho que ela apagou não volta.
- Na dúvida sobre um corte dela, pergunte citando o tempo e a frase; nunca mexa no `segments.json` sem pedir.
- Não grave nada enquanto ela estiver com o Estúdio aberto mexendo: peça para pausar.
