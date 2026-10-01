/* Bazinga BET - logica da pagina inicial (lobby) */
(function () {
  var GAMES_DIR = "games/";
  var COVERS_DIR = "assets/capas/"; // capas 768x1024 (geradas pelo Codex, v1.26)

  /* capa do cartao: se a imagem nao carregar, o cartao volta ao visual com icone */
  function coverHTML(id) {
    return '<img class="card-cover" src="' + COVERS_DIR + id + '.webp" alt="" loading="lazy" decoding="async" ' +
      'onerror="this.parentNode.classList.remove(\'game-card--cover\'); this.remove();">';
  }

  /* minigames sem aposta (nao mexem no saldo) */
  var MINIGAME_CARDS = [
    { id: "torre", href: "minigames/torre.html", name: "Torre do CBPB_Gamer" },
    { id: "arcoiris", href: "minigames/arcoiris.html", name: "Sequência Arco-íris" },
    { id: "sombra", href: "minigames/sombra.html", name: "Sombra Rápida" },
    { id: "alien", href: "minigames/alien.html", name: "Fuga Alienígena" }
  ];

  var GAME_CARDS = [
    { id: "bazinguinha", color: "#e08a00", href: "bazinguinha.html", icon: "🐯", name: "Bazinguinha", desc: "O tigrinho do Bazinga: wild grudento com respin e tela cheia ×10!", badge: "NOVO" },
    { id: "bonanza", color: "#c2185b", href: "bonanza.html", icon: "💎", name: "Bazinga Bonanza", desc: "Estilo Sweet Bonanza: paga em qualquer lugar, cascata, bombas de multiplicador e rodadas grátis!", badge: "NOVO" },
    { id: "horse", color: "#2856b8", href: "horse.html", icon: "🏇", name: "Corrida BZG", desc: "Aposte num corredor da equipe BZG. Se vencer, paga 2x!", badge: "NOVO" },
    { id: "crash", color: "#0e7c86", href: "crash.html", icon: "🛶", name: "Canoa Furada", desc: "Retire antes da canoa do BZG afundar.", live: "crash" },
    { id: "double", color: "#b5122e", href: "double.html", icon: "🎡", name: "Double", desc: "Vermelho, preto ou branco (14x).", live: "double" },
    { id: "mines", color: "#1e8e4e", href: "mines.html", icon: "🥒", name: "Mines do Pikles", desc: "A horta do BZG Pikles Gamer: colha sem explodir." },
    { id: "tower", color: "#b85a10", href: "tower.html", icon: "🗑️", name: "Lixeira do Linden", desc: "Suba a torre de lixo do BZG Linden." },
    { id: "plinko", color: "#5b2bb5", href: "plinko.html", icon: "🎃", name: "Plinko da Abóbora", desc: "A chuva de abóboras do BZG Abóbora, até 220x." },
    { id: "dice", color: "#3d3d8f", href: "dice.html", icon: "🎲", name: "Dado 616", desc: "O dado militar do BZG 616. Acima ou abaixo?" },
    { id: "hilo", color: "#8a1c5c", href: "hilo.html", icon: "🃏", name: "HiLo do Panetone", desc: "As cartas do BZG Panetone: maior ou menor?" },
    { id: "coinflip", color: "#8c7a00", href: "coinflip.html", icon: "🔋", name: "Moeda da Pilha", desc: "⚡ ou 🔋? A moeda do BZG Pilha Avulsa." },
    { id: "blackjack", color: "#0f5c3e", href: "blackjack.html", icon: "🍑", name: "21 do Bogão", desc: "Vença o Bogão no blackjack." },
    { id: "raspadinha", color: "#6b4bd6", href: "raspadinha.html", icon: "🎟️", name: "Raspadinha", desc: "Raspe e ache 3 iguais para ganhar.", badge: "NOVO" },
    { id: "limbo", color: "#1d5f99", href: "limbo.html", icon: "📉", name: "Limbo", desc: "Passou do seu alvo? Você ganha.", badge: "NOVO" },
    { id: "roulette", color: "#8a1c1c", href: "roulette.html", icon: "🎯", name: "Roleta", desc: "0 a 36, número cheio paga 36x.", live: "roulette" }
  ];

  /* ---------- Banner rotativo ----------
     Um slide por jogo, com a capa ilustrada (assets/capas). Troca sozinho a cada
     5s, pausa com o mouse em cima, tem setas e da pra arrastar no celular. */

  function bannerTag(card) {
    if (card.live) return '<span class="banner-badge banner-badge--live">AO VIVO</span>';
    if (card.badge) return '<span class="banner-badge">' + card.badge + '</span>';
    return "";
  }

  function initBanner() {
    var banner = document.getElementById("banner");
    var track = document.getElementById("banner-track");
    if (!banner || !track) return;
    var dotsWrap = document.getElementById("banner-dots");

    track.innerHTML = GAME_CARDS.map(function (card, i) {
      var cover = COVERS_DIR + card.id + ".webp";
      var icon = BZG.icons && BZG.icons.has(card.id) ? BZG.icons.tile(card.id, 34) : card.icon;
      return '<a class="banner-slide' + (i === 0 ? " active" : "") + '" href="' + GAMES_DIR + card.href + '" ' +
        'style="--card-c:' + card.color + '" aria-label="' + card.name + '"' + (i === 0 ? "" : ' tabindex="-1"') + '>' +
        '<img class="banner-bg" src="' + cover + '" alt="" aria-hidden="true" loading="' + (i < 2 ? "eager" : "lazy") + '" onerror="this.remove()">' +
        '<div class="banner-copy">' +
          '<div class="banner-kicker">' + icon + bannerTag(card) + '</div>' +
          '<h2>' + card.name + '</h2>' +
          '<p>' + card.desc + '</p>' +
          '<span class="btn btn--gold banner-cta">Jogar agora</span>' +
        '</div>' +
        '<img class="banner-art" src="' + cover + '" alt="" loading="' + (i < 2 ? "eager" : "lazy") + '" onerror="this.remove()">' +
        '</a>';
    }).join("");

    var slides = Array.prototype.slice.call(track.children);
    var current = 0;
    var timer = null;

    dotsWrap.innerHTML = "";
    slides.forEach(function (_, i) {
      var dot = document.createElement("button");
      dot.type = "button";
      dot.className = "banner-dot" + (i === 0 ? " active" : "");
      dot.setAttribute("aria-label", "Mostrar " + GAME_CARDS[i].name);
      dot.addEventListener("click", function () { goTo(i); restart(); });
      dotsWrap.appendChild(dot);
    });
    var dots = Array.prototype.slice.call(dotsWrap.children);

    function goTo(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (s, i) {
        var on = i === current;
        s.classList.toggle("active", on);
        if (on) s.removeAttribute("tabindex"); else s.setAttribute("tabindex", "-1");
      });
      dots.forEach(function (d, i) { d.classList.toggle("active", i === current); });
    }

    function restart() {
      if (timer) clearInterval(timer);
      timer = setInterval(function () { goTo(current + 1); }, 5000);
    }

    document.getElementById("banner-prev").addEventListener("click", function () { goTo(current - 1); restart(); });
    document.getElementById("banner-next").addEventListener("click", function () { goTo(current + 1); restart(); });
    banner.addEventListener("mouseenter", function () { if (timer) clearInterval(timer); });
    banner.addEventListener("mouseleave", restart);

    // arrastar para os lados no celular troca de jogo (sem abrir o jogo sem querer)
    var startX = null, dragged = false;
    banner.addEventListener("pointerdown", function (e) { startX = e.clientX; dragged = false; });
    banner.addEventListener("pointerup", function (e) {
      if (startX === null) return;
      var dx = e.clientX - startX;
      startX = null;
      if (Math.abs(dx) > 40) { dragged = true; goTo(current + (dx < 0 ? 1 : -1)); restart(); }
    });
    track.addEventListener("click", function (e) { if (dragged) { e.preventDefault(); dragged = false; } });

    restart();
  }

  /* ---------- Cards de jogos ---------- */

  // jogadores de verdade em cada mesa ao vivo (presence do site, js/core/live.js)
  var livePages = {};
  function playersText(id) {
    var n = livePages[id] || 0;
    return n > 0 ? "👥 " + n + " jogando agora" : "Rodadas ao vivo";
  }
  document.addEventListener("bzg:live-online", function (e) {
    livePages = e.detail.pages || {};
    Array.prototype.forEach.call(document.querySelectorAll("[data-live-count]"), function (el) {
      el.textContent = playersText(el.getAttribute("data-live-count"));
    });
  });

  function lastResultHTML(card) {
    if (card.live) return '<span data-live-count="' + card.live + '">' + playersText(card.live) + '</span>';
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
      return '<a class="game-card game-card--cover" href="' + GAMES_DIR + card.href + '" style="--card-c:' + card.color + '">' +
        coverHTML(card.id) +
        badge +
        '<div class="icon">' + (BZG.icons && BZG.icons.has(card.id) ? BZG.icons.art(card.id, 84) : card.icon) + '</div>' +
        '<h2>' + card.name + '</h2>' +
        '<p>' + card.desc + '</p>' +
        liveInfo +
        '</a>';
    }).join("");
  }

  function renderMinigameCards() {
    var grid = document.getElementById("minigames-grid");
    if (!grid) return;
    grid.innerHTML = MINIGAME_CARDS.map(function (card) {
      var color = BZG.icons ? BZG.icons.color(card.id) : "#1a242d";
      return '<a class="game-card game-card--cover" href="' + card.href + '" style="--card-c:' + color + '">' +
        coverHTML(card.id) +
        '<span class="card-badge card-badge--free">SEM APOSTA</span>' +
        '<div class="icon">' + (BZG.icons ? BZG.icons.art(card.id, 84) : "") + '</div>' +
        '<h2>' + card.name + '</h2>' +
        '</a>';
    }).join("");
  }

  /* ---------- Ultimas apostas (so as do proprio jogador, dados reais) ---------- */

  function renderRecentBets() {
    var wrap = document.getElementById("recent-bets");
    if (!wrap) return;
    var all = [];
    GAME_CARDS.forEach(function (card) {
      BZG.storage.getHistory(card.id).forEach(function (h) { all.push({ card: card, h: h }); });
    });
    all.sort(function (a, b) { return b.h.time - a.h.time; });
    all = all.slice(0, 8);

    var head = '<div class="bets-row bets-row--head"><span>Jogo</span><span class="bets-time">Hora</span>' +
      '<span class="bets-bet">Aposta</span><span>Mult.</span><span class="bets-pay">Pagamento</span></div>';
    if (!all.length) {
      wrap.innerHTML = head + '<div class="bets-empty">Você ainda não apostou. Escolha um jogo acima!</div>';
      return;
    }
    wrap.innerHTML = head + all.map(function (x) {
      var h = x.h, cls = h.won ? "bets-win" : "bets-lose";
      var time = new Date(h.time).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      return '<div class="bets-row">' +
        '<span class="bets-game"><span class="bets-dot" style="background:' + x.card.color + '"></span>' + x.card.name + '</span>' +
        '<span class="bets-time">' + time + '</span>' +
        '<span class="bets-bet">' + BZG.ui.formatMoney(h.bet) + '</span>' +
        '<span class="' + cls + '">' + Number(h.multiplier || 0).toFixed(2) + 'x</span>' +
        '<span class="bets-pay ' + cls + '">' + BZG.ui.formatMoney(h.won ? h.payout : 0) + '</span>' +
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

  /* avisa se o jogador tentou abrir direto um jogo em desenvolvimento (ver layout.js) */
  function showBlockedNotice() {
    var blocked = null;
    try { blocked = sessionStorage.getItem("bzgBlockedGame"); sessionStorage.removeItem("bzgBlockedGame"); } catch (e) {}
    if (blocked) BZG.ui.toast("🚧 " + blocked + " está em desenvolvimento. Volte em breve!", "info");
  }

  document.addEventListener("DOMContentLoaded", function () {
    initBanner();
    renderGameCards();
    renderMinigameCards();
    renderStats();
    renderRecentBets();
    showBlockedNotice();

    document.addEventListener("bzg:balance-changed", function () {
      renderStats();
      renderRecentBets();
    });
  });
})();
