-- Hak SELECT pada Storage untuk pengguna terautentikasi.
--
-- MENGAPA MIGRASI INI ADA:
-- Migrasi 20261002120700 memberi `authenticated` hak INSERT, UPDATE, dan
-- DELETE pada bucket `media`, tetapi TIDAK memberi SELECT. Akibatnya
-- `storage.remove()` tidak bisa menemukan objek yang akan dihapus: ia perlu
-- membaca baris objeknya lebih dulu, lalu menghapusnya. Tanpa SELECT, DELETE
-- cocok ke nol baris dan API mengembalikan SUKSES tanpa menghapus apa pun.
--
-- Gejalanya: mengganti foto atau menghapus proyek tampak berhasil, tetapi
-- berkas lamanya tetap menumpuk di Storage selamanya. Tidak ada error di log,
-- karena memang tidak ada error — hanya nol baris terpengaruh.
--
-- Terdeteksi oleh pengujian browser ujung ke ujung, bukan oleh pembacaan kode:
-- assertion "berkas thumbnail terhapus dari Storage" gagal, dan tabel
-- storage.objects membuktikan berkasnya masih ada.
--
-- Policy `anon membaca media` sudah ada dan tetap berlaku untuk publik; policy
-- di bawah ini khusus role authenticated.

create policy "admin membaca media"
  on storage.objects for select to authenticated
  using (bucket_id = 'media');
