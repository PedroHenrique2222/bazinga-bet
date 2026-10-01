/* Bazinga BET - Bazinguinha v3: regras estilo Fortune Tiger COM respin de wild grudento.
   3x3, 5 linhas fixas (3 horizontais + 2 diagonais), ⚡ WILD substitui tudo,
   tela cheia do mesmo simbolo multiplica o ganho por 10.
   Respin grudento: caiu >=1 wild? ele TRAVA e os outros simbolos re-giram;
   enquanto uma re-rolagem trouxer wild NOVO, gira de novo (ate a tela encher).
   Calibrado por Monte Carlo (4M giros): RTP ~95%, max 2500x. */
(function () {
  var STRIP_LEN = 21;
  var COL_DURATIONS = [1100, 1500, 1950];
  var MAX_RESPINS = 30; // trava de seguranca (na pratica quase nunca passa de 3-4)

  var SYMBOLS = [
    { icon: "🎃", pay: 1, weight: 30 },
    { icon: "🔋", pay: 1.5, weight: 25 },
    { icon: "🥒", pay: 2.5, weight: 20 },
    { icon: "🍰", pay: 5, weight: 15 },
    { icon: "🍑", pay: 12.5, weight: 10 }
  ];
  var WILD = { icon: "⚡", pay: 50, weight: 3 };
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
      bannerEl, barBalanceEl, barBetEl, barWinEl, spinBtn, minusBtn, plusBtn, winlinesEl, lineDots, mascotEl;

  // reação do mascote (O Menor Quentão): "happy" | "hype" | "sad" | null (repouso)
  function reactMascot(state) {
    if (!mascotEl) return;
    mascotEl.classList.remove("happy", "hype", "sad");
    if (state) { void mascotEl.offsetWidth; mascotEl.classList.add(state); }
  }

  var spinning = false;
  var auto = null; // giro automatico (autospin.js)
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

  function countWild(grid) {
    return grid.filter(function (x) { return x === "⚡"; }).length;
  }

  /* Redesenha a grade 3x3 estatica (mesmas colunas do giro), com marcadores
     opcionais: winCells (celulas vencedoras), locked (wilds travados brilhando),
     reroll (celulas que acabaram de re-girar, com animacao de troca). */
  function renderStaticGrid(grid, opts) {
    opts = opts || {};
    var winCells = opts.winCells || {};
    var reroll = opts.reroll || null;
    gridEl.innerHTML = '<div class="ft-col"></div><div class="ft-col"></div><div class="ft-col"></div>';
    for (var c = 0; c < 3; c++) {
      var colEl = gridEl.children[c];
      var html = "";
      for (var r = 0; r < 3; r++) {
        var idx = r * 3 + c;
        var extra = "";
        if (winCells[idx]) extra += " hit";
        if (opts.locked && grid[idx] === "⚡") extra += " locked";
        if (reroll && reroll.indexOf(idx) !== -1) extra += " reroll";
        var cellHtml = cellHTML(grid[idx]);
        if (extra) cellHtml = cellHtml.replace('class="ft-cell', 'class="ft-cell' + extra);
        html += cellHtml;
      }
      colEl.innerHTML = '<div class="ft-strip">' + html + '</div>';
    }
  }

  /* simbolo desenhado (icons.js) de cada emoji; sem icons.js, mostra o emoji */
  var SYM_ART = { "🎃": "s-abobora", "🔋": "s-pilha", "🥒": "s-picles", "🍰": "s-bolo", "🍑": "s-pessego", "⚡": "s-raio" };
  function symArt(icon, size) {
    return BZG.icons && SYM_ART[icon] ? BZG.icons.art(SYM_ART[icon], size || 64) : icon;
  }

  /* troca so as celulas indicadas, sem recriar a grade inteira */
  function updateCells(grid, idxs) {
    idxs.forEach(function (idx) {
      var col = gridEl.children[idx % 3];
      var strip = col && col.firstChild;
      var old = strip && strip.children[Math.floor(idx / 3)];
      if (!old) return;
      var tmp = document.createElement("div");
      tmp.innerHTML = cellHTML(grid[idx]);
      var cell = tmp.firstChild;
      cell.classList.add("reroll");
      if (grid[idx] === "⚡") cell.classList.add("locked");
      strip.replaceChild(cell, old);
    });
  }

  function cellHTML(icon) {
    if (icon === "⚡") {
      return '<div class="ft-cell ft-cell-wild"><i>' + symArt("⚡") + '</i><em>WILD</em></div>';
    }
    return '<div class="ft-cell">' + symArt(icon) + '</div>';
  }

  /* troca os emojis de um texto pelos simbolos desenhados (tabela de premios) */
  function symbolizeText(el) {
    if (!BZG.icons) return;
    Object.keys(SYM_ART).forEach(function (emo) {
      el.innerHTML = el.innerHTML.split(emo).join('<span class="sym-inline">' + symArt(emo, 22) + '</span>');
    });
  }

  /* suspense: as duas primeiras colunas ja formam meia linha (iguais ou com wild)?
     entao a 3a coluna gira mais devagar, brilhando */
  function teaseLine(grid) {
    return LINES.some(function (ln) {
      var byCol = ln.slice().sort(function (a, b) { return (a % 3) - (b % 3); });
      var a = grid[byCol[0]], b = grid[byCol[1]];
      return a === b || a === "⚡" || b === "⚡";
    });
  }

  /* o ganho sobe contando na barra */
  function countUp(el, to) {
    var start = performance.now(), dur = Math.min(1600, 500 + to / 40) * BZG.modes.speed();
    (function step(now) {
      var p = Math.min(1, (now - start) / dur);
      el.textContent = BZG.ui.formatMoney(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(step);
    })(start);
  }

  function easeOutQuart(t) { return 1 - Math.pow(1 - t, 4); }

  /* posicao do rolo no tempo t (0..1): desacelera, passa um pouquinho do ponto
     (overshoot de ~18% de uma celula) e volta macio - parece um rolo de verdade */
  var STOP_AT = 0.86;
  function reelPos(t, dist, cellH) {
    var over = cellH * 0.18;
    if (t < STOP_AT) return (dist + over) * easeOutQuart(t / STOP_AT);
    var k = (t - STOP_AT) / (1 - STOP_AT);
    return dist + over * (1 - (1 - Math.pow(1 - k, 2)));
  }

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
    if (spinning) return false;
    var bet = Math.round(Number(betInput.value));
    var balance = BZG.storage.getBalance();
    if (!bet || bet <= 0) { BZG.ui.toast("Digite um valor de aposta válido.", "error"); return false; }
    if (bet > balance) { BZG.ui.toast("Você não tem saldo suficiente.", "error"); return false; }

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
      stripEls[c].classList.add("blur"); // motion blur enquanto gira
    }
    reactMascot(null); // volta o mascote ao repouso ao começar

    var tease = teaseLine(grid);
    var durs = COL_DURATIONS.slice();
    if (tease) durs[2] += 1500; // a 3a coluna demora mais quando pode fechar linha

    var start = performance.now();
    var lastTicks = [0, 0, 0];
    var done = [false, false, false];

    function frame(now) {
      var allDone = true;
      for (var c2 = 0; c2 < 3; c2++) {
        var t = Math.min(1, (now - start) / (durs[c2] * BZG.modes.speed()));
        var cellH = distances[c2] / (STRIP_LEN - 3);
        var pos = reelPos(t, distances[c2], cellH);
        stripEls[c2].style.transform = "translate3d(0,-" + pos.toFixed(1) + "px,0)";
        var crossed = Math.floor(pos / cellH);
        if (crossed > lastTicks[c2] && t < 1) {
          if (c2 === 0 || (tease && c2 === 2 && done[1])) BZG.sounds.tick();
          lastTicks[c2] = crossed;
        }
        if (t >= STOP_AT && !done[c2]) {
          done[c2] = true;
          BZG.sounds.click();
          stripEls[c2].classList.remove("blur");       // tira o blur ao parar
          var col = stripEls[c2].parentElement;         // flash de "quique" na coluna
          if (col) { col.classList.remove("bump", "tease"); void col.offsetWidth; col.classList.add("bump"); }
          // 2a coluna parou e pode sair linha: a 3a brilha e o banner faz suspense
          if (c2 === 1 && tease && stripEls[2]) {
            stripEls[2].parentElement.classList.add("tease");
            bannerEl.className = "ft-banner tease";
            bannerEl.textContent = "Será?! 👀";
            BZG.sounds.countdownBeep();
          }
        }
        if (t < 1) allDone = false;
      }
      if (allDone) maybeRespin(grid, bet);
      else requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* Apos o giro cair: se ha wild(s) e a tela nao esta cheia, entra no respin
     grudento - trava os wilds e re-gira o resto, encadeando enquanto surgir
     wild novo. Quando parar, avalia o resultado em finish(). */
  function maybeRespin(grid, bet) {
    var wc = countWild(grid);
    if (wc < 1 || wc >= 9) { finish(grid, bet); return; }
    bannerEl.className = "ft-banner respin";
    bannerEl.textContent = "⚡ WILD TRAVADO! Re-girando…";
    setStatus("Wild grudento! Re-girando os outros símbolos…");
    renderStaticGrid(grid, { locked: true });
    BZG.sounds.roar();
    var sp = BZG.modes.speed();
    setTimeout(function () { respinRound(grid, bet, 1); }, 520 * sp);
  }

  function respinRound(grid, bet, round) {
    var before = countWild(grid);
    var changed = [];
    var newWild = false;
    for (var j = 0; j < 9; j++) {
      if (grid[j] !== "⚡") {
        grid[j] = pick();
        changed.push(j);
        if (grid[j] === "⚡") newWild = true;
      }
    }
    var wc = countWild(grid);
    updateCells(grid, changed);
    BZG.sounds.click();

    var sp = BZG.modes.speed();
    var again = newWild && wc < 9 && round < MAX_RESPINS;
    if (newWild) {
      var gained = wc - before;
      bannerEl.className = "ft-banner respin";
      bannerEl.textContent = "⚡ +" + gained + " WILD! Re-girando…";
      BZG.sounds.coin();
      BZG.effects.flash(stageEl, "gold");
      reactMascot("happy"); // O Menor Quentão se anima a cada wild novo
    }
    setTimeout(function () {
      if (again) respinRound(grid, bet, round + 1);
      else finish(grid, bet);
    }, (newWild ? 720 : 560) * sp);
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

    // grade final estatica: celulas vencedoras piscam, wilds ficam realcados
    renderStaticGrid(grid, { winCells: winCells, locked: true });

    // desenha as linhas vencedoras e acende os indicadores
    winlinesEl.innerHTML = winLines.map(function (l) {
      var co = LINE_COORDS[l];
      return '<line pathLength="100" x1="' + co[0][0] + '" y1="' + co[0][1] + '" x2="' + co[1][0] + '" y2="' + co[1][1] + '"/>';
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
      countUp(barWinEl, payout);
      if (totalPay >= 5) BZG.effects.shake(stageEl);
      var bigWin = fullScreen || totalPay >= 15 || payout >= 25000;
      if (fullScreen) {
        bannerEl.className = "ft-banner fullscreen";
        bannerEl.textContent = "💥 TELA CHEIA! Ganho ×10 — " + BZG.ui.formatMoney(payout);
        BZG.sounds.roar();
        BZG.effects.bigWin(payout, totalPay);
      } else {
        bannerEl.className = "ft-banner win";
        bannerEl.textContent = "Ganho " + BZG.ui.formatMoney(payout);
        if (bigWin) {
          BZG.sounds.roar();
          BZG.effects.bigWin(payout, totalPay);
        }
      }
      reactMascot(bigWin ? "hype" : "happy"); // O Menor Quentão comemora
      setStatus("Você ganhou " + BZG.ui.formatMoney(payout) + " (" + totalPay.toFixed(2) + "x)!");
      BZG.ui.toast("🔥 +" + BZG.ui.formatMoney(payout) + " (" + totalPay.toFixed(2) + "x)", "success");
      BZG.sounds.win();
      BZG.effects.flash(stageEl, "gold");
      var rect = stageEl.getBoundingClientRect();
      BZG.effects.confetti(rect.left + rect.width / 2, rect.top + rect.height / 2, totalPay >= 10 ? 110 : 55);
    } else {
      bannerEl.className = "ft-banner";
      bannerEl.textContent = "Quase! Gire de novo 🔥";
      reactMascot("sad"); // O Menor Quentão fica de nariz torto
      setStatus("Não formou linha. Tente outra vez!");
      BZG.sounds.lose();
    }

    spinning = false;
    betInput.disabled = false;
    spinBtn.disabled = false;
    minusBtn.disabled = false;
    plusBtn.disabled = false;
    spinBtn.classList.remove("spinning");
    if (auto) auto.done(true);
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
    mascotEl = document.getElementById("mq-mascot");

    // grade inicial aleatoria
    for (var c = 0; c < 3; c++) {
      var html = "";
      for (var r = 0; r < 3; r++) html += cellHTML(ALL[Math.floor(Math.random() * ALL.length)].icon);
      document.getElementById("fstrip-" + c).innerHTML = html;
    }

    BZG.ui.refreshBalance();
    renderHistory();
    updateBar();

    spinBtn.addEventListener("click", function () { if (auto) auto.stop(); spin(); });
    var autoEl = document.getElementById("autospin");
    if (autoEl && BZG.autospin) auto = BZG.autospin.create(autoEl, spin);
    Array.prototype.forEach.call(document.querySelectorAll(".paytable-row span, #round-status"), symbolizeText);
    minusBtn.addEventListener("click", function () { stepBet(-1); });
    plusBtn.addEventListener("click", function () { stepBet(1); });
    betInput.addEventListener("input", updateBar);
    document.addEventListener("bzg:balance-changed", updateBar);

    document.getElementById("bet-half").addEventListener("click", function () { quickBet(function (v) { return v / 2; }); });
    document.getElementById("bet-double").addEventListener("click", function () { quickBet(function (v) { return v * 2; }); });
    document.getElementById("bet-max").addEventListener("click", function () { quickBet(function (v, b) { return b; }); });
  });
})();
