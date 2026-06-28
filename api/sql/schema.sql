-- TrustLoop Postgres schema (Supabase)

create table if not exists onboarding_profiles (
  id text primary key,
  created_at timestamptz not null,
  name text not null,
  email text not null,
  wallet_address text not null,
  wallet_short text not null,
  feedback text not null default '',
  product_rating int not null default 4,
  created_at_idx timestamptz generated always as (created_at) stored
);

create index if not exists onboarding_profiles_created_at_idx
  on onboarding_profiles (created_at);

create table if not exists loops (
  id text primary key,
  counterparty text not null,
  role text not null,
  status text not null,
  score int not null default 0,
  expires_in_days int not null default 14,
  last_event text not null default 'trust.created',
  created_at timestamptz not null,
  approval_policy text not null default 'dual'
);

create table if not exists approvals (
  id text primary key,
  loop_id text not null unique,
  client_approved boolean not null default false,
  freelancer_approved boolean not null default false,
  required_approvals int not null default 2,
  updated_at timestamptz not null
);

create table if not exists events (
  id text primary key,
  time timestamptz not null,
  type text not null,
  loop_id text not null,
  detail text not null default ''
);

create index if not exists events_time_idx on events(time);

create table if not exists meta (
  id text primary key,
  last_indexer_sync_at timestamptz not null
);

