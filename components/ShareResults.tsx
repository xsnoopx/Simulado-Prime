'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Share2, Check, Copy, Sparkles, X, Trophy, Download, Loader2 } from 'lucide-react';
import * as htmlToImage from 'html-to-image';

interface ShareResultsProps {
  totalCovered: number;
  correctCount: number;
  incorrectCount: number;
  accuracy: number;
  categoryName?: string;
  themeColor?: 'blue' | 'amber' | 'emerald' | 'indigo' | 'cyan' | 'purple';
  textTrigger?: string;
}

export function ShareResults({
  totalCovered,
  correctCount,
  incorrectCount,
  accuracy,
  categoryName = 'Progresso Geral',
  themeColor = 'blue',
  textTrigger = 'Compartilhar Desempenho 🚀'
}: ShareResultsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const cardRef = useRef<HTMLDivElement>(null);

  const appUrl = (typeof window !== 'undefined' ? window.location.origin : 'https://ais-pre-6qlnh5xu3uw7anuvtfvyaf-457178958823.us-east1.run.app');

  const shareText = `🌌 MEU PROGRESSO CÓSMICO NO COSMOS!
  
🎯 Acabei de fazer o simulado de *${categoryName}*:
📈 Aproveitamento Geral: *${accuracy}%*
✅ Acertos: *${correctCount}* de *${totalCovered}* questões resolvidas!

🚀 Estude comigo de forma inteligente e interativa no Cosmos!
Acesse agora: ${appUrl}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopiedText(true);
      setStatusMessage('Texto copiado com sucesso! 📋');
      setTimeout(() => {
        setCopiedText(false);
        setStatusMessage('');
      }, 2000);
    } catch (err) {
      console.warn("Erro ao copiar texto:", err);
    }
  };

  const handleDownloadImage = async () => {
    const cardElement = cardRef.current;
    if (!cardElement) return;

    setIsDownloading(true);
    setStatusMessage('Gerando imagem de alta resolução... 🌌');
    try {
      // Small timeout to allow potential layout adjustment or animations to finish
      await new Promise((res) => setTimeout(res, 150));

      const blob = await htmlToImage.toBlob(cardElement, {
        cacheBust: true,
        pixelRatio: 2.5,
        backgroundColor: '#0a091c',
      });

      if (!blob) throw new Error("Não foi possível renderizar o card");

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cosmos-${categoryName.toLowerCase().replace(/\s+/g, '-')}-desempenho.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setStatusMessage('Imagem salva na sua galeria! 📸');
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (err) {
      console.warn("Erro ao gerar imagem:", err);
      setStatusMessage('Falha ao gerar imagem ❌');
      setTimeout(() => setStatusMessage(''), 3000);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleNativeShare = async () => {
    const cardElement = cardRef.current;
    if (!cardElement) return;

    setIsSharing(true);
    setStatusMessage('Preparando card e links cósmicos... 🚀');
    try {
      await new Promise((res) => setTimeout(res, 150));

      const blob = await htmlToImage.toBlob(cardElement, {
        cacheBust: true,
        pixelRatio: 2.5,
        backgroundColor: '#0a091c',
      });

      if (!blob) throw new Error("Falha ao gerar blob");

      const file = new File([blob], 'desempenho-cosmos.png', { type: 'image/png' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Meu Desempenho no Cosmos',
          text: shareText,
        });
        setStatusMessage('Compartilhado com sucesso! 🎉');
      } else {
        // Fallback: download card and copy text automatically
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'desempenho-cosmos.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        await navigator.clipboard.writeText(shareText);
        setCopiedText(true);
        setTimeout(() => setCopiedText(false), 2000);

        setStatusMessage('Card baixado e texto copiado! 🌌');
      }
      setTimeout(() => setStatusMessage(''), 4000);
    } catch (err) {
      console.log('Erro ou cancelamento no compartilhamento:', err);
      // Fallback to plain text sharing
      try {
        if (navigator.share) {
          await navigator.share({
            title: 'Meu Desempenho no Cosmos',
            text: shareText,
            url: appUrl,
          });
          setStatusMessage('Compartilhado com sucesso! 💫');
        } else {
          await navigator.clipboard.writeText(shareText);
          setCopiedText(true);
          setTimeout(() => setCopiedText(false), 2000);
          setStatusMessage('Texto copiado! Link do app: ' + appUrl);
        }
      } catch (innerErr) {
        setStatusMessage('Erro ao compartilhar ❌');
      }
      setTimeout(() => setStatusMessage(''), 4000);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <>
      {/* Botão de Compartilhar */}
      <button
        onClick={() => setIsOpen(true)}
        className="w-full py-3.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-2xl font-display font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
        id="btn_open_share_card"
      >
        <Share2 className="w-4 h-4 text-primary" />
        {textTrigger}
      </button>

      {/* Modal de Compartilhamento */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop Blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-[#04030a]/80 backdrop-blur-md"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              className="relative z-10 w-full max-w-sm"
            >
              <div className="glass-panel p-6 rounded-[2.5rem] border border-white/10 bg-gradient-to-b from-[#12102e] via-[#0d0b21] to-[#04030a] shadow-2xl space-y-6 overflow-hidden">
                
                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="absolute top-5 right-5 p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Header */}
                <div className="text-center space-y-1">
                  <div className="inline-flex p-2 rounded-full bg-primary/10 border border-primary/20 mb-2">
                    <Trophy className="w-5 h-5 text-amber-400" />
                  </div>
                  <h3 className="font-display font-black text-sm uppercase tracking-widest text-white">
                    Compartilhar Desempenho
                  </h3>
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">
                    Mostre aos seus amigos seu progresso orbital
                  </p>
                </div>

                {/* THE VISUAL CARD */}
                <div 
                  ref={cardRef}
                  className="relative p-5 rounded-3xl border border-white/10 bg-gradient-to-br from-[#1b193d] to-[#0a091c] shadow-inner text-center overflow-hidden"
                >
                  {/* Space Glow Orbs */}
                  <div className="absolute top-[-20%] left-[-20%] w-32 h-32 bg-primary/20 blur-2xl rounded-full -z-10" />
                  <div className="absolute bottom-[-10%] right-[-10%] w-32 h-32 bg-indigo-500/20 blur-2xl rounded-full -z-10" />

                  {/* Badges */}
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[7px] font-black uppercase tracking-widest text-[#a5b4fc] bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-full">
                      🚀 {categoryName}
                    </span>
                    <span className="text-[7.5px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" /> Cosmos
                    </span>
                  </div>

                  {/* Main Metric Orbit Circle */}
                  <div className="relative w-28 h-28 mx-auto mb-4 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90 origin-center">
                      <circle
                        cx="56"
                        cy="56"
                        r="44"
                        className="stroke-white/5 fill-transparent"
                        strokeWidth="6"
                      />
                      <motion.circle
                        cx="56"
                        cy="56"
                        r="44"
                        className="stroke-amber-400 fill-transparent"
                        strokeWidth="6"
                        strokeDasharray={276}
                        initial={{ strokeDashoffset: 276 }}
                        animate={{ strokeDashoffset: 276 - (276 * (accuracy / 100)) }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="font-display text-2xl font-extrabold text-white">
                        {accuracy}%
                      </span>
                      <span className="text-[7.5px] tracking-wider text-white/50 uppercase font-black">
                        Acertos
                      </span>
                    </div>
                  </div>

                  {/* Card Title */}
                  <h4 className="font-display text-xs font-black text-purple-300 uppercase tracking-widest mb-3">
                    {accuracy >= 80 ? '🌌 Aproveitamento Celestial!' :
                     accuracy >= 60 ? '🚀 Rumo ao Topo!' :
                     '💫 Evolução Contínua!'}
                  </h4>

                  {/* Secondary Metrics Row */}
                  <div className="grid grid-cols-3 gap-1.5 pt-3 border-t border-white/5">
                    <div className="p-1 px-1.5 bg-white/5 rounded-lg border border-white/5">
                      <span className="text-[6.5px] uppercase font-bold text-white/40 block">Feitas</span>
                      <p className="text-sm font-display font-extrabold text-white">{totalCovered}</p>
                    </div>
                    <div className="p-1 px-1.5 bg-green-500/5 rounded-lg border border-green-500/10">
                      <span className="text-[6.5px] uppercase font-bold text-green-400 block">Acertos</span>
                      <p className="text-sm font-display font-extrabold text-green-400">{correctCount}</p>
                    </div>
                    <div className="p-1 px-1.5 bg-red-500/5 rounded-lg border border-red-500/10">
                      <span className="text-[6.5px] uppercase font-bold text-red-400 block">Erros</span>
                      <p className="text-sm font-display font-extrabold text-red-400">{incorrectCount}</p>
                    </div>
                  </div>
                </div>

                {/* Status Message Display */}
                {statusMessage && (
                  <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 text-center text-[10px] uppercase tracking-wider text-[#a5b4fc] font-bold rounded-xl animate-pulse">
                    {statusMessage}
                  </div>
                )}

                {/* Share Actions Grid */}
                <div className="space-y-2">
                  <button
                    onClick={handleNativeShare}
                    disabled={isSharing || isDownloading}
                    className="w-full py-3.5 bg-primary hover:bg-primary-dark disabled:bg-primary/50 disabled:cursor-not-allowed rounded-xl text-white font-display font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                    id="btn_trigger_native_share"
                  >
                    {isSharing ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <Share2 className="w-4 h-4 text-white animate-bounce-subtle" />
                    )}
                    Compartilhar Card Completo
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleDownloadImage}
                      disabled={isSharing || isDownloading}
                      className="py-3 bg-white/5 hover:bg-white/10 disabled:bg-white/2 disabled:opacity-50 rounded-xl text-white border border-white/10 font-display font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
                      id="btn_download_card_image"
                    >
                      {isDownloading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                      ) : (
                        <Download className="w-3.5 h-3.5 text-amber-400" />
                      )}
                      Salvar Imagem
                    </button>

                    <button
                      onClick={handleCopy}
                      className="py-3 bg-white/5 hover:bg-white/10 rounded-xl text-white border border-white/10 font-display font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
                      id="btn_copy_formatted_stats"
                    >
                      {copiedText ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-[#a5b4fc]" />
                          Copiar Texto
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
