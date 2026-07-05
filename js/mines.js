/* Bazinga BET - logica do jogo Mines */
(function () {
  var TOTAL_CELLS = 25;
  var HOUSE_EDGE = 0.03;

  var betInput, minesSelect, startBtn, cashoutBtn, statusEl, gridEl, historyListEl, multiplierEl, stageEl;

  var state = "idle"; // "idle" | "running"
  var currentBet = 0;
  var mineCount = 3;
  var mineIndexes = [];
  var revealedCount = 0;
  var cellEls = [];

  function formatMult(m) {
    return m.toFixed(2) + "x";
  }

  function setStatus(text) {
    statusEl.textContent = text;
  }

  function populateMinesSelect() {
    for (var i = 1; i <= 24; i++) {
      var opt = document.createElement("option");
      opt.value = String(i);
      opt.textContent = i + (i === 1 ? " bomba" : " bombas");
      if (i === 3) opt.selected = true;
      minesSelect.appendChild(opt);
    }
  }

  function currentMultiplier(revealed) {
    var mult = 1;
    var safeTotal = TOTAL_CELLS - mineCount;
    for (var i = 0; i < revealed; i++) {
      mult *= (TOTAL_CELLS - i) / (safeTotal - i);
    }
    return mult * (1 - HOUSE_EDGE);
  }

  function buildGrid() {
    gridEl.innerHTML = "";
    cellEls = [];
    for (var i = 0; i < TOTAL_CELLS; i++) {
      var cell = document.createElement("div");
      cell.className = "mine-cell";
      cell.dataset.index = String(i);
      cell.addEventListener("click", onCellClick);
      gridEl.appendChild(cell);
      cellEls.push(cell);
    }
  }

  function pickMineIndexes(count) {
    var pool = [];
    for (var i = 0; i < TOTAL_CELLS; i++) pool.push(i);
    for (var i2 = pool.length - 1; i2 > 0; i2--) {
      var j = Math.floor(Math.random() * (i2 + 1));
      var tmp = pool[i2]; pool[i2] = pool[j]; pool[j] = tmp;
    }
    return pool.slice(0, count).sort(function (a, b) { return a - b; });
  }

  function renderHistory() {
    var entries = BZG.storage.getHistory("mines");
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
    mineCount = Number(minesSelect.value);
    mineIndexes = pickMineIndexes(mineCount);
    revealedCount = 0;
    state = "running";

    buildGrid();
    betInput.disabled = true;
    minesSelect.disabled = true;
    startBtn.style.display = "none";
    cashoutBtn.style.display = "none";
    multiplierEl.textContent = "1.00x";
    BZG.sounds.bet();
    setStatus("Jogo em andamento. Clique nas células para revelar. " + mineCount + " bombas escondidas em 25 células.");
  }

  function onCellClick(evt) {
    if (state !== "running") return;
    var index = Number(evt.currentTarget.dataset.index);
    var cell = cellEls[index];
    if (cell.classList.contains("revealed")) return;

    cell.classList.add("revealed");

    if (mineIndexes.indexOf(index) !== -1) {
      cell.classList.add("bomb");
      cell.textContent = "💣";
      BZG.effects.shake(stageEl);
      BZG.effects.flash(stageEl, "red");
      endRound(false);
    } else {
      revealedCount++;
      cell.classList.add("safe");
      cell.textContent = "💎";
      BZG.sounds.click();

      var mult = currentMultiplier(revealedCount);
      var safeTotal = TOTAL_CELLS - mineCount;
      cashoutBtn.style.display = "block";
      cashoutBtn.textContent = "Colher " + BZG.ui.formatMoney(currentBet * mult) + " (" + formatMult(mult) + ")";
      setStatus(revealedCount + "/" + safeTotal + " células reveladas. Multiplicador atual: " + formatMult(mult));

      multiplierEl.textContent = formatMult(mult);
      multiplierEl.classList.remove("bump");
      void multiplierEl.offsetWidth;
      multiplierEl.classList.add("bump");

      if (revealedCount === safeTotal) {
        endRound(true, mult);
      }
    }
  }

  function endRound(won, multOverride) {
    state = "idle";
    var mult = won ? (multOverride || currentMultiplier(revealedCount)) : 0;
    var payout = won ? Math.round(currentBet * mult) : 0;

    // revela todas as celulas restantes (efeito cascata) para mostrar bombas e diamantes
    var delay = 0;
    cellEls.forEach(function (cell, idx) {
      if (cell.classList.contains("revealed")) return;
      var isBomb = mineIndexes.indexOf(idx) !== -1;
      setTimeout(function () {
        cell.classList.add("revealed", "disabled", "ghost");
        if (isBomb) {
          cell.textContent = "💣";
          cell.classList.add("bomb");
        } else {
          cell.textContent = "💎";
          cell.classList.add("safe");
        }
      }, delay);
      delay += 28;
    });

    BZG.storage.recordBet("mines", {
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
      setStatus("Você encontrou uma bomba e perdeu " + BZG.ui.formatMoney(currentBet) + ".");
      BZG.ui.toast("Bomba! Você perdeu a aposta.", "error");
      BZG.sounds.bombExplode();
    }

    betInput.disabled = false;
    minesSelect.disabled = false;
    startBtn.style.display = "block";
    cashoutBtn.style.display = "none";
  }

  function cashOut() {
    if (state !== "running" || revealedCount === 0) return;
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
    minesSelect = document.getElementById("mines-count");
    startBtn = document.getElementById("start-btn");
    cashoutBtn = document.getElementById("cashout-btn");
    statusEl = document.getElementById("round-status");
    gridEl = document.getElementById("mines-grid");
    historyListEl = document.getElementById("history-list");
    multiplierEl = document.getElementById("mines-multiplier");
    stageEl = document.getElementById("mines-stage");

    BZG.ui.initHeader();
    populateMinesSelect();
    buildGrid();
    renderHistory();

    startBtn.addEventListener("click", startGame);
    cashoutBtn.addEventListener("click", cashOut);
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
