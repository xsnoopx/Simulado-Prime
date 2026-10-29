'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Crown, 
  Sparkles, 
  Check, 
  X, 
  Flame, 
  Smile,
  Lock
} from 'lucide-react';

// Core subscription keys for robust syncing
const USER_PROFILE_KEY = 'user_profile';
const LOGGED_USER_KEY = 'cosmos_logged_user';

// O PRIME só será liberado depois da confirmação do pagamento. Enquanto o
// checkout real não existir, esta constante mantém a ativação de demonstração
// fora do ar: o botão fica desabilitado e os passos de checkout/processamento
// não são renderizados. Quando a cobrança entrar, substitua o fluxo abaixo.
const PAYMENT_ENABLED = false;

interface PremiumGatewayProps {
  onSuccess?: () => void;
  title?: string;
  onClose?: () => void;
}

export function PremiumGateway({ onSuccess, title = "COSMOS PRIME", onClose }: PremiumGatewayProps) {
  const [step, setStep] = useState<'benefits' | 'checkout' | 'processing' | 'success'>('benefits');
  const [loadingText, setLoadingText] = useState('Ativando modo demonstração...');

  // This is a local demonstration only: nothing is charged and no payment data is
  // collected. The flag lives in localStorage and can be cleared by the user.
  const handleSimulatePayment = () => {
    setStep('processing');
    
    setTimeout(() => {
      setLoadingText('Nenhum pagamento será processado nesta demonstração...');
    }, 1000);

    setTimeout(() => {
      setLoadingText('Gravando a ativação local no seu navegador...');
    }, 2200);

    setTimeout(() => {
      // 1. Update user_profile in localStorage
      const profileStr = localStorage.getItem(USER_PROFILE_KEY);
      let pObj = { isPremium: true };
      if (profileStr) {
        try {
          pObj = { ...JSON.parse(profileStr), isPremium: true };
        } catch (_) {}
      }
      localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(pObj));

      // 2. Update cosmos_logged_user in localStorage
      const loggedStr = localStorage.getItem(LOGGED_USER_KEY);
      if (loggedStr) {
        try {
          const lObj = { ...JSON.parse(loggedStr), isPremium: true };
          localStorage.setItem(LOGGED_USER_KEY, JSON.stringify(lObj));
        } catch (_) {}
      }

      setStep('success');
    }, 3500);
  };

  const finishAndReload = () => {
    if (onSuccess) {
      onSuccess();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-4" id="premium_gateway_container">
      <AnimatePresence mode="wait">
        
        {/* STEP 1: BENEFITS PANEL */}
        {step === 'benefits' && (
          <motion.div
            key="benefits"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="w-full max-w-lg glass-panel rounded-3xl border border-amber-500/30 overflow-hidden shadow-[0_0_50px_rgba(245,158,11,0.15)] relative"
          >
            {/* Ambient Background Glows */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-amber-500/10 blur-[60px] rounded-full pointer-events-none -z-10" />
            <div className="absolute bottom-0 right-10 w-32 h-32 bg-primary/5 blur-[50px] rounded-full pointer-events-none -z-10" />

            {/* Glowing gold topper bar */}
            <div className="h-1.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 animate-pulse" />

            <div className="p-8 space-y-6">
              {/* Header */}
              <div className="text-center space-y-2 relative">
                {onClose && (
                  <button 
                    onClick={onClose}
                    className="absolute right-0 top-0 p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
                
                <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center shadow-lg shadow-amber-500/20 animate-bounce">
                  <Crown className="w-10 h-10 text-black" />
                </div>
                
                <h2 className="text-3xl font-display font-black tracking-widest text-amber-400 drop-shadow-[0_0_12px_rgba(245,158,11,0.4)]">
                  {title}
                </h2>
                <p className="text-xs text-on-surface-variant uppercase tracking-[0.45em] font-black text-amber-200/90">
                  Eleve seu aprendizado ao infinito
                </p>
              </div>

              {/* Benefits list */}
              <div className="space-y-4 pt-2">
                <div className="flex gap-4 p-4 bg-white/[0.04] border border-white/10 rounded-2xl hover:border-amber-500/30 transition-colors">
                  <div className="p-3 h-fit rounded-xl bg-amber-500/15 text-amber-400 mt-0.5">
                    <Sparkles className="w-6 h-6 animate-pulse" />
                  </div>
                  <div className="space-y-1 select-none">
                    <h4 className="font-display font-black text-sm tracking-wide uppercase text-amber-100">
                      Charadas Online Sem Limites
                    </h4>
                    <p className="text-[13px] text-white/80 font-medium leading-relaxed">
                      Livre-se de restrições de uso. Deixe nossa IA avançada criar piadas e trocadilhos gerados em tempo real exclusivos.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 bg-white/[0.04] border border-white/10 rounded-2xl hover:border-red-500/30 transition-colors">
                  <div className="p-3 h-fit rounded-xl bg-red-500/15 text-red-400 mt-0.5">
                    <Flame className="w-6 h-6 animate-pulse" />
                  </div>
                  <div className="space-y-1 select-none">
                    <h4 className="font-display font-black text-sm tracking-wide uppercase text-red-200">
                      Enigmas Online por Inteligência Artificial
                    </h4>
                    <p className="text-[13px] text-white/80 font-medium leading-relaxed">
                      Gerador contínuo de mistérios quânticos, lógica dedutiva e cenários complexos com respostas inteligentes validadas pela IA.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 bg-white/[0.04] border border-white/10 rounded-2xl hover:border-purple-500/30 transition-colors">
                  <div className="p-3 h-fit rounded-xl bg-purple-500/15 text-purple-400 mt-0.5">
                    <Crown className="w-6 h-6 animate-pulse" />
                  </div>
                  <div className="space-y-1 select-none">
                    <h4 className="font-display font-black text-sm tracking-wide uppercase text-purple-200">
                      +50 Molduras & +50 Avatares Exclusivos
                    </h4>
                    <p className="text-[13px] text-white/80 font-medium leading-relaxed">
                      Acesso instantâneo a todas as 50 novas molduras premium e 50 avatares espaciais ultra-exclusivos para personalizar seu perfil.
                    </p>
                  </div>
                </div>
              </div>

              {/* PRIME bloqueado: liberação somente após o pagamento */}
              <div className="pt-4 border-t border-white/10 space-y-4">
                <div className="text-center flex flex-col items-center justify-center bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-black/30 p-6 rounded-3xl border border-amber-400/20 relative overflow-hidden">
                  <div className="space-y-3 relative z-10">
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/20 text-xs uppercase tracking-[0.18em] text-amber-300 font-black">
                      <Lock className="w-4 h-4 text-amber-400" />
                      PRIME bloqueado
                      <Lock className="w-4 h-4 text-amber-400" />
                    </span>

                    <p className="text-[13px] text-white/80 font-semibold leading-relaxed max-w-sm mx-auto">
                      O PRIME será liberado somente após a confirmação do pagamento.
                      A assinatura ainda não está disponível — em breve o acesso
                      será desbloqueado por aqui.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled
                  aria-disabled="true"
                  className="w-full py-4.5 rounded-2xl bg-white/5 border border-white/10 text-white/45 font-display font-black tracking-widest text-sm flex items-center justify-center gap-2.5 cursor-not-allowed select-none"
                >
                  ASSINATURA EM BREVE
                  <Lock className="w-5 h-5 stroke-[2.5]" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 2: ACTIVATION CONFIRMATION (no payment step) */}
        {PAYMENT_ENABLED && step === 'checkout' && (
          <motion.div
            key="checkout"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="w-full max-w-lg glass-panel rounded-3xl border border-white/10 overflow-hidden shadow-2xl relative"
          >
            <div className="h-1.5 bg-gradient-to-r from-amber-500 to-yellow-400" />

            <div className="p-8 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400">
                    <Crown className="w-5 h-5" />
                  </div>
                  <span className="font-display font-black text-sm uppercase tracking-widest text-[#eeeeee]">Ativação de demonstração</span>
                </div>
                <button 
                  onClick={() => setStep('benefits')}
                  className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Demonstration panel: no payment data is requested or stored. */}
              <div className="min-h-[220px] flex items-center justify-center">
                <div className="space-y-4 text-center max-w-sm mx-auto py-6">
                  <div className="mx-auto w-16 h-16 rounded-full bg-amber-400/10 border border-amber-400/20 flex items-center justify-center">
                    <Sparkles className="w-7 h-7 text-amber-400" />
                  </div>
                  <p className="text-sm font-semibold text-white/85 leading-relaxed">
                    Nenhum pagamento será processado e nenhum dado de cartão é solicitado.
                    O botão abaixo apenas marca este navegador como &quot;demonstração premium&quot;
                    no armazenamento local.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-white/10 space-y-4">
                <button
                  onClick={handleSimulatePayment}
                  className="w-full py-4.5 rounded-2xl bg-amber-400 text-black font-display font-black tracking-widest text-sm flex items-center justify-center gap-2 hover:bg-amber-300 active:scale-95 transition-all cursor-pointer shadow-lg shadow-amber-500/10"
                >
                  ATIVAR DEMONSTRAÇÃO &rarr;
                </button>

                <div className="flex items-center justify-center gap-1.5 text-white/50 text-[11px] uppercase tracking-widest font-black leading-none text-center">
                  Ativação local · sem cobrança · sem assinatura
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 3: PROCESSING PANEL */}
        {PAYMENT_ENABLED && step === 'processing' && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="w-full max-w-sm glass-panel p-12 rounded-3xl text-center border border-amber-500/20 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-amber-500/5 animate-pulse" />
            <div className="relative space-y-6">
              <div className="mx-auto w-14 h-14 rounded-full border-t-3 border-r-3 border-amber-400 animate-spin" />
              <div className="space-y-3">
                <p className="font-display font-black text-sm uppercase tracking-[0.25em] text-amber-300 animate-pulse">ATIVANDO DEMONSTRAÇÃO</p>
                <p className="text-sm text-white/90 font-extrabold font-sans leading-relaxed min-h-[44px] px-2">
                  {loadingText}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 4: SUCCESS! */}
        {PAYMENT_ENABLED && step === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg glass-panel rounded-3xl border border-emerald-500/30 overflow-hidden shadow-[0_0_50px_rgba(16,185,129,0.15)] relative text-center"
          >
            {/* Exploding particles simulating confetti and celestial spark */}
            <div className="absolute inset-0 bg-emerald-500/[0.02] pointer-events-none" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-emerald-500/10 blur-[60px] rounded-full pointer-events-none -z-10" />

            {/* Glowing Emerald Ribbon topper */}
            <div className="h-1.5 bg-gradient-to-r from-emerald-500/60 via-emerald-400 to-emerald-500/60" />

            <div className="p-10 space-y-6">
              <div className="mx-auto w-18 h-18 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/20">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  transition={{ duration: 0.5 }}
                >
                  <Crown className="w-10 h-10 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                </motion.div>
              </div>

              <div className="space-y-2">
                <h3 className="text-3xl font-display font-black uppercase tracking-widest text-emerald-400">COSMOS PRIME (DEMO)</h3>
                <p className="text-xs text-emerald-200 uppercase tracking-[0.3em] font-black">Ativação local concluída — nada foi cobrado</p>
              </div>

              <div className="bg-white/[0.03] border border-white/10 p-6 rounded-2xl max-w-sm mx-auto space-y-4 text-left shadow-inner">
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-emerald-400 shrink-0 stroke-[3]" />
                  <span className="text-sm text-white font-black">Acesso ilimitado às Charadas Online (IA)</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-emerald-400 shrink-0 stroke-[3]" />
                  <span className="text-sm text-white font-black">Acesso ilimitado aos Enigmas Online (IA)</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-emerald-400 shrink-0 stroke-[3]" />
                  <span className="text-sm text-white font-black">+50 Molduras & +50 Avatares Exclusivos liberados</span>
                </div>
              </div>

              <button
                onClick={finishAndReload}
                className="w-full max-w-sm mx-auto py-4.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-display font-black tracking-widest text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-500/20 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
              >
                ENTRAR NO UNIVERSO PRIME
                <Smile className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      <style jsx global>{`
        .gradient-amber {
          background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
        }
      `}</style>
    </div>
  );
}
