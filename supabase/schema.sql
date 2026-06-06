-- Kealvi schema — run once in the Supabase SQL Editor.
-- Creates questions, votes, categories, attachments, notifications,
-- indexes, and seed data.

-- ── reset ──────────────────────────────────────────────────────────────────
drop table if exists notifications;
drop table if exists attachments;
drop table if exists votes;
drop table if exists questions cascade;
drop table if exists categories;
drop function if exists increment_question_votes(uuid);

-- ── categories (Interests) ─────────────────────────────────────────────────
create table categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  slug        text not null unique,
  color       text not null default '#5b54e8'
);

-- ── questions ──────────────────────────────────────────────────────────────
create table questions (
  id           uuid primary key default gen_random_uuid(),
  body         text not null,
  author           text,
  author_voter_id  text,
  category_id      uuid references categories(id) on delete set null,
  pinned       boolean not null default false,
  pinned_at    timestamptz,
  created_at   timestamptz default now()
);

-- ── votes ────────────────────────────────────────────────────────────────────
create table votes (
  id           uuid primary key default gen_random_uuid(),
  question_id  uuid not null references questions(id) on delete cascade,
  voter_id     text not null,
  created_at   timestamptz default now(),
  unique (question_id, voter_id)
);

create index votes_question_id_idx on votes (question_id);

-- ── attachments ──────────────────────────────────────────────────────────────
create table attachments (
  id           uuid primary key default gen_random_uuid(),
  question_id  uuid not null references questions(id) on delete cascade,
  file_name    text not null,
  file_path    text not null,
  file_type    text,
  file_size    int,
  created_at   timestamptz default now()
);

create index attachments_question_id_idx on attachments (question_id);

-- ── notifications ────────────────────────────────────────────────────────────
create table notifications (
  id            uuid primary key default gen_random_uuid(),
  recipient_id  text not null,
  type          text not null,
  title         text not null,
  body          text,
  question_id   uuid references questions(id) on delete cascade,
  read          boolean not null default false,
  created_at    timestamptz default now()
);

create index notifications_recipient_idx on notifications (recipient_id, created_at desc);

-- ── category followers (interest subscriptions) ─────────────────────────────
create table category_followers (
  voter_id      text not null,
  category_id   uuid not null references categories(id) on delete cascade,
  created_at    timestamptz default now(),
  primary key (voter_id, category_id)
);

-- ── full-text search ─────────────────────────────────────────────────────────
create index questions_fts_idx on questions using gin (to_tsvector('english', body));
create index questions_category_idx on questions (category_id);
create index questions_pinned_idx on questions (pinned desc, pinned_at desc nulls last);

-- ── seed categories ──────────────────────────────────────────────────────────
insert into categories (name, slug, color) values
  ('General',  'general',  '#5b54e8'),
  ('Tech',     'tech',     '#2563eb'),
  ('Product',  'product',  '#059669'),
  ('Design',   'design',   '#db2777'),
  ('Career',   'career',   '#d97706');

-- ── seed questions ───────────────────────────────────────────────────────────
insert into questions (body, author, category_id, created_at)
select body, author, (select id from categories where slug = cat_slug), now() - (n || ' minutes')::interval
from (
  values
    (1,  'How do I deploy to Vercel?', 'Priya', 'tech'),
    (2,  'What''s the difference between server and client components?', 'Marcus', 'tech'),
    (3,  'When should I add a database index?', 'Aisha', 'tech'),
    (4,  'How does Postgres full-text search work?', 'Diego', 'tech'),
    (5,  'Why did my in-memory data vanish on restart?', 'Lena', 'tech'),
    (6,  'Should I store a vote count or count vote rows?', 'Sam', 'product'),
    (7,  'What is a unique constraint good for?', 'Priya', 'tech'),
    (8,  'How do I prevent double voting?', 'Noah', 'tech'),
    (9,  'What''s the difference between SSR and hydration?', 'Aisha', 'tech'),
    (10, 'How does optimistic UI actually work?', 'Marcus', 'design'),
    (11, 'When do I really need pagination?', 'Ravi', 'product'),
    (12, 'Offset vs cursor pagination — which one?', 'Lena', 'tech'),
    (13, 'How do I debounce a search input?', 'Diego', 'design'),
    (14, 'Why must secrets stay on the server?', 'Sam', 'tech'),
    (15, 'What is row-level security in Supabase?', 'Noah', 'tech'),
    (16, 'How does connection pooling help on Vercel?', 'Priya', 'tech'),
    (17, 'What is a GIN index and when do I use it?', 'Ravi', 'tech'),
    (18, 'How do foreign keys protect my data?', 'Aisha', 'tech'),
    (19, 'When should I move counts into Redis?', 'Marcus', 'product'),
    (20, 'How do I run a database migration safely?', 'Lena', 'career'),
    (21, 'What does on delete cascade actually do?', 'Diego', 'tech'),
    (22, 'How do I seed test data quickly?', 'Sam', 'tech'),
    (23, 'Why is my Vercel function cold starting?', 'Noah', 'tech'),
    (24, 'How do I scale reads with replicas?', 'Ravi', 'tech'),
    (25, 'What''s the best way to add auth later?', 'Priya', 'career')
) as seed(n, body, author, cat_slug);

-- Pin a couple for demo
update questions set pinned = true, pinned_at = now()
where body in ('How do I deploy to Vercel?', 'How does optimistic UI actually work?');

-- ── Storage bucket (run in Supabase Dashboard → Storage if SQL fails) ───────
-- insert into storage.buckets (id, name, public) values ('question-attachments', 'question-attachments', true);
