'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, Compass, Sparkles, Trophy } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import {
  estatisticasProgresso,
  lerProgresso,
  type ProgressoCharadas,
} from '@/lib/charadas';

export function CharadasHub() {
  const [progresso, setProgresso] = useState<ProgressoCharadas>({});

  useEffect(() => {
    setProgresso(lerProgresso());
  }, []);

  const stats = useMemo(() => estatisticasProgresso(progresso), [progresso]);

  return (
    <div className="relative h-[100dvh] flex flex-col overflow-hidden">
      <div className="starfield" />

      <div className="absolute top-[-10%] right-[-10%] w-[420px] h-[420px] bg-secondary/10 blur-[120px] rounded-full -z-10" />
      <div className="absolute bottom-[25%] left-[-10%] w-[340px] h-[340px] bg-primary/10 blur-[100px] rounded-full -z-10" />

      <main className="flex-1 overflow-y-auto pt-10 px-5 sm:px-6 max-w-xl mx-auto w-full pb-32">
        <header className="mb-7 flex items-center justify-between">
          <Link href="/" aria-label="Voltar para o início">
            <span className="p-2 glass-panel rounded-full text-on-surface-variant inline-flex hover:text-on-surface transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </span>
          </Link>
          <div className="text-center flex-1 px-2">
            <h1 className="text-[clamp(1.1rem,4.8vw,1.5rem)] font-display font-bold tracking-[0.12em] text-secondary">
              CHARADAS
            </h1>
            <p className="text-[0.625rem] text-on-surface-variant uppercase tracking-[0.28em] mt-1">
              Escolha como quer jogar
            </p>
          </div>
          <div className="w-9" />
        </header>

        <section className="glass-panel rounded-2xl p-4 mb-6 border border-white/5">
          <div className="flex items-center gap-2.5 mb-2.5">
            <span className="p-2 rounded-xl bg-secondary/10 text-secondary">
              <Trophy className="w-4 h-4" />
            </span>
            <p className="text-[0.5625rem] font-black uppercase tracking-[0.2em] text-on-surface-variant/60">
              Seu progresso
            </p>
          </div>
          <div className="h-2 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-secondary/60 via-secondary to-secondary transition-all duration-500"
              style={{
                width: `${Math.max(stats.percentualExato, stats.resolvidos > 0 ? 1.5 : 0)}%`,
              }}
            />
          </div>
        </section>

        <div className="space-y-3">
          <Link
            href="/charadas-offline"
            className="glass-panel rounded-3xl p-5 border border-white/5 hover:bg-white/5 hover:border-secondary/30 transition-all group block"
          >
            <div className="flex items-center gap-4">
              <span className="p-3 rounded-2xl bg-secondary/10 text-secondary shrink-0">
                <Compass className="w-6 h-6" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[0.5625rem] font-black uppercase tracking-[0.2em] text-secondary">
                  Offline
                </p>
                <h2 className="text-base font-display font-bold text-on-surface mt-0.5">
                  Charadas Offline
                </h2>
                <p className="text-[0.6875rem] text-on-surface-variant/60 leading-snug mt-1">
                  Acervo completo no aparelho. Funciona sem internet.
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-on-surface-variant/50 group-hover:text-secondary group-hover:translate-x-0.5 transition-all shrink-0" />
            </div>
          </Link>

          <Link
            href="/charadas?modo=ia"
            className="glass-panel rounded-3xl p-5 border border-white/5 hover:bg-white/5 hover:border-amber-500/30 transition-all group block"
          >
            <div className="flex items-center gap-4">
              <span className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 shrink-0">
                <Sparkles className="w-6 h-6" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[0.5625rem] font-black uppercase tracking-[0.2em] text-amber-400">
                  Online · IA
                </p>
                <h2 className="text-base font-display font-bold text-on-surface mt-0.5">
                  Charadas Online
                </h2>
                <p className="text-[0.6875rem] text-on-surface-variant/60 leading-snug mt-1">
                  Crie charadas inéditas com inteligência artificial.
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-on-surface-variant/50 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all shrink-0" />
            </div>
          </Link>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
