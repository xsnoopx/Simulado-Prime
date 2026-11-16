# Casca Android/iOS (Capacitor)

O APK e o IPA são WebViews que carregam o site publicado. Não há código do app
aqui, só os projetos nativos, a configuração do Capacitor e os assets de
ícone/splash.

O mesmo site pode ser instalado como PWA no iPhone (Safari → Compartilhar →
Adicionar à Tela de Início), sem validade de 7 dias e sem computador.

## Gerar o APK (Android)

O build roda no GitHub Actions (`.github/workflows/android-apk.yml`), porque
não é preciso ter Android SDK na máquina:

```sh
gh workflow run android-apk.yml -f app_url=https://simulado-prime-ashen.vercel.app
```

O APK sai como artifact `simulado-prime-apk`.

## Gerar o IPA (iPhone)

O build roda no GitHub Actions (`.github/workflows/ios-ipa.yml`), em um runner
macOS com Xcode e CocoaPods:

```sh
gh workflow run ios-ipa.yml -f app_url=https://simulado-prime-ashen.vercel.app
```

O IPA sai como artifact `simulado-prime-ipa`, **sem assinatura**. Para instalar
no iPhone:

1. Baixe o IPA no computador.
2. Abra o [Sideloadly](https://sideloadly.io/) (Windows/macOS) ou o
   [AltStore](https://altstore.io/) e conecte o iPhone por cabo.
3. Informe um Apple ID comum (gratuito). O Sideloadly assina e instala o app.
4. No iPhone, confie no desenvolvedor em Ajustes → Geral → VPN e Gerenciamento
   de Dispositivos.

Com Apple ID gratuito o app expira em **7 dias** e precisa ser reassinado.
TestFlight e App Store exigem o Apple Developer Program (US$ 99/ano).

## Ícone e splash

A arte de origem é `resources/icon-source.png` (emblema + texto "SIMULADO
PRIME" no rodapé). Para regerar tudo:

```sh
npm install
npm run assets        # Android
npm run assets:ios    # iOS
```

O comando do Android encadeia três passos:

1. `scripts/prepare-assets.mjs` — detecta e corta o texto do rodapé, monta o
   ícone (emblema sobre um fundo desfocado da própria arte, sem emenda) e o
   splash (só o emblema, com desvanecimento radial).
2. `capacitor-assets generate --android` — distribui nos `mipmap-*` e
   `drawable-*` do projeto Android.
3. `scripts/optimize-splash.mjs` — converte os splashes para WebP (erro médio
   de 0,7/255, ~7 MB a menos no APK) e descarta as variantes `-night`, que o
   gerador preenche com o ícone em vez da arte.

`resources/icon.png` e `resources/splash.png` são saída do passo 1 e estão no
`.gitignore`; os arquivos finais em `android/app/src/main/res/` vão versionados.

## Versão

Ao publicar um APK novo, suba `versionCode` e `versionName` em
`android/app/build.gradle` — o Android recusa instalar por cima uma versão com
o mesmo `versionCode`. Para o iOS, ajuste `MARKETING_VERSION` e
`CURRENT_PROJECT_VERSION` em `ios/App/App.xcodeproj/project.pbxproj`.

## Limitações

- Sem modo offline: as rotas `/api/*` e os dados dependem do servidor.
- Assinatura de debug (Android) e IPA sem assinatura (iOS), ambos para
  sideload. Para a Play Store/App Store seria preciso conta de desenvolvedor,
  build assinado e política de privacidade.
