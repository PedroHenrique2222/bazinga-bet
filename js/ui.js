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

  return {
    formatChips: formatChips,
    formatMoney: formatMoney,
    refreshBalance: refreshBalance,
    toast: toast,
    initHeader: initHeader
  };
})();
