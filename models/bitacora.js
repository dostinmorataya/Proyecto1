const mongoose = require('mongoose');

//se crea un modelo de la bitácora, acorde a la db

const BitacoraSchema = mongoose.model('bitacoras', {
    dpi: Number,
    productos: [{
        identificador: Number,
        nombre: String,
        marca: String,
        disponibilidad: Number,
        descuento: Number,
        precio: Number,
        precioDescuento: Number,
        imagen: String,
        descripcion: String,
        categorias: [String],
        cantidad: Number
    }],
    total: Number,
});

module.exports = BitacoraSchema;