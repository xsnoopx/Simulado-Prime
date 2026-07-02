import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { AchievementProvider } from '@/components/AchievementProvider';
import { BackgroundMusicPlayer } from '@/components/BackgroundMusicPlayer';

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-br" className={`${inter.variable} ${spaceGrotesk.variable} dark`}>
      <body suppressHydrationWarning className="bg-background text-on-surface antialiased">
        <AchievementProvider>
          {children}
          <BackgroundMusicPlayer />
        </AchievementProvider>
      </body>
    </html>
  );
}
