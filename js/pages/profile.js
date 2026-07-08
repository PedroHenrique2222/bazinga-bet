/* Bazinga BET - logica da pagina de perfil */
(function () {
  // 👽 saiu da lista base: agora e exclusivo de quem completa o album do Alien Jo na Colecao (ou do Passe, tier 27)
  var AVATARS = ["😎", "🔥", "👑", "🐯", "🚀", "💎", "🍀", "⚡", "🎯", "🃏", "🦈", "🤠", "😈", "🥇", "🎩", "🐺", "🤑"];
  var GAME_LABELS = {
    crash: "🛶 Canoa Furada", mines: "🥒 Mines do Pikles", plinko: "🎃 Plinko da Abóbora",
    double: "🎡 Double", tower: "🗑️ Lixeira do Linden", dice: "🎲 Dado 616", hilo: "🃏 HiLo do Panetone",
    roulette: "🎯 Roleta", blackjack: "🍑 21 do Bogão",
    bazinguinha: "🐯 Bazinguinha", raspadinha: "🎟️ Raspadinha", limbo: "📉 Limbo",
    coinflip: "🔋 Moeda da Pilha",
    bonanza: "💎 Bazinga Bonanza", horse: "🏇 Corrida BZG"
  };

  var selectedAvatar = null;

  /* mapeia value (avatar/cor/titulo/tema) -> nivel do Passe que da esse item,
     lendo o catalogo publico de tiers (nao precisa mexer no battlepass.js) */
  function battlepassSourceMaps() {
    var maps = { avatar: {}, color: {}, theme: {}, title: {} };
    if (!BZG.battlepass) return maps;
    BZG.battlepass.tiers().forEach(function (t, i) {
      if (maps[t.r]) maps[t.r][t.v] = i + 1;
    });
    return maps;
  }

  function collectibleCharacterForAvatar(avatar) {
    if (!BZG.collectibles) return null;
    var found = null;
    BZG.collectibles.characters().forEach(function (c) {
      if (c.avatar === avatar) found = c;
    });
    return found;
  }

  function lockLabelFor(kind, value, sources) {
    var ways = [];
    if (sources[kind][value]) ways.push("Passe de Batalha · Nível " + sources[kind][value]);
    if (kind === "avatar") {
      var char = collectibleCharacterForAvatar(value);
      if (char) ways.push("Coleção · complete o álbum de " + char.name);
    }
    return ways.length ? ways.join(" OU ") : "Bloqueado";
  }

  function avatarCatalog() {
    var cos = BZG.storage.getCosmetics();
    var sources = battlepassSourceMaps();
    var seen = {}, list = [];
    function add(value, isBase) {
      if (seen[value]) return;
      seen[value] = true;
      var unlocked = isBase || (cos.avatars || []).indexOf(value) !== -1;
      list.push({ value: value, unlocked: unlocked, lockLabel: unlocked ? null : lockLabelFor("avatar", value, sources) });
    }
    AVATARS.forEach(function (a) { add(a, true); });
    Object.keys(sources.avatar).forEach(function (a) { add(a, false); });
    if (BZG.collectibles) BZG.collectibles.characters().forEach(function (c) { add(c.avatar, false); });
    return list;
  }

  function colorCatalog() {
    var cos = BZG.storage.getCosmetics();
    var sources = battlepassSourceMaps();
    var seen = {}, list = [];
    function add(value, isBase) {
      if (seen[value]) return;
      seen[value] = true;
      var unlocked = isBase || (cos.nameColors || []).indexOf(value) !== -1;
      list.push({ value: value, unlocked: unlocked, lockLabel: unlocked ? null : lockLabelFor("color", value, sources) });
    }
    add("default", true);
    Object.keys(sources.color).forEach(function (c) { add(c, false); });
    return list;
  }

  function titleCatalog() {
    var cos = BZG.storage.getCosmetics();
    var sources = battlepassSourceMaps();
    var seen = {}, list = [];
    function add(value, isBase) {
      if (seen[value]) return;
      seen[value] = true;
      var unlocked = isBase || (cos.titles || []).indexOf(value) !== -1;
      list.push({ value: value, unlocked: unlocked, lockLabel: unlocked ? null : lockLabelFor("title", value, sources) });
    }
    add("", true);
    Object.keys(sources.title).forEach(function (t) { add(t, false); });
    return list;
  }

  function themeCatalog() {
    var cos = BZG.storage.getCosmetics();
    var sources = battlepassSourceMaps();
    return Object.keys(BZG.theme.THEMES).map(function (id) {
      var meta = BZG.theme.THEMES[id];
      var unlocked = meta.free || (cos.themes || []).indexOf(id) !== -1;
      return { value: id, meta: meta, unlocked: unlocked, lockLabel: unlocked ? null : lockLabelFor("theme", id, sources) };
    });
  }

  function renderAvatarPicker() {
    var picker = document.getElementById("avatar-picker");
    var list = avatarCatalog();
    picker.innerHTML = list.map(function (a) {
      if (!a.unlocked) {
        return '<button class="avatar-option locked" disabled title="🔒 ' + BZG.ui.escapeHtml(a.lockLabel) + '">' +
          '<span class="opt-icon">' + a.value + '</span><span class="lock-badge">🔒</span></button>';
      }
      var sel = a.value === selectedAvatar ? " selected" : "";
      return '<button class="avatar-option' + sel + '" data-avatar="' + a.value + '"><span class="opt-icon">' + a.value + '</span></button>';
    }).join("");
    Array.prototype.forEach.call(picker.querySelectorAll(".avatar-option:not(.locked)"), function (btn) {
      btn.addEventListener("click", function () {
        selectedAvatar = btn.dataset.avatar;
        document.getElementById("profile-avatar").textContent = selectedAvatar;
        renderAvatarPicker();
        BZG.sounds.click();
      });
    });
  }

  /* seletor de cor do nome (base + desbloqueadas + bloqueadas com cadeado) */
  function renderNameColorPicker() {
    var wrap = document.getElementById("namecolor-picker");
    if (!wrap) return;
    var cos = BZG.storage.getCosmetics();
    var nick = document.getElementById("nickname-input").value.trim() || "Você";
    var list = colorCatalog();
    wrap.innerHTML = list.map(function (c) {
      var cls = c.value === "default" ? "" : " color-" + c.value;
      var label = c.value === "default" ? "Padrão" : BZG.battlepass.colorLabel(c.value);
      if (!c.unlocked) {
        return '<button class="color-option locked" disabled title="🔒 ' + BZG.ui.escapeHtml(c.lockLabel) + '">' +
          '<span class="bzg-name">' + BZG.ui.escapeHtml(label) + '</span><span class="lock-badge">🔒</span></button>';
      }
      var sel = cos.nameColor === c.value ? " selected" : "";
      return '<button class="color-option' + sel + '" data-color="' + c.value + '">' +
        '<span class="bzg-name' + cls + '">' + BZG.ui.escapeHtml(label) + '</span></button>';
    }).join("");
    Array.prototype.forEach.call(wrap.querySelectorAll(".color-option:not(.locked)"), function (btn) {
      btn.addEventListener("click", function () {
        BZG.storage.setCosmetic("nameColor", btn.dataset.color);
        renderNameColorPicker();
        var tn = document.getElementById("topbar-profile-name");
        if (tn) tn.innerHTML = BZG.ui.nameHTML(nick);
        BZG.sounds.click();
      });
    });
  }

  /* seletor de titulo (base "Nenhum" + desbloqueados + bloqueados com cadeado) */
  function renderTitlePicker() {
    var wrap = document.getElementById("title-picker");
    if (!wrap) return;
    var cos = BZG.storage.getCosmetics();
    var list = titleCatalog();
    wrap.innerHTML = list.map(function (t) {
      var label = t.value === "" ? "Nenhum" : BZG.battlepass.titleLabel(t.value);
      if (!t.unlocked) {
        return '<button class="title-option locked" disabled title="🔒 ' + BZG.ui.escapeHtml(t.lockLabel) + '">' +
          BZG.ui.escapeHtml(label) + '<span class="lock-badge">🔒</span></button>';
      }
      var sel = cos.title === t.value ? " selected" : "";
      return '<button class="title-option' + sel + '" data-title="' + t.value + '">' + BZG.ui.escapeHtml(label) + '</button>';
    }).join("");
    Array.prototype.forEach.call(wrap.querySelectorAll(".title-option:not(.locked)"), function (btn) {
      btn.addEventListener("click", function () {
        BZG.storage.setCosmetic("title", btn.dataset.title);
        renderTitlePicker();
        BZG.sounds.click();
      });
    });
  }

  /* mostruario de temas (o troca-tema de verdade continua nas Configuracoes/topbar) */
  function renderThemePicker() {
    var wrap = document.getElementById("theme-picker");
    if (!wrap) return;
    var current = BZG.theme.get();
    var list = themeCatalog();
    wrap.innerHTML = list.map(function (t) {
      var cls = "theme-option" + (t.value === current ? " selected" : "") + (t.unlocked ? "" : " locked");
      return '<button class="' + cls + '"' + (t.unlocked ? ' data-theme-id="' + t.value + '"' : ' disabled title="🔒 ' + BZG.ui.escapeHtml(t.lockLabel) + '"') + '>' +
        '<span class="opt-icon">' + t.meta.icon + '</span>' +
        '<span class="theme-option-name">' + BZG.ui.escapeHtml(t.meta.name) + '</span>' +
        (t.unlocked ? "" : '<span class="lock-badge">🔒</span>') +
        '</button>';
    }).join("");
    Array.prototype.forEach.call(wrap.querySelectorAll(".theme-option:not(.locked)"), function (btn) {
      btn.addEventListener("click", function () {
        BZG.theme.set(btn.dataset.themeId);
        renderThemePicker();
        BZG.sounds.click();
      });
    });
  }

  function renderCollectionSummary() {
    var el = document.getElementById("collection-summary");
    if (!el || !BZG.collectibles) return;
    var total = BZG.collectibles.totalOwned() + " / " + BZG.collectibles.totalItems();
    var chars = BZG.collectibles.characters().map(function (c) {
      var got = BZG.collectibles.ownedCountFor(c.key);
      var items = BZG.collectibles.byCharacter(c.key).length;
      var complete = BZG.collectibles.isSetComplete(c.key);
      return '<div class="collection-mini' + (complete ? " complete" : "") + '" title="' + BZG.ui.escapeHtml(c.name) + ': ' + got + '/' + items + '">' +
        '<span>' + c.avatar + '</span><span class="collection-mini-count">' + got + '/' + items + '</span></div>';
    }).join("");
    document.getElementById("collection-total").textContent = total;
    el.innerHTML = chars;
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
      { label: "Recorde de saldo", value: BZG.ui.formatMoney(stats.peakBalance || 0), cls: "stat-value--gold" },
      { label: "Maior prêmio único", value: BZG.ui.formatMoney(stats.maxWin || 0), cls: "stat-value--gold" },
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

    // atualiza o card de perfil na topbar sem recarregar
    var nameEl = document.getElementById("topbar-profile-name");
    var avatarEl = document.getElementById("topbar-profile-avatar");
    if (nameEl) nameEl.innerHTML = BZG.ui.nameHTML(nick);
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
    renderNameColorPicker();
    renderTitlePicker();
    renderThemePicker();
    renderLevel();
    renderStats();
    renderRecentBets();
    renderAchievements();
    renderCollectionSummary();

    document.addEventListener("bzg:theme-changed", renderThemePicker);

    document.getElementById("save-profile-btn").addEventListener("click", saveProfile);
  });
})();
