var express = require('express');
var router = express.Router();

router.get('/', function (req, res) {
    res.render('login', {
        title: 'Login',
        showNavbar: false,
        servidorApi: process.env.SERVIDOR_API // O front em html não acessa o arquivo .env
    });
});

module.exports = router;
