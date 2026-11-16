import type { Metadata, Viewport } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { AchievementProvider } from '@/components/AchievementProvider';
import { BackgroundMusicPlayer } from '@/components/BackgroundMusicPlayer';
import { FontSizeProvider } from '@/components/FontSizeProvider';
import { PrimeWelcome } from '@/components/PrimeWelcome';
import { AppNotice } from '@/components/AppNotice';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
});

export const metadata: Metadata = {
  title: 'Simulado Prime',
  description: 'Estude e pratique com a melhor plataforma de simulação do cosmos educacional.',
  applicationName: 'Simulado Prime',
  manifest: '/manifest.webmanifest',
  // iOS: abre em tela cheia ao instalar pela tela de início do Safari.
  appleWebApp: {
    capable: true,
    title: 'Simulado Prime',
    statusBarStyle: 'black',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#11131a',
  colorScheme: 'dark',
};

// Aplica o tamanho de fonte salvo antes do primeiro paint, evitando que a
// tela pisque no tamanho padrão e "pule" quando o React hidrata.
const scriptFonteInicial = `(function(){try{var v=parseFloat(localStorage.getItem('cosmos_font_size'));if(!isFinite(v)){v=16;}v=Math.min(24,Math.max(10,Math.round(v)));document.documentElement.style.fontSize=v+'px';document.documentElement.dataset.fonte=String(v);}catch(e){}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-br" suppressHydrationWarning className={`${inter.variable} ${spaceGrotesk.variable} dark`}>
      <body suppressHydrationWarning className="bg-background text-on-surface antialiased">
        <script
          id="fonte-inicial"
          dangerouslySetInnerHTML={{ __html: scriptFonteInicial }}
        />
        <FontSizeProvider>
          <AchievementProvider>
            {children}
            <AppNotice />
            <PrimeWelcome />
            <BackgroundMusicPlayer />
          </AchievementProvider>
        </FontSizeProvider>
      </body>
    </html>
  );
}
