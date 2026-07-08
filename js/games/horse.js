/* Bazinga BET - Corrida de Cavalos da equipe BZG.
   Odds derivadas da probabilidade de vitoria: payout*P = 0.94 -> RTP 94% em qualquer pick. */
(function () {
  var EDGE = 0.94;

  /* cada corredor: nome, emoji e probabilidade de vitoria (soma = 1) */
  var HORSES = [
    { name: "BZG Abóbora", emoji: "🎃", p: 0.30 },
    { name: "BZG Pikles", emoji: "🥒", p: 0.24 },
    { name: "BZG 616", emoji: "🔢", p: 0.18 },
    { name: "BZG Panetone", emoji: "🍞", p: 0.13 },
    { name: "BZG Pilha", emoji: "🔋", p: 0.09 },
    { name: "BZG Bogão", emoji: "🍑", p: 0.06 }
  ];
  HORSES.forEach(function (h) { h.odds = Math.round((EDGE / h.p) * 100) / 100; });

  var betInput, raceBtn, statusEl, historyListEl, picksEl, trackEl, stageEl;
  var selected = -1;
  var racing = false;
  var laneEls = [], runnerEls = [];

  function setStatus(t) { statusEl.textContent = t; }
  function spd(ms) { return ms * BZG.modes.speed(); }

  function renderPicks() {
    picksEl.innerHTML = HORSES.map(function (h, i) {
      return '<button class="horse-pick' + (i === selected ? " selected" : "") + '" data-i="' + i + '">' +
        '<span class="emoji">' + h.emoji + '</span>' +
        '<span class="name">' + h.name + '</span>' +
        '<span class="odds">' + h.odds.toFixed(2) + 'x</span>' +
      '</button>';
    }).join("");
    Array.prototype.forEach.call(picksEl.children, function (btn) {
      btn.addEventListener("click", function () {
        if (racing) return;
        selected = Number(btn.dataset.i);
        renderPicks();
        markMine();
        BZG.sounds.click();
      });
    });
  }

  function buildTrack() {
    trackEl.innerHTML = HORSES.map(function (h, i) {
      return '<div class="lane" data-i="' + i + '">' +
        '<div class="lane-finish"></div>' +
        '<div class="runner"><span>🏇</span><span class="tag">' + h.emoji + '</span></div>' +
      '</div>';
    }).join("");
    laneEls = Array.prototype.slice.call(trackEl.querySelectorAll(".lane"));
    runnerEls = Array.prototype.slice.call(trackEl.querySelectorAll(".runner"));
    setPositions(HORSES.map(function () { return 0; }));
    markMine();
  }

  function markMine() {
    laneEls.forEach(function (l, i) {
      l.classList.toggle("mine", i === selected);
      l.classList.remove("winner");
    });
  }

  function setPositions(progs) {
    for (var i = 0; i < runnerEls.length; i++) {
      var lane = laneEls[i];
      var travel = lane.clientWidth - 52; // largura util
      runnerEls[i].style.transform = "translateX(" + (progs[i] * travel) + "px)";
    }
  }

  function renderHistory() {
    var entries = BZG.storage.getHistory("horse");
    historyListEl.innerHTML = entries.slice(0, 8).map(function (e) {
      var tagClass = e.won ? "tag--win" : "tag--lose";
      var tagText = e.won ? "GANHOU" : "PERDEU";
      return '<div class="history-row">' +
        '<span class="tag ' + tagClass + '">' + tagText + '</span>' +
        '<span>' + (e.detail || "") + '</span>' +
        '<span>' + BZG.ui.formatMoney(e.payout) + '</span>' +
        '</div>';
    }).join("") || '<p style="color:var(--text-muted); font-size:13px;">Nenhuma corrida ainda.</p>';
  }

  function weightedWinner() {
    var r = Math.random(), cum = 0;
    for (var i = 0; i < HORSES.length; i++) { cum += HORSES[i].p; if (r < cum) return i; }
    return HORSES.length - 1;
  }

  function easeOut(t) { return 1 - Math.pow(1 - t, 2.2); }

  function race() {
    if (racing) return;
    if (selected < 0) { BZG.ui.toast("Escolha um corredor.", "error"); return; }
    var bet = Math.round(Number(betInput.value));
    var balance = BZG.storage.getBalance();
    if (!bet || bet <= 0) { BZG.ui.toast("Digite um valor de aposta válido.", "error"); return; }
    if (bet > balance) { BZG.ui.toast("Você não tem saldo suficiente.", "error"); return; }

    racing = true;
    betInput.disabled = true;
    raceBtn.disabled = true;
    picksEl.style.pointerEvents = "none";
    setStatus("E lá vão eles!");
    BZG.sounds.bet();

    var winner = weightedWinner();
    // duracoes: o vencedor termina primeiro; os demais um pouco depois
    var winDur = spd(3400);
    var durs = HORSES.map(function (_, i) {
      return i === winner ? winDur : winDur + spd(250 + Math.random() * 1600);
    });
    var phase = HORSES.map(function () { return Math.random() * Math.PI * 2; });

    var start = performance.now();
    var lastTick = 0;

    function frame(now) {
      var elapsed = now - start;
      var progs = HORSES.map(function (h, i) {
        var base = easeOut(Math.min(1, elapsed / durs[i]));
        // pequeno vaivem para dar emocao, sem passar de ~0.98 antes do fim
        var jitter = Math.sin(elapsed / 220 + phase[i]) * 0.012;
        return Math.max(0, Math.min(1, base + (base < 0.97 ? jitter : 0)));
      });
      setPositions(progs);

      if (now - lastTick > 130) { BZG.sounds.tick(); lastTick = now; }

      if (elapsed >= winDur) {
        setPositions(HORSES.map(function (_, i) { return i === winner ? 1 : Math.min(0.97, easeOut(elapsed / durs[i])); }));
        finish(winner, bet);
      } else {
        requestAnimationFrame(frame);
      }
    }
    requestAnimationFrame(frame);
  }

  function finish(winner, bet) {
    laneEls[winner].classList.add("winner");
    var won = winner === selected;
    var odds = HORSES[selected].odds;
    var payout = won ? Math.round(bet * odds) : 0;

    BZG.storage.recordBet("horse", {
      bet: bet, multiplier: won ? odds : 0, payout: payout, won: won,
      detail: "🏆 " + HORSES[winner].emoji + " " + HORSES[winner].name
    });
    BZG.ui.refreshBalance();
    document.dispatchEvent(new CustomEvent("bzg:balance-changed"));
    renderHistory();

    if (won) {
      setStatus("🏆 " + HORSES[winner].name + " venceu! +" + BZG.ui.formatMoney(payout));
      BZG.ui.toast("Seu corredor venceu! +" + BZG.ui.formatMoney(payout), "success");
      BZG.sounds.win();
      BZG.effects.flash(stageEl, "gold");
      var r = stageEl.getBoundingClientRect();
      BZG.effects.confetti(r.left + r.width / 2, r.top + r.height / 2, odds >= 10 ? 90 : 55);
      if (payout >= 25000) BZG.effects.bigWin(payout, odds);
    } else {
      setStatus("Venceu " + HORSES[winner].name + ". Não foi dessa vez.");
      BZG.sounds.lose();
      BZG.effects.flash(stageEl, "red");
    }

    racing = false;
    betInput.disabled = false;
    raceBtn.disabled = false;
    picksEl.style.pointerEvents = "";
  }

  function quickBet(fn) {
    var current = Number(betInput.value) || 0;
    betInput.value = Math.max(1, Math.round(fn(current, BZG.storage.getBalance())));
  }

  document.addEventListener("DOMContentLoaded", function () {
    betInput = document.getElementById("bet-amount");
    raceBtn = document.getElementById("race-btn");
    statusEl = document.getElementById("round-status");
    historyListEl = document.getElementById("history-list");
    picksEl = document.getElementById("horse-picks");
    trackEl = document.getElementById("track");
    stageEl = document.getElementById("horse-stage");

    renderPicks();
    buildTrack();
    BZG.ui.refreshBalance();
    renderHistory();
    window.addEventListener("resize", function () { if (!racing) setPositions(HORSES.map(function () { return 0; })); });

    raceBtn.addEventListener("click", race);
    document.getElementById("bet-half").addEventListener("click", function () { quickBet(function (v) { return v / 2; }); });
    document.getElementById("bet-double").addEventListener("click", function () { quickBet(function (v) { return v * 2; }); });
    document.getElementById("bet-max").addEventListener("click", function () { quickBet(function (v, b) { return b; }); });
  });
})();
