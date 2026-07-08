/* Bazinga BET - Torre BZG: um bloco desliza; solte alinhado com o de baixo.
   O que passar é cortado (o bloco afina). Errar tudo = perde a aposta.
   Cada andar aumenta o multiplicador; colha quando quiser. */
(function () {
  var BLOCK_H = 26;
  var PERFECT_TOL = 6;   // erro <= isto = encaixe perfeito (mantem a largura)
  var MAX_FLOORS = 25;   // teto (colhe automatico)
  var COLORS = ["#ff2d3a", "#ff8a00", "#ffcc00", "#2ecc71", "#00bcd4", "#b026ff"];

  var betInput, startBtn, dropBtn, cashoutBtn, statusEl, multEl, areaEl, worldEl, hintEl, stageEl;

  var state = "idle";    // "idle" | "playing"
  var bet = 0;
  var floor = 0;
  var mult = 1;
  var topX = 0, topW = 0;        // bloco de referencia (topo da pilha fixa)
  var moving = null;             // { x, w, dir, speed, el }
  var rafId = null;
  var areaW = 0;

  function setStatus(t) { statusEl.textContent = t; }
  function fmt(m) { return m.toFixed(2) + "x"; }
  function multFor(f) { return 1 + 0.22 * f; } // andar f -> multiplicador

  function renderHistory() {
    var entries = BZG.storage.getHistory("stack");
    historyListEl.innerHTML = entries.slice(0, 8).map(function (e) {
      var tagClass = e.won ? "tag--win" : "tag--lose";
      var tagText = e.won ? "GANHOU" : "PERDEU";
      return '<div class="history-row">' +
        '<span class="tag ' + tagClass + '">' + tagText + '</span>' +
        '<span>' + (e.detail || "") + '</span>' +
        '<span>' + BZG.ui.formatMoney(e.payout) + '</span>' +
        '</div>';
    }).join("") || '<p style="color:var(--text-muted); font-size:13px;">Nenhuma torre ainda.</p>';
  }
  var historyListEl;

  function placedBlockHTML(x, w, floorIdx) {
    var color = COLORS[floorIdx % COLORS.length];
    return '<div class="stack-block" style="left:' + x + 'px; width:' + w + 'px; bottom:' + (floorIdx * BLOCK_H) + 'px; background:' + color + ';"></div>';
  }

  function updateWorldShift() {
    // mantem o bloco atual visivel quando a torre fica alta
    var visible = Math.floor(areaEl.clientHeight / BLOCK_H) - 2;
    var shift = Math.max(0, (floor - visible) * BLOCK_H);
    worldEl.style.transform = "translateY(" + shift + "px)";
  }

  function spawnMoving() {
    var color = COLORS[floor % COLORS.length];
    var el = document.createElement("div");
    el.className = "stack-block moving";
    el.style.width = topW + "px";
    el.style.height = BLOCK_H + "px";
    el.style.bottom = (floor * BLOCK_H) + "px";
    el.style.background = color;
    worldEl.appendChild(el);
    var fromLeft = Math.random() < 0.5;
    moving = {
      x: fromLeft ? 0 : areaW - topW,
      w: topW,
      dir: fromLeft ? 1 : -1,
      speed: 2.2 + floor * 0.14,
      el: el
    };
    updateWorldShift();
    animate();
  }

  function animate() {
    function frame() {
      if (state !== "playing" || !moving) return;
      moving.x += moving.dir * moving.speed * BZG.modes.speed();
      if (moving.x <= 0) { moving.x = 0; moving.dir = 1; }
      if (moving.x + moving.w >= areaW) { moving.x = areaW - moving.w; moving.dir = -1; }
      moving.el.style.left = moving.x + "px";
      rafId = requestAnimationFrame(frame);
    }
    rafId = requestAnimationFrame(frame);
  }

  function drop() {
    if (state !== "playing" || !moving) return;
    if (rafId) cancelAnimationFrame(rafId);

    var overlapLeft = Math.max(moving.x, topX);
    var overlapRight = Math.min(moving.x + moving.w, topX + topW);
    var overlap = overlapRight - overlapLeft;

    if (overlap <= 0) {
      // errou tudo -> torre cai
      moving.el.classList.add("stack-slice");
      moving.el.style.left = moving.x + "px";
      moving = null;
      endRound(false);
      return;
    }

    var err = Math.abs(moving.x - topX);
    var newX, newW;
    if (err <= PERFECT_TOL) {
      // encaixe perfeito: mantem a largura, alinha
      newX = topX; newW = topW;
      BZG.sounds.win();
    } else {
      newX = overlapLeft; newW = overlap;
      // fatia cortada cai
      var slice = document.createElement("div");
      slice.className = "stack-slice";
      var sliceLeft = (moving.x < topX) ? moving.x : overlapRight;
      var sliceW = moving.w - overlap;
      slice.style.cssText = "left:" + sliceLeft + "px; width:" + sliceW + "px; bottom:" + (floor * BLOCK_H) + "px; background:" + COLORS[floor % COLORS.length] + ";";
      worldEl.appendChild(slice);
      BZG.sounds.click();
    }

    // fixa o bloco colocado
    moving.el.classList.remove("moving");
    moving.el.style.left = newX + "px";
    moving.el.style.width = newW + "px";
    moving = null;

    topX = newX; topW = newW;
    floor++;
    mult = multFor(floor);
    multEl.textContent = fmt(mult);
    multEl.classList.remove("bump"); void multEl.offsetWidth; multEl.classList.add("bump");
    cashoutBtn.style.display = "block";
    cashoutBtn.textContent = "Colher " + BZG.ui.formatMoney(bet * mult) + " (" + fmt(mult) + ")";
    setStatus("Andar " + floor + "! Próximo paga " + fmt(multFor(floor + 1)) + ". Colha quando quiser.");

    if (floor >= MAX_FLOORS) { endRound(true); return; }
    spawnMoving();
  }

  function startGame() {
    var b = Math.round(Number(betInput.value));
    var balance = BZG.storage.getBalance();
    if (!b || b <= 0) { BZG.ui.toast("Digite um valor de aposta válido.", "error"); return; }
    if (b > balance) { BZG.ui.toast("Você não tem saldo suficiente.", "error"); return; }

    bet = b; mult = 1;
    state = "playing";
    areaW = areaEl.clientWidth;
    topW = Math.round(areaW * 0.5);
    topX = Math.round((areaW - topW) / 2);

    // base = andar 0 (referencia); o proximo bloco movel entra no andar 1
    worldEl.style.transform = "translateY(0px)";
    worldEl.innerHTML = placedBlockHTML(topX, topW, 0);
    floor = 1;

    multEl.textContent = "1.00x";
    startBtn.style.display = "none";
    dropBtn.style.display = "block";
    cashoutBtn.style.display = "none";
    betInput.disabled = true;
    hintEl.textContent = "Solte alinhado com o bloco de baixo!";
    BZG.sounds.bet();

    spawnMoving();
  }

  function endRound(won) {
    state = "idle";
    if (rafId) cancelAnimationFrame(rafId);

    var payout = won ? Math.round(bet * mult) : 0;
    BZG.storage.recordBet("stack", {
      bet: bet, multiplier: won ? mult : 0, payout: payout, won: won,
      detail: floor + " andares · " + fmt(mult)
    });
    BZG.ui.refreshBalance();
    document.dispatchEvent(new CustomEvent("bzg:balance-changed"));
    renderHistory();

    if (won) {
      setStatus("Você colheu " + floor + " andares e ganhou " + BZG.ui.formatMoney(payout) + "!");
      BZG.ui.toast("Torre colhida! +" + BZG.ui.formatMoney(payout), "success");
      BZG.sounds.win();
      BZG.effects.flash(stageEl, "gold");
      var r = stageEl.getBoundingClientRect();
      BZG.effects.confetti(r.left + r.width / 2, r.top + r.height / 2, 60);
      if (payout >= 25000) BZG.effects.bigWin(payout, mult);
    } else {
      setStatus("A torre desabou no andar " + (floor + 1) + "! Você perdeu " + BZG.ui.formatMoney(bet) + ".");
      BZG.ui.toast("A torre caiu! Você perdeu a aposta.", "error");
      BZG.sounds.crashBoom();
      BZG.effects.shake(stageEl);
      BZG.effects.flash(stageEl, "red");
    }

    startBtn.style.display = "block";
    dropBtn.style.display = "none";
    cashoutBtn.style.display = "none";
    betInput.disabled = false;
    hintEl.textContent = "Toque em \"Soltar bloco\" ou aperte espaço";
  }

  function cashOut() {
    if (state !== "playing" || floor === 0) return;
    if (moving && moving.el && moving.el.parentNode) moving.el.parentNode.removeChild(moving.el);
    moving = null;
    endRound(true);
  }

  function quickBet(fn) {
    var current = Number(betInput.value) || 0;
    betInput.value = Math.max(1, Math.round(fn(current, BZG.storage.getBalance())));
  }

  document.addEventListener("DOMContentLoaded", function () {
    betInput = document.getElementById("bet-amount");
    startBtn = document.getElementById("start-btn");
    dropBtn = document.getElementById("drop-btn");
    cashoutBtn = document.getElementById("cashout-btn");
    statusEl = document.getElementById("round-status");
    multEl = document.getElementById("stack-mult");
    areaEl = document.getElementById("stack-area");
    worldEl = document.getElementById("stack-world");
    hintEl = document.getElementById("stack-hint");
    stageEl = document.getElementById("stack-stage");
    historyListEl = document.getElementById("history-list");

    BZG.ui.refreshBalance();
    renderHistory();

    startBtn.addEventListener("click", startGame);
    dropBtn.addEventListener("click", drop);
    cashoutBtn.addEventListener("click", cashOut);
    document.addEventListener("keydown", function (e) {
      if (e.code === "Space" && state === "playing") { e.preventDefault(); drop(); }
    });
    document.getElementById("bet-half").addEventListener("click", function () { quickBet(function (v) { return v / 2; }); });
    document.getElementById("bet-double").addEventListener("click", function () { quickBet(function (v) { return v * 2; }); });
    document.getElementById("bet-max").addEventListener("click", function () { quickBet(function (v, b) { return b; }); });
  });
})();
