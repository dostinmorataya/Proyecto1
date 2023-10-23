const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');

const usuarioRoutes = require('./routes/usuarioRoutes');
const productoRoutes = require('./routes/productoRoutes');
const carritoRoutes = require('./routes/carritoRoutes');
const comprasRoutes = require('./routes/comprasRoutes');


const app = express();

const port = 3000;

app.use(bodyParser.json());

mongoose.connect('mongodb+srv://dostin:proyecto1@primerproyecto.cqjxzuh.mongodb.net/PrimerProyecto', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('Mongo listo'))
    .catch(error => console.error('MongoDB error: ', error));

// se establecen las ruta predefinida con sus futuros módulos o variaciones
app.use(cors()); //En los middlewares
app.use('/proyecto1', usuarioRoutes);
app.use('/proyecto1', productoRoutes);
app.use('/proyecto1', carritoRoutes);
app.use('/proyecto1', comprasRoutes);

app.listen(port, () => {
    console.log(`Se está ejecutando`);
});