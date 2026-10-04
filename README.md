# Portofolio — CV Digital

Website portofolio pribadi berbasis CMS. Seluruh isinya diambil dari database,
tidak ada konten yang ditulis langsung di kode, sehingga nanti bisa dikelola
lewat dashboard admin tanpa perlu mendeploy ulang.

Repositori ini memuat **halaman publik** dan **dashboard admin**. Form kontak
publik dan fitur rating dibangun di change berikutnya (lihat `openspec/changes/`).

## Isi

- [Teknologi](#teknologi)
- [Prasyarat](#prasyarat)
- [Setup Supabase](#setup-supabase)
- [Menjalankan di lokal](#menjalankan-di-lokal)
- [Perintah yang tersedia](#perintah-yang-tersedia)
- [Struktur folder](#struktur-folder)
- [Variabel lingkungan](#variabel-lingkungan)
- [Catatan penting](#catatan-penting)
- [Dashboard admin](#dashboard-admin)
- [Form publik](#form-publik)
- [Deploy ke Vercel](#deploy-ke-vercel)
- [Custom domain](#custom-domain)

## Teknologi

| Bagian | Pilihan |
| --- | --- |
| Framework | Next.js 16 (App Router) + React 19 |
| Bahasa | TypeScript (mode strict) |
| Styling | Tailwind CSS v4 (token di `app/globals.css`) |
| Database & Storage | Supabase (PostgreSQL + Storage) |
| Tema | `next-themes` (terang/gelap berbasis class) |
| Auth admin | Supabase Auth, sesi cookie lewat `@supabase/ssr` |
| Form & validasi | `react-hook-form` + `zod` (skema sama di klien dan server) |
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
npx supabase gen types typescript --project-id <project-ref> > src/shared/database.types.ts
```

> **Penting:** `src/shared/database.types.ts` saat ini masih berisi tipe yang ditulis
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
| `npm run check:env` | Memastikan keenam variabel wajib terisi dan bentuknya sah |
| `npm run check:contrast` | Memeriksa rasio kontras token terhadap WCAG AA |
| `npm run admin:password` | Menyetel password admin dari `ADMIN_TEMP_PASSWORD` di `.env.local` |
| `npm run check:revalidate` | Memastikan semua route publik memakai periode revalidasi yang sama |
| `npm run db:reset` | Supabase lokal: migrasi + seed dari nol |
| `npm run db:push` | Menerapkan migrasi ke proyek remote yang ter-link |
| `npm run db:check` | Pemeriksaan RLS dan constraint |
| `npm run db:check:public` | Pemeriksaan jalur tulis publik (paling penting) |
| `npm run predeploy` | Seluruh pemeriksaan sebelum deploy, berhenti di kegagalan pertama |
| `npm run e2e:produksi` | Verifikasi situs yang sudah dideploy |
| `npm run db:types` | Menghasilkan ulang `src/shared/database.types.ts` |

## Struktur folder

Frontend dan backend dipisahkan tegas di bawah `src/`. Pemisahannya bukan
sekadar nama folder: ESLint menolak impor yang melanggarnya, dan modul backend
menandai dirinya `server-only` sehingga pelanggaran juga menggagalkan build.

```
src/
  server/                 ← BACKEND. Seluruh isinya "server-only".
    db/
      client.ts           Klien anon khusus server (halaman publik)
      session.ts          Klien sadar sesi (dashboard admin)
      queries.ts          Pembacaan publik — SELALU memfilter is_published
      queries-admin.ts    Pembacaan admin — termasuk baris draf
    auth.ts               requireAdmin() — otorisasi setiap aksi tulis
    actions/
      admin.ts            withAdminAction: auth → validasi → handler → revalidasi
      public.ts           withPublicAction: honeypot → batas laju → validasi
      konten.ts           Seluruh aksi tulis dashboard
      auth.ts             Masuk dan keluar (Server Action)
      publik-form.ts      Kirim pesan dan rating dari pengunjung
      revalidate.ts       Peta entitas → halaman publik terdampak
      storage.ts          Unggah, hapus, konversi URL ↔ path Storage
      sender.ts           Hash pengenal pengirim (bukan alamat IP mentah)

  client/                 ← FRONTEND. Dilarang menyentuh database.
    components/
      layout/             Navbar, footer, toggle tema, ikon sosial
      home/               Animasi ketik role
      projects/           Kartu proyek, grid, filter tech stack (tautan, tanpa JS)
      achievements/       Grid pencapaian + pratinjau gambar
      ui/                 Primitif publik: kartu, badge, tombol, timeline
      admin/              Primitif admin, sidebar, toast, dialog konfirmasi
        managers/         Satu manager per jenis konten
      public/             Form kontak, form rating, pratinjau CV, honeypot
    hooks/                use-mounted, use-reduced-motion, use-rating-submitted

  shared/                 ← DIPAKAI KEDUANYA. Tidak boleh bergantung pada
                            server/ maupun client/.
    env.ts                Validasi variabel lingkungan (satu tempat)
    schemas.ts            Skema zod, dipakai klien DAN server
    types.ts              Alias ringkas
    constants.ts          REVALIDATE, nama bucket, item navigasi
    format.ts             Tanggal id-ID, label enum, slug tech stack
    cn.ts                 Penggabung className
    honeypot.ts           Nama field honeypot
    social-icons.ts       Peta platform → ikon
    database.types.ts     Tipe skema (hasil generate)

  app/                    ← ROUTING saja; logikanya ada di server/ dan client/
    layout.tsx            Root: bahasa, font, provider tema — TANPA navbar
    (public)/             Route group situs publik (tidak masuk ke URL)
      layout.tsx          Navbar, footer, tautan lompat ke konten
      page.tsx            Beranda — hero, animasi ketik role, proyek pilihan
      tentang/ pendidikan/
      keahlian/ pengalaman/
      pencapaian/ kontak/
      proyek/             Daftar proyek + filter tech stack
      proyek/tech/[tech]/ Daftar tersaring — satu halaman statis per tech
      proyek/[slug]/      Detail proyek
    admin/
      (dashboard)/        Halaman dashboard + layout sidebar
      login/              Halaman masuk, layout sendiri tanpa sidebar
    sitemap.ts robots.ts  SEO
    not-found.tsx         Halaman 404
    globals.css           Token publik + token admin (dilingkup .admin-root)

  proxy.ts                Proteksi route /admin + alamat masuk rahasia
                          (dulu bernama middleware.ts)

supabase/
  migrations/             Skema berversi
  seed.sql                Data contoh (idempoten)
  tests/rls_checks.sql    Pemeriksaan RLS dan constraint
  tests/admin_checks.sql  Pemeriksaan fungsi pengurutan dan kolom pesan
  tests/public_write_checks.sql  Pemeriksaan jalur tulis publik

scripts/                  Pemeriksa env, kontras, dan konsistensi revalidasi
```

### Batas frontend–backend

Ditegakkan di `eslint.config.mjs`, dan sengaja TIDAK hanya mengandalkan
konvensi penamaan:

| Dari | Dilarang mengimpor | Alasan |
| --- | --- | --- |
| `src/client/` | `@/server/db/*`, `@/server/auth` | Komponen peramban tidak boleh menyentuh database atau sesi. Ambil datanya di Server Component lalu teruskan sebagai prop, atau panggil Server Action. |
| `src/client/` | `@supabase/*`, `pg`, `node:*` | Menyeret klien Supabase dan modul Node ke bundel peramban. |
| `src/shared/` | `@/server/*`, `@/client/*` | Dipakai kedua sisi, jadi tidak boleh bergantung pada salah satunya. |

Yang tetap boleh: `src/client/` memanggil Server Action di
`@/server/actions/`. Itu memang jembatan resminya — pemanggilannya lewat
jaringan, dan kodenya tidak ikut ke peramban.

## Variabel lingkungan

Daftar lengkap. Semua dibaca lewat `src/shared/env.ts` — tidak ada variabel lain yang
dibaca kode di luar daftar ini.

| Variabel | Wajib | Aman untuk peramban | Dari mana |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | ya | ya | Supabase → Project Settings → Data API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ya | ya | Supabase → Project Settings → API Keys → `anon` `public` |
| `NEXT_PUBLIC_SITE_URL` | ya | ya | URL situs Anda, tanpa garis miring di akhir |
| `ADMIN_EMAIL` | ya | **tidak** | Email akun admin yang Anda buat di Supabase Authentication |
| `RATE_LIMIT_SALT` | ya | **tidak** | Hasilkan sendiri: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `ADMIN_LOGIN_PATH` | ya | **tidak** | Pilih sendiri, huruf/angka/tanda hubung saja — misalnya `masuk-7f3a9c21` |

**Awalan `NEXT_PUBLIC_` menentukan segalanya.** Variabel dengan awalan itu
ikut masuk ke bundel JavaScript yang dikirim ke setiap pengunjung. Tiga
variabel terbawah **tidak boleh** diberi awalan itu: `ADMIN_EMAIL` akan
membocorkan allowlist admin, `RATE_LIMIT_SALT` akan membuat hash pengenal
pengirim dapat dibalik, dan `ADMIN_LOGIN_PATH` akan mengumumkan alamat yang
justru dimaksudkan untuk tidak diketahui.

Keenamnya wajib, tetapi **tidak semuanya menggagalkan build**. Lima yang
pertama dibaca saat halaman dirender, sehingga build di Vercel gagal dengan
pesan yang menyebut nama variabelnya kalau salah satu belum diatur.

`ADMIN_LOGIN_PATH` berbeda, dan ini perlu dipahami sebelum deploy: variabel itu
hanya dibaca proxy pada permintaan ke `/admin`. Kalau belum diatur di Vercel,
build **berhasil** dan situsnya berjalan normal — tetapi tidak ada alamat mana
pun yang melayani halaman masuk, karena `/admin` dialihkan ke beranda dan
`/admin/login` juga. Anda terkunci dari dashboard sendiri tanpa pesan error di
halaman mana pun.

Dua jaring pengaman untuk itu: `npm run predeploy` memeriksa keenam variabel
lebih dulu dan berhenti kalau ada yang kurang, dan proxy mencatat satu pesan
error yang jelas di log server Vercel bila nilainya hilang atau tidak sah.

Tiga variabel lain mungkin ada di `.env.local` Anda — `SUPABASE_DB_URL`,
`SUPABASE_ACCESS_TOKEN`, dan `ADMIN_TEMP_PASSWORD`. Ketiganya **hanya untuk
perkakas di komputer Anda** (migrasi, pemeriksaan SQL, pengujian) dan tidak
boleh diatur di Vercel. Aplikasinya tidak pernah membacanya.

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

**Filter tech stack adalah tautan ke halaman tersendiri, bukan parameter
alamat.** `/proyek/tech/react`, bukan `/proyek?tech=React`. Ini soal kecepatan,
bukan selera: membaca `searchParams` memaksa Next merender halaman secara
dinamis pada setiap kunjungan, sehingga `/proyek` tidak pernah masuk cache CDN.
Terukur di produksi — `/proyek` menjawab dalam 1232 ms dengan
`X-Vercel-Cache: MISS`, sementara setiap halaman lain sekitar 200 ms dengan
`HIT`. Sekarang `/proyek` dan setiap `/proyek/tech/*` adalah halaman statis yang
dibangun saat build, dan filternya tidak mengirim JavaScript sama sekali.

Konsekuensi yang perlu diingat: menambah tech stack baru pada proyek berarti
ada alamat `/proyek/tech/*` baru. Halamannya dibuat saat permintaan pertama
(`dynamicParams`) lalu ikut di-cache, jadi tidak perlu build ulang — tetapi
slug yang tidak dikenal menjawab 404, bukan daftar kosong.

## Dashboard admin

Dashboard ada di `/admin` dan hanya bisa diakses oleh **satu** akun.

### Dua langkah wajib di Supabase

Keduanya tidak bisa dilakukan dari kode:

1. **Matikan signup.** Project Settings → Authentication → matikan "Allow new
   users to sign up". Tanpa ini, siapa pun bisa mendaftar dan langsung
   memperoleh hak tulis penuh — lihat peringatan keamanan di bawah.
2. **Buat akun admin.** Authentication → Users → Add user. Isi email dan
   password, centang konfirmasi email.

### Variabel lingkungan tambahan

| Variabel | Keterangan |
| --- | --- |
| `ADMIN_EMAIL` | Email akun admin dari langkah 2. **Tanpa** awalan `NEXT_PUBLIC_`. |

> `ADMIN_EMAIL` tidak boleh berawalan `NEXT_PUBLIC_`. Kalau diberi awalan itu,
> nilainya ikut masuk ke bundel JavaScript yang dikirim ke peramban, sehingga
> allowlist admin terlihat semua pengunjung. Pemeriksaannya harus di server.

### Peringatan keamanan yang perlu dipahami

**Row Level Security di proyek ini mengizinkan SETIAP pengguna terautentikasi
menulis ke semua tabel.** Itu sesuai untuk portofolio satu pemilik, dan itulah
sebabnya signup harus dimatikan.

Konsekuensinya: **jangan membuat pengguna Supabase lain** untuk tujuan apa pun
sebelum mempersempit policy `authenticated` di
`supabase/migrations/20261002120600_rls.sql`. Allowlist `ADMIN_EMAIL` hanya
berlaku di lapisan aplikasi — ia tidak menghalangi pemegang kredensial pengguna
Supabase lain untuk menulis langsung lewat API Supabase.

### Mengganti password admin

Dashboard Supabase hanya menawarkan "Send password recovery" dan "Send magic
link" — keduanya lewat email, dan keduanya mengarahkan ke Site URL proyek.
Portofolio ini sengaja **tidak punya halaman reset password**: pemiliknya satu
orang, dan alur "lupa password" publik hanya menambah permukaan serang. Jadi
link di email itu tidak akan pernah mendarat di halaman yang bisa menanganinya
— kalau Site URL masih bawaan, ia malah mengarah ke `localhost:3000`.

Gantilah lewat perkakas proyek ini:

```bash
# 1. Isi ADMIN_TEMP_PASSWORD di .env.local dengan password baru
# 2. Jalankan:
npm run admin:password
```

Password dibaca dari `.env.local`, bukan dari argumen baris perintah — argumen
tersimpan di riwayat shell dan terlihat di daftar proses. Nilainya dikirim
sebagai parameter query, tidak pernah disisipkan ke teks SQL, dan tidak pernah
dicetak ke layar.

Seluruh perubahan berjalan dalam satu transaksi yang hanya di-commit setelah
hash barunya terbukti cocok dengan passwordnya. Itu menjaga dari satu kegagalan
yang paling mahal: hash tertulis tetapi tidak bisa dipakai masuk, yang berarti
terkunci dari dashboard produksi tanpa jalan kembali.

Seluruh sesi lama ikut diakhiri, sehingga token yang beredar sebelum
penggantian benar-benar mati. Semua perangkat perlu masuk ulang.

Karena sumbernya `.env.local`, suite e2e otomatis tetap sinkron.

### Masuk

Halaman masuk berada di alamat yang Anda tentukan sendiri lewat
`ADMIN_LOGIN_PATH` — misalnya `/masuk-7f3a9c21`. Alamat `/admin` dan semua di
bawahnya **dialihkan ke beranda** bagi siapa pun yang belum masuk, dan
`/admin/login` tidak dapat dibuka langsung. Pemindai otomatis yang mencoba
`/admin` tidak menemukan form masuk sama sekali.

Halaman admin yang semula Anda tuju tetap diingat — lewat cookie `httpOnly`
berumur sepuluh menit, bukan lewat parameter alamat, supaya alamat dashboard
tidak ikut terlihat di bilah alamat beranda. Setelah masuk Anda diantar ke
sana. Setelah keluar, Anda dikembalikan ke beranda.

Perlu dinyatakan jujur: menyembunyikan alamat ini **mengurangi kebisingan bot,
bukan menambah keamanan**. Yang benar-benar menjaga dashboard adalah
pemeriksaan sesi di `proxy.ts` dan `requireAdmin()` di setiap aksi tulis.
Siapa pun yang menemukan alamatnya tetap tidak bisa masuk tanpa kredensial
yang sah.

Autentikasinya dikerjakan Server Action, bukan klien Supabase di peramban.
Itu bukan pilihan gaya: cookie sesi harus ikut di respons HTTP yang sama
dengan pengalihannya, kalau tidak proxy belum melihat sesi itu dan
memantulkan admin kembali ke beranda. Efek sampingnya menyenangkan —
`@supabase/supabase-js` tidak lagi ikut ke bundel peramban sama sekali.

### Identitas situs: nama dan logo di header

Tulisan di pojok kiri header dan logo di sampingnya diatur di `/admin/profil`,
bukan di kode. Tidak ada satu pun teks di situs publik yang ditulis keras.

- **Nama situs** — dikosongkan berarti memakai "Portofolio". Maksimal 40
  karakter, karena ruang di header terbatas dan nama yang terlalu panjang
  mendorong menu navigasi keluar layar di peranti kecil.
- **Logo header** — rasio apa pun boleh; gambarnya disesuaikan tanpa terpotong
  maupun meregang, jadi tidak perlu disiapkan persegi. Dikosongkan berarti
  header hanya menampilkan nama. Logo lama otomatis dihapus dari Storage
  setelah penggantian tersimpan.

Keduanya tampil di SETIAP halaman, jadi menyimpannya merevalidasi seluruh
layout sekaligus — bukan satu path.

### Lebar halaman

Halaman memakai seluruh lebar layar. Lebarnya ditentukan di satu tempat saja,
utility `wadah` di `src/app/globals.css`, bukan ditulis berulang di tiap
halaman. Margin tepinya melebar bertahap di layar besar.

Blok teks panjang — bio dan deskripsi proyek — dibatasi utility `prosa`
(~75 karakter per baris). Itu bukan selera: di layar lebar, baris yang
membentang penuh membuat mata kehilangan jejak saat berpindah ke baris
berikutnya. Kartu, grid, header, dan footer tidak dibatasi dan tetap penuh.

### Yang bisa dikelola

| Halaman | Isi |
| --- | --- |
| `/admin` | Ringkasan: jumlah proyek, pesan belum dibaca, rating menunggu |
| `/admin/profil` | Nama situs dan logo header, nama, bio, daftar role, foto, berkas CV, status open-to-work |
| `/admin/tautan-sosial` | Ikon sosial di beranda dan footer |
| `/admin/pendidikan` | Timeline pendidikan |
| `/admin/keahlian` | Kategori beserta keahlian di dalamnya |
| `/admin/pengalaman` | Kerja, magang, organisasi, freelance |
| `/admin/proyek` | Proyek, slug, tech stack, galeri, featured |
| `/admin/pencapaian` | Sertifikat dan penghargaan |
| `/admin/pesan` | Inbox pesan (terisi setelah form kontak publik dibuat) |
| `/admin/rating` | Moderasi rating (idem) |

Setiap item punya toggle terbit, tombol naik/turun untuk urutan, dan konfirmasi
sebelum dihapus. Perubahan langsung tercermin di halaman publik — tidak perlu
menunggu periode revalidasi lima menit.

### Unggahan berkas

Gambar dibatasi 5 MB (JPG, PNG, WebP, AVIF, GIF, SVG), CV dibatasi 10 MB dan
hanya PDF. Batas ini ditegakkan di server, bukan hanya oleh atribut form.
Berkas lama otomatis dihapus dari Storage setelah penggantinya tersimpan.

## Form publik

Halaman `/kontak` memuat form kontak, dan beranda memuat section rating.

### Penyaringan spam

Tiga lapis, dan tidak ada yang berdiri sendiri:

1. **Honeypot** — field tersembunyi yang tidak terlihat pengunjung maupun
   pembaca layar. Pengiriman yang mengisinya dibuang, dan tanggapannya dibuat
   **sama seperti berhasil**: pesan penolakan yang jujur akan memberi tahu
   pembuat skrip field mana yang harus dikosongkan.
2. **Pembatasan laju** — lima pengiriman per jam per pengirim, dihitung di
   database. Penghitungnya menyimpan hash beralamat garam, bukan alamat IP.
3. **Moderasi** — rating tidak pernah tampil sebelum Anda setujui di
   `/admin/rating`.

Batasnya sengaja longgar: beberapa pengunjung bisa berbagi satu alamat IP di
kantor, kampus, atau jaringan seluler, dan kuota yang ketat akan memblokir
orang yang tidak bersalah. Ubah nilainya di `src/server/actions/public.ts` bila perlu.

### Pesan masuk

Tidak ada notifikasi email, dan itu disengaja — tidak ada layanan pihak
ketiga, kunci API, maupun domain pengirim yang perlu diurus. Pesan baru
dibaca di `/admin/pesan`, dan hitungan "pesan belum dibaca" di dashboard
adalah satu-satunya sumber kebenaran.

### Apa yang BISA dan TIDAK BISA dilakukan pengunjung

| | Pengunjung |
| --- | --- |
| Mengirim pesan | bisa |
| Membaca pesan — termasuk pesannya sendiri | **tidak** |
| Mengirim rating | bisa |
| Membaca rating yang sudah disetujui | bisa |
| Membaca rating yang belum disetujui | **tidak** |
| Menyetujui ratingnya sendiri | **tidak** |
| Menandai pesannya sudah dibaca | **tidak** |
| Mengubah atau menghapus kiriman | **tidak** |
| Membaca penghitung pembatasan laju | **tidak** |

Semuanya ditegakkan oleh Row Level Security di database, bukan oleh kode
aplikasi — kunci anon memang terbit di peramban, jadi siapa pun bisa memanggil
Supabase langsung. Jalankan `npm run db:check:public` untuk membuktikannya.

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
   | `ADMIN_EMAIL` | Email akun admin — **tanpa** awalan `NEXT_PUBLIC_` |
   | `RATE_LIMIT_SALT` | Nilai acak panjang — **tanpa** awalan `NEXT_PUBLIC_` |
   | `ADMIN_LOGIN_PATH` | Alamat rahasia halaman masuk — **tanpa** awalan `NEXT_PUBLIC_` |

   Keenamnya wajib. Build akan gagal dengan pesan yang menyebut nama variabel
   yang kurang kalau salah satu belum diatur — itu memang disengaja.

   Daftar lengkapnya ada di [Variabel lingkungan](#variabel-lingkungan).

   Jangan menambahkan `SUPABASE_DB_URL`, `SUPABASE_ACCESS_TOKEN`, maupun
   `ADMIN_TEMP_PASSWORD` ke Vercel. Ketiganya hanya untuk perkakas di komputer
   Anda, dan aplikasinya tidak pernah membacanya.

4. Pastikan migrasi sudah diterapkan ke proyek Supabase produksi
   (`npx supabase db push`), signup sudah dinonaktifkan, dan akun admin sudah
   dibuat.

   > Perintah migrasi produksi (`npx supabase db push`) berbeda dari perintah
   > pengembangan lokal (`npm run db:reset`). Yang kedua **menghapus seluruh
   > database lalu menjalankan seed** — jangan pernah menjalankannya terhadap
   > proyek produksi.

5. Jalankan pemeriksaan sebelum deploy di komputer Anda:

   ```bash
   npm run predeploy
   ```

   Skrip ini menjalankan pemeriksaan tipe, lint, kontras token, konsistensi
   revalidasi, dan build produksi — berurutan, berhenti pada kegagalan
   pertama. Kalau lulus di sini, build di Vercel juga lulus.

6. Deploy. Setelah selesai, periksa daftar di bawah.

### Verifikasi setelah deploy

Jalankan otomatis:

```bash
npm run e2e:produksi -- https://domain-anda.com
```

Atau periksa manual:

- [ ] Kesembilan halaman publik terbuka dan menampilkan konten dari database
- [ ] `/sitemap.xml` memuat domain produksi Anda, bukan `localhost`
- [ ] `/robots.txt` dapat diambil dan menunjuk sitemap yang benar
- [ ] `/admin` mengalihkan ke **beranda** saat belum ada sesi, dan
      `/admin/login` tidak dapat dibuka langsung
- [ ] Halaman masuk terbuka di alamat `ADMIN_LOGIN_PATH`, dan login berhasil
- [ ] Form kontak di `/kontak` dapat mengirim, dan pesannya muncul di
      `/admin/pesan` sebagai belum dibaca
- [ ] Form rating di beranda dapat mengirim, dan ratingnya muncul di
      `/admin/rating` sebagai menunggu persetujuan — belum tampil di beranda

## Custom domain

1. Vercel → Settings → Domains → **Add**, lalu masukkan domain Anda.
2. Vercel menampilkan catatan DNS yang harus dibuat di penyedia domain Anda:
   - domain utama (`domain-anda.com`) → catatan **A** ke alamat yang Vercel
     tunjukkan,
   - subdomain (`www.domain-anda.com`) → catatan **CNAME** ke
     `cname.vercel-dns.com`.
3. Tunggu DNS menyebar. Vercel menerbitkan sertifikat HTTPS otomatis.
4. **Perbarui `NEXT_PUBLIC_SITE_URL` ke domain baru, lalu deploy ulang.**

Langkah 4 wajib dan paling mudah terlewat. URL kanonik, tag Open Graph, dan
`sitemap.xml` semuanya dibangun dari variabel itu — kalau tidak diperbarui,
situsnya tetap berjalan normal sehingga kesalahannya tidak terlihat, tetapi
mesin pencari dan pratinjau tautan tetap menunjuk alamat `.vercel.app` lama.

Setelah deploy ulang, pastikan:

- [ ] `https://domain-anda.com/sitemap.xml` memuat domain baru di setiap `<loc>`
- [ ] Tag `og:url` di beranda menunjuk domain baru, bukan `.vercel.app`
