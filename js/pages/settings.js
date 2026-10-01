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
    var rEl = document.getElementById("reload-summary");
    if (pEl) pEl.textContent = profile.avatar + " " + profile.nickname + " · Nível " + lvl.level;
    if (bEl) bEl.textContent = BZG.ui.formatMoney(BZG.storage.getBalance());
    if (rEl) rEl.textContent = BZG.ui.formatMoney(BZG.storage.getReloadAmount());
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

  /* controle deslizante de volume (0-100%): mostra o valor, salva e aplica na hora */
  function setupVolume(inputId, outId, getter, setter, onChange) {
    var input = document.getElementById(inputId);
    var out = document.getElementById(outId);
    if (!input || !getter || !setter) return;
    function paint(v) {
      if (out) out.textContent = v + "%";
      input.setAttribute("aria-valuetext", v + "%");
      input.style.setProperty("--fill", v + "%");
    }
    var initial = getter();
    input.value = initial;
    paint(initial);
    input.addEventListener("input", function () {
      var v = setter(Number(input.value));
      paint(v);
      if (onChange) onChange(v);
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var musicToggle = document.getElementById("toggle-music");
    var sfxToggle = document.getElementById("toggle-sfx");

    setupVolume("vol-music", "vol-music-val", BZG.sounds.getMusicVolume, BZG.sounds.setMusicVolume);
    // previa sonora ao mexer nos efeitos (o motor limita a frequencia)
    setupVolume("vol-sfx", "vol-sfx-val", BZG.sounds.getSfxVolume, BZG.sounds.setSfxVolume, function () {
      if (BZG.sounds.preview) BZG.sounds.preview();
    });

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
      var reloadAmount = BZG.storage.getReloadAmount();
      if (current > reloadAmount) {
        var ok = window.confirm(
          "Você tem " + BZG.ui.formatMoney(current) + ". Recarregar vai REDUZIR o saldo para " +
          BZG.ui.formatMoney(reloadAmount) + ". Continuar?"
        );
        if (!ok) return;
      }
      BZG.storage.resetBalance();
      BZG.ui.refreshBalance();
      refreshSummaries();
      document.dispatchEvent(new CustomEvent("bzg:balance-changed"));
      if (BZG.sounds.reload) BZG.sounds.reload(); else BZG.sounds.click();
      BZG.ui.toast("Saldo recarregado!", "success");
    });

    document.getElementById("logout-btn").addEventListener("click", function () {
      var ok = window.confirm("Sair da conta? Seu saldo, histórico e perfil continuam salvos neste navegador - você só precisa entrar de novo.");
      if (!ok) return;
      BZG.storage.clearAccount();
      window.location.href = "cadastro.html";
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
        localStorage.removeItem("bzgMusicVol");
        localStorage.removeItem("bzgSfxVol");
        localStorage.removeItem("bzgMuted");
        localStorage.removeItem("bzgRoundCrash");
        localStorage.removeItem("bzgRoundDouble");
      } catch (e) {}
      BZG.ui.toast("Todos os dados foram apagados. Recarregando...", "success");
      setTimeout(function () { window.location.href = "index.html"; }, 1200);
    });
  });
})();
