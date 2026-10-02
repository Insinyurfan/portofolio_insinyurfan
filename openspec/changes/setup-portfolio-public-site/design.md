## Context

Repositori masih kosong — hanya ada scaffolding OpenSpec, tidak ada `package.json`, tidak ada migrasi. Jadi setiap keputusan teknis di bawah ini adalah keputusan greenfield, bukan adaptasi terhadap kode yang sudah ada. Motivasi ada di `proposal.md` → Why; perilaku yang harus dipenuhi ada di tujuh berkas di `specs/`.

Batasan yang membentuk pendekatan:

- **Satu proyek Supabase dipakai bersama** oleh change ini dan change dashboard admin berikutnya. Skema dan kebijakan RLS yang ditulis sekarang adalah kontrak untuk change itu, jadi tabel `messages` dan `ratings` beserta policy-nya dibuat sekarang walau UI-nya belum ada.
- **Tidak ada autentikasi di change ini.** Semua pembacaan terjadi sebagai role `anon`, sehingga RLS adalah satu-satunya lapisan yang menjaga baris yang belum terbit.
- **Deploy ke Vercel.** Rendering, caching, dan optimasi gambar mengikuti kemampuan bawaan platform agar tidak perlu infrastruktur tambahan.
- **Keputusan yang sudah dipilih pengguna** dan tidak dibuka lagi di dokumen ini: routing multi-halaman penuh, halaman Kontak hanya berisi informasi, skema dikirim lewat Supabase CLI migrations, dan `profile` sebagai satu baris tunggal.

## Goals / Non-Goals

**Goals:**

- Satu lapisan akses data khusus server yang dipakai setiap halaman, sehingga aturan "hanya yang terbit" dan urutan tampil ditentukan di satu tempat.
- Tipe TypeScript untuk skema database yang dihasilkan dari database itu sendiri, bukan ditulis ulang dengan tangan.
- Token design system (warna, tipografi, radius, bayangan) sebagai satu sumber kebenaran, agar aturan "tepat satu warna aksen" dapat ditegakkan dan dark mode tidak perlu ditambal per komponen.
- Permukaan klien seminimal mungkin: hanya toggle tema, menu mobile, animasi ketik, reveal saat scroll, filter proyek, dan preview pencapaian yang menjadi Client Component.
- Jalur verifikasi yang nyata untuk RLS, karena RLS adalah satu-satunya hal yang mencegah konten draf terlihat publik.

**Non-Goals:**

- Framework pengujian otomatis (unit/e2e). Lihat Risks untuk cara verifikasi di change ini.
- Pustaka komponen UI pihak ketiga. Komponen ditulis sendiri agar arah visual bento grid tidak tertarik ke tampilan bawaan pustaka.
- Internasionalisasi. Antarmuka hanya bahasa Indonesia, tanpa lapisan i18n.
- Revalidasi on-demand dan `@supabase/ssr`/middleware sesi. Keduanya baru dibutuhkan saat dashboard admin ada.

## Decisions

### Next.js App Router + React Server Components sebagai default

Setiap halaman publik adalah Server Component yang mengambil datanya sendiri lalu dirender di server. Client Component dipakai hanya untuk interaksi yang tercantum di Goals, masing-masing menerima data sebagai props dan tidak pernah memanggil Supabase sendiri.

*Mengapa:* spesifikasi SEO mensyaratkan HTML yang sudah berisi konten tanpa menjalankan JavaScript, dan ini juga menjaga kunci anon serta bentuk query tidak ikut terkirim ke peramban.

*Alternatif:* pengambilan data di sisi klien dengan SWR/React Query — ditolak karena HTML-nya kosong bagi perayap dan menambah beban JavaScript tanpa manfaat di situs yang hampir seluruhnya baca saja.

### Lapisan query khusus server di `lib/queries/`

Satu modul per domain (`profile.ts`, `projects.ts`, `education.ts`, dan seterusnya) yang mengekspor fungsi async bertipe seperti `getPublishedProjects()` dan `getProjectBySlug(slug)`. Berkas-berkas ini ditandai server-only. Tidak ada komponen yang memanggil klien Supabase secara langsung.

