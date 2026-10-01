# Prompt para o Codex — avatares, conquistas, Passe, cenários e peças dos jogos, arte de boas-vindas

> Copie tudo abaixo da linha e envie para o Codex. É bastante coisa: faça **por partes** (uma parte por vez) e faça commit de cada parte.

---

Você vai gerar **imagens** para o site **Bazinga BET** (repositório atual), no mesmo estilo cartoon 3D brilhante das imagens que você já fez (`assets/capas/`, `assets/bazinguinha/`, `assets/bonanza/`). O site é um simulador de cassino **de brincadeira, sem dinheiro real**.

**Gere só as imagens. Não altere nenhum arquivo de código.** O site já está programado para usar estes caminhos exatos e, enquanto uma imagem não existe, mostra o desenho ou emoji antigo.

## Regras para todas

- Formato **`.webp`**, qualidade ~85.
- **Fundo transparente** em tudo, exceto cenários (`fundo.webp`), banners de capítulo e a arte de boas-vindas.
- **Sem texto**, sem letras e sem números.
- Tudo **original**: sem marcas reais, sem pessoas reais e sem cédulas. Os personagens são **objetos e criaturas com rostinho**, nunca pessoas. Mantenha cada personagem igual ao das capas indicadas.
- Envie **direto para a branch `main`**, uma parte por commit.

## Parte 1 — Avatares dos personagens (13), 256 × 256, até 40 KB

Retrato do personagem, do busto para cima, de frente, sorrindo, centralizado, com fundo transparente. Fica num círculo pequeno no site, então o rosto tem que ser bem visível.

| Arquivo | Personagem |
|---|---|
| `assets/avatares/abobora.webp` | BZG Abóbora — abóbora laranja sorridente com folhinha (`assets/capas/plinko.webp`) |
| `assets/avatares/panetone.webp` | BZG Panetone — fatia de panetone com cereja (`assets/capas/hilo.webp`) |
| `assets/avatares/canoa.webp` | BZG Canoa Furada — canoa de madeira com furinho (`assets/capas/crash.webp`) |
| `assets/avatares/seis16.webp` | BZG 616 — dado branco de capacete militar verde (`assets/capas/dice.webp`) |
| `assets/avatares/pikles.webp` | BZG Pikles Gamer — picles com fone gamer (`assets/capas/mines.webp`) |
| `assets/avatares/pilha.webp` | BZG Pilha Avulsa — pilha laranja e preta (`assets/capas/coinflip.webp`) |
| `assets/avatares/linden.webp` | BZG Linden — lata de lixo prateada (`assets/capas/tower.webp`) |
| `assets/avatares/bogao.webp` | BZG Bogão — pêssego gordinho de gravata-borboleta (`assets/capas/blackjack.webp`) |
| `assets/avatares/pitoco.webp` | BZG Pitoco — pintinho amarelo pequenininho |
| `assets/avatares/dhani.webp` | Dhani — criaturinha de arco-íris (`assets/capas/arcoiris.webp`) |
| `assets/avatares/shadow.webp` | Shadow — criaturinha de sombra com olhos brilhantes e lua (`assets/capas/sombra.webp`) |
| `assets/avatares/cbpb.webp` | CBPB_Gamer — bloquinho de montar colorido com controle de videogame (`assets/capas/torre.webp`) |
| `assets/avatares/alienjo.webp` | Alien Jo — alienzinho verde de olhos enormes (`assets/capas/alien.webp`) |

## Parte 2 — Conquistas (76 medalhas), 256 × 256, até 40 KB

Cada conquista vira uma **medalha** ou insígnia redonda e dourada, com um desenho no centro que represente a conquista. Use o emoji atual como ideia. Use os personagens da turma quando combinar, por exemplo nas conquistas de jogos específicos. Fundo transparente e sem texto.

