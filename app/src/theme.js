// Paleta tomada de los wireframes y del logotipo (morado claro + blanco).
export const colors = {
  primary: '#6C5CE7',
  primaryDark: '#5443D6',
  primarySoft: '#EDE9FE',
  background: '#F5F3FF',
  card: '#FFFFFF',
  text: '#1E1B3A',
  muted: '#8E8AA8',
  border: '#ECE9F8',
  danger: '#E5484D',
  dangerSoft: '#FDECEC',
  success: '#22A06B',
  toast: '#1F1B3D',
  white: '#FFFFFF',
};

// Fondo pastel distinto para cada categoría (miniaturas de la lista).
const pastel = ['#EDE9FE', '#FFF1DC', '#E3F2FD', '#E8F7EE', '#FDEBF3', '#FFF8D6', '#E6FAF8', '#F3E8FF'];
export const pastelFor = (key = '') => {
  let h = 0;
  for (const ch of String(key)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return pastel[h % pastel.length];
};

export const radius = { sm: 10, md: 16, lg: 22, pill: 999 };

export const shadow = {
  shadowColor: '#4B3FB5',
  shadowOpacity: 0.08,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 2,
};

export const font = {
  h1: { fontSize: 28, fontWeight: '800', color: colors.text },
  h2: { fontSize: 20, fontWeight: '700', color: colors.text },
  title: { fontSize: 16, fontWeight: '700', color: colors.text },
  body: { fontSize: 14, color: colors.text },
  small: { fontSize: 12, color: colors.muted },
  overline: { fontSize: 11, fontWeight: '700', letterSpacing: 1, color: colors.muted, textTransform: 'uppercase' },
};
