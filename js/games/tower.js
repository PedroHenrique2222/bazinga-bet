/* Bazinga BET - logica do jogo Tower */
(function () {
  var LEVELS = 8;
  var HOUSE_EDGE = 0.03;
  var RISK_CONFIG = {
    easy: { tiles: 4, bombs: 1, label: "Fácil" },
    medium: { tiles: 3, bombs: 1, label: "Médio" },
    hard: { tiles: 2, bombs: 1, label: "Difícil" }
  };

  var betInput, startBtn, cashoutBtn, statusEl, levelsEl, historyListEl, riskButtons, multiplierEl, stageEl;

  var risk = "easy";
  var state = "idle"; // "idle" | "running"
  var currentBet = 0;
  var currentLevel = 0;
  var bombIndexPerLevel = [];
  var rowEls = [];

  function formatMult(m) {
    return m.toFixed(2) + "x";
  }

  function setStatus(text) {
    statusEl.textContent = text;
  }

  function config() {
    return RISK_CONFIG[risk];
  }

  function multiplierAt(level) {
    var cfg = config();
    var surviveChance = (cfg.tiles - cfg.bombs) / cfg.tiles;
    return Math.pow(1 / surviveChance, level) * (1 - HOUSE_EDGE);
  }

  function renderHistory() {
    var entries = BZG.storage.getHistory("tower");
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

  function buildTower() {
    var cfg = config();
    levelsEl.innerHTML = "";
    rowEls = [];
    bombIndexPerLevel = [];

    for (var lvl = 0; lvl < LEVELS; lvl++) {
      bombIndexPerLevel.push(Math.floor(Math.random() * cfg.tiles));

      var row = document.createElement("div");
      row.className = "tower-row";
      row.dataset.level = String(lvl);

      var label = document.createElement("div");
      label.className = "tower-row-label";
      label.textContent = "N" + (lvl + 1);
      row.appendChild(label);

      var tileWrap = document.createElement("div");
      tileWrap.style.display = "flex";
      tileWrap.style.gap = "8px";
      tileWrap.style.flex = "1";
      for (var i = 0; i < cfg.tiles; i++) {
        var tile = document.createElement("div");
        tile.className = "tower-tile";
        tile.dataset.index = String(i);
        tile.addEventListener("click", function (evt) {
          onTileClick(evt.currentTarget);
        });
        tileWrap.appendChild(tile);
      }
      row.appendChild(tileWrap);

      var multLabel = document.createElement("div");
      multLabel.className = "tower-row-mult";
      multLabel.textContent = formatMult(multiplierAt(lvl + 1));
      row.appendChild(multLabel);

      levelsEl.appendChild(row);
      rowEls.push(row);
    }

    updateActiveRow();
  }

  function updateActiveRow() {
    rowEls.forEach(function (row, idx) {
      row.classList.toggle("active", idx === currentLevel && state === "running");
      row.classList.toggle("done", idx < currentLevel);
    });
  }

  function startGame() {
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
    currentLevel = 0;
    state = "running";

    buildTower();
    betInput.disabled = true;
    riskButtons.forEach(function (b) { b.disabled = true; });
    startBtn.style.display = "none";
    cashoutBtn.style.display = "none";
    multiplierEl.textContent = "1.00x";
    BZG.sounds.bet();
    setStatus("Suba a lixeira do Linden escolhendo uma célula segura em cada nível. " + config().bombs + " armadilha por nível.");
  }

  function onTileClick(tileEl) {
    if (state !== "running") return;
    var row = tileEl.parentElement.parentElement;
    var level = Number(row.dataset.level);
    if (level !== currentLevel) return;
    if (tileEl.classList.contains("revealed")) return;

    var index = Number(tileEl.dataset.index);
    var isBomb = index === bombIndexPerLevel[level];

    if (isBomb) {
      tileEl.classList.add("revealed", "bomb");
      tileEl.textContent = "💣";
      BZG.effects.shake(stageEl);
      BZG.effects.flash(stageEl, "red");
      revealRowTiles(row, level);
      endRound(false);
    } else {
      tileEl.classList.add("revealed", "safe");
      tileEl.textContent = "♻️";
      BZG.sounds.click();
      currentLevel++;

      var mult = multiplierAt(currentLevel);
      multiplierEl.textContent = formatMult(mult);
      multiplierEl.classList.remove("bump");
      void multiplierEl.offsetWidth;
      multiplierEl.classList.add("bump");

      if (currentLevel >= LEVELS) {
        endRound(true, mult);
      } else {
        updateActiveRow();
        cashoutBtn.style.display = "block";
        cashoutBtn.textContent = "Colher " + BZG.ui.formatMoney(currentBet * mult) + " (" + formatMult(mult) + ")";
        setStatus("Nível " + currentLevel + " concluído! Multiplicador atual: " + formatMult(mult));
      }
    }
  }

  function revealRowTiles(row, level) {
    var tiles = row.querySelectorAll(".tower-tile");
    tiles.forEach(function (t) {
      if (t.classList.contains("revealed")) return;
      t.classList.add("revealed", "ghost");
      var idx = Number(t.dataset.index);
      if (idx === bombIndexPerLevel[level]) {
        t.classList.add("bomb");
        t.textContent = "💣";
      } else {
        t.classList.add("safe");
        t.textContent = "♻️";
      }
    });
  }

  /* Ao fim da partida, revela a torre inteira (efeito cascata de baixo para cima) */
  function revealAllLevels() {
    rowEls.forEach(function (row, lvl) {
      setTimeout(function () {
        revealRowTiles(row, lvl);
      }, lvl * 90);
    });
  }

  function endRound(won, multOverride) {
    state = "idle";
    var mult = won ? (multOverride || multiplierAt(currentLevel)) : 0;
    var payout = won ? Math.round(currentBet * mult) : 0;

    updateActiveRow();
    revealAllLevels();

    BZG.storage.recordBet("tower", {
      bet: currentBet,
      multiplier: mult,
      payout: payout,
      won: won
    });
    BZG.ui.refreshBalance();
    document.dispatchEvent(new CustomEvent("bzg:balance-changed"));
    renderHistory();

    if (won) {
      setStatus("Você chegou ao nível " + currentLevel + " e ganhou " + BZG.ui.formatMoney(payout) + "!");
      BZG.ui.toast("Colheu em " + formatMult(mult) + "! +" + BZG.ui.formatMoney(payout), "success");
      BZG.sounds.win();
      BZG.effects.flash(stageEl, "gold");
      var rect = multiplierEl.getBoundingClientRect();
      BZG.effects.confetti(rect.left + rect.width / 2, rect.top + rect.height / 2, 70);
    } else {
      setStatus("Você caiu na armadilha do nível " + (currentLevel + 1) + " e perdeu " + BZG.ui.formatMoney(currentBet) + ".");
      BZG.ui.toast("Armadilha! Você perdeu a aposta.", "error");
      BZG.sounds.bombExplode();
    }

    betInput.disabled = false;
    riskButtons.forEach(function (b) { b.disabled = false; });
    startBtn.style.display = "block";
    cashoutBtn.style.display = "none";
  }

  function cashOut() {
    if (state !== "running" || currentLevel === 0) return;
    endRound(true);
  }

  function selectRisk(newRisk) {
    if (state === "running") return;
    risk = newRisk;
    riskButtons.forEach(function (b) {
      b.classList.toggle("active", b.dataset.risk === newRisk);
    });
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
    levelsEl = document.getElementById("tower-levels");
    historyListEl = document.getElementById("history-list");
    riskButtons = Array.prototype.slice.call(document.querySelectorAll(".risk-options .btn"));
    multiplierEl = document.getElementById("tower-multiplier");
    stageEl = document.getElementById("tower-stage");

    BZG.ui.initHeader();
    buildTower();
    renderHistory();

    startBtn.addEventListener("click", startGame);
    cashoutBtn.addEventListener("click", cashOut);
    riskButtons.forEach(function (b) {
      b.addEventListener("click", function () { selectRisk(b.dataset.risk); });
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