| Arquivo | Conquista | Ideia (emoji atual) |
|---|---|---|
| `assets/conquistas/first-bet.webp` | Bem-vindo ao cassino — Faça sua primeira aposta | 🎰 |
| `assets/conquistas/high-roller.webp` | Aposta grande — Aposte BZ$ 1.000 numa única jogada | 💵 |
| `assets/conquistas/hot-streak.webp` | Sequência quente — Vença 5 vezes seguidas | 🔥 |
| `assets/conquistas/big-mult.webp` | Foguete — Ganhe com um multiplicador de 50x ou mais | 🚀 |
| `assets/conquistas/jackpot.webp` | Sortudo do Bazinga — Alcance um multiplicador de 100x | ⚡ |
| `assets/conquistas/explorer.webp` | Explorador — Jogue 8 jogos diferentes | 🧭 |
| `assets/conquistas/veteran.webp` | Veterano — Chegue ao nível 5 | 🎖️ |
| `assets/conquistas/millionaire.webp` | Alto lá, milionário — Tenha BZ$ 100.000 de saldo | 🤑 |
| `assets/conquistas/whale.webp` | Baleia — Aposte BZ$ 50.000 no total | 🐋 |
| `assets/conquistas/big-win.webp` | Prêmio gordo — Ganhe BZ$ 25.000 numa única jogada | 💥 |
| `assets/conquistas/lvl-10.webp` | Nível 10 — Chegue ao nível 10 | 🎖️ |
| `assets/conquistas/lvl-25.webp` | Nível 25 — Chegue ao nível 25 | 🎖️ |
| `assets/conquistas/lvl-50.webp` | Nível 50 — Chegue ao nível 50 | 🏅 |
| `assets/conquistas/lvl-75.webp` | Nível 75 — Chegue ao nível 75 | 🏅 |
| `assets/conquistas/lvl-100.webp` | Nível máximo — Chegue ao nível 100 | 👑 |
| `assets/conquistas/bp-10.webp` | Passe: esquentando — Alcance o nível 10 do Passe de Batalha | 🎫 |
| `assets/conquistas/bp-50.webp` | Passe: metade do caminho — Alcance o nível 50 do Passe de Batalha | 🎫 |
| `assets/conquistas/bp-100.webp` | Passe completo — Alcance o nível 100 do Passe de Batalha | 🏆 |
| `assets/conquistas/bp-claim-all.webp` | Nada pendente — Resgate todas as recompensas disponíveis do Passe | 🎁 |
| `assets/conquistas/bal-20k.webp` | Primeiros 20 mil — Tenha BZ$ 20.000 de saldo | 💰 |
| `assets/conquistas/bal-50k.webp` | Bolso cheio — Tenha BZ$ 50.000 de saldo | 💰 |
| `assets/conquistas/bal-250k.webp` | Alto padrão — Tenha BZ$ 250.000 de saldo | 💰 |
| `assets/conquistas/bal-500k.webp` | Multimilionário — Tenha BZ$ 500.000 de saldo | 💰 |
| `assets/conquistas/bal-1m.webp` | Bilionário do Bazinga — Tenha BZ$ 1.000.000 de saldo | 🏆 |
| `assets/conquistas/wager-100k.webp` | Grinder — Aposte BZ$ 100.000 no total | 📈 |
| `assets/conquistas/wager-500k.webp` | Rodagem pesada — Aposte BZ$ 500.000 no total | 📈 |
| `assets/conquistas/wager-1m.webp` | Máquina de apostar — Aposte BZ$ 1.000.000 no total | 📈 |
| `assets/conquistas/bets-100.webp` | 100 rodadas — Faça 100 apostas no total | 🔁 |
| `assets/conquistas/bets-500.webp` | 500 rodadas — Faça 500 apostas no total | 🔁 |
| `assets/conquistas/bet-5k.webp` | Big spender — Aposte BZ$ 5.000 numa única jogada | 💵 |
| `assets/conquistas/bet-20k.webp` | Baleia suprema — Aposte BZ$ 20.000 numa única jogada | 💵 |
| `assets/conquistas/win-100k.webp` | Prêmio histórico — Ganhe BZ$ 100.000 numa única jogada | 🎊 |
| `assets/conquistas/lossstreak-5.webp` | Fase ruim — Perca 5 vezes seguidas | 🌧️ |
| `assets/conquistas/lossstreak-10.webp` | Persistente — Perca 10 vezes seguidas e continue jogando | ⛈️ |
| `assets/conquistas/winstreak-10.webp` | Imparável — Vença 10 vezes seguidas | 🔥 |
| `assets/conquistas/winstreak-20.webp` | Lenda da sorte — Vença 20 vezes seguidas | 🔥 |
| `assets/conquistas/mult-10.webp` | Primeiro 10x — Ganhe com um multiplicador de 10x ou mais | ✨ |
| `assets/conquistas/mult-25.webp` | Multiplicador e tanto — Ganhe com um multiplicador de 25x ou mais | ✨ |
| `assets/conquistas/mult-250.webp` | Fora da curva — Ganhe com um multiplicador de 250x ou mais | 🌟 |
| `assets/conquistas/mult-500.webp` | Sortudo demais — Ganhe com um multiplicador de 500x ou mais | 🌟 |
| `assets/conquistas/all-games.webp` | Cassino completo — Jogue todos os jogos disponíveis pelo menos uma vez | 🗺️ |
| `assets/conquistas/theme-unlock.webp` | Trocando de roupa — Desbloqueie um tema extra no Passe de Batalha | 🎨 |
| `assets/conquistas/name-color.webp` | Estiloso — Personalize a cor do seu nome | 🖍️ |
| `assets/conquistas/turbo-unlock.webp` | Pé no acelerador — Desbloqueie o Modo Turbo no Passe de Batalha | ⚡ |
| `assets/conquistas/turbo-on.webp` | Tudo rápido — Ligue o Modo Turbo | ⚡ |
| `assets/conquistas/title-unlock.webp` | Reconhecimento — Desbloqueie um título no Passe de Batalha | 🎖️ |
| `assets/conquistas/title-active.webp` | Nome e sobrenome — Coloque um título ativo no perfil | 🎖️ |
| `assets/conquistas/broke-once.webp` | Quebrado — Zere o saldo e receba a recarga automática | 🪫 |
| `assets/conquistas/broke-5.webp` | Sem sorte hoje — Receba a recarga automática 5 vezes | 🪫 |
| `assets/conquistas/phoenix.webp` | Fênix — Receba a recarga automática 20 vezes | 🔄 |
| `assets/conquistas/crash-20x.webp` | Piloto de canoa — Retire na Canoa Furada com 20x ou mais | 🛶 |
| `assets/conquistas/double-white.webp` | Saiu branco! — Acerte o branco (14x) no Double | 🎡 |
| `assets/conquistas/mines-20x.webp` | Horta limpa — Ganhe no Mines do Pikles com 20x ou mais | 🥒 |
| `assets/conquistas/tower-top.webp` | Topo da lixeira — Ganhe na Lixeira do Linden com 20x ou mais | 🗑️ |
| `assets/conquistas/plinko-100x.webp` | Bolinha de ouro — Ganhe no Plinko da Abóbora com 100x ou mais | 🎃 |
| `assets/conquistas/dice-9x.webp` | Aposta arriscada — Ganhe no Dado 616 com 9x ou mais | 🎲 |
| `assets/conquistas/hilo-10x.webp` | Sequência de cartas — Ganhe no HiLo do Panetone com 10x ou mais | 🃏 |
| `assets/conquistas/roulette-36x.webp` | Número da sorte — Acerte um número cheio na Roleta (36x) | 🎯 |
| `assets/conquistas/blackjack-natural.webp` | Blackjack! — Tire um blackjack natural (2.5x) no 21 do Bogão | 🍑 |
| `assets/conquistas/raspadinha-max.webp` | Raspou e achou — Ganhe na Raspadinha com 10x ou mais | 🎟️ |
| `assets/conquistas/limbo-50x.webp` | Alvo distante — Ganhe no Limbo com alvo de 50x ou mais | 📉 |
| `assets/conquistas/coinflip-20wins.webp` | Moeda favorável — Vença 20 vezes na Moeda da Pilha | 🔋 |
| `assets/conquistas/horse-10wins.webp` | Jóquei sortudo — Vença 10 corridas na Corrida BZG | 🏇 |
| `assets/conquistas/col-first.webp` | Primeira figurinha — Ganhe seu primeiro colecionável jogando | 🎴 |
| `assets/conquistas/col-20.webp` | Álbum enchendo — Junte 20 colecionáveis | 🎴 |
| `assets/conquistas/col-50.webp` | Quase completo — Junte 50 colecionáveis | 🎴 |
| `assets/conquistas/col-set-1.webp` | Álbum fechado — Complete o conjunto de figurinhas de um personagem | 🏆 |
| `assets/conquistas/col-set-crew.webp` | Elenco completo — Complete o álbum de todos os membros da Equipe BZG | 👑 |
| `assets/conquistas/col-set-friends.webp` | Turma completa — Complete o álbum de todos os Amigos dos Bazingas | 🤝 |
| `assets/conquistas/col-set-all.webp` | Colecionador supremo — Complete o álbum de TODOS os personagens (Equipe + Amigos) | 🌟 |
| `assets/conquistas/torre-10.webp` | Construtor — Alcance 10 andares na Torre da Turma | 🧱 |
| `assets/conquistas/torre-25.webp` | Arquiteto BZG — Alcance 25 andares na Torre da Turma | 🏗️ |
| `assets/conquistas/rainbow-10.webp` | Memória colorida — Alcance a rodada 10 na Sequência Arco-íris | 🏳️‍🌈 |
| `assets/conquistas/shadow-15.webp` | Reflexo na escuridão — Acerte 15 sombras numa rodada de Sombra Rápida | 🌑 |
| `assets/conquistas/alien-30.webp` | Sobrevivente espacial — Sobreviva 30 segundos na Fuga Alienígena | 👽 |
| `assets/conquistas/minigames-all.webp` | Todo-terreno — Tenha pelo menos um recorde em cada minigame sem aposta | 🕹️ |

