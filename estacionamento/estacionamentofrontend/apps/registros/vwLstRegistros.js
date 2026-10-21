var tabelaRegistros = null;

document.addEventListener('DOMContentLoaded', function () {
  if (!estIsLogged()) {
    return;
  }

  var listagem = document.getElementById('registrosListagem');
  var alertBox = document.getElementById('registrosAlert');

  if (!listagem) {
    return;
  }

  var servidorApi = listagem.dataset.servidorApi;

  inicializarTabelaRegistros();
  configurarOperacoesRegistros(servidorApi, alertBox);
  vwGetAllRegistros(servidorApi, alertBox);
});

// Função do front-end que usa a API GetAllRegistros
async function vwGetAllRegistros(servidorApi, alertBox) {
  try {
    var data = await estRequest(servidorApi, '/getAllRegistros');
    tabelaRegistros.clear().rows.add(data.registro).draw();
  } catch (error) {
    estExibirErro(alertBox, error.message || 'Erro ao carregar os registros.');
  }
}

// Função do front-end que usa a API RegistrarSaida
async function vwRegistrarSaida(servidorApi, registroId, alertBox) {
  if (!window.confirm('Registrar a saída deste veículo agora?')) {
    return;
  }

  try {
    var data = await estRequest(servidorApi, '/registrarSaida/' + encodeURIComponent(registroId), {
      method: 'PUT'
    });

    estExibirAviso(
      alertBox,
      'Saída registrada em ' + estFormatarDataHora(data.registro.horasaida) +
        '. Valor a pagar: ' + estFormatarMoeda(data.registro.valor) + '.'
    );
    await vwGetAllRegistros(servidorApi, alertBox);
  } catch (error) {
    estExibirErro(alertBox, error.message || 'Erro ao registrar a saída.');
  }
}

function inicializarTabelaRegistros() {
  tabelaRegistros = new DataTable('#tblRegistros', {
    data: [],
    order: [[4, 'desc']],
    columns: [
      { data: 'registroid', defaultContent: '' },
      {
        data: 'placa',
        render: function (data, type) {
          return type === 'display' ? '<span class="placa">' + estEscaparHtml(data) + '</span>' : data;
        }
      },
      { data: 'modelo', defaultContent: '' },
      { data: 'dono', defaultContent: '' },
      {
        data: 'horaentrada',
        render: function (data, type) {
          return type === 'display' ? estFormatarDataHora(data) : data;
        }
      },
      {
        data: 'horasaida',
        defaultContent: '',
        render: function (data, type) {
          if (type !== 'display') {
            return data || '';
          }
          return data ? estFormatarDataHora(data) : '<span class="badge text-bg-success">No pátio</span>';
        }
      },
      {
        data: 'valor',
        defaultContent: '',
        render: function (data, type) {
          return type === 'display' ? estFormatarMoeda(data) : data;
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

          var id = estEscaparHtml(row.registroid || '');
          var botaoSaida = row.horasaida
            ? ''
            : '<button class="btn btn-success" type="button" data-action="saida" data-id="' + id + '" title="Registrar saída" aria-label="Registrar saída"><i class="bi bi-box-arrow-right me-1"></i>Saída</button>';

          return [
            '<div class="btn-group btn-group-sm" role="group" aria-label="Operações do registro">',
            botaoSaida,
            '<button class="btn btn-outline-primary" type="button" data-action="visualizar" data-id="' + id + '" title="Visualizar" aria-label="Visualizar"><i class="bi bi-eye"></i></button>',
            '<button class="btn btn-outline-secondary" type="button" data-action="atualizar" data-id="' + id + '" title="Atualizar" aria-label="Atualizar"><i class="bi bi-pencil-square"></i></button>',
            '<button class="btn btn-outline-danger" type="button" data-action="remover" data-id="' + id + '" title="Excluir (lançamento feito por engano)" aria-label="Excluir"><i class="bi bi-trash"></i></button>',
            '</div>'
          ].join('');
        }
      }
    ],
    language: Object.assign({ emptyTable: 'Nenhum registro cadastrado.' }, estLinguagemTabela)
  });
}

function configurarOperacoesRegistros(servidorApi, alertBox) {
  var tabela = document.getElementById('tblRegistros');

  tabela.addEventListener('click', function (event) {
    var botao = event.target.closest('button[data-action][data-id]');

    if (!botao) {
      return;
    }

    var id = botao.dataset.id;

    if (botao.dataset.action === 'saida') {
      vwRegistrarSaida(servidorApi, id, alertBox);
      return;
    }

    var opers = { visualizar: 'Re', atualizar: 'Up', remover: 'De' };
    var oper = opers[botao.dataset.action];

    if (oper) {
      window.location.href = '/registros/form?oper=' + oper + '&registroId=' + encodeURIComponent(id);
    }
  });
}