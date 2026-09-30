/* Bazinga BET - kit de animacao compartilhado (v1.21).
   - Carrega o GSAP em segundo plano (CDN). Se o CDN falhar, o site continua
     funcionando: quem usa o kit cai num caminho simples (sem timeline).
   - speed(): multiplicador de duracao (Turbo encurta, "reduzir movimento" zera).
   - lite(): aparelho fraco/celular -> menos particulas, sem blur.
   - countUp(): contador numerico suave (usado no saldo e na tela de vitoria).
   Todas as duracoes do site devem passar por dur() pra respeitar Turbo e
   prefers-reduced-motion num lugar so. */
window.BZG = window.BZG || {};

BZG.motion = (function () {
  var GSAP_SRC = "https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js";
  var waiting = [];

  function gsapReady() { return !!window.gsap; }

  (function loadGsap() {
    if (window.gsap) return;
    var s = document.createElement("script");
    s.src = GSAP_SRC;
    s.async = true;
    s.onload = function () {
      var q = waiting; waiting = [];
      q.forEach(function (fn) { try { fn(window.gsap); } catch (e) {} });
    };
    s.onerror = function () { waiting = []; };
    document.head.appendChild(s);
  })();

  // roda fn(gsap) quando o GSAP estiver pronto (na hora, se ja estiver)
  function withGsap(fn) {
    if (window.gsap) fn(window.gsap);
    else waiting.push(fn);
  }

  var reducedQuery = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
  function reduced() { return !!(reducedQuery && reducedQuery.matches); }

  // Turbo (Passe de Batalha) encurta tudo; reduzir movimento praticamente zera
  function speed() {
    if (reduced()) return 0.01;
    return BZG.modes && BZG.modes.speed ? BZG.modes.speed() : 1;
  }

  function dur(seconds) { return seconds * speed(); }

  // aparelho "leve": poucos nucleos/memoria ou celular pequeno -> efeitos economicos
  var liteCache = null;
  function lite() {
    if (liteCache !== null) return liteCache;
    var cores = navigator.hardwareConcurrency || 8;
    var mem = navigator.deviceMemory || 8;
    var coarse = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
    liteCache = cores <= 4 || mem <= 4 || (coarse && Math.min(screen.width, screen.height) < 500);
    return liteCache;
  }

  // escala uma contagem de particulas pro aparelho (minimo 1)
  function particles(n) {
    if (reduced()) return 0;
    return Math.max(1, Math.round(lite() ? n * 0.5 : n));
  }

  /* contador numerico: chama onUpdate(valor) a cada frame e onDone() no fim.
     Devolve um controle { finish(), cancel() } pra pular direto ao final. */
  function countUp(from, to, seconds, onUpdate, onDone, ease) {
    var start = null, raf = 0, done = false;
    var total = Math.max(0, seconds) * 1000;
    var easeFn = ease || function (t) { return 1 - Math.pow(1 - t, 3); }; // easeOutCubic

    function finish() {
      if (done) return;
      done = true;
      cancelAnimationFrame(raf);
      onUpdate(to);
      if (onDone) onDone();
    }
    function frame(ts) {
      if (done) return;
      if (start === null) start = ts;
      var t = total ? Math.min(1, (ts - start) / total) : 1;
      onUpdate(from + (to - from) * easeFn(t));
      if (t >= 1) finish();
      else raf = requestAnimationFrame(frame);
    }
    if (total <= 16) finish();
    else raf = requestAnimationFrame(frame);

    return {
      finish: finish,
      cancel: function () { done = true; cancelAnimationFrame(raf); },
      isDone: function () { return done; }
    };
  }

  // centro de um elemento na tela (ou do meio da tela, se nao houver elemento)
  function centerOf(el) {
    if (!el || !el.getBoundingClientRect) return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    var r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  return {
    gsapReady: gsapReady,
    withGsap: withGsap,
    reduced: reduced,
    speed: speed,
    dur: dur,
    lite: lite,
    particles: particles,
    countUp: countUp,
    centerOf: centerOf
  };
})();
