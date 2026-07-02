'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Crown, 
  Sparkles, 
  Check, 
  Lock, 
  CreditCard, 
  ChevronRight, 
  X, 
  Flame, 
  Clock, 
  Copy, 
  Barcode, 
  ShieldCheck, 
  Compass,
  Smile,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { QRCodeSVG } from 'qrcode.react';

const PIX_CODE = '00020126760014br.gov.bcb.pix0136043f2823-30d5-4a96-9d1b-ca6772aa9a5c0214Simulado Prime52040000530398654042.005802BR5925KLESSION DE CARVALHO BEZE6010Jaguariuna6211050726f78806304166F';

// Core subscription keys for robust syncing
const USER_PROFILE_KEY = 'user_profile';
const LOGGED_USER_KEY = 'cosmos_logged_user';

interface PremiumGatewayProps {
  onSuccess?: () => void;
  title?: string;
  onClose?: () => void;
}

export function PremiumGateway({ onSuccess, title = "COSMOS PRIME", onClose }: PremiumGatewayProps) {
  const [step, setStep] = useState<'benefits' | 'checkout' | 'processing' | 'success'>('benefits');
  const [payMethod, setPayMethod] = useState<'pix' | 'card'>('pix');
  const [copiedPix, setCopiedPix] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [loadingText, setLoadingText] = useState('Processando transação segura...');

  // simulated payment flow
  const handleSimulatePayment = () => {
    setStep('processing');
    
    setTimeout(() => {
      setLoadingText('Comunicação criptografada estabelecida...');
    }, 1000);

    setTimeout(() => {
      setLoadingText('Ativando chaves do Cosmos Prime no seu perfil...');
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

  const copyPixCode = () => {
    navigator.clipboard.writeText(PIX_CODE);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2000);
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

              {/* Price and Action */}
              <div className="pt-4 border-t border-white/10 space-y-4">
                <div className="text-center flex flex-col items-center justify-center bg-gradient-to-b from-amber-500/20 via-amber-500/5 to-black/30 p-8 rounded-3xl border border-amber-400/30 shadow-[0_0_30px_rgba(245,158,11,0.12)] relative overflow-hidden group">
                  {/* Cosmic light shines/aurora in the background */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 bg-gradient-to-b from-amber-400/20 to-transparent blur-2xl rounded-full pointer-events-none"></div>
                  
                  <div className="space-y-3 relative z-10">
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/20 text-xs uppercase tracking-[0.18em] text-amber-300 font-black animate-pulse">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      Assinatura Vitalícia
                      <Sparkles className="w-4 h-4 text-amber-400" />
                    </span>
                    
                    <div className="py-2">
                      <span className="font-mono font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-100 via-amber-400 to-orange-500 text-5xl md:text-6xl tracking-tighter block select-none drop-shadow-[0_4px_12px_rgba(245,158,11,0.3)]">{"R$14,90"}</span>
                    </div>

                    <span className="text-[13px] text-white/95 font-semibold block tracking-wide">
                      Sem mensalidades, pague apenas uma única vez
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setStep('checkout')}
                  className="w-full py-4.5 rounded-2xl gradient-amber text-black font-display font-black tracking-widest text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-amber-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                >
                  LIBERAR ACESSO VITALÍCIO AGORA
                  <ChevronRight className="w-5 h-5 stroke-[2.5]" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 2: CHECKOUT DIALOG */}
        {step === 'checkout' && (
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
                  <span className="font-display font-black text-sm uppercase tracking-widest text-[#eeeeee]">Pagamento Seguro</span>
                </div>
                <button 
                  onClick={() => setStep('benefits')}
                  className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Toggle Method */}
              <div className="grid grid-cols-2 gap-3 bg-white/5 p-1.5 rounded-2xl border border-white/10">
                <button
                  onClick={() => setPayMethod('pix')}
                  className={cn(
                    "py-3.5 rounded-xl font-display font-black text-xs tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer",
                    payMethod === 'pix' ? "bg-amber-400 text-black shadow-lg" : "text-white/60 hover:text-white"
                  )}
                >
                  <Barcode className="w-5 h-5" />
                  PIX INSTANTÂNEO
                </button>
                <button
                  onClick={() => setPayMethod('card')}
                  className={cn(
                    "py-3.5 rounded-xl font-display font-black text-xs tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer",
                    payMethod === 'card' ? "bg-amber-400 text-black shadow-lg" : "text-white/60 hover:text-white"
                  )}
                >
                  <CreditCard className="w-5 h-5" />
                  CARTÃO DE CRÉDITO
                </button>
              </div>

              {/* Payment Details Container */}
              <div className="min-h-[220px]">
                {payMethod === 'pix' ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-5 text-center"
                  >
                    <div className="mx-auto w-36 h-36 bg-white p-3 rounded-3xl flex items-center justify-center shadow-lg">
                      {/* Real dynamic QR Code generated from the PIX key */}
                      <QRCodeSVG value={PIX_CODE} size={120} level="M" />
                    </div>
 
                    <p className="text-sm font-semibold text-white/85 leading-relaxed max-w-sm mx-auto">
                      Escaneie o QR Code acima ou copie a Chave Pix abaixo. O sistema identificará o recebimento de forma instantânea.
                    </p>
 
                    <div className="flex gap-2 items-center bg-white/5 p-2.5 rounded-2xl border border-white/10 max-w-md mx-auto">
                      <span className="text-xs font-mono text-center text-white/70 truncate flex-1 block select-all px-2 font-bold" title={PIX_CODE}>
                        {PIX_CODE}
                      </span>
                      <button
                        onClick={copyPixCode}
                        className={cn(
                          "px-4 py-2 rounded-xl font-display text-xs font-black uppercase transition-all shrink-0 cursor-pointer flex items-center gap-1.5 shadow-sm",
                          copiedPix ? "bg-emerald-500 text-white" : "bg-white/15 text-white hover:bg-white/20 hover:scale-105 active:scale-95"
                        )}
                      >
                        <Copy className="w-3.5 h-3.5" />
                        {copiedPix ? 'Copiado!' : 'Copiar'}
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4 text-left max-w-sm mx-auto"
                  >
                    <div className="space-y-1.5">
                      <label className="text-xs uppercase tracking-widest text-amber-200/90 font-black">Número do Cartão</label>
                      <input 
                        type="text" 
                        placeholder="4444 5555 6666 7777"
                        maxLength={19}
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="w-full bg-white/10 border border-white/15 rounded-xl px-4 py-3.5 text-sm placeholder:text-white/40 focus:border-amber-400 focus:bg-white/[0.12] outline-none text-white font-mono tracking-widest font-bold"
                      />
                    </div>
 
                    <div className="space-y-1.5">
                      <label className="text-xs uppercase tracking-widest text-amber-200/90 font-black">Nome Impresso no Cartão</label>
                      <input 
                        type="text" 
                        placeholder="TITULAR DA CONTA"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value.toUpperCase())}
                        className="w-full bg-white/10 border border-white/15 rounded-xl px-4 py-3.5 text-sm placeholder:text-white/40 focus:border-amber-400 focus:bg-white/[0.12] outline-none text-white uppercase tracking-wider font-bold"
                      />
                    </div>
 
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs uppercase tracking-widest text-amber-200/90 font-black">Validade</label>
                        <input 
                          type="text" 
                          placeholder="MM/AA"
                          maxLength={5}
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          className="w-full bg-white/10 border border-white/15 rounded-xl px-4 py-3.5 text-sm placeholder:text-white/40 focus:border-amber-400 focus:bg-white/[0.12] outline-none text-white text-center font-mono font-bold"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs uppercase tracking-widest text-amber-200/90 font-black">CVC / CVV</label>
                        <input 
                          type="password" 
                          placeholder="123"
                          maxLength={4}
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          className="w-full bg-white/10 border border-white/15 rounded-xl px-4 py-3.5 text-sm placeholder:text-white/40 focus:border-amber-400 focus:bg-white/[0.12] outline-none text-white text-center font-mono font-bold"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
 
              {/* Secure Footer */}
              <div className="pt-4 border-t border-white/10 space-y-4">
                <button
                  onClick={handleSimulatePayment}
                  className="w-full py-4.5 rounded-2xl bg-amber-400 text-black font-display font-black tracking-widest text-sm flex items-center justify-center gap-2 hover:bg-amber-300 active:scale-95 transition-all cursor-pointer shadow-lg shadow-amber-500/10"
                >
                  CONFIRMAR PAGAMENTO &rarr;
                </button>
 
                <div className="flex items-center justify-center gap-1.5 text-white/50 text-[11px] uppercase tracking-widest font-black leading-none">
                  <ShieldCheck className="w-4 h-4 text-amber-500" />
                  Ambiente blindado e criptografado SSL 256 bits
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 3: PROCESSING PANEL */}
        {step === 'processing' && (
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
                <p className="font-display font-black text-sm uppercase tracking-[0.25em] text-amber-300 animate-pulse">AGUARDANDO CONFIRMAÇÃO</p>
                <p className="text-sm text-white/90 font-extrabold font-sans leading-relaxed min-h-[44px] px-2">
                  {loadingText}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 4: SUCCESS! */}
        {step === 'success' && (
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
                <h3 className="text-3xl font-display font-black uppercase tracking-widest text-emerald-400">COSMOS PRIME LIBERADO!</h3>
                <p className="text-xs text-emerald-200 uppercase tracking-[0.3em] font-black">Sua inscrição foi confirmada com sucesso</p>
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
                <div className="flex items-center gap-3 pt-2 border-t border-white/5">
                  <span className="text-xs font-mono text-emerald-300/90 font-black uppercase block tracking-widest">Código: TR-COSMOS-PRIME777</span>
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
