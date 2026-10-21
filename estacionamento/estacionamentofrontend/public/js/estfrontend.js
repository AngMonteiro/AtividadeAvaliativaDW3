// Funções comuns a todas as telas do front-end

// Verifica se o cookie IsLogged existe; se não existir, volta para o login.
function estIsLogged() {
  const isLogged = document.cookie
    .split(';')
    .some((cookie) => cookie.trim().startsWith('IsLogged='));

  if (!isLogged) {
    window.location.href = '/login';
    return false;
  }
  return true;
}

function estClearIsLoggedCookie() {
  document.cookie = 'IsLogged=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
}

// Limpa token e cookie e volta para a tela de login
function estLogout() {
  localStorage.removeItem('token');
  estClearIsLoggedCookie();
  window.location.href = '/login';
}

function estMontarHeadersAutenticacao(headers) {
  var token = localStorage.getItem('token');
  var finalHeaders = headers || {};
  if (token) {
    finalHeaders.Authorization = 'Bearer ' + token;
  }
  return finalHeaders;
}

// Faz a chamada ao back-end já enviando o JWT.
// Se o token estiver inválido ou expirado, volta para o login.
async function estRequest(servidorApi, caminho, opcoes) {
  opcoes = opcoes || {};

  if (!servidorApi) {
    throw new Error('Endereço do servidor backend não configurado.');
  }

  var headers = estMontarHeadersAutenticacao(opcoes.body ? { 'content-type': 'application/json' } : {});
  var response;
  try {
    response = await fetch(servidorApi + caminho, {
      method: opcoes.method || 'GET',
      headers: headers,
      body: opcoes.body ? JSON.stringify(opcoes.body) : undefined
    });
  } catch (e) {
    throw new Error('Não foi possível conectar ao servidor. Verifique se o backend está no ar e tente novamente.');
  }

  var data = null;
  try {
    data = await response.json();
  } catch (e) {
    data = null;
  }

  if (response.status === 401) {
    estLogout();
    throw new Error((data && data.message) || 'Sessão expirada. Faça login novamente.');
  }

  if (!response.ok || !data || (data.status && data.status !== 'ok')) {
    var erro = new Error((data && (data.status || data.message)) || 'Erro ao comunicar com o servidor.');
    erro.erros = (data && data.erros) || null; // { campo: "mensagem" } vindo da validação do backend
    throw erro;
  }

  return data;
}

