# 🎰 Bazinga BET — v1.10

Simulador de casa de apostas **sem dinheiro real** — só diversão! Cadastre-se, receba fichas fictícias (BZ$) e jogue os jogos de cassino da equipe BZG.

> ⚠️ Este projeto é 100% de brincadeira. Não envolve dinheiro real, apostas reais, pagamentos ou saques de nenhum tipo. Tudo fica salvo só no seu navegador.

> 📌 **Regra deste arquivo**: a partir da v1.5, toda mudança feita no projeto é registrada no [Changelog](#-changelog) no fim deste documento, da mais recente para a mais antiga.

---

## 📁 Estrutura de pastas

```
BZG-BET/
├── index.html            Lobby (pagina inicial)
├── cadastro.html         Tela de cadastro/login (obrigatoria no 1o acesso)
├── profile.html          Perfil do jogador (avatar, cor do nome, titulo, temas, stats)
├── passe.html            Passe de Batalha (100 niveis, em 10 capitulos)
├── colecao.html          Colecao/album de figurinhas dos Bazingas
├── settings.html         Configuracoes (som, tema, turbo, conta)
├── privacidade.html      Politica de Privacidade (acessivel sem conta, LGPD)
├── favicon.svg
├── games/                Todas as paginas de JOGO (com aposta) ficam aqui
│   ├── crash.html, double.html, mines.html, tower.html, plinko.html,
│   │   dice.html, hilo.html, roulette.html, blackjack.html,
│   │   raspadinha.html, limbo.html, coinflip.html, horse.html
│   └── bazinguinha.html, bonanza.html   (EM DESENVOLVIMENTO - ver abaixo)
├── minigames/            Minigames SEM aposta (nao mexem no saldo)
│   ├── torre.html        Torre do CBPB_Gamer - empilhar blocos
│   ├── arcoiris.html     Sequencia Arco-iris (com Dhani) - memoria, tipo Simon Says
│   ├── sombra.html       Sombra Rapida (com Shadow) - reflexo, tipo whack-a-mole
│   └── alien.html        Fuga Alienigena (com Alien Jo) - desviar de meteoros, em canvas
├── css/
│   ├── style.css         Estilos globais (sidebar, topbar, cards, temas)
│   ├── games/*.css       Estilo especifico de cada jogo
│   ├── minigames/*.css   Estilo especifico de cada minigame
│   └── pages/*.css       Estilo especifico de cada pagina (perfil, passe, colecao, config, cadastro, legal.css p/ privacidade)
└── js/
    ├── core/             Modulos compartilhados (ver tabela abaixo)
    ├── games/*.js        Logica de cada jogo (com aposta)
    ├── minigames/*.js    Logica de cada minigame (sem aposta)
    └── pages/*.js        Logica de cada pagina (lobby, perfil, passe, colecao, config, cadastro)
```

Cada jogo é só HTML + CSS + JS puro, sem build. Uma página em `games/` ou `minigames/` referencia os arquivos compartilhados com `../` (ex.: `../css/style.css`, `../js/core/storage.js`). As páginas da raiz (lobby, perfil, config, passe, coleção, cadastro) referenciam sem `../`.

### Módulos em `js/core/`

| Arquivo | Função |
|---|---|
| `storage.js` | Tudo fica salvo em UM objeto no `localStorage` (`bazingaBetState`): saldo, conta, perfil, estatísticas (incl. recorde de saldo), histórico, cosméticos, Passe de Batalha, colecionáveis, recordes de minigame |
| `layout.js` | Monta a sidebar e a topbar (com o card de perfil e os mini-campos de Nível/Recorde/Maior Prêmio) em toda página; **também é o "porteiro"**: exige cadastro antes de liberar qualquer página, e bloqueia acesso direto aos jogos em desenvolvimento; calcula os prefixos de pasta (`games/`, `minigames/`, raiz) dinamicamente |
| `theme.js` | Sistema de temas (dark/light + 6 temas extras desbloqueáveis no Passe) |
| `sounds.js` | Efeitos sonoros gerados por código (Web Audio API, 100% local) + música ambiente (vídeo do YouTube em loop, escondido — única parte do site que depende de internet) |
| `ui.js` | Formatação de dinheiro, toasts (avisos), nome colorido do jogador |
| `bots.js` | Só gera os "outros jogadores" simulados no painel ao vivo do Crash e do Double (ver seção própria) |
| `particles.js` / `effects.js` | Confete, flash de tela, animação de "Big Win" |
| `achievements.js` | Lista de conquistas + verificação automática |
| `modes.js` | Modo Turbo (acelera as animações) |
| `battlepass.js` | Regras do Passe de Batalha |
| `collectibles.js` | Catálogo dos 110 colecionáveis (Equipe BZG + Amigos dos Bazingas), drop aleatório a cada aposta, recompensa por álbum completo |

---

## 🔐 Cadastro (conta local, sem banco de dados)

Ao abrir o site pela primeira vez em um navegador, a **tela de cadastro é obrigatória** (`cadastro.html`) antes de acessar qualquer outra página — isso é verificado por `layout.js` em toda página que carrega a sidebar/topbar.

O cadastro pede só **nome de jogador e senha** (sem e-mail), mas **não existe servidor nem banco de dados**: tudo fica gravado só no `localStorage` do navegador (dentro do mesmo objeto de sempre, chave `account`). Por isso:

- É **uma conta por navegador** — não dá para "logar" com o mesmo cadastro em outro computador ou celular.
- A senha não passa por nenhum tipo de criptografia real (não faz sentido ter isso sem servidor) — é só para deixar o fluxo pronto para o dia em que o projeto ganhar um backend de verdade.
- "Sair da conta" (em Configurações) volta para a tela de cadastro, mas mantém saldo/histórico salvos — só é preciso cadastrar de novo (ou o próximo visitante do navegador cria a própria conta).
- "Apagar tudo" (em Configurações) apaga a conta também, e o site pede um novo cadastro.
- **Política de Privacidade** (`privacidade.html`): página independente, **acessível mesmo sem conta** (não passa pelo "porteiro" do `layout.js`) — link no checkbox do cadastro e no rodapé de Configurações. Explica que hoje nada sai do navegador, exceto o tráfego técnico de terceiros (Google Fonts, YouTube da música de fundo). Ver seção LGPD abaixo.

---

## ⚖️ LGPD e privacidade

Hoje (sem backend), o risco de LGPD é baixo: nome de jogador e senha ficam só no `localStorage`, quem administra o site nunca recebe nem armazena esses dados. As únicas trocas com terceiros são o carregamento do Google Fonts e do vídeo do YouTube (música de fundo) — ambos processam o IP de quem visita, como a maioria dos sites da internet, e isso está documentado em `privacidade.html`. O botão "Apagar tudo" em Configurações já cobre o direito de eliminação de dados.

Isso muda quando o modo multiplayer/ranking (planejado com Supabase) for ao ar: nesse momento o site passa a coletar e-mail e estatísticas num servidor de verdade, e vira necessário ter base legal (consentimento no cadastro), e fluxos reais de acesso/correção/exclusão dos dados guardados no servidor. Isso está no escopo do plano de multiplayer.

---

## 🎮 Jogos

### Ativos

| Jogo | Tema da equipe BZG | Como funciona | RTP aproximado |
|---|---|---|---|
| 🛶 Canoa Furada | Crash | Multiplicador sobe ao vivo, retire antes de "afundar" | ~96% |
| 🎡 Double | — | Aposta em vermelho/preto/branco (branco paga 14x) | ~95% |
| 🥒 Mines do Pikles | Mines | Revele células fugindo das bombas, cada acerto aumenta o multiplicador | ajustável pelo nº de bombas |
| 🗑️ Lixeira do Linden | Tower | Suba 8 andares sem pisar na armadilha | até ~25x |
| 🎃 Plinko da Abóbora | Plinko | Física real, várias bolinhas, 8/12/16 linhas, risco baixo/médio/alto | 90–99% conforme risco |
| 🎲 Dado 616 | Dice | Escolha acima ou abaixo de um alvo | ~99% |
| 🃏 HiLo do Panetone | HiLo | A próxima carta vem maior ou menor? Multiplicador acumula | ~98–99% |
| 🎯 Roleta | Roulette | Roleta europeia (0–36) com mesa de apostas completa | ~97% (número cheio paga 36x) |
| 🍑 21 do Bogão | Blackjack | Blackjack clássico contra o dealer, natural paga 2.5x | ~99.5% |
| 🎟️ Raspadinha | Scratch | Raspe 9 campos, ache 3 iguais | ~90% |
| 📉 Limbo | Limbo | Escolha um alvo; se o resultado sorteado passar dele, você ganha | ~99% |
| 🔋 Moeda da Pilha | Coinflip | Cara ou coroa, quase 2x | ~98% |
| 🏇 Corrida BZG | Horse | Aposte num dos 6 corredores da equipe BZG; se ele vencer, **dobra a aposta (2x fixo)**, sem odds diferentes por corredor | ~96% |

### 🚧 Em desenvolvimento (fora do ar)

- 🐯 **Bazinguinha** e 💎 **Bazinga Bonanza** aparecem na sidebar e no lobby com o selo **"EM DESENVOLVIMENTO"**, sem link clicável. Os arquivos continuam no projeto (em `games/`) mas `layout.js` bloqueia o acesso direto pela URL e redireciona para o lobby com um aviso. Para reativar um dos dois: em `js/core/layout.js` e `js/pages/lobby.js`, troque a flag `dev: true` do item por `hot: true` (ou remova a flag).

### 🎥 Painel "ao vivo" do Crash e do Double

Só esses dois jogos mostram **outros apostadores simulados** entrando na rodada, apostando e retirando ao seu lado — isso é intencional, dá a sensação de rodada compartilhada (como em sites de apostas de verdade) e **não afeta o seu resultado nem o RTP**. Não existe mais nenhum "jogador falso" em outro lugar do site (o antigo ticker de vitórias no lobby, o ranking diário fake e a contagem de "X jogando agora" nos cards foram **removidos** — antes de ir pro ar de verdade, não faz sentido mostrar números fictícios como se fossem reais).

---

## 🎫 Passe de Batalha

- **100 níveis**, cada um custando **600 XP** (o XP é o mesmo do perfil: 1 XP a cada BZ$10 apostados) — são **60.000 XP** para zerar o passe.
- **Organizado em 10 capítulos de 10 níveis, um por personagem**: o Capítulo 1 é dedicado a todos os **4 Amigos dos Bazingas** juntos (Dhani, Shadow, CBPB_Gamer, Alien Jo); os Capítulos 2–10 são um pra cada um dos **9 membros da Equipe BZG** (Abóbora, Panetone, Canoa Furada, 616, Pikles Gamer, Pilha Avulsa, Linden, Bogão, Pitoco) — ver `CHAPTERS` em `js/pages/passe.js` e `SPECIALS` em `js/core/battlepass.js`. Uma barra de navegação rápida no topo pula direto para qualquer capítulo.
- **Todo nível dá uma recompensa específica** (nenhum nível "genérico" — ver `SPECIALS` em `battlepass.js`, cobre os 100 níveis 1 a 1): 44 níveis dão cosméticos — 23 avatares (um pra cada personagem, o mesmo avatar que dá pra ganhar completando a Coleção dele, é só um segundo caminho pro mesmo prêmio), as 7 cores de nome, os 6 temas extras, os 7 títulos e o Modo Turbo (nível 30). Os outros **56 níveis dão uma figurinha garantida da Coleção** do personagem daquele capítulo (reward `collectible`, chama `storage.grantCollectible` direto — sem depender do drop aleatório).
- **A única recarga do Passe vem do bônus de capítulo**: ao resgatar o último nível de qualquer um dos 10 capítulos (10, 20, 30... 100), o jogador ganha **+BZ$ 5.000 de recarga** — exatamente uma vez por capítulo, **+BZ$ 50.000 no total** ao zerar o passe inteiro. Nenhum outro nível dá recarga. Ver `CHAPTER_BONUS` em `battlepass.js`; cada capítulo mostra esse aviso no cabeçalho.
- Progresso e resgate ficam em `passe.html`; o botão "Resgatar tudo" resgata todos os níveis já alcançados de uma vez, em qualquer capítulo (incluindo os bônus de capítulo).

## 🎴 Coleção de colecionáveis

- Um **álbum de figurinhas temáticas** com dois grupos — ver `js/core/collectibles.js`:
  - **🎪 Equipe BZG**: 9 personagens (Abóbora, Panetone, Canoa Furada, 616, Pikles Gamer, Pilha Avulsa, Linden, Bogão, **Pitoco**), **10 itens cada = 90**.
  - **🤝 Amigos dos Bazingas**: 4 personagens (Dhani, Shadow, CBPB_Gamer, Alien Jo — cada um também estrela um dos minigames sem aposta), **5 itens cada = 20**.
  - **110 colecionáveis no total.**
- **Duas formas de conseguir figurinhas**: (1) **drop 100% aleatório** — toda aposta, em **qualquer jogo**, tem uma chance pequena (15%) de soltar uma figurinha sorteada entre **todos os 110 itens de todos os personagens**, sem nenhum vínculo com o jogo que você está jogando (ver evento `bzg:bet-recorded` → `collectibles.rollOnBet()` em `layout.js`); (2) **56 níveis do Passe de Batalha dão uma figurinha garantida** do personagem daquele capítulo (reward `collectible` em `battlepass.js`) — sem depender de sorte.
- **Completar o álbum de um personagem desbloqueia o avatar exclusivo dele** (o mesmo avatar usado pelo bot daquele personagem no painel ao vivo, quando aplicável).
- Página própria em `colecao.html`, separada nas duas seções acima, com aba "Álbum" (funcional) e aba **"Loja" marcada como Em breve** — comprar pacotes com BZ$ é a próxima etapa, ainda não implementada.
- No Perfil aparece um resumo compacto do progresso de cada personagem, com link para o álbum completo.

## 🧱 Minigames (sem aposta)

- Seção separada dos jogos de aposta: minigames que **não mexem no saldo**, vivem em `minigames/` (com `css/minigames/` e `js/minigames/` próprios) e têm sua própria seção na sidebar. Cada um é estrelado por um dos Amigos dos Bazingas.

| Minigame | Amigo | Mecânica | Recompensa |
|---|---|---|---|
| 🧱 Torre do CBPB_Gamer | CBPB_Gamer | Empilhar blocos, clique/espaço na hora certa (era "Torre da Turma") | XP + recorde de andares |
| 🏳️‍🌈 Sequência Arco-íris | Dhani | Memorize e repita a sequência de cores (tipo Simon Says) | XP + recorde de rodadas |
| 🌑 Sombra Rápida | Shadow | Clique nos "olhos" antes que sumam, 30s por rodada (tipo whack-a-mole) | XP + recorde de acertos |
| 👽 Fuga Alienígena | Alien Jo | Desvie de meteoros com o disco voador (mouse/toque/setas), em canvas | XP + recorde de segundos |

- Todos dão XP direto (`storage.addXp`) e guardam recorde pessoal (`storage.reportMinigameScore`/`getMinigameBest`, campo genérico `best`). Sem relação com os jogos de aposta existentes (ex.: a Torre não tem ligação com "Lixeira do Linden").
- Mais minigames podem ser adicionados depois seguindo o mesmo padrão (`MINIGAME_ITEMS` em `layout.js`).

## ⚙️ Configurações

- Música e efeitos sonoros (ligar/desligar)
- Tema visual: dark/light + 6 temas extras (desbloqueados no Passe) — também dá pra trocar pelo mostruário na página de Perfil
- Modo Turbo: acelera as animações dos jogos (desbloqueado no Passe, nível 30)
- Conta: editar perfil, ver saldo e valor de recarga atual, **sair da conta**
- Zona de perigo: apagar todos os dados (saldo, perfil, histórico, conquistas e conta)

## 💳 Saldo e recarga

- Todo jogador começa com **BZ$ 10.000**.
- O botão "Recarregar" (na topbar e em Configurações) preenche o saldo até o **valor de recarga atual** (base + bônus do Passe de Batalha).
- **Se o saldo chegar a zero**, o site recarrega sozinho automaticamente (sem precisar clicar em nada) e avisa com um toast — ver o listener central em `layout.js` (`bzg:balance-changed`).
- **Topbar**: logo depois do menu, um **card de perfil clicável** (avatar, nome colorido, título, nível) leva direto pro Perfil — antes ficava só na sidebar. Mais à direita, 3 mini-campos mostram sempre **Nível**, **Recorde de saldo** (maior saldo que o jogador já teve, `stats.peakBalance`) e **Maior prêmio** (maior pagamento em uma única aposta, `stats.maxWin`) — tudo atualiza ao vivo a cada aposta/bônus/recarga.

## 🏆 Conquistas

**80 conquistas** em `js/core/achievements.js`, cobrindo: primeira aposta, sequências de vitória/derrota, multiplicadores altos, marcos de saldo e de volume apostado, níveis do perfil e do Passe, bônus diário, cosméticos desbloqueados, recargas automáticas, marcos específicos de cada jogo (ex.: acertar o branco no Double, número cheio na Roleta, blackjack natural), progresso na Coleção de colecionáveis (Equipe, Amigos e tudo junto) e recordes nos 4 minigames sem aposta. São verificadas automaticamente a cada aposta.

---

## ▶️ Como jogar localmente

Não precisa instalar nada: baixe o projeto e dê **duplo-clique em `index.html`**. Como não há cadastro ainda nesse navegador, ele vai te mandar direto para `cadastro.html` — crie uma conta (fictícia) e o resto do site libera. Tudo funciona offline, **exceto a música de fundo** (ver Tecnologia abaixo), que precisa de internet.

## 🛠️ Tecnologia

- HTML + CSS + JavaScript puro — sem frameworks, sem build, sem servidor
- Persistência via `localStorage` (uma chave única `bazingaBetState`, mais `bzgTheme`/`bzgMusic`/`bzgSfx`)
- Efeitos sonoros gerados por código com Web Audio API (sem arquivos de áudio) — 100% local
- **Música de fundo**: um vídeo do YouTube tocando em loop, escondido (só o áudio, sem player visível na tela) via YouTube IFrame API — ver `js/core/sounds.js`. É a **única parte do site que depende de internet**; sem conexão, ela simplesmente não toca e o resto do site continua funcionando normalmente. Como todo autoplay com som, só começa a tocar depois do primeiro clique/tecla do jogador (mesma regra de navegadores que já valia antes).
- RTPs calibrados por simulação de Monte Carlo (scripts descartáveis, não fazem parte do site)

## 🚀 Deploy

O site é 100% estático. Publicado no [Vercel](https://vercel.com), com deploy automático a cada push no GitHub:

1. Suba este repositório para o GitHub
2. No Vercel, clique em **Add New → Project** e importe o repositório
3. Não precisa configurar nada (sem build command, sem output directory) — só clicar em **Deploy**
4. Todo push na branch `main` publica sozinho

---

## 📝 Changelog

### v1.10 (2026-07-09)
- **Recarga do Passe rebalanceada**: a recarga deixou de vir de dezenas de níveis avulsos — agora o **único jeito de ganhar recarga no Passe é o bônus de capítulo** (+BZ$ 5.000 exatos por capítulo completo, 10 no total = +BZ$ 50.000 ao zerar). Todos os 56 níveis que antes davam `reloadBoost` agora dão uma **figurinha garantida da Coleção** do personagem daquele capítulo (novo reward `collectible` em `battlepass.js`, chama `storage.grantCollectible` direto). Passe de Batalha agora tem uma recompensa específica em **todos** os 100 níveis (nenhum nível "genérico" sobrando).
- **Corrigido bug de reinício no meio da partida** (relatado por um jogador) na **Sombra Rápida** e na **Sequência Arco-íris**: o botão de ação também serve pra reiniciar durante a partida ("Reiniciar"), mas clicar nele no meio de uma rodada não cancelava os `setTimeout` da rodada anterior — duas sequências ficavam rodando ao mesmo tempo, causando comportamento errado (sombras/pads acendendo fora de hora, placar estranho). `sombra.js` agora cancela os timers antigos no início de `startGame()`; `arcoiris.js` usa um contador de "geração" (`gameToken`) pra invalidar cadeias antigas e força limpar todos os pads ao reiniciar. Torre e Fuga Alienígena não tinham esse bug (usam `cancelAnimationFrame`/redesenho completo a cada frame, sem estado de CSS residual).

### v1.9 (2026-07-09)
- **Nível muito mais difícil de subir**: saiu o custo fixo de 1.000 XP por nível, entrou uma **curva progressiva** — cada nível pede 100 XP a mais que o anterior (nível 1→2 custa 1.000, 2→3 custa 1.100, 3→4 custa 1.200...). No nível 25 já é ~2x mais difícil que antes; no nível 100, quase 6x mais difícil (584.100 XP acumulado, contra 99.000 antes). Ver `xpForLevel()`/`getLevel()` em `storage.js`. As conquistas de nível (10/25/50/75/100 e "Veterano") foram recalculadas pros novos limiares. O Passe de Batalha **não muda** (continua 600 XP fixo por nível — usa o mesmo XP total, mas com progressão própria).
- **Política de Privacidade** (`privacidade.html`, nova): explica o que é guardado (hoje, nada em servidor — tudo no `localStorage`), os serviços de terceiros usados (Google Fonts, YouTube) e o que muda quando o multiplayer chegar. Acessível mesmo sem conta; linkada no cadastro e em Configurações.
- **Passe de Batalha reestruturado por personagem**: os 10 capítulos deixaram de ter nomes genéricos e passaram a ser 1 por personagem — Capítulo 1 = **todos os 4 Amigos dos Bazingas juntos**, Capítulos 2–10 = um pra cada um dos **9 membros da Equipe BZG** (Abóbora, Panetone, Canoa Furada, 616, Pikles Gamer, Pilha Avulsa, Linden, Bogão, Pitoco).
- **Passe de Batalha com muito mais cosméticos**: 44 níveis com recompensa especial agora (eram 33) — 23 avatares (quase o dobro, incluindo um de cada personagem), as 7 cores, os 6 temas extras e os 7 títulos continuam todos lá. Inclui os avatares 🐒 (Macaco) e 🇧🇷 (Bandeira do Brasil) pedidos pelo usuário.
- **Bônus de capítulo**: completar (resgatar) o último nível de qualquer um dos 10 capítulos dá **+BZ$ 5.000 de recarga extra**, além do que aquele nível já desse — ver `CHAPTER_BONUS` em `battlepass.js`. Aparece como aviso no cabeçalho de cada capítulo em `passe.html`.

### v1.8 (2026-07-08)
- **Cadastro simplificado**: removido o campo de e-mail — agora é só nome de jogador e senha. `storage.js` `createAccount()` não guarda mais e-mail (contas antigas que já tinham o campo continuam funcionando normalmente, o campo só fica sem uso).
- **Música de fundo trocada**: saiu a trilha gerada por código (acordes via Web Audio API), entrou um vídeo do YouTube em loop, tocando escondido (só áudio, sem player visível) via YouTube IFrame API. É a única parte do site que passa a depender de internet — sem conexão, só a música não toca, o resto (efeitos sonoros inclusive) continua 100% local. Mesma regra de autoplay de antes: só começa a tocar depois do primeiro clique/tecla.
- **Corrigido o avatar do Alien Jo**: voltou a ser 👽 (o pedido original) — o problema não era o emoji, era ele já estar liberado de graça pra todo mundo (na lista base de avatares) e também como recompensa do Passe, o que tornava inútil completar o álbum dele. Removido 👽 da lista de avatares gratuitos; agora é exclusivo de quem completa a Coleção do Alien Jo **ou** chega ao nível 27 do Passe. A dica de cadeado no Perfil agora mostra as duas formas quando existem duas.

### v1.7 (2026-07-08)
- **Card de perfil movido da sidebar pro header**: avatar, nome colorido, título e nível agora aparecem num chip clicável na topbar (logo após o menu), em vez de no rodapé da sidebar. O link "Perfil" na sidebar virou um item simples igual aos outros (Coleção, Passe, Configurações).
- **Corrigido bug do Recorde de Saldo**: quem já jogava antes da v1.6 ficava travado mostrando exatamente BZ$ 10.000 de recorde, mesmo tendo saldo muito maior — o preenchimento automático de campos novos (`Object.assign`) escondia a falta do dado antes do código de fallback rodar, então o fallback nunca disparava. Também corrigido: `claimBonus()` (bônus diário) não atualizava o recorde de saldo.
- **Novo membro da Equipe BZG: 🐣 Pitoco** — 9º personagem, com álbum de 10 figurinhas próprio (mascote da casa, sem jogo associado) e entrada no painel ao vivo do Crash/Double (`bots.js`).
- **Novo grupo na Coleção: 🤝 Amigos dos Bazingas** — 4 personagens novos, cada um com álbum de 5 figurinhas e seu próprio minigame sem aposta: Dhani (🏳️‍🌈), Shadow (🌑), CBPB_Gamer (🎮) e Alien Jo (🛸). Coleção agora tem 110 itens no total (era 80), exibidos em duas seções separadas em `colecao.html`.
- **3 minigames novos + 1 retematizado** (Torre da Turma virou "Torre do CBPB_Gamer", com paleta neon): Sequência Arco-íris (Dhani, memória tipo Simon Says), Sombra Rápida (Shadow, reflexo tipo whack-a-mole, 30s por rodada) e Fuga Alienígena (Alien Jo, desviar de meteoros em canvas). `storage.js` generalizou o campo de recorde de minigame de `bestFloor` (só fazia sentido pra Torre) para `best` (serve pra qualquer um), com migração automática pra quem já tinha recorde salvo na Torre.
- **Esclarecimento**: o drop de colecionáveis **já era** 100% aleatório entre todos os personagens desde a v1.6 — nenhum jogo específico sorteia só a figurinha "dele". Isso ficou mais explícito na documentação.
- **+6 conquistas novas** (total 80): álbum completo da Equipe, álbum completo dos Amigos, e recordes nos 3 minigames novos, além de uma por ter pelo menos 1 recorde em cada minigame.

### v1.6 (2026-07-08)
- **Primeiros passos rumo à v2.0** (visão de multiplayer/placar de líderes com jogadores reais — ainda não implementada; tudo abaixo continua 100% local, sem backend):
- **Topbar**: 3 mini-campos novos ao lado do saldo — Nível, Recorde de saldo (`stats.peakBalance`, novo) e Maior prêmio (`stats.maxWin`). `storage.js` agora rastreia o pico de saldo em todo ponto que altera o saldo (aposta, bônus diário, recarga manual/automática).
- **Perfil reestruturado**: avatares, cores de nome, títulos e temas agora mostram **todos os itens possíveis**, os bloqueados com selo de cadeado 🔒 e dica de como desbloquear (Passe de Batalha ou Coleção) — antes só apareciam os já desbloqueados. Novas seções de Temas (mostruário com clique pra aplicar) e resumo da Coleção. Estatísticas ganharam "Recorde de saldo" e "Maior prêmio único".
- **Passe de Batalha reestruturado em 10 capítulos temáticos** de 10 níveis cada, com navegação rápida por capítulo (era uma lista única com os 100 níveis em sequência).
- **Coleção de colecionáveis** (novo sistema): álbum de 80 figurinhas (8 personagens BZG × 10), com drop aleatório a cada aposta (15% de chance) e avatar exclusivo ao completar o álbum de um personagem. Nova página `colecao.html`; aba "Loja" já visível mas marcada Em breve.
- **Minigame sem aposta**: "Torre da Turma" (`minigames/torre.html`) — empilhar blocos sem arriscar fichas, dá XP e guarda recorde pessoal. Nova pasta `minigames/` (com `css/minigames/`, `js/minigames/`) e nova seção "Minigames" na sidebar, preparada para receber mais minigames no futuro.
- **+7 conquistas novas** (total 74): progresso na Coleção (primeira figurinha, 20, 50, álbum completo de 1 personagem, todos os 8) e recordes na Torre da Turma (10 e 25 andares).
- Corrigido durante o desenvolvimento: `claimBonus()` não estava atualizando o recorde de saldo (`peakBalance`) ao creditar o bônus diário.

### v1.5 (2026-07-08)
- **Reorganização completa de pastas**: todos os HTML de jogo foram movidos para `games/`; só lobby, perfil, config, passe e o novo cadastro ficam na raiz. `layout.js` calcula os caminhos dinamicamente (raiz vs. `games/`).
- **Cadastro obrigatório**: nova tela `cadastro.html` (nome, e-mail, senha — guardado só no navegador, sem backend). Todo acesso ao site exige conta; "Sair da conta" disponível em Configurações.
- **Removidos os "jogadores falsos" externos**: ticker de vitórias, ranking diário e contagem de "X jogando agora" no lobby saíram do ar. O painel ao vivo de apostas do Crash e do Double foi mantido (é atmosfera do jogo, não prova social).
- **Bazinguinha e Bazinga Bonanza** marcados como "Em desenvolvimento": sem link ativo na sidebar/lobby, acesso direto pela URL redireciona pro lobby.
- **Passe de Batalha**: agora com 100 níveis (era 30), custando 600 XP cada (era 400). Parou de dar dinheiro direto; níveis "comuns" agora dão **+BZ$ 5.000 no valor de recarga** (reward `reloadBoost`).
- **Recarga automática**: se o saldo zerar, o site recarrega sozinho (usa o valor de recarga atual, incluindo bônus do Passe) e avisa por toast.
- **+56 conquistas novas** (total 67), cobrindo progressão de nível, Passe de Batalha, saldo, volume apostado, sequências, multiplicadores, bônus diário, cosméticos e marcos específicos de cada jogo.
- **Documentação**: este README foi totalmente reescrito para refletir o estado atual do projeto.
- Corrida BZG (Horse) já tinha sido simplificada nesta mesma sessão para pagar 2x fixo por corredor (sem odds diferentes).
- Faxina de código morto: `bots.js` perdeu as funções que só serviam pro ticker/ranking removidos; CSS órfão do ticker/ranking removido de `style.css`.

### v1.0 (2026-07-05 a 2026-07-08)
- Lançamento inicial com 15+ jogos temáticos da equipe BZG, bônus diário, conquistas, Big Win, perfil com nível/XP, múltiplos temas visuais, Modo Turbo, Passe de Batalha (versão de 30 níveis), e os jogos Bazinga Bonanza / Corrida BZG (com odds variáveis, depois simplificada).
- Removidos por serem redundantes: Slots, Roda da Sorte e o jogo de torre "Torre BZG" (stack).
