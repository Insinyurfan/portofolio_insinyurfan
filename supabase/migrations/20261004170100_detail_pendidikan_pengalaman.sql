-- ===========================================================================
-- HALAMAN DETAIL UNTUK PENDIDIKAN DAN PENGALAMAN
--
-- Kartu pendidikan dan pengalaman sebelumnya hanya memuat ringkasan, dan tidak
-- ada tempat untuk menaruh keterangan yang lebih panjang: mata pelajaran yang
-- ditekuni, kontribusi yang dikerjakan, foto kegiatan, dan tautan ke situs
-- resmi institusi atau organisasinya.
--
-- Semua kolom di bawah OPSIONAL, dan array-nya berawal kosong. Baris yang
-- sudah ada sebelum migrasi ini tetap tampil utuh; bagian detail yang kosong
-- tidak dirender sama sekali, dan kartunya tidak menawarkan tombol detail
-- kalau memang tidak ada yang bisa ditampilkan.
--
-- `not null default '{}'` mengikuti projects.gallery yang sudah ada, sehingga
-- kode tidak perlu membedakan "array kosong" dari NULL di seluruh aplikasi.
-- ===========================================================================

-- ------------------------------------------------------------------ Pendidikan
alter table public.education
  -- "Fokus Pembelajaran": mata kuliah atau bidang yang ditekuni.
  add column if not exists focus_items text[] not null default '{}',
  -- "Aktivitas & Pencapaian": organisasi, pelatihan, prestasi.
  add column if not exists activity_items text[] not null default '{}',
  -- "Dokumentasi": foto kegiatan, URL publik di bucket Storage "media".
  add column if not exists gallery text[] not null default '{}',
  -- Situs resmi kampus atau sekolah.
  add column if not exists website_url text;

comment on column public.education.focus_items is
  'Daftar fokus pembelajaran, satu baris per poin. Kosong berarti bagiannya tidak dirender.';
comment on column public.education.activity_items is
  'Daftar aktivitas dan pencapaian, satu baris per poin.';
comment on column public.education.gallery is
  'URL publik foto dokumentasi di bucket Storage "media", dalam urutan tampil.';
comment on column public.education.website_url is
  'Situs resmi institusi. Kosong berarti tombol kunjungi tidak dirender.';

-- ----------------------------------------------------------------- Pengalaman
alter table public.experiences
  -- Logo atau foto profil organisasi.
  add column if not exists logo_url text,
  add column if not exists location text,
  -- "Kontribusi": apa yang dikerjakan, satu baris per poin.
  add column if not exists highlights text[] not null default '{}',
  add column if not exists gallery text[] not null default '{}',
  add column if not exists website_url text;

comment on column public.experiences.logo_url is
  'URL publik logo organisasi di bucket Storage "media". Kosong berarti kartu memakai inisial nama organisasi.';
comment on column public.experiences.location is
  'Lokasi sebagaimana ingin ditampilkan. Kosong berarti baris lokasi tidak dirender.';
comment on column public.experiences.highlights is
  'Daftar kontribusi, satu baris per poin.';
comment on column public.experiences.gallery is
  'URL publik foto dokumentasi di bucket Storage "media", dalam urutan tampil.';
comment on column public.experiences.website_url is
  'Situs resmi organisasi. Kosong berarti tombol kunjungi tidak dirender.';

-- ------------------------------------------------------------------ Constraint
-- Lokasi tidak boleh berisi spasi saja: nilai seperti itu menghasilkan baris
-- lokasi dengan ikon pin tanpa teks apa pun di sebelahnya.
alter table public.experiences
  drop constraint if exists experiences_location_tidak_kosong;
alter table public.experiences
  add constraint experiences_location_tidak_kosong
  check (location is null or length(btrim(location)) > 0);

alter table public.experiences
  drop constraint if exists experiences_location_panjang;
alter table public.experiences
  add constraint experiences_location_panjang
  check (location is null or length(location) <= 120);
