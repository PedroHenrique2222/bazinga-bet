/* Bazinga BET - utilidades de interface compartilhadas entre as paginas */
window.BZG = window.BZG || {};

BZG.ui = (function () {
  function formatChips(value) {
    var n = Math.round(value || 0);
    return n.toLocaleString("pt-BR");
  }

  function formatMoney(value) {
    return "BZ$ " + formatChips(value);
  }

  function refreshBalance() {
    var el = document.getElementById("balance-value");
    if (el) el.textContent = formatMoney(BZG.storage.getBalance());
  }

  function toast(message, type) {
    var container = document.getElementById("toast-container");
    if (!container) return;
    var el = document.createElement("div");
    el.className = "toast toast--" + (type || "info");
    el.textContent = message;
    container.appendChild(el);
    requestAnimationFrame(function () {
      el.classList.add("toast--visible");
    });
    setTimeout(function () {
      el.classList.remove("toast--visible");
      setTimeout(function () {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, 300);
    }, 2600);
  }

  /* Mantido por compatibilidade: o layout.js agora cuida do cabecalho */
  function initHeader() {
    refreshBalance();
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  // envolve o apelido do jogador com a cor desbloqueada e (opcional) titulo
  function nameHTML(nick, opts) {
    opts = opts || {};
    var cos = BZG.storage.getCosmetics ? BZG.storage.getCosmetics() : { nameColor: "default", title: "" };
    var colorCls = cos.nameColor && cos.nameColor !== "default" ? " color-" + cos.nameColor : "";
    var html = '<span class="bzg-name' + colorCls + '">' + escapeHtml(nick) + '</span>';
    if (opts.title !== false && cos.title && BZG.battlepass) {
      var t = BZG.battlepass.titleLabel(cos.title);
      if (t) html += '<span class="bzg-title">' + escapeHtml(t) + '</span>';
    }
    return html;
  }

  return {
    formatChips: formatChips,
    formatMoney: formatMoney,
    refreshBalance: refreshBalance,
    toast: toast,
    initHeader: initHeader,
    nameHTML: nameHTML,
    escapeHtml: escapeHtml
  };
})();
