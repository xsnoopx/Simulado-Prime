import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { AchievementProvider } from '@/components/AchievementProvider';
import { BackgroundMusicPlayer } from '@/components/BackgroundMusicPlayer';
import { FontSizeProvider } from '@/components/FontSizeProvider';

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
    <html lang="pt-br" className={`${inter.variable} ${spaceGrotesk.variable} dark`}>
      <body suppressHydrationWarning className="bg-background text-on-surface antialiased">
        <script
          id="fonte-inicial"
          dangerouslySetInnerHTML={{ __html: scriptFonteInicial }}
        />
        <FontSizeProvider>
          <AchievementProvider>
            {children}
            <BackgroundMusicPlayer />
          </AchievementProvider>
        </FontSizeProvider>
      </body>
    </html>
  );
}
