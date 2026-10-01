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

  /* opts.iconHTML (opcional): HTML de um icone/imagem antes do texto */
  function toast(message, type, opts) {
    var container = document.getElementById("toast-container");
    if (!container) return;
    // som da notificacao, so se o jogo nao tiver tocado nada junto (sem empilhar sons)
    if (BZG.sounds && BZG.sounds.ifQuiet && BZG.sounds.toast) {
      BZG.sounds.ifQuiet(function () { BZG.sounds.toast(type || "info"); }, 40, 200);
    }
    var el = document.createElement("div");
    el.className = "toast toast--" + (type || "info");
    if (opts && opts.iconHTML) {
      el.className += " toast--with-icon";
      var ic = document.createElement("span");
      ic.className = "toast-icon";
      ic.innerHTML = opts.iconHTML;
      var tx = document.createElement("span");
      tx.textContent = message;
      el.appendChild(ic);
      el.appendChild(tx);
    } else {
      el.textContent = message;
    }
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
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // classe da cor do nome vinda de OUTROS jogadores (ranking, chat, mesas ao vivo):
  // so aceita nomes simples (ex.: "gold", "rainbow"). Qualquer outra coisa vira "" -
  // impede que alguem injete codigo ou classes no HTML de quem esta olhando (v1.35).
  function safeColorClass(c) {
    c = String(c == null ? "" : c);
    return c && c !== "default" && /^[a-z0-9-]{1,24}$/.test(c) ? "color-" + c : "";
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

  /* ---------- Imagens opcionais (geradas pelo Codex) com plano B ----------
     Enquanto a imagem nao existe, o onerror troca a <img> pelo emoji antigo (ou
     some com ela) e guarda o caminho como "falhou" para nao pedir de novo. */
  var ROOT = /\/(games|minigames)\//.test(location.pathname) ? "../" : "";
  var failedImgs = {};
  var loadedImgs = {};

  // true se a imagem ja carregou nesta pagina (para ja desenhar o visual "com imagem")
  function imgLoaded(src) { return loadedImgs[src] === true; }

  function assetPath(rel) { return ROOT + rel; }

  // chamado pelo onerror das imagens criadas por imgHTML
  function imgFail(img) {
    failedImgs[img.getAttribute("src")] = true;
    var parent = img.parentNode;
    if (!parent) return;
    var emoji = img.getAttribute("data-emoji");
    if (emoji) {
      var s = document.createElement("span");
      s.className = img.getAttribute("data-fallback-class") || "";
      s.textContent = emoji;
      var label = img.getAttribute("data-label");
      if (label) { s.setAttribute("role", "img"); s.setAttribute("aria-label", label); }
      parent.replaceChild(s, img);
    } else {
      parent.removeChild(img);
    }
    if (parent.classList) parent.classList.add("bzg-img-missing");
  }

  // chamado pelo onload: marca o pai, para o CSS ligar o visual "com imagem"
  function imgLoad(img) {
    loadedImgs[img.getAttribute("src")] = true;
    var cls = img.getAttribute("data-onload-class");
    var target = img.closest ? img.closest("[data-img-host]") || img.parentNode : img.parentNode;
    if (cls && target && target.classList) target.classList.add(cls);
  }

  /* <img> com plano B. opts: cls, alt, emoji (fallback), fallbackCls, label
     (texto para leitores de tela quando a imagem e o unico conteudo), size (px),
     onloadCls (classe adicionada ao pai/[data-img-host] quando carregar), lazy */
  function imgHTML(src, opts) {
    opts = opts || {};
    if (failedImgs[src]) {
      if (!opts.emoji) return "";
      var lab = opts.label ? ' role="img" aria-label="' + escapeHtml(opts.label) + '"' : "";
      return '<span class="' + escapeHtml(opts.fallbackCls || "") + '"' + lab + '>' + escapeHtml(opts.emoji) + '</span>';
    }
    var alt = opts.label || opts.alt || "";
    var size = opts.size ? ' width="' + opts.size + '" height="' + opts.size + '"' : "";
    return '<img class="' + escapeHtml(opts.cls || "") + '" src="' + escapeHtml(src) + '" alt="' + escapeHtml(alt) + '"' + size +
      (opts.lazy === false ? "" : ' loading="lazy"') + ' decoding="async"' +
      (opts.emoji ? ' data-emoji="' + escapeHtml(opts.emoji) + '"' : "") +
      (opts.fallbackCls ? ' data-fallback-class="' + escapeHtml(opts.fallbackCls) + '"' : "") +
      (opts.label ? ' data-label="' + escapeHtml(opts.label) + '"' : "") +
      (opts.onloadCls ? ' data-onload-class="' + escapeHtml(opts.onloadCls) + '" onload="BZG.ui.imgLoad(this)"' : "") +
      ' onerror="BZG.ui.imgFail(this)">';
  }

  /* avatares dos personagens: o perfil/ranking continua salvando o EMOJI;
     so a exibicao troca pela imagem assets/avatares/<key>.webp */
  var AVATAR_FILES = {
    "🎃": { key: "abobora", name: "BZG Abóbora" },
    "🍰": { key: "panetone", name: "BZG Panetone" },
    "🛶": { key: "canoa", name: "BZG Canoa Furada" },
    "🪖": { key: "seis16", name: "BZG 616" },
    "🥒": { key: "pikles", name: "BZG Pikles Gamer" },
    "🔋": { key: "pilha", name: "BZG Pilha Avulsa" },
    "🗑": { key: "linden", name: "BZG Linden" },
    "🍑": { key: "bogao", name: "BZG Bogão" },
    "🐣": { key: "pitoco", name: "BZG Pitoco" },
    "🏳‍🌈": { key: "dhani", name: "Dhani" },
    "🌑": { key: "shadow", name: "Shadow" },
    "🎮": { key: "cbpb", name: "CBPB_Gamer" },
    "👽": { key: "alienjo", name: "Alien Jo" }
  };

  // ignora o seletor de variacao (U+FE0F), que as vezes vem e as vezes nao
  function avatarInfo(emoji) {
    return AVATAR_FILES[String(emoji || "").replace(/️/g, "")] || null;
  }

  /* HTML do avatar: imagem redonda se for personagem, senao o proprio emoji.
     size em px (opcional; sem ele a imagem acompanha o font-size, 1.25em).
     opts.label: true (usa o nome do personagem) ou texto, para leitor de tela
     quando o avatar e o unico conteudo */
  function avatarHTML(emoji, size, opts) {
    opts = opts || {};
    var info = avatarInfo(emoji);
    if (!info) {
      var lab = typeof opts.label === "string" ? ' role="img" aria-label="' + escapeHtml(opts.label) + '"' : "";
      return '<span class="bzg-avatar-emoji"' + lab + '>' + escapeHtml(emoji || "") + '</span>';
    }
    var html = imgHTML(assetPath("assets/avatares/" + info.key + ".webp"), {
      cls: "bzg-avatar-img",
      emoji: emoji,
      fallbackCls: "bzg-avatar-emoji",
      label: opts.label ? info.name : "",
      lazy: opts.lazy
    });
    if (size && html.indexOf("<img") === 0) html = html.replace("<img ", '<img style="width:' + size + "px;height:" + size + 'px" ');
    return html;
  }

  /* icone da conquista: medalha assets/conquistas/<id>.webp ou o emoji */
  function achievementIconHTML(a) {
    return imgHTML(assetPath("assets/conquistas/" + a.id + ".webp"), {
      cls: "bzg-achv-img", emoji: a.icon, fallbackCls: "bzg-achv-emoji"
    });
  }

  return {
    safeColorClass: safeColorClass,
    imgHTML: imgHTML,
    imgFail: imgFail,
    imgLoad: imgLoad,
    imgLoaded: imgLoaded,
    assetPath: assetPath,
    avatarInfo: avatarInfo,
    avatarHTML: avatarHTML,
    achievementIconHTML: achievementIconHTML,
    formatChips: formatChips,
    formatMoney: formatMoney,
    refreshBalance: refreshBalance,
    toast: toast,
    initHeader: initHeader,
    nameHTML: nameHTML,
    escapeHtml: escapeHtml
  };
})();
