/* Bazinga BET - Blackjack (21) contra o dealer: pedir, parar, dobrar */
(function () {
  var SUITS = [
    { symbol: "♠", red: false },
    { symbol: "♣", red: false },
    { symbol: "♥", red: true },
    { symbol: "♦", red: true }
  ];
  var RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

  var betInput, dealBtn, actionsEl, hitBtn, standBtn, doubleBtn, statusEl, historyListEl,
      dealerCardsEl, playerCardsEl, dealerTotalEl, playerTotalEl, messageEl, stageEl;

  var deck = [];
  var playerHand = [];
  var dealerHand = [];
  var currentBet = 0;
  var state = "idle"; // "idle" | "player" | "dealer"

  function setStatus(text) {
    statusEl.textContent = text;
  }

  /* ---------- Baralho ---------- */

  function buildDeck() {
    deck = [];
    for (var s = 0; s < SUITS.length; s++) {
      for (var r = 0; r < RANKS.length; r++) {
        deck.push({ rank: RANKS[r], suit: SUITS[s] });
      }
    }
    for (var i = deck.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = deck[i]; deck[i] = deck[j]; deck[j] = tmp;
    }
  }

  function draw() {
    return deck.pop();
  }

  function cardValue(rank) {
    if (rank === "A") return 11;
    if (rank === "J" || rank === "Q" || rank === "K") return 10;
    return Number(rank);
  }

  /* total da mao considerando ases flexiveis (11 -> 1) */
  function handTotal(hand) {
    var total = 0;
    var aces = 0;
    hand.forEach(function (c) {
      total += cardValue(c.rank);
      if (c.rank === "A") aces++;
    });
    while (total > 21 && aces > 0) {
      total -= 10;
      aces--;
    }
    return total;
  }

  function isBlackjack(hand) {
    return hand.length === 2 && handTotal(hand) === 21;
  }

  /* ---------- Renderizacao ---------- */

  function cardHTML(card) {
    return '<div class="bj-card' + (card.suit.red ? " suit-red" : "") + '">' +
      '<span class="rank">' + card.rank + '</span>' +
      '<span class="suit">' + card.suit.symbol + '</span>' +
      '</div>';
  }

  function renderHands(hideDealerHole) {
    playerCardsEl.innerHTML = playerHand.map(cardHTML).join("");
    playerTotalEl.textContent = String(handTotal(playerHand));

    if (hideDealerHole && dealerHand.length >= 2) {
      dealerCardsEl.innerHTML = cardHTML(dealerHand[0]) + '<div class="bj-card bj-card--back">⚡</div>';
      dealerTotalEl.textContent = String(cardValue(dealerHand[0].rank));
    } else {
      dealerCardsEl.innerHTML = dealerHand.map(cardHTML).join("");
      dealerTotalEl.textContent = dealerHand.length ? String(handTotal(dealerHand)) : "";
    }
  }

  function renderHistory() {
    var entries = BZG.storage.getHistory("blackjack");
    historyListEl.innerHTML = entries.slice(0, 8).map(function (e) {
      var tagClass = e.won ? "tag--win" : "tag--lose";
      var tagText = e.won ? "GANHOU" : "PERDEU";
      return '<div class="history-row">' +
        '<span class="tag ' + tagClass + '">' + tagText + '</span>' +
        '<span>' + (e.detail || "") + '</span>' +
        '<span>' + BZG.ui.formatMoney(e.payout) + '</span>' +
        '</div>';
    }).join("") || '<p style="color:var(--text-muted); font-size:13px;">Nenhuma mão ainda.</p>';
  }

  function setMessage(text, cls) {
    messageEl.textContent = text;
    messageEl.className = "bj-vs" + (cls ? " " + cls : "");
  }

  /* ---------- Fluxo do jogo ---------- */

  function deal() {
    if (state !== "idle") return;
    var bet = Math.round(Number(betInput.value));
    var balance = BZG.storage.getBalance();

    if (!bet || bet <= 0) {
      BZG.ui.toast("Digite um valor de aposta válido.", "error");
      return;
    }
    if (bet > balance) {
      BZG.ui.toast("Você não tem saldo suficiente.", "error");
      return;
    }

    currentBet = bet;
    buildDeck();
    playerHand = [draw(), draw()];
    dealerHand = [draw(), draw()];
    state = "player";

    betInput.disabled = true;
    dealBtn.style.display = "none";
    actionsEl.style.display = "flex";
    setMessage("");
    BZG.sounds.bet();

    renderHands(true);
    updateDoubleAvailability();

    // blackjack natural resolve na hora
    if (isBlackjack(playerHand)) {
      if (isBlackjack(dealerHand)) {
        endRound("push");
      } else {
        endRound("blackjack");
      }
      return;
    }
    if (isBlackjack(dealerHand)) {
      endRound("lose");
      return;
    }

    setStatus("Sua vez: pedir carta, parar ou dobrar.");
  }

  function updateDoubleAvailability() {
    // dobrar: so com 2 cartas e saldo para cobrir a aposta extra
    doubleBtn.disabled = !(playerHand.length === 2 && BZG.storage.getBalance() >= currentBet * 2);
  }

  function hit() {
    if (state !== "player") return;
    playerHand.push(draw());
    renderHands(true);
    updateDoubleAvailability();
    BZG.sounds.click();

    var total = handTotal(playerHand);
    if (total > 21) {
      endRound("bust");
    } else if (total === 21) {
      stand();
    } else {
      setStatus("Você tem " + total + ". Pedir ou parar?");
    }
  }

  function doubleDown() {
    if (state !== "player" || playerHand.length !== 2) return;
    if (BZG.storage.getBalance() < currentBet * 2) {
      BZG.ui.toast("Saldo insuficiente para dobrar.", "error");
      return;
    }
    currentBet *= 2;
    playerHand.push(draw());
    renderHands(true);
    BZG.sounds.bet();
    setStatus("Dobrou para " + BZG.ui.formatMoney(currentBet) + "! Uma carta e fica.");

    if (handTotal(playerHand) > 21) {
      endRound("bust");
    } else {
      stand();
    }
  }

  function stand() {
    if (state !== "player") return;
    state = "dealer";
    hitBtn.disabled = true;
    standBtn.disabled = true;
    doubleBtn.disabled = true;
    setStatus("Dealer revelando...");
    renderHands(false);

    // dealer compra ate 17 (para em todos os 17), com pausa entre cartas
    function dealerStep() {
      if (handTotal(dealerHand) < 17) {
        setTimeout(function () {
          dealerHand.push(draw());
          renderHands(false);
          BZG.sounds.click();
          dealerStep();
        }, 650);
      } else {
        setTimeout(resolveShowdown, 500);
      }
    }
    setTimeout(dealerStep, 600);
  }

  function resolveShowdown() {
    var playerTotal = handTotal(playerHand);
    var dealerTotal = handTotal(dealerHand);

    if (dealerTotal > 21) endRound("win");
    else if (playerTotal > dealerTotal) endRound("win");
    else if (playerTotal < dealerTotal) endRound("lose");
    else endRound("push");
  }

  function endRound(outcome) {
    state = "idle";
    renderHands(false);

    var mult, won, label, msgCls;
    if (outcome === "blackjack") {
      mult = 2.5; won = true; label = "Blackjack!"; msgCls = "win";
    } else if (outcome === "win") {
      mult = 2; won = true; label = "Você venceu!"; msgCls = "win";
    } else if (outcome === "push") {
      mult = 1; won = true; label = "Empate — aposta devolvida."; msgCls = "push";
    } else if (outcome === "bust") {
      mult = 0; won = false; label = "Estourou! Passou de 21."; msgCls = "lose";
    } else {
      mult = 0; won = false; label = "Dealer venceu."; msgCls = "lose";
    }

    var payout = Math.round(currentBet * mult);
    var detail = handTotal(playerHand) + " vs " + handTotal(dealerHand);

    BZG.storage.recordBet("blackjack", {
      bet: currentBet,
      multiplier: mult,
      payout: payout,
      won: mult >= 1, // empate conta como nao-perda (aposta devolvida)
      detail: detail
    });
    BZG.ui.refreshBalance();
    document.dispatchEvent(new CustomEvent("bzg:balance-changed"));
    renderHistory();

    setMessage(label, msgCls);

    if (outcome === "blackjack") {
      setStatus("BLACKJACK! Você ganhou " + BZG.ui.formatMoney(payout) + "!");
      BZG.ui.toast("🃏 Blackjack! +" + BZG.ui.formatMoney(payout), "success");
      BZG.sounds.win();
      BZG.effects.flash(stageEl, "gold");
      var rect = stageEl.getBoundingClientRect();
      BZG.effects.confetti(rect.left + rect.width / 2, rect.top + rect.height / 2, 100);
    } else if (outcome === "win") {
      setStatus("Você venceu com " + detail + " e ganhou " + BZG.ui.formatMoney(payout) + "!");
      BZG.ui.toast("Venceu! +" + BZG.ui.formatMoney(payout), "success");
      BZG.sounds.win();
      BZG.effects.flash(stageEl, "gold");
      var rect2 = stageEl.getBoundingClientRect();
      BZG.effects.confetti(rect2.left + rect2.width / 2, rect2.top + rect2.height / 2, 55);
    } else if (outcome === "push") {
      setStatus("Empate em " + detail + ". Sua aposta foi devolvida.");
      BZG.ui.toast("Empate. Aposta devolvida.", "info");
      BZG.sounds.click();
    } else {
      setStatus(label + " (" + detail + ") Você perdeu " + BZG.ui.formatMoney(currentBet) + ".");
      BZG.ui.toast(label + " -" + BZG.ui.formatMoney(currentBet), "error");
      BZG.sounds.lose();
      BZG.effects.flash(stageEl, "red");
    }

    betInput.disabled = false;
    dealBtn.style.display = "block";
    actionsEl.style.display = "none";
    hitBtn.disabled = false;
    standBtn.disabled = false;
    doubleBtn.disabled = false;
  }

  function quickBet(fn) {
    var current = Number(betInput.value) || 0;
    var balance = BZG.storage.getBalance();
    var next = fn(current, balance);
    betInput.value = Math.max(1, Math.round(next));
  }

  document.addEventListener("DOMContentLoaded", function () {
    betInput = document.getElementById("bet-amount");
    dealBtn = document.getElementById("deal-btn");
    actionsEl = document.getElementById("bj-actions");
    hitBtn = document.getElementById("hit-btn");
    standBtn = document.getElementById("stand-btn");
    doubleBtn = document.getElementById("double-btn");
    statusEl = document.getElementById("round-status");
    historyListEl = document.getElementById("history-list");
    dealerCardsEl = document.getElementById("dealer-cards");
    playerCardsEl = document.getElementById("player-cards");
    dealerTotalEl = document.getElementById("dealer-total");
    playerTotalEl = document.getElementById("player-total");
    messageEl = document.getElementById("bj-message");
    stageEl = document.getElementById("bj-stage");

    BZG.ui.refreshBalance();
    renderHistory();

    dealBtn.addEventListener("click", deal);
    hitBtn.addEventListener("click", hit);
    standBtn.addEventListener("click", stand);
    doubleBtn.addEventListener("click", doubleDown);
    document.getElementById("bet-half").addEventListener("click", function () {
      quickBet(function (v) { return v / 2; });
    });
    document.getElementById("bet-double").addEventListener("click", function () {
      quickBet(function (v) { return v * 2; });
    });
    document.getElementById("bet-max").addEventListener("click", function () {
      quickBet(function (v, balance) { return balance; });
    });
  });
})();
