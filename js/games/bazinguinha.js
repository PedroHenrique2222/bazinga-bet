/* Bazinga BET - Bazinguinha v4: regras estilo Fortune Tiger COM respin de wild grudento.
   3x3, 5 linhas fixas (3 horizontais + 2 diagonais), ⚡ WILD substitui tudo,
   tela cheia do mesmo simbolo multiplica o ganho por 10.
   Respin grudento: caiu >=1 wild? ele TRAVA e os outros simbolos re-giram;
   enquanto uma re-rolagem trouxer wild NOVO, gira de novo (ate a tela encher).
   Calibrado por Monte Carlo (4M giros): RTP ~95%, max 2500x.
   v4 (so visual): maquina retrato com telhado, cenario, faixa de ganho, botao redondo,
   imagens opcionais do Codex (assets/bazinguinha/) com plano B em SVG/CSS. */
(function () {
  var STRIP_LEN = 21;
  var COL_DURATIONS = [1100, 1500, 1950];
  var MAX_RESPINS = 30; // trava de seguranca (na pratica quase nunca passa de 3-4)

  var SYMBOLS = [
    { icon: "🎃", pay: 1, weight: 30 },
    { icon: "🔋", pay: 1.5, weight: 25 },
    { icon: "🥒", pay: 2.5, weight: 20 },
    { icon: "🍰", pay: 5, weight: 15 },
    { icon: "🍑", pay: 12.5, weight: 10 }
  ];
  var WILD = { icon: "⚡", pay: 50, weight: 3 };
  var ALL = SYMBOLS.concat([WILD]);
  var TOTALW = ALL.reduce(function (s, x) { return s + x.weight; }, 0);
  var PAY = {}; ALL.forEach(function (s) { PAY[s.icon] = s.pay; });

  /* linhas: 1=meio, 2=topo, 3=baixo, 4=diagonal ↘, 5=diagonal ↗ */
  var LINES = [
    [3, 4, 5],  // 1 - meio
    [0, 1, 2],  // 2 - topo
    [6, 7, 8],  // 3 - baixo
    [0, 4, 8],  // 4 - diagonal TL-BR
    [6, 4, 2]   // 5 - diagonal BL-TR
  ];
  /* coordenadas (viewBox 300x300) do centro de cada celula por linha */
  var LINE_COORDS = [
    [[8, 150], [292, 150]],
    [[8, 50], [292, 50]],
    [[8, 250], [292, 250]],
    [[14, 22], [286, 278]],
    [[14, 278], [286, 22]]
  ];

  /* ---------- imagens opcionais (Codex) ----------
     Se a imagem existir, ela substitui o desenho; se nao, fica o SVG/CSS de sempre. */
  var IMG_DIR = "../assets/bazinguinha/";
  var IMG = {
    fundo: IMG_DIR + "fundo.webp",
    logo: IMG_DIR + "logo.webp",
    topo: IMG_DIR + "topo.webp",
    mascote: IMG_DIR + "mascote.webp",
    mascoteWin: IMG_DIR + "mascote-vitoria.webp"
  };
  var SYM_IMG = {
    "⚡": IMG_DIR + "sym-wild.webp",
    "🍑": IMG_DIR + "sym-pessego.webp",   // Bogao (premio mais alto)
    "🍰": IMG_DIR + "sym-panetone.webp",
    "🥒": IMG_DIR + "sym-picles.webp",
    "🔋": IMG_DIR + "sym-pilha.webp",
    "🎃": IMG_DIR + "sym-abobora.webp"
  };
  var symImgOk = {}; // emoji -> true quando a imagem do simbolo carregou
  var SYM_NAME = { "⚡": "WILD", "🍑": "Pêssego", "🍰": "Bolo", "🥒": "Picles", "🔋": "Pilha", "🎃": "Abóbora" };
  var SYM_NAME_IMG = { "⚡": "WILD", "🍑": "Pêssego do Bogão", "🍰": "Panetone", "🥒": "Picles", "🔋": "Pilha", "🎃": "Abóbora" };

  var betInput, statusEl, historyListEl, gridEl, stageEl, stripEls, machineEl, windowEl,
      bannerEl, barBalanceEl, barBetEl, barWinEl, spinBtn, minusBtn, plusBtn, winlinesEl, lineDots, mascotEl,
      menuBtn, turboBtn, infoEl;

  var spinning = false;
  var auto = null; // giro automatico (autospin.js)
  var BET_STEPS = [10, 25, 50, 100, 250, 500, 1000, 2500, 5000];
  var countToken = 0; // invalida contadores de ganho antigos quando um giro novo comeca
  var mascotWinTimer = null;

  /* reacao do mascote (O Menor Quentão): "happy" | "hype" | "sad" | null (repouso).
     A animacao roda uma vez; o humor (boca) e a pose de vitoria ficam ate o proximo giro. */
  function reactMascot(state) {
    if (!mascotEl) return;
    mascotEl.classList.remove("happy", "hype", "sad", "mood-happy", "mood-sad");
    if (state) {
      void mascotEl.offsetWidth;
      mascotEl.classList.add(state, state === "sad" ? "mood-sad" : "mood-happy");
    }
    // com a imagem de vitoria do Codex, o mascote troca de pose enquanto comemora
    clearTimeout(mascotWinTimer);
    var win = state === "happy" || state === "hype";
    mascotEl.classList.toggle("win-pose", win);
    if (win) {
      mascotWinTimer = setTimeout(function () { mascotEl.classList.remove("win-pose"); }, state === "hype" ? 4200 : 2400);
    }
  }

  function setStatus(t) { statusEl.textContent = t; }

  function pick() {
    var r = Math.random() * TOTALW;
    for (var i = 0; i < ALL.length; i++) { r -= ALL[i].weight; if (r <= 0) return ALL[i].icon; }
    return ALL[ALL.length - 1].icon;
  }

  function evalLine(a, b, c) {
    var cells = [a, b, c];
    var nonWild = cells.filter(function (x) { return x !== "⚡"; });
    if (nonWild.length === 0) return PAY["⚡"];
    var f = nonWild[0];
    if (nonWild.every(function (x) { return x === f; })) return PAY[f];
    return 0;
  }

  function countWild(grid) {
    return grid.filter(function (x) { return x === "⚡"; }).length;
  }

  /* Redesenha a grade 3x3 estatica (mesmas colunas do giro), com marcadores
     opcionais: winCells (celulas vencedoras), locked (wilds travados brilhando),
     reroll (celulas que acabaram de re-girar, com animacao de troca). */
  function renderStaticGrid(grid, opts) {
    opts = opts || {};
    var winCells = opts.winCells || {};
    var reroll = opts.reroll || null;
    gridEl.innerHTML = '<div class="ft-col"></div><div class="ft-col"></div><div class="ft-col"></div>';
    for (var c = 0; c < 3; c++) {
      var colEl = gridEl.children[c];
      var html = "";
      for (var r = 0; r < 3; r++) {
        var idx = r * 3 + c;
        var extra = "";
        if (winCells[idx]) extra += " hit";
        if (opts.locked && grid[idx] === "⚡") extra += " locked";
        if (reroll && reroll.indexOf(idx) !== -1) extra += " reroll";
        var cellHtml = cellHTML(grid[idx]);
        if (extra) cellHtml = cellHtml.replace('class="ft-cell', 'class="ft-cell' + extra);
        html += cellHtml;
      }
      colEl.innerHTML = '<div class="ft-strip">' + html + '</div>';
    }
  }

  /* simbolo de cada emoji: imagem do Codex (se carregou) > desenho SVG (icons.js) > emoji */
  var SYM_ART = { "🎃": "s-abobora", "🔋": "s-pilha", "🥒": "s-picles", "🍰": "s-bolo", "🍑": "s-pessego", "⚡": "s-raio" };
  function symArt(icon, size) {
    if (symImgOk[icon]) return '<img class="bzg-icon bz-sym-img" src="' + SYM_IMG[icon] + '" alt="" draggable="false" />';
    return BZG.icons && SYM_ART[icon] ? BZG.icons.art(SYM_ART[icon], size || 64) : icon;
  }
  function symName(icon) { return (symImgOk[icon] ? SYM_NAME_IMG : SYM_NAME)[icon]; }

  /* troca so as celulas indicadas, sem recriar a grade inteira */
  function updateCells(grid, idxs) {
    idxs.forEach(function (idx) {
      var col = gridEl.children[idx % 3];
      var strip = col && col.firstChild;
      var old = strip && strip.children[Math.floor(idx / 3)];
      if (!old) return;
      var tmp = document.createElement("div");
      tmp.innerHTML = cellHTML(grid[idx]);
      var cell = tmp.firstChild;
      cell.classList.add("reroll");
      if (grid[idx] === "⚡") cell.classList.add("locked");
      strip.replaceChild(cell, old);
    });
  }

  function cellHTML(icon) {
    if (icon === "⚡") {
      return '<div class="ft-cell ft-cell-wild" data-s="⚡"><i>' + symArt("⚡") + '</i><em>WILD</em></div>';
    }
    return '<div class="ft-cell" data-s="' + icon + '">' + symArt(icon) + '</div>';
  }

  /* troca os emojis de um texto pelos simbolos desenhados (tabela de premios) */
  function symbolizeText(el) {
    if (!BZG.icons) return;
    Object.keys(SYM_ART).forEach(function (emo) {
      el.innerHTML = el.innerHTML.split(emo).join('<span class="sym-inline" data-sym="' + emo + '">' + symArt(emo, 22) + '</span>');
    });
  }

  /* imagens dos simbolos chegaram: troca a arte de tudo que ja esta na tela */
  function refreshArt() {
    Array.prototype.forEach.call(document.querySelectorAll(".ft-cell[data-s]"), function (cell) {
      var host = cell.classList.contains("ft-cell-wild") ? cell.querySelector("i") : cell;
      if (host) host.innerHTML = symArt(cell.getAttribute("data-s"));
    });
    Array.prototype.forEach.call(document.querySelectorAll(".sym-inline[data-sym]"), function (el) {
      el.innerHTML = symArt(el.getAttribute("data-sym"), 22);
    });
    renderInfo();
  }

  /* suspense: as duas primeiras colunas ja formam meia linha (iguais ou com wild)?
     entao a 3a coluna gira mais devagar, brilhando */
  function teaseLine(grid) {
    return LINES.some(function (ln) {
      var byCol = ln.slice().sort(function (a, b) { return (a % 3) - (b % 3); });
      var a = grid[byCol[0]], b = grid[byCol[1]];
      return a === b || a === "⚡" || b === "⚡";
    });
  }

  /* o ganho sobe contando (na pilula e na faixa) */
  function countUp(el, to) {
    if (!el) return;
    if (el === barWinEl) { el.dataset.final = BZG.ui.formatMoney(to); fitText(el); } // fonte do valor final
    var token = countToken;
    var start = performance.now(), dur = Math.min(1600, 500 + to / 40) * BZG.modes.speed();
    (function step(now) {
      if (token !== countToken) return; // comecou outro giro
      var p = Math.min(1, (now - start) / dur);
      el.textContent = BZG.ui.formatMoney(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(step);
    })(start);
  }

  function easeOutQuart(t) { return 1 - Math.pow(1 - t, 4); }

  /* posicao do rolo no tempo t (0..1): desacelera, passa um pouquinho do ponto
     (overshoot de ~18% de uma celula) e volta macio - parece um rolo de verdade */
  var STOP_AT = 0.86;
  function reelPos(t, dist, cellH) {
    var over = cellH * 0.18;
    if (t < STOP_AT) return (dist + over) * easeOutQuart(t / STOP_AT);
    var k = (t - STOP_AT) / (1 - STOP_AT);
    return dist + over * (1 - (1 - Math.pow(1 - k, 2)));
  }

  function buildStrip(stripEl, colSymbols) {
    var cells = [];
    for (var i = 0; i < STRIP_LEN - 3; i++) cells.push(ALL[Math.floor(Math.random() * ALL.length)].icon);
    cells = cells.concat(colSymbols);
    stripEl.innerHTML = cells.map(cellHTML).join("");
    stripEl.style.transform = "translateY(0px)";
    // altura real da celula (responsiva via CSS). getComputedStyle ignora transformacoes
    // (ex.: a maquina tremendo), entao a medida nao sai torta
    var cellH = parseFloat(getComputedStyle(stripEl.firstChild).height) || stripEl.firstChild.getBoundingClientRect().height;
    return (STRIP_LEN - 3) * cellH;
  }

  /* valor grande demais para a pilula? diminui a fonte so o necessario (sem cortar com "...") */
  function fitText(el) {
    if (!el) return;
    // mede com o valor final (data-final) quando o numero ainda esta subindo
    var shown = el.textContent;
    if (el.dataset.final) el.textContent = el.dataset.final;
    el.style.fontSize = "";
    if (el.scrollWidth > el.clientWidth + 1) {
      var fs = parseFloat(getComputedStyle(el).fontSize) || 14;
      el.style.fontSize = Math.max(9, Math.floor(fs * el.clientWidth / el.scrollWidth * 0.97)) + "px";
    }
    el.textContent = shown;
  }

  function updateBar() {
    barBalanceEl.textContent = BZG.ui.formatMoney(BZG.storage.getBalance());
    barBetEl.textContent = BZG.ui.formatMoney(Math.round(Number(betInput.value)) || 0);
    fitText(barBalanceEl);
    fitText(barBetEl);
  }

  /* ---------- faixa (banner) embaixo dos rolos ---------- */
  function bolt() { return BZG.icons ? BZG.icons.art("s-raio", 26) : "⚡"; }

  function setBanner(state, html) {
    bannerEl.className = "ft-banner";
    if (state) { void bannerEl.offsetWidth; bannerEl.classList.add(state); }
    bannerEl.innerHTML = html;
  }
  /* o conteudo da faixa nao cabe (premio muito alto, tela estreita)? diminui a fonte do
     rotulo e do valor na mesma proporcao, em vez de cortar. Mede sempre com o valor FINAL
     do ganho (data-final), entao a contagem subindo nunca passa da borda. */
  function fitBanner() {
    var kids = Array.prototype.slice.call(bannerEl.children);
    if (!kids.length) return;
    var amt = bannerEl.querySelector(".bz-b-amt");
    var shown = amt ? amt.textContent : "";
    if (amt && amt.dataset.final) amt.textContent = amt.dataset.final;
    kids.forEach(function (k) { k.style.fontSize = ""; });
    var cs = getComputedStyle(bannerEl);
    var room = bannerEl.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) -
      (parseFloat(cs.columnGap) || 0) * (kids.length - 1);
    // offsetWidth ignora o "pop" (scale) do valor; scrollWidth pega a mensagem encolhida
    var need = kids.reduce(function (s, k) { return s + Math.max(k.offsetWidth, k.scrollWidth); }, 0);
    if (need > room && room > 0) {
      var ratio = room / need * 0.97;
      kids.forEach(function (k) {
        k.style.fontSize = (parseFloat(getComputedStyle(k).fontSize) * ratio).toFixed(2) + "px";
      });
    }
    if (amt) amt.textContent = shown;
  }

  function bannerMsg(state, text) {
    setBanner(state, '<span class="bz-b-msg"></span>');
    bannerEl.firstChild.textContent = text;
    fitBanner();
  }
  function bannerIdle() {
    setBanner("", '<span class="bz-b-msg">' + bolt() + '<span>Ganhe até <b>2500x</b>!</span>' + bolt() + '</span>');
    fitBanner();
  }
  /* ganho: rotulo pequeno + valor grande dourado subindo */
  function bannerWin(state, label, payout) {
    setBanner(state, '<span class="bz-b-label"></span><span class="bz-b-amt"></span>');
    var amt = bannerEl.lastChild;
    bannerEl.firstChild.textContent = label;
    amt.dataset.final = BZG.ui.formatMoney(payout);
    amt.textContent = BZG.ui.formatMoney(0);
    fitBanner();
    countUp(amt, payout);
  }

  function clearWinFx() {
    winlinesEl.innerHTML = "";
    lineDots.forEach(function (d) { d.classList.remove("hit"); });
    gridEl.classList.remove("has-win");
    bannerIdle();
  }

  /* linhas vencedoras: contorno escuro + ouro + brilho, uma depois da outra */
  function drawWinLines(winLines) {
    winlinesEl.innerHTML = winLines.map(function (l, i) {
      var co = LINE_COORDS[l];
      var at = ' x1="' + co[0][0] + '" y1="' + co[0][1] + '" x2="' + co[1][0] + '" y2="' + co[1][1] + '"';
      return '<g style="--d:' + (i * 0.14).toFixed(2) + 's">' +
        '<line class="wl-glow"' + at + '/>' +
        '<line class="wl-out" pathLength="100"' + at + '/>' +
        '<line class="wl-in" pathLength="100"' + at + '/>' +
        '<line class="wl-hl" pathLength="100"' + at + '/>' +
        '</g>';
    }).join("");
  }

  function renderHistory() {
    var entries = BZG.storage.getHistory("bazinguinha");
    historyListEl.innerHTML = entries.slice(0, 8).map(function (e) {
      var tagClass = e.won ? "tag--win" : "tag--lose";
      var tagText = e.won ? "GANHOU" : "PERDEU";
      return '<div class="history-row">' +
        '<span class="tag ' + tagClass + '">' + tagText + '</span>' +
        '<span>' + (e.detail || "") + '</span>' +
        '<span>' + BZG.ui.formatMoney(e.payout) + '</span>' +
        '</div>';
    }).join("") || '<p style="color:var(--text-muted); font-size:13px;">Nenhum giro ainda.</p>';
  }

  function stepBet(dir) {
    var current = Math.round(Number(betInput.value)) || 0;
    var next;
    if (dir > 0) {
      next = BET_STEPS.find(function (v) { return v > current; }) || BET_STEPS[BET_STEPS.length - 1];
    } else {
      var lower = BET_STEPS.filter(function (v) { return v < current; });
      next = lower.length ? lower[lower.length - 1] : BET_STEPS[0];
    }
    betInput.value = next;
    updateBar();
    BZG.sounds.click();
  }

  function setControlsLocked(on) {
    betInput.disabled = on;
    spinBtn.disabled = on;
    minusBtn.disabled = on;
    plusBtn.disabled = on;
    if (turboBtn) turboBtn.disabled = on; // trocar o turbo no meio do giro faria os rolos pularem
    spinBtn.classList.toggle("spinning", on);
  }

  function spin() {
    if (spinning) return false;
    var bet = Math.round(Number(betInput.value));
    var balance = BZG.storage.getBalance();
    if (!bet || bet <= 0) { BZG.ui.toast("Digite um valor de aposta válido.", "error"); return false; }
    if (bet > balance) { BZG.ui.toast("Você não tem saldo suficiente.", "error"); return false; }

    spinning = true;
    countToken++;
    setControlsLocked(true);
    clearWinFx();
    machineEl.classList.add("is-spinning");
    barWinEl.textContent = barWinEl.dataset.final = "BZ$ 0";
    fitText(barWinEl);
    bannerMsg("", "Boa sorte! 🍀");
    setStatus("Girando...");
    BZG.sounds.bet();
    if (BZG.sounds.reelStart) BZG.sounds.reelStart();

    // sorteia a grade 3x3 (indice = linha*3 + coluna)
    var grid = [];
    for (var i = 0; i < 9; i++) grid.push(pick());

    // reconstroi as colunas com fitas
    gridEl.innerHTML =
      '<div class="ft-col"><div class="ft-strip" id="fstrip-0"></div></div>' +
      '<div class="ft-col"><div class="ft-strip" id="fstrip-1"></div></div>' +
      '<div class="ft-col"><div class="ft-strip" id="fstrip-2"></div></div>';
    stripEls = [
      document.getElementById("fstrip-0"),
      document.getElementById("fstrip-1"),
      document.getElementById("fstrip-2")
    ];

    var distances = [];
    for (var c = 0; c < 3; c++) {
      distances.push(buildStrip(stripEls[c], [grid[c], grid[3 + c], grid[6 + c]]));
      stripEls[c].classList.add("blur"); // simbolos esticados enquanto gira
    }
    reactMascot(null); // volta o mascote ao repouso ao começar

    var tease = teaseLine(grid);
    var durs = COL_DURATIONS.slice();
    if (tease) durs[2] += 1500; // a 3a coluna demora mais quando pode fechar linha

    var start = performance.now();
    var lastTicks = [0, 0, 0];
    var done = [false, false, false];
    var tension = null, tensionAt = 0; // som de suspense da 3a coluna

    function frame(now) {
      var allDone = true;
      for (var c2 = 0; c2 < 3; c2++) {
        var t = Math.min(1, (now - start) / (durs[c2] * BZG.modes.speed()));
        var cellH = distances[c2] / (STRIP_LEN - 3);
        var pos = reelPos(t, distances[c2], cellH);
        stripEls[c2].style.transform = "translate3d(0,-" + pos.toFixed(1) + "px,0)";
        var crossed = Math.floor(pos / cellH);
        if (crossed > lastTicks[c2] && t < 1) {
          if (c2 === 0 || (tease && c2 === 2 && done[1])) BZG.sounds.reelTick();
          lastTicks[c2] = crossed;
        }
        if (t >= STOP_AT && !done[c2]) {
          done[c2] = true;
          BZG.sounds.reelStop(c2);
          if (c2 === 2 && tension) { tension.stop(0.25); tension = null; }
          stripEls[c2].classList.remove("blur");       // simbolo volta ao normal ao parar
          var col = stripEls[c2].parentElement;         // clarao de "quique" na coluna
          if (col) { col.classList.remove("bump", "tease"); void col.offsetWidth; col.classList.add("bump"); }
          // 2a coluna parou e pode sair linha: a 3a brilha e a faixa faz suspense
          if (c2 === 1 && tease && stripEls[2]) {
            stripEls[2].parentElement.classList.add("tease");
            bannerMsg("tease", "Será?! 👀");
            // suspense: tom subindo ate a 3a coluna parar
            tension = BZG.sounds.tensionStart();
            tensionAt = now;
          }
        }
        if (t < 1) allDone = false;
      }
      if (tension) tension.set(Math.min(1, (now - tensionAt) / (1500 * BZG.modes.speed())));
      if (allDone && tension) { tension.stop(0.2); tension = null; }
      if (allDone) maybeRespin(grid, bet);
      else requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* Apos o giro cair: se ha wild(s) e a tela nao esta cheia, entra no respin
     grudento - trava os wilds e re-gira o resto, encadeando enquanto surgir
     wild novo. Quando parar, avalia o resultado em finish(). */
  function maybeRespin(grid, bet) {
    var wc = countWild(grid);
    if (wc < 1 || wc >= 9) { finish(grid, bet); return; }
    bannerMsg("respin", "⚡ WILD TRAVADO! Re-girando…");
    setStatus("Wild grudento! Re-girando os outros símbolos…");
    renderStaticGrid(grid, { locked: true });
    BZG.sounds.wildLock();
    BZG.sounds.roar();
    var sp = BZG.modes.speed();
    setTimeout(function () { respinRound(grid, bet, 1); }, 520 * sp);
  }

  function respinRound(grid, bet, round) {
    var before = countWild(grid);
    var changed = [];
    var newWild = false;
    for (var j = 0; j < 9; j++) {
      if (grid[j] !== "⚡") {
        grid[j] = pick();
        changed.push(j);
        if (grid[j] === "⚡") newWild = true;
      }
    }
    var wc = countWild(grid);
    updateCells(grid, changed);
    BZG.sounds.respin();
    BZG.sounds.reelStop(1);

    var sp = BZG.modes.speed();
    var again = newWild && wc < 9 && round < MAX_RESPINS;
    if (newWild) {
      var gained = wc - before;
      bannerMsg("respin", "⚡ +" + gained + " WILD! Re-girando…");
      BZG.sounds.wildLock();
      BZG.effects.flash(stageEl, "gold");
      reactMascot("happy"); // O Menor Quentão se anima a cada wild novo
    }
    setTimeout(function () {
      if (again) respinRound(grid, bet, round + 1);
      else finish(grid, bet);
    }, (newWild ? 720 : 560) * sp);
  }

  function finish(grid, bet) {
    // avalia as 5 linhas
    var totalPay = 0;
    var winLines = [];
    var winCells = {};
    for (var l = 0; l < LINES.length; l++) {
      var ln = LINES[l];
      var p = evalLine(grid[ln[0]], grid[ln[1]], grid[ln[2]]);
      if (p > 0) {
        totalPay += p;
        winLines.push(l);
        winCells[ln[0]] = winCells[ln[1]] = winCells[ln[2]] = true;
      }
    }

    // tela cheia: todos os 9 sao o mesmo simbolo (wild vale como qualquer)
    var nonWild = grid.filter(function (x) { return x !== "⚡"; });
    var fullScreen = totalPay > 0 && (nonWild.length === 0 ||
      nonWild.every(function (x) { return x === nonWild[0]; }));
    if (fullScreen) totalPay *= 10;

    var payout = Math.round(bet * totalPay);
    var won = payout > 0;

    // grade final estatica: celulas vencedoras brilham, wilds ficam realcados
    machineEl.classList.remove("is-spinning");
    renderStaticGrid(grid, { winCells: winCells, locked: true });
    if (won) gridEl.classList.add("has-win");

    // desenha as linhas vencedoras e acende os numeros das linhas
    drawWinLines(winLines);
    lineDots.forEach(function (d) {
      if (winLines.indexOf(Number(d.dataset.line)) !== -1) d.classList.add("hit");
    });

    BZG.storage.recordBet("bazinguinha", {
      bet: bet, multiplier: totalPay, payout: payout, won: won,
      detail: won ? (totalPay.toFixed(2) + "x" + (fullScreen ? " 💥 TELA CHEIA" : "")) : "sem linha"
    });
    BZG.ui.refreshBalance();
    document.dispatchEvent(new CustomEvent("bzg:balance-changed"));
    renderHistory();

    if (won) {
      countUp(barWinEl, payout);
      if (totalPay >= 5) BZG.effects.shake(machineEl);
      var bigWin = fullScreen || totalPay >= 15 || payout >= 25000;
      if (fullScreen) {
        bannerWin("fullscreen", "💥 Tela cheia ×10", payout);
        BZG.sounds.roar();
        BZG.effects.bigWin(payout, totalPay);
      } else {
        bannerWin("win", "Ganho", payout);
        if (bigWin) {
          BZG.sounds.roar();
          BZG.effects.bigWin(payout, totalPay);
        }
      }
      reactMascot(bigWin ? "hype" : "happy"); // O Menor Quentão comemora
      setStatus("Você ganhou " + BZG.ui.formatMoney(payout) + " (" + totalPay.toFixed(2) + "x)!");
      BZG.ui.toast("🔥 +" + BZG.ui.formatMoney(payout) + " (" + totalPay.toFixed(2) + "x)", "success");
      BZG.sounds.winFor(totalPay);
      BZG.effects.flash(stageEl, "gold");
      var rect = windowEl.getBoundingClientRect();
      BZG.effects.confetti(rect.left + rect.width / 2, rect.top + rect.height / 2, totalPay >= 10 ? 110 : 55);
    } else {
      bannerMsg("lose", "Quase! Gire de novo 🔥");
      reactMascot("sad"); // O Menor Quentão fica de nariz torto
      setStatus("Não formou linha. Tente outra vez!");
      BZG.sounds.lose();
    }

    spinning = false;
    setControlsLocked(false);
    if (auto) auto.done(true);
  }

  function quickBet(fn) {
    var current = Number(betInput.value) || 0;
    betInput.value = Math.max(1, Math.round(fn(current, BZG.storage.getBalance())));
    updateBar();
  }

  /* ---------- folha de premios/regras e pergaminhos laterais ---------- */
  function payListHTML() {
    var order = [WILD].concat(SYMBOLS.slice().reverse()); // do maior para o menor premio
    return '<ul class="bz-paylist">' + order.map(function (s) {
      return '<li><span class="bz-pl-art">' + symArt(s.icon, 40) + '</span>' +
        '<span class="bz-pl-name">' + symName(s.icon) + '</span><b>' + s.pay + 'x</b></li>';
    }).join("") + '</ul>';
  }

  function linesHTML() {
    return '<div class="bz-lines">' + LINES.map(function (ln, i) {
      var cells = "";
      for (var k = 0; k < 9; k++) cells += '<i' + (ln.indexOf(k) !== -1 ? ' class="on"' : '') + '></i>';
      return '<div class="bz-line"><span class="bz-line-n">' + (i + 1) + '</span><div class="bz-mini">' + cells + '</div></div>';
    }).join("") + '</div>';
  }

  var FULL_NOTE = '<p class="bz-note">💥 Tela cheia do mesmo símbolo: <strong>ganho ×10</strong></p>';
  var WILD_RULE = '<p class="bz-rules">O <strong>WILD</strong> substitui qualquer símbolo. Caiu um? Ele ' +
    '<strong>trava</strong> e os outros re-giram de graça; se vier outro WILD, gira de novo, até a tela encher.</p>';

  function renderInfo() {
    var body = document.getElementById("bz-info-body");
    if (body) {
      body.innerHTML = '<h3 class="bz-sec-title">Prêmios por linha</h3><p class="bz-sub">3 iguais na mesma linha</p>' + payListHTML() + FULL_NOTE +
        '<h3 class="bz-sec-title">As 5 linhas</h3>' + linesHTML() +
        '<h3 class="bz-sec-title">WILD grudento</h3>' + WILD_RULE;
    }
    var left = document.getElementById("bz-board-left");
    if (left) left.innerHTML = '<h3 class="bz-sec-title">5 linhas</h3>' + linesHTML() + '<h3 class="bz-sec-title">WILD grudento</h3>' + WILD_RULE;
    var right = document.getElementById("bz-board-right");
    if (right) right.innerHTML = '<h3 class="bz-sec-title">Prêmios</h3><p class="bz-sub">3 iguais na mesma linha</p>' + payListHTML() + FULL_NOTE;
  }

  function openInfo() {
    infoEl.hidden = false;
    menuBtn.setAttribute("aria-expanded", "true");
    var closeBtn = document.getElementById("bz-info-close");
    if (closeBtn) closeBtn.focus();
  }
  function closeInfo(restoreFocus) {
    if (!infoEl || infoEl.hidden) return;
    infoEl.hidden = true;
    menuBtn.setAttribute("aria-expanded", "false");
    if (restoreFocus) menuBtn.focus();
  }

  /* pergaminhos so aparecem quando sobra largura dos dois lados da maquina;
     a largura deles acompanha o espaco livre (no maximo 236 unidades da maquina) */
  function fitBoards() {
    if (!machineEl || !stageEl) return;
    var mw = machineEl.offsetWidth, u = mw / 500;
    machineEl.classList.toggle("is-compact", mw < 455); // pilulas sem icone na maquina pequena
    updateBar(); // a maquina mudou de tamanho: reajusta os valores das pilulas e a faixa
    fitText(barWinEl);
    fitBanner();
    var side = (stageEl.clientWidth - mw) / 2;     // espaco livre de cada lado
    var bw = Math.min(236 * u, side - 54 * u);     // 40u de folga da maquina + 14u da borda
    var ok = window.innerWidth > 980 && bw >= 180;
    stageEl.classList.toggle("is-wide", ok);
    if (ok) stageEl.style.setProperty("--bw", bw.toFixed(1) + "px");
  }

  /* ---------- botao de turbo ---------- */
  function syncTurbo() {
    if (!turboBtn) return;
    var unlocked = !!(BZG.storage.isTurboUnlocked && BZG.storage.isTurboUnlocked());
    var on = !!(BZG.storage.isTurboOn && BZG.storage.isTurboOn());
    turboBtn.classList.toggle("is-unlocked", unlocked);
    turboBtn.setAttribute("aria-pressed", on ? "true" : "false");
    turboBtn.title = unlocked ? (on ? "Modo Turbo ligado" : "Modo Turbo desligado") : "Modo Turbo (desbloqueie no Passe de Batalha)";
  }
  function toggleTurbo() {
    BZG.sounds.click();
    if (!(BZG.storage.isTurboUnlocked && BZG.storage.isTurboUnlocked())) {
      BZG.ui.toast("🔒 O Modo Turbo é desbloqueado no Passe de Batalha.", "info");
      return;
    }
    var on = BZG.storage.setTurboOn(!BZG.storage.isTurboOn());
    syncTurbo();
    BZG.ui.toast(on ? "⚡ Turbo ligado: giros mais rápidos!" : "Turbo desligado.", "info");
  }

  /* ---------- cenario: particulas douradas subindo ---------- */
  function buildParticles() {
    var box = document.getElementById("bz-particles");
    if (!box) return;
    var html = "";
    for (var i = 0; i < 18; i++) {
      html += '<span class="bz-p" style="--x:' + (3 + Math.random() * 94).toFixed(1) + '%;' +
        '--s:' + (3 + Math.random() * 5).toFixed(1) + 'px;' +
        '--t:' + (7 + Math.random() * 7).toFixed(1) + 's;' +
        '--d:-' + (Math.random() * 14).toFixed(1) + 's;' +
        '--dx:' + Math.round((Math.random() - 0.5) * 120) + 'px"></span>';
    }
    box.innerHTML = html;
  }

  /* ---------- imagens do Codex: trocam sozinhas quando existirem ---------- */
  function absUrl(p) {
    try { return new URL(p, document.baseURI).href; } catch (e) { return p; }
  }

  function loadImages() {
    if (!BZG.assets) return;
    var list = [IMG.fundo, IMG.logo, IMG.topo, IMG.mascote, IMG.mascoteWin];
    Object.keys(SYM_IMG).forEach(function (k) { list.push(SYM_IMG[k]); });
    BZG.assets.preload(list, function (ok) {
      if (ok[IMG.fundo]) {
        var scene = document.getElementById("bz-scene");
        scene.style.setProperty("--bz-fundo", 'url("' + absUrl(IMG.fundo) + '")');
        scene.classList.add("has-img");
      }
      if (ok[IMG.logo]) {
        Array.prototype.forEach.call(document.querySelectorAll("[data-bz-logo]"), function (el) {
          el.insertAdjacentHTML("afterbegin", '<img class="bz-logo-img" src="' + IMG.logo + '" alt="Bazinguinha" />');
          el.classList.add("has-img");
        });
      }
      if (ok[IMG.topo]) {
        var roof = document.getElementById("bz-roof");
        roof.insertAdjacentHTML("afterbegin", '<img class="bz-roof-img" src="' + IMG.topo + '" alt="" />');
        roof.classList.add("has-img");
      }
      if (ok[IMG.mascote] && mascotEl) {
        mascotEl.insertAdjacentHTML("beforeend",
          '<img class="mq-img mq-img--idle" src="' + IMG.mascote + '" alt="" />' +
          (ok[IMG.mascoteWin] ? '<img class="mq-img mq-img--win" src="' + IMG.mascoteWin + '" alt="" />' : ""));
        mascotEl.classList.add("has-img");
        document.getElementById("bz-mascot").classList.add("has-img");
      }
      var anySym = false;
      Object.keys(SYM_IMG).forEach(function (k) {
        if (ok[SYM_IMG[k]]) { symImgOk[k] = true; anySym = true; }
      });
      if (anySym) refreshArt();
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    betInput = document.getElementById("bet-amount");
    statusEl = document.getElementById("round-status");
    historyListEl = document.getElementById("history-list");
    gridEl = document.getElementById("ft-grid");
    stageEl = document.getElementById("tiger-stage");
    machineEl = document.getElementById("ft-machine");
    windowEl = gridEl.parentElement;
    bannerEl = document.getElementById("ft-banner");
    barBalanceEl = document.getElementById("ft-balance");
    barBetEl = document.getElementById("ft-bet");
    barWinEl = document.getElementById("ft-win");
    spinBtn = document.getElementById("ft-spin");
    minusBtn = document.getElementById("ft-minus");
    plusBtn = document.getElementById("ft-plus");
    winlinesEl = document.getElementById("ft-winlines");
    lineDots = Array.prototype.slice.call(document.querySelectorAll(".ft-line-dot"));
    mascotEl = document.getElementById("mq-mascot");
    menuBtn = document.getElementById("bz-menu");
    turboBtn = document.getElementById("bz-turbo");
    infoEl = document.getElementById("bz-info");

    // grade inicial aleatoria
    for (var c = 0; c < 3; c++) {
      var html = "";
      for (var r = 0; r < 3; r++) html += cellHTML(ALL[Math.floor(Math.random() * ALL.length)].icon);
      document.getElementById("fstrip-" + c).innerHTML = html;
    }

    bannerIdle();
    buildParticles();
    renderInfo();
    syncTurbo();
    fitBoards();
    if (window.ResizeObserver) new ResizeObserver(fitBoards).observe(stageEl);
    else window.addEventListener("resize", fitBoards);

    // a reacao do mascote roda uma vez e ele volta a balancar (o humor fica na boca)
    mascotEl.addEventListener("animationend", function (e) {
      if (e.target === mascotEl && /^mq-(happy|hype|sad)$/.test(e.animationName)) {
        mascotEl.classList.remove("happy", "hype", "sad");
      }
    });

    BZG.ui.refreshBalance();
    renderHistory();
    updateBar();
    // a fonte do site pode chegar depois: reajusta os valores das pilulas e a faixa
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitBoards);

    spinBtn.addEventListener("click", function () { if (auto) auto.stop(); closeInfo(false); spin(); });
    var autoEl = document.getElementById("autospin");
    if (autoEl && BZG.autospin) auto = BZG.autospin.create(autoEl, spin);
    Array.prototype.forEach.call(document.querySelectorAll(".paytable-row span, #round-status"), symbolizeText);
    minusBtn.addEventListener("click", function () { stepBet(-1); });
    plusBtn.addEventListener("click", function () { stepBet(1); });
    betInput.addEventListener("input", updateBar);
    document.addEventListener("bzg:balance-changed", updateBar);

    menuBtn.addEventListener("click", function () {
      BZG.sounds.click();
      if (infoEl.hidden) openInfo(); else closeInfo(true);
    });
    document.getElementById("bz-info-close").addEventListener("click", function () { closeInfo(true); });
    turboBtn.addEventListener("click", toggleTurbo);

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && infoEl && !infoEl.hidden) { closeInfo(true); return; }
      // barra de espaco gira (quando o foco nao esta num campo ou botao)
      if (e.key === " " || e.key === "Spacebar") {
        var tag = (e.target && e.target.tagName) || "";
        if (/^(INPUT|TEXTAREA|SELECT|BUTTON|SUMMARY|A)$/.test(tag) || (e.target && e.target.isContentEditable)) return;
        if (document.querySelector(".bigwin-overlay")) return;
        e.preventDefault();
        if (auto) auto.stop();
        closeInfo(false);
        spin();
      }
    });

    document.getElementById("bet-half").addEventListener("click", function () { quickBet(function (v) { return v / 2; }); });
    document.getElementById("bet-double").addEventListener("click", function () { quickBet(function (v) { return v * 2; }); });
    document.getElementById("bet-max").addEventListener("click", function () { quickBet(function (v, b) { return b; }); });

    loadImages();
  });
})();
