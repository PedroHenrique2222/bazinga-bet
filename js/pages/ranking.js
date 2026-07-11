/* Bazinga BET - página de Ranking (usa BZG.leaderboard / Supabase).
   Ranking GERAL (saldo/recorde/nível) + ranking POR JOGO (maior ganho de cada jogo,
   e recorde de cada minigame). Entrada automática com o apelido do cadastro. */
(function () {
  var LB = BZG.leaderboard;

  // jogos no seletor "por jogo": aposta = maior ganho (em BZ$); minigame = recorde de pontos
  var GAMES = [
    { key: "crash", label: "🛶 Canoa Furada", money: true },
    { key: "double", label: "🎡 Double", money: true },
    { key: "mines", label: "🥒 Mines do Pikles", money: true },
    { key: "tower", label: "🗑️ Lixeira do Linden", money: true },
    { key: "plinko", label: "🎃 Plinko da Abóbora", money: true },
    { key: "dice", label: "🎲 Dado 616", money: true },
    { key: "hilo", label: "🃏 HiLo do Panetone", money: true },
    { key: "roulette", label: "🎯 Roleta", money: true },
    { key: "blackjack", label: "🍑 21 do Bogão", money: true },
    { key: "raspadinha", label: "🎟️ Raspadinha", money: true },
    { key: "limbo", label: "📉 Limbo", money: true },
    { key: "coinflip", label: "🔋 Moeda da Pilha", money: true },
    { key: "horse", label: "🏇 Corrida BZG", money: true },
    { key: "bazinguinha", label: "🐯 Bazinguinha", money: true },
    { key: "mg_torre", label: "🧱 Torre do CBPB_Gamer", money: false, unit: "andares" },
    { key: "mg_rainbow", label: "🏳️‍🌈 Sequência Arco-íris", money: false, unit: "rodadas" },
    { key: "mg_shadow", label: "🌑 Sombra Rápida", money: false, unit: "acertos" },
    { key: "mg_alien", label: "👽 Fuga Alienígena", money: false, unit: "s" }
  ];

  var listEl, meNickEl, meStatsEl, refreshBtn, gameListEl, gameSelect, gameRefreshBtn;
  var currentMetric = "balance";
  var currentGame = GAMES[0];
  var myUuid = null;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (m) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m];
    });
  }

  function generalValue(row, metric) {
    if (metric === "level") return "Lv " + (row.level || 1);
    return BZG.ui.formatMoney(row[metric] || 0);
  }

  function gameValue(score) {
    if (currentGame.money) return BZG.ui.formatMoney(score || 0);
    return (score || 0) + (currentGame.unit ? " " + currentGame.unit : "");
  }

  function emptyState(icon, title, sub) {
    return '<div class="rank-empty"><div class="rank-empty-icon">' + icon + '</div>' +
      '<p><strong>' + esc(title) + '</strong></p>' +
      (sub ? '<p class="rank-msg">' + esc(sub) + '</p>' : "") + '</div>';
  }

  function rowHTML(pos, nameHtml, valueHtml, isMe, subHtml) {
    var medal = pos === 1 ? "🥇" : pos === 2 ? "🥈" : pos === 3 ? "🥉" : ("#" + pos);
    return '<div class="rank-row' + (isMe ? " me" : "") + (pos <= 3 ? " top" : "") + '">' +
      '<div class="rank-pos">' + medal + '</div>' +
      '<div class="rank-info">' +
        '<div class="rank-nick">' + nameHtml +
          (isMe ? '<span class="rank-you">VOCÊ</span>' : "") + '</div>' +
          (subHtml ? '<div class="rank-sub">' + subHtml + '</div>' : "") +
      '</div>' +
      '<div class="rank-val">' + valueHtml + '</div>' +
      '</div>';
  }

  function renderGeneral(rows) {
    if (rows === null) { listEl.innerHTML = emptyState("🛠️", "Ranking indisponível agora.", "Verifique sua internet e tente atualizar."); return; }
    if (!rows.length) { listEl.innerHTML = emptyState("👑", "Ninguém no ranking ainda.", "Jogue uma partida e você aparece aqui!"); return; }
    listEl.innerHTML = rows.map(function (row, i) {
      var sub = "💰 " + BZG.ui.formatMoney(row.balance || 0) +
        " · 📈 " + BZG.ui.formatMoney(row.peak_balance || 0) +
        " · ⭐ Lv " + (row.level || 1);
      return rowHTML(i + 1, LB.rowNameHTML(row), generalValue(row, currentMetric), myUuid && row.id === myUuid, sub);
    }).join("");
  }

  function renderGame(rows) {
    if (rows === null) { gameListEl.innerHTML = emptyState("🛠️", "Ranking indisponível agora.", "Tente atualizar."); return; }
    if (!rows.length) { gameListEl.innerHTML = emptyState("🎯", "Ninguém pontuou aqui ainda.", "Seja o primeiro a marcar no " + currentGame.label + "!"); return; }
    gameListEl.innerHTML = rows.map(function (row, i) {
      return rowHTML(i + 1, LB.rowNameHTML(row), gameValue(row.score), myUuid && row.id === myUuid, null);
    }).join("");
  }

  function loadGeneral() {
    listEl.innerHTML = '<p class="rank-msg">Carregando…</p>';
    LB.fetchTop(currentMetric, 100).then(renderGeneral);
  }
  function loadGame() {
    gameListEl.innerHTML = '<p class="rank-msg">Carregando…</p>';
    LB.fetchTopByGame(currentGame.key, 100).then(renderGame);
  }

  function refreshMeBar() {
    var s = LB.generalStats();
    meNickEl.textContent = LB.getNickname() || "—";
    meStatsEl.textContent = "💰 " + BZG.ui.formatMoney(s.balance) +
      " · 📈 " + BZG.ui.formatMoney(s.peak_balance) + " · ⭐ Lv " + s.level;
  }

  function init() {
    listEl = document.getElementById("rank-list");
    meNickEl = document.getElementById("rank-me-nick");
    meStatsEl = document.getElementById("rank-me-stats");
    refreshBtn = document.getElementById("rank-refresh");
    gameListEl = document.getElementById("rank-game-list");
    gameSelect = document.getElementById("rank-game-select");
    gameRefreshBtn = document.getElementById("rank-game-refresh");

    refreshMeBar();

    gameSelect.innerHTML = GAMES.map(function (g, i) {
      return '<option value="' + i + '">' + g.label + '</option>';
    }).join("");

    document.querySelectorAll(".rank-tab").forEach(function (tab) {
      tab.addEventListener("click", function () {
        document.querySelectorAll(".rank-tab").forEach(function (t) { t.classList.remove("active"); });
        tab.classList.add("active");
        currentMetric = tab.dataset.metric;
        loadGeneral();
      });
    });
    refreshBtn.addEventListener("click", function () { if (LB.sync) LB.sync(); loadGeneral(); });
    gameSelect.addEventListener("change", function () { currentGame = GAMES[Number(gameSelect.value)] || GAMES[0]; loadGame(); });
    gameRefreshBtn.addEventListener("click", loadGame);

    if (!LB.isConfigured()) {
      renderGeneral(null);
      renderGame(null);
      return;
    }

    // entra/atualiza no ranking (apelido do cadastro) e carrega os dois quadros
    LB.sync().then(function () {
      LB.myId().then(function (id) {
        myUuid = id;
        loadGeneral();
        loadGame();
      });
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
