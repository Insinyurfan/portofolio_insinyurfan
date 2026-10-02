## Context

Change ini dibangun di atas `setup-portfolio-public-site`, yang belum diimplementasi saat dokumen ini ditulis (0/57 task, belum ada kode). Jadi keputusan di bawah ini menetapkan kontrak yang harus dihormati implementasi kedua change, bukan menyesuaikan diri terhadap kode yang sudah berjalan. Motivasi ada di `proposal.md` → Why; perilaku yang harus dipenuhi ada di delapan berkas di `specs/`.

Yang diwarisi dari change sebelumnya dan menjadi batasan di sini:

- RLS sudah menetapkan "pengguna terautentikasi dapat membaca dan mengubah semua baris" di semua tabel. Dashboard memakai jalur itu; tidak ada policy baru yang dibutuhkan untuk menulis.
- Halaman publik membaca memakai kunci anon lewat `lib/queries/`, dan service role tidak pernah dipakai. Change ini tidak mengubahnya.
- Bucket Storage `media` sudah publik untuk dibaca dan terbatas pada pengguna terautentikasi untuk ditulis.
- Halaman publik memakai ISR dengan `revalidate` dari satu konstanta bersama.

Keputusan pengguna yang sudah dipilih dan tidak dibuka lagi di dokumen ini: pesan dan rating dikelola di admin saja (form publiknya menyusul), pengurutan memakai tombol naik/turun, satu akun admin ditegakkan lewat signup yang dimatikan ditambah allowlist email di kode, dan tidak ada mode pratinjau konten belum terbit.

### Konflik yang perlu disebut lebih dulu

Spec `portfolio-content-model` menyimpan media sebagai **URL** (`URL foto`, `URL thumbnail`, `galeri URL gambar`, `URL berkas CV`), sedangkan menghapus berkas lama dari Storage membutuhkan **path objek**. Dua jalan keluarnya: mengubah kolom menjadi path, atau menurunkan path dari URL. Dokumen ini memilih yang kedua (lihat Decisions) agar spec dan kode halaman publik tidak perlu diubah hanya demi kebutuhan admin.

## Goals / Non-Goals

**Goals:**

- Satu titik penegakan otorisasi yang dilewati setiap aksi tulis, sehingga tidak ada aksi yang bisa lupa memeriksa sesi.
- Satu skema validasi per entitas yang dipakai bersama klien dan server, sehingga pesan error tidak pernah berbeda antara keduanya.
- Pembacaan admin yang secara struktural terpisah dari pembacaan publik, sehingga filter `is_published` di sisi publik tidak mungkin dilemahkan demi kebutuhan admin.
- Pengurutan yang atomik di database, agar nilai urutan tidak pernah kembar akibat dua pembaruan yang terpisah.
- Pembersihan berkas Storage yang tidak pernah meninggalkan item yang menunjuk berkas yang sudah hilang.
- Token visual admin yang terisolasi dari token halaman publik.

**Non-Goals:**

- Framework pengujian otomatis. Lihat Risks — ini titik terlemah dalam rencana ini dan disebut apa adanya.
- Form kontak publik, pengiriman rating, dan tampilan rating di halaman publik.
- Peran bertingkat, banyak admin, log audit, dan riwayat versi konten.
- Penyuntingan massal, impor/ekspor, dan pencarian lanjutan di dashboard.
- Pratinjau konten belum terbit di halaman publik.

## Decisions

### Sesi berbasis cookie dengan `@supabase/ssr`, bukan sesi di localStorage

Tiga klien dibuat dari satu modul: klien peramban untuk form login, klien server yang membaca cookie untuk Server Component dan Server Action, dan klien middleware yang menulis cookie yang sudah diperbarui kembali ke respons.

*Mengapa:* syarat spesifikasi adalah route admin ditolak sebelum konten terkirim dan token diperbarui tanpa melempar admin keluar. Keduanya hanya mungkin bila sesi ada di cookie yang terbaca di server. Sesi di localStorage tidak terlihat oleh middleware maupun Server Component.

*Alternatif:* autentikasi hanya di sisi klien dengan penjagaan di komponen — ditolak; HTML admin tetap terkirim lebih dulu dan aksi tulis tidak terlindungi.

