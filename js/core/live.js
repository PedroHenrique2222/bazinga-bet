/* Bazinga BET - modo AO VIVO (v1.34): jogadores de verdade ao mesmo tempo.
   Tudo gratis pelo Supabase que o site ja usa (o mesmo do ranking):
   - Relogio: a funcao server_now() do banco acerta o relogio de todo mundo. As rodadas
     de Canoa, Double e Roleta seguem esse relogio e o resultado sai de uma conta fixa
     (hash do numero da rodada) - assim todo aparelho ve a MESMA rodada sem servidor proprio.
   - Online: "presence" do Supabase Realtime conta quem esta com o site aberto.
   - Mesa: outro canal de presence por jogo carrega a aposta de cada jogador na rodada.
   - Chat: tabela chat_messages (ultimas 100 por sala, anti-spam no banco) + aviso em tempo real.
   Sem internet ou sem Supabase: as rodadas seguem o relogio do aparelho e o resto some. */
window.BZG = window.BZG || {};

BZG.live = (function () {
  var SDK_URL = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
  var ROOT = (function () {
    var s = document.currentScript && document.currentScript.src;
    return s ? s.replace(/js\/core\/live\.js.*$/, "") : "";
  })();

  /* ---------- sorteio fixo por rodada ---------- */

  // hash de texto -> inteiro de 32 bits (xmur3)
  function hash(str) {
    var h = 1779033703 ^ str.length;
    for (var i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  }

  // gerador de numeros a partir de uma semente (mulberry32): mesma semente, mesma sequencia
  function rng(seed) {
    var a = typeof seed === "string" ? hash(seed) : seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // roda fn com Math.random trocado por um sorteio fixo (bots iguais pra todo mundo)
  function withSeed(seed, fn) {
    var orig = Math.random;
    Math.random = rng(seed);
    try { return fn(); } finally { Math.random = orig; }
  }

  /* ---------- relogio do servidor ---------- */

  var offset = 0;      // hora do servidor - hora do aparelho (ms)
  var clockOk = false;

  function now() { return Date.now() + offset; }

  function syncClock(c) {
    var t0 = Date.now();
    return c.rpc("server_now").then(function (r) {
      if (r.error || typeof r.data !== "number") return;
      var t1 = Date.now();
      if (t1 - t0 > 4000) return; // resposta lenta demais: nao confia
      offset = Math.round(r.data - (t0 + t1) / 2);
      clockOk = true;
      emit("bzg:live-clock", { offset: offset });
    }).catch(function () {});
  }

  /* ---------- conexao ---------- */

  var readyCbs = [];
  var client = null;
  var userId = null;
  var started = false;
  var failed = false;

  function loadScript(src, done) {
    var s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = function () { done(true); };
    s.onerror = function () { done(false); };
    document.head.appendChild(s);
  }

  function emit(name, detail) {
    document.dispatchEvent(new CustomEvent(name, { detail: detail }));
  }

  // garante SDK + leaderboard.js (cliente e login anonimo) e chama cb(client) - ou cb(null)
  function ready(cb) {
    if (client) { cb(client); return; }
    if (failed) { cb(null); return; }
    readyCbs.push(cb);
    if (started) return;
    started = true;

    function fail() {
      failed = true;
      var cbs = readyCbs; readyCbs = [];
      cbs.forEach(function (f) { f(null); });
    }
    function afterLb() {
      if (!BZG.leaderboard || !BZG.leaderboard.isConfigured()) { fail(); return; }
      var c = BZG.leaderboard.getClient();
      if (!c) { fail(); return; }
      BZG.leaderboard.ensureSession().then(function (user) {
        userId = user ? user.id : null;
        client = c;
        syncClock(c);
        setInterval(function () { syncClock(c); }, 120000);
        var cbs = readyCbs; readyCbs = [];
        cbs.forEach(function (f) { f(c); });
      }).catch(fail);
    }
    function afterSdk() {
      if (!window.supabase || !window.supabase.createClient) { fail(); return; }
      if (BZG.leaderboard) afterLb();
      else loadScript(ROOT + "js/core/leaderboard.js", afterLb);
    }
    if (window.supabase && window.supabase.createClient) afterSdk();
    else loadScript(SDK_URL, afterSdk);
  }

  function me() {
    var prof = BZG.storage.getProfile();
    var cos = BZG.storage.getCosmetics ? BZG.storage.getCosmetics() : {};
    return {
      nick: String(prof.nickname || "Jogador").slice(0, 24),
      avatar: prof.avatar || "😎",
      color: cos.nameColor || "default"
    };
  }

  // id deste aparelho na presence: o do login anonimo (ou um aleatorio da aba)
  var tabKey = "t" + Math.random().toString(36).slice(2, 10);
  function presenceKey() { return userId || tabKey; }

  /* ---------- quem esta online (site todo) ---------- */

  var online = { total: 0, pages: {} };
  var onlineChannel = null;

  function startOnline() {
    if (onlineChannel || !BZG.storage.hasAccount || !BZG.storage.hasAccount()) return;
    ready(function (c) {
      if (!c || onlineChannel) return;
      var page = document.body.getAttribute("data-page") || "";
      onlineChannel = c.channel("bzg-online", { config: { presence: { key: presenceKey() } } });
      onlineChannel.on("presence", { event: "sync" }, function () {
        var state = onlineChannel.presenceState();
        var pages = {};
        var keys = Object.keys(state);
        keys.forEach(function (k) {
          var p = (state[k][0] || {}).page || "";
          pages[p] = (pages[p] || 0) + 1;
        });
        online = { total: keys.length, pages: pages };
        emit("bzg:live-online", online);
      });
      onlineChannel.subscribe(function (status) {
        if (status === "SUBSCRIBED") onlineChannel.track({ page: page, nick: me().nick });
      });
    });
  }

  /* ---------- mesa ao vivo (apostas de cada jogador na rodada) ---------- */

  // table("double", onSync) -> { update(estado), leave(), list(), count() }
  function table(game, onSync) {
    var ch = null;
    var mine = null;   // ultimo estado enviado
    var list = [];     // outros jogadores na mesa: [{ key, nick, avatar, color, ...estado }]
    var count = 0;
    var closed = false;

    function push() {
      if (!ch || !mine) return;
      ch.track(Object.assign({}, me(), mine));
    }

    ready(function (c) {
      if (!c || closed) return;
      ch = c.channel("bzg-mesa-" + game, { config: { presence: { key: presenceKey() } } });
      ch.on("presence", { event: "sync" }, function () {
        var state = ch.presenceState();
        var keys = Object.keys(state);
        count = keys.length;
        list = [];
        keys.forEach(function (k) {
          if (k === presenceKey()) return;
          var p = state[k][0];
          if (p) list.push(Object.assign({ key: k }, p));
        });
        if (onSync) onSync(list, count);
      });
      ch.subscribe(function (status) {
        if (status === "SUBSCRIBED") { if (!mine) mine = {}; push(); }
      });
    });

    return {
      update: function (state) { mine = state || {}; push(); },
      leave: function () {
        closed = true;
        if (ch) { try { ch.untrack(); client.removeChannel(ch); } catch (e) {} }
        ch = null; list = []; count = 0;
        if (onSync) onSync(list, count);
      },
      list: function () { return list; },
      count: function () { return count; }
    };
  }

  /* ---------- chat ---------- */

  var ROOMS = ["global", "crash", "double", "roulette"];
  // mensagens de teste que ficaram no banco na criacao do chat: nunca aparecem
  function isTestRow(row) { return /^00000000-0000-0000-0000-0000000000\d\d$/.test(row.user_id || ""); }

  // chat("global", onMessage(row), onHistory(rows)) -> { send(texto) -> Promise, close() }
  function chat(room, onMessage, onHistory) {
    var ch = null;
    var closed = false;
    if (ROOMS.indexOf(room) === -1) room = "global";

    ready(function (c) {
      if (!c || closed) { if (onHistory) onHistory(null); return; }
      c.from("chat_messages")
        .select("id,room,user_id,nickname,avatar,name_color,body,created_at")
        .eq("room", room).order("id", { ascending: false }).limit(50)
        .then(function (r) {
          if (closed) return;
          var rows = r.error ? null : (r.data || []).filter(function (x) { return !isTestRow(x); }).reverse();
          if (onHistory) onHistory(rows);
        });
      ch = c.channel("bzg-chat-" + room)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages", filter: "room=eq." + room },
          function (payload) { if (payload.new && !isTestRow(payload.new)) onMessage(payload.new); })
        .subscribe();
    });

    return {
      send: function (body) {
        return new Promise(function (resolve, reject) {
          ready(function (c) {
            if (!c) { reject(new Error("Chat indisponível agora.")); return; }
            var m = me();
            c.from("chat_messages").insert({
              room: room, user_id: userId || undefined, nickname: m.nick, avatar: m.avatar, name_color: m.color, body: body
            }).then(function (r) {
              if (r.error) reject(new Error(/Calma/.test(r.error.message) ? "Calma! Espere um pouco." : "Não deu para enviar."));
              else resolve();
            });
          });
        });
      },
      close: function () {
        closed = true;
        if (ch && client) { try { client.removeChannel(ch); } catch (e) {} }
        ch = null;
      }
    };
  }

  /* ---------- preferencia Ao Vivo / Solo por jogo ---------- */

  function isLiveMode(game) {
    try { return localStorage.getItem("bzgLive_" + game) !== "solo"; } catch (e) { return true; }
  }
  function setLiveMode(game, on) {
    try { localStorage.setItem("bzgLive_" + game, on ? "live" : "solo"); } catch (e) {}
  }

  /* ---------- barra "Ao Vivo / Solo" + "X na mesa" no topo do jogo ---------- */

  // bar(host, onChange(live) -> false para recusar) -> { setLive(on), setCount(n) }
  function bar(host, live, onChange) {
    var el = document.createElement("div");
    el.className = "live-bar";
    el.innerHTML =
      '<div class="live-switch" role="group" aria-label="Modo de jogo">' +
        '<button type="button" data-mode="live"><span class="live-dot"></span>Ao Vivo</button>' +
        '<button type="button" data-mode="solo">Solo</button>' +
      '</div>' +
      '<span class="live-people" hidden>👥 <b>1</b> na mesa</span>';
    host.insertBefore(el, host.firstChild);
    var btns = el.querySelectorAll("button");
    var people = el.querySelector(".live-people");
    function paint(on) {
      btns[0].setAttribute("aria-pressed", on ? "true" : "false");
      btns[1].setAttribute("aria-pressed", on ? "false" : "true");
      people.hidden = !on;
    }
    paint(live);
    Array.prototype.forEach.call(btns, function (b) {
      b.addEventListener("click", function () {
        var on = b.dataset.mode === "live";
        if (on === live) return;
        if (onChange(on) === false) return;
        live = on;
        paint(on);
        if (BZG.sounds && BZG.sounds.click) BZG.sounds.click();
      });
    });
    return {
      setCount: function (n) { people.querySelector("b").textContent = String(Math.max(1, n || 1)); }
    };
  }

  // liga a aba "Mesa" do chat (o chat.js pode carregar depois do jogo)
  function setChatTable(name) {
    BZG._chatTable = name;
    if (BZG.chat) BZG.chat.setTable(name);
  }

  return {
    bar: bar,
    setChatTable: setChatTable,
    hash: hash,
    rng: rng,
    withSeed: withSeed,
    now: now,
    clockOk: function () { return clockOk; },
    ready: ready,
    myId: function () { return userId; },
    me: me,
    startOnline: startOnline,
    online: function () { return online; },
    table: table,
    chat: chat,
    isLiveMode: isLiveMode,
    setLiveMode: setLiveMode
  };
})();
