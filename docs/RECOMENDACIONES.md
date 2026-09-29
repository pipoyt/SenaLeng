# Recomendaciones — SeñaLeng

## 1. Ajustes sugeridos al documento de la Unidad I

Detectados al revisar `Equipo6-IDGS-10A.docx` contra el proyecto implementado:

| Sección | Observación | Sugerencia |
|---|---|---|
| 12.4 Evidencia 8 | Quedó el texto guía *"📸 Aquí coloca una captura de Visual Studio Code…"* | Reemplazarlo por la captura de la estructura del proyecto (`app/` y `api/`). |
| 10.3 Tabla 3 vs. 11.8 | La Tabla 3 describe el CRUD sobre **favoritos**, mientras que 10.2 y 11.8 lo describen sobre la entidad **Seña**. | Aclarar que se implementan ambos: CRUD de *Seña* (catálogo) y CRUD de *Favorito* (usuario). Agregar la entidad Favorito a 10.2. |
| 11.6 Endpoints | No aparecen los endpoints de favoritos, que son los que usan las Figuras 6–8. | Agregar `GET/POST /api/favoritos`, `PUT/PATCH/DELETE /api/favoritos/:id` y `GET /api/categorias` (ver `docs/API.md`). |
| 12.1 Tabla 4 | Indica Expo SDK 52 / React Native 0.76, pero Expo Go de las tiendas solo abre el SDK más reciente. | Actualizar a **Expo SDK 57 / React Native 0.86 / React 19.2**, que es lo que usa el proyecto. |
| 12.1 vs. Evidencia 2 | La tabla dice npm 10.x; la evidencia dice npm 11. | Unificar con la versión que muestra la captura. |
| Numeración | Se salta de 12.2 a 12.4 y de 14 a 16. | Renumerar (12.3 y 15) y actualizar el índice. |
| 11.5 | Ejemplo con dominio `senasmx.com`, que no pertenece al proyecto. | Usar `https://ejemplo.com/...` o `null` hasta tener el servidor multimedia. |
| 14 | Falta la Evidencia 7; la 6 está marcada "(UNIDAD II)". | Completar con la app corriendo en Expo Go (ver `docs/capturas/`). |
| 11.11 | "La selección de una API propia… se justifica porque:" aparece como viñeta. | Sacarla como párrafo y dejar solo las razones como viñetas. |
| Ortografía | "confugurado" (Evid. 3), "esta en la versión" (Evid. 4). | "configurado", "está en la versión". |

## 2. Qué se agregó respecto al documento (y por qué)

- **Campo `icono`** en Seña: sin videos grabados todavía, un emoji permite mostrar miniaturas como en los wireframes.
- **Entidad Progreso** y endpoints `POST/DELETE /usuarios/:id/progreso`: el documento solo pide consultar el progreso; sin forma de registrarlo, el `GET` siempre regresaría 0 %.
- **`GET /senas/:id/relacionadas`** y **`GET /categorias`**: alimentan "Señas relacionadas" (Fig. 5) y "Categorías" (Fig. 3).
- **Formulario de seña** en la app: permite demostrar el CRUD de la entidad principal desde el celular, no solo desde Postman.
- **Caché offline**: cumple el componente "Almacenamiento local" de la arquitectura (10.1).

## 3. Plan recomendado para la Unidad II

> **Actualización v2:** ya están hechos la autenticación (bcrypt + JWT), los roles, la subida de videos con aprobación (local o Cloudinary) y el panel de estadísticas. Quedan pendientes de la tabla: base de datos real, despliegue, lecciones/ejercicios, notificaciones, PWA y seguridad extra.

| Prioridad | Tarea | Detalle técnico |
|---|---|---|
| Alta | Base de datos real | **Prisma + PostgreSQL** (Neon o Supabase tienen plan gratuito). Solo se reescribe `api/src/db/store.js`; el esquema está en `docs/ARQUITECTURA.md`. |
| Alta | Autenticación JWT | `POST /auth/login` y `/auth/registro` con `bcrypt`; middleware que exija token en POST/PUT/PATCH/DELETE (sección 11.10). Rol `admin` para editar el catálogo de señas; los favoritos quedan ligados al usuario del token, ya no al id 1. |
| Alta | Despliegue | API en **Render** o **Railway** (Vercel no es ideal para Express con estado). Configurar `EXPO_PUBLIC_API_URL` con la URL pública. |
| Alta | Contenido validado | Grabar videos con hablantes nativos de LSM; hospedarlos en Cloudinary/Firebase Storage y guardar la URL en `videoUrl`. Reproducir dentro de la app con `expo-video`. |
| Media | Lecciones y ejercicios | Nuevas entidades `Leccion` y `Ejercicio` (selección múltiple, asociación) — funcionalidades 1 y 3 de la Tabla 2. |
| Media | Notificaciones | `expo-notifications` para recordatorios diarios (funcionalidad 5). |
| Media | PWA | Como la materia es de Aplicaciones Web Progresivas: `npx expo export -p web` + `manifest` y *service worker* (Workbox) para que la versión web sea instalable y funcione sin conexión. |
| Media | Seguridad de la API | `helmet`, `express-rate-limit`, restringir CORS al dominio de la app en producción. |
| Baja | Calidad | ESLint + Prettier, pruebas de componentes con `jest-expo` y React Native Testing Library, GitHub Actions que ejecute `npm test` en cada push. |
| Baja | Comunidad | Comentarios y reportes de errores en señas (funcionalidad 7), con moderación. |

## 4. Recomendaciones de trabajo en equipo

- Un repositorio en GitHub con ramas `main` (estable) y `dev`, y una rama por funcionalidad (`feature/favoritos`, `feature/jwt`…).
- Pull requests revisados por al menos otro integrante.
- Reparto sugerido: 1 persona API/BD, 1 persona autenticación y despliegue, 2 personas pantallas de la app (lecciones/ejercicios y perfil/notificaciones).
- Mantener `docs/API.md` y Swagger actualizados en el mismo PR que cambie un endpoint.
