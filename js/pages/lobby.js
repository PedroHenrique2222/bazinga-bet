/* Bazinga BET - logica da pagina inicial (lobby) */
(function () {
  var GAMES_DIR = "games/";

  var GAME_CARDS = [
    { id: "bazinguinha", href: "bazinguinha.html", icon: "🐯", name: "Bazinguinha", desc: "O tigrinho do Bazinga: wild grudento com respin e tela cheia ×10!", badge: "NOVO" },
    { id: "bonanza", href: "bonanza.html", icon: "💎", name: "Bazinga Bonanza", desc: "Cluster de gemas 8x8 com cascata e Febre do Ouro!", dev: true },
    { id: "horse", href: "horse.html", icon: "🏇", name: "Corrida BZG", desc: "Aposte num corredor da equipe BZG. Se vencer, paga 2x!", badge: "NOVO" },
    { id: "crash", href: "crash.html", icon: "🛶", name: "Canoa Furada", desc: "Retire antes da canoa do BZG afundar.", live: "crash" },
    { id: "double", href: "double.html", icon: "🎡", name: "Double", desc: "Vermelho, preto ou branco (14x).", live: "double" },
    { id: "mines", href: "mines.html", icon: "🥒", name: "Mines do Pikles", desc: "A horta do BZG Pikles Gamer: colha sem explodir." },
    { id: "tower", href: "tower.html", icon: "🗑️", name: "Lixeira do Linden", desc: "Suba a torre de lixo do BZG Linden." },
    { id: "plinko", href: "plinko.html", icon: "🎃", name: "Plinko da Abóbora", desc: "A chuva de abóboras do BZG Abóbora, até 220x." },
    { id: "dice", href: "dice.html", icon: "🎲", name: "Dado 616", desc: "O dado militar do BZG 616. Acima ou abaixo?" },
    { id: "hilo", href: "hilo.html", icon: "🃏", name: "HiLo do Panetone", desc: "As cartas do BZG Panetone: maior ou menor?" },
    { id: "coinflip", href: "coinflip.html", icon: "🔋", name: "Moeda da Pilha", desc: "⚡ ou 🔋? A moeda do BZG Pilha Avulsa." },
    { id: "blackjack", href: "blackjack.html", icon: "🍑", name: "21 do Bogão", desc: "Vença o Bogão no blackjack." },
    { id: "raspadinha", href: "raspadinha.html", icon: "🎟️", name: "Raspadinha", desc: "Raspe e ache 3 iguais para ganhar.", badge: "NOVO" },
    { id: "limbo", href: "limbo.html", icon: "📉", name: "Limbo", desc: "Passou do seu alvo? Você ganha.", badge: "NOVO" },
    { id: "roulette", href: "roulette.html", icon: "🎯", name: "Roleta", desc: "0 a 36, número cheio paga 36x." }
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

  /* ---------- Cards de jogos ---------- */

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
      if (card.dev) {
        return '<div class="game-card game-card--dev" title="Em desenvolvimento">' +
          '<span class="card-badge card-badge--dev">EM DESENVOLVIMENTO</span>' +
          '<div class="icon">' + card.icon + '</div>' +
          '<h2>' + card.name + '</h2>' +
          '<p>' + card.desc + '</p>' +
          '</div>';
      }
      var liveInfo = card.live ? '<div class="card-live"><span class="last-result">' + lastResultHTML(card) + '</span></div>' : "";
      var badge = card.badge ? '<span class="card-badge">' + card.badge + '</span>' : "";
      return '<a class="game-card" href="' + GAMES_DIR + card.href + '">' +
        badge +
        '<div class="icon">' + card.icon + '</div>' +
        '<h2>' + card.name + '</h2>' +
        '<p>' + card.desc + '</p>' +
        liveInfo +
        '</a>';
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

  /* avisa se o jogador tentou abrir direto um jogo em desenvolvimento (ver layout.js) */
  function showBlockedNotice() {
    var blocked = null;
    try { blocked = sessionStorage.getItem("bzgBlockedGame"); sessionStorage.removeItem("bzgBlockedGame"); } catch (e) {}
    if (blocked) BZG.ui.toast("🚧 " + blocked + " está em desenvolvimento. Volte em breve!", "info");
  }

  document.addEventListener("DOMContentLoaded", function () {
    initBanner();
    renderGameCards();
    renderStats();
    showBlockedNotice();

    document.addEventListener("bzg:balance-changed", function () {
      renderStats();
    });
  });
})();
