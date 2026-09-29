# Guía de instalación y ejecución — SeñaLeng

Esta guía explica cómo ejecutar la API y la app en una computadora con Windows (los pasos son iguales en macOS/Linux, salvo donde se indica).

## 1. Requisitos

| Herramienta | Versión recomendada | Comprobar con |
|---|---|---|
| Node.js | 22 o 24 LTS (mínimo 20) | `node -v` |
| npm | 10 u 11 | `npm -v` |
| Git | 2.4x | `git --version` |
| Visual Studio Code | reciente | — |
| Expo Go (celular) | la versión actual de Play Store / App Store | — |
| Postman (opcional) | 11.x | — |

> El celular y la computadora deben estar conectados a la **misma red Wi-Fi**. En redes escolares que aíslan dispositivos, usa el hotspot del celular o el modo túnel (ver sección 6).

## 2. Obtener el proyecto

```bash
git clone <url-del-repositorio> senaleng
cd senaleng
```
(o descomprime el ZIP entregado).

## 3. Ejecutar la API

```bash
cd api
npm install
```

**Primera vez: crea tu archivo `.env`** (define la cuenta principal, que es la única que ve estadísticas):

```powershell
copy .env.example .env     # Windows
notepad .env               # cambia PRINCIPAL_CORREO, PRINCIPAL_PASSWORD y JWT_SECRET
```
(macOS/Linux: `cp .env.example .env`). El archivo `.env` no se sube a GitHub. Más detalles en [USUARIOS_Y_ROLES.md](USUARIOS_Y_ROLES.md).

```bash
npm run dev
```

Verás algo como:

```
🤟 SeñaLeng API en ejecución
   Local:          http://localhost:3000/api
   Red local:      http://192.168.1.100:3000/api   ← usa esta en Expo Go
   Documentación:  http://localhost:3000/api/docs
```

- Abre **http://localhost:3000/api/docs** para ver y probar todos los endpoints con Swagger.
- La primera vez se crea `api/data/db.json` con 33 señas de ejemplo, la cuenta principal y 3 cuentas de prueba (super, admin y usuario; ver [USUARIOS_Y_ROLES.md](USUARIOS_Y_ROLES.md)).
- Si tenías la base de datos de la versión 1, se regenera sola al arrancar (la v1 no tenía contraseñas).
- Los videos subidos quedan en `api/uploads/` (o en Cloudinary si configuras `CLOUDINARY_URL`).

### Scripts de la API

| Comando | Qué hace |
|---|---|
| `npm run dev` | Inicia con **nodemon** (se reinicia al guardar cambios) |
| `npm start` | Inicia en modo normal |
| `npm test` | Ejecuta las 22 pruebas automatizadas |
| `npm run seed` | Restablece la base de datos a los datos semilla (detén la API antes) |
| `npm run principal` | Aplica a la cuenta principal el correo/contraseña que tengas en `.env` |

### Variables de entorno (opcional)

Copia `.env.example` a `.env` o define en la terminal:

| Variable | Default | Descripción |
|---|---|---|
| `PORT` | `3000` | Puerto HTTP |
| `HOST` | `0.0.0.0` | Interfaz (0.0.0.0 permite conexiones desde el celular) |
| `DB_FILE` | `api/data/db.json` | Archivo de datos; `:memory:` para no guardar en disco |
| `JWT_SECRET` | (de desarrollo) | Clave para firmar sesiones. **Cámbiala** |
| `PRINCIPAL_NOMBRE` / `PRINCIPAL_CORREO` / `PRINCIPAL_PASSWORD` | cuenta de ejemplo | La cuenta única que ve estadísticas |
| `SEED_DEMO_USERS` | `true` | Crear cuentas de prueba |
| `MAX_VIDEO_MB` | `60` | Tamaño máximo por video |
| `CLOUDINARY_URL` | vacío | Si se define, los videos se suben a Cloudinary |

En PowerShell: `$env:PORT=4000; npm start`

## 4. Ejecutar la app

En **otra** terminal:

```bash
cd app
npm install
npx expo start
```

- **Celular:** abre Expo Go y escanea el código QR (en iPhone, con la cámara).
- **Navegador:** presiona `w`.
- **Emulador Android:** presiona `a` (requiere Android Studio con un AVD encendido).

### ¿Cómo encuentra la app a la API?

`app/src/config.js` decide la URL en este orden:

1. Variable `EXPO_PUBLIC_API_URL` en `app/.env` (ej. `EXPO_PUBLIC_API_URL=http://192.168.1.100:3000/api`).
2. En web: `http://localhost:3000/api`.
3. En Expo Go: toma la IP de la PC desde el servidor de Expo y usa el puerto 3000.
4. Emulador Android sin IP: `http://10.0.2.2:3000/api`.

Además, en la pestaña **Perfil → Conexión con la API** se puede escribir otra URL y probarla; se guarda en el dispositivo.

## 5. Probar la API con Postman

Importa `docs/SenaLeng.postman_collection.json`. La variable `baseUrl` ya apunta a `http://localhost:3000/api`. La colección incluye todas las operaciones CRUD de señas, favoritos, usuarios y progreso, más casos de error.

## 6. Solución de problemas

| Problema | Solución |
|---|---|
| La app muestra "No se pudo conectar con la API" | Verifica que la API esté corriendo; abre `http://<IP>:3000/api/health` en el navegador del **celular**. Si no abre, es la red o el firewall. |
| Windows bloquea la conexión | Al primer arranque, acepta el aviso del Firewall para Node.js en redes **privadas**. O en PowerShell (admin): `New-NetFirewallRule -DisplayName "SenaLeng API" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow` |
| Red escolar aísla dispositivos | Usa el hotspot del celular, o `npx expo start --tunnel` y expón la API con un túnel (ej. `npx localtunnel --port 3000`) y pega esa URL en Perfil. |
| Expo Go dice "Project is incompatible with this version of Expo Go" | Actualiza Expo Go. El proyecto usa SDK 57. |
| `EADDRINUSE: 3000` | Ya hay algo en el puerto 3000: cierra la otra API o usa `PORT=3001`. Cambia también la URL en la app. |
| "Sesión inválida o expirada" | Vuelve a iniciar sesión. Pasa si cambiaste `JWT_SECRET` o pasaron 7 días. |
| Olvidé la contraseña del principal | Cambia `PRINCIPAL_PASSWORD` en `api/.env`, detén la API y ejecuta `npm run principal`. |
| No se ve el video en el celular | Revisa que la URL de la API en Perfil sea la IP de la PC (no `localhost`). |
| Quiero empezar de cero | Detén la API y ejecuta `npm run seed`. En la app, desinstala/limpia datos de Expo Go para borrar la caché. |
| Dependencias inconsistentes en la app | `npx expo install --fix` y luego `npx expo-doctor`. |

## 7. Generar la versión web / instalable

```bash
cd app
npm run export:web      # genera app/dist, se puede subir a Netlify/Vercel
```

Para un APK/IPA real: `npx eas-cli@latest build -p android --profile preview` (requiere cuenta gratuita de Expo).
