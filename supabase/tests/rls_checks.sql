-- Pemeriksaan Row Level Security.
--
-- Baris draf yang bocor ke publik tampak PERSIS seperti situs yang bekerja
-- normal, jadi ini satu-satunya persyaratan di change ini yang kegagalannya
-- tidak terlihat di antarmuka. Jalankan setiap kali policy disentuh.
--
-- Cara menjalankan:
--   Lokal : npx supabase db reset   (migrasi + seed)
--           psql "$(npx supabase status -o env | grep DB_URL | cut -d= -f2-)" \
--             -v ON_ERROR_STOP=1 -f supabase/tests/rls_checks.sql
--   Remote: psql "<connection string Supabase Anda>" \
--             -v ON_ERROR_STOP=1 -f supabase/tests/rls_checks.sql
--
-- Seluruh skrip berjalan di dalam satu transaksi yang di-ROLLBACK di akhir,
-- sehingga tidak meninggalkan perubahan apa pun pada database.

\set ON_ERROR_STOP on

begin;

-- ---------------------------------------------------------------------------
-- Siapkan data uji: satu baris terbit dan satu baris draf per tabel yang diuji.
-- ---------------------------------------------------------------------------

insert into public.projects (id, title, slug, is_published, sort_order)
values
  ('11111111-1111-1111-1111-111111111111', 'Proyek Terbit', 'uji-terbit', true, 1),
  ('22222222-2222-2222-2222-222222222222', 'Proyek Draf', 'uji-draf', false, 2);

insert into public.messages (id, sender_name, sender_email, body)
values ('33333333-3333-3333-3333-333333333333', 'Penguji', 'uji@contoh.test', 'Isi pesan uji');

insert into public.ratings (id, reviewer_name, stars, is_approved)
values ('44444444-4444-4444-4444-444444444444', 'Penguji', 5, true);

-- ---------------------------------------------------------------------------
-- Sebagai anon.
-- ---------------------------------------------------------------------------

set local role anon;

do $$
begin
  -- Baris terbit terlihat.
  if not exists (
    select 1 from public.projects
    where id = '11111111-1111-1111-1111-111111111111'
  ) then
    raise exception 'GAGAL: anon tidak dapat melihat proyek yang terbit';
  end if;

  -- Baris draf TIDAK terlihat.
  if exists (
    select 1 from public.projects
    where id = '22222222-2222-2222-2222-222222222222'
  ) then
    raise exception 'GAGAL: anon dapat melihat proyek yang BELUM terbit (kebocoran draf)';
  end if;

  -- messages tertutup penuh.
  if exists (select 1 from public.messages) then
    raise exception 'GAGAL: anon dapat membaca public.messages';
  end if;

  -- ratings tertutup penuh di change ini, termasuk yang sudah disetujui.
  if exists (select 1 from public.ratings) then
    raise exception 'GAGAL: anon dapat membaca public.ratings';
  end if;

  raise notice 'LULUS: anon hanya melihat konten terbit; messages dan ratings tertutup';
end;
$$;

-- Penulisan oleh anon harus ditolak di setiap tabel konten.
do $$
declare
  nama_tabel text;
  gagal text[] := '{}';
begin
  foreach nama_tabel in array array[
    'profile', 'social_links', 'education', 'skill_categories',
    'skills', 'experiences', 'projects', 'achievements',
    'messages', 'ratings'
  ]
  loop
    -- INSERT
    begin
      execute format('insert into public.%I default values', nama_tabel);
      gagal := gagal || format('INSERT ke %s diizinkan', nama_tabel);
    exception
      when insufficient_privilege or check_violation or not_null_violation then
        null; -- ditolak: inilah yang diharapkan
    end;

    -- UPDATE
    begin
      execute format('update public.%I set updated_at = now()', nama_tabel);
      if found then
        gagal := gagal || format('UPDATE pada %s mengubah baris', nama_tabel);
      end if;
    exception
      when insufficient_privilege then null;
    end;

    -- DELETE
    begin
      execute format('delete from public.%I', nama_tabel);
      if found then
        gagal := gagal || format('DELETE pada %s menghapus baris', nama_tabel);
      end if;
    exception
      when insufficient_privilege then null;
    end;
  end loop;

  if array_length(gagal, 1) > 0 then
    raise exception 'GAGAL: penulisan oleh anon tidak tertutup: %', array_to_string(gagal, '; ');
  end if;

  raise notice 'LULUS: anon tidak dapat INSERT, UPDATE, maupun DELETE di tabel mana pun';
end;
$$;

reset role;

-- ---------------------------------------------------------------------------
-- Sebagai authenticated.
-- ---------------------------------------------------------------------------

set local role authenticated;

do $$
begin
  -- Admin melihat baris draf juga.
  if not exists (
    select 1 from public.projects
    where id = '22222222-2222-2222-2222-222222222222'
  ) then
    raise exception 'GAGAL: authenticated tidak dapat melihat proyek draf';
  end if;

  if not exists (select 1 from public.messages) then
    raise exception 'GAGAL: authenticated tidak dapat membaca public.messages';
  end if;

  if not exists (select 1 from public.ratings) then
    raise exception 'GAGAL: authenticated tidak dapat membaca public.ratings';
  end if;

  raise notice 'LULUS: authenticated melihat baris draf, pesan, dan rating';
end;
$$;

