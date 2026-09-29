# Plan y resultados de pruebas — SeñaLeng

## 1. Pruebas automatizadas de la API

Herramientas: `node:test` (incluido en Node.js) + **Supertest**. Se ejecutan con una base de datos en memoria que se restablece antes de cada prueba.

```bash
cd api
npm test
```

Resultado (v2, 28-sep-2026): **27 pruebas, 27 aprobadas, 0 fallidas.** (La tabla de abajo corresponde a la v1; la v2 agrega las suites *Autenticación*, *Roles*, *Videos y aprobación* y *Estadísticas*, y ahora todas las operaciones de escritura se prueban con sesión.)

| # | Suite | Caso | Esperado |
|---|---|---|---|
| 1 | Señas | Listar todas con `meta` | 200, > 20 registros |
| 2 | Señas | Filtrar `?categoria=familia` (minúsculas) | Solo "Familia" |
| 3 | Señas | Filtrar `?nivel=basico` | Solo "Básico" |
| 4 | Señas | Buscar `?q=mama` sin acento | Encuentra "Mamá" |
| 5 | Señas | Paginación `?limit=5&page=2` | 5 registros, inicia en id 6 |
| 6 | Señas | Obtener por ID existente / inexistente | 200 / 404 con formato de error |
| 7 | Señas | ID no numérico `/senas/abc` | 400 |
| 8 | Señas | Crear seña válida | 201, nivel normalizado, `Location` |
| 9 | Señas | Crear con campos faltantes y URL inválida | 400 con `details` |
| 10 | Señas | Crear duplicada | 409 |
| 11 | Señas | PUT y luego PATCH | Reemplaza / actualiza parcial |
| 12 | Señas | PATCH vacío | 400 |
| 13 | Señas | DELETE en cascada | 200 y desaparece de favoritos |
| 14 | Señas | Relacionadas | 3 de la misma categoría, sin la actual |
| 15 | Favoritos | Crear → leer → editar → eliminar | 201 → 200 → 200 → 200 → 404 |
| 16 | Favoritos | Duplicado / seña inexistente / sin datos | 409 / 404 / 400 |
| 17 | Favoritos | Búsqueda `?q=gracias` | 1 resultado |
| 18 | Usuarios | Registro, correo repetido, datos inválidos | 201 / 409 / 400 |
| 19 | Progreso | Marcar, repetir, desmarcar, usuario inexistente | 201 / 409 / 200 / 404 |
| 20 | General | Categorías con conteo | 200 |
| 21 | General | Ruta inexistente / JSON mal formado | 404 / 400 |
| 22 | General | OpenAPI y Swagger UI disponibles | 200 |

## 2. Prueba de extremo a extremo (app + API)

Se compiló la app para web (`npx expo export --platform web`) y se recorrió con Playwright en un viewport de 390×844 (iPhone), con la API real corriendo. También se verificó que el bundle de **Android** compila sin errores (`npx expo export --platform android`).

| # | Paso | Resultado | Captura |
|---|---|---|---|
| 1 | Abrir la app | Splash animado con logo y lema | `capturas/01-splash.png` |
| 2 | Inicio | Lección del día y categorías con conteo real | `capturas/02-inicio.png` |
| 3 | Pestaña Señas | Listado con chips de categoría | `capturas/03-listado.png` |
| 4 | Buscar "gra" | Filtra a "Gracias" | `capturas/03b-busqueda.png` |
| 5 | Abrir "Gracias" | Detalle, favorito ⭐, aprendida ✓, relacionadas | `capturas/04-detalle.png` |
| 6 | Pestaña Favoritos | Lista con comentarios, ✏️ y 🗑️ | `capturas/05-favoritos.png` |
| 7 | 🗑️ en "Uno" | Hoja de confirmación (Fig. 6) | `capturas/06-eliminar.png` |
| 8 | Confirmar | Se elimina (DELETE 200) | `capturas/06b-eliminado.png` |
| 9 | ✏️ en "Gracias" | Hoja para editar comentario | `capturas/07-editar.png` |
| 10 | Guardar | Aviso "Favorito actualizado" (PATCH 200) | `capturas/07b-editado.png` |
| 11 | "Agregar nueva seña" → tocar "Uno" | ✓ y aviso "agregada a favoritos" (POST 201) | `capturas/08-agregar.png` |
| 12 | Señas → ＋ → llenar formulario | Formulario con validación | `capturas/09-form.png` |
| 13 | Crear seña | Aviso "Seña creada" (POST 201) | `capturas/09b-creada.png` |
| 14 | Perfil | Progreso general y por categoría, conexión API | `capturas/10-perfil.png` |

