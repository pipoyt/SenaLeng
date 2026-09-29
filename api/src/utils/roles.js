/**
 * Jerarquía de roles (de menor a mayor):
 *   usuario       → aprende, favoritos y progreso
 *   admin         → además graba y envía videos de señas, crea/edita señas
 *   superusuario  → además aprueba/rechaza videos, ve usuarios y asigna roles
 *   principal     → además ve las estadísticas. Solo existe UNA cuenta principal.
 */
const ROLES = ['usuario', 'admin', 'superusuario', 'principal'];
const ASIGNABLES = ['usuario', 'admin', 'superusuario'];

const level = (rol) => ROLES.indexOf(rol);
const hasRole = (user, min) => !!user && level(user.rol) >= level(min);

/**
 * Reglas para cambiar el rol de otro usuario. Devuelve un mensaje de error o null.
 *  - Solo superusuarios (o el principal) pueden cambiar roles.
 *  - Nadie puede cambiar su propio rol ni el del principal.
 *  - El rol "principal" no se puede asignar.
 *  - Solo el principal puede quitarle el rol a un superusuario
 *    (evita que un superusuario deje fuera a los demás).
 */
function canAssignRole(actor, target, nuevoRol) {
  if (!hasRole(actor, 'superusuario')) return 'Solo un superusuario puede cambiar roles';
  if (!ASIGNABLES.includes(nuevoRol)) return `El rol debe ser uno de: ${ASIGNABLES.join(', ')}`;
  if (target.id === actor.id) return 'No puedes cambiar tu propio rol';
  if (target.rol === 'principal') return 'El rol del superusuario principal no se puede modificar';
  if (target.rol === 'superusuario' && actor.rol !== 'principal') {
    return 'Solo el superusuario principal puede cambiar el rol de otro superusuario';
  }
  return null;
}

module.exports = { ROLES, ASIGNABLES, level, hasRole, canAssignRole };
