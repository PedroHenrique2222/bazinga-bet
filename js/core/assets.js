/* Bazinga BET - imagens opcionais (geradas pelo Codex) com plano B.
   BZG.assets.preload(lista, pronto) tenta carregar cada imagem UMA vez e chama
   pronto(ok), onde ok[caminho] = true se a imagem existe e carregou. O jogo comeca
   com os desenhos SVG de sempre e, quando as imagens carregam, troca por elas -
   assim nada quebra enquanto as imagens ainda nao existem no servidor. */
window.BZG = window.BZG || {};

BZG.assets = (function () {
  var cache = {}; // caminho -> true (carregou) | false (falhou) | array de callbacks (carregando)

  function loadOne(path, cb) {
    var c = cache[path];
    if (c === true || c === false) { cb(c); return; }
    if (Array.isArray(c)) { c.push(cb); return; }
    cache[path] = [cb];
    var img = new Image();
    img.decoding = "async";
    function settle(ok) {
      var cbs = cache[path];
      cache[path] = ok;
      cbs.forEach(function (f) { f(ok); });
    }
    img.onload = function () { settle(img.naturalWidth > 0); };
    img.onerror = function () { settle(false); };
    img.src = path;
  }

  function preload(paths, done) {
    var ok = {};
    var left = paths.length;
    if (!left) { done(ok); return; }
    paths.forEach(function (p) {
      loadOne(p, function (res) {
        ok[p] = res;
        if (--left === 0) done(ok);
      });
    });
  }

  function has(path) { return cache[path] === true; }

  return { preload: preload, has: has };
})();
