var express = require('express');
var router = express.Router();

router.get('/', function (req, res) {
  res.render('veiculos/vwLstVeiculos', {
    title: 'Veículos',
    showNavbar: true,
    activeMenu: 'veiculos',
    servidorApi: process.env.SERVIDOR_API
  });
});

router.get('/form', function (req, res) {
  res.render('veiculos/vwFormVeiculos', {
    title: 'Formulário de veículos',
    showNavbar: true,
    activeMenu: 'veiculos',
    servidorApi: process.env.SERVIDOR_API
  });
});

module.exports = router;
