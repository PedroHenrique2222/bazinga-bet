# 🎰 Bazinga BET — v1.0

Simulador de casa de apostas **sem dinheiro real** — só diversão! Você recebe BZ$ 10.000 fictícios e pode jogar 15 jogos de cassino, com bots apostando ao vivo, bônus diário, conquistas, perfil com nível/XP, tema claro/escuro e efeitos sonoros.

> ⚠️ Este projeto é 100% de brincadeira. Não envolve dinheiro real, apostas reais nem pagamentos de nenhum tipo.

## 🎮 Jogos

| Jogo | Descrição |
|---|---|
| 🐯 Bazinguinha | Estilo Tigrinho 3×3, curinga ⚡ com multiplicadores x2/x5/x10 |
| 🎟️ Raspadinha | Raspe 9 campos e ache 3 iguais |
| 📉 Limbo | Passou do seu alvo? Você ganha |
| 🎡 Roda da Sorte | Gire a roda até 15x |
| 🪙 Cara ou Coroa | Escolha um lado, quase 2x |
| 🚀 Crash | Rodadas ao vivo: retire antes do multiplicador explodir |
| 🎡 Double | Roleta vermelho/preto/branco (branco paga 14x) |
| 💎 Mines | Revele células e fuja das bombas |
| 🗼 Tower | Suba 8 andares sem pisar na armadilha |
| 🎱 Plinko | Física real, várias bolinhas, 8/12/16 linhas |
| 🎲 Dice | Acima ou abaixo do alvo |
| 🃏 HiLo | A próxima carta vem maior ou menor? |
| 🎰 Slots | Caça-níquel com jackpot ⚡ de 500x |
| 🎯 Roleta | Roleta europeia com mesa de apostas completa |
| 🎭 Blackjack | O 21 clássico contra o dealer |

## ✨ Recursos

- **Bônus diário** com sequência (quanto mais dias seguidos, maior o prêmio)
- **Conquistas** desbloqueáveis, exibidas no perfil
- **Animação de Big Win** para prêmios grandes
- **Bots ao vivo**: feed de vitórias, contador de jogadores online, ranking do dia
- **Tela de configurações**: som, tema, perfil e apagar dados

## ▶️ Como jogar localmente

Não precisa instalar nada: baixe o projeto e dê **duplo-clique em `index.html`**. Abre direto no navegador.

O saldo, histórico e perfil ficam salvos no próprio navegador (localStorage).

## 🛠️ Tecnologia

- HTML + CSS + JavaScript puro — sem frameworks, sem build, sem servidor
- Persistência via `localStorage`
- Sons gerados por código com Web Audio API (sem arquivos de áudio)
- Física do Plinko calibrada por simulação (18 mil bolinhas)

## 🚀 Deploy

O site é 100% estático. Para publicar no [Vercel](https://vercel.com):

1. Suba este repositório para o GitHub
2. No Vercel, clique em **Add New → Project** e importe o repositório
3. Não precisa configurar nada (sem build command, sem output directory) — só clicar em **Deploy**
