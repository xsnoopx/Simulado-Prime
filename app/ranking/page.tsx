"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BottomNav } from "@/components/BottomNav";
import {
  Trophy,
  Award,
  ChevronRight,
  Zap,
  BookOpen,
  Calculator,
  Globe,
  FlaskConical,
  Star,
  Compass,
  User,
  Search,
  Flame,
  ArrowLeft,
  Lock,
  Crown,
} from "lucide-react";
import Link from "next/link";
import { getStats, SimuladoStats } from "@/lib/stats";
import { getExperienceDetails } from "@/lib/achievements";
import { cn } from "@/lib/utils";
import { AvatarFrame } from "@/components/AvatarFrame";
import { getSupabase } from "@/lib/supabase";
import { syncAllDataToSupabase } from "@/lib/supabaseSync";

// Verified, high-quality, stable space or tech themed Unsplash IDs for avatars
const RIVAL_PLAYERS_DATA = [
  {
    id: "rival_1",
    name: "Marta Vega",
    title: "Cadete do Cosmos",
    baseXp: 0,
    avatarUnsplashId: "photo-1464802686167-b939a6910659",
    emoji: "🌟",
    bg: "bg-emerald-500/20 text-emerald-300",
    avatarFrameId: "frame_01",
  },
  {
    id: "rival_2",
    name: "Bruno Galilei",
    title: "Cadete do Cosmos",
    baseXp: 0,
    avatarUnsplashId: "photo-1451187580459-43490279c0fa",
    emoji: "🔭",
    bg: "bg-sky-500/20 text-sky-300",
    avatarFrameId: "frame_01",
  },
  {
    id: "rival_3",
    name: "Ana Andromeda",
    title: "Cadete do Cosmos",
    baseXp: 0,
    avatarUnsplashId: "photo-1543722530-d2c3201371e7",
    emoji: "🧑‍🚀",
    bg: "bg-indigo-500/20 text-indigo-300",
    avatarFrameId: "frame_01",
  },
  {
    id: "rival_4",
    name: "Sofia Hubble",
    title: "Cadete do Cosmos",
    baseXp: 0,
    avatarUnsplashId: "photo-1506318137071-a8e063b4bec0",
    emoji: "🌠",
    bg: "bg-violet-500/20 text-violet-300",
    avatarFrameId: "frame_01",
  },
  {
    id: "rival_5",
    name: "Lucas Pulsar",
    title: "Cadete do Cosmos",
    baseXp: 0,
    avatarUnsplashId: "photo-1563089145-599997674d42",
    emoji: "⚡",
    bg: "bg-fuchsia-500/20 text-fuchsia-300",
    avatarFrameId: "frame_01",
  },
  {
    id: "rival_6",
    name: "Thiago Hawking",
    title: "Cadete do Cosmos",
    baseXp: 0,
    avatarUnsplashId: "photo-1485827404703-89b55fcc595e",
    emoji: "🧠",
    bg: "bg-purple-500/20 text-purple-300",
    avatarFrameId: "frame_01",
  },
  {
    id: "rival_7",
    name: "Camila Kepler",
    title: "Cadete do Cosmos",
    baseXp: 0,
    avatarUnsplashId: "photo-1534447677768-be436bb09401",
    emoji: "🔥",
    bg: "bg-orange-500/20 text-orange-300",
    avatarFrameId: "frame_01",
  },
  {
    id: "rival_8",
    name: "Gabriel Copernicus",
    title: "Cadete do Cosmos",
    baseXp: 0,
    avatarUnsplashId: "photo-1569336415962-a4bd9f69cd83",
    emoji: "🔷",
    bg: "bg-teal-500/20 text-teal-300",
    avatarFrameId: "frame_01",
  },
  {
    id: "rival_9",
    name: "Beatriz Laniakea",
    title: "Cadete do Cosmos",
    baseXp: 0,
    avatarUnsplashId: "photo-1618005182384-a83a8bd57fbe",
    emoji: "🔮",
    bg: "bg-pink-500/20 text-pink-300",
    avatarFrameId: "frame_01",
  },
  {
    id: "rival_10",
    name: "Guilherme Quasar",
    title: "Cadete do Cosmos",
    baseXp: 0,
    avatarUnsplashId: "photo-1535223289827-42f1e9919769",
    emoji: "⚙️",
    bg: "bg-neutral-800/40 text-neutral-400",
    avatarFrameId: "frame_01",
  },
];

const AVATARS_DB: Record<
  string,
  { emoji: string; bg: string; unsplashId: string }
