/* Bazinga BET - logica da tela de configuracoes */
(function () {
  function syncToggle(el, on) {
    el.classList.toggle("on", !!on);
    el.setAttribute("aria-checked", on ? "true" : "false");
  }

  function refreshSummaries() {
    var profile = BZG.storage.getProfile();
    var lvl = BZG.storage.getLevel();
    var pEl = document.getElementById("profile-summary");
    var bEl = document.getElementById("balance-summary");
    if (pEl) pEl.textContent = profile.avatar + " " + profile.nickname + " · Nível " + lvl.level;
    if (bEl) bEl.textContent = BZG.ui.formatMoney(BZG.storage.getBalance());
  }

  function renderThemeGrid() {
    var grid = document.getElementById("theme-grid");
    if (!grid) return;
    var cos = BZG.storage.getCosmetics();
    var unlockedExtra = cos.themes || [];
    var current = BZG.theme.get();
    grid.innerHTML = Object.keys(BZG.theme.THEMES).map(function (id) {
      var meta = BZG.theme.THEMES[id];
      var unlocked = meta.free || unlockedExtra.indexOf(id) !== -1;
      var cls = "theme-card" + (id === current ? " active" : "") + (unlocked ? "" : " locked");
      return '<button class="' + cls + '" data-theme-id="' + id + '"' + (unlocked ? "" : " disabled") + '>' +
        '<span class="theme-swatch theme-swatch--' + id + '"></span>' +
        '<span class="theme-name">' + meta.icon + ' ' + meta.name + '</span>' +
        (unlocked ? "" : '<span class="theme-lock">🔒 Passe</span>') +
        '</button>';
    }).join("");
    Array.prototype.forEach.call(grid.querySelectorAll(".theme-card:not(.locked)"), function (btn) {
      btn.addEventListener("click", function () {
        BZG.theme.set(btn.dataset.themeId);
        renderThemeGrid();
        BZG.sounds.click();
      });
    });
  }

  function renderTurbo() {
    var toggle = document.getElementById("toggle-turbo");
    var desc = document.getElementById("turbo-desc");
    if (!toggle) return;
    var unlocked = BZG.storage.isTurboUnlocked();
    if (!unlocked) {
      desc.textContent = "🔒 Desbloqueie no Passe de Batalha (nível 14)";
      toggle.classList.add("disabled");
      syncToggle(toggle, false);
      return;
    }
    toggle.classList.remove("disabled");
    desc.textContent = "Animações mais rápidas nos jogos";
    syncToggle(toggle, BZG.storage.isTurboOn());
    toggle.onclick = function () {
      var on = BZG.storage.setTurboOn(!BZG.storage.isTurboOn());
      syncToggle(toggle, on);
      BZG.sounds.click();
    };
  }

  document.addEventListener("DOMContentLoaded", function () {
    var musicToggle = document.getElementById("toggle-music");
    var sfxToggle = document.getElementById("toggle-sfx");

    syncToggle(musicToggle, BZG.sounds.isMusicEnabled());
    syncToggle(sfxToggle, BZG.sounds.isSfxEnabled());
    refreshSummaries();
    renderThemeGrid();
    renderTurbo();

    musicToggle.addEventListener("click", function () {
      var on = BZG.sounds.toggleMusic();
      syncToggle(musicToggle, on);
      BZG.sounds.click();
    });

    sfxToggle.addEventListener("click", function () {
      var on = BZG.sounds.toggleSfx();
      syncToggle(sfxToggle, on);
      BZG.sounds.click();
    });

    document.getElementById("reload-btn").addEventListener("click", function () {
      var current = BZG.storage.getBalance();
      if (current > BZG.storage.STARTING_BALANCE) {
        var ok = window.confirm(
          "Você tem " + BZG.ui.formatMoney(current) + ". Recarregar vai REDUZIR o saldo para " +
          BZG.ui.formatMoney(BZG.storage.STARTING_BALANCE) + ". Continuar?"
        );
        if (!ok) return;
      }
      BZG.storage.resetBalance();
      BZG.ui.refreshBalance();
      refreshSummaries();
      document.dispatchEvent(new CustomEvent("bzg:balance-changed"));
      BZG.ui.toast("Saldo recarregado!", "success");
      BZG.sounds.click();
    });

    document.getElementById("wipe-btn").addEventListener("click", function () {
      var ok = window.confirm(
        "Tem certeza? Isso apaga TUDO: saldo, perfil, histórico, conquistas e configurações. Não dá para desfazer."
      );
      if (!ok) return;
      try {
        localStorage.removeItem("bazingaBetState");
        localStorage.removeItem("bzgTheme");
        localStorage.removeItem("bzgMusic");
        localStorage.removeItem("bzgSfx");
        localStorage.removeItem("bzgMuted");
        localStorage.removeItem("bzgRoundCrash");
        localStorage.removeItem("bzgRoundDouble");
      } catch (e) {}
      BZG.ui.toast("Todos os dados foram apagados. Recarregando...", "success");
      setTimeout(function () { window.location.href = "index.html"; }, 1200);
    });
  });
})();
