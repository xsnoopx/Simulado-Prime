'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BarChart2, Rocket, User, Sparkles, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { icon: Home, label: 'Início', href: '/' },
    { icon: Rocket, label: 'Resultados', href: '/results' },
    { icon: Trophy, label: 'Ranking', href: '/ranking' },
    { icon: User, label: 'Perfil', href: '/profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 bg-surface-container-lowest/80 backdrop-blur-xl border-t border-outline-variant/10 flex justify-around items-center h-20 px-4 pb-safe shadow-[0_-8px_30px_rgb(0,0,0,0.12)]">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex-1 max-w-[100px] flex justify-center relative"
          >
            <motion.div
              whileTap={{ scale: 0.9, transition: { type: "spring", stiffness: 400, damping: 17 } }}
              whileHover={{ y: -4 }}
              className={cn(
                "flex flex-col items-center justify-center transition-colors relative w-full h-15 rounded-2xl",
                isActive ? "text-primary" : "text-on-surface-variant/70 hover:text-primary"
              )}
            >
              {/* Active Background Pill */}
              <AnimatePresence>
                {isActive && (
                  <motion.div 
                    layoutId="nav-active-pill"
                    className="absolute inset-0 rounded-2xl -z-10 bg-primary/10 shadow-[0_0_20px_rgba(var(--primary),0.1)] border border-primary/20"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </AnimatePresence>

              <Icon className={cn(
                "w-6 h-6 transition-transform", 
                isActive && "scale-110 stroke-[2.5px]"
              )} />
              <span className={cn(
                "text-[9px] font-black mt-1 uppercase tracking-[0.15em] transition-all",
                isActive ? "opacity-100" : "opacity-50"
              )}>
                {item.label}
              </span>
            </motion.div>
          </Link>
        );
      })}
    </nav>
  );
}
