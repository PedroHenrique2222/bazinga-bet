/* Bazinga BET - Bazinga Bonanza (estilo Gems Bonanza): grade 8x8, CLUSTER PAYS
   (5+ gemas iguais coladas na horizontal/vertical pagam), cascata (vencedores somem,
   novas gemas caem) e a FEBRE DO OURO: encha o medidor coletando gemas para um
   multiplicador. Pagamentos calibrados por Monte Carlo (2M giros): RTP ~92%. */
(function () {
  var COLS = 8, ROWS = 8;
  var SCALE = 5.0;
  var MIN_CLUSTER = 5;     // minimo de gemas coladas para pagar
  var FEAT_THRESH = 30;    // gemas coletadas no giro para ativar a Febre do Ouro

  var SYMBOLS = [
    { icon: "🔵", weight: 22, base: 0.020 },
    { icon: "🟢", weight: 20, base: 0.030 },
    { icon: "🟣", weight: 18, base: 0.042 },
    { icon: "🟡", weight: 15, base: 0.060 },
    { icon: "🔴", weight: 12, base: 0.100 },
    { icon: "💎", weight: 8,  base: 0.200 }
  ];
  var TOTALW = SYMBOLS.reduce(function (s, x) { return s + x.weight; }, 0);
  var BASE = {}; SYMBOLS.forEach(function (s) { BASE[s.icon] = s.base; });

  var betInput, spinBtn, statusEl, historyListEl, gridEl, bannerEl, winEl, stageEl, meterFillEl, meterEl;
  var grid = [];      // grid[c][r], r=0 topo
  var spinning = false;

  function setStatus(t) { statusEl.textContent = t; }
  function spd(ms) { return ms * BZG.modes.speed(); }

  function pick() {
    var r = Math.random() * TOTALW;
    for (var i = 0; i < SYMBOLS.length; i++) { r -= SYMBOLS[i].weight; if (r <= 0) return SYMBOLS[i].icon; }
    return SYMBOLS[SYMBOLS.length - 1].icon;
  }

  function sizeFactor(s) { return Math.pow(s - (MIN_CLUSTER - 1), 1.5); }

  function newGrid() {
    grid = [];
    for (var c = 0; c < COLS; c++) { grid[c] = []; for (var r = 0; r < ROWS; r++) grid[c][r] = pick(); }
  }

  function blankGrid() {
    var m = [];
    for (var c = 0; c < COLS; c++) { m[c] = []; for (var r = 0; r < ROWS; r++) m[c][r] = false; }
    return m;
  }

  /* acha todos os clusters (>=MIN_CLUSTER) conectados em 4 direcoes.
     retorna { pay, remove (grade bool das gemas premiadas), removed } */
  function evaluate() {
    var seen = blankGrid();
    var remove = blankGrid();
    var pay = 0, removed = 0;

    for (var c = 0; c < COLS; c++) {
      for (var r = 0; r < ROWS; r++) {
        if (seen[c][r]) continue;
        var icon = grid[c][r];
        var stack = [[c, r]]; seen[c][r] = true;
        var cells = [];
        while (stack.length) {
          var cur = stack.pop(); cells.push(cur);
          var cc = cur[0], rr = cur[1];
          var nb = [[cc + 1, rr], [cc - 1, rr], [cc, rr + 1], [cc, rr - 1]];
          for (var k = 0; k < 4; k++) {
            var nc = nb[k][0], nr = nb[k][1];
            if (nc < 0 || nc >= COLS || nr < 0 || nr >= ROWS) continue;
            if (seen[nc][nr]) continue;
            if (grid[nc][nr] === icon) { seen[nc][nr] = true; stack.push([nc, nr]); }
          }
        }
        if (cells.length >= MIN_CLUSTER) {
          pay += BASE[icon] * sizeFactor(cells.length);
          removed += cells.length;
          for (var m = 0; m < cells.length; m++) remove[cells[m][0]][cells[m][1]] = true;
        }
      }
    }
    return { pay: pay, remove: remove, removed: removed };
  }

  function tumble(remove) {
    for (var c = 0; c < COLS; c++) {
      var kept = [];
      for (var r = 0; r < ROWS; r++) if (!remove[c][r]) kept.push(grid[c][r]);
      var col = [];
      for (var m = 0; m < ROWS - kept.length; m++) col.push(pick());
      grid[c] = col.concat(kept);
    }
  }

  function drawFeat() {
    var r = Math.random();
    if (r < 0.50) return 2;
    if (r < 0.80) return 3;
    if (r < 0.93) return 5;
    if (r < 0.985) return 10;
    return 25;
  }

  function renderGrid(remove, drop) {
    var html = "";
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        var icon = grid[c][r];
        var cls = "gem" + (drop ? " drop" : "") + (remove && remove[c][r] ? " win" : "");
        html += '<div class="' + cls + '">' + icon + '</div>';
      }
    }
    gridEl.innerHTML = html;
  }

  function setMeter(collected) {
    var pct = Math.min(100, (collected / FEAT_THRESH) * 100);
    if (meterFillEl) meterFillEl.style.width = pct + "%";
    if (meterEl) meterEl.classList.toggle("full", pct >= 100);
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
    setMeter(0);
    setStatus("Girando...");
    BZG.sounds.bet();

    newGrid();
    renderGrid(null, true);

    var totalPay = 0, collected = 0;

    function step() {
      var ev = evaluate();
      if (ev.pay <= 0) {
        finish(totalPay, collected, bet);
        return;
      }
      totalPay += ev.pay;
      collected += ev.removed;
      renderGrid(ev.remove, false);   // destaca clusters vencedores
      setMeter(collected);
      BZG.sounds.pegHit();
      setTimeout(function () {
        tumble(ev.remove);
        renderGrid(null, true);       // cascata
        BZG.sounds.tick();
        setTimeout(step, spd(300));
      }, spd(640));
    }
    setTimeout(step, spd(400));
  }

  function finish(totalPay, collected, bet) {
    var mult = 1;
    var feature = totalPay > 0 && collected >= FEAT_THRESH;
    if (feature) mult = drawFeat();

    var effMult = totalPay * SCALE * mult;
    var payout = Math.round(bet * effMult);
    var won = payout > 0;

    if (feature) {
      showBanner("FEBRE DO OURO ×" + mult);
      BZG.sounds.jackpot();
    }

    BZG.storage.recordBet("bonanza", {
      bet: bet, multiplier: effMult, payout: payout, won: won,
      detail: won ? effMult.toFixed(2) + "x" + (feature ? " 🔥×" + mult : "") : "sem ganho"
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
      winEl.textContent = "Sem clusters... gire de novo!";
      setStatus("Nenhum cluster de 5+ gemas. Tente outra vez!");
      BZG.sounds.lose();
    }

    setMeter(0);
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
    meterEl = document.getElementById("bonanza-meter");
    meterFillEl = document.getElementById("bonanza-meter-fill");

    newGrid();
    renderGrid(null, false);
    setMeter(0);
    BZG.ui.refreshBalance();
    renderHistory();

    spinBtn.addEventListener("click", spin);
    document.getElementById("bet-half").addEventListener("click", function () { quickBet(function (v) { return v / 2; }); });
    document.getElementById("bet-double").addEventListener("click", function () { quickBet(function (v) { return v * 2; }); });
    document.getElementById("bet-max").addEventListener("click", function () { quickBet(function (v, b) { return b; }); });
  });
})();
