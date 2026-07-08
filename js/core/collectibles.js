/* Bazinga BET - colecionaveis tematicos dos Bazingas (album de figurinhas da equipe).
   8 personagens x 10 itens = 80 colecionaveis. Chance pequena de drop a cada aposta
   (evento bzg:bet-recorded, disparado por storage.recordBet). Completar o album de
   um personagem desbloqueia o avatar exclusivo dele (mesmo avatar usado pelo bot da
   equipe no painel ao vivo - ver bots.js CREW). */
window.BZG = window.BZG || {};

BZG.collectibles = (function () {
  var DROP_CHANCE = 0.15;

  var CHARACTERS = [
    { key: "abobora", name: "BZG Abóbora", avatar: "🎃", game: "Plinko da Abóbora" },
    { key: "panetone", name: "BZG Panetone", avatar: "🍰", game: "HiLo do Panetone" },
    { key: "canoa", name: "BZG Canoa Furada", avatar: "🛶", game: "Canoa Furada" },
    { key: "seis16", name: "BZG 616", avatar: "🪖", game: "Dado 616" },
    { key: "pikles", name: "BZG Pikles Gamer", avatar: "🥒", game: "Mines do Pikles" },
    { key: "pilha", name: "BZG Pilha Avulsa", avatar: "🔋", game: "Moeda da Pilha" },
    { key: "linden", name: "BZG Linden", avatar: "🗑️", game: "Lixeira do Linden" },
    { key: "bogao", name: "BZG Bogão", avatar: "🍑", game: "21 do Bogão" }
  ];

  var ITEM_DEFS = {
    abobora: [
      ["🎃", "Abóbora Clássica"], ["🟠", "Abóbora Redonda"], ["🕸️", "Abóbora Assombrada"],
      ["👻", "Abóbora Fantasma"], ["🌽", "Abóbora da Horta"], ["🍂", "Abóbora de Outono"],
      ["🔥", "Abóbora em Chamas"], ["🌕", "Abóbora Lua Cheia"], ["💥", "Abóbora Estourada"],
      ["🏆", "Abóbora Dourada"]
    ],
    panetone: [
      ["🍰", "Panetone Clássico"], ["🍞", "Panetone Caseiro"], ["🍫", "Panetone de Chocolate"],
      ["🎄", "Panetone de Natal"], ["🥂", "Panetone com Espumante"], ["🎁", "Panetone Presente"],
      ["🕯️", "Panetone com Velinha"], ["❄️", "Panetone Gelado"], ["🌟", "Panetone Estrelado"],
      ["👑", "Panetone Real"]
    ],
    canoa: [
      ["🛶", "Canoa Clássica"], ["🌊", "Canoa nas Ondas"], ["💧", "Canoa Pingando"],
      ["⛵", "Canoa com Vela"], ["🪣", "Canoa e o Balde"], ["🌧️", "Canoa na Chuva"],
      ["🐟", "Canoa e o Peixe"], ["🌅", "Canoa ao Amanhecer"], ["⚓", "Canoa Ancorada"],
      ["🏆", "Canoa Lendária"]
    ],
    seis16: [
      ["🪖", "616 de Capacete"], ["🎖️", "616 Condecorado"], ["🧭", "616 com Bússola"],
      ["🔭", "616 de Vigia"], ["🪂", "616 Paraquedista"], ["🎯", "616 Na Mira"],
      ["🛡️", "616 com Escudo"], ["⚔️", "616 em Combate"], ["🚁", "616 de Helicóptero"],
      ["🏅", "616 General"]
    ],
    pikles: [
      ["🥒", "Pikles Clássico"], ["🎮", "Pikles Gamer"], ["🌱", "Pikles Brotinho"],
      ["🥬", "Pikles da Horta"], ["🕹️", "Pikles Retrô"], ["💻", "Pikles Streamer"],
      ["🎧", "Pikles com Fone"], ["🏆", "Pikles Campeão"], ["🌿", "Pikles Zen"],
      ["👑", "Pikles Rei da Horta"]
    ],
    pilha: [
      ["🔋", "Pilha Clássica"], ["⚡", "Pilha Carregada"], ["🪫", "Pilha Fraca"],
      ["💡", "Pilha Iluminada"], ["🔌", "Pilha na Tomada"], ["⚙️", "Pilha Mecânica"],
      ["🌩️", "Pilha Elétrica"], ["🧲", "Pilha Magnética"], ["🚨", "Pilha de Emergência"],
      ["🏆", "Pilha Suprema"]
    ],
    linden: [
      ["🗑️", "Linden Clássico"], ["🧹", "Linden Vassoura"], ["🧺", "Linden Cesto"],
      ["🧼", "Linden Sabão"], ["🧤", "Linden Luvas"], ["♻️", "Linden Reciclagem"],
      ["🪣", "Linden Balde"], ["🧻", "Linden Papel"], ["🚮", "Linden Limpeza"],
      ["🏆", "Linden Faxineiro Chefe"]
    ],
    bogao: [
      ["🍑", "Bogão Clássico"], ["😎", "Bogão Estiloso"], ["🕺", "Bogão Dançarino"],
      ["🎉", "Bogão Festeiro"], ["💪", "Bogão Forte"], ["🎤", "Bogão Cantor"],
      ["🥇", "Bogão Campeão"], ["😂", "Bogão Engraçado"], ["🌟", "Bogão Estrela"],
      ["🏆", "Bogão Lendário"]
    ]
  };

  var ALL_ITEMS = [];
  var BY_CHAR = {};
  CHARACTERS.forEach(function (c) {
    BY_CHAR[c.key] = ITEM_DEFS[c.key].map(function (pair, i) {
      var item = { id: c.key + "-" + (i + 1), char: c.key, n: i + 1, icon: pair[0], name: pair[1] };
      ALL_ITEMS.push(item);
      return item;
    });
  });

  function characters() { return CHARACTERS; }

  function characterByKey(key) {
    for (var i = 0; i < CHARACTERS.length; i++) if (CHARACTERS[i].key === key) return CHARACTERS[i];
    return null;
  }

  function all() { return ALL_ITEMS; }
  function byCharacter(key) { return BY_CHAR[key] || []; }

  function ownedCountFor(charKey) {
    var owned = BZG.storage.getCollectibles().owned;
    var items = byCharacter(charKey);
    var n = 0;
    items.forEach(function (it) { if (owned[it.id]) n++; });
    return n;
  }

  function isSetComplete(charKey) {
    return ownedCountFor(charKey) >= byCharacter(charKey).length;
  }

  function totalOwned() {
    return Object.keys(BZG.storage.getCollectibles().owned).length;
  }

  function totalItems() { return ALL_ITEMS.length; }

  // roda a cada aposta registrada (bzg:bet-recorded): chance pequena de soltar 1 colecionavel aleatorio
  function rollOnBet() {
    if (Math.random() >= DROP_CHANCE) return;

    var item = ALL_ITEMS[Math.floor(Math.random() * ALL_ITEMS.length)];
    var wasComplete = isSetComplete(item.char);
    var isNew = BZG.storage.grantCollectible(item.id);
    if (!isNew) return; // ja tinha essa figurinha - sem toast, sem festa

    if (BZG.ui) BZG.ui.toast("🎴 Novo colecionável: " + item.icon + " " + item.name, "success");

    if (!wasComplete && isSetComplete(item.char)) {
      var character = characterByKey(item.char);
      BZG.storage.unlockCosmetic("avatars", character.avatar);
      if (BZG.ui) {
        setTimeout(function () {
          BZG.ui.toast("🏆 Álbum completo: " + character.name + "! Avatar " + character.avatar + " desbloqueado!", "success");
        }, 600);
      }
      if (BZG.sounds && BZG.sounds.achievement) BZG.sounds.achievement();
    }
  }

  return {
    DROP_CHANCE: DROP_CHANCE,
    characters: characters,
    characterByKey: characterByKey,
    all: all,
    byCharacter: byCharacter,
    ownedCountFor: ownedCountFor,
    isSetComplete: isSetComplete,
    totalOwned: totalOwned,
    totalItems: totalItems,
    rollOnBet: rollOnBet
  };
})();
