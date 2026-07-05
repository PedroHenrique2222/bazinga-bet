/* Bazinga BET - efeitos sonoros e musica ambiente via Web Audio API (sem arquivos externos) */
window.BZG = window.BZG || {};

BZG.sounds = (function () {
  var MUSIC_VOL = 0.045;

  var ctx = null;
  var muted = false;
  var musicGain = null;
  var musicTimer = null;
  var chordIndex = 0;

  try { muted = localStorage.getItem("bzgMuted") === "1"; } catch (e) {}

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

  function tone(freq, duration, type, delay, gainValue) {
    if (muted) return;
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

  /* ---------- Musica ambiente (loop de acordes suaves) ---------- */

  var CHORDS = [
    [220.0, 261.63, 329.63],  // Am
    [174.61, 220.0, 261.63],  // F
    [196.0, 261.63, 329.63],  // C/G
    [196.0, 246.94, 293.66]   // G
  ];

  function playPad(freqs) {
    try {
      var audioCtx = getContext();
      if (!musicGain) {
        musicGain = audioCtx.createGain();
        musicGain.gain.value = muted ? 0 : MUSIC_VOL;
        musicGain.connect(audioCtx.destination);
      }
      var now = audioCtx.currentTime;
      for (var i = 0; i < freqs.length; i++) {
        var osc = audioCtx.createOscillator();
        var g = audioCtx.createGain();
        osc.type = "triangle";
        osc.frequency.value = freqs[i];
        osc.detune.value = (i - 1) * 4;
        g.gain.setValueAtTime(0.0001, now);
        g.gain.exponentialRampToValueAtTime(1, now + 0.6);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 2.3);
        osc.connect(g);
        g.connect(musicGain);
        osc.start(now);
        osc.stop(now + 2.4);
      }
      // nota grave
      var bass = audioCtx.createOscillator();
      var bg = audioCtx.createGain();
      bass.type = "sine";
      bass.frequency.value = freqs[0] / 2;
      bg.gain.setValueAtTime(0.0001, now);
      bg.gain.exponentialRampToValueAtTime(0.8, now + 0.4);
      bg.gain.exponentialRampToValueAtTime(0.0001, now + 2.3);
      bass.connect(bg);
      bg.connect(musicGain);
      bass.start(now);
      bass.stop(now + 2.4);
    } catch (e) { /* silencio */ }
  }

  function startMusic() {
    if (musicTimer) return;
    playPad(CHORDS[chordIndex % CHORDS.length]);
    chordIndex++;
    musicTimer = setInterval(function () {
      playPad(CHORDS[chordIndex % CHORDS.length]);
      chordIndex++;
    }, 2200);
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

  /* ---------- Controle de mudo ---------- */

  function isMuted() {
    return muted;
  }

  function setMuted(value) {
    muted = !!value;
    try { localStorage.setItem("bzgMuted", muted ? "1" : "0"); } catch (e) {}
    if (musicGain) musicGain.gain.value = muted ? 0 : MUSIC_VOL;
    return muted;
  }

  function toggleMuted() {
    return setMuted(!muted);
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
    isMuted: isMuted,
    setMuted: setMuted,
    toggleMuted: toggleMuted,
    startMusic: startMusic,
    armMusicAutostart: armMusicAutostart
  };
})();
