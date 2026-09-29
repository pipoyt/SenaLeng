# Usuarios, roles y videos — SeñaLeng v2

## 1. ¿Cómo se registran los usuarios?

Registro **local con correo y contraseña**, sin servicios externos:

- La app pide nombre, correo y contraseña (mínimo 8 caracteres, con letras y números).
- La API guarda la contraseña **cifrada con bcrypt** (nunca en texto plano) y responde con un **token JWT** que dura 7 días.
- La app guarda la sesión en el teléfono, así que no pide la contraseña cada vez.
- No se envía correo de verificación. Es lo más simple para el proyecto; si en el futuro se quiere verificar el correo, se puede agregar un código por email (Resend, SendGrid) o "Iniciar sesión con Google" sin cambiar el resto.
- Protección básica: tras **5 intentos fallidos** el correo queda bloqueado 10 minutos.

Toda cuenta nueva empieza como **Usuario**. Solo un superusuario puede subirla de rol.

## 2. Roles

| Rol | Qué puede hacer |
|---|---|
| **Usuario** | Aprender, favoritos, marcar señas aprendidas, cambiar su contraseña |
| **Administrador** | Todo lo anterior + **grabar y enviar videos** de señas + crear/editar señas |
| **Superusuario** | Todo lo anterior + **aprobar/rechazar videos**, **ver todos los usuarios**, **asignar roles** (usuario, admin, superusuario), eliminar señas |
| **Principal** | Todo lo anterior + **ver las estadísticas**. Existe **una sola** cuenta principal |

### Reglas de asignación de roles

1. Solo superusuarios (o el principal) cambian roles.
2. Nadie puede cambiar **su propio** rol.
3. El rol **principal no se asigna** y la cuenta principal **no se puede modificar**.
4. Un superusuario **puede nombrar** nuevos superusuarios (para repartir la revisión de videos), pero **solo el principal puede quitarle el rol** a un superusuario. Así ningún superusuario puede dejar fuera a los demás.
5. El cambio aplica al instante (la API revisa el rol en cada petición, no solo al iniciar sesión).

## 3. La cuenta principal (estadísticas)

- Se crea automáticamente al generar la base de datos con los datos de `api/.env`:
  ```
  PRINCIPAL_NOMBRE=Jesus Antonio
  PRINCIPAL_CORREO=tu-correo-privado@ejemplo.com
  PRINCIPAL_PASSWORD=UnaClaveLargaQueSoloTuSepas2026
  ```
- `api/.env` **no se sube a GitHub** (está en `.gitignore`), así que solo quien tiene ese archivo conoce la contraseña.
- Si la base de datos ya existía o se te olvidó la clave: cambia `.env`, detén la API y ejecuta `npm run principal`.
- También puede cambiar su contraseña desde la app: **Perfil → Cambiar contraseña**.
- Si no defines `.env`, la cuenta usa `principal@senaleng.app` / `Principal123!` y la API muestra una advertencia al arrancar. **Cámbiala antes de compartir la app.**

## 4. Flujo de videos

```
Administrador                     API                          Superusuario
──────────────                    ───                          ────────────
Perfil → Grabar seña
Elige la seña
Graba (cámara) o elige
de la galería (máx. 20 s)
Escribe una nota ─────────▶  POST /api/videos
                             estado = "pendiente"  ──────▶  Perfil (🔴 contador)
                                                            → Revisar videos
                                                            Ve el video, autor y nota
                             PATCH /videos/:id/revision ◀── Aprobar  |  Rechazar + motivo
                             aprobado → la seña usa
                             este video (el anterior
                             pasa a "reemplazado")
Mis videos ◀──────────────── estado + comentario del revisor
```

- Formatos aceptados: cualquier video (`mp4`, `mov`, `webm`...), máximo **60 MB** (configurable con `MAX_VIDEO_MB`).
- Un admin **no puede** poner el video de una seña directamente; siempre pasa por aprobación.
- El admin puede borrar sus videos **pendientes o rechazados**; un superusuario puede borrar cualquiera.

### ¿Dónde se guardan los videos? ("la nube")

| Modo | Cómo activarlo | Dónde quedan |
|---|---|---|
| **Local** (por defecto) | No hacer nada | `api/uploads/videos/` y se sirven en `http://<api>/uploads/...`. Si la API está desplegada en Render/Railway, ya están en la nube de ese servidor. |
| **Cloudinary** (recomendado para producción) | Crear cuenta gratis en cloudinary.com, copiar el valor **API environment variable** y ponerlo en `api/.env` como `CLOUDINARY_URL=cloudinary://...` | En Cloudinary, con URL pública `https://res.cloudinary.com/...`. No se pierden aunque se reinicie el servidor. |

> En el plan gratis de Render el disco se borra al reiniciar, por eso para producción conviene Cloudinary.

## 5. Estadísticas (solo principal)

Perfil → **Estadísticas** muestra:

- Usuarios totales, nuevos de la semana y activos en los últimos 7 días.
- Registros por día (últimos 14 días).
- Usuarios por rol.
- Porcentaje de señas con video y cobertura por categoría.
- Videos pendientes, aprobados, rechazados y reemplazados; tiempo promedio de revisión; administradores que más aportan.
- Aprendizaje: señas aprendidas, promedio por usuario, señas más guardadas en favoritos y más aprendidas.

## 6. Cuentas de prueba

Se crean al generar la base de datos (desactívalas con `SEED_DEMO_USERS=false` en `.env` antes del primer arranque):

| Rol | Correo | Contraseña |
|---|---|---|
| Superusuario | super@senaleng.app | Super123! |
| Administrador | admin@senaleng.app | Admin123! |
| Usuario | usuario@senaleng.app | Usuario123! |
| Principal | *(la de tu `.env`)* | *(la de tu `.env`)* |

> Para presentar el proyecto están bien; para usarla con personas reales, desactívalas o cámbiales la contraseña.
