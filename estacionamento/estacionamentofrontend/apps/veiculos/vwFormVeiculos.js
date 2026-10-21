document.addEventListener('DOMContentLoaded', async function () {
  if (!estIsLogged()) {
    return;
  }

  var form = document.getElementById('frmVeiculos');

  if (!form) {
    return;
  }

  var oper = new URLSearchParams(window.location.search).get('oper');
  var btnInserir = document.getElementById('btnInserirVeiculo');
  var btnAtualizar = document.getElementById('btnAtualizarVeiculo');
  var btnRemover = document.getElementById('btnRemoverVeiculo');

  estLimparAoDigitar(form);

  // A placa é escrita sempre em maiúsculas e sem hífen/espaços
  document.getElementById('placa').addEventListener('input', function () {
    this.value = this.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  });

  // oper: Cr = criar, Re = visualizar, Up = atualizar, De = remover
  if (oper === 'Cr') {
    btnInserir.classList.remove('d-none');
    btnInserir.addEventListener('click', vwInsertVeiculo);
  }

  if (oper === 'Re') {
    await vwGetVeiculoByID();
    desabilitarCampos(form);
  }

  if (oper === 'Up') {
    btnAtualizar.classList.remove('d-none');
    btnAtualizar.disabled = !(await vwGetVeiculoByID());
    btnAtualizar.addEventListener('click', vwUpdateVeiculo);
  }

  if (oper === 'De') {
    document.getElementById('avisoExcluir').classList.remove('d-none');
    btnRemover.classList.remove('d-none');
    btnRemover.disabled = !(await vwGetVeiculoByID());
    desabilitarCampos(form);
    btnRemover.addEventListener('click', vwDeleteVeiculo);
  }
});

function desabilitarCampos(form) {
  form.querySelectorAll('input').forEach(function (campo) {
    campo.disabled = true;
  });
}

function obterVeiculoId() {
  var id = new URLSearchParams(window.location.search).get('veiculoId');

  if (!id || !/^\d+$/.test(id) || Number(id) <= 0) {
    throw new Error('ID do veículo inválido.');
  }
  return id;
}

// Regras de validação do formulário (mesmas do backend)
function validarFormularioVeiculo(form, alertBox) {
  return estValidarCampos(form, alertBox, {
    dono: estObrigatorio('Informe o nome do dono.'),
    placa: estValidarPlaca,
    marca: estObrigatorio('Informe a marca do veículo.'),
    modelo: estObrigatorio('Informe o modelo do veículo.')
  });
}

function montarVeiculoDoFormulario() {
  return {
    placa: document.getElementById('placa').value,
    marca: document.getElementById('marca').value,
    modelo: document.getElementById('modelo').value,
    dono: document.getElementById('dono').value
  };
}

// Função do front-end que usa a API InsertVeiculo
async function vwInsertVeiculo() {
  var form = document.getElementById('frmVeiculos');
  var btn = document.getElementById('btnInserirVeiculo');
  var alertBox = document.getElementById('veiculoAlert');

  if (!validarFormularioVeiculo(form, alertBox)) {
    return;
  }

  try {
    btn.disabled = true;
    await estRequest(form.dataset.servidorApi, '/insertVeiculo', {
      method: 'POST',
      body: montarVeiculoDoFormulario()
    });
    window.location.href = '/veiculos';
  } catch (error) {
    estTratarErroFormulario(form, alertBox, error, 'Erro ao inserir veículo.');
    btn.disabled = false;
  }
}

// Função do front-end que usa a API GetVeiculoByID
async function vwGetVeiculoByID() {
  var form = document.getElementById('frmVeiculos');
  var alertBox = document.getElementById('veiculoAlert');

  try {
    var id = obterVeiculoId();
    var data = await estRequest(form.dataset.servidorApi, '/getVeiculoByID/' + encodeURIComponent(id));
    var veiculo = data.registro[0];

    if (!veiculo) {
      throw new Error('Veículo não encontrado.');
    }

    document.getElementById('veiculoid').value = veiculo.veiculoid;
    document.getElementById('placa').value = veiculo.placa ?? '';
    document.getElementById('marca').value = veiculo.marca ?? '';
    document.getElementById('modelo').value = veiculo.modelo ?? '';
    document.getElementById('dono').value = veiculo.dono ?? '';
    return true;
  } catch (error) {
    estExibirErro(alertBox, error.message || 'Erro ao carregar veículo.');
    return false;
  }
}

// Função do front-end que usa a API UpdateVeiculo
async function vwUpdateVeiculo() {
  var form = document.getElementById('frmVeiculos');
  var btn = document.getElementById('btnAtualizarVeiculo');
  var alertBox = document.getElementById('veiculoAlert');

  if (btn.disabled || !validarFormularioVeiculo(form, alertBox)) {
    return;
  }

  try {
    btn.disabled = true;
    var data = await estRequest(form.dataset.servidorApi, '/updateVeiculo/' + encodeURIComponent(obterVeiculoId()), {
      method: 'PUT',
      body: montarVeiculoDoFormulario()
    });

    if (data.linhasAfetadas !== 1) {
      throw new Error('Nenhum veículo foi atualizado.');
    }

    estExibirAviso(alertBox, 'Veículo atualizado com sucesso.');
  } catch (error) {
    estTratarErroFormulario(form, alertBox, error, 'Erro ao atualizar veículo.');
  } finally {
    btn.disabled = false;
  }
}

// Função do front-end que usa a API DeleteVeiculo (soft delete no back-end)
async function vwDeleteVeiculo() {
  var form = document.getElementById('frmVeiculos');
  var btn = document.getElementById('btnRemoverVeiculo');
  var alertBox = document.getElementById('veiculoAlert');

  if (btn.disabled || !window.confirm('Excluir este veículo? Ele e suas entradas/saídas deixarão de aparecer nas listas. Use apenas se o cadastro foi um erro.')) {
    return;
  }

  try {
    btn.disabled = true;
    var data = await estRequest(form.dataset.servidorApi, '/deleteVeiculo/' + encodeURIComponent(obterVeiculoId()), {
      method: 'DELETE'
    });

    if (data.linhasAfetadas !== 1) {
      throw new Error('Nenhum veículo foi excluído.');
    }

    window.location.href = '/veiculos';
  } catch (error) {
    estExibirErro(alertBox, error.message || 'Erro ao excluir veículo.');
    btn.disabled = false;
  }
}