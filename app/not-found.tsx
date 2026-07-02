'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { Rocket, Home, HelpCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-6 text-center overflow-hidden bg-background text-on-surface">
      {/* Space Background Elements */}
      <div className="starfield absolute inset-0 z-0" />
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-primary/10 blur-[130px] rounded-full z-0 animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-secondary/10 blur-[110px] rounded-full z-0" />

      {/* Main Content Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", damping: 20, stiffness: 100 }}
        className="relative z-10 max-w-md w-full glass-panel border border-white/10 p-8 rounded-[2.5rem] shadow-2xl backdrop-blur-2xl space-y-6"
      >
        {/* Glow behind card */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-primary/15 rounded-full blur-3xl pointer-events-none -z-10" />

        {/* 404 Graphic */}
        <motion.div 
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="relative inline-block"
        >
          <span className="text-8xl font-display font-black tracking-widest text-primary drop-shadow-[0_0_15px_rgba(var(--primary),0.3)] select-none">
            404
          </span>
          <div className="absolute -top-3 -right-3 text-amber-400">
            <HelpCircle className="w-8 h-8 animate-pulse text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
          </div>
        </motion.div>

        {/* Text Details */}
        <div className="space-y-2">
          <h1 className="text-xl font-display font-black uppercase tracking-wider text-white">
            Página Perdida no Espaço!
          </h1>
          <p className="text-xs text-white/60 leading-relaxed px-4">
            A rota que você tentou acessar não foi encontrada em nossas coordenadas galácticas. Verifique o caminho ou retorne para o painel de estudos.
          </p>
        </div>

        {/* Navigation Action Buttons */}
        <div className="flex flex-col gap-3 pt-2">
          <Link href="/">
            <motion.button
              whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.08)" }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3.5 px-6 rounded-2xl font-display font-bold text-xs tracking-widest glass-panel border border-white/5 shadow-md flex items-center justify-center gap-2 group cursor-pointer text-white"
            >
              <Home className="w-4 h-4 text-primary group-hover:-translate-y-0.5 transition-transform" />
              VOLTAR AO INÍCIO
            </motion.button>
          </Link>
        </div>
      </motion.div>

      {/* Decorative Floating Rocket */}
      <motion.div
        animate={{ 
          x: [-100, 100],
          y: [0, -30, 0],
          rotate: [15, 30, 15]
        }}
        transition={{ 
          duration: 20, 
          repeat: Infinity, 
          ease: "linear"
        }}
        className="absolute bottom-10 left-10 pointer-events-none opacity-25 z-0"
      >
        <Rocket className="w-12 h-12 text-secondary" />
      </motion.div>
    </div>
  );
}
