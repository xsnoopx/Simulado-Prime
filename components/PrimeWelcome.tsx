'use client';

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  Brain,
  Camera,
  Check,
  Crown,
  Flame,
  Shield,
  Sparkles,
  Timer,
  X,
} from 'lucide-react';
import { lerPremiumLocal } from '@/lib/avatarAccess';

/**
 * Aviso exibido uma única vez quando a conta passa a ser PRIME.
 *
 * Ele mostra o que foi liberado e resume tudo o que o PRIME oferece hoje.
 * A confirmação vem da mesma fonte usada pelo restante do app
 * (`user_profile` / `cosmos_logged_user`), atualizada pelo pagamento ou pelo
 * painel administrativo.
 */

const BENEFICIOS = [
  {
    icon: Timer,
    titulo: 'Modo Desafio',
    descricao: 'Responda com tempo limite e teste sua velocidade.',
  },
  {
    icon: Shield,
    titulo: 'Modo Sobrevivência',
    descricao: 'Você tem vidas limitadas: vá o mais longe que conseguir.',
  },
  {
    icon: Sparkles,
    titulo: 'Charadas online com IA',
    descricao: 'Categorias premium criadas pela inteligência artificial.',
  },
  {
    icon: Brain,
    titulo: 'Enigmas online com IA',
    descricao: 'Mistérios e desafios de lógica gerados na hora.',
  },
  {
    icon: Camera,
    titulo: 'Avatar Personalizado',
    descricao: 'Envie sua própria foto para usar no perfil.',
  },
  {
    icon: Crown,
    titulo: 'Itens premium',
    descricao: '50 avatares e 50 molduras exclusivas para o seu perfil.',
  },
];

function chaveDoAvisoVisto(): string {
  if (typeof window === 'undefined') return 'cosmos_prime_welcome_seen_v1_local';
  try {
    const logado = JSON.parse(localStorage.getItem('cosmos_logged_user') || '{}');
    const conta = logado?.id || logado?.email;
    return `cosmos_prime_welcome_seen_v1_${conta || 'local'}`;
  } catch {
    return 'cosmos_prime_welcome_seen_v1_local';
  }
}

export function PrimeWelcome() {
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const verificar = () => {
      if (localStorage.getItem(chaveDoAvisoVisto()) === 'true') return;
      if (lerPremiumLocal()) setAberto(true);
    };

    verificar();

    // Admin libera PRIME durante a sessão, pagamento futuro confirma ou outra
    // aba atualiza o armazenamento local.
    const aoAtivar = () => verificar();
    window.addEventListener('supabase-data-synced', aoAtivar);
    window.addEventListener('storage', aoAtivar);
    window.addEventListener('prime-activated', aoAtivar);

    return () => {
      window.removeEventListener('supabase-data-synced', aoAtivar);
      window.removeEventListener('storage', aoAtivar);
      window.removeEventListener('prime-activated', aoAtivar);
    };
  }, []);

  const fechar = () => {
    try {
      localStorage.setItem(chaveDoAvisoVisto(), 'true');
    } catch {
      // Sem armazenamento disponível: apenas fecha o aviso.
    }
    setAberto(false);
  };

  if (!aberto) return null;

  return (
    <motion.div
      key="prime-welcome"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[100000] flex items-center justify-center p-4 sm:p-6"
    >
      <div
        onClick={fechar}
        className="absolute inset-0 bg-[#04030a]/90 backdrop-blur-md"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 24, stiffness: 320 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="prime-welcome-title"
        className="relative z-10 w-full max-w-lg max-h-[88dvh] overflow-y-auto rounded-[32px] border border-amber-400/30 bg-[#0d0c18] shadow-[0_0_60px_rgba(245,158,11,0.18)]"
      >
            <div className="h-1.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500" />

            <div className="p-6 sm:p-8 space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 shadow-lg shadow-amber-500/20">
                    <Crown className="h-8 w-8 text-black" />
                  </div>
                  <div className="text-left">
                    <p className="text-[0.625rem] font-black uppercase tracking-[0.28em] text-amber-300">
                      Assinatura confirmada
                    </p>
                    <h2
                      id="prime-welcome-title"
                      className="font-display text-2xl font-black tracking-wide text-amber-300"
                    >
                      COSMOS PRIME ATIVADO
                    </h2>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={fechar}
                  aria-label="Fechar aviso do PRIME"
                  className="rounded-full bg-white/5 p-2 text-white/50 transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <p className="text-left text-sm leading-relaxed text-white/75">
                Sua conta agora é PRIME. Estes recursos foram liberados:
              </p>

              <div className="space-y-2.5">
                {BENEFICIOS.map((beneficio) => (
                  <motion.div
                    key={beneficio.titulo}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 text-left"
                  >
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-300">
                      <beneficio.icon className="h-4.5 w-4.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <Check className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                        <h3 className="text-xs font-black uppercase tracking-wider text-white">
                          {beneficio.titulo}
                        </h3>
                      </div>
                      <p className="mt-0.5 text-[0.75rem] leading-relaxed text-white/60">
                        {beneficio.descricao}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="flex items-center gap-2 rounded-2xl border border-amber-400/20 bg-amber-500/10 p-3 text-left">
                <Flame className="h-4 w-4 shrink-0 text-amber-300" />
                <p className="text-[0.6875rem] leading-relaxed text-amber-100/80">
                  Aproveite tudo agora. Você pode rever seu status e seus itens
                  premium na página de perfil.
                </p>
              </div>

              <button
                type="button"
                onClick={fechar}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-300 py-4 font-display text-sm font-black uppercase tracking-widest text-black transition-all hover:brightness-105 active:scale-[0.98] cursor-pointer"
              >
                Começar a explorar
                <Sparkles className="h-4.5 w-4.5" />
              </button>
            </div>
          </motion.div>
    </motion.div>
  );
}
