/* Bazinga BET - Bazinga Bonanza v2: estilo Sweet Bonanza com os icones do Bazinga.
   Grade 6x5, PAGA EM QUALQUER LUGAR (8+ do mesmo simbolo pagam; faixas 8-9 / 10-11 / 12+),
   cascata/tumble (vencedores somem, os de cima caem, novos preenchem o topo, repete
   enquanto houver ganho). 🎇 Bonus: 4+ em qualquer lugar dispara 10 RODADAS GRATIS
   (nas gratis as bombas de multiplicador aparecem MUITO mais); 3+ numa rodada gratis
   re-dispara +5. 💣 Bomba de multiplicador: nao forma ganho, mas no fim de um giro com
   ganho, TODAS as bombas na tela somam seus valores e multiplicam o ganho do giro.
   Compra de bonus: 20x a aposta compra 10 rodadas gratis na hora.
   Pagamentos calibrados por Monte Carlo (5M giros): RTP ~95%, disparo de gratis ~1 em 210. */
(function () {
  var COLS = 6, ROWS = 5, N = COLS * ROWS;
  var SCALE = 0.972;   // ajuste fino global do RTP
  var BUY_MULT = 20;   // custo da compra de rodadas gratis = 20x a aposta

  /* 8 simbolos de pagamento (alto -> baixo). pay = [8-9, 10-11, 12+] em x da aposta. */
  var SYMBOLS = [
    { icon: "💎", pay: [3, 6, 12],       weight: 6 },
    { icon: "🍰", pay: [1.5, 3, 8],      weight: 7 },
    { icon: "🍑", pay: [0.8, 2, 5],      weight: 8 },
    { icon: "🃏", pay: [0.5, 1.4, 3],    weight: 10 },
    { icon: "🎲", pay: [0.3, 0.8, 2],    weight: 12 },
    { icon: "🥒", pay: [0.2, 0.5, 1.5],  weight: 14 },
    { icon: "🔋", pay: [0.15, 0.4, 1],   weight: 16 },
    { icon: "🎃", pay: [0.1, 0.25, 0.8], weight: 18 }
  ];
  var TOTALW = SYMBOLS.reduce(function (s, x) { return s + x.weight; }, 0);
  var SCATTER = "🎇";
  var SCAT_PAY = { 4: 1, 5: 2, 6: 20 }; // 6 ou mais = 20x
  var P_SC = 0.019, P_BOMB_BASE = 0.020, P_BOMB_FREE = 0.110;
  var BOMB_VALS =    [2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 50, 100];
  var BOMB_WEIGHTS = [28, 22, 14, 10, 8, 5, 4, 3, 2, 1.5, 1, 0.6, 0.3];
  var TOTALBW = BOMB_WEIGHTS.reduce(function (s, x) { return s + x; }, 0);
  var FREE_SPINS = 10, RETRIGGER_MIN = 3, RETRIGGER_ADD = 5, TRIGGER_MIN = 4;

  var grid = [];  // grid[c][r], r=0 no topo; cada celula: {k:'p',i} | {k:'s'} | {k:'b',v}
  var spinning = false;

  var betInput, spinBtn, buyBtn, statusEl, historyListEl, gridEl, bannerEl, winEl, stageEl, freeEl;

  // estado da rodada em andamento
  var curBet = 0, curCost = 0, totalWin = 0, freeLeft = 0, isBuyRound = false;

  function spd(ms) { return ms * BZG.modes.speed(); }
  function setStatus(t) { statusEl.textContent = t; }

  function pickSym() {
    var r = Math.random() * TOTALW;
    for (var i = 0; i < SYMBOLS.length; i++) { r -= SYMBOLS[i].weight; if (r <= 0) return i; }
    return SYMBOLS.length - 1;
  }
  function pickBomb() {
    var r = Math.random() * TOTALBW;
    for (var i = 0; i < BOMB_VALS.length; i++) { r -= BOMB_WEIGHTS[i]; if (r <= 0) return BOMB_VALS[i]; }
    return BOMB_VALS[0];
  }
  // gera uma celula nova; st acumula scatters (st.sc) e soma das bombas (st.bomb)
  function newCell(pBomb, st) {
    var r = Math.random();
    if (r < P_SC) { st.sc++; return { k: "s" }; }
    if (r < P_SC + pBomb) { var v = pickBomb(); st.bomb += v; return { k: "b", v: v }; }
    return { k: "p", i: pickSym() };
  }

  function fillGrid(pBomb, st) {
    grid = [];
    for (var c = 0; c < COLS; c++) { grid[c] = []; for (var r = 0; r < ROWS; r++) grid[c][r] = newCell(pBomb, st); }
  }

  // conta simbolos de pagamento; 8+ paga e marca pra remover. retorna {pay, remove, any}
  function evaluate() {
    var counts = [0, 0, 0, 0, 0, 0, 0, 0];
    for (var c = 0; c < COLS; c++) for (var r = 0; r < ROWS; r++) {
      var cell = grid[c][r]; if (cell.k === "p") counts[cell.i]++;
    }
    var remove = [];
    for (var c2 = 0; c2 < COLS; c2++) { remove[c2] = []; for (var r2 = 0; r2 < ROWS; r2++) remove[c2][r2] = false; }
    var pay = 0, any = false;
    for (var s = 0; s < SYMBOLS.length; s++) {
      if (counts[s] >= 8) {
        var tier = counts[s] >= 12 ? 2 : (counts[s] >= 10 ? 1 : 0);
        pay += SYMBOLS[s].pay[tier];
        any = true;
        for (var cc = 0; cc < COLS; cc++) for (var rr = 0; rr < ROWS; rr++) {
          var cel = grid[cc][rr]; if (cel.k === "p" && cel.i === s) remove[cc][rr] = true;
        }
      }
    }
    return { pay: pay, remove: remove, any: any };
  }

  // cascata: por coluna, mantem as celulas NAO removidas (scatter/bomba grudam e caem),
  // preenche o topo com celulas novas
  function tumble(remove, pBomb, st) {
    for (var c = 0; c < COLS; c++) {
      var kept = [];
      for (var r = 0; r < ROWS; r++) if (!remove[c][r]) kept.push(grid[c][r]);
      var need = ROWS - kept.length;
      var col = [];
      for (var t = 0; t < need; t++) col.push(newCell(pBomb, st));
      grid[c] = col.concat(kept); // novos no topo
    }
  }

  function scatterPay(sc) { var key = sc >= 6 ? 6 : sc; return SCAT_PAY[key] || SCAT_PAY[6]; }

  function cellHTML(cell, win, drop) {
    var cls = "gem" + (drop ? " drop" : "") + (win ? " win" : "");
    var content;
    if (cell.k === "p") content = SYMBOLS[cell.i].icon;
    else if (cell.k === "s") { cls += " scatter"; content = SCATTER; }
    else { cls += " bomb"; content = '💣<b>' + cell.v + 'x</b>'; }
    return '<div class="' + cls + '">' + content + '</div>';
  }

  function renderGrid(opts) {
    opts = opts || {};
    var html = "";
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        html += cellHTML(grid[c][r], opts.remove && opts.remove[c][r], opts.drop);
      }
    }
    gridEl.innerHTML = html;
  }

  function showBanner(text, cls) {
    bannerEl.textContent = text;
    bannerEl.className = "bonanza-banner" + (cls ? " " + cls : "");
    void bannerEl.offsetWidth;
    bannerEl.classList.add("show");
  }

  function updateFreeUI() {
    if (freeLeft > 0) {
      stageEl.classList.add("free-mode");
      freeEl.style.display = "";
      freeEl.textContent = "🎇 Rodadas grátis: " + freeLeft;
    } else {
      stageEl.classList.remove("free-mode");
      freeEl.style.display = "none";
    }
  }

  function showRunningWin() {
    var payoutSoFar = Math.round(curBet * totalWin * SCALE);
    if (payoutSoFar > 0) {
      winEl.className = "bonanza-win" + (totalWin * SCALE >= 10 ? " big" : "");
      winEl.textContent = "Ganho: " + BZG.ui.formatMoney(payoutSoFar) + " (" + (totalWin * SCALE).toFixed(2) + "x)";
    }
  }

  function renderHistory() {
    var entries = BZG.storage.getHistory("bonanza");
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

  /* roda UM giro completo (base ou gratis): preenche, avalia e faz as cascatas ate parar,
     depois soma scatter pay e o multiplicador das bombas. Chama onDone(ganhoDoGiro, scatters). */
  function runSpin(pBomb, onDone) {
    var st = { sc: 0, bomb: 0 };
    var accWin = 0;
    fillGrid(pBomb, st);
    renderGrid({ drop: true });
    BZG.sounds.tick();

    setTimeout(function step() {
      var ev = evaluate();
      if (!ev.any) {
        var w = accWin;
        if (st.sc >= TRIGGER_MIN) w += scatterPay(st.sc);
        if (w > 0 && st.bomb > 0) { w *= st.bomb; showBanner("×" + st.bomb, "mult"); BZG.sounds.bombExplode(); }
        onDone(w, st.sc);
        return;
      }
      accWin += ev.pay;
      renderGrid({ remove: ev.remove });
      BZG.sounds.pegHit();
      setTimeout(function () {
        tumble(ev.remove, pBomb, st);
        renderGrid({ drop: true });
        BZG.sounds.tick();
        setTimeout(step, spd(260));
      }, spd(540));
    }, spd(360));
  }

  function lockUI(lock) {
    betInput.disabled = lock;
    spinBtn.disabled = lock;
    if (buyBtn) buyBtn.disabled = lock;
    document.getElementById("bet-half").disabled = lock;
    document.getElementById("bet-double").disabled = lock;
    document.getElementById("bet-max").disabled = lock;
  }

  function doRound(isBuy) {
    if (spinning) return;
    var bet = Math.round(Number(betInput.value));
    var balance = BZG.storage.getBalance();
    if (!bet || bet <= 0) { BZG.ui.toast("Digite um valor de aposta válido.", "error"); return; }
    var cost = isBuy ? bet * BUY_MULT : bet;
    if (cost > balance) {
      BZG.ui.toast(isBuy ? "A compra custa " + BZG.ui.formatMoney(cost) + " (20x). Saldo insuficiente." : "Você não tem saldo suficiente.", "error");
      return;
    }

    spinning = true;
    isBuyRound = !!isBuy;
    curBet = bet;
    curCost = cost;
    totalWin = 0;
    freeLeft = 0;
    lockUI(true);
    winEl.textContent = "";
    winEl.className = "bonanza-win";
    setStatus(isBuy ? "Comprando rodadas grátis..." : "Girando...");
    BZG.sounds.bet();

    if (isBuy) {
      showBanner("COMPRA! 🎇", "free");
      BZG.sounds.jackpot();
      setTimeout(function () { startFreeSpins(FREE_SPINS); }, spd(700));
    } else {
      runSpin(P_BOMB_BASE, function (w, sc) {
        totalWin += w;
        showRunningWin();
        if (sc >= TRIGGER_MIN) {
          showBanner("🎇 RODADAS GRÁTIS!", "free");
          BZG.sounds.jackpot();
          setTimeout(function () { startFreeSpins(FREE_SPINS); }, spd(900));
        } else {
          finishRound();
        }
      });
    }
  }

  function startFreeSpins(count) {
    freeLeft = count;
    updateFreeUI();
    setTimeout(nextFreeSpin, spd(500));
  }

  function nextFreeSpin() {
    if (freeLeft <= 0) { updateFreeUI(); finishRound(); return; }
    freeLeft--;
    updateFreeUI();
    setStatus("Rodada grátis! Faltam " + (freeLeft + 1));
    runSpin(P_BOMB_FREE, function (w, sc) {
      totalWin += w;
      showRunningWin();
      if (sc >= RETRIGGER_MIN) {
        freeLeft += RETRIGGER_ADD;
        updateFreeUI();
        showBanner("+" + RETRIGGER_ADD + " GRÁTIS!", "free");
        BZG.sounds.jackpot();
        setTimeout(nextFreeSpin, spd(750));
      } else {
        setTimeout(nextFreeSpin, spd(480));
      }
    });
  }

  function finishRound() {
    var payout = Math.round(curBet * totalWin * SCALE);
    var effMult = curCost > 0 ? payout / curCost : 0; // multiplicador sobre o custo (base OU compra)
    var won = payout > 0;

    stageEl.classList.remove("free-mode");
    freeEl.style.display = "none";

    BZG.storage.recordBet("bonanza", {
      bet: curCost, multiplier: effMult, payout: payout, won: won,
      detail: won ? effMult.toFixed(2) + "x" + (isBuyRound ? " 🛒" : "") : (isBuyRound ? "compra sem retorno" : "sem ganho")
    });
    BZG.ui.refreshBalance();
    document.dispatchEvent(new CustomEvent("bzg:balance-changed"));
    renderHistory();

    if (won) {
      var big = effMult >= 10;
      winEl.className = "bonanza-win" + (big ? " big" : "");
      winEl.textContent = "Ganho " + BZG.ui.formatMoney(payout) + " (" + effMult.toFixed(2) + "x)";
      setStatus("Você ganhou " + BZG.ui.formatMoney(payout) + "!");
      BZG.ui.toast("💎 +" + BZG.ui.formatMoney(payout) + " (" + effMult.toFixed(2) + "x)", "success");
      BZG.sounds.win();
      BZG.effects.flash(stageEl, "gold");
      var rect = stageEl.getBoundingClientRect();
      BZG.effects.confetti(rect.left + rect.width / 2, rect.top + rect.height / 2, big ? 120 : 55);
      if (effMult >= 20 || payout >= 25000) BZG.effects.bigWin(payout, effMult);
    } else {
      winEl.className = "bonanza-win";
      winEl.textContent = isBuyRound ? "A compra não retornou desta vez..." : "Sem 8 iguais... gire de novo!";
      setStatus(isBuyRound ? "As rodadas grátis não pagaram desta vez." : "Nenhum símbolo com 8+. Tente outra vez!");
      BZG.sounds.lose();
    }

    spinning = false;
    isBuyRound = false;
    lockUI(false);
  }

  function quickBet(fn) {
    var current = Number(betInput.value) || 0;
    betInput.value = Math.max(1, Math.round(fn(current, BZG.storage.getBalance())));
    updateBuyLabel();
  }

  function updateBuyLabel() {
    if (!buyBtn) return;
    var bet = Math.round(Number(betInput.value)) || 0;
    buyBtn.innerHTML = "Comprar Grátis 🎇<small>" + BZG.ui.formatMoney(bet * BUY_MULT) + " (20x)</small>";
  }

  document.addEventListener("DOMContentLoaded", function () {
    betInput = document.getElementById("bet-amount");
    spinBtn = document.getElementById("spin-btn");
    buyBtn = document.getElementById("buy-btn");
    statusEl = document.getElementById("round-status");
    historyListEl = document.getElementById("history-list");
    gridEl = document.getElementById("bonanza-grid");
    bannerEl = document.getElementById("bonanza-banner");
    winEl = document.getElementById("bonanza-win");
    stageEl = document.getElementById("bonanza-stage");
    freeEl = document.getElementById("bonanza-free");

    // grade inicial de enfeite (sem bombas/scatter contando)
    var st0 = { sc: 0, bomb: 0 };
    fillGrid(0, st0);
    renderGrid({});
    if (freeEl) freeEl.style.display = "none";
    BZG.ui.refreshBalance();
    renderHistory();
    updateBuyLabel();

    spinBtn.addEventListener("click", function () { doRound(false); });
    if (buyBtn) buyBtn.addEventListener("click", function () { doRound(true); });
    betInput.addEventListener("input", updateBuyLabel);
    document.getElementById("bet-half").addEventListener("click", function () { quickBet(function (v) { return v / 2; }); });
    document.getElementById("bet-double").addEventListener("click", function () { quickBet(function (v) { return v * 2; }); });
    document.getElementById("bet-max").addEventListener("click", function () { quickBet(function (v, b) { return b; }); });
  });
})();
