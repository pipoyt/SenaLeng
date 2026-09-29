# SeñaLeng API — Referencia

API REST para la gestión de señas de la Lengua de Señas Mexicana.

- **Base URL (local):** `http://localhost:3000/api`
- **Base URL (dispositivo físico):** `http://<IP-de-la-PC>:3000/api`
- **Documentación interactiva:** `http://localhost:3000/api/docs` (Swagger UI) · especificación en `/api/openapi.json`
- **Formato:** JSON (UTF-8) · **CORS:** habilitado
- **Autenticación (v2):** JWT. Envía `Authorization: Bearer <token>` (se obtiene en `/auth/login` o `/auth/registro`). La lectura de señas y categorías es pública.

### Permisos por rol

| Acción | usuario | admin | superusuario | principal |
|---|:-:|:-:|:-:|:-:|
| Ver señas y categorías (sin sesión también) | ✓ | ✓ | ✓ | ✓ |
| Favoritos y progreso propios | ✓ | ✓ | ✓ | ✓ |
| Crear / editar señas | | ✓ | ✓ | ✓ |
| Enviar videos · ver los propios | | ✓ | ✓ | ✓ |
| Eliminar señas · aprobar/rechazar videos · ver usuarios · asignar roles | | | ✓ | ✓ |
| Cambiar el rol de otro superusuario | | | | ✓ |
| Estadísticas | | | | ✓ |

## Formato de respuesta

Éxito:
```json
{ "success": true, "data": { ... }, "meta": { "total": 33, "page": 1, "limit": 33, "pages": 1 } }
```
`meta` solo aparece en listados.

Error:
```json
{
  "success": false,
  "error": {
    "code": 400,
    "message": "Datos inválidos",
    "details": ["El campo \"categoria\" es obligatorio", "El campo \"nivel\" es obligatorio"]
  }
}
```

| Código | Significado |
|---|---|
| 200 | OK |
| 201 | Recurso creado (incluye cabecera `Location`) |
| 400 | Datos inválidos, ID no numérico o JSON mal formado |
| 401 | Sin sesión, token inválido o credenciales incorrectas |
| 403 | La sesión no tiene el rol necesario |
| 413 | Video demasiado grande |
| 429 | Demasiados intentos de inicio de sesión |
| 404 | Recurso o ruta no encontrados |
| 409 | Conflicto: registro duplicado |
| 500 | Error interno |

---

## Entidad Seña

| Campo | Tipo | Obligatorio | Reglas |
|---|---|---|---|
| `id` | entero | auto | autoincremental |
| `nombre` | string | sí | 1–80 caracteres; único por categoría |
| `categoria` | string | sí | máx. 40 caracteres |
| `descripcion` | string | sí | máx. 1000 caracteres |
| `videoUrl` | string \| null | no | URL http/https |
| `imagenUrl` | string \| null | no | URL http/https |
| `nivel` | string | sí | `Básico`, `Intermedio`, `Avanzado` (acepta `basico`, `INTERMEDIO`, etc.) |
| `icono` | string | no | emoji para la miniatura (default 🤟) — campo adicional al documento |
| `fechaCreacion` | fecha ISO | auto | se asigna al crear |

### GET `/senas` — listar

Parámetros de consulta (todos opcionales):

| Parámetro | Ejemplo | Descripción |
|---|---|---|
| `categoria` | `familia` | Filtra por categoría (ignora mayúsculas y acentos) |
| `nivel` | `basico` | Filtra por nivel |
| `q` | `mama` | Busca en nombre y categoría (ignora acentos) |
| `sort` | `nombre` | `id`, `nombre`, `categoria`, `nivel`, `fechaCreacion` |
| `order` | `desc` | `asc` (default) o `desc` |
| `page`, `limit` | `2`, `10` | Paginación (limit máx. 100) |

```http
GET /api/senas?nivel=avanzado
```
```json
{
  "success": true,
  "data": [
    {
      "id": 30, "nombre": "Presta atención", "categoria": "Escuela",
      "descripcion": "Ambas manos abiertas a los lados de los ojos...",
      "videoUrl": null, "imagenUrl": null, "nivel": "Avanzado", "icono": "👀",
      "fechaCreacion": "2026-09-28T10:00:00.000Z"
    }
  ],
  "meta": { "total": 1, "page": 1, "limit": 1, "pages": 1 }
}
```

### GET `/senas/:id` — obtener una
`GET /api/senas/21` → `200` con la seña "Mamá" · `GET /api/senas/9999` → `404 Seña no encontrada`

