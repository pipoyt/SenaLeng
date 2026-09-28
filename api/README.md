# SeñaLeng API

API REST (Node.js + Express) para el proyecto SeñaLeng.

```bash
npm install
npm run dev      # http://localhost:3000/api   ·   Swagger: http://localhost:3000/api/docs
npm test         # 22 pruebas
npm run seed     # restablece data/db.json
```

- Referencia completa de endpoints: [`../docs/API.md`](../docs/API.md)
- Arquitectura y modelo de datos: [`../docs/ARQUITECTURA.md`](../docs/ARQUITECTURA.md)
- Colección Postman: [`../docs/SenaLeng.postman_collection.json`](../docs/SenaLeng.postman_collection.json)

| Recurso | Endpoints |
|---|---|
| Señas | `GET/POST /senas` · `GET/PUT/PATCH/DELETE /senas/:id` · `GET /senas/:id/relacionadas` |
| Categorías | `GET /categorias` |
| Favoritos | `GET/POST /favoritos` · `GET/PUT/PATCH/DELETE /favoritos/:id` |
| Usuarios | `GET/POST /usuarios` · `GET /usuarios/:id` · `GET/POST /usuarios/:id/progreso` · `DELETE /usuarios/:id/progreso/:senaId` |
