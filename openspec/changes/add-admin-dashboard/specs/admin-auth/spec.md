## Purpose

Memastikan hanya pemilik portofolio yang dapat mencapai dan mengubah apa pun di dashboard admin, dengan sesi yang bertahan antar kunjungan dan dapat diakhiri sendiri oleh pemiliknya.

## ADDED Requirements

### Requirement: Login admin dengan email dan password

Halaman `/admin/login` SHALL menyediakan form berisi email dan password yang mengautentikasi lewat Supabase Auth. Kredensial yang benar SHALL membuat sesi dan mengarahkan ke dashboard. Kredensial yang salah SHALL menampilkan pesan error berbahasa Indonesia tanpa menyebutkan apakah yang salah adalah emailnya atau passwordnya, dan password SHALL tidak pernah ikut terkirim kembali ke form.

#### Scenario: Login berhasil

- **WHEN** admin mengirim email dan password yang benar
- **THEN** sesi dibuat dan admin diarahkan ke halaman ringkasan dashboard

#### Scenario: Kredensial salah

- **WHEN** email atau password yang dikirim salah
- **THEN** halaman login menampilkan pesan error berbahasa Indonesia yang tidak membocorkan email mana yang terdaftar, dan field password dikosongkan

#### Scenario: Field kosong

- **WHEN** form login dikirim dengan email atau password kosong
- **THEN** pesan validasi berbahasa Indonesia muncul pada field yang bersangkutan dan tidak ada permintaan autentikasi yang dikirim

#### Scenario: Pembatasan percobaan login

- **WHEN** beberapa percobaan login gagal berurutan dari klien yang sama
- **THEN** pesan error tetap generik dan tidak ada informasi tambahan tentang keberadaan akun yang terungkap

### Requirement: Seluruh route admin diproteksi

Setiap route di bawah `/admin` kecuali halaman login SHALL hanya dapat diakses oleh sesi admin yang sah. Permintaan tanpa sesi yang sah SHALL diarahkan ke `/admin/login`. Proteksi SHALL berlaku untuk permintaan halaman maupun untuk setiap aksi tulis, sehingga aksi tulis tidak dapat dipanggil langsung tanpa sesi yang sah.

#### Scenario: Pengunjung tanpa sesi ditolak

- **WHEN** pengunjung tanpa sesi membuka route admin mana pun selain halaman login
- **THEN** ia diarahkan ke `/admin/login` dan tidak ada konten admin yang terkirim

#### Scenario: Aksi tulis tanpa sesi ditolak

- **WHEN** sebuah aksi tulis admin dipanggil tanpa sesi yang sah
- **THEN** aksi tersebut ditolak dan tidak ada perubahan data yang terjadi

#### Scenario: Admin yang sudah login tidak perlu login lagi

- **WHEN** admin dengan sesi sah membuka `/admin/login`
- **THEN** ia diarahkan ke halaman ringkasan dashboard, bukan ditampilkan form login

#### Scenario: Diarahkan kembali ke tujuan semula

- **WHEN** pengunjung tanpa sesi membuka route admin tertentu lalu berhasil login
- **THEN** ia diarahkan ke route yang semula dituju, bukan selalu ke halaman ringkasan

### Requirement: Hanya satu akun admin yang diizinkan

Sistem SHALL menolak sesi apa pun yang emailnya tidak cocok dengan email admin yang dikonfigurasi, baik pada permintaan halaman maupun pada aksi tulis, walaupun sesi itu adalah sesi Supabase Auth yang sah. Sistem SHALL TIDAK menyediakan halaman atau alur registrasi, pendaftaran mandiri, maupun undangan pengguna.

#### Scenario: Pengguna terautentikasi lain ditolak

- **WHEN** pengguna Supabase yang sah tetapi emailnya bukan email admin terkonfigurasi membuka route admin
- **THEN** akses ditolak dan ia tidak melihat konten admin

#### Scenario: Aksi tulis dari non-admin ditolak

- **WHEN** aksi tulis admin dipanggil oleh sesi yang emailnya bukan email admin terkonfigurasi
- **THEN** aksi ditolak dan tidak ada perubahan data yang terjadi

#### Scenario: Tidak ada jalur registrasi

- **WHEN** route di bawah `/admin` ditelusuri
- **THEN** tidak ditemukan halaman registrasi, pendaftaran, maupun pemulihan akun mandiri

#### Scenario: Email admin belum dikonfigurasi

- **WHEN** aplikasi dijalankan tanpa variabel lingkungan email admin
- **THEN** aplikasi gagal dengan pesan yang menyebut nama variabel itu, bukan membuka akses bagi setiap pengguna terautentikasi

### Requirement: Sesi bertahan dan diperbarui otomatis

Sesi admin SHALL disimpan sebagai cookie dan SHALL tetap sah setelah halaman dimuat ulang maupun peramban ditutup lalu dibuka kembali, sampai masa berlakunya habis atau admin logout. Token yang mendekati kedaluwarsa SHALL diperbarui otomatis saat permintaan masuk sehingga admin tidak terlempar keluar di tengah pekerjaan.

#### Scenario: Sesi bertahan setelah muat ulang

- **WHEN** admin yang sudah login memuat ulang halaman admin
- **THEN** ia tetap login dan halaman dirender tanpa kembali ke form login

#### Scenario: Token diperbarui saat mendekati kedaluwarsa

- **WHEN** admin membuka halaman admin sementara tokennya sudah mendekati waktu kedaluwarsa
- **THEN** sesi diperbarui dan permintaan berhasil tanpa mengharuskan login ulang

#### Scenario: Sesi kedaluwarsa di tengah pekerjaan

- **WHEN** sesi admin sudah kedaluwarsa dan ia mengirim sebuah aksi tulis
- **THEN** aksi ditolak dengan pesan berbahasa Indonesia yang menjelaskan sesi berakhir, dan ia diarahkan untuk login kembali tanpa kehilangan isi form

### Requirement: Logout mengakhiri sesi

Dashboard SHALL menyediakan tombol logout di setiap halaman admin. Logout SHALL mengakhiri sesi, menghapus cookie sesi, dan mengarahkan ke `/admin/login`. Setelah logout, menekan tombol kembali peramban SHALL TIDAK menampilkan konten admin.

#### Scenario: Logout berhasil

- **WHEN** admin menekan tombol logout
- **THEN** sesinya berakhir dan ia diarahkan ke `/admin/login`

#### Scenario: Konten admin tidak kembali lewat tombol kembali

- **WHEN** admin menekan tombol kembali peramban setelah logout
- **THEN** ia tetap diarahkan ke halaman login dan tidak melihat konten admin dari cache
