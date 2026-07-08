# 🎰 Bazinga BET — v1.5

Simulador de casa de apostas **sem dinheiro real** — só diversão! Cadastre-se, receba fichas fictícias (BZ$) e jogue os jogos de cassino da equipe BZG.

> ⚠️ Este projeto é 100% de brincadeira. Não envolve dinheiro real, apostas reais, pagamentos ou saques de nenhum tipo. Tudo fica salvo só no seu navegador.

> 📌 **Regra deste arquivo**: a partir da v1.5, toda mudança feita no projeto é registrada no [Changelog](#-changelog) no fim deste documento, da mais recente para a mais antiga.

---

## 📁 Estrutura de pastas

```
BZG-BET/
├── index.html            Lobby (pagina inicial)
├── cadastro.html         Tela de cadastro/login (obrigatoria no 1o acesso)
├── profile.html          Perfil do jogador (avatar, cor do nome, titulo, stats)
├── passe.html            Passe de Batalha (100 niveis)
├── settings.html         Configuracoes (som, tema, turbo, conta)
├── favicon.svg
├── games/                Todas as paginas de JOGO ficam aqui
│   ├── crash.html, double.html, mines.html, tower.html, plinko.html,
│   │   dice.html, hilo.html, roulette.html, blackjack.html,
│   │   raspadinha.html, limbo.html, coinflip.html, horse.html
│   └── bazinguinha.html, bonanza.html   (EM DESENVOLVIMENTO - ver abaixo)
├── css/
│   ├── style.css         Estilos globais (sidebar, topbar, cards, temas)
│   ├── games/*.css       Estilo especifico de cada jogo
│   └── pages/*.css       Estilo especifico de cada pagina (perfil, passe, config, cadastro)
└── js/
    ├── core/             Modulos compartilhados (ver tabela abaixo)
    ├── games/*.js        Logica de cada jogo
    └── pages/*.js        Logica de cada pagina (lobby, perfil, passe, config, cadastro)
```

Cada jogo é só HTML + CSS + JS puro, sem build. Um jogo em `games/` referencia os arquivos compartilhados com `../` (ex.: `../css/style.css`, `../js/core/storage.js`). As páginas da raiz (lobby, perfil, config, passe, cadastro) referenciam sem `../`.

### Módulos em `js/core/`

| Arquivo | Função |
|---|---|
| `storage.js` | Tudo fica salvo em UM objeto no `localStorage` (`bazingaBetState`): saldo, conta, perfil, estatísticas, histórico, cosméticos, Passe de Batalha |
| `layout.js` | Monta a sidebar e a topbar em toda página; **também é o "porteiro"**: exige cadastro antes de liberar qualquer página, e bloqueia acesso direto aos jogos em desenvolvimento |
| `theme.js` | Sistema de temas (dark/light + 6 temas extras desbloqueáveis no Passe) |
| `sounds.js` | Efeitos sonoros e música ambiente, gerados por código (Web Audio API) |
| `ui.js` | Formatação de dinheiro, toasts (avisos), nome colorido do jogador |
| `bots.js` | Só gera os "outros jogadores" simulados no painel ao vivo do Crash e do Double (ver seção própria) |
| `particles.js` / `effects.js` | Confete, flash de tela, animação de "Big Win" |
| `achievements.js` | Lista de conquistas + verificação automática |
| `modes.js` | Modo Turbo (acelera as animações) |
| `battlepass.js` | Regras do Passe de Batalha |

---

## 🔐 Cadastro (conta local, sem banco de dados)

Ao abrir o site pela primeira vez em um navegador, a **tela de cadastro é obrigatória** (`cadastro.html`) antes de acessar qualquer outra página — isso é verificado por `layout.js` em toda página que carrega a sidebar/topbar.

O cadastro pede nome de jogador, e-mail e senha, mas **não existe servidor nem banco de dados**: tudo fica gravado só no `localStorage` do navegador (dentro do mesmo objeto de sempre, chave `account`). Por isso:

- É **uma conta por navegador** — não dá para "logar" com o mesmo cadastro em outro computador ou celular.
- A senha não passa por nenhum tipo de criptografia real (não faz sentido ter isso sem servidor) — é só para deixar o fluxo pronto para o dia em que o projeto ganhar um backend de verdade.
- "Sair da conta" (em Configurações) volta para a tela de cadastro, mas mantém saldo/histórico salvos — só é preciso cadastrar de novo (ou o próximo visitante do navegador cria a própria conta).
- "Apagar tudo" (em Configurações) apaga a conta também, e o site pede um novo cadastro.

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
- **Não dá mais dinheiro direto.** Os níveis sem recompensa especial dão **+BZ$ 5.000 no valor de recarga** (o botão "Recarregar" fica maior a cada nível desses — ver `battlepass.js`, reward `reloadBoost`).
- ~33 níveis-marco dão recompensas especiais: avatares, cores de nome, temas, títulos e o Modo Turbo (nível 30).
- Progresso e resgate ficam em `passe.html`; o botão "Resgatar tudo" resgata todos os níveis já alcançados de uma vez.

## ⚙️ Configurações

- Música e efeitos sonoros (ligar/desligar)
- Tema visual: dark/light + 6 temas extras (desbloqueados no Passe)
- Modo Turbo: acelera as animações dos jogos (desbloqueado no Passe, nível 30)
- Conta: editar perfil, ver saldo e valor de recarga atual, **sair da conta**
- Zona de perigo: apagar todos os dados (saldo, perfil, histórico, conquistas e conta)

## 💳 Saldo e recarga

- Todo jogador começa com **BZ$ 10.000**.
- O botão "Recarregar" (na topbar e em Configurações) preenche o saldo até o **valor de recarga atual** (base + bônus do Passe de Batalha).
- **Se o saldo chegar a zero**, o site recarrega sozinho automaticamente (sem precisar clicar em nada) e avisa com um toast — ver o listener central em `layout.js` (`bzg:balance-changed`).

## 🏆 Conquistas

Mais de 65 conquistas em `js/core/achievements.js`, cobrindo: primeira aposta, sequências de vitória/derrota, multiplicadores altos, marcos de saldo e de volume apostado, níveis do perfil e do Passe, bônus diário, cosméticos desbloqueados, recargas automáticas e marcos específicos de cada jogo (ex.: acertar o branco no Double, número cheio na Roleta, blackjack natural). São verificadas automaticamente a cada aposta.

---

## ▶️ Como jogar localmente

Não precisa instalar nada: baixe o projeto e dê **duplo-clique em `index.html`**. Como não há cadastro ainda nesse navegador, ele vai te mandar direto para `cadastro.html` — crie uma conta (fictícia) e o resto do site libera.

## 🛠️ Tecnologia

- HTML + CSS + JavaScript puro — sem frameworks, sem build, sem servidor
- Persistência via `localStorage` (uma chave única `bazingaBetState`, mais `bzgTheme`/`bzgMusic`/`bzgSfx`)
- Sons gerados por código com Web Audio API (sem arquivos de áudio)
- RTPs calibrados por simulação de Monte Carlo (scripts descartáveis, não fazem parte do site)

## 🚀 Deploy

O site é 100% estático. Publicado no [Vercel](https://vercel.com), com deploy automático a cada push no GitHub:

1. Suba este repositório para o GitHub
2. No Vercel, clique em **Add New → Project** e importe o repositório
3. Não precisa configurar nada (sem build command, sem output directory) — só clicar em **Deploy**
4. Todo push na branch `main` publica sozinho

---

## 📝 Changelog

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
