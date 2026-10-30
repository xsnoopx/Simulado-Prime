'use client';

import { motion, useReducedMotion } from 'motion/react';
import { Rocket } from 'lucide-react';
import { useEffect, useState } from 'react';

interface GalaxyTransitionProps {
  onComplete: () => void;
}

// A transição original criava 100 estrelas animadas, dois halos de 800px com
// blur(150px) girando em loop e um tremor de 0.1s repetido para sempre. Em
// celulares modestos isso derrubava a taxa de quadros logo na entrada. A versão
// abaixo mantém a mesma ideia visual com poucos elementos animados e sem
// re-rasterizar desfoques grandes a cada quadro.
const STARS = Array.from({ length: 24 }, (_, i) => ({
  id: i,
  x: `${(i * 37) % 100}%`,
  y: `${(i * 61) % 100}%`,
  size: (i % 3) + 1,
  delay: (i % 6) * 0.35,
  duration: 3 + (i % 4),
}));

export function GalaxyTransition({ onComplete }: GalaxyTransitionProps) {
  const [showLetters, setShowLetters] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    // Com "reduzir movimento" ativo no sistema, a animação é dispensada.
    if (reduceMotion) {
      onComplete();
      return;
    }

    const launchAudio = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    const rumbleAudio = new Audio('https://assets.mixkit.co/active_storage/sfx/2559/2559-preview.mp3');
    const chimeAudio = new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3');

    launchAudio.preload = 'none';
    rumbleAudio.preload = 'none';
    chimeAudio.preload = 'none';

    rumbleAudio.volume = 0.3;
    launchAudio.volume = 0.5;
    chimeAudio.volume = 0.4;

    const playAudio = async () => {
      try {
        await rumbleAudio.play();
        setTimeout(() => launchAudio.play(), 500);
        setTimeout(() => chimeAudio.play(), 1200);
      } catch (e) {
        // Áudio bloqueado pelo navegador: segue com a animação.
      }
    };

    playAudio();

    const timer = setTimeout(() => {
      onComplete();
    }, 3200);

    return () => {
      clearTimeout(timer);
      rumbleAudio.pause();
      launchAudio.pause();
      chimeAudio.pause();
    };
  }, [onComplete, reduceMotion]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLetters(true);
    }, 700);
    return () => clearTimeout(timer);
  }, []);

  const letters = 'PRIME'.split('');

  if (reduceMotion) {
    return <div className="fixed inset-0 z-[100] bg-[#02040a]" />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-[#02040a] flex items-center justify-center overflow-hidden"
    >
      {/* Estrelas: apenas 24, com transformações leves. */}
      <div className="absolute inset-0 z-0">
        {STARS.map((star) => (
          <motion.div
            key={star.id}
            initial={{ y: '-10%', opacity: 0 }}
            animate={{ y: '110%', opacity: [0, 0.9, 0] }}
            transition={{
              duration: star.duration,
              repeat: Infinity,
              ease: 'linear',
              delay: star.delay,
            }}
            style={{ left: star.x, top: star.y, width: star.size, height: star.size }}
            className="absolute bg-white rounded-full"
          />
        ))}
      </div>

      {/* Halos estáticos: o desfoque é rasterizado uma vez, sem animação. */}
      <div className="absolute w-[700px] h-[700px] bg-primary/20 blur-[100px] rounded-full z-0" />
      <div className="absolute w-[520px] h-[520px] bg-secondary/20 blur-[90px] rounded-full z-0 left-[-10%] top-[-10%]" />

      {/* Foguete e partículas */}
      <div className="relative flex flex-col items-center">
        <motion.div
          initial={{ y: 700, scale: 0.5, rotate: -45 }}
          animate={{
            y: [-120, -1400],
            scale: [1, 1.15],
            rotate: [-45, -44],
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: 2.8,
            ease: 'easeIn',
          }}
          className="relative z-20"
        >
          <div className="relative group">
            <Rocket className="w-20 h-20 text-white" />

            {/* Faíscas */}
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 1 }}
                animate={{
                  y: [0, 90],
                  x: [0, (i - 2) * 14],
                  scale: [1, 0],
                  opacity: [1, 0],
                }}
                transition={{
                  duration: 0.45 + (i % 3) * 0.15,
                  repeat: Infinity,
                  delay: i * 0.1,
                }}
                className="absolute top-[85%] left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-yellow-400 rounded-full"
              />
            ))}
          </div>
        </motion.div>

        {/* Letras flutuando */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 flex gap-4">
          {letters.map((char, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 100, scale: 0 }}
              animate={
                showLetters
                  ? {
                      opacity: [0, 1, 1, 0],
                      y: [100, -50, -100],
                      scale: [0, 1.5, 1.2, 2],
                      color: ['#ffffff', '#3e63dd', '#3eadff'],
                    }
                  : {}
              }
              transition={{
                duration: 2,
                delay: i * 0.1,
                ease: 'easeOut',
              }}
              className="text-6xl font-black font-display tracking-tighter"
            >
              {char}
            </motion.span>
          ))}
        </div>
      </div>

      {/* Clarão final */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0, 1, 1, 0] }}
        transition={{ duration: 3.2, times: [0, 0.8, 0.9, 0.95, 1] }}
        className="absolute inset-0 bg-white z-[200] pointer-events-none"
      />
    </motion.div>
  );
}
