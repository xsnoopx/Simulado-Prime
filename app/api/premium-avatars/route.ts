import { NextResponse } from "next/server";

export async function GET() {
  const list = [];
  const celestialEmojis = ["🪐", "🌌", "⭐", "☄️", "🛰️", "👽", "🛸", "🚀", "🔮", "🔭"];
  const bgList = [
    "bg-amber-500/10 border-amber-500/20 text-amber-300",
    "bg-yellow-500/10 border-yellow-500/20 text-yellow-300",
    "bg-teal-500/10 border-teal-500/20 text-teal-300",
    "bg-purple-500/10 border-purple-500/20 text-purple-300",
  ];

  for (let i = 1; i <= 50; i++) {
    const numPart = String(i).padStart(2, "0");
    const emoji = celestialEmojis[(i - 1) % celestialEmojis.length];
    const bg = bgList[(i - 1) % bgList.length];

    list.push({
      id: `avatar_premium_${numPart}`,
      name: `Premium ${numPart} - Avatar Espacial`,
      img: `/avatars/avatar_${numPart}.png`,
      emoji: emoji,
      bg: `${bg} border`,
      number: numPart,
      isPremium: true
    });

    if (i <= 10) {
      list.push({
        id: `avatar_premium_${numPart}A`,
        name: `Premium ${numPart}A - Avatar Espacial`,
        img: `/avatars/avatar_${numPart}A.png`,
        emoji: emoji,
        bg: `${bg} border`,
        number: `${numPart}A`,
        isPremium: true
      });
    }
  }

  return NextResponse.json({ avatars: list });
}
