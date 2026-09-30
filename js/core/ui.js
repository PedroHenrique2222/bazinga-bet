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

  /* Saldo do topo com contador animado. Descontos (apostas) sao instantaneos;
     ganhos sobem contando. A animacao comeca no proximo tick, entao quem chamar
     holdBalance() logo depois (ex.: effects.win, com moedas voando ate o saldo)
     consegue segurar o contador ate as moedas chegarem. */
  var shownBalance = null;   // valor que esta na tela agora
  var balanceTarget = null;  // valor que a tela deve alcancar
  var balanceCounter = null;
  var balanceHolds = 0;
  var balanceScheduled = false;

  function paintBalance(v) {
    var el = document.getElementById("balance-value");
    if (el) el.textContent = formatMoney(v);
  }

  function runBalance() {
    balanceScheduled = false;
    if (balanceHolds > 0 || balanceTarget === null) return;
    var to = balanceTarget;
    if (balanceCounter) balanceCounter.cancel();
    var box = document.querySelector(".balance-box");
    if (shownBalance === null || to <= shownBalance || !BZG.motion) {
      // desconto (aposta): instantaneo, com uma piscada vermelha no valor
      if (box && shownBalance !== null && to < shownBalance) {
        box.classList.remove("balance-down");
        void box.offsetWidth;
        box.classList.add("balance-down");
      }
      shownBalance = to;
      paintBalance(to);
      return;
    }
    var from = shownBalance;
    if (box) {
      box.classList.remove("balance-up");
      void box.offsetWidth;
      box.classList.add("balance-up");
    }
    var secs = BZG.motion.dur(Math.min(1.4, 0.45 + Math.log10(Math.max(10, to - from)) * 0.12));
    balanceCounter = BZG.motion.countUp(from, to, secs, function (v) {
      shownBalance = v;
      paintBalance(v);
    }, function () {
      shownBalance = to;
      if (box) setTimeout(function () { box.classList.remove("balance-up"); }, 350);
    });
  }

  // value (opcional) mostra um valor so na tela, sem mexer no saldo salvo (usado na pagina de testes)
  function refreshBalance(value) {
    balanceTarget = value != null ? value : BZG.storage.getBalance();
    if (shownBalance === null) { // primeira pintura: sem animacao
      shownBalance = balanceTarget;
      paintBalance(balanceTarget);
      return;
    }
    if (!balanceScheduled) {
      balanceScheduled = true;
      setTimeout(runBalance, 0);
    }
  }

  // segura o contador do saldo; devolve release() (chame quando as moedas chegarem)
  function holdBalance() {
    balanceHolds++;
    var released = false;
    return function release() {
      if (released) return;
      released = true;
      balanceHolds = Math.max(0, balanceHolds - 1);
      if (balanceHolds === 0) runBalance();
    };
  }

  /* Toast: entra deslizando, mostra uma barrinha do tempo restante e, ao sair, a pilha
     fecha o espaco suavemente. No maximo 4 na tela (o mais antigo sai primeiro). */
  var TOAST_MS = 2600;
  var TOAST_MAX = 4;

  function dismissToast(el) {
    if (el._leaving) return;
    el._leaving = true;
    clearTimeout(el._timer);
    el.style.maxHeight = el.offsetHeight + "px";
    void el.offsetWidth;
    el.classList.remove("toast--visible");
    el.classList.add("toast--leaving");
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 320);
  }

  function toast(message, type) {
    var container = document.getElementById("toast-container");
    if (!container) return;
    var live = Array.prototype.filter.call(container.children, function (c) { return !c._leaving; });
    while (live.length >= TOAST_MAX) dismissToast(live.shift());

    var el = document.createElement("div");
    el.className = "toast toast--" + (type || "info");
    el.setAttribute("role", "status");
    el.textContent = message;
    var bar = document.createElement("span");
    bar.className = "toast-bar";
    bar.style.animationDuration = TOAST_MS + "ms";
    el.appendChild(bar);
    el.addEventListener("click", function () { dismissToast(el); });
    container.appendChild(el);
    requestAnimationFrame(function () {
      el.classList.add("toast--visible");
    });
    el._timer = setTimeout(function () { dismissToast(el); }, TOAST_MS);
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
    holdBalance: holdBalance,
    toast: toast,
    initHeader: initHeader,
    nameHTML: nameHTML,
    escapeHtml: escapeHtml
  };
})();
