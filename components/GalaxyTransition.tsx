'use client';

import { motion } from 'motion/react';
import { Rocket } from 'lucide-react';
import { useEffect, useState } from 'react';

interface GalaxyTransitionProps {
  onComplete: () => void;
}

export function GalaxyTransition({ onComplete }: GalaxyTransitionProps) {
  const [showLetters, setShowLetters] = useState(false);

  useEffect(() => {
    // Audio elements
    const launchAudio = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    const rumbleAudio = new Audio('https://assets.mixkit.co/active_storage/sfx/2559/2559-preview.mp3');
    const chimeAudio = new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3');

    rumbleAudio.volume = 0.3;
    launchAudio.volume = 0.5;
    chimeAudio.volume = 0.4;

    const playAudio = async () => {
      try {
        await rumbleAudio.play();
        setTimeout(() => launchAudio.play(), 500);
        setTimeout(() => chimeAudio.play(), 1200);
      } catch (e) {
        console.log("Audio play blocked", e);
      }
    };

    playAudio();

    const timer = setTimeout(() => {
      onComplete();
    }, 3500);

    return () => {
      clearTimeout(timer);
      rumbleAudio.pause();
      launchAudio.pause();
      chimeAudio.pause();
    };
  }, [onComplete]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLetters(true);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const letters = "PRIME".split("");

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-[#02040a] flex items-center justify-center overflow-hidden"
    >
      {/* Galaxy Background Stars */}
      <div className="absolute inset-0 z-0">
        {[...Array(100)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              x: Math.random() * 100 + "%", 
              y: Math.random() * 100 + "%",
              scale: Math.random() * 0.5 + 0.5,
              opacity: Math.random()
            }}
            animate={{ 
              y: ["0%", "100%"],
              opacity: [0, 1, 0]
            }}
            transition={{ 
              duration: Math.random() * 2 + 1, 
              repeat: Infinity, 
              ease: "linear",
              delay: Math.random() * 2
            }}
            className="absolute w-1 h-1 bg-white rounded-full"
          />
        ))}
      </div>

      {/* Galaxy Nebulas */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          rotate: [0, 10, 0]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        className="absolute w-[800px] h-[800px] bg-primary/20 blur-[150px] rounded-full z-0"
      />
      <motion.div 
        animate={{ 
          scale: [1.2, 1, 1.2],
          rotate: [0, -10, 0]
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
        className="absolute w-[600px] h-[600px] bg-secondary/20 blur-[120px] rounded-full z-0 left-[-10%] top-[-10%]"
      />

      {/* The Rocket and the Particles */}
      <motion.div 
        animate={{ 
          x: [0, -2, 2, -1, 1, 0],
          y: [0, -1, 1, -2, 2, 0]
        }}
        transition={{ duration: 0.1, repeat: Infinity }}
        className="relative flex flex-col items-center"
      >
        {/* Rocket Container */}
        <motion.div
          initial={{ y: 800, scale: 0.5, rotate: -45 }}
          animate={{ 
            y: [-200, -1500], 
            scale: [1, 1.2],
            rotate: [-45, -46, -44, -45],
            opacity: [1, 1, 0]
          }}
          transition={{ 
            duration: 3, 
            times: [0, 1],
            ease: "easeIn" 
          }}
          className="relative z-20"
        >
          <div className="relative group">
            <Rocket className="w-20 h-20 text-white" />
            
            {/* Particle Sparks */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ 
                  y: [0, 100],
                  x: [0, (Math.random() - 0.5) * 60],
                  scale: [1, 0],
                  opacity: [1, 0]
                }}
                transition={{ 
                  duration: 0.3 + Math.random() * 0.4,
                  repeat: Infinity,
                  delay: Math.random() * 0.5
                }}
                className="absolute top-[85%] left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-yellow-400 rounded-full blur-[0.5px]"
              />
            ))}
          </div>
        </motion.div>

        {/* Floating Letters Left Behind */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 flex gap-4">
          {letters.map((char, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 100, scale: 0, filter: "blur(10px)" }}
              animate={showLetters ? { 
                opacity: [0, 1, 1, 0],
                y: [100, -50, -100],
                scale: [0, 1.5, 1.2, 2],
                filter: ["blur(10px)", "blur(0px)", "blur(0px)", "blur(20px)"],
                color: ["#ffffff", "#3e63dd", "#3eadff"]
              } : {}}
              transition={{ 
                duration: 2, 
                delay: i * 0.1,
                ease: "easeOut"
              }}
              className="text-6xl font-black font-display tracking-tighter"
            >
              {char}
            </motion.span>
          ))}
        </div>
      </motion.div>

      {/* Final Flash */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0, 1, 1, 0] }}
        transition={{ duration: 3.5, times: [0, 0.8, 0.9, 0.95, 1] }}
        className="absolute inset-0 bg-white z-[200] pointer-events-none"
      />
    </motion.div>
  );
}
