/* Bazinga BET - jogadores falsos (bots): feed de vitorias, apostas nas rodadas, ranking */
window.BZG = window.BZG || {};

BZG.bots = (function () {
  var NAMES = [
    // apelidos de bet brasileiros
    "ReiDoPix", "PatraoDoCrash", "SortudoBR", "LendaDoGreen", "VidaDeGreen", "SoGreenHoje",
    "BetadorRaiz", "CriaDa7", "MalandroDoRJ", "PaiDoDouble", "TubaraoDaBet", "MilGrau013",
    // nome + numero, estilo usuario comum
    "Carlao_77", "Leozin013", "Nathy22", "Bruxao66", "Luquinhas777", "Betao_10",
    "Rafinha_sp", "Digo_zl", "Kaka_021", "Vini047", "Pedrin011", "Dudu_098",
    // nomes proprios estilizados
    "Duda.Martins", "AnaClara_s2", "MaduLima", "BiaSortuda", "JuhCerqueira", "ThaisFlor",
    "Gabizinha", "PaulinhaGG", "LariCry", "YasminRJ", "MariEduarda_", "CamisDuarte",
    // personagens e apelidos criativos
    "TioPatinhas", "MestreDosMagos", "DonCorleone", "UrsoPolarr", "LoboDaMadruga", "ZecaUrubu",
    "Foguetinho", "TurboNando", "GugaFlash", "MariaFumaca", "KakaDaVila", "TonhoDaMata",
    // VIPs e ostentacao
    "SrMilhao", "XandeVIP", "RicoDaNet", "PatraoJunin", "MagnataDoDado", "JhowRico",
    "VitinDoGrau", "PrincesaBet", "ImperadorBet", "Bilionario2030"
  ];
  var AVATARS = ["😎", "🔥", "👑", "🐯", "🚀", "💎", "🍀", "⚡", "🎯", "🃏", "🦈", "🤠", "😈", "🥇", "🎩", "🐺", "👽", "🤑"];
  var GAMES = [
    { id: "crash", name: "Canoa Furada", icon: "🛶" },
    { id: "double", name: "Double", icon: "🎡" },
    { id: "mines", name: "Mines do Picles", icon: "🥒" },
    { id: "tower", name: "Lixeira do Linden", icon: "🗑️" },
    { id: "plinko", name: "Plinko da Abóbora", icon: "🎃" },
    { id: "dice", name: "Dado 616", icon: "🎲" },
    { id: "hilo", name: "HiLo do PAnetone", icon: "🃏" },
    { id: "slots", name: "Slots", icon: "🎰" },
    { id: "roulette", name: "Roleta", icon: "🎯" },
    { id: "blackjack", name: "21 do Bogão", icon: "🍑" },
    { id: "bazinguinha", name: "Bazinguinha", icon: "🐯" },
    { id: "raspadinha", name: "Raspadinha", icon: "🎟️" },
    { id: "limbo", name: "Limbo", icon: "📉" },
    { id: "wheel", name: "Roda da Sorte", icon: "🎡" },
    { id: "coinflip", name: "Moeda da Pilha", icon: "🔋" }
  ];

  function rand(n) {
    return Math.floor(Math.random() * n);
  }

  function pick(arr) {
    return arr[rand(arr.length)];
  }

  /* A equipe BZG: os lendarios da casa, com avatar proprio.
     Aparecem com mais frequencia no feed e dominam o ranking. */
  var CREW = [
    { name: "BZG Abóbora", avatar: "🎃" },
    { name: "BZG PAnetone", avatar: "🍰" },
    { name: "BZG Canoa Furada", avatar: "🛶" },
    { name: "BZG 616", avatar: "🪖" },       // o militar
    { name: "BZG Picles Gamer", avatar: "🥒" },
    { name: "BZG Pilha Avulsa", avatar: "🔋" },
    { name: "BZG Linden", avatar: "🗑️" },    // a lata de lixo
    { name: "BZG Bogão", avatar: "🍑" }       // a bunda
  ];

  function randomBot() {
    if (Math.random() < 0.3) return pick(CREW);
    return { name: pick(NAMES), avatar: pick(AVATARS) };
  }

  /* Valor de ganho com distribuicao realista: muitos pequenos, poucos grandes */
  function randomWinAmount() {
    var r = Math.random();
    if (r < 0.6) return 10 + rand(290);
    if (r < 0.9) return 300 + rand(1700);
    if (r < 0.985) return 2000 + rand(8000);
    return 10000 + rand(40000);
  }

  function randomWin() {
    var bot = randomBot();
    var game = pick(GAMES);
    return {
      name: bot.name,
      avatar: bot.avatar,
      game: game,
      amount: randomWinAmount(),
      mult: (1.1 + Math.random() * Math.random() * 20)
    };
  }

  /* Multiplicador-alvo de um bot no Crash (distribuicao parecida com jogadores reais) */
  function randomCrashTarget() {
    var r = Math.random();
    if (r < 0.45) return 1.1 + Math.random() * 0.9;   // conservador
    if (r < 0.8) return 2 + Math.random() * 3;         // medio
    if (r < 0.95) return 5 + Math.random() * 10;       // ousado
    return 15 + Math.random() * 35;                    // maluco
  }

  function randomBetAmount() {
    var r = Math.random();
    if (r < 0.5) return (1 + rand(20)) * 5;
    if (r < 0.85) return (1 + rand(20)) * 25;
    return (1 + rand(16)) * 250;
  }

  /* Gera os bots de uma rodada de Crash: cada um com aposta e alvo */
  function crashRoundBots() {
    var count = 6 + rand(8);
    var used = {};
    var bots = [];
    for (var i = 0; i < count; i++) {
      var bot = randomBot();
      if (used[bot.name]) continue;
      used[bot.name] = true;
      bots.push({
        name: bot.name,
        avatar: bot.avatar,
        bet: randomBetAmount(),
        target: randomCrashTarget(),
        status: "in" // "in" | "cashed" | "lost"
      });
    }
    return bots;
  }

  /* Gera os bots de uma rodada de Double: cada um aposta numa cor */
  function doubleRoundBots() {
    var count = 8 + rand(10);
    var used = {};
    var bots = [];
    for (var i = 0; i < count; i++) {
      var bot = randomBot();
      if (used[bot.name]) continue;
      used[bot.name] = true;
      var r = Math.random();
      var color = r < 0.45 ? "red" : (r < 0.9 ? "black" : "white");
      bots.push({
        name: bot.name,
        avatar: bot.avatar,
        bet: randomBetAmount(),
        color: color
      });
    }
    return bots;
  }

  /* ---------- Ranking diario (estavel durante o dia via seed da data) ---------- */

  function seededRandom(seed) {
    var s = seed % 2147483647;
    if (s <= 0) s += 2147483646;
    return function () {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
  }

  function hashString(str) {
    var h = 0;
    for (var i = 0; i < str.length; i++) {
      h = (h * 31 + str.charCodeAt(i)) | 0;
    }
    return Math.abs(h);
  }

  function getDailyRanking() {
    var d = new Date();
    var dateKey = d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
    var rnd = seededRandom(hashString(dateKey));

    var entries = [];
    var usedIdx = {};
    var usedCrew = {};
    var amount = 18000 + Math.floor(rnd() * 30000);
    for (var i = 0; i < 8; i++) {
      // metade das vagas do dia vai para a equipe BZG (sorteio estavel pela data)
      var member = null;
      if (i < 4) {
        var crewIdx = Math.floor(rnd() * CREW.length);
        while (usedCrew[crewIdx]) crewIdx = (crewIdx + 1) % CREW.length;
        usedCrew[crewIdx] = true;
        member = CREW[crewIdx];
      } else {
        var nameIdx = Math.floor(rnd() * NAMES.length);
        while (usedIdx[nameIdx]) nameIdx = (nameIdx + 1) % NAMES.length;
        usedIdx[nameIdx] = true;
        member = { name: NAMES[nameIdx], avatar: AVATARS[Math.floor(rnd() * AVATARS.length)] };
      }
      entries.push({
        name: member.name,
        avatar: member.avatar,
        game: GAMES[Math.floor(rnd() * GAMES.length)],
        amount: amount,
        isUser: false
      });
      amount = Math.floor(amount * (0.55 + rnd() * 0.3));
    }
    // embaralha um pouco para a equipe nao ficar sempre em bloco no topo
    entries.sort(function (a, b) { return b.amount - a.amount; });

    // insere o usuario se ele ganhou algo hoje
    var userWon = BZG.storage.getDailyWon();
    if (userWon > 0) {
      var profile = BZG.storage.getProfile();
      entries.push({
        name: profile.nickname + " (você)",
        avatar: profile.avatar,
        game: null,
        amount: userWon,
        isUser: true
      });
      entries.sort(function (a, b) { return b.amount - a.amount; });
      entries = entries.slice(0, 8);
    }

    return entries;
  }

  return {
    GAMES: GAMES,
    CREW: CREW,
    randomBot: randomBot,
    randomWin: randomWin,
    randomBetAmount: randomBetAmount,
    randomCrashTarget: randomCrashTarget,
    crashRoundBots: crashRoundBots,
    doubleRoundBots: doubleRoundBots,
    getDailyRanking: getDailyRanking
  };
})();
