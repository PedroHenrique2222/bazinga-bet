/* Bazinga BET - fundo animado com particulas (brasas vermelho/dourado).
   v1.22: tres camadas de profundidade (longe = pequenas, lentas e apagadas; perto =
   maiores, mais rapidas e com brilho), leve paralaxe com o mouse, nitidez em tela
   retina e movimento independente da taxa de quadros. Aparelho fraco usa menos
   brasas; "reduzir movimento" deixa o fundo parado. */
(function () {
  function init() {
    var canvas = document.createElement("canvas");
    canvas.id = "bg-particles";
    document.body.insertBefore(canvas, document.body.firstChild);
    var ctx = canvas.getContext("2d");

    var M = window.BZG && BZG.motion;
    var lite = M ? M.lite() : false;
    var still = M ? M.reduced() : false;
    var dpr = Math.min(window.devicePixelRatio || 1, lite ? 1 : 2);
    var W = 0, H = 0;

    // [profundidade, quantidade] - profundidade 0.3 (longe) .. 1 (perto)
    var LAYERS = lite ? [[0.35, 10], [0.65, 8], [1, 4]] : [[0.35, 18], [0.65, 14], [1, 8]];
    var COLORS = [[255, 45, 58], [255, 204, 0], [255, 120, 40]];

    // brilho pre-renderizado (bem mais barato que shadowBlur a cada quadro)
    var glows = COLORS.map(function (c) {
      var g = document.createElement("canvas");
      g.width = g.height = 64;
      var gx = g.getContext("2d");
      var grad = gx.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, "rgba(" + c + ",1)");
      grad.addColorStop(0.25, "rgba(" + c + ",0.55)");
      grad.addColorStop(1, "rgba(" + c + ",0)");
      gx.fillStyle = grad;
      gx.fillRect(0, 0, 64, 64);
      return g;
    });

    var particles = [];

    function resize() {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
    }

    function spawn(p, depth, anywhere) {
      p.depth = depth;
      p.x = Math.random() * W;
      p.y = anywhere ? Math.random() * H : H + 10 + Math.random() * 60;
      p.r = (1 + Math.random() * 1.6) * (0.6 + depth);
      p.speed = (14 + Math.random() * 26) * (0.35 + depth);   // px/s
      p.drift = (Math.random() - 0.5) * 12;
      p.sway = Math.random() * Math.PI * 2;
      p.color = Math.floor(Math.random() * COLORS.length);
      p.alpha = (0.18 + Math.random() * 0.3) * (0.45 + depth * 0.55);
      p.flicker = Math.random() * Math.PI * 2;
      return p;
    }

    resize();
    LAYERS.forEach(function (layer) {
      for (var i = 0; i < layer[1]; i++) particles.push(spawn({}, layer[0], true));
    });

    // paralaxe: as brasas de perto se mexem mais que as de longe
    var mx = 0, my = 0, px = 0, py = 0;
    if (!still && window.matchMedia && window.matchMedia("(pointer: fine)").matches) {
      window.addEventListener("pointermove", function (e) {
        mx = (e.clientX / W - 0.5) * 2;
        my = (e.clientY / H - 0.5) * 2;
      }, { passive: true });
    }

    function draw() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        var a = p.alpha * (0.6 + 0.4 * Math.sin(p.flicker));
        var x = p.x + Math.sin(p.sway) * 6 + px * 18 * p.depth;
        var y = p.y + py * 12 * p.depth;
        var s = p.r * 6;
        ctx.globalAlpha = a;
        ctx.drawImage(glows[p.color], x - s / 2, y - s / 2, s, s);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    }

    var last = 0;
    function frame(t) {
      var dt = last ? Math.min(0.05, (t - last) / 1000) : 0.016;
      last = t;
      px += (mx - px) * 0.04;
      py += (my - py) * 0.04;
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.y -= p.speed * dt;
        p.x += p.drift * dt;
        p.sway += dt * 0.8;
        p.flicker += dt * 3;
        if (p.y < -30) spawn(p, p.depth, false);
      }
      draw();
      requestAnimationFrame(frame);
    }

    window.addEventListener("resize", function () { resize(); if (still) draw(); });
    if (still) draw();
    else requestAnimationFrame(frame);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
