import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../theme';

/** Pantalla de bienvenida (Figura 2). */
export default function SplashScreen() {
  const scale = useRef(new Animated.Value(0.6)).current;
  const dots = [useRef(new Animated.Value(0.3)).current, useRef(new Animated.Value(0.3)).current, useRef(new Animated.Value(0.3)).current];

  useEffect(() => {
    Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }).start();
    const anim = Animated.loop(
      Animated.stagger(
        180,
        dots.map((d) =>
          Animated.sequence([
            Animated.timing(d, { toValue: 1, duration: 260, useNativeDriver: true }),
            Animated.timing(d, { toValue: 0.3, duration: 260, useNativeDriver: true }),
          ]),
        ),
      ),
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Animated.Text style={[styles.hand, { transform: [{ scale }] }]}>✋</Animated.Text>
      <Text style={styles.title}>SeñaLeng</Text>
      <Text style={styles.subtitle}>Aprende Lengua de Señas{'\n'}Mexicana a tu ritmo</Text>
      <View style={styles.dots}>
        {dots.map((d, i) => (
          <Animated.View key={i} style={[styles.dot, { opacity: d }]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  hand: { fontSize: 88 },
  title: { fontSize: 38, fontWeight: '800', color: colors.white, marginTop: 20 },
  subtitle: { fontSize: 16, color: '#E4E0FF', textAlign: 'center', marginTop: 10, lineHeight: 22 },
  dots: { flexDirection: 'row', gap: 8, marginTop: 48 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.white },
});
