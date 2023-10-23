const express = require('express');
const jwt = require('jsonwebtoken');

const { verifyToken, noEsUnNumeroVacio2, noEsUnTextoVacio } = require('../controllers/controllers');

const ProductoSchema = require('../models/product');

const router = express.Router();

router.get('/productos', verifyToken, async (req, res) => {
    if (req.rol === 'admin') {
        try {
            const productosEncontrados = await ProductoSchema.find({});
            if (productosEncontrados !== null) {
                res.json(productosEncontrados);
            } else {
                res.status(404).json({ error: 'Sin productos' });
            }
        } catch (error) {
            res.status(500).json({ error: 'Error desconocido' });
        }
    } else if (req.rol === 'usuario') {
        try {
            const productosEncontrados = await ProductoSchema.find({ "habilitado": 1 }).select('-habilitado');
            if (productosEncontrados !== null) {
                res.json(productosEncontrados);
            } else {
                res.status(404).json({ error: 'Sin productos' });
            }
        } catch (error) {
            res.status(500).json({ error: 'Error desconocido' });
        }
    }
});

// GET - PRODUCTO ESPECÍFICO
router.get('/producto/:identificador', verifyToken, async (req, res) => {
    const idBuscar = req.params.identificador;
    try {
        const productoEncontrado = await ProductoSchema.findOne({ "identificador": idBuscar });
        if (productoEncontrado !== null) {
            res.json(productoEncontrado);
        } else {
            res.status(404).json({ error: 'No hay información disponible' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error desconocido' });
    }
});

// Módulo Gestión de Productos
// POST - CREAR NUEVOS PRODUCTOS
router.post('/producto', verifyToken, async (req, res) => {
    try {
        if (req.rol === 'admin') {
            const {
                identificador,
                nombre,
                marca,
                disponibilidad,
                descuento,
                precio,
                imagen,
                descripcion,
                categorias,
                habilitado
            } = req.body;

            const habilitadoValidar = habilitado;
            const precioDescuento = precio - descuento;

            if (identificador === undefined || nombre === undefined || marca === undefined || disponibilidad === undefined || descuento === undefined || precio === undefined || imagen === undefined || descripcion === undefined || categorias === undefined || habilitado === undefined
                || identificador === null || nombre === null || marca === null || disponibilidad === null || descuento === null || precio === null || imagen === null || descripcion === null || categorias === null || habilitado === null) {
                return res.status(400).json({ error: 'No se admiten campos vacios' });
            }

            if (descuento > precio) {
                return res.status(400).json({ error: 'Descuento no permitido' });
            }
            if (descuento === precio) {
                return res.status(400).json({ error: 'Precio no permitido' });
            }

            if (habilitadoValidar === 1 || habilitadoValidar === 0) {
                // Verificar si ya existe un producto con el mismo identificador
                const existingProduct = await ProductoSchema.findOne({ identificador });

                if (existingProduct) {
                    res.status(400).json({ error: 'El id del producto ya existe' });
                } else {
                    // Si no existe, crea el nuevo producto
                    const nuevoProducto = await ProductoSchema.create({
                        identificador,
                        nombre,
                        marca,
                        disponibilidad,
                        descuento,
                        precio,
                        precioDescuento,
                        imagen,
                        descripcion,
                        categorias,
                        habilitado
                    });
                    res.status(201).json({ mensaje: 'Haz creado un producto' });
                }
            } else {
                res.status(400).json({ error: 'Solo 1 o 0 para habilitado' });
            }
        } else {
            res.status(400).json({ error: 'Sin permisos' });
        }
    } catch (error) {
        res.status(400).json({ error: 'Error desconocido con la creación' });
    }
});



// PATCH - MODIFICAR DATOS DEL PRODUCTO
// PATCH - MODIFICAR DATOS DEL PRODUCTO
router.patch('/producto/:identificador', verifyToken, async (req, res) => {
    const idBuscar = req.params.identificador;
    try {
        if (req.rol === 'admin') {
            const fieldsToValidate = [
                'nombre',
                'marca',
                'disponibilidad',
                'imagen',
                'descripcion',
                'categorias',
                'habilitado'
            ];

            const updateFields = {};

            for (const field of fieldsToValidate) {
                if (req.body[field] !== undefined) {
                    if (field === 'disponibilidad' || field === 'habilitado') {
                        if (!noEsUnNumeroVacio2(req.body[field])) {
                            return res.status(400).json({ error: "No se admiten campos vacios" });
                        }
                    } else {
                        if (!noEsUnTextoVacio(req.body[field])) {
                            return res.status(400).json({ error: "No se admiten campos vacios" });
                        }
                    }
                    // Realizar la conversión de categorías a un array y limpiar los valores
                    if (field === 'categorias') {
                        const contenidoCategorias = req.body[field].toString();
                        const categoríasArray = contenidoCategorias.split(',');
                        const categoríasLimpio = categoríasArray.map(categoría => categoría.trim());
                        updateFields[field] = categoríasLimpio;
                    } else {
                        updateFields[field] = req.body[field];
                    }
                }
            }

            // Realiza una consulta para obtener los valores actuales de "precio" y "descuento"
            const productoActual = await ProductoSchema.findOne({ identificador: idBuscar });
            if (!productoActual) {
                return res.status(404).json({ error: 'Sin información para este producto' });
            }


            if ((req.body.precio !== undefined && !noEsUnNumeroVacio2(req.body.precio)) ||
                (req.body.descuento !== undefined && !noEsUnNumeroVacio2(req.body.descuento))) {
                return res.status(400).json({ error: 'No se admiten campos vacios' });
            }

            if (req.body.precio !== undefined) {
                updateFields.precio = req.body.precio;
            }

            if (req.body.descuento !== undefined) {
                updateFields.descuento = req.body.descuento;
            }

            // Recalcula el precioDescuento
            if (req.body.precio !== undefined || req.body.descuento !== undefined) {
                let nuevoPrecio = req.body.precio !== undefined ? req.body.precio : productoActual.precio;
                let nuevoDescuento = req.body.descuento !== undefined ? req.body.descuento : productoActual.descuento;
                if (nuevoDescuento < 0) {
                    return res.status(400).json({ error: 'Descuento no admitido' });
                }
                if (nuevoDescuento >= nuevoPrecio) {
                    return res.status(400).json({ error: 'Descuento no admitido' });
                }
                updateFields.precioDescuento = nuevoPrecio - nuevoDescuento;
            }

            if (req.body.habilitado !== undefined) {
                if (req.body.habilitado !== 0 && req.body.habilitado !== 1) {
                    return res.status(400).json({ error: 'Solo 1 o 0 para habilitado' });
                }
            }

            const productoActualizado = await ProductoSchema.findOneAndUpdate(
                { identificador: idBuscar },
                { $set: updateFields },
                { new: true }
            );
            if (productoActualizado) {
                const camposActualizados = {};
                for (const key in updateFields) {
                    if (updateFields.hasOwnProperty(key)) {
                        camposActualizados[key] = productoActualizado[key];
                    }
                }
                res.json({ mensaje: 'Se actualizaron los datos', camposActualizados });
            } else {
                res.status(404).json({ error: 'Producto no existe' });
            }
        } else {
            res.status(400).json({ error: 'Sin permisos' });
        }
    } catch (error) {
        res.status(400).json({ error: 'Error desconocido al modificar el producto' });
    }
});

// DELETE - ELIMINA A NIVEL EL PRODUCTO (habilitado/deshabilitado)
router.delete('/producto/:identificador', verifyToken, async (req, res) => {
    const idBuscar = req.params.identificador;
    try {
        if (req.rol === 'admin') {
            const cambiarEstado = 0;
            const updateFields = {};

            updateFields.habilitado = cambiarEstado;
            const productoActualizado = await ProductoSchema.findOneAndUpdate(
                { identificador: idBuscar },
                { $set: updateFields },
                { new: true }
            );
            if (productoActualizado) {
                const camposActualizados = {};
                for (const key in updateFields) {
                    if (updateFields.hasOwnProperty(key)) {
                        camposActualizados[key] = productoActualizado[key];
                    }
                }
                res.json({ mensaje: 'Se eliminó el producto', camposActualizados });
            } else {
                res.status(404).json({ error: 'Producto no existe' });
            }

        } else {
            res.status(400).json({ error: 'Sin permisos' });
        }
    } catch (error) {
        res.status(400).json({ error: 'Error desconocido al eliminar el producto' });
    }
});

module.exports = router;