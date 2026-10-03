## Purpose

Memberi pemilik portofolio satu halaman pertama setelah login yang menunjukkan keadaan isi portofolionya dan apa yang menunggu perhatiannya.

## ADDED Requirements

### Requirement: Halaman ringkasan menampilkan hitungan utama

Halaman ringkasan admin SHALL menampilkan jumlah proyek, jumlah pesan yang belum dibaca, dan jumlah rating yang belum disetujui. Hitungan jumlah proyek SHALL memisahkan proyek yang terbit dari yang belum terbit, karena admin melihat keduanya. Setiap hitungan SHALL dihitung dari database saat halaman diminta, bukan dari nilai yang disimpan terpisah.

#### Scenario: Hitungan ditampilkan

- **WHEN** admin membuka halaman ringkasan
- **THEN** jumlah proyek, pesan belum dibaca, dan rating menunggu persetujuan ditampilkan sesuai keadaan database saat itu

#### Scenario: Proyek terbit dan belum terbit dibedakan

- **WHEN** ada proyek yang terbit dan proyek yang belum terbit
- **THEN** hitungan proyek menunjukkan keduanya secara terpisah, bukan hanya satu angka gabungan

#### Scenario: Hitungan mencerminkan perubahan

- **WHEN** admin menandai sebuah pesan sudah dibaca lalu kembali ke halaman ringkasan
- **THEN** hitungan pesan belum dibaca sudah berkurang

### Requirement: Hitungan nol ditampilkan sebagai keadaan tenang

Ketika sebuah hitungan bernilai nol, halaman ringkasan SHALL menampilkan angka nol beserta keterangan berbahasa Indonesia yang menyatakan tidak ada yang perlu ditindaklanjuti, bukan kartu kosong tanpa penjelasan.

#### Scenario: Tidak ada pesan belum dibaca

- **WHEN** semua pesan sudah ditandai dibaca
- **THEN** kartu pesan menunjukkan nol dengan keterangan bahwa tidak ada pesan baru

#### Scenario: Database masih kosong

- **WHEN** admin membuka halaman ringkasan sementara belum ada konten sama sekali
- **THEN** semua hitungan menunjukkan nol, halaman dirender tanpa error, dan tersedia arahan untuk mulai mengisi konten

### Requirement: Ringkasan menautkan ke bagian yang relevan

Setiap kartu hitungan SHALL menautkan ke halaman pengelolaan yang sesuai, sehingga admin dapat langsung menindaklanjuti apa yang dilihatnya.

#### Scenario: Menindaklanjuti dari ringkasan

- **WHEN** admin menekan kartu pesan belum dibaca
- **THEN** ia dibawa ke halaman inbox pesan

#### Scenario: Menindaklanjuti rating

- **WHEN** admin menekan kartu rating menunggu persetujuan
- **THEN** ia dibawa ke halaman moderasi rating
