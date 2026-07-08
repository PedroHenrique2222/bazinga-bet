/* Bazinga BET - pagina do Passe de Batalha */
(function () {
  function render() {
    var prog = BZG.battlepass.progress();
    var tiers = BZG.battlepass.tiers();

    document.getElementById("bp-tier-label").textContent = "Nível " + prog.reached + " / " + prog.total;
    document.getElementById("bp-xp-label").textContent = prog.reached >= prog.total
      ? "Passe completo! 🏆"
      : Math.round(prog.xp) + " XP · faltam " + Math.max(0, Math.round(prog.nextXp - prog.xp)) + " XP p/ o próximo";
    document.getElementById("bp-fill").style.width = prog.intoPct + "%";

    var track = document.getElementById("bp-track");
    track.innerHTML = tiers.map(function (t, i) {
      var reached = i < prog.reached;
      var claimed = BZG.storage.isTierClaimed(i);
      var cls = "bp-tier " + (claimed ? "claimed" : (reached ? "reachable" : "locked"));
      var action;
      if (claimed) {
        action = '<div class="bp-status claimed">✓ Resgatado</div>';
      } else if (reached) {
        action = '<button class="bp-claim-btn" data-tier="' + i + '">Resgatar</button>';
      } else {
        action = '<div class="bp-status locked">🔒 ' + ((i + 1) * 400) + ' XP</div>';
      }
      return '<div class="' + cls + '">' +
        '<span class="bp-lvl">Lv ' + (i + 1) + '</span>' +
        '<div class="bp-icon">' + t.icon + '</div>' +
        '<div class="bp-reward">' + t.label + '</div>' +
        action +
        '</div>';
    }).join("");

    Array.prototype.forEach.call(track.querySelectorAll(".bp-claim-btn"), function (btn) {
      btn.addEventListener("click", function () {
        var reward = BZG.battlepass.claim(Number(btn.dataset.tier));
        if (reward) {
          BZG.ui.toast("🎁 Recompensa resgatada: " + reward.label + "!", "success");
          BZG.sounds.win();
          var r = btn.getBoundingClientRect();
          BZG.effects.confetti(r.left + r.width / 2, r.top, 40);
          if (reward.r === "theme") BZG.ui.toast("Novo tema disponível nas Configurações! 🎨", "success");
          if (reward.r === "turbo") BZG.ui.toast("⚡ Modo Turbo liberado nas Configurações!", "success");
          render();
        }
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    render();
    document.getElementById("claim-all-btn").addEventListener("click", function () {
      var claimed = BZG.battlepass.claimAll();
      if (claimed.length) {
        BZG.ui.toast("🎉 " + claimed.length + " recompensa(s) resgatada(s)!", "success");
        BZG.sounds.win();
        BZG.effects.confetti(window.innerWidth / 2, window.innerHeight / 3, 80);
        render();
      } else {
        BZG.ui.toast("Nenhuma recompensa disponível para resgatar agora.", "info");
      }
    });
  });
})();
