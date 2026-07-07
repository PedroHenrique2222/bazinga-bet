/* Bazinga BET - Limbo: sorteia um multiplicador; se >= alvo, paga o alvo */
(function () {
  var RTP = 0.99;          // vantagem da casa de 1%
  var ROLL_MS = 900;

  var betInput, targetInput, rollBtn, statusEl, historyListEl,
      resultEl, targetLabelEl, recentEl, stageEl, winChanceEl, winPayoutEl;
  var rolling = false;

  function setStatus(t) { statusEl.textContent = t; }
  function fmtMult(m) { return m.toFixed(2) + "x"; }

  function clampTarget() {
    var t = Number(targetInput.value);
    if (!t || t < 1.01) t = 1.01;
    if (t > 1000) t = 1000;
    return Math.floor(t * 100) / 100;
  }

  /* sorteia o multiplicador: P(result >= x) = RTP / x  */
  function rollMultiplier() {
    var u = Math.random();
    if (u < 1e-9) u = 1e-9;
    var m = RTP / u;
    return Math.max(1.00, Math.floor(m * 100) / 100);
  }

  function updateInfo() {
    var t = clampTarget();
    var chance = Math.min(100, (RTP / t) * 100);
    winChanceEl.textContent = chance.toFixed(2) + "%";
    var bet = Math.round(Number(betInput.value)) || 0;
    winPayoutEl.textContent = BZG.ui.formatMoney(Math.round(bet * t));
    targetLabelEl.textContent = "Alvo: " + fmtMult(t);
  }

  function renderRecent() {
    var entries = BZG.storage.getHistory("limbo");
    recentEl.innerHTML = entries.slice(0, 12).map(function (e) {
      var cls = e.won ? "limbo-chip--win" : "limbo-chip--lose";
      // detail guarda o multiplicador sorteado
      return '<span class="limbo-chip ' + cls + '">' + (e.detail || "") + '</span>';
    }).join("");
  }

  function renderHistory() {
    var entries = BZG.storage.getHistory("limbo");
    historyListEl.innerHTML = entries.slice(0, 8).map(function (e) {
      var tagClass = e.won ? "tag--win" : "tag--lose";
      var tagText = e.won ? "GANHOU" : "PERDEU";
      return '<div class="history-row">' +
        '<span class="tag ' + tagClass + '">' + tagText + '</span>' +
        '<span>saiu ' + (e.detail || "") + '</span>' +
        '<span>' + BZG.ui.formatMoney(e.payout) + '</span>' +
        '</div>';
    }).join("") || '<p style="color:var(--text-muted); font-size:13px;">Nenhuma rodada ainda.</p>';
  }

  function roll() {
    if (rolling) return;
    var bet = Math.round(Number(betInput.value));
    var balance = BZG.storage.getBalance();
    var target = clampTarget();
    targetInput.value = target.toFixed(2);

    if (!bet || bet <= 0) { BZG.ui.toast("Digite um valor de aposta válido.", "error"); return; }
    if (bet > balance) { BZG.ui.toast("Você não tem saldo suficiente.", "error"); return; }

    rolling = true;
    betInput.disabled = true;
    targetInput.disabled = true;
    rollBtn.disabled = true;
    resultEl.className = "limbo-result rolling";
    setStatus("Sorteando...");
    BZG.sounds.bet();

    var finalMult = rollMultiplier();
    var start = performance.now();
    var lastTick = 0;

    function frame(now) {
      var t = Math.min(1, (now - start) / ROLL_MS);
      if (t < 1) {
        // numeros subindo rapidamente durante a animacao
        var fake = 1 + Math.pow(now % 1000 / 1000, 2) * 8 * Math.random();
        resultEl.textContent = fmtMult(Math.max(1, fake));
        if (now - lastTick > 60) { BZG.sounds.tick(); lastTick = now; }
        requestAnimationFrame(frame);
      } else {
        finish(finalMult, target, bet);
      }
    }
    requestAnimationFrame(frame);
  }

  function finish(mult, target, bet) {
    var won = mult >= target;
    var payout = won ? Math.round(bet * target) : 0;

    resultEl.textContent = fmtMult(mult);
    resultEl.className = "limbo-result " + (won ? "win" : "lose");

    BZG.storage.recordBet("limbo", {
      bet: bet, multiplier: won ? target : 0, payout: payout, won: won, detail: fmtMult(mult)
    });
    BZG.ui.refreshBalance();
    document.dispatchEvent(new CustomEvent("bzg:balance-changed"));
    renderHistory();
    renderRecent();

    if (won) {
      setStatus("Saiu " + fmtMult(mult) + " (>= " + fmtMult(target) + ")! +" + BZG.ui.formatMoney(payout));
      BZG.ui.toast("Saiu " + fmtMult(mult) + "! +" + BZG.ui.formatMoney(payout), "success");
      BZG.sounds.win();
      BZG.effects.flash(stageEl, "gold");
      var r = stageEl.getBoundingClientRect();
      BZG.effects.confetti(r.left + r.width / 2, r.top + r.height / 2, target >= 10 ? 90 : 50);
      if (payout >= 25000 || target >= 25) BZG.effects.bigWin(payout, target);
    } else {
      setStatus("Saiu " + fmtMult(mult) + ". Precisava de " + fmtMult(target) + ".");
      BZG.sounds.lose();
      BZG.effects.flash(stageEl, "red");
    }

    rolling = false;
    betInput.disabled = false;
    targetInput.disabled = false;
    rollBtn.disabled = false;
  }

  function quickBet(fn) {
    var current = Number(betInput.value) || 0;
    betInput.value = Math.max(1, Math.round(fn(current, BZG.storage.getBalance())));
    updateInfo();
  }

  document.addEventListener("DOMContentLoaded", function () {
    betInput = document.getElementById("bet-amount");
    targetInput = document.getElementById("target-input");
    rollBtn = document.getElementById("roll-btn");
    statusEl = document.getElementById("round-status");
    historyListEl = document.getElementById("history-list");
    resultEl = document.getElementById("limbo-result");
    targetLabelEl = document.getElementById("limbo-target-label");
    recentEl = document.getElementById("limbo-recent");
    stageEl = document.getElementById("limbo-stage");
    winChanceEl = document.getElementById("win-chance");
    winPayoutEl = document.getElementById("win-payout");

    BZG.ui.refreshBalance();
    renderHistory();
    renderRecent();
    updateInfo();

    rollBtn.addEventListener("click", roll);
    targetInput.addEventListener("input", updateInfo);
    betInput.addEventListener("input", updateInfo);
    document.getElementById("bet-half").addEventListener("click", function () { quickBet(function (v) { return v / 2; }); });
    document.getElementById("bet-double").addEventListener("click", function () { quickBet(function (v) { return v * 2; }); });
    document.getElementById("bet-max").addEventListener("click", function () { quickBet(function (v, b) { return b; }); });
  });
})();
