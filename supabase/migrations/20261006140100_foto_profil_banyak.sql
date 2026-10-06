-- ===========================================================================
-- FOTO PROFIL LEBIH DARI SATU
--
-- Hero beranda sebelumnya hanya dapat menampilkan satu foto. Kolom `photos`
-- menampungnya sebagai daftar, dan foto PERTAMA menjadi foto utama — yang
-- dipakai di halaman Tentang dan sebagai gambar pratinjau saat tautan situs
-- dibagikan.
--
-- Kolom `photo_url` yang lama SENGAJA dipertahankan sebagai nilai cadangan,
-- bukan dihapus: foto yang sudah diunggah pemilik tetap tampil tanpa ia perlu
-- mengunggah ulang apa pun. Kode membaca `photos` lebih dulu, lalu jatuh ke
-- `photo_url` bila daftarnya kosong.
--
-- `not null default '{}'` mengikuti kolom array lain di proyek ini, sehingga
-- kode tidak perlu membedakan "daftar kosong" dari NULL.
-- ===========================================================================

alter table public.profile
  add column if not exists photos text[] not null default '{}';

comment on column public.profile.photos is
  'Foto profil untuk hero beranda, dalam urutan tampil. Yang pertama menjadi foto utama. Kosong berarti memakai photo_url.';

comment on column public.profile.photo_url is
  'Foto profil tunggal (lama). Dipakai hanya bila photos kosong — nilai cadangan supaya foto yang sudah ada tetap tampil.';

-- Foto yang sudah ada dipindahkan ke daftar, sehingga pemilik langsung melihat
-- hasilnya di field baru tanpa mengunggah ulang.
update public.profile
   set photos = array[photo_url]
 where photo_url is not null
   and btrim(photo_url) <> ''
   and cardinality(photos) = 0;
