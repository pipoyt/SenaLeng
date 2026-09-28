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

const ref = (name) => ({ $ref: `#/components/schemas/${name}` });
const arr = (name) => ({ type: 'array', items: ref(name) });

module.exports = {
  openapi: '3.0.3',
  info: {
    title: 'SeñaLeng API',
    version: '1.0.0',
    description:
      'API REST para la gestión de señas de la Lengua de Señas Mexicana (LSM).\n\n' +
      'Proyecto integrador — Aplicaciones Web Progresivas, IDGS-10A, UTA (Equipo 6).\n\n' +
      'Todas las respuestas usan el formato `{ success, data }` o `{ success, error }`. ' +
      'En la Unidad I no hay autenticación; se usa el usuario 1 ("Invitado") por defecto.',
  },
  servers: [
    { url: `http://localhost:${port}/api`, description: 'Entorno local' },
    { url: `http://{ip}:${port}/api`, description: 'Red local (dispositivo físico)', variables: { ip: { default: '192.168.1.100' } } },
  ],
  tags: [
    { name: 'Señas', description: 'CRUD de la entidad principal Seña' },
    { name: 'Categorías', description: 'Categorías derivadas de las señas' },
    { name: 'Favoritos', description: 'CRUD de favoritos del usuario (Tabla 3 del documento)' },
    { name: 'Usuarios', description: 'Registro de usuarios y progreso de aprendizaje' },
  ],
  paths: {
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
        summary: 'Crear una nueva seña',
        requestBody: { required: true, content: { 'application/json': { schema: ref('SenaInput') } } },
        responses: { 201: success(ref('Sena'), 'Creada'), ...errorResponses(400, 409) },
      },
    },
    '/senas/{id}': {
      parameters: [idParam('id', 'ID de la seña')],
      get: { tags: ['Señas'], summary: 'Obtener una seña por ID', responses: { 200: success(ref('Sena')), ...errorResponses(400, 404) } },
      put: {
        tags: ['Señas'],
        summary: 'Actualizar una seña (reemplazo completo)',
        requestBody: { required: true, content: { 'application/json': { schema: ref('SenaInput') } } },
        responses: { 200: success(ref('Sena')), ...errorResponses(400, 404) },
      },
      patch: {
        tags: ['Señas'],
        summary: 'Actualizar parcialmente una seña',
        requestBody: { required: true, content: { 'application/json': { schema: ref('SenaPatch') } } },
        responses: { 200: success(ref('Sena')), ...errorResponses(400, 404) },
      },
      delete: {
        tags: ['Señas'],
        summary: 'Eliminar una seña (también la quita de favoritos y progreso)',
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
        summary: 'Listar favoritos del usuario',
        parameters: [
          { name: 'usuarioId', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'q', in: 'query', schema: { type: 'string' }, description: 'Buscar en tus favoritos' },
        ],
        responses: { 200: success(arr('Favorito')) },
      },
      post: {
        tags: ['Favoritos'],
        summary: 'Agregar una seña a favoritos (con comentario opcional)',
        requestBody: { required: true, content: { 'application/json': { schema: ref('FavoritoInput') } } },
        responses: { 201: success(ref('Favorito'), 'Creado'), ...errorResponses(400, 404, 409) },
      },
    },
    '/favoritos/{id}': {
      parameters: [idParam('id', 'ID del favorito')],
      get: { tags: ['Favoritos'], summary: 'Obtener un favorito', responses: { 200: success(ref('Favorito')), ...errorResponses(404) } },
      put: {
        tags: ['Favoritos'],
        summary: 'Editar el comentario de un favorito',
        requestBody: { required: true, content: { 'application/json': { schema: ref('FavoritoUpdate') } } },
        responses: { 200: success(ref('Favorito')), ...errorResponses(400, 404) },
      },
      patch: {
        tags: ['Favoritos'],
        summary: 'Editar el comentario de un favorito (parcial)',
        requestBody: { required: true, content: { 'application/json': { schema: ref('FavoritoUpdate') } } },
        responses: { 200: success(ref('Favorito')), ...errorResponses(400, 404) },
      },
      delete: { tags: ['Favoritos'], summary: 'Eliminar una seña de favoritos', responses: { 200: success({ type: 'object' }), ...errorResponses(404) } },
    },
    '/usuarios': {
      get: { tags: ['Usuarios'], summary: 'Listar usuarios', responses: { 200: success(arr('Usuario')) } },
      post: {
        tags: ['Usuarios'],
        summary: 'Registro de usuario',
        requestBody: { required: true, content: { 'application/json': { schema: ref('UsuarioInput') } } },
        responses: { 201: success(ref('Usuario'), 'Creado'), ...errorResponses(400, 409) },
      },
    },
    '/usuarios/{id}': {
      get: { tags: ['Usuarios'], summary: 'Obtener un usuario', parameters: [idParam()], responses: { 200: success(ref('Usuario')), ...errorResponses(404) } },
    },
    '/usuarios/{id}/progreso': {
      parameters: [idParam('id', 'ID del usuario')],
      get: { tags: ['Usuarios'], summary: 'Consultar progreso del usuario', responses: { 200: success(ref('Progreso')), ...errorResponses(404) } },
      post: {
        tags: ['Usuarios'],
        summary: 'Marcar una seña como aprendida',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['senaId'], properties: { senaId: { type: 'integer', example: 3 } } } } } },
        responses: { 201: success({ type: 'object' }), ...errorResponses(400, 404, 409) },
      },
    },
    '/usuarios/{id}/progreso/{senaId}': {
      delete: {
        tags: ['Usuarios'],
        summary: 'Desmarcar una seña aprendida',
        parameters: [idParam('id', 'ID del usuario'), idParam('senaId', 'ID de la seña')],
        responses: { 200: success({ type: 'object' }), ...errorResponses(404) },
      },
    },
  },
  components: {
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
          usuarioId: { type: 'integer', example: 1, description: 'Opcional; por defecto 1' },
          comentario: { type: 'string', example: 'Para practicar con mi hermano' },
        },
      },
      FavoritoUpdate: { type: 'object', required: ['comentario'], properties: { comentario: { type: 'string', example: 'Ya la domino' } } },
      Usuario: {
        type: 'object',
        properties: { id: { type: 'integer' }, nombre: { type: 'string' }, correo: { type: 'string' }, fechaCreacion: { type: 'string', format: 'date-time' } },
      },
      UsuarioInput: {
        type: 'object',
        required: ['nombre', 'correo'],
        properties: { nombre: { type: 'string', example: 'Ana López' }, correo: { type: 'string', example: 'ana@correo.com' } },
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
