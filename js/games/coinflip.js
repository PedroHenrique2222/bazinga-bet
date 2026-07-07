/* Bazinga BET - Cara ou Coroa (coinflip) */
(function () {
  var PAYOUT = 1.96; // 2% de vantagem da casa (RTP 98%)
  var FLIP_MS = 1400;

  var betInput, flipBtn, statusEl, historyListEl, coinEl, resultEl, stageEl, choiceBtns;
  var selectedSide = null;
  var flipping = false;

  function setStatus(t) { statusEl.textContent = t; }

  function renderHistory() {
    var entries = BZG.storage.getHistory("coinflip");
    historyListEl.innerHTML = entries.slice(0, 8).map(function (e) {
      var tagClass = e.won ? "tag--win" : "tag--lose";
      var tagText = e.won ? "GANHOU" : "PERDEU";
      return '<div class="history-row">' +
        '<span class="tag ' + tagClass + '">' + tagText + '</span>' +
        '<span>' + (e.detail || "") + '</span>' +
        '<span>' + BZG.ui.formatMoney(e.payout) + '</span>' +
        '</div>';
    }).join("") || '<p style="color:var(--text-muted); font-size:13px;">Nenhum giro ainda.</p>';
  }

  function selectSide(side) {
    if (flipping) return;
    selectedSide = side;
    choiceBtns.forEach(function (b) { b.classList.toggle("selected", b.dataset.side === side); });
    BZG.sounds.click();
  }

  function flip() {
    if (flipping) return;
    var bet = Math.round(Number(betInput.value));
    var balance = BZG.storage.getBalance();

    if (!selectedSide) { BZG.ui.toast("Escolha Cara ou Coroa.", "error"); return; }
    if (!bet || bet <= 0) { BZG.ui.toast("Digite um valor de aposta válido.", "error"); return; }
    if (bet > balance) { BZG.ui.toast("Você não tem saldo suficiente.", "error"); return; }

    flipping = true;
    betInput.disabled = true;
    flipBtn.disabled = true;
    choiceBtns.forEach(function (b) { b.disabled = true; });
    resultEl.className = "coin-result";
    resultEl.textContent = "Girando...";
    setStatus("A moeda está no ar...");
    BZG.sounds.bet();

    var result = Math.random() < 0.5 ? "cara" : "coroa";
    coinEl.classList.add("flipping");

    var start = performance.now();
    var lastTick = 0;
    function frame(now) {
      if (now - lastTick > 90) { BZG.sounds.tick(); lastTick = now; }
      if (now - start < FLIP_MS) {
        requestAnimationFrame(frame);
      } else {
        coinEl.classList.remove("flipping");
        // para na face do resultado (cara = 0deg, coroa = 180deg)
        coinEl.style.transform = result === "cara" ? "rotateY(0deg)" : "rotateY(180deg)";
        finish(result, bet);
      }
    }
    requestAnimationFrame(frame);
  }

  function finish(result, bet) {
    var won = result === selectedSide;
    var payout = won ? Math.round(bet * PAYOUT) : 0;
    var label = result === "cara" ? "Cara ⚡" : "Coroa 💰";

    BZG.storage.recordBet("coinflip", {
      bet: bet, multiplier: won ? PAYOUT : 0, payout: payout, won: won, detail: label
    });
    BZG.ui.refreshBalance();
    document.dispatchEvent(new CustomEvent("bzg:balance-changed"));
    renderHistory();

    if (won) {
      resultEl.className = "coin-result win";
      resultEl.textContent = "Deu " + label + "! +" + BZG.ui.formatMoney(payout);
      setStatus("Você ganhou " + BZG.ui.formatMoney(payout) + "!");
      BZG.ui.toast("Deu " + label + "! +" + BZG.ui.formatMoney(payout), "success");
      BZG.sounds.win();
      BZG.sounds.coin();
      BZG.effects.flash(stageEl, "gold");
      var r = stageEl.getBoundingClientRect();
      BZG.effects.confetti(r.left + r.width / 2, r.top + r.height / 2, 50);
    } else {
      resultEl.className = "coin-result lose";
      resultEl.textContent = "Deu " + label + ". Não foi dessa vez.";
      setStatus("Você perdeu " + BZG.ui.formatMoney(bet) + ".");
      BZG.sounds.lose();
      BZG.effects.flash(stageEl, "red");
    }

    flipping = false;
    betInput.disabled = false;
    flipBtn.disabled = false;
    choiceBtns.forEach(function (b) { b.disabled = false; });
  }

  function quickBet(fn) {
    var current = Number(betInput.value) || 0;
    betInput.value = Math.max(1, Math.round(fn(current, BZG.storage.getBalance())));
  }

  document.addEventListener("DOMContentLoaded", function () {
    betInput = document.getElementById("bet-amount");
    flipBtn = document.getElementById("flip-btn");
    statusEl = document.getElementById("round-status");
    historyListEl = document.getElementById("history-list");
    coinEl = document.getElementById("coin");
    resultEl = document.getElementById("coin-result");
    stageEl = document.getElementById("coin-stage");
    choiceBtns = Array.prototype.slice.call(document.querySelectorAll(".coin-choice"));

    BZG.ui.refreshBalance();
    renderHistory();

    flipBtn.addEventListener("click", flip);
    choiceBtns.forEach(function (b) {
      b.addEventListener("click", function () { selectSide(b.dataset.side); });
    });
    document.getElementById("bet-half").addEventListener("click", function () { quickBet(function (v) { return v / 2; }); });
    document.getElementById("bet-double").addEventListener("click", function () { quickBet(function (v) { return v * 2; }); });
    document.getElementById("bet-max").addEventListener("click", function () { quickBet(function (v, b) { return b; }); });
  });
})();
