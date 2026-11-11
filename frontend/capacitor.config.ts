import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'ru.walktogether.app',
  appName: 'Прогулки вместе',
  webDir: 'dist',
  server: {
    androidScheme: 'http', // чтобы работать с http-сервером в локальной сети
    cleartext: true,
  },
}

export default config
