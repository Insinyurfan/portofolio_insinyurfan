-- Pembatasan laju pengiriman form publik.
--
-- Dihitung di database, bukan di memori proses: di serverless setiap instance
-- punya memorinya sendiri, sehingga hitungan di memori selalu salah.

create table public.rate_limit_attempts (
  id bigint generated always as identity primary key,

  -- Hash pengenal pengirim, BUKAN alamat IP mentah. Pembatasan laju hanya
  -- perlu membedakan pengirim, tidak perlu tahu identitasnya — jadi tabel ini
  -- tidak menjadi catatan alamat pengunjung.
  sender_hash text not null,

  form_kind text not null,
  created_at timestamptz not null default now(),

  constraint rate_limit_form_kind check (form_kind in ('contact', 'rating'))
);

comment on table public.rate_limit_attempts is
  'Penghitung percobaan pengiriman form publik. Tertutup penuh dari anon; hanya diakses lewat fungsi check_rate_limit().';

create index rate_limit_lookup_idx
  on public.rate_limit_attempts (sender_hash, form_kind, created_at desc);

alter table public.rate_limit_attempts enable row level security;

-- TIDAK ADA policy untuk anon. RLS aktif tanpa policy permisif = ditolak.
-- Pengunjung menyentuh tabel ini HANYA lewat fungsi di bawah.
create policy "admin membaca penghitung laju"
  on public.rate_limit_attempts for select to authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- Fungsi pembatasan laju
-- ---------------------------------------------------------------------------

-- SECURITY DEFINER di sini WAJIB, dan alasannya berlawanan dengan
-- swap_sort_order yang justru wajib SECURITY INVOKER:
--
--   * swap_sort_order: melewati RLS berarti membuka jalur tulis bagi anon,
--     jadi harus INVOKER.
--   * fungsi ini: melewati RLS justru yang membuat penghitung tidak dapat
--     dibaca maupun dipalsukan pengunjung — mereka hanya bisa menanyakan
--     "boleh kirim?" dan menerima ya/tidak.
--
-- Jangan menyeragamkan keduanya tanpa memahami perbedaan ini.
--
-- search_path dikunci supaya fungsi berhak khusus ini tidak bisa dibajak
-- lewat objek bernama sama di schema lain.
create or replace function public.check_rate_limit(
  p_sender_hash text,
  p_form_kind text,
  p_max_attempts integer default 5,
  p_window_seconds integer default 3600
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  jumlah integer;
begin
  if p_sender_hash is null or btrim(p_sender_hash) = '' then
    raise exception 'Pengenal pengirim kosong'
      using errcode = 'invalid_parameter_value';
  end if;

  if p_form_kind not in ('contact', 'rating') then
    raise exception 'Jenis form tidak dikenal: %', p_form_kind
      using errcode = 'invalid_parameter_value';
  end if;

  -- Pembersihan sesekali (kira-kira 1 dari 50 pemanggilan), supaya catatan
  -- lama tidak menumpuk selamanya tanpa butuh pekerjaan terjadwal.
  if random() < 0.02 then
    delete from public.rate_limit_attempts
     where created_at < now() - interval '1 day';
  end if;

  -- Menghitung DAN mencatat dalam satu pernyataan: dua permintaan yang tiba
  -- bersamaan tidak bisa sama-sama lolos saat kuota tersisa satu, karena
  -- INSERT menjadi bagian dari pernyataan yang sama.
  with terkini as (
    select count(*)::integer as n
      from public.rate_limit_attempts
     where sender_hash = p_sender_hash
       and form_kind = p_form_kind
       and created_at > now() - make_interval(secs => p_window_seconds)
  ),
  dicatat as (
    insert into public.rate_limit_attempts (sender_hash, form_kind)
    select p_sender_hash, p_form_kind
      from terkini
     where terkini.n < p_max_attempts
    returning 1
  )
  select count(*)::integer into jumlah from dicatat;

  -- jumlah = 1 berarti percobaan tercatat, artinya masih di bawah batas.
  return jumlah = 1;
end;
$$;

comment on function public.check_rate_limit(text, text, integer, integer) is
  'Mencatat satu percobaan dan mengembalikan apakah diizinkan, secara atomik. SECURITY DEFINER: wajib, supaya penghitungnya tidak dapat dibaca atau dipalsukan pengunjung.';

-- Pengunjung boleh MEMANGGIL fungsinya, tetapi tidak menyentuh tabelnya.
revoke all on function public.check_rate_limit(text, text, integer, integer) from public;
grant execute on function public.check_rate_limit(text, text, integer, integer)
  to anon, authenticated;
