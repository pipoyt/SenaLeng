/**
 * Almacenamiento de videos.
 *
 *  - Local (por defecto): los archivos quedan en api/uploads/videos y se sirven en /uploads/...
 *    Si la API está desplegada (Render, Railway...), eso ya es "la nube".
 *  - Cloudinary (opcional): si se define CLOUDINARY_URL en api/.env, el video se sube a
 *    Cloudinary y se guarda su URL pública https. Plan gratuito suficiente para el proyecto.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const { uploadsDir, maxVideoMB, cloudinaryUrl } = require('../config');
const { ApiError } = require('../utils/response');

const videosDir = path.join(uploadsDir, 'videos');
const provider = cloudinaryUrl ? 'cloudinary' : 'local';

const EXT = { 'video/mp4': '.mp4', 'video/quicktime': '.mov', 'video/webm': '.webm', 'video/3gpp': '.3gp', 'video/x-matroska': '.mkv' };

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      fs.mkdirSync(videosDir, { recursive: true });
      cb(null, videosDir);
    },
    filename: (_req, file, cb) => {
      const ext = EXT[file.mimetype] || path.extname(file.originalname || '').toLowerCase() || '.mp4';
      cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`);
    },
  }),
  limits: { fileSize: maxVideoMB * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (/^video\//.test(file.mimetype)) return cb(null, true);
    cb(new ApiError(400, 'El archivo debe ser un video (mp4, mov, webm...)'));
  },
});

/** Middleware que recibe el campo "video" y traduce los errores de multer. */
function receiveVideo(req, res, next) {
  upload.single('video')(req, res, (err) => {
    if (!err) return next();
    if (err.code === 'LIMIT_FILE_SIZE') return next(new ApiError(413, `El video no debe pesar más de ${maxVideoMB} MB`));
    if (err instanceof ApiError) return next(err);
    return next(new ApiError(400, `No se pudo recibir el video: ${err.message}`));
  });
}

/** Guarda el archivo recibido y devuelve { url, proveedor, publicId }. */
async function save(file) {
  if (provider === 'cloudinary') {
    const cloudinary = require('cloudinary').v2; // lee CLOUDINARY_URL del entorno
    try {
      const r = await cloudinary.uploader.upload(file.path, { resource_type: 'video', folder: 'senaleng' });
      return { url: r.secure_url, proveedor: 'cloudinary', publicId: r.public_id };
    } finally {
      fs.promises.unlink(file.path).catch(() => {});
    }
  }
  return { url: `/uploads/videos/${file.filename}`, proveedor: 'local', publicId: file.filename };
}

/** Elimina el archivo de un video (registro de la tabla videos). */
async function remove(video) {
  if (!video?.publicId) return;
  if (video.proveedor === 'cloudinary') {
    const cloudinary = require('cloudinary').v2;
    await cloudinary.uploader.destroy(video.publicId, { resource_type: 'video' });
  } else {
    await fs.promises.unlink(path.join(videosDir, path.basename(video.publicId))).catch(() => {});
  }
}

/** Borra un archivo recibido que no se llegó a guardar (por ejemplo, si falla una validación). */
const discard = (file) => file?.path && fs.promises.unlink(file.path).catch(() => {});

module.exports = { receiveVideo, save, remove, discard, provider, uploadsDir };
