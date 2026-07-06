/* Bazinga BET - Roleta europeia (0-36) com mesa de apostas multiplas */
(function () {
  var WHEEL_ORDER = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
  var RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
  var SPIN_MS = 4200;
  var EXTRA_TURNS = 5;

  var betInput, spinBtn, clearBtn, statusEl, historyListEl, boardEl, totalEl,
      canvas, ctx, stageEl, resultsEl;

  var bets = {};        // chave -> valor apostado (ex: "n17", "red", "d2")
  var spinning = false;
  var wheelRotation = 0;

  function colorOf(n) {
    if (n === 0) return "green";
    return RED_NUMBERS.indexOf(n) !== -1 ? "red" : "black";
  }

  function setStatus(text) {
    statusEl.textContent = text;
  }

  function totalStaked() {
    var sum = 0;
    Object.keys(bets).forEach(function (k) { sum += bets[k]; });
    return sum;
  }

  /* ---------- Roda (canvas) ---------- */

  function drawWheel(rotation) {
    var w = canvas.width, h = canvas.height;
    var cx = w / 2, cy = h / 2;
    var rOuter = w / 2 - 6;
    var rInner = rOuter - 34;
    var seg = (Math.PI * 2) / WHEEL_ORDER.length;

    ctx.clearRect(0, 0, w, h);

    // aro externo dourado
    ctx.beginPath();
    ctx.arc(cx, cy, rOuter + 4, 0, Math.PI * 2);
    ctx.fillStyle = "#d1a300";
    ctx.fill();

    for (var i = 0; i < WHEEL_ORDER.length; i++) {
      var n = WHEEL_ORDER[i];
      var start = rotation + i * seg - Math.PI / 2 - seg / 2;
      var color = colorOf(n);

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, rOuter, start, start + seg);
      ctx.closePath();
      ctx.fillStyle = color === "green" ? "#1a8a4a" : (color === "red" ? "#d81f2c" : "#17171d");
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 204, 0, 0.35)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // numero
      var mid = start + seg / 2;
      var tx = cx + Math.cos(mid) * (rOuter - 15);
      var ty = cy + Math.sin(mid) * (rOuter - 15);
      ctx.save();
      ctx.translate(tx, ty);
      ctx.rotate(mid + Math.PI / 2);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 10px Segoe UI, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(n), 0, 0);
      ctx.restore();
    }

    // centro
    ctx.beginPath();
    ctx.arc(cx, cy, rInner, 0, Math.PI * 2);
    ctx.fillStyle = BZG.theme.get() === "dark" ? "#0e0e13" : "#f2f0ec";
    ctx.fill();
    ctx.strokeStyle = "#d1a300";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = BZG.theme.get() === "dark" ? "#ffcc00" : "#b5121f";
    ctx.font = "900 22px Segoe UI, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("⚡", cx, cy);

    // ponteiro no topo
    ctx.beginPath();
    ctx.moveTo(cx - 10, 2);
    ctx.lineTo(cx + 10, 2);
    ctx.lineTo(cx, 20);
    ctx.closePath();
    ctx.fillStyle = "#ffcc00";
    ctx.fill();
  }

  /* ---------- Mesa ---------- */

  function buildBoard() {
    var html = '<div class="board-main">';
    html += '<div class="board-zero" data-bet="n0">0</div>';
    html += '<div class="board-grid">';
    // linha de cima: 3,6,...,36 | meio: 2,5,...,35 | baixo: 1,4,...,34
    for (var row = 3; row >= 1; row--) {
      for (var col = 0; col < 12; col++) {
        var n = col * 3 + row;
        html += '<div class="board-cell board-cell--' + colorOf(n) + '" data-bet="n' + n + '">' + n + '</div>';
      }
    }
    html += '</div></div>';

    html += '<div class="board-row board-row--dozens">' +
      '<div class="board-outside" data-bet="d1">1ª dúzia (3x)</div>' +
      '<div class="board-outside" data-bet="d2">2ª dúzia (3x)</div>' +
      '<div class="board-outside" data-bet="d3">3ª dúzia (3x)</div>' +
      '</div>';

    html += '<div class="board-row board-row--outside">' +
      '<div class="board-outside" data-bet="low">1-18</div>' +
      '<div class="board-outside" data-bet="even">PAR</div>' +
      '<div class="board-outside board-outside--red" data-bet="red">VERMELHO</div>' +
      '<div class="board-outside board-outside--black" data-bet="black">PRETO</div>' +
      '<div class="board-outside" data-bet="odd">ÍMPAR</div>' +
      '<div class="board-outside" data-bet="high">19-36</div>' +
      '</div>';

    boardEl.innerHTML = html;

    Array.prototype.forEach.call(boardEl.querySelectorAll("[data-bet]"), function (cell) {
      cell.addEventListener("click", function () {
        placeBet(cell.dataset.bet);
      });
    });
  }

  function placeBet(key) {
    if (spinning) return;
    var amount = Math.round(Number(betInput.value));
    if (!amount || amount <= 0) {
      BZG.ui.toast("Digite um valor de ficha válido.", "error");
      return;
    }
    if (totalStaked() + amount > BZG.storage.getBalance()) {
      BZG.ui.toast("Você não tem saldo para essa ficha.", "error");
      return;
    }
    bets[key] = (bets[key] || 0) + amount;
    BZG.sounds.click();
    renderChips();
  }

  function clearBets() {
    if (spinning) return;
    bets = {};
    renderChips();
    setStatus("Apostas limpas. Monte de novo e gire.");
    BZG.sounds.click();
  }

  function renderChips() {
    Array.prototype.forEach.call(boardEl.querySelectorAll("[data-bet]"), function (cell) {
      var existing = cell.querySelector(".chip");
      if (existing) existing.remove();
      cell.classList.remove("winner");
      var amount = bets[cell.dataset.bet];
      if (amount) {
        var chip = document.createElement("span");
        chip.className = "chip";
        chip.textContent = amount >= 1000 ? (amount / 1000).toFixed(amount % 1000 === 0 ? 0 : 1) + "k" : String(amount);
        cell.appendChild(chip);
      }
    });
    totalEl.textContent = BZG.ui.formatMoney(totalStaked());
  }

  /* ---------- Resultados anteriores ---------- */

  function renderResults() {
    var recent = BZG.storage.getRecent("roulette");
    resultsEl.innerHTML = recent.map(function (r) {
      return '<span class="roulette-dot roulette-dot--' + r.color + '">' + r.n + '</span>';
    }).join("");
  }

  function renderHistory() {
    var entries = BZG.storage.getHistory("roulette");
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

  /* ---------- Giro ---------- */

  function payoutFor(key, n) {
    var amount = bets[key];
    if (key === "n" + n) return amount * 36;
    if (key === "red" && colorOf(n) === "red") return amount * 2;
    if (key === "black" && colorOf(n) === "black") return amount * 2;
    if (key === "even" && n !== 0 && n % 2 === 0) return amount * 2;
    if (key === "odd" && n % 2 === 1) return amount * 2;
    if (key === "low" && n >= 1 && n <= 18) return amount * 2;
    if (key === "high" && n >= 19 && n <= 36) return amount * 2;
    if (key === "d1" && n >= 1 && n <= 12) return amount * 3;
    if (key === "d2" && n >= 13 && n <= 24) return amount * 3;
    if (key === "d3" && n >= 25 && n <= 36) return amount * 3;
    return 0;
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function spin() {
    if (spinning) return;
    var total = totalStaked();
    if (total <= 0) {
      BZG.ui.toast("Coloque pelo menos uma ficha na mesa.", "error");
      return;
    }
    if (total > BZG.storage.getBalance()) {
      BZG.ui.toast("Saldo insuficiente para essas apostas.", "error");
      return;
    }

    spinning = true;
    spinBtn.disabled = true;
    clearBtn.disabled = true;
    betInput.disabled = true;
    setStatus("A roleta está girando...");
    BZG.sounds.bet();

    var resultNumber = Math.floor(Math.random() * 37);
    var idx = WHEEL_ORDER.indexOf(resultNumber);
    var seg = (Math.PI * 2) / WHEEL_ORDER.length;
    // rotacao final: o segmento do resultado fica sob o ponteiro (topo)
    var targetRotation = wheelRotation + EXTRA_TURNS * Math.PI * 2 + ((Math.PI * 2) - (idx * seg)) - (wheelRotation % (Math.PI * 2));

    var startRotation = wheelRotation;
    var delta = targetRotation - startRotation;
    var start = performance.now();
    var lastSeg = -1;

    function frame(now) {
      var t = Math.min(1, (now - start) / SPIN_MS);
      wheelRotation = startRotation + delta * easeOutCubic(t);
      drawWheel(wheelRotation);

      var currentSeg = Math.floor(wheelRotation / seg);
      if (currentSeg !== lastSeg) {
        BZG.sounds.tick();
        lastSeg = currentSeg;
      }

      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        finishSpin(resultNumber, total);
      }
    }
    requestAnimationFrame(frame);
  }

  function finishSpin(n, total) {
    var totalReturn = 0;
    Object.keys(bets).forEach(function (key) {
      totalReturn += payoutFor(key, n);
    });
    totalReturn = Math.round(totalReturn);
    var won = totalReturn > 0;
    var color = colorOf(n);
    var colorLabel = color === "green" ? "verde" : (color === "red" ? "vermelho" : "preto");

    BZG.storage.recordBet("roulette", {
      bet: total,
      multiplier: won ? totalReturn / total : 0,
      payout: totalReturn,
      won: won,
      detail: n + " " + colorLabel
    });
    BZG.storage.pushRecent("roulette", { n: n, color: color });
    BZG.ui.refreshBalance();
    document.dispatchEvent(new CustomEvent("bzg:balance-changed"));
    renderResults();
    renderHistory();

    // destaca casas vencedoras na mesa
    Array.prototype.forEach.call(boardEl.querySelectorAll("[data-bet]"), function (cell) {
      var key = cell.dataset.bet;
      if (bets[key] && payoutFor(key, n) > 0) cell.classList.add("winner");
    });

    var profit = totalReturn - total;
    if (won && profit >= 0) {
      setStatus("Caiu " + n + " (" + colorLabel + ")! Você recebeu " + BZG.ui.formatMoney(totalReturn) + " (+" + BZG.ui.formatMoney(profit) + ").");
      BZG.ui.toast("Caiu " + n + "! +" + BZG.ui.formatMoney(totalReturn), "success");
      BZG.sounds.win();
      BZG.effects.flash(stageEl, "gold");
      var rect = stageEl.getBoundingClientRect();
      BZG.effects.confetti(rect.left + rect.width / 2, rect.top + rect.height / 2, totalReturn >= total * 10 ? 110 : 60);
    } else if (won) {
      setStatus("Caiu " + n + " (" + colorLabel + "). Você recuperou " + BZG.ui.formatMoney(totalReturn) + " de " + BZG.ui.formatMoney(total) + ".");
      BZG.ui.toast("Caiu " + n + ". Retorno parcial: " + BZG.ui.formatMoney(totalReturn), "info");
      BZG.sounds.click();
    } else {
      setStatus("Caiu " + n + " (" + colorLabel + "). Você perdeu " + BZG.ui.formatMoney(total) + ".");
      BZG.ui.toast("Caiu " + n + " (" + colorLabel + "). Não foi dessa vez.", "error");
      BZG.sounds.lose();
      BZG.effects.flash(stageEl, "red");
    }

    bets = {};
    spinning = false;
    spinBtn.disabled = false;
    clearBtn.disabled = false;
    betInput.disabled = false;
    totalEl.textContent = BZG.ui.formatMoney(0);

    // limpa fichas depois de um tempo para o jogador ver onde ganhou
    setTimeout(function () {
      if (!spinning) renderChips();
    }, 2500);
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
    clearBtn = document.getElementById("clear-btn");
    statusEl = document.getElementById("round-status");
    historyListEl = document.getElementById("history-list");
    boardEl = document.getElementById("roulette-board");
    totalEl = document.getElementById("total-staked");
    canvas = document.getElementById("wheel-canvas");
    ctx = canvas.getContext("2d");
    stageEl = document.getElementById("roulette-stage");
    resultsEl = document.getElementById("roulette-results");

    buildBoard();
    drawWheel(0);
    BZG.ui.refreshBalance();
    renderResults();
    renderHistory();

    spinBtn.addEventListener("click", spin);
    clearBtn.addEventListener("click", clearBets);
    document.addEventListener("bzg:theme-changed", function () { drawWheel(wheelRotation); });
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