-- Admin dapat menulis.
do $$
begin
  update public.projects
    set title = 'Diubah oleh admin'
    where id = '11111111-1111-1111-1111-111111111111';

  if not found then
    raise exception 'GAGAL: authenticated tidak dapat UPDATE proyek';
  end if;

  raise notice 'LULUS: authenticated dapat mengubah konten';
end;
$$;

reset role;

-- ---------------------------------------------------------------------------
-- Pemeriksaan constraint yang menegakkan model data.
-- ---------------------------------------------------------------------------

do $$
declare
  profil_sudah_ada boolean;
begin
  select exists (select 1 from public.profile) into profil_sudah_ada;

  if not profil_sudah_ada then
    insert into public.profile (full_name, username) values ('Satu', 'satu');
  end if;

  -- Baris profil kedua harus ditolak.
  begin
    insert into public.profile (full_name, username) values ('Dua', 'dua');
    raise exception 'GAGAL: baris profile kedua dapat disisipkan';
  exception
    when unique_violation then
      raise notice 'LULUS: baris profile kedua ditolak';
  end;
end;
$$;

do $$
begin
  -- Slug duplikat ditolak.
  begin
    insert into public.projects (title, slug) values ('Bentrok', 'uji-terbit');
    raise exception 'GAGAL: slug proyek duplikat dapat disisipkan';
  exception
    when unique_violation then
      raise notice 'LULUS: slug proyek duplikat ditolak';
  end;

  -- Bintang di luar rentang ditolak.
  begin
    insert into public.ratings (reviewer_name, stars) values ('Nol', 0);
    raise exception 'GAGAL: rating dengan 0 bintang dapat disisipkan';
  exception
    when check_violation then
      raise notice 'LULUS: rating 0 bintang ditolak';
  end;

  begin
    insert into public.ratings (reviewer_name, stars) values ('Enam', 6);
    raise exception 'GAGAL: rating dengan 6 bintang dapat disisipkan';
  exception
    when check_violation then
      raise notice 'LULUS: rating 6 bintang ditolak';
  end;

  -- Nilai enum di luar daftar ditolak.
  begin
    insert into public.experiences (position, organization, type, start_date)
    values ('Uji', 'Uji', 'tidak-ada', current_date);
    raise exception 'GAGAL: tipe pengalaman di luar enum dapat disisipkan';
  exception
    when invalid_text_representation then
      raise notice 'LULUS: tipe pengalaman di luar enum ditolak';
  end;

  -- Pengalaman masih berjalan tanpa tanggal selesai harus bisa disimpan.
  insert into public.experiences (position, organization, type, start_date, is_ongoing)
  values ('Masih Berjalan', 'Uji', 'work', current_date, true);
  raise notice 'LULUS: pengalaman masih berjalan tanpa tanggal selesai tersimpan';
end;
$$;

-- updated_at diperbarui otomatis oleh trigger.
--
-- Catatan penting: membandingkan updated_at sebelum dan sesudah UPDATE TIDAK
-- bisa dipakai di sini, karena now() mengembalikan waktu mulai transaksi dan
-- seluruh skrip ini berjalan dalam satu transaksi — kedua nilainya akan selalu
-- sama persis, walaupun trigger-nya bekerja dengan benar.
--
-- Jadi yang diuji: pemanggil sengaja mengirim updated_at bernilai masa lalu,
-- lalu dibuktikan bahwa trigger MENIMPA nilai itu. Ini sekaligus memenuhi
-- bunyi spesifikasi "tanpa perlu dikirim oleh pemanggil".
do $$
declare
  sesudah timestamptz;
begin
  update public.projects
    set title = 'Sentuh updated_at',
        updated_at = timestamptz '2000-01-01 00:00:00+00'
    where id = '11111111-1111-1111-1111-111111111111';

  select updated_at into sesudah from public.projects
    where id = '11111111-1111-1111-1111-111111111111';

  if sesudah < now() - interval '1 day' then
    raise exception
      'GAGAL: trigger tidak menimpa updated_at yang dikirim pemanggil (nilainya tetap %)',
      sesudah;
  end if;

  raise notice 'LULUS: updated_at ditimpa otomatis oleh trigger';
end;
$$;

-- Menghapus kategori keahlian ikut menghapus keahliannya.
do $$
declare
  id_kategori uuid;
  sisa integer;
begin
  insert into public.skill_categories (name) values ('Kategori Uji')
    returning id into id_kategori;

  insert into public.skills (category_id, name) values (id_kategori, 'Keahlian Uji');

  delete from public.skill_categories where id = id_kategori;

  select count(*) into sisa from public.skills where category_id = id_kategori;

  if sisa <> 0 then
    raise exception 'GAGAL: keahlian tidak ikut terhapus saat kategorinya dihapus';
  end if;

  raise notice 'LULUS: menghapus kategori ikut menghapus keahliannya';
end;
$$;

-- Bucket Storage publik ada.
do $$
begin
  if not exists (select 1 from storage.buckets where id = 'media' and public) then
    raise exception 'GAGAL: bucket Storage "media" tidak ada atau tidak publik';
  end if;

  raise notice 'LULUS: bucket Storage "media" ada dan publik';
end;
$$;

rollback;

\echo ''
\echo 'Semua pemeriksaan RLS dan constraint LULUS. Tidak ada perubahan yang disimpan (transaksi di-rollback).'
