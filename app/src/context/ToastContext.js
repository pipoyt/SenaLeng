import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { colors, radius } from '../theme';

const ToastContext = createContext(() => {});

/** Aviso flotante (ej. "✓ 'Gracias' agregada a favoritos" del wireframe). */
export function ToastProvider({ children }) {
  const [message, setMessage] = useState(null);
  const [type, setType] = useState('info');
  const opacity = useRef(new Animated.Value(0)).current;
  const timer = useRef();

  const show = useCallback(
    (msg, kind = 'info') => {
      clearTimeout(timer.current);
      setMessage(msg);
      setType(kind);
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
      timer.current = setTimeout(() => {
        Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => setMessage(null));
      }, 2400);
    },
    [opacity],
  );

  return (
    <ToastContext.Provider value={show}>
      {children}
      {message ? (
        <Animated.View
          pointerEvents="none"
          style={[styles.toast, type === 'error' && { backgroundColor: colors.danger }, { opacity }]}
          accessibilityLiveRegion="polite"
        >
          <Text style={styles.text}>{message}</Text>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 110,
    backgroundColor: colors.toast,
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  text: { color: colors.white, fontSize: 14, fontWeight: '600' },
});
