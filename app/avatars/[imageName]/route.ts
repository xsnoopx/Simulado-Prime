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

  if (imageName && imageName.startsWith('avatar_') && imageName.endsWith('.png')) {
    // Try to locate the file in multiple possible paths
    const pathsToTry = [
      path.join(process.cwd(), imageName), // Try the root directory where files are placed
      path.join(process.cwd(), 'public/avatars', imageName),
      path.join('/home/ubuntu/avatars', imageName),
      path.join(process.cwd(), 'avatars', imageName)
    ];

    let filePath = '';
    for (const p of pathsToTry) {
      if (fs.existsSync(p)) {
        filePath = p;
        break;
      }
    }

    if (filePath) {
      const stats = fs.statSync(filePath);
      
      // If the file is non-empty, serve actual image binary content
      if (stats.size > 0) {
        const fileBuffer = fs.readFileSync(filePath);
        return new NextResponse(fileBuffer, {
          headers: {
            'Content-Type': 'image/png',
            'Cache-Control': 'public, max-age=31536000, immutable',
          },
        });
      }
    }

    // High quality dynamic backup SVG fallback in case the local PNG file is 0-bytes or not found
    const numPart = imageName.replace('avatar_', '').replace('.png', '');
    const num = parseInt(numPart) || 1;
    const isSpecial = numPart.endsWith('A');
    const celestialEmojis = isSpecial 
      ? ['👑', '🔱', '💎', '🔮', '🦁', '🐉', '🎠', '🧚', '🧜', '🧬']
      : ['🪐', '🌌', '⭐', '☄️', '🛰️', '👽', '🛸', '🚀', '🔮', '🔭'];
    const emoji = celestialEmojis[(num - 1) % celestialEmojis.length];
    
    const colors = [
      ['#78350f', '#92400e', '#b45309'], // Stellar Cooper
      ['#1e1b4b', '#312e81', '#4338ca'], // Space Prime
      ['#581c87', '#701a75', '#86198f'], // Nebular Purple
      ['#064e3b', '#047857', '#059669'], // Cyber Emerald
      ['#7c2d12', '#9a3412', '#c2410c'], // Supernova Amber
    ];
    const colorSet = colors[(num - 1) % colors.length];

    const svgMarkup = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 150" width="150" height="150">
        <defs>
          <linearGradient id="premiumGrad-${numPart}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${colorSet[0]}" />
            <stop offset="50%" stop-color="${colorSet[1]}" />
            <stop offset="100%" stop-color="${colorSet[2]}" />
          </linearGradient>
          <filter id="glow-${numPart}">
            <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <rect width="150" height="150" rx="24" fill="url(#premiumGrad-${numPart})" stroke="#f59e0b" stroke-width="2" stroke-opacity="0.3" />
        
        <!-- Starfield -->
        <circle cx="20" cy="30" r="1.2" fill="#fff" opacity="0.8" />
        <circle cx="130" cy="40" r="1.6" fill="#fff" opacity="0.6" />
        <circle cx="40" cy="110" r="1.2" fill="#fff" opacity="0.5" />
        <circle cx="110" cy="120" r="1.4" fill="#fff" opacity="0.7" />
        <circle cx="85" cy="25" r="1.0" fill="#fff" opacity="0.9" />
        
        <!-- Subtle orbital ring -->
        <ellipse cx="75" cy="75" rx="55" ry="18" fill="none" stroke="rgba(245,158,11,0.2)" stroke-width="1.2" transform="rotate(-15 75 75)" />
        
        <text x="75" y="86" font-size="46" font-family="system-ui, sans-serif" text-anchor="middle" filter="url(#glow-${numPart})">${emoji}</text>
        
        <!-- Elegantly formatted index badge -->
        <rect x="12" y="112" width="34" height="18" rx="6" fill="rgba(245,158,11,0.1)" stroke="rgba(245,158,11,0.25)" stroke-width="1" />
        <text x="29" y="125" font-size="9" font-family="monospace, sans-serif" font-weight="bold" fill="#f59e0b" text-anchor="middle">${numPart}</text>
      </svg>
    `.trim();

    return new NextResponse(svgMarkup, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }

  return new NextResponse('Not Found', { status: 404 });
}
