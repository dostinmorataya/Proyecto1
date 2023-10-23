const mongoose = require('mongoose');

//se crea un modelo del producto, acorde a la db

const ProductoSchema = mongoose.model('productos', {
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
    habilitado: Number,
});

module.exports = ProductoSchema;