## Parte 3 — Passe de Batalha

**Banners dos capítulos (10)**, 1200 × 300, até 120 KB, sem transparência. Faixa larga com o personagem do capítulo à direita, em clima de festa e recompensa, e o lado esquerdo mais escuro e simples (o site escreve o título ali).

| Arquivo | Capítulo |
|---|---|
| `assets/passe/capitulo-1.webp` | Amigos dos Bazingas (os 4 Amigos juntos: Dhani, Shadow, CBPB_Gamer e Alien Jo) |
| `assets/passe/capitulo-2.webp` | BZG Abóbora |
| `assets/passe/capitulo-3.webp` | BZG Panetone |
| `assets/passe/capitulo-4.webp` | BZG Canoa Furada |
| `assets/passe/capitulo-5.webp` | BZG 616 |
| `assets/passe/capitulo-6.webp` | BZG Pikles Gamer |
| `assets/passe/capitulo-7.webp` | BZG Pilha Avulsa |
| `assets/passe/capitulo-8.webp` | BZG Linden |
| `assets/passe/capitulo-9.webp` | BZG Bogão |
| `assets/passe/capitulo-10.webp` | BZG Pitoco |

**Ícones de prêmio (7)**, 256 × 256, até 40 KB, fundo transparente:

| Arquivo | Tipo de prêmio |
|---|---|
| `assets/passe/premio-avatar.webp` | Novo avatar: moldura de retrato dourada com brilho |
| `assets/passe/premio-color.webp` | Cor do nome: paleta e pincel com tinta colorida |
| `assets/passe/premio-theme.webp` | Tema do site: janelinha com degradê de cores |
| `assets/passe/premio-title.webp` | Título: faixa ou fita de honra dourada (sem texto) |
| `assets/passe/premio-turbo.webp` | Modo Turbo: raio dentro de um velocímetro |
| `assets/passe/premio-collectible.webp` | Figurinha: envelope de figurinhas brilhando |
| `assets/passe/premio-reloadBoost.webp` | Recarga maior: cofrinho com moedas e seta para cima |