*Mengapa:* filter `is_published` dan aturan urutan ditulis sekali, bukan diulang di delapan halaman. Ketika dashboard admin nanti butuh pembacaan yang menyertakan draf, ia menambah fungsi sendiri alih-alih melemahkan fungsi publik.

*Alternatif:* query ditulis inline di tiap halaman — ditolak karena satu halaman yang lupa memfilter `is_published` langsung berarti kebocoran konten draf.

### Klien Supabase anon di server, bukan service role

Dibuat dengan `@supabase/supabase-js` memakai `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Service role key sama sekali tidak dipakai di change ini.

*Mengapa:* memaksa halaman publik melewati RLS yang sama seperti peramban, sehingga kebocoran kebijakan muncul saat pengembangan, bukan setelah produksi. `@supabase/ssr` belum dipasang karena belum ada sesi yang perlu dijaga.

*Alternatif:* service role di server untuk kenyamanan — ditolak; ia melewati RLS dan membuat kebijakan tidak teruji sama sekali.

### Tipe database dihasilkan, bukan ditulis tangan

`supabase gen types typescript` menghasilkan `lib/database.types.ts` yang ikut di-commit, ditambah alias ringkas (`Profile`, `Project`, …) di `lib/types.ts` untuk dipakai komponen.

*Mengapa:* saat kolom diubah di migrasi, `tsc` yang menunjukkan tempat yang perlu disesuaikan. Tipe tulisan tangan diam-diam melenceng dari skema.

*Trade-off:* berkas yang dihasilkan harus diperbarui bersama setiap migrasi; tasks mencantumkan langkah ini secara eksplisit.

### Postgres enum untuk tipe pengalaman dan kategori pencapaian

`CREATE TYPE experience_type` dan `CREATE TYPE achievement_category`, bukan kolom text dengan CHECK constraint.

*Mengapa:* nilainya memang tertutup, dan tipe yang dihasilkan menjadi union TypeScript sehingga pemetaan label bahasa Indonesia menjadi exhaustive dan dicek compiler.

*Alternatif:* text + CHECK — lebih mudah ditambah nilainya tanpa migrasi, tetapi hilang keamanan tipe dan tidak ada daftar nilai yang dapat dibaca mesin untuk dropdown admin nanti.

### Profil singleton ditegakkan di database

`profile` memiliki kolom `singleton boolean NOT NULL DEFAULT true` dengan unique constraint dan `CHECK (singleton)`. Baris kedua ditolak oleh database, bukan hanya oleh konvensi di kode.

*Mengapa:* dashboard admin berikutnya akan menulis ke tabel ini. Batasan yang hanya ada di kode aplikasi akan gugur di sana.

*Alternatif:* tabel key-value `settings` — ditolak karena mengorbankan kolom bertipe dan tipe yang dihasilkan.

### Daftar berurutan sebagai kolom array, bukan tabel anak

`profile.roles`, `projects.tech_stack`, dan `projects.gallery` memakai `text[]`.

*Mengapa:* Postgres menjaga urutan elemen array, nilainya tidak pernah dirujuk atau difilter secara relasional, dan ini menghindari tiga tabel join hanya untuk daftar teks. Filter tech stack dihitung di aplikasi dari proyek yang sudah terbaca — jumlah proyek dalam portofolio pribadi memang kecil.

*Alternatif:* tabel `project_tech` ternormalisasi — ditolak sebagai normalisasi berlebih untuk skala ini; dapat dimigrasikan nanti jika dibutuhkan penyaringan di sisi database.

### Pola RLS: ditolak sebagai default, izin diberikan per role

Untuk setiap tabel: `ENABLE ROW LEVEL SECURITY`, lalu satu policy `SELECT TO anon USING (is_published)` dan satu policy `FOR ALL TO authenticated USING (true) WITH CHECK (true)`. `messages` dan `ratings` tidak mendapat policy `anon` sama sekali, sehingga tertutup rapat bagi publik.

*Mengapa:* RLS tanpa policy permisif berarti menolak, jadi menambahkan policy adalah tindakan yang disengaja dan terlihat. Memisahkan policy per role membuat permukaan publik jelas terbaca di satu tempat dalam migrasi.

*Trade-off:* policy `authenticated` yang seluas ini berarti setiap user yang login adalah admin. Itu sesuai untuk portofolio satu pemilik; jika kelak butuh peran, ganti `USING (true)` dengan pemeriksaan klaim.

### Satu bucket Storage publik dengan prefiks folder

Bucket `media` ditandai publik, berisi prefiks `profile/`, `projects/`, `achievements/`, dan `cv/`. Kebijakan tulis dibatasi pada pengguna terautentikasi.

*Mengapa:* permintaan spesifikasi adalah "berkas konten terbit dapat dibaca publik", dan bucket publik memenuhinya dengan URL stabil yang ramah `next/image` tanpa signed URL yang kedaluwarsa. Satu bucket berarti dua policy, bukan delapan.

*Alternatif:* bucket privat + signed URL — ditolak; URL yang kedaluwarsa mengacaukan ISR dan cache gambar tanpa memberi kerahasiaan nyata untuk aset yang memang ditujukan publik.

*Trade-off:* URL berkas dapat ditebak jika namanya ditebak. Lampiran bersifat rahasia tidak boleh ditaruh di bucket ini; CV memang sudah dimaksudkan untuk diunduh publik.

### Tailwind CSS v4 dengan token di satu berkas CSS

Token didefinisikan sekali di blok `@theme` dalam `app/globals.css`: skala netral, satu skala aksen zamrud, radius, dan bayangan. Dark mode memakai custom variant berbasis class. Nilai warna lepas di dalam komponen tidak diperbolehkan — ini yang menegakkan aturan satu warna aksen pada spesifikasi site-shell.

*Mengapa:* konfigurasi CSS-first Tailwind v4 menaruh token di tempat yang sama dengan tempat pemakaiannya, dan pasangan token terang/gelap dapat diperiksa kontrasnya sekali untuk seluruh situs.

*Alternatif:* Tailwind v3 dengan `tailwind.config.ts` — lebih banyak contoh di internet, tetapi memecah token ke dua berkas. Versi dipin agar v4 yang masih relatif baru tidak berubah di bawah kaki; lihat Risks.

### `next-themes` untuk tema, bukan toggle buatan sendiri

*Mengapa:* syarat "tanpa kedipan" pada spesifikasi site-shell menuntut class tema tertulis sebelum paint pertama, dan itu berarti skrip inline yang berjalan sebelum hidrasi plus penanganan ketidakcocokan hidrasi. Pustaka ini sudah menyelesaikannya, termasuk fallback ke preferensi sistem.

*Alternatif:* skrip inline sendiri — kode sedikit, tetapi persis bagian yang mudah salah dan langsung terlihat sebagai kedipan.

### Animasi ditulis sendiri dengan IntersectionObserver dan CSS, tanpa pustaka animasi

Satu komponen `<Reveal>` memakai IntersectionObserver untuk menambahkan class sekali saat elemen masuk area pandang, dan satu hook animasi ketik. Keduanya memeriksa `prefers-reduced-motion` dan langsung merender keadaan akhir bila gerak dikurangi.

*Mengapa:* yang dibutuhkan hanya dua efek. Pustaka animasi penuh akan menambah JavaScript klien yang jauh lebih besar daripada efek yang dipakai, di situs yang nilai utamanya adalah kecepatan muat.

*Alternatif:* Framer Motion — lebih ekspresif, tetapi tidak terpakai dan membuat banyak bagian halaman menjadi Client Component.

*Trade-off:* elemen yang di-reveal mulai dari keadaan tersembunyi, jadi harus terlihat tanpa JavaScript. Keadaan tersembunyi diterapkan hanya setelah observer terpasang, sehingga HTML tanpa JavaScript tetap terbaca penuh.

### Animasi ketik aksesibel lewat pemisahan teks

Rangkaian karakter yang berubah dirender dengan `aria-hidden`, didampingi elemen tersembunyi secara visual yang memuat seluruh daftar role sebagai teks statis.

*Mengapa:* syarat spesifikasi home adalah role dapat diakses tanpa pembaca layar mengumumkan setiap karakter. Memisahkan lapisan visual dari lapisan yang dapat diakses memenuhi keduanya tanpa `aria-live`.

### State filter proyek disimpan di URL search param

`/proyek` membaca `?tech=` di server untuk menentukan penyaringan awal; kontrol filter memperbarui param dengan `router.replace` tanpa scroll.

*Mengapa:* tampilan terfilter jadi dapat dibagikan dan tombol kembali bekerja seperti harapan pengunjung. Server tetap mengirim HTML yang sesuai untuk tautan terfilter yang dibagikan.

*Alternatif:* `useState` saja — lebih sederhana, tetapi tampilan terfilter tidak dapat ditautkan dan tombol kembali keluar dari halaman.

### Ikon: `lucide-react` untuk UI, `react-icons` untuk lambang platform

Tautan sosial memetakan nilai `platform` dari database melalui registry kecil ke komponen ikon, dengan ikon tautan generik sebagai fallback bila platform tidak dikenal.

*Mengapa:* lucide tidak memuat lambang merek, sementara nama platform datang dari data yang dapat diisi admin. Registry dengan fallback berarti platform tak terduga tetap tampil rapi, bukan menghilang. Registry adalah pemetaan presentasi, bukan konten — konten tetap sepenuhnya dari database.

### ISR: `revalidate = 300` per halaman, slug proyek pakai `generateStaticParams`

Setiap route publik mengekspor `revalidate = 300`. `/proyek/[slug]` menghasilkan parameter untuk slug yang terbit dan tetap mengizinkan slug di luar daftar agar proyek baru dapat dilayani lalu di-cache.

*Mengapa:* lima menit cukup cepat agar pengeditan terasa langsung, cukup lambat agar lalu lintas biasa tidak memukul database. Nilainya berumur pendek: ketika dashboard admin hadir, ia akan memanggil revalidasi on-demand setelah penyimpanan dan angka ini menjadi jaring pengaman.

### Variabel lingkungan divalidasi sekali di `lib/env.ts`

Modul mengekspor variabel yang sudah diperiksa dan melempar error yang menyebut nama variabel yang kurang beserta rujukan ke `.env.example`. `next.config.ts` menurunkan hostname gambar yang diizinkan dari `NEXT_PUBLIC_SUPABASE_URL` sehingga kedua tempat tidak bisa berbeda.

*Mengapa:* spesifikasi developer-setup mensyaratkan kegagalan yang menyebut nama variabel. Memeriksa di satu modul berarti halaman tidak perlu bertahan terhadap nilai yang hilang.

### Verifikasi RLS lewat skrip SQL, bukan hanya pemeriksaan manual

`supabase/tests/rls_checks.sql` berpindah ke role `anon`, menegaskan bahwa baris belum terbit tidak terlihat, penulisan ditolak, dan `messages`/`ratings` kosong — lalu berpindah ke role `authenticated` dan menegaskan draf terlihat.

*Mengapa:* ini satu-satunya persyaratan di change ini yang kegagalannya tidak terlihat di antarmuka. Baris draf yang bocor tampak persis seperti situs yang bekerja normal.

### Font: Plus Jakarta Sans untuk judul, Inter untuk teks isi

Dimuat lewat `next/font` dengan subset latin dan `display: swap`.

*Mengapa:* spesifikasi meminta sans-serif yang tegas untuk judul. Plus Jakarta Sans memiliki judul bergeometri tegas dengan cakupan diakritik Indonesia yang lengkap, sementara Inter lebih tenang untuk paragraf bio dan deskripsi proyek yang panjang.

## Risks / Trade-offs

- **Tailwind v4 masih relatif baru; contoh dan plugin pihak ketiga sering mengasumsikan v3** → versi dipin tepat di `package.json`, tidak memakai plugin Tailwind pihak ketiga, dan seluruh token dijaga di satu berkas sehingga turun ke v3 berarti memindahkan satu blok `@theme` ke `tailwind.config.ts`.
- **Kesalahan konfigurasi RLS membocorkan konten draf tanpa gejala yang terlihat** → semua pembacaan memakai kunci anon (service role tidak pernah dipakai), filter `is_published` terpusat di `lib/queries/`, dan `rls_checks.sql` dijalankan sebagai langkah verifikasi yang eksplisit di tasks.
- **Tanpa pengujian otomatis, skenario spesifikasi diverifikasi manual** → tasks berakhir dengan daftar periksa verifikasi yang menelusuri setiap berkas spesifikasi, ditambah `rls_checks.sql` untuk satu-satunya hal yang tidak terlihat mata. Pengujian otomatis sebaiknya ditambahkan bersama dashboard admin, di mana ada jalur tulis yang perlu dijaga regresi.
- **Bucket Storage publik berarti URL yang ditebak dapat diambil** → hanya aset yang memang untuk publik (foto, thumbnail, sertifikat, CV) masuk ke `media`; batasan ini ditulis di README agar change admin tidak mengunggah lampiran privat ke bucket yang sama.
- **`next/image` yang mengoptimasi gambar Supabase membebani kuota optimasi Vercel** → prioritas dan ukuran gambar ditetapkan eksplisit, hanya hero yang `priority`, dan sisanya lazy; jika kuota jadi masalah, Supabase Storage sendiri dapat melakukan transformasi gambar tanpa perubahan struktur.
- **Delapan route dengan `revalidate` masing-masing bisa menjadi tidak konsisten** → nilainya diekspor dari satu konstanta bersama, bukan ditulis ulang per berkas.
- **Seed dijalankan dua kali menggandakan data** → seed memakai UUID literal tetap dengan `ON CONFLICT (id) DO UPDATE`, sehingga menjalankannya ulang menjadi sinkronisasi, bukan penambahan.
- **Konten contoh bisa terbawa ke produksi** → seed berada di `supabase/seed.sql` yang hanya dijalankan `supabase db reset` di lokal, dan README menyatakan bahwa seed tidak boleh dijalankan pada proyek produksi setelah konten asli dimasukkan.

## Migration Plan

Tidak ada migrasi data — repositori dan database sama-sama dimulai dari kosong. Urutan penerapan:

1. Buat proyek Supabase, catat URL dan kunci anon.
2. Jalankan migrasi (`supabase db push` ke remote, atau `supabase db reset` untuk pengembangan lokal), lalu `supabase/seed.sql` hanya di lokal.
3. Jalankan `rls_checks.sql` dengan kunci anon; lanjut hanya jika semua pemeriksaan lulus.
4. Jalankan situs di lokal dengan `.env.local`, telusuri daftar periksa verifikasi.
5. Deploy ke Vercel dengan `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, dan `NEXT_PUBLIC_SITE_URL` yang menunjuk domain produksi.

**Rollback:** situs publik tidak memiliki jalur tulis, jadi rollback hanyalah mengembalikan deployment Vercel ke versi sebelumnya. Skema dapat dikembalikan dengan migrasi turun atau `supabase db reset`, karena belum ada data produksi yang perlu diselamatkan pada tahap ini.

## Open Questions

- Apakah seed akan diisi riwayat sebenarnya milik pemilik atau tetap placeholder sampai dashboard admin siap? Tidak mengubah skema maupun tasks — hanya isi `seed.sql`.
- Gambar Open Graph bawaan: sementara memakai gambar sederhana berisi nama dan aksen zamrud; apakah perlu kartu OG yang dihasilkan otomatis per halaman dapat diputuskan belakangan tanpa mengubah tag yang sudah dipasang.
- Domain produksi untuk `NEXT_PUBLIC_SITE_URL`. Sampai diputuskan, URL yang diberikan Vercel sudah cukup — URL kanonik dan sitemap memang sudah dibaca dari variabel ini.
