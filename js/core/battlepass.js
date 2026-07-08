/* Bazinga BET - Passe de Batalha: tiers desbloqueados por XP, recompensas cosmeticas.
   O XP é o mesmo do perfil (1 XP a cada BZ$10 apostados). */
window.BZG = window.BZG || {};

BZG.battlepass = (function () {
  var XP_PER_TIER = 400;

  var TITLES = {
    novato: "Novato",
    apostador: "Apostador",
    tubarao: "Tubarão",
    magnata: "Magnata",
    lenda: "Lenda BZG"
  };

  var COLOR_LABELS = {
    gold: "Dourado", fire: "Fogo", ice: "Gelo", matrix: "Matrix",
    rose: "Rosa", neon: "Neon", rainbow: "Arco-íris"
  };

  /* cada tier: { r: tipo, v: valor, chips?, label, icon } */
  var TIERS = [
    { r: "chips", v: 1000, icon: "🪙", label: "BZ$ 1.000" },
    { r: "avatar", v: "🎩", icon: "🎩", label: "Avatar Cartola" },
    { r: "color", v: "gold", icon: "🅰️", label: "Cor Dourado" },
    { r: "theme", v: "gelo", icon: "🧊", label: "Tema Gelo" },
    { r: "chips", v: 2000, icon: "🪙", label: "BZ$ 2.000" },
    { r: "avatar", v: "🦈", icon: "🦈", label: "Avatar Tubarão" },
    { r: "color", v: "fire", icon: "🅰️", label: "Cor Fogo" },
    { r: "theme", v: "neon", icon: "🟣", label: "Tema Neon Roxo" },
    { r: "title", v: "novato", icon: "🎖️", label: "Título: Novato" },
    { r: "chips", v: 3000, icon: "🪙", label: "BZ$ 3.000" },
    { r: "avatar", v: "👽", icon: "👽", label: "Avatar Alien" },
    { r: "color", v: "ice", icon: "🅰️", label: "Cor Gelo" },
    { r: "theme", v: "ouro", icon: "👑", label: "Tema Ouro Real" },
    { r: "turbo", v: "turbo", icon: "⚡", label: "Modo Turbo" },
    { r: "title", v: "apostador", icon: "🎖️", label: "Título: Apostador" },
    { r: "chips", v: 5000, icon: "🪙", label: "BZ$ 5.000" },
    { r: "avatar", v: "🤖", icon: "🤖", label: "Avatar Robô" },
    { r: "color", v: "matrix", icon: "🅰️", label: "Cor Matrix" },
    { r: "theme", v: "matrix", icon: "🟢", label: "Tema Matrix" },
    { r: "title", v: "tubarao", icon: "🎖️", label: "Título: Tubarão" },
    { r: "chips", v: 8000, icon: "🪙", label: "BZ$ 8.000" },
    { r: "avatar", v: "🐉", icon: "🐉", label: "Avatar Dragão" },
    { r: "theme", v: "rosa", icon: "🩷", label: "Tema Rosa Chiclete" },
    { r: "color", v: "neon", icon: "🅰️", label: "Cor Neon" },
    { r: "theme", v: "rubi", icon: "🔴", label: "Tema Rubi" },
    { r: "title", v: "magnata", icon: "🎖️", label: "Título: Magnata" },
    { r: "avatar", v: "👑", icon: "👑", label: "Avatar Coroa" },
    { r: "chips", v: 15000, icon: "💰", label: "BZ$ 15.000" },
    { r: "color", v: "rainbow", icon: "🌈", label: "Cor Arco-íris" },
    { r: "title", v: "lenda", icon: "🏆", label: "Título: Lenda BZG" }
  ];

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
