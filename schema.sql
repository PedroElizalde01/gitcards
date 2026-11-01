-- Apply with: psql "$DATABASE_URL_UNPOOLED" -f schema.sql (idempotent)

create table if not exists users (
  id            bigint primary key,            -- GitHub databaseId; the pass serial is gh-<id>
  login         text not null,
  name          text,
  token_enc     text,                          -- GitHub token, AES-256-GCM; null stops daily sync
  theme         text not null default 'classic:dark', -- <design>:<mode>
  cal_start     date,
  counts        integer[],
  total         integer not null default 0,
  pass_token    text not null,                 -- Wallet's authenticationToken for this pass
  pass_updated  timestamptz not null default now(),
  synced_at     timestamptz,
  created_at    timestamptz not null default now()
);
alter table users add column if not exists avatar text;  -- 240px JPEG, base64
alter table users add column if not exists joined date;  -- GitHub account creation
alter table users alter column theme set default 'classic:dark';

create table if not exists registrations (
  device_id   text not null,
  user_id     bigint not null references users(id) on delete cascade,
  push_token  text not null,
  primary key (device_id, user_id)
);
