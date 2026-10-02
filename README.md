# Portofolio — CV Digital

Website portofolio pribadi berbasis CMS. Seluruh isinya diambil dari database,
tidak ada konten yang ditulis langsung di kode, sehingga nanti bisa dikelola
lewat dashboard admin tanpa perlu mendeploy ulang.

Repositori ini saat ini memuat **fondasi proyek dan halaman publik**. Dashboard
admin dan form kontak dibangun di change berikutnya (lihat `openspec/changes/`).

## Isi

- [Teknologi](#teknologi)
- [Prasyarat](#prasyarat)
- [Setup Supabase](#setup-supabase)
- [Menjalankan di lokal](#menjalankan-di-lokal)
- [Perintah yang tersedia](#perintah-yang-tersedia)
- [Struktur folder](#struktur-folder)
- [Catatan penting](#catatan-penting)
- [Deploy ke Vercel](#deploy-ke-vercel)

## Teknologi

| Bagian | Pilihan |
| --- | --- |
| Framework | Next.js 16 (App Router) + React 19 |
| Bahasa | TypeScript (mode strict) |
| Styling | Tailwind CSS v4 (token di `app/globals.css`) |
| Database & Storage | Supabase (PostgreSQL + Storage) |
| Tema | `next-themes` (terang/gelap berbasis class) |
| Ikon | `lucide-react` (UI) + `react-icons` (lambang platform) |
| Deploy | Vercel |

Bahasa antarmuka: Indonesia.

## Prasyarat

| Kebutuhan | Versi | Keterangan |
| --- | --- | --- |
| Node.js | 20 atau lebih baru | Dikembangkan dengan Node 26 |
| npm | 10 atau lebih baru | Ikut terpasang bersama Node |
| Akun Supabase | — | Gratis, cukup untuk proyek ini |
| Docker Desktop | opsional | Hanya jika ingin menjalankan Supabase lokal (`npx supabase start`) |

Supabase CLI tidak perlu dipasang global — sudah ikut sebagai devDependency dan
dipanggil lewat `npx supabase`.

## Setup Supabase

### 1. Buat proyek

1. Buka [supabase.com/dashboard](https://supabase.com/dashboard) lalu buat
   proyek baru.
2. Catat **password database** yang Anda buat — dibutuhkan saat menghubungkan
   CLI.
3. Tunggu proyeknya selesai disiapkan.

### 2. Ambil URL dan kunci anon

Di dashboard Supabase:

- **Project Settings → Data API → Project URL** → ini nilai
  `NEXT_PUBLIC_SUPABASE_URL`
- **Project Settings → API Keys → `anon` `public`** → ini nilai
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`

> Kunci `anon` memang dirancang untuk terkirim ke peramban; Row Level Security
> yang menjaga datanya. **Jangan** pernah memakai `service_role` key di aplikasi
> ini — tidak ada satu pun bagian kode yang membutuhkannya.

### 3. Isi variabel lingkungan

```bash
cp .env.example .env.local
```

Lalu isi ketiga nilainya di `.env.local`. Kalau salah satu kosong, aplikasi
gagal dengan pesan yang menyebut nama variabel yang kurang.

### 4. Terapkan skema database

**Ke proyek Supabase (remote):**

```bash
npx supabase login
npx supabase link --project-ref <project-ref-anda>
npx supabase db push
```

`<project-ref-anda>` adalah bagian subdomain pada URL proyek, misalnya
`abcdefghijklmnop` dari `https://abcdefghijklmnop.supabase.co`.

**Atau jalankan Supabase lokal (butuh Docker):**

```bash
npx supabase start
npm run db:reset      # menerapkan migrasi + menjalankan seed
```

`npx supabase status` akan menampilkan URL dan kunci anon lokal yang bisa Anda
pakai di `.env.local`.

### 5. Masukkan data contoh

Supaya halaman tidak kosong saat pertama dijalankan:

```bash
# Lokal — sudah otomatis ikut saat db:reset
npm run db:reset

# Remote
psql "<connection string proyek Anda>" -f supabase/seed.sql
```

Seed bersifat idempoten: menjalankannya dua kali tidak menggandakan data.

### 6. Hasilkan tipe TypeScript

```bash
# Supabase lokal
npm run db:types

# Atau dari proyek remote
npx supabase gen types typescript --project-id <project-ref> > lib/database.types.ts
```

> **Penting:** `lib/database.types.ts` saat ini masih berisi tipe yang ditulis
> tangan sebagai penopang sementara, karena pembuatan tipe otomatis butuh
> database yang berjalan. Timpa berkas itu dengan hasil perintah di atas segera
> setelah proyek Supabase Anda siap, lalu jalankan ulang setiap kali ada migrasi
> baru.

### 7. Verifikasi keamanan RLS

Baris konten draf yang bocor ke publik tampak persis seperti situs yang bekerja
normal, jadi jangan lewati langkah ini:

```bash
psql "<connection string>" -v ON_ERROR_STOP=1 -f supabase/tests/rls_checks.sql
```

Skrip itu berjalan di dalam transaksi yang di-rollback, jadi tidak meninggalkan
perubahan apa pun.

## Menjalankan di lokal

```bash
npm install
npm run dev
```

Buka <http://localhost:3000>.

## Perintah yang tersedia

| Perintah | Fungsi |
| --- | --- |
| `npm run dev` | Server pengembangan |
| `npm run build` | Build produksi |
| `npm start` | Menjalankan hasil build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run check:contrast` | Memeriksa rasio kontras token terhadap WCAG AA |
| `npm run check:revalidate` | Memastikan semua route publik memakai periode revalidasi yang sama |
| `npm run db:reset` | Supabase lokal: migrasi + seed dari nol |
| `npm run db:push` | Menerapkan migrasi ke proyek remote yang ter-link |
| `npm run db:types` | Menghasilkan ulang `lib/database.types.ts` |

## Struktur folder

```
app/                      Route App Router
  layout.tsx              Shell: bahasa, font, tema, navbar, footer, skip link
  page.tsx                Beranda — hero, animasi ketik role, proyek pilihan
  tentang/ pendidikan/    Halaman profil
  keahlian/ pengalaman/
  pencapaian/ kontak/
  proyek/                 Daftar proyek + filter tech stack
  proyek/[slug]/          Detail proyek
  sitemap.ts robots.ts    SEO
  not-found.tsx           Halaman 404
  globals.css             SATU sumber kebenaran token warna/tipografi/radius

components/
  layout/                 Navbar, footer, toggle tema, ikon sosial
  home/                   Animasi ketik role
  projects/               Kartu proyek, filter tech stack
  achievements/           Grid pencapaian + pratinjau gambar
  ui/                     Primitif: kartu, badge, tombol, timeline, empty state

lib/
  env.ts                  Validasi variabel lingkungan (satu tempat)
  supabase/server.ts      Klien Supabase anon khusus server
  queries.ts              Semua pembacaan publik — SELALU memfilter is_published
  format.ts               Tanggal id-ID, label enum bahasa Indonesia
  constants.ts            REVALIDATE, nama bucket, item navigasi
  database.types.ts       Tipe skema (hasil generate)
  types.ts                Alias ringkas

supabase/
  migrations/             Skema berversi
  seed.sql                Data contoh (idempoten)
  tests/rls_checks.sql    Pemeriksaan RLS dan constraint

scripts/                  Pemeriksa kontras dan konsistensi revalidasi
```

## Catatan penting

**Bucket Storage `media` bersifat publik.** URL di dalamnya dapat diambil siapa
pun yang menebak namanya. Jadi hanya aset yang memang ditujukan untuk publik
yang boleh masuk — foto profil, thumbnail dan galeri proyek, gambar pencapaian,
dan berkas CV. Jangan pernah menaruh lampiran privat di bucket ini.

**Jangan jalankan seed di produksi** setelah konten asli Anda dimasukkan.
`supabase/seed.sql` melakukan upsert pada id yang tetap, sehingga akan menimpa
baris dengan id yang sama.

**RLS mengizinkan setiap pengguna terautentikasi menulis ke semua tabel.** Itu
sesuai untuk portofolio satu pemilik, dan karena itu **signup harus
dinonaktifkan** di Project Settings → Authentication pada proyek Supabase Anda.
Kalau kelak Anda butuh pengguna Supabase untuk tujuan lain, persempit dulu
policy `authenticated` di `supabase/migrations/20261002120600_rls.sql`.

**Jangan tulis nilai warna lepas di komponen.** Semua warna lewat token di
`app/globals.css`. Itu yang menegakkan aturan satu warna aksen dan membuat
`npm run check:contrast` berlaku untuk seluruh situs sekaligus.

## Deploy ke Vercel

1. Push repositori ini ke GitHub, GitLab, atau Bitbucket.
2. Di [vercel.com](https://vercel.com), **Add New → Project**, lalu impor
   repositori tersebut. Vercel mengenali Next.js secara otomatis — framework
   preset dan perintah build tidak perlu diubah.
3. Atur variabel lingkungan berikut untuk environment **Production**,
   **Preview**, dan **Development**:

   | Variabel | Nilai |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | URL proyek Supabase Anda |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Kunci `anon` proyek Supabase Anda |
   | `NEXT_PUBLIC_SITE_URL` | URL produksi tanpa garis miring di akhir |

   Ketiganya wajib. Build akan gagal dengan pesan yang menyebut nama variabel
   yang kurang kalau salah satu belum diatur — itu memang disengaja.

4. Pastikan migrasi sudah diterapkan ke proyek Supabase produksi
   (`npx supabase db push`), dan signup sudah dinonaktifkan.
5. Deploy. Setelah selesai, periksa:
   - halaman publik menampilkan konten dari database,
   - `/sitemap.xml` memuat domain produksi Anda, bukan `localhost`,
   - `/robots.txt` dapat diambil dan menunjuk sitemap yang benar.

> `NEXT_PUBLIC_SITE_URL` dipakai untuk URL kanonik, tag Open Graph, dan
> sitemap. Kalau nanti Anda memasang custom domain, perbarui variabel ini ke
> domain baru lalu deploy ulang — kalau tidak, ketiganya akan tetap menunjuk
> alamat lama.
