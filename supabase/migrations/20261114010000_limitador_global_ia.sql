-- ============================================================================
-- Limitador global de chamadas de IA (protege a cota do projeto Gemini)
-- ============================================================================
--
-- Como aplicar: painel do Supabase > SQL Editor > cole o arquivo inteiro > Run.
--
-- Por que existe:
--   * a cota do Gemini e do PROJETO, nao de cada conta;
--   * o limite por conta (10/dia, 3/min) impede um abusador, mas nao impede
--     90 pessoas gerando ao mesmo tempo;
--   * sem um teto global, todo mundo recebe 429 do Google ao mesmo tempo.
--
-- Como funciona:
--   * janela deslizante de verdade (nao e balde fixo de minuto), entao nao
--     existe pico dobrado na virada do minuto;
--   * cada tentativa vira uma linha em `ai_global_limit`;
--   * a contagem roda dentro de um advisory lock, entao dois cliques
--     simultaneos nunca furam o teto;
--   * a funcao devolve quanto falta para liberar a proxima vaga, para a rota
--     poder esperar um pouco antes de desistir.
--
-- Ajuste o teto pela variavel AI_GLOBAL_LIMITE na Vercel. O padrao de 8/min
-- deixa folga sob o limite gratuito do gemini-2.5-flash (~10 req/min). Com
-- faturamento ativo no Google, pode subir.
--
-- Rollback:
--   drop function if exists public.reservar_slot_ia(integer, integer);
--   drop table if exists public.ai_global_limit;

create table if not exists public.ai_global_limit (
  id bigserial primary key,
  criado_em timestamptz not null default clock_timestamp()
);

create index if not exists ai_global_limit_criado_em_idx
  on public.ai_global_limit (criado_em);

-- Apenas o servidor mexe nesta tabela.
alter table public.ai_global_limit enable row level security;
revoke all on public.ai_global_limit from anon, authenticated;
grant select, insert, delete on public.ai_global_limit to service_role;

create or replace function public.reservar_slot_ia(
  p_limite integer default 8,
  p_janela_segundos integer default 60
)
returns table (
  permitido boolean,
  espera_segundos integer,
  na_janela integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_agora timestamptz := clock_timestamp();
  v_inicio timestamptz;
  v_total integer;
  v_mais_antigo timestamptz;
  v_limite integer := greatest(coalesce(p_limite, 8), 1);
  v_janela integer := greatest(coalesce(p_janela_segundos, 60), 1);
begin
  -- Serializa a contagem: sem isso, N chamadas simultaneas leem o mesmo total.
  perform pg_advisory_xact_lock(hashtext('ai_global_limit'));

  v_inicio := v_agora - make_interval(secs => v_janela);

  -- Limpeza folgada: nada aqui precisa sobreviver mais que a janela.
  delete from public.ai_global_limit
   where criado_em < v_agora - make_interval(secs => v_janela * 5);

  select count(*), min(criado_em)
    into v_total, v_mais_antigo
    from public.ai_global_limit
   where criado_em >= v_inicio;

  if v_total < v_limite then
    insert into public.ai_global_limit (criado_em) values (v_agora);
    return query select true, 0, v_total + 1;
    return;
  end if;

  -- Sem vaga: dizer em quantos segundos a tentativa mais antiga expira.
  return query
    select false,
           greatest(
             ceil(extract(epoch from (
               v_mais_antigo + make_interval(secs => v_janela) - v_agora
             )))::integer,
             1
           ),
           v_total;
end;
$$;

revoke all on function public.reservar_slot_ia(integer, integer) from public;
revoke all on function public.reservar_slot_ia(integer, integer) from anon, authenticated;
grant execute on function public.reservar_slot_ia(integer, integer) to service_role;
