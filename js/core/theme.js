/* Bazinga BET - temas (carregar no <head> para evitar flash).
   Cada "skin" tem uma base (dark/light) que dita os ajustes de contraste,
   e um id que troca a paleta de cores via data-skin. */
(function () {
  var THEMES = {
    dark:   { name: "Escuro",       icon: "🌙", mode: "dark",  free: true },
    light:  { name: "Claro",        icon: "☀️", mode: "light", free: true },
    neon:   { name: "Neon Roxo",    icon: "🟣", mode: "dark" },
    ouro:   { name: "Ouro Real",    icon: "👑", mode: "dark" },
    matrix: { name: "Matrix",       icon: "🟢", mode: "dark" },
    rubi:   { name: "Rubi",         icon: "🔴", mode: "dark" },
    rosa:   { name: "Rosa Chiclete", icon: "🩷", mode: "light" },
    gelo:   { name: "Gelo",         icon: "🧊", mode: "light" }
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
    },
    // compat: alterna dark<->light
    toggle: function () {
      return this.set(this.getMode() === "dark" ? "light" : "dark");
    }
  };
})();
