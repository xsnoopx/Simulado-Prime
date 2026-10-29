# Casca Android (Capacitor)

O APK é um WebView que carrega o site publicado. Não há código do app aqui, só
o projeto Android, a configuração do Capacitor e os assets de ícone/splash.

## Gerar o APK

O build roda no GitHub Actions (`.github/workflows/android-apk.yml`), porque
não é preciso ter Android SDK na máquina:

```sh
gh workflow run android-apk.yml -f app_url=https://simulado-prime-ashen.vercel.app
```

O APK sai como artifact `simulado-prime-apk`. Para publicar, anexe no release
correspondente.

## Ícone e splash

A arte de origem é `resources/icon-source.png` (emblema + texto "SIMULADO
PRIME" no rodapé). Para regerar tudo:

```sh
npm install
npm run assets
```

O comando encadeia três passos:

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
o mesmo `versionCode`.

## Limitações

- Sem modo offline: as rotas `/api/*` e os dados dependem do servidor.
- Assinatura de debug (sideload). Para a Play Store seria preciso conta de
  desenvolvedor, AAB assinado e política de privacidade.
