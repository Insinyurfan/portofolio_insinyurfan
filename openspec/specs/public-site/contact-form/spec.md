# public-site/contact-form Specification

## Purpose
Memberi pengunjung cara menghubungi pemilik portofolio langsung dari situs, dengan penyaringan spam yang cukup untuk form publik satu halaman tanpa membebani pengunjung sungguhan.

## Requirements

### Requirement: Form kontak mengirim pesan ke pemilik

Halaman `/kontak` SHALL memuat form berisi nama, email, subjek opsional, dan isi pesan. Pengiriman yang sah SHALL menyimpan satu baris pesan dalam keadaan belum dibaca dan menampilkan konfirmasi berbahasa Indonesia kepada pengunjung. Form SHALL dikosongkan setelah pengiriman berhasil.

#### Scenario: Pesan terkirim

- **WHEN** pengunjung mengisi nama, email, dan isi pesan yang sah lalu menekan kirim
- **THEN** pesan tersimpan sebagai belum dibaca, konfirmasi berbahasa Indonesia muncul, dan field form dikosongkan

#### Scenario: Subjek dibiarkan kosong

- **WHEN** pengunjung mengirim form tanpa mengisi subjek
- **THEN** pesan tetap tersimpan dan inbox admin menampilkannya tanpa subjek

#### Scenario: Pesan muncul di dashboard

- **WHEN** pesan berhasil tersimpan dan admin membuka inbox
- **THEN** pesan itu tampil sebagai belum dibaca beserta nama, email, dan waktu masuknya

### Requirement: Validasi form kontak di klien dan server

Form kontak SHALL divalidasi dengan skema yang sama di klien dan di server, dan validasi sisi server SHALL menjadi penentu. Nama, email, dan isi pesan SHALL wajib diisi. Email SHALL berbentuk alamat email yang sah. Setiap field SHALL dibatasi panjang maksimum. Pesan error SHALL berbahasa Indonesia dan terpasang pada field yang bersangkutan, dan pengiriman yang gagal SHALL mempertahankan isi yang sudah diketik pengunjung.

#### Scenario: Field wajib kosong

- **WHEN** pengunjung mengirim form tanpa mengisi nama, email, atau isi pesan
- **THEN** pesan error berbahasa Indonesia muncul pada field itu, tidak ada data tersimpan, dan isi field lain tetap utuh

#### Scenario: Email tidak sah

- **WHEN** pengunjung memasukkan nilai yang bukan alamat email
- **THEN** field email menampilkan pesan error berbahasa Indonesia dan form tidak terkirim

#### Scenario: Isi melebihi batas panjang

- **WHEN** pengunjung mengirim nilai yang melebihi panjang maksimum sebuah field
- **THEN** pesan error menyebut batas panjangnya dan data tidak tersimpan

#### Scenario: Validasi server menjadi penentu

- **WHEN** pengiriman dengan data tidak sah dikirim tanpa melewati validasi di peramban
- **THEN** server menolak pengiriman itu dan tidak ada baris pesan yang tersimpan

#### Scenario: Spasi di ujung nilai dibuang

- **WHEN** pengunjung mengirim nilai yang diawali atau diakhiri spasi
- **THEN** nilai tersimpan tanpa spasi di ujungnya, dan nilai yang hanya berisi spasi diperlakukan sebagai kosong

### Requirement: Field honeypot menyaring pengiriman otomatis

Form SHALL memuat satu field tambahan yang disembunyikan dari pengunjung dan dari pembaca layar, tetapi tetap ada di markup. Pengiriman yang mengisi field itu SHALL ditolak tanpa menyimpan apa pun, dan SHALL tetap menampilkan konfirmasi yang sama seperti pengiriman berhasil sehingga pengirim otomatis tidak memperoleh petunjuk bahwa ia tersaring.

#### Scenario: Bot mengisi honeypot

