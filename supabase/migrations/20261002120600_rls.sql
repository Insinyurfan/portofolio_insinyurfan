-- Row Level Security.
--
-- Pola: ditolak sebagai default, izin diberikan per role.
-- RLS tanpa policy permisif berarti MENOLAK, jadi setiap policy di bawah ini
-- adalah tindakan yang disengaja dan terlihat.
--
--   * anon          : hanya SELECT pada tabel konten, hanya baris terbit.
--   * authenticated : FOR ALL pada semua tabel (satu pemilik = satu admin).
--   * messages/ratings : TIDAK ada policy anon sama sekali → tertutup penuh.
--
-- Catatan keamanan yang disengaja: policy authenticated seluas ini berarti
-- setiap pengguna yang login adalah admin. Itu sesuai untuk portofolio satu
-- pemilik, DAN itulah sebabnya signup harus dinonaktifkan di pengaturan Auth
-- proyek Supabase. Kalau kelak dibutuhkan pengguna Supabase untuk tujuan
-- lain, policy ini harus dipersempit lebih dulu menjadi pemeriksaan klaim.

alter table public.profile enable row level security;
alter table public.social_links enable row level security;
alter table public.education enable row level security;
alter table public.skill_categories enable row level security;
alter table public.skills enable row level security;
alter table public.experiences enable row level security;
alter table public.projects enable row level security;
alter table public.achievements enable row level security;
alter table public.messages enable row level security;
alter table public.ratings enable row level security;

-- ---------------------------------------------------------------------------
-- Publik: hanya boleh membaca konten yang terbit.
-- ---------------------------------------------------------------------------

create policy "anon membaca profil terbit"
  on public.profile for select to anon
  using (is_published);

create policy "anon membaca tautan sosial terbit"
  on public.social_links for select to anon
  using (is_published);

create policy "anon membaca pendidikan terbit"
  on public.education for select to anon
  using (is_published);

create policy "anon membaca kategori keahlian terbit"
  on public.skill_categories for select to anon
  using (is_published);

create policy "anon membaca keahlian terbit"
  on public.skills for select to anon
  using (is_published);

create policy "anon membaca pengalaman terbit"
  on public.experiences for select to anon
  using (is_published);

create policy "anon membaca proyek terbit"
  on public.projects for select to anon
  using (is_published);

create policy "anon membaca pencapaian terbit"
  on public.achievements for select to anon
  using (is_published);

-- Tidak ada policy anon untuk public.messages dan public.ratings.
-- RLS aktif tanpa policy permisif = tertutup penuh bagi anon.

-- ---------------------------------------------------------------------------
-- Pengguna terautentikasi (admin): membaca dan mengubah semua baris.
-- ---------------------------------------------------------------------------

create policy "admin mengelola profil"
  on public.profile for all to authenticated
  using (true) with check (true);

create policy "admin mengelola tautan sosial"
  on public.social_links for all to authenticated
  using (true) with check (true);

create policy "admin mengelola pendidikan"
  on public.education for all to authenticated
  using (true) with check (true);

create policy "admin mengelola kategori keahlian"
  on public.skill_categories for all to authenticated
  using (true) with check (true);

create policy "admin mengelola keahlian"
  on public.skills for all to authenticated
  using (true) with check (true);

create policy "admin mengelola pengalaman"
  on public.experiences for all to authenticated
  using (true) with check (true);

create policy "admin mengelola proyek"
  on public.projects for all to authenticated
  using (true) with check (true);

create policy "admin mengelola pencapaian"
  on public.achievements for all to authenticated
  using (true) with check (true);

create policy "admin mengelola pesan"
  on public.messages for all to authenticated
  using (true) with check (true);

create policy "admin mengelola rating"
  on public.ratings for all to authenticated
  using (true) with check (true);