### GET `/senas/:id/relacionadas` — misma categoría
`?limit=3` por defecto. Lo usa la pantalla Detalle.

### POST `/senas` — crear
```http
POST /api/senas
Content-Type: application/json

{
  "nombre": "Abuela",
  "categoria": "Familia",
  "descripcion": "Descripción de cómo se realiza la seña.",
  "nivel": "basico",
  "icono": "👵",
  "videoUrl": "https://ejemplo.com/videos/abuela.mp4"
}
```
→ `201 Created`, `Location: /api/senas/34`. Si ya existe "Abuela" en "Familia" → `409`.

### PUT `/senas/:id` — reemplazo completo
Mismo cuerpo que POST (todos los obligatorios). Los opcionales omitidos vuelven a `null`.

### PATCH `/senas/:id` — actualización parcial
```json
{ "nivel": "intermedio" }
```
Enviar `{}` → `400 Debes enviar al menos un campo para actualizar`.

### DELETE `/senas/:id` — eliminar
Elimina la seña **y** sus registros en favoritos y progreso (integridad referencial).
```json
{ "success": true, "data": { "message": "Seña eliminada correctamente", "sena": { ... } } }
```

---

## Categorías

### GET `/categorias`
```json
{ "success": true, "data": [ { "nombre": "Alfabeto", "total": 5, "icono": "✊" }, { "nombre": "Saludos", "total": 5, "icono": "👋" } ] }
```

---

## Favoritos (CRUD de la Tabla 3)

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | entero | ID del favorito |
| `usuarioId` | entero | Dueño (el usuario de la sesión) |
| `senaId` | entero | Seña guardada |
| `comentario` | string | Nota personal opcional (máx. 280) |
| `fechaCreacion`, `fechaActualizacion` | fecha ISO | Auditoría |
| `sena` | objeto | La seña completa (se agrega en la respuesta) |

| Operación | Método y ruta | Cuerpo | Errores |
|---|---|---|---|
| READ | `GET /favoritos?q=gracias` (los de la sesión) | — | 401 |
| READ | `GET /favoritos/:id` | — | 404 |
| CREATE | `POST /favoritos` | `{ "senaId": 3, "comentario": "Repasar" }` | 400, 404, 409 (ya es favorito) |
| UPDATE | `PUT` o `PATCH /favoritos/:id` | `{ "comentario": "Ya la domino" }` | 400, 404 |
| DELETE | `DELETE /favoritos/:id` | — | 404 |

Ejemplo de respuesta de `POST /favoritos`:
```json
{
  "success": true,
  "data": {
    "id": 4, "usuarioId": 1, "senaId": 3, "comentario": "Repasar",
    "fechaCreacion": "2026-09-28T22:55:19.069Z", "fechaActualizacion": "2026-09-28T22:55:19.069Z",
    "sena": { "id": 3, "nombre": "C", "categoria": "Alfabeto", "nivel": "Básico", "icono": "🫲", "...": "..." }
  }
}
```

---

## Autenticación

| Método y ruta | Cuerpo | Respuesta |
|---|---|---|
| `POST /auth/registro` | `{ "nombre": "Ana López", "correo": "ana@correo.com", "password": "Clave2026" }` | `201 { token, usuario }` (rol `usuario`) · 400 · 409 |
| `POST /auth/login` | `{ "correo": "ana@correo.com", "password": "Clave2026" }` | `200 { token, usuario }` · 401 · 429 |
| `GET /auth/me` | — | Usuario de la sesión |
| `PATCH /auth/password` | `{ "actual": "...", "nueva": "..." }` | 200 · 400 |

