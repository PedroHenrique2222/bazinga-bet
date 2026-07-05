/* Bazinga BET - camada de armazenamento (localStorage) */
window.BZG = window.BZG || {};

BZG.storage = (function () {
  var STORAGE_KEY = "bazingaBetState";
  var STARTING_BALANCE = 10000;
  var MAX_HISTORY_ENTRIES = 25;

  function defaultState() {
    return {
      balance: STARTING_BALANCE,
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
      stats: {
        totalWagered: 0,
        totalWon: 0,
        totalLost: 0,
        bestMultiplier: 0,
        currentStreak: 0,
        bestWinStreak: 0,
        bestLossStreak: 0
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
        blackjack: []
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
      if (typeof parsed.balance !== "number" || isNaN(parsed.balance)) {
        parsed.balance = base.balance;
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

  function setBalance(value) {
    var state = getState();
    state.balance = Math.max(0, Math.round(value));
    saveState(state);
    return state.balance;
  }

  function adjustBalance(delta) {
    var state = getState();
    state.balance = Math.max(0, Math.round(state.balance + delta));
    saveState(state);
    return state.balance;
  }

  function resetBalance() {
    var state = getState();
    state.balance = STARTING_BALANCE;
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
    return state;
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
    getRecent: getRecent
  };
})();
