import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.azizipos.grocery',
  appName: 'بقالة العزي للمواد الغذائية',
  webDir: 'dist',
  android: {
    allowMixedContent: true
  }
};

export default config;
