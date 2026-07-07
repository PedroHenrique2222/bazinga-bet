/* Bazinga BET - conquistas: lista + verificacao automatica */
window.BZG = window.BZG || {};

BZG.achievements = (function () {
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
    }
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
