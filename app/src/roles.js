// Misma jerarquía que la API (api/src/utils/roles.js).
export const ROLES = ['usuario', 'admin', 'superusuario', 'principal'];
export const hasRole = (user, min) => !!user && ROLES.indexOf(user.rol) >= ROLES.indexOf(min);

export const ROL_INFO = {
  usuario: { label: 'Usuario', color: '#6C5CE7', bg: '#EDE9FE', desc: 'Aprende, guarda favoritos y registra su progreso.' },
  admin: { label: 'Administrador', color: '#B45309', bg: '#FFF1DC', desc: 'Además graba videos de señas y crea o edita señas.' },
  superusuario: { label: 'Superusuario', color: '#0F766E', bg: '#DDF7F2', desc: 'Además aprueba videos, ve usuarios y asigna roles.' },
  principal: { label: 'Principal', color: '#BE185D', bg: '#FDE7F1', desc: 'Superusuario principal: además ve las estadísticas.' },
};

/** Roles que el usuario de la sesión puede asignar a "target" (mismas reglas que la API). */
export function rolesAsignables(actor, target) {
  if (!hasRole(actor, 'superusuario') || !target || target.id === actor.id || target.rol === 'principal') return [];
  if (target.rol === 'superusuario' && actor.rol !== 'principal') return [];
  return ['usuario', 'admin', 'superusuario'];
}
