/* Bazinga BET - Raspadinha: compre a cartela, raspe 9 campos, 3 iguais premiam */
(function () {
  /* cada premio: simbolo, multiplicador e a probabilidade da cartela ser desse premio.
     RTP = soma(prob * mult) ~= 0.90 */
  var PRIZES = [
    { sym: "🍒", mult: 2, prob: 0.14 },
    { sym: "🍀", mult: 3, prob: 0.07 },
    { sym: "🔔", mult: 5, prob: 0.028 },
    { sym: "⭐", mult: 10, prob: 0.010 },
    { sym: "💎", mult: 20, prob: 0.0045 },
    { sym: "⚡", mult: 50, prob: 0.0016 }
  ];
  var ALL_SYMS = PRIZES.map(function (p) { return p.sym; });

  var betInput, buyBtn, revealAllBtn, statusEl, historyListEl, cardEl, resultEl, stageEl;
  var cells = [];       // 9 simbolos
  var revealed = [];    // 9 bool
  var current = null;   // { bet, prize|null }
  var resolved = true;

  function setStatus(t) { statusEl.textContent = t; }

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  function randSym() { return ALL_SYMS[Math.floor(Math.random() * ALL_SYMS.length)]; }

  /* monta a cartela; se prize != null, coloca exatamente 3 do simbolo premiado */
  function buildCells(prize) {
    var arr = new Array(9);
    var counts = {};
    function add(idx, sym) { arr[idx] = sym; counts[sym] = (counts[sym] || 0) + 1; }

    var order = shuffle([0,1,2,3,4,5,6,7,8]);
    var pos = 0;

    if (prize) {
      for (var k = 0; k < 3; k++) add(order[pos++], prize.sym);
    }
    // preenche o resto sem criar nenhum trio (cap de 2 por simbolo) e sem exceder o premio
    while (pos < 9) {
      var idx = order[pos];
      var sym, tries = 0;
      do {
        sym = randSym();
        tries++;
      } while (
        tries < 30 &&
        ((counts[sym] || 0) >= 2 || (prize && sym === prize.sym))
      );
      add(idx, sym);
      pos++;
    }
    return arr;
  }

  function decidePrize() {
    var r = Math.random();
    var cum = 0;
    for (var i = 0; i < PRIZES.length; i++) {
      cum += PRIZES[i].prob;
      if (r < cum) return PRIZES[i];
    }
    return null; // cartela sem premio
  }

  function renderCard() {
    cardEl.innerHTML = cells.map(function (sym, i) {
      var isRev = revealed[i];
      return '<div class="rasp-cell' + (isRev ? " revealed" : "") + '" data-i="' + i + '">' +
        '<span class="rasp-sym">' + sym + '</span>' +
        '<span class="rasp-cover"></span>' +
      '</div>';
    }).join("");
    Array.prototype.forEach.call(cardEl.querySelectorAll(".rasp-cell"), function (cell) {
      cell.addEventListener("click", function () { scratch(Number(cell.dataset.i)); });
    });
  }

  function renderEmpty() {
    cardEl.innerHTML = "";
    for (var i = 0; i < 9; i++) {
      cardEl.innerHTML += '<div class="rasp-cell rasp-empty"><span class="rasp-cover"></span></div>';
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

  function scratch(i) {
    if (resolved || revealed[i]) return;
    revealed[i] = true;
    var cell = cardEl.querySelector('.rasp-cell[data-i="' + i + '"]');
    if (cell) cell.classList.add("revealed");
    BZG.sounds.scratch();
    if (revealed.every(Boolean)) resolve();
  }

  function revealAll() {
    if (resolved) return;
    for (var i = 0; i < 9; i++) revealed[i] = true;
    Array.prototype.forEach.call(cardEl.querySelectorAll(".rasp-cell"), function (c) {
      c.classList.add("revealed");
    });
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

    // destaca as celulas vencedoras
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

    // desconta a cartela na compra
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
    resultEl.textContent = "Raspe os campos!";
    setStatus("Clique nos campos para raspar. Ache 3 iguais!");
    buyBtn.disabled = true;
    betInput.disabled = true;
    revealAllBtn.style.display = "block";
  }

  function quickBet(fn) {
    if (!resolved) return;
    var current2 = Number(betInput.value) || 0;
    betInput.value = Math.max(1, Math.round(fn(current2, BZG.storage.getBalance())));
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

    buyBtn.addEventListener("click", buy);
    revealAllBtn.addEventListener("click", revealAll);
    document.getElementById("bet-half").addEventListener("click", function () { quickBet(function (v) { return v / 2; }); });
    document.getElementById("bet-double").addEventListener("click", function () { quickBet(function (v) { return v * 2; }); });
    document.getElementById("bet-max").addEventListener("click", function () { quickBet(function (v, b) { return b; }); });
  });
})();