### Otorisasi ditegakkan dua kali: middleware untuk pengalihan, `requireAdmin()` untuk keamanan

Middleware dengan matcher `/admin/:path*` memperbarui sesi dan mengalihkan permintaan tanpa sesi ke `/admin/login`, menyimpan tujuan semula di parameter pengalihan. Terlepas dari itu, setiap Server Action dan setiap pembacaan data admin memanggil `requireAdmin()` yang memverifikasi sesi dan mencocokkan emailnya dengan `ADMIN_EMAIL`.

*Mengapa:* middleware adalah lapisan pengalaman pengguna, bukan batas keamanan — ia tidak berjalan di jalur pemanggilan Server Action. Spesifikasi `admin-auth` memang mensyaratkan aksi tulis ditolak ketika dipanggil tanpa sesi yang sah, jadi pemeriksaan harus ada di dalam aksi itu sendiri.

*Alternatif:* hanya middleware — ditolak karena aksi tulis dapat dipanggil langsung. Hanya pemeriksaan di aksi — ditolak karena halaman admin akan terkirim lalu baru gagal, dan pengalihan ke login jadi tidak rapi.

### `ADMIN_EMAIL` adalah variabel server, bukan `NEXT_PUBLIC_`

Dibaca di `lib/env.ts` bersama variabel lain, dibandingkan tanpa membedakan huruf besar-kecil setelah dipangkas spasi.

*Mengapa:* variabel `NEXT_PUBLIC_` ikut terkirim ke bundel peramban, jadi allowlist-nya terlihat dan nilai yang dipakai klien tidak dapat dipercaya. Perbandingan harus terjadi di server.

*Trade-off:* allowlist ini hidup di lapisan aplikasi, bukan di RLS. Lihat Risks — ini keterbatasan yang sadar.

### Mutasi lewat Server Action, dibungkus satu helper

Setiap mutasi melewati `withAdminAction(schema, handler)` yang berurutan: memanggil `requireAdmin()`, mem-parse input dengan skema zod, menjalankan handler, memanggil revalidasi, lalu mengembalikan objek hasil bertipe `{ ok: true, message }` atau `{ ok: false, code, message, fieldErrors? }`. Error tak terduga ditangkap, dicatat di server, dan dikembalikan sebagai pesan generik berbahasa Indonesia.

*Mengapa:* otorisasi, validasi, dan revalidasi adalah tiga hal yang paling mudah terlupa pada aksi ke-dua belas. Menjadikannya pembungkus berarti aksi baru tidak bisa dibuat tanpa ketiganya. Mengembalikan hasil alih-alih melempar error membuat pesan error dapat dipasang ke field tertentu.

*Alternatif:* route handler API — ditolak; berarti satu lapisan endpoint tambahan yang juga harus diamankan, tanpa manfaat di antarmuka yang seluruhnya berbasis form.

### Satu skema zod per entitas, dipakai klien dan server

Skema tinggal di `lib/schemas/` dan diimpor keduanya. Klien memakai `react-hook-form` dengan resolver zod untuk umpan balik seketika; pengiriman tetap melalui Server Action yang mem-parse ulang input yang sama. Error per field yang dikembalikan server dipasang kembali ke form.

*Mengapa:* spesifikasi mensyaratkan validasi di kedua sisi dengan server sebagai penentu, dan isi yang sudah diketik tetap utuh saat validasi gagal. `react-hook-form` menyimpan nilai di state klien, jadi isi form bertahan secara gratis — termasuk pada kasus sesi kedaluwarsa di tengah pekerjaan, di mana aksi mengembalikan kode `sessionExpired` dan antarmuka menampilkan toast plus tautan login tanpa melepas form.

*Alternatif:* hanya `useActionState` tanpa pustaka form — lebih sedikit dependensi, tetapi tidak ada validasi seketika dan mempertahankan isi form harus dikerjakan manual per field.

### Pembacaan admin terpisah di `lib/queries/admin/`

Modul terpisah dari `lib/queries/` milik publik, memakai klien server yang sadar sesi, membaca baris terbit maupun belum terbit.

