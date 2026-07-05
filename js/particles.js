/* Bazinga BET - fundo animado com particulas (brasas vermelho/dourado) */
(function () {
  function init() {
    var canvas = document.createElement("canvas");
    canvas.id = "bg-particles";
    document.body.insertBefore(canvas, document.body.firstChild);
    var ctx = canvas.getContext("2d");

    var particles = [];
    var COLORS = ["rgba(255,45,58,", "rgba(255,204,0,"];
    var COUNT = 34;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    function makeParticle() {
      return {
        x: Math.random() * canvas.width,
        y: canvas.height + Math.random() * 100,
        r: 1 + Math.random() * 2.6,
        speed: 0.25 + Math.random() * 0.6,
        drift: (Math.random() - 0.5) * 0.4,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        alpha: 0.15 + Math.random() * 0.35,
        flicker: Math.random() * Math.PI * 2
      };
    }

    function reset(p) {
      p.x = Math.random() * canvas.width;
      p.y = canvas.height + Math.random() * 40;
      p.r = 1 + Math.random() * 2.6;
      p.speed = 0.25 + Math.random() * 0.6;
      p.drift = (Math.random() - 0.5) * 0.4;
      p.alpha = 0.15 + Math.random() * 0.35;
    }

    for (var i = 0; i < COUNT; i++) particles.push(makeParticle());

    function frame() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.y -= p.speed;
        p.x += p.drift;
        p.flicker += 0.05;
        var a = p.alpha * (0.6 + 0.4 * Math.sin(p.flicker));

        ctx.beginPath();
        ctx.fillStyle = p.color + a.toFixed(2) + ")";
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();

        if (p.y < -20) reset(p);
      }
      requestAnimationFrame(frame);
    }

    window.addEventListener("resize", resize);
    resize();
    requestAnimationFrame(frame);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
