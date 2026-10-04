-- ===========================================================================
-- DETAIL TAMBAHAN UNTUK RIWAYAT PENDIDIKAN
--
-- Kartu pendidikan sebelumnya hanya memuat nama institusi, jenjang, jurusan,
-- tahun, IPK, dan deskripsi. Dua hal yang paling membuat kartu semacam ini
-- terasa berisi justru belum ada: logo institusinya dan lokasinya.
--
-- Keduanya OPSIONAL. Kartu harus tetap utuh tanpa keduanya, karena riwayat
-- pendidikan yang sudah terisi sebelum migrasi ini tidak memilikinya — dan
-- memaksa pemilik melengkapi dulu berarti halamannya rusak sementara.
-- ===========================================================================

alter table public.education
  add column if not exists logo_url text,
  add column if not exists location text;

comment on column public.education.logo_url is
  'URL publik logo institusi di bucket Storage "media". Kosong berarti kartu memakai inisial nama institusi.';

comment on column public.education.location is
  'Lokasi institusi sebagaimana ingin ditampilkan, misalnya "Bekasi, Jawa Barat". Kosong berarti baris lokasi tidak dirender.';

-- Lokasi tidak boleh berisi spasi saja: nilai seperti itu menghasilkan baris
-- lokasi dengan ikon pin tanpa teks apa pun di sebelahnya. NULL tetap boleh,
-- dan artinya "jangan tampilkan".
alter table public.education
  drop constraint if exists education_location_tidak_kosong;

alter table public.education
  add constraint education_location_tidak_kosong
  check (location is null or length(btrim(location)) > 0);

alter table public.education
  drop constraint if exists education_location_panjang;

alter table public.education
  add constraint education_location_panjang
  check (location is null or length(location) <= 120);
