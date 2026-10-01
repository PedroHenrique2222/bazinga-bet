/* Bazinga BET - janela de chat ao vivo (v1.34): botao flutuante + painel com
   as abas "Global" (site todo) e "Mesa" (so nos jogos ao vivo: Canoa, Double, Roleta).
   Usa BZG.live.chat (Supabase). O jogo liga a aba da mesa com BZG.chat.setTable("double")
   e desliga com BZG.chat.setTable(null) (ex.: quando o jogador troca para o modo Solo). */
window.BZG = window.BZG || {};

BZG.chat = (function () {
  var MAX_LEN = 200;
  var COOLDOWN_MS = 2000;
  var TABLE_NAMES = { crash: "Canoa", double: "Double", roulette: "Roleta" };

  // palavroes mais pesados viram *** (o resto da frase continua)
  var BAD = ["porra", "caralho", "buceta", "boceta", "puta", "puto", "putaria", "fdp", "merda", "arrombad[oa]",
    "viad[oa]", "vadia", "piranha", "cacete", "cuzao", "cuzão", "babaca", "corno", "otari[oa]", "desgraçad[oa]",
    "desgracad[oa]", "vagabund[oa]", "foder", "fuder", "fodase", "foda-se", "pqp", "vsf", "tnc", "krl", "crl"];
  var BAD_RE = new RegExp("(^|[^\\wÀ-ú])(" + BAD.join("|") + ")(?=$|[^\\wÀ-ú])", "gi");

  function clean(text) {
    return String(text || "")
      .replace(/\s+/g, " ").trim().slice(0, MAX_LEN)
      .replace(/\b(?:https?:\/\/|www\.)\S+/gi, "[link]")
      .replace(BAD_RE, function (m, pre, word) { return pre + new Array(word.length + 1).join("*"); });
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (m) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m];
    });
  }

  var root = null, fab = null, badge = null, panel = null, listEl = null, inputEl = null,
      sendBtn = null, tabMesa = null, tabGlobal = null, statusEl = null, onlineEl = null;
  var rooms = {};          // nome -> { conn, msgs: [], unread, loaded, failed }
  var current = "global";
  var tableRoom = null;    // "crash" | "double" | "roulette" | null
  var lastSend = 0;
  var isOpen = false;

  function roomState(name) {
    if (!rooms[name]) rooms[name] = { conn: null, msgs: [], unread: 0, loaded: false, failed: false };
    return rooms[name];
  }

  function connect(name) {
    var st = roomState(name);
    if (st.conn || !BZG.live) return;
    st.conn = BZG.live.chat(name, function (row) {
      if (st.msgs.some(function (m) { return m.id === row.id; })) return;
      st.msgs.push(row);
      if (st.msgs.length > 100) st.msgs.shift();
      if (!(isOpen && current === name) && row.user_id !== BZG.live.myId()) st.unread++;
      if (current === name) renderList(true);
      syncBadges();
    }, function (rows) {
      st.loaded = true;
      if (rows === null) st.failed = true;
      else {
        var seen = {};
        st.msgs.forEach(function (m) { seen[m.id] = true; });
        st.msgs = rows.filter(function (r) { return !seen[r.id]; }).concat(st.msgs);
      }
      if (current === name) renderList(false);
    });
  }

  function timeOf(iso) {
    var d = new Date(iso);
    if (isNaN(d)) return "";
    return ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2);
  }

  function msgHTML(m) {
    var mine = BZG.live && m.user_id && m.user_id === BZG.live.myId();
    var color = BZG.ui.safeColorClass(m.name_color);
    if (color) color = " " + color;
    var av = BZG.ui && BZG.ui.avatarHTML ? BZG.ui.avatarHTML(m.avatar || "😎") : esc(m.avatar || "😎");
    return '<div class="chat-msg' + (mine ? " is-me" : "") + '">' +
      '<span class="chat-av" aria-hidden="true">' + av + '</span>' +
      '<div class="chat-bubble">' +
        '<div class="chat-meta"><span class="bzg-name' + color + '">' + esc(m.nickname) + '</span>' +
        '<time>' + timeOf(m.created_at) + '</time></div>' +
        '<div class="chat-text">' + esc(clean(m.body)) + '</div>' +
      '</div></div>';
  }

  function renderList(keepBottom) {
    if (!listEl) return;
    var st = roomState(current);
    var nearBottom = listEl.scrollHeight - listEl.scrollTop - listEl.clientHeight < 80;
    if (!st.loaded) listEl.innerHTML = '<p class="chat-empty">Carregando…</p>';
    else if (st.failed && !st.msgs.length) listEl.innerHTML = '<p class="chat-empty">Chat indisponível agora. Verifique sua internet.</p>';
    else if (!st.msgs.length) listEl.innerHTML = '<p class="chat-empty">Ninguém falou nada ainda. Diga oi! 👋</p>';
    else listEl.innerHTML = st.msgs.map(msgHTML).join("");
    if (!keepBottom || nearBottom) listEl.scrollTop = listEl.scrollHeight;
  }

  function syncBadges() {
    var total = 0;
    Object.keys(rooms).forEach(function (k) { total += rooms[k].unread; });
    if (badge) {
      badge.textContent = total > 99 ? "99+" : String(total);
      badge.hidden = total === 0;
    }
    if (tabGlobal) tabGlobal.querySelector(".chat-tab-n").textContent = rooms.global && rooms.global.unread ? rooms.global.unread : "";
    if (tabMesa && tableRoom) tabMesa.querySelector(".chat-tab-n").textContent = rooms[tableRoom] && rooms[tableRoom].unread ? rooms[tableRoom].unread : "";
  }

  function selectRoom(name) {
    current = name;
    connect(name);
    roomState(name).unread = 0;
    tabGlobal.setAttribute("aria-selected", name === "global" ? "true" : "false");
    tabMesa.setAttribute("aria-selected", name !== "global" ? "true" : "false");
    inputEl.placeholder = name === "global" ? "Mensagem para todos…" : "Mensagem para a mesa…";
    statusEl.textContent = "";
    renderList(false);
    syncBadges();
  }

  function open() {
    if (!root) return;
    isOpen = true;
    panel.hidden = false;
    fab.setAttribute("aria-expanded", "true");
    root.classList.add("is-open");
    selectRoom(current !== "global" && !tableRoom ? "global" : current);
    setTimeout(function () { inputEl.focus(); }, 30);
    if (BZG.sounds && BZG.sounds.modalOpen) BZG.sounds.modalOpen();
  }

  function close(restoreFocus) {
    if (!root || !isOpen) return;
    isOpen = false;
    panel.hidden = true;
    fab.setAttribute("aria-expanded", "false");
    root.classList.remove("is-open");
    if (restoreFocus) fab.focus();
  }

  function send() {
    var text = clean(inputEl.value);
    if (!text) return;
    var wait = COOLDOWN_MS - (Date.now() - lastSend);
    if (wait > 0) { statusEl.textContent = "Calma! Espere " + Math.ceil(wait / 1000) + "s."; return; }
    var st = roomState(current);
    if (!st.conn) connect(current);
    lastSend = Date.now();
    sendBtn.disabled = true;
    statusEl.textContent = "";
    st.conn.send(text).then(function () {
      inputEl.value = "";
      syncCounter();
      if (BZG.sounds && BZG.sounds.click) BZG.sounds.click();
    }).catch(function (e) {
      statusEl.textContent = e.message || "Não deu para enviar.";
    }).then(function () {
      sendBtn.disabled = false;
      inputEl.focus();
    });
  }

  function syncCounter() {
    var left = MAX_LEN - inputEl.value.length;
    root.querySelector(".chat-count").textContent = left < 40 ? String(left) : "";
  }

  function setOnline(n) {
    if (onlineEl) onlineEl.textContent = n > 0 ? n + " online" : "";
  }

  function mount() {
    if (root || !document.body) return;
    root = document.createElement("div");
    root.className = "chat-root";
    root.innerHTML =
      '<button type="button" class="chat-fab" aria-expanded="false" aria-controls="chat-panel" aria-label="Abrir chat">' +
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4h0A2.5 2.5 0 0 1 3 13.5z"/></svg>' +
        '<span class="chat-badge" hidden>0</span>' +
      '</button>' +
      '<section class="chat-panel" id="chat-panel" role="dialog" aria-label="Chat ao vivo" hidden>' +
        '<header class="chat-head">' +
          '<div class="chat-title"><span class="online-dot"></span> Chat <small class="chat-online"></small></div>' +
          '<button type="button" class="chat-close" aria-label="Fechar chat">' +
            '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>' +
        '</header>' +
        '<div class="chat-tabs" role="tablist">' +
          '<button type="button" role="tab" class="chat-tab" data-room="global" aria-selected="true">🌎 Global <b class="chat-tab-n"></b></button>' +
          '<button type="button" role="tab" class="chat-tab" data-room="mesa" aria-selected="false" hidden>🎲 Mesa <b class="chat-tab-n"></b></button>' +
        '</div>' +
        '<div class="chat-list" role="log" aria-live="polite"></div>' +
        '<form class="chat-form">' +
          '<input type="text" class="chat-input" maxlength="' + MAX_LEN + '" autocomplete="off" aria-label="Sua mensagem" />' +
          '<span class="chat-count" aria-hidden="true"></span>' +
          '<button type="submit" class="chat-send" aria-label="Enviar">' +
            '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11.5L21 3l-6.5 18-3-7.5z"/></svg></button>' +
        '</form>' +
        '<p class="chat-status" role="status"></p>' +
        '<p class="chat-rules">Seja legal: sem ofensas, sem dados pessoais. Palavrões viram ***.</p>' +
      '</section>';
    document.body.appendChild(root);

    fab = root.querySelector(".chat-fab");
    badge = root.querySelector(".chat-badge");
    panel = root.querySelector(".chat-panel");
    listEl = root.querySelector(".chat-list");
    inputEl = root.querySelector(".chat-input");
    sendBtn = root.querySelector(".chat-send");
    statusEl = root.querySelector(".chat-status");
    onlineEl = root.querySelector(".chat-online");
    tabGlobal = root.querySelector('[data-room="global"]');
    tabMesa = root.querySelector('[data-room="mesa"]');

    fab.addEventListener("click", function () { if (isOpen) close(true); else open(); });
    root.querySelector(".chat-close").addEventListener("click", function () { close(true); });
    tabGlobal.addEventListener("click", function () { selectRoom("global"); });
    tabMesa.addEventListener("click", function () { if (tableRoom) selectRoom(tableRoom); });
    root.querySelector(".chat-form").addEventListener("submit", function (e) { e.preventDefault(); send(); });
    inputEl.addEventListener("input", syncCounter);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && isOpen) close(true);
    });
    document.addEventListener("bzg:live-online", function (e) { setOnline(e.detail.total); });
    if (BZG.live) setOnline(BZG.live.online().total);

    if (BZG._chatTable !== undefined) tableRoom = BZG._chatTable;
    if (tableRoom) setTable(tableRoom);
  }

  // liga/desliga a aba da mesa (o jogo chama ao entrar/sair do modo Ao Vivo)
  function setTable(name) {
    tableRoom = TABLE_NAMES[name] ? name : null;
    if (!root) return;
    tabMesa.hidden = !tableRoom;
    if (tableRoom) {
      tabMesa.firstChild.nodeValue = "🎲 Mesa " + TABLE_NAMES[tableRoom] + " ";
      connect(tableRoom); // ja escuta para mostrar mensagens novas no contador
      if (!isOpen) current = tableRoom; // no jogo ao vivo o chat abre na mesa
      if (isOpen && current === "global") syncBadges();
    } else if (current !== "global" && panel) {
      selectRoom("global");
    }
    syncBadges();
  }

  return { mount: mount, open: open, close: close, setTable: setTable, clean: clean };
})();
