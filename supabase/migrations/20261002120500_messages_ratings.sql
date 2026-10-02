-- Tabel pesan dan rating.
--
-- Dibuat sekarang beserta kebijakan aksesnya, tetapi BELUM dipakai oleh
-- halaman publik di change ini. Form kontak dan pengiriman rating dibangun
-- di change berikutnya; change setelahnya yang membuka policy INSERT untuk
-- pengunjung. Sampai itu terjadi, kedua tabel ini tertutup rapat dari publik.

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_name text not null,
  sender_email text not null,
  subject text,
  body text not null,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint messages_sender_name_not_blank check (btrim(sender_name) <> ''),
  constraint messages_sender_email_not_blank check (btrim(sender_email) <> ''),
  constraint messages_body_not_blank check (btrim(body) <> '')
);

create trigger messages_set_updated_at
  before update on public.messages
  for each row execute function public.set_updated_at();

create index messages_created_idx
  on public.messages (created_at desc, id);

create table public.ratings (
  id uuid primary key default gen_random_uuid(),
  reviewer_name text not null,
  stars smallint not null,
  comment text,
  is_approved boolean not null default false,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ratings_reviewer_name_not_blank check (btrim(reviewer_name) <> ''),

  -- Bintang dibatasi bilangan bulat 1..5 di database, bukan hanya di form.
  constraint ratings_stars_range check (stars between 1 and 5)
);

create trigger ratings_set_updated_at
  before update on public.ratings
  for each row execute function public.set_updated_at();

create index ratings_moderation_idx
  on public.ratings (is_approved, created_at desc, id);