*Mengapa:* satu-satunya hal yang menjaga konten draf tetap tersembunyi di sisi publik adalah filter `is_published` di query publik. Kalau fungsi yang sama dipakai admin, cepat atau lambat filter itu akan diberi parameter `includeDrafts` dan parameter itu akan bocor ke pemanggil publik. Memisahkan modul membuat jalur publik tidak punya alasan untuk berubah.

### Pengurutan memakai satu fungsi Postgres yang menukar nilai secara atomik

Migrasi menambahkan fungsi plpgsql yang menerima nama tabel, id item, dan arah. Nama tabel divalidasi terhadap allowlist tabel berurutan di dalam fungsi, tetangga ditentukan dengan mengurutkan `(sort_order, id)`, lalu kedua nilai `sort_order` ditukar dalam satu pernyataan. Fungsi dibuat `SECURITY INVOKER`.

*Mengapa:* Supabase JS tidak punya transaksi, jadi dua `update` terpisah dapat berhenti di tengah dan meninggalkan dua baris dengan `sort_order` kembar — persis yang dilarang spesifikasi. Satu fungsi berarti satu kali perjalanan dan atomik. Mengurutkan dengan `(sort_order, id)` menyelesaikan kasus nilai yang sudah kembar sejak awal, karena penentuan tetangganya tetap deterministik.

`SECURITY INVOKER` bersifat wajib: `SECURITY DEFINER` akan membuat fungsi ini melewati RLS dan menjadi jalur tulis yang terbuka bagi role anon.

*Alternatif:* dua `update` dari sisi aplikasi — ditolak karena tidak atomik. Menulis ulang seluruh nilai urutan satu daftar pada setiap pemindahan — ditolak; lebih banyak baris tersentuh untuk masalah yang sama.

Migrasi juga menormalkan `sort_order` yang ada menjadi berurutan rapat per tabel satu kali, agar daftar yang diseed tidak mulai dengan nilai kembar.

### Unggahan melewati server, bukan langsung dari peramban

Berkas dikirim ke Server Action lewat `FormData`, divalidasi jenis dan ukurannya di server, lalu diteruskan ke Storage memakai klien yang sadar sesi.

*Mengapa:* spesifikasi `admin-media` mensyaratkan batas jenis dan ukuran ditegakkan di server, bukan hanya oleh atribut form. Unggahan langsung dari peramban memindahkan keputusan itu ke klien yang tidak dapat dipercaya. Batas yang dipakai — gambar beberapa megabita, PDF lebih besar sedikit — jauh di bawah batas ukuran body sehingga melewati server tidak menjadi masalah.

*Alternatif:* signed upload URL lalu unggah langsung dari klien — lebih cepat untuk berkas besar, tetapi pemeriksaan jenis berkas jadi hanya berdasarkan apa yang diklaim klien.

### Nama objek dihasilkan sistem, di bawah prefiks per jenis konten

Pola `{prefiks}/{uuid}.{ekstensi}`, dengan ekstensi diturunkan dari jenis berkas yang sudah diverifikasi, bukan dari nama berkas asal.

*Mengapa:* dua unggahan dengan nama asal yang sama tidak boleh saling menimpa, dan nama berkas dari perangkat admin tidak perlu ikut terbit di URL publik.

### Urutan tetap: unggah → simpan baris → hapus berkas lama

Berkas lama baru dihapus setelah baris database yang menunjuk berkas baru berhasil tersimpan.

*Mengapa:* spesifikasi menuntut bahwa kegagalan di tengah proses tidak pernah meninggalkan item yang menunjuk berkas yang sudah hilang. Urutan ini membuat kegagalan terburuk hanya menyisakan berkas tak terpakai di Storage, bukan gambar rusak di halaman publik.

### Path Storage diturunkan dari URL yang tersimpan

Satu helper mengubah URL publik menjadi path objek dengan memotong prefiks publik bucket yang bentuknya tetap, dan sebaliknya. URL yang tidak menunjuk ke bucket `media` — misalnya gambar yang di-host di tempat lain — dilewati saat penghapusan, bukan dianggap error.

*Mengapa:* ini sisi lain dari konflik yang disebut di Context. Mengubah kolom menjadi path akan lebih bersih secara teori, tetapi menyentuh spesifikasi dan kode halaman publik yang sudah disepakati hanya untuk kebutuhan admin. Prefiks publik Supabase bersifat deterministik, jadi konversinya tidak rapuh selama bucket-nya tidak berganti nama.