Sin errores de JavaScript en consola durante todo el recorrido.

## 3. Pruebas manuales pendientes en dispositivo físico (lista de verificación)

- [ ] Expo Go en Android conecta a la API por IP local.
- [ ] Expo Go en iPhone conecta a la API por IP local.
- [ ] Con la API apagada, la app muestra datos en caché y el aviso amarillo.
- [ ] Cambiar la URL en Perfil y "Probar conexión".
- [ ] Teclado no tapa el formulario ni la hoja de comentario.
- [ ] Lector de pantalla (TalkBack / VoiceOver) anuncia botones y avisos.


## 4. Pruebas v2 — autenticación, roles y videos

### Automatizadas (API)

| Suite | Casos |
|---|---|
| Autenticación | Registro con rol usuario y token · validaciones y correo repetido · login incorrecto (401) y bloqueo tras 5 intentos (429) · token ausente/inválido · cambio de contraseña |
| Roles | Solo superusuarios listan usuarios · asignar admin y superusuario · no cambiar el propio rol · no tocar al principal · un super no degrada a otro super, el principal sí · el rol aplica al instante |
| Señas | Lectura pública · crear/editar requiere admin, eliminar requiere superusuario · un admin no puede fijar `videoUrl` |
| Favoritos / Progreso | Cada usuario solo ve y modifica lo suyo |
| Videos | Un usuario no envía videos · flujo admin → super aprueba → la seña queda con video · segundo video reemplaza al anterior · rechazar exige motivo · admin ve solo los suyos · archivo no-video (400), demasiado grande (413), seña inexistente (404) · reglas de borrado |
| Estadísticas | Solo el principal (403 para super y admin) · contenido del panel · siempre existe un único principal |

### Recorrido E2E con los 4 roles (Playwright, 390×844)

| # | Rol | Paso | Captura |
|---|---|---|---|
| 1 | — | Pantalla de inicio de sesión | `capturas/v2/01-login.png` |
| 2 | — | Registro de "Ana López" | `capturas/v2/02-registro.png` |
| 3 | Usuario | Inicio con saludo y perfil sin panel | `capturas/v2/03-home-usuario.png`, `04-perfil-usuario.png` |
| 4 | Admin | Panel de administrador | `capturas/v2/05-perfil-admin.png` |
| 5 | Admin | Elegir seña → consejos → subir video → nota | `capturas/v2/06-grabar-paso2.png`, `07-grabar-preview.png` |
| 6 | Admin | "Mis videos" con estado Pendiente | `capturas/v2/08-mis-videos.png` |
| 7 | Super | Contador rojo de pendientes en Perfil | `capturas/v2/09-perfil-super.png` |
| 8 | Super | Revisar → Aprobar | `capturas/v2/10-revisar.png`, `11-aprobado.png` |
| 9 | Super | Lista de usuarios → Ana pasa a Administrador | `capturas/v2/12-usuarios.png` … `14-rol-guardado.png` |
| 10 | Super | Nombra superusuario a Admin Demo; ya no puede degradarlo | `capturas/v2/15-super-no-degrada.png` |
| 11 | Principal | Panel con Estadísticas | `capturas/v2/16-perfil-principal.png` … `19-estadisticas-3.png` |
| 12 | Usuario | La seña muestra "Con video" y se reproduce | `capturas/v2/20-detalle-con-video.png`, `21-video.png` |

Sin errores de JavaScript en consola. (En el navegador de pruebas el video aparece en negro porque Chromium de código abierto no incluye el códec H.264; en celulares y en Chrome/Edge normales se reproduce.)
