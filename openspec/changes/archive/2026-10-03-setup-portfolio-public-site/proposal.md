## Why

Belum ada kode sama sekali di repositori ini — hanya scaffolding OpenSpec. Portofolio pribadi (digital CV) perlu fondasi proyek dan halaman publik yang dapat diakses siapa pun, dengan seluruh konten berasal dari database agar nanti bisa dikelola lewat dashboard admin tanpa deploy ulang.

Change ini membangun fondasi + sisi publik saja. Autentikasi admin, dashboard CRUD, form kontak yang berfungsi, dan fitur rating dikerjakan di change terpisah.

## What Changes

**Fondasi proyek**
- Inisialisasi aplikasi Next.js (App Router) + TypeScript + Tailwind CSS di root repositori.
- Konfigurasi Supabase: schema PostgreSQL via Supabase CLI migrations, Storage bucket untuk gambar/CV, dan Row Level Security.
- Design system: token warna (aksen hijau zamrud), tipografi, radius, dan utilitas bento grid; dark/light mode berbasis `class` dengan default terang.
- `.env.example` + README berisi langkah setup Supabase dan cara menjalankan proyek di lokal.

**Model data (semua konten dari database, tidak ada konten hardcode)**
- Tabel: `profile` (satu baris / singleton), `social_links`, `education`, `skill_categories`, `skills`, `experiences`, `projects`, `achievements`, `messages`, `ratings`.
- Setiap tabel memiliki `created_at`, `updated_at`, `is_published`.
- RLS aktif di semua tabel: publik (role `anon`) hanya boleh `SELECT` baris dengan `is_published = true`; `INSERT`/`UPDATE`/`DELETE` hanya untuk user terautentikasi.
- `messages` dan `ratings` dibuat sekarang beserta policy-nya, tetapi **belum dipakai** oleh UI publik di change ini.
- `supabase/seed.sql` berisi data contoh agar halaman tidak kosong saat pertama dijalankan.

**Halaman publik (multi-route penuh, bahasa Indonesia)**
- `/` — hero: nama, daftar role dengan animasi ketik, tagline, tombol Lihat Proyek / Kontak / Unduh CV, foto profil, ikon sosial media, cuplikan proyek featured.
- `/tentang` — bio "Tentang Saya", lokasi, status open-to-work.
- `/pendidikan` — timeline riwayat pendidikan.
- `/keahlian` — skill dikelompokkan per kategori.
- `/pengalaman` — timeline pengalaman (kerja/magang/organisasi/freelance).
- `/proyek` — grid proyek + filter berdasarkan tech stack.
- `/proyek/[slug]` — detail proyek: deskripsi lengkap, galeri gambar, tech stack, link demo & repo.
- `/pencapaian` — grid sertifikat/penghargaan, klik untuk preview gambar.
- `/kontak` — email, lokasi, status, dan ikon sosial media (**informasi saja, tanpa form** — form menyusul di change berikutnya).
- Navbar responsif dengan menu mobile, footer, toggle dark/light mode, animasi halus saat scroll.
- Setiap halaman punya empty state yang rapi bila datanya belum ada.

**Non-fungsional**
- SEO: metadata + Open Graph per halaman, `sitemap.xml`, `robots.txt`.
- Gambar memakai `next/image`; halaman publik memakai ISR (`revalidate`) agar cepat.
- Aksesibilitas: kontras memadai, alt text, navigasi keyboard, fokus terlihat, `prefers-reduced-motion` dihormati.
- Mobile-first.

**Non-goals (change berikutnya)**
- Login admin & dashboard CRUD.
- Submit form kontak dan tampilan/moderasi rating.
- Upload file dari UI.

## Capabilities

### New Capabilities
- `portfolio-content-model`: Skema database, kolom, relasi, kebijakan RLS, Storage bucket, dan seed data contoh untuk seluruh konten portofolio.
- `developer-setup`: Fondasi aplikasi dan pengalaman setup pengembang — struktur proyek Next.js, variabel lingkungan, migrasi/seed Supabase, dan dokumentasi menjalankan proyek di lokal.
- `public-site/site-shell`: Kerangka halaman publik — design system, navbar responsif, menu mobile, footer, toggle dark/light mode, dan animasi scroll.
- `public-site/home`: Halaman beranda — hero dengan animasi ketik role, tombol aksi, ikon sosial, foto profil, dan cuplikan proyek featured.
- `public-site/profile-pages`: Halaman Tentang, Pendidikan, Keahlian, Pengalaman, Pencapaian, dan Kontak (informasi saja).
- `public-site/projects`: Daftar proyek dengan filter tech stack dan halaman detail `/proyek/[slug]`.
- `public-site/seo`: Metadata per halaman, Open Graph, `sitemap.xml`, `robots.txt`, dan strategi revalidasi ISR.

### Modified Capabilities
_Tidak ada — belum ada spec yang terdaftar di proyek ini._

## Impact

- **Repositori**: seluruh struktur aplikasi dibuat dari nol (`app/`, `components/`, `lib/`, `supabase/`, file konfigurasi di root).
- **Dependensi baru**: `next`, `react`, `typescript`, `tailwindcss`, `@supabase/supabase-js`, `@supabase/ssr`, library animasi, dan library ikon.
- **Layanan eksternal**: proyek Supabase (PostgreSQL + Storage) wajib ada; Supabase CLI dibutuhkan untuk menjalankan migrasi dan seed.
- **Deployment**: Vercel; membutuhkan environment variable `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` serta `NEXT_PUBLIC_SITE_URL`.
- **Kontrak untuk change berikutnya**: skema tabel dan policy RLS yang dibuat di sini menjadi dasar dashboard admin, form kontak, dan fitur rating.
