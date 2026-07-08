/* Bazinga BET - minigame "Sequencia Arco-iris" (Simon Says), sem aposta.
   Memoriza e repete uma sequencia de cores que cresce a cada rodada. */
(function () {
  var PAD_COUNT = 6;
  var FLASH_MS_BASE = 550;
  var FLASH_MS_MIN = 260;

  var pads, roundEl, bestEl, statusEl, actionBtn, gameoverEl, gameoverRoundsEl, gameoverSubEl, retryBtn;

  var sequence = [];
  var playerIndex = 0;
  var state = "idle"; // idle | showing | input | gameover

  function updateRoundUI() {
    roundEl.textContent = String(sequence.length);
  }

  function updateBestUI() {
    bestEl.textContent = BZG.storage.getMinigameBest("rainbow") + " rodadas";
  }

  function flashSpeed() {
    return Math.max(FLASH_MS_MIN, FLASH_MS_BASE - sequence.length * 18);
  }

  function litPad(index, on) {
    pads[index].classList.toggle("lit", on);
  }

  function playSequence() {
    state = "showing";
    statusEl.textContent = "Observe a sequência...";
    var i = 0;
    var speed = flashSpeed();
    function step() {
      if (i > 0) litPad(sequence[i - 1], false);
      if (i >= sequence.length) {
        state = "input";
        playerIndex = 0;
        statusEl.textContent = "Sua vez! Repita a sequência.";
        return;
      }
      litPad(sequence[i], true);
      BZG.sounds.tick();
      i++;
      setTimeout(step, speed);
    }
    setTimeout(step, 500);
  }

  function nextRound() {
    sequence.push(Math.floor(Math.random() * PAD_COUNT));
    updateRoundUI();
    playSequence();
  }

  function startGame() {
    sequence = [];
    gameoverEl.classList.remove("visible");
    actionBtn.textContent = "Reiniciar";
    nextRound();
  }

  function padClick(index) {
    if (state !== "input") return;
    if (sequence[playerIndex] === index) {
      litPad(index, true);
      BZG.sounds.tick();
      setTimeout(function () { litPad(index, false); }, 180);
      playerIndex++;
      if (playerIndex >= sequence.length) {
        state = "showing"; // trava input ate a proxima sequencia comecar
        setTimeout(nextRound, 700);
      }
    } else {
      endGame();
    }
  }

  function endGame() {
    state = "gameover";
    var rounds = sequence.length - 1; // ultima rodada nao foi completada
    if (rounds < 0) rounds = 0;

    var xpGain = rounds * 10;
    if (xpGain > 0) BZG.storage.addXp(xpGain);
    var res = BZG.storage.reportMinigameScore("rainbow", rounds);
    document.dispatchEvent(new CustomEvent("bzg:balance-changed"));
    if (BZG.achievements) BZG.achievements.check();

    updateBestUI();
    gameoverRoundsEl.textContent = rounds + (rounds === 1 ? " rodada" : " rodadas");
    gameoverSubEl.textContent = "+" + xpGain + " XP" + (res.isNewBest ? " · 🏆 Novo recorde pessoal!" : "");
    gameoverEl.classList.add("visible");
    actionBtn.textContent = "Começar";
    statusEl.textContent = "Fim de jogo! Clique em \"Começar\" para tentar de novo.";
    BZG.sounds.lose();

    if (res.isNewBest && rounds > 0) {
      var rect = document.getElementById("arco-grid").getBoundingClientRect();
      BZG.effects.confetti(rect.left + rect.width / 2, rect.top + rect.height / 2, 70);
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    pads = Array.prototype.slice.call(document.querySelectorAll(".arco-pad"));
    roundEl = document.getElementById("arco-round");
    bestEl = document.getElementById("arco-best");
    statusEl = document.getElementById("arco-status");
    actionBtn = document.getElementById("arco-action-btn");
    gameoverEl = document.getElementById("arco-gameover");
    gameoverRoundsEl = document.getElementById("arco-gameover-rounds");
    gameoverSubEl = document.getElementById("arco-gameover-sub");
    retryBtn = document.getElementById("arco-retry-btn");

    updateBestUI();

    pads.forEach(function (pad, i) {
      pad.addEventListener("click", function () { padClick(i); });
    });
    actionBtn.addEventListener("click", startGame);
    retryBtn.addEventListener("click", startGame);
  });
})();
