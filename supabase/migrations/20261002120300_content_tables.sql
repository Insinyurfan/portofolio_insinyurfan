-- Tautan sosial, pendidikan, dan keahlian berkategori.
--
-- Semua tabel di sini punya sort_order yang menentukan urutan tampil,
-- ditambah kolom audit dan is_published yang dibutuhkan setiap tabel konten.

create table public.social_links (
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  url text not null,
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint social_links_platform_not_blank check (btrim(platform) <> ''),
  constraint social_links_url_not_blank check (btrim(url) <> '')
);

create trigger social_links_set_updated_at
  before update on public.social_links
  for each row execute function public.set_updated_at();

create index social_links_order_idx
  on public.social_links (sort_order, id);

create table public.education (
  id uuid primary key default gen_random_uuid(),
  institution text not null,
  major text,
  degree text,
  start_year integer not null,
  end_year integer,
  gpa numeric(3, 2),
  description text,
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint education_institution_not_blank check (btrim(institution) <> ''),
  constraint education_year_range check (end_year is null or end_year >= start_year),
  constraint education_gpa_range check (gpa is null or (gpa >= 0 and gpa <= 4))
);

create trigger education_set_updated_at
  before update on public.education
  for each row execute function public.set_updated_at();

create index education_order_idx
  on public.education (sort_order, id);

create table public.skill_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  icon text,
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint skill_categories_name_not_blank check (btrim(name) <> '')
);

create trigger skill_categories_set_updated_at
  before update on public.skill_categories
  for each row execute function public.set_updated_at();

create index skill_categories_order_idx
  on public.skill_categories (sort_order, id);

create table public.skills (
  id uuid primary key default gen_random_uuid(),

  -- Menghapus kategori ikut menghapus keahlian di dalamnya, sesuai
  -- spesifikasi: tidak ada keahlian yang boleh menggantung tanpa kategori.
  category_id uuid not null
    references public.skill_categories (id) on delete cascade,

  name text not null,
  icon text,
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint skills_name_not_blank check (btrim(name) <> '')
);

create trigger skills_set_updated_at
  before update on public.skills
  for each row execute function public.set_updated_at();

create index skills_category_order_idx
  on public.skills (category_id, sort_order, id);
