/* Bazinga BET - Bazinguinha (Fortune Tiger 3x3, curinga = raio ⚡) */
(function () {
  var CELL = 76;
  var STRIP_LEN = 21;
  var COL_DURATIONS = [1100, 1500, 1950];
  var SCALE = 0.68; // calibrado por Monte Carlo (2M giros) para RTP ~0.95

  var SYMBOLS = [
    { icon: "💎", pay: 12, weight: 2 },
    { icon: "7️⃣", pay: 6, weight: 3 },
    { icon: "⭐", pay: 3, weight: 4 },
    { icon: "🔔", pay: 2, weight: 5 },
    { icon: "🍒", pay: 1, weight: 7 }
  ];
  var WILD = { icon: "⚡", pay: 25, weight: 1 };
  var ALL = SYMBOLS.concat([WILD]);
  var TOTALW = ALL.reduce(function (s, x) { return s + x.weight; }, 0);
  var PAY = {}; ALL.forEach(function (s) { PAY[s.icon] = s.pay; });

  var betInput, spinBtn, statusEl, historyListEl, gridEl, resultEl, stageEl, stripEls;
  var spinning = false;

  function setStatus(t) { statusEl.textContent = t; }

  function pick() {
    var r = Math.random() * TOTALW;
    for (var i = 0; i < ALL.length; i++) { r -= ALL[i].weight; if (r <= 0) return ALL[i].icon; }
    return ALL[ALL.length - 1].icon;
  }

  function wildBadge() {
    if (Math.random() < 0.5) return 1;
    var r = Math.random() * 100;
    if (r < 70) return 2;
    if (r < 95) return 5;
    return 10;
  }

  function evalRow(row) {
    var nonWild = row.filter(function (c) { return c !== "⚡"; });
    if (nonWild.length === 0) return PAY["⚡"];
    var first = nonWild[0];
    if (nonWild.every(function (c) { return c === first; })) return PAY[first];
    return 0;
  }

  function easeOutQuart(t) { return 1 - Math.pow(1 - t, 4); }

  function buildStrip(stripEl, colSymbols) {
    // colSymbols = [linha0, linha1, linha2] desta coluna (aparecem no fim da fita)
    var cells = [];
    for (var i = 0; i < STRIP_LEN - 3; i++) cells.push(ALL[Math.floor(Math.random() * ALL.length)].icon);
    cells = cells.concat(colSymbols);
    stripEl.innerHTML = cells.map(function (icon) {
      return '<div class="tiger-cell">' + icon + '</div>';
    }).join("");
    stripEl.style.transform = "translateY(0px)";
    return (STRIP_LEN - 3) * CELL;
  }

  function renderHistory() {
    var entries = BZG.storage.getHistory("bazinguinha");
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

  function spin() {
    if (spinning) return;
    var bet = Math.round(Number(betInput.value));
    var balance = BZG.storage.getBalance();
    if (!bet || bet <= 0) { BZG.ui.toast("Digite um valor de aposta válido.", "error"); return; }
    if (bet > balance) { BZG.ui.toast("Você não tem saldo suficiente.", "error"); return; }

    spinning = true;
    betInput.disabled = true;
    spinBtn.disabled = true;
    resultEl.textContent = "";
    setStatus("Girando...");
    BZG.sounds.bet();

    // sorteia a grade 3x3 e os badges dos curingas
    var grid = [];       // 9 icones, indice = row*3 + col
    var badges = {};     // indice -> multiplicador do curinga (se >1)
    var wildProduct = 1;
    for (var i = 0; i < 9; i++) {
      var s = pick();
      grid.push(s);
      if (s === "⚡") {
        var b = wildBadge();
        if (b > 1) { badges[i] = b; }
        wildProduct *= b;
      }
    }

    // restaura a visualizacao de colunas (caso venha de um resultado estatico)
    gridEl.className = "tiger-grid";
    gridEl.innerHTML =
      '<div class="tiger-col"><div class="tiger-strip" id="tstrip-0"></div></div>' +
      '<div class="tiger-col"><div class="tiger-strip" id="tstrip-1"></div></div>' +
      '<div class="tiger-col"><div class="tiger-strip" id="tstrip-2"></div></div>';
    stripEls = [
      document.getElementById("tstrip-0"),
      document.getElementById("tstrip-1"),
      document.getElementById("tstrip-2")
    ];

    var distances = [];
    for (var c = 0; c < 3; c++) {
      var colSyms = [grid[0 * 3 + c], grid[1 * 3 + c], grid[2 * 3 + c]];
      distances.push(buildStrip(stripEls[c], colSyms));
    }

    var start = performance.now();
    var lastTicks = [0, 0, 0];
    var done = [false, false, false];

    function frame(now) {
      var allDone = true;
      for (var c2 = 0; c2 < 3; c2++) {
        var t = Math.min(1, (now - start) / COL_DURATIONS[c2]);
        var eased = easeOutQuart(t);
        stripEls[c2].style.transform = "translateY(-" + (distances[c2] * eased).toFixed(1) + "px)";
        var crossed = Math.floor((distances[c2] * eased) / CELL);
        if (crossed > lastTicks[c2] && t < 1) { if (c2 === 0) BZG.sounds.tick(); lastTicks[c2] = crossed; }
        if (t >= 1 && !done[c2]) { done[c2] = true; BZG.sounds.click(); }
        if (t < 1) allDone = false;
      }
      if (allDone) finish(grid, badges, wildProduct, bet);
      else requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function finish(grid, badges, wildProduct, bet) {
    // avalia as 3 linhas
    var totalPay = 0;
    var winCells = {};
    for (var r = 0; r < 3; r++) {
      var row = [grid[r * 3], grid[r * 3 + 1], grid[r * 3 + 2]];
      var p = evalRow(row);
      if (p > 0) {
        totalPay += p;
        winCells[r * 3] = winCells[r * 3 + 1] = winCells[r * 3 + 2] = true;
      }
    }
    var effMult = totalPay > 0 ? totalPay * wildProduct * SCALE : 0;
    var payout = Math.round(bet * effMult);
    var won = payout > 0;

    // renderiza a grade final estatica com destaques e badges
    gridEl.className = "tiger-grid-final";
    gridEl.innerHTML = grid.map(function (icon, i) {
      var cls = "tiger-fcell" + (winCells[i] ? " win" : "");
      var badge = badges[i] ? '<span class="tiger-badge">x' + badges[i] + '</span>' : "";
      return '<div class="' + cls + '">' + icon + badge + '</div>';
    }).join("");

    BZG.storage.recordBet("bazinguinha", {
      bet: bet, multiplier: effMult, payout: payout, won: won,
      detail: won ? effMult.toFixed(2) + "x" + (wildProduct > 1 ? " ⚡x" + wildProduct : "") : "sem linha"
    });
    BZG.ui.refreshBalance();
    document.dispatchEvent(new CustomEvent("bzg:balance-changed"));
    renderHistory();

    if (won) {
      resultEl.textContent = "+" + BZG.ui.formatMoney(payout) + " (" + effMult.toFixed(2) + "x)" +
        (wildProduct > 1 ? "  ⚡ curinga x" + wildProduct + "!" : "");
      setStatus("Você ganhou " + BZG.ui.formatMoney(payout) + "!");
      BZG.ui.toast("🐯 +" + BZG.ui.formatMoney(payout) + " (" + effMult.toFixed(2) + "x)", "success");
      BZG.sounds.win();
      BZG.effects.flash(stageEl, "gold");
      var rect = stageEl.getBoundingClientRect();
      BZG.effects.confetti(rect.left + rect.width / 2, rect.top + rect.height / 2, effMult >= 10 ? 110 : 55);
      if (effMult >= 15 || payout >= 25000) {
        BZG.sounds.roar();
        BZG.effects.bigWin(payout, effMult);
      }
    } else {
      resultEl.textContent = "Sem linha... gire de novo!";
      setStatus("Não formou linha. Tente outra vez!");
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
    gridEl = document.getElementById("tiger-grid");
    resultEl = document.getElementById("tiger-result");
    stageEl = document.getElementById("tiger-stage");

    // grade inicial estatica aleatoria
    gridEl.className = "tiger-grid-final";
    var init = "";
    for (var i = 0; i < 9; i++) init += '<div class="tiger-fcell">' + ALL[Math.floor(Math.random() * ALL.length)].icon + '</div>';
    gridEl.innerHTML = init;

    BZG.ui.refreshBalance();
    renderHistory();

    spinBtn.addEventListener("click", spin);
    document.getElementById("bet-half").addEventListener("click", function () { quickBet(function (v) { return v / 2; }); });
    document.getElementById("bet-double").addEventListener("click", function () { quickBet(function (v) { return v * 2; }); });
    document.getElementById("bet-max").addEventListener("click", function () { quickBet(function (v, b) { return b; }); });
  });
})();
