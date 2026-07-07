/* Bazinga BET - logica da pagina inicial (lobby) */
(function () {
  var GAME_CARDS = [
    { id: "bazinguinha", href: "bazinguinha.html", icon: "🐯", name: "Bazinguinha", desc: "O tigrinho do Bazinga: curinga ⚡ com multiplicadores!", badge: "NOVO" },
    { id: "raspadinha", href: "raspadinha.html", icon: "🎟️", name: "Raspadinha", desc: "Raspe e ache 3 iguais para ganhar.", badge: "NOVO" },
    { id: "limbo", href: "limbo.html", icon: "📉", name: "Limbo", desc: "Passou do seu alvo? Você ganha.", badge: "NOVO" },
    { id: "wheel", href: "wheel.html", icon: "🎡", name: "Roda da Sorte", desc: "Gire a roda até 15x.", badge: "NOVO" },
    { id: "coinflip", href: "coinflip.html", icon: "🪙", name: "Cara ou Coroa", desc: "Escolha um lado, quase 2x.", badge: "NOVO" },
    { id: "crash", href: "crash.html", icon: "🚀", name: "Crash", desc: "Retire antes que exploda.", live: "crash" },
    { id: "double", href: "double.html", icon: "🎡", name: "Double", desc: "Vermelho, preto ou branco (14x).", live: "double" },
    { id: "mines", href: "mines.html", icon: "💎", name: "Mines", desc: "Fuja das bombas, colha os diamantes." },
    { id: "tower", href: "tower.html", icon: "🗼", name: "Tower", desc: "Suba 8 andares sem cair." },
    { id: "plinko", href: "plinko.html", icon: "🎱", name: "Plinko", desc: "Multiplicadores de até 220x." },
    { id: "dice", href: "dice.html", icon: "🎲", name: "Dice", desc: "Acima ou abaixo, você escolhe." },
    { id: "hilo", href: "hilo.html", icon: "🃏", name: "HiLo", desc: "A próxima carta vem maior?" },
    { id: "slots", href: "slots.html", icon: "🎰", name: "Slots", desc: "Jackpot BAZINGA de 500x!" },
    { id: "roulette", href: "roulette.html", icon: "🎯", name: "Roleta", desc: "0 a 36, número cheio paga 36x." },
    { id: "blackjack", href: "blackjack.html", icon: "🎭", name: "Blackjack", desc: "Vença o dealer no 21." }
  ];

  /* ---------- Banner rotativo ---------- */

  function initBanner() {
    var banner = document.getElementById("banner");
    if (!banner) return;
    var slides = Array.prototype.slice.call(banner.querySelectorAll(".banner-slide"));
    var dotsWrap = document.getElementById("banner-dots");
    var current = 0;
    var timer = null;

    slides.forEach(function (_, i) {
      var dot = document.createElement("button");
      dot.className = "banner-dot" + (i === 0 ? " active" : "");
      dot.addEventListener("click", function () {
        goTo(i);
        restart();
      });
      dotsWrap.appendChild(dot);
    });
    var dots = Array.prototype.slice.call(dotsWrap.children);

    function goTo(index) {
      current = index % slides.length;
      slides.forEach(function (s, i) { s.classList.toggle("active", i === current); });
      dots.forEach(function (d, i) { d.classList.toggle("active", i === current); });
    }

    function restart() {
      if (timer) clearInterval(timer);
      timer = setInterval(function () { goTo(current + 1); }, 5000);
    }

    restart();
  }

  /* ---------- Ticker de vitorias ---------- */

  function tickerItemHTML(win) {
    return '<span class="ticker-item">⚡ ' + win.avatar + ' <strong>' + win.name + '</strong> ganhou ' +
      '<span class="amount">' + BZG.ui.formatMoney(win.amount) + '</span> no ' + win.game.icon + ' ' + win.game.name + '</span>';
  }

  function buildTicker() {
    var track = document.getElementById("ticker-track");
    if (!track) return;
    var items = [];
    for (var i = 0; i < 10; i++) {
      items.push(tickerItemHTML(BZG.bots.randomWin()));
    }
    var half = items.join("");
    track.innerHTML = half + half; // duplicado para loop continuo
  }

  /* ---------- Cards de jogos com info ao vivo ---------- */

  function playersNow(gameId) {
    // numero pseudo-aleatorio estavel por minuto, para parecer "gente jogando agora"
    var minute = Math.floor(Date.now() / 60000);
    var h = 0;
    var s = gameId + minute;
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return 40 + Math.abs(h) % 220;
  }

  function lastResultHTML(card) {
    if (card.live === "crash") {
      var recent = BZG.storage.getRecent("crash");
      if (recent.length) return "Último: " + Number(recent[0]).toFixed(2) + "x";
      return "Rodadas ao vivo";
    }
    if (card.live === "double") {
      var recentD = BZG.storage.getRecent("double");
      if (recentD.length) {
        var r = recentD[0];
        var emoji = r.color === "white" ? "⚪" : (r.color === "red" ? "🔴" : "⚫");
        return "Último: " + emoji + " " + r.n;
      }
      return "Roleta ao vivo";
    }
    return "";
  }

  function renderGameCards() {
    var grid = document.getElementById("games-grid");
    if (!grid) return;
    grid.innerHTML = GAME_CARDS.map(function (card) {
      var liveInfo = '<div class="card-live">' +
        '<span class="players">' + playersNow(card.id) + ' jogando</span>' +
        '<span class="last-result">' + lastResultHTML(card) + '</span>' +
        '</div>';
      var badge = card.badge ? '<span class="card-badge">' + card.badge + '</span>' : "";
      return '<a class="game-card" href="' + card.href + '">' +
        badge +
        '<div class="icon">' + card.icon + '</div>' +
        '<h2>' + card.name + '</h2>' +
        '<p>' + card.desc + '</p>' +
        liveInfo +
        '</a>';
    }).join("");
  }

  /* ---------- Ranking ---------- */

  function renderRanking() {
    var list = document.getElementById("ranking-list");
    if (!list) return;
    var entries = BZG.bots.getDailyRanking();
    list.innerHTML = entries.map(function (e, i) {
      var gameLabel = e.game ? e.game.icon + " " + e.game.name : "";
      return '<div class="ranking-row' + (e.isUser ? " is-user" : "") + '">' +
        '<span class="pos">' + (i + 1) + 'º</span>' +
        '<span class="avatar">' + e.avatar + '</span>' +
        '<span class="name">' + e.name + '</span>' +
        '<span class="game">' + gameLabel + '</span>' +
        '<span class="amount">' + BZG.ui.formatMoney(e.amount) + '</span>' +
        '</div>';
    }).join("");
  }

  /* ---------- Estatisticas ---------- */

  function renderStats() {
    var stats = BZG.storage.getStats();
    var grid = document.getElementById("stats-grid");
    if (!grid) return;

    var netProfit = stats.totalWon - stats.totalLost;
    var streakLabel = stats.currentStreak === 0
      ? "0"
      : (stats.currentStreak > 0 ? stats.currentStreak + " vitórias" : Math.abs(stats.currentStreak) + " derrotas");

    var boxes = [
      { label: "Total apostado", value: BZG.ui.formatMoney(stats.totalWagered), cls: "" },
      { label: "Total ganho", value: BZG.ui.formatMoney(stats.totalWon), cls: "stat-value--win" },
      { label: "Total perdido", value: BZG.ui.formatMoney(stats.totalLost), cls: "stat-value--lose" },
      { label: "Lucro líquido", value: (netProfit >= 0 ? "+" : "") + BZG.ui.formatMoney(netProfit), cls: netProfit >= 0 ? "stat-value--win" : "stat-value--lose" },
      { label: "Maior multiplicador", value: stats.bestMultiplier.toFixed(2) + "x", cls: "stat-value--gold" },
      { label: "Sequência atual", value: streakLabel, cls: "" }
    ];

    grid.innerHTML = boxes.map(function (b) {
      return '<div class="stat-box">' +
        '<div class="stat-label">' + b.label + '</div>' +
        '<div class="stat-value ' + b.cls + '">' + b.value + '</div>' +
        '</div>';
    }).join("");
  }

  document.addEventListener("DOMContentLoaded", function () {
    initBanner();
    buildTicker();
    renderGameCards();
    renderRanking();
    renderStats();

    document.addEventListener("bzg:balance-changed", function () {
      renderStats();
      renderRanking();
    });

    // renova o ticker e os contadores de vez em quando
    setInterval(buildTicker, 45000);
    setInterval(renderGameCards, 30000);
  });
})();
