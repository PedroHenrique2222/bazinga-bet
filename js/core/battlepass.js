/* Bazinga BET - Passe de Batalha: tiers desbloqueados por XP, recompensas cosmeticas.
   O XP é o mesmo do perfil (1 XP a cada BZ$10 apostados). 100 niveis organizados
   em 10 capitulos de 10 niveis: o 1o e dos Amigos dos Bazingas, os outros 9 sao
   um pra cada membro da Equipe BZG (ver TIER_PER_CHAPTER/CHAPTER_BONUS abaixo). */
window.BZG = window.BZG || {};

BZG.battlepass = (function () {
  // Completar o Passe agora e MUITO mais dificil: cada nivel custa 2500 XP (era 600).
  // 100 niveis x 2500 = 250.000 XP = BZ$ 2.500.000 apostados pra zerar o passe
  // (antes eram BZ$ 600.000). So chega ao fim quem joga MUITO.
  var XP_PER_TIER = 2500;
  var TIER_PER_CHAPTER = 10; // precisa bater com js/pages/passe.js

  // bonus extra de recarga ao completar (resgatar) o ultimo nivel de um capitulo,
  // por cima de qualquer outra recompensa que esse nivel ja de
  var CHAPTER_BONUS = 5000;

  var TITLES = {
    novato: "Novato",
    sortudo: "Sortudo",
    apostador: "Apostador",
    arriscado: "Arriscado",
    tubarao: "Tubarão",
    veterano: "Veterano",
    destemido: "Destemido",
    vidente: "Vidente",
    magnata: "Magnata",
    colecionador: "Colecionador",
    milionario: "Milionário",
    bazingueiro: "Bazingueiro",
    astro: "Astro BZG",
    rei: "Rei da Mesa",
    lenda: "Lenda BZG",
    imperador: "Imperador BZG",
    mestre: "Mestre BZG",
    chefe: "Chefão BZG"
  };

  var COLOR_LABELS = {
    gold: "Dourado", fire: "Fogo", ice: "Gelo", matrix: "Matrix",
    rose: "Rosa", neon: "Neon", rainbow: "Arco-íris",
    aqua: "Aqua", lava: "Lava", toxic: "Tóxico", royal: "Realeza",
    sunset: "Pôr do Sol", galaxy: "Galáxia", candy: "Algodão Doce", emerald: "Esmeralda"
  };

  /* Recompensas especiais (SO cosmeticos: avatares, cores de nome, temas, titulos
     e o Modo Turbo) fixadas em cada nivel (chave = nivel 1-based). Nao ha mais
     figurinhas aqui - a Colecao virou uma coleta lenta, so pelo drop aleatorio nas
     apostas (ver rollOnBet em collectibles.js). A UNICA recarga do passe vem do
     bonus de capitulo (CHAPTER_BONUS). Todo nivel 1-100 tem uma entrada explicita.
     Os avatares NUNCA repetem um valor que ja e gratis por padrao (AVATARS em
     profile.js) nem entre si - senao o "desbloqueio" nao desbloquearia nada. */
  var SPECIALS = {
    // Capitulo 1 (1-10): Amigos dos Bazingas
    1:  { r: "color",  v: "gold",       icon: "🅰️", label: "Cor Dourado" },
    2:  { r: "avatar", v: "🏳️‍🌈",       icon: "🏳️‍🌈", label: "Avatar Dhani" },
    3:  { r: "title",  v: "novato",     icon: "🎖️", label: "Título: Novato" },
    4:  { r: "avatar", v: "🌑",         icon: "🌑", label: "Avatar Shadow" },
    5:  { r: "color",  v: "aqua",       icon: "🅰️", label: "Cor Aqua" },
    6:  { r: "avatar", v: "🎮",         icon: "🎮", label: "Avatar CBPB_Gamer" },
    7:  { r: "theme",  v: "gelo",       icon: "🧊", label: "Tema Gelo" },
    8:  { r: "avatar", v: "👽",         icon: "👽", label: "Avatar Alien Jo" },
    9:  { r: "title",  v: "sortudo",    icon: "🎖️", label: "Título: Sortudo" },
    10: { r: "avatar", v: "🤖",         icon: "🤖", label: "Avatar Robô" },

    // Capitulo 2 (11-20): BZG Abóbora
    11: { r: "color",  v: "fire",       icon: "🅰️", label: "Cor Fogo" },
    12: { r: "avatar", v: "🎃",         icon: "🎃", label: "Avatar BZG Abóbora" },
    13: { r: "title",  v: "apostador",  icon: "🎖️", label: "Título: Apostador" },
    14: { r: "avatar", v: "🐉",         icon: "🐉", label: "Avatar Dragão" },
    15: { r: "theme",  v: "neon",       icon: "🟣", label: "Tema Neon Roxo" },
    16: { r: "avatar", v: "🦄",         icon: "🦄", label: "Avatar Unicórnio" },
    17: { r: "color",  v: "lava",       icon: "🅰️", label: "Cor Lava" },
    18: { r: "avatar", v: "🦁",         icon: "🦁", label: "Avatar Leão" },
    19: { r: "title",  v: "arriscado",  icon: "🎖️", label: "Título: Arriscado" },
    20: { r: "avatar", v: "🐙",         icon: "🐙", label: "Avatar Kraken" },

    // Capitulo 3 (21-30): BZG Panetone
    21: { r: "color",  v: "ice",        icon: "🅰️", label: "Cor Gelo" },
    22: { r: "avatar", v: "🍰",         icon: "🍰", label: "Avatar BZG Panetone" },
    23: { r: "title",  v: "tubarao",    icon: "🎖️", label: "Título: Tubarão" },
    24: { r: "avatar", v: "🦅",         icon: "🦅", label: "Avatar Águia" },
    25: { r: "theme",  v: "ouro",       icon: "👑", label: "Tema Ouro Real" },
    26: { r: "avatar", v: "🌟",         icon: "🌟", label: "Avatar Estrela" },
    27: { r: "color",  v: "toxic",      icon: "🅰️", label: "Cor Tóxico" },
    28: { r: "avatar", v: "💀",         icon: "💀", label: "Avatar Caveira" },
    29: { r: "title",  v: "veterano",   icon: "🎖️", label: "Título: Veterano" },
    30: { r: "turbo",  v: "turbo",      icon: "⚡", label: "Modo Turbo" },

    // Capitulo 4 (31-40): BZG Canoa Furada
    31: { r: "color",  v: "matrix",     icon: "🅰️", label: "Cor Matrix" },
    32: { r: "avatar", v: "🛶",         icon: "🛶", label: "Avatar BZG Canoa Furada" },
    33: { r: "title",  v: "destemido",  icon: "🎖️", label: "Título: Destemido" },
    34: { r: "avatar", v: "🐒",         icon: "🐒", label: "Avatar Macaco" },
    35: { r: "theme",  v: "matrix",     icon: "🟢", label: "Tema Matrix" },
    36: { r: "avatar", v: "🇧🇷",        icon: "🇧🇷", label: "Avatar Bandeira do Brasil" },
    37: { r: "color",  v: "royal",      icon: "🅰️", label: "Cor Realeza" },
    38: { r: "avatar", v: "🦖",         icon: "🦖", label: "Avatar Dino" },
    39: { r: "title",  v: "vidente",    icon: "🎖️", label: "Título: Vidente" },
    40: { r: "avatar", v: "🐳",         icon: "🐳", label: "Avatar Baleia" },

    // Capitulo 5 (41-50): BZG 616
    41: { r: "color",  v: "rose",       icon: "🅰️", label: "Cor Rosa" },
    42: { r: "avatar", v: "🪖",         icon: "🪖", label: "Avatar BZG 616" },
    43: { r: "title",  v: "magnata",    icon: "🎖️", label: "Título: Magnata" },
    44: { r: "avatar", v: "🦋",         icon: "🦋", label: "Avatar Borboleta" },
    45: { r: "theme",  v: "rubi",       icon: "🔴", label: "Tema Rubi" },
    46: { r: "avatar", v: "🍕",         icon: "🍕", label: "Avatar Pizza" },
    47: { r: "avatar", v: "🎸",         icon: "🎸", label: "Avatar Guitarra" },
    48: { r: "title",  v: "colecionador", icon: "🎖️", label: "Título: Colecionador" },
    49: { r: "avatar", v: "🎺",         icon: "🎺", label: "Avatar Trompete" },
    50: { r: "avatar", v: "🥁",         icon: "🥁", label: "Avatar Bateria" },

    // Capitulo 6 (51-60): BZG Pikles Gamer
    51: { r: "color",  v: "sunset",     icon: "🅰️", label: "Cor Pôr do Sol" },
    52: { r: "avatar", v: "🥒",         icon: "🥒", label: "Avatar BZG Pikles Gamer" },
    53: { r: "title",  v: "milionario", icon: "🎖️", label: "Título: Milionário" },
    54: { r: "avatar", v: "🎨",         icon: "🎨", label: "Avatar Artista" },
    55: { r: "theme",  v: "rosa",       icon: "🩷", label: "Tema Rosa Chiclete" },
    56: { r: "avatar", v: "🎭",         icon: "🎭", label: "Avatar Teatro" },
    57: { r: "avatar", v: "🎪",         icon: "🎪", label: "Avatar Circo" },
    58: { r: "title",  v: "bazingueiro", icon: "🎖️", label: "Título: Bazingueiro" },
    59: { r: "avatar", v: "🎢",         icon: "🎢", label: "Avatar Montanha-Russa" },
    60: { r: "avatar", v: "🛸",         icon: "🛸", label: "Avatar Disco Voador" },

    // Capitulo 7 (61-70): BZG Pilha Avulsa
    61: { r: "color",  v: "neon",       icon: "🅰️", label: "Cor Neon" },
    62: { r: "avatar", v: "🔋",         icon: "🔋", label: "Avatar BZG Pilha Avulsa" },
    63: { r: "title",  v: "astro",      icon: "⭐", label: "Título: Astro BZG" },
    64: { r: "avatar", v: "🪐",         icon: "🪐", label: "Avatar Planeta" },
    65: { r: "theme",  v: "sangue",     icon: "🩸", label: "Tema Sangue" },
    66: { r: "avatar", v: "🗿",         icon: "🗿", label: "Avatar Moai" },
    67: { r: "color",  v: "galaxy",     icon: "🅰️", label: "Cor Galáxia" },
    68: { r: "avatar", v: "🏰",         icon: "🏰", label: "Avatar Castelo" },
    69: { r: "title",  v: "rei",        icon: "🤴", label: "Título: Rei da Mesa" },
    70: { r: "avatar", v: "🎳",         icon: "🎳", label: "Avatar Boliche" },

    // Capitulo 8 (71-80): BZG Linden
    71: { r: "color",  v: "rainbow",    icon: "🅰️", label: "Cor Arco-íris" },
    72: { r: "avatar", v: "🗑️",         icon: "🗑️", label: "Avatar BZG Linden" },
    73: { r: "title",  v: "lenda",      icon: "🏆", label: "Título: Lenda BZG" },
    74: { r: "avatar", v: "🥊",         icon: "🥊", label: "Avatar Boxe" },
    75: { r: "theme",  v: "oceano",     icon: "🌊", label: "Tema Oceano" },
    76: { r: "avatar", v: "🏆",         icon: "🏆", label: "Avatar Troféu" },
    77: { r: "avatar", v: "🍄",         icon: "🍄", label: "Avatar Cogumelo" },
    78: { r: "title",  v: "imperador",  icon: "🥇", label: "Título: Imperador BZG" },
    79: { r: "avatar", v: "🌵",         icon: "🌵", label: "Avatar Cacto" },
    80: { r: "avatar", v: "🦥",         icon: "🦥", label: "Avatar Preguiça" },

    // Capitulo 9 (81-90): BZG Bogão
    81: { r: "color",  v: "candy",      icon: "🅰️", label: "Cor Algodão Doce" },
    82: { r: "avatar", v: "🍑",         icon: "🍑", label: "Avatar BZG Bogão" },
    83: { r: "avatar", v: "🦝",         icon: "🦝", label: "Avatar Guaxinim" },
    84: { r: "theme",  v: "vulcao",     icon: "🌋", label: "Tema Vulcão" },
    85: { r: "avatar", v: "🐧",         icon: "🐧", label: "Avatar Pinguim" },
    86: { r: "avatar", v: "🦩",         icon: "🦩", label: "Avatar Flamingo" },
    87: { r: "title",  v: "mestre",     icon: "🏅", label: "Título: Mestre BZG" },
    88: { r: "avatar", v: "🦚",         icon: "🦚", label: "Avatar Pavão" },
    89: { r: "avatar", v: "🐢",         icon: "🐢", label: "Avatar Tartaruga" },
    90: { r: "avatar", v: "🦑",         icon: "🦑", label: "Avatar Lula" },

    // Capitulo 10 (91-100): BZG Pitoco
    91: { r: "color",  v: "emerald",    icon: "🅰️", label: "Cor Esmeralda" },
    92: { r: "avatar", v: "🐣",         icon: "🐣", label: "Avatar BZG Pitoco" },
    93: { r: "avatar", v: "🐬",         icon: "🐬", label: "Avatar Golfinho" },
    94: { r: "theme",  v: "lavanda",    icon: "💜", label: "Tema Lavanda" },
    95: { r: "avatar", v: "🐊",         icon: "🐊", label: "Avatar Crocodilo" },
    96: { r: "avatar", v: "🐆",         icon: "🐆", label: "Avatar Onça" },
    97: { r: "avatar", v: "🐘",         icon: "🐘", label: "Avatar Elefante" },
    98: { r: "avatar", v: "🦏",         icon: "🦏", label: "Avatar Rinoceronte" },
    99: { r: "avatar", v: "🐪",         icon: "🐪", label: "Avatar Camelo" },
    100:{ r: "title",  v: "chefe",      icon: "👑", label: "Título: Chefão BZG" }
  };

  // fallback de seguranca (nunca deveria ser usado - todo nivel 1-100 tem uma
  // entrada explicita em SPECIALS agora que a recarga so vem do bonus de capitulo)
  var FALLBACK_REWARD = { r: "reloadBoost", v: 5000, icon: "💳", label: "Recarga +BZ$ 5.000" };

  /* 100 niveis: uma recompensa especifica cada, ver SPECIALS acima */
  var TIERS = (function () {
    var arr = [];
    for (var t = 1; t <= 100; t++) {
      arr.push(SPECIALS[t] || FALLBACK_REWARD);
    }
    return arr;
  })();

  function xpForTier(index1) { return index1 * XP_PER_TIER; } // index 1-based

  function currentXp() { return BZG.storage.getLevel().xp; }

  // quantos tiers ja foram alcançados (0..TIERS.length)
  function reachedCount() {
    return Math.min(TIERS.length, Math.floor(currentXp() / XP_PER_TIER));
  }

  function progress() {
    var xp = currentXp();
    var reached = reachedCount();
    var nextXp = xpForTier(reached + 1);
    var prevXp = xpForTier(reached);
    var into = reached >= TIERS.length ? 1 : (xp - prevXp) / (nextXp - prevXp);
    return {
      xp: xp,
      reached: reached,
      total: TIERS.length,
      nextXp: nextXp,
      intoPct: Math.max(0, Math.min(100, into * 100))
    };
  }

  function tiers() { return TIERS; }

  function titleLabel(id) { return TITLES[id] || ""; }
  function colorLabel(id) { return COLOR_LABELS[id] || id; }

  function isChapterEndTier(index0) { return (index0 + 1) % TIER_PER_CHAPTER === 0; }

  function applyReward(t) {
    switch (t.r) {
      case "reloadBoost": BZG.storage.addReloadBonus(t.v); break;
      case "avatar": BZG.storage.unlockCosmetic("avatars", t.v); break;
      case "color": BZG.storage.unlockCosmetic("nameColors", t.v); break;
      case "theme": BZG.storage.unlockCosmetic("themes", t.v); break;
      case "title": BZG.storage.unlockCosmetic("titles", t.v); break;
      case "turbo": BZG.storage.unlockTurbo(); break;
      case "collectible": BZG.storage.grantCollectible(t.v); break;
    }
  }

  // tenta resgatar o tier (0-based). Retorna o reward (+ chapterBonus se for o
  // ultimo nivel de um capitulo) ou null.
  function claim(index0) {
    var reached = reachedCount();
    if (index0 >= reached) return null;             // ainda não alcançado
    if (BZG.storage.isTierClaimed(index0)) return null;
    var t = TIERS[index0];
    applyReward(t);
    var chapterBonus = 0;
    if (isChapterEndTier(index0)) {
      BZG.storage.addReloadBonus(CHAPTER_BONUS);
      chapterBonus = CHAPTER_BONUS;
    }
    BZG.storage.markTierClaimed(index0);
    return Object.assign({}, t, { chapterBonus: chapterBonus });
  }

  function claimAll() {
    var reached = reachedCount();
    var claimed = [];
    var totalChapterBonus = 0;
    for (var i = 0; i < reached; i++) {
      if (!BZG.storage.isTierClaimed(i)) {
        var t = TIERS[i];
        applyReward(t);
        if (isChapterEndTier(i)) {
          BZG.storage.addReloadBonus(CHAPTER_BONUS);
          totalChapterBonus += CHAPTER_BONUS;
        }
        BZG.storage.markTierClaimed(i);
        claimed.push(t);
      }
    }
    return { claimed: claimed, chapterBonus: totalChapterBonus };
  }

  function unclaimedCount() {
    var reached = reachedCount();
    var n = 0;
    for (var i = 0; i < reached; i++) if (!BZG.storage.isTierClaimed(i)) n++;
    return n;
  }

  return {
    XP_PER_TIER: XP_PER_TIER,
    TIER_PER_CHAPTER: TIER_PER_CHAPTER,
    CHAPTER_BONUS: CHAPTER_BONUS,
    xpForTier: xpForTier,
    tiers: tiers,
    progress: progress,
    reachedCount: reachedCount,
    claim: claim,
    claimAll: claimAll,
    unclaimedCount: unclaimedCount,
    titleLabel: titleLabel,
    colorLabel: colorLabel,
    TITLES: TITLES,
    COLOR_LABELS: COLOR_LABELS
  };
})();
