import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.arche.app',
  appName: 'Arché',
  webDir: 'dist',
  server: {
    // Only enable for development
    ...(process.env.NODE_ENV === 'development' && {
      url: 'http://10.0.2.2:5173',
      cleartext: true,
    }),
  },
};

export default config;
