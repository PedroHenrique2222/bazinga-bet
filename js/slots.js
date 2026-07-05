/* Bazinga BET - Slots tematico (3 rolos, linha de pagamento central) */
(function () {
  var CELL_H = 78;
  var STRIP_LEN = 24;       // celulas por rolo durante o giro
  var REEL_DURATIONS = [1300, 1750, 2250];

  /* simbolos com peso (quanto maior, mais comum) e premio para 3 iguais */
  var SYMBOLS = [
    { icon: "⚡", weight: 1, pay: 500 },
    { icon: "7️⃣", weight: 2, pay: 150 },
    { icon: "💎", weight: 3, pay: 50 },
    { icon: "⭐", weight: 4, pay: 20 },
    { icon: "💥", weight: 5, pay: 10 },
    { icon: "🃏", weight: 6, pay: 5 }
  ];
  var PAIR_SYMBOLS = ["⚡", "7️⃣", "💎"]; // 2 iguais destes pagam 1.5x
  var PAIR_PAY = 1.5;
  var TOTAL_WEIGHT = SYMBOLS.reduce(function (s, x) { return s + x.weight; }, 0);

  var betInput, spinBtn, statusEl, historyListEl, resultEl, stageEl, reelEls;

  var spinning = false;

  function setStatus(text) {
    statusEl.textContent = text;
  }

  function weightedPick() {
    var r = Math.random() * TOTAL_WEIGHT;
    for (var i = 0; i < SYMBOLS.length; i++) {
      r -= SYMBOLS[i].weight;
      if (r <= 0) return SYMBOLS[i];
    }
    return SYMBOLS[SYMBOLS.length - 1];
  }

  function randomIcon() {
    return weightedPick().icon;
  }

  /* monta a fita do rolo: aleatorios + [acima, FINAL, abaixo] no fim */
  function buildStrip(reelEl, finalIcon) {
    var cells = [];
    for (var i = 0; i < STRIP_LEN - 3; i++) cells.push(randomIcon());
    cells.push(randomIcon());  // celula acima da linha
    cells.push(finalIcon);     // linha de pagamento (centro)
    cells.push(randomIcon());  // celula abaixo da linha
    reelEl.innerHTML = cells.map(function (icon) {
      return '<div class="reel-cell">' + icon + '</div>';
    }).join("");
    reelEl.style.transform = "translateY(0px)";
    return (STRIP_LEN - 3) * CELL_H; // distancia ate a fita final ficar na janela
  }

  function easeOutQuart(t) {
    return 1 - Math.pow(1 - t, 4);
  }

  function renderHistory() {
    var entries = BZG.storage.getHistory("slots");
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

  function evaluate(icons, bet) {
    var counts = {};
    icons.forEach(function (icon) { counts[icon] = (counts[icon] || 0) + 1; });

    // 3 iguais
    for (var i = 0; i < SYMBOLS.length; i++) {
      if (counts[SYMBOLS[i].icon] === 3) {
        return { mult: SYMBOLS[i].pay, label: icons.join(" "), jackpot: SYMBOLS[i].icon === "⚡" };
      }
    }
    // 2 iguais de simbolo premium
    for (var j = 0; j < PAIR_SYMBOLS.length; j++) {
      if (counts[PAIR_SYMBOLS[j]] === 2) {
        return { mult: PAIR_PAY, label: icons.join(" "), jackpot: false };
      }
    }
    return { mult: 0, label: icons.join(" "), jackpot: false };
  }

  function spin() {
    if (spinning) return;
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

    spinning = true;
    betInput.disabled = true;
    spinBtn.disabled = true;
    resultEl.textContent = "";
    resultEl.className = "slots-result";
    setStatus("Girando...");
    BZG.sounds.bet();

    // resultado sorteado antes; a animacao apenas revela
    var finalIcons = [weightedPick().icon, weightedPick().icon, weightedPick().icon];
    var distances = [];
    for (var i = 0; i < 3; i++) {
      distances.push(buildStrip(reelEls[i], finalIcons[i]));
    }

    var start = performance.now();
    var lastTicks = [0, 0, 0];
    var done = [false, false, false];

    function frame(now) {
      var allDone = true;
      for (var i = 0; i < 3; i++) {
        var t = Math.min(1, (now - start) / REEL_DURATIONS[i]);
        var eased = easeOutQuart(t);
        reelEls[i].style.transform = "translateY(-" + (distances[i] * eased).toFixed(1) + "px)";

        var cellsCrossed = Math.floor((distances[i] * eased) / CELL_H);
        if (cellsCrossed > lastTicks[i] && t < 1) {
          if (i === 0) BZG.sounds.tick();
          lastTicks[i] = cellsCrossed;
        }

        if (t >= 1 && !done[i]) {
          done[i] = true;
          BZG.sounds.click();
        }
        if (t < 1) allDone = false;
      }

      if (allDone) {
        finishSpin(finalIcons, bet);
      } else {
        requestAnimationFrame(frame);
      }
    }
    requestAnimationFrame(frame);
  }

  function finishSpin(icons, bet) {
    var result = evaluate(icons, bet);
    var payout = Math.round(bet * result.mult);
    var won = result.mult > 0;

    BZG.storage.recordBet("slots", {
      bet: bet,
      multiplier: result.mult,
      payout: payout,
      won: won,
      detail: result.label
    });
    BZG.ui.refreshBalance();
    document.dispatchEvent(new CustomEvent("bzg:balance-changed"));
    renderHistory();

    if (result.jackpot) {
      resultEl.textContent = "⚡ JACKPOT! +" + BZG.ui.formatMoney(payout) + " ⚡";
      resultEl.className = "slots-result jackpot";
      setStatus("JACKPOT BAZINGA! Você ganhou " + BZG.ui.formatMoney(payout) + "!");
      BZG.ui.toast("⚡ JACKPOT! +" + BZG.ui.formatMoney(payout), "success");
      BZG.sounds.win();
      BZG.effects.flash(stageEl, "gold");
      var rect = stageEl.getBoundingClientRect();
      BZG.effects.confetti(rect.left + rect.width / 2, rect.top + rect.height / 3, 140);
      BZG.effects.confetti(rect.left + rect.width / 3, rect.top + rect.height / 2, 80);
      BZG.effects.confetti(rect.left + rect.width * 2 / 3, rect.top + rect.height / 2, 80);
    } else if (won) {
      resultEl.textContent = "+" + BZG.ui.formatMoney(payout) + " (" + result.mult + "x)";
      resultEl.className = "slots-result win";
      setStatus("Você ganhou " + BZG.ui.formatMoney(payout) + "!");
      BZG.ui.toast("+" + BZG.ui.formatMoney(payout) + " (" + result.mult + "x)", "success");
      BZG.sounds.win();
      BZG.effects.flash(stageEl, "gold");
      var rect2 = stageEl.getBoundingClientRect();
      BZG.effects.confetti(rect2.left + rect2.width / 2, rect2.top + rect2.height / 2, 55);
    } else {
      resultEl.textContent = "Não foi dessa vez...";
      setStatus("Sem combinação. Tente de novo!");
      BZG.sounds.lose();
    }

    spinning = false;
    betInput.disabled = false;
    spinBtn.disabled = false;
  }

  function quickBet(fn) {
    var current = Number(betInput.value) || 0;
    var balance = BZG.storage.getBalance();
    var next = fn(current, balance);
    betInput.value = Math.max(1, Math.round(next));
  }

  document.addEventListener("DOMContentLoaded", function () {
    betInput = document.getElementById("bet-amount");
    spinBtn = document.getElementById("spin-btn");
    statusEl = document.getElementById("round-status");
    historyListEl = document.getElementById("history-list");
    resultEl = document.getElementById("slots-result");
    stageEl = document.getElementById("slots-stage");
    reelEls = [
      document.getElementById("reel-0"),
      document.getElementById("reel-1"),
      document.getElementById("reel-2")
    ];

    // estado inicial dos rolos
    for (var i = 0; i < 3; i++) {
      buildStrip(reelEls[i], randomIcon());
      reelEls[i].style.transform = "translateY(-" + ((STRIP_LEN - 3) * CELL_H) + "px)";
    }

    BZG.ui.refreshBalance();
    renderHistory();

    spinBtn.addEventListener("click", spin);
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
