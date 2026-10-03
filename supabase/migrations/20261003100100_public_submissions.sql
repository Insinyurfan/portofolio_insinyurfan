-- Membuka jalur tulis publik untuk pesan dan rating.
--
-- INI PERUBAHAN PALING SENSITIF DI SELURUH PROYEK. Sebelum migrasi ini, tidak
-- ada cara bagi orang di luar pemilik untuk menulis apa pun ke database.
--
-- Yang DIBUKA:
--   * anon boleh INSERT ke messages dan ratings
--   * anon boleh SELECT rating yang SUDAH disetujui
--
-- Yang TETAP TERTUTUP:
--   * messages tidak dapat dibaca anon sama sekali
--   * rating yang belum disetujui tidak dapat dibaca anon
--   * anon tidak dapat UPDATE maupun DELETE di kedua tabel
--   * anon tidak dapat menentukan is_read maupun is_approved saat menyisipkan
--
-- Larangan terakhir itu ditegakkan DUA KALI: lewat WITH CHECK pada policy, dan
-- lewat pembatasan hak kolom. Mengandalkan "aplikasi tidak mengirim kolom itu"
-- bukan penegakan — kunci anon memang terbit di peramban, jadi siapa pun bisa
-- memanggil Supabase langsung.

-- ---------------------------------------------------------------------------
-- messages: boleh dikirim, tidak boleh dibaca
-- ---------------------------------------------------------------------------

create policy "anon mengirim pesan"
  on public.messages for insert to anon
  with check (
    -- Pengunjung tidak boleh menandai pesannya sendiri sudah dibaca.
    is_read = false
    -- is_published tidak dipakai untuk pesan; dijaga tetap pada nilai bawaan.
    and is_published = true
  );

-- Hak kolom: anon hanya boleh mengisi kolom yang memang diisi pengunjung.
-- Tanpa ini, WITH CHECK masih bisa dilewati untuk kolom yang tidak diperiksa.
revoke insert on public.messages from anon;
grant insert (sender_name, sender_email, subject, body) on public.messages to anon;

-- ---------------------------------------------------------------------------
-- ratings: boleh dikirim, hanya yang disetujui boleh dibaca
-- ---------------------------------------------------------------------------

create policy "anon mengirim rating"
  on public.ratings for insert to anon
  with check (
    -- Pengunjung tidak boleh menyetujui ratingnya sendiri.
    is_approved = false
    and is_published = true
  );

create policy "anon membaca rating disetujui"
  on public.ratings for select to anon
  using (is_approved and is_published);

revoke insert on public.ratings from anon;
grant insert (reviewer_name, stars, comment) on public.ratings to anon;

-- Tidak ada policy UPDATE maupun DELETE untuk anon pada kedua tabel.
-- RLS aktif tanpa policy permisif = ditolak.
revoke update, delete on public.messages from anon;
revoke update, delete on public.ratings from anon;

-- ---------------------------------------------------------------------------
-- Agregat rating untuk beranda
-- ---------------------------------------------------------------------------

-- Hanya mengembalikan angka agregat, tidak pernah baris individu. Rata-rata
-- dan jumlahnya datang dari satu sumber, sehingga tidak bisa tidak sinkron
-- dengan daftar yang ditampilkan.
create or replace view public.rating_summary
with (security_invoker = true)
as
  select
    count(*)::integer as total,
    coalesce(avg(stars), 0)::numeric(3, 2) as average
  from public.ratings
  where is_approved and is_published;

comment on view public.rating_summary is
  'Rata-rata dan jumlah rating yang sudah disetujui. security_invoker: RLS pemanggil tetap berlaku.';

grant select on public.rating_summary to anon, authenticated;
