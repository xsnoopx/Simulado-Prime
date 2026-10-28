-- ============================================================================
-- Reset de temporada atômico
-- ============================================================================
--
-- Antes, /api/admin/reset-ranking fazia duas chamadas ao PostgREST:
--   1. delete em todas as linhas de ranking
--   2. insert da linha 'system_season'
-- Se o insert falhasse (rede, timeout, RLS), o ranking ficava vazio.
--
-- Agora o delete e o insert acontecem dentro de uma função, ou seja, na mesma
-- transação: ou zera tudo e grava a nova temporada, ou nada muda.
--
-- Como aplicar: SQL Editor > cole > Run.
--
-- Rollback:
--   drop function if exists public.reset_ranking_season();

create or replace function public.reset_ranking_season()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_next integer;
begin
  -- Temporada atual + 1 (1 se ainda não existe marcador)
  select coalesce(max(xp), 0) + 1
    into v_next
    from public.ranking
   where id = 'system_season';

  -- Mantém o marcador; apaga só os jogadores. O marcador é reescrito no passo
  -- seguinte, dentro da mesma transação.
  delete from public.ranking
   where id <> 'system_season';

  insert into public.ranking (
    id,
    name,
    avatar_id,
    avatar_frame_id,
    is_premium,
    xp,
    stats,
    updated_at
  )
  values (
    'system_season',
    'Configuração do Sistema',
    'default',
    'frame_01',
    false,
    v_next,
    jsonb_build_object('season', v_next),
    now()
  )
  on conflict (id) do update
     set xp         = excluded.xp,
         stats      = excluded.stats,
         is_premium = false,
         updated_at = now();

  return v_next;
end;
$$;

-- Só a service_role (usada pela rota /api/admin/reset-ranking, depois de
-- confirmar a sessão do e-mail de admin) pode executar.
revoke all on function public.reset_ranking_season() from public;
revoke execute on function public.reset_ranking_season() from anon, authenticated;
grant execute on function public.reset_ranking_season() to service_role;
