/* Bazinga BET - logica do jogo Dice */
(function () {
  var HOUSE_EDGE = 0.01;
  var ROLL_ANIM_MS = 700;

  var betInput, rollBtn, statusEl, historyListEl, modeButtons, thresholdSlider, thresholdValueEl,
      winChanceEl, winMultEl, resultEl, barEl, thresholdMarkerEl, resultMarkerEl, stageEl;

  var mode = "under";
  var rolling = false;

  function formatMult(m) {
    return m.toFixed(2) + "x";
  }

  function setStatus(text) {
    statusEl.textContent = text;
  }

  function winChance() {
    var t = Number(thresholdSlider.value);
    return mode === "under" ? t : 100 - t;
  }

  function multiplier() {
    var chance = winChance();
    return (100 / chance) * (1 - HOUSE_EDGE);
  }

  function updateInfo() {
    var t = Number(thresholdSlider.value);
    thresholdValueEl.textContent = t;
    var chance = winChance();
    winChanceEl.textContent = chance.toFixed(2) + "%";
    winMultEl.textContent = formatMult(multiplier());

    var winColor = "#2ecc71";
    var loseColor = "rgba(255, 45, 58, 0.35)";
    var gradient;
    if (mode === "under") {
      gradient = "linear-gradient(90deg, " + winColor + " 0%, " + winColor + " " + t + "%, " + loseColor + " " + t + "%, " + loseColor + " 100%)";
    } else {
      gradient = "linear-gradient(90deg, " + loseColor + " 0%, " + loseColor + " " + t + "%, " + winColor + " " + t + "%, " + winColor + " 100%)";
    }
    barEl.style.background = gradient;
    thresholdMarkerEl.style.left = t + "%";
  }

  function renderHistory() {
    var entries = BZG.storage.getHistory("dice");
    historyListEl.innerHTML = entries.map(function (e) {
      var tagClass = e.won ? "tag--win" : "tag--lose";
      var tagText = e.won ? "GANHOU" : "PERDEU";
      return '<div class="history-row">' +
        '<span class="tag ' + tagClass + '">' + tagText + '</span>' +
        '<span>' + (e.detail || "") + '</span>' +
        '<span>' + BZG.ui.formatMoney(e.payout) + '</span>' +
        '</div>';
    }).join("") || '<p style="color:var(--text-muted); font-size:13px;">Nenhuma rodada ainda.</p>';
  }

  function selectMode(newMode) {
    if (rolling) return;
    mode = newMode;
    modeButtons.forEach(function (b) {
      b.classList.toggle("active", b.dataset.mode === newMode);
    });
    updateInfo();
  }

  function roll() {
    if (rolling) return;
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

    rolling = true;
    betInput.disabled = true;
    rollBtn.disabled = true;
    thresholdSlider.disabled = true;
    modeButtons.forEach(function (b) { b.disabled = true; });
    resultMarkerEl.classList.remove("visible");
    resultEl.classList.remove("win", "lose");
    setStatus("Rolando...");
    BZG.sounds.bet();

    var threshold = Number(thresholdSlider.value);
    var chance = winChance();
    var mult = multiplier();
    var finalResult = Math.round(Math.random() * 10000) / 100;

    var start = performance.now();
    var lastTick = 0;
    function spinFrame(now) {
      var elapsed = now - start;
      if (elapsed < ROLL_ANIM_MS) {
        var fake = Math.round(Math.random() * 10000) / 100;
        resultEl.textContent = fake.toFixed(2);
        if (now - lastTick > 60) {
          BZG.sounds.tick();
          lastTick = now;
        }
        requestAnimationFrame(spinFrame);
      } else {
        finishRoll(finalResult, threshold, chance, mult, bet);
      }
    }
    requestAnimationFrame(spinFrame);
  }

  function finishRoll(result, threshold, chance, mult, bet) {
    var won = mode === "under" ? result < threshold : result > threshold;
    var payout = won ? Math.round(bet * mult) : 0;

    resultEl.textContent = result.toFixed(2);
    resultEl.classList.add(won ? "win" : "lose");
    resultMarkerEl.style.left = Math.min(99.5, Math.max(0.5, result)) + "%";
    resultMarkerEl.classList.add("visible");

    BZG.storage.recordBet("dice", {
      bet: bet,
      multiplier: won ? mult : 0,
      payout: payout,
      won: won,
      detail: "rolou " + result.toFixed(2)
    });
    BZG.ui.refreshBalance();
    document.dispatchEvent(new CustomEvent("bzg:balance-changed"));
    renderHistory();

    if (won) {
      setStatus("Rolou " + result.toFixed(2) + "! Você ganhou " + BZG.ui.formatMoney(payout) + ".");
      BZG.ui.toast("Rolou " + result.toFixed(2) + "! +" + BZG.ui.formatMoney(payout), "success");
      BZG.sounds.win();
      BZG.effects.flash(stageEl, "gold");
      var rect = resultEl.getBoundingClientRect();
      BZG.effects.confetti(rect.left + rect.width / 2, rect.top + rect.height / 2, mult >= 10 ? 90 : 55);
    } else {
      setStatus("Rolou " + result.toFixed(2) + ". Você perdeu " + BZG.ui.formatMoney(bet) + ".");
      BZG.ui.toast("Rolou " + result.toFixed(2) + ". Você perdeu a aposta.", "error");
      BZG.sounds.lose();
      BZG.effects.flash(stageEl, "red");
    }

    rolling = false;
    betInput.disabled = false;
    rollBtn.disabled = false;
    thresholdSlider.disabled = false;
    modeButtons.forEach(function (b) { b.disabled = false; });
  }

  function quickBet(fn) {
    var current = Number(betInput.value) || 0;
    var balance = BZG.storage.getBalance();
    var next = fn(current, balance);
    betInput.value = Math.max(1, Math.round(next));
  }

  document.addEventListener("DOMContentLoaded", function () {
    betInput = document.getElementById("bet-amount");
    rollBtn = document.getElementById("roll-btn");
    statusEl = document.getElementById("round-status");
    historyListEl = document.getElementById("history-list");
    modeButtons = Array.prototype.slice.call(document.querySelectorAll(".risk-options .btn"));
    thresholdSlider = document.getElementById("dice-threshold");
    thresholdValueEl = document.getElementById("threshold-value");
    winChanceEl = document.getElementById("win-chance");
    winMultEl = document.getElementById("win-mult");
    resultEl = document.getElementById("dice-result");
    barEl = document.getElementById("dice-bar");
    thresholdMarkerEl = document.getElementById("dice-threshold-marker");
    resultMarkerEl = document.getElementById("dice-result-marker");
    stageEl = document.getElementById("dice-stage");

    BZG.ui.initHeader();
    updateInfo();
    renderHistory();

    rollBtn.addEventListener("click", roll);
    thresholdSlider.addEventListener("input", updateInfo);
    modeButtons.forEach(function (b) {
      b.addEventListener("click", function () { selectMode(b.dataset.mode); });
    });
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