## Parte 4 — Cenários dos jogos (13), 1920 × 1080, até 250 KB, sem transparência

Fundo de cada jogo, atrás da área de jogo. O **centro deve ser mais escuro e simples**, porque a mesa e os botões ficam ali. Sem personagens grandes e sem texto.

| Arquivo | Jogo | Cenário |
|---|---|---|
| `assets/jogos/crash/fundo.webp` | Canoa Furada | rio largo ao entardecer com ondas, céu laranja e azul, respingos |
| `assets/jogos/double/fundo.webp` | Double | salão de cassino vermelho e preto com luzes e uma roda gigante ao fundo |
| `assets/jogos/mines/fundo.webp` | Mines do Pikles | horta à noite com canteiros, vagalumes e luz de lua |
| `assets/jogos/tower/fundo.webp` | Lixeira do Linden | beco urbano com pilhas de caixas e sacos subindo, céu de cidade |
| `assets/jogos/plinko/fundo.webp` | Plinko da Abóbora | plantação de abóboras sob céu roxo com estrelas |
| `assets/jogos/dice/fundo.webp` | Dado 616 | base militar estilizada, radar verde e mapa tático |
| `assets/jogos/hilo/fundo.webp` | HiLo do Panetone | confeitaria aconchegante, balcão com doces e luz quente |
| `assets/jogos/roulette/fundo.webp` | Roleta | mesa de cassino clássica em madeira e veludo verde, luz dourada |
| `assets/jogos/blackjack/fundo.webp` | 21 do Bogão | mesa de cartas verde em salão elegante com lustres |
| `assets/jogos/horse/fundo.webp` | Corrida BZG | hipódromo ensolarado com arquibancada e bandeirinhas |
| `assets/jogos/raspadinha/fundo.webp` | Raspadinha | balcão de loteria colorido com bilhetes e confete |
| `assets/jogos/limbo/fundo.webp` | Limbo | céu noturno com nuvens e um horizonte neon verde |
| `assets/jogos/coinflip/fundo.webp` | Moeda da Pilha | laboratório elétrico com raios e bobinas |

