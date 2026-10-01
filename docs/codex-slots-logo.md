# Prompt para o Codex — logo do site + imagens do Bazinguinha e do Bazinga Bonanza

> Copie tudo abaixo da linha e envie para o Codex.

---

Você vai gerar **imagens** para o site **Bazinga BET** (repositório atual), no mesmo estilo das capas que você já fez em `assets/capas/`: cartoon 3D brilhante, cores saturadas, luz de recorte e personagens-objeto fofos. O site é um simulador de cassino **de brincadeira, sem dinheiro real**.

**Gere só as imagens. Não altere nenhum arquivo de código.** O site já está programado para usar estas imagens assim que elas existirem, nos caminhos exatos abaixo.

## Regras para todas

- Formato **`.webp`**, qualidade ~85.
- **Fundo transparente (canal alfa)** em tudo que não for cenário: logos, mascotes, símbolos e topo.
- Cenários (`fundo.webp`) **sem transparência e sem texto**.
- **Texto só nos logos**, com a grafia exata pedida. Confira letra por letra.
- Tudo **original**:
  - não copie a arte, os personagens nem os logos de jogos reais (Fortune Tiger, Sweet Bonanza, Gates of Olympus, Big Bass etc.);
  - sem marcas reais, sem pessoas reais e sem cédulas de dinheiro.
- Símbolos de caça-níquel: objeto **centralizado**, ocupando ~85% do quadro, com contorno levemente brilhante, legível mesmo pequeno (64 px). **Sem fundo, sem moldura e sem número.**

## 1. Logo do site — pasta `assets/logo/`

| Arquivo | Tamanho | O que é |
|---|---|---|
| `logo.webp` | 1200 × 800 | Logo **"BAZINGA!"** com **"BET"** embaixo, menor. Estilo explosão de quadrinho: estrela de pontas vermelha, laranja e amarela, texto amarelo grosso inclinado com contorno preto, raio preto atrás do texto e brilhos. Fundo transparente. |
| `icone.webp` | 512 × 512 | Versão quadrada para ícone: a explosão de quadrinho com um **"B!"** grande no centro. Fundo transparente. |

## 2. Bazinguinha — pasta `assets/bazinguinha/`

Caça-níquel 3×3 com clima de **festa da sorte oriental**: vermelho, dourado e verde-jade, lanternas e brilhos. O mascote é **O Menor Quentão**: uma cabeça redonda **laranja e amarela** com **óculos escuros pretos**, sorriso confiante e bracinhos pretos finos (é o personagem da capa `assets/capas/bazinguinha.webp`, use-a como referência visual).

| Arquivo | Tamanho | O que é |
|---|---|---|
| `fundo.webp` | 1920 × 1080 | Cenário: um pátio de festa à noite, com pavilhão vermelho e dourado, lanternas acesas, pétalas de flor caindo e luz quente. O centro deve ser mais simples e escuro (a máquina fica ali). Sem personagens e sem texto. |
| `logo.webp` | 1000 × 400 | Logo **"BAZINGUINHA"** em letras douradas grossas com contorno vermelho, brilho e ornamentos orientais nas pontas. Fundo transparente. |
| `topo.webp` | 1200 × 360 | Topo ornamentado que fica em cima da máquina: telhado curvo de telhas verde-jade, vigas vermelhas com detalhes dourados e duas lanternas penduradas. O centro de baixo fica livre (o mascote aparece ali). Fundo transparente. |
| `mascote.webp` | 768 × 768 | O Menor Quentão de corpo inteiro, parado, confiante, fazendo joinha. Fundo transparente. |
| `mascote-vitoria.webp` | 768 × 768 | O Menor Quentão comemorando: pulando, braços para cima, moedas douradas voando. Fundo transparente. |
| `sym-wild.webp` | 512 × 512 | **WILD**: medalhão dourado redondo com o rosto do Menor Quentão de óculos escuros no centro e raios de luz. Sem texto. |
| `sym-lingote.webp` | 512 × 512 | Lingote de ouro brilhante (o prêmio mais alto). |
| `sym-saco.webp` | 512 × 512 | Saco da sorte de tecido vermelho e roxo, amarrado com cordão dourado e moedas saindo. |
| `sym-envelope.webp` | 512 × 512 | Envelope vermelho da sorte com uma moeda dourada estampada. |
| `sym-fogos.webp` | 512 × 512 | Feixe de bombinhas de festa vermelhas com fita dourada. |
| `sym-laranja.webp` | 512 × 512 | Laranja da sorte com folhinhas verdes e gomos ao lado. |

## 3. Bazinga Bonanza — pasta `assets/bonanza/`

Caça-níquel 6×5 "paga em qualquer lugar", com clima de **terra dos doces e das joias**: rosa, roxo, azul-bebê e dourado. O mascote é a **Estrela-Bônus**: uma estrela rosa fofa e sorridente (é a personagem da capa `assets/capas/bonanza.webp`, use-a como referência).

| Arquivo | Tamanho | O que é |
|---|---|---|
| `fundo.webp` | 1920 × 1080 | Cenário: terra dos doces com céu rosa e lilás, nuvens de algodão-doce, morros de bala, pirulitos gigantes e joias brilhando. O centro deve ser mais simples (a grade fica ali). Sem personagens e sem texto. |
| `logo.webp` | 1000 × 450 | Logo **"BAZINGA BONANZA"** em duas linhas, com letras gordinhas de doce (rosa, amarelo e branco), contorno roxo, brilho e joias decorando. Fundo transparente. |
| `mascote.webp` | 768 × 1024 | A Estrela-Bônus de corpo inteiro, acenando, flutuando com brilhos. Fundo transparente. |
| `mascote-vitoria.webp` | 768 × 1024 | A Estrela-Bônus comemorando, com confete e joias voando. Fundo transparente. |
| `sym-diamante.webp` | 512 × 512 | Diamante azul lapidado (o prêmio mais alto). |
| `sym-bolo.webp` | 512 × 512 | Fatia de bolo com cobertura rosa e cereja. |
| `sym-pessego.webp` | 512 × 512 | Pêssego brilhante com folha. |
| `sym-carta.webp` | 512 × 512 | Carta de baralho com uma estrela roxa no meio (sem letras). |
| `sym-dado.webp` | 512 × 512 | Dado branco com pontos pretos e um vermelho. |
| `sym-picles.webp` | 512 × 512 | Picles verde brilhante. |
| `sym-pilha.webp` | 512 × 512 | Pilha laranja e preta. |
| `sym-abobora.webp` | 512 × 512 | Abóbora laranja sorridente com folhinha (o prêmio mais baixo). |
| `sym-bonus.webp` | 512 × 512 | **Bônus**: a Estrela-Bônus (rosto da mascote) dentro de um círculo dourado, brilhando forte. Sem texto. |
| `sym-bomba.webp` | 512 × 512 | Bomba de multiplicador: bomba redonda cartoon colorida (arco-íris e doce), com pavio aceso. **Sem número** (o site escreve o valor por cima). |

## Quando terminar

1. Confira os tamanhos e a transparência, e que nenhuma imagem passe de **250 KB**.
2. Faça commit **só das pastas `assets/logo/`, `assets/bazinguinha/` e `assets/bonanza/`** com a mensagem `Imagens do logo, Bazinguinha e Bonanza (Codex)`.
3. Me devolva a lista de arquivos e qualquer imagem que não tenha saído boa.
