-- Data contoh untuk pengembangan lokal.
--
-- JANGAN jalankan berkas ini pada database produksi setelah konten asli
-- dimasukkan — ia melakukan upsert pada id yang tetap, sehingga akan menimpa
-- baris dengan id yang sama.
--
-- Idempoten: setiap baris memakai UUID literal tetap dengan
-- ON CONFLICT (id) DO UPDATE, jadi menjalankannya dua kali adalah
-- sinkronisasi, bukan penambahan.
--
-- Isi di bawah ini placeholder. Ganti dengan riwayat Anda sendiri, atau
-- kelola lewat dashboard admin setelah change berikutnya selesai.

-- ---------------------------------------------------------------------------
-- Profil (satu baris)
-- ---------------------------------------------------------------------------

insert into public.profile (
  id, full_name, username, roles, tagline, photo_url, bio,
  location, email, is_open_to_work, cv_url, is_published
) values (
  'a0000000-0000-4000-8000-000000000001',
  'Nama Lengkap Anda',
  'namaanda',
  array[
    'Pengembang Web',
    'Mahasiswa Informatika',
    'Penggemar Open Source'
  ],
  'Membangun antarmuka yang rapi, cepat, dan bisa dipakai siapa saja.',
  null,
  E'Saya seorang pengembang web yang berfokus pada pengalaman pengguna dan kerapian kode. Sehari-hari saya bekerja dengan TypeScript, React, dan Next.js, serta senang merapikan hal-hal kecil yang sering terlewat seperti aksesibilitas dan kecepatan muat halaman.\n\nSaat ini saya sedang memperdalam arsitektur aplikasi web dan praktik pengujian. Di luar menulis kode, saya suka menulis catatan teknis dan membantu teman belajar pemrograman.\n\nKalau ada yang ingin didiskusikan — pekerjaan, kolaborasi, atau sekadar bertukar pikiran — silakan hubungi saya.',
  'Indonesia',
  'email.anda@contoh.com',
  true,
  null,
  true
)
on conflict (id) do update set
  full_name = excluded.full_name,
  username = excluded.username,
  roles = excluded.roles,
  tagline = excluded.tagline,
  photo_url = excluded.photo_url,
  bio = excluded.bio,
  location = excluded.location,
  email = excluded.email,
  is_open_to_work = excluded.is_open_to_work,
  cv_url = excluded.cv_url,
  is_published = excluded.is_published;

-- ---------------------------------------------------------------------------
-- Tautan sosial
-- ---------------------------------------------------------------------------

insert into public.social_links (id, platform, url, sort_order, is_published) values
  ('b0000000-0000-4000-8000-000000000001', 'github',   'https://github.com/namaanda',      1, true),
  ('b0000000-0000-4000-8000-000000000002', 'linkedin', 'https://linkedin.com/in/namaanda', 2, true),
  ('b0000000-0000-4000-8000-000000000003', 'instagram','https://instagram.com/namaanda',   3, true),
  ('b0000000-0000-4000-8000-000000000004', 'email',    'mailto:email.anda@contoh.com',     4, true),
  -- Satu baris draf, supaya "yang belum terbit tidak tampil" bisa diperiksa langsung.
  ('b0000000-0000-4000-8000-000000000005', 'dribbble', 'https://dribbble.com/namaanda',    5, false)
on conflict (id) do update set
  platform = excluded.platform,
  url = excluded.url,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- ---------------------------------------------------------------------------
-- Pendidikan
-- ---------------------------------------------------------------------------

insert into public.education (
  id, institution, major, degree, start_year, end_year, gpa, description, sort_order, is_published
) values
  (
    'c0000000-0000-4000-8000-000000000001',
    'Universitas Contoh', 'Teknik Informatika', 'S1',
    2022, null, 3.72,
    'Fokus pada rekayasa perangkat lunak dan basis data. Aktif sebagai asisten praktikum pemrograman web.',
    1, true
  ),
  (
    'c0000000-0000-4000-8000-000000000002',
    'SMA Negeri Contoh', 'IPA', 'SMA',
    2019, 2022, null,
    'Anggota tim olimpiade komputer tingkat kabupaten.',
    2, true
  )
on conflict (id) do update set
  institution = excluded.institution,
  major = excluded.major,
  degree = excluded.degree,
  start_year = excluded.start_year,
  end_year = excluded.end_year,
  gpa = excluded.gpa,
  description = excluded.description,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- ---------------------------------------------------------------------------
-- Kategori keahlian dan keahlian
-- ---------------------------------------------------------------------------

insert into public.skill_categories (id, name, icon, sort_order, is_published) values
  ('d0000000-0000-4000-8000-000000000001', 'Bahasa Pemrograman', 'code',     1, true),
  ('d0000000-0000-4000-8000-000000000002', 'Framework & Library', 'layers',  2, true),
  ('d0000000-0000-4000-8000-000000000003', 'Basis Data & Tooling', 'database', 3, true),
  -- Kategori tanpa keahlian terbit: harus TIDAK dirender di halaman publik.
  ('d0000000-0000-4000-8000-000000000004', 'Kategori Kosong', null,          4, true)