- **WHEN** pengiriman datang dengan field honeypot terisi
- **THEN** tidak ada baris pesan tersimpan, tidak ada email terkirim, dan tanggapan yang terlihat sama seperti pengiriman berhasil

#### Scenario: Honeypot tidak mengganggu pengunjung

- **WHEN** pengunjung mengisi form dengan tetikus maupun hanya dengan keyboard, termasuk memakai pembaca layar
- **THEN** field honeypot tidak pernah menerima fokus, tidak terbaca pembaca layar, dan pengiriman berhasil

### Requirement: Pembatasan laju pengiriman form kontak

Pengiriman form kontak SHALL dibatasi jumlahnya per pengirim dalam satu jendela waktu, dengan keputusan diambil di server sebelum pesan disimpan. Pengiriman yang melebihi batas SHALL ditolak dengan pesan berbahasa Indonesia yang menjelaskan bahwa pengunjung perlu menunggu, tanpa menyimpan pesan dan tanpa mengirim email. Batas ini SHALL TIDAK bergantung pada state di memori proses.

#### Scenario: Batas terlampaui

- **WHEN** pengirim yang sama mengirim form melebihi batas dalam satu jendela waktu
- **THEN** pengiriman ditolak dengan pesan berbahasa Indonesia agar mencoba lagi nanti, dan tidak ada pesan tersimpan

#### Scenario: Batas kembali terbuka

- **WHEN** jendela waktu sudah terlampaui dan pengirim yang sama mengirim lagi
- **THEN** pengiriman diterima seperti biasa

#### Scenario: Pengirim berbeda tidak saling memengaruhi

- **WHEN** satu pengirim sudah mencapai batas sementara pengirim lain baru mengirim pertama kali
- **THEN** pengiriman pengirim kedua tetap diterima

#### Scenario: Batas bertahan antar permintaan terpisah

- **WHEN** pengiriman berurutan dilayani oleh proses server yang berbeda
- **THEN** hitungan pembatasan laju tetap akurat karena tidak disimpan di memori proses

### Requirement: Keadaan pengiriman terlihat dan tidak dapat terkirim ganda

Selama pengiriman berjalan, tombol kirim SHALL menunjukkan keadaan sedang berjalan dan tidak dapat ditekan lagi. Kegagalan tak terduga SHALL menampilkan pesan berbahasa Indonesia yang dapat ditindaklanjuti tanpa menghilangkan isi yang sudah diketik.

#### Scenario: Klik ganda tidak menggandakan pesan

- **WHEN** pengunjung menekan tombol kirim dua kali secepat mungkin
- **THEN** hanya satu pesan tersimpan

#### Scenario: Kegagalan tak terduga

- **WHEN** penyimpanan pesan gagal karena kesalahan di luar dugaan
- **THEN** pengunjung melihat pesan error berbahasa Indonesia, isi form tetap utuh, dan ia dapat mencoba lagi

### Requirement: Form kontak dapat diakses

Setiap field SHALL memiliki label yang terhubung dan dapat dibaca teknologi bantu. Pesan error SHALL dikaitkan dengan fieldnya sehingga diumumkan saat muncul. Form SHALL dapat diisi dan dikirim seluruhnya dengan keyboard, dan konfirmasi keberhasilan SHALL diumumkan ke teknologi bantu.

#### Scenario: Pengisian dengan keyboard

- **WHEN** pengunjung menelusuri form hanya dengan keyboard
- **THEN** setiap field dan tombol dapat dicapai dalam urutan logis dengan indikator fokus yang terlihat, dan form dapat dikirim tanpa tetikus

#### Scenario: Error diumumkan

- **WHEN** validasi gagal
- **THEN** pesan error terkait dengan fieldnya dan diumumkan ke teknologi bantu, dan fokus diarahkan ke field bermasalah yang pertama

#### Scenario: Konfirmasi diumumkan

- **WHEN** pengiriman berhasil
- **THEN** konfirmasi diumumkan ke teknologi bantu, bukan hanya terlihat secara visual
