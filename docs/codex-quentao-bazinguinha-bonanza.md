# Prompt para o Codex — Menor Quentão, itens do Bazinguinha e Bonanza na caverna

> Copie tudo abaixo da linha e envie para o Codex.

---

Você vai **refazer e criar imagens** do site **Bazinga BET** (repositório atual), no mesmo estilo cartoon 3D brilhante das imagens que você já fez (`assets/capas/`, `assets/bazinguinha/`, `assets/bonanza/`). O site é um simulador de cassino **de brincadeira, sem dinheiro real**.

**Gere só as imagens. Não altere nenhum arquivo de código.** O site já está programado para usar estes caminhos e nomes. Quando o arquivo já existir, **substitua-o**.

## Regras para todas

- Formato **`.webp`**, qualidade ~85, **no máximo 250 KB** (capas: até 200 KB).
- **Fundo transparente (canal alfa)** em mascotes, símbolos e logos. Cenários e capas sem transparência.
- **Sem texto**, exceto no logo do Bonanza (grafia exata: **BAZINGA BONANZA**).
- Símbolos: objeto **centralizado**, ocupando ~85% do quadro, legível mesmo pequeno (64 px), sem fundo, sem moldura e sem número.
- Tudo **original**:
  - não copie arte, personagens nem logos de jogos reais (Fortune Tiger, Gems Bonanza, Sweet Bonanza etc.);
  - sem marcas reais, sem pessoas reais e sem cédulas.

---

## Parte 1 — O Menor Quentão (mascote) refeito pelo desenho original

As imagens anteriores erraram o personagem: fizeram uma bola laranja de óculos escuros. O desenho original, feito pelo dono, está em **`docs/ref/menor-quentao-desenho.png`**. **Abra o arquivo e siga-o fielmente.**

**Como ele é:**
- **Cabeça:** grande e redonda, **marrom**.
- **Em cima da cabeça:** uma "coroa" ou cabelo **laranja**, em pontas, como uma chama. Ele é "quentão".
- **Olhos:** **azuis**, como um visor ou óculos azul.
- **Corpo:** pequeno, **preto** e retangular.
- **Braços e pernas:** finos e **marrons**, abertos, numa pose animada.
- **Personalidade:** baixinho, fofo, confiante e brincalhão.

Pode dar volume 3D, brilho e expressão sorridente, mas **sem mudar as cores e as formas**. Nada de óculos escuros pretos nem de corpo laranja redondo.

| Arquivo | Tamanho | O que é |
|---|---|---|
| `assets/bazinguinha/mascote.webp` | 768 × 768 | Menor Quentão de corpo inteiro, confiante, fazendo joinha. |
| `assets/bazinguinha/mascote-vitoria.webp` | 768 × 768 | Menor Quentão comemorando: pulando, braços para cima, chama da cabeça mais forte, moedas douradas voando. |
| `assets/bazinguinha/sym-wild.webp` | 512 × 512 | Símbolo **WILD**: medalhão dourado redondo com o **rosto do Menor Quentão** no centro e raios de luz. |
| `assets/capas/bazinguinha.webp` | 768 × 1024 | Capa do jogo: o Menor Quentão animado na frente de uma mini máquina caça-níquel dourada de 3 rolos, em festa oriental (vermelho, dourado, lanternas, moedas). Os 25% de baixo mais escuros. |

---

## Parte 2 — Bazinguinha: itens dos Bazingas no clima oriental

Os símbolos do Bazinguinha passam a ser **os itens da Equipe BZG**, em versão de **festa oriental da sorte**: acabamento dourado, detalhes vermelhos e verde-jade, ornamentos e brilho, como peças de um caça-níquel oriental de luxo. Cada item deve continuar reconhecível na hora.

| Arquivo | Tamanho | O que é | Prêmio |
|---|---|---|---|
| `assets/bazinguinha/sym-pessego.webp` | 512 × 512 | **Pêssego do Bogão**: pêssego rosado gordinho e brilhante, com folhas de jade, laço vermelho e moedinha dourada. | o mais alto |
| `assets/bazinguinha/sym-panetone.webp` | 512 × 512 | **Panetone**: panetone fofinho com frutas, embrulhado em papel vermelho e dourado com fita, cereja em cima. | alto |
| `assets/bazinguinha/sym-picles.webp` | 512 × 512 | **Picles**: picles verde brilhante enrolado numa faixa vermelha com moeda dourada, como um amuleto da sorte. | médio |
| `assets/bazinguinha/sym-pilha.webp` | 512 × 512 | **Pilha**: pilha laranja e preta com detalhes dourados e um raio gravado, soltando faíscas douradas. | baixo |
| `assets/bazinguinha/sym-abobora.webp` | 512 × 512 | **Abóbora**: abóbora laranja sorridente com folhinha, com um nó chinês vermelho pendurado. | o mais baixo |

