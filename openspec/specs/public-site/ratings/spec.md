# public-site/ratings Specification

## Purpose
Memberi portofolio bukti sosial dalam bentuk penilaian dari orang yang pernah bekerja atau berinteraksi dengan pemiliknya, dengan moderasi admin sebagai penjaga sehingga tidak ada yang tampil tanpa persetujuan.

## Requirements

### Requirement: Beranda menampilkan rata-rata rating

Beranda SHALL menampilkan rata-rata bintang dari rating yang sudah disetujui beserta jumlah rating yang dihitung. Rata-rata SHALL dihitung hanya dari rating yang sudah disetujui, dan SHALL ditampilkan dengan ketelitian yang sama setiap saat. Jumlah rating SHALL disebut secara eksplisit sehingga rata-rata dari satu rating tidak terbaca seolah mewakili banyak orang.

#### Scenario: Rata-rata ditampilkan

- **WHEN** beranda dimuat sementara ada beberapa rating yang sudah disetujui
- **THEN** rata-rata bintang dan jumlah rating yang disetujui ditampilkan

#### Scenario: Rating belum disetujui tidak ikut dihitung

- **WHEN** ada rating yang belum disetujui
- **THEN** rating itu tidak memengaruhi rata-rata maupun jumlah yang ditampilkan

#### Scenario: Belum ada rating yang disetujui

- **WHEN** beranda dimuat sementara belum ada rating yang disetujui
- **THEN** bagian rata-rata menampilkan keadaan berbahasa Indonesia yang menyatakan belum ada penilaian, bukan angka nol yang terbaca sebagai nilai buruk

#### Scenario: Rata-rata dapat diakses sebagai teks

- **WHEN** rata-rata ditampilkan sebagai ikon bintang
- **THEN** nilai dan jumlahnya juga tersedia sebagai teks bagi teknologi bantu, tidak hanya sebagai gambar bintang

### Requirement: Beranda menampilkan daftar rating yang disetujui

Beranda SHALL menampilkan daftar rating yang sudah disetujui, memuat nama pemberi rating, jumlah bintang, dan komentarnya. Rating yang belum disetujui SHALL TIDAK pernah tampil. Nama dan komentar SHALL dirender sebagai teks biasa, bukan sebagai markup.

#### Scenario: Daftar rating tampil

- **WHEN** beranda dimuat sementara ada rating yang sudah disetujui
- **THEN** setiap rating tampil dengan nama, bintang, dan komentarnya

#### Scenario: Rating belum disetujui tersembunyi

- **WHEN** daftar rating dirender sementara ada baris yang belum disetujui
- **THEN** baris itu tidak muncul di halaman publik

#### Scenario: Komentar berisi markup

- **WHEN** sebuah komentar rating memuat tag HTML atau skrip
- **THEN** isinya tampil sebagai teks apa adanya dan tidak ada markup yang dieksekusi peramban

#### Scenario: Komentar dibiarkan kosong

- **WHEN** sebuah rating yang disetujui tidak memiliki komentar
- **THEN** rating itu tetap tampil dengan nama dan bintangnya tanpa area komentar yang kosong menggantung

### Requirement: Pengunjung dapat mengirim rating

Beranda SHALL memuat form rating berisi nama, pilihan bintang satu sampai lima, dan komentar opsional. Pengiriman yang sah SHALL menyimpan rating dalam keadaan belum disetujui dan menampilkan konfirmasi berbahasa Indonesia yang menjelaskan bahwa rating akan tampil setelah ditinjau. Rating yang baru dikirim SHALL TIDAK langsung muncul di daftar maupun memengaruhi rata-rata.

#### Scenario: Rating terkirim

- **WHEN** pengunjung memilih bintang, mengisi nama, lalu menekan kirim
- **THEN** rating tersimpan sebagai belum disetujui dan konfirmasi berbahasa Indonesia menjelaskan bahwa rating akan tampil setelah ditinjau

#### Scenario: Rating baru belum terlihat

- **WHEN** pengunjung memuat ulang beranda tepat setelah mengirim rating
- **THEN** ratingnya belum tampil di daftar dan rata-rata belum berubah

#### Scenario: Bintang belum dipilih

