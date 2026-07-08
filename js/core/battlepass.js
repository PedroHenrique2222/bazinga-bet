/* Bazinga BET - Passe de Batalha: tiers desbloqueados por XP, recompensas cosmeticas.
   O XP é o mesmo do perfil (1 XP a cada BZ$10 apostados). */
window.BZG = window.BZG || {};

BZG.battlepass = (function () {
  // Mais dificil de subir: cada nivel do passe custa mais XP que antes (era 400).
  var XP_PER_TIER = 600;

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
     Os demais niveis dao fichas (BZ$) com valor crescente. */
  var SPECIALS = {
    2:  { r: "color",  v: "gold",      icon: "🅰️", label: "Cor Dourado" },
    4:  { r: "avatar", v: "🎩",        icon: "🎩", label: "Avatar Cartola" },
    6:  { r: "theme",  v: "gelo",      icon: "🧊", label: "Tema Gelo" },
    8:  { r: "title",  v: "novato",    icon: "🎖️", label: "Título: Novato" },
    11: { r: "color",  v: "fire",      icon: "🅰️", label: "Cor Fogo" },
    14: { r: "avatar", v: "🦈",        icon: "🦈", label: "Avatar Tubarão" },
    17: { r: "theme",  v: "neon",      icon: "🟣", label: "Tema Neon Roxo" },
    20: { r: "title",  v: "apostador", icon: "🎖️", label: "Título: Apostador" },
    24: { r: "color",  v: "ice",       icon: "🅰️", label: "Cor Gelo" },
    27: { r: "avatar", v: "👽",        icon: "👽", label: "Avatar Alien" },
    30: { r: "turbo",  v: "turbo",     icon: "⚡", label: "Modo Turbo" },
    33: { r: "theme",  v: "ouro",      icon: "👑", label: "Tema Ouro Real" },
    36: { r: "color",  v: "matrix",    icon: "🅰️", label: "Cor Matrix" },
    39: { r: "avatar", v: "🤖",        icon: "🤖", label: "Avatar Robô" },
    42: { r: "theme",  v: "matrix",    icon: "🟢", label: "Tema Matrix" },
    45: { r: "title",  v: "tubarao",   icon: "🎖️", label: "Título: Tubarão" },
    48: { r: "color",  v: "rose",      icon: "🅰️", label: "Cor Rosa" },
    51: { r: "avatar", v: "🐉",        icon: "🐉", label: "Avatar Dragão" },
    54: { r: "theme",  v: "rosa",      icon: "🩷", label: "Tema Rosa Chiclete" },
    57: { r: "color",  v: "neon",      icon: "🅰️", label: "Cor Neon" },
    60: { r: "title",  v: "magnata",   icon: "🎖️", label: "Título: Magnata" },
    63: { r: "avatar", v: "🦄",        icon: "🦄", label: "Avatar Unicórnio" },
    66: { r: "theme",  v: "rubi",      icon: "🔴", label: "Tema Rubi" },
    69: { r: "avatar", v: "👑",        icon: "👑", label: "Avatar Coroa" },
    72: { r: "color",  v: "rainbow",   icon: "🌈", label: "Cor Arco-íris" },
    75: { r: "avatar", v: "🦁",        icon: "🦁", label: "Avatar Leão" },
    78: { r: "title",  v: "lenda",     icon: "🏆", label: "Título: Lenda BZG" },
    82: { r: "avatar", v: "🐙",        icon: "🐙", label: "Avatar Kraken" },
    85: { r: "avatar", v: "🦅",        icon: "🦅", label: "Avatar Águia" },
    88: { r: "avatar", v: "🌟",        icon: "🌟", label: "Avatar Estrela" },
    90: { r: "title",  v: "imperador", icon: "🥇", label: "Título: Imperador BZG" },
    93: { r: "avatar", v: "💀",        icon: "💀", label: "Avatar Caveira" },
    96: { r: "avatar", v: "🃏",        icon: "🃏", label: "Avatar Coringa" },
    100:{ r: "title",  v: "chefe",     icon: "👑", label: "Título: Chefão BZG" }
  };

  function chipsFor(tier) {
    var v = Math.round((500 + tier * 250) / 50) * 50;
    return v;
  }

  /* 100 niveis: marcos cosmeticos + fichas crescentes no resto */
  var TIERS = (function () {
    var arr = [];
    for (var t = 1; t <= 100; t++) {
      if (SPECIALS[t]) {
        arr.push(SPECIALS[t]);
      } else {
        var v = chipsFor(t);
        arr.push({
          r: "chips", v: v,
          icon: v >= 10000 ? "💰" : "🪙",
          label: "BZ$ " + v.toLocaleString("pt-BR")
        });
      }
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

  function applyReward(t) {
    switch (t.r) {
      case "chips": BZG.storage.adjustBalance(t.v); BZG.ui.refreshBalance();
        document.dispatchEvent(new CustomEvent("bzg:balance-changed")); break;
      case "avatar": BZG.storage.unlockCosmetic("avatars", t.v); break;
      case "color": BZG.storage.unlockCosmetic("nameColors", t.v); break;
      case "theme": BZG.storage.unlockCosmetic("themes", t.v); break;
      case "title": BZG.storage.unlockCosmetic("titles", t.v); break;
      case "turbo": BZG.storage.unlockTurbo(); break;
    }
  }

  // tenta resgatar o tier (0-based). Retorna o reward ou null.
  function claim(index0) {
    var reached = reachedCount();
    if (index0 >= reached) return null;             // ainda não alcançado
    if (BZG.storage.isTierClaimed(index0)) return null;
    var t = TIERS[index0];
    applyReward(t);
    BZG.storage.markTierClaimed(index0);
    return t;
  }

  function claimAll() {
    var reached = reachedCount();
    var claimed = [];
    for (var i = 0; i < reached; i++) {
      if (!BZG.storage.isTierClaimed(i)) {
        var t = TIERS[i];
        applyReward(t);
        BZG.storage.markTierClaimed(i);
        claimed.push(t);
      }
    }
    return claimed;
  }

  function unclaimedCount() {
    var reached = reachedCount();
    var n = 0;
    for (var i = 0; i < reached; i++) if (!BZG.storage.isTierClaimed(i)) n++;
    return n;
  }

  return {
    XP_PER_TIER: XP_PER_TIER,
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
