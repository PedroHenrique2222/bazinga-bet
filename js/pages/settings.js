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

  document.addEventListener("DOMContentLoaded", function () {
    var musicToggle = document.getElementById("toggle-music");
    var sfxToggle = document.getElementById("toggle-sfx");
    var themeToggle = document.getElementById("toggle-theme");

    syncToggle(musicToggle, BZG.sounds.isMusicEnabled());
    syncToggle(sfxToggle, BZG.sounds.isSfxEnabled());
    syncToggle(themeToggle, BZG.theme.get() === "dark");
    refreshSummaries();

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

    themeToggle.addEventListener("click", function () {
      var next = BZG.theme.toggle();
      syncToggle(themeToggle, next === "dark");
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
