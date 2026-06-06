-- Migration for existing Day-5 databases. Run in Supabase SQL Editor.

create table if not exists categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  slug        text not null unique,
  color       text not null default '#5b54e8'
);

insert into categories (name, slug, color) values
  ('General',  'general',  '#5b54e8'),
  ('Tech',     'tech',     '#2563eb'),
  ('Product',  'product',  '#059669'),
  ('Design',   'design',   '#db2777'),
  ('Career',   'career',   '#d97706')
on conflict (slug) do nothing;

alter table questions add column if not exists category_id uuid references categories(id) on delete set null;
alter table questions add column if not exists pinned boolean not null default false;
alter table questions add column if not exists pinned_at timestamptz;

create table if not exists attachments (
  id           uuid primary key default gen_random_uuid(),
  question_id  uuid not null references questions(id) on delete cascade,
  file_name    text not null,
  file_path    text not null,
  file_type    text,
  file_size    int,
  created_at   timestamptz default now()
);

create index if not exists attachments_question_id_idx on attachments (question_id);

create table if not exists notifications (
  id            uuid primary key default gen_random_uuid(),
  recipient_id  text not null,
  type          text not null,
  title         text not null,
  body          text,
  question_id   uuid references questions(id) on delete cascade,
  read          boolean not null default false,
  created_at    timestamptz default now()
);

create index if not exists notifications_recipient_idx on notifications (recipient_id, created_at desc);
create index if not exists questions_category_idx on questions (category_id);

alter table questions add column if not exists author_voter_id text;

create table if not exists category_followers (
  voter_id      text not null,
  category_id   uuid not null references categories(id) on delete cascade,
  created_at    timestamptz default now(),
  primary key (voter_id, category_id)
);
