# SeñaLeng — App móvil

React Native 0.86 + Expo SDK 57 + React Navigation 7.

```bash
npm install
npx expo start        # QR para Expo Go · "w" para web · "a" para emulador Android
npm run export:web    # compila la versión web en dist/
```

La API debe estar corriendo (`cd ../api && npm run dev`). La URL se detecta automáticamente;
para fijarla, crea `.env` con `EXPO_PUBLIC_API_URL=http://<IP-de-tu-PC>:3000/api` o cámbiala en **Perfil**.

Guía completa: [`../docs/GUIA_INSTALACION.md`](../docs/GUIA_INSTALACION.md) · Arquitectura: [`../docs/ARQUITECTURA.md`](../docs/ARQUITECTURA.md)
