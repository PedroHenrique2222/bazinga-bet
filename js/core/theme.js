/* Bazinga BET - tema claro/escuro (carregar no <head> para evitar flash) */
(function () {
  var saved = null;
  try { saved = localStorage.getItem("bzgTheme"); } catch (e) {}
  var theme = saved === "light" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", theme);

  window.BZG = window.BZG || {};
  BZG.theme = {
    get: function () {
      return document.documentElement.getAttribute("data-theme");
    },
    toggle: function () {
      var next = this.get() === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      try { localStorage.setItem("bzgTheme", next); } catch (e) {}
      document.dispatchEvent(new CustomEvent("bzg:theme-changed"));
      return next;
    }
  };
})();
