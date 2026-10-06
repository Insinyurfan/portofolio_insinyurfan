-- ===========================================================================
-- DETAIL KEAHLIAN: LOGO, SEJAK KAPAN, DAN TINGKAT PENGUASAAN
--
-- Halaman keahlian sebelumnya hanya menampilkan nama sebagai badge. Yang
-- membuat halaman semacam ini informatif justru tiga hal yang belum ada: logo
-- alatnya, sejak kapan dipakai, dan seberapa dikuasai.
--
-- Kategori juga mendapat label kecil dan deskripsi, supaya setiap kelompok
-- punya pengantar sendiri alih-alih hanya judul.
--
-- Semuanya OPSIONAL. Kartu keahlian harus tetap utuh tanpa logo, tahun, maupun
-- tingkat — data yang sudah ada sebelum migrasi ini tidak memilikinya.
-- ===========================================================================

-- ------------------------------------------------------------------ Kategori
alter table public.skill_categories
  add column if not exists eyebrow text,
  add column if not exists description text;

comment on column public.skill_categories.eyebrow is
  'Label kecil di atas nama kategori, misalnya "Creative toolkit". Kosong berarti tidak dirender.';
comment on column public.skill_categories.description is
  'Satu paragraf pengantar kategori, tampil di samping judulnya.';

alter table public.skill_categories
  drop constraint if exists skill_categories_panjang;
alter table public.skill_categories
  add constraint skill_categories_panjang
  check (
    (eyebrow is null or length(eyebrow) <= 40)
    and (description is null or length(description) <= 300)
  );

-- ------------------------------------------------------------------ Keahlian
alter table public.skills
  add column if not exists logo_url text,
  add column if not exists since_year integer,
  add column if not exists level text;

comment on column public.skills.logo_url is
  'URL publik logo alat di bucket Storage "media". Kosong berarti kartu memakai inisial namanya.';
comment on column public.skills.since_year is
  'Tahun mulai memakai alat ini. Kosong berarti baris "Sejak …" tidak dirender.';
comment on column public.skills.level is
  'Tingkat penguasaan: dasar, menengah, atau mahir. Kosong berarti tidak dirender.';

-- Tingkat dibatasi tiga nilai, bukan teks bebas: kalau bebas, "Mahir",
-- "mahir", dan "Expert" akan hidup berdampingan dan daftarnya kehilangan
-- makna sebagai perbandingan.
alter table public.skills
  drop constraint if exists skills_level_sah;
alter table public.skills
  add constraint skills_level_sah
  check (level is null or level in ('dasar', 'menengah', 'mahir'));

-- Tahun yang masuk akal saja. Batas atasnya longgar supaya tidak perlu migrasi
-- lagi hanya karena tahun berganti.
alter table public.skills
  drop constraint if exists skills_since_year_masuk_akal;
alter table public.skills
  add constraint skills_since_year_masuk_akal
  check (since_year is null or (since_year >= 1970 and since_year <= 2100));
