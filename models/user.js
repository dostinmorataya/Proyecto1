const mongoose = require('mongoose');

//se crea un modelo del usuario, acorde a la db

const UsuarioSchema = mongoose.model('usuarios', {
    dpi: Number,
    nombres: String,
    apellidos: String,
    fechaNacimiento: String,
    direccionEntrega: String,
    nit: Number,
    numeroTelefonico: Number,
    correoElectronico: String,
    clave: String,
    validacionClave: String,
    rol: String,
});

module.exports = UsuarioSchema;
