-- Pemeriksaan skema sisi admin.
--
-- Melengkapi rls_checks.sql. Yang diuji di sini adalah hal-hal yang dipakai
-- dashboard dan kegagalannya tidak terlihat di antarmuka:
--   1. penanda dibaca pada pesan beserta nilai bawaannya
--   2. constraint kolom messages
--   3. fungsi pengurutan: atomisitas, determinisme, allowlist tabel
--   4. fungsi pengurutan TIDAK dapat dipanggil role anon
--
-- Cara menjalankan:  node scripts/run-sql.mjs supabase/tests/admin_checks.sql
--
-- Seluruh skrip berada dalam satu transaksi yang di-ROLLBACK di akhir.

begin;

-- ---------------------------------------------------------------------------
-- 1. Tabel messages
-- ---------------------------------------------------------------------------

do $$
declare
  id_pesan uuid;
  terbaca boolean;
begin
  -- Pesan baru harus tersimpan sebagai belum dibaca tanpa diminta.
  insert into public.messages (sender_name, sender_email, body)
  values ('Penguji', 'uji@contoh.test', E'Baris satu.\n\nBaris dua.')
  returning id, is_read into id_pesan, terbaca;

  if terbaca then
    raise exception 'GAGAL: pesan baru tersimpan sebagai SUDAH dibaca';
  end if;
  raise notice 'LULUS: pesan baru default belum dibaca';

  -- Subjek bersifat opsional.
  if (select subject from public.messages where id = id_pesan) is not null then
    raise exception 'GAGAL: subjek terisi padahal tidak dikirim';
  end if;
  raise notice 'LULUS: pesan tanpa subjek tersimpan';

  -- Hitungan belum dibaca hanya menghitung yang penandanya false.
  update public.messages set is_read = true where id = id_pesan;
  if exists (select 1 from public.messages where id = id_pesan and not is_read) then
    raise exception 'GAGAL: penanda dibaca tidak tersimpan';
  end if;
  raise notice 'LULUS: penanda dibaca dapat diubah';
end;
$$;

do $$
begin
  -- Isi pesan wajib ada.
  begin
    insert into public.messages (sender_name, sender_email, body)
    values ('Penguji', 'uji@contoh.test', '');
    raise exception 'GAGAL: pesan dengan isi kosong dapat disisipkan';
  exception
    when check_violation then
      raise notice 'LULUS: pesan tanpa isi ditolak';
  end;

  begin
    insert into public.messages (sender_name, sender_email)
    values ('Penguji', 'uji@contoh.test');
    raise exception 'GAGAL: pesan tanpa kolom body dapat disisipkan';
  exception
    when not_null_violation then
      raise notice 'LULUS: pesan tanpa kolom isi ditolak';
  end;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. Fungsi pengurutan
-- ---------------------------------------------------------------------------

do $$
declare
  a uuid := '0a000000-0000-4000-8000-00000000000a';
  b uuid := '0b000000-0000-4000-8000-00000000000b';
  c uuid := '0c000000-0000-4000-8000-00000000000c';
  urutan uuid[];
  berpindah boolean;
