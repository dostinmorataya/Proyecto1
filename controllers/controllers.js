// archivo utilizado para agregar funciones que se utilizan en varios apartados del código
const jwt = require('jsonwebtoken');
const secretKey = 'desarrolloweb';

const UsuarioSchema = require('../models/user');

//verifica el token, si existe el usuario en base de datos y lo firma digitalmente
function verifyToken(req, res, next) {
    const token = req.headers['authorization'];
    if (typeof token !== 'undefined') {
        jwt.verify(token, secretKey, async (err, decoded) => {
            if (err) {
                res.sendStatus(403); // Forbidden
            } else {
                const usuarioEncontrado = await UsuarioSchema.findOne({ _id: decoded.usuarioEncontrado._id });
                if (usuarioEncontrado) {
                    req.correoElectronico = usuarioEncontrado.correoElectronico;
                    req.clave = usuarioEncontrado.clave;
                    req.dpi = usuarioEncontrado.dpi;
                    req.nombres = usuarioEncontrado.nombres;
                    req.apellidos = usuarioEncontrado.apellidos;
                    req.fechaNacimiento = usuarioEncontrado.fechaNacimiento;
                    req.direccionEntrega = usuarioEncontrado.direccionEntrega;
                    req.nit = usuarioEncontrado.nit;
                    req.numeroTelefonico = usuarioEncontrado.numeroTelefonico;
                    req.validacionClave = usuarioEncontrado.validacionClave;
                    req.rol = usuarioEncontrado.rol;
                    next();
                } else {
                    res.sendStatus(401); // Unauthorized
                }
            }
        });
    } else {
        res.sendStatus(401); // Unauthorized
    }
}

//funciones de validacion de los datos ingresados

function noEsUnNumeroVacio(num) {
    return typeof num === 'number';
}
function noEsUnNumeroVacio2(num) {
    return typeof num === 'number';
}

function noEsUnTextoVacio(str) {
    return typeof str === 'string' && str.trim() !== '';
}

function validarCorreo(email) {
    const emailRegex = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/g;
    return emailRegex.test(email);
}

function validarContraseña(password) {
    const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/gm;
    return passwordRegex.test(password);
}

module.exports = {
    verifyToken,
    noEsUnNumeroVacio,
    noEsUnNumeroVacio2,
    noEsUnTextoVacio,
    validarCorreo,
    validarContraseña
};
