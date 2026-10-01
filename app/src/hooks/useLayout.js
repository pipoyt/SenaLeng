import { useWindowDimensions } from 'react-native';

/** Pantallas anchas (computadora o tablet horizontal): menú lateral y cuadrícula. */
export const WIDE_MIN = 900;

export default function useLayout() {
  const { width } = useWindowDimensions();
  const wide = width >= WIDE_MIN;
  return {
    wide,
    width,
    // columnas para listas de tarjetas
    columns: width >= 1400 ? 3 : wide ? 2 : 1,
  };
}
