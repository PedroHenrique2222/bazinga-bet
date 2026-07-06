/* Bazinga BET - Crash com rodadas continuas (estilo Blaze): todo mundo joga a mesma rodada */
(function () {
  var HOUSE_EDGE = 0.04;
  var GROWTH_RATE = 0.18;
  var BETTING_MS = 7000;
  var CRASHED_PAUSE_MS = 3200;

  var betInput, autoCashoutInput, actionBtn, statusEl, multiplierEl, canvas, ctx,
      historyListEl, roundBetsEl, stageEl, countdownEl, countdownTimeEl, countdownFillEl, crashHistoryEl;

  var phase = "betting"; // "betting" | "running" | "crashed"
  var phaseStart = 0;
  var crashPoint = 1;
  var lastMultiplier = 1;
  var lastTickTime = 0;
  var lastBeepSecond = -1;

  var bots = [];
  var userBet = null;   // { amount, auto, status: "in"|"cashed"|"lost", cashMult, payout }
  var queuedBet = null; // aposta feita durante uma rodada, entra na proxima

  function formatMult(m) {
    return m.toFixed(2) + "x";
  }

  function setStatus(text) {
    statusEl.textContent = text;
  }

  function generateCrashPoint() {
    var r = Math.random();
    if (r < HOUSE_EDGE) return 1.00;
    var r2 = (r - HOUSE_EDGE) / (1 - HOUSE_EDGE);
    var point = 1 / (1 - r2);
    point = Math.floor(point * 100) / 100;
    return Math.max(1.00, Math.min(point, 500));
  }

  /* ---------- Historico de rodadas (bolinhas) ---------- */

  function chipClass(m) {
    if (m >= 10) return "crash-chip--high";
    if (m >= 2) return "crash-chip--mid";
    return "crash-chip--low";
  }

  function renderCrashHistory() {
    var recent = BZG.storage.getRecent("crash");
    crashHistoryEl.innerHTML = recent.map(function (m) {
      return '<span class="crash-chip ' + chipClass(m) + '">' + Number(m).toFixed(2) + 'x</span>';
    }).join("");
  }

  /* ---------- Lista de apostas da rodada ---------- */

  function renderRoundBets() {
    var rows = [];

    if (userBet) {
      var profile = BZG.storage.getProfile();
      rows.push(betRowHTML(profile.avatar, profile.nickname + " (você)", userBet.amount, userBet, true));
    }
    bots.forEach(function (b) {
      rows.push(betRowHTML(b.avatar, b.name, b.bet, b, false));
    });

    roundBetsEl.innerHTML = rows.join("") ||
      '<p style="color:var(--text-muted); font-size:13px;">Aguardando apostas...</p>';
  }

  function betRowHTML(avatar, name, amount, entry, isUser) {
    var cls = "bet-row";
    var result = "—";
    if (entry.status === "cashed") {
      cls += " cashed";
      result = formatMult(entry.cashMult) + " ✓";
    } else if (entry.status === "lost") {
      cls += " lost";
      result = "perdeu";
    } else {
      cls += " waiting";
      result = phase === "running" ? "em jogo..." : "aguardando";
    }
    if (isUser) cls += " is-user";
    return '<div class="' + cls + '">' +
      '<span class="avatar">' + avatar + '</span>' +
      '<span class="name">' + name + '</span>' +
      '<span class="bet-amount">' + BZG.ui.formatMoney(amount) + '</span>' +
      '<span class="result">' + result + '</span>' +
      '</div>';
  }

  /* ---------- Suas ultimas apostas ---------- */

  function renderHistory() {
    var entries = BZG.storage.getHistory("crash");
    historyListEl.innerHTML = entries.slice(0, 8).map(function (e) {
      var tagClass = e.won ? "tag--win" : "tag--lose";
      var tagText = e.won ? "GANHOU" : "PERDEU";
      return '<div class="history-row">' +
        '<span class="tag ' + tagClass + '">' + tagText + '</span>' +
        '<span>' + formatMult(e.multiplier) + '</span>' +
        '<span>' + BZG.ui.formatMoney(e.payout) + '</span>' +
        '</div>';
    }).join("") || '<p style="color:var(--text-muted); font-size:13px;">Nenhuma rodada ainda.</p>';
  }

  /* ---------- Grafico ---------- */

  function drawCurve(elapsedSec, mult) {
    var w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    var isDark = BZG.theme.get() === "dark";
    var gridColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
    var labelColor = isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)";

    var padding = 34;
    var maxT = Math.max(elapsedSec, 0.5);
    var maxM = Math.max(mult * 1.15, 1.6);

    // linhas de grade horizontais com rotulo de multiplicador
    ctx.strokeStyle = gridColor;
    ctx.fillStyle = labelColor;
    ctx.font = "11px Segoe UI, sans-serif";
    ctx.textAlign = "left";
    ctx.lineWidth = 1;
    var gridLines = 5;
    for (var g = 0; g <= gridLines; g++) {
      var gm = 1 + ((maxM - 1) * g) / gridLines;
      var gy = h - padding - ((gm - 1) / (maxM - 1)) * (h - padding * 1.6);
      ctx.beginPath();
      ctx.moveTo(padding, gy);
      ctx.lineTo(w - 8, gy);
      ctx.stroke();
      ctx.fillText(gm.toFixed(1) + "x", 4, gy + 3);
    }

    function toXY(t, m) {
      var x = padding + (t / maxT) * (w - padding * 1.4);
      var y = h - padding - ((m - 1) / (maxM - 1)) * (h - padding * 1.6);
      return [x, y];
    }

    if (elapsedSec <= 0.01) return;

    var steps = 70;

    // area preenchida sob a curva
    ctx.beginPath();
    for (var i = 0; i <= steps; i++) {
      var t = (i / steps) * elapsedSec;
      var m = Math.exp(GROWTH_RATE * t);
      var xy = toXY(t, m);
      if (i === 0) ctx.moveTo(xy[0], xy[1]);
      else ctx.lineTo(xy[0], xy[1]);
    }
    var tipXY = toXY(elapsedSec, mult);
    ctx.lineTo(tipXY[0], h - padding);
    ctx.lineTo(padding, h - padding);
    ctx.closePath();
    var fillGrad = ctx.createLinearGradient(0, 0, 0, h);
    fillGrad.addColorStop(0, "rgba(255, 45, 58, 0.3)");
    fillGrad.addColorStop(1, "rgba(255, 45, 58, 0.02)");
    ctx.fillStyle = fillGrad;
    ctx.fill();

    // linha da curva
    ctx.beginPath();
    for (var i2 = 0; i2 <= steps; i2++) {
      var t2 = (i2 / steps) * elapsedSec;
      var m2 = Math.exp(GROWTH_RATE * t2);
      var xy2 = toXY(t2, m2);
      if (i2 === 0) ctx.moveTo(xy2[0], xy2[1]);
      else ctx.lineTo(xy2[0], xy2[1]);
    }
    var grad = ctx.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0, "#ffcc00");
    grad.addColorStop(1, "#ff2d3a");
    ctx.strokeStyle = grad;
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.shadowColor = "rgba(255, 204, 0, 0.6)";
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // foguete na ponta
    ctx.font = "30px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.save();
    ctx.translate(tipXY[0], tipXY[1]);
    ctx.rotate(-0.5);
    ctx.fillText("🚀", 0, 0);
    ctx.restore();
  }

  /* ---------- Maquina de estados da rodada ---------- */

  function startBettingPhase() {
    phase = "betting";
    phaseStart = performance.now();
    lastBeepSecond = -1;
    bots = BZG.bots.crashRoundBots();
    userBet = null;

    multiplierEl.textContent = "1.00x";
    multiplierEl.classList.remove("crashed", "cashed", "tier-low", "tier-mid", "tier-high");
    countdownEl.classList.add("visible");
    actionBtn.disabled = false;
    actionBtn.textContent = "Apostar";
    actionBtn.className = "btn btn--primary";
    actionBtn.style.width = "100%";
    betInput.disabled = false;
    autoCashoutInput.disabled = false;
    setStatus("Faça sua aposta! A rodada começa em instantes.");
    drawCurve(0, 1);

    // se o jogador deixou uma aposta na fila durante a rodada anterior, entra agora
    if (queuedBet) {
      userBet = { amount: queuedBet.amount, auto: queuedBet.auto, status: "in" };
      queuedBet = null;
      actionBtn.textContent = "Aposta feita ✓";
      actionBtn.disabled = true;
      betInput.disabled = true;
      autoCashoutInput.disabled = true;
      setStatus("Aposta de " + BZG.ui.formatMoney(userBet.amount) + " entrou nesta rodada!");
      BZG.sounds.bet();
    }

    renderRoundBets();
  }

  function startRunningPhase() {
    phase = "running";
    phaseStart = performance.now();
    crashPoint = generateCrashPoint();
    lastMultiplier = 1;
    lastTickTime = phaseStart;

    countdownEl.classList.remove("visible");

    if (userBet) {
      betInput.disabled = true;
      autoCashoutInput.disabled = true;
      actionBtn.disabled = false;
      actionBtn.className = "btn btn--gold";
      setStatus("Voando! Clique em retirar antes que exploda.");
    } else {
      // sem aposta nesta rodada: pode deixar uma na fila para a proxima
      betInput.disabled = false;
      autoCashoutInput.disabled = false;
      actionBtn.disabled = false;
      actionBtn.className = "btn btn--primary";
      actionBtn.textContent = "Apostar na próxima";
      setStatus("Rodada em andamento. Sua aposta entra na próxima rodada.");
    }
    renderRoundBets();
  }

  function startCrashedPhase(finalMult) {
    phase = "crashed";
    phaseStart = performance.now();

    // resolve bots que nao retiraram
    bots.forEach(function (b) {
      if (b.status === "in") b.status = "lost";
    });

    // resolve o usuario se ainda estava em jogo
    if (userBet && userBet.status === "in") {
      userBet.status = "lost";
      BZG.storage.recordBet("crash", {
        bet: userBet.amount,
        multiplier: finalMult,
        payout: 0,
        won: false
      });
      BZG.ui.refreshBalance();
      document.dispatchEvent(new CustomEvent("bzg:balance-changed"));
      BZG.ui.toast("Explodiu em " + formatMult(finalMult) + "! Você perdeu a aposta.", "error");
      BZG.sounds.crashBoom();
      BZG.effects.shake(stageEl);
      BZG.effects.flash(stageEl, "red");
      renderHistory();
    } else {
      BZG.sounds.crashBoom();
      BZG.effects.flash(stageEl, "red");
    }

    BZG.storage.pushRecent("crash", finalMult);
    renderCrashHistory();

    multiplierEl.textContent = formatMult(finalMult);
    multiplierEl.classList.remove("tier-low", "tier-mid", "tier-high");
    multiplierEl.classList.add("crashed");
    actionBtn.disabled = true;
    actionBtn.textContent = "Explodiu!";
    setStatus("Caiu em " + formatMult(finalMult) + ". Próxima rodada em instantes.");
    renderRoundBets();
  }

  function updateMultiplierColor(mult) {
    multiplierEl.classList.remove("tier-low", "tier-mid", "tier-high");
    if (mult >= 3) multiplierEl.classList.add("tier-high");
    else if (mult >= 1.5) multiplierEl.classList.add("tier-mid");
    else multiplierEl.classList.add("tier-low");
  }

  function loop(now) {
    if (phase === "betting") {
      var remaining = Math.max(0, BETTING_MS - (now - phaseStart));
      var secs = remaining / 1000;
      countdownTimeEl.textContent = secs.toFixed(1) + "s";
      countdownFillEl.style.width = ((remaining / BETTING_MS) * 100) + "%";

      var whole = Math.ceil(secs);
      if (whole <= 3 && whole !== lastBeepSecond && whole > 0) {
        BZG.sounds.countdownBeep();
        lastBeepSecond = whole;
      }

      if (remaining <= 0) startRunningPhase();
    } else if (phase === "running") {
      var elapsedSec = (now - phaseStart) / 1000;
      var mult = Math.exp(GROWTH_RATE * elapsedSec);

      if (mult >= crashPoint) {
        drawCurve(Math.log(crashPoint) / GROWTH_RATE, crashPoint);
        startCrashedPhase(crashPoint);
      } else {
        lastMultiplier = mult;
        multiplierEl.textContent = formatMult(mult);
        updateMultiplierColor(mult);
        drawCurve(elapsedSec, mult);

        // bots retiram ao atingir o alvo
        var changed = false;
        bots.forEach(function (b) {
          if (b.status === "in" && mult >= b.target) {
            b.status = "cashed";
            b.cashMult = b.target;
            changed = true;
          }
        });

        // retirada automatica do usuario
        if (userBet && userBet.status === "in") {
          var autoTarget = userBet.auto;
          if (autoTarget && mult >= autoTarget) {
            doCashOut(autoTarget);
            changed = true;
          } else {
            actionBtn.textContent = "Retirar " + BZG.ui.formatMoney(userBet.amount * mult);
          }
        }

        if (changed) renderRoundBets();

        if (now - lastTickTime > 180) {
          BZG.sounds.tick();
          lastTickTime = now;
        }
      }
    } else if (phase === "crashed") {
      if (now - phaseStart >= CRASHED_PAUSE_MS) startBettingPhase();
    }

    requestAnimationFrame(loop);
  }

  /* ---------- Acoes do usuario ---------- */

  function placeBet() {
    var amount = Math.round(Number(betInput.value));
    var balance = BZG.storage.getBalance();

    if (!amount || amount <= 0) {
      BZG.ui.toast("Digite um valor de aposta válido.", "error");
      return;
    }
    if (amount > balance) {
      BZG.ui.toast("Você não tem saldo suficiente.", "error");
      return;
    }

    var auto = Number(autoCashoutInput.value);
    userBet = {
      amount: amount,
      auto: auto && auto > 1 ? auto : null,
      status: "in"
    };

    actionBtn.textContent = "Aposta feita ✓";
    actionBtn.disabled = true;
    betInput.disabled = true;
    autoCashoutInput.disabled = true;
    setStatus("Aposta de " + BZG.ui.formatMoney(amount) + " confirmada. Aguarde a rodada começar.");
    BZG.sounds.bet();
    renderRoundBets();
  }

  function doCashOut(mult) {
    if (!userBet || userBet.status !== "in" || phase !== "running") return;

    var payout = Math.round(userBet.amount * mult);
    userBet.status = "cashed";
    userBet.cashMult = mult;
    userBet.payout = payout;

    BZG.storage.recordBet("crash", {
      bet: userBet.amount,
      multiplier: mult,
      payout: payout,
      won: true
    });
    BZG.ui.refreshBalance();
    document.dispatchEvent(new CustomEvent("bzg:balance-changed"));
    renderHistory();
    renderRoundBets();

    multiplierEl.classList.add("cashed");
    actionBtn.disabled = true;
    actionBtn.textContent = "Retirou em " + formatMult(mult);
    setStatus("Você retirou em " + formatMult(mult) + " e ganhou " + BZG.ui.formatMoney(payout) + "!");
    BZG.ui.toast("Retirou em " + formatMult(mult) + "! +" + BZG.ui.formatMoney(payout), "success");
    BZG.sounds.win();
    BZG.effects.flash(stageEl, "gold");
    var rect = multiplierEl.getBoundingClientRect();
    BZG.effects.confetti(rect.left + rect.width / 2, rect.top + rect.height / 2, 70);
  }

  function queueBet() {
    var amount = Math.round(Number(betInput.value));
    var balance = BZG.storage.getBalance();

    if (!amount || amount <= 0) {
      BZG.ui.toast("Digite um valor de aposta válido.", "error");
      return;
    }
    if (amount > balance) {
      BZG.ui.toast("Você não tem saldo suficiente.", "error");
      return;
    }

    var auto = Number(autoCashoutInput.value);
    queuedBet = {
      amount: amount,
      auto: auto && auto > 1 ? auto : null
    };

    actionBtn.textContent = "Na fila para a próxima ✓";
    actionBtn.disabled = true;
    betInput.disabled = true;
    autoCashoutInput.disabled = true;
    setStatus("Aposta de " + BZG.ui.formatMoney(amount) + " na fila. Entra na próxima rodada.");
    BZG.sounds.click();
  }

  function onActionClick() {
    if (phase === "betting" && !userBet) {
      placeBet();
    } else if (phase === "running" && userBet && userBet.status === "in") {
      doCashOut(lastMultiplier);
    } else if (phase === "running" && !userBet && !queuedBet) {
      queueBet();
    }
  }

  function quickBet(fn) {
    var current = Number(betInput.value) || 0;
    var balance = BZG.storage.getBalance();
    var next = fn(current, balance);
    betInput.value = Math.max(1, Math.round(next));
  }

  document.addEventListener("DOMContentLoaded", function () {
    betInput = document.getElementById("bet-amount");
    autoCashoutInput = document.getElementById("auto-cashout");
    actionBtn = document.getElementById("action-btn");
    statusEl = document.getElementById("round-status");
    multiplierEl = document.getElementById("multiplier-display");
    canvas = document.getElementById("crash-canvas");
    ctx = canvas.getContext("2d");
    historyListEl = document.getElementById("history-list");
    roundBetsEl = document.getElementById("round-bets");
    stageEl = document.getElementById("crash-stage");
    countdownEl = document.getElementById("round-countdown");
    countdownTimeEl = document.getElementById("countdown-time");
    countdownFillEl = document.getElementById("countdown-fill");
    crashHistoryEl = document.getElementById("crash-history");

    BZG.ui.refreshBalance();
    renderHistory();
    renderCrashHistory();

    actionBtn.addEventListener("click", onActionClick);
    document.getElementById("bet-half").addEventListener("click", function () {
      quickBet(function (v) { return v / 2; });
    });
    document.getElementById("bet-double").addEventListener("click", function () {
      quickBet(function (v) { return v * 2; });
    });
    document.getElementById("bet-max").addEventListener("click", function () {
      quickBet(function (v, balance) { return balance; });
    });

    startBettingPhase();
    requestAnimationFrame(loop);
  });
})();