- **WHEN** pengunjung menekan kirim tanpa memilih bintang
- **THEN** pesan error berbahasa Indonesia muncul pada pilihan bintang dan tidak ada data tersimpan

#### Scenario: Komentar dibiarkan kosong

- **WHEN** pengunjung mengirim rating tanpa komentar
- **THEN** rating tetap tersimpan

#### Scenario: Rating muncul di moderasi admin

- **WHEN** rating berhasil tersimpan dan admin membuka halaman moderasi
- **THEN** rating itu tampil sebagai menunggu persetujuan dan ikut terhitung di halaman ringkasan

### Requirement: Validasi dan pembatasan laju form rating

Form rating SHALL divalidasi dengan skema yang sama di klien dan server, dengan server sebagai penentu. Nama SHALL wajib diisi, bintang SHALL berupa bilangan bulat satu sampai lima, dan nama serta komentar SHALL dibatasi panjang maksimum. Form SHALL memakai field honeypot dan pembatasan laju per pengirim seperti form kontak.

#### Scenario: Bintang di luar rentang

- **WHEN** nilai bintang di luar satu sampai lima dikirim tanpa melewati validasi di peramban
- **THEN** server menolak pengiriman dan tidak ada rating tersimpan

#### Scenario: Nama kosong

- **WHEN** pengunjung mengirim rating tanpa nama
- **THEN** pesan error berbahasa Indonesia muncul pada field nama dan data tidak tersimpan

#### Scenario: Honeypot terisi

- **WHEN** pengiriman rating datang dengan field honeypot terisi
- **THEN** tidak ada rating tersimpan dan tanggapan yang terlihat sama seperti pengiriman berhasil

#### Scenario: Batas laju terlampaui

- **WHEN** pengirim yang sama mengirim rating melebihi batas dalam satu jendela waktu
- **THEN** pengiriman ditolak dengan pesan berbahasa Indonesia agar mencoba lagi nanti

### Requirement: Penanda di peramban mencegah pengiriman ganda

Setelah pengiriman rating berhasil, peramban pengunjung SHALL menyimpan penanda, dan kunjungan berikutnya SHALL menampilkan ucapan terima kasih sebagai ganti form. Penanda ini SHALL diperlakukan sebagai kenyamanan, bukan pembatas akses: bila penandanya tidak dapat disimpan atau dibaca, form SHALL tetap berfungsi normal, dan pembatasan laju serta moderasi admin tetap menjadi penjaga sebenarnya.

#### Scenario: Form berganti setelah mengirim

- **WHEN** pengunjung berhasil mengirim rating lalu membuka beranda lagi di peramban yang sama
- **THEN** bagian form menampilkan ucapan terima kasih berbahasa Indonesia alih-alih form kosong

#### Scenario: Penyimpanan peramban tidak tersedia

- **WHEN** penyimpanan peramban diblokir atau gagal dibaca
- **THEN** bagian rating tetap dirender dengan form yang berfungsi, tanpa error yang terlihat pengunjung

#### Scenario: Penanda bukan pembatas keamanan

- **WHEN** pengunjung menghapus penanda itu lalu mengirim rating lagi
- **THEN** pengiriman diperlakukan seperti pengiriman biasa, tetap tunduk pada pembatasan laju, dan tetap masuk sebagai belum disetujui

### Requirement: Rating yang disetujui langsung tampil setelah dimoderasi

Menyetujui sebuah rating di dashboard SHALL membuat rating itu dan rata-rata yang baru tampil di beranda tanpa menunggu periode revalidasi berkala. Mencabut persetujuan atau menghapus rating SHALL mengeluarkannya dari beranda dengan cara yang sama.

#### Scenario: Rating disetujui

- **WHEN** admin menyetujui sebuah rating lalu beranda diminta
- **THEN** rating itu sudah tampil di daftar dan rata-rata sudah memperhitungkannya

#### Scenario: Persetujuan dicabut

- **WHEN** admin mencabut persetujuan sebuah rating lalu beranda diminta
- **THEN** rating itu sudah tidak tampil dan rata-rata sudah tidak memperhitungkannya

#### Scenario: Rating dihapus

- **WHEN** admin menghapus sebuah rating yang sudah disetujui lalu beranda diminta
- **THEN** rating itu sudah tidak tampil dan rata-rata sudah menyesuaikan
