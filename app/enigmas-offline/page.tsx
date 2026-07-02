'use client';

import { useState, useEffect, Suspense } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, Ghost, RefreshCcw, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { BottomNav } from '@/components/BottomNav';
import { STATIC_ENIGMAS } from '@/lib/enigmas-data';

function EnigmasContent() {
  const searchParams = useSearchParams();
  const difficultyParam = searchParams.get('difficulty');
  
  const [index, setIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  
  const filteredEnigmas = STATIC_ENIGMAS.filter(e => {
    if (difficultyParam === 'simples') return e.dificuldade === 'Simples';
    if (difficultyParam === 'complexos') return e.dificuldade === 'Complexo';
    return true;
  });

  const enigma = filteredEnigmas[index] || STATIC_ENIGMAS[0];

  const next = () => {
    let nextIndex;
    do {
      nextIndex = Math.floor(Math.random() * filteredEnigmas.length);
    } while (nextIndex === index && filteredEnigmas.length > 1);
    
    setIndex(nextIndex);
    setShowAnswer(false);
  };

  useEffect(() => {
    if (filteredEnigmas.length > 0) {
      setIndex(Math.floor(Math.random() * filteredEnigmas.length));
    }
  }, [difficultyParam]);

  return (
    <>
      <header className="mb-12 flex items-center justify-between">
        <Link href="/">
          <motion.button whileHover={{ scale: 1.1, x: -2 }} className="p-2 glass-panel rounded-full text-on-surface-variant">
            <ChevronLeft className="w-5 h-5" />
          </motion.button>
        </Link>
        <div className="text-center flex-1">
          <h1 className="text-2xl font-display font-bold tracking-widest text-error">
            Enigmas {difficultyParam === 'simples' ? 'SIMPLES' : difficultyParam === 'complexos' ? 'COMPLEXOS' : 'Offline'}
          </h1>
          <p className="text-[10px] text-on-surface-variant uppercase tracking-[0.3em] mt-1">Lógica em qualquer lugar</p>
        </div>
        <div className="w-9" />
      </header>

      <div className="glass-panel p-8 rounded-3xl space-y-6 border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-error" />
        <div className="flex items-center gap-2 mb-4">
           <span className="px-3 py-1 bg-error/10 rounded-full text-[10px] font-bold text-error">{enigma.dificuldade}</span>
        </div>
        <h2 className="text-xl font-display font-bold leading-relaxed">{enigma.titulo}</h2>
        <p className="text-on-surface-variant italic">"{enigma.enigma}"</p>
        
        <button 
          onClick={() => setShowAnswer(!showAnswer)}
          className={cn(
            "w-full py-4 rounded-2xl font-display font-bold transition-all mt-6",
            showAnswer ? "bg-white/10 text-white" : "bg-error text-white"
          )}
        >
          {showAnswer ? <><EyeOff className="inline mr-2 w-5 h-5"/>Esconder Solução</> : <><Eye className="inline mr-2 w-5 h-5"/>Ver Solução</>}
        </button>

        {showAnswer && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 bg-error/10 rounded-2xl text-center border border-error/20 transition-all">
            <p className="text-2xl font-display font-bold text-on-surface">{enigma.resposta}</p>
          </motion.div>
        )}

        <button onClick={next} className="w-full py-4 mt-4 glass-panel border border-white/5 rounded-2xl flex items-center justify-center gap-2 font-bold text-on-surface">
          <RefreshCcw className="w-5 h-5 text-error" />
          Próximo Enigma
        </button>
      </div>
    </>
  );
}

export default function EnigmasOfflinePage() {
  return (
    <div className="relative h-screen flex flex-col overflow-hidden">
      <div className="starfield" />
      <main className="flex-1 overflow-y-auto pt-12 px-6 max-w-xl mx-auto w-full pb-32">
        <Suspense fallback={<div className="text-center text-on-surface-variant pt-20">Carregando enigmas...</div>}>
          <EnigmasContent />
        </Suspense>
      </main>
      <BottomNav />
    </div>
  );
}
