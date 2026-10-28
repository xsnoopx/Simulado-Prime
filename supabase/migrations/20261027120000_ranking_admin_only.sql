-- ============================================================================
-- Ranking: escrita restrita ao e-mail de admin
-- ============================================================================
--
-- Como aplicar: painel do Supabase > SQL Editor > cole o arquivo inteiro > Run.
-- Ou, com a CLI: supabase db push
--
-- Depois desta migração:
--   * qualquer visitante continua lendo o ranking (leaderboard é público);
--   * NINGUÉM escreve direto na tabela: anon e authenticated perdem os grants;
--   * o jogador logado só atualiza nome/avatar da PRÓPRIA linha, pela função
--     public.sync_own_ranking_profile();
--   * xp, is_premium e stats só mudam por /api/admin/manage-players, que exige
--     sessão do e-mail de admin e escreve com a service_role.
--
-- Rollback (só se precisar voltar atrás):
--   drop function if exists public.sync_own_ranking_profile(text, text, text, text);
--   drop function if exists public.is_ranking_admin();
--   drop policy if exists ranking_select_public on public.ranking;
--   alter table public.ranking disable row level security;
--   grant insert, update, delete on public.ranking to anon, authenticated;

begin;

-- ---------------------------------------------------------------------------
-- 0. Garante ids únicos antes de depender de ON CONFLICT (id)
-- ---------------------------------------------------------------------------
do $$
declare
  v_attnum int2;
begin
  select attnum
    into v_attnum
    from pg_attribute
   where attrelid = 'public.ranking'::regclass
     and attname = 'id'
     and not attisdropped;

  if v_attnum is null then
    raise exception 'A tabela public.ranking não tem a coluna id.';
  end if;

  if not exists (
    select 1
      from pg_constraint
     where conrelid = 'public.ranking'::regclass
       and contype in ('p', 'u')
       and conkey = array[v_attnum]
  ) then
    raise notice 'ranking.id não tem constraint única; criando índice único.';
    create unique index ranking_id_key on public.ranking (id);
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 1. RLS ligada
-- ---------------------------------------------------------------------------
alter table public.ranking enable row level security;

-- ---------------------------------------------------------------------------
-- 2. Leitura pública do leaderboard
-- ---------------------------------------------------------------------------
drop policy if exists ranking_select_public on public.ranking;
create policy ranking_select_public
  on public.ranking
  for select
  to anon, authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- 3. Derruba qualquer policy antiga que permita escrita
-- ---------------------------------------------------------------------------
do $$
declare
  pol record;
begin
  for pol in
    select policyname
      from pg_policies
     where schemaname = 'public'
       and tablename = 'ranking'
       and cmd <> 'SELECT'
  loop
    raise notice 'Removendo policy de escrita: %', pol.policyname;
    execute format('drop policy if exists %I on public.ranking', pol.policyname);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. Defesa em profundidade: sem grants de escrita direta
-- ---------------------------------------------------------------------------
revoke insert, update, delete, truncate on public.ranking from anon, authenticated;

-- ---------------------------------------------------------------------------
-- 5. Quem é admin (consulta auth.users, não confia em metadata do cliente)
-- ---------------------------------------------------------------------------
create or replace function public.is_ranking_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from auth.users u
     where u.id = auth.uid()
       and lower(u.email) = 'klession@gmail.com'
  );
$$;

revoke all on function public.is_ranking_admin() from public;
grant execute on function public.is_ranking_admin() to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 6. O jogador logado só mantém o visual da própria linha
--    xp, is_premium e stats NÃO são parâmetros desta função: não há como
--    escrevê-los por aqui.
-- ---------------------------------------------------------------------------
create or replace function public.sync_own_ranking_profile(
  p_name text default null,
  p_avatar_id text default null,
  p_custom_avatar_url text default null,
  p_avatar_frame_id text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid text := auth.uid()::text;
  v_name text;
  v_frame text;
begin
  if v_uid is null then
    raise exception 'Sessão obrigatória para sincronizar o ranking.'
      using errcode = '42501';
  end if;

  -- Avatar é enviado como data URL; 400 kB cobre com folga o recorte do app
  -- (os avatares atuais têm ~9,5 kB) e evita encher a tabela.
  if p_custom_avatar_url is not null and length(p_custom_avatar_url) > 400000 then
    raise exception 'Avatar personalizado acima do limite de 400 kB.'
      using errcode = '22001';
  end if;

  select coalesce(
           nullif(btrim(coalesce(p_name, u.raw_user_meta_data ->> 'name')), ''),
           'Explorador'
         )
    into v_name
    from auth.users u
   where u.id = auth.uid();

  v_name := coalesce(v_name, 'Explorador');

  v_frame := coalesce(nullif(btrim(p_avatar_frame_id), ''), 'frame_01');
  if v_frame = 'frame_owner' and not public.is_ranking_admin() then
    v_frame := 'frame_01';
  end if;

  insert into public.ranking as r (
    id,
    name,
    avatar_id,
    custom_avatar_url,
    avatar_frame_id,
    is_premium,
    xp,
    stats,
    updated_at
  )
  values (
    v_uid,
    v_name,
    coalesce(nullif(btrim(p_avatar_id), ''), 'default'),
    p_custom_avatar_url,
    v_frame,
    false,
    0,
    '{}'::jsonb,
    now()
  )
  on conflict (id) do update
     set name              = coalesce(v_name, r.name),
         avatar_id         = coalesce(nullif(btrim(p_avatar_id), ''), r.avatar_id),
         custom_avatar_url = coalesce(p_custom_avatar_url, r.custom_avatar_url),
         avatar_frame_id   = v_frame,
         updated_at        = now();
end;
$$;

revoke all on function public.sync_own_ranking_profile(text, text, text, text) from public;
grant execute on function public.sync_own_ranking_profile(text, text, text, text) to authenticated;

commit;
