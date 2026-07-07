/* Bazinga BET - efeitos sonoros e musica ambiente via Web Audio API (sem arquivos externos) */
window.BZG = window.BZG || {};

BZG.sounds = (function () {
  var MUSIC_VOL = 0.05;
  var BAR_MS = 3800;       // duracao de cada acorde
  var NOTE_LEN = 4.6;      // notas mais longas que o compasso = transicao suave

  var ctx = null;
  var sfxOn = true;
  var musicOn = true;
  var musicBus = null;     // filtro -> gain -> destino
  var musicTimer = null;
  var chordIndex = 0;

  /* preferencias salvas (migra o antigo botao unico de mudo, se existir) */
  try {
    var legacyMuted = localStorage.getItem("bzgMuted") === "1";
    sfxOn = localStorage.getItem("bzgSfx") !== null
      ? localStorage.getItem("bzgSfx") !== "off"
      : !legacyMuted;
    musicOn = localStorage.getItem("bzgMusic") !== null
      ? localStorage.getItem("bzgMusic") !== "off"
      : !legacyMuted;
  } catch (e) {}

  function getContext() {
    if (!ctx) {
      var AudioCtx = window.AudioContext || window.webkitAudioContext;
      ctx = new AudioCtx();
    }
    if (ctx.state === "suspended") {
      ctx.resume();
    }
    return ctx;
  }

  /* ---------- Efeitos sonoros ---------- */

  function tone(freq, duration, type, delay, gainValue) {
    if (!sfxOn) return;
    try {
      var audioCtx = getContext();
      var osc = audioCtx.createOscillator();
      var gain = audioCtx.createGain();
      osc.type = type || "sine";
      osc.frequency.value = freq;

      var startTime = audioCtx.currentTime + (delay || 0);
      var vol = gainValue != null ? gainValue : 0.15;
      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.exponentialRampToValueAtTime(vol, startTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration + 0.02);
    } catch (e) {
      /* audio indisponivel - falha silenciosa */
    }
  }

  /* ---------- Musica ambiente ----------
     Progressao Am - F - C - G com vozes proximas (transicoes suaves):
     pads de triangulo passando por um filtro grave, baixo discreto e um
     "brilho" ocasional. Acordes de 4.6s sobrepostos a cada 3.8s = sem picote. */

  var CHORDS = [
    { pad: [220.0, 261.63, 329.63, 440.0], bass: 110.0 },   // Am
    { pad: [220.0, 261.63, 349.23, 440.0], bass: 87.31 },   // F/A
    { pad: [196.0, 261.63, 329.63, 392.0], bass: 130.81 },  // C/G
    { pad: [196.0, 246.94, 293.66, 392.0], bass: 98.0 }     // G
  ];
  var SPARKLE_NOTES = [880, 987.77, 1174.66, 1318.51]; // pentatonica de La menor

  function ensureMusicBus() {
    var audioCtx = getContext();
    if (musicBus) return audioCtx;
    var gain = audioCtx.createGain();
    gain.gain.value = MUSIC_VOL;
    var filter = audioCtx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 950;
    filter.Q.value = 0.5;
    filter.connect(gain);
    gain.connect(audioCtx.destination);
    musicBus = { gain: gain, input: filter };
    return audioCtx;
  }

  function playChord(chord) {
    try {
      var audioCtx = ensureMusicBus();
      var now = audioCtx.currentTime;

      // pad: cada nota com dois osciladores levemente desafinados
      for (var i = 0; i < chord.pad.length; i++) {
        for (var d = 0; d < 2; d++) {
          var osc = audioCtx.createOscillator();
          var g = audioCtx.createGain();
          osc.type = "triangle";
          osc.frequency.value = chord.pad[i];
          osc.detune.value = d === 0 ? -4 : 4;
          g.gain.setValueAtTime(0.0001, now);
          g.gain.linearRampToValueAtTime(0.5, now + 1.2);
          g.gain.setValueAtTime(0.5, now + NOTE_LEN - 2.2);
          g.gain.exponentialRampToValueAtTime(0.0001, now + NOTE_LEN);
          osc.connect(g);
          g.connect(musicBus.input);
          osc.start(now);
          osc.stop(now + NOTE_LEN + 0.05);
        }
      }

      // grave suave
      var bass = audioCtx.createOscillator();
      var bg = audioCtx.createGain();
      bass.type = "sine";
      bass.frequency.value = chord.bass;
      bg.gain.setValueAtTime(0.0001, now);
      bg.gain.linearRampToValueAtTime(0.9, now + 0.8);
      bg.gain.setValueAtTime(0.9, now + NOTE_LEN - 2);
      bg.gain.exponentialRampToValueAtTime(0.0001, now + NOTE_LEN);
      bass.connect(bg);
      bg.connect(musicBus.input);
      bass.start(now);
      bass.stop(now + NOTE_LEN + 0.05);

      // brilho ocasional: nota aguda curtinha, bem baixa
      if (Math.random() < 0.4) {
        var sp = audioCtx.createOscillator();
        var sg = audioCtx.createGain();
        sp.type = "sine";
        sp.frequency.value = SPARKLE_NOTES[Math.floor(Math.random() * SPARKLE_NOTES.length)];
        var spStart = now + 0.8 + Math.random() * 1.6;
        sg.gain.setValueAtTime(0.0001, spStart);
        sg.gain.exponentialRampToValueAtTime(0.18, spStart + 0.04);
        sg.gain.exponentialRampToValueAtTime(0.0001, spStart + 1.2);
        sp.connect(sg);
        sg.connect(musicBus.input);
        sp.start(spStart);
        sp.stop(spStart + 1.3);
      }
    } catch (e) { /* silencio */ }
  }

  function startMusic() {
    if (!musicOn || musicTimer) return;
    if (musicBus) musicBus.gain.gain.value = MUSIC_VOL;
    playChord(CHORDS[chordIndex % CHORDS.length]);
    chordIndex++;
    musicTimer = setInterval(function () {
      playChord(CHORDS[chordIndex % CHORDS.length]);
      chordIndex++;
    }, BAR_MS);
  }

  function stopMusic() {
    if (musicTimer) {
      clearInterval(musicTimer);
      musicTimer = null;
    }
    if (musicBus) {
      // deixa as notas atuais sumirem em fade natural
      try {
        var audioCtx = getContext();
        musicBus.gain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.4);
      } catch (e) {}
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
    if (musicOn) startMusic();
    else stopMusic();
    return musicOn;
  }

  function toggleMusic() {
    return setMusicEnabled(!musicOn);
  }

  /* ---------- Efeitos ---------- */

  function click() {
    tone(440, 0.06, "square", 0, 0.08);
  }

  function bet() {
    tone(300, 0.08, "triangle", 0, 0.1);
  }

  function win() {
    tone(523.25, 0.12, "sine", 0, 0.15);
    tone(659.25, 0.12, "sine", 0.1, 0.15);
    tone(783.99, 0.18, "sine", 0.2, 0.18);
  }

  function lose() {
    tone(220, 0.15, "sawtooth", 0, 0.12);
    tone(160, 0.25, "sawtooth", 0.12, 0.12);
  }

  function crashBoom() {
    tone(120, 0.35, "sawtooth", 0, 0.2);
    tone(80, 0.4, "square", 0.05, 0.15);
  }

  function bombExplode() {
    tone(140, 0.3, "square", 0, 0.2);
    tone(90, 0.35, "sawtooth", 0.04, 0.18);
  }

  function tick() {
    tone(880, 0.04, "square", 0, 0.05);
  }

  function pegHit() {
    tone(700 + Math.random() * 400, 0.05, "triangle", 0, 0.06);
  }

  function countdownBeep() {
    tone(660, 0.07, "square", 0, 0.07);
  }

  function cardFlip() {
    tone(520 + Math.random() * 120, 0.05, "triangle", 0, 0.07);
  }

  function jackpot() {
    [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach(function (f, i) {
      tone(f, 0.22, "sine", i * 0.11, 0.16);
    });
  }

  function coin() {
    tone(1200, 0.05, "square", 0, 0.08);
    tone(1600, 0.08, "sine", 0.03, 0.08);
  }

  function scratch() {
    // ruido curto simulando raspar
    if (!sfxOn) return;
    try {
      var audioCtx = getContext();
      var dur = 0.12;
      var buffer = audioCtx.createBuffer(1, audioCtx.sampleRate * dur, audioCtx.sampleRate);
      var data = buffer.getChannelData(0);
      for (var i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
      var src = audioCtx.createBufferSource();
      src.buffer = buffer;
      var g = audioCtx.createGain();
      g.gain.value = 0.06;
      var filt = audioCtx.createBiquadFilter();
      filt.type = "highpass";
      filt.frequency.value = 2000;
      src.connect(filt); filt.connect(g); g.connect(audioCtx.destination);
      src.start();
    } catch (e) {}
  }

  function wheelTick() {
    tone(1400, 0.03, "square", 0, 0.05);
  }

  function roar() {
    // rugido grave descendente
    if (!sfxOn) return;
    try {
      var audioCtx = getContext();
      var osc = audioCtx.createOscillator();
      var g = audioCtx.createGain();
      osc.type = "sawtooth";
      var now = audioCtx.currentTime;
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(70, now + 0.5);
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.22, now + 0.06);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);
      var filt = audioCtx.createBiquadFilter();
      filt.type = "lowpass";
      filt.frequency.value = 600;
      osc.connect(filt); filt.connect(g); g.connect(audioCtx.destination);
      osc.start(now); osc.stop(now + 0.6);
    } catch (e) {}
  }

  function achievement() {
    tone(659.25, 0.1, "sine", 0, 0.14);
    tone(880, 0.14, "sine", 0.1, 0.16);
  }

  function bigWin() {
    // fanfarra ascendente
    [392, 523.25, 659.25, 783.99, 1046.5, 1318.5].forEach(function (f, i) {
      tone(f, 0.28, "sine", i * 0.13, 0.17);
      tone(f * 1.5, 0.2, "triangle", i * 0.13 + 0.02, 0.06);
    });
  }

  return {
    click: click,
    bet: bet,
    win: win,
    lose: lose,
    crashBoom: crashBoom,
    bombExplode: bombExplode,
    tick: tick,
    pegHit: pegHit,
    countdownBeep: countdownBeep,
    cardFlip: cardFlip,
    jackpot: jackpot,
    coin: coin,
    scratch: scratch,
    wheelTick: wheelTick,
    roar: roar,
    achievement: achievement,
    bigWin: bigWin,
    isSfxEnabled: isSfxEnabled,
    setSfxEnabled: setSfxEnabled,
    toggleSfx: toggleSfx,
    isMusicEnabled: isMusicEnabled,
    setMusicEnabled: setMusicEnabled,
    toggleMusic: toggleMusic,
    startMusic: startMusic,
    armMusicAutostart: armMusicAutostart
  };
})();
