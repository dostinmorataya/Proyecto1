const express = require('express');
const jwt = require('jsonwebtoken');

const { verifyToken } = require('../controllers/controllers');

const ProductoSchema = require('../models/product');
const CarritoSchema = require('../models/cart');

const router = express.Router();

// Módulo Carrito de Compra
// GET - TODOS LOS PRODUCTOS DEL CARRITO
router.get('/carrito', verifyToken, async (req, res) => {
    try {
        const carritoEncontrado = await CarritoSchema.findOne({ "dpi": req.dpi });
        if (carritoEncontrado !== null) {
            res.json(carritoEncontrado);
        } else {
            res.status(404).json({ error: 'No hay productos' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error desconocido' });
    }
});

// GET - AGREGA PRODUCTOS AL CARRITO
router.post('/carrito', verifyToken, async (req, res) => {
    const idBuscar = req.body.identificador;
    const cantidadAgregar = req.body.cantidad;

    try {
        const productoEncontrado = await ProductoSchema.findOne({ "identificador": idBuscar });

        if (productoEncontrado === null) {
            return res.status(404).json({ error: 'No existe el producto solicitado' });
        }

        const dpiUsuario = req.dpi;

        let carrito = await CarritoSchema.findOne({ "dpi": dpiUsuario });

        if (!carrito) {
            carrito = new CarritoSchema({
                dpi: dpiUsuario,
                productos: [],
                total: 0,
            });
        }
        if (cantidadAgregar === 0) {
            return res.status(400).json({ error: 'Cantidad no admitida' });
        }

        const productoEnCarrito = carrito.productos.find(p => p.identificador === idBuscar);

        if (productoEnCarrito) {
            return res.status(400).json({ mensaje: 'El producto ya está en el carrito' });
        }

        if (productoEncontrado.disponibilidad < cantidadAgregar) {
            return res.status(400).json({ error: 'Verifica stock' });
        }

        carrito.productos.push({
            identificador: productoEncontrado.identificador,
            nombre: productoEncontrado.nombre,
            marca: productoEncontrado.marca,
            disponibilidad: productoEncontrado.disponibilidad,
            descuento: productoEncontrado.descuento,
            precio: productoEncontrado.precio,
            precioDescuento: productoEncontrado.precioDescuento,
            imagen: productoEncontrado.imagen,
            descripcion: productoEncontrado.descripcion,
            categorias: productoEncontrado.categorias,
            cantidad: cantidadAgregar
        });

        carrito.total += productoEncontrado.precioDescuento * cantidadAgregar;

        productoEncontrado.disponibilidad -= cantidadAgregar;
        await productoEncontrado.save();

        await carrito.save();

        return res.status(200).json({ mensaje: 'Haz agregado un producto al carrito' });
    } catch (error) {
        res.status(500).json({ error: 'Error desconocido' });
    }
});

// DELETE - QUITAR PRODUCTO DEL CARRITO
router.delete('/carrito', verifyToken, async (req, res) => {
    const idBuscar = req.body.identificador;

    try {
        const carrito = await CarritoSchema.findOne({ "dpi": req.dpi });

        if (carrito !== undefined) {
            const productoIndex = carrito.productos.findIndex(p => p.identificador == idBuscar);

            if (productoIndex !== -1) {
                const productoEliminado = carrito.productos[productoIndex];

                if (productoEliminado.cantidad > 1) {
                    // Si hay más de 1 unidad, simplemente disminuye la cantidad en 1
                    productoEliminado.cantidad -= 1;
                } else {
                    // Si solo hay 1 unidad, elimina el producto del carrito
                    carrito.productos.splice(productoIndex, 1);
                }

                // Aumenta la disponibilidad en 1
                const productoEncontrado = await ProductoSchema.findOne({ "identificador": idBuscar });
                productoEncontrado.disponibilidad += 1;
                await productoEncontrado.save();

                // Actualiza el total
                carrito.total -= productoEliminado.precioDescuento;
                await carrito.save();

                return res.status(200).json({ mensaje: 'Haz eliminado un producto del carrito' });
            } else {
                return res.status(404).json({ error: 'El producto no existe en el carrito' });
            }
        } else {
            return res.status(404).json({ error: 'No existe el carrito solicitado' });
        }
    } catch (error) {
        return res.status(500).json({ error: 'Error desconocido' });
    }
});
module.exports = router;