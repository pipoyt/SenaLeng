# SeñaLeng API — Referencia

API REST para la gestión de señas de la Lengua de Señas Mexicana.

- **Base URL (local):** `http://localhost:3000/api`
- **Base URL (dispositivo físico):** `http://<IP-de-la-PC>:3000/api`
- **Documentación interactiva:** `http://localhost:3000/api/docs` (Swagger UI) · especificación en `/api/openapi.json`
- **Formato:** JSON (UTF-8) · **CORS:** habilitado · **Autenticación:** ninguna en la Unidad I (usuario por defecto `1`)

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
| `usuarioId` | entero | Dueño (default 1) |
| `senaId` | entero | Seña guardada |
| `comentario` | string | Nota personal opcional (máx. 280) |
| `fechaCreacion`, `fechaActualizacion` | fecha ISO | Auditoría |
| `sena` | objeto | La seña completa (se agrega en la respuesta) |

| Operación | Método y ruta | Cuerpo | Errores |
|---|---|---|---|
| READ | `GET /favoritos?usuarioId=1&q=gracias` | — | — |
| READ | `GET /favoritos/:id` | — | 404 |
| CREATE | `POST /favoritos` | `{ "senaId": 3, "comentario": "Repasar" }` | 400, 404 (seña/usuario), 409 (ya es favorito) |
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

## Usuarios y progreso

| Método y ruta | Descripción | Cuerpo |
|---|---|---|
| `GET /usuarios` | Listar usuarios | — |
| `GET /usuarios/:id` | Obtener usuario | — |
| `POST /usuarios` | Registro | `{ "nombre": "Ana López", "correo": "ana@correo.com" }` (correo único → 409) |
| `GET /usuarios/:id/progreso` | Resumen de avance | — |
| `POST /usuarios/:id/progreso` | Marcar seña como aprendida | `{ "senaId": 3 }` (repetida → 409) |
| `DELETE /usuarios/:id/progreso/:senaId` | Desmarcar | — |

Respuesta de `GET /usuarios/1/progreso`:
```json
{
  "success": true,
  "data": {
    "usuarioId": 1, "totalSenas": 33, "totalAprendidas": 6, "porcentaje": 18,
    "porCategoria": { "Alfabeto": { "total": 5, "aprendidas": 0 }, "Saludos": { "total": 5, "aprendidas": 2 } },
    "porNivel": { "Básico": { "total": 23, "aprendidas": 6 } },
    "senasAprendidas": [ { "senaId": 6, "fechaAprendida": "2026-09-28T10:00:00.000Z" } ]
  }
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
curl -X POST http://localhost:3000/api/favoritos -H "Content-Type: application/json" -d "{\"senaId\":2,\"comentario\":\"Repasar\"}"
curl -X PATCH http://localhost:3000/api/favoritos/4 -H "Content-Type: application/json" -d "{\"comentario\":\"Ya la sé\"}"
curl -X DELETE http://localhost:3000/api/favoritos/4
```
(Las comillas escapadas `\"` funcionan tanto en CMD como en bash.)
