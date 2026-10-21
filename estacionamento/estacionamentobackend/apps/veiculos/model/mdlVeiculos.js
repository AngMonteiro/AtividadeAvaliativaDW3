//-- arquivo apps/veiculos/model/mdlVeiculos.js
const db = require("../../../database/databaseconfig");
const traduzErro = require("../../../database/erros");
const campoDoErro = traduzErro.campoDoErro;

// Traz cada veículo com os dados da sua última entrada/saída (relação 1:N)
const GetAllVeiculos = async () => {
  return (
    await db.query(
      "SELECT v.*, r.registroid, r.horaentrada, r.horasaida, r.valor " +
        "FROM veiculos v " +
        "LEFT JOIN LATERAL (" +
        "  SELECT registroid, horaentrada, horasaida, valor FROM registros " +
        "  WHERE veiculoid = v.veiculoid AND removido = false " +
        "  ORDER BY horaentrada DESC LIMIT 1" +
        ") r ON true " +
        "WHERE v.removido = false ORDER BY r.horaentrada DESC NULLS LAST, v.placa ASC"
    )
  ).rows;
};

const GetVeiculoByID = async (veiculoIDPar) => {
  return (
    await db.query("SELECT * FROM veiculos WHERE veiculoid = $1 AND removido = false", [
      veiculoIDPar,
    ])
  ).rows;
};

// Insere o veículo e já registra a entrada com a hora atual (now() do banco).
// Se a placa já estiver cadastrada, atualiza marca, modelo e dono e abre uma nova entrada.
const InsertVeiculo = async (veiculoREGPar) => {
  let linhasAfetadas;
  let msg = "ok";
  let campo = null;
  try {
    const existente = (
      await db.query("SELECT veiculoid FROM veiculos WHERE placa = $1 AND removido = false", [
        veiculoREGPar.placa,
      ])
    ).rows[0];

    if (existente) {
      linhasAfetadas = (
        await db.query(
          "WITH v AS (UPDATE veiculos SET marca = $2, modelo = $3, dono = $4 WHERE veiculoid = $1 RETURNING veiculoid) " +
            "INSERT INTO registros (veiculoid) SELECT veiculoid FROM v",
          [existente.veiculoid, veiculoREGPar.marca, veiculoREGPar.modelo, veiculoREGPar.dono]
        )
      ).rowCount;
    } else {
      linhasAfetadas = (
        await db.query(
          "WITH v AS (INSERT INTO veiculos (placa, marca, modelo, dono, removido) " +
            "VALUES ($1, $2, $3, $4, false) RETURNING veiculoid) " +
            "INSERT INTO registros (veiculoid) SELECT veiculoid FROM v",
          [veiculoREGPar.placa, veiculoREGPar.marca, veiculoREGPar.modelo, veiculoREGPar.dono]
        )
      ).rowCount;
    }
  } catch (error) {
    msg = traduzErro("mdlVeiculos|InsertVeiculo", error);
    campo = campoDoErro(error);
    linhasAfetadas = -1;
  }
  return { msg, linhasAfetadas, campo };
};

const UpdateVeiculo = async (veiculoIDPar, veiculoREGPar) => {
  let linhasAfetadas;
  let msg = "ok";
  let campo = null;
  try {
    linhasAfetadas = (
      await db.query(
        "UPDATE veiculos SET placa = $2, marca = $3, modelo = $4, dono = $5 " +
          "WHERE veiculoid = $1 AND removido = false",
        [
          veiculoIDPar,
          veiculoREGPar.placa,
          veiculoREGPar.marca,
          veiculoREGPar.modelo,
          veiculoREGPar.dono,
        ]
      )
    ).rowCount;
  } catch (error) {
    msg = traduzErro("mdlVeiculos|UpdateVeiculo", error);
    campo = campoDoErro(error);
    linhasAfetadas = -1;
  }
  return { msg, linhasAfetadas, campo };
};

// Exclusão (soft delete) para cadastros feitos por engano: o veículo e todas as
// suas entradas/saídas ficam com removido = true e somem das duas listas.
// Para a saída normal do carro, usar RegistrarSaida (registros).
const DeleteVeiculo = async (veiculoIDPar) => {
  let linhasAfetadas;
  let msg = "ok";
  try {
    linhasAfetadas = (
      await db.query(
        "WITH r AS (UPDATE registros SET removido = true WHERE veiculoid = $1 AND removido = false) " +
          "UPDATE veiculos SET removido = true WHERE veiculoid = $1 AND removido = false",
        [veiculoIDPar]
      )
    ).rowCount;
  } catch (error) {
    msg = traduzErro("mdlVeiculos|DeleteVeiculo", error);
    linhasAfetadas = -1;
  }
  return { msg, linhasAfetadas };
};

module.exports = {
  GetAllVeiculos,
  GetVeiculoByID,
  InsertVeiculo,
  UpdateVeiculo,
  DeleteVeiculo,
};