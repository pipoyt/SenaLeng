/** Versión pública de un usuario (nunca exponer el hash de la contraseña). */
module.exports.publicUser = (u) => {
  if (!u) return u;
  const { passwordHash, ...rest } = u; // eslint-disable-line no-unused-vars
  return rest;
};
