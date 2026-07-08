/* Bazinga BET - modos de jogo (Turbo). Os jogos leem BZG.modes.speed() para
   encurtar as animacoes quando o Turbo (desbloqueado no Passe) esta ligado. */
window.BZG = window.BZG || {};

BZG.modes = (function () {
  var TURBO_FACTOR = 0.45; // durações caem para 45% no turbo

  function turboOn() {
    return BZG.storage.isTurboOn && BZG.storage.isTurboOn();
  }

  // multiplique as durações de animação por isto
  function speed() {
    return turboOn() ? TURBO_FACTOR : 1;
  }

  return { turboOn: turboOn, speed: speed };
})();
