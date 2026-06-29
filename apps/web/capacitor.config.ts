import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.chophub.app',
  appName: 'ChopHub',
  webDir: 'dist',
  // Background shown while the web app is loading (also the splash bg)
  backgroundColor: '#ffffff',
  // When the APK is installed, point it at your deployed web app:
  // server: { url: 'https://chophub-api.onrender.com' },
  android: {
    // Allow the web app to scroll behind the status bar; we handle padding in CSS
    backgroundColor: '#ffffff',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 800,
      launchAutoHide: true,
      backgroundColor: '#ffffff',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      androidSpinnerStyle: 'small',
      spinnerColor: '#ea580c',
    },
    StatusBar: {
      // Brand orange on top — matches ChopHub
      backgroundColor: '#ea580c',
      style: 'LIGHT',
      overlaysWebView: false,
    },
  },
};

export default config;