'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Lightbulb,
  Quote,
  RefreshCcw,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  CATEGORIA_POR_ID,
  obterDica,
  type CategoriaEnigmaId,
  type Enigma,
  type ProgressoEnigma,
  type StatusEnigma,
} from '@/lib/enigmas';

const ESTILO_CATEGORIA: Record<
  CategoriaEnigmaId,
  { badge: string; barra: string }
> = {
  classicos: {
    badge: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
    barra: 'from-amber-500/40 via-amber-400 to-amber-500/40',
  },
  logica: {
    badge: 'bg-sky-500/10 text-sky-300 border-sky-500/20',
    barra: 'from-sky-500/40 via-sky-400 to-sky-500/40',
  },
  matematica: {
    badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
    barra: 'from-emerald-500/40 via-emerald-400 to-emerald-500/40',
  },
  palavras: {
    badge: 'bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500/20',
    barra: 'from-fuchsia-500/40 via-fuchsia-400 to-fuchsia-500/40',
  },
  lateral: {
    badge: 'bg-orange-500/10 text-orange-300 border-orange-500/20',
    barra: 'from-orange-500/40 via-orange-400 to-orange-500/40',
  },
  misterio: {
    badge: 'bg-error/10 text-error border-error/20',
    barra: 'from-error/40 via-error to-error/40',
  },
  ciencia: {
    badge: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
    barra: 'from-cyan-500/40 via-cyan-400 to-cyan-500/40',
  },
  historia: {
    badge: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/20',
    barra: 'from-yellow-500/40 via-yellow-400 to-yellow-500/40',
  },
};

const ESTILO_DIFICULDADE: Record<string, string> = {
  Simples: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  Médio: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
  Complexo: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
};

interface EnigmaCardProps {
  enigma: Enigma;
  onProximo?: () => void;
  onResponder?: (status: StatusEnigma) => void;
  progresso?: ProgressoEnigma;
  destaque?: boolean;
  rotuloDestaque?: string;
  className?: string;
}

export function EnigmaCard({
  enigma,
  onProximo,
  onResponder,
  progresso,
  destaque = false,
  rotuloDestaque = 'Enigma do dia',
  className,
}: EnigmaCardProps) {
  const [mostrarDica, setMostrarDica] = useState(false);
  const [revelado, setRevelado] = useState(false);

  useEffect(() => {
    setMostrarDica(false);
    setRevelado(false);
  }, [enigma.id]);

  const categoria = CATEGORIA_POR_ID[enigma.categoria];
  const estilo = ESTILO_CATEGORIA[enigma.categoria];

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn(
        'glass-panel rounded-3xl overflow-hidden border border-white/5 shadow-2xl relative',
        className
      )}
    >
      <div className={cn('h-1.5 bg-gradient-to-r', estilo.barra)} />

      <div className="p-6 sm:p-8 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[0.625rem] font-bold uppercase tracking-wider',
              estilo.badge
            )}
          >
            <span aria-hidden="true">{categoria.emoji}</span>
            {categoria.label}
          </span>

          <div className="flex items-center gap-1.5">
            {progresso && (
              <span
                className={cn(
                  'px-2 py-1 rounded-full border text-[0.5625rem] font-bold uppercase tracking-wider',
                  progresso.status === 'acertei'
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                    : 'bg-white/5 text-white/50 border-white/10'
                )}
              >
                {progresso.status === 'acertei' ? 'Resolvido' : 'Tentou'}
              </span>
            )}
            <span
              className={cn(
                'px-2.5 py-1 rounded-full border text-[0.625rem] font-bold',
                ESTILO_DIFICULDADE[enigma.dificuldade]
              )}
            >
              {enigma.dificuldade}
            </span>
          </div>
        </div>

        {destaque && (
          <span className="inline-flex items-center gap-1.5 text-[0.5625rem] font-black uppercase tracking-[0.25em] text-error">
            <Quote className="w-3 h-3 rotate-180" />
            {rotuloDestaque}
          </span>
        )}

        <div className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-display font-bold leading-snug text-on-surface">
            {enigma.titulo}
          </h2>
          <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed">
            {enigma.enigma}
          </p>
        </div>

        {enigma.tags && enigma.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {enigma.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-full bg-white/5 border border-white/5 text-[0.5625rem] uppercase tracking-wider text-on-surface-variant/60"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            onClick={() => setMostrarDica((valor) => !valor)}
            aria-expanded={mostrarDica}
            className={cn(
              'flex-1 min-w-[8.5rem] py-3 px-4 rounded-2xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer',
              mostrarDica
                ? 'bg-amber-500/15 border-amber-500/30 text-amber-200'
                : 'bg-white/5 border-white/10 text-on-surface-variant hover:bg-white/10'
            )}
          >
            <Lightbulb className="w-4 h-4" />
            {mostrarDica ? 'Esconder dica' : 'Ver dica'}
          </button>

          <button
            type="button"
            onClick={() => setRevelado((valor) => !valor)}
            aria-expanded={revelado}
            className={cn(
              'flex-1 min-w-[8.5rem] py-3 px-4 rounded-2xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer',
              revelado
                ? 'bg-white/10 border-white/15 text-on-surface'
                : 'bg-error border-error/60 text-white hover:bg-error/90'
            )}
          >
            {revelado ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {revelado ? 'Esconder resposta' : 'Revelar resposta'}
          </button>
        </div>

        <AnimatePresence initial={false}>
          {mostrarDica && (
            <motion.div
              key="dica"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/15">
                <p className="text-[0.5625rem] font-black uppercase tracking-[0.2em] text-amber-300/80 mb-1.5">
                  Dica
                </p>
                <p className="text-sm text-amber-100/90 leading-relaxed">{obterDica(enigma)}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence initial={false}>
          {revelado && (
            <motion.div
              key="resposta"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div
                aria-live="polite"
                className="p-5 rounded-2xl bg-error/10 border border-error/20 space-y-3"
              >
                <p className="text-[0.5625rem] font-black uppercase tracking-[0.2em] text-error/80">
                  Resposta
                </p>
                <p className="text-lg sm:text-xl font-display font-bold text-on-surface leading-snug">
                  {enigma.resposta}
                </p>

                {enigma.explicacao && (
                  <p className="text-sm text-on-surface-variant leading-relaxed border-t border-white/5 pt-3">
                    {enigma.explicacao}
                  </p>
                )}

                {enigma.fonte && (
                  <p className="text-[0.5625rem] uppercase tracking-wider text-on-surface-variant/40">
                    Fonte: {enigma.fonte}
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {revelado && onResponder && (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onResponder('acertei')}
              className="py-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 hover:bg-emerald-500/25 transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              Eu acertei
            </button>
            <button
              type="button"
              onClick={() => onResponder('errei')}
              className="py-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-bold flex items-center justify-center gap-2 hover:bg-rose-500/20 transition-colors cursor-pointer"
            >
              <XCircle className="w-4 h-4" />
              Não sabia
            </button>
          </div>
        )}

        {onProximo && (
          <button
            type="button"
            onClick={onProximo}
            className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center gap-2 font-bold text-sm text-on-surface hover:bg-white/10 transition-colors cursor-pointer"
          >
            <RefreshCcw className="w-4 h-4 text-error" />
            Próximo enigma
          </button>
        )}
      </div>
    </motion.article>
  );
}
