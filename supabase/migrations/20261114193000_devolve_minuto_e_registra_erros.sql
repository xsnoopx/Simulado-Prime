-- ============================================================================
-- Devolucao tambem do minuto + registro de erros da IA
-- ============================================================================
--
-- Como aplicar: painel do Supabase > SQL Editor > cole o arquivo inteiro > Run.
--
-- 1) Devolucao do minuto
--    Antes, quando o Gemini falhava, a rota devolvia apenas a geracao do DIA.
--    O contador de 3 por minuto continuava gasto, entao tres falhas seguidas
--    travavam o usuario com a mensagem "voce fez 3 geracoes em sequencia" sem
--    ele ter recebido nada. Agora a devolucao zera os dois contadores quando a
--    falha acontece na mesma janela de minuto.
--
--    O risco de abuso continua coberto pelo limitador global (8/min no projeto).
--
-- 2) Registro de erros
--    A API de logs do Supabase nao esta disponivel no plano atual. Esta tabela
--    guarda o status e o motivo real devolvido pelo Gemini, para diagnostico.
--    Ela nao e legivel pelo navegador (sem policy) e cresce pouco.
--
-- Rollback:
--   drop table if exists public.ai_erros;
--   (a funcao volta a versao anterior pela migracao 20261114000000)

create table if not exists public.ai_erros (
  id bigserial primary key,
  criado_em timestamptz not null default now(),
  user_id uuid,
  status integer,
  motivo text,
  detalhe text
);

create index if not exists ai_erros_criado_em_idx
  on public.ai_erros (criado_em);

alter table public.ai_erros enable row level security;
revoke all on public.ai_erros from anon, authenticated;
grant select, insert, delete on public.ai_erros to service_role;

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
  v_minuto timestamptz := date_trunc('minute', now());
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
         usos_minuto = case
           when u.janela_minuto = v_minuto then greatest(u.usos_minuto - 1, 0)
           else u.usos_minuto
         end,
         atualizado_em = now()
   where u.user_id = p_user_id
     and u.dia = v_dia
  returning u.usos into v_usos;

  v_usos := coalesce(v_usos, 0);

  return query
    select v_usos, v_limite_dia, greatest(v_limite_dia - v_usos, 0);
end;
$$;

revoke all on function public.devolver_ai_usage(uuid) from public;
revoke all on function public.devolver_ai_usage(uuid) from anon, authenticated;
grant execute on function public.devolver_ai_usage(uuid) to service_role;