(As imagens antigas `sym-lingote`, `sym-saco`, `sym-envelope`, `sym-fogos` e `sym-laranja` já foram apagadas. Não recrie.)

---

## Parte 3 — Bazinga Bonanza: caverna das joias dos Bazingas

O visual de doces saiu. O Bonanza agora é **sério**: uma **caverna, templo antigo** escondido, com ruínas de pedra, tochas, água ou lava brilhando e joias. Paleta: azul-petróleo escuro, pedra cinza-chumbo, **ouro envelhecido** e brilhos ciano e esmeralda. Os símbolos são **"Joias dos Bazingas"**: gemas lapidadas, cada uma com a forma ou um detalhe que lembra um membro da Equipe BZG. **Substitua os arquivos existentes**, com os mesmos nomes.

| Arquivo | Tamanho | O que é |
|---|---|---|
| `assets/bonanza/fundo.webp` | 1920 × 1080 | Interior de caverna e templo antigo: paredes de rocha, escadarias e ruínas, tochas acesas, cristais brilhando, uma cachoeira de luz azul ao fundo. O centro mais escuro e simples (a grade fica ali). Sem personagens e sem texto. |
| `assets/bonanza/logo.webp` | 1000 × 450 | Logo **"BAZINGA BONANZA"** em duas linhas, letras de **ouro envelhecido** entalhadas, com contorno escuro, pequenas joias incrustadas e brilho. Sério e épico, nada de "doce". Fundo transparente. |
| `assets/bonanza/mascote.webp` | 768 × 1024 | **O Guardião**: ídolo, totem de pedra antigo sobre um pedestal, com rosto esculpido e **olhos de joia** (ciano), runas douradas e uma coroa de gemas coloridas. Imponente. Fundo transparente. |
| `assets/bonanza/mascote-vitoria.webp` | 768 × 1024 | O mesmo Guardião **despertando**: olhos e runas brilhando forte, joias da coroa acesas, raios de luz e pedrinhas flutuando. Fundo transparente. |
| `assets/bonanza/sym-diamante.webp` | 512 × 512 | **Diamante BZG**: diamante branco-azulado enorme e perfeito, com um raio dourado gravado (o prêmio mais alto). |
| `assets/bonanza/sym-bolo.webp` | 512 × 512 | **Rubi do Panetone**: rubi vermelho lapidado em forma de fatia arredondada, com uma "cereja" de ouro em cima. |
| `assets/bonanza/sym-pessego.webp` | 512 × 512 | **Quartzo do Bogão**: quartzo-rosa lapidado em forma de pêssego, com folha de esmeralda. |
| `assets/bonanza/sym-carta.webp` | 512 × 512 | **Ametista do Pitoco**: ametista roxa lapidada em forma de estrela. |
| `assets/bonanza/sym-dado.webp` | 512 × 512 | **Jade do 616**: cubo de jade verde-escuro com pontos de ouro, como um dado. |
| `assets/bonanza/sym-picles.webp` | 512 × 512 | **Esmeralda do Pikles**: esmeralda verde alongada e lapidada, lembrando um picles. |
| `assets/bonanza/sym-pilha.webp` | 512 × 512 | **Topázio da Pilha**: topázio laranja e amarelo em forma de cilindro lapidado, com um raio gravado. |
| `assets/bonanza/sym-abobora.webp` | 512 × 512 | **Âmbar da Abóbora**: âmbar laranja arredondado em forma de abóbora, com folhinha de ouro (o prêmio mais baixo). |
| `assets/bonanza/sym-bonus.webp` | 512 × 512 | **Ídolo BZG** (bônus): máscara ou ídolo de ouro com olhos de joia brilhando, dentro de um anel de luz dourada. |
| `assets/bonanza/sym-bomba.webp` | 512 × 512 | **Orbe multiplicador**: esfera de pedra escura com runas acesas em ciano e dourado, rachando de energia. **Sem número**: o site escreve o valor por cima. |

---

## Quando terminar

1. Confira os tamanhos, a transparência e o limite de peso. Confira também que o Menor Quentão está igual ao desenho de referência.
2. Faça commit **só dos arquivos listados** com a mensagem `Menor Quentão, itens do Bazinguinha e Bonanza caverna (Codex)`.
3. Me devolva a lista dos arquivos e qualquer imagem que não tenha saído boa.
