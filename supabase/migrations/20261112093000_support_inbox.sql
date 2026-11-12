-- ============================================================================
-- Suporte Cósmico: chamados do jogador + IMBOX do administrador
-- ============================================================================
--
-- Como aplicar: painel do Supabase > SQL Editor > cole o arquivo inteiro > Run.
--
-- Depois desta migração:
--   * as tabelas support_threads e support_messages ficam sem acesso público
--     (anon/authenticated não leem nem escrevem direto);
--   * todo o fluxo passa pelas rotas /api/support (jogador) e
--     /api/admin/support (admin), que usam a service_role no servidor;
--   * o bucket privado support-uploads guarda os prints enviados no chat.
--
-- Rollback:
--   drop table if exists public.support_messages;
--   drop table if exists public.support_threads;
--   delete from storage.buckets where id = 'support-uploads';

create extension if not exists pgcrypto;

create table if not exists public.support_threads (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  user_name text not null default '',
  user_email text not null default '',
  category text not null check (category in ('bug', 'elogio', 'sugestao', 'duvida', 'outro')),
  status text not null default 'open' check (status in ('open', 'resolved')),
  unread_admin integer not null default 0 check (unread_admin >= 0),
  unread_user integer not null default 0 check (unread_user >= 0),
  last_preview text not null default '',
  last_sender text check (last_sender in ('user', 'admin', 'note')),
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.support_threads(id) on delete cascade,
  sender text not null check (sender in ('user', 'admin', 'note')),
  author_id text,
  body text not null default '',
  image_paths text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists support_threads_user_idx
  on public.support_threads (user_id, last_message_at desc);

create index if not exists support_threads_unread_idx
  on public.support_threads (unread_admin desc, last_message_at desc);

create index if not exists support_messages_thread_idx
  on public.support_messages (thread_id, created_at);

alter table public.support_threads enable row level security;
alter table public.support_messages enable row level security;

-- Nenhum cliente acessa as tabelas direto: só as rotas do servidor, com a
-- service_role. Isso impede que alguém leia chamados de outros jogadores.
revoke all on table public.support_threads from public, anon, authenticated;
revoke all on table public.support_messages from public, anon, authenticated;

-- Bucket privado para os prints. A service_role assina URLs temporárias na
-- hora de exibir as imagens, então nada fica exposto publicamente.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'support-uploads',
  'support-uploads',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public = false,
      file_size_limit = 5242880,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];
