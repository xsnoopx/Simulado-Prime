'use client';

import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

interface Particle {
  id: number;
  originX: string; // "10%", "50%", "90%"
  color: string;
  size: number;
  shape: 'circle' | 'square' | 'triangle' | 'star';
  // Animation paths
  xKeyframes: number[];
  yKeyframes: number[];
  rotateKeyframes: number[];
  scaleKeyframes: number[];
  opacityKeyframes: number[];
  duration: number;
  delay: number;
}

const COLORS = [
  '#FFD700', // Gold
  '#FF1493', // Deep Pink
  '#00FFFF', // Cyan
  '#39FF14', // Neon Green
  '#8A2BE2', // Blue Violet
  '#FF4500', // Orange Red
  '#E0115F', // Ruby Red
  '#F0F8FF', // Alice Blue / Shiny white
  '#FF8C00', // Dark Orange
];

const SHAPES: ('circle' | 'square' | 'triangle' | 'star')[] = ['circle', 'square', 'triangle', 'star'];

export function Confetti() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const generated: Particle[] = [];
    const count = 150; // Decent density without sacrificing performance

    for (let i = 0; i < count; i++) {
      const id = i;
      // Distribute starting origins: 35% left, 35% right, 30% center
      const rand = Math.random();
      let originX = '50%';
      let directionMultiplier = 1; // 1 = right, -1 = left, or mixed

      if (rand < 0.35) {
        originX = '5%'; // Left side
        directionMultiplier = 1.2;
      } else if (rand < 0.7) {
        originX = '95%'; // Right side
        directionMultiplier = -1.2;
      } else {
        originX = '50%'; // Center
        directionMultiplier = Math.random() > 0.5 ? 1 : -1;
      }

      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      const size = Math.floor(Math.random() * 12) + 6; // Sizes 6px to 18px
      const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];

      // Displacements
      const maxDistanceX = Math.random() * 350 + 100; // 100px to 450px
      const targetX = maxDistanceX * directionMultiplier;
      // Drift mid-point X as well to look like wind / arc mapping
      const midX = targetX * 0.7;

      const peakY = -(Math.random() * 450 + 250); // Erupts upwards by -250px to -700px
      const fallY = window.innerHeight + 150; // Fall completely off the screen

      const duration = Math.random() * 2.5 + 2.5; // 2.5s to 5s fall physical timing
      const delay = Math.random() * 0.5; // Stagger start over 0.5s

      // Star shape SVG path is complex, rendering path will reference size
      generated.push({
        id,
        originX,
        color,
        size,
        shape,
        xKeyframes: [0, midX, targetX],
        yKeyframes: [0, peakY, fallY],
        rotateKeyframes: [0, Math.random() * 360, Math.random() * 1080],
        scaleKeyframes: [0, 1, 1, 0.5], // Pop in, stay large, fade tiny on landing
        opacityKeyframes: [0, 1, 1, 0.8, 0], // Quick fade in, hold, then fade out
        duration,
        delay,
      });
    }

    setParticles(generated);
  }, []);

  return (
    <div 
      className="fixed inset-0 w-full h-full pointer-events-none overflow-hidden z-[9999]"
      id="confetti-container"
    >
      {particles.map((p) => {
        const renderShapeSvg = () => {
          switch (p.shape) {
            case 'circle':
              return (
                <circle cx={p.size / 2} cy={p.size / 2} r={p.size / 2} fill={p.color} />
              );
            case 'triangle':
              return (
                <polygon 
                  points={`0,${p.size} ${p.size / 2},0 ${p.size},${p.size}`} 
                  fill={p.color} 
                />
              );
            case 'star':
              return (
                <polygon
                  points={`
                    ${p.size * 0.5},0 
                    ${p.size * 0.65},${p.size * 0.35} 
                    ${p.size},${p.size * 0.35} 
                    ${p.size * 0.75},${p.size * 0.6} 
                    ${p.size * 0.85},${p.size} 
                    ${p.size * 0.5},${p.size * 0.75} 
                    ${p.size * 0.15},${p.size} 
                    ${p.size * 0.25},${p.size * 0.6} 
                    0,${p.size * 0.35} 
                    ${p.size * 0.35},${p.size * 0.35}
                  `}
                  fill={p.color}
                />
              );
            case 'square':
            default:
              return (
                <rect width={p.size} height={p.size * 0.6} fill={p.color} rx={1} />
              );
          }
        };

        return (
          <motion.div
            key={p.id}
            initial={{ 
              left: p.originX, 
              top: '100%', 
              x: 0, 
              y: 0, 
              rotateX: 0,
              rotateY: 0,
              rotateZ: 0,
              scale: 0, 
              opacity: 0 
            }}
            animate={{
              x: p.xKeyframes,
              y: p.yKeyframes,
              rotateX: p.rotateKeyframes,
              rotateY: p.rotateKeyframes,
              rotateZ: p.rotateKeyframes,
              scale: p.scaleKeyframes,
              opacity: p.opacityKeyframes,
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              ease: [0.1, 0.8, 0.3, 1], // Custom overshoot pop/eruption
            }}
            style={{
              position: 'absolute',
              width: p.size,
              height: p.size,
            }}
            id={`confetti-particle-${p.id}`}
          >
            <svg 
              width={p.size} 
              height={p.size} 
              viewBox={`0 0 ${p.size} ${p.size}`}
            >
              {renderShapeSvg()}
            </svg>
          </motion.div>
        );
      })}
    </div>
  );
}
