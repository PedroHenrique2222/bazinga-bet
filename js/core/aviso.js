/* Bazinga BET - aviso da primeira visita (v1.35): deixa claro, antes de tudo, que o
   site e 100% de brincadeira e que nao envolve dinheiro real. Aparece uma unica vez
   por navegador (localStorage "bzgAvisoOk"); carregado pelo theme.js so quando falta.
   Tem estilo proprio (funciona em qualquer pagina, ate no cadastro). */
(function () {
  var KEY = "bzgAvisoOk";
  var VERSION = "1";
  try { if (localStorage.getItem(KEY) === VERSION) return; } catch (e) {}
  if (document.getElementById("bzg-aviso")) return;

  var css =
    "#bzg-aviso{position:fixed;inset:0;z-index:2000;display:flex;align-items:center;justify-content:center;padding:16px;" +
      "background:rgba(4,8,14,.82);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);font-family:Inter,'Segoe UI',Arial,sans-serif}" +
    "#bzg-aviso .av-card{width:100%;max-width:460px;max-height:calc(100vh - 32px);overflow:auto;background:#1a242d;color:#fff;" +
      "border:1px solid #2b3b48;border-radius:18px;padding:26px 24px 22px;box-shadow:0 24px 60px rgba(0,0,0,.6);animation:av-in .25s ease-out}" +
    "@keyframes av-in{from{opacity:0;transform:translateY(12px) scale(.98)}to{opacity:1;transform:none}}" +
    "@media (prefers-reduced-motion:reduce){#bzg-aviso .av-card{animation:none}}" +
    "#bzg-aviso h2{margin:0 0 6px;font-size:22px;font-weight:900;line-height:1.2}" +
    "#bzg-aviso .av-sub{margin:0 0 16px;color:#b8c4ce;font-size:14.5px;line-height:1.45}" +
    "#bzg-aviso ul{list-style:none;margin:0 0 16px;padding:0;display:grid;gap:10px}" +
    "#bzg-aviso li{display:flex;gap:10px;align-items:flex-start;font-size:14.5px;line-height:1.4;background:#213040;border-radius:12px;padding:10px 12px}" +
    "#bzg-aviso li b{color:#ffcc00}" +
    "#bzg-aviso .av-i{flex:none;font-size:18px;line-height:1.2}" +
    "#bzg-aviso .av-help{margin:0 0 18px;font-size:13px;line-height:1.45;color:#b8c4ce}" +
    "#bzg-aviso .av-help a{color:#ffcc00}" +
    "#bzg-aviso .av-ok{display:block;width:100%;min-height:50px;border:0;border-radius:12px;cursor:pointer;" +
      "background:linear-gradient(145deg,#f12c4c,#b5122e);color:#fff;font:inherit;font-size:16px;font-weight:900}" +
    "#bzg-aviso .av-ok:focus-visible{outline:3px solid #ffcc00;outline-offset:3px}";

  function priv() {
    var s = document.querySelector('script[src*="js/core/theme.js"]');
    var src = s ? s.getAttribute("src") : "";
    return src.replace(/js\/core\/theme\.js.*$/, "") + "privacidade.html";
  }

  function show() {
    if (document.getElementById("bzg-aviso")) return;
    var style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);

    var box = document.createElement("div");
    box.id = "bzg-aviso";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.setAttribute("aria-labelledby", "av-title");
    box.setAttribute("aria-describedby", "av-desc");
    box.innerHTML =
      '<div class="av-card">' +
        '<h2 id="av-title">🎲 Aqui é só brincadeira</h2>' +
        '<p class="av-sub" id="av-desc">A Bazinga BET é um <b>jogo de diversão</b> que imita um cassino. <b>Não tem dinheiro real envolvido.</b></p>' +
        '<ul>' +
          '<li><span class="av-i" aria-hidden="true">🪙</span><span>As fichas <b>BZ$</b> são de mentira e <b>não valem nada</b> fora do site.</span></li>' +
          '<li><span class="av-i" aria-hidden="true">🚫</span><span>Não dá para <b>depositar, comprar, sacar</b> nem trocar fichas por prêmios.</span></li>' +
          '<li><span class="av-i" aria-hidden="true">🔐</span><span>Ninguém da Bazinga BET vai pedir <b>Pix, cartão ou senha</b>. Se alguém pedir, é golpe.</span></li>' +
          '<li><span class="av-i" aria-hidden="true">🔞</span><span>Site para <b>maiores de 18 anos</b>.</span></li>' +
        '</ul>' +
        '<p class="av-help">Se apostas de verdade estão te fazendo mal, peça ajuda: <b>CVV, ligue 188</b> (grátis, 24h). ' +
          '<a href="' + priv() + '" target="_blank" rel="noopener">Política de Privacidade</a></p>' +
        '<button type="button" class="av-ok">Entendi, quero jogar</button>' +
      '</div>';
    document.body.appendChild(box);

    var ok = box.querySelector(".av-ok");
    var prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    setTimeout(function () { ok.focus(); }, 30);
    // foco fica dentro do aviso ate confirmar
    box.addEventListener("keydown", function (e) {
      if (e.key !== "Tab") return;
      var f = box.querySelectorAll("a, button");
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    ok.addEventListener("click", function () {
      try { localStorage.setItem(KEY, VERSION); } catch (e) {}
      document.documentElement.style.overflow = prevOverflow;
      box.parentNode.removeChild(box);
      style.parentNode.removeChild(style);
    });
  }

  if (document.body) show();
  else document.addEventListener("DOMContentLoaded", show);
})();
