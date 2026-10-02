-- Pengurutan item: tukar sort_order dengan tetangga, secara atomik.
--
-- Mengapa harus fungsi database, bukan dua UPDATE dari aplikasi:
-- Supabase JS tidak punya transaksi, jadi dua UPDATE terpisah bisa berhenti di
-- tengah dan meninggalkan dua baris dengan sort_order kembar — persis yang
-- dilarang spesifikasi. Satu fungsi berarti satu kali perjalanan dan atomik.
--
-- SECURITY INVOKER bersifat WAJIB di sini.
-- SECURITY DEFINER akan membuat fungsi ini melewati RLS dan menjadi jalur
-- tulis yang terbuka bagi role anon. Jangan pernah mengubahnya.
-- (Bandingkan dengan fungsi pembatasan laju di change berikutnya, yang justru
-- wajib SECURITY DEFINER karena alasan yang berlawanan.)

-- Normalisasi satu kali: buat sort_order berurutan rapat per tabel, supaya
-- data yang diseed tidak mulai dengan nilai kembar atau bolong.
do $$
declare
  nama_tabel text;
begin
  foreach nama_tabel in array array[
    'social_links', 'education', 'skill_categories',
    'skills', 'experiences', 'projects', 'achievements'
  ]
  loop
    execute format($f$
      with berurut as (
        select id, row_number() over (order by sort_order, id) as baru
        from public.%1$I
      )
      update public.%1$I t
         set sort_order = berurut.baru
        from berurut
       where t.id = berurut.id
         and t.sort_order <> berurut.baru
    $f$, nama_tabel);
  end loop;
end;
$$;

-- Menukar posisi satu item dengan tetangganya.
--
-- p_table    : nama tabel, divalidasi terhadap allowlist di dalam fungsi
-- p_id       : item yang dipindahkan
-- p_direction: -1 untuk naik, +1 untuk turun
--
-- Mengembalikan true kalau pertukaran terjadi, false kalau item sudah berada
-- di ujung daftar (tidak ada tetangga ke arah itu).
create or replace function public.swap_sort_order(
  p_table text,
  p_id uuid,
  p_direction integer
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  tabel_diizinkan text[] := array[
    'social_links', 'education', 'skill_categories',
    'skills', 'experiences', 'projects', 'achievements'
  ];
  id_tetangga uuid;
  urutan_ini integer;
  urutan_tetangga integer;
begin
  -- Nama tabel tidak pernah dirangkai sebagai teks mentah: ia divalidasi
  -- terhadap allowlist lalu disisipkan sebagai identifier lewat %I.
  if not (p_table = any (tabel_diizinkan)) then
    raise exception 'Tabel "%" tidak dapat diurutkan', p_table
      using errcode = 'invalid_parameter_value';
  end if;

  if p_direction not in (-1, 1) then
    raise exception 'Arah harus -1 (naik) atau 1 (turun), diberi %', p_direction
      using errcode = 'invalid_parameter_value';
  end if;

  -- Tetangga ditentukan dengan mengurutkan (sort_order, id). Pengurutan
  -- sekunder pada id itulah yang membuat hasilnya tetap deterministik walau
  -- ada dua baris dengan sort_order yang sama.
  if p_direction = -1 then
    execute format($f$
      select id, sort_order from public.%1$I
       where (sort_order, id) < (
               select sort_order, id from public.%1$I where id = $1
             )
       order by sort_order desc, id desc
       limit 1
    $f$, p_table)
    into id_tetangga, urutan_tetangga
    using p_id;
  else
    execute format($f$
      select id, sort_order from public.%1$I
       where (sort_order, id) > (
               select sort_order, id from public.%1$I where id = $1
             )
       order by sort_order asc, id asc
       limit 1
    $f$, p_table)
    into id_tetangga, urutan_tetangga
    using p_id;
  end if;

  -- Sudah di ujung daftar: bukan error, hanya tidak ada yang dilakukan.
  if id_tetangga is null then
    return false;
  end if;

  execute format('select sort_order from public.%1$I where id = $1', p_table)
    into urutan_ini using p_id;

  -- Kalau nilainya kembar, pertukaran angka tidak akan mengubah apa pun.
  -- Dalam kasus itu item yang dipindahkan diberi nilai tetangga dan
  -- tetangganya digeser, sehingga urutannya benar-benar berubah.
  if urutan_ini = urutan_tetangga then
    urutan_tetangga := urutan_tetangga + p_direction;
  end if;

  -- Satu pernyataan, dua baris: atomik tanpa perlu transaksi di aplikasi.
  execute format($f$
    update public.%1$I
       set sort_order = case id when $1 then $3 else $4 end
     where id in ($1, $2)
  $f$, p_table)
  using p_id, id_tetangga, urutan_tetangga, urutan_ini;

  return true;
end;
$$;

comment on function public.swap_sort_order(text, uuid, integer) is
  'Menukar sort_order sebuah item dengan tetangganya, atomik. SECURITY INVOKER: wajib, supaya RLS tetap berlaku.';

-- Role anon tidak diberi hak eksekusi. Pengguna terautentikasi diberi.
revoke all on function public.swap_sort_order(text, uuid, integer) from public;
grant execute on function public.swap_sort_order(text, uuid, integer) to authenticated;
