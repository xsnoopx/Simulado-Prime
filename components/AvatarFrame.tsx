'use client';

import React, { useState } from 'react';
import { AVATAR_FRAMES, AvatarFrame as FrameType } from '@/lib/frames';
import { cn } from '@/lib/utils';

interface AvatarFrameProps {
  frameId?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'custom';
  className?: string;
  isHoverable?: boolean;
}

export function AvatarFrame({
  frameId = 'frame_01',
  children,
  size = 'md',
  className,
  isHoverable = true,
}: AvatarFrameProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Find the frame definition
  const frame = AVATAR_FRAMES.find((f) => f.id === frameId) || AVATAR_FRAMES[0];

  // Map convenient sizes to width height constraints
  const sizeClasses = {
    sm: 'w-10 h-10 p-[1.5px]',
    md: 'w-16 h-16 p-[2.5px]',
    lg: 'w-24 h-24 p-[3.5px]',
    xl: 'w-32 h-32 p-[4.5px]',
    custom: '',
  };

  const currentSizeClass = sizeClasses[size];

  // We write self-contained custom keyframe styles to maintain absolute modularity and prevent globals.css dependency issues
  const customAnimationsStyle = `
    @keyframes frame-spin-clockwise {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    @keyframes frame-pulse {
      0%, 100% { transform: scale(1); opacity: 0.85; filter: drop-shadow(0 0 4px var(--frame-glow)); }
      50% { transform: scale(1.02); opacity: 1; filter: drop-shadow(0 0 14px var(--frame-glow)); }
    }
    @keyframes frame-flicker {
      0%, 100% { opacity: 0.95; filter: drop-shadow(0 0 5px var(--frame-glow)); }
      20% { opacity: 0.8; filter: drop-shadow(0 0 2px var(--frame-glow)); }
      40% { opacity: 1; filter: drop-shadow(0 0 12px var(--frame-glow)); }
      50% { opacity: 0.6; filter: drop-shadow(0 0 1px var(--frame-glow)); }
      70% { opacity: 0.9; filter: drop-shadow(0 0 9px var(--frame-glow)); }
      85% { opacity: 0.7; filter: drop-shadow(0 0 3px var(--frame-glow)); }
    }
    @keyframes frame-rainbow {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    @keyframes frame-fire {
      0%, 100% { transform: scale(1) rotate(0deg); border-radius: 50%; filter: drop-shadow(0 0 5px var(--frame-glow)); }
      33% { transform: scale(1.01) rotate(2deg); border-radius: 48% 52% 50% 50% / 50% 50% 52% 48%; filter: drop-shadow(0 -2px 10px rgba(239, 68, 68, 0.7)); }
      66% { transform: scale(0.99) rotate(-3deg); border-radius: 52% 48% 48% 52% / 48% 52% 50% 50%; filter: drop-shadow(0 2px 12px rgba(245, 158, 11, 0.8)); }
    }
    @keyframes frame-waves {
      0% { transform: scale(1) translateY(0); filter: hue-rotate(0deg); }
      50% { transform: scale(1.01) translateY(-1px); filter: hue-rotate(15deg); }
      100% { transform: scale(1) translateY(0); filter: hue-rotate(0deg); }
    }
    @keyframes frame-orbit {
      0% { transform: rotate(0deg) translate(48%) rotate(0deg); }
      100% { transform: rotate(360deg) translate(48%) rotate(-360deg); }
    }
    @keyframes frame-shimmer-fast {
      0% { opacity: 0.5; filter: brightness(1) drop-shadow(0 0 2px var(--frame-glow)); }
      30% { opacity: 1; filter: brightness(1.3) drop-shadow(0 0 10px var(--frame-glow)); }
      40% { opacity: 0.8; filter: brightness(0.9); }
      70% { opacity: 1; filter: brightness(1.4) drop-shadow(0 0 12px var(--frame-glow)); }
      100% { opacity: 0.5; filter: brightness(1) drop-shadow(0 0 2px var(--frame-glow)); }
    }
    /* Exclusivo da moldura do ADM (Soberano Fundador) */
    @keyframes frame-sovereign-spin {
      to { transform: rotate(360deg); }
    }
    @keyframes frame-sovereign-spin-reverse {
      to { transform: rotate(-360deg); }
    }
    @keyframes frame-sovereign-halo {
      0%, 100% { opacity: 0.55; transform: scale(1); }
      50% { opacity: 1; transform: scale(1.07); }
    }
    @keyframes frame-sovereign-rays {
      0% { opacity: 0.3; transform: rotate(0deg); }
      50% { opacity: 0.75; }
      100% { opacity: 0.3; transform: rotate(360deg); }
    }
    @keyframes frame-sovereign-spark {
      0%, 100% { opacity: 0.35; transform: scale(0.7); }
      50% { opacity: 1; transform: scale(1.25); }
    }
  `;

  // Determine target speed or glow values based on hover interaction
  let animationCss = {};
  const glow = frame.glowColor;
  const isAdminFrame = frame.id === 'frame_owner';

  switch (frame.animationStyle) {
    case 'spin-slow':
      animationCss = {
        animation: `frame-spin-clockwise ${isHovered && isHoverable ? '2.5s' : '8s'} linear infinite`,
      };
      break;
    case 'pulse-glow':
      animationCss = {
        animation: `frame-pulse ${isHovered && isHoverable ? '1s' : '2.5s'} ease-in-out infinite`,
      };
      break;
    case 'neon-flicker':
      animationCss = {
        animation: `frame-flicker ${isHovered && isHoverable ? '1.2s' : '3s'} ease-in-out infinite`,
      };
      break;
    case 'rainbow-flow':
      animationCss = {
        backgroundSize: '200% 200%',
        animation: `frame-rainbow ${isHovered && isHoverable ? '2s' : '5s'} linear infinite, frame-pulse 3s ease-in-out infinite`,
      };
      break;
    case 'fire-aura':
      animationCss = {
        animation: `frame-fire ${isHovered && isHoverable ? '0.8s' : '1.8s'} ease-in-out infinite`,
      };
      break;
    case 'stars-shimmer':
      animationCss = {
        animation: `frame-shimmer-fast ${isHovered && isHoverable ? '1.5s' : '3.5s'} ease-in-out infinite`,
      };
      break;
    case 'waves-flow':
      animationCss = {
        animation: `frame-waves ${isHovered && isHoverable ? '1.2s' : '3s'} ease-in-out infinite`,
      };
      break;
    case 'retro-lines':
      animationCss = {
        animation: `frame-spin-clockwise ${isHovered && isHoverable ? '4s' : '12s'} linear infinite, frame-pulse 4s ease-in-out infinite`,
      };
      break;
    case 'matrix-rain':
      animationCss = {
        animation: `frame-pulse ${isHovered && isHoverable ? '0.8s' : '2s'} ease-in-out infinite`,
        borderStyle: 'double',
        borderWidth: size === 'xl' || size === 'lg' ? '4px' : '2px',
      };
      break;
    case 'orbit-gems':
      animationCss = {
        animation: `frame-pulse 2s ease-in-out infinite`,
      };
      break;
    case 'sovereign-aura':
      animationCss = {
        animation: `frame-sovereign-spin ${isHovered && isHoverable ? '2.4s' : '7s'} linear infinite`,
      };
      break;
    default:
      break;
  }

  const sparkSize =
    size === 'sm' ? 'w-1 h-1' : size === 'md' ? 'w-1.5 h-1.5' : 'w-2 h-2';

  // Create style tag to load the core keyframes once gracefully
  return (
    <div
      className={cn(
        'relative rounded-full flex items-center justify-center transition-all duration-300 select-none shrink-0',
        currentSizeClass,
        isHovered && isHoverable ? 'scale-105' : 'scale-100',
        className
      )}
      style={{
        boxShadow: isAdminFrame
          ? isHovered && isHoverable
            ? `0 0 42px ${glow}, 0 0 18px ${glow}, inset 0 0 12px ${glow}`
            : `0 0 26px ${glow}, 0 0 10px ${glow}`
          : isHovered && isHoverable
            ? `0 0 25px ${glow}, inset 0 0 10px ${glow}`
            : `0 0 10px ${glow}`,
        '--frame-glow': glow,
      } as React.CSSProperties}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      id={`avatar_frame_${frame.id}`}
      data-frame-exclusiva={isAdminFrame ? 'adm' : undefined}
    >
      {/* Styles Injection */}
      <style dangerouslySetInnerHTML={{ __html: customAnimationsStyle }} />

      {/* ===== Camadas exclusivas do ADM (Soberano Fundador) ===== */}
      {isAdminFrame && (
        <>
          {/* Aura dourada externa */}
          <div
            aria-hidden="true"
            className="absolute -inset-[18%] rounded-full pointer-events-none"
            style={{
              background:
                'radial-gradient(circle, rgba(255, 214, 10, 0.5) 0%, rgba(255, 170, 0, 0.2) 45%, rgba(255, 140, 0, 0) 72%)',
              animation: 'frame-sovereign-halo 2.8s ease-in-out infinite',
            }}
          />

          {/* Raios de luz girando atrás da coroa */}
          {size !== 'sm' && (
            <div
              aria-hidden="true"
              className="absolute -inset-[10%] rounded-full pointer-events-none"
              style={{
                background:
                  'repeating-conic-gradient(from 0deg, rgba(255, 215, 0, 0.6) 0deg 1.6deg, transparent 1.6deg 15deg)',
                WebkitMaskImage:
                  'radial-gradient(circle, transparent 52%, #000 60%)',
                maskImage: 'radial-gradient(circle, transparent 52%, #000 60%)',
                animation: 'frame-sovereign-rays 12s linear infinite',
              }}
            />
          )}

          {/* Anel externo em barber-pole dourado */}
          <div
            aria-hidden="true"
            className="absolute -inset-[5px] rounded-full pointer-events-none"
            style={{
              background:
                'repeating-conic-gradient(from 0deg, #fffbe6 0deg 16deg, #b45309 16deg 32deg, #ffd700 32deg 40deg)',
              animation: 'frame-sovereign-spin-reverse 9s linear infinite',
            }}
          />

          {/* Anel interno espelhado */}
          <div
            aria-hidden="true"
            className="absolute -inset-[2.5px] rounded-full pointer-events-none"
            style={{
              background:
                'conic-gradient(from 180deg, #1c1917 0%, #fde68a 18%, #ffffff 32%, #b45309 55%, #fbbf24 78%, #1c1917 100%)',
              animation: 'frame-sovereign-spin 5s linear infinite',
            }}
          />
        </>
      )}

      {/* Elegant Independent Border/Moldura Layer (Prevents rotating the profile/face) */}
      <div 
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background: frame.borderGradient,
          ...animationCss,
        } as React.CSSProperties}
      />

      {/* Reflexo de luz percorrendo o aro do ADM */}
      {isAdminFrame && size !== 'sm' && (
        <div
          aria-hidden="true"
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background:
              'conic-gradient(from 0deg, rgba(255,255,255,0) 0deg, rgba(255,255,255,0) 280deg, rgba(255,255,255,0.9) 338deg, rgba(255,255,255,0) 360deg)',
            mixBlendMode: 'screen',
            animation: 'frame-sovereign-spin 3.4s linear infinite',
          }}
        />
      )}

      {/* Faíscas orbitando o aro do ADM */}
      {isAdminFrame &&
        [
          { duracao: '6s', atraso: '0s', cor: '#fff7cc' },
          { duracao: '8.5s', atraso: '-2.8s', cor: '#ffd700' },
          { duracao: '11s', atraso: '-5.5s', cor: '#ffffff' },
        ].map((faisca) => (
          <div
            key={faisca.duracao}
            aria-hidden="true"
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              animation: `frame-sovereign-spin ${faisca.duracao} linear infinite`,
              animationDelay: faisca.atraso,
            }}
          >
            <span
              className={cn(
                'absolute left-1/2 -translate-x-1/2 rotate-45 rounded-[1px]',
                sparkSize
              )}
              style={{
                top: '-4%',
                background: faisca.cor,
                boxShadow: `0 0 8px ${faisca.cor}, 0 0 16px rgba(255, 215, 0, 0.9)`,
                animation: 'frame-sovereign-spark 1.8s ease-in-out infinite',
              }}
            />
          </div>
        ))}


      {/* Orbiting particles inside the border for orbiting animations */}
      {frame.animationStyle === 'orbit-gems' && (
        <>
          <div 
            className="absolute w-2 h-2 rounded-full bg-white shadow-lg pointer-events-none z-10"
            style={{
              animation: `frame-orbit ${isHovered ? '1s' : '3s'} linear infinite`,
              boxShadow: `0 0 8px #fff`,
            }}
          />
          <div 
            className="absolute w-1.5 h-1.5 rounded-full bg-amber-200 pointer-events-none z-10"
            style={{
              animation: `frame-orbit ${isHovered ? '2s' : '4.5s'} linear infinite reverse`,
              boxShadow: `0 0 6px #f59e0b`,
            }}
          />
        </>
      )}

      {/* The inner element (avatar face itself) - Remains still and upright */}
      <div 
        className={cn(
          "w-full h-full rounded-full overflow-hidden bg-surface flex items-center justify-center relative p-[1px] transition-all z-10",
          isHovered && isHoverable ? 'bg-surface-dim' : 'bg-surface'
        )}
      >
        {children}
      </div>

      {/* Coroa flutuante exclusiva do ADM */}
      {isAdminFrame && (size === 'xl' || size === 'lg') && (
        <span
          aria-hidden="true"
          className={cn(
            'absolute left-1/2 -translate-x-1/2 pointer-events-none z-20 select-none',
            size === 'xl' ? '-top-[20%] text-[1.6rem]' : '-top-[11%] text-[1.1rem]'
          )}
          style={{
            filter: 'drop-shadow(0 0 8px rgba(255, 214, 10, 0.95))',
            animation: 'frame-sovereign-halo 2.4s ease-in-out infinite',
          }}
        >
          👑
        </span>
      )}

      {/* Ribbon title badge for frames with custom status tags */}
      {frame.badgeText && (size === 'xl' || size === 'lg') && (
        <span 
          className={cn(
            "absolute -bottom-1 px-2.5 py-0.5 rounded-full text-[0.5rem] font-black uppercase tracking-widest border border-white/10 shadow-md pointer-events-none z-20 text-white leading-none scale-90",
            isAdminFrame
              ? "-bottom-2 scale-100 justify-center border-yellow-200/80 bg-gradient-to-r from-amber-600 via-yellow-300 to-amber-500 px-3 py-1 text-[0.5625rem] text-[#2a1a00] animate-pulse"
              : frame.badgeColor || "bg-[#10b981] bg-gradient-to-r from-emerald-500 to-teal-500"
          )}
          style={{
            boxShadow: isAdminFrame
              ? '0 0 18px rgba(255, 214, 10, 0.9), 0 2px 8px rgba(0, 0, 0, 0.5)'
              : `0 2px 8px ${glow}`,
          }}
        >
          {frame.badgeText}
        </span>
      )}
    </div>
  );
}
