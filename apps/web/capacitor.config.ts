import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.chophub.app',
  appName: 'ChopHub',
  webDir: 'dist',
  // When the APK is installed, point it at your deployed web app:
  // server: { url: 'https://chophub-web.onrender.com' },
};

export default config;
