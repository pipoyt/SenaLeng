/**
 * Documentación OpenAPI 3.0 de SeñaLeng API (sección 11.3 del documento).
 * Se sirve en /api/docs (Swagger UI) y /api/openapi.json.
 */
const { port } = require('../config');

const idParam = (name = 'id', desc = 'Identificador') => ({
  name,
  in: 'path',
  required: true,
  description: desc,
  schema: { type: 'integer', minimum: 1 },
});

const errorResponses = (...codes) => {
  const text = {
    400: 'Datos o parámetros inválidos',
    404: 'Recurso no encontrado',
    409: 'Conflicto (registro duplicado)',
  };
  return Object.fromEntries(
    codes.map((c) => [c, { description: text[c], content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }]),
  );
};

const success = (schema, description = 'OK') => ({
  description,
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: { success: { type: 'boolean', example: true }, data: schema },
      },
    },
  },
});

const sec = [{ bearerAuth: [] }];
const ref = (name) => ({ $ref: `#/components/schemas/${name}` });
const arr = (name) => ({ type: 'array', items: ref(name) });

module.exports = {
  openapi: '3.0.3',
  info: {
    title: 'SeñaLeng API',
    version: '2.0.0',
    description:
      'API REST para la gestión de señas de la Lengua de Señas Mexicana (LSM).\n\n' +
      'Proyecto integrador — Aplicaciones Web Progresivas, IDGS-10A, UTA (Equipo 6).\n\n' +
      'Todas las respuestas usan el formato `{ success, data }` o `{ success, error }`. ' +
      '**Autenticación:** JWT. Inicia sesión en `POST /auth/login`, copia el `token` y pulsa **Authorize**.\n\n' +
      '**Roles:** usuario < admin < superusuario < principal.\n' +
      '- usuario: favoritos y progreso\n- admin: crea/edita señas y envía videos\n' +
      '- superusuario: aprueba videos, ve usuarios, asigna roles, elimina señas\n- principal: además ve estadísticas (cuenta única)',
  },
  servers: [
    { url: `http://localhost:${port}/api`, description: 'Entorno local' },
    { url: `http://{ip}:${port}/api`, description: 'Red local (dispositivo físico)', variables: { ip: { default: '192.168.1.100' } } },
  ],
  tags: [
    { name: 'Autenticación', description: 'Registro, inicio de sesión y cuenta propia' },
    { name: 'Señas', description: 'CRUD de la entidad principal Seña' },
    { name: 'Categorías', description: 'Categorías derivadas de las señas' },
    { name: 'Favoritos', description: 'CRUD de favoritos del usuario (Tabla 3 del documento)' },
    { name: 'Usuarios', description: 'Usuarios, roles y progreso de aprendizaje' },
    { name: 'Videos', description: 'Videos de señas grabados por admins y aprobados por superusuarios' },
    { name: 'Estadísticas', description: 'Panel exclusivo del superusuario principal' },
  ],
  paths: {
    '/auth/registro': {
      post: {
        tags: ['Autenticación'],
        summary: 'Crear cuenta (rol usuario)',
        requestBody: { required: true, content: { 'application/json': { schema: ref('RegistroInput') } } },
        responses: { 201: success(ref('Sesion'), 'Cuenta creada'), ...errorResponses(400, 409) },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Autenticación'],
        summary: 'Iniciar sesión',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['correo', 'password'], properties: { correo: { type: 'string', example: 'usuario@senaleng.app' }, password: { type: 'string', example: 'Usuario123!' } } } } },
        },
        responses: { 200: success(ref('Sesion')), 401: { description: 'Credenciales incorrectas' }, 429: { description: 'Demasiados intentos' } },
      },
    },
    '/auth/me': {
      get: { tags: ['Autenticación'], summary: 'Usuario de la sesión', security: sec, responses: { 200: success(ref('Usuario')), 401: { description: 'Sin sesión' } } },
    },
    '/auth/password': {
      patch: {
        tags: ['Autenticación'],
        summary: 'Cambiar mi contraseña',
        security: sec,
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { actual: { type: 'string' }, nueva: { type: 'string' } } } } } },
        responses: { 200: success({ type: 'object' }), ...errorResponses(400) },
      },
    },
    '/senas': {
      get: {
        tags: ['Señas'],
        summary: 'Obtener todas las señas (con filtros)',
        parameters: [
          { name: 'categoria', in: 'query', schema: { type: 'string' }, example: 'familia', description: 'Filtra por categoría (sin distinguir mayúsculas/acentos)' },
          { name: 'nivel', in: 'query', schema: { type: 'string', enum: ['basico', 'intermedio', 'avanzado'] } },
          { name: 'q', in: 'query', schema: { type: 'string' }, description: 'Búsqueda por nombre o categoría' },
          { name: 'sort', in: 'query', schema: { type: 'string', enum: ['id', 'nombre', 'categoria', 'nivel', 'fechaCreacion'], default: 'id' } },
          { name: 'order', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'], default: 'asc' } },
          { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100 } },
        ],
        responses: { 200: success(arr('Sena')), ...errorResponses(400) },
      },
      post: {
        tags: ['Señas'],
        summary: 'Crear una nueva seña (admin+)',
        security: sec,
        requestBody: { required: true, content: { 'application/json': { schema: ref('SenaInput') } } },
        responses: { 201: success(ref('Sena'), 'Creada'), ...errorResponses(400, 409) },
      },
    },
    '/senas/{id}': {
      parameters: [idParam('id', 'ID de la seña')],
      get: { tags: ['Señas'], summary: 'Obtener una seña por ID', responses: { 200: success(ref('Sena')), ...errorResponses(400, 404) } },
      put: {
        tags: ['Señas'],
        summary: 'Actualizar una seña (admin+)',
        security: sec,
        requestBody: { required: true, content: { 'application/json': { schema: ref('SenaInput') } } },
        responses: { 200: success(ref('Sena')), ...errorResponses(400, 404) },
      },
      patch: {
        tags: ['Señas'],
        summary: 'Actualizar parcialmente una seña (admin+)',
        security: sec,
        requestBody: { required: true, content: { 'application/json': { schema: ref('SenaPatch') } } },
        responses: { 200: success(ref('Sena')), ...errorResponses(400, 404) },
      },
      delete: {
        tags: ['Señas'],
        summary: 'Eliminar una seña con sus favoritos, progreso y videos (superusuario+)',
        security: sec,
        responses: { 200: success({ type: 'object' }), ...errorResponses(400, 404) },
      },
    },
    '/senas/{id}/relacionadas': {
      get: {
        tags: ['Señas'],
        summary: 'Señas relacionadas (misma categoría)',
        parameters: [idParam('id', 'ID de la seña'), { name: 'limit', in: 'query', schema: { type: 'integer', default: 3 } }],
        responses: { 200: success(arr('Sena')), ...errorResponses(404) },
      },
    },
    '/categorias': {
      get: { tags: ['Categorías'], summary: 'Listar categorías con su número de señas', responses: { 200: success(arr('Categoria')) } },
    },
    '/favoritos': {
      get: {
        tags: ['Favoritos'],
        summary: 'Listar mis favoritos',
        security: sec,
        parameters: [
          { name: 'q', in: 'query', schema: { type: 'string' }, description: 'Buscar en tus favoritos' },
        ],
        responses: { 200: success(arr('Favorito')) },
      },
      post: {
        tags: ['Favoritos'],
        summary: 'Agregar una seña a favoritos (con comentario opcional)',
        security: sec,
        requestBody: { required: true, content: { 'application/json': { schema: ref('FavoritoInput') } } },
        responses: { 201: success(ref('Favorito'), 'Creado'), ...errorResponses(400, 404, 409) },
      },
    },
    '/favoritos/{id}': {
      parameters: [idParam('id', 'ID del favorito')],
      get: { tags: ['Favoritos'], summary: 'Obtener un favorito', security: sec, responses: { 200: success(ref('Favorito')), ...errorResponses(404) } },
      put: {
        tags: ['Favoritos'],
        summary: 'Editar el comentario de un favorito',
        security: sec,
        requestBody: { required: true, content: { 'application/json': { schema: ref('FavoritoUpdate') } } },
        responses: { 200: success(ref('Favorito')), ...errorResponses(400, 404) },
      },
      patch: {
        tags: ['Favoritos'],
        summary: 'Editar el comentario de un favorito (parcial)',
        security: sec,
        requestBody: { required: true, content: { 'application/json': { schema: ref('FavoritoUpdate') } } },
        responses: { 200: success(ref('Favorito')), ...errorResponses(400, 404) },
      },
      delete: { tags: ['Favoritos'], summary: 'Eliminar una seña de favoritos', security: sec, responses: { 200: success({ type: 'object' }), ...errorResponses(404) } },
    },
    '/usuarios': {
      get: {
        tags: ['Usuarios'],
        summary: 'Listar usuarios (superusuario+)',
        security: sec,
        parameters: [
          { name: 'q', in: 'query', schema: { type: 'string' }, description: 'Nombre o correo' },
          { name: 'rol', in: 'query', schema: { type: 'string', enum: ['usuario', 'admin', 'superusuario', 'principal'] } },
        ],
        responses: { 200: success(arr('Usuario')), 403: { description: 'Sin permisos' } },
      },
    },
    '/usuarios/{id}': {
      get: { tags: ['Usuarios'], summary: 'Obtener un usuario (el propio o superusuario+)', security: sec, parameters: [idParam()], responses: { 200: success(ref('Usuario')), ...errorResponses(404) } },
    },
    '/usuarios/{id}/rol': {
      patch: {
        tags: ['Usuarios'],
        summary: 'Asignar rol (superusuario+)',
        description: 'Roles asignables: usuario, admin, superusuario. Nadie cambia su propio rol ni el del principal. Solo el principal puede cambiar el rol de otro superusuario.',
        security: sec,
        parameters: [idParam()],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['rol'], properties: { rol: { type: 'string', enum: ['usuario', 'admin', 'superusuario'] } } } } } },
        responses: { 200: success(ref('Usuario')), ...errorResponses(400, 404), 403: { description: 'No permitido' } },
      },
    },
    '/usuarios/{id}/progreso': {
      parameters: [idParam('id', 'ID del usuario')],
      get: { tags: ['Usuarios'], summary: 'Consultar progreso (el propio o superusuario+)', security: sec, responses: { 200: success(ref('Progreso')), ...errorResponses(404) } },
      post: {
        tags: ['Usuarios'],
        summary: 'Marcar una seña como aprendida (solo el propio usuario)',
        security: sec,
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['senaId'], properties: { senaId: { type: 'integer', example: 3 } } } } } },
        responses: { 201: success({ type: 'object' }), ...errorResponses(400, 404, 409) },
      },
    },
    '/usuarios/{id}/progreso/{senaId}': {
      delete: {
        tags: ['Usuarios'],
        summary: 'Desmarcar una seña aprendida',
        security: sec,
        parameters: [idParam('id', 'ID del usuario'), idParam('senaId', 'ID de la seña')],
        responses: { 200: success({ type: 'object' }), ...errorResponses(404) },
      },
    },
    '/videos': {
      get: {
        tags: ['Videos'],
        summary: 'Listar videos (admin: los suyos · superusuario: todos)',
        security: sec,
        parameters: [
          { name: 'estado', in: 'query', schema: { type: 'string', enum: ['pendiente', 'aprobado', 'rechazado', 'reemplazado'] } },
          { name: 'senaId', in: 'query', schema: { type: 'integer' } },
          { name: 'mios', in: 'query', schema: { type: 'boolean' }, description: 'Solo los videos que yo envié' },
        ],
        responses: { 200: success(arr('Video')) },
      },
      post: {
        tags: ['Videos'],
        summary: 'Enviar un video para aprobación (admin+)',
        security: sec,
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['video', 'senaId'],
                properties: { video: { type: 'string', format: 'binary' }, senaId: { type: 'integer', example: 11 }, nota: { type: 'string', example: 'Grabado con luz natural' } },
              },
            },
          },
        },
        responses: { 201: success(ref('Video'), 'Enviado (pendiente)'), ...errorResponses(400, 404), 413: { description: 'Archivo demasiado grande' } },
      },
    },
    '/videos/pendientes/total': {
      get: { tags: ['Videos'], summary: 'Número de videos pendientes (superusuario+)', security: sec, responses: { 200: success({ type: 'object', properties: { total: { type: 'integer' } } }) } },
    },
    '/videos/{id}': {
      parameters: [idParam('id', 'ID del video')],
      get: { tags: ['Videos'], summary: 'Obtener un video', security: sec, responses: { 200: success(ref('Video')), ...errorResponses(404) } },
      delete: { tags: ['Videos'], summary: 'Eliminar (autor: pendientes/rechazados · superusuario: cualquiera)', security: sec, responses: { 200: success({ type: 'object' }), ...errorResponses(404) } },
    },
    '/videos/{id}/revision': {
      patch: {
        tags: ['Videos'],
        summary: 'Aprobar o rechazar (superusuario+)',
        description: 'Al aprobar, el video se vuelve el oficial de la seña (videoUrl) y el anterior queda como "reemplazado". Rechazar exige comentario.',
        security: sec,
        parameters: [idParam('id', 'ID del video')],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['accion'], properties: { accion: { type: 'string', enum: ['aprobar', 'rechazar'] }, comentario: { type: 'string', example: 'Se ve bien' } } } } },
        },
        responses: { 200: success(ref('Video')), ...errorResponses(400, 404, 409) },
      },
    },
    '/estadisticas': {
      get: { tags: ['Estadísticas'], summary: 'Estadísticas generales (solo superusuario principal)', security: sec, parameters: [{ name: 'tz', in: 'query', schema: { type: 'integer', example: 360 }, description: 'Desfase de zona horaria en minutos (getTimezoneOffset) para agrupar por día local' }], responses: { 200: success({ type: 'object' }), 403: { description: 'Solo el principal' } } },
    },
  },
  components: {
    securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
    schemas: {
      Sena: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 21 },
          nombre: { type: 'string', example: 'Mamá' },
          categoria: { type: 'string', example: 'Familia' },
          descripcion: { type: 'string', example: 'Coloca la mano abierta cerca de la mejilla...' },
          videoUrl: { type: 'string', nullable: true, example: null },
          imagenUrl: { type: 'string', nullable: true, example: null },
          nivel: { type: 'string', enum: ['Básico', 'Intermedio', 'Avanzado'] },
          icono: { type: 'string', example: '👩', description: 'Emoji usado como miniatura en la app' },
          fechaCreacion: { type: 'string', format: 'date-time' },
        },
      },
      SenaInput: {
        type: 'object',
        required: ['nombre', 'categoria', 'descripcion', 'nivel'],
        properties: {
          nombre: { type: 'string', example: 'Abuela' },
          categoria: { type: 'string', example: 'Familia' },
          descripcion: { type: 'string', example: 'Descripción de cómo realizar la seña.' },
          videoUrl: { type: 'string', nullable: true, example: 'https://ejemplo.com/videos/abuela.mp4' },
          imagenUrl: { type: 'string', nullable: true, example: null },
          nivel: { type: 'string', example: 'basico' },
          icono: { type: 'string', example: '👵' },
        },
      },
      SenaPatch: {
        type: 'object',
        properties: { nivel: { type: 'string', example: 'intermedio' }, descripcion: { type: 'string' } },
      },
      Categoria: {
        type: 'object',
        properties: { nombre: { type: 'string', example: 'Familia' }, total: { type: 'integer', example: 4 }, icono: { type: 'string' } },
      },
      Favorito: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          usuarioId: { type: 'integer', example: 1 },
          senaId: { type: 'integer', example: 11 },
          comentario: { type: 'string', example: 'Practicar diario' },
          fechaCreacion: { type: 'string', format: 'date-time' },
          fechaActualizacion: { type: 'string', format: 'date-time' },
          sena: ref('Sena'),
        },
      },
      FavoritoInput: {
        type: 'object',
        required: ['senaId'],
        properties: {
          senaId: { type: 'integer', example: 3 },
          comentario: { type: 'string', example: 'Para practicar con mi hermano' },
        },
      },
      FavoritoUpdate: { type: 'object', required: ['comentario'], properties: { comentario: { type: 'string', example: 'Ya la domino' } } },
      Usuario: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          nombre: { type: 'string' },
          correo: { type: 'string' },
          rol: { type: 'string', enum: ['usuario', 'admin', 'superusuario', 'principal'] },
          fechaCreacion: { type: 'string', format: 'date-time' },
          ultimoAcceso: { type: 'string', format: 'date-time', nullable: true },
        },
      },
      RegistroInput: {
        type: 'object',
        required: ['nombre', 'correo', 'password'],
        properties: {
          nombre: { type: 'string', example: 'Ana López' },
          correo: { type: 'string', example: 'ana@correo.com' },
          password: { type: 'string', example: 'Clave2026', description: 'Mínimo 8 caracteres con letras y números' },
        },
      },
      Sesion: { type: 'object', properties: { token: { type: 'string' }, usuario: ref('Usuario') } },
      Video: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          senaId: { type: 'integer' },
          autorId: { type: 'integer' },
          url: { type: 'string', example: '/uploads/videos/1727560000-abc123.mp4' },
          proveedor: { type: 'string', enum: ['local', 'cloudinary'] },
          estado: { type: 'string', enum: ['pendiente', 'aprobado', 'rechazado', 'reemplazado'] },
          nota: { type: 'string' },
          comentarioRevision: { type: 'string' },
          fechaEnvio: { type: 'string', format: 'date-time' },
          fechaRevision: { type: 'string', format: 'date-time', nullable: true },
          sena: { type: 'object' },
          autor: { type: 'object' },
          revisor: { type: 'object', nullable: true },
        },
      },
      Progreso: {
        type: 'object',
        properties: {
          usuarioId: { type: 'integer' },
          totalSenas: { type: 'integer' },
          totalAprendidas: { type: 'integer' },
          porcentaje: { type: 'integer', example: 18 },
          porCategoria: { type: 'object', additionalProperties: { type: 'object' } },
          porNivel: { type: 'object', additionalProperties: { type: 'object' } },
          senasAprendidas: { type: 'array', items: { type: 'object' } },
        },
      },
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'integer', example: 404 },
              message: { type: 'string', example: 'Seña no encontrada' },
              details: { type: 'array', items: { type: 'string' } },
            },
          },
        },
      },
    },
  },
};
