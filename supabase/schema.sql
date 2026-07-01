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

-- No client (browser) ever talks to Supabase directly with the anon key —
-- only our Netlify functions do, using the service_role key, which bypasses RLS.
-- Enabling RLS with no policies here is a safety net: even if the anon key
-- ever leaked, it would return zero rows from these tables.
alter table users enable row level security;
alter table sessions enable row level security;

-- Seed the first admin account.
insert into users (name, username, status, is_admin)
values ('abo jeyad', 'sm@smarterp.top', 'active', true);
