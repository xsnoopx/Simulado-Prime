-- ============================================================================
-- Ranking: fecha o EXECUTE que o Supabase concede a anon por padrão
-- ============================================================================
--
-- O Supabase aplica ALTER DEFAULT PRIVILEGES no schema public, então toda
-- função nova já nasce com EXECUTE para anon/authenticated, independente do
-- "revoke all ... from public" da migration anterior.
--
-- Na prática não havia brecha (as duas funções barram quem não tem sessão),
-- mas não há motivo para anon conseguir chamá-las.
--
-- Como aplicar: SQL Editor > cole > Run. Idempotente, pode rodar de novo.

revoke execute on function public.is_ranking_admin() from anon;
revoke execute on function public.sync_own_ranking_profile(text, text, text, text) from anon;