Contraseña: mínimo 8 caracteres, con letras y números. El usuario nunca incluye `passwordHash`.

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "usuario": { "id": 5, "nombre": "Ana López", "correo": "ana@correo.com", "rol": "usuario", "fechaCreacion": "...", "ultimoAcceso": "..." }
  }
}
```

## Usuarios, roles y progreso

| Método y ruta | Quién | Descripción |
|---|---|---|
| `GET /usuarios?q=&rol=` | superusuario+ | Lista con `resumen: { favoritos, aprendidas, videosEnviados }` |
| `GET /usuarios/:id` | el propio o superusuario+ | Datos públicos |
| `PATCH /usuarios/:id/rol` | superusuario+ | `{ "rol": "admin" }` — `usuario`, `admin` o `superusuario` |
| `GET /usuarios/:id/progreso` | el propio o superusuario+ | Resumen de avance |
| `POST /usuarios/:id/progreso` | solo el propio | `{ "senaId": 3 }` marcar aprendida (repetida → 409) |
| `DELETE /usuarios/:id/progreso/:senaId` | solo el propio | Desmarcar |

Reglas de `PATCH /rol`: nadie cambia su propio rol (403); el principal no se modifica (403); solo el principal cambia el rol de otro superusuario (403); `principal` no es asignable (400).

Respuesta de `GET /usuarios/4/progreso`:
```json
{
  "success": true,
  "data": {
    "usuarioId": 4, "totalSenas": 33, "totalAprendidas": 6, "porcentaje": 18,
    "porCategoria": { "Alfabeto": { "total": 5, "aprendidas": 0 }, "Saludos": { "total": 5, "aprendidas": 2 } },
    "porNivel": { "Básico": { "total": 23, "aprendidas": 6 } },
    "senasAprendidas": [ { "senaId": 6, "fechaAprendida": "2026-09-28T10:00:00.000Z" } ]
  }
}
```

---

## Videos (admin+)

| Método y ruta | Quién | Descripción |
|---|---|---|
| `POST /videos` (multipart) | admin+ | Campos `video` (archivo), `senaId`, `nota`. Queda `pendiente` |
| `GET /videos?estado=&senaId=&mios=true` | admin: solo los suyos · superusuario+: todos | Incluye `sena`, `autor`, `revisor` |
| `GET /videos/pendientes/total` | superusuario+ | `{ total }` para el contador |
| `GET /videos/:id` | autor o superusuario+ | |
| `PATCH /videos/:id/revision` | superusuario+ | `{ "accion": "aprobar" }` o `{ "accion": "rechazar", "comentario": "Poca luz" }` |
| `DELETE /videos/:id` | autor (pendiente/rechazado) o superusuario+ | Borra el archivo; si era el oficial, la seña queda sin video |

Estados: `pendiente` → `aprobado` | `rechazado`. Al aprobar, `sena.videoUrl` apunta al video y el aprobado anterior pasa a `reemplazado`.

Ejemplo con curl:
```bash
curl -X POST http://localhost:3000/api/videos -H "Authorization: Bearer TOKEN" -F "senaId=11" -F "nota=Luz natural" -F "video=@gracias.mp4;type=video/mp4"
```

`url` es relativa (`/uploads/videos/archivo.mp4`, se sirve desde la API) en modo local, o `https://res.cloudinary.com/...` si se configuró Cloudinary.

---

## Estadísticas (solo principal)

`GET /estadisticas?tz=360` (`tz` = `new Date().getTimezoneOffset()` para agrupar por día local)

```json
{
  "usuarios": { "total": 5, "porRol": { "usuario": 1, "admin": 1, "superusuario": 2, "principal": 1 }, "nuevos7d": 5, "nuevos30d": 5, "activos7d": 4, "registrosPorDia": [ { "fecha": "2026-09-28", "total": 5 } ] },
  "senas": { "total": 33, "conVideo": 1, "sinVideo": 32, "porcentajeConVideo": 3, "porCategoria": [ { "categoria": "Saludos", "total": 5, "conVideo": 0 } ] },
  "videos": { "total": 1, "porEstado": { "pendiente": 0, "aprobado": 1, "rechazado": 0, "reemplazado": 0 }, "horasPromedioRevision": 0.1, "topAdmins": [ { "nombre": "Admin Demo", "enviados": 1, "aprobados": 1 } ] },
  "aprendizaje": { "favoritosTotal": 3, "senasAprendidasTotal": 6, "usuariosAprendiendo": 1, "promedioAprendidasPorUsuario": 6, "topFavoritas": [ ], "topAprendidas": [ ] }
}
```

---

## Utilidades

| Ruta | Descripción |
|---|---|
| `GET /api` | Información de la API y recursos disponibles |
| `GET /api/health` | Estado del servidor (lo usa la app para "Probar conexión") |
| `GET /api/docs` | Swagger UI |
| `GET /api/openapi.json` | Especificación OpenAPI 3.0 |

## Ejemplos con curl

```bash
curl http://localhost:3000/api/senas?categoria=saludos
curl -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d "{\"correo\":\"usuario@senaleng.app\",\"password\":\"Usuario123!\"}"
# copia el token de la respuesta:
curl -X POST http://localhost:3000/api/favoritos -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" -d "{\"senaId\":2,\"comentario\":\"Repasar\"}"
curl -X PATCH http://localhost:3000/api/favoritos/4 -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" -d "{\"comentario\":\"Ya la sé\"}"
curl -X DELETE http://localhost:3000/api/favoritos/4 -H "Authorization: Bearer TOKEN"
```
(Las comillas escapadas `\"` funcionan tanto en CMD como en bash.)
