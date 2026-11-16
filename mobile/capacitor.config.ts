import type { CapacitorConfig } from '@capacitor/cli';

// O app é o Next.js rodando no servidor (Vercel).
// O APK/IPA é uma casca: ele carrega essa URL num WebView. Não há cópia
// offline do app, porque as rotas /api/* dependem do servidor.
//
// APP_URL pode ser trocada no build (workflow_dispatch do GitHub Actions) sem
// mexer no código: APP_URL="https://..." npm run sync
const appUrl = process.env.APP_URL || 'https://simulado-prime-ashen.vercel.app';

const config: CapacitorConfig = {
  appId: 'com.xsnoopx.simuladoprime',
  appName: 'Simulado Prime',
  webDir: 'www',
  server: {
    url: appUrl,
    cleartext: false,
    androidScheme: 'https'
  },
  android: {
    allowMixedContent: false
  },
  ios: {
    backgroundColor: '#11131a'
  }
};

export default config;
