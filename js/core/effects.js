/* Bazinga BET - efeitos visuais reutilizaveis (confete, shake, flash) e a
   comemoracao de vitoria unica do site (v1.21):
   - BZG.effects.win({ amount, mult, from, stage }) - chamada por TODOS os jogos
     quando o jogador ganha. Escolhe a intensidade pelo multiplicador:
       < 10x  : vitoria comum - "+BZ$" subindo, moedas voando ate o saldo
       >= 10x : tela de vitoria - Grande Vitoria -> Mega Vitoria (25x) -> BAZINGA! (50x),
                com contador rolando, chuva de moedas e o personagem do jogo.
                Um toque pula pro valor final; outro toque fecha.
   - Respeita Turbo e "reduzir movimento" via BZG.motion. */
window.BZG = window.BZG || {};

BZG.effects = (function () {
  // secs = duracao do trecho do contador em que aquele nivel fica na tela
  var TIERS = [
    { min: 10, name: "Grande Vitória", cls: "t1", secs: 2.2 },
    { min: 25, name: "Mega Vitória", cls: "t2", secs: 1.9 },
    { min: 50, name: "BAZINGA!", cls: "t3", secs: 2.1 }
  ];

  // personagem que comemora em cada jogo (dono do jogo); o resto fica com o Pitoco, mascote da casa
  var HOSTS = {
    crash: "canoa", mines: "pikles", tower: "linden", plinko: "abobora", dice: "seis16",
    hilo: "panetone", blackjack: "bogao", coinflip: "pilha"
  };
  var LINES = [
    ["Boa jogada!", "Isso aí!", "Tá voando!"],
    ["Que mão!", "Tá pegando fogo!", "Olha isso!"],
    ["BAZINGAAA!", "Lendário!", "Quebrou a banca!"]
  ];

  function M() { return BZG.motion; }
  function money(v) { return BZG.ui ? BZG.ui.formatMoney(v) : "BZ$ " + Math.round(v); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  /* ---------- Confete ---------- */

  var confettiCanvas = null;
  var confettiCtx = null;
  var confettiParticles = [];
  var confettiRunning = false;

  function ensureConfettiCanvas() {
    if (confettiCanvas) return;
    confettiCanvas = document.createElement("canvas");
    confettiCanvas.style.position = "fixed";
    confettiCanvas.style.inset = "0";
    confettiCanvas.style.width = "100%";
    confettiCanvas.style.height = "100%";
    confettiCanvas.style.pointerEvents = "none";
    confettiCanvas.style.zIndex = "1003";
    document.body.appendChild(confettiCanvas);
    confettiCtx = confettiCanvas.getContext("2d");

    function resize() {
      confettiCanvas.width = window.innerWidth;
      confettiCanvas.height = window.innerHeight;
    }
    window.addEventListener("resize", resize);
    resize();
  }

  function confetti(originX, originY, amount) {
    var n = M() ? M().particles(amount || 60) : (amount || 60);
    if (!n) return;
    ensureConfettiCanvas();
    var colors = ["#ff2d3a", "#ffcc00", "#ff5a3c", "#fff2b0", "#2ecc71"];
    var ox = originX != null ? originX : window.innerWidth / 2;
    var oy = originY != null ? originY : window.innerHeight / 3;

    for (var i = 0; i < n; i++) {
      var angle = Math.random() * Math.PI * 2;
      var speed = 2 + Math.random() * 6;
      confettiParticles.push({
        x: ox,
        y: oy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,
        size: 3 + Math.random() * 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI,
        rotSpeed: (Math.random() - 0.5) * 0.3,
        life: 0,
        maxLife: 60 + Math.random() * 40
      });
    }

    if (!confettiRunning) {
      confettiRunning = true;
      requestAnimationFrame(runConfetti);
    }
  }

  function runConfetti() {
    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    var alive = false;

    for (var i = 0; i < confettiParticles.length; i++) {
      var p = confettiParticles[i];
      if (!p) continue;
      p.life++;
      if (p.life > p.maxLife) {
        confettiParticles[i] = null;
        continue;
      }
      alive = true;
      p.vy += 0.12;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotSpeed;

      var alpha = 1 - p.life / p.maxLife;
      confettiCtx.save();
      confettiCtx.globalAlpha = Math.max(0, alpha);
      confettiCtx.translate(p.x, p.y);
      confettiCtx.rotate(p.rotation);
      confettiCtx.fillStyle = p.color;
      confettiCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      confettiCtx.restore();
    }

    confettiParticles = confettiParticles.filter(Boolean);

    if (alive) {
      requestAnimationFrame(runConfetti);
    } else {
      confettiRunning = false;
    }
  }

  function shake(el) {
    if (!el || (M() && M().reduced())) return;
    el.classList.remove("bzg-shake");
    void el.offsetWidth;
    el.classList.add("bzg-shake");
    setTimeout(function () {
      el.classList.remove("bzg-shake");
    }, 420);
  }

  function flash(container, color) {
    if (!container) return;
    var overlay = container.querySelector(".flash-overlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.className = "flash-overlay";
      container.appendChild(overlay);
    }
    overlay.classList.remove("flash-red", "flash-gold");
    void overlay.offsetWidth;
    overlay.classList.add(color === "gold" ? "flash-gold" : "flash-red");
  }

  /* ---------- Moedas voando ate o saldo ---------- */

  function balanceTarget() {
    var box = document.querySelector(".balance-box");
    if (!box) return null;
    var r = box.getBoundingClientRect();
    if (!r.width || !r.height) return null; // escondido (ex.: tela muito estreita)
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, box: box };
  }

  // solta `count` moedas de `origin` que voam em arco ate o saldo; onDone quando a ultima chega
  function coinsToBalance(origin, count, onDone) {
    var target = balanceTarget();
    var n = M() ? M().particles(count) : 0;
    if (!target || !n || !window.gsap) { if (onDone) onDone(); return; }
    var gsap = window.gsap;
    var landed = 0;
    for (var i = 0; i < n; i++) {
      (function (i) {
        var c = document.createElement("div");
        c.className = "bw-coin";
        document.body.appendChild(c);
        var spread = 70 + Math.random() * 50;
        var ang = Math.random() * Math.PI * 2;
        gsap.set(c, { x: origin.x - 11, y: origin.y - 11, scale: 0.4, opacity: 0 });
        var tl = gsap.timeline({
          delay: M().dur(i * 0.035),
          onComplete: function () {
            c.remove();
            if (BZG.sounds && BZG.sounds.coinLand) BZG.sounds.coinLand(i);
            target.box.classList.remove("balance-hit");
            void target.box.offsetWidth;
            target.box.classList.add("balance-hit");
            landed++;
            if (landed === n && onDone) onDone();
          }
        });
        // 1) estoura pra fora
        tl.to(c, {
          x: origin.x - 11 + Math.cos(ang) * spread,
          y: origin.y - 11 + Math.sin(ang) * spread * 0.7,
          scale: 1, opacity: 1, rotation: Math.random() * 180,
          duration: M().dur(0.28), ease: "power2.out"
        });
        // 2) voa em arco ate o saldo (x e y com curvas diferentes = arco)
        tl.to(c, { x: target.x - 11, duration: M().dur(0.55 + Math.random() * 0.15), ease: "power1.in" }, ">");
        tl.to(c, { y: target.y - 11, scale: 0.55, duration: M().dur(0.55 + Math.random() * 0.15), ease: "back.in(1.6)" }, "<");
      })(i);
    }
  }

  // "+BZ$ 1.234" subindo de onde a vitoria aconteceu
  function floatAmount(origin, amount, big) {
    if (M() && M().reduced()) return;
    var el = document.createElement("div");
    el.className = "bw-float" + (big ? " big" : "");
    el.textContent = "+" + money(amount);
    el.style.left = origin.x + "px";
    el.style.top = origin.y + "px";
    document.body.appendChild(el);
    el.style.animationDuration = (M() ? M().dur(1.3) : 1.3) + "s";
    setTimeout(function () { el.remove(); }, 1500);
  }

  /* ---------- Chuva de moedas (canvas) da tela de vitoria ---------- */

  function CoinRain(canvas) {
    var ctx = canvas.getContext("2d");
    var coins = [];
    var raf = 0, running = false, raining = 0;
    var dpr = Math.min(window.devicePixelRatio || 1, M().lite() ? 1 : 2);

    function resize() {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
    }
    resize();
    window.addEventListener("resize", resize);

    function add(x, y, vx, vy) {
      coins.push({ x: x, y: y, vx: vx, vy: vy, r: 9 + Math.random() * 9, spin: Math.random() * 6, vs: 0.12 + Math.random() * 0.18, life: 0 });
    }
    // rajada saindo do centro
    function burst(x, y, n) {
      n = M().particles(n);
      for (var i = 0; i < n; i++) {
        var a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.3;
        var s = 7 + Math.random() * 9;
        add(x, y, Math.cos(a) * s, Math.sin(a) * s);
      }
      start();
    }
    // chuva caindo do topo (perSec moedas por segundo)
    function rain(perSec) { raining = M().particles(perSec); start(); }
    function stopRain() { raining = 0; }

    var lastT = 0, acc = 0;
    function frame(t) {
      var dt = lastT ? Math.min(50, t - lastT) : 16;
      lastT = t;
      if (raining) {
        acc += raining * dt / 1000;
        while (acc >= 1) { acc--; add(Math.random() * window.innerWidth, -20, (Math.random() - 0.5) * 1.5, 2 + Math.random() * 3); }
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      var k = dt / 16;
      for (var i = coins.length - 1; i >= 0; i--) {
        var c = coins[i];
        c.vy += 0.32 * k; c.vx *= 0.995; c.x += c.vx * k; c.y += c.vy * k; c.spin += c.vs * k; c.life += dt;
        if (c.y > window.innerHeight + 40) { coins.splice(i, 1); continue; }
        drawCoin(c);
      }
      if (coins.length || raining) raf = requestAnimationFrame(frame);
      else { running = false; lastT = 0; }
    }
    function drawCoin(c) {
      var w = Math.abs(Math.cos(c.spin)) * c.r; // giro 3D: a moeda "afina" ao virar
      var face = Math.cos(c.spin) > 0;
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.beginPath();
      ctx.ellipse(0, 0, Math.max(1.5, w), c.r, 0, 0, Math.PI * 2);
      var g = ctx.createLinearGradient(-c.r, -c.r, c.r, c.r);
      g.addColorStop(0, face ? "#fff1a8" : "#e0a800");
      g.addColorStop(0.5, face ? "#ffcc00" : "#b88700");
      g.addColorStop(1, "#a06d00");
      ctx.fillStyle = g;
      ctx.fill();
      if (w > c.r * 0.45) {
        ctx.beginPath();
        ctx.ellipse(0, 0, w * 0.68, c.r * 0.68, 0, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(120, 70, 0, 0.55)";
        ctx.lineWidth = 1.4;
        ctx.stroke();
      }
      ctx.restore();
    }
    function start() { if (!running) { running = true; raf = requestAnimationFrame(frame); } }
    function destroy() { cancelAnimationFrame(raf); coins = []; raining = 0; window.removeEventListener("resize", resize); }

    return { burst: burst, rain: rain, stopRain: stopRain, destroy: destroy };
  }

  /* ---------- Tela de vitoria (>= 10x) ---------- */

  var celebrating = false;
  var idleQueue = [];

  // roda fn quando nao houver tela de vitoria aberta (ex.: popup de colecionavel)
  function afterCelebration(fn) {
    if (!celebrating) fn();
    else idleQueue.push(fn);
  }

  function tierFor(mult) {
    var t = 0;
    for (var i = 0; i < TIERS.length; i++) if (mult >= TIERS[i].min) t = i + 1;
    return t;
  }

  function hostCharacter() {
    var page = document.body && document.body.getAttribute("data-page");
    if (page === "bazinguinha") return { avatar: "😎", name: "O Menor Quentão" };
    var key = HOSTS[page] || "pitoco";
    var ch = BZG.collectibles && BZG.collectibles.characterByKey ? BZG.collectibles.characterByKey(key) : null;
    return ch ? { avatar: ch.avatar, name: ch.name } : { avatar: "🐣", name: "BZG Pitoco" };
  }

  function celebrate(amount, mult, onClose) {
    celebrating = true;
    var finalTier = tierFor(mult);
    var bet = amount / mult;
    var host = hostCharacter();
    var gsap = window.gsap;
    var reduced = M().reduced();

    var overlay = document.createElement("div");
    overlay.className = "bw-overlay t1" + (M().lite() ? " lite" : "");
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-live", "assertive");
    overlay.setAttribute("aria-label", TIERS[finalTier - 1].name + ": " + money(amount));
    overlay.innerHTML =
      '<div class="bw-backdrop"></div>' +
      '<div class="bw-rays"></div>' +
      '<canvas class="bw-rain"></canvas>' +
      '<div class="bw-stage">' +
        '<div class="bw-host">' +
          '<div class="bw-medal"><span class="bw-avatar">' + host.avatar + '</span></div>' +
          '<div class="bw-bubble"><strong></strong><span></span></div>' +
        '</div>' +
        '<div class="bw-title"><span class="bw-title-text">' + TIERS[0].name + '</span></div>' +
        '<div class="bw-amount">' + money(0) + '</div>' +
        '<div class="bw-mult">' + mult.toFixed(2).replace(".", ",") + 'x</div>' +
        '<div class="bw-hint">toque para pular</div>' +
      '</div>';
    document.body.appendChild(overlay);

    var stage = overlay.querySelector(".bw-stage");
    var titleEl = overlay.querySelector(".bw-title");
    var titleText = overlay.querySelector(".bw-title-text");
    var amountEl = overlay.querySelector(".bw-amount");
    var hintEl = overlay.querySelector(".bw-hint");
    var hostEl = overlay.querySelector(".bw-host");
    var bubbleName = overlay.querySelector(".bw-bubble strong");
    var bubbleLine = overlay.querySelector(".bw-bubble span");
    bubbleName.textContent = host.name;
    bubbleLine.textContent = pick(LINES[0]);

    var rain = CoinRain(overlay.querySelector(".bw-rain"));
    var tier = 1;
    var counting = true;
    var closing = false;
    var closeTimer = null;

    function setTier(t) {
      tier = t;
      var info = TIERS[t - 1];
      overlay.classList.remove("t1", "t2", "t3");
      overlay.classList.add(info.cls);
      titleText.textContent = info.name;
      bubbleLine.textContent = pick(LINES[t - 1]);
      if (BZG.sounds && BZG.sounds.tierUp) BZG.sounds.tierUp(t);
      var c = M().centerOf(amountEl);
      rain.burst(c.x, c.y, [26, 40, 60][t - 1]);
      rain.rain([10, 22, 38][t - 1]);
      if (t > 1) {
        shake(stage);
        if (gsap && !reduced) {
          gsap.fromTo(titleEl, { scale: 1.45 }, { scale: 1, duration: M().dur(0.5), ease: "back.out(2.2)" });
          gsap.fromTo(hostEl, { y: -14, rotation: -8 }, { y: 0, rotation: 0, duration: M().dur(0.6), ease: "elastic.out(1, 0.45)" });
        }
      }
    }

    // entrada
    requestAnimationFrame(function () { overlay.classList.add("show"); });
    if (BZG.sounds && BZG.sounds.whoosh) BZG.sounds.whoosh();
    if (gsap && !reduced) {
      var tl = gsap.timeline();
      tl.from(overlay.querySelector(".bw-rays"), { scale: 0.2, opacity: 0, duration: M().dur(0.7), ease: "expo.out" }, 0)
        .from(hostEl, { y: 80, scale: 0.5, opacity: 0, duration: M().dur(0.6), ease: "back.out(1.8)" }, M().dur(0.05))
        .from(titleEl, { scale: 2.2, opacity: 0, filter: "blur(8px)", duration: M().dur(0.55), ease: "expo.out" }, M().dur(0.12))
        .from(amountEl, { y: 24, opacity: 0, duration: M().dur(0.4), ease: "power3.out" }, M().dur(0.3));
    }
    setTier(1);

    /* contador em trechos, um por nivel: 0 -> 25x, 25x -> 50x, 50x -> final. Assim cada
       nivel tem o seu momento na tela (num contador continuo a Grande Vitoria sumia em
       meio segundo). Os trechos do meio aceleram e freiam; o ultimo so freia. */
    var marks = [];
    [TIERS[1].min, TIERS[2].min].forEach(function (m) { if (bet * m < amount) marks.push(bet * m); });
    marks.push(amount);
    var seg = 0, segFrom = 0, counter = null;
    var easeInOut = function (t) { return 0.5 - 0.5 * Math.cos(Math.PI * t); };
    var easeOut = function (t) { return 1 - Math.pow(1 - t, 2); };

    function onValue(v) {
      amountEl.textContent = money(v);
      var t = Math.max(1, tierFor(bet > 0 ? v / bet : 0));
      if (t > tier) setTier(t);
      if (BZG.sounds && BZG.sounds.countTick) BZG.sounds.countTick(amount ? v / amount : 1);
    }
    function runSegment() {
      var to = marks[seg];
      var last = seg === marks.length - 1;
      counter = M().countUp(segFrom, to, M().dur(TIERS[seg].secs), onValue, function () {
        segFrom = to;
        seg++;
        if (seg < marks.length) runSegment();
        else finishCount();
      }, last ? easeOut : easeInOut);
    }
    function finishCount() {
      if (!counting) return;
      counting = false;
      if (counter) counter.cancel();
      onValue(amount);
      if (tier < finalTier) setTier(finalTier);
      amountEl.classList.add("done");
      hintEl.textContent = "toque para continuar";
      if (BZG.sounds && BZG.sounds.winSettle) BZG.sounds.winSettle();
      closeTimer = setTimeout(close, Math.max(900, M().dur(2200)));
    }
    runSegment();

    function close() {
      if (closing) return;
      closing = true;
      clearTimeout(closeTimer);
      rain.stopRain();
      document.removeEventListener("keydown", onKey);
      var from = M().centerOf(amountEl);
      overlay.classList.remove("show");
      overlay.classList.add("hide");
      coinsToBalance(from, 14, onClose);
      setTimeout(function () {
        rain.destroy();
        overlay.remove();
        celebrating = false;
        var q = idleQueue; idleQueue = [];
        q.forEach(function (fn) { try { fn(); } catch (e) {} });
      }, 420);
    }

    function skipOrClose() {
      if (counting) finishCount();
      else close();
    }
    function onKey(e) {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") { e.preventDefault(); skipOrClose(); }
    }
    overlay.addEventListener("pointerdown", skipOrClose);
    document.addEventListener("keydown", onKey);
  }

  /* ---------- API principal: toda vitoria passa por aqui ---------- */

  /* opts: { amount: premio pago, mult: multiplicador (premio / aposta),
             from: elemento de onde a vitoria "sai", stage: area do jogo (flash dourado) } */
  function win(opts) {
    opts = opts || {};
    var amount = opts.amount || 0;
    var mult = opts.mult || 0;
    if (amount <= 0) return;
    var origin = M() ? M().centerOf(opts.from || opts.stage) : { x: innerWidth / 2, y: innerHeight / 2 };
    if (opts.stage) flash(opts.stage, "gold");

    // segura o contador do saldo ate as moedas chegarem (com trava de seguranca)
    var release = BZG.ui && BZG.ui.holdBalance ? BZG.ui.holdBalance() : function () {};
    var safety = setTimeout(release, 9000);
    function done() { clearTimeout(safety); release(); }

    if (!M()) { if (BZG.sounds) BZG.sounds.win(); confetti(origin.x, origin.y, 55); done(); return; }

    // sem GSAP (CDN fora do ar) a tela ainda abre, so sem a timeline de entrada e sem moedas voando
    if (tierFor(mult) >= 1 && !celebrating) {
      celebrate(amount, mult, done);
      return;
    }

    if (BZG.sounds) BZG.sounds.win();
    floatAmount(origin, amount, mult >= 3);
    if (mult >= 2) confetti(origin.x, origin.y, mult >= 5 ? 60 : 36);
    coinsToBalance(origin, mult >= 5 ? 12 : (mult >= 2 ? 8 : 5), done);
  }

  // compatibilidade: chamadas antigas de bigWin(valor, mult) viram win()
  function bigWin(amount, mult) {
    win({ amount: amount, mult: mult || 10 });
  }

  return {
    confetti: confetti,
    shake: shake,
    flash: flash,
    win: win,
    bigWin: bigWin,
    afterCelebration: afterCelebration,
    isCelebrating: function () { return celebrating; },
    TIERS: TIERS
  };
})();
