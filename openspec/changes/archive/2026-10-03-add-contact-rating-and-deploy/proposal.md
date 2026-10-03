## Why

Dua change sebelumnya sengaja menyisakan satu sisi kosong: tabel `messages` dan `ratings` sudah ada dan sudah punya pengelola di dashboard admin, tetapi tidak ada jalan bagi pengunjung untuk mengisinya. Halaman `/kontak` hanya menampilkan email, dan portofolio tidak punya bukti sosial apa pun. Change ini menutup lingkarannya: pengunjung dapat mengirim pesan dan memberi rating, pemilik mendapat pemberitahuan dan memoderasi, lalu situs siap dipublikasikan di domain sendiri.

Change ini bergantung pada `setup-portfolio-public-site` dan `add-admin-dashboard`, dan SHALL diimplementasi serta diarsipkan setelah keduanya.

## What Changes

**Membalik batasan yang disengaja di change sebelumnya.** Tiga larangan di bawah ini ditulis sebagai larangan *untuk change itu*, dan sekarang dicabut secara eksplisit lewat requirement MODIFIED, bukan ditambal diam-diam:
- `/kontak` yang semula SHALL TIDAK memuat form kini memuat form kontak.
- RLS yang semula menutup `messages` dan `ratings` sepenuhnya dari publik kini mengizinkan `INSERT` pesan dan rating oleh pengunjung, serta `SELECT` rating yang sudah disetujui.
- `admin-inbox` yang semula menyatakan halaman publik tidak menyentuh kedua tabel itu kini menyatakan sebaliknya.

**Form kontak**
- Form di `/kontak` berisi nama, email, subjek opsional, dan pesan; tersimpan ke `messages` sebagai belum dibaca.
- Validasi dengan skema yang sama di klien dan server, pesan error per field berbahasa Indonesia.
- Anti-spam: field honeypot yang tersembunyi dari pengunjung tetapi terlihat bagi bot, dan pembatasan laju pengiriman per alamat IP yang dihitung di database.
- Pengelolaan pesan di dashboard sudah tercakup di `add-admin-dashboard` — change ini tidak mengulangnya, hanya membuat pesan sungguhan mulai masuk.

**Rating pengunjung**
- Section di beranda berisi rata-rata rating, jumlah rating, daftar rating yang sudah disetujui, dan form pengiriman bintang 1–5 beserta komentar.
- Rating masuk dalam keadaan belum disetujui sehingga tidak langsung tampil; moderasinya sudah ada di dashboard.
- Setelah mengirim, peramban menyimpan penanda sehingga form berganti menjadi ucapan terima kasih — mencegah pengiriman ganda yang tidak disengaja, bukan jaminan keamanan.
- Pembatasan laju yang sama dengan form kontak juga berlaku di sini.

**Pratinjau CV**
- Tombol "Pratinjau CV" membuka berkas PDF di modal tanpa meninggalkan halaman, berdampingan dengan tombol unduh yang sudah ada.
- Modal menyediakan jalan keluar yang jelas dan tautan buka di tab baru bagi peranti yang tidak dapat menampilkan PDF inline.


**Kesiapan deploy**
- Daftar variabel lingkungan yang lengkap untuk Vercel, pemeriksaan build sebelum deploy, dan panduan menghubungkan custom domain beserta akibatnya terhadap URL kanonik, Open Graph, dan sitemap.

**Non-goals**
- **Notifikasi email ke admin.** Semula termasuk ruang lingkup, lalu dicabut atas permintaan pemilik di tengah implementasi: "tidak perlu deh notif ke email, tidak butuh sampai bisa kirim email". Konsekuensinya seluruh capability `admin-email-notifications`, modul `lib/public/email.ts`, dependensi `resend`, dan variabel `RESEND_API_KEY` serta `RESEND_FROM_EMAIL` dihapus. Pesan baru dibaca di `/admin/pesan`, dan hitungan belum dibaca di dashboard menjadi satu-satunya sumber kebenaran.
- Balasan pesan dari dalam dashboard; admin menjawab lewat aplikasi email sendiri.
- Verifikasi email pengirim, CAPTCHA, dan tanda tangan bot pihak ketiga.
- Halaman rating tersendiri, pagination daftar rating, dan penyuntingan rating oleh pengunjung.
- Rating per proyek; rating bersifat untuk portofolio secara keseluruhan.
- Analitik, laporan, dan pemantauan uptime.