*Trade-off:* kalau nama bucket berubah, helper ini harus ikut berubah. Nama bucket berasal dari satu konstanta bersama agar hanya ada satu tempat yang perlu disesuaikan.

### Peta revalidasi terpusat per entitas

Satu modul memetakan setiap entitas ke daftar path publik yang terdampak. Profil dan tautan sosial memakai revalidasi seluruh layout karena keduanya ikut tampil di navigasi dan footer setiap halaman. Proyek merevalidasi halaman detailnya, daftar proyek, sitemap, dan beranda bila proyek itu featured. Perubahan slug merevalidasi path lama maupun path baru.

*Mengapa:* `revalidatePath` pada route dinamis memerlukan path konkret, jadi slug lama akan tetap ter-cache kalau tidak disebut secara eksplisit — itu bug yang paling mudah terjadi di sini dan sudah menjadi skenario tersendiri di spesifikasi.

### Token shadcn/ui dilingkupi di bawah akar admin

Komponen shadcn/ui dipasang untuk dipakai dashboard, tetapi variabel CSS tema bawaannya didefinisikan di bawah satu class pembungkus di layout admin, bukan di `:root`.

*Mengapa:* halaman publik sudah mendefinisikan token sendiri di blok `@theme`. Dua himpunan token di `:root` dengan nama umum seperti latar dan teks akan saling menimpa, dan kegagalannya muncul sebagai warna yang salah di halaman publik — jauh dari tempat perubahannya dilakukan. Melingkupinya membuat kedua gaya hidup berdampingan tanpa saling tahu, sesuai niat spesifikasi bahwa admin boleh tampil berbeda.

*Alternatif:* menerima token global shadcn dan menamai ulang token publik — ditolak; mengubah change yang sudah direncanakan demi kenyamanan change ini.

### Halaman admin tidak di-cache

Setiap route admin dirender dinamis dan responsnya diberi header yang melarang penyimpanan di cache peramban.

*Mengapa:* halaman admin menampilkan data langsung termasuk draf, dan spesifikasi mensyaratkan konten admin tidak muncul lewat tombol kembali setelah logout. Membaca cookie sudah membuat route keluar dari cache statis, tetapi header larangan cache itulah yang menutup kasus tombol kembali.

### Isi kiriman pengunjung dirender sebagai teks

Nama, subjek, isi pesan, dan komentar rating dirender sebagai teks biasa, dan tidak ada tempat di dashboard yang menyisipkan HTML dari nilai-nilai itu.

*Mengapa:* ini satu-satunya data di seluruh sistem yang kelak berasal dari orang luar. Dashboard adalah tempat data itu dibaca, jadi keputusan untuk tidak pernah merendernya sebagai markup diambil sekarang, sebelum form publiknya ada dan sebelum ada godaan menampilkan tautan yang dapat diklik.

## Risks / Trade-offs

