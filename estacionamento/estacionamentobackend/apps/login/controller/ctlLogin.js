//-- apps/login/controller/ctlLogin.js
const jwt = require("jsonwebtoken");
const bCrypt = require("bcryptjs");
const mdlLogin = require("../model/mdlLogin");

const Login = async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ auth: false, message: "Informe usuário e senha." });
  }
  try {
    const credencial = await mdlLogin.GetCredencial(username);
    if (credencial.length === 0 || !bCrypt.compareSync(password, credencial[0].password)) {
      return res.status(401).json({ auth: false, message: "Usuário ou senha inválidos!" });
    }
    const token = jwt.sign({ username: credencial[0].username }, process.env.SECRET_API, {
      expiresIn: Number(process.env.JWT_EXPIRES) || 3600,
    });
    return res.json({ auth: true, token: token, username: credencial[0].username });
  } catch (error) {
    return res.status(500).json({ auth: false, message: "[ctlLogin|Login] " + error.message });
  }
};

// Middleware que protege as rotas: exige o header Authorization: Bearer <token>
function AutenticaJWT(req, res, next) {
  const tokenHeader = req.headers["authorization"];
  if (!tokenHeader) {
    return res.status(401).json({ auth: false, message: "Não foi informado o token JWT" });
  }
  const bearer = tokenHeader.split(" ");
  const token = bearer[1];
  jwt.verify(token, process.env.SECRET_API, function (err, decoded) {
    if (err) {
      return res.status(401).json({ auth: false, message: "JWT inválido ou expirado" });
    }
    req.username = decoded.username;
    next();
  });
}

const Logout = (req, res) => {
  res.json({ auth: false, token: null });
};

module.exports = {
  Login,
  Logout,
  AutenticaJWT,
};