## Capabilities

### New Capabilities
- `public-site/contact-form`: Form kontak publik di `/kontak` — validasi, penyimpanan ke `messages`, honeypot, pembatasan laju, dan keadaan berhasil maupun gagal.
- `public-site/ratings`: Section rating di beranda — rata-rata, jumlah, daftar rating yang disetujui, form pengiriman, dan penanda sudah mengirim di peramban.
- `public-site/cv-preview`: Pratinjau berkas CV di modal beserta jalur unduh dan jalur cadangan bila PDF tidak dapat ditampilkan inline.
- `deployment`: Kesiapan rilis — variabel lingkungan Vercel, pemeriksaan build, dan panduan custom domain beserta pengaruhnya pada URL kanonik dan sitemap.

### Modified Capabilities
- `public-site/projects`: filter tech stack berpindah dari parameter alamat `?tech=` ke alamat tersendiri `/proyek/tech/[tech]`. Penyimpangan dari rencana, diputuskan saat implementasi: membaca `searchParams` memaksa `/proyek` dirender dinamis pada setiap kunjungan, dan terukur di produksi halaman itu menjawab 1232 ms dengan `X-Vercel-Cache: MISS` sementara halaman lain sekitar 200 ms dengan `HIT`. Sekarang keduanya halaman statis dan filternya tidak mengirim JavaScript sama sekali.
- `admin-auth`: proteksi route berubah bentuk. `/admin` dan seluruh turunannya dialihkan ke **beranda** bagi yang belum masuk — bukan ke halaman masuk — dan halaman masuk pindah ke alamat rahasia dari `ADMIN_LOGIN_PATH`. Diminta pemilik setelah melihat perilaku serupa di situs lain. Dicatat jujur di spec dan README: ini mengurangi kebisingan bot, BUKAN menambah keamanan. Autentikasinya sekaligus dipindahkan dari klien Supabase peramban ke Server Action, karena cookie sesi harus ikut di respons yang sama dengan pengalihannya.
- `portfolio-content-model`: RLS dibuka terbatas — publik boleh `INSERT` ke `messages` dan `ratings`, dan boleh `SELECT` rating yang sudah disetujui; sisanya tetap tertutup. Ditambah tabel penghitung pembatasan laju beserta fungsinya, dan pernyataan bahwa kedua tabel itu kini memang dipakai halaman publik.
- `public-site/profile-pages`: `/kontak` kini memuat form kontak; larangan "tidak ada form" dicabut.
- `public-site/home`: hero mendapat tombol pratinjau CV di samping tombol unduh.
- `admin-inbox`: pernyataan bahwa halaman publik belum menyentuh `messages` dan `ratings` dicabut, karena sekarang justru itulah sumber datanya.

## Impact

- **Kode**: section baru di beranda; form di `/kontak`; dua Server Action publik yang menulis sebagai pengunjung tanpa autentikasi — jalur tulis pertama di situs yang tidak melewati `requireAdmin()`; modal pratinjau PDF; satu modul pembatasan laju.
- **Dependensi baru**: tidak ada. Skema validasi, pustaka form, dan komponen modal sudah ada dari change sebelumnya.
- **Migrasi database**: policy RLS baru untuk `anon` pada `messages` dan `ratings`, tabel penghitung pembatasan laju, dan fungsi pembatasan laju yang atomik.
- **Variabel lingkungan baru**: `RATE_LIMIT_SALT` dan `ADMIN_LOGIN_PATH`. Keduanya wajib, bersifat server, dan tidak boleh berawalan `NEXT_PUBLIC_`.
- **Beranda**: kini bergantung pada data rating, sehingga revalidasi beranda ikut dipicu saat admin menyetujui atau mencabut persetujuan rating.
- **Permukaan keamanan**: ini perubahan paling sensitif dari ketiga change. Sebelum ini tidak ada cara bagi orang luar menulis apa pun ke database.
- **Prasyarat**: `setup-portfolio-public-site` dan `add-admin-dashboard` harus sudah diimplementasi dan diarsipkan lebih dulu, agar keempat delta di atas punya spec induk untuk digabung.
