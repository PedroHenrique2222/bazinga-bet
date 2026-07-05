# 🎰 Bazinga BET

Simulador de casa de apostas **sem dinheiro real** — só diversão! Você recebe BZ$ 10.000 fictícios e pode jogar 10 jogos clássicos de cassino, com bots apostando ao vivo, perfil com nível/XP, tema claro/escuro e efeitos sonoros.

> ⚠️ Este projeto é 100% de brincadeira. Não envolve dinheiro real, apostas reais nem pagamentos de nenhum tipo.

## 🎮 Jogos

| Jogo | Descrição |
|---|---|
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
