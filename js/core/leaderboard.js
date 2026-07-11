/* Bazinga BET - ranking online (Supabase). Agora OBRIGATORIO e em segundo plano:
   todo jogador entra no ranking automaticamente com o apelido do cadastro. O jogo
   continua salvo localmente; o Supabase e so a vitrine. Login sem e-mail: usa
   "anonymous sign-in" por baixo dos panos (cada aparelho ganha um id proprio pra so
   editar a propria linha - garantido por RLS). A chave abaixo e publica de proposito.

   Duas tabelas:
   - leaderboard: 1 linha por jogador (saldo, recorde de saldo, nivel) -> ranking GERAL.
   - game_scores: 1 linha por (jogador, jogo) com o maior ganho -> ranking POR JOGO.
     Minigames entram como game = "mg_torre"/"mg_rainbow"/... com o recorde de pontos. */
window.BZG = window.BZG || {};

BZG.leaderboard = (function () {
  var SUPABASE_URL = "https://iefrshxhfgdlyauzxkwa.supabase.co";
  var SUPABASE_ANON_KEY = "sb_publishable_fSANQNVaOavl3_aHU-IBuw_VeIYMRvH";

  var client = null;

  function isConfigured() {
    return SUPABASE_URL.indexOf("http") === 0 && SUPABASE_ANON_KEY.length > 30;
  }

  function getClient() {
    if (client) return client;
    if (!window.supabase || !window.supabase.createClient) return null;
    if (!isConfigured()) return null;
    client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true }
    });
    return client;
  }

  /* apelido do ranking = apelido do cadastro (obrigatorio, sem passo extra) */
  function getNickname() {
    try { return (BZG.storage.getProfile().nickname || "").trim().slice(0, 24); }
    catch (e) { return ""; }
  }
  function hasNickname() { return !!getNickname(); }

  function ensureSession() {
    var c = getClient();
    if (!c) return Promise.resolve(null);
    return c.auth.getSession().then(function (res) {
      if (res.data && res.data.session) return res.data.session.user;
      return c.auth.signInAnonymously().then(function (r2) {
        if (r2.error) throw r2.error;
        return r2.data.user;
      });
    });
  }

  function generalStats() {
    var stats = BZG.storage.getStats();
    var lvl = BZG.storage.getLevel();
    return {
      balance: Math.round(BZG.storage.getBalance()),
      peak_balance: Math.round(stats.peakBalance || 0),
      level: lvl.level
    };
  }

  // aparencia do jogador pra mostrar no ranking: avatar (icone), cor do nome, titulo (texto)
  function cosmeticsOf() {
    var prof = BZG.storage.getProfile ? BZG.storage.getProfile() : {};
    var cos = BZG.storage.getCosmetics ? BZG.storage.getCosmetics() : {};
    var title = "";
    try { if (cos.title && BZG.battlepass) title = BZG.battlepass.titleLabel(cos.title) || ""; } catch (e) {}
    return { avatar: prof.avatar || "😎", name_color: cos.nameColor || "default", title: title };
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (m) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m];
    });
  }

  // HTML do jogador a partir de uma linha do ranking: avatar + nome colorido + titulo
  function rowNameHTML(row) {
    var colorCls = row.name_color && row.name_color !== "default" ? " color-" + row.name_color : "";
    var html = '<span class="lb-avatar">' + esc(row.avatar || "😎") + '</span>' +
      '<span class="bzg-name' + colorCls + '">' + esc(row.nickname || "Anônimo") + '</span>';
    if (row.title) html += '<span class="bzg-title">' + esc(row.title) + '</span>';
    return html;
  }

  /* sincroniza tudo: linha geral + maior ganho de cada jogo + recorde de cada minigame */
  function sync() {
    var c = getClient();
    if (!c) return Promise.resolve(false);
    var nick = getNickname();
    if (!nick) return Promise.resolve(false);
    return ensureSession().then(function (user) {
      if (!user) return false;
      var now = new Date().toISOString();
      var s = generalStats();
      var look = cosmeticsOf(); // { avatar, name_color, title }
      var jobs = [];
      jobs.push(c.from("leaderboard").upsert({
        id: user.id, nickname: nick,
        balance: s.balance, peak_balance: s.peak_balance, level: s.level,
        avatar: look.avatar, name_color: look.name_color, title: look.title,
        updated_at: now
      }));

      var rows = [];
      var gb = BZG.storage.getAllGameBests();
      Object.keys(gb).forEach(function (g) {
        if (gb[g] > 0) rows.push({ id: user.id, game: g, nickname: nick, score: Math.round(gb[g]), avatar: look.avatar, name_color: look.name_color, title: look.title, updated_at: now });
      });
      var mb = BZG.storage.getAllMinigameBests();
      Object.keys(mb).forEach(function (g) {
        if (mb[g] > 0) rows.push({ id: user.id, game: "mg_" + g, nickname: nick, score: Math.round(mb[g]), avatar: look.avatar, name_color: look.name_color, title: look.title, updated_at: now });
      });
      if (rows.length) jobs.push(c.from("game_scores").upsert(rows, { onConflict: "id,game" }));

      return Promise.all(jobs).then(function (results) {
        return results.every(function (r) { return !r.error; });
      });
    }).catch(function () { return false; });
  }

  /* ranking GERAL por metrica ('balance' | 'peak_balance' | 'level') */
  function fetchTop(metric, limit) {
    var c = getClient();
    if (!c) return Promise.resolve(null);
    var col = metric === "peak_balance" ? "peak_balance" : (metric === "level" ? "level" : "balance");
    return c.from("leaderboard")
      .select("id,nickname,balance,peak_balance,level,avatar,name_color,title")
      .order(col, { ascending: false })
      .order("peak_balance", { ascending: false })
      .limit(limit || 100)
      .then(function (r) { return r.error ? null : (r.data || []); })
      .catch(function () { return null; });
  }

  /* ranking POR JOGO (gameKey = chave do jogo, ou "mg_<minigame>") pelo maior score */
  function fetchTopByGame(gameKey, limit) {
    var c = getClient();
    if (!c) return Promise.resolve(null);
    return c.from("game_scores")
      .select("id,nickname,score,avatar,name_color,title")
      .eq("game", gameKey)
      .order("score", { ascending: false })
      .limit(limit || 100)
      .then(function (r) { return r.error ? null : (r.data || []); })
      .catch(function () { return null; });
  }

  function myId() {
    var c = getClient();
    if (!c) return Promise.resolve(null);
    return c.auth.getSession().then(function (res) {
      return (res.data && res.data.session) ? res.data.session.user.id : null;
    }).catch(function () { return null; });
  }

  return {
    isConfigured: isConfigured,
    getClient: getClient,
    getNickname: getNickname,
    hasNickname: hasNickname,
    ensureSession: ensureSession,
    generalStats: generalStats,
    cosmeticsOf: cosmeticsOf,
    rowNameHTML: rowNameHTML,
    sync: sync,
    fetchTop: fetchTop,
    fetchTopByGame: fetchTopByGame,
    myId: myId
  };
})();
