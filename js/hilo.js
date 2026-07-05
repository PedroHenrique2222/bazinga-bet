/* Bazinga BET - logica do jogo HiLo */
(function () {
  var HOUSE_EDGE = 0.02;
  var SUITS = [
    { symbol: "♠", red: false },
    { symbol: "♣", red: false },
    { symbol: "♥", red: true },
    { symbol: "♦", red: true }
  ];

  var betInput, startBtn, cashoutBtn, statusEl, historyListEl, multiplierEl, stageEl,
      currentCardEl, nextCardEl, higherBtn, lowerBtn;

  var state = "idle"; // "idle" | "running"
  var currentBet = 0;
  var currentValue = 0;
  var fairProduct = 1;
  var streak = 0;

  function rankLabel(v) {
    if (v === 1) return "A";
    if (v === 11) return "J";
    if (v === 12) return "Q";
    if (v === 13) return "K";
    return String(v);
  }

  function randomSuit() {
    return SUITS[Math.floor(Math.random() * SUITS.length)];
  }

  function formatMult(m) {
    return m.toFixed(2) + "x";
  }

  function setStatus(text) {
    statusEl.textContent = text;
  }

  function currentMultiplier() {
    return fairProduct * (1 - HOUSE_EDGE);
  }

  function renderCard(el, value, suit, faceUp) {
    var rankEl = el.querySelector(".rank");
    var suitEl = el.querySelector(".suit");
    if (faceUp) {
      rankEl.textContent = rankLabel(value);
      suitEl.textContent = suit.symbol;
      el.classList.toggle("suit-red", suit.red);
    } else {
      rankEl.textContent = "?";
      suitEl.textContent = "🂠";
      el.classList.remove("suit-red");
    }
  }

  function renderHistory() {
    var entries = BZG.storage.getHistory("hilo");
    historyListEl.innerHTML = entries.map(function (e) {
      var tagClass = e.won ? "tag--win" : "tag--lose";
      var tagText = e.won ? "GANHOU" : "PERDEU";
      return '<div class="history-row">' +
        '<span class="tag ' + tagClass + '">' + tagText + '</span>' +
        '<span>' + formatMult(e.multiplier) + '</span>' +
        '<span>' + BZG.ui.formatMoney(e.payout) + '</span>' +
        '</div>';
    }).join("") || '<p style="color:var(--text-muted); font-size:13px;">Nenhuma rodada ainda.</p>';
  }

  function updateGuessButtons() {
    higherBtn.disabled = state !== "running" || currentValue >= 13;
    lowerBtn.disabled = state !== "running" || currentValue <= 1;
  }

  function startGame() {
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
    currentValue = 1 + Math.floor(Math.random() * 13);
    fairProduct = 1;
    streak = 0;
    state = "running";

    renderCard(currentCardEl, currentValue, randomSuit(), true);
    nextCardEl.classList.remove("revealed");
    renderCard(nextCardEl, 0, null, false);

    betInput.disabled = true;
    startBtn.style.display = "none";
    cashoutBtn.style.display = "none";
    multiplierEl.textContent = "1.00x";
    updateGuessButtons();
    BZG.sounds.bet();
    setStatus("Carta atual: " + rankLabel(currentValue) + ". A próxima vem maior ou menor?");
  }

  function guess(direction) {
    if (state !== "running") return;

    var higherCount = 13 - currentValue;
    var lowerCount = currentValue - 1;
    var chance = direction === "higher" ? higherCount / 12 : lowerCount / 12;
    if (chance <= 0) return;

    var nextValue;
    do {
      nextValue = 1 + Math.floor(Math.random() * 13);
    } while (nextValue === currentValue);

    var suit = randomSuit();
    renderCard(nextCardEl, nextValue, suit, true);
    nextCardEl.classList.add("revealed", "flip");
    setTimeout(function () { nextCardEl.classList.remove("flip"); }, 400);

    var correct = direction === "higher" ? nextValue > currentValue : nextValue < currentValue;

    if (correct) {
      fairProduct *= (1 / chance);
      streak++;
      BZG.sounds.click();

      var mult = currentMultiplier();
      multiplierEl.textContent = formatMult(mult);
      multiplierEl.classList.remove("bump");
      void multiplierEl.offsetWidth;
      multiplierEl.classList.add("bump");

      currentValue = nextValue;
      setTimeout(function () {
        renderCard(currentCardEl, currentValue, suit, true);
        nextCardEl.classList.remove("revealed");
        renderCard(nextCardEl, 0, null, false);
        updateGuessButtons();
      }, 500);

      cashoutBtn.style.display = "block";
      cashoutBtn.textContent = "Colher " + BZG.ui.formatMoney(currentBet * mult) + " (" + formatMult(mult) + ")";
      setStatus("Acertou! Multiplicador atual: " + formatMult(mult) + ". Continue ou colha seus ganhos.");
      higherBtn.disabled = true;
      lowerBtn.disabled = true;
    } else {
      higherBtn.disabled = true;
      lowerBtn.disabled = true;
      BZG.effects.shake(stageEl);
      BZG.effects.flash(stageEl, "red");
      endRound(false);
    }
  }

  function endRound(won, multOverride) {
    state = "idle";
    var mult = won ? (multOverride || currentMultiplier()) : 0;
    var payout = won ? Math.round(currentBet * mult) : 0;

    BZG.storage.recordBet("hilo", {
      bet: currentBet,
      multiplier: mult,
      payout: payout,
      won: won
    });
    BZG.ui.refreshBalance();
    document.dispatchEvent(new CustomEvent("bzg:balance-changed"));
    renderHistory();

    if (won) {
      setStatus("Você colheu em " + formatMult(mult) + " e ganhou " + BZG.ui.formatMoney(payout) + "!");
      BZG.ui.toast("Colheu em " + formatMult(mult) + "! +" + BZG.ui.formatMoney(payout), "success");
      BZG.sounds.win();
      BZG.effects.flash(stageEl, "gold");
      var rect = multiplierEl.getBoundingClientRect();
      BZG.effects.confetti(rect.left + rect.width / 2, rect.top + rect.height / 2, 70);
    } else {
      setStatus("Errou a carta e perdeu " + BZG.ui.formatMoney(currentBet) + ".");
      BZG.ui.toast("Errou! Você perdeu a aposta.", "error");
      BZG.sounds.lose();
    }

    betInput.disabled = false;
    startBtn.style.display = "block";
    cashoutBtn.style.display = "none";
    updateGuessButtons();
  }

  function cashOut() {
    if (state !== "running" || streak === 0) return;
    endRound(true);
  }

  function quickBet(fn) {
    var current = Number(betInput.value) || 0;
    var balance = BZG.storage.getBalance();
    var next = fn(current, balance);
    betInput.value = Math.max(1, Math.round(next));
  }

  document.addEventListener("DOMContentLoaded", function () {
    betInput = document.getElementById("bet-amount");
    startBtn = document.getElementById("start-btn");
    cashoutBtn = document.getElementById("cashout-btn");
    statusEl = document.getElementById("round-status");
    historyListEl = document.getElementById("history-list");
    multiplierEl = document.getElementById("hilo-multiplier");
    stageEl = document.getElementById("hilo-stage");
    currentCardEl = document.getElementById("hilo-current-card");
    nextCardEl = document.getElementById("hilo-next-card");
    higherBtn = document.getElementById("guess-higher");
    lowerBtn = document.getElementById("guess-lower");

    BZG.ui.initHeader();
    renderHistory();
    updateGuessButtons();

    startBtn.addEventListener("click", startGame);
    cashoutBtn.addEventListener("click", cashOut);
    higherBtn.addEventListener("click", function () { guess("higher"); });
    lowerBtn.addEventListener("click", function () { guess("lower"); });
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
