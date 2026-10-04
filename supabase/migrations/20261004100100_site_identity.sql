-- ===========================================================================
-- IDENTITAS SITUS DI HEADER: NAMA DAN LOGO
--
-- Sebelum ini, tulisan "Portofolio" di pojok kiri header ditulis keras di
-- components/layout/navbar.tsx. Itu satu-satunya teks di seluruh situs publik
-- yang tidak berasal dari database — bertentangan dengan aturan proyek ini
-- bahwa seluruh isi halaman dikelola lewat dashboard, bukan lewat kode.
--
-- Keduanya ikut di tabel profile, bukan tabel pengaturan baru: tabel itu sudah
-- singleton (hanya boleh satu baris), sudah punya RLS dan trigger updated_at,
-- dan sudah menjadi tempat identitas pemilik. Menambah tabel kedua berarti
-- menduplikasi semuanya tanpa alasan.
-- ===========================================================================

alter table public.profile
  add column if not exists site_name text,
  add column if not exists logo_url text;

comment on column public.profile.site_name is
  'Nama yang tampil di pojok kiri header dan di judul tab. Kosong berarti memakai full_name.';

comment on column public.profile.logo_url is
  'URL publik logo di header, di bucket Storage "media". Kosong berarti header hanya menampilkan nama.';

-- Nama situs tidak boleh berisi spasi saja: nilai seperti itu menghasilkan
-- header yang tampak kosong tanpa ada yang bisa diklik untuk pulang ke beranda.
-- NULL tetap diizinkan, dan artinya "pakai full_name".
alter table public.profile
  drop constraint if exists profile_site_name_tidak_kosong;

alter table public.profile
  add constraint profile_site_name_tidak_kosong
  check (site_name is null or length(btrim(site_name)) > 0);

-- Panjang dibatasi karena ruang di header terbatas; nama yang terlalu panjang
-- akan mendorong menu navigasi keluar layar di peranti kecil.
alter table public.profile
  drop constraint if exists profile_site_name_panjang;

alter table public.profile
  add constraint profile_site_name_panjang
  check (site_name is null or length(site_name) <= 40);
