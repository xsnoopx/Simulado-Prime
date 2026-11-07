'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CharadasHub } from '@/components/CharadasHub';
import { CharadasIa } from '@/components/CharadasIa';

function ConteudoCharadas() {
  const searchParams = useSearchParams();
  const modo = searchParams.get('modo');

  if (modo === 'ia') return <CharadasIa />;
  return <CharadasHub />;
}

export default function CharadasPage() {
  return (
    <Suspense
      fallback={
        <div className="relative h-[100dvh] flex flex-col overflow-hidden">
          <div className="starfield" />
          <div className="text-center text-on-surface-variant pt-20">Carregando charadas...</div>
        </div>
      }
    >
      <ConteudoCharadas />
    </Suspense>
  );
}
