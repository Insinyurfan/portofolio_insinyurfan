## Purpose

Memberi tahu pemilik portofolio bahwa ada pesan baru tanpa ia harus membuka dashboard, sambil memastikan layanan email yang bermasalah tidak pernah merusak pengalaman pengunjung yang mengirim pesan.

## ADDED Requirements

### Requirement: Email pemberitahuan dikirim saat pesan baru masuk

Setelah pesan dari form kontak berhasil tersimpan, sistem SHALL mengirim satu email pemberitahuan ke alamat admin yang dikonfigurasi. Email SHALL memuat nama pengirim, alamat email pengirim, subjek bila ada, isi pesan, dan waktu masuknya. Email SHALL dikirim tepat satu kali per pesan.

#### Scenario: Pemberitahuan terkirim

- **WHEN** sebuah pesan dari form kontak berhasil tersimpan
- **THEN** satu email terkirim ke alamat admin memuat nama pengirim, email pengirim, subjek bila ada, isi pesan, dan waktu masuk

#### Scenario: Tidak ada email untuk pengiriman yang ditolak

- **WHEN** pengiriman ditolak karena validasi, honeypot terisi, atau batas laju terlampaui
- **THEN** tidak ada email yang terkirim

#### Scenario: Satu pesan satu email

- **WHEN** satu pesan tersimpan
- **THEN** tepat satu email terkirim, tidak terduplikasi walaupun pengunjung menekan kirim berulang kali pada permintaan yang sama

### Requirement: Membalas email mengarah ke pengirim

Email pemberitahuan SHALL diatur sehingga menekan balas di aplikasi email admin mengarah ke alamat email pengirim pesan, bukan ke alamat pengirim teknis layanan email.

#### Scenario: Admin membalas pesan

- **WHEN** admin menekan balas pada email pemberitahuan
- **THEN** alamat tujuan terisi alamat email pengirim pesan

### Requirement: Kegagalan email tidak merusak alur pengunjung

Kegagalan pengiriman email SHALL TIDAK membatalkan penyimpanan pesan, SHALL TIDAK memunculkan error kepada pengunjung, dan SHALL TIDAK mengubah konfirmasi yang dilihat pengunjung. Kegagalan SHALL dicatat di server agar dapat ditelusuri.

#### Scenario: Layanan email sedang gagal

- **WHEN** pesan berhasil tersimpan tetapi pengiriman email gagal
- **THEN** pengunjung tetap melihat konfirmasi keberhasilan yang sama, pesan tetap ada di inbox admin, dan kegagalan tercatat di log server

#### Scenario: Layanan email lambat

- **WHEN** layanan email lambat menjawab
- **THEN** pengunjung tidak menunggu lebih lama daripada batas yang wajar untuk melihat konfirmasinya

### Requirement: Pemberitahuan email dapat dimatikan lewat konfigurasi

Jika kredensial layanan email tidak dikonfigurasi, form kontak SHALL tetap berfungsi penuh dan pengiriman email SHALL dilewati tanpa error. Ketidakhadiran konfigurasi email SHALL dicatat sekali sebagai keterangan, bukan diperlakukan sebagai kegagalan.

#### Scenario: Kredensial email tidak diisi

- **WHEN** aplikasi dijalankan tanpa kredensial layanan email dan pengunjung mengirim pesan
- **THEN** pesan tersimpan, pengunjung melihat konfirmasi, tidak ada email terkirim, dan tidak ada error yang terlihat

#### Scenario: Konfigurasi email tidak boleh publik

- **WHEN** variabel lingkungan untuk layanan email diperiksa
- **THEN** tidak ada di antaranya yang berawalan yang membuatnya ikut terkirim ke bundel peramban

### Requirement: Isi pesan pengunjung diperlakukan sebagai teks di dalam email

Nama, subjek, dan isi pesan yang berasal dari pengunjung SHALL disisipkan ke email sebagai teks, tidak sebagai markup yang dapat dieksekusi, dan SHALL TIDAK dipakai untuk menyusun baris header email.

#### Scenario: Isi pesan memuat markup

- **WHEN** isi pesan memuat tag HTML atau skrip
- **THEN** email menampilkannya sebagai teks apa adanya

#### Scenario: Isi pesan memuat baris baru yang mencurigakan

- **WHEN** nama atau subjek memuat karakter baris baru atau pola yang menyerupai header email
- **THEN** nilai itu dibersihkan atau ditolak sehingga tidak menjadi header tambahan pada email yang terkirim
