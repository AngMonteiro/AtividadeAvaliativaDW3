//-- arquivo apps/registros/controller/ctlRegistros.js
const mdlRegistros = require("../model/mdlRegistros");

// Converte "" e undefined em null e valida os dados vindos do front-end
function prepararRegistro(body) {
  const b = body || {};
  const vazio = (v) => v === undefined || v === null || v === "";
  const registro = {
    veiculoid: parseInt(b.veiculoid),
    horaentrada: vazio(b.horaentrada) ? null : b.horaentrada,
    horasaida: vazio(b.horasaida) ? null : b.horasaida,
    valor: vazio(b.valor) ? null : Number(b.valor),
  };
  const erros = {};
  if (!Number.isInteger(registro.veiculoid) || registro.veiculoid <= 0) {
    erros.veiculoid = "Selecione o veículo.";
  }
  if (registro.valor !== null && (isNaN(registro.valor) || registro.valor < 0)) {
    erros.valor = "Informe um valor válido (zero ou maior).";
  }
  if (registro.horaentrada && isNaN(Date.parse(registro.horaentrada))) {
    erros.horaentrada = "Data/hora de entrada inválida.";
  }
  if (registro.horasaida && isNaN(Date.parse(registro.horasaida))) {
    erros.horasaida = "Data/hora de saída inválida.";
  }
  if (
    !erros.horaentrada && !erros.horasaida && registro.horaentrada && registro.horasaida &&
    Date.parse(registro.horasaida) < Date.parse(registro.horaentrada)
  ) {
    erros.horasaida = "A saída não pode ser anterior à entrada.";
  }
  return { registro, erros: Object.keys(erros).length ? erros : null };
}

// Resposta padrão para erro de validação (400), com os campos a destacar
function respostaValidacao(res, erros) {
  return res.status(400).json({
    status: "Corrija os campos destacados em vermelho.",
    erros: erros,
    linhasAfetadas: -1,
  });
}

const GetAllRegistros = async (req, res) => {
  try {
    const registro = await mdlRegistros.GetAllRegistros();
    res.json({ status: "ok", registro: registro });
  } catch (error) {
    res.status(500).json({ status: "[ctlRegistros|GetAllRegistros] " + error.message });
  }
};

const GetRegistroByID = async (req, res) => {
  try {
    const registroID = parseInt(req.params.registroid);
    const registro = await mdlRegistros.GetRegistroByID(registroID);
    res.json({ status: "ok", registro: registro });
  } catch (error) {
    res.status(500).json({ status: "[ctlRegistros|GetRegistroByID] " + error.message });
  }
};

const InsertRegistro = async (req, res) => {
  const { registro, erros } = prepararRegistro(req.body);
  if (erros) return respostaValidacao(res, erros);
  const { msg, linhasAfetadas } = await mdlRegistros.InsertRegistro(registro);
  res.status(msg === "ok" ? 200 : 400).json({ status: msg, linhasAfetadas });
};

const UpdateRegistro = async (req, res) => {
  const registroID = parseInt(req.params.registroid);
  const { registro, erros } = prepararRegistro(req.body);
  if (erros) return respostaValidacao(res, erros);
  const { msg, linhasAfetadas } = await mdlRegistros.UpdateRegistro(registroID, registro);
  res.status(msg === "ok" ? 200 : 400).json({ status: msg, linhasAfetadas });
};

const DeleteRegistro = async (req, res) => {
  const registroID = parseInt(req.params.registroid);
  const { msg, linhasAfetadas } = await mdlRegistros.DeleteRegistro(registroID);
  res.status(msg === "ok" ? 200 : 400).json({ status: msg, linhasAfetadas });
};

const RegistrarSaida = async (req, res) => {
  const registroID = parseInt(req.params.registroid);
  const tarifa = Number(process.env.TARIFA_HORA) || 8;
  const { msg, linhasAfetadas, registro } = await mdlRegistros.RegistrarSaida(registroID, tarifa);
  if (msg === "ok" && linhasAfetadas === 0) {
    return res
      .status(400)
      .json({ status: "Registro não encontrado ou a saída já foi registrada.", linhasAfetadas });
  }
  res.status(msg === "ok" ? 200 : 400).json({ status: msg, linhasAfetadas, registro });
};

module.exports = {
  GetAllRegistros,
  GetRegistroByID,
  InsertRegistro,
  UpdateRegistro,
  DeleteRegistro,
  RegistrarSaida,
};
