/* Bazinga BET - Double com rodadas continuas: a roleta gira para todo mundo */
(function () {
  var CYCLES = 6;
  var LANDING_CYCLE = 4;
  var TILE_WIDTH = 64;
  var TILE_GAP = 8;
  var TILE_STEP = TILE_WIDTH + TILE_GAP;
  var BETTING_MS = 10000;
  var SPIN_MS = 3400;
  var RESULT_PAUSE_MS = 3000;

  var betInput, betBtn, statusEl, trackEl, historyListEl, colorButtons, stageEl,
      countdownEl, countdownTimeEl, countdownFillEl, resultsEl;

  var wheelOrder = [];
  var tileEls = [];
  var phase = "betting"; // "betting" | "spinning" | "result"
  var phaseStart = 0;
  var lastBeepSecond = -1;

  var selectedColor = null;
  var userBet = null; // { amount, color }
  var bots = [];

  var spinTarget = null; // { number, color, tileIndex, offset }
  var lastCrossed = 0;

  function colorOf(n) {
    if (n === 0) return "white";
    return n <= 7 ? "red" : "black";
  }

  function multiplierFor(color) {
    return color === "white" ? 14 : 2;
  }

  function colorLabel(color) {
    return color === "white" ? "Branco" : (color === "red" ? "Vermelho" : "Preto");
  }

  function setStatus(text) {
    statusEl.textContent = text;
  }

  function shuffledNumbers() {
    var arr = [];
    for (var i = 0; i < 15; i++) arr.push(i);
    for (var i2 = arr.length - 1; i2 > 0; i2--) {
      var j = Math.floor(Math.random() * (i2 + 1));
      var tmp = arr[i2]; arr[i2] = arr[j]; arr[j] = tmp;
    }
    return arr;
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function buildTrack() {
    wheelOrder = shuffledNumbers();
    trackEl.innerHTML = "";
    tileEls = [];
    for (var c = 0; c < CYCLES; c++) {
      for (var i = 0; i < wheelOrder.length; i++) {
        var n = wheelOrder[i];
        var color = colorOf(n);
        var tile = document.createElement("div");
        tile.className = "double-tile double-tile--" + color;
        tile.textContent = String(n);
        trackEl.appendChild(tile);
        tileEls.push(tile);
      }
    }
    trackEl.style.transform = "translateX(0px)";
  }

  /* ---------- Resultados anteriores (bolinhas) ---------- */

  function renderResults() {
    var recent = BZG.storage.getRecent("double");
    resultsEl.innerHTML = recent.map(function (r) {
      return '<span class="double-dot double-dot--' + r.color + '">' + r.n + '</span>';
    }).join("");
  }

  /* ---------- Apostas da rodada (3 colunas) ---------- */

  function renderRoundBets() {
    var cols = { red: [], black: [], white: [] };
    var sums = { red: 0, black: 0, white: 0 };

    if (userBet) {
      var profile = BZG.storage.getProfile();
      cols[userBet.color].push(
        '<div class="bet-row is-user"><span class="avatar">' + profile.avatar + '</span>' +
        '<span class="name">' + profile.nickname + ' (você)</span>' +
        '<span class="bet-amount">' + BZG.ui.formatMoney(userBet.amount) + '</span></div>'
      );
      sums[userBet.color] += userBet.amount;
    }
    bots.forEach(function (b) {
      cols[b.color].push(
        '<div class="bet-row"><span class="avatar">' + b.avatar + '</span>' +
        '<span class="name">' + b.name + '</span>' +
        '<span class="bet-amount">' + BZG.ui.formatMoney(b.bet) + '</span></div>'
      );
      sums[b.color] += b.bet;
    });

    ["red", "black", "white"].forEach(function (color) {
      document.getElementById("bets-" + color).innerHTML = cols[color].join("") ||
        '<p style="color:var(--text-muted); font-size:12px; padding:8px 10px; margin:0;">Sem apostas.</p>';
      document.getElementById("sum-" + color).textContent = BZG.ui.formatMoney(sums[color]);
    });
  }

  function highlightWinnerColumn(color) {
    Array.prototype.forEach.call(document.querySelectorAll(".double-bets-col"), function (col) {
      col.classList.toggle("winner", col.dataset.col === color);
    });
  }

  /* ---------- Historico do usuario ---------- */

  function renderHistory() {
    var entries = BZG.storage.getHistory("double");
    historyListEl.innerHTML = entries.slice(0, 8).map(function (e) {
      var tagClass = e.won ? "tag--win" : "tag--lose";
      var tagText = e.won ? "GANHOU" : "PERDEU";
      return '<div class="history-row">' +
        '<span class="tag ' + tagClass + '">' + tagText + '</span>' +
        '<span>' + (e.detail || "") + '</span>' +
        '<span>' + BZG.ui.formatMoney(e.payout) + '</span>' +
        '</div>';
    }).join("") || '<p style="color:var(--text-muted); font-size:13px;">Nenhuma rodada ainda.</p>';
  }

  /* ---------- Maquina de estados ---------- */

  function startBettingPhase() {
    phase = "betting";
    phaseStart = performance.now();
    lastBeepSecond = -1;
    bots = BZG.bots.doubleRoundBots();
    userBet = null;
    spinTarget = null;

    buildTrack();
    highlightWinnerColumn(null);
    countdownEl.classList.add("visible");
    betBtn.disabled = false;
    betBtn.textContent = "Apostar";
    betInput.disabled = false;
    colorButtons.forEach(function (b) { b.disabled = false; });
    setStatus("Escolha o valor e uma cor. A roleta gira em instantes!");
    renderRoundBets();
  }

  function startSpinningPhase() {
    phase = "spinning";
    phaseStart = performance.now();
    lastCrossed = 0;

    var targetNumber = Math.floor(Math.random() * 15);
    var color = colorOf(targetNumber);
    var idxInCycle = wheelOrder.indexOf(targetNumber);
    var targetTileIndex = LANDING_CYCLE * wheelOrder.length + idxInCycle;
    spinTarget = {
      number: targetNumber,
      color: color,
      tileIndex: targetTileIndex,
      offset: targetTileIndex * TILE_STEP + TILE_WIDTH / 2
    };

    countdownEl.classList.remove("visible");
    betBtn.disabled = true;
    betInput.disabled = true;
    colorButtons.forEach(function (b) { b.disabled = true; });
    setStatus("A roleta está girando...");
  }

  function startResultPhase() {
    phase = "result";
    phaseStart = performance.now();

    var number = spinTarget.number;
    var color = spinTarget.color;

    if (tileEls[spinTarget.tileIndex]) tileEls[spinTarget.tileIndex].classList.add("landed");
    highlightWinnerColumn(color);
    BZG.storage.pushRecent("double", { n: number, color: color });
    renderResults();

    if (userBet) {
      var won = userBet.color === color;
      var mult = won ? multiplierFor(color) : 0;
      var payout = won ? Math.round(userBet.amount * mult) : 0;

      BZG.storage.recordBet("double", {
        bet: userBet.amount,
        multiplier: mult,
        payout: payout,
        won: won,
        detail: number + " " + colorLabel(color)
      });
      BZG.ui.refreshBalance();
      document.dispatchEvent(new CustomEvent("bzg:balance-changed"));
      renderHistory();

      if (won) {
        setStatus("Caiu " + number + " (" + colorLabel(color) + ")! Você ganhou " + BZG.ui.formatMoney(payout) + ".");
        BZG.ui.toast("Caiu " + colorLabel(color) + "! +" + BZG.ui.formatMoney(payout), "success");
        BZG.sounds.win();
        BZG.effects.flash(stageEl, "gold");
        var rect = stageEl.getBoundingClientRect();
        BZG.effects.confetti(rect.left + rect.width / 2, rect.top + rect.height / 2, mult >= 14 ? 100 : 60);
      } else {
        setStatus("Caiu " + number + " (" + colorLabel(color) + "). Você perdeu " + BZG.ui.formatMoney(userBet.amount) + ".");
        BZG.ui.toast("Caiu " + colorLabel(color) + ". Você perdeu a aposta.", "error");
        BZG.sounds.lose();
        BZG.effects.flash(stageEl, "red");
      }
    } else {
      setStatus("Caiu " + number + " (" + colorLabel(color) + "). Aposte na próxima rodada!");
      BZG.sounds.click();
    }
  }

  function loop(now) {
    if (phase === "betting") {
      var remaining = Math.max(0, BETTING_MS - (now - phaseStart));
      var secs = remaining / 1000;
      countdownTimeEl.textContent = secs.toFixed(1) + "s";
      countdownFillEl.style.width = ((remaining / BETTING_MS) * 100) + "%";

      var whole = Math.ceil(secs);
      if (whole <= 3 && whole !== lastBeepSecond && whole > 0) {
        BZG.sounds.countdownBeep();
        lastBeepSecond = whole;
      }

      if (remaining <= 0) startSpinningPhase();
    } else if (phase === "spinning") {
      var t = Math.min(1, (now - phaseStart) / SPIN_MS);
      var eased = easeOutCubic(t);
      var current = spinTarget.offset * eased;
      trackEl.style.transform = "translateX(-" + current.toFixed(1) + "px)";

      var crossed = Math.floor(current / TILE_STEP);
      if (crossed > lastCrossed) {
        BZG.sounds.tick();
        lastCrossed = crossed;
      }

      if (t >= 1) startResultPhase();
    } else if (phase === "result") {
      if (now - phaseStart >= RESULT_PAUSE_MS) startBettingPhase();
    }

    requestAnimationFrame(loop);
  }

  /* ---------- Acoes do usuario ---------- */

  function selectColor(color) {
    if (phase !== "betting" || userBet) return;
    selectedColor = color;
    colorButtons.forEach(function (b) {
      b.classList.toggle("selected", b.dataset.color === color);
    });
    BZG.sounds.click();
  }

  function placeBet() {
    if (phase !== "betting" || userBet) return;
    var amount = Math.round(Number(betInput.value));
    var balance = BZG.storage.getBalance();

    if (!selectedColor) {
      BZG.ui.toast("Escolha uma cor antes de apostar.", "error");
      return;
    }
    if (!amount || amount <= 0) {
      BZG.ui.toast("Digite um valor de aposta válido.", "error");
      return;
    }
    if (amount > balance) {
      BZG.ui.toast("Você não tem saldo suficiente.", "error");
      return;
    }

    userBet = { amount: amount, color: selectedColor };
    betBtn.disabled = true;
    betBtn.textContent = "Aposta feita ✓";
    betInput.disabled = true;
    colorButtons.forEach(function (b) { b.disabled = true; });
    setStatus("Aposta de " + BZG.ui.formatMoney(amount) + " no " + colorLabel(selectedColor) + " confirmada!");
    BZG.sounds.bet();
    renderRoundBets();
  }

  function quickBet(fn) {
    var current = Number(betInput.value) || 0;
    var balance = BZG.storage.getBalance();
    var next = fn(current, balance);
    betInput.value = Math.max(1, Math.round(next));
  }

  document.addEventListener("DOMContentLoaded", function () {
    betInput = document.getElementById("bet-amount");
    betBtn = document.getElementById("bet-btn");
    statusEl = document.getElementById("round-status");
    trackEl = document.getElementById("double-track");
    historyListEl = document.getElementById("history-list");
    colorButtons = Array.prototype.slice.call(document.querySelectorAll(".color-btn"));
    stageEl = document.getElementById("double-stage");
    countdownEl = document.getElementById("round-countdown");
    countdownTimeEl = document.getElementById("countdown-time");
    countdownFillEl = document.getElementById("countdown-fill");
    resultsEl = document.getElementById("double-results");

    BZG.ui.refreshBalance();
    renderHistory();
    renderResults();

    betBtn.addEventListener("click", placeBet);
    colorButtons.forEach(function (b) {
      b.addEventListener("click", function () { selectColor(b.dataset.color); });
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

    startBettingPhase();
    requestAnimationFrame(loop);
  });
})();
