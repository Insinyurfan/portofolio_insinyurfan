-- ===========================================================================
-- PEMBUKA HALAMAN YANG DAPAT DIATUR PEMILIK
--
-- Setiap halaman profil mendapat satu blok pembuka besar: label kecil, judul
-- editorial, dan satu paragraf. Isinya DIATUR DARI DASHBOARD, bukan ditulis di
-- kode — aturan proyek ini adalah seluruh isi halaman publik berasal dari
-- database, dan kalimat seperti "Belajar lewat kerja nyata" jelas isi, bukan
-- struktur.
--
-- Satu tabel dengan kunci berupa nama halaman, bukan satu kolom per halaman di
-- tabel profile: menambah halaman baru kelak cukup menambah baris, tanpa
-- migrasi dan tanpa menyentuh kode yang membacanya.
-- ===========================================================================

create table if not exists public.page_intros (
  id uuid primary key default gen_random_uuid(),

  -- Kunci halaman, sama dengan potongan alamatnya: "pengalaman", "pendidikan",
  -- dan seterusnya. Unik, sehingga satu halaman tidak mungkin punya dua
  -- pembuka yang saling bertentangan.
  page text not null unique,

  -- Label kecil di atas judul, misalnya "Perjalanan".
  eyebrow text,
  -- Judul editorial besar. Kosong berarti blok pembuka tidak dirender sama
  -- sekali, dan halamannya kembali ke bentuk tanpa pembuka.
  headline text,
  description text,

  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.page_intros is
  'Blok pembuka per halaman publik. Kunci `page` sama dengan potongan alamat halamannya.';
comment on column public.page_intros.headline is
  'Judul editorial. Kosong berarti blok pembuka tidak dirender.';

-- Nilai yang hanya berisi spasi menghasilkan blok pembuka yang tampak kosong.
alter table public.page_intros
  drop constraint if exists page_intros_headline_tidak_kosong;
alter table public.page_intros
  add constraint page_intros_headline_tidak_kosong
  check (headline is null or length(btrim(headline)) > 0);

alter table public.page_intros
  drop constraint if exists page_intros_panjang;
alter table public.page_intros
  add constraint page_intros_panjang
  check (
    (eyebrow is null or length(eyebrow) <= 40)
    and (headline is null or length(headline) <= 120)
    and (description is null or length(description) <= 400)
  );

drop trigger if exists page_intros_set_updated_at on public.page_intros;
create trigger page_intros_set_updated_at
  before update on public.page_intros
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------------------ RLS
alter table public.page_intros enable row level security;

drop policy if exists "anon membaca pembuka halaman terbit" on public.page_intros;
create policy "anon membaca pembuka halaman terbit"
  on public.page_intros for select to anon
  using (is_published);

drop policy if exists "authenticated mengelola pembuka halaman" on public.page_intros;
create policy "authenticated mengelola pembuka halaman"
  on public.page_intros for all to authenticated
  using (true) with check (true);

-- --------------------------------------------------------------------- Isi awal
-- Baris disiapkan untuk setiap halaman profil supaya pemilik tinggal menyunting,
-- bukan menebak kunci halaman mana yang sah. `headline` sengaja dibiarkan NULL:
-- blok pembuka baru muncul setelah pemilik mengisinya sendiri, jadi migrasi ini
-- tidak mengubah tampilan situs sampai ada yang memutuskan demikian.
insert into public.page_intros (page, eyebrow)
values
  ('tentang',    'Tentang saya'),
  ('pendidikan', 'Riwayat akademik'),
  ('keahlian',   'Kemampuan'),
  ('pengalaman', 'Perjalanan'),
  ('proyek',     'Karya'),
  ('pencapaian', 'Penghargaan'),
  ('kontak',     'Hubungi saya')
on conflict (page) do nothing;
