/* Bazinga BET - minigame "Torre da Turma": empilhar blocos, sem aposta.
   Nao mexe no saldo - so da XP de perfil/Passe e guarda o recorde pessoal
   (BZG.storage.reportMinigameScore). Mecanica classica de stack: o bloco desliza
   de um lado a outro, clique/espaco solta e alinha com o bloco de baixo; o que
   sobrar fora do alinhamento e cortado, e cai fora se nao sobrar nada. */
(function () {
  var W = 340, H = 480;
  var BLOCK_H = 28;
  var BASE_W = 200;
  var MARGIN = 14;
  var VISIBLE = 12;
  var PERFECT_TOLERANCE = 5;
  var COLORS = ["#ff2d3a", "#ffcc00", "#ff8a00", "#2ecc71", "#00c2ff", "#b026ff"];

  var canvas, ctx, floorEl, bestEl, statusEl, actionBtn, gameoverEl, gameoverFloorsEl, gameoverSubEl, retryBtn;

  var BASE = { x: (W - BASE_W) / 2, width: BASE_W };
  var blocks = [];
  var moving = null;
  var state = "idle"; // idle | playing | gameover
  var rafId = null;
  var lastTime = 0;

  function pickColor(i) { return COLORS[i % COLORS.length]; }

  function rowY(i) {
    var shift = Math.max(0, blocks.length - VISIBLE);
    return (H - 50) - (i - shift + 1) * BLOCK_H;
  }

  function spawnMoving() {
    var belowWidth = blocks.length ? blocks[blocks.length - 1].width : BASE.width;
    var width = Math.max(18, belowWidth);
    var fromLeft = blocks.length % 2 === 0;
    moving = {
      x: fromLeft ? MARGIN : W - MARGIN - width,
      width: width,
      dir: fromLeft ? 1 : -1,
      speed: Math.min(260, 95 + blocks.length * 7),
      color: pickColor(blocks.length)
    };
  }

  function updateFloorUI() {
    if (floorEl) floorEl.textContent = String(blocks.length);
  }

  function updateBestUI() {
    if (bestEl) bestEl.textContent = BZG.storage.getMinigameBest("torre") + " andares";
  }

  function startGame() {
    blocks = [];
    state = "playing";
    spawnMoving();
    updateFloorUI();
    gameoverEl.classList.remove("visible");
    actionBtn.textContent = "Soltar bloco";
    statusEl.textContent = "Clique, aperte espaço ou use o botão para soltar o bloco na hora certa.";
    lastTime = performance.now();
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(loop);
  }

  function loop(now) {
    if (state !== "playing") return;
    var dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;

    moving.x += moving.dir * moving.speed * dt;
    if (moving.x <= MARGIN) { moving.x = MARGIN; moving.dir = 1; }
    if (moving.x + moving.width >= W - MARGIN) { moving.x = W - MARGIN - moving.width; moving.dir = -1; }

    render();
    rafId = requestAnimationFrame(loop);
  }

  function drop() {
    if (state !== "playing" || !moving) return;

    var below = blocks.length ? blocks[blocks.length - 1] : BASE;
    var overlapLeft = Math.max(moving.x, below.x);
    var overlapRight = Math.min(moving.x + moving.width, below.x + below.width);
    var overlapW = overlapRight - overlapLeft;

    if (overlapW < 6) {
      endGame();
      return;
    }

    var placed;
    if (below.width - overlapW <= PERFECT_TOLERANCE) {
      // encaixe quase perfeito: nao corta, encaixa alinhado (mais generoso e satisfatorio)
      placed = { x: below.x, width: below.width, color: moving.color };
      BZG.effects.flash(document.getElementById("torre-stage"), "gold");
    } else {
      placed = { x: overlapLeft, width: overlapW, color: moving.color };
    }

    blocks.push(placed);
    updateFloorUI();
    BZG.sounds.tick();
    spawnMoving();
  }

  function endGame() {
    state = "gameover";
    if (rafId) cancelAnimationFrame(rafId);
    render();

    var floors = blocks.length;
    var xpGain = floors * 15;
    if (xpGain > 0) BZG.storage.addXp(xpGain);
    var res = BZG.storage.reportMinigameScore("torre", floors);
    document.dispatchEvent(new CustomEvent("bzg:balance-changed"));
    if (BZG.achievements) BZG.achievements.check();

    updateBestUI();
    gameoverFloorsEl.textContent = floors + (floors === 1 ? " andar" : " andares");
    gameoverSubEl.textContent = "+" + xpGain + " XP" + (res.isNewBest ? " · 🏆 Novo recorde pessoal!" : "");
    gameoverEl.classList.add("visible");
    actionBtn.textContent = "Começar";
    statusEl.textContent = "Fim de jogo! Clique em \"Começar\" para tentar de novo.";
    BZG.sounds.lose();

    if (res.isNewBest && floors > 0) {
      var rect = canvas.getBoundingClientRect();
      BZG.effects.confetti(rect.left + rect.width / 2, rect.top + rect.height / 2, 70);
    }
  }

  function render() {
    ctx.clearRect(0, 0, W, H);

    // base
    var shift = Math.max(0, blocks.length - VISIBLE);
    var baseY = (H - 50) + shift * BLOCK_H;
    if (baseY < H) {
      ctx.fillStyle = "#4a4a55";
      ctx.fillRect(BASE.x, baseY, BASE.width, Math.min(BLOCK_H, H - baseY));
    }

    blocks.forEach(function (b, i) {
      var y = rowY(i);
      if (y < -BLOCK_H || y > H) return;
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x, y, b.width, BLOCK_H - 2);
    });

    if (moving && state === "playing") {
      var my = rowY(blocks.length);
      ctx.globalAlpha = 0.92;
      ctx.fillStyle = moving.color;
      ctx.fillRect(moving.x, my, moving.width, BLOCK_H - 2);
      ctx.globalAlpha = 1;
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    canvas = document.getElementById("torre-canvas");
    ctx = canvas.getContext("2d");
    floorEl = document.getElementById("torre-floor");
    bestEl = document.getElementById("torre-best");
    statusEl = document.getElementById("torre-status");
    actionBtn = document.getElementById("torre-action-btn");
    gameoverEl = document.getElementById("torre-gameover");
    gameoverFloorsEl = document.getElementById("torre-gameover-floors");
    gameoverSubEl = document.getElementById("torre-gameover-sub");
    retryBtn = document.getElementById("torre-retry-btn");

    updateBestUI();
    render();

    actionBtn.addEventListener("click", function () {
      if (state === "playing") drop();
      else startGame();
    });
    canvas.addEventListener("click", function () {
      if (state === "playing") drop();
    });
    retryBtn.addEventListener("click", startGame);

    document.addEventListener("keydown", function (e) {
      if (e.code === "Space" && state === "playing") {
        e.preventDefault();
        drop();
      }
    });
  });
})();
