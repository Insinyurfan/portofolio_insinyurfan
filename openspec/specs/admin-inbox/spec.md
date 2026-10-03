# admin-inbox Specification

## Purpose
Memberi admin tempat membaca pesan yang masuk dan memutuskan rating mana yang layak tampil, sehingga kedua tabel yang sudah disiapkan punya pengelola begitu form publiknya nanti dibuat.

## Requirements

### Requirement: Inbox pesan menampilkan pesan yang masuk

Dashboard SHALL menyediakan halaman inbox yang mendaftar seluruh pesan, terbaru lebih dulu, menampilkan nama pengirim, email, subjek bila ada, waktu masuk, dan status sudah atau belum dibaca. Pesan yang belum dibaca SHALL terbedakan secara visual dari pesan yang sudah dibaca. Isi pesan SHALL dapat dibaca penuh dari halaman ini.

#### Scenario: Daftar pesan

- **WHEN** admin membuka halaman inbox sementara ada beberapa pesan
- **THEN** pesan terdaftar dengan yang terbaru di atas, masing-masing menampilkan nama pengirim, email, waktu masuk, dan status dibaca

#### Scenario: Membaca isi pesan

- **WHEN** admin membuka sebuah pesan
- **THEN** isi lengkap pesan ditampilkan, termasuk baris baru sebagaimana dikirim

#### Scenario: Pesan belum dibaca dibedakan

- **WHEN** inbox memuat campuran pesan sudah dan belum dibaca
- **THEN** pesan belum dibaca terbedakan secara visual, dan perbedaannya tidak hanya bergantung pada warna

#### Scenario: Inbox kosong

- **WHEN** admin membuka inbox sementara belum ada pesan
- **THEN** halaman menampilkan empty state berbahasa Indonesia dan dirender tanpa error

### Requirement: Status dibaca pada pesan dapat diubah admin

Admin SHALL dapat menandai sebuah pesan sudah dibaca dan menandainya kembali belum dibaca. Membuka isi sebuah pesan yang belum dibaca SHALL menandainya sudah dibaca. Setiap perubahan status SHALL tercermin pada hitungan pesan belum dibaca di halaman ringkasan.

#### Scenario: Membuka pesan menandainya dibaca

- **WHEN** admin membuka pesan yang belum dibaca
- **THEN** pesan itu ditandai sudah dibaca dan hitungan pesan belum dibaca berkurang satu

#### Scenario: Menandai kembali belum dibaca

- **WHEN** admin menandai sebuah pesan yang sudah dibaca menjadi belum dibaca
- **THEN** status pesan berubah dan hitungan pesan belum dibaca bertambah satu

#### Scenario: Pesan yang sudah dibaca tidak berubah status saat dibuka ulang

- **WHEN** admin membuka kembali pesan yang sudah ditandai dibaca
- **THEN** statusnya tetap sudah dibaca dan hitungan tidak berubah

### Requirement: Pesan dapat dihapus

Admin SHALL dapat menghapus sebuah pesan setelah mengonfirmasi. Pesan yang terhapus SHALL hilang dari inbox dan dari hitungan di halaman ringkasan.

#### Scenario: Menghapus pesan

- **WHEN** admin menghapus sebuah pesan dan mengonfirmasinya
- **THEN** pesan hilang dari inbox dan toast keberhasilan muncul

#### Scenario: Menghapus pesan belum dibaca

- **WHEN** admin menghapus pesan yang masih berstatus belum dibaca
- **THEN** hitungan pesan belum dibaca di halaman ringkasan berkurang satu

### Requirement: Moderasi rating

Dashboard SHALL menyediakan halaman moderasi yang mendaftar seluruh rating beserta nama, jumlah bintang, komentar, waktu masuk, dan status persetujuan, dengan rating yang menunggu persetujuan ditampilkan lebih dulu. Admin SHALL dapat menyetujui sebuah rating, mencabut persetujuan yang sudah diberikan, dan menghapus rating setelah konfirmasi.

#### Scenario: Rating menunggu persetujuan tampil lebih dulu

- **WHEN** admin membuka halaman moderasi rating
- **THEN** rating yang belum disetujui ditampilkan di bagian atas daftar

#### Scenario: Menyetujui rating

- **WHEN** admin menyetujui sebuah rating yang menunggu
- **THEN** status rating berubah menjadi disetujui, toast keberhasilan muncul, dan hitungan rating menunggu persetujuan berkurang satu

#### Scenario: Mencabut persetujuan

- **WHEN** admin mencabut persetujuan sebuah rating yang sudah disetujui
- **THEN** rating kembali berstatus menunggu dan hitungan di halaman ringkasan bertambah satu

#### Scenario: Menghapus rating

- **WHEN** admin menghapus sebuah rating dan mengonfirmasinya
- **THEN** rating hilang dari daftar dan dari hitungan

#### Scenario: Belum ada rating

- **WHEN** admin membuka halaman moderasi sementara belum ada rating
- **THEN** halaman menampilkan empty state berbahasa Indonesia dan dirender tanpa error

### Requirement: Isi kiriman pengunjung ditampilkan sebagai teks, bukan markup

Nama, subjek, isi pesan, dan komentar rating berasal dari pengunjung, sehingga dashboard SHALL menampilkannya sebagai teks biasa dan SHALL TIDAK merendernya sebagai HTML atau markup yang dapat dieksekusi.

#### Scenario: Isi berisi markup

- **WHEN** sebuah pesan atau komentar rating memuat tag HTML atau skrip
- **THEN** isinya tampil sebagai teks apa adanya dan tidak ada markup yang dieksekusi oleh peramban

#### Scenario: Tautan di dalam isi pesan

- **WHEN** isi pesan memuat alamat web
- **THEN** alamat itu tampil sebagai teks dan tidak menjadi tautan yang dapat diklik tanpa disengaja

### Requirement: Pesan dan rating berasal dari kiriman pengunjung

Halaman publik SHALL memuat form kontak dan form rating, dan SHALL menampilkan rating yang sudah disetujui. Pesan dan rating yang dikelola di dashboard SHALL berasal dari kiriman pengunjung lewat form tersebut. Halaman publik SHALL TIDAK menampilkan isi pesan apa pun, maupun rating yang belum disetujui.

#### Scenario: Kiriman pengunjung muncul di dashboard

- **WHEN** pengunjung mengirim pesan lewat form kontak
- **THEN** pesan itu muncul di inbox admin sebagai belum dibaca dan ikut terhitung di halaman ringkasan

#### Scenario: Rating menunggu moderasi

- **WHEN** pengunjung mengirim rating
- **THEN** rating itu muncul di halaman moderasi sebagai menunggu persetujuan dan belum tampil di halaman publik

#### Scenario: Pesan tidak pernah tampil publik

- **WHEN** halaman publik mana pun dibuka
- **THEN** tidak ada isi pesan yang ditampilkan, dan rating yang belum disetujui juga tidak ditampilkan
