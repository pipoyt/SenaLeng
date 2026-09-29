# SeñaLeng API

API REST (Node.js + Express) para el proyecto SeñaLeng.

```bash
npm install
copy .env.example .env   # Windows (macOS/Linux: cp) — define la cuenta principal
npm run dev      # http://localhost:3000/api   ·   Swagger: http://localhost:3000/api/docs
npm test         # 27 pruebas
npm run seed     # restablece data/db.json
npm run principal # aplica el correo/contraseña del principal definidos en .env
```

- Referencia completa de endpoints: [`../docs/API.md`](../docs/API.md)
- Arquitectura y modelo de datos: [`../docs/ARQUITECTURA.md`](../docs/ARQUITECTURA.md)
- Colección Postman: [`../docs/SenaLeng.postman_collection.json`](../docs/SenaLeng.postman_collection.json)

| Recurso | Endpoints |
|---|---|
| Autenticación | `POST /auth/registro` · `POST /auth/login` · `GET /auth/me` · `PATCH /auth/password` |
| Señas | `GET/POST /senas` · `GET/PUT/PATCH/DELETE /senas/:id` · `GET /senas/:id/relacionadas` |
| Categorías | `GET /categorias` |
| Favoritos | `GET/POST /favoritos` · `GET/PUT/PATCH/DELETE /favoritos/:id` |
| Usuarios | `GET /usuarios` · `GET /usuarios/:id` · `PATCH /usuarios/:id/rol` · `GET/POST /usuarios/:id/progreso` · `DELETE /usuarios/:id/progreso/:senaId` |
| Videos | `GET/POST /videos` · `GET /videos/pendientes/total` · `GET/DELETE /videos/:id` · `PATCH /videos/:id/revision` |
| Estadísticas | `GET /estadisticas` (solo principal) |

Roles, flujo de videos y cuentas de prueba: [`../docs/USUARIOS_Y_ROLES.md`](../docs/USUARIOS_Y_ROLES.md)
