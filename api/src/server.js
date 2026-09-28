const os = require('os');
const app = require('./app');
const { port, host } = require('./config');

app.listen(port, host, () => {
  const ips = Object.values(os.networkInterfaces())
    .flat()
    .filter((i) => i && i.family === 'IPv4' && !i.internal)
    .map((i) => i.address);

  console.log('\n🤟 SeñaLeng API en ejecución');
  console.log(`   Local:          http://localhost:${port}/api`);
  ips.forEach((ip) => console.log(`   Red local:      http://${ip}:${port}/api   ← usa esta en Expo Go`));
  console.log(`   Documentación:  http://localhost:${port}/api/docs\n`);
});
