//-- arquivo: routes/router.js
const express = require("express");
const routerApp = express.Router();

const appVeiculos = require("../apps/veiculos/controller/ctlVeiculos");
const appRegistros = require("../apps/registros/controller/ctlRegistros");
const appLogin = require("../apps/login/controller/ctlLogin");

routerApp.get("/", (req, res) => {
  res.send("API do estacionamento no ar!");
});

// Rotas de Login (únicas sem JWT)
routerApp.post("/Login", appLogin.Login);
routerApp.post("/Logout", appLogin.Logout);

// Rotas de Veículos (todas protegidas por JWT)
routerApp.get("/getAllVeiculos", appLogin.AutenticaJWT, appVeiculos.GetAllVeiculos);
routerApp.get("/getVeiculoByID/:veiculoid", appLogin.AutenticaJWT, appVeiculos.GetVeiculoByID);
routerApp.post("/insertVeiculo", appLogin.AutenticaJWT, appVeiculos.InsertVeiculo);
routerApp.put("/updateVeiculo/:veiculoid", appLogin.AutenticaJWT, appVeiculos.UpdateVeiculo);
routerApp.delete("/deleteVeiculo/:veiculoid", appLogin.AutenticaJWT, appVeiculos.DeleteVeiculo);

// Rotas de Registros de entrada e saída (todas protegidas por JWT)
routerApp.get("/getAllRegistros", appLogin.AutenticaJWT, appRegistros.GetAllRegistros);
routerApp.get("/getRegistroByID/:registroid", appLogin.AutenticaJWT, appRegistros.GetRegistroByID);
routerApp.post("/insertRegistro", appLogin.AutenticaJWT, appRegistros.InsertRegistro);
routerApp.put("/updateRegistro/:registroid", appLogin.AutenticaJWT, appRegistros.UpdateRegistro);
routerApp.delete("/deleteRegistro/:registroid", appLogin.AutenticaJWT, appRegistros.DeleteRegistro);
// Rota extra: marca a saída do veículo com o horário atual e calcula o valor
routerApp.put("/registrarSaida/:registroid", appLogin.AutenticaJWT, appRegistros.RegistrarSaida);

module.exports = routerApp;
