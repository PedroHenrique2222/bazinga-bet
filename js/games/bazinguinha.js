/* Bazinga BET - Bazinguinha v2: regras estilo Fortune Tiger
   3x3, 5 linhas fixas (3 horizontais + 2 diagonais), ⚡ WILD substitui tudo,
   tela cheia do mesmo simbolo multiplica o ganho por 10.
   Pagamentos por linha calibrados por Monte Carlo (3M giros): RTP ~90%, max 2500x. */
(function () {
  var STRIP_LEN = 21;
  var COL_DURATIONS = [1100, 1500, 1950];

  var SYMBOLS = [
    { icon: "🎃", pay: 1, weight: 6 },
    { icon: "🔋", pay: 1.5, weight: 5 },
    { icon: "🥒", pay: 2.5, weight: 4 },
    { icon: "🍰", pay: 5, weight: 3 },
    { icon: "🍑", pay: 12.5, weight: 2 }
  ];
  var WILD = { icon: "⚡", pay: 50, weight: 1 };
  var ALL = SYMBOLS.concat([WILD]);
  var TOTALW = ALL.reduce(function (s, x) { return s + x.weight; }, 0);
  var PAY = {}; ALL.forEach(function (s) { PAY[s.icon] = s.pay; });

  /* linhas: 1=meio, 2=topo, 3=baixo, 4=diagonal ↘, 5=diagonal ↗ */
  var LINES = [
    [3, 4, 5],  // 1 - meio
    [0, 1, 2],  // 2 - topo
    [6, 7, 8],  // 3 - baixo
    [0, 4, 8],  // 4 - diagonal TL-BR
    [6, 4, 2]   // 5 - diagonal BL-TR
  ];
  /* coordenadas (viewBox 300x300) do centro de cada celula por linha */
  var LINE_COORDS = [
    [[8, 150], [292, 150]],
    [[8, 50], [292, 50]],
    [[8, 250], [292, 250]],
    [[14, 22], [286, 278]],
    [[14, 278], [286, 22]]
  ];

  var betInput, statusEl, historyListEl, gridEl, stageEl, stripEls,
      bannerEl, barBalanceEl, barBetEl, barWinEl, spinBtn, minusBtn, plusBtn, winlinesEl, lineDots;

  var spinning = false;
  var BET_STEPS = [10, 25, 50, 100, 250, 500, 1000, 2500, 5000];

  function setStatus(t) { statusEl.textContent = t; }

  function pick() {
    var r = Math.random() * TOTALW;
    for (var i = 0; i < ALL.length; i++) { r -= ALL[i].weight; if (r <= 0) return ALL[i].icon; }
    return ALL[ALL.length - 1].icon;
  }

  function evalLine(a, b, c) {
    var cells = [a, b, c];
    var nonWild = cells.filter(function (x) { return x !== "⚡"; });
    if (nonWild.length === 0) return PAY["⚡"];
    var f = nonWild[0];
    if (nonWild.every(function (x) { return x === f; })) return PAY[f];
    return 0;
  }

  function cellHTML(icon) {
    if (icon === "⚡") {
      return '<div class="ft-cell ft-cell-wild"><i>⚡</i><em>WILD</em></div>';
    }
    return '<div class="ft-cell">' + icon + '</div>';
  }

  function easeOutQuart(t) { return 1 - Math.pow(1 - t, 4); }

  function buildStrip(stripEl, colSymbols) {
    var cells = [];
    for (var i = 0; i < STRIP_LEN - 3; i++) cells.push(ALL[Math.floor(Math.random() * ALL.length)].icon);
    cells = cells.concat(colSymbols);
    stripEl.innerHTML = cells.map(cellHTML).join("");
    stripEl.style.transform = "translateY(0px)";
    // altura real da celula (responsiva via CSS)
    var cellH = stripEl.firstChild.getBoundingClientRect().height;
    return (STRIP_LEN - 3) * cellH;
  }

  function updateBar() {
    barBalanceEl.textContent = BZG.ui.formatMoney(BZG.storage.getBalance());
    barBetEl.textContent = BZG.ui.formatMoney(Math.round(Number(betInput.value)) || 0);
  }

  function clearWinFx() {
    winlinesEl.innerHTML = "";
    lineDots.forEach(function (d) { d.classList.remove("hit"); });
    bannerEl.className = "ft-banner";
    bannerEl.textContent = "⚡ Ganhe até 2500x! ⚡";
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

  function stepBet(dir) {
    var current = Math.round(Number(betInput.value)) || 0;
    var next;
    if (dir > 0) {
      next = BET_STEPS.find(function (v) { return v > current; }) || BET_STEPS[BET_STEPS.length - 1];
    } else {
      var lower = BET_STEPS.filter(function (v) { return v < current; });
      next = lower.length ? lower[lower.length - 1] : BET_STEPS[0];
    }
    betInput.value = next;
    updateBar();
    BZG.sounds.click();
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
    minusBtn.disabled = true;
    plusBtn.disabled = true;
    spinBtn.classList.add("spinning");
    clearWinFx();
    barWinEl.textContent = "BZ$ 0";
    bannerEl.textContent = "Girando...";
    setStatus("Girando...");
    BZG.sounds.bet();

    // sorteia a grade 3x3 (indice = linha*3 + coluna)
    var grid = [];
    for (var i = 0; i < 9; i++) grid.push(pick());

    // reconstroi as colunas com fitas
    gridEl.innerHTML =
      '<div class="ft-col"><div class="ft-strip" id="fstrip-0"></div></div>' +
      '<div class="ft-col"><div class="ft-strip" id="fstrip-1"></div></div>' +
      '<div class="ft-col"><div class="ft-strip" id="fstrip-2"></div></div>';
    stripEls = [
      document.getElementById("fstrip-0"),
      document.getElementById("fstrip-1"),
      document.getElementById("fstrip-2")
    ];

    var distances = [];
    for (var c = 0; c < 3; c++) {
      distances.push(buildStrip(stripEls[c], [grid[c], grid[3 + c], grid[6 + c]]));
    }

    var start = performance.now();
    var lastTicks = [0, 0, 0];
    var done = [false, false, false];

    function frame(now) {
      var allDone = true;
      for (var c2 = 0; c2 < 3; c2++) {
        var t = Math.min(1, (now - start) / (COL_DURATIONS[c2] * BZG.modes.speed()));
        var eased = easeOutQuart(t);
        stripEls[c2].style.transform = "translateY(-" + (distances[c2] * eased).toFixed(1) + "px)";
        var cellH = distances[c2] / (STRIP_LEN - 3);
        var crossed = Math.floor((distances[c2] * eased) / cellH);
        if (crossed > lastTicks[c2] && t < 1) { if (c2 === 0) BZG.sounds.tick(); lastTicks[c2] = crossed; }
        if (t >= 1 && !done[c2]) { done[c2] = true; BZG.sounds.click(); }
        if (t < 1) allDone = false;
      }
      if (allDone) finish(grid, bet);
      else requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function finish(grid, bet) {
    // avalia as 5 linhas
    var totalPay = 0;
    var winLines = [];
    var winCells = {};
    for (var l = 0; l < LINES.length; l++) {
      var ln = LINES[l];
      var p = evalLine(grid[ln[0]], grid[ln[1]], grid[ln[2]]);
      if (p > 0) {
        totalPay += p;
        winLines.push(l);
        winCells[ln[0]] = winCells[ln[1]] = winCells[ln[2]] = true;
      }
    }

    // tela cheia: todos os 9 sao o mesmo simbolo (wild vale como qualquer)
    var nonWild = grid.filter(function (x) { return x !== "⚡"; });
    var fullScreen = totalPay > 0 && (nonWild.length === 0 ||
      nonWild.every(function (x) { return x === nonWild[0]; }));
    if (fullScreen) totalPay *= 10;

    var payout = Math.round(bet * totalPay);
    var won = payout > 0;

    // grade final estatica com destaque nas celulas vencedoras
    gridEl.innerHTML =
      '<div class="ft-col-static c0"></div><div class="ft-col-static c1"></div><div class="ft-col-static c2"></div>';
    // renderiza como colunas para manter o mesmo visual
    for (var c = 0; c < 3; c++) {
      var colEl = gridEl.children[c];
      colEl.className = "ft-col";
      var html = "";
      for (var r = 0; r < 3; r++) {
        var idx = r * 3 + c;
        var cellHtml = cellHTML(grid[idx]);
        if (winCells[idx]) cellHtml = cellHtml.replace('class="ft-cell', 'class="ft-cell hit');
        html += cellHtml;
      }
      colEl.innerHTML = '<div class="ft-strip">' + html + '</div>';
    }

    // desenha as linhas vencedoras e acende os indicadores
    winlinesEl.innerHTML = winLines.map(function (l) {
      var co = LINE_COORDS[l];
      return '<line x1="' + co[0][0] + '" y1="' + co[0][1] + '" x2="' + co[1][0] + '" y2="' + co[1][1] + '"/>';
    }).join("");
    lineDots.forEach(function (d) {
      if (winLines.indexOf(Number(d.dataset.line)) !== -1) d.classList.add("hit");
    });

    BZG.storage.recordBet("bazinguinha", {
      bet: bet, multiplier: totalPay, payout: payout, won: won,
      detail: won ? (totalPay.toFixed(2) + "x" + (fullScreen ? " 💥 TELA CHEIA" : "")) : "sem linha"
    });
    BZG.ui.refreshBalance();
    document.dispatchEvent(new CustomEvent("bzg:balance-changed"));
    renderHistory();

    if (won) {
      barWinEl.textContent = BZG.ui.formatMoney(payout);
      if (fullScreen) {
        bannerEl.className = "ft-banner fullscreen";
        bannerEl.textContent = "💥 TELA CHEIA! Ganho ×10 — " + BZG.ui.formatMoney(payout);
        BZG.sounds.roar();
        BZG.effects.bigWin(payout, totalPay);
      } else {
        bannerEl.className = "ft-banner win";
        bannerEl.textContent = "Ganho " + BZG.ui.formatMoney(payout);
        if (totalPay >= 15 || payout >= 25000) {
          BZG.sounds.roar();
          BZG.effects.bigWin(payout, totalPay);
        }
      }
      setStatus("Você ganhou " + BZG.ui.formatMoney(payout) + " (" + totalPay.toFixed(2) + "x)!");
      BZG.ui.toast("🐯 +" + BZG.ui.formatMoney(payout) + " (" + totalPay.toFixed(2) + "x)", "success");
      BZG.sounds.win();
      BZG.effects.flash(stageEl, "gold");
      var rect = stageEl.getBoundingClientRect();
      BZG.effects.confetti(rect.left + rect.width / 2, rect.top + rect.height / 2, totalPay >= 10 ? 110 : 55);
    } else {
      bannerEl.className = "ft-banner";
      bannerEl.textContent = "Quase! Gire de novo 🐯";
      setStatus("Não formou linha. Tente outra vez!");
      BZG.sounds.lose();
    }

    spinning = false;
    betInput.disabled = false;
    spinBtn.disabled = false;
    minusBtn.disabled = false;
    plusBtn.disabled = false;
    spinBtn.classList.remove("spinning");
  }

  function quickBet(fn) {
    var current = Number(betInput.value) || 0;
    betInput.value = Math.max(1, Math.round(fn(current, BZG.storage.getBalance())));
    updateBar();
  }

  document.addEventListener("DOMContentLoaded", function () {
    betInput = document.getElementById("bet-amount");
    statusEl = document.getElementById("round-status");
    historyListEl = document.getElementById("history-list");
    gridEl = document.getElementById("ft-grid");
    stageEl = document.getElementById("tiger-stage");
    bannerEl = document.getElementById("ft-banner");
    barBalanceEl = document.getElementById("ft-balance");
    barBetEl = document.getElementById("ft-bet");
    barWinEl = document.getElementById("ft-win");
    spinBtn = document.getElementById("ft-spin");
    minusBtn = document.getElementById("ft-minus");
    plusBtn = document.getElementById("ft-plus");
    winlinesEl = document.getElementById("ft-winlines");
    lineDots = Array.prototype.slice.call(document.querySelectorAll(".ft-line-dot"));

    // grade inicial aleatoria
    for (var c = 0; c < 3; c++) {
      var html = "";
      for (var r = 0; r < 3; r++) html += cellHTML(ALL[Math.floor(Math.random() * ALL.length)].icon);
      document.getElementById("fstrip-" + c).innerHTML = html;
    }

    BZG.ui.refreshBalance();
    renderHistory();
    updateBar();

    spinBtn.addEventListener("click", spin);
    minusBtn.addEventListener("click", function () { stepBet(-1); });
    plusBtn.addEventListener("click", function () { stepBet(1); });
    betInput.addEventListener("input", updateBar);
    document.addEventListener("bzg:balance-changed", updateBar);

    document.getElementById("bet-half").addEventListener("click", function () { quickBet(function (v) { return v / 2; }); });
    document.getElementById("bet-double").addEventListener("click", function () { quickBet(function (v) { return v * 2; }); });
    document.getElementById("bet-max").addEventListener("click", function () { quickBet(function (v, b) { return b; }); });
  });
})();
