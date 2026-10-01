/* Bazinga BET - efeitos sonoros (Web Audio API, tudo sintetizado, sem arquivos
   externos) e musica ambiente (video do YouTube em loop, escondido - so o audio
   conta). A musica ambiente e a UNICA parte do site que depende de internet: sem
   conexao, os efeitos sonoros e o resto do site continuam funcionando 100%
   local, so a musica de fundo nao toca.

   Grafo dos efeitos:
     cada som (voz) -> barramento seco ----------------------\
                    -> envio de reverb -> convolver -> retorno -> compressor -> limitador -> volume -> saida
   - o compressor + limitador seguram o pico quando muitos sons tocam juntos;
   - o reverb e um impulso de ruido decaindo, gerado na hora (mix baixo);
   - toda voz desconecta seus nos sozinha quando o ultimo oscilador termina. */
window.BZG = window.BZG || {};

BZG.sounds = (function () {
  var ctx = null;
  var sfxOn = true;
  var musicOn = true;
  var sfxVolPct = 70;   // 0-100: volume dos efeitos
  var musicVolPct = 25; // 0-100: volume da musica (25 = volume antigo fixo do YouTube)

  function clampPct(v, def) {
    v = Math.round(Number(v));
    if (isNaN(v)) return def;
    return Math.max(0, Math.min(100, v));
  }

  /* preferencias salvas (migra o antigo botao unico de mudo, se existir) */
  try {
    var legacyMuted = localStorage.getItem("bzgMuted") === "1";
    sfxOn = localStorage.getItem("bzgSfx") !== null
      ? localStorage.getItem("bzgSfx") !== "off"
      : !legacyMuted;
    musicOn = localStorage.getItem("bzgMusic") !== null
      ? localStorage.getItem("bzgMusic") !== "off"
      : !legacyMuted;
    if (localStorage.getItem("bzgSfxVol") !== null) sfxVolPct = clampPct(localStorage.getItem("bzgSfxVol"), 70);
    if (localStorage.getItem("bzgMusicVol") !== null) musicVolPct = clampPct(localStorage.getItem("bzgMusicVol"), 25);
  } catch (e) {}

  function noop() {}

  /* ---------- Politica de autoplay: nada toca antes da 1a interacao ---------- */

  var unlocked = false;

  function hasActivation(w) {
    try {
      return !!(w.navigator.userActivation && w.navigator.userActivation.hasBeenActive);
    } catch (e) { return false; }
  }

  function canPlay() {
    if (unlocked) return true;
    // dentro da moldura: a interacao em paginas anteriores conta (ativacao da moldura)
    if (hasActivation(window) || (window.parent !== window && hasActivation(window.parent))) unlocked = true;
    return unlocked;
  }

  function onUserGesture() {
    unlocked = true;
    // cria o contexto ja no primeiro toque: o compressor leva ~0.15s para "aquecer"
    // e assim o primeiro som (o clique logo em seguida) nao sai abafado
    if (!ctx && sfxOn) { try { getContext(); } catch (e) {} }
    else if (ctx && ctx.state === "suspended" && !document.hidden) safeResume();
  }
  ["pointerdown", "keydown", "touchstart"].forEach(function (ev) {
    document.addEventListener(ev, onUserGesture, true);
  });

  // aba escondida: pausa o audio (loops continuos nao ficam tocando em segundo plano)
  document.addEventListener("visibilitychange", function () {
    if (!ctx) return;
    try {
      if (document.hidden) { var p = ctx.suspend(); if (p && p.catch) p.catch(noop); }
      else if (unlocked) safeResume();
    } catch (e) {}
  });

  function safeResume() {
    try { var p = ctx.resume(); if (p && p.catch) p.catch(noop); } catch (e) {}
  }

  /* ---------- Motor ---------- */

  var busDry = null, busRev = null, masterGain = null;
  var noiseBuf = null;
  var MAX_VOICES = 48;
  var live = 0;          // vozes tocando agora
  var playCount = 0;     // total de sons disparados (usado para "so toca se ninguem tocou")
  var lastPlayAt = 0;    // quando o ultimo som foi disparado (ms)
  var stats = { voices: 0, released: 0, sources: 0, ended: 0 };
  var loops = [];        // sons continuos ativos (bolinha, motor, tensao)

  // curva perceptiva: 70% ~ 0.59 de ganho; 100% = 1
  function volCurve(pct) {
    var x = pct / 100;
    return x <= 0 ? 0.0001 : Math.pow(x, 1.5);
  }

  function getContext() {
    if (!ctx) {
      var AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      ctx = new AudioCtx();
      buildGraph();
    }
    if (ctx.state === "suspended" && !document.hidden) safeResume();
    return ctx;
  }

  function buildGraph() {
    var c = ctx;
    // compressor suave (cola os sons) + limitador (segura picos)
    var comp = c.createDynamicsCompressor();
    comp.threshold.value = -20;
    comp.knee.value = 12;
    comp.ratio.value = 4;
    comp.attack.value = 0.004;
    comp.release.value = 0.25;
    var trim = c.createGain();
    trim.gain.value = 0.6; // compensa o ganho automatico do compressor
    var limiter = c.createDynamicsCompressor();
    limiter.threshold.value = -3;
    limiter.knee.value = 0;
    limiter.ratio.value = 20;
    limiter.attack.value = 0.001;
    limiter.release.value = 0.12;
    masterGain = c.createGain();
    masterGain.gain.value = volCurve(sfxVolPct);

    busDry = c.createGain();
    busRev = c.createGain();
    var conv = c.createConvolver();
    conv.buffer = makeImpulse(c, 1.7, 3.2);
    var revReturn = c.createGain();
    revReturn.gain.value = 0.28;

    busDry.connect(comp);
    busRev.connect(conv);
    conv.connect(revReturn);
    revReturn.connect(comp);
    comp.connect(trim);
    trim.connect(limiter);
    limiter.connect(masterGain);
    masterGain.connect(c.destination);

    // ruido branco compartilhado (2s) para chiados, explosoes e raspadas
    var len = Math.floor(c.sampleRate * 2);
    noiseBuf = c.createBuffer(1, len, c.sampleRate);
    var d = noiseBuf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }

  // impulso estereo de ruido decaindo exponencialmente (sala pequena/media)
  function makeImpulse(c, seconds, decay) {
    var rate = c.sampleRate;
    var len = Math.floor(rate * seconds);
    var buf = c.createBuffer(2, len, rate);
    for (var ch = 0; ch < 2; ch++) {
      var data = buf.getChannelData(ch);
      var last = 0;
      for (var i = 0; i < len; i++) {
        // ruido levemente filtrado (passa-baixa de 1 polo) para o reverb nao chiar
        last = last * 0.6 + (Math.random() * 2 - 1) * 0.4;
        data[i] = last * Math.pow(1 - i / len, decay);
      }
    }
    return buf;
  }

  function ready() {
    if (!sfxOn || !canPlay()) return null;
    var c = null;
    try { c = getContext(); } catch (e) { return null; }
    if (!c || !busDry) return null;
    return c;
  }

  /* pequena variacao aleatoria de afinacao (em cents) para nao soar repetitivo */
  function vary(cents) {
    return Math.pow(2, ((Math.random() * 2 - 1) * (cents || 0)) / 1200);
  }

  function midi(m) { return 440 * Math.pow(2, (m - 69) / 12); }

  // escala pentatonica maior a partir de uma nota base (degraus sempre "bonitos")
  var PENTA = [0, 2, 4, 7, 9];
  function penta(step, base) {
    step = Math.max(0, Math.floor(step));
    return midi((base || 72) + 12 * Math.floor(step / 5) + PENTA[step % 5]);
  }

  function nowMs() {
    return (window.performance && performance.now) ? performance.now() : Date.now();
  }

  // limitacao de frequencia por chave (ticks muito rapidos)
  var gates = {};
  function gate(key, ms) {
    var now = nowMs();
    if (gates[key] && now - gates[key] < ms) return false;
    gates[key] = now;
    return true;
  }

  /* Voz: um grupo de nos que tocam juntos e se desconectam juntos no fim.
     o: { g: ganho, delay: s, pan: -1..1, rev: envio de reverb, pitch: fator, must: ignora limite } */
  function voice(o) {
    o = o || {};
    var c = ready();
    if (!c) return null;
    if (live >= MAX_VOICES && !o.must) return null;
    var out = c.createGain();
    out.gain.value = o.g != null ? o.g : 1;
    var v = {
      c: c, t: c.currentTime + 0.008 + (o.delay || 0), out: out, nodes: [out],
      sources: [], srcs: 0, dead: false, loop: !!o.loop, pitch: o.pitch || 1
    };
    var last = out;
    if (o.pan && c.createStereoPanner) {
      var p = c.createStereoPanner();
      p.pan.value = Math.max(-1, Math.min(1, o.pan));
      out.connect(p);
      v.nodes.push(p);
      last = p;
    }
    last.connect(busDry);
    if (o.rev) {
      var s = c.createGain();
      s.gain.value = o.rev;
      last.connect(s);
      s.connect(busRev);
      v.nodes.push(s);
    }
    live++;
    playCount++;
    lastPlayAt = nowMs();
    stats.voices++;
    return v;
  }

  function release(v) {
    if (v.dead) return;
    v.dead = true;
    live--;
    stats.released++;
    for (var i = 0; i < v.nodes.length; i++) {
      try { v.nodes[i].disconnect(); } catch (e) {}
    }
    v.nodes.length = 0;
    v.sources.length = 0;
  }

  // registra uma fonte (oscilador/ruido) na voz: inicia, agenda o fim e limpa sozinha
  function addSource(v, node, t0, t1) {
    v.srcs++;
    stats.sources++;
    v.nodes.push(node);
    v.sources.push(node);
    node.onended = function () {
      stats.ended++;
      v.srcs--;
      if (v.srcs <= 0) release(v);
    };
    node.start(t0);
    if (t1 != null) node.stop(t1);
  }

  function play(o, build) {
    var v = voice(o);
    if (!v) return null;
    try { build(v); } catch (e) {}
    if (v.srcs === 0) release(v);
    return v;
  }

  /* envelope ADSR num AudioParam. o: a, d, s (fracao do pico), hold, r, g (pico).
     Retorna o instante em que o som termina. */
  function adsr(param, t, o) {
    var a = o.a != null ? o.a : 0.005;
    var d = o.d != null ? o.d : 0.08;
    var s = o.s != null ? o.s : 0.001;
    var hold = o.hold || 0;
    var r = o.r != null ? o.r : 0.05;
    var g = Math.max(0.0002, o.g != null ? o.g : 0.2);
    var sus = Math.max(0.0001, g * s);
    param.setValueAtTime(0.0001, t);
    param.exponentialRampToValueAtTime(g, t + a);
    param.exponentialRampToValueAtTime(sus, t + a + d);
    if (hold > 0) param.setValueAtTime(sus, t + a + d + hold);
    param.exponentialRampToValueAtTime(0.0001, t + a + d + hold + r);
    return t + a + d + hold + r;
  }

  function makeFilter(c, type, f, q) {
    var flt = c.createBiquadFilter();
    flt.type = type;
    flt.frequency.value = f;
    if (q != null) flt.Q.value = q;
    return flt;
  }

  /* oscilador com envelope. o: type, f, f2 (sweep), glide, lin, at, detune,
     lp/hp/bp (filtro), q, lp2 (sweep do filtro), plus os campos do ADSR */
  function osc(v, o) {
    var c = v.c, t = v.t + (o.at || 0);
    var node = c.createOscillator();
    node.type = o.type || "sine";
    var f = Math.max(20, (o.f || 440) * v.pitch);
    node.frequency.setValueAtTime(f, t);
    if (o.f2) {
      var f2 = Math.max(20, o.f2 * v.pitch);
      var tg = t + (o.glide != null ? o.glide : 0.1);
      if (o.lin) node.frequency.linearRampToValueAtTime(f2, tg);
      else node.frequency.exponentialRampToValueAtTime(f2, tg);
    }
    if (o.detune) node.detune.value = o.detune;
    var g = c.createGain();
    var end = adsr(g.gain, t, o);
    var src = node;
    var ft = o.lp ? "lowpass" : (o.hp ? "highpass" : (o.bp ? "bandpass" : null));
    if (ft) {
      var flt = makeFilter(c, ft, o.lp || o.hp || o.bp, o.q);
      if (o.lp2) flt.frequency.exponentialRampToValueAtTime(o.lp2, t + (o.fglide || (end - t)));
      node.connect(flt);
      v.nodes.push(flt);
      src = flt;
    }
    src.connect(g);
    g.connect(o.dest || v.out);
    v.nodes.push(g);
    addSource(v, node, t, end + 0.03);
    return node;
  }

  /* ruido filtrado com envelope. o: ft (tipo do filtro), f, f2 (sweep), q, at, + ADSR */
  function noise(v, o) {
    var c = v.c, t = v.t + (o.at || 0);
    var src = c.createBufferSource();
    src.buffer = noiseBuf;
    src.loop = true;
    if (o.rate) src.playbackRate.value = o.rate;
    var flt = makeFilter(c, o.ft || "bandpass", o.f || 2000, o.q != null ? o.q : 1);
    if (o.f2) flt.frequency.exponentialRampToValueAtTime(o.f2, t + (o.glide != null ? o.glide : 0.2));
    var g = c.createGain();
    var end = adsr(g.gain, t, o);
    src.connect(flt);
    flt.connect(g);
    g.connect(o.dest || v.out);
    v.nodes.push(flt, g);
    addSource(v, src, t, end + 0.03);
    return src;
  }

  /* sino FM (moedas, sininhos): portadora + moduladora com indice decaindo */
  function bell(v, o) {
    var c = v.c, t = v.t + (o.at || 0);
    var f = (o.f || 1760) * v.pitch;
    var dur = o.dur || 0.5;
    var car = osc(v, { f: f / v.pitch, at: o.at, a: 0.002, d: dur, s: 0.001, r: 0.04, g: o.g || 0.1, dest: o.dest });
    var mod = c.createOscillator();
    mod.frequency.value = f * (o.ratio || 3.5);
    var mg = c.createGain();
    var idx = f * (o.index || 1.6);
    mg.gain.setValueAtTime(idx, t);
    mg.gain.exponentialRampToValueAtTime(Math.max(1, idx * 0.05), t + dur * 0.7);
    mod.connect(mg);
    mg.connect(car.frequency);
    v.nodes.push(mg);
    addSource(v, mod, t, t + dur + 0.08);
    return car;
  }

  /* metal "brass": duas serras levemente desafinadas com filtro que abre e fecha */
  function brass(v, o) {
    var c = v.c, t = v.t + (o.at || 0);
    var f = o.f * v.pitch;
    var dur = o.dur || 0.4;
    var flt = makeFilter(c, "lowpass", f * 1.5, 1.2);
    flt.frequency.setValueAtTime(f * 1.5, t);
    flt.frequency.exponentialRampToValueAtTime(Math.min(16000, f * (o.bright || 6)), t + 0.06);
    flt.frequency.exponentialRampToValueAtTime(Math.min(16000, f * 2.5), t + dur);
    v.nodes.push(flt);
    var mix = c.createGain();
    var end = adsr(mix.gain, t, { a: o.a || 0.03, d: 0.12, s: 0.7, hold: Math.max(0, dur - 0.15), r: o.r || 0.25, g: o.g || 0.08 });
    flt.connect(mix);
    mix.connect(o.dest || v.out);
    v.nodes.push(mix);
    [-7, 7].forEach(function (cents) {
      var n = c.createOscillator();
      n.type = "sawtooth";
      n.frequency.value = f;
      n.detune.value = cents;
      n.connect(flt);
      addSource(v, n, t, end + 0.03);
    });
  }

  /* tambor (tom/timpano): seno com queda de afinacao + ataque de ruido */
  function drum(v, o) {
    var f = o.f || 90;
    osc(v, { type: "sine", f: f * 1.6, f2: f, glide: 0.07, at: o.at, a: 0.002, d: o.dur || 0.45, s: 0.001, r: 0.05, g: o.g || 0.3 });
    noise(v, { ft: "lowpass", f: o.nf || 1800, q: 0.7, at: o.at, a: 0.001, d: 0.05, s: 0.001, r: 0.02, g: (o.g || 0.3) * 0.35 });
  }

  // prato: ruido agudo com cauda longa
  function cymbal(v, o) {
    noise(v, { ft: "highpass", f: o.f || 6000, q: 0.5, at: o.at, a: 0.003, d: o.dur || 1.2, s: 0.001, r: 0.1, g: o.g || 0.05 });
  }

  /* som continuo controlavel: retorna { set(x), stop(fade) }. build(v) monta os nos
     e devolve uma funcao set(x). Sem audio, devolve um controle "mudo". */
  var DUMMY_LOOP = { set: noop, stop: noop, alive: false };
  function makeLoop(o, build) {
    var v = voice({ g: 0.0001, loop: true, rev: o.rev, must: true });
    if (!v) return DUMMY_LOOP;
    var setter = noop;
    try { setter = build(v) || noop; } catch (e) {}
    if (v.srcs === 0) { release(v); return DUMMY_LOOP; }
    var stopped = false;
    var handle = {
      alive: true,
      set: function (x) {
        if (stopped || v.dead) return;
        try { setter(x, v.c.currentTime); } catch (e) {}
      },
      stop: function (fade) {
        if (stopped) return;
        stopped = true;
        handle.alive = false;
        var i = loops.indexOf(handle);
        if (i !== -1) loops.splice(i, 1);
        if (v.dead) return;
        var now = v.c.currentTime, f = fade != null ? fade : 0.15;
        try {
          v.out.gain.cancelScheduledValues(now);
          v.out.gain.setValueAtTime(Math.max(0.0001, v.out.gain.value), now);
          v.out.gain.exponentialRampToValueAtTime(0.0001, now + f);
        } catch (e) {}
        v.sources.slice().forEach(function (s) { try { s.stop(now + f + 0.03); } catch (e) {} });
      }
    };
    // entra suave
    try {
      v.out.gain.setValueAtTime(0.0001, v.t);
      v.out.gain.exponentialRampToValueAtTime(o.g || 0.1, v.t + (o.fadeIn || 0.08));
    } catch (e) {}
    loops.push(handle);
    return handle;
  }

  function stopAllLoops() {
    loops.slice().forEach(function (h) { h.stop(0.05); });
  }

  /* toca fn() no proximo instante SO se nenhum outro som tiver sido disparado
     desde agora (evita duplicar o som que o jogo ja tocou no mesmo clique).
     recentMs: tambem desiste se algum som tocou ha menos que isso. */
  function ifQuiet(fn, wait, recentMs) {
    if (recentMs && nowMs() - lastPlayAt < recentMs) return;
    var mark = playCount;
    setTimeout(function () { if (playCount === mark) fn(); }, wait || 0);
  }

  /* ---------- Efeitos sonoros: API antiga (mesmos nomes) ---------- */

  function tone(freq, duration, type, delay, gainValue) {
    var dur = Math.max(0.03, duration || 0.1);
    play({ delay: delay || 0, rev: 0.12 }, function (v) {
      osc(v, {
        type: type || "sine", f: freq || 440, a: 0.008, d: dur, s: 0.001, r: 0.03,
        g: (gainValue != null ? gainValue : 0.15) * 0.9,
        lp: (type === "square" || type === "sawtooth") ? Math.min(12000, (freq || 440) * 5) : null
      });
    });
  }

  // clique de interface: "tic" curtinho e macio
  function click() {
    play({ pitch: vary(40), g: 1 }, function (v) {
      osc(v, { type: "sine", f: 1900, f2: 1100, glide: 0.03, a: 0.001, d: 0.035, r: 0.01, g: 0.07 });
      noise(v, { ft: "highpass", f: 4500, a: 0.001, d: 0.012, r: 0.005, g: 0.035 });
    });
  }

  // aposta: ficha de cassino batendo na mesa
  function bet() {
    play({ pitch: vary(30), rev: 0.12 }, function (v) {
      osc(v, { type: "sine", f: 210, f2: 150, glide: 0.05, a: 0.001, d: 0.07, r: 0.02, g: 0.12 });
      bell(v, { f: 2350, dur: 0.12, g: 0.045, ratio: 2.76, index: 0.8 });
      bell(v, { f: 3120, at: 0.045, dur: 0.1, g: 0.03, ratio: 2.76, index: 0.8 });
      noise(v, { ft: "bandpass", f: 3500, q: 1.5, a: 0.001, d: 0.02, r: 0.01, g: 0.06 });
    });
  }

  function win() {
    winSmall();
  }

  // perdeu: "uon-uon" descendo, macio (sem serra crua)
  function lose() {
    play({ rev: 0.15 }, function (v) {
      osc(v, { type: "triangle", f: midi(67), f2: midi(65), glide: 0.14, a: 0.01, d: 0.12, s: 0.5, hold: 0.02, r: 0.06, g: 0.1, lp: 1800 });
      osc(v, { type: "triangle", f: midi(63), f2: midi(58), glide: 0.32, at: 0.17, a: 0.01, d: 0.2, s: 0.5, hold: 0.06, r: 0.15, g: 0.1, lp: 1400 });
      osc(v, { type: "sine", f: midi(51), f2: midi(46), glide: 0.32, at: 0.17, a: 0.01, d: 0.3, s: 0.4, r: 0.15, g: 0.07 });
    });
  }

  // explosao generica (canoa afundando / bomba)
  function boom(size) {
    size = size || 1;
    play({ rev: 0.35, must: true }, function (v) {
      noise(v, { ft: "lowpass", f: 3200, f2: 160, glide: 0.6 * size, q: 0.8, a: 0.002, d: 0.7 * size, s: 0.001, r: 0.1, g: 0.32 });
      osc(v, { type: "sine", f: 110, f2: 32, glide: 0.5 * size, a: 0.003, d: 0.6 * size, s: 0.001, r: 0.1, g: 0.38 });
      osc(v, { type: "triangle", f: 70, f2: 38, glide: 0.4, a: 0.003, d: 0.35, s: 0.001, r: 0.05, g: 0.14, lp: 400 });
      // estalos de destrocos
      for (var i = 0; i < 5; i++) {
        noise(v, { ft: "bandpass", f: 900 + Math.random() * 2500, q: 2, at: 0.06 + Math.random() * 0.4 * size, a: 0.001, d: 0.03, r: 0.01, g: 0.05 + Math.random() * 0.04 });
      }
    });
  }

  function crashBoom() {
    // agua/madeira quebrando: um "splash" grave depois do estrondo
    boom(1.2);
    play({ rev: 0.3, delay: 0.08 }, function (v) {
      noise(v, { ft: "bandpass", f: 900, f2: 300, glide: 0.8, q: 0.7, a: 0.05, d: 0.7, s: 0.001, r: 0.1, g: 0.1 });
    });
  }

  function bombExplode() {
    // pavio curtinho + estrondo
    play({}, function (v) {
      noise(v, { ft: "highpass", f: 5000, a: 0.002, d: 0.06, r: 0.01, g: 0.04 });
    });
    boom(1);
  }

  // tick generico (contadores, animacoes): bloquinho de madeira
  function tick() {
    if (!gate("tick", 28)) return;
    play({ pitch: vary(60) }, function (v) {
      osc(v, { type: "sine", f: 1500, f2: 1150, glide: 0.02, a: 0.001, d: 0.028, r: 0.01, g: 0.07 });
      noise(v, { ft: "bandpass", f: 3000, q: 2, a: 0.001, d: 0.01, r: 0.005, g: 0.025 });
    });
  }

  /* pino do Plinko: sininho com afinacao pela altura (pos 0..1) + variacao */
  function pegHit(pos) {
    if (!gate("peg", 32)) return;
    var step = pos != null ? Math.round((1 - Math.max(0, Math.min(1, pos))) * 9) : Math.floor(Math.random() * 10);
    play({ pitch: vary(15), pan: (Math.random() - 0.5) * 0.5, rev: 0.12 }, function (v) {
      bell(v, { f: penta(step + 2, 76), dur: 0.16, g: 0.04, ratio: 2, index: 0.6 });
    });
  }

  function countdownBeep() {
    play({ rev: 0.1 }, function (v) {
      osc(v, { type: "sine", f: 988, a: 0.004, d: 0.09, s: 0.001, r: 0.03, g: 0.08 });
      osc(v, { type: "triangle", f: 1976, a: 0.004, d: 0.05, s: 0.001, r: 0.02, g: 0.02 });
    });
  }

  // premio grande (Bonanza): arpejo + sininhos + chuva de moedas
  function jackpot() {
    play({ rev: 0.3, must: true }, function (v) {
      [72, 76, 79, 84, 88].forEach(function (m, i) {
        osc(v, { type: "triangle", f: midi(m), at: i * 0.1, a: 0.005, d: 0.25, s: 0.3, r: 0.2, g: 0.08 });
        bell(v, { f: midi(m + 12), at: i * 0.1 + 0.02, dur: 0.4, g: 0.035, ratio: 3.5 });
      });
      brass(v, { f: midi(60), at: 0.5, dur: 0.6, g: 0.05 });
      brass(v, { f: midi(64), at: 0.5, dur: 0.6, g: 0.04 });
      brass(v, { f: midi(67), at: 0.5, dur: 0.6, g: 0.04 });
    });
    coinShower(8, 0.9, 0.45);
  }

  // moeda: o classico "plin-plin"
  function coin() {
    play({ pitch: vary(25), rev: 0.2 }, function (v) {
      bell(v, { f: midi(95), dur: 0.12, g: 0.05, ratio: 4, index: 0.9 });
      bell(v, { f: midi(100), at: 0.07, dur: 0.35, g: 0.06, ratio: 4, index: 0.9 });
    });
  }

  // raspar: chiado curto com cor aleatoria
  function scratch() {
    if (!gate("scratch", 45)) return;
    play({ pan: (Math.random() - 0.5) * 0.4 }, function (v) {
      noise(v, { ft: "bandpass", f: 2500 + Math.random() * 2500, f2: 1800 + Math.random() * 1500, glide: 0.08, q: 1.4, a: 0.008, d: 0.07 + Math.random() * 0.04, s: 0.001, r: 0.02, g: 0.07 });
      noise(v, { ft: "highpass", f: 6000, a: 0.005, d: 0.05, r: 0.01, g: 0.02 });
    });
  }

  // rugido do tigre (Bazinguinha): grave, com "rosnado" (modulacao de amplitude)
  function roar() {
    if (!gate("roar", 250)) return;
    play({ rev: 0.3, must: true }, function (v) {
      var c = v.c, t = v.t;
      var am = c.createGain();
      am.gain.value = 0.6;
      var lfo = c.createOscillator();
      lfo.frequency.setValueAtTime(28, t);
      lfo.frequency.linearRampToValueAtTime(16, t + 0.7);
      var lfoG = c.createGain();
      lfoG.gain.value = 0.4;
      lfo.connect(lfoG);
      lfoG.connect(am.gain);
      am.connect(v.out);
      v.nodes.push(am, lfoG);
      addSource(v, lfo, t, t + 0.9);
      osc(v, { type: "sawtooth", f: 190, f2: 72, glide: 0.65, a: 0.06, d: 0.25, s: 0.6, hold: 0.15, r: 0.3, g: 0.16, lp: 900, lp2: 300, dest: am });
      osc(v, { type: "sawtooth", f: 96, f2: 48, glide: 0.65, a: 0.06, d: 0.25, s: 0.6, hold: 0.15, r: 0.3, g: 0.1, lp: 500, dest: am });
      noise(v, { ft: "bandpass", f: 700, f2: 300, glide: 0.6, q: 1.2, a: 0.05, d: 0.5, s: 0.3, r: 0.2, g: 0.08, dest: am });
    });
  }

  // conquista desbloqueada: sininho triplo brilhante
  function achievement() {
    play({ rev: 0.35 }, function (v) {
      [79, 84, 88].forEach(function (m, i) {
        bell(v, { f: midi(m), at: i * 0.09, dur: 0.6, g: 0.06, ratio: 3.01, index: 1.1 });
        osc(v, { type: "triangle", f: midi(m - 12), at: i * 0.09, a: 0.005, d: 0.2, s: 0.4, r: 0.2, g: 0.05 });
      });
      shimmer(v, 0.3, 0.5, 0.025);
    });
  }

  // Big Win (mantido por compatibilidade): fanfarra do nivel "Mega"
  function bigWin() {
    bigWinTier(1);
  }

  // brilho: varias notas agudas rapidas e aleatorias
  function shimmer(v, at, dur, g) {
    var n = Math.round(dur * 22);
    for (var i = 0; i < n; i++) {
      osc(v, { type: "sine", f: penta(10 + Math.floor(Math.random() * 8), 72), at: at + (i / n) * dur, a: 0.002, d: 0.08, s: 0.001, r: 0.02, g: g * (1 - i / n * 0.6) });
    }
  }

  /* ---------- Vitorias por tamanho ---------- */

  function winSmall() {
    play({ rev: 0.25, pitch: vary(10) }, function (v) {
      bell(v, { f: midi(84), dur: 0.35, g: 0.06, ratio: 3, index: 1 });
      bell(v, { f: midi(88), at: 0.08, dur: 0.5, g: 0.065, ratio: 3, index: 1 });
      osc(v, { type: "triangle", f: midi(72), a: 0.005, d: 0.15, s: 0.3, r: 0.15, g: 0.06 });
      osc(v, { type: "triangle", f: midi(76), at: 0.08, a: 0.005, d: 0.2, s: 0.3, r: 0.2, g: 0.06 });
    });
  }

  function winMedium() {
    play({ rev: 0.28 }, function (v) {
      [72, 76, 79, 84].forEach(function (m, i) {
        osc(v, { type: "square", f: midi(m), at: i * 0.075, a: 0.004, d: 0.12, s: 0.35, r: 0.12, g: 0.05, lp: 2600 });
        bell(v, { f: midi(m + 12), at: i * 0.075, dur: 0.3, g: 0.035, ratio: 3 });
      });
      osc(v, { type: "triangle", f: midi(60), at: 0.3, a: 0.01, d: 0.3, s: 0.4, r: 0.25, g: 0.07 });
      shimmer(v, 0.3, 0.35, 0.02);
    });
    coinShower(4, 0.5, 0.35);
  }

  function winBig() {
    play({ rev: 0.32, must: true }, function (v) {
      drum(v, { f: 80, g: 0.25 });
      [72, 76, 79, 84, 88].forEach(function (m, i) {
        osc(v, { type: "square", f: midi(m), at: 0.05 + i * 0.07, a: 0.004, d: 0.1, s: 0.3, r: 0.1, g: 0.04, lp: 3000 });
      });
      [60, 64, 67, 72].forEach(function (m) { brass(v, { f: midi(m), at: 0.4, dur: 0.55, g: 0.04 }); });
      cymbal(v, { at: 0.4, dur: 0.9, g: 0.035 });
      shimmer(v, 0.45, 0.6, 0.02);
    });
    coinShower(9, 1, 0.4);
  }

  // escolhe o som pela vitoria (multiplicador). Com o Big Win aberto, a fanfarra dele basta.
  function winFor(mult) {
    if (BZG.effects && BZG.effects.isBigWinActive && BZG.effects.isBigWinActive()) return;
    mult = Number(mult) || 0;
    if (mult >= 5) winBig();
    else if (mult >= 2) winMedium();
    else winSmall();
  }

  /* chuva de moedas: n moedas espalhadas em "spread" segundos (uma voz so) */
  function coinShower(n, spread, g) {
    n = Math.max(1, Math.min(24, n || 8));
    spread = spread || 1;
    play({ rev: 0.25, delay: 0.05 }, function (v) {
      for (var i = 0; i < n; i++) {
        var at = Math.random() * spread;
        var f = midi(91 + Math.floor(Math.random() * 10));
        bell(v, { f: f, at: at, dur: 0.18, g: 0.03 * (g || 0.5) * 2, ratio: 4, index: 0.8 });
        bell(v, { f: f * 1.335, at: at + 0.05, dur: 0.25, g: 0.025 * (g || 0.5) * 2, ratio: 4, index: 0.8 });
      }
    });
  }

  // tic da contagem subindo (p = 0..1: o tic fica mais agudo ate o fim)
  function countTick(p) {
    if (!gate("count", 30)) return;
    p = Math.max(0, Math.min(1, p || 0));
    play({ pitch: vary(15) }, function (v) {
      osc(v, { type: "square", f: 700 + p * 900, a: 0.001, d: 0.025, r: 0.01, g: 0.03, lp: 3500 });
      osc(v, { type: "sine", f: (700 + p * 900) * 2, a: 0.001, d: 0.02, r: 0.01, g: 0.02 });
    });
  }

  // fim da contagem: "ding" brilhante
  function countEnd() {
    play({ rev: 0.3 }, function (v) {
      bell(v, { f: midi(96), dur: 0.8, g: 0.06, ratio: 3.5, index: 1.2 });
      bell(v, { f: midi(91), dur: 0.6, g: 0.04, ratio: 3.5, index: 1.2 });
    });
  }

  // whoosh: ruido varrendo de grave para agudo (transicoes)
  function whoosh(dur, up) {
    dur = dur || 0.45;
    var a = up === false ? 4000 : 350, b = up === false ? 350 : 4500;
    play({ rev: 0.2 }, function (v) {
      noise(v, { ft: "bandpass", f: a, f2: b, glide: dur, q: 1.6, a: dur * 0.6, d: dur * 0.4, s: 0.001, r: 0.05, g: 0.1 });
      noise(v, { ft: "bandpass", f: a * 1.5, f2: b * 1.2, glide: dur, q: 3, a: dur * 0.6, d: dur * 0.4, s: 0.001, r: 0.05, g: 0.05 });
    });
  }

  // impacto: pancada grave com cauda (strength 0..1)
  function impact(strength) {
    var s = strength != null ? Math.max(0.2, Math.min(1, strength)) : 0.8;
    play({ rev: 0.4, must: true }, function (v) {
      osc(v, { type: "sine", f: 140, f2: 38, glide: 0.35, a: 0.002, d: 0.5, s: 0.001, r: 0.05, g: 0.4 * s });
      noise(v, { ft: "lowpass", f: 2500, f2: 200, glide: 0.3, a: 0.001, d: 0.3, s: 0.001, r: 0.05, g: 0.18 * s });
      noise(v, { ft: "highpass", f: 5000, a: 0.001, d: 0.04, r: 0.01, g: 0.05 * s });
    });
  }

  /* fanfarra do Big Win por nivel: 0 = Grande, 1 = Mega, 2 = BAZINGA (cada uma mais epica) */
  function bigWinTier(n) {
    n = Math.max(0, Math.min(2, n || 0));
    if (n === 0) {
      // Grande: chamada de metais em Do maior + sininhos
      play({ rev: 0.3, must: true }, function (v) {
        [[67, 0], [72, 0.12], [76, 0.24]].forEach(function (x) { brass(v, { f: midi(x[0]), at: x[1], dur: 0.12, g: 0.06 }); });
        [60, 64, 67, 72].forEach(function (m) { brass(v, { f: midi(m), at: 0.36, dur: 0.7, g: 0.04 }); });
        drum(v, { f: 85, at: 0.36, g: 0.2 });
        shimmer(v, 0.4, 0.6, 0.02);
      });
      coinShower(6, 1, 0.4);
    } else if (n === 1) {
      // Mega: em Re, mais cheia (oitavas), tambores e prato
      play({ rev: 0.32, must: true }, function (v) {
        drum(v, { f: 75, g: 0.28 });
        drum(v, { f: 75, at: 0.15, g: 0.22 });
        [[69, 0.0], [74, 0.1], [78, 0.2], [81, 0.3]].forEach(function (x) {
          brass(v, { f: midi(x[0]), at: x[1], dur: 0.1, g: 0.055 });
          brass(v, { f: midi(x[0] - 12), at: x[1], dur: 0.1, g: 0.03 });
        });
        [62, 66, 69, 74, 78].forEach(function (m) { brass(v, { f: midi(m), at: 0.42, dur: 1.0, g: 0.035 }); });
        drum(v, { f: 62, at: 0.42, g: 0.3 });
        cymbal(v, { at: 0.42, dur: 1.4, g: 0.04 });
        shimmer(v, 0.45, 0.9, 0.022);
      });
      coinShower(12, 1.3, 0.45);
    } else {
      // BAZINGA: rufar de timpano, acorde gigante em Mi em 3 oitavas, arpejo ate o ceu
      play({ rev: 0.38, must: true }, function (v) {
        for (var i = 0; i < 10; i++) drum(v, { f: 64, at: i * 0.035, g: 0.08 + i * 0.012, nf: 900 });
        drum(v, { f: 52, at: 0.38, g: 0.4 });
        [52, 64, 68, 71, 76, 80, 83].forEach(function (m) { brass(v, { f: midi(m), at: 0.38, dur: 1.5, g: 0.032, bright: 8 }); });
        [76, 80, 83, 88, 92, 95, 100].forEach(function (m, k) {
          bell(v, { f: midi(m), at: 0.45 + k * 0.07, dur: 0.6, g: 0.04, ratio: 3.5 });
        });
        cymbal(v, { at: 0.38, dur: 2, g: 0.06 });
        cymbal(v, { at: 0.38, f: 9000, dur: 1.2, g: 0.03 });
        osc(v, { type: "sine", f: 41, at: 0.38, a: 0.01, d: 1.2, s: 0.001, r: 0.1, g: 0.25 });
        shimmer(v, 0.5, 1.4, 0.022);
      });
      coinShower(20, 1.8, 0.5);
    }
  }

  // coletar o premio: "ka-ching" da caixa registradora + moedas
  function collect() {
    play({ rev: 0.25, must: true }, function (v) {
      noise(v, { ft: "bandpass", f: 1800, q: 2, a: 0.001, d: 0.04, r: 0.01, g: 0.08 });
      osc(v, { type: "square", f: 300, f2: 180, glide: 0.04, a: 0.001, d: 0.04, r: 0.01, g: 0.04, lp: 2000 });
      bell(v, { f: midi(100), at: 0.06, dur: 0.9, g: 0.06, ratio: 3.2, index: 1.3 });
      bell(v, { f: midi(103), at: 0.06, dur: 0.9, g: 0.05, ratio: 3.2, index: 1.3 });
    });
    coinShower(7, 0.6, 0.4);
  }

  // subir de nivel (XP): varredura subindo + acorde maior + brilho
  function levelUp() {
    play({ rev: 0.35, must: true }, function (v) {
      osc(v, { type: "triangle", f: 300, f2: 1200, glide: 0.35, a: 0.02, d: 0.33, s: 0.3, r: 0.1, g: 0.05, lp: 3000 });
      [72, 76, 79, 84].forEach(function (m, i) {
        osc(v, { type: "square", f: midi(m), at: 0.3 + i * 0.07, a: 0.005, d: 0.15, s: 0.35, r: 0.25, g: 0.04, lp: 2800 });
      });
      [60, 64, 67].forEach(function (m) { brass(v, { f: midi(m), at: 0.58, dur: 0.5, g: 0.035 }); });
      bell(v, { f: midi(96), at: 0.58, dur: 0.9, g: 0.05 });
      shimmer(v, 0.6, 0.5, 0.02);
    });
  }

  // recarregar saldo: moedas caindo no cofre
  function reload() {
    play({ rev: 0.2 }, function (v) {
      for (var i = 0; i < 6; i++) {
        bell(v, { f: midi(86 + i * 2), at: i * 0.045, dur: 0.2, g: 0.035, ratio: 4, index: 0.8 });
      }
      osc(v, { type: "sine", f: 180, f2: 120, glide: 0.08, at: 0.3, a: 0.002, d: 0.1, r: 0.03, g: 0.12 });
      bell(v, { f: midi(96), at: 0.32, dur: 0.6, g: 0.05 });
    });
  }

  /* ---------- Interface ---------- */

  // hover sutil (cartoes/botoes): bem baixinho e com limite de frequencia
  function hover() {
    if (!gate("hover", 70)) return;
    play({ pitch: vary(50) }, function (v) {
      osc(v, { type: "sine", f: 2600, a: 0.002, d: 0.025, r: 0.01, g: 0.018 });
    });
  }

  function menuOpen() {
    play({ rev: 0.1 }, function (v) {
      noise(v, { ft: "bandpass", f: 600, f2: 2600, glide: 0.14, q: 1.5, a: 0.05, d: 0.1, r: 0.02, g: 0.05 });
      osc(v, { type: "sine", f: 660, f2: 990, glide: 0.08, a: 0.003, d: 0.07, r: 0.02, g: 0.05 });
    });
  }

  function menuClose() {
    play({ rev: 0.1 }, function (v) {
      noise(v, { ft: "bandpass", f: 2600, f2: 600, glide: 0.14, q: 1.5, a: 0.05, d: 0.1, r: 0.02, g: 0.045 });
      osc(v, { type: "sine", f: 880, f2: 600, glide: 0.08, a: 0.003, d: 0.07, r: 0.02, g: 0.045 });
    });
  }

  function modalOpen() {
    play({ rev: 0.25 }, function (v) {
      noise(v, { ft: "bandpass", f: 500, f2: 3000, glide: 0.2, q: 1.2, a: 0.08, d: 0.12, r: 0.03, g: 0.05 });
      bell(v, { f: midi(84), at: 0.12, dur: 0.4, g: 0.04 });
      bell(v, { f: midi(91), at: 0.18, dur: 0.5, g: 0.035 });
    });
  }

  function modalClose() {
    play({ rev: 0.15 }, function (v) {
      noise(v, { ft: "bandpass", f: 2500, f2: 500, glide: 0.16, q: 1.2, a: 0.04, d: 0.12, r: 0.03, g: 0.04 });
      osc(v, { type: "sine", f: 990, f2: 660, glide: 0.08, a: 0.003, d: 0.06, r: 0.02, g: 0.035 });
    });
  }

  // toast/notificacao: success = "ding" duplo, error = "bop" grave, info = "blip"
  function toast(type) {
    if (!gate("toast", 250)) return;
    play({ rev: 0.18 }, function (v) {
      if (type === "success") {
        osc(v, { type: "sine", f: midi(81), a: 0.004, d: 0.12, s: 0.001, r: 0.04, g: 0.06 });
        osc(v, { type: "sine", f: midi(88), at: 0.07, a: 0.004, d: 0.18, s: 0.001, r: 0.05, g: 0.06 });
      } else if (type === "error") {
        osc(v, { type: "triangle", f: 240, f2: 200, glide: 0.08, a: 0.004, d: 0.08, s: 0.3, r: 0.05, g: 0.08, lp: 1200 });
        osc(v, { type: "triangle", f: 200, f2: 170, glide: 0.1, at: 0.1, a: 0.004, d: 0.1, s: 0.3, r: 0.06, g: 0.07, lp: 1200 });
      } else {
        osc(v, { type: "sine", f: midi(84), a: 0.004, d: 0.1, s: 0.001, r: 0.04, g: 0.05 });
      }
    });
  }

  function notify(type) { toast(type || "info"); }

  // previa de volume no ajuste dos efeitos
  function preview() {
    if (!gate("preview", 140)) return;
    coin();
  }

  /* ---------- Rolos (Bazinguinha e cia.) ---------- */

  // rolos comecando a girar
  function reelStart() {
    play({ rev: 0.1 }, function (v) {
      noise(v, { ft: "bandpass", f: 300, f2: 1400, glide: 0.25, q: 1, a: 0.05, d: 0.25, r: 0.05, g: 0.06 });
      osc(v, { type: "triangle", f: 90, f2: 140, glide: 0.2, a: 0.01, d: 0.2, r: 0.05, g: 0.06, lp: 600 });
    });
  }

  // simbolo passando no rolo (bem baixinho)
  function reelTick() {
    if (!gate("reelTick", 40)) return;
    play({ pitch: vary(80) }, function (v) {
      osc(v, { type: "triangle", f: 900, f2: 700, glide: 0.02, a: 0.001, d: 0.02, r: 0.01, g: 0.035, lp: 3000 });
    });
  }

  // coluna parando: "clack" mecanico (col 0..2 muda um pouco a afinacao)
  function reelStop(col) {
    col = col || 0;
    play({ pitch: vary(20) * (1 + col * 0.06), pan: (col - 1) * 0.35, rev: 0.12 }, function (v) {
      osc(v, { type: "sine", f: 180, f2: 90, glide: 0.06, a: 0.001, d: 0.09, r: 0.02, g: 0.17 });
      noise(v, { ft: "bandpass", f: 1600, q: 1.8, a: 0.001, d: 0.035, r: 0.01, g: 0.12 });
      osc(v, { type: "square", f: 1200, a: 0.001, d: 0.012, r: 0.005, g: 0.03, lp: 4000 });
    });
  }

  /* suspense (3a coluna): tom subindo com tremolo. set(p) com p 0..1 */
  function tensionStart() {
    return makeLoop({ g: 0.06, rev: 0.2, fadeIn: 0.25 }, function (v) {
      var c = v.c, t = v.t;
      var trem = c.createGain();
      trem.gain.value = 0.7;
      var lfo = c.createOscillator();
      lfo.frequency.value = 5;
      var lfoG = c.createGain();
      lfoG.gain.value = 0.3;
      lfo.connect(lfoG); lfoG.connect(trem.gain);
      var flt = makeFilter(c, "lowpass", 900, 2);
      flt.connect(trem); trem.connect(v.out);
      v.nodes.push(trem, lfoG, flt);
      addSource(v, lfo, t);
      var oscs = [0, 7, 12].map(function (semi, i) {
        var o = c.createOscillator();
        o.type = i === 2 ? "triangle" : "sawtooth";
        o.frequency.value = 110 * Math.pow(2, semi / 12);
        o.detune.value = (i - 1) * 6;
        var g = c.createGain();
        g.gain.value = i === 2 ? 0.6 : 0.4;
        o.connect(g); g.connect(flt);
        v.nodes.push(g);
        addSource(v, o, t);
        return { o: o, semi: semi };
      });
      return function (p, now) {
        p = Math.max(0, Math.min(1, p || 0));
        var base = 110 * Math.pow(2, p * 1.5); // sobe 1 oitava e meia
        oscs.forEach(function (x) { x.o.frequency.setTargetAtTime(base * Math.pow(2, x.semi / 12), now, 0.05); });
        flt.frequency.setTargetAtTime(700 + p * 2600, now, 0.05);
        lfo.frequency.setTargetAtTime(5 + p * 11, now, 0.05);
        v.out.gain.setTargetAtTime(0.05 + p * 0.05, now, 0.08);
      };
    });
  }

  // WILD travado: choque eletrico + sininho
  function wildLock() {
    play({ rev: 0.3, must: true }, function (v) {
      osc(v, { type: "sawtooth", f: 2400, f2: 300, glide: 0.25, a: 0.002, d: 0.25, s: 0.001, r: 0.05, g: 0.05, lp: 5000 });
      noise(v, { ft: "highpass", f: 3000, f2: 8000, glide: 0.2, a: 0.002, d: 0.22, s: 0.001, r: 0.05, g: 0.05 });
      for (var i = 0; i < 4; i++) noise(v, { ft: "bandpass", f: 4000 + Math.random() * 3000, q: 4, at: i * 0.04, a: 0.001, d: 0.02, r: 0.005, g: 0.05 });
      bell(v, { f: midi(88), at: 0.15, dur: 0.6, g: 0.05 });
      bell(v, { f: midi(95), at: 0.2, dur: 0.6, g: 0.04 });
    });
  }

  // respin: whoosh curto subindo
  function respin() {
    whoosh(0.3, true);
  }

  /* ---------- Roleta / Double ---------- */

  /* bolinha rolando na pista: som continuo; set(speed) com speed 0..1 */
  function ballRoll() {
    return makeLoop({ g: 0.05, rev: 0.12, fadeIn: 0.15 }, function (v) {
      var c = v.c, t = v.t;
      var src = c.createBufferSource();
      src.buffer = noiseBuf;
      src.loop = true;
      var flt = makeFilter(c, "bandpass", 2600, 1.6);
      var am = c.createGain();
      am.gain.value = 0.6;
      var lfo = c.createOscillator();
      lfo.frequency.value = 30;
      var lfoG = c.createGain();
      lfoG.gain.value = 0.35;
      lfo.connect(lfoG); lfoG.connect(am.gain);
      src.connect(flt); flt.connect(am); am.connect(v.out);
      // ronco grave da madeira
      var low = c.createOscillator();
      low.type = "triangle";
      low.frequency.value = 70;
      var lowG = c.createGain();
      lowG.gain.value = 0.25;
      low.connect(lowG); lowG.connect(am);
      v.nodes.push(flt, am, lfoG, lowG);
      addSource(v, src, t, null);
      addSource(v, lfo, t, null);
      addSource(v, low, t, null);
      return function (speed, now) {
        speed = Math.max(0, Math.min(1, speed || 0));
        flt.frequency.setTargetAtTime(900 + speed * 2600, now, 0.06);
        lfo.frequency.setTargetAtTime(6 + speed * 34, now, 0.06);
        low.frequency.setTargetAtTime(45 + speed * 50, now, 0.06);
        v.out.gain.setTargetAtTime(0.012 + speed * 0.07, now, 0.06);
      };
    });
  }

  // "tec" da bolinha no separador (speed 0..1 deixa mais agudo e forte)
  function pocketTick(speed) {
    if (!gate("pocket", 35)) return;
    var s = speed != null ? Math.max(0, Math.min(1, speed)) : 0.5;
    play({ pitch: vary(50), pan: (Math.random() - 0.5) * 0.3, rev: 0.1 }, function (v) {
      osc(v, { type: "sine", f: 2200 + s * 900, f2: 1600, glide: 0.015, a: 0.001, d: 0.02, r: 0.008, g: 0.05 + s * 0.04 });
      noise(v, { ft: "bandpass", f: 4200, q: 3, a: 0.001, d: 0.012, r: 0.004, g: 0.04 + s * 0.03 });
    });
  }

  // bolinha assentando na casa: quiques diminuindo + "toc" final
  function ballSettle() {
    play({ rev: 0.15 }, function (v) {
      var gaps = [0, 0.11, 0.19, 0.245, 0.28];
      gaps.forEach(function (at, i) {
        var k = 1 - i / gaps.length;
        osc(v, { type: "sine", f: 2000 - i * 120, f2: 1500, glide: 0.015, at: at, a: 0.001, d: 0.02, r: 0.008, g: 0.07 * k });
        noise(v, { ft: "bandpass", f: 3800, q: 3, at: at, a: 0.001, d: 0.01, r: 0.004, g: 0.04 * k });
      });
      osc(v, { type: "sine", f: 320, f2: 220, glide: 0.05, at: 0.3, a: 0.001, d: 0.08, r: 0.02, g: 0.12 });
    });
  }

  // tique do Double (faixa passando): mais grave quando desacelera
  function spinTick(speed) {
    if (!gate("spinTick", 30)) return;
    var s = speed != null ? Math.max(0, Math.min(1, speed)) : 0.5;
    play({ pitch: vary(20) }, function (v) {
      osc(v, { type: "triangle", f: 900 + s * 900, f2: 700 + s * 500, glide: 0.02, a: 0.001, d: 0.025, r: 0.01, g: 0.05 + s * 0.02, lp: 4000 });
      noise(v, { ft: "bandpass", f: 3000, q: 2, a: 0.001, d: 0.01, r: 0.004, g: 0.025 });
    });
  }

  // resultado do giro saiu (Double/Roleta): "toc" de parada
  function landChime() {
    play({ rev: 0.2 }, function (v) {
      osc(v, { type: "sine", f: 300, f2: 200, glide: 0.05, a: 0.001, d: 0.08, r: 0.02, g: 0.12 });
      bell(v, { f: midi(84), at: 0.02, dur: 0.35, g: 0.04 });
    });
  }

  /* ---------- Crash ---------- */

  /* motor/remada subindo: set(mult) - o tom sobe com o multiplicador */
  function engineStart(level) {
    var lvl = level != null ? level : 1;
    return makeLoop({ g: 0.03 * lvl, rev: 0.08, fadeIn: 0.3 }, function (v) {
      var c = v.c, t = v.t;
      var flt = makeFilter(c, "lowpass", 400, 3);
      flt.connect(v.out);
      v.nodes.push(flt);
      var oscs = [];
      [[1, -8, "sawtooth"], [1, 8, "sawtooth"], [0.5, 0, "triangle"]].forEach(function (x) {
        var o = c.createOscillator();
        o.type = x[2];
        o.frequency.value = 60 * x[0];
        o.detune.value = x[1];
        var g = c.createGain();
        g.gain.value = x[2] === "triangle" ? 0.6 : 0.35;
        o.connect(g); g.connect(flt);
        v.nodes.push(g);
        addSource(v, o, t, null);
        oscs.push({ o: o, k: x[0] });
      });
      // vento (ruido) que cresce com a velocidade
      var src = c.createBufferSource();
      src.buffer = noiseBuf;
      src.loop = true;
      var nf = makeFilter(c, "bandpass", 800, 0.8);
      var ng = c.createGain();
      ng.gain.value = 0.05;
      src.connect(nf); nf.connect(ng); ng.connect(v.out);
      v.nodes.push(nf, ng);
      addSource(v, src, t, null);
      return function (mult, now) {
        mult = Math.max(1, mult || 1);
        var p = Math.min(1, Math.log(mult) / Math.log(20)); // 1x..20x -> 0..1
        var f = 60 * Math.pow(2, p * 2.3);
        oscs.forEach(function (x) { x.o.frequency.setTargetAtTime(f * x.k, now, 0.08); });
        flt.frequency.setTargetAtTime(350 + p * 2200, now, 0.1);
        nf.frequency.setTargetAtTime(700 + p * 2500, now, 0.1);
        ng.gain.setTargetAtTime(0.05 + p * 0.25, now, 0.1);
        v.out.gain.setTargetAtTime((0.03 + p * 0.03) * lvl, now, 0.1);
      };
    });
  }

  // multiplicador cruzou um inteiro (2x, 3x...): "ding" subindo
  function milestone(n) {
    n = Math.max(1, n || 1);
    play({ rev: 0.2 }, function (v) {
      bell(v, { f: penta(Math.min(14, n + 1), 72), dur: 0.3, g: 0.04 });
    });
  }

  // retirada (cash out) no Crash
  function cashout(mult) {
    collect();
    if (mult) setTimeout(function () { winFor(mult); }, 120);
  }

  /* ---------- Mines / Tower ---------- */

  // casa segura: sininho que sobe a cada acerto (step 1, 2, 3...)
  function gemReveal(step) {
    step = Math.max(0, (step || 1) - 1);
    play({ rev: 0.25 }, function (v) {
      bell(v, { f: penta(step, 74), dur: 0.4, g: 0.06, ratio: 3, index: 1.1 });
      osc(v, { type: "triangle", f: penta(step, 62), a: 0.003, d: 0.12, s: 0.001, r: 0.05, g: 0.05 });
      noise(v, { ft: "highpass", f: 6000, a: 0.002, d: 0.05, r: 0.01, g: 0.02 });
    });
  }

  // subir um andar (Tower): passo + nota subindo
  function stepUp(level) {
    level = Math.max(0, level || 0);
    play({ rev: 0.2 }, function (v) {
      osc(v, { type: "sine", f: 160, f2: 100, glide: 0.06, a: 0.001, d: 0.08, r: 0.02, g: 0.15 });
      bell(v, { f: penta(level, 72), at: 0.03, dur: 0.35, g: 0.055, ratio: 2.5 });
      osc(v, { type: "square", f: penta(level, 60), at: 0.03, a: 0.003, d: 0.1, s: 0.001, r: 0.04, g: 0.025, lp: 2500 });
    });
  }

  /* ---------- Plinko ---------- */

  // bolinha caiu na casa: grave nas casas baixas, brilhante nas altas
  function plinkoLand(mult) {
    mult = Number(mult) || 0;
    play({ rev: 0.15, pitch: vary(10) }, function (v) {
      osc(v, { type: "sine", f: 220, f2: 140, glide: 0.06, a: 0.001, d: 0.08, r: 0.02, g: 0.1 });
      if (mult >= 1) {
        var step = Math.min(9, Math.round(Math.log(mult + 1) * 3));
        bell(v, { f: penta(step, 72), at: 0.02, dur: 0.3, g: 0.05 });
      } else {
        osc(v, { type: "triangle", f: 330, f2: 260, glide: 0.1, a: 0.003, d: 0.1, r: 0.03, g: 0.04, lp: 1500 });
      }
    });
  }

  /* ---------- Dados ---------- */

  // dados chacoalhando (chamar repetido durante a animacao)
  function diceShake() {
    if (!gate("dice", 55)) return;
    play({ pan: (Math.random() - 0.5) * 0.5 }, function (v) {
      for (var i = 0; i < 2; i++) {
        noise(v, { ft: "bandpass", f: 1800 + Math.random() * 2200, q: 3, at: Math.random() * 0.03, a: 0.001, d: 0.015, r: 0.005, g: 0.06 });
        osc(v, { type: "sine", f: 600 + Math.random() * 500, at: Math.random() * 0.03, a: 0.001, d: 0.02, r: 0.005, g: 0.03 });
      }
    });
  }

  // dado parando na mesa
  function diceLand() {
    play({ rev: 0.12 }, function (v) {
      [0, 0.07, 0.12].forEach(function (at, i) {
        osc(v, { type: "sine", f: 260 - i * 30, f2: 150, glide: 0.04, at: at, a: 0.001, d: 0.06, r: 0.02, g: 0.14 * (1 - i * 0.3) });
        noise(v, { ft: "bandpass", f: 2400, q: 2, at: at, a: 0.001, d: 0.02, r: 0.005, g: 0.05 * (1 - i * 0.3) });
      });
    });
  }

  /* ---------- Cartas ---------- */

  // carta deslizando na mesa
  function cardDeal() {
    play({ pitch: vary(40), pan: (Math.random() - 0.5) * 0.4 }, function (v) {
      noise(v, { ft: "bandpass", f: 3000, f2: 1500, glide: 0.08, q: 0.9, a: 0.01, d: 0.07, r: 0.02, g: 0.09 });
      noise(v, { ft: "lowpass", f: 1200, at: 0.08, a: 0.001, d: 0.03, r: 0.01, g: 0.08 });
    });
  }

  // carta virando: "flip" + estalo
  function cardFlip() {
    play({ pitch: vary(40) }, function (v) {
      noise(v, { ft: "bandpass", f: 1500, f2: 4000, glide: 0.07, q: 1.2, a: 0.02, d: 0.05, r: 0.01, g: 0.08 });
      noise(v, { ft: "highpass", f: 3000, at: 0.075, a: 0.001, d: 0.015, r: 0.005, g: 0.07 });
      osc(v, { type: "sine", f: 400, at: 0.075, a: 0.001, d: 0.03, r: 0.01, g: 0.05 });
    });
  }

  // ficha (dobrar aposta etc.)
  function chip() { bet(); }

  /* ---------- Limbo ---------- */

  // numero subindo (p 0..1)
  function riseTick(p) {
    if (!gate("rise", 45)) return;
    p = Math.max(0, Math.min(1, p || 0));
    play({ pitch: vary(20) }, function (v) {
      osc(v, { type: "triangle", f: 400 + p * 1400, f2: 500 + p * 1600, glide: 0.03, a: 0.001, d: 0.03, r: 0.01, g: 0.05, lp: 5000 });
    });
  }

  // foguete do limbo subindo (som unico de "decolagem")
  function launch() {
    play({ rev: 0.2 }, function (v) {
      noise(v, { ft: "bandpass", f: 300, f2: 3000, glide: 0.6, q: 0.8, a: 0.1, d: 0.5, r: 0.1, g: 0.08 });
      osc(v, { type: "sawtooth", f: 80, f2: 320, glide: 0.6, a: 0.05, d: 0.55, r: 0.1, g: 0.035, lp: 900, lp2: 2500 });
    });
  }

  /* ---------- Cara ou coroa ---------- */

  // moeda girando: "tin" metalico alternando afinacao (chamar repetido)
  var coinFlipToggle = false;
  function coinFlipTick() {
    if (!gate("coinflip", 60)) return;
    coinFlipToggle = !coinFlipToggle;
    play({ pan: coinFlipToggle ? 0.15 : -0.15 }, function (v) {
      bell(v, { f: coinFlipToggle ? 3100 : 2700, dur: 0.07, g: 0.025, ratio: 2.4, index: 0.5 });
    });
  }

  // moeda caindo: quique metalico + zumbido
  function coinLand() {
    play({ rev: 0.2 }, function (v) {
      [0, 0.09, 0.15, 0.19].forEach(function (at, i) {
        bell(v, { f: 2900 - i * 80, at: at, dur: 0.15, g: 0.06 * (1 - i * 0.22), ratio: 2.4, index: 0.6 });
      });
      osc(v, { type: "sine", f: 2900, at: 0.2, a: 0.01, d: 0.5, s: 0.001, r: 0.05, g: 0.02 });
    });
  }

  /* ---------- Corrida ---------- */

  // largada: sino de corrida (campainha) + publico
  function raceStart() {
    play({ rev: 0.3 }, function (v) {
      for (var i = 0; i < 6; i++) bell(v, { f: 1760, at: i * 0.05, dur: 0.08, g: 0.04, ratio: 2.1, index: 0.7 });
      noise(v, { ft: "bandpass", f: 1200, q: 0.6, at: 0.1, a: 0.2, d: 0.6, s: 0.001, r: 0.2, g: 0.04 });
    });
  }

  // casco no chao (chamar em ritmo; intensity 0..1)
  var hoofStep = 0;
  function hoof(intensity) {
    if (!gate("hoof", 60)) return;
    var k = intensity != null ? Math.max(0.2, Math.min(1, intensity)) : 0.7;
    hoofStep = (hoofStep + 1) % 4;
    var accent = hoofStep === 0 ? 1 : 0.7;
    play({ pitch: vary(60), pan: (Math.random() - 0.5) * 0.6 }, function (v) {
      osc(v, { type: "sine", f: 150, f2: 80, glide: 0.04, a: 0.001, d: 0.05, r: 0.01, g: 0.11 * k * accent });
      noise(v, { ft: "bandpass", f: 900, q: 1.5, a: 0.001, d: 0.025, r: 0.01, g: 0.05 * k * accent });
    });
  }

  // chegada: torcida
  function crowdCheer() {
    play({ rev: 0.35 }, function (v) {
      noise(v, { ft: "bandpass", f: 1100, q: 0.5, a: 0.15, d: 0.9, s: 0.4, r: 0.4, g: 0.06 });
      noise(v, { ft: "bandpass", f: 2400, q: 0.8, a: 0.15, d: 0.8, s: 0.3, r: 0.4, g: 0.03 });
      for (var i = 0; i < 6; i++) {
        osc(v, { type: "triangle", f: 700 + Math.random() * 500, f2: 900 + Math.random() * 700, glide: 0.2, at: 0.1 + Math.random() * 0.6, a: 0.03, d: 0.15, r: 0.05, g: 0.012, lp: 2500 });
      }
    });
  }

  /* ---------- Bonanza (funcoes prontas para o jogo usar) ---------- */

  // simbolos caindo/reposicionando (cascata)
  function tumble() {
    if (!gate("tumble", 80)) return;
    play({ rev: 0.12 }, function (v) {
      for (var i = 0; i < 5; i++) {
        osc(v, { type: "sine", f: 300 - i * 25, f2: 160, glide: 0.04, at: i * 0.03 + Math.random() * 0.015, a: 0.001, d: 0.05, r: 0.01, g: 0.06 });
        noise(v, { ft: "bandpass", f: 1800 + Math.random() * 800, q: 2, at: i * 0.03, a: 0.001, d: 0.015, r: 0.005, g: 0.025 });
      }
    });
  }

  // gemas estourando numa vitoria em cascata (chain 1, 2, 3... sobe o tom)
  function gemPop(chain) {
    if (!gate("gemPop", 50)) return;
    var step = Math.max(0, (chain || 1) - 1);
    play({ rev: 0.25, pitch: vary(15) }, function (v) {
      osc(v, { type: "sine", f: penta(step, 72) * 0.5, f2: penta(step, 72) * 1.5, glide: 0.05, a: 0.002, d: 0.06, r: 0.02, g: 0.06 });
      bell(v, { f: penta(step + 2, 76), at: 0.03, dur: 0.35, g: 0.05 });
      noise(v, { ft: "highpass", f: 5000, a: 0.001, d: 0.04, r: 0.01, g: 0.03 });
    });
  }

  // scatter caindo (n = quantos ja cairam: 1, 2, 3, 4... cada um mais tenso)
  function scatterLand(n) {
    n = Math.max(1, n || 1);
    play({ rev: 0.35, must: true }, function (v) {
      osc(v, { type: "sine", f: 120, f2: 70, glide: 0.1, a: 0.001, d: 0.15, r: 0.03, g: 0.2 });
      bell(v, { f: penta(Math.min(12, n * 2), 72), at: 0.01, dur: 0.6, g: 0.06, ratio: 3.5, index: 1.4 });
      bell(v, { f: penta(Math.min(12, n * 2) + 2, 72), at: 0.05, dur: 0.6, g: 0.035, ratio: 3.5 });
    });
  }

  // bomba de multiplicador carregando (antes de explodir)
  function bombCharge() {
    play({ rev: 0.25, must: true }, function (v) {
      osc(v, { type: "sawtooth", f: 120, f2: 900, glide: 0.6, a: 0.05, d: 0.55, s: 0.6, r: 0.06, g: 0.04, lp: 800, lp2: 4000 });
      noise(v, { ft: "bandpass", f: 400, f2: 4000, glide: 0.6, q: 2, a: 0.1, d: 0.5, s: 0.6, r: 0.05, g: 0.04 });
    });
  }

  // bomba de multiplicador aplicada (o valor salta)
  function bombHit(mult) {
    impact(0.6);
    play({ rev: 0.3 }, function (v) {
      var step = Math.min(12, Math.round(Math.log((mult || 2) + 1) * 3));
      bell(v, { f: penta(step, 74), at: 0.05, dur: 0.7, g: 0.06 });
      shimmer(v, 0.08, 0.3, 0.018);
    });
  }

  // somando multiplicadores ao premio
  function multiplierAdd(step) {
    play({ rev: 0.2 }, function (v) {
      bell(v, { f: penta(Math.max(0, step || 0) + 3, 72), dur: 0.3, g: 0.05, ratio: 2 });
      osc(v, { type: "square", f: penta(Math.max(0, step || 0) + 3, 60), a: 0.002, d: 0.08, r: 0.03, g: 0.025, lp: 2500 });
    });
  }

  // entrou nas rodadas gratis
  function freeSpinsStart() {
    whoosh(0.5, true);
    setTimeout(function () { bigWinTier(0); }, 300);
  }

  // ganhou mais rodadas gratis durante o bonus
  function freeSpinsRetrigger() {
    play({ rev: 0.3 }, function (v) {
      [79, 83, 86, 91].forEach(function (m, i) { bell(v, { f: midi(m), at: i * 0.07, dur: 0.5, g: 0.05 }); });
    });
  }

  /* ---------- Musica ambiente: video do YouTube em loop, escondido ----------
     So o audio importa - o player fica num divzinho de 1x1px, sem controles,
     sem aparecer na tela. Precisa de internet; sem ela, so a musica de fundo
     nao toca (o resto do site, incluindo os efeitos sonoros acima, e local). */

  var YT_VIDEO_ID = "PaFHwTjy1yE";

  var ytPlayer = null;
  var ytReady = false;
  var ytApiLoading = false;
  var wantPlaying = false; // true = deveria estar tocando assim que o player ficar pronto

  function ytVolume() {
    // le de novo do armazenamento: a pagina dentro da moldura pode ter mudado
    try {
      var s = localStorage.getItem("bzgMusicVol");
      if (s !== null) musicVolPct = clampPct(s, musicVolPct);
    } catch (e) {}
    return musicVolPct; // 0-100 (mesma escala do YouTube)
  }

  function ensureYtApiLoaded(onReady) {
    if (window.YT && window.YT.Player) { onReady(); return; }
    var prevCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = function () {
      if (typeof prevCallback === "function") prevCallback();
      onReady();
    };
    if (ytApiLoading) return;
    ytApiLoading = true;
    try {
      var tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
    } catch (e) { /* sem internet ou bloqueado - musica de fundo so nao toca */ }
  }

  function createYtPlayer() {
    if (ytPlayer) return;
    var holder = document.createElement("div");
    holder.id = "bzg-yt-music";
    holder.style.cssText = "position:fixed; left:0; bottom:0; width:1px; height:1px; overflow:hidden; opacity:0; pointer-events:none;";
    document.body.appendChild(holder);

    try {
      ytPlayer = new window.YT.Player("bzg-yt-music", {
        videoId: YT_VIDEO_ID,
        playerVars: {
          autoplay: 0, controls: 0, disablekb: 1, fs: 0,
          modestbranding: 1, rel: 0, iv_load_policy: 3,
          loop: 1, playlist: YT_VIDEO_ID // "loop" sozinho nao repete video unico, precisa do playlist
        },
        events: {
          onReady: function () {
            ytReady = true;
            ytPlayer.setVolume(ytVolume());
            if (wantPlaying) ytPlayer.playVideo();
          },
          onStateChange: function (e) {
            // reforco do loop, caso o truque do playlist falhe
            if (e.data === window.YT.PlayerState.ENDED) {
              ytPlayer.seekTo(0);
              ytPlayer.playVideo();
            }
          }
        }
      });
    } catch (e) { /* falha silenciosa */ }
  }

  /* dentro da moldura (app.html) quem toca a musica e a moldura: o player dela
     nao e recriado a cada pagina, entao a musica continua sem parar */
  function musicHost() {
    try {
      if (window.parent !== window && window.parent.BZG && window.parent.BZG.musicHost) return window.parent.BZG.musicHost;
    } catch (e) {}
    return null;
  }

  function startMusic() {
    if (!musicOn) return;
    var host = musicHost();
    if (host) { host.startMusic(); return; }
    wantPlaying = true;
    if (ytReady && ytPlayer) {
      try { ytPlayer.setVolume(ytVolume()); ytPlayer.playVideo(); } catch (e) {}
    } else {
      ensureYtApiLoaded(createYtPlayer);
    }
  }

  function stopMusic() {
    var host = musicHost();
    if (host) { host.stopMusic(); return; }
    wantPlaying = false;
    if (ytReady && ytPlayer) {
      try { ytPlayer.pauseVideo(); } catch (e) {}
    }
  }

  /* comeca a musica na primeira interacao do usuario (politica de autoplay) */
  function armMusicAutostart() {
    var started = false;
    function onFirstInteract() {
      if (started) return;
      started = true;
      startMusic();
      document.removeEventListener("pointerdown", onFirstInteract);
      document.removeEventListener("keydown", onFirstInteract);
    }
    document.addEventListener("pointerdown", onFirstInteract);
    document.addEventListener("keydown", onFirstInteract);
  }

  /* ---------- Controles separados: efeitos e musica ---------- */

  function isSfxEnabled() {
    return sfxOn;
  }

  function setSfxEnabled(value) {
    sfxOn = !!value;
    try { localStorage.setItem("bzgSfx", sfxOn ? "on" : "off"); } catch (e) {}
    if (!sfxOn) stopAllLoops();
    return sfxOn;
  }

  function toggleSfx() {
    return setSfxEnabled(!sfxOn);
  }

  function isMusicEnabled() {
    return musicOn;
  }

  function setMusicEnabled(value) {
    musicOn = !!value;
    try { localStorage.setItem("bzgMusic", musicOn ? "on" : "off"); } catch (e) {}
    var host = musicHost();
    if (host) host.setMusicEnabled(musicOn);
    else if (musicOn) startMusic();
    else stopMusic();
    return musicOn;
  }

  function toggleMusic() {
    return setMusicEnabled(!musicOn);
  }

  /* volumes (0-100). O dos efeitos vale para esta pagina (cada pagina tem o seu
     AudioContext); o da musica vai para quem toca a musica (a moldura, se houver). */
  function getSfxVolume() { return sfxVolPct; }

  function setSfxVolume(pct) {
    sfxVolPct = clampPct(pct, sfxVolPct);
    try { localStorage.setItem("bzgSfxVol", String(sfxVolPct)); } catch (e) {}
    if (ctx && masterGain) {
      try { masterGain.gain.setTargetAtTime(volCurve(sfxVolPct), ctx.currentTime, 0.03); } catch (e) {}
    }
    return sfxVolPct;
  }

  function getMusicVolume() { return musicVolPct; }

  function setMusicVolume(pct) {
    musicVolPct = clampPct(pct, musicVolPct);
    try { localStorage.setItem("bzgMusicVol", String(musicVolPct)); } catch (e) {}
    var host = musicHost();
    if (host && host.setMusicVolume) { host.setMusicVolume(musicVolPct); return musicVolPct; }
    if (ytReady && ytPlayer) {
      try { ytPlayer.setVolume(musicVolPct); } catch (e) {}
    }
    return musicVolPct;
  }

  // so para testes/diagnostico: contagem de vozes e fontes (detecta vazamento de nos)
  function debugStats() {
    return {
      live: live, loops: loops.length, voices: stats.voices, released: stats.released,
      sources: stats.sources, ended: stats.ended, state: ctx ? ctx.state : "none", unlocked: unlocked
    };
  }

  return {
    // API antiga
    tone: tone,
    click: click,
    bet: bet,
    win: win,
    lose: lose,
    crashBoom: crashBoom,
    bombExplode: bombExplode,
    tick: tick,
    pegHit: pegHit,
    countdownBeep: countdownBeep,
    jackpot: jackpot,
    coin: coin,
    scratch: scratch,
    roar: roar,
    achievement: achievement,
    bigWin: bigWin,
    // vitorias e Big Win
    winSmall: winSmall,
    winMedium: winMedium,
    winBig: winBig,
    winFor: winFor,
    coinShower: coinShower,
    countTick: countTick,
    countEnd: countEnd,
    bigWinTier: bigWinTier,
    levelUp: levelUp,
    collect: collect,
    whoosh: whoosh,
    impact: impact,
    reload: reload,
    // interface
    uiClick: click,
    hover: hover,
    menuOpen: menuOpen,
    menuClose: menuClose,
    modalOpen: modalOpen,
    modalClose: modalClose,
    toast: toast,
    notify: notify,
    preview: preview,
    ifQuiet: ifQuiet,
    // jogos
    reelStart: reelStart,
    reelTick: reelTick,
    reelStop: reelStop,
    tensionStart: tensionStart,
    wildLock: wildLock,
    respin: respin,
    ballRoll: ballRoll,
    pocketTick: pocketTick,
    ballSettle: ballSettle,
    spinTick: spinTick,
    landChime: landChime,
    engineStart: engineStart,
    milestone: milestone,
    cashout: cashout,
    gemReveal: gemReveal,
    stepUp: stepUp,
    plinkoLand: plinkoLand,
    diceShake: diceShake,
    diceLand: diceLand,
    cardDeal: cardDeal,
    cardFlip: cardFlip,
    chip: chip,
    riseTick: riseTick,
    launch: launch,
    coinFlipTick: coinFlipTick,
    coinLand: coinLand,
    raceStart: raceStart,
    hoof: hoof,
    crowdCheer: crowdCheer,
    // Bonanza
    tumble: tumble,
    gemPop: gemPop,
    scatterLand: scatterLand,
    bombCharge: bombCharge,
    bombHit: bombHit,
    multiplierAdd: multiplierAdd,
    freeSpinsStart: freeSpinsStart,
    freeSpinsRetrigger: freeSpinsRetrigger,
    // controles
    isSfxEnabled: isSfxEnabled,
    setSfxEnabled: setSfxEnabled,
    toggleSfx: toggleSfx,
    getSfxVolume: getSfxVolume,
    setSfxVolume: setSfxVolume,
    isMusicEnabled: isMusicEnabled,
    setMusicEnabled: setMusicEnabled,
    toggleMusic: toggleMusic,
    getMusicVolume: getMusicVolume,
    setMusicVolume: setMusicVolume,
    startMusic: startMusic,
    armMusicAutostart: armMusicAutostart,
    stopMusic: stopMusic,
    stopAllLoops: stopAllLoops,
    _debug: debugStats
  };
})();
