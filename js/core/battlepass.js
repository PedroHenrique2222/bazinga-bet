/* Bazinga BET - Passe de Batalha: tiers desbloqueados por XP, recompensas cosmeticas.
   O XP é o mesmo do perfil (1 XP a cada BZ$10 apostados). 100 niveis organizados
   em 10 capitulos de 10 niveis: o 1o e dos Amigos dos Bazingas, os outros 9 sao
   um pra cada membro da Equipe BZG (ver TIER_PER_CHAPTER/CHAPTER_BONUS abaixo). */
window.BZG = window.BZG || {};

BZG.battlepass = (function () {
  // Mais dificil de subir: cada nivel do passe custa mais XP que antes (era 400).
  var XP_PER_TIER = 600;
  var TIER_PER_CHAPTER = 10; // precisa bater com js/pages/passe.js

  // bonus extra de recarga ao completar (resgatar) o ultimo nivel de um capitulo,
  // por cima de qualquer outra recompensa que esse nivel ja de
  var CHAPTER_BONUS = 5000;

  var TITLES = {
    novato: "Novato",
    apostador: "Apostador",
    tubarao: "Tubarão",
    magnata: "Magnata",
    lenda: "Lenda BZG",
    imperador: "Imperador BZG",
    chefe: "Chefão BZG"
  };

  var COLOR_LABELS = {
    gold: "Dourado", fire: "Fogo", ice: "Gelo", matrix: "Matrix",
    rose: "Rosa", neon: "Neon", rainbow: "Arco-íris"
  };

  /* Recompensas especiais (cosmeticos + figurinhas) fixadas em cada nivel (chave =
     nivel 1-based). A UNICA recarga do passe agora vem do bonus de capitulo
     (CHAPTER_BONUS) - todo nivel tem uma recompensa explicita aqui, nao sobra
     nivel "generico". Os avatares aqui NUNCA repetem um valor que ja e gratis por
     padrao (ver AVATARS em profile.js) nem entre si - senao o "desbloqueio" nao
     desbloqueia nada de novo. As figurinhas ("collectible") sao garantidas -
     chamam BZG.storage.grantCollectible direto, sem depender do drop aleatorio -
     e usam os mesmos ids de js/core/collectibles.js. */
  var SPECIALS = {
    // Capitulo 1 (1-10): Amigos dos Bazingas
    1:  { r: "collectible", v: "dhani-2",  icon: "🌈", label: "Figurinha: Dhani do Arco-íris" },
    2:  { r: "color",  v: "gold",       icon: "🅰️", label: "Cor Dourado" },
    3:  { r: "avatar", v: "🏳️‍🌈",       icon: "🏳️‍🌈", label: "Avatar Dhani" },
    4:  { r: "collectible", v: "shadow-2", icon: "🌙", label: "Figurinha: Shadow da Lua" },
    5:  { r: "avatar", v: "🌑",         icon: "🌑", label: "Avatar Shadow" },
    6:  { r: "theme",  v: "gelo",       icon: "🧊", label: "Tema Gelo" },
    7:  { r: "avatar", v: "🎮",         icon: "🎮", label: "Avatar CBPB_Gamer" },
    8:  { r: "title",  v: "novato",     icon: "🎖️", label: "Título: Novato" },
    9:  { r: "avatar", v: "👽",         icon: "👽", label: "Avatar Alien Jo" },
    10: { r: "collectible", v: "cbpb-2",   icon: "🕹️", label: "Figurinha: CBPB Retrô" },

    // Capitulo 2 (11-20): BZG Abóbora
    11: { r: "collectible", v: "abobora-2", icon: "🟠", label: "Figurinha: Abóbora Redonda" },
    12: { r: "color",  v: "fire",       icon: "🅰️", label: "Cor Fogo" },
    13: { r: "avatar", v: "🎃",         icon: "🎃", label: "Avatar BZG Abóbora" },
    14: { r: "collectible", v: "abobora-3", icon: "🕸️", label: "Figurinha: Abóbora Assombrada" },
    15: { r: "theme",  v: "neon",       icon: "🟣", label: "Tema Neon Roxo" },
    16: { r: "collectible", v: "abobora-4", icon: "👻", label: "Figurinha: Abóbora Fantasma" },
    17: { r: "title",  v: "apostador",  icon: "🎖️", label: "Título: Apostador" },
    18: { r: "collectible", v: "abobora-5", icon: "🌽", label: "Figurinha: Abóbora da Horta" },
    19: { r: "avatar", v: "🤖",         icon: "🤖", label: "Avatar Robô" },
    20: { r: "collectible", v: "abobora-6", icon: "🍂", label: "Figurinha: Abóbora de Outono" },

    // Capitulo 3 (21-30): BZG Panetone
    21: { r: "collectible", v: "panetone-2", icon: "🍞", label: "Figurinha: Panetone Caseiro" },
    22: { r: "color",  v: "ice",        icon: "🅰️", label: "Cor Gelo" },
    23: { r: "avatar", v: "🍰",         icon: "🍰", label: "Avatar BZG Panetone" },
    24: { r: "collectible", v: "panetone-3", icon: "🍫", label: "Figurinha: Panetone de Chocolate" },
    25: { r: "theme",  v: "ouro",       icon: "👑", label: "Tema Ouro Real" },
    26: { r: "collectible", v: "panetone-4", icon: "🎄", label: "Figurinha: Panetone de Natal" },
    27: { r: "avatar", v: "🐉",         icon: "🐉", label: "Avatar Dragão" },
    28: { r: "collectible", v: "panetone-5", icon: "🥂", label: "Figurinha: Panetone com Espumante" },
    29: { r: "collectible", v: "panetone-6", icon: "🎁", label: "Figurinha: Panetone Presente" },
    30: { r: "turbo",  v: "turbo",      icon: "⚡", label: "Modo Turbo" },

    // Capitulo 4 (31-40): BZG Canoa Furada
    31: { r: "collectible", v: "canoa-2", icon: "🌊", label: "Figurinha: Canoa nas Ondas" },
    32: { r: "color",  v: "matrix",     icon: "🅰️", label: "Cor Matrix" },
    33: { r: "avatar", v: "🛶",         icon: "🛶", label: "Avatar BZG Canoa Furada" },
    34: { r: "collectible", v: "canoa-3", icon: "💧", label: "Figurinha: Canoa Pingando" },
    35: { r: "theme",  v: "matrix",     icon: "🟢", label: "Tema Matrix" },
    36: { r: "collectible", v: "canoa-4", icon: "⛵", label: "Figurinha: Canoa com Vela" },
    37: { r: "title",  v: "tubarao",    icon: "🎖️", label: "Título: Tubarão" },
    38: { r: "collectible", v: "canoa-5", icon: "🪣", label: "Figurinha: Canoa e o Balde" },
    39: { r: "avatar", v: "🦄",         icon: "🦄", label: "Avatar Unicórnio" },
    40: { r: "collectible", v: "canoa-6", icon: "🌧️", label: "Figurinha: Canoa na Chuva" },

    // Capitulo 5 (41-50): BZG 616
    41: { r: "collectible", v: "seis16-2", icon: "🎖️", label: "Figurinha: 616 Condecorado" },
    42: { r: "color",  v: "rose",       icon: "🅰️", label: "Cor Rosa" },
    43: { r: "avatar", v: "🪖",         icon: "🪖", label: "Avatar BZG 616" },
    44: { r: "collectible", v: "seis16-3", icon: "🧭", label: "Figurinha: 616 com Bússola" },
    45: { r: "theme",  v: "rosa",       icon: "🩷", label: "Tema Rosa Chiclete" },
    46: { r: "collectible", v: "seis16-4", icon: "🔭", label: "Figurinha: 616 de Vigia" },
    47: { r: "avatar", v: "🦁",         icon: "🦁", label: "Avatar Leão" },
    48: { r: "collectible", v: "seis16-5", icon: "🪂", label: "Figurinha: 616 Paraquedista" },
    49: { r: "collectible", v: "seis16-6", icon: "🎯", label: "Figurinha: 616 Na Mira" },
    50: { r: "collectible", v: "seis16-7", icon: "🛡️", label: "Figurinha: 616 com Escudo" },

    // Capitulo 6 (51-60): BZG Pikles Gamer
    51: { r: "collectible", v: "pikles-2", icon: "🎮", label: "Figurinha: Pikles Gamer" },
    52: { r: "color",  v: "neon",       icon: "🅰️", label: "Cor Neon" },
    53: { r: "avatar", v: "🥒",         icon: "🥒", label: "Avatar BZG Pikles Gamer" },
    54: { r: "collectible", v: "pikles-3", icon: "🌱", label: "Figurinha: Pikles Brotinho" },
    55: { r: "theme",  v: "rubi",       icon: "🔴", label: "Tema Rubi" },
    56: { r: "collectible", v: "pikles-4", icon: "🥬", label: "Figurinha: Pikles da Horta" },
    57: { r: "avatar", v: "🐙",         icon: "🐙", label: "Avatar Kraken" },
    58: { r: "collectible", v: "pikles-5", icon: "🕹️", label: "Figurinha: Pikles Retrô" },
    59: { r: "collectible", v: "pikles-6", icon: "💻", label: "Figurinha: Pikles Streamer" },
    60: { r: "title",  v: "magnata",    icon: "🎖️", label: "Título: Magnata" },

    // Capitulo 7 (61-70): BZG Pilha Avulsa
    61: { r: "collectible", v: "pilha-2", icon: "⚡", label: "Figurinha: Pilha Carregada" },
    62: { r: "color",  v: "rainbow",    icon: "🅰️", label: "Cor Arco-íris" },
    63: { r: "avatar", v: "🔋",         icon: "🔋", label: "Avatar BZG Pilha Avulsa" },
    64: { r: "collectible", v: "pilha-3", icon: "🪫", label: "Figurinha: Pilha Fraca" },
    65: { r: "collectible", v: "pilha-4", icon: "💡", label: "Figurinha: Pilha Iluminada" },
    66: { r: "avatar", v: "🦅",         icon: "🦅", label: "Avatar Águia" },
    67: { r: "collectible", v: "pilha-5", icon: "🔌", label: "Figurinha: Pilha na Tomada" },
    68: { r: "title",  v: "lenda",      icon: "🏆", label: "Título: Lenda BZG" },
    69: { r: "collectible", v: "pilha-6", icon: "⚙️", label: "Figurinha: Pilha Mecânica" },
    70: { r: "collectible", v: "pilha-7", icon: "🌩️", label: "Figurinha: Pilha Elétrica" },

    // Capitulo 8 (71-80): BZG Linden
    71: { r: "collectible", v: "linden-2", icon: "🧹", label: "Figurinha: Linden Vassoura" },
    72: { r: "collectible", v: "linden-3", icon: "🧺", label: "Figurinha: Linden Cesto" },
    73: { r: "avatar", v: "🗑️",         icon: "🗑️", label: "Avatar BZG Linden" },
    74: { r: "collectible", v: "linden-4", icon: "🧼", label: "Figurinha: Linden Sabão" },
    75: { r: "collectible", v: "linden-5", icon: "🧤", label: "Figurinha: Linden Luvas" },
    76: { r: "avatar", v: "🌟",         icon: "🌟", label: "Avatar Estrela" },
    77: { r: "collectible", v: "linden-6", icon: "♻️", label: "Figurinha: Linden Reciclagem" },
    78: { r: "collectible", v: "linden-7", icon: "🪣", label: "Figurinha: Linden Balde" },
    79: { r: "avatar", v: "💀",         icon: "💀", label: "Avatar Caveira" },
    80: { r: "collectible", v: "linden-8", icon: "🧻", label: "Figurinha: Linden Papel" },

    // Capitulo 9 (81-90): BZG Bogão
    81: { r: "collectible", v: "bogao-2", icon: "😎", label: "Figurinha: Bogão Estiloso" },
    82: { r: "collectible", v: "bogao-3", icon: "🕺", label: "Figurinha: Bogão Dançarino" },
    83: { r: "avatar", v: "🍑",         icon: "🍑", label: "Avatar BZG Bogão" },
    84: { r: "collectible", v: "bogao-4", icon: "🎉", label: "Figurinha: Bogão Festeiro" },
    85: { r: "collectible", v: "bogao-5", icon: "💪", label: "Figurinha: Bogão Forte" },
    86: { r: "avatar", v: "🐒",         icon: "🐒", label: "Avatar Macaco" },
    87: { r: "collectible", v: "bogao-6", icon: "🎤", label: "Figurinha: Bogão Cantor" },
    88: { r: "collectible", v: "bogao-7", icon: "🥇", label: "Figurinha: Bogão Campeão" },
    89: { r: "collectible", v: "bogao-8", icon: "😂", label: "Figurinha: Bogão Engraçado" },
    90: { r: "title",  v: "imperador",  icon: "🥇", label: "Título: Imperador BZG" },

    // Capitulo 10 (91-100): BZG Pitoco
    91: { r: "collectible", v: "pitoco-2", icon: "🥚", label: "Figurinha: Pitoco no Ovo" },
    92: { r: "collectible", v: "pitoco-3", icon: "🌾", label: "Figurinha: Pitoco do Milharal" },
    93: { r: "avatar", v: "🐣",         icon: "🐣", label: "Avatar BZG Pitoco" },
    94: { r: "collectible", v: "pitoco-4", icon: "🐤", label: "Figurinha: Pitoco Fofinho" },
    95: { r: "collectible", v: "pitoco-5", icon: "🎀", label: "Figurinha: Pitoco de Laço" },
    96: { r: "avatar", v: "🇧🇷",        icon: "🇧🇷", label: "Avatar Bandeira do Brasil" },
    97: { r: "collectible", v: "pitoco-6", icon: "🍳", label: "Figurinha: Pitoco Chef" },
    98: { r: "collectible", v: "pitoco-7", icon: "🌻", label: "Figurinha: Pitoco do Girassol" },
    99: { r: "collectible", v: "pitoco-8", icon: "⭐", label: "Figurinha: Pitoco Estrela" },
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