on conflict (id) do update set
  name = excluded.name,
  icon = excluded.icon,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

insert into public.skills (id, category_id, name, icon, sort_order, is_published) values
  ('e0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001', 'TypeScript', 'code', 1, true),
  ('e0000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000001', 'JavaScript', null,   2, true),
  ('e0000000-0000-4000-8000-000000000003', 'd0000000-0000-4000-8000-000000000001', 'Python',     null,   3, true),
  ('e0000000-0000-4000-8000-000000000004', 'd0000000-0000-4000-8000-000000000002', 'React',      'atom', 1, true),
  ('e0000000-0000-4000-8000-000000000005', 'd0000000-0000-4000-8000-000000000002', 'Next.js',    null,   2, true),
  ('e0000000-0000-4000-8000-000000000006', 'd0000000-0000-4000-8000-000000000002', 'Tailwind CSS', null, 3, true),
  ('e0000000-0000-4000-8000-000000000007', 'd0000000-0000-4000-8000-000000000003', 'PostgreSQL', 'database', 1, true),
  ('e0000000-0000-4000-8000-000000000008', 'd0000000-0000-4000-8000-000000000003', 'Supabase',   null,   2, true),
  ('e0000000-0000-4000-8000-000000000009', 'd0000000-0000-4000-8000-000000000003', 'Git',        null,   3, true),
  -- Keahlian draf di kategori yang terbit.
  ('e0000000-0000-4000-8000-00000000000a', 'd0000000-0000-4000-8000-000000000001', 'Rust (draf)', null,  4, false),
  -- Satu-satunya keahlian di "Kategori Kosong", dan statusnya draf.
  ('e0000000-0000-4000-8000-00000000000b', 'd0000000-0000-4000-8000-000000000004', 'Belum Terbit', null, 1, false)
on conflict (id) do update set
  category_id = excluded.category_id,
  name = excluded.name,
  icon = excluded.icon,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- ---------------------------------------------------------------------------
-- Pengalaman (keempat tipe terwakili)
-- ---------------------------------------------------------------------------

insert into public.experiences (
  id, position, organization, type, start_date, end_date, is_ongoing, description, sort_order, is_published
) values
  (
    'f0000000-0000-4000-8000-000000000001',
    'Frontend Developer', 'PT Contoh Teknologi', 'work',
    '2025-02-01', null, true,
    'Mengembangkan antarmuka aplikasi internal dengan Next.js dan TypeScript. Menurunkan waktu muat halaman utama sekitar 40 persen.',
    1, true
  ),
  (
    'f0000000-0000-4000-8000-000000000002',
    'Web Developer Intern', 'Startup Contoh', 'internship',
    '2024-06-01', '2024-09-30', false,
    'Membangun halaman arahan dan memperbaiki aksesibilitas komponen yang sudah ada.',
    2, true
  ),
  (
    'f0000000-0000-4000-8000-000000000003',
    'Koordinator Divisi Teknologi', 'Himpunan Mahasiswa Informatika', 'organization',
    '2023-09-01', '2024-08-31', false,
    'Memimpin tim berisi enam orang untuk mengelola situs dan sistem pendaftaran acara himpunan.',
    3, true
  ),
  (
    'f0000000-0000-4000-8000-000000000004',
    'Pengembang Web Lepas', 'Berbagai Klien', 'freelance',
    '2023-01-01', null, true,
    'Membangun situs profil dan katalog untuk usaha kecil, dari desain sampai deploy.',
    4, true
  )
on conflict (id) do update set
  position = excluded.position,
  organization = excluded.organization,
  type = excluded.type,
  start_date = excluded.start_date,
  end_date = excluded.end_date,
  is_ongoing = excluded.is_ongoing,
  description = excluded.description,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- ---------------------------------------------------------------------------
-- Proyek (empat terbit, dua di antaranya featured, satu draf)
-- ---------------------------------------------------------------------------

