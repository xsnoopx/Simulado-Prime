/**
 * Helper exclusivo do servidor: identifica a única conta que pode alterar
 * XP, ranking, premium e dados de jogadores.
 *
 * O endereço vem da variável ADMIN_EMAIL para poder ser trocado sem mexer no
 * código. Não importe este módulo em componentes de cliente: a variável não
 * tem prefixo NEXT_PUBLIC_ justamente para não ir parar no bundle.
 */
export const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "klession@gmail.com")
  .trim()
  .toLowerCase();

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === ADMIN_EMAIL;
}
