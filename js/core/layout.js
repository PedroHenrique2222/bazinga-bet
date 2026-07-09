/* Bazinga BET - layout compartilhado: sidebar estilo cassino + topbar */
window.BZG = window.BZG || {};

BZG.layout = (function () {
  /* paginas de jogo vivem em games/, minigames sem aposta vivem em minigames/, as
     demais (lobby, perfil, config, passe, colecao, cadastro) ficam na raiz. Calcula
     os prefixos uma vez, na hora que o script carrega, a partir da URL atual - assim
     o mesmo layout.js serve os tres casos. */
  var IN_GAMES = /\/games\//.test(window.location.pathname);
  var IN_MINIGAMES = /\/minigames\//.test(window.location.pathname);
  var ROOT_PREFIX = (IN_GAMES || IN_MINIGAMES) ? "../" : "";
  var GAMES_PREFIX = IN_GAMES ? "" : (IN_MINIGAMES ? "../games/" : "games/");
  var MINIGAMES_PREFIX = IN_MINIGAMES ? "" : (IN_GAMES ? "../minigames/" : "minigames/");

  var NAV_ITEMS = [
    { href: "index.html", root: true, icon: "🏠", label: "Lobby", page: "lobby" },
    { href: "crash.html", icon: "🛶", label: "Canoa Furada", page: "crash", live: true },
    { href: "double.html", icon: "🎡", label: "Double", page: "double", live: true },
    { href: "mines.html", icon: "🥒", label: "Mines do Pikles", page: "mines" },
    { href: "tower.html", icon: "🗑️", label: "Lixeira do Linden", page: "tower" },
    { href: "plinko.html", icon: "🎃", label: "Plinko da Abóbora", page: "plinko" },
    { href: "dice.html", icon: "🎲", label: "Dado 616", page: "dice" },
    { href: "hilo.html", icon: "🃏", label: "HiLo do Panetone", page: "hilo" },
    { href: "roulette.html", icon: "🎯", label: "Roleta", page: "roulette" },
    { href: "blackjack.html", icon: "🍑", label: "21 do Bogão", page: "blackjack" },
    { href: "bazinguinha.html", icon: "🐯", label: "Bazinguinha", page: "bazinguinha", dev: true },
    { href: "bonanza.html", icon: "💎", label: "Bazinga Bonanza", page: "bonanza", dev: true },
    { href: "horse.html", icon: "🏇", label: "Corrida BZG", page: "horse", hot: true },
    { href: "raspadinha.html", icon: "🎟️", label: "Raspadinha", page: "raspadinha" },
    { href: "limbo.html", icon: "📉", label: "Limbo", page: "limbo" },
    { href: "coinflip.html", icon: "🔋", label: "Moeda da Pilha", page: "coinflip" }
  ];

  /* minigames sem aposta: nao mexem no saldo, so dao XP e recorde pessoal */
  var MINIGAME_ITEMS = [
    { href: "torre.html", icon: "🧱", label: "Torre do CBPB_Gamer", page: "torre-minigame", minigame: true },
    { href: "arcoiris.html", icon: "🏳️‍🌈", label: "Sequência Arco-íris", page: "rainbow-minigame", minigame: true },
    { href: "sombra.html", icon: "🌑", label: "Sombra Rápida", page: "shadow-minigame", minigame: true },
    { href: "alien.html", icon: "👽", label: "Fuga Alienígena", page: "alien-minigame", minigame: true }
  ];

  function navHref(item) {
    var prefix = item.root ? ROOT_PREFIX : (item.minigame ? MINIGAMES_PREFIX : GAMES_PREFIX);
    return prefix + item.href;
  }

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
      '<a class="logo-card" href="' + ROOT_PREFIX + 'index.html" aria-label="Bazinga BET">' +
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
      if (item.dev) {
        return '<span class="nav-item nav-item--dev" title="Em desenvolvimento">' +
          '<span class="nav-icon">' + item.icon + '</span>' +
          '<span class="nav-label">' + item.label + '</span>' +
          '<span class="nav-dev">EM BREVE</span>' +
          '</span>';
      }
      var cls = "nav-item" + (item.page === activePage ? " active" : "");
      var badge = item.live ? '<span class="nav-live">AO VIVO</span>'
        : (item.hot ? '<span class="nav-hot">HOT</span>' : "");
      return '<a class="' + cls + '" href="' + navHref(item) + '">' +
        '<span class="nav-icon">' + item.icon + '</span>' +
        '<span class="nav-label">' + item.label + '</span>' +
        badge +
        '</a>';
    }).join("");

    var minigameNav = MINIGAME_ITEMS.map(function (item) {
      var cls = "nav-item" + (item.page === activePage ? " active" : "");
      return '<a class="' + cls + '" href="' + navHref(item) + '">' +
        '<span class="nav-icon">' + item.icon + '</span>' +
        '<span class="nav-label">' + item.label + '</span>' +
        '</a>';
    }).join("");

    el.innerHTML = logoHTML() +
      '<nav class="sidebar-nav">' +
        '<div class="nav-group-title">Jogos</div>' +
        nav +
        '<div class="nav-group-title">Minigames</div>' +
        minigameNav +
      '</nav>' +
      '<div class="sidebar-footer">' +
        '<div class="online-count"><span class="online-dot"></span><span id="online-count-value">—</span> online</div>' +
        '<a class="nav-item' + (activePage === "colecao" ? " active" : "") + '" href="' + ROOT_PREFIX + 'colecao.html">' +
          '<span class="nav-icon">🎴</span>' +
          '<span class="nav-label">Coleção</span>' +
        '</a>' +
        '<a class="nav-item' + (activePage === "passe" ? " active" : "") + '" href="' + ROOT_PREFIX + 'passe.html">' +
          '<span class="nav-icon">🎫</span>' +
          '<span class="nav-label">Passe de Batalha</span>' +
          '<span class="nav-bp-dot" id="bp-dot" style="display:none;"></span>' +
        '</a>' +
        '<a class="nav-item' + (activePage === "profile" ? " active" : "") + '" href="' + ROOT_PREFIX + 'profile.html">' +
          '<span class="nav-icon">👤</span>' +
          '<span class="nav-label">Perfil</span>' +
        '</a>' +
        '<a class="nav-item' + (activePage === "settings" ? " active" : "") + '" href="' + ROOT_PREFIX + 'settings.html">' +
          '<span class="nav-icon">⚙️</span>' +
          '<span class="nav-label">Configurações</span>' +
        '</a>' +
      '</div>';

    // aviso de recompensas do passe a resgatar
    var bpDot = document.getElementById("bp-dot");
    if (bpDot && BZG.battlepass) {
      var n = BZG.battlepass.unclaimedCount();
      if (n > 0) { bpDot.style.display = "flex"; bpDot.textContent = n > 9 ? "9+" : n; }
    }
  }

  // atualiza os campos dinamicos da topbar: card de perfil + os 3 mini-stats
  function refreshTopbarStats() {
    var lvlEl = document.getElementById("topbar-level");
    var peakEl = document.getElementById("topbar-peak");
    var maxwinEl = document.getElementById("topbar-maxwin");
    var avatarEl = document.getElementById("topbar-profile-avatar");
    var nameEl = document.getElementById("topbar-profile-name");
    var chipLvlEl = document.getElementById("topbar-profile-lvl");
    if (!lvlEl && !peakEl && !maxwinEl && !avatarEl) return;
    var lvl = BZG.storage.getLevel();
    var stats = BZG.storage.getStats();
    if (lvlEl) lvlEl.textContent = "Lv " + lvl.level;
    if (peakEl) peakEl.textContent = BZG.ui.formatMoney(stats.peakBalance || 0);
    if (maxwinEl) maxwinEl.textContent = BZG.ui.formatMoney(stats.maxWin || 0);
    if (avatarEl || nameEl || chipLvlEl) {
      var profile = BZG.storage.getProfile();
      if (avatarEl) avatarEl.textContent = profile.avatar;
      if (nameEl) nameEl.innerHTML = BZG.ui.nameHTML(profile.nickname);
      if (chipLvlEl) chipLvlEl.textContent = "Lv " + lvl.level;
    }
  }

  function renderTopbar(title, icon) {
    var el = document.getElementById("topbar");
    if (!el) return;

    el.innerHTML = '' +
      '<button class="icon-btn topbar-menu" id="menu-btn" title="Menu" aria-label="Abrir menu">☰</button>' +
      '<a class="topbar-profile" id="topbar-profile-link" href="' + ROOT_PREFIX + 'profile.html" title="Ver perfil">' +
        '<span class="topbar-profile-avatar" id="topbar-profile-avatar">😎</span>' +
        '<span class="topbar-profile-name" id="topbar-profile-name"></span>' +
        '<span class="topbar-profile-lvl" id="topbar-profile-lvl">Lv 1</span>' +
      '</a>' +
      '<div class="topbar-title">' + (icon ? icon + " " : "") + (title || "") + '</div>' +
      '<div class="topbar-spacer"></div>' +
      '<div class="topbar-stats">' +
        '<div class="mini-stat" title="Seu nível atual">' +
          '<span class="mini-stat-icon">⭐</span>' +
          '<span id="topbar-level">Lv 1</span>' +
        '</div>' +
        '<div class="mini-stat" title="Recorde: maior saldo que você já teve">' +
          '<span class="mini-stat-icon">📈</span>' +
          '<span id="topbar-peak">BZ$ 0</span>' +
        '</div>' +
        '<div class="mini-stat" title="Maior prêmio ganho numa única aposta">' +
          '<span class="mini-stat-icon">🏆</span>' +
          '<span id="topbar-maxwin">BZ$ 0</span>' +
        '</div>' +
      '</div>' +
      '<div class="balance-box">' +
        '<span class="balance-label">Saldo</span>' +
        '<span id="balance-value">BZ$ 0</span>' +
      '</div>' +
      '<button id="reset-balance-btn" class="btn btn--gold btn--sm" title="Recarrega o saldo para ' + BZG.ui.formatMoney(BZG.storage.getReloadAmount()) + '">Recarregar</button>' +
      '<button class="icon-btn" id="music-btn" title="Música ligada/desligada">🎵</button>' +
      '<button class="icon-btn" id="sfx-btn" title="Efeitos sonoros ligados/desligados">🔊</button>' +
      '<button class="icon-btn" id="theme-btn" title="Tema claro/escuro"></button>';

    BZG.ui.refreshBalance();
    refreshTopbarStats();

    document.getElementById("reset-balance-btn").addEventListener("click", function () {
      var current = BZG.storage.getBalance();
      var reloadAmount = BZG.storage.getReloadAmount();

      // recarregar com saldo acima do valor de recarga REDUZIRIA o saldo - avisa antes
      if (current > reloadAmount) {
        var ok = window.confirm(
          "Atenção: você tem " + BZG.ui.formatMoney(current) + ".\n\n" +
          "Recarregar vai REDUZIR seu saldo para " +
          BZG.ui.formatMoney(reloadAmount) + ". Deseja continuar?"
        );
        if (!ok) return;
      }

      BZG.storage.resetBalance();
      BZG.ui.refreshBalance();
      BZG.sounds.click();
      BZG.ui.toast("Saldo recarregado para " + BZG.ui.formatMoney(reloadAmount) + "!", "success");
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
    function unlockedThemes() {
      var list = ["dark", "light"];
      var cos = BZG.storage.getCosmetics ? BZG.storage.getCosmetics() : { themes: [] };
      (cos.themes || []).forEach(function (id) { if (list.indexOf(id) === -1) list.push(id); });
      return list;
    }
    function syncThemeIcon() {
      var meta = BZG.theme.THEMES[BZG.theme.get()] || BZG.theme.THEMES.dark;
      themeBtn.textContent = meta.icon;
      themeBtn.title = "Tema: " + meta.name + " (clique para trocar)";
    }
    syncThemeIcon();
    themeBtn.addEventListener("click", function () {
      BZG.theme.cycle(unlockedThemes());
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
        '<div class="bonus-gift">🍰</div>' +
        '<h2>Panetone diário</h2>' +
        '<p class="bonus-sub">Cortesia do <strong>BZG Panetone</strong> · dia <strong>' + info.nextStreak + '</strong> de sequência</p>' +
        '<div class="bonus-amount">+' + BZG.ui.formatMoney(info.amount) + '</div>' +
        '<p class="bonus-hint">Volte amanhã para aumentar sua sequência e ganhar um panetone maior!</p>' +
        '<button class="btn btn--gold" id="claim-bonus-btn" style="width:100%; padding:13px; font-size:16px; margin-top:6px;">Coletar 🍰</button>' +
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

  function init() {
    var body = document.body;
    var page = body.dataset.page || "";
    var title = body.dataset.title || "";
    var icon = body.dataset.icon || "";

    // sem cadastro, nao entra: manda pra tela de cadastro/login antes de tudo
    if (!BZG.storage.hasAccount()) {
      window.location.replace(ROOT_PREFIX + "cadastro.html");
      return;
    }

    // jogo marcado como "em desenvolvimento": nao deixa acessar direto pela URL
    if (body.dataset.dev === "true") {
      try { sessionStorage.setItem("bzgBlockedGame", title || page); } catch (e) {}
      window.location.replace(ROOT_PREFIX + "index.html");
      return;
    }

    renderSidebar(page);
    renderTopbar(title, icon);
    BZG.sounds.armMusicAutostart();

    updateOnlineCount();
    setInterval(updateOnlineCount, 5000);

    // sempre que o saldo muda (apos apostas, bonus etc.): recarrega sozinho se zerou, e checa conquistas
    document.addEventListener("bzg:balance-changed", function () {
      if (BZG.storage.getBalance() <= 0) {
        var amount = BZG.storage.autoReload();
        BZG.ui.refreshBalance();
        BZG.ui.toast("💳 Seu saldo zerou! Recarregamos automaticamente: " + BZG.ui.formatMoney(amount), "info");
      }
      refreshTopbarStats();
      if (BZG.achievements) BZG.achievements.check();
    });

    // uma aposta especifica acabou de ser registrada: chance pequena de dropar colecionavel
    document.addEventListener("bzg:bet-recorded", function () {
      if (BZG.collectibles) BZG.collectibles.rollOnBet();
    });

    // Atalho de teclado: apertar Enter num campo numerico (ex.: valor da aposta)
    // dispara o botao principal do jogo, pra apostar/jogar sem precisar clicar.
    // Vale em qualquer jogo (o botao principal e sempre um .btn--primary nos
    // controles). Se esse botao estiver desabilitado (rodada em andamento), nao
    // faz nada. Os minigames nao tem campo numerico, entao nem sao afetados.
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Enter") return;
      var el = document.activeElement;
      if (!el || el.tagName !== "INPUT") return;
      if ((el.getAttribute("type") || "").toLowerCase() !== "number") return;
      var btn = document.querySelector(".controls .btn--primary:not([disabled])") ||
                document.querySelector(".btn--primary:not([disabled])");
      if (btn) { e.preventDefault(); btn.click(); }
    });

    // Botoes rapidos de aposta (½/2x/Máx) nunca passam do seu saldo: depois que o
    // jogo ajusta o valor, a gente limita ao saldo atual. Central pra valer em todo
    // jogo sem mexer em cada um (roda no bubbling, depois do handler do proprio botao).
    document.addEventListener("click", function (e) {
      var t = e.target;
      if (!t || (t.id !== "bet-half" && t.id !== "bet-double" && t.id !== "bet-max")) return;
      var betInput = document.getElementById("bet-amount");
      if (!betInput) return;
      var balance = BZG.storage.getBalance();
      var v = Math.round(Number(betInput.value) || 0);
      var capped = Math.max(1, Math.min(v, Math.max(1, balance)));
      if (capped !== v) {
        betInput.value = capped;
        // avisa o jogo pra atualizar previews (ganho potencial etc.) se ele escutar input
        betInput.dispatchEvent(new Event("input", { bubbles: true }));
      }
    });

    // Lembra o ultimo valor de aposta de cada jogo (por pagina), pra nao ter que
    // redigitar toda vez. So mexe no campo #bet-amount, que so existe nos jogos.
    (function () {
      var betInput = document.getElementById("bet-amount");
      if (!betInput) return;
      var key = "bzgBet:" + window.location.pathname;
      try {
        var saved = localStorage.getItem(key);
        if (saved !== null && !isNaN(Number(saved)) && Number(saved) >= 1) {
          betInput.value = Math.round(Number(saved));
          betInput.dispatchEvent(new Event("input", { bubbles: true }));
        }
      } catch (err) {}
      function save() {
        try { localStorage.setItem(key, String(Math.max(1, Math.round(Number(betInput.value) || 0)))); } catch (err) {}
      }
      betInput.addEventListener("input", save);
      document.addEventListener("bzg:bet-recorded", save);
    })();

    // bonus diario aparece pouco depois de carregar
    setTimeout(showDailyBonus, 700);
  }

  document.addEventListener("DOMContentLoaded", init);

  return { init: init };
})();
