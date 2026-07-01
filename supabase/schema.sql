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

-- The whole site (login + admin CRUD) runs on GitHub Pages with no server:
-- the browser talks to Supabase directly using the public/anon key, and
-- Postgres itself enforces every rule below via Row Level Security. None of
-- this can be bypassed by editing the page's JavaScript, because the checks
-- re-run inside the database on every request, not in the browser.

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

-- Login: Postgres rejects the session insert unless the username currently
-- exists and is active — a disabled/deleted user cannot get a session no
-- matter what the client sends.
create policy "anon_insert_session_for_active_user" on sessions
  for insert
  to anon
  with check (
    exists (
      select 1 from users u
      where u.username = sessions.username and u.status = 'active'
    )
  );

-- Admin CRUD: the browser sends its session token as the X-Session-Token
-- header on every write to `users`. This function looks that token up live
-- and only returns true if it belongs to a currently-active admin — so
-- adding/disabling/deleting users from admin.html is genuinely enforced by
-- the database, not just hidden by the page's UI.
create or replace function current_session_is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from sessions s
    join users u on u.username = s.username
    where s.token = (current_setting('request.headers', true)::json ->> 'x-session-token')
      and u.status = 'active'
      and u.is_admin = true
  );
$$;

create policy "admin_insert_users" on users
  for insert
  to anon
  with check (current_session_is_admin());

create policy "admin_update_users" on users
  for update
  to anon
  using (current_session_is_admin())
  with check (current_session_is_admin());

create policy "admin_delete_users" on users
  for delete
  to anon
  using (current_session_is_admin());