function estEscaparHtml(valor) {
  return String(valor)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Monta o alerta com ícone + mensagem (textContent: seguro contra XSS)
function estMontarAlerta(alertBox, tipo, icone, mensagem) {
  if (!alertBox) return;
  alertBox.className = 'alert alert-' + tipo + ' d-flex align-items-start gap-2 shadow-sm';
  alertBox.replaceChildren();

  var i = document.createElement('i');
  i.className = 'bi ' + icone + ' fs-5 flex-shrink-0';
  var texto = document.createElement('div');
  texto.textContent = mensagem;

  alertBox.append(i, texto);
  alertBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function estExibirErro(alertBox, mensagem) {
  estMontarAlerta(alertBox, 'danger', 'bi-exclamation-triangle-fill', mensagem);
}

function estExibirAviso(alertBox, mensagem) {
  estMontarAlerta(alertBox, 'success', 'bi-check-circle-fill', mensagem);
}

function estOcultarAlerta(alertBox) {
  if (!alertBox) return;
  alertBox.classList.add('d-none');
  alertBox.replaceChildren();
}

// ---- Validação de formulários com mensagens organizadas ----

// Remove o destaque vermelho e as mensagens de todos os campos do formulário
function estLimparErros(form, alertBox) {
  estOcultarAlerta(alertBox);
  form.querySelectorAll('.is-invalid').forEach(function (campo) {
    campo.classList.remove('is-invalid');
  });
  form.querySelectorAll('.invalid-feedback').forEach(function (fb) {
    fb.textContent = '';
    fb.style.display = '';
  });
}

// Destaca o campo em vermelho e escreve a mensagem logo abaixo dele
function estMarcarCampo(campo, mensagem) {
  campo.classList.add('is-invalid');
  var fb = campo.parentElement.querySelector('.invalid-feedback');
  if (!fb) {
    fb = document.createElement('div');
    fb.className = 'invalid-feedback';
    campo.insertAdjacentElement('afterend', fb);
  }
  fb.textContent = mensagem;
  fb.style.display = 'block'; // também funciona com o Select2
}

function estMarcarCampos(form, erros) {
  var primeiro = null;
  Object.keys(erros || {}).forEach(function (id) {
    var campo = form.querySelector('#' + id);
    if (campo) {
      estMarcarCampo(campo, erros[id]);
      primeiro = primeiro || campo;
    }
  });
  if (primeiro) primeiro.focus();
}

// regras = { idDoCampo: function (valor) { return 'mensagem de erro' ou null; } }
function estValidarCampos(form, alertBox, regras) {
  estLimparErros(form, alertBox);
  var erros = {};
  Object.keys(regras).forEach(function (id) {
    var campo = form.querySelector('#' + id);
    var msg = campo ? regras[id](String(campo.value || '').trim()) : null;
    if (msg) erros[id] = msg;
  });

  if (Object.keys(erros).length === 0) return true;

  estMarcarCampos(form, erros);
  estExibirErro(alertBox, 'Corrija os campos destacados em vermelho.');
  return false;
}

// Mostra o erro devolvido pelo backend (alerta + campos destacados)
function estTratarErroFormulario(form, alertBox, error, mensagemPadrao) {
  estLimparErros(form, alertBox);
  if (error && error.erros) estMarcarCampos(form, error.erros);
  estExibirErro(alertBox, (error && error.message) || mensagemPadrao);
}

// Limpa o destaque de um campo assim que o usuário volta a digitar nele
function estLimparAoDigitar(form) {
  form.addEventListener('input', function (event) {
    var campo = event.target;
    if (campo.classList && campo.classList.contains('is-invalid')) {
      campo.classList.remove('is-invalid');
      var fb = campo.parentElement.querySelector('.invalid-feedback');
      if (fb) { fb.textContent = ''; fb.style.display = ''; }
    }
  });
  form.addEventListener('change', function (event) {
    var campo = event.target;
    if (campo.classList && campo.classList.contains('is-invalid')) {
      campo.classList.remove('is-invalid');
      var fb = campo.parentElement.querySelector('.invalid-feedback');
      if (fb) { fb.textContent = ''; fb.style.display = ''; }
    }
  });
}

// Regra da placa (igual à do backend): ABC1234 ou ABC1D23
function estValidarPlaca(valor) {
  if (!valor) return 'Informe a placa do veículo.';
  if (!/^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(valor.toUpperCase().replace(/[^A-Z0-9]/g, ''))) {
    return 'A placa "' + valor.slice(0, 20) + '" não é válida. Use o formato antigo (ABC1234) ou Mercosul (ABC1D23).';
  }
  return null;
}

function estObrigatorio(mensagem) {
  return function (valor) { return valor ? null : mensagem; };
}

// "2026-10-20T14:30:00.000Z" -> "20/10/2026 11:30" (horário local do navegador)
function estFormatarDataHora(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function estFormatarMoeda(valor) {
  if (valor === null || valor === undefined || valor === '') return '';
  return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// ISO (UTC) -> valor para <input type="datetime-local"> no horário local
function estParaInputLocal(iso) {
  if (!iso) return '';
  var d = new Date(iso);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

// valor do <input type="datetime-local"> -> ISO (UTC) para enviar ao back-end
function estDoInputLocal(valor) {
  if (!valor) return null;
  return new Date(valor).toISOString();
}

var estLinguagemTabela = {
  info: 'Mostrando _START_ até _END_ de _TOTAL_ registros',
  infoEmpty: 'Mostrando 0 até 0 de 0 registros',
  infoFiltered: '(filtrado de _MAX_ registros no total)',
  lengthMenu: 'Mostrar _MENU_ registros',
  loadingRecords: 'Carregando...',
  processing: 'Processando...',
  search: 'Pesquisar:',
  zeroRecords: 'Nenhum registro encontrado',
  paginate: { first: 'Primeiro', last: 'Último', next: 'Próximo', previous: 'Anterior' }
};
