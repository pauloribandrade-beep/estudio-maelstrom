# Escolha de takes (gravação corrida com repetições)

Adaptado de talking-head-reel (MIT).

Quem grava fala uma frase, não gosta, fala de novo, segue quando acerta, e às vezes recomeça tudo. A gravação é o roteiro lido duas ou três vezes, com as versões boas mais para o fim. O `takes.txt` é o mapa disso.

## Procedimento
1. Tenha o roteiro (em `Reels/roteiros/`, ou reconstrua pelo take mais completo). Numere as frases.
2. Percorra o `takes.txt`. Marcadores mandam: `OK` entra, `XX`/`mk`/`re` não entram.
3. Para frases sem marcador (`..`), marque cada segmento com o número da frase que ele tenta dizer.
4. Para cada frase, escolha:
   - a que bate com o **sentido** do roteiro (a fala ao vivo costuma ser melhor que o texto);
   - fluente, sem tropeço dentro da frase, sem muleta que ele cortaria ("é...", "tipo");
   - a mais tardia, se o resto empatar;
   - dentro de uma sequência sem reinício, a sequência inteira como um take só.
5. Emendas de outra sequência só para frases curtas (uma piada, uma CTA) e se o enquadramento for o mesmo; o zoom seco esconde pequenas diferenças, mudança de luz não.
6. Cortes pelas palavras (`words.py`): `a` = início − 0,10 a 0,15 s; `b` = fim + 0,20 a 0,30 s, nunca depois do início da palavra seguinte. Palavra do whisper suspeitamente longa (um "mas" de 3 s) esconde a pausa: ache o som com `ffmpeg -ss <t> -t <d> -i ig1080.mp4 -af silencedetect=noise=-32dB:d=0.25 -f null -` e comece logo antes.
7. Pausa > 1 s dentro de um take: divida. < 0,5 s: mantenha.
8. Frase do roteiro que ele não disse em nenhum take não entra. Diga isso no portão.

## Exemplo real do teste (voz sintética)
```
0   XX    0.00    6.82  Vou pensar, doutora. E você responde, fica à vontade.
1   mk    8.80    9.76  Corta.
2   OK   11.94   17.64  Vou pensar, doutora. E você responde, fica à vontade.
3   OK   18.72   21.44  Pronto. Ela não volta.
4   mk   23.84   24.28  Salva.
```
Escolha: um take `11.82 -> 21.70` (segmentos 2 e 3 são uma sequência aprovada por um SALVA). O segmento 0 foi descartado pelo CORTA.
