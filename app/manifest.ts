import type { MetadataRoute } from 'next';

// Manifest do PWA: permite instalar o Simulado Prime na tela inicial do
// iPhone (Safari -> Compartilhar -> Adicionar à Tela de Início) e do Android.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Simulado Prime',
    short_name: 'Simulado Prime',
    description:
      'Estude e pratique com a melhor plataforma de simulação do cosmos educacional.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#11131a',
    theme_color: '#11131a',
    lang: 'pt-BR',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
