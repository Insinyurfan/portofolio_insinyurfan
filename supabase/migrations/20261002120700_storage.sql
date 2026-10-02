-- Storage: satu bucket publik untuk seluruh media portofolio.
--
-- Bucket ditandai publik supaya URL-nya stabil dan ramah next/image tanpa
-- signed URL yang kedaluwarsa (yang akan mengacaukan cache ISR dan cache
-- gambar). Lihat design.md → "Satu bucket Storage publik dengan prefiks".
--
-- BATASAN PENTING: hanya aset yang memang ditujukan untuk publik yang boleh
-- masuk ke bucket ini — foto profil, thumbnail dan galeri proyek, gambar
-- pencapaian, dan berkas CV. URL di bucket publik dapat diambil siapa pun
-- yang menebak namanya, jadi jangan pernah menaruh lampiran privat di sini.

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update set public = true;

-- Baca publik: berkas yang dirujuk konten terbit harus dapat dimuat tanpa login.
create policy "anon membaca media"
  on storage.objects for select to anon
  using (bucket_id = 'media');

-- Menulis hanya untuk pengguna terautentikasi. Tiga policy terpisah supaya
-- jelas terbaca bahwa unggah, ubah, dan hapus semuanya tertutup bagi anon.
create policy "admin mengunggah media"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'media');

create policy "admin mengubah media"
  on storage.objects for update to authenticated
  using (bucket_id = 'media')
  with check (bucket_id = 'media');

create policy "admin menghapus media"
  on storage.objects for delete to authenticated
  using (bucket_id = 'media');
