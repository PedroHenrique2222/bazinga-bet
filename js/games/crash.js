/* Bazinga BET - Crash com rodadas continuas (estilo Blaze): todo mundo joga a mesma rodada.
   v1.34: modo AO VIVO (padrao). As rodadas seguem uma "agenda" montada a partir do relogio
   do servidor (BZG.live): a cada hora comeca uma corrente de rodadas, e o ponto em que a
   canoa afunda sai do numero da rodada - todo aparelho calcula a mesma agenda e ve a mesma
   canoa, com as apostas dos jogadores de verdade. O modo Solo e o de sempre. */
(function () {
  var HOUSE_EDGE = 0.04;
  var GROWTH_RATE = 0.18;
  var BETTING_MS = 7000;
  var CRASHED_PAUSE_MS = 3200;
  var MAX_CRASH = 500;
  var CHAIN_MS = 3600000;     // uma corrente de rodadas por hora
  var CHAIN_LEAD_MS = 45000;  // folga: cabe uma rodada inteira de 500x (7s + 34,5s + 3,2s)

  var betInput, autoCashoutInput, actionBtn, statusEl, multiplierEl, canvas, ctx,
      historyListEl, roundBetsEl, stageEl, countdownEl, countdownTimeEl, countdownFillEl, crashHistoryEl;

  var phase = "betting"; // "betting" | "running" | "crashed"
  var phaseStart = 0;
  var crashPoint = 1;
  var lastMultiplier = 1;
  var lastTickTime = 0;
  var lastWholeMult = 1;  // ultimo multiplicador inteiro que tocou o "ding"
  var engine = null;      // som continuo do motor durante a rodada
  var lastBeepSecond = -1;

  var bots = [];
  var userBet = null;   // { amount, auto, status: "in"|"cashed"|"lost", cashMult, payout }
  var queuedBet = null; // aposta feita durante uma rodada, entra na proxima
  var cashMarkers = []; // pontos de retirada exibidos no grafico
  var roundIdEl = null;

  /* modo ao vivo */
  var live = false;
  var liveR = null;        // rodada ao vivo atual { id, bet, run, crash, end, cp }
  var liveTable = null;
  var liveBar = null;
  var others = [];         // outros jogadores na mesa
  var botLimit = 99;

  /* imagens opcionais do Codex (plano B: desenho/visual atual) */
  var IMG_DIR = "../assets/jogos/crash/";
  var IMG = { fundo: IMG_DIR + "fundo.webp", canoa: IMG_DIR + "canoa.webp" };
  var canoeImg = null; // Image ja carregado, reaproveitado em todo quadro

  /* numero da rodada persistido: da a sensacao de plataforma "vivida" */
  function nextRoundId() {
    var v = 0;
    try { v = Number(localStorage.getItem("bzgRoundCrash")) || 0; } catch (e) {}
    if (!v) v = 47000 + Math.floor(Math.random() * 9000);
    v++;
    try { localStorage.setItem("bzgRoundCrash", String(v)); } catch (e) {}
    return v;
  }

  function formatMult(m) {
    return m.toFixed(2) + "x";
  }

  function setStatus(text) {
    statusEl.textContent = text;
  }

  function generateCrashPoint(r) {
    if (r === undefined) r = Math.random();
    if (r < HOUSE_EDGE) return 1.00;
    var r2 = (r - HOUSE_EDGE) / (1 - HOUSE_EDGE);
    var point = 1 / (1 - r2);
    point = Math.floor(point * 100) / 100;
    return Math.max(1.00, Math.min(point, MAX_CRASH));
  }

  /* ---------- agenda ao vivo ---------- */

  function runMs(cp) { return Math.log(cp) / GROWTH_RATE * 1000; }
  var MAX_ROUND_MS = BETTING_MS + runMs(MAX_CRASH) + CRASHED_PAUSE_MS;
  var chains = {};

  // todas as rodadas da corrente da hora h (mesma conta em todo aparelho)
  function chain(h) {
    if (chains[h]) return chains[h];
    var t = h * CHAIN_MS + CHAIN_LEAD_MS;
    var limit = (h + 1) * CHAIN_MS + CHAIN_LEAD_MS;
    var rounds = [];
    for (var i = 0; t + MAX_ROUND_MS <= limit; i++) {
      var cp = generateCrashPoint(BZG.live.rng("crash:" + h + ":" + i)());
      var run = t + BETTING_MS;
      var crash = run + runMs(cp);
      rounds.push({ id: h * 1000 + i, bet: t, run: run, crash: crash, end: crash + CRASHED_PAUSE_MS, cp: cp });
      t = crash + CRASHED_PAUSE_MS;
    }
    var keys = Object.keys(chains);
    if (keys.length > 4) delete chains[keys[0]];
    return (chains[h] = { rounds: rounds, end: t });
  }

  // rodada no instante t. Na folga do fim da hora, a 1a rodada da proxima hora
  // fica com as apostas abertas por mais tempo.
  function liveRoundAt(t) {
    var h = Math.floor((t - CHAIN_LEAD_MS) / CHAIN_MS);
    var c = chain(h);
    var rs = c.rounds;
    var lo = 0, hi = rs.length - 1;
    while (lo <= hi) {
      var mid = (lo + hi) >> 1;
      if (t < rs[mid].bet) hi = mid - 1;
      else if (t >= rs[mid].end) lo = mid + 1;
      else return rs[mid];
    }
    return chain(h + 1).rounds[0];
  }

  // ultimos n resultados ao vivo antes da rodada r
  function liveRecent(r, n) {
    var out = [];
    var t = r.bet - 1;
    while (out.length < n) {
      var prev = liveRoundAt(t);
      if (prev.id === r.id) { t = chain(Math.floor((t - CHAIN_LEAD_MS) / CHAIN_MS)).end - 1; prev = liveRoundAt(t); } // folga do fim da hora
      out.push(prev.cp);
      t = prev.bet - 1;
      r = prev;
    }
    return out;
  }

  /* ---------- Historico de rodadas (bolinhas) ---------- */

  function chipClass(m) {
    if (m >= 10) return "crash-chip--high";
    if (m >= 2) return "crash-chip--mid";
    return "crash-chip--low";
  }

  function renderCrashHistory() {
    var recent = BZG.storage.getRecent("crash");
    if (live && liveR) recent = (phase === "crashed" ? [liveR.cp] : []).concat(liveRecent(liveR, phase === "crashed" ? 11 : 12));
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
    if (live) others.forEach(function (o) {
      if (!liveR || o.r !== liveR.id || !o.bet) return;
      var colorCls = o.color && o.color !== "default" ? " bzg-name color-" + esc(o.color) : "";
      rows.push(betRowHTML(esc(o.avatar), '<span class="' + colorCls + '">' + esc(o.nick) + '</span><span class="real-tag" title="Jogador ao vivo"></span>',
        Number(o.bet) || 0, { status: o.st || "in", cashMult: Number(o.m) || 1 }, false));
    });
    bots.forEach(function (b) {
      rows.push(betRowHTML(b.avatar, b.name + (live ? '<span class="bot-tag">BOT</span>' : ''), b.bet, b, false));
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

    var isDark = BZG.theme.getMode() === "dark";
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

    // eixo de tempo (segundos) na base
    ctx.fillStyle = labelColor;
    ctx.font = "11px Inter, Segoe UI, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    var tStep = Math.max(1, Math.ceil(maxT / 5));
    for (var ts = tStep; ts <= maxT; ts += tStep) {
      var tx = padding + (ts / maxT) * (w - padding * 1.4);
      ctx.fillText(ts + "s", tx, h - 10);
    }

    // marcadores de quem ja retirou nesta subida (+ jogadores ao vivo)
    var allMarkers = cashMarkers;
    if (live && liveR) others.forEach(function (o) {
      if (o.r === liveR.id && o.st === "cashed" && o.m) allMarkers = allMarkers.concat([{ mult: Number(o.m) }]);
    });
    for (var mk = 0; mk < allMarkers.length; mk++) {
      var marker = allMarkers[mk];
      if (marker.mult > mult) continue;
      var mxy = toXY(Math.log(marker.mult) / GROWTH_RATE, marker.mult);
      ctx.beginPath();
      if (marker.user) {
        ctx.fillStyle = "#ffcc00";
        ctx.arc(mxy[0], mxy[1], 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(255, 204, 0, 0.5)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(mxy[0], mxy[1], 8, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.fillStyle = "rgba(46, 204, 113, 0.9)";
        ctx.arc(mxy[0], mxy[1], 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // canoa na ponta (imagem do Codex se carregou; senao o emoji de sempre)
    ctx.save();
    ctx.translate(tipXY[0], tipXY[1]);
    ctx.rotate(-0.5);
    if (canoeImg) {
      // balanco leve de remada, so no desenho (nao mexe na curva)
      ctx.rotate(Math.sin(performance.now() / 260) * 0.06);
      var cw = Math.min(84, w * 0.13);
      var ch = cw * canoeImg.naturalHeight / canoeImg.naturalWidth;
      ctx.drawImage(canoeImg, -cw / 2, -ch / 2, cw, ch);
    } else {
      ctx.font = "30px serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("🛶", 0, 0);
    }
    ctx.restore();
  }

  /* ---------- Maquina de estados da rodada ---------- */

  function startBettingPhase(r) {
    phase = "betting";
    phaseStart = performance.now();
    lastBeepSecond = -1;
    bots = live ? BZG.live.withSeed("crash-bots:" + r.id, BZG.bots.crashRoundBots).slice(0, botLimit) : BZG.bots.crashRoundBots();
    userBet = null;
    cashMarkers = [];
    if (roundIdEl) roundIdEl.textContent = "Rodada #" + (live ? r.id % 1000000 : nextRoundId());
    if (live) renderCrashHistory();

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
      sendLiveBet();
    }

    renderRoundBets();
  }

  function startRunningPhase() {
    phase = "running";
    phaseStart = performance.now();
    crashPoint = live && liveR ? liveR.cp : generateCrashPoint();
    lastMultiplier = 1;
    lastTickTime = phaseStart;
    lastWholeMult = 1;

    countdownEl.classList.remove("visible");
    // motor/remada: som continuo que sobe com o multiplicador (mais alto com aposta)
    if (engine) engine.stop(0.05);
    engine = BZG.sounds.engineStart ? BZG.sounds.engineStart(userBet ? 1 : 0.6) : null;

    if (userBet) {
      betInput.disabled = true;
      autoCashoutInput.disabled = true;
      actionBtn.disabled = false;
      actionBtn.className = "btn btn--gold";
      setStatus("Remando! Retire antes da canoa afundar.");
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
    if (engine) { engine.stop(0.06); engine = null; }

    // resolve bots que nao retiraram
    bots.forEach(function (b) {
      if (b.status === "in") b.status = "lost";
    });

    // resolve o usuario se ainda estava em jogo
    if (userBet && userBet.status === "in") {
      userBet.status = "lost";
      sendLiveBet();
      BZG.storage.recordBet("crash", {
        bet: userBet.amount,
        multiplier: finalMult,
        payout: 0,
        won: false
      });
      BZG.ui.refreshBalance();
      document.dispatchEvent(new CustomEvent("bzg:balance-changed"));
      BZG.ui.toast("A canoa afundou em " + formatMult(finalMult) + "! Você perdeu a aposta.", "error");
      BZG.sounds.crashBoom();
      BZG.effects.shake(stageEl);
      BZG.effects.flash(stageEl, "red");
      renderHistory();
    } else {
      BZG.sounds.crashBoom();
      BZG.effects.flash(stageEl, "red");
    }

    if (!live) BZG.storage.pushRecent("crash", finalMult);
    renderCrashHistory();

    multiplierEl.textContent = formatMult(finalMult);
    multiplierEl.classList.remove("tier-low", "tier-mid", "tier-high");
    multiplierEl.classList.add("crashed");
    actionBtn.disabled = true;
    actionBtn.textContent = "Afundou!";
    setStatus("Afundou em " + formatMult(finalMult) + ". Próxima canoa em instantes.");
    renderRoundBets();
  }

  function updateMultiplierColor(mult) {
    multiplierEl.classList.remove("tier-low", "tier-mid", "tier-high");
    if (mult >= 3) multiplierEl.classList.add("tier-high");
    else if (mult >= 1.5) multiplierEl.classList.add("tier-mid");
    else multiplierEl.classList.add("tier-low");
  }

  /* ajusta a resolucao interna do canvas ao tamanho exibido (texto legivel no celular) */
  function fitCanvas() {
    var w = Math.min(720, Math.max(280, stageEl.clientWidth - 32));
    if (Math.abs(canvas.width - w) < 4) return;
    canvas.width = w;
    // em telas estreitas o grafico fica mais alto para nao virar uma tirinha
    canvas.height = w < 480 ? Math.round(w * 0.72) : Math.round(w * 380 / 720);
    if (phase !== "running") drawCurve(0, 1);
  }

  function loop(now) {
    if (live) liveSync(now);
    if (phase === "betting") {
      var remaining = Math.max(0, BETTING_MS - (now - phaseStart));
      var secs = remaining / 1000;
      countdownTimeEl.textContent = secs.toFixed(1) + "s";
      countdownFillEl.style.width = Math.min(100, (remaining / BETTING_MS) * 100) + "%";

      var whole = Math.ceil(secs);
      if (whole <= 3 && whole !== lastBeepSecond && whole > 0) {
        BZG.sounds.countdownBeep();
        lastBeepSecond = whole;
      }

      if (remaining <= 0 && !live) startRunningPhase();
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
            cashMarkers.push({ mult: b.target });
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

        if (engine) engine.set(mult);
        // passou de um inteiro (2x, 3x...): "ding" subindo
        var whole = Math.floor(mult);
        if (whole > lastWholeMult) {
          lastWholeMult = whole;
          if (BZG.sounds.milestone) BZG.sounds.milestone(whole);
          lastTickTime = now;
        }
      }
    } else if (phase === "crashed") {
      if (now - phaseStart >= CRASHED_PAUSE_MS && !live) startBettingPhase();
    }

    requestAnimationFrame(loop);
  }

  /* ao vivo: segue a agenda do relogio do servidor */
  function liveSync(now) {
    var t = BZG.live.now();
    var r = liveRoundAt(t);
    if (!liveR || r.id !== liveR.id) {
      // rodada anterior ainda em andamento (aba em segundo plano): a canoa ja afundou
      if (liveR && phase === "running") startCrashedPhase(crashPoint);
      if (liveR && phase === "betting" && userBet) { startRunningPhase(); startCrashedPhase(crashPoint); }
      botLimit = Math.max(0, 10 - 2 * others.length);
      liveR = r;
      startBettingPhase(r);
    }
    if (phase === "betting") {
      if (t >= r.run) { startRunningPhase(); phaseStart = now - (t - r.run); }
      else phaseStart = now - (BETTING_MS - (r.run - t));
    } else if (phase === "running") {
      phaseStart = now - (t - r.run);
    }
  }

  function esc(s) { return BZG.ui.escapeHtml ? BZG.ui.escapeHtml(String(s == null ? "" : s)) : String(s); }

  function sendLiveBet() {
    if (!live || !liveTable || !liveR || !userBet) return;
    liveTable.update({ r: liveR.id, bet: userBet.amount, st: userBet.status, m: userBet.cashMult || 0 });
  }

  /* ---------- Ao Vivo / Solo ---------- */

  function setLive(on) {
    if ((userBet && userBet.status === "in") || queuedBet) {
      BZG.ui.toast("Espere sua aposta desta rodada terminar para trocar de modo.", "info");
      return false;
    }
    live = on;
    BZG.live.setLiveMode("crash", on);
    if (engine) { engine.stop(0.05); engine = null; }
    if (on) {
      liveR = null;
      others = [];
      liveTable = BZG.live.table("crash", function (list, count) {
        others = list;
        if (liveBar) liveBar.setCount(count);
        renderRoundBets();
      });
      BZG.live.setChatTable("crash");
    } else {
      if (liveTable) liveTable.leave();
      liveTable = null;
      others = [];
      BZG.live.setChatTable(null);
      startBettingPhase();
      renderCrashHistory();
    }
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
    sendLiveBet();
    renderRoundBets();
  }

  function doCashOut(mult) {
    if (!userBet || userBet.status !== "in" || phase !== "running") return;

    var payout = Math.round(userBet.amount * mult);
    userBet.status = "cashed";
    userBet.cashMult = mult;
    userBet.payout = payout;
    cashMarkers.push({ mult: mult, user: true });
    sendLiveBet();

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
    BZG.sounds.cashout(mult);
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

  function loadImages() {
    if (!BZG.assets) return;
    BZG.assets.preload([IMG.fundo, IMG.canoa], function (ok) {
      if (ok[IMG.fundo]) {
        var url = IMG.fundo;
        try { url = new URL(IMG.fundo, document.baseURI).href; } catch (e) {}
        stageEl.style.setProperty("--stage-fundo", 'url("' + url + '")');
        stageEl.classList.add("has-bg");
      }
      if (ok[IMG.canoa]) {
        var img = new Image();
        img.onload = function () { if (img.naturalWidth > 0) canoeImg = img; };
        img.src = IMG.canoa;
      }
    });
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
    roundIdEl = document.getElementById("round-id");

    fitCanvas();
    window.addEventListener("resize", fitCanvas);

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

    live = BZG.live ? BZG.live.isLiveMode("crash") : false;
    if (BZG.live) {
      liveBar = BZG.live.bar(stageEl.parentNode, live, setLive);
      if (live) setLive(true);
    }
    if (!live) startBettingPhase();
    requestAnimationFrame(loop);
    loadImages();
  });
})();
