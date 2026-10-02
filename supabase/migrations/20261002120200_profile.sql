-- Tabel profile: tepat satu baris.
--
-- Batasan singleton ditegakkan di database, bukan hanya di kode aplikasi,
-- karena dashboard admin di change berikutnya juga akan menulis ke tabel ini
-- dan batasan yang hanya ada di aplikasi akan gugur di sana.
-- Lihat design.md → "Profil singleton ditegakkan di database".

create table public.profile (
  id uuid primary key default gen_random_uuid(),

  -- Kolom penjaga singleton: selalu true, unik, sehingga hanya satu baris
  -- yang mungkin ada. Baris kedua ditolak oleh unique constraint.
  singleton boolean not null default true,

  full_name text not null,
  username text not null,

  -- Daftar role untuk animasi ketik di beranda. Array menjaga urutan
  -- elemennya, jadi urutan yang disimpan admin itulah yang ditampilkan.
  roles text[] not null default '{}',

  tagline text,
  photo_url text,
  bio text,
  location text,
  email text,
  is_open_to_work boolean not null default false,
  cv_url text,

  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint profile_singleton_unique unique (singleton),
  constraint profile_singleton_true check (singleton),
  constraint profile_full_name_not_blank check (btrim(full_name) <> ''),
  constraint profile_username_not_blank check (btrim(username) <> '')
);

comment on table public.profile is
  'Profil pemilik portofolio. Dijaga tepat satu baris oleh constraint singleton.';
comment on column public.profile.singleton is
  'Selalu true dan unik: inilah yang mencegah adanya baris profil kedua.';

create trigger profile_set_updated_at
  before update on public.profile
  for each row
  execute function public.set_updated_at();
