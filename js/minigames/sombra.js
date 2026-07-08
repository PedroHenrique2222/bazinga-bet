/* Bazinga BET - minigame "Sombra Rapida" (reflexo/whack-a-mole), sem aposta.
   Um olho aparece rapidamente em uma celula aleatoria do grid escuro; clique
   nele antes que suma. 30 segundos por rodada, pontuacao = numero de acertos. */
(function () {
  var GRID_SIZE = 16;
  var ROUND_SECONDS = 30;

  var grid, tiles, timerEl, scoreEl, bestEl, statusEl, actionBtn, gameoverEl, gameoverScoreEl, gameoverSubEl, retryBtn;

  var state = "idle"; // idle | playing | gameover
  var timeLeft = ROUND_SECONDS;
  var score = 0;
  var litIndex = -1;
  var tickIntervalId = null;
  var spawnTimeoutId = null;
  var hideTimeoutId = null;

  function buildGrid() {
    grid.innerHTML = "";
    tiles = [];
    for (var i = 0; i < GRID_SIZE; i++) {
      var btn = document.createElement("button");
      btn.className = "sombra-tile";
      btn.dataset.index = i;
      (function (idx) {
        btn.addEventListener("click", function () { tileClick(idx); });
      })(i);
      grid.appendChild(btn);
      tiles.push(btn);
    }
  }

  function updateScoreUI() { scoreEl.textContent = String(score); }
  function updateTimerUI() { timerEl.textContent = timeLeft + "s"; }
  function updateBestUI() { bestEl.textContent = BZG.storage.getMinigameBest("shadow") + " acertos"; }

  function clearLit() {
    if (litIndex !== -1) tiles[litIndex].classList.remove("lit");
    litIndex = -1;
  }

  function spawnNext() {
    if (state !== "playing") return;
    var delay = 250 + Math.random() * 400;
    spawnTimeoutId = setTimeout(function () {
      if (state !== "playing") return;
      var idx;
      do { idx = Math.floor(Math.random() * GRID_SIZE); } while (idx === litIndex);
      litIndex = idx;
      tiles[idx].classList.add("lit");
      var elapsed = ROUND_SECONDS - timeLeft;
      var visibleMs = Math.max(320, 900 - elapsed * 18);
      hideTimeoutId = setTimeout(function () {
        if (litIndex === idx) {
          tiles[idx].classList.remove("lit");
          litIndex = -1;
        }
        spawnNext();
      }, visibleMs);
    }, delay);
  }

  function tileClick(index) {
    if (state !== "playing" || index !== litIndex) return;
    clearTimeout(hideTimeoutId);
    clearLit();
    score++;
    updateScoreUI();
    BZG.sounds.tick();
    spawnNext();
  }

  function startGame() {
    state = "playing";
    timeLeft = ROUND_SECONDS;
    score = 0;
    clearLit();
    updateScoreUI();
    updateTimerUI();
    gameoverEl.classList.remove("visible");
    actionBtn.textContent = "Reiniciar";
    statusEl.textContent = "Vai! Clique nos olhos assim que aparecerem.";

    clearInterval(tickIntervalId);
    tickIntervalId = setInterval(function () {
      timeLeft--;
      updateTimerUI();
      if (timeLeft <= 0) endGame();
    }, 1000);

    spawnNext();
  }

  function endGame() {
    state = "gameover";
    clearInterval(tickIntervalId);
    clearTimeout(spawnTimeoutId);
    clearTimeout(hideTimeoutId);
    clearLit();

    var xpGain = score * 8;
    if (xpGain > 0) BZG.storage.addXp(xpGain);
    var res = BZG.storage.reportMinigameScore("shadow", score);
    document.dispatchEvent(new CustomEvent("bzg:balance-changed"));
    if (BZG.achievements) BZG.achievements.check();

    updateBestUI();
    gameoverScoreEl.textContent = score + (score === 1 ? " acerto" : " acertos");
    gameoverSubEl.textContent = "+" + xpGain + " XP" + (res.isNewBest ? " · 🏆 Novo recorde pessoal!" : "");
    gameoverEl.classList.add("visible");
    actionBtn.textContent = "Começar";
    statusEl.textContent = "Tempo esgotado! Clique em \"Começar\" para tentar de novo.";
    BZG.sounds.lose();

    if (res.isNewBest && score > 0) {
      var rect = grid.getBoundingClientRect();
      BZG.effects.confetti(rect.left + rect.width / 2, rect.top + rect.height / 2, 70);
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    grid = document.getElementById("sombra-grid");
    timerEl = document.getElementById("sombra-timer");
    scoreEl = document.getElementById("sombra-score");
    bestEl = document.getElementById("sombra-best");
    statusEl = document.getElementById("sombra-status");
    actionBtn = document.getElementById("sombra-action-btn");
    gameoverEl = document.getElementById("sombra-gameover");
    gameoverScoreEl = document.getElementById("sombra-gameover-score");
    gameoverSubEl = document.getElementById("sombra-gameover-sub");
    retryBtn = document.getElementById("sombra-retry-btn");

    buildGrid();
    updateBestUI();

    actionBtn.addEventListener("click", startGame);
    retryBtn.addEventListener("click", startGame);
  });
})();
