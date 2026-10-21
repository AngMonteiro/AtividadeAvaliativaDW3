document.addEventListener('DOMContentLoaded', async function () {
  if (!estIsLogged()) {
    return;
  }

  var form = document.getElementById('frmRegistros');

  if (!form) {
    return;
  }

  var oper = new URLSearchParams(window.location.search).get('oper');
  var btnInserir = document.getElementById('btnInserirRegistro');
  var btnAtualizar = document.getElementById('btnAtualizarRegistro');
  var btnRemover = document.getElementById('btnRemoverRegistro');

  $('#veiculoid').select2({
    theme: 'bootstrap-5',
    placeholder: 'Selecione um veículo',
    width: '100%'
  });

  estLimparAoDigitar(form);
  // O Select2 avisa a escolha por evento próprio: limpa o erro do campo Veículo
  $('#veiculoid').on('select2:select', function () {
    estLimparErros(form, document.getElementById('registroAlert'));
  });

  // oper: Cr = criar, Re = visualizar, Up = atualizar, De = remover
  if (oper === 'Cr') {
    btnInserir.classList.remove('d-none');
    btnInserir.addEventListener('click', vwInsertRegistro);
    document.getElementById('horaentrada').value = estParaInputLocal(new Date().toISOString());
    await carregarVeiculosParaRegistros(form.dataset.servidorApi);
  }

  if (oper === 'Re') {
    await vwGetRegistroByID();
    desabilitarCampos();
  }

  if (oper === 'Up') {
    btnAtualizar.classList.remove('d-none');
    btnAtualizar.disabled = !(await vwGetRegistroByID());
    btnAtualizar.addEventListener('click', vwUpdateRegistro);
  }

  if (oper === 'De') {
    document.getElementById('avisoExcluirRegistro').classList.remove('d-none');
    btnRemover.classList.remove('d-none');
    btnRemover.disabled = !(await vwGetRegistroByID());
    desabilitarCampos();
    btnRemover.addEventListener('click', vwDeleteRegistro);
  }
});

function desabilitarCampos() {
  document.querySelectorAll('#frmRegistros input, #frmRegistros select').forEach(function (campo) {
    campo.disabled = true;
  });
}

function obterRegistroId() {
  var id = new URLSearchParams(window.location.search).get('registroId');

  if (!id || !/^\d+$/.test(id) || Number(id) <= 0) {
    throw new Error('ID do registro inválido.');
  }
  return id;
}

// Preenche o Select2 com os veículos cadastrados (usa a API GetAllVeiculos)
async function carregarVeiculosParaRegistros(servidorApi) {
  var alertBox = document.getElementById('registroAlert');

  try {
    var data = await estRequest(servidorApi, '/getAllVeiculos');
    var select = document.getElementById('veiculoid');

    select.innerHTML = '<option value="">Selecione um veículo</option>';

    data.registro.forEach(function (v) {
      var option = document.createElement('option');
      option.value = v.veiculoid;
      option.textContent = v.placa + ', ' + v.modelo + ' (' + v.dono + ')';
      select.appendChild(option);
    });

    $('#veiculoid').trigger('change');
    return true;
  } catch (error) {
    estExibirErro(alertBox, error.message || 'Erro ao carregar veículos.');
    return false;
  }
}

// Regras de validação do formulário (mesmas do backend)
function validarFormularioRegistro(form, alertBox) {
  return estValidarCampos(form, alertBox, {
    veiculoid: estObrigatorio('Selecione o veículo.'),
    horaentrada: estObrigatorio('Informe a hora de entrada.'),
    horasaida: function (valor) {
      var entrada = document.getElementById('horaentrada').value;
      if (valor && entrada && new Date(valor) < new Date(entrada)) {
        return 'A saída não pode ser anterior à entrada.';
      }
      return null;
    },
    valor: function (valor) {
      return valor && (isNaN(valor) || Number(valor) < 0) ? 'Informe um valor válido (zero ou maior).' : null;
    }
  });
}

