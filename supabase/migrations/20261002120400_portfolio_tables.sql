-- Pengalaman, proyek, dan pencapaian.

create table public.experiences (
  id uuid primary key default gen_random_uuid(),
  position text not null,
  organization text not null,
  type public.experience_type not null,
  start_date date not null,
  end_date date,
  is_ongoing boolean not null default false,
  description text,
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint experiences_position_not_blank check (btrim(position) <> ''),
  constraint experiences_organization_not_blank check (btrim(organization) <> ''),
  constraint experiences_date_range check (end_date is null or end_date >= start_date),

  -- Yang masih berjalan tidak boleh punya tanggal selesai: kalau tidak,
  -- tampilan harus memilih antara "Sekarang" dan tanggal, dan itu ambigu.
  constraint experiences_ongoing_has_no_end check (not is_ongoing or end_date is null)
);

create trigger experiences_set_updated_at
  before update on public.experiences
  for each row execute function public.set_updated_at();

create index experiences_order_idx
  on public.experiences (sort_order, id);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null,
  summary text,
  description text,

  -- Array menjaga urutan, dan daftar ini tidak pernah difilter secara
  -- relasional. Lihat design.md → "Daftar berurutan sebagai kolom array".
  tech_stack text[] not null default '{}',
  gallery text[] not null default '{}',

  thumbnail_url text,
  demo_url text,
  repo_url text,
  featured boolean not null default false,
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint projects_title_not_blank check (btrim(title) <> ''),
  constraint projects_slug_unique unique (slug),

  -- Slug harus aman untuk URL: huruf kecil, angka, dan tanda hubung.
  constraint projects_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

create index projects_order_idx
  on public.projects (sort_order, id);

create index projects_featured_idx
  on public.projects (featured, sort_order, id)
  where featured;

create table public.achievements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  issuer text,
  issued_date date,
  category public.achievement_category not null,
  image_url text,
  verification_url text,
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint achievements_title_not_blank check (btrim(title) <> '')
);

create trigger achievements_set_updated_at
  before update on public.achievements
  for each row execute function public.set_updated_at();

create index achievements_order_idx
  on public.achievements (sort_order, id);
