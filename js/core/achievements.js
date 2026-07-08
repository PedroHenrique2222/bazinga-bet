/* Bazinga BET - conquistas: lista + verificacao automatica */
window.BZG = window.BZG || {};

BZG.achievements = (function () {
  // jogos ativos hoje (bazinguinha/bonanza estao "em desenvolvimento", ficam de fora)
  var ACTIVE_GAMES = ["crash", "double", "mines", "tower", "plinko", "dice", "hilo",
    "roulette", "blackjack", "raspadinha", "limbo", "coinflip", "horse"];

  /* Nota: essas duas funcoes olham o HISTORICO por jogo (capado nos ultimos 25
     lances). Como a verificacao roda logo apos CADA aposta (evento
     bzg:balance-changed), ela sempre ve o lance que acabou de acontecer -
     entao a deteccao "ao vivo" funciona certinho. So nao reconstroi
     retroativamente um marco muito antigo que ja saiu do historico. */
  function gameWon(s, game, minMult) {
    var h = s.history[game];
    if (!h) return false;
    for (var i = 0; i < h.length; i++) {
      if (h[i].won && h[i].multiplier >= minMult) return true;
    }
    return false;
  }

  function gameWinCount(s, game) {
    var h = s.history[game];
    if (!h) return 0;
    var n = 0;
    for (var i = 0; i < h.length; i++) if (h[i].won) n++;
    return n;
  }

  function totalBetsCount(s) {
    var n = 0;
    Object.keys(s.history).forEach(function (g) { n += (s.history[g] || []).length; });
    return n;
  }

  /* cada conquista tem um check(state) que retorna true quando conquistada */
  var LIST = [
    {
      id: "first-bet", icon: "🎰", name: "Bem-vindo ao cassino",
      desc: "Faça sua primeira aposta",
      check: function (s) { return s.stats.totalWagered > 0; }
    },
    {
      id: "high-roller", icon: "💵", name: "Aposta grande",
      desc: "Aposte BZ$ 1.000 numa única jogada",
      check: function (s) { return (s.stats.maxBet || 0) >= 1000; }
    },
    {
      id: "hot-streak", icon: "🔥", name: "Sequência quente",
      desc: "Vença 5 vezes seguidas",
      check: function (s) { return s.stats.bestWinStreak >= 5; }
    },
    {
      id: "big-mult", icon: "🚀", name: "Foguete",
      desc: "Ganhe com um multiplicador de 50x ou mais",
      check: function (s) { return s.stats.bestMultiplier >= 50; }
    },
    {
      id: "jackpot", icon: "⚡", name: "Sortudo do Bazinga",
      desc: "Alcance um multiplicador de 100x",
      check: function (s) { return s.stats.bestMultiplier >= 100; }
    },
    {
      id: "explorer", icon: "🧭", name: "Explorador",
      desc: "Jogue 8 jogos diferentes",
      check: function (s) {
        var n = 0;
        Object.keys(s.history).forEach(function (g) { if (s.history[g] && s.history[g].length) n++; });
        return n >= 8;
      }
    },
    {
      id: "veteran", icon: "🎖️", name: "Veterano",
      desc: "Chegue ao nível 5",
      check: function (s) { return s.profile.xp >= 4000; }
    },
    {
      id: "millionaire", icon: "🤑", name: "Alto lá, milionário",
      desc: "Tenha BZ$ 100.000 de saldo",
      check: function (s) { return s.balance >= 100000; }
    },
    {
      id: "loyal", icon: "📅", name: "Fiel à casa",
      desc: "Colete o bônus diário 3 dias seguidos",
      check: function (s) { return s.bonus.streak >= 3; }
    },
    {
      id: "whale", icon: "🐋", name: "Baleia",
      desc: "Aposte BZ$ 50.000 no total",
      check: function (s) { return s.stats.totalWagered >= 50000; }
    },
    {
      id: "big-win", icon: "💥", name: "Prêmio gordo",
      desc: "Ganhe BZ$ 25.000 numa única jogada",
      check: function (s) { return (s.stats.maxWin || 0) >= 25000; }
    },

    /* ---------- Progressao de nivel ---------- */
    { id: "lvl-10", icon: "🎖️", name: "Nível 10", desc: "Chegue ao nível 10", check: function (s) { return s.profile.xp >= 9000; } },
    { id: "lvl-25", icon: "🎖️", name: "Nível 25", desc: "Chegue ao nível 25", check: function (s) { return s.profile.xp >= 24000; } },
    { id: "lvl-50", icon: "🏅", name: "Nível 50", desc: "Chegue ao nível 50", check: function (s) { return s.profile.xp >= 49000; } },
    { id: "lvl-75", icon: "🏅", name: "Nível 75", desc: "Chegue ao nível 75", check: function (s) { return s.profile.xp >= 74000; } },
    { id: "lvl-100", icon: "👑", name: "Nível máximo", desc: "Chegue ao nível 100", check: function (s) { return s.profile.xp >= 99000; } },

    /* ---------- Passe de Batalha ---------- */
    { id: "bp-10", icon: "🎫", name: "Passe: esquentando", desc: "Alcance o nível 10 do Passe de Batalha",
      check: function () { return BZG.battlepass && BZG.battlepass.reachedCount() >= 10; } },
    { id: "bp-50", icon: "🎫", name: "Passe: metade do caminho", desc: "Alcance o nível 50 do Passe de Batalha",
      check: function () { return BZG.battlepass && BZG.battlepass.reachedCount() >= 50; } },
    { id: "bp-100", icon: "🏆", name: "Passe completo", desc: "Alcance o nível 100 do Passe de Batalha",
      check: function () { return BZG.battlepass && BZG.battlepass.reachedCount() >= 100; } },
    { id: "bp-claim-all", icon: "🎁", name: "Nada pendente", desc: "Resgate todas as recompensas disponíveis do Passe",
      check: function () { return BZG.battlepass && BZG.battlepass.reachedCount() > 0 && BZG.battlepass.unclaimedCount() === 0; } },

    /* ---------- Saldo ---------- */
    { id: "bal-20k", icon: "💰", name: "Primeiros 20 mil", desc: "Tenha BZ$ 20.000 de saldo", check: function (s) { return s.balance >= 20000; } },
    { id: "bal-50k", icon: "💰", name: "Bolso cheio", desc: "Tenha BZ$ 50.000 de saldo", check: function (s) { return s.balance >= 50000; } },
    { id: "bal-250k", icon: "💰", name: "Alto padrão", desc: "Tenha BZ$ 250.000 de saldo", check: function (s) { return s.balance >= 250000; } },
    { id: "bal-500k", icon: "💰", name: "Multimilionário", desc: "Tenha BZ$ 500.000 de saldo", check: function (s) { return s.balance >= 500000; } },
    { id: "bal-1m", icon: "🏆", name: "Bilionário do Bazinga", desc: "Tenha BZ$ 1.000.000 de saldo", check: function (s) { return s.balance >= 1000000; } },

    /* ---------- Volume de apostas ---------- */
    { id: "wager-100k", icon: "📈", name: "Grinder", desc: "Aposte BZ$ 100.000 no total", check: function (s) { return s.stats.totalWagered >= 100000; } },
    { id: "wager-500k", icon: "📈", name: "Rodagem pesada", desc: "Aposte BZ$ 500.000 no total", check: function (s) { return s.stats.totalWagered >= 500000; } },
    { id: "wager-1m", icon: "📈", name: "Máquina de apostar", desc: "Aposte BZ$ 1.000.000 no total", check: function (s) { return s.stats.totalWagered >= 1000000; } },
    { id: "bets-100", icon: "🔁", name: "100 rodadas", desc: "Faça 100 apostas no total", check: function (s) { return totalBetsCount(s) >= 100; } },
    { id: "bets-500", icon: "🔁", name: "500 rodadas", desc: "Faça 500 apostas no total", check: function (s) { return totalBetsCount(s) >= 500; } },

    /* ---------- Tamanho de aposta e premio ---------- */
    { id: "bet-5k", icon: "💵", name: "Big spender", desc: "Aposte BZ$ 5.000 numa única jogada", check: function (s) { return (s.stats.maxBet || 0) >= 5000; } },
    { id: "bet-20k", icon: "💵", name: "Baleia suprema", desc: "Aposte BZ$ 20.000 numa única jogada", check: function (s) { return (s.stats.maxBet || 0) >= 20000; } },
    { id: "win-100k", icon: "🎊", name: "Prêmio histórico", desc: "Ganhe BZ$ 100.000 numa única jogada", check: function (s) { return (s.stats.maxWin || 0) >= 100000; } },

    /* ---------- Sequencias ---------- */
    { id: "lossstreak-5", icon: "🌧️", name: "Fase ruim", desc: "Perca 5 vezes seguidas", check: function (s) { return s.stats.bestLossStreak >= 5; } },
    { id: "lossstreak-10", icon: "⛈️", name: "Persistente", desc: "Perca 10 vezes seguidas e continue jogando", check: function (s) { return s.stats.bestLossStreak >= 10; } },
    { id: "winstreak-10", icon: "🔥", name: "Imparável", desc: "Vença 10 vezes seguidas", check: function (s) { return s.stats.bestWinStreak >= 10; } },
    { id: "winstreak-20", icon: "🔥", name: "Lenda da sorte", desc: "Vença 20 vezes seguidas", check: function (s) { return s.stats.bestWinStreak >= 20; } },

    /* ---------- Multiplicadores ---------- */
    { id: "mult-10", icon: "✨", name: "Primeiro 10x", desc: "Ganhe com um multiplicador de 10x ou mais", check: function (s) { return s.stats.bestMultiplier >= 10; } },
    { id: "mult-25", icon: "✨", name: "Multiplicador e tanto", desc: "Ganhe com um multiplicador de 25x ou mais", check: function (s) { return s.stats.bestMultiplier >= 25; } },
    { id: "mult-250", icon: "🌟", name: "Fora da curva", desc: "Ganhe com um multiplicador de 250x ou mais", check: function (s) { return s.stats.bestMultiplier >= 250; } },
    { id: "mult-500", icon: "🌟", name: "Sortudo demais", desc: "Ganhe com um multiplicador de 500x ou mais", check: function (s) { return s.stats.bestMultiplier >= 500; } },

    /* ---------- Bonus diario ---------- */
    { id: "bonus-7", icon: "📅", name: "Uma semana de panetone", desc: "Colete o bônus diário 7 dias seguidos", check: function (s) { return s.bonus.streak >= 7; } },
    { id: "bonus-14", icon: "📅", name: "Duas semanas fiel", desc: "Colete o bônus diário 14 dias seguidos", check: function (s) { return s.bonus.streak >= 14; } },
    { id: "bonus-30", icon: "📅", name: "Um mês inteiro", desc: "Colete o bônus diário 30 dias seguidos", check: function (s) { return s.bonus.streak >= 30; } },

    /* ---------- Exploracao e personalizacao ---------- */
    { id: "all-games", icon: "🗺️", name: "Cassino completo", desc: "Jogue todos os jogos disponíveis pelo menos uma vez",
      check: function (s) { return ACTIVE_GAMES.every(function (g) { return s.history[g] && s.history[g].length > 0; }); } },
    { id: "theme-unlock", icon: "🎨", name: "Trocando de roupa", desc: "Desbloqueie um tema extra no Passe de Batalha",
      check: function (s) { return (s.cosmetics.themes || []).length > 0; } },
    { id: "name-color", icon: "🖍️", name: "Estiloso", desc: "Personalize a cor do seu nome",
      check: function (s) { return s.cosmetics.nameColor && s.cosmetics.nameColor !== "default"; } },

    /* ---------- Turbo e titulos ---------- */
    { id: "turbo-unlock", icon: "⚡", name: "Pé no acelerador", desc: "Desbloqueie o Modo Turbo no Passe de Batalha",
      check: function (s) { return !!s.cosmetics.turbo; } },
    { id: "turbo-on", icon: "⚡", name: "Tudo rápido", desc: "Ligue o Modo Turbo",
      check: function (s) { return !!s.turboOn; } },
    { id: "title-unlock", icon: "🎖️", name: "Reconhecimento", desc: "Desbloqueie um título no Passe de Batalha",
      check: function (s) { return (s.cosmetics.titles || []).length > 0; } },
    { id: "title-active", icon: "🎖️", name: "Nome e sobrenome", desc: "Coloque um título ativo no perfil",
      check: function (s) { return !!s.cosmetics.title; } },

    /* ---------- Recarga automatica ---------- */
    { id: "broke-once", icon: "🪫", name: "Quebrado", desc: "Zere o saldo e receba a recarga automática",
      check: function (s) { return (s.stats.autoReloads || 0) >= 1; } },
    { id: "broke-5", icon: "🪫", name: "Sem sorte hoje", desc: "Receba a recarga automática 5 vezes",
      check: function (s) { return (s.stats.autoReloads || 0) >= 5; } },
    { id: "phoenix", icon: "🔄", name: "Fênix", desc: "Receba a recarga automática 20 vezes",
      check: function (s) { return (s.stats.autoReloads || 0) >= 20; } },

    /* ---------- Marcos por jogo ---------- */
    { id: "crash-20x", icon: "🛶", name: "Piloto de canoa", desc: "Retire na Canoa Furada com 20x ou mais",
      check: function (s) { return gameWon(s, "crash", 20); } },
    { id: "double-white", icon: "🎡", name: "Saiu branco!", desc: "Acerte o branco (14x) no Double",
      check: function (s) { return gameWon(s, "double", 14); } },
    { id: "mines-20x", icon: "🥒", name: "Horta limpa", desc: "Ganhe no Mines do Pikles com 20x ou mais",
      check: function (s) { return gameWon(s, "mines", 20); } },
    { id: "tower-top", icon: "🗑️", name: "Topo da lixeira", desc: "Ganhe na Lixeira do Linden com 20x ou mais",
      check: function (s) { return gameWon(s, "tower", 20); } },
    { id: "plinko-100x", icon: "🎃", name: "Bolinha de ouro", desc: "Ganhe no Plinko da Abóbora com 100x ou mais",
      check: function (s) { return gameWon(s, "plinko", 100); } },
    { id: "dice-9x", icon: "🎲", name: "Aposta arriscada", desc: "Ganhe no Dado 616 com 9x ou mais",
      check: function (s) { return gameWon(s, "dice", 9); } },
    { id: "hilo-10x", icon: "🃏", name: "Sequência de cartas", desc: "Ganhe no HiLo do Panetone com 10x ou mais",
      check: function (s) { return gameWon(s, "hilo", 10); } },
    { id: "roulette-36x", icon: "🎯", name: "Número da sorte", desc: "Acerte um número cheio na Roleta (36x)",
      check: function (s) { return gameWon(s, "roulette", 36); } },
    { id: "blackjack-natural", icon: "🍑", name: "Blackjack!", desc: "Tire um blackjack natural (2.5x) no 21 do Bogão",
      check: function (s) { return gameWon(s, "blackjack", 2.5); } },
    { id: "raspadinha-max", icon: "🎟️", name: "Raspou e achou", desc: "Ganhe na Raspadinha com 10x ou mais",
      check: function (s) { return gameWon(s, "raspadinha", 10); } },
    { id: "limbo-50x", icon: "📉", name: "Alvo distante", desc: "Ganhe no Limbo com alvo de 50x ou mais",
      check: function (s) { return gameWon(s, "limbo", 50); } },
    { id: "coinflip-20wins", icon: "🔋", name: "Moeda favorável", desc: "Vença 20 vezes na Moeda da Pilha",
      check: function (s) { return gameWinCount(s, "coinflip") >= 20; } },
    { id: "horse-10wins", icon: "🏇", name: "Jóquei sortudo", desc: "Vença 10 corridas na Corrida BZG",
      check: function (s) { return gameWinCount(s, "horse") >= 10; } },

    /* ---------- Colecionaveis ---------- */
    { id: "col-first", icon: "🎴", name: "Primeira figurinha", desc: "Ganhe seu primeiro colecionável jogando",
      check: function (s) { return Object.keys(s.collectibles.owned).length >= 1; } },
    { id: "col-20", icon: "🎴", name: "Álbum enchendo", desc: "Junte 20 colecionáveis",
      check: function (s) { return Object.keys(s.collectibles.owned).length >= 20; } },
    { id: "col-50", icon: "🎴", name: "Quase completo", desc: "Junte 50 colecionáveis",
      check: function (s) { return Object.keys(s.collectibles.owned).length >= 50; } },
    { id: "col-set-1", icon: "🏆", name: "Álbum fechado", desc: "Complete o conjunto de figurinhas de um personagem",
      check: function () { return BZG.collectibles && BZG.collectibles.characters().some(function (c) { return BZG.collectibles.isSetComplete(c.key); }); } },
    { id: "col-set-crew", icon: "👑", name: "Elenco completo", desc: "Complete o álbum de todos os membros da Equipe BZG",
      check: function () { return BZG.collectibles && BZG.collectibles.characters().filter(function (c) { return c.group === "equipe"; }).every(function (c) { return BZG.collectibles.isSetComplete(c.key); }); } },
    { id: "col-set-friends", icon: "🤝", name: "Turma completa", desc: "Complete o álbum de todos os Amigos dos Bazingas",
      check: function () { return BZG.collectibles && BZG.collectibles.characters().filter(function (c) { return c.group === "amigos"; }).every(function (c) { return BZG.collectibles.isSetComplete(c.key); }); } },
    { id: "col-set-all", icon: "🌟", name: "Colecionador supremo", desc: "Complete o álbum de TODOS os personagens (Equipe + Amigos)",
      check: function () { return BZG.collectibles && BZG.collectibles.characters().every(function (c) { return BZG.collectibles.isSetComplete(c.key); }); } },

    /* ---------- Minigames sem aposta ---------- */
    { id: "torre-10", icon: "🧱", name: "Construtor", desc: "Alcance 10 andares na Torre da Turma",
      check: function (s) { return (s.minigames.torre && s.minigames.torre.best || 0) >= 10; } },
    { id: "torre-25", icon: "🏗️", name: "Arquiteto BZG", desc: "Alcance 25 andares na Torre da Turma",
      check: function (s) { return (s.minigames.torre && s.minigames.torre.best || 0) >= 25; } },
    { id: "rainbow-10", icon: "🏳️‍🌈", name: "Memória colorida", desc: "Alcance a rodada 10 na Sequência Arco-íris",
      check: function (s) { return (s.minigames.rainbow && s.minigames.rainbow.best || 0) >= 10; } },
    { id: "shadow-15", icon: "🌑", name: "Reflexo na escuridão", desc: "Acerte 15 sombras numa rodada de Sombra Rápida",
      check: function (s) { return (s.minigames.shadow && s.minigames.shadow.best || 0) >= 15; } },
    { id: "alien-30", icon: "👽", name: "Sobrevivente espacial", desc: "Sobreviva 30 segundos na Fuga Alienígena",
      check: function (s) { return (s.minigames.alien && s.minigames.alien.best || 0) >= 30; } },
    { id: "minigames-all", icon: "🕹️", name: "Todo-terreno", desc: "Tenha pelo menos um recorde em cada minigame sem aposta",
      check: function (s) { return ["torre", "rainbow", "shadow", "alien"].every(function (g) { return (s.minigames[g] && s.minigames[g].best || 0) > 0; }); } }
  ];

  function all() {
    return LIST;
  }

  /* verifica todas; desbloqueia as novas e mostra um aviso para cada */
  function check() {
    var state = BZG.storage.getState();
    var unlocked = state.achievements || {};
    var novos = [];
    LIST.forEach(function (a) {
      if (!unlocked[a.id] && a.check(state)) {
        if (BZG.storage.unlockAchievement(a.id)) novos.push(a);
      }
    });
    novos.forEach(function (a, i) {
      setTimeout(function () {
        if (BZG.ui) BZG.ui.toast("🏆 Conquista: " + a.icon + " " + a.name, "success");
        if (BZG.sounds && BZG.sounds.achievement) BZG.sounds.achievement();
      }, 400 + i * 900);
    });
    return novos;
  }

  return { all: all, check: check };
})();
