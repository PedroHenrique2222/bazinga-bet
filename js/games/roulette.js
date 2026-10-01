/* Bazinga BET - Roleta europeia (0-36) com mesa de apostas multiplas */
(function () {
  var WHEEL_ORDER = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
  var RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
  var SPIN_MS = 6000;
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

  /* ---------- Roda (canvas) ----------
     Desenho em tamanho logico SIZE x SIZE; o canvas real e maior em telas de alta
     densidade (retina) para ficar nitido. A bolinha e desenhada por cima da roda. */

  var SIZE = 400;
  var ball = null;        // { angle, r } em coordenadas absolutas (null = sem bolinha)
  var landedIdx = -1;     // casa onde a bolinha caiu (brilha), -1 = nenhuma
  var resultBadge = null; // { n, color } mostrado no centro depois do giro

  function setupCanvas() {
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = SIZE * dpr;
    canvas.height = SIZE * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function geom() {
    var c = SIZE / 2;
    return {
      c: c,
      rRim: c - 4,          // aro de madeira
      rTrack: c - 22,       // pista onde a bolinha gira
      rPocketOut: c - 40,   // borda externa das casas
      rNum: c - 52,         // numeros
      rPocketIn: c - 66,    // borda interna das casas (onde a bolinha assenta)
      rCone: c - 96         // centro (torre)
    };
  }

  function pocketColor(n) {
    var col = colorOf(n);
    return col === "green" ? "#14904f" : (col === "red" ? "#d81f2c" : "#16161c");
  }

  function drawWheel(rotation) {
    var g = geom(), c = g.c;
    var seg = (Math.PI * 2) / WHEEL_ORDER.length;
    ctx.clearRect(0, 0, SIZE, SIZE);

    // aro de madeira + pista
    var wood = ctx.createRadialGradient(c, c, g.rTrack, c, c, g.rRim);
    wood.addColorStop(0, "#5a2f12"); wood.addColorStop(0.5, "#8a4a1c"); wood.addColorStop(1, "#3a1d0a");
    ctx.beginPath(); ctx.arc(c, c, g.rRim, 0, Math.PI * 2); ctx.fillStyle = wood; ctx.fill();
    var track = ctx.createRadialGradient(c, c, g.rPocketOut, c, c, g.rTrack + 8);
    track.addColorStop(0, "#1b1b22"); track.addColorStop(1, "#3a3a46");
    ctx.beginPath(); ctx.arc(c, c, g.rTrack + 8, 0, Math.PI * 2); ctx.fillStyle = track; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = "#d1a300"; ctx.stroke();

    // losangos defletores na pista (fixos)
    for (var d = 0; d < 8; d++) {
      var da = d * Math.PI / 4 + Math.PI / 8;
      ctx.save();
      ctx.translate(c + Math.cos(da) * (g.rTrack + 1), c + Math.sin(da) * (g.rTrack + 1));
      ctx.rotate(da);
      ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(0, -3); ctx.lineTo(6, 0); ctx.lineTo(0, 3); ctx.closePath();
      ctx.fillStyle = "#e8c66a"; ctx.fill();
      ctx.restore();
    }

    // casas (giram com a roda)
    for (var i = 0; i < WHEEL_ORDER.length; i++) {
      var n = WHEEL_ORDER[i];
      var start = rotation + i * seg - Math.PI / 2 - seg / 2;
      ctx.beginPath();
      ctx.arc(c, c, g.rPocketOut, start, start + seg);
      ctx.arc(c, c, g.rPocketIn, start + seg, start, true);
      ctx.closePath();
      ctx.fillStyle = pocketColor(n);
      ctx.fill();
      if (i === landedIdx) { ctx.fillStyle = "rgba(255, 226, 122, 0.45)"; ctx.fill(); }
      // separadores dourados
      ctx.beginPath();
      ctx.moveTo(c + Math.cos(start) * g.rPocketIn, c + Math.sin(start) * g.rPocketIn);
      ctx.lineTo(c + Math.cos(start) * g.rPocketOut, c + Math.sin(start) * g.rPocketOut);
      ctx.strokeStyle = "#e8c66a"; ctx.lineWidth = 1.5; ctx.stroke();
      // numero
      var mid = start + seg / 2;
      ctx.save();
      ctx.translate(c + Math.cos(mid) * g.rNum, c + Math.sin(mid) * g.rNum);
      ctx.rotate(mid + Math.PI / 2);
      ctx.fillStyle = "#fff";
      ctx.font = "800 12px Segoe UI, Arial, sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(String(n), 0, 0);
      ctx.restore();
    }
    ctx.beginPath(); ctx.arc(c, c, g.rPocketOut, 0, Math.PI * 2); ctx.strokeStyle = "#e8c66a"; ctx.lineWidth = 2; ctx.stroke();

    // centro: prato de madeira + torre dourada com cruz (gira com a roda)
    var plate = ctx.createRadialGradient(c - 20, c - 20, 10, c, c, g.rPocketIn);
    plate.addColorStop(0, "#9a5a26"); plate.addColorStop(1, "#4a240c");
    ctx.beginPath(); ctx.arc(c, c, g.rPocketIn, 0, Math.PI * 2); ctx.fillStyle = plate; ctx.fill();
    ctx.strokeStyle = "#e8c66a"; ctx.lineWidth = 2; ctx.stroke();
    ctx.save();
    ctx.translate(c, c); ctx.rotate(rotation);
    for (var k = 0; k < 4; k++) {
      ctx.rotate(Math.PI / 2);
      ctx.beginPath(); ctx.moveTo(-4, 0); ctx.lineTo(4, 0); ctx.lineTo(2, -g.rCone - 14); ctx.lineTo(-2, -g.rCone - 14); ctx.closePath();
      ctx.fillStyle = "#e8c66a"; ctx.fill();
      ctx.beginPath(); ctx.arc(0, -g.rCone - 16, 5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
    var cone = ctx.createRadialGradient(c - 8, c - 8, 2, c, c, 26);
    cone.addColorStop(0, "#fff3b0"); cone.addColorStop(0.5, "#e8b53a"); cone.addColorStop(1, "#8a6200");
    ctx.beginPath(); ctx.arc(c, c, 24, 0, Math.PI * 2); ctx.fillStyle = cone; ctx.fill();

    // numero sorteado no centro, depois que a bolinha assenta
    if (resultBadge) {
      ctx.beginPath(); ctx.arc(c, c, 30, 0, Math.PI * 2);
      ctx.fillStyle = pocketColor(resultBadge.n); ctx.fill();
      ctx.lineWidth = 4; ctx.strokeStyle = "#ffe27a"; ctx.stroke();
      ctx.fillStyle = "#fff"; ctx.font = "900 26px Segoe UI, Arial, sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(String(resultBadge.n), c, c + 1);
    }

    // bolinha (com sombra e brilho)
    if (ball) {
      var bx = c + Math.cos(ball.angle) * ball.r, by = c + Math.sin(ball.angle) * ball.r;
      ctx.beginPath(); ctx.arc(bx + 2, by + 3, 7, 0, Math.PI * 2); ctx.fillStyle = "rgba(0,0,0,0.35)"; ctx.fill();
      var bg = ctx.createRadialGradient(bx - 2.5, by - 2.5, 1, bx, by, 7);
      bg.addColorStop(0, "#ffffff"); bg.addColorStop(0.6, "#e6e9ef"); bg.addColorStop(1, "#9aa3ae");
      ctx.beginPath(); ctx.arc(bx, by, 6.5, 0, Math.PI * 2); ctx.fillStyle = bg; ctx.fill();
    }
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

  /* Giro realista: a roda gira num sentido e desacelera; a bolinha corre na pista no
     sentido contrario, perde velocidade, desce quicando pelas casas e assenta no numero
     sorteado - dai em diante gira junto com a roda. O numero e sorteado ANTES (RNG justo);
     a animacao so leva a bolinha ate ele. */
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
    landedIdx = -1;
    resultBadge = null;
    Array.prototype.forEach.call(boardEl.querySelectorAll(".winner"), function (c) { c.classList.remove("winner"); });

    var resultNumber = Math.floor(Math.random() * 37);
    var idx = WHEEL_ORDER.indexOf(resultNumber);
    var seg = (Math.PI * 2) / WHEEL_ORDER.length;
    var g = geom();
    var sp = BZG.modes.speed();
    var T = SPIN_MS * sp;
    var T_DROP = 0.55 * T;   // a bolinha sai da pista e comeca a descer
    var T_SETTLE = 0.8 * T;  // a bolinha ja esta na casa
    var wheelStart = wheelRotation;
    var wheelTurns = Math.PI * 2 * (1.6 + Math.random() * 0.4);
    // angulo da bolinha RELATIVO a roda: termina no centro da casa sorteada
    var relEnd = idx * seg - Math.PI / 2;
    var relSpan = Math.PI * 2 * (3 + Math.random()); // voltas da bolinha contra a roda
    var bounceSeed = Math.random() * 10;
    var start = performance.now();
    var lastRelSeg = null;
    var zoomed = false;
    var roll = BZG.sounds.ballRoll ? BZG.sounds.ballRoll() : null; // bolinha rolando na pista

    function frame(now) {
      var e = Math.min(T, now - start), t = e / T;
      wheelRotation = wheelStart + wheelTurns * easeOutCubic(t);

      var u = Math.min(1, e / T_SETTLE);
      var rel = relEnd + relSpan * Math.pow(1 - u, 3);
      var r = g.rTrack;
      // som da bolinha acompanha a velocidade dela na pista; some quando ela desce
      if (roll) {
        if (e <= T_DROP) roll.set(Math.min(1, Math.pow(1 - u, 2) * 1.3));
        else { roll.stop(0.35); roll = null; }
      }
      if (e > T_DROP) {
        var v = Math.min(1, (e - T_DROP) / (T_SETTLE - T_DROP));
        var target = (g.rPocketOut + g.rPocketIn) / 2;
        // desce da pista ate a casa, quicando cada vez menos
        r = target + (g.rTrack - target) * Math.pow(1 - v, 2) +
            Math.abs(Math.sin(v * Math.PI * 4.5 + bounceSeed)) * 9 * (1 - v);
        rel += Math.sin(v * 17 + bounceSeed) * 0.05 * (1 - v);
        if (!zoomed) { zoomed = true; canvas.classList.add("zoom"); }
        // "tec-tec" a cada separador que a bolinha cruza enquanto quica
        var relSeg = Math.floor(rel / seg);
        if (relSeg !== lastRelSeg && v < 0.95) { BZG.sounds.pocketTick(1 - v); lastRelSeg = relSeg; }
      }
      if (e >= T_SETTLE) r = (g.rPocketOut + g.rPocketIn) / 2;

      ball = { angle: wheelRotation + rel, r: r };
      if (e >= T_SETTLE && landedIdx === -1) {
        landedIdx = idx;
        if (roll) { roll.stop(0.1); roll = null; }
        BZG.sounds.ballSettle();
      }
      drawWheel(wheelRotation);

      if (e < T) {
        requestAnimationFrame(frame);
      } else {
        resultBadge = { n: resultNumber };
        drawWheel(wheelRotation);
        setTimeout(function () { canvas.classList.remove("zoom"); }, 1600);
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
      BZG.sounds.winFor(totalReturn / total);
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

  /* ---------- imagens opcionais do Codex (cenario) ----------
     trocam sozinhas quando existirem; sem elas fica o visual de sempre */
  var IMG_FUNDO = "../assets/jogos/roulette/fundo.webp";

  function absUrl(p) {
    try { return new URL(p, document.baseURI).href; } catch (e) { return p; }
  }

  function loadImages() {
    if (!BZG.assets || !stageEl) return;
    BZG.assets.preload([IMG_FUNDO], function (ok) {
      if (ok[IMG_FUNDO]) {
        stageEl.style.setProperty("--jogo-fundo", 'url("' + absUrl(IMG_FUNDO) + '")');
        stageEl.classList.add("has-fundo");
      }
    });
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
    setupCanvas();
    drawWheel(0);
    BZG.ui.refreshBalance();
    renderResults();
    renderHistory();
    loadImages();

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
