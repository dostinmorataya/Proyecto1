const mongoose = require('mongoose');

//se crea un modelo del carrito, acorde a la db

const CarritoSchema = mongoose.model('carritos', {
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

module.exports = CarritoSchema;