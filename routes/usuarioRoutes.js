const express = require('express');
const jwt = require('jsonwebtoken');
const secretKey = 'desarrolloweb';
const Segundos = 3000;
const { verifyToken, noEsUnNumeroVacio, noEsUnTextoVacio, validarCorreo, validarContraseña } = require('../controllers/controllers');

const UsuarioSchema = require('../models/user');

const router = express.Router();

// Módulo Login
// POST - INICIA SESIÓN MEDIANTE LAS CREDENCIALES
router.post('/login', async (req, res) => {
    const correo = req.body.correoElectronico;
    const clave = req.body.clave;
    try {
        const usuarioEncontrado = await UsuarioSchema.findOne({ "correoElectronico": correo, "clave": clave });
        if (usuarioEncontrado !== null) {
            const token = jwt.sign({ usuarioEncontrado }, secretKey, { expiresIn: Segundos + 's' });
            res.json({ "mensaje": "Sesión iniciada", token });
        } else {
            res.status(404).json({ error: 'Verifica tus datos' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error desconocido' });
    }
});

// Módulo Registro de Usuario
// POST - SE CREA UN NUEVO USUARIO SEGÚN LOS DATOS INGRESADOS
router.post('/registro/:dpi', async (req, res) => {
    try {
        const regex = /^[A-Za-z]+$/;
        const dpi = req.params.dpi;
        const {
            nombres,
            apellidos,
            fechaNacimiento,
            direccionEntrega,
            nit,
            numeroTelefonico,
            correoElectronico,
            clave,
            validacionClave,
            rol
        } = req.body;

        const existingUser = await UsuarioSchema.findOne({
            $or: [
                { dpi: dpi },
                { nit: nit },
                { correoElectronico: correoElectronico }
            ]
        });
        if (existingUser) {
            return res.status(400).json({ error: 'Los datos ya se encuentran en el sistema' });
        }
        if (!dpi || !nombres || !apellidos || !fechaNacimiento || !direccionEntrega || !nit || !numeroTelefonico || !correoElectronico || !clave || !validacionClave || !rol) {
            return res.status(400).json({ error: 'No se admiten campos vacios' });
        }
        if (!regex.test(nombres) || !regex.test(apellidos)) {
            return res.status(400).json({ error: 'Verifica nombres y/o apellidos' });
        }
        if (!validarCorreo(correoElectronico)) {
            return res.status(400).json({ error: 'Formato incorrecto de correo' });
        }
        if (!validarContraseña(clave)) {
            return res.status(400).json({ error: 'La contraseña no es suficientemente segura' });
        }
        if (clave !== validacionClave) {
            return res.status(400).json({ error: 'Contraseña y confirmación no son iguales' });
        }

        const nuevoUsuario = await UsuarioSchema.create({
            dpi,
            nombres,
            apellidos,
            fechaNacimiento,
            direccionEntrega,
            nit,
            numeroTelefonico,
            correoElectronico,
            clave,
            validacionClave,
            rol
        });

        res.status(201).json({ "mensaje": "Te haz registrado" });
    } catch (error) {
        res.status(400).json({ error: 'No te pudiste registrar' });
    }
});

// Módulo de Gestión de Perfil
// GET - MUESTRA TODOS LOS DATOS ASOCIADOS AL USUARIO Y SU TOKEN
router.get('/perfil/:dpi', verifyToken, (req, res) => {
    const dpiBuscar = req.params.dpi;
    if (dpiBuscar == req.dpi) {
        res.json({
            "message": "Estos son tus datos",
            "dpi": req.dpi,
            "nombres": req.nombres,
            "apellidos": req.apellidos,
            "fechaNacimiento": req.fechaNacimiento,
            "direccionEntrega": req.direccionEntrega,
            "nit": req.nit,
            "numeroTelefonico": req.numeroTelefonico,
            "correoElectronico": req.correoElectronico,
            "clave": req.clave,
            "validacionClave": req.validacionClave,
            "rol": req.rol
        });
    } else {
        res.sendStatus(403); // Forbidden
    }
});


//PATCH - MODIFICA LOS DATOS ASOCIADOS AL USUARIO
router.patch('/perfil/:dpi', verifyToken, async (req, res) => {
    const regex = /^[A-Za-z]+$/;
    const dpiBuscar = req.params.dpi;
    if (dpiBuscar == req.dpi) {

        try {
            const updateFields = {};
            const fieldsToValidate = [
                'nombres',
                'apellidos',
                'fechaNacimiento',
                'direccionEntrega',
                'nit',
                'correoElectronico',
                'numeroTelefonico',
                'clave',
                'validacionClave'
            ];

            for (const field of fieldsToValidate) {
                if (req.body[field] !== undefined) {
                    if (field === 'nit' || field === 'numeroTelefonico') {
                        if (!noEsUnNumeroVacio(req.body[field])) {
                            return res.status(400).json({ error: "No se admiten campos vacios" });
                        }
                    } else {
                        if (!noEsUnTextoVacio(req.body[field])) {
                            return res.status(400).json({ error: "No se admiten campos vacios" });
                        }
                    }
                    if (field === 'nombres' || field === 'apellidos') {
                        if (!regex.test(req.body[field])) {
                            return res.status(400).json({ error: 'Verifica nombres y/o apellidos' });
                        }
                    }

                    updateFields[field] = req.body[field];
                }
            }

            if (req.body.correoElectronico !== undefined) {
                if (!validarCorreo(req.body.correoElectronico)) {
                    return res.status(400).json({ error: 'Formato incorrecto de correo' });
                }
            }

            if (req.body.clave !== undefined) {
                if (!validarContraseña(req.body.clave)) {
                    return res.status(400).json({ error: 'La contraseña no es suficientemente segura' });
                }
            }

            if (req.body.nit !== undefined || req.body.correoElectronico !== undefined) {
                const existingUser = await UsuarioSchema.findOne({
                    $or: [
                        { dpi: dpiBuscar },
                        { nit: req.body.nit },
                        { correoElectronico: req.body.correoElectronico }
                    ]
                });

                if (existingUser) {
                    if (existingUser.dpi !== req.dpi && existingUser.nit === req.body.nit) {
                        return res.status(400).json({ error: 'Nit ya registrado' });
                    }
                    if (existingUser.dpi !== req.dpi && existingUser.correoElectronico === req.body.correoElectronico) {
                        return res.status(400).json({ error: 'Correo ya registrado' });
                    }
                }
            }

            const usuarioActualizado = await UsuarioSchema.findOneAndUpdate(
                { dpi: dpiBuscar },
                { $set: updateFields },
                { new: true }
            );

            if (usuarioActualizado) {
                const camposActualizados = {};
                for (const key in updateFields) {
                    if (updateFields.hasOwnProperty(key)) {
                        camposActualizados[key] = usuarioActualizado[key];
                    }
                }
                res.json({ mensaje: 'Se actualizaron tus datos', camposActualizados });
            } else {
                res.status(404).json({ error: 'No existen datos' });
            }
        } catch (error) {
            res.status(500).json({ error: 'Error desconocido' });
        }
    } else {
        res.sendStatus(403); // Forbidden
    }
});


// DELETE - ELIMINA EL USUARIO CREADO E INVÁLIDA EL TOKEN
router.delete('/perfil/:dpi', verifyToken, async (req, res) => {
    const dpiBuscar = req.params.dpi;
    if (dpiBuscar == req.dpi) {
        try {
            const usuarioEliminado = await UsuarioSchema.findOneAndDelete(
                { dpi: dpiBuscar }
            );

            if (usuarioEliminado) {
                res.json({ mensaje: 'Se eliminó tu cuenta' });
            } else {
                res.status(404).json({ error: 'No exixten datos' });
            }
        } catch (error) {
            res.status(500).json({ error: 'Error desconocido' });
        }
    } else {
        res.sendStatus(403); // Forbidden
    }
});

module.exports = router;