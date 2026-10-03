## MODIFIED Requirements

### Requirement: Seluruh route admin diproteksi

Setiap route di bawah `/admin` SHALL hanya dapat diakses oleh sesi admin yang sah. Permintaan tanpa sesi yang sah SHALL diarahkan ke **beranda**, bukan ke halaman masuk, dan `/admin/login` SHALL TIDAK dapat dibuka langsung. Halaman masuk SHALL dilayani di satu alamat rahasia yang ditentukan lewat variabel lingkungan `ADMIN_LOGIN_PATH`, yang SHALL TIDAK berawalan `NEXT_PUBLIC_`. Proteksi SHALL berlaku untuk permintaan halaman maupun untuk setiap aksi tulis, sehingga aksi tulis tidak dapat dipanggil langsung tanpa sesi yang sah.

Penyembunyian alamat ini SHALL dinyatakan di dokumentasi sebagai pengurang kebisingan bot, BUKAN sebagai batas keamanan. Batas keamanan yang sebenarnya SHALL tetap berupa pemeriksaan sesi di proxy dan pemeriksaan ulang di dalam setiap aksi tulis.

#### Scenario: Pengunjung tanpa sesi ditolak

- **WHEN** pengunjung tanpa sesi membuka route admin mana pun
- **THEN** ia diarahkan ke beranda, tidak ada konten admin yang terkirim, dan tidak ada form masuk yang terlihat

#### Scenario: Halaman masuk tidak dapat dibuka lewat alamat aslinya

- **WHEN** siapa pun membuka `/admin/login` secara langsung
- **THEN** ia diarahkan ke beranda, baik sedang punya sesi maupun tidak

#### Scenario: Halaman masuk tersedia di alamat rahasia

- **WHEN** pemilik membuka alamat yang diatur di `ADMIN_LOGIN_PATH`
- **THEN** form masuk ditampilkan, dan alamat di bilah alamat tetap alamat rahasianya

#### Scenario: Aksi tulis tanpa sesi ditolak

- **WHEN** sebuah aksi tulis admin dipanggil tanpa sesi yang sah
- **THEN** aksi tersebut ditolak dan tidak ada perubahan data yang terjadi

#### Scenario: Admin yang sudah login tidak perlu login lagi

- **WHEN** admin dengan sesi sah membuka alamat masuk rahasia
- **THEN** ia diarahkan ke halaman ringkasan dashboard, bukan ditampilkan form masuk

#### Scenario: Diarahkan kembali ke tujuan semula

- **WHEN** pengunjung tanpa sesi membuka route admin tertentu lalu berhasil masuk lewat alamat rahasia
- **THEN** ia diarahkan ke route yang semula dituju, bukan selalu ke halaman ringkasan

#### Scenario: Tujuan semula tidak terlihat di bilah alamat

- **WHEN** pengunjung tanpa sesi membuka route admin tertentu dan diarahkan ke beranda
- **THEN** alamat route admin itu tidak muncul sebagai parameter di bilah alamat, dan diingat lewat cookie `httpOnly` berumur pendek yang hanya menerima path di bawah `/admin`

#### Scenario: Tujuan tidak tertimpa oleh prefetch

- **WHEN** peramban melakukan prefetch atau permintaan RSC ke route admin tanpa sesi yang sah
- **THEN** tujuan yang sudah tersimpan tidak berubah, dan hanya navigasi halaman sungguhan yang menyetelnya

### Requirement: Login admin dengan email dan password

Halaman masuk SHALL menerima email dan password, dan autentikasinya SHALL dikerjakan di server dalam satu permintaan yang sekaligus menulis cookie sesi dan mengeluarkan pengalihan. Pesan kegagalan SHALL selalu seragam dan SHALL TIDAK mengungkapkan apakah sebuah email terdaftar. Field password SHALL dikosongkan setiap kali gagal, dan isian email SHALL dipertahankan.

Klien autentikasi Supabase SHALL TIDAK dikirim ke bundel peramban.

#### Scenario: Sesi langsung terbaca setelah masuk

- **WHEN** admin berhasil masuk
- **THEN** ia langsung diantar ke halaman admin tujuannya tanpa pernah terpantul kembali ke beranda, karena cookie sesinya ikut di respons yang sama dengan pengalihannya

#### Scenario: Kredensial sah milik akun bukan admin

- **WHEN** seseorang masuk dengan kredensial pengguna Supabase yang sah tetapi emailnya bukan `ADMIN_EMAIL`
- **THEN** sesinya dibatalkan, pesan kegagalan yang seragam ditampilkan, dan tidak ada cookie sesi yang tertinggal di peramban

### Requirement: Logout mengakhiri sesi

Dashboard SHALL menyediakan tombol logout di setiap halaman admin. Logout SHALL mengakhiri sesi, menghapus cookie sesi, dan mengarahkan ke **beranda** — bukan ke halaman masuk, supaya alamat masuk yang rahasia tidak ikut terlihat setelah keluar. Setelah logout, menekan tombol kembali peramban SHALL TIDAK menampilkan konten admin.

#### Scenario: Logout berhasil

- **WHEN** admin menekan tombol logout
- **THEN** sesinya berakhir dan ia diarahkan ke beranda

#### Scenario: Konten admin tidak kembali lewat tombol kembali

- **WHEN** admin menekan tombol kembali peramban setelah logout
- **THEN** ia tetap diarahkan ke beranda dan tidak melihat konten admin dari cache
