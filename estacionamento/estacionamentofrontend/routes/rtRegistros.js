var express = require('express');
var router = express.Router();

router.get('/', function (req, res) {
  res.render('registros/vwLstRegistros', {
    title: 'Entradas e saídas',
    showNavbar: true,
    activeMenu: 'registros',
    servidorApi: process.env.SERVIDOR_API
  });
});

router.get('/form', function (req, res) {
  res.render('registros/vwFormRegistros', {
    title: 'Formulário de entrada e saída',
    showNavbar: true,
    activeMenu: 'registros',
    servidorApi: process.env.SERVIDOR_API
  });
});

module.exports = router;
