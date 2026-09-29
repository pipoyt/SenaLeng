# SeñaLeng 🤟 — Aprende Lengua de Señas Mexicana

Proyecto integrador de la **Unidad I – Aplicaciones Web Progresivas**
Ingeniería en Desarrollo y Gestión de Software · **IDGS-10A** · Universidad Tecnológica de Aguascalientes
Profesor: Jesus Bryan Gonzalez Delgado · **Equipo 6**

| Integrante | Matrícula |
|---|---|
| Christopher Esquivel García | 230747 |
| Jesus Antonio Castillo Coronado | 230192 |
| Axel Ivan Feliciano Hernandez | 230538 |
| Karol Teresa Bernal Gallegos | 230627 |

---

## ¿Qué es?

SeñaLeng es una aplicación móvil multiplataforma (Android, iOS y web) para aprender **Lengua de Señas Mexicana (LSM)**. Consume una **API REST propia hecha con Node.js + Express** que implementa las operaciones **CRUD** descritas en el documento del proyecto (secciones 10 y 11).

**Versión 2:** cuentas de usuario con correo y contraseña, roles (usuario, administrador, superusuario y principal), grabación de videos de señas con aprobación y panel de estadísticas. Ver [docs/USUARIOS_Y_ROLES.md](docs/USUARIOS_Y_ROLES.md).

```
┌──────────────────────────┐   HTTP / JSON    ┌─────────────────────────┐     ┌──────────────┐
│  App móvil               │ ───────────────▶ │  SeñaLeng API           │ ──▶ │ data/db.json │
│  React Native + Expo     │ ◀─────────────── │  Node.js + Express      │     │ (persistencia)│
│  (caché en AsyncStorage) │                  │  Swagger en /api/docs   │     └──────────────┘
└──────────────────────────┘                  └─────────────────────────┘
```

## Estructura del repositorio

```
senaleng/
├── api/            API REST (Node.js + Express)         → ver api/README.md
├── app/            App móvil (React Native + Expo)      → ver app/README.md
├── docs/           Documentación técnica
│   ├── GUIA_INSTALACION.md   Paso a paso para correr todo (Windows / macOS)
│   ├── API.md                Referencia de endpoints con ejemplos
│   ├── ARQUITECTURA.md       Arquitectura, modelo de datos, pantallas y flujos
│   ├── PRUEBAS.md            Plan de pruebas y resultados
│   ├── USUARIOS_Y_ROLES.md   Registro, roles, flujo de videos y estadísticas
│   ├── RECOMENDACIONES.md    Observaciones al documento y plan para la Unidad II
│   ├── SenaLeng.postman_collection.json
│   └── capturas/             Capturas de la app funcionando
└── README.md
```

## Inicio rápido

Requisitos: **Node.js 20 o superior** (recomendado 22/24 LTS), npm y la app **Expo Go** en el celular.

```bash
# 1) API
cd api
npm install
copy .env.example .env   # (Windows) define aquí tu cuenta principal; en macOS/Linux: cp
npm run dev          # http://localhost:3000/api  ·  docs: http://localhost:3000/api/docs

# 2) App (en otra terminal)
cd app
npm install
npx expo start       # escanea el QR con Expo Go (misma red Wi-Fi que la PC)
                     # o presiona "w" para abrirla en el navegador
```

> La app detecta sola la IP de tu computadora a partir del servidor de Expo. Si no conecta, cámbiala en la pestaña **Perfil → Conexión con la API**. Detalles y solución de problemas en [docs/GUIA_INSTALACION.md](docs/GUIA_INSTALACION.md).

## Funcionalidades implementadas

| Documento | Implementación |
|---|---|
| Fig. 2 Splash Screen | `SplashScreen.js` animado + splash nativo con el logo |
| Fig. 3 Pantalla de inicio | `HomeScreen.js`: lección del día con progreso real y categorías |
| Fig. 4 Listado de señas | `SenasListScreen.js`: búsqueda, filtros por categoría, pull-to-refresh |
| Fig. 5 Detalle de seña | `SenaDetailScreen.js`: descripción, favorito, relacionadas, video, "aprendida" |
| Fig. 6 Eliminar de favoritos | `ConfirmDeleteSheet.js` (DELETE `/api/favoritos/:id`) |
| Fig. 7 Añadir favoritos | `AgregarFavoritosScreen.js` (POST `/api/favoritos`) con aviso tipo *toast* |
| Fig. 8 Editar favoritos | `FavoritosScreen.js` + `CommentSheet.js` (PATCH `/api/favoritos/:id`) |
| Tabla 3 CRUD | Favoritos: Create / Read / Update / Delete completos |
| Sección 11.6 Endpoints | Todos los endpoints de la tabla + extras (relacionadas, categorías, progreso) |
| Sección 11.3 Swagger | OpenAPI 3.0 en `/api/docs` |
| Sección 10.1 Almacenamiento local | Caché de respuestas GET en AsyncStorage (modo sin conexión) |
| CRUD de la entidad Seña | Crear (botón ＋), editar (✏️) y eliminar (🗑️) desde la app |
| Progreso del usuario | Marcar "aprendida" + pestaña Perfil con avance por categoría |
| **v2** Cuentas | Registro e inicio de sesión con correo y contraseña (bcrypt + JWT) |
| **v2** Roles | Usuario · Administrador · Superusuario · Principal (única) |
| **v2** Videos | Admins graban o suben el video de una seña → superusuarios aprueban o rechazan |
| **v2** Gestión | Superusuarios ven todos los usuarios y asignan roles |
| **v2** Estadísticas | Panel exclusivo del superusuario principal |

## Tecnologías

| Capa | Tecnología |
|---|---|
| App | React Native 0.86 · Expo SDK 57 · React Navigation 7 · AsyncStorage · expo-image-picker · expo-video |
| API | Node.js · Express 4 · bcryptjs · jsonwebtoken · multer · Cloudinary (opcional) · swagger-ui-express |
| Datos | Archivo JSON con escritura atómica (sustituible por Prisma + PostgreSQL en la Unidad II) |
| Pruebas | `node:test` + Supertest (27 pruebas) · Playwright (flujo E2E en web con los 4 roles) |

> **Nota sobre versiones:** el documento indica Expo SDK 52 / React Native 0.76. La app de **Expo Go** de las tiendas solo ejecuta el SDK más reciente, por eso el proyecto usa **SDK 57**. Ver [docs/RECOMENDACIONES.md](docs/RECOMENDACIONES.md).

## Aviso sobre el contenido

Las descripciones de las señas incluidas en los datos semilla son **material de ejemplo para desarrollo**. Antes de publicar la app deben ser revisadas por hablantes nativos de LSM o asociaciones de personas sordas, tal como plantea el propio documento (sección 2.4).
