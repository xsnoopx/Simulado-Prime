'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, Laugh, RefreshCcw, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { BottomNav } from '@/components/BottomNav';

import { STATIC_CHARADAS } from '@/lib/charadas-data';

export default function CharadasOfflinePage() {
  const [index, setIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  useEffect(() => {
    setIndex(Math.floor(Math.random() * STATIC_CHARADAS.length));
  }, []);

  const charada = STATIC_CHARADAS[index];

  const next = () => {
    let nextIndex;
    do {
      nextIndex = Math.floor(Math.random() * STATIC_CHARADAS.length);
    } while (nextIndex === index && STATIC_CHARADAS.length > 1);
    
    setIndex(nextIndex);
    setShowAnswer(false);
  };

  return (
    <div className="relative h-screen flex flex-col overflow-hidden">
      <div className="starfield" />
      <main className="flex-1 overflow-y-auto pt-12 px-6 max-w-xl mx-auto w-full pb-32">
        <header className="mb-12 flex items-center justify-between">
          <Link href="/">
            <motion.button whileHover={{ scale: 1.1, x: -2 }} className="p-2 glass-panel rounded-full text-on-surface-variant">
              <ChevronLeft className="w-5 h-5" />
            </motion.button>
          </Link>
          <div className="text-center flex-1">
            <h1 className="text-2xl font-display font-bold uppercase tracking-widest text-secondary">Charadas Offline</h1>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-[0.3em] mt-1">Sempre com você</p>
          </div>
          <div className="w-9" />
        </header>

        <div className="glass-panel p-8 rounded-3xl space-y-6 border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-secondary" />
          {charada.categoria && (
            <div className="flex items-center gap-2 mb-4">
               <span className="px-3 py-1 bg-secondary/10 rounded-full text-[10px] font-bold text-secondary">{charada.categoria}</span>
            </div>
          )}
          <h2 className="text-xl font-display font-bold leading-relaxed">{charada.pergunta}</h2>
          
          <button 
            onClick={() => setShowAnswer(!showAnswer)}
            className={cn(
              "w-full py-4 rounded-2xl font-display font-bold transition-all mt-6",
              showAnswer ? "bg-white/10 text-white" : "bg-secondary text-white"
            )}
          >
            {showAnswer ? <><EyeOff className="inline mr-2 w-5 h-5"/>Ocultar Resposta</> : <><Eye className="inline mr-2 w-5 h-5"/>Revelar Resposta</>}
          </button>

          {showAnswer && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 bg-secondary/10 rounded-2xl text-center border border-secondary/20 transition-all">
              <p className="text-2xl font-display font-bold text-on-surface">{charada.resposta}</p>
            </motion.div>
          )}

          <button onClick={next} className="w-full py-4 mt-4 glass-panel border border-white/5 rounded-2xl flex items-center justify-center gap-2 font-bold text-on-surface">
            <RefreshCcw className="w-5 h-5 text-secondary" />
            Outra Charada
          </button>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
