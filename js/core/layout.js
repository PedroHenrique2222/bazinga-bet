/* Bazinga BET - layout compartilhado: sidebar estilo cassino + topbar */
window.BZG = window.BZG || {};

BZG.layout = (function () {
  var NAV_ITEMS = [
    { href: "index.html", icon: "🏠", label: "Lobby", page: "lobby" },
    { href: "crash.html", icon: "🚀", label: "Crash", page: "crash", live: true },
    { href: "double.html", icon: "🎡", label: "Double", page: "double", live: true },
    { href: "mines.html", icon: "💎", label: "Mines", page: "mines" },
    { href: "tower.html", icon: "🗼", label: "Tower", page: "tower" },
    { href: "plinko.html", icon: "🎱", label: "Plinko", page: "plinko" },
    { href: "dice.html", icon: "🎲", label: "Dice", page: "dice" },
    { href: "hilo.html", icon: "🃏", label: "HiLo", page: "hilo" },
    { href: "slots.html", icon: "🎰", label: "Slots", page: "slots" },
    { href: "roulette.html", icon: "🎯", label: "Roleta", page: "roulette" },
    { href: "blackjack.html", icon: "🎭", label: "Blackjack", page: "blackjack" }
  ];

  function logoHTML() {
    return '' +
      '<a class="logo-card" href="index.html" aria-label="Bazinga BET">' +
        '<svg class="logo-svg" viewBox="0 0 200 120" aria-hidden="true">' +
          /* explosao de quadrinhos (starburst) atras */
          '<polygon class="logo-burst" points="100,4 113,26 138,10 140,36 170,28 158,52 192,54 164,70 188,90 156,86 162,114 136,96 128,118 112,98 88,118 84,94 60,112 62,86 32,96 48,72 8,66 40,56 16,34 48,42 42,12 68,28 78,6 92,26"/>' +
          '<polygon class="logo-burst-inner" points="100,14 110,30 129,18 130,38 154,33 145,51 172,55 149,66 166,82 142,79 146,100 126,87 119,104 107,88 88,104 85,84 66,97 68,77 44,84 57,65 26,60 51,53 33,37 57,43 53,20 73,32 81,14 91,29"/>' +
          /* circulo branco central */
          '<circle class="logo-white" cx="100" cy="60" r="46"/>' +
          /* texto BAZINGA! em arco comic */
          '<g class="logo-word" transform="rotate(-7 100 58)">' +
            '<text class="logo-stroke" x="100" y="66" text-anchor="middle">BAZINGA!</text>' +
            '<text class="logo-fill" x="100" y="66" text-anchor="middle">BAZINGA!</text>' +
          '</g>' +
          /* raio detalhado cortando embaixo */
          '<polygon class="logo-bolt" points="18,92 78,78 66,84 128,72 96,94 108,86 44,102 58,92"/>' +
          '<polygon class="logo-bolt logo-bolt--2" points="128,72 182,60 148,82 160,74 112,90"/>' +
        '</svg>' +
        '<span class="logo-bet">B&nbsp;E&nbsp;T</span>' +
      '</a>';
  }

  function renderSidebar(activePage) {
    var el = document.getElementById("sidebar");
    if (!el) return;

    var nav = NAV_ITEMS.map(function (item) {
      var cls = "nav-item" + (item.page === activePage ? " active" : "");
      var liveBadge = item.live ? '<span class="nav-live">AO VIVO</span>' : "";
      return '<a class="' + cls + '" href="' + item.href + '">' +
        '<span class="nav-icon">' + item.icon + '</span>' +
        '<span class="nav-label">' + item.label + '</span>' +
        liveBadge +
        '</a>';
    }).join("");

    el.innerHTML = logoHTML() +
      '<nav class="sidebar-nav">' +
        '<div class="nav-group-title">Jogos</div>' +
        nav +
      '</nav>' +
      '<div class="sidebar-footer">' +
        '<a class="nav-item' + (activePage === "profile" ? " active" : "") + '" href="profile.html">' +
          '<span class="nav-icon" id="sidebar-avatar">😎</span>' +
          '<span class="nav-label" id="sidebar-nick">Perfil</span>' +
          '<span class="nav-lvl" id="sidebar-lvl"></span>' +
        '</a>' +
      '</div>';

    var profile = BZG.storage.getProfile();
    var lvl = BZG.storage.getLevel();
    var avatarEl = document.getElementById("sidebar-avatar");
    var nickEl = document.getElementById("sidebar-nick");
    var lvlEl = document.getElementById("sidebar-lvl");
    if (avatarEl) avatarEl.textContent = profile.avatar;
    if (nickEl) nickEl.textContent = profile.nickname;
    if (lvlEl) lvlEl.textContent = "Lv " + lvl.level;
  }

  function renderTopbar(title, icon) {
    var el = document.getElementById("topbar");
    if (!el) return;

    el.innerHTML = '' +
      '<button class="icon-btn topbar-menu" id="menu-btn" title="Menu" aria-label="Abrir menu">☰</button>' +
      '<div class="topbar-title">' + (icon ? icon + " " : "") + (title || "") + '</div>' +
      '<div class="topbar-spacer"></div>' +
      '<div class="balance-box">' +
        '<span class="balance-label">Saldo</span>' +
        '<span id="balance-value">BZ$ 0</span>' +
      '</div>' +
      '<button id="reset-balance-btn" class="btn btn--gold btn--sm" title="Recarrega o saldo para BZ$ 10.000">Recarregar</button>' +
      '<button class="icon-btn" id="music-btn" title="Música ligada/desligada">🎵</button>' +
      '<button class="icon-btn" id="sfx-btn" title="Efeitos sonoros ligados/desligados">🔊</button>' +
      '<button class="icon-btn" id="theme-btn" title="Tema claro/escuro"></button>';

    BZG.ui.refreshBalance();

    document.getElementById("reset-balance-btn").addEventListener("click", function () {
      BZG.storage.resetBalance();
      BZG.ui.refreshBalance();
      BZG.sounds.click();
      BZG.ui.toast("Saldo recarregado para " + BZG.ui.formatMoney(BZG.storage.STARTING_BALANCE) + "!", "success");
      document.dispatchEvent(new CustomEvent("bzg:balance-changed"));
    });

    var musicBtn = document.getElementById("music-btn");
    var sfxBtn = document.getElementById("sfx-btn");
    function syncSoundIcons() {
      musicBtn.classList.toggle("off", !BZG.sounds.isMusicEnabled());
      sfxBtn.textContent = BZG.sounds.isSfxEnabled() ? "🔊" : "🔇";
      sfxBtn.classList.toggle("off", !BZG.sounds.isSfxEnabled());
    }
    syncSoundIcons();
    musicBtn.addEventListener("click", function () {
      BZG.sounds.toggleMusic();
      syncSoundIcons();
      BZG.sounds.click();
    });
    sfxBtn.addEventListener("click", function () {
      BZG.sounds.toggleSfx();
      syncSoundIcons();
      BZG.sounds.click();
    });

    var themeBtn = document.getElementById("theme-btn");
    function syncThemeIcon() {
      themeBtn.textContent = BZG.theme.get() === "dark" ? "🌙" : "☀️";
    }
    syncThemeIcon();
    themeBtn.addEventListener("click", function () {
      BZG.theme.toggle();
      syncThemeIcon();
      BZG.sounds.click();
    });

    var menuBtn = document.getElementById("menu-btn");
    var sidebar = document.getElementById("sidebar");
    var backdrop = document.getElementById("sidebar-backdrop");
    if (menuBtn && sidebar) {
      menuBtn.addEventListener("click", function () {
        sidebar.classList.toggle("open");
        if (backdrop) backdrop.classList.toggle("visible", sidebar.classList.contains("open"));
      });
    }
    if (backdrop && sidebar) {
      backdrop.addEventListener("click", function () {
        sidebar.classList.remove("open");
        backdrop.classList.remove("visible");
      });
    }
  }

  function init() {
    var body = document.body;
    var page = body.dataset.page || "";
    var title = body.dataset.title || "";
    var icon = body.dataset.icon || "";

    renderSidebar(page);
    renderTopbar(title, icon);
    BZG.sounds.armMusicAutostart();
  }

  document.addEventListener("DOMContentLoaded", init);

  return { init: init };
})();