> = {
  default: {
    emoji: "🚀",
    bg: "bg-blue-500/20 text-blue-300",
    unsplashId: "photo-1516849841032-87cbac4d88f7",
  },
  avatar_02: {
    emoji: "⚡",
    bg: "bg-fuchsia-500/20 text-fuchsia-300",
    unsplashId: "photo-1563089145-599997674d42",
  },
  avatar_03: {
    emoji: "🤖",
    bg: "bg-purple-500/20 text-purple-300",
    unsplashId: "photo-1485827404703-89b55fcc595e",
  },
  avatar_04: {
    emoji: "🔌",
    bg: "bg-teal-500/20 text-teal-300",
    unsplashId: "photo-1531297484001-80022131f5a1",
  },
  avatar_05: {
    emoji: "🛰️",
    bg: "bg-sky-500/20 text-sky-300",
    unsplashId: "photo-1502134249126-9f3755a50d78",
  },
  avatar_06: {
    emoji: "🛰️",
    bg: "bg-indigo-500/20 text-indigo-300",
    unsplashId: "photo-1454789548928-9efd52dc4031",
  },
  avatar_07: {
    emoji: "🛡️",
    bg: "bg-red-500/20 text-red-300",
    unsplashId: "photo-1635070041078-e363dbe005cb",
  },
  avatar_08: {
    emoji: "🔮",
    bg: "bg-pink-500/20 text-pink-300",
    unsplashId: "photo-1618005182384-a83a8bd57fbe",
  },
  avatar_09: {
    emoji: "📡",
    bg: "bg-green-500/20 text-green-300",
    unsplashId: "photo-1488590528505-98d2b5aba04b",
  },
  avatar_10: {
    emoji: "💫",
    bg: "bg-yellow-500/20 text-yellow-300",
    unsplashId: "photo-1528722828814-77b9b83aafb2",
  },
  avatar_11: {
    emoji: "📡",
    bg: "bg-stone-500/20 text-stone-300",
    unsplashId: "photo-1451187580459-43490279c0fa",
  },
  avatar_12: {
    emoji: "🌌",
    bg: "bg-violet-500/20 text-violet-300",
    unsplashId: "photo-1506318137071-a8e063b4bec0",
  },
  avatar_13: {
    emoji: "🔥",
    bg: "bg-orange-500/20 text-orange-300",
    unsplashId: "photo-1534447677768-be436bb09401",
  },
  avatar_14: {
    emoji: "🐱",
    bg: "bg-cyan-500/20 text-cyan-300",
    unsplashId: "photo-1639762681485-074b7f938ba0",
  },
  avatar_15: {
    emoji: "🌌",
    bg: "bg-emerald-500/20 text-emerald-300",
    unsplashId: "photo-1464802686167-b939a6910659",
  },
  avatar_16: {
    emoji: "🧠",
    bg: "bg-blue-600/20 text-blue-300",
    unsplashId: "photo-1478760329108-5c3ed9d495a0",
  },
  avatar_17: {
    emoji: "🧑‍🚀",
    bg: "bg-sky-600/20 text-sky-300",
    unsplashId: "photo-1446776811953-b23d57bd21aa",
  },
  avatar_18: {
    emoji: "📶",
    bg: "bg-indigo-600/20 text-indigo-400",
    unsplashId: "photo-1451186859696-371d9477be93",
  },
  avatar_19: {
    emoji: "👁️",
    bg: "bg-purple-600/20 text-purple-400",
    unsplashId: "photo-1506703719100-a0f3a48c0f86",
  },
  avatar_20: {
    emoji: "✨",
    bg: "bg-pink-600/20 text-pink-400",
    unsplashId: "photo-1543722530-d2c3201371e7",
  },
  avatar_21: {
    emoji: "💡",
    bg: "bg-amber-600/20 text-amber-400",
    unsplashId: "photo-1542751371-adc38448a05e",
  },
  avatar_22: {
    emoji: "🔷",
    bg: "bg-teal-600/20 text-teal-400",
    unsplashId: "photo-1569336415962-a4bd9f69cd83",
  },
  avatar_23: {
    emoji: "💎",
    bg: "bg-slate-600/20 text-slate-400",
    unsplashId: "photo-1620641788421-7a1c342ea42e",
  },
  avatar_24: {
    emoji: "🧬",
    bg: "bg-emerald-600/20 text-emerald-400",
    unsplashId: "photo-1518770660439-4636190af475",
  },
  avatar_25: {
    emoji: "🌍",
    bg: "bg-cyan-600/20 text-cyan-400",
    unsplashId: "photo-1614728423169-3f65fd722b7e",
  },
  avatar_26: {
    emoji: "☄️",
    bg: "bg-red-600/20 text-red-400",
    unsplashId: "photo-1614728894747-a83421e2b9c9",
  },
  avatar_27: {
    emoji: "🔥",
    bg: "bg-orange-600/20 text-orange-400",
    unsplashId: "photo-1608178398319-48f814d0750c",
  },
  avatar_28: {
    emoji: "⚫",
    bg: "bg-neutral-800/25 text-neutral-400",
    unsplashId: "photo-1557672172-298e090bd0f1",
  },
  avatar_29: {
    emoji: "🤖",
    bg: "bg-lime-500/20 text-lime-400",
    unsplashId: "photo-1589254065878-42c9da997008",
  },
  avatar_30: {
    emoji: "🏛️",
    bg: "bg-zinc-600/20 text-zinc-400",
    unsplashId: "photo-1634017839464-5c339ebe3cb4",
  },
  avatar_31: {
    emoji: "🪐",
    bg: "bg-yellow-600/20 text-yellow-500",
    unsplashId: "photo-1614313913007-2b4ae8ce32d6",
  },
  avatar_32: {
    emoji: "⭐",
    bg: "bg-zinc-500/20 text-zinc-300",
    unsplashId: "photo-1475274047050-1d0c0975c63e",
  },
  avatar_33: {
    emoji: "🚀",
    bg: "bg-red-700/20 text-red-500",
    unsplashId: "photo-1541185933-ef5d8ed016c2",
  },
  avatar_34: {
    emoji: "🌌",
    bg: "bg-violet-700/20 text-violet-500",
    unsplashId: "photo-1462331940025-496dfbfc7564",
  },
  avatar_35: {
    emoji: "🌀",
    bg: "bg-blue-700/20 text-blue-500",
    unsplashId: "photo-1444703686981-a3abbc4d4fe3",
  },
  avatar_36: {
    emoji: "🌐",
    bg: "bg-emerald-700/20 text-emerald-500",
    unsplashId: "photo-1541701494587-cb58502866ab",
  },
  avatar_37: {
    emoji: "💫",
    bg: "bg-pink-700/20 text-pink-500",
    unsplashId: "photo-1506157786151-b8491531f063",
  },
  avatar_38: {
    emoji: "🌠",
    bg: "bg-rose-700/20 text-rose-500",
    unsplashId: "photo-1538370965046-79c0d6907d47",
  },
  avatar_39: {
    emoji: "✨",
    bg: "bg-lime-700/20 text-lime-500",
    unsplashId: "photo-1516339901601-2e1b62dc0c45",
  },
  avatar_40: {
    emoji: "🌈",
    bg: "bg-violet-600/20 text-violet-400",
    unsplashId: "photo-1579546929518-9e396f3cc809",
  },
  avatar_41: {
    emoji: "🌀",
    bg: "bg-cyan-700/20 text-cyan-500",
    unsplashId: "photo-1614730321146-b6fa6a46bcb4",
  },
  avatar_42: {
    emoji: "⚙️",
    bg: "bg-neutral-950/40 text-neutral-400",
    unsplashId: "photo-1535223289827-42f1e9919769",
  },
  avatar_43: {
    emoji: "🛰️",
    bg: "bg-sky-700/20 text-sky-500",
    unsplashId: "photo-1451187580459-43490279c0fa",
  },
  avatar_44: {
    emoji: "📶",
    bg: "bg-stone-700/20 text-stone-500",
    unsplashId: "photo-1550751827-4bd374c3f58b",
  },
  avatar_45: {
    emoji: "💡",
    bg: "bg-amber-600/20 text-amber-500",
    unsplashId: "photo-1544256718-3bcf237f3974",
  },
  avatar_46: {
    emoji: "🚀",
    bg: "bg-teal-700/20 text-teal-500",
    unsplashId: "photo-1517976487492-5750f3195933",
  },
  avatar_47: {
    emoji: "💾",
    bg: "bg-green-700/20 text-green-500",
    unsplashId: "photo-1526374965328-7f61d4dc18c5",
  },
  avatar_48: {
    emoji: "🧠",
    bg: "bg-fuchsia-700/20 text-fuchsia-500",
    unsplashId: "photo-1558494949-ef010cbdcc31",
  },
  avatar_49: {
    emoji: "🌀",
    bg: "bg-pink-700/20 text-pink-500",
    unsplashId: "photo-1462331940025-496dfbfc7564",
  },
  avatar_50: {
    emoji: "🔮",
    bg: "bg-indigo-700/20 text-indigo-500",
    unsplashId: "photo-1550684848-fac1c5b4e853",
  },
};

