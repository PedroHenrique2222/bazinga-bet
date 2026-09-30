/* Bazinga BET - micro-interacoes do site todo (v1.22):
   - ondinha de toque nos botoes (.btn)
   - cards do lobby: inclinacao 3D + reflexo que segue o mouse (so em mouse/caneta)
   - faixa de conquista desbloqueada (fila; espera a tela de vitoria fechar)
   Tudo por delegacao de eventos, entao vale pra conteudo criado depois (ex.: cards
   renderizados pelo lobby.js). Respeita "reduzir movimento" via BZG.motion. */
window.BZG = window.BZG || {};

BZG.micro = (function () {
  function reduced() { return BZG.motion ? BZG.motion.reduced() : false; }
  var finePointer = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---------- Ondinha nos botoes ---------- */

  document.addEventListener("pointerdown", function (e) {
    var btn = e.target.closest && e.target.closest(".btn");
    if (!btn || btn.disabled || reduced()) return;
    var r = btn.getBoundingClientRect();
    var size = Math.max(r.width, r.height) * 2.2;
    var ink = document.createElement("span");
    ink.className = "btn-ripple";
    ink.style.width = ink.style.height = size + "px";
    ink.style.left = (e.clientX - r.left - size / 2) + "px";
    ink.style.top = (e.clientY - r.top - size / 2) + "px";
    btn.appendChild(ink);
    setTimeout(function () { ink.remove(); }, 650);
  }, { passive: true });

  /* ---------- Cards do lobby: inclinacao 3D + reflexo ---------- */

  var tiltCard = null, tiltRaf = 0, lastEvt = null;

  function applyTilt() {
    tiltRaf = 0;
    if (!tiltCard || !lastEvt) return;
    var r = tiltCard.getBoundingClientRect();
    var px = (lastEvt.clientX - r.left) / r.width;   // 0..1
    var py = (lastEvt.clientY - r.top) / r.height;   // 0..1
    tiltCard.style.setProperty("--rx", ((0.5 - py) * 10).toFixed(2) + "deg");
    tiltCard.style.setProperty("--ry", ((px - 0.5) * 12).toFixed(2) + "deg");
    tiltCard.style.setProperty("--mx", (px * 100).toFixed(1) + "%");
    tiltCard.style.setProperty("--my", (py * 100).toFixed(1) + "%");
  }

  function resetTilt(card) {
    card.classList.remove("is-tilting");
    card.style.removeProperty("--rx");
    card.style.removeProperty("--ry");
  }

  if (finePointer) {
    document.addEventListener("pointermove", function (e) {
      var card = e.target.closest && e.target.closest(".game-card:not(.game-card--dev)");
      if (card !== tiltCard) {
        if (tiltCard) resetTilt(tiltCard);
        tiltCard = card;
        if (card && !reduced()) card.classList.add("is-tilting");
      }
      if (!card || reduced()) return;
      lastEvt = e;
      if (!tiltRaf) tiltRaf = requestAnimationFrame(applyTilt);
    }, { passive: true });
    document.addEventListener("pointerleave", function () {
      if (tiltCard) resetTilt(tiltCard);
      tiltCard = null;
    });
  }

  /* ---------- Faixa de conquista ---------- */

  var achvQueue = [];
  var achvShowing = false;

  function achievement(a) {
    achvQueue.push(a);
    if (!achvShowing) nextAchievement();
  }

  function nextAchievement() {
    var a = achvQueue.shift();
    if (!a) { achvShowing = false; return; }
    achvShowing = true;
    var run = function () { showAchievement(a, function () { setTimeout(nextAchievement, 180); }); };
    if (BZG.effects && BZG.effects.afterCelebration) BZG.effects.afterCelebration(run);
    else run();
  }

  function showAchievement(a, done) {
    var esc = BZG.ui ? BZG.ui.escapeHtml : function (s) { return s; };
    var el = document.createElement("div");
    el.className = "achv-banner";
    el.setAttribute("role", "status");
    el.innerHTML =
      '<div class="achv-banner-medal"><span>' + esc(a.icon) + '</span></div>' +
      '<div class="achv-banner-text">' +
        '<div class="achv-banner-label">Conquista desbloqueada</div>' +
        '<div class="achv-banner-name">' + esc(a.name) + '</div>' +
        (a.desc ? '<div class="achv-banner-desc">' + esc(a.desc) + '</div>' : '') +
      '</div>';
    document.body.appendChild(el);
    requestAnimationFrame(function () { el.classList.add("show"); });
    if (BZG.sounds && BZG.sounds.achievement) BZG.sounds.achievement();

    var closed = false;
    function close() {
      if (closed) return;
      closed = true;
      el.classList.remove("show");
      el.classList.add("hide");
      setTimeout(function () { el.remove(); done(); }, 380);
    }
    el.addEventListener("click", close);
    setTimeout(close, BZG.motion ? Math.max(1600, BZG.motion.dur(3.4) * 1000) : 3400);
  }

  return { achievement: achievement };
})();
