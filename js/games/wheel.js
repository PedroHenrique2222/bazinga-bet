/* Bazinga BET - Roda da Sorte: roda com segmentos multiplicadores */
(function () {
  var SPIN_MS = 4200;

  /* segmentos (iguais em tamanho); a media de cada conjunto define o RTP (~0.95) */
  var SEGMENTS = {
    low: [1.2, 0, 1.5, 1.7, 0, 1.2, 2, 0, 1.5, 1.2, 0, 1.7, 1.5, 0, 1.7, 0],
    medium: [5, 0, 2, 0, 1.5, 0, 1.5, 0, 2, 0, 1.2, 0, 1, 0, 1, 0],
    high: [15, 0, 0, 0, 0, 2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  };

  var betInput, spinBtn, statusEl, historyListEl, canvas, ctx, resultEl, stageEl, riskButtons;
  var risk = "low";
  var spinning = false;
  var rotation = 0;

  function setStatus(t) { statusEl.textContent = t; }
  function segs() { return SEGMENTS[risk]; }

  function segColor(mult) {
    if (mult === 0) return "#3a3a44";
    if (mult >= 15) return "#ff2d3a";
    if (mult >= 5) return "#ff8a00";
    if (mult >= 2) return "#ffcc00";
    return "#2ecc71";
  }

  function drawWheel() {
    var arr = segs();
    var n = arr.length;
    var seg = (Math.PI * 2) / n;
    var w = canvas.width, cx = w / 2, cy = w / 2, R = w / 2 - 6;
    ctx.clearRect(0, 0, w, w);

    for (var i = 0; i < n; i++) {
      var a0 = -Math.PI / 2 + i * seg + rotation;
      var a1 = a0 + seg;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, R, a0, a1);
      ctx.closePath();
      ctx.fillStyle = segColor(arr[i]);
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.25)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // rotulo
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(a0 + seg / 2);
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillStyle = arr[i] === 0 ? "#f2f2f5" : "#1a1200";
      ctx.font = "bold 15px Inter, sans-serif";
      ctx.fillText(arr[i] + "x", R - 12, 0);
      ctx.restore();
    }

    // aro externo
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255, 204, 0, 0.7)";
    ctx.lineWidth = 5;
    ctx.stroke();
  }

  function renderHistory() {
    var entries = BZG.storage.getHistory("wheel");
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

  function selectRisk(r) {
    if (spinning) return;
    risk = r;
    riskButtons.forEach(function (b) { b.classList.toggle("active", b.dataset.risk === r); });
    rotation = 0;
    drawWheel();
  }

  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

  function spin() {
    if (spinning) return;
    var bet = Math.round(Number(betInput.value));
    var balance = BZG.storage.getBalance();
    if (!bet || bet <= 0) { BZG.ui.toast("Digite um valor de aposta válido.", "error"); return; }
    if (bet > balance) { BZG.ui.toast("Você não tem saldo suficiente.", "error"); return; }

    spinning = true;
    betInput.disabled = true;
    spinBtn.disabled = true;
    riskButtons.forEach(function (b) { b.disabled = true; });
    resultEl.className = "wheel-result";
    resultEl.textContent = "Girando...";
    setStatus("A roda está girando...");
    BZG.sounds.bet();

    var arr = segs();
    var n = arr.length;
    var seg = (Math.PI * 2) / n;
    var targetIdx = Math.floor(Math.random() * n);
    // rotacao para o centro do segmento alvo parar sob o ponteiro (topo)
    var base = -(targetIdx + 0.5) * seg;
    var startRotation = rotation % (Math.PI * 2);
    var finalRotation = base - (8 * Math.PI * 2); // 8 voltas para tras (visual gira "para frente")
    var start = performance.now();
    var lastTick = 0;

    function frame(now) {
      var t = Math.min(1, (now - start) / (SPIN_MS * BZG.modes.speed()));
      var eased = easeOutCubic(t);
      rotation = startRotation + (finalRotation - startRotation) * eased;
      drawWheel();

      var tickPos = Math.floor((rotation / seg));
      if (tickPos !== lastTick) { BZG.sounds.wheelTick(); lastTick = tickPos; }

      if (t < 1) requestAnimationFrame(frame);
      else finish(targetIdx, arr[targetIdx], bet);
    }
    requestAnimationFrame(frame);
  }

  function finish(idx, mult, bet) {
    var payout = Math.round(bet * mult);
    var won = mult >= 1;

    BZG.storage.recordBet("wheel", {
      bet: bet, multiplier: mult, payout: payout, won: won, detail: mult + "x"
    });
    BZG.ui.refreshBalance();
    document.dispatchEvent(new CustomEvent("bzg:balance-changed"));
    renderHistory();

    if (mult >= 1) {
      resultEl.className = "wheel-result win";
      resultEl.textContent = mult + "x — +" + BZG.ui.formatMoney(payout);
      setStatus("Parou em " + mult + "x! Você ganhou " + BZG.ui.formatMoney(payout) + ".");
      BZG.ui.toast("Parou em " + mult + "x! +" + BZG.ui.formatMoney(payout), "success");
      BZG.sounds.win();
      BZG.effects.flash(stageEl, "gold");
      var r = stageEl.getBoundingClientRect();
      BZG.effects.confetti(r.left + r.width / 2, r.top + r.height / 2, mult >= 10 ? 100 : 55);
      if (payout >= 25000 || mult >= 25) BZG.effects.bigWin(payout, mult);
    } else {
      resultEl.className = "wheel-result lose";
      resultEl.textContent = "0x — não foi dessa vez";
      setStatus("Parou em 0x. Você perdeu " + BZG.ui.formatMoney(bet) + ".");
      BZG.sounds.lose();
      BZG.effects.flash(stageEl, "red");
    }

    spinning = false;
    betInput.disabled = false;
    spinBtn.disabled = false;
    riskButtons.forEach(function (b) { b.disabled = false; });
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
    canvas = document.getElementById("wheel-canvas");
    ctx = canvas.getContext("2d");
    resultEl = document.getElementById("wheel-result");
    stageEl = document.getElementById("wheel-stage");
    riskButtons = Array.prototype.slice.call(document.querySelectorAll(".risk-options .btn"));

    BZG.ui.refreshBalance();
    renderHistory();
    drawWheel();

    spinBtn.addEventListener("click", spin);
    riskButtons.forEach(function (b) {
      b.addEventListener("click", function () { selectRisk(b.dataset.risk); });
    });
    document.getElementById("bet-half").addEventListener("click", function () { quickBet(function (v) { return v / 2; }); });
    document.getElementById("bet-double").addEventListener("click", function () { quickBet(function (v) { return v * 2; }); });
    document.getElementById("bet-max").addEventListener("click", function () { quickBet(function (v, b) { return b; }); });
  });
})();
