const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const openapi = require('./docs/openapi');
const routes = require('./routes');
const { uploadsDir } = require('./config');
const { notFound, errorHandler } = require('./middlewares/errorHandler');

const app = express();

app.use(cors()); // Permite el consumo desde la app móvil y Expo Web (sección 11.9)
app.use(express.json({ limit: '100kb' }));
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

app.get('/', (_req, res) => res.redirect('/api/docs'));
// Videos subidos en modo local (express.static soporta Range, necesario para reproducir en iOS)
app.use('/uploads', express.static(uploadsDir, { maxAge: '7d', fallthrough: false }));
app.get('/api/openapi.json', (_req, res) => res.json(openapi));
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapi, { customSiteTitle: 'SeñaLeng API — Docs' }));
app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