## Parte 5 — Peças dos jogos, fundo transparente

| Arquivo | Tamanho | O que é |
|---|---|---|
| `assets/jogos/crash/canoa.webp` | 512 × 512, até 60 KB | A Canoa Furada de lado, navegando para a direita e um pouco para cima, com respingos atrás. |
| `assets/jogos/plinko/abobora.webp` | 256 × 256, até 30 KB | A Abóbora em forma de bolinha redonda e sorridente, vista de frente (é a "bola" que cai). |
| `assets/jogos/horse/abobora.webp` | 512 × 512, até 60 KB | A Abóbora correndo de lado para a direita, com pernas em movimento e poeira. |
| `assets/jogos/horse/pikles.webp` | 512 × 512, até 60 KB | O Pikles correndo de lado para a direita. |
| `assets/jogos/horse/seis16.webp` | 512 × 512, até 60 KB | O 616 (dado de capacete) correndo de lado para a direita. |
| `assets/jogos/horse/panetone.webp` | 512 × 512, até 60 KB | O Panetone correndo de lado para a direita. |
| `assets/jogos/horse/pilha.webp` | 512 × 512, até 60 KB | A Pilha correndo de lado para a direita. |
| `assets/jogos/horse/bogao.webp` | 512 × 512, até 60 KB | O Bogão correndo de lado para a direita. |
| `assets/jogos/tower/linden.webp` | 512 × 512, até 60 KB | O Linden (lata de lixo) pulando, animado. |
| `assets/jogos/coinflip/cara.webp` | 512 × 512, até 60 KB | Face "cara" da moeda: moeda dourada com um **raio** gravado em relevo. |
| `assets/jogos/coinflip/coroa.webp` | 512 × 512, até 60 KB | Face "coroa" da moeda: moeda prateada com uma **pilha** gravada em relevo. |
| `assets/jogos/raspadinha/sym-abobora.webp` | 256 × 256, até 30 KB | Abóbora (símbolo da raspadinha). |
| `assets/jogos/raspadinha/sym-picles.webp` | 256 × 256, até 30 KB | Picles. |
| `assets/jogos/raspadinha/sym-pilha.webp` | 256 × 256, até 30 KB | Pilha. |
| `assets/jogos/raspadinha/sym-panetone.webp` | 256 × 256, até 30 KB | Panetone. |
| `assets/jogos/raspadinha/sym-pessego.webp` | 256 × 256, até 30 KB | Pêssego do Bogão. |
| `assets/jogos/raspadinha/sym-raio.webp` | 256 × 256, até 30 KB | Raio dourado (o prêmio máximo). |
| `assets/jogos/cartas/verso.webp` | 400 × 560, até 60 KB, **sem** transparência | Verso das cartas do HiLo e do 21: padrão vermelho e dourado com a estrela de quadrinho do Bazinga no centro (sem texto). |

## Parte 6 — Arte de boas-vindas

| Arquivo | Tamanho | O que é |
|---|---|---|
| `assets/turma.webp` | 1600 × 900, até 250 KB, sem transparência | Toda a turma reunida e acenando (os 9 da Equipe BZG, os 4 Amigos e o Menor Quentão de `docs/ref/menor-quentao-desenho.png`), numa entrada de cassino festiva com luzes, moedas e confete. Usada na tela de cadastro e no perfil. |

## Quando terminar cada parte

Confira nomes, tamanhos e peso e faça commit na `main` com a mensagem `Imagens parte N (Codex)`. No fim, me devolva a contagem por parte: 13 + 76 + 17 + 13 + 18 + 1.
