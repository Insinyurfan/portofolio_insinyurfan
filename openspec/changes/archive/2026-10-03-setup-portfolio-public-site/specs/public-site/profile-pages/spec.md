## Purpose

Menetapkan perilaku halaman publik yang menyajikan riwayat dan identitas pemilik portofolio: Tentang, Pendidikan, Keahlian, Pengalaman, Pencapaian, dan Kontak.

## ADDED Requirements

### Requirement: Halaman Tentang menampilkan bio dari database

Halaman `/tentang` SHALL menampilkan bio "Tentang Saya", lokasi, dan status terbuka untuk pekerjaan dari profil, beserta foto profil. Baris baru pada bio SHALL tetap terjaga saat dirender.

#### Scenario: Bio tampil dengan paragrafnya

- **WHEN** pengunjung membuka `/tentang` sementara bio berisi beberapa paragraf
- **THEN** pemisahan paragraf terlihat sebagaimana tersimpan, tidak menjadi satu blok teks menyatu

#### Scenario: Bio belum diisi

- **WHEN** profil ada tetapi bio kosong
- **THEN** halaman dirender dengan empty state berbahasa Indonesia, bukan area kosong tanpa penjelasan

### Requirement: Halaman Pendidikan menampilkan timeline

Halaman `/pendidikan` SHALL menampilkan riwayat pendidikan terbit sebagai timeline menurut urutan tersimpan. Setiap entri SHALL menampilkan institusi, jurusan, jenjang, rentang tahun, deskripsi, dan IPK bila ada.

#### Scenario: Timeline pendidikan dirender

- **WHEN** pengunjung membuka `/pendidikan` sementara ada beberapa entri terbit
- **THEN** entri tampil sebagai timeline menurut urutan tersimpan, masing-masing dengan institusi, jurusan, jenjang, dan rentang tahun

#### Scenario: IPK tidak diisi

- **WHEN** sebuah entri pendidikan tidak memiliki IPK
- **THEN** entri dirender tanpa label IPK, tidak menampilkan nilai kosong atau nol

#### Scenario: Belum ada data pendidikan

- **WHEN** tidak ada entri pendidikan terbit
- **THEN** halaman menampilkan empty state berbahasa Indonesia dan tetap dirender dengan status sukses

### Requirement: Halaman Keahlian dikelompokkan per kategori

Halaman `/keahlian` SHALL menampilkan skill terbit yang dikelompokkan menurut kategorinya. Kategori SHALL tampil menurut urutan tersimpan dan skill di dalam tiap kategori juga menurut urutan tersimpan. Kategori yang tidak memiliki skill terbit SHALL tidak dirender.

#### Scenario: Skill dikelompokkan dan berurutan

- **WHEN** pengunjung membuka `/keahlian` sementara ada beberapa kategori berisi skill
- **THEN** setiap kategori tampil sebagai kelompok berlabel, menurut urutan tersimpan, dengan skill di dalamnya juga berurutan

#### Scenario: Kategori kosong disembunyikan

- **WHEN** sebuah kategori skill tidak memiliki skill terbit
- **THEN** kategori tersebut tidak dirender

#### Scenario: Ikon skill opsional

- **WHEN** sebuah skill tidak memiliki ikon
- **THEN** skill tetap tampil dengan namanya saja, tanpa ikon rusak atau celah kosong

### Requirement: Halaman Pengalaman menampilkan timeline dengan tipe

Halaman `/pengalaman` SHALL menampilkan pengalaman terbit sebagai timeline menurut urutan tersimpan. Setiap entri SHALL menampilkan posisi, instansi, tipe yang dapat dibaca manusia dalam bahasa Indonesia, rentang tanggal, dan deskripsi. Entri yang masih berjalan SHALL ditampilkan dengan penanda "Sekarang" sebagai ganti tanggal selesai.

#### Scenario: Pengalaman yang masih berjalan

- **WHEN** sebuah pengalaman ditandai masih berjalan
- **THEN** rentang tanggalnya berakhir dengan penanda "Sekarang" alih-alih tanggal selesai

#### Scenario: Tipe ditampilkan dalam bahasa Indonesia

- **WHEN** entri pengalaman dengan tipe berbeda dirender
- **THEN** masing-masing menampilkan label bahasa Indonesia yang sesuai untuk kerja, magang, organisasi, atau freelance, bukan nilai mentah dari database

#### Scenario: Belum ada data pengalaman

- **WHEN** tidak ada entri pengalaman terbit
- **THEN** halaman menampilkan empty state berbahasa Indonesia dan tetap dirender dengan status sukses

### Requirement: Halaman Pencapaian menampilkan grid dengan preview

Halaman `/pencapaian` SHALL menampilkan pencapaian terbit sebagai grid kartu yang menampilkan judul, penerbit, tanggal, kategori, dan gambar. Mengklik sebuah kartu SHALL membuka preview gambar berukuran lebih besar di atas halaman. Jika pencapaian memiliki URL verifikasi, preview SHALL menyertakan tautan verifikasi yang membuka di tab baru.

#### Scenario: Preview dibuka dan ditutup

- **WHEN** pengunjung mengklik kartu pencapaian
- **THEN** preview gambar berukuran lebih besar terbuka di atas halaman, dan dapat ditutup lewat tombol tutup, tombol Escape, atau mengklik area di luar preview

#### Scenario: Preview dapat dioperasikan dengan keyboard

- **WHEN** pengunjung membuka preview hanya dengan keyboard
- **THEN** fokus berpindah ke dalam preview, tetap terkurung di dalamnya selama terbuka, dan kembali ke kartu asal setelah ditutup

#### Scenario: Tautan verifikasi

- **WHEN** sebuah pencapaian memiliki URL verifikasi dan previewnya dibuka
- **THEN** preview menampilkan tautan verifikasi yang membuka di tab baru

#### Scenario: Belum ada data pencapaian

- **WHEN** tidak ada pencapaian terbit
- **THEN** halaman menampilkan empty state berbahasa Indonesia dan tetap dirender dengan status sukses

### Requirement: Halaman Kontak menampilkan informasi tanpa form

Halaman `/kontak` SHALL menampilkan email pemilik sebagai tautan `mailto`, lokasi, status terbuka untuk pekerjaan, dan tautan sosial media terbit. Pada change ini halaman tersebut SHALL TIDAK memuat form kontak maupun kontrol yang menulis ke database.

#### Scenario: Email dapat diklik

- **WHEN** pengunjung membuka `/kontak` sementara profil memiliki email
- **THEN** email tampil sebagai tautan `mailto` yang membuka aplikasi email pengunjung

#### Scenario: Tidak ada form di change ini

- **WHEN** `/kontak` dirender
- **THEN** tidak ada form, input, maupun tombol kirim di halaman tersebut

#### Scenario: Email belum diisi

- **WHEN** profil tidak memiliki email
- **THEN** halaman dirender tanpa tautan email rusak dan tetap menampilkan informasi kontak lain yang tersedia
