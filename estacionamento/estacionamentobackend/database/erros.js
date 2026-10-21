// Converte erros do PostgreSQL em mensagens amigáveis para o usuário.
// Os detalhes técnicos vão só para o log do servidor, nunca para a tela.
const mensagens = {
  uq_veiculos_placa: "Já existe um veículo cadastrado com esta placa.",
  uq_registros_aberto: "Este veículo já está no estacionamento (entrada sem saída).",
  ck_registros_saida: "A saída não pode ser anterior à entrada.",
  registros_veiculoid_fkey: "Veículo inexistente.",
};

// Campo do formulário que deve ser destacado para cada restrição
const campos = {
  uq_veiculos_placa: "placa",
  registros_veiculoid_fkey: "veiculoid",
  ck_registros_saida: "horasaida",
};

const MENSAGEM_PADRAO = "Não foi possível concluir a operação. Tente novamente.";

function traduzErro(origem, error) {
  console.error("[" + origem + "]", error.message, error.detail || "");
  return mensagens[error.constraint] || MENSAGEM_PADRAO;
}

traduzErro.campoDoErro = (error) => campos[error.constraint] || null;

module.exports = traduzErro;