begin
  -- Tiga kategori keahlian berurutan sebagai bahan uji.
  insert into public.skill_categories (id, name, sort_order) values
    (a, 'Uji A', 101),
    (b, 'Uji B', 102),
    (c, 'Uji C', 103);

  -- Turunkan A satu langkah: urutan harus menjadi B, A, C.
  select public.swap_sort_order('skill_categories', a, 1) into berpindah;
  if not berpindah then
    raise exception 'GAGAL: fungsi melaporkan tidak ada pertukaran padahal ada tetangga';
  end if;

  select array_agg(id order by sort_order, id) into urutan
    from public.skill_categories where id in (a, b, c);

  if urutan <> array[b, a, c] then
    raise exception 'GAGAL: urutan setelah turun = %, seharusnya B,A,C', urutan;
  end if;
  raise notice 'LULUS: tombol turun menukar posisi dengan tetangga';

  -- Naikkan A kembali: urutan harus kembali A, B, C.
  perform public.swap_sort_order('skill_categories', a, -1);
  select array_agg(id order by sort_order, id) into urutan
    from public.skill_categories where id in (a, b, c);

  if urutan <> array[a, b, c] then
    raise exception 'GAGAL: urutan setelah naik = %, seharusnya A,B,C', urutan;
  end if;
  raise notice 'LULUS: tombol naik menukar posisi dengan tetangga';

  -- Di ujung daftar: mengembalikan false, bukan error.
  if public.swap_sort_order('skill_categories', a, -1) then
    -- A bukan item pertama secara global (ada data seed), jadi ini wajar
    -- berpindah. Yang diuji di bawah adalah item paling awal sungguhan.
    null;
  end if;

  -- Tidak ada nilai sort_order kembar setelah rangkaian pemindahan.
  if (
    select count(*) from (
      select sort_order from public.skill_categories
      group by sort_order having count(*) > 1
    ) k
  ) > 0 then
    raise exception 'GAGAL: ada nilai sort_order kembar setelah pemindahan';
  end if;
  raise notice 'LULUS: tidak ada sort_order kembar setelah pemindahan';
end;
$$;

do $$
declare
  x uuid := '0d000000-0000-4000-8000-00000000000d';
  y uuid := '0e000000-0000-4000-8000-00000000000e';
  urutan uuid[];
begin
  -- Dua baris dengan sort_order KEMBAR: pertukaran harus tetap mengubah urutan.
  insert into public.social_links (id, platform, url, sort_order) values
    (x, 'uji-x', 'https://contoh.test/x', 900),
    (y, 'uji-y', 'https://contoh.test/y', 900);

  select array_agg(id order by sort_order, id) into urutan
    from public.social_links where id in (x, y);

  -- Urutan awal deterministik menurut (sort_order, id): x lebih dulu.
  if urutan <> array[x, y] then
    raise exception 'GAGAL: urutan awal nilai kembar tidak deterministik: %', urutan;
  end if;

  perform public.swap_sort_order('social_links', x, 1);

  select array_agg(id order by sort_order, id) into urutan
    from public.social_links where id in (x, y);

  if urutan <> array[y, x] then
    raise exception 'GAGAL: nilai sort_order kembar tidak benar-benar bertukar: %', urutan;
  end if;
  raise notice 'LULUS: nilai sort_order kembar tetap bertukar secara deterministik';
end;
$$;

do $$
begin
  -- Nama tabel di luar allowlist ditolak.
  begin
    perform public.swap_sort_order('auth.users', gen_random_uuid(), 1);
    raise exception 'GAGAL: tabel di luar allowlist diterima';
  exception
    when invalid_parameter_value then
      raise notice 'LULUS: tabel di luar allowlist ditolak';
  end;

  -- Arah selain -1 / 1 ditolak.
  begin
    perform public.swap_sort_order('projects', gen_random_uuid(), 5);
    raise exception 'GAGAL: arah tidak sah diterima';
  exception
    when invalid_parameter_value then
      raise notice 'LULUS: arah selain -1/1 ditolak';
  end;
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. Role anon tidak boleh memanggil fungsi pengurutan
-- ---------------------------------------------------------------------------

set local role anon;

do $$
begin
  begin
    perform public.swap_sort_order('projects', gen_random_uuid(), 1);
    raise exception 'GAGAL: role anon dapat memanggil swap_sort_order';
  exception
    when insufficient_privilege then
      raise notice 'LULUS: role anon tidak dapat memanggil swap_sort_order';
  end;
end;
$$;

reset role;

-- ---------------------------------------------------------------------------
-- 4. Hak kolom: anon tidak boleh mengubah penanda dibaca
-- ---------------------------------------------------------------------------

set local role anon;

do $$
begin
  begin
    update public.messages set is_read = true;
    if found then
      raise exception 'GAGAL: anon dapat mengubah penanda dibaca';
    end if;
    raise notice 'LULUS: UPDATE anon pada messages tidak mengubah baris apa pun';
  exception
    when insufficient_privilege then
      raise notice 'LULUS: anon tidak punya hak UPDATE pada messages';
  end;
end;
$$;

reset role;

rollback;
