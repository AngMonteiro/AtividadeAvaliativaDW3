//-- arquivo: app.js
const express = require("express");
require("dotenv").config();
const router = require("./routes/router");
const app = express();
const port = process.env.PORT || 41000;

// Configuração do CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

//@ Utiliza o router configurado em ./routes/router.js
app.use(router);
app.listen(port, () => {
  console.log(`Backend do estacionamento ouvindo na porta ${port}`);
});
