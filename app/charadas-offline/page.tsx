'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { CharadaCard } from '@/components/CharadaCard';
import {
  STATIC_CHARADAS,
  charadaDoDia,
  estatisticasProgresso,
  lerProgresso,
  registrarResposta,
  salvarProgresso,
  type ProgressoCharadas,
} from '@/lib/charadas';

function CharadasContent() {
  const searchParams = useSearchParams();
  const [indice, setIndice] = useState(0);
  const [progresso, setProgresso] = useState<ProgressoCharadas>({});

  const dia = useMemo(() => charadaDoDia(), []);
  const stats = useMemo(() => estatisticasProgresso(progresso), [progresso]);

  useEffect(() => {
    setProgresso(lerProgresso());
  }, []);

  useEffect(() => {
    // Links antigos com ?dia=1 continuam abrindo a charada do dia.
    if (searchParams.get('dia') !== '1') return;
    const posicao = STATIC_CHARADAS.findIndex((item) => item.id === dia.id);
    if (posicao >= 0) setIndice(posicao);
  }, [searchParams, dia]);

  const indiceSeguro =
    STATIC_CHARADAS.length > 0 ? Math.min(indice, STATIC_CHARADAS.length - 1) : 0;
  const atual = STATIC_CHARADAS[indiceSeguro];

  const proximo = () => {
    if (STATIC_CHARADAS.length <= 1) return;
    setIndice((valor) => (valor + 1) % STATIC_CHARADAS.length);
  };

  const responder = (status: 'acertei' | 'errei') => {
    if (!atual) return;
    setProgresso((anterior) => {
      const novo = registrarResposta(anterior, atual.id, status);
      salvarProgresso(novo);
      return novo;
    });
  };

  return (
    <>
      <header className="mb-7 flex items-center justify-between">
        <Link href="/" aria-label="Voltar para o início">
          <span className="p-2 glass-panel rounded-full text-on-surface-variant inline-flex hover:text-on-surface transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </span>
        </Link>
        <div className="text-center flex-1 px-2">
          <h1 className="text-[clamp(1.1rem,4.8vw,1.5rem)] font-display font-bold tracking-[0.12em] text-secondary">
            ACERVO DE CHARADAS
          </h1>
          <p className="text-[0.625rem] text-on-surface-variant uppercase tracking-[0.28em] mt-1">
            Dicas e progresso local
          </p>
        </div>
        <div className="w-9" />
      </header>

      <section className="glass-panel rounded-2xl p-4 mb-5 border border-white/5">
        <p className="text-[0.5625rem] font-black uppercase tracking-[0.2em] text-on-surface-variant/60 mb-2.5">
          Seu progresso
        </p>
        <div className="h-2 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-secondary/60 via-secondary to-secondary transition-all duration-500"
            style={{ width: `${Math.max(stats.percentualExato, stats.resolvidos > 0 ? 1.5 : 0)}%` }}
          />
        </div>
      </section>

      <section className="space-y-3">
        {atual && (
          <CharadaCard
            key={atual.id}
            charada={atual}
            progresso={progresso[atual.id]}
            destaque={atual.id === dia.id}
            onResponder={responder}
            onProximo={proximo}
          />
        )}

        <p className="text-center text-[0.625rem] text-on-surface-variant/40 pt-2">
          O acervo funciona sem internet. O gerador com IA é exclusivo do COSMOS PRIME.
        </p>
      </section>
    </>
  );
}

export default function CharadasOfflinePage() {
  return (
    <div className="relative h-[100dvh] flex flex-col overflow-hidden">
      <div className="starfield" />
      <main className="flex-1 overflow-y-auto pt-10 px-5 sm:px-6 max-w-xl mx-auto w-full pb-32">
        <Suspense
          fallback={
            <div className="text-center text-on-surface-variant pt-20">Carregando charadas...</div>
          }
        >
          <CharadasContent />
        </Suspense>
      </main>
      <BottomNav />
    </div>
  );
}
