# PRD — Bazinga BET

## 1. Visão geral

**Bazinga BET** é um simulador de casa de apostas **sem dinheiro real**, feito por diversão. O jogador recebe fichas fictícias e pode jogá-las em jogos clássicos de cassino online (Crash, Mines, Plinko). Não há dinheiro real envolvido, não há cadastro de usuários, não há banco de dados externo, e não há hospedagem — o projeto roda 100% local, direto no navegador.

## 2. Objetivo

Criar uma experiência divertida e visualmente convincente de "casa de apostas", reproduzindo a sensação dos jogos originais (tipo Stake), mas totalmente offline, sem riscos e sem custos.

## 3. Escopo

### Dentro do escopo
- Site estático (HTML/CSS/JavaScript puro), aberto direto no navegador via `index.html`, sem servidor e sem instalação.
- Saldo de fichas fictícias, compartilhado entre todos os jogos.
- 3 jogos: **Crash**, **Mines**, **Plinko**.
- Persistência local via `localStorage` do navegador (saldo e estatísticas continuam salvos entre sessões, no mesmo navegador/computador).
- Histórico de apostas e estatísticas gerais.
- Botão para recarregar o saldo quando chegar a zero.
- Visual escuro estilo cassino, com detalhes em vermelho e amarelo.
- Animações e efeitos sonoros (vitória, derrota, eventos de cada jogo).

### Fora do escopo (por enquanto)
- Dinheiro real ou qualquer forma de pagamento.
- Contas de usuário, login, multiplayer.
- Banco de dados externo ou backend/servidor.
- Hospedagem publica (deploy na internet).
- Outros jogos além de Crash, Mines e Plinko (podem ser adicionados depois).

## 4. Público-alvo

Uso pessoal do dono do projeto (e talvez amigos, rodando localmente cada um na própria máquina). Não é um produto multiusuário.

## 5. Economia do jogo (fichas)

- **Saldo inicial:** 10.000 fichas, na primeira vez que o site é aberto.
- **Saldo compartilhado:** um único saldo de fichas, usado nos três jogos.
- **Persistência:** o saldo e o histórico são salvos automaticamente no `localStorage` do navegador. Fechar a aba/navegador não perde o progresso. Limpar os dados do navegador, sim.
- **Zerou o saldo:** aparece um botão "Recarregar fichas" que restaura o saldo para 10.000. Esse botão fica sempre visível/acessível, não só quando zera.

## 6. Jogos

### 6.1 Crash
- Um multiplicador começa em 1.00x e sobe continuamente (animação em tempo real).
- O jogador faz uma aposta antes da rodada começar e escolhe quando clicar em "Retirar" para embolsar o valor da aposta × multiplicador do momento.
- Em um ponto aleatório, o jogo "explode" (crash). Quem não retirou antes disso perde a aposta.
- Feedback visual (gráfico de linha subindo, cor mudando com o risco) e sonoro (som de explosão no crash, som de "cha-ching" ao retirar).

### 6.2 Mines
- Um grid (ex.: 5×5) de células escondidas, com um número configurável de "bombas" escolhido pelo jogador antes de apostar.
- O jogador clica nas células para revelá-las; cada célula segura aumenta o multiplicador acumulado.
- O jogador pode parar e "colher" o prêmio (aposta × multiplicador atual) a qualquer momento.
- Se clicar numa bomba, perde a aposta e a rodada termina.

### 6.3 Plinko
- Uma bolinha é solta no topo de um funil de pinos e quica até cair em um slot na base.
- Cada slot tem um multiplicador diferente (multiplicadores maiores nas bordas, menores no centro — ou o inverso, dependendo do nível de risco escolhido).
- O jogador escolhe o valor da aposta e o nível de risco (ex.: baixo/médio/alto, alterando os multiplicadores disponíveis) antes de soltar a bolinha.
- Ganho = aposta × multiplicador do slot em que a bolinha cair.

## 7. Histórico e estatísticas

- Histórico das últimas apostas por jogo (valor apostado, resultado, multiplicador, ganho/perda).
- Painel de estatísticas gerais: total apostado, total ganho, total perdido, maior multiplicador atingido, sequência atual de vitórias/derrotas.
- Dados de histórico/estatística também salvos no `localStorage`.

## 8. Visual e experiência

- **Tema:** escuro (fundo preto/cinza-chumbo), com detalhes em **vermelho e amarelo** como cores de destaque (botões, multiplicadores, alertas), estilo neon de cassino noturno.
- **Tela inicial (lobby):** cards para escolher entre Crash, Mines e Plinko, com o saldo de fichas sempre visível no topo.
- **Animações:** multiplicador subindo no Crash, células revelando no Mines, bolinha quicando no Plinko, transições suaves entre estados.
- **Sons:** efeitos para apostar, ganhar, perder, e eventos específicos de cada jogo (explosão no Crash, bomba no Mines, "plim" da bolinha caindo no Plinko).

## 9. Tecnologia

- **HTML + CSS + JavaScript puro**, sem frameworks obrigatórios (nada de React/servidor/Node para rodar).
- Nenhuma instalação necessária: dá duplo-clique em `index.html` e o site abre no navegador (Chrome, Edge, Firefox etc.).
- Toda a lógica dos jogos, geração de números aleatórios, e persistência rodam no próprio navegador (client-side).
- Estrutura de arquivos simples (ex.: `index.html`, pasta `css/`, pasta `js/`, pasta `assets/` para sons/imagens).

## 10. Fora de escopo / riscos assumidos

- Como é só para diversão local, não há preocupação com "jogo justo" no sentido de auditoria externa — o aleatório é gerado no navegador (`Math.random()` ou equivalente).
- Sem responsividade mobile garantida na v1 (foco em desktop/navegador); pode ser considerado depois.
- Sem testes automatizados formais na v1, dado o tamanho do projeto — validação será manual, jogando cada jogo.

## 11. Critérios de sucesso

- Dá para abrir o `index.html` e jogar os 3 jogos sem erros.
- O saldo persiste corretamente entre uma sessão e outra no mesmo navegador.
- Cada jogo tem uma mecânica de risco/recompensa clara e funcional, com round justo (aleatoriedade correta).
- Visual e sons entregam a sensação de "casa de apostas" de forma convincente.

## 12. Próximos passos

1. Definir estrutura de pastas e arquivos do projeto.
2. Implementar o "core": saldo, persistência em `localStorage`, lobby inicial.
3. Implementar Crash.
4. Implementar Mines.
5. Implementar Plinko.
6. Implementar histórico/estatísticas.
7. Polimento visual, animações e sons.
8. Teste manual completo dos três jogos.
