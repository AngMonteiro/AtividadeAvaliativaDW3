//-- arquivo apps/veiculos/controller/ctlVeiculos.js
const mdlVeiculos = require("../model/mdlVeiculos");

// Normaliza e valida os dados vindos do front-end.
// Devolve `erros` como { campo: "mensagem" } para o front destacar cada campo.
function prepararVeiculo(body) {
  const b = body || {};
  const placaDigitada = String(b.placa || "").trim();
  const veiculo = {
    placa: placaDigitada.toUpperCase().replace(/[^A-Z0-9]/g, ""),
    marca: String(b.marca || "").trim(),
    modelo: String(b.modelo || "").trim(),
    dono: String(b.dono || "").trim(),
  };
  const erros = {};

  if (!placaDigitada) {
    erros.placa = "Informe a placa do veículo.";
  } else if (!/^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(veiculo.placa)) {
    erros.placa =
      'A placa "' + placaDigitada.slice(0, 20) + '" não é válida. ' +
      "Use o formato antigo (ABC1234) ou Mercosul (ABC1D23).";
  }
  if (!veiculo.dono) erros.dono = "Informe o nome do dono.";
  else if (veiculo.dono.length > 100) erros.dono = "O nome do dono deve ter no máximo 100 caracteres.";
  if (!veiculo.marca) erros.marca = "Informe a marca do veículo.";
  else if (veiculo.marca.length > 50) erros.marca = "A marca deve ter no máximo 50 caracteres.";
  if (!veiculo.modelo) erros.modelo = "Informe o modelo do veículo.";
  else if (veiculo.modelo.length > 50) erros.modelo = "O modelo deve ter no máximo 50 caracteres.";

  return { veiculo, erros: Object.keys(erros).length ? erros : null };
}

// Resposta padrão para erro de validação (400)
function respostaValidacao(res, erros) {
  return res.status(400).json({
    status: "Corrija os campos destacados em vermelho.",
    erros: erros,
    linhasAfetadas: -1,
  });
}

// Resposta padrão para o resultado do model (ok = 200, erro = 400)
function respostaModel(res, { msg, linhasAfetadas, campo }) {
  const ok = msg === "ok";
  const corpo = { status: msg, linhasAfetadas };
  if (!ok && campo) corpo.erros = { [campo]: msg };
  res.status(ok ? 200 : 400).json(corpo);
}

const GetAllVeiculos = async (req, res) => {
  try {
    const registro = await mdlVeiculos.GetAllVeiculos();
    res.json({ status: "ok", registro: registro });
  } catch (error) {
    res.status(500).json({ status: "[ctlVeiculos|GetAllVeiculos] " + error.message });
  }
};

const GetVeiculoByID = async (req, res) => {
  try {
    const veiculoID = parseInt(req.params.veiculoid);
    const registro = await mdlVeiculos.GetVeiculoByID(veiculoID);
    res.json({ status: "ok", registro: registro });
  } catch (error) {
    res.status(500).json({ status: "[ctlVeiculos|GetVeiculoByID] " + error.message });
  }
};

const InsertVeiculo = async (req, res) => {
  const { veiculo, erros } = prepararVeiculo(req.body);
  if (erros) return respostaValidacao(res, erros);
  respostaModel(res, await mdlVeiculos.InsertVeiculo(veiculo));
};

const UpdateVeiculo = async (req, res) => {
  const veiculoID = parseInt(req.params.veiculoid);
  const { veiculo, erros } = prepararVeiculo(req.body);
  if (erros) return respostaValidacao(res, erros);
  respostaModel(res, await mdlVeiculos.UpdateVeiculo(veiculoID, veiculo));
};

const DeleteVeiculo = async (req, res) => {
  const veiculoID = parseInt(req.params.veiculoid);
  const { msg, linhasAfetadas } = await mdlVeiculos.DeleteVeiculo(veiculoID);
  res.status(msg === "ok" ? 200 : 400).json({ status: msg, linhasAfetadas });
};

module.exports = {
  GetAllVeiculos,
  GetVeiculoByID,
  InsertVeiculo,
  UpdateVeiculo,
  DeleteVeiculo,
};
