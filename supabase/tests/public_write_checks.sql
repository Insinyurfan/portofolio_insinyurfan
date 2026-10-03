-- Pemeriksaan jalur tulis publik.
--
-- Ini pemeriksaan paling penting di seluruh proyek: sejak migrasi
-- 20261003100100, orang di luar pemilik dapat menulis ke database. Kalau salah
-- satu assertion di bawah gagal, gejalanya TIDAK terlihat di antarmuka —
-- situsnya tetap tampak bekerja normal sementara pengunjung bisa membaca
-- pesan, menyetujui ratingnya sendiri, atau membanjiri tabel.
--
-- Jalankan: node scripts/run-sql.mjs supabase/tests/public_write_checks.sql
--
-- Seluruh skrip berada dalam satu transaksi yang di-ROLLBACK di akhir.

begin;

-- Bahan uji: satu rating disetujui, satu belum.
insert into public.ratings (id, reviewer_name, stars, comment, is_approved) values
  ('aa000000-0000-4000-8000-00000000000a', 'Disetujui', 5, 'Bagus', true),
  ('bb000000-0000-4000-8000-00000000000b', 'Menunggu', 1, 'Belum ditinjau', false);

insert into public.messages (id, sender_name, sender_email, body)
values ('cc000000-0000-4000-8000-00000000000c', 'Pengirim', 'kirim@contoh.test', 'Rahasia');

-- ---------------------------------------------------------------------------
-- Sebagai anon: apa yang BOLEH
-- ---------------------------------------------------------------------------

set local role anon;

do $$
begin
  -- Mengirim pesan.
  insert into public.messages (sender_name, sender_email, subject, body)
  values ('Pengunjung', 'pengunjung@contoh.test', 'Halo', 'Isi pesan dari pengunjung.');
  raise notice 'LULUS: anon dapat mengirim pesan';

  -- Mengirim pesan tanpa subjek.
  insert into public.messages (sender_name, sender_email, body)
  values ('Tanpa Subjek', 'ts@contoh.test', 'Isi saja.');
  raise notice 'LULUS: anon dapat mengirim pesan tanpa subjek';

  -- Mengirim rating.
  insert into public.ratings (reviewer_name, stars, comment)
  values ('Pemberi Rating', 5, 'Kerja bagus.');
  raise notice 'LULUS: anon dapat mengirim rating';

  -- Mengirim rating tanpa komentar.
  insert into public.ratings (reviewer_name, stars)
  values ('Tanpa Komentar', 4);
  raise notice 'LULUS: anon dapat mengirim rating tanpa komentar';
end;
$$;

-- ---------------------------------------------------------------------------
-- Sebagai anon: apa yang TIDAK BOLEH
-- ---------------------------------------------------------------------------

do $$
declare
  terlihat integer;
begin
  -- messages tetap tertutup penuh, termasuk baris yang baru dikirim sendiri.
  select count(*) into terlihat from public.messages;
  if terlihat <> 0 then
    raise exception 'GAGAL: anon dapat membaca % baris messages', terlihat;
  end if;
  raise notice 'LULUS: messages tetap tertutup dari anon';

  -- ratings: hanya yang sudah disetujui.
  select count(*) into terlihat from public.ratings;
  if terlihat <> 1 then
    raise exception 'GAGAL: anon melihat % baris ratings, seharusnya hanya 1 yang disetujui', terlihat;
  end if;

  if not exists (
    select 1 from public.ratings where id = 'aa000000-0000-4000-8000-00000000000a'
  ) then
    raise exception 'GAGAL: anon tidak melihat rating yang disetujui';
  end if;

  if exists (
    select 1 from public.ratings where id = 'bb000000-0000-4000-8000-00000000000b'
  ) then
    raise exception 'GAGAL: anon dapat melihat rating yang BELUM disetujui';
  end if;
  raise notice 'LULUS: anon hanya melihat rating yang sudah disetujui';
end;
$$;

do $$
begin
  -- Menyetujui rating sendiri harus ditolak.
  begin
    insert into public.ratings (reviewer_name, stars, is_approved)
    values ('Curang', 5, true);
    raise exception 'GAGAL: anon dapat menyisipkan rating yang langsung disetujui';
  exception
    when insufficient_privilege or check_violation then
      raise notice 'LULUS: anon tidak dapat menyetujui ratingnya sendiri';
  end;

  -- Menandai pesan sendiri sudah dibaca harus ditolak.
  begin
    insert into public.messages (sender_name, sender_email, body, is_read)
    values ('Curang', 'curang@contoh.test', 'Isi', true);
    raise exception 'GAGAL: anon dapat menyisipkan pesan yang langsung dibaca';
  exception
    when insufficient_privilege or check_violation then
      raise notice 'LULUS: anon tidak dapat menandai pesannya sudah dibaca';
  end;
end;
$$;

