/* Bazinga BET - cadastro/login local (sem backend): uma conta por navegador */
(function () {
  document.addEventListener("DOMContentLoaded", function () {
    // ja tem conta neste navegador? pula direto pro lobby
    if (BZG.storage.hasAccount()) {
      window.location.replace("index.html");
      return;
    }

    var form = document.getElementById("cadastro-form");
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var nickname = document.getElementById("nickname").value.trim();
      var password = document.getElementById("password").value;
      var agree = document.getElementById("agree").checked;

      if (nickname.length < 2) {
        BZG.ui.toast("Digite um nome de jogador com pelo menos 2 letras.", "error");
        return;
      }
      if (password.length < 4) {
        BZG.ui.toast("A senha precisa ter pelo menos 4 caracteres.", "error");
        return;
      }
      if (!agree) {
        BZG.ui.toast("Você precisa confirmar que entende que é tudo fictício.", "error");
        return;
      }

      BZG.storage.createAccount({ nickname: nickname, password: password });
      BZG.sounds.win();
      BZG.ui.toast("Bem-vindo(a), " + nickname + "! 🎉", "success");
      setTimeout(function () { window.location.href = "index.html"; }, 700);
    });
  });
})();
