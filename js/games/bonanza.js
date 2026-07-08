/* Bazinga BET - Bazinga Bonanza: grade 6x5, paga em qualquer lugar (>=8 iguais),
   cascata (vencedores somem, novas gemas caem) + multiplicador NUCLEAR.
   Pagamentos calibrados por Monte Carlo (2M giros): RTP ~92%. */
(function () {
  var COLS = 6, ROWS = 5;
  var SCALE = 2.85;

  var SYMBOLS = [
    { icon: "🔵", weight: 16, pays: [0.2, 0.5, 1.5] },
    { icon: "🟢", weight: 15, pays: [0.2, 0.6, 1.8] },
    { icon: "🟣", weight: 14, pays: [0.3, 0.7, 2] },
    { icon: "🟡", weight: 13, pays: [0.4, 0.9, 3] },
    { icon: "🟠", weight: 12, pays: [0.5, 1.1, 4] },
    { icon: "🔴", weight: 10, pays: [0.7, 1.5, 6] },
    { icon: "💎", weight: 8,  pays: [1.2, 2.5, 10] },
    { icon: "⚡", weight: 5,  pays: [2, 4, 20] }
  ];
  var TOTALW = SYMBOLS.reduce(function (s, x) { return s + x.weight; }, 0);
  var BYICON = {}; SYMBOLS.forEach(function (s) { BYICON[s.icon] = s; });

  var betInput, spinBtn, statusEl, historyListEl, gridEl, bannerEl, winEl, stageEl;
  var grid = [];      // grid[c][r], r=0 topo
  var spinning = false;

  function setStatus(t) { statusEl.textContent = t; }
  function spd(ms) { return ms * BZG.modes.speed(); }

  function pick() {
    var r = Math.random() * TOTALW;
    for (var i = 0; i < SYMBOLS.length; i++) { r -= SYMBOLS[i].weight; if (r <= 0) return SYMBOLS[i].icon; }
    return SYMBOLS[SYMBOLS.length - 1].icon;
  }

  function payFor(icon, count) {
    if (count < 8) return 0;
    var p = BYICON[icon].pays;
    if (count <= 9) return p[0];
    if (count <= 11) return p[1];
    return p[2];
  }

  function newGrid() {
    grid = [];
    for (var c = 0; c < COLS; c++) { grid[c] = []; for (var r = 0; r < ROWS; r++) grid[c][r] = pick(); }
  }

  function evaluate() {
    var counts = {};
    for (var c = 0; c < COLS; c++) for (var r = 0; r < ROWS; r++) counts[grid[c][r]] = (counts[grid[c][r]] || 0) + 1;
    var pay = 0, winners = {};
    Object.keys(counts).forEach(function (icon) {
      var p = payFor(icon, counts[icon]);
      if (p > 0) { pay += p; winners[icon] = true; }
    });
    return { pay: pay, winners: winners };
  }

  function tumble(winners) {
    for (var c = 0; c < COLS; c++) {
      var kept = [];
      for (var r = 0; r < ROWS; r++) if (!winners[grid[c][r]]) kept.push(grid[c][r]);
      var col = [];
      for (var m = 0; m < ROWS - kept.length; m++) col.push(pick());
      grid[c] = col.concat(kept);
    }
  }

  function rollMult() {
    if (Math.random() >= 0.09) return 1;
    var r = Math.random();
    if (r < 0.60) return 2;
    if (r < 0.85) return 3;
    if (r < 0.95) return 5;
    return 10;
  }

  function renderGrid(winners, drop) {
    var html = "";
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        var icon = grid[c][r];
        var cls = "gem" + (drop ? " drop" : "") + (winners && winners[icon] ? " win" : "");
        html += '<div class="' + cls + '">' + icon + '</div>';
      }
    }
    gridEl.innerHTML = html;
  }

  function renderHistory() {
    var entries = BZG.storage.getHistory("bonanza");
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

  function showBanner(text) {
    bannerEl.textContent = text;
    bannerEl.classList.remove("show");
    void bannerEl.offsetWidth;
    bannerEl.classList.add("show");
  }

  function spin() {
    if (spinning) return;
    var bet = Math.round(Number(betInput.value));
    var balance = BZG.storage.getBalance();
    if (!bet || bet <= 0) { BZG.ui.toast("Digite um valor de aposta válido.", "error"); return; }
    if (bet > balance) { BZG.ui.toast("Você não tem saldo suficiente.", "error"); return; }

    spinning = true;
    betInput.disabled = true;
    spinBtn.disabled = true;
    winEl.textContent = "";
    winEl.className = "bonanza-win";
    setStatus("Girando...");
    BZG.sounds.bet();

    newGrid();
    renderGrid(null, true);

    var totalPay = 0;

    function step() {
      var ev = evaluate();
      if (ev.pay <= 0) {
        finish(totalPay, bet);
        return;
      }
      totalPay += ev.pay;
      renderGrid(ev.winners, false); // destaca vencedores
      BZG.sounds.pegHit();
      setTimeout(function () {
        tumble(ev.winners);
        renderGrid(null, true);     // cascata
        BZG.sounds.tick();
        setTimeout(step, spd(320));
      }, spd(650));
    }
    setTimeout(step, spd(400));
  }

  function finish(totalPay, bet) {
    var mult = 1;
    if (totalPay > 0) mult = rollMult();
    var effMult = totalPay * mult * SCALE;
    var payout = Math.round(bet * effMult);
    var won = payout > 0;

    if (mult > 1) {
      showBanner(mult >= 5 ? "NUCLEAR ×" + mult : "×" + mult);
      BZG.sounds.jackpot();
    }

    BZG.storage.recordBet("bonanza", {
      bet: bet, multiplier: effMult, payout: payout, won: won,
      detail: won ? effMult.toFixed(2) + "x" + (mult > 1 ? " 💥×" + mult : "") : "sem ganho"
    });
    BZG.ui.refreshBalance();
    document.dispatchEvent(new CustomEvent("bzg:balance-changed"));
    renderHistory();

    if (won) {
      var big = effMult >= 10;
      winEl.className = "bonanza-win" + (big ? " big" : "");
      winEl.textContent = "Ganho " + BZG.ui.formatMoney(payout) + " (" + effMult.toFixed(2) + "x)";
      setStatus("Você ganhou " + BZG.ui.formatMoney(payout) + "!");
      BZG.ui.toast("💎 +" + BZG.ui.formatMoney(payout) + " (" + effMult.toFixed(2) + "x)", "success");
      BZG.sounds.win();
      BZG.effects.flash(stageEl, "gold");
      var rect = stageEl.getBoundingClientRect();
      BZG.effects.confetti(rect.left + rect.width / 2, rect.top + rect.height / 2, big ? 110 : 55);
      if (effMult >= 20 || payout >= 25000) BZG.effects.bigWin(payout, effMult);
    } else {
      winEl.textContent = "Sem gemas suficientes... gire de novo!";
      setStatus("Nenhuma combinação de 8+. Tente outra vez!");
      BZG.sounds.lose();
    }

    spinning = false;
    betInput.disabled = false;
    spinBtn.disabled = false;
  }

  function quickBet(fn) {
    var current = Number(betInput.value) || 0;
    betInput.value = Math.max(1, Math.round(fn(current, BZG.storage.getBalance())));
  }

  document.addEventListener("DOMContentLoaded", function () {
    betInput = document.getElementById("bet-amount");
    spinBtn = document.getElementById("spin-btn");
    statusEl = document.getElementById("round-status");
    historyListEl = document.getElementById("history-list");
    gridEl = document.getElementById("bonanza-grid");
    bannerEl = document.getElementById("bonanza-banner");
    winEl = document.getElementById("bonanza-win");
    stageEl = document.getElementById("bonanza-stage");

    newGrid();
    renderGrid(null, false);
    BZG.ui.refreshBalance();
    renderHistory();

    spinBtn.addEventListener("click", spin);
    document.getElementById("bet-half").addEventListener("click", function () { quickBet(function (v) { return v / 2; }); });
    document.getElementById("bet-double").addEventListener("click", function () { quickBet(function (v) { return v * 2; }); });
    document.getElementById("bet-max").addEventListener("click", function () { quickBet(function (v, b) { return b; }); });
  });
})();
