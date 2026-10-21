document.addEventListener('DOMContentLoaded', function () {
  // Ao abrir a tela de login (ou clicar em Sair), limpa a sessão anterior
  localStorage.removeItem('token');
  estClearIsLoggedCookie();

  var form = document.getElementById('loginForm');
  var errorBox = document.getElementById('loginError');

  if (!form) {
    return;
  }

  form.addEventListener('submit', async function (event) {
    event.preventDefault();

    var servidorApi = form.dataset.servidorApi;
    var usuario = document.getElementById('usuario').value;
    var senha = document.getElementById('senha').value;
    var submitButton = form.querySelector('button[type="submit"]');

    errorBox.classList.add('d-none');
    errorBox.textContent = '';
    submitButton.disabled = true;
    submitButton.textContent = 'Entrando...';

    try {
      var response = await fetch(servidorApi + '/Login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ username: usuario, password: senha })
      });

      var data = await response.json();

      if (!response.ok || !data.token) {
        throw new Error(data.message || 'Usuário ou senha inválidos.');
      }

      // O JWT e o nome do usuário ficam no localStorage; o cookie indica que há sessão
      localStorage.setItem('token', data.token);
      localStorage.setItem('username', data.username || usuario);
      document.cookie = 'IsLogged=true; path=/';

      window.location.href = '/home';
    } catch (error) {
      errorBox.textContent = error.message || 'Não foi possível realizar o login.';
      errorBox.classList.remove('d-none');
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = 'Entrar';
    }
  });
});