insert into public.projects (
  id, title, slug, summary, description, tech_stack, gallery,
  thumbnail_url, demo_url, repo_url, featured, sort_order, is_published
) values
  (
    '10000000-0000-4000-8000-000000000001',
    'Sistem Informasi Perpustakaan', 'sistem-informasi-perpustakaan',
    'Aplikasi web untuk mengelola peminjaman buku, anggota, dan denda keterlambatan.',
    E'Aplikasi ini dibangun untuk menggantikan pencatatan peminjaman buku yang sebelumnya memakai buku tulis. Ada tiga peran pengguna: petugas, anggota, dan kepala perpustakaan.\n\nFitur utamanya mencakup pencarian katalog, peminjaman dan pengembalian dengan perhitungan denda otomatis, serta laporan bulanan yang bisa diekspor.\n\nBagian yang paling menarik dikerjakan adalah perhitungan denda, karena aturannya berbeda untuk hari libur dan harus bisa disesuaikan tanpa mengubah kode.',
    array['Next.js', 'TypeScript', 'PostgreSQL', 'Tailwind CSS'],
    array[]::text[],
    null, 'https://contoh.com/demo-perpustakaan', 'https://github.com/namaanda/perpustakaan',
    true, 1, true
  ),
  (
    '10000000-0000-4000-8000-000000000002',
    'Dasbor Analitik Penjualan', 'dasbor-analitik-penjualan',
    'Dasbor visualisasi data penjualan harian dengan filter rentang tanggal dan ekspor laporan.',
    E'Dasbor ini menampilkan ringkasan penjualan dari beberapa cabang dalam satu tampilan, dengan grafik tren dan tabel rincian yang bisa difilter.\n\nTantangan terbesarnya adalah performa: data mentahnya ratusan ribu baris, sehingga agregasi dipindahkan ke basis data dan hasilnya di-cache per rentang tanggal.',
    array['React', 'TypeScript', 'Supabase', 'PostgreSQL'],
    array[]::text[],
    null, null, 'https://github.com/namaanda/dasbor-penjualan',
    true, 2, true
  ),
  (
    '10000000-0000-4000-8000-000000000003',
    'Aplikasi Catatan Harian', 'aplikasi-catatan-harian',
    'Aplikasi catatan sederhana yang bekerja offline dan menyinkronkan data saat kembali online.',
    E'Dibuat untuk belajar cara kerja penyimpanan di peramban dan strategi sinkronisasi. Catatan disimpan lokal lebih dulu, lalu dikirim ke server ketika koneksi tersedia.\n\nKonflik sinkronisasi diselesaikan dengan aturan sederhana: perubahan terbaru menang, dengan riwayat versi disimpan supaya tidak ada yang benar-benar hilang.',
    array['React', 'TypeScript', 'Tailwind CSS'],
    array[]::text[],
    null, 'https://contoh.com/demo-catatan', null,
    false, 3, true
  ),
  (
    '10000000-0000-4000-8000-000000000004',
    'Situs Profil UMKM', 'situs-profil-umkm',
    'Situs profil dan katalog produk untuk usaha kecil, dengan admin sederhana untuk mengganti isi.',
    E'Klien membutuhkan situs yang bisa diperbarui sendiri tanpa memanggil pengembang setiap kali ada produk baru. Jadi seluruh isinya diambil dari basis data dan ada halaman admin kecil untuk mengelolanya.\n\nYang paling berpengaruh ternyata bukan fiturnya, melainkan kecepatan muat di jaringan seluler — gambar produk dioptimasi dan halaman dibuat statis dengan revalidasi berkala.',
    array['Next.js', 'Supabase', 'Tailwind CSS'],
    array[]::text[],
    null, null, null,
    false, 4, true
  ),
  -- Proyek draf: harus 404 di halaman detail dan tidak muncul di sitemap.
  (
    '10000000-0000-4000-8000-000000000005',
    'Proyek Yang Belum Selesai', 'proyek-belum-selesai',
    'Masih dikerjakan, belum siap ditampilkan.',
    'Deskripsi lengkap menyusul.',
    array['Rust'],
    array[]::text[],
    null, null, null,
    false, 5, false
  )
on conflict (id) do update set
  title = excluded.title,
  slug = excluded.slug,
  summary = excluded.summary,
  description = excluded.description,
  tech_stack = excluded.tech_stack,
  gallery = excluded.gallery,
  thumbnail_url = excluded.thumbnail_url,
  demo_url = excluded.demo_url,
  repo_url = excluded.repo_url,
  featured = excluded.featured,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- ---------------------------------------------------------------------------
-- Pencapaian (kedua kategori terwakili)
-- ---------------------------------------------------------------------------

insert into public.achievements (
  id, title, issuer, issued_date, category, image_url, verification_url, sort_order, is_published
) values
  (
    '20000000-0000-4000-8000-000000000001',
    'Sertifikat Pengembangan Web Frontend', 'Lembaga Sertifikasi Contoh',
    '2025-03-15', 'certificate', null, 'https://contoh.com/verifikasi/abc123', 1, true
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    'Sertifikat Dasar Basis Data', 'Platform Belajar Contoh',
    '2024-11-20', 'certificate', null, null, 2, true
  ),
  (
    '20000000-0000-4000-8000-000000000003',
    'Juara 2 Lomba Pengembangan Aplikasi', 'Universitas Contoh',
    '2024-05-10', 'award', null, 'https://contoh.com/verifikasi/xyz789', 3, true
  ),
  (
    '20000000-0000-4000-8000-000000000004',
    'Finalis Hackathon Nasional', 'Komunitas Teknologi Contoh',
    '2023-10-01', 'award', null, null, 4, true
  )
on conflict (id) do update set
  title = excluded.title,
  issuer = excluded.issuer,
  issued_date = excluded.issued_date,
  category = excluded.category,
  image_url = excluded.image_url,
  verification_url = excluded.verification_url,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;
