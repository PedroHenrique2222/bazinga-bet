/* Bazinga BET - minigame "Fuga Alienigena" (desviar dos meteoros), sem aposta.
   Move o disco voador com mouse/toque/setas; meteoros caem cada vez mais rapido.
   Pontuacao = segundos sobrevividos. */
(function () {
  var W = 340, H = 480;
  var UFO_R = 17;
  var UFO_Y = H - 46;

  var canvas, ctx, timeEl, bestEl, statusEl, actionBtn, gameoverEl, gameoverTimeEl, gameoverSubEl, retryBtn;

  var state = "idle"; // idle | playing | gameover
  var ufoX = W / 2;
  var meteors = [];
  var elapsed = 0;
  var lastSpawnAt = 0;
  var lastTime = 0;
  var rafId = null;

  function updateTimeUI() {
    timeEl.textContent = Math.floor(elapsed) + "s";
  }

  function updateBestUI() {
    bestEl.textContent = BZG.storage.getMinigameBest("alien") + "s";
  }

  function spawnMeteor() {
    var r = 12 + Math.random() * 10;
    meteors.push({
      x: r + Math.random() * (W - r * 2),
      y: -r,
      r: r,
      speed: 90 + elapsed * 4 + Math.random() * 30
    });
  }

  function startGame() {
    state = "playing";
    meteors = [];
    elapsed = 0;
    lastSpawnAt = 0;
    ufoX = W / 2;
    updateTimeUI();
    gameoverEl.classList.remove("visible");
    actionBtn.textContent = "Reiniciar";
    statusEl.textContent = "Desvie dos meteoros!";
    lastTime = performance.now();
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(loop);
  }

  function loop(now) {
    if (state !== "playing") return;
    var dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;
    elapsed += dt;
    updateTimeUI();

    var spawnInterval = Math.max(0.22, 0.9 - elapsed * 0.02) * 1000;
    if (now - lastSpawnAt > spawnInterval) {
      spawnMeteor();
      lastSpawnAt = now;
    }

    for (var i = meteors.length - 1; i >= 0; i--) {
      var m = meteors[i];
      m.y += m.speed * dt;
      if (m.y - m.r > H) { meteors.splice(i, 1); continue; }
      var dx = m.x - ufoX, dy = m.y - UFO_Y;
      if (Math.sqrt(dx * dx + dy * dy) < m.r + UFO_R - 4) {
        endGame();
        return;
      }
    }

    render();
    rafId = requestAnimationFrame(loop);
  }

  function render() {
    ctx.clearRect(0, 0, W, H);

    ctx.font = (UFO_R * 2) + "px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🛸", ufoX, UFO_Y);

    meteors.forEach(function (m) {
      ctx.font = (m.r * 2) + "px sans-serif";
      ctx.fillText("☄️", m.x, m.y);
    });
  }

  function endGame() {
    state = "gameover";
    if (rafId) cancelAnimationFrame(rafId);

    var seconds = Math.floor(elapsed);
    var xpGain = seconds * 5;
    if (xpGain > 0) BZG.storage.addXp(xpGain);
    var res = BZG.storage.reportMinigameScore("alien", seconds);
    document.dispatchEvent(new CustomEvent("bzg:balance-changed"));
    if (BZG.achievements) BZG.achievements.check();

    updateBestUI();
    gameoverTimeEl.textContent = seconds + "s";
    gameoverSubEl.textContent = "+" + xpGain + " XP" + (res.isNewBest ? " · 🏆 Novo recorde pessoal!" : "");
    gameoverEl.classList.add("visible");
    actionBtn.textContent = "Começar";
    statusEl.textContent = "Nave atingida! Clique em \"Começar\" para tentar de novo.";
    BZG.sounds.lose();

    if (res.isNewBest && seconds > 0) {
      var rect = canvas.getBoundingClientRect();
      BZG.effects.confetti(rect.left + rect.width / 2, rect.top + rect.height / 2, 70);
    }
  }

  function moveTo(clientX) {
    if (state !== "playing") return;
    var rect = canvas.getBoundingClientRect();
    var scaleX = canvas.width / rect.width;
    var x = (clientX - rect.left) * scaleX;
    ufoX = Math.max(UFO_R, Math.min(W - UFO_R, x));
  }

  document.addEventListener("DOMContentLoaded", function () {
    canvas = document.getElementById("alien-canvas");
    ctx = canvas.getContext("2d");
    timeEl = document.getElementById("alien-time");
    bestEl = document.getElementById("alien-best");
    statusEl = document.getElementById("alien-status");
    actionBtn = document.getElementById("alien-action-btn");
    gameoverEl = document.getElementById("alien-gameover");
    gameoverTimeEl = document.getElementById("alien-gameover-time");
    gameoverSubEl = document.getElementById("alien-gameover-sub");
    retryBtn = document.getElementById("alien-retry-btn");

    updateBestUI();
    render();

    canvas.addEventListener("mousemove", function (e) { moveTo(e.clientX); });
    canvas.addEventListener("touchmove", function (e) {
      if (e.touches[0]) moveTo(e.touches[0].clientX);
      e.preventDefault();
    }, { passive: false });

    document.addEventListener("keydown", function (e) {
      if (state !== "playing") return;
      if (e.code === "ArrowLeft") { ufoX = Math.max(UFO_R, ufoX - 24); e.preventDefault(); }
      if (e.code === "ArrowRight") { ufoX = Math.min(W - UFO_R, ufoX + 24); e.preventDefault(); }
    });

    actionBtn.addEventListener("click", startGame);
    retryBtn.addEventListener("click", startGame);
  });
})();
