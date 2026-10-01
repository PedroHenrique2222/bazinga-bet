/* Bazinga BET - giro automatico para os caca-niqueis (Bazinguinha e Bonanza).
   BZG.autospin.create(container, onSpin) desenha os botoes (10 / 25 / 50 / 100 / Parar)
   e chama onSpin() a cada giro. O jogo avisa o fim de cada giro com done(); o proximo
   so comeca depois que a animacao de vitoria grande (Big Win) fechar. Para sozinho
   quando acabar o saldo ou se o jogador clicar em Parar. */
window.BZG = window.BZG || {};

BZG.autospin = (function () {
  var COUNTS = [10, 25, 50, 100];

  function create(container, onSpin, opts) {
    opts = opts || {};
    var left = 0;
    var timer = null;

    container.innerHTML =
      '<label>Giro automático</label>' +
      '<div class="autospin-row">' +
        COUNTS.map(function (n) { return '<button type="button" class="btn btn--ghost autospin-btn" data-n="' + n + '">' + n + '</button>'; }).join("") +
      '</div>' +
      '<button type="button" class="btn btn--ghost autospin-stop" style="display:none">Parar · <span class="autospin-left">0</span> restantes</button>';

    var btns = Array.prototype.slice.call(container.querySelectorAll(".autospin-btn"));
    var stopBtn = container.querySelector(".autospin-stop");
    var leftEl = container.querySelector(".autospin-left");

    function sync() {
      var on = left > 0;
      stopBtn.style.display = on ? "" : "none";
      leftEl.textContent = left === Infinity ? "∞" : left;
      btns.forEach(function (b) { b.disabled = on; });
      if (opts.onChange) opts.onChange(left); // o jogo pode mostrar a contagem em outro lugar
    }

    function stop() {
      left = 0;
      clearTimeout(timer);
      sync();
    }

    function next() {
      if (left <= 0) return;
      left--;
      sync();
      // o jogo devolve false quando nao conseguiu girar (ex.: sem saldo)
      if (onSpin() === false) stop();
    }

    btns.forEach(function (b) {
      b.addEventListener("click", function () {
        left = Number(b.dataset.n);
        BZG.sounds.click();
        next();
      });
    });
    stopBtn.addEventListener("click", function () { stop(); BZG.sounds.click(); });

    // o jogo chama ao terminar um giro. ok=false (sem saldo, erro) para o automatico
    function done(ok) {
      if (left <= 0) return;
      if (ok === false) { stop(); return; }
      var wait = 650 * BZG.modes.speed();
      (function waitBigWin() {
        timer = setTimeout(function () {
          if (document.querySelector(".bigwin-overlay")) { waitBigWin(); return; }
          next();
        }, wait);
      })();
    }

    // comeca um automatico de n giros (Infinity = ate parar) por outro botao do jogo
    // busy=true: um giro ainda esta rodando; o automatico continua quando ele acabar (done)
    function start(n, busy) {
      if (left > 0 || busy) { left = n; sync(); return; } // ja girando: so troca a contagem
      left = n;
      next();
    }

    return { done: done, stop: stop, start: start, left: function () { return left; }, active: function () { return left > 0; } };
  }

  return { create: create };
})();
