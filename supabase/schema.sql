-- Run this once in the Supabase SQL Editor (project → SQL Editor → New query).

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  username text not null unique,
  status text not null default 'active' check (status in ('active', 'inactive')),
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists sessions (
  token text primary key,
  username text not null references users(username) on delete cascade,
  created_at timestamptz not null default now()
);

alter table users enable row level security;
alter table sessions enable row level security;

-- Seed the first admin account.
insert into users (name, username, status, is_admin)
values ('abo jeyad', 'sm@smarterp.top', 'active', true);

-- ── Phase 1: site hosted on GitHub Pages (no server) ──
-- The browser talks to Supabase directly with the public/anon key, so the
-- checks below run *inside Postgres* and cannot be bypassed by editing the
-- page's JavaScript. This is what makes the login gate real even without a
-- server, while write access to `users` (add/disable/delete) stays closed —
-- an anon key is inherently public, so it must never be allowed to modify
-- who has access. Those actions are done via the Supabase Table Editor for
-- now, or through the Netlify admin API (netlify/functions/admin-users.ts)
-- once the site is later connected to Netlify.

create policy "anon_select_users" on users
  for select
  to anon
  using (true);

create policy "anon_select_sessions" on sessions
  for select
  to anon
  using (true);

create policy "anon_delete_sessions" on sessions
  for delete
  to anon
  using (true);

create policy "anon_insert_session_for_active_user" on sessions
  for insert
  to anon
  with check (
    exists (
      select 1 from users u
      where u.username = sessions.username and u.status = 'active'
    )
  );

-- ── Phase 2: once connected to Netlify ──
-- Netlify Functions authenticate with the service_role key, which bypasses
-- RLS entirely, so no additional policies are needed for the admin API.