const getAvatarUrl = (idOrUrl: string) => {
  if (
    idOrUrl.startsWith("http://") ||
    idOrUrl.startsWith("https://") ||
    idOrUrl.startsWith("data:image") ||
    idOrUrl.startsWith("/")
  ) {
    return idOrUrl;
  }
  return `https://images.unsplash.com/${idOrUrl}?auto=format&fit=crop&w=150&h=150&q=80`;
};

export default function RankingPage() {
  const [stats, setStats] = useState<SimuladoStats | null>(null);
  const [activeTab, setActiveTab] = useState<
    "geral" | "linguagens" | "matematica" | "humanas" | "natureza"
  >("geral");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUser, setCurrentUser] = useState<{
    name: string;
    email?: string;
    avatarId?: string;
    id?: string;
    customAvatarUrl?: string;
    avatarFrameId?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  // Supabase Global Real-time Ranking State variables
  const [globalPlayers, setGlobalPlayers] = useState<any[]>([]);
  const [isRealtime, setIsRealtime] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  const [isOwnerBackendVerified, setIsOwnerBackendVerified] = useState(false);

  useEffect(() => {
    const verifyOwnerBackend = async () => {
      if (!currentUser || !currentUser.email) {
        setIsOwnerBackendVerified(false);
        return;
      }
      if (currentUser.email.toLowerCase() !== "klession@gmail.com") {
        setIsOwnerBackendVerified(false);
        return;
      }
      try {
        const client = await getSupabase();
        const { data: sessionData } = await client.auth.getSession();
        const token = sessionData?.session?.access_token;
        if (!token) {
          setIsOwnerBackendVerified(false);
          return;
        }
        const verifyRes = await fetch("/api/profile/validate-owner", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        if (verifyRes.ok) {
          const checkResult = await verifyRes.json();
          setIsOwnerBackendVerified(!!checkResult.isOwner);
        } else {
          setIsOwnerBackendVerified(false);
        }
      } catch (err) {
        console.error("Erro na verificação de proprietário no ranking:", err);
        setIsOwnerBackendVerified(false);
      }
    };
    verifyOwnerBackend();
  }, [currentUser]);

  const isOwnerPlayer = (player: any) => {
    if (!player) return false;
    
    // Check if current user is owner
    if (player.isCurrentUser) {
      return isOwnerBackendVerified && currentUser?.email === "klession@gmail.com";
    }
    
    // For other players on the leaderboard, they can only be the owner if they have the frame_owner and we know they can't spoof it because of our strict sync guard.
    return player.avatarFrameId === "frame_owner" || player.avatar_frame_id === "frame_owner";
  };

  useEffect(() => {
    setStats(getStats());

    // Attempt to load the active logged user from localStorage
    if (typeof window !== "undefined") {
      try {
        const logged = localStorage.getItem("cosmos_logged_user");
        if (logged) {
          const parsed = JSON.parse(logged);
          setCurrentUser(parsed);
          
          // Ensure latest local progression is synced to real-time dashboard on mount
          syncAllDataToSupabase().catch((err) => {
            console.warn("[Ranking] Initial score sync-to-cloud caught:", err);
          });
        } else {
          const guestProfileStr = localStorage.getItem("user_profile");
          if (guestProfileStr) {
            const guestParsed = JSON.parse(guestProfileStr);
            setCurrentUser({
              ...guestParsed,
              id: "current_user_id",
            });
          }
        }
      } catch (e) {
        console.warn("Could not retrieve logged user", e);
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  // Fetch the ranking data from Supabase
  const loadRankingFromSupabase = async () => {
    try {
      const client = await getSupabase();
      
      const { data, error } = await client
        .from('ranking')
        .select('*')
        .order('xp', { ascending: false })
        .limit(200);

      if (error) {
        console.warn("[Ranking Page] Error loading global ranking:", error.message);
        setDbError(error.message);
        return;
      }

      if (data) {
        setGlobalPlayers(data);
        setIsRealtime(true);
        setDbError(null);
      }
    } catch (err: any) {
      console.warn("[Ranking Page] Failed to query Supabase:", err);
      setDbError(err?.message || String(err));
    }
  };

  // Set up real-time listener for ranking changes
  useEffect(() => {
    let channel: any = null;

    const setupRealtime = async () => {
      await loadRankingFromSupabase();

      try {
        const client = await getSupabase();
        
        channel = client
          .channel('ranking-realtime')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'ranking' },
            (payload: any) => {
              console.log("[Ranking Page] Real-time scoreboard update received:", payload);
              loadRankingFromSupabase();
            }
          )
          .subscribe();
      } catch (err) {
        console.warn("[Ranking Page] Failed to initialize Supabase realtime subscription:", err);
      }
    };

    if (currentUser?.id) {
      setupRealtime();
    }

    return () => {
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, [currentUser?.id]);

  const xpInfo = getExperienceDetails(stats);

  const getAreaScore = (playerStats: any, area: string) => {
    if (!playerStats) return 0;
    const item = playerStats[area];
    if (!item) return 0;
    // Area score: correct * 50 points
    return (item.correct || 0) * 50;
  };

  // Generate ranking list
  const getSortedRankingList = () => {
    // 1. Create native representation of the user
    const username = currentUser?.name || "Você (Explorador)";

    let userImgSrc = "photo-1614728423169-3f65fd722b7e"; // standard Space Unsplash Id fallback
    let userEmoji = "🚀";
    let userBg = "bg-primary/20 text-primary-light";

    if (currentUser?.avatarId === "custom" && currentUser?.customAvatarUrl) {
      userImgSrc = currentUser.customAvatarUrl;
      userEmoji = "🧑‍🎤";
    } else if (
      currentUser?.avatarId &&
      currentUser.avatarId.startsWith("avatar_premium_")
    ) {
      const numPart = currentUser.avatarId.replace("avatar_premium_", "");
      userImgSrc = `/avatars/avatar_${numPart}.png`;
      const isSpecial = numPart.endsWith("A");
      userEmoji = isSpecial ? "👑" : "⭐";
      userBg = isSpecial
        ? "bg-purple-500/10 text-purple-300"
        : "bg-amber-500/10 text-amber-300";
    } else if (
      currentUser?.avatarId &&
      currentUser.avatarId.startsWith("avatar_img_")
    ) {
      const numPart = currentUser.avatarId.replace("avatar_img_", "");
      userImgSrc = `/imagem_${numPart}.png`;
      const numPartInt = Math.max(0, parseInt(numPart) - 1);
      const celestialEmojis = ["🪐", "🌌", "⭐", "☄️", "🛰️", "👽", "🛸", "🚀", "🔮", "🔭"];
      userEmoji = celestialEmojis[numPartInt % celestialEmojis.length] || "🚀";
      const bgList = [
        "bg-blue-500/20 text-blue-300",
        "bg-indigo-500/20 text-indigo-300",
        "bg-purple-500/20 text-purple-300",
        "bg-pink-500/20 text-pink-300",
        "bg-red-500/20 text-red-300",
        "bg-orange-500/20 text-orange-300",
        "bg-amber-500/20 text-amber-300",
        "bg-yellow-500/20 text-yellow-300",
        "bg-teal-500/20 text-teal-300",
        "bg-emerald-500/20 text-emerald-300",
      ];
      userBg = bgList[numPartInt % bgList.length] || "bg-blue-500/20 text-blue-300";
    } else if (currentUser?.avatarId && AVATARS_DB[currentUser.avatarId]) {
      const dbEntry = AVATARS_DB[currentUser.avatarId];
      userImgSrc = dbEntry.unsplashId;
      userEmoji = dbEntry.emoji;
      userBg = dbEntry.bg;
    }

    const defaultUserStats: SimuladoStats = {
      linguagens: { correct: 0, incorrect: 0, answered: 0 },
      matematica: { correct: 0, incorrect: 0, answered: 0 },
      humanas: { correct: 0, incorrect: 0, answered: 0 },
      natureza: { correct: 0, incorrect: 0, answered: 0 },
    };

    const userEntry = {
      id: currentUser?.id || "current_user_id",
      isCurrentUser: true,
      name: username,
      title: xpInfo.baseTitle,
      xp: xpInfo.xp,
      stats: stats || defaultUserStats,
      emoji: userEmoji,
      bg: userBg,
      avatarUnsplashId: userImgSrc,
      avatarFrameId: currentUser?.avatarFrameId || "frame_01",
    };

    // 2. Generate stats for rivals in subcategories based on their baseXp
    const fullList = RIVAL_PLAYERS_DATA.map((rival) => {
      // Simulate subcategory stats for the rival based on overall XP
      const ratio = rival.baseXp / 5000; // factor
      const simulatedLinguagens = Math.round(15 * ratio);
      const simulatedMatematica = Math.round(15 * ratio);
      const simulatedHumanas = Math.round(15 * ratio);
      const simulatedNatureza = Math.round(15 * ratio);

      const simulatedStats: SimuladoStats = {
        linguagens: {
          correct: simulatedLinguagens,
          incorrect: Math.round(simulationIncorrect(simulatedLinguagens)),
          answered: simulatedLinguagens * 2,
        },
        matematica: {
          correct: simulatedMatematica,
          incorrect: Math.round(simulationIncorrect(simulatedMatematica)),
          answered: simulatedMatematica * 2,
        },
        humanas: {
          correct: simulatedHumanas,
          incorrect: Math.round(simulationIncorrect(simulatedHumanas)),
          answered: simulatedHumanas * 2,
        },
        natureza: {
          correct: simulatedNatureza,
          incorrect: Math.round(simulationIncorrect(simulatedNatureza)),
          answered: simulatedNatureza * 2,
        },
      };

      return {
        id: rival.id,
        isCurrentUser: false,
        name: rival.name,
        title: rival.title,
        xp: rival.baseXp,
        stats: simulatedStats,
        emoji: rival.emoji,
        bg: rival.bg,
        avatarUnsplashId: rival.avatarUnsplashId,
        avatarFrameId: rival.avatarFrameId,
      };
    });

    function simulationIncorrect(correct: number) {
      return correct > 0 ? Math.max(1, correct * 0.3) : 0;
    }

    fullList.push(userEntry);

    // 3. Map global players from Supabase safely, excluding system/metadata records
    const mappedGlobal = globalPlayers
      .filter((p) => p && p.id !== "system_season" && !p.id.startsWith("system_"))
      .map((player) => {
      const isUser = player.id === currentUser?.id;
      
      const avatarId = isUser && currentUser?.avatarId ? currentUser.avatarId : player.avatar_id;
      const customAvatarUrl = isUser && currentUser?.customAvatarUrl ? currentUser.customAvatarUrl : player.custom_avatar_url;
      const avatarFrameId = isUser && currentUser?.avatarFrameId ? currentUser.avatarFrameId : player.avatar_frame_id;
      const playerName = isUser && currentUser?.name ? currentUser.name : player.name;

      let playerImgSrc = customAvatarUrl || "photo-1614728423169-3f65fd722b7e";
      let playerEmoji = "🚀";
      let playerBg = "bg-primary/20 text-primary-light";

      if (avatarId === "custom" && customAvatarUrl) {
        playerImgSrc = customAvatarUrl;
        playerEmoji = "🧑‍🎤";
      } else if (avatarId && avatarId.startsWith("avatar_premium_")) {
        const numPart = avatarId.replace("avatar_premium_", "");
        playerImgSrc = `/avatars/avatar_${numPart}.png`;
        const isSpecial = numPart.endsWith("A");
        playerEmoji = isSpecial ? "👑" : "⭐";
        playerBg = isSpecial
          ? "bg-purple-500/10 text-purple-300"
          : "bg-amber-500/10 text-amber-300";
      } else if (avatarId && avatarId.startsWith("avatar_img_")) {
        const numPart = avatarId.replace("avatar_img_", "");
        playerImgSrc = `/imagem_${numPart}.png`;
        const numPartInt = Math.max(0, parseInt(numPart) - 1);
        const celestialEmojis = ["🪐", "🌌", "⭐", "☄️", "🛰️", "👽", "🛸", "🚀", "🔮", "🔭"];
        playerEmoji = celestialEmojis[numPartInt % celestialEmojis.length] || "🚀";
        const bgList = [
          "bg-blue-500/20 text-blue-300",
          "bg-indigo-500/20 text-indigo-300",
          "bg-purple-500/20 text-purple-300",
          "bg-pink-500/20 text-pink-300",
          "bg-red-500/20 text-red-300",
          "bg-orange-500/20 text-orange-300",
          "bg-amber-500/20 text-amber-300",
          "bg-yellow-500/20 text-yellow-300",
          "bg-teal-500/20 text-teal-300",
          "bg-emerald-500/20 text-emerald-300",
        ];
        playerBg = bgList[numPartInt % bgList.length] || "bg-blue-500/20 text-blue-300";
      } else if (avatarId && AVATARS_DB[avatarId]) {
        const dbEntry = AVATARS_DB[avatarId];
        playerImgSrc = dbEntry.unsplashId;
        playerEmoji = dbEntry.emoji;
        playerBg = dbEntry.bg;
      }

      const playerXpInfo = getExperienceDetails(player.stats || {});

      return {
        id: player.id,
        isCurrentUser: isUser,
        name: playerName,
        title: playerXpInfo.baseTitle,
        xp: player.xp,
        stats: player.stats || {
          linguagens: { correct: 0, incorrect: 0, answered: 0 },
          matematica: { correct: 0, incorrect: 0, answered: 0 },
          humanas: { correct: 0, incorrect: 0, answered: 0 },
          natureza: { correct: 0, incorrect: 0, answered: 0 },
        },
        emoji: playerEmoji,
        bg: playerBg,
        avatarUnsplashId: playerImgSrc,
        avatarFrameId: avatarFrameId || "frame_01",
      };
    });

    // 4. Combine real mapped players with simulated players to keep the list lively and competitive.
    // If a real player has the same ID or name as a rival, we exclude the rival to prevent duplication.
    const realPlayerIds = new Set(mappedGlobal.map(p => p.id));
    const realPlayerNames = new Set(mappedGlobal.map(p => p.name.toLowerCase()));
    
    const filteredRivals = fullList.filter(rival => 
      !rival.isCurrentUser && 
      !realPlayerIds.has(rival.id) && 
      !realPlayerNames.has(rival.name.toLowerCase())
    );

    // If we have real global players, merge them with the remaining rivals so the Cosmos is always crowded with stars!
    const combinedList = mappedGlobal.length > 0 
      ? [...mappedGlobal, ...filteredRivals] 
      : fullList;

    // Ensure the current user entry is always present in the combined list
    const hasCurrentUser = combinedList.some(p => p.isCurrentUser);
    if (!hasCurrentUser) {
      combinedList.push(userEntry);
    }

    // Sort based on active tab
    if (activeTab === "geral") {
      combinedList.sort((a, b) => b.xp - a.xp);
    } else {
      combinedList.sort((a, b) => {
        const scoreA = getAreaScore(a.stats, activeTab);
        const scoreB = getAreaScore(b.stats, activeTab);
        if (scoreB !== scoreA) return scoreB - scoreA;
        return b.xp - a.xp; // tiebreaker
      });
    }

    // Filter by search query
    return combinedList.filter((p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  };

  const sortedList = getSortedRankingList();

  const systemSeasonRecord = globalPlayers.find((p) => p && p.id === "system_season");
  const currentSeasonNum = systemSeasonRecord ? (typeof systemSeasonRecord.xp === "number" ? systemSeasonRecord.xp : 0) : 0;

  // Pick top 3 for podium
  const podium = sortedList.slice(0, 3);
  const remaining = sortedList.slice(3);

  // Find user's position
  const userRankIndex = sortedList.findIndex((p) => p.isCurrentUser);
  const userRank = userRankIndex !== -1 ? userRankIndex + 1 : 0;

  const tabsConfig = [
    {
      key: "geral" as const,
      label: "Geral",
      icon: Trophy,
      activeColor: "text-primary",
    },
    {
      key: "linguagens" as const,
      label: "Línguas",
      icon: BookOpen,
      activeColor: "text-indigo-400",
    },
    {
      key: "matematica" as const,
      label: "Matemática",
      icon: Calculator,
      activeColor: "text-amber-400",
    },
    {
      key: "humanas" as const,
      label: "Humanas",
      icon: Globe,
      activeColor: "text-cyan-400",
    },
    {
      key: "natureza" as const,
      label: "Natureza",
      icon: FlaskConical,
      activeColor: "text-emerald-400",
    },
  ];

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center relative">
        <div className="starfield" />
        <div className="absolute top-[30%] left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-primary/10 blur-[90px] rounded-full -z-10 animate-pulse" />
        <div className="flex flex-col items-center gap-4 text-center pb-20">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-2 border-t-primary-light border-r-transparent border-b-transparent border-l-transparent animate-spin" />
            <Trophy className="w-5 h-5 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <p className="text-[11px] font-black uppercase tracking-widest text-primary-light">
            Sintonizando Cosmos...
          </p>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!currentUser || !currentUser.id) {
    return (
      <div className="h-screen flex flex-col overflow-hidden relative">
        <div className="starfield" />

        {/* Dynamic Background Glows */}
        <div className="absolute top-[10%] left-[-10%] w-[500px] h-[500px] bg-primary/15 blur-[130px] rounded-full -z-10" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-secondary/15 blur-[120px] rounded-full -z-10" />

        {/* Header */}
        <header className="pt-6 px-6 max-w-xl mx-auto w-full flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/15 rounded-2xl border border-primary/20 text-primary relative">
                <Trophy className="w-5 h-5 text-primary-light" />
                <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full" />
              </div>
              <div>
                <h1 className="font-display text-xl font-black uppercase tracking-widest text-white leading-none">
                  Ranking Estelar
                </h1>
                <p className="text-[10px] text-on-surface-variant uppercase tracking-[0.2em] mt-1">
                  Órbita de Estudantes
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/5 rounded-full text-[10px] font-black uppercase tracking-wider text-yellow-300">
              <Flame className="w-3.5 h-3.5" />
              Temporada {currentSeasonNum}
            </div>
          </div>
        </header>

        {/* Blocked message area in the main scrollable section */}
        <main className="flex-1 overflow-y-auto px-6 max-w-xl mx-auto w-full flex flex-col items-center justify-center space-y-7 pb-28 text-center mt-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full relative py-8 px-6 bg-[#0c1017]/85 backdrop-blur-md rounded-3xl border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.5)] overflow-hidden"
          >
            {/* Visual lock orb with custom glowing layers */}
            <div className="relative w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <div className="absolute inset-x-0 inset-y-0 rounded-full bg-primary/10 blur-md animate-pulse" />
              <div className="w-16 h-16 bg-[#131924] rounded-2xl border border-white/15 flex items-center justify-center relative shadow-lg">
                <Lock className="w-7 h-7 text-primary-light animate-bounce" />
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="font-display text-lg font-black uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-primary-light to-secondary">
                Acesso Restrito
              </h2>
              <p className="text-xs text-on-surface-variant leading-relaxed font-medium">
                O Quadro de Classificação de Exploradores é um espaço
                competitivo oficial de conquistas. Para fazer parte, é
                necessário possuir uma conta de explorador ativa.
              </p>
            </div>

            {/* List of Benefits */}
            <div className="my-6 border-t border-b border-white/5 py-5 text-left space-y-3.5 max-w-sm mx-auto">
              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-primary/10 rounded-lg text-primary-light mt-0.5">
                  <Star className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">
                    Registre seus Pontos
                  </h4>
                  <p className="text-[10.5px] text-on-surface-variant/80 mt-0.5">
                    Suas respostas corretas se convertem em XP dinâmico para
                    subir de escalão.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-amber-500/10 rounded-lg text-amber-300 mt-0.5">
                  <Trophy className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">
                    Dispute com Outros Exploradores
                  </h4>
                  <p className="text-[10.5px] text-on-surface-variant/80 mt-0.5">
                    Acompanhe seu progresso contra estudantes de todo o Cosmos e
                    lidere o topo.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-300 mt-0.5">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">
                    Desbloqueie Conquistas Cósmicas
                  </h4>
                  <p className="text-[10.5px] text-on-surface-variant/80 mt-0.5">
                    Ganhe troféus exclusivos com base nas suas taxas de acerto e
                    estudos.
                  </p>
                </div>
              </div>
            </div>

            {/* Core Action Button */}
            <Link href="/profile" className="block w-full">
              <span className="block w-full relative group overflow-hidden bg-gradient-to-r from-primary to-secondary hover:opacity-95 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-[0_0_20px_rgba(var(--color-primary),0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer">
                Entrar ou Criar Conta
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Link>
          </motion.div>
        </main>

        <BottomNav />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden relative">
      <div className="starfield" />

      {/* Dynamic Background Glows */}
      <div className="absolute top-[-5%] left-[-10%] w-[500px] h-[500px] bg-primary/10 blur-[130px] rounded-full -z-10" />
      <div className="absolute bottom-[-5%] right-[-10%] w-[400px] h-[400px] bg-secondary/10 blur-[120px] rounded-full -z-10" />

      {/* Header */}
      <header className="pt-6 px-6 max-w-xl mx-auto w-full flex flex-col space-y-4">
        <div className="flex flex-col items-center justify-center text-center gap-4">
          <div className="flex flex-col items-center gap-3">
            <div className="p-2.5 bg-primary/15 rounded-2xl border border-primary/20 text-primary relative shrink-0">
              <Trophy className="w-5 h-5 text-primary-light" />
              <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full" />
            </div>
            <div>
              <h1 className="font-display text-xl font-black uppercase tracking-widest text-white leading-none">
                Ranking Estelar
              </h1>
              <p className="text-[10px] text-on-surface-variant uppercase tracking-[0.2em] mt-1 text-center">
                Órbita de Estudantes
              </p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2">
            {isRealtime ? (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[9px] font-black uppercase tracking-wider text-emerald-400 animate-bounce">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Tempo Real
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/5 rounded-full text-[9px] font-black uppercase tracking-wider text-white/40">
                <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
                Offline
              </div>
            )}
            <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-[9px] font-black uppercase tracking-wider text-yellow-300">
              <Flame className="w-3.5 h-3.5 text-yellow-400" />
              Temporada {currentSeasonNum}
            </div>
          </div>
        </div>

        {/* Search tool & Admin actions */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-on-surface-variant/70 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar explorador no Cosmos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#0e121a]/80 backdrop-blur-md rounded-xl text-xs text-white border border-white/5 focus:border-primary/40 focus:outline-none placeholder-white/30 transition-all font-medium"
            />
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {tabsConfig.map((tab) => {
            const TabIcon = tab.icon;
            const isTabActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10.5px] font-bold uppercase tracking-wider whitespace-nowrap border transition-all cursor-pointer",
                  isTabActive
                    ? "bg-white/10 text-white border-white/20 shadow-md shadow-black/10"
                    : "bg-transparent text-white/40 border-transparent hover:text-white/70",
                )}
              >
                <TabIcon
                  className={cn(
                    "w-3.5 h-3.5",
                    isTabActive ? tab.activeColor : "text-white/40",
                  )}
                />
                {tab.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content Scrollable */}
      <main className="flex-1 overflow-y-auto px-6 max-w-xl mx-auto space-y-6 pb-28 w-full mt-2">
        {/* Active user ranking spotlight dashboard (only shown if no filtering queries are active) */}
        {!searchQuery && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel p-4 rounded-2xl border border-primary/20 bg-primary/5 flex items-center justify-between relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-16 h-16 bg-primary/10 blur-xl rounded-full" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-secondary p-[1px] flex items-center justify-center">
                <div className="bg-[#0e1220] w-full h-full rounded-xl flex flex-col items-center justify-center">
                  <span className="text-[9px] font-black uppercase text-primary-light">
                    Pos
                  </span>
                  <span className="text-sm font-black text-white leading-none">
                    #{userRank}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-[#93c5fd]">
                  Sua Órbita Atual
                </p>
                <h4 className="font-bold text-xs text-white truncate max-w-[170px]">
                  {currentUser?.name || "Você (Explorador)"}
                </h4>
              </div>
            </div>

            <div className="text-right">
              <p className="text-xs font-black uppercase tracking-wider text-white">
                {activeTab === "geral"
                  ? `${xpInfo.xp} XP`
                  : `${getAreaScore(stats, activeTab)} PTS`}
              </p>
              <p className="text-[8px] font-bold uppercase tracking-widest text-on-surface-variant/80">
                {activeTab === "geral" ? `Nível ${xpInfo.level}` : "Nesta área"}
              </p>
            </div>
          </motion.div>
        )}

        {/* Podium Component */}
        {podium.length > 0 && !searchQuery && (
          <section className="pt-4 pb-2">
            <div className="flex items-end justify-center gap-2.5 mt-8 relative">
              {/* Podium Spot 2 (Left) */}
              {podium[1] && (
                <motion.div
                  key={podium[1].id}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 350, damping: 32 }}
                  className="flex flex-col items-center flex-1 max-w-[110px] text-center"
                >
                  <div className="relative mb-2">
                    {/* Ring glow */}
                    <div className="absolute -inset-1 rounded-full bg-slate-400/20 blur-md" />
                    {/* Circle image container */}
                    <div className="w-14 h-14 rounded-full border-2 border-slate-400 overflow-hidden relative bg-[#131924]">
                      <img
                        src={getAvatarUrl(podium[1].avatarUnsplashId)}
                        alt={podium[1].name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    {/* Position badge */}
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-slate-400 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded-full shadow border border-white/20">
                      2º
                    </div>
                  </div>
                  <span className="font-bold text-[11px] text-white truncate w-full px-1 flex items-center justify-center gap-0.5">
                    {isOwnerPlayer(podium[1]) && <Crown className="w-2.5 h-2.5 text-amber-400 shrink-0 fill-amber-400/20 animate-pulse" />}
                    {podium[1].name}
                  </span>
                  <span className="text-[9px] text-slate-300 font-extrabold block">
                    {activeTab === "geral"
                      ? `${podium[1].xp} XP`
                      : `${getAreaScore(podium[1].stats, activeTab)} PTS`}
                  </span>
                </motion.div>
              )}

              {/* Podium Spot 1 (Center) */}
              {podium[0] && (
                <motion.div
                  key={podium[0].id}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 350, damping: 32 }}
                  className="flex flex-col items-center flex-1 max-w-[125px] text-center -translate-y-4"
                >
                  <div className="relative mb-2.5">
                    {/* Star particles */}
                    <Star className="w-4 h-4 text-yellow-400 absolute -top-5 left-1/2 -translate-x-1/2 animate-bounce fill-yellow-400" />
                    {/* Golden glow */}
                    <div className="absolute -inset-1.5 rounded-full bg-yellow-400/30 blur-lg" />
                    {/* Circle image container */}
                    <div className="w-18 h-18 rounded-full border-3 border-yellow-400 overflow-hidden relative bg-[#131924]">
                      <img
                        src={getAvatarUrl(podium[0].avatarUnsplashId)}
                        alt={podium[0].name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    {/* Position badge */}
                    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-950 font-black text-[10px] px-2.5 py-0.5 rounded-full shadow-lg border border-white/30 flex items-center gap-0.5">
                      1º 👑
                    </div>
                  </div>
                  <span className="font-extrabold text-[12px] text-white truncate w-full px-1 flex items-center justify-center gap-0.5">
                    {isOwnerPlayer(podium[0]) && <Crown className="w-3 h-3 text-amber-400 shrink-0 fill-amber-400/20 animate-bounce" />}
                    {podium[0].name}
                  </span>
                  <span className="text-xs text-yellow-300 font-black tracking-wide block">
                    {activeTab === "geral"
                      ? `${podium[0].xp} XP`
                      : `${getAreaScore(podium[0].stats, activeTab)} PTS`}
                  </span>
                </motion.div>
              )}

              {/* Podium Spot 3 (Right) */}
              {podium[2] && (
                <motion.div
                  key={podium[2].id}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 350, damping: 32 }}
                  className="flex flex-col items-center flex-1 max-w-[110px] text-center"
                >
                  <div className="relative mb-2">
                    {/* Ring glow */}
                    <div className="absolute -inset-1 rounded-full bg-amber-600/15 blur-md" />
                    {/* Circle image container */}
                    <div className="w-14 h-14 rounded-full border-2 border-amber-600 overflow-hidden relative bg-[#131924]">
                      <img
                        src={getAvatarUrl(podium[2].avatarUnsplashId)}
                        alt={podium[2].name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    {/* Position badge */}
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-amber-600 text-amber-50 font-black text-[9px] px-2 py-0.5 rounded-full shadow border border-white/20">
                      3º
                    </div>
                  </div>
                  <span className="font-bold text-[11px] text-white truncate w-full px-1 flex items-center justify-center gap-0.5">
                    {isOwnerPlayer(podium[2]) && <Crown className="w-2.5 h-2.5 text-amber-400 shrink-0 fill-amber-400/20 animate-pulse" />}
                    {podium[2].name}
                  </span>
                  <span className="text-[9px] text-amber-500 font-extrabold block">
                    {activeTab === "geral"
                      ? `${podium[2].xp} XP`
                      : `${getAreaScore(podium[2].stats, activeTab)} PTS`}
                  </span>
                </motion.div>
              )}
            </div>
          </section>
        )}

        {/* Remaining list */}
        <section className="space-y-2.5 pb-10">
          <h3 className="text-[10px] uppercase font-bold text-on-surface-variant tracking-[0.2em] mb-4">
            {searchQuery ? "Resultados da busca" : "Desafiadores do Universo"}
          </h3>

          <div className="space-y-2">
            {(searchQuery ? sortedList : remaining).map((player, index) => {
              // True rank computation
              const actualRank = searchQuery ? index + 1 : index + 4;
              const isUser = player.isCurrentUser;

              return (
                <motion.div
                  key={player.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 350,
                    damping: 32,
                    layout: { duration: 0.3 },
                  }}
                  className={cn(
                    "glass-panel p-3.5 rounded-2xl flex items-center justify-between border transition-all",
                    isUser
                      ? "border-primary-light/40 bg-gradient-to-r from-[#17223b] to-[#12192a] shadow-lg shadow-primary/5"
                      : "border-white/5 bg-white/5 hover:border-white/10 hover:bg-white/10",
                  )}
                >
                  <div className="flex items-center gap-3">
                    {/* Rank index */}
                    <span
                      className={cn(
                        "font-display text-xs font-black min-w-5 text-center",
                        actualRank === 1
                          ? "text-yellow-400"
                          : actualRank === 2
                            ? "text-slate-400"
                            : actualRank === 3
                              ? "text-amber-600"
                              : "text-on-surface-variant/60",
                      )}
                    >
                      #{actualRank}
                    </span>

                    {/* Avatar circle with Interactive Avatar Frame */}
                    <div className="relative mt-1 mb-1 shrink-0">
                      <AvatarFrame
                        size="sm"
                        frameId={player.avatarFrameId}
                        isHoverable={false}
                      >
                        {player.avatarUnsplashId.startsWith("http://") ||
                        player.avatarUnsplashId.startsWith("https://") ||
                        player.avatarUnsplashId.startsWith("data:image") ||
                        player.avatarUnsplashId.startsWith("/") ? (
                          <div className="relative w-full h-full rounded-full overflow-hidden">
                            <img
                              src={player.avatarUnsplashId}
                              alt={player.name}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        ) : (
                          <div className="relative w-full h-full rounded-full overflow-hidden bg-surface-container-high">
                            <img
                              src={getAvatarUrl(player.avatarUnsplashId)}
                              alt={player.name}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        )}
                      </AvatarFrame>
                      {/* Emoji element */}
                      <span className="absolute -bottom-0.5 -right-0.5 text-[9px] bg-[#0d0c18] border border-white/10 w-4 h-4 rounded-full flex items-center justify-center select-none z-10">
                        {player.emoji}
                      </span>
                    </div>

                    {/* Meta info of username */}
                    <div className="max-w-[150px]">
                      <h4 className="text-[12px] font-bold text-white flex items-center gap-1.5 leading-tight truncate">
                        {player.name}
                        {isOwnerPlayer(player) && (
                          <span className="shrink-0 text-amber-400 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded-full text-[7.5px] font-black uppercase tracking-wider animate-pulse flex items-center gap-0.5 shadow-[0_0_8px_rgba(245,158,11,0.2)]">
                            <Crown className="w-2.5 h-2.5 fill-amber-400 shrink-0" />
                            ADM
                          </span>
                        )}
                        {isUser && !isOwnerPlayer(player) && (
                          <span className="px-1.5 py-0.2 bg-primary/20 text-primary-light text-[8px] font-black uppercase tracking-widest rounded-full border border-primary/20">
                            Você
                          </span>
                        )}
                      </h4>
                      <p className="text-[10px] text-on-surface-variant truncate">
                        {player.title}
                      </p>
                    </div>
                  </div>

                  {/* Score details */}
                  <div className="text-right">
                    <p
                      className={cn(
                        "text-[12.5px] font-black",
                        isUser ? "text-primary-light" : "text-white/90",
                      )}
                    >
                      {activeTab === "geral"
                        ? `${player.xp} XP`
                        : `${getAreaScore(player.stats, activeTab)} PTS`}
                    </p>
                    <p className="text-[8px] font-bold uppercase tracking-wider text-on-surface-variant/70">
                      {activeTab === "geral"
                        ? `Aprox. Lvl ${Math.floor(player.xp / 150) + 1}`
                        : `${getAreaAccuracy(player.stats, activeTab)}% acertos`}
                    </p>
                  </div>
                </motion.div>
              );
            })}

            {sortedList.length === 0 && (
              <div className="text-center py-12 space-y-3">
                <Compass className="w-10 h-10 text-on-surface-variant/40 mx-auto animate-pulse" />
                <p className="text-xs text-on-surface-variant font-medium">
                  Nenhum explorador encontrado para "{searchQuery}"
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Helper calculator block */}
        <section className="glass-panel p-4.5 rounded-2xl border border-white/5 bg-white/5 max-w-sm mx-auto text-center space-y-1">
          <p className="text-[9px] font-black text-primary-light uppercase tracking-widest flex items-center justify-center gap-1">
            <Zap className="w-3.5 h-3.5 text-yellow-300" />
            Como subir de posição?
          </p>
          <p className="text-[10.5px] text-on-surface-variant leading-relaxed">
            Cada resposta{" "}
            <span className="text-emerald-400 font-bold">correta</span> rende{" "}
            <span className="text-white font-bold">15 XP</span>. Cada resposta
            errada em seus simulados de estudos acumula{" "}
            <span className="text-white font-bold">5 XP</span> por esforço!
          </p>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}

function getAreaAccuracy(playerStats: any, area: string) {
  if (!playerStats) return 0;
  const item = playerStats[area];
  if (!item || !item.answered) return 0;
  return Math.round((item.correct / item.answered) * 100);
}
