import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: any }
) {
  // Support both sync/async params for maximum compatibility under standard/Next15 environments
  const resolvedParams = typeof params?.then === 'function' ? await params : params;
  const imageName = resolvedParams?.imageName;

  if (imageName && imageName.startsWith('imagem_') && imageName.endsWith('.png')) {
    const filePath = path.join(process.cwd(), imageName);

    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      
      // If the file is empty/0 bytes, dynamically return a gorgeous Vector space-themed fallback
      if (stats.size === 0) {
        const numPart = imageName.replace('imagem_', '').replace('.png', '');
        const num = parseInt(numPart) || 1;
        const celestialEmojis = ['🪐', '🌌', '⭐', '☄️', '🛰️', '👽', '🛸', '🚀', '🔮', '🔭'];
        const emoji = celestialEmojis[(num - 1) % celestialEmojis.length];
        
        const colors = [
          ['#1e1b4b', '#312e81', '#4338ca'], // Deep Indigo
          ['#0f172a', '#1e293b', '#334155'], // Cosmic Slate
          ['#581c87', '#701a75', '#86198f'], // Nebular Purple
          ['#022c22', '#064e3b', '#047857'], // Aurora Green
          ['#7c2d12', '#9a3412', '#c2410c'], // Supernova Amber
        ];
        const colorSet = colors[(num - 1) % colors.length];

        const svgMarkup = `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 150" width="150" height="150">
            <defs>
              <linearGradient id="neonGrad-${num}" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="${colorSet[0]}" />
                <stop offset="50%" stop-color="${colorSet[1]}" />
                <stop offset="100%" stop-color="${colorSet[2]}" />
              </linearGradient>
              <filter id="glow-${num}">
                <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <rect width="150" height="150" rx="24" fill="url(#neonGrad-${num})" />
            
            <!-- Starfield -->
            <circle cx="20" cy="30" r="1.2" fill="#fff" opacity="0.8" />
            <circle cx="130" cy="40" r="1.6" fill="#fff" opacity="0.6" />
            <circle cx="40" cy="110" r="1.2" fill="#fff" opacity="0.5" />
            <circle cx="110" cy="120" r="1.4" fill="#fff" opacity="0.7" />
            <circle cx="85" cy="25" r="1.0" fill="#fff" opacity="0.9" />
            <circle cx="125" cy="130" r="0.8" fill="#fff" opacity="0.8" />
            <circle cx="25" cy="80" r="1.4" fill="#fff" opacity="0.7" />
            
            <!-- Subtle orbital rings -->
            <ellipse cx="75" cy="75" rx="55" ry="18" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="1.2" transform="rotate(-15 75 75)" />
            <ellipse cx="75" cy="75" rx="42" ry="14" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1" transform="rotate(35 75 75)" />
            
            <!-- Glowing Cosmic Emoji index -->
            <text x="75" y="86" font-size="46" font-family="system-ui, sans-serif" text-anchor="middle" filter="url(#glow-${num})">${emoji}</text>
            
            <!-- Elegantly formatted index badge -->
            <rect x="12" y="112" width="28" height="18" rx="6" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.15)" stroke-width="1" />
            <text x="26" y="125" font-size="10" font-family="monospace, sans-serif" font-weight="bold" fill="rgba(255,255,255,0.8)" text-anchor="middle">${numPart}</text>
          </svg>
        `.trim();

        return new NextResponse(svgMarkup, {
          headers: {
            'Content-Type': 'image/svg+xml',
            'Cache-Control': 'public, max-age=3600',
          },
        });
      }

      // If non-empty, serve actual image binary content
      const fileBuffer = fs.readFileSync(filePath);
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }
  }

  return new NextResponse('Not Found', { status: 404 });
}
