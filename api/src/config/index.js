const path = require('path');

// Carga opcional de variables desde api/.env (sin dependencias extra).
try {
  process.loadEnvFile?.(path.join(__dirname, '..', '..', '.env'));
} catch {
  /* no hay .env: se usan los valores por defecto */
}

const env = process.env;
const isTest = env.NODE_ENV === 'test';

module.exports = {
  port: Number(env.PORT) || 3000,
  host: env.HOST || '0.0.0.0',
  isTest,
  // Archivo JSON que funciona como base de datos (":memory:" = sin disco, para pruebas).
  dbFile: env.DB_FILE || path.join(__dirname, '..', '..', 'data', 'db.json'),

  // Autenticación
  jwtSecret: env.JWT_SECRET || 'senaleng-dev-secret-CAMBIAR-EN-PRODUCCION',
  jwtExpiresIn: env.JWT_EXPIRES_IN || '7d',
  bcryptRounds: isTest ? 4 : 10,

  // Superusuario principal: la ÚNICA cuenta que puede ver las estadísticas.
  // Sus credenciales solo deben conocerlas el dueño del proyecto (definirlas en api/.env).
  principal: {
    nombre: env.PRINCIPAL_NOMBRE || 'Superusuario principal',
    correo: (env.PRINCIPAL_CORREO || 'principal@senaleng.app').toLowerCase(),
    password: env.PRINCIPAL_PASSWORD || 'Principal123!',
  },
  // Crea cuentas de ejemplo (super, admin, usuario) al generar la base de datos.
  seedDemoUsers: env.SEED_DEMO_USERS !== 'false',

  // Videos
  uploadsDir: env.UPLOADS_DIR || path.join(__dirname, '..', '..', 'uploads'),
  maxVideoMB: Number(env.MAX_VIDEO_MB) || 60,
  // Si se define, los videos se suben a Cloudinary (nube). Formato: cloudinary://KEY:SECRET@CLOUD_NAME
  cloudinaryUrl: env.CLOUDINARY_URL || '',
};
