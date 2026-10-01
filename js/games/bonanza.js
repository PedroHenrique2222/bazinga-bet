/* Bazinga BET - Bazinga Bonanza v2: estilo Sweet Bonanza com os icones do Bazinga.
   Grade 6x5, PAGA EM QUALQUER LUGAR (8+ do mesmo simbolo pagam; faixas 8-9 / 10-11 / 12+),
   cascata/tumble (vencedores somem, os de cima caem, novos preenchem o topo, repete
   enquanto houver ganho). 🎇 Bonus: 4+ em qualquer lugar dispara 10 RODADAS GRATIS
   (nas gratis as bombas de multiplicador aparecem MUITO mais); 3+ numa rodada gratis
   re-dispara +5. 💣 Bomba de multiplicador: nao forma ganho, mas no fim de um giro com
   ganho, TODAS as bombas na tela somam seus valores e multiplicam o ganho do giro.
   Compra de bonus: 20x a aposta compra 10 rodadas gratis na hora.
   Pagamentos calibrados por Monte Carlo (5M giros): RTP ~95%, disparo de gratis ~1 em 210.
   v3 (visual): palco imersivo estilo Pragmatic - cenario, logo, mascote (Estrela-Bonus),
   botao de girar redondo, barra de saldo/ganho e imagens opcionais do Codex
   (assets/bonanza/) que entram sozinhas quando existirem. A matematica nao mudou.
   v4 (visual): tema caverna/templo antigo (estilo Gems Bonanza) - "Joias dos Bazingas",
   tabuleiro de pedra com moldura de ouro, Guardiao (idolo de pedra) no lugar da
   Estrela-Bonus. Sem imagens, o idolo e o orbe sao SVG desenhados aqui. Matematica igual. */
