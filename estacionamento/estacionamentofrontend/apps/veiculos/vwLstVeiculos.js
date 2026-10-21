var tabelaVeiculos = null;

document.addEventListener('DOMContentLoaded', function () {
  if (!estIsLogged()) {
    return;
  }

  var listagem = document.getElementById('veiculosListagem');
  var alertBox = document.getElementById('veiculosAlert');

  if (!listagem) {
    return;
  }

  var servidorApi = listagem.dataset.servidorApi;

  inicializarTabelaVeiculos();
  configurarOperacoesVeiculos(servidorApi, alertBox);
  vwGetAllVeiculos(servidorApi, alertBox);
});

// Função do front-end que usa a API GetAllVeiculos
async function vwGetAllVeiculos(servidorApi, alertBox) {
  try {
    var data = await estRequest(servidorApi, '/getAllVeiculos');
    tabelaVeiculos.clear().rows.add(data.registro).draw();
  } catch (error) {
    estExibirErro(alertBox, error.message || 'Erro ao carregar veículos.');
  }
}

// Função do front-end que usa a API RegistrarSaida (saída normal do carro)
async function vwRegistrarSaidaVeiculo(servidorApi, registroId, placa, alertBox) {
  if (!window.confirm('Registrar a saída do veículo ' + placa + ' agora?')) {
    return;
  }

  try {
    var data = await estRequest(servidorApi, '/registrarSaida/' + encodeURIComponent(registroId), {
      method: 'PUT'
    });

    estExibirAviso(
      alertBox,
      'Saída do veículo ' + placa + ' registrada em ' + estFormatarDataHora(data.registro.horasaida) +
        '. Valor a pagar: ' + estFormatarMoeda(data.registro.valor) + '.'
    );
    await vwGetAllVeiculos(servidorApi, alertBox);
  } catch (error) {
    estExibirErro(alertBox, error.message || 'Erro ao registrar a saída.');
  }
}

// Texto da coluna "Situação" a partir da última entrada/saída do veículo
function situacaoDoVeiculo(row) {
  if (!row.registroid) {
    return '<span class="badge text-bg-light border">Sem entrada</span>';
  }
  if (!row.horasaida) {
    return '<span class="badge text-bg-success">No pátio</span> <small class="text-secondary">desde ' +
      estEscaparHtml(estFormatarDataHora(row.horaentrada)) + '</small>';
  }
  return '<span class="badge text-bg-secondary">Saiu</span> <small class="text-secondary">em ' +
    estEscaparHtml(estFormatarDataHora(row.horasaida)) + '</small>';
}

function inicializarTabelaVeiculos() {
  tabelaVeiculos = new DataTable('#tblVeiculos', {
    data: [],
    order: [],
    columns: [
      { data: 'veiculoid', defaultContent: '' },
      {
        data: 'placa',
        render: function (data, type) {
          return type === 'display' ? '<span class="placa">' + estEscaparHtml(data) + '</span>' : data;
        }
      },
      { data: 'marca', defaultContent: '' },
      { data: 'modelo', defaultContent: '' },
      { data: 'dono', defaultContent: '' },
      {
        data: null,
        render: function (data, type, row) {
          if (type !== 'display') {
            return !row.registroid ? 'sem entrada' : row.horasaida ? 'saiu' : 'no pátio';
          }
          return situacaoDoVeiculo(row);
        }
      },
      {
        data: null,
        orderable: false,
        searchable: false,
        render: function (data, type, row) {
          if (type !== 'display') {
            return '';
          }

          var id = estEscaparHtml(row.veiculoid || '');
          var noPatio = row.registroid && !row.horasaida;
          var botaoSaida = noPatio
            ? '<button class="btn btn-success" type="button" data-action="saida" data-id="' + id + '" data-registro-id="' + estEscaparHtml(row.registroid) + '" data-placa="' + estEscaparHtml(row.placa) + '" title="Registrar saída" aria-label="Registrar saída"><i class="bi bi-box-arrow-right me-1"></i>Saída</button>'
            : '';

          return [
            '<div class="btn-group btn-group-sm" role="group" aria-label="Operações do veículo">',
            botaoSaida,
            '<button class="btn btn-outline-primary" type="button" data-action="visualizar" data-id="' + id + '" title="Visualizar" aria-label="Visualizar"><i class="bi bi-eye"></i></button>',
            '<button class="btn btn-outline-secondary" type="button" data-action="atualizar" data-id="' + id + '" title="Atualizar" aria-label="Atualizar"><i class="bi bi-pencil-square"></i></button>',
            '<button class="btn btn-outline-danger" type="button" data-action="remover" data-id="' + id + '" title="Excluir (cadastro feito por engano)" aria-label="Excluir"><i class="bi bi-trash"></i></button>',
            '</div>'
          ].join('');
        }
      }
    ],
    language: Object.assign({ emptyTable: 'Nenhum veículo cadastrado.' }, estLinguagemTabela)
  });
}

function configurarOperacoesVeiculos(servidorApi, alertBox) {
  var tabela = document.getElementById('tblVeiculos');

  tabela.addEventListener('click', function (event) {
    var botao = event.target.closest('button[data-action][data-id]');

    if (!botao) {
      return;
    }

    if (botao.dataset.action === 'saida') {
      vwRegistrarSaidaVeiculo(servidorApi, botao.dataset.registroId, botao.dataset.placa, alertBox);
      return;
    }

    var opers = { visualizar: 'Re', atualizar: 'Up', remover: 'De' };
    var oper = opers[botao.dataset.action];

    if (oper) {
      window.location.href = '/veiculos/form?oper=' + oper + '&veiculoId=' + encodeURIComponent(botao.dataset.id);
    }
  });
}
