/* Bazinga BET - camada de armazenamento (localStorage) */
window.BZG = window.BZG || {};

BZG.storage = (function () {
  var STORAGE_KEY = "bazingaBetState";
  var STARTING_BALANCE = 10000;
  var MAX_HISTORY_ENTRIES = 25;
  // Marca de reset: ao mudar este valor, TODO jogador tem os niveis/XP zerados
  // uma unica vez ao abrir o site (o Passe de Batalha tambem reinicia).
  var RESET_TOKEN = "levels-reset-2026-07";

  function defaultState() {
    return {
      account: null,        // { nickname, email, password, createdAt } - cadastro local, sem backend
      balance: STARTING_BALANCE,
      reloadBonus: 0,        // aumenta o valor do botao "Recarregar", recompensa do Passe de Batalha
      profile: {
        nickname: "Jogador",
        avatar: "😎",
        xp: 0
      },
      daily: {
        date: "",
        won: 0
      },
      recent: {
        crash: [],
        double: []
      },
      bonus: {
        lastClaim: "",
        streak: 0
      },
      achievements: {},
      cosmetics: {
        avatars: [],        // avatares premium desbloqueados
        nameColors: [],     // ids de cores de nome desbloqueadas
        nameColor: "default",
        titles: [],         // ids de titulos desbloqueados
        title: "",          // titulo selecionado ("" = nenhum)
        themes: [],         // ids de temas desbloqueados (alem de dark/light)
        turbo: false        // modo turbo desbloqueado
      },
      turboOn: false,       // modo turbo ligado
      battlepass: { claimed: {} },
      collectibles: { owned: {} },   // colecionaveis tematicos dos Bazingas: owned[itemId] = timestamp
      minigames: { torre: { bestFloor: 0 } }, // recordes pessoais dos minigames sem aposta
      resetToken: RESET_TOKEN,
      stats: {
        totalWagered: 0,
        totalWon: 0,
        totalLost: 0,
        bestMultiplier: 0,
        maxBet: 0,
        maxWin: 0,
        peakBalance: STARTING_BALANCE, // maior saldo que o jogador ja teve
        currentStreak: 0,
        bestWinStreak: 0,
        bestLossStreak: 0,
        autoReloads: 0
      },
      history: {
        crash: [],
        mines: [],
        plinko: [],
        double: [],
        tower: [],
        dice: [],
        hilo: [],
        slots: [],
        roulette: [],
        blackjack: [],
        bazinguinha: [],
        raspadinha: [],
        limbo: [],
        wheel: [],
        coinflip: [],
        bonanza: [],
        horse: [],
        stack: []
      }
    };
  }

  function todayKey() {
    var d = new Date();
    return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
  }

  function getState() {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      var fresh = defaultState();
      saveState(fresh);
      return fresh;
    }
    try {
      var parsed = JSON.parse(raw);
      // preenche campos que possam faltar (ex.: versoes futuras)
      var base = defaultState();
      parsed.stats = Object.assign({}, base.stats, parsed.stats);
      parsed.history = Object.assign({}, base.history, parsed.history);
      parsed.profile = Object.assign({}, base.profile, parsed.profile);
      parsed.daily = Object.assign({}, base.daily, parsed.daily);
      parsed.recent = Object.assign({}, base.recent, parsed.recent);
      parsed.bonus = Object.assign({}, base.bonus, parsed.bonus);
      parsed.achievements = Object.assign({}, base.achievements, parsed.achievements);
      parsed.cosmetics = Object.assign({}, base.cosmetics, parsed.cosmetics);
      parsed.battlepass = Object.assign({}, base.battlepass, parsed.battlepass);
      if (!parsed.battlepass.claimed) parsed.battlepass.claimed = {};
      parsed.collectibles = Object.assign({}, base.collectibles, parsed.collectibles);
      if (!parsed.collectibles.owned) parsed.collectibles.owned = {};
      parsed.minigames = Object.assign({}, base.minigames, parsed.minigames);
      if (!parsed.minigames.torre) parsed.minigames.torre = { bestFloor: 0 };
      if (typeof parsed.turboOn !== "boolean") parsed.turboOn = false;
      if (typeof parsed.account === "undefined") parsed.account = null;
      if (typeof parsed.reloadBonus !== "number" || isNaN(parsed.reloadBonus)) parsed.reloadBonus = 0;
      if (typeof parsed.stats.autoReloads !== "number") parsed.stats.autoReloads = 0;
      if (typeof parsed.balance !== "number" || isNaN(parsed.balance)) {
        parsed.balance = base.balance;
      }
      // quem ja jogava antes desse campo existir: usa o saldo atual como piso do recorde
      if (typeof parsed.stats.peakBalance !== "number" || isNaN(parsed.stats.peakBalance)) {
        parsed.stats.peakBalance = parsed.balance;
      }
      // Reset unico de niveis/XP e do Passe de Batalha (roda uma vez por navegador)
      if (parsed.resetToken !== RESET_TOKEN) {
        parsed.profile.xp = 0;
        parsed.battlepass.claimed = {};
        parsed.resetToken = RESET_TOKEN;
        saveState(parsed);
      }
      return parsed;
    } catch (e) {
      var reset = defaultState();
      saveState(reset);
      return reset;
    }
  }

  function saveState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function getBalance() {
    return getState().balance;
  }

  function trackPeak(state) {
    state.stats.peakBalance = Math.max(state.stats.peakBalance || 0, state.balance);
  }

  function setBalance(value) {
    var state = getState();
    state.balance = Math.max(0, Math.round(value));
    trackPeak(state);
    saveState(state);
    return state.balance;
  }

  function adjustBalance(delta) {
    var state = getState();
    state.balance = Math.max(0, Math.round(state.balance + delta));
    trackPeak(state);
    saveState(state);
    return state.balance;
  }

  // valor atual de recarga: base + bonus ganho no Passe de Batalha (recompensa "reloadBoost")
  function getReloadAmount() {
    return STARTING_BALANCE + (getState().reloadBonus || 0);
  }

  function addReloadBonus(amount) {
    var state = getState();
    state.reloadBonus = (state.reloadBonus || 0) + amount;
    saveState(state);
    return state.reloadBonus;
  }

  function resetBalance() {
    var state = getState();
    state.balance = STARTING_BALANCE + (state.reloadBonus || 0);
    trackPeak(state);
    saveState(state);
    return state.balance;
  }

  // recarga automatica quando o saldo zera (conta separado do botao manual, para conquistas)
  function autoReload() {
    var state = getState();
    state.stats.autoReloads = (state.stats.autoReloads || 0) + 1;
    state.balance = STARTING_BALANCE + (state.reloadBonus || 0);
    trackPeak(state);
    saveState(state);
    return state.balance;
  }

  function getStats() {
    return getState().stats;
  }

  function getHistory(game) {
    var state = getState();
    return state.history[game] || [];
  }

  /**
   * Registra o resultado de uma aposta e atualiza saldo, historico e estatisticas.
   * entry: { bet, multiplier, payout, won, detail, alreadyDebited }
   * alreadyDebited: true quando a aposta ja foi descontada do saldo na hora do
   * lancamento (ex.: Plinko com varias bolinhas no ar) - ai so credita o premio.
   */
  function recordBet(game, entry) {
    var state = getState();

    var debit = entry.alreadyDebited ? 0 : entry.bet;
    state.balance = Math.max(0, Math.round(state.balance - debit + entry.payout));
    trackPeak(state);

    state.stats.totalWagered += entry.bet;
    if (entry.won) {
      state.stats.totalWon += Math.max(0, entry.payout - entry.bet);
      state.stats.currentStreak = state.stats.currentStreak > 0 ? state.stats.currentStreak + 1 : 1;
      state.stats.bestWinStreak = Math.max(state.stats.bestWinStreak, state.stats.currentStreak);
    } else {
      state.stats.totalLost += entry.bet;
      state.stats.currentStreak = state.stats.currentStreak < 0 ? state.stats.currentStreak - 1 : -1;
      state.stats.bestLossStreak = Math.max(state.stats.bestLossStreak, -state.stats.currentStreak);
    }
    state.stats.bestMultiplier = Math.max(state.stats.bestMultiplier, entry.multiplier || 0);
    state.stats.maxBet = Math.max(state.stats.maxBet || 0, entry.bet);
    if (entry.won) state.stats.maxWin = Math.max(state.stats.maxWin || 0, entry.payout);

    // XP: 1 ponto a cada BZ$ 10 apostados
    state.profile.xp += entry.bet / 10;

    // ganhos do dia (para o ranking)
    var today = todayKey();
    if (state.daily.date !== today) {
      state.daily.date = today;
      state.daily.won = 0;
    }
    if (entry.won) {
      state.daily.won += Math.max(0, entry.payout - entry.bet);
    }

    if (!state.history[game]) state.history[game] = [];
    state.history[game].unshift({
      time: Date.now(),
      bet: entry.bet,
      multiplier: entry.multiplier || 0,
      payout: entry.payout,
      won: entry.won,
      detail: entry.detail || ""
    });
    state.history[game] = state.history[game].slice(0, MAX_HISTORY_ENTRIES);

    saveState(state);
    // avisa quem quiser reagir a uma aposta especifica (ex.: drop de colecionavel),
    // separado do bzg:balance-changed generico (que tambem dispara em recarga/bonus)
    document.dispatchEvent(new CustomEvent("bzg:bet-recorded", { detail: { game: game } }));
    return state;
  }

  // XP direto, fora do fluxo de aposta (ex.: recompensa de minigame sem aposta)
  function addXp(amount) {
    var state = getState();
    state.profile.xp += amount;
    saveState(state);
    return state.profile.xp;
  }

  function getProfile() {
    return getState().profile;
  }

  function setProfile(patch) {
    var state = getState();
    state.profile = Object.assign({}, state.profile, patch);
    saveState(state);
    return state.profile;
  }

  /* Nivel: comeca em 1, sobe a cada 1000 XP */
  function getLevel() {
    var xp = getState().profile.xp;
    var level = 1 + Math.floor(xp / 1000);
    return {
      level: level,
      xp: Math.round(xp),
      into: Math.round(xp % 1000),
      needed: 1000
    };
  }

  function getDailyWon() {
    var state = getState();
    return state.daily.date === todayKey() ? state.daily.won : 0;
  }

  /* Resultados recentes das rodadas (Crash: multiplicador, Double: {n, color}) */
  function pushRecent(game, value) {
    var state = getState();
    if (!state.recent[game]) state.recent[game] = [];
    state.recent[game].unshift(value);
    state.recent[game] = state.recent[game].slice(0, 15);
    saveState(state);
  }

  function getRecent(game) {
    var state = getState();
    return state.recent[game] || [];
  }

  /* ---------- Bonus diario ---------- */

  // valor do bonus por dia de sequencia (dia 1 = 500, ..., dia 7+ = 5000)
  var BONUS_BY_STREAK = [500, 1000, 1500, 2500, 3500, 4500, 5000];

  function bonusAmountFor(streak) {
    var idx = Math.min(streak, BONUS_BY_STREAK.length) - 1;
    return BONUS_BY_STREAK[Math.max(0, idx)];
  }

  function yesterdayKey() {
    var d = new Date();
    d.setDate(d.getDate() - 1);
    return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
  }

  function getBonusInfo() {
    var state = getState();
    var today = todayKey();
    var available = state.bonus.lastClaim !== today;
    // se a sequencia nao foi mantida (nao pegou ontem nem hoje), reinicia
    var nextStreak;
    if (state.bonus.lastClaim === yesterdayKey()) {
      nextStreak = state.bonus.streak + 1;
    } else if (state.bonus.lastClaim === today) {
      nextStreak = state.bonus.streak;
    } else {
      nextStreak = 1;
    }
    return {
      available: available,
      streak: state.bonus.streak,
      nextStreak: nextStreak,
      amount: bonusAmountFor(nextStreak)
    };
  }

  function claimBonus() {
    var state = getState();
    var today = todayKey();
    if (state.bonus.lastClaim === today) return null; // ja pegou hoje

    var newStreak = state.bonus.lastClaim === yesterdayKey() ? state.bonus.streak + 1 : 1;
    var amount = bonusAmountFor(newStreak);
    state.bonus.lastClaim = today;
    state.bonus.streak = newStreak;
    state.balance += amount;
    trackPeak(state);
    saveState(state);
    return { amount: amount, streak: newStreak };
  }

  /* ---------- Conquistas ---------- */

  function getAchievements() {
    return getState().achievements;
  }

  function unlockAchievement(id) {
    var state = getState();
    if (state.achievements[id]) return false;
    state.achievements[id] = Date.now();
    saveState(state);
    return true;
  }

  function countGamesPlayed() {
    var h = getState().history;
    var n = 0;
    Object.keys(h).forEach(function (g) { if (h[g] && h[g].length) n++; });
    return n;
  }

  /* ---------- Cosmeticos (Passe de Batalha) ---------- */

  function getCosmetics() {
    return getState().cosmetics;
  }

  // adiciona um item desbloqueado a uma lista (avatars/nameColors/titles/themes)
  function unlockCosmetic(listKey, value) {
    var state = getState();
    var arr = state.cosmetics[listKey] || (state.cosmetics[listKey] = []);
    if (arr.indexOf(value) === -1) { arr.push(value); saveState(state); return true; }
    return false;
  }

  function unlockTurbo() {
    var state = getState();
    if (state.cosmetics.turbo) return false;
    state.cosmetics.turbo = true;
    saveState(state);
    return true;
  }

  function setCosmetic(key, value) {
    var state = getState();
    state.cosmetics[key] = value;
    saveState(state);
    return value;
  }

  function isTurboUnlocked() { return !!getState().cosmetics.turbo; }
  function isTurboOn() { var s = getState(); return !!s.cosmetics.turbo && !!s.turboOn; }
  function setTurboOn(on) {
    var state = getState();
    state.turboOn = !!on;
    saveState(state);
    return state.turboOn;
  }

  /* ---------- Passe de Batalha ---------- */

  function getBattlePass() { return getState().battlepass; }

  function isTierClaimed(index) { return !!getState().battlepass.claimed[index]; }

  function markTierClaimed(index) {
    var state = getState();
    state.battlepass.claimed[index] = Date.now();
    saveState(state);
  }

  /* ---------- Colecionaveis tematicos dos Bazingas ---------- */

  function getCollectibles() { return getState().collectibles; }

  function ownsCollectible(id) { return !!getState().collectibles.owned[id]; }

  // marca um colecionavel como obtido. Retorna true se era novo (false se ja tinha).
  function grantCollectible(id) {
    var state = getState();
    if (state.collectibles.owned[id]) return false;
    state.collectibles.owned[id] = Date.now();
    saveState(state);
    return true;
  }

  /* ---------- Minigames sem aposta ---------- */

  function getMinigameBest(game) {
    var state = getState();
    return (state.minigames[game] && state.minigames[game].bestFloor) || 0;
  }

  // registra o resultado de uma rodada de minigame; so atualiza o recorde se for melhor
  function reportMinigameScore(game, value) {
    var state = getState();
    if (!state.minigames[game]) state.minigames[game] = { bestFloor: 0 };
    var isNewBest = value > state.minigames[game].bestFloor;
    if (isNewBest) state.minigames[game].bestFloor = value;
    saveState(state);
    return { isNewBest: isNewBest, best: state.minigames[game].bestFloor };
  }

  /* ---------- Cadastro (conta local, sem backend/banco de dados) ---------- */

  function hasAccount() { return !!getState().account; }
  function getAccount() { return getState().account; }

  function createAccount(data) {
    var state = getState();
    state.account = {
      nickname: data.nickname,
      email: data.email || "",
      password: data.password || "",
      createdAt: Date.now()
    };
    state.profile.nickname = data.nickname;
    if (data.avatar) state.profile.avatar = data.avatar;
    saveState(state);
    return state.account;
  }

  function clearAccount() {
    var state = getState();
    state.account = null;
    saveState(state);
  }

  return {
    STARTING_BALANCE: STARTING_BALANCE,
    getState: getState,
    getBalance: getBalance,
    setBalance: setBalance,
    adjustBalance: adjustBalance,
    resetBalance: resetBalance,
    getStats: getStats,
    getHistory: getHistory,
    recordBet: recordBet,
    getProfile: getProfile,
    setProfile: setProfile,
    getLevel: getLevel,
    getDailyWon: getDailyWon,
    pushRecent: pushRecent,
    getRecent: getRecent,
    getBonusInfo: getBonusInfo,
    claimBonus: claimBonus,
    getAchievements: getAchievements,
    unlockAchievement: unlockAchievement,
    countGamesPlayed: countGamesPlayed,
    getCosmetics: getCosmetics,
    unlockCosmetic: unlockCosmetic,
    unlockTurbo: unlockTurbo,
    setCosmetic: setCosmetic,
    isTurboUnlocked: isTurboUnlocked,
    isTurboOn: isTurboOn,
    setTurboOn: setTurboOn,
    getBattlePass: getBattlePass,
    isTierClaimed: isTierClaimed,
    markTierClaimed: markTierClaimed,
    getReloadAmount: getReloadAmount,
    addReloadBonus: addReloadBonus,
    autoReload: autoReload,
    addXp: addXp,
    getCollectibles: getCollectibles,
    ownsCollectible: ownsCollectible,
    grantCollectible: grantCollectible,
    getMinigameBest: getMinigameBest,
    reportMinigameScore: reportMinigameScore,
    hasAccount: hasAccount,
    getAccount: getAccount,
    createAccount: createAccount,
    clearAccount: clearAccount
  };
})();
