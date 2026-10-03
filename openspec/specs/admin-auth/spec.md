# admin-auth Specification

## Purpose
Memastikan hanya pemilik portofolio yang dapat mencapai dan mengubah apa pun di dashboard admin, dengan sesi yang bertahan antar kunjungan dan dapat diakhiri sendiri oleh pemiliknya.

## Requirements

### Requirement: Login admin dengan email dan password

Halaman masuk SHALL menyediakan form berisi email dan password yang mengautentikasi lewat Supabase Auth. Autentikasinya SHALL dikerjakan di server dalam satu permintaan yang sekaligus menulis cookie sesi dan mengeluarkan pengalihan. Kredensial yang benar SHALL membuat sesi dan mengarahkan ke dashboard. Kredensial yang salah SHALL menampilkan pesan error berbahasa Indonesia tanpa menyebutkan apakah yang salah adalah emailnya atau passwordnya, dan password SHALL tidak pernah ikut terkirim kembali ke form. Field password SHALL dikosongkan setiap kali gagal, dan isian email SHALL dipertahankan.

Klien autentikasi Supabase SHALL TIDAK dikirim ke bundel peramban.

#### Scenario: Login berhasil

- **WHEN** admin mengirim email dan password yang benar
- **THEN** sesi dibuat dan admin diarahkan ke halaman ringkasan dashboard

#### Scenario: Kredensial salah

- **WHEN** email atau password yang dikirim salah
- **THEN** halaman masuk menampilkan pesan error berbahasa Indonesia yang tidak membocorkan email mana yang terdaftar, dan field password dikosongkan

#### Scenario: Field kosong

- **WHEN** form masuk dikirim dengan email atau password kosong
- **THEN** pesan validasi berbahasa Indonesia muncul pada field yang bersangkutan dan tidak ada permintaan autentikasi yang dikirim

#### Scenario: Pembatasan percobaan login

- **WHEN** beberapa percobaan login gagal berurutan dari klien yang sama
- **THEN** pesan error tetap generik dan tidak ada informasi tambahan tentang keberadaan akun yang terungkap

#### Scenario: Sesi langsung terbaca setelah masuk

- **WHEN** admin berhasil masuk
- **THEN** ia langsung diantar ke halaman admin tujuannya tanpa pernah terpantul kembali ke beranda, karena cookie sesinya ikut di respons yang sama dengan pengalihannya

#### Scenario: Kredensial sah milik akun bukan admin

- **WHEN** seseorang masuk dengan kredensial pengguna Supabase yang sah tetapi emailnya bukan `ADMIN_EMAIL`
- **THEN** sesinya dibatalkan, pesan kegagalan yang seragam ditampilkan, dan tidak ada cookie sesi yang tertinggal di peramban

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

Dashboard SHALL menyediakan tombol logout di setiap halaman admin. Logout SHALL mengakhiri sesi, menghapus cookie sesi, dan mengarahkan ke **beranda** — bukan ke halaman masuk, supaya alamat masuk yang rahasia tidak ikut terlihat setelah keluar. Setelah logout, menekan tombol kembali peramban SHALL TIDAK menampilkan konten admin.

#### Scenario: Logout berhasil

- **WHEN** admin menekan tombol logout
- **THEN** sesinya berakhir dan ia diarahkan ke beranda

#### Scenario: Konten admin tidak kembali lewat tombol kembali

- **WHEN** admin menekan tombol kembali peramban setelah logout
- **THEN** ia tetap diarahkan ke beranda dan tidak melihat konten admin dari cache
