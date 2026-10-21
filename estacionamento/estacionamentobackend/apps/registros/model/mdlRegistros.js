//-- arquivo apps/registros/model/mdlRegistros.js
const db = require("../../../database/databaseconfig");
const traduzErro = require("../../../database/erros");

// Traz também os dados do veículo (placa, marca, modelo, dono) pela relação 1:N
const SQL_BASE =
  "SELECT r.*, v.placa, v.marca, v.modelo, v.dono " +
  "FROM registros r JOIN veiculos v ON v.veiculoid = r.veiculoid ";

const GetAllRegistros = async () => {
  return (
    await db.query(SQL_BASE + "WHERE r.removido = false AND v.removido = false ORDER BY r.horaentrada DESC")
  ).rows;
};

const GetRegistroByID = async (registroIDPar) => {
  return (
    await db.query(SQL_BASE + "WHERE r.registroid = $1 AND r.removido = false AND v.removido = false", [
      registroIDPar,
    ])
  ).rows;
};

const InsertRegistro = async (registroREGPar) => {
  let linhasAfetadas;
  let msg = "ok";
  try {
    linhasAfetadas = (
      await db.query(
        "INSERT INTO registros (veiculoid, horaentrada, horasaida, valor, removido) " +
          "VALUES ($1, COALESCE($2, now()), $3, $4, false)",
        [
          registroREGPar.veiculoid,
          registroREGPar.horaentrada,
          registroREGPar.horasaida,
          registroREGPar.valor,
        ]
      )
    ).rowCount;
  } catch (error) {
    msg = traduzErro("mdlRegistros|InsertRegistro", error);
    linhasAfetadas = -1;
  }
  return { msg, linhasAfetadas };
};

const UpdateRegistro = async (registroIDPar, registroREGPar) => {
  let linhasAfetadas;
  let msg = "ok";
  try {
    linhasAfetadas = (
      await db.query(
        "UPDATE registros SET veiculoid = $2, horaentrada = COALESCE($3, horaentrada), " +
          "horasaida = $4, valor = $5 " +
          "WHERE registroid = $1 AND removido = false",
        [
          registroIDPar,
          registroREGPar.veiculoid,
          registroREGPar.horaentrada,
          registroREGPar.horasaida,
          registroREGPar.valor,
        ]
      )
    ).rowCount;
  } catch (error) {
    msg = traduzErro("mdlRegistros|UpdateRegistro", error);
    linhasAfetadas = -1;
  }
  return { msg, linhasAfetadas };
};

// Soft delete: o registro não é apagado, apenas o campo removido vira true
const DeleteRegistro = async (registroIDPar) => {
  let linhasAfetadas;
  let msg = "ok";
  try {
    linhasAfetadas = (
      await db.query(
        "UPDATE registros SET removido = true WHERE registroid = $1 AND removido = false",
        [registroIDPar]
      )
    ).rowCount;
  } catch (error) {
    msg = traduzErro("mdlRegistros|DeleteRegistro", error);
    linhasAfetadas = -1;
  }
  return { msg, linhasAfetadas };
};

// Marca a saída agora e calcula o valor: horas arredondadas para cima (mínimo 1) x tarifa
const RegistrarSaida = async (registroIDPar, tarifaPar) => {
  let linhasAfetadas;
  let registro = null;
  let msg = "ok";
  try {
    const resultado = await db.query(
      "UPDATE registros SET horasaida = now(), " +
        "valor = GREATEST(CEIL(EXTRACT(EPOCH FROM (now() - horaentrada)) / 3600), 1) * $2 " +
        "WHERE registroid = $1 AND horasaida IS NULL AND removido = false " +
        "RETURNING registroid, horaentrada, horasaida, valor",
      [registroIDPar, tarifaPar]
    );
    linhasAfetadas = resultado.rowCount;
    registro = resultado.rows[0] || null;
  } catch (error) {
    msg = traduzErro("mdlRegistros|RegistrarSaida", error);
    linhasAfetadas = -1;
  }
  return { msg, linhasAfetadas, registro };
};

module.exports = {
  GetAllRegistros,
  GetRegistroByID,
  InsertRegistro,
  UpdateRegistro,
  DeleteRegistro,
  RegistrarSaida,
};
