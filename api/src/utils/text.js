/** Normaliza texto para comparaciones: minúsculas y sin acentos. */
const normalize = (value = '') =>
  String(value)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

const NIVELES = ['Básico', 'Intermedio', 'Avanzado'];

/** Convierte "basico", "BÁSICO", etc. al valor canónico "Básico". */
const canonicalNivel = (value) => NIVELES.find((n) => normalize(n) === normalize(value)) || null;

module.exports = { normalize, NIVELES, canonicalNivel };
