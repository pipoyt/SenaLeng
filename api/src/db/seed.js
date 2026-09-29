/**
 * Datos semilla de SeñaLeng.
 *
 * IMPORTANTE: las descripciones son material de ejemplo para desarrollo.
 * Antes de publicar la app deben ser revisadas y validadas por hablantes
 * nativos de LSM / asociaciones de personas sordas (ver sección 2.4 del
 * documento del proyecto). videoUrl e imagenUrl quedan en null hasta contar
 * con el material multimedia grabado por el equipo o validadores.
 */
const bcrypt = require('bcryptjs');
const { principal, seedDemoUsers, bcryptRounds } = require('../config');

module.exports = function buildSeed() {
  const fecha = '2026-09-28T10:00:00.000Z';

  const s = (nombre, categoria, nivel, icono, descripcion) => ({
    nombre,
    categoria,
    descripcion,
    videoUrl: null,
    imagenUrl: null,
    nivel,
    icono,
    fechaCreacion: fecha,
  });

  const senas = [
    // Alfabeto
    s('A', 'Alfabeto', 'Básico', '✊', 'Mano cerrada en puño con el pulgar extendido pegado al costado del dedo índice. La palma mira hacia el frente.'),
    s('B', 'Alfabeto', 'Básico', '✋', 'Mano abierta con los dedos juntos y estirados hacia arriba; el pulgar se dobla sobre la palma.'),
    s('C', 'Alfabeto', 'Básico', '🫲', 'Dedos juntos y curvados junto con el pulgar formando la letra C. La palma mira hacia un lado.'),
    s('D', 'Alfabeto', 'Básico', '☝️', 'El índice se extiende hacia arriba mientras los demás dedos se curvan y tocan la punta del pulgar.'),
    s('E', 'Alfabeto', 'Básico', '🤛', 'Todos los dedos se doblan sobre la palma tocando el pulgar, que queda flexionado debajo de ellos.'),

    // Saludos
    s('Hola', 'Saludos', 'Básico', '👋', 'Mano abierta a la altura de la frente; se aleja hacia el frente con un movimiento corto, como un saludo.'),
    s('Adiós', 'Saludos', 'Básico', '🙋', 'Mano abierta con la palma al frente; se mueve de lado a lado o se abren y cierran los dedos.'),
    s('Buenos días', 'Saludos', 'Básico', '🌅', 'Se combina la seña de "bueno" con la de "día": la mano sube frente al cuerpo representando la salida del sol.'),
    s('¿Cómo estás?', 'Saludos', 'Intermedio', '🙂', 'Se señala a la otra persona y se realiza la seña de "cómo" con expresión facial de pregunta (cejas levantadas).'),
    s('Mucho gusto', 'Saludos', 'Intermedio', '🤝', 'Ambas manos se juntan al frente simulando un apretón de manos y se acompaña de una expresión amable.'),

    // Frases comunes
    s('Gracias', 'Frases comunes', 'Básico', '🙏', 'Coloca la mano abierta cerca de la barbilla y muévela hacia adelante, como si soplaras un beso suave.'),
    s('Por favor', 'Frases comunes', 'Básico', '🤲', 'Mano abierta sobre el pecho realizando un movimiento circular suave.'),
    s('De nada', 'Frases comunes', 'Básico', '🙌', 'Ambas manos abiertas con las palmas hacia arriba se mueven hacia afuera en señal de ofrecimiento.'),
    s('Perdón', 'Frases comunes', 'Intermedio', '😔', 'Mano en puño sobre el pecho haciendo círculos, acompañada de una expresión de disculpa.'),
    s('No entiendo', 'Frases comunes', 'Intermedio', '🤷', 'El índice toca la sien y después la mano se sacude negando, con el ceño ligeramente fruncido.'),

    // Números
    s('Uno', 'Números', 'Básico', '☝️', 'Se extiende el dedo índice hacia arriba con la palma mirando hacia la persona que seña.'),
    s('Dos', 'Números', 'Básico', '✌️', 'Se extienden los dedos índice y medio separados en forma de V.'),
    s('Tres', 'Números', 'Básico', '🤟', 'Se extienden el pulgar, el índice y el medio; los demás dedos permanecen doblados.'),
    s('Cuatro', 'Números', 'Básico', '🖖', 'Se extienden cuatro dedos (índice a meñique) y el pulgar queda doblado sobre la palma.'),
    s('Cinco', 'Números', 'Básico', '🖐️', 'Mano abierta con los cinco dedos extendidos y separados.'),

    // Familia
    s('Mamá', 'Familia', 'Básico', '👩', 'Coloca la mano abierta cerca de la mejilla y da dos toques suaves con las yemas de los dedos.'),
    s('Papá', 'Familia', 'Básico', '👨', 'Mano con los dedos juntos que toca la zona del bigote o la frente con dos toques breves.'),
    s('Hermano', 'Familia', 'Intermedio', '👦', 'Los dedos índices de ambas manos se colocan paralelos y se juntan, indicando dos personas iguales.'),
    s('Familia', 'Familia', 'Intermedio', '👨‍👩‍👧', 'Ambas manos en forma de F trazan un círculo horizontal frente al cuerpo, representando un grupo unido.'),

    // Comida
    s('Comer', 'Comida', 'Básico', '🍽️', 'Los dedos juntos, unidos a la punta del pulgar, se llevan varias veces hacia la boca.'),
    s('Agua', 'Comida', 'Básico', '💧', 'Mano con la forma de la letra A o simulando sostener un vaso, que se acerca a la boca.'),
    s('Tortilla', 'Comida', 'Intermedio', '🫓', 'Ambas manos abiertas se palmean alternadamente, imitando el movimiento de hacer tortillas.'),

    // Escuela
    s('Escuela', 'Escuela', 'Intermedio', '🏫', 'Ambas manos abiertas aplauden dos veces frente al cuerpo, como el llamado de un maestro.'),
    s('Tarea', 'Escuela', 'Intermedio', '📝', 'Se simula escribir sobre la palma de la mano contraria y luego se señala hacia la casa.'),
    s('Presta atención', 'Escuela', 'Avanzado', '👀', 'Ambas manos abiertas a los lados de los ojos se mueven hacia adelante, como anteojeras que dirigen la mirada.'),

    // Emociones
    s('Feliz', 'Emociones', 'Básico', '😊', 'Mano abierta sobre el pecho con movimientos ascendentes y una sonrisa clara.'),
    s('Triste', 'Emociones', 'Básico', '😢', 'Ambas manos abiertas frente al rostro bajan lentamente, con expresión de tristeza.'),
    s('Enojado', 'Emociones', 'Intermedio', '😠', 'Mano en garra frente al rostro que se tensa y se aleja, con el ceño fruncido.'),
  ];

  // Usuarios: el principal siempre se crea; las cuentas demo son opcionales (SEED_DEMO_USERS=false).
  const hash = (pw) => bcrypt.hashSync(pw, bcryptRounds);
  const u = (nombre, correo, password, rol) => ({
    nombre,
    correo,
    passwordHash: hash(password),
    rol,
    fechaCreacion: fecha,
    ultimoAcceso: null,
  });
  const usuarios = [u(principal.nombre, principal.correo, principal.password, 'principal')];
  if (seedDemoUsers) {
    usuarios.push(
      u('Super Demo', 'super@senaleng.app', 'Super123!', 'superusuario'),
      u('Admin Demo', 'admin@senaleng.app', 'Admin123!', 'admin'),
      u('Usuario Demo', 'usuario@senaleng.app', 'Usuario123!', 'usuario'),
    );
  }

  // Favoritos y progreso de ejemplo para "Usuario Demo" (id 4)
  const demo = seedDemoUsers ? 4 : 1;
  const favoritos = [
    { usuarioId: demo, senaId: 6, comentario: 'La primera que aprendí', fechaCreacion: fecha, fechaActualizacion: fecha },
    { usuarioId: demo, senaId: 11, comentario: '', fechaCreacion: fecha, fechaActualizacion: fecha },
    { usuarioId: demo, senaId: 16, comentario: 'Practicar con los demás números', fechaCreacion: fecha, fechaActualizacion: fecha },
  ];

  const progreso = [6, 7, 11, 12, 16, 17].map((senaId) => ({
    usuarioId: demo,
    senaId,
    fechaAprendida: fecha,
  }));

  return { senas, usuarios, favoritos, progreso, videos: [] };
};
