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

  /* Recompensas especiais (cosmeticos) fixadas em niveis-marco (chave = nivel 1-based).
     Os demais niveis dao fichas (BZ$) com valor crescente. Os avatares aqui NUNCA
     repetem um valor que ja e gratis por padrao (ver AVATARS em profile.js) nem
     entre si - senao o "desbloqueio" nao desbloqueia nada de novo. */
  var SPECIALS = {
    // Capitulo 1 (1-10): Amigos dos Bazingas
    2:  { r: "color",  v: "gold",       icon: "🅰️", label: "Cor Dourado" },
    3:  { r: "avatar", v: "🏳️‍🌈",       icon: "🏳️‍🌈", label: "Avatar Dhani" },
    5:  { r: "avatar", v: "🌑",         icon: "🌑", label: "Avatar Shadow" },
    6:  { r: "theme",  v: "gelo",       icon: "🧊", label: "Tema Gelo" },
    7:  { r: "avatar", v: "🎮",         icon: "🎮", label: "Avatar CBPB_Gamer" },
    8:  { r: "title",  v: "novato",     icon: "🎖️", label: "Título: Novato" },
    9:  { r: "avatar", v: "👽",         icon: "👽", label: "Avatar Alien Jo" },

    // Capitulo 2 (11-20): BZG Abóbora
    12: { r: "color",  v: "fire",       icon: "🅰️", label: "Cor Fogo" },
    13: { r: "avatar", v: "🎃",         icon: "🎃", label: "Avatar BZG Abóbora" },
    15: { r: "theme",  v: "neon",       icon: "🟣", label: "Tema Neon Roxo" },
    17: { r: "title",  v: "apostador",  icon: "🎖️", label: "Título: Apostador" },
    19: { r: "avatar", v: "🤖",         icon: "🤖", label: "Avatar Robô" },

    // Capitulo 3 (21-30): BZG Panetone
    22: { r: "color",  v: "ice",        icon: "🅰️", label: "Cor Gelo" },
    23: { r: "avatar", v: "🍰",         icon: "🍰", label: "Avatar BZG Panetone" },
    25: { r: "theme",  v: "ouro",       icon: "👑", label: "Tema Ouro Real" },
    27: { r: "avatar", v: "🐉",         icon: "🐉", label: "Avatar Dragão" },
    30: { r: "turbo",  v: "turbo",      icon: "⚡", label: "Modo Turbo" },

    // Capitulo 4 (31-40): BZG Canoa Furada
    32: { r: "color",  v: "matrix",     icon: "🅰️", label: "Cor Matrix" },
    33: { r: "avatar", v: "🛶",         icon: "🛶", label: "Avatar BZG Canoa Furada" },
    35: { r: "theme",  v: "matrix",     icon: "🟢", label: "Tema Matrix" },
    37: { r: "title",  v: "tubarao",    icon: "🎖️", label: "Título: Tubarão" },
    39: { r: "avatar", v: "🦄",         icon: "🦄", label: "Avatar Unicórnio" },

    // Capitulo 5 (41-50): BZG 616
    42: { r: "color",  v: "rose",       icon: "🅰️", label: "Cor Rosa" },
    43: { r: "avatar", v: "🪖",         icon: "🪖", label: "Avatar BZG 616" },
    45: { r: "theme",  v: "rosa",       icon: "🩷", label: "Tema Rosa Chiclete" },
    47: { r: "avatar", v: "🦁",         icon: "🦁", label: "Avatar Leão" },

    // Capitulo 6 (51-60): BZG Pikles Gamer
    52: { r: "color",  v: "neon",       icon: "🅰️", label: "Cor Neon" },
    53: { r: "avatar", v: "🥒",         icon: "🥒", label: "Avatar BZG Pikles Gamer" },
    55: { r: "theme",  v: "rubi",       icon: "🔴", label: "Tema Rubi" },
    57: { r: "avatar", v: "🐙",         icon: "🐙", label: "Avatar Kraken" },
    60: { r: "title",  v: "magnata",    icon: "🎖️", label: "Título: Magnata" },

    // Capitulo 7 (61-70): BZG Pilha Avulsa
    62: { r: "color",  v: "rainbow",    icon: "🅰️", label: "Cor Arco-íris" },
    63: { r: "avatar", v: "🔋",         icon: "🔋", label: "Avatar BZG Pilha Avulsa" },
    66: { r: "avatar", v: "🦅",         icon: "🦅", label: "Avatar Águia" },
    68: { r: "title",  v: "lenda",      icon: "🏆", label: "Título: Lenda BZG" },

    // Capitulo 8 (71-80): BZG Linden
    73: { r: "avatar", v: "🗑️",         icon: "🗑️", label: "Avatar BZG Linden" },
    76: { r: "avatar", v: "🌟",         icon: "🌟", label: "Avatar Estrela" },
    79: { r: "avatar", v: "💀",         icon: "💀", label: "Avatar Caveira" },

    // Capitulo 9 (81-90): BZG Bogão
    83: { r: "avatar", v: "🍑",         icon: "🍑", label: "Avatar BZG Bogão" },
    86: { r: "avatar", v: "🐒",         icon: "🐒", label: "Avatar Macaco" },
    90: { r: "title",  v: "imperador",  icon: "🥇", label: "Título: Imperador BZG" },

    // Capitulo 10 (91-100): BZG Pitoco
    93: { r: "avatar", v: "🐣",         icon: "🐣", label: "Avatar BZG Pitoco" },
    96: { r: "avatar", v: "🇧🇷",        icon: "🇧🇷", label: "Avatar Bandeira do Brasil" },
    100:{ r: "title",  v: "chefe",      icon: "👑", label: "Título: Chefão BZG" }
  };

  // recompensa padrao dos niveis sem marco cosmetico: aumenta o valor do botao
  // "Recarregar" em BZ$ 5.000 por nivel (nao da dinheiro direto).
  var RELOAD_STEP = 5000;
  var RELOAD_REWARD = { r: "reloadBoost", v: RELOAD_STEP, icon: "💳", label: "Recarga +BZ$ " + RELOAD_STEP.toLocaleString("pt-BR") };

  /* 100 niveis: marcos cosmeticos fixos + aumento de recarga no resto */
  var TIERS = (function () {
    var arr = [];
    for (var t = 1; t <= 100; t++) {
      arr.push(SPECIALS[t] || RELOAD_REWARD);
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
