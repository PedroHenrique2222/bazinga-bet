/* Bazinga BET - bots do painel de apostas ao vivo (Crash e Double).
   So mostram "outros jogadores" simulados durante a rodada em si; nao ha mais
   ticker de vitorias, ranking diario ou contador de "jogando agora" no lobby -
   isso foi removido para nao passar falsa prova social antes do lancamento real. */
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
    { name: "BZG Panetone", avatar: "🍰" },
    { name: "BZG Canoa Furada", avatar: "🛶" },
    { name: "BZG 616", avatar: "🪖" },       // o militar
    { name: "BZG Pikles Gamer", avatar: "🥒" },
    { name: "BZG Pilha Avulsa", avatar: "🔋" },
    { name: "BZG Linden", avatar: "🗑️" },    // a lata de lixo
    { name: "BZG Bogão", avatar: "🍑" }       // a bunda
  ];

  function randomBot() {
    if (Math.random() < 0.3) return pick(CREW);
    return { name: pick(NAMES), avatar: pick(AVATARS) };
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

  return {
    crashRoundBots: crashRoundBots,
    doubleRoundBots: doubleRoundBots
  };
})();
