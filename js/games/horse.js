/* Bazinga BET - Corrida de Cavalos da equipe BZG.
   Simples: aposte num corredor. Se ele vencer, o premio e 2x a aposta (sem odds
   diferentes por corredor). O seu corredor vence com P_WIN -> RTP = 2*P_WIN. */
(function () {
  var PAYOUT = 2;        // premio = 2x a aposta quando o seu corredor vence
  var P_WIN = 0.48;      // chance do seu corredor vencer (RTP ~96%, casa fica com ~4%)

  /* corredores da equipe BZG (todos com a mesma chance para o jogador) */
  var HORSES = [
    { name: "BZG Abóbora", emoji: "🎃", img: "abobora" },
    { name: "BZG Pikles", emoji: "🥒", img: "pikles" },
    { name: "BZG 616", emoji: "🔢", img: "seis16" },
    { name: "BZG Panetone", emoji: "🍞", img: "panetone" },
    { name: "BZG Pilha", emoji: "🔋", img: "pilha" },
    { name: "BZG Bogão", emoji: "🍑", img: "bogao" }
  ];

  /* imagens opcionais do Codex (plano B: emoji e visual atual) */
  var IMG_DIR = "../assets/jogos/horse/";
  var IMG_FUNDO = IMG_DIR + "fundo.webp";
  var imgOk = HORSES.map(function () { return false; });
  var pendingArt = false; // imagens chegaram no meio da corrida: aplica no fim

  function imgPath(i) { return IMG_DIR + HORSES[i].img + ".webp"; }

  var betInput, raceBtn, statusEl, historyListEl, picksEl, trackEl, stageEl;
  var selected = -1;
  var racing = false;
  var laneEls = [], runnerEls = [];

  function setStatus(t) { statusEl.textContent = t; }
  function spd(ms) { return ms * BZG.modes.speed(); }

  function renderPicks() {
    picksEl.innerHTML = HORSES.map(function (h, i) {
      return '<button class="horse-pick' + (i === selected ? " selected" : "") + '" data-i="' + i + '">' +
        (imgOk[i]
          ? '<img class="pick-img" src="' + imgPath(i) + '" alt="" />'
          : '<span class="emoji">' + h.emoji + '</span>') +
        '<span class="name">' + h.name + '</span>' +
        '<span class="odds">2x</span>' +
      '</button>';
    }).join("");
    Array.prototype.forEach.call(picksEl.children, function (btn) {
      btn.addEventListener("click", function () {
        if (racing) return;
        selected = Number(btn.dataset.i);
        renderPicks();
        markMine();
        BZG.sounds.click();
      });
    });
  }

  function buildTrack() {
    trackEl.innerHTML = HORSES.map(function (h, i) {
      return '<div class="lane" data-i="' + i + '">' +
        '<div class="lane-finish"></div>' +
        (imgOk[i]
          ? '<div class="runner has-img"><img class="runner-img" src="' + imgPath(i) + '" alt="" /></div>'
          : '<div class="runner"><span>🏇</span><span class="tag">' + h.emoji + '</span></div>') +
      '</div>';
    }).join("");
    laneEls = Array.prototype.slice.call(trackEl.querySelectorAll(".lane"));
    runnerEls = Array.prototype.slice.call(trackEl.querySelectorAll(".runner"));
    setPositions(HORSES.map(function () { return 0; }));
    markMine();
  }

  function markMine() {
    laneEls.forEach(function (l, i) {
      l.classList.toggle("mine", i === selected);
      l.classList.remove("winner");
    });
  }

  function setPositions(progs) {
    for (var i = 0; i < runnerEls.length; i++) {
      var lane = laneEls[i];
      var travel = lane.clientWidth - (imgOk[i] ? Math.max(52, runnerEls[i].offsetWidth + 14) : 52); // largura util
      runnerEls[i].style.transform = "translateX(" + (progs[i] * travel) + "px)";
    }
  }

  function renderHistory() {
    var entries = BZG.storage.getHistory("horse");
    historyListEl.innerHTML = entries.slice(0, 8).map(function (e) {
      var tagClass = e.won ? "tag--win" : "tag--lose";
      var tagText = e.won ? "GANHOU" : "PERDEU";
      return '<div class="history-row">' +
        '<span class="tag ' + tagClass + '">' + tagText + '</span>' +
        '<span>' + (e.detail || "") + '</span>' +
        '<span>' + BZG.ui.formatMoney(e.payout) + '</span>' +
        '</div>';
    }).join("") || '<p style="color:var(--text-muted); font-size:13px;">Nenhuma corrida ainda.</p>';
  }

  function randomOther(exclude) {
    var i;
    do { i = Math.floor(Math.random() * HORSES.length); } while (i === exclude);
    return i;
  }

  function easeOut(t) { return 1 - Math.pow(1 - t, 2.2); }

  function race() {
    if (racing) return;
    if (selected < 0) { BZG.ui.toast("Escolha um corredor.", "error"); return; }
    var bet = Math.round(Number(betInput.value));
    var balance = BZG.storage.getBalance();
    if (!bet || bet <= 0) { BZG.ui.toast("Digite um valor de aposta válido.", "error"); return; }
    if (bet > balance) { BZG.ui.toast("Você não tem saldo suficiente.", "error"); return; }

    racing = true;
    betInput.disabled = true;
    raceBtn.disabled = true;
    picksEl.style.pointerEvents = "none";
    setStatus("E lá vão eles!");
    stageEl.classList.add("is-racing");
    BZG.sounds.bet();
    BZG.sounds.raceStart();

    // o seu corredor vence com P_WIN; senao vence um outro qualquer
    var won = Math.random() < P_WIN;
    var winner = won ? selected : randomOther(selected);
    // duracoes: o vencedor termina primeiro; os demais um pouco depois
    var winDur = spd(3400);
    var durs = HORSES.map(function (_, i) {
      return i === winner ? winDur : winDur + spd(250 + Math.random() * 1600);
    });
    var phase = HORSES.map(function () { return Math.random() * Math.PI * 2; });

    var start = performance.now();
    var lastTick = 0;

    function frame(now) {
      var elapsed = now - start;
      var progs = HORSES.map(function (h, i) {
        var base = easeOut(Math.min(1, elapsed / durs[i]));
        // pequeno vaivem para dar emocao, sem passar de ~0.98 antes do fim
        var jitter = Math.sin(elapsed / 220 + phase[i]) * 0.012;
        return Math.max(0, Math.min(1, base + (base < 0.97 ? jitter : 0)));
      });
      setPositions(progs);

      // galope: batidas de casco em ritmo, mais intensas perto da chegada
      if (now - lastTick > 95) { BZG.sounds.hoof(0.5 + 0.5 * Math.min(1, elapsed / winDur)); lastTick = now; }

      if (elapsed >= winDur) {
        setPositions(HORSES.map(function (_, i) { return i === winner ? 1 : Math.min(0.97, easeOut(elapsed / durs[i])); }));
        finish(winner, bet);
      } else {
        requestAnimationFrame(frame);
      }
    }
    requestAnimationFrame(frame);
  }

  function finish(winner, bet) {
    stageEl.classList.remove("is-racing");
    laneEls[winner].classList.add("winner");
    BZG.sounds.crowdCheer();
    var won = winner === selected;
    var payout = won ? bet * PAYOUT : 0;

    BZG.storage.recordBet("horse", {
      bet: bet, multiplier: won ? PAYOUT : 0, payout: payout, won: won,
      detail: "🏆 " + HORSES[winner].emoji + " " + HORSES[winner].name
    });
    BZG.ui.refreshBalance();
    document.dispatchEvent(new CustomEvent("bzg:balance-changed"));
    renderHistory();

    if (won) {
      setStatus("🏆 " + HORSES[winner].name + " venceu! +" + BZG.ui.formatMoney(payout));
      BZG.ui.toast("Seu corredor venceu! +" + BZG.ui.formatMoney(payout), "success");
      BZG.sounds.winFor(PAYOUT);
      BZG.effects.flash(stageEl, "gold");
      var r = stageEl.getBoundingClientRect();
      BZG.effects.confetti(r.left + r.width / 2, r.top + r.height / 2, 60);
      if (payout >= 2500) BZG.effects.bigWin(payout, PAYOUT);
    } else {
      setStatus("Venceu " + HORSES[winner].name + ". Não foi dessa vez.");
      BZG.sounds.lose();
      BZG.effects.flash(stageEl, "red");
    }

    racing = false;
    betInput.disabled = false;
    raceBtn.disabled = false;
    picksEl.style.pointerEvents = "";
    if (pendingArt) {
      // aplica as imagens sem apagar o destaque do vencedor
      pendingArt = false;
      renderPicks();
      buildTrack();
      laneEls[winner].classList.add("winner");
    }
  }

  function loadImages() {
    if (!BZG.assets) return;
    var list = [IMG_FUNDO].concat(HORSES.map(function (_, i) { return imgPath(i); }));
    BZG.assets.preload(list, function (ok) {
      if (ok[IMG_FUNDO]) {
        var url = IMG_FUNDO;
        try { url = new URL(IMG_FUNDO, document.baseURI).href; } catch (e) {}
        stageEl.style.setProperty("--stage-fundo", 'url("' + url + '")');
        stageEl.classList.add("has-bg");
      }
      var any = false;
      HORSES.forEach(function (_, i) { if (ok[imgPath(i)]) { imgOk[i] = true; any = true; } });
      if (!any) return;
      if (racing) { pendingArt = true; return; }
      renderPicks();
      buildTrack();
    });
  }

  function quickBet(fn) {
    var current = Number(betInput.value) || 0;
    betInput.value = Math.max(1, Math.round(fn(current, BZG.storage.getBalance())));
  }

  document.addEventListener("DOMContentLoaded", function () {
    betInput = document.getElementById("bet-amount");
    raceBtn = document.getElementById("race-btn");
    statusEl = document.getElementById("round-status");
    historyListEl = document.getElementById("history-list");
    picksEl = document.getElementById("horse-picks");
    trackEl = document.getElementById("track");
    stageEl = document.getElementById("horse-stage");

    renderPicks();
    buildTrack();
    BZG.ui.refreshBalance();
    renderHistory();
    window.addEventListener("resize", function () { if (!racing) setPositions(HORSES.map(function () { return 0; })); });

    raceBtn.addEventListener("click", race);
    document.getElementById("bet-half").addEventListener("click", function () { quickBet(function (v) { return v / 2; }); });
    document.getElementById("bet-double").addEventListener("click", function () { quickBet(function (v) { return v * 2; }); });
    document.getElementById("bet-max").addEventListener("click", function () { quickBet(function (v, b) { return Math.floor(b); }); });
    loadImages();
  });
})();
