/* Bazinga BET - logica da pagina de perfil */
(function () {
  var AVATARS = ["😎", "🔥", "👑", "🐯", "🚀", "💎", "🍀", "⚡", "🎯", "🃏", "🦈", "🤠", "😈", "🥇", "🎩", "🐺", "👽", "🤑"];
  var GAME_LABELS = {
    crash: "🛶 Canoa Furada", mines: "🥒 Mines do Picles", plinko: "🎃 Plinko da Abóbora",
    double: "🎡 Double", tower: "🗑️ Lixeira do Linden", dice: "🎲 Dado 616", hilo: "🃏 HiLo do PAnetone",
    slots: "🎰 Slots", roulette: "🎯 Roleta", blackjack: "🍑 21 do Bogão",
    bazinguinha: "🐯 Bazinguinha", raspadinha: "🎟️ Raspadinha", limbo: "📉 Limbo",
    wheel: "🎡 Roda da Sorte", coinflip: "🔋 Moeda da Pilha"
  };

  var selectedAvatar = null;

  function renderAvatarPicker() {
    var picker = document.getElementById("avatar-picker");
    picker.innerHTML = AVATARS.map(function (a) {
      return '<button class="avatar-option' + (a === selectedAvatar ? " selected" : "") + '" data-avatar="' + a + '">' + a + '</button>';
    }).join("");
    Array.prototype.forEach.call(picker.children, function (btn) {
      btn.addEventListener("click", function () {
        selectedAvatar = btn.dataset.avatar;
        document.getElementById("profile-avatar").textContent = selectedAvatar;
        renderAvatarPicker();
        BZG.sounds.click();
      });
    });
  }

  function renderLevel() {
    var lvl = BZG.storage.getLevel();
    document.getElementById("profile-level-badge").textContent = "Lv " + lvl.level;
    document.getElementById("level-label").textContent = "Nível " + lvl.level;
    document.getElementById("xp-label").textContent = lvl.into + " / " + lvl.needed + " XP para o nível " + (lvl.level + 1);
    document.getElementById("xp-fill").style.width = Math.min(100, (lvl.into / lvl.needed) * 100) + "%";
  }

  function renderStats() {
    var stats = BZG.storage.getStats();
    var grid = document.getElementById("stats-grid");
    var netProfit = stats.totalWon - stats.totalLost;

    var boxes = [
      { label: "Total apostado", value: BZG.ui.formatMoney(stats.totalWagered), cls: "" },
      { label: "Lucro líquido", value: (netProfit >= 0 ? "+" : "") + BZG.ui.formatMoney(netProfit), cls: netProfit >= 0 ? "stat-value--win" : "stat-value--lose" },
      { label: "Maior multiplicador", value: stats.bestMultiplier.toFixed(2) + "x", cls: "stat-value--gold" },
      { label: "Melhor sequência", value: stats.bestWinStreak + " vitórias", cls: "stat-value--win" },
      { label: "Ganhos hoje", value: BZG.ui.formatMoney(BZG.storage.getDailyWon()), cls: "stat-value--win" },
      { label: "XP total", value: String(BZG.storage.getLevel().xp), cls: "stat-value--gold" }
    ];

    grid.innerHTML = boxes.map(function (b) {
      return '<div class="stat-box">' +
        '<div class="stat-label">' + b.label + '</div>' +
        '<div class="stat-value ' + b.cls + '">' + b.value + '</div>' +
        '</div>';
    }).join("");
  }

  function renderRecentBets() {
    var all = [];
    Object.keys(GAME_LABELS).forEach(function (game) {
      BZG.storage.getHistory(game).forEach(function (e) {
        all.push(Object.assign({ game: game }, e));
      });
    });
    all.sort(function (a, b) { return b.time - a.time; });
    all = all.slice(0, 12);

    var el = document.getElementById("recent-bets");
    el.innerHTML = all.map(function (e) {
      var tagClass = e.won ? "tag--win" : "tag--lose";
      var tagText = e.won ? "GANHOU" : "PERDEU";
      return '<div class="history-row">' +
        '<span class="tag ' + tagClass + '">' + tagText + '</span>' +
        '<span>' + GAME_LABELS[e.game] + '</span>' +
        '<span>' + (e.multiplier ? e.multiplier.toFixed(2) + "x" : "—") + '</span>' +
        '<span>' + BZG.ui.formatMoney(e.payout) + '</span>' +
        '</div>';
    }).join("") || '<p style="color:var(--text-muted); font-size:13px;">Nenhuma aposta ainda. Vá jogar!</p>';
  }

  function saveProfile() {
    var nick = document.getElementById("nickname-input").value.trim() || "Jogador";
    BZG.storage.setProfile({ nickname: nick, avatar: selectedAvatar });
    BZG.ui.toast("Perfil salvo!", "success");
    BZG.sounds.win();

    // atualiza a sidebar sem recarregar
    var nickEl = document.getElementById("sidebar-nick");
    var avatarEl = document.getElementById("sidebar-avatar");
    if (nickEl) nickEl.textContent = nick;
    if (avatarEl) avatarEl.textContent = selectedAvatar;
  }

  function renderAchievements() {
    var el = document.getElementById("achv-grid");
    if (!el || !BZG.achievements) return;
    var unlocked = BZG.storage.getAchievements();
    var list = BZG.achievements.all();
    var got = list.filter(function (a) { return unlocked[a.id]; }).length;

    var countEl = document.getElementById("achv-count");
    if (countEl) countEl.textContent = got + "/" + list.length;

    el.innerHTML = list.map(function (a) {
      var isUnlocked = !!unlocked[a.id];
      return '<div class="achv' + (isUnlocked ? " unlocked" : "") + '" title="' + a.desc + '">' +
        '<span class="achv-icon">' + (isUnlocked ? a.icon : "🔒") + '</span>' +
        '<div class="achv-info">' +
          '<div class="achv-name">' + a.name + '</div>' +
          '<div class="achv-desc">' + a.desc + '</div>' +
        '</div>' +
      '</div>';
    }).join("");
  }

  document.addEventListener("DOMContentLoaded", function () {
    var profile = BZG.storage.getProfile();
    selectedAvatar = profile.avatar;
    document.getElementById("profile-avatar").textContent = profile.avatar;
    document.getElementById("nickname-input").value = profile.nickname;

    renderAvatarPicker();
    renderLevel();
    renderStats();
    renderRecentBets();
    renderAchievements();

    document.getElementById("save-profile-btn").addEventListener("click", saveProfile);
  });
})();
