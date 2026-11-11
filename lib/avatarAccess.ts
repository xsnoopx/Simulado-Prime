/**
 * Regras de acesso ao Avatar Personalizado.
 *
 * O envio da própria foto é liberado em duas situações:
 * 1. O jogador alcançou 200 XP de conhecimento; ou
 * 2. O jogador é PRIME (assinatura confirmada).
 *
 * As funções de leitura abaixo existem para que conquistas, perfil e o aviso
 * de PRIME usem exatamente a mesma fonte de dados do restante do aplicativo.
 */

export const XP_AVATAR_PERSONALIZADO = 200;

export function avatarPersonalizadoLiberado(
  xp: number,
  isPremium: boolean,
): boolean {
  const pontos = Number.isFinite(xp) ? Math.max(0, xp) : 0;
  return isPremium || pontos >= XP_AVATAR_PERSONALIZADO;
}

/** XP definido pelo painel administrativo (metadata `cosmos_xp`). */
export function lerXpDoAdmin(): number {
  if (typeof window === "undefined") return 0;
  const xp = Number(localStorage.getItem("cosmos_xp"));
  return Number.isFinite(xp) && xp > 0 ? xp : 0;
}

/** PRIME confirmado localmente (perfil ou sessão logada). */
export function lerPremiumLocal(): boolean {
  if (typeof window === "undefined") return false;

  try {
    const perfil = JSON.parse(localStorage.getItem("user_profile") || "{}");
    if (perfil?.isPremium) return true;
  } catch {
    // Perfil local inválido: segue para a sessão.
  }

  try {
    const logado = JSON.parse(localStorage.getItem("cosmos_logged_user") || "{}");
    if (logado?.isPremium) return true;
  } catch {
    // Sessão local inválida: considera não premium.
  }

  return false;
}
