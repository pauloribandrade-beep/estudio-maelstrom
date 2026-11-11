# Beats: o que mostrar quando você fala o quê

Pergunta de cada frase: o que ele acabou de fazer a pessoa imaginar? Mostre isso, na palavra. Frase que não pede nada fica limpa: o silêncio visual faz o próximo beat funcionar. Sempre partir das marcações do roteiro (`[TEXTO NA TELA]`, `[IMAGEM]`, `[ZOOM]`, `[CORTE]`).

| Você diz | Mostre |
|---|---|
| o gancho (primeiros segundos) | `TitleTop` com o título do roteiro, palavra-chave sublinhada |
| a resposta ou hábito errado | `StrikeBig` riscando na palavra seguinte + `whoosh` |
| uma virada ("não é X, é Y") | `Big` com Y e sub curto, ou `StrikeBig` X |
| a frase certa que ela deve dizer | `QuoteCard`, uma linha por trecho, a última `big` |
| uma lista (situação 1, 2, 3) | `Big` com o número e o nome da situação, um por vez; ou `StampList` se for lista de erros |
| um objeto, conceito ou cena (preço, agenda, WhatsApp, consultório vazio) | `Cutaway` com animação vetorial curta, ou foto livre com Ken Burns |
| uma notícia (hype, até 10 dias) | `NewsCard` com fonte e data reais; ou `Cutaway` com o print |
| um número real | `Big` no número ou até 0,2 s depois |
| a mensagem digitada / direct | `PromptCard` com o texto real |
| um sentimento | `BigEmoji` no canto de reação + push-in ao mesmo tempo |
| a frase que importa | `PUSHES` (1.10 a 1.15) |
| a CTA de palavra-chave | `KeywordCta` do momento em que ele fala a palavra até o fim |

Ritmo: 1 beat a cada 3 a 6 s; nenhum vídeo parado mais de 5 s (snap, card, troca de tela ou push). Um card por vez; um item por vez no canto de reação.

## Tela dividida
- **Jeito 1 (padrão):** do início até ~3 a 6 s, `SplitScreen` com o viral **com áudio** (`viralVolume` 1) e você em silêncio com cara de crítica; `TitleTop` no meio (y ≈ 1000). Depois, sai da divisão (termina a Sequence do `SplitScreen`) e segue o narrativo com você em tela cheia.
- **Jeito 2:** viral mudo (`viralVolume` 0) do início ao fim, você narrando embaixo; a lição final pode voltar para tela cheia.
- Os takes seus continuam vindo de `TakesVideo`; o viral é `public/videos/<slug>/viral1080.mp4` (baixado com a função Remix do Instagram ou pelo usuário).
- Nunca atacar a pessoa do vídeo viral; comentar o comportamento.
- Durante a divisão, a legenda padrão (base em y 1470) cai em cima do seu rosto na metade de baixo. Se você falar durante a divisão, use `<ReelCaptions bottom={1920 - 1060} .../>` só nesse trecho (legenda logo acima da faixa vermelha) ou esconda a legenda enquanto o viral fala.
- Na sua cópia de baixo use `muted` (o áudio vem da cópia em tela cheia), senão a fala dobra.

## Troca de tela (Cutaway)
- 1,5 a 3 s, entra no substantivo que ela ilustra, sai antes da próxima frase.
- Vetor desenhado em código (etiqueta, agenda, balão de WhatsApp, cadeira vazia, gráfico simples), nas cores ZALE, é o padrão: barato, sem direito autoral, com cara de marca.
- Foto: só do usuário ou de banco livre (Pexels, Unsplash), salva em `public/videos/<slug>/`.
- Imagem gerada por IA (Higgsfield etc.): só se o usuário pedir; não é padrão.