- **RLS mengizinkan setiap pengguna terautentikasi menulis apa pun; allowlist email hanya ada di lapisan aplikasi** → siapa pun yang memegang kredensial pengguna Supabase di proyek ini dapat menulis langsung lewat API Supabase tanpa melewati dashboard. Mitigasinya berlapis: signup dinonaktifkan sehingga tidak ada pengguna lain yang bisa dibuat, langkah itu didokumentasikan di README sebagai syarat, dan tidak ada halaman registrasi. Jika kelak dibutuhkan pengguna Supabase untuk tujuan lain, policy `authenticated` harus dipersempit lebih dulu menjadi pemeriksaan klaim email di dalam RLS — catat ini sebagai syarat, bukan saran.
- **`ADMIN_EMAIL` yang salah diberi awalan `NEXT_PUBLIC_` akan membocorkan allowlist ke peramban** → nama variabel tanpa awalan itu divalidasi di `lib/env.ts`, dan README menyebut alasannya agar tidak "diperbaiki" oleh orang berikutnya.
- **Tanpa pengujian otomatis, jalur tulis diverifikasi manual** → ini titik terlemah rencana ini, dan risikonya lebih besar daripada di change sebelumnya karena sekarang ada mutasi, unggahan, dan penghapusan berkas. Mitigasi yang ada: `supabase/tests/admin_checks.sql` untuk fungsi pengurutan dan nilai bawaan kolom pesan, daftar periksa verifikasi yang menelusuri delapan berkas spesifikasi, dan pembungkus aksi tunggal yang membuat permukaan yang perlu diperiksa jauh lebih kecil. Rekomendasi: tambahkan pengujian otomatis bersama change form kontak publik, saat input dari orang luar mulai masuk.
- **Berkas tak terpakai dapat menumpuk di Storage bila penghapusan gagal setelah penyimpanan berhasil** → konsekuensi yang disengaja dari urutan unggah-simpan-hapus; menyisakan berkas lebih baik daripada gambar rusak di halaman publik. Kegagalan dicatat di server agar bisa dibersihkan belakangan.
- **Dashboard mengandalkan `setup-portfolio-public-site` yang belum ada** → setiap task di sini menyebut apa yang diasumsikan sudah tersedia, dan change ini harus diimplementasi serta diarsipkan setelah change itu agar delta `portfolio-content-model` punya spec induk untuk digabung.
- **Membuka pesan menandainya dibaca, sehingga hitungan dapat berubah tanpa niat** → disengaja dan sesuai spesifikasi, diimbangi dengan aksi menandai kembali belum dibaca.
- **Daftar yang panjang dirender tanpa pagination** → untuk satu portofolio pribadi jumlah barisnya kecil, jadi pagination ditunda. Inbox pesan adalah tabel yang paling mungkin tumbuh; lihat Open Questions.
- **Fungsi pengurutan menerima nama tabel sebagai parameter** → dinamis secara sengaja agar tidak ada enam fungsi yang hampir identik, tetapi nama tabel divalidasi terhadap allowlist di dalam fungsi dan disisipkan sebagai identifier, bukan dirangkai sebagai teks mentah.

## Migration Plan

Change ini menyentuh database satu kali dan menambah dua langkah manual di Supabase yang tidak dapat dilakukan dari kode.

1. Pada proyek Supabase: matikan signup di pengaturan Auth, lalu buat satu pengguna admin secara manual beserta passwordnya.
2. Tambahkan `ADMIN_EMAIL` ke `.env.local` dan ke environment variable Vercel, bernilai email pengguna tersebut.
3. Terapkan migrasi baru: kolom tabel `messages` beserta penanda sudah dibaca dan nilai bawaannya, fungsi pengurutan, dan normalisasi `sort_order` satu kali.
4. Hasilkan ulang `lib/database.types.ts` agar kolom baru ikut bertipe.
5. Jalankan `supabase/tests/rls_checks.sql` dan `admin_checks.sql`; lanjut hanya jika semuanya lulus.
6. Telusuri daftar periksa verifikasi: login, setiap jalur CRUD, unggah dan ganti berkas, pengurutan, toggle terbit, inbox, moderasi rating, dan logout.
7. Deploy, lalu verifikasi di produksi bahwa `/admin` mengalihkan ke login saat belum ada sesi.

**Rollback:** mengembalikan deployment Vercel ke versi sebelumnya akan menghilangkan dashboard dan membuat halaman publik kembali sepenuhnya baca-saja; kolom tambahan pada `messages` dan fungsi pengurutan tidak mengganggu halaman publik, jadi keduanya boleh ditinggal. Jika skema perlu dikembalikan, migrasi turun menghapus kolom dan fungsi itu — tetapi lakukan hanya bila belum ada pesan sungguhan yang masuk, karena menghapus kolom akan menghapus datanya.

## Open Questions

- Ambang jumlah pesan yang membuat inbox perlu pagination. Tidak mengubah skema maupun task; penambahan pagination nanti bersifat lokal pada satu halaman.
- Apakah login perlu pembatasan laju tambahan di atas yang sudah disediakan Supabase Auth. Dapat diputuskan setelah melihat apakah halaman login pernah disasar sama sekali.
- Apakah berkas tak terpakai di Storage perlu pembersihan terjadwal, atau cukup dibersihkan manual bila kegagalan penghapusan memang pernah tercatat di log.
