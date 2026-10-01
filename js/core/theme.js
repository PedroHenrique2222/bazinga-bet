/* Bazinga BET - temas (carregar no <head> para evitar flash).
   Cada "skin" tem uma base (dark/light) que dita os ajustes de contraste,
   e um id que troca a paleta de cores via data-skin. */
/* Moldura da musica (app.html): toda pagina aberta direto vai para dentro da moldura,
   que guarda o player de musica e troca so o conteudo (num iframe). Assim a musica
   nunca para nem recomeca ao trocar de pagina. Fora do ar (file://) segue sem moldura. */
(function () {
  try {
    if (window.top !== window || location.protocol === "file:") return;
    var path = location.pathname;
    if (/\/app\.html$/.test(path)) return;
    var m = path.match(/^(.*\/)(?:games|minigames)\/[^\/]*$/);
    var rootDir = m ? m[1] : path.replace(/[^\/]*$/, "");
    var rel = path.slice(rootDir.length) || "index.html";
    // para de carregar esta pagina (nenhum outro script roda) e abre a moldura
    window.stop();
    location.replace(rootDir + "app.html#" + rel + location.search);
  } catch (e) {}
})();

(function () {
  /* Reset de lancamento: quando este token muda (novo deploy), apaga TUDO do navegador
     UMA vez - progresso, cadastro, preferencias, sessao do ranking - forcando todo
     jogador a recomecar do zero. Roda antes de qualquer leitura de dados (theme.js e o
     1o script de toda pagina). Pra fazer outro reset no futuro, basta trocar o token. */
  try {
    var RESET_TOKEN = "v1.15-launch";
    if (localStorage.getItem("bzgResetToken") !== RESET_TOKEN) {
      localStorage.clear();
      localStorage.setItem("bzgResetToken", RESET_TOKEN);
    }
  } catch (e) {}

  var THEMES = {
    dark:   { name: "Escuro",       icon: "🌙", mode: "dark",  free: true },
    light:  { name: "Claro",        icon: "☀️", mode: "light", free: true },
    neon:   { name: "Neon Roxo",    icon: "🟣", mode: "dark" },
    ouro:   { name: "Ouro Real",    icon: "👑", mode: "dark" },
    matrix: { name: "Matrix",       icon: "🟢", mode: "dark" },
    rubi:   { name: "Rubi",         icon: "🔴", mode: "dark" },
    sangue: { name: "Sangue",       icon: "🩸", mode: "dark" },
    oceano: { name: "Oceano",       icon: "🌊", mode: "dark" },
    vulcao: { name: "Vulcão",       icon: "🌋", mode: "dark" },
    rosa:   { name: "Rosa Chiclete", icon: "🩷", mode: "light" },
    gelo:   { name: "Gelo",         icon: "🧊", mode: "light" },
    lavanda: { name: "Lavanda",     icon: "💜", mode: "light" }
  };

  function apply(id) {
    var t = THEMES[id] || THEMES.dark;
    var root = document.documentElement;
    root.setAttribute("data-theme", t.mode);   // ajustes de contraste (dark/light)
    root.setAttribute("data-skin", id);          // paleta de cores
  }

  var saved = null;
  try { saved = localStorage.getItem("bzgTheme"); } catch (e) {}
  if (!THEMES[saved]) saved = "dark";
  apply(saved);

  window.BZG = window.BZG || {};
  BZG.theme = {
    THEMES: THEMES,
    get: function () {
      return document.documentElement.getAttribute("data-skin") || "dark";
    },
    getMode: function () {
      return document.documentElement.getAttribute("data-theme") || "dark";
    },
    set: function (id) {
      if (!THEMES[id]) return;
      apply(id);
      try { localStorage.setItem("bzgTheme", id); } catch (e) {}
      document.dispatchEvent(new CustomEvent("bzg:theme-changed"));
      return id;
    },
    // alterna entre uma lista de skins disponiveis (usado pelo botao da topbar)
    cycle: function (list) {
      list = list && list.length ? list : ["dark", "light"];
      var cur = this.get();
      var i = list.indexOf(cur);
      var next = list[(i + 1) % list.length];
      return this.set(next);
    }
  };
})();
