-- ============================================================================
-- Avisos do aplicativo (lembrete fixado no topo, com reexibição programada)
-- ============================================================================
--
-- Como aplicar: painel do Supabase > SQL Editor > cole o arquivo inteiro > Run.
--
-- Regras:
--   * só existe UM aviso ativo por vez (índice único parcial);
--   * o aviso é público de leitura (qualquer visitante vê), mas só o
--     administrador publica/edita/apaga, pelas rotas /api/admin/broadcast;
--   * o navegador guarda o horário do "fechar" e só mostra de novo depois de
--     `reexibir_horas` (padrão 12h), ou imediatamente se a `version` mudar.
--
-- Rollback:
--   drop table if exists public.app_broadcasts;

create extension if not exists pgcrypto;

create table if not exists public.app_broadcasts (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  body text not null default '',
  tone text not null default 'info' check (tone in ('info', 'atencao', 'novidade', 'manutencao')),
  active boolean not null default true,
  reexibir_horas integer not null default 12 check (reexibir_horas between 1 and 168),
  version integer not null default 1 check (version >= 1),
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint app_broadcasts_texto_obrigatorio check (length(btrim(body)) > 0)
);

-- Garante um único aviso ativo: publicar um novo exige desativar o anterior.
create unique index if not exists app_broadcasts_um_ativo
  on public.app_broadcasts (active)
  where active;

create index if not exists app_broadcasts_ordem_idx
  on public.app_broadcasts (updated_at desc);

alter table public.app_broadcasts enable row level security;

-- Leitura pública não é feita direto na tabela: a rota /api/broadcast usa a
-- service_role e devolve só o aviso ativo. Assim ninguém lê o histórico.
revoke all on table public.app_broadcasts from public, anon, authenticated;