(function () {
  var COLS = 6, ROWS = 5, N = COLS * ROWS;
  var SCALE = 0.972;   // ajuste fino global do RTP
  var BUY_MULT = 20;   // custo da compra de rodadas gratis = 20x a aposta

  /* 8 simbolos de pagamento (alto -> baixo). pay = [8-9, 10-11, 12+] em x da aposta. */
  var SYMBOLS = [
    { icon: "💎", pay: [3, 6, 12],       weight: 6 },
    { icon: "🍰", pay: [1.5, 3, 8],      weight: 7 },
    { icon: "🍑", pay: [0.8, 2, 5],      weight: 8 },
    { icon: "🃏", pay: [0.5, 1.4, 3],    weight: 10 },
    { icon: "🎲", pay: [0.3, 0.8, 2],    weight: 12 },
    { icon: "🥒", pay: [0.2, 0.5, 1.5],  weight: 14 },
    { icon: "🔋", pay: [0.15, 0.4, 1],   weight: 16 },
    { icon: "🎃", pay: [0.1, 0.25, 0.8], weight: 18 }
  ];
  var TOTALW = SYMBOLS.reduce(function (s, x) { return s + x.weight; }, 0);
  var SCATTER = "🎇";
  var SCAT_PAY = { 4: 1, 5: 2, 6: 20 }; // 6 ou mais = 20x
  var P_SC = 0.019, P_BOMB_BASE = 0.020, P_BOMB_FREE = 0.110;
  var BOMB_VALS =    [2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 50, 100];
  var BOMB_WEIGHTS = [28, 22, 14, 10, 8, 5, 4, 3, 2, 1.5, 1, 0.6, 0.3];
  var TOTALBW = BOMB_WEIGHTS.reduce(function (s, x) { return s + x; }, 0);
  var FREE_SPINS = 10, RETRIGGER_MIN = 3, RETRIGGER_ADD = 5, TRIGGER_MIN = 4;

  var grid = [];  // grid[c][r], r=0 no topo; cada celula: {k:'p',i} | {k:'s'} | {k:'b',v}
  var spinning = false;
  var auto = null; // giro automatico (autospin.js)

  var betInput, spinBtn, buyBtn, statusEl, historyListEl, gridEl, bannerEl, winEl, stageEl, freeEl;
  var balEl, logoEl, mascotEl, mascotBody, bubbleEl;

  // estado da rodada em andamento
  var curBet = 0, curCost = 0, totalWin = 0, freeLeft = 0, isBuyRound = false;
  var inFree = false; // dentro das rodadas gratis (inclusive a ultima, quando freeLeft ja e 0)

  function spd(ms) { return ms * BZG.modes.speed(); }
  function setStatus(t) { statusEl.textContent = t; }
  function fmt(v) { return BZG.ui.formatMoney(v); }

  function pickSym() {
    var r = Math.random() * TOTALW;
    for (var i = 0; i < SYMBOLS.length; i++) { r -= SYMBOLS[i].weight; if (r <= 0) return i; }
    return SYMBOLS.length - 1;
  }
  function pickBomb() {
    var r = Math.random() * TOTALBW;
    for (var i = 0; i < BOMB_VALS.length; i++) { r -= BOMB_WEIGHTS[i]; if (r <= 0) return BOMB_VALS[i]; }
    return BOMB_VALS[0];
  }
  // gera uma celula nova; st acumula scatters (st.sc) e soma das bombas (st.bomb)
  function newCell(pBomb, st) {
    var r = Math.random();
    if (r < P_SC) { st.sc++; return { k: "s" }; }
    if (r < P_SC + pBomb) { var v = pickBomb(); st.bomb += v; return { k: "b", v: v }; }
    return { k: "p", i: pickSym() };
  }

  function fillGrid(pBomb, st) {
    grid = [];
    for (var c = 0; c < COLS; c++) { grid[c] = []; for (var r = 0; r < ROWS; r++) grid[c][r] = newCell(pBomb, st); }
  }

  // conta simbolos de pagamento; 8+ paga e marca pra remover. retorna {pay, remove, any}
  function evaluate() {
    var counts = [0, 0, 0, 0, 0, 0, 0, 0];
    for (var c = 0; c < COLS; c++) for (var r = 0; r < ROWS; r++) {
      var cell = grid[c][r]; if (cell.k === "p") counts[cell.i]++;
    }
    var remove = [];
    for (var c2 = 0; c2 < COLS; c2++) { remove[c2] = []; for (var r2 = 0; r2 < ROWS; r2++) remove[c2][r2] = false; }
    var pay = 0, any = false;
    for (var s = 0; s < SYMBOLS.length; s++) {
      if (counts[s] >= 8) {
        var tier = counts[s] >= 12 ? 2 : (counts[s] >= 10 ? 1 : 0);
        pay += SYMBOLS[s].pay[tier];
        any = true;
        for (var cc = 0; cc < COLS; cc++) for (var rr = 0; rr < ROWS; rr++) {
          var cel = grid[cc][rr]; if (cel.k === "p" && cel.i === s) remove[cc][rr] = true;
        }
      }
    }
    return { pay: pay, remove: remove, any: any };
  }

  // cascata: por coluna, mantem as celulas NAO removidas (scatter/bomba grudam e caem),
  // preenche o topo com celulas novas
  function tumble(remove, pBomb, st) {
    var falls = []; // falls[c][r] = quantas linhas a celula desceu (0 = ficou parada)
    for (var c = 0; c < COLS; c++) {
      var kept = [], keptFrom = [];
      for (var r = 0; r < ROWS; r++) if (!remove[c][r]) { kept.push(grid[c][r]); keptFrom.push(r); }
      var need = ROWS - kept.length;
      var col = [];
      falls[c] = [];
      for (var t = 0; t < need; t++) { col.push(newCell(pBomb, st)); falls[c].push(need); } // novos vem de cima
      keptFrom.forEach(function (from, k) { falls[c].push(need + k - from); });
      grid[c] = col.concat(kept); // novos no topo
    }
    return falls;
  }

  function scatterPay(sc) { var key = sc >= 6 ? 6 : sc; return SCAT_PAY[key] || SCAT_PAY[6]; }

  /* ---------- simbolos: imagem do Codex (se existir) > SVG desenhado > emoji ---------- */
  var SYM_ART = { "💎": "s-diamante", "🍰": "s-bolo", "🍑": "s-pessego", "🃏": "s-carta", "🎲": "s-dado",
    "🥒": "s-picles", "🔋": "s-pilha", "🎃": "s-abobora", "🎇": "s-bonus", "💣": "bomba" };
  var IMG_DIR = "../assets/bonanza/";
  var SYM_IMG = { "💎": "sym-diamante", "🍰": "sym-bolo", "🍑": "sym-pessego", "🃏": "sym-carta", "🎲": "sym-dado",
    "🥒": "sym-picles", "🔋": "sym-pilha", "🎃": "sym-abobora", "🎇": "sym-bonus", "💣": "sym-bomba" };
  var SCENE_IMG = { fundo: IMG_DIR + "fundo.webp", logo: IMG_DIR + "logo.webp",
    mascote: IMG_DIR + "mascote.webp", vitoria: IMG_DIR + "mascote-vitoria.webp" };
  var imgSym = {};      // emoji -> caminho da imagem que carregou
  var imgScene = {};    // fundo/logo/mascote/vitoria -> true se carregou
  // nomes exibidos (tabela de pagamentos / legendas); nao mexem na matematica
  var SYM_NAME = { "💎": "Diamante BZG", "🍰": "Rubi do Panetone", "🍑": "Quartzo do Bogão", "🃏": "Ametista do Pitoco",
    "🎲": "Jade do 616", "🥒": "Esmeralda do Pikles", "🔋": "Topázio da Pilha", "🎃": "Âmbar da Abóbora",
    "🎇": "Ídolo BZG", "💣": "Orbe multiplicador" };

  /* fallbacks desenhados (sem imagem): idolo de pedra com olhos de joia e orbe de cristal.
     So cores chapadas (sem gradiente com id) para poder repetir o SVG varias vezes na pagina. */
  var IDOL_SVG =
    '<path d="M13 55h38l3 7H10z" fill="#2c3238" stroke="#0b1418" stroke-width="2" stroke-linejoin="round"/>' +
    '<path d="M17 22h30v30a4 4 0 0 1-4 4H21a4 4 0 0 1-4-4z" fill="#68717a" stroke="#0b1418" stroke-width="2.5" stroke-linejoin="round"/>' +
    '<path d="M38 24h8v28a3 3 0 0 1-3 3h-5z" fill="#4a535b"/>' +
    '<path d="M19 24h4v30h-1a3 3 0 0 1-3-3z" fill="#7d868f"/>' +
    '<path d="M44 29l-3 5 2 3-2 5" fill="none" stroke="#353c43" stroke-width="1.3" stroke-linecap="round"/>' +
    '<path d="M13 23l6-12 6 6 7-13 7 13 6-6 6 12z" fill="#c9a24a" stroke="#0b1418" stroke-width="2.5" stroke-linejoin="round"/>' +
    '<path d="M14 21h36v6H14z" fill="#f2d27a" stroke="#0b1418" stroke-width="2" stroke-linejoin="round"/>' +
    '<path d="M32 8l3.5 4.5L32 17l-3.5-4.5z" fill="#2ee59d" stroke="#0b1418" stroke-width="1.6" stroke-linejoin="round"/>' +
    '<path d="M21 31.5h8.5M34.5 31.5H43" stroke="#0b1418" stroke-width="2.6" stroke-linecap="round"/>' +
    '<circle class="bz-idol-glow" cx="25.5" cy="37.5" r="6.5" fill="#4fe3d0" opacity="0.35"/>' +
    '<circle class="bz-idol-glow" cx="38.5" cy="37.5" r="6.5" fill="#4fe3d0" opacity="0.35"/>' +
    '<path d="M25.5 33.5l4 4-4 4-4-4z" fill="#4fe3d0" stroke="#0b1418" stroke-width="1.6" stroke-linejoin="round"/>' +
    '<path d="M38.5 33.5l4 4-4 4-4-4z" fill="#4fe3d0" stroke="#0b1418" stroke-width="1.6" stroke-linejoin="round"/>' +
    '<circle cx="24.4" cy="36.4" r="1.1" fill="#ffffff"/><circle cx="37.4" cy="36.4" r="1.1" fill="#ffffff"/>' +
    '<path d="M32 41v4.5" stroke="#353c43" stroke-width="2" stroke-linecap="round"/>' +
    '<path d="M25 49.5h14" stroke="#0b1418" stroke-width="3" stroke-linecap="round"/>';
  var ORB_SVG =
    '<circle cx="32" cy="32" r="26" fill="#c9a24a" stroke="#0b1418" stroke-width="2.5"/>' +
    '<circle cx="32" cy="32" r="21" fill="#0d3b40" stroke="#0b1418" stroke-width="2"/>' +
    '<circle cx="32" cy="34" r="15" fill="#13646a"/>' +
    '<circle class="bz-orb-core" cx="32" cy="35" r="9" fill="#4fe3d0" opacity="0.75"/>' +
    '<ellipse cx="24.5" cy="23.5" rx="6.5" ry="4" fill="#ffffff" opacity="0.55" transform="rotate(-30 24.5 23.5)"/>' +
    '<path d="M32 6v5M32 53v5M6 32h5M53 32h5" stroke="#f2d27a" stroke-width="2.2" stroke-linecap="round"/>';
  function drawn(svg, size, cls) {
    return '<svg class="bzg-icon ' + cls + '" width="' + size + '" height="' + size + '" viewBox="0 0 64 64" aria-hidden="true" focusable="false">' + svg + '</svg>';
  }

  var reduceMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  function symArt(icon, size) {
    if (imgSym[icon]) return '<img class="sym-img" src="' + imgSym[icon] + '" alt="" draggable="false">';
    if (icon === SCATTER) return drawn(IDOL_SVG, size || 64, "bz-idol");
    if (icon === "💣") return drawn(ORB_SVG, size || 64, "bz-orb");
    return BZG.icons && SYM_ART[icon] ? BZG.icons.art(SYM_ART[icon], size || 64) : icon;
  }
  function symInline(icon) {
    return '<span class="sym-inline" data-sym="' + icon + '" title="' + (SYM_NAME[icon] || "") + '">' + symArt(icon, 22) + '</span>';
  }
  function symbolizeText(el) {
    var html = el.innerHTML;
    Object.keys(SYM_ART).forEach(function (emo) { html = html.split(emo).join(symInline(emo)); });
    el.innerHTML = html;
  }
  // quando as imagens chegam depois, troca os simbolos pequenos (tabela, contador...)
  function refreshInlineSyms() {
    Array.prototype.forEach.call(document.querySelectorAll(".sym-inline[data-sym]"), function (el) {
      el.innerHTML = symArt(el.getAttribute("data-sym"), 22);
    });
  }

  function cellHTML(cell, win, fall, delay) {
    var cls = "gem" + (fall ? " fall" : "") + (win ? " win" : "");
    var style = fall ? ' style="--n:' + fall + ';animation-delay:' + (delay || 0) + 'ms"' : "";
    var content;
    if (cell.k === "p") content = symArt(SYMBOLS[cell.i].icon);
    else if (cell.k === "s") { cls += " scatter"; content = symArt(SCATTER); }
    else { cls += " bomb"; content = symArt("💣") + '<b>' + cell.v + 'x</b>'; }
    return '<div class="' + cls + '"' + style + '>' + content + '</div>';
  }

  /* "+BZ$ X" que sobe de dentro da grade a cada cascata */
  function floatWin(amount, cls) {
    if (!(amount > 0)) return;
    var el = document.createElement("div");
    el.className = "bonanza-float" + (cls ? " " + cls : "");
    el.textContent = "+" + fmt(amount);
    gridEl.parentElement.appendChild(el);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 1400);
  }

  /* estouro de brilho em cima de cada celula (vencedores ou bombas). Fica na moldura,
     fora da celula, para nao encolher junto com o simbolo que explode. */
  function burst(selector, cls) {
    if (reduceMotion) return;
    var frame = gridEl.parentElement;
    var gx = gridEl.offsetLeft, gy = gridEl.offsetTop;
    var made = [];
    Array.prototype.forEach.call(gridEl.querySelectorAll(selector), function (g) {
      var b = document.createElement("i");
      b.className = "bz-burst" + (cls ? " " + cls : "");
      b.style.cssText = "left:" + (gx + g.offsetLeft) + "px;top:" + (gy + g.offsetTop) + "px;width:" +
        g.offsetWidth + "px;height:" + g.offsetHeight + "px";
      frame.appendChild(b);
      made.push(b);
    });
    setTimeout(function () { made.forEach(function (b) { if (b.parentNode) b.parentNode.removeChild(b); }); }, 650);
  }

  /* opts.drop: giro novo, tudo cai de cima (coluna por coluna, de baixo pra cima).
     opts.falls: cascata, so cai quem desceu, cada um a sua distancia. */
  function renderGrid(opts) {
    opts = opts || {};
    var html = "";
    var sp = BZG.modes.speed();
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        var fall = 0, delay = 0;
        if (opts.drop) { fall = ROWS; delay = (c * 45 + (ROWS - 1 - r) * 22) * sp; }
        else if (opts.falls) { fall = opts.falls[c][r]; delay = c * 25 * sp; }
        html += cellHTML(grid[c][r], false, fall, delay);
      }
    }
    gridEl.innerHTML = html;
  }

  /* marca os vencedores nas celulas que ja estao na tela (sem redesenhar a grade) */
  function markWinners(remove) {
    for (var r = 0; r < ROWS; r++) for (var c = 0; c < COLS; c++) {
      if (remove[c][r]) { var el = gridEl.children[r * COLS + c]; if (el) el.classList.add("win"); }
    }
  }

  function showBanner(text, cls) {
    bannerEl.innerHTML = "";
    bannerEl.textContent = text;
    bannerEl.className = "bonanza-banner" + (cls ? " " + cls : "");
    void bannerEl.offsetWidth;
    bannerEl.classList.add("show");
  }
  // banner com simbolo desenhado na frente do texto (ex.: compra)
  function showBannerSym(icon, text, cls) {
    showBanner("", cls);
    bannerEl.innerHTML = '<span class="bz-banner-sym">' + symArt(icon, 64) + '</span>' + text;
  }

  /* ---------- mascote (Guardiao: idolo de pedra com olhos de joia) ---------- */
  var cheerTimer = null, bubbleTimer = null;
  function renderMascot() {
    if (!mascotBody) return;
    if (imgScene.mascote) {
      mascotBody.innerHTML = '<img class="bz-mascot-img" src="' + SCENE_IMG.mascote + '" alt="" draggable="false">' +
        (imgScene.vitoria ? '<img class="bz-mascot-img bz-mascot-img--win" src="' + SCENE_IMG.vitoria + '" alt="" draggable="false">' : "");
      mascotEl.classList.add("has-img");
      mascotEl.classList.toggle("has-win", !!imgScene.vitoria);
    } else {
      mascotBody.innerHTML = drawn(IDOL_SVG, 240, "bz-idol bz-idol--guard");
    }
  }
  function showBubble(text) {
    if (!bubbleEl || !text) return;
    bubbleEl.textContent = text;
    bubbleEl.classList.remove("show");
    void bubbleEl.offsetWidth;
    bubbleEl.classList.add("show");
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(function () { bubbleEl.classList.remove("show"); }, 1700);
  }
  // nivel 0 = pulinho (cada cascata), 1 = comemora, 2 = comemora muito (vitoria grande)
  function mascotCheer(level, text) {
    if (!mascotEl) return;
    mascotEl.classList.remove("hop", "cheer", "cheer-big");
    void mascotEl.offsetWidth;
    mascotEl.classList.add(level >= 1 ? "cheer" : "hop");
    if (level >= 2) mascotEl.classList.add("cheer-big");
    clearTimeout(cheerTimer);
    cheerTimer = setTimeout(function () { mascotEl.classList.remove("hop", "cheer", "cheer-big"); }, level >= 1 ? 1800 : 650);
    showBubble(text);
  }

  /* ---------- contador de ganho na barra (sobe contando) ---------- */
  var shownWin = 0, countRaf = 0;
  function setWinText(v, tail) { winEl.innerHTML = fmt(v) + (tail || ""); }
  function countWin(target, tail) {
    cancelAnimationFrame(countRaf);
    var from = shownWin;
    var box = winEl.parentElement;
    if (target > from && box) { box.classList.remove("bump"); void box.offsetWidth; box.classList.add("bump"); }
    if (reduceMotion || target <= from) { shownWin = target; setWinText(target, tail); return; }
    var dur = spd(700), start = 0;
    function frame(now) {
      if (!start) start = now;
      var p = Math.min(1, (now - start) / dur);
      var e = 1 - Math.pow(1 - p, 3);
      shownWin = Math.round(from + (target - from) * e);
      if (p < 1) { winEl.textContent = fmt(shownWin); countRaf = requestAnimationFrame(frame); }
      else { shownWin = target; setWinText(target, tail); }
    }
    countRaf = requestAnimationFrame(frame);
  }
  function resetWin() {
    cancelAnimationFrame(countRaf);
    shownWin = 0;
    winEl.className = "bonanza-win";
    setWinText(0);
  }

  function refreshBar() {
    if (balEl) balEl.textContent = fmt(BZG.storage.getBalance());
  }

  /* ---------- contador das rodadas gratis ---------- */
  var freeShown = -1;
  // extra = ganho (em x da aposta) das cascatas do giro atual, que ainda nao entrou em totalWin
  function updateFreeUI(extra) {
    if (inFree) {
      stageEl.classList.add("free-mode");
      freeEl.style.display = "";
      if (!freeEl.querySelector(".bz-free-num")) {
        freeEl.innerHTML =
          '<span class="bz-free-label">' + symInline("🎇") + ' Rodadas grátis</span>' +
          '<b class="bz-free-num"></b>' +
          '<span class="bz-free-total">Ganho total <b></b></span>';
        freeShown = -1;
      }
      var numEl = freeEl.querySelector(".bz-free-num");
      if (freeShown !== freeLeft) {
        numEl.textContent = freeLeft;
        numEl.classList.remove("bump");
        void numEl.offsetWidth;
        numEl.classList.add("bump");
        freeShown = freeLeft;
      }
      freeEl.querySelector(".bz-free-total b").textContent = fmt(Math.round(curBet * (totalWin + (extra || 0)) * SCALE));
    } else {
      stageEl.classList.remove("free-mode");
      freeEl.style.display = "none";
      freeEl.innerHTML = "";
      freeShown = -1;
    }
  }

  function showRunningWin() {
    var payoutSoFar = Math.round(curBet * totalWin * SCALE);
    if (payoutSoFar > 0) {
      winEl.className = "bonanza-win" + (totalWin * SCALE >= 10 ? " big" : "");
      countWin(payoutSoFar);
    }
    if (inFree) updateFreeUI();
  }

  function renderHistory() {
    var entries = BZG.storage.getHistory("bonanza");
    historyListEl.innerHTML = entries.slice(0, 8).map(function (e) {
      var tagClass = e.won ? "tag--win" : "tag--lose";
      var tagText = e.won ? "GANHOU" : "PERDEU";
      return '<div class="history-row">' +
        '<span class="tag ' + tagClass + '">' + tagText + '</span>' +
        '<span>' + (e.detail || "") + '</span>' +
        '<span>' + fmt(e.payout) + '</span>' +
        '</div>';
    }).join("") || '<p style="color:var(--text-muted); font-size:13px;">Nenhum giro ainda.</p>';
  }

  /* roda UM giro completo (base ou gratis): preenche, avalia e faz as cascatas ate parar,
     depois soma scatter pay e o multiplicador das bombas. Chama onDone(ganhoDoGiro, scatters). */
  function runSpin(pBomb, onDone) {
    var st = { sc: 0, bomb: 0 };
    var accWin = 0;
    var teased = false;
    var chain = 0; // cascatas seguidas neste giro (o som do estouro sobe a cada uma)
    // fora das gratis faltam 4 bonus para disparar; nas gratis, 3 re-disparam
    var need = stageEl.classList.contains("free-mode") ? RETRIGGER_MIN : TRIGGER_MIN;
    fillGrid(pBomb, st);
    renderGrid({ drop: true });
    BZG.sounds.tumble();

    function teaseScatter() {
      if (!teased && st.sc === need - 1) {
        teased = true;
        stageEl.classList.add("scatter-tease");
        showBanner("FALTA 1!", "tease");
        BZG.sounds.scatterLand(need - 1);
      }
    }

    setTimeout(function step() {
      teaseScatter();
      var ev = evaluate();
      if (!ev.any) {
        stageEl.classList.remove("scatter-tease");
        var w = accWin;
        if (st.sc >= TRIGGER_MIN) w += scatterPay(st.sc);
        if (w > 0 && st.bomb > 0) {
          // as bombas giram, acendem, explodem e o ganho multiplica com tremor
          Array.prototype.forEach.call(gridEl.querySelectorAll(".gem.bomb"), function (b) { b.classList.add("boom"); });
          BZG.sounds.bombCharge();
          setTimeout(function () {
            w *= st.bomb;
            Array.prototype.forEach.call(gridEl.querySelectorAll(".gem.bomb"), function (b) { b.classList.remove("boom"); b.classList.add("blast"); });
            burst(".gem.bomb", "bz-burst--bomb");
            showBanner("×" + st.bomb, "mult");
            BZG.sounds.bombHit(st.bomb);
            mascotCheer(1, "×" + st.bomb + "!");
            BZG.effects.shake(stageEl);
            BZG.effects.flash(stageEl, "gold");
            floatWin(Math.round(curBet * (w - accWin) * SCALE), "mult");
            // segura o "xN" na tela antes do proximo giro cair por cima (so tempo, nao muda o valor)
            setTimeout(function () { onDone(w, st.sc); }, spd(650));
          }, spd(650));
          return;
        }
        onDone(w, st.sc);
        return;
      }
      accWin += ev.pay;
      markWinners(ev.remove);
      BZG.sounds.gemPop(chain++);
      floatWin(Math.round(curBet * ev.pay * SCALE));
      mascotCheer(0);
      winEl.className = "bonanza-win counting";
      countWin(Math.round(curBet * (totalWin + accWin) * SCALE));
      if (inFree) updateFreeUI(accWin);
      setTimeout(function () {
        // vencedores explodem antes de sumir
        Array.prototype.forEach.call(gridEl.querySelectorAll(".gem.win"), function (g) { g.classList.add("pop"); });
        burst(".gem.win");
      }, spd(360));
      setTimeout(function () {
        var falls = tumble(ev.remove, pBomb, st);
        renderGrid({ falls: falls });
        BZG.sounds.tumble();
        setTimeout(step, spd(470));
      }, spd(620));
    }, spd(720));
  }

  function lockUI(lock) {
    betInput.disabled = lock;
    spinBtn.disabled = lock;
    if (buyBtn) buyBtn.disabled = lock;
    document.getElementById("bet-half").disabled = lock;
    document.getElementById("bet-double").disabled = lock;
    document.getElementById("bet-max").disabled = lock;
    stageEl.classList.toggle("is-spinning", lock);
  }

  function doRound(isBuy) {
    if (spinning) return false;
    var bet = Math.round(Number(betInput.value));
    var balance = BZG.storage.getBalance();
    if (!bet || bet <= 0) { BZG.ui.toast("Digite um valor de aposta válido.", "error"); return false; }
    var cost = isBuy ? bet * BUY_MULT : bet;
    if (cost > balance) {
      BZG.ui.toast(isBuy ? "A compra custa " + fmt(cost) + " (20x). Saldo insuficiente." : "Você não tem saldo suficiente.", "error");
      return false;
    }

    spinning = true;
    isBuyRound = !!isBuy;
    curBet = bet;
    curCost = cost;
    totalWin = 0;
    freeLeft = 0;
    inFree = false;
    lockUI(true);
    resetWin();
    setStatus(isBuy ? "Comprando rodadas grátis..." : "Girando...");
    BZG.sounds.bet();

    if (isBuy) {
      showBannerSym("🎇", "COMPRA!", "free");
      BZG.sounds.freeSpinsStart();
      setTimeout(function () { startFreeSpins(FREE_SPINS); }, spd(700));
    } else {
      runSpin(P_BOMB_BASE, function (w, sc) {
        totalWin += w;
        showRunningWin();
        if (sc >= TRIGGER_MIN) {
          showBanner("RODADAS GRÁTIS!", "free");
          BZG.sounds.freeSpinsStart();
          setTimeout(function () { startFreeSpins(FREE_SPINS); }, spd(900));
        } else {
          finishRound();
        }
      });
    }
    return true;
  }

  function startFreeSpins(count) {
    freeLeft = count;
    inFree = true;
    // transicao de clima: o cenario escurece/acende e uma onda de luz passa pelo palco
    stageEl.classList.remove("free-enter");
    void stageEl.offsetWidth;
    stageEl.classList.add("free-enter");
    setTimeout(function () { stageEl.classList.remove("free-enter"); }, 1500);
    mascotCheer(1, "GRÁTIS!");
    updateFreeUI();
    setTimeout(nextFreeSpin, spd(500));
  }

  function nextFreeSpin() {
    if (freeLeft <= 0) { finishRound(); return; }
    freeLeft--;
    updateFreeUI();
    setStatus(freeLeft > 0 ? "Rodada grátis! Restam " + freeLeft : "Última rodada grátis!");
    runSpin(P_BOMB_FREE, function (w, sc) {
      totalWin += w;
      showRunningWin();
      if (sc >= RETRIGGER_MIN) {
        freeLeft += RETRIGGER_ADD;
        updateFreeUI();
        showBanner("+" + RETRIGGER_ADD + " GRÁTIS!", "free");
        mascotCheer(1, "+" + RETRIGGER_ADD + "!");
        BZG.sounds.freeSpinsRetrigger();
        setTimeout(nextFreeSpin, spd(750));
      } else {
        setTimeout(nextFreeSpin, spd(480));
      }
    });
  }

  function finishRound() {
    var payout = Math.round(curBet * totalWin * SCALE);
    var effMult = curCost > 0 ? payout / curCost : 0; // multiplicador sobre o custo (base OU compra)
    var won = payout > 0;

    inFree = false;
    updateFreeUI();

    BZG.storage.recordBet("bonanza", {
      bet: curCost, multiplier: effMult, payout: payout, won: won,
      detail: won ? effMult.toFixed(2) + "x" + (isBuyRound ? " 🛒" : "") : (isBuyRound ? "compra sem retorno" : "sem ganho")
    });
    BZG.ui.refreshBalance();
    document.dispatchEvent(new CustomEvent("bzg:balance-changed"));
    renderHistory();
    refreshBar();

    if (won) {
      var big = effMult >= 10;
      winEl.className = "bonanza-win" + (big ? " big" : "");
      countWin(payout, ' <small>' + effMult.toFixed(2) + 'x</small>');
      setStatus("Você ganhou " + fmt(payout) + "!");
      BZG.ui.toast("💎 +" + fmt(payout) + " (" + effMult.toFixed(2) + "x)", "success");
      BZG.sounds.winFor(effMult);
      BZG.effects.flash(stageEl, "gold");
      // abaixo de 1x o jogador recebeu menos do que apostou: so um pulinho, sem "BOA!"
      if (effMult >= 1) mascotCheer(big ? 2 : 1, effMult >= 50 ? "BAZINGA!" : (effMult >= 5 ? "UAU!" : "BOA!"));
      else mascotCheer(0);
      var rect = stageEl.getBoundingClientRect();
      BZG.effects.confetti(rect.left + rect.width / 2, rect.top + rect.height / 2, big ? 120 : 55);
      if (effMult >= 20 || payout >= 25000) BZG.effects.bigWin(payout, effMult);
    } else {
      winEl.className = "bonanza-win";
      setWinText(0);
      setStatus(isBuyRound ? "As rodadas grátis não pagaram desta vez." : "Nenhuma joia com 8+. Tente outra vez!");
      BZG.sounds.lose();
    }

    spinning = false;
    isBuyRound = false;
    lockUI(false);
    if (auto) auto.done(true);
  }

  function quickBet(fn) {
    var current = Number(betInput.value) || 0;
    betInput.value = Math.max(1, Math.round(fn(current, BZG.storage.getBalance())));
    updateBuyLabel();
  }

  function updateBuyLabel() {
    if (!buyBtn) return;
    var bet = Math.round(Number(betInput.value)) || 0;
    buyBtn.innerHTML =
      '<span class="bz-buy-icon">' + symArt("🎇", 64) + '</span>' +
      '<span class="buy-title">Comprar bônus</span>' +
      '<span class="bz-buy-sub">10 grátis · 20x</span>' +
      '<small>' + fmt(bet * BUY_MULT) + '</small>';
  }

  /* tabela de pagamentos montada a partir de SYMBOLS (sempre igual a matematica) */
  function buildPaytable() {
    var box = document.getElementById("bonanza-paytable");
    if (!box) return;
    box.innerHTML = SYMBOLS.map(function (s) {
      return '<div class="bz-pay-card">' + symInline(s.icon) +
        '<div class="bz-pay-body"><span class="bz-pay-name">' + SYM_NAME[s.icon] + '</span>' +
        '<dl>' +
        '<div><dt>12+</dt><dd>' + s.pay[2] + 'x</dd></div>' +
        '<div><dt>10-11</dt><dd>' + s.pay[1] + 'x</dd></div>' +
        '<div><dt>8-9</dt><dd>' + s.pay[0] + 'x</dd></div>' +
        '</dl></div></div>';
    }).join("");
  }

  /* poeira dourada e faiscas de joia subindo no cenario (so transform/opacity) */
  function makeSparkles() {
    var box = document.getElementById("bonanza-sparkles");
    if (!box) return;
    var html = "";
    for (var i = 0; i < 18; i++) {
      var s = (3 + Math.random() * 6).toFixed(1);
      html += '<i' + (i % 3 === 0 ? ' class="c"' : '') + ' style="left:' + (Math.random() * 100).toFixed(1) + '%;top:' + (12 + Math.random() * 84).toFixed(1) +
        '%;width:' + s + 'px;height:' + s + 'px;animation-delay:-' + (Math.random() * 9).toFixed(2) +
        's;animation-duration:' + (6 + Math.random() * 6).toFixed(2) + 's"></i>';
    }
    box.innerHTML = html;
  }

  /* imagens do Codex: tenta carregar; o que existir substitui o desenho em CSS/SVG */
  function loadImages() {
    if (!BZG.assets) return;
    var symPath = {}, paths = [];
    Object.keys(SYM_IMG).forEach(function (emo) { symPath[emo] = IMG_DIR + SYM_IMG[emo] + ".webp"; paths.push(symPath[emo]); });
    Object.keys(SCENE_IMG).forEach(function (k) { paths.push(SCENE_IMG[k]); });
    BZG.assets.preload(paths, function (ok) {
      Object.keys(SCENE_IMG).forEach(function (k) { imgScene[k] = !!ok[SCENE_IMG[k]]; });
      if (imgScene.fundo) {
        stageEl.querySelector(".bz-scene-img").style.backgroundImage = 'url("' + SCENE_IMG.fundo + '")';
        stageEl.classList.add("has-bg");
      }
      if (imgScene.logo && logoEl) {
        logoEl.innerHTML = '<img src="' + SCENE_IMG.logo + '" alt="" draggable="false">';
        logoEl.classList.add("has-img");
      }
      if (imgScene.mascote) renderMascot();
      var anySym = false;
      Object.keys(symPath).forEach(function (emo) { if (ok[symPath[emo]]) { imgSym[emo] = symPath[emo]; anySym = true; } });
      if (anySym) {
        stageEl.classList.add("has-sym-img");
        refreshInlineSyms();
        updateBuyLabel();
        if (!spinning) renderGrid({});
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    betInput = document.getElementById("bet-amount");
    spinBtn = document.getElementById("spin-btn");
    buyBtn = document.getElementById("buy-btn");
    statusEl = document.getElementById("round-status");
    historyListEl = document.getElementById("history-list");
    gridEl = document.getElementById("bonanza-grid");
    bannerEl = document.getElementById("bonanza-banner");
    winEl = document.getElementById("bonanza-win");
    stageEl = document.getElementById("bonanza-stage");
    freeEl = document.getElementById("bonanza-free");
    balEl = document.getElementById("bonanza-balance");
    logoEl = document.getElementById("bonanza-logo");
    mascotEl = document.getElementById("bonanza-mascot");
    mascotBody = document.getElementById("bonanza-mascot-body");
    bubbleEl = document.getElementById("bonanza-bubble");

    // grade inicial de enfeite (sem bombas/scatter contando), caindo na entrada
    var st0 = { sc: 0, bomb: 0 };
    fillGrid(0, st0);
    renderGrid({ drop: true });
    if (freeEl) freeEl.style.display = "none";
    renderMascot();
    makeSparkles();
    buildPaytable();
    BZG.ui.refreshBalance();
    refreshBar();
    resetWin();
    renderHistory();
    updateBuyLabel();
    document.addEventListener("bzg:balance-changed", refreshBar);

    spinBtn.addEventListener("click", function () { if (auto) auto.stop(); doRound(false); });
    if (buyBtn) buyBtn.addEventListener("click", function () { if (auto) auto.stop(); doRound(true); });
    var autoEl = document.getElementById("autospin");
    if (autoEl && BZG.autospin) auto = BZG.autospin.create(autoEl, function () { return doRound(false); });
    Array.prototype.forEach.call(document.querySelectorAll(".paytable-row span, .paytable .section-title, .paytable p"), symbolizeText);
    betInput.addEventListener("input", updateBuyLabel);
    // Enter no valor da aposta = girar. O atalho global (layout.js) procura um .btn--primary,
    // que o botao redondo deste palco nao usa; trata aqui e nao deixa o evento subir.
    betInput.addEventListener("keydown", function (e) {
      if (e.key !== "Enter") return;
      e.preventDefault();
      e.stopPropagation();
      if (!spinBtn.disabled) spinBtn.click();
    });
    document.getElementById("bet-half").addEventListener("click", function () { quickBet(function (v) { return v / 2; }); });
    document.getElementById("bet-double").addEventListener("click", function () { quickBet(function (v) { return v * 2; }); });
    document.getElementById("bet-max").addEventListener("click", function () { quickBet(function (v, b) { return b; }); });

    // botao (i): leva para as regras e abre a tabela de pagamentos
    var infoBtn = document.getElementById("bonanza-info-btn");
    if (infoBtn) infoBtn.addEventListener("click", function () {
      var box = document.getElementById("bonanza-paytable-box");
      if (box) box.open = true;
      var info = document.getElementById("bonanza-info");
      if (info) info.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    });

    loadImages();
  });
})();