function montarRegistroDoFormulario() {
  return {
    veiculoid: document.getElementById('veiculoid').value,
    horaentrada: estDoInputLocal(document.getElementById('horaentrada').value),
    horasaida: estDoInputLocal(document.getElementById('horasaida').value),
    valor: document.getElementById('valor').value
  };
}

// Função do front-end que usa a API InsertRegistro
async function vwInsertRegistro() {
  var form = document.getElementById('frmRegistros');
  var btn = document.getElementById('btnInserirRegistro');
  var alertBox = document.getElementById('registroAlert');

  if (!validarFormularioRegistro(form, alertBox)) {
    return;
  }

  try {
    btn.disabled = true;
    await estRequest(form.dataset.servidorApi, '/insertRegistro', {
      method: 'POST',
      body: montarRegistroDoFormulario()
    });
    window.location.href = '/registros';
  } catch (error) {
    estTratarErroFormulario(form, alertBox, error, 'Erro ao inserir registro.');
    btn.disabled = false;
  }
}

// Função do front-end que usa a API GetRegistroByID
async function vwGetRegistroByID() {
  var form = document.getElementById('frmRegistros');
  var alertBox = document.getElementById('registroAlert');

  try {
    var id = obterRegistroId();
    var data = await estRequest(form.dataset.servidorApi, '/getRegistroByID/' + encodeURIComponent(id));
    var registro = data.registro[0];

    if (!registro) {
      throw new Error('Registro não encontrado.');
    }

    document.getElementById('registroid').value = registro.registroid;
    document.getElementById('horaentrada').value = estParaInputLocal(registro.horaentrada);
    document.getElementById('horasaida').value = estParaInputLocal(registro.horasaida);
    document.getElementById('valor').value = registro.valor ?? '';

    if (!(await carregarVeiculosParaRegistros(form.dataset.servidorApi))) {
      return false;
    }
    $('#veiculoid').val(registro.veiculoid).trigger('change');
    return true;
  } catch (error) {
    estExibirErro(alertBox, error.message || 'Erro ao carregar registro.');
    return false;
  }
}

// Função do front-end que usa a API UpdateRegistro
async function vwUpdateRegistro() {
  var form = document.getElementById('frmRegistros');
  var btn = document.getElementById('btnAtualizarRegistro');
  var alertBox = document.getElementById('registroAlert');

  if (btn.disabled || !validarFormularioRegistro(form, alertBox)) {
    return;
  }

  try {
    btn.disabled = true;
    var data = await estRequest(form.dataset.servidorApi, '/updateRegistro/' + encodeURIComponent(obterRegistroId()), {
      method: 'PUT',
      body: montarRegistroDoFormulario()
    });

    if (data.linhasAfetadas !== 1) {
      throw new Error('Nenhum registro foi atualizado.');
    }

    estExibirAviso(alertBox, 'Registro atualizado com sucesso.');
  } catch (error) {
    estTratarErroFormulario(form, alertBox, error, 'Erro ao atualizar registro.');
  } finally {
    btn.disabled = false;
  }
}

// Função do front-end que usa a API DeleteRegistro (soft delete no back-end)
async function vwDeleteRegistro() {
  var form = document.getElementById('frmRegistros');
  var btn = document.getElementById('btnRemoverRegistro');
  var alertBox = document.getElementById('registroAlert');

  if (btn.disabled || !window.confirm('Excluir este lançamento de entrada/saída? Ele deixará de aparecer na lista. Use apenas se foi um erro.')) {
    return;
  }

  try {
    btn.disabled = true;
    var data = await estRequest(form.dataset.servidorApi, '/deleteRegistro/' + encodeURIComponent(obterRegistroId()), {
      method: 'DELETE'
    });

    if (data.linhasAfetadas !== 1) {
      throw new Error('Nenhum registro foi excluído.');
    }

    window.location.href = '/registros';
  } catch (error) {
    estExibirErro(alertBox, error.message || 'Erro ao excluir registro.');
    btn.disabled = false;
  }
}