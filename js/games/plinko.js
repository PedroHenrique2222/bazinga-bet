/* Bazinga BET - Plinko com fisica real: gravidade, quiques nos pinos, varias bolinhas */
(function () {
  var GRAVITY = 1500;        // px/s^2
  var RESTITUTION = 0.4;     // energia mantida no quique
  var VX_DAMPING = 0.85;     // amortecimento horizontal a cada quique
  var KICK = 40;             // empurrao aleatorio maximo por quique
  var MAX_FALL_SPEED = 950;  // px/s
  var MAX_BALLS = 60;        // bolinhas simultaneas no ar
  var AUTO_INTERVAL_MS = 140;
  var AUTO_MAX = 200;

  /* forca de atracao da bolinha para a CASA SORTEADA (ver binomialBucket): a fisica
     e so o visual; o resultado e decidido por RNG binomial (justo e a prova de escala). */
  var TARGET_PULL = { 8: 3.4, 12: 2.2, 16: 2.0 };

  /* Tabelas calibradas para a distribuicao REAL do plinko (bucket ~ Binomial(linhas, 0.5)),
     dando RTP ~96-97% em TODAS as combinacoes - independente do tamanho da tela.
     (Antes eram calibradas "no olho" pela fisica, o que deixava algumas combinacoes
     acima de 100% de RTP em telas menores - uma brecha de farm.) */
  var MULT_TABLES = {
    8: {
      low: [5.5, 2.1, 1.1, 0.98, 0.49, 0.98, 1.1, 2.1, 5.5],
      medium: [19, 3.1, 1.2, 0.61, 0.34, 0.61, 1.2, 3.1, 19],
      high: [52, 3.6, 1, 0.18, 0.13, 0.18, 1, 3.6, 52]
    },
    12: {
      low: [8.4, 3, 1.8, 1.3, 1.1, 0.95, 0.53, 0.95, 1.1, 1.3, 1.8, 3, 8.4],
      medium: [23, 5.8, 3.3, 1.6, 1, 0.81, 0.35, 0.81, 1, 1.6, 3.3, 5.8, 23],
      high: [62, 9.7, 4.9, 2.5, 0.97, 0.42, 0.28, 0.42, 0.97, 2.5, 4.9, 9.7, 62]
    },
    16: {
      low: [12, 6.9, 2, 1.4, 1.4, 1.2, 1.1, 0.98, 0.49, 0.98, 1.1, 1.2, 1.4, 1.4, 2, 6.9, 12],
      medium: [76, 27, 8.7, 4.3, 3.2, 1.6, 0.97, 0.43, 0.32, 0.43, 0.97, 1.6, 3.2, 4.3, 8.7, 27, 76],
      high: [296, 54, 16, 8.1, 4, 2, 0.4, 0.27, 0.27, 0.27, 0.4, 2, 4, 8.1, 16, 54, 296]
    }
  };

  /* casa de destino ~ Binomial(linhas, 0.5): a MESMA distribuicao de um plinko fisico
     de verdade (cada pino desvia 50% pra cada lado). E o que garante o RTP exato. */
  function binomialBucket(n) {
    var k = 0;
    for (var i = 0; i < n; i++) if (Math.random() < 0.5) k++;
    return k;
  }

  var betInput, dropBtn, autoBtn, autoCountInput, statusEl, canvas, ctx,
      historyListEl, riskButtons, rowsButtons, stageEl;

  var risk = "low";
  var rows = 12;
  var layout = null;   // { pegs: [{x,y}], pegR, ballR, spacing, centerX, slotY, slotW }
  var balls = [];      // { x, y, vx, vy, bet }
  var pendingFit = false;
  var pegFlashes = []; // { x, y, start }
  var slotFlashes = {}; // slotIndex -> timestamp
  var lastPegSound = 0;
  var lastFrameTime = 0;

  var autoRemaining = 0;
  var autoTimer = null;

  function formatMult(m) {
    return (m >= 10 ? m.toFixed(0) : m.toFixed(1)) + "x";
  }

  function setStatus(text) {
    statusEl.textContent = text;
  }

  function currentTable() {
    return MULT_TABLES[rows][risk];
  }

  /* ajusta a resolucao do canvas ao tamanho exibido; so quando nao ha bolinhas no ar
     (mudar o tabuleiro no meio do voo bagunçaria a fisica) */
  function fitCanvas() {
    if (balls.length > 0 || autoRemaining > 0) { pendingFit = true; return; }
    pendingFit = false;
    var w = Math.min(560, Math.max(280, stageEl.clientWidth - 24));
    if (Math.abs(canvas.width - w) < 4) return;
    canvas.width = w;
    canvas.height = Math.round(w * 600 / 560);
    computeLayout();
  }

  /* ---------- Layout do tabuleiro ---------- */

  function computeLayout() {
    var w = canvas.width, h = canvas.height;
    var marginTop = 46;
    var slotH = 32;
    var slotY = h - slotH - 22;
    var playHeight = slotY - marginTop - 14;
    var rowHeight = playHeight / rows;
    var spacing = Math.min(rowHeight * 1.2, (w - 50) / (rows + 2));
    var centerX = w / 2;

    var pegs = [];
    for (var i = 0; i < rows; i++) {
      var count = i + 3;
      var y = marginTop + (i + 1) * rowHeight;
      for (var j = 0; j < count; j++) {
        pegs.push({ x: centerX + (j - (count - 1) / 2) * spacing, y: y });
      }
    }

    layout = {
      pegs: pegs,
      pegR: Math.max(2.6, spacing * 0.1),
      ballR: Math.max(4.5, spacing * 0.22),
      spacing: spacing,
      centerX: centerX,
      slotY: slotY,
      slotH: slotH,
      slotW: spacing * 0.88,
      marginTop: marginTop
    };
  }

  function slotX(k) {
    return layout.centerX + (k - rows / 2) * layout.spacing;
  }

  function slotColor(mult) {
    if (mult >= 10) return "#ff2d3a";
    if (mult >= 2) return "#ff8a00";
    if (mult >= 1) return "#e0a400";
    return "#3a3a44";
  }

  /* ---------- Desenho ---------- */

  function drawBoard(now) {
    var L = layout;
    var w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    var isDark = BZG.theme.getMode() === "dark";
    var pegColor = isDark ? "rgba(255,255,255,0.55)" : "rgba(30,20,0,0.45)";

    // pinos
    for (var p = 0; p < L.pegs.length; p++) {
      var peg = L.pegs[p];
      var flash = null;
      for (var f = 0; f < pegFlashes.length; f++) {
        var pf = pegFlashes[f];
        if (pf.x === peg.x && pf.y === peg.y && now - pf.start < 240) { flash = pf; break; }
      }
      if (flash) {
        var age = (now - flash.start) / 240;
        var glowR = L.pegR + (1 - age) * 8;
        var g = ctx.createRadialGradient(peg.x, peg.y, 0, peg.x, peg.y, glowR);
        g.addColorStop(0, "rgba(255,204,0," + (1 - age).toFixed(2) + ")");
        g.addColorStop(1, "rgba(255,204,0,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(peg.x, peg.y, glowR, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = flash ? "#e0a400" : pegColor;
      ctx.beginPath();
      ctx.arc(peg.x, peg.y, L.pegR, 0, Math.PI * 2);
      ctx.fill();
    }

    // slots
    var table = currentTable();
    for (var k = 0; k <= rows; k++) {
      var sx = slotX(k);
      var mult = table[k];
      var flashT = slotFlashes[k];
      var lit = flashT && now - flashT < 500;
      ctx.fillStyle = slotColor(mult);
      ctx.globalAlpha = lit ? 1 : 0.82;
      roundRect(sx - L.slotW / 2, L.slotY, L.slotW, L.slotH, 6);
      ctx.fill();
      if (lit) {
        ctx.strokeStyle = "#ffcc00";
        ctx.lineWidth = 2;
        roundRect(sx - L.slotW / 2, L.slotY, L.slotW, L.slotH, 6);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      ctx.fillStyle = mult >= 1 ? "#1a1200" : "#f2f2f5";
      ctx.font = "bold " + Math.min(11, L.slotW * 0.34) + "px Segoe UI, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(formatMult(mult), sx, L.slotY + L.slotH / 2);
    }

    // bolinhas
    for (var b = 0; b < balls.length; b++) {
      var ball = balls[b];
      var grad = ctx.createRadialGradient(ball.x - 2, ball.y - 2, 1, ball.x, ball.y, L.ballR + 1);
      grad.addColorStop(0, "#ffcf8a");
      grad.addColorStop(1, "#f57c0c");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, L.ballR, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  /* ---------- Fisica ---------- */

  function stepPhysics(dt, now) {
    var L = layout;
    var landed = [];
    // paredes exatamente na borda externa dos slots: a bolinha nunca cai fora deles
    var wallHalf = (rows / 2) * L.spacing + L.slotW / 2;
    var minX = L.centerX - wallHalf;
    var maxX = L.centerX + wallHalf;
    // 2 subpassos por frame evitam que bolinhas rapidas atravessem pinos
    var SUBSTEPS = 2;
    var subDt = dt / SUBSTEPS;

    var basePull = TARGET_PULL[rows] || 2.0;
    var playHeight = L.slotY - L.marginTop - 14;
    var homeStartY = L.marginTop + playHeight * 0.72; // ultimos ~28%: "assenta" na casa certa

    for (var i = 0; i < balls.length; i++) {
      var ball = balls[i];
      ball.age = (ball.age || 0) + dt;
      var targetX = slotX(ball.targetSlot != null ? ball.targetSlot : Math.round(rows / 2));

      for (var s = 0; s < SUBSTEPS; s++) {
        ball.vy = Math.min(ball.vy + GRAVITY * subDt, MAX_FALL_SPEED);
        // atracao suave (velocidade) para a casa sorteada durante toda a queda
        ball.vx += (targetX - ball.x) * basePull * subDt;
        ball.x += ball.vx * subDt;
        ball.y += ball.vy * subDt;

        // no trecho final, puxa a POSICAO direto para a casa sorteada, garantindo
        // que a bolinha pouse exatamente onde o RNG decidiu (sem descolar do premio)
        if (ball.y > homeStartY) {
          var prog = Math.min(1, (ball.y - homeStartY) / (L.slotY - homeStartY));
          ball.x += (targetX - ball.x) * prog * prog * 0.35;
        }

        // colisao com pinos
        for (var p = 0; p < L.pegs.length; p++) {
          var peg = L.pegs[p];
          if (Math.abs(peg.y - ball.y) > L.ballR + L.pegR + 2) continue;
          var dx = ball.x - peg.x;
          var dy = ball.y - peg.y;
          var distSq = dx * dx + dy * dy;
          var minDist = L.ballR + L.pegR;
          if (distSq < minDist * minDist && distSq > 0.0001) {
            var dist = Math.sqrt(distSq);
            var nx = dx / dist, ny = dy / dist;

            // afasta a bolinha do pino
            ball.x = peg.x + nx * minDist;
            ball.y = peg.y + ny * minDist;

            // reflete a velocidade na normal, com perda de energia
            var dot = ball.vx * nx + ball.vy * ny;
            ball.vx = (ball.vx - 2 * dot * nx) * RESTITUTION;
            ball.vy = (ball.vy - 2 * dot * ny) * RESTITUTION;

            // amortecimento + empurraozinho aleatorio para espalhar naturalmente
            ball.vx = ball.vx * VX_DAMPING + (Math.random() - 0.5) * KICK;

            if (now - lastPegSound > 70) {
              BZG.sounds.pegHit();
              lastPegSound = now;
            }
            pegFlashes.push({ x: peg.x, y: peg.y, start: now });
          }
        }

        // paredes laterais
        if (ball.x < minX + L.ballR) { ball.x = minX + L.ballR; ball.vx = Math.abs(ball.vx) * 0.6 + 10; }
        if (ball.x > maxX - L.ballR) { ball.x = maxX - L.ballR; ball.vx = -Math.abs(ball.vx) * 0.6 - 10; }

        // anti-travamento: sem progresso vertical por 0.7s -> "pop" para destravar
        if (Math.abs(ball.vy) < 40 && ball.y < L.slotY - L.ballR - 4) {
          ball.stuckTime = (ball.stuckTime || 0) + subDt;
          if (ball.stuckTime > 0.7) {
            ball.vx += (Math.random() < 0.5 ? -1 : 1) * (80 + Math.random() * 80);
            ball.vy = -140;
            ball.stuckTime = 0;
          }
        } else {
          ball.stuckTime = 0;
        }
      }

      // chegou nos slots (ou esta viva ha tempo demais - resolve a forca)
      if (ball.y >= L.slotY - L.ballR || ball.age > 10) {
        landed.push(i);
      }
    }

    // resolve as que cairam (de tras para frente para poder remover)
    for (var li = landed.length - 1; li >= 0; li--) {
      var idx = landed[li];
      var b2 = balls[idx];
      // paga pela casa SORTEADA (RNG binomial); a fisica so trouxe a bolinha ate la
      var k = b2.targetSlot != null ? b2.targetSlot
        : Math.max(0, Math.min(rows, Math.round(rows / 2 + (b2.x - layout.centerX) / layout.spacing)));
      balls.splice(idx, 1);
      resolveBall(b2, k, now);
    }

    pegFlashes = pegFlashes.filter(function (f) { return now - f.start < 240; });
  }

  function resolveBall(ball, slotIndex, now) {
    var mult = currentTable()[slotIndex];
    var payout = Math.round(ball.bet * mult);
    var won = payout >= ball.bet;

    slotFlashes[slotIndex] = now;

    BZG.storage.recordBet("plinko", {
      bet: ball.bet,
      multiplier: mult,
      payout: payout,
      won: won,
      alreadyDebited: true,
      detail: formatMult(mult)
    });
    BZG.ui.refreshBalance();
    document.dispatchEvent(new CustomEvent("bzg:balance-changed"));
    renderHistory();

    if (mult >= 10) {
      BZG.ui.toast("💥 " + formatMult(mult) + "! +" + BZG.ui.formatMoney(payout), "success");
      BZG.sounds.win();
      BZG.effects.flash(stageEl, "gold");
      var rect = stageEl.getBoundingClientRect();
      BZG.effects.confetti(rect.left + rect.width / 2, rect.top + rect.height * 0.7, 80);
    } else if (won) {
      BZG.sounds.click();
    } else {
      BZG.sounds.lose();
    }

    updateStatus("Última: " + formatMult(mult) + " (" + BZG.ui.formatMoney(payout) + ")");
    updateControlsLock();

    // aplica um redimensionamento que ficou pendente enquanto havia bolinhas no ar
    if (pendingFit && balls.length === 0 && autoRemaining === 0) fitCanvas();
  }

  /* ---------- Loop principal ---------- */

  function loop(now) {
    if (!lastFrameTime) lastFrameTime = now;
    var dt = Math.min(0.033, (now - lastFrameTime) / 1000);
    lastFrameTime = now;

    if (balls.length > 0) {
      stepPhysics(dt, now);
    }
    drawBoard(now);
    requestAnimationFrame(loop);
  }

  /* ---------- Soltar bolinhas ---------- */

  function dropOne() {
    var bet = Math.round(Number(betInput.value));
    var balance = BZG.storage.getBalance();

    if (!bet || bet <= 0) {
      BZG.ui.toast("Digite um valor de aposta válido.", "error");
      return false;
    }
    if (bet > balance) {
      BZG.ui.toast("Você não tem saldo suficiente.", "error");
      return false;
    }
    if (balls.length >= MAX_BALLS) {
      BZG.ui.toast("Muitas bolinhas no ar! Espere algumas caírem.", "error");
      return false;
    }

    // desconta na hora; o premio e creditado quando a bolinha cai
    BZG.storage.adjustBalance(-bet);
    BZG.ui.refreshBalance();

    balls.push({
      x: layout.centerX + (Math.random() - 0.5) * layout.spacing * 0.5,
      y: layout.marginTop - 14,
      vx: (Math.random() - 0.5) * 30,
      vy: 0,
      age: 0,
      stuckTime: 0,
      bet: bet,
      targetSlot: binomialBucket(rows)  // resultado sorteado; a fisica so guia ate ele
    });
    BZG.sounds.bet();
    updateControlsLock();
    return true;
  }

  function updateStatus(extra) {
    var flying = balls.length > 0 ? balls.length + " bolinha(s) no ar. " : "";
    var auto = autoRemaining > 0 ? "Auto: faltam " + autoRemaining + ". " : "";
    setStatus(flying + auto + (extra || ""));
  }

  /* rows/risco so podem mudar sem bolinhas no ar (mudaria a fisica no meio) */
  function updateControlsLock() {
    var locked = balls.length > 0 || autoRemaining > 0;
    riskButtons.forEach(function (b) { b.disabled = locked; });
    rowsButtons.forEach(function (b) { b.disabled = locked; });
  }

  /* ---------- Modo automatico ---------- */

  function startAuto() {
    if (autoRemaining > 0) { // clicar de novo = parar
      stopAuto("Modo automático interrompido.");
      return;
    }
    var count = Math.round(Number(autoCountInput.value));
    if (!count || count < 1) {
      BZG.ui.toast("Digite quantas bolinhas soltar.", "error");
      return;
    }
    count = Math.min(count, AUTO_MAX);
    autoRemaining = count;
    autoBtn.textContent = "Parar";
    autoBtn.classList.add("btn--primary");
    autoBtn.classList.remove("btn--gold");
    updateControlsLock();

    autoTimer = setInterval(function () {
      if (autoRemaining <= 0) {
        stopAuto("Modo automático concluído!");
        return;
      }
      if (balls.length >= MAX_BALLS) return; // espera abrir espaco
      if (!dropOne()) {
        stopAuto("Modo automático parado (saldo insuficiente).");
        return;
      }
      autoRemaining--;
      updateStatus();
    }, AUTO_INTERVAL_MS);
  }

  function stopAuto(message) {
    autoRemaining = 0;
    if (autoTimer) clearInterval(autoTimer);
    autoTimer = null;
    autoBtn.textContent = "Auto";
    autoBtn.classList.remove("btn--primary");
    autoBtn.classList.add("btn--gold");
    if (message) setStatus(message);
    updateControlsLock();
  }

  /* ---------- Historico ---------- */

  function renderHistory() {
    var entries = BZG.storage.getHistory("plinko");
    historyListEl.innerHTML = entries.slice(0, 10).map(function (e) {
      var tagClass = e.won ? "tag--win" : "tag--lose";
      var tagText = e.won ? "GANHOU" : "PERDEU";
      return '<div class="history-row">' +
        '<span class="tag ' + tagClass + '">' + tagText + '</span>' +
        '<span>' + (e.multiplier >= 10 ? e.multiplier.toFixed(0) : e.multiplier.toFixed(1)) + 'x</span>' +
        '<span>' + BZG.ui.formatMoney(e.payout) + '</span>' +
        '</div>';
    }).join("") || '<p style="color:var(--text-muted); font-size:13px;">Nenhuma bolinha ainda.</p>';
  }

  /* ---------- Controles ---------- */

  function selectRisk(newRisk) {
    if (balls.length > 0 || autoRemaining > 0) return;
    risk = newRisk;
    riskButtons.forEach(function (b) {
      b.classList.toggle("active", b.dataset.risk === newRisk);
    });
    BZG.sounds.click();
  }

  function selectRows(newRows) {
    if (balls.length > 0 || autoRemaining > 0) return;
    rows = Number(newRows);
    rowsButtons.forEach(function (b) {
      b.classList.toggle("active", Number(b.dataset.rows) === rows);
    });
    computeLayout();
    BZG.sounds.click();
  }

  function quickBet(fn) {
    var current = Number(betInput.value) || 0;
    var balance = BZG.storage.getBalance();
    var next = fn(current, balance);
    betInput.value = Math.max(1, Math.round(next));
  }

  document.addEventListener("DOMContentLoaded", function () {
    betInput = document.getElementById("bet-amount");
    dropBtn = document.getElementById("drop-btn");
    autoBtn = document.getElementById("auto-btn");
    autoCountInput = document.getElementById("auto-count");
    statusEl = document.getElementById("round-status");
    canvas = document.getElementById("plinko-canvas");
    ctx = canvas.getContext("2d");
    historyListEl = document.getElementById("history-list");
    riskButtons = Array.prototype.slice.call(document.querySelectorAll("#risk-options .btn"));
    rowsButtons = Array.prototype.slice.call(document.querySelectorAll("#rows-options .btn"));
    stageEl = document.getElementById("plinko-stage");

    computeLayout();
    fitCanvas();
    window.addEventListener("resize", fitCanvas);
    BZG.ui.refreshBalance();
    renderHistory();

    dropBtn.addEventListener("click", dropOne);
    autoBtn.addEventListener("click", startAuto);
    riskButtons.forEach(function (b) {
      b.addEventListener("click", function () { selectRisk(b.dataset.risk); });
    });
    rowsButtons.forEach(function (b) {
      b.addEventListener("click", function () { selectRows(b.dataset.rows); });
    });
    document.getElementById("bet-half").addEventListener("click", function () {
      quickBet(function (v) { return v / 2; });
    });
    document.getElementById("bet-double").addEventListener("click", function () {
      quickBet(function (v) { return v * 2; });
    });
    document.getElementById("bet-max").addEventListener("click", function () {
      quickBet(function (v, balance) { return balance; });
    });

    requestAnimationFrame(loop);
  });
})();
