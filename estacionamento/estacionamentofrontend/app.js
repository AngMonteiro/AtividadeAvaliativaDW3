// Arquivo app.js
var path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'estacionamentofrontend.env'), quiet: true });
var createError = require('http-errors');
var express = require('express');
var nunjucks = require('nunjucks');
var indexRouter = require('./routes/rtIndex');
var loginRouter = require('./routes/rtLogin');
var homeRouter = require('./routes/rtHome');
var veiculosRouter = require('./routes/rtVeiculos');
var registrosRouter = require('./routes/rtRegistros');

process.env.SERVIDOR_API = process.env.SERVIDOR_API || 'http://localhost:41000';
var app = express();
var viewsPath = path.join(__dirname, 'views');
var appsPath = path.join(__dirname, 'apps');
const port = process.env.PORT || 41100;

app.set('views', [viewsPath, appsPath]);
app.set('view engine', 'njk');
nunjucks.configure([viewsPath, appsPath], {
    autoescape: true,
    express: app,
    noCache: app.get('env') === 'development'
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/apps', express.static(path.join(__dirname, 'apps')));

app.use('/', indexRouter);
app.use('/login', loginRouter);
app.use('/home', homeRouter);
app.use('/veiculos', veiculosRouter);
app.use('/registros', registrosRouter);

app.use(function (req, res, next) {
    next(createError(404));
});

app.use(function (err, req, res, next) {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    res.status(err.status || 500);
    res.render('error', { title: 'Erro', showNavbar: false });
});

app.listen(port, () => {
    console.log(`Frontend do estacionamento ouvindo na porta ${port}`);
});
