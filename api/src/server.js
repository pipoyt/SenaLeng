const os = require('os');
const app = require('./app');
const { port, host, jwtSecret, principal } = require('./config');
const { provider } = require('./services/storage');

app.listen(port, host, () => {
  const ips = Object.values(os.networkInterfaces())
    .flat()
    .filter((i) => i && i.family === 'IPv4' && !i.internal)
    .map((i) => i.address);

  console.log('\n🤟 SeñaLeng API en ejecución');
  console.log(`   Local:          http://localhost:${port}/api`);
  ips.forEach((ip) => console.log(`   Red local:      http://${ip}:${port}/api   ← usa esta en Expo Go`));
  console.log(`   Documentación:  http://localhost:${port}/api/docs`);
  console.log(`   Videos:         ${provider === 'cloudinary' ? 'Cloudinary (nube)' : 'carpeta local api/uploads'}\n`);
  if (jwtSecret.includes('CAMBIAR')) console.warn('⚠ Define JWT_SECRET en api/.env antes de publicar la API.');
  if (principal.password === 'Principal123!') console.warn('⚠ El superusuario principal usa la contraseña de ejemplo: cámbiala en api/.env (PRINCIPAL_PASSWORD).');
});
