## Purpose

Menjamin seseorang yang baru mengkloning repositori ini dapat menyiapkan proyek Supabase, mengisi variabel lingkungan, menjalankan migrasi dan seed, lalu menjalankan situs di lokal tanpa menebak-nebak langkah apa pun.

## ADDED Requirements

### Requirement: Aplikasi berjalan di lokal dengan satu perintah

Repositori SHALL berisi aplikasi Next.js (App Router) berbasis TypeScript yang dapat dipasang dan dijalankan dengan perintah paket manager standar (`install`, lalu `dev`). Mode development SHALL berjalan tanpa error kompilasi pada repositori yang baru dikloning setelah variabel lingkungan terisi.

#### Scenario: Server development menyala

- **WHEN** dependensi dipasang, variabel lingkungan terisi, lalu perintah `dev` dijalankan
- **THEN** server development menyala dan beranda dapat dibuka di browser tanpa error kompilasi

#### Scenario: Build produksi berhasil

- **WHEN** perintah build produksi dijalankan dengan variabel lingkungan yang valid
- **THEN** build selesai tanpa error TypeScript maupun error lint

### Requirement: Variabel lingkungan terdokumentasi lewat .env.example

Repositori SHALL menyertakan berkas `.env.example` yang mencantumkan setiap variabel lingkungan yang dibutuhkan beserta keterangan singkat dan nilai contoh yang bukan rahasia. Berkas yang berisi nilai rahasia sebenarnya SHALL diabaikan oleh version control.

#### Scenario: Pengembang menyalin contoh env

- **WHEN** pengembang menyalin `.env.example` menjadi `.env.local` dan mengisi nilai dari proyek Supabase miliknya
- **THEN** aplikasi berjalan tanpa butuh variabel lingkungan tambahan yang tidak tercantum di berkas contoh

#### Scenario: Rahasia tidak ikut ter-commit

- **WHEN** status version control diperiksa setelah `.env.local` dibuat
- **THEN** `.env.local` tidak muncul sebagai berkas yang akan di-commit

### Requirement: Konfigurasi lingkungan yang kurang dilaporkan dengan jelas

Ketika variabel lingkungan Supabase yang wajib tidak ada atau kosong, aplikasi SHALL gagal dengan pesan yang menyebut nama variabel yang kurang dan merujuk ke `.env.example`. Aplikasi SHALL TIDAK menampilkan halaman kosong atau error generik tanpa penjelasan.

#### Scenario: Variabel wajib tidak diisi

- **WHEN** aplikasi dijalankan tanpa URL atau kunci anon Supabase
- **THEN** muncul error yang menyebut nama variabel lingkungan yang kurang dan mengarahkan ke `.env.example`

### Requirement: Skema database dikirim sebagai migrasi berversi

Repositori SHALL menyimpan skema database sebagai berkas migrasi Supabase CLI berurutan di dalam repositori, beserta berkas seed yang terpisah. Menjalankan migrasi pada database kosong SHALL menghasilkan skema lengkap termasuk constraint, trigger, dan kebijakan RLS.

#### Scenario: Migrasi diterapkan pada database kosong

- **WHEN** migrasi dijalankan pada proyek Supabase yang baru
- **THEN** semua tabel, constraint, trigger `updated_at`, kebijakan RLS, dan bucket Storage dibuat

#### Scenario: Seed dijalankan setelah migrasi

- **WHEN** berkas seed dijalankan setelah migrasi berhasil
- **THEN** data contoh masuk tanpa error dan situs menampilkan konten

### Requirement: README menjelaskan setup dari nol sampai jalan

Repositori SHALL menyertakan README berbahasa Indonesia yang memuat ringkasan proyek, daftar prasyarat beserta versi, langkah membuat proyek Supabase, cara mendapatkan URL dan kunci anon, cara menjalankan migrasi dan seed, perintah menjalankan di lokal, struktur folder, dan langkah deploy ke Vercel beserta variabel lingkungan yang harus diatur di sana.

#### Scenario: Pengembang baru mengikuti README

- **WHEN** seseorang yang belum pernah melihat proyek ini mengikuti README dari atas ke bawah
- **THEN** ia mencapai situs yang berjalan di lokal berisi data contoh tanpa perlu bertanya di luar dokumen

#### Scenario: Langkah deploy terdokumentasi

- **WHEN** bagian deploy di README dibaca
- **THEN** di sana tercantum setiap variabel lingkungan yang wajib diatur di Vercel
