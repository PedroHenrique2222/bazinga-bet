/* Bazinga BET - pagina da Colecao (album de figurinhas dos Bazingas) */
(function () {
  var ITEM_BY_ID = {};

  function charCardHTML(c) {
    var items = BZG.collectibles.byCharacter(c.key);
    var owned = BZG.storage.getCollectibles().owned;
    var got = BZG.collectibles.ownedCountFor(c.key);
    var complete = BZG.collectibles.isSetComplete(c.key);

    var slots = items.map(function (it) {
      var has = !!owned[it.id];
      var r = BZG.collectibles.rarityFor(it);
      var rlabel = BZG.collectibles.rarityMeta(r).label;
      if (has) {
        return '<div class="col-slot col-slot--owned rarity-' + r + '" title="' + BZG.ui.escapeHtml(it.name) + ' · ' + rlabel + '">' +
          '<span class="col-slot-icon">' + it.icon + '</span>' +
          '<span class="col-slot-name">' + BZG.ui.escapeHtml(it.name) + '</span>' +
          '<span class="col-slot-rarity">' + rlabel + '</span>' +
          '</div>';
      }
      // mostra a raridade da carta mesmo bloqueada (pra saber quais faltam sao raras)
      return '<div class="col-slot col-slot--locked rarity-' + r + '" title="Ainda não descoberta · ' + rlabel + '">' +
        '<span class="col-slot-icon">🔒</span>' +
        '<span class="col-slot-name">???</span>' +
        '<span class="col-slot-rarity">' + rlabel + '</span>' +
        '</div>';
    }).join("");

    return '<section class="panel col-char' + (complete ? " col-char--complete" : "") + '">' +
      '<div class="col-char-head">' +
        '<div class="col-char-avatar">' + c.avatar + '</div>' +
        '<div class="col-char-info">' +
          '<h2>' + BZG.ui.escapeHtml(c.name) + '</h2>' +
          '<p>' + BZG.ui.escapeHtml(c.game) + '</p>' +
        '</div>' +
        '<div class="col-char-progress">' +
          (complete ? '<span class="col-complete-badge">🏆 Completo</span>' : '') +
          '<span>' + got + ' / ' + items.length + '</span>' +
        '</div>' +
      '</div>' +
      '<div class="col-grid">' + slots + '</div>' +
    '</section>';
  }

  // faixa de "últimas figurinhas" (as 6 mais recentes, por data de obtenção)
  function recentHTML() {
    var owned = BZG.storage.getCollectibles().owned;
    var entries = Object.keys(owned).map(function (id) { return { id: id, t: owned[id] }; });
    entries.sort(function (a, b) { return b.t - a.t; });
    return entries.slice(0, 6).map(function (e) {
      var it = ITEM_BY_ID[e.id];
      if (!it) return "";
      var r = BZG.collectibles.rarityFor(it);
      return '<div class="col-recent-item rarity-' + r + '" title="' + BZG.ui.escapeHtml(it.name) + '">' + it.icon + '</div>';
    }).join("");
  }

  function renderHeroExtras() {
    var extra = document.getElementById("col-extra");
    if (!extra) return;
    var total = BZG.collectibles.totalItems();
    var owned = BZG.collectibles.totalOwned();
    var pct = total ? Math.round((owned / total) * 100) : 0;

    var legend = ["common", "rare", "epic", "legendary"].map(function (k) {
      var m = BZG.collectibles.rarityMeta(k);
      return '<span class="col-legend-item"><span class="col-legend-dot" style="background:' + m.color + '"></span>' + m.label + '</span>';
    }).join("");

    var recent = recentHTML();

    extra.innerHTML =
      '<div class="col-progress">' +
        '<div class="col-progress-bar"><div class="col-progress-fill" style="width:' + pct + '%"></div></div>' +
        '<span class="col-progress-label">' + pct + '% completo</span>' +
      '</div>' +
      '<div class="col-legend">' + legend + '</div>' +
      (recent ? '<div class="col-recent"><span class="col-recent-title">Últimas:</span>' + recent + '</div>' : '');
  }

  function renderCharacters() {
    var wrap = document.getElementById("characters-list");
    if (!wrap || !BZG.collectibles) return;

    var crew = BZG.collectibles.charactersByGroup("equipe");
    var friends = BZG.collectibles.charactersByGroup("amigos");

    wrap.innerHTML =
      '<h2 class="col-group-title">🎪 Equipe BZG</h2>' +
      crew.map(charCardHTML).join("") +
      '<h2 class="col-group-title">🤝 Amigos dos Bazingas</h2>' +
      friends.map(charCardHTML).join("");

    var totalEl = document.getElementById("col-total");
    if (totalEl) totalEl.textContent = BZG.collectibles.totalOwned() + " / " + BZG.collectibles.totalItems();

    renderHeroExtras();
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (BZG.collectibles) BZG.collectibles.all().forEach(function (it) { ITEM_BY_ID[it.id] = it; });
    renderCharacters();

    document.getElementById("tab-loja").addEventListener("click", function () {
      BZG.ui.toast("🛒 Loja de colecionáveis em desenvolvimento. Volte em breve!", "info");
      BZG.sounds.click();
    });

    document.addEventListener("bzg:balance-changed", function () {
      renderCharacters();
    });
  });
})();
