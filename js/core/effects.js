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

  /* ---------- Big Win: overlay de tela cheia para premios grandes ---------- */

  var bigWinBusy = false;

  function bigWin(amount, mult) {
    if (bigWinBusy) return;
    bigWinBusy = true;

    var overlay = document.createElement("div");
    overlay.className = "bigwin-overlay";
    overlay.innerHTML =
      '<div class="bigwin-rays"></div>' +
      '<div class="bigwin-content">' +
        '<div class="bigwin-title">BIG WIN!</div>' +
        '<div class="bigwin-amount">' + (BZG.ui ? BZG.ui.formatMoney(amount) : amount) + '</div>' +
        (mult ? '<div class="bigwin-mult">' + mult.toFixed(2) + 'x</div>' : '') +
      '</div>';
    document.body.appendChild(overlay);
    requestAnimationFrame(function () { overlay.classList.add("show"); });

    if (BZG.sounds && BZG.sounds.bigWin) BZG.sounds.bigWin();

    // rajadas de confete de varios pontos
    var cx = window.innerWidth / 2, cy = window.innerHeight / 2;
    confetti(cx, cy, 120);
    setTimeout(function () { confetti(cx - 200, cy - 40, 70); }, 220);
    setTimeout(function () { confetti(cx + 200, cy - 40, 70); }, 420);

    setTimeout(function () {
      overlay.classList.remove("show");
      setTimeout(function () {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        bigWinBusy = false;
      }, 400);
    }, 2400);
  }

  return {
    confetti: confetti,
    shake: shake,
    flash: flash,
    bigWin: bigWin
  };
})();