do $$
begin
  -- UPDATE dan DELETE tertutup di kedua tabel.
  begin
    update public.ratings set is_approved = true;
    if found then
      raise exception 'GAGAL: anon dapat UPDATE ratings';
    end if;
    raise notice 'LULUS: UPDATE anon pada ratings tidak mengubah baris';
  exception
    when insufficient_privilege then
      raise notice 'LULUS: anon tidak punya hak UPDATE pada ratings';
  end;

  begin
    delete from public.ratings;
    if found then
      raise exception 'GAGAL: anon dapat DELETE ratings';
    end if;
    raise notice 'LULUS: DELETE anon pada ratings tidak menghapus baris';
  exception
    when insufficient_privilege then
      raise notice 'LULUS: anon tidak punya hak DELETE pada ratings';
  end;

  begin
    update public.messages set is_read = true;
    if found then
      raise exception 'GAGAL: anon dapat UPDATE messages';
    end if;
    raise notice 'LULUS: UPDATE anon pada messages tidak mengubah baris';
  exception
    when insufficient_privilege then
      raise notice 'LULUS: anon tidak punya hak UPDATE pada messages';
  end;

  begin
    delete from public.messages;
    if found then
      raise exception 'GAGAL: anon dapat DELETE messages';
    end if;
    raise notice 'LULUS: DELETE anon pada messages tidak menghapus baris';
  exception
    when insufficient_privilege then
      raise notice 'LULUS: anon tidak punya hak DELETE pada messages';
  end;
end;
$$;

-- ---------------------------------------------------------------------------
-- Penghitung pembatasan laju tertutup dari anon
-- ---------------------------------------------------------------------------

do $$
begin
  begin
    perform count(*) from public.rate_limit_attempts;
    if (select count(*) from public.rate_limit_attempts) <> 0 then
      raise exception 'GAGAL: anon dapat membaca penghitung pembatasan laju';
    end if;
    raise notice 'LULUS: anon tidak melihat baris penghitung pembatasan laju';
  exception
    when insufficient_privilege then
      raise notice 'LULUS: anon tidak punya hak membaca penghitung';
  end;

  begin
    insert into public.rate_limit_attempts (sender_hash, form_kind)
    values ('palsu', 'contact');
    raise exception 'GAGAL: anon dapat menyisipkan ke penghitung';
  exception
    when insufficient_privilege then
      raise notice 'LULUS: anon tidak dapat menyisipkan ke penghitung';
  end;
end;
$$;

-- ---------------------------------------------------------------------------
-- Fungsi pembatasan laju
-- ---------------------------------------------------------------------------

do $$
declare
  diizinkan boolean;
  lolos integer := 0;
begin
  -- Lima percobaan pertama diizinkan, yang keenam ditolak.
  for i in 1..6 loop
    select public.check_rate_limit('uji-hash-1', 'contact', 5, 3600) into diizinkan;
    if diizinkan then lolos := lolos + 1; end if;
  end loop;

  if lolos <> 5 then
    raise exception 'GAGAL: % percobaan lolos dari 6, seharusnya 5', lolos;
  end if;
  raise notice 'LULUS: batas laju menolak percobaan melebihi kuota';

  -- Pengirim berbeda tidak saling memengaruhi.
  select public.check_rate_limit('uji-hash-2', 'contact', 5, 3600) into diizinkan;
  if not diizinkan then
    raise exception 'GAGAL: pengirim berbeda ikut terblokir';
  end if;
  raise notice 'LULUS: pengirim berbeda tidak saling memengaruhi';

  -- Jenis form berbeda punya kuota sendiri.
  select public.check_rate_limit('uji-hash-1', 'rating', 5, 3600) into diizinkan;
  if not diizinkan then
    raise exception 'GAGAL: kuota form kontak ikut memblokir form rating';
  end if;
  raise notice 'LULUS: setiap jenis form punya kuota sendiri';

  -- Jendela waktu nol detik berarti tidak ada percobaan lama yang terhitung.
  select public.check_rate_limit('uji-hash-1', 'contact', 5, 0) into diizinkan;
  if not diizinkan then
    raise exception 'GAGAL: batas tidak terbuka kembali setelah jendela lewat';
  end if;
  raise notice 'LULUS: batas terbuka kembali setelah jendela waktu lewat';

  -- Jenis form tidak dikenal ditolak.
  begin
    perform public.check_rate_limit('uji-hash-1', 'tidak-ada', 5, 3600);
    raise exception 'GAGAL: jenis form tidak dikenal diterima';
  exception
    when invalid_parameter_value then
      raise notice 'LULUS: jenis form tidak dikenal ditolak';
  end;
end;
$$;

reset role;

-- ---------------------------------------------------------------------------
-- View agregat
-- ---------------------------------------------------------------------------

set local role anon;

do $$
declare
  n integer;
  rata numeric;
begin
  select total, average into n, rata from public.rating_summary;

  -- Hanya rating disetujui yang terhitung. Yang dikirim anon di atas semuanya
  -- belum disetujui, jadi hanya baris bahan uji yang masuk hitungan.
  if n <> 1 then
    raise exception 'GAGAL: agregat menghitung % rating, seharusnya 1 yang disetujui', n;
  end if;

  if rata <> 5 then
    raise exception 'GAGAL: rata-rata %, seharusnya 5', rata;
  end if;

  raise notice 'LULUS: agregat hanya menghitung rating yang disetujui';
end;
$$;

reset role;

rollback;
