document.addEventListener('DOMContentLoaded', async function () {
  if (!estIsLogged()) {
    return;
  }

  var dados = document.getElementById('homeDados');
  var alertBox = document.getElementById('homeAlert');

  try {
    var servidorApi = dados.dataset.servidorApi;
    var registros = (await estRequest(servidorApi, '/getAllRegistros')).registro;
    var veiculos = (await estRequest(servidorApi, '/getAllVeiculos')).registro;

    var noPatio = registros.filter(function (r) { return !r.horasaida; }).length;

    document.getElementById('qtdNoPatio').textContent = noPatio;
    document.getElementById('qtdSaidas').textContent = registros.length - noPatio;
    document.getElementById('qtdVeiculos').textContent = veiculos.length;
  } catch (error) {
    estExibirErro(alertBox, error.message || 'Erro ao carregar o painel.');
  }
});
