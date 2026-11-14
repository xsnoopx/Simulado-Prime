-- ============================================================================
-- Limite de uso da IA por conta
-- ============================================================================
--
-- Como aplicar: painel do Supabase > SQL Editor > cole o arquivo inteiro > Run.
--
-- Por que existe:
--   * a cota do Google Gemini e por projeto, nao por usuario;
--   * sem limite por conta, uma pessoa sozinha pode consumir a cota de todos;
--   * a Edge Function so deve ser chamada pelo servidor do app (segredo
--     x-ai-proxy-secret), e este limite e a segunda barreira.
--
-- Regras:
--   * conta gratuita: 10 geracoes por dia e 3 por minuto;
--   * conta premium (ranking.is_premium): 50 por dia e 3 por minuto;
--   * o "dia" vira a meia-noite no horario de Brasilia;
--   * o contador e atomico (ON CONFLICT), seguro para cliques simultaneos.
--
-- Rollback:
--   drop function if exists public.consumir_ai_usage(uuid);
--   drop table if exists public.ai_usage;

create table if not exists public.ai_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  dia date not null,
  usos integer not null default 0 check (usos >= 0),
  janela_minuto timestamptz,
  usos_minuto integer not null default 0 check (usos_minuto >= 0),
  atualizado_em timestamptz not null default now(),
  primary key (user_id, dia)
);

-- Apenas o servidor (service_role) acessa a tabela; nao ha policy para
-- anon/authenticated justamente para o navegador nao ler nem burlar o contador.
alter table public.ai_usage enable row level security;

revoke all on public.ai_usage from anon, authenticated;
grant select, insert, update, delete on public.ai_usage to service_role;

create index if not exists ai_usage_dia_idx
  on public.ai_usage (dia);

create or replace function public.consumir_ai_usage(p_user_id uuid)
returns table (
  permitido boolean,
  motivo text,
  usos_dia integer,
  limite_dia integer,
  restantes_dia integer,
  limite_minuto integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_dia date := (now() at time zone 'America/Sao_Paulo')::date;
  v_minuto timestamptz := date_trunc('minute', now());
  v_premium boolean := false;
  v_limite_dia integer;
  v_limite_minuto integer := 3;
  v_usos_dia integer;
  v_usos_minuto integer;
begin
  select coalesce(r.is_premium, false)
    into v_premium
    from public.ranking r
   where r.id = p_user_id::text;

  v_limite_dia := case when coalesce(v_premium, false) then 50 else 10 end;

  insert into public.ai_usage as u (user_id, dia, usos, janela_minuto, usos_minuto)
  values (p_user_id, v_dia, 1, v_minuto, 1)
  on conflict (user_id, dia) do update
    set usos = u.usos + 1,
        usos_minuto = case
          when u.janela_minuto = v_minuto then u.usos_minuto + 1
          else 1
        end,
        janela_minuto = v_minuto,
        atualizado_em = now()
    where u.usos < v_limite_dia
      and (u.janela_minuto is distinct from v_minuto or u.usos_minuto < v_limite_minuto)
  returning u.usos, u.usos_minuto into v_usos_dia, v_usos_minuto;

  if found then
    return query
      select true, null::text, v_usos_dia, v_limite_dia,
             greatest(v_limite_dia - v_usos_dia, 0), v_limite_minuto;
    return;
  end if;

  -- Nao entrou: descobrir se parou no limite do dia ou no do minuto.
  select u.usos, u.usos_minuto
    into v_usos_dia, v_usos_minuto
    from public.ai_usage u
   where u.user_id = p_user_id
     and u.dia = v_dia;

  if coalesce(v_usos_dia, 0) >= v_limite_dia then
    return query
      select false, 'dia'::text, coalesce(v_usos_dia, v_limite_dia), v_limite_dia, 0, v_limite_minuto;
  else
    return query
      select false, 'minuto'::text, coalesce(v_usos_dia, 0), v_limite_dia,
             greatest(v_limite_dia - coalesce(v_usos_dia, 0), 0), v_limite_minuto;
  end if;
end;
$$;

-- Somente o service_role chama esta funcao. Se um usuario autenticado pudesse
-- chama-la, conseguiria gastar a cota de outra conta passando outro UUID.
revoke all on function public.consumir_ai_usage(uuid) from public;
revoke all on function public.consumir_ai_usage(uuid) from anon, authenticated;
grant execute on function public.consumir_ai_usage(uuid) to service_role;
