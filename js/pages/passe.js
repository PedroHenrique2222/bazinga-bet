/* Bazinga BET - pagina do Passe de Batalha, organizada em capitulos de 10 niveis */
(function () {
  var CHAPTERS = [
    { name: "Amigos dos Bazingas", icon: "🤝" },
    { name: "BZG Abóbora", icon: "🎃" },
    { name: "BZG Panetone", icon: "🍰" },
    { name: "BZG Canoa Furada", icon: "🛶" },
    { name: "BZG 616", icon: "🪖" },
    { name: "BZG Pikles Gamer", icon: "🥒" },
    { name: "BZG Pilha Avulsa", icon: "🔋" },
    { name: "BZG Linden", icon: "🗑️" },
    { name: "BZG Bogão", icon: "🍑" },
    { name: "BZG Pitoco", icon: "🐣" }
  ];
  var TIERS_PER_CHAPTER = 10;

  /* icone do premio: avatar de personagem -> imagem do personagem; outros
     tipos -> assets/passe/premio-<tipo>.webp; sem imagem -> o emoji de sempre */
  var REWARD_TYPES = ["avatar", "color", "theme", "title", "turbo", "collectible"];
  function rewardIconHTML(t) {
    if (t.r === "avatar" && BZG.ui.avatarInfo(t.v)) {
      return '<span class="bp-icon-avatar">' + BZG.ui.avatarHTML(t.v) + '</span>';
    }
    if (REWARD_TYPES.indexOf(t.r) === -1) return t.icon;
    var img = BZG.ui.imgHTML(BZG.ui.assetPath("assets/passe/premio-" + t.r + ".webp"), {
      cls: "bp-icon-img", emoji: t.icon, fallbackCls: "bp-icon-emoji"
    });
    // avatar comum (emoji): moldura do premio + o emoji no cantinho, pra saber qual e
    if (t.r === "avatar" && img.indexOf("<img") === 0) {
      return '<span class="bp-icon-wrap">' + img + '<span class="bp-icon-badge">' + t.icon + '</span></span>';
    }
    return img;
  }

  function tierCardHTML(t, i, prog) {
    var reached = i < prog.reached;
    var claimed = BZG.storage.isTierClaimed(i);
    var cls = "bp-tier " + (claimed ? "claimed" : (reached ? "reachable" : "locked"));
    var action;
    if (claimed) {
      action = '<div class="bp-status claimed">✓ Resgatado</div>';
    } else if (reached) {
      action = '<button class="bp-claim-btn" data-tier="' + i + '">Resgatar</button>';
    } else {
      action = '<div class="bp-status locked">🔒 ' + BZG.battlepass.xpForTier(i + 1).toLocaleString("pt-BR") + ' XP</div>';
    }
    return '<div class="' + cls + '">' +
      '<span class="bp-lvl">Lv ' + (i + 1) + '</span>' +
      '<div class="bp-icon" aria-hidden="true">' + rewardIconHTML(t) + '</div>' +
      '<div class="bp-reward">' + t.label + '</div>' +
      action +
      '</div>';
  }

  function render() {
    var prog = BZG.battlepass.progress();
    var tiers = BZG.battlepass.tiers();

    document.getElementById("bp-tier-label").textContent = "Nível " + prog.reached + " / " + prog.total;
    document.getElementById("bp-xp-label").textContent = prog.reached >= prog.total
      ? "Passe completo! 🏆"
      : Math.round(prog.xp) + " XP · faltam " + Math.max(0, Math.round(prog.nextXp - prog.xp)) + " XP p/ o próximo";
    document.getElementById("bp-fill").style.width = prog.intoPct + "%";

    var currentChapter = Math.min(CHAPTERS.length - 1, Math.floor(prog.reached / TIERS_PER_CHAPTER));

    var nav = CHAPTERS.map(function (ch, ci) {
      var from = ci * TIERS_PER_CHAPTER + 1, to = from + TIERS_PER_CHAPTER - 1;
      var doneCount = 0;
      for (var i = from - 1; i < to; i++) if (BZG.storage.isTierClaimed(i)) doneCount++;
      var cls = "bp-chapter-pill" + (ci === currentChapter ? " current" : "") + (doneCount === TIERS_PER_CHAPTER ? " done" : "");
      return '<button class="' + cls + '" data-jump="chapter-' + ci + '">' + ch.icon + ' ' + (ci + 1) + '</button>';
    }).join("");
    document.getElementById("bp-chapter-nav").innerHTML = nav;

    var chaptersHTML = CHAPTERS.map(function (ch, ci) {
      var from = ci * TIERS_PER_CHAPTER, to = from + TIERS_PER_CHAPTER; // 0-based range [from, to)
      var reachedInChapter = Math.max(0, Math.min(TIERS_PER_CHAPTER, prog.reached - from));
      var claimedInChapter = 0;
      for (var i = from; i < to; i++) if (BZG.storage.isTierClaimed(i)) claimedInChapter++;

      var banner = BZG.ui.assetPath("assets/passe/capitulo-" + (ci + 1) + ".webp");
      var cards = "";
      for (var t = from; t < to; t++) cards += tierCardHTML(tiers[t], t, prog);

      return '<section class="panel bp-chapter" id="chapter-' + ci + '">' +
        '<div class="bp-chapter-head' + (BZG.ui.imgLoaded(banner) ? " bp-chapter-head--banner" : "") + '" data-img-host>' +
          BZG.ui.imgHTML(banner, {
            cls: "bp-chapter-banner", onloadCls: "bp-chapter-head--banner"
          }) +
          '<div class="bp-chapter-icon" aria-hidden="true">' + ch.icon + '</div>' +
          '<div class="bp-chapter-info">' +
            '<h2>Capítulo ' + (ci + 1) + ': ' + ch.name + '</h2>' +
            '<p>Níveis ' + (from + 1) + '–' + to + '</p>' +
          '</div>' +
          '<div class="bp-chapter-progress">' +
            claimedInChapter + ' / ' + TIERS_PER_CHAPTER + ' resgatados' +
            '<span class="bp-chapter-bonus">🎴 Figurinha nova ao completar</span>' +
          '</div>' +
        '</div>' +
        '<div class="bp-track">' + cards + '</div>' +
      '</section>';
    }).join("");
    document.getElementById("bp-chapters").innerHTML = chaptersHTML;

    Array.prototype.forEach.call(document.querySelectorAll(".bp-claim-btn"), function (btn) {
      btn.addEventListener("click", function () {
        var reward = BZG.battlepass.claim(Number(btn.dataset.tier));
        if (reward) {
          BZG.ui.toast("🎁 Recompensa resgatada: " + reward.label + "!", "success");
          BZG.sounds.win();
          var r = btn.getBoundingClientRect();
          BZG.effects.confetti(r.left + r.width / 2, r.top, 40);
          if (reward.r === "theme") BZG.ui.toast("Novo tema disponível nas Configurações! 🎨", "success");
          if (reward.r === "turbo") BZG.ui.toast("⚡ Modo Turbo liberado nas Configurações!", "success");
          if (reward.r === "collectible") BZG.ui.toast("🎴 Nova figurinha guardada na sua Coleção!", "success");
          if (reward.chapterBonus) {
            setTimeout(function () {
              BZG.ui.toast("🎉 Capítulo completo! Figurinha nova na sua Coleção!", "success");
            }, 500);
          }
          render();
        }
      });
    });

    Array.prototype.forEach.call(document.querySelectorAll(".bp-chapter-pill"), function (btn) {
      btn.addEventListener("click", function () {
        var target = document.getElementById(btn.dataset.jump);
        if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
        BZG.sounds.click();
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    render();
    document.getElementById("claim-all-btn").addEventListener("click", function () {
      var result = BZG.battlepass.claimAll();
      if (result.claimed.length) {
        BZG.ui.toast("🎉 " + result.claimed.length + " recompensa(s) resgatada(s)!", "success");
        BZG.sounds.win();
        BZG.effects.confetti(window.innerWidth / 2, window.innerHeight / 3, 80);
        if (result.chapterBonus) {
          setTimeout(function () {
            BZG.ui.toast("🎉 Capítulo(s) completo(s)! +" + result.chapterBonus + " figurinha(s) nova(s)!", "success");
          }, 600);
        }
        render();
      } else {
        BZG.ui.toast("Nenhuma recompensa disponível para resgatar agora.", "info");
      }
    });
  });
})();
