'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  Compass,
  Library,
  Shuffle,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BottomNav } from '@/components/BottomNav';
import { CharadaCard } from '@/components/CharadaCard';
import {
  CATEGORIAS_CHARADAS,
  DIFICULDADES,
  STATIC_CHARADAS,
  charadaDoDia,
  estatisticasProgresso,
  lerProgresso,
  registrarResposta,
  salvarProgresso,
  type ProgressoCharadas,
} from '@/lib/charadas';

export function CharadasHub() {
  const [progresso, setProgresso] = useState<ProgressoCharadas>({});
  const dia = useMemo(() => charadaDoDia(), []);
  const indiceDia = useMemo(
    () => STATIC_CHARADAS.findIndex((item) => item.id === dia.id),
    [dia]
  );
  const [indice, setIndice] = useState(indiceDia >= 0 ? indiceDia : 0);

  useEffect(() => {
    setProgresso(lerProgresso());
  }, []);

  const atual = STATIC_CHARADAS[indice] ?? dia;
  const stats = useMemo(() => estatisticasProgresso(progresso), [progresso]);

  const sortear = () => {
    if (STATIC_CHARADAS.length <= 1) return;
    let novo = indice;
    while (novo === indice) {
      novo = Math.floor(Math.random() * STATIC_CHARADAS.length);
    }
    setIndice(novo);
  };

  const responder = (status: 'acertei' | 'errei') => {
    setProgresso((anterior) => {
      const novo = registrarResposta(anterior, atual.id, status);
      salvarProgresso(novo);
      return novo;
    });
  };

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
              Riso rápido, offline e com IA
            </p>
          </div>
          <div className="w-9" />
        </header>

        <nav
          aria-label="Modo de charadas"
          className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-white/5 border border-white/5 mb-6"
        >
          <span className="py-2.5 rounded-xl bg-secondary text-white text-[0.6875rem] font-bold flex items-center justify-center gap-1.5 shadow-md shadow-secondary/10">
            <Library className="w-3.5 h-3.5" />
            Acervo local
          </span>
          <Link
            href="/charadas?modo=ia"
            className="py-2.5 rounded-xl text-[0.6875rem] font-bold flex items-center justify-center gap-1.5 text-on-surface-variant hover:bg-white/5 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Gerar com IA
          </Link>
        </nav>

        <section className="glass-panel rounded-2xl p-4 mb-6 border border-white/5">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-secondary/10 text-secondary">
                <Trophy className="w-4 h-4" />
              </span>
              <div>
                <p className="text-[0.5625rem] font-black uppercase tracking-[0.2em] text-on-surface-variant/60">
                  Seu progresso
                </p>
                <p className="text-sm font-bold text-on-surface">
                  {stats.resolvidos} charadas sabidas
                </p>
              </div>
            </div>
            <span className="text-lg font-display font-black text-secondary">
              {stats.percentual === 0 && stats.resolvidos > 0 ? '<1' : stats.percentual}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-secondary/60 via-secondary to-secondary transition-all duration-500"
              style={{ width: `${stats.percentual}%` }}
            />
          </div>
          <p className="text-[0.625rem] text-on-surface-variant/50 mt-2">
            {stats.tentados > 0
              ? `${stats.tentados} ${stats.tentados === 1 ? 'charada vista' : 'charadas vistas'} neste dispositivo.`
              : 'O progresso fica salvo apenas no seu aparelho.'}
          </p>
        </section>

        <section className="mb-6">
          <div className="flex items-center justify-between gap-3 mb-2.5">
            <p className="text-[0.625rem] font-black uppercase tracking-[0.2em] text-secondary">
              {atual.id === dia.id ? 'Charada do dia' : 'Para começar bem'}
            </p>
            <button
              type="button"
              onClick={sortear}
              className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[0.625rem] font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5 hover:bg-white/10 transition-colors cursor-pointer"
            >
              <Shuffle className="w-3.5 h-3.5" />
              Sortear
            </button>
          </div>

          <CharadaCard
            key={atual.id}
            charada={atual}
            progresso={progresso[atual.id]}
            destaque={atual.id === dia.id}
            onResponder={responder}
          />
        </section>

        <Link
          href="/charadas-offline"
          className="w-full py-4 rounded-2xl bg-secondary text-white font-display font-bold tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-secondary/20 hover:bg-secondary/90 transition-colors mb-7"
        >
          <Compass className="w-5 h-5" />
          EXPLORAR O ACERVO COMPLETO
          <ArrowRight className="w-4 h-4" />
        </Link>

        <section className="mb-7">
          <div className="flex items-center justify-between gap-3 mb-3">
            <p className="text-[0.625rem] font-black uppercase tracking-[0.2em] text-on-surface-variant/60">
              Navegue por categoria
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {CATEGORIAS_CHARADAS.map((categoria) => (
              <Link
                key={categoria.id}
                href={`/charadas-offline?categoria=${categoria.id}`}
                className="glass-panel rounded-2xl p-3.5 border border-white/5 hover:bg-white/5 transition-colors group"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xl" aria-hidden="true">
                    {categoria.emoji}
                  </span>
                </div>
                <p className="text-sm font-bold text-on-surface mt-2 group-hover:text-secondary transition-colors">
                  {categoria.label}
                </p>
                <p className="text-[0.625rem] text-on-surface-variant/60 leading-snug mt-0.5 line-clamp-2">
                  {categoria.descricao}
                </p>
              </Link>
            ))}
          </div>
        </section>

        <section className="mb-7">
          <p className="text-[0.625rem] font-black uppercase tracking-[0.2em] text-on-surface-variant/60 mb-3">
            Escolha o nível
          </p>
          <div className="flex flex-wrap gap-2">
            {DIFICULDADES.map((nivel) => (
              <Link
                key={nivel}
                href={`/charadas-offline?dificuldade=${encodeURIComponent(nivel)}`}
                className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[0.6875rem] font-bold text-on-surface-variant hover:bg-white/10 transition-colors"
              >
                {nivel}
              </Link>
            ))}
            <Link
              href="/charadas-offline?dia=1"
              className="px-4 py-2 rounded-full bg-secondary/10 border border-secondary/20 text-[0.6875rem] font-bold text-secondary hover:bg-secondary/20 transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Charada do dia
            </Link>
          </div>
        </section>

        <section className="glass-panel rounded-2xl p-4 border border-white/5 space-y-2">
          <div className="flex items-center gap-2 text-secondary">
            <CheckCircle2 className="w-4 h-4" />
            <p className="text-xs font-bold">Funciona sem internet</p>
          </div>
          <p className="text-[0.6875rem] text-on-surface-variant leading-relaxed">
            Todas as charadas do acervo ficam no aparelho. O gerador de charadas
            inéditas com IA é um recurso separado do COSMOS PRIME.
          </p>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
