-- ============================================================================
-- Devolucao da geracao de IA quando o servico falha
-- ============================================================================
--
-- Como aplicar: painel do Supabase > SQL Editor > cole o arquivo inteiro > Run.
--
-- Por que existe:
--   * o contador soma a geracao antes de chamar o Gemini;
--   * se o Gemini responder 429/5xx (ou a rede cair), o usuario nao recebe
--     nada, mas ja pagou com uma das 10 geracoes do dia;
--   * esta funcao devolve o uso do DIA quando isso acontece.
--
-- Regra importante:
--   * `usos_minuto` NAO e devolvido de proposito. Assim o limite de 3 por
--     minuto continua valendo mesmo com falhas, e ninguem consegue ficar
--     martelando a funcao para consumir a cota do projeto Gemini.
--
-- Rollback:
--   drop function if exists public.devolver_ai_usage(uuid);

create or replace function public.devolver_ai_usage(p_user_id uuid)
returns table (
  usos_dia integer,
  limite_dia integer,
  restantes_dia integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_dia date := (now() at time zone 'America/Sao_Paulo')::date;
  v_premium boolean := false;
  v_limite_dia integer;
  v_usos integer;
begin
  select coalesce(r.is_premium, false)
    into v_premium
    from public.ranking r
   where r.id = p_user_id::text;

  v_limite_dia := case when coalesce(v_premium, false) then 50 else 10 end;

  update public.ai_usage u
     set usos = greatest(u.usos - 1, 0),
         atualizado_em = now()
   where u.user_id = p_user_id
     and u.dia = v_dia
  returning u.usos into v_usos;

  v_usos := coalesce(v_usos, 0);

  return query
    select v_usos, v_limite_dia, greatest(v_limite_dia - v_usos, 0);
end;
$$;

-- So o servidor (service_role) devolve uso. Se um usuario autenticado pudesse
-- chamar, conseguiria zerar o proprio contador e furar o limite diario.
revoke all on function public.devolver_ai_usage(uuid) from public;
revoke all on function public.devolver_ai_usage(uuid) from anon, authenticated;
grant execute on function public.devolver_ai_usage(uuid) to service_role;
