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
    { href: "blackjack.html", icon: "🎭", label: "Blackjack", page: "blackjack" },
    { href: "bazinguinha.html", icon: "🐯", label: "Bazinguinha", page: "bazinguinha", hot: true },
    { href: "raspadinha.html", icon: "🎟️", label: "Raspadinha", page: "raspadinha" },
    { href: "limbo.html", icon: "📉", label: "Limbo", page: "limbo" },
    { href: "wheel.html", icon: "🎡", label: "Roda da Sorte", page: "wheel" },
    { href: "coinflip.html", icon: "🪙", label: "Cara ou Coroa", page: "coinflip" }
  ];

  /* Starburst comic: estrela de pontas alternadas gerada por codigo (fica simetrica e limpa) */
  function starPoints(cx, cy, spikes, outerR, innerR) {
    var pts = [];
    for (var i = 0; i < spikes * 2; i++) {
      var r = i % 2 === 0 ? outerR : innerR;
      var a = (Math.PI * i) / spikes - Math.PI / 2;
      pts.push((cx + Math.cos(a) * r).toFixed(1) + "," + (cy + Math.sin(a) * r).toFixed(1));
    }
    return pts.join(" ");
  }

  function logoHTML() {
    return '' +
      '<a class="logo-card" href="index.html" aria-label="Bazinga BET">' +
        '<svg class="logo-svg" viewBox="0 0 200 132" aria-hidden="true">' +
          /* explosao comic em duas camadas simetricas (raios menores para nao cortar nas bordas) */
          '<polygon class="logo-burst" points="' + starPoints(100, 62, 12, 58, 42) + '"/>' +
          '<polygon class="logo-burst-inner" points="' + starPoints(100, 62, 12, 49, 38) + '"/>' +
          /* circulo branco central */
          '<circle class="logo-white" cx="100" cy="62" r="42"/>' +
          '<circle class="logo-white-edge" cx="100" cy="62" r="42"/>' +
          /* raio classico (desenho limpo do favicon) deitado ATRAS do texto */
          '<path class="logo-bolt" transform="translate(100 62) rotate(100) scale(2.35) translate(-32 -32)" d="M35 8 L17 37 L28 37 L24 56 L47 25 L35 25 Z"/>' +
          /* texto BAZINGA! com largura travada (textLength): nunca corta, mesmo sem a fonte carregada */
          '<g transform="rotate(-6 100 60)">' +
            '<text class="logo-shadow" x="102.5" y="72.5" text-anchor="middle" textLength="164" lengthAdjust="spacingAndGlyphs">BAZINGA!</text>' +
            '<text class="logo-fill" x="100" y="70" text-anchor="middle" textLength="164" lengthAdjust="spacingAndGlyphs">BAZINGA!</text>' +
          '</g>' +
        '</svg>' +
        '<span class="logo-bet">B&nbsp;E&nbsp;T</span>' +
      '</a>';
  }

  function renderSidebar(activePage) {
    var el = document.getElementById("sidebar");
    if (!el) return;

    var nav = NAV_ITEMS.map(function (item) {
      var cls = "nav-item" + (item.page === activePage ? " active" : "");
      var badge = item.live ? '<span class="nav-live">AO VIVO</span>'
        : (item.hot ? '<span class="nav-hot">HOT</span>' : "");
      return '<a class="' + cls + '" href="' + item.href + '">' +
        '<span class="nav-icon">' + item.icon + '</span>' +
        '<span class="nav-label">' + item.label + '</span>' +
        badge +
        '</a>';
    }).join("");

    el.innerHTML = logoHTML() +
      '<nav class="sidebar-nav">' +
        '<div class="nav-group-title">Jogos</div>' +
        nav +
      '</nav>' +
      '<div class="sidebar-footer">' +
        '<div class="online-count"><span class="online-dot"></span><span id="online-count-value">—</span> online</div>' +
        '<a class="nav-item' + (activePage === "profile" ? " active" : "") + '" href="profile.html">' +
          '<span class="nav-icon" id="sidebar-avatar">😎</span>' +
          '<span class="nav-label" id="sidebar-nick">Perfil</span>' +
          '<span class="nav-lvl" id="sidebar-lvl"></span>' +
        '</a>' +
        '<a class="nav-item' + (activePage === "settings" ? " active" : "") + '" href="settings.html">' +
          '<span class="nav-icon">⚙️</span>' +
          '<span class="nav-label">Configurações</span>' +
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
      var current = BZG.storage.getBalance();

      // recarregar com saldo acima do inicial REDUZIRIA o saldo - avisa antes
      if (current > BZG.storage.STARTING_BALANCE) {
        var ok = window.confirm(
          "Atenção: você tem " + BZG.ui.formatMoney(current) + ".\n\n" +
          "Recarregar vai REDUZIR seu saldo para " +
          BZG.ui.formatMoney(BZG.storage.STARTING_BALANCE) + ". Deseja continuar?"
        );
        if (!ok) return;
      }

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

  /* Contador de "jogadores online": varia com a hora do dia + ruido, atualiza sozinho */
  function updateOnlineCount() {
    var el = document.getElementById("online-count-value");
    if (!el) return;
    var now = new Date();
    var dayCycle = Math.sin(((now.getHours() * 60 + now.getMinutes()) / 1440) * Math.PI * 2 - Math.PI / 2);
    var base = 1900 + Math.round(dayCycle * 700);
    var slowNoise = Math.sin(now.getTime() / 47000) * 120 + Math.sin(now.getTime() / 13000) * 45;
    el.textContent = (base + Math.round(slowNoise)).toLocaleString("pt-BR");
  }

  /* Bonus diario: mostra um modal se o bonus de hoje ainda nao foi coletado */
  function showDailyBonus() {
    if (!BZG.storage.getBonusInfo) return;
    var info = BZG.storage.getBonusInfo();
    if (!info.available) return;

    var modal = document.createElement("div");
    modal.className = "modal-backdrop";
    modal.innerHTML =
      '<div class="modal-card bonus-card">' +
        '<div class="bonus-gift">🎁</div>' +
        '<h2>Bônus diário</h2>' +
        '<p class="bonus-sub">Dia <strong>' + info.nextStreak + '</strong> de sequência</p>' +
        '<div class="bonus-amount">+' + BZG.ui.formatMoney(info.amount) + '</div>' +
        '<p class="bonus-hint">Volte amanhã para aumentar sua sequência e ganhar mais!</p>' +
        '<button class="btn btn--gold" id="claim-bonus-btn" style="width:100%; padding:13px; font-size:16px; margin-top:6px;">Coletar</button>' +
      '</div>';
    document.body.appendChild(modal);
    requestAnimationFrame(function () { modal.classList.add("show"); });

    document.getElementById("claim-bonus-btn").addEventListener("click", function () {
      var res = BZG.storage.claimBonus();
      BZG.ui.refreshBalance();
      document.dispatchEvent(new CustomEvent("bzg:balance-changed"));
      if (res) {
        BZG.sounds.coin();
        BZG.ui.toast("🎁 Bônus coletado: +" + BZG.ui.formatMoney(res.amount) + "!", "success");
        var cx = window.innerWidth / 2, cy = window.innerHeight / 2;
        BZG.effects.confetti(cx, cy, 80);
      }
      if (BZG.achievements) BZG.achievements.check();
      modal.classList.remove("show");
      setTimeout(function () { if (modal.parentNode) modal.parentNode.removeChild(modal); }, 300);
    });
  }

  /* Notificacoes globais: de vez em quando um bot "ganha" e aparece um aviso discreto */
  function startWinFeed() {
    function schedule() {
      var delay = 22000 + Math.random() * 28000;
      setTimeout(function () {
        if (!document.hidden) {
          var win = BZG.bots.randomWin();
          BZG.ui.toast("🎉 " + win.avatar + " " + win.name + " ganhou " +
            BZG.ui.formatMoney(win.amount) + " no " + win.game.icon + " " + win.game.name, "success");
        }
        schedule();
      }, delay);
    }
    schedule();
  }

  function init() {
    var body = document.body;
    var page = body.dataset.page || "";
    var title = body.dataset.title || "";
    var icon = body.dataset.icon || "";

    renderSidebar(page);
    renderTopbar(title, icon);
    BZG.sounds.armMusicAutostart();

    updateOnlineCount();
    setInterval(updateOnlineCount, 5000);
    startWinFeed();

    // verifica conquistas sempre que o saldo muda (apos apostas, bonus etc.)
    if (BZG.achievements) {
      document.addEventListener("bzg:balance-changed", function () {
        BZG.achievements.check();
      });
    }

    // bonus diario aparece pouco depois de carregar
    setTimeout(showDailyBonus, 700);
  }

  document.addEventListener("DOMContentLoaded", init);

  return { init: init };
})();
