/* Bazinga BET - pagina da Colecao (album de figurinhas dos Bazingas) */
(function () {
  function charCardHTML(c) {
    var items = BZG.collectibles.byCharacter(c.key);
    var owned = BZG.storage.getCollectibles().owned;
    var got = BZG.collectibles.ownedCountFor(c.key);
    var complete = BZG.collectibles.isSetComplete(c.key);

    var slots = items.map(function (it) {
      var has = !!owned[it.id];
      if (has) {
        return '<div class="col-slot col-slot--owned" title="' + BZG.ui.escapeHtml(it.name) + '">' +
          '<span class="col-slot-icon">' + it.icon + '</span>' +
          '<span class="col-slot-name">' + BZG.ui.escapeHtml(it.name) + '</span>' +
          '</div>';
      }
      return '<div class="col-slot col-slot--locked" title="Ainda não descoberta">' +
        '<span class="col-slot-icon">🔒</span>' +
        '<span class="col-slot-name">???</span>' +
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
  }

  document.addEventListener("DOMContentLoaded", function () {
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
