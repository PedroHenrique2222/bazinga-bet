/* Bazinga BET - efeitos visuais reutilizaveis (confete, shake, flash) */
window.BZG = window.BZG || {};

BZG.effects = (function () {
  var confettiCanvas = null;
  var confettiCtx = null;
  var confettiParticles = [];
  var confettiRunning = false;

  function ensureConfettiCanvas() {
    if (confettiCanvas) return;
    confettiCanvas = document.createElement("canvas");
    confettiCanvas.style.position = "fixed";
    confettiCanvas.style.inset = "0";
    confettiCanvas.style.width = "100%";
    confettiCanvas.style.height = "100%";
    confettiCanvas.style.pointerEvents = "none";
    confettiCanvas.style.zIndex = "998";
    document.body.appendChild(confettiCanvas);
    confettiCtx = confettiCanvas.getContext("2d");

    function resize() {
      confettiCanvas.width = window.innerWidth;
      confettiCanvas.height = window.innerHeight;
    }
    window.addEventListener("resize", resize);
    resize();
  }

  function confetti(originX, originY, amount) {
    ensureConfettiCanvas();
    var colors = ["#ff2d3a", "#ffcc00", "#ff5a3c", "#fff2b0", "#2ecc71"];
    var n = amount || 60;
    var ox = originX != null ? originX : window.innerWidth / 2;
    var oy = originY != null ? originY : window.innerHeight / 3;

    for (var i = 0; i < n; i++) {
      var angle = Math.random() * Math.PI * 2;
      var speed = 2 + Math.random() * 6;
      confettiParticles.push({
        x: ox,
        y: oy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,
        size: 3 + Math.random() * 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI,
        rotSpeed: (Math.random() - 0.5) * 0.3,
        life: 0,
        maxLife: 60 + Math.random() * 40
      });
    }

    if (!confettiRunning) {
      confettiRunning = true;
      requestAnimationFrame(runConfetti);
    }
  }

  function runConfetti() {
    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    var alive = false;

    for (var i = 0; i < confettiParticles.length; i++) {
      var p = confettiParticles[i];
      if (!p) continue;
      p.life++;
      if (p.life > p.maxLife) {
        confettiParticles[i] = null;
        continue;
      }
      alive = true;
      p.vy += 0.12;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotSpeed;

      var alpha = 1 - p.life / p.maxLife;
      confettiCtx.save();
      confettiCtx.globalAlpha = Math.max(0, alpha);
      confettiCtx.translate(p.x, p.y);
      confettiCtx.rotate(p.rotation);
      confettiCtx.fillStyle = p.color;
      confettiCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      confettiCtx.restore();
    }

    confettiParticles = confettiParticles.filter(Boolean);

    if (alive) {
      requestAnimationFrame(runConfetti);
    } else {
      confettiRunning = false;
    }
  }

  function shake(el) {
    if (!el) return;
    el.classList.remove("bzg-shake");
    void el.offsetWidth;
    el.classList.add("bzg-shake");
    setTimeout(function () {
      el.classList.remove("bzg-shake");
    }, 420);
  }

  function flash(container, color) {
    if (!container) return;
    var overlay = container.querySelector(".flash-overlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.className = "flash-overlay";
      container.appendChild(overlay);
    }
    overlay.classList.remove("flash-red", "flash-gold");
    void overlay.offsetWidth;
    overlay.classList.add(color === "gold" ? "flash-gold" : "flash-red");
  }

  /* ---------- Big Win: overlay de tela cheia em 3 niveis ----------
     Grande (azul) -> Mega (rosa) -> BAZINGA (dourado). O valor sobe contando e,
     ao passar de cada faixa, o nivel "sobe ao vivo" com flash, anel e aviso.
     Confete, moedas e fogos aumentam a cada nivel; no BAZINGA a tela treme. */

  var BW_ROOT = /\/(games|minigames)\//.test(location.pathname) ? "../" : "";
  var BW_TIERS = [
    { key: "grande", label: "GRANDE<br>VITÓRIA", coins: 12, confetti: 24, bursts: 0 },
    { key: "mega", label: "MEGA<br>VITÓRIA", coins: 24, confetti: 48, bursts: 3, badge: "SUBIU DE NÍVEL!" },
    { key: "bazinga", label: "BAZINGA!", coins: 40, confetti: 80, bursts: 6, badge: "NÍVEL MÁXIMO!" }
  ];
  var BW_COLORS = ["#F12C4C", "#FFC23D", "#22E6FF", "#2EE88A", "#FF2E88", "#A36BFF", "#ffffff"];
  var BW_SPOTS = [[18, 22], [82, 20], [12, 62], [88, 60], [30, 12], [70, 14]];

  // nivel final pelo multiplicador (e premio, para apostas altas com mult baixo)
  function bigWinTier(amount, mult) {
    if (mult >= 100) return 2;
    if (mult >= 25 || amount >= 100000) return 1;
    return 0;
  }

  function particlesHTML(t) {
    var html = "", i, k;
    for (i = 0; i < t.coins; i++) {
      var sz = 22 + Math.round(Math.random() * 22);
      html += '<i class="bw-coin" style="left:' + (Math.random() * 100).toFixed(1) + '%;width:' + sz + 'px;height:' + sz +
        'px;animation-duration:' + (1.4 + Math.random() * 1.2).toFixed(2) + 's;animation-delay:' + (Math.random() * 1.6).toFixed(2) + 's"></i>';
    }
    for (i = 0; i < t.confetti; i++) {
      html += '<i class="bw-confetti" style="left:' + (Math.random() * 100).toFixed(1) + '%;background:' + BW_COLORS[i % BW_COLORS.length] +
        ';width:' + (7 + Math.round(Math.random() * 6)) + 'px;height:' + (12 + Math.round(Math.random() * 10)) +
        'px;--dx:' + Math.round(Math.random() * 160 - 80) + 'px;--r:' + Math.round(360 + Math.random() * 720) +
        'deg;animation-duration:' + (2.2 + Math.random() * 1.5).toFixed(2) + 's;animation-delay:' + (Math.random() * 2.4).toFixed(2) + 's"></i>';
    }
    for (i = 0; i < t.bursts; i++) {
      for (k = 0; k < 14; k++) {
        var ang = (k / 14) * Math.PI * 2, dist = 110 + (k % 3) * 30, col = BW_COLORS[(i + k) % BW_COLORS.length];
        html += '<i class="bw-spark" style="left:' + BW_SPOTS[i][0] + '%;top:' + BW_SPOTS[i][1] + '%;background:' + col +
          ';box-shadow:0 0 12px ' + col + ';--dx:' + Math.round(Math.cos(ang) * dist) + 'px;--dy:' + Math.round(Math.sin(ang) * dist) +
          'px;animation-delay:' + (i * 0.35).toFixed(2) + 's"></i>';
      }
    }
    return html;
  }

  var bigWinBusy = false;

  function bigWin(amount, mult) {
    if (bigWinBusy) return;
    bigWinBusy = true;
    mult = mult || 0;

    var target = bigWinTier(amount, mult);
    var turbo = BZG.storage && BZG.storage.isTurboOn && BZG.storage.isTurboOn();
    var duration = [2000, 3800, 6000][target] * (turbo ? 0.5 : 1);
    var fmt = function (v) { return BZG.ui ? BZG.ui.formatMoney(v) : String(v); };

    var overlay = document.createElement("div");
    overlay.className = "bigwin-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-label", "Grande vitória");
    overlay.innerHTML =
      '<div class="bw-stage">' +
        '<div class="bw-bg"></div>' +
        '<div class="bw-rays"></div>' +
        '<div class="bw-particles"></div>' +
        '<div class="bw-tier-layer"></div>' +
        '<div class="bw-bottom">' +
          '<div class="bw-amount">' + fmt(0) + '</div>' +
          (mult ? '<div class="bw-mult">' + mult.toFixed(2) + 'x da aposta</div>' : '') +
          '<button type="button" class="bw-btn bw-skip">Pular</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);

    var stage = overlay.querySelector(".bw-stage");
    var particles = overlay.querySelector(".bw-particles");
    var tierLayer = overlay.querySelector(".bw-tier-layer");
    var amountEl = overlay.querySelector(".bw-amount");
    var btn = overlay.querySelector(".bw-btn");

    var current = -1, raf = null, done = false, closeTimer = null, closed = false;
    // faixas de valor onde o nivel sobe durante a contagem
    var cuts = target === 2 ? [0, 0.12, 0.38] : (target === 1 ? [0, 0.3] : [0]);

    function setTier(i) {
      if (i === current) return;
      current = i;
      var t = BW_TIERS[i];
      overlay.setAttribute("data-tier", t.key);
      particles.innerHTML = particlesHTML(t);
      tierLayer.innerHTML =
        '<div class="bw-flash"></div><div class="bw-ring"></div>' +
        // arte da comemoracao do nivel (assets/bigwin/<nivel>.webp, Codex); some se nao existir
        '<img class="bw-art" src="' + BW_ROOT + 'assets/bigwin/' + t.key + '.webp" alt="" onerror="this.remove()">' +
        (i > 0 ? '<div class="bw-badge">' + t.badge + '</div>' : '') +
        '<div class="bw-title"><span>' + t.label + '</span></div>';
      stage.classList.remove("bw-shake", "bw-shake-hard");
      void stage.offsetWidth;
      if (i === 1) stage.classList.add("bw-shake");
      if (i === 2) stage.classList.add("bw-shake-hard");
      // som: fanfarra do nivel; ao SUBIR de nivel, whoosh + impacto antes
      var S = BZG.sounds;
      if (S && S.bigWinTier) {
        if (i > 0) {
          if (S.whoosh) S.whoosh(0.35, true);
          if (S.impact) S.impact(i === 2 ? 1 : 0.75);
        }
        S.bigWinTier(i);
      } else if (S && S.bigWin) {
        S.bigWin();
      }
    }

    function finish() {
      if (done) return;
      done = true;
      if (raf) cancelAnimationFrame(raf);
      setTier(target);
      if (BZG.sounds && BZG.sounds.countEnd) BZG.sounds.countEnd();
      amountEl.textContent = fmt(amount);
      amountEl.classList.remove("counting");
      amountEl.classList.add("pop");
      btn.textContent = "COLETAR";
      btn.classList.remove("bw-skip");
      btn.classList.add("bw-collect");
      closeTimer = setTimeout(close, turbo ? 1500 : 2600);
    }

    function close() {
      if (closed) return;
      closed = true;
      if (BZG.sounds && BZG.sounds.collect) BZG.sounds.collect();
      if (raf) cancelAnimationFrame(raf);
      clearTimeout(closeTimer);
      overlay.classList.remove("show");
      setTimeout(function () {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        bigWinBusy = false;
      }, 350);
    }

    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      if (done) close(); else finish();
    });
    overlay.addEventListener("click", function () { if (done) close(); else finish(); });

    setTier(0);
    amountEl.classList.add("counting");
    requestAnimationFrame(function () { overlay.classList.add("show"); });

    var start = performance.now();
    var lastTick = 0;
    function step(now) {
      if (done) return;
      var p = Math.min(1, (now - start) / duration);
      var e = 1 - Math.pow(1 - p, 2.2);
      amountEl.textContent = fmt(Math.round(amount * e));
      // "tic-tic" da contagem: cada vez mais rapido (130ms -> 40ms) e mais agudo
      if (BZG.sounds && BZG.sounds.countTick && now - lastTick > 130 - 90 * p) {
        BZG.sounds.countTick(p);
        lastTick = now;
      }
      for (var i = cuts.length - 1; i >= 0; i--) { if (e >= cuts[i]) { setTier(i); break; } }
      if (p < 1) raf = requestAnimationFrame(step); else finish();
    }
    raf = requestAnimationFrame(step);
  }

  /* qualquer jogo: vitoria com multiplicador alto (ou premio muito grande) abre o Big Win.
     Os jogos que ja chamam bigWin() por conta propria nao duplicam (bigWinBusy). */
  document.addEventListener("bzg:bet-recorded", function (e) {
    var d = e.detail || {};
    if (!d.won || !(d.payout > 0)) return;
    if ((d.multiplier || 0) >= 10 || d.payout >= 25000) bigWin(d.payout, d.multiplier || 0);
  });

  // o Big Win esta na tela? (os jogos nao tocam o som de vitoria por cima da fanfarra)
  function isBigWinActive() {
    return bigWinBusy;
  }

  return {
    confetti: confetti,
    shake: shake,
    flash: flash,
    bigWin: bigWin,
    isBigWinActive: isBigWinActive
  };
})();
