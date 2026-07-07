/* Bazinga BET - Raspadinha com raspagem REAL: cada campo tem uma camada de
   "tinta" em canvas que voce raspa com o mouse ou o dedo (pointer events). */
(function () {
  /* premios: simbolo, multiplicador e probabilidade da cartela (RTP ~90%) */
  var PRIZES = [
    { sym: "🎃", mult: 2, prob: 0.14 },
    { sym: "🥒", mult: 3, prob: 0.07 },
    { sym: "🔋", mult: 5, prob: 0.028 },
    { sym: "🍰", mult: 10, prob: 0.010 },
    { sym: "🍑", mult: 20, prob: 0.0045 },
    { sym: "⚡", mult: 50, prob: 0.0016 }
  ];
  var ALL_SYMS = PRIZES.map(function (p) { return p.sym; });
  var REVEAL_RATIO = 0.55;   // % raspado para revelar a celula

  var betInput, buyBtn, revealAllBtn, statusEl, historyListEl, cardEl, resultEl, stageEl;
  var cells = [];
  var revealed = [];
  var canvases = [];         // { canvas, ctx, size, strokes }
  var current = null;
  var resolved = true;
  var scratching = false;
  var lastScratchSound = 0;

  function setStatus(t) { statusEl.textContent = t; }

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  function randSym() { return ALL_SYMS[Math.floor(Math.random() * ALL_SYMS.length)]; }

  function buildCells(prize) {
    var arr = new Array(9);
    var counts = {};
    function add(idx, sym) { arr[idx] = sym; counts[sym] = (counts[sym] || 0) + 1; }
    var order = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8]);
    var pos = 0;
    if (prize) {
      for (var k = 0; k < 3; k++) add(order[pos++], prize.sym);
    }
    while (pos < 9) {
      var idx = order[pos];
      var sym, tries = 0;
      do { sym = randSym(); tries++; }
      while (tries < 30 && ((counts[sym] || 0) >= 2 || (prize && sym === prize.sym)));
      add(idx, sym);
      pos++;
    }
    return arr;
  }

  function decidePrize() {
    var r = Math.random(), cum = 0;
    for (var i = 0; i < PRIZES.length; i++) {
      cum += PRIZES[i].prob;
      if (r < cum) return PRIZES[i];
    }
    return null;
  }

  /* ---------- camada de tinta raspavel ---------- */

  function paintCover(ctx, size) {
    // dourado com listras diagonais e um "?" no centro
    var grad = ctx.createLinearGradient(0, 0, size, size);
    grad.addColorStop(0, "#d9ab13");
    grad.addColorStop(0.5, "#c69208");
    grad.addColorStop(1, "#b8860b");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    ctx.strokeStyle = "rgba(255, 230, 150, 0.35)";
    ctx.lineWidth = 5;
    for (var x = -size; x < size * 2; x += 16) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + size, size);
      ctx.stroke();
    }

    ctx.fillStyle = "rgba(90, 60, 0, 0.65)";
    ctx.font = "bold " + Math.round(size * 0.4) + "px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("?", size / 2, size / 2 + 2);
  }

  function setupCanvases() {
    canvases = [];
    var cellEls = cardEl.querySelectorAll(".rasp-cell");
    Array.prototype.forEach.call(cellEls, function (cellEl, i) {
      var canvas = cellEl.querySelector(".rasp-canvas");
      var size = Math.max(40, Math.round(cellEl.clientWidth));
      canvas.width = size;
      canvas.height = size;
      var ctx = canvas.getContext("2d");
      paintCover(ctx, size);
      canvases[i] = { canvas: canvas, ctx: ctx, size: size, strokes: 0 };
    });
  }

  function scratchAt(clientX, clientY) {
    for (var i = 0; i < 9; i++) {
      if (revealed[i] || !canvases[i]) continue;
      var c = canvases[i];
      var rect = c.canvas.getBoundingClientRect();
      var pad = 18;
      if (clientX < rect.left - pad || clientX > rect.right + pad ||
          clientY < rect.top - pad || clientY > rect.bottom + pad) continue;

      // coordenadas locais (canvas pode estar redimensionado pelo CSS)
      var scaleX = c.size / rect.width;
      var scaleY = c.size / rect.height;
      var x = (clientX - rect.left) * scaleX;
      var y = (clientY - rect.top) * scaleY;

      c.ctx.globalCompositeOperation = "destination-out";
      c.ctx.beginPath();
      c.ctx.arc(x, y, c.size * 0.15, 0, Math.PI * 2);
      c.ctx.fill();
      c.strokes++;

      var now = performance.now();
      if (now - lastScratchSound > 90) { BZG.sounds.scratch(); lastScratchSound = now; }

      // a cada poucas raspadas, mede quanto ja foi removido
      if (c.strokes % 6 === 0 && scratchedRatio(c) > REVEAL_RATIO) {
        revealCell(i);
      }
    }
  }

  function scratchedRatio(c) {
    var step = Math.max(4, Math.floor(c.size / 16));
    var data = c.ctx.getImageData(0, 0, c.size, c.size).data;
    var clear = 0, total = 0;
    for (var y = 0; y < c.size; y += step) {
      for (var x = 0; x < c.size; x += step) {
        total++;
        if (data[(y * c.size + x) * 4 + 3] < 40) clear++;
      }
    }
    return total ? clear / total : 0;
  }

  function revealCell(i) {
    if (revealed[i]) return;
    revealed[i] = true;
    var cellEl = cardEl.querySelector('.rasp-cell[data-i="' + i + '"]');
    if (cellEl) cellEl.classList.add("revealed");
    if (revealed.every(Boolean)) resolve();
  }

  /* ---------- render ---------- */

  function renderCard() {
    cardEl.innerHTML = cells.map(function (sym, i) {
      return '<div class="rasp-cell" data-i="' + i + '">' +
        '<span class="rasp-sym">' + sym + '</span>' +
        '<canvas class="rasp-canvas"></canvas>' +
      '</div>';
    }).join("");
    // espera o layout para medir o tamanho real das celulas
    requestAnimationFrame(setupCanvases);
  }

  function renderEmpty() {
    cardEl.innerHTML = "";
    for (var i = 0; i < 9; i++) {
      cardEl.innerHTML += '<div class="rasp-cell rasp-empty"><span class="rasp-sym">❔</span></div>';
    }
  }

  function renderHistory() {
    var entries = BZG.storage.getHistory("raspadinha");
    historyListEl.innerHTML = entries.slice(0, 8).map(function (e) {
      var tagClass = e.won ? "tag--win" : "tag--lose";
      var tagText = e.won ? "GANHOU" : "PERDEU";
      return '<div class="history-row">' +
        '<span class="tag ' + tagClass + '">' + tagText + '</span>' +
        '<span>' + (e.detail || "") + '</span>' +
        '<span>' + BZG.ui.formatMoney(e.payout) + '</span>' +
        '</div>';
    }).join("") || '<p style="color:var(--text-muted); font-size:13px;">Nenhuma cartela ainda.</p>';
  }

  function revealAll() {
    if (resolved) return;
    for (var i = 0; i < 9; i++) {
      if (!revealed[i]) {
        revealed[i] = true;
        var cellEl = cardEl.querySelector('.rasp-cell[data-i="' + i + '"]');
        if (cellEl) cellEl.classList.add("revealed");
      }
    }
    BZG.sounds.scratch();
    resolve();
  }

  function resolve() {
    if (resolved) return;
    resolved = true;
    revealAllBtn.style.display = "none";
    buyBtn.disabled = false;
    betInput.disabled = false;

    var prize = current.prize;
    var bet = current.bet;
    var mult = prize ? prize.mult : 0;
    var payout = Math.round(bet * mult);
    var won = mult > 0;

    if (prize) {
      cells.forEach(function (sym, i) {
        if (sym === prize.sym) {
          var c = cardEl.querySelector('.rasp-cell[data-i="' + i + '"]');
          if (c) c.classList.add("win-cell");
        }
      });
    }

    BZG.storage.recordBet("raspadinha", {
      bet: bet, multiplier: mult, payout: payout, won: won,
      alreadyDebited: true,
      detail: prize ? (prize.sym + prize.sym + prize.sym + " " + mult + "x") : "sem prêmio"
    });
    BZG.ui.refreshBalance();
    document.dispatchEvent(new CustomEvent("bzg:balance-changed"));
    renderHistory();

    if (won) {
      resultEl.className = "rasp-result win";
      resultEl.textContent = "🎉 " + mult + "x! +" + BZG.ui.formatMoney(payout);
      setStatus("Você achou 3 " + prize.sym + " e ganhou " + BZG.ui.formatMoney(payout) + "!");
      BZG.ui.toast("Raspadinha premiada! +" + BZG.ui.formatMoney(payout), "success");
      BZG.sounds.win();
      BZG.effects.flash(stageEl, "gold");
      var r = stageEl.getBoundingClientRect();
      BZG.effects.confetti(r.left + r.width / 2, r.top + r.height / 2, mult >= 20 ? 100 : 55);
      if (payout >= 25000 || mult >= 50) BZG.effects.bigWin(payout, mult);
    } else {
      resultEl.className = "rasp-result lose";
      resultEl.textContent = "Sem prêmio dessa vez.";
      setStatus("Não deu 3 iguais. Tente outra cartela!");
      BZG.sounds.lose();
    }
  }

  function buy() {
    if (!resolved) return;
    var bet = Math.round(Number(betInput.value));
    var balance = BZG.storage.getBalance();
    if (!bet || bet <= 0) { BZG.ui.toast("Digite um valor válido.", "error"); return; }
    if (bet > balance) { BZG.ui.toast("Você não tem saldo suficiente.", "error"); return; }

    BZG.storage.adjustBalance(-bet);
    BZG.ui.refreshBalance();
    document.dispatchEvent(new CustomEvent("bzg:balance-changed"));
    BZG.sounds.bet();

    var prize = decidePrize();
    current = { bet: bet, prize: prize };
    cells = buildCells(prize);
    revealed = new Array(9).fill(false);
    resolved = false;

    renderCard();
    resultEl.className = "rasp-result";
    resultEl.textContent = "Raspe com o dedo ou o mouse!";
    setStatus("Segure e arraste sobre os campos para raspar a tinta dourada.");
    buyBtn.disabled = true;
    betInput.disabled = true;
    revealAllBtn.style.display = "block";
  }

  function quickBet(fn) {
    if (!resolved) return;
    var v = Number(betInput.value) || 0;
    betInput.value = Math.max(1, Math.round(fn(v, BZG.storage.getBalance())));
  }

  document.addEventListener("DOMContentLoaded", function () {
    betInput = document.getElementById("bet-amount");
    buyBtn = document.getElementById("buy-btn");
    revealAllBtn = document.getElementById("reveal-all-btn");
    statusEl = document.getElementById("round-status");
    historyListEl = document.getElementById("history-list");
    cardEl = document.getElementById("rasp-card");
    resultEl = document.getElementById("rasp-result");
    stageEl = document.getElementById("rasp-stage");

    BZG.ui.refreshBalance();
    renderHistory();
    renderEmpty();

    /* raspagem: pointer events cobrem mouse, toque e caneta */
    cardEl.addEventListener("pointerdown", function (e) {
      if (resolved) return;
      scratching = true;
      scratchAt(e.clientX, e.clientY);
      e.preventDefault();
    });
    document.addEventListener("pointermove", function (e) {
      if (!scratching || resolved) return;
      scratchAt(e.clientX, e.clientY);
      e.preventDefault();
    });
    document.addEventListener("pointerup", function () { scratching = false; });
    document.addEventListener("pointercancel", function () { scratching = false; });

    buyBtn.addEventListener("click", buy);
    revealAllBtn.addEventListener("click", revealAll);
    document.getElementById("bet-half").addEventListener("click", function () { quickBet(function (v) { return v / 2; }); });
    document.getElementById("bet-double").addEventListener("click", function () { quickBet(function (v) { return v * 2; }); });
    document.getElementById("bet-max").addEventListener("click", function () { quickBet(function (v, b) { return b; }); });
  });
})();
