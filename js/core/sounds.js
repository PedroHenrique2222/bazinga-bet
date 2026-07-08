/* Bazinga BET - efeitos sonoros (Web Audio API, sem arquivos externos) e
   musica ambiente (video do YouTube em loop, escondido - so o audio conta).
   A musica ambiente e a UNICA parte do site que depende de internet: sem
   conexao, os efeitos sonoros e o resto do site continuam funcionando 100%
   local, so a musica de fundo nao toca. */
window.BZG = window.BZG || {};

BZG.sounds = (function () {
  var ctx = null;
  var sfxOn = true;
  var musicOn = true;

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

  /* ---------- Musica ambiente: video do YouTube em loop, escondido ----------
     So o audio importa - o player fica num divzinho de 1x1px, sem controles,
     sem aparecer na tela. Precisa de internet; sem ela, so a musica de fundo
     nao toca (o resto do site, incluindo os efeitos sonoros acima, e local). */

  var YT_VIDEO_ID = "PaFHwTjy1yE";
  var YT_VOLUME = 25; // 0-100

  var ytPlayer = null;
  var ytReady = false;
  var ytApiLoading = false;
  var wantPlaying = false; // true = deveria estar tocando assim que o player ficar pronto

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
            ytPlayer.setVolume(YT_VOLUME);
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

  function startMusic() {
    if (!musicOn) return;
    wantPlaying = true;
    if (ytReady && ytPlayer) {
      try { ytPlayer.playVideo(); } catch (e) {}
    } else {
      ensureYtApiLoaded(createYtPlayer);
    }
  }

  function stopMusic() {
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
    jackpot: jackpot,
    coin: coin,
    scratch: scratch,
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
