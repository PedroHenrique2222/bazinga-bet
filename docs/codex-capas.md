# Prompt para o Codex — capas dos jogos do Bazinga BET

> Copie tudo abaixo da linha e envie para o Codex.

---

Você vai gerar **imagens de capa** para os jogos do site **Bazinga BET** (repositório atual). O Bazinga BET é um simulador de cassino **de brincadeira, sem dinheiro real**, feito por um grupo de amigos brasileiros. Cada jogo tem um "dono" da **Equipe BZG**: personagens-mascote que são objetos com rostinho (uma abóbora, uma pilha, um picles etc.).

**Gere só as imagens. Não altere nenhum arquivo de código** (HTML, CSS, JS). Eu mesmo integro as imagens depois.

## Formato (vale para todas)

- **Tamanho:** 768 × 1024 px (retrato, 3:4).
- **Arquivo:** `.webp`, qualidade ~85, com **no máximo 200 KB** cada.
- **Onde salvar:** `assets/capas/<id>.webp`. Os ids estão na lista abaixo, por exemplo `assets/capas/crash.webp`.
- **Área segura:** o personagem e a ação principal ficam nos **75% de cima**. Os **25% de baixo** devem ser mais escuros e simples (um degradê para preto), porque o site escreve o nome do jogo ali por cima.
- **Sem texto nenhum** na imagem: sem letras, números, logos nem marcas d'água. O site coloca o nome.

## Estilo (igual em todas, para parecerem uma coleção)

- Ilustração **cartoon 3D brilhante**, no estilo de arte de capa de jogo mobile: formas arredondadas, cores saturadas, luz de recorte (rim light) e brilhos.
- Personagens-objeto **fofos e carismáticos**: olhos grandes e expressivos, sorriso, bochechas rosadas e bracinhos pretos finos quando fizer sentido.
- **Fundo** com a **cor principal do jogo** (o hex está na lista), com brilho radial atrás do personagem e partículas e faíscas no ar. Deve combinar com o site, que é cinza-escuro (#0F1923) e vermelho (#F12C4C).
- Clima: **festa, sorte, adrenalina**. Moedas douradas, faíscas e confete são bem-vindos.
- Tudo **original**:
  - não imite a arte de jogos reais (Fortune Tiger, Sweet Bonanza, Aviator, Stake, Blaze etc.);
  - sem marcas reais;
  - sem pessoas reais;
  - **sem dinheiro de verdade** (cédulas). Use fichas e moedas douradas genéricas.

## As 15 capas

| id (nome do arquivo) | Nome do jogo | Cor principal | O que mostrar |
|---|---|---|---|
| `crash` | Canoa Furada | #0E7C86 | Uma canoa de madeira com um furinho e cara de pânico divertido, subindo num gráfico que dispara para cima. Água espirrando, ondas azul-claras embaixo, faíscas. |
| `double` | Double | #B5122E | Uma roda giratória com casas vermelhas, pretas e uma branca brilhando, vista em perspectiva, girando com rastro de luz. Moedas voando. |
| `mines` | Mines do Pikles | #1E8E4E | O **Pikles Gamer**: um picles verde com fone gamer, numa horta em grade de canteiros. Alguns canteiros abertos mostram diamantes azuis; um mostra uma bombinha cartoon. |
| `tower` | Lixeira do Linden | #B85A10 | O **Linden**: uma lata de lixo de metal simpática no topo de uma torre alta de caixas e sacos empilhados, com uma seta dourada apontando para cima. |
| `plinko` | Plinko da Abóbora | #5B2BB5 | A **Abóbora**: uma abóbora laranja redonda e sorridente, com folhinha verde, caindo por um tabuleiro triangular de pinos brilhantes. Várias mini-abóboras quicando. |
| `dice` | Dado 616 | #3D3D8F | O **616**: um dado branco com capacete militar verde e cara de durão simpático, rolando, com um "radar" de luz ao fundo. |
| `hilo` | HiLo do Panetone | #8A1C5C | O **Panetone**: uma fatia de bolo/panetone fofinha com cereja em cima, segurando duas cartas, uma com seta verde para cima e outra com seta vermelha para baixo. |
| `roulette` | Roleta | #8A1C1C | Uma roleta de cassino clássica (madeira e dourado) vista de cima em ângulo, com a bolinha branca correndo na pista e rastro de luz. |
| `blackjack` | 21 do Bogão | #0F5C3E | O **Bogão**: um pêssego grande, gordinho e sorridente, de gravata-borboleta, numa mesa de cartas verde, com duas cartas viradas para cima. |
| `bazinguinha` | Bazinguinha | #E08A00 | O mascote **O Menor Quentão**: uma cabeça redonda laranja e amarela com óculos escuros pretos, sorriso confiante e bracinhos pretos finos, na frente de uma mini máquina caça-níquel de 3 rolos com raios dourados. Clima de calor e brasa. |
| `bonanza` | Bazinga Bonanza | #C2185B | Uma chuva de doces e joias: diamantes rosa e azuis, fatias de bolo, pêssegos, uma estrela-bônus rosa brilhando e uma bombinha cartoon com o selo "×" (**sem número**). Visual candy roxo/rosa. |
| `horse` | Corrida BZG | #2856B8 | Uma ferradura dourada da sorte em destaque, numa pista de corrida com bandeira quadriculada ao fundo e poeira de velocidade. |
| `raspadinha` | Raspadinha | #6B4BD6 | Um bilhete dourado de raspadinha sendo raspado por uma moeda, soltando raspas prateadas e revelando brilhos. |
| `limbo` | Limbo | #1D5F99 | Uma linha verde neon subindo em curva e furando uma linha-alvo tracejada, com seta brilhante na ponta e estrelas ao fundo. |
| `coinflip` | Moeda da Pilha | #8C7A00 | A **Pilha Avulsa**: uma pilha laranja e preta com rostinho, jogando para o alto uma moeda dourada com um raio desenhado, girando no ar. |

## Extras (opcional: faça se der tempo)

Mesmo formato, salvos em `assets/capas/`:

| id | Nome | Cor | O que mostrar |
|---|---|---|---|
| `torre` | Torre do CBPB_Gamer | #2D6A8C | Uma torre de blocos coloridos empilhados, com o bloco do topo caindo meio torto. |
| `arcoiris` | Sequência Arco-íris | #33415C | Um arco-íris de faixas brilhantes com botões coloridos acendendo em sequência. |
| `sombra` | Sombra Rápida | #22223A | Uma lua crescente prateada com uma silhueta escura passando rápido, e estrelas. |
| `alien` | Fuga Alienígena | #1F5C3A | Um alienzinho verde fofo de olhos pretos enormes, fugindo num disco voador. |

## Quando terminar

1. Confira se todos os arquivos estão em `assets/capas/`, com 768 × 1024 px e até 200 KB.
2. Faça commit **só da pasta `assets/capas/`** com a mensagem `Capas dos jogos (Codex)`.
3. Me devolva a lista dos arquivos gerados e qualquer capa que não tenha saído boa.
